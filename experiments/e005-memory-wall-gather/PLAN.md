# e005: How much does scattered access to memory cost against ordered access, as the data outgrows the caches?

Question: q-004 (paradigm: von-neumann). Written before any code runs.

## Hypothesis
In a von Neumann machine the cost of reading a number depends on where it is, not on the arithmetic. Reading a table that fits in cache is cheap whatever the order; reading a table far bigger than cache in random order pays a memory round trip per element, while reading it in order is hidden by prefetching. So the gap between random and ordered reads should open up as the table outgrows the caches.

## Prediction
Headline metric: ratio = (time per element, random indices) / (time per element, the same indices sorted), for a 1 GiB table of float64. Expected ratio at 1 GiB >= 3. Secondary: ratio at a 32 KiB table (cache-resident) <= 2.

## Kill condition
killed = ratio at 1 GiB < 3.0.

## Data
Synthetic: a float64 table of S bytes, 2^22 random indices drawn with SEED (rng), the same indices sorted. S in 32 KiB, 1 MiB, 32 MiB, 1 GiB. It stands in for any irregular memory workload (graphs, sparse maths, embedding lookups).

## Method
numpy `table[idx]` (take), best of 5 timings after a warm-up, per size and order. Indices are int64. Machine details (CPU model, cache sizes where readable) are recorded in result.json, since the answer depends on the hardware.

## Budget
Under 2 minutes, one core, ~2 GiB of memory.

## Threats
numpy's gather is not a hand-tuned kernel and includes interpreter overhead, which shrinks ratios. Timing noise on a shared runner. A machine with a huge last-level cache (hundreds of MiB) can hide a 1 GiB table partly; the cache size is recorded. One access pattern only; no claim about other workloads. Sorted indices over a small table repeat addresses, so the "ordered" baseline favours caches slightly; the comparison is the same indices in two orders, which is the point.

## 2026-11-23, after the first run (a note, not a change of plan)
The kill fired (ratio 1.06 at 1 GiB, threshold 3). The 32 MiB row shows the predicted gap (3.4x); the 1 GiB row does not. Reading the numbers: with 4M indices over a 128M-entry table, sorted indices are about 32 entries (256 bytes) apart, so the "ordered" arm touches a fresh cache line every read and is itself bandwidth-bound; it is not a sequential scan. The pre-registered ratio therefore does not measure what the hypothesis says. A follow-up with a true sequential baseline (a contiguous read of the same number of elements) would need its own PLAN before it runs.
