// The lab's deterministic machinery: money, steers, search, replication, the
// publishing gate, and three whole nights end to end against kinocomputing's
// real build. Nothing here calls a model or the network — the agent's part
// is played by a script.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { allowance, frontMatter, KINO, LAB } from "../tools/lib.mjs";
import { takeSteers } from "../tools/steers.mjs";
import { renderNote } from "../tools/render.mjs";
import { arxivQuery, exaLeft, parseArxiv, parseExa, parseOpenAlex, search, unInvert } from "../tools/search.mjs";
import { replicateAll } from "../tools/replicate.mjs";

const BUDGET = { daily_usd: 1.5, bank_cap_usd: 10, light_run_max_usd: 1.5, deep_run_threshold_usd: 6, deep_run_max_usd: 6, min_run_usd: 0.1 };
const KINO_ORIGIN = "https://www.kinocomputing.com/";

test("budget: the allowance banks unspent days, caps, and buys a deep run when it has saved enough", () => {
  assert.deepEqual(allowance(BUDGET, [], "2026-11-21", "2026-11-21"), { bank: 1.5, kind: "light", maxUsd: 1.5, skip: false });
  const quietWeek = allowance(BUDGET, [], "2026-11-25", "2026-11-21");
  assert.equal(quietWeek.bank, 7.5);
  assert.equal(quietWeek.kind, "deep");
  assert.equal(quietWeek.maxUsd, 6);
  assert.equal(allowance(BUDGET, [], "2026-12-31", "2026-11-21").bank, 10, "the bank stops at its cap");
  const spent = allowance(BUDGET, [{ date: "2026-11-21", usd: 1.45 }], "2026-11-21", "2026-11-21");
  assert.equal(spent.skip, true, "five cents left isn't worth a run");
  const overspent = allowance(BUDGET, [{ date: "2026-11-21", usd: 3 }], "2026-11-22", "2026-11-21");
  assert.equal(overspent.bank, 0, "an overrun is paid back from later days");
  const both = allowance(BUDGET, [{ date: "2026-11-21", usd: 1, source: "model" }, { date: "2026-11-21", usd: 0.4, source: "exa" }], "2026-11-21", "2026-11-21");
  assert.equal(both.bank, 0.1, "model and Exa spend come out of one bank");
  const local = allowance(BUDGET, [{ date: "2026-11-21", usd: 1, account: "local" }], "2026-11-21", "2026-11-21");
  assert.equal(local.bank, 1.5, "a shift run locally isn't billed to the lab's bank");
});

test("front matter: strings, booleans, integers, and a value that only starts and ends with quotes", () => {
  const { data, body } = frontMatter("---\nkind: experiment\npin: true\npriority: 2\nchange_note: \"fixed: the seed\"\nwatch: \"a b\" OR \"c d\"\n---\n\nBody");
  assert.deepEqual(data, { kind: "experiment", pin: true, priority: 2, change_note: "fixed: the seed", watch: '"a b" OR "c d"' });
  assert.equal(body.trim(), "Body");
});

test("steers: the PI's takes on kinocomputing are steers; the lab's own notes and the first look aren't", async () => {
  const docs = {
    aaaaaaaaaaaaaaaaaaaaaaaaaa: { kind: "fragment", page: "a-take", content_html: '<p>Less hardware, more theory. See <a href="https://example.org/p?a=1&amp;b=2">this</a>.</p>' },
    bbbbbbbbbbbbbbbbbbbbbbbbbb: { kind: "fragment", page: "lab-note", content_html: "<p>The lab's.</p>", generated: [{ sources: [], model: "m", at: "x" }] },
    cccccccccccccccccccccccccc: { kind: "thread", page: "an-answer", content_html: "<p>No, I meant the other thing.</p>", stub_of: { origin: KINO_ORIGIN, id: "bbbbbbbbbbbbbbbbbbbbbbbbbb", version: 1 } },
    dddddddddddddddddddddddddd: { kind: "withdrawn", content_html: "" },
  };
  const index = { items: Object.keys(docs).map((id) => ({ id, kind: docs[id].kind, version: 1 })) };
  const fetchJson = async (url) => (url.endsWith("index.json") ? index : docs[url.match(/items\/(\w+)\.json/)[1]]);

  const first = await takeSteers(KINO_ORIGIN, undefined, fetchJson);
  assert.equal(first.steers.length, 0, "baseline: nothing replayed");
  assert.equal(first.marks.length, 4);

  const second = await takeSteers(KINO_ORIGIN, {}, fetchJson);
  assert.deepEqual(second.steers.map((s) => s.id), ["take:aaaaaaaaaaaaaaaaaaaaaaaaaa:v1", "take:cccccccccccccccccccccccccc:v1"]);
  assert.deepEqual(second.steers[0].links, ["https://example.org/p?a=1&b=2"]);
  assert.equal(second.steers[1].answers, `${KINO_ORIGIN}lab-note`, "a stub of the lab's note answers it");
  assert.deepEqual(second.marks.map((m) => m.key).sort(), ["bbbbbbbbbbbbbbbbbbbbbbbbbb", "dddddddddddddddddddddddddd"], "the lab's own and withdrawals are marked straight away");

  const caughtUp = Object.fromEntries(Object.keys(docs).map((id) => [id, 1]));
  assert.equal((await takeSteers(KINO_ORIGIN, caughtUp, fetchJson)).steers.length, 0, "unchanged versions are skipped");
  index.items[0].version = 2;
  assert.deepEqual((await takeSteers(KINO_ORIGIN, caughtUp, fetchJson)).steers.map((s) => s.id), ["take:aaaaaaaaaaaaaaaaaaaaaaaaaa:v2"], "an edited take is a steer again");
});

test("search: arXiv queries, and each source's response read into one shape", () => {
  assert.equal(arxivQuery("reservoir computing"), "all:reservoir AND all:computing");
  assert.equal(arxivQuery('"analog computing" OR "reversible computing" cat:cs.ET'), '(all:"analog computing") OR (all:"reversible computing" AND cat:cs.ET)');

  const [paper] = parseArxiv(`<feed><entry><id>http://arxiv.org/abs/2401.00001v1</id><published>2024-01-02T00:00:00Z</published>
    <title>A  &amp; B</title><summary> Two
    lines. </summary><author><name>Ada L</name></author><author><name>Bo K</name></author></entry></feed>`);
  assert.deepEqual(paper, { title: "A & B", authors: ["Ada L", "Bo K"], date: "2024-01-02", url: "https://arxiv.org/abs/2401.00001v1", abstract: "Two lines." });

  assert.equal(unInvert({ world: [1], hello: [0], again: [2] }), "hello world again");
  const [work] = parseOpenAlex({ results: [{ display_name: "T", authorships: [{ author: { display_name: "C D" } }], publication_date: "2025-04-22", doi: "https://doi.org/10.1/x", abstract_inverted_index: { b: [1], a: [0] }, cited_by_count: 7 }] });
  assert.deepEqual(work, { title: "T", authors: ["C D"], date: "2025-04-22", url: "https://doi.org/10.1/x", abstract: "a b", cited_by: 7 });

  const exa = parseExa({ results: [{ title: "E", url: "https://e.example", publishedDate: "2026-01-01T00:00:00Z", highlights: ["one", "two"] }], costDollars: { total: 0.007 } });
  assert.equal(exa.usd, 0.007);
  assert.equal(exa.results[0].abstract, "one … two");
});

test("search: Exa is metered against tonight's slice of the budget, and off without a key", async () => {
  const run = { date: "2026-11-21", exa_usd: 0.02 };
  assert.equal(exaLeft(run, [{ date: "2026-11-21", usd: 0.007 }, { date: "2026-11-20", usd: 5 }]), 0.013, "only tonight's spend counts");
  let calls = 0;
  const fetch = async () => { calls += 1; return { ok: true, json: async () => ({ results: [], costDollars: { total: 0.007 } }) }; };
  assert.equal((await search("exa", "q", { run, log: [], fetch, key: "k" })).usd, 0.007);
  await assert.rejects(search("exa", "q", { run, log: [{ date: "2026-11-21", usd: 0.015 }], fetch, key: "k" }), /allowance .* is spent/);
  await assert.rejects(search("exa", "q", { run, log: [], fetch, key: undefined }), /isn't set up/);
  assert.equal(calls, 1, "refusals never reach Exa");
});

/** An experiment that keeps the run.py contract, in plain Python. */
const EXPERIMENT = (threshold) => `import json, os, random
seed = int(os.environ.get("SEED", "1"))
random.seed(seed)
value = random.random()
json.dump({"metric": "draw", "value": round(value, 4), "seed": seed, "killed": value < ${threshold}}, open(os.environ.get("RESULT_PATH", "result.json"), "w"))
`;

test("replicate: a new result runs again on the next seed, once, with no secrets in its environment", () => {
  const lab = mkdtempSync(join(tmpdir(), "rep-"));
  const prior = { cmd: process.env.REPLICATE_CMD, secret: process.env.ANTHROPIC_API_KEY };
  process.env.REPLICATE_CMD = "python3 run.py";
  process.env.ANTHROPIC_API_KEY = "sk-must-not-leak";
  try {
    const exp = (name, code, result) => {
      mkdirSync(join(lab, "experiments", name), { recursive: true });
      writeFileSync(join(lab, "experiments", name, "run.py"), code);
      if (result) writeFileSync(join(lab, "experiments", name, "result.json"), JSON.stringify(result));
    };
    exp("e001-holds", EXPERIMENT(-1), { metric: "draw", value: 0.13, seed: 1, killed: false });
    exp("e002-flips", EXPERIMENT(2), { metric: "draw", value: 0.13, seed: 1, killed: false });
    exp("e003-leaky", 'import json, os\njson.dump({"metric": "key", "value": os.environ.get("ANTHROPIC_API_KEY", ""), "seed": 2, "killed": False}, open(os.environ["RESULT_PATH"], "w"))\n', { metric: "key", value: "", seed: 1, killed: false });
    exp("e004-crashes", "raise SystemExit('boom')\n", { metric: "x", value: 1, seed: 1, killed: false });
    exp("e005-no-result-yet", EXPERIMENT(0.5), null);
    // A result run with settings beyond the seed declares them in run.env, and
    // the rerun gets them; one that would set a secret or the seed is refused.
    exp("e006-settings", 'import json, os\njson.dump({"metric": "crop", "value": os.environ.get("CROP", "0"), "seed": 2, "killed": os.environ.get("CROP") != "256"}, open(os.environ["RESULT_PATH"], "w"))\n', { metric: "crop", value: "256", seed: 1, killed: false });
    writeFileSync(join(lab, "experiments/e006-settings/run.env"), "# the patch the result used\nCROP=256\n");
    exp("e007-sneaky", EXPERIMENT(-1), { metric: "draw", value: 0.1, seed: 1, killed: false });
    writeFileSync(join(lab, "experiments/e007-sneaky/run.env"), "ANTHROPIC_API_KEY=x\n");
    mkdirSync(join(lab, "experiments", "_template"));

    const done = replicateAll(lab, "2026-11-21T03:00:00Z");
    const by = Object.fromEntries(done.map((d) => [d.experiment, d]));
    assert.deepEqual(Object.keys(by).sort(), ["e001-holds", "e002-flips", "e003-leaky", "e004-crashes", "e006-settings", "e007-sneaky"]);
    assert.equal(by["e006-settings"].value, "256", "run.env's settings reach the rerun");
    assert.equal(by["e006-settings"].agrees, true);
    assert.match(by["e007-sneaky"].error, /run\.env sets ANTHROPIC_API_KEY/);
    assert.equal(by["e001-holds"].agrees, true);
    assert.equal(by["e001-holds"].seed, 2);
    assert.equal(by["e002-flips"].agrees, false, "killed on the second seed: disagrees");
    assert.equal(by["e003-leaky"].value, "", "the experiment's code never sees a secret");
    assert.match(by["e004-crashes"].error, /boom/);
    assert.ok(existsSync(join(lab, "experiments/e001-holds/replication.json")));
    assert.equal(replicateAll(lab).length, 0, "an unchanged result isn't run again");
    writeFileSync(join(lab, "experiments/e001-holds/result.json"), JSON.stringify({ metric: "draw", value: 0.2, seed: 5, killed: false }));
    assert.deepEqual(replicateAll(lab).map((d) => [d.experiment, d.seed]), [["e001-holds", 6]], "a changed result is");
  } finally {
    if (prior.cmd === undefined) delete process.env.REPLICATE_CMD; else process.env.REPLICATE_CMD = prior.cmd;
    if (prior.secret === undefined) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = prior.secret;
    rmSync(lab, { recursive: true, force: true });
  }
});

const ARGS = { name: "lab-2026-11-21-test", model: "claude-haiku-5-5", at: "2026-11-21T03:00:00Z", kino: KINO, origin: KINO_ORIGIN };

test("render: a note becomes a kinocomputing page that discloses its model", async () => {
  const page = await renderNote({ ...ARGS, markdown: "**A title**\n\nBody with a [link](/about) and `code`.\n\n- one\n- two\n", pin: true, changeNote: 'a "quoted" change' });
  assert.match(page, /<meta property="article:published_time" content="2026-11-21T03:00:00Z">/);
  assert.match(page, /<meta name="blyg:generated" content="claude-haiku-5-5">/);
  assert.match(page, /<meta name="blyg:pin" content="true">/);
  assert.match(page, /<meta name="blyg:note" content="a &quot;quoted&quot; change">/);
  assert.match(page, /<main>\n<p><strong>A title<\/strong><\/p>/);
  assert.ok(!page.includes("{{"), "every placeholder filled");
});

test("render: an answer to a take on kinocomputing ends with the source line kinocomputing reads as a stub", async () => {
  const page = await renderNote({ ...ARGS, markdown: "**Re: theory**\n\nAgreed.\n", answers: `${KINO_ORIGIN}101-ash-owls` });
  assert.match(page, /<p class="source"><a href="https:\/\/www\.kinocomputing\.com\/101-ash-owls">/);
  const { stubTarget } = await import(join(KINO, "tools/stub.mjs"));
  assert.equal(stubTarget(page), `${KINO_ORIGIN}101-ash-owls`);
  await assert.rejects(renderNote({ ...ARGS, markdown: "x", answers: "https://elsewhere.example/n" }), /isn't a note on kinocomputing/);
});

test("render: a voice signs a write-up under its title; claims and the brief stay in the house voice", async () => {
  const page = await renderNote({ ...ARGS, voice: "Bompa", markdown: "**The road not taken**\n\nThe analog computer was winning in 1955.\n" });
  assert.match(page, /<p><strong>The road not taken<\/strong><\/p>\n<p><em>By <a href="https:\/\/www\.kinocomputing\.com\/about">Bompa<\/a>, one of the lab(?:'|&#39;)s AI voices<\/em><\/p>\n<p>The analog computer/);
  assert.match(page, /<meta name="description" content="The analog computer was winning in 1955\.">/, "the byline isn't the description");
  await assert.rejects(renderNote({ ...ARGS, voice: "Bompa", kind: "claim", markdown: "**C**\n\nA claim.\n" }), /claims and the brief are the lab.s record/);
  await assert.rejects(renderNote({ ...ARGS, voice: "Bompa", kind: "brief", markdown: "**B**\n\nA brief.\n" }), /claims and the brief/);
});

test("render: refuses what the blyg can't carry, before it reaches the site", async () => {
  await assert.rejects(renderNote({ ...ARGS, markdown: "| a | b |\n|---|---|\n| 1 | 2 |\n" }), /a table/);
  await assert.rejects(renderNote({ ...ARGS, markdown: "Hello <span>there</span>\n" }), /raw HTML/);
  await assert.rejects(renderNote({ ...ARGS, markdown: "   \n" }), /empty/);
  // The reader can't see the lab: its ids in a note's text are refused, in a
  // link's address they're fine.
  for (const id of ["q-003", "e002", "a001", "c-003", "E004"]) {
    await assert.rejects(renderNote({ ...ARGS, markdown: `**T**\n\nAs ${id} showed.\n` }), /can't look up/, id);
  }
  await renderNote({ ...ARGS, markdown: "**T**\n\n[The code](https://github.com/msmsim/kinocomputing-lab/blob/main/experiments/e002-x/RESULTS.md), and https://example.org/e002 too. In 2024, a3 b-12.\n" });
});

/** A throwaway lab and kinocomputing, side by side, the lab a git repo. */
function makeWorld() {
  const root = mkdtempSync(join(tmpdir(), "lab-world-"));
  const lab = join(root, "lab");
  const kino = join(root, "kino");
  for (const path of ["tools", "config", "voices", "AGENT.md", "CHARTER.md", "package.json"]) cpSync(join(LAB, path), join(lab, path), { recursive: true });
  cpSync(join(LAB, "node_modules"), join(lab, "node_modules"), { recursive: true });
  for (const dir of ["state/questions", "outbox", "published", "journal", "experiments"]) mkdirSync(join(lab, dir), { recursive: true });
  writeFileSync(join(lab, "state/questions/q-001-test.md"), "---\nid: q-001\ntitle: A test question\nkind: experiment\nstatus: open\npriority: 1\n---\n\nWhy.\n");
  for (const path of ["tools", "notes/_note.html", "notes/_stream.html", "note.css", "favicon.svg", "favicon.ico", "apple-touch-icon.png", "kinocomputing-basic-og.jpg"]) {
    cpSync(join(KINO, path), join(kino, path), { recursive: true });
  }
  mkdirSync(join(kino, "blyg"), { recursive: true });
  const git = (...a) => execFileSync("git", a, { cwd: lab, stdio: "ignore" });
  git("init", "-q", "-b", "main");
  git("-c", "user.name=t", "-c", "user.email=t@t", "add", "-A");
  git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-qm", "seed");
  const node = (cwd, args, at, extra = {}) => {
    const r = spawnSync(process.execPath, args, {
      cwd, encoding: "utf8",
      env: { ...process.env, KINO_DIR: kino, LAB_NOW: at, BLYG_NOW: at, LAB_SURFACE_DIR: join(kino, "dist"), LAB_NO_READING: "1", REPLICATE_CMD: "python3 run.py", ...extra },
    });
    if (r.status !== 0) throw new Error(`${args.join(" ")} failed:\n${r.stdout}${r.stderr}`);
    return r.stdout;
  };
  const commit = () => {
    git("-c", "user.name=t", "-c", "user.email=t@t", "add", "-A");
    git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-qm", "night", "--allow-empty");
  };
  // kinocomputing's Action, then its deploy.
  const publish = (at) => {
    node(kino, ["tools/build-stream.mjs", "--state"], at);
    node(kino, ["tools/build-stream.mjs"], at);
  };
  // The PI posts a take through motes: a plain note page, no model named, no
  // kind asked for — so a fragment.
  const take = async (slug, markdown, at) => {
    const page = (await renderNote({ markdown, name: slug, model: "x", at, kino, origin: KINO_ORIGIN }))
      .replace(/ *<meta name="blyg:(generated|kind)"[^>]*>\n/g, "");
    writeFileSync(join(kino, "notes", `${slug}.html`), page);
  };
  return { root, lab, kino, node, commit, publish, take, dispose: () => rmSync(root, { recursive: true, force: true }) };
}

test("claims are fragments, write-ups are threads that quote them and the PI, and a moved claim makes its write-up stale", async () => {
  const w = makeWorld();
  const read = (p) => readFileSync(join(w.lab, p), "utf8");
  const write = (p, s) => writeFileSync(join(w.lab, p), s);
  const night = (at, spend) => {
    write("state/claude-output.json", JSON.stringify({ total_cost_usd: spend, num_turns: 3, is_error: false }));
    write("MORNING.md", `# ${at.slice(0, 10)}\n`);
    return w.node(w.lab, ["tools/settle.mjs"], at);
  };
  try {
    await w.take("001-on-reservoirs", "**On reservoirs**\n\nPhysical reservoirs are underrated, and nobody measures them per joule.\n", "2026-11-01T00:00:00Z");
    w.publish("2026-11-01T00:00:00Z");
    w.node(w.lab, ["tools/prepare.mjs"], "2026-11-21T02:00:00Z");

    write("outbox/lab-2026-11-21-reservoir-claim.md", "---\nkind: claim\nquestion: q-001\n---\n\n**Claim: reservoirs per joule**\n\nIn simulation, a reservoir beat its digital baseline per joule on one task. Stage: simulated.\n");
    write("outbox/lab-2026-11-21-reservoir-analysis.md", [
      "---", "kind: analysis", "question: q-001", "---", "",
      "**What the reservoir result means**", "",
      "The PI put it this way:", "",
      "![[on-reservoirs]]", "> nobody measures them per joule", "",
      "So the lab measured. Its claim:", "",
      "![[lab-2026-11-21-reservoir-claim]]", "",
      "The part that matters:", "",
      "![[lab-2026-11-21-reservoir-claim]]", "> beat its digital baseline per joule", "",
      "```", "![[not-a-quote-in-code]]", "```", "",
    ].join("\n"));
    write("outbox/lab-2026-11-21-claim-that-quotes.md", "---\nkind: claim\n---\n\n![[on-reservoirs]]\n");
    write("outbox/lab-2026-11-21-long-claim.md", `---\nkind: claim\n---\n\n${"x".repeat(1200)}\n`);
    write("outbox/lab-2026-11-21-misquote.md", "---\nkind: notebook\n---\n\n**Misquote**\n\n![[on-reservoirs]]\n> reservoirs are overrated\n");
    write("outbox/lab-2026-11-21-then-quotes-analysis.md", "---\nkind: notebook\n---\n\n**Quoting a write-up**\n\n![[lab-2026-11-21-reservoir-analysis]]\n");
    const settled = night("2026-11-21T03:30:00Z", 0.2);
    assert.match(settled, /published lab-2026-11-21-reservoir-claim, published lab-2026-11-21-reservoir-analysis/, `the claim first\n${read("MORNING.md")}`);
    const morning = read("MORNING.md");
    assert.match(morning, /claim-that-quotes is a claim, and a claim can't quote/);
    assert.match(morning, /long-claim is a claim of 1\d{3} characters/);
    assert.match(morning, /misquote quotes on-reservoirs with a selection that isn't in it/);
    assert.match(morning, /then-quotes-analysis quotes lab-2026-11-21-reservoir-analysis, a write-up/);
    w.commit();
    w.publish("2026-11-21T03:40:00Z");

    const items = () => JSON.parse(readFileSync(join(w.kino, "blyg/_registry.json"), "utf8")).items;
    const docOf = (slug) => JSON.parse(readFileSync(join(w.kino, "dist/items", `${items()[slug].id}.json`), "utf8"));
    const claim = docOf("lab-2026-11-21-reservoir-claim");
    const analysis = docOf("lab-2026-11-21-reservoir-analysis");
    const take = docOf("001-on-reservoirs");
    assert.equal(claim.kind, "fragment");
    assert.equal(analysis.kind, "thread");
    assert.deepEqual(analysis.transclusions, [
      { id: take.id, version: 1, selector: { exact: "nobody measures them per joule" } },
      { id: claim.id, version: 1 },
      { id: claim.id, version: 1, selector: { exact: "beat its digital baseline per joule" } },
    ]);
    assert.match(analysis.content_md, /```\n!\[\[not-a-quote-in-code\]\]\n```/, "a directive in code stays code");

    // Night 2: the claim moves stage. The write-up now quotes an old version, and the briefing says so.
    w.node(w.lab, ["tools/prepare.mjs"], "2026-11-22T02:00:00Z");
    write("outbox/lab-2026-11-21-reservoir-claim.md", "---\nkind: claim\npin: true\nchange_note: replicated on a second task\n---\n\n**Claim: reservoirs per joule**\n\nIn simulation, a reservoir beat its digital baseline per joule on two tasks. Stage: replicated.\n");
    write("outbox/lab-2026-11-21-reservoir-analysis.md", "---\nkind: claim\n---\n\nNow a claim?\n");
    night("2026-11-22T03:30:00Z", 0.1);
    assert.match(read("MORNING.md"), /reservoir-analysis — a note's kind can't change/);
    w.commit();
    w.publish("2026-11-22T03:40:00Z");
    w.node(w.lab, ["tools/prepare.mjs"], "2026-11-23T02:00:00Z");
    assert.match(read("state/tonight.md"), /## Write-ups quoting an older version\n\n- what-the-reservoir-result-means: claim-reservoirs-per-joule \(quoted v1, now v2\)/);
  } finally {
    w.dispose();
  }
});

test("a shift stopped at its time limit, with no cost report, is counted at its cap and still settled", async () => {
  const w = makeWorld();
  const read = (p) => readFileSync(join(w.lab, p), "utf8");
  try {
    w.publish("2026-11-20T00:00:00Z");
    const prep = w.node(w.lab, ["tools/prepare.mjs"], "2026-11-21T02:00:00Z");
    assert.match(read("state/tonight.md"), /stopped at \*\*03:00 UTC\*\* \(60 minutes\)/, "the briefing gives the deadline");
    assert.match(read("state/tonight.md"), /Publish \*\*5 to 10 notes\*\* tonight, claims included/, "and the night's range");
    void prep;
    writeFileSync(join(w.lab, "outbox/lab-2026-11-21-half-done.md"), "---\nkind: notebook\n---\n\n**Half done**\n\nWhat got written before the stop.\n");
    const settled = w.node(w.lab, ["tools/settle.mjs"], "2026-11-21T03:05:00Z", { SHIFT_EXIT: "124" });
    assert.match(settled, /~\$1\.50 \(no cost report; counted at the cap\), published lab-2026-11-21-half-done/);
    const spend = JSON.parse(read("state/spend.jsonl").trim().split("\n").at(-1));
    assert.deepEqual([spend.usd, spend.estimated], [1.5, true]);
    const morning = read("MORNING.md");
    assert.match(morning, /hit its time limit and was stopped/);
    assert.match(morning, /No journal entry was written tonight/);
  } finally {
    w.dispose();
  }
});

test("a full night: ten notes publish, claims included, the rest are held back, and no shortfall is reported", async () => {
  const w = makeWorld();
  const read = (p) => readFileSync(join(w.lab, p), "utf8");
  try {
    w.publish("2026-11-20T00:00:00Z");
    w.node(w.lab, ["tools/prepare.mjs"], "2026-11-21T02:00:00Z");
    for (let i = 1; i <= 11; i++) {
      const n = String(i).padStart(2, "0");
      writeFileSync(join(w.lab, `outbox/lab-2026-11-21-note-${n}.md`), `---\nkind: notebook\n---\n\n**Note ${n}**\n\nA short note, number ${n}.\n`);
    }
    for (const c of ["a", "b"]) writeFileSync(join(w.lab, `outbox/lab-2026-11-21-claim-${c}.md`), `---\nkind: claim\n---\n\n**Claim ${c}**\n\nAn untested idea, ${c}.\n`);
    writeFileSync(join(w.lab, "state/claude-output.json"), JSON.stringify({ total_cost_usd: 1.2, num_turns: 40, is_error: false }));
    w.node(w.lab, ["tools/settle.mjs"], "2026-11-21T03:20:00Z");
    const published = readdirSync(join(w.lab, "published")).filter((f) => /(?:note|claim)-/.test(f));
    assert.equal(published.length, 10);
    assert.ok(published.includes("lab-2026-11-21-claim-a.md") && published.includes("lab-2026-11-21-claim-b.md"), "claims go first");
    const morning = read("MORNING.md");
    for (const n of ["09", "10", "11"]) assert.match(morning, new RegExp(`Not published: lab-2026-11-21-note-${n} — over the 10-note nightly limit`));
    assert.ok(!/under the nightly minimum/.test(morning));
    const brief = readFileSync(join(w.kino, "notes/lab-2026-11-21-brief.html"), "utf8");
    assert.ok(!/short of the lab/.test(brief), "no shortfall on a full night");
  } finally {
    w.dispose();
  }
});

test("timebox: stops a command past its limit with 124, passes an exit code through", () => {
  const started = Date.now();
  const slow = spawnSync(process.execPath, [join(LAB, "tools/timebox.mjs"), "1", "sleep", "10"], { encoding: "utf8" });
  assert.equal(slow.status, 124);
  assert.ok(Date.now() - started < 6000, "stopped at the limit, not left to finish");
  const quick = spawnSync(process.execPath, [join(LAB, "tools/timebox.mjs"), "5", "sh", "-c", "exit 3"], { encoding: "utf8" });
  assert.equal(quick.status, 3);
});

test("three nights, end to end: takes handled or re-offered, claims kept, experiments replicated, notes published, versioned and pinned", async () => {
  const w = makeWorld();
  const read = (p) => readFileSync(join(w.lab, p), "utf8");
  const write = (p, s) => writeFileSync(join(w.lab, p), s);
  try {
    // Before the lab: the PI's site already has a note on it.
    await w.take("001-old-note", "**Before the lab**\n\nAn old note.\n", "2026-11-01T00:00:00Z");
    w.publish("2026-11-01T00:00:00Z");

    // Night 1: the first look is a baseline. The shift runs an experiment and publishes a note.
    const prep = w.node(w.lab, ["tools/prepare.mjs"], "2026-11-21T02:00:00Z", { EXA_CONFIGURED: "true" });
    assert.match(prep, /light run, \$1\.40 on claude-sonnet-5-5 \+ \$0\.10 Exa, 0 take\(s\), 1 open question/);
    const run = JSON.parse(read("state/run.json"));
    assert.equal(run.baseline, true);
    assert.equal(run.exa_usd + run.max_usd, 1.5, "one pot: Exa's slice comes out of the night's money");

    mkdirSync(join(w.lab, "experiments/e001-draw"));
    write("experiments/e001-draw/run.py", EXPERIMENT(-1));
    write("experiments/e001-draw/result.json", JSON.stringify({ metric: "draw", value: 0.13, seed: 1, killed: false }));
    write("state/claims.jsonl", `${JSON.stringify({ id: "c-001", question: "q-001", stage: "conjecture", statement: "x", at: "2026-11-21T03:00:00Z" })}\n`);
    write("state/search-spend.jsonl", `${JSON.stringify({ date: "2026-11-21", usd: 0.014, query: "q" })}\n`);
    write("outbox/lab-2026-11-21-first-look.md", "---\nkind: notebook\nquestion: q-001\nvoice: concrete\n---\n\n**First look**\n\nWhat the lab will try first.\n");
    write("outbox/lab-2026-11-21-who.md", "---\nkind: notebook\nvoice: nassim\n---\n\n**Who**\n\nA voice the lab doesn't have.\n");
    write("outbox/lab-2026-11-21-bad.md", "---\nkind: notebook\n---\n\n| a | b |\n|---|---|\n| 1 | 2 |\n");
    write("outbox/001-old-note.md", "---\nkind: notebook\n---\n\nAn attempt on the PI's own note.\n");
    write("outbox/lab-2026-11-21-brief.md", "---\nkind: notebook\n---\n\n**My own brief**\n\nAll went perfectly.\n");
    write("MORNING.md", "# 2026-11-21\n\nPublished a first look.\n");
    write("state/claude-output.json", JSON.stringify({ total_cost_usd: 0.42, num_turns: 9, is_error: false }));
    // The shift tampers with the rules that judge it; the restore puts them back.
    const settleSource = read("tools/settle.mjs");
    write("tools/settle.mjs", "console.log('settle: all fine');\n");
    write("CHARTER.md", "# Anything goes\n");
    write("tools/helper.mjs", "// new\n");
    const restored = execFileSync("bash", ["tools/restore-machinery.sh"], { cwd: w.lab, encoding: "utf8" });
    assert.match(restored, /put back 3 machinery file/);
    assert.equal(read("tools/settle.mjs"), settleSource);
    assert.ok(!existsSync(join(w.lab, "tools/helper.mjs")), "added files go too");
    assert.match(w.node(w.lab, ["tools/replicate.mjs"], "2026-11-21T03:20:00Z"), /e001-draw agrees/);
    const settled = w.node(w.lab, ["tools/settle.mjs"], "2026-11-21T03:30:00Z");
    assert.match(settled, /\$0\.42, \$0\.01 Exa, 1 claim\(s\), published lab-2026-11-21-first-look, published the brief/);
    // The brief: the shift's own words, what went out, and what settle saw, for anyone.
    const brief = readFileSync(join(w.kino, "notes/lab-2026-11-21-brief.html"), "utf8");
    assert.match(brief, /<strong>Lab brief: 21 November 2026<\/strong>/);
    assert.match(brief, /Published a first look\./);
    assert.match(brief, /<a href="https:\/\/www\.kinocomputing\.com\/lab-2026-11-21-first-look">First look<\/a>/);
    assert.match(brief, /The automatic rerun of the draw experiment on fresh random numbers reached the same verdict as the original/);
    assert.match(brief, /4 notes were held back/);
    assert.match(brief, /Only 1 note was published tonight, short of the lab(?:'|&#39;)s nightly 5\./, "a short night is said plainly");
    assert.ok(!brief.includes("All went perfectly"), "the brief is settle's to write");
    assert.match(read("MORNING.md"), /Not published: lab-2026-11-21-brief — that name is the nightly brief/);
    assert.match(brief, /edited the lab('|&#39;)s own tools or rules/);
    assert.match(brief, /The shift cost \$0\.43, on Claude Sonnet 5\.5\./);
    assert.match(brief, /<meta name="blyg:generated"/, "the brief is the lab's, so never a take");
    assert.ok(!/e001|c-001|q-001/.test(brief.replace(/<[^>]+>/g, " ")), "no lab ids in what a reader sees");

    assert.ok(existsSync(join(w.kino, "notes/lab-2026-11-21-first-look.html")));
    assert.match(readFileSync(join(w.kino, "notes/lab-2026-11-21-first-look.html"), "utf8"), /<em>By <a href="[^"]*about">Concrete<\/a>, one of the lab(?:'|&#39;)s AI voices<\/em>/);
    assert.match(read("MORNING.md"), /Not published: lab-2026-11-21-who — no such voice as "nassim"/);
    assert.match(readFileSync(join(w.kino, "notes/001-old-note.html"), "utf8"), /An old note/, "never writes over a note that isn't the lab's");
    assert.ok(existsSync(join(w.lab, "outbox/rejected/lab-2026-11-21-bad.md")));
    const morning = read("MORNING.md");
    assert.match(morning, /Not published: lab-2026-11-21-bad uses a table/);
    assert.match(morning, /Not published: 001-old-note — not a lab note name/);
    assert.match(morning, /Replication of e001-draw on seed 2: agrees/);
    assert.match(morning, /changed the lab's machinery, which was put back: CHARTER\.md, tools\/helper\.mjs, tools\/settle\.mjs/);
    assert.deepEqual(JSON.parse(read("state/seen.json")).takes !== undefined, true, "the baseline is recorded");
    const spends = read("state/spend.jsonl").trim().split("\n").map((l) => JSON.parse(l));
    assert.deepEqual(spends.map((s) => [s.source, s.usd]), [["model", 0.42], ["exa", 0.014]]);
    w.commit();
    w.publish("2026-11-21T03:40:00Z");
    const registry = () => JSON.parse(readFileSync(join(w.kino, "blyg/_registry.json"), "utf8")).items;
    const entry = registry()["lab-2026-11-21-first-look"];
    const doc = JSON.parse(readFileSync(join(w.kino, "dist/items", `${entry.id}.json`), "utf8"));
    assert.deepEqual(doc.generated, [{ sources: [], model: "claude-sonnet-5-5", at: "2026-11-21T03:30:00Z" }]);

    // The PI posts two takes. Night 2 sees them, and not the lab's own note; the shift handles one.
    await w.take("002-ash-owls", "**More theory**\n\nLess hardware, more World Machines.\n", "2026-11-21T12:00:00Z");
    await w.take("003-rust-bats", "**Read this**\n\nA [paper](https://example.org/paper).\n", "2026-11-21T12:05:00Z");
    w.publish("2026-11-21T12:10:00Z");
    w.node(w.lab, ["tools/prepare.mjs"], "2026-11-22T02:00:00Z");
    const run2 = JSON.parse(read("state/run.json"));
    assert.equal(run2.steers.length, 2, "both takes, and not the lab's note");
    assert.match(read("state/tonight.md"), /Less hardware, more World Machines\./);
    assert.match(read("state/tonight.md"), /e001-draw: seed 2, draw .* agrees/, "last night's replication is in the briefing");
    const ash = run2.steers.find((s) => s.id.startsWith(`take:${registry()["002-ash-owls"].id}`));
    write("state/steers.jsonl", `${JSON.stringify({ steer: ash.id, action: "raised q-002" })}\n`);
    write("state/claims.jsonl", `${JSON.stringify({ id: "c-001", question: "q-001", stage: "replicated", statement: "x", at: "2026-11-21T03:00:00Z" })}\n`);
    write("outbox/lab-2026-11-21-first-look.md", "---\nkind: experiment\npin: true\nchange_note: ran it on a second dataset\n---\n\n**First look**\n\nIt held on a second dataset.\n");
    write("MORNING.md", "# 2026-11-22\n\nMoved c-001 up a stage.\n");
    write("state/claude-output.json", JSON.stringify({ total_cost_usd: 0.3, num_turns: 5, is_error: false }));
    w.node(w.lab, ["tools/replicate.mjs"], "2026-11-22T03:20:00Z");
    w.node(w.lab, ["tools/settle.mjs"], "2026-11-22T03:30:00Z");
    assert.match(read("MORNING.md"), /Takes not handled, offered again tomorrow: take:/);
    // A summary that leans on lab ids is kept out of the brief; settle's part still goes.
    assert.match(read("MORNING.md"), /MORNING\.md couldn.t go in the brief: it says "c-001"/);
    const brief2 = readFileSync(join(w.kino, "notes/lab-2026-11-22-brief.html"), "utf8");
    assert.match(brief2, /didn.t pass the publishing checks tonight/);
    assert.match(brief2, /offered again tomorrow: <a href="https:\/\/www\.kinocomputing\.com\/read-this">/);
    assert.match(brief2, /record was restored/);
    assert.match(read("MORNING.md"), /1 committed claim line\(s\) were edited or removed; restored/);
    assert.match(read("state/claims.jsonl"), /"stage":"conjecture"/, "the original claim is back");
    w.commit();
    w.publish("2026-11-22T03:40:00Z");
    const updated = registry()["lab-2026-11-21-first-look"];
    assert.deepEqual(updated.changelog.at(-1), { version: 2, at: "2026-11-22T03:30:00Z", note: "ran it on a second dataset", pinned: true });
    assert.ok(existsSync(join(w.kino, `blyg/items/${updated.id}/v2.json`)), "pinned version written");

    // Night 3: only the missed take comes back; the lab's new version isn't a take.
    w.node(w.lab, ["tools/prepare.mjs"], "2026-11-23T02:00:00Z");
    const run3 = JSON.parse(read("state/run.json"));
    assert.deepEqual(run3.steers.map((s) => s.id), [`take:${registry()["003-rust-bats"].id}:v1`]);
  } finally {
    w.dispose();
  }
});
