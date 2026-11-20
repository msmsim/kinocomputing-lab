// The PI's steers, from the two places they come in:
//
// - inbox/: a motes vault publishes notes here — links, thoughts, questions —
//   as HTML pages. A page is a steer each time it's written with new bytes.
// - The PI's own blygs: a note there that answers one of the lab's (a stub of
//   it, or a note linking it) is a steer. Read from the blyg's public surface,
//   so no credentials and no tokens.
//
// Nothing here spends model tokens. Each steer carries the `seen` key that
// marks it delivered; settle.mjs applies that only once the shift has
// recorded what it did with the steer, so one the agent misses comes back.

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { hash8, normalizeOrigin, textOf } from "./lib.mjs";

const MAX_TEXT = 2000;

/** New or changed inbox pages, as steers. */
export function inboxSteers(dir, seen = {}) {
  if (!existsSync(dir)) return [];
  const steers = [];
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".html") && !f.startsWith("_")).sort()) {
    const html = readFileSync(join(dir, file), "utf8");
    const digest = hash8(html);
    const name = file.replace(/\.html$/, "");
    if (seen[name] === digest) continue;
    const main = html.match(/<main>([\s\S]*?)<\/main>/)?.[1] ?? html;
    const links = [...main.matchAll(/<a\s[^>]*href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));
    steers.push({
      id: `inbox:${name}:${digest}`,
      from: "inbox",
      title: name,
      text: textOf(main).slice(0, MAX_TEXT),
      links: [...new Set(links)],
      seen: { kind: "inbox", key: name, value: digest },
    });
  }
  return steers;
}

/**
 * Notes on one of the PI's blygs that answer the lab: a stub of a
 * kinocomputing item, or a note whose content links kinocomputing. Only items
 * changed since last seen are fetched.
 *
 * The first look at a blyg is a baseline: everything already there is marked
 * seen and nothing is returned, so turning the lab on doesn't replay a
 * blyg's whole history as steers.
 */
export async function blygSteers(origin, kinoOrigin, seen, fetchJson) {
  const blyg = normalizeOrigin(origin);
  const kino = normalizeOrigin(kinoOrigin);
  const index = await fetchJson(`${blyg}items/index.json`);
  const baseline = seen === undefined;
  const known = seen ?? {};
  const steers = [];
  const marks = [];

  for (const item of index.items ?? []) {
    if (known[item.id] === item.version) continue;
    marks.push({ kind: "blyg", key: `${blyg} ${item.id}`, value: item.version });
    if (baseline || item.kind === "withdrawn") continue;
    let doc;
    try {
      doc = await fetchJson(`${blyg}items/${item.id}.json`);
    } catch {
      continue;
    }
    const html = doc.content_html ?? "";
    const stubbed = doc.stub_of && normalizeOrigin(doc.stub_of.origin) === kino;
    const linked = html.includes(kino.replace(/^https:\/\/www\./, "")) || html.includes(kino);
    if (!stubbed && !linked) continue;
    steers.push({
      id: `blyg:${blyg}:${item.id}:v${item.version}`,
      from: "blyg",
      title: doc.page ? new URL(doc.page, blyg).href : `${blyg}items/${item.id}.json`,
      text: textOf(html).slice(0, MAX_TEXT),
      links: [...new Set([...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]))],
      answers: stubbed ? doc.stub_of.cited?.url ?? null : null,
      seen: { kind: "blyg", key: `${blyg} ${item.id}`, value: item.version },
    });
  }
  // Items that aren't steers are marked seen straight away; only steers wait
  // on the shift to handle them.
  const steerKeys = new Set(steers.map((s) => s.seen.key));
  return { steers, marks: marks.filter((m) => !steerKeys.has(m.key)) };
}

export async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000), headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  return response.json();
}
