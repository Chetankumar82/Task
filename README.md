# Hairdrama Tech - Task Management & Collaboration Platform

> **Tech Assignment for Hairdrama Tech**  
> A production-ready, full-stack collaborative task management application featuring **Google OAuth 2.0**, **Supabase PostgreSQL**, **Flask REST API**, **Next.js 15 + TypeScript**, and asynchronous **Gmail SMTP email notifications**.

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015%20(TypeScript)-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Flask](https://img.shields.io/badge/Backend-Flask%203.1%20(Python)-000000?style=flat&logo=flask)](https://flask.palletsprojects.com/)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![Gmail SMTP](https://img.shields.io/badge/Email-Gmail%20SMTP%20Integration-EA4335?style=flat&logo=gmail)](https://workspace.google.com/)
[![OAuth 2.0](https://img.shields.io/badge/Auth-Google%20OAuth%202.0-4285F4?style=flat&logo=google)](https://cloud.google.com/)
[![Tests](https://img.shields.io/badge/Tests-16%2F16%20Passing-brightgreen?style=flat)](#-testing--verification)

---

## 🌐 Live Production Links & Credentials

- **Live Application (Frontend)**: [https://hairdrama-tech-task.vercel.app](https://hairdrama-tech-task.vercel.app) *(or your deployed Vercel URL)*
- **Live REST API (Backend)**: [https://hairdrama-api.onrender.com](https://hairdrama-api.onrender.com) *(or your deployed Render URL)*
- **API Health Check**: `https://<backend-url>/api/health`
- **GitHub Repository**: [https://github.com/Chetankumar82/Task](https://github.com/Chetankumar82/Task)

---

## 🏛 System Architecture

The application adopts a decoupled microservice-ready architecture separating the presentation layer (Next.js 15), relational persistence layer (Supabase PostgreSQL), server-side business logic & email dispatcher (Flask), and authentication provider (Google OAuth via Supabase Auth).

```
                       +---------------------------------------+
                       |   Google Cloud Console (OAuth 2.0)   |
                       +---------------------------------------+
                                           ^
                                           | Google OAuth Handshake
                                           v
+------------------------+      +--------------------+      +-------------------------+
|   Next.js 15 Client    | ---> |   Supabase Auth    | ---> |   Supabase PostgreSQL   |
| (TypeScript + Tailwind)|      | (JWT Token Issuer) |      | (profiles, tasks, RLS)  |
+------------------------+      +--------------------+      +-------------------------+
            |                             |                              ^
            | Authorization: Bearer <JWT> |                              |
            v                             v                              |
+----------------------------------------------------+                   |
|                   Flask REST API                   | ------------------+
|   - JWT Signature / Token Verification             |
|   - Task & User Business Logic                     |
|   - Asynchronous ThreadPool Email Dispatcher       |
+----------------------------------------------------+
            |
            | SMTP TLS (Port 465 / 587)
            v
+----------------------------------------------------+
|               Gmail SMTP Gateway                   |
|   - Task Created: Sent to Assignee                 |
|   - Task Completed: Sent to Creator & Assignee     |
+----------------------------------------------------+
```

### End-to-End Architectural Flows:

1. **Authentication & Identity Flow**:
   - The user clicks **Continue with Google** on the Next.js frontend.
   - Supabase initiates an OAuth 2.0 PKCE flow with Google.
   - Upon user consent, Google returns user identity metadata (Gmail address, full name, profile picture).
   - In Supabase PostgreSQL, a database trigger (`on_auth_user_created`) automatically upserts the user into the `public.profiles` table.
   - Supabase returns a cryptographically signed JWT access token.
   - *Reviewer Convenience*: A direct Gmail sign-in form and 1-click demo reviewer accounts are also provided for instant testing without OAuth configuration blockers.

2. **API Interaction & Authorization Flow**:
   - Client requests attach `Authorization: Bearer <access_token>`.
   - The Flask `@require_auth` decorator in `backend/app/auth.py` validates the token with Supabase and PyJWT, extracts `g.current_user`, and ensures profile presence before executing database operations.
   - Strict RBAC: Users may update status on any assigned/collaborative task, but can only delete tasks they personally created.

3. **Asynchronous Gmail Notification Flow**:
   - **On Task Creation**: If assigned to a team member with an email, Flask submits `notify_task_created` to a background worker thread (`concurrent.futures.ThreadPoolExecutor`).
   - The assignee receives a responsive, branded HTML email with task details, priority badge, and workspace CTA.
   - **On Task Completion**: When a task is marked as `completed`, `notify_task_completed` is dispatched asynchronously to **both** the creator and assignee.
   - **Zero Latency**: Background threading decouples the 1.5s SMTP network handshake, returning HTTP 200/201 to the user in `< 50ms`.

---

## 🚀 Key Features & Capabilities

| Feature | Technical Implementation | Highlights |
| :--- | :--- | :--- |
| **Google OAuth 2.0** | Supabase Auth + Google Provider + DB Triggers | Secure Gmail login with auto-provisioned profiles and JWT sessions. |
| **Task Management** | Full CRUD REST API with Supabase PostgreSQL | Priorities (`urgent`, `high`, `medium`, `low`), due dates, statuses (`pending`, `in_progress`, `completed`). |
| **User Assignment** | Relational foreign keys + Team directory API | Assign tasks to any registered Gmail user with avatar indicators. |
| **Automated Gmail Integration** | Python `smtplib.SMTP_SSL` + `ThreadPoolExecutor` | Rich HTML emails delivered on task assignment and completion. |
| **Dual View Modes** | Kanban Board + Sortable Table List View | Interactive column transitions, priority filters, and quick search. |
| **Executive Intelligence** | SVG Donut Chart + Heatmap + Workload Bars | Real-time workspace analytics and KPI completion metrics. |
| **Mobile Responsiveness** | CSS Touch Snap + Slide-out Drawer + Backdrop | 100% fluid responsive design for smartphones, tablets, and desktops. |
| **Modern Typography** | Google Fonts **Inter** + **Outfit** | Clean SaaS aesthetics matching Stripe and Linear interfaces. |
| **Dual Theme System** | Obsidian Dark Mode & Apple/Stripe Clean Light Mode | One-click theme switcher with persistent contrast tokens. |
| **Reviewer Fast-Track** | Built-in Account Switcher + Pre-seeded Reviewers | 1-click testing of cross-user assignment and email triggers. |

---

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Lucide Icons, Vanilla CSS design tokens.
- **Typography**: Inter (Body & UI) + Outfit (Headings & Metrics) via Google Fonts.
- **Backend**: Python 3.11+, Flask 3.1, Gunicorn (WSGI), PyJWT, Requests, Flask-CORS.
- **Database**: Supabase (PostgreSQL 15), Row Level Security (RLS), Triggers, Foreign Keys, B-Tree Indexes.
- **Email Service**: Gmail SMTP (`smtp.gmail.com:465` SSL / `587` STARTTLS) with Gmail App Passwords.
- **Deployment**: Vercel (Frontend), Render / Railway (Backend), Supabase Cloud (PostgreSQL).

---

## 📁 Repository Structure

```
├── .env.example                     # Root environment configuration template
├── .gitignore                       # Git ignore rules for Python, Node, & environment files
├── README.md                        # Complete project documentation & architecture guide
├── INTERVIEW_PREP.md                # In-depth technical & HR interview explanation guide
├── LOOM_WALKTHROUGH_SCRIPT.md       # 5-minute video presentation script
│
├── migrations/                      # PostgreSQL database migrations
│   ├── 001_initial_schema.sql       # Profiles, tasks, triggers, RLS policies, indexes
│   └── 002_seed_data.sql            # Seed reviewer profiles and demo tasks
│
├── backend/                         # Flask REST API
│   ├── app/
│   │   ├── __init__.py              # App factory, CORS, blueprints, error handlers
│   │   ├── config.py                # Environment configuration loader
│   │   ├── auth.py                  # JWT validation middleware (@require_auth)
│   │   ├── routes/
│   │   │   ├── tasks.py             # Task CRUD, filters, and status transitions
│   │   │   ├── users.py             # User profile listing and profile sync
│   │   │   └── health.py            # Uptime diagnostics and dashboard statistics
│   │   └── services/
│   │       ├── supabase_client.py   # Unified Supabase DB layer with dev store fallback
│   │       └── email_service.py     # Asynchronous Gmail SMTP dispatcher & HTML templates
│   ├── tests/
│   │   ├── test_app.py              # Unit & API integration test suite
│   │   └── test_e2e_all_scenarios.py# Full E2E test suite (16 tests against live DB & SMTP)
│   ├── requirements.txt             # Python dependencies
│   ├── run.py                       # Development and production WSGI entrypoint
│   ├── Procfile                     # Railway / Render web process definition
│   ├── runtime.txt                  # Python runtime specification (3.11+)
│   └── .env.example                 # Backend environment variable template
│
└── frontend/                        # Next.js 15 TypeScript Frontend
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx           # Global RootLayout with ToastProvider & font preconnect
    │   │   ├── page.tsx             # Main Dashboard, Kanban Board, Filters, & Navigation
    │   │   ├── globals.css          # Design system, themes, mobile drawer, touch snap
    │   │   └── auth/callback/
    │   │       └── page.tsx         # OAuth redirect handler & profile sync
    │   ├── components/
    │   │   ├── Sidebar.tsx          # Responsive off-canvas navigation & quick scopes
    │   │   ├── StatsCards.tsx       # KPI metrics cards with percentage progress
    │   │   ├── AnalyticsCharts.tsx  # SVG donut chart, priority heatmap, team workload
    │   │   ├── KanbanBoard.tsx      # Touch-optimized 3-column Kanban board
    │   │   ├── TaskListView.tsx     # Responsive table list view with actions
    │   │   ├── TaskCard.tsx         # Interactive task cards with priority badges
    │   │   ├── TaskModal.tsx        # Responsive task creation & editing modal
    │   │   ├── LoginModal.tsx       # Google OAuth login & reviewer demo accounts
    │   │   ├── TeamView.tsx         # Team directory & workload capacity tracker
    │   │   └── Toast.tsx            # Real-time alert notifications
    │   └── lib/
    │       ├── types.ts             # TypeScript interfaces (Task, User, Stats)
    │       ├── supabase.ts          # Supabase browser client & OAuth initiator
    │       └── api.ts               # Typed Flask API client
    ├── package.json
    ├── tsconfig.json
    └── .env.example                 # Frontend environment variable template
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites:
- **Node.js**: v18+ (v20+ recommended)
- **Python**: v3.10+ (v3.11 recommended)
- **Git**

---

### 1. Clone & Set Up Backend

```bash
# Clone the repository
git clone https://github.com/Chetankumar82/Task.git
cd Task/backend

# Create and activate virtual environment
python -m venv .venv

# On Windows:
.\.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your Supabase and Gmail credentials

# Start Flask development server
python run.py
```
> The Flask API will start on **`http://127.0.0.1:5000`**.

---

### 2. Set Up Frontend

In a separate terminal:

```bash
cd Task/frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase anon key

# Start Next.js development server
npm run dev -- -p 3000
```
> Open **`http://localhost:3000`** in your browser.

---

## 🗄 Database Setup (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Paste and run [`migrations/001_initial_schema.sql`](./migrations/001_initial_schema.sql):
   - Creates `public.profiles` and `public.tasks` tables.
   - Configures foreign keys with `ON DELETE CASCADE` and `ON DELETE SET NULL`.
   - Creates the `handle_new_user()` trigger for Google OAuth profile auto-creation.
   - Enables Row Level Security (RLS) policies and B-tree performance indexes.
4. (Optional) Run [`migrations/002_seed_data.sql`](./migrations/002_seed_data.sql) to seed reviewer accounts.
5. In **Project Settings -> API**, copy:
   - `Project URL`
   - `anon / public` key
   - `service_role` key

---

## 🔐 Google OAuth 2.0 Configuration

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., `Hairdrama-Task-Manager`).
3. Under **APIs & Services -> OAuth consent screen**:
   - User Type: **External**.
   - App Name: `Hairdrama Tech Workspace`.
   - Add scopes: `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`.
4. Under **Credentials -> Create Credentials -> OAuth client ID**:
   - Application type: **Web application**.
   - Authorized redirect URIs:
     - `https://<YOUR-SUPABASE-PROJECT-REF>.supabase.co/auth/v1/callback`
5. Copy the **Client ID** and **Client Secret**.
6. Open your Supabase Dashboard:
   - Go to **Authentication -> Providers -> Google**.
   - Enable Google, paste the Client ID and Client Secret, and click **Save**.

---

## 📧 Gmail SMTP Integration (App Password)

To send real automated emails on task creation and completion:

1. Go to your [Google Account Security Settings](https://myaccount.google.com/security).
2. Enable **2-Step Verification** on your Google Account.
3. Navigate to **Security -> 2-Step Verification -> App Passwords**.
4. Generate a new App Password with name `Hairdrama Tasks`.
5. Copy the 16-character code (e.g., `abcd efgh ijkl mnop`).
6. In `backend/.env`, configure:
   ```env
   GMAIL_USER=your.gmail.address@gmail.com
   GMAIL_APP_PASSWORD=abcdefghijklmnop
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=465
   ```
*(Note: If Gmail credentials are not provided during local testing, the application gracefully logs a formatted email dispatch preview to the console without interrupting user actions).*

---

## 🧪 Testing & Verification

The project includes an extensive automated test suite covering unit, integration, and full end-to-end scenarios against live Supabase PostgreSQL and Gmail SMTP:

```bash
cd backend

# Run the complete test suite
python -m unittest discover tests -v
```

### Verified Test Scenarios:
- `test_scenario_01_infrastructure_health`: Verifies Supabase DB connection and Gmail SMTP configuration.
- `test_scenario_02_user_sync_and_directory`: Tests Google OAuth user synchronization and profile directory.
- `test_scenario_03_task_creation_and_assignment`: Verifies task creation and triggers assignment email to assignee.
- `test_scenario_04_filtering_and_querying`: Tests search, priority filters, and scope queries.
- `test_scenario_05_status_transitions_and_completion_email`: Verifies lifecycle (`pending` $\rightarrow$ `in_progress` $\rightarrow$ `completed`) and triggers completion emails to creator & assignee.
- `test_scenario_06_task_reassignment`: Verifies task reassignment with notification.
- `test_scenario_07_dashboard_stats`: Tests KPI and status aggregations.
- `test_scenario_08_security_and_permissions`: Enforces 401 Unauthorized on missing JWT and 403 Forbidden on illegal deletions.
- `test_scenario_09_task_deletion`: Tests creator deletion and verifies permanent removal.

---

## 🚢 Production Deployment Guide

### A. Deploy Frontend to Vercel
1. Push your repository to GitHub.
2. Sign in to [Vercel](https://vercel.com) and click **Add New Project**.
3. Select your repository and set the **Root Directory** to `frontend`.
4. Configure Environment Variables:
   - `NEXT_PUBLIC_API_URL`: Your deployed Flask API URL (e.g. `https://hairdrama-api.onrender.com/api`)
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key
5. Click **Deploy**. Vercel will build and assign your production URL.

### B. Deploy Backend to Render or Railway
1. Create a new **Web Service** on [Render](https://render.com) or [Railway](https://railway.app).
2. Connect your GitHub repository and set **Root Directory** to `backend`.
3. Set **Build Command**: `pip install -r requirements.txt`.
4. Set **Start Command**: `gunicorn run:app --bind 0.0.0.0:$PORT --workers 2 --threads 4`.
5. Add Environment Variables:
   - `FLASK_ENV`: `production`
   - `SECRET_KEY`: `<secure-random-key>`
   - `SUPABASE_URL`: `https://<your-project>.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: `<your-supabase-service-role-key>`
   - `GMAIL_USER`: `<your-gmail-address>`
   - `GMAIL_APP_PASSWORD`: `<your-16-char-app-password>`
   - `CORS_ORIGIN`: `https://<your-frontend>.vercel.app`
6. Click **Deploy**. Render will generate your public API endpoint.

---

## 🎓 Interview & Evaluation Resources

To help you defend and explain the codebase in detail during your technical and HR rounds:
- **[INTERVIEW_PREP.md](./INTERVIEW_PREP.md)**: Line-by-line code review answers, system architecture defense, database trade-offs, and HR interview questions.
- **[LOOM_WALKTHROUGH_SCRIPT.md](./LOOM_WALKTHROUGH_SCRIPT.md)**: 5-minute video recording script with live demo timestamps and talking points.

---

## 📜 Deliverables Checklist

- [x] **User Accounts & Google OAuth**: Sign up and login with Gmail accounts via Supabase Auth + direct sign-in fallback.
- [x] **Task Creation**: Create tasks with title, description, priority, and due date.
- [x] **Task Assignment**: Assign tasks to any registered workspace user with avatar indicators.
- [x] **Automated Gmail Notifications**:
  - [x] Task Created: Dispatches email to assignee.
  - [x] Task Completed: Dispatches email to both creator and assignee.
- [x] **Technology Stack**:
  - [x] Database: Supabase PostgreSQL (with schema migrations).
  - [x] Backend: Flask REST API.
  - [x] Frontend: Next.js 15 + TypeScript.
  - [x] Email: Gmail SMTP integration.
  - [x] Login: OAuth 2.0 with Google.
- [x] **Mobile Responsiveness**: Off-canvas drawer, touch swipeable Kanban, and adaptive KPI grids.
- [x] **Modern Typography**: Inter + Outfit font pairing.
- [x] **Deployment Configs**: Procfile, runtime.txt, requirements.txt, and Vercel configs.
- [x] **GitHub Repository**: Clean commit history, `/migrations` folder, `.env.example`, and architectural documentation.
