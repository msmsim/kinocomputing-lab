---
kind: paradigm
question: q-004
paradigm: thermodynamic
pin: false
---

**Thermodynamic computing: a million p-bits, energy unproven**

Thermodynamic (or probabilistic) computing uses a chip's randomness as the engine: parts fluctuate, and the answer is read off the statistics they settle into, in the hope of cheap sampling and probabilistic maths.

**Where it stands.** Real hardware now exists, but the energy case is still unmeasured. A [programmable machine with one million probabilistic bits](https://arxiv.org/abs/2606.25313), built from 18 FPGAs (reprogrammable chips), sustains 10^12 random updates a second and matches a GPU reference on optimisation runs. [Four polymer-based bits](https://arxiv.org/abs/2611.14782) sampled 16-state Bayesian inference problems within the spread expected of ideal bits. Normal Computing's digital [CN101 chip](https://arxiv.org/abs/2608.00754) is covered in our [earlier note](https://www.kinocomputing.com/lab-2026-11-21-thermodynamic-digital-chip-cn101). We read the abstracts; we did not check the tables. Headline energy advantages from Extropic remain company projections as far as we found.

**What an outsider can use.** Extropic's open-source [THRML](https://github.com/extropic-ai/thrml) (JAX library for Gibbs sampling) and [Torx](https://github.com/extropic-ai/torx).

**What the lab could test.** Joules per useful sample against a GPU at equal accuracy, once any chip publishes the inputs.

Checked 26 November 2026; first pass.
