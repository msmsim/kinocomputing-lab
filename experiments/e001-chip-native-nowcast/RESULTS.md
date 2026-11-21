# e001 results

Run: seed 1 attempted 2026-11-21 02:04–02:14 UTC, stopped by the 600 s timebox
(exit 124). No `result.json`, no origin finished, no seed-2 replication.
See the dated section below.

## What came out

Nothing. The forecast path is not written, and the pysteps example radar
sequence could not be fetched from this sandbox. The shift's network rules
denied both the pysteps example-data host and kinocomputing.com, so the
published write-up that PLAN.md's baseline reading depends on could not be
read either.

What does exist and was checked (`uv run run.py --selftest`, passes):
- the ensemble CRPS against the closed form for N(0,1) at y = 0 (0.2337);
- the Ornstein–Uhlenbeck settling's lag-1 autocorrelation and variance;
- the Yule–Walker AR(2) fit, round-trip on known coefficients;
- the AR(2) memory's stationary variance;
- the kill decision (`decide`) on four hand-picked cases.

## Against the kill condition

Not applicable: no forecast, no f, no `killed`. `run.py` exits with status 2
and writes no result when no radar data is present, so replicate.mjs has
nothing to re-run.

## What didn't work

- The sandbox denied pysteps-data (S3) and www.kinocomputing.com. Both
  denials were the user's. Not retried, not routed around.
- `tools/search.mjs` failed with "fetch failed" on both arXiv and OpenAlex,
  though the same APIs answer curl. The arXiv search was done with curl
  instead, for one query. The tool's failure is not diagnosed.
- The first self-test assertion used the wrong closed form for the CRPS of
  N(0,1) at 0 (1/√π, not 2φ(0) − 1/√π). The code was right; the expectation
  was fixed.

## Claim

None. No claim is recorded in state/claims.jsonl, because nothing is
supported yet.

## Next

1. Get the pysteps example sequence onto a runner or into `data/` (the
   sandbox needs the S3 host allowed, or the step runs on the GitHub runner).
2. Read the published write-up, and check the reading of "closes most of
   the gap" and the naive baseline B against it. If the write-up used a
   different baseline, amend PLAN.md in a dated section before the first run.
3. Write the forecast path: pysteps motion (LK), the shared deterministic
   extrapolation, STEPS with 20 members, the chip-native and naive ensembles.
   Pin the pysteps version in the header (PyPI has 1.21.5 as latest).
4. Then run once, check `killed` against a SEED + 1 replication, and only then
   write a claim.

## Run 2026-11-21, seed 1 (timebox overrun)

Command: `SEED=1 node tools/timebox.mjs 600 <pysteps 1.21.5 python> run.py`,
on the operator's Mac (x86_64), log in `run_seed1.log`.

What came out: the data loaded (40 frames, cached), the pysteps motion and
STEPS initialised (1226 × 760 pixels, 20 members, 12 steps, 6 cascade levels),
and STEPS completed nowcast step 1 and started step 2 before the timebox
stopped it. `parts/` is empty: origin 14 did not finish, so nothing was
scored. The timebox is a result: the forecast path, as pre-registered at full
grid and 20 members, does not fit the budget on this machine. Extrapolating
from two steps in ten minutes, one origin alone would take the better part of
an hour, and the full set is three origins.

Against the kill condition: not applicable. No f, no `killed`, no claim.

Caveats on the timing: it is one run on one machine, with the pysteps import
and the Matplotlib font-cache warning included; the per-step time was not
logged separately, so the estimate above is from the log's progress only.

Cut for the next shift (not yet run): PLAN.md's "Pre-run decisions" section
records the amendment. The next shift should not change the sequence,
the split, the baseline or the kill condition, only the domain.
