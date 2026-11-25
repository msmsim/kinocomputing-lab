---
kind: experiment
question: q-013
voice: concrete
pin: false
---

**Analog chips: the converters cost more than the arithmetic**

The arithmetic is the cheap part. In a model we built of a small digit classifier running on analog memory, the multiply costs about 5 femtojoules and the converters around it cost about 143 femtojoules. A femtojoule is a millionth of a billionth of a joule. That is roughly 30 times the cost of the arithmetic, and it goes away only when the array gets large. Every cost in the model is an assumption, so this is a statement about structure, not about any chip.

The question came from a [paradigm note](https://www.kinocomputing.com/coupling-reality-to-paradigms) predicting that, for hardware whose physics does the computing, the cost sits in conversion and calibration, not the operation. We had only papers to go on, each counting an operation differently. So we fixed one definition (a multiply-accumulate, or MAC: one weight times one input, added to a running sum) and one small network (64-32-10, trained on 1,797 handwritten digits from scikit-learn, 95.4% accurate after 4-bit weights and 6/8-bit converters). Then we priced it two ways, for analog memory and for a photonic processor, in three terms: the physical core, the converters, and calibration. We said in advance that the prediction fails if, at middle settings of every constant, converters plus calibration are under half the total in either substrate.

It didn't fail. The converters take:

- **Analog memory:** 97% at middle settings, 64% when every constant is set against us.
- **Photonic:** 62% of the total at middle settings, but that total includes a heater cost that we revised, see below.

Converter cost per MAC falls as arrays grow, because one conversion is shared by more MACs. For a 784-128-10 network, the analog converters' share drops to 79% at middle settings and 19% in the least favourable corner (expensive core, cheap converters). So the prediction holds for small arrays and is a question about size for large ones.

Quote of the claim, with its caveats:

![[lab-2026-11-25-converter-share-claim]]

**Two things went wrong on the way.**

- Our first photonic model held each of the processor's phase shifters at temperature continuously, costing about 10 million femtojoules per MAC, 40,000 times what a real chip measures (250 femtojoules per operation, whole system, from the [paper we've covered](https://www.nature.com/articles/s41467-026-68452-x)). That is a broken assumption, not a finding. We replaced it with a lower figure that gives 263 femtojoules per MAC, which is close to the real chip. We chose it to be, and say so: the photonic result depends on a number we tuned. Moving the heater from 0 to 0.1 milliwatts per weight moves the converters' share from 99.99% to 14%, small network.
- An adversarial review caught that we had labelled the photonic shares "without the heater" when the heater was in the total. The text here is corrected.

**What it doesn't show.** Calibration, half of the prediction, is untested for analog memory: the model's recalibration cost came out near zero, because drift rates and write energies are assumptions too. We also used a numpy noise model, not the IBM analog-hardware toolkit we had planned (it has no build for our environment). And a generic accuracy model is not a measured chip.

**What would settle it.** Converter and calibration energies measured separately on a real analog or photonic chip, under one operation definition. Even a table of converter bits and energies from a published macro, set against its reported total, would replace our assumed constants. Code, plan and results: [the experiment folder](https://github.com/msmsim/kinocomputing-lab/blob/main/experiments/e007-conversion-calibration-energy-split).
