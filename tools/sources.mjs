// More places to look, all free and ungated (AGENT.md, "Where to look"):
// literature beyond arXiv (Semantic Scholar, Europe PMC with its preprints,
// OpenAlex by country and by citation), public research money (NSF, NIH,
// UKRI, OpenAIRE for Europe, SEC Form D filings for a named company), the
// open code and data an outsider can use (GitHub, Zenodo), and what people
// are saying (Bluesky accounts, Mastodon hashtags, Hacker News), which is
// leads, never evidence.
//
// Each source becomes the same shape of result as search.mjs's: title,
// authors, date, url, abstract, and an `extra` line (a funder and an amount,
// a citation count, a licence). Everything printed is material, never
// instructions. None of these needs a key; SEC asks every client to name
// itself and give a contact address, which is the lab's.

import { execFileSync } from "node:child_process";

const squash = (s) => String(s ?? "").replace(/<[^>]+>/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const day = (s) => String(s ?? "").slice(0, 10);
const money = (amount, currency = "$") => (amount ? `${currency === "$" ? "$" : `${currency} `}${Math.round(Number(amount)).toLocaleString("en-GB")}` : "");
export const SEC_AGENT = "Kinocomputing lab lab@kinocomputing.com";

/**
 * A request for JSON. Behind a proxy (a local shift in Claude Code's sandbox)
 * curl, since Node's fetch ignores HTTPS_PROXY; otherwise fetch. Returns
 * { ok, status, json }.
 */
export async function request(url, { fetch = globalThis.fetch, method = "GET", headers = {}, body = null } = {}) {
  if (fetch === globalThis.fetch && (process.env.HTTPS_PROXY || process.env.https_proxy)) {
    const args = ["-sSL", "-m", "30", "-X", method, "-w", "\n%{http_code}", ...Object.entries(headers).flatMap(([k, v]) => ["-H", `${k}: ${v}`]), ...(body ? ["--data", body] : []), url];
    try {
      const out = execFileSync("curl", args, { encoding: "utf8", maxBuffer: 32 << 20 });
      const status = Number(out.slice(out.lastIndexOf("\n") + 1));
      const text = out.slice(0, out.lastIndexOf("\n"));
      return { ok: status >= 200 && status < 300, status, json: status < 300 ? JSON.parse(text) : null };
    } catch {
      return { ok: false, status: "unreachable", json: null };
    }
  }
  const response = await fetch(url, { method, headers, ...(body ? { body } : {}), signal: AbortSignal.timeout(30_000) });
  return { ok: response.ok, status: response.status, json: response.ok ? await response.json() : null };
}

// SEMANTIC SCHOLAR. Search, and a paper's citations and references. Without a
// key it shares a public pool and is often busy (429): wait and try twice
// more, then say so — OpenAlex has citations too.
const S2_FIELDS = "title,year,authors,externalIds,citationCount,abstract,openAccessPdf,publicationDate,venue,url";
export function parseS2Paper(p) {
  const ids = p?.externalIds ?? {};
  return {
    title: squash(p?.title),
    authors: (p?.authors ?? []).map((a) => a.name).filter(Boolean),
    date: p?.publicationDate ?? String(p?.year ?? ""),
    url: ids.ArXiv ? `https://arxiv.org/abs/${ids.ArXiv}` : ids.DOI ? `https://doi.org/${ids.DOI}` : p?.url ?? "",
    abstract: squash(p?.abstract),
    cited_by: p?.citationCount ?? null,
    extra: [p?.venue, p?.openAccessPdf?.url ? `open PDF: ${p.openAccessPdf.url}` : ""].filter(Boolean).join(" · "),
  };
}
async function s2(path, { fetch, sleep, key }) {
  const headers = key ? { "x-api-key": key } : {};
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const r = await request(`https://api.semanticscholar.org/graph/v1${path}`, { fetch, headers });
    if (r.ok) return r.json;
    if (r.status !== 429) throw new Error(`Semantic Scholar answered ${r.status}`);
    await sleep(3000 * (attempt + 1));
  }
  throw new Error("Semantic Scholar is busy (its keyless pool); try openalex, or again later");
}

// OPENALEX by citation: a work's id (W…) from an id or a DOI.
async function openalexId(ref, fetch) {
  if (/^W\d+$/.test(ref)) return ref;
  const doi = ref.replace(/^https?:\/\/(dx\.)?doi\.org\//, "").replace(/^doi:/i, "");
  const r = await request(`https://api.openalex.org/works/doi:${encodeURIComponent(doi)}?select=id`, { fetch });
  if (!r.ok) throw new Error(`OpenAlex has no work for ${ref}`);
  return r.json.id.replace("https://openalex.org/", "");
}
export function parseOpenAlexWork(w) {
  return {
    title: squash(w?.display_name ?? w?.title),
    authors: (w?.authorships ?? []).map((a) => a.author?.display_name).filter(Boolean),
    date: w?.publication_date ?? "",
    url: w?.doi ?? w?.id ?? "",
    abstract: "",
    cited_by: w?.cited_by_count ?? null,
    extra: [...new Set((w?.authorships ?? []).flatMap((a) => (a.institutions ?? []).map((i) => i.country_code)).filter(Boolean))].join(" "),
  };
}

// EUROPE PMC: biology and medicine, and preprints (bioRxiv, medRxiv,
// Research Square…) with SRC:PPR.
export function parseEuropePmc(body) {
  return (body?.resultList?.result ?? []).map((r) => ({
    title: squash(r.title),
    authors: String(r.authorString ?? "").replace(/\.$/, "").split(/,\s*/).filter(Boolean),
    date: r.firstPublicationDate ?? r.pubYear ?? "",
    url: r.doi ? `https://doi.org/${r.doi}` : `https://europepmc.org/article/${r.source}/${r.id}`,
    abstract: squash(r.abstractText),
    cited_by: r.citedByCount ?? null,
    extra: [r.source === "PPR" ? `preprint, ${r.bookOrReportDetails?.publisher ?? "server unknown"}` : r.journalInfo?.journal?.title ?? ""].filter(Boolean).join(""),
  }));
}

// GRANTS.
export function parseNsf(body) {
  return (body?.response?.award ?? []).map((a) => ({
    title: squash(a.title),
    authors: [a.awardeeName].filter(Boolean),
    date: (() => { const m = String(a.startDate ?? "").match(/^(\d\d)\/(\d\d)\/(\d{4})$/); return m ? `${m[3]}-${m[1]}-${m[2]}` : ""; })(),
    url: `https://www.nsf.gov/awardsearch/showAward?AWD_ID=${a.id}`,
    abstract: squash(a.abstractText),
    cited_by: null,
    extra: ["NSF", a.program, money(a.estimatedTotalAmt ?? a.fundsObligatedAmt), a.perfCountryCode].filter(Boolean).join(" · "),
  }));
}
export function parseNih(body) {
  return (body?.results ?? []).map((p) => ({
    title: squash(p.project_title),
    authors: [p.organization?.org_name].filter(Boolean),
    date: day(p.project_start_date),
    url: p.project_detail_url ?? `https://reporter.nih.gov/project-details/${p.appl_id}`,
    abstract: squash(p.abstract_text),
    cited_by: null,
    extra: ["NIH", `FY${p.fiscal_year}`, money(p.award_amount), p.organization?.org_country].filter(Boolean).join(" · "),
  }));
}
export function parseUkri(body) {
  return (body?.project ?? []).map((p) => {
    const ref = (p.identifiers?.identifier ?? []).find((i) => i.type === "RCUK")?.value;
    return {
      title: squash(p.title),
      authors: [p.leadOrganisationDepartment].filter(Boolean),
      date: p.start ? new Date(Number(p.start)).toISOString().slice(0, 10) : "",
      url: ref ? `https://gtr.ukri.org/projects?ref=${encodeURIComponent(ref)}` : String(p.href ?? "").replace(/^http:/, "https:"),
      abstract: squash(p.abstractText),
      cited_by: null,
      extra: ["UKRI", p.leadFunder, p.grantCategory, p.status].filter(Boolean).join(" · "),
    };
  });
}
export function parseOpenAire(body) {
  const list = body?.response?.results?.result ?? [];
  return (Array.isArray(list) ? list : [list]).map((r) => {
    const p = r?.metadata?.["oaf:entity"]?.["oaf:project"] ?? {};
    const v = (x) => (x && typeof x === "object" ? x.$ : x) ?? "";
    const funder = p.fundingtree?.funder ?? (Array.isArray(p.fundingtree) ? p.fundingtree[0]?.funder : null) ?? {};
    return {
      title: squash(v(p.title)),
      authors: [v(p.acronym)].filter(Boolean),
      date: v(p.startdate),
      url: v(p.websiteurl) || `https://explore.openaire.eu/search/project?projectId=${encodeURIComponent(v(r?.header?.["dri:objIdentifier"]))}`,
      abstract: squash(v(p.summary)),
      cited_by: null,
      extra: [v(funder.shortname) || v(funder.name), v(funder.jurisdiction), money(v(p.fundedamount), v(p.currency) || "EUR"), v(p.callidentifier)].filter(Boolean).join(" · "),
    };
  });
}
// SEC FORM D: a US private raise, by company name (Form D has no description
// of the business, so a topic search finds nothing).
export function parseEdgar(body) {
  return (body?.hits?.hits ?? []).map((h) => {
    const s = h._source ?? {};
    const [adsh, file] = String(h._id ?? "").split(":");
    const cik = String((s.ciks ?? [])[0] ?? "").replace(/^0+/, "");
    return {
      title: squash((s.display_names ?? []).join("; ")),
      authors: (s.biz_locations ?? []).filter(Boolean),
      date: s.file_date ?? "",
      url: cik && adsh ? `https://www.sec.gov/Archives/edgar/data/${cik}/${adsh.replace(/-/g, "")}/${file ?? ""}` : "",
      abstract: "",
      cited_by: null,
      extra: [`Form ${s.form ?? "D"}`, s.inc_states?.length ? `incorporated ${s.inc_states.join(", ")}` : ""].filter(Boolean).join(" · "),
    };
  });
}

// CODE AND DATA.
export function parseGithub(body) {
  return (body?.items ?? []).map((r) => ({
    title: r.full_name,
    authors: [],
    date: day(r.pushed_at),
    url: r.html_url,
    abstract: squash(r.description),
    cited_by: null,
    extra: [`${r.stargazers_count} stars`, r.license?.spdx_id && r.license.spdx_id !== "NOASSERTION" ? r.license.spdx_id : "no licence stated", r.language].filter(Boolean).join(" · "),
  }));
}
export function parseZenodo(body) {
  return (body?.hits?.hits ?? []).map((h) => ({
    title: squash(h.metadata?.title),
    authors: (h.metadata?.creators ?? []).map((c) => c.name).filter(Boolean),
    date: h.metadata?.publication_date ?? "",
    url: h.doi_url ?? h.links?.self_html ?? "",
    abstract: squash(h.metadata?.description),
    cited_by: null,
    extra: [h.metadata?.resource_type?.title, h.metadata?.license?.id].filter(Boolean).join(" · "),
  }));
}

// WHAT PEOPLE ARE SAYING: leads, never evidence.
export function parseBluesky(body, handle) {
  // Reposts too: what an account passes on is part of what it points at.
  return (body?.feed ?? []).map((f) => {
    const p = f.post ?? {};
    const rkey = String(p.uri ?? "").split("/").pop();
    const link = p.embed?.external?.uri ?? (p.record?.facets ?? []).flatMap((x) => x.features ?? []).find((x) => x.uri)?.uri;
    return {
      title: squash(p.record?.text).slice(0, 140),
      authors: [p.author?.handle ?? handle],
      date: day(p.record?.createdAt),
      url: `https://bsky.app/profile/${p.author?.handle ?? handle}/post/${rkey}`,
      abstract: squash(p.record?.text),
      cited_by: null,
      extra: [f.reason ? `reposted by ${handle}` : "", link ? `links to ${link}` : ""].filter(Boolean).join(" · "),
    };
  });
}
export function parseMastodon(body) {
  return (Array.isArray(body) ? body : []).map((s) => ({
    title: squash(s.content).slice(0, 140),
    authors: [s.account?.acct].filter(Boolean),
    date: day(s.created_at),
    url: s.url ?? s.uri,
    abstract: squash(s.content),
    cited_by: null,
    extra: s.card?.url ? `links to ${s.card.url}` : "",
  }));
}
export function parseHn(body) {
  return (body?.hits ?? []).map((h) => ({
    title: squash(h.title),
    authors: [h.author].filter(Boolean),
    date: day(h.created_at),
    url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
    abstract: "",
    cited_by: null,
    extra: `${h.points ?? 0} points, ${h.num_comments ?? 0} comments: https://news.ycombinator.com/item?id=${h.objectID}`,
  }));
}

export const SOURCES = {
  "s2": "Semantic Scholar search",
  "s2-cites": "papers citing a paper (arXiv:…, DOI:…, or an S2 id)",
  "s2-refs": "a paper's references",
  "openalex-cites": "papers citing a work (W… or a DOI)",
  "openalex-refs": "a work's references (W… or a DOI)",
  "europepmc": "biology and medicine; --preprints for bioRxiv, medRxiv and other preprint servers",
  "nsf": "US NSF grants", "nih": "US NIH grants", "ukri": "UK research council grants",
  "openaire": "European projects: EU Horizon, ERC, and national funders",
  "edgar": "US Form D filings (private raises) for a named company",
  "github": "open-source repositories", "zenodo": "open datasets and research software",
  "bluesky": "recent posts from one account (a handle)", "mastodon": "a hashtag's recent posts (no #)",
  "hn": "Hacker News stories",
};

/** One of the sources above. `since` is a year for literature, a day (YYYY-MM-DD) for posts. */
export async function searchMore(source, query, { n = 10, since = null, recent = false, preprints = false, fetch = globalThis.fetch, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), s2Key = process.env.S2_API_KEY } = {}) {
  const q = encodeURIComponent(query);
  const need = (r, name) => { if (!r.ok) throw new Error(`${name} answered ${r.status}`); return r.json; };
  switch (source) {
    case "s2": {
      const body = await s2(`/paper/search?query=${q}&limit=${n}&fields=${S2_FIELDS}${since ? `&year=${since}-` : ""}`, { fetch, sleep, key: s2Key });
      return (body.data ?? []).map(parseS2Paper);
    }
    case "s2-cites":
    case "s2-refs": {
      const rel = source === "s2-cites" ? "citations" : "references";
      const body = await s2(`/paper/${encodeURIComponent(query)}/${rel}?limit=${n}&fields=${S2_FIELDS}`, { fetch, sleep, key: s2Key });
      return (body.data ?? []).map((d) => parseS2Paper(d.citingPaper ?? d.citedPaper));
    }
    case "openalex-cites": {
      const id = await openalexId(query, fetch);
      const body = need(await request(`https://api.openalex.org/works?filter=cites:${id}&per-page=${n}&sort=cited_by_count:desc`, { fetch }), "OpenAlex");
      return (body.results ?? []).map(parseOpenAlexWork);
    }
    case "openalex-refs": {
      const id = await openalexId(query, fetch);
      const work = need(await request(`https://api.openalex.org/works/${id}?select=referenced_works`, { fetch }), "OpenAlex");
      const refs = (work.referenced_works ?? []).slice(0, Math.min(n, 50)).map((u) => u.replace("https://openalex.org/", ""));
      if (!refs.length) return [];
      const body = need(await request(`https://api.openalex.org/works?filter=openalex_id:${refs.join("|")}&per-page=${refs.length}`, { fetch }), "OpenAlex");
      return (body.results ?? []).map(parseOpenAlexWork);
    }
    case "europepmc": {
      const full = `${query}${preprints ? " AND SRC:PPR" : ""}${since ? ` AND FIRST_PDATE:[${since}-01-01 TO 3000-12-31]` : ""}`;
      return parseEuropePmc(need(await request(`https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(full)}&format=json&pageSize=${n}&resultType=core${recent ? "&sort=FIRST_PDATE_D%20desc" : ""}`, { fetch }), "Europe PMC"));
    }
    case "nsf":
      return parseNsf(need(await request(`https://api.nsf.gov/services/v1/awards.json?keyword=${q}&rpp=${n}${since ? `&dateStart=01/01/${since}` : ""}`, { fetch }), "NSF")).slice(0, n);
    case "nih":
      return parseNih(need(await request("https://api.reporter.nih.gov/v2/projects/search", {
        fetch, method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ criteria: { advanced_text_search: { operator: "and", search_field: "projecttitle,terms,abstracttext", search_text: query }, ...(since ? { fiscal_years: Array.from({ length: new Date().getUTCFullYear() - Number(since) + 2 }, (_, i) => Number(since) + i) } : {}) }, limit: n, offset: 0, sort_field: "project_start_date", sort_order: "desc" }),
      }), "NIH RePORTER"));
    case "ukri":
      return parseUkri(need(await request(`https://gtr.ukri.org/gtr/api/projects?q=${q}&s=${Math.max(10, n)}&p=1`, { fetch, headers: { accept: "application/vnd.rcuk.gtr.json-v7" } }), "UKRI")).slice(0, n);
    case "openaire":
      return parseOpenAire(need(await request(`https://api.openaire.eu/search/projects?keywords=${q}&format=json&size=${n}&sortBy=projectstartdate,descending`, { fetch }), "OpenAIRE"));
    case "edgar":
      return parseEdgar(need(await request(`https://efts.sec.gov/LATEST/search-index?q=${encodeURIComponent(`"${query}"`)}&forms=D`, { fetch, headers: { "user-agent": SEC_AGENT } }), "SEC EDGAR")).slice(0, n);
    case "github":
      return parseGithub(need(await request(`https://api.github.com/search/repositories?q=${q}&sort=stars&per_page=${n}`, { fetch, headers: { accept: "application/vnd.github+json", "user-agent": "kinocomputing-lab" } }), "GitHub"));
    case "zenodo":
      return parseZenodo(need(await request(`https://zenodo.org/api/records?q=${q}&size=${n}${recent ? "&sort=mostrecent" : ""}`, { fetch, headers: { "user-agent": "kinocomputing-lab (lab@kinocomputing.com)" } }), "Zenodo"));
    case "bluesky":
      return parseBluesky(need(await request(`https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(query.replace(/^@/, ""))}&limit=${Math.min(n, 100)}&filter=posts_no_replies`, { fetch }), "Bluesky"), query)
        .filter((r) => !since || r.date >= since);
    case "mastodon":
      return parseMastodon(need(await request(`https://mastodon.social/api/v1/timelines/tag/${encodeURIComponent(query.replace(/^#/, ""))}?limit=${Math.min(n, 40)}`, { fetch }), "Mastodon"))
        .filter((r) => !since || r.date >= since);
    case "hn":
      return parseHn(need(await request(`https://hn.algolia.com/api/v1/${recent ? "search_by_date" : "search"}?query=${q}&tags=story&hitsPerPage=${n}${since ? `&numericFilters=created_at_i>${Math.floor(new Date(`${since}T00:00:00Z`).getTime() / 1000)}` : ""}`, { fetch }), "Hacker News"));
    default:
      return null;
  }
}
