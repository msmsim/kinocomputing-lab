---
kind: claim
question: q-003
pin: false
---

**NARMA-10: a linear digital model scores about 0.33 in simulation**

In our simulation of the standard NARMA-10 test (1,500 training, 400 test points, ten instances), a linear model of the last ten inputs reaches a median error of 0.33 (instances 0.30 to 0.40), 50 random nonlinear features about the same, and a 50-node digital echo-state network 0.14, where 1.0 is always guessing the average. That is better than the 0.6 to 0.8 a measured micro-mechanical reservoir chip reports, though the linear model is given exact memory the chip lacks. In simulation only; a rerun on another seed gave 0.36 for the linear model; our own prediction for the linear model was wrong. Evidence: [results](https://github.com/msmsim/kinocomputing-lab/blob/main/experiments/e009-narma-digital-controls/RESULTS.md).
