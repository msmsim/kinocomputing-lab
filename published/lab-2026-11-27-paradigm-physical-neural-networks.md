---
kind: paradigm
question: q-004
paradigm: physical-neural-networks
pin: false
---

**Physical neural networks: training is the live problem**

Physical neural networks run a network's layers in physics (light in a chip, resistor arrays, mechanical lattices), so the hard part is training them when their internal state can't be read or differentiated.

**Where it stands.** A 2025 [Nature review](https://doi.org/10.1038/s41586-025-09384-2) frames the training methods. On a [microring-resonator chip](https://doi.org/10.1038/s41467-026-68470-9), sharpness-aware training reached 97% on handwritten digits against 80% for backpropagation when the chip's digital model was wrong; a 2 °C swing dropped backpropagation to 17%. A [Tokyo and NTT optoelectronic system](https://doi.org/10.1038/s43588-026-01075-w) cut computation about 40%, by the authors' figure. Both report accuracy and robustness, not a full energy audit of lasers, converters and control. Elsewhere: an Israeli [bistable mechanical network](https://doi.org/10.1002/aisy.202400694).

**What an outsider can use.** [PyTorch-ONN](https://github.com/JeremieMelo/pytorch-onn), [Neurophox](https://github.com/solgaardlab/neurophox/) and [AnalogVNN](https://github.com/Vivswan/AnalogVNN) simulate optical and analog nets with noise.

**What the lab could test.** Train a small network against a deliberately wrong digital twin; compare ordinary training, noise injection and sharpness-aware training.

Checked 27 November 2026; first pass.
