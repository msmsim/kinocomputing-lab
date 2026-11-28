---
kind: paradigm
question: q-004
paradigm: hyperdimensional
pin: false
---

**Hyperdimensional computing: lean, but not yet better than SVMs**

Hyperdimensional computing (also called vector-symbolic architectures) represents everything as very long random vectors, thousands of values each, combined with a few simple operations, which makes learning cheap and tolerant of noise.

**Where it stands.** The best controlled comparison is a 2025 [review that reran many methods](https://doi.org/10.1007/s10462-025-11181-2) on seven hyperdimensional benchmarks and 121 tabular tasks. It finds a trade: light learning, but conventional classifiers often stay more accurate on tabular data. Hardware is more credible than before, such as a [RISC-V extension for hyperdimensional operations](https://doi.org/10.1109/tc.2025.3642250) from Italy, but headline energy figures are often design estimates for a specialised accelerator, not whole-system measurements.

**Outside the US.** European groups lead on theory and open hardware: Italy (RISC-V accelerators, also [open on GitHub](https://github.com/RoMartino/AXI-HDC-Accelerator)) and a 2025 study of [modular composite representations](https://doi.org/10.48550/arxiv.2511.09708) by Italian and Swedish authors.

**What an outsider can use.** [Torchhd](https://github.com/hyperdimensional-computing/torchhd), an MIT-licensed PyTorch library, runs on a laptop.

**What the lab could test.** A tuned SVM or small network against hyperdimensional learning at equal memory, with encoding cost counted.

Checked 28 November 2026; first pass.
