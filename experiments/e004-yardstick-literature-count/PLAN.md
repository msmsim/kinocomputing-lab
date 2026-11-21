# e004: Do alternative-hardware papers judge themselves on the digital yardstick?

Question: q-006 (tests a001 step 4 and claim c-003). Written before any data
is fetched or any code runs; never edited after the first run.

## Hypothesis

Papers that present alternative computing hardware (analog in-memory,
photonic, thermodynamic/probabilistic, neuromorphic, physical reservoirs,
memristive crossbars) mostly report their results against the incumbent
stack: a digital baseline (GPU, CPU, floating point, a von Neumann machine)
on a standard task, or in the energy-per-operation units that the incumbent
set. Mechanism: venues and reviewers ask for the comparison the incumbent
already has, so a paper's own substrate-native measure is often reported
alongside, not instead of, the digital one.

## Prediction

Headline metric: the share of sampled papers whose abstract uses the digital
yardstick (rule D below). Prediction: at least 50% of papers do. Reported
with a 95% Wilson interval. Secondary, named as such: the share that use a
substrate-native measure only (no D), and the share using both.

## Kill condition

If the point estimate of the D share is below 50%, the claim that
alternative-hardware papers are judged on the incumbent's yardstick is not
supported at this sample size, and c-003's yardstick step is in trouble.
Decided in `run.py` and written as `"killed": true` when the D share < 0.50.
(If the Wilson interval straddles 50%, the result is reported as
inconclusive, not as killed; `killed` still follows the point estimate.)

## Data

OpenAlex works, fetched once by `fetch.py` (free, no key) for six queries:
"analog in-memory computing", "photonic neural network hardware",
"thermodynamic computing", "neuromorphic hardware", "physical reservoir
computing", "memristor crossbar computing". Filter: publication year 2024 or
later, article type, abstract present. Up to 50 works per query, deduplicated
by OpenAlex ID. The raw response is committed as
`data/openalex_snapshot.json` (small) so the replication codes the same
records; OpenAlex's live results will drift, and the snapshot is the sample.

Sampling: `run.py` draws N = 150 papers without replacement from the pool
with `np.random.default_rng(SEED)`, or the whole pool if it is smaller.

## Method

1. Rebuild each abstract from OpenAlex's inverted index.
2. Rule D (digital yardstick): the abstract names a digital comparator
   (GPU, CPU, digital, von Neumann, floating-point, FP32/FP16, conventional
   processor or hardware, electronic baseline) and a comparison word within
   the same abstract (compar*, baseline, versus, vs, outperform*, speedup,
   faster, than, relative to).
3. Rule N (substrate-native measure): the abstract reports energy per
   operation or per inference (TOPS/W, pJ, fJ, nJ, "energy efficien*",
   "per joule", "energy-per-") or a device-native quantity (conductance,
   noise, ... ) with no digital comparator. Rule N is coded but reported only
   as a secondary.
4. Code each paper: D only, N only, both, or neither. Headline = share with D.
5. Hand-check: 20 papers drawn from the sample with seed 2 are read by the
   researcher and coded by hand. Rule precision and recall against the hand
   codes are reported as the rule's error. The hand codes are kept in
   `hand_check.md`, not in `result.json`.
6. Write `result.json`: metric, value (D share), Wilson interval, the secondary
   shares, n, seed, killed.

## Budget

Runner time: seconds (pure Python on a cached snapshot). Fetching once:
six free OpenAlex requests. Tokens: the hand check reads 20 abstracts.

## Threats

- Keyword rules are crude. Rule D misses papers that name a comparator only
  in the body, and catches papers that mention a GPU for a non-comparative
  reason. The hand check gives the error; the claim is stated at the rule's
  error, not beyond it.
- Query choice selects the population. The six queries are fixed here; the
  sample is biased toward papers that name their hardware.
- Abstracts only, not full texts. Full texts may use the yardstick more.
- One sample, one snapshot. The seed changes only which 150 of the pool are
  coded; the pool itself is fixed.
- The threshold of 50% is the researcher's, pre-registered tonight. It is a
  judgement, and it is stated as one.

## Amendments

- 2026-11-21 (after the first run): the snapshot moved from `data/` to
  `snapshot/`. The repository's `.gitignore` excludes `experiments/*/data/`,
  so the file would never have been published. Contents unchanged (byte-compared
  before the move); `run.py` and `fetch.py` paths changed to match; both seeds
  re-run and the results are unchanged. No change to the rules, the threshold
  or the sample.
