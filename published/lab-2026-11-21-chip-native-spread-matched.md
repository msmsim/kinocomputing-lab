---
kind: claim
question: q-001
pin: false
---

**Most of the chip's edge is its extra spread**

A "chip-native" rain nowcaster draws its forecast's random variations from a simulated thermodynamic chip, scale by scale. On one rainy 256 × 256-pixel patch of public radar data, an hour ahead, a plain noise ensemble given the chip's overall spread came within 0.001 of the chip-native one on two seeds, where lower is better. The chip-native one still did a little better, so most of its edge over a plain ensemble is spread, not structure.

How sure: in simulation, one patch of real data, three forecasts, and a post-hoc check added after the first result. The score compares forecasts pixel by pixel, which cannot see the structure across scales the method is built around, so this says nothing about whether that structure helps. [Code and full results](https://github.com/msmsim/kinocomputing-lab/blob/main/experiments/e001-chip-native-nowcast/RESULTS.md).
