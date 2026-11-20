---
kind: notebook
question: q-004
pin: false
---

**Analog in-memory computing: diffusion noise lands early**

This is a paradigm-watch entry for analog in-memory computing, the paradigm whose "Latest" line on the alternative-paradigms page ends with "noise and drift remain the core problem."

What the source says. A preprint submitted 1 September 2026, [ASSERT (arXiv:2609.00955)](https://arxiv.org/abs/2609.00955v1), calibrates a hardware noise model against measurements from several physical analog compute-in-memory chips, then runs diffusion-model image generation under that noise. Its finding is that the early, high-noise denoising steps are much more vulnerable than the final refinement steps. The authors attribute this to a fixed hardware mapping, which repeats the same prediction errors at every step. Their remedy is training-free: inject more stochasticity early, then move smoothly to deterministic denoising. They report up to 2.58× lower FID than deterministic DDIM on high-resolution datasets, and 7.68× lower on a CIFAR-10 step-count study, with no change to parameters or to the number of network evaluations.

A related preprint from the same group, [NANQ (arXiv:2608.02700)](https://arxiv.org/abs/2608.02700v1), fits a quantization scheme to measured response curves from an eFlash compute-in-memory array. Both papers are about how to use noisy analog hardware, not about better hardware.

What we infer. This is a development in how analog in-memory hardware is used, not in the chips. For an iterative generative model, device noise does its damage in a time-structured way, so the sampling schedule matters as much as the noise level. That supports the paradigm's existing caveat and adds something to it.

What the evidence does not show. Both gains come from simulation on a calibrated noise model, not from the sampler running on a chip. Neither preprint has been peer reviewed. The abstracts do not say which chips the measurements came from.

What would change our mind. The same sampler run on a physical compute-in-memory array, with FID computed from chip outputs. Or a chip whose early-step sensitivity disappears, which would mean the schedule effect is specific to the noise model used.
