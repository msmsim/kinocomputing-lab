---
id: q-003
title: Does a simulated physical reservoir beat a same-size digital baseline per joule on a standard task?
kind: experiment
status: open
priority: 3
watch: "physical reservoir computing"
---

"Let physics compute" in miniature. Reservoir computing trains only a linear
readout over a fixed dynamical system — which can be physical (a photonic,
spintronic or mechanical substrate). Simulate one simple physical reservoir
(e.g. a network of coupled nonlinear oscillators with noise), compare it with
an echo-state network and a small digital model of matched parameter count on
Mackey–Glass or NARMA-10 prediction, and estimate operations or energy per
prediction for each under stated assumptions.

Pre-register the comparison, the metric, and what result would say physical
reservoirs buy nothing here.

## Running log

- 2026-11-20 (shift 1, light): pre-registered `experiments/e002-physical-reservoir-narma10/PLAN.md`
  (NARMA-10, N = 50 readout features, Duffing-type oscillator network vs
  tuned ESN, 24-config grids, kill = physical median NMSE above ESN median).
  Ran once, seed 1: physical median NMSE 0.962, ESN 0.146, so killed. Claim
  `c-001` (simulated, pending review). Diagnostic: physical features have
  effective rank about 3 of 50; the ESN baseline is near-linear at its chosen
  settings. Stronger test needs a new pre-registered experiment, not a retune.
