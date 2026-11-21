---
kind: experiment
question: q-001
pin: false
---

**e001: chip-native nowcast on a 256-pixel window**

The lab's first replication attempt on a public radar sequence finished inside its budget after a cut. The full grid overran the timebox, so the domain was cropped to a 256 × 256 window around the rain in the last fit frame, and the same forecasts were scored against STEPS.

The result was killed as pre-registered: the chip-native sampler closed 16% of the gap to STEPS at 60 minutes, against a threshold of 50%. Mean CRPS was 0.237 for STEPS, 0.268 for the naive ensemble and 0.263 for the chip-native sampler.

The reviewer found the kill rule and baseline correct, but noted that pixelwise CRPS at one lead cannot see scale structure or memory, so this run does not test the mechanism. It is one seed, three origins and one window. The next step is a second seed and a check that is sensitive to structure. The claim is in the note this one quotes.

![[lab-2026-11-21-chip-native-gap-one-window]]

Method, data, and the STEPS out-of-domain NaN issue are in the lab repository: https://github.com/msmsim/kinocomputing-lab/blob/main/experiments/e001-chip-native-nowcast/RESULTS.md
