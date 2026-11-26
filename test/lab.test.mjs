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
import { allowance, frontMatter, KINO, LAB, regionFor, rotation, sundayPlan } from "../tools/lib.mjs";
import { labChanges, siteChanges } from "../tools/week.mjs";
import * as sources from "../tools/sources.mjs";
import { takeSteers } from "../tools/steers.mjs";
import { renderNote } from "../tools/render.mjs";
import { arxivQuery, exaAgent, exaBody, exaLeft, parseArxiv, parseExa, parseOpenAlex, search, unInvert } from "../tools/search.mjs";
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
  assert.match(page, /<p><strong>The road not taken<\/strong><\/p>\n<p>The analog computer was winning in 1955\.<\/p>\n<p><em>By <a href="https:\/\/www\.kinocomputing\.com\/about">Bompa<\/a>, one of the lab(?:'|&#39;)s AI voices<\/em><\/p>/, "the byline at the foot, so the note opens with its lead");
  assert.match(page, /<meta name="description" content="The analog computer was winning in 1955\.">/, "the byline isn't the description");
  await assert.rejects(renderNote({ ...ARGS, voice: "Bompa", kind: "claim", markdown: "**C**\n\nA claim.\n" }), /claims, paradigm entries and the brief are the lab.s record/);
  await assert.rejects(renderNote({ ...ARGS, voice: "Bompa", kind: "brief", markdown: "**B**\n\nA brief.\n" }), /claims, paradigm entries and the brief/);
});

test("render: maths as kinocomputing draws it — TeX safe from markdown, MathML with the TeX kept, prices and code left alone, unreadable TeX refused", async () => {
  const page = await renderNote({ ...ARGS, markdown: "**Energy per bit**\n\nLandauer's floor is $k_B T \\ln 2$ per bit, and $x_1 * y_2 * z_3$ stays a product; the chip cost $5 and $10.\n\n$$E = \\sum_{i=1}^{n} p_i \\log_2 \\frac{1}{p_i}$$\n\nIn code it is `$x_1$`.\n" });
  assert.match(page, /<math><semantics>[\s\S]*?<annotation encoding="application\/x-tex">k_B T \\ln 2<\/annotation><\/semantics><\/math> per bit/);
  assert.match(page, /<annotation encoding="application\/x-tex">x_1 \* y_2 \* z_3<\/annotation>/, "underscores and asterisks are the formula's, not emphasis");
  assert.ok(!/<em>|<strong>1/.test(page.split("<main>")[1].split("</main>")[0].replace(/<p><strong>Energy per bit<\/strong><\/p>/, "")), "no emphasis made from TeX");
  assert.match(page, /<p><math display="block"><semantics>/);
  assert.match(page, /the chip cost \$5 and \$10\./);
  assert.match(page, /<code>\$x_1\$<\/code>/);
  assert.match(page, /<meta name="description" content="Landauer’s floor is kBTln\S?2 per bit, and x1∗y2∗z3 stays a product/, "the description reads the formula once");
  await assert.rejects(renderNote({ ...ARGS, markdown: "**Bad**\n\nA broken formula, $\\frac{1}{$, here.\n" }), /has TeX the site can't draw/);
});

test("render: a note opens with a lead, not a label, a list or nothing", async () => {
  for (const [markdown, why] of [
    ["**T**\n\n**Where it stands.**\n\nThe rest.\n", /opens with a label/],
    ["**T**\n\n_A line in italics._\n\nThe rest.\n", /opens with a label/],
    ["**T**\n\n- a list first\n", /opens with a list, quote or heading/],
    ["**T**\n", /has no first paragraph/],
  ]) await assert.rejects(renderNote({ ...ARGS, markdown }), why, markdown);
  await renderNote({ ...ARGS, markdown: "**T**\n\n**Where it stands.** A labelled paragraph that goes on to say something is a lead.\n" });
  await renderNote({ ...ARGS, markdown: "**T**\n\nPlain prose, with *some* emphasis, is a lead.\n" });
});

test("render: refuses what the blyg can't carry, before it reaches the site", async () => {
  await assert.rejects(renderNote({ ...ARGS, markdown: "| a | b |\n|---|---|\n| 1 | 2 |\n" }), /a table/);
  await assert.rejects(renderNote({ ...ARGS, markdown: "Hello <span>there</span>\n" }), /raw HTML/);
  await assert.rejects(renderNote({ ...ARGS, markdown: "   \n" }), /empty/);
  // The reader can't see the lab: its ids in a note's text are refused, in a
  // link's address they're fine.
  for (const id of ["q-003", "e002", "a001", "c-003", "Q-003"]) {
    await assert.rejects(renderNote({ ...ARGS, markdown: `**T**\n\nAs ${id} showed.\n` }), /can't look up/, id);
  }
  await renderNote({ ...ARGS, markdown: "**T**\n\n[The code](https://github.com/msmsim/kinocomputing-lab/blob/main/experiments/e002-x/RESULTS.md), and https://example.org/e002 too. In 2024, a3 b-12.\n" });
  // Chips' names look like ids in upper case, and are fine.
  await renderNote({ ...ARGS, markdown: "**T**\n\nOn an Nvidia A100, and on an E300 board.\n" });
});

/** A throwaway lab and kinocomputing, side by side, the lab a git repo. */
test("rotation: enough paradigms a night to go round in the cycle, longest-unlooked first, never-looked first of all", () => {
  const list = Array.from({ length: 32 }, (_, i) => ({ id: `p${i}`, last_checked: null }));
  assert.deepEqual(rotation(list, 14).map((p) => p.id), ["p0", "p1", "p2"], "32 paradigms in 14 days is 3 a night, in the tracker's order");
  list[0].last_checked = "2026-11-22"; list[1].last_checked = "2026-11-10"; list[2].last_checked = "2026-11-10";
  for (const p of list.slice(3)) p.last_checked = "2026-11-20";
  assert.deepEqual(rotation(list, 14).map((p) => p.id), ["p1", "p2", "p3"], "oldest first, ties in order");
  list[5].last_checked = null;
  assert.equal(rotation(list, 14)[0].id, "p5", "never looked at comes first");
  assert.deepEqual(rotation([], 14), []);
  assert.equal(rotation(list.slice(0, 5), 14).length, 1);
});

test("exa: categories and a since-date narrow a search; a company list may run to 25 and takes no date", () => {
  assert.deepEqual(exaBody("photonic chips", { n: 5, category: "news", since: "2026-11-08" }), {
    query: "photonic chips", type: "auto", numResults: 5, category: "news", startPublishedDate: "2026-11-08T00:00:00.000Z", contents: { highlights: true },
  });
  const companies = exaBody("photonic computing companies", { n: 40, category: "company", since: "2026-11-08" });
  assert.equal(companies.numResults, 25);
  assert.ok(!("startPublishedDate" in companies), "Exa refuses a date filter on companies");
  assert.equal(exaBody("x", { n: 40 }).numResults, 10, "otherwise within the base price's ten");
  assert.throws(() => exaBody("x", { category: "blogs" }), /no category "blogs"/);
  assert.throws(() => exaBody("x", { since: "2024" }), /YYYY-MM-DD/);
});

test("exa agent: runs, polls to the end, returns the structured answer with its sources and cost; refuses what tonight can't pay for", async () => {
  const run = { date: "2026-11-21", exa_usd: 0.1 };
  const prices = { minimal: 0.012, low: 0.025, medium: 0.1 };
  const calls = [];
  const replies = [
    { id: "agent_run_1", status: "queued" },
    { id: "agent_run_1", status: "running" },
    { id: "agent_run_1", status: "completed", output: { structured: { state_of_play: "s" }, grounding: [{ field: "state_of_play", citations: [{ url: "https://a.example" }, { url: "https://a.example" }] }] }, costDollars: { total: 0.025 } },
  ];
  const fetch = async (url, init = {}) => { calls.push({ url, init }); return { ok: true, status: 200, json: async () => replies.shift() }; };
  const done = await exaAgent("photonic computing since 2026-11-08", { effort: "low", schema: { type: "object" }, prices, run, log: [], fetch, key: "k", sleep: async () => {} });
  assert.deepEqual(done, { output: { state_of_play: "s" }, sources: ["https://a.example"], usd: 0.025 });
  assert.equal(calls[0].url, "https://api.exa.ai/agent/runs");
  assert.equal(calls[0].init.headers.authorization, "Bearer k");
  assert.deepEqual(JSON.parse(calls[0].init.body), { query: "photonic computing since 2026-11-08", effort: "low", outputSchema: { type: "object" }, budget: { maxCostDollars: 1 } });
  assert.deepEqual(calls.slice(1).map((c) => c.url), ["https://api.exa.ai/agent/runs/agent_run_1", "https://api.exa.ai/agent/runs/agent_run_1"]);

  await assert.rejects(exaAgent("q", { effort: "medium", prices, run, log: [{ date: "2026-11-21", usd: 0.02 }], fetch, key: "k" }), /\$0\.080 left, and a medium run costs \$0\.1/);
  await assert.rejects(exaAgent("q", { effort: "high", prices, run, log: [], fetch, key: "k" }), /isn't one the lab pays for/);
  const failing = async () => ({ ok: true, status: 200, json: async () => ({ id: "agent_run_2", status: "failed", error: { message: "boom" } }) });
  const error = await exaAgent("q", { effort: "low", prices, run, log: [], fetch: failing, key: "k", sleep: async () => {} }).catch((e) => e);
  assert.match(error.message, /failed: boom/);
  assert.equal(error.usd, 0.025, "a failed run is still counted at its price");
});

test("sources: each free source's answer becomes the lab's result shape", () => {
  const one = (r) => r[0];
  assert.deepEqual(sources.parseS2Paper({ title: "T", authors: [{ name: "A" }], publicationDate: "2026-01-02", externalIds: { ArXiv: "2601.00001", DOI: "10.1/x" }, citationCount: 3, abstract: "Ab", venue: "Nature", openAccessPdf: { url: "https://x/pdf" } }),
    { title: "T", authors: ["A"], date: "2026-01-02", url: "https://arxiv.org/abs/2601.00001", abstract: "Ab", cited_by: 3, extra: "Nature · open PDF: https://x/pdf" });
  const pmc = one(sources.parseEuropePmc({ resultList: { result: [{ id: "PPR1", source: "PPR", title: "Brain organoid computing", authorString: "A B, C D.", firstPublicationDate: "2026-09-10", abstractText: "<p>Abstract text</p>", citedByCount: 0, bookOrReportDetails: { publisher: "bioRxiv" } }] } }));
  assert.deepEqual([pmc.url, pmc.authors, pmc.abstract, pmc.extra], ["https://europepmc.org/article/PPR/PPR1", ["A B", "C D"], "Abstract text", "preprint, bioRxiv"]);
  const nsf = one(sources.parseNsf({ response: { award: [{ id: "2611214", title: "T", awardeeName: "Princeton University", startDate: "10/15/2026", estimatedTotalAmt: "306340", program: "Novel devices", perfCountryCode: "US", piEmail: "x@y.edu" }] } }));
  assert.deepEqual([nsf.date, nsf.url, nsf.extra], ["2026-10-15", "https://www.nsf.gov/awardsearch/showAward?AWD_ID=2611214", "NSF · Novel devices · $306,340 · US"]);
  assert.ok(!JSON.stringify(nsf).includes("x@y.edu"), "no one's email address");
  assert.match(one(sources.parseNih({ results: [{ project_title: "T", organization: { org_name: "MAYO", org_country: "UNITED STATES" }, project_start_date: "2026-09-15T00:00:00", appl_id: 1, fiscal_year: 2026, award_amount: 500986 }] })).extra, /NIH · FY2026 · \$500,986/);
  assert.equal(one(sources.parseUkri({ project: [{ title: "T", identifiers: { identifier: [{ type: "RCUK", value: "EP/P00542X/1" }] }, leadFunder: "EPSRC" }] })).url, "https://gtr.ukri.org/projects?ref=EP%2FP00542X%2F1");
  const eu = one(sources.parseOpenAire({ response: { results: { result: [{ header: { "dri:objIdentifier": { $: "corda::1" } }, metadata: { "oaf:entity": { "oaf:project": { title: { $: "NeuMag" }, startdate: { $: "2027-07-01" }, fundedamount: { $: 260348 }, currency: { $: "EUR" }, fundingtree: { funder: { shortname: { $: "EC" }, jurisdiction: { $: "EU" } } } } } } }] } } }));
  assert.deepEqual([eu.title, eu.extra], ["NeuMag", "EC · EU · EUR 260,348"]);
  assert.equal(one(sources.parseEdgar({ hits: { hits: [{ _id: "0002119418-26-000001:primary_doc.xml", _source: { ciks: ["0002119418"], display_names: ["Gaingels Extropic LLC"], file_date: "2026-03-20", form: "D" } }] } })).url,
    "https://www.sec.gov/Archives/edgar/data/2119418/000211941826000001/primary_doc.xml");
  assert.match(one(sources.parseGithub({ items: [{ full_name: "reservoirpy/reservoirpy", html_url: "https://github.com/reservoirpy/reservoirpy", stargazers_count: 663, license: { spdx_id: "MIT" }, pushed_at: "2026-11-04T00:00:00Z" }] })).extra, /663 stars · MIT/);
  const post = one(sources.parseBluesky({ feed: [{ reason: { $type: "repost" }, post: { uri: "at://did/app.bsky.feed.post/3abc", author: { handle: "lab.bsky.social" }, record: { text: "New paper", createdAt: "2026-11-25T10:00:00Z" }, embed: { external: { uri: "https://arxiv.org/abs/1" } } } }] }, "watcher.bsky.social"));
  assert.deepEqual([post.url, post.extra], ["https://bsky.app/profile/lab.bsky.social/post/3abc", "reposted by watcher.bsky.social · links to https://arxiv.org/abs/1"]);
  assert.equal(one(sources.parseHn({ hits: [{ title: "T", objectID: "9", points: 5, num_comments: 2, created_at: "2026-11-11T00:00:00Z" }] })).url, "https://news.ycombinator.com/item?id=9");
});

test("sources: Semantic Scholar waits and retries when its free pool is busy; NIH is asked by POST; SEC is told who is asking", async () => {
  const calls = [];
  const replies = [{ status: 429 }, { status: 200, body: { data: [{ title: "T", authors: [], externalIds: {} }] } }];
  const fetch = async (url, init) => { calls.push({ url, init }); const r = replies.shift() ?? { status: 200, body: {} }; return { ok: r.status === 200, status: r.status, json: async () => r.body }; };
  const slept = [];
  const out = await sources.searchMore("s2", "thermodynamic computing", { n: 2, fetch, sleep: async (ms) => slept.push(ms), s2Key: "" });
  assert.equal(out[0].title, "T");
  assert.deepEqual(slept, [3000]);
  assert.match(calls[0].url, /graph\/v1\/paper\/search\?query=thermodynamic%20computing&limit=2/);
  await assert.rejects(sources.searchMore("s2", "x", { fetch: async () => ({ ok: false, status: 429, json: async () => ({}) }), sleep: async () => {} }), /busy/);
  calls.length = 0;
  const ok = async (url, init) => { calls.push({ url, init }); return { ok: true, status: 200, json: async () => ({}) }; };
  await sources.searchMore("nih", "brain organoid", { fetch: ok });
  assert.equal(calls[0].init.method, "POST");
  assert.equal(JSON.parse(calls[0].init.body).criteria.advanced_text_search.search_text, "brain organoid");
  await sources.searchMore("edgar", "Extropic", { fetch: ok });
  assert.equal(calls[1].init.headers["user-agent"], "Kinocomputing lab lab@kinocomputing.com");
  assert.match(calls[1].url, /q=%22Extropic%22&forms=D/);
  assert.equal(await sources.searchMore("nowhere", "x", { fetch: ok }), null);
});

test("search: the regional lens filters OpenAlex by country; patents go through Exa's Google Patents", async () => {
  let url;
  const fetch = async (u) => { url = u; return { ok: true, status: 200, text: async () => JSON.stringify({ results: [] }), json: async () => ({ results: [] }) }; };
  await search("openalex", "photonic computing", { since: "2026", country: "cn, HK", fetch });
  assert.match(url, /filter=from_publication_date:2026-01-01,institutions\.country_code:cn\|hk/);
  assert.deepEqual(exaBody("optical matrix multiplier", { patents: true }).includeDomains, ["patents.google.com"]);
  await assert.rejects(search("nowhere", "x", { fetch }), /unknown source nowhere: use arxiv, openalex, exa, exa-agent, or s2/);
});

test("regions: one a night, in turn, the same night for every paradigm", () => {
  const regions = [{ name: "A" }, { name: "B" }, { name: "C" }];
  const names = ["2026-11-26", "2026-11-27", "2026-11-28", "2026-11-29"].map((d) => regionFor(d, regions).name);
  assert.equal(new Set(names.slice(0, 3)).size, 3, "three nights, three regions");
  assert.equal(names[3], names[0], "then round again");
  assert.equal(regionFor("2026-11-26", []), null);
});

test("sundays: a deep dive and a roundtable in alternate weeks from the first Sunday, the deep dives' voices in turn", () => {
  const sunday = { first: "2026-11-29", voices: ["bompa", "concrete", "santa-feist", "post-liquid", "absent-dimension"] };
  const plan = (d) => sundayPlan(d, sunday);
  assert.equal(plan("2026-11-28"), null, "a Saturday");
  assert.equal(plan("2026-11-22"), null, "a Sunday before the first");
  assert.deepEqual(plan("2026-11-29"), { number: 1, format: "deep-dive", voice: "bompa" });
  assert.deepEqual(plan("2026-12-06"), { number: 2, format: "roundtable", voice: null });
  assert.equal(plan("2026-12-13").voice, "concrete");
  assert.equal(plan("2027-01-24").voice, "absent-dimension", "across the new year, still in turn");
  assert.equal(plan("2027-02-07").voice, "bompa", "and round again");
});

test("the week's changes: people's commits to the lab and the site, not the machinery running", async () => {
  const dir = mkdtempSync(join(tmpdir(), "week-"));
  const git = (...a) => execFileSync("git", a, { cwd: dir, stdio: "ignore" });
  try {
    git("init", "-q", "-b", "main");
    const commit = (name, message) => git("-c", `user.name=${name}`, "-c", "user.email=x@y", "commit", "-q", "--allow-empty", "-m", message);
    commit("msmsim", "Two shifts a day");
    commit("kinocomputing-lab[bot]", "night shift 2026-11-25 (shift 1): $0.58");
    commit("MS", "subset: share 752-jade-otters");
    commit("msmsim", "Reading: the lab's list");
    assert.deepEqual(labChanges(dir, "2000-01-01"), ["Reading: the lab's list", "Two shifts a day"]);
    const site = await siteChanges("msmsim/kinocomputing", "2026-11-23", async () => [
      { commit: { author: { name: "msmsim" }, message: "Previews lead with the lead\n\nDetail." }, author: { login: "msmsim" } },
      { commit: { author: { name: "github-actions[bot]" }, message: "blyg: record state" }, author: { login: "github-actions[bot]" } },
      { commit: { author: { name: "kinocomputing-lab[bot]" }, message: "lab: $0.54" }, author: null },
      { commit: { author: { name: "msmsim" }, message: "motes: publish 021-amber-egrets (#24)" }, author: { login: "msmsim" } },
    ]);
    assert.deepEqual(site, ["Previews lead with the lead"]);
    assert.deepEqual(await siteChanges("x/y", "2026-11-23", async () => { throw new Error("offline"); }), [], "unreadable is nothing, not a failure");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

function makeWorld() {
  const root = mkdtempSync(join(tmpdir(), "lab-world-"));
  const lab = join(root, "lab");
  const kino = join(root, "kino");
  for (const path of ["tools", "config", "voices", "AGENT.md", "CHARTER.md", "package.json"]) cpSync(join(LAB, path), join(lab, path), { recursive: true });
  cpSync(join(LAB, "node_modules"), join(lab, "node_modules"), { recursive: true });
  for (const dir of ["state/questions", "outbox", "published", "journal", "experiments"]) mkdirSync(join(lab, dir), { recursive: true });
  writeFileSync(join(lab, "state/questions/q-001-test.md"), "---\nid: q-001\ntitle: A test question\nkind: experiment\nstatus: open\npriority: 1\n---\n\nWhy.\n");
  for (const path of ["tools", "notes/_note.html", "notes/_stream.html", "note.css", "favicon.svg", "favicon.ico", "apple-touch-icon.png", "kinocomputing-basic-og.jpg", "fonts"]) {
    if (existsSync(join(KINO, path))) cpSync(join(KINO, path), join(kino, path), { recursive: true });
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
    writeFileSync(join(w.lab, "MORNING.md"), "Last night's summary, already published.\n");
    const prep = w.node(w.lab, ["tools/prepare.mjs"], "2026-11-21T02:00:00Z");
    assert.match(read("state/last-morning.md"), /Last night's summary/, "last night's summary moves aside for the shift to read");
    assert.match(read("state/tonight.md"), /stopped at \*\*03:00 UTC\*\* \(60 minutes\)/, "the briefing gives the deadline");
    assert.match(read("state/tonight.md"), /The day publishes \*\*5 to 15 notes\*\* across its shifts, claims included/, "and the day's range");
    void prep;
    writeFileSync(join(w.lab, "outbox/lab-2026-11-21-half-done.md"), "---\nkind: notebook\n---\n\n**Half done**\n\nWhat got written before the stop.\n");
    const settled = w.node(w.lab, ["tools/settle.mjs"], "2026-11-21T03:05:00Z", { SHIFT_EXIT: "124" });
    assert.match(settled, /~\$0\.60 \(no cost report; counted at the cap\), published lab-2026-11-21-half-done/);
    const spend = JSON.parse(read("state/spend.jsonl").trim().split("\n").at(-1));
    assert.deepEqual([spend.usd, spend.estimated], [0.6, true]);
    const morning = read("MORNING.md");
    assert.match(morning, /hit its time limit and was stopped/);
    assert.match(morning, /No journal entry was written tonight/);
    const brief = readFileSync(join(w.kino, "notes/lab-2026-11-21-brief.html"), "utf8");
    assert.match(brief, /The researcher left no summary\./);
    assert.ok(!brief.includes("Last night"), "a shift that wrote no summary doesn't republish last night's");
    assert.match(brief, /Half done/, "what reached the outbox before the stop is published");
  } finally {
    w.dispose();
  }
});

test("a day of two shifts: the first takes its share, the second has the rest and no rotation; fifteen notes a day, claims included; one brief, updated with both", async () => {
  const w = makeWorld();
  const read = (p) => readFileSync(join(w.lab, p), "utf8");
  const note = (name, kind = "notebook") => writeFileSync(join(w.lab, `outbox/lab-2026-11-21-${name}.md`), `---\nkind: ${kind}\n---\n\n**${name}**\n\nA short note called ${name}.\n`);
  try {
    w.publish("2026-11-20T00:00:00Z");
    writeFileSync(join(w.lab, "state/paradigms.json"), JSON.stringify({ paradigms: [{ id: "photonic", name: "Photonic", group: "G", last_checked: null }] }));
    // Shift 1: breadth.
    assert.match(w.node(w.lab, ["tools/prepare.mjs"], "2026-11-21T02:23:00Z"), /shift 1, light run, \$0\.60/);
    assert.deepEqual(JSON.parse(read("state/run.json")).paradigms, ["photonic"]);
    for (let i = 1; i <= 10; i++) note(`first-${String(i).padStart(2, "0")}`);
    for (const c of ["a", "b"]) note(`claim-${c}`, "claim");
    writeFileSync(join(w.lab, "MORNING.md"), "The first shift went wide.\n\n## Waiting on a human\n\nNothing tonight.\n");
    writeFileSync(join(w.lab, "state/claude-output.json"), JSON.stringify({ total_cost_usd: 0.5, num_turns: 30, is_error: false }));
    w.node(w.lab, ["tools/settle.mjs"], "2026-11-21T03:20:00Z");
    assert.deepEqual(JSON.parse(read("state/last-settle.json")).shifts, [1]);

    // Shift 2: depth, with what's left of the day and no rotation.
    const prep = w.node(w.lab, ["tools/prepare.mjs"], "2026-11-21T05:07:00Z", { LAB_SHIFT: "2" });
    assert.match(prep, /shift 2, light run, \$1\.00/, "the rest of the day's money");
    assert.deepEqual(JSON.parse(read("state/run.json")).paradigms, [], "the rotation is the first shift's");
    assert.match(read("state/tonight.md"), /## Shift 2 of 2: depth[\s\S]*12 went out in today's earlier shift/);
    assert.match(read("state/last-morning.md"), /The first shift went wide/, "the second shift reads what the first said");
    for (const c of ["c", "d"]) note(`claim-${c}`, "claim");
    for (let i = 1; i <= 3; i++) note(`second-${i}`);
    writeFileSync(join(w.lab, "MORNING.md"), "The second shift went deep.\n\n## Waiting on a human\n\n- A paywalled paper only the PI can get.\n");
    writeFileSync(join(w.lab, "state/claude-output.json"), JSON.stringify({ total_cost_usd: 0.8, num_turns: 40, is_error: false }));
    w.node(w.lab, ["tools/settle.mjs"], "2026-11-21T06:00:00Z", { LAB_SHIFT: "2" });

    const published = readdirSync(join(w.lab, "published")).filter((f) => /(?:first|second|claim)-/.test(f));
    assert.equal(published.length, 15, "fifteen a day, claims included");
    const morning = read("MORNING.md");
    for (const n of [2, 3]) assert.match(morning, new RegExp(`Not published: lab-2026-11-21-second-${n} — over the 15-note daily limit`));
    assert.deepEqual(JSON.parse(read("state/last-settle.json")).shifts, [1, 2]);

    const briefMd = read("published/lab-2026-11-21-brief.md");
    assert.match(briefMd, /\*\*Lab brief: 21 November 2026\*\*\n\nThe first shift went wide\.\n\n\*\*Second shift\*\*\n\nThe second shift went deep\.\n\n\*\*Waiting on a human\*\*\n\n- A paywalled paper only the PI can get\.\n\n\*\*Published today\*\*/, "both shifts' own words, in order, then one Waiting on a human");
    assert.equal(briefMd.match(/Waiting on a human/g).length, 1, "once, not per shift; a 'nothing' says nothing");
    assert.match(briefMd, /\[first-01\][\s\S]*\[claim-d\][\s\S]*\[second-1\]/, "everything the day published");
    assert.match(briefMd, /The day's 2 shifts cost \$1\.30, on Claude Sonnet 5\.5\./);
    assert.ok(!/short of the lab/.test(briefMd), "fifteen is no shortfall");
    assert.match(readFileSync(join(w.kino, "notes/lab-2026-11-21-brief.html"), "utf8"), /<meta name="blyg:note" content="Updated with the day's second shift/);
  } finally {
    w.dispose();
  }
});

test("a short day is reported by its last shift, counting both", async () => {
  const w = makeWorld();
  try {
    w.publish("2026-11-20T00:00:00Z");
    w.node(w.lab, ["tools/prepare.mjs"], "2026-11-21T02:23:00Z");
    writeFileSync(join(w.lab, "outbox/lab-2026-11-21-one.md"), "---\nkind: notebook\n---\n\n**One**\n\nThe first shift's only note.\n");
    writeFileSync(join(w.lab, "state/claude-output.json"), JSON.stringify({ total_cost_usd: 0.3, num_turns: 9, is_error: false }));
    w.node(w.lab, ["tools/settle.mjs"], "2026-11-21T03:00:00Z");
    assert.ok(!/short of the lab/.test(readFileSync(join(w.lab, "published/lab-2026-11-21-brief.md"), "utf8")), "not yet: a shift is still to come");
    w.node(w.lab, ["tools/prepare.mjs"], "2026-11-21T05:07:00Z", { LAB_SHIFT: "2" });
    writeFileSync(join(w.lab, "outbox/lab-2026-11-21-two.md"), "---\nkind: notebook\n---\n\n**Two**\n\nThe second shift's only note.\n");
    writeFileSync(join(w.lab, "state/claude-output.json"), JSON.stringify({ total_cost_usd: 0.3, num_turns: 9, is_error: false }));
    w.node(w.lab, ["tools/settle.mjs"], "2026-11-21T06:00:00Z", { LAB_SHIFT: "2" });
    const shortDay = readFileSync(join(w.lab, "published/lab-2026-11-21-brief.md"), "utf8");
    assert.match(shortDay, /Only 2 notes were published today, short of the lab's daily 5\./);
    assert.match(shortDay, /\*\*Lab brief: 21 November 2026\*\*\n\nThe lab published 2 notes today over 2 shifts\.\n\nThe researcher left no summary\.\n\n\*\*Second shift\*\*/, "with no summary of its own to lead, settle's account of the day leads");
  } finally {
    w.dispose();
  }
});

test("paradigm rotation: tonight's paradigms in the briefing; entries publish as quotable fragments; the tracker quotes them; the rotation moves on only for those published", async () => {
  const w = makeWorld();
  const read = (p) => readFileSync(join(w.lab, p), "utf8");
  const write = (p, s) => writeFileSync(join(w.lab, p), s);
  try {
    w.publish("2026-11-20T00:00:00Z");
    const ids = ["photonic", "thermodynamic", "reversible", "quantum", "dna-molecular"];
    write("state/paradigms.json", JSON.stringify({ paradigms: ids.map((id, i) => ({ id, name: `Paradigm ${id}`, group: "Let physics compute", last_checked: i === 3 ? "2026-11-01" : i === 4 ? null : "2026-11-15" })) }));
    w.node(w.lab, ["tools/prepare.mjs"], "2026-11-21T02:00:00Z");
    const run = JSON.parse(read("state/run.json"));
    assert.deepEqual(run.paradigms, ["dna-molecular"], "5 paradigms in 14 days is 1 a night: the never-looked-at one");
    write("state/paradigms.json", JSON.stringify({ paradigms: ids.map((id) => ({ id, name: `Paradigm ${id}`, group: "Let physics compute", last_checked: null })) }));
    write("state/run.json", JSON.stringify({ ...run, paradigms: ["photonic", "thermodynamic"] }));
    assert.match(read("state/tonight.md"), /## Tonight's paradigms\n\n[\s\S]*\*\*Paradigm dna-molecular\*\* \(`dna-molecular`, Let physics compute\): never looked at/);
    const lens = regionFor("2026-11-21", JSON.parse(readFileSync(join(LAB, "config/lab.json"), "utf8")).regions);
    assert.match(read("state/tonight.md"), new RegExp(`## Tonight's regional lens\\n\\n\\*\\*${lens.name}\\.\\*\\* For each of tonight's paradigms, one more OpenAlex search limited to institutions there \\(\`--country ${lens.countries.join(",")}\`\\)`));
    assert.match(read("state/tonight.md"), /## Chatter \(leads, not evidence\)\n\nNone\./);
    assert.equal(JSON.parse(read("state/run.json")).region, lens.name);

    write("outbox/lab-2026-11-21-paradigm-photonic.md", "---\nkind: paradigm\nparadigm: photonic\n---\n\n**Photonic computing**\n\nLight does the linear algebra. Nothing measured has moved since the round-up.\n");
    write("outbox/lab-2026-11-21-paradigm-nowhere.md", "---\nkind: paradigm\nparadigm: nowhere\n---\n\n**Nowhere**\n\nNot on the list.\n");
    write("outbox/lab-2026-11-21-paradigm-long.md", `---\nkind: paradigm\nparadigm: reversible\n---\n\n**Long**\n\n${"word ".repeat(400)}\n`);
    write("outbox/lab-2026-11-21-paradigm-voiced.md", "---\nkind: paradigm\nparadigm: quantum\nvoice: concrete\n---\n\n**Voiced**\n\nIn a voice.\n");
    write("outbox/lab-2026-11-21-shelfless.md", "---\nkind: notebook\nsection: gossip\n---\n\n**Shelfless**\n\nNo such section.\n");
    write("outbox/lab-2026-11-21-tracker.md", "---\nkind: notebook\nsection: tracker\n---\n\n**The tracker**\n\nWhat it is.\n\n![[lab-2026-11-21-paradigm-photonic]]\n");
    write("MORNING.md", "Looked at photonics.\n");
    write("state/claude-output.json", JSON.stringify({ total_cost_usd: 0.5, num_turns: 9, is_error: false }));
    w.node(w.lab, ["tools/settle.mjs"], "2026-11-21T03:00:00Z");

    const entry = readFileSync(join(w.kino, "notes/lab-2026-11-21-paradigm-photonic.html"), "utf8");
    assert.ok(!/blyg:kind" content="thread"/.test(entry), "an entry is a fragment");
    const tracker = readFileSync(join(w.kino, "notes/lab-2026-11-21-tracker.html"), "utf8");
    assert.match(tracker, /<blockquote class="kino-quote" data-note="lab-2026-11-21-paradigm-photonic">/, "the tracker quotes it the same night");
    assert.match(entry, /<meta name="kino:section" content="tracker">/, "an entry is the tracker's");
    assert.match(tracker, /<meta name="kino:section" content="tracker">/, "and so is the tracker, because it asked");
    assert.match(readFileSync(join(w.kino, "notes/lab-2026-11-21-brief.html"), "utf8"), /<meta name="kino:section" content="briefs">/);
    const listed = JSON.parse(readFileSync(join(w.kino, "notes/_tracker.json"), "utf8"));
    assert.equal(listed.updated, "2026-11-21");
    assert.deepEqual(listed.groups.map((g) => g.name), ["Let physics compute"]);
    assert.deepEqual(listed.groups[0].paradigms.slice(0, 2), [
      { id: "photonic", name: "Paradigm photonic", last_checked: "2026-11-21", entry: "lab-2026-11-21-paradigm-photonic" },
      { id: "thermodynamic", name: "Paradigm thermodynamic", last_checked: null, entry: null },
    ], "every paradigm, with its entry when it has one");
    const morning = read("MORNING.md");
    assert.match(morning, /Not published: lab-2026-11-21-paradigm-nowhere — a paradigm entry names its paradigm, and "nowhere" isn't one/);
    assert.match(morning, /Not published: lab-2026-11-21-paradigm-long is a paradigm entry of \d+ characters/);
    assert.match(morning, /Not published: lab-2026-11-21-paradigm-voiced is a paradigm in a voice/);
    assert.match(morning, /Not published: lab-2026-11-21-shelfless asks for the section "gossip", which the site doesn't have/);
    assert.match(morning, /Tonight's paradigms not looked at, so they come round again: thermodynamic\./);
    const after = JSON.parse(read("state/paradigms.json")).paradigms;
    assert.deepEqual(after.map((p) => p.last_checked), ["2026-11-21", null, null, null, null]);
    assert.match(readFileSync(join(w.kino, "notes/lab-2026-11-21-brief.html"), "utf8"), /Photonic computing<\/a>, a paradigm entry/);

    // An entry stays an entry.
    write("outbox/lab-2026-11-21-paradigm-photonic.md", "---\nkind: notebook\nchange_note: now a write-up\n---\n\n**Photonic computing**\n\nLonger now.\n");
    w.node(w.lab, ["tools/prepare.mjs"], "2026-11-22T02:00:00Z");
    w.node(w.lab, ["tools/settle.mjs"], "2026-11-22T03:00:00Z");
    assert.match(read("MORNING.md"), /a note's kind can't change/);

    // Every update says what changed.
    write("outbox/lab-2026-11-21-paradigm-photonic.md", "---\nkind: paradigm\nparadigm: photonic\n---\n\n**Photonic computing**\n\nA new measured result.\n");
    w.node(w.lab, ["tools/prepare.mjs"], "2026-11-23T02:00:00Z");
    w.node(w.lab, ["tools/settle.mjs"], "2026-11-23T03:00:00Z");
    assert.match(read("MORNING.md"), /Not published: lab-2026-11-21-paradigm-photonic — an update needs a change note/);
    write("outbox/lab-2026-11-21-paradigm-photonic.md", "---\nkind: paradigm\nparadigm: photonic\nchange_note: a new measured result\n---\n\n**Photonic computing**\n\nA new measured result.\n");
    w.node(w.lab, ["tools/prepare.mjs"], "2026-11-24T02:00:00Z");
    w.node(w.lab, ["tools/settle.mjs"], "2026-11-24T03:00:00Z");
    assert.match(readFileSync(join(w.kino, "notes/lab-2026-11-21-paradigm-photonic.html"), "utf8"), /<meta name="blyg:note" content="a new measured result">/);
  } finally {
    w.dispose();
  }
});

test("check-shift: which shift a run is, and whether it should work it", () => {
  const dir = mkdtempSync(join(tmpdir(), "check-"));
  const file = join(dir, "last-settle.json");
  const check = (env, settled) => {
    if (settled === null) rmSync(file, { force: true });
    else writeFileSync(file, JSON.stringify(settled));
    const r = spawnSync("bash", [join(LAB, "tools/check-shift.sh"), file, "2026-11-24"], { encoding: "utf8", env: { PATH: process.env.PATH, ...env } });
    return r.stdout.trim().replace(/\n/g, " ");
  };
  const today = (shifts) => ({ date: "2026-11-24", ...(shifts ? { shifts } : {}) });
  try {
    assert.equal(check({ EVENT: "schedule", SCHEDULE: "23 2 * * *" }, null), "shift=1 go=true");
    assert.equal(check({ EVENT: "schedule", SCHEDULE: "41 3 * * *" }, today([1])), "shift=1 go=false", "the backup stands down");
    assert.equal(check({ EVENT: "schedule", SCHEDULE: "41 3 * * *" }, { date: "2026-11-23", shifts: [1, 2] }), "shift=1 go=true", "yesterday's doesn't count");
    assert.equal(check({ EVENT: "schedule", SCHEDULE: "41 3 * * *" }, today(null)), "shift=1 go=false", "a settle from before shifts were counted was a first shift");
    assert.equal(check({ EVENT: "workflow_dispatch", NIGHTLY: "true", ASKED: "2" }, today([1])), "shift=2 go=true");
    assert.equal(check({ EVENT: "workflow_dispatch", NIGHTLY: "true", ASKED: "2" }, today([1, 2])), "shift=2 go=false");
    assert.equal(check({ EVENT: "schedule", SCHEDULE: "7 5 * * *" }, null), "shift=2 go=false", "the second waits for the first");
    assert.equal(check({ EVENT: "schedule", SCHEDULE: "29 6 * * *" }, today([1])), "shift=2 go=true");
    assert.equal(check({ EVENT: "workflow_dispatch", ASKED: "2" }, today([1, 2])), "shift=2 go=true", "by hand always goes ahead");
    assert.equal(check({ EVENT: "workflow_dispatch", ASKED: "7" }, null), "shift=1 go=true", "anything else is a first shift");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("shares from Subset: waiting in reading/, briefed like takes, offered again until handled, kept as sent", async () => {
  const w = makeWorld();
  const read = (p) => readFileSync(join(w.lab, p), "utf8");
  try {
    w.publish("2026-11-20T00:00:00Z");
    mkdirSync(join(w.lab, "reading"));
    cpSync(join(LAB, "reading/_note.html"), join(w.lab, "reading/_note.html"));
    // As the receiver writes one: the PI's note, two excerpts, and the link.
    writeFileSync(join(w.lab, "reading/500-amber-owls.html"), [
      "<!DOCTYPE html>", "<html><head><title>500-amber-owls</title></head><body>", "<main>",
      "<p>Worth checking against the tracker.</p>",
      "<blockquote><p>The chip ran at 10 fJ per operation.</p></blockquote>",
      "<blockquote><p>Measured on silicon, not simulated.</p></blockquote>",
      "<p>A second thought of mine.</p>",
      '<p class="source"><a href="https://example.org/chip?a=1&amp;b=2">A new photonic chip ↗</a></p>',
      "</main>", "</body></html>", "",
    ].join("\n"));
    w.commit();
    w.node(w.lab, ["tools/prepare.mjs"], "2026-11-21T02:00:00Z");
    const tonight = read("state/tonight.md");
    assert.match(tonight, /## The PI's takes and shares[\s\S]*### share:500-amber-owls\n\nA share from Subset/);
    assert.match(tonight, /> Shared: A new photonic chip\n> Worth checking against the tracker\.\n> Excerpt: “The chip ran at 10 fJ per operation\.”/);
    assert.match(tonight, /Links:\n- https:\/\/example\.org\/chip\?a=1&b=2/);
    assert.match(tonight, /https:\/\/github\.com\/msmsim\/kinocomputing-lab\/blob\/main\/reading\/500-amber-owls\.html/);

    // The shift edits a share and doesn't record it: the share is put back, and offered again.
    writeFileSync(join(w.lab, "reading/500-amber-owls.html"), "tampered");
    execFileSync("bash", ["tools/restore-machinery.sh"], { cwd: w.lab, encoding: "utf8" });
    assert.match(read("reading/500-amber-owls.html"), /Worth checking against the tracker/, "kept as sent");
    w.node(w.lab, ["tools/settle.mjs"], "2026-11-21T03:00:00Z");
    assert.match(read("MORNING.md"), /Takes not handled, offered again tomorrow: share:500-amber-owls/);
    w.commit();
    w.node(w.lab, ["tools/prepare.mjs"], "2026-11-22T02:00:00Z");
    assert.match(read("state/tonight.md"), /### share:500-amber-owls/, "offered again");

    // Recorded, but neither in the hopper nor disregarded with a reason: offered again.
    writeFileSync(join(w.lab, "state/steers.jsonl"), `${JSON.stringify({ steer: "share:500-amber-owls", action: "read it" })}\n`);
    w.node(w.lab, ["tools/settle.mjs"], "2026-11-22T03:00:00Z");
    assert.match(read("MORNING.md"), /share:500-amber-owls was recorded but is neither in the hopper nor disregarded with a reason/);
    assert.equal(JSON.parse(read("state/seen.json")).takes["share:500-amber-owls"], undefined);
    w.commit();

    // Handled: in the hopper, with the lab's line on it; marked seen, not offered again.
    w.node(w.lab, ["tools/prepare.mjs"], "2026-11-22T05:07:00Z", { LAB_SHIFT: "2" });
    writeFileSync(join(w.lab, "state/paradigms.json"), JSON.stringify({ paradigms: [{ id: "photonic", name: "Photonic", group: "G", last_checked: null }] }));
    writeFileSync(join(w.lab, "state/hopper.jsonl"), [
      { url: "https://example.org/chip?a=1&b=2", title: "A new photonic chip", why: "A measured 10 fJ per operation, on silicon.", paradigms: ["photonic", "made-up"], share: "500-amber-owls" },
      { url: "https://arxiv.org/abs/2611.00001", title: "A reservoir paper", why: "Found while checking the reservoir entry.", from: "lab" },
      { url: "https://example.org/bad", title: "Bad", why: "As e002 showed." },
    ].map((l) => JSON.stringify(l)).join("\n") + "\n");
    w.node(w.lab, ["tools/settle.mjs"], "2026-11-22T06:00:00Z", { LAB_SHIFT: "2" });
    assert.equal(JSON.parse(read("state/seen.json")).takes["share:500-amber-owls"], 1);
    assert.match(read("MORNING.md"), /A hopper line says "e002", which readers can't look up/);
    const shown = JSON.parse(readFileSync(join(w.kino, "notes/_hopper.json"), "utf8"));
    assert.deepEqual(shown.items.map((i) => [i.id, i.from, i.site, i.paradigms.join(",")]), [
      ["500-amber-owls", "pi", "example.org", "photonic"],
      [shown.items[1].id, "lab", "arxiv.org", ""],
    ], "a share keeps its receiver's name, which is the address Subset was told; unknown paradigms dropped; the bad line left out");
    assert.match(shown.items[1].id, /^r-[0-9a-f]{10}$/);
    assert.ok(!JSON.stringify(shown).includes("Worth checking"), "the lab's line only, never the PI's own words");
    const brief = read("published/lab-2026-11-22-brief.md");
    assert.match(brief, /\*\*New in Reading\*\*\n\n- \[A new photonic chip\]\(https:\/\/example\.org\/chip\?a=1&b=2\): A measured 10 fJ/);
    assert.match(brief, /All of it: \[Reading\]\(https:\/\/www\.kinocomputing\.com\/reading\)/);

    // Left out only with a reason.
    writeFileSync(join(w.lab, "reading/501-ash-bees.html"), '<main>\n<p class="source"><a href="https://example.org/spam">Off topic ↗</a></p>\n</main>\n');
    w.commit();
    w.node(w.lab, ["tools/prepare.mjs"], "2026-11-23T02:00:00Z");
    writeFileSync(join(w.lab, "state/steers.jsonl"), `${read("state/steers.jsonl")}${JSON.stringify({ steer: "share:501-ash-bees", action: "left out", disregarded: "A product page, nothing to read." })}\n`);
    w.node(w.lab, ["tools/settle.mjs"], "2026-11-23T03:00:00Z");
    assert.equal(JSON.parse(read("state/seen.json")).takes["share:501-ash-bees"], 1, "disregarded, with a reason, counts as handled");
    w.commit();
    assert.ok(!read("state/tonight.md").includes("share:500-amber-owls"), "handled once, gone");
  } finally {
    w.dispose();
  }
});

test("a Sunday: the week in review first, then the deep dive or roundtable on the deep model, with a longer clock, from the bank; a floor of two", async () => {
  const w = makeWorld();
  const read = (p) => readFileSync(join(w.lab, p), "utf8");
  try {
    w.publish("2026-11-20T00:00:00Z");
    writeFileSync(join(w.lab, "state/paradigms.json"), JSON.stringify({ paradigms: [{ id: "photonic", name: "Photonic", group: "G", last_checked: "2026-11-25" }] }));
    writeFileSync(join(w.lab, "published/lab-2026-11-25-brief.md"), "---\nkind: brief\n---\n\n**Lab brief: 25 November 2026**\n");
    writeFileSync(join(w.lab, "published/lab-2026-11-26-photonic-note.md"), "---\nkind: notebook\n---\n\n**A photonic note**\n\nIts lead.\n");
    writeFileSync(join(w.lab, "published/lab-2026-11-20-too-old.md"), "---\nkind: notebook\n---\n\n**Too old**\n\nLast week.\n");
    writeFileSync(join(w.lab, "state/claims.jsonl"), `${JSON.stringify({ id: "c-009", stage: "simulated", statement: "Converters dominate small arrays.", at: "2026-11-25T05:00:00Z" })}\n`);
    w.commit();

    w.node(w.lab, ["tools/prepare.mjs"], "2026-11-29T02:23:00Z");
    let run = JSON.parse(read("state/run.json"));
    assert.deepEqual([run.paradigms, run.minutes, run.sunday], [[], 60, { number: 1, format: "deep-dive", voice: "bompa", job: "week-in-review" }], "no rotation; the week in review");
    const first = read("state/tonight.md");
    assert.match(first, /## Sunday 1, shift 1: the week in review\n\nNo rotation today\. Write the week in review for 2026-11-23 to 2026-11-29/);
    assert.match(first, /- `published\/lab-2026-11-25-brief\.md`/);
    assert.match(first, /- `lab-2026-11-26-photonic-note` \(notebook\): A photonic note/);
    assert.ok(!first.includes("(notebook): Too old"), "the week, not before");
    assert.match(first, /- c-009 → simulated: Converters dominate small arrays\./);
    assert.match(first, /Paradigms looked at this week: Photonic\./);
    assert.match(first, /What changed in how the lab works[^\n]*\n\n- night\n- seed/, "people's commits to the lab");
    assert.match(first, /The second shift writes a deep dive in Bompa's voice/);
    assert.ok(!first.includes("## Tonight's paradigms\n\nThe rotation"), "no paradigms tonight");

    writeFileSync(join(w.lab, "outbox/lab-2026-11-29-the-week.md"), "---\nkind: notebook\n---\n\n**The week the converters won**\n\nThe week's lead.\n");
    writeFileSync(join(w.lab, "state/claude-output.json"), JSON.stringify({ total_cost_usd: 0.5, num_turns: 9, is_error: false }));
    w.node(w.lab, ["tools/settle.mjs"], "2026-11-29T03:00:00Z");
    w.commit();

    w.node(w.lab, ["tools/prepare.mjs"], "2026-11-29T05:07:00Z", { LAB_SHIFT: "2" });
    run = JSON.parse(read("state/run.json"));
    assert.deepEqual([run.kind, run.model, run.minutes], ["deep", "claude-opus-5-5", 120], "the deep model, a longer clock");
    assert.ok(run.max_usd > 0 && run.max_usd + (run.exa_usd ?? 0) <= 4, "from the bank, at most its Sunday's draw");
    const second = read("state/tonight.md");
    assert.match(second, /## Sunday 1, shift 2: a deep dive, in Bompa's voice\n\nOne piece of 3000 to 5000 words, in Bompa's voice \(`voice: bompa`\)/);
    assert.match(second, /stopped at \*\*07:07 UTC\*\* \(120 minutes\)/);

    writeFileSync(join(w.lab, "outbox/lab-2026-11-29-deep-dive.md"), "---\nkind: analysis\nvoice: bompa\n---\n\n**The road not taken**\n\nThe analog computer was winning in 1955.\n");
    writeFileSync(join(w.lab, "state/claude-output.json"), JSON.stringify({ total_cost_usd: 2.9, num_turns: 40, is_error: false }));
    w.node(w.lab, ["tools/settle.mjs"], "2026-11-29T07:00:00Z", { LAB_SHIFT: "2" });
    assert.ok(!/short of the lab/.test(read("published/lab-2026-11-29-brief.md")), "two is Sunday's floor");
    w.commit();

    w.node(w.lab, ["tools/prepare.mjs"], "2026-12-06T05:07:00Z", { LAB_SHIFT: "2" });
    assert.match(read("state/tonight.md"), /## Sunday 2, shift 2: the roundtable\n\nThe roundtable: all five voices on one question orthogonal to the week, each turn written by the `voice` subagent in that voice\. Positions of at most 150 words, rebuttals of at most 120, the crux in at most 100, and a bet each of at most 80/);
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
    assert.match(prep, /shift 1, light run, \$0\.40 on claude-sonnet-5-5 \+ \$0\.20 Exa, 0 take\(s\), 1 open question/, "the first shift takes its 40% of the day");
    const run = JSON.parse(read("state/run.json"));
    assert.equal(run.baseline, true);
    assert.equal(Math.round((run.exa_usd + run.max_usd) * 100) / 100, 0.6, "one pot: Exa's slice comes out of the shift's money");

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
    write("MORNING.md", "# 2026-11-21\n\nPublished a first look.\n\n### Waiting on a human\n\nNothing tonight.\n");
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
    assert.match(brief, /<p><strong>Waiting on a human<\/strong><\/p>/, "the shift's headings read like the brief's own");
    assert.ok(!/<h[1-6]>Waiting/.test(brief));
    assert.match(brief, /<a href="https:\/\/www\.kinocomputing\.com\/lab-2026-11-21-first-look">First look<\/a>/);
    assert.match(brief, /The automatic rerun of the draw experiment on fresh random numbers reached the same verdict as the original/);
    assert.match(brief, /4 notes were held back/);
    assert.ok(!/short of the lab/.test(brief), "the floor is the day's, judged by its last shift");
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
    assert.match(brief2, /didn.t pass the publishing checks; it/);
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
