# e007 results

Run: 2026-11-25, seed 1, `uv run run.py`. Raw output: `result.json`. First pass (before the dated plan change): `first-pass-result.json`. Seed 2 gave the same verdict.

## What came out

Not killed: at the middle setting of every assumed constant, converters plus calibration take 96.6% (analog memory) and 99.99% (photonic) of the energy per multiply-accumulate for a 64-32-10 digits classifier. The network itself: 98.0% float, 95.4% at 4-bit weights and 6/8-bit converters; it loses one point when weight noise reaches 4% of the largest weight.

```
small 64-32-10, middle constants, fJ per MAC
analog:   core 5.0     converters 142.7  calibration 0.0009  total 147.7  (converters 96.6%)
photonic: core 0.02    converters 163.0  calibration 100     total 263.0  (converters 62.0% of a total that includes the 100 fJ heater term)
small, all constants at the value least favourable to the prediction
analog:   core 20      converters 35.7   -> converters 64.1%
photonic: core 0.02    converters 39.7   -> 99.95%
large 784-128-10 (energy only), middle
analog:   converters 78.7%   photonic: converters 18.7% of a total that includes the heater term (converters plus heater: 99.98%)
large, least favourable corner
analog:   converters 18.7%   (prediction fails here)   photonic: 99.6%
```

## Against the kill condition
Not killed (smallest share 0.966 against a 0.5 line). But three things limit it. Analog calibration is negligible in this model (about 0.001 fJ per MAC), so for analog the whole result is converters. In the photonic case the heater cost is the least-constrained input, and it was fitted after the first run. The converters' own share of the total swings with it: small network, heater 0 / 0.01 / 0.1 mW per weight gives 99.99% / 62% / 14%; large network gives 99.9% / 19% / 2%. (The heater is itself a tuning, i.e. calibration, cost, so converters plus calibration stays near 100% throughout.) A review also pointed out that an earlier draft of this file mislabelled the 62% and 19% as heater-excluded; they are not. And the analog share falls to 19% for the large network in the least favourable corner (core 20 fJ, cheap converters); the photonic 19% is a different setting (middle constants).

## What didn't work
The first run's photonic heater assumption gave 10 million fJ per MAC, 40,000 times a real chip's 250 fJ per operation; it was replaced after seeing it (see PLAN.md). The new middle value gives 263 fJ per MAC, close to that 250 fJ, which partly reflects that it was chosen to.

## Claim
Stage `simulated`, narrowly worded: in a simple model with assumed constants, converters dominate at small array sizes and shrink with array size; the prediction about calibration is not tested by this model for analog memory. Constants are assumptions, not measurements.
