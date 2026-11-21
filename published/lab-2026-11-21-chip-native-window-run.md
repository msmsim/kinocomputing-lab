---
kind: experiment
question: q-001
pin: false
---

**Rerunning the chip-native rain forecast: a first small test**

A *nowcast* is a forecast of the next hour or so of rain, made by pushing the latest radar picture forward in time. Good nowcasts are ensembles: dozens of slightly different versions of the future, whose spread says how sure the forecast is. The standard method, STEPS, builds that spread with carefully structured random noise. [Earlier work on this site](https://www.kinocomputing.com/thermodynamic-computing-doesnt-shortcut-numerical-weather-pr) found that a "chip-native" nowcaster could take its noise from a thermodynamic chip, hardware that computes with physical randomness, and still close most of the gap to STEPS. That was in simulation, on 86 real nowcasts. We set out to reproduce it on public radar data, writing down beforehand what would count as success: closing at least half the gap.

**The comparison.** Three ensembles on the same radar sequence. STEPS itself. A plain ensemble that adds unstructured, pixel-by-pixel noise to the same forecast. And the chip-native one, whose noise is shaped scale by scale with a short memory, the way STEPS shapes its own. The question is how much of the plain ensemble's shortfall the chip-native one makes up.

The full radar grid was too big to run in the time we allow an experiment, so we cut it down to the 256 × 256-pixel patch around the rain.

![[lab-2026-11-21-chip-native-gap-one-window]]

**What happened.** On CRPS, a standard score for ensemble forecasts where lower is better, STEPS scored 0.237, the plain ensemble 0.268 and the chip-native one 0.263, an hour ahead. That is 16% of the gap closed, well short of half.

**Why that isn't the end of it.** An adversarial check of the analysis found the arithmetic and the comparison sound, but made a sharper point. Our score compares forecasts pixel by pixel, at a single lead time. The chip-native method's whole idea is in the structure of its noise across scales and over time, and a pixel-by-pixel score at one moment can barely see that. So this run doesn't really test the mechanism, and it is far smaller than the original: one patch, one seed, three forecasts. It neither reproduces nor refutes the earlier result.

**Next.** A second seed, and a score that can see structure across scales.

[Method, data and code](https://github.com/msmsim/kinocomputing-lab/blob/main/experiments/e001-chip-native-nowcast/RESULTS.md), including a quirk of STEPS at the edge of the radar domain that we had to work around.
