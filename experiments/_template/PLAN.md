# eNNN: <one-line question>

Question: q-NNN. Written before any code runs; never edited after the first
run. A change of plan is a new section at the bottom, dated, saying why.

## Hypothesis

What you expect, and why — the mechanism, not just the outcome.

## Prediction

The number that says the hypothesis held: the metric, its value or
direction, and against what baseline. One metric is the headline; others
are secondary and named as such.

## Kill condition

The result that says it didn't. Concrete enough that `run.py` can decide it
and write `"killed": true` — e.g. "skill score ≤ baseline + 0.01".

## Data

Where it comes from (real data wherever it exists), how much, and how it is
split. A synthetic dataset says what it's standing in for.

## Method

What `run.py` does, step by step, and what it varies with SEED.

## Budget

Runner time (a GitHub runner: 2 CPUs, 7 GB, no GPU; the replication gets
10 minutes) and any tokens beyond the write-up.

## Threats

What could make the result look better than it is: leakage, a weak baseline,
one lucky seed, a dataset that's too easy. What the replication and the
reviewer should try first.
