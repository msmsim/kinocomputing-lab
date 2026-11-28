// The lab's parts one at a time: money, steers, search, sources, rendering, figures, replication, the shift checks.
// Nothing here calls a model or the network: the agent's part is played by
// a script. Shared fixtures are in helpers.mjs.

import { test } from "node:test";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { allowance, frontMatter, KINO, LAB, regionFor, rotation, sundayPlan } from "../tools/lib.mjs";
import { labChanges, siteChanges, siteShipped } from "../tools/week.mjs";
import * as sources from "../tools/sources.mjs";
import { checkImage, sketch } from "../tools/figure.mjs";
import { takeSteers } from "../tools/steers.mjs";
import { renderNote } from "../tools/render.mjs";
import { arxivQuery, exaAgent, exaBody, exaLeft, parseArxiv, parseExa, parseOpenAlex, search, unInvert } from "../tools/search.mjs";
import { replicateAll } from "../tools/replicate.mjs";
import { judge, MOST_LINES } from "../tools/fast-lane.mjs";
import { BUDGET, KINO_ORIGIN, EXPERIMENT, ARGS, makeWorld } from "./helpers.mjs";

test("night shift: what settle writes into kinocomputing is what the workflow publishes", () => {
  const settle = readFileSync(join(LAB, "tools/settle.mjs"), "utf8");
  // Straight to kinocomputing, or by way of held/ (tools/release.mjs).
  const written = new Set([...settle.matchAll(/join\(KINO, "([^"/]+)|place\(`([a-z]+)\//g)].map((m) => m[1] ?? m[2]));
  for (const dir of ["notes", "media"]) assert.ok(written.has(dir), `settle writes ${dir}/`);
  const read = new Set(["blyg"]); // read for quotes, never written
  // The night's workflow publishes what settle writes; the release workflow,
  // what it held.
  for (const workflow of ["night-shift.yml", "release.yml"]) {
    const flow = readFileSync(join(LAB, ".github/workflows", workflow), "utf8");
    const publish = flow.slice(flow.indexOf("- name: Publish to kinocomputing"));
    const status = publish.match(/git status --porcelain ([^)]+)\)/)[1].split(/\s+/);
    const added = publish.match(/git add ([^\n]+)/)[1].split(/\s+/);
    for (const dir of [...written].filter((d) => !read.has(d))) {
      assert.ok(status.includes(dir) && added.includes(dir), `${dir}/ is written by settle but ${workflow} never publishes it`);
    }
  }
});

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
    // The roadmap's headlines done in the week, from the site's public copy.
    let asked = null;
    const shipped = await siteShipped("msmsim/kinocomputing", "2026-11-23", "2026-11-29", async (url) => { asked = url; return { items: [
      { id: "r1", headline: "Before the week", status: "done", moves: [{ to: "done", on: "2026-11-22" }] },
      { id: "r3", headline: " Late in the week ", status: "done", moves: [{ to: "done", on: "2026-11-28" }] },
      { id: "r2", headline: "Early in the week", status: "done", moves: [{ to: "now", on: "2026-11-23" }, { to: "done", on: "2026-11-24" }] },
      { id: "r4", headline: "Still under way", status: "now", moves: [{ to: "done", on: "2026-11-25" }, { to: "now", on: "2026-11-26" }] },
      { id: "r5", headline: "After the week", status: "done", moves: [{ to: "done", on: "2026-11-30" }] },
      { id: "bad", headline: "Not an item", status: "done", moves: [{ to: "done", on: "2026-11-25" }] },
    ] }; });
    assert.equal(asked, "https://raw.githubusercontent.com/msmsim/kinocomputing/main/notes/_roadmap.json");
    assert.deepEqual(shipped, [{ id: "r2", headline: "Early in the week", on: "2026-11-24" }, { id: "r3", headline: "Late in the week", on: "2026-11-28" }]);
    assert.deepEqual(await siteShipped("x/y", "2026-11-23", "2026-11-29", async () => { throw new Error("offline"); }), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("search: every search is logged, free or paid, with the shift that ran it", () => {
  const dir = mkdtempSync(join(tmpdir(), "search-log-"));
  try {
    mkdirSync(join(dir, "state"));
    mkdirSync(join(dir, "tools"));
    cpSync(join(LAB, "tools"), join(dir, "tools"), { recursive: true });
    writeFileSync(join(dir, "state/run.json"), JSON.stringify({ date: "2026-11-21", shift: 2 }));
    spawnSync(process.execPath, ["tools/search.mjs", "no-such-source", "a query", "--country", "jp"], { cwd: dir, encoding: "utf8", env: { ...process.env, LAB_DIR: dir } });
    const [line] = readFileSync(join(dir, "state/search-log.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
    assert.deepEqual([line.date, line.shift, line.source, line.query, line.country], ["2026-11-21", 2, "no-such-source", "a query", "jp"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
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
    assert.equal(check({ EVENT: "workflow_dispatch", NIGHTLY: "true", ASKED: "1" }, today([1])), "shift=2 go=true", "the scheduler's run after the first is the second, asked or not");
    assert.equal(check({ EVENT: "workflow_dispatch", NIGHTLY: "true", ASKED: "1" }, today([1, 2])), "shift=2 go=false");
    assert.equal(check({ EVENT: "workflow_dispatch", NIGHTLY: "true", ASKED: "1" }, null), "shift=1 go=true");
    assert.equal(check({ EVENT: "workflow_dispatch", ASKED: "1" }, today([1])), "shift=1 go=true", "by hand, as asked");
    assert.equal(check({ EVENT: "schedule", SCHEDULE: "7 5 * * *" }, null), "shift=2 go=false", "the second waits for the first");
    assert.equal(check({ EVENT: "schedule", SCHEDULE: "29 6 * * *" }, today([1])), "shift=2 go=true");
    assert.equal(check({ EVENT: "workflow_dispatch", ASKED: "2" }, today([1, 2])), "shift=2 go=true", "by hand always goes ahead");
    assert.equal(check({ EVENT: "workflow_dispatch", ASKED: "7" }, null), "shift=1 go=true", "anything else is a first shift");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a failed settle still counts its shift as worked, says so in MORNING.md, and the run goes on to commit then turns red", () => {
  const dir = mkdtempSync(join(tmpdir(), "settle-failed-"));
  const lab = (p) => join(dir, p);
  const env = { PATH: process.env.PATH };
  const failed = () => spawnSync("bash", [join(LAB, "tools/settle-failed.sh"), "1", dir], { encoding: "utf8", env }).stdout.trim();
  const check = (asked) => spawnSync("bash", [join(LAB, "tools/check-shift.sh"), lab("state/last-settle.json"), "2026-11-28"], {
    encoding: "utf8", env: { ...env, EVENT: "workflow_dispatch", NIGHTLY: "true", ASKED: asked },
  }).stdout.trim().replace(/\n/g, " ");
  try {
    mkdirSync(lab("state"), { recursive: true });
    // Yesterday's settle is the last one recorded, as on the 28th.
    writeFileSync(lab("state/last-settle.json"), JSON.stringify({ date: "2026-11-27", shift: 1, shifts: [1] }));
    writeFileSync(lab("state/run.json"), JSON.stringify({ date: "2026-11-28", shift: 1 }));
    writeFileSync(lab("MORNING.md"), "The shift's own summary.\n");
    assert.equal(failed(), "settle failed (exit 1); published as far as it got");
    const settled = JSON.parse(readFileSync(lab("state/last-settle.json"), "utf8"));
    assert.deepEqual([settled.date, settled.shifts, settled.settle_failed], ["2026-11-28", [1], true]);
    assert.equal(check("1"), "shift=2 go=true", "the 05:07 run works the second shift, not the first again");
    assert.match(readFileSync(lab("MORNING.md"), "utf8"), /^The shift's own summary\.\n\n## From settle\n\n- Settle failed \(exit 1\)/);

    writeFileSync(lab("state/run.json"), JSON.stringify({ date: "2026-11-28", shift: 2 }));
    failed();
    assert.deepEqual(JSON.parse(readFileSync(lab("state/last-settle.json"), "utf8")).shifts, [1, 2]);
    assert.equal(check("2"), "shift=2 go=false");

    const workflow = readFileSync(join(LAB, ".github/workflows/night-shift.yml"), "utf8");
    assert.match(workflow, /code=\$\{PIPESTATUS\[0\]\}/, "settle's own exit code, not tee's");
    assert.match(workflow, /bash tools\/settle-failed\.sh "\$code"/);
    assert.ok(workflow.indexOf("name: Settle failed") > workflow.indexOf("name: Publish to kinocomputing"), "red only after the night is committed and published");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("figure: the house rules", () => {
  const svg = (inner, box = "0 0 640 300") => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}">${inner}</svg>`);
  assert.deepEqual(checkImage(svg('<text font-size="20" fill="#1a1a1a">ok</text>'), "fig-a.svg").problems, []);
  assert.match(checkImage(svg('<text font-size="20" fill="#c8553d">no</text>'), "fig-a.svg").problems.join(), /vermilion/);
  assert.match(checkImage(svg('<text font-size="14" fill="#1a1a1a">small</text>'), "fig-a.svg").problems.join(), /can't be read/);
  assert.deepEqual(checkImage(svg('<text font-size="14" fill="#1a1a1a">a small drawing shows at its own size</text>', "0 0 300 200"), "fig-a.svg").problems, []);
  assert.match(checkImage(svg('<a href="https://x.example/"><path d="M0 0"/></a>'), "fig-a.svg").problems.join(), /fetches something/);
  assert.match(checkImage(svg('<path onclick="x()" d="M0 0"/>'), "fig-a.svg").problems.join(), /event handler/);
  assert.match(checkImage(svg('<path stroke="#000" d="M0 0"/>'), "fig-a.svg").problems.join(), /pure black/);
  assert.equal(checkImage(svg(""), "plate-b.svg").kind, "plate");
  assert.match(checkImage(Buffer.from("GIF89a"), "fig.gif").problems.join(), /images are SVG, or PNG/);
  // No background: on the dark page it would be a slab of light.
  assert.match(checkImage(svg('<rect width="640" height="300" fill="#cbdff7"/><path d="M0 0" stroke="#1a1a1a"/>'), "plate-c.svg").problems.join(), /has a background/);
  assert.match(checkImage(svg('<rect width="100%" height="100%" style="fill:#e6f1fe"/>'), "plate-c.svg").problems.join(), /has a background/);
  assert.deepEqual(checkImage(svg('<rect width="640" height="300" fill="none" stroke="#1a1a1a"/><rect x="10" y="10" width="200" height="100" fill="#e6f1fe"/>'), "plate-c.svg").problems, [], "a frame, or a filled shape, isn't one");
  const png = (colourType) => { const b = Buffer.alloc(40); b.writeUInt32BE(0x89504e47, 0); b.writeUInt32BE(640, 16); b.writeUInt32BE(300, 20); b[25] = colourType; return b; };
  assert.match(checkImage(png(2), "fig-d.png").problems.join(), /no transparency/);
  assert.deepEqual(checkImage(png(6), "fig-d.png").problems, []);
});

test("figure: the organic shapes draw in the house style, the same every time, with no background", () => {
  const spec = JSON.parse(readFileSync(join(LAB, "config/house/plate-example.json"), "utf8"));
  const drawn = sketch(spec);
  assert.equal(drawn, sketch(spec), "seeded: the same drawing every time");
  assert.deepEqual(checkImage(Buffer.from(drawn), "plate-example.svg").problems, []);
  assert.ok(!/NaN/.test(drawn));
  const types = new Set(spec.elements.map((e) => e.type));
  for (const t of ["blob", "trail", "flow", "spiral"]) assert.ok(types.has(t), `the example shows ${t}`);
  assert.match(drawn, /<g opacity="0\.[0-9]+">/, "a trail's echoes fade");
  const hairy = sketch({ elements: [{ type: "blob", x: 100, y: 100, r: 40, cilia: 10 }] });
  const bare = sketch({ elements: [{ type: "blob", x: 100, y: 100, r: 40 }] });
  assert.ok((hairy.match(/<path/g) ?? []).length >= (bare.match(/<path/g) ?? []).length + 8, "cilia");
});

test("timebox: stops a command past its limit with 124, passes an exit code through", () => {
  const started = Date.now();
  const slow = spawnSync(process.execPath, [join(LAB, "tools/timebox.mjs"), "1", "sleep", "10"], { encoding: "utf8" });
  assert.equal(slow.status, 124);
  assert.ok(Date.now() - started < 6000, "stopped at the limit, not left to finish");
  const quick = spawnSync(process.execPath, [join(LAB, "tools/timebox.mjs"), "5", "sh", "-c", "exit 3"], { encoding: "utf8" });
  assert.equal(quick.status, 3);
});

test("fast lane: small, away from the lab's judges, a test added and none taken out", () => {
  const f = (path, added, removed = 0) => ({ path, added, removed });
  assert.equal(judge([f("tools/search.mjs", 6, 2), f("test/unit.test.mjs", 12)], 0).fast, true);
  assert.equal(judge([f("voices/bompa.md", 3, 1)], 0).fast, true, "no code, no test needed");
  assert.match(judge([f("tools/settle.mjs", 1, 1), f("test/unit.test.mjs", 5)], 0).why, /tools\/settle\.mjs, which the fast lane doesn't cover/);
  for (const judgeOfJudges of ["test/mutants.mjs", "test/helpers.mjs", "test/mutants.json", "tools/fast-lane.mjs", ".github/workflows/tests.yml", "config/lab.json", "AGENT.md", "package.json"]) {
    assert.equal(judge([f(judgeOfJudges, 1)], 0).fast, false, judgeOfJudges);
  }
  assert.match(judge([f("tools/search.mjs", 2), f("test/unit.test.mjs", 3, 1)], 1).why, /takes 1 line\(s\) out of the tests/);
  assert.match(judge([f("tools/search.mjs", 2)], 0).why, /changes code without adding a test/);
  assert.match(judge([f("tools/search.mjs", MOST_LINES), f("test/unit.test.mjs", 5)], 0).why, /more than the fast lane's/);
  assert.equal(judge([], 0).fast, false);
});

test("emphases: a malformed file is named, not used; Matt's order; the week is seven days; the lead is the one served longest ago", async () => {
  const { readEmphases, currentOn, pastOn, coverage, leading } = await import("../tools/emphases.mjs");
  const dir = mkdtempSync(join(tmpdir(), "emph-"));
  try {
    mkdirSync(join(dir, "emphases"));
    mkdirSync(join(dir, "published"));
    const e = (id, fm, body = "Why.") => writeFileSync(join(dir, "emphases", `${id}.md`), `---\n${fm}\n---\n\n${body}\n`);
    e("b", "title: B\nfrom: 2026-11-01\nuntil: 2026-12-31\norder: 1");
    e("a", "title: A\nfrom: 2026-11-01");
    e("done", "title: Done\nfrom: 2026-10-01\nuntil: 2026-10-31");
    e("later", "title: Later\nfrom: 2026-12-01");
    e("Bad Name", "title: X\nfrom: 2026-11-01");
    e("nodate", "title: X");
    e("nowhy", "title: X\nfrom: 2026-11-01", "- [only a link](https://example.org)");
    const { all, errors } = readEmphases(dir);
    assert.equal(errors.length, 3);
    assert.deepEqual(currentOn(all, "2026-11-20").map((x) => x.id), ["b", "a"], "Matt's order first, then by name; not ended, not yet begun");
    assert.deepEqual(pastOn(all, "2026-11-20").map((x) => x.id), ["done"]);
    const note = (name, emph) => writeFileSync(join(dir, "published", `${name}.md`), `---\nemphasis: ${emph}\n---\n\n**x**\n`);
    note("lab-2026-11-13-old", "a");
    note("lab-2026-11-14-edge", "a");
    note("lab-2026-11-19-b", "b");
    note("lab-2026-11-21-tomorrow", "b");
    const counts = coverage(dir, currentOn(all, "2026-11-20"), "2026-11-20");
    assert.deepEqual(counts, { b: { week: 1, last: "2026-11-19" }, a: { week: 1, last: "2026-11-14" } }, "seven days to the day: the 14th in, the 13th out; nothing from after");
    assert.equal(leading(currentOn(all, "2026-11-20"), counts).id, "a");
    assert.equal(leading([], {}), null);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
