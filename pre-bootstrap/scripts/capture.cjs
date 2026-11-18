#!/usr/bin/env node
// Full-length desktop capture of a design page, 1440px wide.
//
//   node scripts/capture.cjs <page> <output.png>
//   node scripts/capture.cjs index.html design/exports/concept-a-homepage-1440.png
//   node scripts/capture.cjs "index.html?theme=b" design/exports/concept-b-homepage-1440.png
//
// <page> is relative to design/. No server needed: the page loads from disk.
// Prints the page height, the fonts that loaded, and any element wider than the viewport.

const path = require('node:path');
const { execSync } = require('node:child_process');

function loadPlaywright() {
  try {
    return require('playwright');
  } catch {
    // Installed globally through mise, not in this repo.
    const dir = execSync('mise where npm:playwright', { encoding: 'utf8' }).trim();
    return require(path.join(dir, 'node_modules', 'playwright'));
  }
}

const [page_, output] = process.argv.slice(2);
if (!page_ || !output) {
  console.error('Usage: node scripts/capture.cjs <page> <output.png>');
  process.exit(1);
}

const designDir = path.resolve(__dirname, '..', 'design');
const url = 'file://' + designDir + '/' + page_;

(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  // Reduced motion: entrance animations are skipped, so nothing is caught mid-reveal.
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    // Lazy images below the fold would otherwise be blank in a full-page capture.
    document.querySelectorAll('img[loading]').forEach((img) => { img.loading = 'eager'; });
    await Promise.all([...document.images].map((img) => img.decode().catch(() => {})));
    await document.fonts.ready;
  });
  await page.waitForTimeout(400);

  const report = await page.evaluate(() => {
    const tooWide = [...document.querySelectorAll('body *')]
      .filter((el) => {
        const box = el.getBoundingClientRect();
        // The comparison table scrolls on purpose; the hero photo bleeds off the edge on purpose.
        return box.width > 0 && box.right > innerWidth + 1 && !el.closest('.table-wrap') && !el.matches('.img-hero');
      })
      .slice(0, 8)
      .map((el) => `${el.tagName.toLowerCase()}.${el.className} right=${Math.round(el.getBoundingClientRect().right)}`);
    const fonts = [...new Set([...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.style} ${f.weight}`))];
    return { height: document.documentElement.scrollHeight, scrollWidth: document.documentElement.scrollWidth, fonts, tooWide };
  });

  await page.screenshot({ path: path.resolve(output), fullPage: true });
  await browser.close();

  console.log(`${output}: 1440x${report.height}`);
  console.log(`fonts: ${report.fonts.join(', ') || 'NONE LOADED'}`);
  if (report.scrollWidth > 1440 || report.tooWide.length) {
    console.log(`horizontal overflow (page ${report.scrollWidth}px wide):\n  ${report.tooWide.join('\n  ')}`);
  }
})();
