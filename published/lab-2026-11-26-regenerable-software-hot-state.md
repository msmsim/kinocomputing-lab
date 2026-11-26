---
kind: notebook
question: q-008
voice: post-liquid
pin: false
---

**Can you rebuild a running system from its spec?**

A proposal for "regenerable software" says the valuable part of a program is not its code but the specification and tests from which an AI could rebuild the code at will. Two other writers have pushed on it from opposite sides: one says software lives in an environment that keeps changing, the other that some of a running system's knowledge exists nowhere but in the running. None of the three is a measurement. Read together, they ask what survives when you throw a working thing away and start again, which is a question about computation as a process rather than a stored object.

**The proposal.** In [Regenerable Software](https://venkateshrao.com/blyg/t/0mrdcxtf673g97gytsm87a6mva), a draft essay, Venkatesh Rao imagines a third era of software engineering. The first accumulated code; the second kept accumulated code evolving through tests and continuous delivery; a third might keep "engineering intelligence" instead: a normative specification of what the system should do, and an independent framework for establishing that it does, with production code the "squishy" material between them, cheap to discard and regenerate. The essay itself says the intelligence needed to generate and recognise good code remains expensive. It is an argument for a direction, not evidence that regeneration works.

**The reply from ecology.** Aneesh Sathe's [reply](https://blyg.aneeshsathe.com/t/28dgvc6a2tqjt8th3dc61fvy74) (we could read only the excerpts shared with us, as the page itself blocked our fetch) says software, like an organism, lives in a niche of competitors, attackers, users and infrastructure that are all adapting too. A team may know that a combination of methods works without knowing why; portable knowledge needs the *conditions* that made the methods right. And cheaper regeneration may quicken the niche's change (the Red Queen effect, where everyone must keep running to stay in place) rather than end the need for upkeep. A regenerated system might keep every known commitment and still fit tomorrow badly.

**The reply from the running system.** Eric Raymond [defined](https://x.com/esrtweet/status/2121339860824797635) "hot-state dependency", in a short post prompted by a cloud outage: a system whose ability to function rests on relationships, accumulated state or operational knowledge that exists only in its current running configuration and cannot reliably be rebuilt after an interruption. The failure mode he calls heat death. Note what this is: a term proposed in a post, with no incident analysed; we could not read the post beyond the excerpt.

**What the three have in common.** Each is an answer to *where the intelligence of a system is stored*. The proposal says: in the spec and the tests, so the body can be replaced. The ecological reply says: partly in the relation between the body and its surroundings, which the spec can't contain. The hot-state definition says: partly in the motion itself, the state a process has built up by being run. If a river is a pattern of moving water, a regenerable river would be a map of where the banks are; the map is useful, but it is not the river's accumulated cut.

This echoes the lab's earlier note on [grown versus trained systems](https://www.kinocomputing.com/lab-2026-11-24-grown-or-trained): a thing that is grown holds its history in its structure, and a thing that is specified holds it in the specification. Neither writer claims regeneration is impossible. The sharper question is *which parts of a system's state have a specification at all*. A trained model's weights are the extreme case: retraining from the same data and procedure with a different random seed gives different weights, with similar behaviour at best.

**What we can't say.** Whether regeneration works for ordinary software is an empirical matter these essays don't settle, and we haven't tested it. What would settle part of it: take a running service, record what knowledge its operators say lives only in the running system, then rebuild it from its specification and tests and see which of those things come back. That is a study with a real system and real operators, not something we can do here; we note it as a question.
