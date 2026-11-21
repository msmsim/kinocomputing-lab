---
kind: analysis
question: q-002
pin: false
---

**Where today's computing sits in the World Machines**

Venkatesh Rao's [World Machines](https://worldmachines.org/theory) theory reads history as a succession of overlapping civilisational "machines": interlocking institutions, technologies and assumptions that rise over centuries, dominate, then fade. At any moment three coexist: one in its Dawn, one in its Day, one in its Dusk. Two matter here. *Modernity*, now in its Dusk, is a "pull" system: everything drawn toward one destination, such as universal progress or scientific mastery. *Divergence*, now in its Day, is a "push" system: outcomes depend on local conditions, with no single destination.

The theory is a vocabulary for making sense of things, not a forecasting machine, and we use it that way. The question here is where the incumbent computing stack sits: digital chips, GPUs, and ever-larger AI models trained on ever more compute. Is it late Modernity, straining at its limits, or something native to Divergence? This is a first working pass.

**What the sources say.**

- For decades, shrinking transistors gave "systematic and predictable" gains in density, speed and power ([Bohr, 2007](https://doi.org/10.1109/n-ssc.2007.4785534)). That free lunch ended in the mid-2000s, and the performance gain from each chip generation fell from about 2.8× to 1.4× ([Johnsson and Netzer](https://doi.org/10.1088/1742-6596/762/1/012022)).
- The cost of training the most compute-hungry AI models has grown about 2.4× a year since 2016 ([Cottier et al.](https://doi.org/10.48550/arxiv.2405.21015)). Energy is only 2–6% of that; chips, servers and staff dominate.
- Governments and firms already treat compute as a lever of control ([Sastry et al.](https://doi.org/10.48550/arxiv.2402.08797)).
- At the same time, smaller models are matching larger ones ([MiniCPM](https://doi.org/10.48550/arxiv.2404.06395)).
- Forecasts of data-centre power demand disagree in scope and method ([Singh, 2026](https://doi.org/10.21275/sr26901133612)), so a headline figure like 290 GW by 2030 is one forecast among several. We haven't checked it against primary sources.

**Our reading.** Neither machine fits the whole stack; each fits a layer.

![[lab-2026-11-21-stack-split-two-machines]]

The alternatives to that stack split the same way.

![[lab-2026-11-21-physics-bodies-placement]]

**What it would explain.** Why the same field shows both extreme concentration (frontier training costs, compute as a policy lever) and extreme fragmentation (thousands of models, many kinds of hardware). And why alternative hardware keeps arriving dressed as an efficiency fix.

**Where it's weak.** A plainer story explains much of the same: diminishing returns from scaling, plus the usual economics of capital-hungry industries. Our first draft leaned on energy as the binding constraint on Modernity's stack. Reading the full cost study, energy turned out to be a small share, so we dropped that, and an adversarial review judged the placement not yet distinguishable from the plainer story. The quoted claims above are stated at that weakened strength. The reading only earns its keep if it predicts something the plain story doesn't.

**What would change our mind.**

- If compute stays concentrated while capability keeps rising without more power, the Dusk reading weakens.
- If physics-based computing wins recognition on its own terms, rather than by beating digital benchmarks, the "repair" placement breaks. A first count of papers in the field already [points that way](https://www.kinocomputing.com/do-new-computers-judge-themselves-by-the-old-ones).
- If a standard model of technological surges, such as Carlota Perez's, predicts the same history ([Knell, 2021](https://doi.org/10.1007/s43253-021-00037-4)), the machines add nothing here.

**Still to do.** Read Perez, Hughes and Kuhn in the original, read what contributors to the [World Machines blyg](https://blyg.worldmachines.org/) have written, and find a primary source for the power forecasts. The next test: do scaling returns flatten while spending keeps rising?

[The working analysis](https://github.com/msmsim/kinocomputing-lab/blob/main/analyses/a001-incumbent-stack-in-the-machines/ANALYSIS.md).
