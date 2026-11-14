# Statistical review changes, 8 Nov 2026

Response to Prince Raj's independent validation (NEAR_Scientific_Review_&_Validation.zip).
Stable version before these changes: branch `backup-stable-2026-11-08`.
Full before/after table for all 52 series: `stat-review-2026-11-08.csv`.

## 1. Mann-Kendall tie handling (fixed)

**Problem confirmed.** S counted every pair using unrounded values, while Var(S) grouped ties with `toFixed(6)`. Two definitions of equality were used in one test.

**Root cause in our data.** Some yearly means are exactly equal in decimal terms, but averaging 12 floats leaves about 4e-16 of rounding noise. S treated those years as different; the variance treated them as tied.

**Policy now (one rule everywhere).** Each yearly value is rounded once to 1e-9, which removes floating-point noise only. Exact equality is then used for both S and Var(S). The closest pair of truly different yearly means in the 52 series is more than 1e-6 apart, so no real difference is lost.

**Verification.**
- S matches exact decimal (rational) arithmetic on the stored data for 52 of 52 series.
- S, Var(S) and p match `pymannkendall` 1.4.3 `original_test`. The largest p difference is 1.4e-7, which comes from the documented erf approximation.
- Our reference differs from the review's numpy reference in 21 series. That reference compared `np.mean` floats with exact equality, so it has its own rounding noise; exact decimal arithmetic agrees with the new code.

**Impact.** S changed in 19 of 52 series and the largest p change is 0.0078. No 5% verdict changed.

## 2. Autocorrelation (added: diagnostic and adjusted test, shown side by side)

- **Diagnostic:** Ljung–Box test at lags 5 and 10 on the linearly detrended yearly values. It matches the review's numbers: 12 of 52 series below 0.05 at lag 5 and 13 of 52 at lag 10. It matches SciPy to 3e-9.
- **Adjusted inference:** the Hamed & Rao (1998) modified Mann-Kendall variance. It uses ranks of the Sen-detrended values, all lags, and counts only lags outside the 95% band. This matches `pymannkendall.hamed_rao_modification_test` (largest p difference 1.4e-7).
- **Display:** the ordinary Mann-Kendall result stays the headline. Step 4 adds "Check: is each year independent of the last?" with the Ljung–Box status and the adjusted p.
- **Impact:** 13 series show possible serial dependence. One verdict depends on the method: Eastern Himalaya (Sikkim) snow depth, ordinary p = 0.022 and Hamed–Rao p = 0.288. The step 4 panel and a "⚠ check" mark in the scanner flag it.

## 3. Edge cases (guarded)

- Mann-Kendall returns `status`: `ok`, `insufficient_data` (n < 3) or `constant_series` (p = 1).
- Linear regression returns `status`: `ok`, `insufficient_data`, `constant_series` (p = 1, no 0/0) or `perfect_fit`.
- The autocorrelation check needs at least 20 years; otherwise the site says so.

## 4. Multiple testing (labelled)

The scanner now says it is a first look: each clue is tested on its own with ordinary Mann-Kendall. No family-wise or FDR correction is applied yet.

## 5. Tests added (now 51 local + 2 network)

- Near tie `[1, 1.0000004, 2, 3, 4]`: p = 0.0274863 (pymannkendall).
- Exact tie `[1, 1, 2, 3, 4]`: S = 9, Var(S) = 15.667, p = 0.0432627.
- Constant series for Mann-Kendall and for regression: explicit status, p = 1.
- Chi-square tail used by Ljung–Box against SciPy.
- AR(1) series: Ljung–Box (lags 5 and 10), ordinary Mann-Kendall and Hamed–Rao against Python.
- All 52 series: S equal to exact decimal arithmetic.

## Not done (open items from the review)

- Raw NASA provenance: manifests, checksums and extraction scripts are not in the repository.
- Seasonal Mann-Kendall across seasons; each season is still tested on its own.
- FDR / Benjamini–Hochberg adjustment for the scanner.
