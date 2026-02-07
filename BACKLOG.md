# Prep Wisely - Backlog

## Post-MVP Features

### Authentication & Multi-User
- [ ] Replace `TEST_USER_ID` with real authentication (NextAuth)
- [ ] User registration and login
- [ ] Session management
- [ ] User profile management

### Mobile Optimization
- [ ] Responsive design improvements for mobile devices
- [ ] Touch-friendly interactions
- [ ] Mobile-specific navigation patterns

### Notifications & Reminders
- [ ] Email notifications for plan reminders
- [ ] Push notifications (browser/device)
- [ ] Daily plan reminder system
- [ ] Task deadline reminders

### Analytics & Charts
- [ ] Visual charts for completion trends
- [ ] Performance graphs (MCQ accuracy over time)
- [ ] Weak area visualization
- [ ] Study streak tracking

### Advanced Planning
- [ ] Recurring tasks/templates
- [ ] Plan templates library
- [ ] Bulk task operations
- [ ] Task dependencies

### Enhanced MCQ Features
- [ ] Topic-based filtering UI
- [ ] Difficulty level filtering
- [ ] Custom MCQ sets
- [ ] MCQ bookmarks/favorites
- [ ] Detailed performance analytics per topic

### AI Enhancements
- [ ] AI-powered plan optimization suggestions
- [ ] Personalized study recommendations
- [ ] Adaptive difficulty adjustment
- [ ] Natural language plan editing

## Post-Prelims Features

### Answer Sheet Upload
- [ ] Image upload for answer sheets
- [ ] OCR processing
- [ ] Rubric-based evaluation
- [ ] Reviewer assignment workflow

### Coaching Features
- [ ] Coach dashboard
- [ ] Student progress tracking
- [ ] Feedback and suggestions system
- [ ] Batch operations for coaches

### Advanced Analytics
- [ ] Predictive analytics for exam readiness
- [ ] Comparative performance analysis
- [ ] Detailed time tracking
- [ ] Study pattern analysis

### Social Features
- [ ] Study groups
- [ ] Peer comparison (anonymized)
- [ ] Discussion forums
- [ ] Resource sharing

### Integration Features
- [ ] Calendar integration (Google Calendar, etc.)
- [ ] Export to PDF/Excel
- [ ] API for third-party integrations
- [ ] Webhook support

## Known Improvements (Not Blocking)

### UX Polish
- [ ] Loading skeletons instead of "Loading..." text
- [ ] Smooth transitions between pages
- [ ] Better empty states with illustrations
- [ ] Improved error messages with recovery actions
- [ ] Keyboard shortcuts for common actions

### Performance
- [ ] Implement React Query caching strategies
- [ ] Optimize database queries (add indexes where needed)
- [ ] Image optimization for answer sheets
- [ ] Code splitting for better initial load
- [ ] Service worker for offline support

### Code Quality
- [ ] Add comprehensive unit tests
- [ ] Add integration tests
- [ ] Add E2E tests with Playwright/Cypress
- [ ] Improve TypeScript strictness
- [ ] Add ESLint rules for consistency
- [ ] Document complex business logic

### Infrastructure
- [ ] Set up CI/CD pipeline
- [ ] Add monitoring and error tracking (Sentry)
- [ ] Add analytics (PostHog/Mixpanel)
- [ ] Database backup automation
- [ ] Rate limiting with Redis (instead of in-memory)
- [ ] Caching layer (Redis)

## Deferred Decisions

- [ ] Decide on payment/subscription model
- [ ] Decide on data retention policies
- [ ] Decide on export formats
- [ ] Decide on API versioning strategy
