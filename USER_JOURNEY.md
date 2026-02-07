# Prep Wisely - User Journey Map

## Complete User Flows

### 1. Day Planning → Checklist → Completion

**Flow:**
1. User navigates to `/day` (or `/day?date=YYYY-MM-DD`)
2. Page loads plan for date (or creates empty state)
3. User adds tasks via input field
4. User toggles task completion (TODO → DONE)
5. Changes save automatically via optimistic updates
6. User reloads page → tasks persist correctly

**Key Components:**
- `app/day/page.tsx` - Main day planner UI
- `hooks/usePlan.ts` - Fetches plan data
- `hooks/usePlanMutation.ts` - Handles plan updates with optimistic UI
- `app/api/plans/[date]/route.ts` - Plan CRUD API

**Verification:**
- ✅ Plan creation works
- ✅ Task toggle persists on reload
- ✅ Optimistic updates work correctly
- ✅ Server reconciliation prevents duplicates

### 2. Week View → Progress + Carry-Forward

**Flow:**
1. User navigates to `/week`
2. Page fetches plans for current week (Monday-Sunday)
3. Shows completion status for each day
4. Displays carry-forward task counts
5. Shows weekly completion summary
6. Click day → navigates to `/day?date=YYYY-MM-DD`

**Key Components:**
- `app/week/page.tsx` - Week overview UI
- `hooks/useWeekPlans.ts` - Fetches week data
- `app/api/plans/week/route.ts` - Week aggregation API
- `lib/completion.ts` - Completion status calculation

**Verification:**
- ✅ Week data loads correctly
- ✅ Completion statuses accurate
- ✅ Carry-forward counts displayed
- ✅ Navigation to day page works
- ✅ Reload preserves state

### 3. MCQ Play → Response → Weak Areas

**Flow:**
1. User navigates to `/mcq/play`
2. Page fetches MCQs (10 questions, random order)
3. User answers questions one by one
4. Each answer submits to API → evaluates correctness
5. Weak areas update automatically after each response
6. Session summary shown at end
7. User can view weak areas at `/weak-areas`

**Key Components:**
- `app/mcq/play/page.tsx` - MCQ play UI
- `hooks/useMCQPlay.ts` - Fetches MCQs
- `hooks/useMCQResponse.ts` - Submits answers
- `app/api/mcq/play/route.ts` - MCQ fetch API
- `app/api/mcq/response/route.ts` - Answer evaluation API
- `lib/services/weakAreaService.ts` - Updates weak area snapshots
- `app/weak-areas/page.tsx` - Weak areas display

**Verification:**
- ✅ MCQ session starts correctly
- ✅ Answers submit and evaluate
- ✅ Weak areas update after responses
- ✅ Session summary displays correctly
- ✅ Timing tracked per question

### 4. Daily Feedback → Dashboard Signals

**Flow:**
1. User navigates to `/day`
2. Scrolls to "Daily Reflection" section
3. Selects mood (great/good/okay/tough/struggling)
4. Optionally adds blockers and notes
5. Saves feedback → persists to database
6. Dashboard aggregates feedback for week
7. Shows mood trends and patterns

**Key Components:**
- `app/day/page.tsx` - Feedback UI section
- `hooks/useFeedback.ts` - Fetches feedback
- `hooks/useFeedbackMutation.ts` - Saves feedback
- `app/api/feedback/route.ts` - Feedback CRUD API
- `app/api/feedback/week/route.ts` - Week aggregation API
- `app/dashboard/page.tsx` - Displays feedback signals

**Verification:**
- ✅ Feedback saves correctly
- ✅ Feedback persists on reload
- ✅ Dashboard shows feedback data
- ✅ Week aggregation works

### 5. AI Preview → Regenerate → Accept → Saved Plan

**Flow:**
1. User navigates to `/ai/preview?date=YYYY-MM-DD&type=day`
2. Page fetches current plan (if exists) and AI suggestion
3. Shows comparison (current vs suggested)
4. User can regenerate (up to 3 times/day)
5. User accepts suggested plan → saves to database
6. Navigates to `/day` → sees saved AI plan
7. Plan items tagged with `["ai-generated"]`

**Key Components:**
- `app/ai/preview/page.tsx` - AI preview UI
- `app/api/ai/plan-preview/route.ts` - Generates preview
- `app/api/ai/regenerate-plan/route.ts` - Regenerates suggestion
- `app/api/ai/accept-plan/route.ts` - Saves accepted plan
- `lib/services/plannerContext.ts` - Builds context from app data
- `lib/services/aiPlanner.ts` - Generates plans (AI or fallback)
- `lib/utils/planDiff.ts` - Compares plans

**Verification:**
- ✅ Preview generates correctly
- ✅ Regeneration works (with rate limit)
- ✅ Comparison shows differences
- ✅ Accept saves plan correctly
- ✅ Saved plan persists on reload
- ✅ No silent writes (only on explicit accept)

## Navigation Links

### All Pages Link To:
- **Dashboard** (`/dashboard`) - Central hub
- **Day Planner** (`/day` or `/day?date=YYYY-MM-DD`) - Daily planning
- **Week View** (`/week`) - Weekly overview
- **MCQ Play** (`/mcq/play`) - Practice MCQs
- **Weak Areas** (`/weak-areas`) - View weak topics
- **AI Preview** (`/ai/preview?date=YYYY-MM-DD&type=day`) - AI suggestions

### Navigation Patterns:
- Dashboard → All major pages
- Week → Day (via date link)
- Day → Dashboard
- MCQ Play → Week View
- Weak Areas → Week View
- AI Preview → Day (after accept) or Dashboard

## Data Flow Integrity

### Plan Data:
- Day page → Week API → Dashboard
- AI accept → Day page (same data source)
- All use same API endpoints

### MCQ Data:
- MCQ play → Response API → Weak areas service
- Weak areas → Dashboard (top 3)
- All linked via userId

### Feedback Data:
- Day page → Feedback API
- Dashboard → Feedback week API
- All linked via userId + date

## No Broken Links Verified

✅ All navigation links tested
✅ All API endpoints functional
✅ Data flows correctly between pages
✅ Reload preserves state
✅ No orphaned routes
✅ Error states handled gracefully
