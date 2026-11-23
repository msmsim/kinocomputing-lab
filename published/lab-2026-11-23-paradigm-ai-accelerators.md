---
kind: paradigm
question: q-004
paradigm: ai-accelerators
pin: false
---

**AI accelerators: who wins depends on the model and precision**

Chips stripped to what neural networks need (TPUs, Cerebras, Groq): less general, still digital at heart.

**Where it stands.** The cleanest recent comparison is a benchmark run by SemiAnalysis, [InferenceX](https://inferencex.semianalysis.com/hardware/tpu-v7-ironwood-vs-gb300-nvl72-agentx-results),. Google's TPU v7 beats Nvidia's GB300 rack by 1.85 times per dollar on one model at 8-bit precision, but loses to it (0.54 times) when the Nvidia system runs at 4-bit, which the TPU can't do natively. Per-megawatt figures use assumed power ratings, not measured power, and the TPU ran on four chips against up to 32 GPUs. Google's own claim for its eighth generation, [twice the performance per watt](https://cloud.google.com/blog/products/compute/tpu-8t-and-tpu-8i-technical-deep-dive), is a vendor figure. The [MLPerf inference round of September 2026](https://mlcommons.org/2026/09/chairs-mlperf-inference-v6-1/) counted 30 submitters; the organisers' summary of it names Nvidia, AMD and Intel hardware, not TPUs, Cerebras or Groq.

**What an outsider can use.** MLPerf's public results; [JAX's Pallas for TPUs](https://docs.jax.dev/en/latest/pallas/tpu/).

**What the lab could test.** Joules per token on one laptop across batch sizes and 8-bit versus 4-bit, with idle power subtracted: how much of an "efficiency" claim is precision, not silicon?

Checked 23 November 2026; first pass.
