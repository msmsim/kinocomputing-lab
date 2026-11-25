---
kind: notebook
question: q-004
pin: false
change_note: Self-audit: the note said both preprints rest on simulation. The second one (NANQ) reports on-chip experiments on a flash-memory analog chip; only the diffusion-sampler result is simulation. Also corrected the peer-review sentence to what we could check, and added that the first paper's noise model is validated against several real chips.
---

**Noisy analog chips hurt image generators early, not late**

*Analog in-memory computing* does a neural network's arithmetic where its weights are stored: the weights are physical conductances, and the laws of electricity do the multiplying. It saves the energy a digital chip burns shuttling data back and forth, but analog parts are noisy and drift. That has always been the paradigm's sticking point, as the [alternative paradigms round-up](https://www.kinocomputing.com/alternative-paradigms) says. A new preprint finds that, for one important kind of AI, the noise matters much more at some moments than others, and that you can work around it in software.

**What the paper found.** [ASSERT (arXiv:2609.00955)](https://arxiv.org/abs/2609.00955v1), posted on 1 September 2026, builds a model of hardware noise calibrated against measurements from several real analog chips. It then runs *diffusion models* under that noise. These are the image generators that start from pure static and clean it up step by step. The early, coarse steps, where the image's overall layout is decided, turn out to be far more vulnerable than the final polishing steps. The authors trace this to the chip's fixed wiring: it makes the same small errors at every step.

Their fix needs no retraining: add extra randomness in the early steps, so the chip's errors stop repeating in lockstep, then shift smoothly to the usual deterministic clean-up. Measured by FID, a standard score for how far generated images are from real ones (lower is better), they report scores up to 2.58× lower than the standard deterministic sampler on high-resolution datasets, and 7.68× lower in one small-image test, with the same model and the same amount of computation.

A companion preprint from the same group, [NANQ (arXiv:2608.02700)](https://arxiv.org/abs/2608.02700v1), fits the way numbers are rounded to the measured behaviour of a flash-memory analog array. Unlike the sampler paper, it reports experiments on a real flash-memory analog chip: with weights rounded to 2 bits, its method raised vision-model accuracy by 8.05 percentage points over a rival rounding scheme, and cut a language model's perplexity (a measure of how surprised the model is by text; lower is better) by 54.7% on average. Both papers are about using noisy hardware well, not about building better hardware.

**Why it matters.** It reframes the noise problem. For a generator that works step by step, the damage the hardware does depends on *when* it does it, so the schedule of a computation can matter as much as the raw noise level. That is a software lever on a hardware weakness.

**What it doesn't show.** The sampler result comes from simulation with a noise model calibrated and validated against measurements from several real chips, not from the sampler running on a chip. The abstracts don't say which chips. We found both as arXiv preprints and did not find peer-reviewed versions.

**What would change our view.** The same sampler run on a physical analog chip, scored on what the chip actually produced. Or a chip whose early steps turn out not to be especially fragile, which would suggest the effect belongs to the noise model rather than the hardware.
