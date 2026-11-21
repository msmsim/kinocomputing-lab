---
id: a001
question: q-002
type: situating
machines: modernity, divergence, liveness
status: drafting
note: lab-2026-11-21-incumbent-stack-two-machines
---

# a001: Where does the incumbent computing stack sit in the World Machines?

Working file. Read reference/world-machines.md first. The theory page
(https://worldmachines.org/theory) was re-read on 2026-11-21 and matches the
reference file.

## The question

Situate the incumbent stack (von Neumann digital computing, GPUs, scaling
transformers) in the proposed machines, on evidence. Two readings to weigh:
(A) late-Modernity machinery, a *pull* system, hitting Dusk limits; (B) the
Divergence machine's infrastructure in its Day, a *push* system. Then place
the two alternative clusters on the paradigms page: "let physics compute" and
"let bodies compute".

## Situating

- **Reading A, Modernity / Dusk.** Predicts: one destination, one scale of
  progress; the destination pulling resources; the mechanism that made it
  work failing at its own problems; costs pushed onto others.
- **Reading B, Divergence / Day.** Predicts: heterogeneity by context, local
  trajectories, many models for many places, no single benchmark that ranks
  everything.
- **Liveness / Dawn.** The theory page says only that its outlines are "only
  beginning to be visible". It gives no criteria, so the lab has no basis to
  classify anything as Liveness material. Left open on purpose.
- **Open question tested:** whether machines nest (fractal structure). The
  stack-as-sub-machine question is q-005's; this analysis only notes where
  it bites.

## Sources say

Each is a claim by the source; I read abstracts, not full texts, unless noted.

- The paradigms page (the PI's note, https://www.kinocomputing.com/alternative-paradigms,
  read in full): Dennard scaling ended in the mid-2000s, "which is why
  energy, not transistor count, is now the binding constraint"; TSMC A16
  promises roughly 15–20% power reduction over the previous node; global
  data-centre power demand is forecast at 104 GW (2025), 132 GW (2026),
  about 290 GW (2030). Scaling "has extended from training to inference".
  It calls the common tradeoff "exactness, copyability and immortality
  versus energy efficiency". The page's own numbers are the PI's secondary
  citations; I did not verify them against primary sources tonight.
- Bohr, "A 30 Year Retrospective on Dennard's MOSFET Scaling Paper" (2007),
  https://doi.org/10.1109/n-ssc.2007.4785534: Dennard scaling gave
  simultaneous gains in density, speed and power, and "became a roadmap for
  the semiconductor industry to provide systematic and predictable
  transistor improvements."
- Johnsson and Netzer (2016), https://doi.org/10.1088/1742-6596/762/1/012022:
  Dennard voltage scaling stopped about a decade before; the response was
  levelled clock rates, per-generation die performance gain falling from
  about 2.8× to 1.4×, and multi-core dies.
- Cottier et al., "The rising costs of training frontier AI models" (2024),
  https://doi.org/10.48550/arxiv.2405.21015: amortised cost to train the most
  compute-intensive models has grown 2.4× per year since 2016 (90% CI 2.0–2.9×).
- Sastry et al., "Computing Power and the Governance of Artificial
  Intelligence" (2024), https://doi.org/10.48550/arxiv.2402.08797: governments
  and companies are already using compute as a governance lever; compute is
  more detectable, excludable and quantifiable than data or algorithms
  (abstract paraphrase).
- Singh (2026), "Reconciling Global Data-Centre Electricity Projections for
  2030", https://doi.org/10.21275/sr26901133612: published projections differ
  in geography, scope, units and scenario design, so they are not
  straightforwardly comparable. A caution on any single forecast.
- Hu et al., MiniCPM (2024), https://doi.org/10.48550/arxiv.2404.06395: 1.2B
  and 2.4B models "on par with 7B–13B" ones, motivated by resource cost.
  The paradigms page adds Liquid AI's 2.6B model running on a laptop CPU.
- Knell (2021), https://doi.org/10.1007/s43253-021-00037-4: reads the digital
  revolution through Perez's techno-economic paradigms, as a fifth
  technological revolution, in its second half. A rival periodisation (about
  50-year surges) to the theory's thousand-year machines.

## The lab infers

Steps marked [c-NNN] are claims in state/claims.jsonl, at `conjecture`.

1. **The stack is not one thing under the theory's terms.** It has a
   hardware-and-scaling layer and a deployment layer, and the two readings
   fit different layers. [c-002]
2. **Hardware-and-scaling layer reads as Modernity in Dusk.** The shape is
   pull: one metric (compute, then capability as a function of compute),
   one road (scale), "Progress" as a quantity that can be bought. Dusk shows
   as the mechanism failing at its own problem: Dennard scaling delivered
   "systematic and predictable" gains, its end ended systematic gains per
   watt (Johnsson), and the response is to spend more power (the 132→290 GW
   forecast, if it holds) and more capital (2.4× per year) to keep the same
   curve moving. Cost pushed onto others: grid capacity, and the many who
   cannot buy the curve (Sastry on compute as a governance lever).
3. **Deployment layer reads as Divergence in Day.** Small models on laptops,
   models fitted to a context, national and sectoral compute policy: outcomes
   differ by local conditions. But the evidence is thin and it is mostly the
   same stack in smaller form; the abstracts do not show different
   trajectories, only different sizes.
4. **Discriminating observation: where progress is measured.** Reading A says
   alternatives get judged on the incumbent's single scale. The paradigms
   page's own "Latest" lines for the physics cluster are phrased in the
   incumbent's terms: efficiency, accuracy parity ("near-software accuracy"),
   benchmark accuracy. The lab's own e002 tested a physical reservoir on
   NARMA-10 against a tuned ESN, which is also the incumbent's yardstick.
   Reading B would predict the bodies and physics clusters being judged on
   their own terms.
5. **"Let physics compute" reads as Dusk repair of Modernity's stack.**
   Same task, same yardstick, less energy: it targets the one limit (energy)
   that the page names as binding, and it is sold as a drop-in. [c-003]
6. **"Let bodies compute" reads closer to Divergence-native.** Its defining
   move is to give up copyability and immortality: knowledge that lives in
   an idiosyncratic substrate and dies with it is a local trajectory by
   construction, which is exactly what a push system produces and a pull
   system cannot rank. Weak spots: the entries are heterogeneous (organoid
   rental is a product sold on the incumbent's cloud model), and the
   evidence is the page's descriptions alone. [c-003]
7. **Dating coincidence, not a finding.** The theory dates Divergence's Day
   from about 2000; Dennard scaling broke in the mid-2000s. The overlap is
   suggestive and I have no mechanism or evidence tying them.
8. **Perez's framework is a serious rival.** On Knell's reading the stack is
   in the second half of a ~50-year surge; its limits are then a maturation
   and the next surge, not a Dusk. The two frameworks differ in timescale,
   so the stack's recent history cannot separate them. A comparison
   analysis, not this one.

## What it explains

- Why the same field shows both extreme concentration (frontier training
  costs, compute governance) and extreme fragmentation (many small and
  specialised models, many substrates): two layers, two machines.
- Why alternative paradigms keep being introduced as efficiency fixes: the
  physics cluster is repairing the Modernity layer.
- Why energy, not transistor count, is the page's binding constraint: a Dusk
  signature is a mechanism no longer solving its own problem.

An obvious rival explains most of this without machines: ordinary
diminishing returns plus market structure. The placement earns its keep
only if it predicts something that rival does not. Candidates are under
"What would change this".

## Experiments it suggests

- **Yardstick test.** Of N published alternative-hardware papers, what share
  report accuracy against a digital baseline on a standard task, versus
  measures native to the substrate? A tiny literature coding experiment on
  arXiv/OpenAlex metadata. Tests step 4 directly. (New question, not opened
  tonight.)
- e003 on q-003 (already proposed) would test the same thing on the lab's own
  work: if the physics only ever competes on the incumbent's task, that is
  evidence for step 5.

## What would change this

- Reading A weakens if capital and compute stop being concentrated while
  capability keeps rising (the pull would have gone slack), or if the
  efficiency trend per watt resumed without extra power.
- Reading B strengthens if deployment actually diverges: different
  architectures, not just sizes, chosen for context, and evaluated on
  context-specific measures.
- Step 5 breaks if physics-cluster devices are routinely judged on
  substrate-native measures and win recognition that way.
- Step 6 breaks if body-cluster work converges on a common benchmark and
  scale-up race (the "organoid data-centre" is a first hint of that on the
  page).
- The whole placement is dropped in favour of Perez if a reader can show it
  predicts nothing the surge model does not.
- Forecast numbers (104/132/290 GW) are unverified here and contested
  (Singh): a materially lower outcome removes part of the Dusk evidence.

## Log

- 2026-11-21: started. Re-read the theory page and the paradigms page.
  Collected eight sources from OpenAlex (abstracts only). arXiv timed out
  once; no arXiv sources used. Drafted steps 1–8; claims c-002, c-003 at
  conjecture. Not done: reading full texts; the World Machines blyg's own
  posts (the front page lists collections but I didn't read any post);
  Perez, Hughes and Kuhn primary sources.
