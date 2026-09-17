import { test, expect } from '@playwright/test';
import { projects } from '../src/data/content';
const repositoryUrls: Record<string, string[]> = {
  'sales-inventory-analytics': ['https://github.com/Rajpoot-10/Sales-Inventory-Analytics-API'],
  'interactive-analytics-dashboards': ['https://github.com/Rajpoot-10/Netflix_EDA', 'https://github.com/Rajpoot-10/Amazon_EDA', 'https://github.com/Rajpoot-10/Super_store_EDA_Dashboard'],
  'automated-eda-system': ['https://github.com/Rajpoot-10/n8n_automated_eda'],
  'flight-management-system': ['https://github.com/Rajpoot-10/Flight-Management-System'],
};

test('home renders without console errors, broken assets, or horizontal overflow', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Data Scientist.' })).toBeVisible();
  await expect(page.getByTestId('project-card')).toHaveCount(6);
  await page.evaluate(() => document.fonts.ready);
  const portrait = page.getByRole('img', { name: 'Hassam Ali', exact: true });
  await portrait.scrollIntoViewIfNeeded();
  await expect(portrait).toBeVisible();
  await expect(portrait).toHaveAttribute('loading', 'lazy');
  await expect.poll(() => portrait.evaluate(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0)).toBe(true);
  await page.locator('#about').screenshot({ path: `test-results/${testInfo.project.name}-about.png`, scale: 'css' });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
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
    const urls = repositoryUrls[project.slug] ?? [];
    await expect(page.locator('.case-external a[href^="https://github.com/"]')).toHaveCount(urls.length);
    for (const url of urls) {
      const link = page.locator('.case-external a[href="' + url + '"]');
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
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

test('configured GitHub and LinkedIn links are safe and unavailable actions stay hidden', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'View Resume' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Open Email App' })).toHaveCount(0);
  const linkedin = page.locator('#contact').getByRole('link', { name: 'Connect on LinkedIn' });
  await expect(linkedin).toHaveAttribute('href', 'https://www.linkedin.com/in/hassam-ali-b88432317/');
  await expect(linkedin).toHaveAttribute('target', '_blank');
  await expect(linkedin).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(page.locator('#home').getByRole('link', { name: 'LinkedIn', exact: true })).toHaveAttribute('href', 'https://www.linkedin.com/in/hassam-ali-b88432317/');
  for (const project of projects) {
    const card = page.getByTestId('project-card').filter({ has: page.getByRole('heading', { name: project.title, exact: true }) });
    const urls = repositoryUrls[project.slug] ?? [];
    await expect(card.locator('a[href^="https://github.com/"]')).toHaveCount(urls.length);
    for (const url of urls) {
      const link = card.locator('a[href="' + url + '"]');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      await expect(link).toHaveAttribute('target', '_blank');
    }
  }
  await expect(page.locator('a[href="#"], a[href=""], a[href^="mailto:"]')).toHaveCount(0);
  const github = page.getByRole('link', { name: 'Find me on GitHub' });
  await expect(github).toHaveAttribute('href', 'https://github.com/Rajpoot-10');
  await expect(github).toHaveAttribute('rel', 'noopener noreferrer');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('.featured-1').screenshot({ path: 'test-results/' + testInfo.project.name + '-dashboard-links.png', scale: 'css' });
  await page.locator('#contact').screenshot({ path: 'test-results/' + testInfo.project.name + '-contact-links.png', scale: 'css' });
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
