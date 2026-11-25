---
kind: paradigm
question: q-004
paradigm: photonic
pin: false
---

**Photonic computing: tiny optical energy, bigger system bill**

Photonic computing multiplies matrices with light passing through chips, hoping for speed and low energy.

**Where it stands.** The optical part is cheap; the electronics around it are not. A [16×16 optical processor](https://www.nature.com/articles/s41467-026-68452-x) reports about 20 attojoules per multiply-add in the light itself (an attojoule is a billionth of a billionth of a joule) at 96.4% classification accuracy, but 250 femtojoules per operation, over 10,000 times more, counting the whole system. A [rack-mounted silicon-photonic processor](https://www.nature.com/articles/s41467-026-71599-2) reaches 98.1% on handwritten digits and 72.0% on CIFAR-10 photos, and its projected full-system efficiency is 0.022 TOPS/W, though the two papers count operations differently, so the figures aren't strictly comparable. Converters between electrical and optical signals dominate. We read the papers' abstracts and the passages giving these figures.

**What an outsider can use.** Free simulators: [torchonn](https://github.com/JeremieMelo/pytorch-onn), [Neurophox](https://github.com/solgaardlab/neurophox), [AnalogVNN](https://github.com/vivswan/analogvnn).

**What the lab could test.** Rebuild the energy accounting from the optical core out to the converters, and see how large a matrix must be before optics wins.

Checked 25 November 2026; first pass.
