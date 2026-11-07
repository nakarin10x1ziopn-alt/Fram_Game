'use strict';
// ---------- Online play: talks to server.py on the same origin (any IP / port), offline when no server ----------
const Net = {
  on: false, others: new Map(), chat: [], chatN: 0, saveT: 0,
  id() {
    let id = safeGet('raisukjai3d_pid');
    if (!id) { id = 'p' + Math.random().toString(36).slice(2, 12); safeSet('raisukjai3d_pid', id); }
    return id + (Slots.cur() > 1 ? '_s' + Slots.cur() : '');
  },
  async api(path, body) {
    const r = await fetch('api/' + path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store' } : { cache: 'no-store' });
    if (!r.ok) throw new Error(r.status);
    return r.json();
  },
  // called before the save is loaded so a save kept on the server wins
  async probe() {
    if (location.protocol === 'file:') return;
    try {
      const ping = await Promise.race([this.api('ping'), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), location.hostname.endsWith('netlify.app') ? 6000 : 1500))]);
      if (!ping || !ping.ok) return;
      this.on = true;
      const s = await this.api('save?id=' + this.id());
      if (s && s.save) this.remoteSave = JSON.stringify(s.save);
    } catch (e) { this.on = false; }
  },
  start() {
    if (!this.on) return;
    UI.toast('เชื่อมต่อเซิร์ฟเวอร์แล้ว เล่นออนไลน์ได้', '🌐');
    // public hosting (Netlify functions) is polled more gently than a LAN server
    const lan = /^(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(location.hostname);
    setInterval(() => this.tick(), lan ? 450 : 1500);
    setInterval(() => this.pullChat(), lan ? 2000 : 5000);
  },
  saveRemote(force) {
    if (!this.on || (!force && performance.now() - this.saveT < 3000)) return;
    this.saveT = performance.now();
    this.api('save', { id: this.id(), save: S }).catch(() => {});
  },
  // reload / slot switch / new game: wait for the server copy so an older one can't win on the next load
  flush(fn, save) { if (!this.on) return fn(); const t = setTimeout(fn, 1500); this.api('save', { id: this.id(), save: save === undefined ? S : save }).catch(() => {}).finally(() => { clearTimeout(t); fn(); }); },
  async tick() {
    if (!G.started || this.busy) return; this.busy = true; setTimeout(() => { this.busy = false; }, 2000);
    const p = G.driving ? G.driving.g.position : G.player.pos;
    try {
      const r = await this.api('presence', { id: this.id(), name: S.name || 'ชาวไร่', x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2), r: +(G.driving ? G.driving.d.r : G.player.rot).toFixed(2), look: S.look, inside: G.inside, car: G.driving ? G.driving.d.type : null });
      this.sync(r.others || {});
    } catch (e) { /* server went away: keep playing offline */ }
    this.busy = false;
  },
  sync(others) {
    for (const [id, o] of this.others) if (!others[id]) { G.scene.remove(o.obj); this.others.delete(id); }
    for (const id in others) {
      const s = others[id]; let o = this.others.get(id);
      if (!o) {
        const obj = Models.human(lookOpts(s.look || DEFAULT_LOOK));
        const tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: U.signTex(s.name || 'ผู้เล่น', { w: 256, h: 64, bg: '#1f6f8b' }), transparent: true, depthWrite: false }));
        tag.scale.set(1.6, 0.4, 1); tag.position.y = 2.25; obj.add(tag);
        G.scene.add(obj); o = { obj, x: s.x, z: s.z, y: s.y, r: s.r, speed: 0, name: s.name }; this.others.set(id, o);
        UI.toast(`${s.name || 'ผู้เล่น'} เข้ามาในเกม`, '🌐');
      }
      o.tx = s.x; o.tz = s.z; o.ty = s.y; o.tr = s.r; o.inside = s.inside; o.car = s.car;
    }
  },
  update(dt) {
    for (const o of this.others.values()) {
      if (o.tx == null) continue;
      const k = Math.min(1, dt * 6), d = Math.hypot(o.tx - o.x, o.tz - o.z);
      o.speed = U.lerp(o.speed, Math.min(8, d / Math.max(dt, 0.016) * 0.15), 0.2);
      o.x = U.lerp(o.x, o.tx, k); o.z = U.lerp(o.z, o.tz, k); o.y = U.lerp(o.y, o.ty, k); o.r = U.angLerp(o.r, o.tr, k);
      o.obj.position.set(o.x, o.y, o.z); o.obj.rotation.y = o.r;
      o.obj.visible = o.inside === G.inside && !G.inMine;
      Models.animHuman(o.obj, dt, d > 0.05 ? Math.min(7, d * 6) : 0, null);
    }
  },
  async pullChat() {
    try {
      const r = await this.api('chat?since=' + this.chatN);
      for (const m of r.msgs || []) {
        this.chatN = Math.max(this.chatN, m.n); this.chat.push(m); if (this.chat.length > 60) this.chat.shift();
        if (m.id !== this.id() && this.chatReady) UI.toast(`${m.name}: ${m.text}`, '💬');
      }
      this.chatReady = true;
    } catch (e) { }
  },
  say(text) { if (this.on && text.trim()) this.api('chat', { id: this.id(), name: S.name || 'ชาวไร่', text }).then(() => this.pullChat()).catch(() => {}); },
};
