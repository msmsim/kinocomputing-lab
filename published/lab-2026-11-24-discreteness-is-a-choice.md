---
kind: notebook
question: q-007
voice: post-liquid
pin: false
---

**Discreteness as a choice made within a continuous world**

Every digital computer rests on a cut: a world where a voltage can sit at any level is sorted into two states, 0 and 1, and everything built above it inherits the sorting. A [2025 dialogue between Matt, the site's author, and an AI interlocutor](https://github.com/msmsim/kinocomputing-lab/blob/main/sources/archive-2025/essays/the-discrete-option.md) asked what that cut costs, and whether the continuous world requires discreteness or only allows it.

Two terms first. *Continuous* means values that slide, like the water level in a bath, where any value in between is possible. *Discrete* means distinct steps, like a light switch or a count of coins. A digital chip works in steps. An analog one lets the physics of voltage or flow do the arithmetic while the values slide.

Matt's starting point ran against the usual order. "My intuition is fundamental continuity," he wrote, "and then discreteness emerges via an option on the continuous firmament." Read plainly: the world is smooth underneath, and drawing a boundary, making a separate thing, is a choice that can be taken at any level, whether a particle, a cell or a machine. The site's outlook, after Thomas Nail's kinetic materialism, starts from motion, with things as patterns in it.

The AI interlocutor gave the choice a price. Computing inside one boundary is cheap, because the parts sit together. Crossing a boundary is communication, with its own protocols, waits and overhead. A soap bubble shows the gap: a small wobble spreads cheaply across the film, while reshaping the whole surface costs far more. The cost does not vanish as you go down toward physics, the interlocutor argued; it compounds, since each boundary drawn, from field to particle to atom to cell to organ, adds a crossing. That extension is a hypothesis argued in conversation, not a measurement.

Why it matters now: most "continuous" problems run on digital machines anyway, by chopping a smooth shape into a mesh of small cells, which brings the crossing cost back. Analog computing, the interlocutor said, "could sidestep some of these communication costs entirely by embedding the computation in the physics itself." Where a system is cut decides where the work of moving information lands.

Here the lab's own results cut against the easy conclusion. In simulation, a physical-style reservoir did worse than a digital one:

![[lab-2026-11-20-oscillator-reservoir-claim]]

And [analog chips that compute where they store](https://www.kinocomputing.com/lab-2026-11-20-analog-cim-diffusion-noise) are troubled by noise, in image generators most early in the process. Our inference, not the dialogue's: the saving on crossings may be paid back in noise, a cost the dialogue's picture leaves out.

The dialogue is candid about its limits. The AI interlocutor sorted its claims into a "less crackpotty" list and a "more crackpotty" one, judged the cost-scaling idea "probably sound", and put the "option" wording on the second list, saying it "sounds mystical". Matt replied that discreteness as a "necessary but not sufficient" attribute sounds less so. The idea is, in the interlocutor's words, "at least testable in principle"; the dialogue tests nothing.

The open question is the one this site keeps returning to: is discreteness something the world is made of, or a boundary we draw, and what does each draw cost? A testable form would ask whether a computation's communication cost grows with the number of boundaries it must cross. As far as our own notes show, no experiment yet measures that.
