// A day of two shifts, and the day's picture.
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
    writeFileSync(join(w.lab, "MORNING.md"), "The first shift went wide.\n\nWaiting on a human: nothing.\n");
    writeFileSync(join(w.lab, "state/claude-output.json"), JSON.stringify({ total_cost_usd: 0.5, num_turns: 30, is_error: false }));
    const exa = (at, usd) => appendFileSync(join(w.lab, "state/search-spend.jsonl"), `${JSON.stringify({ date: "2026-11-21", at, query: "q", usd })}\n`);
    exa("2026-11-21T02:40:00Z", 0.075);
    // Each shift leaves the day's picture working files, in a folder of their own.
    const sketch = (who) => {
      mkdirSync(join(w.lab, "outbox/brief/parts"), { recursive: true });
      writeFileSync(join(w.lab, "outbox/brief/parts/sketch.txt"), who);
    };
    sketch("first");
    w.node(w.lab, ["tools/settle.mjs"], "2026-11-21T03:20:00Z");
    assert.deepEqual(JSON.parse(read("state/last-settle.json")).shifts, [1]);

    // Shift 2: depth, with what's left of the day and no rotation.
    const prep = w.node(w.lab, ["tools/prepare.mjs"], "2026-11-21T05:07:00Z", { LAB_SHIFT: "2" });
    assert.match(prep, /shift 2, light run, \$0\.93/, "the rest of the day's money: $1.00 less the first shift's $0.075 of Exa");
    assert.deepEqual(JSON.parse(read("state/run.json")).paradigms, [], "the rotation is the first shift's");
    assert.match(read("state/tonight.md"), /## Shift 2 of 2: depth[\s\S]*12 went out in today's earlier shift/);
    assert.match(read("state/last-morning.md"), /The first shift went wide/, "the second shift reads what the first said");
    for (const c of ["c", "d"]) note(`claim-${c}`, "claim");
    for (let i = 1; i <= 3; i++) note(`second-${i}`);
    writeFileSync(join(w.lab, "MORNING.md"), "The second shift went deep.\n\n## Waiting on a human\n\n- A paywalled paper only the PI can get.\n");
    writeFileSync(join(w.lab, "state/claude-output.json"), JSON.stringify({ total_cost_usd: 0.8, num_turns: 40, is_error: false }));
    exa("2026-11-21T05:20:00Z", 0.05);
    sketch("second");
    w.node(w.lab, ["tools/settle.mjs"], "2026-11-21T06:00:00Z", { LAB_SHIFT: "2" });
    assert.deepEqual(read("state/spend.jsonl").trim().split("\n").map((l) => JSON.parse(l)).filter((l) => l.source === "exa").map((l) => l.usd), [0.075, 0.05],
      "each shift's own Exa searches, not the day's so far");
    assert.equal(read("published/lab-2026-11-21-brief/parts/sketch.txt"), "second", "the second shift's picture files over the first's");
    assert.ok(!existsSync(join(w.lab, "outbox/brief")));

    const published = readdirSync(join(w.lab, "published")).filter((f) => /(?:first|second|claim)-/.test(f));
    assert.equal(published.length, 15, "fifteen a day, claims included");
    const morning = read("MORNING.md");
    for (const n of [2, 3]) assert.match(morning, new RegExp(`Not published: lab-2026-11-21-second-${n} — over the 15-note daily limit`));
    assert.deepEqual(JSON.parse(read("state/last-settle.json")).shifts, [1, 2]);

    const briefMd = read("published/lab-2026-11-21-brief.md");
    assert.match(briefMd, /\*\*Lab brief: 21 November 2026\*\*\n\nThe first shift went wide\.\n\n\*\*Second shift\*\*\n\nThe second shift went deep\.\n\n\*\*Published today\*\*/, "both shifts' own words, in order, then what went out");
    assert.ok(!/Waiting on a human|paywalled/.test(briefMd), "what's left for the PI stays in the lab's log, not the brief");
    assert.match(read("MORNING.md"), /A paywalled paper only the PI can get/, "where it is");
    const attention = read("state/attention.jsonl").trim().split("\n").map((l) => JSON.parse(l));
    assert.deepEqual(attention.map((a) => [a.shift, a.asks]), [[1, []], [2, ["A paywalled paper only the PI can get."]]],
      "each shift's asks recorded for the week in review; a 'nothing' is none");
    assert.match(briefMd, /\[first-01\][\s\S]*\[claim-d\][\s\S]*\[second-1\]/, "everything the day published");
    assert.match(briefMd, /The day's 2 shifts cost \$1\.43, on Claude Sonnet 5\.5\./);
    assert.ok(!/short of the lab/.test(briefMd), "fifteen is no shortfall");
    // Held until a few hours after the night, then out once, with both shifts.
    const briefPage = () => readFileSync(join(w.kino, "notes/lab-2026-11-21-brief.html"), "utf8");
    assert.ok(!existsSync(join(w.kino, "notes/lab-2026-11-21-brief.html")), "not out with the night's notes");
    assert.ok(existsSync(join(w.kino, "notes/lab-2026-11-21-second-1.html")), "which are");
    assert.match(w.release("2026-11-21T08:44:59Z"), /release: nothing due; held until 2026-11-21T08:45:00Z/);
    assert.match(w.release("2026-11-21T08:45:00Z"), /release: released lab-2026-11-21-brief/);
    assert.ok(!existsSync(join(w.lab, "held")), "nothing left held");
    assert.ok(!/<meta name="blyg:note"/.test(briefPage()), "its first version has both shifts: not an update");
    assert.match(briefPage(), /<meta property="article:published_time" content="2026-11-21T08:45:00Z">/, "dated for when it went out");
    assert.match(w.release("2026-11-21T10:45:00Z"), /release: nothing held/);
    // A shift that settles after the release updates the brief there and then.
    writeFileSync(join(w.lab, "MORNING.md"), "A late second shift.\n");
    writeFileSync(join(w.lab, "state/claude-output.json"), JSON.stringify({ total_cost_usd: 0.1, num_turns: 4, is_error: false }));
    assert.match(w.node(w.lab, ["tools/settle.mjs"], "2026-11-21T09:30:00Z", { LAB_SHIFT: "2" }), /updated the brief/);
    assert.match(briefPage(), /<meta name="blyg:note" content="Updated with the day's second shift/);
    assert.ok(!existsSync(join(w.lab, "held")));
  } finally {
    w.dispose();
  }
});

test("the day's picture: placed after the brief's lead, kept by a later shift that has none, replaced by one that has; a bad one left out and reported; a day without one reported", async () => {
  const w = makeWorld();
  const brief = () => readFileSync(join(w.lab, "published/lab-2026-11-21-brief.md"), "utf8");
  // Held for its release until then (tools/release.mjs).
  const page = () => readFileSync([join(w.kino, "notes/lab-2026-11-21-brief.html"), join(w.lab, "held/notes/lab-2026-11-21-brief.html")].find((p) => existsSync(p)), "utf8");
  const picture = (file, svg, meta) => {
    mkdirSync(join(w.lab, "outbox/brief"), { recursive: true });
    writeFileSync(join(w.lab, `outbox/brief/${file}`), svg);
    writeFileSync(join(w.lab, "outbox/brief/picture.json"), JSON.stringify(meta));
  };
  const shift = (n, at, cost = 0.3) => {
    writeFileSync(join(w.lab, "MORNING.md"), "# Morning\n\nTonight the lab looked at the memory wall, and found it taller than expected.\n");
    writeFileSync(join(w.lab, "state/claude-output.json"), JSON.stringify({ total_cost_usd: cost, num_turns: 9, is_error: false }));
    w.node(w.lab, ["tools/settle.mjs"], at, n === 2 ? { LAB_SHIFT: "2" } : {});
  };
  const wall = sketch({ width: 640, height: 300, seed: 4, elements: [{ type: "rect", x: 280, y: 30, w: 60, h: 240, fill: "grey", fillStyle: "cross-hatch" }, { type: "arrow", x1: 500, y1: 150, x2: 360, y2: 150, stroke: "vermilion" }] });
  const pond = sketch({ width: 640, height: 300, seed: 9, elements: [{ type: "ellipse", x: 320, y: 150, w: 400, h: 160, fill: "paper-light", fillStyle: "solid" }] });
  try {
    w.publish("2026-11-20T00:00:00Z");
    w.node(w.lab, ["tools/prepare.mjs"], "2026-11-21T02:23:00Z");
    picture("plate-wall.svg", wall, { file: "plate-wall.svg", alt: "A cross-hatched wall with a red arrow stopped against it", caption: "The memory wall, taller than we thought." });
    shift(1, "2026-11-21T03:00:00Z");
    const hash = (svg) => createHash("sha256").update(svg).digest("hex").slice(0, 16);
    assert.match(brief(), new RegExp(`\\*\\*Lab brief: 21 November 2026\\*\\*\\n\\nTonight the lab looked at the memory wall, and found it taller than expected\\.\\n\\n!\\[A cross-hatched wall with a red arrow stopped against it\\]\\(${hash(wall)}\\.svg "The memory wall, taller than we thought\\."\\)\\n\\n`), "the picture straight after the lead");
    assert.match(page(), new RegExp(`<figure class="plate"><img src="https://www\\.kinocomputing\\.com/media/${hash(wall)}\\.svg"`));
    assert.ok(existsSync(join(w.lab, `held/media/${hash(wall)}.svg`)) && existsSync(join(w.lab, "published/lab-2026-11-21-brief/plate-wall.svg")) && !existsSync(join(w.lab, "outbox/brief")));
    assert.ok(!existsSync(join(w.kino, `media/${hash(wall)}.svg`)), "the picture is held with its brief");

    w.node(w.lab, ["tools/prepare.mjs"], "2026-11-21T05:07:00Z", { LAB_SHIFT: "2" });
    picture("plate-bad.svg", '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 300"><path stroke="#ff00ff" d="M0 0L9 9"/></svg>', { file: "plate-bad.svg", alt: "A magenta line that breaks the palette", caption: "Off-palette on purpose." });
    shift(2, "2026-11-21T06:00:00Z");
    assert.match(readFileSync(join(w.lab, "MORNING.md"), "utf8"), /The day's picture wasn't used: it uses colours outside the house palette: #ff00ff/);
    assert.match(brief(), new RegExp(`${hash(wall)}\\.svg`), "the first shift's picture kept");
    assert.equal((brief().match(/!\[/g) ?? []).length, 1);

    w.node(w.lab, ["tools/prepare.mjs"], "2026-11-21T05:30:00Z", { LAB_SHIFT: "2" });
    picture("plate-pond.svg", pond, { file: "plate-pond.svg", alt: "A still pond, drawn in one wobbling line", caption: "A reservoir is a pond." });
    shift(2, "2026-11-21T06:30:00Z");
    assert.match(brief(), new RegExp(`${hash(pond)}\\.svg`), "a later picture replaces it");
    assert.ok(!brief().includes(hash(wall)));
    assert.ok(!/has no picture/.test(readFileSync(join(w.lab, "MORNING.md"), "utf8")));

    w.node(w.lab, ["tools/prepare.mjs"], "2026-11-22T02:23:00Z");
    shift(1, "2026-11-22T03:00:00Z");
    assert.ok(existsSync(join(w.kino, "notes/lab-2026-11-21-brief.html")) && existsSync(join(w.kino, `media/${hash(pond)}.svg`)),
      "a release whose trigger never came goes out with the next shift");
    assert.deepEqual(JSON.parse(readFileSync(join(w.lab, "held/manifest.json"), "utf8")).due, "2026-11-22T08:45:00Z", "and the day's own is held");
    assert.ok(!/has no picture/.test(readFileSync(join(w.lab, "MORNING.md"), "utf8")), "not yet: a shift is still to come");
    w.node(w.lab, ["tools/prepare.mjs"], "2026-11-22T05:07:00Z", { LAB_SHIFT: "2" });
    shift(2, "2026-11-22T06:00:00Z");
    assert.match(readFileSync(join(w.lab, "MORNING.md"), "utf8"), /Today's brief has no picture/);
    assert.ok(!/picture/i.test(readFileSync(join(w.lab, "published/lab-2026-11-22-brief.md"), "utf8")), "readers aren't told");
  } finally {
    w.dispose();
  }
});

test("what shipped: the brief names a roadmap headline the day it's first seen done, both shifts keep it, a later day doesn't repeat it; the history before the record is never named; a broken roadmap costs nothing", async () => {
  const w = makeWorld();
  const read = (p) => readFileSync(join(w.lab, p), "utf8");
  const COMMIT = "https://github.com/msmsim/kinocomputing/commit/0123456";
  const roadmap = (items) => writeFileSync(join(w.kino, "notes/_roadmap.json"), JSON.stringify({ items }));
  const done = (id, headline, on) => ({ id, headline, status: "done", created: "2026-11-01", moves: [{ to: "done", on }], links: [{ title: "c", url: COMMIT }] });
  const shift = (at, n = 1) => {
    writeFileSync(join(w.lab, "MORNING.md"), "A quiet shift.\n");
    writeFileSync(join(w.lab, "state/claude-output.json"), JSON.stringify({ total_cost_usd: 0.1, num_turns: 3, is_error: false }));
    w.node(w.lab, ["tools/prepare.mjs"], at, { LAB_SHIFT: String(n) });
    writeFileSync(join(w.lab, "MORNING.md"), "A quiet shift.\n");
    w.node(w.lab, ["tools/settle.mjs"], at.replace(/T\d\d/, (h) => `T${String(Number(h.slice(1)) + 1).padStart(2, "0")}`), { LAB_SHIFT: String(n) });
  };
  const brief = (date) => read(`published/lab-${date}-brief.md`);
  try {
    w.publish("2026-11-20T00:00:00Z");
    roadmap([done("r1", "An old headline", "2026-11-10"), { id: "r2", headline: "Under way", status: "now", created: "2026-11-15", moves: [{ to: "now", on: "2026-11-16" }], outline: ["x"] }]);
    shift("2026-11-21T02:23:00Z");
    assert.ok(!/\*\*Shipped\*\*/.test(brief("2026-11-21")), "the history before the record isn't news");
    assert.deepEqual(JSON.parse(read("state/roadmap-shipped.json")), { earlier: ["r1"] });

    roadmap([done("r1", "An old headline", "2026-11-10"), done("r2", "Under way, & done", "2026-11-21")]);
    shift("2026-11-22T02:23:00Z");
    assert.match(brief("2026-11-22"), /\*\*Shipped\*\*\n\n- \[Under way, & done\]\(https:\/\/www\.kinocomputing\.com\/roadmap#r2\)\n- What’s next: \[the roadmap\]\(https:\/\/www\.kinocomputing\.com\/roadmap\)\.\n\n\*\*Also today\*\*/);
    roadmap([done("r1", "An old headline", "2026-11-10"), done("r2", "Under way, & done", "2026-11-21"), done("r3", "Another", "2026-11-22")]);
    shift("2026-11-22T05:07:00Z", 2);
    assert.match(brief("2026-11-22"), /\*\*Shipped\*\*\n\n- \[Under way, & done\][^\n]*\n- \[Another\]\(https:\/\/www\.kinocomputing\.com\/roadmap#r3\)\n/, "the second shift keeps the first's and adds its own");
    assert.deepEqual(JSON.parse(read("state/roadmap-shipped.json")), { earlier: ["r1"], "2026-11-22": ["r2", "r3"] });

    writeFileSync(join(w.kino, "notes/_roadmap.json"), "{ not json");
    shift("2026-11-23T02:23:00Z");
    assert.ok(!/\*\*Shipped\*\*/.test(brief("2026-11-23")), "named once; and a roadmap that doesn't parse says nothing");
    assert.deepEqual(JSON.parse(read("state/roadmap-shipped.json")), { earlier: ["r1"], "2026-11-22": ["r2", "r3"] });
  } finally {
    w.dispose();
  }
});

test("emphases: in every briefing with how each has been served; the depth shift leads with the one served least recently; the brief counts the day's; the site gets current and past; one that isn't running counts for none", async () => {
  const w = makeWorld();
  const read = (p) => readFileSync(join(w.lab, p), "utf8");
  const emphasis = (id, title, order, until, from = "2026-11-20") => writeFileSync(join(w.lab, "emphases", `${id}.md`),
    `---\ntitle: ${title}\nfrom: ${from}\nuntil: ${until}\norder: ${order}\n---\n\nWhy ${title} matters, for a reader.\n\n- [A note](https://www.kinocomputing.com/a-note)\n`);
  const note = (date, name, emph) => writeFileSync(join(w.lab, `outbox/lab-${date}-${name}.md`), `---\nkind: notebook\n${emph ? `emphasis: ${emph}\n` : ""}---\n\n**${name}**\n\nA short note called ${name}.\n`);
  const shift = (at, n, write = () => {}) => {
    const prep = w.node(w.lab, ["tools/prepare.mjs"], at, { LAB_SHIFT: String(n) });
    write();
    writeFileSync(join(w.lab, "MORNING.md"), "A shift.\n");
    writeFileSync(join(w.lab, "state/claude-output.json"), JSON.stringify({ total_cost_usd: 0.1, num_turns: 3, is_error: false }));
    w.node(w.lab, ["tools/settle.mjs"], at.replace(/T(\d\d)/, (m, h) => `T${String(Number(h) + 1).padStart(2, "0")}`), { LAB_SHIFT: String(n) });
    return prep;
  };
  try {
    w.publish("2026-11-20T00:00:00Z");
    mkdirSync(join(w.lab, "emphases"));
    emphasis("seam", "Where the discrete meets the continuous", 2, "2026-12-31");
    emphasis("weather", "The regimes of weather forecasting", 1, "2026-12-31");
    emphasis("older", "Something finished", 1, "2026-11-10", "2026-10-01");
    writeFileSync(join(w.lab, "emphases", "README.md"), "# Emphases\n");

    shift("2026-11-21T02:23:00Z", 1, () => { note("2026-11-21", "on-the-seam", "seam"); note("2026-11-21", "astray", "nope"); });
    const tonight = read("state/tonight.md");
    assert.match(tonight, /## The emphases\n\n[^\n]*\n\n### The regimes of weather forecasting \(`weather`, until 2026-12-31\)\n\nWhy The regimes of weather forecasting matters, for a reader\.\n\n- A note: https:\/\/www\.kinocomputing\.com\/a-note\n\nNotes in the last seven days: 0; last served never\.\n\n### Where the discrete meets/, "Matt's order, and what each is for");
    assert.ok(!/Something finished/.test(tonight), "an ended emphasis steers nothing");
    assert.match(tonight, /Lean towards them/);
    assert.ok(!/Tonight's lead/.test(tonight), "the breadth shift has no lead");
    assert.match(tonight, /Behind \(fewer than 2 notes in seven days\): The regimes of weather forecasting; Where the discrete meets the continuous\./);
    assert.equal(JSON.parse(read("state/run.json")).emphasis, null);
    assert.match(read("published/lab-2026-11-21-brief.md"), /- On the lab's current emphases: 1 note on where the discrete meets the continuous\./);
    assert.match(read("MORNING.md"), /lab-2026-11-21-astray\.md names the emphasis "nope", which isn't a current one/);
    assert.ok(existsSync(join(w.lab, "published/lab-2026-11-21-astray.md")), "and it's published all the same");
    const site = JSON.parse(readFileSync(join(w.kino, "notes/_emphases.json"), "utf8"));
    assert.deepEqual(site.current.map((e) => e.id), ["weather", "seam"]);
    assert.deepEqual(site.past.map((e) => [e.id, e.until]), [["older", "2026-11-10"]]);
    assert.equal(site.kept, "https://github.com/msmsim/kinocomputing-lab/tree/main/emphases");
    assert.deepEqual(site.current[0].links, [{ title: "A note", url: "https://www.kinocomputing.com/a-note" }]);

    const depth = shift("2026-11-21T05:07:00Z", 2);
    assert.equal(JSON.parse(read("state/run.json")).emphasis, "weather", "never served goes first");
    assert.match(read("state/tonight.md"), /\*\*Tonight's lead: The regimes of weather forecasting\*\* \(`weather`\)/);
    assert.match(read("state/tonight.md"), /### Where the discrete meets the continuous \(`seam`, until 2026-12-31\)\n\n[^\n]*\n\n[^\n]*\n\nNotes in the last seven days: 1; last served 2026-11-21\./);
    assert.ok(depth);

    shift("2026-11-22T02:23:00Z", 1, () => note("2026-11-22", "weather-one", "weather"));
    shift("2026-11-22T05:07:00Z", 2);
    assert.equal(JSON.parse(read("state/run.json")).emphasis, "seam", "then the one served longest ago");
    shift("2026-11-23T02:23:00Z", 1);
    assert.match(read("published/lab-2026-11-23-brief.md"), /- None of today's notes took up one of the lab's current emphases\./);
  } finally {
    w.dispose();
  }
});
