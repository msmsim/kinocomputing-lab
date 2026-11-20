// Before the shift: tonight's budget, the steers since last night, and the
// briefing the agent starts from. Spends nothing.
//
//   node tools/prepare.mjs
//
// Writes state/tonight.md (the briefing) and state/run.json (what the
// workflow and settle.mjs need: whether to run, which model, the dollar cap,
// and the steers delivered).

import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { LAB, allowance, dayOf, frontMatter, json, now, readJson, readJsonl } from "./lib.mjs";
import { inboxSteers, blygSteers, fetchJson } from "./steers.mjs";

const config = readJson(join(LAB, "config/lab.json"));
const at = now();
const today = dayOf(at);

const budgetState = readJson(join(LAB, "state/budget.json"), null) ?? { start: today };
writeFileSync(join(LAB, "state/budget.json"), json(budgetState));
const spends = readJsonl(join(LAB, "state/spend.jsonl"));
const money = allowance(config.budget, spends, today, budgetState.start);

const seen = readJson(join(LAB, "state/seen.json"), { inbox: {}, blyg: {} });
const steers = inboxSteers(join(LAB, "inbox"), seen.inbox);
const marks = [];
for (const origin of config.steer_blygs ?? []) {
  try {
    const found = await blygSteers(origin, config.kinocomputing.origin, seen.blyg[origin], fetchJson);
    steers.push(...found.steers);
    marks.push(...found.marks);
  } catch (error) {
    console.warn(`steers: ${origin} unreadable tonight: ${error.message}`);
  }
}

const questions = existsSync(join(LAB, "state/questions"))
  ? readdirSync(join(LAB, "state/questions")).filter((f) => f.endsWith(".md")).sort().map((f) => {
    const { data } = frontMatter(readFileSync(join(LAB, "state/questions", f), "utf8"));
    return { file: f, ...data };
  })
  : [];
const open = questions.filter((q) => q.status === "open" || q.status === "active")
  .sort((a, b) => (a.priority ?? 9) - (b.priority ?? 9));
const published = existsSync(join(LAB, "published"))
  ? readdirSync(join(LAB, "published")).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, "")).sort()
  : [];

const model = config.models[money.kind];
const run = {
  date: today,
  at,
  skip: money.skip,
  kind: money.kind,
  model,
  max_usd: money.maxUsd,
  bank_usd: money.bank,
  steers: steers.map(({ id, seen: mark }) => ({ id, seen: mark })),
  marks,
};
writeFileSync(join(LAB, "state/run.json"), json(run));

const lines = [
  `# Tonight: ${today}`,
  "",
  `Run kind: **${money.kind}**. Budget for this run: $${money.maxUsd.toFixed(2)} (bank $${money.bank.toFixed(2)}, model ${model}).`,
  "",
  "## Steers",
  "",
  ...(steers.length ? steers.flatMap((s) => [
    `### ${s.id}`,
    "",
    `From ${s.from === "inbox" ? "the PI's inbox" : `the PI's blyg, ${s.title}`}${s.answers ? `, answering ${s.answers}` : ""}.`,
    "",
    s.text ? s.text.split("\n").map((l) => `> ${l}`).join("\n") : "> (no text)",
    "",
    ...(s.links.length ? ["Links:", ...s.links.map((l) => `- ${l}`), ""] : []),
  ]) : ["None since last night.", ""]),
  "## Open questions",
  "",
  ...(open.length ? open.map((q) => `- \`${q.file}\` — ${q.title} (${q.kind}, priority ${q.priority}, ${q.status})`) : ["None. Steers or the charter suggest where to start."]),
  "",
  "## Published notes the lab can update",
  "",
  ...(published.length ? published.map((p) => `- ${p}`) : ["None yet."]),
  "",
];
writeFileSync(join(LAB, "state/tonight.md"), lines.join("\n"));

console.log(money.skip
  ? `prepare: skipping tonight, bank $${money.bank.toFixed(2)} is under the minimum run`
  : `prepare: ${money.kind} run, $${money.maxUsd.toFixed(2)} on ${model}, ${steers.length} steer(s), ${open.length} open question(s)`);
