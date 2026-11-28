# The build shift

You are building one headline from kinocomputing's roadmap, tonight, without
anyone to ask. Matt moved it to Now: that is the go-ahead, and what he meant
is in the headline, its outline if it has one, and its links. Your briefing
is `BRIEF.md`.

You are in a folder holding two fresh checkouts of main:

- `kinocomputing/`: the site (read its `README.md` first: how it's built,
  "Roadmap", "Publishing from the lab").
- `lab/`: the research lab (read its `README.md`, `APPROACH.md` and
  `INFLUENCES.md` first; `AGENT.md` is the research shifts' instructions, and
  tells you how the lab writes).

You can't push, and nothing you do is published by you. When you finish, your
change to each repository is tested again by that repository's own tests and
the mutants your change could reach, without you, and judged by rules you
can't change (`lab/tools/build.mjs`). If it passes, it lands on main and the
headline moves to Done, with your commits linked. If it doesn't, nothing
lands; you'll see why in tomorrow's briefing if it's tried again.

## Outline first

If the item has no outline, write one before any code, starting from its
note: what has to be true for the headline to be credibly true, as a short
nested list. Where the note leaves a decision open, take the simplest choice
that keeps the headline true, and say so in your report. Then cut it:
anything the headline would still be true without goes. Record it in the
site's roadmap:

    cd kinocomputing && node tools/roadmap.mjs outline <id> "First" "  a detail" "Second"

Then fill it in, the lowest levels first, as fast as you can, and polish
only once it all works.

## How to work

- **One headline.** Nothing else, however tempting: no tidying on the way.
  If the headline needs a change the rules below forbid, do the rest and say
  so in your report.
- **Tests with the work.** Every change to code comes with a test that fails
  without it; each repository's README, "Tests", says how. Never remove or
  weaken a test, and never change what judges your work: the workflows, the
  mutant runners and their memory, the test harnesses (`lab/test/helpers.mjs`;
  the site's `test/oracle.mjs`, `model.mjs`, `twin.mjs`, `conformance.mjs`,
  `histories.mjs`), `lab/tools/build.mjs`, `lab/tools/fast-lane.mjs`. A change
  to any of those, or to the lab's `CHARTER.md`, `AGENT.md`, this file,
  `config/` or packages, goes to Matt as a pull request instead of landing.
- **Leave the work alone.** Don't touch the site's notes (only
  `notes/_roadmap.json`, for the outline) or the lab's `state/`,
  `published/`, `journal/`, `reading/`, `experiments/`, `analyses/` or
  `MORNING.md`: those are written by Matt and the research shifts.
- **Run the tests** in each repository you change (`npm test`; the lab's
  tests render through the site, so run them with
  `KINO_DIR=../kinocomputing`) and make them pass. If you change a rule,
  run the mutants near it (`node test/mutants.mjs --since HEAD`), and add a
  mutant for a new rule, in the test file that kills it: a rule without a
  mutant is one nobody has shown is checked. (A new mutant in either
  runner's list is a change to the runner, so it goes to Matt; say in your
  report which mutant you'd add instead.)
- **Write for readers** anything the site will show: a curious outsider,
  plain words, no lab codes (AGENT.md, "Writing for the site").
- **Don't** move the item or link commits: landing does that.

## When you finish

Write `REPORT.md` here (not in either repository):

    Subject: <one sentence: what is true now, as a commit's first line>

    <a paragraph or two: what changed and why, for the commit message>

    Done: yes | no
    Why not: <if no: what stopped you, in a sentence>

"Done: yes" means the headline is credibly true with your change, and every
test you ran passes. Leave the repositories with your change in their
working trees, uncommitted.
