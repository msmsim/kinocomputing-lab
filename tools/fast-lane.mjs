// Whether a proposal from the night shift may merge itself (README,
// "Proposals"): small, away from everything that judges or publishes, with a
// test added and none taken out, once the Tests workflow has passed it and
// the mutants its change could reach. Anything else waits for the PI.
//
//   node tools/fast-lane.mjs <base> [<head>]   prints fast=true|false and why=…
//
// Run from main's own copy, by main's own Tests workflow: never the
// proposal's, which could rewrite it.
//
// The agent has autonomy over its work and none over the rules that judge it
// (INFLUENCES.md): so the lane is a list of what may change, not of what may
// not, and a change to the lane is itself a change to a judge.

import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

/** Paths a proposal may change and still merge itself. */
export const LANE = [
  "tools/search.mjs", "tools/sources.mjs", "tools/week.mjs",
  "voices/", "reference/", "experiments/_template/", "analyses/_template/",
  // The tests themselves, but not what judges them: the mutant runner, its
  // memory and the test lab stay the PI's.
  /^test\/[a-z0-9-]+\.test\.mjs$/,
];
const inLane = (path) => LANE.some((p) => (p instanceof RegExp ? p.test(path) : p.endsWith("/") ? path.startsWith(p) : path === p));
/** At most this many lines added and removed, all told. */
export const MOST_LINES = 80;

/**
 * The verdict on a change: `files` from `git diff --numstat` ({ path, added,
 * removed }), and how many lines it removes from the tests.
 */
export function judge(files, testLinesRemoved) {
  if (!files.length) return { fast: false, why: "it changes nothing" };
  const off = files.filter((f) => !inLane(f.path));
  if (off.length) return { fast: false, why: `it changes ${off.map((f) => f.path).join(", ")}, which the fast lane doesn't cover: the lab's judges and publishing are the PI's to change` };
  if (testLinesRemoved) return { fast: false, why: `it takes ${testLinesRemoved} line(s) out of the tests` };
  const size = files.reduce((n, f) => n + f.added + f.removed, 0);
  if (size > MOST_LINES) return { fast: false, why: `it changes ${size} lines, more than the fast lane's ${MOST_LINES}` };
  const code = files.some((f) => !f.path.startsWith("test/") && f.path.endsWith(".mjs"));
  const tested = files.some((f) => f.path.startsWith("test/") && f.added > 0);
  if (code && !tested) return { fast: false, why: "it changes code without adding a test" };
  return { fast: true, why: `${size} lines in ${files.map((f) => f.path).join(", ")}, tests added, none taken out` };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [base, head = "HEAD"] = process.argv.slice(2);
  const git = (...args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 << 20 });
  const files = git("diff", "--numstat", base, head).split("\n").filter(Boolean).map((l) => {
    const [added, removed, path] = l.split("\t");
    return { path, added: Number(added) || 0, removed: Number(removed) || 0 };
  });
  const testLinesRemoved = git("diff", "-U0", base, head, "--", "test/").split("\n").filter((l) => l.startsWith("-") && !l.startsWith("---")).length;
  const { fast, why } = judge(files, testLinesRemoved);
  console.log(`fast=${fast}`);
  console.log(`why=${why.replace(/\n/g, " ")}`);
}
