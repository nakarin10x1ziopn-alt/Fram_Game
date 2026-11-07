'use strict';
// ---------- Personal income tax (yearly filing with real brackets and allowances), local elections with campaigning and
// town projects, water supply like real life (meter, tariff, wells, tanks, drip irrigation, low pressure in the dry season),
// and a performance pass that merges each static building into a few meshes ----------
const YEAR_DAYS = 84; // 12 game weeks = 1 year (1 week = 1 month)
const PIT_BRACKETS = [[150000, 0], [300000, 0.05], [500000, 0.1], [750000, 0.15], [1000000, 0.2], [2000000, 0.25], [5000000, 0.3], [1e15, 0.35]];

// ===== personal income tax =====
const PTax = {
  yr() { return Math.floor((S.day - 1) / YEAR_DAYS); },
  st() { if (!S.ptax) S.ptax = { y: this.yr(), cur: this.blank(), last: null, filed: {}, rmf: [], life: 0, earned0: S.stats.earned }; return S.ptax; },
  blank() { return { sal: 0, wht: 0, ss: 0, rent: 0, div: 0, other: 0 }; },
  note(label, v) { const c = this.st().cur; if (/ค่าเช่า|โฮมสเตย์/.test(label)) c.rent += v; else if (/ปันผล/.test(label)) c.div += v; },
  calc(c) {
    const salExp = Math.min(100000, c.sal * 0.5), rentExp = c.rent * 0.3, farm = Math.max(0, c.other), farmExp = farm * 0.6;
    const r = Social.st(), fs = typeof Fam28 !== 'undefined' ? Fam28.state() : null, kids = fs ? fs.reg : (r.kids || []).length, ded = 60000 + (r.stage === 'married' && (!fs || fs.mar) ? 60000 : 0) + kids * 30000 + Math.min(9000, c.ss) + Math.min(100000, c.life || 0) + Math.min(500000, c.rmf || 0);
    const net = Math.max(0, c.sal - salExp + c.rent - rentExp + farm - farmExp - ded);
    let tax = 0, prev = 0; for (const [cap, rate] of PIT_BRACKETS) { if (net > prev) tax += (Math.min(net, cap) - prev) * rate; prev = cap; }
    return { gross: c.sal + c.rent + farm, net: Math.round(net), ded: Math.round(ded), tax: Math.round(tax), due: Math.round(tax - c.wht) };
  },
  roll() {
    const s = this.st(), y = this.yr(); if (y === s.y) return;
    s.cur.other = Math.max(0, (S.stats.earned - s.earned0) - s.cur.sal - s.cur.rent - s.cur.div);
    s.last = { y: s.y, ...s.cur, r: this.calc(s.cur), deadline: S.day + 7 }; s.y = y; s.cur = this.blank(); s.earned0 = S.stats.earned;
    Phone.msg('กรมสรรพากร', `ถึงเวลายื่นแบบ ภ.ง.ด.90 ปีภาษีที่แล้ว ยื่นได้ในแอปภาษีภายใน${RD(s.last.deadline)}`, true);
  },
  file() {
    const L = this.st().last; if (!L || L.done) return; const r = L.r, late = Math.max(0, S.day - L.deadline), fine = late && r.due > 0 ? 200 + Math.round(r.due * 0.015 * Math.ceil(late / 7)) : 0;
    if (r.due + fine > 0 && S.money < r.due + fine) { UI.toast(`ต้องชำระ ${baht(r.due + fine)}`, '💸'); return; }
    if (r.due > 0) { S.money -= r.due + fine; Bank2.log('ภาษีเงินได้บุคคลธรรมดา', -(r.due + fine)); } else if (r.due < 0) { earn(-r.due); Bank2.income('คืนภาษี', -r.due); }
    L.done = 1; UI.toast(r.due > 0 ? `ยื่นภาษีแล้ว ชำระ ${baht(r.due + fine)}${fine ? ' (รวมค่าปรับยื่นช้า)' : ''}` : r.due < 0 ? `ยื่นภาษีแล้ว ได้เงินคืน ${baht(-r.due)}` : 'ยื่นภาษีแล้ว ไม่ต้องชำระเพิ่ม', '🧾');
  },
  html() {
    const s = this.st(), c = { ...s.cur, other: Math.max(0, (S.stats.earned - s.earned0) - s.cur.sal - s.cur.rent - s.cur.div), life: s.life, rmf: s.rmf.filter(f => this.yr() === Math.floor((f.day - 1) / YEAR_DAYS)).reduce((t, f) => t + f.v, 0) }, r = this.calc(c), L = s.last;
    return `<p class="lead">🧾 ภาษีเงินได้บุคคลธรรมดา (ปีภาษี = 12 สัปดาห์ในเกม) · ยื่นแบบหลังจบปีภายใน 7 วัน</p>
      ${L && !L.done ? `<div class="card"><div class="ci">📮</div><div class="cb"><h4>ยื่นแบบปีที่แล้ว (ภายใน${RD(L.deadline)})</h4><p class="dim">เงินได้ ${baht(L.r.gross)} · ลดหย่อน ${baht(L.r.ded)} · เงินได้สุทธิ ${baht(L.r.net)} · ภาษี ${baht(L.r.tax)} · ถูกหัก ณ ที่จ่ายแล้ว ${baht(L.wht)} · ${L.r.due > 0 ? 'ต้องชำระเพิ่ม ' + baht(L.r.due) : 'ได้คืน ' + baht(-L.r.due || 0)}</p><div class="row"><button class="btn" data-a="ptfile">ยื่นแบบ ภ.ง.ด.90</button></div></div></div>` : ''}
      <h5>ปีนี้ (ประมาณการ)</h5><p class="lead">เงินเดือน ${baht(c.sal)} · ค่าเช่า ${baht(c.rent)} · ขายผลผลิต/อื่น ๆ ${baht(c.other)} · ปันผล ${baht(c.div)} (หัก 10% แล้ว เลือกไม่นำมารวม) · ภาษีประมาณ ${baht(r.tax)} · หัก ณ ที่จ่ายแล้ว ${baht(c.wht)}</p>
      <p class="dim">ค่าใช้จ่าย: เงินเดือน 50% (ไม่เกิน 100,000) · ค่าเช่า 30% · ผลผลิตเกษตร 60% · ลดหย่อน: ส่วนตัว 60,000 คู่สมรส 60,000 บุตรคนละ 30,000 ประกันสังคม ประกันชีวิต (ไม่เกิน 100,000) กองทุน RMF</p>
      <div class="row"><button class="btn ghost" data-a="ptlife">ซื้อประกันชีวิต 20,000 ฿/ปี</button><button class="btn ghost" data-a="ptrmf">ลงทุน RMF 50,000 ฿ (ถอนได้หลัง 1 ปีเกม)</button>${s.rmf.some(f => S.day - f.day >= YEAR_DAYS) ? '<button class="btn ghost" data-a="ptrmfout">ถอน RMF ที่ครบกำหนด (+4%)</button>' : ''}</div>`;
  },
};
{ const _inc = Bank2.income.bind(Bank2); Bank2.income = (label, v) => { try { PTax.note(label, v); } catch (e) { } return _inc(label, v); }; }
{ const _p = Career.payday.bind(Career); Career.payday = () => { const j = Career.st(), n0 = j.slips.length && j.slips[0].day; _p(); const sl = j.slips[0]; if (sl && sl.day !== n0) { const c = PTax.st().cur; c.sal += sl.gross - sl.cut; c.wht += sl.tax; c.ss += sl.ss; } }; }

// ===== local elections =====
const ELECT = { village: { n: 'ผู้ใหญ่บ้านสุขใจ', fee: 5000, pay: 12000, need: 3 }, mayor: { n: 'นายกเทศมนตรีตำบลสุขใจ', fee: 50000, pay: 45000, need: 8, prev: 'village' } };
const TOWN_PROJ = {
  lights: { n: 'ติดไฟส่องสว่างถนนทั้งตำบล', i: '💡', cost: 1, desc: 'ขโมยลดลง ถนนกลางคืนปลอดภัย' },
  road: { n: 'ซ่อมถนนลาดยาง', i: '🛣️', cost: 1, desc: 'รถสึกหรอช้าลงครึ่งหนึ่ง' },
  market: { n: 'ตลาดชุมชนประจำสัปดาห์', i: '🧺', cost: 1, desc: 'ขายของที่แผงหน้าไร่ได้ราคา +5%' },
  park: { n: 'สวนสาธารณะและลานออกกำลังกาย', i: '🌳', cost: 1, desc: 'อารมณ์ชาวบ้านและคุณดีขึ้นทุกวัน' },
  water: { n: 'ขยายเขตประปาและแรงดันน้ำ', i: '🚰', cost: 2, desc: 'น้ำประปาไหลแรงแม้หน้าแล้ง' },
  wifi: { n: 'WiFi สาธารณะในหมู่บ้าน', i: '📶', cost: 1, desc: 'ชาวบ้านชื่นชม ความสนิทเพิ่ม' },
};
const Elect = {
  st() { if (!S.el2) S.el2 = { cand: null, support: 0, office: null, term: 0, proj: {}, pts: 0, banned: 0, held: {} }; return S.el2; },
  cyc() { return { n: Math.floor((S.day - 1) / 28), d: ((S.day - 1) % 28) + 1 }; },
  register(k) {
    const E = this.st(), X = ELECT[k], cy = this.cyc();
    if (cy.d > 14) { UI.toast('ปิดรับสมัครแล้ว (รับสมัครวันที่ 1-14 ของรอบ 4 สัปดาห์)', '🗳️'); return; }
    if (S.lvl < X.need) { UI.toast(`ต้อง Lv.${X.need} ขึ้นไป`, '🗳️'); return; } if (X.prev && !E.held[X.prev]) { UI.toast('ต้องเคยเป็นผู้ใหญ่บ้านมาก่อน', '🗳️'); return; }
    if (E.banned > S.day) { UI.toast(`ถูกตัดสิทธิ์เลือกตั้งถึง${RD(E.banned)}`, '⛔'); return; }
    if (E.cand || S.money < X.fee) return; S.money -= X.fee; E.cand = { k, n: cy.n }; E.support = 0; UI.toast(`สมัครรับเลือกตั้ง${X.n}แล้ว เลือกตั้งวันที่ 21 ของรอบ`, '🗳️');
  },
  campaign(kind) {
    const E = this.st(); if (!E.cand) return;
    if (kind === 'walk') { if (E.walkDay === S.day || !useEnergy(15)) return; E.walkDay = S.day; fade(() => { tick(120); E.support += 4; for (const n of G.npcs) if (!n.staff && Math.random() < 0.25) Friends.add(n.name, 0.15); UI.toast('เดินเคาะประตูบ้านหาเสียง ชาวบ้านรู้จักคุณมากขึ้น', '🚶'); }); }
    if (kind === 'rally') { if (S.money < 20000 || E.rallyDay === S.day) return; S.money -= 20000; E.rallyDay = S.day; E.support += 7; UI.toast('จัดเวทีปราศรัยนโยบาย คนมาฟังเยอะ', '📣'); }
    if (kind === 'buy') { S.money -= Math.min(S.money, 30000); if (Math.random() < 0.4) { E.cand = null; E.banned = S.day + 56; S.money = Math.max(0, S.money - 50000); Phone.msg('คณะกรรมการการเลือกตั้ง', 'ตรวจพบการซื้อเสียง ตัดสิทธิ์รับสมัครเลือกตั้ง 8 สัปดาห์ และปรับ 50,000 ฿ (ผิดกฎหมายเลือกตั้ง)', true); } else { E.support += 6; UI.toast('แจกเงิน... ผิดกฎหมายและอาจโดนจับได้ทุกเมื่อ', '😬'); } }
  },
  day() {
    const E = this.st(), cy = this.cyc();
    if (E.office && cy.d === 1 && E.term !== cy.n) { E.office = null; E.pts = 0; Phone.msg('อำเภอสุขใจ', 'ครบวาระการดำรงตำแหน่งแล้ว ลงสมัครรอบใหม่ได้', false); }
    if (E.cand && cy.d === 21) {
      const X = ELECT[E.cand.k], npcs = G.npcs.filter(n => !n.staff && S.friends[n.name] != null);
      const avg = npcs.length ? npcs.reduce((t, n) => t + Friends.get(n.name), 0) / npcs.length : 2;
      const me = U.clamp(30 + avg * 4 + E.support + (E.held.village ? 4 : 0) + (Math.random() - 0.5) * 14, 5, 90), rival = 100 - me;
      if (me > rival) { E.office = E.cand.k; E.term = cy.n + 1; E.held[E.cand.k] = 1; E.pts = E.cand.k === 'mayor' ? 4 : 2; Phone.msg('คณะกรรมการการเลือกตั้ง', `ผลการเลือกตั้ง${X.n}: คุณได้ ${Math.round(me)}% ชนะ! เริ่มดำรงตำแหน่งรอบหน้า เลือกโครงการพัฒนาได้ในแอป`, true); Life2.note(`ได้รับเลือกเป็น${X.n}! 🗳️`); }
      else Phone.msg('คณะกรรมการการเลือกตั้ง', `ผลการเลือกตั้ง${X.n}: คุณได้ ${Math.round(me)}% คู่แข่งได้ ${Math.round(rival)}% แพ้ไปนิดเดียว`, true);
      E.cand = null;
    }
    if (E.office && cy.d % 7 === 0) { const p = ELECT[E.office].pay; earn(p); Bank2.income('ค่าตอบแทน' + ELECT[E.office].n, p); }
    if (E.proj.park) S.mood = Math.min(100, (S.mood || 50) + 2);
  },
  approve(k) { const E = this.st(), P = TOWN_PROJ[k]; if (!E.office || E.proj[k] || E.pts < P.cost) return; E.pts -= P.cost; E.proj[k] = S.day; Life2.note(`อนุมัติโครงการ${P.n}`); if (k === 'wifi') for (const n of G.npcs) if (S.friends[n.name] != null) Friends.add(n.name, 0.3); UI.toast(`อนุมัติ${P.n} สำเร็จ ชาวบ้านชื่นชม`, P.i); },
  html() {
    const E = this.st(), cy = this.cyc();
    return `<p class="lead">🗳️ เลือกตั้งท้องถิ่นทุก 4 สัปดาห์ · รอบนี้${RD(cy.d)}/28 · รับสมัครวันที่ 1-14 · หาเสียงวันที่ 1-20 · เลือกตั้งวันที่ 21</p>
      ${E.office ? `<p class="lead good">ดำรงตำแหน่ง ${ELECT[E.office].n} · ค่าตอบแทน ${baht(ELECT[E.office].pay)}/เดือน · งบโครงการเหลือ ${E.pts} หน่วย</p><div class="grid">${Object.entries(TOWN_PROJ).map(([k, P]) => `<div class="card"><div class="ci">${P.i}</div><div class="cb"><h4>${P.n}${E.proj[k] ? ' ✅' : ''}</h4><p class="dim">${P.desc} · ใช้งบ ${P.cost}</p><div class="row"><button class="btn" data-a="elproj" data-v="${k}" ${E.proj[k] || E.pts < P.cost ? 'disabled' : ''}>อนุมัติ</button></div></div></div>`).join('')}</div>` : ''}
      ${E.cand ? `<p class="lead">กำลังลงสมัคร ${ELECT[E.cand.k].n} · คะแนนนิยมจากการหาเสียง +${E.support}</p><div class="row"><button class="btn" data-a="elcamp" data-v="walk">เดินเคาะประตู (พลังงาน 15)</button><button class="btn" data-a="elcamp" data-v="rally">ขึ้นเวทีปราศรัย 20,000 ฿</button><button class="btn danger" data-a="elcamp" data-v="buy">ซื้อเสียง (ผิดกฎหมาย)</button></div>` : `<div class="grid">${Object.entries(ELECT).map(([k, X]) => `<div class="card"><div class="ci">🗳️</div><div class="cb"><h4>${X.n}</h4><p class="dim">ค่าสมัคร ${baht(X.fee)} · ต้อง Lv.${X.need}${X.prev ? ' และเคยเป็นผู้ใหญ่บ้าน' : ''} · ค่าตอบแทน ${baht(X.pay)}/เดือน</p><div class="row"><button class="btn" data-a="elreg" data-v="${k}">ลงสมัคร</button></div></div></div>`).join('')}</div>`}
      <p class="dim">คะแนนเสียงมาจากความสนิทกับชาวบ้านทุกคน + การหาเสียง · ซื้อเสียงถ้าโดนจับถูกตัดสิทธิ์และปรับ</p>`;
  },
};
// projects that change the world: lights deter thieves, roads wear cars less, the market lifts stand prices
{ const _th = Sec.thiefMult.bind(Sec); Sec.thiefMult = () => _th() * (S.el2 && S.el2.proj.lights ? 0.75 : 1); }
{ const _dr = Town2.drive; Town2.drive = function (c, dist, hit, dt) { const d = c.d, cond = d.cond; const r = _dr.call(this, c, dist, hit, dt); if (S.el2 && S.el2.proj.road && d.cond < cond && !hit) d.cond = cond - (cond - d.cond) / 2; return r; }; }

// ===== water supply =====
const WATER_STEPS = [[10, 10.2], [20, 16], [30, 19], [50, 21.2], [80, 21.6], [1e9, 21.7]];
const WATER_ITEMS = {
  meter: { n: 'ขอติดตั้งมาตรวัดน้ำประปา 1/2 นิ้ว', i: '🚰', price: 3500, desc: 'ยื่นที่การประปา เจ้าหน้าที่สำรวจแล้วติดตั้งวันถัดไป (ค่าธรรมเนียม + ประกันมาตร)' },
  well: { n: 'เจาะบ่อบาดาล 60 ม. + ปั๊มซับเมอร์ส 1 แรงม้า', i: '🕳️', price: 52000, desc: 'น้ำฟรีไม่จำกัด แต่ปั๊มใช้ไฟ ~0.75 kW ตอนสูบ (ช่างเจาะ 2 วัน ต้องขออนุญาตใช้น้ำบาดาล)' },
  tank: { n: 'ถังเก็บน้ำ 2,000 ลิตร + ปั๊มอัตโนมัติ', i: '🛢️', price: 9900, desc: 'สำรองน้ำ หน้าแล้งแรงดันประปาตกก็ยังรดน้ำได้' },
  rain: { n: 'รางรับน้ำฝนลงถัง', i: '🌧️', price: 3500, desc: 'ฝนตกได้น้ำฟรีเข้าถัง (ต้องมีถังเก็บน้ำ)' },
  drip: { n: 'ระบบน้ำหยดทั้งแปลง + ตั้งเวลา', i: '💧', price: 12000, desc: 'รดน้ำทุกแปลงตอน 6:00 ใช้น้ำน้อยกว่าสปริงเกลอร์ 60% ใช้ได้แม้แรงดันต่ำ' },
};
const Water = {
  st() { if (!S.wtr) S.wtr = { meter: true, well: 0, wellDay: 0, tank: 0, rain: 0, drip: 0, lvl: 0, wk: 0, today: 0, lots: {} }; return S.wtr; },
  pressureOK() { const w = this.st(); return w.well || (w.tank && w.lvl > 100) || season().id !== 'hot' || (S.el2 && S.el2.proj.water) || S.time < 9 * 60; },
  use(m3) { const w = this.st(); if (w.tank && w.lvl > 0) { const t = Math.min(w.lvl / 1000, m3); w.lvl -= t * 1000; m3 -= t; } if (m3 <= 0) return; if (w.well) { (Power.st().today.use += m3 / 2 * 0.75); return; } w.wk += m3; w.today += m3; },
  day() {
    const w = this.st();
    if (w.wellDay && S.day >= w.wellDay) { w.well = 1; w.wellDay = 0; Phone.msg('ช่างเจาะบาดาล', 'เจาะบ่อบาดาลเสร็จแล้ว น้ำใส ปริมาณ 2 ลบ.ม./ชม.', false); }
    if (w.rain && w.tank && WEATHER[S.weather.type].rain > 0.3) w.lvl = Math.min(2000, w.lvl + 900);
    if (w.drip) { let n = 0; S.plots.forEach(p => { if (p.c && p.w <= 0) { p.w = 1; n++; } }); this.use(n * 0.012); }
    this.use(0.45 + S.animals.length * 0.04 + (S.f2 ? 0.2 : 0)); w.today = 0;
  },
  bill(m3) { let left = m3, prev = 0, t = 0; for (const [cap, r] of WATER_STEPS) { const u = Math.min(left, cap - prev); if (u <= 0) break; t += u * r; left -= u; prev = cap; } return Math.round(Math.max(50, t) * 1.07); },
  buy(k) {
    const w = this.st(), X = WATER_ITEMS[k]; if (S.money < X.price) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(X.price), '💸'); return; }
    if (k === 'meter') { if (w.meter) return; S.money -= X.price; w.meterDay = S.day + 1; UI.toast('ยื่นคำขอใช้น้ำแล้ว ติดตั้งพรุ่งนี้', '🚰'); return; }
    if (k === 'rain' && !w.tank) { UI.toast('ต้องมีถังเก็บน้ำก่อน', '🛢️'); return; }
    if (w[k] || (k === 'well' && w.wellDay)) return; S.money -= X.price; Bank2.log(X.n, -X.price);
    if (k === 'well') { w.wellDay = S.day + 2; UI.toast('ช่างเริ่มเจาะบ่อบาดาล เสร็จใน 2 วัน', '🕳️'); } else { w[k] = 1; if (k === 'tank') w.lvl = 1000; UI.toast(`ติดตั้ง${X.n}แล้ว`, X.i); }
  },
  html() {
    const w = this.st();
    return `<p class="lead">💧 น้ำประปา ${w.meter ? '✅ มีมาตรวัด' : '❌ ยังไม่มี'} · บาดาล ${w.well ? '✅' : w.wellDay ? '🛠️ กำลังเจาะ' : '❌'} · ถัง ${w.tank ? Math.round(w.lvl) + '/2,000 ลิตร' : '❌'} · แรงดันน้ำตอนนี้ ${this.pressureOK() ? '✅ ปกติ' : '⚠️ ต่ำ (หน้าแล้งช่วงกลางวัน สปริงเกลอร์รดได้ไม่ทั่ว)'} · ใช้น้ำประปาสัปดาห์นี้ ${w.wk.toFixed(1)} ลบ.ม. (~${baht(this.bill(w.wk))})</p>
      <div class="grid">${Object.entries(WATER_ITEMS).map(([k, X]) => `<div class="card"><div class="ci">${X.i}</div><div class="cb"><h4>${X.n}</h4><p class="dim">${X.desc}</p><div class="row"><button class="btn" data-a="wbuy" data-v="${k}" ${w[k] || (k === 'well' && w.wellDay) || S.money < X.price ? 'disabled' : ''}>${w[k] ? 'มีแล้ว' : baht(X.price)}</button></div></div></div>`).join('')}</div>
      <p class="dim">อัตราประปา (บ้านอยู่อาศัย): 1-10 ลบ.ม. 10.20 ฿ · 11-20 16 ฿ · 21-30 19 ฿ · เกิน 30 ~21 ฿ + VAT 7% (ขั้นต่ำ 50 ฿)</p>`;
  },
};
// sprinklers and the smart garden only reach part of the field when the mains pressure drops
{ const _rs = runSprinklers; runSprinklers = function (visual) { if (Water.pressureOK()) { Water.use(G.spr.length * 0.15); return _rs(visual); } const keep = S.plots.map(p => p.w); _rs(visual); S.plots.forEach((p, i) => { if (keep[i] <= 0 && p.w > 0 && Math.random() < 0.45) p.w = keep[i]; }); }; }
{ const _sw = Smart.water.bind(Smart); Smart.water = when => { if (!Water.pressureOK()) { UI.toast('แรงดันน้ำประปาต่ำ ระบบรดน้ำทำงานได้บางส่วน (ติดถังเก็บน้ำหรือบ่อบาดาล)', '💧'); S.plots.forEach(p => { if (p.c && p.w <= 0 && Math.random() < 0.5) p.w = 1; }); return; } return _sw(when); }; }
{ const _b = Life2.bill.bind(Life2); Life2.bill = () => { const oldW = S.billDue ? S.billDue.water : 0; _b(); const w = Water.st(); if (S.billDue && w.meter) S.billDue.water = Water.bill(w.wk) + oldW; w.wk = 0; }; }

// ===== quality presets & building merge =====
const Perf3 = {
  merge(b) {
    b.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(b.matrixWorld).invert(), buckets = new Map(), meshes = [];
    b.traverse(o => { if (o === b || !o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || !o.geometry || !o.geometry.attributes.position || o.material.map && o.material.map.isCanvasTexture) return; meshes.push(o); });
    if (meshes.length < 4) return 0;
    try {
      for (const o of meshes) { const k = o.material.uuid + (o.castShadow ? 's' : ''); if (!buckets.has(k)) buckets.set(k, { mat: o.material, sh: o.castShadow, geos: [] }); buckets.get(k).geos.push(U.bake(o.geometry, new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld))); }
      const out = []; for (const bk of buckets.values()) { const m = new THREE.Mesh(U.mergeGeos(bk.geos), bk.mat); m.castShadow = bk.sh; m.receiveShadow = true; m.matrixAutoUpdate = false; out.push(m); }
      for (const o of meshes) o.parent.remove(o); for (const m of out) b.add(m);
      return meshes.length - out.length;
    } catch (e) { return 0; }
  },
  run() {
    let saved = 0, n = 0; const L = [];
    World.outdoor.traverse(o => { if (o.userData.staticB && !o.userData.merged) L.push(o); });
    for (const b of L) { b.userData.merged = 1; const s = this.merge(b); if (s) { saved += s; n++; } }
    this.info = { buildings: n, meshesRemoved: saved };
  },
  measure() {
    const r = G.renderer, ar = r.info.autoReset; r.info.autoReset = false; r.info.reset(); const t0 = performance.now();
    for (let i = 0; i < 5; i++) r.render(G.scene, G.camera);
    const ms = (performance.now() - t0) / 5, calls = r.info.render.calls / 5, tris = r.info.render.triangles / 5; r.info.autoReset = ar; r.info.reset();
    return { calls: Math.round(calls), tris: Math.round(tris), ms: +ms.toFixed(2) };
  },
};
const Life3 = {
  init() {
    PTax.st(); Elect.st(); Water.st();
    APPS.splice(10, 0, { id: 'tax', i: '🧾', n: 'ภาษี' }, { id: 'vote', i: '🗳️', n: 'เลือกตั้ง' }, { id: 'water', i: '💧', n: 'การประปา' });
    Phone.apps.tax = () => PTax.html(); Phone.apps.vote = () => Elect.html(); Phone.apps.water = () => Water.html();
    // quality modes in settings
    const _menu = UI.menu.bind(UI); UI.menu = () => { _menu(); const r = UI.cur.render; UI.cur.render = t => r(t).replace('<button class="btn danger" data-a="newgame">', `<h5>🎚️ โหมดภาพ</h5><div class="row"><button class="btn ghost" data-a="qmode" data-v="pretty">เน้นภาพสวย</button><button class="btn ghost" data-a="qmode" data-v="balance">สมดุล</button><button class="btn ghost" data-a="qmode" data-v="smooth">เน้นลื่น</button></div><button class="btn danger" data-a="newgame">`); UI.renderBody(); };
    setTimeout(() => { this.before = Perf3.measure(); Perf3.run(); this.after = Perf3.measure(); }, 3500);
  },
  day() { PTax.roll(); Elect.day(); Water.day(); const w = Water.st(); if (w.meterDay && S.day >= w.meterDay) { w.meter = true; w.meterDay = 0; Phone.msg('การประปาสุขใจ', 'ติดตั้งมาตรวัดน้ำเรียบร้อยแล้ว', false); } },
};
Object.assign(UI.H, {
  ptfile: () => PTax.file(), ptlife: () => { if (S.money < 20000) { UI.toast('เงินไม่พอ (เบี้ยประกันชีวิต 20,000 ฿)', '💸'); return; } S.money -= 20000; PTax.st().life += 20000; PTax.st().cur.life = (PTax.st().cur.life || 0) + 20000; UI.toast('ซื้อประกันชีวิตแล้ว ลดหย่อนภาษีได้', '🛡️'); },
  ptrmf: () => { if (S.money < 50000) { UI.toast('เงินไม่พอ (ลงทุน RMF 50,000 ฿)', '💸'); return; } S.money -= 50000; PTax.st().rmf.push({ day: S.day, v: 50000 }); PTax.st().cur.rmf = (PTax.st().cur.rmf || 0) + 50000; UI.toast('ลงทุน RMF แล้ว ลดหย่อนภาษีได้ ถือครบ 1 ปีเกมถอนได้', '📈'); },
  ptrmfout: () => { const s = PTax.st(); let v = 0; s.rmf = s.rmf.filter(f => { if (S.day - f.day >= YEAR_DAYS) { v += Math.round(f.v * 1.04); return false; } return true; }); if (v) { earn(v); UI.toast(`ถอน RMF ได้ ${baht(v)}`, '📈'); } },
  elreg: d => Elect.register(d.v), elcamp: d => Elect.campaign(d.v), elproj: d => Elect.approve(d.v), wbuy: d => Water.buy(d.v),
  qmode: d => { const m = { pretty: ['ultra', '1'], balance: ['high', '1'], smooth: ['med', '0'] }[d.v]; safeSet(Q_KEY, m[0]); safeSet('raisukjai3d_bloom', m[1]); UI.toast('ตั้งค่าแล้ว กำลังโหลดใหม่...', '🎚️'); setTimeout(() => location.reload(), 600); },
});
