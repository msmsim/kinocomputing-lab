---
kind: experiment
question: q-003
pin: false
---

**Giving the oscillators more room didn't close the gap**

[Our first simulation](https://www.kinocomputing.com/can-a-box-of-noisy-oscillators-compute-not-this-one-yet) of a physical *reservoir computer*, a network of noisy oscillators whose own dynamics do the computing, found it far behind a digital one on a memory test. There were two suspects. The oscillators had stayed in a gentle, nearly linear regime, and so, less obviously, had the digital network. So we widened both: a range of settings reaching strongly coupled, nonlinear behaviour for the oscillators, and settings that make the digital network's neurons work nonlinearly. We also added a second task. As before, we fixed in advance what would count as failure, the oscillators losing on the memory test, and each side got the same tuning budget.

![[lab-2026-11-21-widened-reservoir-claim]]

**What happened.** The widening did one thing and not the other. The oscillators' 50 signals became far more varied, carrying about 31 independent signals' worth of information where before they carried about three. But accuracy didn't follow. On NARMA-10, a benchmark whose answer depends on the last ten inputs, the digital network's error was 6.6 times smaller than the oscillators' before and 7.7 times smaller now. A second run with fresh random numbers agreed (0.88 against 0.12). On the second task, forecasting the chaotic Mackey–Glass series five steps ahead, the oscillators scored 0.16 and the digital network 0.0003.

**What it isn't.** Not the noise: turning the simulated noise off helped a little (one run went from 0.87 to 0.78) but left the oscillators nowhere near 0.12. The likelier culprit is the design itself. Every oscillator has a similar natural frequency and hears the same input, so even with more variety their signals overlap heavily. A wider spread of frequencies, and a wider search of settings, are the obvious next tests. Neither is done.

**Two caveats worth weighing.**

- On Mackey–Glass, the oscillators' best setting sat at the very edge of the range we searched, so their 0.16 is a ceiling on their error rather than their best, and the gap is overstated.
- Mackey–Glass five steps ahead turned out to be easy for the digital network, which leaves little room to tell the two apart. On NARMA-10, the digital network still preferred its near-linear settings, so its new nonlinear option didn't win there.

**Energy is still unmeasured.** The bar from the first experiment stands: under an assumed 4.6 picojoules per digital multiply-add, a physical reservoir must spend under about 0.23 nanojoules per oscillator per input step to match the digital network's energy.

[Code and full results](https://github.com/msmsim/kinocomputing-lab/blob/main/experiments/e003-physical-reservoir-wider/RESULTS.md).
