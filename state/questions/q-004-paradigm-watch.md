---
id: q-004
title: Paradigm watch — keep the lab's paradigm tracker current
kind: notebook
status: active
priority: 2
watch: "thermodynamic computing" OR "analog computing" OR "neuromorphic computing" OR "reversible computing" OR "physical computing" OR "in-memory computing"
---

The PI's round-up, https://www.kinocomputing.com/alternative-paradigms, gives
each of ~37 paradigms, in six groups, a description, a genesis and a "Latest"
line, as of November 2026. It is the PI's note and stays as written. The
PI has asked the lab (2026-11-21) to keep a living version of it as part of
the research: **the paradigm tracker**, a lab note named
`lab-2026-11-21-paradigm-tracker` (kind: notebook, so a thread), titled
"The alternative paradigms tracker".

**Building it (the first shift that takes this up):** one entry per
paradigm, grouped as the round-up groups them, each one or two plain
sentences: what it is, in a clause, and where it stands now, with the
source linked. Start from the round-up's "Latest" lines, credited to it
("as of the PI's round-up, November 2026", linked once at the top, not
per entry), and bring forward what the lab has found since: analog
in-memory computing (the ASSERT note) and thermodynamic computing (the
CN101 note), linked by their kinocomputing addresses, and physical
reservoir computing (the lab's two reservoir write-ups). Open with a short
paragraph saying what the tracker is and how it's kept. It follows
"Writing for the site" like every lab note. It may quote the lab's claims
where an entry rests on one.

**Keeping it:** when a night's watch finds a real development (a measured
result, not a funding round), publish the short notebook entry as before,
and update the tracker's entry for that paradigm in the same shift, with a
change note naming what changed. One paradigm per night at most. The
tracker counts as one of the night's two write-ups when it changes.

**Restructuring it:** the grouping is the round-up's, not a law. When the
lab's research suggests a better structure — paradigms that should merge
or split, a group that no longer holds, a paradigm the round-up missed, the
"physics" and "bodies" clusters the lab's World Machines analysis uses —
restructure it, and say what changed and why in the change note and the
brief. Never edit the PI's round-up itself.

## Running log

- 2026-11-20 (shift 3, light, focus q-004): checked analog in-memory computing against the alternative-paradigms page's "Latest" line. Found ASSERT (arXiv:2609.00955, 1 Sep 2026): diffusion sampling on calibrated analog-CIM noise, where the early denoising steps are the vulnerable ones, with a training-free sampler. Simulation only; preprint. Published as notebook `lab-2026-11-20-analog-cim-diffusion-noise` (outbox). The other q-004 reading (semantic comms, MiLAC precoding) was not analog-in-memory and was not opened. Paradigm not yet checked: thermodynamic, neuromorphic, reversible, photonic, physical reservoir.
- 2026-11-21 (shift 7, light, focus q-004): checked thermodynamic computing against the alternative-paradigms page's "Latest" line (Extropic X0/Z1, July 2026 LOI). Found CN101 (arXiv:2608.00754, 1 Aug 2026): a fabricated digital thermodynamic chip in standard CMOS, measured on four workloads; the paper defers energy and latency to later chips. Preprint. Published as notebook `lab-2026-11-21-thermodynamic-digital-chip-cn101` (outbox). No claim. Paradigms not yet checked: neuromorphic, reversible, photonic, physical reservoir (the last has its own experiments, q-003).
