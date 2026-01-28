# Rolly Polly

Multiplayer 3D d6 dice for TTRPGs like **Scum & Villainy** and other Forged-in-the-Dark–style games. Roll 1–6 d6s in shared rooms so the whole table sees the result.

## Features

- **3D dice** — Three.js (via React Three Fiber) renders d6s that roll and settle on a shared “table”
- **Multiplayer** — Create or join rooms by code; everyone sees rolls in real time
- **d6 pools** — Choose 1–6 dice per roll, ideal for attribute-based pools (e.g. 3d6 for a 3-dot action)
- **Roll log** — Per-player history with sums (e.g. `4,2,5 → 11`)

## Run locally

You need two processes: the Next.js app and the Socket.io server.

**Terminal 1 — App**

```bash
pnpm dev
```

**Terminal 2 — Socket server**

```bash
pnpm run dev:server
```

Then open [http://localhost:3000](http://localhost:3000). Create a game, share the 6-character code, and have others join. Roll from the room page; all participants see the same log.

## Tech

- **Next.js 16** — App router, React 19
- **React Three Fiber + drei** — 3D dice and scene
- **Socket.io** — Rooms, join/create, broadcast rolls
- **Tailwind CSS** — Styling

The socket server runs on port **3001** by default. Override with `SOCKET_PORT`. The client uses `NEXT_PUBLIC_SOCKET_URL` (default `http://localhost:3001`) when in the browser.

## Deploy to Vercel + a Socket host

Vercel only runs serverless/edge code, so the Socket.io server must run elsewhere. Use **Vercel for the Next.js app** and **Render** or **Railway** for the Socket server.

### 1. Deploy the Next.js app to Vercel

- Push the repo to GitHub and [import it in Vercel](https://vercel.com/new).
- Use the default build settings (Next.js, `pnpm install` / `pnpm build`).
- Do **not** add `NEXT_PUBLIC_SOCKET_URL` yet; add it after the Socket server is live.

### 2. Deploy the Socket server to Render

- [Render](https://render.com): New → **Web Service**, connect the same repo.
- **Settings:**
  - **Build Command:** `pnpm install`
  - **Start Command:** `node server/index.js`
  - **Environment:**
    - `CORS_ORIGIN` = your Vercel app URL, e.g. `https://rolly-polly.vercel.app` (no trailing slash). For multiple origins use a comma: `https://app.vercel.app,https://custom.com`
    - Render sets `PORT` for you.

- After the service is live, copy its URL (e.g. `https://rolly-polly-socket.onrender.com`).

### 3. Point the frontend at the Socket server

- In the **Vercel** project: **Settings → Environment Variables**
- Add: `NEXT_PUBLIC_SOCKET_URL` = the Render (or Railway) Socket URL, e.g. `https://rolly-polly-socket.onrender.com`
- Redeploy the Vercel app so the client uses this URL.

### 4. (Optional) Use Railway instead of Render

- [Railway](https://railway.app): New Project → Deploy from GitHub, choose this repo.
- Add a **service** that runs `node server/index.js` (e.g. set start command in Railway’s settings or use a `Procfile` / `railway.json`).
- Set `CORS_ORIGIN` to your Vercel URL and expose the service to get a public URL.
- In Vercel, set `NEXT_PUBLIC_SOCKET_URL` to that Railway URL.

### Server env reference

| Variable      | Required | Description |
|---------------|----------|-------------|
| `PORT`        | No       | Set by Render/Railway. Locally use `SOCKET_PORT` (default 3001). |
| `CORS_ORIGIN` | Yes in prod | Comma‑separated frontend origins, e.g. `https://yourapp.vercel.app` |

Render’s free tier will sleep after ~15 minutes of no traffic; the first visitor after that may see a short delay while the Socket server wakes. For always-on, use Railway’s paid plan or another host.

## Scum & Villainy style

Typical use: pick dice count from your action rating (e.g. 2 dots → 2d6), roll, then interpret:

- **6** — Full success  
- **4–5** — Partial / consequence  
- **1–3** — Failure (resist or try again)

Rolly Polly handles the shared roll and log; you bring the narrative.
