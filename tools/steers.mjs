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

export async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000), headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  return response.json();
}
