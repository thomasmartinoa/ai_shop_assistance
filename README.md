# 🛒 Shopkeeper AI Assistant

A voice-first Progressive Web App (PWA) designed for Kerala shopkeepers to manage billing and inventory using Malayalam voice commands with an English UI.

## ✨ Features

- **Voice Billing**: Add items to bill by speaking in Malayalam
- **Inventory Management**: Track stock levels with low-stock alerts
- **UPI Payments**: Generate QR codes for GPay/PhonePe
- **Sales Reports**: Daily, weekly, and monthly analytics
- **GST Support**: Automatic GST calculation on products

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Supabase account (free tier)

### Installation

1. **Clone and install dependencies**
   ```bash
   cd ai_shop_assistance
   npm install
   ```

2. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Choose **Mumbai** region for best latency in India
   - Go to SQL Editor and run the contents of `supabase/migrations/001_initial_schema.sql`
   - Enable Phone Auth in Authentication settings

3. **Configure environment**
   ```bash
   cp .env.local.example .env.local
   ```
   Edit `.env.local` with your Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL` - from Project Settings > API
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - from Project Settings > API

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Voice Commands

### Malayalam Commands
| Say | Action |
|-----|--------|
| "അരി 2 കിലോ" | Add 2kg rice to bill |
| "സോപ്പ് ഒന്ന്" | Add 1 soap to bill |
| "ടോട്ടൽ എത്ര" | Get bill total |
| "QR കാണിക്കൂ" | Show payment QR |
| "ശരി" | Confirm |
| "വേണ്ട" | Cancel |

### English Commands (Fallback)
| Say | Action |
|-----|--------|
| "add rice 2 kg" | Add rice |
| "remove soap" | Remove item |
| "what's the total" | Get total |
| "show QR" | Show payment QR |

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Phone OTP)
- **Voice**: Web Speech API

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login)
│   └── (app)/             # Protected app pages
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── voice/            # Voice components
│   └── shared/           # Shared components
├── lib/                   # Core utilities
│   ├── supabase/         # Database client
│   ├── nlp/              # Voice intent parsing
│   └── billing/          # Cart & billing logic
├── hooks/                 # React hooks
├── contexts/              # React contexts
├── types/                 # TypeScript types
└── supabase/             # Database migrations
```

## 🌐 Deployment

### Cloudflare Pages (Recommended)

1. Connect your GitHub repository to Cloudflare Pages
2. Set build command: `npm run build`
3. Set output directory: `out`
4. Add environment variables in Cloudflare dashboard

### Keep-Alive Cron (Important!)

Supabase free tier pauses after 7 days of inactivity. Set up a cron job to ping your Supabase URL every 6 days:

```bash
# Using Cloudflare Workers or any cron service
curl https://YOUR_PROJECT.supabase.co/rest/v1/ \
  -H "apikey: YOUR_ANON_KEY"
```

## 🔧 Development

```bash
# Run dev server
npm run dev

# Type check
npm run type-check

# Lint
npm run lint

# Build for production
npm run build
```

## 🤝 Contributing

This is an open project. Feel free to:
- Report bugs
- Suggest features
- Submit PRs

## 📄 License

MIT

---

Made with ❤️ for Kerala Shopkeepers
