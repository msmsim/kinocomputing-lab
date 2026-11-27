---
kind: notebook
question: q-007
voice: bompa
pin: false
---

**Arbitrage between analog and digital computing: a sketch**

in july 2025, a dialogue on this site borrowed three ideas from finance and tried them on computing: arbitrage, option and interest. the claim is that doing a sum on an analog circuit instead of a digital chip could be free money, that staying on the digital side quietly runs up a debt, and that switching is an option you may take up or let lapse. the essay calls its own numbers "completely made-up". what follows separates the idea from what it has shown, which is nothing yet.

arbitrage is the starting point. the essay defines it as "simultaneous purchase and sale of identical/equivalent assets in different markets to exploit price differentials for risk-free profit." one thing, two prices: buy where it's cheap, sell where it's dear. you need no view on which way the market moves, only the gap.

the step into computing is to ask what the "asset" is. a digital chip works in counted steps. an analog circuit lets a quantity such as voltage change smoothly. take integration, the running total of a quantity over time: a digital machine approximates it in small steps, while an analog integrator built from an op-amp and a capacitor accumulates it continuously. if both compute the same mathematical function, it is one product sold in two markets, and the difference in energy and time is the profit. here "paradigm" means a whole way of building a computer.

two more pieces follow. in finance an option is a right, not a duty, to act later; the essay applies that to switching paradigms. staying put is a cost that builds: "every computation you run in discrete when continuous would be more efficient is accumulating "interest debt."" (here "discrete" means digital and "continuous" means analog.)

the worked sum shows how it would be tested. say a digital multiply costs 1 nanojoule and takes 1 nanosecond, and an analog one a tenth of each. at a billion multiplies a second the digital machine spends 0.9 joules a second more. give the switch a one-off cost of 10 joules and 10 seconds, and it pays back after about 11 seconds of work. the essay asks of this arithmetic: "completely made-up numbers but framework seems to work?"

what could be checked? the essay proposes computing an integral of sin(x) on four substrates (digital numerical methods, an analog op-amp integrator, a microfluidic channel where pressure builds up, and a simplified spiking-neuron model) and measuring energy, time and error. the digital arm needs only a computer, and the analog circuit could be simulated; the other two need bench work (our inference).

what it asserts without evidence: analog circuits "might" do some problems "orders of magnitude more efficiently", and the brain runs on "like 20 watts", both with no source. lock-in is offered as the reason continuous computing stays niche, supported by an analogy with qwerty keyboards and railroad gauges, not a measurement. the essay's own verdict is the most honest line in it: "the model feels hand-wavy rn bc we're mixing financial metaphors with computational reality."

one doubt, which is our reading. an arbitrage only exists if both arms sell the same thing, and the essay says as much: a floating-point multiply and an analog one "aren't really equivalent if precision differs." until accuracy sits in the ledger beside energy and time, the free money is in doubt. the essay also retreats from its own example: chips built for one task are "probably just normal competitive advantage/specialization, not arbitrage".

what it leaves a reader is a vocabulary and a test, not a result. the question a bench could answer: when two substrates give the same answer, how far apart are they in energy and time?
