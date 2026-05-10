# AcademiKan — AI-Powered Kanban Academic Project Tracker

A full-stack SaaS application for universities to manage academic projects using Kanban boards and AI.

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: MongoDB (Atlas)
- **Auth**: JWT (Role-based: Student, Faculty, Admin)
- **AI**: OpenAI GPT-3.5
- **Payments**: Stripe
- **Drag & Drop**: @hello-pangea/dnd

---

## Project Structure

```
kanban-academic/
├── backend/
│   ├── controllers/     # Business logic
│   ├── middleware/      # Auth, upload
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routes
│   ├── jobs/            # Cron jobs (deadline reminders)
│   ├── uploads/         # File uploads (auto-created)
│   └── server.js
└── frontend/
    └── src/
        ├── components/  # Reusable UI
        ├── context/     # Auth context
        ├── pages/       # Route pages
        └── services/    # API calls
```

---

## Local Setup

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Backend Environment

Copy `.env.example` to `.env` and fill in:

```bash
cp backend/.env.example backend/.env
```

Required values:
- `MONGO_URI` — MongoDB Atlas connection string
- `JWT_SECRET` — any random secret string
- `OPENAI_API_KEY` — from https://platform.openai.com
- `STRIPE_SECRET_KEY` — from https://dashboard.stripe.com
- `STRIPE_WEBHOOK_SECRET` — from Stripe CLI or dashboard
- `CLIENT_URL` — http://localhost:3000

### 3. Create uploads folder

```bash
mkdir backend/uploads
```

### 4. Run Development Servers

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

App runs at: http://localhost:3000
API runs at: http://localhost:5000

---

## Seed Demo Users (optional)

Create these manually via the register page or MongoDB:
- admin@demo.com / password123 (role: admin)
- faculty@demo.com / password123 (role: faculty)
- student@demo.com / password123 (role: student)

---

## API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/register | Public | Register user |
| POST | /api/auth/login | Public | Login |
| GET | /api/auth/me | JWT | Get current user |
| GET | /api/projects | JWT | List projects |
| POST | /api/projects | Student | Create project |
| PUT | /api/projects/:id/approve | Faculty/Admin | Approve project |
| GET | /api/tasks/project/:id | JWT | Get tasks |
| POST | /api/tasks/project/:id | JWT | Create task |
| PUT | /api/tasks/reorder | JWT | Drag & drop reorder |
| GET | /api/ai/suggest/:projectId | Premium | AI task suggestions |
| GET | /api/ai/risk/:projectId | Premium | Deadline risk |
| POST | /api/ai/generate-doc | Premium | Generate SRS/Abstract |
| GET | /api/analytics/dashboard | JWT | Dashboard stats |
| GET | /api/users | Admin | List all users |
| POST | /api/subscriptions/checkout | JWT | Stripe checkout |

---

## Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build
# Deploy dist/ to Vercel
# Set env: VITE_API_URL (if not using proxy)
```

Or connect GitHub repo to Vercel and set root directory to `frontend`.

### Backend → Render / Railway

1. Push to GitHub
2. Create new Web Service on Render
3. Set root directory: `backend`
4. Build command: `npm install`
5. Start command: `node server.js`
6. Add all environment variables from `.env`

### Database → MongoDB Atlas

1. Create free cluster at https://cloud.mongodb.com
2. Create database user
3. Whitelist IP (0.0.0.0/0 for cloud deploy)
4. Copy connection string to `MONGO_URI`

### Stripe Webhooks (Production)

```bash
stripe listen --forward-to https://your-backend.render.com/api/subscriptions/webhook
```

Or configure in Stripe Dashboard → Webhooks → Add endpoint.

---

## Features by Role

| Feature | Student | Faculty | Admin |
|---------|---------|---------|-------|
| Create projects | ✅ | ❌ | ✅ |
| Kanban board | ✅ | View | View |
| Approve projects | ❌ | ✅ | ✅ |
| AI features | Premium | Premium | Premium |
| User management | ❌ | ❌ | ✅ |
| Analytics | Basic | Basic | Full |
| Comments | ✅ | ✅ | ✅ |

---

## Premium vs Free

| Feature | Free | Premium |
|---------|------|---------|
| Projects | 3 max | Unlimited |
| AI task suggestions | ❌ | ✅ |
| Deadline risk AI | ❌ | ✅ |
| Document generation | ❌ | ✅ |
| File uploads | ❌ | ✅ |
| Advanced analytics | ❌ | ✅ |
