// The lab's deterministic machinery: money, steers, search, replication, the
// publishing gate, and three whole nights end to end against kinocomputing's
// real build. Nothing here calls a model or the network — the agent's part
// is played by a script.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
    mkdirSync(join(lab, "experiments", "_template"));

    const done = replicateAll(lab, "2026-11-21T03:00:00Z");
    const by = Object.fromEntries(done.map((d) => [d.experiment, d]));
    assert.deepEqual(Object.keys(by).sort(), ["e001-holds", "e002-flips", "e003-leaky", "e004-crashes"]);
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

test("render: refuses what the blyg can't carry, before it reaches the site", async () => {
  await assert.rejects(renderNote({ ...ARGS, markdown: "| a | b |\n|---|---|\n| 1 | 2 |\n" }), /a table/);
  await assert.rejects(renderNote({ ...ARGS, markdown: "Hello <span>there</span>\n" }), /raw HTML/);
  await assert.rejects(renderNote({ ...ARGS, markdown: "   \n" }), /empty/);
});

/** A throwaway lab and kinocomputing, side by side, the lab a git repo. */
function makeWorld() {
  const root = mkdtempSync(join(tmpdir(), "lab-world-"));
  const lab = join(root, "lab");
  const kino = join(root, "kino");
  for (const path of ["tools", "config", "AGENT.md", "CHARTER.md", "package.json"]) cpSync(join(LAB, path), join(lab, path), { recursive: true });
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
      env: { ...process.env, KINO_DIR: kino, LAB_NOW: at, BLYG_NOW: at, LAB_SURFACE_DIR: join(kino, "dist"), REPLICATE_CMD: "python3 run.py", ...extra },
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
    assert.match(prep, /light run, \$1\.40 on claude-haiku-5-5 \+ \$0\.10 Exa, 0 take\(s\), 1 open question/);
    const run = JSON.parse(read("state/run.json"));
    assert.equal(run.baseline, true);
    assert.equal(run.exa_usd + run.max_usd, 1.5, "one pot: Exa's slice comes out of the night's money");

    mkdirSync(join(w.lab, "experiments/e001-draw"));
    write("experiments/e001-draw/run.py", EXPERIMENT(-1));
    write("experiments/e001-draw/result.json", JSON.stringify({ metric: "draw", value: 0.13, seed: 1, killed: false }));
    write("state/claims.jsonl", `${JSON.stringify({ id: "c-001", question: "q-001", stage: "conjecture", statement: "x", at: "2026-11-21T03:00:00Z" })}\n`);
    write("state/search-spend.jsonl", `${JSON.stringify({ date: "2026-11-21", usd: 0.014, query: "q" })}\n`);
    write("outbox/lab-2026-11-21-first-look.md", "---\nkind: notebook\nquestion: q-001\n---\n\n**First look**\n\nWhat the lab will try first.\n");
    write("outbox/lab-2026-11-21-bad.md", "---\nkind: notebook\n---\n\n| a | b |\n|---|---|\n| 1 | 2 |\n");
    write("outbox/001-old-note.md", "---\nkind: notebook\n---\n\nAn attempt on the PI's own note.\n");
    write("MORNING.md", "# 2026-11-21\n\nPublished a first look.\n");
    write("state/claude-output.json", JSON.stringify({ total_cost_usd: 0.42, num_turns: 9, is_error: false }));
    assert.match(w.node(w.lab, ["tools/replicate.mjs"], "2026-11-21T03:20:00Z"), /e001-draw agrees/);
    const settled = w.node(w.lab, ["tools/settle.mjs"], "2026-11-21T03:30:00Z");
    assert.match(settled, /\$0\.42, \$0\.01 Exa, 1 claim\(s\), published lab-2026-11-21-first-look/);

    assert.ok(existsSync(join(w.kino, "notes/lab-2026-11-21-first-look.html")));
    assert.match(readFileSync(join(w.kino, "notes/001-old-note.html"), "utf8"), /An old note/, "never writes over a note that isn't the lab's");
    assert.ok(existsSync(join(w.lab, "outbox/rejected/lab-2026-11-21-bad.md")));
    const morning = read("MORNING.md");
    assert.match(morning, /Not published: lab-2026-11-21-bad uses a table/);
    assert.match(morning, /Not published: 001-old-note — not a lab note name/);
    assert.match(morning, /Replication of e001-draw on seed 2: agrees/);
    assert.deepEqual(JSON.parse(read("state/seen.json")).takes !== undefined, true, "the baseline is recorded");
    const spends = read("state/spend.jsonl").trim().split("\n").map((l) => JSON.parse(l));
    assert.deepEqual(spends.map((s) => [s.source, s.usd]), [["model", 0.42], ["exa", 0.014]]);
    w.commit();
    w.publish("2026-11-21T03:40:00Z");
    const registry = () => JSON.parse(readFileSync(join(w.kino, "blyg/_registry.json"), "utf8")).items;
    const entry = registry()["lab-2026-11-21-first-look"];
    const doc = JSON.parse(readFileSync(join(w.kino, "dist/items", `${entry.id}.json`), "utf8"));
    assert.deepEqual(doc.generated, [{ sources: [], model: "claude-haiku-5-5", at: "2026-11-21T03:30:00Z" }]);

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
    write("MORNING.md", "# 2026-11-22\n");
    write("state/claude-output.json", JSON.stringify({ total_cost_usd: 0.3, num_turns: 5, is_error: false }));
    w.node(w.lab, ["tools/replicate.mjs"], "2026-11-22T03:20:00Z");
    w.node(w.lab, ["tools/settle.mjs"], "2026-11-22T03:30:00Z");
    assert.match(read("MORNING.md"), /Takes not handled, offered again tomorrow: take:/);
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
