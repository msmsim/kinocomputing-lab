// After the shift: record what it cost, check it kept the lab's rules, and
// publish its outbox to kinocomputing. Spends nothing; holds every credential
// the agent never sees.
//
//   node tools/settle.mjs [--claude-output state/claude-output.json]
//
// Then writes the day's brief (lab-YYYY-MM-DD-brief): the shift's own
// MORNING.md, written for anyone, and what settle saw, in words a reader
// outside the lab can follow. It is held for its release, a few hours after
// the night's notes (tools/release.mjs); the PI reads it on the blyg.
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
import { createHash } from "node:crypto";
import { appendFileSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { KINO, LAB, frontMatter, json, now, readJson, readJsonl, sundayPlan } from "./lib.mjs";
import { labIdIn, renderNote } from "./render.mjs";
import { checkImage } from "./figure.mjs";
import { dueAt, hold, release } from "./release.mjs";
import { itemsOf, shippedFor } from "./shipped.mjs";
import { currentOn, forSite, readEmphases } from "./emphases.mjs";
import { missionOf } from "./mission.mjs";

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
// Matt's emphases (emphases/): committed, and put back with the machinery
// before settle, so these are his, not the shift's.
const emphasisList = readEmphases(LAB).all;
const run = readJson(join(LAB, "state/run.json"), null);
const report = [];
const summary = [];
// What the brief says settle saw: the same events as `report`, for a reader
// who can't see the lab (no ids, no file names).
const told = [];
let spent = 0;
// What settle appends to the spend record, checked against it at the end.
const spendPath = join(LAB, "state/spend.jsonl");
const spendBefore = readJsonl(spendPath).length;
let spendAppended = 0;
const recordSpend = (line) => { appendFileSync(spendPath, `${JSON.stringify(line)}\n`); spendAppended += 1; };

// 0. Held pages whose time has come go out first (tools/release.mjs): a
// release whose trigger never came goes out with the next shift.
const releasedFirst = release(LAB, KINO, now());
if (releasedFirst.length) summary.push(`released ${releasedFirst.filter((p) => p.startsWith("notes/")).map((p) => p.slice(6, -5)).join(", ")}`);

if (!run) {
  console.log("settle: no run.json; nothing to settle");
  process.exit(0);
}

// 1. Spend. Recorded whatever happened: a failed run still cost money. The
// model's cost and tonight's Exa searches come out of the same bank.
const output = existsSync(outputPath) ? JSON.parse(readFileSync(outputPath, "utf8")) : null;
// This shift's searches only: since it began, so the day's second shift
// doesn't count the first's again. (A line with no time is the day's.)
const exaUsd = Math.round(readJsonl(join(LAB, "state/search-spend.jsonl"))
  .filter((l) => l.date === run.date && (!run.at || !l.at || l.at >= run.at)).reduce((sum, l) => sum + l.usd, 0) * 10000) / 10000;
if (output) {
  const usd = Number(output.total_cost_usd ?? 0);
  recordSpend({ date: run.date, usd, source: "model", ...(process.env.LAB_LOCAL === "1" ? { account: "local" } : {}), model: run.model, kind: run.kind, turns: output.num_turns ?? null, error: !!output.is_error });
  summary.push(`$${usd.toFixed(2)}`);
  spent += usd;
  if (output.is_error) {
    report.push(`- The shift ended in an error (${output.subtype ?? "unknown"}).`);
    told.push("The researcher's session ended in an error.");
  }
}
if (exaUsd > 0) {
  recordSpend({ date: run.date, usd: exaUsd, source: "exa" });
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
  recordSpend({ date: run.date, usd: run.max_usd, source: "model", ...(process.env.LAB_LOCAL === "1" ? { account: "local" } : {}), model: run.model, kind: run.kind, estimated: true });
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
  report.push(`- The shift changed the lab's machinery, which was put back for tonight and proposed as a pull request (README, "Proposals"): ${machinery.join(", ")}.`);
  told.push("The researcher edited the lab's own tools or rules; they were put back as they were.");
}

// 2. Steers: delivered only once handled.
//
// The hopper first (AGENT.md, "The hopper"): the lab's reading list, every
// link the PI shared and every one the lab found worth keeping, a line each
// in state/hopper.jsonl. Lines for the same link merge, the first fixing when
// it was added, later ones adding or correcting. A line that fails the checks
// is left out of what the site shows, and said.
const hopperLines = readJsonl(join(LAB, "state/hopper.jsonl"));
// When each link came in: settle stamps a line with the day it first reads
// it, and the stamp stays, so a link keeps its own day on the Reading page
// however many nights later the list is rebuilt.
if (hopperLines.some((line) => !/^\d{4}-\d{2}-\d{2}$/.test(String(line.added ?? "")))) {
  for (const line of hopperLines) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(line.added ?? ""))) line.added = run.date;
  }
  writeFileSync(join(LAB, "state/hopper.jsonl"), hopperLines.map((line) => JSON.stringify(line)).join("\n") + "\n");
}
const knownParadigms = new Set((readJson(join(LAB, "state/paradigms.json"), { paradigms: [] }).paradigms ?? []).map((p) => p.id));
const hopper = new Map();
for (const line of hopperLines) {
  const problem = !/^https?:\/\//.test(String(line.url ?? "")) ? "has no http(s) link"
    : !String(line.title ?? "").trim() && !hopper.has(line.url) ? "has no title"
    : String(line.why ?? "").length > 240 ? "has a line over 240 characters"
    : labIdIn(`<p>${line.title ?? ""} ${line.why ?? ""}</p>`) ? `says "${labIdIn(`<p>${line.title ?? ""} ${line.why ?? ""}</p>`)}", which readers can't look up`
    : null;
  if (problem) { report.push(`- A hopper line ${problem}, so it isn't shown: ${JSON.stringify(line).slice(0, 120)}`); continue; }
  const before = hopper.get(line.url) ?? { added: line.added ?? run.date, used_in: [], paradigms: [] };
  hopper.set(line.url, {
    ...before,
    ...Object.fromEntries(Object.entries(line).filter(([k, v]) => v != null && v !== "" && !["used_in", "paradigms", "added"].includes(k))),
    paradigms: [...new Set([...before.paradigms, ...(line.paradigms ?? [])])].filter((id) => knownParadigms.has(id)),
    used_in: [...new Set([...before.used_in, ...(line.used_in ?? [])])],
  });
}
// A share is handled when the shift has said what it did with it, and either
// put it in the hopper or said why not (`disregarded`): the bar for leaving
// out what the PI chose to send is high, so leaving one out takes a reason.
const steerLines = readJsonl(join(LAB, "state/steers.jsonl"));
const shareInHopper = (slug) => [...hopper.values()].some((h) => h.share === slug);
const handled = new Set(steerLines.filter((line) => {
  if (!String(line.steer ?? "").startsWith("share:")) return true;
  if (String(line.disregarded ?? "").trim() || shareInHopper(line.steer.slice(6))) return true;
  report.push(`- ${line.steer} was recorded but is neither in the hopper nor disregarded with a reason; offered again.`);
  return false;
}).map((line) => line.steer));
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
  const urls = run.steers.filter((st) => missed.includes(st.id) && !st.share).map((st) => st.url);
  const shares = run.steers.filter((st) => missed.includes(st.id) && st.share).length;
  if (urls.length) told.push(`Not answered tonight, and offered again tomorrow: ${urls.map((u) => (u ? `[${u.replace(/^https?:\/\//, "")}](${u})` : "one of the PI's posts")).join(", ")}.`);
  if (shares) told.push(`${shares} shared link${shares === 1 ? " wasn't" : "s weren't"} weighed tonight, and will be next time.`);
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
// A note held for release (a Sunday's week in review) can be quoted too: it
// is on kinocomputing by the time anyone reads the note quoting it.
const notePath = (slug) => [join(KINO, "notes", `${slug}.html`), join(LAB, "held", "notes", `${slug}.html`)].find((p) => existsSync(p));
function quoteResolver(name) {
  const slug = notePath(name) ? name
    : Object.keys(registry).find((s) => registry[s].page === name);
  if (!slug || !notePath(slug)) throw new Error(`quotes ${name}, which isn't a note on kinocomputing`);
  const entry = registry[slug];
  const page = readFileSync(notePath(slug), "utf8");
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
// The brief goes out at its release time, a few hours after the night's
// notes (tools/release.mjs); until then settle holds it, dated for then. A
// Sunday's week in review is held with it. Past that time, or for a brief
// already out, it goes straight to kinocomputing.
const due = dueAt(run.date, config);
const holding = now() < due;
const holdNotes = holding && run.sunday?.job === "week-in-review";
const briefLive = existsSync(join(KINO, "notes", `${BRIEF}.html`));
const briefHeld = holding && !briefLive;
const place = (path, bytes, held) => {
  if (held) return hold(LAB, path, bytes, due);
  mkdirSync(dirname(join(KINO, path)), { recursive: true });
  writeFileSync(join(KINO, path), bytes);
};
// The day so far: what earlier shifts today published and said, kept for the
// brief and for the day's limits on notes. A day can have two shifts
// (README, "A night"); the brief is the day's, not the shift's.
const SHIFT = Number(run.shift ?? 1);
const dayPath = join(LAB, "state/brief-day.json");
const dayBefore = readJson(dayPath, null);
const earlierShifts = dayBefore?.date === run.date ? (dayBefore.shifts ?? []).filter((s) => s.shift !== SHIFT) : [];
const earlierToday = earlierShifts.reduce((n, s) => n + (s.out ?? []).length, 0);
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
  // An emphasis that isn't running doesn't cost the note; it counts for none.
  if (data.emphasis && !currentOn(emphasisList, run.date).some((e) => e.id === data.emphasis)) {
    report.push(`- ${file} names the emphasis "${data.emphasis}", which isn't a current one (emphases/), so it counts for none.`);
  }
  if (data.kind === "paradigm" && !(tracker.paradigms ?? []).some((p) => p.id === data.paradigm)) {
    reject(file, `— a paradigm entry names its paradigm, and "${data.paradigm ?? ""}" isn't one on the tracker's list`);
    continue;
  }
  if (earlierToday + count + claims >= config.publish.max_notes_per_day) {
    reject(file, `— over the ${config.publish.max_notes_per_day}-note daily limit`);
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
  // A note's images live beside it, in a folder of its name: in the outbox
  // while it waits, in published/ once it's out (an update can reuse them).
  // Each is checked against the house rules, named by its contents, and
  // written to kinocomputing's media/ only once the note itself renders.
  const placed = [];
  const image = (src) => {
    if (!/^[a-z0-9][a-z0-9._-]*\.(?:svg|png)$/i.test(src)) throw new Error(`has an image "${src}": name a file beside the note (letters, digits, dashes; .svg or .png)`);
    const from = [join(outbox, name, src), join(LAB, "published", name, src)].find((p) => existsSync(p));
    if (!from) throw new Error(`has an image "${src}" that isn't in outbox/${name}/`);
    const bytes = readFileSync(from);
    const { kind, width, height, problems } = checkImage(bytes, src);
    if (problems.length) throw new Error(`has an image "${src}" that ${problems.join("; ")} (config/house/STYLE.md)`);
    const file = `${createHash("sha256").update(bytes).digest("hex").slice(0, 16)}${src.slice(src.lastIndexOf(".")).toLowerCase()}`;
    placed.push({ file, bytes });
    return { url: `${config.kinocomputing.origin}media/${file}`, width, height, kind };
  };
  let page;
  try {
    page = await renderNote({
      markdown: body, name, voice, pin: data.pin === true, changeNote: update ? data.change_note ?? null : null,
      answers: !update && data.answers ? data.answers : null, kind: data.kind, section: data.section ?? null, maxClaim: config.publish.max_claim_chars, maxParadigm: config.publish.max_paradigm_chars,
      quote: quoteResolver, image, model: run.model, at: holdNotes ? due : now(), kino: KINO, origin: config.kinocomputing.origin,
    });
  } catch (error) {
    reject(file, error.message);
    continue;
  }
  for (const { file: media, bytes } of placed) place(`media/${media}`, bytes, holdNotes);
  if (existsSync(join(outbox, name))) {
    mkdirSync(join(LAB, "published", name), { recursive: true });
    // Copied over what's there, not renamed: a folder can't be renamed onto
    // one that already has files (an update's figures, say).
    cpSync(join(outbox, name), join(LAB, "published", name), { recursive: true, force: true });
    rmSync(join(outbox, name), { recursive: true, force: true });
  }
  place(`notes/${name}.html`, page, holdNotes);
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
  for (const file of existsSync(join(LAB, "published")) ? readdirSync(join(LAB, "published")).filter((f) => f.endsWith(".md")) : []) {
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
// The emphases, for the site's About page: the current ones, the past, and
// where they're kept.
if (emphasisList.length || existsSync(join(KINO, "notes", "_emphases.json"))) {
  writeFileSync(join(KINO, "notes", "_emphases.json"), json(forSite(emphasisList, run.date, `https://github.com/${config.lab.repo}/tree/main/emphases`)));
}
// The mission, for About: Matt's words from the charter, as committed.
const mission = missionOf(LAB);
if (mission || existsSync(join(KINO, "notes", "_mission.json"))) {
  writeFileSync(join(KINO, "notes", "_mission.json"), json({ updated: run.date, mission, source: `https://github.com/${config.lab.repo}/blob/main/CHARTER.md#mission` }));
}
// What the day's notes did for them, for the brief.
const emphasisToday = (() => {
  const current = currentOn(emphasisList, run.date);
  if (!current.length) return null;
  const counts = new Map(current.map((e) => [e.id, 0]));
  for (const file of readdirSync(join(LAB, "published")).filter((f) => f.startsWith(`lab-${run.date}-`) && f.endsWith(".md"))) {
    const { emphasis } = frontMatter(readFileSync(join(LAB, "published", file), "utf8")).data;
    if (counts.has(emphasis)) counts.set(emphasis, counts.get(emphasis) + 1);
  }
  const served = current.filter((e) => counts.get(e.id));
  return served.length
    ? `On the lab's current emphases: ${served.map((e) => `${counts.get(e.id)} note${counts.get(e.id) === 1 ? "" : "s"} on ${e.title.charAt(0).toLowerCase()}${e.title.slice(1)}`).join("; ")}.`
    : "None of today's notes took up one of the lab's current emphases.";
})();
// The hopper, for the site's Reading page: every link, newest first, with the
// lab's line on it and the notes that used it. Each has an anchor: a share's
// is the file Subset's receiver gave it, which is the address it told
// Subset; anything else's comes from its link.
const hopperItems = [...hopper.values()].map((h) => ({
  id: h.share ?? `r-${createHash("sha256").update(h.url).digest("hex").slice(0, 10)}`,
  url: h.url,
  title: String(h.title ?? "").trim() || h.url,
  site: (() => { try { return new URL(h.url).hostname.replace(/^www\./, ""); } catch { return ""; } })(),
  added: h.added,
  from: h.share ? "pi" : h.from === "pi" ? "pi" : "lab",
  paradigms: h.paradigms,
  why: String(h.why ?? "").trim(),
  used_in: h.used_in.filter((name) => isPublished(name)),
})).sort((a, b) => b.added.localeCompare(a.added) || a.title.localeCompare(b.title));
if (hopperItems.length || existsSync(join(KINO, "notes", "_hopper.json"))) {
  writeFileSync(join(KINO, "notes", "_hopper.json"), json({ updated: run.date, items: hopperItems }));
}
const addedToday = hopperItems.filter((h) => h.added === run.date);
// The roadmap's headlines done since a brief last named them (tools/shipped.mjs):
// the day's brief says what shipped. No roadmap on the site, nothing to say.
const roadmapPath = join(KINO, "notes", "_roadmap.json");
const shippedPath = join(LAB, "state/roadmap-shipped.json");
let shippedToday = [];
if (existsSync(roadmapPath)) {
  // A roadmap that doesn't parse is the site's to fix; it never costs the night.
  const roadmap = (() => { try { return JSON.parse(readFileSync(roadmapPath, "utf8")); } catch { return {}; } })();
  const { record, today } = shippedFor(itemsOf(roadmap), readJson(shippedPath, null), run.date);
  writeFileSync(shippedPath, json(record));
  shippedToday = today;
}
// The brief names five of them: the ones the shifts marked `pick`, in the
// order they were picked, then the day's others to make up the five.
const picked = new Set([...hopper.values()].filter((h) => h.pick === true).map((h) => h.url));
const briefReads = [...addedToday.filter((h) => picked.has(h.url)), ...addedToday.filter((h) => !picked.has(h.url))].slice(0, 5);
if (addedToday.length > 5 && !addedToday.some((h) => picked.has(h.url))) {
  report.push(`- None of today's ${addedToday.length} new links was picked for the brief, so it shows the first five; mark the best with \`"pick": true\` (AGENT.md, "The hopper").`);
}
const unvisited = (run.paradigms ?? []).filter((id) => !looked.has(id));
if (unvisited.length) report.push(`- Tonight's paradigms not looked at, so they come round again: ${unvisited.join(", ")}.`);
// Where the shift looked (AGENT.md, "Where to look"): every search it ran,
// by source, and each kind of looking a paradigm pass owes that it skipped.
const searched = readJsonl(join(LAB, "state/search-log.jsonl")).filter((s) => s.date === run.date && Number(s.shift ?? 1) === SHIFT);
const KINDS = {
  "literature beyond OpenAlex and arXiv": (s) => ["s2", "europepmc"].includes(s.source),
  "a citation trail": (s) => /-(?:cites|refs)$/.test(s.source),
  "the regional lens": (s) => Boolean(s.country) || ["ukri", "openaire"].includes(s.source),
  "money": (s) => ["nsf", "nih", "ukri", "openaire", "edgar"].includes(s.source),
  "what an outsider can use": (s) => ["github", "zenodo"].includes(s.source) || s.patents,
};
if (searched.length || looked.size) {
  const bySource = new Map();
  for (const s of searched) {
    const name = s.source === "openalex" && s.country ? "openalex (regional)" : s.source === "exa" && s.patents ? "exa (patents)" : s.source;
    bySource.set(name, (bySource.get(name) ?? 0) + 1);
  }
  report.push(`- Searches: ${searched.length ? [...bySource].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ") : "none logged"}.`);
  const skipped = looked.size ? Object.entries(KINDS).filter(([, is]) => !searched.some(is)).map(([kind]) => kind) : [];
  if (skipped.length) report.push(`- Paradigms were looked at without ${skipped.join(", ")} (AGENT.md, "Where to look").`);
}
const held = parsed.length - out.length;
if (held) told.push(`${held} note${held === 1 ? " was" : "s were"} held back for failing the publishing checks; [the lab's log](https://github.com/${config.lab.repo}/blob/main/MORNING.md) says why.`);
// The day's floor, judged by the day's last shift on everything the day
// published. Settle can't write notes, so a short day is said plainly, here
// and in the brief, rather than made up.
// A Sunday's is lower: the week in review and the deep dive or roundtable.
const floor = sundayPlan(run.date, config.sunday) ? config.sunday.floor : config.publish.min_notes_per_day ?? 0;
const dayTotal = earlierToday + out.length;
if (SHIFT >= (config.shifts?.per_day ?? 1) && dayTotal < floor) {
  report.push(`- Published ${dayTotal} note(s) today, under the daily minimum of ${floor}.`);
  told.push(`${dayTotal === 0 ? "Nothing was" : `Only ${dayTotal} note${dayTotal === 1 ? " was" : "s were"}`} published today, short of the lab's daily ${floor}.`);
}

// The day's picture: every brief opens with one (AGENT.md, "The brief"). The
// shift leaves it in outbox/brief/ — the drawing and picture.json, its file,
// alt text and caption — and it goes in straight after the brief's lead. A
// later shift's replaces an earlier one's. A picture that fails the house
// rules is left out and reported, never holding up the brief; a day that
// ends with none is reported too.
const pictureDir = join(outbox, "brief");
let picture = earlierShifts.map((s) => s.picture).filter(Boolean).at(-1) ?? null;
if (existsSync(pictureDir)) {
  try {
    const meta = readJson(join(pictureDir, "picture.json"), null);
    if (!meta?.file) throw new Error("has no picture.json naming its file, alt text and caption");
    if (!/^plate-[a-z0-9._-]*\.(?:svg|png)$/i.test(meta.file)) throw new Error(`is "${meta.file}": the day's picture is a plate (plate-….svg)`);
    if (!existsSync(join(pictureDir, meta.file))) throw new Error(`names ${meta.file}, which isn't in outbox/brief/`);
    if (String(meta.alt ?? "").trim().length < 12) throw new Error("has no alt text: say what it shows, for a reader who can't see it");
    if (!String(meta.caption ?? "").trim()) throw new Error("has no caption: say what to see");
    const bytes = readFileSync(join(pictureDir, meta.file));
    const { width, height, problems } = checkImage(bytes, meta.file);
    if (problems.length) throw new Error(`${problems.join("; ")} (config/house/STYLE.md)`);
    const file = `${createHash("sha256").update(bytes).digest("hex").slice(0, 16)}${meta.file.slice(meta.file.lastIndexOf(".")).toLowerCase()}`;
    place(`media/${file}`, bytes, briefHeld);
    picture = { file, width, height, alt: String(meta.alt).trim().replace(/\s+/g, " "), caption: String(meta.caption).trim().replace(/\s+/g, " ") };
  } catch (error) {
    report.push(`- The day's picture wasn't used: it ${error.message}.`);
  }
  mkdirSync(join(LAB, "published", BRIEF), { recursive: true });
  // Over the first shift's, if it left one: copied, as a note's figures are.
  cpSync(pictureDir, join(LAB, "published", BRIEF), { recursive: true, force: true });
  rmSync(pictureDir, { recursive: true, force: true });
}
if (!picture && SHIFT >= (config.shifts?.per_day ?? 1)) report.push("- Today's brief has no picture: every brief opens with one (AGENT.md, \"The brief\").");

// 5. The day's brief, on kinocomputing: each shift's own account, then what
// went out and what settle saw, across the day. The second shift updates it.
const morningPath = join(LAB, "MORNING.md");
// Its headings become bold lines, the brief's own style ("Published
// tonight"), so the page reads as one piece in one type.
const shiftSaid = existsSync(morningPath)
  ? readFileSync(morningPath, "utf8").replace(/^#[^\n]*\n/, "").replace(/^#{1,6}[ \t]+(.+?)[ \t#]*$/gm, "**$1**").trim() : "";
const dateWords = new Date(`${run.date}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const modelWords = (run.model ?? "").replace(/^claude-/, "Claude ").replace(/-(\d+)-(\d+)$/, " $1.$2").replace(/ (\w)/g, (m, c) => ` ${c.toUpperCase()}`);
const SHIFT_NAMES = { 1: "First shift", 2: "Second shift" };
const shiftsWith = (said) => [...earlierShifts.map((s) => ({ ...s, picture: null })), { shift: SHIFT, said, out, told, spent, model: modelWords, picture }]
  .sort((a, b) => a.shift - b.shift);
// What a shift left for the PI ("Waiting on a human") stays in MORNING.md,
// the lab's log, and is kept out of the brief: as a section under its own
// heading, or as a line of its own ("Waiting on a human: nothing.").
const WAITING = /^\*\*Waiting on a human\*\*\s*$/im;
const WAITING_LINE = /^\s*(?:\*\*)?Waiting on a human(?:\*\*)?\s*:.*$/gim;
/** What a shift's summary asks of the PI, one item each; "nothing" is none. */
function asksIn(said) {
  const text = said ?? "";
  const items = [...text.matchAll(WAITING_LINE)].map((m) => m[0].replace(/^\s*(?:\*\*)?Waiting on a human(?:\*\*)?\s*:\s*/i, ""));
  const at = text.search(WAITING);
  if (at !== -1) {
    const rest = text.slice(at).replace(WAITING, "").trim();
    const next = rest.search(/^\*\*[^*\n]+\*\*\s*$/m);
    const section = next === -1 ? rest : rest.slice(0, next);
    items.push(...section.split(/\n(?=\s*[-*] )/).map((l) => l.replace(/^\s*[-*]\s+/, "").replace(/\s+/g, " ").trim()));
  }
  return items.map((i) => i.trim()).filter((i) => i && !/^nothing(?:\s+(?:tonight|today|yet|new))?\.?$/i.test(i));
}
function withoutWaiting(said) {
  const text = (said ?? "").replace(WAITING_LINE, "");
  const at = text.search(WAITING);
  if (at === -1) return text.replace(/\n{3,}/g, "\n\n").trim();
  const rest = text.slice(at).replace(WAITING, "").trim();
  const next = rest.search(/^\*\*[^*\n]+\*\*\s*$/m);
  const after = next === -1 ? "" : rest.slice(next).trim();
  return [text.slice(0, at).trim(), after].filter(Boolean).join("\n\n").replace(/\n{3,}/g, "\n\n");
}
const briefOf = (said) => {
  const shifts = shiftsWith(said);
  const parts = shifts.map((s) => ({ ...s, body: withoutWaiting(s.said) }));
  const several = shifts.length > 1;
  // Everything the day published, once each, in the order it went out.
  const published = new Map();
  for (const s of shifts) for (const n of s.out ?? []) if (!published.has(n.name)) published.set(n.name, n);
  const total = shifts.reduce((sum, s) => sum + (s.spent ?? 0), 0);
  const models = [...new Set(shifts.map((s) => s.model).filter(Boolean))].join(" and ");
  // The brief opens with a lead, since its first paragraph is its preview: the
  // first shift's own words, unlabelled, and the later shifts after it under
  // their names. When the first shift's summary doesn't open with a paragraph
  // of its own, settle's one-line account of the day leads instead.
  const body = parts.flatMap((s, i) => [
    ...(i > 0 || s.shift !== 1 ? [`**${SHIFT_NAMES[s.shift] ?? `Shift ${s.shift}`}**`] : []),
    s.body || "The researcher left no summary.",
  ]);
  const opensWithProse = body.length && !/^\*\*[^*\n]+\*\*\s*$/.test(body[0].split("\n\n")[0].trim())
    && !/^(?:[-*] |> |#)/.test(body[0].trim()) && body[0] !== "The researcher left no summary.";
  const noteCount = published.size;
  const account = `The lab published ${noteCount === 0 ? "nothing" : `${noteCount} note${noteCount === 1 ? "" : "s"}`} today${several ? ` over ${shifts.length} shifts` : ""}${addedToday.length ? `, and added ${addedToday.length} link${addedToday.length === 1 ? "" : "s"} to Reading` : ""}.`;
  const opening = [...(opensWithProse ? [] : [account]), ...body].join("\n\n").split("\n\n");
  return [
    `**Lab brief: ${dateWords}**`,
    opening[0],
    ...(picture ? [`![${picture.alt.replace(/[\[\]]/g, "")}](${picture.file} "${picture.caption.replace(/"/g, "”")}")`] : []),
    ...opening.slice(1),
    ...(published.size ? ["**Published today**", [...published.values()].map((n) => `- [${n.title}](${ORIGIN}${n.name})${n.update ? " (updated)" : ""}${n.claim ? ", a claim" : n.paradigm ? ", a paradigm entry" : ""}`).join("\n")] : []),
    ...(addedToday.length ? [
      "**New in Reading**",
      [...briefReads.map((h) => `- [${h.title}](${h.url})${h.why ? `: ${h.why}` : ""}`),
        addedToday.length > briefReads.length
          ? `- And ${addedToday.length - briefReads.length} more made it to [Reading](${ORIGIN}reading) today.`
          : `- All of it: [Reading](${ORIGIN}reading).`].join("\n"),
    ] : []),
    ...(shippedToday.length ? [
      "**Shipped**",
      [...shippedToday.map((i) => `- [${i.headline}](${ORIGIN}roadmap#${i.id})`), `- What’s next: [the roadmap](${ORIGIN}roadmap).`].join("\n"),
    ] : []),
    "**Also today**",
    [...shifts.flatMap((s) => s.told ?? []), ...(emphasisToday ? [emphasisToday] : []), `${several ? `The day's ${shifts.length} shifts` : "The shift"} cost $${total.toFixed(2)}, on ${models}.`].map((l) => `- ${l}`).join("\n"),
  ].join("\n\n");
};
// An update only to a brief readers have seen; a held one is still its first.
const briefUpdate = briefLive;
let saidUsed = shiftSaid;
let briefMd = briefOf(shiftSaid);
let briefPage = null;
const renderBrief = (markdown) => renderNote({
  markdown, name: BRIEF, kind: "brief", changeNote: briefUpdate ? "Updated with the day's second shift: its summary, what it published and what it cost." : null,
  quote: quoteResolver, model: run.model, at: briefHeld ? due : now(), kino: KINO, origin: config.kinocomputing.origin,
  image: (src) => {
    if (!picture || src !== picture.file) throw new Error(`has an image (${src}) that isn't the day's picture`);
    return { url: `${config.kinocomputing.origin}media/${picture.file}`, width: picture.width, height: picture.height, kind: "plate" };
  },
});
try {
  briefPage = await renderBrief(briefMd);
} catch (error) {
  // The shift's own words didn't pass; settle's alone always should.
  report.push(`- The shift's MORNING.md couldn't go in the brief: it ${error.message}.`);
  saidUsed = `The researcher's summary didn't pass the publishing checks; it's in [the lab's log](https://github.com/${config.lab.repo}/blob/main/MORNING.md).`;
  briefMd = briefOf(saidUsed);
  try {
    briefPage = await renderBrief(briefMd);
  } catch (again) {
    report.push(`- The brief wasn't published: it ${again.message}.`);
  }
}
if (briefPage) {
  place(`notes/${BRIEF}.html`, briefPage, briefHeld);
  mkdirSync(join(LAB, "published"), { recursive: true });
  writeFileSync(join(LAB, "published", `${BRIEF}.md`), `---\nkind: brief\npin: false\n---\n\n${briefMd}\n`);
  summary.push(briefHeld ? `held the brief for ${due.slice(11, 16)}` : `${briefUpdate ? "updated" : "published"} the brief`);
}
writeFileSync(dayPath, json({ date: run.date, shifts: shiftsWith(saidUsed) }));

// 6. The morning report gets what the shift couldn't see.
if (report.length) {
  const morning = join(LAB, "MORNING.md");
  const prior = existsSync(morning) ? readFileSync(morning, "utf8").trimEnd() : `# ${run.date}`;
  writeFileSync(morning, `${prior}\n\n## From settle\n\n${report.join("\n")}\n`);
}
// Which shifts have settled today: what the workflow's check reads, so a
// shift that has already run today doesn't run again.
const settledBefore = readJson(join(LAB, "state/last-settle.json"), {});
const shiftsSettled = [...new Set([...(settledBefore.date === run.date ? settledBefore.shifts ?? [] : []), SHIFT])].sort();
writeFileSync(join(LAB, "state/last-settle.json"), json({ date: run.date, shift: SHIFT, shifts: shiftsSettled, summary, report }));

// 7. What the shift needed from the PI, and what the PI sent it: the week in
// review counts both (tools/week.mjs), since the PI's attention is a ceiling
// on how much the lab can do (INFLUENCES.md, "The attention ceiling").
appendFileSync(join(LAB, "state/attention.jsonl"), `${JSON.stringify({
  date: run.date, shift: SHIFT, asks: asksIn(shiftSaid),
  takes: run.steers.filter((st) => !st.share).length, shares: run.steers.filter((st) => st.share).length,
})}\n`);

// 8. Settle checks its own work before it calls the night done: a program
// that finds it has broken a promise says so and stops (INFLUENCES.md,
// TigerStyle). A failure turns the run red, after the night is committed.
// LAB_FAULT breaks one promise on purpose, for the tests of these checks.
if (process.env.LAB_FAULT === "lose-a-page" && out[0]) rmSync(notePath(out[0].name), { force: true });
if (process.env.LAB_FAULT === "lose-a-claim" && committed.length) writeFileSync(claimsPath, committed.slice(1).map((l) => `${l}\n`).join(""));
if (process.env.LAB_FAULT === "leave-a-note") writeFileSync(join(outbox, "lab-0000-00-00-left.md"), "left\n");
const broken = [];
const leftInOutbox = existsSync(outbox) ? readdirSync(outbox).filter((f) => f.endsWith(".md")) : [];
if (leftInOutbox.length) broken.push(`notes left in the outbox, neither published nor refused: ${leftInOutbox.join(", ")}`);
for (const n of out) {
  if (!isPublished(n.name)) broken.push(`${n.name} went out but isn't in published/`);
  if (!notePath(n.name)) broken.push(`${n.name} went out but is neither on kinocomputing nor held for it`);
}
if (briefPage && !notePath(BRIEF)) broken.push("the brief was written but is neither on kinocomputing nor held for it");
if (existsSync(pictureDir)) broken.push("the day's picture is still in outbox/brief/");
const claimsNow = existsSync(claimsPath) ? readFileSync(claimsPath, "utf8").split("\n").filter((l) => l.trim()) : [];
if (committed.some((line, i) => claimsNow[i] !== line)) broken.push("a committed claim was lost or changed in state/claims.jsonl");
if (readJsonl(spendPath).length !== spendBefore + spendAppended) broken.push(`state/spend.jsonl has ${readJsonl(spendPath).length} lines, not the ${spendBefore + spendAppended} settle left`);
const settledNow = readJson(join(LAB, "state/last-settle.json"), {});
if (settledNow.date !== run.date || !(settledNow.shifts ?? []).includes(SHIFT)) broken.push("state/last-settle.json doesn't record this shift");
for (const path of readJson(join(LAB, "held/manifest.json"), { files: [] }).files) {
  if (!existsSync(join(LAB, "held", path))) broken.push(`held/manifest.json lists ${path}, which isn't held`);
}
console.log(`settle: ${summary.join(", ") || "nothing published"}`);
if (broken.length) {
  const morning = join(LAB, "MORNING.md");
  const prior = existsSync(morning) ? readFileSync(morning, "utf8").trimEnd() : `# ${run.date}`;
  writeFileSync(morning, `${prior}\n\n## Settle's own checks failed\n\n${broken.map((b) => `- ${b}`).join("\n")}\n`);
  for (const b of broken) console.error(`settle: broken: ${b}`);
  process.exit(1);
}
