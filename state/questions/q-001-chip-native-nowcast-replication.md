---
id: q-001
title: Replicate the chip-native nowcasting result on a public pysteps dataset, on a GitHub runner
kind: experiment
status: open
priority: 2
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

**What "most of the gap" means (the PI left it to the operator, 2026-11-21).**
In the write-up, "two fixes closed most of the remaining gap": the fixes were
band-limiting the chip's noise to each scale and giving each scale its
two-step memory, and the gap was between the chip-native nowcaster without
them and STEPS. So the reading is: the structured, remembering sampler closes
more than half of the CRPS gap between the same nowcaster with unstructured,
memoryless noise (the naive ensemble) and STEPS. That is the f ≥ 0.5 already
pre-registered, and it stands. It is a lenient bar: the write-up's headline
is near-parity with STEPS (heavy-rain probability matched to an hour), so a
replication that clears 0.5 but stays well short of parity should say so.
The first run's 0.16 is under even the lenient bar. The open problem is the
score, not the bar: pixelwise CRPS at one lead can't see the per-scale
structure and memory the fixes added, so the next run needs a scale-aware
score alongside it.

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
- 2026-11-22 (shift 9, light, focus q-001, unit: the structure-sensitive check the reviewer asked for). The 2026-11-21 shift 8 seed-2 run that the briefing lists as a replication "timed out" for last night's attempt: tonight a seed-2 rerun from scratch on the runner finished in 45 s (f = 0.16375, killed), so the timeout did not reproduce; the cause is not diagnosed (the data fetch was cold, in data/ which is gitignored). Pre-registered the areal CRPS check (PLAN.md, amendment 2026-11-22 07:45): 32 px blocks, 60 min, f_areal = (naive_vm − chip)/(naive_vm − STEPS), supports structure at f_areal ≥ 0.5 on both seeds. Ran seeds 1 and 2: f_areal 0.518 and 0.522 (chip areal CRPS 0.1905 / 0.1879, naive_vm 0.2023 / 0.2022, STEPS 0.1796 / 0.1748). Pixel headline unchanged (killed, f 0.163 / 0.164). Margin over 0.5 is small, one block size, no uncertainty over origins or blocks, no block-level variance-matched arm yet. Results in RESULTS.md (2026-11-22 section). Claim c-008 pending reviewer.
- Next: (1) block-level variance-matched arm (i.i.d. noise with the chip's spread measured at 32 px), pre-registered first, to separate spread from structure at block scale; (2) bootstrap over blocks and origins for the f_areal; (3) a second block size (8 px or 64 px) pre-registered before running, to see whether the 0.5 holds across scale; (4) the seed-2 headline is complete, so no further pixel seeds are needed.
- 2026-11-22 (shift 9), outcome: the areal check's pooled f_areal (0.518, 0.522) met the pre-registered 0.5, but the reviewer found it carried by two of three forecast times (origin 14 is 0.24 and 0.32). Claim c-008 at real-data, verdict weakened, published as `lab-2026-11-22-block-scale-claim` with the window-run write-up updated (change note). Still open: a control that matches spread at 32 px, uncertainty over origins and blocks, and a second block size, each pre-registered before it runs.
