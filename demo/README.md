# KisanMitra Demo Video Recorder

Automated Playwright walkthrough of the hackathon MVP.

## Prerequisites

- Backend running: `uvicorn main:app --reload --port 8000`
- Frontend running: `npm run dev` (port 3000)

## Record demo

```bash
cd demo
npm install
npx playwright install chromium
npm run record
```

Output:
- `output/kisanmitra-demo.webm`
- Copy at project root: `../KisanMitra-Demo.mp4` (after manual ffmpeg convert)

## What the video shows

1. Dashboard overview & stats
2. One-click full workflow demo
3. Crop Readiness agent
4. Mandi Price Intelligence + price board
5. Buyer Negotiation simulation
6. WhatsApp farmer chat
