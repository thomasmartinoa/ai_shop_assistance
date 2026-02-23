---
name: reports-analytics
description: Build and manage sales reports, analytics queries, charts, and data export for the Shopkeeper AI. Use when user asks about reports, analytics, sales data, charts, graphs, export, CSV, daily/weekly/monthly reports, profit, trends, or dashboard stats. Also use when user says "report", "analytics", "sales", "chart", "graph", "export", "profit", "trends".
tools: Read, Bash, Edit, Write, Grep, Glob
---

# Reports & Analytics

Build and manage sales reports, data visualization, and analytics for the Shopkeeper AI Assistant.

## Current Status: MOCK DATA ONLY

The reports page (`app/(app)/reports/page.tsx`) currently uses **hardcoded mock data**. This skill guides implementing real Supabase queries and charts.

## Architecture

```
transactions table (Supabase)
    ↓
Supabase Queries (aggregation)
    ↓
React State (hooks)
    ↓
Chart Components (recharts/chart.js)
    ↓
Export (CSV/PDF via jsPDF)
```

## Key Files

| File | Purpose | Status |
|------|---------|--------|
| `app/(app)/reports/page.tsx` | Reports page UI | Mock data only |
| `app/(app)/dashboard/page.tsx` | Dashboard stats | Mock data only |
| `supabase/migrations/001_initial_schema.sql` | transactions table schema | Done |
| `types/database.ts` | TypeScript types | Done |

## Database Queries Needed

### Daily Sales Summary
```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_orders,
  SUM(total) as total_revenue,
  SUM(gst_amount) as total_gst,
  AVG(total) as avg_order_value
FROM transactions
WHERE shop_id = $shop_id
  AND created_at >= $start_date
  AND created_at < $end_date
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Top Products
```sql
SELECT
  item->>'name' as product_name,
  SUM((item->>'qty')::numeric) as total_qty,
  SUM((item->>'price')::numeric * (item->>'qty')::numeric) as total_revenue
FROM transactions,
  jsonb_array_elements(items) as item
WHERE shop_id = $shop_id
  AND created_at >= $start_date
GROUP BY item->>'name'
ORDER BY total_revenue DESC
LIMIT 10;
```

### Payment Method Breakdown
```sql
SELECT
  payment_method,
  COUNT(*) as count,
  SUM(total) as total_amount
FROM transactions
WHERE shop_id = $shop_id
  AND created_at >= $start_date
GROUP BY payment_method;
```

### Hourly Sales Pattern
```sql
SELECT
  EXTRACT(HOUR FROM created_at) as hour,
  COUNT(*) as orders,
  SUM(total) as revenue
FROM transactions
WHERE shop_id = $shop_id
  AND created_at >= CURRENT_DATE
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour;
```

### Profit Calculation (requires cost_price on products)
```sql
SELECT
  DATE(t.created_at) as date,
  SUM(t.total) as revenue,
  SUM(
    (item->>'qty')::numeric * COALESCE(p.cost_price, 0)
  ) as total_cost,
  SUM(t.total) - SUM(
    (item->>'qty')::numeric * COALESCE(p.cost_price, 0)
  ) as profit
FROM transactions t,
  jsonb_array_elements(t.items) as item
  LEFT JOIN products p ON p.id = (item->>'product_id')::uuid
WHERE t.shop_id = $shop_id
GROUP BY DATE(t.created_at)
ORDER BY date DESC;
```

## Chart Library Setup

### Option A: Recharts (Recommended)
```bash
npm install recharts
```
- React-native, composable
- Good mobile support
- Lightweight

### Option B: Chart.js
```bash
npm install chart.js react-chartjs-2
```
- More chart types
- Canvas-based (faster for large datasets)

## Report Types to Implement

| Report | Time Range | Chart | Data |
|--------|-----------|-------|------|
| Today's Sales | Today | Bar (hourly) | Orders, revenue per hour |
| Weekly Overview | 7 days | Line | Daily revenue trend |
| Monthly Summary | 30 days | Mixed | Revenue + orders |
| Top Products | Custom | Horizontal bar | Qty sold, revenue |
| Payment Methods | Custom | Pie/Donut | Cash vs UPI vs Credit |
| Low Stock Alert | Current | Table | Products below min_stock |
| Profit Report | Custom | Area | Revenue vs cost |

## Export Functionality

### CSV Export
```typescript
function exportCSV(data: any[], filename: string) {
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).join(','));
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
}
```

### PDF Export (using jsPDF - already installed)
```typescript
import jsPDF from 'jspdf';

function exportPDF(title: string, data: any[]) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  // Add table data
  doc.save(`${title}.pdf`);
}
```

## Voice Commands for Reports

| Malayalam | Intent | Action |
|----------|--------|--------|
| ഇന്നത്തെ സെയിൽസ് | report.today | Show today's sales summary |
| ഈ ആഴ്ചയിലെ സെയിൽസ് | report.week | Show weekly report |
| ടോപ്പ് പ്രൊഡക്ട്സ് | report.top | Show best sellers |
| ഇന്ന് എത്ര വിറ്റു | report.today | Total revenue today |
