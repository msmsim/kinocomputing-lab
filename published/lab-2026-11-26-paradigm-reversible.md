---
kind: paradigm
question: q-004
paradigm: reversible
pin: false
---

**Reversible computing: energy recovery in small parts only**

Reversible and adiabatic computing tries to avoid throwing away the energy of every switch: change signals slowly and return the charge to a resonating power supply, rather than dissipating it as heat.

**Where it stands.** Vaire's 22 nm test chip, Ice River, was [reported](https://www.eetimes.com/vaire-demos-energy-recovery-with-reversible-computing-test-chip/) in 2025 to recover more energy than it spends in its resonator on a capacitor array (a factor near 1.77, per the company; we did not see the data). Nothing since shows a whole processor. A September 2026 [simulation of 16 nm adiabatic logic](https://arxiv.org/abs/2609.19999) finds energy advantages over ordinary CMOS in a few small circuits, though it lists three sources of loss and nothing was fabricated. A superconducting [shift register](https://doi.org/10.1109/tasc.2026.3653711) is reported to dissipate less than the Landauer limit per shift, which does not break the limit because the bits are moved, not erased (abstract only).

**What an outsider can use.** [MQT SyReC](https://github.com/munich-quantum-toolkit/syrec) for reversible circuit synthesis; the [Adiabatic Analysis](https://revcomp.org/aa-software/) ngspice models.

**What the lab could test.** Sweep the power-clock ramp time in a SPICE model and see where leakage ends the gain.

Checked 26 November 2026; first pass.
