# Tonight: 2026-11-27

Run kind: **light**. Model claude-sonnet-5-5, up to $2.50. Exa search up to $0.50 (`node tools/search.mjs exa "…"`). Bank $3.27.

## Shift 2 of 2: depth

The day's second shift, for depth (AGENT.md, "Two shifts a day"): start from what the first shift asked of you at the end of today's journal and in `state/last-morning.md`. No rotation tonight.

## Tonight's output

The day publishes **5 to 15 notes** across its shifts, claims included (settle holds back any past 15). 5 went out in today's earlier shift; add what depth earns, not to make up numbers. Use the money: aim to spend most of the $2.50. Each note stands on its own and is worth a stranger's five minutes; AGENT.md, step 3, says how to fill a night.

## Time

This shift is stopped at **15:58 UTC** (60 minutes), finished or not. Check `date -u` as you go. Publish as you go (AGENT.md, step 7): a finished note goes into the outbox at once, with its line in the journal and MORNING.md, so a stop loses only the piece in hand. Stop starting new pieces 10 minutes before the deadline. Run experiments through `node tools/timebox.mjs 600 uv run run.py` (the replication gets the same 10 minutes); one that overruns is a result to report, not a wait.

## Tonight's paradigms

None: `state/paradigms.json` is empty.

## The PI's takes and shares

None since last night.

## Write-ups quoting an older version

None.

## Replications since the last shift

- e008-attention-ceiling: seed 2, plateau throughput ratio per halving of interruption rate (no integration cost) 1.973,1.988,1.993 (was 1.993,1.968,2.023), agrees
- e009-narma-digital-controls: seed 2, median test NMSE over 10 instances: linear delay line, random features, ESN 0.3416,0.3116,0.138 (was 0.3333,0.2955,0.138), agrees

## Tonight's regional lens

**the rest of the world.** For each of tonight's paradigms, one more OpenAlex search limited to institutions there (`--country au,nz,ca,br,mx,ar,cl,il,ae,sa,tr,za,ng,eg,ke`): who is doing the work outside the US, and what they have measured (AGENT.md, "Where to look").

## Chatter (leads, not evidence)

None.

## New reading

For q-014:

- High-Performance Low-Power Adiabatic Systolic Array Design in Advanced FinFET Nodes (2026-08-30) https://arxiv.org/abs/2608.30058v1

For q-015:

- Optimizing Physical Neural Networks through Device Variable Selection (2026-10-24) https://arxiv.org/abs/2610.33522v1
- Nonlinear Dynamical Systems as Scalable and Efficient Physical Neural Networks (2026-10-15) https://arxiv.org/abs/2610.40471v1
- On physical implementability of reinforcement-learning-driven reasoning (2026-10-09) https://arxiv.org/abs/2610.14131v1

For arXiv: Emerging Technologies (unconventional computing):

- Triage Accuracy of Jev and Open-Weight System One Decision Models and Their Use for Early Emergency Recognition in Symptom-Assessment Applications (2026-11-23) https://arxiv.org/abs/2611.31012v1
- THeatA: Transport- and Heating-aware QEC simulation with Cooling Strategies for QCCD Trapped-Ion Systems (2026-11-23) https://arxiv.org/abs/2611.30676v1
- Pudding: A Retargetable Compiler for Processing-Using-DRAM Systems (2026-11-23) https://arxiv.org/abs/2611.30446v1
- World Models and the Law (2026-11-23) https://arxiv.org/abs/2611.29899v1
- LIELLA: Private Edge Adaptation with Photonic Weight Streams (2026-11-22) https://arxiv.org/abs/2611.29343v1

For bioRxiv and other preprints: biological computing:

- HI-JEPA: A World Model of Molecular Organization Learned from Measured Proximity (2026-08-17) https://doi.org/10.64898/2026.08.14.744901
- A traveling network model predicts emergent dynamics and search behavior from local remodeling in Physarum polycephalum (2026-08-16) https://doi.org/10.64898/2026.08.13.744445
- Allocation pattern of fruiting bodies in plasmodial slime molds, and threshold size for sporulation of Physarum polycephalum (2026-07-09) https://doi.org/10.64898/2026.07.06.736535

## Open questions

- `q-007-roll-forward-the-2025-archive.md` — Process the 2025 archive into units, and roll forward what still matters (notebook, priority 1, active)
- `q-001-chip-native-nowcast-replication.md` — Replicate the chip-native nowcasting result on a public pysteps dataset, on a GitHub runner (experiment, priority 2, open)
- `q-002-incumbent-stack-in-the-machines.md` — Where does the incumbent computing stack sit in the World Machines? (analysis, priority 2, active)
- `q-004-paradigm-watch.md` — Paradigm watch — keep the lab's paradigm tracker current (notebook, priority 2, active)
- `q-010-apocryphal-vulnerabilities.md` — Apocryphal vulnerabilities — which founding stories do the alternative paradigms rest on, and do they hold? (literature, priority 2, active)
- `q-003-physical-reservoir-benchmark.md` — Does a simulated physical reservoir beat a same-size digital baseline per joule on a standard task? (experiment, priority 3, open)
- `q-005-dusk-pathologies-in-computing.md` — What do Dusk-phase pathologies look like in computing, and is the digital stack a sub-machine? (analysis, priority 3, open)
- `q-006-yardstick-literature-count.md` — Do alternative-hardware papers judge themselves on the digital yardstick? (experiment, priority 3, active)
- `q-008-gated-descent-and-forgetting.md` — What gates a learning system's descent, so experience reshapes its foundations without poisoning them? (analysis, priority 3, open)
- `q-011-self-audit.md` — Self-audit — does the lab's own published work hold up when checked again from scratch? (literature, priority 3, active)
- `q-012-reader-questions.md` — Reader questions — is the site an answer to what its readers ask search engines and AI assistants? (notebook, priority 3, active)
- `q-013-coupling-energy-split-test.md` — Does conversion/calibration dominate energy in simulated analog-memory and photonic matrix multiplies, as the coupling note predicts? (experiment, priority 3, open)
- `q-014-adiabatic-ramp-sweep.md` — Where does leakage end the energy gain of slowing a power clock (adiabatic logic)? (experiment, priority 3, open)
- `q-015-wrong-twin-training.md` — Does sharpness-aware training beat ordinary training when a physical network's digital twin is wrong? (experiment, priority 3, open)
- `q-016-per-paradigm-scalability.md` — How many parallel threads can one human run on each paradigm, and what sets the ceiling? (notebook, priority 3, active)
- `q-009-goldleaf-ledger-realism.md` — How common-mode are real somatic mutations in grafted plants? (Goldleaf ledger realism) (notebook, priority 4, open)

## Published notes the lab can update

- lab-2026-11-20-analog-cim-diffusion-noise
- lab-2026-11-20-oscillator-reservoir-claim
- lab-2026-11-20-physical-reservoir-narma10
- lab-2026-11-21-brief
- lab-2026-11-21-chip-native-gap-one-window
- lab-2026-11-21-chip-native-spread-matched
- lab-2026-11-21-chip-native-window-run
- lab-2026-11-21-digital-yardstick-claim
- lab-2026-11-21-incumbent-stack-two-machines
- lab-2026-11-21-paradigm-tracker
- lab-2026-11-21-physical-reservoir-wider
- lab-2026-11-21-physics-bodies-placement
- lab-2026-11-21-stack-split-two-machines
- lab-2026-11-21-thermodynamic-digital-chip-cn101
- lab-2026-11-21-widened-reservoir-claim
- lab-2026-11-21-yardstick-literature-count
- lab-2026-11-22-block-scale-claim
- lab-2026-11-22-brief
- lab-2026-11-23-brief
- lab-2026-11-23-energy-embodiment-hypothesis
- lab-2026-11-23-flash-analog-cim-density
- lab-2026-11-23-goldleaf-copies-copy-mistakes
- lab-2026-11-23-memory-wall-test-failed
- lab-2026-11-23-paradigm-ai-accelerators
- lab-2026-11-23-paradigm-gpus
- lab-2026-11-23-paradigm-von-neumann
- lab-2026-11-24-brief
- lab-2026-11-24-discreteness-is-a-choice
- lab-2026-11-24-grown-or-trained
- lab-2026-11-24-paradigm-symbolic-ai
- lab-2026-11-24-paradigm-transformers-scaling
- lab-2026-11-24-synapse-flash-memory-wall
- lab-2026-11-25-ai-alignment-five-problems
- lab-2026-11-25-brief
- lab-2026-11-25-consensus-machines-parse-limit
- lab-2026-11-25-converter-share-claim
- lab-2026-11-25-converters-dominate-small-arrays
- lab-2026-11-25-coupling-test-photonic-analog
- lab-2026-11-25-optical-neural-net-energy-claim-audit
- lab-2026-11-25-paradigm-analog-in-memory
- lab-2026-11-25-paradigm-connectionism
- lab-2026-11-25-paradigm-photonic
- lab-2026-11-26-analog-chips-digital-survivors
- lab-2026-11-26-brain-chatbot-landauer-gap
- lab-2026-11-26-brief
- lab-2026-11-26-dragoman-monopoly-ai-translation
- lab-2026-11-26-landauer-gap-match-soft-claim
- lab-2026-11-26-organoid-computing-reading-the-answer
- lab-2026-11-26-paradigm-quantum
- lab-2026-11-26-paradigm-reversible
- lab-2026-11-26-paradigm-thermodynamic
- lab-2026-11-26-regenerable-software-hot-state
- lab-2026-11-26-un-0-oscillator-image-generator
- lab-2026-11-27-analog-digital-arbitrage-sketch
- lab-2026-11-27-brief
- lab-2026-11-27-edge-of-chaos-claim
- lab-2026-11-27-how-many-threads-can-one-human-run
- lab-2026-11-27-kinetic-history-of-computing
- lab-2026-11-27-narma-10-linear-control-claim
- lab-2026-11-27-narma-10-linear-model-beats-chip
- lab-2026-11-27-paradigm-dna-molecular
- lab-2026-11-27-paradigm-physical-neural-networks
- lab-2026-11-27-paradigm-physical-reservoir
- lab-2026-11-27-reservoir-edge-of-chaos-overstretched
