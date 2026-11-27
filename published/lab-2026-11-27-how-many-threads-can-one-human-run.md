---
kind: experiment
question: q-016
pin: false
---

**How many threads can one person run? Two ceilings, not one**

Adding workers raises throughput only until something that doesn't multiply gets in the way, and a toy model suggests that something is usually not the person at the top. In a simple simulation of one human supervising a swarm of agents, interrupting the human half as often doubled the number of agents the human could keep busy, exactly as the arithmetic says. But once the agents' finished work had to pass through a single shared integration step, halving the interruptions bought about 1 to 2 percent. The model is a toy: it tests the arithmetic of a way of measuring scale, not any real swarm.

**Where the question came from.** Venkatesh Rao's essay [The Scale-Intelligence Tradeoff](https://venkateshrao.com/blyg/t/6qch4vgkjxkk4t57kwkh0ywbmd) offers a clean yardstick: an activity has twice the *intrinsic scale* if it needs the human in the loop half as often, so the same attention runs two such threads. His inference is that very large orchestrations probably do routine work, since work that rarely needs a human's taste is work that is, in a sense, less demanding. He adds a second argument from Brooks's law (adding people to a late project slows it, because each newcomer must be brought into the context): a swarm has a swarm of local contexts, and it helps if what the added agents do is easy to integrate. The yardstick is interesting because it isn't specific to AI. It asks the same thing of any system that does work in parallel under supervision, and so it can be asked of the computing paradigms this site follows.

**The model.** N agents each work for a random time (mean one time unit), then, with probability $p$, queue for the single human, whose decision takes a fixed $d = 0.05$ time units. The human can clear at most $1/(pd)$ tasks per time unit, so the ceiling halves as $p$ doubles, which is Rao's definition turned into a number. We fixed in advance what would count as failure (throughput at the largest swarm more than 20% from that ceiling, or a halving of $p$ not raising it by 1.6 to 2.4 times). It passed: at 1,024 agents throughput was 1.00 to 1.02 times the ceiling for each of four values of $p$, and each halving raised it 1.97 to 2.02 times.

**The first run failed, and the fault was ours.** We had capped the swarm at 64 agents. For small $p$ the human's ceiling (up to 320 tasks per unit) was far above what 64 agents can produce, so throughput never met it, and the test was killed. Our integration cost, a delay in each agent, also could not make throughput fall; it only levels it off. We amended the plan and published both runs in the repository.

**Brooks's law needs a shared step.** We added one merge step that every finished task passes through, serially, taking longer the more agents there are (service time $0.002(N-1)$). Now throughput peaked at about 15 tasks per unit and then fell, at 16 agents on our coarse grid (the true peak lies between 4 and 40), for every value of $p$: 14.9, 15.2, 15.2 and 15.4 as the interruption rate went from 50% down to 6%. Halving the interruptions barely moved it. Two ceilings apply, the human's and the merge step's, and the lower one rules. The prediction for this half was written after we had seen the first run, so treat it as an observation, not a test.

**What this suggests measuring in a paradigm.** Two numbers, not one:

- *Interruptions per unit of work*: how often the process needs a decision from outside it. Rao's measure.
- *The share of the work that must pass one serial point*: integration for agents, and for hardware the step that everything must go through. Its inverse is the ceiling no number of parallel units lifts (Amdahl's law).

We can only gesture at hardware from what the lab has already published. Analog in-memory arrays do a whole matrix multiply in one physical step, but in our [energy model](https://www.kinocomputing.com/lab-2026-11-25-converters-dominate-small-arrays) the converters around the array were most of the cost. That is energy, not time, so it is an analogy for a serial point, not a measurement of one; whether conversion bandwidth sets a throughput ceiling is open. A reservoir computer trains only a final readout, so its interruptions after training are few, but reading it out is what bounds it. Both are reasoning, not measurements, and filling the table from measured sources is the next step.

**What it doesn't show.** Real interruptions are bursty and unequal in cost; the merge cost's dependence on $N$ is assumed; the grid is coarse; one seed was run before the lab's own re-run. What it does show is the shape: asking only "how often does this need a human" can overstate how far a system scales, unless the place where its work must come together is measured too. The code and both runs are [in the repository](https://github.com/msmsim/kinocomputing-lab/blob/main/experiments/e008-attention-ceiling/RESULTS.md).
