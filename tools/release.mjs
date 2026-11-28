// The day's brief goes out a few hours after the night's notes, not with
// them (README, "A night"): settle renders it, dated for its release, and
// holds it in held/ beside the files it needs; this puts what's due on
// kinocomputing. A Sunday's week in review is held with it, for later, since
// Sunday's second shift runs longer. Times are config/lab.json's `release`,
// in UTC.
//
//   node tools/release.mjs        (KINO_DIR: the kinocomputing checkout)
//
// Run by the release workflow, at the release times. Settle runs it too, as
// it starts, so a release whose trigger never came goes out with the next
// shift rather than not at all. Prints a one-line summary.
//
// held/manifest.json: { due: ISO time, files: ["notes/….html", "media/…"] },
// each file at held/<path>, to be copied to kinocomputing at <path>.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { json, KINO, LAB, now, readJson, sundayPlan } from "./lib.mjs";

/** When a day's held pages go out: its brief's time, or a Sunday's. */
export function dueAt(date, config) {
  const times = config.release ?? { daily: "08:45", sunday: "10:45" };
  const sunday = config.sunday && sundayPlan(date, config.sunday);
  return `${date}T${sunday ? times.sunday : times.daily}:00Z`;
}

/** Keep a file for kinocomputing until `due`: written to held/<path>. */
export function hold(lab, path, bytes, due) {
  if (!/^(?:notes|media)\/[a-z0-9][a-z0-9._-]*$/i.test(path)) throw new Error(`held/ takes notes/ and media/ files, not ${path}`);
  const dir = join(lab, "held");
  const manifestPath = join(dir, "manifest.json");
  const manifest = readJson(manifestPath, null);
  // One release at a time: a later day's holding waits for the earlier's to
  // go out, which settle sees to as it starts.
  if (manifest && manifest.due !== due) throw new Error(`held/ is waiting for ${manifest.due}, not ${due}`);
  mkdirSync(dirname(join(dir, path)), { recursive: true });
  writeFileSync(join(dir, path), bytes);
  const files = [...new Set([...(manifest?.files ?? []), path])].sort();
  writeFileSync(manifestPath, json({ due, files }));
}

/** The time held/ is waiting for, or null. */
export const heldUntil = (lab) => readJson(join(lab, "held/manifest.json"), null)?.due ?? null;

/** Whether a page is held, and so will be on kinocomputing when released. */
export const isHeld = (lab, path) => (readJson(join(lab, "held/manifest.json"), null)?.files ?? []).includes(path);

/** Put what's due on kinocomputing and empty held/. Returns the files released. */
export function release(lab, kino, at) {
  const manifest = readJson(join(lab, "held/manifest.json"), null);
  if (!manifest || manifest.due > at) return [];
  for (const path of manifest.files) {
    if (!existsSync(join(lab, "held", path))) throw new Error(`held/manifest.json lists ${path}, which isn't in held/`);
  }
  // All copied before any is removed: a release that fails part way leaves
  // held/ as it was, to be released again whole.
  for (const path of manifest.files) {
    mkdirSync(dirname(join(kino, path)), { recursive: true });
    cpSync(join(lab, "held", path), join(kino, path), { force: true });
  }
  rmSync(join(lab, "held"), { recursive: true, force: true });
  return manifest.files;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const at = now();
  const released = release(LAB, KINO, at);
  const pages = released.filter((p) => p.startsWith("notes/")).map((p) => p.slice(6).replace(/\.html$/, ""));
  const waiting = heldUntil(LAB);
  console.log(`release: ${released.length ? `released ${pages.join(", ")}` : waiting ? `nothing due; held until ${waiting}` : "nothing held"}`);
}
