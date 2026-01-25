# Manual Testing Guide: Optimistic Update Paths

This guide helps you manually verify optimistic updates work correctly in the UI.

## Prerequisites

1. Start the development server: `npm run dev`
2. Open browser DevTools (F12) → Network tab
3. Navigate to `http://localhost:3000/day`

## Test 1: Optimistic Updates (Add/Edit/Delete)

### 1.1 Add Task (Optimistic)

**Steps:**
1. Type a new task in the input field (e.g., "Test Task 1")
2. Press Enter or click Add
3. **Observe:** Task appears **instantly** in the list (before API completes)
4. **Verify:** Check Network tab - POST request is still pending
5. **Wait:** For API to complete
6. **Verify:** Task remains in list with real database ID

**Expected Behavior:**
- ✅ UI updates instantly (optimistic)
- ✅ Task persists after API completes
- ✅ No flickering or re-rendering

### 1.2 Edit Task (Optimistic)

**Steps:**
1. Click on an existing task to edit
2. Change the text (e.g., "Test Task 1" → "Test Task 1 - Edited")
3. Press Enter or click outside
4. **Observe:** Task text updates **instantly**
5. **Verify:** Check Network tab - POST request is pending
6. **Wait:** For API to complete
7. **Verify:** Edited text persists

**Expected Behavior:**
- ✅ Text updates instantly (optimistic)
- ✅ Edit persists after API completes
- ✅ No flickering

### 1.3 Toggle Task (Optimistic)

**Steps:**
1. Click checkbox on a task
2. **Observe:** Checkbox toggles **instantly**
3. **Verify:** Check Network tab - POST request is pending
4. **Wait:** For API to complete
5. **Verify:** Toggle state persists

**Expected Behavior:**
- ✅ Checkbox toggles instantly (optimistic)
- ✅ State persists after API completes

### 1.4 Delete Task (Optimistic)

**Steps:**
1. Click delete button (X) on a task
2. **Observe:** Task disappears **instantly**
3. **Verify:** Check Network tab - POST request is pending
4. **Wait:** For API to complete
5. **Verify:** Task remains deleted

**Expected Behavior:**
- ✅ Task disappears instantly (optimistic)
- ✅ Deletion persists after API completes

## Test 2: Rollback on Failure

### 2.1 Simulate API Failure

**Steps:**
1. Open browser DevTools → Network tab
2. Right-click on a POST request → "Block request URL"
3. Add/edit/delete a task
4. **Observe:** UI updates optimistically
5. **Observe:** API request fails (blocked)
6. **Verify:** Task reverts to previous state (rollback)
7. **Verify:** Error message appears: "Failed to save plan..."

**Expected Behavior:**
- ✅ UI updates optimistically
- ✅ On failure, UI reverts to previous state
- ✅ Error message displayed inline
- ✅ UI does not crash or freeze

### 2.2 Alternative: Break API Temporarily

**Steps:**
1. In `app/api/plans/[date]/route.ts`, temporarily uncomment:
   ```typescript
   // return NextResponse.json({ error: "Test server error" }, { status: 500 });
   ```
2. Add/edit/delete a task
3. **Observe:** UI updates optimistically
4. **Observe:** API returns 500 error
5. **Verify:** Task reverts to previous state
6. **Verify:** Error message appears
7. **Restore:** Comment out the test error line

**Expected Behavior:**
- ✅ Rollback works correctly
- ✅ Error handling works
- ✅ UI remains stable

## Test 3: Data Persistence (Reload)

### 3.1 Create Plan and Reload

**Steps:**
1. Create a new plan with multiple tasks
2. Add tasks, edit tasks, toggle some tasks
3. **Wait:** For all API calls to complete
4. **Reload:** Press F5 or Ctrl+R
5. **Verify:** All tasks are present
6. **Verify:** Task order is preserved
7. **Verify:** Toggle states are preserved
8. **Verify:** Edited text is preserved

**Expected Behavior:**
- ✅ All data persists after reload
- ✅ Task order matches DB
- ✅ No duplicate tasks
- ✅ All states preserved

### 3.2 Verify Server Reconciliation

**Steps:**
1. Create a plan with tasks
2. **Wait:** For API to complete
3. **Check:** Browser DevTools → Application → Local Storage
4. **Note:** TanStack Query cache (if visible)
5. **Reload:** Page
6. **Verify:** Data matches what's in database
7. **Run:** `npx tsx scripts/test-optimistic-paths.ts` to verify DB state

**Expected Behavior:**
- ✅ Server data is source of truth
- ✅ Cache matches database after reload
- ✅ No stale data

## Test 4: Edge Cases

### 4.1 Rapid Mutations

**Steps:**
1. Quickly add multiple tasks (5-10 tasks rapidly)
2. **Observe:** All tasks appear instantly
3. **Wait:** For all API calls to complete
4. **Verify:** All tasks persist correctly
5. **Verify:** No duplicate tasks
6. **Verify:** Order is correct

**Expected Behavior:**
- ✅ All optimistic updates work
- ✅ Server reconciles correctly
- ✅ No race conditions

### 4.2 Network Delay Simulation

**Steps:**
1. Open DevTools → Network tab → Throttling → "Slow 3G"
2. Add/edit/delete a task
3. **Observe:** UI updates instantly (optimistic)
4. **Wait:** For slow network to complete
5. **Verify:** Server reconciliation works

**Expected Behavior:**
- ✅ Optimistic updates work even with slow network
- ✅ Server reconciliation happens when network completes

## Verification Checklist

After running all tests, verify:

- [ ] **Optimistic Updates:** UI updates instantly for add/edit/delete/toggle
- [ ] **Rollback:** UI reverts correctly on API failure
- [ ] **Error Handling:** Error messages appear inline, UI doesn't crash
- [ ] **Persistence:** Data persists correctly after reload
- [ ] **No Duplicates:** Only one plan exists per user+date
- [ ] **Ordering:** Task order is preserved correctly
- [ ] **Server Truth:** Server data is final source of truth
- [ ] **No Flickering:** UI doesn't flicker during updates

## Automated Test

Run the automated test script:

```bash
npx tsx scripts/test-optimistic-paths.ts
```

This script tests:
- ✅ Optimistic updates via API
- ✅ Rollback on failure
- ✅ Data persistence
- ✅ No duplicate plans

## Troubleshooting

### UI doesn't update instantly
- Check if `onMutate` is called in mutation
- Verify cache is updated optimistically
- Check browser console for errors

### Rollback doesn't work
- Verify `onError` handler restores cache
- Check if `context` is returned from `onMutate`
- Verify error is caught correctly

### Data doesn't persist
- Check API response structure
- Verify `onSuccess` updates cache correctly
- Check database for actual data

### Duplicate plans
- Verify unique constraint in database
- Check if upsert logic is correct
- Verify transaction handling
