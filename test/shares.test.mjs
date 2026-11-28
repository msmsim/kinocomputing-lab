// Shares from Subset, and a short day reported by its last shift.
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

    // A link keeps the day it came in, however many nights later the list is rebuilt.
    const later = JSON.parse(readFileSync(join(w.kino, "notes/_hopper.json"), "utf8"));
    assert.deepEqual([...new Set(later.items.map((i) => i.added))], ["2026-11-22"]);
    assert.ok(read("state/hopper.jsonl").trim().split("\n").every((l) => JSON.parse(l).added === "2026-11-22"), "stamped once, in the lab's own file");
    assert.ok(!read("published/lab-2026-11-23-brief.md").includes("New in Reading"), "nothing new on the 23rd");

    // The brief names five of the day's links, the picked ones first, and counts the rest.
    w.node(w.lab, ["tools/prepare.mjs"], "2026-11-24T02:00:00Z");
    const day = Array.from({ length: 8 }, (_, i) => ({ url: `https://example.org/r${i}`, title: `Read ${i}`, why: `Line ${i}.`, from: "lab", ...(i === 3 || i === 6 ? { pick: true } : {}) }));
    writeFileSync(join(w.lab, "state/hopper.jsonl"), read("state/hopper.jsonl") + day.map((l) => JSON.stringify(l)).join("\n") + "\n");
    w.node(w.lab, ["tools/settle.mjs"], "2026-11-24T03:00:00Z");
    const reads = read("published/lab-2026-11-24-brief.md").match(/\*\*New in Reading\*\*\n\n([\s\S]*?)(?:\n\n|$)/)[1].split("\n");
    assert.deepEqual(reads.map((l) => l.match(/^- \[([^\]]+)\]/)?.[1] ?? l), [
      "Read 3", "Read 6", "Read 0", "Read 1", "Read 2",
      "- And 3 more made it to [Reading](https://www.kinocomputing.com/reading) today.",
    ]);
    assert.ok(!read("MORNING.md").includes("was picked for the brief"), "picked, so nothing to say");
  } finally {
    w.dispose();
  }
});
