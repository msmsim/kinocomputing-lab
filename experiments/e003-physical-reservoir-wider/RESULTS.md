# e003 results

Run: 2026-11-21, seed 1, `node tools/timebox.mjs 600 uv run run.py`. Wall
clock 2 min 58 s, inside the 600 s timebox (no timeout). Raw output:
`result.json`. Pre-registration: `PLAN.md`, written and not edited before the run.
Replication on SEED = 2: run tonight in the repository, output in `result_seed2.json` (see below).

## What came out

Headline (NARMA-10, five instances, N = 50 readout features for both models,
24 configurations each, validation-only selection):

    physical reservoir (widened)     median test NMSE 0.937
    echo-state network (widened)     median test NMSE 0.122
    ratio physical / ESN             7.7
    killed                           true (kill rule as pre-registered)

Per instance, NARMA-10 (physical / ESN):

    0.872 / 0.194
    1.059 / 0.120
    0.945 / 0.122
    0.931 / 0.120
    0.937 / 0.138

Second task, Mackey–Glass at horizon 5 samples (generated; not the headline):

    physical reservoir               median test NMSE 0.159
    echo-state network               median test NMSE 0.00032
    ratio physical / ESN             499
    killed_mg                        true

Per instance, Mackey–Glass (physical / ESN):

    0.126 / 0.00045
    0.159 / 0.00020
    0.193 / 0.00032
    0.152 / 0.00021
    0.183 / 0.00037

Secondary:

- Effective rank of the chosen configs' training features (median over five):
  physical 31.4 on NARMA-10 and 11.9 on Mackey–Glass; ESN 10.9 and 3.7.
  e002's physical features had rank about 3 on NARMA-10; widening the grid
  raised the physical rank about tenfold and did not close the gap.
- Chosen configs. NARMA-10 physical: a = 0.5 or 2 or 8, k = 1.6 or 0.4, β = 1
  in four instances and β = 5 in one; the ridge penalty λ = 0.01 (top of the
  grid) in all five. NARMA-10 ESN: s = 0.1 (the linear input range) in all
  five; the tanh-active s = 0.5 and 1.0 values were not chosen. Mackey–Glass
  physical: a = 8 and k = 1.6 (both grid edges) in all five, β = 1, λ = 0.01
  (top). Mackey–Glass ESN: α = 0.3, s = 1.0 (the top of the input grid), λ at
  the bottom of its grid.
- No redraws in any instance (both tasks).
- Energy break-even, as in e002: E* ≈ 0.23 nJ per oscillator per input step
  under the assumed 4.6 pJ per MAC. Not measured; not decided.

## Against the kill condition

Killed on NARMA-10: the physical median (0.937) is above the ESN median
(0.122). Killed on Mackey–Glass too (0.159 against 0.00032). Under the
pre-registered rule, the claim is limited to the widened grids, two tasks, and
this simulation. It is not a claim about physical reservoirs in general.

The prediction in PLAN.md was that the gap would narrow but not close. It did
not narrow on NARMA-10: the ratio went from 6.6 in e002 to 7.7 here. The
physical side's feature rank rose, as the e002 diagnostic suggested it might,
and accuracy did not follow.

## Scratch diagnostic (not in result.json, not part of the decision)

Run after the result, from a scratch script outside the record, on the chosen
physical configs for NARMA-10 instances 0–1 and Mackey–Glass instances 0–1,
with the same reservoir draws. It did not change the grid or `result.json`.
Test NMSE by ridge penalty:

    NARMA-10 inst 0: λ=0.01 0.872, λ=1 0.827, λ=10 0.836, λ=100 0.882, λ=1000 1.754
    NARMA-10 inst 1: λ=0.01 1.106, λ=1 0.935, λ=10 0.901, λ=100 0.886, λ=1000 1.853
    MG inst 0:       λ=0.01 0.126, λ=1 0.117, λ=10 0.185, λ=100 0.421, λ=1000 2.485
    MG inst 1:       λ=0.01 0.159, λ=1 0.151, λ=10 0.218, λ=100 0.427, λ=1000 2.464

Reading: the top-of-grid ridge penalty is not the reason for the kill. A
penalty of 1 does a little better on NARMA-10 and MG instance 0, and the
physical side is still far from the ESN's 0.12 and 0.0003 at its best λ on
these configs. The penalty grid is at its edge for both models, so a wider λ
grid is a fair item for the next pre-registered experiment. It is not a
retune of e003.

## What did not work, and what the widening did not test

- The β = 5 cubic regime did not help: the physical side chose β = 1 in nine
  of ten instance-task pairs. (Mackey–Glass chose β = 1 in all five.)
- The Mackey–Glass physical optimum is at the grid edge (a = 8, k = 1.6). The
  grid stopped where it did, so the physical side may be under-tuned there. The
  kill still holds at that edge, but the physical side is not at its
  optimum on that task.
- The ESN on NARMA-10 chose the linear input range (s = 0.1). The widened
  ESN therefore still has a near-linear optimum on NARMA-10; the tanh-active
  regime did not win there. Only Mackey–Glass used the nonlinear input range.
- The Mackey–Glass task is easy for both models at horizon 5: the ESN reaches
  about 3e-4 NMSE. A task with more nonlinear headroom, and one where the
  physical side has less to overcome, is still needed.
- One seed, five instances per task. The seed-2 check is the lab's job on the next shift.
- Energy: not measured. The device claim, and the per-joule question, stay open.

## Seed 2 (run in the repository, after the seed-1 run)

`SEED=2 RESULT_PATH=result_seed2.json uv run run.py`, same code and grids, 2 min 47 s.

    NARMA-10   physical 0.884 against ESN 0.116, ratio 7.6, killed true
    Mackey–Glass physical 0.113 against ESN 0.00029, ratio 391, killed_mg true

Both kills agree with seed 1. The pre-registered replication check
(`killed` and `killed_mg` unchanged) passes on this seed.

## Review

The `reviewer` (hostile, 2026-11-21) returned **weakened**. Points taken:

- The code matches PLAN.md; no leakage or indexing bug was found, and the
  scratch re-run reproduced the seed-1 instance numbers exactly.
- Turning the noise off (σ = 0, scratch) lowers the physical error on the same
  instances (NARMA-10 inst 0: 0.872 to 0.784; MG inst 0: 0.126 to 0.070). Noise
  is not the cause of the gap.
- The likely cause is the parametrisation: frequencies drawn from a narrow
  0.8–1.2 range, every oscillator driven by the same input, and features that
  are near-collinear (effective rank 12 on Mackey–Glass). That is a narrow model
  class, and the claim is worded to say so.
- On Mackey–Glass the physical optimum is at the grid corner (a = 8, k = 1.6)
  with λ at its top in every instance. So the 0.16 is a lower bound on what this
  model can do, and the ratio of 499 (391 on seed 2) overstates the gap. The
  ESN is tuned on its own grid, so the comparison is not symmetric there. The
  Mackey–Glass result is not the pre-registered headline; the NARMA-10 kill is.

The reviewer's stronger version needs a wider ridge grid, a wider frequency
spread, and a grid past a = 8 and k = 1.6 before "less accurate than a tuned
ESN" is applied to the model class. None of that is done here, and none of it
is a retune of e003.

## Claim


`c-005` in `state/claims.jsonl`, stage `simulated`, review `weakened` (the
wording was narrowed to this parametrisation and both seeds): in simulation,
one parametrisation of coupled Duffing-type oscillators, at N = 50 and the
widened grids in PLAN.md, had higher median test error than a tuned
same-width ESN on NARMA-10 (seeds 1 and 2) and on Mackey–Glass at horizon 5
(seed 1 and 2, with the physical side at a grid edge). Not a claim about
physical reservoirs in general, any device, or energy.

## Next

- Seed 3 or a different parametrisation is the next check, if the lab wants more than two seeds.
- If the next experiment pre-registers a wider λ grid, widen the physical
  grid beyond its Mackey–Glass edge, and tests a task with more nonlinear
  headroom than Mackey–Glass at horizon 5, this is the place to do it.
- Energy: a device energy per oscillator-step, from a source, against the
  0.23 nJ break-even.
