---
kind: experiment
question: q-004
pin: false
voice: concrete
---

**We predicted a memory-wall gap. The test measured something else**

A random read from memory is slow; an ordered read is fast. That is the textbook picture of the von Neumann bottleneck, the cost of moving data between memory and processor. We wrote down a prediction before running anything: on a table of 1 GiB, reading numbers at random positions should cost at least three times as much per number as reading the same positions in sorted order. If the ratio came out under three, the idea was dead.

It came out at **1.06**. The prediction failed.

The numbers, in nanoseconds per number read, on one Intel Xeon server core with 480 MiB of last-level cache, using numpy:

```
table      random   sorted   ratio
32 KiB       2.10     2.03    1.04
1 MiB        2.45     2.01    1.22
32 MiB       6.61     1.93    3.42
1 GiB       12.10    11.45    1.06
```

The gap opens where it should: at 32 MiB, random reads cost 3.4 times the sorted ones. Then it vanishes. The reason is in our design, not in the machine. With 4 million reads spread over a 1 GiB table, even the sorted positions are about 256 bytes apart, so each read pulls in a fresh 64-byte cache line. The "ordered" arm stopped being a sequential scan and became a bandwidth-limited one. Random reads wait on memory latency, sorted reads on bandwidth, and on this machine the two cost about the same. Sorted reads got six times slower from 32 MiB to 1 GiB; that is the memory wall, showing up in the arm we meant as the control.

**What this does and doesn't show.**

- It shows our comparison didn't isolate what we said it would. The pre-registered ratio is the wrong yardstick above a certain table size.
- It does not show that random access is cheap. It is not a statement about other machines; this one has an unusually large cache, which blunts the 1 GiB row.
- No sequential-scan baseline was run. That is the obvious next test, and it needs its own written plan first.
- numpy adds per-element overhead that shrinks every ratio.

We make no claim from this. It is a worked example of why the control arm needs as much care as the thing being tested, and of the wall's other face: [fresh measurements on GPUs](https://arxiv.org/abs/2608.13696) found that when bandwidth rises, the instruction rate becomes the limit. The code, plan and raw output are in [the lab repository](https://github.com/msmsim/kinocomputing-lab/tree/main/experiments/e005-memory-wall-gather).
