// Mutants: each breaks one rule the lab depends on, in a copy of the source,
// and the tests must fail. A mutant that survives is a rule nothing checks.
//
//   npm run mutants

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { LAB } from "../tools/lib.mjs";

const MUTANTS = [
  ["the brief without its picture", "tools/settle.mjs", "...(picture ? [`![", "...(false ? [`!["],
  ["a day without a picture unreported", "tools/settle.mjs", "if (!picture && SHIFT >=", "if (false && SHIFT >="],
  ["a later shift's bad picture throws away a good one", "tools/settle.mjs", "    report.push(`- The day's picture wasn't used", "    picture = null; report.push(`- The day's picture wasn't used"],
  ["images with scripts", "tools/figure.mjs", 'if (/<script\\b/i.test(text)) problems.push("has a script");', ""],
  ["images off the palette", "tools/figure.mjs", "if (strays.length) problems.push", "if (false) problems.push"],
  ["images without captions", "tools/render.mjs", "if (!caption?.trim()) throw", "if (false) throw"],
  ["images inside paragraphs", "tools/render.mjs", 'if (/!\\[[^\\]]*\\]\\(/.test(line)) throw', "if (false) throw"],
  ["images published though the house rules fail", "tools/settle.mjs", "if (problems.length) throw new Error(`has an image", "if (false) throw new Error(`has an image"],
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
  ["no daily limit on notes", "tools/settle.mjs", "if (earlierToday + count + claims >= config.publish.max_notes_per_day) {", "if (false) {"],
  ["claims don't count toward the daily limit", "tools/settle.mjs", "if (earlierToday + count + claims >= config.publish.max_notes_per_day) {", "if (earlierToday + count >= config.publish.max_notes_per_day) {"],
  ["a short day unreported", "tools/settle.mjs", "if (SHIFT >= (config.shifts?.per_day ?? 1) && dayTotal < floor) {", "if (false) {"],
  ["last night's summary stays put", "tools/prepare.mjs", 'if (existsSync(join(LAB, "MORNING.md"))) renameSync(', 'if (false) renameSync('],
  ["paradigm entries are threads", "tools/render.mjs", 'const fragment = claim || kind === "paradigm";', "const fragment = claim;"],
  ["paradigm entries any length", "tools/render.mjs", 'if (kind === "paradigm" && markdown.trim().length > maxParadigm) throw', "if (false) throw"],
  ["an entry for any paradigm", "tools/settle.mjs", 'if (data.kind === "paradigm" && !(tracker', "if (false && !(tracker"],
  ["the rotation never moves on", "tools/settle.mjs", "if (looked.size) {", "if (false) {"],
  ["the rotation ignores the cycle", "tools/lib.mjs", "Math.ceil(paradigms.length / Math.max(1, cycleDays))", "1"],
  ["Exa's agent unmetered", "tools/search.mjs", "if (left < price) throw", "if (false) throw"],
  ["a failed agent run costs nothing", "tools/search.mjs", "{ usd: Number(body?.costDollars?.total) || price }", "{ usd: 0 }"],
  ["the brief keeps the shift's headings", "tools/settle.mjs", '.replace(/^#{1,6}[ \\t]+(.+?)[ \\t#]*$/gm, "**$1**")', ""],
  ["any section will do", "tools/render.mjs", "if (section && !SECTIONS.includes(section)) throw", "if (false) throw"],
  ["entries shelved as the lab's", "tools/render.mjs", 'const shelf = kind === "paradigm" ? "tracker" :', 'const shelf = kind === "paradigm" ? "lab" :'],
  ["no tracker list for the site", "tools/settle.mjs", "if ((tracker.paradigms ?? []).length) {", "if (false) {"],
  ["the first shift takes the whole day", "tools/prepare.mjs", "money.maxUsd = Math.round(money.maxUsd * config.shifts.first_share * 100) / 100;", ""],
  ["the second shift rotates too", "tools/prepare.mjs", "const tonightParadigms = SHIFT === 1 && !SUNDAY ?", "const tonightParadigms = !SUNDAY ?"],
  ["the day's limit forgets the first shift", "tools/settle.mjs", "if (earlierToday + count + claims >= config.publish.max_notes_per_day) {", "if (count + claims >= config.publish.max_notes_per_day) {"],
  ["the brief forgets the first shift", "tools/settle.mjs", "const shiftsWith = (said) => [...earlierShifts.map((s) => ({ ...s, picture: null })), {", "const shiftsWith = (said) => [{"],
  ["the first shift judges the day", "tools/settle.mjs", "if (SHIFT >= (config.shifts?.per_day ?? 1) && dayTotal < floor) {", "if (dayTotal < floor) {"],
  ["the second shift needn't wait", "tools/check-shift.sh", 'elif [ "$shift_no" = 2 ] && ! has 1; then', 'elif false; then'],
  ["a settled shift runs again", "tools/check-shift.sh", "  if has \"$shift_no\"; then", "  if false; then"],
  ["a Waiting on a human per shift", "tools/settle.mjs", "const at = (said ?? \"\").search(WAITING);", "const at = -1;"],
  ["shares ignored", "tools/prepare.mjs", 'steers.push(...readingShares(join(LAB, "reading"),', 'steers.push(...readingShares(join(LAB, "elsewhere"),'],
  ["shares edited", "tools/restore-machinery.sh", "sources/archive-2025/about-2025.md reading)", "sources/archive-2025/about-2025.md)"],
  ["shares handled without the hopper", "tools/settle.mjs", 'if (String(line.disregarded ?? "").trim() || shareInHopper(line.steer.slice(6))) return true;', "return true;"],
  ["lab ids in the hopper", "tools/settle.mjs", '    : labIdIn(`<p>${line.title ?? ""} ${line.why ?? ""}</p>`) ? `says', '    : false ? `says'],
  ["the brief shows the day's first links, not its picks", "tools/settle.mjs", "...addedToday.filter((h) => picked.has(h.url)), ", ""],
  ["every link new every night", "tools/settle.mjs", "    if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(String(line.added ?? \"\"))) line.added = run.date;", "    line.added = run.date;"],
  ["a background passes", "tools/figure.mjs", "  if (size && backgroundIn(text, size)) problems.push(", "  if (false) problems.push("],
  ["an opaque PNG passes", "tools/figure.mjs", "if (colourType !== 4 && colourType !== 6 && !bytes.includes(Buffer.from(\"tRNS\"))) problems.push(", "if (false) problems.push("],
  ["searches unlogged", "tools/search.mjs", "  appendFileSync(join(LAB, \"state/search-log.jsonl\"),", "  if (0) appendFileSync(join(LAB, \"state/search-log.jsonl\"),"],
  ["skipped kinds unsaid", "tools/settle.mjs", "  if (skipped.length) report.push(", "  if (false) report.push("],
  ["the late scheduler run stands down", "tools/check-shift.sh", "if [ \"${NIGHTLY:-}\" = true ] && [ \"$shift_no\" = 1 ] && has 1; then shift_no=2; fi", ""],
  ["no New in Reading", "tools/settle.mjs", "    ...(addedToday.length ? [", "    ...(false ? ["],
  ["notes may open with a label", "tools/render.mjs", "    const problem = leadProblem(html);", "    const problem = null;"],
  ["the byline leads", "tools/render.mjs", "return `${markdown.trimEnd()}\\n\\n_By [${voice}](${origin}about), one of the lab's AI voices_\\n`;", "return `_By [${voice}](${origin}about), one of the lab's AI voices_\\n\\n${markdown}`;"],
  ["the brief opens with a label", "tools/settle.mjs", "    ...(i > 0 || s.shift !== 1 ? [", "    ...(true ? ["],
  ["no account of the day to lead", "tools/settle.mjs", "const opening = [...(opensWithProse ? [] : [account]), ...body]", "const opening = [...body]"],
  ["no regional lens", "tools/prepare.mjs", "const region = regionFor(today, config.regions);", "const region = null;"],
  ["the country filter ignored", "tools/search.mjs", "country && `institutions.country_code:", "false && `institutions.country_code:"],
  ["Semantic Scholar gives up at once", "tools/sources.mjs", "    if (r.status !== 429) throw new Error(`Semantic Scholar answered ${r.status}`);", "    throw new Error(`Semantic Scholar answered ${r.status}`);"],
  ["SEC not told who is asking", "tools/sources.mjs", 'headers: { "user-agent": SEC_AGENT }', "headers: {}"],
  ["patents anywhere", "tools/search.mjs", '...(patents ? { includeDomains: ["patents.google.com"] } : {}),', ""],
  ["Sundays rotate too", "tools/prepare.mjs", "const tonightParadigms = SHIFT === 1 && !SUNDAY ?", "const tonightParadigms = SHIFT === 1 ?"],
  ["Sunday's depth on the light model", "tools/prepare.mjs", '  money.kind = "deep";', '  money.kind = "light";'],
  ["Sunday's clock as any other", "tools/prepare.mjs", "const MINUTES = SUNDAY && SHIFT === 2 ? config.sunday.depth_minutes : config.shift.minutes;", "const MINUTES = config.shift.minutes;"],
  ["Sunday's floor as any other", "tools/settle.mjs", "const floor = sundayPlan(run.date, config.sunday) ? config.sunday.floor :", "const floor = false ? config.sunday.floor :"],
  ["the machinery counts as change", "tools/week.mjs", ".filter(([author, subject]) => !BOTS.test(author) && !ROUTINE.test(subject))", ".filter(() => true)"],
  ["TeX left to markdown", "tools/render.mjs", "    maths = withMathsSet(extracted.markdown, mathml);", "    maths = { markdown: extracted.markdown, put: (h) => h };"],
  ["the brief's name up for grabs", "tools/settle.mjs", "if (name === BRIEF) {", "if (false) {"],
  ["timebox never stops", "tools/timebox.mjs", "  child.kill(\"SIGTERM\");", "  return;"],
  ["the tracker reads published/'s folders as notes", "tools/settle.mjs", 'readdirSync(join(LAB, "published")).filter((f) => f.endsWith(".md")) : []) {', 'readdirSync(join(LAB, "published")) : []) {'],
  ["the week in review reads published/'s folders as notes", "tools/week.mjs", 'readdirSync(join(lab, "published")).filter((f) => f.endsWith(".md")).sort()', 'readdirSync(join(lab, "published")).sort()'],
  ["a shift's figures renamed onto the last's", "tools/settle.mjs", 'cpSync(pictureDir, join(LAB, "published", BRIEF), { recursive: true, force: true });', 'for (const f of readdirSync(pictureDir)) renameSync(join(pictureDir, f), join(LAB, "published", BRIEF, f));'],
  ["the second shift pays for the first's searches", "tools/settle.mjs", "(!run.at || !l.at || l.at >= run.at)", "true"],
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
