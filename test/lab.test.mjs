// The lab's deterministic machinery: money, steers, the publishing gate, and
// two whole nights end to end against kinocomputing's real build. Nothing
// here calls a model — the agent's part is played by a script.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { allowance, frontMatter, KINO, LAB } from "../tools/lib.mjs";
import { inboxSteers, blygSteers } from "../tools/steers.mjs";
import { renderNote } from "../tools/render.mjs";

const BUDGET = { daily_usd: 1.5, bank_cap_usd: 10, light_run_max_usd: 1.5, deep_run_threshold_usd: 6, deep_run_max_usd: 6, min_run_usd: 0.1 };

test("budget: the allowance banks unspent days, caps, and buys a deep run when it has saved enough", () => {
  assert.deepEqual(allowance(BUDGET, [], "2026-11-21", "2026-11-21"), { bank: 1.5, kind: "light", maxUsd: 1.5, skip: false });
  const quietWeek = allowance(BUDGET, [], "2026-11-25", "2026-11-21");
  assert.equal(quietWeek.bank, 7.5);
  assert.equal(quietWeek.kind, "deep");
  assert.equal(quietWeek.maxUsd, 6);
  assert.equal(allowance(BUDGET, [], "2026-12-31", "2026-11-21").bank, 10, "the bank stops at its cap");
  const spent = allowance(BUDGET, [{ date: "2026-11-21", usd: 1.45 }], "2026-11-21", "2026-11-21");
  assert.equal(spent.skip, true, "five cents left isn't worth a run");
  const overspent = allowance(BUDGET, [{ date: "2026-11-21", usd: 3 }], "2026-11-22", "2026-11-21");
  assert.equal(overspent.bank, 0, "an overrun is paid back from later days");
});

test("front matter: strings, booleans and integers", () => {
  const { data, body } = frontMatter("---\nkind: experiment\npin: true\npriority: 2\nchange_note: \"fixed: the seed\"\n---\n\nBody");
  assert.deepEqual(data, { kind: "experiment", pin: true, priority: 2, change_note: "fixed: the seed" });
  assert.equal(body.trim(), "Body");
});

test("steers: an inbox page is a steer when new or rewritten, not when already seen", () => {
  const dir = mkdtempSync(join(tmpdir(), "inbox-"));
  try {
    writeFileSync(join(dir, "_note.html"), "<main>template</main>");
    writeFileSync(join(dir, "101-ash-owls.html"), '<main><p>Look at <a href="https://example.org/p?a=1&amp;b=2">this</a> paper.</p></main>');
    const [steer] = inboxSteers(dir, {});
    assert.match(steer.id, /^inbox:101-ash-owls:[0-9a-f]{8}$/);
    assert.equal(steer.text, "Look at this paper.");
    assert.deepEqual(steer.links, ["https://example.org/p?a=1&b=2"]);
    assert.deepEqual(inboxSteers(dir, { "101-ash-owls": steer.seen.value }), [], "seen");
    writeFileSync(join(dir, "101-ash-owls.html"), "<main><p>Changed my mind.</p></main>");
    assert.equal(inboxSteers(dir, { "101-ash-owls": steer.seen.value }).length, 1, "rewritten");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("steers: a note on the PI's blyg answering the lab is a steer; the first look is a baseline", async () => {
  const blyg = "https://pi.example/notes/";
  const kino = "https://www.kinocomputing.com/";
  const docs = {
    aaaaaaaaaaaaaaaaaaaaaaaaaa: { kind: "thread", page: "a", content_html: "<p>On your NWP note.</p>", stub_of: { origin: kino, id: "x", version: 1, cited: { url: `${kino}some-note`, retrieved: "2026-11-20T00:00:00Z" } } },
    bbbbbbbbbbbbbbbbbbbbbbbbbb: { kind: "fragment", page: "b", content_html: '<p>See <a href="https://kinocomputing.com/x">this</a>.</p>' },
    cccccccccccccccccccccccccc: { kind: "fragment", page: "c", content_html: "<p>Unrelated.</p>" },
  };
  const index = { items: Object.keys(docs).map((id) => ({ id, kind: docs[id].kind, version: 1 })) };
  const fetchJson = async (url) => (url.endsWith("index.json") ? index : docs[url.match(/items\/(\w+)\.json/)[1]]);

  const first = await blygSteers(blyg, kino, undefined, fetchJson);
  assert.equal(first.steers.length, 0, "baseline: nothing replayed");
  assert.equal(first.marks.length, 3);

  const seen = {};
  const second = await blygSteers(blyg, kino, seen, fetchJson);
  assert.deepEqual(second.steers.map((s) => s.title).sort(), [`${blyg}a`, `${blyg}b`]);
  assert.equal(second.steers.find((s) => s.title.endsWith("a")).answers, `${kino}some-note`);
  assert.deepEqual(second.marks.map((m) => m.key), [`${blyg} cccccccccccccccccccccccccc`], "only non-steers are marked straight away");

  const caughtUp = Object.fromEntries(Object.keys(docs).map((id) => [id, 1]));
  assert.equal((await blygSteers(blyg, kino, caughtUp, fetchJson)).steers.length, 0, "unchanged versions are skipped");
});

const ARGS = { name: "lab-2026-11-21-test", model: "claude-haiku-5-5", at: "2026-11-21T03:00:00Z", kino: KINO, origin: "https://www.kinocomputing.com/" };

test("render: a note becomes a kinocomputing page that discloses its model", async () => {
  const page = await renderNote({ ...ARGS, markdown: "**A title**\n\nBody with a [link](/about) and `code`.\n\n- one\n- two\n", pin: true, changeNote: 'a "quoted" change' });
  assert.match(page, /<meta property="article:published_time" content="2026-11-21T03:00:00Z">/);
  assert.match(page, /<meta name="blyg:generated" content="claude-haiku-5-5">/);
  assert.match(page, /<meta name="blyg:pin" content="true">/);
  assert.match(page, /<meta name="blyg:note" content="a &quot;quoted&quot; change">/);
  assert.match(page, /<main>\n<p><strong>A title<\/strong><\/p>/);
  assert.ok(!page.includes("{{"), "every placeholder filled");
});

test("render: refuses what the blyg can't carry, before it reaches the site", async () => {
  await assert.rejects(renderNote({ ...ARGS, markdown: "| a | b |\n|---|---|\n| 1 | 2 |\n" }), /a table/);
  await assert.rejects(renderNote({ ...ARGS, markdown: "Hello <span>there</span>\n" }), /raw HTML/);
  await assert.rejects(renderNote({ ...ARGS, markdown: "   \n" }), /empty/);
});

/** A throwaway lab and kinocomputing, side by side, the lab a git repo. */
function makeWorld() {
  const root = mkdtempSync(join(tmpdir(), "lab-world-"));
  const lab = join(root, "lab");
  const kino = join(root, "kino");
  for (const path of ["tools", "config", "AGENT.md", "CHARTER.md", "package.json"]) cpSync(join(LAB, path), join(lab, path), { recursive: true });
  cpSync(join(LAB, "node_modules"), join(lab, "node_modules"), { recursive: true });
  for (const dir of ["state/questions", "inbox", "outbox", "published", "journal"]) mkdirSync(join(lab, dir), { recursive: true });
  const config = JSON.parse(readFileSync(join(lab, "config/lab.json"), "utf8"));
  config.steer_blygs = []; // no network in tests
  writeFileSync(join(lab, "config/lab.json"), JSON.stringify(config));
  writeFileSync(join(lab, "state/questions/q-001-test.md"), "---\nid: q-001\ntitle: A test question\nkind: experiment\nstatus: open\npriority: 1\n---\n\nWhy.\n");
  for (const path of ["tools", "notes/_note.html", "notes/_stream.html", "note.css", "favicon.svg", "favicon.ico", "apple-touch-icon.png", "kinocomputing-basic-og.jpg"]) {
    cpSync(join(KINO, path), join(kino, path), { recursive: true });
  }
  mkdirSync(join(kino, "blyg"), { recursive: true });
  const git = (...a) => execFileSync("git", a, { cwd: lab, stdio: "ignore" });
  git("init", "-q", "-b", "main");
  git("-c", "user.name=t", "-c", "user.email=t@t", "add", "-A");
  git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-qm", "seed");
  const env = (at) => ({ ...process.env, KINO_DIR: kino, LAB_NOW: at });
  const node = (cwd, args, at) => {
    const r = spawnSync(process.execPath, args, { cwd, env: { ...env(at), BLYG_NOW: at }, encoding: "utf8" });
    if (r.status !== 0) throw new Error(`${args.join(" ")} failed:\n${r.stdout}${r.stderr}`);
    return r.stdout;
  };
  const commit = () => {
    git("-c", "user.name=t", "-c", "user.email=t@t", "add", "-A");
    git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-qm", "night", "--allow-empty");
  };
  return { root, lab, kino, node, commit, dispose: () => rmSync(root, { recursive: true, force: true }) };
}

test("two nights, end to end: steers handled or re-offered, claims kept, notes published, versioned and pinned", () => {
  const w = makeWorld();
  const read = (p) => readFileSync(join(w.lab, p), "utf8");
  const write = (p, s) => writeFileSync(join(w.lab, p), s);
  try {
    // Night 1. The PI drops two things in; the shift handles one.
    write("inbox/201-teal-bats.html", "<main><p>Try reversible logic next.</p></main>");
    write("inbox/202-rust-owls.html", "<main><p>And read this.</p></main>");
    const prep = w.node(w.lab, ["tools/prepare.mjs"], "2026-11-21T02:00:00Z");
    assert.match(prep, /light run, \$1\.50 on claude-haiku-5-5, 2 steer\(s\), 1 open question/);
    const run = JSON.parse(read("state/run.json"));
    assert.match(read("state/tonight.md"), /Try reversible logic next\./);

    // The shift, played by a script.
    write("state/steers.jsonl", `${JSON.stringify({ steer: run.steers[0].id, action: "made q-002" })}\n`);
    write("state/claims.jsonl", `${JSON.stringify({ id: "c-001", question: "q-001", stage: "conjecture", statement: "x", at: "2026-11-21T03:00:00Z" })}\n`);
    write("outbox/lab-2026-11-21-first-look.md", "---\nkind: notebook\nquestion: q-001\n---\n\n**First look**\n\nWhat the lab will try first.\n");
    write("outbox/lab-2026-11-21-bad.md", "---\nkind: notebook\n---\n\n| a | b |\n|---|---|\n| 1 | 2 |\n");
    write("outbox/032-cobalt-martens.md", "---\nkind: notebook\n---\n\nAn attempt on the PI's own note.\n");
    write("MORNING.md", "# 2026-11-21\n\nPublished a first look.\n");
    write("state/claude-output.json", JSON.stringify({ total_cost_usd: 0.42, num_turns: 9, is_error: false }));
    const settled = w.node(w.lab, ["tools/settle.mjs"], "2026-11-21T03:30:00Z");
    assert.match(settled, /\$0\.42, 1 claim\(s\), published lab-2026-11-21-first-look/);

    assert.ok(existsSync(join(w.kino, "notes/lab-2026-11-21-first-look.html")));
    assert.ok(!existsSync(join(w.kino, "notes/032-cobalt-martens.html")), "never writes over a note that isn't the lab's");
    assert.ok(existsSync(join(w.lab, "outbox/rejected/lab-2026-11-21-bad.md")));
    const morning = read("MORNING.md");
    assert.match(morning, /Not published: lab-2026-11-21-bad uses a table/);
    assert.match(morning, /Not published: 032-cobalt-martens — not a lab note name/);
    assert.match(morning, /Steers not handled, offered again tomorrow: inbox:202-rust-owls/);
    w.commit();

    // kinocomputing's Action and deploy take the note.
    w.node(w.kino, ["tools/build-stream.mjs", "--state"], "2026-11-21T03:40:00Z");
    w.node(w.kino, ["tools/build-stream.mjs"], "2026-11-21T03:41:00Z");
    const registry = JSON.parse(readFileSync(join(w.kino, "blyg/_registry.json"), "utf8")).items;
    const entry = registry["lab-2026-11-21-first-look"];
    assert.ok(entry, "registered");
    const doc = JSON.parse(readFileSync(join(w.kino, "dist/items", `${entry.id}.json`), "utf8"));
    assert.deepEqual(doc.generated, [{ sources: [], model: "claude-haiku-5-5", at: "2026-11-21T03:30:00Z" }]);
    assert.match(readFileSync(join(w.kino, "dist/first-look.html"), "utf8"), /class="generated-mark"/);

    // Night 2. The missed steer comes back; the shift tampers with a claim and updates its note, pinned.
    w.node(w.lab, ["tools/prepare.mjs"], "2026-11-22T02:00:00Z");
    const run2 = JSON.parse(read("state/run.json"));
    assert.deepEqual(run2.steers.map((s) => s.id), [run.steers[1].id], "only the missed steer is offered again");
    write("state/steers.jsonl", `${read("state/steers.jsonl")}${JSON.stringify({ steer: run2.steers[0].id, action: "read it" })}\n`);
    write("state/claims.jsonl", `${JSON.stringify({ id: "c-001", question: "q-001", stage: "replicated", statement: "x", at: "2026-11-21T03:00:00Z" })}\n`);
    write("outbox/lab-2026-11-21-first-look.md", "---\nkind: experiment\npin: true\nchange_note: ran it on a second dataset\n---\n\n**First look**\n\nIt held on a second dataset.\n");
    write("MORNING.md", "# 2026-11-22\n");
    write("state/claude-output.json", JSON.stringify({ total_cost_usd: 0.3, num_turns: 5, is_error: false }));
    w.node(w.lab, ["tools/settle.mjs"], "2026-11-22T03:30:00Z");
    assert.match(read("MORNING.md"), /1 committed claim line\(s\) were edited or removed; restored/);
    assert.match(read("state/claims.jsonl"), /"stage":"conjecture"/, "the original claim is back");
    assert.equal(JSON.parse(read("state/seen.json")).inbox["202-rust-owls"] !== undefined, true, "handled now, so seen");
    w.commit();

    w.node(w.kino, ["tools/build-stream.mjs", "--state"], "2026-11-22T03:40:00Z");
    const updated = JSON.parse(readFileSync(join(w.kino, "blyg/_registry.json"), "utf8")).items["lab-2026-11-21-first-look"];
    assert.deepEqual(updated.changelog.at(-1), { version: 2, at: "2026-11-22T03:30:00Z", note: "ran it on a second dataset", pinned: true });
    assert.ok(existsSync(join(w.kino, `blyg/items/${updated.id}/v2.json`)), "pinned version written");

    // The spend log feeds tomorrow's budget.
    const spends = read("state/spend.jsonl").trim().split("\n").map((l) => JSON.parse(l));
    assert.deepEqual(spends.map((s) => s.usd), [0.42, 0.3]);
  } finally {
    w.dispose();
  }
});
