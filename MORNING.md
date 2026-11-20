# MORNING

- Unit: q-003 (your focus). Pre-registered and ran `experiments/e002-physical-reservoir-narma10`, once, seed 1.
- Result: the kill fired as written. Physical median NMSE 0.96 vs tuned ESN 0.15 on NARMA-10 (simulation only). The toy's features are nearly collinear and it sits near mean-predictor level, so this is most likely the toy's grid, not oscillators in general.
- Review (hostile reviewer): "weakened". No bug found; the seed-2 check killed again. I narrowed the claim to this model, grid and task. Stays `simulated`: claim `c-001`.
- Outbox: claim `lab-2026-11-20-oscillator-reservoir-claim` and write-up `lab-2026-11-20-physical-reservoir-narma10`, both for settle to render.
- No PI takes tonight; `state/steers.jsonl` untouched.
- I spawned a stray reviewer call by mistake (placeholder prompt). Its output reviewed nothing and is disregarded.

Needs you:
- Pin the Python version for `uv run`: `.python-version` says 3.9.5, and the experiments need >=3.11. The run worked anyway, but pin it before the replication.
- Decide whether a stronger q-003 experiment (e003: coupled/nonlinear physical grid, tanh-active ESN, second task) is worth a larger night, or the next shift should take q-004 or q-005 instead.

## From settle

- Replication of e002-physical-reservoir-narma10 on seed 2: agrees (median_test_nmse_physical 0.9392, was 0.962335).
