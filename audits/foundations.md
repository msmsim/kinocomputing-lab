# The foundations ledger

Load-bearing stories in the fields the lab tracks: an anecdote, a quotation,
a statistic or a single study that many later papers, talks and pitches
rest on. One entry each, added when the lab meets one (in a paradigm's
rotation, a paper, a take) and updated as it is checked. AGENT.md, "The
foundations audit", says how. Newest additions at the bottom.

Status: `untraced` (noted, not yet checked) → `traced` (followed to its
primary source) → `holds` | `overstretched` (true, but cited for more than
it shows) | `apocryphal` (false, misattributed, or not what the source
says). A verdict other than `holds` needs the reviewer's agreement before
it is published.

Entry format:

- **The story, as it is usually told.** Paradigms: ids. Typical citations:
  where it appears. Status: … Primary source: link. Note: kinocomputing
  address, once published.

## Entries

(None yet.)

## Added 2026-11-24 (from tonight's paradigm passes; untraced)
- Physical symbol system hypothesis (Newell & Simon 1976): "necessary and sufficient means for general intelligent action" — Nilsson 2007 (pssh.pdf, read) quotes it as "...for intelligent action" without "general" and says Newell and Simon themselves allowed it "could indeed be false"; the 1976 CACM text itself (doi 10.1145/360018.360022) was not reachable tonight (ACM 403, Rutgers mirror 404). Status: partial, primary not read.
- Logic Theorist found a "shorter proof" of a Principia theorem — queued.
- MYCIN performed comparably to experts — queued.
- AlexNet 2012 as the decisive deep-learning breakthrough; backprop credit (1986) — queued.
- AI training energy "doubling every 4–6 months" — queued.
- Kaplan 2020 smooth power laws; Chinchilla 2022 compute-optimal — queued.

## Added 2026-11-25 (untraced)
- Crossbar "computation where the weights sit avoids von Neumann data movement" (IBM explainer) — queued.
- Ambrogio 2018 Nature: software-equivalent PCM training, 28,065 GOPS/W calculated — queued.
- Shen 2017 nanophotonic NN: "orders of magnitude" energy, ~100x speed; 56 MZI vowel task ~3/4 accuracy on 180 examples — **overstretched** (2026-11-25, full text minus supplement; reviewer agreed). Energy bound is nonlinearity trigger light only; demo chip held ~10 mW/modulator; nonlinearity was electronic in the demo; 76.7% is best of 3 runs. Evidence: audits/evidence/shen-2017-arxiv-1610.02365.txt. Published: lab-2026-11-25-optical-neural-net-energy-claim-audit.
- Sub-attojoule / sub-photon per op optical lower bound is optical power only, not system — queued.

## Added 2026-11-26 (untraced)
- Gaussian/Ornstein-Uhlenbeck thermodynamic linear algebra: asymptotic speedup linear in matrix dimension (npj Unconventional Computing 2024) — queued.
- p-bits invert Boolean logic and can replace stochastic nanomagnets (Camsari et al., PRX 2017) — queued.
- Landauer 1961 kT ln2 per erased bit; Bennett 1973 uncompute; adiabatic loss falls as RC/T — queued.
- "Below the Landauer limit" superconducting shift register: moves, not erases, bits (TASC 2026) — queued.
- Magic-state factories need "up to 95%" of a quantum computer (Google's account) — queued.
- Threshold theorem as justification for scalable QEC; Shor 1994 and Feynman 1982 founding arguments — queued.

## Worked 2026-11-26 (shift 2): "brain and chatbot both ~10^21 above Landauer" (symmetrybroken.com, Coherence at 300 Kelvin, 2026-02-20)
- Recomputed from the essay's stated inputs: kT ln2 at 300 K = 2.87e-21 J. Brain 20 W / 10 bits/s = 2 J/bit = 10^20.84 x floor. GPT-4o 0.3 Wh / 500 tokens / 1.3 bits = 1.66 J/bit = 10^20.76 x floor. Split into per-op x ops-per-bit also reproduces (brain 7e7 x 1e13; GPU 3.5e9 x 1.5e11). Arithmetic holds.
- Inputs traced: 10 bits/s is Zheng & Meister (arXiv 2408.10234), a behavioural throughput, not the brain's total information processing (they say so). 20 W is the whole brain. 0.3 Wh is Epoch AI's (Feb 2025) estimate for a *typical short text* query: 100 B active params, 1 s of H100 time at 1,500 W x 70%; Epoch calls it somewhat pessimistic and says long-input queries run 2.5-40 Wh. 1.3 bits/token is a text-entropy figure.
- Status: **overstretched** as evidence of a shared mechanism (the essay itself says "suggests rather than proves"). Not sent to reviewer: no verdict against the essay's arithmetic, only a note on how much the match can bear. Published as a note with a conjecture-stage claim.

## Screened 2026-11-26 (shift 2): Landauer's principle (kT ln2 minimum heat to erase a bit)
- Chain: Landauer 1961 (IBM J. Res. Dev.), stated for erasure of a logically irreversible operation; Bennett 1973 shows computation can be made logically reversible; Bérut, Arakelyan, Petrosyan, Ciliberto, Dillenschneider, Lutz 2012 (Nature), and Bérut/Petrosyan/Ciliberto 2015 (J. Stat. Mech., abstract read via OpenAlex: one colloidal particle in a double well; mean heat dissipated saturates at the Landauer bound for long erasure cycles).
- Status: **holds** as a bound on erasure, measured in a one-bit colloidal system at the limit of slow cycles. Screen only: full texts of 1961/1973/2012 not read tonight; keep queued for a full-text pass before a write-up. Caution for citers: it is a floor on erasing, not a prediction of what a real chip dissipates (essay comparisons to 10^21 x the floor are about practice, not the bound).
