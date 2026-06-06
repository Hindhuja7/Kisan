# KisanMitra AI — Hackathon MVP

Autonomous agri supply chain intelligence for Indian smallholder farmers.

**Stack:** Next.js 14 · FastAPI · CrewAI · GPT-4o · Supabase · Tailwind CSS

## MVP Features

| Feature | Description |
|---------|-------------|
| 🌾 Crop Readiness | IoT + satellite NDVI → harvest window (CrewAI agent) |
| 📈 Mandi Prices | 6 Telangana mandis, price forecast & best-market pick |
| 🤝 Buyer Negotiation | Multi-round deal simulation with verified buyers |
| 💬 WhatsApp | Farmer chat UI with GPT-4o replies (Telugu/Hindi/English) |

Works **without API keys** using mock data + template fallbacks. Add keys for full GPT-4o + Supabase persistence.

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
copy .env.example .env         # add OPENAI_API_KEY optionally
uvicorn main:app --reload --port 8000
```

Docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000/login

## Deploy (free — phone & laptop)

Full guide: **[DEPLOY.md](./DEPLOY.md)**

| Step | Platform | Action |
|------|----------|--------|
| 1 | [Render](https://render.com) | New → Blueprint → connect `Hindhuja7/Kisan` → deploys **kisanmitra-api** |
| 2 | [Vercel](https://vercel.com) | New Project → root folder **`frontend`** → add env `NEXT_PUBLIC_API_URL=https://kisanmitra-api.onrender.com` |
| 3 | Render | Set `CORS_ORIGINS` to your Vercel URL |

**After deploy:** share `https://your-app.vercel.app/login` — works on any phone with internet.

## Environment Variables

**Backend** (`backend/.env`):

```
OPENAI_API_KEY=sk-...          # enables GPT-4o + CrewAI
OPENAI_MODEL=gpt-4o
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your-anon-key
CORS_ORIGINS=http://localhost:3000
```

**Frontend** (`frontend/.env.local`):

```
NEXT_PUBLIC_API_URL=http://localhost:8001
```

## Supabase Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Run `backend/supabase/schema.sql` in the SQL Editor
3. Add `SUPABASE_URL` and `SUPABASE_KEY` to `.env`

Without Supabase, data is stored in-memory (fine for demos).

## Demo Video

Download the walkthrough recording:

- **GitHub:** [KisanMitra-Demo.mp4](https://github.com/Hindhuja7/Kisan/raw/main/frontend/public/KisanMitra-Demo.mp4)
- **Local (with frontend running):** http://localhost:3000/KisanMitra-Demo.mp4
- **Local file:** `frontend/public/KisanMitra-Demo.mp4`

## Demo Script

1. Click **▶ Demo** — runs Crop → Price → Negotiation pipeline
2. **Crop Readiness** tab — run agent, see harvest advisory
3. **Mandi Prices** — view live price board + run intelligence agent
4. **Buyer Deal** — simulate 3-round negotiation
5. **WhatsApp** — chat as a farmer ("మండి ధర ఎంత?")

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/agents/crop-readiness` | Crop readiness agent |
| POST | `/api/agents/price-intelligence` | Mandi price agent |
| POST | `/api/agents/negotiate` | Buyer negotiation |
| POST | `/api/workflow/run` | Full 3-agent demo |
| POST | `/api/whatsapp/chat` | Farmer WhatsApp message |
| GET | `/api/mandi-prices/{crop}` | Mandi price board |
| GET | `/api/dashboard/stats` | Dashboard metrics |

## Team Nexora

Bhavya Sree Pendli · Sritej Vipparla · Hindhuja Lokineni · Gunavardhan Yakkati
