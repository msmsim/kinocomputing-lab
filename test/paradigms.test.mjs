// The paradigm rotation and the tracker, and a Sunday.
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
    write("state/search-log.jsonl", [
      { date: "2026-11-20", shift: 1, source: "github", query: "yesterday's" },
      { date: "2026-11-21", shift: 1, source: "openalex", query: "photonic" },
      { date: "2026-11-21", shift: 1, source: "openalex", query: "photonic", country: "jp,kr" },
      { date: "2026-11-21", shift: 1, source: "openalex", query: "photonic matmul" },
      { date: "2026-11-21", shift: 1, source: "s2-cites", query: "arXiv:2401.00001" },
      { date: "2026-11-21", shift: 2, source: "zenodo", query: "the second shift's" },
    ].map((l) => JSON.stringify(l)).join("\n") + "\n");
    w.node(w.lab, ["tools/settle.mjs"], "2026-11-21T03:00:00Z");
    assert.match(read("MORNING.md"), /- Searches: openalex 2, openalex \(regional\) 1, s2-cites 1\./, "tonight's shift's, by source");
    assert.match(read("MORNING.md"), /- Paradigms were looked at without literature beyond OpenAlex and arXiv, money, what an outsider can use \(AGENT\.md, "Where to look"\)\./);

    const entry = readFileSync(join(w.kino, "notes/lab-2026-11-21-paradigm-photonic.html"), "utf8");
    assert.ok(!/blyg:kind" content="thread"/.test(entry), "an entry is a fragment");
    const tracker = readFileSync(join(w.kino, "notes/lab-2026-11-21-tracker.html"), "utf8");
    assert.match(tracker, /<blockquote class="kino-quote" data-note="lab-2026-11-21-paradigm-photonic">/, "the tracker quotes it the same night");
    assert.match(entry, /<meta name="kino:section" content="tracker">/, "an entry is the tracker's");
    assert.match(tracker, /<meta name="kino:section" content="tracker">/, "and so is the tracker, because it asked");
    w.release("2026-11-21T08:45:00Z");
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
    writeFileSync(join(w.lab, "state/attention.jsonl"), [
      { date: "2026-11-20", shift: 1, asks: ["Last week's ask"], takes: 9, shares: 9 },
      { date: "2026-11-25", shift: 1, asks: ["A login for the archive"], takes: 1, shares: 2 },
      { date: "2026-11-25", shift: 2, asks: ["A login for the archive"], takes: 0, shares: 0 },
      { date: "2026-11-26", shift: 1, asks: [], takes: 0, shares: 1 },
    ].map((l) => JSON.stringify(l)).join("\n") + "\n");
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
    assert.match(first, /What the lab needed from the PI: 2 of the week's 3 shifts asked for something; the PI sent 1 take and 3 shares\. The asks, with how many shifts each stood:\n\n- A login for the archive \(2 shifts\)/,
      "the week's, not before");
    assert.match(first, /What changed in how the lab works[^\n]*\n\n- night\n- seed/, "people's commits to the lab");
    assert.match(first, /The second shift writes a deep dive in Bompa's voice/);
    assert.ok(!first.includes("## Tonight's paradigms\n\nThe rotation"), "no paradigms tonight");

    writeFileSync(join(w.lab, "outbox/lab-2026-11-29-the-week.md"), "---\nkind: notebook\n---\n\n**The week the converters won**\n\nThe week's lead.\n");
    writeFileSync(join(w.lab, "state/claude-output.json"), JSON.stringify({ total_cost_usd: 0.5, num_turns: 9, is_error: false }));
    w.node(w.lab, ["tools/settle.mjs"], "2026-11-29T03:00:00Z");
    assert.ok(!existsSync(join(w.kino, "notes/lab-2026-11-29-the-week.html")) && existsSync(join(w.lab, "held/notes/lab-2026-11-29-the-week.html")),
      "the week in review is held, like the brief");
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
    assert.ok(existsSync(join(w.kino, "notes/lab-2026-11-29-deep-dive.html")), "the deep dive goes out with the night");
    assert.match(w.release("2026-11-29T08:47:00Z"), /nothing due; held until 2026-11-29T10:45:00Z/, "Sunday's release is later: its second shift runs longer");
    assert.match(w.release("2026-11-29T10:47:00Z"), /released lab-2026-11-29-brief, lab-2026-11-29-the-week/);
    assert.match(readFileSync(join(w.kino, "notes/lab-2026-11-29-the-week.html"), "utf8"), /<meta property="article:published_time" content="2026-11-29T10:45:00Z">/);
    w.commit();

    w.node(w.lab, ["tools/prepare.mjs"], "2026-12-06T05:07:00Z", { LAB_SHIFT: "2" });
    assert.match(read("state/tonight.md"), /## Sunday 2, shift 2: the roundtable\n\nThe roundtable: all five voices on one question orthogonal to the week, each turn written by the `voice` subagent in that voice\. Positions of at most 150 words, rebuttals of at most 120, the crux in at most 100, and a bet each of at most 80/);
  } finally {
    w.dispose();
  }
});
