---
kind: experiment
question: q-006
pin: false
---

**Do new computers judge themselves by the old ones?**

A common story about alternative computing hardware, which we had leaned on ourselves in [placing these technologies in World Machines theory](https://www.kinocomputing.com/where-todays-computing-sits-in-the-world-machines), goes like this. Analog, photonic, thermodynamic and neuromorphic chips sell themselves as doing what digital computers do, only cheaper, and so they are judged by the incumbent's yardstick. If that were true, you would expect their papers to lead with head-to-head comparisons against digital hardware. So we counted.

**The method.** We pulled 299 articles from 2024 on, from six searches of the OpenAlex research index (analog, photonic, thermodynamic, neuromorphic, reservoir and memristor hardware), and sampled 150 abstracts. A keyword rule flagged any abstract naming a digital comparator, such as a GPU or a CPU, alongside a comparison word. Before fetching anything we set the line: if half or more of the abstracts compare against digital, the story holds. Then, to check the rule itself, we coded 20 abstracts by hand without looking at what the rule had said.

![[lab-2026-11-21-digital-yardstick-claim]]

**What happened.** The rule flagged 16% of abstracts (15% on a second random sample), far below the line. And the hand check showed the rule was worse than useless in the direction that mattered. All four abstracts it flagged among the 20 merely mentioned GPUs in passing, or named a simulator. The one abstract that genuinely compared itself with a digital network slipped past, because it said "classical" rather than naming the hardware. The hand-checked share is 5%.

**What it doesn't show.** Abstracts aren't papers: a digital comparison tucked into a results table is invisible here. Six searches favour papers that name their hardware, and a few in the pool were off topic. Twenty hand-coded abstracts are enough to expose the rule's errors, not to pin the true share down finely. And the 50% line is a judgement call.

**What it changes.** It weakens one half of [our reading](https://www.kinocomputing.com/physics-computing-as-repair-body-computing-as-new-ground) that physics-based computing is a repair job on the digital machine, judged by its rules: at least in their abstracts, these papers mostly don't frame themselves that way. The other half of that reading, about computing with living and embodied systems, is untouched. A larger hand check, full texts and a second index are the next steps.

[Code, data and full results](https://github.com/msmsim/kinocomputing-lab/blob/main/experiments/e004-yardstick-literature-count/RESULTS.md).
