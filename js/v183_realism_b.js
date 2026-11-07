'use strict';
// ---------- v183_realism_b: group B of the realism pass ----------
//  B1  traffic enforcement: driving without a licence / with an expired licence, drink-driving (checkpoints), licence suspension, insurance void after a drink-drive
//  B4  pregnancy lasts 9 months with antenatal visits (the flow itself is in v26_life.js); maternity leave 98 days + maternity pay here
//  B5  monthly pay (last day of the month), absence counted over the month, double pay for working a public holiday, leave: sick 30 days a year, personal 3, holiday leave 6 after a year of service
//  B6  health insurance: age-based premium, 30-day waiting period before it pays; car insurance void for 30 days after a drink-drive
//  B7  social security: unemployment benefit (50 % of wages up to 17,500, 6 months) when dismissed without fault after 6 months of contributions
//  B9  mortgage instalment: a reminder 2 days before the 1st (and a warning when the savings account is short)
//  B10 CCTV and the PDPA: cameras need a warning sign, otherwise a neighbour may complain (fine)
//  C1  children's ages follow the real calendar (Kid182); everything that used the old compressed ages gets the same scale back through Kid182.d(k)
V23.add('v183_realism_b', () => {
  const X = () => { const s = S.v183 = S.v183 || {}; return s; };
  const msg = (f, t, imp) => { try { Phone.msg(f, t, imp); } catch (e) { } };
  const toast = (t, i) => { try { UI.toast(t, i || '📋'); } catch (e) { } };
  const nowMin = () => S.day * 1440 + (S.time || 0);

  // ---------- C1: children's real ages ----------
  const oldAge = d => d < 14 ? d * 6 / 14 : d < 42 ? 6 + (d - 14) * 9 / 28 : d < 70 ? 15 + (d - 42) * 3 / 28 : d < 84 ? 18 + (d - 70) * 4 / 14 : 22 + (d - 84) / 21;
  const mig = () => { const x = X(); if (x.migDay == null) x.migDay = S.day; return x.migDay; };
  const age = k => {
    const born = +k.born || S.day, m = mig(), real = Math.max(0, S.day - born) / 365;
    if (born >= m) return real;                                                   // born after this update: plain real age
    if (k._off182 == null) k._off182 = oldAge(Math.max(0, m - born)) - (m - born) / 365;   // older child: keeps the age it had, then grows at the real pace
    return real + k._off182;
  };
  // the old "days lived" scale (14 days = 6 years, 42 = 15, 70 = 18, 84 = 22 ...) for the many rules written against it
  const dOf = y => y < 6 ? y * 14 / 6 : y < 15 ? 14 + (y - 6) * 28 / 9 : y < 18 ? 42 + (y - 15) * 28 / 3 : y < 22 ? 70 + (y - 18) * 14 / 4 : 84 + (y - 22) * 21;
  window.Kid182 = { age, d: k => dOf(age(k)), oldAge, dOf };
  mig();
  // kids that exist now keep their age: fix the offset at once (not later, when more days have passed)
  try { for (const k of (Social.st().kids || [])) age(k); } catch (e) { }

  // ---------- B1: traffic enforcement ----------
  const DRINK = /เบียร์|โมจิโต้มะนาว|ไวน์|เหล้า|วิสกี้|ค็อกเทล|สุรา/;
  const mark = () => { X().drunk = nowMin() + 360; };
  { let seen = null; setInterval(() => { try { const L = (Bank49.V().slips) || []; const top = L.length ? L[0].id : null; if (seen == null) { seen = top; return; } for (const s of L) { if (s.id === seen) break; if (DRINK.test(String(s.memo || '')) && /ทานอาหาร|กลับบ้าน|ส่งถึงบ้าน|ซื้อ/.test(String(s.memo || '')) && s.d === S.day) mark(); } seen = top; } catch (e) { } }, 1500); }
  if (typeof Food !== 'undefined') for (const k of ['dine', 'takeaway', 'order']) { const o = Food[k]; if (typeof o !== 'function') continue; Food[k] = function (id) { const r = o.apply(this, arguments); try { if (DRINK.test(String((FOODS[id] || {}).n || '')) && !(UI.cur && UI.cur.title === '💳 เลือกวิธีชำระเงิน')) mark(); } catch (e) { } return r; }; }
  const drunk = () => nowMin() < (X().drunk || 0);
  const suspended = () => (X().susp || 0) > S.day;
  if (typeof enterCar === 'function') { const _e = enterCar; enterCar = function () { if (suspended()) { toast(`ใบขับขี่ถูกพักใช้ถึง${RD(X().susp)} ขับรถไม่ได้`, '🚫'); return; } return _e.apply(this, arguments); }; }
  if (typeof Emergency !== 'undefined' && Emergency.hourly) {
    const _h = Emergency.hourly.bind(Emergency);
    Emergency.hourly = function () {
      _h();
      try {
        const o = G.driving; if (!o || G.away) return; const x = X(), g = (S.gov24 = S.gov24 || { fines: [], bills: [] }); g.fines = g.fines || [];
        if (x.ck3 === S.day || Math.random() > 0.15) return;
        let what = '', amt = 0, extra = '';
        if (drunk()) { what = 'เมาแล้วขับ (ตรวจวัดแอลกอฮอล์ในเลือดเกินกำหนด)'; amt = 10000; x.susp = S.day + 180; x.insVoid = S.day + 30; extra = ' ใบขับขี่ถูกพักใช้ 180 วัน และประกันรถไม่คุ้มครองอุบัติเหตุ 30 วัน'; }
        else if (!S.license) { what = 'ขับรถโดยไม่มีใบอนุญาตขับขี่'; amt = 1000; }
        else if (S.licExp && S.day > S.licExp) { what = 'ขับรถด้วยใบอนุญาตขับขี่ที่หมดอายุ'; amt = 1000; }
        if (!what) return;
        x.ck3 = S.day; g.fines.push({ what, amt, d: S.day, due: S.day + 15 });
        toast(`ด่านตรวจ: ${what} ปรับ ${baht(amt)}${extra}`, '🚔'); msg('สถานีตำรวจภูธรสุขใจ', `ใบสั่ง: ${what} ปรับ ${baht(amt)} ชำระที่ศาลหรือแอปราชการภายใน 15 วัน${extra}`);
      } catch (e) { }
    };
  }
  if (typeof Ins !== 'undefined') {
    const _has = Ins.has.bind(Ins);
    Ins.has = function (k) {
      if (!_has(k)) return false;
      if (/^car/.test(k) && (X().insVoid || 0) > S.day) return false;                       // insurance void after a drink-drive
      if (k === 'health') { const h = X().hStart; if (h != null && S.day - h < 30) return false; }   // waiting period
      return true;
    };
    const _buy = Ins.buy.bind(Ins);
    Ins.buy = function (k) { const was = _has(k); const r = _buy(k); try { if (k === 'health' && !was && _has(k)) { X().hStart = S.day; toast('ประกันสุขภาพมีระยะรอ 30 วัน (ยังเคลมโรคไม่ได้) แต่อุบัติเหตุคุ้มครองทันที', '🏥'); } } catch (e) { } return r; };
    // age-based premium (the price in the list is for age 30)
    const reprice = () => { try { const a = Ppl36.myAge(); INS.health.price = Math.round(1500 * (1 + Math.max(0, a - 30) * 0.035 - Math.max(0, 30 - a) * 0.01)); } catch (e) { } };
    reprice(); setInterval(reprice, 60000);
  }

  // ---------- B5: monthly pay, leave, public-holiday pay ----------
  if (typeof Career !== 'undefined') {
    const dim = (y, m) => Cal36.daysIn(y, m);
    Career.payday = function () {
      const j = this.st(), C = this.C(); if (!C) return;
      const dt = Cal36.date(); if (dt.dom !== dim(dt.y, dt.m)) return;                      // the last day of the calendar month
      const n0 = j.slips.length && j.slips[0].day;
      if (!j.leave || j.leave.cy !== dt.y) { const emp = j.empDays || (j.weeks || 0) * 7; j.leave = { sick: 30, biz: 3, vac: emp >= 365 ? 6 : 0, cy: dt.y, year: 0 }; }
      const from = j.lastPay != null ? j.lastPay + 1 : S.day - dt.dom + 1, days = []; for (let d = from; d <= S.day; d++) if (C.days.includes(this.dayIdx(d))) days.push(d);
      const work = Math.max(1, days.length), absent = days.filter(d => j.done[d] === 'absent').length, gross = this.salary(), cut = Math.round(gross / work * absent);
      const hol = days.filter(d => j.done[d] && j.done[d] !== 'absent' && (() => { try { const e = Cal36.event(d); return e && e.hol; } catch (er) { return false; } })()).length, holPay = Math.round(gross / 30 * hol);
      const ss = C.gov ? Math.round((gross - cut) * 0.03) : Math.min(875, Math.round(Math.min(gross - cut, 17500) * 0.05)), tax = typeof Biz31 !== 'undefined' ? Biz31.whtMonthly(gross - cut + holPay) : 0, net = gross - cut + holPay - ss - tax;
      earn(net); Bank2.income('เงินเดือน ' + C.n, net);
      j.slips.unshift({ day: S.day, rank: this.rankName(), gross: gross + holPay, cut, ss, tax, net, gov: C.gov }); j.slips.length = Math.min(j.slips.length, 12);
      msg('ฝ่ายบุคคล', `สลิปเงินเดือนประจำเดือน: ${this.rankName()} เงินเดือน ${baht(gross)}${holPay ? ` ค่าทำงานวันหยุดนักขัตฤกษ์ ${baht(holPay)} (${hol} วัน)` : ''}${cut ? ` หักขาดงาน ${baht(cut)}` : ''} หัก${C.gov ? 'กบข. 3%' : 'ประกันสังคม 5%'} ${baht(ss)}${tax ? ` ภาษี ${baht(tax)}` : ''} รับสุทธิ ${baht(net)}`);
      j.weeks++; j.lastPay = S.day; for (const d in j.done) if (+d < S.day - 45) delete j.done[d]; for (const d in j.onLeave) if (+d < S.day - 45) delete j.onLeave[d];
      if (j.warn > 0 && absent === 0 && j.weeks % 2 === 0) { j.warn--; msg('ฝ่ายบุคคล', 'ประพฤติดีต่อเนื่อง ลบใบเตือน 1 ใบ', false); }
      const next = C.ranks[j.rank + 1];
      if (next) { const need = 22 + j.rank * 10, wk = 1 + Math.floor(j.rank / 2); if (j.pts >= need && j.weeks >= wk) { if (next[2]) { j.examOK = 1; msg('ฝ่ายบุคคล', `คุณมีสิทธิ์สอบเลื่อนเป็น${next[0]} สอบได้ในแอปงานประจำ`); } else this.promote(); } }
      // keep the tax bookkeeping of life3.js (its wrapper was replaced by this function)
      try { const sl = j.slips[0]; if (sl && sl.day !== n0) { const c = PTax.st().cur; c.sal += sl.gross - sl.cut; c.wht += sl.tax; c.ss += sl.ss; } } catch (e) { }
    };
    // days of service (for severance) and the leave kinds
    const _fire = Career.fire.bind(Career);
    Career.fire = function (why, grave) {
      const j = this.st(), had = j.k, emp = j.empDays || (j.weeks || 0) * 7, gov = this.C() && this.C().gov; const sal = this.salary();
      const r = _fire(why, grave);
      try { if (had && !grave && !gov && emp >= 180) { X().un = { until: S.day + 180, next: S.day + 30, wage: Math.min(sal, 17500) }; msg('สำนักงานประกันสังคม', 'คุณถูกเลิกจ้างโดยไม่มีความผิด และส่งเงินสมทบครบ 6 เดือน มีสิทธิ์รับเงินทดแทนการว่างงาน 50% ของค่าจ้าง (ไม่เกินฐาน 17,500) นานสูงสุด 180 วัน จะโอนเข้าบัญชีทุกเดือนระหว่างที่ยังไม่มีงานทำ'); } } catch (e) { }
      return r;
    };
    const _h = Career.html.bind(Career);
    Career.html = function (tab) {
      let h = _h(tab); const j = this.st();
      h = h.replace('1 สัปดาห์ในเกม = 1 เดือน · เงินเดือนออกทุกวันที่ 7 ของสัปดาห์', 'เงินเดือนออกวันสุดท้ายของเดือน · ลาป่วยปีละ 30 วัน (ใบรับรองแพทย์ถ้าลา 3 วันขึ้นไป) · ลากิจ 3 วัน · พักร้อน 6 วันหลังทำงานครบ 1 ปี · ทำงานวันหยุดนักขัตฤกษ์ได้ค่าแรงเพิ่ม 1 วัน');
      if (this.C() && j.leave && j.leave.vac > 0) h += `<div class="row"><button class="btn ghost" data-a="jobleave" data-k="vac" data-v="${S.day + 1}">🏖️ ลาพักร้อนพรุ่งนี้ (เหลือ ${j.leave.vac} วัน)</button></div>`;
      return h;
    };
  }
  // days of employment counter + unemployment benefit + maternity pay
  const daily = () => {
    try {
      const j = typeof Career !== 'undefined' ? Career.st() : null, x = X();
      if (j && j.k) j.empDays = (j.empDays || (j.weeks || 0) * 7) + 1;
      if (x.un) { if (j && j.k) x.un = null; else if (S.day >= x.un.until) x.un = null; else if (S.day >= x.un.next) { x.un.next = S.day + 30; const a = Math.round(x.un.wage * 0.5); earn(a); Bank2.income('ประกันสังคม: เงินทดแทนการว่างงาน', a); msg('สำนักงานประกันสังคม', `โอนเงินทดแทนการว่างงาน ${baht(a)} เข้าบัญชีแล้ว`); } }
      // maternity: a new baby for an employed player -> 98 days of leave, 45 days of wages from the employer and the social security allowance
      const f = (S.v26l && S.v26l.fam) || null, nk = f ? f.kids.length : 0; if (x.kidsN == null) x.kidsN = nk;
      if (nk > x.kidsN) { x.kidsN = nk; if (j && j.k) { const C = Career.C(), sal = Career.salary(); let n = 0; for (let d = S.day; n < 98 && d < S.day + 200; d++) if (Career.shift(d)) { j.onLeave[d] = 'mat'; n++; } if (!C.gov) { const a = Math.round(sal / 30 * 45 + Math.min(sal, 17500) / 30 * 0.5 * 45); earn(a); Bank2.income('ค่าตอบแทนลาคลอด (นายจ้าง 45 วัน + ประกันสังคม)', a); } msg('ฝ่ายบุคคล', `อนุมัติลาคลอด 98 วัน${C.gov ? '' : ` และโอนค่าตอบแทนลาคลอด`} ขอให้ดูแลลูกน้อยให้ดี`); } }
      // B9: mortgage reminder two days before the 1st
      const dt = Cal36.date(); if (dt.dom === Cal36.daysIn(dt.y, dt.m) - 1) { const E = window.Estate39 && Estate39.X(); const act = E && E.mort ? E.mort.filter(m => m.bal > 0) : []; if (act.length && x.mrem !== S.day) { x.mrem = S.day; const due = act.reduce((s, m) => s + (m.pmt || 0), 0), sav = Bank.st().sav + S._c; msg('ธนาคารสุขใจ', `เตือนงวดผ่อนสินเชื่อบ้านวันที่ 1 ยอดประมาณ ${baht(due)} จะตัดบัญชีออมทรัพย์อัตโนมัติ${sav < due ? ' ⚠️ เงินในบัญชีไม่พอ รีบโอนเข้า ไม่เช่นนั้นจะค้างงวดและเสียค่าปรับ/เครดิตบูโร' : ''}`, true); } }
      // B10: CCTV without a warning sign -> a neighbour may complain (PDPA)
      if (dt.dom === 15 && x.pdpa !== S.day) { x.pdpa = S.day; const cams = ((Sec.site('home') || {}).dev || []).filter(d => DEV[d.k] && DEV[d.k].t === 'cam').length; if (cams > 0 && !count('cctv_sign') && Math.random() < 0.3) { const fine = 5000; try { if (S.money >= fine) { S.money -= fine; Bank2.log('ค่าปรับ PDPA: กล้องวงจรปิดไม่มีป้ายเตือน', -fine); } } catch (e) { } msg('สำนักงานคุ้มครองข้อมูลส่วนบุคคล', `เพื่อนบ้านร้องเรียนกล้องวงจรปิดของคุณถ่ายติดบริเวณนอกบ้านโดยไม่มีป้ายเตือน (PDPA) ปรับ ${baht(fine)} ซื้อ "ป้ายเตือนกล้องวงจรปิด" ที่ร้านไอที & ซีเคียวริตี้ แล้วติดไว้ให้เรียบร้อย`, true); } }
    } catch (e) { console.warn('v183 daily', e); }
  };
  { const nd = newDay; newDay = function () { const r = nd.apply(this, arguments); daily(); return r; }; }

  // ---------- B10: the warning sign item ----------
  try {
    GOODS.cctv_sign = { n: 'ป้ายเตือน "มีการใช้กล้องวงจรปิด (CCTV)" ตาม PDPA', i: '🪧', price: 150, desc: 'ติดไว้หน้าบ้านเมื่อมีกล้องวงจรปิดที่ถ่ายติดบริเวณนอกบ้าน ป้องกันการร้องเรียนตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล (มีของอยู่ในกระเป๋าก็ถือว่าติดป้ายแล้ว)', kid: 0, use: null, noEffect: 1 };
    if (typeof TOOLS !== 'undefined') TOOLS.cctv_sign = { n: GOODS.cctv_sign.n, i: GOODS.cctv_sign.i, price: GOODS.cctv_sign.price, desc: GOODS.cctv_sign.desc };
    if (typeof ITEMS !== 'undefined') ITEMS.cctv_sign = { n: GOODS.cctv_sign.n, i: GOODS.cctv_sign.i, cat: 'tool' };
    const add = () => { const t = (SHOPS.itshop && SHOPS.itshop.tabs || []).find(q => /กล้องวงจรปิด/.test(q.n || '')); if (t && !t.items.includes('tool:cctv_sign')) t.items.unshift('tool:cctv_sign'); const t2 = (SHOPS.secshop && SHOPS.secshop.tabs || []).find(q => /กล้องวงจรปิด/.test(q.n || '')); if (t2 && !t2.items.includes('tool:cctv_sign')) t2.items.unshift('tool:cctv_sign'); };
    add(); setTimeout(add, 3000); setTimeout(add, 15000);
    if (typeof ItemUse177 !== 'undefined' && ItemUse177.NOEFF) ItemUse177.NOEFF.add('cctv_sign');
  } catch (e) { console.warn('v183 sign', e); }

  window.Realism183 = { drunk, suspended, mark, X };
});
