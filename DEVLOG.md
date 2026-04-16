# GymHub — Development Log
**Project:** Power Fitness Gym Management System
**Stack:** React 18 + Vite + Tailwind CSS + Supabase + Vercel
**GitHub:** https://github.com/1997xjustin12/gym-management

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend / Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage (`member-photos` bucket) |
| Real-time | Supabase Realtime (postgres_changes) |
| Deployment | Vercel (auto-deploy on git push) |
| Notifications | Telegram Bot API via Supabase Edge Function |
| Icons | Lucide React |
| Date utils | date-fns |

---

## Database Schema

### `members`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | TEXT | |
| contact_number | TEXT | |
| photo_url | TEXT | Supabase storage URL |
| membership_type | TEXT | monthly / quarterly / semi-annual / annual |
| membership_start_date | DATE | |
| membership_end_date | DATE | |
| notes | TEXT | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### `gym_settings`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT | Primary key, always `'default'` |
| gcash_number | TEXT | |
| gcash_name | TEXT | |
| gcash_qr_url | TEXT | Supabase storage URL |
| price_monthly | NUMERIC | |
| price_quarterly | NUMERIC | |
| price_semi_annual | NUMERIC | |
| price_annual | NUMERIC | |
| telegram_chat_id | TEXT | Configurable from admin settings |
| telegram_bot_token | TEXT | Configurable from admin settings |
| site_url | TEXT | Used in Telegram notification links |
| last_backup_at | TIMESTAMPTZ | Updated on each backup download |
| updated_at | TIMESTAMPTZ | |

### `renewal_requests`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| member_id | UUID | FK to members |
| member_name | TEXT | |
| contact_number | TEXT | |
| membership_type | TEXT | |
| amount | NUMERIC | |
| gcash_reference | TEXT | |
| receipt_url | TEXT | Supabase storage URL |
| status | TEXT | pending / approved / rejected |
| admin_notes | TEXT | Rejection reason |
| view_token | UUID | One-time token for Telegram review link |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### `activity_logs`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| action | TEXT | MEMBER_ADDED, MEMBER_UPDATED, etc. |
| description | TEXT | |
| member_name | TEXT | |
| member_id | UUID | |
| created_at | TIMESTAMPTZ | |

---

## All SQL Queries Run

```sql
-- 1. Create gym_settings table
CREATE TABLE gym_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  gcash_number TEXT DEFAULT '',
  gcash_name TEXT DEFAULT '',
  gcash_qr_url TEXT,
  price_monthly NUMERIC DEFAULT 0,
  price_quarterly NUMERIC DEFAULT 0,
  price_semi_annual NUMERIC DEFAULT 0,
  price_annual NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO gym_settings (id) VALUES ('default');
ALTER TABLE gym_settings DISABLE ROW LEVEL SECURITY;

-- 2. Create renewal_requests table
CREATE TABLE renewal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID,
  member_name TEXT NOT NULL,
  contact_number TEXT,
  membership_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  gcash_reference TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE renewal_requests DISABLE ROW LEVEL SECURITY;

-- 3. Add receipt_url column
ALTER TABLE renewal_requests ADD COLUMN receipt_url TEXT;

-- 4. Storage policy for receipt uploads
CREATE POLICY "Allow public receipt uploads" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'member-photos' AND name LIKE 'receipts/%');

-- 5. Storage policy for member photo updates (upsert support)
CREATE POLICY "Allow all operations on member-photos" ON storage.objects
  FOR ALL TO public
  USING (bucket_id = 'member-photos')
  WITH CHECK (bucket_id = 'member-photos');

-- 6. Enable real-time on tables
ALTER PUBLICATION supabase_realtime ADD TABLE renewal_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE members;

-- 7. Add Telegram Chat ID to settings
ALTER TABLE gym_settings ADD COLUMN telegram_chat_id TEXT DEFAULT '';

-- 8. Add Telegram Bot Token to settings
ALTER TABLE gym_settings ADD COLUMN telegram_bot_token TEXT DEFAULT '';

-- 9. Add Site URL to settings
ALTER TABLE gym_settings ADD COLUMN site_url TEXT DEFAULT '';

-- 10. Add last backup timestamp
ALTER TABLE gym_settings ADD COLUMN last_backup_at TIMESTAMPTZ;

-- 11. Add one-time review token to renewal requests
ALTER TABLE renewal_requests ADD COLUMN view_token UUID DEFAULT gen_random_uuid();
```

---

## Supabase Edge Function — `notify-admin`

Triggered by a Database Webhook on `renewal_requests` INSERT.
Reads `telegram_bot_token`, `telegram_chat_id`, and `site_url` from `gym_settings`.
Sends a Telegram message with payment details and a one-time review link.

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL               = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const PLAN_LABELS: Record<string, string> = {
  monthly: '1 Month', quarterly: '3 Months',
  'semi-annual': '6 Months', annual: '1 Year',
}

serve(async (req) => {
  try {
    const payload = await req.json()
    const record  = payload.record

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: settings } = await supabase
      .from('gym_settings')
      .select('telegram_bot_token, telegram_chat_id, site_url')
      .eq('id', 'default').single()

    const botToken = settings?.telegram_bot_token
    const chatId   = settings?.telegram_chat_id
    const siteUrl  = settings?.site_url?.replace(/\/$/, '') || ''

    if (!botToken || !chatId) {
      return new Response(JSON.stringify({ ok: false, reason: 'Telegram not configured' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const plan   = PLAN_LABELS[record.membership_type] || record.membership_type
    const amount = Number(record.amount).toLocaleString()
    const reviewLink = siteUrl && record.view_token
      ? `\n\n🔍 [Review & Approve Payment](${siteUrl}/review/${record.view_token})`
      : siteUrl ? `\n\n🔗 [Open Admin Panel](${siteUrl}/admin/renewals)` : ''

    const message = [
      `💰 *New Payment Request!*`, ``,
      `👤 *Member:* ${record.member_name}`,
      `📱 *Contact:* ${record.contact_number || '—'}`,
      `📋 *Plan:* ${plan}`,
      `💵 *Amount:* ₱${amount}`,
      `🔑 *Ref #:* ${record.gcash_reference || '—'}`,
      reviewLink,
    ].join('\n')

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'Markdown' }),
    })

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

**Database Webhook setup:**
- Name: `notify-admin-on-payment`
- Table: `renewal_requests`
- Event: INSERT only
- Type: Supabase Edge Functions → `notify-admin`

---

## Features Developed

### 1. Authentication
- Supabase email/password auth
- Auto-redirect to `/admin` if session already active (persists across tabs)
- Login lockout after 5 failed attempts (5-minute cooldown)
- Countdown timer on lockout

### 2. GymLogo Component
- `src/components/GymLogo.jsx`
- Renders `public/gym-logo.png` at configurable size
- Used in Navbar, AdminLogin, Home page

### 3. Home Page (`/`)
- Animated background blobs (CSS keyframes)
- Logo fade-in from top, title and cards fade-in from bottom with staggered delays
- Card hover: lifts up, icon scales, arrow slides right
- Auto-redirects to `/admin` if already logged in
- Power Fitness Gym branding with address in footer

### 4. Admin Login (`/admin/login`)
- Card layout, properly centered on mobile
- Email + password with show/hide toggle
- Brute-force protection (5 attempts → 5 min lockout)

### 5. Admin Dashboard (`/admin`)
- Stats: Total, Active, Expiring, Expired members
- Backup reminder (warns if no backup or >7 days since last backup)
- Last backup date stored in Supabase (persists across devices/browsers)
- Expiring members list with SMS action
- Bulk SMS modal

### 6. Members List (`/admin/members`)
- Search by name or contact number
- Filter tabs: All / Active / Expiring / Expired with counts
- Per-member actions: SMS (expiring only), Quick Renew, Edit, Delete
- Export to Excel
- Delete confirmation modal

### 7. Quick Renew (from Members List)
- Green refresh button on each member row
- Modal: select membership plan (with prices) + payment method (Cash / GCash)
- Instantly renews membership and logs action to activity_logs

### 8. Register / Edit Member (`/admin/register`, `/admin/members/:id/edit`)
- Camera capture with front/back switch, mirror effect on captured photo
- Photo upload to Supabase storage with cache-busting `?v=timestamp`
- Delete member button with confirmation (edit mode only)
- Membership start date + auto-calculated end date
- Real error messages surfaced in toast

### 9. Camera Capture Component
- `src/components/CameraCapture.jsx`
- Front/back camera switch
- Captured photo mirrors front camera (canvas `scale(-1,1)`)
- Centered modal on all screen sizes

### 10. Admin Settings (`/admin/settings`)
- GCash number, account name, QR code upload with preview
- Membership prices per plan (Monthly / Quarterly / Semi-Annual / Annual)
- Telegram Bot Token + Chat ID (fully configurable, no hardcoded secrets)
- Admin Panel URL (used in Telegram notification links)
- Last backup display

### 11. Renewal Requests (`/admin/renewals`)
- Collapsible cards (one expanded at a time)
- Status dot (pulsing orange = pending, green = approved, red = rejected)
- Filter tabs: Pending / Approved / Rejected / All — all with counts
- Expanded view: payment details grid, receipt image (tap to zoom)
- Approve → directly updates member's membership dates (bypasses name check)
- Reject → modal with optional notes
- Re-approve rejected requests
- Real-time live updates via Supabase postgres_changes

### 12. Member Portal (`/member`)
- Search by name or phone number
- Membership status display (Active / Expiring / Expired)
- Membership details: plan, days left, start/end dates
- Gym address shown below search bar (always visible)
- GCash payment flow (3 steps):
  1. Select plan with prices
  2. GCash number (copy button) + QR code (downloadable) + reference input
  3. Receipt proof: **Take Photo** (camera) OR **Upload from Gallery** (separate buttons)
  4. Success confirmation screen
- Payment status card: Pending / Rejected (with reason) / Approved
- Pay button hidden while payment is pending (prevents double submission)
- "Resubmit Payment" shown if rejected
- Real-time updates

### 13. Review Payment Page (`/review/:token`)
- Public page — no login required
- Accessed via Telegram notification link
- Shows full payment details and receipt image
- Approve & Renew or Reject (with notes) buttons
- **One-time use:** token is nulled out after approve or reject
- Re-approve available if previously rejected
- Activity log entry created on each action

### 14. Telegram Notifications
- Bot created via @BotFather
- Bot token and chat ID stored in `gym_settings` (configurable from admin UI)
- Triggered by Supabase Database Webhook on renewal_requests INSERT
- Message includes: member name, contact, plan, amount, reference number, review link
- Review link is one-time use (invalidated after approve/reject)

### 15. Real-time Live Updates
- Supabase `postgres_changes` subscriptions for `members` and `renewal_requests`
- No manual refresh needed — UI updates automatically across all open tabs

### 16. Backup System
- Export members to JSON file
- Export members to Excel file
- Last backup date saved to Supabase (not localStorage) — persists across devices
- Dashboard warns if no backup or backup older than 7 days

### 17. Activity Logs (`/admin/logs`)
- All actions logged: member added/updated/deleted, membership renewed, payment approved/rejected
- Viewable in admin panel

---

## Files Created / Modified

| File | Status | Description |
|------|--------|-------------|
| `src/context/GymContext.jsx` | Modified | Central state: members, settings, renewals, auth, all CRUD |
| `src/App.jsx` | Modified | Routes including public `/review/:token` |
| `src/pages/Home.jsx` | Modified | Animated landing page, auto-redirect if logged in |
| `src/pages/AdminLogin.jsx` | Modified | Login with lockout, mobile-centered card layout |
| `src/pages/AdminDashboard.jsx` | Modified | Stats, backup reminder, expiring members |
| `src/pages/MembersList.jsx` | Modified | Quick renew modal, delete confirmation |
| `src/pages/RegisterMember.jsx` | Modified | Delete button, real error messages |
| `src/pages/MemberPortal.jsx` | Modified | GCash payment flow, payment status, dual receipt upload |
| `src/pages/RenewalRequests.jsx` | Created | Collapsible payment request cards |
| `src/pages/AdminSettings.jsx` | Created | GCash, prices, Telegram, site URL settings |
| `src/pages/ReviewPayment.jsx` | Created | Public one-time payment review page |
| `src/components/GymLogo.jsx` | Created | Gym logo image component |
| `src/components/CameraCapture.jsx` | Modified | Mirror fix, centered modal |
| `src/components/Navbar.jsx` | Modified | GymLogo, Payments + Settings nav links, badges |
| `index.html` | Modified | Favicon set to `/gym-logo.png` |
| `public/gym-logo.png` | Added | Actual gym logo image |

---

## Issues Fixed

| Issue | Cause | Fix |
|-------|-------|-----|
| "Member already exists" on Approve & Renew | `approveRenewalRequest` called `updateMember` which runs name duplicate check | Rewrote to directly UPDATE membership dates, bypassing `updateMember` |
| Submit button unreachable in GCash modal | Modal had no scroll | Added `max-h-[90vh] flex flex-col` + `overflow-y-auto` |
| Photo not updated after retake on refresh | Supabase storage URL stays the same, browser caches old image | Append `?v=Date.now()` to photo URL after upload |
| Generic error message hiding real errors | `toast.error('Something went wrong')` | Changed to `toast.error(err.message)` |
| Camera modal at bottom on mobile | `items-end` on mobile (bottom sheet style) | Changed to `items-center` always |
| Session appears lost in new tab | Home page showed even when logged in | Added `<Navigate to="/admin" replace />` if `isAdminLoggedIn` |
| "No backup found" always showing | Backup date stored in localStorage (per browser) | Moved to Supabase `gym_settings.last_backup_at` |
| Pending payment check not working for members | `renewalRequests` only loaded when admin is logged in | Removed `if (isAdminLoggedIn)` condition |
| Gallery upload not working on mobile | `capture="environment"` forces camera only | Separate buttons: Take Photo (with capture) and Upload from Gallery (without) |
| Members loading blocks review page | `loading || authLoading` gated all routes | Changed to `authLoading` only for route rendering |

---

## Future Considerations (Multi-Tenant Scale)

When scaling to support multiple gyms:
- Add `gyms` table and `gym_id` column to all tables
- Re-enable RLS scoped per `gym_id`
- Each admin account linked to a `gym_id` via `user_metadata` or join table
- `gym_settings` already per-row — good foundation
- Telegram / GCash settings already per-gym — ready to scale
- Remove hardcoded gym name/address, pull from `gym_settings`
