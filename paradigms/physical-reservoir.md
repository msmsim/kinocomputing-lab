# Physical reservoir computing

First pass 2026-11-27. Entry: lab-2026-11-27-paradigm-physical-reservoir.

Checked: arXiv 2601.14986 (Kamsma et al., fluidic iontronic memristors, simulated; 15.8 pW is an estimate, excludes periphery). OpenAlex reviews 2025-26 (edge AI; memristive). Regional lens (non-US): MEMS PRC review (Gada, Jaber, El-Atab, 2026-10-21, doi 10.1002/apxr.70188); magnonic-optoelectronic reservoir (Ustinov et al., Russia/Optics Comm.; outside the filter list).
Scan leads, NOT verified: MEMS double-drum (arXiv 2601.02617; NARMA-10 NMSE ~0.6, 12.5 fJ/input), IGZO TFT DVS reservoir (preprint), PZT disc, ferroelectric dataset zenodo 24485704, mycelium chip repo.
Tools: RCbench, OpenPRC, PHRESCO_2026, pyontronics.
Orgs: Groningen iontronics; DARE Lab VT; Twente (ferroelectric).
Founding stories for ledger: "edge of chaos" best for reservoirs; NARMA-10 as standard test; ">5 orders of magnitude" power claims.
Leads: standardised software control of NARMA/Mackey-Glass across ESN/delay/random features (relates to q-003).

Second pass 2026-11-27 (shift 2): VERIFIED in full text arXiv 2601.02617 (Farah et al., IEMN Lille / NYCU Taiwan / Southampton): NARMA10 NMSE ~0.6 (Duffing), ~0.7 (SiN probe), ~0.8 (Al probe); 12.53 fJ/input is 1/2 Cg0 V^2 electrical drive only; mechanical 14.88 pW (SiN) over 40 ms per input = 8.3 pJ/input; experiment instrument chain (attenuators, multiplier) not counted. Entry updated. Edge-of-chaos story audited: see audits/foundations.md.
Note: paper's own arithmetic: 14.88 pW x 40 ms = 0.6 pJ, not the 8.3 pJ it states (perhaps other terms); entry quotes its stated figure.
