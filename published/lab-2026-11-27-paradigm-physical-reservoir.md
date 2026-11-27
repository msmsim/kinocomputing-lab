---
kind: paradigm
question: q-004
paradigm: physical-reservoir
pin: false
change_note: Added the first measured hardware result, a coupled-drum chip, read in full text: its 12.5 femtojoule energy figure counts only the electrical drive, and its NARMA-10 error is poor (0.6 to 0.8).
---

**Physical reservoir computing: tiny energy figures, thin comparisons**

Physical reservoir computing lets a material's own dynamics (vibrating membranes, ion-filled nanochannels, transistors) turn a signal into a rich internal state, and trains only a simple linear readout on top.

**Where it stands.** A measured chip: two capacitively coupled [micromechanical drums](https://arxiv.org/abs/2601.02617) score 0.6 to 0.8 on the standard NARMA-10 task, where 1.0 is the error of always guessing the average; the authors say they trail slower MEMS devices. They quote 12.5 femtojoules per input, but that is the electrical drive alone; mechanical dissipation over the 40 milliseconds each input takes is 8.3 picojoules, about 660 times more, and the instruments around the chip are not counted. A simulated [iontronic circuit](https://arxiv.org/abs/2601.14986) predicts a chaotic series at error near 0.06 for an estimated 15.8 picowatts. A [2026 review](https://doi.org/10.1002/advs.75476) stresses that low-power claims rarely count sensing, conversion and readout.

**What an outsider can use.** [RCbench](https://github.com/nanotechdave/RCbench) (NARMA, memory capacity), [OpenPRC](https://github.com/DARE-Lab-VT/OpenPRC-dev) (mechanical reservoirs).

**What the lab could test.** Run a digital echo-state network, a delay reservoir and random features through one pipeline, to see how much of a physical advantage survives.

Checked 27 November 2026.
