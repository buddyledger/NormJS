# NormJS — Documentation

NormJS is an interactive visualization of the normal distribution for teaching
and exploring confidence intervals and z-based hypothesis tests. It runs
entirely in the browser with no server or build step.

Live: https://buddyledger.github.io/NormJS/normjs.html

![NormJS showing a two-tailed z-test that rejects the null hypothesis](docs/screenshot.png)

## Controls

Each numeric field has a slider beneath it; the two stay in sync.

| Group | Field | Meaning | Default |
|-------|-------|---------|---------|
| Confidence Interval | Lower (%) | Lower percentile of the interval | 2.5 |
| Confidence Interval | Upper (%) | Upper percentile of the interval | 97.5 |
| Confidence Interval | 90% / 95% / 99% | Set a central interval of that level | — |
| Scaled Distribution | Mean (m) | Centre of the scaled normal | 0 |
| Scaled Distribution | Std. Error (SE) | Spread of the scaled normal (must be > 0) | 1 |
| Scaled Distribution | Null (X₀) | Value being tested against | 0 |
| Hypothesis Test | Two-tailed / Left / Right | Direction of the alternative hypothesis | Two-tailed |
| Z-table | Minimum Z / Maximum Z | Range of the cumulative z-table | -3 / 3 |

The sliders cover a limited range (for example −10 to 10 for the mean); type
into the field to go beyond it.

Inputs are validated as you type. Invalid combinations (non-numeric entries,
percentages outside 0–100, lower ≥ upper, SE ≤ 0, min Z ≥ max Z) show a message
under the controls, and the last valid view stays on screen.

### Dragging markers

The vertical markers on both plots can be dragged. Dragging an interval bound
changes the lower or upper percentile, and dragging the null marker changes X₀.
On the standard plot, dragging the purple statistic marker also changes X₀,
since the statistic is defined by it.

### Toolbar

- **Copy link** copies the current address, which encodes every input (see
  [Shareable links](#shareable-links)).
- **Reset** restores the defaults.
- **Dark mode** switches the theme. The choice is remembered in the browser.

## What it shows

### Standard Normal panel

The standard normal density N(0, 1), with:

- the confidence region shaded between the two percentile z-scores, which are
  marked with dotted teal lines labelled `z*`;
- a red dash-dot marker at **Z₀ = (X₀ − m)/SE**, the standardized location of
  the null value;
- a solid purple marker at the test statistic **z = (m − X₀)/SE = −Z₀**;
- the rejection region or regions for the chosen test shaded red, labelled with
  their area.

H₀ is rejected exactly when the purple marker falls in a red region. Two-tailed
regions are always symmetric (α/2 in each tail), even if the interval
percentiles are not.

Below the plot are α, the p-value and the verdict ("Reject H₀" or "Fail to
reject H₀").

### Scaled Normal panel

The normal density N(m, SE) with the same confidence region shaded in the
original units, a marker at X₀, and the interval bounds, for example
"95% CI: [0.34, 4.26]".

Because SE is used (not a sample standard deviation with degrees of freedom),
the statistic is a **z-statistic**, not a t-statistic.

### Equations

Each panel has a collapsible "Equations" section that shows the density and
the standardizing formulas with the current values substituted in.

### Reading this test

A written walkthrough of the current test in five steps: the hypotheses, the
test statistic, the significance level, the p-value and the decision.

### Cumulative z-table

A standard normal CDF table over the chosen Z range, laid out like a printed
z-table (tenths down the rows, hundredths across the columns). Values outside
the chosen range are left blank so the columns stay aligned. Cells matching
the interval bounds or Z₀ are highlighted. The header row stays in view while
scrolling, and the section can be collapsed.

### Sampling Simulator

"Draw samples" adds 300 random values from N(m, SE) to a histogram, in small
batches, with the theoretical curve drawn over it. The sample count, mean and
standard deviation are shown next to the theoretical values. "Clear" empties
the histogram; changing the mean or SE also clears it, because the samples no
longer belong to the distribution on screen.

## The hypothesis test

- Hypotheses: H₀: m = X₀, against H₁: m ≠ X₀ (two-tailed), m < X₀ (left) or
  m > X₀ (right).
- Significance level: `α = 1 − (upper% − lower%) / 100`. The default 2.5–97.5
  interval gives α = 0.05.
- Critical values: `±Φ⁻¹(1 − α/2)` two-tailed, `Φ⁻¹(α)` left-tailed,
  `Φ⁻¹(1 − α)` right-tailed.
- p-value: `2·(1 − Φ(|z|))` two-tailed, `Φ(z)` left-tailed, `1 − Φ(z)`
  right-tailed.
- Decision: reject H₀ when p < α.

## The math

- Density: `f(x) = 1 / (SE·√(2π)) · exp(−(x − m)² / (2·SE²))`
- Percentile → z-score: `z_p = Φ⁻¹(p)`
- Scaled interval bound: `x = m + z·SE`
- Standardized null value: `Z₀ = (X₀ − m) / SE`
- Test statistic: `z = (m − X₀) / SE = −Z₀`

## Shareable links

The address bar is updated on every change, so the current address always
reproduces the current view. The state is stored after the `#`:

| Key | Input |
|-----|-------|
| `l`, `u` | Lower and upper percentile |
| `m`, `se`, `x0` | Mean, standard error, null value |
| `mn`, `mx` | Minimum and maximum Z of the table |
| `t` | Test direction: `two`, `left` or `right` |

For example, `normjs.html#m=2&se=1&x0=0&t=right` opens a right-tailed test with
z = 2. Keys that are left out keep their defaults.

The link is read when the page loads. If NormJS is already open in the tab,
reload after pasting a new link.

## Export

- **PNG** on each plot downloads that plot as an image.
- **CSV** on the z-table downloads the table as shown, blanks included.

## Dependencies

Plotly 2.24.1, jStat 1.9.6, and MathJax 3.2.2, vendored under `vendor/` and
loaded from there. No internet connection is needed; the `vendor/` folder must
stay alongside `normjs.html`. See `vendor/README.md` for sources and licences.

If Plotly or jStat fails to load, the page shows a message saying so instead of
a blank view. If only MathJax fails, a warning is shown and everything except
equation rendering still works.

## Development

See the [readme](readme.md#development) for running the tests, the commit and
pull-request workflow, and the repository layout.
