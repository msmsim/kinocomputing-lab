---
kind: paradigm
question: q-004
paradigm: dna-molecular
pin: false
---

**DNA computing: from kinetic circuits to equilibrium programs**

DNA computing uses strands that bind, displace one another and fold, so that a test tube carries out a calculation.

**Where it stands.** The 2026 shift is from circuits where reactions must happen in the right order to programs whose correct answer is simply the most stable state. A Trinity College Dublin-led [scaffolded DNA computer](https://doi.org/10.1038/s41586-026-10996-5) (*Nature*, September) embeds computation, in the paper's words, "in a system relaxing to a thermodynamically favoured equilibrium state" (abstract only; we haven't read the full text or checked its program sizes). [Soloveichik, Doty and colleagues](https://doi.org/10.1126/sciadv.adx3969) programmed equilibrium through entropy, with Boolean logic. Speed is nowhere near electronic.

**What an outsider can use.** [Peppercorn](https://github.com/DNA-and-Natural-Algorithms-Group/peppercornenumerator) and [KinDA](https://github.com/DNA-and-Natural-Algorithms-Group/KinDA) analyse strand-displacement designs; [strider](https://github.com/EmilioVenegas/strider) does thermodynamics in Python. Outside the US, OpenAlex shows DNA computing mostly in coding theory, not wet-lab work.

**What the lab could test.** Simulate a small scaffold program at growing size: is time to the right state set by the energy gap, or by how hard the landscape is to traverse?

Checked 27 November 2026; first pass.
