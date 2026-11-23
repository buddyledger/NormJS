# Vendored libraries

Third-party libraries used by `normjs.html`, copied here unmodified so the app
runs with no network access. Keep the versions pinned; to upgrade, replace the
files from the source URL and update the `<script>` tags in `normjs.html`.

| Library | Version | Licence | Files | Source |
|---------|---------|---------|-------|--------|
| Plotly.js | 2.24.1 | MIT (header in file) | `plotly/plotly-2.24.1.min.js` | `https://cdn.plot.ly/plotly-2.24.1.min.js` |
| jStat | 1.9.6 | MIT (`jstat/LICENSE`) | `jstat/jstat-1.9.6.min.js` | `https://cdn.jsdelivr.net/npm/jstat@1.9.6/dist/jstat.min.js` |
| MathJax | 3.2.2 | Apache-2.0 (`mathjax/LICENSE`) | `mathjax/tex-mml-chtml.js`, `mathjax/output/chtml/fonts/woff-v2/*.woff` | `https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/` |

## MathJax layout

MathJax resolves its web fonts relative to the script's own location, so the
`output/chtml/fonts/woff-v2/` path under `mathjax/` must be kept as is.

Only the combined `tex-mml-chtml.js` component and its fonts are vendored.
Optional pieces that MathJax loads on demand (extra TeX extensions via
`\require`, the accessibility explorer from its context menu) are not included
and will fail to load if requested.
