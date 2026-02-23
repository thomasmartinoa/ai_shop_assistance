---
name: supabase-schema
description: Manage Supabase database schema, migrations, RLS policies, and type generation for the Shopkeeper AI project. Use when user asks about database, schema, tables, migrations, RLS, row level security, types, or Supabase configuration. Also use when user says "database", "schema", "migration", "RLS", "types".
tools: Read, Bash, Edit, Write, Grep, Glob
---

# Supabase Schema Management

Manage the PostgreSQL database schema, migrations, RLS policies, and TypeScript types for the Shopkeeper AI Assistant.

## Context

- **Supabase Project**: Configured in `.env.local`
- **Migration Files**: `supabase/migrations/`
- **Database Types**: `types/database.ts`
- **Supabase Client**: `lib/supabase/client.ts`
- **MCP**: Supabase MCP configured in `.mcp.json`

## Database Schema

### Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `shops` | Shop information | owner_id, name, name_ml, upi_id, gstin |
| `products` | Inventory items | shop_id, name_en, name_ml, aliases[], price, stock, unit, gst_rate |
| `transactions` | Sales records | shop_id, items (JSONB), subtotal, total, payment_method |

### RLS Policies

All tables have Row Level Security enabled:
- **shops**: Users can only view/edit their own shop (`auth.uid() = owner_id`)
- **products**: Access based on shop ownership (`shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())`)
- **transactions**: Access based on shop ownership (same pattern)

## Workflow

### 1. Check Current Schema

Use the Supabase MCP tools to inspect the database:
- `mcp__supabase__list_tables` - List all tables
- `mcp__supabase__execute_sql` - Run read queries
- `mcp__supabase__list_migrations` - List applied migrations

### 2. Create a New Migration

When modifying the schema, always use migrations:

```sql
-- Example: Add a new column
ALTER TABLE products ADD COLUMN brand TEXT;

-- Example: Add a new index
CREATE INDEX idx_products_brand ON products(brand);

-- Example: Add a new RLS policy
CREATE POLICY "policy_name" ON table_name
    FOR SELECT USING (condition);
```

Use `mcp__supabase__apply_migration` with a descriptive snake_case name.

### 3. Generate TypeScript Types

After schema changes, regenerate types:
- Use `mcp__supabase__generate_typescript_types`
- Update `types/database.ts` with the generated types

### 4. Security Audit

After any DDL changes, run advisors:
- `mcp__supabase__get_advisors` with type `security` - Check for missing RLS
- `mcp__supabase__get_advisors` with type `performance` - Check for missing indexes

## Schema Rules

1. **Always enable RLS** on new tables
2. **Always create policies** that restrict access to shop owner
3. **Always add indexes** on foreign keys and frequently queried columns
4. **Use JSONB** for flexible data (like transaction items)
5. **Include `created_at` and `updated_at`** timestamps on all tables
6. **Add `updated_at` trigger** for automatic timestamp updates
7. **Malayalam names** (`name_ml`) should always accompany English names
8. **Aliases array** for products to support voice matching

## Common Migrations

### Add a new product field
```sql
ALTER TABLE products ADD COLUMN new_field TYPE;
```

### Add a new table with RLS
```sql
CREATE TABLE new_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    -- columns here
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own data" ON new_table
    FOR ALL USING (
        shop_id IN (SELECT id FROM shops WHERE owner_id = auth.uid())
    );

CREATE TRIGGER update_new_table_updated_at
    BEFORE UPDATE ON new_table
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## Files

| File | Purpose |
|------|---------|
| `supabase/migrations/001_initial_schema.sql` | Initial schema |
| `types/database.ts` | Auto-generated TypeScript types |
| `lib/supabase/client.ts` | Browser client (with demo fallback) |
| `.env.local` | Supabase URL + anon key |
| `.mcp.json` | Supabase MCP configuration |
