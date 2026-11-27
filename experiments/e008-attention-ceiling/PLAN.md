# e008: does halving the interruption rate double the number of threads one human can run?

Question: q-016 (opened tonight, from the PI's share on scale versus intelligence).

## Hypothesis
Rao's definition: an activity has 2x intrinsic scale if it interrupts the human half as often. In a queue model (N agents, one human, each task needs a human decision with probability p), throughput saturates at the human's decision rate, 1/(p*d), so the saturation ceiling scales as 1/p.
Adding a context-integration cost (Brooks's law: each finished task costs c*(N-1) extra agent time) turns the plateau into a peak and a decline.

## Prediction (fixed before running)
1. Plateau throughput at N=64 without integration cost is within 20% of 1/(p*d) for every p in {0.5, 0.25, 0.125, 0.0625}; halving p roughly doubles it (ratio 1.6 to 2.4).
2. With integration cost c=0.02*w, the peak N is finite (below 64) for every p, and the peak throughput gain from halving p is under 2x (coordination eats part of it).

## Kill condition
Prediction 1 fails (ratio outside 1.6-2.4 for any halving, or plateau off by >20%). Decided in code.

## Model
Agent: work time ~ Exp(w=1) per task; with prob p queue for the human (FIFO, service d=0.05, deterministic); else task done. Integration: after each task, agent pays c*(N-1) extra time. 4000 time units, 200 warm-up. Throughput = tasks completed / time.

## Limits
A toy. Real agents' interruptions are not independent coin flips and decisions differ in cost. It tests the arithmetic of the measure, not any real swarm.

## Dated change, 2026-11-27, after the first run (first-pass-result.json)
The first run was killed, and the cause was my design, not the idea: with N capped at 64 and one task a time unit per agent, the agents' own speed (about 64 tasks) was below the human ceiling 1/(p*d) for p <= 0.25 (ceilings 80 to 320), so throughput never reached the ceiling and the plateau test measured the wrong thing. Also the integration cost as first written (a delay in each agent) cannot make throughput fall: N/(1+c(N-1)) only levels off. Brooks's law needs integration to be a shared, serial step.
Changes: N goes up to 1024 (T cut to 1000 time units to stay in the timebox); the integration cost becomes a single merge queue with service time c*W*(N-1)/N0, with c = 0.002 and N0=1 (so service time c*(N-1)), shared by all agents, every finished task passing through it.
Prediction 1 is unchanged (plateau within 20% of 1/(p*d), ratio per halving 1.6 to 2.4), now read at N=1024 where every p is past its knee (knees at about 40, 80, 160, 320 agents). Prediction 2 (post hoc: written after seeing the first run): with the merge queue, throughput peaks at a finite N below 1024 and falls after; halving p raises the peak throughput by less than 2x. The first run stays on file; its kill stands as a record of the original design.
