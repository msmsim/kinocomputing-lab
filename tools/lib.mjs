// Shared, side-effect-free pieces of the lab's deterministic tooling: the
// parts that decide money, steers and what gets published are here so they
// can be tested without a model, a network or a git repository.

import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

export const LAB = resolve(new URL("..", import.meta.url).pathname);
export const KINO = resolve(process.env.KINO_DIR ?? resolve(LAB, "..", "kinocomputing"));

/** Now, or LAB_NOW when a test pins the clock. Whole seconds, UTC. */
export const now = () => new Date(process.env.LAB_NOW ?? Date.now()).toISOString().replace(/\.\d{3}Z$/, "Z");
export const dayOf = (iso) => iso.slice(0, 10);
export const hash8 = (text) => createHash("sha256").update(text).digest("hex").slice(0, 8);

export const readJson = (path, fallback) => (existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : fallback);
export const readJsonl = (path) => (existsSync(path)
  ? readFileSync(path, "utf8").split("\n").filter((line) => line.trim()).map((line) => JSON.parse(line))
  : []);
export const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

/**
 * Front matter: the `---` block at the top of a markdown file, one `key: value`
 * per line. Values are strings, except true/false and plain integers. Enough
 * for the lab's own files; anything richer belongs in JSON.
 */
export function frontMatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: text };
  const data = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (!kv) continue;
    let value = kv[2].trim();
    if (value === "true" || value === "false") value = value === "true";
    else if (/^-?\d+$/.test(value)) value = Number(value);
    else value = value.replace(/^(["'])((?:(?!\1).)*)\1$/, "$2"); // one quoted string, not `"a" OR "b"`
    data[kv[1]] = value;
  }
  return { data, body: m[2] };
}

/**
 * Tonight's budget. The allowance accrues daily and banks when unspent, up to
 * a cap, so quiet nights save for a deep one. Every recorded spend comes off
 * the bank on the day it happened.
 *
 * Returns the bank, the run kind (deep when the bank can afford one), and the
 * most tonight's run may spend — or skip when that is too little to be worth
 * starting.
 */
export function allowance(budget, spends, today, start) {
  const spentOn = new Map();
  for (const s of spends) spentOn.set(s.date, (spentOn.get(s.date) ?? 0) + s.usd);
  let bank = 0;
  for (let d = new Date(`${start}T00:00:00Z`); dayOf(d.toISOString()) <= today; d.setUTCDate(d.getUTCDate() + 1)) {
    const day = dayOf(d.toISOString());
    bank = Math.min(budget.bank_cap_usd, bank + budget.daily_usd) - (spentOn.get(day) ?? 0);
  }
  bank = Math.round(bank * 100) / 100;
  const kind = bank >= budget.deep_run_threshold_usd ? "deep" : "light";
  const maxUsd = Math.round(Math.max(0, Math.min(bank, kind === "deep" ? budget.deep_run_max_usd : budget.light_run_max_usd)) * 100) / 100;
  return { bank, kind, maxUsd, skip: maxUsd < budget.min_run_usd };
}

/** Plain text from a fragment of HTML, entities decoded enough to read. */
export function textOf(html) {
  return html
    .replace(/<(?:br|\/p|\/li|\/h\d|\/blockquote)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&rsquo;|&#8217;/g, "’").replace(/&nbsp;/g, " ")
    .replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
}

/** An origin as an identity string: lowercase host, one trailing slash (§15.4). */
export function normalizeOrigin(origin) {
  const url = new URL(origin);
  const path = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
  return `${url.protocol}//${url.host}${path}`;
}
