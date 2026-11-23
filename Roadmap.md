# Roadmap

Ideas and planned improvements for NormJS, roughly ordered by value.

## Reliability
- [x] Vendor Plotly, jStat, and MathJax locally instead of loading from CDNs.
      Removes the single point of failure, and enables offline use plus
      end-to-end testing in restricted networks.
- [x] Show a clear, visible message if a dependency fails to load, instead of a
      blank/broken page.

## Statistics
- [ ] Optional true t-distribution mode: accept sample size / degrees of freedom
      and switch the statistic and critical values from z to t.
- [x] Show the p-value alongside the test statistic.
- [x] One- vs two-tailed test selection.
- [x] Show the interval bounds in original units (e.g. "95% CI: [a, b]"). The
      current "CI width: 95.00%" badge is the confidence level, not a width.

## Teaching content
- [ ] Rework the sampling simulator so it teaches SE rather than conflating it
      with SD: set a population σ and sample size n, draw repeated samples, and
      plot the sample means so that SE = σ/√n emerges.
- [ ] Consider conventional notation (`x̄`, `μ₀`) in place of `m` and `X₀`, and
      rename "Scaled Normal" to something like "Sampling distribution
      (original units)". Update the conventions in `CLAUDE.md` to match.
- [x] Reduce the `Z₀` / `z` duplication in the equations: explain once that
      `z = −Z₀` instead of presenting two opposite-signed statistics side by
      side. (Done by re-centring both plots on the null value and drawing the
      null curve and the interval curve; `Z₀` is gone.)
- [x] Make the walkthrough interpret, not just compute: a plain-language reading
      of the p-value, a note that "fail to reject" is not "accept", and the link
      between the interval and the test (X₀ outside the 95% interval means
      reject at 5%, two-tailed).
- [ ] Standardizing animation: a "Standardize" button that slides and squeezes
      the scaled curve, with its markers, onto the standard normal, to show
      that Z = (X − m)/SE is a shift followed by a rescale.
- [ ] p-value animation: sweep the tail area in from the statistic outwards
      when the p-value changes, so students see p as an area.
- [ ] Simulator: let a run be replayed slowly, and show a running plot of
      "share of draws inside the interval" against n, so the settling towards
      the confidence level is visible as a line.
- [ ] Worked scenarios: two or three preset stories (a factory claim, an exam
      average) that load values and give the numbers meaning.
- [ ] Confidence-interval coverage simulation: draw 100 samples, plot their
      intervals as stacked bars, and colour the ones that miss the true mean,
      to show what "95% confident" means.
- [ ] Power and Type II error: overlay an alternative distribution next to the
      null one and shade β and power. (The null curve is now drawn; this needs
      a true-mean input and the β shading.)
- [ ] Predict-then-reveal mode: hide the verdict and p-value until the student
      commits to "reject" or "fail to reject".
- [ ] Probability lookup mode: answer "what is P(a < X < b)?" and the inverse,
      "which x has 90% below it?".
- [ ] 68–95–99.7 rule overlay: a toggle that shades ±1, ±2 and ±3 SE bands.

## For teachers
- [ ] Embed mode: a URL flag that hides the header and toolbar so the tool fits
      in an LMS page or slide.
- [ ] Print stylesheet: a one-page handout of the current state (plots,
      walkthrough and the relevant table rows).

## UX
- [ ] Clamp or normalize out-of-range inputs rather than only rejecting them.
      (Partly done: sliders and dragged markers clamp; typed values are still
      only rejected.)
- [x] Persist inputs in the URL (shareable links) or localStorage.
- [ ] Review keyboard accessibility and mobile layout. (The horizontal scroll
      at phone width is fixed; the rest is still to review.)
- [ ] React to URL hash changes: pasting a shared link into a tab that already
      has the app open currently needs a reload to take effect.
- [x] Dark mode.
- [x] Make changes to mean and SE visible: the scaled plot's axis is always
      m ± 4·SE, so only tick labels move. Add a fixed-axis option or a faint
      reference curve. (Done with a reference curve of the standard normal;
      it is left out when the two curves are too far apart in position or
      scale to share an axis.)
- [ ] Make α (or confidence level) a direct control; move the raw lower/upper
      percentiles to an advanced section.
- [ ] Promote the verdict to a prominent result strip showing z, p, α and the
      interval.
- [x] Label the plots: a legend for the interval, rejection region, null and
      statistic markers, and a hint that the markers are draggable.
- [ ] Z-table as a lookup exercise: 4 decimals like printed tables, a
      row/column crosshair on hover, scroll to the highlighted cell, and
      highlight colours that match the plot (bounds versus statistic).
- [ ] Reorder the page: collapse the z-table by default or move it below the
      simulator.
- [ ] Show an active state on the 90/95/99% presets.
- [ ] Default the theme to the system preference (`prefers-color-scheme`).
- [ ] Tell the user when "Copy link" fails (clipboard access denied) instead of
      failing silently.
- [x] Say so when changing the mean or SE clears the simulator's samples.
- [x] Simulator: draw 1, 10, 100 or 1000 values at a time, shown as stacked
      dots that become histogram bars past 400 draws, with the share of draws
      inside the interval.
- [ ] Add `aria-pressed` to the tail buttons; the selected one is currently
      shown by colour only.
- [ ] Give each plot a one-line text alternative for screen readers.

## Visual design
- [ ] One meaning per colour across plots, table, badges and walkthrough. The
      interval is teal in the plots but blue in its badge. (The simulator's
      curve no longer uses the red reserved for the null and rejection.)
- [ ] Give the page more character than a generic dashboard: a serif or
      mathematical face for numbers and notation to tie in with the MathJax
      equations.
- [ ] Give the plots more weight: a taller main plot and a light fill under the
      curve.
- [ ] Replace the hard-coded green on the "fail to reject" badge with a theme
      variable.

## Code quality
- [x] Remove the dead `start === end` float-equality guards in the plot
      functions.
- [x] Fix z-table column alignment at range boundaries (out-of-range cells are
      skipped rather than rendered empty, which shifts columns).
- [x] Playwright smoke tests (page loads offline, plots/equations/table render,
      one-tailed, asymmetric and invalid-input cases) run by GitHub Actions on
      each pull request.
- [ ] Extend the test suite: logic-level tests for the z-table enumeration and
      statistic math, plus browser tests for dragging markers, the simulator
      and CSV/PNG export.
- [x] Add a `.gitattributes` that keeps `vendor/` byte-identical to upstream
      (no line-ending conversion) and marks it as vendored.
- [x] Add a `LICENSE` file for the project itself so others can reuse it
      (MIT).
- [ ] Typeset only the equation containers on update instead of re-running
      MathJax over the whole page.

## Docs
- [x] Bring `Documentation.md` up to date with the redesign (tail selection,
      p-value, walkthrough, sampling simulator, export, sharing, dark mode).
- [x] Rewrite `readme.md` as a descriptive landing page and document the
      commit and pull-request workflow.
- [ ] Add screenshots or a short usage GIF to the documentation. (One
      screenshot is in; a GIF of dragging a marker is still to do.)
