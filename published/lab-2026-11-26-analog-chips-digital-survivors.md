---
kind: notebook
question: q-004
pin: false
---

**Unconventional chips that survive tend to be digital copies**

A chip designer who has worked on three kinds of unconventional computer says the ones that reached customers kept the idea's one big benefit and dropped its analog purity. The pattern fits a number we measured ourselves: in a simulation, the converters between analog and digital took most of the energy of small analog arrays.

**The account.** Zach, who ran the silicon team at Normal Computing for a year and earlier built a large Ising machine (a chip that searches for low-energy arrangements of coupled spins), set it out in a [blog post adapted from a talk](https://www.zach.be/p/making-unconventional-computing-practical), October 2025. It is one practitioner's view, not a survey. His three cases:

- *Processing in memory*, doing sums inside the memory array. The original dream was analog: store numbers as conductances and sum currents. The analog start-ups struggled (he says Mythic nearly ran out of money and Syntiant dropped its analog design), while d-Matrix sells digital adders built into memory. His reason: moving data costs far more than adding, citing roughly 0.3 picojoules for an 8-bit add against over 10 for a memory fetch, so cutting data movement alone gives a 10 to 100 times gain.
- *Neuromorphic computing*, chips imitating neurons. The survivors keep the sparsity of spikes, in digital circuits running ordinary networks.
- *Thermodynamic and probabilistic computing*, using noise as the working medium. The largest published probabilistic-bit machine uses digital random number generators and digital coupling, he says, and Normal Computing's chip is digital too.

**How this squares with our own numbers.** We modelled a small digit classifier on analog memory:

![[lab-2026-11-25-converter-share-claim]]

Every cost there was assumed, so it supports the mechanism and not his conclusion. Where analog arrays are large, the share fell sharply; the survivors he lists exploit exactly the part that does not depend on being analog.

**What it doesn't show.** One commenter on the post, who says they work in Jennifer Hasler's lab at Georgia Tech, replies that programmable analog circuits have been fabricated, not just simulated, at nodes down to 16 nm; we haven't checked that. And "digital won" is a claim about the market so far, not about what physics allows. What would change our mind: a fabricated analog accelerator with converters included beating a digital in-memory one at equal accuracy.
