---
kind: analysis
question: q-010
section: audits
pin: false
---

**Do reservoir computers work best at the edge of chaos?**

Not reliably. A rule of thumb for designing reservoir computers, that they perform best at the boundary between orderly and chaotic behaviour, has been tested in simulation twice, in 2020 and again in July 2026, and the boundary did not reliably pick the best setting. The idea survives as a loose heuristic. As a recipe for tuning a physical device, it is overstretched.

**The story as told.** A reservoir computer is a fixed, rich dynamical system (a tangle of coupled nonlinear nodes) whose state is read out through one trained linear layer. The standard advice is to set it "at the edge of chaos": tuned so that small disturbances neither die away at once nor blow up. The intuition is a balance, as a 2026 paper puts it: too much contraction kills the variety of response, too much instability destroys memory and reproducibility.

**Where it comes from.** Thomas Carroll, below, traces the idea to Norman Packard (1988) and Chris Langton ([*Physica D* 42, 1990](https://doi.org/10.1016/0167-2789(90)90064-V)), whose work concerned cellular automata, and describes its root as the way low-dimensional maps grow more complex as they approach chaos, with greater capacity to compute. The 2026 paper below calls it a "guiding principle" of reservoir design and lists, among the works that adopted it, Bertschinger and Natschläger (2004) and Legenstein and Maass (2007). We have not read any of these original papers, so how the idea passed from automata to reservoirs is our inference from those citations, not something we checked.

**What two simulation studies found.** The second builds on the first.


- Thomas Carroll of the US Naval Research Laboratory [simulated several reservoirs](https://arxiv.org/abs/1906.03186) (published in *Chaos* in 2020). His conclusion: the simulations "certainly do not disprove" the statement, "but they do show that tuning a reservoir computer to the edge of chaos does not guarantee the best performance". In one example the lowest test error sits near the largest Lyapunov exponent (the number that measures how fast nearby states diverge) without that exponent ever crossing zero. Some settings near the edge gave large errors; for some node types he finds being near the edge "necessary but not sufficient". He also notes that in many reservoirs a positive exponent does not mean chaos but divergence to infinity, so "edge of stability" is the better name, and that the idea was built on low-dimensional maps.
- Yao Du and Xingang Wang of Shaanxi Normal University [tested three versions of "the edge"](https://arxiv.org/abs/2607.17909) for forecasting chaotic and quasiperiodic signals: the bare reservoir, the reservoir while being driven by the signal, and the trained reservoir running on its own feedback. The best setting of the spectral radius (the size of the coupling matrix's largest eigenvalue, a standard tuning knob) coincided with none of the three. Reservoirs with a symmetric coupling matrix have no such edge in the range scanned and still have a best setting. They cite earlier work reporting good forecasts from reservoirs with no recurrent links at all, which we did not read.

**What this does and doesn't show.** It shows the edge is not a single place: a reservoir is one system in three operating modes, with different boundaries, and nothing says any of them is the optimum. It does not show the heuristic is useless: Carroll also finds settings at the edge that work, and for one case could not say whether the best setting lay at the edge. Du and Wang's new index is tested on their own three targets, by their own group. All the evidence here is simulation on the same kind of forecasting task; no physical reservoir was tested.

**Why it matters for hardware.** Carroll's closing point is the practical one: a real physical system has a limited range of parameters, so it may not be possible to tune it to the optimum. A device built or selected for "criticality" because that is where reservoirs are supposed to work best carries a claim the simulations don't back. A better yardstick is the task error at the settings the device can reach, which is what a [reservoir benchmark on a fixed task](https://www.kinocomputing.com/lab-2026-11-20-physical-reservoir-narma10) can measure.

We rate the story *overstretched*: a reasonable design heuristic, not a rule for finding the best reservoir. The rating rests on these two simulation studies, the second building on the first; we did not read the original papers or Du and Wang's supplement, and an adversarial check narrowed the wording accordingly.
