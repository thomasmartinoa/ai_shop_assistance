# CLAUDE.md - Shopkeeper AI Assistant

> **Purpose**: This file serves as the primary context document for AI assistants working on this project. It contains all architectural decisions, implementation details, and project guidelines.

## 📋 Project Overview

**Name**: Shopkeeper AI Assistant  
**Type**: Progressive Web App (PWA)  
**Target Users**: Kerala shopkeepers (small retail stores)  
**Primary Language**: Malayalam voice commands, English UI  
**Cost Target**: $0/month (100% free tier services)

### Core Value Proposition
A voice-first assistant that enables Kerala shopkeepers to:
- Bill customers hands-free using Malayalam voice commands
- Check stock levels by speaking product names
- Generate UPI/GPay QR codes for instant payment
- View sales reports and analytics
- Manage inventory with voice assistance

---

## 🏗️ Architecture

### Deployment Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE PAGES                              │
│                 (Static Next.js Export)                          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Next.js    │  │   Tailwind   │  │  shadcn/ui   │          │
│  │  App Router  │  │     CSS      │  │  Components  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Web Speech   │  │  Pattern     │  │   QR Code    │          │
│  │    API       │  │  NLP         │  │   (qrcode)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE (Mumbai Region)                      │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  PostgreSQL  │  │    Auth      │  │   Storage    │          │
│  │   (500MB)    │  │ (Phone OTP)  │  │    (1GB)     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────────────────────────────────────────┐           │
│  │              Edge Functions (Deno)                │           │
│  │  ┌────────────┐ ┌────────────┐ ┌──────────────┐  │          │
│  │  │ sarvam-tts │ │ google-tts │ │  dialogflow  │  │          │
│  │  │ (Malayalam │ │ (fallback) │ │   -detect    │  │          │
│  │  │   voice)  │ │            │ │  (NLP)       │  │          │
│  │  └────────────┘ └────────────┘ └──────────────┘  │          │
│  └──────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        Sarvam AI      Google Translate  Dialogflow ES
        (TTS API)      (TTS fallback)   (NLP Intent)
```

> **Note**: No API routes in Next.js. All server-side logic runs in Supabase Edge Functions.
> See `docs/EDGE_FUNCTIONS.md` for technical spec.

### Why These Choices?

| Decision | Choice | Reason |
|----------|--------|--------|
| Hosting | Cloudflare Pages | Vercel Hobby prohibits commercial use; Cloudflare has India POPs (Mumbai, Chennai, Delhi, Kolkata) |
| Database | Supabase | 500MB free, Mumbai region (~30-50ms to Kerala), built-in auth |
| Voice Input | Web Speech API | Browser-native, free, supports Malayalam (`ml-IN`) |
| Voice Output | Web Speech Synthesis | Browser-native, free |
| Wake Word | Button (MVP) | Porcupine free tier = 1 MAU only, unusable |
| NLP | Pattern-based | Fixed vocabulary, no external API costs |
| QR Codes | qrcode.js | Client-side generation, no API needed |

### Critical Issues Resolved

1. **Porcupine Wake Word**: Free tier only allows 1 MAU (not 3 wake words as documented). Using button activation for MVP.
2. **Vercel Commercial Use**: Hobby tier prohibits commercial use. Switched to Cloudflare Pages.
3. **Supabase Pausing**: Free projects pause after 1 week inactivity. Need Cloudflare Workers cron to ping every 6 days.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Context + useReducer
- **Forms**: React Hook Form + Zod validation

### Backend (Supabase)
- **Database**: PostgreSQL
- **Auth**: Supabase Auth (Phone OTP)
- **Storage**: Supabase Storage (product images)
- **Realtime**: Supabase Realtime (multi-device sync)

### Voice & AI
- **Speech Recognition**: Web Speech API (`ml-IN` locale)
- **Speech Synthesis**: Web Speech Synthesis API
- **TTS API**: Sarvam AI (via Edge Function) + Google TTS fallback
- **NLP**: Dialogflow ES (via Edge Function) + local pattern matching fallback

### Utilities
- **QR Generation**: qrcode (npm package)
- **PDF Generation**: jsPDF
- **Date Handling**: date-fns

---

## 📁 Project Structure

```
ai_shop_assistance/
├── CLAUDE.md                    # This file - AI context
├── shopkeeper_ai_prompt.md      # Original requirements
├── README.md                    # User documentation
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── .env.local.example           # Environment variables template
├── .gitignore
│
├── app/                         # Next.js App Router
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing/redirect
│   ├── globals.css             # Global styles
│   │
│   ├── (auth)/                 # Auth group (no layout)
│   │   ├── login/
│   │   │   └── page.tsx        # Phone OTP login
│   │   └── onboarding/
│   │       └── page.tsx        # Shop setup wizard
│   │
│   └── (app)/                  # Main app (with sidebar)
│       ├── layout.tsx          # App layout with nav
│       ├── dashboard/
│       │   └── page.tsx        # Main dashboard
│       ├── billing/
│       │   └── page.tsx        # Voice billing interface
│       ├── inventory/
│       │   └── page.tsx        # Product management
│       ├── reports/
│       │   └── page.tsx        # Sales analytics
│       └── settings/
│           └── page.tsx        # Shop settings
│
├── components/
│   ├── ui/                     # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   │
│   ├── voice/
│   │   ├── VoiceButton.tsx     # Push-to-talk button
│   │   ├── VoiceVisualizer.tsx # Audio waveform
│   │   └── VoiceStatus.tsx     # Listening/processing state
│   │
│   ├── billing/
│   │   ├── BillDisplay.tsx     # Current bill items
│   │   ├── CartItem.tsx        # Individual item row
│   │   ├── PaymentQR.tsx       # UPI QR code
│   │   └── BillReceipt.tsx     # Printable receipt
│   │
│   ├── inventory/
│   │   ├── ProductCard.tsx     # Product grid item
│   │   ├── ProductForm.tsx     # Add/edit product
│   │   └── StockAlert.tsx      # Low stock warning
│   │
│   └── shared/
│       ├── Sidebar.tsx         # Navigation sidebar
│       ├── Header.tsx          # Top header
│       ├── Toast.tsx           # Toast notification system
│       ├── ErrorBoundary.tsx   # Error boundary with retry
│       └── Loading.tsx         # Loading states
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser client
│   │   ├── edge-functions.ts   # Edge Function call utility
│   │   └── types.ts            # Database types
│   │
│   ├── voice/
│   │   ├── recognition.ts      # Speech recognition wrapper
│   │   ├── synthesis.ts        # Text-to-speech wrapper
│   │   └── malayalam.ts        # Malayalam-specific utils
│   │
│   ├── nlp/
│   │   ├── dialogflow.ts       # Dialogflow via Edge Function
│   │   ├── intent.ts           # Intent classification
│   │   ├── entities.ts         # Entity extraction
│   │   ├── patterns.ts         # Regex patterns
│   │   └── responses.ts        # Malayalam responses
│   │
│   ├── billing/
│   │   ├── cart.ts             # Cart state management
│   │   ├── gst.ts              # GST calculations
│   │   └── qr.ts               # UPI QR generation
│   │
│   └── utils/
│       ├── format.ts           # Formatting helpers
│       └── constants.ts        # App constants
│
├── hooks/
│   ├── useVoice.ts             # Voice recognition + TTS hook
│   ├── useProducts.ts          # Products CRUD hook
│   ├── useTransactions.ts      # Real sales data from Supabase
│   ├── useBilling.ts           # Billing state hook
│   └── useAuth.ts              # Auth state hook
│
├── contexts/
│   ├── AuthContext.tsx         # Auth provider
│   ├── ShopContext.tsx         # Shop data provider
│   └── VoiceContext.tsx        # Voice state provider
│
├── types/
│   ├── database.ts             # Supabase generated types
│   ├── voice.ts                # Voice-related types
│   └── billing.ts              # Billing types
│
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql  # Database schema
```

---

## 💾 Database Schema

### Tables

```sql
-- Shop information
CREATE TABLE shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    name_ml TEXT,                    -- Malayalam name
    address TEXT,
    phone TEXT,
    upi_id TEXT,                     -- merchant@upi
    gstin TEXT,                      -- GST number (optional)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products inventory
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    name_en TEXT NOT NULL,           -- English name
    name_ml TEXT NOT NULL,           -- Malayalam name (for voice)
    aliases TEXT[],                  -- Alternative names/pronunciations
    price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2),        -- For profit calculation
    stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 5,     -- Low stock alert threshold
    unit TEXT DEFAULT 'piece',       -- piece, kg, liter, etc.
    gst_rate DECIMAL(4,2) DEFAULT 0, -- GST percentage
    category TEXT,
    shelf_location TEXT,             -- "Aisle 2, Shelf 3"
    barcode TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    items JSONB NOT NULL,            -- [{product_id, name, qty, price, gst}]
    subtotal DECIMAL(10,2) NOT NULL,
    gst_amount DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    payment_method TEXT DEFAULT 'cash', -- cash, upi, credit
    payment_status TEXT DEFAULT 'completed',
    customer_phone TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_products_shop ON products(shop_id);
CREATE INDEX idx_products_name_ml ON products(name_ml);
CREATE INDEX idx_transactions_shop ON transactions(shop_id);
CREATE INDEX idx_transactions_date ON transactions(created_at);

-- Row Level Security
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own shop data
CREATE POLICY "Users can view own shop" ON shops
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can update own shop" ON shops
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own shop" ON shops
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Products: Access based on shop ownership
CREATE POLICY "Users can manage own products" ON products
    FOR ALL USING (
        shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    );

-- Transactions: Access based on shop ownership
CREATE POLICY "Users can manage own transactions" ON transactions
    FOR ALL USING (
        shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    );
```

---

## 🎤 Voice Commands Reference

### Intent Categories

| Intent | Malayalam Examples | English Fallback |
|--------|-------------------|------------------|
| BILLING_ADD | "അരി 2 കിലോ", "ഒരു സോപ്പ്" | "add rice 2kg" |
| BILLING_REMOVE | "അരി മാറ്റൂ", "ഒരെണ്ണം കുറയ്ക്കൂ" | "remove rice" |
| STOCK_CHECK | "അരി സ്റ്റോക്ക് എത്ര", "സോപ്പ് ഉണ്ടോ" | "check rice stock" |
| LOCATION_FIND | "അരി എവിടെ", "സോപ്പ് ഏത് ഷെൽഫിൽ" | "where is rice" |
| BILL_TOTAL | "ടോട്ടൽ എത്ര", "ബിൽ" | "what's the total" |
| PAYMENT_UPI | "QR കാണിക്കൂ", "GPay" | "show QR" |
| CONFIRM | "ശരി", "ഉവ്വ്", "ഓക്കേ" | "yes", "ok" |
| CANCEL | "വേണ്ട", "ക്യാൻസൽ" | "no", "cancel" |

### NLP Pattern Structure

```typescript
interface IntentPattern {
  intent: string;
  patterns: RegExp[];
  entities: string[]; // What entities to extract
  response: string;   // Malayalam response template
}
```

---

## 🔐 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx

# Sarvam AI TTS (also set as Edge Function secret)
SARVAM_API_KEY=your-sarvam-key

# Dialogflow ES (also set as Edge Function secrets)
DIALOGFLOW_PROJECT_ID=your-project-id
DIALOGFLOW_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
DIALOGFLOW_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

> **Edge Function Secrets**: The above API keys also need to be added to Supabase dashboard:
> Project Settings → Edge Functions → Secrets

---

## 📱 UI/UX Guidelines

### Design Principles
1. **Large touch targets**: Minimum 48px for buttons (shopkeepers may have rough hands)
2. **High contrast**: Easy visibility in varying light conditions
3. **Minimal text**: Icons + voice over reading
4. **Clear feedback**: Visual + audio confirmation for all actions


### Voice Feedback Patterns
- **Listening**: "ഞാൻ കേൾക്കുന്നു" (I'm listening)
- **Processing**: "കാത്തിരിക്കൂ" (Please wait)
- **Confirmation**: "ശരി, [action] ചെയ്തു" (Done, [action] completed)
- **Error**: "ക്ഷമിക്കണം, മനസ്സിലായില്ല" (Sorry, didn't understand)

---

## 🚀 Development Phases

### Phase 1: Foundation ✅ COMPLETE
- [x] Project documentation (CLAUDE.md)
- [x] Next.js project setup
- [x] Tailwind + shadcn/ui
- [x] Supabase client configuration (demo mode fallback)
- [x] Database schema (migration file created)
- [x] Phone OTP authentication (demo mode works)
- [x] Base UI layout (sidebar + header)

### Phase 2: Voice Integration ✅ COMPLETE
- [x] Web Speech API wrapper (continuous listening)
- [x] Malayalam recognition setup (`ml-IN` locale)
- [x] Text-to-speech (Sarvam AI + Google + Browser fallback chain)
- [x] Voice button component (tap-to-toggle)
- [x] Audio visualizer

### Phase 3: Core Features ✅ COMPLETE
- [x] Inventory management page (display + voice)
- [x] Voice-activated billing with conversational flow
- [x] Cart state management
- [x] GST calculations
- [x] Smart NLP (Dialogflow + local pattern matching)
- [x] Inventory form inputs wired to state
- [x] Transaction persistence to Supabase
- [x] Stock decrement after sale
- [x] Settings page writes to Supabase

### Phase 4: Payments & Reports ✅ COMPLETE
- [x] UPI QR code generation (real, client-side)
- [x] Payment confirmation flow (voice-driven)
- [x] Reports page with real Supabase transaction data
- [x] Dashboard with real sales data

### Phase 5: Production Ready ✅ COMPLETE
- [x] Supabase project setup (Mumbai region, project `ctrjetjhwvgqoqpbytyb`)
- [x] Migrated API routes → 3 Supabase Edge Functions (`sarvam-tts`, `google-tts`, `dialogflow-detect`)
- [x] Fixed all broken UI components
- [x] Toast notification system (replaces `alert()`)
- [x] ErrorBoundary component
- [x] New user onboarding (shop INSERT on first save)
- [x] Dev test phone OTP (no Twilio needed)
- [x] Build verification: `next build` exit code 0


---

## 📝 Code Conventions

### File Naming
- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Types: `camelCase.ts`
- Hooks: `useCamelCase.ts`

### Component Structure
```typescript
// Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// Types
interface Props {
  title: string;
  onAction: () => void;
}

// Component
export function MyComponent({ title, onAction }: Props) {
  // Hooks
  const [state, setState] = useState(false);
  
  // Handlers
  const handleClick = () => {
    // logic
  };
  
  // Render
  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={handleClick}>Action</Button>
    </div>
  );
}
```

### Supabase Queries
```typescript
// Always use typed client
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

const supabase = createClient();

// Query with type safety
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('shop_id', shopId);
```

---

## 🐛 Known Issues & Workarounds

| Issue | Status | Workaround |
|-------|--------|------------|
| Supabase pauses after 7 days | Needs cron | Set up Cloudflare Workers to ping every 6 days |
| Web Speech API needs HTTPS | Expected | Cloudflare Pages provides HTTPS automatically |
| Malayalam accuracy varies | Expected | Confirmation flow + fuzzy matching implemented |
| No offline support | By design | User requested online-only for simplicity |
| PWA icons are placeholder | **Missing** | Only `icon.svg` exists, need PNG icons |
| Edge Function secrets not set | **Manual** | Add SARVAM_API_KEY + Dialogflow creds in Supabase dashboard |

---

## 📚 References

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [UPI QR Specs](https://www.npci.org.in/what-we-do/upi/upi-qr-code)

---

## 📄 Planning Documents

| Document | Purpose |
|----------|---------|
| `docs/plans/2026-02-19-production-ready-design.md` | Design doc: gap analysis, architecture decisions, component-level changes |
| `docs/IMPLEMENTATION_PLAN.md` | Step-by-step execution plan with phases and acceptance criteria |
| `docs/EDGE_FUNCTIONS.md` | Technical spec for Supabase Edge Functions migration |
| `docs/DIALOGFLOW_SETUP.md` | Dialogflow ES setup guide (existing) |
| `docs/SARVAM_VOICE_INTEGRATION.md` | Sarvam AI TTS integration guide (existing) |

---

## 📅 Changelog

### 2026-02-20 (Session 5) - Production Implementation
- Created Supabase project `shopkeeper-ai` (`ctrjetjhwvgqoqpbytyb`) in Mumbai region
- Applied database schema migration with RLS policies
- Deployed 3 Supabase Edge Functions: `sarvam-tts`, `google-tts`, `dialogflow-detect`
- Removed old `/app/api/*` routes (incompatible with static export)
- Created `lib/supabase/edge-functions.ts` utility for Edge Function calls
- Fixed inventory form: 6 inputs wired to state + save connected
- Fixed settings page: real Supabase writes (INSERT for new users, UPDATE for existing)
- Created `Toast.tsx` notification system (replaced all `alert()` calls)
- Created `ErrorBoundary.tsx` with retry UI
- Added `completeTransaction()` to billing: saves to DB + decrements stock
- Created `hooks/useTransactions.ts` for real sales queries
- Reports page: real data with loading/empty states
- Dashboard page: real data via `useTransactions` (removed mock stats)
- Dev-only test phone OTP bypass (no Twilio needed in development)
- New user onboarding: welcome banner + shop creation flow
- Build verification: `next build` exit code 0

### 2026-02-19 (Session 4) - Production Planning
- Comprehensive codebase analysis and gap assessment
- Created production-ready design document
- Created implementation plan (5 phases)
- Created Edge Functions technical spec
- Identified 6 critical bugs and 3 missing features

### 2025-12-05 (Session 3) - Smart NLP & Dialogflow Integration
- Dialogflow ES integration with Edge Function
- Smart NLP hook combining Dialogflow with local fallback
- Voice commands for stock management

### 2025-11-30 (Session 2) - QR & Product Integration
- UPI QR code generation
- useProducts hook with fuzzy Malayalam matching
- Voice recognition fixes (continuous listening)

### 2024-11-30 (Session 1) - Foundation
- Next.js 14 + TypeScript + Tailwind + shadcn/ui setup
- Supabase client with demo mode fallback
- Phone OTP auth, sidebar navigation
- Voice billing, inventory, reports, settings pages

---

*Last Updated: February 20, 2026*

