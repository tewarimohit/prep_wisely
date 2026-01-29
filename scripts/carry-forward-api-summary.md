# Carry-Forward Info in Week API - Implementation Summary

## ✅ Changes Made

### 1. Week API (`app/api/plans/week/route.ts`)
- ✅ Added `tags` field to items select (to detect carried-forward tasks)
- ✅ Added `totalTasks` count (total number of items)
- ✅ Added `completedTasks` count (items with status "DONE")
- ✅ Added `carriedForwardTasks` count (items with "carried-forward" tag)

### 2. API Function (`lib/api/plans.ts`)
- ✅ Updated `upsertPlan()` to set `tags: ["carried-forward"]` when `task.carriedForward` is true
- ✅ Otherwise sets `tags: []`

### 3. Optimistic Update (`hooks/usePlanMutation.ts`)
- ✅ Updated optimistic items to include tags based on `task.carriedForward`
- ✅ Sets `tags: ["carried-forward"]` for carried-forward tasks

## ✅ API Response Structure

### Before
```json
[
  {
    "date": "2024-01-22T00:00:00.000Z",
    "title": "Daily Plan",
    "status": "completed",
    "items": [...]
  }
]
```

### After
```json
[
  {
    "date": "2024-01-22T00:00:00.000Z",
    "title": "Daily Plan",
    "status": "completed",
    "totalTasks": 5,           // ← Added
    "completedTasks": 5,        // ← Added
    "carriedForwardTasks": 2,   // ← Added
    "items": [
      {
        "id": "item1",
        "status": "DONE",
        "order": 0,
        "tags": []              // ← Added (empty or ["carried-forward"])
      }
    ]
  }
]
```

## ✅ Implementation Details

### Task Counts Computation
```typescript
const totalTasks = plan.items.length;
const completedTasks = plan.items.filter(item => item.status === "DONE").length;
const carriedForwardTasks = plan.items.filter(item => 
  item.tags.includes("carried-forward")
).length;
```

### Tag Setting
- When `task.carriedForward === true` → `tags: ["carried-forward"]`
- When `task.carriedForward === false` → `tags: []`

## ✅ Response Still Lightweight

- ✅ Only added 3 number fields (totalTasks, completedTasks, carriedForwardTasks)
- ✅ Items still have minimal fields (id, status, order, tags)
- ✅ Tags array is small (empty or single element)
- ✅ No additional nested objects or heavy data

## ✅ Test Coverage

Updated `scripts/test-week-api.ts` to verify:
- ✅ totalTasks field present and correct
- ✅ completedTasks field present and correct
- ✅ carriedForwardTasks field present and correct
- ✅ Counts match actual item data
- ✅ Tags included in items

## ✅ Usage Example

```typescript
const response = await fetch('/api/plans/week?...');
const plans = await response.json();

plans.forEach(plan => {
  console.log(`${plan.date}:`);
  console.log(`  Total: ${plan.totalTasks}`);
  console.log(`  Completed: ${plan.completedTasks}`);
  console.log(`  Carried Forward: ${plan.carriedForwardTasks}`);
});
```
