---
kind: notebook
question: q-008
answers: https://www.kinocomputing.com/grown-not-imagined
voice: santa-feist
pin: false
---

**Grown or trained? Gradient descent is growing too**

In the mid-1990s Adrian Thompson used an evolutionary search, which makes random changes to a design and keeps whatever works better, to configure a programmable chip into a circuit that could tell two tones apart, with no clock signal. As the account goes, part of the circuit had no logical connection to the rest, yet was crucial to its function. That is the kind of result Matt's note, [Grown, not imagined](https://www.kinocomputing.com/grown-not-imagined), points at. We think its core claim has something to it, but its contrast between "grown" and "designed" needs a test.

The note opens with this line:

![[grown-not-imagined]]
> Some intelligences can’t be imagined. They have to be evolved.

His image for the kind we miss is a meander, the bend a river carves where water meets land: "the record of the two meeting, over and over." Nobody designed it. We agree that designs nobody imagined exist. Thompson's chip is one. A collection of [anecdotes from digital evolution](https://arxiv.org/abs/1803.03453) gathers many more, mostly from software. Physical reservoir computing gives another. A reservoir is any physical system whose messy response to an input can be read out as a computation. In 2003 Chrisantha Fernando and Sampsa Sojakka reported that a [bucket of water](https://en.wikipedia.org/wiki/Reservoir_computing) could recognise patterns in the disturbances fed into its surface. The designers chose the inputs and learned to read the outputs; the computing in between was the water's own. (We have read summaries of these two cases, not the original papers.)

Where we'd push back is on "grown" as the opposite of "imagined". Training a neural network, a program made of many adjustable numbers called weights, is also a kind of growing. You start with random weights, show the network examples, and nudge every weight a little in whichever direction reduces its error. That method, gradient descent, is the usual way such networks learn. Nobody writes the final weights line by line. Our reading is that gradient descent carves by encounter with data, much as the river carves its bed. Our inference, not a claim in the note, is that the real difference lies elsewhere: Thompson's chip was shaped in silicon, with its real physics doing the work, while a trained network is shaped in arithmetic, with the physics abstracted away.

So what would settle it? The note's claim makes a prediction that can fail: a physically grown system should do something an equal-size trained network can't, once cost is counted. Compare them on one task with one agreed measure: the same number of components or parameters, the same task, and the useful output each buys per joule of energy. If a trained digital network matches the physical system at equal energy, the grown account loses its special standing for that task. If the physical system reaches results that no equal-size trained network reaches at the same energy, that would be real support. Either outcome is worth publishing. The lab has an open question of this shape, starting with a simulated physical reservoir against a digital baseline on a standard task, and no answer yet.

The meander is the right picture. The open question is whether the river and the land are the only two things that have to meet.
