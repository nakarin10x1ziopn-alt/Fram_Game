'use strict';
// ---------- Life 9: three graphics levels (low / medium / high = today's look), a calmer auto-governor that never causes
// shader-recompile stutters, shader pre-warming, and the game clock: fast / normal / slow / real Thai time ----------

// ===== graphics levels: ต่ำ, กลาง, สูง (สูง is the current look); the old "ultra" becomes สูง =====
{ const q = safeGet(Q_KEY); if (q === 'ultra') safeSet(Q_KEY, 'high'); }
const QNAME = { low: 'ต่ำ', med: 'กลาง', high: 'สูง' };
const Gfx9 = {
  init() {
    G.fpsCap = 0; Plan.applyMobile = function () { G.fpsCap = 0; };
    UI.H.q = d => { if (!QNAME[d.v]) return; safeSet(Q_KEY, d.v); safeSet('raisukjai3d_pr', ''); saveGame(true); UI.toast(`เปลี่ยนกราฟิกเป็น “${QNAME[d.v]}” กำลังโหลดใหม่...`, '⚙️'); setTimeout(() => location.reload(), 600); };
    UI.H.qmode = d => UI.H.q({ v: { pretty: 'high', balance: 'med', smooth: 'low' }[d.v] || 'high' });
    const css = document.createElement('style');
    css.textContent = '[data-a="q"][data-v="ultra"],[data-a="benchset"],[data-a="mobile"],[data-a="qmode"]{display:none!important}';
    document.head.appendChild(css);
    const _menu = UI.menu.bind(UI);
    UI.menu = () => {
      _menu(); const r = UI.cur.render;
      UI.cur.render = t => `<div class="card"><div class="ci">🎨</div><div class="cb"><h4>คุณภาพกราฟิก: ${QNAME[G.Q.lvl] || 'สูง'}</h4><p class="dim">สูง = ภาพสวยเต็มที่ (แบบปัจจุบัน) · กลาง = เงาเบาลง หญ้าน้อยลง · ต่ำ = ลื่นที่สุดสำหรับเครื่องเล็ก · ตัวหนังสือคมเท่ากันทุกระดับ${G.fps ? ` · ตอนนี้ ${Math.round(G.fps)} FPS` : ''}</p><div class="row">${Object.entries(QNAME).map(([k, n]) => `<button class="btn ${G.Q.lvl === k ? '' : 'ghost'}" data-a="q" data-v="${k}">${n}</button>`).join('')}</div></div></div>` + r(t).replace(/<h5>คุณภาพกราฟิก[\s\S]*?<\/div>/, '').replace(/<button class="btn ghost" data-a="reload">[^<]*<\/button>/, '');
      UI.renderBody();
    };
  },
};

// ===== smoothness: a governor with hysteresis that only touches cheap settings, plus shader pre-warming =====
const Smooth = {
  init() {
    const floor = Stable.floor();
    // shadows are never toggled at runtime (that recompiles every material = a long freeze); effects, view distance and
    // resolution (down to the sharp floor) are adjusted slowly, with a cool-down after every change
    Perf.frame = function (dt) {
      this.cullT -= dt;
      if (this.cullT <= 0 && !G.inside) { this.cullT = 0.25; const c = G.camera.position; World.cullUpdate(c.x, c.z, G.view); }
      if (!G.started || G.paused || UI.isOpen() || document.hidden || dt >= 0.1) { this.acc = 0; this.n = 0; return; }
      this.acc += dt; this.n++; this.cool = Math.max(0, (this.cool || 0) - dt);
      if (this.acc < 3) return;
      const fps = this.n / this.acc; this.acc = 0; this.n = 0; G.fps = fps;
      if (!this.auto || this.cool > 0) return;
      if (fps < 46) { this.fast = 0; if (++this.slow >= 2) { this.slow = 0; this.cool = 12; this.down(); } }
      else if (fps > 58) { this.slow = 0; if (++this.fast >= 10) { this.fast = 0; this.cool = 20; this.up(); } }
      else { this.slow = 0; this.fast = 0; }
    };
    Perf.down = function () {
      if (Gfx.drop()) return this.note && this.note();
      const minView = G.Q.lvl === 'low' ? 0.45 : 0.6;
      if (G.view > minView + 0.01) { G.view = Math.max(minView, +(G.view - 0.1).toFixed(2)); return; }
      if (G.pr > floor + 0.01) { this.setPr(Math.max(floor, +(G.pr - 0.1).toFixed(2))); return; }
    };
    Perf.up = function () {
      const maxView = G.Q.lvl === 'low' ? 0.6 : G.Q.lvl === 'med' ? 0.8 : 1;
      if (G.pr < G.Q.pr - 0.01) this.setPr(Math.min(G.Q.pr, +(G.pr + 0.05).toFixed(2)));
      else if (G.view < maxView - 0.01) G.view = Math.min(maxView, +(G.view + 0.1).toFixed(2));
    };
    // compile every material once the world is built and merged, so the first look at something new does not hitch
    const warm = () => { try { G.renderer.compile(G.scene, G.camera); if (World.interior) G.renderer.compile(World.interior, G.camera); } catch (e) { } };
    setTimeout(warm, 7000); setTimeout(warm, 20000);
    // patrol cars, rides and customers reuse a few models: build each once up front
    setTimeout(() => { try { for (const k of ['police', 'fire']) { const m = Emergency.vehicleModel(k); m.g.position.set(0, -500, 0); G.scene.add(m.g); G.renderer.compile(m.g, G.camera); G.scene.remove(m.g); } } catch (e) { } }, 9000);
  },
};

// ===== the clock: how fast a game day goes, or real Thai time =====
const TIME_MODES = {
  fast: { n: 'เร็ว', d: '1 วันในเกม = 6 นาทีจริง', r: 1440 / 360 },
  normal: { n: 'ปกติ', d: '1 วันในเกม = 50 นาทีจริง', r: 1440 / 3000 },
  slow: { n: 'ช้า', d: '1 วันในเกม = 1 ชั่วโมง 50 นาทีจริง', r: 1440 / 6600 },
  real: { n: 'เรียลไทม์ (เวลาไทย)', d: 'ตรงกับนาฬิกาจริงประเทศไทย (UTC+7) 1 วันเกม = 24 ชั่วโมงจริง', r: 0 },
};
const TimeMode = {
  cur: 'slow',
  real() { return this.cur === 'real'; },
  rate() { return TIME_MODES[this.cur] ? TIME_MODES[this.cur].r : 0.5; },
  // minutes since midnight, Thai time, regardless of the device's own time zone
  thai() { const d = new Date(Date.now() + 7 * 3600000); return d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60; },
  thaiDayNo() { return Math.floor((Date.now() + 7 * 3600000) / 86400000); },
  set(k) {
    if (!TIME_MODES[k]) return; this.cur = k; S.timeMode = k;
    if (k === 'real') this.sync(true); else S.realOff = null;
    UI.toast(`เวลาในเกม: ${TIME_MODES[k].n} (${TIME_MODES[k].d})`, '🕐');
  },
  realAbs() { return (Date.now() + 7 * 3600000) / 60000; },
  gameAbs() { return S.day * 1440 + S.time; },
  // the game clock follows the real Thai clock at a fixed offset. It only ever moves forward: actions that skip time put
  // the game ahead, and it simply waits for the real clock instead of jumping a whole extra day
  sync(first) {
    if (first || S.realOff == null) {
      const tod = this.thai();
      if (tod > S.time) { const d = tod - S.time; if (d > 5) simulate(d); else tick(d); }   // later today: let the time pass
      if (tod < S.time) S.time = tod;                                                    // earlier today: show the true Thai clock now (it used to freeze until the real clock caught up)
      S.realOff = this.gameAbs() - this.realAbs();
      return;
    }
    const diff = this.realAbs() + S.realOff - this.gameAbs();
    if (diff <= 0.02) return;
    if (diff > 5) simulate(Math.min(diff, 3 * 1440)); else tick(diff);
  },
  init() {
    this.cur = TIME_MODES[S.timeMode] ? S.timeMode : 'slow'; S.timeMode = this.cur;
    if (this.real()) this.sync(false);
    UI.H.tmode = d => { this.set(d.v); UI.renderBody(); };
    const _menu = UI.menu.bind(UI);
    UI.menu = () => {
      _menu(); const r = UI.cur.render;
      UI.cur.render = t => `<div class="card"><div class="ci">🕐</div><div class="cb"><h4>ความเร็วเวลาในเกม: ${TIME_MODES[this.cur].n}</h4><p class="dim">${TIME_MODES[this.cur].d}</p><div class="row">${Object.entries(TIME_MODES).map(([k, m]) => `<button class="btn ${this.cur === k ? '' : 'ghost'}" data-a="tmode" data-v="${k}">${m.n}</button>`).join('')}</div></div></div>` + r(t);
      UI.renderBody();
    };
    // in real time, sleeping rests you but does not jump the clock to morning
    const _sleep = sleep;
    sleep = function (forced) {
      if (!TimeMode.real()) return _sleep(forced);
      // one full rest per 6 real hours; resting sooner only restores part of the energy, by how long you have been up
      const now = Date.now(), awake = (now - (S.restAt || 0)) / 3600000, k = U.clamp(awake / 6, 0, 1);
      if (k < 0.1) { UI.toast(`ยังไม่ง่วงเลย พักได้อีกครั้งในอีก ${Math.ceil((0.1 * 6 - awake) * 60)} นาที`, '😶'); return; }
      fade(() => { S.restAt = now; S.energy = Math.min(maxEnergy(), S.energy + Math.round(maxEnergy() * k)); if (!G.inside && !G.inRoom) setInside(true); saveGame(true); UI.toast(`นอนพัก${k >= 1 ? 'จนสดชื่นเต็มที่' : ' ได้พลังงานคืนบางส่วน'} (โหมดเวลาจริง: ตอนนี้ ${Phone.clock()} น.)`, '😴'); });
    };
  },
  update(dt) {
    if (!this.real() || !G.started || G.simulating) return;
    if ((this.t = (this.t || 0) - dt) > 0) return; this.t = 1;
    this.sync(false);
  },
};

const Life9 = {
  init() { Gfx9.init(); Smooth.init(); TimeMode.init(); },
  update(dt) { TimeMode.update(dt); },
};
