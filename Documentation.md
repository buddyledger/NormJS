# NormJS — Documentation

NormJS is an interactive visualization of the normal distribution for teaching
and exploring confidence intervals and z-based hypothesis tests. It runs
entirely in the browser with no server or build step.

Live: https://buddyledger.github.io/NormJS/normjs.html

## Inputs

| Field | Meaning | Default |
|-------|---------|---------|
| Lower Confidence Interval (%) | Lower percentile of the interval | 2.5 |
| Upper Confidence Interval (%) | Upper percentile of the interval | 97.5 |
| Mean (m) | Center of the scaled normal | 0 |
| Standard Error (SE) | Spread of the scaled normal (must be > 0) | 1 |
| Null Hypothesis (X₀) | Value being tested against | 0 |
| Minimum Z / Maximum Z | Range of the cumulative z-table | -3 / 3 |

Inputs are validated live. Invalid combinations (non-numeric entries,
percentages outside 0–100, lower ≥ upper, SE ≤ 0, min Z ≥ max Z) show an inline
message and the last valid view is kept.

## What it shows

### Standard Normal panel
The standard normal density N(0, 1), with the confidence region shaded between
the percentile z-scores and a marker at **Z₀ = (X₀ − m)/SE** — the standardized
location of the null value (this matches the red marker line).

### Scaled Normal panel
The normal density N(m, SE) with the same confidence region shaded in the
original units, a marker at X₀, and the test statistic:

    z = (m − X₀) / SE

Because SE is used (not a sample standard deviation with degrees of freedom),
this is a **z-statistic**, not a t-statistic.

### Cumulative z-table
A standard normal CDF table over the chosen Z range, laid out like a printed
z-table (tenths down the rows, hundredths across the columns). Cells matching
the interval bounds or Z₀ are highlighted.

## The math

- Density: `f(x) = 1 / (SE·√(2π)) · exp(−(x − m)² / (2·SE²))`
- Percentile → z-score: `z_p = Φ⁻¹(p)`
- Scaled interval bound: `x = m + z·SE`
- Standardized null value: `Z₀ = (X₀ − m) / SE`
- Test statistic: `z = (m − X₀) / SE = −Z₀`

## Dependencies

Plotly 2.24.1, jStat 1.9.6, and MathJax 3, all loaded from CDNs at runtime. An
internet connection (and reachable CDNs) is required unless the libraries are
vendored locally.
