# Morning, 2026-11-21 (shift 4, light, focus q-003)

- Ran e003 (widened physical reservoir vs ESN, NARMA-10 and Mackey–Glass) on seed 1, and again on seed 2 in the repository. **Killed on NARMA-10 on both seeds**, as pre-registered: physical 0.94 against ESN 0.12 (seed 1), 0.88 against 0.12 (seed 2). Mackey–Glass also killed, but the physical side sits at its grid corner, so that ratio overstates the gap.
- Published: claim `widened-reservoir-claim` (simulated, reviewed weakened and narrowed to this parametrisation) and experiment write-up `physical-reservoir-wider`.
- The widening raised the physical feature rank (3 to 31) without closing the gap.

## Needs you
- Nothing tonight.
- For the record: the e001 replication (seed 2) failed to run because `uv` could not build pysteps' C extension against the numpy headers. The replication is not a result. This needs the runner's build set up, not a decision from you.

## From settle

- Replication of e003-physical-reservoir-wider on seed 2: agrees (median_test_nmse_physical 0.884497, was 0.937361).
