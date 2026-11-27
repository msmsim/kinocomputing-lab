---
kind: analysis
question: q-010
section: audits
pin: false
---

**DNA computer: 4-bit sums in a minute, 25-bit in 14 hours**

A DNA computer published in *Nature* in September "added 25-bit numbers", a 100-bit computation, and the phrase has travelled. Read in full, the paper shows something sturdier and smaller: ten small programs on a four-position scaffold that come out about 95% right after a three-hour anneal, and one 25-position addition that, the paper says, completed well within 14 hours. The main text gives no yield for it; the simplest 25-position program, copying one bit along the scaffold, reached 59%.

**What the machine is.** A scaffolded DNA computer (from Damien Woods's group at Maynooth University in Ireland) is a long DNA strand with numbered binding sites. Short "tile" strands, mixed in at ten times the scaffold's concentration, compete for each site; a tile binds its site and, through its two ends, to its neighbours' ends. Tiles whose ends mismatch their neighbours pay an energy penalty, so the one arrangement with no mismatches, the answer, is the most stable. The mixture is heated to 80 °C and cooled, and the strands settle into it. Nothing checks for errors along the way: the answer is whatever is most stable. That is the paper's point, and it is a different bet from the strand-displacement circuits that have to run their steps in order and leak when they don't.

**What was measured at four positions.** Ten programs, among them 4-bit addition, 8-bit parity, multiplying by 3, dividing by 2 in base 3, and balanced brackets. After the main anneal (80 °C down to 20 °C over three hours, then 45 minutes) the mean "yield" was 96.7% for addition and 95.3% over all programs. Yield here is how far the fluorescence reading sits between the all-low and all-high control, so 100% means as clean as a control built without computation. The worst single addition output was 91.6%. Each output bit was read in a separate experiment, four for a 4-bit sum. Rapid anneals, dropping from 80 °C to 55 °C in under a minute, still separated 0 from 1, at a mean yield of 82.4% for addition and 81.2% over all programs. A one-bit copy was re-run 25 times by adding two strands each time, with little loss of signal.

**What was measured at 25.** The abstract's "addition of 25-bit numbers" is one run on a 25-position scaffold cut from a 7.2-kilobase viral genome. The paper reports the scaffold's sites bind with widely different strengths (duplex free energies from −20.9 to −11.1 kcal/mol, against −9.4 to −6.6 for the designed tiles), which the authors call a harsh test. The addition shown is a "harder" example, one where the longest run of positions passing a carry along is five (random inputs average four, and the paper says runs of five or fewer cover over 84% of pairs). It "has good completion within 14 h"; an input with a run of four took "roughly 1 h". The main text gives no yield figure for either, and shows no statistics over many 25-bit inputs; the numbers may be in the supplementary notes, which we couldn't read. The paper's other scale-up test was the bit copy, redesigned so the energy landscape is flat, on the same 25-position scaffold: 71% yield across 20 positions, 59% across 25, after 14 hours. That is a different program from the addition, so it is a reference point for the scaffold, not the addition's own yield. The authors write that for larger scaffolds "mere thermodynamic favourability may not be sufficient".

**Our reading.** The four-position results are clean, and the controls are sound. The scale-up is real but unfinished: the authors report good completion for the addition after hours, the figure caption calls the 25-position computation "reliable", and the same paper's simplest program reached 59% there. The authors themselves say scaling beyond four positions may need more than favourable energetics. "A 100-bit computation" counts the 50 input, 25 carry and 25 output bits, not 100 independent decisions. No energy per computation is reported; the paper's hope for "energy-efficient computing platforms" is an aspiration, not a measurement. Speed is minutes to hours for what a microcontroller does in nanoseconds, so the case for the approach is robustness, reuse and the physics, not throughput.

The claim, in short:

![[lab-2026-11-27-dna-computer-25-bit-claim]]

**What would change this.** A yield number for the 25-bit addition, or a larger scaffold with designed sequences that holds above 90%, would make the scale-up claim stand without caveats. We read the main text only; the supplementary notes carry the per-input data.

Source: [Stérin et al., "A thermodynamically favoured molecular computer", Nature 657, 646–652 (2026)](https://doi.org/10.1038/s41586-026-10996-5), open access. Our working notes: [the audit ledger](https://github.com/msmsim/kinocomputing-lab/blob/main/audits/foundations.md).
