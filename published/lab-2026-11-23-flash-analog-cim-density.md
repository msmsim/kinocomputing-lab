---
kind: notebook
question: q-004
pin: false
---

**A flash-memory prototype packs 4.8M weights per mm²**

*Analog in-memory computing* does arithmetic inside the memory itself, using physical quantities such as electrical current, instead of shuttling stored numbers to a separate processor. Neural networks spend most of their effort multiplying and adding big tables of numbers called weights, so doing that where the weights sit saves movement. Our [earlier note on the idea](https://www.kinocomputing.com/lab-2026-11-20-analog-cim-diffusion-noise) looked at how noise in such chips affects image generation.

A new preprint, [3D-NAND-CIM](https://arxiv.org/abs/2611.27479), builds this from flash memory. Flash is the storage in phones and memory sticks: each bit is a charge held in a tiny transistor, and "3D NAND" stacks many layers of those cells so a small footprint holds a lot. Here each weight is stored as one of 16 levels, and a signed weight uses two of four flash devices. The multiplication happens as currents flow through them. The flash is bonded to a 14-nanometre logic chip carrying the converters and control circuits.

**What was measured.** The authors built a prototype and tested it on a real network: WideResNet-16-8, an image classifier, with all 11 million weights stored on the chip. Only the multiply steps ran in flash; the rest ran in software. It scored 95.96% on CIFAR-10 (a standard set of small photos in ten classes) against 96.39% for the same network in software, and 76.57% on the harder 100-class version against 79.8%: drops of about 0.4 and 3.2 percentage points. Efficiency was 4.2 trillion operations per second per watt, at an accuracy the paper equates to about 3-bit weights and 8-bit inputs, with power measured by looping a handful of multiply operations.

**What was estimated.** The headline density, 4.8 million weights per square millimetre, rests on an estimated area, not a measured one: the authors add up the converters, input drivers, SRAM and control circuits, about 5 mm², and the test vehicle is larger. The paper says its density beats earlier designs "by orders of magnitude" but its efficiency and speed per area are similar to earlier non-volatile-memory designs. We could not read the comparison table, so we give no multiple.

**What it doesn't show.** Endurance (how many rewrites flash survives), how long stored weights hold their values, and any task beyond two image sets. The efficiency figure covers the measured multiply operations, not a whole system. We read the abstract and an automated summary of the full text, not every table, and the paper is a preprint without peer review.

The density is a design figure until someone measures the area. What would change our view: retention and endurance data, or a larger network run end to end.
