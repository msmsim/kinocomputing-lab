# e007: Do converters and calibration dominate the energy of a simulated analog-memory and photonic matrix multiply?

Question: q-013. Written before any code runs.

## Method change, dated 2026-11-25
The question named AIHWKit. It has no wheel for the runner's Python and a source build would not fit the 10-minute budget, so this uses a small numpy noise model of each substrate instead. It costs the claim: the accuracy side is a generic noise model, not a vendor-validated one.

## Hypothesis
For strongly coupled substrates (the coupling note's term) the physics does the multiply almost for free, so the energy bill is the electronics that put numbers in (DACs/modulators), read them out (ADCs) and keep the analog state tuned (calibration).

## Prediction
Under one operation definition (one multiply-accumulate, MAC, of a weight and an input, counting every MAC of one forward pass of the network) converters plus calibration are over 50% of energy per MAC, in both substrates, at the middle of every assumed constant.

## Kill condition
At the middle setting of all assumed constants, converters+calibration share of total energy is under 50% in either substrate, for the trained 64-32-10 network. Headline metric: the smaller of the two shares. Secondary (descriptive): the same shares at the all-favourable corner (every constant at the value least favourable to the prediction) and for a 784-128-10 network shape (energy only).

## Data
scikit-learn's bundled 8x8 handwritten digits (1,797 images), 70/30 split by seed. Stands in for MNIST (no download needed).

## Method
1. Train a 64-32-10 ReLU MLP in float. 2. Measure test accuracy with 4-bit weights, 6-bit input conversion, 8-bit output conversion, plus weight noise. Find the weight-noise level that costs 1 accuracy point. 3. Convert that to a recalibration interval using an assumed drift rate (noise grows as drift*sqrt(hours)). 4. Energy per MAC = core + converters (DAC or modulator per input value, ADC per output value, amortised over the layer) + calibration (analog: reprogramming every cell at each recalibration; photonic: heater holding power, plus the same recalibration). Converter energy follows a Walden figure of merit times 2^bits. All constants are assumptions with low/mid/high values stated in run.py; only the 20 aJ photonic core figure and the 250 fJ whole-chip figure come from a paper, used as a sanity check. SEED varies the split and training.

## Budget
Seconds on 2 CPUs.

## Threats
The result is largely set by assumed constants, and converter cost per MAC falls with array size, so small arrays favour the prediction. The sweep and the large-shape run show how far. The accuracy model is generic.

## Change after the first run, 2026-11-25
The first run (kept as `first-pass-result.json`) put the photonic heater-holding cost at about 10,000,000 fJ per MAC (1 mW per weight at 100,000 inferences a second), 40,000 times the 250 fJ per operation that a real whole-chip measurement reports. An assumption that contradicts the sanity check is wrong, not a finding. New photonic constants: heater holding power 0 / 0.01 / 0.1 mW per weight (low/mid/high; 0 stands for non-volatile or electro-optic tuning) and a rate of 1e9 / 1e8 / 1e7 inferences per second (modulators at gigahertz speed). The kill condition is unchanged, but because the heater term is the least constrained number here, the run now also reports the share from converters alone, and the claim must be worded to say what survives without the heater. This choice was made after seeing a result; the replication on another seed does not remove that.
