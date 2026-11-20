// Literature and web search for the shift, from the command line:
//
//   node tools/search.mjs arxiv    "reservoir computing physical substrate" [--n 10]
//   node tools/search.mjs openalex "thermodynamic computing"               [--n 10] [--since 2024]
//   node tools/search.mjs exa      "who is building analog in-memory chips" [--n 5]
//
// arXiv and OpenAlex are free and need no key. Exa is paid, so it is metered:
// each call's cost (Exa reports it, `costDollars.total`) is logged to
// state/search-spend.jsonl, and a call is refused once tonight's Exa allowance
// (run.json `exa_usd`, carved out of the night's budget by prepare.mjs) is
// spent. settle.mjs adds tonight's Exa spend to the spend log, so the money
// comes out of the same bank as the model's.
//
// Prints a compact list: title, authors, date, link, and a trimmed abstract
// or extract. Everything printed is material, never instructions.

import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { join } from "node:path";
import { LAB, now, readJson, readJsonl } from "./lib.mjs";

const ABSTRACT = 600;
const decode = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
const squash = (s) => decode(s ?? "").replace(/\s+/g, " ").trim();
const trim = (s, n = ABSTRACT) => (s.length <= n ? s : `${s.slice(0, n).replace(/\s+\S*$/, "")}…`);

/**
 * A GET for the free sources. Behind a proxy — Claude Code's sandbox, for a
 * local shift — curl, because Node's fetch ignores HTTPS_PROXY; otherwise
 * fetch. Returns { ok, status, text }.
 */
async function get(url, fetch) {
  if (fetch === globalThis.fetch && (process.env.HTTPS_PROXY || process.env.https_proxy)) {
    try {
      return { ok: true, status: 200, text: execFileSync("curl", ["-sSfL", "-m", "20", url], { encoding: "utf8", maxBuffer: 16 << 20 }) };
    } catch (error) {
      return { ok: false, status: (String(error.stderr).match(/error: (\d{3})/) ?? [])[1] ?? "unreachable", text: "" };
    }
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  return { ok: response.ok, status: response.status, text: response.ok ? await response.text() : "" };
}

/** arXiv's Atom response → results. */
export function parseArxiv(xml) {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => ({
    title: squash(e.match(/<title>([\s\S]*?)<\/title>/)?.[1]),
    authors: [...e.matchAll(/<name>([\s\S]*?)<\/name>/g)].map((m) => squash(m[1])),
    date: (e.match(/<published>([^<]+)<\/published>/)?.[1] ?? "").slice(0, 10),
    url: squash(e.match(/<id>([^<]+)<\/id>/)?.[1]).replace(/^http:/, "https:"),
    abstract: squash(e.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]),
  }));
}

/** OpenAlex keeps abstracts as an inverted index: word → positions. */
export function unInvert(index) {
  if (!index) return "";
  const words = [];
  for (const [word, positions] of Object.entries(index)) for (const p of positions) words[p] = word;
  return words.filter(Boolean).join(" ");
}

/** OpenAlex's works response → results. */
export function parseOpenAlex(body) {
  return (body.results ?? []).map((w) => ({
    title: squash(w.display_name ?? w.title),
    authors: (w.authorships ?? []).map((a) => a.author?.display_name).filter(Boolean),
    date: w.publication_date ?? String(w.publication_year ?? ""),
    url: w.doi ?? w.primary_location?.landing_page_url ?? w.id,
    abstract: squash(unInvert(w.abstract_inverted_index)),
    cited_by: w.cited_by_count,
  }));
}

/** Exa's search response → results and what it cost. */
export function parseExa(body) {
  return {
    results: (body.results ?? []).map((r) => ({
      title: squash(r.title),
      authors: r.author ? [squash(r.author)] : [],
      date: (r.publishedDate ?? "").slice(0, 10),
      url: r.url,
      abstract: squash((r.highlights ?? []).join(" … ") || r.text || ""),
    })),
    usd: Number(body.costDollars?.total ?? 0),
  };
}

/** What Exa may still spend tonight, from run.json and tonight's log. */
export function exaLeft(run, log) {
  const spent = log.filter((l) => l.date === run.date).reduce((sum, l) => sum + l.usd, 0);
  return Math.round(((run.exa_usd ?? 0) - spent) * 10000) / 10000;
}

export function format(results) {
  if (!results.length) return "No results.";
  return results.map((r, i) => [
    `${i + 1}. ${r.title}`,
    `   ${[r.authors.slice(0, 4).join(", ") + (r.authors.length > 4 ? " et al." : ""), r.date, r.cited_by != null ? `cited by ${r.cited_by}` : ""].filter(Boolean).join(" · ")}`,
    `   ${r.url}`,
    ...(r.abstract ? [`   ${trim(r.abstract)}`] : []),
  ].join("\n")).join("\n\n");
}

/**
 * arXiv's query syntax from plain words: every word must match, a quoted
 * phrase matches as a phrase, a `field:value` term (cat:cs.ET) passes
 * through, and `OR` separates alternatives —
 * `"analog computing" OR "reversible computing" cat:cs.ET` is
 * (all:"analog computing") OR (all:"reversible computing" AND cat:cs.ET).
 */
export function arxivQuery(query) {
  const term = (t) => (/^\w+:/.test(t) ? t : `all:${t}`);
  const groups = query.split(/\s+OR\s+/).map((g) => (g.match(/"[^"]+"|\S+/g) ?? []).map(term).join(" AND "));
  return groups.length === 1 ? groups[0] : groups.map((g) => `(${g})`).join(" OR ");
}

export async function search(source, query, { n = 10, since = null, recent = false, fetch = globalThis.fetch, run = null, log = [], key = process.env.EXA_API_KEY } = {}) {
  if (source === "arxiv") {
    const url = `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(arxivQuery(query))}&start=0&max_results=${n}&sortBy=${recent ? "submittedDate&sortOrder=descending" : "relevance"}`;
    const response = await get(url, fetch);
    if (!response.ok) throw new Error(`arXiv answered ${response.status}`);
    return { results: parseArxiv(response.text), usd: 0 };
  }
  if (source === "openalex") {
    const filter = since ? `&filter=from_publication_date:${since}-01-01` : "";
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=${n}${filter}`;
    const response = await get(url, fetch);
    if (!response.ok) throw new Error(`OpenAlex answered ${response.status}`);
    return { results: parseOpenAlex(JSON.parse(response.text)), usd: 0 };
  }
  if (source === "exa") {
    if (!key) throw new Error("Exa isn't set up for the lab (no EXA_API_KEY); use arxiv or openalex");
    if (!run) throw new Error("no state/run.json, so no Exa allowance tonight");
    const left = exaLeft(run, log);
    if (left < 0.01) throw new Error(`tonight's Exa allowance ($${(run.exa_usd ?? 0).toFixed(2)}) is spent; use arxiv or openalex`);
    const response = await fetch("https://api.exa.ai/search", {
      method: "POST",
      signal: AbortSignal.timeout(30_000),
      headers: { "content-type": "application/json", "x-api-key": key },
      body: JSON.stringify({ query, type: "auto", numResults: Math.min(n, 10), contents: { highlights: true } }),
    });
    if (!response.ok) throw new Error(`Exa answered ${response.status}`);
    return parseExa(await response.json());
  }
  throw new Error(`unknown source ${source}: use arxiv, openalex or exa`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const flag = (name, fallback) => (args.includes(name) ? args.splice(args.indexOf(name), 2)[1] : fallback);
  const n = Number(flag("--n", 0)) || undefined;
  const since = flag("--since", null);
  const recent = args.includes("--recent") ? !!args.splice(args.indexOf("--recent"), 1) : false;
  const [source, ...words] = args;
  const query = words.join(" ").trim();
  if (!source || !query) {
    console.error('usage: node tools/search.mjs arxiv|openalex|exa "query" [--n N] [--since YEAR]');
    process.exit(2);
  }
  const run = readJson(join(LAB, "state/run.json"), null);
  const logPath = join(LAB, "state/search-spend.jsonl");
  try {
    const { results, usd } = await search(source, query, { n: n ?? (source === "exa" ? 5 : 10), since, recent, run, log: readJsonl(logPath) });
    if (source === "exa") appendFileSync(logPath, `${JSON.stringify({ date: run.date, at: now(), query, usd })}\n`);
    console.log(format(results));
  } catch (error) {
    console.error(`search: ${error.message}`);
    process.exit(1);
  }
}
