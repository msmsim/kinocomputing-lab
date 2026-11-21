# e003: Does a simulated physical reservoir still fall short of a same-width ESN when both are widened, and on a second task?

Question: q-003. Written before any code runs; never edited after the first
run. A change of plan is a new section at the bottom, dated, saying why.

Follows e002 (`experiments/e002-physical-reservoir-narma10/`, claim c-001, killed
on NARMA-10 with the grid written there). e002's own RESULTS.md named what a
stronger test needs: the physical side widened into the nonlinear regime and
the coupled regime, the ESN side widened into the tanh-active regime, and a
second task. This experiment does those three things. It does not retune e002.

Status at writing (2026-11-21): nothing has run. No real data is needed:
both tasks are generated, and the physical reservoir is a simulated model.
Every claim from this experiment is a simulation claim.

## Hypothesis

e002 found the physical reservoir far behind a tuned ESN on NARMA-10. Its
diagnostic named two reasons that may be the grid, not the physics: the
physical features sat in the near-linear regime (β x³ negligible, feature
effective rank about 3 of 50), and the ESN baseline was itself near-linear
(input scale 0.1). If both are true, widening each side into the regime where
its nonlinearity works should narrow the gap. If the gap stays, the e002 result
was not an artefact of the grid at this scale and size.

The mechanism tested: whether a nonlinear physical reservoir with coupling can
match a tanh ESN of the same width when both are allowed to use their
nonlinearity, on a task where linear memory is not enough.

## Prediction

Headline metric: median over 5 instances of the test NMSE on NARMA-10, widened
physical reservoir against widened tuned ESN, both N = 50 readout features.
Same kill rule as e002, now on the widened grids.

Prediction: median NMSE_phys ≤ median NMSE_ESN on NARMA-10. I expect the gap
to narrow but not close: the ESN was never tested with its tanh active, and it
is strong on NARMA-10.

Secondary (reported, not decided in code), on both tasks:
- ratio r = median NMSE_phys / median NMSE_ESN.
- effective rank of the chosen configs' features (exp of the entropy of the
  singular values of the training features), for both models.
- the chosen (a, k, β) and (ρ, α, s), to show where each side landed on its grid.
- break-even energy per oscillator per input step, as in e002.

## Kill condition

Decided in code, in `run.py`. Two tasks, one headline:

    killed = median NMSE_phys(NARMA-10) > median NMSE_ESN(NARMA-10)

That is the e002 rule on the widened grids, so the two results can be compared.
The Mackey–Glass result is reported with its own flag and is not part of the
headline:

    killed_mg = median NMSE_phys(MG) > median NMSE_ESN(MG)

A claim about both tasks is allowed only if neither is killed. If the headline
is killed, nothing is claimed beyond the widened grid on NARMA-10.

## Data

**NARMA-10** as in e002 (Atiya & Parlos 2000 form), generated, not downloaded:

    y(t+1) = 0.3 y(t) + 0.05 y(t) Σ_{i=0..9} y(t−i) + 1.5 u(t−9) u(t) + 0.1,
    u(t) ~ Uniform(0, 0.5)

**Mackey–Glass** (standing in for a chaotic, nonlinear-prediction task, which
NARMA-10 is not), generated, not downloaded:

    dx/dt = 0.2 x(t−τ) / (1 + x(t−τ)^10) − 0.1 x(t),  τ = 17

Integrated by Euler with step 0.1 time units. Initial history is 1.2 plus
N(0, 0.01²) jitter, drawn from SEED. The first 1000 time units are discarded.
Samples are taken every 1 time unit. Input u(t) = x(t) − 1 (about ±0.4).
Target y(t) = x(t + 5), predicting 5 samples ahead. Each instance is 100
washout, 2000 training, 1000 validation, 1000 test samples. Five instances per
run. The number of redraws (sequence fails the finiteness check) is recorded;
for MG it is expected to be zero.

Both models see the same u and y in each instance and each task.

## Method

Both models: state of N = 50 readout features, linear readout (ridge
regression with bias) fitted on the training split, λ chosen on validation.
Only the readout is trained. Equal tuning budget: 24 configurations per model,
chosen on validation only; the test split is read once, for the chosen
configuration. The same four-value ridge grid for both.

**Physical reservoir** (N = 50 oscillators, Euler–Maruyama, dt = 0.02, 10
substeps per input step; features are the displacements x_i at the end of each
input step):

    dx_i = v_i dt
    dv_i = (−γ v_i − ω_i² x_i − β x_i³ + (k/N) Σ_j C_ij x_j + a m_i u(t)) dt + σ dW_i

- γ = 0.2, σ = 0.01 fixed, as in e002.
- ω_i ~ Uniform(0.8, 1.2), m_i ~ Uniform(−1, 1), C_ij ~ N(0, 1), drawn per
  instance (the device's fixed parameters; not trained).
- Widened grid (24 configurations): a ∈ {0.5, 2, 8} × k ∈ {0.1, 0.4, 0.8, 1.6}
  × β ∈ {1, 5}. β = 1 is e002's value; β = 5 is the nonlinear regime
  (cubic term comparable to the linear restoring force at x ≈ 0.5).
  e002's values a = 1, 4 and k = 0.05, 0.2, 0.4 are not in this grid. The
  grid is wider in the directions the diagnostic pointed to, not a retune of
  e002's grid.
- A configuration whose features are non-finite scores validation = ∞.

**ESN** (N = 50, leaky tanh), the same equations as e002:

    x(t+1) = (1 − α) x(t) + α tanh(W x(t) + s W_in u(t))

- W: N × N Gaussian, rescaled to spectral radius ρ. W_in: Uniform(−1, 1).
- Widened grid (24 configurations): ρ ∈ {0.4, 0.6, 0.8, 0.95} × α ∈ {0.3, 1.0}
  × s ∈ {0.1, 0.5, 1.0}. s = 1.0 drives tanh into its nonlinear range on these
  inputs; e002's s = 0.1 is in the grid, the 0.5 and 1.0 values are new.

Parameter count as in e002: 2550 each (N² + N); the physical side's ω_i are
fixed, not trained.

RNG: all draws from `numpy.random.default_rng([SEED, task, instance])`, with
task 0 = NARMA-10 and task 1 = Mackey–Glass. The random structure (W0, Win0, ω,
m, C, noise) is drawn in the same order as e002, but the seeding includes the
task index, so the NARMA-10 draws are not e002's and its numbers are not
reproduced exactly. After a real run, the lab re-runs with SEED + 1 and checks that
`killed` and `killed_mg` come out the same.

## Budget

Runner: about 2–4 minutes for both tasks at 5 instances on a laptop-class CPU,
under the 600 s timebox. If the timebox stops it, the result is reported as
such and the grid is not reduced after the fact; the cut, if one is needed, is
a new dated section written before the next attempt.

Tokens: a light shift. No paid search.

Energy break-even (secondary, computed in code, not decided by it): as in e002.
e_MAC = 4.6 pJ per multiply-accumulate (assumed, not checked against a source
in this shift). E_ESN,step = (N² + N) × e_MAC ≈ 11.7 nJ; E* = E_ESN,step / N ≈
0.23 nJ per oscillator per input step. Reported, not decided.

## Threats

- The physical model is still a toy. A real device's noise, coupling and
  nonlinearity differ, and the result says nothing about any particular device.
- The ESN is small (N = 50) and tuned on 24 configurations. A bigger ESN would
  be stronger. Both sides get 24, so the comparison is fair at this scale only.
- Widening the grid after e002 is a form of tuning on the same instances. It is
  mitigated, not removed, by: the grid being chosen from e002's diagnostic
  before this experiment ran, validation-only selection, and the test split
  read once. The e002 result stands on its own grid and is not replaced.
- Two tasks is still a small set. MG at horizon 5 is a fairly easy chaotic task
  for a linear readout on any reservoir, so it may be uninformative. The
  secondary numbers say how much headroom it leaves.
- Five instances per task is a small sample; the median and the spread are
  both reported.
- The most likely source of a false "physical wins": the physical's β = 5
  regime happens to suit these instances. The seed replication is the check.
