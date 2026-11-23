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
- `vendor/` — pinned third-party libraries (Plotly, jStat, MathJax + fonts).
- `tests/`, `playwright.config.js`, `package.json` — dev-only smoke tests.
- `readme.md` — short project blurb.
- `Documentation.md` — user/technical docs. `Roadmap.md` — planned work.

There is no build step, package manager, or framework. Editing `normjs.html`
edits the app.

## Dependencies (vendored)

`normjs.html` loads three libraries from `vendor/` (no CDN, no network):
- Plotly (`vendor/plotly/plotly-2.24.1.min.js`) — plotting
- jStat (`vendor/jstat/jstat-1.9.6.min.js`) — normal pdf/cdf/inverse
- MathJax 3.2.2 (`vendor/mathjax/tex-mml-chtml.js` plus its fonts) — equation
  rendering

The page is fully dependent on these; if they fail to load it cannot plot or
build the table. Keep the versions pinned and the files unmodified. MathJax
finds its fonts relative to its own script, so keep the directory layout under
`vendor/mathjax/`. See `vendor/README.md` for sources and upgrade notes.

## Running / testing

Open `normjs.html` in any browser — no server required.

Because the libraries are vendored, the app also works end-to-end in restricted
networks, so headless testing with Playwright (Chromium) needs no outbound
access. To serve it over HTTP, run `python -m http.server 8765` from the repo
root and open `http://localhost:8765/normjs.html` (`.claude/launch.json` has
this as the `normjs-static` preview). Pure logic (table enumeration, the
statistic math) can be checked with Node without a browser.

### Smoke tests

`tests/smoke.spec.js` is a Playwright suite that opens `normjs.html` from disk
(`file://`, no server) and checks that the libraries load with no network
requests, the plots, equations and z-table render, and the one-tailed,
asymmetric-interval and invalid-input cases give the right picture and verdict.

    npm ci
    npx playwright install chromium   # first time only
    npm test

GitHub Actions (`.github/workflows/test.yml`) runs the suite on every pull
request and on pushes to `main`. `package.json` exists only for this dev
tooling; the app still has no build step. When behaviour changes, update or add
a test alongside it.

## Conventions

- Keep everything in `normjs.html` unless there's a clear reason to split.
- The SE-based statistic is a z-statistic, not a t-statistic — label it `z`.
- `Z₀` in the standard panel is the standardized location of the null value,
  `(X₀ − m)/SE`, and must stay consistent with the red marker line.
- Iterate z-table rows/columns by integer index, never by accumulating floats.
- Validate inputs inline (no blocking `alert()`); keep the last valid view on
  screen when input is invalid.
