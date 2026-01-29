# Week API Implementation Summary

## ✅ Created Files

### `app/api/plans/week/route.ts`
- **Endpoint**: `GET /api/plans/week`
- **Query Parameters**:
  - `userId` (required) - User ID
  - `startDate` (required) - Start date in YYYY-MM-DD format (Monday)
  - `endDate` (required) - End date in YYYY-MM-DD format (Sunday)

## ✅ Features Implemented

### 1. Date Range Query
- Fetches all plans within the specified date range
- Dates normalized to UTC (startDate at 00:00:00, endDate at 23:59:59.999)
- Validates date format (YYYY-MM-DD)
- Validates date range (startDate <= endDate)

### 2. Minimal Response Fields
Returns only required fields:
- `date` - Plan date
- `title` - Plan title
- `items` - Array of plan items with:
  - `id` - Item ID
  - `status` - Item status (TODO, DOING, DONE)
  - `order` - Item order

### 3. Error Handling
- ✅ Missing `userId` → 400 error
- ✅ Missing `startDate` or `endDate` → 400 error
- ✅ Invalid date format → 400 error
- ✅ Invalid date range (startDate > endDate) → 400 error
- ✅ Server errors → 500 error with logging

### 4. Data Ordering
- Plans ordered by `date` (ascending)
- Items ordered by `order` (ascending)

## ✅ Test Script

Created `scripts/test-week-api.ts` to verify:
- Valid request returns correct structure
- Missing parameters are rejected
- Invalid date formats are rejected
- Invalid date ranges are rejected
- Response contains only minimal fields

## Usage Example

```typescript
// Fetch week plans (Monday to Sunday)
const response = await fetch(
  `/api/plans/week?userId=${userId}&startDate=2024-01-22&endDate=2024-01-28`
);
const plans = await response.json();

// Response structure:
[
  {
    date: "2024-01-22T00:00:00.000Z",
    title: "Daily Plan",
    items: [
      { id: "item1", status: "DONE", order: 0 },
      { id: "item2", status: "TODO", order: 1 }
    ]
  },
  // ... more plans
]
```

## Next Steps

1. ✅ API endpoint created
2. ✅ Minimal fields returned
3. ✅ Error handling implemented
4. 🔄 Test with running dev server
5. 🔄 Create frontend hook `useWeekPlans()` if needed
