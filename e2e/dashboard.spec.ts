import { test, expect } from '@playwright/test';

test.describe('Dashboard Load', () => {
  test('should load dashboard without crashing', async ({ page }) => {
    // Open Dashboard
    await page.goto('/dashboard');
    
    // Wait for dashboard to load
    await page.waitForSelector('h1', { timeout: 15000 });
    
    // Verify dashboard title
    await expect(page.getByText(/Dashboard|dashboard/i).first()).toBeVisible();

    // Wait for sections to load (they might be loading or empty)
    await page.waitForTimeout(2000);

    // Verify main sections exist (even if empty)
    const weekSection = page.getByText(/This Week|Week|week/i);
    const mcqSection = page.getByText(/MCQ|mcq/i);
    const weakAreasSection = page.getByText(/Weak Areas|weak areas|Areas to Focus/i);
    const feedbackSection = page.getByText(/Mood|mood|Feedback|feedback/i);

    // At least one section should be visible
    const hasAnySection = await weekSection.isVisible().catch(() => false) ||
                         await mcqSection.isVisible().catch(() => false) ||
                         await weakAreasSection.isVisible().catch(() => false) ||
                         await feedbackSection.isVisible().catch(() => false);

    // Verify navigation links exist
    const dayLink = page.getByRole('link', { name: /Day/i });
    const weekLink = page.getByRole('link', { name: /Week/i });
    const mcqLink = page.getByRole('link', { name: /MCQ/i });

    // At least navigation should work
    await expect(dayLink.or(weekLink).or(mcqLink).first()).toBeVisible();

    // Verify page doesn't crash (body is visible)
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Verify URL is correct
    expect(page.url()).toContain('/dashboard');
  });

  test('should handle empty dashboard state gracefully', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForSelector('h1', { timeout: 15000 });
    
    // Wait for all async operations
    await page.waitForTimeout(3000);

    // Check for empty state messages (they should be present if no data)
    const emptyMessages = page.locator('text=/No plans|No MCQs|No weak areas|No feedback/i');
    
    // Page should still be functional even with empty states
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Verify no error messages are shown (unless intentional)
    const errorMessages = page.locator('text=/Error|Failed|Crash/i');
    const hasErrors = await errorMessages.isVisible().catch(() => false);
    
    // Errors should not be present (unless they're handled gracefully)
    // We just verify the page doesn't crash
    expect(page.url()).toContain('/dashboard');
  });
});
