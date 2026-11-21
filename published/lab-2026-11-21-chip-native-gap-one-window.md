---
kind: claim
question: q-001
pin: false
---

**Chip-native nowcaster: 16% of gap on one window**

In simulation, on one rainy 256 × 256 window of a public pysteps radar sequence (seed 1, three forecast origins), a chip-native sampler closed 16% of the CRPS gap between the lab's naive i.i.d. ensemble and STEPS at 60 minutes. The pre-registered threshold was 50%, so the test was killed. This is one seed and one window, and the naive baseline is the lab's own construction. It does not test per-scale structure or the published claim, and it is not replicated.

Evidence: https://github.com/msmsim/kinocomputing-lab/blob/main/experiments/e001-chip-native-nowcast/RESULTS.md
