# Influences

Where the lab's autonomy comes from: the ideas behind letting agents do the
research, write the code and check it, with a person steering from outside.
Read it before changing how the lab works, so a change keeps faith with these
or says which one it leaves behind. Add to it when something new shapes the
build.

The PI's note [181-fern-cranes](https://www.msweet.net/notes/181-fern-cranes)
set the brief: turn kinocomputing into a fully automated blyg, with a
research agent, a protocol for agentic research, World Machines theory,
software factorisation and night-shift management. Most of what follows
came from it.

## 1. People write intent; agents write and check the code

- **The software factory** — Justin McCarthy, StrongDM,
  ["Software Factories And The Agentic Moment"](https://factory.strongdm.ai/)
  (Feb 2026), and its [techniques](https://factory.strongdm.ai/techniques/filesystem).
  Two rules: code is not written by people, and code is not reviewed by
  people. Specs and *scenarios* drive the agents; scenarios are kept outside
  the codebase, like a holdout set in model training, so the code can't be
  shaped to pass them; and what's judged is whether the scenarios are
  satisfied, not whether a diff looks right.
  *Here:* the PI writes intent (`CHARTER.md`, `AGENT.md`, the questions, takes
  and shares) and reads outcomes (the brief, the notes, `MORNING.md`), not
  diffs. Claude writes the lab and the site and their checks. The site's
  Blygger build was held to scenarios written before the code and kept out of
  the repository during the hackathon.
- **Oracles** — Kyle Mathews,
  ["TanStack DB 1.0 RC1: Going All In on Oracles"](https://tanstack.com/blog/tanstack-db-1.0-rc1-going-all-in-on-oracles)
  (Oct 2026). "An isolated test preserves an answer. An oracle preserves the
  understanding that produces the answers." An independent reference model,
  generated histories checked against it, and agents fixing what it finds.
  *Here:* the site's reference model and generated publishing histories
  (`test/model.mjs`, `test/oracle.test.mjs`), its differential test against
  msn, its twin of its own pipeline (`test/twin.mjs`).
- **Checking the checkers.** If no person reads the code, the tests are the
  only reader, so they must be shown to work: both repositories' mutants
  break each rule in turn and require a test to fail (`npm run mutants`). A
  rule without a mutant is a rule nobody has shown is checked. With every
  push, the mutants near the change run (`--since`); every one runs weekly.
- **Discovery as delivery** — the PI's
  [144-coral-toads](https://www.msweet.net/notes/144-coral-toads). Constraints
  as executables, candidates generated cheaply, evaluations to select:
  assurance as the selection pressure, not a phase after the build.

## 2. Agents work while people don't

- **The night shift** — Jamon Holmgren,
  ["The 'Night Shift' Agentic Workflow"](https://jamon.dev/night-shift)
  (Mar 2026). "I will take the day shift, and AI agents will take the night
  shift": specs by day, agents overnight, review in the morning, with tests
  and strict validation as what makes it safe to sleep.
  *Here:* two shifts a night, `MORNING.md`, and the brief a few hours later.
- **A research agent's log** — Protocol Institute's
  [Humboldt status.md](https://github.com/Protocol-Institute/humboldt/blob/main/status.md):
  one entry per session, most recent first, the funnel from triage to
  findings in the open. *Here:* the journal, and the brief's account of each
  shift.
- **The agent can't change its judges.** The researcher works in a checkout
  whose machinery is put back as committed before settle runs
  (`tools/restore-machinery.sh`); it never holds a push credential; settle,
  which it doesn't control, decides what publishes. Autonomy over the work,
  none over the rules that judge it.

## 3. A person steers by posting, not by managing

- **Permissionless research** — Venkatesh Rao,
  ["Permissionless Research"](https://ribbonfarm.com/2023/04/05/permissionless-research/)
  (2023), and the PI's
  ["Permissionless researching"](https://swellandcut.com/2023/12/07/permissionless-researching/)
  (2023): research that starts from what's interesting, under light,
  porous institutions; and when a research kit becomes a protocol (many
  contributors, shared knowledge, sustained over time).
  *Here:* the PI steers with takes on the blyg and shares from Subset, not
  assignments, and the lab publishes as it goes.
- **Places to intervene in a system** — Donella Meadows,
  ["Leverage Points"](https://donellameadows.org/archives/leverage-points-places-to-intervene-in-a-system/).
  "Parameters are dead last." The PI's levers are the lab's goals and rules
  (the charter, the questions), not its knobs.
- **The Blygger protocol** — Rao, Sathe and Mathews,
  ["Introducing the Blygger Protocol"](https://protocolized.summerofprotocols.com/p/introducing-the-blygger-protocol)
  (Nov 2026). The notebook and the venue are one thing: claims are
  fragments, write-ups are threads that quote them, and the protocol's
  quoting and staleness do the bookkeeping a lab would otherwise do itself.

## 4. What limits automated research (and this lab)

The lab studies these as well as living with them: they are its own
constraints.

- **Amdahl's law for science** — Ran Blekhman,
  ["Why AI will not speed up science"](https://blekhman.substack.com/p/why-ai-will-not-speed-up-science),
  as the lab read it in
  [Speeding up the reading of papers barely speeds up science](https://www.kinocomputing.com/lab-2026-11-28-ai-science-speedup-amdahl).
  If finding papers and proposing hypotheses is 5% of a project, making it
  100 times faster saves 5%. The slow steps are physical and institutional.
  *Here:* the cheap rungs (simulation, a second seed) are cheap; the rungs
  that need real devices, real data or a person's opinion are scarce, and the
  lab says so instead of pretending otherwise.
- **The attention ceiling, and the merge step** — Rao's
  [The Scale-Intelligence Tradeoff](https://venkateshrao.com/blyg/t/6qch4vgkjxkk4t57kwkh0ywbmd),
  tested in the lab's
  [How many threads can one person run?](https://www.kinocomputing.com/lab-2026-11-27-how-many-threads-can-one-human-run).
  Two ceilings: how often the work needs a person (halve it, and the same
  attention runs twice as much), and the share of the work that must pass
  one serial point (Brooks's law: no number of parallel workers lifts it).
  *Here:* the PI is asked for something only under "Waiting on a human", and
  nothing waits on a reply; the serial point (settle, publishing) is kept
  deterministic, cheap and tested, so it's never the ceiling.
- **Find the constraint, then fix that** — Will Larson,
  ["Shipping 100+ PRs to production in a week"](https://lethain.com/passing-100-prs-in-a-week)
  (Nov 2026). The bottleneck moves: fix the current one, then find the next.
  CI and release first; context in the repository, where agents read it;
  verification produced alongside each change, so approving it is quick.
  *Here:* the tests and mutants were sped up by measuring first (`README.md`,
  "Tests"); each push's mutant verdict is on its run's summary page.

## 5. Keeping automated research honest

- **Registered reports** — Center for Open Science,
  [Registered Reports](https://www.cos.io/initiatives/registered-reports).
  Methods judged before results are known. *Here:* every experiment's
  `PLAN.md`, with its prediction and kill condition, comes before any code.
- **Physics, audited by machine** — Casey Handmer,
  [science.caseyhandmer.com/physics](https://science.caseyhandmer.com/physics/).
  An AI audit found errors copied from paper to paper: "A field outgrows its
  errors. It rarely corrects them." *Here:* the self-audit, which re-checks
  the lab's own oldest notes in public.
- **Apocryphal vulnerabilities** — the PI's
  [164-crimson-kites](https://www.msweet.net/notes/164-crimson-kites). Fields
  that rest on a founding anecdote, quotation or statistic. *Here:* the
  foundations audit, and a hostile reviewer before any claim moves up.
- **Theories as postulates** — Jeff Shrager,
  [CogLean](https://github.com/jeffshrager/CogLean): cognitive theory in Lean 4,
  "theories as postulates, phenomena as checked theorems". The direction for
  checking the lab's conjectures formally.

## 6. How the machinery is built

- **TigerStyle** — TigerBeetle, [tigerstyle.dev](https://tigerstyle.dev/).
  Safety, then performance, then experience. "Put a limit on everything
  because everything has a limit." Programs that check themselves and stop
  when something is wrong. *Here:* the shift's dollar cap and clock, the
  experiments' timebox, the cap of 15 notes a day, the mutants' time cap;
  settle turns the run red when it fails rather than leaving half a night
  unreported; each mutant runs in its own copy, never in the source, and a
  mutant run stops if the tests fail with no mutant at all.

## Looked at, not adopted

- **ToolUniverse** — [aiscientist.tools](https://aiscientist.tools/). Mostly
  biomedical; the lab's literature search is covered by free sources
  (`APPROACH.md`, "Decisions taken").
