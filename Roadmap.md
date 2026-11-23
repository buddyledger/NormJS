# Roadmap

Ideas and planned improvements for NormJS, roughly ordered by value.

## Reliability
- [ ] Vendor Plotly, jStat, and MathJax locally instead of loading from CDNs.
      Removes the single point of failure, and enables offline use plus
      end-to-end testing in restricted networks.
- [ ] Show a clear, visible message if a dependency fails to load, instead of a
      blank/broken page.

## Statistics
- [ ] Optional true t-distribution mode: accept sample size / degrees of freedom
      and switch the statistic and critical values from z to t.
- [x] Show the p-value alongside the test statistic.
- [x] One- vs two-tailed test selection.

## UX
- [ ] Clamp or normalize out-of-range inputs rather than only rejecting them.
      (Partly done: sliders and dragged markers clamp; typed values are still
      only rejected.)
- [x] Persist inputs in the URL (shareable links) or localStorage.
- [ ] Review keyboard accessibility and mobile layout.
- [x] Dark mode.

## Code quality
- [x] Remove the dead `start === end` float-equality guards in the plot
      functions.
- [ ] Fix z-table column alignment at range boundaries (out-of-range cells are
      skipped rather than rendered empty, which shifts columns).
- [ ] Add an automated test suite (logic-level, plus headless browser once the
      libraries are vendored).

## Docs
- [ ] Add screenshots or a short usage GIF to the documentation.
