const { test, expect } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');

const PAGE_URL = pathToFileURL(path.resolve(__dirname, '..', 'normjs.html')).href;

// Open the app with the given URL-hash state and wait for the first render.
async function open(page, params = {}) {
    const hash = new URLSearchParams(params).toString();
    await page.goto(PAGE_URL + (hash ? '#' + hash : ''));
    await expect(page.locator('#plot-standard.js-plotly-plot')).toBeVisible();
}

// Read the standard panel's markers and shaded rejection regions from Plotly.
function standardPanel(page) {
    return page.evaluate(() => {
        const gd = document.getElementById('plot-standard');
        const [ciLower, ciUpper, z0, zStat] = gd.layout.shapes.map(s => s.x0);
        // data[0] is the curve, data[1] the interval shading, the rest are rejection regions.
        const rejections = gd.data.slice(2).map(t => [Math.min(...t.x), Math.max(...t.x)]);
        return { ciLower, ciUpper, z0, zStat, rejections };
    });
}

test('loads from disk with vendored libraries and no network', async ({ page }) => {
    const errors = [], external = [];
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('request', r => { if (!r.url().startsWith('file:')) external.push(r.url()); });

    await open(page);

    const libs = await page.evaluate(() => ({
        plotly: window.Plotly && Plotly.version,
        jstat: typeof (window.jStat && jStat.normal.cdf),
        mathjax: window.MathJax && MathJax.version,
    }));
    expect(libs).toEqual({ plotly: '2.24.1', jstat: 'function', mathjax: '3.2.2' });

    await expect(page.locator('.js-plotly-plot')).toHaveCount(3);
    await expect(page.locator('mjx-container').first()).toBeVisible();
    await expect(page.locator('#error-message')).toHaveText('');

    // Default z-table: -3.0 .. 3.0 with a real, sticky header row.
    await expect(page.locator('#table-combined thead th')).toHaveCount(11);
    await expect(page.locator('#table-combined tbody tr')).toHaveCount(62);
    const headerPosition = await page.locator('#table-combined thead th').first()
        .evaluate(el => getComputedStyle(el).position);
    expect(headerPosition).toBe('sticky');

    expect(external).toEqual([]);
    expect(errors).toEqual([]);
});

test('default state: 95% two-tailed, statistic at zero', async ({ page }) => {
    await open(page);
    await expect(page.locator('#output-standard')).toContainText('α = 0.0500');
    await expect(page.locator('#output-standard')).toContainText('p = 1.0000 (two-tailed)');
    await expect(page.locator('#output-standard')).toContainText('Fail to reject H₀');

    const s = await standardPanel(page);
    expect(s.ciLower).toBeCloseTo(-1.96, 2);
    expect(s.ciUpper).toBeCloseTo(1.96, 2);
    expect(s.zStat).toBeCloseTo(0, 6);
});

test('right-tailed: statistic marker sits in the rejection region when rejecting', async ({ page }) => {
    await open(page, { m: 2, se: 1, x0: 0, t: 'right' });
    await expect(page.locator('#output-standard')).toContainText('p = 0.0228 (right-tailed)');
    await expect(page.locator('#output-standard')).toContainText('Reject H₀');

    const s = await standardPanel(page);
    expect(s.zStat).toBeCloseTo(2, 6);
    expect(s.z0).toBeCloseTo(-2, 6);          // Z0 = (X0 - m)/SE stays on the red marker
    expect(s.rejections).toHaveLength(1);
    const [lo, hi] = s.rejections[0];
    expect(lo).toBeCloseTo(1.645, 3);
    expect(s.zStat).toBeGreaterThan(lo);
    expect(s.zStat).toBeLessThan(hi);
});

test('left-tailed: same data does not reject, marker outside the region', async ({ page }) => {
    await open(page, { m: 2, se: 1, x0: 0, t: 'left' });
    await expect(page.locator('#output-standard')).toContainText('Fail to reject H₀');

    const s = await standardPanel(page);
    expect(s.rejections).toHaveLength(1);
    expect(s.rejections[0][1]).toBeCloseTo(-1.645, 3);
    expect(s.zStat).toBeGreaterThan(s.rejections[0][1]);
});

test('asymmetric interval: two-tailed regions stay symmetric and agree with p', async ({ page }) => {
    await open(page, { l: 1, u: 97, m: 2, se: 1, x0: 0, t: 'two' });
    await expect(page.locator('#output-standard')).toContainText('α = 0.0400');
    await expect(page.locator('#output-standard')).toContainText('p = 0.0455 (two-tailed)');
    await expect(page.locator('#output-standard')).toContainText('Fail to reject H₀');

    const s = await standardPanel(page);
    expect(s.rejections).toHaveLength(2);
    const [left, right] = s.rejections;
    expect(left[1]).toBeCloseTo(-2.054, 3);
    expect(right[0]).toBeCloseTo(2.054, 3);
    // The statistic (2.00) is outside both regions, matching "fail to reject".
    expect(s.zStat).toBeGreaterThan(left[1]);
    expect(s.zStat).toBeLessThan(right[0]);
});

test('invalid input shows an inline message and keeps the last valid view', async ({ page }) => {
    await open(page, { m: 2, se: 1, x0: 0, t: 'right' });
    await expect(page.locator('#output-standard')).toContainText('Reject H₀');

    await page.locator('#stddev').fill('0');
    await expect(page.locator('#error-message')).toHaveText('Standard error must be positive.');
    await expect(page.locator('#output-standard')).toContainText('Reject H₀');
    await expect(page.locator('.js-plotly-plot')).toHaveCount(3);

    await page.locator('#stddev').fill('1');
    await expect(page.locator('#error-message')).toHaveText('');
});

test('interval badge shows the confidence level and bounds in x units', async ({ page }) => {
    await open(page);
    await expect(page.locator('#output-scaled')).toHaveText('95% CI: [-1.96, 1.96]');

    // A hash-only change does not reload the page, so reload to pick up the new state.
    await open(page, { l: 5, u: 95, m: 10, se: 2 });
    await page.reload();
    await expect(page.locator('#output-scaled')).toHaveText('90% CI: [6.71, 13.29]');
});

// Text of every body row of the z-table, as arrays of cell strings.
function tableRows(page) {
    return page.locator('#table-combined tbody tr').evaluateAll(rows =>
        rows.map(r => [...r.cells].map(c => c.textContent)));
}

test('z-table keeps columns aligned when the range starts mid-row', async ({ page }) => {
    await open(page, { mn: 0.05, mx: 1 });
    const rows = await tableRows(page);
    expect(rows.map(r => r[0])).toEqual(['0.0', '0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '1.0']);
    for (const r of rows) expect(r).toHaveLength(11);
    // Row 0.0: columns 0.00-0.04 are out of range and empty; 0.05 sits under its own header.
    expect(rows[0].slice(1, 6)).toEqual(['', '', '', '', '']);
    expect(rows[0][6]).toBe('0.519939');
    // Row 1.0: only 1.00 is in range.
    expect(rows[10][1]).toBe('0.841345');
    expect(rows[10].slice(2)).toEqual(Array(9).fill(''));
});

test('z-table includes a negative row that is only partly in range', async ({ page }) => {
    await open(page, { mn: -1, mx: -0.56 });
    const rows = await tableRows(page);
    expect(rows.map(r => r[0])).toEqual(['-1.0', '-0.9', '-0.8', '-0.7', '-0.6', '-0.5']);
    for (const r of rows) expect(r).toHaveLength(11);
    // Row -0.5: -0.50..-0.55 are above the range; -0.56..-0.59 are shown.
    expect(rows[5].slice(1, 7)).toEqual(Array(6).fill(''));
    expect(rows[5][7]).toBe('0.287740');
});

test('no horizontal page scroll at phone width', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await open(page);
    await expect(page.locator('mjx-container').first()).toBeVisible();
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
});

test('a missing core library shows a clear message instead of a blank page', async ({ page }) => {
    await page.route('**/vendor/plotly/**', route => route.abort());
    await page.goto(PAGE_URL);
    await expect(page.locator('#load-error')).toBeVisible();
    await expect(page.locator('#load-error')).toContainText('NormJS could not start');
    await expect(page.locator('#load-error')).toContainText('Plotly failed to load');
    await expect(page.locator('.inputs')).toBeHidden();
    await expect(page.locator('#standard-normal-plot')).toBeHidden();
});

test('missing MathJax only warns; plots and table still work', async ({ page }) => {
    await page.route('**/vendor/mathjax/**', route => route.abort());
    await open(page);
    await expect(page.locator('#load-error')).toBeVisible();
    await expect(page.locator('#load-error')).toContainText('MathJax failed to load');
    await expect(page.locator('.js-plotly-plot')).toHaveCount(3);
    await expect(page.locator('#table-combined tbody tr')).toHaveCount(62);
});
