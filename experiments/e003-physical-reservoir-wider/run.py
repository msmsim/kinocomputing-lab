# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "numpy",
# ]
# ///
"""e003: Does a widened physical reservoir still fall short of a widened ESN, on NARMA-10 and Mackey-Glass? See PLAN.md.

The contract (tools/replicate.mjs relies on it):
- Run with `uv run run.py`. Dependencies live in the header above.
- Everything random draws from SEED (default 1): instance i of task t uses
  default_rng([SEED, t, i]) and its sub-streams.
- The result goes to RESULT_PATH (default result.json) with at least:
  metric, value, seed, killed. `killed` is decided in code:
  median test NMSE of the physical reservoir > median of the ESN on NARMA-10.
  `killed_mg` is the same rule on Mackey-Glass, reported separately.
- Finishes in under 10 minutes on 2 CPUs. Nothing is downloaded.

After a real run, the lab re-runs it on SEED + 1 and checks `killed` and
`killed_mg` come out the same.
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
TASK_NARMA, TASK_MG = 0, 1
MG_HORIZON = 5               # samples (1 time unit each) ahead

# Physical reservoir (PLAN.md, Method)
GAMMA, SIGMA = 0.2, 0.01
DT, SUB = 0.02, 10
PHYS_GRID = list(itertools.product([0.5, 2.0, 8.0],               # a: input scale
                                   [0.1, 0.4, 0.8, 1.6],          # k: coupling
                                   [1.0, 5.0]))                   # beta: cubic term
# ESN (PLAN.md, Method)
ESN_GRID = list(itertools.product([0.4, 0.6, 0.8, 0.95],          # rho
                                  [0.3, 1.0],                     # leak alpha
                                  [0.1, 0.5, 1.0]))               # input scale s

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
            return u[:-1], y[1:], redraws
        redraws += 1


def mackey_glass(rng):
    """Mackey-Glass, tau = 17, Euler step 0.1, sampled every 1 time unit. Redraws if it blows up."""
    tau, dt, transient = 17.0, 0.1, 1000.0
    lag = int(round(tau / dt))
    n_samples = L + MG_HORIZON
    steps = int(round((transient + n_samples) / dt))
    redraws = 0
    while True:
        x = np.empty(lag + steps + 1)
        x[:lag + 1] = 1.2 + 0.01 * rng.standard_normal(lag + 1)
        for t in range(lag, lag + steps):
            xd = x[t - lag]
            x[t + 1] = x[t] + dt * (0.2 * xd / (1.0 + xd ** 10) - 0.1 * x[t])
        samples = x[lag + int(round(transient / dt)) :: int(round(1.0 / dt))][:n_samples]
        if len(samples) == n_samples and np.all(np.isfinite(samples)) and np.max(np.abs(samples)) < 10:
            u = samples[:L] - 1.0                       # input u(t) = x(t) - 1
            y = samples[MG_HORIZON:MG_HORIZON + L]      # target x(t + 5)
            return u, y, redraws
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
    if not np.all(np.isfinite(F)):
        return np.inf, None, np.inf
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
    if not np.isfinite(test):
        test = np.inf
    return val, lam, test


def physical_features(u, a, k, beta, mask, omega2, C, noise):
    """Duffing-type oscillators, coupled through C, noisy; features are x at the end of each input step."""
    x = np.zeros(N)
    v = np.zeros(N)
    F = np.zeros((len(u), N))
    sdt = SIGMA * np.sqrt(DT)
    with np.errstate(over="ignore", invalid="ignore"):
        for t in range(len(u)):
            drive = a * mask * u[t]
            for s in range(SUB):
                acc = (-GAMMA * v - omega2 * x - beta * x ** 3
                       + (k / N) * (C @ x) + drive)
                v = v + acc * DT + sdt * noise[t, s]
                x = x + v * DT
            F[t] = x
            if not np.all(np.isfinite(x)):
                F[t:] = np.nan
                break
    return F


def esn_features(u, rho, alpha, s, W0, Win0):
    W = W0 * (rho / np.max(np.abs(np.linalg.eigvals(W0))))
    x = np.zeros(N)
    F = np.zeros((len(u), N))
    for t in range(len(u)):
        x = (1 - alpha) * x + alpha * np.tanh(W @ x + s * Win0 * u[t])
        F[t] = x
    return F


def effective_rank(F):
    if not np.all(np.isfinite(F)):
        return float("nan")
    tr = F[WASH:WASH + TRAIN]
    sv = np.linalg.svd(tr - tr.mean(axis=0), compute_uv=False)
    p = sv / sv.sum()
    p = p[p > 0]
    return float(np.exp(-np.sum(p * np.log(p))))


def run_task(task, i):
    rng = np.random.default_rng([SEED, task, i])
    if task == TASK_NARMA:
        u, y, redraws = narma10(rng)
    else:
        u, y, redraws = mackey_glass(rng)

    # Shared random structure, drawn once per instance and task
    W0 = rng.standard_normal((N, N))
    Win0 = rng.uniform(-1, 1, N)
    omega2 = rng.uniform(0.8, 1.2, N) ** 2
    mask = rng.uniform(-1, 1, N)
    C = rng.standard_normal((N, N))
    noise = rng.standard_normal((len(u), SUB, N))  # common random numbers across configs

    best_phys = None
    for a, k, beta in PHYS_GRID:
        F = physical_features(u, a, k, beta, mask, omega2, C, noise)
        val, lam, test = fit_select_eval(F, y)
        if best_phys is None or val < best_phys["val"]:
            best_phys = {"a": a, "k": k, "beta": beta, "lambda": lam, "val": val, "test": test}
    F_phys = physical_features(u, best_phys["a"], best_phys["k"], best_phys["beta"],
                               mask, omega2, C, noise)
    best_phys["eff_rank"] = effective_rank(F_phys)

    best_esn = None
    for rho, alpha, s in ESN_GRID:
        F = esn_features(u, rho, alpha, s, W0, Win0)
        val, lam, test = fit_select_eval(F, y)
        if best_esn is None or val < best_esn["val"]:
            best_esn = {"rho": rho, "alpha": alpha, "s": s, "lambda": lam, "val": val, "test": test}
    F_esn = esn_features(u, best_esn["rho"], best_esn["alpha"], best_esn["s"], W0, Win0)
    best_esn["eff_rank"] = effective_rank(F_esn)

    return {"instance": i, "redraws": redraws, "physical": best_phys, "esn": best_esn}


def summarize(per):
    phys = [r["physical"]["test"] for r in per]
    esn = [r["esn"]["test"] for r in per]
    med_phys = float(np.median(phys))
    med_esn = float(np.median(esn))
    return {
        "median_phys": med_phys,
        "median_esn": med_esn,
        "ratio": med_phys / med_esn,
        "killed": bool(med_phys > med_esn),
        "physical_test_nmse": [round(x, 6) for x in phys],
        "esn_test_nmse": [round(x, 6) for x in esn],
        "physical_eff_rank_median": float(np.median([r["physical"]["eff_rank"] for r in per])),
        "esn_eff_rank_median": float(np.median([r["esn"]["eff_rank"] for r in per])),
        "detail": per,
    }


def main():
    narma = [run_task(TASK_NARMA, i) for i in range(INSTANCES)]
    mg = [run_task(TASK_MG, i) for i in range(INSTANCES)]
    sn, sm = summarize(narma), summarize(mg)

    # Secondary: break-even energy per oscillator per input step (assumed e_MAC; not decided here)
    e_esn_step = (N * N + N) * E_MAC
    e_star = e_esn_step / N

    result = {
        "metric": "median_test_nmse_physical",
        "value": round(sn["median_phys"], 6),
        "baseline": round(sn["median_esn"], 6),
        "ratio_phys_over_esn": round(sn["ratio"], 4),
        "seed": SEED,
        "killed": sn["killed"],
        "task_headline": "narma10",
        "killed_mg": sm["killed"],
        "mg_value": round(sm["median_phys"], 6),
        "mg_baseline": round(sm["median_esn"], 6),
        "mg_ratio_phys_over_esn": round(sm["ratio"], 4),
        "instances": INSTANCES,
        "narma10": {k: v for k, v in sn.items() if k != "detail"},
        "mackey_glass": {k: v for k, v in sm.items() if k != "detail"},
        "params_each": N * N + N,
        "e_mac_J_assumed": E_MAC,
        "esn_energy_per_step_J": e_esn_step,
        "breakeven_energy_per_oscillator_step_J": e_star,
        "detail_narma10": narma,
        "detail_mackey_glass": mg,
    }
    with open(RESULT_PATH, "w") as f:
        json.dump(result, f, indent=2)
    short = {k: result[k] for k in ["metric", "value", "baseline", "ratio_phys_over_esn", "seed",
                                     "killed", "mg_value", "mg_baseline", "mg_ratio_phys_over_esn",
                                     "killed_mg"]}
    print(json.dumps(short, indent=2))


if __name__ == "__main__":
    main()
