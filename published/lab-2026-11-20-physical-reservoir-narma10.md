---
kind: experiment
question: q-003
pin: false
---

**Can a box of noisy oscillators compute? Not this one, yet**

One of the stranger ideas in alternative computing is to let a physical system do the hard part. Drive a tank of water, a tangle of springs or a photonic chip with your input signal, and its natural ripples will mix and remember that signal in complicated ways. Then train only a simple linear readout on top. This is *reservoir computing*, and its appeal is that the physics does most of the work for free. The question we care about is whether a physical reservoir can beat a digital one of the same size per joule of energy. This first experiment tests the easier half, accuracy, and only in simulation.

**The set-up.** We simulated 50 coupled, noisy Duffing oscillators. Picture 50 springs that stiffen as they stretch, all nudged by the same input and jostling one another. We compared them with an echo-state network, the standard digital reservoir: a fixed, randomly wired network of artificial neurons, also read out through 50 signals. The task was NARMA-10, a benchmark whose correct output depends on the last ten inputs, so it rewards memory. Each side got the same budget of 24 settings to tune on held-out data, and the final test data was looked at once. Before running anything we wrote down what would count as failure: the oscillators doing worse than the digital network.

![[lab-2026-11-20-oscillator-reservoir-claim]]

**What happened.** They did worse, by a wide margin. The oscillators' error was 0.96, close to the 1.0 you would get by always guessing the average, against 0.15 for the digital network (medians over five runs). A rerun with fresh random numbers agreed.

**Why it might be our toy, not the physics.** Three warning signs. The oscillators' 50 signals were nearly copies of one another, carrying about three independent signals' worth of information rather than 50. Their coupling was weak at every setting we tried. And the readout always reached for the strongest smoothing on offer. These are diagnostics, not proven causes, but they point at this particular model rather than at physical reservoirs in general.

**The digital side wasn't stretching either.** Its best settings kept its neurons in their nearly linear range, and a purely linear reservoir scores 0.19. At this size, NARMA-10 mostly tests memory, not the nonlinearity that makes reservoirs interesting.

**Energy, the half that matters, isn't measured here.** For a sense of the bar: if a digital multiply-add costs about 4.6 picojoules (an assumed figure), a physical reservoir would need to spend less than about 0.23 nanojoules per oscillator per input step to match the digital network's energy bill. That is a threshold to beat, not a result.

**Next.** A harder test: oscillators pushed into a strongly coupled, nonlinear regime, a digital network given room to use its nonlinearity, and a second task. We ran it: [giving the oscillators more room didn't close the gap](https://www.kinocomputing.com/giving-the-oscillators-more-room-didnt-close-the-gap).

The benchmark is from [Atiya and Parlos (2000)](https://doi.org/10.1109/72.846741) and the echo-state network from Jaeger (2001). [Code and full results](https://github.com/msmsim/kinocomputing-lab/blob/main/experiments/e002-physical-reservoir-narma10/RESULTS.md).
