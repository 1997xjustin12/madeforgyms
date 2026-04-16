# Power Fitness Gym — Management System Documentation

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Features](#3-features)
4. [Prerequisites](#4-prerequisites)
5. [Local Development Setup](#5-local-development-setup)
6. [Supabase Setup](#6-supabase-setup)
7. [Environment Variables](#7-environment-variables)
8. [Deploying to Vercel](#8-deploying-to-vercel)
9. [Admin Guide](#9-admin-guide)
10. [Member Portal Guide](#10-member-portal-guide)
11. [Project Structure](#11-project-structure)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Project Overview

Power Fitness Gym Management System is a web application that allows gym administrators to manage member registrations, track membership statuses, and notify members about expiring memberships. Members can also check their own membership status through a self-service portal.

The app is fully responsive — works on both mobile phones and desktop computers.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Database | Supabase (PostgreSQL) |
| File Storage | Supabase Storage |
| Hosting | Vercel (Free) |
| Icons | Lucide React |
| Notifications | React Hot Toast |

---

## 3. Features

### Admin Portal
- Register new gym members (name, contact number, photo)
- Take member photo directly using the device camera (front/back camera support)
- Set membership plan: 1 Month, 3 Months, 6 Months, or 1 Year
- Edit member information and renew membership start date
- Delete members
- Dashboard showing total, active, expiring, and expired member counts
- **Alert banner** that prominently highlights members expiring within 5 days
- Send SMS notification to members with near-expiring memberships
- Search and filter members by name, contact number, or status

### Member Portal
- No login required
- Search membership status by name or contact number
- View membership plan, start date, end date, and days remaining
- Visual status indicator: Active, Expiring Soon, or Expired

---

## 4. Prerequisites

Make sure the following are installed on your computer before starting:

- **Node.js** (version 18 or higher) — https://nodejs.org
- **Git** — https://git-scm.com
- **A code editor** (VS Code recommended) — https://code.visualstudio.com
- **A GitHub account** — https://github.com
- **A Supabase account** (free) — https://supabase.com
- **A Vercel account** (free) — https://vercel.com

---

## 5. Local Development Setup

### Step 1 — Clone the Repository

Open a terminal and run:

```bash
git clone https://github.com/1997xjustin12/gym-management.git
cd gym-management
```

### Step 2 — Install Dependencies

```bash
npm install
```

### Step 3 — Create Environment File

Create a file named `.env` in the root of the project folder:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> See [Section 6](#6-supabase-setup) to get these values from Supabase.

### Step 4 — Start the Development Server

```bash
npm run dev
```

The app will open at **http://localhost:5173**

---

## 6. Supabase Setup

### Step 1 — Create a Supabase Account

Go to https://supabase.com and sign up for a free account.

### Step 2 — Create a New Project

1. Click **New Project**
2. Enter project name (e.g. `Gym Management`)
3. Choose a region — select **Southeast Asia (Singapore)** for best performance in the Philippines
4. Set a strong database password and save it somewhere safe
5. Click **Create new project** and wait for it to finish

### Step 3 — Create the Members Table

1. In the left sidebar, click **SQL Editor**
2. Click **New Query**
3. Paste the following SQL and click **Run**:

```sql
CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  photo_url TEXT,
  membership_type TEXT NOT NULL DEFAULT 'monthly',
  membership_start_date DATE NOT NULL,
  membership_end_date DATE NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_select" ON members FOR SELECT USING (true);
CREATE POLICY "allow_insert" ON members FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update" ON members FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_delete" ON members FOR DELETE USING (true);
```

### Step 4 — Create the Photo Storage Bucket

1. In the left sidebar, click **Storage**
2. Click **New Bucket**
3. Set the name to: `member-photos`
4. Toggle **Public bucket: ON**
5. Click **Create bucket**

### Step 5 — Get Your API Keys

1. In the left sidebar, click **Project Settings** (gear icon)
2. Click **API**
3. Copy the following two values:
   - **Project URL** — looks like `https://xxxxxxxx.supabase.co`
   - **anon public** key — a long string starting with `eyJ...`
4. Paste these into your `.env` file (see [Section 7](#7-environment-variables))

---

## 7. Environment Variables

| Variable | Description | Where to Get It |
|---|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Supabase → Settings → API → anon public |

### Local `.env` file (for development)

Create a file named `.env` in the project root:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> **Important:** Never commit the `.env` file to GitHub. It is already listed in `.gitignore`.

### Vercel Environment Variables (for production)

Add the same variables in Vercel:
1. Go to your project in Vercel
2. Click **Settings** → **Environment Variables**
3. Add both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Click **Save** and redeploy

---

## 8. Deploying to Vercel

### Step 1 — Push Code to GitHub

```bash
git add .
git commit -m "your message"
git push
```

### Step 2 — Import to Vercel

1. Go to https://vercel.com and log in with your GitHub account
2. Click **Add New Project**
3. Find and select the `gym-management` repository
4. Click **Import**

### Step 3 — Add Environment Variables

Before clicking Deploy, scroll down to **Environment Variables** and add:

| Key | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://uubxmbbnslzwupvbxozu.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | your full anon key |

### Step 4 — Deploy

Click **Deploy**. Vercel will automatically:
- Detect the Vite framework
- Run `npm run build`
- Publish the `dist` folder

Your app will be live at a URL like: `https://gym-management-xxxx.vercel.app`

### Step 5 — Automatic Deployments

From now on, every time you push to GitHub (`git push`), Vercel will automatically redeploy the latest version.

---

## 9. Admin Guide

### Logging In

1. Open the app and click **Admin Portal**
2. Enter the admin password: `admin123`

> To change the password, edit line with `admin123` inside `src/context/GymContext.jsx`

### Registering a New Member

1. Go to **Admin Portal** → log in
2. Click **Register Member** or the **Add** button
3. Fill in:
   - **Full Name**
   - **Contact Number** (e.g. 09171234567)
   - **Membership Plan** (1 Month, 3 Months, 6 Months, 1 Year)
   - **Membership Start Date**
   - **Notes** (optional)
4. Click **Take Photo** to capture member photo using camera
5. Click **Register Member** to save

### Renewing a Membership

1. Go to **Members** list
2. Click the **edit (pencil)** icon on the member
3. Click the **Renew** button next to the start date — this sets the start date to today and recalculates the end date
4. Click **Save Changes**

### Viewing Expiring Memberships

The **Dashboard** shows a highlighted orange alert section listing all members whose membership expires within **5 days**. This alert is also visible as a badge on the Members navigation icon.

### Sending SMS Notifications

1. On the **Dashboard** or **Members** list, click the **message icon** next to an expiring member
2. A modal will appear showing the pre-written SMS message
3. Click **Open SMS App** — on mobile this will open your SMS app with the number and message pre-filled
4. Click **Copy Message** to manually copy and paste the message

---

## 10. Member Portal Guide

1. Open the app and click **Member Portal**
2. Type your **name** or **contact number** in the search box
3. Click **Search Membership**
4. Your membership card will show:
   - Your name and photo
   - Status: **Active**, **Expiring Soon**, or **Expired**
   - Membership plan and days remaining
   - Start and end dates

No login or password is needed for the member portal.

---

## 11. Project Structure

```
gym-management/
├── .env                        # Environment variables (not committed to GitHub)
├── .env.example                # Template for environment variables
├── .gitignore                  # Files excluded from GitHub
├── index.html                  # App entry point
├── package.json                # Dependencies
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS configuration
├── supabase-schema.sql         # SQL to set up the database
└── src/
    ├── main.jsx                # React entry point
    ├── App.jsx                 # Routes and loading screen
    ├── index.css               # Global styles
    ├── lib/
    │   └── supabase.js         # Supabase client setup
    ├── context/
    │   └── GymContext.jsx      # Global state and all data operations
    ├── utils/
    │   └── helpers.js          # Date formatting, SMS message builder
    ├── components/
    │   ├── Navbar.jsx          # Top navigation bar
    │   ├── CameraCapture.jsx   # Camera modal for taking photos
    │   ├── StatusBadge.jsx     # Active / Expiring / Expired badge
    │   └── SMSModal.jsx        # SMS preview and send modal
    └── pages/
        ├── Home.jsx            # Landing page
        ├── AdminLogin.jsx      # Admin login page
        ├── AdminDashboard.jsx  # Admin dashboard with alerts
        ├── MembersList.jsx     # Full members list with search/filter
        ├── RegisterMember.jsx  # Register and edit member form
        └── MemberPortal.jsx    # Member self-service status check
```

---

## 12. Troubleshooting

### "new row violates row-level security policy"
Run this SQL in Supabase SQL Editor:
```sql
DROP POLICY IF EXISTS "allow_all" ON members;
CREATE POLICY "allow_select" ON members FOR SELECT USING (true);
CREATE POLICY "allow_insert" ON members FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update" ON members FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_delete" ON members FOR DELETE USING (true);
```

### "Missing Supabase environment variables"
Make sure your `.env` file exists in the project root and contains both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Restart the dev server after creating the file.

### Photos not uploading
Make sure the `member-photos` storage bucket exists in Supabase and is set to **Public**.

### App shows blank page after deploy on Vercel
Check that the environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are added in Vercel → Settings → Environment Variables, then redeploy.

### Camera not working
- Make sure you are accessing the app over **HTTPS** (required for camera access)
- On the device, allow camera permission when prompted
- On desktop, allow camera access in browser settings

---

*Documentation last updated: April 2026*
