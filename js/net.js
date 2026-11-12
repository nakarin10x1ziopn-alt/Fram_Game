'use strict';
// ---------- Online play: talks to server.py on the same origin (any IP / port), offline when no server ----------
const Net = {
  on: false, others: new Map(), chat: [], chatN: 0, saveT: 0,
  // ---- v197 cloud save: on a host that has only /api/ping + /api/save (Vercel) every save slot is kept in the cloud under the player's own secret sync code, so the save follows the player to any
  // browser or device (and survives clearing the browsing history). `cloud` is separate from `on`: the live online features (presence, chat, mail) stay off there.
  cloud: false, cloudAt: 0, cloudErr: '', pulled: [],
  CLOUD_A: 'abcdefghjkmnpqrstuvwxyz23456789',
  cloudCode() {
    let c = safeGet('raisukjai3d_cloud');
    if (!c || !/^[a-z0-9]{16}$/.test(c)) { const a = new Uint8Array(16); (window.crypto || window.msCrypto).getRandomValues(a); c = Array.from(a, v => this.CLOUD_A[v % this.CLOUD_A.length]).join(''); safeSet('raisukjai3d_cloud', c); }
    return c;
  },
  cloudCodeShown() { return this.cloudCode().replace(/(.{4})(?=.)/g, '$1-'); },
  cloudId(n) { return this.cloudCode() + (n > 1 ? '_s' + n : ''); },
  setCloudCode(txt) { const c = String(txt || '').toLowerCase().replace(/[^a-z0-9]/g, ''); if (!/^[a-z0-9]{16}$/.test(c)) return false; safeSet('raisukjai3d_cloud', c); return true; },
  // download every slot of this code; the NEWER copy (by savedAt) wins, the replaced local save is kept as the automatic backup; local-only saves are uploaded
  async pullAll() {
    const T = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
    const stamp = raw => { try { return (JSON.parse(raw) || {}).savedAt || 0; } catch (e) { return 0; } };
    await Promise.all([1, 2, 3].map(async n => {
      try {
        const key = Slots.key(n), id = this.cloudId(n), r = await T(this.api('save?id=' + id), 8000), local = safeGet(key), lt = local && local.length > 100 ? stamp(local) : -1;
        if (r && r.save && (lt < 0 || (r.ts || 0) > lt + 500)) { if (local && local.length > 100) safeSet(key + '_bak', local); safeSet(key, JSON.stringify(r.save)); this.pulled.push(n); }
        else if (lt >= 0 && (!r || !r.save || lt > (r.ts || 0) + 500)) { let o = null; try { o = JSON.parse(local); } catch (e) { } if (o) await T(this.api('save', { id, save: o, ts: lt || Date.now() }), 8000); }
      } catch (e) { this.cloudErr = String(e && e.message || e); }
    }));
    this.cloudAt = Date.now();
  },
  // the "save" button in the settings: wait for any upload in progress, then upload the current save and report whether it really reached the server
  async saveNow() {
    if (!this.cloud) return null;
    try { let n = 0; while (this.inflight && n++ < 5) await this.inflight; this.saveT = 0; await this.saveRemote(true); } catch (e) { this.cloudErr = String(e && e.message || e); }
    return !this.cloudErr;
  },
  id() {
    if (this.cloud) return this.cloudId(Slots.cur());
    let id = safeGet('raisukjai3d_pid');
    if (!id) { id = 'p' + Math.random().toString(36).slice(2, 12); safeSet('raisukjai3d_pid', id); }
    return id + (Slots.cur() > 1 ? '_s' + Slots.cur() : '');
  },
  async api(path, body) {
    // a save is sent as text once; on the laptop server a big one (over ~4 MB) goes as the raw body of /api/save?id=..&ts=.. so the server streams it to disk without holding it in memory
    let url = 'api/' + path, txt = null;
    if (body) {
      if (path === 'save' && body.save && typeof body.save === 'object') {
        const payload = JSON.stringify(body.save);
        if (this.on && !this.cloud && payload.length > 4000000) { txt = payload; url += '?id=' + encodeURIComponent(body.id) + '&ts=' + (+body.ts || Date.now()) + (body.force ? '&force=1' : ''); }
        else txt = '{"id":' + JSON.stringify(body.id) + ',"save":' + payload + ',"ts":' + (+body.ts || Date.now()) + (body.force ? ',"force":1' : '') + '}';
      } else txt = JSON.stringify(body);
    }
    // keepalive lets a small save still reach the server while the page is closing (iPad: swipe away / lock the screen); the browser limit is 64 KB in BYTES (Thai text is 3 bytes a character), so measure the encoded size; over the limit it falls back to a normal request
    let ka = false; if (txt && txt.length < 70000) { try { ka = new TextEncoder().encode(txt).length < 60000; } catch (e) { ka = false; } }
    const go = k => fetch(url, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: txt, cache: 'no-store', keepalive: k } : { cache: 'no-store' });
    let r; try { r = await go(ka); } catch (e) { if (!ka) throw e; r = await go(false); }
    if (!r.ok) throw new Error(r.status);
    return r.json();
  },
  // called before the save is loaded so a save kept on the server wins
  async probe() {
    if (location.protocol === 'file:') return;
    try {
      const lan = /^(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.|\[)/.test(location.hostname);
      const ping = await Promise.race([this.api('ping'), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), lan ? 1500 : 8000))]);
      if (!ping || !ping.ok) return;
      if (ping.cloud) { this.cloud = true; try { await this.pullAll(); } catch (e) { this.cloudErr = String(e && e.message || e); } return; }   // cloud-save host: no presence / chat
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
    if ((!this.on && !this.cloud) || (!force && performance.now() - this.saveT < (this.cloud ? 15000 : 3000))) return;
    this.saveT = performance.now();
    if (this.cloud) {   // one upload at a time, always the latest state afterwards: two requests can never arrive out of order and leave an OLD save in the cloud
      if (this.inflight) { this.again = true; return this.inflight; }
      const send = () => this.api('save', { id: this.id(), save: S, ts: S && S.savedAt || Date.now() }).then(r => { this.cloudAt = Date.now(); this.cloudErr = ''; return r; }).catch(e => { this.cloudErr = String(e && e.message || e); });
      this.inflight = send().finally(() => { this.inflight = null; if (this.again) { this.again = false; this.saveT = 0; this.saveRemote(true); } });
      return this.inflight;
    }
    // v209: the LAN / laptop server: remember whether the file really reached saves\ on that computer (Net.lan), retry a failed one, never leave an older request to land after a newer one
    if (this.lanBusy) { this.lanAgain = true; return this.lanBusy; }
    const sendLan = () => this.api('save', { id: this.id(), save: S, ts: S && S.savedAt || Date.now() }).then(r => {
      if (!r || r.ok === false) throw new Error((r && r.error) || 'server');
      const was = this.lan.err; this.lan = { at: Date.now(), bytes: r.bytes || 0, file: r.file || '', err: '', n: (this.lan.n || 0) + 1 };
      if (was) { try { UI.toast('💻 กลับมาเซฟลงเครื่องเซิร์ฟเวอร์ได้แล้ว', '✅'); } catch (e) { } }
      this.lanChanged(); return r;
    }).catch(e => {
      const first = !this.lan.err; this.lan.err = String(e && e.message || e) || 'error'; this.lan.fails = (this.lan.fails || 0) + 1;
      if (first) { try { UI.toast('⚠️ เซฟลงเครื่องเซิร์ฟเวอร์ไม่สำเร็จ (' + this.lan.err + ') เกมยังเซฟในเบราว์เซอร์อยู่ และจะลองส่งใหม่อัตโนมัติ', '⚠️'); } catch (x) { } }
      clearTimeout(this.lanRetry); this.lanRetry = setTimeout(() => { this.saveT = 0; this.saveRemote(true); }, 8000);
      this.lanChanged(); return { ok: false, error: this.lan.err };
    });
    this.lanBusy = sendLan().finally(() => { this.lanBusy = null; if (this.lanAgain) { this.lanAgain = false; this.saveT = 0; this.saveRemote(true); } });
    return this.lanBusy;
  },
  lan: { at: 0, bytes: 0, file: '', err: '', n: 0 }, lanChanged() { try { if (this.onLan) this.onLan(this.lan); } catch (e) { } },
  // the "save" button on the laptop server: wait for the upload and report the real result
  async saveNowLan() {
    if (!this.on) return null;
    try { let n = 0; while (this.lanBusy && n++ < 5) await this.lanBusy; this.saveT = 0; const r = await this.saveRemote(true); return r && r.ok !== false ? r : null; } catch (e) { return null; }
  },
  // reload / slot switch / new game: wait for the server copy so an older one can't win on the next load
  flush(fn, save) { if (!this.on && !this.cloud) return fn(); const t = setTimeout(fn, 1500); this.api('save', { id: this.id(), save: save === undefined ? S : save, ts: Date.now() }).catch(() => {}).finally(() => { clearTimeout(t); fn(); }); },
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
