// Whole nights end to end, and a shift stopped at its time limit.
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
import { labChanges, siteChanges } from "../tools/week.mjs";
import * as sources from "../tools/sources.mjs";
import { checkImage, sketch } from "../tools/figure.mjs";
import { takeSteers } from "../tools/steers.mjs";
import { renderNote } from "../tools/render.mjs";
import { arxivQuery, exaAgent, exaBody, exaLeft, parseArxiv, parseExa, parseOpenAlex, search, unInvert } from "../tools/search.mjs";
import { replicateAll } from "../tools/replicate.mjs";
import { BUDGET, KINO_ORIGIN, EXPERIMENT, ARGS, makeWorld } from "./helpers.mjs";

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
    w.release("2026-11-21T08:45:00Z");
    const brief = readFileSync(join(w.kino, "notes/lab-2026-11-21-brief.html"), "utf8");
    assert.match(brief, /The researcher left no summary\./);
    assert.ok(!brief.includes("Last night"), "a shift that wrote no summary doesn't republish last night's");
    assert.match(brief, /Half done/, "what reached the outbox before the stop is published");
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
    assert.match(settled, /\$0\.42, \$0\.01 Exa, 1 claim\(s\), published lab-2026-11-21-first-look, held the brief for 08:45/);
    // The brief: the shift's own words, what went out, and what settle saw, for anyone.
    w.release("2026-11-21T08:45:00Z");
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
    w.release("2026-11-22T08:45:00Z");
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
