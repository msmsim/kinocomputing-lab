# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "numpy",
# ]
# ///
"""e010: fading-memory controls on NARMA-10. See PLAN.md.

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


def leaky(u, n=50):
    a = np.linspace(0.05, 0.95, n)
    F = np.zeros((len(u), n))
    x = np.zeros(n)
    for t in range(len(u)):
        x = a * x + (1 - a) * u[t]
        F[t] = x
    return F


def delay_res(u, mask, alpha, c, g, n=50):
    F = np.zeros((len(u), n))
    s = np.zeros(n)
    for t in range(len(u)):
        prev = s[-1]
        new = np.zeros(n)
        for i in range(n):
            new[i] = np.tanh(alpha * s[i] + c * prev + g * mask[i] * (u[t] - 0.25) * 4)
            prev = new[i]
        s = new
        F[t] = s
    return F


def run(i):
    rng = np.random.default_rng(SEED + i)
    u, y = narma10(rng)
    lk = select_eval(leaky(u), y)[0]
    mask = rng.choice([-1.0, 1.0], size=N)
    best = None
    for alpha in (0.5, 0.8):
        for c in (0.3, 0.6):
            for g in (0.1, 0.5, 1.0):
                r = select_eval(delay_res(u, mask, alpha, c, g), y)
                best = r if best is None or r[1] < best[1] else best
    return lk, best[0]


def main():
    res = np.array([run(i) for i in range(10)])
    med = np.median(res, axis=0)
    killed = not (0.5 <= med[0] <= 0.9) or not (0.15 <= med[1] <= 0.35)
    out = {
        "metric": "median test NMSE over 10 instances: leaky-integrator linear, delay reservoir",
        "value": [round(float(m), 4) for m in med],
        "seed": SEED,
        "killed": bool(killed),
        "leaky_linear": [round(float(v), 4) for v in res[:, 0]],
        "delay_reservoir": [round(float(v), 4) for v in res[:, 1]],
    }
    json.dump(out, open(RESULT_PATH, "w"), indent=1)
    print(json.dumps({k: out[k] for k in ("value", "killed")}))


main()
