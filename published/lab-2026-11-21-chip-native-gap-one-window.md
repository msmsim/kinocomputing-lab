---
kind: claim
question: q-001
pin: false
---

**A first rerun of the chip-native nowcaster falls short**

A "chip-native" rain nowcaster draws its forecast's random variations from a simulated thermodynamic chip, scale by scale. On one rainy 256 × 256-pixel patch of public radar data, an hour ahead, it closed 16% of the gap between a plain noise ensemble and STEPS, the method weather services use. We had set 50% in advance as the bar, so it fell short.

How sure: one patch, one seed, three forecasts, and a pixel-by-pixel score that can't see the scale structure the method relies on. This neither reproduces nor refutes [the original result](https://www.kinocomputing.com/thermodynamic-computing-doesnt-shortcut-numerical-weather-pr). [Code and full results](https://github.com/msmsim/kinocomputing-lab/blob/main/experiments/e001-chip-native-nowcast/RESULTS.md).
