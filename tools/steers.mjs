// The PI's steers. The PI doesn't manage an inbox: they post takes to
// kinocomputing itself, through motes, like any other note. Every item on
// kinocomputing that the lab didn't write — one with no §5.7 `generated`
// provenance — is the PI's, and a new one, or a new version of one, is a
// steer. A take that is a stub of one of the lab's notes (§10.6) answers it.
//
// Read from kinocomputing's public blyg surface, so no credentials and no
// tokens. Each steer carries the `seen` mark that delivers it; settle.mjs
// applies that only once the shift has recorded what it did with the steer,
// so one the agent misses comes back.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { normalizeOrigin, textOf } from "./lib.mjs";

const MAX_TEXT = 4000;

/**
 * New or changed takes on kinocomputing. `seen` maps item id → the version
 * last delivered; undefined means the lab has never looked, and the first look
 * is a baseline: everything already there is marked seen and nothing is
 * returned, so turning the lab on doesn't replay the site's history as steers.
 *
 * Returns { steers, marks }: marks are items to record as seen straight away
 * (the lab's own notes, withdrawals, the baseline); steers wait on the shift.
 */
export async function takeSteers(kinoOrigin, seen, fetchJson) {
  const kino = normalizeOrigin(kinoOrigin);
  const index = await fetchJson(`${kino}items/index.json`);
  const baseline = seen === undefined;
  const known = seen ?? {};
  const steers = [];
  const marks = [];

  for (const item of index.items ?? []) {
    if (known[item.id] === item.version) continue;
    const mark = { key: item.id, value: item.version };
    if (baseline || item.kind === "withdrawn") { marks.push(mark); continue; }
    let doc;
    try {
      doc = await fetchJson(`${kino}items/${item.id}.json`);
    } catch {
      continue; // unreadable tonight; tried again tomorrow
    }
    if (doc.generated?.length) { marks.push(mark); continue; } // the lab's own
    const html = doc.content_html ?? "";
    let answers = null;
    if (doc.stub_of?.origin && normalizeOrigin(doc.stub_of.origin) === kino) {
      try {
        const target = await fetchJson(`${kino}items/${doc.stub_of.id}.json`);
        answers = target.page ? new URL(target.page, kino).href : doc.stub_of.id;
      } catch {
        answers = doc.stub_of.cited?.url ?? doc.stub_of.id;
      }
    }
    steers.push({
      id: `take:${item.id}:v${item.version}`,
      url: doc.page ? new URL(doc.page, kino).href : `${kino}items/${item.id}.json`,
      version: item.version,
      text: textOf(html).slice(0, MAX_TEXT),
      links: [...new Set([...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&")))],
      answers,
      seen: mark,
    });
  }
  return { steers, marks };
}

/**
 * The lab's threads that quote an older version of something than the one now
 * live (§10.4 staleness): a claim that moved stage since the write-up quoting
 * it was published. Each is the page of the thread and what it quotes stale.
 */
export async function staleThreads(kinoOrigin, fetchJson) {
  const kino = normalizeOrigin(kinoOrigin);
  const index = await fetchJson(`${kino}items/index.json`);
  const live = new Map((index.items ?? []).map((item) => [item.id, item]));
  const stale = [];
  for (const item of index.items ?? []) {
    if (item.kind !== "thread") continue;
    const doc = await fetchJson(`${kino}items/${item.id}.json`);
    if (!doc.generated?.length) continue; // the PI's stubs aren't the lab's to refresh
    const behind = (doc.transclusions ?? []).filter((t) => !t.origin && live.get(t.id)?.kind !== "withdrawn"
      && (live.get(t.id)?.version ?? 0) > t.version);
    if (!behind.length) continue;
    const pages = [];
    for (const t of behind) {
      const target = await fetchJson(`${kino}items/${t.id}.json`).catch(() => null);
      pages.push(`${target?.page ?? t.id} (quoted v${t.version}, now v${live.get(t.id).version})`);
    }
    stale.push({ page: doc.page, quotes: pages });
  }
  return stale;
}

export async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000), headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  return response.json();
}

/**
 * Shares the PI sent the lab from Subset: each a page in `reading/`, written
 * there by the lab's Subset receiver (README, "Shares from Subset") — a link,
 * the PI's notes on it and the excerpts they chose. Not published anywhere;
 * the shift weighs each one and decides what, if anything, it becomes. A
 * share is a steer like a take, keyed `share:<file>`, and like a take it is
 * marked seen only once the shift has recorded what it did with it.
 */
export function readingShares(dir, seen = {}, repoBase = "") {
  if (!existsSync(dir)) return [];
  const steers = [];
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".html") && !f.startsWith("_")).sort()) {
    const key = `share:${file.replace(/\.html$/, "")}`;
    if (seen[key]) continue;
    const html = readFileSync(join(dir, file), "utf8");
    const main = html.match(/<main>([\s\S]*?)<\/main>/)?.[1] ?? "";
    const source = main.match(/<p class="source"><a href="([^"]+)">([\s\S]*?)<\/a><\/p>/);
    const link = source ? source[1].replace(/&amp;/g, "&") : null;
    const title = source ? textOf(source[2]).replace(/\s*↗\s*$/, "") : "";
    // Excerpts are the blockquotes; everything else in the body is the PI's.
    const body = main.replace(/<p class="source">[\s\S]*?<\/p>/, "")
      .replace(/<blockquote>([\s\S]*?)<\/blockquote>/g, (whole, inner) => `<p>Excerpt: “${textOf(inner)}”</p>`);
    steers.push({
      id: key,
      share: true,
      url: `${repoBase}reading/${file}`,
      title,
      text: [title && `Shared: ${title}`, textOf(body)].filter(Boolean).join("\n").slice(0, MAX_TEXT),
      links: link ? [link] : [],
      seen: { key, value: 1 },
    });
  }
  return steers;
}
