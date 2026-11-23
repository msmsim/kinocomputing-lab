# e005 results

Run: seed 1, 4 CPUs (one used), Intel Xeon 6975P-C, 4 MiB L2 (per two instances), 480 MiB L3. About 30 seconds.

Prediction: random/sorted ratio at 1 GiB >= 3. Kill: ratio < 3.

Result: **killed.** Time per element, ns:

```
table     random  sorted  ratio
32 KiB     2.10    2.03    1.04
1 MiB      2.45    2.01    1.22
32 MiB     6.61    1.93    3.42
1 GiB     12.10   11.45    1.06
```

What came out: the predicted gap opens at 32 MiB (3.4x) and is gone at 1 GiB, because the sorted comparison arm is itself slow there (11.4 ns per element, about six times its 32 MiB cost). At 1 GiB the sorted indices are ~256 bytes apart, so every read fetches a new cache line: the "ordered" arm pays for bandwidth, the random arm for latency, and on this machine they cost about the same. The numpy gather also adds per-element overhead.

What it doesn't show: any sequential-scan baseline (not run); other machines (this one has an unusually large L3, which blunts the large-table row); other access patterns. The 1 GiB row is a result about this design of comparison, not a general statement about memory.

No claim is made. Seed 2 will be rerun by the lab.
