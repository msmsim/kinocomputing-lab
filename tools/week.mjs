// The week in review's material (AGENT.md, "Sundays"): what the lab published
// in the seven days to a Sunday, the claims that moved, the paradigms it
// looked at, and what changed in how the lab and the site work — the commits
// people made to either repository, not the lab's own nightly ones or the
// site's bookkeeping. Read by prepare.mjs for a Sunday's first shift.

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { frontMatter, readJson, readJsonl } from "./lib.mjs";
import { doneOn, itemsOf, shippedBetween } from "./shipped.mjs";
import { currentOn, readEmphases } from "./emphases.mjs";

// Commits that are the machinery running, not anyone changing it.
const ROUTINE = /^(night shift |local shift |lab: |release: |build: |roadmap: |blyg: record state|motes: publish|subset: )/;
const BOTS = /\[bot\]$/;

const shiftDays = (date, days) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

/** The lab repository's commits since `since` (a day), people's only. */
export function labChanges(lab, since) {
  try {
    const out = execFileSync("git", ["log", `--since=${since}T00:00:00Z`, "--format=%an%x09%s"], { cwd: lab, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return out.split("\n").filter(Boolean).map((line) => line.split("\t"))
      .filter(([author, subject]) => !BOTS.test(author) && !ROUTINE.test(subject)).map(([, subject]) => subject);
  } catch {
    return [];
  }
}

/** The site repository's commits since `since`, people's only, from GitHub's public API. */
export async function siteChanges(repo, since, fetchJson) {
  try {
    const commits = await fetchJson(`https://api.github.com/repos/${repo}/commits?since=${since}T00:00:00Z&per_page=100`);
    return (Array.isArray(commits) ? commits : [])
      .filter((c) => !BOTS.test(c.commit?.author?.name ?? "") && !BOTS.test(c.author?.login ?? ""))
      .map((c) => String(c.commit?.message ?? "").split("\n")[0])
      .filter((subject) => subject && !ROUTINE.test(subject));
  } catch {
    return [];
  }
}

/** The site's roadmap headlines done in the week, from the repository's public copy: [] when unreadable. */
export async function siteShipped(repo, since, until, fetchJson) {
  try {
    return shippedBetween(itemsOf(await fetchJson(`https://raw.githubusercontent.com/${repo}/main/notes/_roadmap.json`)), since, until)
      .map((i) => ({ id: i.id, headline: String(i.headline).trim(), on: doneOn(i) }));
  } catch {
    return [];
  }
}

/** Everything the week in review starts from, for the seven days ending `today`. */
export async function weekInReview(lab, today, { siteRepo = null, fetchJson = null } = {}) {
  const since = shiftDays(today, -6);
  const inWeek = (date) => date >= since && date <= today;
  const published = existsSync(join(lab, "published")) ? readdirSync(join(lab, "published")).filter((f) => f.endsWith(".md")).sort() : [];
  const notes = [];
  const briefs = [];
  for (const file of published) {
    const date = file.match(/^lab-(\d{4}-\d{2}-\d{2})-/)?.[1];
    if (!date || !inWeek(date)) continue;
    const name = file.replace(/\.md$/, "");
    if (name.endsWith("-brief")) { briefs.push(name); continue; }
    const { data, body } = frontMatter(readFileSync(join(lab, "published", file), "utf8"));
    notes.push({ name, kind: data.kind ?? "notebook", title: body.match(/^\*\*(.+)\*\*\s*$/m)?.[1] ?? name, emphasis: data.emphasis ?? null });
  }
  const claims = readJsonl(join(lab, "state/claims.jsonl")).filter((c) => inWeek(String(c.at ?? "").slice(0, 10)))
    .map((c) => ({ id: c.id, stage: c.stage, statement: c.statement }));
  const paradigms = (readJson(join(lab, "state/paradigms.json"), { paradigms: [] }).paradigms ?? [])
    .filter((p) => p.last_checked && inWeek(p.last_checked)).map((p) => p.name);
  // The PI's attention (INFLUENCES.md, "The attention ceiling"): how often a
  // shift needed the PI, for how long each ask stood, and what the PI sent.
  const shifts = readJsonl(join(lab, "state/attention.jsonl")).filter((a) => inWeek(a.date));
  const standing = new Map();
  for (const a of shifts) for (const ask of a.asks ?? []) standing.set(ask, (standing.get(ask) ?? 0) + 1);
  const attention = {
    shifts: shifts.length,
    asking: shifts.filter((a) => (a.asks ?? []).length).length,
    asks: [...standing].map(([text, times]) => ({ text, shifts: times })).sort((a, b) => b.shifts - a.shifts || a.text.localeCompare(b.text)),
    takes: shifts.reduce((n, a) => n + (a.takes ?? 0), 0),
    shares: shifts.reduce((n, a) => n + (a.shares ?? 0), 0),
  };
  return {
    since,
    briefs,
    notes,
    claims,
    paradigms,
    attention,
    // Each current emphasis, with the week's notes that served it.
    emphases: currentOn(readEmphases(lab).all, today).map((e) => ({ id: e.id, title: e.title, until: e.until, notes: notes.filter((n) => n.emphasis === e.id).map((n) => n.title) })),
    shipped: siteRepo && fetchJson ? await siteShipped(siteRepo, since, today, fetchJson) : [],
    changes: {
      lab: labChanges(lab, since),
      site: siteRepo && fetchJson ? await siteChanges(siteRepo, since, fetchJson) : [],
    },
  };
}
