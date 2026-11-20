// An outbox note → a kinocomputing note page, or a refusal saying why.
//
// The page is written the way motes writes one: kinocomputing's own
// notes/_note.html, filled, with each optional section kept only when there is
// a value for it. Added for the lab: the §5.7 disclosure meta
// (`blyg:generated`, naming the model), which kinocomputing's build turns into
// provenance and a visible line; and the item's kind (P21). A claim is a
// fragment — short, quotable, a leaf. Everything else the lab writes is a
// thread, and a thread can quote.
//
// Quotes are written the way §10.1 writes them, with note names for ids: a
// line holding only `![[name]]` quotes that note whole, and `>` lines straight
// after it quote that part of it. Here they become kinocomputing's quote
// blocks (P22); `quote`, from settle, says which file a name is and what its
// text is, so a quote that won't resolve is refused before it reaches the site.
//
// The gate is kinocomputing's own converter. A note whose HTML it can't turn
// back into markdown would publish with no blyg item — so it is refused here,
// before it reaches the site, with the converter's reason.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { marked } from "marked";

const DIRECTIVE = /^!\[\[([^\]|\s]+)\]\]\s*$/;
const FENCE = /^\s{0,3}(`{3,}|~{3,})/;

/**
 * Pulls the quotes out of a note's markdown before it is rendered: each one is
 * left as a placeholder paragraph, and listed with its name and selection.
 */
export function extractQuotes(markdown) {
  const lines = markdown.split("\n");
  const out = [];
  const quotes = [];
  let fence = null;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const f = line.match(FENCE);
    if (f && (!fence || f[1][0] === fence[0] && f[1].length >= fence.length)) fence = fence ? null : f[1];
    const d = !fence && line.match(DIRECTIVE);
    if (!d) { out.push(line); continue; }
    const selection = [];
    while (i + 1 < lines.length && /^\s{0,3}>/.test(lines[i + 1])) {
      i += 1;
      const text = lines[i].replace(/^\s{0,3}>\s?/, "").replace(/\s+/g, " ").trim();
      if (text) selection.push(text);
    }
    out.push("", `KINOQUOTE${quotes.length}`, "");
    quotes.push({ name: d[1], lines: selection });
  }
  return { markdown: out.join("\n"), quotes };
}

/** Markdown constructs the blyg can't carry. Found by walking marked's tokens. */
function refusals(markdown) {
  const found = new Set();
  marked.walkTokens(marked.lexer(markdown), (token) => {
    if (token.type === "html") found.add("raw HTML");
    if (token.type === "table") found.add("a table");
  });
  return [...found];
}

const escapeAttr = (text) => text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** The opening paragraph as a description, cut at a word near 160 characters. */
function describe(html) {
  const paragraphs = [...html.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1]);
  const opening = paragraphs.find((p) => !/^<strong>[\s\S]*<\/strong>$/.test(p.trim())) ?? paragraphs[0] ?? "";
  const text = opening.replace(/<[^>]+>/g, "").replace(/&#39;/g, "’").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  if (text.length <= 160) return text;
  const cut = text.slice(0, 160);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 100)).replace(/[\s.,;:—–-]+$/, "")}…`;
}

/**
 * Renders one note. `kino` is the kinocomputing checkout (its template and
 * converter are the contract). Throws an Error whose message is the refusal.
 */
export async function renderNote({ markdown, name, pin = false, changeNote = null, answers = null, kind = "notebook",
  maxClaim = 1000, quote = null, model, at, kino, origin }) {
  const refused = refusals(markdown);
  if (refused.length) throw new Error(`uses ${refused.join(" and ")}, which the blyg can't carry`);
  const extracted = extractQuotes(markdown.trim());
  const claim = kind === "claim";
  if (claim && extracted.quotes.length) throw new Error("is a claim, and a claim can't quote; quote it from a thread");
  if (claim && markdown.trim().length > maxClaim) throw new Error(`is a claim of ${markdown.trim().length} characters; a claim is at most ${maxClaim}`);
  let html = marked.parse(extracted.markdown).trim();
  if (!html) throw new Error("is empty");
  const { htmlToMarkdown, textContent } = await import(pathToFileURL(join(kino, "tools", "blyg.mjs")).href);
  for (const [i, q] of extracted.quotes.entries()) {
    if (!quote) throw new Error(`quotes ${q.name}, and nothing here can resolve quotes`);
    const target = quote(q.name); // throws, with the reason, when it can't be quoted
    if (q.lines.length && !textContent(target.html).includes(q.lines.join("\n"))) {
      throw new Error(`quotes ${q.name} with a selection that isn't in it, word for word`);
    }
    const block = `<blockquote class="kino-quote" data-note="${escapeAttr(target.slug)}">${q.lines.length ? `\n${q.lines.map((l) => `<p>${escapeAttr(l)}</p>`).join("\n")}\n` : ""}</blockquote>`;
    html = html.replace(`<p>KINOQUOTE${i}</p>`, block);
  }
  // An answer to one of the PI's takes is a stub of it (§10.6). kinocomputing
  // reads a trailing source line as a stub target, the way it reads a Subset
  // share; only a take on kinocomputing itself can be answered.
  if (answers) {
    let target;
    try {
      target = new URL(answers);
    } catch {
      throw new Error(`answers ${answers}, which isn't a URL`);
    }
    if (target.origin !== new URL(origin).origin) throw new Error(`answers ${answers}, which isn't a note on kinocomputing`);
    html = `${html}\n<p class="source"><a href="${escapeAttr(target.href)}">${escapeAttr(target.href)}</a></p>`;
  }

  try {
    htmlToMarkdown(html, { quote: () => "0".repeat(26) });
  } catch (error) {
    throw new Error(`won't convert to a blyg item: ${error.message}`);
  }

  const values = {
    slug: name,
    description: escapeAttr(describe(html)),
    url: `${origin}notes/${name}`,
    path: `/notes/${name}`,
    index_path: "/notes/",
    datetime_iso: at,
    datetime: at,
    content: html,
    ...(pin ? { pin: "true" } : {}),
    ...(changeNote ? { change_note: escapeAttr(String(changeNote).replace(/\s+/g, " ").trim()) } : {}),
  };
  const template = readFileSync(join(kino, "notes", "_note.html"), "utf8");
  const page = template
    .replace(/<!-- if:(\w+) -->([\s\S]*?)<!-- \/if:\1 -->\n?/g, (whole, key, inner) => (Object.hasOwn(values, key) ? inner : ""))
    .replace(/\{\{(\w+)\}\}/g, (whole, key) => (Object.hasOwn(values, key) ? values[key] : ""))
    .replace("</head>", `    <meta name="blyg:generated" content="${escapeAttr(model)}">\n${claim ? "" : '    <meta name="blyg:kind" content="thread">\n'}</head>`);
  return page;
}
