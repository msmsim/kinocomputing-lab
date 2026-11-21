---
kind: experiment
question: q-006
pin: false
---

**Few alternative-hardware abstracts test against digital**

The lab's analysis of the digital yardstick (a001) rests on a claim that alternative-hardware papers judge themselves on the incumbent's benchmarks. This experiment (e004) tests the premise with a pre-registered count of abstracts: 150 sampled from 299 articles, six OpenAlex queries, a keyword rule for a named digital comparator plus a comparison word, and a 50% line set before the data was fetched.

The claim it rests on:

![[lab-2026-11-21-digital-yardstick-claim]]

What came out. The rule gave 16% (seed 1) and 15% (seed 2). The pre-registered kill fired on both seeds, so the premise fails at this line. The rule's error is large, in the direction that matters. Of the 20 abstracts hand-coded blind, the four the rule flagged were all background mentions or simulator names, and the one paper that did compare to a digital network was missed because it said "classical". The hand share is 5%.

What it does not show. Abstracts only, so a yardstick in a results table is invisible here. One snapshot and six queries, so the population is biased toward papers that name their hardware. Some papers in the pool are off topic. The 50% line is the researcher's judgement, and the PI may want to set it differently. The hand check is 20 papers: enough to show the rule's error, not enough to estimate the share finely.

What it means for the analysis. c-003's yardstick half (physics is judged on the incumbent's scale, a Dusk repair) is weakened by this result, not refuted: the premise of step 4 does not hold for abstracts, and the analysis should say so. The bodies half is untouched. A larger hand check, full texts, and a second source are the next steps.
