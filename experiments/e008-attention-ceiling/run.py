# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "numpy",
# ]
# ///
"""e008: does halving the interruption rate double the threads one human can run? See PLAN.md.

SEED in, result.json out, `killed` decided in code.
"""
import heapq
import json
import os

import numpy as np

SEED = int(os.environ.get("SEED", "1"))
RESULT_PATH = os.environ.get("RESULT_PATH", "result.json")
W, D, T, WARM = 1.0, 0.05, 1000.0, 100.0
PS = [0.5, 0.25, 0.125, 0.0625]
NS = [1, 4, 16, 40, 80, 160, 320, 640, 1024]


def sim(n, p, c, rng):
    """Event simulation. Returns tasks per unit time after warm-up."""
    human_free = 0.0
    merge_free = 0.0
    ev = []  # (time, agent): agent finishes working
    for a in range(n):
        heapq.heappush(ev, (rng.exponential(W), a))
    done = 0
    while ev:
        t, a = heapq.heappop(ev)
        if t > T:
            break
        if rng.random() < p:
            start = max(t, human_free)
            human_free = start + D
            t = human_free
        if c > 0:  # shared merge step, serial across all agents
            start = max(t, merge_free)
            merge_free = start + c * W * (n - 1)
            t = merge_free
        if t > WARM:
            done += 1
        heapq.heappush(ev, (t + rng.exponential(W), a))
    return done / (T - WARM)


def main():
    rng = np.random.default_rng(SEED)
    out = {}
    for label, c in (("no_integration", 0.0), ("brooks", 0.002)):
        out[label] = {}
        for p in PS:
            out[label][str(p)] = {str(n): round(sim(n, p, c, rng), 3) for n in NS}
    plateau = {p: out["no_integration"][str(p)]["1024"] for p in PS}
    ceil = {p: 1 / (p * D) for p in PS}
    plateau_ok = all(abs(plateau[p] / ceil[p] - 1) <= 0.2 for p in PS)
    ratios = [plateau[PS[i + 1]] / plateau[PS[i]] for i in range(3)]
    ratio_ok = all(1.6 <= r <= 2.4 for r in ratios)
    peaks = {}
    for p in PS:
        row = out["brooks"][str(p)]
        n_best = max(row, key=lambda k: row[k])
        peaks[p] = (int(n_best), row[n_best])
    p2_ok = all(v[0] < 1024 for v in peaks.values()) and all(
        peaks[PS[i + 1]][1] / peaks[PS[i]][1] < 2 for i in range(3)
    )
    killed = not (plateau_ok and ratio_ok)
    res = {
        "metric": "plateau throughput ratio per halving of interruption rate (no integration cost)",
        "value": [round(r, 3) for r in ratios],
        "seed": SEED,
        "killed": bool(killed),
        "plateau_vs_ceiling": {str(p): round(plateau[p] / ceil[p], 3) for p in PS},
        "brooks_peak_n_and_throughput": {str(p): peaks[p] for p in PS},
        "prediction2_held": bool(p2_ok),
        "curves": out,
    }
    json.dump(res, open(RESULT_PATH, "w"), indent=1)
    print(json.dumps({k: v for k, v in res.items() if k != "curves"}, indent=1))


main()
