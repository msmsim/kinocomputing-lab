// An outbox note → a kinocomputing note page, or a refusal saying why.
//
// The page is written the way motes writes one: kinocomputing's own
// notes/_note.html, filled, with each optional section kept only when there is
// a value for it. Added for the lab: the §5.7 disclosure meta
// (`blyg:generated`, naming the model), which kinocomputing's build turns into
// provenance; and the item's kind (P21). A claim, and a paradigm's entry on
// the tracker, is a fragment — short, quotable, a leaf. Everything else the
// lab writes is a thread, and a thread can quote.
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

// The lab's own ids — questions, claims, experiments, analyses. A reader on
// kinocomputing can't see the lab, so a note that leans on them doesn't make
// sense where it is published (AGENT.md, "Writing for the site"). Addresses
// are left out of the check: a link may point into the lab's repository.
// Experiment and analysis ids are matched in lower case only, as the lab
// writes them (e002, a001): "A100" and "E300" are the names of chips.
const LAB_ID = /\b(?:[qcQC]-\d{3}|[ea]\d{3})\b/;

/** The first lab id a reader would see in the note's text, if any. */
export function labIdIn(html) {
  const text = html.replace(/<[^>]+>/g, " ").replace(/https?:\/\/\S+/g, " ");
  return text.match(LAB_ID)?.[0] ?? null;
}

const escapeAttr = (text) => text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Mathematics: TeX between dollars, as kinocomputing reads it (its
// tools/maths.mjs, pandoc's tex_math_dollars): `$$…$$` displayed; `$…$`
// inline when the opening dollar is followed by a non-space and the closing
// one follows a non-space and isn't followed by a digit, so "$5 and $10"
// stays prices. Taken out of the markdown before it is parsed, so a
// formula's underscores and asterisks can't become emphasis, and drawn as
// MathML by kinocomputing's own maths.mjs, so the two can't disagree.
const MATH = /(?<!\\)\$\$([\s\S]+?)\$\$|(?<![\\$])\$(?=[^\s$])((?:[^$\n\\]|\\.)*?[^\s\\])\$(?!\d)/g;

export function withMathsSet(markdown, draw) {
  const drawn = [];
  // Code — fenced blocks and inline spans — is left as written.
  const out = markdown.split(/(```[\s\S]*?```|`[^`\n]+`)/).map((part, i) => (i % 2 ? part : part.replace(MATH, (whole, display, inline) => {
    const tex = (display ?? inline).trim();
    drawn.push(draw(tex, display != null)); // throws on TeX it can't read: the note is refused with the reason
    return `KINOMATH${drawn.length - 1}X`;
  }))).join("");
  return { markdown: out, put: (html) => html.replace(/KINOMATH(\d+)X/g, (m, i) => drawn[Number(i)]) };
}

/** The opening paragraph as a description, cut at a word near 160 characters. */
function describe(html) {
  const paragraphs = [...html.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1]);
  // Not the title (all bold) or a byline (all italic): the first real paragraph.
  const opening = paragraphs.find((p) => !/^<(strong|em)>[\s\S]*<\/\1>$/.test(p.trim())) ?? paragraphs[0] ?? "";
  const text = opening.replace(/<annotation\b[^>]*>[\s\S]*?<\/annotation>/g, "").replace(/<[^>]+>/g, "").replace(/&#39;/g, "’").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  if (text.length <= 160) return text;
  const cut = text.slice(0, 160);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 100)).replace(/[\s.,;:—–-]+$/, "")}…`;
}

/**
 * Renders one note. `kino` is the kinocomputing checkout (its template and
 * converter are the contract). Throws an Error whose message is the refusal.
 */
/**
 * A voice's byline, at the foot of the note: the note opens with what it says,
 * so its preview in the stream and in feeds is its lead, not who wrote it. The
 * voices are AI personas (voices/README.md); the byline says so and links to
 * where the site introduces them.
 */
export function withByline(markdown, voice, origin) {
  return `${markdown.trimEnd()}\n\n_By [${voice}](${origin}about), one of the lab's AI voices_\n`;
}

/**
 * Whether a note's first paragraph after its title is a lead: prose, not a
 * line that only labels (wholly bold, wholly italic) and not a list, a quote
 * or a heading. Previews and descriptions are made from it.
 */
export function leadProblem(html) {
  const blocks = html.match(/<(p|ul|ol|blockquote|h\d|pre|table)\b[^>]*>[\s\S]*?<\/\1>/g) ?? [];
  const isTitle = (b) => /^<p><strong>[^<]*<\/strong><\/p>$/.test(b.trim());
  const lead = isTitle(blocks[0] ?? "") ? blocks[1] : blocks[0];
  if (!lead) return "has no first paragraph";
  if (!/^<p\b/.test(lead)) return "opens with a list, quote or heading rather than a paragraph";
  const inner = lead.replace(/^<p[^>]*>|<\/p>$/g, "").trim();
  if (/^<(strong|em)>[\s\S]*<\/\1>[\s.:]*$/.test(inner) && !/<\/(strong|em)>[\s\S]*<(strong|em)>/.test(inner)) return "opens with a label (a line wholly in bold or italics) rather than a paragraph";
  return null;
}

// The site's sections a note can ask for (kinocomputing's build lists them).
// A paradigm entry is the tracker's and a brief the briefs', whatever it asks.
export const SECTIONS = ["lab", "tracker", "audits"];

// Images (config/house/STYLE.md): each on a line of its own, as
// `![alt text](file.svg "Caption.")`, the file beside the note. `image`, from
// settle, checks the file against the house rules and says where it will
// live: { url, width, height, kind } (kind: plate or figure). A plate opens
// a piece and may break out of the column; a figure sits in it.
const LONE_IMAGE = /^!\[([^\]]*)\]\(\s*([^\s)]+)(?:\s+"([^"]*)")?\s*\)\s*$/;
const escapeHtml = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function withFigures(markdown, image, { most = 3 } = {}) {
  const drawn = [];
  const lines = markdown.split("\n");
  let fenced = false;
  const out = lines.map((line) => {
    if (/^```/.test(line.trim())) fenced = !fenced;
    if (fenced) return line;
    const lone = line.trim().match(LONE_IMAGE);
    if (!lone) {
      if (/!\[[^\]]*\]\(/.test(line)) throw new Error("has an image inside a paragraph; an image stands on a line of its own");
      return line;
    }
    const [, alt, src, caption] = lone;
    if (alt.trim().length < 12) throw new Error(`has an image (${src}) without alt text: say what it shows, for a reader who can't see it`);
    if (!caption?.trim()) throw new Error(`has an image (${src}) without a caption: say what to see, in its title`);
    const placed = image(src);
    drawn.push(`<figure class="${placed.kind}"><img src="${escapeHtml(placed.url)}" alt="${escapeHtml(alt.trim())}" width="${Math.round(placed.width)}" height="${Math.round(placed.height)}" loading="lazy" decoding="async"><figcaption>${escapeHtml(caption.trim())}</figcaption></figure>`);
    return `KINOFIG${drawn.length - 1}X`;
  });
  if (drawn.length > most) throw new Error(`has ${drawn.length} images; a note has at most ${most}`);
  const plates = drawn.filter((f) => f.startsWith('<figure class="plate"')).length;
  if (plates > Math.max(1, most - 2)) throw new Error(`has ${plates} plates; one opens a piece, more only in a long one`);
  return { markdown: out.join("\n"), put: (html) => html.replace(/<p>KINOFIG(\d+)X<\/p>/g, (m, i) => drawn[Number(i)]), count: drawn.length };
}

export async function renderNote({ markdown, name, pin = false, changeNote = null, answers = null, kind = "notebook", voice = null, section = null,
  maxClaim = 1000, maxParadigm = 1500, quote = null, image = null, model, at, kino, origin }) {
  const refused = refusals(markdown);
  if (refused.length) throw new Error(`uses ${refused.join(" and ")}, which the blyg can't carry`);
  const extracted = extractQuotes(markdown.trim());
  const claim = kind === "claim";
  // A paradigm's entry on the tracker is a fragment too: short, quotable, a
  // leaf, so the tracker can quote it and notice when it has moved on.
  const fragment = claim || kind === "paradigm";
  if (voice && (fragment || kind === "brief")) throw new Error(`is a ${kind} in a voice; claims, paradigm entries and the brief are the lab's record, in its own voice`);
  if (voice) extracted.markdown = withByline(extracted.markdown, voice, origin);
  if (fragment && extracted.quotes.length) throw new Error(`is a ${kind}, and a ${kind} can't quote; quote it from a thread`);
  if (claim && markdown.trim().length > maxClaim) throw new Error(`is a claim of ${markdown.trim().length} characters; a claim is at most ${maxClaim}`);
  if (section && !SECTIONS.includes(section)) throw new Error(`asks for the section "${section}", which the site doesn't have; use ${SECTIONS.join(", ")}`);
  const shelf = kind === "paradigm" ? "tracker" : kind === "brief" ? "briefs" : section ?? "lab";
  if (kind === "paradigm" && markdown.trim().length > maxParadigm) throw new Error(`is a paradigm entry of ${markdown.trim().length} characters; an entry is at most ${maxParadigm}`);
  const { mathml } = await import(pathToFileURL(join(kino, "tools", "maths.mjs")).href);
  let maths;
  try {
    maths = withMathsSet(extracted.markdown, mathml);
  } catch (error) {
    throw new Error(`has TeX the site can't draw: ${error.message.split("\n")[0]}`);
  }
  // Figures before the markdown is parsed; a long piece (2,500 words and up)
  // may carry more of them.
  const words = maths.markdown.split(/\s+/).length;
  const figures = withFigures(maths.markdown, image ?? ((src) => { throw new Error(`has an image (${src}), and nothing here can place images`); }), { most: words >= 2500 ? 5 : 3 });
  if (figures.count && fragment) throw new Error(`is a ${kind} with an image; images go in notes and the brief, not claims or paradigm entries`);
  if (kind === "brief" && figures.count > 1) throw new Error(`is the brief with ${figures.count} images; it has one, the day's picture`);
  let html = maths.put(figures.put(marked.parse(figures.markdown).trim()));
  if (!html) throw new Error("is empty");
  // Every note's first paragraph is its preview, in the stream, in feeds and
  // in search results (AGENT.md, "Writing for the site"). The brief's is
  // settle's to make right.
  if (kind !== "brief") {
    const problem = leadProblem(html);
    if (problem) throw new Error(`${problem}; the first paragraph after the title is the note's preview, so it must say what the note found`);
  }
  const id = labIdIn(html);
  if (id) throw new Error(`says "${id}", which readers on kinocomputing can't look up; say what it is instead`);
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
    .replace("</head>", `    <meta name="blyg:generated" content="${escapeAttr(model)}">\n${fragment ? "" : '    <meta name="blyg:kind" content="thread">\n'}    <meta name="kino:section" content="${shelf}">\n</head>`);
  return page;
}
