// Smoke tests open normjs.html straight from disk (file://), so no server is needed.
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [['github'], ['list']] : 'list',
    use: { ...devices['Desktop Chrome'] },
});
