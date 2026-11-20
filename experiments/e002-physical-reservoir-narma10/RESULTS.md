# e002 results

Run: 2026-11-20, seed 1, `uv run run.py` (about 75 s on this machine). Raw
output: `result.json`. Replication: `replication.json` (written by the lab
after the run, on SEED = 2).

## What came out

Headline: median test NMSE on NARMA-10 over 5 instances, N = 50 readout
features for both models, each tuned on validation with the same 24-config
grid and the same 4-value ridge grid.

    physical reservoir (coupled noisy oscillators)   median 0.962
    echo-state network (tuned)                       median 0.146
    ratio physical / ESN                             6.6

Per instance (physical / ESN):

    0.872 / 0.194
    0.995 / 0.146
    0.962 / 0.131
    0.979 / 0.138
    0.921 / 0.149

Secondary: break-even energy per oscillator per input step is about
2.3e-10 J (0.23 nJ), under the assumed 4.6 pJ per MAC. This is a threshold to
compare with a device, not a measurement. No instance needed redrawing.

## Against the kill condition

Killed: the physical median (0.962) is above the ESN median (0.146). At the
pre-registered grid, the physical reservoir buys nothing on accuracy in this
simulation, so the prediction (physical ≤ ESN) failed in all five instances.

## What the diagnostic found

Run after the result, from a scratch script outside the experiment. It did
not change `run.py`, the grid or `result.json`.

- The physical features are small (std about 0.05 at the chosen a = 0.5) and
  the oscillators stay in the near-linear regime, where β x³ is negligible.
- Their effective rank is about 3 of 50 (exp of the entropy of the singular
  values). The ESN's chosen configs have effective rank about 5. So the 50
  physical features are close to scaled copies of a few filtered signals,
  and the readout has little to work with. The coupling (k/N)·C is weak at
  every point on the grid.
- The physical chose the largest ridge penalty on the grid (1e-2) in all five
  instances, and the grid edges for k (1.6) and a (0.5 or 4). The grid may
  not reach the regime where coupling mixes the oscillators.
- The ESN baseline is also near-linear at its chosen settings (s = 0.1, so
  tanh sees inputs of at most 0.05). A linear reservoir with the same
  readout reaches test NMSE of about 0.19. NARMA-10 at this input scale is
  mostly a linear-memory task, so this benchmark does not test the
  reservoir's nonlinearity much. That is a limit on the baseline, not a
  reason to read the physical result as a win.

## What didn't work

- The physical reservoir at its pre-registered grid. The kill fired as
  written. No grid, input scale or coupling was changed after seeing this
  result; any change needs a new experiment or a dated section in PLAN.md.
- Tooling: `uv run` warned that the `.python-version` file in the repository
  resolves to Python 3.9.5, below the script's `>=3.11` requirement. The run
  went ahead on that interpreter with numpy and printed no error. The lab
  should pin the interpreter, or `uv run --python 3.11`, before the next
  replication.

## Claim

`c-001` in `state/claims.jsonl`. Stage `simulated`: in simulation, at N = 50
and this grid, the physical reservoir is less accurate than a tuned
same-width ESN on NARMA-10. It is not a claim about physical reservoirs in
general. It doesn't yet say anything about energy. Review: see the claim line.

## Next

- The seed replication on SEED = 2 is the lab's job tomorrow. It checks that
  `killed` comes out the same.
- A stronger test needs a new pre-registered experiment, not a retuned
  e002. It should widen the physical side where the diagnostic points:
  stronger or structured coupling, a nonlinear regime (larger amplitude or
  β), and a measure of feature diversity. It should also widen the ESN side:
  input scales that exercise tanh, as well as the tuned small-input setting.
- A second task (Mackey–Glass, or a memory task with less linear headroom)
  before any claim goes above `simulated`.
- Energy: a device energy per oscillator-step, from a source, against the
  0.23 nJ break-even above. Until then the per-joule question stays open.
