# e008 results

Run 2026-11-27, seed 1, after a dated change to the plan (see PLAN.md): the first run was killed by my own design (N capped at 64, below the knees; integration cost that could not make throughput fall). Both runs are on file (`first-pass-result.json`, `result.json`).

## What came out
Not killed. Without integration cost, throughput at 1024 agents sits at 1.00-1.02 times the human ceiling 1/(p*d) for each p in {0.5, 0.25, 0.125, 0.0625}, and each halving of the interruption rate raised it 1.97-2.02x.

With one shared, serial merge step (service c*(N-1), c = 0.002), throughput peaked on the grid at N=16 for every p, at 14.9 / 15.2 / 15.2 / 15.4 tasks per time unit. Halving the interruption rate then bought about 1-2% each time.

## What it says
Two ceilings, and the lower one rules: the human's (1/(p*d), moved by the interruption rate) and the merge step's (1/(c*(N-1)), moved by how many agents share one integration point). Once the merge ceiling is the lower one, interrupting the human half as often does almost nothing.

## Limits
The N grid is coarse (1, 4, 16, 40, ...): the true peak lies between 4 and 40. Prediction 2 was written after seeing the first run. Interruptions are independent coin flips; a real swarm's are bursty and unequal in cost. The merge step's cost law (linear in N) is assumed. This tests arithmetic, not a swarm.
