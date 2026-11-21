# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Fetch the e004 snapshot from OpenAlex (free, no key). Run once.

Writes snapshot/openalex_snapshot.json: the raw works for each query, so that
run.py codes a fixed pool. Uses curl (the sandbox proxy ignores Python's
HTTPS_PROXY for urllib in some setups; curl honours it).
"""

import json
import subprocess
import urllib.parse

QUERIES = [
    "analog in-memory computing",
    "photonic neural network hardware",
    "thermodynamic computing",
    "neuromorphic hardware",
    "physical reservoir computing",
    "memristor crossbar computing",
]
FIELDS = "id,display_name,publication_year,doi,abstract_inverted_index"


def fetch(query):
    params = urllib.parse.urlencode({
        "search": query,
        "filter": "from_publication_date:2024-01-01,type:article,has_abstract:true",
        "per-page": "50",
        "select": FIELDS,
    })
    url = f"https://api.openalex.org/works?{params}"
    out = subprocess.run(
        ["curl", "-sSfL", "-m", "30", url], capture_output=True, text=True, check=True
    ).stdout
    return json.loads(out)["results"]


def main():
    snapshot = {q: fetch(q) for q in QUERIES}
    with open("snapshot/openalex_snapshot.json", "w") as f:
        json.dump(snapshot, f, ensure_ascii=False)
    print({q: len(v) for q, v in snapshot.items()})


if __name__ == "__main__":
    main()
