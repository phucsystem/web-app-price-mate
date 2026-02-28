# Amazon AU Price Tracking Market Research

**Report Date:** 2026-03-01 | **Researcher:** Claude Code

---

## 1. EXISTING PRICE TRACKERS FOR AMAZON AU

### CamelCamelCamel (au.camelcamelcamel.com)
- **Strengths:** Free, simple UI, price history charts, basic alerts, supports 8 marketplaces (including AU)
- **Weaknesses:** Limited product coverage (~6M products), basic filtering, no advanced seller analytics
- **AU Fit:** Works well for casual shoppers; lacks professional seller features

### Keepa
- **Strengths:** Comprehensive tracking (3.8B products), 11 marketplace support, advanced analytics, professional seller tools
- **Weaknesses:** Paid model, steeper learning curve, browser extension primary interface
- **AU Fit:** Better for serious deal hunters & sellers; market leader with full AU support

### Alternative Trackers (Limited AU Support)
- **HotUKDeals, SlickDeals, OzBargain:** Community-driven deal sites with AU coverage but no dedicated price APIs
- **CheapCheap, PriceSpy:** Limited Australian-specific features; focus on general price comparison

**AU Market Gap:** No specialized price tracker built for Australian retailers/sellers. Existing tools treat AU as secondary market.

---

## 2. AMAZON AU DATA ACCESS OPTIONS

### Official APIs
1. **Product Advertising API (PA API 5.0)** — Available for AU marketplace
   - Access: Public product catalog (titles, images, reviews, pricing)
   - Requirement: AWS account + affiliate registration
   - Limitation: Rate-limited (~1 request/sec), requires affiliate disclosure

2. **Selling Partner API (SP-API)** — For Amazon sellers only
   - Access: Seller inventory, orders, pricing, analytics
   - Requirement: Professional seller account + developer registration
   - Best for: Building AU seller dashboard/repricer tools

### Third-Party Data APIs
- RapidAPI marketplace offers Amazon product data endpoints (varies by provider quality)
- **Note:** Most third-party APIs violate Amazon ToS and risk account bans

### Web Scraping (Not Recommended)
- Technically possible but violates Amazon AU Terms of Service
- Risk: IP blocking, legal action, account termination

---

## 3. LEGAL CONSIDERATIONS FOR SCRAPING AMAZON AU

### Key Risk Factors
- **Amazon ToS Violation:** Explicitly prohibits automated data collection
- **Civil Liability:** Account bans, IP blocking, potential legal action (not criminal)
- **AU Jurisdiction:** Web scraping laws vary; copyright & contract law apply
- **Data Classification:** Public product data (lower risk) vs. protected content (high risk)

### Safer Approaches
1. **Use PA API 5.0** (official, rate-limited, requires affiliate disclosure)
2. **Use SP-API** (for seller partners only)
3. **Manual monitoring** (compliant but unscalable)
4. **Partner agreements** (licensing data from approved sources)

### What NOT to Scrape
- Customer reviews (copyright protected)
- Behind-login seller data
- Personal customer information
- Competitor private pricing strategies

---

## RECOMMENDATION

**For Web Price Mate AU MVP:**
- **Phase 1:** Use PA API 5.0 + manual data entry for core features
- **Phase 2:** Build SP-API seller dashboard (if targeting sellers)
- **Avoid:** Direct scraping unless legal counsel approves

**Competitive Advantage:** No AU-native price tracker exists; market opportunity is real but must use compliant data sources.

---

## UNRESOLVED QUESTIONS

1. Does Amazon AU offer bulk data exports or special partnerships for price tracking tools?
2. Are there AU-specific reseller APIs (JB Hi-Fi, Bunnings, Kogan) that could supplement Amazon data?
3. What's the PA API 5.0 free tier limits for AU region specifically?
