---
kind: paradigm
question: q-004
paradigm: connectionism
pin: false
---

**Deep learning: energy depends on more than model size**

Deep learning, the intelligence-as-many-simple-units-with-learned-connections design behind today's neural networks, has an energy bill that parameter count alone doesn't predict.

**Where it stands.** A US national-laboratory study, [BUTTER-E](https://doi.org/10.2172/3015048), measured tens of thousands of training runs and finds energy shaped by network depth, cache behaviour and hardware, not size alone. The training system [Kareus](https://arxiv.org/abs/2601.17654) reports up to 28.3% less energy at the same training time on data-centre GPUs. [Puro-2B](https://arxiv.org/abs/2608.27370) reports pretraining a 2-billion-parameter model on consumer graphics cards for under $6,900 of compute, approaching a comparable open model under the authors' own tests. All are the authors' figures, and we read abstracts, not full papers.

**What an outsider can use.** [PyTorch](https://github.com/pytorch/pytorch/); the [ML.ENERGY benchmark](https://ml.energy/data/) and its toolkit; Kareus's [code](https://github.com/ml-energy/kareus).

**What the lab could test.** Energy per correct answer across model sizes on an ordinary CPU, where we can measure it: does a small quantised network (one with coarser stored numbers) keep its accuracy at a fraction of the energy?

Checked 25 November 2026; first pass.
