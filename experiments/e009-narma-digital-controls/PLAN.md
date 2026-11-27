# e009: where do plain digital controls land on NARMA-10, next to a measured MEMS reservoir?

Question: q-003 (standardised digital controls). Written before the run.

## Context
A measured coupled-drum MEMS reservoir (arXiv 2601.02617) reports NARMA-10 NMSE of about 0.6 to 0.8 (1500 training, 400 test inputs, input in [0, 0.5]). NMSE 1.0 is the error of always predicting the test mean. Without a digital baseline the number is hard to read.

## Hypothesis
A purely linear digital control (a 10-tap delay line with a ridge readout, no nonlinearity, no recurrence) lands in the same band as that MEMS device (0.5 to 0.9), while an N=50 echo-state network and an N=50 nonlinear random-feature map of the delay window do much better (under 0.3).

## Kill condition (in code)
Killed if the median linear-control NMSE over 10 instances falls outside [0.5, 0.9], or if the median ESN or random-feature NMSE is 0.3 or above.

## Method
NARMA-10 as in e002 (Atiya-Parlos form), 1500 train / 400 test after 100 washout, 10 instances (seeds SEED..SEED+9). Controls, all ridge readouts with lambda chosen on the last 300 training points: linear (10 taps u(t..t-9)); random features (50 tanh units of the 10-tap window, fixed random weights); ESN (50 tanh units, spectral radius 0.9, leak 1, input scale 0.5, small grid over rho 0.6/0.9 and scale 0.1/0.5 picked on the validation points).

## Limits
Simulation, not the device. Different input scalings, delay loops and masks than the MEMS paper's; a comparison of orders of magnitude of error, not a ranking of devices. Energy not considered.
