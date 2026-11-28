// The build shift (README, "The build shift"): each night, after the research
// shifts, one headline in Now on kinocomputing's roadmap is built. Matt moving
// an item to Now is the go-ahead; the build agent outlines it, does it in the
// site or the lab or both, and tests it; then, without the agent, its change
// is tested again by each repository's own tests and mutants, judged here,
// and landed on main, with the item moved to Done and its commits linked. A
// change that touches what judges it goes to the PI as a pull request.
//
// The agent has autonomy over the work and none over the rules that judge it
// (INFLUENCES.md): this file, the workflow, the test harnesses and mutant
// runners, the charter and the lab's config are never the agent's to change.
//
//   node tools/build.mjs pick <roadmap.json> <state/build.jsonl> <date>   prints id=… (or nothing) and writes the briefing
//   node tools/build.mjs judge <repo: lab|site> <base> [<head>]            prints land=true|false and why=…

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * What a build may never change, by repository: what judges it, what it
 * publishes, and what only the PI decides. A change to any of these goes
 * to the PI, however good it is.
 */
export const JUDGES = {
  lab: [
    ".github/", "tools/build.mjs", "tools/fast-lane.mjs", "tools/restore-machinery.sh",
    "test/mutants.mjs", "test/mutants.json", "test/helpers.mjs",
    "CHARTER.md", "AGENT.md", "BUILD.md", "config/", "package.json", "package-lock.json", ".nvmrc",
    // The lab's record and its work: the research shifts' to write.
    "state/", "published/", "journal/", "reading/", "held/", "experiments/", "analyses/", "MORNING.md",
  ],
  site: [
    ".github/", "test/mutants.mjs", "test/mutants.json", "test/oracle.mjs", "test/model.mjs", "test/twin.mjs",
    "test/conformance.mjs", "test/histories.mjs", "package.json", "package-lock.json", ".nvmrc", "blyg/",
    // Notes are published, by Matt or by the lab; the roadmap is the one file
    // here the build may touch (its outline).
    /^notes\/(?!_roadmap\.json$)/,
  ],
};
const isJudge = (repo, path) => JUDGES[repo].some((p) => (p instanceof RegExp ? p.test(path) : p.endsWith("/") ? path.startsWith(p) : path === p));

/**
 * The verdict on a build's change to one repository: `files` from
 * `git diff --numstat` ({ path, added, removed }), and how many lines it
 * removes from the tests. No limit on size: Matt asked for the headline.
 */
export function judge(repo, files, testLinesRemoved) {
  if (!JUDGES[repo]) throw new Error(`no such repository: ${repo}`);
  if (!files.length) return { land: false, why: "it changes nothing" };
  const off = files.filter((f) => isJudge(repo, f.path));
  if (off.length) return { land: false, why: `it changes ${off.map((f) => f.path).join(", ")}: what judges, publishes or steers the work is the PI's to change` };
  if (testLinesRemoved) return { land: false, why: `it takes ${testLinesRemoved} line(s) out of the tests` };
  const code = files.some((f) => !f.path.startsWith("test/") && /\.(mjs|js|sh|py)$/.test(f.path));
  const tested = files.some((f) => f.path.startsWith("test/") && f.added > 0) || (repo === "site" && files.some((f) => /^tools\/[^/]+\.test\.mjs$/.test(f.path) && f.added > 0));
  if (code && !tested) return { land: false, why: "it changes code without adding a test" };
  const size = files.reduce((n, f) => n + f.added + f.removed, 0);
  return { land: true, why: `${size} lines in ${files.map((f) => f.path).join(", ")}; tests added, none taken out` };
}

/** An attempt's line in state/build.jsonl, as read back. */
const attemptsOf = (path) => (existsSync(path) ? readFileSync(path, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);

/**
 * The item tonight's build takes: in Now, not tried yet today, not waiting
 * on the PI (a pull request is open for it), not already landed (its move to
 * Done may have failed), and tried fewer than `attempts`
 * times since it last moved to Now; the one longest in Now first. null when
 * there is none.
 */
export function pick(items, attempts, date, { most = 3 } = {}) {
  const inNowSince = (item) => [...(item.moves ?? [])].reverse().find((m) => m.to === "now")?.on ?? item.created;
  const candidates = items.filter((item) => item.status === "now" && /^r\d+$/.test(item.id)).filter((item) => {
    const mine = attempts.filter((a) => a.id === item.id && a.date >= inNowSince(item));
    if (mine.some((a) => a.date === date)) return false;
    if (mine.some((a) => a.outcome === "for the PI" || a.outcome === "landed")) return false;
    return mine.length < most;
  });
  candidates.sort((a, b) => inNowSince(a).localeCompare(inNowSince(b)) || Number(a.id.slice(1)) - Number(b.id.slice(1)));
  return candidates[0] ?? null;
}

/** The build agent's briefing for one item. */
export function briefing(item, attempts) {
  const before = attempts.filter((a) => a.id === item.id);
  return [
    `# Tonight's build: ${item.id}`,
    "",
    `**${item.headline}**`,
    "",
    `Type: ${item.type ?? "external"}. Tags: ${(item.tags ?? []).join(", ") || "none"}.`,
    "",
    ...(item.outline?.length ? ["The outline so far:", "", ...item.outline.map((l) => `${l.match(/^ */)[0]}- ${l.trim()}`), ""] : ["It has no outline yet: write one first (BUILD.md, \"Outline first\").", ""]),
    ...(item.links?.length ? ["Links Matt or an earlier session gave it:", "", ...item.links.map((l) => `- ${l.title}: ${l.url}`), ""] : []),
    ...(before.length ? ["Earlier attempts:", "", ...before.map((a) => `- ${a.date}: ${a.outcome}${a.why ? ` (${a.why})` : ""}`), ""] : []),
  ].join("\n");
}

// Run as a script, wherever it was copied to (a temporary folder may be behind a link).
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  const [verb, ...args] = process.argv.slice(2);
  if (verb === "pick") {
    const [roadmapPath, attemptsPath, date, briefPath = "BRIEF.md"] = args;
    const config = JSON.parse(readFileSync(new URL("../config/lab.json", import.meta.url), "utf8")).build;
    let items = [];
    try { items = JSON.parse(readFileSync(roadmapPath, "utf8")).items ?? []; } catch { /* no roadmap, no build */ }
    const attempts = attemptsOf(attemptsPath);
    const item = pick(items, attempts, date, { most: config.attempts });
    if (item) {
      writeFileSync(briefPath, `${briefing(item, attempts)}\n`);
      console.log(`id=${item.id}`);
    } else console.log("id=");
  } else if (verb === "judge") {
    const [repo, base, head = "HEAD"] = args;
    const git = (...a) => execFileSync("git", a, { encoding: "utf8", maxBuffer: 64 << 20 });
    const files = git("diff", "--numstat", base, head).split("\n").filter(Boolean).map((l) => {
      const [added, removed, path] = l.split("\t");
      return { path, added: Number(added) || 0, removed: Number(removed) || 0 };
    });
    const testLinesRemoved = git("diff", "-U0", base, head, "--", "test/", ...(repo === "site" ? ["tools/*.test.mjs"] : [])).split("\n").filter((l) => l.startsWith("-") && !l.startsWith("---")).length;
    const { land, why } = judge(repo, files, testLinesRemoved);
    console.log(`land=${land}`);
    console.log(`why=${why.replace(/\n/g, " ")}`);
  } else {
    console.error("usage: build.mjs pick <roadmap.json> <build.jsonl> <date> [brief] | judge <lab|site> <base> [<head>]");
    process.exit(1);
  }
}
