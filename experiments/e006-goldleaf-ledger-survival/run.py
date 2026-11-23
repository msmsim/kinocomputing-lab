# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "numpy",
# ]
# ///
"""e006: three-copy majority-vote ledger vs common-mode mutations. See PLAN.md.

Contract: `uv run run.py`; randomness from SEED; result to RESULT_PATH with
metric, value, seed, killed (decided here, per PLAN.md).
"""

import json
import os

import numpy as np

SEED = int(os.environ.get("SEED", "1"))
RESULT_PATH = os.environ.get("RESULT_PATH", "result.json")
N, B, G = 2000, 1000, 10
MUS = [10 ** (e / 4) for e in range(-24, -11)]  # 1e-6 .. 1e-3 (13 values)
SHARES = [0.0, 0.1, 0.5]
PASS = 0.95
KILL_BELOW = 10.0


def survival(rng, mu, s):
    ind = rng.binomial(G, mu * (1 - s), size=(N, B, 3)) >= 1
    com = rng.binomial(G, mu * s, size=(N, B)) >= 1
    # common value: base 1..3 if common event else 0 (original)
    vc = np.where(com, rng.integers(1, 4, size=(N, B)), 0)
    # independent mutation: a uniformly chosen base different from the current one
    shift = rng.integers(1, 4, size=(N, B, 3))
    vals = np.where(ind, (vc[..., None] + shift) % 4, vc[..., None])
    a, b, c = vals[..., 0], vals[..., 1], vals[..., 2]
    maj = np.where(a == b, a, np.where(a == c, a, np.where(b == c, b, -1)))
    ok = (maj == 0).all(axis=1)
    return float(ok.mean())


def mu_star(curve):
    best = None
    for mu, sv in curve:
        if sv >= PASS:
            best = mu
        else:
            break
    return best


def main():
    rng = np.random.default_rng(SEED)
    curves = {}
    for s in SHARES:
        curves[s] = [(mu, survival(rng, mu, s)) for mu in MUS]
        print(s, [(f"{m:.1e}", round(v, 3)) for m, v in curves[s]], flush=True)
    stars = {s: mu_star(curves[s]) for s in SHARES}
    ok = stars[0.0] is not None and stars[0.5] is not None
    ratio = stars[0.0] / stars[0.5] if ok else None
    killed = (ratio is None) or ratio < KILL_BELOW
    result = {
        "metric": "mu_star_ratio_s0_over_s0.5",
        "value": None if ratio is None else round(ratio, 3),
        "mu_star": {str(s): stars[s] for s in SHARES},
        "curves": {str(s): [[m, v] for m, v in curves[s]] for s in SHARES},
        "setup": {"N": N, "bases": B, "generations": G, "pass": PASS},
        "seed": SEED,
        "killed": bool(killed),
    }
    with open(RESULT_PATH, "w") as f:
        json.dump(result, f, indent=2)
    print(json.dumps({k: result[k] for k in ("metric", "value", "mu_star", "seed", "killed")}))


if __name__ == "__main__":
    main()
