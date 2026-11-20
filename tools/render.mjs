// An outbox note → a kinocomputing note page, or a refusal saying why.
//
// The page is written the way motes writes one: kinocomputing's own
// notes/_note.html, filled, with each optional section kept only when there is
// a value for it. Two things are added for the lab: the §5.7 disclosure meta
// (`blyg:generated`, naming the model), which kinocomputing's build turns into
// provenance and a visible line, and nothing else.
//
// The gate is kinocomputing's own converter. A note whose HTML it can't turn
// back into markdown would publish with no blyg item — so it is refused here,
// before it reaches the site, with the converter's reason.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { marked } from "marked";

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
export async function renderNote({ markdown, name, pin = false, changeNote = null, answers = null, model, at, kino, origin }) {
  const refused = refusals(markdown);
  if (refused.length) throw new Error(`uses ${refused.join(" and ")}, which the blyg can't carry`);
  let html = marked.parse(markdown.trim()).trim();
  if (!html) throw new Error("is empty");
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

  const { htmlToMarkdown } = await import(pathToFileURL(join(kino, "tools", "blyg.mjs")).href);
  try {
    htmlToMarkdown(html);
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
    .replace("</head>", `    <meta name="blyg:generated" content="${escapeAttr(model)}">\n</head>`);
  return page;
}
