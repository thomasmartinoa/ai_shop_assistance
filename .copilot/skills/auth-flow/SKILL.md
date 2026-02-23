---
name: auth-flow
description: Manage authentication flow, phone OTP login, session management, and user onboarding for the Shopkeeper AI. Use when user asks about login, authentication, OTP, session, logout, onboarding, sign up, or user management. Also use when user says "auth", "login", "OTP", "session", "logout", "onboarding", "sign up".
tools: Read, Bash, Edit, Write, Grep, Glob
---

# Authentication Flow

Manage Phone OTP authentication, session handling, and shop onboarding via Supabase Auth.

## Architecture

```
Phone Number Input
    ↓
Supabase Auth (sendOtp)
    ↓
OTP SMS to User
    ↓
User enters OTP
    ↓
Supabase Auth (verifyOtp)
    ↓
Session Created (JWT)
    ↓
Check: Has shop? ──No──→ Onboarding
    ↓ Yes
Dashboard
```

## Key Files

| File | Purpose | Status |
|------|---------|--------|
| `app/(auth)/login/page.tsx` | Phone OTP login UI | Implemented |
| `app/(auth)/onboarding/page.tsx` | Shop setup wizard | Planned (in structure) |
| `contexts/AuthContext.tsx` | Auth state provider | Implemented |
| `lib/supabase/client.ts` | Supabase client | Implemented |
| `hooks/useAuth.ts` | Auth hook | Planned |

## Supabase Auth Configuration

### Enable Phone Auth in Supabase Dashboard
1. Go to Authentication > Providers
2. Enable **Phone** provider
3. Configure SMS provider (Twilio/MessageBird/Vonage)
4. Set OTP expiry (default: 60 seconds)

### Phone OTP Flow
```typescript
// Step 1: Send OTP
const { error } = await supabase.auth.signInWithOtp({
  phone: '+91XXXXXXXXXX', // Indian phone number
});

// Step 2: Verify OTP
const { data, error } = await supabase.auth.verifyOtp({
  phone: '+91XXXXXXXXXX',
  token: '123456',
  type: 'sms',
});

// Step 3: Get session
const { data: { session } } = await supabase.auth.getSession();

// Step 4: Sign out
await supabase.auth.signOut();
```

## Session Management

### AuthContext Pattern
```typescript
interface AuthState {
  user: User | null;
  session: Session | null;
  shop: Shop | null;
  isLoading: boolean;
  isDemoMode: boolean;
}
```

### Auth State Changes
```typescript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // Load shop data
    // Redirect to dashboard
  }
  if (event === 'SIGNED_OUT') {
    // Clear state
    // Redirect to login
  }
});
```

## Demo Mode

When Supabase is not configured (placeholder URL/key), the app runs in demo mode:
- No real authentication
- Uses demo products
- All data is local/ephemeral
- Toggle: `lib/supabase/client.ts` returns `null` client

## Route Protection

Pages under `app/(app)/` should be protected:
```typescript
// In app/(app)/layout.tsx
export default function AppLayout({ children }) {
  const { user, isLoading, isDemoMode } = useAuth();

  if (isLoading) return <Loading />;
  if (!user && !isDemoMode) redirect('/login');

  return <>{children}</>;
}
```

## Onboarding Flow

After first login, user needs to set up their shop:
1. Shop name (English + Malayalam)
2. Phone number
3. Address
4. UPI ID (for payment QR codes)
5. GSTIN (optional)

```typescript
// Create shop record
const { error } = await supabase
  .from('shops')
  .insert({
    owner_id: user.id,
    name: shopName,
    name_ml: shopNameMl,
    phone: phone,
    upi_id: upiId,
  });
```

## RLS Policy Dependencies

Auth relies on RLS policies using `auth.uid()`:
```sql
-- Users can only access their own shop
CREATE POLICY "Users can view own shop" ON shops
    FOR SELECT USING (auth.uid() = owner_id);
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| OTP not received | Check SMS provider config in Supabase dashboard |
| Session expires | Default 1 hour, configure in Auth settings |
| RLS blocks queries | Ensure user has a shop record with matching owner_id |
| Demo mode unexpected | Check NEXT_PUBLIC_SUPABASE_URL is not placeholder |
| Redirect loop | Check auth state loading before redirect |
