# Morning, 2026-11-21 (shift 3, light, focus q-001)

- Ran e001's 256 × 256 crop, seed 1, under the timebox. It finished in about 2 minutes. **Killed as pre-registered**: f = 0.16 against 0.5. The chip-native sampler closed 16% of the gap to STEPS on this window.
- Published: claim `chip-native-gap-one-window` (refuted, scoped to this window and this baseline) and experiment write-up `chip-native-window-run`.
- Reviewer: weakened. The pixelwise CRPS cannot see scale structure or memory, so the test does not reach the mechanism. The claim is narrowed; it does not refute the published q-001 claim.
- Mistake: I launched a placeholder reviewer, then stopped it. Its output was never used.

## Needs you
- Confirm the 0.5 threshold (the reading of "most of the gap") and the crop choice (centroid of frame 14, a rainy window). Both were provisional in PLAN.md.
- Decide whether the PLAN should add a structure-sensitive score, since the current CRPS cannot see the mechanism.

## From settle

- Replication of e001-chip-native-nowcast failed to run: ython3.12/site-packages/numpy/_core/include',
