---
title: "PriceMate AU Full MVP Implementation"
description: "Complete MVP for Amazon AU price tracking with .NET 10 Clean Architecture backend and Next.js + Tailwind CSS + TanStack Query/Form frontend"
status: completed
priority: P1
effort: 80h
branch: main
tags: [feature, fullstack, backend, frontend, database, infra]
created: 2026-03-01
---

# PriceMate AU — Full MVP Implementation Plan

## Clean Architecture Overview

```
Dependency Direction: Inward Only (outer depends on inner, never reverse)

  API (Presentation) ──> Application ──> Domain (Core)
         |                    |
         └──> Infrastructure ─┘
              (implements interfaces defined in Application/Domain)
```

- **Domain**: Entities, Value Objects, Enums, Interfaces. Zero dependencies.
- **Application**: Use cases, DTOs, service interfaces. Depends on Domain only.
- **Infrastructure**: EF Core, PA API client, SES, BackgroundService. Implements interfaces.
- **API**: Minimal API endpoints, middleware, DI wiring. Maps HTTP to Application layer.

## Phases

| # | Phase | Effort | Status | Key Deliverables |
|---|-------|--------|--------|------------------|
| 1 | [Project Setup & Infrastructure](phase-01-project-setup.md) | 6h | completed | Solution structure, Docker, Next.js scaffold |
| 2 | [Domain & Database](phase-02-domain-database.md) | 8h | completed | Entities, EF Core, migrations, seed |
| 3 | [Authentication](phase-03-authentication.md) | 10h | completed | JWT, refresh tokens, auth endpoints |
| 4 | [Backend API Core](phase-04-backend-api-core.md) | 12h | completed | Products, dashboard, deals, categories |
| 5 | [Amazon Integration & Background Jobs](phase-05-amazon-integration.md) | 10h | completed | PA API client, price fetcher, SES alerts |
| 6 | [Frontend Setup, Auth & Layout](phase-06-frontend-setup-auth.md) | 8h | completed | Tailwind config, TanStack Query/Form, auth pages, NavBar |
| 7 | [Frontend Core Screens](phase-07-frontend-core-screens.md) | 12h | completed | Landing, search, product detail, dashboard |
| 8 | [Frontend Discovery & SEO](phase-08-frontend-discovery.md) | 6h | completed | Categories, deals SSR, SEO meta |
| 9 | [Integration & Deployment](phase-09-integration-deployment.md) | 8h | completed | Docker full-stack, AWS CDK, CORS, polish |

## Dependencies

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
                                  ↓
Phase 1 → Phase 6 → Phase 7 → Phase 8
                                  ↓
                              Phase 9 (requires all above)
```

Backend (1-5) and frontend (1, 6-8) can run in parallel after Phase 1.

## Key Risks

| Risk | Mitigation |
|------|------------|
| PA API deprecation (April 30, 2026) | Abstract behind `IAmazonProductService`; prepare Creators API migration |
| Tailwind + TanStack Query SSR complexity | Use server components by default; `useSuspenseQuery` for data; dynamic imports for Recharts |
| JWT cookie auth cross-domain | Same-origin in dev; SameSite=Lax; proper CORS in prod |

## Docs Reference

- SRD: `docs/SRD.md` | DB: `docs/DB_DESIGN.md` | API: `docs/API_SPEC.md` | UI: `docs/UI_SPEC.md`
- Backend research: `plans/reports/researcher-260301-0852-dotnet-backend.md`
- Frontend research: `plans/reports/researcher-260301-0852-nextjs-frontend.md`
