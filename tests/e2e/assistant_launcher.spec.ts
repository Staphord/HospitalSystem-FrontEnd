import { test, expect } from '@playwright/test';

/**
 * Hospital Assistant launcher smoke path.
 *
 * Runs against the real stack with a real login, exactly like the encounter
 * flow spec: no faked authorization, no stubbed token, and no mocked assistant
 * response. The assistant answer comes from the real gateway, so this test
 * requires ASSISTANT_OPERATIONAL_CHAT_ENABLED=true and a provider credential on
 * report-service. Where those are off, the launcher correctly withdraws itself
 * and this spec is expected to be skipped rather than forced to pass.
 *
 * Credentials come from the environment so the spec is not tied to one machine's
 * seeded accounts.
 */

const USERNAME = process.env.E2E_ASSISTANT_USER ?? 'hadmin1';
const PASSWORD = process.env.E2E_ASSISTANT_PASSWORD ?? 'admin12345';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.fill('#login-username', USERNAME);
  await page.fill('#login-password', PASSWORD);
  await page.click('button[type="submit"]');

  // Signing in while another session is live raises the simultaneous-session
  // warning, which sits in front of the app until it is answered. Race the
  // dashboard against the modal rather than assuming which one arrives.
  const keepSession = page.getByRole('button', { name: /keep this session/i });
  const deadline = Date.now() + 45000;

  while (Date.now() < deadline) {
    if (await keepSession.isVisible().catch(() => false)) {
      await keepSession.click();
      await expect(keepSession).toBeHidden({ timeout: 15000 });
    }

    if (!new URL(page.url()).pathname.startsWith('/login')) return;

    await page.waitForTimeout(500);
  }

  throw new Error(`login did not leave /login; still at ${page.url()}`);
}

test.describe('Hospital Assistant launcher', () => {
  // A real login plus a real model call through the gateway does not fit the
  // 30s default. This is a network budget, not a relaxed assertion.
  test.describe.configure({ timeout: 120_000 });

  test('opens from the hospital shell, answers a question, and cites a source', async ({ page }) => {
    await login(page);

    const launcher = page.getByRole('button', { name: /open hospital assistant/i });
    await expect(launcher).toBeVisible();

    // Exactly one launcher in the shell, never one per page.
    await expect(page.getByRole('button', { name: /hospital assistant/i })).toHaveCount(1);

    await launcher.click();

    const panel = page.getByRole('dialog');
    await expect(panel).toBeVisible();
    await expect(panel.getByText(/cannot change any hospital record/i)).toBeVisible();

    const box = page.getByLabel(/ask the hospital assistant/i);
    await expect(box).toBeFocused();

    await box.fill('how do I register a patient');
    await page.getByRole('button', { name: /^send$/i }).click();

    // The real model call goes out to the provider here.
    await expect(panel.getByText(/sources/i)).toBeVisible({ timeout: 45000 });

    // Nothing the model returned may become a followable link or an image.
    await expect(panel.locator('a')).toHaveCount(0);
    await expect(panel.locator('img')).toHaveCount(0);
  });

  test('closes on Escape and returns focus to the launcher', async ({ page }) => {
    await login(page);

    await page.getByRole('button', { name: /open hospital assistant/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByRole('button', { name: /open hospital assistant/i })).toBeFocused();
  });

  test('drags to a new position and stores only that, never the conversation', async ({ page }) => {
    await login(page);

    const launcher = page.getByRole('button', { name: /open hospital assistant/i });
    await expect(launcher).toBeVisible();

    // Drag well past the movement threshold, so the press is a drag and not a click.
    const before = await launcher.boundingBox();
    if (!before) throw new Error('launcher has no bounding box');

    await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
    await page.mouse.down();
    await page.mouse.move(before.x - 120, before.y - 120, { steps: 10 });
    await page.mouse.up();

    // The drag moved it, and the press that ended the drag did not open the panel.
    const after = await launcher.boundingBox();
    if (!after) throw new Error('launcher has no bounding box after drag');
    expect(after.x).toBeLessThan(before.x);
    await expect(page.getByRole('dialog')).toBeHidden();

    const position = await page.evaluate(() =>
      window.localStorage.getItem('hf_assistant_launcher_position'),
    );
    expect(position).not.toBeNull();
    expect(Object.keys(JSON.parse(position as string)).sort()).toEqual(['x', 'y']);

    // Hold a conversation and confirm none of it is written to the browser. This
    // runs before the reload so the assertion is about storage, not about how a
    // session behaves across a page load.
    await launcher.click();
    await page.getByLabel(/ask the hospital assistant/i).fill('how do I register a patient');
    await page.getByRole('button', { name: /^send$/i }).click();
    await expect(page.getByRole('dialog').getByText(/sources/i)).toBeVisible({ timeout: 45000 });

    const stored = await page.evaluate(() => JSON.stringify(window.localStorage));
    expect(stored).not.toContain('how do I register a patient');

    // The position survives a reload, and the launcher comes back where it was left.
    await page.reload();
    const restored = await page
      .getByRole('button', { name: /open hospital assistant/i })
      .boundingBox();
    if (!restored) throw new Error('launcher missing after reload');
    expect(Math.abs(restored.x - after.x)).toBeLessThan(2);
  });
});
