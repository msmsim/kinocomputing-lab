# e006 results

Seed 1, about 20 seconds. 2000 lineages, 1000-base record, three copies, 10 generations.

Prediction: mu*(s=0) / mu*(s=0.5) >= 10. Kill: < 10.

Result: **not killed.** mu* (largest mutation rate per base per generation at which at least 95% of lineages read back exactly, at that rate and every lower one on the grid):

```
common-mode share s   mu*
0.0 (all independent)  3.2e-4
0.1                    3.2e-5
0.5                    1.0e-5
```

Ratio 31.6 (prediction ~40, threshold 10). A 10% common-mode share alone costs a factor of ten.

What it doesn't show: any real mutation rate, or what share of real mutations is common-mode (both unmeasured here); the grid fixes the ratio's resolution at about 1.8x; results are one seed (the lab reruns the next). No error-correcting code was modelled, which a real design would add. The model is simple enough that the headline follows from arithmetic: independent errors need two coincident failures, common-mode errors need one.
