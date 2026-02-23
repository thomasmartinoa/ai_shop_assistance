# 🛒 Shopkeeper AI Assistant

A voice-first Progressive Web App (PWA) designed for Kerala shopkeepers to manage billing and inventory using Malayalam voice commands with an English UI.

## ✨ Features

- **🎤 Voice Billing** — Add items to bill by speaking in Malayalam, powered by Dialogflow ES + local NLP fallback
- **📦 Inventory Management** — Track stock levels with low-stock alerts, add products with voice
- **💳 UPI Payments** — Generate QR codes for GPay/PhonePe, cash payment flow
- **📊 Sales Reports** — Real-time daily, weekly, and monthly analytics from Supabase
- **🧾 GST Support** — Automatic GST calculation on products
- **🔊 Malayalam TTS** — Sarvam AI voice output with Google TTS + browser fallback chain
- **📱 PWA** — Installable on mobile, works like a native app

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions) |
| Voice Input | Web Speech API (`ml-IN` locale) |
| Voice Output | Sarvam AI TTS → Google TTS → Browser SpeechSynthesis |
| NLP | Dialogflow ES (via Edge Function) + local pattern matching |
| Payments | Client-side UPI QR code generation |
| Hosting | Static export, deployable to Cloudflare Pages / Vercel / Netlify |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project (free tier works)

### Setup

```bash
# Clone the repo
git clone https://github.com/your-username/ai_shop_assistance.git
cd ai_shop_assistance

# Install dependencies
npm install

# Copy environment template and fill in your values
cp .env.local.example .env.local

# Run development server
npm run dev
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: for TTS and NLP (also needed as Edge Function secrets)
SARVAM_API_KEY=your-sarvam-key
DIALOGFLOW_PROJECT_ID=your-project-id
DIALOGFLOW_CLIENT_EMAIL=your-service-account@iam.gserviceaccount.com
DIALOGFLOW_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Demo Mode

The app works without any Supabase configuration in **demo mode**:
- Use the **"Try Demo Mode"** button on the login page
- Or enter test phone number `9443129400` with OTP `121212` (dev only)
- Demo mode uses in-memory data — no persistence

## 📱 Pages

| Page | Description |
|------|-------------|
| `/login` | Phone OTP login with demo mode fallback |
| `/dashboard` | Today's sales stats, quick actions |
| `/billing` | Voice-activated billing with cart, UPI QR |
| `/inventory` | Product management with add/edit/voice |
| `/reports` | Sales analytics (today/week/month) |
| `/settings` | Shop info, UPI ID, GSTIN configuration |

## 🏛️ Architecture

```
Next.js (Static Export) → Cloudflare Pages / any static host
         ↓
Supabase (Mumbai Region)
  ├── PostgreSQL (shops, products, transactions with RLS)
  ├── Auth (Phone OTP)
  └── Edge Functions
        ├── sarvam-tts (Malayalam TTS)
        ├── google-tts (fallback TTS)
        └── dialogflow-detect (NLP intent detection)
         ↓
External APIs: Sarvam AI, Google Translate, Dialogflow ES
```

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| [CLAUDE.md](./CLAUDE.md) | Full project context, architecture, conventions |
| [IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md) | Production implementation phases |
| [EDGE_FUNCTIONS.md](./docs/EDGE_FUNCTIONS.md) | Edge Functions technical spec |
| [DIALOGFLOW_SETUP.md](./docs/DIALOGFLOW_SETUP.md) | Dialogflow ES setup guide |
| [SARVAM_VOICE_INTEGRATION.md](./docs/SARVAM_VOICE_INTEGRATION.md) | Sarvam AI TTS integration |

## 📝 License

MIT
