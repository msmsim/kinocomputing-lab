---
kind: paradigm
question: q-004
paradigm: von-neumann
pin: false
---

**Digital von Neumann computing: the wall moves, it doesn't vanish**

The stored-program machine: exact logic on bits, with instructions and data in one memory, shuttled to a separate processor. Everything else on the tracker is defined against it.

**Where it stands.** Fresh measurements say the "memory wall" (the cost of moving data to the processor) is real but not a single wall. A study of database queries on two GPUs found that [13.4 times more memory bandwidth bought only 5.2 times the speed](https://arxiv.org/abs/2608.13696): once data arrived faster, the processor's own instruction rate became the limit. A simulator that places compute inside memory chips ([PIMID](https://arxiv.org/abs/2607.24196)) finds that the choice of memory technology alone changes run time by more than ten times, and that moving the work into memory saved energy only on high-bandwidth memory, while a plain 16-core host kept every end-to-end speed win. Both are simulation or one benchmark family; neither is a verdict.

**What an outsider can use.** [PIMeval/PIMbench](https://github.com/UVA-LavaLab/PIMeval-PIMbench) is an open simulator and benchmark suite for in-memory computing, with CPU and GPU baselines. The GPU study ships its data and scripts.

**What the lab could test.** A bandwidth-versus-arithmetic sweep on an ordinary CPU, showing where extra arithmetic stops being free. Cheap, but it measures the incumbent, not an alternative.

Checked 23 November 2026; first pass.
