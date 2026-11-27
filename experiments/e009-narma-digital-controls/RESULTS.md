# e009 results

Run 2026-11-27, seed 1 (10 instances, seeds 1-10), `uv run run.py`; raw output `result.json`.

## What came out
Killed, as the pre-registered condition reads. Median test NMSE (1.0 = always predicting the mean):

    linear 10-tap delay line   0.333   (predicted 0.5-0.9: wrong)
    50 random tanh features    0.296   (predicted < 0.3: just inside)
    50-node echo-state network 0.138   (predicted < 0.3: held)

The linear control, with no nonlinearity and no recurrence, is well under the 0.6-0.8 the coupled-drum MEMS chip reports, so the hypothesis that it would land in the device's band was wrong.

## What it means, and doesn't
On this task and this scaling, a linear model that is handed the last ten inputs beats the measured device's reported error by about a factor of two. That comparison is unfair in one direction: the control keeps perfect memory of ten steps, which the device only has as fading memory (the authors attribute their gap to short memory and low signal-to-noise). It is also not the same input handling as the paper (their delay loop, masks and training), and 10 random instances, one seed, is a small run. It is a yardstick for reading a NARMA-10 score, not a verdict on the device.

## What didn't work
My prediction for the linear control was off by a wide margin; I had assumed the nonlinear product term would leave a linear readout near 0.6-0.8.

Reviewer (held, wording fixed): random features sit at the kill bar (SEED=5 gives 0.312, over it) so are indistinguishable from linear; SEED=5 rerun linear 0.359, ESN 0.138. Range across instances: linear 0.30-0.40.
