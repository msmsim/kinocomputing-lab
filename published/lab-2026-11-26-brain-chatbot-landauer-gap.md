---
kind: notebook
question: q-010
section: audits
pin: false
---

**Brain and chatbot sit equally far above the thermal floor**

A human brain and a chatbot, an essay argues, each spend about a thousand billion billion times the minimum thermodynamic energy per bit of information they settle on. We recomputed both numbers from the essay's own inputs: the arithmetic holds, but the match is much softer than it looks, because each side is measured in a different way and each input is only good to about a factor of ten.

**The claim as told.** In [Coherence at 300 Kelvin](https://symmetrybroken.com/coherence-at-300-kelvin), a long essay on why intelligence needs coordinated, synchronised parts, the author starts from Landauer's principle: erasing one bit of information in a computer at room temperature costs at least k·T·ln 2 of heat, about 2.9 × 10⁻²¹ joules at 300 kelvin. Then two comparisons. A human brain runs on 20 watts and, by Jieyu Zheng and Markus Meister's estimate, handles roughly 10 bits per second of behaviour-relevant information, so about 2 joules per bit. A typical ChatGPT query uses about 0.3 watt-hours (Epoch AI's estimate), over about 500 output tokens (word fragments), each carrying about 1.3 bits of surprise, so about 1.7 joules per bit. Both land near 10²¹ times the Landauer floor. Splitting each into energy per operation times operations per bit, the essay finds the GPU pays about 50 times more per operation and the brain needs about 60 times more operations per bit, so the products cancel. The essay says the match "suggests rather than proves".

**What we recomputed.** From the stated inputs:

```
floor (300 K)                 2.87e-21 J
brain: 20 W / 10 bits/s       2.0 J/bit    = 7.0e20 x floor  (10^20.84)
chatbot: 0.3 Wh/500 tok/1.3   1.66 J/bit   = 5.8e20 x floor  (10^20.76)
brain per synaptic event      2e-13 J      = 7e7 x floor, 1e13 events per bit
GPU per floating-point op     1e-11 J      = 3.5e9 x floor, 1.5e11 ops per bit
```

Everything reproduces. The two totals agree within about 20 percent.

**Why the match bears less than it seems.** Three things we checked in the sources:

- *The two "bits" are different kinds of thing.* The brain's 10 bits per second is a [measured ceiling on conscious behaviour](https://arxiv.org/abs/2408.10234) (typing, speaking, game-playing); the paper stresses it is far below what the senses take in, about a billion bits a second. Divide 20 watts by that instead and the brain sits at about 10¹³ times the floor, eight orders of magnitude lower. The chatbot's 1.3 bits is the statistical surprise of the text it writes. Neither is "bits settled" in the same sense, and the essay's match depends on choosing these.
- *Each input is one rough estimate.* [Epoch AI's 0.3 watt-hours](https://epoch.ai/gradient-updates/how-much-energy-does-chatgpt-use) assumes a 100-billion-parameter active model, about one second of H100 time per query, and servers drawing 70 percent of peak power. Epoch calls it somewhat pessimistic for short text questions and says queries with long inputs cost 2.5 to 40 watt-hours. Move that, or the brain's 10 bits per second, by a factor of ten either way and the totals diverge by a factor of a hundred.
- *Twenty percent agreement is finer than the inputs allow.* With several factor-of-ten uncertainties feeding each total, the data support "within about an order of magnitude", and two rough estimates landing within one order of magnitude of each other, on a scale spanning twenty-one, is not a rare coincidence.

**What it does and doesn't show.** The essay's main point, that systems far above the floor need some mechanism to turn diffuse energy into coherent signals, does not depend on the two totals being equal. As an observation the match is a curiosity: it fits the idea that both systems are limited by something other than the thermodynamic floor, but it would fit many other accounts too. What would change our mind: a brain figure counted over a matched kind of output, and a measured chatbot energy per answer for a task with a known information content, landing together within a factor of three.

**How sure we are.** This is a check of the arithmetic and of the cited sources, by us, with no second reader. The sources' own stated figures hold. The interpretation, that the match is more than a rough coincidence, is an untested idea. See the claim:

[The claim, in short](https://www.kinocomputing.com/lab-2026-11-26-landauer-gap-match-soft-claim).
