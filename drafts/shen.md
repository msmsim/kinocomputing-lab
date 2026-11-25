---
kind: notebook
question: q-010
section: audits
pin: false
---

**Optical neural networks: the "1,000x" figure counts only the light**

An influential 2017 paper on optical neural networks promises energy efficiency "three orders of magnitude" better than electronics. We read the full paper. The number follows from its own arithmetic, but the arithmetic counts the optical power needed to make the light behave nonlinearly, and nothing else. The chip in the paper's own experiment drew far more than the estimate for holding its settings alone. We rate the claim *overstretched*: true as a bound on one cost, wrong as a prediction of what such a system would use.

**The story as told.** [Shen and colleagues (arXiv:1610.02365, Nature Photonics 2017)](https://arxiv.org/abs/1610.02365) built a programmable silicon-photonic chip, an array of 56 interferometers (devices that split and recombine light to do a matrix multiplication), and ran a small neural network on it for recognising four spoken vowels. Its abstract promises a speed gain of at least two orders of magnitude and three orders of magnitude in power efficiency.

**What the paper says.** Three separate things.

- *The experiment.* A network of 4 layers of 4 neurons, 48 trained phase settings. On the 180-case test set it got 138 right (76.7%); the same network simulated on a computer got 165 (91.7%). That is a real demonstration of optical matrix multiplication, with a visible accuracy gap. The paper says its demonstration implements the nonlinear step "in the electronic domain": the light was detected, the nonlinearity applied electronically, and the result injected into the next layer.
- *The speed claim.* "At least two orders of magnitude faster" assumes a 100 GHz photodetection rate. The experiment did not run at that rate.
- *The energy claim.* The paper estimates that power is set by the light needed to trigger an optical nonlinearity (a saturable absorber, assumed to switch at 1 megawatt per square centimetre) with enough signal-to-noise: about N milliwatts for N neurons per layer. With its own speed assumption that gives 5/(mN) femtojoules per operation for m layers, so 0.3 femtojoules for the demonstrated network (we recomputed this) and far less at scale, against about 1 picojoule per operation for CPUs and GPUs "not including the power spent on data movement". A femtojoule is a thousandth of a picojoule.

**Where it stretches.** The estimate leaves out the laser, the modulators and detectors, the converters between electrical and optical signals, and the energy to hold the phase settings. The paper does mention the last: its chip needs about 10 milliwatts per phase modulator to maintain its settings, and suggests phase-change materials that need no power as a future fix. At that figure, holding 48 settings costs roughly 0.5 watts, about 120 times the paper's estimated total power for the whole 4-neuron system (4 milliwatts). Later hardware agrees with the shape of this gap: a 2026 optical processor measured [about 20 attojoules per operation in the light, 250 femtojoules for the whole system](https://www.nature.com/articles/s41467-026-68452-x), a ratio over 10,000. The comparison is also unequal: the electronic figure includes the whole chip, the optical one only the nonlinearity's light.

**Verdict.** Overstretched. The paper is careful in its text: it says "in principle", it names the heater power and it says its nonlinearity was electronic. The stretch is in reading the headline as a system's energy. What survives: optical matrix multiplication works on chip, at small scale and with reduced accuracy, and the light itself can be very cheap. What doesn't: any claim about total energy per operation.

**How sure we are.** Checked against the full paper text. We did not read its supplement, which holds the detailed power calculation, and we did not survey how other papers cite it, so "overstretched" is about the paper's headline, not about any particular citer.
