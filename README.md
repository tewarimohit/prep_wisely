# Prep Wisely

A comprehensive study planning and progress tracking application designed specifically for UPSC exam preparation. Combines daily planning, MCQ practice, weak area identification, and AI-powered plan generation to help aspirants maintain consistent, data-driven study routines.

## Problem Statement

UPSC preparation requires:
- **Consistent daily planning** across multiple subjects
- **Regular MCQ practice** to identify knowledge gaps
- **Tracking weak areas** to focus revision efforts
- **Reflection and feedback** to maintain motivation
- **Adaptive planning** that responds to performance data

Traditional tools are either too generic or too complex. Prep Wisely provides a focused, integrated solution that combines planning, practice, and AI assistance while keeping the user in control.

## Core Features

### 📅 Daily Planning
- Create and manage daily study plans with task checklists
- Track completion status with optimistic UI updates
- Carry forward incomplete tasks to the next day
- View plans by date with persistent state

### 📊 Week Overview
- Visualize weekly progress with completion percentages
- See carry-forward task counts per day
- Navigate seamlessly between week and day views
- Weekly completion summary for quick assessment

### 🎯 MCQ Practice
- Practice MCQs with immediate feedback
- Track per-question timing
- Session summaries with accuracy metrics
- Automatic weak area identification

### 📈 Weak Area Tracking
- Automatically derived from MCQ performance
- Rolling accuracy scores per topic
- Prioritized by lowest accuracy and highest attempts
- Integrated into AI planning context

### 💭 Daily Feedback
- Quick mood tracking (great/good/okay/tough/struggling)
- Optional blockers and notes
- Aggregated into weekly dashboard signals
- Lightweight reflection (≤60 seconds)

### 🤖 AI-Powered Planning
- Context-aware plan suggestions based on:
  - Weak areas (top 3-5 topics)
  - Last week completion percentage
  - Recent MCQ accuracy
  - Latest mood and blockers
- Preview before accepting (no silent writes)
- Regenerate suggestions (up to 3 per day)
- Side-by-side comparison with current plan
- User remains in control - AI suggests, user decides

### 📱 Dashboard
- Weekly plan completion overview
- MCQ performance snapshot
- Top 3 weak areas
- Mood and feedback trends
- All data readable in <30 seconds

## Tech Stack

### Frontend
- **Next.js 16** (App Router) - React framework with server components
- **React 19** - UI library
- **TanStack Query** - Server state management, caching, optimistic updates
- **Tailwind CSS** - Utility-first styling
- **TypeScript** - Type safety

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Type-safe database access
- **PostgreSQL** - Relational database
- **Zod** - Runtime schema validation

### AI Integration
- **OpenAI-compatible API** - Plan generation (configurable)
- **Structured prompts** - JSON-only output enforcement
- **Zod validation** - All AI outputs validated
- **Fallback system** - Works without AI service

### Testing
- **Playwright** - End-to-end testing
- **TypeScript** - Type checking

## Architecture

> See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for detailed architecture documentation.

### Design Philosophy

**Schema-First Development**: Database schema (`prisma/schema.prisma`) defines the data model. All API contracts use Zod schemas for validation. This ensures type safety from database to UI.

**User-in-Loop AI**: AI generates suggestions, but users explicitly accept or reject them. No silent writes. All AI-triggered database writes are traceable and user-initiated.

**Fail-Closed Safety**: AI outputs are validated with Zod before use. Invalid responses fall back to context-derived plans. Errors are logged server-side but don't crash the app.

### Architecture Layers

See [docs/architecture.txt](./docs/architecture.txt) for ASCII diagram.

```
┌─────────────────────────────────────────────────────────┐
│                    UI Layer (Next.js App Router)        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │   Day    │  │   Week   │  │   MCQ    │  │   AI     │ │
│  │  Page    │  │   Page   │  │   Play   │  │ Preview  │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
│       │             │             │             │        │
│       └─────────────┴─────────────┴─────────────┘        │
│                          │                               │
│              ┌───────────▼───────────┐                    │
│              │  TanStack Query     │                    │
│              │  (Client Cache)     │                    │
│              └───────────┬───────────┘                    │
└──────────────────────────┼───────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────┐
│              API Routes (Next.js)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ /plans   │  │  /mcq    │  │ /weak-   │  │  /ai    │  │
│  │          │  │          │  │  areas   │  │         │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│       │             │             │             │       │
│       └─────────────┴─────────────┴─────────────┘       │
│                          │                              │
│              ┌───────────▼───────────┐                   │
│              │   Zod Validation    │                   │
│              │   (Input/Output)     │                   │
│              └───────────┬───────────┘                   │
└──────────────────────────┼───────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────┐
│              Service Layer                                │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │  Planner Context │  │  Weak Area        │            │
│  │  Builder         │  │  Service          │            │
│  └──────────────────┘  └──────────────────┘            │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │  AI Planner      │  │  Rate Limiter     │            │
│  │  (Guarded)       │  │  (Server-side)    │            │
│  └──────────────────┘  └──────────────────┘            │
└──────────────────────────┬───────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────┐
│              Data Layer (Prisma + PostgreSQL)            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Plan    │  │   MCQ    │  │  Weak   │  │ Feedback│   │
│  │          │  │          │  │  Areas  │  │         │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└───────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

#### 1. Zod Contracts (`lib/contracts/`)
All API inputs and outputs are validated with Zod schemas. This ensures:
- Type safety at runtime
- Clear API contracts
- Automatic error handling for invalid data
- AI outputs are validated before use

#### 2. AI Safety Boundaries
- **No silent writes**: AI suggestions are preview-only until explicit user acceptance
- **Server-side validation**: All AI outputs validated with Zod before database writes
- **Fallback system**: App works without AI service (uses context-derived plans)
- **Rate limiting**: Server-side limits prevent abuse (10 previews/day, 3 regenerations/day)
- **Structured prompts**: JSON-only output enforced, low temperature for deterministic results

#### 3. Optimistic UI with Server Reconciliation
- TanStack Query provides optimistic updates for instant feedback
- Server response replaces optimistic state (single source of truth)
- Rollback on error ensures UI never shows incorrect data
- Prevents duplicate plans and ordering issues

#### 4. Why This Design Scales

**Modular Services**: Business logic separated into services (`lib/services/`). Easy to test and extend.

**Type-Safe Contracts**: Zod schemas ensure API changes are caught at compile time. Prevents breaking changes.

**Caching Strategy**: TanStack Query caches API responses. Reduces database load and improves performance.

**Database Indexes**: Strategic indexes on `(userId, date)` and `(planId, order)` ensure fast queries as data grows.

**Stateless API**: All API routes are stateless. Easy to scale horizontally.

**AI Isolation**: AI service is isolated with clear boundaries. Can be swapped or disabled without affecting core features.

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd prep_wisely
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/prep_wisely"
AI_API_KEY="your-openai-api-key"  # Optional - app works without it
AI_MODEL="gpt-4o-mini"             # Optional
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

### Running Tests

```bash
# E2E tests (requires dev server)
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui
```

## Project Structure

```
prep_wisely/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── day/               # Day planner page
│   ├── week/              # Week view page
│   ├── dashboard/         # Dashboard page
│   ├── mcq/play/          # MCQ practice page
│   ├── weak-areas/        # Weak areas page
│   └── ai/preview/        # AI plan preview page
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks (TanStack Query)
├── lib/
│   ├── api/              # API client functions
│   ├── contracts/        # Zod schemas for validation
│   ├── services/         # Business logic services
│   ├── transformers/     # Data transformation utilities
│   └── utils/            # Utility functions
├── prisma/
│   └── schema.prisma     # Database schema
├── e2e/                  # Playwright E2E tests
└── scripts/              # Utility scripts
```

## Key Features Explained

### Daily Planning
Plans are stored per user per date (unique constraint). Tasks can be added, edited, deleted, and toggled. Changes persist immediately with optimistic UI updates. Incomplete tasks can be carried forward to the next day.

### Weak Area Tracking
Automatically updated after each MCQ response. For each `(userId, topicId)` pair, maintains:
- Total attempts
- Correct answers count
- Rolling accuracy score (correct / attempts)
- Last seen timestamp

Weak areas are sorted by lowest accuracy first, then highest attempts.

### AI Planning
AI planner receives structured context:
- Top 5 weak areas with scores
- Last week completion percentage
- Recent MCQ accuracy (7 days)
- Latest mood and blockers

Generates daily plans with:
- Contextual title
- Ordered task items
- Focus on weak areas
- Adaptive MCQ practice counts

All outputs validated with Zod. Falls back to context-derived plans if AI fails.

## Development

### Database Management
```bash
# Generate Prisma Client
npm run db:generate

# Push schema changes (dev)
npm run db:push

# Create migration (prod)
npm run db:migrate

# Open Prisma Studio
npm run db:studio
```

### Code Quality
```bash
# Lint
npm run lint

# Type check
npx tsc --noEmit
```

## Security & Best Practices

- **No client-side secrets**: API keys only in server-side code
- **Input validation**: All API inputs validated with Zod
- **Output validation**: All API outputs validated before sending
- **Rate limiting**: Server-side rate limits prevent abuse
- **Error handling**: Graceful fallbacks, no crashes
- **Type safety**: TypeScript + Zod for end-to-end type safety

## Future Roadmap

See [BACKLOG.md](./BACKLOG.md) for planned features:
- Authentication & multi-user support
- Mobile optimization
- Advanced analytics
- Answer sheet upload & evaluation
- Coaching features

## License

Private project - All rights reserved

## Acknowledgments

Built for UPSC aspirants who need a focused, data-driven approach to exam preparation.
