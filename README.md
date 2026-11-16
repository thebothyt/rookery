# Rookery

Responsive chess with five bots and live multiplayer. Guests play instantly, no sign-in.
Original design, name and piece artwork.

## Hosting
It's a static site (`public/`), so it deploys anywhere: **Vercel** (set the output directory to `public`),
**Cloudflare Workers** (`npm run deploy`), Netlify, GitHub Pages.

## Multiplayer
Games run peer-to-peer over WebRTC using PeerJS (vendored in `public/peerjs.min.js`), so there is no
server to run. Players are matched through PeerJS's free public signaling service.
- **Find an opponent:** searches for another waiting player.
- **Invite a friend:** creates a link like `/#r=abc123`; the host's tab must stay open.
- Both browsers validate every move.

Limits: no TURN relay, so a few strict networks (some mobile carriers, corporate Wi-Fi) can't connect.
For production reliability, add a TURN server in `OPT` in `index.html`, or run your own PeerJS server.
Also missing: clocks, repetition and 50-move draws.
