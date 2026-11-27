---
kind: paradigm
question: q-004
paradigm: physical-reservoir
pin: false
---

**Physical reservoir computing: tiny energy figures, thin comparisons**

Physical reservoir computing lets a material's own dynamics (vibrating membranes, ion-filled nanochannels, transistors) turn a signal into a rich internal state, and trains only a simple linear readout on top.

**Where it stands.** A simulated [fluidic iontronic circuit](https://arxiv.org/abs/2601.14986) predicts a chaotic time series with an error near 0.06 (1.0 is the signal's own spread) at an estimated 15.8 picowatts; the authors note the comparison with earlier hardware leaves out peripheral circuitry. A 2025 [edge-AI review](https://doi.org/10.59717/j.xinn-mater.2025.100127) and a 2026 [memristor review](https://doi.org/10.1002/advs.75476) both stress that low-power claims rarely count sensing, conversion and readout.

**What an outsider can use.** [RCbench](https://github.com/nanotechdave/RCbench) (NARMA, memory capacity), [OpenPRC](https://github.com/DARE-Lab-VT/OpenPRC-dev) (mechanical reservoirs), a [crumpled-paper reservoir](https://github.com/wurui1991/PHRESCO_2026) on an Arduino and phone camera.

**What the lab could test.** Put a digital echo-state network, a delay reservoir and random features through one pipeline, to see how much of a physical advantage survives. Our [oscillator simulation](https://www.kinocomputing.com/lab-2026-11-21-widened-reservoir-claim) is a start.

Checked 27 November 2026; first pass.
