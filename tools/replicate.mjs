// After the shift, before anything with a credential: re-run every experiment
// whose result is new, on a different seed, and say whether it came out the
// same way. Spends no tokens — it's the experiment's own code, run again.
//
//   node tools/replicate.mjs
//
// The experiment contract (experiments/_template/): `run.py` reads the seed
// from SEED and writes its result to RESULT_PATH as JSON:
//
//   { "metric": "...", "value": 0.42, "seed": 1, "killed": false, ... }
//
// where `killed` says whether the result met the kill condition the PLAN
// pre-registered. A replication agrees when `killed` comes out the same.
// That's mechanical evidence for the `replicated` stage on the seed axis —
// necessary, not sufficient: a second dataset or method is still the agent's
// job, and the reviewer's.
//
// Writes experiments/eNNN-*/replication.json (keyed to the result it checked,
// so a changed result is checked again) and state/replications.json, the
// night's list, for settle's report and tomorrow's briefing.

import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LAB, hash8, json, now, readJson } from "./lib.mjs";

const PER_RUN_MS = Number(process.env.REPLICATE_TIMEOUT_MS ?? 10 * 60_000);
const TOTAL_MS = Number(process.env.REPLICATE_TOTAL_MS ?? 30 * 60_000);
const COMMAND = (process.env.REPLICATE_CMD ?? "uv run --quiet run.py").split(" ");

export function replicateAll(lab = LAB, at = now()) {
  const dir = join(lab, "experiments");
  const done = [];
  if (!existsSync(dir)) return done;
  const started = Date.now();
  for (const name of readdirSync(dir).filter((d) => /^e\d+/.test(d)).sort()) {
    const exp = join(dir, name);
    const resultPath = join(exp, "result.json");
    if (!existsSync(resultPath) || !existsSync(join(exp, "run.py"))) continue;
    const raw = readFileSync(resultPath, "utf8");
    const of = hash8(raw);
    if (readJson(join(exp, "replication.json"), null)?.of === of) continue;
    if (Date.now() - started > TOTAL_MS) { done.push({ experiment: name, skipped: "out of time tonight" }); continue; }

    let original;
    try {
      original = JSON.parse(raw);
    } catch {
      done.push({ experiment: name, error: "result.json isn't JSON" });
      continue;
    }
    const seed = Number.isInteger(original.seed) ? original.seed + 1 : 2;
    const scratch = mkdtempSync(join(tmpdir(), "replicate-"));
    const out = join(scratch, "result.json");
    const run = spawnSync(COMMAND[0], COMMAND.slice(1), {
      cwd: exp,
      env: { PATH: process.env.PATH, HOME: process.env.HOME, SEED: String(seed), RESULT_PATH: out, REPLICATION: "1" },
      encoding: "utf8",
      timeout: PER_RUN_MS,
    });
    let record;
    if (run.status !== 0 || !existsSync(out)) {
      record = { of, seed, at, agrees: false, error: run.error?.code === "ETIMEDOUT" ? "timed out" : (run.stderr || "no result written").trim().slice(-500) };
    } else {
      try {
        const again = JSON.parse(readFileSync(out, "utf8"));
        record = { of, seed, at, metric: again.metric ?? original.metric, original: original.value, value: again.value,
          killed: !!again.killed, agrees: !!again.killed === !!original.killed };
      } catch {
        record = { of, seed, at, agrees: false, error: "the replication's result isn't JSON" };
      }
    }
    rmSync(scratch, { recursive: true, force: true });
    writeFileSync(join(exp, "replication.json"), json(record));
    done.push({ experiment: name, ...record });
  }
  return done;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const done = replicateAll();
  writeFileSync(join(LAB, "state/replications.json"), json(done));
  console.log(`replicate: ${done.length ? done.map((d) => `${d.experiment} ${d.error ? `failed (${d.error.split("\n")[0]})` : d.skipped ?? (d.agrees ? "agrees" : "disagrees")}`).join("; ") : "nothing new"}`);
}
