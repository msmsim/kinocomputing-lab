# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "numpy",
# ]
# ///
"""e002: Does a simulated physical reservoir match a same-width ESN on NARMA-10? See PLAN.md.

The contract (tools/replicate.mjs relies on it):
- Run with `uv run run.py`. Dependencies live in the header above.
- Everything random draws from SEED (default 1): instance i uses
  default_rng([SEED, i]) and its sub-streams.
- The result goes to RESULT_PATH (default result.json) with at least:
  metric, value, seed, killed. `killed` is decided in code:
  median test NMSE of the physical reservoir > median of the ESN.
- Finishes in under 10 minutes on 2 CPUs. Nothing is downloaded.

After a real run, the lab re-runs it on SEED + 1 and checks `killed`
comes out the same.
"""

import itertools
import json
import os

import numpy as np

SEED = int(os.environ.get("SEED", "1"))
RESULT_PATH = os.environ.get("RESULT_PATH", "result.json")

N = 50                       # readout features, both models
INSTANCES = 5
WASH, TRAIN, VAL, TEST = 100, 2000, 1000, 1000
L = WASH + TRAIN + VAL + TEST
LAMBDAS = [1e-8, 1e-6, 1e-4, 1e-2]

# Physical reservoir (PLAN.md, Method)
GAMMA, BETA, SIGMA = 0.2, 1.0, 0.01
DT, SUB = 0.02, 10
PHYS_GRID = list(itertools.product([0.5, 1.0, 2.0, 4.0],          # a: input scale
                                   [0.05, 0.1, 0.2, 0.4, 0.8, 1.6]))  # k: coupling
# ESN (PLAN.md, Method)
ESN_GRID = list(itertools.product([0.4, 0.6, 0.8, 0.95],          # rho
                                  [0.3, 0.6, 1.0],                # leak alpha
                                  [0.1, 0.5]))                    # input scale s

E_MAC = 4.6e-12  # J per multiply-accumulate; assumed, not measured (PLAN.md, Budget)


def narma10(rng):
    """NARMA-10 (Atiya & Parlos 2000 form). Redraws if the series blows up."""
    redraws = 0
    while True:
        u = rng.uniform(0.0, 0.5, L + 1)
        y = np.zeros(L + 1)
        for t in range(9, L):
            y[t + 1] = (0.3 * y[t] + 0.05 * y[t] * y[t - 9:t + 1].sum()
                        + 1.5 * u[t - 9] * u[t] + 0.1)
        if np.all(np.isfinite(y)) and np.max(np.abs(y)) < 10:
            return u[:-1], y[1:], redraws  # input u(t), target y(t+1) depends on u(..t)
        redraws += 1


def nmse(pred, target):
    return float(np.mean((pred - target) ** 2) / np.var(target))


def ridge_fit(X, y, lam):
    Xb = np.hstack([X, np.ones((X.shape[0], 1))])
    A = Xb.T @ Xb + lam * np.eye(Xb.shape[1])
    return np.linalg.solve(A, Xb.T @ y)


def ridge_predict(X, w):
    return np.hstack([X, np.ones((X.shape[0], 1))]) @ w


def fit_select_eval(F, y):
    """Pick lambda on validation; report test NMSE once, with a train-only fit."""
    tr = slice(WASH, WASH + TRAIN)
    va = slice(WASH + TRAIN, WASH + TRAIN + VAL)
    te = slice(WASH + TRAIN + VAL, L)
    best = None
    for lam in LAMBDAS:
        w = ridge_fit(F[tr], y[tr], lam)
        v = nmse(ridge_predict(F[va], w), y[va])
        if not np.isfinite(v):
            v = np.inf
        if best is None or v < best[0]:
            best = (v, lam, w)
    val, lam, w = best
    test = nmse(ridge_predict(F[te], w), y[te])
    return val, lam, test


def physical_features(u, a, k, mask, omega2, C, noise):
    """Duffing-type oscillators, coupled through C, noisy; features are x at the end of each input step."""
    x = np.zeros(N)
    v = np.zeros(N)
    F = np.zeros((len(u), N))
    sdt = SIGMA * np.sqrt(DT)
    for t in range(len(u)):
        drive = a * mask * u[t]
        for s in range(SUB):
            acc = (-GAMMA * v - omega2 * x - BETA * x ** 3
                   + (k / N) * (C @ x) + drive)
            v = v + acc * DT + sdt * noise[t, s]
            x = x + v * DT
        F[t] = x
    return F


def esn_features(u, rho, alpha, s, W0, Win0):
    W = W0 * (rho / np.max(np.abs(np.linalg.eigvals(W0))))
    x = np.zeros(N)
    F = np.zeros((len(u), N))
    for t in range(len(u)):
        x = (1 - alpha) * x + alpha * np.tanh(W @ x + s * Win0 * u[t])
        F[t] = x
    return F


def run_instance(i):
    rng = np.random.default_rng([SEED, i])
    u, y, redraws = narma10(rng)

    # Shared random structure, drawn once per instance
    W0 = rng.standard_normal((N, N))
    Win0 = rng.uniform(-1, 1, N)
    omega2 = rng.uniform(0.8, 1.2, N) ** 2
    mask = rng.uniform(-1, 1, N)
    C = rng.standard_normal((N, N))
    noise = rng.standard_normal((len(u), SUB, N))  # common random numbers across configs

    best_phys = None
    for a, k in PHYS_GRID:
        F = physical_features(u, a, k, mask, omega2, C, noise)
        val, lam, test = fit_select_eval(F, y)
        if best_phys is None or val < best_phys["val"]:
            best_phys = {"a": a, "k": k, "lambda": lam, "val": val, "test": test}

    best_esn = None
    for rho, alpha, s in ESN_GRID:
        F = esn_features(u, rho, alpha, s, W0, Win0)
        val, lam, test = fit_select_eval(F, y)
        if best_esn is None or val < best_esn["val"]:
            best_esn = {"rho": rho, "alpha": alpha, "s": s, "lambda": lam, "val": val, "test": test}

    return {"instance": i, "redraws": redraws, "physical": best_phys, "esn": best_esn}


def main():
    per = [run_instance(i) for i in range(INSTANCES)]
    phys = [r["physical"]["test"] for r in per]
    esn = [r["esn"]["test"] for r in per]
    med_phys = float(np.median(phys))
    med_esn = float(np.median(esn))
    killed = med_phys > med_esn  # kill condition, PLAN.md

    # Secondary: break-even energy per oscillator per input step (assumed e_MAC; not decided here)
    e_esn_step = (N * N + N) * E_MAC
    e_star = e_esn_step / N

    result = {
        "metric": "median_test_nmse_physical",
        "value": round(med_phys, 6),
        "baseline": round(med_esn, 6),
        "ratio_phys_over_esn": round(med_phys / med_esn, 4),
        "competitive_ratio_le_1p5": bool(med_phys / med_esn <= 1.5),
        "seed": SEED,
        "killed": bool(killed),
        "instances": INSTANCES,
        "physical_test_nmse": [round(x, 6) for x in phys],
        "esn_test_nmse": [round(x, 6) for x in esn],
        "params_each": N * N + N,
        "e_mac_J_assumed": E_MAC,
        "esn_energy_per_step_J": e_esn_step,
        "breakeven_energy_per_oscillator_step_J": e_star,
        "detail": per,
    }
    with open(RESULT_PATH, "w") as f:
        json.dump(result, f, indent=2)
    short = {k: result[k] for k in ["metric", "value", "baseline", "ratio_phys_over_esn",
                                     "seed", "killed", "breakeven_energy_per_oscillator_step_J"]}
    print(json.dumps(short, indent=2))


if __name__ == "__main__":
    main()
