---
kind: experiment
question: q-004
pin: false
voice: santa-feist
answers: https://www.kinocomputing.com/introducing-goldleaf-money-that-grows-on-trees
---

**A tree's ledger would copy its own mistakes**

*Goldleaf* is the site author's fictional currency: short stretches of synthetic DNA written into a plant's genome, one record per harvest, kept in several places and read by majority vote, passed on by grafting. Before asking whether anyone could trade in it, ask what happens to a message written into a living body. We checked which parts rest on published work, and ran a small simulation of the part that doesn't. The simulation says the vote protects the ledger only as long as errors don't arrive in step.

**The solid part: DNA stores data.** In 2012 George Church's group [encoded a book of about 5 megabits in DNA](https://doi.org/10.1126/science.1226355) and read it back by sequencing. In 2013 Nick Goldman's group [stored 739 kilobytes of files](https://doi.org/10.1038/nature11875) and recovered them with 100% accuracy. In 2017 Seth Shipman's group [wrote a short film into the genomes of living bacteria](https://doi.org/10.1038/nature23017) using CRISPR, a bacterial editing system. What we could not find is the same done in a tree: a record written cheaply into a plant's genome, read back reliably, and kept intact over years.

**The clonal part: a graft copies everything.** Grafting joins a shoot to another plant's rootstock, and new growth carries the shoot's genome. That is why named apple varieties persist, and the essay is right that a clone carries its ledger forward. It also carries forward every change that genome has picked up. Plant cells keep dividing through a tree's life, and changes arising in those divisions are called somatic mutations. A [2019 review](https://doi.org/10.1146/annurev-ecolsys-110218-024955) says empirical estimates of plant mutation rates and effects remain limited, so we assumed no rate and swept it.

**The test.** A record of 1,000 DNA letters, three copies, passed through ten grafting generations. Each generation, every letter has some chance of mutating; a share of those mutations hits all three copies identically (think of a change in the tissue the cuttings came from), and the rest hit copies independently. A lineage survives if the majority read of the three copies matches the original exactly. We wrote down in advance that the tolerable mutation rate (the highest at which 95% of 2,000 simulated lineages survive) should fall at least tenfold if half the mutations were shared, and that the idea would be dead otherwise.

```
share hitting all copies   tolerable rate (per letter, per generation)
none                        3.2 in 10,000
10%                         3.2 in 100,000
50%                         1 in 100,000
```

The drop from none to half is a factor of 32. Just 10% shared is enough for a factor of ten. The reason is arithmetic: an independent error must strike two copies before the vote is wrong; a shared one needs a single strike.

**What this doesn't show.** It uses no real mutation rate, and we don't know what share of real mutations is shared; those numbers decide everything. It models no error-correcting code, which a real design would add. It is one run of a toy model, with the same code due to be rerun on a fresh seed. [Code, plan and output are here](https://github.com/msmsim/kinocomputing-lab/tree/main/experiments/e006-goldleaf-ledger-survival).

Two further gaps the essay leaves open: what stops a grower registering two cuttings of one lineage and spending it twice, and how independent verifiers would sample a living tree at scale. We found no source on either. The fiction makes a fair point about substrates: one that copies itself also copies its errors, and the design has to earn its keep against exactly that.
