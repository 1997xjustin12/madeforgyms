# Power Fitness Gym — Management System
### Feature Documentation for Stakeholders
**Version:** 1.0 | **Last Updated:** April 2026

---

## Overview

Power Fitness Gym Management System is a web-based platform designed to streamline gym operations. It covers everything from member registration and membership tracking to coach management, GCash payments, and attendance — accessible from any device through a web browser. No app installation required.

**Live URL:** [powerfitnessgym.online](https://powerfitnessgym.online)

---

## Who Uses the System

| Role | Access | How They Log In |
|---|---|---|
| **Admin** | Full access to all features | Email + password at `/admin` |
| **Coach / Trainer** | Their assigned members only | Access code at `/coach` |
| **Member** | Their own membership info | Phone number lookup at `/member` |

---

## Admin Features

### 1. Dashboard
The main overview screen shown after admin login.

- **Live statistics** — Total members, Active members, Expiring Soon, Expired
- **Active rate** — Percentage of members currently active
- **Expiring members list** — Members expiring within 5 days with quick SMS action
- **SMS notifications** — Send individual or bulk SMS to expiring members
- **Data export** — Export full member list to Excel (.xlsx)
- **Backup & Restore** — Download a full data backup (JSON) or restore from a previous backup; warns if backup is overdue (7+ days)

---

### 2. Member Management

#### Register a Member
Admins can register new members with the following information:
- Full name and contact number
- Profile photo (via camera or upload)
- Membership plan (Monthly, Quarterly, Semi-Annual, Annual, Student, or Special Promo)
- Membership start date
- Notes (optional)
- Coach assignment (optional) — with coaching subscription package, start date, and end date

#### Edit a Member
All member information can be updated at any time, including:
- Personal details and photo
- Membership plan and start date (with a quick "Renew" button to set today as the new start)
- Coach assignment and coaching package

#### Member List (Mobile-Optimized)
- Collapsible member cards — tap to expand full details
- Each card shows: name, status badge, phone number
- Expanded view shows: membership type, coach badge, expiry date, progress bar, and action buttons
- Actions: **Edit**, **View History**, **Renew**, **Send SMS**, **Remove Member**

#### Member History
Full activity log per member showing every admin action taken:
- Member registered
- Membership renewed
- Member info updated
- Coach assigned / changed / removed
- Payment approved or rejected

---

### 3. Membership Plans

Standard plans available:
| Plan | Duration |
|---|---|
| Monthly | 1 month |
| Quarterly | 3 months |
| Semi-Annual | 6 months |
| Annual | 12 months |
| Student | 30 days |

**Special Promos** — Admin can create custom promotional plans (e.g., "Anniversary Promo") with a custom price and duration in days. Promos can be activated or deactivated at any time.

---

### 4. GCash Payments (Member Renewal)

Members can submit GCash renewal requests directly from the Member Portal without contacting the gym.

**Member flow:**
1. Member opens Member Portal and looks up their account
2. If membership is expiring or expired, a "Renew via GCash" button appears
3. Member selects a plan, sends payment to the gym's GCash number, and submits their reference number or receipt photo
4. Request is sent to the admin for review

**Admin flow:**
1. Admin sees pending requests in the **Renewal Requests** page
2. Admin reviews the reference number and receipt
3. Admin clicks **Approve** (membership is automatically updated) or **Reject** (with a reason)

**Telegram Notifications** — When a member submits a payment, the admin immediately receives a Telegram message with the member's name, plan, amount, and a direct link to review and approve/reject.

---

### 5. Attendance

#### Member Check-In (Front Desk)
- Staff search for a member by name or phone number
- Click **Check In** to record their gym visit with timestamp
- Prevents duplicate check-ins (shows "Already checked in" if done today)
- Shows membership status (active/expiring/expired) so staff can flag issues at the door

#### Attendance Logs (Admin)
- Browse attendance records by date (navigate day by day)
- See member name, photo, and exact check-in time
- Shows total check-ins for the selected day

---

### 6. Coach / Instructor Management

Admins manage coaches from the **Instructors** page:

- Add coaches with name, specialty, contact number, email, bio, and photo
- Set a unique **access code** per coach (used to log into the Coach Portal)
- Copy the coach's portal link with one tap to share with them
- Activate or deactivate coaches
- See how many members are assigned to each coach

---

### 7. Activity Logs

A complete audit trail of all admin actions in the system:
- Who did what and when
- Filtered view of the latest 200 actions
- Actions include: member registration, renewal, edits, deletions, payment approvals, coach assignments

---

### 8. Settings

Configurable options for the gym:

| Setting | Description |
|---|---|
| **Gym Name** | Displayed in the app navbar and member portal |
| **Membership Prices** | Set prices for Monthly, Quarterly, Semi-Annual, Annual, and Student plans |
| **GCash Number & Name** | The GCash account members send payments to |
| **GCash QR Code** | Upload a QR code image for members to scan |
| **Coaching Packages** | Create packages with name, price, and duration (e.g., "1 Session", "5 Sessions", "1 Month") |
| **Special Promos** | Create/manage promotional membership plans |
| **Telegram Bot** | Connect a Telegram bot to receive payment notifications |
| **Site URL** | Used in Telegram notification deep links |

---

## Coach Portal

Coaches access their own private portal at `/coach` using their access code — no password sharing required.

### What Coaches Can Do

- **View their active members** — members currently assigned to them with active coaching subscriptions
- **View past members** — members whose coaching subscription has expired (collapsible section)
- **Open a member's profile** to add and manage:
  - **Notes** — general coaching notes for the member
  - **Workout Program** — structured workout plans
  - **Meal Plan** — nutrition and diet plans
- Each entry can have a title and detailed content, and can be edited or deleted

---

## Member Portal

Members access their own portal at `/member` — no account or password needed, just their registered phone number.

### What Members Can See

**Membership Status**
- Active, Expiring Soon, or Expired status with a color-coded banner
- Days remaining (or days overdue)
- Membership plan and date range with a visual progress bar

**GCash Renewal**
- If membership is expiring or expired, a "Renew via GCash" button appears
- Member selects a plan, enters GCash reference number or uploads a receipt screenshot, and submits

**Coaching Subscription**
- Shows the coaching package name and days remaining
- When coaching expires, it automatically moves to history — no manual action needed
- If coaching has ended, the coach is shown as "Previous Coach" with an "Ended" label

**Coach Programs**
- Member can view Notes, Workout Program, and Meal Plan entries added by their coach
- Programs remain accessible even after coaching subscription expires

**Coaching History**
- A collapsible section showing all past coaches with their package and date range
- Updated automatically when a new coach is assigned

**Session Persistence**
- If the member refreshes the page, they stay on their result screen (no need to re-enter their phone number)
- Session clears automatically when the browser tab is closed

---

## Key Technical Notes (for IT reference)

| Item | Detail |
|---|---|
| **Platform** | Web app — works on any device, no installation needed |
| **Hosting** | Vercel (auto-deploys on every code update) |
| **Database** | Supabase (PostgreSQL) — real-time data sync |
| **Photo Storage** | Supabase Storage |
| **Payments** | GCash only (manual verification by admin) |
| **Notifications** | Telegram bot for payment alerts |
| **Data Export** | Excel (.xlsx) export of member list |
| **Backup** | JSON full-data backup with restore support |

---

## Feature Summary Table

| Feature | Admin | Coach | Member |
|---|:---:|:---:|:---:|
| Dashboard & Statistics | ✅ | — | — |
| Register / Edit Members | ✅ | — | — |
| Member List (with search) | ✅ | — | — |
| Member History / Audit Log | ✅ | — | — |
| Renew Membership | ✅ | — | — |
| GCash Payment Approval | ✅ | — | — |
| GCash Payment Submission | — | — | ✅ |
| SMS Notifications | ✅ | — | — |
| Telegram Notifications | ✅ | — | — |
| Attendance Check-In | ✅ | — | — |
| Attendance Logs | ✅ | — | — |
| Manage Coaches | ✅ | — | — |
| View Assigned Members | — | ✅ | — |
| Add Notes / Workout / Meal Plan | — | ✅ | — |
| View Coaching Programs | — | — | ✅ |
| View Membership Status | — | — | ✅ |
| View Coaching Subscription | — | — | ✅ |
| Coaching History | — | ✅ | ✅ |
| Settings & Pricing | ✅ | — | — |
| Export to Excel | ✅ | — | — |
| Backup & Restore | ✅ | — | — |

---

*Power Fitness Gym Management System — Built for Power Fitness Gym, Toril, Davao City*
