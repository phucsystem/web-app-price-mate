# PriceMate AU

Track Amazon AU product prices, view price history, and get alerts when prices drop.

## Tech Stack

- **Backend:** .NET 9 Web API (C#) — Clean Architecture (Domain, Application, Infrastructure, API)
- **Frontend:** Next.js 16 + Tailwind CSS v4 + TanStack Query/Form (React 19, TypeScript)
- **Database:** PostgreSQL
- **Infrastructure:** AWS CDK (TypeScript) — RDS, ECS Fargate x2, CloudFront
- **Local Dev:** Docker Compose

## Project Structure

```
backend/                # .NET 9 backend (Clean Architecture)
  PriceMate.Domain/
  PriceMate.Application/
  PriceMate.Infrastructure/
  PriceMate.API/
frontend/               # Next.js 16 frontend (App Router)
infra/                  # AWS CDK infrastructure
docs/                   # IPA documentation (SRD, UI_SPEC, API_SPEC, DB_DESIGN)
plans/                  # Implementation plans and reports
prototypes/             # HTML mockup prototypes
```

## Getting Started

### Prerequisites

- Docker + Docker Compose
- .NET 9 SDK
- Node.js 20+

### Local Development

```bash
# Start PostgreSQL via Docker
docker-compose up -d postgres

# Run the backend API
cd backend/PriceMate.API
dotnet run

# Run the frontend (separate terminal)
cd frontend
npm install
npm run dev
```

The API runs at `http://localhost:5000` and the frontend at `http://localhost:3000`.

### Full Stack with Docker Compose

```bash
docker-compose up
```

## Key Implementation Notes

- Auth uses JWT stored in httpOnly cookies (not Authorization header in the browser)
- Frontend API calls are proxied via `frontend/proxy.ts` (not Next.js `middleware.ts`)
- Tailwind CSS v4 uses `@theme {}` in `app/globals.css` instead of `tailwind.config.ts`
- Background services: price fetcher (every 5h), alert checker, token cleanup

## Prototypes

Open `prototypes/s01-landing-page.html` in a browser to preview all screens.
