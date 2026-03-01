# Interface Specification (API)

Base URL: `/api`
Auth: JWT Bearer token in `Authorization` header
Content-Type: `application/json`

## 1. Endpoint Matrix

| Method | URL | Feature | Screen | Auth |
|--------|-----|---------|--------|------|
| POST | /auth/register | FR-01 | S-02 | No |
| POST | /auth/login | FR-02 | S-03 | No |
| POST | /auth/logout | FR-02 | — | Yes |
| POST | /auth/refresh | FR-02 | — | No |
| POST | /auth/forgot-password | FR-14 | S-04 | No |
| POST | /auth/reset-password | FR-14 | S-04 | No |
| GET | /products/search | FR-04 | S-05 | No |
| POST | /products/track-url | FR-03 | S-06 | Yes |
| GET | /products/{asin} | FR-05, FR-09 | S-07 | No |
| GET | /products/{asin}/prices | FR-05 | S-07 | No |
| GET | /dashboard | FR-08 | S-08 | Yes |
| POST | /tracked-items/{id}/alert | FR-06 | S-07 | Yes |
| PUT | /tracked-items/{id}/alert | FR-06 | S-07 | Yes |
| DELETE | /tracked-items/{id} | FR-08 | S-08 | Yes |
| GET | /tracked-items/export | FR-13 | S-08 | Yes |
| GET | /categories | FR-10 | S-09 | No |
| GET | /categories/{slug} | FR-10 | S-09 | No |
| GET | /deals | FR-11 | S-10 | No |

---

## 2. Common Response Format

### Success
```json
{
  "data": { ... },
  "meta": { "cursor": "uuid-or-null", "hasMore": true }
}
```

### Error
```json
{
  "error": { "code": "VALIDATION_ERROR", "message": "Email is required", "details": [] }
}
```

### HTTP Status Codes
| Code | Usage |
|------|-------|
| 200 | Success |
| 201 | Created |
| 400 | Validation error |
| 401 | Unauthorized |
| 404 | Not found |
| 409 | Conflict (duplicate) |
| 429 | Rate limited |
| 500 | Server error |

---

## 3. Endpoint Details

### Auth

#### POST /auth/register
Register new user account.

**Request:**
```json
{ "email": "user@example.com", "password": "min8chars", "displayName": "John" }
```
**Response (201):**
```json
{ "data": { "id": "uuid", "email": "user@example.com", "displayName": "John", "accessToken": "jwt", "refreshToken": "token" } }
```
**Errors:** 400 (validation), 409 (email exists)

---

#### POST /auth/login
Authenticate and return JWT tokens.

**Request:**
```json
{ "email": "user@example.com", "password": "password" }
```
**Response (200):**
```json
{ "data": { "accessToken": "jwt", "refreshToken": "token", "user": { "id": "uuid", "email": "...", "displayName": "..." } } }
```
**Errors:** 401 (invalid credentials)

---

#### POST /auth/refresh
Refresh expired access token.

**Request:**
```json
{ "refreshToken": "token" }
```
**Response (200):**
```json
{ "data": { "accessToken": "new-jwt", "refreshToken": "new-token" } }
```

---

#### POST /auth/forgot-password
Request password reset email.

**Request:**
```json
{ "email": "user@example.com" }
```
**Response (200):**
```json
{ "data": { "message": "If the email exists, a reset link has been sent." } }
```

---

#### POST /auth/reset-password
Reset password with token from email.

**Request:**
```json
{ "token": "reset-token", "newPassword": "newmin8chars" }
```
**Response (200):**
```json
{ "data": { "message": "Password reset successfully." } }
```

---

### Products

#### GET /products/search
Search Amazon AU products via PA API. Supports cursor pagination.

**Query params:** `q` (required), `cursor` (uuid), `limit` (default 20, max 50)

**Response (200):**
```json
{
  "data": [
    {
      "asin": "B0XXXXX",
      "title": "Sony WH-1000XM5",
      "imageUrl": "https://...",
      "currentPrice": 349.00,
      "amazonUrl": "https://amazon.com.au/dp/B0XXXXX?tag=affiliate",
      "dealScore": "great",
      "category": "Electronics"
    }
  ],
  "meta": { "cursor": "uuid-or-null", "hasMore": true, "totalEstimate": 150 }
}
```

---

#### POST /products/track-url
Add product by Amazon AU URL. Fetches product data from PA API and starts tracking.

**Request:**
```json
{ "amazonUrl": "https://www.amazon.com.au/dp/B0XXXXX", "targetPrice": 300.00 }
```
**Response (201):**
```json
{
  "data": {
    "trackedItem": { "id": "uuid", "targetPrice": 300.00, "isActive": true },
    "product": { "asin": "B0XXXXX", "title": "...", "currentPrice": 349.00, "imageUrl": "..." }
  }
}
```
**Errors:** 400 (invalid URL, not amazon.com.au), 409 (already tracking)

---

#### GET /products/{asin}
Get product detail with deal score and stats.

**Response (200):**
```json
{
  "data": {
    "asin": "B0XXXXX",
    "title": "Sony WH-1000XM5",
    "imageUrl": "https://...",
    "amazonUrl": "https://amazon.com.au/dp/B0XXXXX?tag=affiliate",
    "currentPrice": 349.00,
    "lowestPrice": 299.00,
    "highestPrice": 450.00,
    "averagePrice": 380.00,
    "dealScore": "great",
    "category": { "name": "Electronics", "slug": "electronics" },
    "lastFetchedAt": "2026-03-01T08:00:00Z",
    "trackedItem": { "id": "uuid", "targetPrice": 300.00, "isActive": true }
  }
}
```
Note: `trackedItem` is null for guests or if not tracking.

---

#### GET /products/{asin}/prices
Get price history for chart. Supports time range filter.

**Query params:** `range` (30d|90d|180d|1y|all, default 90d)

**Response (200):**
```json
{
  "data": [
    { "price": 349.00, "recordedAt": "2026-03-01T08:00:00Z" },
    { "price": 360.00, "recordedAt": "2026-02-28T08:00:00Z" }
  ],
  "meta": { "range": "90d", "count": 90 }
}
```

---

### Dashboard & Tracked Items

#### GET /dashboard
Get user's tracked items with current prices. Cursor pagination.

**Query params:** `cursor`, `limit` (default 20), `sort` (price_drop|date_added|name, default date_added)

**Response (200):**
```json
{
  "data": {
    "summary": { "totalTracked": 15, "activeAlerts": 8, "recentDrops": 3 },
    "items": [
      {
        "trackedItemId": "uuid",
        "product": { "asin": "B0XXXXX", "title": "...", "imageUrl": "...", "currentPrice": 349.00 },
        "targetPrice": 300.00,
        "isActive": true,
        "priceChange": { "amount": -48.00, "percentage": -12.1 },
        "dealScore": "great",
        "sparkline": [380, 370, 360, 355, 349],
        "createdAt": "2026-02-15T10:00:00Z"
      }
    ]
  },
  "meta": { "cursor": "uuid-or-null", "hasMore": false }
}
```

---

#### POST /tracked-items/{id}/alert
Set price alert on tracked item.

**Request:**
```json
{ "targetPrice": 300.00 }
```
**Response (200):**
```json
{ "data": { "id": "uuid", "targetPrice": 300.00, "isActive": true } }
```

---

#### PUT /tracked-items/{id}/alert
Update existing price alert.

**Request:**
```json
{ "targetPrice": 280.00 }
```
**Response (200):**
```json
{ "data": { "id": "uuid", "targetPrice": 280.00, "isActive": true } }
```

---

#### DELETE /tracked-items/{id}
Remove product from user's tracked list.

**Response (204):** No content

---

#### GET /tracked-items/export
Export tracked items as CSV.

**Response (200):** Content-Type: `text/csv`
```csv
ASIN,Title,Current Price,Target Price,Lowest Price,Highest Price,Deal Score,Amazon URL
B0XXXXX,Sony WH-1000XM5,349.00,300.00,299.00,450.00,great,https://amazon.com.au/dp/B0XXXXX
```

---

### Categories

#### GET /categories
List all categories with product counts.

**Response (200):**
```json
{
  "data": [
    { "id": "uuid", "name": "Electronics", "slug": "electronics", "productCount": 245 },
    { "id": "uuid", "name": "Home & Kitchen", "slug": "home-kitchen", "productCount": 120 }
  ]
}
```

---

#### GET /categories/{slug}
Get products in a category. Cursor pagination.

**Query params:** `cursor`, `limit` (default 20), `sort` (price_drop|price_asc|price_desc)

**Response (200):**
```json
{
  "data": {
    "category": { "name": "Electronics", "slug": "electronics", "productCount": 245 },
    "products": [
      { "asin": "B0XXXXX", "title": "...", "currentPrice": 349.00, "dealScore": "great", "priceChange": { "percentage": -12.1 } }
    ]
  },
  "meta": { "cursor": "uuid-or-null", "hasMore": true }
}
```

---

### Deals

#### GET /deals
Public deals page. SSR-friendly. Cursor pagination.

**Query params:** `cursor`, `limit` (default 20), `sort` (drop_pct|price_asc|category), `category` (slug, optional)

**Response (200):**
```json
{
  "data": [
    {
      "asin": "B0XXXXX",
      "title": "Dyson V15 Detect",
      "imageUrl": "https://...",
      "currentPrice": 599.00,
      "previousPrice": 1049.00,
      "priceChange": { "amount": -450.00, "percentage": -42.9 },
      "dealScore": "great",
      "amazonUrl": "https://amazon.com.au/dp/B0XXXXX?tag=affiliate",
      "category": "Home & Kitchen"
    }
  ],
  "meta": { "cursor": "uuid-or-null", "hasMore": true }
}
```

---

## 4. Deal Score Algorithm

```
range = highest_price - lowest_price
position = (highest_price - current_price) / range

if position >= 0.7  → "great"   (in bottom 30% of price range)
if position >= 0.4  → "good"    (in bottom 60%)
if position >= 0.1  → "average"
else                → null      (no significant deal)
```

---

## 5. Rate Limiting

| Endpoint Group | Limit | Window |
|---------------|-------|--------|
| /auth/* | 10 req | 1 min |
| /products/search | 30 req | 1 min |
| /products/track-url | 10 req | 1 min |
| All other | 60 req | 1 min |

---

## 6. Traceability

| FR | Endpoints |
|----|-----------|
| FR-01 | POST /auth/register |
| FR-02 | POST /auth/login, /auth/logout, /auth/refresh |
| FR-03 | POST /products/track-url |
| FR-04 | GET /products/search |
| FR-05 | GET /products/{asin}/prices |
| FR-06 | POST+PUT /tracked-items/{id}/alert |
| FR-07 | Internal (background service → SES) |
| FR-08 | GET /dashboard |
| FR-09 | Deal score in product responses |
| FR-10 | GET /categories, /categories/{slug} |
| FR-11 | GET /deals |
| FR-12 | priceChange in product responses |
| FR-13 | GET /tracked-items/export |
| FR-14 | POST /auth/forgot-password, /auth/reset-password |
| FR-15 | Internal (background service → PA API) |
