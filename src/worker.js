// Realtime layer: one Durable Object per game room (WebSocket relay + turn enforcement),
// and a Lobby object that pairs strangers for quick matches. Guests identify by a random id.
const CORS = { 'access-control-allow-origin': '*' };

export class Room {
  constructor(state) { this.state = state; this.socks = new Set(); this.g = null; }
  async load() { this.g ||= (await this.state.storage.get('g')) || { moves: [], w: null, b: null, over: null }; return this.g; }
  save() { return this.state.storage.put('g', this.g); }
  send(ws, m) { try { ws.send(JSON.stringify(m)); } catch {} }
  all(m) { for (const s of this.socks) this.send(s, m); }
  async fetch(req) {
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('WebSocket only', { status: 426 });
    const u = new URL(req.url), gid = (u.searchParams.get('gid') || '').slice(0, 40);
    const name = (u.searchParams.get('name') || 'Guest').slice(0, 20);
    const g = await this.load();
    let color = g.w?.id === gid ? 'w' : g.b?.id === gid ? 'b' : !g.w ? 'w' : !g.b ? 'b' : 's';
    if (color !== 's') g[color] = { id: gid, name };
    await this.save();
    const [client, server] = Object.values(new WebSocketPair());
    server.accept(); this.socks.add(server);
    const pub = () => ({ w: g.w && { name: g.w.name }, b: g.b && { name: g.b.name } });
    this.send(server, { t: 'hello', color, players: pub(), moves: g.moves, over: g.over });
    this.all({ t: 'players', players: pub() });
    server.addEventListener('message', async (e) => {
      let m; try { m = JSON.parse(e.data); } catch { return; }
      if (color === 's' || g.over) return;
      if (m.t === 'move' && Number.isInteger(m.f) && Number.isInteger(m.to) && g.w && g.b
          && (g.moves.length % 2 === 0) === (color === 'w')) {
        g.moves.push([m.f, m.to]); await this.save();
        this.all({ t: 'move', f: m.f, to: m.to, n: g.moves.length - 1 });
      } else if (m.t === 'resign') { g.over = 'resign-' + color; await this.save(); this.all({ t: 'resign', color }); }
    });
    server.addEventListener('close', () => this.socks.delete(server));
    return new Response(null, { status: 101, webSocket: client });
  }
}

export class Lobby {
  constructor(state) { this.state = state; }
  async fetch() {
    const w = await this.state.storage.get('w');
    if (w && Date.now() - w.at < 60000) { await this.state.storage.delete('w'); return Response.json({ room: w.id }, { headers: CORS }); }
    const id = crypto.randomUUID().slice(0, 8);
    await this.state.storage.put('w', { id, at: Date.now() });
    return Response.json({ room: id }, { headers: CORS });
  }
}

export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    const m = u.pathname.match(/^\/ws\/room\/([\w-]{3,20})$/);
    if (m) return env.ROOM.get(env.ROOM.idFromName(m[1])).fetch(req);
    if (u.pathname === '/api/quick') return env.LOBBY.get(env.LOBBY.idFromName('main')).fetch(req);
    return env.ASSETS.fetch(req);
  },
};
