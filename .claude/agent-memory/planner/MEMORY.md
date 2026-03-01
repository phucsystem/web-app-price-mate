# Planner Agent Memory — PriceMate AU

## Project Overview
- Amazon AU price tracking web app
- Backend: .NET 10 Web API (Clean Architecture), PostgreSQL, EF Core
- Frontend: Next.js App Router + Tailwind CSS + TanStack Query + TanStack Form + Recharts + TypeScript
- Infra: Docker Compose (dev), AWS CDK (prod)

## Key Architecture Decisions
- Clean Architecture: Domain → Application → Infrastructure → API (deps point inward only)
- Domain layer has ZERO external dependencies
- Minimal APIs preferred over controllers in .NET 10
- JWT auth with httpOnly cookies (set by Next.js API routes, not .NET directly)
- `jose` library for JWT in Next.js middleware (Edge Runtime compatible, NOT `jsonwebtoken`)
- Recharts requires dynamic import with `ssr: false`
- Tamagui REMOVED (March 2026) — replaced by Tailwind CSS + TanStack Query/Form
- TanStack Query: useInfiniteQuery for paginated lists, useSuspenseQuery for detail pages
- TanStack Form: headless form management for auth + alert forms
- PA API 5.0 deprecated April 30, 2026 — abstracted behind IAmazonProductService

## Key Docs
- SRD: `docs/SRD.md` (15 FRs, 10 screens, 6 entities)
- DB: `docs/DB_DESIGN.md` (7 tables, UUID PKs, cursor pagination)
- API: `docs/API_SPEC.md` (20+ endpoints, deal score algorithm)
- UI: `docs/UI_SPEC.md` (design tokens, 10 screen specs)

## Active Plan
- Path: `plans/260301-0852-full-mvp-implementation/`
- 9 phases, ~80h total effort
- Backend (phases 1-5) and frontend (phases 1, 6-8) can parallelize after phase 1

## Naming Conventions
- Backend: PascalCase (.cs files), 4-project structure under `src/`
- Frontend: kebab-case (components, hooks, services), under `frontend/`
- Plan files: `phase-NN-descriptive-name.md`
