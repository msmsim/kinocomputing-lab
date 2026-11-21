# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "numpy",
# ]
# ///
"""e004: Do alternative-hardware papers judge themselves on the digital yardstick? See PLAN.md.

The contract (tools/replicate.mjs relies on it):
- Run with `uv run run.py`. Dependencies live in the header above.
- Everything random draws from SEED (default 1): the 150-paper sample.
- Reads snapshot/openalex_snapshot.json (committed; written by fetch.py, once).
- Writes RESULT_PATH (default result.json): metric, value (headline: share of
  sampled papers using the digital yardstick, rule D), Wilson interval,
  secondary shares, n, seed, killed. `killed` is decided in code: D share < 0.50.
- Also writes hand_check_sample.md (20 abstracts, seed 2, no rule codes) for
  the blind hand check, and hand_check_rule_codes.json for comparison.
"""

import json
import math
import os
import re

import numpy as np

SEED = int(os.environ.get("SEED", "1"))
RESULT_PATH = os.environ.get("RESULT_PATH", "result.json")
N_SAMPLE = 150
N_HAND = 20
KILL_SHARE = 0.50
HERE = os.path.dirname(os.path.abspath(__file__))

# Rule D: a digital comparator plus a comparison word, in one abstract.
# Converter terms are removed first, so ADC/DAC and digital-to-analog don't count.
D_CONVERTERS = re.compile(
    r"digital[- ]to[- ]analog|analog[- ]to[- ]digital|\b(ADC|DAC|ADCs|DACs)\b", re.I
)
D_COMPARATOR = re.compile(
    r"\b(GPUs?|CPUs?|digital|von Neumann|floating[- ]point|FP(?:16|32|64)"
    r"|conventional (?:processors?|hardware|computing|computers?)"
    r"|electronic (?:baseline|hardware))\b",
    re.I,
)
D_COMPARE = re.compile(
    r"\b(compar\w*|baselines?|versus|vs\.?|outperform\w*|speed-?ups?|faster|than|relative to)\b",
    re.I,
)
# Rule N: energy-per-operation units, or energy-efficiency wording.
N_ENERGY = re.compile(
    r"(TOPS/W|TOPS per watt|GOPS/W|pJ|fJ|nJ|energy[- ]efficien\w*|per joule|energy[- ]per|J/op)",
    re.I,
)


def abstract_text(inverted):
    """Rebuild an abstract from OpenAlex's inverted index."""
    if not inverted:
        return ""
    words = {}
    for word, positions in inverted.items():
        for p in positions:
            words[p] = word
    return " ".join(words[i] for i in sorted(words))


def rule_d(text):
    stripped = D_CONVERTERS.sub(" ", text)
    return bool(D_COMPARATOR.search(stripped) and D_COMPARE.search(stripped))


def rule_n(text):
    return bool(N_ENERGY.search(text))


def wilson(k, n, z=1.96):
    if n == 0:
        return (0.0, 1.0)
    p = k / n
    denom = 1 + z * z / n
    centre = (p + z * z / (2 * n)) / denom
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / denom
    return (round(centre - half, 4), round(centre + half, 4))


def load_pool():
    with open(os.path.join(HERE, "snapshot", "openalex_snapshot.json")) as f:
        snapshot = json.load(f)
    seen = {}
    for query in sorted(snapshot):
        for work in snapshot[query]:
            wid = work["id"]
            if wid in seen:
                continue
            text = abstract_text(work.get("abstract_inverted_index"))
            if not text:
                continue
            seen[wid] = {
                "id": wid,
                "title": work.get("display_name"),
                "year": work.get("publication_year"),
                "query": query,
                "abstract": text,
            }
    return [seen[k] for k in sorted(seen)]


def main():
    pool = load_pool()
    rng = np.random.default_rng(SEED)
    if len(pool) > N_SAMPLE:
        idx = rng.choice(len(pool), size=N_SAMPLE, replace=False)
        sample = [pool[i] for i in sorted(idx)]
    else:
        sample = pool

    codes = []
    for w in sample:
        d, n = rule_d(w["abstract"]), rule_n(w["abstract"])
        codes.append({"id": w["id"], "D": d, "N": n})
    n = len(codes)
    k_d = sum(c["D"] for c in codes)
    k_n_only = sum(c["N"] and not c["D"] for c in codes)
    k_both = sum(c["N"] and c["D"] for c in codes)
    share_d = k_d / n
    killed = share_d < KILL_SHARE

    result = {
        "metric": "share_using_digital_yardstick_rule_D",
        "value": round(share_d, 4),
        "wilson95": wilson(k_d, n),
        "secondary": {
            "share_native_only_rule_N_without_D": round(k_n_only / n, 4),
            "share_both_D_and_N": round(k_both / n, 4),
        },
        "pool_size": len(pool),
        "n": n,
        "seed": SEED,
        "kill_share": KILL_SHARE,
        "killed": bool(killed),
    }
    with open(RESULT_PATH, "w") as f:
        json.dump(result, f, indent=2)
    print(json.dumps(result))

    if SEED == 1:
        # Hand-check sample: drawn with seed 2 from the same pool, blind to codes.
        hrng = np.random.default_rng(2)
        hidx = sorted(hrng.choice(len(pool), size=N_HAND, replace=False))
        hand = [pool[i] for i in hidx]
        with open(os.path.join(HERE, "hand_check_sample.md"), "w") as f:
            f.write("# Hand-check sample (seed 2), blind to rule codes\n\n")
            for i, w in enumerate(hand, 1):
                f.write(f"## H{i:02d} ({w['id']})\n\n**{w['title']}** ({w['year']})\n\n")
                f.write(w["abstract"][:900] + "\n\n")
        with open(os.path.join(HERE, "hand_check_rule_codes.json"), "w") as f:
            json.dump(
                [{"n": i, "id": w["id"], "D": bool(rule_d(w["abstract"])), "N": bool(rule_n(w["abstract"]))}
                 for i, w in enumerate(hand, 1)],
                f, indent=2,
            )


if __name__ == "__main__":
    main()
