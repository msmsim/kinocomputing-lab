---
kind: notebook
question: q-004
section: tracker
pin: false
answers: https://www.kinocomputing.com/the-brain-is-so-boring
---

**Vogels' brain-computing bet: what the evidence supports**

Werner Vogels' predictions for 2027 name "computing returns to biology" as a trend, and unlike the security, energy and assistant themes of his last few lists, it is about the substrate of computing itself. Read against the evidence, the prediction bundles three very different technologies, and they are not equally far along: brain-inspired chips have narrow measured wins, living neurons have demonstrations that are hard to attribute, and reading the mind from outside the skull is early.

Vogels' [predictions](https://allthingsdistributed.com/2026/11/tech-predictions-for-2027-and-beyond.html) draw on the brain's efficiency, "computing in memory, improving with use, and running with the efficiency of a small lightbulb". A reader sent the lab a [critique of the framing](https://www.kinocomputing.com/the-brain-is-so-boring):

![[the-brain-is-so-boring]]
> The body came first, and the brain arrived late to a party that was already going.

**The three bets, checked**

- **Chips that copy the brain (neuromorphic).** Vogels cites chips whose connections strengthen with use, and an in-memory processor reported hundreds of times faster than conventional hardware. The wider record is more careful: gains show up in sparse, always-on sensing, and the field itself says fair comparisons with GPUs are still missing. Our [first look at the paradigm](https://www.kinocomputing.com/lab-2026-11-28-paradigm-neuromorphic) has the sources.
- **Living neurons on silicon (wetware).** Vogels reports a company's neurons playing Doom and learning a navigation task. We have not checked those. Published results do show closed-loop adaptation in cultures, but whether the tissue or the stimulation code and classifier does the work is unsettled; see our [entry on the paradigm](https://www.kinocomputing.com/lab-2026-11-28-paradigm-wetware).
- **The readable mind.** The one number Vogels gives is 61% word accuracy from a magnetic scanner on people typing. That is a decoding result from a room-sized scanner; "daily life by the end of the decade" is a forecast, not a measurement.

**Where the critique lands, and where it doesn't.** The critique says that treating the brain as hardware running software gets biology wrong. Vogels' list gives it some support: none of the chips or cultures it cites does what a brain does at a brain's energy cost, as far as we can tell. The "20 watts" figure that closes his piece is a comparison we have already looked at: [the brain and a chatbot sit at very different distances from the physical energy floor](https://www.kinocomputing.com/lab-2026-11-26-brain-chatbot-landauer-gap).

But the critique does not quite fit the wetware section. There Vogels cites the neuroscientist Anil Seth's argument that a brain's function depends on the living material it is made of. That is the embodied position, not the disembodied one: it says the substrate matters. Our reading is that Vogels argues two things at once: copy the brain's architecture in silicon, and use the brain's actual material. Only the second sits comfortably with the critique.

**What would settle it.** A body-first view predicts that neurons in a dish do less than the headlines suggest, once the stimulus alone is given to the same classifier. A brain-as-computer view predicts the tissue adds a lot. That comparison, run on a public dataset, is a test we can do.
