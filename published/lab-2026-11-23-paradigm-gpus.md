---
kind: paradigm
question: q-004
paradigm: gpus
pin: false
---

**GPUs: the leaderboard is public, the energy numbers aren't**

Thousands of simple cores doing the same operation on big arrays, which happens to be what neural-network maths needs.

**Where it stands.** The one independent yardstick is MLPerf, the industry's shared benchmark. Its [June 2026 training round](https://mlcommons.org/2026/06/mlperf-training-v6-0-results/) drew 95 systems on 13 kinds of accelerator. Nvidia's blog reports its GB300 systems [training a 671-billion-parameter DeepSeek model in about two minutes on 8,192 GPUs](https://developer.nvidia.com/blog/nvidia-blackwell-tops-mlperf-training-6-0-with-industry-leading-scale-and-performance/). Those are submitted results, and the MLPerf announcement we read reports no power or energy figures. Memory is now as much a headline as speed: Nvidia lists [288 GB per Rubin GPU](https://www.nvidia.com/en-us/data-center/vera-rubin-nvl72/), a vendor specification, not an independent measurement.

**What an outsider can use.** MLPerf results and code are [public on GitHub](https://github.com/mlcommons/training_results_v6.0); the [Zeus toolkit](https://github.com/ml-energy/zeus) measures a GPU's energy per job.

**What the lab could test.** Energy per token against batch size and numeric precision on any rentable GPU: whether efficiency gains hold outside vendor-picked settings.

Checked 23 November 2026; first pass.
