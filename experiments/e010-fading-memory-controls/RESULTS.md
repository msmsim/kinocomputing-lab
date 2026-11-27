# e010 results

Run 2026-11-27, seed 1 (10 NARMA-10 instances, seeds 1-10), `uv run run.py`; raw output `result.json`. Seed 2 (instances 2-11) run by hand: medians 0.278 and 0.285.

## What came out
Killed, as pre-registered (median NMSE, 1.0 = always predicting the mean):

    linear readout of 50 leaky integrators   0.279   (predicted 0.5-0.9: wrong)
    50-virtual-node delay reservoir          0.287   (predicted 0.15-0.35: held)

Instance range, leaky linear 0.24-0.33; delay reservoir 0.24-0.35.

## What it means, and doesn't
Giving the linear control fading memory did not worsen it; it improved on e009's exact ten-input window (0.33), because 50 timescales reach back further than ten steps. Exact memory in the control therefore does not by itself explain why a simulated linear model beats the chip's reported 0.6-0.8; a noiseless fading-memory one also does. Noise and the chip's input handling are untested, and the setups differ. On the same ten instances the fading-memory model beats e009's ten-input window on 9 (by 0.02-0.13; one instance 0.03 worse). The delay reservoir tracks the linear control closely on every instance, which suggests the small-gain grid left it near-linear; I did not test stronger gains, so this says nothing about what a well-tuned delay reservoir can do. NARMA-10's nonlinear term is small enough that linear-with-memory reaches about 0.28. Caveats: one task, one generator, numpy simulation, not the chip's input handling or noise.

## What didn't work
Both pre-registered predictions for the linear control (e009 and now e010) were too pessimistic about linear models.
