import { test, expect } from '@playwright/test';

test.describe('Doctor Encounter Flow E2E', () => {
  test('should log in, open queue, create consultation notes, prescribe medication, raise investigation, and complete', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('#username', 'doctor');
    await page.fill('#password', 'doctor');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard');

    // Navigate to doctor queue
    await page.goto('/consultation/queue');

    // Handle Simultaneous Session Warning modal if it appears
    try {
      await expect(page.locator('text=Simultaneous Session Warning')).toBeVisible({ timeout: 3000 });
      await page.click('button:has-text("Keep This Session")');
    } catch (e) {
      // Modal didn't appear, proceed normally
    }

    // 2. Select patient in Doctor Queue
    await expect(page.locator('h1')).toContainText('Patient Queue');
    
    // Find first patient with active action button and click it
    const actionButton = page.locator('button:has-text("Open Encounter"), button:has-text("Resume")').first();
    await expect(actionButton).toBeVisible();
    await actionButton.click();

    // Verify encounter page load
    await page.waitForURL('**/consultation/encounter/*');
    await expect(page.locator('h1').first()).toContainText('Patient Encounter');

    // 3. Enter Clinical Notes
    await page.locator('textarea').nth(0).fill('Patient presents with severe persistent cough and chest congestion for 3 days.');
    await page.locator('textarea').nth(1).fill('Vesicular breath sounds, mild wheezing on chest auscultation.');
    await page.locator('textarea').nth(2).fill('Suspected atypical pneumonia.');
    await page.click('button:has-text("Save Draft")');
    await expect(page.locator('text=Notes saved as draft')).toBeVisible();

    // 4. Record Diagnosis
    await page.fill('input[placeholder*="Diagnosis name"]', 'Pneumonia, unspecified organism');
    await page.fill('input[placeholder*="ICD-10 Code"]', 'J18.9');
    await page.selectOption('div:has-text("Add Diagnosis") select', 'provisional');
    await page.click('button:has-text("Record Diagnosis")');
    await expect(page.locator('text=Diagnosis added')).toBeVisible();
 
    // 5. Add Prescription (Medication)
    await page.click('button:has-text("Add Medication")');
    await page.fill('input[placeholder*="Search drug name"]', 'Amoxicillin 500mg');
    await page.fill('input[placeholder*="500mg"]', '1 tablet');
    await page.locator('div[role="dialog"] select').nth(0).selectOption('Oral');
    await page.locator('div[role="dialog"] select').nth(1).selectOption('TDS');
    await page.fill('input[placeholder*="e.g. 5"]', '7');
    await page.locator('div[role="dialog"] button:has-text("Add Medication")').click();
    await expect(page.locator('text=Prescription added')).toBeVisible();
 
    // 6. Raise Investigation
    await page.click('button:has-text("Add Order")');
    await page.locator('div[role="dialog"] select').selectOption('Laboratory');
    await page.fill('input[placeholder*="Search or type test name"]', 'Full Blood Count (FBC)');
    await page.locator('div[role="dialog"] button:has-text("Add Order")').click();
    await expect(page.locator('text=Investigation requested')).toBeVisible();
 
    // 7. Go back to queue & verify Awaiting Results
    await page.click('a:has-text("Patient Queue")');
    await page.waitForURL('**/consultation/queue');
    const awaitingPatientRow = page.locator('tr:has-text("AWAITING RESULTS")').first();
    await expect(awaitingPatientRow).toBeVisible();
  });
});
//
