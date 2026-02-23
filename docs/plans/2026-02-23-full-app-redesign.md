# Full App Redesign — Shopkeeper AI

**Date**: 2026-02-23
**Status**: Approved

## Problem

The current app has functional voice + CX integration but lacks:
- Proper new-user onboarding flow (auto-redirect, shop setup wizard)
- Professional UI/UX (current UI is basic/prototype-level)
- Complete data persistence (all operations must sync with Supabase)
- Transaction history with detail views
- Visual analytics with charts and export
- Mobile-optimized navigation (bottom tabs)
- Global voice access (floating mic on all pages)

## Design Decisions

### Theme & Style
- **Style**: Modern minimal — clean whites, subtle shadows, 12px rounded corners
- **Primary color**: Warm orange (#F97316) — Kerala energy
- **Dark accents**: Slate/charcoal for text and sidebar
- **Cards**: White with subtle border, soft shadow on hover
- **Typography**: Clean sans-serif, large readable text for shopkeepers

### Navigation
- **Desktop**: Fixed left sidebar (redesigned with orange accent)
- **Mobile**: Bottom tab bar with 5 tabs: Voice Hub, Dashboard, Billing, Inventory, More (Reports + Settings)
- **Floating mic**: Always visible bottom-right on all pages (hidden on Voice Hub)

### New User Onboarding
```
Phone OTP → Verify → [NEW USER? no shop record]
  YES → /onboarding (2 steps)
         Step 1: Shop details (name EN+ML, address, phone, UPI ID, GSTIN)
         Step 2: Add initial inventory (manual form + voice option)
       → /dashboard
  NO  → /dashboard (returning user)
```

### Pages

| Page | Route | Purpose |
|------|-------|---------|
| Onboarding | `/onboarding` | 2-step wizard for new users |
| Voice Hub | `/voice-hub` | Primary voice interface — all operations |
| Dashboard | `/dashboard` | Today's sales, profit, low stock, recent orders, mini chart |
| Billing | `/billing` | Transaction history: summary cards + filterable table with expandable rows |
| Inventory | `/inventory` | Product grid: search, filter, add/edit, stock levels, low-stock warnings |
| Reports | `/reports` | Charts (Recharts): sales trend line, category pie, payment pie, top products. Export CSV/PDF |
| Settings | `/settings` | Shop profile, preferences |

### Dashboard Layout
- 3 summary cards: Today's Sales, Total Orders, Profit (with % change indicators)
- Low stock alert panel
- Mini sales trend chart (7-day)
- Recent transactions list (last 5)

### Billing Page Layout
- Summary cards: Today total, Week total, Cash total, UPI total
- Filters: Date range picker, payment type dropdown, text search
- Transaction table with expandable rows showing item details

### Inventory Page Layout
- Search bar + Add Product button + category filter + grid/list toggle
- Product cards in grid: name, price, stock level, low-stock badge, edit button
- Add/Edit product dialog/modal

### Reports Page Layout
- Period selector: Today, Week, Month, Custom range
- Export buttons: CSV, PDF
- Sales trend line chart
- Category split pie chart + Payment method pie chart
- Top products table

### Data Flow
- All CRUD operations through Supabase with RLS
- Voice → STT → CX → JSON → Action → Supabase
- Real-time stock updates on transaction completion
- Charts powered by Recharts library
- CSV export: client-side generation
- PDF export: jsPDF (existing dependency)

### New Dependencies
- `recharts` — charting library for reports/dashboard

### Components to Create/Redesign
- `FloatingMic` — global floating voice button
- `BottomTabs` — mobile bottom navigation
- `OnboardingWizard` — 2-step setup wizard
- `TransactionTable` — expandable row table
- `ProductCard` — redesigned inventory card
- `StatCard` — reusable summary stat card with trend indicator
- `DateRangePicker` — filter component
- Redesign: `Sidebar`, `Header`, all page layouts
