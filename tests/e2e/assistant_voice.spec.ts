import { test, expect } from '@playwright/test'
import { login } from './helpers/login'

/**
 * Push-to-talk voice smoke path, in a real browser against the real stack.
 *
 * Chromium is given a fake capture device, so the browser genuinely opens a
 * microphone, genuinely records, and genuinely uploads to the gateway; the
 * server genuinely validates the container and calls the real speech engine.
 * What the fake device emits is a tone rather than speech, so this proves the
 * plumbing and the safety behaviour, not recognition quality. Recognition needs
 * a person speaking into a real microphone, which is the manual QA script.
 *
 * Requires ASSISTANT_VOICE_ENABLED=true and a provider credential on
 * report-service. Where those are off the assistant withdraws itself and this
 * spec should be skipped rather than forced to pass.
 */

test.use({
  permissions: ['microphone'],
  launchOptions: {
    args: [
      // A real MediaRecorder over a synthetic device: no getUserMedia stub, and
      // no permission dialog to click through.
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
    ],
  },
})

// A real login, a real recording, a real upload, and a real call to the speech
// engine do not fit Playwright's 30 second default. The assertions are unchanged;
// this only gives them room to finish.
test.describe.configure({ timeout: 120_000 })

async function openAssistant(page: import('@playwright/test').Page) {
  const launcher = page.getByRole('button', { name: /open hospital assistant/i })
  await expect(launcher).toBeVisible({ timeout: 20000 })
  await launcher.click()
  await expect(page.getByRole('dialog', { name: /hospital assistant/i })).toBeVisible()
}

test.describe('push-to-talk voice', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('records, uploads, and returns the words for the user to confirm', async ({
    page,
  }) => {
    await openAssistant(page)

    const record = page.getByRole('button', { name: /record a question/i })
    await expect(record).toBeVisible()

    await record.click()

    // The recording state is visible while the microphone is open, so nobody is
    // recorded without knowing it.
    const stop = page.getByRole('button', { name: /^stop$/i })
    await expect(stop).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/recording/i).first()).toBeVisible()

    await page.waitForTimeout(2500)
    await stop.click()

    await expect(page.getByText(/transcribing/i)).toBeVisible({ timeout: 10000 })

    // A tone is not speech. Either the server reports that nothing was heard, or
    // it returns a transcript for review. Both are correct; silently inventing
    // a question would not be.
    const review = page.getByRole('textbox', { name: /check what i heard/i })
    const nothingHeard = page.getByText(/did not hear anything/i)

    await expect(review.or(nothingHeard)).toBeVisible({ timeout: 60000 })

    if (await review.isVisible().catch(() => false)) {
      // Nothing has been asked yet: a transcript on screen is not a submission.
      await expect(page.getByRole('button', { name: /use this/i })).toBeVisible()
      await expect(page.getByText(/nothing is sent until you choose use this/i)).toBeVisible()
    }
  })

  test('keeps no audio or transcript in browser storage', async ({ page }) => {
    await openAssistant(page)

    await page.getByRole('button', { name: /record a question/i }).click()
    await expect(page.getByRole('button', { name: /^stop$/i })).toBeVisible({
      timeout: 15000,
    })
    await page.waitForTimeout(2000)
    await page.getByRole('button', { name: /^stop$/i }).click()

    const review = page.getByRole('textbox', { name: /check what i heard/i })
    const nothingHeard = page.getByText(/did not hear anything/i)
    await expect(review.or(nothingHeard)).toBeVisible({ timeout: 60000 })

    const stored = await page.evaluate(() => ({
      local: JSON.stringify(window.localStorage),
      session: JSON.stringify(window.sessionStorage),
    }))

    for (const blob of [stored.local, stored.session]) {
      expect(blob.toLowerCase()).not.toContain('transcript')
      expect(blob.toLowerCase()).not.toContain('audio')
      expect(blob.toLowerCase()).not.toContain('data:audio')
    }
  })

  test('cancelling a recording sends nothing', async ({ page }) => {
    await openAssistant(page)

    const requests: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/assistant/voice/transcribe')) {
        requests.push(request.url())
      }
    })

    await page.getByRole('button', { name: /record a question/i }).click()
    await expect(page.getByRole('button', { name: /^stop$/i })).toBeVisible({
      timeout: 15000,
    })
    await page.waitForTimeout(1500)
    await page.getByRole('button', { name: /^cancel$/i }).click()

    await expect(page.getByRole('button', { name: /record a question/i })).toBeVisible()
    await page.waitForTimeout(1500)
    expect(requests).toHaveLength(0)
  })

  test('an answer can be read aloud and the voice is disclosed as AI-generated', async ({
    page,
  }) => {
    await openAssistant(page)

    const input = page.getByRole('textbox', { name: /ask the hospital assistant/i })
    await input.fill('How do I register a new patient?')
    await page.getByRole('button', { name: /^send$/i }).click()

    await expect(page.getByText(/thinking/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/thinking/i)).toBeHidden({ timeout: 90000 })

    const listen = page.getByRole('button', {
      name: /listen to this answer in an ai-generated voice/i,
    })
    await expect(listen).toBeVisible()
    await expect(page.getByText(/ai-generated voice/i).first()).toBeVisible()
  })
})
