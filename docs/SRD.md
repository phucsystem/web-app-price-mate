# System Requirement Definition (SRD)

## 1. System Overview

**PriceMate AU** is a web application that helps Australian shoppers track Amazon AU product prices, view price history, and receive alerts when prices drop to desired levels.

**Goals:**
- Help users make informed purchase decisions on Amazon AU
- Provide price history and deal quality indicators
- Deliver timely email alerts on price drops
- Serve as a public deals discovery platform for organic growth

**Tech Stack:**
- Backend: .NET 10 Web API (LTS) (C#)
- Frontend: Next.js (React, TypeScript)
- Database: PostgreSQL
- Infrastructure: AWS CDK (TypeScript)
- Local Dev: Docker Compose
- Data Source: Amazon Product Advertising API 5.0

## 2. Actors (User Roles)

| Role | Description | Access Level |
|------|-------------|-------------|
| Guest | Unauthenticated visitor browsing public deals | Read-only: public deals page, product search |
| Registered User | Authenticated shopper tracking items | Full: track items, set alerts, view dashboard |
| System (Scheduler) | Background service fetching prices | Internal: PA API calls, email dispatch |

## 3. Functional Requirements (FR-xx)

| ID | Feature | Priority | Description | Actor |
|----|---------|----------|-------------|-------|
| FR-01 | User Registration | P1 | Register via email + password | Guest |
| FR-02 | User Login/Logout | P1 | JWT-based auth, session management | Guest/User |
| FR-03 | Add Product via URL | P1 | Paste Amazon AU URL to start tracking a product | User |
| FR-04 | Search Amazon Products | P1 | Keyword search via PA API, returns AU products | Guest/User |
| FR-05 | View Price History | P1 | Line chart showing price over time (30/90/180/365 days) | Guest/User |
| FR-06 | Set Price Alert | P1 | Define target price threshold per tracked item | User |
| FR-07 | Email Notifications | P1 | Send email when price drops below threshold | System |
| FR-08 | Dashboard | P1 | List all tracked items with current price + alert status | User |
| FR-09 | Deal Score | P2 | Visual indicator (good/great/average) based on price vs historical range | Guest/User |
| FR-10 | Category Browse | P2 | Browse tracked products by Amazon category | Guest/User |
| FR-11 | Public Deals Page | P2 | Show top price drops without login, SEO-friendly | Guest |
| FR-12 | Price Drop Badge | P3 | Visual percentage badge on items with recent drops | Guest/User |
| FR-13 | Export Tracked Items | P3 | Download tracked items as CSV | User |
| FR-14 | Password Reset | P1 | Reset password via email link | Guest |
| FR-15 | Background Price Fetch | P1 | Scheduled job to fetch latest prices from PA API | System |

## 4. Screen List (S-xx)

| ID | Screen Name | Description | Related FR |
|----|-------------|-------------|------------|
| S-01 | Landing Page | Hero + value proposition + CTA to register/search | — |
| S-02 | Register | Email/password registration form | FR-01 |
| S-03 | Login | Email/password login form | FR-02 |
| S-04 | Password Reset | Request + confirm password reset | FR-14 |
| S-05 | Search Results | Product search results grid with "Track" action | FR-04, FR-09 |
| S-06 | Add Product (URL) | Paste URL input + preview fetched product | FR-03 |
| S-07 | Product Detail | Price chart, current price, alert form, deal score | FR-05, FR-06, FR-09 |
| S-08 | Dashboard | Grid of tracked items with prices + alert status | FR-08, FR-12 |
| S-09 | Browse Categories | Category list with product counts | FR-10 |
| S-10 | Public Deals | Top deals grid, sortable by drop %, SSR for SEO | FR-11, FR-12 |

## 5. Entity List (E-xx)

| ID | Entity | Description | Key Fields |
|----|--------|-------------|------------|
| E-01 | User | Registered user account | id (UUID), email, password_hash, display_name, created_at, updated_at |
| E-02 | Product | Amazon AU product | id (UUID), asin, title, image_url, category, amazon_url, current_price, last_fetched_at |
| E-03 | PriceRecord | Historical price snapshot | id (UUID), product_id (FK), price (decimal), recorded_at (timestamptz) |
| E-04 | TrackedItem | User-product tracking link | id (UUID), user_id (FK), product_id (FK), target_price (decimal), is_active (bool), created_at |
| E-05 | Alert | Notification event record | id (UUID), tracked_item_id (FK), alert_type (enum), price_at_alert (decimal), sent_at (timestamptz) |
| E-06 | Category | Product category cache | id (UUID), name, slug, product_count |

### Entity Relationships

```
User (1) ──< TrackedItem (N) >── (1) Product
Product (1) ──< PriceRecord (N)
TrackedItem (1) ──< Alert (N)
Category (1) ──< Product (N)
```

## 6. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Performance | Dashboard loads < 2s; Price chart renders < 1s; Infinite scroll pages load < 500ms |
| UX Pattern | Infinite scroll (IntersectionObserver) on list screens (Search, Dashboard, Deals); cursor-based pagination API |
| Scalability | Support 10K tracked items in MVP; horizontal scaling via AWS |
| Security | Passwords hashed (bcrypt); JWT with refresh tokens; HTTPS only |
| Availability | 99.5% uptime target; graceful degradation if PA API is down |
| Data Freshness | Prices updated every 4-6 hours for active tracked items |
| SEO | Public deals page server-rendered (Next.js SSR); meta tags for products |
| Compliance | Amazon PA API ToS compliant; affiliate disclosure on product links |
| Accessibility | WCAG 2.1 AA for core screens |
| Browser Support | Chrome, Firefox, Safari, Edge (latest 2 versions) |

## 7. Key Decisions (D-xx)

| ID | Decision | Chosen | Rationale |
|----|----------|--------|-----------|
| D-01 | Backend framework | .NET 10 Web API (LTS) | User learning goal; mature, performant |
| D-02 | Frontend framework | Next.js + Tamagui (React/TS) | SSR for SEO; Tamagui for universal styling, optimized CSS output, design token system |
| D-03 | Database | PostgreSQL | Time-series price data; robust querying |
| D-04 | Infrastructure | AWS CDK (TypeScript) | IaC; user preference |
| D-05 | Local dev | Docker Compose | PostgreSQL + API containerized |
| D-06 | Price data | Amazon PA API 5.0 | Only compliant option |
| D-07 | Background jobs | .NET BackgroundService | Built-in; no extra deps for MVP |
| D-08 | Email | Amazon SES | Already on AWS; cost-effective |
| D-09 | Auth | ASP.NET Identity + JWT | Native .NET; JWT for SPA |
| D-10 | Charts | Recharts | Lightweight React chart library |

## 8. Constraints

- Amazon PA API 5.0 requires approved affiliate account (Amazon AU Associates)
- PA API rate limits: ~1 req/sec (throttled); must batch and prioritize
- AU marketplace locale must be explicitly set in PA API calls
- Affiliate links must include proper disclosure per AU consumer law
