# Neuromorphic / spiking computing

First pass 2026-11-28. Entry: lab-2026-11-28-paradigm-neuromorphic.

Checked (OpenAlex records): Kudithipudi et al., Nature 2025 "Neuromorphic computing at scale" (doi 10.1038/s41586-024-08253-8); NeuroBench, Nat Commun 2025 (10.1038/s41467-025-56739-4); Kwisthout et al. complexity theory for SNNs, Neuromorphic Comp. Eng. 2026 (Netherlands, 10.1088/2634-4386/ae2cc1).
Regional (UK/EU): UKRI grants exist (EP/P00542X/1 neuromorphic biped control, closed; EPSRC NeuroComm brain-inspired wireless). Chip makers outside US: SpiNNaker (Manchester/Dresden), Innatera (NL), SynSense (CH) — from the scan, not re-verified.
Scan leads, NOT verified: Hala Point >15 TOPS/W on a 10:1-sparse 8-bit MLP, 2,600 W max (Intel newsroom); Xylo Audio 2: 291 uW, 6.6 uJ/inference, 95% (SynSense PDF; preprocessing excluded); TrueNorth 65 mW, 46 GSOPS/W (Merolla 2014); Loihi ~15 pJ/synop (Davies 2019 survey arXiv 1901.03690).
Tools: Lava, NeuroBench, NIR (neuroir.org), Rockpool, snnTorch, Norse, Nengo, Brian2.
Founding stories for the ledger: TrueNorth "five orders of magnitude" energy; Loihi 15 pJ/synop; Hala Point 15 TOPS/W (sparse special case).
Lead: a question on whether SNN energy edges survive counting preprocessing/idle power.
