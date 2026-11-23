// Mutants: each breaks one rule the lab depends on, in a copy of the source,
// and the tests must fail. A mutant that survives is a rule nothing checks.
//
//   npm run mutants

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { LAB } from "../tools/lib.mjs";

const MUTANTS = [
  ["the lab's own notes count as takes", "tools/steers.mjs", "if (doc.generated?.length) { marks.push(mark); continue; }", ""],
  ["the first look replays history", "tools/steers.mjs", "if (baseline || item.kind", "if (item.kind"],
  ["experiments see the lab's secrets", "tools/replicate.mjs", "env: { ...settings, PATH: process.env.PATH, HOME: process.env.HOME,", "env: { ...process.env, ...settings,"],
  ["run.env may set anything", "tools/replicate.mjs", "    if (RESERVED.test(m[1])) throw", "    if (false) throw"],
  ["replication ignores a changed result", "tools/replicate.mjs", "?.of === of) continue;", ") continue;"],
  ["Exa spend left out of the bank", "tools/settle.mjs", "if (exaUsd > 0) {", "if (false) {"],
  ["Exa's slice not taken from the model's", "tools/prepare.mjs", "(money.maxUsd - exaUsd)", "(money.maxUsd)"],
  ["Exa unmetered", "tools/search.mjs", "if (left < 0.01)", "if (false)"],
  ["unhandled takes marked seen", "tools/settle.mjs", "if (handled.has(steer.id)) mark(steer.seen);", "mark(steer.seen);"],
  ["claims editable", "tools/settle.mjs", "if (lost.length || valid.length", "if (valid.length"],
  ["writes over the PI's notes", "tools/settle.mjs", "if (!pattern.test(name) && !isPublished(name))", "if (false)"],
  ["answers anywhere", "tools/render.mjs", "if (target.origin !== new URL(origin).origin)", "if (false)"],
  ["threads before the claims they quote", "tools/settle.mjs", "parsed.sort((a, b) => FRAGMENTS.has(b.data.kind) - FRAGMENTS.has(a.data.kind) || a.file.localeCompare(b.file));", ""],
  ["a note's kind can change", "tools/settle.mjs", "if (update && shape(", "if (false && shape("],
  ["updates without a change note", "tools/settle.mjs", 'if (update && !String(data.change_note ?? "").trim()) {', "if (false) {"],
  ["claims quote", "tools/render.mjs", "if (fragment && extracted.quotes.length) throw", "if (false) throw"],
  ["claims any length", "tools/render.mjs", "if (claim && markdown.trim().length > maxClaim) throw", "if (false) throw"],
  ["lab ids published", "tools/render.mjs", "if (id) throw", "if (false) throw"],
  ["urls checked for ids", "tools/render.mjs", ".replace(/https?:\\/\\/\\S+/g, \" \")", ""],
  ["write-ups quotable", "tools/settle.mjs", "  if (thread) throw new Error(", "  if (false) throw new Error("],
  ["selections unchecked", "tools/render.mjs", "if (q.lines.length && !textContent(target.html).includes(", "if (false && !textContent(target.html).includes("],
  ["directives in code are quotes", "tools/render.mjs", "const d = !fence && line.match(DIRECTIVE);", "const d = line.match(DIRECTIVE);"],
  ["machinery not restored", "tools/restore-machinery.sh", 'then git checkout HEAD -- "$path"; fi', "then :; fi"],
  ["a shift with no cost report costs nothing", "tools/settle.mjs", "if (!output) {\n  appendFileSync(", "if (false) {\n  appendFileSync("],
  ["the time limit unreported", "tools/settle.mjs", "if (exit === 124) {", "if (false) {"],
  ["no brief", "tools/settle.mjs", "if (briefPage) {", "if (false) {"],
  ["claims in a voice", "tools/render.mjs", "if (voice && (fragment || kind === \"brief\")) throw", "if (false) throw"],
  ["any voice will do", "tools/settle.mjs", "|| !existsSync(guide)) {", ") {"],
  ["no nightly limit on notes", "tools/settle.mjs", "if (count + claims >= config.publish.max_notes_per_night) {", "if (false) {"],
  ["claims don't count toward the nightly limit", "tools/settle.mjs", "if (count + claims >= config.publish.max_notes_per_night) {", "if (count >= config.publish.max_notes_per_night) {"],
  ["a short night unreported", "tools/settle.mjs", "if (out.length < floor) {", "if (false) {"],
  ["last night's summary stays put", "tools/prepare.mjs", 'if (existsSync(join(LAB, "MORNING.md"))) renameSync(', 'if (false) renameSync('],
  ["paradigm entries are threads", "tools/render.mjs", 'const fragment = claim || kind === "paradigm";', "const fragment = claim;"],
  ["paradigm entries any length", "tools/render.mjs", 'if (kind === "paradigm" && markdown.trim().length > maxParadigm) throw', "if (false) throw"],
  ["an entry for any paradigm", "tools/settle.mjs", 'if (data.kind === "paradigm" && !(tracker', "if (false && !(tracker"],
  ["the rotation never moves on", "tools/settle.mjs", "if (looked.size) {", "if (false) {"],
  ["the rotation ignores the cycle", "tools/lib.mjs", "Math.ceil(paradigms.length / Math.max(1, cycleDays))", "1"],
  ["Exa's agent unmetered", "tools/search.mjs", "if (left < price) throw", "if (false) throw"],
  ["a failed agent run costs nothing", "tools/search.mjs", "{ usd: Number(body?.costDollars?.total) || price }", "{ usd: 0 }"],
  ["the brief keeps the shift's headings", "tools/settle.mjs", '.replace(/^#{1,6}[ \\t]+(.+?)[ \\t#]*$/gm, "**$1**")', ""],
  ["the brief's name up for grabs", "tools/settle.mjs", "if (name === BRIEF) {", "if (false) {"],
  ["timebox never stops", "tools/timebox.mjs", "  child.kill(\"SIGTERM\");", "  return;"],
  ["stale write-ups unseen", "tools/steers.mjs", "&& (live.get(t.id)?.version ?? 0) > t.version);", "&& false);"],
];

let survived = 0;
for (const [name, file, from, to] of MUTANTS) {
  const path = join(LAB, file);
  const original = readFileSync(path, "utf8");
  if (!original.includes(from)) {
    console.log(`?  ${name}: mutation site not found in ${file}`);
    survived += 1;
    continue;
  }
  writeFileSync(path, original.replace(from, to));
  try {
    const r = spawnSync(process.execPath, ["--test", "test/lab.test.mjs"], { cwd: LAB, encoding: "utf8" });
    if (r.status === 0) { survived += 1; console.log(`✗  survived: ${name}`); } else console.log(`✓  killed: ${name}`);
  } finally {
    writeFileSync(path, original);
  }
}
console.log(survived ? `${survived} mutant(s) survived` : "all mutants killed");
process.exit(survived ? 1 : 0);
