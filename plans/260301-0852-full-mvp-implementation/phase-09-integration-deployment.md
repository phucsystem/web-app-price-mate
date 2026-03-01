# Phase 9: Integration & Deployment

## Overview
- **Priority:** P1
- **Status:** completed
- **Effort:** 8h
- **Description:** Docker Compose full-stack, AWS CDK infrastructure, CORS config, environment management, final integration polish

## Key Insights
- Docker Compose for local dev: PostgreSQL + .NET API + Next.js frontend
- AWS CDK (TypeScript): ECS Fargate for API + frontend, RDS PostgreSQL, CloudFront CDN
- CORS must allow Next.js frontend to call .NET API (different origins in dev)
- Environment variables managed via `.env` files locally, AWS SSM in production
- Health checks on both API and frontend for container orchestration

## Related Code Files

### Root (create/modify)
| File | Action |
|------|--------|
| `docker-compose.yml` | modify — add frontend service, networks |
| `docker-compose.prod.yml` | create — production overrides |
| `.env.example` | create — template for env vars |
| `frontend/Dockerfile` | create — multi-stage Next.js build |

### AWS CDK (create)
| File | Action |
|------|--------|
| `infra/package.json` | create |
| `infra/tsconfig.json` | create |
| `infra/bin/app.ts` | create — CDK app entry |
| `infra/lib/database-stack.ts` | create — RDS PostgreSQL |
| `infra/lib/api-stack.ts` | create — ECS Fargate for .NET API |
| `infra/lib/frontend-stack.ts` | create — ECS Fargate for Next.js |
| `infra/lib/cdn-stack.ts` | create — CloudFront distribution |

### Backend (modify)
| File | Action |
|------|--------|
| `src/PriceMate.API/Program.cs` | modify — add CORS, health checks |

### Frontend (modify)
| File | Action |
|------|--------|
| `frontend/next.config.ts` | modify — env vars, output standalone |

## Implementation Steps

### 1. Docker Compose (Full Stack)
```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: pricemate_au
      POSTGRES_USER: pricemate
      POSTGRES_PASSWORD: ${DB_PASSWORD:-dev_password}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pricemate"]
      interval: 5s
      retries: 5

  api:
    build:
      context: .
      dockerfile: src/PriceMate.API/Dockerfile
    ports:
      - "5000:8080"
    environment:
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=pricemate_au;Username=pricemate;Password=${DB_PASSWORD:-dev_password}
      - ASPNETCORE_ENVIRONMENT=Development
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - API_BASE_URL=http://api:8080
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - api

volumes:
  postgres_data:
```

### 2. Frontend Dockerfile
```dockerfile
# Multi-stage build for Next.js
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### 3. Next.js Standalone Output
```typescript
// frontend/next.config.ts
export default withTamagui({
  output: 'standalone', // Required for Docker deployment
  // ... existing config
})
```

### 4. CORS Configuration (.NET API)
```csharp
// Program.cs
builder.Services.AddCors(options => {
    options.AddPolicy("Frontend", policy => {
        policy.WithOrigins(
            builder.Configuration["Cors:AllowedOrigins"]?.Split(',') ?? ["http://localhost:3000"])
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials(); // Required for cookies
    });
});

app.UseCors("Frontend");
```

### 5. Health Checks
```csharp
// .NET API
builder.Services.AddHealthChecks()
    .AddNpgSql(connectionString)
    .AddCheck("self", () => HealthCheckResult.Healthy());
app.MapHealthChecks("/health");
```

### 6. Environment Variables Template
```bash
# .env.example
DB_PASSWORD=change_me
JWT_SECRET=minimum-32-character-secret-key-change-in-production
JWT_ISSUER=PriceMateAU
JWT_AUDIENCE=PriceMateAU
AMAZON_ACCESS_KEY=
AMAZON_SECRET_KEY=
AMAZON_PARTNER_ID=
SES_SENDER_EMAIL=alerts@pricemate.com.au
CORS_ALLOWED_ORIGINS=http://localhost:3000
API_BASE_URL=http://localhost:5000
FRONTEND_BASE_URL=http://localhost:3000
```

### 7. AWS CDK Infrastructure

**Database Stack (RDS PostgreSQL):**
```typescript
// infra/lib/database-stack.ts
const database = new rds.DatabaseInstance(this, 'PriceMateDb', {
  engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_17 }),
  instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
  databaseName: 'pricemate_au',
  credentials: rds.Credentials.fromGeneratedSecret('pricemate'),
  vpc, removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
})
```

**API Stack (ECS Fargate):**
```typescript
// infra/lib/api-stack.ts
const apiService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'ApiService', {
  cluster, memoryLimitMiB: 512, cpu: 256, desiredCount: 1,
  taskImageOptions: {
    image: ecs.ContainerImage.fromAsset('.', { file: 'src/PriceMate.API/Dockerfile' }),
    environment: { ASPNETCORE_ENVIRONMENT: 'Production' },
    secrets: { /* from SSM */ },
    containerPort: 8080,
  },
  healthCheck: { command: ['CMD-SHELL', 'curl -f http://localhost:8080/health || exit 1'] },
})
```

**Frontend Stack (ECS Fargate):**
```typescript
// Similar pattern, builds from frontend/Dockerfile
// Routes through CloudFront
```

**CDN Stack (CloudFront):**
```typescript
// infra/lib/cdn-stack.ts
// CloudFront distribution with:
// - Default behavior: frontend Fargate service
// - /api/* behavior: API Fargate service
// - Cache static assets (_next/static/*) at edge
```

### 8. CDK Init
```bash
mkdir -p infra && cd infra
npx cdk init app --language typescript
npm install @aws-cdk/aws-ecs-patterns @aws-cdk/aws-rds @aws-cdk/aws-cloudfront
```

### 9. Error Handling Polish
- Global error boundary in Next.js (`app/error.tsx`, `app/not-found.tsx`)
- API returns consistent error format for all status codes
- Network error fallback UI ("Unable to connect" message)
- Toast notifications for success/error actions

### 10. Responsive Design Verification
- Test all screens at 3 breakpoints: mobile (<640), tablet (640-1024), desktop (>1024)
- Verify NavBar hamburger menu on mobile
- Verify product card grid reflows correctly
- Verify price chart responsive container resizes

### 11. Smoke Testing Checklist
- [x] Guest can view landing page, deals, product detail
- [x] Guest can search products
- [x] User can register, login, logout
- [x] User can track product by search + by URL
- [x] User can set/update price alert
- [x] User can view dashboard with tracked items
- [x] User can remove tracked item
- [x] User can export CSV
- [x] User can reset password
- [x] Background price fetcher runs and creates price records
- [x] Alert emails sent when price drops below target
- [x] Infinite scroll works on search, dashboard, deals

## Todo List
- [x] Docker Compose with all 3 services + health checks
- [x] Frontend Dockerfile (multi-stage, standalone output)
- [x] CORS configuration in .NET API
- [x] Health check endpoints (API + DB)
- [x] .env.example with all required variables
- [x] AWS CDK: database stack (RDS PostgreSQL)
- [x] AWS CDK: API stack (ECS Fargate)
- [x] AWS CDK: frontend stack (ECS Fargate)
- [x] AWS CDK: CDN stack (CloudFront)
- [x] Error boundary + not-found pages in frontend
- [x] Responsive design verification across breakpoints
- [x] Full smoke test pass (12-point checklist)

## Success Criteria
- `docker compose up` starts all 3 services, API connects to DB
- Frontend at localhost:3000 communicates with API at localhost:5000
- CORS allows credentialed requests from frontend to API
- `cdk synth` generates valid CloudFormation templates
- Health check endpoints return 200
- All smoke test items pass

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| Docker build cache invalidation | Low | Layer ordering: deps → source → build |
| AWS costs exceed expectations | Medium | Use t4g.micro for DB, 0.25 vCPU Fargate; set budget alerts |
| CloudFront cache stale data | Low | Set appropriate TTLs; invalidate on deploy |
| Cross-service networking in Docker | Low | Use default Docker network; service names as hostnames |
