# JobFlow — AI Job Tracker & Resume Analyzer

A modern full-stack application to track job applications and get AI-powered resume feedback.

## Features

- **Job Tracking** — Add, edit, delete, and track job applications (Applied, Interview, Offer, Rejected)
- **AI Resume Review** — Upload PDF or paste text for AI-powered feedback (OpenAI)
- **Auth** — Register, login, forgot password, reset password
- **Modern UI** — Clean design with Tailwind CSS, responsive layout

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express + MongoDB
- **AI:** OpenAI GPT-4o-mini for resume analysis

## Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI, JWT_SECRET, and optionally OPENAI_API_KEY
npm run dev
```

### Frontend

```bash
cd frontend2
npm install
cp .env.example .env
# Edit .env with VITE_API_URL (e.g. http://localhost:5000/api for dev)
npm run dev
```

### Environment Variables

**Backend (.env):**
- `PORT` — Server port (default: 5000)
- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — Secret for JWT signing
- `OPENAI_API_KEY` — OpenAI API key (required for resume analysis)
- `FRONTEND_URL` — Frontend URL for password reset links (e.g. https://your-app.com)

**Frontend (.env):**
- `VITE_API_URL` — Backend API URL (e.g. https://api.your-app.com/api)

## Deployment

1. **Backend:** Deploy to Railway, Render, or similar. Set env vars.
2. **Frontend:** Build with `npm run build`, deploy to Vercel/Netlify. Set `VITE_API_URL` to your backend URL.
3. **Database:** Use MongoDB Atlas (free tier available).
4. **Password reset:** Add SMTP config to send actual emails (e.g. `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`). Until then, reset links are logged to the server console.

## License

MIT
