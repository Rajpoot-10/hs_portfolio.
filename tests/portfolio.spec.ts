import { test, expect } from '@playwright/test';
import { projects } from '../src/data/content';

test('home renders without console errors, broken assets, or horizontal overflow', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Data Scientist.' })).toBeVisible();
  await expect(page.getByTestId('project-card')).toHaveCount(6);
  await page.evaluate(() => document.fonts.ready);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-home.png`, fullPage: true, scale: 'css' });
  expect(errors).toEqual([]);
});

test('project filters work with keyboard and preserve valid case-study links', async ({ page }) => {
  await page.goto('/#projects');
  const data = page.getByRole('button', { name: 'Data Science & Analytics', exact: true });
  await data.focus(); await page.keyboard.press('Enter');
  await expect(data).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('project-card')).toHaveCount(3);
  await expect(page.getByRole('heading', { name: 'Sales & Inventory Analytics API', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'AI & Engineering', exact: true }).click();
  await expect(page.getByTestId('project-card')).toHaveCount(3);
  await expect(page.getByRole('heading', { name: 'Flight Management System', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'View case study' }).first().click();
  await expect(page).toHaveURL(/\/projects\/rag-email-assistant/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('RAG Email Answering Assistant');
  await page.getByRole('link', { name: 'Back to selected work' }).click();
  await expect(page.getByTestId('project-card')).toHaveCount(6);
});

test('all case studies support direct URLs, refresh, metadata, and readable sections', async ({ page }) => {
  for (const project of projects) {
    await page.goto(`/projects/${project.slug}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(project.title);
    await expect(page).toHaveTitle(`${project.title} — Hassam Ali`);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Approach & architecture' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Limitations & next steps' })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test('navigation, mobile disclosure, Escape, and anchor offsets work', async ({ page }, testInfo) => {
  await page.goto('/');
  const mobile = testInfo.project.name === 'mobile';
  const menu = page.locator('button[aria-controls=main-navigation]');
  if (mobile) {
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toBeFocused();
    await menu.click();
  }
  const expertise = page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Expertise' });
  await expertise.click();
  await expect(page).toHaveURL(/#expertise$/);
  await expect.poll(() => page.locator('#expertise').evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(68);
  if (mobile) await expect(menu).toHaveAttribute('aria-expanded', 'false');
  else await expect(expertise).toHaveAttribute('aria-current', 'location');
});

test('Data Lab filters change values and keyboard focus exposes a text tooltip', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.chart-summary')).toContainText('177 synthetic orders');
  await page.getByLabel('Dataset category').selectOption('Technology');
  await expect(page.locator('.chart-summary')).toContainText('192 synthetic orders');
  const january = page.getByRole('button', { name: 'January: 28 synthetic orders' });
  await january.focus();
  await expect(page.locator('#chart-tooltip')).toHaveText('January: 28 synthetic orders');
  await expect(january).toHaveAttribute('aria-describedby', 'chart-tooltip');
});

test('unconfigured actions are absent and supplied GitHub links are safe', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'View Resume' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Open Email App' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /LinkedIn/ })).toHaveCount(0);
  await expect(page.locator('a[href="#"], a[href=""], a[href^="mailto:"]')).toHaveCount(0);
  const github = page.getByRole('link', { name: 'Find me on GitHub' });
  await expect(github).toHaveAttribute('href', 'https://github.com/Rajpoot-10');
  await expect(github).toHaveAttribute('rel', 'noopener noreferrer');
});

test('hero interaction, not-found routes, and reduced motion work', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Show scatter points' }).click();
  await expect(page.getByRole('button', { name: 'Show wireframe surface' })).toBeVisible();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  for (const url of ['/projects/unknown', '/missing-page']) {
    await page.goto(url);
    await expect(page.getByRole('heading', { name: 'A little off the chart.' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Explore the projects', exact: true })).toHaveAttribute('href', '/#projects');
  }
});

test('tablet and narrow phone layouts fit their viewport', async ({ page }) => {
  for (const width of [320, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
