---
kind: experiment
question: q-003
pin: false
---

**Widened physical reservoir vs ESN, NARMA-10 and Mackey-Glass**

The first experiment (e002) found a toy physical reservoir far behind a tuned echo-state network on NARMA-10. Its diagnostic named two possible reasons: the physical side had stayed in its near-linear regime, and the ESN baseline had too. This experiment (e003) widens both sides in the directions the diagnostic pointed to, and adds a second task. It was pre-registered before any code ran, in the same design as e002: 50 readout features, 24 configurations per model, validation-only selection, and a test split read once.

The claim it rests on:

![[lab-2026-11-21-widened-reservoir-claim]]

What came out. On NARMA-10 the physical median test NMSE was 0.94 and the ESN's 0.12, five instances, seed 1; seed 2 gave 0.88 and 0.12. On Mackey-Glass at horizon 5 the figures were 0.16 and 0.0003 (seed 2: 0.11 and 0.0003). The pre-registered kill, on NARMA-10, fired on both seeds.

The widening did one thing and not the other. The physical features' effective rank rose from about 3 of 50 to about 31 on NARMA-10, but the accuracy gap did not narrow: the ratio went from 6.6 in e002 to 7.7 here.

Why it may be the parametrisation. The reviewer found that switching off the noise lowered the physical error on the same instances, so noise is not the cause. The likely cause is that the oscillators have a narrow frequency spread, share one drive, and produce near-collinear features. A wider frequency spread, a wider ridge grid, and a grid past the current corners would be the next tests. None is done.

Two caveats the reader should weigh. On Mackey-Glass the physical optimum sat at the grid corner, with the ridge penalty at its top, so that figure is a lower bound on what this model can do and the ratio overstates the gap. On NARMA-10 the ESN chose its near-linear input range, so the tanh-active regime did not win there. Mackey-Glass at horizon 5 is an easy task for the ESN, reaching about 3e-4 NMSE, so it has little room to separate the two.

Energy is not measured. The break-even figure from e002 still applies: under an assumed 4.6 pJ per multiply-accumulate, a physical network would have to spend under about 0.23 nJ per oscillator per input step to match the ESN's energy.
