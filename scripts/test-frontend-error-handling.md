# Manual Test: Frontend Error Handling

## Prerequisites
1. Dev server running: `npm run dev`
2. Browser open to `http://localhost:3000/day`

## Test Scenarios

### Test 1: Break API URL (Network Error)
1. Open browser DevTools → Network tab
2. Open `app/day/page.tsx` in editor
3. Temporarily change line 61:
   ```typescript
   const response = await fetch(`/api/plans/BROKEN-URL?userId=${userId}`);
   ```
4. Save file (hot reload should trigger)
5. **Expected:**
   - ✅ Page loads without crashing
   - ✅ Error message appears: "Failed to load plan. Please refresh the page."
   - ✅ Error is displayed in red box below "Day Plan" heading
   - ✅ No console errors (only expected error logs)

6. **Restore:** Change back to correct URL:
   ```typescript
   const response = await fetch(`/api/plans/${apiDate}?userId=${userId}`);
   ```

### Test 2: Force 500 Error
1. Open `app/api/plans/[date]/route.ts`
2. Temporarily add at the start of GET handler (line ~10):
   ```typescript
   return NextResponse.json({ error: "Test error" }, { status: 500 });
   ```
3. Save file
4. Refresh browser page
5. **Expected:**
   - ✅ Page loads without crashing
   - ✅ Error message appears: "Failed to load plan. Please refresh the page."
   - ✅ Error displayed in red box
   - ✅ No JavaScript errors

6. **Restore:** Remove the test return statement

### Test 3: Force Save Error
1. Temporarily break POST endpoint (add at start of POST handler):
   ```typescript
   return NextResponse.json({ error: "Test save error" }, { status: 500 });
   ```
2. Try to add a new task
3. **Expected:**
   - ✅ Error message appears: "Test save error" or "Failed to save plan. Please try again."
   - ✅ UI doesn't crash
   - ✅ Task list remains visible
   - ✅ Can try again

4. **Restore:** Remove the test return statement

### Test 4: Network Failure Simulation
1. Stop the dev server (`Ctrl+C`)
2. Refresh the browser page
3. **Expected:**
   - ✅ Page loads (from cache/previous state)
   - ✅ Error message appears when trying to fetch/save
   - ✅ No crashes

4. **Restore:** Start dev server again (`npm run dev`)

## Automated Test
Run: `npx tsx scripts/test-error-handling.ts`

This tests the API error responses, but manual browser testing is needed to verify UI behavior.
