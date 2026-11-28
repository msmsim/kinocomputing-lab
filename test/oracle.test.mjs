// The lab's oracle (INFLUENCES.md, "Oracles"): generated histories of whole
// nights, the agent's part played at random, and settle's promises checked
// after every step, against what the history did rather than against
// answers written down in advance. Valid and broken notes, updates with and
// without change notes, claims good, malformed and tampered with, pictures
// good, bad and missing, every shape of MORNING.md, Exa spend, shifts that
// left no cost report or ran out of time, stray folders in published/, settles
// before and after the brief's release, and releases at random times.
//
//   LAB_ORACLE_RUNS=40 LAB_ORACLE_SEED=7 node --test test/oracle.test.mjs
//
// A failure prints its seed and the history so far; the same seed replays it.
// The default is a few histories on a fixed seed; the Saturday run uses many,
// on a fresh seed.

import { test } from "node:test";
import assert from "node:assert/strict";
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { sketch } from "../tools/figure.mjs";
import { makeWorld } from "./helpers.mjs";

const RUNS = Number(process.env.LAB_ORACLE_RUNS ?? 3);
const SEED = Number(process.env.LAB_ORACLE_SEED ?? 1);

/** A small seeded generator (mulberry32): the same seed, the same history. */
function random(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
  return { next, int, pick: (xs) => xs[int(0, xs.length - 1)], chance: (p) => next() < p };
}

const DAYS = ["2026-11-21", "2026-11-22", "2026-11-23", "2026-11-24", "2026-11-25", "2026-11-26", "2026-11-27"];
const PARADIGMS = ["photonic", "thermodynamic", "reversible"];
const plus = (date, hhmm) => `${date}T${hhmm}:00Z`;
const lines = (path) => (existsSync(path) ? readFileSync(path, "utf8").split("\n").filter((l) => l.trim()) : []);
const pages = (kino) => new Set(existsSync(join(kino, "notes")) ? readdirSync(join(kino, "notes")).filter((f) => f.endsWith(".html")) : []);

const GOOD_PLATE = sketch({ width: 640, height: 300, seed: 3, elements: [{ type: "ellipse", x: 320, y: 150, w: 300, h: 120, fill: "paper-light", fillStyle: "solid" }] });
const BAD_PLATE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 300"><path stroke="#ff00ff" d="M0 0L9 9"/></svg>';

/** One shift's agent: what it leaves for settle. Returns what it sent. */
function agent(r, w, date, shift, published, log) {
  const write = (p, s) => { mkdirSync(join(w.lab, p, ".."), { recursive: true }); writeFileSync(join(w.lab, p), s); };
  const sent = [];
  for (let i = 0; i < r.int(0, 4); i++) {
    const kind = r.pick(["notebook", "notebook", "claim", "paradigm", "bad-name", "lab-id", "long-paradigm", "update"]);
    let name = `lab-${date}-s${shift}-n${i}`;
    let text;
    if (kind === "bad-name") { name = `not-a-lab-name-${shift}-${i}`; text = "---\nkind: notebook\n---\n\n**Misnamed**\n\nIts lead.\n"; }
    else if (kind === "claim") text = "---\nkind: claim\nquestion: q-001\n---\n\n**Claim: a thing**\n\nA thing holds, in simulation. Stage: simulated.\n";
    else if (kind === "paradigm") text = `---\nkind: paradigm\nparadigm: ${r.pick(PARADIGMS)}\n---\n\n**A paradigm**\n\nWhat moved, briefly.\n`;
    else if (kind === "long-paradigm") text = `---\nkind: paradigm\nparadigm: ${r.pick(PARADIGMS)}\n---\n\n**Too long**\n\n${"word ".repeat(400)}\n`;
    else if (kind === "lab-id") text = "---\nkind: notebook\n---\n\n**Ids**\n\nThis leans on c-001, which readers can't look up.\n";
    else if (kind === "update" && published.size) {
      name = r.pick([...published].sort());
      text = `---\nkind: notebook\n${r.chance(0.6) ? "change_note: a correction\n" : ""}---\n\n**Updated**\n\nA newer lead.\n`;
    } else text = "---\nkind: notebook\n---\n\n**A note**\n\nIts lead, for anyone.\n";
    if (sent.includes(name)) continue;
    write(`outbox/${name}.md`, text);
    sent.push(name);
    log.push(`  outbox ${name} (${kind})`);
  }
  if (r.chance(0.4)) {
    const claims = lines(join(w.lab, "state/claims.jsonl"));
    if (claims.length && r.chance(0.3)) {
      writeFileSync(join(w.lab, "state/claims.jsonl"), [JSON.stringify({ id: "c-999", stage: "refuted", statement: "tampered", at: plus(date, "03:00") }), ...claims.slice(1)].map((l) => `${l}\n`).join(""));
      log.push("  claims: tampered with a committed claim");
    } else if (r.chance(0.3)) {
      appendFileSync(join(w.lab, "state/claims.jsonl"), "not json\n");
      log.push("  claims: a malformed line");
    } else {
      appendFileSync(join(w.lab, "state/claims.jsonl"), `${JSON.stringify({ id: `c-${100 + claims.length}`, stage: "simulated", statement: "A thing holds.", at: plus(date, "03:00") })}\n`);
      log.push("  claims: a new claim");
    }
  }
  const picture = r.pick(["none", "none", "good", "bad", "no-meta"]);
  if (picture !== "none") {
    write(`outbox/brief/plate-${shift}.svg`, picture === "bad" ? BAD_PLATE : GOOD_PLATE);
    if (picture !== "no-meta") write("outbox/brief/picture.json", JSON.stringify({ file: `plate-${shift}.svg`, alt: "An oval, drawn in one wobbling line", caption: "A pond." }));
    log.push(`  picture: ${picture}`);
  }
  const morning = r.pick(["prose", "waiting-heading", "waiting-line", "lab-id", "missing"]);
  if (morning === "missing") rmSync(join(w.lab, "MORNING.md"), { force: true });
  else write("MORNING.md", {
    prose: "The shift looked at a thing and found it smaller than claimed.\n",
    "waiting-heading": "The shift went deep.\n\n## Waiting on a human\n\n- A login only the PI has.\n",
    "waiting-line": "The shift went wide.\n\nWaiting on a human: nothing.\n",
    "lab-id": "The shift moved c-001 up a rung.\n",
  }[morning]);
  log.push(`  MORNING.md: ${morning}`);
  if (r.chance(0.3)) {
    mkdirSync(join(w.lab, `published/lab-${date}-stray-${shift}`), { recursive: true });
    writeFileSync(join(w.lab, `published/lab-${date}-stray-${shift}/figure.svg`), GOOD_PLATE);
    log.push("  a stray folder in published/");
  }
  return sent;
}


const tally = { histories: 0, settles: 0, skipped: 0, sent: 0, published: 0, refused: 0, releases: 0, heldAtSettle: 0 };

function history(seed) {
  tally.histories += 1;
  const r = random(seed);
  const w = makeWorld();
  const log = [`seed ${seed}`];
  const fail = (message) => assert.fail(`${message}\n\nLAB_ORACLE_SEED=${seed} (history ${seed}), the history so far:\n${log.join("\n")}`);
  try {
    w.publish("2026-11-20T00:00:00Z");
    writeFileSync(join(w.lab, "state/paradigms.json"), JSON.stringify({ paradigms: PARADIGMS.map((id) => ({ id, name: `Paradigm ${id}`, group: "G", last_checked: null })) }));
    w.commit();
    const published = new Set();
    let site = pages(w.kino);
    let committed = [];
    const days = DAYS.slice(r.int(0, 3)).slice(0, r.int(1, 3));
    for (const date of days) {
      for (const shift of r.chance(0.8) ? [1, 2] : [1]) {
        const preparedAt = shift === 1 ? plus(date, "02:23") : plus(date, "05:07");
        log.push(`${date} shift ${shift}`);
        w.node(w.lab, ["tools/prepare.mjs"], preparedAt, { LAB_SHIFT: String(shift) });
        const run = JSON.parse(readFileSync(join(w.lab, "state/run.json"), "utf8"));
        if (run.skip) { log.push("  skipped: no money"); tally.skipped += 1; continue; }
        tally.settles += 1;
        const sent = agent(r, w, date, shift, published, log);
        // Searches the shift paid for, during it.
        let exa = 0;
        for (let i = 0; i < r.int(0, 2); i++) {
          const usd = r.pick([0.025, 0.05, 0.007]);
          exa += usd;
          appendFileSync(join(w.lab, "state/search-spend.jsonl"), `${JSON.stringify({ date, at: shift === 1 ? plus(date, "02:30") : plus(date, "05:20"), query: "q", usd })}\n`);
        }
        const report = r.chance(0.85);
        const cost = Math.round(r.next() * 50) / 100;
        if (report) writeFileSync(join(w.lab, "state/claude-output.json"), JSON.stringify({ total_cost_usd: cost, num_turns: 5, is_error: false }));
        else rmSync(join(w.lab, "state/claude-output.json"), { force: true });
        const exit = r.chance(0.1) ? "124" : "0";
        const settledAt = shift === 1 ? plus(date, r.pick(["02:50", "03:30"])) : plus(date, r.pick(["05:40", "07:00", "09:30"]));
        log.push(`  settle at ${settledAt}${report ? `, cost $${cost}` : ", no cost report"}, Exa $${exa.toFixed(3)}${exit === "124" ? ", stopped at its time limit" : ""}`);
        const spendBefore = lines(join(w.lab, "state/spend.jsonl")).length;
        try {
          w.node(w.lab, ["tools/settle.mjs"], settledAt, { LAB_SHIFT: String(shift), SHIFT_EXIT: exit });
        } catch (error) {
          fail(`settle failed:\n${error.message.slice(0, 1500)}`);
        }

        // Nothing sent is lost: each note went out, or was refused and kept.
        for (const name of sent) {
          if (!existsSync(join(w.lab, "published", `${name}.md`)) && !existsSync(join(w.lab, "outbox/rejected", `${name}.md`))) fail(`${name} was neither published nor refused`);
          if (existsSync(join(w.lab, "outbox", `${name}.md`))) fail(`${name} is still in the outbox`);
        }
        for (const name of sent) {
          tally.sent += 1;
          if (existsSync(join(w.lab, "outbox/rejected", `${name}.md`))) tally.refused += 1;
          else { tally.published += 1; published.add(name); }
        }
        // What's on the site stays on the site.
        const now = pages(w.kino);
        for (const page of site) if (!now.has(page)) fail(`${page} disappeared from kinocomputing`);
        site = now;
        // Every published note is on the site or held for it.
        for (const name of published) {
          if (!existsSync(join(w.kino, "notes", `${name}.html`)) && !existsSync(join(w.lab, "held/notes", `${name}.html`))) fail(`${name} is published but neither on kinocomputing nor held`);
        }
        // Claims only grow: the committed ones come first, as they were.
        const claimsAfter = lines(join(w.lab, "state/claims.jsonl"));
        for (let i = 0; i < committed.length; i++) if (claimsAfter[i] !== committed[i]) fail(`committed claim ${i + 1} changed or went missing`);
        // The spend record: the shift's model cost (or its cap), and exactly its own Exa searches.
        const added = lines(join(w.lab, "state/spend.jsonl")).slice(spendBefore).map((l) => JSON.parse(l));
        const model = added.filter((l) => l.source === "model");
        if (model.length !== 1) fail(`settle recorded ${model.length} model costs, not one`);
        if (report && model[0].usd !== cost) fail(`model cost recorded as ${model[0].usd}, not ${cost}`);
        if (!report && !model[0].estimated) fail("a shift with no cost report wasn't counted at its cap");
        const exaLine = added.filter((l) => l.source === "exa");
        const exaRounded = Math.round(exa * 10000) / 10000;
        if (exaRounded ? exaLine.length !== 1 || exaLine[0].usd !== exaRounded : exaLine.length) fail(`Exa recorded as ${JSON.stringify(exaLine)}, not ${exaRounded}`);
        // The shift is on the record, so it won't be worked twice.
        const settled = JSON.parse(readFileSync(join(w.lab, "state/last-settle.json"), "utf8"));
        if (settled.date !== date || !settled.shifts.includes(shift)) fail(`last-settle.json says ${JSON.stringify(settled.shifts)} on ${settled.date}`);
        // The brief is written, on the site or held; what's left for the PI and lab ids stay out of it.
        const brief = [join(w.kino, `notes/lab-${date}-brief.html`), join(w.lab, `held/notes/lab-${date}-brief.html`)].find((p) => existsSync(p));
        if (!brief) fail("no brief, on the site or held");
        if (brief.includes("/held/")) tally.heldAtSettle += 1;
        const briefText = readFileSync(brief, "utf8");
        if (/Waiting on a human|A login only the PI has/.test(briefText)) fail("the brief has what's left for the PI");
        if (/\bc-\d{3}\b/.test(briefText.replace(/<[^>]+>/g, ""))) fail("the brief has a lab id");
        if (settledAt >= plus(date, "08:45") && brief.includes("/held/")) fail("a brief settled after its release time is still held");
        // The workflow commits after each settle.
        w.commit();
        committed = claimsAfter;
      }
      // The release, at a random time that day.
      const at = plus(date, r.pick(["06:00", "08:44", "08:45", "10:47", "12:00"]));
      w.release(at);
      tally.releases += 1;
      log.push(`  release at ${at}`);
      if (at >= plus(date, "08:45")) {
        if (existsSync(join(w.lab, "held"))) fail(`held/ isn't empty after a release at ${at}`);
        if (existsSync(join(w.lab, "state/last-settle.json")) && JSON.parse(readFileSync(join(w.lab, "state/last-settle.json"), "utf8")).date === date && !existsSync(join(w.kino, `notes/lab-${date}-brief.html`))) fail(`no brief on kinocomputing after a release at ${at}`);
      }
      const now = pages(w.kino);
      for (const page of site) if (!now.has(page)) fail(`${page} disappeared from kinocomputing at the release`);
      site = now;
      w.commit();
    }
  } finally {
    w.dispose();
  }
}

test("generated nights keep settle's promises", (t) => {
  for (let i = 0; i < RUNS; i++) history(SEED + i);
  // What the histories exercised, so a run that quietly did little shows it.
  t.diagnostic(`seed ${SEED}: ${Object.entries(tally).map(([k, v]) => `${v} ${k}`).join(", ")}`);
  assert.ok(tally.settles >= RUNS, "most shifts ran rather than skipping");
});
