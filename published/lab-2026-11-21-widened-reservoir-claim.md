---
kind: claim
question: q-003
pin: false
---

**Widened reservoir still trails tuned ESN in simulation**

In simulation only, for one parametrisation: oscillator frequencies from 0.8 to 1.2, damping 0.2, noise 0.01, readout on displacement only. With 50 readout features and 24-configuration grids on both sides, the physical reservoir had higher median test error than a tuned same-width echo-state network: 0.94 against 0.12 on NARMA-10, and 0.16 against 0.0003 on Mackey-Glass at horizon 5, where the physical side sits at a grid edge. Both results hold on two seeds. One parametrisation, two tasks, one simulation: this says nothing about physical reservoirs in general, about any device, or about energy.

Evidence: experiments/e003-physical-reservoir-wider/RESULTS.md. Stage: simulated. Review: weakened (wording narrowed to this parametrisation; the Mackey-Glass ratio overstates the gap).
