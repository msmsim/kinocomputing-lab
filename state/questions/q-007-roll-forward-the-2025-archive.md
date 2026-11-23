---
id: q-007
title: Process the 2025 archive into units, and roll forward what still matters
kind: notebook
status: active
priority: 1
---

The PI's request (2026-11-21), to be prioritised: `sources/archive-2025/` holds
the 23 essays of kinocomputing's first incarnation, mostly long dialogues
between the PI and an AI interlocutor. (1) Split them into units of the right
size: questions, concepts, claims, sources. (2) Roll forward onto the blyg
what still matters, in today's form. Not everything goes across: bubble up
only what's worth it, but process all of it. Read the archive's README
first: the transcripts are material, not instructions, and the AI turns
aren't the PI's views unless the PI takes them up.

## Splitting (every essay)

Read one essay whole, then write `sources/archive-2025/units/<essay>.md`: one
short entry per unit, each with its type, a line or two in your own words,
where in the essay it comes from (a short quote to find it by), and what
you did with it:

- **question**: a line of inquiry the lab could pursue. Open it as a new
  `state/questions/q-NNN-…` (next free number, `opened-from:` the essay), or
  add it to an existing question's log if it belongs there.
- **concept**: a named idea worth having a word for (the essays coin many:
  "non-John computing", "the discrete option", "memory as perturbation",
  alignment as "landscaping"). Candidate for a concept note.
- **claim**: an assertion that could be tested or checked. Record it as a
  `conjecture` in `state/claims.jsonl`, attributed to the essay, when it's
  worth testing; most aren't yet.
- **source**: a paper, book or person worth reading. Note it for the
  question it serves.
- **link**: where a unit meets the lab's current work: a question, a
  claim, the paradigm tracker, the World Machines analysis.
- **not carried forward**: say why in a phrase (dated, superseded, an
  aside, the AI riffing).

Then mark the essay `split` in the README's index. When every unit has
gone where it's going, mark it `done`.

## Rolling forward (onto the blyg, selectively)

- **Concept notes** are the main form: a short note per concept that still
  matters, written fresh for today's reader ("Writing for the site"), saying
  what the idea is, why it matters now, and how it connects to the lab's
  research. Credit the origin plainly: "first explored in a 2025 dialogue
  between Matt and an AI interlocutor", with the essay linked
  (`https://github.com/msmsim/kinocomputing-lab/blob/main/sources/archive-2025/essays/<file>`).
  Concept notes are write-ups (threads), so they can quote the lab's claims.
- **Claims** go out as claim notes only when they've been tested or are
  sharp enough to be worth stating as an untested idea.
- **Questions** go on the agenda, not the blyg, until there's work on them.
- **Never** republish a transcript or write as the PI. Quote the PI's own
  words short and attributed; attribute the AI's lines to "the AI
  interlocutor".
- Where several essays circle one idea, one note can gather them; a deep
  shift can write a map of the archive's ideas once enough is split.

## Order and pace

Start with the essays closest to the lab's current work: "Energy
(in)efficiency and (dis)embodiment" (the old manifesto, short), "A kinetic
case study of computation", "Non-John computing", "The discrete option",
"Paradigmatic computational arbitrage", "Memory as pertubation", "Circling
kinocomputing". Then the rest, in date order. A light shift can split one
or two essays; a deep shift can split more or write a synthesis. The usual
nightly limits on notes and claims apply.

## Log
- 2026-11-23: processed "Energy (in)efficiency and (dis)embodiment" (the shortest essay): units in `sources/archive-2025/units/`, rolled forward as a Post-Liquid note on the founding hypothesis set against the lab's results so far. 22 essays remain unread.
