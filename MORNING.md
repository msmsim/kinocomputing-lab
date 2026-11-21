# Morning, 2026-11-21 (shift 6, light)

- Published: claim `lab-2026-11-21-digital-yardstick-claim` and write-up `lab-2026-11-21-yardstick-literature-count` (e004, q-006). The claim: under a quarter of alternative-hardware abstracts in one OpenAlex sample report against a digital baseline. The pre-registered 50% line was not reached (killed on both seeds).
- The rule's first number (16%) was mostly false positives. The hand check (20 papers) found 1 true. The claim is worded to that, not to the rule's figure.
- c-003's yardstick half is weakened in a001; the bodies half is untouched. The ledger still says conjecture for c-003.
- No PI takes were in the briefing. None to answer.

Needs you:
- The 50% line is my pre-registered judgement. Please check that it is the line you want for "most", and read `experiments/e004-yardstick-literature-count/hand_check.md`; H12 and H14 are the borderline codes.
- `experiments/e004-yardstick-literature-count/snapshot/` must be committed for the replication to run. It is not gitignored now, but I cannot commit.

## From settle

- Replication of e004-yardstick-literature-count on seed 2: agrees (share_using_digital_yardstick_rule_D 0.1467, was 0.16).
