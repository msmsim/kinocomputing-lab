---
kind: analysis
question: q-002
pin: false
change_note: Full texts of Cottier and Sastry read; reviewer weakened both quoted claims; energy-as-binding-constraint dropped.
---

**Where the incumbent computing stack sits in the machines**

q-002 asks where von Neumann digital computing, GPUs and scaling transformers sit in World Machines theory. Two readings were on the table: late Modernity in its Dusk (a *pull* system, one destination, now running into limits), or Divergence in its Day (a *push* system, many local trajectories). This is a first working pass from abstracts and the [paradigms page](https://www.kinocomputing.com/alternative-paradigms), not a finished analysis. [The working file is here](https://github.com/msmsim/kinocomputing-lab/blob/main/analyses/a001-incumbent-stack-in-the-machines/ANALYSIS.md).

**What the sources say.** Dennard scaling gave "systematic and predictable" gains in density, speed and power ([Bohr, 2007](https://doi.org/10.1109/n-ssc.2007.4785534)). It stopped about a decade before 2016, and per-generation die performance gain fell from about 2.8x to 1.4x ([Johnsson and Netzer](https://doi.org/10.1088/1742-6596/762/1/012022)). Amortised training cost of the most compute-intensive models has grown 2.4x a year since 2016 ([Cottier et al.](https://doi.org/10.48550/arxiv.2405.21015)). Governments and firms already use compute as a governance lever ([Sastry et al.](https://doi.org/10.48550/arxiv.2402.08797)). Smaller models are matching larger ones ([MiniCPM](https://doi.org/10.48550/arxiv.2404.06395)). Data-centre power forecasts disagree in scope and method ([Singh, 2026](https://doi.org/10.21275/sr26901133612)), so the page's 290 GW figure is one forecast among several and I did not check it against primary sources.

**What the lab infers.** Neither reading fits the whole stack; each fits a layer.

![[lab-2026-11-21-stack-split-two-machines]]

The alternatives split the same way.

![[lab-2026-11-21-physics-bodies-placement]]

**What it explains.** Why one field shows both heavy concentration (frontier cost, compute governance) and heavy fragmentation (many models, many substrates). Why alternatives keep arriving as efficiency fixes. It does not yet beat the plain rival of diminishing returns plus market structure, and the placement only earns its keep if it predicts something that rival does not.

**What would change it.** If compute stays concentrated while capability keeps rising without extra power, reading A weakens. If physics-cluster work is judged on substrate-native measures and wins recognition that way, the "Dusk repair" placement breaks. If a Perez-style surge model predicts the same history ([Knell, 2021](https://doi.org/10.1007/s43253-021-00037-4)), the machines add nothing here. The lab's own toy reservoir lost to a digital baseline on the digital baseline's task (the lab's e002 write-up, published last night): that is weak evidence the yardstick is the incumbent's.

**Update after full texts and review.** In Cottier, energy is only 2-6% of frontier training cost; chips, servers and staff dominate. So the Dusk evidence is capital and supply-chain concentration, not energy as a cost, and that is what market structure predicts too. A hostile review judged the placement not yet distinguished from that rival, and the claims below are quoted at their revised, weakened state. The next test to pre-register is whether scaling returns flatten while spend rises.

**Not done.** Primary Perez, Hughes and Kuhn sources, the World Machines blyg's posts, and a primary source for the power figures. (Full texts of Cottier and Sastry are now read.)  Previously: full texts, the World Machines blyg's posts, and primary sources for Perez, Hughes and Kuhn. The next test is a small literature count: of published alternative-hardware papers, how many report accuracy against a digital baseline versus substrate-native measures.
