# CLAUDE.md

Guidance for Claude Code (and other agents) working in this repository.

## What this is

NormJS is a single-page, client-side teaching tool for the normal distribution.
Side by side, in standard units and in original units, it draws the null
distribution with its rejection region and the distribution around the observed
mean with its confidence interval, reports the z test statistic and p-value,
runs a sampling simulator, and prints a standard normal cumulative (z) table.

Live: https://buddyledger.github.io/NormJS/normjs.html

## Layout

- `index.html` — meta-refresh redirect to `normjs.html`.
- `normjs.html` — the entire app: HTML, CSS, and JS in one file.
- `vendor/` — pinned third-party libraries (Plotly, jStat, MathJax + fonts).
- `tests/`, `playwright.config.js`, `package.json` — dev-only smoke tests.
- `readme.md` — the GitHub landing page: what the tool does, how to run and
  test it, and the commit workflow.
- `Documentation.md` — user/technical docs. `Roadmap.md` — planned work.
- `docs/` — images used by the readme and documentation.

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

## Commits and pull requests

GitHub Pages publishes from `main`, so a change on `main` is live within a
minute or so.

- Docs, roadmap, tests and CI configuration: commit straight to `main`.
- Anything touching `normjs.html` or `vendor/` (or mixing app and docs
  changes): branch (`fix/…`, `feature/…`, `docs/…`), open a pull request, wait
  for the "Smoke tests" check, squash-merge, delete the branch.
- Commit subjects are imperative and say what changed; the body says why.
- Tick the `Roadmap.md` item in the change that completes it, and keep
  `readme.md` and `Documentation.md` in step with behaviour changes.
- If the look of the page changes noticeably, retake `docs/screenshot.png`
  (1280×860 viewport, state `#m=2.3&se=1&x0=0&t=two`).

## Conventions

- Keep everything in `normjs.html` unless there's a clear reason to split.
- The SE-based statistic is a z-statistic, not a t-statistic — label it `z`.
- Both plots are centred on the null value and show two curves: the null curve
  (on `X₀`, carrying the rejection regions) and the interval curve (on `m`,
  carrying the confidence interval). The standard panel is the scaled panel
  after `Z = (X − X₀)/SE`, so the red null marker is at 0 and the purple
  marker is the one test statistic, `z = (m − X₀)/SE`. Do not reintroduce a
  second, opposite-signed statistic (`Z₀`).
- Shape order in both plots is `[interval lower, interval upper, null value,
  observed mean or z]`; the drag handler and the tests rely on it.
- Iterate z-table rows/columns by integer index, never by accumulating floats.
- Validate inputs inline (no blocking `alert()`); keep the last valid view on
  screen when input is invalid.
