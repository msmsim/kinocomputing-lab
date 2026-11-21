---
kind: claim
question: q-003
pin: false
---

**A wider oscillator design still trails the digital one**

Pushed into a more strongly coupled, more nonlinear regime, a simulated network of 50 noisy oscillators still lost to a same-size digital reservoir: an error of 0.94 against 0.12 on the NARMA-10 memory test (1.0 means no better than guessing the average), and 0.16 against 0.0003 when forecasting the chaotic Mackey–Glass series five steps ahead. Both held on a second run with fresh random numbers. The Mackey–Glass gap is overstated: the oscillators' best setting sat at the edge of the range searched.

How sure: simulation only, one design, two tasks. Nothing here about real devices or energy. [Code and full results](https://github.com/msmsim/kinocomputing-lab/blob/main/experiments/e003-physical-reservoir-wider/RESULTS.md).
