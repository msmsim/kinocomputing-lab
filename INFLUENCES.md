# Influences

What the lab and kinocomputing were built from: the ideas, and where each
one shows up. Read it before changing how the lab works, so a change keeps
faith with why things are the way they are, or says which idea it leaves
behind. Add to it when something new shapes the build.

## Where it started

- **The PI's note on the research agent** —
  [msweet.net/notes/181-fern-cranes](https://www.msweet.net/notes/181-fern-cranes).
  The brief: turn kinocomputing into a fully automated blyg, with a research
  agent, a protocol for agentic research, World Machines theory, software
  factorisation and night-shift management. Most of the links below come
  from it.
- **The Blygger protocol** — Rao, Sathe and Mathews,
  ["Introducing the Blygger Protocol"](https://protocolized.summerofprotocols.com/p/introducing-the-blygger-protocol)
  (Nov 2026), and the [spec](https://blygger.org/). A blyg on its own domain,
  read and written through RSS and Webmentions. The lab's notebook and its
  venue are one thing: claims are fragments, write-ups are threads that quote
  them, and the protocol's quoting and staleness do the bookkeeping
  (`APPROACH.md`, "Decisions taken").
- **Permissionless research** — Venkatesh Rao,
  ["Permissionless Research"](https://ribbonfarm.com/2023/04/05/permissionless-research/)
  (2023), and the PI's
  ["Permissionless researching"](https://swellandcut.com/2023/12/07/permissionless-researching/)
  (2023), on when a research kit becomes a protocol: many contributors,
  shared knowledge, sustained over time. Why the lab steers by the PI's posts
  and shares rather than by assignments, and publishes as it goes.
- **World Machines** — [worldmachines.org/theory](https://worldmachines.org/theory).
  "Sensemaking triage and a shared conceptual language": the vocabulary the
  lab places its analyses in, not a machine generator.

## How it works at night

- **The night shift** — Jamon Holmgren,
  ["The 'Night Shift' Agentic Workflow"](https://jamon.dev/night-shift)
  (Mar 2026). "I will take the day shift, and AI agents will take the night
  shift": specs by day, agents through the night, review in the morning, and
  tests and strict validation as what makes it safe. The lab's shifts,
  `MORNING.md`, and the brief.
- **Humboldt's status log** —
  [Protocol-Institute/humboldt, status.md](https://github.com/Protocol-Institute/humboldt/blob/main/status.md).
  A research agent's activity log, one entry per session, most recent first.
  The lab's journal and its morning report.
- **Places to intervene in a system** — Donella Meadows,
  ["Leverage Points"](https://donellameadows.org/archives/leverage-points-places-to-intervene-in-a-system/).
  "Parameters are dead last": the PI steers the lab through its rules, goals
  and questions (`CHARTER.md`, `AGENT.md`), not by turning knobs.

## How it stays honest

- **Registered reports** — Center for Open Science,
  [Registered Reports](https://www.cos.io/initiatives/registered-reports).
  Peer review before results are known. Every experiment's `PLAN.md` is
  written before any code: prediction, threshold and kill condition
  (`CHARTER.md`).
- **Physics, audited by machine** — Casey Handmer,
  [science.caseyhandmer.com/physics](https://science.caseyhandmer.com/physics/).
  An AI audit of a field's papers that found errors copied from paper to
  paper: "A field outgrows its errors. It rarely corrects them." The lab's
  self-audit, which re-checks its own oldest notes in public.
- **Apocryphal vulnerabilities** — the PI's
  [164-crimson-kites](https://www.msweet.net/notes/164-crimson-kites). Fields
  that rest on a founding anecdote, quotation or statistic. The foundations
  audit, which traces them to their sources.
- **Theories as postulates** — Jeff Shrager,
  [CogLean](https://github.com/jeffshrager/CogLean). Cognitive theory in Lean 4,
  "theories as postulates, phenomena as checked theorems": the direction for
  formally checking the lab's conjectures.

## How it's built and tested

- **The software factory** — Justin McCarthy, StrongDM,
  ["Software Factories And The Agentic Moment"](https://factory.strongdm.ai/)
  (Feb 2026). Specs and scenarios drive agents that write the code, validated
  against behavioural twins of the services they touch. The lab and site are
  built the same way: the intent is written down (`CHARTER.md`, `AGENT.md`,
  `docs/blyg.md`), and the checks hold the code to it. The site's tests run
  the real pipeline in a twin of itself (`test/twin.mjs`), in the same spirit.
- **Oracles** — Kyle Mathews,
  ["TanStack DB 1.0 RC1: Going All In on Oracles"](https://tanstack.com/blog/tanstack-db-1.0-rc1-going-all-in-on-oracles)
  (Oct 2026). "An isolated test preserves an answer. An oracle preserves the
  understanding that produces the answers." The site's reference model and
  generated histories (`test/model.mjs`, `test/oracle.test.mjs`), its
  differential test against msn, and both repositories' mutants, which check
  that the tests would catch each rule being broken.
- **Discovery as delivery** — the PI's
  [144-coral-toads](https://www.msweet.net/notes/144-coral-toads). Constraints
  as executables, candidates generated cheaply, evaluations to select:
  assurance as the selection pressure, not a phase after the build.
- **TigerStyle** — TigerBeetle, [tigerstyle.dev](https://tigerstyle.dev/).
  Safety, then performance, then experience. "Put a limit on everything
  because everything has a limit": the shift's dollar cap and clock, the
  experiments' timebox, the mutants' time cap. Programs that check themselves
  and stop when something is wrong: settle fails the run, red, when it fails,
  rather than leaving half a night unreported. Isolation over shared state:
  each mutant runs in its own copy of the code, never in the source.
- **Find the constraint, then fix that** — Will Larson,
  ["Shipping 100+ PRs to production in a week"](https://lethain.com/passing-100-prs-in-a-week)
  (Nov 2026). Speed comes from finding the step that's currently the
  bottleneck and fixing it, then the next. CI and release first; context in
  the repository, where an agent can read it; verification an agent produces
  alongside its change. The tests were sped up this way: measured first, then
  the slowest step fixed (`README.md`, "Tests").

## What it publishes with

- **Subset** — [subset.network](https://www.subset.network/docs). How the PI
  shares links into the lab, with notes and excerpts (`README.md`, "Shares
  from Subset").
- **Pele** — [pele.run](https://pele.run/), and [Temml](https://temml.org/) for
  maths: figures and notation in the notes, in the house style.

## Looked at, not adopted

- **ToolUniverse** — [aiscientist.tools](https://aiscientist.tools/). Mostly
  biomedical; the lab's literature search is covered by free sources
  (`APPROACH.md`, "Decisions taken").
