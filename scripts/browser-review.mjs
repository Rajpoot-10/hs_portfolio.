import process from 'node:process';
import console from 'node:console';
import { chromium } from '@playwright/test';
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
await page.goto('http://127.0.0.1:5173');
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'test-results/desktop-hero.png' });
for (const width of [320, 390, 768, 1024, 1440]) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('http://127.0.0.1:5173');
  await page.evaluate(() => document.fonts.ready);
  console.log(JSON.stringify(await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, overflow: [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1).map(el => ({ tag: el.tagName, class: el.getAttribute('class'), right: el.getBoundingClientRect().right })).slice(0,15) }))));
  if (width === 390) {
    await page.screenshot({ path: 'test-results/mobile-hero.png' });
    await page.locator('#about').screenshot({ path: 'test-results/mobile-about.png' });
    await page.locator('.lab-section').screenshot({ path: 'test-results/mobile-lab.png' });
  }
}
await page.goto('http://127.0.0.1:5173/projects/sales-inventory-analytics');
await page.reload();
console.log('Development server direct route:', await page.title());
await page.screenshot({ path: 'test-results/desktop-case.png', fullPage: true });
await browser.close();
