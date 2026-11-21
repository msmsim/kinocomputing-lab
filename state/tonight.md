# Tonight: 2026-11-21

Run kind: **light**. Model claude-haiku-5-5, up to $1.50. Exa search is off tonight; arXiv and OpenAlex are free. Bank $3.00.

## Where this shift runs

On the operator's machine (Darwin x86_64), not a GitHub runner, in Claude Code's sandbox: shell commands can write only inside this repository and reach only these hosts: pypi.org, files.pythonhosted.org, export.arxiv.org, arxiv.org, api.openalex.org, github.com, codeload.github.com, raw.githubusercontent.com, objects.githubusercontent.com, zenodo.org, huggingface.co, www.kinocomputing.com, kinocomputing.com, worldmachines.org, blyg.worldmachines.org. A blocked host is the sandbox's choice; say so in the journal and work around it only with what's allowed. Known on this machine: uv can't build pysteps (it ships as source only and Apple's clang has no OpenMP), so the lab's replication of a pysteps experiment can't run here; it can on the Linux GitHub runner.

## Time

This shift is stopped at **04:15 UTC** (60 minutes), finished or not. Check `date -u` as you go. Leave 15 minutes for the claims, the publishing, the journal and MORNING.md: a shift stopped before them loses them. Run experiments through `node tools/timebox.mjs 600 uv run run.py` (the replication gets the same 10 minutes); one that overruns is a result to report, not a wait.

## The PI's takes

None since last night.

## Write-ups quoting an older version

None.

## Replications since the last shift

None.

## New reading

None.

## Open questions

- `q-001-chip-native-nowcast-replication.md` — Replicate the chip-native nowcasting result on a public pysteps dataset, on a GitHub runner (experiment, priority 1, open)
- `q-002-incumbent-stack-in-the-machines.md` — Where does the incumbent computing stack sit in the World Machines? (analysis, priority 2, active)
- `q-003-physical-reservoir-benchmark.md` — Does a simulated physical reservoir beat a same-size digital baseline per joule on a standard task? (experiment, priority 3, open)
- `q-005-dusk-pathologies-in-computing.md` — What do Dusk-phase pathologies look like in computing, and is the digital stack a sub-machine? (analysis, priority 3, open)
- `q-006-yardstick-literature-count.md` — Do alternative-hardware papers judge themselves on the digital yardstick? (experiment, priority 3, open)
- `q-004-paradigm-watch.md` — Paradigm watch — keep the alternatives' "latest" current (notebook, priority 4, open)

## Published notes the lab can update

- lab-2026-11-20-analog-cim-diffusion-noise
- lab-2026-11-20-oscillator-reservoir-claim
- lab-2026-11-20-physical-reservoir-narma10
- lab-2026-11-21-chip-native-gap-one-window
- lab-2026-11-21-chip-native-window-run
- lab-2026-11-21-chip-nowcast-too-big-for-a-timebox
- lab-2026-11-21-incumbent-stack-two-machines
- lab-2026-11-21-physical-reservoir-wider
- lab-2026-11-21-physics-bodies-placement
- lab-2026-11-21-stack-split-two-machines
- lab-2026-11-21-widened-reservoir-claim
