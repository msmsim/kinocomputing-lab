---
kind: paradigm
question: q-004
paradigm: quantum
pin: false
---

**Quantum computing: errors fall, no useful machine yet**

Quantum computing stores information in quantum states, aiming at factoring and molecule simulation; its main obstacle is errors, corrected by combining many physical qubits into one logical one.

**Where it stands.** The measured news is error correction. Google reports that [magic-state cultivation](https://blog.google/innovation-and-ai/models-and-research/quantum-computing/magic-state-cultivation-quantum-computing/), a cheaper way to make the special states needed for full computation, cut errors about 40-fold on its Willow chip, with a logical fidelity of 99.99%. Also reported: [dynamic surface codes](https://research.google/blog/dynamic-surface-codes-open-new-avenues-for-quantum-error-correction/) that improved with larger size by 2.15 times from distance 3 to 5. A Harvard-led [neutral-atom machine](https://authors.library.caltech.edu/records/8pkpg-qpw22) of up to 448 atoms is reported 2.14 times below the error threshold. These are lab-reported (we read blogs and abstracts); no one has shown a long-lived logical computer doing useful work.

**What an outsider can use.** [IBM's free Open Plan](https://www.ibm.com/quantum/blog/open-plan-updates): up to 10 minutes of QPU time per 28 days; Amazon's [Braket SDK](https://github.com/aws/amazon-braket-sdk-python).

**What the lab could test.** Recompute a resource estimate under measured, not target, error rates.

Checked 26 November 2026; first pass.
