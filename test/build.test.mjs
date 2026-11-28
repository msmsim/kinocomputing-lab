// The build shift (README, "The build shift"): which item it takes, how its
// change is judged, and the landing, run for real against stand-in origins
// for both repositories, with patches as the build leaves them.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { KINO, LAB } from "../tools/lib.mjs";
import { briefing, judge, pick } from "../tools/build.mjs";

const now = (id, on, extra = {}) => ({ id, headline: `Headline ${id}`, status: "now", created: "2026-11-01", moves: [{ to: "now", on }], outline: ["x"], ...extra });

test("build pick: the item longest in Now, not tried today, not waiting on the PI, not tried too often since it last reached Now", () => {
  const items = [now("r5", "2026-11-20"), now("r3", "2026-11-22"), now("r4", "2026-11-20"), { ...now("r1", "2026-11-10"), status: "next" }, { id: "bad", status: "now" }];
  assert.equal(pick(items, [], "2026-11-29").id, "r4", "longest in Now; the lower id on a tie");
  assert.equal(pick(items, [{ id: "r4", date: "2026-11-29", outcome: "failed" }], "2026-11-29").id, "r5", "not twice in a day");
  assert.equal(pick(items, [{ id: "r4", date: "2026-11-25", outcome: "for the PI" }], "2026-11-29").id, "r5", "a pull request waits for the PI");
  const thrice = ["2026-11-26", "2026-11-27", "2026-11-28"].map((date) => ({ id: "r4", date, outcome: "failed" }));
  assert.equal(pick(items, thrice, "2026-11-29").id, "r5", "three tries and it waits");
  assert.equal(pick(items, thrice, "2026-11-29", { most: 4 }).id, "r4");
  assert.equal(pick(items, [{ id: "r4", date: "2026-11-27", outcome: "landed" }], "2026-11-29").id, "r5", "landed is done, even if its move to Done failed");
  const back = [now("r4", "2026-11-29")];
  back[0].moves = [{ to: "now", on: "2026-11-20" }, { to: "next", on: "2026-11-27" }, { to: "now", on: "2026-11-29" }];
  assert.equal(pick(back, [...thrice, { id: "r4", date: "2026-11-21", outcome: "for the PI" }], "2026-11-30").id, "r4", "moved back to Now: a fresh start");
  assert.equal(pick([{ ...now("r1", "2026-11-20"), status: "done" }], [], "2026-11-29"), null);

  const brief = briefing({ ...now("r4", "2026-11-20"), outline: [], links: [{ title: "An idea", url: "https://example.org" }], tags: ["feature", "site"] }, [{ id: "r4", date: "2026-11-28", outcome: "failed", why: "the site's tests failed" }]);
  assert.match(brief, /^# Tonight's build: r4\n\n\*\*Headline r4\*\*\n\nType: external\. Tags: feature, site\./);
  assert.match(brief, /It has no outline yet: write one first/);
  assert.match(brief, /- An idea: https:\/\/example\.org/);
  assert.match(brief, /- 2026-11-28: failed \(the site's tests failed\)/);
  assert.match(briefing(now("r4", "2026-11-20", { outline: ["One", "  two"] }), []), /The outline so far:\n\n- One\n  - two/);
});

test("build judge: lands with tests and away from the judges; anything that changes what judges, publishes or steers goes to the PI", () => {
  const f = (path, added = 5, removed = 0) => ({ path, added, removed });
  assert.equal(judge("site", [f("tools/build-stream.mjs", 200, 40), f("test/roadmap.test.mjs")], 0).land, true, "no size limit: the PI asked for it");
  assert.equal(judge("site", [f("tools/glyph.mjs"), f("tools/glyph.test.mjs")], 0).land, true, "the site's tools' own tests count");
  assert.equal(judge("site", [f("note.css"), f("notes/_roadmap.json", 1, 1)], 0).land, true, "style needs no test; the roadmap's outline is the build's to write");
  assert.equal(judge("lab", [f("tools/settle.mjs"), f("test/days.test.mjs")], 0).land, true);
  assert.equal(judge("lab", [f("README.md")], 0).land, true);
  const cases = [
    ["site", [f("tools/build-stream.mjs")], 0, /without adding a test/],
    ["lab", [f("tools/settle.mjs"), f("test/days.test.mjs")], 3, /takes 3 line\(s\) out of the tests/],
    ["lab", [], 0, /changes nothing/],
    ...[".github/workflows/build.yml", "tools/build.mjs", "tools/fast-lane.mjs", "test/mutants.mjs", "test/mutants.json", "test/helpers.mjs", "CHARTER.md", "AGENT.md", "BUILD.md", "config/lab.json", "package.json", "state/build.jsonl", "published/x.md", "MORNING.md", "experiments/e001/run.py"]
      .map((path) => ["lab", [f(path), f("test/unit.test.mjs")], 0, new RegExp(`it changes ${path.replace(/[.]/g, "\\.")}`)]),
    ...[".github/workflows/tests.yml", "test/mutants.mjs", "test/oracle.mjs", "test/twin.mjs", "package-lock.json", "notes/001-ash-eels.html", "notes/_hopper.json", "blyg/registry.json"]
      .map((path) => ["site", [f(path), f("test/site.test.mjs")], 0, new RegExp(`it changes ${path.replace(/[.]/g, "\\.")}`)]),
  ];
  for (const [repo, files, removed, why] of cases) {
    const verdict = judge(repo, files, removed);
    assert.equal(verdict.land, false, `${repo} ${files.map((x) => x.path)}`);
    assert.match(verdict.why, why);
  }
  assert.throws(() => judge("elsewhere", [f("x")], 0), /no such repository/);
});

/** Two stand-in origins, main checkouts of each with push access to them, and a gh that records what it's asked. */
function landing() {
  const root = mkdtempSync(join(tmpdir(), "land-"));
  const git = (cwd, ...a) => execFileSync("git", a, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  const id = (cwd) => { git(cwd, "config", "user.name", "t"); git(cwd, "config", "user.email", "t@t"); };
  const origin = (name, files) => {
    const src = join(root, `seed-${name}`);
    mkdirSync(src);
    git(src, "init", "-q", "-b", "main");
    id(src);
    for (const [path, text] of Object.entries(files)) {
      mkdirSync(join(src, path, ".."), { recursive: true });
      writeFileSync(join(src, path), text);
    }
    git(src, "add", "-A");
    git(src, "commit", "-qm", "seed");
    git(root, "clone", "-q", "--bare", src, `${name}.git`);
    return join(root, `${name}.git`);
  };
  const item = { id: "r7", headline: "Something new", status: "now", type: "external", tags: ["feature", "site"], created: "2026-11-20", moves: [{ to: "now", on: "2026-11-28" }], outline: ["x"] };
  const roadmap = `{"items": [\n${JSON.stringify(item)}\n]}\n`;
  const labOrigin = origin("lab", {
    "tools/build.mjs": readFileSync(join(LAB, "tools/build.mjs"), "utf8"),
    "tools/land.sh": readFileSync(join(LAB, "tools/land.sh"), "utf8"),
    "tools/settle.mjs": "// settle\n", "test/days.test.mjs": "// days\n", "state/build.jsonl": "",
  });
  const siteOrigin = origin("site", {
    "tools/roadmap.mjs": readFileSync(join(KINO, "tools/roadmap.mjs"), "utf8"),
    "tools/build-stream.mjs": "// build\n", "test/site.test.mjs": "// site\n", "notes/_roadmap.json": roadmap,
  });
  git(root, "clone", "-q", labOrigin, "lab");
  git(root, "clone", "-q", siteOrigin, "kinocomputing");
  const base = { lab: git(join(root, "lab"), "rev-parse", "HEAD"), site: git(join(root, "kinocomputing"), "rev-parse", "HEAD") };
  mkdirSync(join(root, "build"));
  mkdirSync(join(root, "bin"));
  writeFileSync(join(root, "bin/gh"), `#!/bin/sh\necho "$*" >> "${root}/gh.log"\ncase "$*" in "pr create"*) echo "https://github.com/pr/1";; esac\n`);
  chmodSync(join(root, "bin/gh"), 0o755);

  /** A patch, as the build leaves it: the change in a clone of main, staged. */
  const patch = (repo, files) => {
    const dir = join(root, `agent-${repo}`);
    rmSync(dir, { recursive: true, force: true });
    git(root, "clone", "-q", repo === "lab" ? labOrigin : siteOrigin, dir);
    for (const [path, text] of Object.entries(files)) {
      mkdirSync(join(dir, path, ".."), { recursive: true });
      writeFileSync(join(dir, path), text);
    }
    git(dir, "add", "-A");
    writeFileSync(join(root, "build", `${repo === "lab" ? "lab" : "kinocomputing"}.patch`), `${git(dir, "diff", "--cached", "--binary")}\n`);
  };
  const run = (env) => spawnSync("bash", ["lab/tools/land.sh"], {
    cwd: root, encoding: "utf8",
    env: { ...process.env, PATH: `${join(root, "bin")}:${process.env.PATH}`, RUNNER_TEMP: join(root, "tmp"), GITHUB_STEP_SUMMARY: join(root, "summary.md"),
      ID: "r7", DATE: "2026-11-29", BUILT: "success", LAB_BASE: base.lab, SITE_BASE: base.site, GH_TOKEN: "lab-token", KINO_TOKEN: "site-token", RUN_URL: "https://example.org/run/1", ...env },
  });
  const show = (repo, ...a) => {
    const dir = join(root, `look-${repo}`);
    rmSync(dir, { recursive: true, force: true });
    git(root, "clone", "-q", repo === "lab" ? labOrigin : siteOrigin, dir);
    return git(dir, ...a);
  };
  const attempts = () => show("lab", "show", "HEAD:state/build.jsonl").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  mkdirSync(join(root, "tmp"));
  return { root, patch, run, show, attempts, dispose: () => rmSync(root, { recursive: true, force: true }) };
}

const REPORT = "Subject: Something new is on the site\n\nIt shows the new thing, with a test.\n\nDone: yes\n";

test("landing: a change that passed its tests and keeps away from the judges goes onto main in both repositories, and the item to Done with its commits", () => {
  const l = landing();
  try {
    l.patch("site", { "tools/build-stream.mjs": "// build, with something new\n", "test/site.test.mjs": "// site\n// and its test\n" });
    l.patch("lab", { "tools/settle.mjs": "// settle, knowing about it\n", "test/days.test.mjs": "// days\n// and a test\n" });
    writeFileSync(join(l.root, "build/REPORT.md"), REPORT);
    writeFileSync(join(l.root, "build/claude-output.json"), JSON.stringify({ total_cost_usd: 1.234 }));
    const out = l.run({ LAB_OK: "true", SITE_OK: "true" });
    assert.equal(out.status, 0, out.stderr);
    assert.equal(l.show("site", "log", "-1", "--format=%s", "HEAD~1"), "Something new is on the site");
    assert.match(l.show("site", "log", "-1", "--format=%b", "HEAD~1"), /It shows the new thing, with a test\.\n\nBuilt from the roadmap's r7 by the build shift: https:\/\/example\.org\/run\/1/);
    assert.equal(l.show("site", "log", "-1", "--format=%an %s"), "kinocomputing-lab[bot] roadmap: r7 is done, by the build shift");
    const item = JSON.parse(l.show("site", "show", "HEAD:notes/_roadmap.json")).items[0];
    assert.equal(item.status, "done");
    assert.deepEqual(item.links.map((x) => x.title), [
      `lab@${l.show("lab", "rev-parse", "--short=7", "HEAD~1")}`, `site@${l.show("site", "rev-parse", "--short=7", "HEAD~1")}`,
    ], "both commits, by repository");
    assert.equal(l.show("lab", "show", "HEAD~1:tools/settle.mjs"), "// settle, knowing about it");
    const [attempt] = l.attempts();
    assert.equal(attempt.outcome, "landed");
    assert.equal(attempt.usd, 1.234);
    assert.equal(attempt.links.length, 2);
    assert.equal(l.show("lab", "log", "-1", "--format=%s"), "build: r7 landed");
  } finally {
    l.dispose();
  }
});

test("landing: a change to what judges it goes to the PI as a pull request; the item stays in Now", () => {
  const l = landing();
  try {
    l.patch("lab", { "tools/build.mjs": "// a judge, loosened\n", "test/days.test.mjs": "// days\n// and a test\n" });
    writeFileSync(join(l.root, "build/REPORT.md"), REPORT);
    const out = l.run({ LAB_OK: "true", SITE_OK: "none" });
    assert.equal(out.status, 0, out.stderr);
    assert.equal(l.show("lab", "show", "HEAD:tools/build.mjs").includes("loosened"), false, "not on main");
    assert.equal(l.show("lab", "show", "origin/build/r7-2026-11-29:tools/build.mjs"), "// a judge, loosened", "on a branch of its own");
    const gh = readFileSync(join(l.root, "gh.log"), "utf8");
    assert.match(gh, /pr create --repo msmsim\/kinocomputing-lab --head build\/r7-2026-11-29 --base main --title Something new is on the site --label for the PI/);
    const [attempt] = l.attempts();
    assert.equal(attempt.outcome, "for the PI");
    assert.match(attempt.why, /lab: it changes tools\/build\.mjs/);
    assert.deepEqual(attempt.links, ["https://github.com/pr/1"]);
    assert.equal(JSON.parse(l.show("site", "show", "HEAD:notes/_roadmap.json")).items[0].status, "now");
  } finally {
    l.dispose();
  }
});

test("landing: nothing lands when the tests failed, the agent says it isn't done, it changed nothing, or the build didn't finish; each is recorded", () => {
  const l = landing();
  try {
    const cases = [
      [{ LAB_OK: "false", SITE_OK: "none" }, REPORT, /the lab's tests or mutants failed/],
      [{ LAB_OK: "true", SITE_OK: "none" }, "Subject: Half of it\n\nDone: no\nWhy not: the site needs a font it hasn't got\n", /not done: the site needs a font it hasn't got/],
      [{ BUILT: "failure" }, "", /the build didn't finish \(failure\)/],
    ];
    l.patch("lab", { "tools/settle.mjs": "// settle, changed\n", "test/days.test.mjs": "// days\n// a test\n" });
    for (const [env, report, why] of cases) {
      writeFileSync(join(l.root, "build/REPORT.md"), report);
      const out = l.run(env);
      assert.equal(out.status, 0, out.stderr);
      assert.match(l.attempts().at(-1).why, why);
      assert.equal(l.attempts().at(-1).outcome, "failed");
    }
    rmSync(join(l.root, "build/lab.patch"));
    writeFileSync(join(l.root, "build/REPORT.md"), "Done: no\nWhy not: it was already true\n");
    l.run({});
    assert.match(l.attempts().at(-1).why, /it changed nothing: it was already true/);
    assert.equal(l.show("lab", "show", "HEAD:tools/settle.mjs"), "// settle", "nothing landed");
    assert.equal(l.attempts().length, 4);
  } finally {
    l.dispose();
  }
});
