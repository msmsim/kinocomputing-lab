// Shared by the lab's tests (test/*.test.mjs): the test lab every whole-night
// test builds, and the fixtures several files use. Node runs the test files
// side by side, one process each, so a slow file doesn't hold up the rest.

import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync, cpSync, existsSync, symlinkSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { allowance, frontMatter, KINO, LAB, regionFor, rotation, sundayPlan } from "../tools/lib.mjs";
import { labChanges, siteChanges } from "../tools/week.mjs";
import * as sources from "../tools/sources.mjs";
import { checkImage, sketch } from "../tools/figure.mjs";
import { takeSteers } from "../tools/steers.mjs";
import { renderNote } from "../tools/render.mjs";
import { arxivQuery, exaAgent, exaBody, exaLeft, parseArxiv, parseExa, parseOpenAlex, search, unInvert } from "../tools/search.mjs";
import { replicateAll } from "../tools/replicate.mjs";

export const BUDGET = { daily_usd: 1.5, bank_cap_usd: 10, light_run_max_usd: 1.5, deep_run_threshold_usd: 6, deep_run_max_usd: 6, min_run_usd: 0.1 };

export const KINO_ORIGIN = "https://www.kinocomputing.com/";

export const EXPERIMENT = (threshold) => `import json, os, random
seed = int(os.environ.get("SEED", "1"))
random.seed(seed)
value = random.random()
json.dump({"metric": "draw", "value": round(value, 4), "seed": seed, "killed": value < ${threshold}}, open(os.environ.get("RESULT_PATH", "result.json"), "w"))
`;

export const ARGS = { name: "lab-2026-11-21-test", model: "claude-haiku-5-5", at: "2026-11-21T03:00:00Z", kino: KINO, origin: KINO_ORIGIN };

export function makeWorld() {
  const root = mkdtempSync(join(tmpdir(), "lab-world-"));
  const lab = join(root, "lab");
  const kino = join(root, "kino");
  for (const path of ["tools", "config", "voices", "AGENT.md", "CHARTER.md", "package.json"]) cpSync(join(LAB, path), join(lab, path), { recursive: true });
  // Linked, not copied: the tools only read their packages.
  symlinkSync(join(LAB, "node_modules"), join(lab, "node_modules"), "dir");
  for (const dir of ["state/questions", "outbox", "published", "journal", "experiments"]) mkdirSync(join(lab, dir), { recursive: true });
  writeFileSync(join(lab, "state/questions/q-001-test.md"), "---\nid: q-001\ntitle: A test question\nkind: experiment\nstatus: open\npriority: 1\n---\n\nWhy.\n");
  // As in the real lab: folders beside the notes in published/, an earlier
  // brief's picture and a note's own figures (with a folder of their own).
  // Every tool that reads published/ meets them, the week in review included.
  mkdirSync(join(lab, "published/lab-2026-11-01-brief"), { recursive: true });
  writeFileSync(join(lab, "published/lab-2026-11-01-brief/picture.json"), JSON.stringify({ file: "plate-old.svg", alt: "An older day's plate.", caption: "Old." }));
  writeFileSync(join(lab, "published/lab-2026-11-01-brief/plate-old.svg"), "<svg xmlns=\"http://www.w3.org/2000/svg\"/>\n");
  mkdirSync(join(lab, "published/lab-2026-11-25-figures/data"), { recursive: true });
  writeFileSync(join(lab, "published/lab-2026-11-25-figures/data/points.csv"), "x,y\n1,2\n");
  for (const path of ["tools", "notes/_note.html", "notes/_stream.html", "note.css", "favicon.svg", "favicon.ico", "apple-touch-icon.png", "kinocomputing-basic-og.jpg", "fonts"]) {
    if (existsSync(join(KINO, path))) cpSync(join(KINO, path), join(kino, path), { recursive: true });
  }
  mkdirSync(join(kino, "blyg"), { recursive: true });
  const git = (...a) => execFileSync("git", a, { cwd: lab, stdio: "ignore" });
  git("init", "-q", "-b", "main");
  git("-c", "user.name=t", "-c", "user.email=t@t", "add", "-A");
  git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-qm", "seed");
  const node = (cwd, args, at, extra = {}) => {
    const r = spawnSync(process.execPath, args, {
      cwd, encoding: "utf8",
      env: { ...process.env, KINO_DIR: kino, LAB_NOW: at, BLYG_NOW: at, LAB_SURFACE_DIR: join(kino, "dist"), LAB_NO_READING: "1", REPLICATE_CMD: "python3 run.py", ...extra },
    });
    if (r.status !== 0) throw new Error(`${args.join(" ")} failed:\n${r.stdout}${r.stderr}`);
    return r.stdout;
  };
  const commit = () => {
    git("-c", "user.name=t", "-c", "user.email=t@t", "add", "-A");
    git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-qm", "night", "--allow-empty");
  };
  // kinocomputing's Action, then its deploy.
  const publish = (at) => {
    node(kino, ["tools/build-stream.mjs", "--state"], at);
    node(kino, ["tools/build-stream.mjs"], at);
  };
  // The PI posts a take through motes: a plain note page, no model named, no
  // kind asked for — so a fragment.
  const take = async (slug, markdown, at) => {
    const page = (await renderNote({ markdown, name: slug, model: "x", at, kino, origin: KINO_ORIGIN }))
      .replace(/ *<meta name="blyg:(generated|kind)"[^>]*>\n/g, "");
    writeFileSync(join(kino, "notes", `${slug}.html`), page);
  };
  // The release workflow: held pages that are due go to kinocomputing.
  const release = (at) => node(lab, ["tools/release.mjs"], at);
  return { root, lab, kino, node, commit, publish, take, release, dispose: () => rmSync(root, { recursive: true, force: true }) };
}
