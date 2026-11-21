---
kind: claim
question: q-003
pin: false
---

**Noisy oscillators fall short of a digital reservoir**

In a simulation, 50 coupled, noisy oscillators acting as a *reservoir computer* (a system whose own dynamics do the computing, with only a simple trained readout on top) scored an error of 0.96 on NARMA-10, a standard memory test, where 1.0 is no better than always guessing the average. A tuned digital reservoir of the same size scored 0.15.

How sure: simulation only, one toy model, one task, one range of settings, narrowed after adversarial review. It says nothing about physical reservoirs in general, or about energy. [Code and full results](https://github.com/msmsim/kinocomputing-lab/blob/main/experiments/e002-physical-reservoir-narma10/RESULTS.md).
