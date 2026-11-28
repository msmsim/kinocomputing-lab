// The emphases (README, "Emphases"): two to five areas or questions Matt wants
// the lab to concentrate on for a few weeks at a time. Each is a file in
// emphases/, kept after it ends, so the lab's past emphases stay visible:
//
//   ---
//   title: Where the discrete meets the continuous
//   from: 2026-11-29
//   until: 2027-01-10
//   order: 3
//   ---
//
//   What Matt wants and why, a paragraph, for an outside reader.
//
//   - [A note it builds on](https://…)
//
// The file's name is its id, which a note names in its front matter
// (`emphasis: <id>`). They're Matt's intent, like the charter: no shift or
// build may change them (tools/build.mjs, JUDGES).
//
// The depth shift leads with the emphasis served least recently; each should
// have at least WEEKLY notes in any seven days. Settle sends the list to the
// site, which gives the current ones a nod on About.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { frontMatter } from "./lib.mjs";

export const WEEKLY = 2;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const daysBefore = (day, n) => new Date(Date.parse(`${day}T00:00:00Z`) - n * 86_400_000).toISOString().slice(0, 10);

/** Every emphasis in emphases/, in Matt's order: { id, title, from, until, why, links }; and what's wrong with any that isn't one. */
export function readEmphases(lab) {
  const dir = join(lab, "emphases");
  const all = [];
  const errors = [];
  for (const file of existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".md") && f !== "README.md").sort() : []) {
    const id = file.replace(/\.md$/, "");
    const { data, body } = frontMatter(readFileSync(join(dir, file), "utf8"));
    const paragraphs = body.trim().split(/\n\s*\n/);
    const links = [...body.matchAll(/^- \[([^\]]+)\]\((https?:\/\/[^)\s]+)\)\s*$/gm)].map((m) => ({ title: m[1], url: m[2] }));
    const why = paragraphs.filter((p) => !/^- \[/.test(p.trim())).join("\n\n").replace(/\s*\n\s*/g, " ").trim();
    const until = data.until ? String(data.until) : null;
    if (!ID.test(id) || !String(data.title ?? "").trim() || !DATE.test(String(data.from ?? "")) || (until && !DATE.test(until)) || !why) {
      errors.push(`emphases/${file}: needs a lower-case name, a title, a from date (and any until date) and a paragraph saying why`);
      continue;
    }
    all.push({ id, title: String(data.title).trim(), from: String(data.from), until, why, links, order: Number.isInteger(data.order) ? data.order : 99 });
  }
  // Matt's order where he gave one; the file's name otherwise.
  all.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  return { all, errors };
}

/** Those running on `date`. */
export const currentOn = (all, date) => all.filter((e) => e.from <= date && (!e.until || date <= e.until));
/** Those that have ended by `date`, the latest first. */
export const pastOn = (all, date) => all.filter((e) => e.until && e.until < date).sort((a, b) => b.until.localeCompare(a.until));

/**
 * How each current emphasis has been served, from the published notes that
 * name it: { id → { week, last } }, the notes in the seven days to `date`
 * and the day of the latest.
 */
export function coverage(lab, current, date) {
  const counts = Object.fromEntries(current.map((e) => [e.id, { week: 0, last: null }]));
  const dir = join(lab, "published");
  for (const file of existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".md")) : []) {
    const day = file.match(/^lab-(\d{4}-\d{2}-\d{2})-/)?.[1];
    if (!day || day > date) continue;
    const { emphasis } = frontMatter(readFileSync(join(dir, file), "utf8")).data;
    const c = counts[emphasis];
    if (!c) continue;
    if (day > daysBefore(date, 7)) c.week += 1;
    if (!c.last || day > c.last) c.last = day;
  }
  return counts;
}

/** The emphasis the depth shift leads with: never served first, then the one served longest ago; file order on a tie. */
export function leading(current, counts) {
  return [...current].sort((a, b) => (counts[a.id]?.last ?? "") .localeCompare(counts[b.id]?.last ?? ""))[0] ?? null;
}

/** The briefing's section on the emphases, for shift `shift` on `date`. */
export function briefingSection(current, counts, shift) {
  if (!current.length) return [];
  const lead = shift === 2 ? leading(current, counts) : null;
  const behind = current.filter((e) => (counts[e.id]?.week ?? 0) < WEEKLY);
  return [
    "## The emphases",
    "",
    `Matt's current emphases (AGENT.md, "Emphases"): what to concentrate on for now. A note that serves one names it in its front matter (\`emphasis: <id>\`).`,
    "",
    ...current.flatMap((e) => [
      `### ${e.title} (\`${e.id}\`, until ${e.until ?? "Matt ends it"})`,
      "",
      e.why,
      "",
      ...(e.links.length ? [...e.links.map((l) => `- ${l.title}: ${l.url}`), ""] : []),
      `Notes in the last seven days: ${counts[e.id]?.week ?? 0}; last served ${counts[e.id]?.last ?? "never"}.`,
      "",
    ]),
    ...(lead ? [`**Tonight's lead: ${lead.title}** (\`${lead.id}\`), the one served least recently. Make it this shift's main piece of work, after the PI's takes.`, ""] : []),
    ...(shift === 1 ? ["Lean towards them: where tonight's paradigms or reading touch an emphasis, take that angle.", ""] : []),
    ...(behind.length ? [`Behind (fewer than ${WEEKLY} notes in seven days): ${behind.map((e) => e.title).join("; ")}.`, ""] : []),
  ];
}

/** What the site shows: the current emphases, the past ones, and where they're kept. */
export function forSite(all, date, kept) {
  const shape = ({ id, title, from, until, why, links }) => ({ id, title, from, until, why, links });
  return { updated: date, kept, current: currentOn(all, date).map(shape), past: pastOn(all, date).map(shape) };
}
