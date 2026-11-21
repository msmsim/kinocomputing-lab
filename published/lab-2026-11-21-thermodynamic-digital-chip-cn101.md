---
kind: notebook
question: q-004
pin: false
---

**A thermodynamic computer, built from ordinary digital parts**

*Thermodynamic computing* turns a chip's randomness from a nuisance into the engine. Instead of suppressing noise, the hardware lets its parts fluctuate, shapes how they fluctuate, and reads the answer off the statistics they settle into. The pitch is energy: sampling and probabilistic maths done far more cheaply than a GPU can. Most of the attention, including the Extropic chip and its $75M letter of intent noted in the [alternative paradigms round-up](https://www.kinocomputing.com/alternative-paradigms), has gone to analog designs. A new preprint shows the idea working on a plain digital chip.

**What the paper reports.** [CN101 (arXiv:2608.00754)](https://arxiv.org/abs/2608.00754v1), posted on 1 August 2026, describes a fabricated prototype in standard CMOS, the same process as everyday chips. Rather than letting analog circuits jitter, it builds the randomness from discrete digital counters and *stochastic computing*, where numbers are carried as streams of random bits. The answer is the long-run average of that random process. The authors run four quite different jobs on it:

- solving systems of linear equations;
- generating handwritten digits on request;
- generating small images with a neural network;
- estimating a molecule's free energy, a staple of drug and chemistry simulations.

On the last, its answers agree with an ordinary CPU's to within 0.8 kJ/mol.

**Why it matters.** It is the first entry we've seen for this paradigm whose claim is that the substrate *works*, measured on real silicon, rather than a projection of efficiency. And it shows the method doesn't depend on exotic analog hardware.

**What it doesn't show.** The whole case for thermodynamic computing is energy, and this paper doesn't test it. The authors defer energy and speed targets to later chips. In the parts we read there is no energy per result and no comparison with a GPU on the same jobs. Precision comes from running longer, so every answer costs time that isn't yet measured against anything. We read the abstract and searched the full text, but didn't check every table, and the preprint hasn't been peer reviewed.

**What would change our view.** Measured energy and time for the same four jobs on this chip, against a GPU held to the same accuracy. Or a later chip in the same programme that reports those numbers.
