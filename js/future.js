'use strict';
// ---------- Modern tech that really changes the day: farm robot, delivery drones, vertical hydroponic farm,
// AI market oracle, VR headset, fibre internet, cordless battery farm tools, a smart TV with video calls,
// and electric shuttle buses between the towns ----------
const FUT = {
  farmbot: { n: 'หุ่นยนต์ผู้ช่วยฟาร์ม "สุขใจบอท"', i: '🤖', price: 89000, desc: 'หุ่นยนต์ฮิวแมนนอยด์เดินเก็บผักที่สุกและรดน้ำแปลงที่แห้งให้ทุกชั่วโมง 6:00-18:00' },
  dronehub: { n: 'สถานีโดรนส่งของ', i: '🛸', price: 25000, desc: 'ของที่สั่งออนไลน์บินมาส่งภายในชั่วโมง ไม่ต้องรอพรุ่งนี้' },
  vfarm: { n: 'ฟาร์มผักแนวตั้งไฮโดรโปนิกส์ AI', i: '🥬', price: 120000, desc: 'อาคาร 4 ชั้นปลูกผักด้วยไฟ LED ได้ผักสดวันละ 10-14 ชิ้นทุกเช้า ใช้ไฟ 0.35 kW' },
  oracle: { n: 'เซิร์ฟเวอร์ AI วิเคราะห์ตลาด', i: '📊', price: 19900, desc: 'แอป "AI ตลาด" ทำนายราคาพรุ่งนี้ บอกว่าอะไรควรขายวันนี้ อะไรควรเก็บไว้' },
  vrset: { n: 'แว่น VR/MR รุ่นล่าสุด', i: '🥽', price: 24900, desc: 'เที่ยวอวกาศ ดูคอนเสิร์ต ฟิตเนส VR ฝึกขับรถเสมือนจริง วันละ 1 ครั้ง' },
  fiber: { n: 'อินเทอร์เน็ตไฟเบอร์ 1Gbps + เราเตอร์ WiFi 6', i: '📶', price: 6900, desc: 'เน็ตบ้านแรงและเสถียร: รายได้ไลฟ์สตรีม +30% งานออนไลน์ +100 ฿' },
  powertools: { n: 'ชุดเครื่องมือเกษตรไร้สายแบตลิเธียม', i: '🔋', price: 8900, desc: 'เครื่องตัดหญ้า เลื่อย และเครื่องพ่นแบบแบตเตอรี่ ทำงานในไร่เหนื่อยน้อยลง 15%' },
  smarttv: { n: 'สมาร์ททีวี 65" พร้อมกล้องวิดีโอคอล', i: '📺', price: 25900, desc: 'ดูซีรีส์ อารมณ์ +10 และวิดีโอคอลกับเพื่อนสนิท ความสนิท +0.2 วันละครั้ง' },
};
SHOPS.evcenter.tabs.push({ n: '🏠 เทคโนโลยีสมัยใหม่', items: Object.keys(FUT).map(k => 'fut:' + k) });
ENTRY_KINDS.fut = id => { const F = FUT[id]; return { icon: F.i, name: F.n, desc: F.desc, price: F.price, block: Fut.has(id) ? 'มีแล้ว' : '', buy: () => Fut.buy(id) }; };
for (const k of ['vrset', 'smarttv']) { FURN[k] = { n: FUT[k].n, i: FUT[k].i, price: FUT[k].price }; MOVABLE.push(k); }
// electric shuttle bus stops (farm gate, village, both towns, seaside market)
const EBUS_STOPS = [   // every stop stands at the kerb of a road, front to the road (r), and at least ~25 m from the next stop
  { k: 'farm', n: 'ป้ายรถบัสหน้าไร่', x: -6.6, z: -62, r: 1.571 },
  { k: 'village', n: 'ป้ายรถบัสหมู่บ้านสุขใจ', x: 6.6, z: -205.5, r: -1.571 },
  { k: 'thong', n: 'ป้ายรถบัสเมืองทุ่งทอง', x: 175.2, z: -308.2, r: -1.382 },
  { k: 'phupha', n: 'ป้ายรถบัสเมืองภูผาใหม่', x: -111.6, z: -434, r: 1.566 },
  { k: 'seaside', n: 'ป้ายรถบัสตลาดริมทะเล', x: 358.3, z: -371.5, r: -3.119 },
];
for (const p of EBUS_STOPS) FLAT_PADS.push({ x: p.x, z: p.z, r: 4 });
const VFARM = { x: -58, z: -27 };
FLAT_PADS.push({ x: VFARM.x, z: VFARM.z, r: 7 });

const Fut = {
  has(k) { return !!(S.fut && S.fut[k]) || (FURN[k] && S.furn[k]); },
  buy(k) {
    S.fut = S.fut || {}; S.fut[k] = 1; if (FURN[k]) { S.furn[k] = 1; World.buildInterior(S.up.house, S); World.interior.visible = G.inside; }
    Life2.note('ซื้อ' + FUT[k].n + ' ' + FUT[k].i); Prog.add(40);
    if (k === 'farmbot') this.spawnBot(); if (k === 'vfarm' || k === 'dronehub' || k === 'fiber') this.visual();
    UI.toast(`${FUT[k].n} พร้อมใช้งาน!`, FUT[k].i);
  },
  init() {
    // systems taken out of the game: give the money back once
    const gone = { evtol: 450000, exosuit: 59000, hologram: 35000, satnet: 15900 }; let back = 0;
    for (const k in gone) if ((S.fut && S.fut[k]) || S.furn[k]) { back += gone[k]; if (S.fut) delete S.fut[k]; delete S.furn[k]; }
    if (back) { S.money += back; Phone.msg('ศูนย์ EV & พลังงานสะอาด', `เลิกจำหน่ายสินค้าบางรายการ คืนเงินให้คุณเต็มจำนวน ${baht(back)}`); }
    for (const p of EBUS_STOPS) {
      const g = new THREE.Group(), y = World.groundY(p.x, p.z); g.position.set(p.x, y, p.z); g.rotation.y = p.r || 0; World.outdoor.add(g); World.clearNear(p.x, p.z, 3.5, true);
      U.mk(g, U.box(4.4, 0.15, 2.2, 2), M.stone, [0, 0.07, 0]);
      for (const sx of [-2, 2]) U.mk(g, GEO.box, mc(0x90a4ae, { metalness: 0.5 }), [sx, 1.3, -0.8], [0.1, 2.6, 0.1]);
      U.mk(g, GEO.box, mc(0x00897b), [0, 2.65, -0.3], [4.6, 0.12, 1.8]); U.mk(g, GEO.box, mc(0xb3e5fc, { transparent: true, opacity: 0.4, roughness: 0.1 }), [0, 1.3, -0.95], [4, 2.2, 0.05]);
      U.mk(g, GEO.box, M.wood, [0, 0.5, -0.6], [3, 0.08, 0.45]);
      const sg = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.5), new THREE.MeshStandardMaterial({ map: U.signTex(p.n, { w: 512, h: 96, bg: '#00897b' }) })); sg.position.set(0, 2.95, 0.62); g.add(sg);
      { const b = l2w(p.x, p.z, p.r || 0, 0, -0.9); Col.box(b.x, b.z, 2.2, 0.15, p.r || 0); const f = l2w(p.x, p.z, p.r || 0, 0, 0.8); p.px = f.x; p.pz = f.z; }
      World.pois.push({ kind: 'act', x: p.px, z: p.pz, r: 2.4, label: p.n, icon: '🚌', map: true, act: () => ({ icon: '🚌', label: 'นั่งรถบัสไฟฟ้าไปเมืองอื่น (40-80 ฿)', fn: () => this.busUI(p.k) }) });
    }
    this.visual(); if (this.has('farmbot')) this.spawnBot();
    // cordless battery tools: farm work costs less energy
    const _cm = Life2.costMult.bind(Life2); Life2.costMult = () => _cm() * (this.has('powertools') ? 0.85 : 1);
    // online orders through the drone hub arrive within the hour
    APPS.splice(4, 0, { id: 'oracle', i: '📊', n: 'AI ตลาด' });
    Phone.apps.oracle = () => this.oracleHTML();
    const _buy = UI.H.buy; UI.H.buy = d => { const online = UI.shopId === 'online', m = S.money; _buy(d); if (online && this.has('dronehub') && S.mail.length) UI.toast('โดรนจะนำของมาส่งภายใน 1 ชั่วโมง', '🛸'); };
    { const _sj = Life2.startJob.bind(Life2); Life2.startJob = k => { const J = PT_JOBS.find(j => j.k === k); if (k === 'online' && this.has('fiber') && J && !J._s) { J._s = 1; J.pay += 100; const r = _sj(k); setTimeout(() => { J.pay -= 100; delete J._s; }, 3000); return r; } return _sj(k); }; }
    Power.extra.push(h => (this.has('vfarm') ? 0.35 : 0) + (this.has('farmbot') && (h < 6 || h >= 18) ? 0.4 : 0) + (this.has('dronehub') ? 0.05 : 0));
  },
  // ----- visuals outdoors: vertical farm tower, drone hub, fibre box on the garage -----
  visual() {
    if (this.g) World.outdoor.remove(this.g); const g = new THREE.Group(); World.outdoor.add(g); this.g = g;
    if (this.has('vfarm')) {
      if (!this.vcol) World.clearNear(VFARM.x, VFARM.z, 7, true);
      const x = VFARM.x, z = VFARM.z, y = World.groundY(x, z), glass = mc(0x80deea, { roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.45 }), led = new THREE.MeshBasicMaterial({ color: 0xe040fb, toneMapped: false });
      U.mk(g, U.box(9, 0.3, 7, 2), M.stone, [x, y + 0.15, z]);
      for (let f = 0; f < 4; f++) { U.mk(g, GEO.box, mc(0xeceff1), [x, y + 0.3 + f * 2.4, z], [8.6, 0.15, 6.6]); for (let r = 0; r < 3; r++) { U.mk(g, GEO.box, mc(0x43a047, { roughness: 0.8 }), [x, y + 0.6 + f * 2.4, z - 2 + r * 2], [7.6, 0.25, 0.6]); U.mk(g, GEO.box, led, [x, y + 2.3 + f * 2.4, z - 2 + r * 2], [7.4, 0.04, 0.12]); } }
      U.mk(g, GEO.box, glass, [x, y + 5, z], [8.8, 9.8, 6.8]); U.mk(g, GEO.box, mc(0x455a64), [x, y + 10, z], [9, 0.3, 7]);
      const sg = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.7), new THREE.MeshStandardMaterial({ map: U.signTex('ฟาร์มแนวตั้ง AI', { w: 512, h: 96, bg: '#2e7d32' }) })); sg.position.set(x, y + 10.6, z + 3.52); g.add(sg);
      if (!this.vcol) { this.vcol = Col.box(x, z, 4.6, 3.6); World.pois.push({ kind: 'act', x: x, z: z + 5, r: 2.8, label: 'ฟาร์มแนวตั้ง AI', icon: '🥬', act: () => ({ icon: '🥬', label: `ฟาร์มแนวตั้ง: เก็บผลผลิต (${(S.vf || []).length} ชิ้นรออยู่)`, fn: () => this.collect() }) }); }
    }
    if (this.has('dronehub')) { const p = l2w(HOUSE_POS.x, HOUSE_POS.z, 0, 6.5, 5), y = World.groundY(p.x, p.z); U.mk(g, GEO.cyl, mc(0x263238), [p.x, y + 0.6, p.z], [0.9, 1.2, 0.9]); U.mk(g, GEO.cyl, new THREE.MeshBasicMaterial({ color: 0x00e5ff, toneMapped: false }), [p.x, y + 1.22, p.z], [0.8, 0.03, 0.8]); this.hub = { x: p.x, y: y + 1.3, z: p.z }; }
    if (this.has('fiber')) { const p = l2w(GARAGE.x, GARAGE.z, GARAGE.rot, GARAGE.w / 4, -GARAGE.d / 2 - 0.1), y = World.groundY(p.x, p.z); U.mk(g, GEO.box, mc(0xeceff1), [p.x, y + 1.5, p.z], [0.12, 0.4, 0.3]); U.mk(g, GEO.box, new THREE.MeshBasicMaterial({ color: 0x69f0ae, toneMapped: false }), [p.x + 0.07, y + 1.6, p.z], [0.01, 0.04, 0.12]); }
  },
  // ----- farm robot -----
  spawnBot() {
    if (this.bot) return;
    const g = new THREE.Group(), w = mc(0xeceff1, { roughness: 0.3, metalness: 0.4 }), dk = mc(0x37474f, { roughness: 0.4 }), eye = new THREE.MeshBasicMaterial({ color: 0x00e5ff, toneMapped: false });
    U.mk(g, GEO.box, w, [0, 1.15, 0], [0.55, 0.65, 0.32]); U.mk(g, GEO.sph, w, [0, 1.7, 0], [0.24, 0.26, 0.24]); U.mk(g, GEO.box, eye, [0, 1.72, 0.2], [0.3, 0.07, 0.05]);
    const legs = [], arms = [];
    for (const s of [-1, 1]) { const l = new THREE.Group(); l.position.set(s * 0.15, 0.82, 0); U.mk(l, GEO.box, dk, [0, -0.4, 0], [0.16, 0.8, 0.18]); g.add(l); legs.push(l); const a = new THREE.Group(); a.position.set(s * 0.36, 1.4, 0); U.mk(a, GEO.box, dk, [0, -0.32, 0], [0.12, 0.66, 0.14]); g.add(a); arms.push(a); }
    U.mk(g, GEO.box, mc(0x43a047), [0, 1.2, -0.24], [0.45, 0.45, 0.2]);
    g.position.set(FIELD.x0 - 2, 0, FIELD.z0 - 2); World.dyn.add(g); Models.setShadow && Models.setShadow(g, true);
    this.bot = { g, legs, arms, x: g.position.x, z: g.position.z, tx: null, tz: null, task: null, t: 0, log: { h: 0, w: 0 } };
  },
  // pick the next ripe or dry plot; the work happens when the robot reaches it
  botNext() {
    const b = this.bot, h = S.time / 60;
    if (h < 6 || h >= 18) { b.task = null; b.tx = FIELD.x0 - 2; b.tz = FIELD.z0 - 2; return; }
    let best = null, bd = 1e9;
    S.plots.forEach((p, i) => { if (!plotUnlocked(i, S.up.field) || !p.c) return; const ripe = stageOf(p) === 3, dry = p.w <= 0.02 && stageOf(p) < 3; if (!ripe && !dry) return; const c = plotCenter(i), d = Math.hypot(c.x - b.x, c.z - b.z) - (ripe ? 3 : 0); if (d < bd) { bd = d; best = { i, ripe }; } });
    if (best) { const c = plotCenter(best.i); b.task = best; b.tx = c.x - 1.1; b.tz = c.z; } else { b.task = null; b.tx = FIELD.x0 - 2 + Math.random() * 3; b.tz = FIELD.z0 - 2 - Math.random() * 2; }
  },
  botWork(t) {
    const p = S.plots[t.i]; if (!p.c) return; const b = this.bot;
    if (t.ripe && stageOf(p) === 3) { const C = CROPS[p.c]; const n = C.yield || 1, q = rollQuality(p); addItem(qid(p.c, q), n); S.stats.harvest += n; b.log.h += n; if (C.regrow) p.g = C.grow - C.regrow; else { p.c = null; p.g = 0; p.f = 0; } p.dry = 0; const pc = plotCenter(t.i); FX.burst(pc.x, 0.5, pc.z, 10, new THREE.Color(0.5, 0.85, 0.3), 2); }
    else if (p.w <= 0.02) { p.w = 1; b.log.w++; const pc = plotCenter(t.i); for (let k = 0; k < 8; k++) FX.spawn(pc.x, 1.2, pc.z, (Math.random() - 0.5) * 2, 1, (Math.random() - 0.5) * 2, 0.7, WATER_C, 5); }
    refreshPlot(t.i);
  },
  update(dt) {
    const b = this.bot; if (!b) return;
    b.t -= dt; if (b.tx == null || b.t <= 0) { b.t = 8; this.botNext(); }
    const dx = b.tx - b.x, dz = b.tz - b.z, d = Math.hypot(dx, dz), sp = d > 0.2 ? 1.6 : 0;
    if (sp) { b.x += dx / d * Math.min(d, sp * dt); b.z += dz / d * Math.min(d, sp * dt); b.g.rotation.y = Math.atan2(dx, dz); }
    else if (b.task) { this.botWork(b.task); b.task = null; b.t = 0.8; }
    const ph = G.t * 7, sw = sp ? Math.sin(ph) * 0.5 : 0;
    b.legs[0].rotation.x = sw; b.legs[1].rotation.x = -sw; b.arms[0].rotation.x = -sw * 0.8 + (!sp && b.task ? -1 : 0); b.arms[1].rotation.x = sw * 0.8;
    b.g.position.set(b.x, World.groundY(b.x, b.z) + (sp ? Math.abs(Math.sin(ph)) * 0.04 : 0), b.z);
    b.g.visible = !G.inside;
    // delivery drone flight
    const f = this.flight; if (f) { f.t += dt; const k = Math.min(1, f.t / 4), y = f.k < 0.5 ? 1 : 1; const p = f.t < 4 ? k : 1 - Math.min(1, (f.t - 5) / 4); f.g.position.set(U.lerp(f.x0, f.x1, Math.min(1, f.t / 4)), U.lerp(40, f.y1, p) * y, U.lerp(f.z0, f.z1, Math.min(1, f.t / 4))); f.g.children.forEach((c, i) => { if (i > 0) c.rotation.y += dt * 40; }); if (f.t > 9) { G.scene.remove(f.g); this.flight = null; } }
  },
  // ----- hourly & daily -----
  hour() {
    const h = Math.floor(S.time / 60) % 24;
    if (this.has('dronehub') && S.mail && S.mail.length) { const n = S.mail.length; Mail.deliver(); this.droneFly(); if (n) Phone.msg('โดรนส่งของ', `ส่งพัสดุ ${n} รายการถึงบ้านแล้ว`, false); }
    if (this.bot && h === 18 && (this.bot.log.h || this.bot.log.w)) { Phone.msg('สุขใจบอท', `สรุปงานวันนี้: เก็บผัก ${this.bot.log.h} ชิ้น รดน้ำ ${this.bot.log.w} แปลง 🤖`, false); this.bot.log = { h: 0, w: 0 }; }
  },
  day() {
    if (this.has('vfarm')) { const pool = Object.keys(CROPS).filter(k => !CROPS[k].tree && CROPS[k].grow <= 48); const n = 10 + ((Math.random() * 5) | 0); S.vf = S.vf || []; for (let i = 0; i < n; i++) S.vf.push(U.pick(pool)); if (S.vf.length > 60) S.vf = S.vf.slice(-60); }
    if (this.has('oracle')) { const t = this.tips(); if (t) Phone.msg('AI ตลาด', t, false); }
  },
  collect() { const L = S.vf || []; if (!L.length) { UI.toast('ยังไม่มีผักรอเก็บ มาใหม่พรุ่งนี้เช้า', '🥬'); return; } for (const c of L) addItem(c); S.stats.harvest += L.length; UI.toast(`เก็บผักไฮโดรโปนิกส์ ${L.length} ชิ้น สดสะอาดไร้สารเคมี`, '🥬'); S.vf = []; },
  droneFly() {
    if (!this.hub || this.flight) return;
    const g = new THREE.Group(); U.mk(g, GEO.box, mc(0x263238), [0, 0, 0], [0.7, 0.15, 0.7]); for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) U.mk(g, GEO.cyl, mc(0x90a4ae), [sx * 0.5, 0.1, sz * 0.5], [0.3, 0.02, 0.3]); U.mk(g, GEO.box, mc(0xbcaaa4), [0, -0.3, 0], [0.4, 0.35, 0.4]);
    G.scene.add(g); this.flight = { g, t: 0, x0: this.hub.x + 60, z0: this.hub.z - 60, x1: this.hub.x, z1: this.hub.z, y1: this.hub.y + 0.4 };
  },
  // ----- AI market oracle -----
  tomorrow(id) { const d = S.day; S.day = d + 1; const m = priceMult(id); S.day = d; return m; },
  oracleHTML() {
    if (!this.has('oracle')) return `<p class="empty">ต้องมีเซิร์ฟเวอร์ AI วิเคราะห์ตลาดก่อน (ศูนย์ EV & พลังงานสะอาดภูผา แผนกนวัตกรรม)</p>`;
    const ids = Object.keys(S.inv).filter(id => ITEMS[id] && ITEMS[id].sell && S.inv[id] > 0 && ['crop', 'product', 'fish', 'artisan'].includes(ITEMS[id].cat));
    const rows = ids.map(id => { const a = priceMult(id), b = this.tomorrow(id); return { id, a, b, d: (b - a) / a }; }).sort((x, y) => x.d - y.d);
    const crops = Object.keys(CROPS).filter(k => !CROPS[k].tree).map(k => ({ k, d: this.tomorrow(k) })).sort((a, b) => b.d - a.d).slice(0, 4);
    return `<p class="lead">📊 AI วิเคราะห์ราคาตลาดพรุ่งนี้ (แม่นยำ ~90%)</p>${rows.length ? `<div class="grid">${rows.slice(0, 10).map(r => `<div class="card"><div class="ci">${ITEMS[r.id].i}</div><div class="cb"><h4>${ITEMS[r.id].n} ×${S.inv[r.id]}</h4><p class="${r.d < -0.03 ? 'bad' : r.d > 0.03 ? 'good' : 'dim'}">${r.d < -0.03 ? '📉 ขายวันนี้เลย' : r.d > 0.03 ? '📈 เก็บไว้ขายพรุ่งนี้' : '➖ ราคาทรงตัว'} (${r.d > 0 ? '+' : ''}${Math.round(r.d * 100)}%)</p></div></div>`).join('')}</div>` : '<p class="empty">ยังไม่มีของขายในกระเป๋า</p>'}
      <h5>🌱 พืชที่ราคาพรุ่งนี้น่าสนใจ</h5><p class="lead">${crops.map(c => `${CROPS[c.k].i}${CROPS[c.k].n} ×${c.d.toFixed(2)}`).join(' · ')}</p>`;
  },
  tips() { const ids = Object.keys(S.inv).filter(id => ITEMS[id] && ITEMS[id].sell && S.inv[id] > 0 && ITEMS[id].cat === 'crop'); const up = ids.filter(id => this.tomorrow(id) > priceMult(id) * 1.05); return up.length ? `เก็บ ${up.slice(0, 3).map(id => ITEMS[id].n).join(', ')} ไว้ขายพรุ่งนี้ ราคาจะขึ้นค่ะ` : ''; },
  // ----- VR and smart TV (indoor furniture) -----
  place(W, has, placeK, w, d) {
    const act = (icon, label, fn) => ({ kind: 'act', icon, label, act: () => ({ icon, label, fn }) });
    if (has('vrset')) { const g = new THREE.Group(); U.mk(g, GEO.cyl, mc(0x263238), [0, 0.45, 0], [0.25, 0.9, 0.25]); U.mk(g, GEO.box, mc(0xfafafa, { roughness: 0.2 }), [0, 0.98, 0], [0.32, 0.14, 0.18]); placeK('vrset', g, -w / 2 + 1.2, 0.8, 0, 0.3, 0.3, act('🥽', 'ใส่แว่น VR', () => this.vrUI())); }
    if (has('smarttv')) { const g = new THREE.Group(); U.mk(g, GEO.box, mc(0x37474f), [0, 0.25, 0], [1.6, 0.5, 0.4]); U.mk(g, GEO.box, mc(0x111111, { roughness: 0.2 }), [0, 1.25, 0], [1.5, 0.86, 0.05]); U.mk(g, GEO.box, new THREE.MeshBasicMaterial({ color: 0x1e88e5, toneMapped: false }), [0, 1.25, 0.03], [1.42, 0.78, 0.01]); placeK('smarttv', g, -w / 2 + 0.4, -0.8, Math.PI / 2, 0.25, 0.8, act('📺', 'สมาร์ททีวี: ดูซีรีส์ / วิดีโอคอล', () => this.tvUI())); }
  },
  vrUI() {
    const L = [['space', '🚀', 'ทัวร์สถานีอวกาศ', 'อารมณ์ +20'], ['concert', '🎤', 'คอนเสิร์ตแถวหน้าสุด', 'อารมณ์ +15'], ['fit', '🥊', 'ฟิตเนสต่อยมวย VR', 'พลังงานสูงสุดถาวร +1'], ['world', '🗼', 'เที่ยวรอบโลก ปารีส-โตเกียว', 'อารมณ์ +12 บันทึกไดอารี่'], ['drive', '🏎️', 'ฝึกขับรถเสมือนจริง', 'ลดแต้มใบขับขี่ 1 แต้ม']];
    UI.open('แว่น VR', null, () => `<p class="lead">ใช้ได้วันละ 1 ครั้ง ${S.vrDay === S.day ? '(วันนี้ใช้แล้ว)' : ''}</p><div class="grid">${L.map(([k, i, n, e]) => `<div class="card"><div class="ci">${i}</div><div class="cb"><h4>${n}</h4><p class="dim">${e}</p><div class="row"><button class="btn" data-a="vrgo" data-v="${k}" ${S.vrDay === S.day ? 'disabled' : ''}>เริ่ม</button></div></div></div>`).join('')}</div>`);
  },
  vr(k) {
    if (S.vrDay === S.day) return; S.vrDay = S.day; UI.close();
    fade(() => {
      tick(60);
      if (k === 'space') { S.mood = Math.min(100, (S.mood || 50) + 20); UI.toast('ลอยตัวในสถานีอวกาศ มองเห็นโลกทั้งใบ!', '🚀'); }
      if (k === 'concert') { S.mood = Math.min(100, (S.mood || 50) + 15); UI.toast('ยืนแถวหน้าคอนเสิร์ต เสียงกระหึ่มมาก!', '🎤'); }
      if (k === 'fit') { S.fit = Math.min(30, (S.fit || 0) + 1); useEnergy(8); UI.toast(`เหงื่อท่วม! พลังงานสูงสุด +1 (รวม +${S.fit})`, '🥊'); }
      if (k === 'world') { S.mood = Math.min(100, (S.mood || 50) + 12); Life2.note('เที่ยวรอบโลกใน VR: หอไอเฟลและโตเกียวทาวเวอร์ 🗼'); UI.toast('เที่ยวปารีสต่อโตเกียวในชั่วโมงเดียว', '🗼'); }
      if (k === 'drive') { const s = Stations2.st(); if (s.points > 0) s.points--; UI.toast(`ฝึกขับปลอดภัยครบหลักสูตร แต้มใบขับขี่เหลือ ${s.points}`, '🏎️'); }
    });
  },
  tvUI() {
    const L = Object.entries(S.friends).filter(([, v]) => v >= 2).sort((a, b) => b[1] - a[1]).slice(0, 6);
    UI.open('สมาร์ททีวี 65 นิ้ว', null, () => `<div class="row"><button class="btn" data-a="tvwatch" ${S.tvDay === S.day ? 'disabled' : ''}>🍿 ดูซีรีส์ 1 ชม. (อารมณ์ +10)</button></div>
      <h5>📞 วิดีโอคอลกับเพื่อนสนิท (วันละครั้ง) ${S.callDay === S.day ? '· วันนี้โทรแล้ว' : ''}</h5>${L.length ? `<div class="row topics">${L.map(([n]) => `<button class="btn ghost" data-a="tvcall" data-v="${esc(n)}" ${S.callDay === S.day ? 'disabled' : ''}>📞 ${esc(n)}</button>`).join('')}</div>` : '<p class="empty">ต้องสนิทกับชาวบ้าน 2 หัวใจขึ้นไปก่อน</p>'}`);
  },
  tvWatch() { if (S.tvDay === S.day) return; if (S.powerOff) { UI.toast('ไฟดับอยู่', '🌑'); return; } S.tvDay = S.day; UI.close(); fade(() => { tick(60); S.mood = Math.min(100, (S.mood || 50) + 10); UI.toast(`ดูซีรีส์เรื่อง${U.pick(['หมอลำสะท้านทุ่ง', 'รักนะชาวไร่', 'สืบสวนเมืองทุ่งทอง'])} สนุกมาก`, '📺'); }); },
  tvCall(n) { if (S.callDay === S.day) return; S.callDay = S.day; Friends.add(n, 0.2); S.mood = Math.min(100, (S.mood || 50) + 5); UI.close(); UI.toast(`วิดีโอคอลคุยกับ${n}บนจอใหญ่ สนิทกันมากขึ้น`, '📞'); },
  // ----- electric shuttle bus -----
  busUI(from) {
    const here = EBUS_STOPS.find(p => p.k === from);
    UI.open('รถบัสไฟฟ้ารับส่งระหว่างเมือง', null, () => `<p class="lead">🚌 รถบัสไฟฟ้าวิ่งทุก 30 นาที ค่าโดยสารตามระยะทาง</p><div class="grid">${EBUS_STOPS.filter(p => p.k !== from).map(p => { const fee = this.fare(here, p); return `<div class="card"><div class="ci">🚏</div><div class="cb"><h4>${p.n}</h4><p class="dim">${baht(fee)} · ประมาณ ${this.mins(here, p)} นาที</p><div class="row"><button class="btn" data-a="bus" data-v="${p.k}" data-f="${from}" ${S.money >= fee ? '' : 'disabled'}>ขึ้นรถ</button></div></div></div>`; }).join('')}</div>`);
  },
  fare(a, b) { return Math.min(80, Math.max(40, Math.round(Math.hypot(a.x - b.x, a.z - b.z) / 50) * 5)); },
  mins(a, b) { return Math.max(10, Math.round(Math.hypot(a.x - b.x, a.z - b.z) / 8)); },
  bus(k, from) {
    const a = EBUS_STOPS.find(q => q.k === from), p = EBUS_STOPS.find(q => q.k === k); if (!a || !p) return;
    const fee = this.fare(a, p); if (S.money < fee) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(fee), '💸'); return; } if (G.driving) { UI.toast('ลงจากรถก่อน', '🚗'); return; }
    S.money -= fee; Bank2.log('ค่ารถบัส', -fee); S.busRides = (S.busRides || 0) + 1; UI.close();
    fade(() => { leaveIndoors(); tick(this.mins(a, p)); G.player.pos.set(p.x + 2.5, World.groundY(p.x + 2.5, p.z + 2), p.z + 2); snapCam(); UI.toast(`ถึง${p.n}แล้ว`, '🚌'); });
  },
};
Object.assign(UI.H, { vrgo: d => Fut.vr(d.v), tvwatch: () => Fut.tvWatch(), tvcall: d => Fut.tvCall(d.v), bus: d => Fut.bus(d.v, d.f) });
