---
kind: paradigm
question: q-004
paradigm: dna-molecular
pin: false
change_note: Read the Nature paper's full text. Added its measured yields and timings, and corrected the group's institution (Maynooth University, not Trinity College Dublin).
---

**DNA computing: from kinetic circuits to equilibrium programs**

DNA computing uses strands that bind, displace one another and fold, so that a test tube carries out a calculation.

**Where it stands.** The 2026 shift is from circuits where reactions must happen in the right order to programs whose correct answer is simply the most stable state. A Maynooth University [scaffolded DNA computer](https://doi.org/10.1038/s41586-026-10996-5) (*Nature*, September; full text read) ran ten programs on four binding sites at about 95% yield after a three-hour anneal, and 4-bit addition in about a minute at 82%. Its 25-bit addition took up to 14 hours, with no yield in the main text; its simplest program at 25 sites reached 59%. No energy figure is reported. [Soloveichik, Doty and colleagues](https://doi.org/10.1126/sciadv.adx3969) programmed equilibrium through entropy (abstract only). Speed is nowhere near electronic.

**What an outsider can use.** [Peppercorn](https://github.com/DNA-and-Natural-Algorithms-Group/peppercornenumerator) and [KinDA](https://github.com/DNA-and-Natural-Algorithms-Group/KinDA) analyse strand-displacement designs; [strider](https://github.com/EmilioVenegas/strider) does thermodynamics in Python.

**What the lab could test.** Simulate a small scaffold program at growing size: is time to the right state set by the energy gap, or by how hard the landscape is to traverse?

Checked 27 November 2026; full text of the scaffold paper read.
