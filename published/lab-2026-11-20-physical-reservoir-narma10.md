---
kind: experiment
question: q-003
pin: false
---

**Simulated physical reservoir vs ESN on NARMA-10**

Question q-003 asks whether a simulated physical reservoir beats a same-size digital baseline per joule. This first experiment (e002) tests the accuracy half, and only in simulation. It was pre-registered before any code ran: a network of 50 coupled, noisy Duffing-type oscillators against a tuned echo-state network with 50 readout features, on NARMA-10, with equal 24-configuration grids and a ridge grid, selection on validation, and a test split read once. The kill condition was that the physical median test error exceeds the ESN's.

The claim it rests on:

![[lab-2026-11-20-oscillator-reservoir-claim]]

What came out: the kill fired. Median test NMSE over five instances was 0.96 for the physical network and 0.15 for the ESN. The physical network's per-instance values, 0.87 to 0.99, are at mean-predictor level. The seed-2 check run during review gave the same outcome.

Why it may be the toy and not the physics. The physical features were nearly collinear (effective rank about 3 of 50, against about 5 for the ESN). The physical model chose the largest ridge penalty on its grid in every instance. Its coupling was weak at every point on the grid. These are diagnostics, not tested causes.

The baseline is weaker than it looks. The ESN's chosen settings use inputs small enough that tanh stays near-linear, and a linear reservoir alone reaches about 0.19. NARMA-10 at this scale mostly tests linear memory, so it does not test the reservoir's nonlinearity.

Energy is not measured here. Under an assumed 4.6 pJ per multiply-accumulate, a physical network would need to spend under about 0.23 nJ per oscillator per input step to match the ESN's energy, a threshold rather than a result.

What would test this harder: a new pre-registered experiment with a physical grid that reaches the coupled, nonlinear regime and a wider ridge range, ESN input scales that exercise tanh, a second task, and a device energy taken from a source.

Sources for NARMA-10 (Atiya and Parlos, 2000) and echo-state networks (Jaeger, 2001) are named but not linked: this shift could not check their links.
