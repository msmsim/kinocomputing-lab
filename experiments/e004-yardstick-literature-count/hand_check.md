# Hand check (seed 2, 20 papers), blind coding

Coded by the researcher from the abstract, before the rule codes were read.
H08, H17 and H19 were first read from a 900-character excerpt; their full
abstracts were then read (see the note below). Hand code D = the abstract
reports a result against a digital baseline on a task (not background
mention, not a simulator, not another alternative-hardware paper).

| # | Paper (short) | Hand D | Rule D | Note |
|---|---|---|---|---|
| H01 | H2O2 solvation MD | N | N | off-topic (not alternative hardware) |
| H02 | spin-wave reservoir | N | N | "conventional ANNs" named for cost, no digital result |
| H03 | ETLP neuromorphic learning | N | N | compares learning rules, not hardware |
| H04 | PRC tutorial | N | N | |
| H05 | music-hall reservoir | N | N | off-topic-ish |
| H06 | neuromorphic braking intent | N | N | "baseline" is a stress condition |
| H07 | thermodynamic matrix exponential | N | N | speedup in theory, no digital comparator named |
| H08 | SpiNNaker Sudoku | N | **Y** | GPU named only as simulator; comparison is to prior SNN solvers. **Rule false positive.** |
| H09 | 2D memristor CIM | N | **Y** | von Neumann named as background; "comparable" refers to other memristors. **Rule false positive.** |
| H10 | memimpedance PRC | N | N | |
| H11 | mycelium PRC | N | N | |
| H12 | hybrid quantum-classical photonic NN | **Y** | N | matches "classical networks twice their size" on classification, at classical bit precisions. **Rule false negative**: "classical" is not in the comparator list. |
| H13 | memristor bridge synapse | N | N | |
| H14 | thermodynamic natural gradient | N | **Y** | digital computers named as the limit; complexity argument, no digital result. **Rule false positive** (judgement; borderline). |
| H15 | 2D-material CIM review | N | N | energy comparison across devices, not digital |
| H16 | analog IMC cross-layer design | N | N | |
| H17 | LIMCA LLM for IMC | N | N | full text read; "existing frameworks" are not digital |
| H18 | analog memristive denoising | N | **Y** | "introducing digital circuits" named as a compromise, no digital result. **Rule false positive** (judgement). |
| H19 | diffusive memristor Bayesian machine | N | N | full text read; no digital comparison |
| H20 | MEMS PRC | N | N | |

Hand D: 1 of 20 (H12). Rule D: 4 of 20 flagged, 0 of those hand-positive.
Rule precision on this sample: 0/4. Rule recall: 0/1. Hand share 5%
(exact 95% CI 0.1%–24.9%) against the rule's 14.7% (seed 2) and 16.0% (seed 1).

## The excerpt note

H08, H17 and H19 were first coded from a 900-character excerpt. Their full
abstracts were then read and the codes above are on full text; none changed.

## What this says about the rule

The rule's D flags are background mentions and simulator names, not
benchmarks against digital baselines. It also misses comparisons that use the
word "classical" for the digital baseline. So the rule's error is not
symmetric: it both overcounts background mentions and undercounts
"classical" baselines. The hand share is lower than the rule's, not higher.
The kill result is therefore not an artifact of the rule being too strict.
It may be an artifact of the rule being crude in both directions, which is
why a larger hand check is the next step.
