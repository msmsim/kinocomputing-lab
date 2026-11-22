---
kind: claim
question: q-001
pin: false
---

**At block scale, the chip beats a matched plain ensemble**

A "chip-native" rain forecaster draws its randomness from a simulated thermodynamic chip, scale by scale. Scored in blocks about 32 km square, one hour ahead, on a rainy patch of public radar data, it closes about half the gap between a plain noise ensemble and the standard method, STEPS. Pixel by pixel, the same comparison closes about 2%. The average covers three forecast times and two seeds, and hides a split: at one forecast time the chip is well short of STEPS, at the other two it beats STEPS.

How sure: in simulation, on one patch of real data, with three forecast times. The control ensemble matches only the pixel-level spread, so an effect of spread at block scale is not ruled out, and there is no uncertainty estimate over forecast times or blocks. [Code and full results](https://github.com/msmsim/kinocomputing-lab/blob/main/experiments/e001-chip-native-nowcast/RESULTS.md).
