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
