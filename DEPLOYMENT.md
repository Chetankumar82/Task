# 🚀 Production Deployment Guide
**Hairdrama Tech — Full-Stack Task Management Platform**

This guide provides end-to-end instructions for deploying the entire application to production using industry best practices.

---

## 🏗 Deployment Architecture

```text
┌────────────────────────────┐          ┌────────────────────────────┐
│   Frontend (Next.js 15)    │          │     Backend (Flask API)    │
│      Hosted on Vercel      │ ───────> │  Hosted on Render/Railway  │
│  https://app.yourdomain.com │  HTTPS   │  https://api.yourdomain.com│
└─────────────┬──────────────┘          └─────────────┬──────────────┘
              │                                       │
              │ OAuth                                 │ Connection Pool
              ▼                                       ▼
┌────────────────────────────┐          ┌────────────────────────────┐
│     Supabase Auth & DB     │          │         Gmail SMTP         │
│     (PostgreSQL + RLS)     │          │    smtp.gmail.com:587      │
│  https://xyz.supabase.co   │          │ (Automated Task Alerts)    │
└────────────────────────────┘          └────────────────────────────┘
```

---

## 📋 Table of Contents
1. [Phase 1: Database Setup (Supabase)](#phase-1-database-setup-supabase)
2. [Phase 2: Google OAuth 2.0 Credentials](#phase-2-google-oauth-20-credentials)
3. [Phase 3: Gmail SMTP Setup](#phase-3-gmail-smtp-setup)
4. [Phase 4: Backend Deployment (Render or Railway)](#phase-4-backend-deployment-render-or-railway)
5. [Phase 5: Frontend Deployment (Vercel)](#phase-5-frontend-deployment-vercel)
6. [Phase 6: Environment Variables Reference](#phase-6-environment-variables-reference)
7. [Phase 7: Verification & Smoke Test Checklist](#phase-7-verification--smoke-test-checklist)
8. [Troubleshooting & Gotchas](#troubleshooting--gotchas)

---

## Phase 1: Database Setup (Supabase)

1. Sign up or log in at [supabase.com](https://supabase.com).
2. Click **New Project** and configure:
   - **Name**: `Hairdrama-Task-DB`
   - **Database Password**: Generate and save a strong password securely.
   - **Region**: Choose the region closest to your users/backend (e.g., `us-east-1` or `eu-central-1`).
3. Open the **SQL Editor** in the Supabase Dashboard:
   - Paste and run [`migrations/001_initial_schema.sql`](./migrations/001_initial_schema.sql).
   - *(Optional for demo accounts)*: Run [`migrations/002_seed_data.sql`](./migrations/002_seed_data.sql).
4. Collect the following keys from **Project Settings -> API**:
   - `Project URL`: (e.g. `https://nrdgqzkmcuoorpeukghm.supabase.co`)
   - `anon / public key`: Used by Frontend.
   - `service_role key`: Used by Flask Backend.
5. Collect the Database Connection String from **Project Settings -> Database -> Connection string -> URI**:
   - Mode: **Session (port 5432)** or **Transaction (port 6543)**.
   - Example: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres`

---

## Phase 2: Google OAuth 2.0 Credentials

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project (e.g. `Hairdrama-Tasks`).
3. Navigate to **APIs & Services -> OAuth consent screen**:
   - User Type: **External**.
   - App Name: `Hairdrama Tech Workspace`.
   - Support email: Your email.
   - Scopes: Select `userinfo.email`, `userinfo.profile`, `openid`.
4. Navigate to **APIs & Services -> Credentials -> Create Credentials -> OAuth client ID**:
   - Application type: **Web application**.
   - Name: `Hairdrama Web Client`.
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for local dev)
     - `https://<YOUR-FRONTEND-APP>.vercel.app` (your production frontend)
   - **Authorized redirect URIs**:
     - `https://<YOUR-SUPABASE-PROJECT-REF>.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback`
     - `https://<YOUR-FRONTEND-APP>.vercel.app/auth/callback`
5. Copy the generated **Client ID** and **Client Secret**.
6. In Supabase Dashboard:
   - Navigate to **Authentication -> Providers -> Google**.
   - Toggle **Enable Google provider**.
   - Paste **Client ID** and **Client Secret**.
   - Click **Save**.

---

## Phase 3: Gmail SMTP Setup

Automated task assignment and completion emails require a Google App Password:

1. Go to your [Google Account Security Settings](https://myaccount.google.com/security).
2. Ensure **2-Step Verification** is turned **ON**.
3. Under Search or Security menu, search for **App passwords**.
4. Create a new App Password:
   - Name: `Hairdrama Task Manager`.
5. Copy the generated 16-character code (e.g., `abcd efgh ijkl mnop`).
6. This 16-character code will be your `GMAIL_APP_PASSWORD`.

---

## Phase 4: Backend Deployment (Render or Railway)

### Option A: Deploy to Render (Recommended Free/Easy Tier)

1. Sign up at [render.com](https://render.com) and link your GitHub account.
2. Click **New +** -> **Web Service**.
3. Select your repository (`Task`).
4. Configure the Web Service:
   - **Name**: `hairdrama-task-api`
   - **Region**: Same region as your Supabase database.
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**:
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command**:
     ```bash
     gunicorn run:app --bind 0.0.0.0:$PORT --workers 2 --threads 4 --timeout 120
     ```
5. In the **Environment Variables** section, add:
   ```env
   FLASK_ENV=production
   SECRET_KEY=generate_a_random_32_byte_hex_string
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres?sslmode=require
   SUPABASE_URL=https://[YOUR-PROJECT].supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   GMAIL_USER=your_email@gmail.com
   GMAIL_APP_PASSWORD=your_16_char_app_password
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   CORS_ORIGIN=https://<your-frontend-domain>.vercel.app
   ```
6. Click **Create Web Service**.
7. Once deployed, test the health check endpoint:
   `https://hairdrama-task-api.onrender.com/api/health`

---

### Option B: Deploy to Railway

1. Sign up at [railway.app](https://railway.app).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. In Project Settings, set **Root Directory** to `/backend`.
4. Set **Start Command**: `gunicorn run:app --bind 0.0.0.0:$PORT --workers 2 --threads 4`.
5. Add the environment variables listed above.
6. Generate a public domain under **Settings -> Networking -> Public Networking**.

---

## Phase 5: Frontend Deployment (Vercel)

Next.js 15 is built and optimized for deployment on Vercel:

1. Sign up or log in at [vercel.com](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository (`Task`).
4. Configure the Project:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click edit and select `frontend`.
   - **Build Command**: `next build` (default)
   - **Output Directory**: `.next` (default)
5. Under **Environment Variables**, add:
   ```env
   NEXT_PUBLIC_API_URL=https://hairdrama-task-api.onrender.com/api
   NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
6. Click **Deploy**.
7. Vercel will build the static and server-rendered pages and provide your live URL (e.g. `https://task-frontend.vercel.app`).
8. **Final Step**: Copy your Vercel URL and update:
   - In Render/Railway: `CORS_ORIGIN=https://task-frontend.vercel.app`
   - In Supabase Auth -> URL Configuration: Add `https://task-frontend.vercel.app` to **Site URL** and **Redirect URLs**.
   - In Google Cloud Console: Add `https://task-frontend.vercel.app` to **Authorized JavaScript Origins** and `https://task-frontend.vercel.app/auth/callback` to **Authorized redirect URIs**.

---

## Phase 6: Environment Variables Reference

### Frontend (`frontend/.env.local`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Base URL of deployed Flask API (with `/api`) | `https://api.yourdomain.com/api` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase anonymous API key | `eyJhbGciOi...` |

### Backend (`backend/.env`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `FLASK_ENV` | Application environment mode | `production` |
| `SECRET_KEY` | Cryptographic secret for sessions/tokens | `e83f09...` (32+ chars) |
| `DATABASE_URL` | Direct PostgreSQL connection string | `postgresql://postgres:...@...:5432/postgres?sslmode=require` |
| `SUPABASE_URL` | Supabase project URL | `https://xyz.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for administrative DB tasks | `eyJhbGciOi...` |
| `GMAIL_USER` | Gmail address for SMTP dispatches | `developer@gmail.com` |
| `GMAIL_APP_PASSWORD` | 16-character Google App Password | `abcd efgh ijkl mnop` |
| `SMTP_SERVER` | SMTP host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port with TLS | `587` |
| `CORS_ORIGIN` | Allowed Frontend URL (or comma-separated URLs) | `https://your-frontend.vercel.app` |

---

## Phase 7: Verification & Smoke Test Checklist

Once both services are deployed, perform these verification checks:

- [ ] **1. API Health Check**:
  Visit `https://<YOUR-API-DOMAIN>/api/health` and verify:
  ```json
  {
    "database": { "connected": true, "type": "supabase_postgresql" },
    "email_service": { "configured": true, "provider": "gmail_smtp" },
    "status": "healthy"
  }
  ```
- [ ] **2. Google OAuth Authentication**:
  - Click **Sign In with Google** on the frontend.
  - Verify redirection to Google Account selector and successful callback to `/auth/callback`.
  - Verify user avatar and name appear in the dashboard header.
- [ ] **3. User Synchronization**:
  - Verify the logged-in user profile is created in `public.profiles` table in Supabase.
- [ ] **4. Create Task & Assign**:
  - Open **Create Task** modal.
  - Assign the task to another team member or test account.
  - Verify task appears in the **Pending** column on the Kanban board.
  - Verify the assignee receives a formatted email notification in Gmail.
- [ ] **5. Move Task & Complete**:
  - Drag or click to change status: `Pending` -> `In Progress` -> `Completed`.
  - Verify the creator and assignee receive the completion email.
- [ ] **6. Mobile Responsiveness**:
  - Open site on mobile or DevTools device simulator.
  - Test the slide-over sidebar drawer and horizontal swipe on Kanban columns.

---

## Troubleshooting & Gotchas

### 1. CORS Errors (`Cross-Origin Request Blocked`)
- **Cause**: The `CORS_ORIGIN` environment variable on the backend does not match your Vercel URL.
- **Fix**: In your backend host (Render/Railway), update `CORS_ORIGIN` to match your exact Vercel domain (including `https://` without a trailing slash).

### 2. Google OAuth Redirect Mismatch (`redirect_uri_mismatch`)
- **Cause**: Google Cloud Console does not recognize the callback URL.
- **Fix**: Ensure `https://<YOUR-SUPABASE-REF>.supabase.co/auth/v1/callback` and `https://<YOUR-VERCEL-DOMAIN>/auth/callback` are added to **Authorized redirect URIs** in Google Cloud Console.

### 3. Gmail `535 5.7.8 Username and Password not accepted`
- **Cause**: Using your normal Google account password instead of an App Password, or 2FA is disabled.
- **Fix**: Generate a fresh 16-character App Password at `myaccount.google.com/apppasswords`. Remove all spaces when pasting into `GMAIL_APP_PASSWORD`.

### 4. Render Cold Start Delay
- **Note**: On Render's free tier, the web service spins down after 15 minutes of inactivity. The first request may take 30–50 seconds to wake up. Use a paid instance or an uptime ping (like UptimeRobot) if you need instant response times.
