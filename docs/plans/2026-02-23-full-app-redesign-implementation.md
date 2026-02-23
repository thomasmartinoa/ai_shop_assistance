# Full App Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the Shopkeeper AI app with professional UI/UX, proper onboarding flow, complete Supabase integration, and global voice access.

**Architecture:** Modern minimal design with warm orange theme. Two-step onboarding for new users. Sidebar (desktop) + bottom tabs (mobile) navigation. Floating mic on all pages. Recharts for analytics. All data persisted to Supabase.

**Tech Stack:** Next.js 14, Tailwind CSS, shadcn/ui, Recharts, Supabase, Dialogflow CX

---

## Phase 1: Theme & Design System

### Task 1.1: Update Color Theme to Warm Orange

**Files:**
- Modify: `app/globals.css`
- Modify: `tailwind.config.ts`

**Step 1: Update CSS custom properties in globals.css**

Replace the `:root` block with warm orange theme:

```css
:root {
  --background: 0 0% 99%;
  --foreground: 224 71% 4%;
  --card: 0 0% 100%;
  --card-foreground: 224 71% 4%;
  --popover: 0 0% 100%;
  --popover-foreground: 224 71% 4%;
  --primary: 24 95% 53%;
  --primary-foreground: 0 0% 100%;
  --secondary: 30 80% 96%;
  --secondary-foreground: 24 80% 30%;
  --muted: 220 14% 96%;
  --muted-foreground: 220 9% 46%;
  --accent: 30 80% 96%;
  --accent-foreground: 24 80% 30%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;
  --border: 220 13% 91%;
  --input: 220 13% 91%;
  --ring: 24 95% 53%;
  --radius: 0.75rem;
  --success: 142 76% 36%;
  --success-foreground: 0 0% 100%;
  --warning: 38 92% 50%;
  --warning-foreground: 0 0% 100%;
}
```

Also update the `.dark` block to match (orange primary in dark).

**Step 2: Add success/warning colors to tailwind.config.ts**

Add to `theme.extend.colors`:
```typescript
success: {
  DEFAULT: 'hsl(var(--success))',
  foreground: 'hsl(var(--success-foreground))',
},
warning: {
  DEFAULT: 'hsl(var(--warning))',
  foreground: 'hsl(var(--warning-foreground))',
},
```

**Step 3: Run build to verify no breakage**

Run: `npx next build`
Expected: Build succeeds (theme is CSS-variable-based, so all components auto-update)

**Step 4: Commit**

```
git add app/globals.css tailwind.config.ts
git commit -m "feat: update theme to warm orange color scheme"
```

---

### Task 1.2: Create StatCard Component

**Files:**
- Create: `components/ui/stat-card.tsx`

**Step 1: Create the StatCard component**

```tsx
'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  variant?: 'default' | 'warning' | 'success';
  className?: string;
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = 'default', className }: StatCardProps) {
  const variantStyles = {
    default: 'bg-white border-border',
    warning: 'bg-orange-50 border-orange-200',
    success: 'bg-green-50 border-green-200',
  };

  return (
    <div className={cn(
      'rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md',
      variantStyles[variant],
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={cn(
          'p-2 rounded-lg',
          variant === 'warning' ? 'bg-orange-100 text-orange-600' :
          variant === 'success' ? 'bg-green-100 text-green-600' :
          'bg-primary/10 text-primary'
        )}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      {(subtitle || trend) && (
        <div className="flex items-center gap-2 mt-1">
          {trend && (
            <span className={cn(
              'text-xs font-medium',
              trend.isPositive ? 'text-green-600' : 'text-red-500'
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
          )}
          {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Run build to verify**

Run: `npx next build`

**Step 3: Commit**

```
git add components/ui/stat-card.tsx
git commit -m "feat: add StatCard reusable component"
```

---

### Task 1.3: Install Additional shadcn Components

**Files:**
- Create: `components/ui/badge.tsx`
- Create: `components/ui/dialog.tsx`
- Create: `components/ui/select.tsx`
- Create: `components/ui/tabs.tsx`
- Create: `components/ui/table.tsx`
- Create: `components/ui/separator.tsx`
- Create: `components/ui/dropdown-menu.tsx`
- Create: `components/ui/avatar.tsx`
- Create: `components/ui/progress.tsx`
- Create: `components/ui/tooltip.tsx`
- Create: `components/ui/sheet.tsx`

**Step 1: Install each component using shadcn CLI**

Run these commands:
```bash
npx shadcn@latest add badge dialog select tabs table separator dropdown-menu avatar progress tooltip sheet --yes
```

Note: If shadcn CLI doesn't work, manually create each component file using the shadcn/ui source code.

**Step 2: Install any missing Radix dependencies**

Check package.json for any new Radix packages needed, install with `npm install`.

**Step 3: Run build to verify**

Run: `npx next build`

**Step 4: Commit**

```
git add components/ui/ package.json package-lock.json
git commit -m "feat: add shadcn badge, dialog, select, tabs, table, separator, dropdown, avatar, progress, tooltip, sheet"
```

---

### Task 1.4: Install Recharts

**Files:**
- Modify: `package.json`

**Step 1: Install recharts**

Run: `npm install recharts`

**Step 2: Run build to verify**

Run: `npx next build`

**Step 3: Commit**

```
git add package.json package-lock.json
git commit -m "feat: add recharts dependency for analytics charts"
```

---

## Phase 2: Navigation Redesign

### Task 2.1: Redesign Sidebar

**Files:**
- Modify: `components/shared/Sidebar.tsx`

**Step 1: Rewrite the Sidebar with modern minimal design**

Key changes:
- Clean white background with subtle left border accent in orange
- Navigation items: icon + label, active state with orange left bar + orange text
- Logo/branding at top with app name
- Shop info section at bottom (above logout)
- Compact icon-only mode option (not required for MVP)
- Items: Voice Hub (Mic), Dashboard (LayoutDashboard), Billing (Receipt), Inventory (Package), Reports (BarChart3), Settings (Settings)
- Active item: `bg-orange-50 text-primary border-l-3 border-primary font-semibold`
- Hover: `hover:bg-muted`
- Logout button at very bottom with `LogOut` icon

Important: Keep the mobile overlay behavior (controlled by parent) but improve animation (slide from left with backdrop).

**Step 2: Run build**

**Step 3: Commit**

```
git commit -m "feat: redesign sidebar with modern minimal orange theme"
```

---

### Task 2.2: Create Bottom Tab Navigation (Mobile)

**Files:**
- Create: `components/shared/BottomTabs.tsx`

**Step 1: Create the BottomTabs component**

```tsx
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Mic, LayoutDashboard, Receipt, Package, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const tabs = [
  { href: '/voice-hub', label: 'Voice', icon: Mic },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/billing', label: 'Billing', icon: Receipt },
  { href: '/inventory', label: 'Inventory', icon: Package },
];

const moreTabs = [
  { href: '/reports', label: 'Reports' },
  { href: '/settings', label: 'Settings' },
];

export function BottomTabs() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border lg:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[60px]',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
              <span className="text-[10px] font-medium">{label}</span>
              {isActive && <div className="absolute bottom-1 w-6 h-0.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
        <button
          onClick={() => setShowMore(!showMore)}
          className={cn(
            'flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[60px]',
            (pathname === '/reports' || pathname === '/settings') ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>
      {/* More menu popup */}
      {showMore && (
        <div className="absolute bottom-16 right-2 bg-white rounded-xl shadow-lg border p-2 min-w-[140px]">
          {moreTabs.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setShowMore(false)}
              className="block px-4 py-2.5 text-sm rounded-lg hover:bg-muted">
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
```

**Step 2: Run build**

**Step 3: Commit**

```
git commit -m "feat: create mobile bottom tab navigation"
```

---

### Task 2.3: Create Floating Mic Button

**Files:**
- Create: `components/shared/FloatingMic.tsx`

**Step 1: Create FloatingMic component**

This is a floating action button that appears on all pages EXCEPT `/voice-hub` (where voice is integrated). When tapped, it opens a small voice overlay/sheet that processes commands using the same `useSmartNLP` + `useVoice` hooks.

Key behavior:
- Fixed position: bottom-right (above bottom tabs on mobile)
- Animated pulse when listening
- Tap to toggle listening on/off
- Shows small transcript overlay when active
- Routes voice results to the appropriate action (same as voice-hub logic but simplified)

```tsx
'use client';

import { usePathname } from 'next/navigation';
import { Mic, MicOff, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function FloatingMic() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Hide on voice-hub page (voice is integrated there)
  if (pathname === '/voice-hub') return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed z-40 rounded-full shadow-lg transition-all duration-200',
          'bg-primary text-white hover:bg-primary/90',
          'h-14 w-14 flex items-center justify-center',
          'bottom-20 right-4 lg:bottom-6 lg:right-6',
          isOpen && 'bg-destructive hover:bg-destructive/90'
        )}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
      </button>
      {isOpen && (
        <div className={cn(
          'fixed z-30 bg-white rounded-2xl shadow-xl border p-4',
          'bottom-36 right-4 lg:bottom-22 lg:right-6',
          'w-72 max-h-48'
        )}>
          <p className="text-sm text-muted-foreground text-center">
            🎤 Voice assistant ready...
          </p>
          {/* Voice interaction UI will be wired in later */}
        </div>
      )}
    </>
  );
}
```

Note: Full voice wiring will be done after the page redesigns. For now, create the visual component.

**Step 2: Run build**

**Step 3: Commit**

```
git commit -m "feat: create floating mic button component"
```

---

### Task 2.4: Redesign Header

**Files:**
- Modify: `components/shared/Header.tsx`

**Step 1: Redesign Header**

Key changes:
- Clean white with subtle bottom border
- Left: Hamburger menu (mobile only) or breadcrumb-style page title
- Center: Page title (context-aware based on pathname)
- Right: Notification bell + user avatar dropdown
- Slim height (56px)
- Remove shop name from header (it's in sidebar now)

**Step 2: Run build**

**Step 3: Commit**

```
git commit -m "feat: redesign header with clean minimal style"
```

---

### Task 2.5: Update App Layout

**Files:**
- Modify: `app/(app)/layout.tsx`

**Step 1: Update layout to include BottomTabs and FloatingMic**

```tsx
import { Sidebar } from '@/components/shared/Sidebar';
import { Header } from '@/components/shared/Header';
import { BottomTabs } from '@/components/shared/BottomTabs';
import { FloatingMic } from '@/components/shared/FloatingMic';

// In the return JSX:
<div className="min-h-screen bg-muted/30">
  <Sidebar ... />
  <div className="lg:pl-64">
    <Header ... />
    <main className="p-4 lg:p-6 pb-20 lg:pb-6">
      {children}
    </main>
  </div>
  <BottomTabs />
  <FloatingMic />
</div>
```

Key: `pb-20` on mobile to make room for bottom tabs.

**Step 2: Run build**

**Step 3: Commit**

```
git commit -m "feat: update app layout with bottom tabs, floating mic, and refined spacing"
```

---

## Phase 3: Auth & Onboarding

### Task 3.1: Redesign Login Page

**Files:**
- Modify: `app/(auth)/login/page.tsx`

**Step 1: Redesign the login page with professional look**

Key changes:
- Split layout: Left side hero/branding (desktop), right side form
- Mobile: Full-width card form
- Orange gradient accents
- App logo/name prominently displayed
- Clean phone input with country code prefix (+91)
- OTP input as separate digit boxes (6 digits)
- Demo mode as a subtle link at bottom, not a prominent button
- Loading states with spinner on buttons

**Step 2: Run build**

**Step 3: Commit**

```
git commit -m "feat: redesign login page with professional split layout"
```

---

### Task 3.2: Create Onboarding Page

**Files:**
- Create: `app/(auth)/onboarding/page.tsx`

**Step 1: Create 2-step onboarding wizard**

**Step 1 UI — Shop Details:**
- Shop name (English) — required
- Shop name (Malayalam) — optional
- Phone number — pre-filled from auth
- Address — textarea
- UPI ID — for payments
- GSTIN — optional

**Step 2 UI — Initial Inventory:**
- Quick-add product form: name, Malayalam name, price, unit, initial stock
- Option to add via voice (mic button)
- Product list showing added items
- "Skip for now" option
- "I'll add products later" button

**Data flow:**
- Step 1 submit → INSERT into `shops` table → store shop in AuthContext
- Step 2 each product → INSERT into `products` table
- On complete → navigate to `/dashboard`

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 pt-8 mb-8">
        <div className={cn('h-2 w-16 rounded-full', step >= 1 ? 'bg-primary' : 'bg-muted')} />
        <div className={cn('h-2 w-16 rounded-full', step >= 2 ? 'bg-primary' : 'bg-muted')} />
      </div>

      {step === 1 && <ShopDetailsForm onNext={() => setStep(2)} />}
      {step === 2 && <InventorySetupForm onComplete={() => router.push('/dashboard')} />}
    </div>
  );
}
```

**Step 2: Run build**

**Step 3: Commit**

```
git commit -m "feat: create 2-step onboarding wizard for new users"
```

---

### Task 3.3: Update AuthContext for Auto-Redirect

**Files:**
- Modify: `contexts/AuthContext.tsx`
- Modify: `app/(app)/layout.tsx`

**Step 1: Add `isNewUser` flag to AuthContext**

After OTP verification, if `fetchShop()` returns null (no shop), set `isNewUser = true`.

**Step 2: Update app layout to redirect new users**

In `app/(app)/layout.tsx`, after auth check:
```tsx
if (isAuthenticated && !shop && !isDemoMode) {
  router.push('/onboarding');
  return <LoadingSpinner />;
}
```

**Step 3: Update login page redirect**

After successful OTP verification in login page:
- If new user (no shop) → redirect to `/onboarding`
- If returning user → redirect to `/dashboard`

**Step 4: Run build**

**Step 5: Commit**

```
git commit -m "feat: auto-redirect new users to onboarding after OTP"
```

---

## Phase 4: Dashboard Redesign

### Task 4.1: Redesign Dashboard Page

**Files:**
- Modify: `app/(app)/dashboard/page.tsx`

**Step 1: Rewrite dashboard with professional layout**

Sections (top to bottom):
1. **Welcome header**: "Good [morning/afternoon], [Shop Name]" with date
2. **3 StatCards row**: Today's Sales (₹), Orders Count, Profit (with trend arrows)
3. **Two-column grid**:
   - Left: Low Stock Alerts card (list of products below min_stock, with restock button)
   - Right: Mini sales trend chart (7-day line chart using Recharts)
4. **Recent Transactions**: Last 5 transactions in a clean list (time, items count, total, payment method badge)
5. **Quick Actions**: Start Voice Billing (prominent CTA), View Inventory, See Reports

Use `StatCard` component from Task 1.2.
Use `useTransactions()` hook for real data.
Use Recharts `ResponsiveContainer` + `LineChart` for the mini chart.

**Step 2: Run build**

**Step 3: Commit**

```
git commit -m "feat: redesign dashboard with stat cards, chart, and modern layout"
```

---

## Phase 5: Inventory Page Redesign

### Task 5.1: Redesign Inventory Page

**Files:**
- Modify: `app/(app)/inventory/page.tsx`

**Step 1: Rewrite inventory page**

Sections:
1. **Header bar**: Title + Search input + "Add Product" button (primary) + View toggle (grid/list)
2. **Category filter**: Horizontal scrollable pill buttons (All, Grains, Spices, Personal Care, etc.)
3. **Product grid**: Cards with:
   - Product name (EN + ML)
   - Price per unit
   - Stock level with color indicator (green=ok, orange=low, red=critical)
   - Category badge
   - Edit button → opens dialog
4. **Add/Edit Product Dialog** (using shadcn Dialog):
   - Fields: Name (EN), Name (ML), Price, Cost Price, Unit (select), Stock, Min Stock, Category, GST Rate
   - Save → INSERT or UPDATE in Supabase products table
5. **Empty state**: Illustrated empty state when no products, with CTA to add first product

Preserve voice commands for stock management (the `useSmartNLP` integration stays).

**Step 2: Run build**

**Step 3: Commit**

```
git commit -m "feat: redesign inventory page with product grid, filters, and add/edit dialog"
```

---

## Phase 6: Billing/Transactions Page Redesign

### Task 6.1: Redesign Billing Page as Transaction History

**Files:**
- Modify: `app/(app)/billing/page.tsx`

**Step 1: Rewrite billing page as transaction history**

The billing page now shows transaction HISTORY (voice billing happens in Voice Hub).

Sections:
1. **Summary Cards row** (4 cards):
   - Today's Revenue
   - This Week's Revenue  
   - Cash Payments total
   - UPI Payments total
2. **Filters bar**: Date range picker, Payment method dropdown (All/Cash/UPI), Search by transaction ID
3. **Transaction Table** (using shadcn Table):
   - Columns: # | Date/Time | Items | Total | Payment | Status
   - Expandable rows: Click to see item details (product, qty, unit price, line total)
   - Pagination or "Load more"
4. **Empty state**: "No transactions yet" with link to Voice Hub

Data from `useTransactions()` hook.
Keep the voice billing functionality accessible but move the primary billing flow to Voice Hub.

**Step 2: Run build**

**Step 3: Commit**

```
git commit -m "feat: redesign billing page as transaction history with filters and expandable table"
```

---

## Phase 7: Reports Page with Charts

### Task 7.1: Redesign Reports Page

**Files:**
- Modify: `app/(app)/reports/page.tsx`

**Step 1: Rewrite reports page with charts and export**

Sections:
1. **Period Selector**: Tab buttons (Today, This Week, This Month, Custom)
2. **Export buttons**: "Export CSV" + "Export PDF" in top-right
3. **Summary StatCards**: Total Revenue, Total Orders, Avg Order Value, Total Profit
4. **Sales Trend Chart**: Recharts `LineChart` showing daily sales over selected period
5. **Two-column**:
   - Category Breakdown: Recharts `PieChart` showing sales by product category
   - Payment Method Split: Recharts `PieChart` showing Cash vs UPI
6. **Top Products Table**: Product name, Qty sold, Revenue, sorted by revenue desc

**Step 2: Implement CSV export**

```typescript
function exportCSV(transactions: Transaction[]) {
  const headers = 'Date,Items,Subtotal,GST,Total,Payment Method\n';
  const rows = transactions.map(t =>
    `${new Date(t.created_at).toLocaleDateString()},${t.items.length} items,${t.subtotal},${t.gst_amount},${t.total},${t.payment_method}`
  ).join('\n');
  const blob = new Blob([headers + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
}
```

**Step 3: Implement PDF export using jsPDF**

Generate a simple PDF with stats summary and top products table.

**Step 4: Run build**

**Step 5: Commit**

```
git commit -m "feat: redesign reports page with Recharts charts and CSV/PDF export"
```

---

## Phase 8: Settings Page & Voice Hub Polish

### Task 8.1: Redesign Settings Page

**Files:**
- Modify: `app/(app)/settings/page.tsx`

**Step 1: Redesign with sections**

Sections:
1. **Shop Profile**: Name (EN/ML), Address, Phone — editable card
2. **Payment Settings**: UPI ID, GSTIN — editable card  
3. **Preferences**: Language preference, notification settings — future
4. **Danger Zone**: Logout button, Delete account (future)

Each section is a Card with inline editing (click Edit → fields become editable → Save/Cancel buttons appear).

**Step 2: Run build**

**Step 3: Commit**

```
git commit -m "feat: redesign settings page with sectioned cards"
```

---

### Task 8.2: Polish Voice Hub Page

**Files:**
- Modify: `app/(app)/voice-hub/page.tsx`

**Step 1: Update Voice Hub styling to match new theme**

- Update colors to use the new orange theme
- Clean up the conversation view styling
- Make the mic button larger and more prominent
- Style the cart/billing view to match the new card design
- Ensure the view modes (idle, billing, stock, payment) all match the new design system

**Step 2: Run build**

**Step 3: Commit**

```
git commit -m "feat: polish voice hub page to match new design system"
```

---

### Task 8.3: Wire FloatingMic to Voice System

**Files:**
- Modify: `components/shared/FloatingMic.tsx`

**Step 1: Connect FloatingMic to useVoice hook**

- Import and use `useVoice()` hook
- On button tap: toggle listening
- Show transcript in the floating panel
- Route results through `useSmartNLP` → show response text
- For billing intents: navigate to Voice Hub with the command
- For stock queries: show result inline in the floating panel
- Animate button with pulse when listening

**Step 2: Run build**

**Step 3: Commit**

```
git commit -m "feat: wire floating mic to voice recognition system"
```

---

## Phase 9: Final Polish & Build Verification

### Task 9.1: Responsive Testing & Fixes

**Step 1: Run build**

Run: `npx next build`
Expected: Build succeeds with all pages

**Step 2: Fix any build errors**

Address any TypeScript errors, missing imports, or styling issues.

**Step 3: Final commit**

```
git add -A
git commit -m "feat: complete full app redesign - professional UI with orange theme"
```

---

## Dependency Graph

```
Phase 1 (Theme) ─────────────┐
                              ├──→ Phase 2 (Navigation) ──→ Phase 3 (Auth/Onboarding)
Phase 1.4 (Recharts install) ─┘                             │
                                                              ├──→ Phase 4 (Dashboard)
                                                              ├──→ Phase 5 (Inventory)
                                                              ├──→ Phase 6 (Billing)
                                                              ├──→ Phase 7 (Reports) [needs Recharts]
                                                              ├──→ Phase 8 (Settings + Polish)
                                                              └──→ Phase 9 (Final verification)
```

Phases 4-8 can be done in any order after Phases 1-3 are complete. Phase 7 depends on Recharts (Task 1.4).
