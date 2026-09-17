import { test, expect } from '@playwright/test';

test('decorative tilt follows mouse input only and stops when reduced motion changes', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const landscape = page.locator('.landscape');
  await landscape.scrollIntoViewIfNeeded();
  if (testInfo.project.name === 'desktop') {
    await expect(landscape).toHaveAttribute('data-tilt', 'enabled');
    const box = (await landscape.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.4);
    await expect.poll(() => landscape.evaluate(el => el.style.getPropertyValue('--tilt-y'))).not.toBe('');
    const degrees = await landscape.evaluate(el => parseFloat(el.style.getPropertyValue('--tilt-y')));
    expect(Math.abs(degrees)).toBeLessThanOrEqual(3);
    await landscape.screenshot({ path: 'test-results/desktop-landscape-tilt.png' });
    await page.mouse.move(5, 5);
    await expect.poll(() => landscape.evaluate(el => el.style.getPropertyValue('--tilt-y'))).toBe('');
  } else {
    await expect(landscape).not.toHaveAttribute('data-tilt', 'enabled');
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(landscape).not.toHaveAttribute('data-tilt', 'enabled');
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length)).toBe(0);
  await page.getByRole('button', { name: 'Show scatter points' }).click();
  await expect(page.getByRole('button', { name: 'Show wireframe surface' })).toBeVisible();
  await expect.poll(() => page.locator('.landscape > svg').evaluate(el => getComputedStyle(el).transform)).toBe('none');
});

test('content and navigation remain usable when entrance animation APIs are unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Element.prototype, 'animate', { value: undefined, configurable: true });
    Object.defineProperty(window, 'IntersectionObserver', { value: undefined, configurable: true });
  });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/#projects');
  const card = page.getByTestId('project-card').first();
  await expect(card).toBeVisible();
  await expect.poll(() => card.evaluate(el => getComputedStyle(el).opacity)).toBe('1');
  await card.getByRole('link', { name: 'View case study' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sales & Inventory Analytics API');
  expect(errors).toEqual([]);
});

test('chart updates keep a stable layout and reduced-motion filtering stays immediately usable', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.locator('.lab-section').scrollIntoViewIfNeeded();
  const bar = page.locator('.chart-bar').first();
  const fill = bar.locator('.bar-fill');
  const height = await bar.evaluate(el => el.getBoundingClientRect().height);
  await expect.poll(() => fill.evaluate(el => Number(new DOMMatrixReadOnly(getComputedStyle(el).transform).m22.toFixed(2)))).toBe(0.36);
  await page.getByLabel('Dataset category').selectOption('Technology');
  await expect.poll(() => fill.evaluate(el => Number(new DOMMatrixReadOnly(getComputedStyle(el).transform).m22.toFixed(2)))).toBe(0.56);
  expect(await bar.evaluate(el => el.getBoundingClientRect().height)).toBe(height);
  await expect(bar).toHaveAttribute('aria-label', 'January: 28 synthetic orders');
  await bar.focus();
  await expect(page.locator('#chart-tooltip')).toHaveText('January: 28 synthetic orders');
  await page.locator('.lab-section').screenshot({ path: 'test-results/' + testInfo.project.name + '-animated-lab.png', scale: 'css' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByLabel('Dataset category').selectOption('Office supplies');
  await expect.poll(() => fill.evaluate(el => Number(new DOMMatrixReadOnly(getComputedStyle(el).transform).m22.toFixed(2)))).toBe(0.24);
  await page.getByRole('button', { name: 'AI & Engineering', exact: true }).click();
  await expect(page.getByTestId('project-card')).toHaveCount(3);
  const card = page.getByTestId('project-card').first();
  const link = card.getByRole('link', { name: 'View case study' });
  await link.focus();
  await expect(link).toBeFocused();
  await expect.poll(() => card.evaluate(el => getComputedStyle(el).opacity)).toBe('1');
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length)).toBe(0);
});
