---
kind: paradigm
question: q-004
paradigm: neuromorphic
pin: false
---

**Neuromorphic computing: real wins, but only on sparse work**

Neuromorphic chips imitate neurons: they pass sparse, event-driven spikes and keep memory next to computation, which can save energy when most of the input is silence.

**Where it stands.** The measured wins are narrow: always-on sensing, audio and event cameras. A [Nature review](https://doi.org/10.1038/s41586-024-08253-8) (2025) says the field is ready to scale, and [NeuroBench](https://doi.org/10.1038/s41467-025-56739-4), a community benchmark framework, was built because comparisons with conventional hardware were not standardised. Vendor figures lean on favourable settings: Intel's Hala Point (1,152 Loihi 2 chips) is reported above 15 trillion operations per watt only on a deliberately sparse network.

**Outside the US.** SpiNNaker (Manchester, Dresden), Innatera (Netherlands) and SynSense (Zurich) build chips; the Netherlands also produced a [complexity theory for spiking networks](https://doi.org/10.1088/2634-4386/ae2cc1).

**What an outsider can use.** Free software: [NeuroBench](https://github.com/NeuroBench/neurobench), [Lava](https://github.com/lava-nc/lava) and the [NIR](https://neuroir.org/) interchange format. Hardware is by application or quote.

**What the lab could test.** Whether a spiking network's energy edge survives once preprocessing and idle power are counted.

Checked 28 November 2026; first pass. Chip claims are from vendors and reviews, not our measurements.
