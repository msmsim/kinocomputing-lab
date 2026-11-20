# e002: Does a simulated physical reservoir match a same-width digital echo-state network on NARMA-10?

Question: q-003. Written before any code runs; never edited after the first
run. A change of plan is a new section at the bottom, dated, saying why.

Status at writing (2026-11-20): nothing has run. No real data is needed:
NARMA-10 is generated, and the physical reservoir is a simulated model, not a
device. Every claim from this experiment is a simulation claim.

## Hypothesis

A network of coupled, noisy, nonlinear oscillators, driven by an input and
read out linearly, has enough nonlinear memory to predict NARMA-10 about as
well as an echo-state network (ESN) with the same number of readout features
and the same number of trainable and fixed parameters. The mechanism tested
is whether the physical dynamics (oscillator nonlinearity, coupling, noise)
do the same work as the ESN's tanh recurrence. If they do, the question of
per-joule advantage is open and rests on a device energy that this
simulation does not measure. If they don't, a physical reservoir buys nothing
on accuracy here, whatever its energy.

## Prediction

Headline metric: median over 5 instances of the test NMSE on NARMA-10,
physical reservoir against tuned ESN, both with N = 50 readout features.

    NMSE = mean((ŷ − y)²) / var(y)      on the test split

Prediction: median NMSE_phys ≤ median NMSE_ESN. I expect this to be close to
a coin flip: a tuned ESN is strong on NARMA-10, so the physical reservoir
would need its coupling and noise to be doing useful work.

Secondary (reported, not decided in code):
- ratio r = median NMSE_phys / median NMSE_ESN. "Competitive" if r ≤ 1.5.
- Break-even energy per oscillator per input step (see Budget). The per-joule
  question is answered only by this number and an assumed device energy, not
  by the simulation.

## Kill condition

Decided in code, in `run.py`:

    killed = median NMSE_phys > median NMSE_ESN

Killed means: at matched readout width and equal tuning budget, the physical
reservoir is less accurate than the ESN, so it buys nothing on accuracy in
this setting. That is the result that would say physical reservoirs buy
nothing here.

## Data

NARMA-10 (Atiya & Parlos 2000 form), generated, not downloaded:

    y(t+1) = 0.3 y(t) + 0.05 y(t) Σ_{i=0..9} y(t−i) + 1.5 u(t−9) u(t) + 0.1,
    u(t) ~ Uniform(0, 0.5)

Each instance is 100 washout steps, 2000 training, 1000 validation, 1000 test
steps. Sequences where any value is non-finite or above 10 are redrawn, and
the number of redraws is recorded. Both models see the same u and y in each
instance. Five instances per run, drawn from the SEED.

This is a standing-in task: NARMA-10 is the standard test of nonlinear memory
for reservoirs, not of any particular application.

## Method

Both models: state of N = 50 readout features, linear readout (ridge
regression with bias) fitted on the training split, λ chosen on validation.
Only the readout is trained. Equal tuning budget: each model gets the same
number of configurations, chosen on validation only; the test split is read
once, for the chosen configuration.

Physical reservoir (N = 50 oscillators, Euler–Maruyama, dt = 0.02, 10
substeps per input step, so each input is held for 0.2 time units; features
are the displacements x_i sampled at the end of each input step):

    dx_i = v_i dt
    dv_i = (−γ v_i − ω_i² x_i − β x_i³ + (k/N) Σ_j C_ij x_j + a m_i u(t)) dt + σ dW_i

- γ = 0.2, β = 1.0, σ = 0.01 fixed.
- ω_i ~ Uniform(0.8, 1.2), m_i ~ Uniform(−1, 1), C_ij ~ N(0, 1), drawn per
  instance (the device's fixed parameters; not trained).
- Grid (24 configurations): a ∈ {0.5, 1, 2, 4} × k ∈ {0.05, 0.1, 0.2, 0.4, 0.8, 1.6}.
- Ridge λ ∈ {1e-8, 1e-6, 1e-4, 1e-2}, chosen on validation.

ESN (N = 50, leaky tanh):

    x(t+1) = (1 − α) x(t) + α tanh(W x(t) + s W_in u(t))

- W: N × N Gaussian, rescaled to spectral radius ρ. W_in: Uniform(−1, 1).
- Grid (24 configurations): ρ ∈ {0.4, 0.6, 0.8, 0.95} × α ∈ {0.3, 0.6, 1.0} × s ∈ {0.1, 0.5}.
- Ridge λ ∈ {1e-8, 1e-6, 1e-4, 1e-2}, chosen on validation.

Parameter count: ESN has N² recurrent + N input weights = 2550. Physical has
N² coupling + N input mask = 2550, plus N device frequencies ω_i that are
fixed, not trained. Both have N readout weights, trained.

RNG: all draws come from `numpy.random.default_rng` seeded by (SEED, instance).
After a real run, the lab re-runs with SEED + 1 and checks that `killed`
comes out the same.

## Budget

Runner: a few seconds per instance on a laptop-class CPU; well under the
10-minute limit. Tokens: a light shift.

Energy break-even (secondary, computed in code, not decided by it). Assumed:
e_MAC = 4.6 pJ per multiply-accumulate in digital hardware (an order-of-
magnitude figure from the usual 45 nm estimates; not checked against a
source in this shift). The ESN costs N² + N MACs per input step, so
E_ESN,step = 2550 × 4.6 pJ ≈ 11.7 nJ. The break-even energy per oscillator per
input step, at which a physical reservoir of N oscillators spends the same
energy as the ESN, is E* = E_ESN,step / N ≈ 0.23 nJ. The readout (N MACs in
both) is identical and excluded. Reported as E* only: the simulation does not
measure any device's energy.

## Threats

- The physical model is a toy. A real device's noise, coupling and nonlinearity
  differ, and the result says nothing about any particular device.
- The ESN is small (N = 50) and tuned on a grid of 24. A bigger ESN would be
  stronger. The physical reservoir gets the same grid size, so the comparison
  is fair at this scale, not in general.
- One task (NARMA-10). Other memory tasks (Mackey–Glass, Santa Fe) could
  favour either side. This is the first of several.
- Five instances is a small sample; the median is reported, the spread too.
- Energy: the break-even number is driven by the assumed e_MAC and by an
  assumed device energy that nothing here measures. Read it as a threshold to
  compare with a real device, not as a result.
- Most likely source of a false "physical wins": the physical grid or noise
  happens to suit these instances. The replication on SEED + 1 and a second
  task are the first checks.
