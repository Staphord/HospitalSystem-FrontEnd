import { test, expect } from '@playwright/test';

test.describe('Doctor Encounter Flow E2E', () => {
  test('should log in, open queue, create consultation notes, prescribe medication, raise investigation, and complete', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('#username', 'testuser');
    await page.fill('#password', 'testpassword');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/consultation/queue');

    // 2. Select patient in Doctor Queue
    await expect(page.locator('h1')).toContainText('Doctor Queue');
    
    // Find first patient with status "Waiting" and open encounter
    const firstWaitingRow = page.locator('tr:has-text("Waiting")').first();
    await expect(firstWaitingRow).toBeVisible();
    await firstWaitingRow.locator('button:has-text("Open Encounter")').click();

    // Verify encounter page load
    await page.waitForURL('**/consultation/encounter/*');
    await expect(page.locator('h2')).toContainText('Clinical Encounter');

    // 3. Enter Clinical Notes
    await page.fill('textarea[placeholder*="complaint"]', 'Patient presents with severe persistent cough and chest congestion for 3 days.');
    await page.fill('textarea[placeholder*="examination"]', 'Vesicular breath sounds, mild wheezing on chest auscultation.');
    await page.fill('textarea[placeholder*="impression"]', 'Suspected atypical pneumonia.');
    await page.click('button:has-text("Save Draft")');
    await expect(page.locator('text=Notes saved as draft')).toBeVisible();

    // 4. Record Diagnosis
    await page.fill('input[placeholder*="diagnosis description"]', 'Pneumonia, unspecified organism');
    await page.fill('input[placeholder*="ICD-10"]', 'J18.9');
    await page.selectOption('select[id="diagnosis-type"]', 'provisional');
    await page.click('button:has-text("Record Diagnosis")');
    await expect(page.locator('text=Diagnosis added')).toBeVisible();

    // 5. Add Prescription (Medication)
    await page.click('button:has-text("Add Medication")');
    await page.fill('input[placeholder*="Drug name"]', 'Amoxicillin 500mg');
    await page.fill('input[placeholder*="Dose"]', '1 tablet');
    await page.selectOption('select[id="route"]', 'oral');
    await page.selectOption('select[id="frequency"]', 'TID');
    await page.fill('input[placeholder*="Duration"]', '7 days');
    await page.click('button:has-text("Add")');
    await expect(page.locator('text=Prescription added')).toBeVisible();

    // 6. Raise Investigation
    await page.click('button:has-text("Add Order")');
    await page.selectOption('select[id="dept"]', 'Laboratory');
    await page.fill('input[placeholder*="Test name"]', 'Full Blood Count (FBC)');
    await page.click('button:has-text("Request")');
    await expect(page.locator('text=Investigation requested')).toBeVisible();

    // 7. Go back to queue & verify Awaiting Results
    await page.click('a:has-text("Back to Queue")');
    await page.waitForURL('**/consultation/queue');
    const awaitingPatientRow = page.locator('tr:has-text("Awaiting Results")').first();
    await expect(awaitingPatientRow).toBeVisible();
  });
});
// 
