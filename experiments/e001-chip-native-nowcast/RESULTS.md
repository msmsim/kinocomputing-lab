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

## Run 2026-11-21 02:24–02:27 UTC, seed 1, 256 × 256 crop (the 02:15 amendment)

Command: `SEED=1 CROP=256 node tools/timebox.mjs 600 /tmp/claude-501/pyst/bin/python run.py`
on the operator's Mac (x86_64), pysteps 1.21.5. Log: `run_seed1_crop256.log`.
Result: `result.json`. Finished in about 2 minutes, inside the timebox.

The window: rows 534–789, columns 235–490 of the 1226 × 760 grid, centred on the
1 mm/h exceedance centroid of frame 14 (a fit frame). In frame 14, 0.33 of the
window exceeds 1 mm/h against 0.06 over the full domain, so the window is the
rainy part of the sequence, not a typical one.

Scores (mean over origins 14, 20, 26; CRPS on the 1 mm/h exceedance field):

| lead | STEPS | naive chip ensemble | chip-native |
|---|---|---|---|
| 10 min | 0.1179 | 0.1183 | 0.1209 |
| 30 min | 0.1799 | 0.2016 | 0.1988 |
| 60 min | 0.2373 | 0.2675 | 0.2626 |

f at 60 min = (0.2675 − 0.2626) / (0.2675 − 0.2373) = **0.163**.
Pre-registered: killed if f < 0.5 (also if STEPS ≥ naive, or chip ≥ naive;
neither is true). **killed: true**, decided in `run.py`.

Per origin, 60 min, STEPS / naive / chip: origin 14: 0.233 / 0.287 / 0.282;
origin 20: 0.248 / 0.275 / 0.269; origin 26: 0.231 / 0.241 / 0.237.
The chip beats the naive ensemble at 60 min on every origin, but only by a
small margin; at 10 min it is worse than the naive ensemble.

Spread–skill at 60 min: chip 0.75, naive 0.58. Both are below 1, so both are
under-dispersed; the chip is closer to calibration than the naive ensemble. STEPS:
not computed. See the note below.

### Note: NaNs in STEPS output (affects a secondary metric only)

STEPS's output has NaN pixels outside its advected domain, rising with lead
(3% at 5 min, 28% at 60 min, measured on origin 12 with two members, as a scratch check). In the
exceedance CRPS, NaN compares as dry; the chip and naive ensembles'
extrapolation fills out-of-domain pixels with NaN too, which `to_db` also
maps to dry. So all three ensembles treat out-of-domain pixels the same way
in the headline. The spread–skill for STEPS is `None` because its ensemble
mean is NaN. This was not patched after the run, so the figure stays absent,
not recomputed. Fixing the NaN handling in scoring would be a change to the
scoring after a result, and it is not made here.

### What this run is, and is not

- One seed, one 256-pixel window of one sequence, three origins. The window
  was chosen by rule (centroid of frame 14's rain), not picked by hand, but it
  is still a single window, and a rainy one.
- The naive baseline B is this lab's construction (PLAN.md, pre-run decisions).
  The published write-up does not name one, so the number is not a
  replication of the published number.
- The chip is simulated (OU settling with AR(2) memory per scale). The result
  is about that model, not a physical chip.
- A seed-2 check is needed before the verdict is treated as stable. The lab
  re-runs it on the next seed, as AGENT.md says.
- Killed by the pre-registered rule. The kill is recorded as the result,
  not as a setback. The earlier full-grid attempt remains an operational
  setback, in the journal.

Claim: see state/claims.jsonl (c-004).

## Run 2026-11-21 14:26–14:32 UTC, seeds 1 and 2 on the GitHub runner, 256 × 256 crop, with the variance-matched arm

Pre-registered in PLAN.md's amendment of 14:31 (the `naive_vm` arm). The
headline f, the kill rule and the claim threshold are unchanged. `naive_vm` is
reported beside them and does not enter `killed`.

**Seed-2 cache bug, and what it did.** The first seed-2 attempt (14:27) returned
seed 1's value to fifteen digits (0.162937158111855). The cause was the resume
cache: per-origin parts were keyed by origin, crop and member count but not by
seed, so the run loaded seed 1's parts. That attempt is not a replication. Its
result file was removed and its log kept as `run_seed2_crop256_CACHE_BUG.log`.
The key now includes the seed. Seed 2 was recomputed from scratch (and once
more after the arm was added); the seed-1 parts from the Mac are kept under
`_s1` names.

**Reproduction.** Seed 1 was rerun from scratch on the runner, in a scratch
directory, before the arm was added: f = 0.162984 (Mac: 0.162937). The
difference is in the fourth significant figure and is floating-point noise
from the machine. Same kill.

| run | f at 60 min | killed | f_vm (reported) |
|---|---|---|---|
| seed 1, Mac (`result.json`, pre-arm) | 0.1629 | yes | not computed |
| seed 1, runner, pre-arm (scratch) | 0.1630 | yes | not computed |
| seed 1, runner (`result_seed1_crop256_runner.json`) | 0.1630 | yes | 0.015 |
| seed 2, runner (`result_seed2_crop256.json`) | 0.1637 | yes | 0.024 |

f_vm = (naive_vm − chip) / (naive_vm − STEPS) at 60 minutes, the same formula
as f with the variance-matched ensemble in place of the naive one.

**Mean CRPS at 60 minutes, exceedance of 1 mm/h, three origins (lower is better):**

| run | STEPS | naive | chip | naive_vm |
|---|---|---|---|---|
| seed 1 | 0.2373 | 0.2675 | 0.2626 | 0.2630 |
| seed 2 | 0.2330 | 0.2672 | 0.2616 | 0.2623 |

At 10 minutes and 30 minutes the variance-matched ensemble also sits within about
0.003 of the chip (for example at 30 minutes, seed 1: chip 0.1988, naive_vm
0.1990, naive 0.2016).

**Spread–skill at 60 minutes (ratio; 1 is calibrated):**

| run | chip | naive | naive_vm |
|---|---|---|---|
| seed 1 | 0.75 | 0.58 | 0.75 |
| seed 2 | 0.81 | 0.58 | 0.78 |

The pooled RMS of the chip's dB perturbation is about 2.8 (seed 1) and 2.9
(seed 2) on every origin, so `naive_vm` has the chip's marginal spread.

**Reading.** On this one window the chip-native sampler's advantage over the
naive ensemble is the extra spread. Give the naive ensemble the chip's marginal
variance and it scores the same as the chip at 60 minutes, on both seeds. The
chip's scale structure and memory add nothing measurable to pixelwise CRPS
here. This does not show the chip's structure is useless: pixelwise CRPS at one
lead is blind to spatial coherence and to memory across leads, which is what
the chip was built for. A structure-sensitive score is still open.

**Stage.** Claim c-004 stays `refuted` (scoped to this window and construction).
The variance-matched result is a further narrowing and is recorded separately.

**Review of this section (hostile reviewer, 2026-11-21, verdict weakened).** The
figures match the result files. Points taken: the chip still leads the
variance-matched arm by 0.0004 (seed 1) and 0.0007 (seed 2), against 0.0049 and
0.0056 over plain naive, so "mostly the spread" is the supported reading, not
"only". The variance-matched arm was added after seeing c-004's spread gap, so it
is a post-hoc diagnostic, disclosed as one. The two seeds share origins and
observations; they are not independent replicates. Pooled RMS was not checked at
lead 60 alone, and there is no uncertainty estimate over origins or pixels. Not
done tonight.
