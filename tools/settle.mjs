// After the shift: record what it cost, check it kept the lab's rules, and
// publish its outbox to kinocomputing. Spends nothing; holds every credential
// the agent never sees.
//
//   node tools/settle.mjs [--claude-output state/claude-output.json]
//
// Then publishes tonight's brief to kinocomputing (lab-YYYY-MM-DD-brief):
// the shift's own MORNING.md, written for anyone, and what settle saw, in
// words a reader outside the lab can follow. The PI reads it on the blyg.
//
// Checks, each reported in MORNING.md (and, in plain words, in the brief)
// rather than failing the night:
// - every take of the PI's delivered got a line in state/steers.jsonl; one
//   that didn't isn't marked seen, so it is offered again tomorrow;
// - state/claims.jsonl was only appended to (against git HEAD); an edited or
//   deleted claim is restored;
// - each outbox note has a lab name (or updates a note the lab published),
//   and renders and converts; refusals are kept in outbox/rejected/.
//
// Prints a one-line summary for the commit message.

import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { KINO, LAB, frontMatter, json, now, readJson, readJsonl } from "./lib.mjs";
import { renderNote } from "./render.mjs";

const ORIGIN = readJson(join(LAB, "config/lab.json")).kinocomputing.origin;

/** A note's title: its opening bold line. */
const titleOf = (markdown) => markdown.trim().match(/^\*\*(.+?)\*\*\s*$/m)?.[1] ?? null;

/**
 * An experiment as a reader can follow it: the published note that links its
 * results, as a link, or failing that its name in words.
 */
function experimentTold(dir) {
  const folder = join(LAB, "published");
  for (const file of existsSync(folder) ? readdirSync(folder).filter((x) => x.endsWith(".md")).sort().reverse() : []) {
    const { body } = frontMatter(readFileSync(join(folder, file), "utf8"));
    const title = titleOf(body);
    if (title && body.includes(`experiments/${dir}/`)) return `the experiment in [${title}](${ORIGIN}${file.replace(/\.md$/, "")})`;
  }
  return `the ${dir.replace(/^e\d+-/, "").replace(/-/g, " ")} experiment`;
}

const args = process.argv.slice(2);
const outputPath = args.includes("--claude-output") ? args[args.indexOf("--claude-output") + 1] : join(LAB, "state/claude-output.json");
const config = readJson(join(LAB, "config/lab.json"));
const run = readJson(join(LAB, "state/run.json"), null);
const report = [];
const summary = [];
// What the brief says settle saw: the same events as `report`, for a reader
// who can't see the lab (no ids, no file names).
const told = [];
let spent = 0;

if (!run) {
  console.log("settle: no run.json; nothing to settle");
  process.exit(0);
}

// 1. Spend. Recorded whatever happened: a failed run still cost money. The
// model's cost and tonight's Exa searches come out of the same bank.
const output = existsSync(outputPath) ? JSON.parse(readFileSync(outputPath, "utf8")) : null;
const exaUsd = Math.round(readJsonl(join(LAB, "state/search-spend.jsonl"))
  .filter((l) => l.date === run.date).reduce((sum, l) => sum + l.usd, 0) * 10000) / 10000;
if (output) {
  const usd = Number(output.total_cost_usd ?? 0);
  appendFileSync(join(LAB, "state/spend.jsonl"), `${JSON.stringify({ date: run.date, usd, source: "model", ...(process.env.LAB_LOCAL === "1" ? { account: "local" } : {}), model: run.model, kind: run.kind, turns: output.num_turns ?? null, error: !!output.is_error })}\n`);
  summary.push(`$${usd.toFixed(2)}`);
  spent += usd;
  if (output.is_error) {
    report.push(`- The shift ended in an error (${output.subtype ?? "unknown"}).`);
    told.push("The researcher's session ended in an error.");
  }
}
if (exaUsd > 0) {
  appendFileSync(join(LAB, "state/spend.jsonl"), `${JSON.stringify({ date: run.date, usd: exaUsd, source: "exa" })}\n`);
  summary.push(`$${exaUsd.toFixed(2)} Exa`);
  spent += exaUsd;
}
// Reading shown in tonight's briefing isn't shown again.
if (run.reading?.length) {
  const shown = readJson(join(LAB, "state/reading.json"), []);
  writeFileSync(join(LAB, "state/reading.json"), json([...new Set([...shown, ...run.reading])]));
}
// Replications run after the shift, so the shift couldn't report them.
for (const r of readJson(join(LAB, "state/replications.json"), [])) {
  const what = experimentTold(r.experiment);
  if (r.error) {
    report.push(`- Replication of ${r.experiment} failed to run: ${r.error.split("\n")[0]}`);
    told.push(`The automatic rerun of ${what} on fresh random numbers failed to run.`);
  } else if (r.skipped) {
    report.push(`- Replication of ${r.experiment} skipped: ${r.skipped}.`);
  } else {
    report.push(`- Replication of ${r.experiment} on seed ${r.seed}: ${r.agrees ? "agrees" : "disagrees"} (${r.metric} ${r.value}, was ${r.original}).`);
    // Agreement is the verdict (pass or fail, decided in advance), not the number.
    told.push(`The automatic rerun of ${what} on fresh random numbers ${r.agrees ? "reached the same verdict as" : "**reached a different verdict from**"} the original (it scored ${r.value}; the original ${r.original}).`);
  }
}
if (run.skip) {
  console.log("settle: skipped night");
  process.exit(0);
}
// A shift that left no account of itself (killed hard, or crashed) is
// counted at its cap: the bank must never think it's richer than it is.
if (!output) {
  appendFileSync(join(LAB, "state/spend.jsonl"), `${JSON.stringify({ date: run.date, usd: run.max_usd, source: "model", ...(process.env.LAB_LOCAL === "1" ? { account: "local" } : {}), model: run.model, kind: run.kind, estimated: true })}\n`);
  summary.push(`~$${run.max_usd.toFixed(2)} (no cost report; counted at the cap)`);
  spent += run.max_usd;
  report.push("- The shift left no cost report, so it is counted at its cap.");
}
// The runner says how the shift ended: 124 is the time limit.
const exit = Number(process.env.SHIFT_EXIT ?? 0);
if (exit === 124) {
  report.push("- The shift hit its time limit and was stopped. What it had written is kept for the next shift; anything it hadn't published waits.");
  told.push("The shift ran out of time and was stopped; unfinished work carries over to the next one.");
} else if (exit) {
  report.push(`- The shift exited with status ${exit}. What it had written is kept for the next shift.`);
  told.push("The shift stopped unexpectedly; what it had written carries over to the next one.");
}
const today = join(LAB, "journal", `${run.date}.md`);
if (!existsSync(today) || readFileSync(today, "utf8").length === 0) report.push("- No journal entry was written tonight.");

// The machinery the shift changed, which tools/restore-machinery.sh put back
// before this ran.
const machinery = existsSync(join(LAB, "state/machinery-changes.txt"))
  ? readFileSync(join(LAB, "state/machinery-changes.txt"), "utf8").split("\n").filter(Boolean) : [];
if (machinery.length) {
  report.push(`- The shift changed the lab's machinery, which was put back: ${machinery.join(", ")}. If a change was worth making, it's the PI's to make.`);
  told.push("The researcher edited the lab's own tools or rules; they were put back as they were.");
}

// 2. Steers: delivered only once handled.
const handled = new Set(readJsonl(join(LAB, "state/steers.jsonl")).map((line) => line.steer));
const seen = readJson(join(LAB, "state/seen.json"), {});
if (run.baseline) seen.takes ??= {};
const mark = ({ key, value }) => { (seen.takes ??= {})[key] = value; };
for (const m of run.marks ?? []) mark(m);
const missed = [];
for (const steer of run.steers) {
  if (handled.has(steer.id)) mark(steer.seen);
  else missed.push(steer.id);
}
writeFileSync(join(LAB, "state/seen.json"), json(seen));
if (missed.length) {
  report.push(`- Takes not handled, offered again tomorrow: ${missed.join(", ")}`);
  const urls = run.steers.filter((st) => missed.includes(st.id)).map((st) => st.url);
  told.push(`Not answered tonight, and offered again tomorrow: ${urls.map((u) => (u ? `[${u.replace(/^https?:\/\//, "")}](${u})` : "one of the PI's posts")).join(", ")}.`);
}

// 3. Claims: append-only.
// Two ladders (CHARTER.md): experiments, and literature studies.
const STAGES = new Set(["conjecture", "simulated", "replicated", "real-data", "counted", "hand-checked", "full-text", "cross-checked", "challenged", "refuted"]);
const claimsPath = join(LAB, "state/claims.jsonl");
let committed = [];
try {
  committed = execFileSync("git", ["show", "HEAD:state/claims.jsonl"], { cwd: LAB, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
    .split("\n").filter((l) => l.trim());
} catch {
  committed = [];
}
const current = existsSync(claimsPath) ? readFileSync(claimsPath, "utf8").split("\n").filter((l) => l.trim()) : [];
const kept = new Set(committed);
const appended = current.filter((line) => !kept.has(line));
const lost = committed.filter((line) => !current.includes(line));
const valid = appended.filter((line) => {
  try {
    const claim = JSON.parse(line);
    const ok = /^c-\d+$/.test(claim.id) && STAGES.has(claim.stage) && typeof claim.statement === "string";
    if (!ok) report.push(`- A claim line was malformed and dropped: ${line.slice(0, 80)}`);
    return ok;
  } catch {
    report.push(`- A claim line wasn't JSON and was dropped: ${line.slice(0, 80)}`);
    return false;
  }
});
if (lost.length) report.push(`- ${lost.length} committed claim line(s) were edited or removed; restored. Claims are append-only.`);
if (lost.length || valid.length !== appended.length) told.push("Some of the lab's record of its claims was malformed or rewritten; the record was restored.");
if (lost.length || valid.length !== appended.length) {
  writeFileSync(claimsPath, [...committed, ...valid].map((l) => `${l}\n`).join(""));
}
if (valid.length) summary.push(`${valid.length} claim(s)`);

// 4. Publish the outbox.

// What a quote may name (kinocomputing P22): a note on kinocomputing — by its
// file name or the address it's published at — that is, or will be when
// tonight's push is registered, a live fragment. Claims written tonight are
// already in KINO/notes when the threads quoting them render.
const registry = readJson(join(KINO, "blyg/_registry.json"), { items: {} }).items;
function quoteResolver(name) {
  const slug = existsSync(join(KINO, "notes", `${name}.html`)) ? name
    : Object.keys(registry).find((s) => registry[s].page === name);
  if (!slug || !existsSync(join(KINO, "notes", `${slug}.html`))) throw new Error(`quotes ${name}, which isn't a note on kinocomputing`);
  const entry = registry[slug];
  const page = readFileSync(join(KINO, "notes", `${slug}.html`), "utf8");
  const thread = entry ? (entry.kind ?? (entry.stub_of ? "thread" : "fragment")) === "thread"
    : /<meta name="blyg:kind" content="thread">/.test(page);
  if (thread) throw new Error(`quotes ${name}, a write-up; only claims, paradigm entries and the PI's notes can be quoted`);
  return { slug, html: page.match(/<main>([\s\S]*?)<\/main>/)?.[1] ?? "" };
}
const outbox = join(LAB, "outbox");
const rejected = join(outbox, "rejected");
const names = existsSync(outbox) ? readdirSync(outbox).filter((f) => f.endsWith(".md")).sort() : [];
const pattern = new RegExp(config.publish.name_pattern);
const isPublished = (name) => existsSync(join(LAB, "published", `${name}.md`));
let count = 0;
const reject = (file, why) => {
  mkdirSync(rejected, { recursive: true });
  renameSync(join(outbox, file), join(rejected, file));
  report.push(`- Not published: ${file.replace(/\.md$/, "")} ${why}.`);
};
// Fragments (claims, paradigm entries) publish before the threads that quote
// them (§7: the thread last). Every note counts toward the night's limit,
// claims included; claims have a smaller limit of their own as well.
const FRAGMENTS = new Set(["claim", "paradigm"]);
const shape = (kind) => (FRAGMENTS.has(kind) ? kind : "write-up");
const parsed = names.map((file) => ({ file, name: file.replace(/\.md$/, ""), ...frontMatter(readFileSync(join(outbox, file), "utf8")) }));
parsed.sort((a, b) => FRAGMENTS.has(b.data.kind) - FRAGMENTS.has(a.data.kind) || a.file.localeCompare(b.file));
let claims = 0;
const BRIEF = `lab-${run.date}-brief`;
const out = [];
const paradigmsPath = join(LAB, "state/paradigms.json");
const tracker = readJson(paradigmsPath, { paradigms: [] });
const looked = new Set();
for (const { file, name, data, body } of parsed) {
  const claim = data.kind === "claim";
  if (!pattern.test(name) && !isPublished(name)) { reject(file, "— not a lab note name"); continue; }
  if (name === BRIEF) { reject(file, "— that name is the nightly brief's, which settle writes"); continue; }
  const update = isPublished(name);
  if (update && shape(frontMatter(readFileSync(join(LAB, "published", file), "utf8")).data.kind) !== shape(data.kind)) {
    reject(file, "— a note's kind can't change: a claim stays a claim, a paradigm entry an entry, and a write-up a write-up");
    continue;
  }
  // Every new version says what changed: the change note is what a reader
  // sees in the note's history, so an update without one isn't published.
  if (update && !String(data.change_note ?? "").trim()) {
    reject(file, "— an update needs a change note (`change_note:`) saying what changed");
    continue;
  }
  if (data.kind === "paradigm" && !(tracker.paradigms ?? []).some((p) => p.id === data.paradigm)) {
    reject(file, `— a paradigm entry names its paradigm, and "${data.paradigm ?? ""}" isn't one on the tracker's list`);
    continue;
  }
  if (count + claims >= config.publish.max_notes_per_night) {
    reject(file, `— over the ${config.publish.max_notes_per_night}-note nightly limit`);
    continue;
  }
  if (claim && claims >= config.publish.max_claims_per_night) {
    reject(file, `— over the ${config.publish.max_claims_per_night}-claim nightly limit`);
    continue;
  }
  // A voice is one of voices/: its name is the file's heading.
  let voice = null;
  if (data.voice) {
    const guide = join(LAB, "voices", `${data.voice}.md`);
    if (!/^[a-z0-9-]+$/.test(String(data.voice)) || data.voice === "readme" || !existsSync(guide)) {
      reject(file, `— no such voice as "${data.voice}"`);
      continue;
    }
    voice = readFileSync(guide, "utf8").match(/^# (.+)$/m)?.[1] ?? data.voice;
  }
  let page;
  try {
    page = await renderNote({
      markdown: body, name, voice, pin: data.pin === true, changeNote: update ? data.change_note ?? null : null,
      answers: !update && data.answers ? data.answers : null, kind: data.kind, section: data.section ?? null, maxClaim: config.publish.max_claim_chars, maxParadigm: config.publish.max_paradigm_chars,
      quote: quoteResolver, model: run.model, at: now(), kino: KINO, origin: config.kinocomputing.origin,
    });
  } catch (error) {
    reject(file, error.message);
    continue;
  }
  writeFileSync(join(KINO, "notes", `${name}.html`), page);
  mkdirSync(join(LAB, "published"), { recursive: true });
  renameSync(join(outbox, file), join(LAB, "published", file));
  if (claim) claims += 1;
  else count += 1;
  summary.push(`${update ? "updated" : "published"} ${name}`);
  out.push({ name, title: titleOf(body) ?? name, update, claim, paradigm: data.kind === "paradigm" });
  if (data.kind === "paradigm") looked.add(data.paradigm);
}
// The rotation moves on only for a paradigm whose entry went out tonight: one
// the shift didn't get to comes round again tomorrow.
if (looked.size) {
  for (const p of tracker.paradigms) if (looked.has(p.id)) p.last_checked = run.date;
  writeFileSync(paradigmsPath, json(tracker));
}
// The site's tracker table reads the whole list, every night: each paradigm
// in its group, when it was last looked at, and its entry if it has one.
if ((tracker.paradigms ?? []).length) {
  const entryOf = new Map();
  for (const file of existsSync(join(LAB, "published")) ? readdirSync(join(LAB, "published")) : []) {
    const { data } = frontMatter(readFileSync(join(LAB, "published", file), "utf8"));
    if (data.kind === "paradigm" && data.paradigm) entryOf.set(data.paradigm, file.replace(/\.md$/, ""));
  }
  const groups = [];
  for (const p of tracker.paradigms) {
    let group = groups.find((g) => g.name === p.group);
    if (!group) groups.push(group = { name: p.group, paradigms: [] });
    group.paradigms.push({ id: p.id, name: p.name, last_checked: p.last_checked ?? null, entry: entryOf.get(p.id) ?? null });
  }
  writeFileSync(join(KINO, "notes", "_tracker.json"), json({ updated: run.date, source: tracker.source ?? null, groups }));
}
const unvisited = (run.paradigms ?? []).filter((id) => !looked.has(id));
if (unvisited.length) report.push(`- Tonight's paradigms not looked at, so they come round again: ${unvisited.join(", ")}.`);
const held = parsed.length - out.length;
if (held) told.push(`${held} note${held === 1 ? " was" : "s were"} held back for failing the publishing checks; [the lab's log](https://github.com/${config.lab.repo}/blob/main/MORNING.md) says why.`);
// The night's floor. Settle can't write notes, so a short night is said
// plainly, here and in the brief, rather than made up.
const floor = config.publish.min_notes_per_night ?? 0;
if (out.length < floor) {
  report.push(`- Published ${out.length} note(s), under the nightly minimum of ${floor}.`);
  told.push(`${out.length === 0 ? "Nothing was" : `Only ${out.length} note${out.length === 1 ? " was" : "s were"}`} published tonight, short of the lab's nightly ${floor}.`);
}

// 5. Tonight's brief, on kinocomputing: the shift's own account, then what
// settle saw. A second shift on the same day updates the day's brief.
const morningPath = join(LAB, "MORNING.md");
// Its headings become bold lines, the brief's own style ("Published
// tonight"), so the page reads as one piece in one type.
const shiftSaid = existsSync(morningPath)
  ? readFileSync(morningPath, "utf8").replace(/^#[^\n]*\n/, "").replace(/^#{1,6}[ \t]+(.+?)[ \t#]*$/gm, "**$1**").trim() : "";
const dateWords = new Date(`${run.date}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const modelWords = (run.model ?? "").replace(/^claude-/, "Claude ").replace(/-(\d+)-(\d+)$/, " $1.$2").replace(/ (\w)/g, (m, c) => ` ${c.toUpperCase()}`);
const briefOf = (said) => [
  `**Lab brief: ${dateWords}**`,
  said || "The researcher left no summary tonight.",
  ...(out.length ? ["**Published tonight**", out.map((n) => `- [${n.title}](${ORIGIN}${n.name})${n.update ? " (updated)" : ""}${n.claim ? ", a claim" : n.paradigm ? ", a paradigm entry" : ""}`).join("\n")] : []),
  "**Also tonight**",
  [...told, `The shift cost $${spent.toFixed(2)}, on ${modelWords}.`].map((l) => `- ${l}`).join("\n"),
].join("\n\n");
const briefUpdate = isPublished(BRIEF);
let briefMd = briefOf(shiftSaid);
let briefPage = null;
const renderBrief = (markdown) => renderNote({
  markdown, name: BRIEF, kind: "brief", changeNote: briefUpdate ? "Another shift ran today; this is its brief." : null,
  quote: quoteResolver, model: run.model, at: now(), kino: KINO, origin: config.kinocomputing.origin,
});
try {
  briefPage = await renderBrief(briefMd);
} catch (error) {
  // The shift's own words didn't pass; settle's alone always should.
  report.push(`- The shift's MORNING.md couldn't go in the brief: it ${error.message}.`);
  briefMd = briefOf(`The researcher's summary didn't pass the publishing checks tonight; it's in [the lab's log](https://github.com/${config.lab.repo}/blob/main/MORNING.md).`);
  try {
    briefPage = await renderBrief(briefMd);
  } catch (again) {
    report.push(`- The brief wasn't published: it ${again.message}.`);
  }
}
if (briefPage) {
  writeFileSync(join(KINO, "notes", `${BRIEF}.html`), briefPage);
  mkdirSync(join(LAB, "published"), { recursive: true });
  writeFileSync(join(LAB, "published", `${BRIEF}.md`), `---\nkind: brief\npin: false\n---\n\n${briefMd}\n`);
  summary.push(`${briefUpdate ? "updated" : "published"} the brief`);
}

// 6. The morning report gets what the shift couldn't see.
if (report.length) {
  const morning = join(LAB, "MORNING.md");
  const prior = existsSync(morning) ? readFileSync(morning, "utf8").trimEnd() : `# ${run.date}`;
  writeFileSync(morning, `${prior}\n\n## From settle\n\n${report.join("\n")}\n`);
}
writeFileSync(join(LAB, "state/last-settle.json"), json({ date: run.date, summary, report }));
console.log(`settle: ${summary.join(", ") || "nothing published"}`);
