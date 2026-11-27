# Tonight: 2026-11-27

Run kind: **light**. Model claude-sonnet-5-5, up to $2.50. Exa search up to $0.50 (`node tools/search.mjs exa "…"`). Bank $4.70.

## Shift 2 of 2: depth

The day's second shift, for depth (AGENT.md, "Two shifts a day"): start from what the first shift asked of you at the end of today's journal and in `state/last-morning.md`. No rotation tonight.

## Tonight's output

The day publishes **5 to 15 notes** across its shifts, claims included (settle holds back any past 15). 5 went out in today's earlier shift; add what depth earns, not to make up numbers. Use the money: aim to spend most of the $2.50. Each note stands on its own and is worth a stranger's five minutes; AGENT.md, step 3, says how to fill a night.

## Time

This shift is stopped at **09:30 UTC** (60 minutes), finished or not. Check `date -u` as you go. Publish as you go (AGENT.md, step 7): a finished note goes into the outbox at once, with its line in the journal and MORNING.md, so a stop loses only the piece in hand. Stop starting new pieces 10 minutes before the deadline. Run experiments through `node tools/timebox.mjs 600 uv run run.py` (the replication gets the same 10 minutes); one that overruns is a result to report, not a wait.

## Tonight's paradigms

None: `state/paradigms.json` is empty.

## The PI's takes and shares

### share:925-pearl-seals

A share from Subset: a link the PI sent the lab, with their notes and excerpts. Not published; yours to weigh (AGENT.md, step 2).

https://github.com/msmsim/kinocomputing-lab/blob/main/reading/925-pearl-seals.html.

> Shared: The Scale-Intelligence Tradeoff Whether or not you think AI…
> I’d be interested in a measure that evaluates task parallelisation and task scalability on a per paradigm basis, and the unpacked differences.
> Excerpt: “We can measure this in a clean way. An activity is 2x intrinsic scale if it needs to interrupt the human in the loop 1/2 as much, allowing you to run 2 such threads with the same attention. This means it’s doing more routine things that require human design/taste calls half as often. Which means, in a sense it’s operating half as smart. Now it could be that it’s making superintelligent genius decisions on its own, and only interrupting the human for human-level decisions. But thus seems unlikely. If I’m running a swarm to solve the Riemann Hypothesis, which I’m not competent to run at all, it would be weird if it stopped to check on decisions that are within my math abilities. Impedance matching the specific human in the loop, chances are it is doing horizontal scale-out at about the level the human could do or lower. Ie it’s like hundreds or thousands of copies of that particular human’s abilities (within 0.5x-2x say) going relentlessly beyond that human’s stamina limits.”
> Excerpt: “The conclusion from this argument is that the really large-scale orchestration stunts are likely fairly dumb overall. This shouldn’t be surprising. In scaling manufacturing, learning mostly happens early in the ramp. Scaling is when you add energy and bandwidth after the learning tapers.”
> Excerpt: “This makes me think the most interesting uses of AI are likely going to be at relatively small scales. 2-3 Claude Max accounts/human perhaps. You’re pushing the AI harder than someone orchestrating 24. Chances are you’re doing relatively novel things instead of trying to one-shot a GTA6 clone (that would take scale but not much orchestration).”
> Excerpt: “Another way to get at this conclusion is Brook’s Law. Adding humans to a late project delays it, due to the cost of bringing them into the context. Adding agents to a late project actually faces the same dilemma. A huge swarm has a corresponding swarm of local contexts. One way to make it easier us if the agents you’re adding are doing increasingly dumb things that are easy to integrate.”

Links:
- https://venkateshrao.com/blyg/t/6qch4vgkjxkk4t57kwkh0ywbmd

## Write-ups quoting an older version

None.

## Replications since the last shift

None.

## Tonight's regional lens

**the rest of the world.** For each of tonight's paradigms, one more OpenAlex search limited to institutions there (`--country au,nz,ca,br,mx,ar,cl,il,ae,sa,tr,za,ng,eg,ke`): who is doing the work outside the US, and what they have measured (AGENT.md, "Where to look").

## Chatter (leads, not evidence)

None.

## New reading

For q-014:

- Evaluation of Power-Clock Waveforms for Positive Feedback Adiabatic Logic in 16 nm FinFET Technology (2026-09-17) https://arxiv.org/abs/2609.19998v1
- Digital quantum lattice Boltzmann evolution by reversible compute and open-system reset (2026-09-12) https://arxiv.org/abs/2609.13953v1
- Cipher-Structure-Aware Variational Quantum Cryptanalysis: A Reversible Public-Diagnostic Framework (2026-09-01) https://arxiv.org/abs/2609.28493v1

For q-015:

- Cross-chip transfer in quantum photonic neural networks (2026-11-25) https://arxiv.org/abs/2611.34313v1
- Circular Predictive Coding Unlocks Effective Depth (2026-11-20) https://arxiv.org/abs/2611.27610v1
- Sharpness-Aware Muon: Matrix-Aware Optimization with Momentum-Guided Perturbations (2026-10-27) https://arxiv.org/abs/2610.37225v1

For arXiv: Emerging Technologies (unconventional computing):

- MAQR: Lightweight Memory-Aware Q-Routing for Fresh Status Delivery in Multi-Hop IoBNTs (2026-11-24) https://arxiv.org/abs/2611.32661v1
- Net-Gain-Optimized Constellation Shaping for the 5G NR DFT-s-OFDM Uplink: Probabilistic, Geometric, and Joint Designs (2026-11-24) https://arxiv.org/abs/2611.32197v1
- HDMark: Holographic Multi-Bit Model Watermarking for Intellectual Property Protection in Hyperdimensional Computing (2026-11-24) https://arxiv.org/abs/2611.31781v1
- A Self-Organizing Swarm Control Model for Underwater Robots Based on Turing-Type Reaction-Diffusion Principles (2026-11-23) https://arxiv.org/abs/2611.31637v1
- How Small Can a Single Shor Run Be? Limits and Constructions for secp256k1 (2026-11-23) https://arxiv.org/abs/2611.31585v1

For bioRxiv and other preprints: biological computing:

- FOIN: A Federated Multi-Organoid Intelligence Architecture using Combinatorial Graph Modelling (2026-09-10) https://doi.org/10.21203/rs.3.rs-10784696/v1
- Living deep reservoir computing by microfluidic axon routing (2026-08-21) https://doi.org/10.21203/rs.3.rs-10680995/v1
- ProtoNetStack for DNA-Encoded Source Routing and Majority Aggregation in Protocell Molecular Nanonetworks (2026-08-17) https://doi.org/10.64898/2026.08.14.744843

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
- lab-2026-11-27-kinetic-history-of-computing
- lab-2026-11-27-paradigm-dna-molecular
- lab-2026-11-27-paradigm-physical-neural-networks
- lab-2026-11-27-paradigm-physical-reservoir
