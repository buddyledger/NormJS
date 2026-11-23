# Roadmap

Ideas and planned improvements for NormJS, roughly ordered by value.

## Reliability
- [x] Vendor Plotly, jStat, and MathJax locally instead of loading from CDNs.
      Removes the single point of failure, and enables offline use plus
      end-to-end testing in restricted networks.
- [ ] Show a clear, visible message if a dependency fails to load, instead of a
      blank/broken page.

## Statistics
- [ ] Optional true t-distribution mode: accept sample size / degrees of freedom
      and switch the statistic and critical values from z to t.
- [x] Show the p-value alongside the test statistic.
- [x] One- vs two-tailed test selection.
- [ ] Show the interval bounds in original units (e.g. "95% CI: [a, b]"). The
      current "CI width: 95.00%" badge is the confidence level, not a width.

## Teaching content
- [ ] Rework the sampling simulator so it teaches SE rather than conflating it
      with SD: set a population σ and sample size n, draw repeated samples, and
      plot the sample means so that SE = σ/√n emerges.
- [ ] Consider conventional notation (`x̄`, `μ₀`) in place of `m` and `X₀`, and
      rename "Scaled Normal" to something like "Sampling distribution
      (original units)". Update the conventions in `CLAUDE.md` to match.
- [ ] Reduce the `Z₀` / `z` duplication in the equations: explain once that
      `z = −Z₀` instead of presenting two opposite-signed statistics side by
      side.
- [ ] Make the walkthrough interpret, not just compute: a plain-language reading
      of the p-value, a note that "fail to reject" is not "accept", and the link
      between the interval and the test (X₀ outside the 95% interval means
      reject at 5%, two-tailed).
- [ ] Worked scenarios: two or three preset stories (a factory claim, an exam
      average) that load values and give the numbers meaning.

## UX
- [ ] Clamp or normalize out-of-range inputs rather than only rejecting them.
      (Partly done: sliders and dragged markers clamp; typed values are still
      only rejected.)
- [x] Persist inputs in the URL (shareable links) or localStorage.
- [ ] Review keyboard accessibility and mobile layout. Known issue: the page
      scrolls horizontally at phone width (~324px).
- [x] Dark mode.
- [ ] Make changes to mean and SE visible: the scaled plot's axis is always
      m ± 4·SE, so only tick labels move. Add a fixed-axis option or a faint
      reference curve.
- [ ] Make α (or confidence level) a direct control; move the raw lower/upper
      percentiles to an advanced section.
- [ ] Promote the verdict to a prominent result strip showing z, p, α and the
      interval.
- [ ] Label the plots: a legend for the interval, rejection region, null and
      statistic markers, and a hint that the markers are draggable.
- [ ] Z-table as a lookup exercise: 4 decimals like printed tables, a
      row/column crosshair on hover, scroll to the highlighted cell, and
      highlight colours that match the plot (bounds versus statistic).
- [ ] Reorder the page: collapse the z-table by default or move it below the
      simulator.
- [ ] Show an active state on the 90/95/99% presets.
- [ ] Default the theme to the system preference (`prefers-color-scheme`).

## Visual design
- [ ] One meaning per colour across plots, table, badges and walkthrough. The
      interval is teal in the plots but blue in its badge, and the simulator's
      theoretical curve uses the red reserved for the null/rejection.
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
- [ ] Fix z-table column alignment at range boundaries (out-of-range cells are
      skipped rather than rendered empty, which shifts columns).
- [ ] Add an automated test suite (logic-level, plus headless browser once the
      libraries are vendored).
- [ ] Typeset only the equation containers on update instead of re-running
      MathJax over the whole page.

## Docs
- [ ] Bring `Documentation.md` up to date with the redesign (tail selection,
      p-value, walkthrough, sampling simulator, export, sharing, dark mode).
- [ ] Add screenshots or a short usage GIF to the documentation.
