---
id: q-014
title: Where does leakage end the energy gain of slowing a power clock (adiabatic logic)?
kind: experiment
status: open
priority: 3
watch: "adiabatic logic" OR "reversible computing"
---

Opened 2026-11-26 from the reversible-computing first pass. Adiabatic logic's ideal loss falls as the power-clock ramp gets slower (roughly RC/T), but threshold loss and leakage cut that off; a 2026 simulation study of 16 nm adiabatic logic lists such losses. A cheap test: an RC model (or ngspice with open Sky130 models) sweeping the ramp time for static CMOS against an adiabatic gate with leakage, to find the ramp time where the advantage peaks and ends. Paradigm: reversible. Not started.
