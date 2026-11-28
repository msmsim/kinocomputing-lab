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
    writeFileSync(join(w.lab, "MORNING.md"), "The first shift went wide.\n\n## Waiting on a human\n\nNothing tonight.\n");
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
    assert.match(briefMd, /\*\*Lab brief: 21 November 2026\*\*\n\nThe first shift went wide\.\n\n\*\*Second shift\*\*\n\nThe second shift went deep\.\n\n\*\*Waiting on a human\*\*\n\n- A paywalled paper only the PI can get\.\n\n\*\*Published today\*\*/, "both shifts' own words, in order, then one Waiting on a human");
    assert.equal(briefMd.match(/Waiting on a human/g).length, 1, "once, not per shift; a 'nothing' says nothing");
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
