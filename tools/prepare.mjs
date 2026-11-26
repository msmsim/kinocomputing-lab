// Before the shift: tonight's budget, the PI's takes since last night, new
// reading for the questions being watched, and the briefing the agent starts
// from. Spends nothing.
//
//   node tools/prepare.mjs
//
// Writes state/tonight.md (the briefing) and state/run.json (what the
// workflow, search.mjs and settle.mjs need: whether to run, which model, the
// dollar caps, and the steers delivered).

import { readdirSync, readFileSync, renameSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { LAB, allowance, dayOf, frontMatter, json, now, readJson, readJsonl, regionFor, rotation, sundayPlan } from "./lib.mjs";
import { weekInReview } from "./week.mjs";
import { searchMore } from "./sources.mjs";
import { readingShares, takeSteers, staleThreads, fetchJson } from "./steers.mjs";
import { search } from "./search.mjs";

const config = readJson(join(LAB, "config/lab.json"));
const at = now();
const today = dayOf(at);
const offline = process.env.LAB_OFFLINE === "1";

// Last night's MORNING.md moves aside, so a shift that never writes its own
// can't have last night's published as tonight's brief.
if (existsSync(join(LAB, "MORNING.md"))) renameSync(join(LAB, "MORNING.md"), join(LAB, "state/last-morning.md"));

const budgetState = readJson(join(LAB, "state/budget.json"), null) ?? { start: today };
writeFileSync(join(LAB, "state/budget.json"), json(budgetState));
const money = allowance(config.budget, readJsonl(join(LAB, "state/spend.jsonl")), today, budgetState.start);
// An operator running a shift by hand (tools/local-shift.sh) may ask for a
// deep run; the cap is still the deep run's.
if (process.env.LAB_RUN_KIND === "deep" || process.env.LAB_RUN_KIND === "light") {
  money.kind = process.env.LAB_RUN_KIND;
  money.maxUsd = money.kind === "deep" ? config.budget.deep_run_max_usd : config.budget.light_run_max_usd;
  money.skip = false;
}
// And may set the shift's focus: a question to work on. Shown in the briefing
// as the operator's, so the journal can say why the shift chose it.
const focus = process.env.LAB_FOCUS ?? null;

// Which of the day's shifts this is (README, "A night"). The first is for
// breadth — the rotation, the archive, the day's floor — and takes a share
// of the day's money; the second is for depth, and has what's left. A shift
// started by hand is a first shift unless it says otherwise.
const SHIFT = Math.max(1, Math.min(config.shifts.per_day, Number(process.env.LAB_SHIFT) || 1));
if (SHIFT === 1 && config.shifts.per_day > 1 && !process.env.LAB_RUN_KIND) {
  money.maxUsd = Math.round(money.maxUsd * config.shifts.first_share * 100) / 100;
  money.skip = money.maxUsd < config.budget.min_run_usd;
}
// Sundays (AGENT.md, "Sundays"): the first shift writes the week in review;
// the second, a deep dive or a roundtable, on the deep model, with a longer
// clock and a draw on the bank, which is what the bank is for.
const SUNDAY = sundayPlan(today, config.sunday);
if (SUNDAY && SHIFT === 2 && !process.env.LAB_RUN_KIND) {
  money.kind = "deep";
  money.maxUsd = Math.round(Math.max(0, Math.min(money.bank, config.sunday.depth_usd)) * 100) / 100;
  money.skip = money.maxUsd < config.budget.min_run_usd;
}
const MINUTES = SUNDAY && SHIFT === 2 ? config.sunday.depth_minutes : config.shift.minutes;

// The night's money is one pot. Exa, when the lab has a key, gets a slice of
// it; the model gets the rest.
const exaOn = process.env.EXA_CONFIGURED === "true";
const exaUsd = exaOn && !money.skip ? Math.min(config.search.exa_usd_per_night, Math.round(money.maxUsd * config.search.exa_share * 100) / 100) : 0;
const modelUsd = Math.round((money.maxUsd - exaUsd) * 100) / 100;

// The PI's takes. LAB_SURFACE_DIR reads kinocomputing's surface from a built
// copy instead of the network (the tests use kinocomputing's real build).
const seen = readJson(join(LAB, "state/seen.json"), {});
const surface = process.env.LAB_SURFACE_DIR;
const getJson = surface
  ? async (url) => JSON.parse(readFileSync(join(surface, url.slice(config.kinocomputing.origin.length)), "utf8"))
  : fetchJson;
let steers = [];
let marks = [];
if (!offline) {
  try {
    ({ steers, marks } = await takeSteers(config.kinocomputing.origin, seen.takes, getJson));
  } catch (error) {
    console.warn(`steers: kinocomputing unreadable tonight: ${error.message}`);
  }
}
// And what the PI shared to the lab from Subset, waiting in reading/.
steers.push(...readingShares(join(LAB, "reading"), seen.takes ?? {}, config.lab.evidence_base));

// Write-ups quoting a claim that has since moved.
let stale = [];
if (!offline) {
  try {
    stale = await staleThreads(config.kinocomputing.origin, getJson);
  } catch (error) {
    console.warn(`stale threads: ${error.message}`);
  }
}

// The agenda.
const questions = existsSync(join(LAB, "state/questions"))
  ? readdirSync(join(LAB, "state/questions")).filter((f) => f.endsWith(".md")).sort().map((f) => {
    const { data } = frontMatter(readFileSync(join(LAB, "state/questions", f), "utf8"));
    return { file: f, ...data };
  })
  : [];
const open = questions.filter((q) => q.status === "open" || q.status === "active")
  .sort((a, b) => (a.priority ?? 9) - (b.priority ?? 9));

// New reading: a question with `watch: <query>` gets arXiv's latest matches
// that the lab hasn't been shown before. Free; a few per question.
const reading = [];
const shown = new Set(readJson(join(LAB, "state/reading.json"), []));
if (!offline && process.env.LAB_NO_READING !== "1") {
  for (const q of open.filter((x) => x.watch)) {
    try {
      const { results } = await search("arxiv", q.watch, { n: 10, recent: true });
      const fresh = results.filter((r) => !shown.has(r.url)).slice(0, config.search.watch_per_question);
      for (const r of fresh) shown.add(r.url);
      if (fresh.length) reading.push({ question: q.id ?? q.file, results: fresh });
    } catch (error) {
      console.warn(`reading: ${q.file}: ${error.message}`);
    }
  }
  // Standing feeds (config.search.feeds): arXiv's Emerging Technologies list,
  // biological-computing preprints. New items only.
  for (const feed of config.search.feeds ?? []) {
    try {
      const { results } = await search(feed.source, feed.query, { n: 15, recent: true });
      const fresh = results.filter((r) => !shown.has(r.url)).slice(0, feed.n ?? 5);
      for (const r of fresh) shown.add(r.url);
      if (fresh.length) reading.push({ question: feed.name, results: fresh });
    } catch (error) {
      console.warn(`reading: ${feed.name}: ${error.message}`);
    }
  }
}

// Chatter: recent posts from the accounts and hashtags the lab watches
// (state/watch.json, the lab's to keep). Leads, never evidence; a few a night.
const chatter = [];
const watch = readJson(join(LAB, "state/watch.json"), { bluesky: [], mastodon: [] });
if (!offline && process.env.LAB_NO_READING !== "1") {
  const since = new Date(Date.parse(`${today}T00:00:00Z`) - 2 * 86_400_000).toISOString().slice(0, 10);
  for (const [source, names] of [["bluesky", watch.bluesky ?? []], ["mastodon", watch.mastodon ?? []]]) {
    for (const name of names) {
      try {
        const posts = (await searchMore(source, name, { n: 20, since })).filter((p) => !shown.has(p.url));
        for (const p of posts) chatter.push({ ...p, via: source === "bluesky" ? `@${name}` : `#${name}` });
      } catch (error) {
        console.warn(`chatter: ${source} ${name}: ${error.message}`);
      }
    }
  }
  chatter.sort((a, b) => b.date.localeCompare(a.date)).splice(config.search.chatter_per_night ?? 8);
  for (const p of chatter) shown.add(p.url);
}

// Tonight's regional lens (config.regions, AGENT.md "Where to look").
const region = regionFor(today, config.regions);

// The paradigm rotation: every paradigm on the tracker is looked at once a
// cycle. Tonight's are the ones looked at longest ago (never, first), enough
// a night to go round in config.paradigms.cycle_days.
const paradigmList = readJson(join(LAB, "state/paradigms.json"), { paradigms: [] }).paradigms ?? [];
// The rotation is the first shift's; the second goes deeper on what the
// first found.
const tonightParadigms = SHIFT === 1 && !SUNDAY ? rotation(paradigmList, config.paradigms.cycle_days) : [];

const published = existsSync(join(LAB, "published"))
  ? readdirSync(join(LAB, "published")).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, "")).sort()
  : [];
const replications = readJson(join(LAB, "state/replications.json"), []);

const model = config.models[money.kind];
// The shift has a wall clock as well as a budget: the runner stops it at
// config.shift.minutes, and an unfinished shift loses its write-up.
const deadline = new Date(new Date(at).getTime() + MINUTES * 60_000).toISOString().slice(11, 16);
// The week in review's material, on a Sunday's first shift.
const week = SUNDAY && SHIFT === 1
  ? await weekInReview(LAB, today, { siteRepo: config.kinocomputing.repo, fetchJson: offline || process.env.LAB_NO_READING === "1" ? null : fetchJson })
  : null;
const voiceName = (id) => readFileSync(join(LAB, "voices", `${id}.md`), "utf8").match(/^# (.+)$/m)?.[1] ?? id;
const run = {
  date: today,
  at,
  shift: SHIFT,
  minutes: MINUTES,
  ...(SUNDAY ? { sunday: { ...SUNDAY, job: SHIFT === 1 ? "week-in-review" : SUNDAY.format } } : {}),
  skip: money.skip,
  kind: money.kind,
  model,
  max_usd: modelUsd,
  exa_usd: exaUsd,
  bank_usd: money.bank,
  focus,
  steers: steers.map(({ id, url, seen: mark }) => ({ id, url, seen: mark })),
  marks,
  baseline: seen.takes === undefined && !offline,
  reading: [...reading.flatMap((r) => r.results.map((x) => x.url)), ...chatter.map((p) => p.url)],
  region: region?.name ?? null,
  paradigms: tonightParadigms.map((p) => p.id),
};
// A paradigm's note, if the lab has published one: the published note whose
// front matter names it.
const paradigmNote = (id) => published.find((name) => {
  const { data } = frontMatter(readFileSync(join(LAB, "published", `${name}.md`), "utf8"));
  return data.kind === "paradigm" && data.paradigm === id;
});
writeFileSync(join(LAB, "state/run.json"), json(run));

const dayBefore = readJson(join(LAB, "state/brief-day.json"), null);
const earlierToday = dayBefore?.date === today ? (dayBefore.shifts ?? []).filter((s) => s.shift !== SHIFT).reduce((n, s) => n + (s.out ?? []).length, 0) : 0;
const quote = (text) => (text ? text.split("\n").map((l) => `> ${l}`).join("\n") : "> (no text)");
const lines = [
  `# Tonight: ${today}`,
  "",
  `Run kind: **${money.kind}**. Model ${model}, up to $${modelUsd.toFixed(2)}.` +
    (exaUsd ? ` Exa search up to $${exaUsd.toFixed(2)} (\`node tools/search.mjs exa "…"\`).` : " Exa search is off tonight; arXiv and OpenAlex are free.") +
    ` Bank $${money.bank.toFixed(2)}.`,
  "",
  ...(!SUNDAY ? [
    `## Shift ${SHIFT} of ${config.shifts.per_day}: ${SHIFT === 1 ? "breadth" : "depth"}`,
    "",
    SHIFT === 1
      ? `The day's first shift: tonight's paradigms, units from the archive, takes, and the day's floor of notes. ${config.shifts.per_day > 1 ? "A second, deeper shift follows; end your journal entry with what it should take up (AGENT.md, \"Two shifts a day\")." : ""}`
      : "The day's second shift, for depth (AGENT.md, \"Two shifts a day\"): start from what the first shift asked of you at the end of today's journal and in `state/last-morning.md`. No rotation tonight.",
    "",
  ] : SHIFT === 1 ? [
    `## Sunday ${SUNDAY.number}, shift 1: the week in review`,
    "",
    `No rotation today. Write the week in review for ${week.since} to ${today} (AGENT.md, "Sundays"), and take today's takes and shares as on any shift. The second shift writes ${SUNDAY.format === "deep-dive" ? `a deep dive in ${voiceName(SUNDAY.voice)}'s voice` : "the roundtable"}; end the journal with the week's themes, so it can go somewhere else.`,
    "",
    "The week's briefs, which say what each shift did, published and added to Reading:",
    "",
    ...(week.briefs.length ? week.briefs.map((b) => `- \`published/${b}.md\``) : ["- None."]),
    "",
    "The week's notes:",
    "",
    ...(week.notes.length ? week.notes.map((n) => `- \`${n.name}\` (${n.kind}): ${n.title}`) : ["- None."]),
    "",
    "Claims that moved this week:",
    "",
    ...(week.claims.length ? week.claims.map((c) => `- ${c.id} → ${c.stage}: ${c.statement}`) : ["- None."]),
    "",
    `Paradigms looked at this week: ${week.paradigms.length ? week.paradigms.join(", ") : "none"}.`,
    "",
    "What changed in how the lab works (commits to this repository, the lab's own nightly ones left out):",
    "",
    ...(week.changes.lab.length ? week.changes.lab.map((c) => `- ${c}`) : ["- None."]),
    "",
    "What changed on the site (commits to kinocomputing, its bookkeeping left out):",
    "",
    ...(week.changes.site.length ? week.changes.site.map((c) => `- ${c}`) : ["- None."]),
    "",
  ] : [
    `## Sunday ${SUNDAY.number}, shift 2: ${SUNDAY.format === "deep-dive" ? `a deep dive, in ${voiceName(SUNDAY.voice)}'s voice` : "the roundtable"}`,
    "",
    SUNDAY.format === "deep-dive"
      ? `One piece of ${config.sunday.deep_dive_words[0]} to ${config.sunday.deep_dive_words[1]} words, in ${voiceName(SUNDAY.voice)}'s voice (\`voice: ${SUNDAY.voice}\`), on a subject orthogonal to the week: today's journal ends with the week's themes, so go somewhere else (AGENT.md, "Sundays").`
      : `The roundtable: all five voices on one question orthogonal to the week, each turn written by the \`voice\` subagent in that voice. Positions of at most ${config.sunday.roundtable.opening_words} words, rebuttals of at most ${config.sunday.roundtable.rebuttal_words}, the crux in at most ${config.sunday.roundtable.crux_words}, and a bet each of at most ${config.sunday.roundtable.bet_words} (AGENT.md, "Sundays").`,
    "",
  ]),
  "## Tonight's output",
  "",
  ...(SUNDAY ? [`Sunday publishes at least ${config.sunday.floor} notes: the week in review and the ${SUNDAY.format === "deep-dive" ? "deep dive" : "roundtable"}, and whatever takes and shares earn. Use the money: $${modelUsd.toFixed(2)} on ${model}.`, ""] : []),
  ...(SUNDAY ? [] : [`The day publishes **${config.publish.min_notes_per_day} to ${config.publish.max_notes_per_day} notes** across its shifts, claims included (settle holds back any past ${config.publish.max_notes_per_day}). ${SHIFT === 1 ? `Reach the ${config.publish.min_notes_per_day} yourself.` : `${earlierToday} went out in today's earlier shift; add what depth earns, not to make up numbers.`} Use the money: aim to spend most of the $${modelUsd.toFixed(2)}. Each note stands on its own and is worth a stranger's five minutes; AGENT.md, step 3, says how to fill a night.`]),
  "",
  ...(process.env.LAB_ENV_NOTE ? ["## Where this shift runs", "", process.env.LAB_ENV_NOTE, ""] : []),
  ...(focus ? ["## Focus", "", `The operator running this shift set its focus: **${focus}**. Make it tonight's unit of work, after the PI's takes.`, ""] : []),
  "## Time",
  "",
  `This shift is stopped at **${deadline} UTC** (${MINUTES} minutes), finished or not. Check \`date -u\` as you go. Publish as you go (AGENT.md, step 7): a finished note goes into the outbox at once, with its line in the journal and MORNING.md, so a stop loses only the piece in hand. Stop starting new pieces 10 minutes before the deadline. Run experiments through \`node tools/timebox.mjs ${config.shift.experiment_seconds} uv run run.py\` (the replication gets the same ${config.shift.experiment_seconds / 60} minutes); one that overruns is a result to report, not a wait.`,
  "",
  "## Tonight's paradigms",
  "",
  ...(tonightParadigms.length ? [
    `The rotation (AGENT.md, "The paradigm rotation") brings these round tonight, so that every paradigm on the tracker is looked at every ${config.paradigms.cycle_days} days:`,
    "",
    ...tonightParadigms.map((p) => {
      const note = paradigmNote(p.id);
      return `- **${p.name}** (\`${p.id}\`, ${p.group}): ${p.last_checked ? `last looked at ${p.last_checked}, so search from then` : "never looked at: a first pass, from the round-up's entry"}; ${note ? `its note is \`${note}\`, to update` : "no note yet, so this is its first"}.`;
    }),
    "",
  ] : ["None: `state/paradigms.json` is empty.", ""]),
  "## The PI's takes and shares",
  "",
  ...(steers.length ? steers.flatMap((s) => [
    `### ${s.id}`,
    "",
    ...(s.share ? ["A share from Subset: a link the PI sent the lab, with their notes and excerpts. Not published; yours to weigh (AGENT.md, step 2).", ""] : []),
    `${s.url}${s.version > 1 ? ` (version ${s.version}: an edit to an earlier take)` : ""}${s.answers ? `, answering the lab's ${s.answers}` : ""}.`,
    "",
    quote(s.text),
    "",
    ...(s.links.length ? ["Links:", ...s.links.map((l) => `- ${l}`), ""] : []),
  ]) : ["None since last night.", ""]),
  "## Write-ups quoting an older version",
  "",
  ...(stale.length ? stale.map((s) => `- ${s.page}: ${s.quotes.join("; ")}`) : ["None."]),
  "",
  "## Replications since the last shift",
  "",
  ...(replications.length ? replications.map((r) => `- ${r.experiment}: ${r.error ? `failed to run — ${r.error.split("\n")[0]}` : r.skipped ?? `seed ${r.seed}, ${r.metric} ${r.value} (was ${r.original}), ${r.agrees ? "agrees" : "**disagrees**"}`}`) : ["None."]),
  "",
  ...(region ? [
    "## Tonight's regional lens",
    "",
    `**${region.name}.** For each of tonight's paradigms, one more OpenAlex search limited to institutions there (\`--country ${region.countries.join(",")}\`)${region.funding.length ? `, and its public funders (\`${region.funding.join("\`, \`")}\`)` : ""}: who is doing the work outside the US, and what they have measured (AGENT.md, "Where to look").`,
    "",
  ] : []),
  "## Chatter (leads, not evidence)",
  "",
  ...(chatter.length ? chatter.map((p) => `- ${p.via}, ${p.date}: ${p.title} ${p.url}${p.extra ? ` (${p.extra})` : ""}`) : ["None."]),
  "",
  "## New reading",
  "",
  ...(reading.length ? reading.flatMap((r) => [
    `For ${r.question}:`,
    "",
    ...r.results.map((x) => `- ${x.title} (${x.date}) ${x.url}`),
    "",
  ]) : ["None.", ""]),
  "## Open questions",
  "",
  ...(open.length ? open.map((q) => `- \`${q.file}\` — ${q.title} (${q.kind}, priority ${q.priority}, ${q.status})`) : ["None. The charter suggests where to start."]),
  "",
  "## Published notes the lab can update",
  "",
  ...(published.length ? published.map((p) => `- ${p}`) : ["None yet."]),
  "",
];
writeFileSync(join(LAB, "state/tonight.md"), lines.join("\n"));

console.log(money.skip
  ? `prepare: skipping tonight, bank $${money.bank.toFixed(2)} is under the minimum run`
  : `prepare: shift ${SHIFT}, ${money.kind} run, $${modelUsd.toFixed(2)} on ${model}${exaUsd ? ` + $${exaUsd.toFixed(2)} Exa` : ""}, ${steers.length} take(s), ${open.length} open question(s)`);
