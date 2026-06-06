# Deploy KisanMitra AI

## Live URLs (after deploy)

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | https://kisan-mitra.vercel.app (or your Vercel URL) |
| Backend API | Render | https://kisanmitra-api.onrender.com |

---

## Step 1 — Push code to GitHub

```bash
git add .
git commit -m "Add production deployment config"
git push origin main
```

---

## Step 2 — Deploy backend (Render)

1. Open [render.com](https://render.com) → Sign up (free)
2. **New** → **Blueprint** → Connect GitHub repo `Hindhuja7/Kisan`
3. Render reads `render.yaml` and creates **kisanmitra-api**
4. In Render dashboard → **Environment** → add (optional):
   - `OPENAI_API_KEY` — for GPT / voice
   - `CORS_ORIGINS` — your Vercel URL, e.g. `https://kisan-mitra.vercel.app`
5. Wait for deploy → copy URL: `https://kisanmitra-api.onrender.com`

**Test:** open `https://kisanmitra-api.onrender.com/api/health`

---

## Step 3 — Deploy frontend (Vercel)

1. Open [vercel.com](https://vercel.com) → Sign up with GitHub
2. **Add New Project** → import `Hindhuja7/Kisan`
3. Settings:
   - **Root Directory:** `frontend`
   - **Framework:** Next.js
4. **Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL=https://kisanmitra-api.onrender.com
   ```
5. Click **Deploy**

**Test:** open your Vercel URL → `/login`

---

## Step 4 — Update CORS on Render

After Vercel gives you a URL (e.g. `https://kisan-xxx.vercel.app`):

Render → kisanmitra-api → Environment:
```
CORS_ORIGINS=https://kisan-xxx.vercel.app,https://kisan-mitra.vercel.app
```

Redeploy backend.

---

## CLI deploy (optional)

```bash
# Backend — use Render dashboard (Blueprint) instead

# Frontend
cd frontend
npx vercel --prod
# Set NEXT_PUBLIC_API_URL when prompted
```

---

## Phone access (production)

Share your **Vercel URL** — works on any phone with internet:
```
https://your-app.vercel.app/login
```

No WiFi / IP needed when deployed.
