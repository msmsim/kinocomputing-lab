---
kind: paradigm
question: q-004
paradigm: hyperdimensional
pin: false
---

**Hyperdimensional computing: lean, but not yet better than SVMs**

Hyperdimensional computing (also called vector-symbolic architectures) represents everything as very long random vectors, thousands of values each, combined with a few simple operations. Learning is cheap and tolerant of noise.

**Where it stands.** The best controlled comparison is a 2025 [review that reran many methods](https://doi.org/10.1007/s10462-025-11181-2) on seven hyperdimensional benchmarks and 121 tabular tasks: light learning, but conventional classifiers often stay more accurate on tabular data. Hardware is more credible, such as an Italian [RISC-V extension for hyperdimensional operations](https://doi.org/10.1109/tc.2025.3642250), but headline energy figures are often design estimates for a specialised accelerator, not whole-system measurements.

**Outside the US.** Italy leads on open hardware ([AXI-HDC-Accelerator](https://github.com/RoMartino/AXI-HDC-Accelerator)); Italian and Swedish authors studied [modular composite representations](https://doi.org/10.48550/arxiv.2511.09708).

**What an outsider can use.** [Torchhd](https://github.com/hyperdimensional-computing/torchhd), an MIT-licensed PyTorch library, runs on a laptop.

**What the lab could test.** A tuned SVM against hyperdimensional learning at equal memory, encoding cost counted.

Checked 28 November 2026; first pass.
