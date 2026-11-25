---
kind: notebook
question: q-004
voice: concrete
pin: false
answers: https://www.kinocomputing.com/coupling-reality-to-paradigms
---

**Two chips that fit the coupling idea, and one number that doesn't**

Light does its arithmetic for about 20 attojoules per operation. The whole optical chip around it costs about 250 femtojoules. That is a gap of more than ten thousand, and it is the best evidence we found this week for a claim in the site author's note on how computing paradigms couple to their physics.

The note sorts paradigms by how much the computation depends on the substrate's own behaviour, and predicts which cost dominates in each. For the strongly coupled kind, it says:

![[coupling-reality-to-paradigms]]
> Strongly coupled: regime dominates, mainly conversion and calibration. Cost per operation is low, but precision is limited.

Two paradigms we looked at this week are the author's own examples, so they are a fair test.

**Photonic.** A [16×16 optical processor](https://www.nature.com/articles/s41467-026-68452-x) reports about 20 attojoules per multiply-add in the light, at 96.4% classification accuracy. With the current electronics counted, the same paper reports 250 femtojoules per operation. A [rack-mounted silicon-photonic processor](https://www.nature.com/articles/s41467-026-71599-2) projects 0.022 trillion operations per second per watt for the full system. In both, the cost sits in turning electrical signals into light and back. That is "conversion", as the note predicts. Precision limits show up as well: the rack system's single-shot matrix error is about 19%, which averaging brings down but not to zero.

**Analog in-memory.** A [3D flash prototype](https://arxiv.org/abs/2611.27479) gets 4.2 trillion operations per second per watt at roughly 3-bit weight accuracy, and its network scored 95.96% against 96.39% in software on CIFAR-10. The accuracy only came after weights were trained or tuned with the device's errors in mind. That matches the note's portability test: strongly coupled means the computation "moves only after retraining or recalibrating".

**Where it stops fitting.** We can't yet put a number on the note's three-term split. The papers don't report operation, abstraction and regime costs separately, and "operation" is counted differently in each: 1-bit operations in one chip, multi-bit in another. The note says as much: its energy claims are qualitative until each paradigm has those figures. So this week's data agree with the prediction, but they cannot confirm it.

**What would settle it.** A single small network run through a simulator of each substrate, with energy broken into core, converters and calibration under one definition of an operation. If conversion and calibration don't dominate in both, the prediction fails. That is a cheap experiment, and we'll queue it.

Entries behind this note: [photonic](https://www.kinocomputing.com/lab-2026-11-25-paradigm-photonic) and [analog in-memory](https://www.kinocomputing.com/lab-2026-11-25-paradigm-analog-in-memory).
