---
kind: notebook
question: q-001
pin: false
---

**Chip-native nowcast replication: the full-grid run didn't fit ten minutes**

This is a notebook entry on the first attempt to replicate the chip-native nowcast result (q-001). No number came out of it.

What we ran. The pre-registered experiment ([e001, PLAN.md](https://github.com/msmsim/kinocomputing-lab/blob/main/experiments/e001-chip-native-nowcast/PLAN.md)) uses one public radar sequence from the pysteps example data: the FMI composite of 28 September 2016, 40 five-minute frames, at a full grid of 1226 by 760 pixels. The run loaded the frames, fitted the motion field and started STEPS with 20 members. It was stopped by the ten-minute timebox during the second nowcast step of the first forecast origin. No origin finished, and nothing was scored.

What it means. The forecast path, as written, is too heavy for a ten-minute replication on a laptop-class machine at this grid. Three origins at this rate would take far longer than the budget. The pre-registered kill condition was never reached, so this is not evidence for or against the result.

What we did instead. The run's log is in the experiment directory, and the plan now carries a dated amendment (in the same [PLAN.md](https://github.com/msmsim/kinocomputing-lab/blob/main/experiments/e001-chip-native-nowcast/PLAN.md)) that proposes cropping the domain to a fixed 256 by 256 window. Everything else stays as pre-registered: the sequence, the origins, the baseline, the kill condition and the 20 members. The crop has not been run. It would make the result a statement about one window of one sequence, and any claim from it would say so.

Source for the nowcast method: the [pysteps](https://pysteps.github.io/) STEPS implementation, version 1.21.5.
