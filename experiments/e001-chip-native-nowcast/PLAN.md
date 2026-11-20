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
