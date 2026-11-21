# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "numpy",
#   "pysteps==1.21.5",
#   "pyproj",
#   "opencv-python-headless",
# ]
# ///
"""e001: Does the chip-native nowcaster close most of the gap to STEPS? See PLAN.md.

The contract (tools/replicate.mjs relies on it):
- Run with `uv run run.py`. Dependencies live in the header above, pinned
  where the result depends on a version (pysteps 1.21.5).
- Everything random draws from SEED (default 1).
- The result goes to RESULT_PATH (default result.json) as JSON with at
  least: metric, value, seed, killed — `killed` decided by the kill
  condition in PLAN.md, in code, not by eye.
- Finishes in under 10 minutes on 2 CPUs. Data it downloads is cached
  under data/ (gitignored); the radar sequence is re-fetched from the
  pysteps-data repository at a pinned commit if it is missing.

Pre-run decisions (PLAN.md, section "Pre-run decisions"): the sequence, the
frame split, the chip's settling constant, the dB transform and the naive
baseline are fixed there and mirrored below.

`--selftest` checks the data-free parts. `N_MEMBERS` lowers the ensemble
size for a debugging run; a result is only written with N_MEMBERS = 20.
"""

import json
import math
import os
import sys
from datetime import datetime, timedelta

import numpy as np

SEED = int(os.environ.get("SEED", "1"))
RESULT_PATH = os.environ.get("RESULT_PATH", "result.json")
DATA_DIR = os.environ.get("DATA_DIR", "data")
N_MEMBERS = int(os.environ.get("N_MEMBERS", "20"))

# --- the data: pysteps example radar sequence (FMI, 2016-09-28) -------------

PYSTEPS_DATA_SHA = "e95a6efae3df33ae8cd1e54e6762ab5f83427a03"
SEQ_SUBDIR = "radar/fmi/pgm/20160928"
SEQ_START = datetime(2016, 9, 28, 14, 45)
N_FRAMES = 40  # 5-minute frames, 14:45 to 18:00 UTC
FRAME_MIN = 5

FIT_LAST = 14  # the AR fit reads frames 0..14 only; no evaluated target is there
ORIGINS = (14, 20, 26)  # evaluation origins; targets are frames origin+1..origin+12

N_STEPS = 12  # 60 minutes at 5-minute frames
N_LEVELS = 6  # STEPS's default cascade depth
THR_MMH = 0.1  # rain threshold for the dB transform and for STEPS
DB_ZERO = -15.0  # dB value assigned to dry pixels
DB_THR = 10.0 * math.log10(THR_MMH)
OU_TAU_FRAMES = 0.1  # chip settles in a tenth of a frame: per-frame samples independent
EXCEED_MMH = 1.0  # the scored field is the exceedance of this rate

LEAD_MINUTES = (10, 30, 60)  # stored leads, in this order
LEAD_SRC = {10: 1, 30: 5, 60: 11}  # timestep index (0-based) in the 12-step forecast
HEADLINE_LEAD_MIN = 60
CLOSE_FRACTION = 0.5  # PLAN.md: "most" of the gap, read as more than half


# --- the chip sampler -------------------------------------------------------

def ou_settle(rng, n_steps, shape, a):
    """Ornstein–Uhlenbeck settling, unit stationary variance.

    One sample per timestep; `a` = exp(-dt / tau) for this scale. Returns an
    array of shape (n_steps, *shape). Lag-1 autocorrelation is `a`.
    """
    out = np.empty((n_steps,) + tuple(shape))
    out[0] = rng.standard_normal(shape)
    innovation = np.sqrt(1.0 - a * a)
    for t in range(1, n_steps):
        out[t] = a * out[t - 1] + innovation * rng.standard_normal(shape)
    return out


def fit_ar2(rho1, rho2):
    """Yule–Walker AR(2) coefficients from the lag-1 and lag-2 autocorrelations."""
    denom = 1.0 - rho1 * rho1
    phi1 = rho1 * (1.0 - rho2) / denom
    phi2 = (rho2 - rho1 * rho1) / denom
    return phi1, phi2


def ar2_memory(noise, phi1, phi2):
    """Filter a noise stream (time on axis 0) through AR(2) memory.

    The innovation variance is set so the output has the same stationary
    variance as the input stream's marginal, so the memory changes the
    correlation, not the amplitude.
    """
    n = noise.shape[0]
    rho1 = phi1 / (1.0 - phi2)
    rho2 = phi1 * rho1 + phi2
    sigma_e = np.sqrt(max(1.0 - phi1 * rho1 - phi2 * rho2, 1e-12))
    out = np.empty_like(noise)
    out[0] = noise[0]
    out[1] = noise[1] if n > 1 else noise[0]
    for t in range(2, n):
        out[t] = phi1 * out[t - 1] + phi2 * out[t - 2] + sigma_e * noise[t]
    return out


# --- scoring ----------------------------------------------------------------

def crps_ensemble(members, obs):
    """Ensemble CRPS, pixelwise.

    members: array (M, ...), obs: array (...). Uses the sorted-sample form
    of E|X − X'|, so it is O(M log M) per pixel.
    CRPS = E|X − y| − ½ E|X − X'|.
    """
    m = members.shape[0]
    term1 = np.mean(np.abs(members - obs), axis=0)
    sorted_members = np.sort(members, axis=0)
    ranks = np.arange(1, m + 1).reshape((m,) + (1,) * (members.ndim - 1))
    pairwise = (2.0 / (m * m)) * np.sum((2 * ranks - m - 1) * sorted_members, axis=0)
    return term1 - 0.5 * pairwise


# --- the kill condition -----------------------------------------------------

def decide(crps_steps, crps_naive, crps_chip):
    """PLAN.md's kill condition, decided here, not by eye.

    Each argument is the mean CRPS at the headline lead (60 min) over the
    evaluation origins. Returns (killed, f), with f = None when there is no
    gap to close.
    """
    if crps_steps >= crps_naive:
        return True, None  # no gap: STEPS doesn't beat the naive ensemble
    if crps_chip >= crps_naive:
        return True, (crps_naive - crps_chip) / (crps_naive - crps_steps)
    f = (crps_naive - crps_chip) / (crps_naive - crps_steps)
    return bool(f < CLOSE_FRACTION), float(f)


# --- the forecast path ------------------------------------------------------

def frame_names():
    return [
        f"{(SEQ_START + timedelta(minutes=FRAME_MIN * i)):%Y%m%d%H%M}"
        "_fmi.radar.composite.lowest_FIN_SUOMI1.pgm.gz"
        for i in range(N_FRAMES)
    ]


def fetch_sequence(data_dir):
    """Return local paths to the 40 frames, downloading any that are missing."""
    import urllib.request

    out_dir = os.path.join(data_dir, SEQ_SUBDIR)
    os.makedirs(out_dir, exist_ok=True)
    paths = []
    for name in frame_names():
        path = os.path.join(out_dir, name)
        paths.append(path)
        if os.path.exists(path):
            continue
        url = (
            "https://raw.githubusercontent.com/pySTEPS/pysteps-data/"
            f"{PYSTEPS_DATA_SHA}/{SEQ_SUBDIR}/{name}"
        )
        with urllib.request.urlopen(url, timeout=120) as resp:
            blob = resp.read()
        tmp = path + ".part"
        with open(tmp, "wb") as fh:
            fh.write(blob)
        os.replace(tmp, path)
    return paths


def load_frames(paths):
    """Frames in mm/h, shape (T, m, n). Missing-coverage pixels are dry."""
    from pysteps.io import importers
    from pysteps.utils import conversion

    frames = []
    for path in paths:
        field, _, meta = importers.import_fmi_pgm(path, gzipped=True)
        field, _ = conversion.to_rainrate(field, meta)
        frames.append(np.where(np.isfinite(field), field, 0.0))
    return np.stack(frames)


def to_db(rate):
    out = np.full(rate.shape, DB_ZERO)
    wet = rate >= THR_MMH
    out[wet] = 10.0 * np.log10(rate[wet])
    return out


def from_db(db):
    return np.where(db > DB_THR, 10.0 ** (db / 10.0), 0.0)


def velocity(db_three):
    from pysteps import motion

    return motion.get_method("LK")(db_three)


def cascade(field, bp):
    from pysteps.cascade.decomposition import decomposition_fft

    return decomposition_fft(field, bp, normalize=False)["cascade_levels"]


def fit_chip(rate, db, bp, v_fit):
    """Per-scale residual statistics, from observed frames 0..FIT_LAST only.

    The residual at each frame is the observed cascade minus the cascade of
    the previous frame advected once, as STEPS does. Returns the per-scale
    residual sd, and the AR(2) coefficients per scale.
    """
    from pysteps.nowcasts.extrapolation import forecast as extrapolate

    residuals = []
    for t in range(1, FIT_LAST + 1):
        advected = np.nan_to_num(extrapolate(rate[t - 1], v_fit, [1])[0])
        residuals.append(
            (cascade(db[t], bp) - cascade(to_db(advected), bp)).astype(np.float32)
        )
    res = np.stack(residuals)  # (T, K, m, n)
    sigma = np.empty(N_LEVELS)
    phi = np.empty((N_LEVELS, 2))
    rho = np.empty((N_LEVELS, 2))
    for k in range(N_LEVELS):
        a = res[:, k].astype(np.float64)
        a = a - a.mean()
        var = np.mean(a * a)
        sigma[k] = math.sqrt(var)
        rho1 = np.mean(a[:-1] * a[1:]) / var
        rho2 = np.mean(a[:-2] * a[2:]) / var
        rho1, rho2 = np.clip(rho1, -0.95, 0.95), np.clip(rho2, -0.95, 0.95)
        phi[k] = fit_ar2(rho1, rho2)
        rho[k] = (rho1, rho2)
    return sigma, phi, rho


def white_level_sd(shape, bp):
    """sd of each cascade level of unit white noise (the chip's raw scale)."""
    ref = np.random.default_rng([SEED, 999]).standard_normal(shape)
    return cascade(ref, bp).std(axis=(1, 2))


def chip_noise(rng, shape, bp, c_sd, sigma, phi):
    """One member's chip perturbations: (N_STEPS, m, n), dB units.

    Per frame, the chip settles each pixel (OU), the settled field is split
    into scales, and each scale gets its own AR(2) memory in time.
    """
    settled = ou_settle(rng, N_STEPS, shape, math.exp(-1.0 / OU_TAU_FRAMES))
    levels = np.empty((N_LEVELS, N_STEPS) + tuple(shape), dtype=np.float32)
    for t in range(N_STEPS):
        levels[:, t] = cascade(settled[t], bp)
    noise = np.zeros((N_STEPS,) + tuple(shape))
    for k in range(N_LEVELS):
        unit = levels[k] / c_sd[k]
        noise += sigma[k] * ar2_memory(unit.astype(np.float64), phi[k, 0], phi[k, 1])
    return noise


def forecast_origin(t0, rate, db, bp, c_sd, sigma, phi):
    """All three forecasts from origin t0. Returns leads-only arrays, mm/h."""
    from pysteps.nowcasts import extrapolation, steps

    shape = rate.shape[1:]
    v = velocity(db[t0 - 2 : t0 + 1])

    # Deterministic part: computed once, shared by the chip and naive ensembles.
    ext = np.stack(extrapolation.forecast(rate[t0], v, list(range(1, N_STEPS + 1))))
    ext_db = to_db(ext)
    src = [LEAD_SRC[m] for m in LEAD_MINUTES]

    # STEPS, default settings, N_MEMBERS members.
    s = steps.forecast(
        rate[t0 - 2 : t0 + 1],
        v,
        N_STEPS,
        n_ens_members=N_MEMBERS,
        precip_thr=THR_MMH,
        kmperpixel=1.0,
        timestep=FRAME_MIN,
        seed=SEED * 1000 + t0,
    )
    steps_members = np.asarray(s[:, src], dtype=np.float32)
    del s

    # Chip-native: per-scale perturbations, dB units, added to the shared part.
    rng_chip = np.random.default_rng([SEED, t0, 1])
    chip_members = np.empty((N_MEMBERS, len(src)) + shape, dtype=np.float32)
    for j in range(N_MEMBERS):
        noise = chip_noise(rng_chip, shape, bp, c_sd, sigma, phi)
        chip_members[j] = from_db(ext_db + noise)[src]

    # Naive chip ensemble: same deterministic part and marginal variance,
    # i.i.d. per pixel and per timestep, no scale structure, no memory.
    rng_naive = np.random.default_rng([SEED, t0, 2])
    total_sd = math.sqrt(float(np.sum(sigma ** 2)))
    naive_members = np.empty_like(chip_members)
    for j in range(N_MEMBERS):
        noise = total_sd * rng_naive.standard_normal((N_STEPS,) + shape)
        naive_members[j] = from_db(ext_db + noise)[src]

    obs = np.stack([rate[t0 + LEAD_SRC[m] + 1] for m in LEAD_MINUTES])
    return {"STEPS": steps_members, "naive": naive_members, "chip": chip_members}, obs


def score_origin(members, obs):
    """Per-lead CRPS on the 1 mm/h exceedance field, plus spread–skill at 60 min."""
    out = {}
    for i, minutes in enumerate(LEAD_MINUTES):
        y = (obs[i] > EXCEED_MMH).astype(np.float32)
        out[f"crps_{minutes}"] = {}
        for name, mem in members.items():
            x = (mem[:, i] > EXCEED_MMH).astype(np.float32)
            out[f"crps_{minutes}"][name] = float(crps_ensemble(x, y).mean())
    i = LEAD_MINUTES.index(HEADLINE_LEAD_MIN)
    out["spread_skill_60"] = {}
    for name, mem in members.items():
        spread = math.sqrt(float(mem[:, i].var(axis=0).mean()))
        skill = math.sqrt(float(((mem[:, i].mean(axis=0) - obs[i]) ** 2).mean()))
        out["spread_skill_60"][name] = spread / skill if skill > 0 else None
    return out


# --- self-test on synthetic inputs (not a result) ---------------------------

def selftest():
    rng = np.random.default_rng(SEED)

    # CRPS of N(0,1) against y = 0 has the closed form 2*phi(0) - 1/sqrt(pi).
    members = rng.standard_normal((4000, 50))
    expected = 2 / np.sqrt(2 * np.pi) - 1 / np.sqrt(np.pi)  # ~0.2337
    got = crps_ensemble(members, np.zeros(50)).mean()
    assert abs(got - expected) < 0.01, got

    # A perfect ensemble (all members equal the obs) has CRPS 0.
    obs = rng.standard_normal((8, 8))
    assert np.allclose(crps_ensemble(np.repeat(obs[None], 5, axis=0), obs), 0.0)

    # OU settling: lag-1 autocorrelation matches a, unit variance.
    a = 0.8
    x = ou_settle(rng, 20000, (1,), a)[:, 0]
    rho1 = np.corrcoef(x[:-1], x[1:])[0, 1]
    assert abs(rho1 - a) < 0.02, rho1
    assert abs(x.var() - 1.0) < 0.05, x.var()

    # Yule–Walker round trip: AR(2) with known coefficients is recovered.
    phi1, phi2 = 0.5, 0.3
    rho1_true = phi1 / (1 - phi2)
    rho2_true = phi1 * rho1_true + phi2
    f1, f2 = fit_ar2(rho1_true, rho2_true)
    assert abs(f1 - phi1) < 1e-9 and abs(f2 - phi2) < 1e-9

    # AR(2) memory keeps the stationary variance near 1.
    y = ar2_memory(rng.standard_normal((20000, 1)), phi1, phi2)[:, 0]
    assert abs(y[500:].var() - 1.0) < 0.1, y[500:].var()

    # Kill condition: a clear case passes, the others are killed.
    assert decide(crps_steps=1.0, crps_naive=2.0, crps_chip=1.2) == (False, 0.8)
    assert decide(crps_steps=1.0, crps_naive=2.0, crps_chip=1.6)[0] is True
    assert decide(crps_steps=2.0, crps_naive=2.0, crps_chip=1.0)[0] is True
    assert decide(crps_steps=1.0, crps_naive=2.0, crps_chip=2.1)[0] is True

    # dB transform round trip above threshold; dry pixels stay dry.
    r = np.array([0.0, 0.5, 5.0, 40.0])
    back = from_db(to_db(r))
    assert np.allclose(back[1:], r[1:]) and back[0] == 0.0
    print("selftest ok")


def main():
    if "--selftest" in sys.argv:
        selftest()
        return

    from pysteps.cascade.bandpass_filters import filter_gaussian

    paths = fetch_sequence(DATA_DIR)
    rate = load_frames(paths)
    db = to_db(rate)
    shape = rate.shape[1:]
    bp = filter_gaussian(shape, N_LEVELS)

    v_fit = velocity(db[FIT_LAST - 2 : FIT_LAST + 1])
    sigma, phi, rho = fit_chip(rate, db, bp, v_fit)
    c_sd = white_level_sd(shape, bp)

    # Resumable: each origin's scores are saved as they finish, so a run
    # interrupted partway (the runner or the shell may stop it) picks up
    # where it left off. Same seeds, same numbers.
    parts_dir = os.path.join(os.path.dirname(os.path.abspath(RESULT_PATH)), "parts")
    os.makedirs(parts_dir, exist_ok=True)
    per_origin = []
    for t0 in ORIGINS:
        part = os.path.join(parts_dir, f"origin_{t0}_n{N_MEMBERS}.json")
        if os.path.exists(part):
            with open(part) as fh:
                per_origin.append(json.load(fh))
            continue
        members, obs = forecast_origin(t0, rate, db, bp, c_sd, sigma, phi)
        entry = {"origin": t0, **score_origin(members, obs)}
        del members
        with open(part, "w") as fh:
            json.dump(entry, fh, indent=2)
        per_origin.append(entry)
        print(f"origin {t0} done", flush=True)

    def mean_over(key, name):
        vals = [o[key][name] for o in per_origin if o[key][name] is not None]
        return float(np.mean(vals)) if vals else None

    crps60 = {n: mean_over("crps_60", n) for n in ("STEPS", "naive", "chip")}
    killed, f = decide(crps60["STEPS"], crps60["naive"], crps60["chip"])
    names = ("STEPS", "naive", "chip")
    mean_crps = {}
    for minutes in LEAD_MINUTES:
        key = "crps_%d" % minutes
        mean_crps["%dmin" % minutes] = {n: round(mean_over(key, n), 5) for n in names}
    detail = {
        "sequence": "%s frames 14:45-18:00 UTC, pysteps-data@%s" % (SEQ_SUBDIR, PYSTEPS_DATA_SHA[:8]),
        "n_members": N_MEMBERS,
        "origins": list(ORIGINS),
        "fit_frames": [0, FIT_LAST],
        "sigma_per_scale_db": sigma.round(4).tolist(),
        "ar2_per_scale": phi.round(4).tolist(),
        "rho_per_scale": rho.round(4).tolist(),
        "white_level_sd": c_sd.round(4).tolist(),
        "mean_crps": mean_crps,
        "spread_skill_60": {n: mean_over("spread_skill_60", n) for n in ("STEPS", "chip", "naive")},
        "per_origin": per_origin,
    }
    result = {
        "metric": "f60_gap_closed",
        "value": f,
        "seed": SEED,
        "killed": killed,
        "detail": detail,
    }
    if N_MEMBERS != 20:
        print(json.dumps({"debug_run": True, "killed": killed, "value": f}, indent=2))
        print("N_MEMBERS != 20: not a result, nothing written", file=sys.stderr)
        return
    with open(RESULT_PATH, "w") as fh:
        json.dump(result, fh, indent=2)
    print(json.dumps({"metric": result["metric"], "value": f, "killed": killed}, indent=2))


if __name__ == "__main__":
    main()
