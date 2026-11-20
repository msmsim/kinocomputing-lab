# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "numpy",
# ]
# ///
"""eNNN: <one-line question>. See PLAN.md.

The contract (tools/replicate.mjs relies on it):
- Run with `uv run run.py`. Dependencies live in the header above, pinned
  when the result depends on a version.
- Everything random draws from SEED (default 1).
- The result goes to RESULT_PATH (default result.json) as JSON with at
  least: metric, value, seed, killed — `killed` decided by the kill
  condition in PLAN.md, in code, not by eye.
- Finishes in under 10 minutes on 2 CPUs. Data it downloads is cached
  under data/ (gitignored); data it can't re-download is committed, small.

After a real run, the lab re-runs it on SEED + 1 and checks `killed`
comes out the same.
"""

import json
import os

import numpy as np

SEED = int(os.environ.get("SEED", "1"))
RESULT_PATH = os.environ.get("RESULT_PATH", "result.json")
rng = np.random.default_rng(SEED)


def main():
    # The experiment. Replace this with the real thing.
    baseline = 0.0
    value = float(rng.normal(0.1, 0.01))
    killed = value <= baseline + 0.01  # the kill condition from PLAN.md

    result = {
        "metric": "skill_vs_baseline",
        "value": round(value, 6),
        "baseline": baseline,
        "seed": SEED,
        "killed": bool(killed),
    }
    with open(RESULT_PATH, "w") as f:
        json.dump(result, f, indent=2)
    print(json.dumps(result))


if __name__ == "__main__":
    main()
