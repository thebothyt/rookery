# Rookery

Responsive chess with five bots and live multiplayer. Guests play instantly — no sign-in.
A rookery is a colony of rooks. Original design, original name, Unicode piece glyphs (no third-party assets).

## Run
```
npm install
npm run dev      # http://localhost:8787
npm run deploy   # Cloudflare Workers
```

## Hosting
- **Cloudflare Workers (recommended):** serves the site and the realtime rooms (Durable Objects + WebSockets).
- **Vercel:** Vercel can't hold WebSocket connections. Deploy `public/` there if you like, deploy the Worker
  too, and set `window.WS_BASE` in `public/config.js` to the Worker URL.

## How multiplayer works
Guests get a random id stored in `localStorage` (this also lets them reconnect to a game). `Find opponent`
pairs two players through the Lobby object; `Invite a friend` makes a link like `/#r=abc123`.
The server enforces turn order and stores the move list; clients validate move legality.

## Known gaps
Auto-queen promotion, no clocks, no repetition/50-move draws, server doesn't validate move legality.
