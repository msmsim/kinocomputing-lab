---
kind: paradigm
question: q-004
paradigm: transformers-scaling
pin: false
---

**Scaling laws: bigger still helps, but shape and energy matter**

The bet that a transformer's loss falls smoothly as you add parameters, data and compute, so scale itself is the strategy.

**Where it stands.** The scaling relationship holds in recent open experiments, but with caveats. A 2026 study of 30 designs from 17 million to 7 billion parameters, [The Depth Delusion](https://arxiv.org/abs/2601.20994), finds that past a critical depth, adding layers raises loss despite adding parameters, so width should grow faster than depth. The [OpenEuroLLM scaling study](https://arxiv.org/abs/2608.28308) finds forms that let model and data size interact fit its open runs better than the classic separable form. On energy, [Watt Counts](https://arxiv.org/abs/2604.09048) measured over 5,000 inference runs of 50 models on 10 GPU types: the best GPU varies by model, and the choice alone can change energy use by up to 70% in some settings (its estimate). These are preprints; we read abstracts only.

**What an outsider can use.** [Hugging Face Transformers](https://github.com/huggingface/transformers/), the OpenEuroLLM [checkpoints and logs](https://huggingface.co/openeurollm), the Watt Counts open dataset.

**What the lab could test.** Refit published scaling data with an energy term.

Checked 24 November 2026; first pass.
