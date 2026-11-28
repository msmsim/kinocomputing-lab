// Claims and write-ups, and images in the house style.
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

test("images: drawn in the house style, checked, named by their contents, published beside their note; the house rules refuse what breaks them", async () => {
  const w = makeWorld();
  const read = (p) => readFileSync(join(w.lab, p), "utf8");
  const plate = sketch({ width: 640, height: 300, elements: [{ type: "rect", x: 40, y: 60, w: 200, h: 160, fill: "paper-light", fillStyle: "solid" }, { type: "text", x: 140, y: 150, text: "processor", anchor: "middle" }, { type: "arrow", x1: 400, y1: 140, x2: 260, y2: 140, stroke: "vermilion" }] });
  assert.deepEqual(checkImage(Buffer.from(plate), "plate-wall.svg").problems, [], "the sketch tool draws in the house style");
  try {
    w.publish("2026-11-20T00:00:00Z");
    w.node(w.lab, ["tools/prepare.mjs"], "2026-11-27T02:23:00Z");
    const note = (name, body) => writeFileSync(join(w.lab, `outbox/lab-2026-11-27-${name}.md`), `---\nkind: notebook\n---\n\n**${name}**\n\nThe lead, which says what the note found and why it matters.\n\n${body}\n`);
    const asset = (name, file, text) => { mkdirSync(join(w.lab, `outbox/lab-2026-11-27-${name}`), { recursive: true }); writeFileSync(join(w.lab, `outbox/lab-2026-11-27-${name}/${file}`), text); };
    asset("wall", "plate-wall.svg", plate);
    note("wall", '![A wall between a processor and a memory, data squeezing through a gap](plate-wall.svg "The memory wall: moving data costs more than computing on it.")\n\nMore.');
    note("inline", "Text with ![an image of a wall](plate-wall.svg \"Caption\") inside it.");
    asset("nocaption", "plate-wall.svg", plate);
    note("nocaption", "![A wall between a processor and a memory](plate-wall.svg)");
    asset("offstyle", "fig-x.svg", '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 300"><text x="1" y="20" font-size="8" fill="#ff00ff">tiny</text></svg>');
    note("offstyle", '![A chart that breaks the house rules on purpose](fig-x.svg "A chart.")');
    asset("unsafe", "fig-y.svg", '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 300"><script>alert(1)</script></svg>');
    note("unsafe", '![A chart with a script in it, on purpose](fig-y.svg "A chart.")');
    writeFileSync(join(w.lab, "state/claude-output.json"), JSON.stringify({ total_cost_usd: 0.4, num_turns: 9, is_error: false }));
    w.node(w.lab, ["tools/settle.mjs"], "2026-11-27T03:20:00Z");

    const hash = createHash("sha256").update(plate).digest("hex").slice(0, 16);
    assert.equal(readFileSync(join(w.kino, `media/${hash}.svg`), "utf8"), plate, "the image, named by its contents, in kinocomputing's media");
    const page = readFileSync(join(w.kino, "notes/lab-2026-11-27-wall.html"), "utf8");
    assert.match(page, new RegExp(`<figure class="plate"><img src="https://www\\.kinocomputing\\.com/media/${hash}\\.svg" alt="A wall between a processor and a memory, data squeezing through a gap" width="640" height="300" loading="lazy" decoding="async"><figcaption>The memory wall: moving data costs more than computing on it\\.</figcaption></figure>`));
    assert.ok(existsSync(join(w.lab, "published/lab-2026-11-27-wall/plate-wall.svg")) && !existsSync(join(w.lab, "outbox/lab-2026-11-27-wall")), "the source kept beside the published note");
    const morning = read("MORNING.md");
    assert.match(morning, /lab-2026-11-27-inline has an image inside a paragraph/);
    assert.match(morning, /lab-2026-11-27-nocaption has an image \(plate-wall\.svg\) without a caption/);
    assert.match(morning, /lab-2026-11-27-offstyle has an image "fig-x\.svg" that uses colours outside the house palette: #ff00ff; has text at 8/);
    assert.match(morning, /lab-2026-11-27-unsafe has an image "fig-y\.svg" that has a script/);
  } finally {
    w.dispose();
  }
});

test("settle checks its own work: a broken promise is reported in MORNING.md and fails the run", () => {
  const faults = [
    ["lose-a-page", /went out but is neither on kinocomputing nor held for it/],
    ["lose-a-claim", /a committed claim was lost or changed/],
    ["leave-a-note", /notes left in the outbox, neither published nor refused/],
  ];
  for (const [fault, says] of faults) {
    const w = makeWorld();
    try {
      w.publish("2026-11-20T00:00:00Z");
      writeFileSync(join(w.lab, "state/claims.jsonl"), `${JSON.stringify({ id: "c-001", stage: "conjecture", statement: "x", at: "2026-11-20T03:00:00Z" })}\n`);
      w.commit();
      w.node(w.lab, ["tools/prepare.mjs"], "2026-11-21T02:23:00Z");
      writeFileSync(join(w.lab, "outbox/lab-2026-11-21-a-note.md"), "---\nkind: notebook\n---\n\n**A note**\n\nIts lead.\n");
      writeFileSync(join(w.lab, "state/claude-output.json"), JSON.stringify({ total_cost_usd: 0.1, num_turns: 2, is_error: false }));
      writeFileSync(join(w.lab, "MORNING.md"), "A night.\n");
      assert.throws(() => w.node(w.lab, ["tools/settle.mjs"], "2026-11-21T03:00:00Z", { LAB_FAULT: fault }), says, fault);
      assert.match(readFileSync(join(w.lab, "MORNING.md"), "utf8"), /## Settle's own checks failed\n\n- /, fault);
    } finally {
      w.dispose();
    }
  }
});
