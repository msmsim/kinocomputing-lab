# Digital von Neumann computing (von-neumann)
Round-up (PI): stored-program, exact logic on bits; TSMC A16 promised ~15-20% power saving; Dennard scaling ended mid-2000s.
## 2026-11-23 (first pass)
- Exa research agent (low) + reading. Checked: arXiv 2608.13696 (Valk; L4 vs GH200 cuDF/TPC-H: 13.4x bandwidth, 2.5x instruction rate, 5.2x speed); arXiv 2607.24196 (PIMID simulator, v2 9 Sep). Not opened (403): ACM 10.1145/3815581 (digital DRAM-PIM evaluation; agent reports modeled 1.2-3.2x CPU speedups once data movement counted, 0.2-0.5x vs GPU) — a lead, unverified. cxlbench GH200/MI300A latency paper (Springer, Oct 2026): lead, unverified.
- Organisations: UVA LavaLab (PIMeval), ETH Systems Group (Alonso, Valk), Hasso Plattner Institute (cxlbench).
- Leads: roofline/pointer-chase sweep on a laptop (cheap, tests the incumbent); PIMeval small matrix. Question not opened: measures the incumbent, not an alternative.
