// Images in the house style (config/house/STYLE.md):
//
//   node tools/figure.mjs sketch  plate.json  outbox/<note>/plate-wall.svg
//   node tools/figure.mjs diagram flow.mmd    outbox/<note>/fig-flow.svg
//   node tools/figure.mjs check   outbox/<note>/fig-chart.svg
//   node tools/figure.mjs look    outbox/<note>/plate-wall.svg /tmp/look.png
//
// `look` draws an SVG as a PNG, on the page's colour and at a phone's width
// and a desktop's, side by side: open the PNG and judge it as a reader would.
//
// A sketch is drawn from a small JSON description of shapes, with rough.js's
// pen wobble; a diagram is Mermaid, drawn by pele in the house theme; a chart
// comes from matplotlib with config/house/house.mplstyle. `check` applies
// the house rules — the publisher (settle.mjs) applies the same ones, and
// refuses an image that fails them.

import { readFileSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import rough from "roughjs/bundled/rough.esm.js";
import { render as pele } from "pele";
import { LAB } from "./lib.mjs";
import { Resvg } from "@resvg/resvg-js";

export const HOUSE = JSON.parse(readFileSync(join(LAB, "config/house/tokens.json"), "utf8"));
const C = HOUSE.colour;
const colour = (name, fallback = C.ink) => (name == null ? fallback : name === "none" ? "none" : C[name] ?? (/^#[0-9a-f]{6}$/i.test(name) ? name : fallback));
const escape = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// The organic shapes (STYLE.md, "Plates"): forms that look grown and moving
// rather than ruled. Each comes down to a smooth path for rough.js to draw.

/** A small seeded random, so a sketch draws the same every time. */
function seeded(seed) {
  let a = (seed * 2654435761) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f1 = (v) => Math.round(v * 10) / 10;

/** Points joined by a smooth curve through each (Catmull-Rom as cubic Béziers); closed or open. */
function smooth(points, closed) {
  const n = points.length;
  const at = (i) => (closed ? points[(i + n) % n] : points[Math.max(0, Math.min(n - 1, i))]);
  const last = closed ? n : n - 1;
  let d = `M${f1(points[0][0])} ${f1(points[0][1])}`;
  for (let i = 0; i < last; i += 1) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return closed ? `${d}Z` : d;
}

/** A blob's outline: a circle pushed in and out at a few lobes, and stretched along its heading. */
function blobPoints({ x, y, r, lobes = 5, wobble = 0.22, stretch = 1, angle = 0 }, random) {
  const phases = Array.from({ length: 3 }, () => random() * Math.PI * 2);
  const k = Math.max(12, lobes * 4);
  return Array.from({ length: k }, (_, i) => {
    const t = (i / k) * Math.PI * 2;
    const swell = 1 + wobble * (0.6 * Math.sin(lobes * t + phases[0]) + 0.3 * Math.sin((lobes + 2) * t + phases[1]) + 0.1 * Math.sin(2 * t + phases[2]));
    const [u, v] = [Math.cos(t) * r * swell * stretch, Math.sin(t) * r * swell];
    return [x + u * Math.cos(angle) - v * Math.sin(angle), y + u * Math.sin(angle) + v * Math.cos(angle)];
  });
}

/** The organic elements, each as plain elements the sketch already draws. */
function organic(e, random) {
  if (e.type === "blob") {
    const outline = blobPoints(e, random);
    const body = { ...e, type: "path", d: smooth(outline, true), organic: true };
    if (!e.cilia) return [body];
    // Cilia: fine hairs off the outline, all swept the same way, as if the
    // body were swimming against its heading.
    const sweep = (e.angle ?? 0) + Math.PI;
    const step = Math.max(1, Math.floor(outline.length / e.cilia));
    const hairs = outline.filter((_, i) => i % step === 0).map(([px, py]) => {
      const out = Math.atan2(py - e.y, px - e.x);
      const len = e.r * (0.25 + 0.15 * random());
      const mid = [px + Math.cos(out) * len * 0.6, py + Math.sin(out) * len * 0.6];
      const tip = [mid[0] + Math.cos((out + sweep) / 2) * len * 0.5, mid[1] + Math.sin((out + sweep) / 2) * len * 0.5];
      return { type: "path", d: smooth([[px, py], mid, tip], false), stroke: e.stroke, weight: "fine", fill: "none", organic: true };
    });
    return [body, ...hairs];
  }
  if (e.type === "spiral") {
    const turns = e.turns ?? 2.5;
    const k = Math.round(turns * 24);
    const pts = Array.from({ length: k + 1 }, (_, i) => {
      const t = (i / k) * turns * Math.PI * 2;
      const rr = (e.r * i) / k;
      return [e.x + rr * Math.cos(t + (e.angle ?? 0)), e.y + rr * Math.sin(t + (e.angle ?? 0))];
    });
    return [{ ...e, type: "path", d: smooth(pts, false), fill: "none", organic: true }];
  }
  if (e.type === "flow") {
    // Streamlines across a box, bending round an obstacle (a circle at
    // `around`) the way water parts round a stone, with a slow swell.
    const { x, y, w, h, lines = 7, swell = 6, around = null } = e;
    const out = [];
    for (let l = 0; l < lines; l += 1) {
      const y0 = y + (h * (l + 0.5)) / lines;
      const pts = Array.from({ length: 25 }, (_, i) => {
        const px = x + (w * i) / 24;
        let py = y0 + swell * Math.sin((px / w) * Math.PI * 2 + l * 0.7);
        if (around) {
          const dx = px - around.x;
          const dy = y0 - around.y;
          const push = (around.r * around.r * 1.6) / (dx * dx + dy * dy + around.r * around.r);
          py += Math.sign(dy || 1) * around.r * push * 0.9;
        }
        return [px, py];
      });
      out.push({ ...e, type: "path", d: smooth(pts, false), fill: "none", weight: e.weight ?? "fine", organic: true });
    }
    return out;
  }
  if (e.type === "trail") {
    // A body in motion: the body where it is now, at the path's end, with
    // fading echoes of where it was, and the faint line it came along.
    const pts = e.points;
    const echoes = e.echoes ?? 4;
    const size = e.size ?? 26;
    const at = (f) => {
      const i = Math.min(pts.length - 2, Math.floor(f * (pts.length - 1)));
      const u = f * (pts.length - 1) - i;
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u];
    };
    const [ex, ey] = pts.at(-1);
    const [px, py] = pts.at(-2);
    const angle = Math.atan2(ey - py, ex - px);
    const out = [{ type: "path", d: smooth(pts, false), stroke: e.path ?? "grey", weight: "fine", fill: "none", opacity: 0.6, organic: true }];
    for (let k = 0; k < echoes; k += 1) {
      const f = (k + 1) / (echoes + 1);
      const [cx, cy] = at(f * 0.92);
      out.push({ type: "path", d: smooth(blobPoints({ x: cx, y: cy, r: (size / 2) * (0.55 + 0.4 * f), lobes: e.lobes ?? 4, wobble: 0.18, stretch: 1.25, angle }, random), true),
        stroke: e.echo ?? "grey", weight: "fine", fill: "none", opacity: 0.25 + 0.5 * f, organic: true });
    }
    out.push({ type: "path", d: smooth(blobPoints({ x: ex, y: ey, r: size / 2, lobes: e.lobes ?? 4, wobble: 0.18, stretch: 1.3, angle }, random), true),
      stroke: e.stroke ?? "ink", fill: e.fill ?? "vermilion", fillStyle: e.fillStyle ?? "solid", weight: e.weight, organic: true });
    return out;
  }
  return [e];
}

/**
 * A sketch: { width (640), height, seed, roughness, elements: [...] }, each
 * element one of rect {x,y,w,h}, circle {x,y,d}, ellipse {x,y,w,h}, line and
 * arrow {x1,y1,x2,y2}, polygon and curve {points: [[x,y], …]}, path {d}, or
 * text {x,y,text,size,anchor,italic}; or one of the organic shapes: blob
 * {x,y,r,lobes,wobble,stretch,angle}, a grown, lumpy body; trail {points,
 * size,echoes}, a body moving along a path with fading echoes behind it;
 * flow {x,y,w,h,lines,swell,around:{x,y,r}}, streamlines parting round an
 * obstacle; spiral {x,y,r,turns}. Each takes `stroke` and `fill` as token
 * names (ink, blue, vermilion, grey, paper-light, none), `fillStyle`
 * (hachure, solid, cross-hatch, dots), `weight` (pen, fine, bold) and
 * `opacity` (0 to 1).
 */
export function sketch(spec) {
  const width = spec.width ?? HOUSE.canvas.width;
  const height = spec.height ?? 400;
  const gen = rough.generator();
  const base = { roughness: spec.roughness ?? HOUSE.rough.roughness, bowing: HOUSE.rough.bowing, seed: spec.seed ?? 1 };
  const out = [];
  const random = seeded(spec.seed ?? 1);
  const elements = (spec.elements ?? []).flatMap((e) => organic(e, random));
  for (const [i, e] of elements.entries()) {
    const mark = out.length;
    const options = {
      ...base,
      seed: base.seed + i,
      // The organic shapes are drawn with a steadier hand: grown, not scribbled.
      ...(e.organic ? { roughness: Math.min(base.roughness, e.roughness ?? 0.4), bowing: 0.4, disableMultiStroke: (e.weight ?? "pen") === "fine" } : {}),
      stroke: colour(e.stroke),
      strokeWidth: HOUSE.stroke[e.weight ?? "pen"] ?? HOUSE.stroke.pen,
      ...(e.fill && e.fill !== "none" ? { fill: colour(e.fill), fillStyle: e.fillStyle ?? "hachure", fillWeight: 1, hachureGap: e.hachureGap ?? 8 } : {}),
    };
    if (e.type === "text") {
      const size = Math.max(e.size ?? HOUSE.canvas.min_label, HOUSE.canvas.min_label);
      out.push(`<text x="${e.x}" y="${e.y}" font-size="${size}" fill="${colour(e.colour ?? e.stroke)}" text-anchor="${e.anchor ?? "start"}"${e.italic ? ' font-style="italic"' : ""}>${escape(e.text)}</text>`);
      continue;
    }
    let drawable;
    if (e.type === "rect") drawable = gen.rectangle(e.x, e.y, e.w, e.h, options);
    else if (e.type === "circle") drawable = gen.circle(e.x, e.y, e.d, options);
    else if (e.type === "ellipse") drawable = gen.ellipse(e.x, e.y, e.w, e.h, options);
    else if (e.type === "line" || e.type === "arrow") drawable = gen.line(e.x1, e.y1, e.x2, e.y2, options);
    else if (e.type === "polygon") drawable = gen.polygon(e.points, options);
    else if (e.type === "curve") drawable = gen.curve(e.points, options);
    else if (e.type === "path") drawable = gen.path(e.d, options);
    else throw new Error(`element ${i}: no such shape as ${e.type}`);
    for (const p of gen.toPaths(drawable)) {
      out.push(`<path d="${p.d}" stroke="${p.stroke}" stroke-width="${p.strokeWidth}" fill="${p.fill ?? "none"}" stroke-linecap="round" stroke-linejoin="round"/>`);
    }
    if (e.type === "arrow") {
      const angle = Math.atan2(e.y2 - e.y1, e.x2 - e.x1);
      const head = (a) => [e.x2 - 14 * Math.cos(angle + a), e.y2 - 14 * Math.sin(angle + a)];
      for (const p of gen.toPaths(gen.linearPath([head(0.45), [e.x2, e.y2], head(-0.45)], options))) {
        out.push(`<path d="${p.d}" stroke="${p.stroke}" stroke-width="${p.strokeWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);
      }
    }
    if (e.opacity != null && e.opacity < 1) out.splice(mark, 0, `<g opacity="${Math.max(0, e.opacity)}">`), out.push("</g>");
  }
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" font-family="${escape(HOUSE.font.sans)}">`,
    ...out,
    "</svg>",
    "",
  ].join("\n");
}

/** A Mermaid diagram, drawn by pele with the house colours and face baked in. */
export function diagram(mermaid) {
  // Large enough text, and narrow enough to turn a long flow top-to-bottom
  // rather than shrink it past reading on a phone.
  const { svg } = pele(mermaid, { fontSize: 22, maxWidth: 480, autoDirection: true });
  const theme = {
    bg: C.paper, fg: C.ink, muted: C.grey, line: C.ink, surface: C["paper-light"],
    "surface-alt": C["paper-light"], border: C.grey, accent: C.blue, font: HOUSE.font.sans,
    "font-mono": "ui-monospace, Menlo, monospace", radius: "3px",
  };
  // Every var(--pele-x, fallback) becomes the house's value, so the drawing
  // needs no stylesheet and carries no colour of its own.
  return `${svg.replace(/var\(--pele-([a-z0-9-]+),\s*([^()]*(?:\([^()]*\))?[^()]*)\)/g, (whole, name, fallback) => {
    if (/^series-\d$/.test(name)) return HOUSE.series[(Number(name.slice(7)) - 1) % HOUSE.series.length];
    return theme[name] ?? fallback;
  })}\n`;
}

const HEX = /#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi;
const PHONE = 343; // a phone's column, in CSS pixels (390 less the gutters)
const norm = (hex) => (hex.length === 4 ? `#${[...hex.slice(1)].map((c) => c + c).join("")}` : hex).toLowerCase();

/** PNG width and height, from its header. */
function pngSize(bytes) {
  if (bytes.length < 24 || bytes.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

/** A filled rectangle under most of the drawing: a background. */
function backgroundIn(text, size) {
  for (const [rect] of text.matchAll(/<rect\b[^>]*>/gi)) {
    const attr = (name) => rect.match(new RegExp(`\\s${name}="([^"]*)"`, "i"))?.[1];
    const fill = (attr("fill") ?? rect.match(/fill:\s*([^;"]+)/i)?.[1] ?? "#000").trim().toLowerCase();
    if (fill === "none" || fill === "transparent" || attr("fill-opacity") === "0") continue;
    const len = (v, whole) => (v == null ? 0 : v.endsWith("%") ? (parseFloat(v) / 100) * whole : parseFloat(v));
    if (len(attr("width"), size.width) * len(attr("height"), size.height) >= 0.8 * size.width * size.height) return true;
  }
  return false;
}

/** An SVG's drawing size, from its viewBox or its width and height. */
export function svgSize(text) {
  const box = text.match(/<svg\b[^>]*\sviewBox="\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)\s*"/i);
  if (box) return { width: Number(box[1]), height: Number(box[2]) };
  const w = text.match(/<svg\b[^>]*\swidth="([\d.]+)/i)?.[1];
  const h = text.match(/<svg\b[^>]*\sheight="([\d.]+)/i)?.[1];
  return w && h ? { width: Number(w), height: Number(h) } : null;
}

/**
 * The house rules for one image file. Returns { kind, width, height, problems }:
 * no problems means it may be published. SVG: safe (no script, no event
 * handlers, no foreign content, nothing fetched from elsewhere), house
 * colours only, no vermilion text, no text smaller than 20 units on a 640
 * canvas (in proportion), a size; PNG: at most 1600 pixels across.
 */
export function checkImage(bytes, name) {
  const ext = extname(name).toLowerCase();
  const problems = [];
  const kind = name.replace(/^.*\//, "").startsWith("plate-") ? "plate" : "figure";
  if (ext === ".png") {
    const size = pngSize(bytes);
    if (!size) return { kind, problems: ["isn't a PNG"] };
    if (bytes.length > 800_000) problems.push(`is ${Math.round(bytes.length / 1000)} KB; a PNG is at most 800 KB`);
    if (size.width > 1600) problems.push(`is ${size.width} pixels across; at most 1600`);
    // On the dark page an image is turned over (STYLE.md, "Colour"), and an
    // opaque ground would become a slab: a PNG needs an alpha channel.
    const colourType = bytes[25];
    if (colourType !== 4 && colourType !== 6 && !bytes.includes(Buffer.from("tRNS"))) problems.push("has no transparency: save it on a transparent ground, so the dark page shows through");
    return { kind, ...size, problems };
  }
  if (ext !== ".svg") return { kind, problems: [`is ${ext || "untyped"}; images are SVG, or PNG for what can't be drawn`] };
  const text = bytes.toString("utf8");
  if (bytes.length > 300_000) problems.push(`is ${Math.round(bytes.length / 1000)} KB; an SVG is at most 300 KB`);
  if (/<script\b/i.test(text)) problems.push("has a script");
  if (/\son[a-z]+\s*=/i.test(text)) problems.push("has an event handler");
  if (/<foreignObject\b/i.test(text)) problems.push("has foreign content");
  if (/<image\b/i.test(text)) problems.push("embeds another image");
  if (/(?:href|src)\s*=\s*["'](?!#)/i.test(text) || /url\(\s*["']?(?!#)/i.test(text) || /@import/i.test(text)) problems.push("fetches something from elsewhere");
  const size = svgSize(text);
  if (!size) problems.push("has no size (a viewBox, or a width and a height)");
  if (size && backgroundIn(text, size)) problems.push("has a background: draw on nothing, so on the dark page it doesn't become a slab of light (STYLE.md, \"Colour\")");
  const allowed = new Set(Object.values(C).map(norm));
  const strays = [...new Set((text.match(HEX) ?? []).map(norm))].filter((hex) => !allowed.has(hex) && hex !== "#ffffff" && hex !== "#000000");
  if (strays.length) problems.push(`uses colours outside the house palette: ${strays.join(", ")}`);
  if ((text.match(HEX) ?? []).some((hex) => norm(hex) === "#000000" || norm(hex) === "#ffffff") && !/fill(?:-opacity)?="?(?:none|0)/.test("")) {
    // Pure black and white creep in from tools' defaults; the house ink and paper replace them.
    if ((text.match(/#000000\b|#000\b/gi) ?? []).length) problems.push("uses pure black: use the house ink, #1a1a1a");
  }
  for (const t of text.matchAll(/<text\b([^>]*)>/gi)) {
    if (new RegExp(C.vermilion, "i").test(t[1])) problems.push("sets text in vermilion: it's for marks and lines, never text");
  }
  if (size) {
    // On a phone the column is about 343 pixels: a wider drawing shrinks to
    // fit, a narrower one shows at its own size. The smallest text must
    // still come out at what 20 units on a 640 canvas does (about 11 px).
    const sizes = [...text.matchAll(/font-size(?:="|:\s*)([\d.]+)(?:px)?/gi), ...text.matchAll(/font:\s*(?:italic\s+|bold\s+|\d{3}\s+)*([\d.]+)px/gi)].map((m) => Number(m[1]));
    const least = Math.min(...sizes);
    const onPhone = (units) => units * Math.min(1, PHONE / size.width);
    const needed = onPhone.call(null, 0) + (HOUSE.canvas.min_label * PHONE) / HOUSE.canvas.width;
    if (sizes.length && onPhone(least) < needed - 0.01) {
      problems.push(`has text at ${least} on a ${size.width}-wide drawing, ${onPhone(least).toFixed(1)} px on a phone: at least ${Math.ceil((needed * Math.max(size.width, PHONE)) / PHONE)}, or it can't be read`);
    }
  }
  return { kind, ...(size ?? {}), problems: [...new Set(problems)] };
}

/**
 * An SVG as a PNG, 1280 pixels across (a desktop at 2×), as it will look on
 * both of the site's pages: on the light one, and below it on the dark one,
 * turned over the way the site's stylesheet turns it (invert, then rotate
 * the hues half way round).
 */
export function look(svgText) {
  const size = svgSize(svgText) ?? { width: 640, height: 400 };
  const inner = svgText.replace(/^[\s\S]*?<svg\b[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  const W = size.width + 48;
  const H = size.height + 48;
  const framed = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-24 -24 ${W} ${2 * H}" width="${W}" height="${2 * H}">`
    + `<defs><filter id="dark" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="-1 0 0 0 1 0 -1 0 0 1 0 0 -1 0 1 0 0 0 1 0"/><feColorMatrix type="hueRotate" values="180"/></filter></defs>`
    + `<rect x="-24" y="-24" width="${W}" height="${H}" fill="${C.paper}"/>`
    + `<rect x="-24" y="${H - 24}" width="${W}" height="${H}" fill="${HOUSE.dark?.paper ?? "#0f1a28"}"/>`
    + `<svg x="0" y="0" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}">${inner}</svg>`
    + `<g filter="url(#dark)"><svg x="0" y="${H}" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}">${inner}</svg></g>`
    + "</svg>";
  return new Resvg(framed, { fitTo: { mode: "width", value: 1280 }, font: { loadSystemFonts: true, defaultFontFamily: "DejaVu Sans" } }).render().asPng();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [command, input, output] = process.argv.slice(2);
  try {
    if (command === "sketch" && input && output) writeFileSync(output, sketch(JSON.parse(readFileSync(input, "utf8"))));
    else if (command === "diagram" && input && output) writeFileSync(output, diagram(readFileSync(input, "utf8")));
    else if (command === "look" && input && output) {
      writeFileSync(output, look(readFileSync(input, "utf8")));
      console.log(`${output}: open it and look, on the light page above and the dark one below — is it clear, is it beautiful, does it say one thing?`);
      process.exit(0);
    } else if (command === "check" && input) {
      const { kind, width, height, problems } = checkImage(readFileSync(input), input);
      console.log(problems.length ? `${input}: ${problems.join("; ")}` : `${input}: a ${kind}, ${width}×${height}, in the house style`);
      process.exit(problems.length ? 1 : 0);
    } else {
      console.error("usage: node tools/figure.mjs sketch <spec.json> <out.svg> | diagram <in.mmd> <out.svg> | check <image> | look <image.svg> <out.png>");
      process.exit(2);
    }
    if (command !== "check") {
      const { problems } = checkImage(readFileSync(output), output);
      console.log(problems.length ? `${output}: written, but ${problems.join("; ")}` : `${output}: written, in the house style`);
    }
  } catch (error) {
    console.error(`figure: ${error.message}`);
    process.exit(1);
  }
}
