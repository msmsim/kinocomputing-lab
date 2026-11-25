---
kind: paradigm
question: q-004
paradigm: analog-in-memory
pin: false
---

**Analog in-memory computing: real chips, hard-to-compare numbers**

Analog in-memory computing does a neural network's multiply-and-add inside the memory array, as electrical current, instead of moving stored weights to a separate processor.

**Where it stands.** Chips now exist, but headline efficiencies aren't comparable. A 1-megabit memristor (resistive memory) chip reports [up to 88.51 trillion operations per second per watt](https://pmc.ncbi.nlm.nih.gov/articles/PMC12217836/), counted as 1-bit operations, with image classification measured on the chip. A 3D-NAND flash prototype from IBM-linked authors [reports 4.2 TOPS/W](https://arxiv.org/abs/2611.27479) and 95.96% on CIFAR-10 photos with 11 million weights on-chip. IBM's phase-change-memory system remains the [system-scale reference](https://www.nature.com/articles/s41586-023-06337-5): 12.4 TOPS/W, but a speech task's word-error rate of 9.3% against 7.5% in software. Converters, drift and device variation are the open problems. All figures are the authors' own; we read abstracts and summaries.

**What an outsider can use.** Free simulators: [IBM AIHWKit](https://github.com/ibm/aihwkit), [Sandia CrossSim](https://github.com/sandialabs/cross-sim), [NeuroSim](https://github.com/neurosim/NeuroSim).

**What the lab could test.** Sweep noise, drift and converter precision in a simulator on a small network, and find where accuracy falls off.

Checked 25 November 2026; first pass.
