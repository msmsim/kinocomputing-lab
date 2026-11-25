# Tonight: 2026-11-25

Run kind: **light**. Model claude-sonnet-5-5, up to $0.80. Exa search up to $0.40 (`node tools/search.mjs exa "…"`). Bank $5.56.

## Shift 1 of 2: breadth

The day's first shift: tonight's paradigms, units from the archive, takes, and the day's floor of notes. A second, deeper shift follows; end your journal entry with what it should take up (AGENT.md, "Two shifts a day").

## Tonight's output

The day publishes **5 to 15 notes** across its shifts, claims included (settle holds back any past 15). Reach the 5 yourself. Use the money: aim to spend most of the $0.80. Each note stands on its own and is worth a stranger's five minutes; AGENT.md, step 3, says how to fill a night.

## Time

This shift is stopped at **03:23 UTC** (60 minutes), finished or not. Check `date -u` as you go. Publish as you go (AGENT.md, step 7): a finished note goes into the outbox at once, with its line in the journal and MORNING.md, so a stop loses only the piece in hand. Stop starting new pieces 10 minutes before the deadline. Run experiments through `node tools/timebox.mjs 600 uv run run.py` (the replication gets the same 10 minutes); one that overruns is a result to report, not a wait.

## Tonight's paradigms

The rotation (AGENT.md, "The paradigm rotation") brings these round tonight, so that every paradigm on the tracker is looked at every 14 days:

- **Connectionism and deep learning** (`connectionism`, The incumbent stack): never looked at: a first pass, from the round-up's entry; no note yet, so this is its first.
- **Analog in-memory computing** (`analog-in-memory`, Let physics compute): never looked at: a first pass, from the round-up's entry; no note yet, so this is its first.
- **Photonic / optical computing** (`photonic`, Let physics compute): never looked at: a first pass, from the round-up's entry; no note yet, so this is its first.

## The PI's takes

### take:1q54gw7wkq7369dx6vcnzymek1:v1

https://www.kinocomputing.com/coupling-reality-to-paradigms.

> Coupling reality to paradigms
> Every computing paradigm sits in one of four coupling states relative to the physics that carries it: sheared, weakly coupled, strongly coupled or fully integrated. A paradigm may also re-shear, rebuilding a clean abstraction on top of a coupled substrate. The coupling state largely fixes the paradigm’s energy profile: which cost dominates its baseline, and how far that baseline sits above physical limits.
> Coupling means how far a full description of the computation depends on the substrate’s own dynamics. At one extreme the substrate doesn’t matter. At the other, the computation can’t be described without it.
> The four states are as follows:
> Sheared: the physics carries an abstraction that ignores it. Example: CMOS digital logic.
> Weakly coupled: the physics is chosen for efficiency, but the computation stays abstract. Example: neuromorphic chips.
> Strongly coupled: the physics performs the operation, and its noise becomes part of the computation. Example: analog in-memory multiplication.
> Fully integrated: the computation can’t be separated from the system running it. Examples: quantum circuits, wetware.
> Re-shearing is not a fifth point on this scale. It is a direction of travel that can start from any coupled state: the paradigm keeps its physical advantage but pays part of the abstraction cost again. Quantum error correction and calibrated analog are examples. The opposite movement is falling, a loss of abstraction, as in decoherence or noise creeping back into ever-smaller digital devices.
> Assigning a state
> A state is assigned by a portability test: try to move the computation to a different substrate, and see what that costs.
> Sheared: it moves unchanged and works the same.
> Weakly coupled: it moves unchanged, but loses efficiency.
> Strongly coupled: it moves only after retraining or recalibrating against the new device’s physics.
> Fully integrated: moving it isn’t meaningful, because the computation is the system’s own dynamics.
> A paradigm re-shears if it adds a layer, such as error correction or digital calibration, whose job is to pass a stricter version of this test. Where the result depends on how a paradigm is implemented, it gets a range rather than a single state.
> Energy profile
> Energy per useful operation splits into three terms:
> Operation cost, set by physics. At room temperature the Landauer floor is about 2.9 × 10⁻²¹ J per bit erased.
> Abstraction cost, the price of hiding the physics: noise margins, restoring logic, data movement, error correction.
> Regime cost, the price of holding the substrate in the physical regime it needs: cooling, calibration, signal conversion, isolation, metabolism.
> The coupling state predicts which term dominates:
> Sheared: abstraction dominates. Baselines sit many orders of magnitude above Landauer, but are predictable and scale well.
> Weakly coupled: abstraction cost is reduced. The regime is sometimes expensive, as with cryogenics.
> Strongly coupled: regime dominates, mainly conversion and calibration. Cost per operation is low, but precision is limited.
> Fully integrated with a self-maintained regime: operation dominates. These systems show the lowest whole-system costs observed: a human brain runs on roughly 20 W. That is a whole-system figure, not energy per operation, so it suggests the per-operation advantage rather than measuring it.
> Fully integrated with an externally forced regime: regime dominates (cooling, control, error correction). These are the highest costs per operation today.
> So the prediction is not a straight line from sheared to integrated. Baselines fall as coupling rises, until the regime has to be forced from outside. Fully integrated systems therefore appear at both extremes. What separates them is whether the system maintains its own regime.
> The energy claims are qualitative until each paradigm has measured per-operation figures split into the three terms.
> Provisional mapping
> The Kinocomputing tracker lists 32 entries. Thirty-one are parad

Links:
- https://kinocomputing.com/tracker

## Write-ups quoting an older version

None.

## Replications since the last shift

None.

## New reading

For q-004:

- Interface and film engineering for improved spin-charge interconversion in sputtered GeTe nanodevices (2026-11-24) https://arxiv.org/abs/2611.31816v1
- Analog Explorations of Quantum State Measurement (2026-11-19) https://arxiv.org/abs/2611.26889v1

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
