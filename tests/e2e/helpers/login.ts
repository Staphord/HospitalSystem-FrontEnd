import { expect, type Page } from '@playwright/test'

/**
 * Real login through the real stack.
 *
 * No faked authorization, no stubbed token. Credentials come from the
 * environment so a spec is not tied to one machine's seeded accounts.
 */

export const ASSISTANT_USERNAME = process.env.E2E_ASSISTANT_USER ?? 'hadmin1'
export const ASSISTANT_PASSWORD = process.env.E2E_ASSISTANT_PASSWORD ?? 'admin12345'

export async function login(
  page: Page,
  username: string = ASSISTANT_USERNAME,
  password: string = ASSISTANT_PASSWORD,
): Promise<void> {
  await page.goto('/login')
  await page.fill('#login-username', username)
  await page.fill('#login-password', password)
  await page.click('button[type="submit"]')

  // Signing in while another session is live raises the simultaneous-session
  // warning, which sits in front of the app until it is answered. Race the
  // dashboard against the modal rather than assuming which one arrives.
  const keepSession = page.getByRole('button', { name: /keep this session/i })
  const deadline = Date.now() + 45000

  while (Date.now() < deadline) {
    if (await keepSession.isVisible().catch(() => false)) {
      await keepSession.click()
      await expect(keepSession).toBeHidden({ timeout: 15000 })
    }

    if (!new URL(page.url()).pathname.startsWith('/login')) return

    await page.waitForTimeout(500)
  }

  throw new Error(`login did not leave /login; still at ${page.url()}`)
}
