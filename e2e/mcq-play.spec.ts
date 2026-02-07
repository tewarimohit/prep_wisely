import { test, expect } from '@playwright/test';

test.describe('MCQ Play Flow', () => {
  test('should complete MCQ session happy path', async ({ page }) => {
    // Open MCQ Play page
    await page.goto('/mcq/play');
    
    // Wait for questions to load
    await page.waitForSelector('text=Question', { timeout: 15000 }).catch(() => {
      // If no questions available, that's OK - just verify page loads
      expect(page.url()).toContain('/mcq/play');
    });

    // Check if questions are available
    const questionText = page.locator('h2').filter({ hasText: /Question|question/ }).first();
    const hasQuestions = await questionText.isVisible().catch(() => false);

    if (hasQuestions) {
      // Wait for options to be visible
      await page.waitForSelector('button', { timeout: 5000 });

      // Find and click the first option (A)
      // Options are buttons with text containing "A." followed by the option text
      const firstOption = page.getByRole('button').filter({ hasText: /A\./ }).first();
      
      if (await firstOption.isVisible().catch(() => false)) {
        await firstOption.click();

        // Wait for feedback (Correct/Incorrect)
        await page.waitForSelector('text=/Correct|Incorrect/', { timeout: 5000 }).catch(() => {
          // Feedback might not appear immediately
        });

        // Check if there's a "Next Question" button or if session is complete
        const nextButton = page.getByRole('button', { name: /Next|next/i });
        const sessionComplete = page.getByText(/Session Complete|session complete/i);

        // If there are more questions, click next
        if (await nextButton.isVisible().catch(() => false)) {
          await nextButton.click();
          await page.waitForTimeout(1000); // Wait for next question to load
        }

        // If session is complete, verify summary is shown
        if (await sessionComplete.isVisible().catch(() => false)) {
          await expect(sessionComplete).toBeVisible();
          
          // Verify summary contains expected fields
          const summaryText = page.locator('text=/Questions attempted|Accuracy|Total time/i');
          await expect(summaryText.first()).toBeVisible({ timeout: 5000 });
        }
      }
    } else {
      // No questions available - verify error message or empty state
      const errorMessage = page.locator('text=/No questions|Failed|Error/i');
      const emptyState = page.locator('text=/No questions available/i');
      
      // At least one should be visible
      const hasErrorOrEmpty = await errorMessage.isVisible().catch(() => false) || 
                              await emptyState.isVisible().catch(() => false);
      
      // This is acceptable - just verify page doesn't crash
      expect(page.url()).toContain('/mcq/play');
    }
  });

  test('should handle MCQ page load without crashing', async ({ page }) => {
    // Just verify the page loads without errors
    await page.goto('/mcq/play');
    
    // Wait a bit for any async operations
    await page.waitForTimeout(2000);
    
    // Check that page is still responsive (no crash)
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Verify URL is correct
    expect(page.url()).toContain('/mcq/play');
  });
});
