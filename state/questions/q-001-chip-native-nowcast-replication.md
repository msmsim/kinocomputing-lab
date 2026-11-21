---
id: q-001
title: Replicate the chip-native nowcasting result on a public pysteps dataset, on a GitHub runner
kind: experiment
status: open
priority: 1
---

The PI's NWP series found that a thermodynamic chip's noise is a like-for-like
replacement for STEPS's own noise in ensemble nowcasting, and that a
"chip-native" nowcaster (deterministic part once, per-scale perturbations from
the chip, AR(2) memory per scale) closes most of the gap to STEPS. The public
write-up is https://www.kinocomputing.com/thermodynamic-computing-doesnt-shortcut-numerical-weather-pr
and its background is https://www.kinocomputing.com/the-nwp-horseshoe.

The code behind it isn't public. A small, independent replication is the lab's
first useful act: one pysteps example dataset, STEPS as the baseline, a
simulated chip sampler (Ornstein–Uhlenbeck settling, as Normal Computing's
thermox models it) for the noise, CRPS and reliability out to an hour. Within
a runner's 2 CPUs and 7 GB.

Pre-register before running: what agreement with the published finding would
count as replicating it, and what would count against it.

## Log

- 2026-11-20 (shift 1): Pre-registered as `experiments/e001-chip-native-nowcast/PLAN.md`
  (headline: fraction of the CRPS gap closed at 60 min, f ≥ 0.5; kill conditions
  in `run.py`). Chip sampler, CRPS and kill decision are written and pass
  `run.py --selftest`. Nothing has run: the pysteps example-data host and
  kinocomputing.com were denied by the sandbox, so neither the data nor the
  published write-up could be read. The forecast path is not written. Open
  for the PI: the reading of "most of the gap" and the naive baseline, both
  to be checked against the write-up.
- 2026-11-21 (shift 3): Ran the 256 × 256 crop (PLAN amendment, 02:15), seed 1, under the 600 s timebox on the Mac. Finished in about 2 minutes. f = 0.163 at 60 min against the pre-registered 0.5: **killed**. STEPS 0.237, naive 0.268, chip 0.263 (mean CRPS, exceedance at 1 mm/h). Window: rows 534–790, cols 235–491, centred on frame 14's rain centroid. Not a replication of the published number: the naive baseline is this lab's construction and the chip is simulated. Seed-2 re-run is for the next shift. Results: `experiments/e001-chip-native-nowcast/RESULTS.md`, claim c-004.
- 2026-11-21 (shift 8, light, focus q-001): seed-2 replication of the crop, run on the runner (the build that failed last night works here now). First attempt was a cache hit: the resume cache was keyed without the seed and returned seed 1's scores; fixed, file name now carries the seed, logged in RESULTS.md. Seed 2 recomputed: f = 0.164, killed. Seed 1 reproduces from scratch: f = 0.163 (Mac 0.163). Added the pre-registered variance-matched arm (PLAN amendment 14:31): a naive ensemble given the chip's pooled spread scores the same as the chip at 60 min on both seeds (f_vm 0.015 and 0.024). So the chip's advantage over the plain naive ensemble on this window is its extra spread. Structure remains untested: a structure-sensitive score is the next step. Claim c-007 (real-data, pending reviewer) and the write-up update.
