# Technology Stack

**Analysis Date:** 2026-03-24

## Languages

**Primary:**
- TypeScript ^5.6.0 - All application code (components, hooks, lib, types)
- SQL (PostgreSQL) - Database schema and migrations in `supabase/migrations/`

**Secondary:**
- CSS - Global styles in `app/globals.css` via Tailwind
- JavaScript (ESM) - Build scripts in `scripts/deploy-cx-playbook.mjs`

## Runtime

**Environment:**
- Node.js v24.11.1 (detected on host)
- No `.nvmrc` or `.node-version` file present

**Package Manager:**
- npm 11.6.2
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js ^14.2.0 - App Router with static export (`output: 'export'` in `next.config.js`)
- React ^18.3.0 - UI framework
- React DOM ^18.3.0 - DOM rendering

**Styling:**
- Tailwind CSS ^3.4.0 - Utility-first CSS framework, configured in `tailwind.config.ts`
- PostCSS ^8.4.0 + Autoprefixer ^10.4.0 - CSS processing pipeline (`postcss.config.js`)

**UI Component Library:**
- shadcn/ui - Built on Radix UI primitives, components live in `components/ui/`
- Radix UI primitives installed:
  - `@radix-ui/react-avatar` ^1.1.11
  - `@radix-ui/react-dialog` ^1.1.15
  - `@radix-ui/react-dropdown-menu` ^2.1.16
  - `@radix-ui/react-label` ^2.1.0
  - `@radix-ui/react-progress` ^1.1.8
  - `@radix-ui/react-select` ^2.2.6
  - `@radix-ui/react-separator` ^1.1.8
  - `@radix-ui/react-slot` ^1.2.4
  - `@radix-ui/react-tabs` ^1.1.13
  - `@radix-ui/react-tooltip` ^1.2.8

**Testing:**
- No test framework installed (no jest, vitest, or testing-library in dependencies)

**Linting:**
- ESLint ^8.57.0 with `eslint-config-next` ^14.2.0
- No `.eslintrc` config file found; uses Next.js default ESLint config
- No Prettier configuration detected

**Build/Dev:**
- Next.js CLI (`next dev`, `next build`, `next start`)
- TypeScript compiler for type checking (`tsc --noEmit` via `npm run type-check`)

## Key Dependencies

**Critical (Application Logic):**
- `@supabase/supabase-js` ^2.45.0 - Database client, auth, real-time subscriptions
- `@supabase/ssr` ^0.5.0 - Supabase SSR helpers (imported but app uses client-side only)
- `qrcode` ^1.5.4 - Client-side UPI QR code generation (used in `app/(app)/voice-hub/page.tsx`)
- `recharts` ^3.7.0 - Charts for sales reports and dashboard analytics
- `zod` ^3.23.8 - Schema validation (available for forms)

**Forms:**
- `react-hook-form` ^7.53.0 - Form state management
- `@hookform/resolvers` ^3.9.0 - Zod resolver for react-hook-form

**Utilities:**
- `date-fns` ^3.6.0 - Date manipulation (declared in package.json, actual date formatting uses `Intl.DateTimeFormat` in `lib/utils.ts`)
- `jspdf` ^2.5.2 - PDF generation for receipts
- `clsx` ^2.1.1 - Conditional classname composition
- `tailwind-merge` ^2.5.0 - Intelligent Tailwind class merging (used via `cn()` helper in `lib/utils.ts`)
- `class-variance-authority` ^0.7.0 - Variant-based component styling (shadcn/ui pattern)
- `lucide-react` ^0.447.0 - Icon library

**Infrastructure (devDependencies):**
- `@types/node` ^22.0.0 - Node.js type definitions
- `@types/react` ^18.3.0 - React type definitions
- `@types/react-dom` ^18.3.0 - React DOM type definitions
- `@types/qrcode` ^1.5.6 - QR code library type definitions
- `google-auth-library` ^10.5.0 - Google OAuth for Dialogflow CX deployment script
- `baseline-browser-mapping` ^2.10.0 - Browser compatibility mapping

## Configuration

**TypeScript (`tsconfig.json`):**
- Target: ES2017
- Module resolution: `bundler`
- Strict mode enabled
- Path alias: `@/*` maps to project root
- JSX: `preserve` (handled by Next.js)
- Incremental compilation enabled

**Next.js (`next.config.js`):**
- Static export mode: `output: 'export'` (no server-side rendering, no API routes)
- Trailing slashes enabled
- Images unoptimized (required for static export)
- No API routes possible in this configuration

**Tailwind CSS (`tailwind.config.ts`):**
- Dark mode: class-based (`darkMode: ['class']`)
- Content paths: `pages/`, `components/`, `app/`
- Custom theme: HSL-based CSS variable color system (shadcn/ui pattern)
- Custom semantic colors: `sidebar`, `stat`, `page`, `surface`
- Custom animations: `pulse-ring`, `voice-wave`, `fade-in`, `pop-in`, `float-up`, `overlay-in`
- Font family: Inter (loaded from Google Fonts CDN in `app/layout.tsx`)

**PostCSS (`postcss.config.js`):**
- Plugins: tailwindcss, autoprefixer

**Environment Variables (`.env.local.example`):**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_APP_URL` - Application base URL
- `NEXT_PUBLIC_APP_NAME` - Display name
- `NEXT_PUBLIC_ENABLE_VOICE` / `NEXT_PUBLIC_ENABLE_GST` / `NEXT_PUBLIC_ENABLE_REPORTS` - Feature flags
- `NEXT_PUBLIC_VOICE_LANG` - Speech recognition language (default: `ml-IN`)
- `DIALOGFLOW_PROJECT_ID` / `DIALOGFLOW_CLIENT_EMAIL` / `DIALOGFLOW_PRIVATE_KEY` - Dialogflow CX credentials (used by edge functions and deploy script)

**PWA (`public/manifest.json`):**
- Progressive Web App manifest configured
- Display: standalone, portrait-primary orientation
- App shortcuts for Billing and Inventory
- Icons referenced in `public/icons/` (72x72 through 512x512 PNG sizes)

## Build & Scripts

**Available npm scripts:**
```bash
npm run dev          # Start Next.js dev server
npm run build        # Static export build (output: 'export')
npm run start        # Serve built app (limited use with static export)
npm run lint         # ESLint check
npm run type-check   # TypeScript type checking (tsc --noEmit)
```

**Deployment script:**
- `scripts/deploy-cx-playbook.mjs` - Deploys Dialogflow CX Playbook configuration via Google Cloud API

## Platform Requirements

**Development:**
- Node.js v24+ (or compatible LTS version)
- npm 11+
- HTTPS required for Web Speech API (use `next dev` with local proxy or deployed preview)

**Production:**
- Cloudflare Pages (static hosting)
- Supabase project (Mumbai region `asia-south1`, project ID `ctrjetjhwvgqoqpbytyb`)
- No server runtime needed (fully static export + Supabase Edge Functions)
- HTTPS provided by Cloudflare Pages automatically

**Browser Requirements:**
- Web Speech API support (`SpeechRecognition` / `webkitSpeechRecognition`)
- Web Speech Synthesis API support
- Modern evergreen browser (Chrome/Edge recommended for best Malayalam STT)

---

*Stack analysis: 2026-03-24*
