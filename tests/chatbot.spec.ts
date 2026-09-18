import { test, expect } from '@playwright/test';
const openChat = async (page: import('@playwright/test').Page) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Ask Hassam AI' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
};
test('chat opens, traps keyboard focus, closes and restores focus', async ({ page }) => {
  await openChat(page);
  await expect(page.getByRole('textbox', { name: 'Ask about Hassam' })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Send message', exact: true })).toBeDisabled();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Ask Hassam AI' })).toBeFocused();
});
test('starter, answer, bounded history, multiline input and reset work', async ({ page }) => {
  const payloads: { message: string; history: unknown[] }[] = [];
  await page.route('**/api/chat', async route => {
    payloads.push(route.request().postDataJSON());
    await route.fulfill({ json: { success: true, answer: 'Hassam works with Python and Pandas.' } });
  });
  await openChat(page);
  await page.getByRole('button', { name: 'Data Science skills' }).click();
  await expect(page.getByRole('log')).toContainText('Hassam works with Python and Pandas.');
  const input = page.getByRole('textbox', { name: 'Ask about Hassam' });
  await input.fill('Which projects used them?');
  await input.press('Shift+Enter');
  await expect(input).toHaveValue('Which projects used them?\n');
  await input.press('Enter');
  await expect(page.locator('.chat-message-assistant')).toHaveCount(2);
  expect(payloads[1].history).toHaveLength(2);
  await page.getByRole('button', { name: 'Close chat' }).click();
  await page.getByRole('button', { name: 'Ask Hassam AI' }).click();
  await expect(page.locator('.chat-message-assistant')).toHaveCount(2);
  await page.getByRole('button', { name: 'Clear conversation' }).click();
  await expect(page.locator('.chat-message')).toHaveCount(0);
  await expect(input).toBeFocused();
});
test('loading prevents duplicates; safe errors can be retried without duplicate user messages', async ({ page }) => {
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  let calls = 0;
  await page.route('**/api/chat', async route => {
    calls++;
    if (calls === 1) await pending;
    await route.fulfill(calls === 1 ? { status: 503, json: { success: false } } : { json: { success: true, answer: 'Hassam studies Data Science.' } });
  });
  await openChat(page);
  const input = page.getByRole('textbox', { name: 'Ask about Hassam' });
  await input.fill('What is he studying?'); await input.press('Enter'); await input.press('Enter');
  await expect(page.getByRole('dialog').getByRole('status')).toContainText('Looking through');
  await expect(page.getByRole('button', { name: 'Send message', exact: true })).toBeDisabled();
  release();
  await expect(page.getByRole('alert')).toContainText('temporarily unavailable');
  await page.getByRole('button', { name: 'Retry question' }).click();
  await expect(page.getByRole('log')).toContainText('Hassam studies Data Science.');
  expect(calls).toBe(2);
  await expect(page.locator('.chat-message-user')).toHaveCount(1);
});
test('clear cancels an in-flight request and prevents a stale reply', async ({ page }) => {
  await page.route('**/api/chat', async route => {
    await new Promise(resolve => setTimeout(resolve, 400));
    await route.fulfill({ json: { success: true, answer: 'Stale answer' } }).catch(() => {});
  });
  await openChat(page);
  await page.getByRole('button', { name: 'Explore projects' }).click();
  await expect(page.getByRole('dialog').getByRole('status')).toBeVisible();
  await page.getByRole('button', { name: 'Clear conversation' }).click();
  await page.waitForTimeout(500);
  await expect(page.getByRole('log')).not.toContainText('Stale answer');
  await expect(page.locator('.chat-message')).toHaveCount(0);
});
test('responses are text, network failures are recoverable, and mobile widths fit', async ({ page }) => {
  let failed = false;
  await page.route('**/api/chat', route => {
    if (!failed) { failed = true; return route.abort('failed'); }
    return route.fulfill({ json: { success: true, answer: '<script>window.injected=true</script> ' + 'LongResponse'.repeat(80) } });
  });
  await openChat(page);
  await page.getByRole('button', { name: 'Education', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByRole('button', { name: 'Retry question' }).click();
  await expect(page.getByRole('log')).toContainText('<script>');
  expect(await page.evaluate(() => 'injected' in window)).toBe(false);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    const box = await page.getByRole('dialog').boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    expect(await page.locator('.chat-transcript').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    await expect(page.getByRole('textbox')).toBeInViewport();
  }
});
test('reduced motion disables chat animations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openChat(page);
  expect(await page.getByRole('dialog').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
});
