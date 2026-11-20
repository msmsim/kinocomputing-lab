# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "numpy",
# ]
# ///
"""e001: Does the chip-native nowcaster close most of the gap to STEPS? See PLAN.md.

The contract (tools/replicate.mjs relies on it):
- Run with `uv run run.py`. Dependencies live in the header above, pinned
  when the result depends on a version. (pysteps is added when the forecast
  path is written; see RESULTS.md.)
- Everything random draws from SEED (default 1).
- The result goes to RESULT_PATH (default result.json) as JSON with at
  least: metric, value, seed, killed — `killed` decided by the kill
  condition in PLAN.md, in code, not by eye.
- Finishes in under 10 minutes on 2 CPUs. Data it downloads is cached
  under data/ (gitignored); data it can't re-download is committed, small.

Status: the data-free parts (chip sampler, CRPS, the kill decision) are here
and checked by `python run.py --selftest`. The forecast path is not written
yet, so `main()` refuses to write a result: a result.json with no forecasts
behind it would be a number with nothing under it.

After a real run, the lab re-runs it on SEED + 1 and checks `killed`
comes out the same.
"""

import os
import sys

import numpy as np

SEED = int(os.environ.get("SEED", "1"))
RESULT_PATH = os.environ.get("RESULT_PATH", "result.json")
DATA_DIR = os.environ.get("DATA_DIR", "data")

LEADS_MIN = (10, 30, 60)
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


def chip_perturbations(rng, n_steps, shape, a_per_scale, phi_per_scale):
    """Per-scale perturbation fields from the simulated chip sampler.

    Returns a list (one per scale) of arrays of shape (n_steps, *shape): OU
    settling per scale, then the AR(2) memory for that scale.
    """
    fields = []
    for a, (phi1, phi2) in zip(a_per_scale, phi_per_scale):
        settled = ou_settle(rng, n_steps, shape, a)
        fields.append(ar2_memory(settled, phi1, phi2))
    return fields


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
    print("selftest ok")


def main():
    if "--selftest" in sys.argv:
        selftest()
        return
    if not os.path.isdir(DATA_DIR) or not os.listdir(DATA_DIR):
        print(f"no radar data in {DATA_DIR}/; the pysteps sequence has not been fetched", file=sys.stderr)
        sys.exit(2)
    raise NotImplementedError(
        "the forecast path (pysteps: motion, STEPS, chip-native, naive ensemble) is not written; see RESULTS.md"
    )


if __name__ == "__main__":
    main()
