# Star Progress

A gamified activity-tracking competition platform for students. Participants submit activities for admin approval and earn points, badges, avatar rewards, and streak bonuses. Built with React 19 + Vite + TypeScript + Tailwind CSS + Supabase.

## Features

- Role-based access: admin and participant views
- Activity submission and approval workflow
- Points system with badges and leaderboard
- Daily top-performer streak tracking with bonus rewards
- Customizable animal avatar with accessories and color themes
- Arabic/English i18n with RTL support
- Supabase backend (falls back to localStorage in demo mode)

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install & run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Other scripts

```bash
npm run build       # Production build
npm run test        # Run unit tests
npm run lint        # ESLint check
npm run typecheck   # TypeScript check
```

## Configuration

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> Only the anon (public) key belongs here. **Never put the service role key in frontend code.**

If either variable is left empty, the app runs in **localStorage demo mode** — all data is stored in the browser only, not shared between devices, and will be lost on clear. Demo mode is **not suitable for production**.

## Demo Credentials

> These accounts exist for testing only. **Change all passwords before any real deployment.**

| Role    | Email                  | Password   |
|---------|------------------------|------------|
| Admin   | admin@demo.com         | Admin123!  |
| Admin   | superadmin@demo.com    | Super123!  |
| Student | student1@demo.com      | Student1!  |
| Student | student2@demo.com      | Student2!  |

## Security Notes

- Passwords are hashed with a simple demo hash — **not bcrypt**. Do not use in production without replacing the auth layer.
- Demo credentials above are for testing only and are displayed in the app solely in demo mode.
- The Resend email API key (if used) must only be placed in server-side code or Supabase Edge Functions, never in frontend environment variables.
- `dist/` and `.env` are excluded from version control via `.gitignore`.
