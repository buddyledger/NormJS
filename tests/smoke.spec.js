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

// Read a panel's markers, shaded rejection regions and curves from Plotly. In both panels
// the shapes are [interval lower, interval upper, null value, observed mean or z].
function readPanel(page, id) {
    return page.evaluate(id => {
        const gd = document.getElementById(id);
        const [ciLower, ciUpper, nullLine, stat] = gd.layout.shapes.map(s => s.x0);
        const rejections = gd.data.filter(t => t.name === 'rejection').map(t => [Math.min(...t.x), Math.max(...t.x)]);
        // Where a curve peaks, i.e. what it is centred on.
        const peak = name => { const t = gd.data.find(t => t.name === name); return t ? t.x[t.y.indexOf(Math.max(...t.y))] : null; };
        return { ciLower, ciUpper, nullLine, zStat: stat, stat, rejections, range: gd.layout.xaxis.range,
                 names: gd.data.map(t => t.name), peak: { null: peak('null'), interval: peak(id === 'plot-standard' ? 'interval-curve' : 'scaled') } };
    }, id);
}
const standardPanel = page => readPanel(page, 'plot-standard');

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
    expect(s.nullLine).toBe(0);               // the null value is the origin of the standard plot
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

// X range of the scaled plot and whether the standard-normal reference curve is drawn.
function scaledPanel(page) {
    return page.evaluate(() => {
        const gd = document.getElementById('plot-scaled');
        return { range: gd.layout.xaxis.range, hasReference: gd.data.some(t => t.name === 'reference') };
    });
}

test('scaled plot shows the standard normal for reference and widens the axis to fit it', async ({ page }) => {
    await open(page);
    let s = await scaledPanel(page);
    expect(s.hasReference).toBe(true);
    expect(s.range).toEqual([-4, 4]);
    await expect(page.locator('#explain-scaled')).toContainText('the blue curve is the standard normal itself');

    await open(page, { m: 2.3, se: 1.5 });
    await page.reload();
    s = await scaledPanel(page);
    expect(s.hasReference).toBe(true);
    expect(s.range[0]).toBeCloseTo(-6, 6);      // null curve's left edge, X₀ − 4·SE
    expect(s.range[1]).toBeCloseTo(8.3, 6);     // m + 4·SE
    await expect(page.locator('#explain-scaled')).toContainText('shifted right by 2.3');
    await expect(page.locator('#explain-scaled')).toContainText('1.5× as wide and 0.67× as tall');
});

test('reference curve is left out only when it is too far away to share the axis', async ({ page }) => {
    await open(page, { m: 100, se: 1, x0: 100 });
    const s = await scaledPanel(page);
    expect(s.hasReference).toBe(false);
    expect(s.range).toEqual([96, 104]);
    await expect(page.locator('#explain-scaled')).toContainText('The standard normal is not drawn here');
});

test('reference curve stays at a high SE, with the scaled curves kept readable', async ({ page }) => {
    await open(page, { se: 10 });
    const s = await scaledPanel(page);
    expect(s.hasReference).toBe(true);
    expect(s.range).toEqual([-40, 40]);
    // The reference peak (0.399) is exactly 10× the scaled peak here, so nothing is cut off yet.
    const yMax = await page.evaluate(() => document.getElementById('plot-scaled').layout.yaxis.range[1]);
    expect(yMax).toBeCloseTo(1.06 * 0.39894, 3);

    await open(page, { se: 40 });
    await page.reload();
    const tall = await scaledPanel(page);
    expect(tall.hasReference).toBe(true);
    const capped = await page.evaluate(() => document.getElementById('plot-scaled').layout.yaxis.range[1]);
    expect(capped).toBeCloseTo(1.06 * 10 * 0.39894 / 40, 4);
    await expect(page.locator('#explain-scaled')).toContainText('its top is cut off');
});

// Names and point counts of the simulator's traces.
function samplingTraces(page) {
    return page.evaluate(() => Object.fromEntries(
        document.getElementById('plot-sampling').data.map(t => [t.name, t.x.length])));
}

test('simulator: draws are blocks, then bars, and are cleared when the curve changes', async ({ page }) => {
    await open(page);
    const stats = page.locator('#sampling-stats');
    await expect(stats).toContainText('No draws yet');

    await page.getByRole('button', { name: 'Draw 10', exact: true }).click();
    await expect(stats).toContainText('n = 10 ·');
    await expect(stats).toContainText('of 10 (');
    let t = await samplingTraces(page);
    expect(t.draws + t['draws-outside']).toBe(10);
    expect(t.latest).toBe(1);
    expect(t.bars).toBeUndefined();

    await page.getByRole('button', { name: 'Draw 1', exact: true }).click();
    await expect(stats).toContainText('n = 11 ·');

    await page.getByRole('button', { name: 'Draw 1000', exact: true }).click();
    await expect(stats).toContainText('n = 1011 ·');
    t = await samplingTraces(page);
    expect(t.bars).toBe(40);
    expect(t.draws).toBeUndefined();
    await expect(page.locator('#sampling-note')).toContainText('each column is drawn as a single bar');

    await page.locator('#mean').fill('1');
    await expect(stats).toContainText('cleared because the mean or SE changed');

    await page.getByRole('button', { name: 'Draw 100', exact: true }).click();
    await expect(stats).toContainText('n = 100 ·');
    await page.getByRole('button', { name: 'Clear', exact: true }).click();
    await expect(stats).toContainText('No draws yet');
});

test('simulator adds all draws at once when reduced motion is requested', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page);
    await page.getByRole('button', { name: 'Draw 100', exact: true }).click();
    await expect(page.locator('#sampling-stats')).toContainText('n = 100 ·', { timeout: 300 });
});

test('walkthrough interprets the result and links the interval to the test', async ({ page }) => {
    await open(page, { m: 2.3, se: 1, x0: 0, t: 'two' });
    const walk = page.locator('#walkthrough');
    await expect(walk).toContainText('would turn up in about 2.1% of samples');
    await expect(walk).toContainText('X₀ = 0.00 lies outside the 95% interval [0.34, 4.26]');

    await open(page, { m: 1, se: 1, x0: 0, t: 'two' });
    await page.reload();
    await expect(walk).toContainText('This does not show that H₀ is true');
    await expect(walk).toContainText('X₀ = 0.00 lies inside the 95% interval');

    // The interval only matches a two-tailed test.
    await open(page, { m: 1, se: 1, x0: 0, t: 'right' });
    await page.reload();
    await expect(walk).toContainText('this high or higher');
    await expect(walk).not.toContainText('Same answer from the interval');
});

test('both panels are centred on the null value and show both curves', async ({ page }) => {
    await open(page, { m: 2.3, se: 1.5, x0: 0.5, t: 'two' });

    // Standard plot: null curve at 0, interval curve at z = 1.2, one statistic and no mirror marker.
    const z = await standardPanel(page);
    expect(z.names).toEqual(['null', 'rejection', 'rejection', 'interval-curve', 'interval']);
    expect(z.nullLine).toBe(0);
    expect(z.stat).toBeCloseTo(1.2, 6);
    expect(z.peak.null).toBeCloseTo(0, 1);
    expect(z.peak.interval).toBeCloseTo(1.2, 1);
    expect(z.ciLower).toBeCloseTo(1.2 - 1.96, 2);
    expect(z.ciUpper).toBeCloseTo(1.2 + 1.96, 2);
    expect(z.range[0]).toBeCloseTo(-4, 6);
    expect(z.range[1]).toBeCloseTo(5.2, 6);     // widened to fit the interval curve
    await expect(page.locator('#explain-standard')).toContainText('The observed mean lands at z = 1.20');
    await expect(page.locator('#explain-standard')).toContainText('outside the red shading, so H₀ is not rejected');
    await expect(page.locator('#standard-normal-plot')).not.toContainText('Z₀');

    // Scaled plot: the same picture in original units.
    const x = await readPanel(page, 'plot-scaled');
    expect(x.nullLine).toBeCloseTo(0.5, 6);
    expect(x.stat).toBeCloseTo(2.3, 6);
    expect(x.peak.null).toBeCloseTo(0.5, 1);
    expect(x.peak.interval).toBeCloseTo(2.3, 1);
    expect(x.rejections).toHaveLength(2);
    expect(x.rejections[0][1]).toBeCloseTo(0.5 - 1.96 * 1.5, 2);   // X₀ − z*·SE
    expect(x.rejections[1][0]).toBeCloseTo(0.5 + 1.96 * 1.5, 2);   // X₀ + z*·SE
    expect(x.ciLower).toBeCloseTo(2.3 - 1.96 * 1.5, 2);
    expect(x.ciUpper).toBeCloseTo(2.3 + 1.96 * 1.5, 2);
});

test('the observed mean is in the rejection region exactly when H₀ is rejected', async ({ page }) => {
    await open(page, { m: 4, se: 1.5, x0: 0.5, t: 'two' });
    await expect(page.locator('#output-standard')).toContainText('Reject H₀');
    const x = await readPanel(page, 'plot-scaled');
    expect(x.stat).toBeGreaterThan(x.rejections[1][0]);
    const z = await standardPanel(page);
    expect(z.stat).toBeGreaterThan(z.rejections[1][0]);
    await expect(page.locator('#explain-standard')).toContainText('inside the red shading, so H₀ is rejected');
});

test('z-table highlights the percentile z-scores and the test statistic', async ({ page }) => {
    await open(page, { m: 1.2, se: 1, x0: 0 });
    const highlighted = await page.locator('#table-combined td.highlight').allTextContents();
    // Φ(−1.96), Φ(1.20), Φ(1.96)
    expect(highlighted).toEqual(['0.024998', '0.884930', '0.975002']);
    // The statistic and the percentile z-scores are coloured differently.
    await expect(page.locator('#table-combined td.hl-stat')).toHaveText('0.884930');
    await expect(page.locator('#table-combined td.hl-bound')).toHaveText(['0.024998', '0.975002']);
});

// The simulator's curve, y range and total histogram area.
function samplingShape(page) {
    return page.evaluate(() => {
        const gd = document.getElementById('plot-sampling');
        const curve = gd.data.find(t => t.name === 'expected');
        const width = (gd.layout.xaxis.range[1] - gd.layout.xaxis.range[0]) / 40;
        const area = gd.data.filter(t => t.type === 'bar' && t.name !== 'latest')
            .reduce((sum, t) => sum + t.y.reduce((a, b) => a + b, 0) * width, 0);
        return { peak: Math.max(...curve.y), yRange: gd.layout.yaxis.range, area };
    });
}

test('simulator: the curve stays fixed and the histogram keeps a total area of 1', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page);
    const empty = await samplingShape(page);
    expect(empty.peak).toBeCloseTo(0.39894, 4);

    for (const [label, n] of [['Draw 10', 10], ['Draw 100', 110], ['Draw 1000', 1110]]) {
        await page.getByRole('button', { name: label, exact: true }).click();
        await expect(page.locator('#sampling-stats')).toContainText(`n = ${n} ·`);
        const s = await samplingShape(page);
        expect(s.peak).toBe(empty.peak);
        expect(s.yRange).toEqual(empty.yRange);
        expect(s.area).toBeCloseTo(1, 6);
    }
});

test('every plot and the z-table has a legend', async ({ page }) => {
    await open(page);
    await expect(page.locator('#legend-standard')).toContainText('null curve N(0, 1)');
    await expect(page.locator('#legend-standard')).toContainText('test statistic z');
    await expect(page.locator('#legend-scaled')).toContainText('interval curve N(m, SE)');
    await expect(page.locator('#legend-scaled')).toContainText('standard normal N(0, 1)');
    await expect(page.locator('#legend-sampling')).toContainText('distribution N(m, SE), fixed');
    await expect(page.locator('#legend-table')).toContainText('test statistic z');
    // Each legend sits directly under its plot.
    for (const id of ['standard', 'scaled', 'sampling']) {
        const next = await page.locator(`#plot-${id}`).evaluate(el => el.nextElementSibling.id);
        expect(next).toBe(`legend-${id}`);
    }
});
