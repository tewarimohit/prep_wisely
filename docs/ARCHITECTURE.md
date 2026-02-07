# Prep Wisely - Architecture Documentation

## System Overview

Prep Wisely is a full-stack Next.js application that combines daily planning, MCQ practice, weak area tracking, and AI-powered plan generation. The architecture emphasizes type safety, user control, and scalability.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Day Page   │  │  Week Page   │  │  MCQ Play    │         │
│  │              │  │              │  │              │         │
│  │  - Tasks     │  │  - Progress  │  │  - Questions │         │
│  │  - Feedback  │  │  - Summary   │  │  - Results   │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                  │                 │
│  ┌──────▼─────────────────▼──────────────────▼───────┐       │
│  │         TanStack Query (React Query)                │       │
│  │  - useQuery: Data fetching & caching                │       │
│  │  - useMutation: Optimistic updates                  │       │
│  │  - Query invalidation                               │       │
│  └───────────────────────┬─────────────────────────────┘       │
└──────────────────────────┼─────────────────────────────────────┘
                           │ HTTP Requests
┌──────────────────────────▼─────────────────────────────────────┐
│                      API Routes Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  /api/plans  │  │  /api/mcq    │  │  /api/ai     │         │
│  │              │  │              │  │              │         │
│  │  GET/POST    │  │  play/       │  │  plan-preview │         │
│  │  /week       │  │  response/   │  │  accept-plan  │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                  │                 │
│  ┌──────▼─────────────────▼──────────────────▼───────┐       │
│  │              Zod Validation Layer                   │       │
│  │  - Input schemas (PlannerInputSchema)              │       │
│  │  - Output schemas (AIDayPlanSchema)                │       │
│  │  - Runtime type checking                           │       │
│  └───────────────────────┬───────────────────────────┘       │
└──────────────────────────┼──────────────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────────────┐
│                      Service Layer                               │
│  ┌────────────────────┐  ┌────────────────────┐                 │
│  │  Planner Context   │  │  Weak Area         │                 │
│  │  Builder           │  │  Service          │                 │
│  │                    │  │                    │                 │
│  │  - Aggregates      │  │  - Updates         │                 │
│  │    weak areas      │  │    snapshots       │                 │
│  │  - Fetches plans   │  │  - Calculates      │                 │
│  │  - Gets MCQ stats  │  │    accuracy        │                 │
│  │  - Loads feedback  │  │                    │                 │
│  └─────────┬──────────┘  └──────────┬─────────┘                 │
│            │                        │                            │
│  ┌─────────▼────────────────────────▼─────────┐               │
│  │         AI Planner Service                   │               │
│  │  - Generates day/week plans                  │               │
│  │  - Validates with Zod                        │               │
│  │  - Falls back on error                       │               │
│  │  - Rate limited                              │               │
│  └───────────────────┬─────────────────────────┘               │
└──────────────────────┼───────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│                  Data Access Layer                               │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              Prisma ORM                               │       │
│  │  - Type-safe queries                                 │       │
│  │  - Migrations                                        │       │
│  │  - Connection pooling                                │       │
│  └───────────────────────┬──────────────────────────────┘       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                  PostgreSQL Database                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │   Plan   │  │   MCQ    │  │   Weak   │  │ Feedback │       │
│  │          │  │          │  │  Areas   │  │          │       │
│  │  - Items │  │  - Topics│  │  - Score │  │  - Mood  │       │
│  │  - Status│  │  - Stats │  │  - Count │  │  - Notes  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow Examples

### 1. Creating a Daily Plan

```
User Input → Day Page
    ↓
usePlanMutation (TanStack Query)
    ↓
POST /api/plans/[date]
    ↓
Zod Validation (UpsertPlanSchema)
    ↓
Prisma Transaction
    ↓
PostgreSQL (Plan + PlanItems)
    ↓
Response → TanStack Query Cache
    ↓
UI Updates (Optimistic → Server Reconciliation)
```

### 2. AI Plan Generation

```
User clicks "AI Plan" → AI Preview Page
    ↓
GET /api/ai/plan-preview
    ↓
Rate Limit Check (10/day)
    ↓
buildPlannerContext()
    ├─ Fetch weak areas (top 5)
    ├─ Calculate last week completion
    ├─ Get recent MCQ accuracy
    └─ Load latest feedback
    ↓
generateDayPlan(context)
    ├─ Call AI API (if configured)
    ├─ Validate output (AIDayPlanSchema)
    └─ Fallback if validation fails
    ↓
Return Preview (NO DB WRITE)
    ↓
User Reviews → Accepts Explicitly
    ↓
POST /api/ai/accept-plan
    ↓
Zod Validation (AIDayPlanSchema)
    ↓
Prisma Transaction (Plan + PlanItems)
    ↓
Redirect to Day Page
```

### 3. MCQ Response → Weak Area Update

```
User selects MCQ option
    ↓
POST /api/mcq/response
    ├─ Evaluate correctness
    ├─ Save MCQResponse
    └─ updateWeakAreas() (non-blocking)
        ├─ Find/Create WeakAreaSnapshot
        ├─ Increment attempts
        ├─ Update correct count
        └─ Recalculate score
    ↓
Return result (correct/incorrect)
    ↓
UI shows feedback
    ↓
Weak areas page auto-updates (via TanStack Query)
```

## Key Design Patterns

### 1. Optimistic Updates
- UI updates instantly before server confirmation
- Server response replaces optimistic state
- Rollback on error ensures consistency
- Prevents duplicate plans and race conditions

### 2. Schema-First Development
- Prisma schema defines database structure
- Zod schemas define API contracts
- TypeScript types derived from schemas
- Single source of truth for data shape

### 3. Fail-Closed AI
- All AI outputs validated with Zod
- Invalid responses trigger fallback
- Fallback plans derived from real context
- App works without AI service

### 4. User-in-Loop AI
- AI generates suggestions only
- User explicitly accepts or rejects
- No silent database writes
- All AI actions traceable

### 5. Service Isolation
- Business logic in `lib/services/`
- Services are pure functions where possible
- Easy to test and mock
- Clear boundaries between layers

## Scalability Considerations

### Database
- Indexes on `(userId, date)` for fast plan lookups
- Indexes on `(planId, order)` for ordered items
- Cascade deletes prevent orphaned records
- Connection pooling via Prisma

### API
- Stateless API routes (easy horizontal scaling)
- Rate limiting prevents abuse
- Caching via TanStack Query reduces DB load
- Zod validation catches errors early

### Frontend
- Code splitting via Next.js App Router
- Optimistic updates reduce perceived latency
- Client-side caching reduces API calls
- Error boundaries prevent crashes

### AI Service
- Isolated service can be swapped
- Fallback ensures core features work
- Rate limiting prevents cost overruns
- Structured prompts reduce retries

## Security Boundaries

### API Key Protection
- `AI_API_KEY` only in server-side code
- Never exposed to client
- Environment variables for configuration

### Input Validation
- All API inputs validated with Zod
- Prevents injection attacks
- Type-safe from client to database

### Output Validation
- All API outputs validated before sending
- AI outputs validated before use
- Prevents data corruption

### Rate Limiting
- Server-side enforcement
- Per-user, per-day limits
- Prevents abuse and cost overruns

## Testing Strategy

### E2E Tests (Playwright)
- Critical user flows only
- Day plan CRUD
- MCQ session flow
- AI plan accept flow
- Dashboard load

### Unit Tests (Future)
- Service functions
- Transformer utilities
- Zod schema validation

### Integration Tests (Future)
- API route handlers
- Database operations
- Error scenarios

## Deployment Considerations

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection
- `AI_API_KEY` - Optional AI service key
- `AI_MODEL` - AI model name
- `AI_API_URL` - AI service endpoint

### Database Migrations
- Prisma migrations for schema changes
- Run migrations before deployment
- Backup before major changes

### Build Process
- `npm run build` - Production build
- TypeScript compilation
- Next.js optimization
- Static asset generation

## Monitoring & Debugging

### Server Logs
- Structured logging with context
- Error tracking with stack traces
- AI service call logging
- Rate limit status logging

### Client Errors
- Error boundaries prevent crashes
- User-friendly error messages
- Retry mechanisms for transient failures

### Database
- Prisma Studio for data inspection
- Query logging in development
- Index usage monitoring

## Future Architecture Enhancements

- **Redis**: Replace in-memory rate limiting
- **Queue System**: Async weak area updates
- **CDN**: Static asset delivery
- **Monitoring**: Error tracking (Sentry)
- **Analytics**: User behavior tracking
- **Caching Layer**: Redis for API responses
