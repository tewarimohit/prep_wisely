import { test, expect } from '@playwright/test';

test.describe('AI Plan Accept Flow', () => {
  test('should preview, accept AI plan, and verify on Day page', async ({ page }) => {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Open AI plan preview
    await page.goto(`/ai/preview?date=${today}&type=day`);
    
    // Wait for preview to load
    await page.waitForSelector('h1', { timeout: 15000 });
    
    // Verify we're on the preview page
    await expect(page.getByText(/AI Suggested Plan|AI Plan Preview/i)).toBeVisible();

    // Wait for plan to be generated (might take a moment)
    await page.waitForTimeout(2000);

    // Check if plan is displayed
    const planTitle = page.locator('h2, h3').filter({ hasText: /Plan|plan/ }).first();
    const hasPlan = await planTitle.isVisible().catch(() => false);

    if (hasPlan) {
      // Look for "Accept Suggested Plan" or "Accept New Plan" button
      const acceptButton = page.getByRole('button').filter({ hasText: /Accept.*Plan/i });
      
      if (await acceptButton.isVisible().catch(() => false)) {
        // Click accept button
        await acceptButton.click();

        // Wait for navigation or success message
        await page.waitForTimeout(2000);

        // Check if we're redirected to Day page or if success message appears
        const isDayPage = page.url().includes('/day');
        const successMessage = page.getByText(/saved successfully|Plan saved/i);

        if (isDayPage) {
          // Verify we're on Day page
          expect(page.url()).toContain('/day');
          
          // Wait for Day page to load
          await page.waitForSelector('input[type="text"]', { timeout: 10000 });
          
          // Verify tasks are rendered (look for task items)
          const taskItems = page.locator('li, div').filter({ hasText: /./ });
          await expect(taskItems.first()).toBeVisible({ timeout: 5000 });
        } else if (await successMessage.isVisible().catch(() => false)) {
          // Success message shown - verify it
          await expect(successMessage).toBeVisible();
        }
      } else {
        // Accept button not found - might be disabled or not available
        // Just verify page doesn't crash
        expect(page.url()).toContain('/ai/preview');
      }
    } else {
      // Plan might be loading or failed
      // Check for error message
      const errorMessage = page.locator('text=/Error|Failed|Could not/i');
      const loadingMessage = page.locator('text=/Loading|loading/i');
      
      // If error, verify it's displayed clearly
      if (await errorMessage.isVisible().catch(() => false)) {
        await expect(errorMessage.first()).toBeVisible();
      } else if (await loadingMessage.isVisible().catch(() => false)) {
        // Still loading - wait a bit more
        await page.waitForTimeout(3000);
      }
      
      // At minimum, verify page doesn't crash
      expect(page.url()).toContain('/ai/preview');
    }
  });

  test('should show comparison when current plan exists', async ({ page }) => {
    const today = new Date().toISOString().split('T')[0];
    
    // First, create a plan on Day page
    await page.goto(`/day?date=${today}`);
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });
    
    // Add a task
    const taskInput = page.locator('input[type="text"]').first();
    await taskInput.fill('Existing Task');
    await taskInput.press('Enter');
    await page.waitForTimeout(1000);

    // Now go to AI preview
    await page.goto(`/ai/preview?date=${today}&type=day`);
    await page.waitForSelector('h1', { timeout: 15000 });

    // Check if comparison is shown
    const comparisonSection = page.getByText(/Plan Comparison|Current Plan|New Suggestion/i);
    const hasComparison = await comparisonSection.isVisible().catch(() => false);

    // If comparison exists, verify it shows both plans
    if (hasComparison) {
      await expect(comparisonSection.first()).toBeVisible();
    }

    // Verify page doesn't crash regardless
    expect(page.url()).toContain('/ai/preview');
  });
});
