# Complete UI Rebuild — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the entire frontend UI with a professional POS-style design inspired by the Starline ERP reference, while keeping all backend logic (hooks, contexts, NLP, Supabase) intact.

**Architecture:** New branch `ui-rebuild`. Delete all page and component files. Rebuild from scratch using shadcn/ui + Tailwind with a light orange + soft pastel color scheme. Responsive: sidebar on desktop, bottom tabs on mobile. All data comes from existing hooks (useProducts, useTransactions, useVoice, useAuth, useSmartNLP).

**Tech Stack:** Next.js 14 (static export), TypeScript, Tailwind CSS, shadcn/ui, Recharts, Lucide Icons

---

## Files to KEEP (do NOT touch)

```
hooks/useProducts.ts
hooks/useTransactions.ts
hooks/useVoice.ts
contexts/AuthContext.tsx
lib/supabase/client.ts
lib/supabase/edge-functions.ts
lib/nlp/dialogflow.ts
lib/nlp/intent-router.ts
lib/nlp/useSmartNLP.ts
lib/voice/responses-ml.ts
lib/data/products.ts
lib/constants.ts
lib/utils.ts
types/database.ts
supabase/*
next.config.js
tailwind.config.ts
postcss.config.js
tsconfig.json
package.json
components.json
public/manifest.json
```

## Files to DELETE (old UI)

```
app/(app)/layout.tsx
app/(app)/dashboard/page.tsx
app/(app)/billing/page.tsx
app/(app)/inventory/page.tsx
app/(app)/reports/page.tsx
app/(app)/settings/page.tsx
app/(app)/voice-hub/page.tsx
app/(auth)/login/page.tsx
app/(auth)/onboarding/page.tsx
app/layout.tsx
app/page.tsx
app/globals.css
components/shared/*
components/voice/*
components/voice-hub/*
components/billing/*
components/ui/stat-card.tsx (custom, not shadcn)
```

---

## Task 1: Branch Setup & Cleanup

**Files:**
- Delete: All files listed in "Files to DELETE" above
- Keep: All files listed in "Files to KEEP" above

**Step 1: Create new branch**
```bash
git checkout -b ui-rebuild
```

**Step 2: Delete old UI files**
```bash
# Delete all old page files
rm app/(app)/layout.tsx
rm app/(app)/dashboard/page.tsx
rm app/(app)/billing/page.tsx
rm app/(app)/inventory/page.tsx
rm app/(app)/reports/page.tsx
rm app/(app)/settings/page.tsx
rm app/(app)/voice-hub/page.tsx
rm app/(auth)/login/page.tsx
rm app/(auth)/onboarding/page.tsx
rm app/layout.tsx
rm app/page.tsx
rm app/globals.css

# Delete old custom components
rm components/shared/BottomTabs.tsx
rm components/shared/ErrorBoundary.tsx
rm components/shared/FloatingMic.tsx
rm components/shared/Header.tsx
rm components/shared/Sidebar.tsx
rm components/shared/Toast.tsx
rm -r components/voice/
rm -r components/voice-hub/
rm -r components/billing/
rm components/ui/stat-card.tsx
```

**Step 3: Verify backend files still exist**
Confirm hooks/, contexts/, lib/, types/ are untouched.

**Step 4: Commit**
```bash
git add -A
git commit -m "chore: remove old UI for complete rebuild"
```

---

## Task 2: Design System — Tailwind Config & Global Styles

**Files:**
- Modify: `tailwind.config.ts`
- Create: `app/globals.css`

**Step 1: Update tailwind.config.ts**

Add the custom color palette to the existing config. Keep the shadcn/ui CSS variable setup but add our semantic colors:

```typescript
// In extend.colors, add:
sidebar: {
  DEFAULT: '#FFFFFF',
  active: '#FFF7ED',
  'active-text': '#EA580C',
},
stat: {
  revenue: '#FFF3E0',
  orders: '#E8F5E9',
  customers: '#F3E5F5',
  average: '#E3F2FD',
},
surface: '#FFFFFF',
page: '#F9FAFB',
```

**Step 2: Create globals.css**

Fresh globals.css with:
- Tailwind directives (@tailwind base/components/utilities)
- shadcn/ui CSS variables (light theme only — no dark mode)
- Override `--primary` to orange hue: `24 94% 53%` (orange-500)
- Override `--primary-foreground` to white
- Set body background to page color
- Import Inter font from Google Fonts (or use system font stack)
- Smooth scrolling, antialiasing

**Step 3: Build verification**
```bash
npx next build
```

**Step 4: Commit**
```bash
git commit -m "style: add design system colors and global styles"
```

---

## Task 3: Root Layout & App Shell

**Files:**
- Create: `app/layout.tsx` — root layout (html, body, AuthProvider, Toaster)
- Create: `app/page.tsx` — redirect to /dashboard or /login
- Create: `app/(auth)/login/page.tsx` — Google OAuth login
- Create: `app/(app)/layout.tsx` — sidebar + bottom tabs shell
- Create: `components/layout/Sidebar.tsx`
- Create: `components/layout/BottomTabs.tsx`
- Create: `components/layout/AppHeader.tsx`
- Create: `components/shared/Toast.tsx` — toast notification system

**Step 1: Create root layout**

```tsx
// app/layout.tsx
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'sonner' // or custom Toast
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-page antialiased">
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  )
}
```

**Step 2: Create login page**

Clean centered design:
- App logo/name at top
- Card with "Welcome back" heading
- "Continue with Google" button (uses `signInWithGoogle()` from useAuth)
- "Try Demo Mode" link at bottom (uses `enableDemoMode()`)
- Redirect to /dashboard if already authenticated

**Step 3: Create redirect page (app/page.tsx)**

Simple: check auth → redirect to /dashboard or /login.

**Step 4: Create Sidebar component**

Reference the Starline design:
- White background, border-right
- App logo + name at top
- Nav items with Lucide icons:
  - Dashboard (LayoutDashboard)
  - Voice Hub (Mic)
  - Sales (Receipt)
  - Inventory (Package)
  - Reports (BarChart3)
  - Settings (Settings)
- Active item: orange-50 bg pill, orange-600 text/icon
- Inactive: gray-500 text/icon
- User avatar + name at bottom
- Hidden on mobile (< lg breakpoint)

**Step 5: Create BottomTabs component**

Mobile navigation (visible on < lg):
- Fixed to bottom, white bg, border-top
- 5 tabs: Dashboard, Voice, Sales, Inventory, Settings
- Active tab: orange-500 icon + text
- Inactive: gray-400 icon + text

**Step 6: Create AppHeader component**

Top header bar on mobile (< lg):
- App name left
- Search icon + notification bell right
- Hidden on desktop (sidebar has branding)

**Step 7: Create app layout**

```tsx
// app/(app)/layout.tsx
// Check auth → redirect if not logged in / no shop
// Desktop: flex row → Sidebar (w-64) | main content (flex-1)
// Mobile: AppHeader on top, BottomTabs at bottom
// Main content area: overflow-y-auto, p-6, bg-page
```

**Step 8: Create Toast component**

Simple toast system using sonner or custom implementation.

**Step 9: Build verification**
```bash
npx next build
```

**Step 10: Commit**
```bash
git commit -m "feat: add app shell with sidebar, bottom tabs, login page"
```

---

## Task 4: Dashboard Page

**Files:**
- Create: `app/(app)/dashboard/page.tsx`
- Create: `components/dashboard/StatCard.tsx`
- Create: `components/dashboard/RevenueChart.tsx`
- Create: `components/dashboard/LowStockAlert.tsx`
- Create: `components/dashboard/RecentTransactions.tsx`
- Create: `components/dashboard/TopProducts.tsx`

**Step 1: Create StatCard component**

4 pastel-tinted cards in a grid:
- Icon in a rounded circle (matching pastel bg)
- Big number (formatted with formatCurrency or number)
- Label text (small, gray)
- Percentage change indicator (green up / red down arrow + text)
- Use stat-revenue/stat-orders/stat-customers/stat-average bg colors

**Step 2: Create RevenueChart component**

Recharts line chart:
- 7-day or 30-day revenue
- Orange line for revenue
- Gray grid, rounded corners
- Responsive container
- Data from useTransactions

**Step 3: Create LowStockAlert component**

Card with list of products below min_stock:
- Product name + current stock + min stock
- Orange/red warning indicator
- Link to inventory page
- Data from useProducts().getLowStockProducts()

**Step 4: Create RecentTransactions component**

Card with last 5 transactions:
- Time, items summary, total amount, payment method badge
- Payment method: cash (green badge), upi (blue badge)
- "View All" link to /billing

**Step 5: Create TopProducts component**

Card with top 5 selling products:
- Product name, total orders, total revenue
- Small bar or progress indicator
- Data from useTransactions().topProducts

**Step 6: Create Dashboard page**

Layout:
```
Row 1: [Revenue Card] [Orders Card] [Products Card] [Avg Order Card]
Row 2: [Revenue Chart (2/3 width)] [Low Stock Alert (1/3 width)]
Row 3: [Recent Transactions (1/2)] [Top Products (1/2)]
```
- Welcome message: "Welcome, {shop.name} 👋"
- Sub-text: "Here's what's happening in your store."
- All data from hooks: useAuth (shop), useProducts, useTransactions

**Step 7: Build verification + Commit**

---

## Task 5: Voice Hub Page (Split Screen)

**Files:**
- Create: `app/(app)/voice-hub/page.tsx`
- Create: `components/voice/VoiceMicButton.tsx`
- Create: `components/voice/ConversationLog.tsx`
- Create: `components/voice/LiveCart.tsx`

**Step 1: Create VoiceMicButton component**

Large circular mic button:
- Idle: gray-100 bg, gray-500 mic icon
- Listening: orange-500 bg with pulse animation, white mic icon
- Processing: orange-300 bg with spinning indicator
- onClick: toggleListening from useVoice
- Text below: current state ("Tap to speak", "Listening...", "Processing...")

**Step 2: Create ConversationLog component**

Chat-style conversation display:
- User messages (right-aligned, orange-50 bg): transcript text
- Assistant messages (left-aligned, white bg, border): Malayalam response
- Auto-scroll to bottom on new message
- Timestamps on each message

**Step 3: Create LiveCart component**

Right panel showing current billing cart:
- Header: "Current Bill" with item count badge
- Item list: product name, qty × price, line total
- Subtotal, GST, Total rows
- "Complete Sale" button (orange)
- "Clear Cart" button (outline)
- "Generate QR" button for UPI payment
- Empty state: illustration + "Add items via voice"

**Step 4: Create Voice Hub page**

Split layout:
```
Desktop: [Conversation (60%)] [Live Cart (40%)]
Mobile: Conversation on top, Cart slides up from bottom (or tab toggle)
```

- Top section: Large mic button centered above conversation
- Conversation log below mic
- Cart panel on right (desktop) or bottom sheet (mobile)
- Integration:
  - useVoice for STT/TTS
  - useSmartNLP for intent detection
  - useProducts for product lookup + stock updates
  - intent-router for routing NLP results to actions
  - Cart state managed locally (useState)
  - completeSale: save transaction to Supabase, decrement stock, clear cart

**Step 5: Wire up voice → NLP → cart flow**

When transcript arrives:
1. processText(transcript) → NLPResult
2. routeIntent(nlpResult) → RouterAction
3. If billing.add → find products, add to cart, speak confirmation
4. If billing.total → speak total
5. If billing.complete → completeSale()
6. If stock.check → find product, speak stock level
7. speak(routerAction.voiceResponse) for Malayalam response

**Step 6: Build verification + Commit**

---

## Task 6: Sales/Billing Page

**Files:**
- Create: `app/(app)/billing/page.tsx`

**Step 1: Create Sales page**

Reference the Starline table design (Screenshot 74):
- Page title: "Sales History"
- Tab navigation: "All Sales" | "Today" | "This Week" | "This Month"
- Search bar + payment method filter dropdown
- Clean data table:
  - Columns: Date/Time, Items, Subtotal, GST, Total, Payment Method, Status
  - Items column: comma-separated product names (from transaction.items JSONB)
  - Payment method: colored badge (Cash=green, UPI=blue)
  - Status: badge (Completed=green, Pending=yellow)
  - Row click → expand to show item details
- Pagination at bottom
- "Export CSV" button in header
- Data from useTransactions(shopId, period)

**Step 2: Build verification + Commit**

---

## Task 7: Inventory Page

**Files:**
- Create: `app/(app)/inventory/page.tsx`
- Create: `components/inventory/ProductCard.tsx`
- Create: `components/inventory/ProductFormDialog.tsx`

**Step 1: Create ProductCard component**

Grid card for each product:
- Product name (English + Malayalam)
- Price (formatted)
- Stock level with color indicator:
  - Green if stock > min_stock
  - Orange if stock <= min_stock and > 0
  - Red if stock = 0
- Unit type
- Category badge
- Edit button (pencil icon)
- Delete button (trash icon)

**Step 2: Create ProductFormDialog component**

shadcn/ui Dialog for add/edit:
- Fields: name_en, name_ml, price, cost_price, stock, min_stock, unit (select), category (select), gst_rate
- Pre-filled when editing
- Save calls addProduct() or updateProduct() from useProducts
- Cancel closes dialog
- Loading state on save button

**Step 3: Create Inventory page**

- Header: "Inventory" + "Add Product" button (orange)
- Search bar (searches by name_en, name_ml, aliases)
- Category filter tabs (from PRODUCT_CATEGORIES constant)
- Stats row: Total Products | Low Stock | Out of Stock
- Product grid (3 cols desktop, 2 cols tablet, 1 col mobile)
- Empty state if no products
- Data from useProducts(shopId)

**Step 4: Build verification + Commit**

---

## Task 8: Reports Page

**Files:**
- Create: `app/(app)/reports/page.tsx`

**Step 1: Create Reports page**

- Period selector tabs: "Today" | "This Week" | "This Month" | "This Year"
- Top stats row (same StatCard component from dashboard):
  - Total Revenue, Total Orders, Average Order Value, Top Product
- Revenue trend chart (Recharts AreaChart, orange gradient)
- Sales by payment method (Recharts PieChart: cash vs upi)
- Top 10 products table (product name, qty sold, revenue)
- Export buttons: "Export CSV" | "Export PDF"
- Data from useTransactions(shopId, period)

**Step 2: Build verification + Commit**

---

## Task 9: Settings Page

**Files:**
- Create: `app/(app)/settings/page.tsx`

**Step 1: Create Settings page**

Form sections (cards):
1. **Shop Details**: name, name_ml, address, phone
2. **Payment Settings**: UPI ID, GSTIN
3. **Preferences**: language toggle, voice settings
4. **Account**: email (read-only), sign out button

- Pre-fill from useAuth().shop
- Save updates shop in Supabase (UPDATE shops SET ...)
- Toast on save success
- "Sign Out" calls signOut() from useAuth

**Step 2: Build verification + Commit**

---

## Task 10: Onboarding Wizard

**Files:**
- Create: `app/(auth)/onboarding/page.tsx`

**Step 1: Create Onboarding page**

3-step wizard:
1. **Shop Details** — name, address, phone, UPI ID
2. **Add Products** — quick-add form (name, price, stock, unit) with list below
3. **Done** — success message with "Go to Dashboard" button

- Step indicator at top (circles connected by line)
- Back/Next buttons
- Step 1 saves shop to Supabase (INSERT shops)
- Step 2 saves products to Supabase (INSERT products)
- Step 3 calls refreshShop() and redirects to /dashboard
- Only shows for authenticated users with no shop

**Step 2: Build verification + Commit**

---

## Task 11: Final Integration & Polish

**Step 1: Verify all data flows**
- Login → Google OAuth → redirect to dashboard (or onboarding if new user)
- Onboarding → shop created → products added → redirect to dashboard
- Dashboard → shows real stats from Supabase
- Voice Hub → voice command → NLP → cart → complete sale → transaction saved
- Sales → shows real transactions
- Inventory → shows real products, add/edit/delete works
- Reports → shows real analytics
- Settings → shows shop details, save works

**Step 2: Mobile responsiveness check**
- All pages render correctly at 375px width
- Bottom tabs visible on mobile, sidebar hidden
- Voice hub: conversation and cart stack vertically

**Step 3: Build verification**
```bash
npx next build
```
Must exit with code 0, all pages generated.

**Step 4: Final commit**
```bash
git commit -m "feat: complete UI rebuild with professional POS design"
```

---

## Dependencies Between Tasks

```
Task 1 (cleanup) → Task 2 (design system) → Task 3 (app shell)
Task 3 → Task 4 (dashboard), Task 5 (voice hub), Task 6 (sales),
          Task 7 (inventory), Task 8 (reports), Task 9 (settings),
          Task 10 (onboarding)
All → Task 11 (integration)
```

Tasks 4-10 can be done in any order after Task 3, but Task 5 (voice hub) is the most complex and should be done carefully.

---

## Key Backend Interfaces Reference

### useAuth()
```ts
{ user, session, shop, isLoading, isAuthenticated, isDemoMode,
  signInWithGoogle, signOut, refreshShop, enableDemoMode }
```

### useProducts({ shopId })
```ts
{ products, isLoading, error, isDemoMode,
  loadProducts, findProduct, getAllProducts, getLowStockProducts,
  addProduct, updateProduct, deleteProduct, updateStock }
```

### useTransactions(shopId, period)
```ts
{ transactions, stats: {sales, orders, avgOrder},
  topProducts, isLoading, error, refetch }
```

### useVoice(options?)
```ts
{ state, transcript, interimTranscript, isSupported,
  startListening, stopListening, toggleListening, speak, cancelSpeech }
```

### useSmartNLP()
```ts
{ processText, processTextLocal, isProcessing, lastResult, error }
```

### routeIntent(nlpResult)
```ts
returns { mode, voiceResponse, operation, entities }
```
