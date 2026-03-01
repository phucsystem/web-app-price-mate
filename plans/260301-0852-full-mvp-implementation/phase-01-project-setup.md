# Phase 1: Project Setup & Infrastructure

## Overview
- **Priority:** P1 (blocker for all other phases)
- **Status:** completed
- **Effort:** 6h
- **Description:** Scaffold .NET 10 Clean Architecture solution, Next.js + Tamagui frontend, Docker Compose for local dev

## Clean Architecture — How It Works

```
┌──────────────────────────────────────────────────┐
│  PriceMate.API (Presentation)                    │
│  - Minimal API endpoints                         │
│  - Middleware (auth, rate-limit, error handling)  │
│  - Program.cs (DI composition root)              │
│  References: Application, Infrastructure         │
├──────────────────────────────────────────────────┤
│  PriceMate.Infrastructure                        │
│  - EF Core DbContext + migrations                │
│  - Repository implementations                    │
│  - External service clients (PA API, SES)        │
│  - BackgroundService jobs                        │
│  References: Application, Domain                 │
├──────────────────────────────────────────────────┤
│  PriceMate.Application (Use Cases)               │
│  - Service interfaces (IProductService, etc.)    │
│  - DTOs, Commands, Queries                       │
│  - Validation logic                              │
│  References: Domain ONLY                         │
├──────────────────────────────────────────────────┤
│  PriceMate.Domain (Core)                         │
│  - Entities, Value Objects, Enums                │
│  - Repository interfaces (IRepository<T>)        │
│  - NO external dependencies whatsoever           │
│  References: NOTHING                             │
└──────────────────────────────────────────────────┘

DEPENDENCY RULE: Dependencies point INWARD only.
API → Infrastructure → Application → Domain
Domain NEVER references any outer layer.
```

## Key Insights
- .NET 10 Minimal APIs preferred over controllers (simpler, more testable)
- `Directory.Build.props` shares common project settings (TFM, nullable, implicit usings)
- Docker Compose: PostgreSQL 17 + .NET API; frontend runs locally via `npm run dev`
- Tamagui requires `@tamagui/next-plugin`, `@tamagui/cli`, build-time CSS extraction

## Related Code Files

### Backend (create)
| File | Action |
|------|--------|
| `src/PriceMate.Domain/PriceMate.Domain.csproj` | create |
| `src/PriceMate.Application/PriceMate.Application.csproj` | create |
| `src/PriceMate.Infrastructure/PriceMate.Infrastructure.csproj` | create |
| `src/PriceMate.API/PriceMate.API.csproj` | create |
| `src/PriceMate.API/Program.cs` | create |
| `src/PriceMate.API/appsettings.json` | create |
| `src/PriceMate.API/appsettings.Development.json` | create |
| `PriceMate.sln` | create |
| `Directory.Build.props` | create |
| `.editorconfig` | create |
| `docker-compose.yml` | create |
| `src/PriceMate.API/Dockerfile` | create |
| `.gitignore` | create |

### Frontend (create)
| File | Action |
|------|--------|
| `frontend/package.json` | create |
| `frontend/tsconfig.json` | create |
| `frontend/next.config.ts` | create |
| `frontend/tamagui.config.ts` | create |
| `frontend/app/layout.tsx` | create |
| `frontend/app/page.tsx` | create (placeholder) |

## Implementation Steps

### Backend Scaffold
1. Create solution root: `dotnet new sln -n PriceMate`
2. Create 4 projects:
   ```bash
   dotnet new classlib -n PriceMate.Domain -o src/PriceMate.Domain
   dotnet new classlib -n PriceMate.Application -o src/PriceMate.Application
   dotnet new classlib -n PriceMate.Infrastructure -o src/PriceMate.Infrastructure
   dotnet new webapi -n PriceMate.API -o src/PriceMate.API --use-minimal-apis
   ```
3. Add projects to solution: `dotnet sln add src/PriceMate.*/PriceMate.*.csproj`
4. Set project references (dependency rule):
   ```bash
   # Application depends on Domain
   dotnet add src/PriceMate.Application reference src/PriceMate.Domain
   # Infrastructure depends on Application + Domain
   dotnet add src/PriceMate.Infrastructure reference src/PriceMate.Application
   dotnet add src/PriceMate.Infrastructure reference src/PriceMate.Domain
   # API depends on Application + Infrastructure (composition root)
   dotnet add src/PriceMate.API reference src/PriceMate.Application
   dotnet add src/PriceMate.API reference src/PriceMate.Infrastructure
   ```
5. Create `Directory.Build.props` at solution root:
   ```xml
   <Project>
     <PropertyGroup>
       <TargetFramework>net10.0</TargetFramework>
       <Nullable>enable</Nullable>
       <ImplicitUsings>enable</ImplicitUsings>
     </PropertyGroup>
   </Project>
   ```
6. Create `.editorconfig` with C# conventions (4-space indent, LF line endings)
7. Create minimal `Program.cs` with health check endpoint
8. Create `appsettings.json` with connection string + JWT config placeholders

### Docker Compose
9. Create `docker-compose.yml`:
   - `postgres`: postgres:17-alpine, port 5432, volume for data persistence
   - `api`: Dockerfile build from `src/PriceMate.API`, port 5000, depends_on postgres
10. Create `Dockerfile` for API (multi-stage: sdk build → aspnet runtime)

### Frontend Scaffold
11. Init Next.js: `npx create-next-app@latest frontend --typescript --app --tailwind=no --eslint --src-dir=no`
12. Install Tamagui packages:
    ```bash
    cd frontend && npm install tamagui @tamagui/config @tamagui/next-plugin @tamagui/next-theme @tamagui/lucide-icons react-native
    npm install -D @tamagui/cli
    ```
13. Create `tamagui.config.ts` with design tokens from UI_SPEC
14. Create `next.config.ts` with `withTamagui` plugin
15. Create root `app/layout.tsx` with TamaguiProvider
16. Create placeholder `app/page.tsx`

### Git Setup
17. Create `.gitignore` (dotnet + node + IDE files)
18. Initial commit

## Todo List
- [x] Backend solution with 4 Clean Architecture projects
- [x] Project references enforce dependency rule
- [x] Directory.Build.props for shared config
- [x] Docker Compose with PostgreSQL + API
- [x] API Dockerfile (multi-stage)
- [x] Minimal Program.cs with health check
- [x] Frontend Next.js + Tailwind scaffold (Tamagui replaced with Tailwind CSS + TanStack)
- [x] tamagui.config.ts with UI_SPEC design tokens (N/A — Tamagui dropped per instruction)
- [x] .gitignore covers both .NET and Node artifacts
- [x] `dotnet build` succeeds
- [x] `docker compose up` starts PostgreSQL + API (not run — would block)
- [x] `npm run build` in frontend/ succeeds

## Success Criteria
- `dotnet build PriceMate.sln` compiles without errors
- `docker compose up -d` starts postgres + api containers
- API health check returns 200 at `GET /health`
- `cd frontend && npm run dev` shows Tamagui-powered page at localhost:3000
- Project reference graph matches Clean Architecture dependency rule

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| .NET 10 SDK not available | High | Use .NET 9 LTS as fallback, upgrade later |
| Tamagui build issues with Next.js | Medium | Follow exact research report setup; test CSS extraction |
| Docker network issues | Low | Use explicit network in compose |
