---
kind: notebook
question: q-004
pin: false
---

**A flash-memory fix for AI's memory wall, reported in modelling**

A new preprint says the memory wall in AI serving, where chips wait for data rather than compute, can be eased by putting cheap, large flash memory next to the GPU and having it do part of the work. Its headline is a latency cut of 49% to 67%, and up to 64% less energy per generated token. Those figures come from modelling, not from a built system, and that is the first thing to know about them.

The setting is video reasoning by several AI agents at once. Each agent needs the model's weights plus its own running memory of the conversation (the key-value cache), and together they can exceed the fast on-package memory (high-bandwidth memory, HBM) of a GPU. High-bandwidth flash (HBF) adds capacity, but the GPU then sits idle waiting on it. The [Synapse](https://arxiv.org/abs/2611.29901) design overlaps flash-side computation of the attention step and expert layers with GPU work on other agents. Across three models the authors report 48.92% to 66.60% lower end-to-end latency, up to 2.98 times the throughput, and a projected 46% longer flash lifetime from smarter refresh, where the comparison is a GPU using flash passively.

What this does and doesn't show. We read the abstract only, not the full paper. The energy figure is labelled "modeled" by the authors, the hardware (HBF) is not yet a mass-market product, and the baseline is a GPU using flash passively, not the best software on today's hardware. It is evidence that moving a slice of computation to where the data sits is worth modelling, which is the same direction as analog in-memory computing, not evidence that a chip exists that does it.

It is a useful companion to our own measurement of the memory wall, where [13 times more GPU memory bandwidth bought only 5 times the speed](https://www.kinocomputing.com/lab-2026-11-23-paradigm-von-neumann) on database queries: the wall is real, and the proposed escapes are still mostly projections. We will watch for a measured result on real flash hardware.
