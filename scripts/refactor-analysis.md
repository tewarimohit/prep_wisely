# Refactor Analysis: `app/day/page.tsx`

## 1. GET/POST Logic Location

### GET Logic (Lines 64-76)
```typescript
const fetchPlan = async (dateStr: string) => {
  const apiDate = convertDateToApiFormat(dateStr);
  const userId = TEST_USER_ID;
  const response = await fetch(`/api/plans/${apiDate}?userId=${userId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch plan: ${response.status}`);
  }
  const plan = await response.json();
  return plan;
};
```

### POST Logic (Lines 80-120)
```typescript
mutationFn: async ({ dateStr, tasks }) => {
  const apiDate = convertDateToApiFormat(dateStr);
  const userId = TEST_USER_ID;
  // Convert Tasks to PlanItems format
  const items = tasks.map((task, index) => ({
    text: task.title,
    status: task.completed ? "DONE" : "TODO",
    order: index,
    tags: [],
    dueTime: null,
  }));
  const payload = { title: "Daily Plan", items };
  const response = await fetch(`/api/plans/${apiDate}?userId=${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to save plan: ${response.status}`);
  }
  return await response.json();
}
```

## 2. TanStack Query Hooks Usage

### `useQueryClient` (Line 47)
```typescript
const queryClient = useQueryClient();
```
**Used in:**
- `onMutate` (line 124, 126, 169)
- `onSuccess` (line 198)
- `onError` (line 208)
- `carryForwardTasks` (lines 315, 330)

### `useQuery` (Lines 235-242)
```typescript
const { data: plan, isLoading, error: queryError } = useQuery({
  queryKey: planQueryKey(activeDate),
  queryFn: () => fetchPlan(activeDate),
});
```

### `useMutation` (Lines 79-228)
```typescript
const upsertPlanMutation = useMutation({
  mutationFn: async ({ dateStr, tasks }) => { ... },
  onMutate: async ({ dateStr, tasks }) => { ... },
  onSuccess: (plan, variables) => { ... },
  onError: (error: any, variables, context) => { ... },
});
```

## 3. What Should Move Out

### API Layer (`lib/api/plans.ts` or `hooks/usePlan.ts`)
**Move:**
- ✅ `fetchPlan` function (lines 64-76) - GET request logic
- ✅ `mutationFn` (lines 80-120) - POST request logic
- ✅ `convertDateToApiFormat` (lines 39-45) - API utility
- ✅ `TEST_USER_ID` constant (line 10) - Should come from auth context

**Keep in hooks:**
- ✅ `planQueryKey` factory (line 50) - Query key management
- ✅ `useMutation` configuration (onMutate, onSuccess, onError) - Mutation logic
- ✅ `useQuery` configuration - Query logic

### Data Transformation (`lib/transformers.ts` or keep in hooks)
**Move:**
- ✅ `planToTasks` helper (lines 53-61) - Plan → Task conversion
- ✅ Task → PlanItem conversion (lines 91-97) - Task → PlanItem conversion

### Custom Hooks (`hooks/usePlan.ts` or `hooks/usePlanMutation.ts`)
**Move:**
- ✅ `useQuery` hook (lines 235-242) - Data fetching logic
- ✅ `useMutation` hook (lines 79-228) - Mutation logic with optimistic updates
- ✅ Query error handling (lines 245-251) - Query error state management

## 4. What Should Stay (UI-Only)

### Component State (Lines 27-36)
**Keep:**
- ✅ `newTaskTitle` - Form input state
- ✅ `taskError` - Form validation error
- ✅ `editError` - Edit validation error
- ✅ `editingTaskId` - Edit mode state
- ✅ `editingTitle` - Edit input state
- ✅ `currentDate` - Current date state
- ✅ `viewedDate` - View mode state ("today" | "next")
- ✅ `apiError` - API error display state

### UI Event Handlers (Lines 256-338)
**Keep:**
- ✅ `toggleTask` (lines 256-261) - UI interaction handler
- ✅ `addTask` (lines 263-283) - UI interaction handler
- ✅ `deleteTask` (lines 285-288) - UI interaction handler
- ✅ `startEditing` (lines 290-293) - UI interaction handler
- ✅ `saveEdit` (lines 295-311) - UI interaction handler
- ✅ `carryForwardTasks` (lines 313-338) - UI interaction handler (but could use hook)

### UI Utilities (Lines 13-25)
**Keep:**
- ✅ `formattedDate` (lines 14-19) - Display formatting
- ✅ `getNextDate` (lines 21-25) - UI date calculation

### JSX Rendering (Lines 340-450)
**Keep:**
- ✅ All JSX/TSX code
- ✅ Event handlers bound to JSX
- ✅ Conditional rendering logic

## 5. Proposed Structure

```
lib/
  api/
    plans.ts          # fetchPlan, mutationFn, API utilities
  transformers.ts     # planToTasks, tasksToPlanItems
  
hooks/
  usePlan.ts          # useQuery for fetching plan
  usePlanMutation.ts  # useMutation with optimistic updates
  
app/day/
  page.tsx            # UI component only
```

## 6. Extraction Priority

### High Priority (Move First)
1. **API functions** (`fetchPlan`, `mutationFn`) → `lib/api/plans.ts`
2. **Data transformers** (`planToTasks`) → `lib/transformers.ts`
3. **Query key factory** (`planQueryKey`) → `hooks/usePlan.ts`

### Medium Priority
4. **Custom hooks** (`useQuery`, `useMutation`) → `hooks/usePlan.ts` & `hooks/usePlanMutation.ts`
5. **Optimistic update logic** (`onMutate`, `onSuccess`, `onError`) → `hooks/usePlanMutation.ts`

### Low Priority (Can Stay)
6. **UI utilities** (`formattedDate`, `getNextDate`) - UI-specific, can stay
7. **UI event handlers** - Keep in component (they orchestrate UI state)

## 7. Benefits of Extraction

### Separation of Concerns
- ✅ API logic separated from UI
- ✅ Data transformation logic reusable
- ✅ Query/mutation logic testable independently

### Reusability
- ✅ Plan hooks can be used in other components
- ✅ API functions can be used in server components or other contexts
- ✅ Transformers can be used in multiple places

### Testability
- ✅ API functions can be unit tested
- ✅ Hooks can be tested with React Testing Library
- ✅ Transformers can be tested in isolation

### Maintainability
- ✅ Changes to API don't require touching UI component
- ✅ Changes to mutation logic don't require touching UI component
- ✅ Easier to add features (e.g., caching, retries) without touching UI
