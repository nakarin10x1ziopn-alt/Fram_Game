'use strict';
// ---------- The approved 10-point plan: touch driving pad and button size, GPS route along the roads, a daily planner,
// seasons that change farming, NPC routines (town lunch, weekend market), maintenance (house, air-con, solar dust),
// big field crops on bought land, and a performance pass (frozen static buildings, no shadows from tiny props) ----------
const BIG_FIELDS = [
  { id: 'fA', n: 'ไร่ริมถนนฝั่งตะวันออก', x: 40, z: -118, w: 30, d: 22, rai: 5, price: 120000 },
  { id: 'fB', n: 'ไร่ริมถนนฝั่งตะวันตก', x: -40, z: -150, w: 30, d: 22, rai: 5, price: 110000 },
];
for (const f of BIG_FIELDS) FLAT_PADS.push({ x: f.x, z: f.z, r: 19 });
// real field crops: rai yields and factory prices (baht per kg)
const FIELD_CROPS = {
  corn: { n: 'ข้าวโพดเลี้ยงสัตว์', i: '🌽', days: 3, cost: 2200, kg: 900, price: 9, col: 0xc0ca33 },
  cassava: { n: 'มันสำปะหลัง', i: '🥔', days: 4, cost: 2600, kg: 3500, price: 2.6, col: 0x558b2f },
  cane: { n: 'อ้อยโรงงาน', i: '🎋', days: 5, cost: 3000, kg: 11000, price: 1.1, col: 0x7cb342 },
  rice: { n: 'ข้าวหอมมะลินาปี', i: '🌾', days: 4, cost: 2400, kg: 450, price: 15, col: 0xd4e157 },
};

// ===== 1. touch driving pad + button size =====
const DrivePad = {
  x: 0, y: 0,
  init() {
    const css = document.createElement('style');
    css.textContent = `#dpad{position:fixed;inset:auto 0 0 0;height:0;z-index:5;pointer-events:none}#dpad button{position:fixed;bottom:calc(22px + env(safe-area-inset-bottom));width:74px;height:74px;border-radius:18px;border:2px solid rgba(255,255,255,.7);background:rgba(20,30,25,.45);color:#fff;font-size:30px;pointer-events:auto;touch-action:none;backdrop-filter:blur(4px)}#dpad button.on{background:rgba(255,200,60,.65)}#dpad .l{left:18px}#dpad .r{left:102px}#dpad .gas{right:18px;height:110px;bottom:calc(22px + env(safe-area-inset-bottom))}#dpad .brk{right:102px}body.bigbtn #bAct,body.bigbtn #dpad button{zoom:1.25}body.smallbtn #bAct,body.smallbtn #dpad button{zoom:.85}`;
    document.head.appendChild(css);
    const el = document.createElement('div'); el.id = 'dpad'; el.hidden = true;
    el.innerHTML = '<button class="l">◀</button><button class="r">▶</button><button class="brk">⏬</button><button class="gas">⏫</button>';
    document.body.appendChild(el); this.el = el;
    const bind = (cls, fn) => { const b = el.querySelector('.' + cls); const on = v => e => { e.preventDefault(); b.classList.toggle('on', v); fn(v); }; b.addEventListener('pointerdown', on(true)); for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(ev, on(false)); };
    bind('l', v => { this.x = v ? -1 : (this.x === -1 ? 0 : this.x); }); bind('r', v => { this.x = v ? 1 : (this.x === 1 ? 0 : this.x); });
    bind('gas', v => { this.y = v ? 1 : (this.y === 1 ? 0 : this.y); }); bind('brk', v => { this.y = v ? -1 : (this.y === -1 ? 0 : this.y); });
    const _axis = Input.axis.bind(Input);
    Input.axis = () => { const a = _axis(); if (!G.driving || (!this.x && !this.y)) return a; return { x: U.clamp(a.x + this.x, -1, 1), y: U.clamp(a.y + this.y, -1, 1) }; };
    document.body.classList.toggle('bigbtn', S.btnSize === 'big'); document.body.classList.toggle('smallbtn', S.btnSize === 'small');
  },
  update() { const show = G.Q.touch && !!G.driving && !UI.isOpen(); if (this.el.hidden === show) { this.el.hidden = !show; if (!show) { this.x = 0; this.y = 0; } } },
};

// ===== 2. GPS route along the roads =====
const GPS = {
  dest: null, t: 0,
  graph() {
    if (this.N) return;
    const N = [], E = [], add = (x, z) => { let i = N.findIndex(n => Math.hypot(n.x - x, n.z - z) < 3); if (i < 0) { i = N.length; N.push({ x, z }); E.push([]); } return i; }, link = (a, b) => { if (a === b) return; const d = Math.hypot(N[a].x - N[b].x, N[a].z - N[b].z); E[a].push([b, d]); E[b].push([a, d]); };
    for (const R of ROADS) {
      // split long segments so junctions in the middle of a segment can attach
      let prev = null;
      for (let i = 0; i < R.pts.length; i++) {
        const [x, z] = R.pts[i];
        if (prev !== null) { const p = N[prev], L = Math.hypot(x - p.x, z - p.z), n = Math.ceil(L / 20); let last = prev; for (let k = 1; k <= n; k++) { const q = add(U.lerp(p.x, x, k / n), U.lerp(p.z, z, k / n)); link(last, q); last = q; } prev = last; }
        else prev = add(x, z);
      }
    }
    for (let a = 0; a < N.length; a++) for (let b = a + 1; b < N.length; b++) if (Math.hypot(N[a].x - N[b].x, N[a].z - N[b].z) < 16 && !E[a].some(e => e[0] === b)) link(a, b);
    this.N = N; this.E = E;
  },
  near(x, z) { let b = 0, bd = 1e9; this.N.forEach((n, i) => { const d = Math.hypot(n.x - x, n.z - z); if (d < bd) { bd = d; b = i; } }); return b; },
  route(from, to) {
    this.graph(); const s = this.near(from.x, from.z), t = this.near(to.x, to.z), N = this.N, dist = N.map(() => 1e12), prev = N.map(() => -1), done = new Set(); dist[s] = 0;
    for (;;) { let u = -1, ud = 1e12; for (let i = 0; i < N.length; i++) if (!done.has(i) && dist[i] < ud) { ud = dist[i]; u = i; } if (u < 0 || u === t) break; done.add(u); for (const [v, w] of this.E[u]) if (ud + w < dist[v]) { dist[v] = ud + w; prev[v] = u; } }
    const path = []; for (let u = t; u >= 0; u = prev[u]) path.unshift(N[u]); if (path[0] !== N[s]) return [from, to];
    const direct = Math.hypot(to.x - from.x, to.z - from.z);
    return direct < 60 ? [from, to] : [from, ...path, to];
  },
  places() { const seen = new Set(); return World.pois.filter(p => p.map && p.label && p.x < 2500 && !seen.has(p.label) && seen.add(p.label)).sort((a, b) => a.label.localeCompare(b.label, 'th')); },
  ui() {
    const L = this.places(), p = G.player.pos;
    UI.open('GPS นำทาง', null, () => `<p class="lead">🧭 เลือกจุดหมาย จะมีเส้นสีฟ้าบนถนนพาไป (เดินหรือขับรถก็ได้)${this.dest ? ` · กำลังนำทางไป <b>${esc(this.dest.label)}</b> <button class="btn ghost" data-a="gpsoff">ยกเลิก</button>` : ''}</p><input id="gpsQ" placeholder="ค้นหาสถานที่..." style="width:100%" oninput="for(const c of document.querySelectorAll('.gpsI'))c.hidden=!c.dataset.n.includes(this.value)"><div class="grid">${L.map((q, i) => `<div class="card gpsI" data-n="${esc(q.label)}"><div class="ci">${q.icon || '📍'}</div><div class="cb"><h4>${esc(q.label)}</h4><p class="dim">ห่าง ${(Math.hypot(q.x - p.x, q.z - p.z) / 1000).toFixed(2)} กม.</p><div class="row"><button class="btn" data-a="gpsgo" data-i="${i}">นำทาง</button></div></div></div>`).join('')}</div>`, { wide: true });
    this.list = L;
  },
  go(i) { const q = this.list[+i]; if (!q) return; this.dest = { x: q.x, z: q.z, label: q.label }; this.t = 0; UI.close(); UI.toast('เริ่มนำทางไป ' + q.label, '🧭'); },
  stop() { this.dest = null; if (this.mesh) this.mesh.visible = false; if (this.arrow) this.arrow.visible = false; },
  build(pts) {
    // a flat ribbon 1.1 m wide that follows the ground, sampled every 3 m
    const P = [];
    for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], L = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(1, Math.ceil(L / 3)); for (let k = 0; k < n; k++) P.push({ x: U.lerp(a.x, b.x, k / n), z: U.lerp(a.z, b.z, k / n) }); }
    P.push(pts[pts.length - 1]);
    const pos = new Float32Array(P.length * 6), idx = [];
    P.forEach((p, i) => { const q = P[Math.min(i + 1, P.length - 1)], o = P[Math.max(i - 1, 0)], dx = q.x - o.x, dz = q.z - o.z, l = Math.hypot(dx, dz) || 1, nx = -dz / l * 0.55, nz = dx / l * 0.55, y = World.groundY(p.x, p.z) + 0.18; pos.set([p.x + nx, y, p.z + nz, p.x - nx, y, p.z - nz], i * 6); if (i < P.length - 1) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2); });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
    if (!this.mesh) { this.mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x29b6f6, transparent: true, opacity: 0.75, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })); this.mesh.renderOrder = 2; G.scene.add(this.mesh); }
    else { this.mesh.geometry.dispose(); this.mesh.geometry = g; }
    this.mesh.visible = true;
  },
  update(dt) {
    if (!this.dest) return; const me = G.driving ? G.driving.d : G.player.pos;
    if (G.inside || G.away) { if (this.mesh) this.mesh.visible = false; return; }
    const d = Math.hypot(this.dest.x - me.x, this.dest.z - me.z);
    if (d < 8) { UI.toast('ถึงจุดหมายแล้ว: ' + this.dest.label, '🏁'); this.stop(); return; }
    this.t -= dt; if (this.t <= 0) { this.t = 2; this.build(this.route({ x: me.x, z: me.z }, this.dest)); }
    if (!Contests.race && !(Life2.job) && Contests.hud) { Contests.hud.hidden = false; Contests.hud.textContent = `🧭 ${this.dest.label} · ${d >= 1000 ? (d / 1000).toFixed(1) + ' กม.' : Math.round(d) + ' ม.'}`; }
  },
};

// ===== 3. daily planner =====
const Planner = {
  items() {
    const L = [], h = S.time / 60;
    // the plan lists only what has a deadline or an appointment; routine chores (ripe crops, dry beds, animal feed) are seen on the farm itself
    if (S.billDue) L.push(['bill', '🧾', `จ่ายค่าน้ำค่าไฟ ${baht(S.billDue.elec + S.billDue.water)} ก่อน${RD(S.billDue.day)}`]);
    if (S.isp && S.isp.due) L.push(['isp', '📶', `จ่ายค่าอินเทอร์เน็ต ${baht(S.isp.due)}`]);
    if (S.isp && S.isp.appt) L.push(['appt', '🛠️', `ช่างติดเน็ตมา${RD(S.isp.appt.day)} ช่วง${S.isp.appt.slot === 'am' ? 'เช้า' : 'บ่าย'} ต้องอยู่ที่ไร่`]);
    const sh = Career.shift(); if (sh && !Career.st().done[S.day] && !Career.st().onLeave[S.day]) L.push(['job', '💼', `เข้างาน${JOBS2[Career.st().k].n} ${String(sh.start).padStart(2, '0')}:00`]);
    for (const a of (S.el || {}).apps || []) if (a.st === 'pay') L.push(['el' + a.no, '⚡', `ชำระค่าธรรมเนียมการไฟฟ้า ${a.no}`]);
    if (S.el && S.el.plan && S.el.plan.day >= S.day) L.push(['plan', '🔌', `ประกาศดับไฟ${RD(S.el.plan.day)} 09:00-15:00`]);
    const M = Maint.alerts().slice(0, 2); for (const m of M) L.push(m);
    const wk = Plan.wkSpot(); if (wk) L.push(['wk', '🧺', `ตลาดนัดสุดสัปดาห์ที่${wk.n}`]);
    const f = Plan.festToday(); if (f) L.push(['fest', f === 'songkran' ? '💦' : '🪷', f === 'songkran' ? 'สงกรานต์ที่ทุ่งทอง' : 'ลอยกระทงที่ภูผาใหม่']);
    for (const F of BIG_FIELDS) { const s = (S.fields || {})[F.id]; if (s && s.crop && S.day >= s.ready) L.push(['f' + F.id, '🚜', `เก็บเกี่ยว${FIELD_CROPS[s.crop].n}ที่${F.n}`]); }
    return L.slice(0, 6);
  },
  html() {
    const L = this.items(), chk = (S.plan10 = S.plan10 || {}).chk || {}, day = chk.day === S.day ? chk : { day: S.day };
    return `<p class="lead">📋 สิ่งที่ควรทำวันนี้ (${RD(S.day)} ${season().n}) · ${Phone.clock()}</p>${L.length ? `<div class="grid">${L.map(([k, i, t]) => `<div class="card" style="${day[k] ? 'opacity:.5' : ''}"><div class="ci">${day[k] ? '✅' : i}</div><div class="cb"><h4>${esc(t)}</h4><div class="row"><button class="btn ghost" data-a="todo" data-v="${k}">${day[k] ? 'ยกเลิกติ๊ก' : 'ทำแล้ว'}</button></div></div></div>`).join('')}</div>` : '<p class="empty">วันนี้ไม่มีอะไรค้าง พักผ่อนได้เลย 😊</p>'}`;
  },
  tick(k) { const P = S.plan10 = S.plan10 || {}; if (!P.chk || P.chk.day !== S.day) P.chk = { day: S.day }; P.chk[k] = !P.chk[k]; },
  // a phone message only on days with something that matters (a bill, a technician, a power cut), not every morning
  morning() { const n = this.items().filter(([k]) => /^(bill|isp|appt|plan|el)/.test(k)).length; if (n) Phone.msg('แผนวันนี้', `วันนี้มีเรื่องสำคัญ ${n} เรื่อง เปิดแอป "แผนวันนี้" ดูได้เลย`, false); },
};

// ===== 5. seasons that matter =====
{
  const _grow = grow;
  grow = function (p, h, rain) {
    const s = season().id;
    if (s === 'hot' && !rain && p.c) p.w = Math.max(0, p.w - h / 30);
    if (s === 'cool' && p.c && !inSeason(p.c)) h *= 0.85;
    return _grow(p, h, rain);
  };
}

// ===== 7. maintenance =====
const Maint = {
  st() { if (!S.mt) S.mt = { house: 100, ac: 100, dust: 0, broken: {} }; S.solarDust = S.mt.dust; return S.mt; },
  day() {
    const m = this.st(); m.house = Math.max(0, m.house - 0.6 - (S.weather.type === 'storm' ? 2 : 0));
    if (S.furn.aircon) { m.ac = Math.max(0, m.ac - (S.ac ? 2.5 : 0.5)); if (m.ac < 25 && !m.broken.ac && Math.random() < 0.35) { m.broken.ac = 1; S.ac = false; Phone.msg('บ้าน', 'แอร์เสีย! ไม่มีลมเย็นออกมา ต้องเรียกช่างล้างและซ่อมแอร์', false); } }
    if (Power.st().panels + Power.st().farm) m.dust = Math.min(0.3, m.dust + (S.weather.type === 'rain' ? -0.05 : 0.02)); m.dust = Math.max(0, m.dust); S.solarDust = m.dust;
    if (m.house < 40 && S.weather.type === 'rain' && Math.random() < 0.5) { S.mood = Math.max(0, (S.mood || 50) - 8); Phone.msg('บ้าน', 'หลังคารั่ว! น้ำหยดในบ้าน อารมณ์เสีย ควรซ่อมบำรุงบ้าน', false); }
  },
  alerts() {
    const m = this.st(), L = [];
    if (m.house < 50) L.push(['mh', '🏚️', `บ้านทรุดโทรม (${Math.round(m.house)}%) ควรซ่อมบำรุง`]);
    if (m.broken.ac) L.push(['mac', '❄️', 'แอร์เสีย ต้องซ่อม']); else if (S.furn.aircon && m.ac < 50) L.push(['mac', '❄️', `ควรล้างแอร์ (${Math.round(m.ac)}%)`]);
    if (m.dust > 0.12) L.push(['md', '☀️', `แผงโซลาร์มีฝุ่น ผลิตไฟลดลง ${Math.round(m.dust * 100)}%`]);
    for (const o of G.cars) if (o.d.cond != null && o.d.cond < 40) { L.push(['mc', '🔧', `${CARS[o.d.type].n} สภาพ ${Math.round(o.d.cond)}% ควรเข้าอู่`]); break; }
    return L;
  },
  html() {
    const m = this.st(), row = (i, n, v, btns) => `<div class="card"><div class="ci">${i}</div><div class="cb"><h4>${n}</h4><p class="dim">${v}</p><div class="row">${btns}</div></div></div>`;
    return `<p class="lead">🔧 ของทุกอย่างเสื่อมตามเวลา ดูแลเองประหยัดเงินแต่ใช้แรง หรือจ้างช่าง</p><div class="grid">
      ${row('🏠', 'สภาพบ้าน', `${Math.round(m.house)}% · ต่ำกว่า 40% หลังคารั่วตอนฝนตก`, `<button class="btn" data-a="mfix" data-v="house_diy">ซ่อมเอง (พลังงาน 25 + 600 ฿)</button><button class="btn ghost" data-a="mfix" data-v="house">จ้างช่าง 3,500 ฿</button>`)}
      ${S.furn.aircon ? row('❄️', 'แอร์', m.broken.ac ? 'เสีย! ใช้งานไม่ได้' : `${Math.round(m.ac)}% · ล้างทุก ๆ ช่วงเพื่อประหยัดไฟ`, `<button class="btn ghost" data-a="mfix" data-v="ac">${m.broken.ac ? 'ซ่อมแอร์ 1,800 ฿' : 'ล้างแอร์ 600 ฿'}</button>`) : ''}
      ${Power.st().panels + Power.st().farm ? row('☀️', 'แผงโซลาร์', `ฝุ่นเกาะ ผลิตไฟลดลง ${Math.round(m.dust * 100)}% (ฝนช่วยล้างได้บางส่วน)`, `<button class="btn" data-a="mfix" data-v="dust_diy">ล้างเอง (พลังงาน 12)</button><button class="btn ghost" data-a="mfix" data-v="dust">จ้างล้าง 800 ฿</button>`) : ''}</div>`;
  },
  fix(k) {
    const m = this.st(), pay = n => { if (S.money < n) { UI.toast('เงินไม่พอ', '💸'); return false; } S.money -= n; Bank2.log('ซ่อมบำรุง', -n); return true; };
    if (k === 'house_diy') { if (m.house > 95 || !useEnergy(25) || !pay(600)) return; fade(() => { tick(180); m.house = Math.min(100, m.house + 35); UI.toast('ซ่อมรอยรั่ว ทาสีใหม่ บ้านดีขึ้น', '🔨'); }); }
    if (k === 'house') { if (m.house > 95 || !pay(3500)) return; fade(() => { tick(60); m.house = 100; UI.toast('ช่างซ่อมบ้านเรียบร้อย', '🏠'); }); }
    if (k === 'ac') { if (!pay(m.broken.ac ? 1800 : 600)) return; m.broken.ac = 0; m.ac = 100; UI.toast('ช่างแอร์ล้าง/ซ่อมเรียบร้อย เย็นฉ่ำ ประหยัดไฟ', '❄️'); }
    if (k === 'dust_diy') { if (m.dust < 0.01 || !useEnergy(12)) return; fade(() => { tick(60); m.dust = 0; S.solarDust = 0; UI.toast('ล้างแผงโซลาร์สะอาด ผลิตไฟเต็มที่', '☀️'); }); }
    if (k === 'dust') { if (m.dust < 0.01 || !pay(800)) return; m.dust = 0; S.solarDust = 0; UI.toast('จ้างล้างแผงโซลาร์เรียบร้อย', '☀️'); }
  },
};
// a dirty air-con draws more power, a broken one can't be switched on
Power.extra.push(h => (S.ac && S.mt ? (1 - S.mt.ac / 100) * 0.4 : 0));
{ const _sa = SmartApp.act.bind(SmartApp); SmartApp.act = v => { if (v === 'ac' && S.mt && S.mt.broken.ac) { UI.toast('แอร์เสีย ต้องซ่อมก่อน (แอปแผนวันนี้ → ซ่อมบำรุง)', '❄️'); return; } return _sa(v); }; }

// ===== 8. big field crops =====
const Fields = {
  st() { return (S.fields = S.fields || {}); },
  init() {
    this.g = {};
    for (const F of BIG_FIELDS) {
      World.clearNear(F.x, F.z, 17, true); this.draw(F);
      World.pois.push({ kind: 'act', x: F.x, z: F.z - F.d / 2 - 1.5, r: 4, label: F.n, icon: '🚜', map: true, act: () => ({ icon: '🚜', label: this.label(F), fn: () => this.ui(F) }) });
    }
  },
  label(F) { const s = this.st()[F.id]; return !s ? `${F.n} ${F.rai} ไร่ (ขาย ${baht(F.price)})` : !s.crop ? `${F.n}: เลือกพืชที่จะปลูก` : S.day >= s.ready ? `${F.n}: ${FIELD_CROPS[s.crop].n} พร้อมเก็บเกี่ยว!` : `${F.n}: ${FIELD_CROPS[s.crop].n} เก็บได้${RD(s.ready)}`; },
  draw(F) {
    if (this.g[F.id]) World.outdoor.remove(this.g[F.id]);
    const s = this.st()[F.id], g = new THREE.Group(), y = World.groundY(F.x, F.z); g.position.set(F.x, y, F.z); World.outdoor.add(g); this.g[F.id] = g;
    for (const [sx, sz, w, d] of [[0, -F.d / 2, F.w, 0.1], [0, F.d / 2, F.w, 0.1], [-F.w / 2, 0, 0.1, F.d], [F.w / 2, 0, 0.1, F.d]]) U.mk(g, GEO.box, M.darkwood, [sx, 0.5, sz], [w || 0.1, 0.08, d || 0.1]);
    for (let i = 0; i <= 10; i++) { const t = i / 10; for (const sz of [-1, 1]) U.mk(g, GEO.box, M.darkwood, [-F.w / 2 + t * F.w, 0.4, sz * F.d / 2], [0.1, 0.8, 0.1]); }
    if (!s) { const p = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.7), new THREE.MeshStandardMaterial({ map: U.signTex(`ขายที่ดิน ${F.rai} ไร่`, { w: 512, h: 112, bg: '#c62828' }) })); p.position.set(0, 1.6, -F.d / 2 - 0.3); p.rotation.y = Math.PI; g.add(p); return; }
    U.mk(g, new THREE.PlaneGeometry(F.w - 0.4, F.d - 0.4), texMat('soil', 0x7a5236), [0, 0.04, 0], 1, [-Math.PI / 2, 0, 0]);
    if (s.crop) {
      const C = FIELD_CROPS[s.crop], k = U.clamp(1 - (s.ready - S.day) / C.days, 0.15, 1), mat = mc(S.day >= s.ready ? 0xd4b43a : C.col, { roughness: 0.9 });
      for (let r = 0; r < 9; r++) U.mk(g, GEO.box, mat, [0, 0.05 + 0.6 * k, -F.d / 2 + 1.6 + r * (F.d - 3.2) / 8], [F.w - 1.6, 1.2 * k, 0.9]);
    }
  },
  ui(F) {
    UI.open(F.n, null, () => {
      const s = this.st()[F.id];
      if (!s) return `<p class="lead">ที่ดินทำไร่ ${F.rai} ไร่ ติดถนน ราคา ${baht(F.price)} · ปลูกพืชไร่ขายโรงงาน ไม่ต้องรดน้ำทุกวัน (อาศัยน้ำฝน)</p><div class="row"><button class="btn" data-a="fbuy" data-v="${F.id}" ${S.money >= F.price ? '' : 'disabled'}>ซื้อที่ดิน</button></div>`;
      if (!s.crop) return `<p class="lead">เลือกพืชที่จะปลูก (ค่าเมล็ด/ท่อน ปุ๋ย และจ้างไถเตรียมดิน คิดต่อไร่)</p><div class="grid">${Object.entries(FIELD_CROPS).map(([k, C]) => `<div class="card"><div class="ci">${C.i}</div><div class="cb"><h4>${C.n}</h4><p class="dim">ต้นทุน ${baht(C.cost * F.rai)} · ${C.days} วัน · ผลผลิต ~${U.fmt(C.kg)} กก./ไร่ · ราคาโรงงาน ~${C.price} ฿/กก. (รวม ~${baht(C.kg * C.price * F.rai)})</p><div class="row"><button class="btn" data-a="fplant" data-v="${F.id}" data-k="${k}" ${S.money >= C.cost * F.rai ? '' : 'disabled'}>ปลูก</button></div></div></div>`).join('')}</div>`;
      const C = FIELD_CROPS[s.crop], ready = S.day >= s.ready, tr = G.cars.some(o => o.d.type === 'tractor' || o.d.type === 'shovel');
      return `<p class="lead">${C.i} ${C.n} ${F.rai} ไร่ · ${ready ? 'พร้อมเก็บเกี่ยว!' : `เก็บเกี่ยวได้${RD(s.ready)}`}${s.dry ? ` · หน้าแล้งทำให้ผลผลิตลด ${s.dry * 5}%` : ''}</p>${ready ? `<div class="row"><button class="btn" data-a="fharv" data-v="${F.id}" data-k="own" ${tr ? '' : 'disabled'}>${tr ? 'เก็บเกี่ยวด้วยรถไถของเรา (พลังงาน 20)' : 'ต้องมีรถไถ/รถตัก'}</button><button class="btn ghost" data-a="fharv" data-v="${F.id}" data-k="hire">จ้างรถเกี่ยว (หัก 12% ของรายได้)</button></div>` : ''}`;
    });
  },
  buy(id) { const F = BIG_FIELDS.find(f => f.id === id); if (this.st()[id] || S.money < F.price) return; S.money -= F.price; Bank2.log('ซื้อที่ดินทำไร่', -F.price); this.st()[id] = { crop: null }; this.draw(F); Life2.note('ซื้อที่ดินทำไร่ ' + F.rai + ' ไร่'); },
  plant(id, k) { const F = BIG_FIELDS.find(f => f.id === id), s = this.st()[id], C = FIELD_CROPS[k]; if (!s || s.crop || S.money < C.cost * F.rai) return; S.money -= C.cost * F.rai; Bank2.log('ต้นทุนปลูกพืชไร่', -C.cost * F.rai); Object.assign(s, { crop: k, ready: S.day + C.days, dry: 0 }); this.draw(F); UI.close(); UI.toast(`จ้างไถและปลูก${C.n}เรียบร้อย เก็บได้${RD(s.ready)}`, C.i); },
  harvest(id, how) {
    const F = BIG_FIELDS.find(f => f.id === id), s = this.st()[id]; if (!s || !s.crop || S.day < s.ready) return;
    if (how === 'own' && !useEnergy(20)) return;
    const C = FIELD_CROPS[s.crop], kg = Math.round(C.kg * F.rai * (0.85 + Math.random() * 0.3) * (1 - (s.dry || 0) * 0.05)), gross = Math.round(kg * C.price * (0.92 + Math.random() * 0.16)), net = how === 'own' ? gross : Math.round(gross * 0.88);
    UI.close(); fade(() => { tick(how === 'own' ? 240 : 60); earn(net); S.stats.harvest += Math.round(kg / 100); Bank2.income('ขายพืชไร่ให้โรงงาน', net); Prog.add(60); s.crop = null; this.draw(F); UI.toast(`เก็บ${C.n}ได้ ${U.fmt(kg)} กก. ขายโรงงานได้ ${baht(net)}`, C.i); });
  },
  day() { for (const F of BIG_FIELDS) { const s = this.st()[F.id]; if (!s) continue; if (s.crop && season().id === 'hot' && S.weather.type === 'sunny') s.dry = Math.min(6, (s.dry || 0) + 1); this.draw(F); } },
};

// ===== 10. performance =====
const Perf2 = {
  run() {
    // buildings never move after the world is built: skip recomputing their matrices every frame
    let frozen = 0, shadows = 0;
    World.outdoor.updateMatrixWorld(true);
    World.outdoor.traverse(o => {
      if (o.userData.staticB) o.traverse(c => { if (c.matrixAutoUpdate) { c.matrixAutoUpdate = false; frozen++; } });
      if (o.isMesh && o.castShadow) { if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); const s = o.getWorldScale(new THREE.Vector3()), r = o.geometry.boundingSphere.radius * Math.max(s.x, s.y, s.z); if (r < 0.22) { o.castShadow = false; shadows++; } }
    });
    this.info = { frozen, shadows };
  },
};
{ const _b = World.building.bind(World); World.building = function (o) { const g = _b(o); g.userData.staticB = 1; return g; }; }

const Plan10 = {
  init() {
    DrivePad.init(); Maint.st(); Fields.init();
    APPS.splice(1, 0, { id: 'today', i: '📋', n: 'แผนวันนี้' }, { id: 'gps', i: '🧭', n: 'GPS นำทาง' });
    Phone.apps.today = () => Planner.html() + Maint.html();
    Phone.apps.gps = () => { setTimeout(() => { Phone.app = null; UI.close(); GPS.ui(); }, 0); return ''; };
    // townspeople of ทุ่งทอง / ภูผาใหม่ walk to their restaurant at lunch
    const _menu = UI.menu.bind(UI); UI.menu = () => { _menu(); const r = UI.cur.render; UI.cur.render = t => r(t).replace('<button class="btn danger" data-a="newgame">', `<h5>🖐️ ขนาดปุ่มบนจอ</h5><div class="row"><button class="btn ghost" data-a="btnsize" data-v="small">เล็ก</button><button class="btn ghost" data-a="btnsize" data-v="">ปกติ</button><button class="btn ghost" data-a="btnsize" data-v="big">ใหญ่</button></div><button class="btn danger" data-a="newgame">`); UI.renderBody(); };
    const _sched = Social2.sched.bind(Social2);
    Social2.sched = n => { const wk = Plan.wkSpot(), h = S.time / 60; if (!n.townRes && wk && wk.k === 'village' && h >= 9 && h < 15 && Math.random() < 0.35) { const a = Math.random() * TAU; n._sched = { x: wk.x + Math.cos(a) * 3, z: wk.z + Math.sin(a) * 3 }; n.doing = 'เดินตลาดนัดสุดสัปดาห์'; return true; } return _sched(n); };
    setTimeout(() => Perf2.run(), 2000);
    // a spouse from ทุ่งทอง / ภูผาใหม่ / far towns only exists after those towns are built
    { const r = Social.st(); if (r.stage === 'married' && r.partner) Social.moveIn(r.partner); }
  },
  hour(h) {
    const partner = Social.st().stage === 'married' ? Social.st().partner : null;
    for (const n of G.npcs) if (n.townRes && n.circ && n.name !== partner) {
      if (!n.circ0) n.circ0 = { ...n.circ };
      // lunch from 12:00; any later hour sends them back, even if a long task skipped 13:00
      if (h === 12) { const thong = n.x > 0; n.circ = kerbSpot(thong ? 164 : -98.5, thong ? -278 : -406, thong ? -1 : 1, 1.4); n.doing = 'กินข้าวกลางวัน'; }
      else if (n.doing === 'กินข้าวกลางวัน') { n.circ = { ...n.circ0 }; n.doing = ''; }
    }
  },
  day() { Maint.day(); Fields.day(); Planner.morning(); },
  update(dt) { DrivePad.update(); GPS.update(dt); },
};
Object.assign(UI.H, {
  gpsgo: d => GPS.go(d.i), gpsoff: () => { GPS.stop(); UI.close(); }, todo: d => Planner.tick(d.v), mfix: d => Maint.fix(d.v),
  fbuy: d => (d.k ? Bank2.buy(d.k, +d.v) : Fields.buy(d.v)),   // v162: the bank (mutual fund, data-k) and the field shop (data-v only) both used this name; the later one hid the bank's fplant: d => Fields.plant(d.v, d.k), fharv: d => Fields.harvest(d.v, d.k),
  btnsize: d => { S.btnSize = d.v; document.body.classList.toggle('bigbtn', d.v === 'big'); document.body.classList.toggle('smallbtn', d.v === 'small'); },
});
