# Hairdrama Tech - Task Management & Collaboration Platform

> **Tech Internship Assignment for Hairdrama Tech**  
> A production-ready, full-stack collaborative task management application featuring **Google OAuth 2.0**, **Supabase PostgreSQL**, **Flask REST API**, **Next.js 15 + TypeScript**, and asynchronous **Gmail SMTP email notifications**.

---

## 🏛 System Architecture

The application adopts a decoupled microservice-ready architecture separating the presentation layer (Next.js), relational persistence layer (Supabase PostgreSQL), server-side business logic & email dispatcher (Flask), and authentication provider (Google OAuth via Supabase Auth).

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
            | SMTP TLS (Port 587)
            v
+----------------------------------------------------+
|               Gmail SMTP Gateway                   |
|   - Task Created: Sent to Assignee                 |
|   - Task Completed: Sent to Creator & Assignee     |
+----------------------------------------------------+
```

### Architecture Data Flow:
1. **Authentication Flow**:
   - The user clicks **Continue with Google** on the Next.js frontend.
   - Supabase initiates OAuth 2.0 with Google.
   - Upon consent, Google returns user identity metadata (Gmail address, name, avatar).
   - A PostgreSQL trigger (`on_auth_user_created`) in Supabase automatically upserts the user into the `public.profiles` table.
   - Supabase returns a cryptographically signed JWT access token.
2. **API Interaction & Authorization Flow**:
   - All client calls to the Flask backend pass `Authorization: Bearer <access_token>`.
   - The Flask `@require_auth` decorator validates the token, extracts the authenticated user (`g.current_user`), and enforces permissions.
3. **Email Notification Flow**:
   - When a task is created and assigned to another user, Flask triggers `GmailService.notify_task_created()` in a non-blocking background thread (`ThreadPoolExecutor`).
   - The assignee receives a responsive, branded HTML email detailing the task, priority, and link.
   - When the task is updated to `completed`, `GmailService.notify_task_completed()` dispatches completion alert emails to both the task creator and the assignee.

---

## 🚀 Key Features

| Feature | Description |
| :--- | :--- |
| **Google OAuth 2.0** | Secure login using Gmail accounts via Supabase Auth with automatic profile provisioning. |
| **Collaborative Task Management** | Create, view, update, and delete tasks with priorities (`urgent`, `high`, `medium`, `low`) and due dates. |
| **User Assignment** | Dynamic assignee selector populated with registered Gmail team members. |
| **Dual View Modes** | **Kanban Board** (with drag/click progression across Pending, In Progress, Completed) and **Table List View**. |
| **Automated Gmail Integration** | Asynchronous email notifications on task creation (to assignee) and task completion (to creator & assignee). |
| **Dashboard Analytics** | Real-time overview metrics: Total Tasks, Pending, In Progress, Completed, and Assigned to Me with progress bar. |
| **Luxury Glassmorphism UI** | Designed with modern typography, dark obsidian theme, micro-animations, and toast banners. |
| **Reviewer Fast-Track** | Built-in account switcher for interviewers to test multi-user collaboration and assignment without setup friction. |

---

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Lucide Icons, Modern Vanilla CSS / Tailwind tokens.
- **Backend**: Python 3.11+, Flask 3.1, Gunicorn (WSGI), PyJWT, Requests, Flask-CORS.
- **Database**: Supabase (PostgreSQL 15), Row Level Security (RLS), Automated Triggers, Foreign Keys, B-Tree Indexes.
- **Email Service**: Gmail SMTP (`smtp.gmail.com:587` with STARTTLS) via Python `smtplib` and `ThreadPoolExecutor`.
- **Deployment**: Vercel (Frontend), Render / Railway (Backend), Supabase Cloud (Database).

---

## 📁 Repository Structure

```
├── .env.example                     # Root environment configuration example
├── .gitignore                       # Git ignore rules for Python & Node
├── README.md                        # Complete documentation & architecture guide
│
├── migrations/                      # PostgreSQL migrations
│   ├── 001_initial_schema.sql       # Profiles, tasks, triggers, RLS policies, indexes
│   └── 002_seed_data.sql            # Seed data & joined detailed view
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
│   │   └── test_app.py              # Automated unit and integration test suite
│   ├── requirements.txt             # Python dependencies
│   ├── run.py                       # Development and production WSGI entrypoint
│   ├── Procfile                     # Railway / Render web process definition
│   ├── runtime.txt                  # Python runtime specification
│   └── .env.example                 # Backend environment variable template
│
└── frontend/                        # Next.js 15 TypeScript Frontend
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx           # Global RootLayout with ToastProvider
    │   │   ├── page.tsx             # Main Dashboard, Kanban Board & Filters
    │   │   ├── globals.css          # Design system, glassmorphism, animations
    │   │   └── auth/callback/
    │   │       └── page.tsx         # OAuth redirect handler & profile sync
    │   ├── components/
    │   │   ├── Navbar.tsx           # Navigation, user switcher, health diagnostics
    │   │   ├── StatsCards.tsx       # Metrics summary cards with completion rate
    │   │   ├── TaskFilters.tsx      # Search, scope, priority, and view toggle
    │   │   ├── TaskCard.tsx         # Interactive task card with quick actions
    │   │   ├── KanbanBoard.tsx      # 3-column Kanban board
    │   │   ├── TaskListView.tsx     # Table list view
    │   │   ├── TaskModal.tsx        # Task creation/editing modal with assignee selector
    │   │   ├── LoginModal.tsx       # Google OAuth login and reviewer accounts
    │   │   └── Toast.tsx            # Real-time alert notifications
    │   └── lib/
    │       ├── types.ts             # TypeScript interfaces
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
- **Python**: v3.10+
- **Git**

### 1. Clone & Set Up Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv

# On Windows:
.\.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend test suite
python -m unittest tests/test_app.py

# Start Flask development server
python run.py
```
> The Flask API will start on **`http://127.0.0.1:5000`**.

---

### 2. Set Up Frontend

In a separate terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev -- -p 3000
```
> Open **`http://localhost:3000`** in your browser to explore the application!

---

## 🗄 Database Setup (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Paste and run the contents of [`migrations/001_initial_schema.sql`](./migrations/001_initial_schema.sql).
4. (Optional) Run [`migrations/002_seed_data.sql`](./migrations/002_seed_data.sql) to add sample views.
5. In **Project Settings -> API**, copy:
   - `Project URL`
   - `anon / public` key
   - `service_role` key
   - `JWT Secret`

---

## 🔐 Google OAuth 2.0 Configuration

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., `Hairdrama-Task-Manager`).
3. Under **APIs & Services -> OAuth consent screen**:
   - Choose **External**.
   - Add App Name (`Hairdrama Tasks`) and User Support Email.
   - Add scopes: `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`.
4. Under **Credentials -> Create Credentials -> OAuth client ID**:
   - Application type: **Web application**.
   - Authorized redirect URIs:
     - Add: `https://<YOUR-SUPABASE-PROJECT-REF>.supabase.co/auth/v1/callback`
5. Copy the **Client ID** and **Client Secret**.
6. Open your Supabase Dashboard:
   - Go to **Authentication -> Providers -> Google**.
   - Enable Google, paste the Client ID and Client Secret, and click **Save**.

---

## 📧 Gmail SMTP Integration (App Password)

To send real automated emails on task creation and completion:

1. Go to your [Google Account Security Settings](https://myaccount.google.com/security).
2. Enable **2-Step Verification** if not already enabled.
3. Search for **App Passwords** (or navigate to Security -> 2-Step Verification -> App Passwords).
4. Generate an App Password with name `Hairdrama Tasks`.
5. Copy the 16-character code (e.g., `abcd efgh ijkl mnop`).
6. In `backend/.env`, set:
   ```env
   GMAIL_USER=your.gmail.address@gmail.com
   GMAIL_APP_PASSWORD=abcdefghijklmnop
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   ```
*(Note: If credentials are not set during local testing, the application gracefully prints a formatted email dispatch preview to the console without interrupting execution).*

---

## 🚢 Production Deployment Guide

### A. Deploy Frontend to Vercel
1. Push your repository to GitHub.
2. Sign in to [Vercel](https://vercel.com) and click **Add New Project**.
3. Select the repository and set the **Root Directory** to `frontend`.
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL`: Your deployed Flask API URL (e.g. `https://hairdrama-api.onrender.com`)
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key
5. Click **Deploy**. Vercel will build and assign your production URL.

### B. Deploy Backend to Render or Railway
#### Deploying to Render:
1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your GitHub repository and set **Root Directory** to `backend`.
3. Set **Build Command**: `pip install -r requirements.txt`.
4. Set **Start Command**: `gunicorn run:app --bind 0.0.0.0:$PORT --workers 2 --threads 4`.
5. Add Environment Variables:
   - `SECRET_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`
   - `GMAIL_USER`, `GMAIL_APP_PASSWORD`
   - `FRONTEND_URL`: Your Vercel frontend URL
   - `ALLOWED_ORIGINS`: Your Vercel frontend URL
6. Click **Create Web Service**.

---

## 🧪 Testing

The backend includes a comprehensive automated test suite testing health diagnostics, authentication verification, task lifecycle, email dispatch triggers, user filtering, and deletion permissions:

```bash
cd backend
python -m unittest tests/test_app.py
```
Expected output:
```
Ran 7 tests in 0.116s
OK
```

Frontend production build validation:
```bash
cd frontend
npm run build
```

---

## 📜 Interview & Video Submission Checklist

- [x] Users can create accounts and login using Google OAuth (`/auth/callback` & Supabase Auth).
- [x] Users can create tasks with priority, due date, title, and description.
- [x] Users can assign tasks to other registered Gmail users.
- [x] Automated email notifications sent via Gmail SMTP on task creation (to assignee).
- [x] Automated email notifications sent via Gmail SMTP on task completion (to creator & assignee).
- [x] Database: Supabase PostgreSQL with schema migrations in `/migrations`.
- [x] Backend: Flask with modular blueprints, CORS, and JWT authentication.
- [x] Frontend: Next.js 15 + TypeScript with Kanban board, list view, and glassmorphism styling.
- [x] Clean commit history, `.env.example`, and architectural documentation.

