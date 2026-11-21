# e004 RESULTS: do alternative-hardware papers judge themselves on the digital yardstick?

Question: q-006 (tests c-003). Pre-registered in `PLAN.md`, run with
`uv run run.py` (seed 1, the result in `result.json`) and `SEED=2 uv run run.py`
(`result_seed2.json`). Data: one OpenAlex snapshot of 299 unique articles from
six queries, 2024 or later, with abstracts (`data/openalex_snapshot.json`,
fetched once by `fetch.py`). Coded by rule D on a sample of 150 per seed.

## Result

**Killed as pre-registered.** The share of sampled papers that use the digital
yardstick (rule D) is below the 50% threshold on both seeds:

| Seed | n | D share | 95% Wilson | N only (no D) | D and N |
|---|---|---|---|---|---|
| 1 | 150 | 0.160 | 0.110–0.227 | 0.287 | 0.080 |
| 2 | 150 | 0.147 | 0.099–0.212 | 0.293 | 0.093 |

The seeds agree (0.160 and 0.147), as expected of one fixed pool. Seeds
change only which 150 of the 299 are coded.

## Hand check (the rule's error)

The pre-registered hand check (seed 2, 20 papers, coded blind to the rule's
codes, full abstracts read) is in `hand_check.md`:

- Hand share using the digital yardstick: **1 of 20 (5%)**, exact 95% CI 0.1%–24.9%.
- Rule D flagged 4 of those 20. **None of the 4 is hand-positive** (precision 0/4).
- The one hand-positive paper (H12, hybrid quantum–classical photonic NN) was
  missed by the rule (recall 0/1). It compares to "classical networks",
  and "classical" is not in the rule's comparator list.
- The rule's false positives are background mentions (von Neumann named as the
  problem being solved, "comparable" meaning comparable to other memristors),
  and a GPU named only as a simulator.

So the rule overcounts in the cases it flags and misses a real digital
comparison that uses "classical". On this sample the hand share (5%) is lower
than the rule's (16%). The rule does not understate the yardstick's absence.

## Sensitivity (post hoc, scratch, not in `result.json`)

Widening the comparator list to include "classical", "software", "conventional"
and "traditional" (outside the pre-registered rule), seed 1 with the same 150:
share 0.253; whole pool 0.234. Still below 50%. The kill does not depend on
the comparator list's narrowness. This check is post hoc and is reported only
for that reason.

## Deviations and what this does not show

- **Excerpt note.** Hand coding first used a 900-character excerpt for H08,
  H17 and H19. Their full abstracts were then read and the codes did not change.
  Recorded here, not as a PLAN amendment.
- **Population.** The pool is noisy. Some papers are off topic for
  alternative hardware (an H2O2 molecular dynamics study, a music-hall
  acoustics experiment). The denominator is every article the six queries
  returned, not only hardware papers. A narrower population could move the
  share either way.
- **Abstracts only.** Full texts may use the digital baseline more often
  (a yardstick in a results table rarely appears in the abstract).
- **One snapshot, six queries.** The sample is biased toward papers that name
  their hardware in the abstract. OpenAlex's live results will drift.
- **Hand check is 20 papers.** Its interval is wide. It is consistent with the
  rule and with the kill, but it is not a second measurement at scale.
- **Threshold.** The 50% line is the researcher's, pre-registered tonight. It
  is a judgement, and it is stated as one.

## What this says about c-003

c-003 says "let physics compute" is judged on the incumbent's yardstick, a
Dusk repair. This experiment tests the yardstick half. On this pool, most
alternative-hardware abstracts do **not** report against a digital baseline on
a task (about 84–95%, depending on the coding). So the premise that these
papers judge themselves on the incumbent's yardstick is not supported at this
sample size. The bodies half of c-003 is untouched. See the claim line in
`state/claims.jsonl` for the stage and the review.

## Not done

- The full-text version of the count (full texts, results tables).
- A larger hand check. The 20-paper check is enough to show the rule's error
  direction, not to estimate the share precisely.
- The second dataset or method the stage ladder needs before `replicated`
  (a sample from a different query set or source, such as arXiv).
