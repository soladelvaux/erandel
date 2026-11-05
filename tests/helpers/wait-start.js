// The game starts after three.js has loaded (ES modules, ADR-0002 U3), not at the page's load
// event, so browser tests wait for start() to have run instead of sleeping a fixed time.
/** Resolves once the game has started: the title's begin button or the game screen is up. */
async function waitForStart(page, timeout = 60000) {
  await page.waitForFunction(() => typeof ui !== 'undefined' && (ui.screen === 'game' || !!document.querySelector('[data-act="begin"]')), { timeout, polling: 100 });
}
module.exports = { waitForStart };
