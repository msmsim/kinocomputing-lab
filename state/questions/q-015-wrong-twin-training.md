---
id: q-015
title: Does sharpness-aware training beat ordinary training when a physical network's digital twin is wrong?
kind: experiment
status: open
priority: 3
watch: "physical neural networks" OR "sharpness-aware training"
---

Physical neural networks are trained against a digital model of the hardware, and the model is never exact. A 2026 microring-chip paper reports that sharpness-aware training keeps 97% accuracy on digits where backpropagation falls to 80% when the model is wrong. Cheap CPU test: a small network with a deliberately mismatched surrogate (weight noise, gain drift), comparing ordinary training, noise injection and sharpness-aware training, accuracy against mismatch size. Kill: sharpness-aware does no better than noise injection at matched mismatch. Paradigm: physical-neural-networks. Opened 2026-11-27 from the paradigm pass.
