# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "numpy",
# ]
# ///
"""e005: random vs ordered reads from a table, as the table outgrows the caches. See PLAN.md.

Contract: `uv run run.py`; randomness from SEED; result to RESULT_PATH with
metric, value, seed, killed (decided here, per PLAN.md).
"""

import json
import os
import platform
import subprocess
import time

import numpy as np

SEED = int(os.environ.get("SEED", "1"))
RESULT_PATH = os.environ.get("RESULT_PATH", "result.json")
N_IDX = 1 << 22
SIZES = {"32KiB": 32 << 10, "1MiB": 1 << 20, "32MiB": 32 << 20, "1GiB": 1 << 30}
KILL_BELOW = 3.0


def best_time(table, idx, reps=5):
    table[idx]  # warm-up
    best = float("inf")
    for _ in range(reps):
        t = time.perf_counter()
        table[idx]
        best = min(best, time.perf_counter() - t)
    return best / len(idx) * 1e9  # ns per element


def cpu_info():
    info = {"machine": platform.machine(), "cpus": os.cpu_count()}
    try:
        out = subprocess.run(["lscpu"], capture_output=True, text=True, timeout=5).stdout
        for line in out.splitlines():
            if line.split(":")[0].strip() in ("Model name", "L1d cache", "L2 cache", "L3 cache"):
                k, v = line.split(":", 1)
                info[k.strip()] = v.strip()
    except Exception:
        pass
    return info


def main():
    rng = np.random.default_rng(SEED)
    per_size = {}
    for name, nbytes in SIZES.items():
        n = nbytes // 8
        table = rng.random(n)
        idx = rng.integers(0, n, N_IDX)
        idx_sorted = np.sort(idx)
        rand_ns = best_time(table, idx)
        sort_ns = best_time(table, idx_sorted)
        per_size[name] = {"random_ns": round(rand_ns, 3), "sorted_ns": round(sort_ns, 3), "ratio": round(rand_ns / sort_ns, 3)}
        print(name, per_size[name], flush=True)
        del table
    ratio = per_size["1GiB"]["ratio"]
    result = {
        "metric": "random_over_sorted_ratio_1GiB",
        "value": ratio,
        "threshold": KILL_BELOW,
        "ratio_32KiB": per_size["32KiB"]["ratio"],
        "per_size": per_size,
        "hardware": cpu_info(),
        "seed": SEED,
        "killed": bool(ratio < KILL_BELOW),
    }
    with open(RESULT_PATH, "w") as f:
        json.dump(result, f, indent=2)
    print(json.dumps({k: result[k] for k in ("metric", "value", "ratio_32KiB", "seed", "killed")}))


if __name__ == "__main__":
    main()
