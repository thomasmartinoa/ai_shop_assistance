---
description: How to redesign the UI/UX of the Shopkeeper AI app without breaking functionality
---

# UI/UX Redesign Workflow

## Prerequisites
- Read `docs/UI_REDESIGN_PROMPT.md` for full design specifications
- Read `CLAUDE.md` for architecture context

## Step 1: Design Foundation
1. Update `app/globals.css` — Replace shadcn default tokens with the new color palette (both light + dark)
2. Update `tailwind.config.ts` — Add new shadows, keyframes, animations, font config
3. Update `app/layout.tsx` — Change the Google Font import if switching fonts

// turbo
4. Run `npm run dev` to verify no CSS errors

## Step 2: App Shell
1. Redesign `components/shared/Sidebar.tsx` — New background, nav styling, mobile bottom nav
2. Redesign `components/shared/Header.tsx` — Spacious, dynamic title, better avatar
3. Update `app/(app)/layout.tsx` — Add bottom nav component for mobile, page transitions

// turbo
4. Run `npm run dev` and verify navigation works

## Step 3: Signature Components
1. Redesign `components/voice/VoiceButton.tsx` — Multi-ring animations, gradient background, glow effects
2. Redesign `components/voice/VoiceVisualizer.tsx` — More bars, smoother animation, better transcript display
3. Update `components/shared/Toast.tsx` — Slide-in animation, colored borders

// turbo
4. Run `npm run dev` and test voice button states

## Step 4: Login Page
1. Redesign `app/(auth)/login/page.tsx` — Full-screen branded experience, hero illustration, premium input styling

// turbo
2. Run `npm run dev` and verify login flow (demo mode + test OTP 121212)

## Step 5: Main Pages
1. Redesign `app/(app)/dashboard/page.tsx` — Gradient stat cards, animated CTA, greeting
2. Redesign `app/(app)/billing/page.tsx` — Hero voice button, receipt-style cart, slide-up QR sheet
3. Redesign `app/(app)/inventory/page.tsx` — Hover effects, better modals, product image placeholders
4. Redesign `app/(app)/reports/page.tsx` — Large stats, trend indicators, progress bars
5. Redesign `app/(app)/settings/page.tsx` — Spacious form, section dividers

// turbo
6. Run `npm run dev` and verify all pages

## Step 6: Build Verification
// turbo
1. Run `npx next build` — Must exit code 0
2. Test on 375px viewport width (mobile)
3. Test dark mode (add `class="dark"` to `<html>`)

## Critical Rules
- DO NOT modify any `useState`, `useCallback`, `useEffect`, or business logic
- DO NOT change Supabase queries, auth flow, or voice/NLP pipeline
- DO NOT move files or change route structure
- ONLY change: CSS, Tailwind classes, JSX structure, fonts, animations, visual elements
