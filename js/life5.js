'use strict';
// ---------- Round 5: commercial farming (GAP / organic certificates, retail & export contracts, cold room, reefer truck),
// banking (credit score, mortgage, car and SME loans, credit card, repossession), real estate (price index, transfer costs,
// rentals, dormitory), insurance (car class 1/2+/3, home, health, liability), healthcare rights & chronic illness,
// growing children and inheritance, natural disasters with warnings and aid, co-op play with friends,
// far towns built only when visited, visible network cables, and fireflies / butterflies for atmosphere ----------
const Y5 = () => Math.floor((S.day - 1) / 84);

// ===== 3. commercial farming =====
CARS.reefer = { n: 'รถห้องเย็น 4 ล้อ (ขนผักส่งออก)', i: '🚚', price: 52000, top: 26, acc: 8, k: 'delivery', paint: 10 };
SHOPS.dealer2.tabs[0].items.push('car:reefer');
const AGRI_CONTRACTS = [
  { k: 'mart', n: 'สุขใจมาร์ท: ผักสด 30 ชิ้น/สัปดาห์', need: 30, mult: 1.35, cert: 'gap' },
  { k: 'hotel', n: 'โรงแรมริมทะเล: ผักออร์แกนิก 20 ชิ้น/สัปดาห์', need: 20, mult: 1.8, cert: 'organic' },
  { k: 'export', n: 'บริษัทส่งออกญี่ปุ่น: ผัก 60 ชิ้น/สัปดาห์ (ต้องมีห้องเย็น+รถห้องเย็น)', need: 60, mult: 2.1, cert: 'gap', cold: 1 },
];
const Agri = {
  st() { if (!S.agri) S.agri = { log: {}, chem: -99, gap: 0, organic: 0, app: null, cold: 0, deals: {} }; return S.agri; },
  record() { const a = this.st(); if (a.log[S.day]) { UI.toast('บันทึกวันนี้แล้ว', '📒'); return; } a.log[S.day] = 1; for (const d in a.log) if (+d < S.day - 21) delete a.log[d]; UI.toast('จดบันทึกการปลูก ใส่ปุ๋ย และใช้ยาประจำวันแล้ว (ใช้ยื่น GAP)', '📒'); },
  logDays() { return Object.keys(this.st().log).filter(d => +d > S.day - 14).length; },
  apply(k) {
    const a = this.st(); if (a.app) return;
    if (k === 'gap' && this.logDays() < 7) { UI.toast(`มาตรฐาน GAP ต้องมีบันทึกฟาร์มอย่างน้อย 7 วันใน 2 สัปดาห์ (มี ${this.logDays()})`, '📒'); return; }
    if (k === 'organic' && S.day - a.chem < 14) { UI.toast('ออร์แกนิกต้องงดสารเคมี (ปุ๋ยเคมี/ยาฆ่าแมลง) อย่างน้อย 14 วัน', '🌿'); return; }
    const fee = k === 'gap' ? 0 : 15000; if (S.money < fee) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(fee), '💸'); return; } S.money -= fee; a.app = { k, day: S.day + 2 };
    UI.toast(k === 'gap' ? 'ยื่นขอ GAP กับกรมวิชาการเกษตร (ไม่มีค่าใช้จ่าย) เจ้าหน้าที่ตรวจแปลงใน 2 วัน' : 'ยื่นขอรับรองเกษตรอินทรีย์ ค่าตรวจ 15,000 ฿ ตรวจใน 2 วัน', '📋');
  },
  sign(i) { const a = this.st(), C = AGRI_CONTRACTS[i]; if (!a[C.cert]) { UI.toast('ต้องได้รับใบรับรอง ' + (C.cert === 'gap' ? 'GAP' : 'เกษตรอินทรีย์') + ' ก่อน', '📋'); return; } if (C.cold && (!a.cold || !G.cars.some(o => o.d.type === 'reefer'))) { UI.toast('สัญญาส่งออกต้องมีห้องเย็นและรถห้องเย็น', '❄️'); return; } a.deals[C.k] = { got: 0, week: Math.floor((S.day - 1) / 7) }; UI.toast('เซ็นสัญญาแล้ว ส่งของได้ที่หน้าสัญญา ครบตามจำนวนทุกสัปดาห์', '✍️'); },
  deliver(k) {
    const a = this.st(), C = AGRI_CONTRACTS.find(x => x.k === k), d = a.deals[k]; if (!d) return;
    const ids = Object.keys(S.inv).filter(id => ITEMS[id] && ITEMS[id].cat === 'crop' && S.inv[id] > 0); let n = Math.min(C.need - d.got, ids.reduce((t, id) => t + S.inv[id], 0)); if (n <= 0) return;
    let pay = 0; for (const id of ids) { const t = Math.min(n, S.inv[id]); if (!t) continue; pay += priceOf(id) * C.mult * t; takeItem(id, t); n -= t; d.got += t; }
    pay = Math.round(pay); earn(pay); Bank2.income('สัญญาส่งผลผลิต', pay); UI.toast(`ส่งผลผลิตตามสัญญา ได้ ${baht(pay)} (${d.got}/${C.need})`, '🚚');
  },
  week() { const a = this.st(); for (const [k, d] of Object.entries(a.deals)) { const C = AGRI_CONTRACTS.find(x => x.k === k); if (d.got < C.need) { const fine = Math.round(C.need * 40); S.money = Math.max(0, S.money - fine); Phone.msg('คู่สัญญา', `${C.n}: ส่งไม่ครบ (${d.got}/${C.need}) ปรับ ${baht(fine)} ตามสัญญา`, true); } d.got = 0; } },
  day() { const a = this.st(); if (a.app && S.day >= a.app.day) { const k = a.app.k; a.app = null; a[k] = Y5() + 1; Phone.msg('กรมวิชาการเกษตร', `ผ่านการตรวจประเมิน ได้รับใบรับรอง ${k === 'gap' ? 'GAP' : 'เกษตรอินทรีย์'} อายุ 1 ปี`, true); Life2.note('ได้รับใบรับรอง ' + (k === 'gap' ? 'GAP' : 'เกษตรอินทรีย์')); } for (const k of ['gap', 'organic']) if (a[k] && a[k] <= Y5()) { a[k] = 0; Phone.msg('กรมวิชาการเกษตร', `ใบรับรอง ${k} หมดอายุ ต่ออายุได้ในแอปเกษตร`, true); } },
  html() {
    const a = this.st();
    return `<p class="lead">🌾 ฟาร์มเชิงพาณิชย์ · GAP ${a.gap ? '✅' : '❌'} · ออร์แกนิก ${a.organic ? '✅' : '❌'} · ห้องเย็น ${a.cold ? '✅' : '❌'} · บันทึกฟาร์ม ${this.logDays()}/14 วัน${a.app ? ' · 🕓 รอผลตรวจ' : ''}</p>
      <div class="row"><button class="btn" data-a="ag" data-v="rec">📒 จดบันทึกฟาร์มวันนี้</button><button class="btn ghost" data-a="ag" data-v="gap">ยื่นขอ GAP (ฟรี)</button><button class="btn ghost" data-a="ag" data-v="organic">ยื่นขอออร์แกนิก 15,000 ฿</button><button class="btn ghost" data-a="ag" data-v="cold" ${a.cold ? 'disabled' : ''}>สร้างห้องเย็น 180,000 ฿</button></div>
      <h5>สัญญาซื้อขาย</h5><div class="grid">${AGRI_CONTRACTS.map((C, i) => { const d = a.deals[C.k]; return `<div class="card"><div class="ci">🤝</div><div class="cb"><h4>${C.n}</h4><p class="dim">ราคา ×${C.mult} ของราคาตลาด · ส่งไม่ครบโดนปรับ${d ? ` · สัปดาห์นี้ส่งแล้ว ${d.got}/${C.need}` : ''}</p><div class="row">${d ? `<button class="btn" data-a="agdel" data-v="${C.k}">ส่งของ</button>` : `<button class="btn ghost" data-a="agsign" data-i="${i}">เซ็นสัญญา</button>`}</div></div></div>`; }).join('')}</div>`;
  },
};
// chemicals break the organic clock
{ const _f = fertilize; fertilize = function (p, i) { if (G.sel !== 'compost' || !count('compost')) Agri.st().chem = S.day; return _f(p, i); }; }

// ===== 4. banking & credit =====
const Credit = {
  st() { if (!S.cr) S.cr = { score: 650, loans: [], card: { limit: 0, bal: 0, missed: 0 }, late: 0 }; return S.cr; },
  income() { const j = S.job && S.job.k ? Career.salary() : 0, rent = Object.values((S.hb || {}).lots || {}).filter(l => l.rent).length * 15000; return j + rent + Math.max(0, (S.stats.earned / Math.max(1, S.day)) * 7 * 0.5); },
  quote(kind, amt) { const s = this.st(), inc = this.income(), r = { home: 0.0625, car: 0.045, sme: 0.075, personal: 0.18 }[kind] + (s.score < 600 ? 0.03 : s.score > 750 ? -0.01 : 0), n = { home: 48, car: 24, sme: 24, personal: 12 }[kind], pay = Math.round(amt * (r / 12) / (1 - Math.pow(1 + r / 12, -n))); const dsr = (pay + s.loans.reduce((t, l) => t + l.pay, 0)) / Math.max(1, inc); return { r, n, pay, ok: dsr <= 0.6 && s.score >= 520, dsr }; },
  borrow(kind, amt, ref) { const q = this.quote(kind, amt); if (!q.ok) { UI.toast(`ธนาคารไม่อนุมัติ: ภาระหนี้ต่อรายได้ ${Math.round(q.dsr * 100)}% (เกณฑ์ 60%) หรือเครดิตต่ำ (${this.st().score})`, '🏦'); return false; } this.st().loans.push({ kind, left: amt, pay: q.pay, r: q.r, n: q.n, ref, miss: 0 }); earn(amt); Bank2.income('เงินกู้' + { home: 'บ้าน', car: 'รถ', sme: 'ธุรกิจ', personal: 'บุคคล' }[kind], amt); UI.toast(`อนุมัติสินเชื่อ ${baht(amt)} ผ่อน ${baht(q.pay)} × ${q.n} เดือน ดอกเบี้ย ${(q.r * 100).toFixed(2)}%`, '🏦'); return true; },
  week() {
    const s = this.st();
    for (const l of s.loans.slice()) {
      const due = Math.min(l.pay, Math.round(l.left * (1 + l.r / 12)));
      if (S.money >= due) { S.money -= due; Bank2.log('ผ่อนชำระสินเชื่อ', -due); l.left = Math.round(l.left * (1 + l.r / 12) - due); l.miss = 0; s.score = Math.min(900, s.score + 3); if (l.left <= 0) { s.loans.splice(s.loans.indexOf(l), 1); Phone.msg('ธนาคารสุขใจ', 'ปิดยอดสินเชื่อเรียบร้อย ขอบคุณที่ชำระตรงเวลา', false); } }
      else { l.miss++; s.score = Math.max(300, s.score - 25); Phone.msg('ธนาคารสุขใจ', `ค้างค่างวด ${l.miss} งวด (${baht(due)}) ${l.miss >= 3 ? '— ส่งเรื่องยึดทรัพย์' : 'กรุณาชำระโดยเร็ว เครดิตบูโรลดลง'}`, true); if (l.miss >= 3) this.repossess(l); }
    }
    const c = s.card; if (c.bal > 0) { const min = Math.max(1000, Math.round(c.bal * 0.08)); if (S.money >= min) { S.money -= min; c.bal -= min; c.bal = Math.round(c.bal * (1 + 0.16 / 12)); } else { c.missed++; s.score = Math.max(300, s.score - 20); c.bal = Math.round(c.bal * 1.02) + 300; } }
    if (S.billDue && S.day > S.billDue.day) s.score = Math.max(300, s.score - 5);
  },
  repossess(l) {
    const s = this.st(); s.loans.splice(s.loans.indexOf(l), 1);
    // a car loan taken as cash has no car attached: the bank takes the most recently bought car
    if (l.kind === 'car' && l.ref == null && S.cars.length) l.ref = S.cars.length - 1;
    if (l.kind === 'car' && l.ref != null) { const o = G.cars.find(x => x.d === S.cars[l.ref]) || G.cars.find(x => x.d.type === l.ref); if (o) { World.dyn.remove(o.g); if (o.col) Col.remove(o.col); G.cars.splice(G.cars.indexOf(o), 1); S.cars.splice(S.cars.indexOf(o.d), 1); } Phone.msg('ธนาคารสุขใจ', 'ยึดรถคืนเนื่องจากค้างชำระ 3 งวด', true); }
    else if (l.kind === 'home' && l.ref && S.hb && S.hb.lots[l.ref]) { delete S.hb.lots[l.ref]; HomeBuild.draw(l.ref); Phone.msg('ธนาคารสุขใจ', 'ยึดบ้านและที่ดินขายทอดตลาดเนื่องจากค้างชำระ 3 งวด', true); }
    else Phone.msg('ธนาคารสุขใจ', 'ส่งเรื่องฟ้องร้องหนี้ค้างชำระ เครดิตบูโรเสียหาย', true);
  },
  html() {
    const s = this.st(), inc = this.income(), q = (k, a) => this.quote(k, a);
    if (!s.card.limit && inc > 0) s.card.limit = Math.round(Math.min(300000, inc * 3) / 1000) * 1000;
    return `<p class="lead">🏦 คะแนนเครดิตบูโร <b class="${s.score >= 700 ? 'good' : s.score < 600 ? 'bad' : ''}">${s.score}</b>/900 · รายได้ประเมิน ~${baht(Math.round(inc))}/เดือน · ธนาคารให้ภาระผ่อนรวมไม่เกิน 60% ของรายได้</p>
      ${s.loans.length ? `<table class="tbl"><tr><th>สินเชื่อ</th><th>คงเหลือ</th><th>ผ่อน/เดือน</th><th>ดอกเบี้ย</th><th>ค้าง</th></tr>${s.loans.map(l => `<tr><td>${{ home: 'บ้าน', car: 'รถ', sme: 'ธุรกิจ SME', personal: 'ส่วนบุคคล' }[l.kind]}</td><td>${U.fmt(l.left)}</td><td>${U.fmt(l.pay)}</td><td>${(l.r * 100).toFixed(2)}%</td><td>${l.miss}</td></tr>`).join('')}</table>` : ''}
      <div class="grid">
      <div class="card"><div class="ci">🏠</div><div class="cb"><h4>สินเชื่อบ้าน 90% (48 งวด)</h4><p class="dim">ใช้สร้างบ้านบนที่ดินของคุณ · ผ่อน ~${baht(q('home', 200000).pay)} ต่อ 200,000</p><div class="row"><button class="btn ghost" data-a="loan" data-k="home" data-v="200000">กู้ 200,000</button><button class="btn ghost" data-a="loan" data-k="home" data-v="400000">กู้ 400,000</button></div></div></div>
      <div class="card"><div class="ci">🚗</div><div class="cb"><h4>สินเชื่อรถ (24 งวด) ผ่อนไม่ไหวโดนยึดรถ</h4><div class="row"><button class="btn ghost" data-a="loan" data-k="car" data-v="30000">กู้ 30,000</button><button class="btn ghost" data-a="loan" data-k="car" data-v="100000">กู้ 100,000</button></div></div></div>
      <div class="card"><div class="ci">💼</div><div class="cb"><h4>สินเชื่อ SME (24 งวด)</h4><p class="dim">โอนเข้าบริษัทได้ในหน้าบริษัท (เพิ่มทุน)</p><div class="row"><button class="btn ghost" data-a="loan" data-k="sme" data-v="500000">กู้ 500,000</button><button class="btn ghost" data-a="loan" data-k="sme" data-v="2000000">กู้ 2 ล้าน</button></div></div></div>
      <div class="card"><div class="ci">💳</div><div class="cb"><h4>บัตรเครดิต วงเงิน ${baht(s.card.limit)}</h4><p class="dim">ยอดค้าง ${baht(s.card.bal)} · จ่ายขั้นต่ำ 8% ดอกเบี้ย 16%/ปี · กดเงินสดมีค่าธรรมเนียม 3%</p><div class="row"><button class="btn ghost" data-a="card" data-v="cash">กดเงินสด 10,000</button><button class="btn ghost" data-a="card" data-v="pay">ชำระเต็มยอด</button></div></div></div></div>`;
  },
};

// ===== 5. real estate =====
const PROPS = [
  { k: 'condo1', n: 'คอนโด 1 ห้องนอน ทุ่งทอง', i: '🏢', p: 1200000, rent: 6500 }, { k: 'shop1', n: 'อาคารพาณิชย์ 3 ชั้น ภูผาใหม่', i: '🏬', p: 3800000, rent: 22000 },
  { k: 'land1', n: 'ที่ดินเปล่า 1 ไร่ ริมถนนทางหลวง', i: '🌳', p: 900000, rent: 0 }, { k: 'house1', n: 'บ้านเดี่ยว 2 ชั้น หมู่บ้านจัดสรร', i: '🏡', p: 2600000, rent: 14000 },
  { k: 'dorm', n: 'หอพัก 20 ห้อง ใกล้โรงเรียน', i: '🏨', p: 6500000, rent: 20 * 3500 * 0.85 },
];
const Estate = {
  st() { if (!S.est) { S.est = { idx: 1, own: {} }; } return S.est; },
  price(P) { return Math.round(P.p * this.st().idx * (P.k === 'land1' && S.el2 && S.el2.proj.road ? 1.15 : 1) / 1000) * 1000; },
  buy(k) {
    const P = PROPS.find(x => x.k === k), s = this.st(); if (s.own[k]) return; const pr = this.price(P), fee = Math.round(pr * 0.01);
    if (S.money < pr + fee) { UI.toast(`ต้องใช้ ${baht(pr + fee)} (รวมค่าโอน 1% ครึ่งหนึ่งที่ผู้ซื้อจ่าย) หรือกู้สินเชื่อบ้านในแอปธนาคาร`, '💸'); return; }
    S.money -= pr + fee; Bank2.log('ซื้ออสังหาริมทรัพย์ + ค่าโอน', -(pr + fee)); s.own[k] = { paid: pr, day: S.day, rent: !!P.rent }; Life2.note('ซื้อ' + P.n); UI.toast(`โอนกรรมสิทธิ์ที่สำนักงานที่ดินเรียบร้อย ${P.n}`, P.i);
  },
  sell(k) {
    const P = PROPS.find(x => x.k === k), s = this.st(), o = s.own[k]; if (!o) return; const pr = this.price(P), years = (S.day - o.day) / 84;
    const sbt = years < 5 ? Math.round(pr * 0.033) : 0, wht = Math.round(pr * 0.01), fee = Math.round(pr * 0.01), net = pr - sbt - wht - fee;
    earn(net); Bank2.income('ขายอสังหาริมทรัพย์', net); delete s.own[k]; UI.toast(`ขาย${P.n} ${baht(pr)} หักภาษีธุรกิจเฉพาะ ${baht(sbt)} หัก ณ ที่จ่าย ${baht(wht)} ค่าโอน ${baht(fee)} ได้สุทธิ ${baht(net)}`, '🏷️');
  },
  week() { const s = this.st(); s.idx = +(s.idx * (1 + 0.004 + (Math.random() - 0.5) * 0.02 + (S.el2 && S.el2.proj.market ? 0.002 : 0))).toFixed(4); let inc = 0; for (const [k, o] of Object.entries(s.own)) { const P = PROPS.find(x => x.k === k); if (o.rent && P.rent && Math.random() < 0.9) inc += Math.round(P.rent * s.idx); } if (inc) { earn(inc); Bank2.income('ค่าเช่าอสังหา', inc); } },
  html() { const s = this.st(); return `<p class="lead">🏘️ ตลาดอสังหา · ดัชนีราคา ×${s.idx.toFixed(3)} (ขึ้นตามเศรษฐกิจและโครงการในเมือง) · ซื้อ: ค่าโอน 2% แบ่งจ่ายคนละครึ่ง · ขายก่อน 5 ปี: ภาษีธุรกิจเฉพาะ 3.3% + หัก ณ ที่จ่าย 1%</p><div class="grid">${PROPS.map(P => { const o = s.own[P.k]; return `<div class="card"><div class="ci">${P.i}</div><div class="cb"><h4>${P.n}</h4><p class="dim">ราคา ${baht(this.price(P))}${P.rent ? ` · ปล่อยเช่า ~${baht(Math.round(P.rent * s.idx))}/เดือน` : ' · เก็งกำไร'}${o ? ` · ซื้อมา ${baht(o.paid)}` : ''}</p><div class="row">${o ? `<button class="btn ghost" data-a="estsell" data-v="${P.k}">ขาย</button>` : `<button class="btn" data-a="estbuy" data-v="${P.k}">ซื้อ</button>`}</div></div></div>`; }).join('')}</div>`; },
};

// ===== 6/7. insurance and healthcare =====
const INS = {
  car1: { n: 'ประกันรถชั้น 1', i: '🚗', price: 2400, desc: 'ซ่อมรถเราฟรีทุกกรณี (ค่าเสียหายส่วนแรก 1,000 ฿)' },
  car2p: { n: 'ประกันรถชั้น 2+', i: '🚙', price: 1400, desc: 'ซ่อมเมื่อชนกับยานพาหนะ + รถหาย/ไฟไหม้' },
  car3: { n: 'ประกันรถชั้น 3', i: '🛻', price: 600, desc: 'จ่ายเฉพาะคู่กรณี (ชนคน/รถคนอื่น)' },
  home: { n: 'ประกันบ้าน อัคคีภัย + น้ำท่วม', i: '🏠', price: 900, desc: 'ไฟไหม้ น้ำท่วม พายุ จ่ายตามความเสียหาย' },
  health: { n: 'ประกันสุขภาพ IPD/OPD', i: '🏥', price: 1500, desc: 'ค่ารักษาโรงพยาบาลเอกชนจ่ายตามจริง' },
  liab: { n: 'ประกันความรับผิดของบริษัท', i: '🏢', price: 3000, desc: 'ไซเบอร์ / ลูกค้าฟ้องร้อง จ่ายแทนสูงสุด 1 ล้าน' },
};
const Ins = {
  st() { if (!S.ins) S.ins = {}; return S.ins; },
  has(k) { return (this.st()[k] || 0) >= S.day; },
  buy(k) { const X = INS[k]; if (S.money < X.price) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(X.price), '💸'); return; } S.money -= X.price; Bank2.log('เบี้ยประกัน ' + X.n, -X.price); const s = this.st(); if (k.startsWith('car')) for (const c of ['car1', 'car2p', 'car3']) delete s[c]; s[k] = Math.max(S.day, s[k] || 0) + 28; UI.toast(`ซื้อ${X.n} คุ้มครองถึง${RD(s[k])}`, X.i); },
  rights() { const C = typeof Career !== 'undefined' && Career.C(); return C ? (C.gov ? 'gov' : 'sso') : 'ucs'; },
  html() { const r = this.rights(); return `<p class="lead">🛡️ สิทธิรักษาพยาบาลของคุณ: <b>${{ gov: 'สวัสดิการข้าราชการ (เบิกได้เต็ม)', sso: 'ประกันสังคม (รักษาฟรีที่ รพ. ตามสิทธิ)', ucs: 'บัตรทอง 30 บาทรักษาทุกโรค' }[r]}</b>${S.chronic ? ` · โรคประจำตัว: ${S.chronic} (ต้องกินยาทุกวัน มียา ${count('pills')} แผง)` : ''}</p><div class="grid">${Object.entries(INS).map(([k, X]) => `<div class="card"><div class="ci">${X.i}</div><div class="cb"><h4>${X.n}${this.has(k) ? ' ✅' : ''}</h4><p class="dim">${X.desc} · ${baht(X.price)}/เดือน${this.has(k) ? ` · ถึง${RD(this.st()[k])}` : ''}</p><div class="row"><button class="btn ghost" data-a="insbuy" data-v="${k}">${this.has(k) ? 'ต่ออายุ' : 'ซื้อ'}</button></div></div></div>`).join('')}</div>
    <div class="row"><button class="btn ghost" data-a="checkup">ตรวจสุขภาพประจำปี (${r === 'ucs' ? 'ฟรีตามสิทธิ' : 'ฟรี'})</button>${S.chronic ? '<button class="btn ghost" data-a="pills">รับยาโรคประจำตัว 1 แผง (30 ฿)</button>' : ''}</div>`; },
};
{ // hospital bills follow your rights and insurance
  const _cure = UI.H.cure; UI.H.cure = d => { const fee = S.sick === 2 ? 1500 : 300, m = S.money; _cure(d); if (S.money < m) { const r = Ins.rights(), copay = Ins.has('health') ? 0 : r === 'ucs' ? 30 : 0; const back = fee - copay; if (back > 0) { S.money += back; UI.toast(`ใช้สิทธิ${r === 'gov' ? 'ข้าราชการ' : r === 'sso' ? 'ประกันสังคม' : 'บัตรทอง'}${Ins.has('health') ? ' + ประกันสุขภาพ' : ''} จ่ายจริง ${baht(copay)}`, '🏥'); } } };
}

// ===== 8. growing family =====
const Family = {
  stage(k) { const a = window.Kid182 ? Kid182.d(k) : S.day - k.born; return a < 14 ? 'เด็กเล็ก' : a < 42 ? 'วัยเรียน' : a < 70 ? 'วัยรุ่น' : a < 84 ? 'มหาวิทยาลัย' : 'ผู้ใหญ่'; },
  week() {
    for (const k of Social.st().kids || []) {
      const st = this.stage(k), fee = st === 'วัยเรียน' ? (k.school === 'inter' ? 25000 : 1500) : st === 'มหาวิทยาลัย' ? (k.uni === 'med' ? 30000 : 12000) : 0;
      if (fee) { S.money = Math.max(0, S.money - fee); Bank2.log(`ค่าเล่าเรียน${k.name}`, -fee); k.edu = (k.edu || 0) + (k.school === 'inter' || k.uni === 'med' ? 2 : 1); }
      if (st === 'ผู้ใหญ่' && !k.job) { k.job = k.uni === 'med' ? 'แพทย์' : k.uni === 'eng' ? 'วิศวกร' : k.uni === 'agri' ? 'นักวิชาการเกษตร' : 'ชาวไร่รุ่นใหม่'; Phone.msg('ครอบครัว', `${k.name}เรียนจบแล้ว ทำงานเป็น${k.job} ${k.job === 'นักวิชาการเกษตร' || k.job === 'ชาวไร่รุ่นใหม่' ? 'และกลับมาช่วยงานในไร่ทุกวัน' : 'ส่งเงินให้พ่อแม่ทุกเดือน'}`, true); }
      if (k.job) { if (k.job === 'นักวิชาการเกษตร' || k.job === 'ชาวไร่รุ่นใหม่') S.plots.forEach(p => { if (p.c && p.w <= 0) p.w = 1; }); else { const v = k.job === 'แพทย์' ? 8000 : 5000; earn(v); Bank2.income(`${k.name}ส่งเงินให้`, v); } }
    }
  },
  inherit(i) {
    const k = (Social.st().kids || [])[+i]; if (!k || this.stage(k) !== 'ผู้ใหญ่') return;
    const est = S.money + Bank.total(), tax = est > 100e6 ? Math.round((est - 100e6) * 0.05) : 0;
    S.money -= Math.min(S.money, tax); const old = S.name; S.name = k.name; Social.st().kids.splice(+i, 1); S.energy = maxEnergy(); S.gen = (S.gen || 1) + 1;
    Life2.note(`${old}เกษียณ ส่งต่อไร่และทรัพย์สินทั้งหมดให้${k.name} (รุ่นที่ ${S.gen})${tax ? ` ภาษีการรับมรดก ${baht(tax)}` : ''}`); UI.toast(`ตอนนี้คุณเล่นเป็น ${k.name} ทายาทรุ่นที่ ${S.gen}!`, '👪');
  },
  html() {
    const kids = Social.st().kids || []; if (!kids.length) return '<p class="empty">ยังไม่มีลูก (แต่งงานแล้วมีลูก หรือรับเลี้ยงเด็กได้)</p>';
    return `<div class="grid">${kids.map((k, i) => { const st = this.stage(k); return `<div class="card"><div class="ci">${st === 'เด็กเล็ก' ? '👶' : st === 'ผู้ใหญ่' ? '🧑' : '🧒'}</div><div class="cb"><h4>${esc(k.name)} · ${st}</h4><p class="dim">การศึกษา ${k.edu || 0} · ${k.school ? (k.school === 'inter' ? 'โรงเรียนนานาชาติ' : 'โรงเรียนรัฐ') : ''}${k.uni ? ' · คณะ' + { med: 'แพทย์', eng: 'วิศวะ', agri: 'เกษตร', biz: 'บริหาร' }[k.uni] : ''}${k.job ? ' · อาชีพ ' + k.job : ''}</p><div class="row">${st === 'วัยเรียน' && !k.school ? `<button class="btn ghost" data-a="kidsch" data-i="${i}" data-v="gov">โรงเรียนรัฐ 1,500/เดือน</button><button class="btn ghost" data-a="kidsch" data-i="${i}" data-v="inter">นานาชาติ 25,000/เดือน</button>` : ''}${st === 'มหาวิทยาลัย' && !k.uni ? ['med', 'eng', 'agri', 'biz'].map(u => `<button class="btn ghost" data-a="kiduni" data-i="${i}" data-v="${u}">${{ med: 'แพทย์', eng: 'วิศวะ', agri: 'เกษตร', biz: 'บริหาร' }[u]}</button>`).join('') : ''}${st === 'ผู้ใหญ่' ? `<button class="btn" data-a="inherit" data-i="${i}">ส่งต่อมรดก เล่นเป็น${esc(k.name)}</button>` : ''}</div></div></div>`; }).join('')}</div>`;
  },
};

// ===== 9. disasters =====
const DIS = { flood: { n: 'น้ำท่วมใหญ่', i: '🌊', se: 'rain' }, drought: { n: 'ภัยแล้งรุนแรง', i: '🏜️', se: 'hot' }, storm: { n: 'พายุโซนร้อน', i: '🌀', se: 'rain' }, fire: { n: 'ไฟป่าลุกลาม', i: '🔥', se: 'hot' } };
const Disaster = {
  st() { if (!S.dis) S.dis = { warn: null, prep: {}, last: -99 }; return S.dis; },
  day() {
    const s = this.st(), se = season().id;
    if (s.warn && S.day >= s.warn.day) return this.hit(s.warn.k);
    if (!s.warn && S.day - s.last > 20 && Math.random() < 0.06) { const L = Object.keys(DIS).filter(k => DIS[k].se === se); if (!L.length) return; const k = U.pick(L); s.warn = { k, day: S.day + 2 }; s.prep = {}; Phone.msg('ปภ. เตือนภัย', `${DIS[k].i} เตือนภัย${DIS[k].n}ในอีก 2 วัน! เตรียมรับมือในแอปเตือนภัย`, true); }
  },
  prep(k) {
    const s = this.st(); if (!s.warn || s.prep[k]) return;
    const cost = { sand: 0, car: 0, water: 2000, fuel: 420, firebreak: 0, roof: 3000 }[k]; if (S.money < cost) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(cost), '💸'); return; }
    if (['sand', 'firebreak', 'car'].includes(k) && !useEnergy(k === 'car' ? 5 : 15)) return; S.money -= cost; s.prep[k] = 1;
    UI.toast({ sand: 'วางกระสอบทรายกั้นน้ำรอบแปลงแล้ว', car: 'ย้ายรถไปจอดที่สูงแล้ว', water: 'สำรองน้ำ 2,000 ลิตรแล้ว', fuel: 'สำรองน้ำมันเครื่องปั่นไฟแล้ว', firebreak: 'ถางแนวกันไฟรอบไร่แล้ว', roof: 'ยึดหลังคาและหน้าต่างแล้ว' }[k], '✅');
  },
  hit(k) {
    const s = this.st(), p = s.prep; s.warn = null; s.last = S.day; let loss = 0;
    if (k === 'flood') { if (!p.sand) S.plots.forEach((pl, i) => { if (pl.c && i >= 18) { pl.c = null; pl.g = 0; loss += 300; } }); if (!p.car) for (const o of G.cars) if (Math.hypot(o.d.x - GARAGE.x, o.d.z - GARAGE.z) < 14) { o.d.cond = Math.max(0, (o.d.cond || 100) - 50); loss += 8000; } if (typeof Maint !== 'undefined') Maint.st().house = Math.max(0, Maint.st().house - (p.sand ? 5 : 20)); }
    if (k === 'drought') { const w = typeof Water !== 'undefined' && (Water.st().well || Water.st().tank); if (!w && !p.water) S.plots.forEach(pl => { if (pl.c) { pl.w = 0; pl.dry = (pl.dry || 0) + 24; } }); loss += w || p.water ? 0 : 5000; }
    if (k === 'storm') { Grid.outageStart(6 + (p.fuel ? 0 : 4), 'พายุโซนร้อนพัดเสาไฟฟ้าล้ม'); if (!p.roof && typeof Maint !== 'undefined') { Maint.st().house = Math.max(0, Maint.st().house - 30); loss += 12000; } }
    if (k === 'fire') { if (!p.firebreak) { S.trees.forEach(t => { if (t.c && Math.random() < 0.5) { t.c = null; t.g = 0; loss += 1500; } }); Emergency.ignite && Emergency.ignite(30, -30, 'ไฟป่าลามเข้าสวนผลไม้!'); } }
    if (typeof refreshField === 'function') refreshField();
    const papers = typeof Gov24 === 'undefined' || (Gov24.has('idcard') && Gov24.has('housereg')), aid = loss > 0 && papers ? Math.min(9000, 5000 + Math.round(loss * 0.1)) : 0; if (aid) { earn(aid); Bank2.income('เงินเยียวยาผู้ประสบภัย', aid); }   // relief only for real losses and with an ID card + house registration
    if (loss && Ins.has('home') && k !== 'drought') { const pay = Math.round(loss * 0.8); earn(pay); Bank2.income('สินไหมประกันภัยบ้าน', pay); }
    Phone.msg('ปภ.', `${DIS[k].i} ${DIS[k].n}ผ่านไปแล้ว ความเสียหายประมาณ ${baht(loss)}${loss ? '' : ' (เตรียมพร้อมดีมาก ไม่เสียหาย)'} · ได้รับเงินเยียวยา ${baht(aid)}${loss && Ins.has('home') && k !== 'drought' ? ' + เงินประกันบ้าน' : ''}`, true);
    Life2.note(`ผ่าน${DIS[k].n}มาได้`);
  },
  html() { const s = this.st(), w = s.warn; if (!w) return '<p class="lead">✅ ตอนนี้ไม่มีประกาศเตือนภัย (ภัยใหญ่เกิดตามฤดู: หน้าฝนน้ำท่วม/พายุ หน้าร้อนภัยแล้ง/ไฟป่า)</p>'; const P = { flood: [['sand', 'วางกระสอบทรายกั้นน้ำ (พลังงาน 15)'], ['car', 'ย้ายรถไปที่สูง']], drought: [['water', 'สำรองน้ำ 2,000 ลิตร (2,000 ฿)']], storm: [['roof', 'ยึดหลังคา/หน้าต่าง (3,000 ฿)'], ['fuel', 'สำรองน้ำมันเครื่องปั่นไฟ (420 ฿)'], ['car', 'ย้ายรถเข้าที่ปลอดภัย']], fire: [['firebreak', 'ถางแนวกันไฟ (พลังงาน 15)']] }[w.k]; return `<p class="lead bad">${DIS[w.k].i} เตือนภัย${DIS[w.k].n} ${RD(w.day)}</p><div class="menu">${P.map(([k, t]) => `<button class="btn ${s.prep[k] ? 'ghost' : ''}" data-a="disprep" data-v="${k}" ${s.prep[k] ? 'disabled' : ''}>${s.prep[k] ? '✅ ' : ''}${t}</button>`).join('')}</div>`; },
};

// ===== 10. co-op play =====
const Coop = {
  help(id) { Net.api('mail', { id: Net.id(), to: id, name: S.name || 'ชาวไร่', kind: 'help', item: '', msg: 'มาช่วยรดน้ำทั้งไร่' }).then(() => { Prog.add(10); UI.toast('ส่งแรงไปช่วยเพื่อนรดน้ำแล้ว เพื่อนจะได้รับเมื่อออนไลน์', '🤝'); }).catch(() => {}); },
  sell(id) { const it = Object.keys(S.inv).find(k => ITEMS[k] && ITEMS[k].cat === 'crop' && S.inv[k] >= 5); if (!it) { UI.toast('ต้องมีผลผลิตอย่างน้อย 5 ชิ้น', '📦'); return; } const price = Math.round(priceOf(it) * 5 * 0.9); Net.api('mail', { id: Net.id(), to: id, name: S.name || 'ชาวไร่', kind: 'offer', item: it, n: 5, price, msg: `เสนอขาย${ITEMS[it].n} 5 ชิ้น ${baht(price)}` }).then(r => { if (r.ok) { takeItem(it, 5); UI.toast('ส่งข้อเสนอขายแล้ว (ของจะคืนถ้าเพื่อนปฏิเสธ)', '📦'); } }).catch(() => {}); },
  pay(id, v) { if (S.money < v) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(v), '💸'); return; } S.money -= v; Net.api('mail', { id: Net.id(), to: id, name: S.name || 'ชาวไร่', kind: 'cash', item: '', n: 1, price: v, msg: 'โอนเงิน' }).catch(() => {}); },
  // incoming mail kinds from friends
  handle(m) {
    if (m.kind === 'help') { S.plots.forEach(p => { if (p.c) p.w = 1; }); Phone.msg(m.name || 'เพื่อน', 'แวะมาช่วยรดน้ำทั้งไร่ให้ตอนคุณไม่อยู่ 🤝'); return true; }
    if (m.kind === 'cash') { earn(m.price); Bank2.income('เงินโอนจากเพื่อน', m.price); Phone.msg(m.name || 'เพื่อน', `โอนเงินให้ ${baht(m.price)}`); return true; }
    if (m.kind === 'offer') { (S.offers = S.offers || []).push(m); Phone.msg(m.name || 'เพื่อน', `${m.msg} (ตอบรับในแอปเพื่อนออนไลน์)`); return true; }
    if (m.kind === 'back') { addItem(m.item, m.n); return true; }
    return false;
  },
  accept(i, yes) { const m = (S.offers || [])[+i]; if (!m) return; S.offers.splice(+i, 1); if (yes) { if (S.money < m.price) { UI.toast('เงินไม่พอ', '💸'); S.offers.push(m); return; } S.money -= m.price; addItem(m.item, m.n); Net.api('mail', { id: Net.id(), to: m.from, name: S.name, kind: 'cash', price: m.price, n: 1, item: '', msg: 'ค่าสินค้า' }).catch(() => {}); UI.toast('ซื้อของจากเพื่อนแล้ว', '🤝'); } else Net.api('mail', { id: Net.id(), to: m.from, name: S.name, kind: 'back', item: m.item, n: m.n, msg: 'ปฏิเสธข้อเสนอ' }).catch(() => {}); },
};
{ // mail with a kind is handled here before the plain gift path
  Plan.pullMail = function () { if (!Net.on || !G.started) return; Net.api('mail?id=' + Net.id()).then(r => { for (const m of r.mail || []) { if (Coop.handle(m)) continue; if (ITEMS[m.item]) addItem(m.item, m.n || 1); Phone.msg(m.name || 'เพื่อน', `ส่ง${ITEMS[m.item] ? ITEMS[m.item].n + ' ×' + (m.n || 1) : 'ของขวัญ'}มาให้: "${m.msg || ''}"`); } }).catch(() => {}); };
  const _fh = Plan.friendsHTML.bind(Plan); Plan.friendsHTML = () => { let h = _fh(); if (Net.on) h = h.replace(/data-a="frfarm" data-v="([^"]+)">ดูฟาร์ม<\/button>/g, (m, id) => m + `<button class="btn ghost" data-a="cohelp" data-v="${id}">ช่วยรดน้ำ</button><button class="btn ghost" data-a="cosell" data-v="${id}">เสนอขายผัก</button><button class="btn ghost" data-a="copay" data-v="${id}">โอน 1,000</button>`); const O = S.offers || []; if (O.length) h += `<h5>ข้อเสนอจากเพื่อน</h5>${O.map((m, i) => `<p class="lead">${esc(m.name)}: ${esc(m.msg)} <button class="btn" data-a="coacc" data-i="${i}" data-v="1">ซื้อ</button><button class="btn ghost" data-a="coacc" data-i="${i}" data-v="0">ปฏิเสธ</button></p>`).join('')}`; return h; };
}

// ===== leftovers: far towns built on first visit, visible cables, ambient life =====
{
  const _init = Town3.init.bind(Town3);
  Town3.init = function () {
    const lazy = (key, name, icon, cx, cz, set) => ({ n: name, icon, cx, cz, lazy: () => this.build(key, name, icon, cx, cz, set) });
    Town2.areas.chiang = lazy('chiang', 'เชียงสุข (เมืองเก่า)', '🏮', 3600, 3000, 'a'); Town2.areas.city = lazy('city', 'สุขใจซิตี้ (เมืองใหม่)', '🏙️', 3600, 3600, 'b');
    TAXI_DEST.push({ n: 'เชียงสุข (เมืองเก่าล้านนา)', away: 'chiang', fee: 300 }, { n: 'สุขใจซิตี้ (เมืองใหม่)', away: 'city', fee: 450 });
  };
  // far towns are built the first time you travel there; their shops and offices get walk-in rooms like everywhere else
  const ensure = k => {
    const A = Town2.areas[k]; if (!A || !A.lazy) return A;
    const n0 = World.pois.length; Town2.areas[k] = A.lazy();
    for (const poi of World.pois.slice(n0)) {
      if (poi.kind === 'shop' && !poi.noRoom && SHOPS[poi.id]) poi.room = { kind: SHOP_ROOM[poi.id] || 'shop', shop: poi.id, title: SHOPS[poi.id].n };
      if (poi.kind === 'act') for (const [re, kind, staff] of BUILDING_ROOMS) if (re.test(poi.label) && !poi.room) { const orig = poi.act; poi.room = { kind, title: poi.label, staff, service: () => { const a = orig(); a && a.fn(); } }; }
    }
    if (typeof Collide !== 'undefined') Collide.scan(Town2.areas[k].g, () => 0);
    // a spouse from this town can only move in once its people exist
    { const r = Social.st(); if (r.stage === 'married' && r.partner && !G.npcs.some(n => n.name === r.partner && !n.townRes)) Social.moveIn(r.partner); }
    return Town2.areas[k];
  };
  Town3.ensure = ensure;
  const _go = Town2.go.bind(Town2); Town2.go = (k, fee) => { Town3.ensure(k); return _go(k, fee); };
  const _hw = Plan.hwGo.bind(Plan); Plan.hwGo = (k, m) => { Town3.ensure(k); return _hw(k, m); };
}
{
  const _d = CCTV.draw.bind(CCTV);
  CCTV.draw = function () { _d(); const L = Sec.site('home').dev, pts = []; for (const d of L) { const p = L.find(x => x.uid === d.p); if (!p || DEV[d.k].wifiC || ['sensor', 'hdd'].includes(DEV[d.k].t)) continue; const a = MOUNTS[d.spot || 'house'], b = MOUNTS[p.spot || 'house']; if (a === b) continue; const ya = World.groundY(a.x, a.z) + a.y - 0.4, yb = World.groundY(b.x, b.z) + b.y - 0.4, n = 12; for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n, sag = t => -Math.sin(t * Math.PI) * 0.8; pts.push(U.lerp(a.x, b.x, t0), U.lerp(ya, yb, t0) + sag(t0), U.lerp(a.z, b.z, t0), U.lerp(a.x, b.x, t1), U.lerp(ya, yb, t1) + sag(t1), U.lerp(a.z, b.z, t1)); } } if (pts.length) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); this.g.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x212121 }))); } };
}
const Ambient = {
  update(dt) {
    if (!Fest2.small || G.inside || G.away) return; this.t = (this.t || 0) - dt; if (this.t > 0) return; this.t = G.Q.lvl === 'low' ? 0.5 : 0.15;
    const p = G.player.pos, h = S.time / 60, rain = G.wx.rain > 0.3;
    if (rain) return;
    if (G.night > 0.6) { const a = Math.random() * TAU, r = 6 + Math.random() * 20; Fest2.spawnS(p.x + Math.cos(a) * r, World.groundY(p.x, p.z) + 0.5 + Math.random() * 2, p.z + Math.sin(a) * r, (Math.random() - .5) * .6, 0.9, (Math.random() - .5) * .6, U.col(0xd4ff6a), 2.4); }
    else if (h > 8 && h < 17 && (zoneAt(p.x, p.z) || {}).id === 'farm' && Math.random() < 0.5) { const a = Math.random() * TAU, r = 4 + Math.random() * 12; Fest2.spawnS(p.x + Math.cos(a) * r, World.groundY(p.x, p.z) + 0.8 + Math.random(), p.z + Math.sin(a) * r, (Math.random() - .5) * 1.5, 2.2, (Math.random() - .5) * 1.5, U.col([0xffeb3b, 0xff80ab, 0x80d8ff, 0xffffff][(Math.random() * 4) | 0]), 1.8); }
  },
};

const Life5 = {
  init() {
    const _b = Life2.bill.bind(Life2); Life2.bill = () => { _b(); this.week(); };
    Agri.st(); Credit.st(); Estate.st(); Ins.st(); Disaster.st();
    APPS.splice(3, 0, { id: 'agri', i: '🌾', n: 'ฟาร์มพาณิชย์' }, { id: 'loan', i: '🏦', n: 'สินเชื่อ & เครดิต' }, { id: 'estate', i: '🏘️', n: 'อสังหา' }, { id: 'ins', i: '🛡️', n: 'ประกัน & สุขภาพ' }, { id: 'family', i: '👪', n: 'ครอบครัว' }, { id: 'alert', i: '🚨', n: 'เตือนภัย' });
    Phone.apps.agri = () => Agri.html(); Phone.apps.loan = () => Credit.html(); Phone.apps.estate = () => Estate.html(); Phone.apps.ins = () => Ins.html(); Phone.apps.family = () => Family.html(); Phone.apps.alert = () => Disaster.html();
    // car insurance pays for crash repairs at the garage
    const _dr = Town2.drive; Town2.drive = function (c, dist, hit, dt) { const d = c.d, before = d.cond; const r = _dr.call(this, c, dist, hit, dt); if (hit && d.cond < before && (Ins.has('car1') || (Ins.has('car2p') && hit > 6))) { d.cond = Math.min(100, before - 1); if (!Life5.toldIns || G.t - Life5.toldIns > 20) { Life5.toldIns = G.t; UI.toast('ประกันรถคุ้มครอง ส่งซ่อมให้ (ค่าเสียหายส่วนแรก 1,000 ฿)', '🛡️'); S.money = Math.max(0, S.money - 1000); } } return r; };
    // chronic illness appears with age and needs daily medicine
    const _ld = Life2.day.bind(Life2); Life2.day = () => { _ld(); if (!S.chronic && S.day > 120 && Math.random() < 0.004) { S.chronic = U.pick(['ความดันโลหิตสูง', 'เบาหวานชนิดที่ 2']); Phone.msg('สุขภาพ', `ตรวจพบ${S.chronic} ต้องกินยาทุกวัน รับยาได้ในแอปประกัน & สุขภาพ`, true); } if (S.chronic) { if (count('pills')) takeItem('pills'); else S.energy = Math.max(0, S.energy - 15); } };
    ITEMS.pills = { n: 'ยาโรคประจำตัว (แผง)', i: '💊', cat: 'tool' };
  },
  day() { Agri.day(); Disaster.day(); },
  week() { Agri.week(); Credit.week(); Estate.week(); Family.week(); },
};
Object.assign(UI.H, {
  ag: d => { if (d.v === 'rec') Agri.record(); else if (d.v === 'cold') { if (S.money < 180000 || Agri.st().cold) return; S.money -= 180000; Agri.st().cold = 1; UI.toast('สร้างห้องเย็นเก็บผลผลิตแล้ว', '❄️'); } else Agri.apply(d.v); },
  agsign: d => Agri.sign(+d.i), agdel: d => Agri.deliver(d.v),
  loan: d => (d.k ? Credit.borrow(d.k, +d.v, null) : Bank2.borrow(+d.v)),   // v162: the bank counter's plain loan buttons (no data-k) fell into Credit.borrow with no loan kind and said "NaN%" card: d => { const c = Credit.st().card; if (d.v === 'cash') { if (c.bal + 10300 > c.limit) { UI.toast('เกินวงเงิน', '💳'); return; } c.bal += 10300; earn(10000); } else { const n = Math.min(S.money, c.bal); S.money -= n; c.bal -= n; } },
  estbuy: d => Estate.buy(d.v), estsell: d => Estate.sell(d.v), insbuy: d => Ins.buy(d.v),
  checkup: () => { if (S.checkY === Y5()) { UI.toast('ตรวจสุขภาพปีนี้แล้ว', '🩺'); return; } S.checkY = Y5(); fade(() => { tick(120); UI.toast(S.chronic ? `ผลตรวจ: ${S.chronic} ควบคุมได้ดีถ้ากินยาสม่ำเสมอ` : 'ผลตรวจสุขภาพปกติดี แข็งแรง', '🩺'); S.mood = Math.min(100, (S.mood || 50) + 5); }); },
  pills: () => { if (S.money < 30) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(30), '💸'); return; } S.money -= 30; addItem('pills', 7); UI.toast('รับยา 1 แผง (7 วัน)', '💊'); },
  kidsch: d => { const k = Social.st().kids[+d.i]; if (k) k.school = d.v; }, kiduni: d => { const k = Social.st().kids[+d.i]; if (k) k.uni = d.v; }, inherit: d => Family.inherit(d.i),
  disprep: d => Disaster.prep(d.v),
  cohelp: d => Coop.help(d.v), cosell: d => Coop.sell(d.v), copay: d => Coop.pay(d.v, 1000), coacc: d => Coop.accept(d.i, d.v === '1'),
});
