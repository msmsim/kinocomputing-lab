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
- 2026-11-21 (shift 4, light, focus q-003): pre-registered
  `experiments/e003-physical-reservoir-wider/PLAN.md` before code. It widens the
  physical grid into the cubic (β = 5) and coupled regime, widens the ESN into
  the tanh-active input range, and adds a second task (Mackey–Glass, horizon 5).
  Ran once, seed 1, in 2 min 58 s: NARMA-10 physical median NMSE 0.937 against
  ESN 0.122, killed; Mackey–Glass 0.159 against 0.00032, killed. The physical
  features' effective rank rose (about 3 to 31 on NARMA-10); accuracy did not
  follow. The ridge penalty is at its grid edge for both models, a scratch check
  showed it doesn't reverse the kill. Claim `c-005` (simulated, review weakened; wording narrowed to this
  parametrisation). Seed 2 run in the repository agrees on both tasks.
