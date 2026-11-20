// Before the shift: tonight's budget, the PI's takes since last night, new
// reading for the questions being watched, and the briefing the agent starts
// from. Spends nothing.
//
//   node tools/prepare.mjs
//
// Writes state/tonight.md (the briefing) and state/run.json (what the
// workflow, search.mjs and settle.mjs need: whether to run, which model, the
// dollar caps, and the steers delivered).

import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { LAB, allowance, dayOf, frontMatter, json, now, readJson, readJsonl } from "./lib.mjs";
import { takeSteers, fetchJson } from "./steers.mjs";
import { search } from "./search.mjs";

const config = readJson(join(LAB, "config/lab.json"));
const at = now();
const today = dayOf(at);
const offline = process.env.LAB_OFFLINE === "1";

const budgetState = readJson(join(LAB, "state/budget.json"), null) ?? { start: today };
writeFileSync(join(LAB, "state/budget.json"), json(budgetState));
const money = allowance(config.budget, readJsonl(join(LAB, "state/spend.jsonl")), today, budgetState.start);

// The night's money is one pot. Exa, when the lab has a key, gets a slice of
// it; the model gets the rest.
const exaOn = process.env.EXA_CONFIGURED === "true";
const exaUsd = exaOn && !money.skip ? Math.min(config.search.exa_usd_per_night, Math.round(money.maxUsd * 0.25 * 100) / 100) : 0;
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
if (!offline && !surface) {
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
}

const published = existsSync(join(LAB, "published"))
  ? readdirSync(join(LAB, "published")).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, "")).sort()
  : [];
const replications = readJson(join(LAB, "state/replications.json"), []);

const model = config.models[money.kind];
const run = {
  date: today,
  at,
  skip: money.skip,
  kind: money.kind,
  model,
  max_usd: modelUsd,
  exa_usd: exaUsd,
  bank_usd: money.bank,
  steers: steers.map(({ id, seen: mark }) => ({ id, seen: mark })),
  marks,
  baseline: seen.takes === undefined && !offline,
  reading: reading.flatMap((r) => r.results.map((x) => x.url)),
};
writeFileSync(join(LAB, "state/run.json"), json(run));

const quote = (text) => (text ? text.split("\n").map((l) => `> ${l}`).join("\n") : "> (no text)");
const lines = [
  `# Tonight: ${today}`,
  "",
  `Run kind: **${money.kind}**. Model ${model}, up to $${modelUsd.toFixed(2)}.` +
    (exaUsd ? ` Exa search up to $${exaUsd.toFixed(2)} (\`node tools/search.mjs exa "…"\`).` : " Exa search is off tonight; arXiv and OpenAlex are free.") +
    ` Bank $${money.bank.toFixed(2)}.`,
  "",
  "## The PI's takes",
  "",
  ...(steers.length ? steers.flatMap((s) => [
    `### ${s.id}`,
    "",
    `${s.url}${s.version > 1 ? ` (version ${s.version}: an edit to an earlier take)` : ""}${s.answers ? `, answering the lab's ${s.answers}` : ""}.`,
    "",
    quote(s.text),
    "",
    ...(s.links.length ? ["Links:", ...s.links.map((l) => `- ${l}`), ""] : []),
  ]) : ["None since last night.", ""]),
  "## Replications since the last shift",
  "",
  ...(replications.length ? replications.map((r) => `- ${r.experiment}: ${r.error ? `failed to run — ${r.error.split("\n")[0]}` : r.skipped ?? `seed ${r.seed}, ${r.metric} ${r.value} (was ${r.original}), ${r.agrees ? "agrees" : "**disagrees**"}`}`) : ["None."]),
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
  : `prepare: ${money.kind} run, $${modelUsd.toFixed(2)} on ${model}${exaUsd ? ` + $${exaUsd.toFixed(2)} Exa` : ""}, ${steers.length} take(s), ${open.length} open question(s)`);
