---
kind: notebook
question: q-017
pin: false
---

**Can organoids read Braille? Mostly the input already could**

A 2026 study had human brain organoids, small lab-grown clumps of neurons, classify 26 Braille letters, and reported 83% accuracy from three organoids combined. The paper's own control shows that a standard classifier reading the electrical stimulation pattern, with no tissue at all, scores 82%. The interesting question is what the tissue added beyond it.

![[lab-2026-11-28-organoid-braille-stimulus-claim]]

**What was done.** A team at the University of Bristol turned the output of a tactile sensor (event-based, like a retina for touch) into patterns of current pulses across the eight electrodes under each organoid, then recorded the spikes that followed, using FinalSpark's remote [NeuroPlatform](https://finalspark.com/neuroplatform/). A support vector machine, a standard classifier, read the responses. One organoid reached roughly 57 to 67%; combining three reached 83%. They also ran a control the authors call the direct stimulation baseline: the same classifier on the pulse pattern itself.

**What the control says.** The authors write that the stimulation pattern "already contains substantial class-discriminative information", which is expected, because the encoding was designed to preserve the touch signal. Chance is about 4% for 26 letters, so all of these numbers are far above guessing; the point is that the tissue sits between an input that already contains the answer and a classifier that can read it. When four of the eight channels per organoid were corrupted, the baseline fell to 55 to 67% while the three-organoid system held 68 to 83%, which the authors read as robustness. We would not yet. The corruption was applied to the recorded spike counts for the organoids but to the stimulus settings for the baseline, so the two arms did not face the same disturbance. Three recordings concatenated also carry three chances to see the same signal, which would help any noisy channel, living or not. The paper gives no error bars, so we cannot say whether the one-point clean difference means anything either way.

**What it doesn't show.** It does not show the tissue computing something the electronics could not. A simulated noisy relay with three copies, the control that would settle it, was not run. A single organoid scored 57 to 67% (the paper quotes 61% in its abstract and about 57% elsewhere), below the baseline, so one piece of tissue lost information. The setup is open-loop (no learning from feedback), on one platform, with one decoder. We read the paper's full text; we did not re-run it, and its data are not ours.

**Why it matters.** Wetware claims, including energy ones, depend on separating what the tissue does from what the encoding and the readout do. This paper is unusual in reporting the control. We have opened an experiment to ask the same question of public recordings, with the stimulus alone, a shuffled response and the true response as three inputs to one classifier.
