---
name: pwa-setup
description: Configure and manage the Progressive Web App features - manifest, service worker, icons, install prompt, offline support, and mobile optimization. Use when user asks about PWA, install prompt, offline mode, service worker, app icon, mobile app, or home screen. Also use when user says "PWA", "install", "offline", "service worker", "manifest", "mobile app", "home screen".
tools: Read, Bash, Edit, Write, Grep, Glob
---

# PWA Setup

Configure Progressive Web App features for the Shopkeeper AI Assistant to work as a mobile app on Kerala shopkeepers' devices.

## Current Status

| Feature | Status |
|---------|--------|
| manifest.json | Done (basic) |
| App icons | Placeholder SVG only |
| Service worker | Not implemented |
| Install prompt | Not implemented |
| Offline support | Not implemented (by design - online only) |
| Splash screen | Not configured |

## Key Files

| File | Purpose | Status |
|------|---------|--------|
| `public/manifest.json` | PWA manifest | Basic config done |
| `public/icon.svg` | App icon | Placeholder |
| `public/icons/` | Multiple icon sizes | Not generated |
| `app/layout.tsx` | Meta tags, manifest link | Partial |

## manifest.json Current Config

```json
{
  "name": "Shopkeeper AI Assistant",
  "short_name": "Shop AI",
  "display": "standalone",
  "orientation": "portrait-primary",
  "theme_color": "#3b82f6",
  "background_color": "#0a0a0a",
  "categories": ["business", "finance", "productivity"],
  "shortcuts": [
    { "name": "Start Billing", "url": "/billing" },
    { "name": "View Inventory", "url": "/inventory" }
  ]
}
```

## Steps to Complete

### 1. Generate App Icons

Need icons at these sizes for full PWA support:
- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512
- Plus maskable versions for Android adaptive icons

Use the `web-asset-generator` or create manually:
```bash
# Using sharp (npm install sharp)
node -e "
const sharp = require('sharp');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
sizes.forEach(size => {
  sharp('public/icon.svg')
    .resize(size, size)
    .png()
    .toFile('public/icons/icon-' + size + 'x' + size + '.png');
});
"
```

### 2. Update manifest.json Icons

```json
{
  "icons": [
    { "src": "/icons/icon-72x72.png", "sizes": "72x72", "type": "image/png" },
    { "src": "/icons/icon-96x96.png", "sizes": "96x96", "type": "image/png" },
    { "src": "/icons/icon-128x128.png", "sizes": "128x128", "type": "image/png" },
    { "src": "/icons/icon-144x144.png", "sizes": "144x144", "type": "image/png" },
    { "src": "/icons/icon-152x152.png", "sizes": "152x152", "type": "image/png" },
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-384x384.png", "sizes": "384x384", "type": "image/png" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

### 3. Add Meta Tags to layout.tsx

```html
<head>
  <meta name="application-name" content="Shop AI" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="Shop AI" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="theme-color" content="#3b82f6" />
  <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
  <link rel="manifest" href="/manifest.json" />
</head>
```

### 4. Install Prompt Component

```typescript
// components/shared/InstallPrompt.tsx
'use client';
import { useState, useEffect } from 'react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    });
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-primary text-white p-4 rounded-lg shadow-lg z-50">
      <p className="font-medium">Install Shop AI</p>
      <p className="text-sm opacity-90">Add to home screen for quick access</p>
      <div className="flex gap-2 mt-2">
        <button onClick={handleInstall} className="bg-white text-primary px-4 py-1 rounded">
          Install
        </button>
        <button onClick={() => setShowPrompt(false)} className="opacity-70">
          Later
        </button>
      </div>
    </div>
  );
}
```

### 5. Service Worker (Optional - Online Only)

Since the app is online-only by design, a minimal service worker for caching static assets:

```javascript
// public/sw.js
const CACHE_NAME = 'shopkeeper-ai-v1';
const STATIC_ASSETS = ['/', '/billing/', '/inventory/', '/reports/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  // Network-first for API calls, cache-first for static assets
  if (event.request.url.includes('/functions/') || event.request.url.includes('supabase')) {
    event.respondWith(fetch(event.request));
  } else {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
});
```

## Mobile Optimization for Kerala Shopkeepers

- Large touch targets (min 48px) for rough hands
- High contrast colors for sunlight visibility
- Minimal text - use icons + voice
- Portrait lock for one-handed use
- Fast load on 3G/4G networks
