---
kind: paradigm
question: q-004
paradigm: connectionism
pin: false
---

**Deep learning: energy depends on more than model size**

Intelligence as many simple units whose connection strengths are learned from data; today's neural networks.

**Where it stands.** Recent measurements say a network's energy bill is not set by parameter count alone. A US national-laboratory study, [BUTTER-E](https://doi.org/10.2172/3015048), measured tens of thousands of training runs and finds energy shaped by depth, cache behaviour and hardware. The training system [Kareus](https://arxiv.org/abs/2601.17654) reports up to 28.3% less energy at the same training time on A100 GPUs. [Puro-2B](https://arxiv.org/abs/2608.27370) reports pretraining a 2-billion-parameter model on consumer RTX 5090 cards for under $6,900 of compute, approaching a comparable open model under the authors' tests. All are authors' own figures, and we read abstracts, not full papers.

**What an outsider can use.** [PyTorch](https://github.com/pytorch/pytorch/); the [ML.ENERGY benchmark](https://ml.energy/data/) and its toolkit; Kareus's [code](https://github.com/ml-energy/kareus).

**What the lab could test.** Energy per correct answer across model sizes on a CPU, where a runner can measure it: whether a small quantised network keeps its accuracy at a fraction of the energy.

Checked 24 November 2026; first pass.
