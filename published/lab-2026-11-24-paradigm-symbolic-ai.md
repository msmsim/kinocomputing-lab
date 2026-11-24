---
kind: paradigm
question: q-004
paradigm: symbolic-ai
pin: false
---

**Symbolic AI is now the verifier, not the brain**

Intelligence as explicit rules and logic that a machine manipulates and can check, the approach that dominated AI before neural networks.

**Where it stands.** The best 2026 results use symbols to check neural guesses rather than replace them. A neural prover paired with a formal proof checker, [ProofEvolve](https://arxiv.org/abs/2608.26334), is reported at a 57.8% average solve rate across three hard maths benchmarks, with no false proofs in over 400 re-checks. An [Isabelle system for the seL4 microkernel](https://www.usenix.org/system/files/osdi26-he-baoding.pdf) proved 77.6% of 2,794 held-out theorems against 40.3% for the standard automated tool. These are the authors' own figures on benchmark sets; we read the ProofEvolve abstract, not the full papers. The old limits (brittleness, grounding symbols in the world) are still acknowledged.

**What an outsider can use.** [Lean and mathlib](https://mathlib.org/), the [Z3 solver](https://github.com/Z3Prover/z3/) and [LeanDojo](https://github.com/lean-dojo/LeanDojo) are free and run on a laptop.

**What the lab could test.** How much of a prover's score comes from the neural model and its retry budget, and how much from the symbolic checker: same model, checker on and off, retries counted.

Checked 24 November 2026; first pass.
