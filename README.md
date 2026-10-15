# SkillLens

**Your AI sports coach, in your camera.** Record a short video of your technique and get a score, mistakes, injury risk, drills and a weekly training plan, for 9 sports.

## What's in this repo

| Folder | What it is | Tech |
|---|---|---|
| `frontend/` | The website people use | React 19 (JavaScript), Vite, Tailwind CSS, React Router |
| `backend/` | The API server | Python, FastAPI, SQLAlchemy, Alembic |
| — | Database, login, file storage | Supabase (Google sign-in) |

## Run it on your computer

**Backend** (in `backend/`):

```bash
python -m venv .venv
.venv\Scripts\activate        # Windows  (macOS/Linux: source .venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env        # then fill in values
uvicorn app.main:app --reload --port 8000
```

API docs: http://127.0.0.1:8000/docs

**Frontend** (in `frontend/`):

```bash
npm install
copy .env.example .env.local  # then add VITE_SUPABASE_ANON_KEY
npm run dev
```

Open http://localhost:5173

## Tests

```bash
cd backend && pytest
cd frontend && npm run build
```

## Deployment

- **Frontend → Vercel** (root directory `frontend/`). Every pull request gets its own preview link.
- **Backend → Render** (see `render.yaml`).

## Status

- ✅ New React (JavaScript) frontend: landing page, Google sign-in, dashboard, analysis flow
- ✅ FastAPI backend: health, sign-in check (`/me`), sports list
- ⏳ Real body tracking (MediaPipe) and scoring engine. Report scores are sample values until this lands.
- ⏳ Database tables and the Knowledge Library
