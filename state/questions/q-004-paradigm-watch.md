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

**Building it, now (2026-11-22, the PI):** the tracker is built from the
paradigm rotation (AGENT.md, "The paradigm rotation"). Each paradigm gets
its own entry, a short quotable note (`kind: paradigm`), published the
first time the rotation reaches it and updated every time after. The
tracker itself is a write-up (`section: tracker`) that opens with a short paragraph saying what
it is and how it's kept, credits the PI's round-up (linked once at the
top), and then quotes each paradigm's entry whole, under the round-up's
groups. It grows as entries appear: publish it once three or more exist,
and republish it, at most once a night, when the briefing lists it as
quoting older versions. Paradigms without an entry yet are listed by name
under their group, "not yet looked at". The lab's earlier notes on analog
in-memory computing, thermodynamic computing and physical reservoirs are
the first material for those paradigms' entries, linked by their
kinocomputing addresses.

**Keeping it:** the rotation goes round every paradigm in two weeks, a few a
night (the briefing names them). The entries carry the change; the
tracker follows by quoting them. A paradigm that has clearly moved can also
get a longer write-up, as before.

**Restructuring it:** the grouping is the round-up's, not a law. When the
lab's research suggests a better structure — paradigms that should merge
or split, a group that no longer holds, a paradigm the round-up missed, the
"physics" and "bodies" clusters the lab's World Machines analysis uses —
restructure it, and say what changed and why in the change note and the
brief. Never edit the PI's round-up itself.

## Running log

- 2026-11-20 (shift 3, light, focus q-004): checked analog in-memory computing against the alternative-paradigms page's "Latest" line. Found ASSERT (arXiv:2609.00955, 1 Sep 2026): diffusion sampling on calibrated analog-CIM noise, where the early denoising steps are the vulnerable ones, with a training-free sampler. Simulation only; preprint. Published as notebook `lab-2026-11-20-analog-cim-diffusion-noise` (outbox). The other q-004 reading (semantic comms, MiLAC precoding) was not analog-in-memory and was not opened. Paradigm not yet checked: thermodynamic, neuromorphic, reversible, photonic, physical reservoir.
- 2026-11-21 (shift 7, light, focus q-004): checked thermodynamic computing against the alternative-paradigms page's "Latest" line (Extropic X0/Z1, July 2026 LOI). Found CN101 (arXiv:2608.00754, 1 Aug 2026): a fabricated digital thermodynamic chip in standard CMOS, measured on four workloads; the paper defers energy and latency to later chips. Preprint. Published as notebook `lab-2026-11-21-thermodynamic-digital-chip-cn101` (outbox). No claim. Paradigms not yet checked: neuromorphic, reversible, photonic, physical reservoir (the last has its own experiments, q-003).
- 2026-11-23 (rotation, light): first pass on von-neumann, gpus, ai-accelerators (entries in outbox; tracker published, quoting all three). Verified: Valk (arXiv 2608.13696), PIMID (2607.24196), MLPerf Training v6.0 / Inference v6.1 announcements, InferenceX TPU v7 vs GB300 page, Nvidia Rubin spec. Unverified leads left out: ACM digital-PIM evaluation (403), Springer TPU-v5e-vs-H100 energy review, AMD MI455X spec page (timeout). e005 (random vs sorted reads) killed: its control arm was not sequential; a true sequential baseline needs its own plan. Gaps: no paradigm outside the incumbent stack has been looked at yet.
