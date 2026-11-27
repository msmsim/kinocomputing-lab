# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "numpy",
# ]
# ///
"""e009: where do plain digital controls land on NARMA-10? See PLAN.md.

SEED in, result.json out, `killed` decided in code.
"""
import json
import os

import numpy as np

SEED = int(os.environ.get("SEED", "1"))
RESULT_PATH = os.environ.get("RESULT_PATH", "result.json")
NTR, NTE, WASH, VAL, N = 1500, 400, 100, 300, 50
L = WASH + NTR + NTE
LAMS = [1e-8, 1e-6, 1e-4, 1e-2, 1.0]


def narma10(rng):
    while True:
        u = rng.uniform(0.0, 0.5, L + 1)
        y = np.zeros(L + 1)
        for t in range(9, L):
            y[t + 1] = (0.3 * y[t] + 0.05 * y[t] * y[t - 9:t + 1].sum()
                        + 1.5 * u[t - 9] * u[t] + 0.1)
        if np.all(np.isfinite(y)) and np.max(np.abs(y)) < 10:
            return u[:-1], y[1:]


def nmse(p, t):
    return float(np.mean((p - t) ** 2) / np.var(t))


def fit(F, y, lam):
    Xb = np.hstack([F, np.ones((len(F), 1))])
    return np.linalg.solve(Xb.T @ Xb + lam * np.eye(Xb.shape[1]), Xb.T @ y)


def pred(F, w):
    return np.hstack([F, np.ones((len(F), 1))]) @ w


def select_eval(F, y):
    """Ridge lambda picked on the last VAL training points; then refit on all training, test."""
    s = WASH
    tr = slice(s, s + NTR)
    te = slice(s + NTR, L)
    Ftr, ytr = F[tr], y[tr]
    best = min(LAMS, key=lambda lam: nmse(pred(Ftr[-VAL:], fit(Ftr[:-VAL], ytr[:-VAL], lam)), ytr[-VAL:]))
    val = nmse(pred(Ftr[-VAL:], fit(Ftr[:-VAL], ytr[:-VAL], best)), ytr[-VAL:])
    return nmse(pred(F[te], fit(Ftr, ytr, best)), y[te]), val


def window(u, k=10):
    return np.stack([np.concatenate([np.zeros(max(0, k - 1 - t)), u[max(0, t - k + 1):t + 1][::-1]])[:k] if t < k - 1
                     else u[t - k + 1:t + 1][::-1] for t in range(len(u))])


def run(i):
    rng = np.random.default_rng(SEED + i)
    u, y = narma10(rng)
    Wd = window(u)
    lin = select_eval(Wd, y)[0]
    best = None
    for sc in (0.5, 2.0, 8.0):
        R = rng.normal(size=(10, N)) * sc
        b = rng.normal(size=N) * 0.1
        r = select_eval(np.tanh(Wd @ R + b), y)
        best = r if best is None or r[1] < best[1] else best
    rf = best[0]
    best = None
    for rho in (0.6, 0.9):
        for s in (0.1, 0.5):
            W = rng.normal(size=(N, N))
            W *= rho / max(abs(np.linalg.eigvals(W)))
            Win = rng.uniform(-1, 1, N) * s
            x = np.zeros(N)
            F = np.zeros((L, N))
            for t in range(L):
                x = np.tanh(W @ x + Win * u[t])
                F[t] = x
            r = select_eval(F, y)
            best = r if best is None or r[1] < best[1] else best
    return lin, rf, best[0]


def main():
    res = np.array([run(i) for i in range(10)])
    med = np.median(res, axis=0)
    killed = not (0.5 <= med[0] <= 0.9) or med[1] >= 0.3 or med[2] >= 0.3
    out = {
        "metric": "median test NMSE over 10 instances: linear delay line, random features, ESN",
        "value": [round(float(m), 4) for m in med],
        "seed": SEED,
        "killed": bool(killed),
        "linear": [round(float(v), 4) for v in res[:, 0]],
        "random_features": [round(float(v), 4) for v in res[:, 1]],
        "esn": [round(float(v), 4) for v in res[:, 2]],
    }
    json.dump(out, open(RESULT_PATH, "w"), indent=1)
    print(json.dumps({k: out[k] for k in ("value", "killed")}))


main()
