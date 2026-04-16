# Developer Documentation — Power Fitness Gym Management

## Table of Contents
1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Environment Variables](#environment-variables)
4. [Database Schema](#database-schema)
5. [RLS Policies](#rls-policies)
6. [Storage](#storage)
7. [Routes](#routes)
8. [State Management (GymContext)](#state-management-gymcontext)
9. [All Supabase Queries](#all-supabase-queries)
10. [Realtime Subscriptions](#realtime-subscriptions)
11. [Auth Flow](#auth-flow)
12. [Telegram Notification Flow](#telegram-notification-flow)
13. [Key Business Logic](#key-business-logic)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Backend | Supabase (PostgreSQL + Storage + Auth + Realtime) |
| Hosting | Vercel |
| Icons | Lucide React |
| Toast | react-hot-toast |
| Date | date-fns |
| Excel Export | xlsx |

**Dependencies:**
```json
{
  "@supabase/supabase-js": "^2.103.0",
  "date-fns": "^3.3.1",
  "lucide-react": "^0.344.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-hot-toast": "^2.4.1",
  "react-router-dom": "^6.22.3",
  "xlsx": "^0.18.5"
}
```

---

## Project Structure

```
src/
├── App.jsx                    # Routes + PrivateRoute wrapper
├── main.jsx                   # React entry point
├── index.css                  # Global styles + Tailwind directives
├── lib/
│   └── supabase.js            # Supabase client init
├── context/
│   └── GymContext.jsx         # Global state + all DB operations
├── pages/
│   ├── Home.jsx               # Public landing page (3 portals)
│   ├── AdminLogin.jsx         # Admin login form
│   ├── AdminDashboard.jsx     # Stats, recent members, quick actions
│   ├── MembersList.jsx        # Paginated member list + search/filter
│   ├── RegisterMember.jsx     # Add new / edit member form
│   ├── MemberHistory.jsx      # Per-member activity log
│   ├── AdminLogs.jsx          # All activity logs + pagination
│   ├── AdminSettings.jsx      # GCash, pricing, Telegram, promos
│   ├── AdminAttendance.jsx    # Daily attendance by date
│   ├── RenewalRequests.jsx    # Pending/approved/rejected GCash payments
│   ├── MemberPortal.jsx       # Kiosk: phone lookup → member info
│   ├── CheckIn.jsx            # Kiosk: member check-in
│   └── ReviewPayment.jsx      # Public: admin approves via Telegram link
├── components/
│   ├── Navbar.jsx             # Top nav (desktop) + bottom nav (mobile)
│   ├── Pagination.jsx         # Reusable Prev/Next pagination bar
│   ├── StatusBadge.jsx        # Membership status pill (Active/Expiring/Expired)
│   ├── GymLogo.jsx            # Gym logo mark
│   ├── BulkSMSModal.jsx       # Bulk SMS to expiring members
│   ├── SMSModal.jsx           # Single member SMS
│   ├── CameraCapture.jsx      # Camera/photo upload for member photo
│   └── RestoreModal.jsx       # Backup restore confirmation
└── utils/
    ├── backup.js              # Export/import JSON backup
    ├── exportExcel.js         # Export members to .xlsx
    └── helpers.js             # Shared utilities
```

---

## Environment Variables

File: `.env` (local) / Vercel environment settings (production)

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

Used in `src/lib/supabase.js`:
```js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

---

## Database Schema

### `members`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key, auto-generated |
| `name` | text | Member full name |
| `contact_number` | text | Phone number (not unique — multiple members may share) |
| `photo_url` | text | Public URL from Supabase Storage |
| `membership_type` | text | `monthly`, `quarterly`, `semi-annual`, `annual`, `student`, or promo name |
| `membership_start_date` | date | Format: YYYY-MM-DD |
| `membership_end_date` | date | Format: YYYY-MM-DD |
| `notes` | text | Admin notes |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Manually set on update |

### `gym_settings`
| Column | Type | Notes |
|---|---|---|
| `id` | text | Always `'default'` (single-row table) |
| `gcash_number` | text | GCash phone number for payments |
| `gcash_name` | text | GCash account name |
| `gcash_qr_url` | text | Public URL of QR code image |
| `price_monthly` | numeric | Monthly plan price |
| `price_quarterly` | numeric | Quarterly plan price |
| `price_semi_annual` | numeric | Semi-annual plan price |
| `price_annual` | numeric | Annual plan price |
| `price_student` | numeric | Student plan price |
| `telegram_bot_token` | text | Bot token from @BotFather |
| `telegram_chat_id` | text | Chat/channel ID for notifications |
| `site_url` | text | Production URL (e.g. `https://app.vercel.app`) — used for Telegram review links |
| `promos` | jsonb | Array of `{ name, price, duration_days }` |
| `last_backup_at` | timestamptz | Timestamp of last data export |
| `updated_at` | timestamptz | Manually set on save |

### `renewal_requests`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `member_id` | uuid | FK → members.id |
| `member_name` | text | Denormalized for display |
| `contact_number` | text | Denormalized |
| `membership_type` | text | Requested plan |
| `amount` | numeric | Payment amount |
| `gcash_reference` | text | GCash reference number |
| `receipt_url` | text | Public URL of payment screenshot |
| `duration_days` | integer | For promo plans only (null for standard) |
| `status` | text | `pending`, `approved`, `rejected` |
| `admin_notes` | text | Rejection reason |
| `view_token` | uuid | One-time UUID for Telegram review link |
| `view_token_expires_at` | timestamptz | Token valid for 5 minutes from submission |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Manually set on status change |

### `activity_logs`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `action` | text | `MEMBER_ADDED`, `MEMBER_UPDATED`, `MEMBER_DELETED`, `MEMBERSHIP_RENEWED`, `SMS_SENT`, `PAYMENT_APPROVED`, `PAYMENT_REJECTED` |
| `description` | text | Human-readable description |
| `member_name` | text | Denormalized |
| `member_id` | uuid | FK → members.id |
| `performed_by` | text | Admin email (from session) or `'Admin (via Telegram)'` |
| `performed_at` | timestamptz | Auto |

### `attendance`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `member_id` | uuid | FK → members.id |
| `member_name` | text | Denormalized for display |
| `checked_in_at` | timestamptz | Defaults to `now()` |

---

## RLS Policies

Run these in Supabase → SQL Editor. Required for the Telegram review link flow (unauthenticated access).

```sql
-- renewal_requests: allow anon to read by token
CREATE POLICY "anon_select_renewal_by_token"
  ON renewal_requests FOR SELECT TO anon
  USING (view_token IS NOT NULL);

-- renewal_requests: allow anon to update (approve/reject) by token
-- WITH CHECK (true) allows setting view_token to null after use
CREATE POLICY "anon_update_renewal_by_token"
  ON renewal_requests FOR UPDATE TO anon
  USING (view_token IS NOT NULL)
  WITH CHECK (true);

-- members: allow anon to update membership dates on approval
CREATE POLICY "anon_update_members"
  ON members FOR UPDATE TO anon
  USING (true);

-- activity_logs: allow anon to insert log entries from ReviewPayment
CREATE POLICY "anon_insert_activity_logs"
  ON activity_logs FOR INSERT TO anon
  WITH CHECK (true);
```

> **Note:** All other tables are protected by authenticated-only policies by default.

---

## Storage

**Bucket:** `member-photos` (public)

| Path pattern | Content | Notes |
|---|---|---|
| `{memberId}/photo.jpg` | Member profile photo | Upsert: true |
| `settings/gcash-qr.png` | GCash QR code | Upsert: true |
| `receipts/{timestamp}-{memberId}.{ext}` | GCash payment receipt | Upsert: false |

All files return a permanent public URL via `getPublicUrl()`.

---

## Routes

Defined in `src/App.jsx`.

| Path | Component | Access |
|---|---|---|
| `/` | Home | Public |
| `/admin/login` | AdminLogin | Public |
| `/admin` | AdminDashboard | Private |
| `/admin/members` | MembersList | Private |
| `/admin/register` | RegisterMember (new) | Private |
| `/admin/members/:id/edit` | RegisterMember (edit) | Private |
| `/admin/members/:id/history` | MemberHistory | Private |
| `/admin/logs` | AdminLogs | Private |
| `/admin/settings` | AdminSettings | Private |
| `/admin/renewals` | RenewalRequests | Private |
| `/admin/attendance` | AdminAttendance | Private |
| `/member` | MemberPortal | Public |
| `/checkin` | CheckIn | Public |
| `/review/:token` | ReviewPayment | Public (token-gated) |
| `*` | Redirect to `/` | — |

Private routes are wrapped in `<PrivateRoute>` which checks `isAdminLoggedIn` from GymContext. Unauthenticated access redirects to `/admin/login`.

---

## State Management (GymContext)

`src/context/GymContext.jsx` — wraps the entire app, provides global state and all DB operations.

### State Variables

```js
members            // Member[]      — all gym members
loading            // boolean       — members loading state
authLoading        // boolean       — initial auth check pending
isAdminLoggedIn    // boolean       — admin session active
adminEmail         // string|null   — logged-in admin email
settings           // object        — gym config (prices, GCash, Telegram, promos)
renewalRequests    // object[]      — all renewal/payment requests
```

### `settings` shape

```js
{
  gcashNumber:      string,
  gcashName:        string,
  gcashQrUrl:       string|null,
  priceMonthly:     number,
  priceQuarterly:   number,
  priceSemiAnnual:  number,
  priceAnnual:      number,
  priceStudent:     number,
  telegramChatId:   string,
  telegramBotToken: string,
  siteUrl:          string,   // e.g. https://your-app.vercel.app
  lastBackupAt:     string|null,
  promos:           Array<{ name: string, price: number, duration_days: number }>,
}
```

### Exported Functions

```js
// Auth
adminLogin(email, password)
adminLogout()

// Members
addMember(formData)
updateMember(id, formData)
deleteMember(id)
renewMember(id, membershipType, paymentMethod, durationDays)
getMemberById(id)
findMembers(query)
getExpiringMembers()
getMemberStatus(member)   // returns 'active' | 'expiring' | 'expired'
refreshMembers()

// Settings
saveSettings(formData)
recordBackup()

// Renewal Requests
submitRenewalRequest(payload)
approveRenewalRequest(request)
rejectRenewalRequest(id, notes)
loadRenewalRequests()

// Logging
logAction(action, description, memberName?, memberId?)

// Computed
pendingRenewals   // renewal_requests filtered to status === 'pending'
```

---

## All Supabase Queries

### AUTH

**Check session on app load** — `GymContext.jsx`
```js
supabase.auth.getSession()
  .then(({ data: { session } }) => {
    setIsAdminLoggedIn(!!session);
    setAdminEmail(session?.user?.email || null);
    setAuthLoading(false);
  });
```

**Listen for auth changes** — `GymContext.jsx`
```js
supabase.auth.onAuthStateChange((_event, session) => {
  setIsAdminLoggedIn(!!session);
  setAdminEmail(session?.user?.email || null);
});
```

**Sign in** — `GymContext.jsx` > `adminLogin()`
```js
const { error } = await supabase.auth.signInWithPassword({ email, password });
```

**Sign out** — `GymContext.jsx` > `adminLogout()`
```js
await supabase.auth.signOut();
```

---

### MEMBERS

**Load all members** — `GymContext.jsx` > `loadMembers()`
```js
const { data, error } = await supabase
  .from('members')
  .select('*')
  .order('created_at', { ascending: false });
```

**Insert new member** — `GymContext.jsx` > `addMember()`
```js
const { data: inserted, error } = await supabase
  .from('members')
  .insert([{
    name:                   formData.name,
    contact_number:         formData.contactNumber,
    photo_url:              null,
    membership_type:        formData.membershipType,
    membership_start_date:  formData.membershipStartDate,
    membership_end_date:    endDate,
    notes:                  formData.notes || '',
  }])
  .select()
  .single();
```

**Update member photo after insert** — `GymContext.jsx` > `addMember()`
```js
await supabase
  .from('members')
  .update({ photo_url: photoUrl, updated_at: new Date().toISOString() })
  .eq('id', inserted.id);
```

**Update member (edit)** — `GymContext.jsx` > `updateMember()`
```js
const { data, error } = await supabase
  .from('members')
  .update({
    name:                   formData.name,
    contact_number:         formData.contactNumber,
    photo_url:              photoUrl,
    membership_type:        membershipType,
    membership_start_date:  startDate,
    membership_end_date:    endDate,
    notes:                  formData.notes || '',
    updated_at:             new Date().toISOString(),
  })
  .eq('id', id)
  .select()
  .single();
```

**Quick renew member** — `GymContext.jsx` > `renewMember()`
```js
const { data, error } = await supabase
  .from('members')
  .update({
    membership_type:        membershipType,
    membership_start_date:  today,
    membership_end_date:    endDate,
    updated_at:             new Date().toISOString(),
  })
  .eq('id', id)
  .select()
  .single();
```

**Update membership after GCash approval** — `GymContext.jsx` > `approveRenewalRequest()`
```js
const { data, error } = await supabase
  .from('members')
  .update({
    membership_type:        request.membership_type,
    membership_start_date:  today,
    membership_end_date:    endDate,
    updated_at:             new Date().toISOString(),
  })
  .eq('id', request.member_id)
  .select()
  .single();
```

**Update membership via Telegram link approval** — `ReviewPayment.jsx` > `handleApprove()`
```js
const { error } = await supabase
  .from('members')
  .update({
    membership_type:        request.membership_type,
    membership_start_date:  today,
    membership_end_date:    endDate,
    updated_at:             new Date().toISOString(),
  })
  .eq('id', request.member_id);
```

**Delete member** — `GymContext.jsx` > `deleteMember()`
```js
const { error } = await supabase
  .from('members')
  .delete()
  .eq('id', id);
```

---

### GYM SETTINGS

**Load settings** — `GymContext.jsx` > `loadSettings()`
```js
const { data, error } = await supabase
  .from('gym_settings')
  .select('*')
  .eq('id', 'default')
  .single();
```

**Save settings** — `GymContext.jsx` > `saveSettings()`
```js
const { error } = await supabase.from('gym_settings').upsert({
  id:                 'default',
  gcash_number:       formData.gcashNumber,
  gcash_name:         formData.gcashName,
  gcash_qr_url:       gcashQrUrl,
  price_monthly:      Number(formData.priceMonthly) || 0,
  price_quarterly:    Number(formData.priceQuarterly) || 0,
  price_semi_annual:  Number(formData.priceSemiAnnual) || 0,
  price_annual:       Number(formData.priceAnnual) || 0,
  price_student:      Number(formData.priceStudent) || 0,
  telegram_chat_id:   formData.telegramChatId || '',
  telegram_bot_token: formData.telegramBotToken || '',
  site_url:           formData.siteUrl || '',
  promos:             formData.promos || [],
  updated_at:         new Date().toISOString(),
});
```

**Record backup timestamp** — `GymContext.jsx` > `recordBackup()`
```js
await supabase.from('gym_settings').upsert({
  id:             'default',
  last_backup_at: now,
});
```

---

### RENEWAL REQUESTS

**Load all renewal requests** — `GymContext.jsx` > `loadRenewalRequests()`
```js
const { data, error } = await supabase
  .from('renewal_requests')
  .select('*')
  .order('created_at', { ascending: false });
```

**Submit new renewal request** — `GymContext.jsx` > `submitRenewalRequest()`
```js
const viewToken           = crypto.randomUUID();
const viewTokenExpiresAt  = new Date(Date.now() + 5 * 60 * 1000).toISOString();

const { error } = await supabase.from('renewal_requests').insert([{
  member_id:              payload.memberId,
  member_name:            payload.memberName,
  contact_number:         payload.contactNumber,
  membership_type:        payload.membershipType,
  amount:                 payload.amount,
  gcash_reference:        payload.gcashReference || '',
  receipt_url:            receiptUrl,
  duration_days:          payload.durationDays || null,
  status:                 'pending',
  view_token:             viewToken,
  view_token_expires_at:  viewTokenExpiresAt,
}]);
```

**Fetch renewal request by token** — `ReviewPayment.jsx` > `load()`
```js
const { data, error } = await supabase
  .from('renewal_requests')
  .select('*')
  .eq('view_token', token)
  .single();
```

**Approve renewal request** — `GymContext.jsx` > `approveRenewalRequest()`
```js
const { error } = await supabase
  .from('renewal_requests')
  .update({ status: 'approved', updated_at: new Date().toISOString() })
  .eq('id', request.id);
```

**Approve via Telegram link** — `ReviewPayment.jsx` > `handleApprove()`
```js
const { error } = await supabase
  .from('renewal_requests')
  .update({ status: 'approved', updated_at: new Date().toISOString() })
  .eq('id', request.id);
```

**Reject renewal request** — `GymContext.jsx` > `rejectRenewalRequest()`
```js
const { error } = await supabase
  .from('renewal_requests')
  .update({ status: 'rejected', admin_notes: notes, updated_at: new Date().toISOString() })
  .eq('id', id);
```

**Reject via Telegram link** — `ReviewPayment.jsx` > `handleReject()`
```js
const { error } = await supabase
  .from('renewal_requests')
  .update({ status: 'rejected', admin_notes: rejectNotes, updated_at: new Date().toISOString() })
  .eq('id', request.id);
```

**Delete renewal record** — `RenewalRequests.jsx` > `handleDelete()`
```js
const { error } = await supabase
  .from('renewal_requests')
  .delete()
  .eq('id', deleteTarget.id);
```

---

### ACTIVITY LOGS

**Insert log entry** — `GymContext.jsx` > `logAction()`
```js
await supabase.from('activity_logs').insert([{
  action:       action,
  description:  description,
  member_name:  memberName,
  member_id:    memberId,
  performed_by: adminEmail || 'Admin',
}]);
```

**Insert log entry from Telegram approval** — `ReviewPayment.jsx`
```js
await supabase.from('activity_logs').insert([{
  action:       'PAYMENT_APPROVED',  // or 'PAYMENT_REJECTED'
  description:  `Approved GCash payment ₱${request.amount} — renewed ${request.membership_type} for: ${request.member_name}`,
  member_name:  request.member_name,
  member_id:    request.member_id,
  performed_by: 'Admin (via Telegram)',
}]);
```

**Query all logs with filter + search + pagination** — `AdminLogs.jsx`
```js
let q = supabase
  .from('activity_logs')
  .select('*', { count: 'exact' })
  .order('performed_at', { ascending: false })
  .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);  // PAGE_SIZE = 20

if (filter !== 'all') q = q.eq('action', filter);
if (query.trim())     q = q.ilike('member_name', `%${query.trim()}%`);

const { data, count, error } = await q;
```

**Query logs by member** — `MemberHistory.jsx`
```js
const { data, error } = await supabase
  .from('activity_logs')
  .select('*')
  .eq('member_id', id)
  .order('created_at', { ascending: false });
```

**Clear all logs** — `AdminLogs.jsx` > `handleClearAll()`
```js
// Deletes all rows (neq on a non-existent UUID matches everything)
const { error } = await supabase
  .from('activity_logs')
  .delete()
  .neq('id', '00000000-0000-0000-0000-000000000000');
```

---

### ATTENDANCE

**Load today's check-ins for a list of members** — `CheckIn.jsx`
```js
const { data } = await supabase
  .from('attendance')
  .select('member_id, checked_in_at')
  .in('member_id', ids)
  .gte('checked_in_at', `${today}T00:00:00`)
  .lte('checked_in_at', `${today}T23:59:59`);
```

**Check if member already checked in today** — `CheckIn.jsx`
```js
const { data: existing } = await supabase
  .from('attendance')
  .select('id, checked_in_at')
  .eq('member_id', member.id)
  .gte('checked_in_at', `${today}T00:00:00`)
  .lte('checked_in_at', `${today}T23:59:59`)
  .maybeSingle();
```

**Insert check-in** — `CheckIn.jsx`
```js
const { data, error } = await supabase
  .from('attendance')
  .insert([{
    member_id:    member.id,
    member_name:  member.name,
  }])
  .select()
  .single();
```

**Load attendance by date** — `AdminAttendance.jsx`
```js
const { data, error } = await supabase
  .from('attendance')
  .select('*')
  .gte('checked_in_at', `${selectedDate}T00:00:00`)
  .lte('checked_in_at', `${selectedDate}T23:59:59`)
  .order('checked_in_at', { ascending: true });
```

---

### STORAGE

**Upload member photo** — `GymContext.jsx`
```js
await supabase.storage
  .from('member-photos')
  .upload(`${memberId}/photo.jpg`, blob, { contentType: 'image/jpeg', upsert: true });

const { data } = supabase.storage
  .from('member-photos')
  .getPublicUrl(`${memberId}/photo.jpg`);
// → data.publicUrl
```

**Remove member photo** — `GymContext.jsx`
```js
await supabase.storage
  .from('member-photos')
  .remove([`${memberId}/photo.jpg`]);
```

**Upload GCash QR code** — `GymContext.jsx` > `saveSettings()`
```js
await supabase.storage
  .from('member-photos')
  .upload('settings/gcash-qr.png', file, { contentType: file.type, upsert: true });

const { data } = supabase.storage
  .from('member-photos')
  .getPublicUrl('settings/gcash-qr.png');
```

**Upload payment receipt** — `GymContext.jsx` > `submitRenewalRequest()`
```js
const path = `receipts/${Date.now()}-${payload.memberId}.${ext}`;

await supabase.storage
  .from('member-photos')
  .upload(path, file, { contentType: file.type, upsert: false });

const { data } = supabase.storage
  .from('member-photos')
  .getPublicUrl(path);
```

---

## Realtime Subscriptions

Both subscriptions are set up in `GymContext.jsx` and re-fetch all data on any table change.

**Members**
```js
supabase
  .channel('members_realtime')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => {
    loadMembers();
  })
  .subscribe();
```

**Renewal Requests**
```js
supabase
  .channel('renewal_requests_realtime')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'renewal_requests' }, () => {
    loadRenewalRequests();
  })
  .subscribe();
```

Both channels are cleaned up on unmount via `return () => supabase.removeChannel(channel)`.

---

## Auth Flow

1. App loads → `supabase.auth.getSession()` checks for existing session
2. If session exists → `isAdminLoggedIn = true`, `adminEmail` set from session
3. Admin logs in via `/admin/login` → `signInWithPassword()` → session stored in localStorage by Supabase SDK
4. `PrivateRoute` reads `isAdminLoggedIn` from context — redirects to `/admin/login` if false
5. Admin logs out → `signOut()` → session cleared → `isAdminLoggedIn = false` → redirect to login

---

## Telegram Notification Flow

Triggered when a member submits a GCash renewal in `MemberPortal.jsx`.

1. `submitRenewalRequest()` generates `viewToken = crypto.randomUUID()`
2. Sets `view_token_expires_at = now + 5 minutes`
3. Inserts renewal request with token into DB
4. Sends Telegram message to admin:

```
💳 New Payment Request

👤 Member: John Doe
📋 Plan: Monthly
💰 Amount: ₱500
🔖 GCash Ref: 1234567890

🔗 Review & Approve / Reject → https://your-app.vercel.app/review/<token>
```

5. Admin clicks link → opens `/review/:token` (no login required)
6. `ReviewPayment.jsx` fetches renewal by token, checks `view_token_expires_at`
7. If expired → shows "Link expired" screen
8. If valid → admin can Approve or Reject
9. On approval: updates `members` table, updates request status, logs action as `performed_by: 'Admin (via Telegram)'`

**Required settings** (`gym_settings` row):
- `telegram_bot_token` — from @BotFather
- `telegram_chat_id` — admin's chat ID
- `site_url` — production URL (no trailing slash)

---

## Key Business Logic

### Membership Status
```js
getMemberStatus(member):
  'expired'  → membership_end_date < today
  'expiring' → membership_end_date within 7 days
  'active'   → otherwise
```

### End Date Calculation
Standard plans use months; promo plans use `duration_days`:
```js
monthly:       today + 1 month
quarterly:     today + 3 months
semi-annual:   today + 6 months
annual:        today + 12 months
student:       today + 1 month
promo:         today + duration_days
```

### Phone Number Matching (MemberPortal)
Allows partial match to handle country code variations:
```js
const found = members.filter((m) =>
  m.contactNumber.replace(/\D/g, '').endsWith(digits) ||
  digits.endsWith(m.contactNumber.replace(/\D/g, ''))
);
```

### Pagination
- **AdminLogs** — server-side via Supabase `.range()` + `count: 'exact'` (`PAGE_SIZE = 20`)
- **MembersList** — client-side slice of in-memory array (`PAGE_SIZE = 15`)
- **RenewalRequests** — client-side slice (`PAGE_SIZE = 10`)

### Action Types (`activity_logs.action`)
| Value | Trigger |
|---|---|
| `MEMBER_ADDED` | New member registered |
| `MEMBER_UPDATED` | Member profile edited |
| `MEMBER_DELETED` | Member deleted |
| `MEMBERSHIP_RENEWED` | Quick renew from admin panel |
| `SMS_SENT` | SMS sent to member |
| `PAYMENT_APPROVED` | GCash payment approved |
| `PAYMENT_REJECTED` | GCash payment rejected |
