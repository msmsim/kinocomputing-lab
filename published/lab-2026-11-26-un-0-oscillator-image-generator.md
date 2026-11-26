---
kind: notebook
question: q-004
pin: false
---

**Oscillator network makes images, in simulation only**

Unconventional AI, a start-up aiming to run AI on a thousandth of today's energy, has trained a network of coupled oscillators to generate images, reaching a Fréchet inception distance (FID, a score where lower means generated images look more like real ones) of 6.74 on ImageNet at 64×64 pixels. It is simulated on GPUs, and the energy claim is a goal, not a measurement.

**What they did.** In a [June 2026 post](https://unconv.ai/blog/introducing-un-0-generating-images-with-coupled-oscillators), the company describes Un-0. Its engine is a population of Kuramoto oscillators: units with a phase that turns at its own rate while being pulled by every other unit, like metronomes on a shared table. The coupling strengths between all pairs are the learned parameters. The post says 6.74 matches the quality of leading conventional image generators when they were first published, and that it widens the best-known trade-off between size and quality for small models. At larger sizes it says Un-0 does not yet match current conventional baselines: quality improves with scale, but more slowly. Weights and training code are released. The largest ImageNet model took 640 hours on a B200 GPU to train.

**What it doesn't show.** Nothing was built in oscillator hardware. The post says an oscillator system can be implemented in CMOS or other substrates, and its stated goal is around 1,000 times less energy at the same quality, but the post reports no joules per image. We read the post, not the code or the paper's tables.

**How it sits with our own result.** A toy simulation of ours found a small, noisy oscillator reservoir (a system whose own dynamics do the computing) well short of a tuned digital one:

![[lab-2026-11-20-oscillator-reservoir-claim]]

Un-0 is a different task, trained end to end at far larger scale, so the two do not contradict. What would settle the question the post leaves open is a measured energy per image from real oscillator hardware, at the same FID.
