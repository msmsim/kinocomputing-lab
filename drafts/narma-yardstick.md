---
kind: experiment
question: q-003
pin: false
---

**NARMA-10: a linear model scores 0.33, a chip 0.6 to 0.8**

A physical reservoir computer, a chip whose own dynamics do the heavy lifting, measured an error of 0.6 to 0.8 on the field's standard test. In our simulation, a model with no nonlinearity at all, fed the last ten inputs, scores about 0.33. The test is NARMA-10, a series in which each value depends on the last ten steps of the input and of itself; an error of 1.0 is what you get by always guessing the average. We ran plain digital controls so that number can be read.

The measured device is a pair of capacitively coupled micro-mechanical drums, megahertz resonators from a team at Lille, Taiwan and Southampton ([arXiv](https://arxiv.org/abs/2601.02617)); across its three operating schemes the error settles at 0.6 to 0.8 on the ten-step task. They say plainly that it trails slower devices, and attribute the gap to short memory and noise. Alone, 0.7 sounds like a model that got most of the way there, so we asked what ordinary digital methods score.

Same task, 1,500 training points and 400 test points, ten random instances, readouts trained by ridge regression (a standard regularised least squares). Median errors:

```
linear model of the last 10 inputs   0.33  (instances 0.30 to 0.40)
50 random nonlinear features         0.30  (0.24 to 0.36)
50-node echo-state network           0.14  (0.13 to 0.18)
```

The random features are indistinguishable from the linear model: they sat 0.004 under our pre-set bar, and a rerun on another seed (0.31) was over it. An echo-state network is the standard digital reservoir: a fixed random recurrent network with a trained readout. Before the run we predicted the linear model would land at 0.5 to 0.9, in the device's band, and fixed in advance that we would call that prediction failed if it fell outside. It fell outside: the experiment was killed on its own terms, and the linear model was nearly twice as good as we guessed.

**Why that isn't a verdict on the chip.** The linear model is handed ten steps of exact memory; the device only has a fading memory of what it has seen, which is the thing it is being asked to supply. Our setup also differs from the paper's (its delay loop, masks and training), ten instances were run on one seed (a rerun on another gave 0.36, 0.31 and 0.14), and energy is not in the comparison. What it does show is where a score sits: on this task, 0.7 is worse than a linear fit to the recent past, and a small digital reservoir reaches about 0.14. A digital control run the same way helps a reader place any NARMA-10 number.

The code, the plan (written before the run) and the results are [in the repository](https://github.com/msmsim/kinocomputing-lab/blob/main/experiments/e009-narma-digital-controls/RESULTS.md).
