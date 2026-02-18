---
name: component-library
description: Manage shadcn/ui components and create missing UI components for the Shopkeeper AI. Use when user asks to add components, fix UI, create new components, install shadcn components, or manage the design system. Also use when user says "component", "UI", "shadcn", "design system", "button", "dialog", "modal", "toast", "table", "form".
tools: Read, Bash, Edit, Write, Grep, Glob
---

# Component Library

Manage the shadcn/ui component library and project-specific components for the Shopkeeper AI Assistant.

## Installed shadcn/ui Components

| Component | File | Status |
|-----------|------|--------|
| Button | `components/ui/button.tsx` | Installed |
| Card | `components/ui/card.tsx` | Installed |
| Input | `components/ui/input.tsx` | Installed |
| Label | `components/ui/label.tsx` | Installed |
| Dialog | `components/ui/dialog.tsx` | Referenced but may be missing |
| Select | Needs Radix (installed) | Not created |
| Tabs | Needs Radix (installed) | Not created |

## Missing Components (Referenced in CLAUDE.md)

| Component | File | Priority |
|-----------|------|----------|
| BillDisplay | `components/billing/BillDisplay.tsx` | HIGH |
| CartItem | `components/billing/CartItem.tsx` | HIGH |
| BillReceipt | `components/billing/BillReceipt.tsx` | MEDIUM |
| ProductCard | `components/inventory/ProductCard.tsx` | HIGH |
| ProductForm | `components/inventory/ProductForm.tsx` | HIGH |
| StockAlert | `components/inventory/StockAlert.tsx` | MEDIUM |
| Loading | `components/shared/Loading.tsx` | MEDIUM |
| VoiceStatus | `components/voice/VoiceStatus.tsx` | LOW |

## Adding New shadcn/ui Components

Since the project uses manual shadcn/ui setup (not CLI), add components by:

1. Check available components: https://ui.shadcn.com/docs/components
2. Copy the component source
3. Adapt to project's Tailwind config
4. Place in `components/ui/`

### Commonly Needed Components

```bash
# Toast notifications (needed for success/error feedback)
# Dialog/Modal (needed for confirmations)
# Select dropdown (needed for category/unit selection)
# Table (needed for reports, inventory list)
# Badge (needed for stock alerts, status indicators)
# Skeleton (needed for loading states)
# Alert (needed for low stock warnings)
# Separator (needed for bill receipt)
# ScrollArea (needed for long product lists)
```

## Design System

### Colors (from CLAUDE.md)
```css
--primary: #2563eb;     /* Blue - main actions */
--success: #16a34a;     /* Green - confirmations */
--warning: #ea580c;     /* Orange - alerts */
--danger: #dc2626;      /* Red - errors/delete */
--background: #f8fafc;  /* Light gray */
--foreground: #0f172a;  /* Dark text */
```

### Touch Targets
- Minimum 48px for all interactive elements
- Shopkeepers may have rough/calloused hands
- Prefer large buttons over small links

### Typography
- Primary text: 16px minimum
- Headers: 20-24px
- Malayalam text may need slightly larger size for readability
- Use system fonts for Malayalam: `'Noto Sans Malayalam', sans-serif`

## Component Templates

### BillDisplay Component
```typescript
interface BillDisplayProps {
  items: CartItem[];
  subtotal: number;
  gstAmount: number;
  total: number;
  onRemoveItem: (productId: string) => void;
  onClearAll: () => void;
}
```

### CartItem Component
```typescript
interface CartItemProps {
  name: string;
  nameMl: string;
  quantity: number;
  unit: string;
  price: number;
  gstRate: number;
  onRemove: () => void;
  onUpdateQty: (qty: number) => void;
}
```

### ProductCard Component
```typescript
interface ProductCardProps {
  product: Product;
  onEdit: () => void;
  onUpdateStock: (newStock: number) => void;
  showLowStockAlert: boolean;
}
```

### StockAlert Component
```typescript
interface StockAlertProps {
  products: Product[];  // Products below min_stock
  onRestock: (productId: string) => void;
}
```

## Accessibility Guidelines

- All buttons need `aria-label` (especially icon-only buttons)
- Voice button needs clear state indication (listening/idle)
- Color should not be the only indicator (add icons/text)
- Form fields need proper labels
- Focus management for modals/dialogs
