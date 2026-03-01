# Basic Design (UI Specification)

## 1. Design System

### Reference Source
- Design system: https://phucsystem.github.io/mobile-app-design-systems/prototypes/s01-showcase-home.html
- UI Library: Tailwind CSS v4 — utility-first CSS, `@theme {}` token system in `app/globals.css`
- Logo: PriceMate mascot (blue cart with green dollar bill + orange checkmark)
- Style: Clean & Minimal with Material Design influence
- Focus: Readability, simple price charts, clean product cards
- Extracted: 2026-03-01

### Brand Colors (from logo)

| Token | Value | Source | Usage |
|-------|-------|--------|-------|
| --color-brand-blue | #1976D2 | Cart body | Primary brand color, matches --color-primary |
| --color-brand-navy | #1B365D | "Price" wordmark | Heading text, dark emphasis |
| --color-brand-green | #4CAF50 | "Mate" wordmark | Secondary brand, deal highlights |
| --color-brand-success | #388E3C | Dollar bill | Price drops, positive states |
| --color-brand-orange | #F9A825 | Checkmark | Alerts, warnings, CTA accents |

### UI Library: Tailwind CSS v4

- **Package:** `tailwindcss@^4` + `@tailwindcss/postcss` + `@tailwindcss/forms` + `@tailwindcss/typography`
- **Integration:** Next.js App Router; tokens defined via `@theme {}` in `app/globals.css` (no `tailwind.config.ts`)
- **Data fetching:** TanStack Query v5 (`@tanstack/react-query`) for server state
- **Forms:** TanStack Form v1 (`@tanstack/react-form`) for form state and validation
- **Benefits:** Zero-config CSS output, standard CSS custom properties, native cascade layers

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| --color-primary | #1976D2 | Main actions, links, active states |
| --color-primary-light | #42A5F5 | Hover states, secondary emphasis |
| --color-primary-dark | #1565C0 | Active/pressed states |
| --color-primary-bg | #E3F2FD | Primary tinted backgrounds |
| --color-success | #388E3C | Price drops, good deals, positive states |
| --color-warning | #F9A825 | Average deals, caution states |
| --color-error | #D32F2F | Price increases, errors, destructive actions |
| --color-info | #0288D1 | Info states, tips |
| --color-background | #FFFFFF | Page background |
| --color-background-soft | #F5F5F5 | Card backgrounds, alternating rows |
| --color-card-bg | #FFFFFF | Card surfaces |
| --color-border | #E0E0E0 | Card borders, dividers |
| --color-shadow | rgba(0,0,0,0.12) | Shadow base color |
| --color-overlay | rgba(0,0,0,0.5) | Modal overlays |
| --color-text | #212121 | Primary text (gray10) |
| --color-text-soft | #757575 | Secondary text (gray7) |
| --white | #FFFFFF | White |
| --black | #000000 | Black |

**Grayscale:**

| Token | Value |
|-------|-------|
| --gray1 | #FAFAFA |
| --gray2 | #F5F5F5 |
| --gray3 | #EEEEEE |
| --gray4 | #E0E0E0 |
| --gray5 | #BDBDBD |
| --gray6 | #9E9E9E |
| --gray7 | #757575 |
| --gray8 | #616161 |
| --gray9 | #424242 |
| --gray10 | #212121 |

### Typography

| Token | Value | Usage |
|-------|-------|-------|
| --font-heading | -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Roboto', sans-serif | Headings |
| --font-body | -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Roboto', sans-serif | Body text |
| --font-mono | 'SF Mono', 'Roboto Mono', monospace | Prices, ASIN codes |
| --text-h1 | 700 28px/34px | Page titles |
| --text-h2 | 600 24px/30px | Section headings |
| --text-h3 | 600 20px/26px | Card titles, product names |
| --text-h4 | 500 18px/24px | Sub-headings |
| --text-body1 | 400 16px/24px | Body text |
| --text-body2 | 400 14px/20px | Secondary body text |
| --text-caption | 400 12px/16px | Labels, captions |
| --text-button | 500 16px/20px | Button labels |
| --text-overline | 600 11px/16px | Badges, tags, overlines |
| --text-price | 700 24px/30px, font-mono | Current price display |
| --text-price-sm | 600 16px/20px, font-mono | Price in cards/lists |

### Spacing Scale

| Token | Value |
|-------|-------|
| --space-0 | 0px |
| --space-xs | 4px |
| --space-sm | 8px |
| --space-md | 16px |
| --space-lg | 24px |
| --space-xl | 32px |
| --space-2xl | 48px |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| --radius-xs | 4px | Badges, small tags |
| --radius-sm | 8px | Buttons, inputs |
| --radius-md | 12px | Cards, containers |
| --radius-lg | 16px | Large cards, sections |
| --radius-xl | 24px | Modals, sheets |
| --radius-full | 9999px | Avatars, pills |

### Shadow

| Token | Value | Usage |
|-------|-------|-------|
| --shadow-sm | 0 1px 3px rgba(0,0,0,0.12) | Cards at rest |
| --shadow-md | 0 4px 12px rgba(0,0,0,0.12) | Elevated cards, hover |
| --shadow-lg | 0 8px 24px rgba(0,0,0,0.12) | Modals, sheets |
| --shadow-xl | 0 16px 48px rgba(0,0,0,0.12) | Popovers |

### Size Tokens

| Token | Value | Usage |
|-------|-------|-------|
| --icon-sm | 16px | Small icons |
| --icon-md | 24px | Default icons |
| --icon-lg | 32px | Large icons |
| --touch-target | 44px | Minimum tap area |
| --header-height | 56px | Top navigation bar |

### Animation

| Property | Value |
|----------|-------|
| fadeInUp | 0.6s ease-out, translateY(20px→0) |
| fadeIn | 0.3s ease |
| scaleIn | 0.3s, scale(0.92→1) + opacity |
| slideUp | translateY(100%→0) |
| Default transition | 0.15s ease |

### Component Patterns

- **Product Card:** White card-bg, radius-md, shadow-sm (shadow-md on hover), image left, info right, mini price chart bottom, price in mono font
- **Price Chart:** Line chart (Recharts), primary blue line, green/red fill for drops/rises, tooltip with date+price
- **Deal Badge:** Rounded pill (radius-full), colored by deal quality (success=great, warning=average, gray5=no deal)
- **Alert Input:** Inline number input with AUD prefix, radius-sm, primary "Set Alert" button beside it
- **Navigation:** Top bar (header-height: 56px) with logo left, search center, auth right. No sidebar for MVP.
- **Buttons:** 4 variants (filled, outlined, text, icon), radius-sm, touch-target min height
- **Inputs:** 3 variants (outlined, filled, underlined), radius-sm, body1 text size
- **Cards:** 3 variants (elevated/shadow, outlined/border, flat/no-elevation), radius-md

### CJX Stage Variables

| Stage | Description | Key Screens |
|-------|-------------|-------------|
| Onboarding | First-time user discovers app, registers | S-01 Landing, S-02 Register |
| Usage | Core loop: search/add products, track prices | S-05 Search, S-06 Add, S-07 Detail, S-08 Dashboard |
| Retention | Email alerts bring user back; dashboard check habit | S-08 Dashboard, Email alerts |
| Discovery | Browse categories, find new deals | S-09 Categories, S-10 Public Deals |

---

## 2. Screen Flow

```
                    ┌──────────────┐
                    │  S-01        │
              ┌─────│  Landing     │─────┐
              │     └──────────────┘     │
              ▼                          ▼
     ┌──────────────┐          ┌──────────────┐
     │  S-02        │          │  S-03        │
     │  Register    │          │  Login       │
     └──────┬───────┘          └──────┬───────┘
            │         ┌───────────────┘
            ▼         ▼
     ┌──────────────────┐
     │  S-08 Dashboard   │◄─────────────────────┐
     └──┬───┬───┬───────┘                       │
        │   │   │                                │
        │   │   └──────────────┐                 │
        ▼   ▼                  ▼                 │
  ┌──────┐ ┌──────────┐ ┌───────────┐           │
  │ S-05 │ │ S-06     │ │ S-09      │           │
  │Search│ │Add (URL) │ │Categories │           │
  └──┬───┘ └────┬─────┘ └─────┬─────┘           │
     │          │              │                 │
     └──────────┼──────────────┘                 │
                ▼                                │
       ┌──────────────┐                          │
       │  S-07        │──────────────────────────┘
       │Product Detail│
       │(chart+alert) │
       └──────────────┘

  Public (no auth):
       ┌──────────────┐
       │  S-10        │───→ S-07 Product Detail
       │ Public Deals │───→ S-02 Register (CTA)
       └──────────────┘
```

---

## 3. Screen Specifications

### S-01: Landing Page

- **Route:** `/`
- **Auth:** None
- **Layout:** Full-width, centered content, no sidebar
- **Elements:**
  - Hero section: Headline ("Track Amazon AU Prices"), subtitle, search bar (prominent), CTA button ("Start Tracking")
  - How-it-works section: 3 steps (Search → Track → Save) with icons
  - Recent deals preview: 3-4 product cards from public deals
  - Footer: About, Privacy, Terms, affiliate disclosure
- **Transitions:**
  - Search submit → S-05 Search Results
  - CTA → S-02 Register
  - Deal card click → S-07 Product Detail

### S-02: Register

- **Route:** `/register`
- **Auth:** Guest only (redirect if logged in)
- **Layout:** Centered card (max-width 400px)
- **Elements:**
  - Email input (required, email validation)
  - Password input (min 8 chars, strength indicator)
  - Confirm password input
  - "Create Account" button (primary)
  - "Already have an account? Log in" link
- **Transitions:**
  - Success → S-08 Dashboard
  - Login link → S-03 Login
- **Validation:** Client-side + server-side; show inline errors

### S-03: Login

- **Route:** `/login`
- **Auth:** Guest only
- **Layout:** Centered card (max-width 400px)
- **Elements:**
  - Email input
  - Password input
  - "Log In" button (primary)
  - "Forgot password?" link
  - "Don't have an account? Register" link
- **Transitions:**
  - Success → S-08 Dashboard (or previous page)
  - Forgot → S-04 Password Reset
  - Register → S-02 Register

### S-04: Password Reset

- **Route:** `/reset-password`
- **Auth:** Guest only
- **Layout:** Centered card
- **Elements:**
  - Step 1: Email input + "Send Reset Link" button
  - Step 2 (via email link): New password + confirm + "Reset Password" button
- **Transitions:**
  - Step 1 success → confirmation message
  - Step 2 success → S-03 Login

### S-05: Search Results

- **Route:** `/search?q={query}`
- **Auth:** Optional (guests can search; tracking requires login)
- **Layout:** Top search bar + results grid (3 columns desktop, 1 mobile)
- **Elements:**
  - Search input (pre-filled with query)
  - Result count
  - Product cards: image, title (truncated 2 lines), current price, deal badge, "Track" button
  - Infinite scroll: auto-load next page when user scrolls near bottom (IntersectionObserver), loading spinner at bottom while fetching, "No more results" message when exhausted
  - Empty state: "No products found" with suggestions
- **Transitions:**
  - Product card → S-07 Product Detail
  - "Track" button (logged in) → add to tracked + toast confirmation
  - "Track" button (guest) → S-03 Login → return here

### S-06: Add Product (URL)

- **Route:** `/track`
- **Auth:** Required
- **Layout:** Centered card (max-width 600px)
- **Elements:**
  - URL input field with placeholder "Paste Amazon AU product URL..."
  - "Fetch Product" button
  - Preview section (after fetch): product image, title, current price, ASIN
  - Target price input (optional, AUD prefix)
  - "Start Tracking" button (primary)
  - Error state: invalid URL, non-AU product, product not found
- **Transitions:**
  - "Start Tracking" success → S-07 Product Detail
  - Or → S-08 Dashboard with toast

### S-07: Product Detail

- **Route:** `/product/{asin}`
- **Auth:** Optional (alert setting requires login)
- **Layout:** Single column, max-width 800px
- **Elements:**
  - Product header: image (left), title, current price (large, mono), deal badge
  - Amazon link: "View on Amazon AU" (affiliate link with disclosure)
  - Price chart: Recharts line chart, time range selector (30d/90d/180d/1y/All)
  - Stats row: Lowest, Highest, Average price (cards)
  - Alert section (logged in): target price input + "Set Alert" / "Update Alert" button
  - Alert section (guest): "Sign in to set alerts" CTA
  - Price history table: date, price, change (collapsible, last 10 entries)
- **Transitions:**
  - "View on Amazon AU" → new tab (amazon.com.au)
  - "Set Alert" → inline save + toast
  - Back → S-08 Dashboard or S-05 Search

### S-08: Dashboard

- **Route:** `/dashboard`
- **Auth:** Required
- **Layout:** Top bar + grid of product cards (responsive: 3 col → 2 → 1)
- **Elements:**
  - Summary bar: total tracked, active alerts, recent drops count
  - Sort/filter: by price drop %, by date added, by name
  - Product cards: image, title, current price, price change (% + arrow), mini sparkline, alert status indicator, "Remove" action
  - Infinite scroll: auto-load more tracked items on scroll, loading spinner at bottom
  - Empty state: "No tracked items yet" + links to Search and Add URL
  - Floating action: "+ Track New Item" button → S-06
- **Transitions:**
  - Card click → S-07 Product Detail
  - "+ Track" → S-06 Add Product
  - "Remove" → confirmation toast → remove from list

### S-09: Browse Categories

- **Route:** `/categories`
- **Auth:** None
- **Layout:** Grid of category cards
- **Elements:**
  - Category cards: category name, product count, representative image
  - Click → filtered product list for that category
- **Transitions:**
  - Category card → `/categories/{slug}` (filtered product grid, same layout as S-05)

### S-10: Public Deals

- **Route:** `/deals`
- **Auth:** None (SSR for SEO)
- **Layout:** Full-width grid, same product card style as S-05
- **Elements:**
  - Heading: "Today's Best Amazon AU Deals"
  - Sort: by drop %, by price, by category
  - Product cards: image, title, current price, original price (strikethrough), drop %, deal badge
  - Infinite scroll: auto-load next page on scroll, loading spinner, SSR first page for SEO + client-side append for subsequent pages
  - "Track This" CTA on each card (login prompt for guests)
  - SEO: meta title, description, OG tags per product (first page SSR ensures crawlability)
- **Transitions:**
  - Card click → S-07 Product Detail
  - "Track This" (guest) → S-02 Register

---

## 4. Responsive Breakpoints

| Breakpoint | Width | Layout Adjustments |
|------------|-------|--------------------|
| Mobile | < 640px | Single column, stacked cards, hamburger nav |
| Tablet | 640-1024px | 2-column grid, condensed nav |
| Desktop | > 1024px | 3-column grid, full nav bar |

---

## 5. Shared Components

| Component | Usage | Key Props |
|-----------|-------|-----------|
| ProductCard | S-05, S-08, S-10 | product, showTrackBtn, showDealBadge |
| PriceChart | S-07, S-08 (mini) | priceRecords[], timeRange |
| DealBadge | S-05, S-07, S-08, S-10 | score: great/good/average/none |
| SearchBar | S-01, S-05, Navbar | query, onSubmit |
| AlertForm | S-07 | trackedItem, onSave |
| NavBar | All screens | user (optional), searchEnabled |
| AuthGuard | S-06, S-08 | Redirect to login if not authenticated |

---

## 6. Design Rationale

| Choice | Reason |
|--------|--------|
| No sidebar | Simpler for MVP; top nav sufficient for 5-6 routes |
| Mono font for prices | Tabular alignment; prices stand out visually |
| Recharts line chart | Lightweight, React-native, good default styling |
| Minimal color use | Focus attention on prices and deal badges |
| SSR for deals page | SEO is critical for organic traffic acquisition |
| Cards over tables | More scannable for regular shoppers; mobile-friendly |

---

## 7. GATE 2: Requirements Validation

Before proceeding to `/ipa:design`:

- [ ] Stakeholders reviewed SRD.md
- [ ] Feature priorities (P1/P2/P3) confirmed
- [ ] Screen list matches lean MVP scope
- [ ] Design system tokens approved
- [ ] No scope creep detected

**Next:** `/ipa:design` to generate HTML mockups
