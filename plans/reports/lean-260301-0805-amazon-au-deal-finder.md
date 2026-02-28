# Lean MVP Analysis: PriceMate AU

## Problem Statement

Australian Amazon shoppers have no dedicated tool to track prices and find deals on Amazon AU. Existing trackers (CamelCamelCamel, Keepa) treat AU as a secondary market — no AU-native experience, no AUD-first pricing, no local deal intelligence. Regular shoppers miss price drops on items they want because they can't efficiently monitor multiple products.

**Core problem:** "I want to buy X on Amazon AU but I don't know if the current price is good or if I should wait."

## Target Users (→ IPA User Roles)

| User Type | Description | Primary Need |
|-----------|-------------|--------------|
| Regular Shopper | Everyday Amazon AU buyer, price-conscious | Know when to buy — get alerted on price drops |
| Wishlist Builder | Shoppers tracking multiple items across categories | Organize tracked items, compare deals at a glance |
| Guest Visitor | Non-registered user browsing deals | Browse current deals without signup |

## MVP Features (→ IPA Feature List FR-xx)

| ID | Priority | Feature | User Value | Screen | Assumption |
|----|----------|---------|------------|--------|------------|
| FR-01 | P1 | User registration/login | Personalized tracking | S-01 Auth | Users will register to track items |
| FR-02 | P1 | Add product via Amazon AU URL | Start tracking a product instantly | S-03 Add Product | Users have specific products in mind |
| FR-03 | P1 | Search Amazon AU products | Discover products to track | S-02 Search | PA API 5.0 search is sufficient |
| FR-04 | P1 | Price history chart | See if current price is good | S-04 Product Detail | Historical data drives purchase decisions |
| FR-05 | P1 | Set price alert threshold | Get notified at desired price | S-04 Product Detail | Users know their target price |
| FR-06 | P1 | Email notifications | Receive deal alerts | Background | Email is sufficient for MVP alerts |
| FR-07 | P1 | Dashboard — tracked items | Overview of all tracked products | S-05 Dashboard | Users track 5-20 items on average |
| FR-08 | P2 | Deal score/rating | Quick visual indicator of deal quality | S-05 Dashboard | Users want simple good/bad signals |
| FR-09 | P2 | Category browsing | Explore deals by category | S-06 Browse | Some users prefer browsing over searching |
| FR-10 | P2 | Public deals page | Show top deals without login | S-07 Deals | Drives organic traffic + SEO |
| FR-11 | P3 | Price drop percentage badge | Highlight significant drops | S-05, S-07 | Visual cues increase engagement |
| FR-12 | P3 | Export tracked items | Download list as CSV | S-05 Dashboard | Power users want data portability |

## Implementation Phases

| Phase | Focus | Key Features | Effort |
|-------|-------|--------------|--------|
| 1 | Core Infrastructure | Auth, product tracking via URL, price fetching, DB schema, Docker dev env, AWS CDK scaffold | L |
| 2 | User Experience | Search, dashboard, price history charts, email alerts | M |
| 3 | Growth & Polish | Public deals page, deal scoring, category browse, SEO | M |

## Plan Structure Preview

```
plans/260301-0805-amazon-au-deal-finder/
├── plan.md
├── phase-01-core-infrastructure/
│   ├── data.md        # DB schema, migrations, Docker setup
│   └── core.md        # .NET API, PA API integration, AWS CDK
├── phase-02-user-experience/
│   ├── core.md        # Search, alerts, price history logic
│   └── ui.md          # React dashboard, charts, notifications
└── phase-03-growth-polish/
    ├── core.md        # Deal scoring algorithm, categories
    └── ui.md          # Public deals page, SEO
```

## GATE 1: Scope Validation

Before proceeding to `/ipa:spec`, complete this checklist:

- [ ] Talked to 3+ potential users about the problem
- [ ] Users confirmed price tracking on Amazon AU is a real pain point
- [ ] MVP scope acceptable (3 phases)
- [ ] Assumptions documented for later validation
- [ ] Team aligned on priorities

**Warning:** Do NOT proceed if scope > 3 phases without re-scoping.

## MVP Screens (→ IPA Screen List S-xx)

| ID | Screen | Purpose | Features |
|----|--------|---------|----------|
| S-01 | Auth (Login/Register) | User account management | FR-01 |
| S-02 | Search Results | Find Amazon AU products | FR-03 |
| S-03 | Add Product | Track product via URL paste | FR-02 |
| S-04 | Product Detail | View price history + set alert | FR-04, FR-05 |
| S-05 | Dashboard | Overview of all tracked items | FR-07, FR-08, FR-11 |
| S-06 | Browse Categories | Explore deals by category | FR-09 |
| S-07 | Public Deals | Top current deals (no login) | FR-10, FR-11 |

## Data Entities (→ IPA Entity List E-xx)

| ID | Entity | Description | Key Fields |
|----|--------|-------------|------------|
| E-01 | User | Registered user | id, email, password_hash, created_at |
| E-02 | Product | Amazon AU product | id, asin, title, image_url, category, amazon_url |
| E-03 | PriceRecord | Price snapshot at a point in time | id, product_id, price, currency, recorded_at |
| E-04 | TrackedItem | User-product tracking relationship | id, user_id, product_id, target_price, is_active |
| E-05 | Alert | Notification sent to user | id, tracked_item_id, type, sent_at, price_at_alert |

## User Flow (→ IPA Screen Flow)

```
[S-07 Public Deals] ──→ [S-01 Auth] ──→ [S-05 Dashboard]
                                              │
                              ┌────────────────┼────────────────┐
                              ▼                ▼                ▼
                        [S-02 Search]   [S-03 Add URL]   [S-06 Browse]
                              │                │                │
                              └────────────────┼────────────────┘
                                               ▼
                                      [S-04 Product Detail]
                                      (price chart + set alert)
```

## Tech Decisions (→ IPA Key Decisions D-xx)

| ID | Decision | Context | Chosen | Rationale |
|----|----------|---------|--------|-----------|
| D-01 | Backend framework | User learning goal | .NET Core 8 Web API | User wants to learn .NET; mature, performant |
| D-02 | Frontend framework | SPA needed | Next.js (React) | User preference; SSR for SEO on deals page |
| D-03 | Database | Relational data with time-series prices | PostgreSQL | User preference; excellent for time-series queries |
| D-04 | Infrastructure | Cloud deployment | AWS CDK (TypeScript) | User preference; IaC, repeatable deployments |
| D-05 | Local dev | Consistent environment | Docker Compose | PostgreSQL + .NET API in containers |
| D-06 | Price data source | Legal compliance | Amazon PA API 5.0 | Only compliant option; requires affiliate signup |
| D-07 | Price fetching | Background job scheduling | .NET BackgroundService + Hangfire | Built-in .NET scheduler; persistent job queue |
| D-08 | Email delivery | Transactional emails | Amazon SES | Already on AWS; cost-effective for alerts |
| D-09 | Auth | User authentication | ASP.NET Core Identity + JWT | Native .NET auth; JWT for SPA |
| D-10 | Charts | Price history visualization | Recharts (React) | Lightweight, composable, React-native |

## Nice-to-Have (Post-MVP)

- **Mobile app** — React Native wrapper for push notifications
- **Browser extension** — Track prices while browsing Amazon AU
- **Social sharing** — Share deals with friends
- **Price prediction** — ML-based "wait or buy now" recommendations
- **Multi-retailer** — Expand beyond Amazon AU (eBay, Kmart, etc.)
- **Telegram/Discord bot** — Alternative alert channels

## Key Assumptions to Validate

| # | Assumption | Risk | Validation Method |
|---|-----------|------|-------------------|
| 1 | Amazon PA API 5.0 works for AU marketplace | High | Sign up for affiliate account + test API |
| 2 | Users will register to track items (not just browse) | Medium | Landing page signup conversion test |
| 3 | Email alerts are sufficient for MVP (no push) | Low | User feedback after launch |
| 4 | Price history data drives purchase decisions | Medium | User interviews + analytics |
| 5 | PA API rate limits are sufficient for reasonable tracking frequency | High | API testing — check limits per ASIN |
| 6 | Amazon AU product catalog is queryable via PA API search | High | Test search endpoint with AU locale |

## Out of Scope (MVP)

- Mobile native app
- Browser extension
- Multi-retailer support
- Price prediction / ML
- Social features
- Seller analytics
- Real-time websocket price updates
- Internationalization (English AU only)

## Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| PA API access denied/revoked | Critical — no data source | Medium | Apply early; have scraping fallback plan (legal review) |
| PA API rate limits too restrictive | High — stale prices | Medium | Batch requests; prioritize active tracked items |
| Amazon blocks AU affiliate signups | Critical | Low | Apply via Amazon AU Associates program first |
| Low user adoption | Medium | Medium | SEO on public deals page; OzBargain community |
| Price data gaps (API downtime) | Low | Low | Graceful degradation; show "last updated" timestamp |

## Next Step

After GATE 1 validation:
```
→ Run `/ipa:spec` to generate SRD.md + UI_SPEC.md
```
