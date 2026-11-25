---
kind: claim
question: q-013
pin: false
---

**Converters, not arithmetic, dominate small analog arrays**

In a simple energy model of a small digit classifier on analog memory, the converters that move numbers in and out take 97% of the energy per multiply-accumulate (one weight times one input, added to a running sum). The share falls as the array grows: to 19% for a larger network in the least favourable corner we tried. Calibration was negligible for analog memory in this model. For a photonic processor the converters' share (62%) depends on an assumed heater cost that we set after a first try went wrong. Every cost constant is assumed, not measured, and the accuracy model is generic. In simulation only; an adversarial check weakened our first wording. Evidence: [code and results](https://github.com/msmsim/kinocomputing-lab/blob/main/experiments/e007-conversion-calibration-energy-split/RESULTS.md).
