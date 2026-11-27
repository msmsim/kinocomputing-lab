# e010: fading-memory controls on NARMA-10 (question q-003)

Written 2026-11-27 before any code runs.

## Why
e009 found a linear model of the last ten inputs (exact memory) scores NMSE 0.33, better than the 0.6-0.8 a measured MEMS reservoir chip reports. The chip's authors blame short, fading memory. A fairer yardstick has memory that fades.

## Hypothesis
A linear readout of 50 leaky integrators of the input (decay rates 0.05-0.95, no nonlinearity) has exponentially fading memory and scores NMSE in the chip's band, 0.5-0.9. A single-node delay reservoir (50 virtual nodes, random input mask, tanh, neighbour coupling) lands between that and the ESN: 0.15-0.35.

## Kill condition
Killed if the leaky-linear median NMSE (10 instances, seeds SEED..SEED+9) is outside 0.5-0.9, or the delay reservoir's median is outside 0.15-0.35.

## Data / budget
Same NARMA-10 generator, train/test sizes and ridge selection as e009 (1500 train, 400 test, lambda picked on last 300 training points). Delay-reservoir grid: alpha in {0.5,0.8}, coupling in {0.3,0.6}, input gain in {0.1,0.5,1.0}, chosen on validation. Numpy only, under a minute.
