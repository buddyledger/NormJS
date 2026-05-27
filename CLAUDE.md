# CLAUDE.md

Guidance for Claude Code (and other agents) working in this repository.

## What this is

NormJS is a single-page, client-side teaching tool for the normal distribution.
Side by side it renders the standard normal and a scaled (mean/SE) normal,
shades a confidence interval, marks a null-hypothesis value, reports the z test
statistic, and prints a standard normal cumulative (z) table.

Live: https://buddyledger.github.io/NormJS/normjs.html

## Layout

- `index.html` — meta-refresh redirect to `normjs.html`.
- `normjs.html` — the entire app: HTML, CSS, and JS in one file.
- `readme.md` — short project blurb.
- `Documentation.md` — user/technical docs. `Roadmap.md` — planned work.

There is no build step, package manager, or framework. Editing `normjs.html`
edits the app.

## External dependencies (CDN)

`normjs.html` loads three libraries from CDNs at runtime:
- Plotly (`plotly-2.24.1`) — plotting
- jStat (`jstat@1.9.6`) — normal pdf/cdf/inverse
- MathJax (`mathjax@3`) — equation rendering

The page is fully dependent on these; if they fail to load it cannot plot or
build the table. Keep the versions pinned.

## Running / testing

Open `normjs.html` in any browser — no server required.

Headless testing with Playwright works in principle (Chromium is available in
this environment). **However, in the sandboxed web environment outbound requests
to the CDNs are blocked by the network policy** (cert/proxy errors), so the
libraries never load and the app is non-functional there. To test end-to-end in
a restricted network you must vendor the libraries locally (see `Roadmap.md`).
Pure logic (table enumeration, the statistic math) can be checked with Node
without a browser.

## Conventions

- Keep everything in `normjs.html` unless there's a clear reason to split.
- The SE-based statistic is a z-statistic, not a t-statistic — label it `z`.
- `Z₀` in the standard panel is the standardized location of the null value,
  `(X₀ − m)/SE`, and must stay consistent with the red marker line.
- Iterate z-table rows/columns by integer index, never by accumulating floats.
- Validate inputs inline (no blocking `alert()`); keep the last valid view on
  screen when input is invalid.
