# e006: How much does a shared (common-mode) share of mutations weaken a three-copy majority-vote ledger?

Question: q-004 (a thought experiment from the site author's Goldleaf essay: records kept at several places in a grafted plant's genome, reconciled by majority). Written before any code runs.

## Hypothesis
Majority voting suppresses independent errors quadratically (a vote fails only when two of three copies fail), but it does nothing against a mutation that hits all copies the same way. So even a modest common-mode share of the mutation rate should lower the tolerable mutation rate by a large factor.

## Prediction
Setup: a record of 1000 bases, three copies, 10 grafting generations, mutation probability mu per base per generation, of which a share s hits all three copies identically (common-mode) and 1-s hits each copy independently. Survival = fraction of 2000 lineages whose majority read equals the original record exactly. mu* = the largest mu on the grid (13 values, 4 per decade, 1e-6 to 1e-3) such that survival >= 0.95 at it and at every smaller grid value. Headline metric: mu*(s=0) / mu*(s=0.5). Predicted >= 10 (back-of-envelope: about 40).

## Kill condition
killed = ratio < 10.

## Data
Synthetic; no real mutation rates are used and none is claimed. The rate is swept because published plant somatic mutation rates are poorly pinned down.

## Method
Per base, per copy: counts of independent mutation events over 10 generations are Binomial(10, mu(1-s)); common events Binomial(10, mu*s). Substitutions to a uniformly chosen different base; back-mutation allowed implicitly. Majority per base; three-way disagreement counts as failure. All draws from SEED.

## Budget
Under a minute, one core.

## Threats
Independence among copies and mutation uniformity are assumed; real copies may be correlated in other ways (shared repair, shared chromatin). Common-mode share s is a free parameter, not measured. No checksum or error-correcting code, which a real design would add; so this is a worst-ish case for the design. The grid caps resolution of the ratio.
