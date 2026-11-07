'use strict';
// ---------- Life 7: one graphics level balanced for smoothness, a home button in every phone screen, clearer home
// decorating, a test mode for the next three weeks, applying for mains water like real life, and police/fire patrols ----------

// (graphics levels live in life9.js)

// ===== phone: every screen opened from the phone has a way back to the phone's home screen =====
const PhoneNav = {
  init() {
    const _close = UI.close.bind(UI), _open = UI.open.bind(UI);
    UI.close = (...a) => {
      const m = document.getElementById('modal');
      if (m && m.classList.contains('phone')) this.at = performance.now();
      else if (UI.cur && UI.cur.fromPhone) this.at = performance.now();
      return _close(...a);
    };
    UI.open = (title, tabs, render, opts) => {
      const r = _open(title, tabs, render, opts);
      // opened right after the phone (or a phone-opened screen) closed: it belongs to the phone
      if (!this.skip && performance.now() - (this.at || 0) < 400 && UI.cur && !document.getElementById('modal').classList.contains('phone')) {
        UI.cur.fromPhone = true; const fn = UI.cur.render;
        UI.cur.render = t => `<div class="row" style="margin:-2px 0 8px"><button class="btn ghost ph-back" data-a="phhome">‹ กลับหน้าหลักมือถือ</button></div>` + fn(t);
        UI.renderBody();
      }
      return r;
    };
    // the phone's own screens are never 'opened from the phone'
    const _po = Phone.open.bind(Phone); Phone.open = (...a) => { this.skip = true; try { return _po(...a); } finally { this.skip = false; } };
    UI.H.phhome = () => { UI.close(); setTimeout(() => Phone.open(), 0); };
  },
};

// ===== home decorating: a labelled button, a first-visit tip and a step-by-step guide =====
const DecoHelp = {
  init() {
    const b = document.getElementById('bDecor');
    if (b) { b.innerHTML = '🛋️<small style="display:block;font-size:10px;line-height:1">จัดบ้าน</small>'; b.title = 'จัดบ้าน: ย้าย/หมุนเฟอร์นิเจอร์ เปลี่ยนสีผนังและพื้น (H)'; }
    const css = document.createElement('style');
    css.textContent = '#bDecor.hint{animation:dhint 1.2s ease-in-out infinite}@keyframes dhint{50%{box-shadow:0 0 0 6px rgba(255,211,107,.55)}}';
    document.head.appendChild(css);
    const _dec = UI.decor.bind(UI);
    UI.decor = () => {
      _dec(); if (b) b.classList.remove('hint'); S.tips.deco = 1;
      const r = UI.cur.render;
      UI.cur.render = t => (t === 1 ? `<div class="card"><div class="ci">💡</div><div class="cb"><h4>วิธีย้ายของในบ้าน</h4><p class="dim">1) กดปุ่ม <b>ย้าย/หมุน</b> ที่ของที่ต้องการ (เตียง ครัว ตู้เย็น ตู้เสื้อผ้า หีบ โต๊ะคอม และเฟอร์นิเจอร์ที่ซื้อมา)<br>2) <b>ลากด้วยเมาส์หรือนิ้ว</b> ไปวางตรงไหนก็ได้ (หรือเดินพาไป / ปุ่มลูกศร)<br>3) กด <b>↻ หมุน (R)</b> แล้วกด <b>✔ วางตรงนี้ (E)</b> · ถ้าขึ้นสีแดงคือทับของอื่น ขยับออกนิดนึง</p></div></div>` : `<p class="dim">💡 เปลี่ยนสีผนังและพื้นได้ที่นี่ ส่วนการย้ายเตียงและเฟอร์นิเจอร์อยู่ที่แท็บ “เฟอร์นิเจอร์”</p>`) + r(t);
      UI.renderBody();
    };
  },
  update() {
    if (!G.inside || G.inRoom || G.inMine || S.tips.deco) return;
    const b = document.getElementById('bDecor'); if (b && !b.classList.contains('hint')) { b.classList.add('hint'); UI.toast('อยากย้ายเตียงหรือของในบ้าน? กดปุ่ม 🛋️ จัดบ้าน (หรือปุ่ม H)', '🛋️'); }
  },
};

// ===== test mode: 500 million baht and everything unlocked until 20 Nov 2026, then it switches itself off =====
const TEST_UNTIL = Date.parse('2026-11-20T23:59:59+07:00');
const TestMode = {
  on() { return false; },   // the old 500M / max-level test mode is retired: the test period is now handled by js/v39_testperiod.js (100M, level 1, then 50,000 + level 2 after 1 Dec 2569)
  apply() {
    if (!this.on() || !S) return;
    const t = S.test = S.test || {};
    if (!t.given) { t.given = 1; S.money = Math.max(S.money, 500000000); Bank2.log && Bank2.log('เงินทดสอบระบบ (โหมดทดสอบ)', 500000000); }
    // unlock: top level, driving licences, every seed and shop level gate
    if (S.lvl < MAX_LVL) { S.lvl = MAX_LVL; S.xp = 0; }
    // a brand-new game gets test money and levels only — ID card, driving licence and every permit must be applied for like real life
    if (G.fresh && !S.v36ng) S.v36ng = 1;
    if (!S.v36ng) { S.license = 1; S.lic2 = 1; S.licExp = S.day + 9999; S.licOld = 0; }
    if (S.tut !== 'done' && !(G.fresh || (S.g25 && S.g25.fresh))) S.tut = 'done';   // a brand-new game keeps its how-to-play guide
  },
  topUp() { if (!this.on()) return; S.money = Math.max(S.money, 500000000); UI.toast('เติมเงินทดสอบเป็น 500 ล้านบาทแล้ว', '🧪'); UI.hud && UI.hud(); },
  init() {
    if (!this.on()) return;
    this.apply();
    const left = Math.max(0, Math.ceil((TEST_UNTIL - Date.now()) / 86400000));
    setTimeout(() => UI.toast(`🧪 โหมดทดสอบ: เงิน 500 ล้าน ปลดล็อกทุกอย่าง (เหลืออีก ${left} วัน ถึง 20 พ.ย. 2569)`, '🧪'), 2500);
    const _menu = UI.menu.bind(UI);
    UI.menu = () => { _menu(); const r = UI.cur.render; UI.cur.render = t => `<div class="card"><div class="ci">🧪</div><div class="cb"><h4>โหมดทดสอบ (ถึง 20 พ.ย. 2569)</h4><p class="dim">${S.v36ng ? 'เงิน 500 ล้านบาท เลเวลสูงสุด ปลดล็อกแอปและร้านทั้งหมด (เซฟใหม่ไม่มีบัตรประชาชนและใบอนุญาตใดๆ — ต้องไปขอเองทุกใบ)' : 'เงิน 500 ล้านบาท เลเวลสูงสุด ใบขับขี่ทุกประเภท ปลดล็อกแอปและร้านทั้งหมด'} หลังวันที่ 20 พ.ย. โหมดนี้ปิดเอง</p><div class="row"><button class="btn" data-a="testtop">เติมเงินกลับเป็น 500 ล้าน</button></div></div></div>` + r(t); UI.renderBody(); };
    UI.H.testtop = () => { this.topUp(); UI.renderBody(); };
    // the start of a new game should begin in test mode too
    const _sm = Smart.morning; Smart.morning = function () { const r = _sm.apply(this, arguments); TestMode.apply(); return r; };
  },
};

// ===== mains water: apply like real life (PWA): documents, survey, fees, installation, then monthly bills =====
const WATER_SIZES = {
  half: { n: 'มาตร 1/2 นิ้ว (บ้านพักอาศัย)', dep: 300, fee: 2675, i: '🏠' },
  three: { n: 'มาตร 3/4 นิ้ว (บ้านหลังใหญ่/ร้านเล็ก)', dep: 1000, fee: 4950, i: '🏡' },
  one: { n: 'มาตร 1 นิ้ว (ร้านค้า/กิจการ)', dep: 2000, fee: 7350, i: '🏪' },
};
const WaterReq = {
  st() { const w = Water.st(); if (!w.req) w.req = {}; return w.req; },
  places() {
    const L = [{ id: 'home', n: 'บ้านหลัก (ไร่สุขใจ)', has: Water.st().meter }];
    const hb = S.hb && S.hb.lots || {};
    for (const [id, l] of Object.entries(hb)) if (l && l.design) L.push({ id, n: `บ้านที่สร้างแปลง ${id}${HOUSE_DESIGNS[l.design] ? ` (${HOUSE_DESIGNS[l.design].n})` : ''}`, has: false });
    return L;
  },
  stage(id) { const r = this.st()[id]; return id === 'home' && Water.st().meter && !r ? 'done' : r ? r.st : 'none'; },
  apply(id, size) {
    const r = this.st(); if (r[id] && r[id].st !== 'none') return;
    if (!useEnergy(5)) return;
    r[id] = { st: 'survey', size, day: S.day + 1, no: 'กปภ-' + String(10000 + ((Math.random() * 89999) | 0)) };
    UI.toast(`ยื่นคำร้องขอใช้น้ำแล้ว เลขที่ ${r[id].no} เจ้าหน้าที่จะมาสำรวจพรุ่งนี้`, '🚰'); saveGame(true);
  },
  pay(id) {
    const r = this.st()[id]; if (!r || r.st !== 'pay') return; const X = WATER_SIZES[r.size], v = X.dep + X.fee + (r.extra || 0);
    if (S.money < v) { UI.toast('เงินไม่พอ', '💸'); return; }
    S.money -= v; Bank2.log('ค่าธรรมเนียมขอใช้น้ำประปา + ค่าประกันมาตร', -v); r.st = 'install'; r.day = S.day + 2;
    UI.toast('ชำระแล้ว ช่างจะมาติดตั้งมาตรภายใน 2 วัน', '🧾'); saveGame(true);
  },
  day() {
    for (const [id, r] of Object.entries(this.st())) {
      if (r.st === 'survey' && S.day >= r.day) { r.extra = Math.round(80 + Math.random() * 12) * 10; r.st = 'pay'; Phone.msg('การประปาส่วนภูมิภาค', `สำรวจแล้ว: เดินท่อเพิ่ม ${r.extra / 100 * 2 | 0} เมตร ค่าใช้จ่ายรวม ${baht(WATER_SIZES[r.size].dep + WATER_SIZES[r.size].fee + r.extra)} ชำระได้ในแอปขอใช้น้ำประปา`); }
      if (r.st === 'install' && S.day >= r.day) { r.st = 'done'; if (id === 'home') Water.st().meter = true; Phone.msg('การประปาส่วนภูมิภาค', `ติดตั้งมาตรวัดน้ำเรียบร้อย (${r.no}) เปิดใช้น้ำได้แล้ว บิลค่าน้ำมาทุกสัปดาห์`); }
    }
  },
  // every connected extra house uses a little water too
  extraUse() { return Object.entries(this.st()).filter(([id, r]) => id !== 'home' && r.st === 'done').length * 0.3; },
  app() {
    const docs = ['สำเนาบัตรประชาชน', 'สำเนาทะเบียนบ้าน', 'หลักฐานกรรมสิทธิ์ที่ดิน (โฉนด) หรือสัญญาเช่า', 'หนังสือมอบอำนาจ (ถ้าให้คนอื่นยื่นแทน)'];
    const steps = ['ยื่นคำร้อง + เอกสาร', 'เจ้าหน้าที่สำรวจหน้างาน (1 วัน)', 'ชำระค่าธรรมเนียมและค่าประกันมาตร', 'ติดตั้งมาตรวัดน้ำ (2 วัน)', 'ใช้น้ำได้ บิลรายเดือน'];
    return `<p class="lead">🚰 ขอใช้น้ำประปา (กปภ.) · ขั้นตอน: ${steps.map((s, i) => `${i + 1}) ${s}`).join(' → ')}</p><p class="dim">เอกสาร: ${docs.join(' · ')}</p>` +
      this.places().map(p => {
        const st = this.stage(p.id), r = this.st()[p.id];
        const body = st === 'done' ? '<p class="dim">✅ มีมาตรวัดน้ำแล้ว</p>'
          : st === 'survey' ? `<p class="dim">📋 รอเจ้าหน้าที่สำรวจ (${RD(r.day)}) · เลขที่ ${r.no}</p>`
          : st === 'pay' ? `<p class="dim">💳 สำรวจแล้ว ค่าใช้จ่าย ${baht(WATER_SIZES[r.size].dep + WATER_SIZES[r.size].fee + r.extra)} (ค่าประกันมาตร ${baht(WATER_SIZES[r.size].dep)} คืนเมื่อเลิกใช้)</p><div class="row"><button class="btn" data-a="wreqpay" data-v="${p.id}">ชำระเงิน</button></div>`
          : st === 'install' ? `<p class="dim">🔧 ช่างจะมาติดตั้ง${RD(r.day)}</p>`
          : `<div class="row">${Object.entries(WATER_SIZES).map(([k, X]) => `<button class="btn ghost" data-a="wreq" data-v="${p.id}" data-k="${k}">${X.i} ${X.n} · ~${baht(X.dep + X.fee)}</button>`).join('')}</div>`;
        return `<div class="card"><div class="ci">${st === 'done' ? '💧' : '🚱'}</div><div class="cb"><h4>${esc(p.n)}</h4>${body}</div></div>`;
      }).join('');
  },
  init() {
    const _hb = HomeBuild.build.bind(HomeBuild);
    HomeBuild.build = (id, k) => { const had = S.hb && S.hb.lots[id] && S.hb.lots[id].design; const r = _hb(id, k); if (!had && S.hb.lots[id] && S.hb.lots[id].design) setTimeout(() => Phone.msg('การประปาส่วนภูมิภาค', 'บ้านใหม่ของคุณยังไม่มีน้ำประปา ยื่นคำร้องขอใช้น้ำได้ในแอป “ขอใช้น้ำประปา” (ต้องใช้บัตรประชาชน ทะเบียนบ้าน และโฉนด)'), 1500); return r; };
    const _use = Water.day.bind(Water); Water.day = () => { _use(); const x = this.extraUse(); if (x) Water.use(x); };
    APPS.push({ id: 'wreq', i: '🚰', n: 'ขอใช้น้ำประปา' }); Phone.apps.wreq = () => this.app();
    if (typeof APP_GROUPS !== 'undefined') APP_GROUPS[2][1].push('wreq');
    Object.assign(UI.H, { wreq: d => { this.apply(d.v, d.k); UI.renderBody(); }, wreqpay: d => { this.pay(d.v); UI.renderBody(); } });
  },
};

// ===== police and fire patrols: 1-2 rounds a day each, lights flashing and sirens when they pass you =====
const PATROLS = [{ k: 'police', h: 10 }, { k: 'police', h: 19.5 }, { k: 'fire', h: 14 }];
const Patrol = {
  list: [],
  init() { this.last = S.time; },
  start(kind) {
    if (!G.routes || this.list.some(p => p.kind === kind)) return;
    const m = Emergency.vehicleModel(kind); World.dyn.add(m.g);
    // the traffic code drives anything with these fields; light materials may be missing on some models
    const dummy = () => new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0 });
    m.lightM = m.lightM || dummy(); m.tailM = m.tailM || dummy(); m.glowM = m.glowM || dummy(); m.wheels = m.wheels || []; m.r = m.r || 0.35;
    const st = STATIONS[kind], R = G.routes[0], s = nearestS(R, st.x, st.z).s;
    const t = Object.assign(m, { R, s, dir: -1, speed: 0, max: 9, turn: -1, x: 0, z: 0, h: 0, vh: null, block: 0, patrol: kind });
    placeTraffic(t, 0); G.traffic.push(t);
    this.list.push({ kind, t, until: S.time + 100, sirenT: 0 });
    if (Math.hypot(G.player.pos.x - st.x, G.player.pos.z - st.z) < 150) UI.toast(kind === 'police' ? 'รถตำรวจออกตรวจตราในพื้นที่ 🚓' : 'รถดับเพลิงออกตรวจความปลอดภัย 🚒', kind === 'police' ? '🚓' : '🚒');
  },
  end(p) {
    const i = G.traffic.indexOf(p.t); if (i >= 0) G.traffic.splice(i, 1);
    World.dyn.remove(p.t.g); this.list.splice(this.list.indexOf(p), 1);
  },
  update(dt) {
    if (!G.started || G.simulating || G.away) return;
    const now = S.time;
    if (this.last != null && now > this.last) for (const P of PATROLS) { const at = P.h * 60; if (this.last < at && now >= at) this.start(P.k); }
    this.last = now;
    const cp = G.camera.position;
    for (const p of this.list.slice()) {
      if (now > p.until || now < p.until - 400) { this.end(p); continue; }
      const t = p.t, d = Math.hypot(cp.x - t.x, cp.z - t.z);
      if (t.bar) Emergency.flash(t, G.t, true);
      if ((p.sirenT -= dt) <= 0) { p.sirenT = 0.9; if (d < 80 && !G.inside) Emergency.siren(0.9); }
    }
  },
};

const Life7 = {
  init() {
    PhoneNav.init(); DecoHelp.init(); TestMode.init(); WaterReq.init(); Patrol.init();
    const _sm = Smart.morning; Smart.morning = function () { const r = _sm.apply(this, arguments); Life7.day(); return r; };
  },
  update(dt) { DecoHelp.update(); Patrol.update(dt); },
  day() { WaterReq.day(); },
};
