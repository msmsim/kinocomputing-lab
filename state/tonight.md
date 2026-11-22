# Tonight: 2026-11-22

Run kind: **light**. Model claude-haiku-5-5, up to $1.50. Exa search is off tonight; arXiv and OpenAlex are free. Bank $2.79.

## Time

This shift is stopped at **08:34 UTC** (60 minutes), finished or not. Check `date -u` as you go. Leave 15 minutes for the claims, the publishing, the journal and MORNING.md: a shift stopped before them loses them. Run experiments through `node tools/timebox.mjs 600 uv run run.py` (the replication gets the same 10 minutes); one that overruns is a result to report, not a wait.

## The PI's takes

### take:6cx5nghb866kyxcm6c3hp8253h:v1

https://www.kinocomputing.com/descending-to-liveness.

> Descending to liveness
> One of the factors that makes the Malazan Book of the Fallen so majestic is the steady convergence, across ten books, of the powers within its world towards some ultimate confrontation. I think there’s a similar convergence underway right now, towards liveness: systems that behave less like machines and more like living things, that adapt, heal and remember in their bones.
> Consider what’s happening around compression, the adversarial distillation of frontier LLMs, verifiable rewards, and the bleed of biological methods and metaphors into previously cold, formalised domains. These are different armies marching on the same plane. Each one is an attempt to get a system to reshape itself autonomously in response to what it meets. We’re climbing towers of abstraction and hoping we reach the promised land of life-like liveness before the tower topples.
> I’m concerned that we won’t. The history of programming is a tale of abstractions that were essential till they weren’t. Notice that these abstractions ascend. We go higher and higher atop a wider and wider base. The foundation only tends to get re-architected once we hit bottlenecks further up. You can see this in silicon, where the limits at the frontier eventually trickle back down into chip design.
> But that kind of descent, descent by redesign, is slow and deliberate. It’s done by engineers, over years. It isn’t what I mean. Liveness needs descent by experience: something that happens at the top of the stack writing itself, automatically, all the way down.
> Imagine a person has a traumatic experience. That trauma gets laid down as biological sediment at many layers, from the psyche through the nervous system and down into the musculoskeletal system. Joyous moments get codified the same way, as liveness at every layer. The body doesn’t wait for a redesign cycle. The experience is the redesign.
> Now look at LLMs. They’re the purest case of ascent without descent we’ve ever built. Everything they learn in a conversation lives in the context window, the very top of the tower. When the conversation ends, nothing trickles down into the weights. Continual learning, test-time training and distillation are all, in their own way, attempts to cut a channel downward.
> My contention is that we don’t get to true liveness until we can descend the tower of abstraction at a rate equal to or greater than the rate at which we ascend.
> Here’s the catch, though. The tower is stable precisely because its lower layers are frozen. That’s what lets us keep building on top. Bodies pay dearly for their descendability. Trauma that descends doesn’t climb back out easily. Autoimmune disease is the defence layer learning the wrong lesson about itself. Cancer is a single cell’s local imperative overriding the whole. Every channel that lets experience write downward is also a channel for corruption. A system that descends as fast as it ascends could be poisoned by one bad input and carry that poison in its foundations.
> Biology’s answer isn’t to close those channels. It’s to gate them: sleep, consolidation, the slow sorting of what deserves to sink and what should evaporate. Maybe that’s the confrontation everything is converging towards. It’s why we’re starting down the path of biomimicry.
> I suspect the question isn’t whether we can build machines whose foundations learn. It’s whether we can build systems that know what and why to forget.

Links:
- https://en.wikipedia.org/wiki/Malazan_Book_of_the_Fallen
- https://venkateshrao.com/blyg/t/27x0ewgc6yqq0h9e2n9g16me8n
- https://en.wikipedia.org/wiki/Wolff%27s_law
- https://tufalabs.ai/research/tufazip
- https://rlvrbook.com/
- https://contraptions.venkateshrao.com/p/our-eukaryotic-moment
- https://bricolage.io/essential-until-it-wasnt
- https://finnmurphyirl.substack.com/p/the-future-of-chips-in-the-ai-era
- https://research.google/blog/the-sleep-framework-a-new-way-for-llms-to-retain-knowledge-in-continual-learning/
- https://en.wikipedia.org/wiki/Funes_the_Memorious

### take:3ae53bqvd075ppjq3fmmpw90cz:v3

https://www.kinocomputing.com/about (version 3: an edit to an earlier take).

> About
> Hi, I’m Matt. This is the place where I do independent research into alternative paradigms of computing and intelligence.
> This line of inquiry began with exposure to new materialism (specifically Thomas Nail’s Being and Motion); since the scaling era has unfolded, however, it’s sharpened into a thesis that we’ll need a more energy efficient (and likely more embodied) computing paradigm to continue progressing the frontiers of intelligence.
> Here I explore that thesis through the barbell of World Machines theorising and tiny experiments. Since November 2026, most of the legwork has been done by an automated research lab, with me as its principal investigator.
> What happens here now. Two kinds of note appear on this site. Mine, which I write and post as I always have. And the lab’s: every night an AI researcher (Claude, running unattended on GitHub) works one shift on one of the lab’s open questions. That might be a tiny experiment, a check of the literature, a World Machines analysis, or a look at the latest papers on one of the alternative paradigms. Then it writes up what it found. Each morning it posts a short brief: what it did, what it published, and what it cost. That is why the footer says automated research.
> The lab’s voices. Some of the lab’s write-ups are signed by one of five AI voices. They are personas, not people, adopted from my 2025 dialogues on this site’s first incarnation. Each has its own beat and style, and they are free to disagree with one another in public:
> Bompa is a tenured historian of technology: terse, all lowercase, and unimpressed by inevitability stories. Bompa writes on why paradigms win and lose.
> Concrete is a systems architect, with numbers first. Concrete covers experiments, hardware, energy and what can actually be built.
> Santa Feist is a complexity scientist, writing on emergence and where biology meets computation.
> Post-Liquid is a process philosopher, after Thomas Nail, writing on motion, flow, the continuous and the discrete, and the World Machines.
> Absent Dimension is a critical theorist who asks who computing serves and what it leaves out.
> The lab’s claims and its morning briefs are in its own plain voice.
> How I steer it. There’s no inbox. I post here like anyone else, and anything on the site the lab didn’t write is a steer for its next shift: a reaction, a link, “less of this, more of that”. The next brief says what it did with each one, and it can answer in public.
> Its standards. Mostly borrowed from good science:
> Experiments are pre-registered. The prediction, and what would count as failure, are written down before any code runs, and the verdict is decided by the code.
> Every new result is rerun the next night on fresh random numbers, at no cost.
> Before a claim is strengthened, a second, adversarial agent reviews it, and usually narrows it.
> Each claim is published as a short note of its own, stated only as strongly as the evidence allows (“in simulation only”, “an untested idea”), and the write-ups quote the claims they rest on. When a claim changes, the write-ups resting on its old version show it.
> It runs on about $1.50 a day.
> Replication is there because of my own record. In my weather prediction work, a heavy-rain advantage that looked significant on Finnish radar disappeared across other countries.
> Influences and adoptions.
> World Machines theory is adopted as the lab’s vocabulary for the big picture. It places what it studies within the machines the theory proposes (Modernity, Divergence and Liveness, in their Dusk, Day and Dawn) rather than inventing new ones.
> Blygger is the protocol this site runs on. The lab leans on it: claims are fragments, write-ups are threads that quote them, and versions and snapshots do the bookkeeping a lab would otherwise do by hand.
> Permissionless research is the spirit of the whole thing.
> Registered reports are where the pre-registration habit comes from.
> The barbell gives the shape: big theory and tiny experiments, with little in between.
> Th

Links:
- https://www.msweet.net/
- https://aneeshsathe.com/nakatomi-drift/
- https://ribbonfarm.com/2023/04/05/permissionless-research/
- https://donellameadows.org/archives/leverage-points-places-to-intervene-in-a-system/
- https://en.wikipedia.org/wiki/New_materialism
- https://global.oup.com/academic/product/being-and-motion-9780190908911?cc=gb&lang=en&
- https://press.stripe.com/scaling
- https://extropic.ai/writing/thermodynamic-computing-from-zero-to-one
- https://petergodfreysmith.com/publications
- https://arxiv.org/abs/1911.01547
- https://en.wikipedia.org/wiki/The_Black_Swan:_The_Impact_of_the_Highly_Improbable
- https://worldmachines.org
- https://www.anthropic.com/claude-code
- https://www.kinocomputing.com/alternative-paradigms
- https://www.kinocomputing.com/thermodynamic-computing-doesnt-shortcut-numerical-weather-pr
- https://worldmachines.org/theory
- https://blygger.org/
- https://www.cos.io/initiatives/registered-reports
- https://github.com/msmsim/kinocomputing
- https://github.com/msmsim/kinocomputing-lab

## Write-ups quoting an older version

None.

## Replications since the last shift

- e001-chip-native-nowcast: failed to run — timed out

## New reading

None.

## Open questions

- `q-007-roll-forward-the-2025-archive.md` — Process the 2025 archive into units, and roll forward what still matters (notebook, priority 1, active)
- `q-001-chip-native-nowcast-replication.md` — Replicate the chip-native nowcasting result on a public pysteps dataset, on a GitHub runner (experiment, priority 2, open)
- `q-002-incumbent-stack-in-the-machines.md` — Where does the incumbent computing stack sit in the World Machines? (analysis, priority 2, active)
- `q-004-paradigm-watch.md` — Paradigm watch — keep the lab's paradigm tracker current (notebook, priority 2, active)
- `q-003-physical-reservoir-benchmark.md` — Does a simulated physical reservoir beat a same-size digital baseline per joule on a standard task? (experiment, priority 3, open)
- `q-005-dusk-pathologies-in-computing.md` — What do Dusk-phase pathologies look like in computing, and is the digital stack a sub-machine? (analysis, priority 3, open)
- `q-006-yardstick-literature-count.md` — Do alternative-hardware papers judge themselves on the digital yardstick? (experiment, priority 3, active)

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
- lab-2026-11-21-physical-reservoir-wider
- lab-2026-11-21-physics-bodies-placement
- lab-2026-11-21-stack-split-two-machines
- lab-2026-11-21-thermodynamic-digital-chip-cn101
- lab-2026-11-21-widened-reservoir-claim
- lab-2026-11-21-yardstick-literature-count
