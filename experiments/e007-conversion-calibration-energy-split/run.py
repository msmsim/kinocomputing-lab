# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy", "scikit-learn"]
# ///
"""e007: converter+calibration share of energy per MAC, analog-memory vs photonic. See PLAN.md.

SEED in, result.json out, `killed` decided in code (PLAN.md kill condition).
"""
import json, os
import numpy as np
from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier

SEED = int(os.environ.get("SEED", "1"))
RESULT_PATH = os.environ.get("RESULT_PATH", "result.json")
rng = np.random.default_rng(SEED)

def quant(x, bits, lim):
    lv = 2 ** (bits - 1) - 1
    return np.clip(np.round(x / lim * lv), -lv, lv) / lv * lim

def forward(Xt, Ws, bs, wbits=4, ibits=6, obits=8, wnoise=0.0):
    h = Xt
    for i, (W, b) in enumerate(zip(Ws, bs)):
        lim = np.abs(W).max()
        Wq = quant(W, wbits, lim) + rng.normal(0, wnoise * lim, W.shape)
        xl = max(np.abs(h).max(), 1e-9)
        y = quant(h, ibits, xl) @ Wq
        yl = max(np.abs(y).max(), 1e-9)
        y = quant(y, obits, yl) + b
        h = np.maximum(y, 0) if i < len(Ws) - 1 else y
    return h

X, y = load_digits(return_X_y=True)
X = X / 16.0
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, random_state=SEED)
clf = MLPClassifier((32,), max_iter=400, random_state=SEED).fit(Xtr, ytr)
Ws, bs = clf.coefs_, clf.intercepts_
acc_float = clf.score(Xte, yte)
acc_q = float(np.mean(forward(Xte, Ws, bs).argmax(1) == yte))

# weight noise (fraction of max|w|) that costs 1 accuracy point vs the quantised network
sig_max = 0.0
for s in np.linspace(0, 0.3, 61):
    a = np.mean([np.mean(forward(Xte, Ws, bs, wnoise=s).argmax(1) == yte) for _ in range(5)])
    if a >= acc_q - 0.01:
        sig_max = s
    else:
        break

# assumed constants: (low, mid, high); "fav" = value least favourable to the prediction
C = {
    "walden_fJ_per_step": (5, 20, 100),       # ADC/DAC figure of merit
    "analog_core_fJ_per_mac": (1, 5, 20),
    "photonic_core_fJ_per_mac": (0.02, 0.02, 0.02),  # 20 aJ, from the paper
    "write_pJ_per_cell": (10, 50, 200),       # reprogram+verify one memory cell
    "analog_drift_per_sqrt_hour": (0.002, 0.01, 0.05),  # fraction of max|w|
    "photonic_drift_per_sqrt_hour": (0.005, 0.02, 0.1),
    "heater_mW_per_weight": (0.0, 0.01, 0.1), # holding power per tuned weight
    "mod_pJ_per_input": (0.1, 0.5, 2.0),      # modulator drive per input value
    "analog_rate_per_s": (1e4, 1e3, 1e2),     # inferences per second (fav is high rate)
    "photonic_rate_per_s": (1e9, 1e8, 1e7),
}
IDX = {"low": 0, "mid": 1, "high": 2}

def energy(shape, level, ibits=6, obits=8, heater=None):
    """Energy per MAC (fJ), split by term, for each substrate. level 'fav' = low cost for
    converters/calibration and high core cost (least favourable to the prediction)."""
    def g(k, kind):
        lo, mid, hi = C[k]
        if kind == "mid": return mid
        # fav: converter/calibration constants low; core constants high; rate high
        if k.endswith("core_fJ_per_mac"): return hi
        return lo
    kind = "mid" if level == "mid" else "fav"
    W = shape
    macs = sum(a * b for a, b in zip(W[:-1], W[1:]))
    nin = sum(W[:-1]); nout = sum(W[1:])
    wf = g("walden_fJ_per_step", kind)
    dac = wf * 2 ** ibits; adc = wf * 2 ** obits  # fJ per conversion
    res = {}
    # analog memory
    hours = (sig_max / g("analog_drift_per_sqrt_hour", kind)) ** 2
    infs = g("analog_rate_per_s", kind) * 3600 * hours
    core = g("analog_core_fJ_per_mac", kind) * macs
    conv = dac * nin + adc * nout
    cal = g("write_pJ_per_cell", kind) * 1000 * macs / infs
    res["analog"] = dict(core=core / macs, converters=conv / macs, calibration=cal / macs)
    # photonic
    hours = (sig_max / g("photonic_drift_per_sqrt_hour", kind)) ** 2
    rate = g("photonic_rate_per_s", kind)
    infs = rate * 3600 * hours
    core = g("photonic_core_fJ_per_mac", kind) * macs
    conv = (dac + g("mod_pJ_per_input", kind) * 1000) * nin + adc * nout
    hold = (g("heater_mW_per_weight", kind) if heater is None else heater) * 1e-3 * macs / rate * 1e15  # fJ per inference
    cal = hold + 50e3 * macs / infs  # holding power + occasional recalibration pass
    res["photonic"] = dict(core=core / macs, converters=conv / macs, calibration=cal / macs)
    for v in res.values():
        v["total"] = v["core"] + v["converters"] + v["calibration"]
        v["share_conv_cal"] = float((v["converters"] + v["calibration"]) / v["total"])
        v["share_converters_only"] = float(v["converters"] / v["total"])  # converters / total INCLUDING any heater term
        for kk in ("core", "converters", "calibration", "total"): v[kk] = float(v[kk])
    return res

out = {"metric": "min share of energy in converters+calibration, mid setting, 64-32-10", "seed": SEED,
       "acc_float": acc_float, "acc_quantised": acc_q, "weight_noise_for_1pt_loss": sig_max,
       "constants_low_mid_high": C}
for name, shape in (("small_64_32_10", (64, 32, 10)), ("large_784_128_10", (784, 128, 10))):
    for lvl in ("mid", "fav"):
        out[f"{name}_{lvl}"] = energy(shape, lvl)
out["photonic_heater_sweep_mid"] = {
    f"{n}_heater_{h}mW": round(energy(sh, "mid", heater=h)["photonic"]["share_conv_cal"], 4) and
    {"converters_share": round(energy(sh, "mid", heater=h)["photonic"]["share_converters_only"], 4),
     "total_fJ_per_mac": round(energy(sh, "mid", heater=h)["photonic"]["total"], 2)}
    for n, sh in (("small", (64, 32, 10)), ("large", (784, 128, 10))) for h in (0.0, 0.01, 0.1)}
m = out["small_64_32_10_mid"]
out["value"] = round(min(m["analog"]["share_conv_cal"], m["photonic"]["share_conv_cal"]), 4)
out["killed"] = bool(out["value"] < 0.5)
with open(RESULT_PATH, "w") as f:
    json.dump(out, f, indent=1)
print(json.dumps({k: out[k] for k in ("value", "killed", "acc_float", "acc_quantised", "weight_noise_for_1pt_loss")}))
for k in out:
    if k.startswith(("small", "large")):
        for s, v in out[k].items():
            print(k, s, {a: round(b, 4) for a, b in v.items()})
