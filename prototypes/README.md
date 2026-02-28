# PriceMate AU — HTML Prototypes

Production-ready HTML/CSS/JS mockups generated from `docs/UI_SPEC.md`.

## Quick Start

Open any `.html` file in a browser. All screens are cross-linked via navigation.

**Entry point:** `s01-landing-page.html`

## File Index

| File | Screen | Route | CJX Stage |
|------|--------|-------|-----------|
| `s01-landing-page.html` | S-01 Landing Page | `/` | Onboarding |
| `s02-register.html` | S-02 Register | `/register` | Onboarding |
| `s03-login.html` | S-03 Login | `/login` | Onboarding |
| `s04-password-reset.html` | S-04 Password Reset | `/reset-password` | Onboarding |
| `s05-search-results.html` | S-05 Search Results | `/search?q={query}` | Usage |
| `s06-add-product-url.html` | S-06 Add Product (URL) | `/track` | Usage |
| `s07-product-detail.html` | S-07 Product Detail | `/product/{asin}` | Usage |
| `s08-dashboard.html` | S-08 Dashboard | `/dashboard` | Retention |
| `s09-browse-categories.html` | S-09 Browse Categories | `/categories` | Discovery |
| `s10-public-deals.html` | S-10 Public Deals | `/deals` | Discovery |

## FR Mapping

| FR ID | Feature | Screen(s) |
|-------|---------|-----------|
| FR-01 | User Registration | S-02 |
| FR-02 | User Login/Logout | S-03 |
| FR-03 | Add Product via URL | S-06 |
| FR-04 | Search Amazon Products | S-05 |
| FR-05 | View Price History | S-07 |
| FR-06 | Set Price Alert | S-07 |
| FR-08 | Dashboard | S-08 |
| FR-09 | Deal Score | S-05, S-07, S-10 |
| FR-10 | Category Browse | S-09 |
| FR-11 | Public Deals Page | S-10 |
| FR-12 | Price Drop Badge | S-08, S-10 |
| FR-14 | Password Reset | S-04 |

## Shared Assets

| File | Purpose |
|------|---------|
| `styles.css` | Design tokens (colors, typography, spacing) + base styles |
| `components.css` | Reusable component patterns (hero, product cards, categories) |
| `interactions.js` | CJX entrance animations, toggle groups, toast, track/remove actions |

## Design System Tokens

All tokens extracted from `docs/UI_SPEC.md` Section 1:

- **Colors:** `--color-primary` (#2563EB), `--color-success` (#16A34A), `--color-warning` (#D97706), `--color-danger` (#DC2626)
- **Fonts:** Inter (sans), JetBrains Mono (prices/ASIN)
- **Spacing:** 4/8/16/24/32/48px scale
- **Radii:** 4/8/12/9999px
- **Shadows:** sm/md/lg

## CJX Stage Mapping

| Stage | Body Class | Screens | Animation |
|-------|-----------|---------|-----------|
| Onboarding | `cjx-onboarding` | S-01, S-02, S-03, S-04 | fadeInUp 0.6s |
| Usage | `cjx-usage` | S-05, S-06, S-07 | fadeIn 0.3s |
| Retention | `cjx-retention` | S-08 | fadeIn 0.4s |
| Discovery | `cjx-discovery` | S-09, S-10 | fadeInUp 0.8s |
