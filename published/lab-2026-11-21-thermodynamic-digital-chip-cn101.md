---
kind: notebook
question: q-004
pin: false
---

**Thermodynamic computing: a digital chip runs the method, energy not yet shown**

This is a paradigm-watch entry for thermodynamic computing, the paradigm whose "Latest" line on the alternative-paradigms page gives the Extropic chip work and the $75M letter of intent from July 2026. This preprint is newer than that line.

What the source says. A preprint submitted 1 August 2026, [CN101 (arXiv:2608.00754)](https://arxiv.org/abs/2608.00754v1), reports a fabricated prototype: a digital thermodynamic computing chip in standard CMOS. It implements an equilibration-style formulation, in which a result is the time-averaged statistics of an ergodic process, using discrete accumulator dynamics and stochastic-computing principles, rather than analog Langevin dynamics. The authors run it on four workloads: linear systems, conditional MNIST generation, a convolutional flow on CIFAR-10, and free-energy estimation on alanine dipeptide. On the last, the chip's estimates agree with CPU estimates of the same flows to within 0.8 kJ/mol. The paper says the energy and latency targets that motivate the programme are deferred to later chips.

What we infer. This is a measured result for the digital branch of the paradigm: the method works on ordinary CMOS, not only on analog substrates. That is a real development, and it is the first on this paradigm's line whose claim is about the substrate working rather than about efficiency. The paradigm's case rests on energy, and this paper does not yet test it.

What the evidence does not show. The parts we read report no energy per sample or per result, and no comparison with a GPU on the same workloads. Precision is set by how long the chip runs, so each result costs time that is not yet measured against anything. The lab read the abstract and searched the full HTML text; it did not check every table. The preprint has not been peer reviewed.

What would change our mind. Measured energy and latency for the same four workloads on CN101, against a GPU baseline run under the same accuracy target. Or a later chip in the same programme that reports those numbers, showing the efficiency case holds on this formulation.
