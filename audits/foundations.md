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

## Worked 2026-11-27 (shift 2): "reservoir computers work best at the edge of chaos"
- Chain: Packard 1988 and Langton 1990 (Physica D 42, 12) propose, for cellular automata and one-dimensional maps, that computational capacity peaks at the order-chaos boundary (as Carroll's references [17]-[18] give them; neither read tonight). Carried to neural reservoirs by Bertschinger & Natschläger 2004 (Neural Comput. 16, 1413) and Legenstein & Maass 2007 (Neural Netw. 20, 323), listed in Du & Wang's refs [16]-[17]; not read tonight. Reviewed against it: Carroll (arXiv 1906.03186, Chaos 30, 121109, 2020) and Du & Wang (arXiv 2607.17909, 20 July 2026), both read in full text (supplement of Du & Wang not available).
- What Carroll says: simulations "do not disprove" it but "tuning a reservoir computer to the edge of chaos does not guarantee the best performance"; in his polynomial-node example the minimum test error sits near the maximum of the largest Lyapunov exponent without it crossing zero; in many reservoirs positive exponent means divergence (an edge of stability, not chaos); the edge was derived for low-dimensional autonomous systems, and a driven reservoir makes "the edge" ambiguous (he used the driven, conditional exponent).
- What Du & Wang say: for Lorenz, Chen and a quasiperiodic target, with symmetric and asymmetric reservoirs, the best forecasting spectral radius coincides with none of three Lyapunov edges (isolated, teacher-forced, closed-loop); symmetric reservoirs have no edge in the scanned range yet still have an optimum. They cite (not read) Griffith et al. 2019 for good forecasting with zero spectral radius. Their own fix is an index that picks the optimum in their three targets; one group, one reservoir family (leaky tanh).
- Status: **overstretched** (true as a loose design heuristic and as a statement about cellular automata; not a rule that locates the best reservoir). Reviewer: weakened wording (second paper builds on the first, not independent; chain from automata to reservoirs is inferred from citations); fixed.
- Limits: two critical papers, both simulation, both the Lorenz-type forecasting family; the original Langton/Packard and 2004/2007 papers not read; no physical reservoir tested.

## Worked 2026-11-27 (shift 2): "a DNA computer added two 25-bit numbers (a 100-bit computation)" (Stérin et al., Nature 657, 646-652, 16 Sept 2026, doi 10.1038/s41586-026-10996-5; open access, full text read; supplementary notes not available)
- Story as told (abstract): a thermodynamically favoured Scaffolded DNA Computer on 10 programs "including ... Addition of 25-bit numbers—a 100-bit computation"; "small instances run in under a minute".
- What the main text says: ten programs run on a 4-position scaffold (N=4): 4-bit addition, 8-bit parity, etc. Typical anneal (80 to 20 C over 3 h, then 45 min hold): mean yield 96.7% for N=4 addition (worst output bit 91.6%); mean 95.3% over all programs. "Yield" is the completion level's distance between the low and high control levels. Each output bit is read in a separate experiment (four for 4-bit addition). Fastest runs (about 1 min, 80 to 55 C): mean yield 82.4% for addition, 81.2% over all.
- The 25-bit figure: a 25-position scaffold (a 624-base stretch of M13 DNA) with a hand-described, "harder" input (longest run of carry-passing positions M=5; the paper says M<=5 covers over 84% of 25-bit pairs) "has good completion within 14 h"; no yield number in the main text; the M=4 case "roughly 1 h" (Supp. Note 9.4, unread). The paper counts "25 carry and 25 output bits" plus the 2x25 input bits as 100 bits of compute.
- Same paper, same scale-up: isoenergetic Bit Copy (the simplest program) gave 71% yield over 20 positions and 59% over 25 positions on a 14 h anneal. The authors say scaffold energies varied widely (duplex dG -20.9 to -11.1 kcal/mol vs -9.42 to -6.61 for compute domains) and that "mere thermodynamic favourability may not be sufficient" for larger N.
- Reuse: one-bit copy renewed 25 times; addition programs 9 times; a counter 24 times; mean signal loss 0.094 normalized fluorescence per eight repeats.
- No energy per computation is reported; "energy-efficient" is stated as an aspiration ("we hope to stimulate dialogue towards consideration of ...").
- Status: **holds** as a demonstration at 4 positions (small programs, ~95% yield, sound controls); the 25-bit scale-up is **overstretched only if the abstract is read as routine scalability**: one harder (M=5) instance shown, 14 h, no yield in the main text, while the simplest program at 25 positions gave 59% (a different program, so a reference point not the addition yield). Reviewer: weakened wording ("chosen instance" unfair; M=5 is harder than typical; 82.4% is addition, 81.2% all programs; supplement unread); fixed.
