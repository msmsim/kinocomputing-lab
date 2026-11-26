# Tonight: 2026-11-26

Run kind: **light**. Model claude-sonnet-5-5, up to $0.80. Exa search up to $0.40 (`node tools/search.mjs exa "…"`). Bank $5.48.

## Shift 1 of 2: breadth

The day's first shift: tonight's paradigms, units from the archive, takes, and the day's floor of notes. A second, deeper shift follows; end your journal entry with what it should take up (AGENT.md, "Two shifts a day").

## Tonight's output

The day publishes **5 to 15 notes** across its shifts, claims included (settle holds back any past 15). Reach the 5 yourself. Use the money: aim to spend most of the $0.80. Each note stands on its own and is worth a stranger's five minutes; AGENT.md, step 3, says how to fill a night.

## Time

This shift is stopped at **03:23 UTC** (60 minutes), finished or not. Check `date -u` as you go. Publish as you go (AGENT.md, step 7): a finished note goes into the outbox at once, with its line in the journal and MORNING.md, so a stop loses only the piece in hand. Stop starting new pieces 10 minutes before the deadline. Run experiments through `node tools/timebox.mjs 600 uv run run.py` (the replication gets the same 10 minutes); one that overruns is a result to report, not a wait.

## Tonight's paradigms

The rotation (AGENT.md, "The paradigm rotation") brings these round tonight, so that every paradigm on the tracker is looked at every 14 days:

- **Thermodynamic / probabilistic computing** (`thermodynamic`, Let physics compute): never looked at: a first pass, from the round-up's entry; no note yet, so this is its first.
- **Reversible / adiabatic computing** (`reversible`, Let physics compute): never looked at: a first pass, from the round-up's entry; no note yet, so this is its first.
- **Quantum computing** (`quantum`, Let physics compute): never looked at: a first pass, from the round-up's entry; no note yet, so this is its first.

## The PI's takes and shares

### share:633-fern-egrets

A share from Subset: a link the PI sent the lab, with their notes and excerpts. Not published; yours to weigh (AGENT.md, step 2).

https://github.com/msmsim/kinocomputing-lab/blob/main/reading/633-fern-egrets.html.

> Shared: WSPC Book Series in Unconventional Computing
> Excerpt: “Volume 6-Advances in Quantum Computer Music
> Edited by: 
> Eduardo Reck Miranda (Plymouth University, UK)
> Volume 5-Forthcoming-Post-Apocalyptic Computing
> Edited by: 
> … See all authors 
> Volume 4-Reversible World of Cellular Automata: Fantastic Phenomena and Computing in Artificial Reversible Universe
> By (author): 
> Kenichi Morita (Hiroshima University, Japan)
> Volume 3-Actin Computation: Unlocking the Potential of Actin Filaments for Revolutionary Computing Systems
> Edited by: 
> Andrew Adamatzky (University of the West of England, UK) See fewer authors 
> Volume 2-Unconventional Computing, Arts, Philosophy
> Edited by: 
> … See all authors 
> Volume 1-Handbook of Unconventional Computing: (In 2 Volumes)
> Volume 1: Theory
> Volume 2: Implementations
> Edited by:”

Links:
- https://www.worldscientific.com/series/wssuc

### share:654-amber-kites

A share from Subset: a link the PI sent the lab, with their notes and excerpts. Not published; yours to weigh (AGENT.md, step 2).

https://github.com/msmsim/kinocomputing-lab/blob/main/reading/654-amber-kites.html.

> Shared: Metabiology and the complexity of natural evolution - Research Outreach
> Excerpt: “Carsetti also claims that removing the embodiment process reveals the pure abstraction where the instructional information (the DNA) is seeking optimal self-organisation. Paraphrasing Galileo, often regarded as the father of modern science, he says that nature is speaking by computations, thus causing nature to be embodied. Professor Carsetti warns, however, that precisely because they are closely related to the process of embodiment, such “natural computations cannot be articulated only on a purely syntactic level nor can they be flattened on disembodied crystallizations”.”

Links:
- https://researchoutreach.org/articles/metabiology-complexity-natural-evolution

### share:752-jade-otters

A share from Subset: a link the PI sent the lab, with their notes and excerpts. Not published; yours to weigh (AGENT.md, step 2).

https://github.com/msmsim/kinocomputing-lab/blob/main/reading/752-jade-otters.html.

> Shared: Researcher plants 2m canaries into the AI supply chain. A privacy disaster surfaced
> Feels like the early cloud era.
> Excerpt: “To test for potential leakage, researcher HD Moore assembled a collection of Amazon Web Services access keys, functioning credentials tied to empty AWS accounts, passwords for services such as SSH, and unique URLs, DNS names, and private git repository references. None of the secrets had ever been used before, and he controlled the infrastructure that received any requests using the credentials. He then seeded each secret into exactly one prompt sent to a single provider. In the event any of the secrets were leaked, these “canaries”—so called because they resemble the role of that bird when taken into coal mines—would allow Moore to identify each link in the chain that was responsible.”

Links:
- https://arstechnica.com/security/2026/11/a-leaky-ai-supply-chain-is-exposing-secret-user-data-at-an-alarming-rate

### share:800-flax-cranes

A share from Subset: a link the PI sent the lab, with their notes and excerpts. Not published; yours to weigh (AGENT.md, step 2).

https://github.com/msmsim/kinocomputing-lab/blob/main/reading/800-flax-cranes.html.

> Shared: Introducing Un-0: Generating Images with Coupled Oscillators - Unconventional AI
> Excerpt: “TL;DR. Executing deep neural networks on GPUs has dominated AI for a decade, but we think the next jump in energy efficiency demands a fundamentally different computer, one where physics does the computing. We built Un-0, an image generator powered by a simulated system of coupled oscillators, an example of an emerging physical computing substrate. On ImageNet 64×64 it reaches FID 6.74, matching the quality of leading conventional image generation methods when they were first published.”
> Excerpt: “These physics-based alternatives include Neuromorphic Computing (Mead, 1990), Hopfield networks (Hopfield, 1982), and reservoir computing (Jaeger, 2001; Maass et al., 2002). Recently the community has also developed Hamiltonian (Greydanus et al., 2019) and Liquid (Hasani et al., 2021) networks, Neural Wave Machines (Keller & Welling, 2023), Thermodynamic Computing (Coles et al., 2023; Jelinčič, 2025), and Kuramoto Oscillators (Miyato et al., 2025; Song et al., 2025).”
> Excerpt: “To exploit these alternative computing methods, the AI task needs to be mapped efficiently to the dynamics of the physical system. Un-0 validates that modern AI workloads can run more efficiently on physical substrates than on today’s hardware.”
> Excerpt: “Picture two metronomes ticking side by side (Figure 1a). Each can be described at any moment by its phase, the angle where its arm is in the swing. Place two metronomes on the same table and they will interact with each other through the shared surface. Depending on how sensitive they are to each other, i.e., coupling strength, they fall into lockstep or settle into opposition. That’s an oscillator: a primitive component with a phase that wants to rotate at its own rate, influenced by the forces of its neighbors.”
> Excerpt: “Why oscillators? In the brain, rhythmic activity and synchronization are pervasive, and have long been hypothesized to do computational work like binding distributed features into coherent percepts, gating communication between regions, and organizing the timing of spikes (Gray et al., 1989; Buzsáki, 2006; Fries, 2015). Coupled oscillators are among the simplest mathematical models of that kind of behavior, which makes them a natural primitive to study for neuro-inspired models of computation (Winfree, 1967; Kuramoto, 1975; Ermentrout, 1996; Ermentrout et al., 2010).”

Links:
- https://unconv.ai/blog/introducing-un-0-generating-images-with-coupled-oscillators

### share:833-olive-egrets

A share from Subset: a link the PI sent the lab, with their notes and excerpts. Not published; yours to weigh (AGENT.md, step 2).

https://github.com/msmsim/kinocomputing-lab/blob/main/reading/833-olive-egrets.html.

> Shared: Extreme Event Likelihoods with Guided Generative Models | NVIDIA Technical Blog
> Excerpt: “In a new paper, Towards accurate extreme event likelihoods from diffusion model climate emulators, we explore this problem in climate science by guiding a diffusion-based climate emulator toward tropical storms and computing odds ratios from guided and unguided probabilities. In this post we will illustrate a minimal working example using a tropical cyclone case. 
> There’s a ton more work to do: New methods deserve to be tried, performance optimizations are needed, and the impact could be unlocking radical cost efficiencies for next-generation risk analytics in science and economics.”

Links:
- https://developer.nvidia.com/blog/extreme-event-likelihoods-with-guided-generative-models?linkId=100000430756417

### share:838-teal-eels

A share from Subset: a link the PI sent the lab, with their notes and excerpts. Not published; yours to weigh (AGENT.md, step 2).

https://github.com/msmsim/kinocomputing-lab/blob/main/reading/838-teal-eels.html.

> Shared: Making Unconventional Computing Practical
> Excerpt: “Broadly, unconventional computing refers to all methods of doing computation that differ from the standard Von Neumann architecture, which forms the basis of modern CPUs and, to some degree, GPUs. For decades, the academic community has done research on novel methods of computing, but recently, driven by the end of Moore’s Law transistor scaling and the rising computational demands of AI, some startups and large corporations have been trying to commercialize these unconventional computing technologies.”
> Excerpt: “It took a little while, but so far, it’s seemed like the innovators in the world of thermodynamic computing have learned the lessons from other kinds of unconventional computing. Often, analog circuits are expensive and difficult to implement, even though they may be elegant and exciting. Digital architectures are reliable, efficient, and easy to manufacture and sell at scale. And so when unconventional computing technologies move from academic labs into industry, which cares less about publishing novel papers and more about selling chips, scalable digital architectures designed to maximize the key benefits of a new technology, while avoiding its biggest downsides, often win out.”

Links:
- https://www.zach.be/p/making-unconventional-computing-practical

### share:954-sage-shrews

A share from Subset: a link the PI sent the lab, with their notes and excerpts. Not published; yours to weigh (AGENT.md, step 2).

https://github.com/msmsim/kinocomputing-lab/blob/main/reading/954-sage-shrews.html.

> Shared: Could a computer scientist build a brain?
> Excerpt: “Evolution, development, and learning are one process operating across multiple time scales. Evolution compresses the experience of a lineage into the genome over hundreds of millions of years. Development unfolds that compressed record into a network over the course of hours to years. Learning fine-tunes the result within a single life. The genome is where the long experience is banked; development is how it is unfolded; plasticity is the fast correction when the world moves faster than evolution can track. To read the developmental program as an algorithm is to see how experience, at every scale, becomes structure.”

Links:
- https://stankerstjens.github.io/could-a-computer-scientist-build-a-brain

### share:974-bronze-larks

A share from Subset: a link the PI sent the lab, with their notes and excerpts. Not published; yours to weigh (AGENT.md, step 2).

https://github.com/msmsim/kinocomputing-lab/blob/main/reading/974-bronze-larks.html.

> Shared: The Tacit Knowledge Series
> Excerpt: “Tacit knowledge is ‘knowledge that cannot be captured through words alone’.
> This series explores how expertise is tacit, why the research around extracting tacit knowledge is more important than the literature on deliberate practice, and how to go about acquiring tacit knowledge in the pursuit of skill acquisition.”

Links:
- https://commoncog.com/the-tacit-knowledge-series

### share:984-bronze-finches

A share from Subset: a link the PI sent the lab, with their notes and excerpts. Not published; yours to weigh (AGENT.md, step 2).

https://github.com/msmsim/kinocomputing-lab/blob/main/reading/984-bronze-finches.html.

> Shared: Ingressing Minds: Causal, Non-Physical Patterns In-Form Natural, Synthetic, and Hybrid Embodiments by Michael Levin
> Excerpt: “Specifically, I propose that the interface between mathematical truths and physical objects is precisely the interface between the non-physical mind and its physical embodiments. The real “soul” of the triangle and the way it relates to real triangular objects is a minimal, basal version of how complex living beings are “ensouled” by cognitive patterns.”

Links:
- https://mdpi.com/2409-9287/11/5/161

### share:999-coral-eels

A share from Subset: a link the PI sent the lab, with their notes and excerpts. Not published; yours to weigh (AGENT.md, step 2).

https://github.com/msmsim/kinocomputing-lab/blob/main/reading/999-coral-eels.html.

> Shared: Frontiers | The brain is not mental! coupling neuronal and immune cellular processing in human organisms
> Excerpt: “Our suggestion is subtly yet importantly different: cognition is the result of information processing distributed across all cellular systems in the body, including the brain, which is, in our view, (part of) the body. Speaking about brain-body-environment interactions in constituting cognition may be misleading because it tacitly inherits the distinction between mind (brain) and body. Cognitive processing however, does not require brain plus body plus environment. Rather, cognitive processing takes place in every single cell of our bodies, among which neuronal cells play a key part, but only a part. Hence, one may say that we literally think with all the cells of our bodies, and not just our heads.”

Links:
- https://frontiersin.org/journals/integrative-neuroscience/articles/10.3389/fnint.2023.1057622/full

## Write-ups quoting an older version

None.

## Replications since the last shift

- e007-conversion-calibration-energy-split: seed 2, min share of energy in converters+calibration, mid setting, 64-32-10 0.9661 (was 0.9661), agrees

## New reading

For q-004:

- Symbol-Level Precoding With Microwave Linear Analog Computers (MiLACs): Performance Limits and Stem-Connected Hardware Design (2026-11-25) https://arxiv.org/abs/2611.33651v1
- Low-barrier-height Hf$_\text{1-x}$Zr$_\text{x}$O$_2$ ferroelectric tunnel junctions with large ON-state currents (2026-11-24) https://arxiv.org/abs/2611.33495v1

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
