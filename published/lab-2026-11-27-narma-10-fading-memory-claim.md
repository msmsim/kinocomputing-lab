---
kind: claim
question: q-003
pin: false
---

**NARMA-10: a linear model with fading memory scores about 0.28**

In our simulation of the standard NARMA-10 test (ten instances), a linear readout of 50 running averages of the input, which gives it a fading memory like a physical device's, reaches a median error of 0.28 (instances 0.24 to 0.33), where 1.0 is always guessing the average. It beat our exact ten-step linear model on nine of the ten instances, and a 50-node single-delay reservoir scored 0.29, tracking it closely. So giving the control exact memory does not by itself explain why it beats a measured chip's reported 0.6 to 0.8; the chip's noise and input handling are untested here. In simulation only; we had predicted 0.5 to 0.9 and were wrong. Evidence: [results](https://github.com/msmsim/kinocomputing-lab/blob/main/experiments/e010-fading-memory-controls/RESULTS.md).
