# e001: Does the chip-native nowcaster close most of the gap to STEPS on a public pysteps radar sequence?

Question: q-001. Written before any code runs; never edited after the first
run. A change of plan is a new section at the bottom, dated, saying why.

Status at writing (2026-11-20): nothing has run. The shift that wrote this
could not reach the pysteps example-data host, and could not read the
published write-up at kinocomputing.com. Both are marked below where they
matter. Open items for the PI are in MORNING.md.

## Hypothesis

A chip's noise, used once per forecast for the perturbations, is a near
like-for-like replacement for STEPS's own noise. A "chip-native" nowcaster
(deterministic part computed once; per-scale perturbations drawn from a
simulated chip sampler; AR(2) memory per scale) should recover most of the
CRPS advantage that STEPS has over a naive chip ensemble. The mechanism
being tested is the per-scale structure and memory, not the chip itself:
the naive ensemble has the same marginal noise but no scale structure and
no memory.

## Prediction

Headline metric: the fraction of the CRPS gap closed at a 60-minute lead,
pooled over the evaluation cases:

    f = (CRPS_B − CRPS_chip) / (CRPS_B − CRPS_STEPS)      at lead 60 min

with
- CRPS_STEPS: STEPS with its default settings, `n_ens_members` = 20.
- CRPS_chip: the chip-native nowcaster, same members.
- CRPS_B: the naive chip ensemble — the same deterministic part, perturbations
  i.i.d. per pixel and per timestep with the chip sampler's marginal
  variance, no per-scale structure, no AR memory.

Prediction: f ≥ 0.5, and CRPS_STEPS < CRPS_B. "Most" is read as "more than
half". CRPS is computed on the pixelwise ensemble, averaged over the domain,
evaluated on the rain-exceedance field at 1 mm/h.

Secondary (named as such, not part of the verdict): CRPS at 10, 30 and 60 min
for all three; spread–skill ratio at 60 min for STEPS and the chip (near 1 is
calibrated).

Provisional, to be confirmed by the PI: the reading of "closes most of the
gap" as f ≥ 0.5, and the choice of CRPS_B as the naive chip ensemble. Both
come from q-001's wording. The published write-up was not readable tonight,
so the published numbers and its own baseline are not checked here.

## Kill condition

Killed (`"killed": true`, decided in `run.py`) if any of:
- f < 0.5 at the 60-minute lead;
- CRPS_STEPS ≥ CRPS_B at 60 minutes (no gap to close, so f is undefined);
- CRPS_chip ≥ CRPS_B at 60 minutes (the chip-native model does no better
  than the naive chip ensemble).

## Data

Where it comes from: the pysteps example radar sequence, the one the
pysteps gallery's STEPS example uses. The exact file name is to be fixed in
`run.py` and recorded in a dated section below before the first run.
Source: the pysteps example-data bucket (`pysteps.datasets.download_pysteps_data`).

Size: one sequence, a few hours at 5-minute frames. Cached under `data/`
(gitignored).

Split: forecast origins every 6 frames across the sequence. The first half
of origins fits the AR(2) coefficients per scale (Yule–Walker, from the
per-scale autocorrelation of the STEPS noise). The second half is the
evaluation set and the only set the kill condition reads.

The sequence is real radar data. The chip's noise is simulated, so this is a
simulated sampler on real data, not a chip measurement.

## Method

`run.py`, step by step:
1. Load the sequence; convert to mm/h; take the 1 mm/h exceedance field for
   scoring.
2. Motion: Lucas–Kanade, as pysteps' default. Deterministic part: semi-
   Lagrangian extrapolation of the last observed frame, computed once per
   origin and shared by all three forecasts.
3. STEPS: `pysteps.nowcasts.steps`, default settings, 20 members, from the
   same origin.
4. Chip-native: per-scale perturbations from the simulated chip sampler. Per
   scale k, an Ornstein–Uhlenbeck settling process with timescale τ_k, sampled
   each timestep; AR(2) memory per scale with the fitted coefficients;
   perturbations added to the shared deterministic part.
5. Naive chip ensemble: the same deterministic part and the same marginal
   variance, perturbations i.i.d. per pixel and timestep.
6. Score CRPS (ensemble form) for all three at 10, 30, 60 min on the
   evaluation origins; compute f at 60 min; decide `killed` in code.

SEED draws every random number: the chip sampler, the STEPS members, the
naive ensemble. Replication re-runs on SEED + 1.

## Budget

Runner time: a GitHub runner, 2 CPUs, 7 GB, no GPU. The replication gets
10 minutes. Estimated: STEPS with 20 members over a few dozen origins is the
slow part; cap origins at 24 for the first run if the full set exceeds 10
minutes, and say so in RESULTS.md.

Tokens: the write-up only, from the Haiku shift.

## Threats

- One radar sequence, one region. f could be a property of that sequence.
  The replication should try a second pysteps sequence before anything
  is above `simulated`-on-real-data.
- The chip is a simulation. A real thermodynamic chip's noise is not
  OU-with-AR(2); the result says nothing about physical chips.
- The naive baseline is the weakest point: a weak B makes f look large. If
  the published write-up used a different B, this experiment is not a
  replication of its number, only of its shape.
- The AR(2) coefficients are fitted on the first half of origins. Leakage
  would come from fitting on the evaluation origins; the split is in code.
- STEPS defaults may not be the STEPS the published write-up ran.
- Threshold choice (1 mm/h) and the 60-minute lead could favour one model.
  Secondary leads are reported so a reader can see whether the verdict
  depends on the lead.

## Pre-run decisions (2026-11-21, before the first run)

Written after reading the published write-up
(https://www.kinocomputing.com/thermodynamic-computing-doesnt-shortcut-numerical-weather-pr,
18 Oct 2026), which was reachable tonight, and before any forecast was run.
These fix what PLAN.md left open. Each is a choice, not a result.

- **Sequence.** pysteps' FMI composite, 2016-09-28, 40 five-minute frames,
  14:45–18:00 UTC, from the pysteps-data repository at commit
  `e95a6efae3df33ae8cd1e54e6762ab5f83427a03`. The S3 bucket
  (`download_pysteps_data`) is blocked from this machine, so `run.py` fetches
  the frames from GitHub at that commit instead. I did not confirm that this
  is the exact sequence the pysteps STEPS gallery uses; it is the one the
  repository holds for that date.
- **Origins and split.** Forecast origins at frames 2, 8, 14, 20, 26 (every six
  frames, as above). A 60-minute target needs 12 frames after origin, so the
  last origin is 26. Origins whose targets reach into the fit window are not
  evaluated. Evaluation origins: **14, 20, 26** (targets frames 15–38).
  **Deviation:** PLAN says the first half of origins fits the AR(2) and the
  second half evaluates. With 40 frames that leaves three evaluation origins,
  so the fit is instead on observed frames 0–14 only, which contain no
  evaluated target. Three evaluation origins is a thin test; the verdict is
  fragile.
- **Coverage.** About 24% of pixels have no radar coverage in these files.
  They are set to zero rain.
- **Transform.** Rain rate in mm/h; dB = 10·log10(R) above 0.1 mm/h, −15 dB
  below. Back-transform sends values at or below −10 dB to zero.
- **Deterministic part.** Semi-Lagrangian extrapolation of the last frame,
  velocity from pysteps' Lucas–Kanade on the three input frames in dB. Computed
  once per origin, shared by the chip and naive ensembles.
- **STEPS.** pysteps 1.21.5, default settings, 20 members, `precip_thr` 0.1 mm/h,
  1 km pixels, 5-minute steps.
- **Chip sampler.** Each frame, each pixel settles by OU with τ = 0.1 frame, so
  per-frame samples are effectively independent. Each frame is split into six
  scales with pysteps' Gaussian band-pass filters (partition of unity).
  Each scale then gets its own AR(2) memory in time. Scale standard deviations
  and AR(2) coefficients come from the observed cascade minus the previous
  frame advected once (the residual STEPS models), over frames 0–14.
- **Naive baseline B.** Same deterministic part; i.i.d. Gaussian per pixel and
  per timestep in dB, with total variance equal to the sum of the chip's
  per-scale variances. No scale structure, no memory.
- **Scoring.** As pre-registered: CRPS on the 1 mm/h exceedance field, members
  and observation both thresholded, averaged over the domain, then over
  evaluation origins. Spread–skill at 60 minutes is on rain rate.

**What the write-up does and does not say, for the reading of "most of the gap":**
the write-up reports chip-native skill matching STEPS on heavy-rain probability
out to one hour and on general rain probability out to 30 minutes, across 86
nowcasts from five networks and seven events. It describes two fixes that
"closed most of the remaining gap", but the gap there is between its own
iterations and STEPS, not a naive chip ensemble. It does not name a naive
baseline B, and it does not report CRPS. So B and the CRPS framing here are
this lab's construction, and the replication tests the shape of the claim,
not its published number. The reading f ≥ 0.5 stays provisional, as PLAN says.

**Compute.** Run on the operator's Mac (x86_64), not a GitHub runner. The
forecast path is heavier at this grid (1226 × 760 pixels) than the 10-minute
runner budget assumed. Timing is recorded in RESULTS.md; if it exceeds
ten minutes, the runner replication will need the origin count reduced, and
that will be said there.

## Amendment 2026-11-21 02:15 UTC (after the first run overran)

Seed 1 was stopped by the 10-minute timebox during STEPS's second nowcast step on
the first origin; no origin finished (RESULTS.md, "Run 2026-11-21, seed 1").
The pre-registered grid does not fit the budget on this machine.

The cut, to be run next shift: crop the 1226 × 760 domain to a fixed 256 × 256
window centred on the rain area of frame 14, the same window for every origin
and for all three forecasts. Everything else stays: the sequence, the frames,
the origins (14, 20, 26), the fit window, the baseline B, STEPS defaults, the
kill condition, 20 members. The window is chosen from the fit frames only.

This is a judgement the PI may want to revisit. Cropping reduces the region the
result speaks to: the headline f will describe one 256-pixel window of this
sequence, and the claim will say so.

Not run at the time of writing. The verdict is still open.
