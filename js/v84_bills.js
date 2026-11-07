// v84_bills.js: every bill in one place, billed the way real life does it
//  - v139: also the village common-area fee (HOA), vehicle tax + compulsory insurance, personal income tax, shop rent and insurance premiums
//  - phone: a "บิล & ค่าบริการ" category (popup) with one menu per bill type: electricity, water, internet, land tax, fines, credit card & loans. Each menu page shows the statement
//    (amount, date issued, due date, status), the billing cycle, the payment channel (transfer yourself / automatic debit) and the history. There is NO pay button on these pages
//  - paying is done in the bank app only (new "🧾 บิล" tab): choose the account, press transfer. The old pay buttons scattered over other pages are replaced by a pointer to the bank app
//  - cycles are monthly on the real calendar: electricity and water are metered all month and billed on the 1st (due 14 days later, power is cut 7 days after the due date),
//    internet is billed on the 1st (one month's fee), loans and the credit card are debited on the 25th. Land tax is yearly, fines are due 15 days after they are issued
//  - reminders: a message when a bill is issued, 3 days before it is due, on the due day, and every 3 days while it is overdue
V23.add('v84_bills', () => {
  if (typeof Life2 === 'undefined' || typeof Phone === 'undefined' || typeof Cal36 === 'undefined') return;
  const E = s => (typeof esc === 'function' ? esc(s) : String(s));
  const st = () => { const s = S.b84 = S.b84 || {}; s.auto = s.auto || {}; s.acc = s.acc || { elec: 0, water: 0 }; s.hist = s.hist || []; s.n = s.n || {}; s.isp = s.isp || null; return s; };
  const dom = d => { try { return Cal36.date(d).dom; } catch (e) { return 0; } };
  const nextOn = (day, from = S.day) => { for (let k = 1; k <= 62; k++) if (dom(from + k) === day) return from + k; return from + 30; };
  const DUE = 14, GRACE = 7, ISSUE_DAY = 1, DEBIT_DAY = 25;
  const toast = (t, i) => { try { UI.toast(t, i || '🧾'); } catch (e) { } };
  const msg = t => { try { Phone.msg('บิล & ค่าบริการ', t, true); } catch (e) { } };
  const CATS = {
    elec: { i: '⚡', n: 'ค่าไฟฟ้า', from: 'การไฟฟ้าส่วนภูมิภาค', cyc: `รอบบิลรายเดือน · ตัดรอบ/ออกบิลวันที่ ${ISSUE_DAY} ของทุกเดือน · ครบกำหนดชำระ ${DUE} วันหลังออกบิล · เกินกำหนดอีก ${GRACE} วันถูกตัดไฟ` },
    water: { i: '💧', n: 'ค่าน้ำประปา', from: 'การประปาส่วนภูมิภาค', cyc: `รอบบิลรายเดือน · ออกบิลวันที่ ${ISSUE_DAY} ของทุกเดือน · ครบกำหนดชำระ ${DUE} วันหลังออกบิล` },
    net: { i: '🌐', n: 'อินเทอร์เน็ตบ้าน', from: 'ผู้ให้บริการอินเทอร์เน็ต', cyc: `ค่าบริการรายเดือน (รวม VAT 7%) · ออกบิลวันที่ ${ISSUE_DAY} ของทุกเดือน · ครบกำหนด ${DUE} วัน · ค้างครบ 2 รอบถูกระงับสัญญาณ` },
    tax: { i: '🏘️', n: 'ภาษีที่ดินและสิ่งปลูกสร้าง', from: 'อบต.สุขใจ', cyc: 'ภาษีรายปี · ออกใบแจ้งปีละครั้ง · ครบกำหนด 28 วัน · เกินกำหนดปรับ 20%' },
    fine: { i: '🚓', n: 'ใบสั่งและค่าปรับ', from: 'ตำรวจ / ขนส่ง', cyc: 'ชำระภายใน 15 วันนับจากวันที่ออกใบสั่ง · เกินกำหนดปรับเป็น 2 เท่า' },
    card: { i: '💳', n: 'บัตรเครดิตและสินเชื่อ', from: 'ธนาคารสุขใจ', cyc: `ค่างวดสินเชื่อและยอดขั้นต่ำบัตรเครดิต ตัดบัญชีออมทรัพย์อัตโนมัติวันที่ ${DEBIT_DAY} ของทุกเดือน (ต้องมีเงินในบัญชี)` },
  };
  // v139: everything else in the game that is billed or must be paid by a due date
  CATS.hoa = { i: '🏠', n: 'ค่าส่วนกลางหมู่บ้าน', from: 'นิติบุคคลหมู่บ้านจัดสรรสุขใจวิลล่า', cyc: 'ใบแจ้งหนี้ทุกต้นเดือน (รอบ 4 สัปดาห์) · ครบกำหนด 25 วัน · ค้างเกิน 1 งวดโดนค่าปรับ 2% ค้างเกิน 3 งวดถูกระงับสิทธิ์สโมสร/สระ' };
  CATS.veh = { i: '🚗', n: 'ภาษีรถ + พ.ร.บ.', from: 'กรมการขนส่งทางบก', cyc: 'ต่อทุกปี · ออกบิลล่วงหน้า 30 วันก่อนหมดอายุ · เกินกำหนดปรับ 20% และขับบนถนนไม่ได้' };
  CATS.ptax = { i: '📑', n: 'ภาษีเงินได้บุคคลธรรมดา', from: 'กรมสรรพากร', cyc: 'ยื่นปีละครั้งต้นปีภาษีใหม่ ภายใน 7 วัน · ยื่นช้ามีค่าปรับและเงินเพิ่ม' };
  CATS.rent = { i: '🏪', n: 'ค่าเช่าร้านห้องแถว', from: 'เจ้าของห้องแถวทุ่งทอง', cyc: 'สัญญาเช่า 7 วัน 3,000 ฿ · บิลต่อสัญญาออก 2 วันก่อนหมดสัญญา · หมดแล้วของในร้านถูกคืนเข้ากระเป๋า' };
  CATS.ins = { i: '🛡️', n: 'เบี้ยประกัน', from: 'บริษัทประกันสุขใจ', cyc: 'กรมธรรม์ 28 วัน · บิลต่ออายุออก 5 วันก่อนหมดอายุ · หมดแล้วไม่คุ้มครอง' };
  CATS.sso = { i: '🏥', n: 'เงินสมทบประกันสังคม ม.40', from: 'สำนักงานประกันสังคม', cyc: 'ส่งทุก 28 วัน 70 ฿ · บิลออก 5 วันก่อนครบกำหนด · ขาดส่งเกิน 7 วันสิทธิถูกระงับ' };
  CATS.co = { i: '🏢', n: 'เติมเงินบัญชีบริษัท (ติดลบ)', from: 'บริษัทของคุณ / ธนาคาร', cyc: 'บริษัทจ่ายเงินเดือน ประกันสังคม ค่าเช่า ค่าไฟ เน็ต ทำบัญชี และ VAT จากบัญชีบริษัทเอง · ถ้าบัญชีติดลบจะออกบิลให้เติมเงิน · ติดลบครบ 3 รอบ บริษัทหยุดดำเนินการ' };
  const ORDER = ['elec', 'water', 'net', 'tax', 'fine', 'card', 'hoa', 'veh', 'ptax', 'rent', 'ins', 'sso', 'co'];
  const monthStart = d => d - (dom(d) - 1);
  const carTaxAmt = c => (window.CarTax182 ? CarTax182.amt(c) : Math.max(300, Math.round(((CARS[c.type] || {}).price || 100000) * 0.006)) + 645);
  const extra = () => {
    const out = [];
    try { const h = (S.v26l || {}).hoa; if (h && h.due > 0) { const iss = monthStart(S.day); out.push({ id: 'hoa:' + iss, cat: 'hoa', name: 'ค่าส่วนกลางหมู่บ้าน' + (h.late ? ` (ค้าง ${h.late} งวด)` : ''), amt: Math.round(h.due), iss, due: iss + 25 }); } } catch (e) { }
    try { (S.cars || []).forEach((c, i) => { if (!c || !c.reg || !c.tax) return; if (c.tax - S.day > 30) return; const late = S.day > c.tax ? (window.CarTax182 ? CarTax182.late(c) : Math.round(carTaxAmt(c) * 0.2)) : 0; out.push({ id: 'veh:' + i + ':' + c.tax, cat: 'veh', name: `ภาษีรถ + พ.ร.บ. ${(CARS[c.type] || {}).n || 'รถ'} (${c.reg.plate})`, amt: carTaxAmt(c) + late, iss: c.tax - 30, due: c.tax, idx: i }); }); } catch (e) { }
    try { const L = S.ptax && S.ptax.last; if (L && !L.done && L.r && L.r.due > 0) { const late = Math.max(0, S.day - L.deadline), fine = late ? 200 + Math.round(L.r.due * 0.015 * Math.ceil(late / 30)) : 0; out.push({ id: 'ptax:' + L.y, cat: 'ptax', name: `ภาษีเงินได้ ภ.ง.ด.90 ปีภาษี ${L.y > 1000 ? L.y + 543 : L.y + 1}`, amt: L.r.due + fine, iss: L.deadline - 60, due: L.deadline }); } } catch (e) { }
    try { const m = S.myshop; if (m && m.until > 0 && m.until - S.day <= 2 && S.day - m.until <= 1) out.push({ id: 'rent:' + m.until, cat: 'rent', name: 'ต่อสัญญาเช่าร้านห้องแถว 7 วัน', amt: 3000, iss: m.until - 2, due: m.until }); } catch (e) { }
    try { const so = S.gov24 && S.gov24.docs && S.gov24.docs.ssoreg; if (so && so.data && so.data.paidUntil - S.day <= 5 && S.day - so.data.paidUntil <= 12) out.push({ id: 'sso:' + so.data.paidUntil, cat: 'sso', name: 'เงินสมทบประกันสังคม มาตรา 40', amt: 70, iss: so.data.paidUntil - 5, due: so.data.paidUntil }); } catch (e) { }
    try { if (typeof Company !== 'undefined') for (const c of Company.list()) { if (!['setup', 'open'].includes(c.st) || !(c.cash < 0)) continue; const w = c.debtWeeks || 0; out.push({ id: 'co:' + c.id + ':' + w, cat: 'co', name: `เติมเงินบัญชี ${c.name} (ติดลบ)`, amt: Math.ceil(-c.cash), iss: S.day, due: S.day + Math.max(1, 7 * (3 - w)), coId: c.id }); } } catch (e) { }
    try { const ins = S.ins || {}; for (const k of Object.keys(ins)) { const X = typeof INS !== 'undefined' && INS[k], u = ins[k]; if (!X || !(u > 0)) continue; if (u - S.day <= 5 && S.day - u <= 3) out.push({ id: 'ins:' + k + ':' + u, cat: 'ins', name: 'ต่อ' + X.n, amt: X.price, iss: u - 5, due: u, key: k }); } } catch (e) { }
    try { if (window.Net36) { const s2 = st(); s2.net2 = s2.net2 || {}; const ls = Net36.st().lines || []; for (const L of ls) { if (!(L.due > 0)) { delete s2.net2[L.id]; continue; } const x = s2.net2[L.id] = s2.net2[L.id] || { issued: S.day, due: S.day + DUE }; out.push({ id: 'net2:' + L.id + ':' + x.issued, cat: 'net', name: 'ค่าอินเทอร์เน็ตสายเสริม ' + L.id, amt: Math.round(L.due), iss: x.issued, due: x.due, line: L.id }); } } } catch (e) { }
    return out;
  };

  // ---------------- 1. the monthly cycle ----------------
  // the weekly job still measures what you used; its charges now collect in a meter ledger instead of being billed every week
  { const _b = Life2.bill.bind(Life2);
    Life2.bill = function () {
      const pre = S.billDue, pm = Phone.msg;
      Phone.msg = function (from, t, ...a) { if (/การไฟฟ้า & การประปา/.test(String(from))) return; return pm.call(Phone, from, t, ...a); };
      try { _b(); } finally { Phone.msg = pm; }
      const post = S.billDue, s = st();
      if (post && post !== pre) { s.acc.elec += Math.max(0, (post.elec || 0) - (pre ? pre.elec || 0 : 0)); s.acc.water += Math.max(0, (post.water || 0) - (pre ? pre.water || 0 : 0)); if (post.detail) { s.acc.detail = post.detail; (s.acc.wk = s.acc.wk || []).push({ units: post.detail.units || 0, energy: post.detail.energy || 0, ft: post.detail.ft || 0, service: post.detail.service || 0, vat: post.detail.vat || 0, credit: post.detail.credit || 0, total: post.detail.total || 0 }); } S.billDue = pre; }
    }; }
  // internet: the weekly charge is replaced by one monthly statement
  let ispCharge = null;
  if (typeof ISP !== 'undefined' && ISP.week) { ispCharge = ISP.week.bind(ISP); ISP.week = function () { }; }
  // loans and the credit card: debited once a month
  let creditRun = null;
  if (typeof Credit !== 'undefined' && Credit.week) { creditRun = Credit.week.bind(Credit); Credit.week = function () { }; }
  const issueMonthly = () => {
    const s = st(), old = S.billDue, e = Math.round(s.acc.elec || 0), w = Math.round(s.acc.water || 0);
    if (e + w > 0) {
      const due = S.day + DUE;
      S.billDue = { elec: e + (old ? old.elec || 0 : 0), water: w + (old ? old.water || 0 : 0), day: due + GRACE, due, issued: S.day, detail: s.acc.detail || (old && old.detail) };
      { const wk = s.acc.wk || [], sum = k => wk.reduce((a, x) => a + (x[k] || 0), 0); (s.elecHist = s.elecHist || []).unshift({ iss: S.day, due, units: sum('units'), energy: sum('energy'), ft: sum('ft'), service: sum('service'), vat: sum('vat'), credit: sum('credit'), net: e, water: w }); s.elecHist.length = Math.min(s.elecHist.length, 6); }
      s.acc = { elec: 0, water: 0 };
      msg(`ออกบิลประจำเดือนแล้ว: ค่าไฟ ${baht(e)} · ค่าน้ำ ${baht(w)} ครบกำหนด ${RD(due)} ชำระผ่านแอปธนาคาร › บิล`);
    }
    try { if (ispCharge && ISP.st().pkg) { const pm = Phone.msg; Phone.msg = function (f, t, ...a) { if (typeof ISPS !== 'undefined' && Object.values(ISPS).some(x => x.n === f)) return; return pm.call(Phone, f, t, ...a); }; try { ispCharge(); } finally { Phone.msg = pm; } s.isp = { issued: S.day, due: S.day + DUE }; msg(`ออกบิลอินเทอร์เน็ตแล้ว ${baht(ISP.st().due)} ครบกำหนด ${RD(S.day + DUE)} ชำระผ่านแอปธนาคาร › บิล`); } } catch (x) { console.warn('v84 isp', x); }
  };

  // ---------------- 2. what is owed ----------------
  const list = () => {
    const out = [], b = S.billDue;
    if (b) { const due = b.due || b.day, cut = b.day, iss = b.issued || due - DUE; if (b.elec > 0) out.push({ id: 'elec:' + iss, cat: 'elec', name: 'ค่าไฟฟ้า', amt: b.elec, iss, due, cut }); if (b.water > 0) out.push({ id: 'water:' + iss, cat: 'water', name: 'ค่าน้ำประปา', amt: b.water, iss, due }); }
    try { const i = S.isp; if (i && i.pkg && i.due > 0) { const x = st().isp || { issued: S.day, due: S.day + DUE }; out.push({ id: 'net:' + x.issued, cat: 'net', name: 'ค่าอินเทอร์เน็ต ' + ((NET_PKGS[i.pkg] || {}).n || ''), amt: i.due, iss: x.issued, due: x.due }); } } catch (e) { }
    try { const g = S.gov24; if (g) { (g.bills || []).forEach((x, k) => { if (!x.paid) out.push({ id: 'tax:' + k + ':' + x.y, cat: 'tax', name: x.what, amt: x.amt, iss: x.due - 28, due: x.due, idx: k }); }); (g.fines || []).forEach((x, k) => { if (!x.paid) out.push({ id: 'fine:' + k + ':' + x.d, cat: 'fine', name: x.what, amt: x.amt, iss: x.d, due: x.due, idx: k }); }); } } catch (e) { }
    return out.concat(extra());
  };
  const stateOf = b => S.day > b.due ? ['bad', '🔴 เกินกำหนด ' + (S.day - b.due) + ' วัน'] : S.day === b.due ? ['warn', '🟠 ครบกำหนดวันนี้'] : b.due - S.day <= 3 ? ['warn', `🟠 ครบกำหนดอีก ${b.due - S.day} วัน`] : ['good', `🟢 ครบกำหนดอีก ${b.due - S.day} วัน`];
  const totalOf = cat => list().filter(b => b.cat === cat).reduce((a, b) => a + b.amt, 0);
  const cardInfo = () => { try { const c = Credit.st(); const loans = c.loans || [], card = c.card || { bal: 0 }; const inst = loans.reduce((a, l) => a + Math.min(l.pay, Math.round(l.left * (1 + l.r / 12))), 0), min = card.bal > 0 ? Math.max(1000, Math.round(card.bal * 0.08)) : 0; if (window.Card168 && window.Card168.has()) { const cc = window.Card168.st(); return { loans, card: { bal: cc.bal }, inst, min: window.Card168.minDue(cc) }; } return { loans, card, inst, min }; } catch (e) { return { loans: [], card: { bal: 0 }, inst: 0, min: 0 }; } };

  // ---------------- 3. paying (bank app only) ----------------
  const P = () => window.Pay49;
  const accts = () => { const l = [{ src: 'sav', name: 'ออมทรัพย์ (บัญชีหลัก)' }]; try { const c = window.Bank49 && Bank49.curAcct(); if (c) l.push({ src: 'cur', name: 'กระแสรายวัน' }); } catch (e) { } return l; };
  const balOfSrc = src => (P() ? P().bal(src) : S.money);
  function payBill(id, src) {
    if (window.Evt170 && window.Evt170.outage() && !window.Evt170.bypass) { toast('ระบบแอปธนาคารขัดข้องชั่วคราว ชำระบิลผ่านแอปไม่ได้ ไปจ่ายที่ตู้ ATM หรือรอระบบกลับมา', '⚠️'); return false; }
    const b = list().find(x => x.id === id); if (!b) { toast('ไม่พบบิลนี้ หรือชำระไปแล้ว', 'ℹ️'); return false; }
    const A = accts().find(a => a.src === src) || accts()[0], pay = P(); if (!pay) return false;
    if (balOfSrc(A.src) < b.amt) { toast(`เงินในบัญชี${A.name}ไม่พอ (มี ${baht(Math.round(balOfSrc(A.src)))} ต้องใช้ ${baht(b.amt)})`, '💸'); return false; }
    const o = pay.src, ob = pay.busy; pay.src = A.src; pay.busy = true; let ok = false;
    try {
      if (b.cat === 'elec') { const x = S.billDue; S.money -= b.amt; x.elec = 0; try { Bank2.log('ค่าไฟฟ้า', -b.amt); } catch (e) { } S.powerOff = 0; if (!(x.water > 0)) S.billDue = null; ok = true; }
      else if (b.cat === 'water') { const x = S.billDue; S.money -= b.amt; x.water = 0; try { Bank2.log('ค่าน้ำประปา', -b.amt); } catch (e) { } if (!(x.elec > 0)) { S.billDue = null; S.powerOff = 0; } ok = true; }
      else if (b.cat === 'net' && b.line) { UI.H.v36npay({ v: b.line }); const L2 = window.Net36 && Net36.st().lines.find(l => l.id === b.line); ok = !(L2 && L2.due > 0); }
      else if (b.cat === 'net') { ISP.pay(); ok = !(ISP.st().due > 0); st().isp = null; }
      else if (b.cat === 'tax') { UI.H.g24bill({ v: b.idx }); ok = !!(S.gov24.bills[b.idx] && S.gov24.bills[b.idx].paid); }
      else if (b.cat === 'fine') { UI.H.g24fine({ v: b.idx }); ok = !!(S.gov24.fines[b.idx] && S.gov24.fines[b.idx].paid); }
      else if (b.cat === 'hoa') { const h = S.v26l.hoa, n = Math.round(h.due); S.money -= n; try { Bank2.log('ค่าส่วนกลางหมู่บ้าน', -n); } catch (e) { } h.paidTotal = (h.paidTotal || 0) + n; h.due = 0; h.late = 0; ok = true; }
      else if (b.cat === 'veh') { UI.H.g24vtax({ v: b.idx }); const c = S.cars[b.idx]; ok = !!(c && c.tax > b.due); }
      else if (b.cat === 'ptax') { PTax.file(); ok = !!(S.ptax.last && S.ptax.last.done); }
      else if (b.cat === 'rent') { const m = S.myshop, u0 = m.until; UI.H.msrent(); ok = m.until > u0; }
      else if (b.cat === 'sso') { const so = S.gov24.docs.ssoreg; S.money -= 70; try { Bank2.log('เงินสมทบประกันสังคม ม.40', -70); } catch (e) { } so.data.paidUntil = Math.max(so.data.paidUntil, S.day) + 28; ok = so.data.paidUntil > b.due; }
      else if (b.cat === 'co') { const c = Company.get(b.coId); if (c) { const n = Math.ceil(-c.cash); if (n > 0) { S.money -= n; try { Bank2.log('เติมเงินบัญชีบริษัท ' + c.name, -n); } catch (e) { } c.cash += n; c.debtWeeks = 0; ok = true; } } }
      else if (b.cat === 'ins') { const k = b.key, u0 = (S.ins || {})[k] || 0; Ins.buy(k); ok = ((S.ins || {})[k] || 0) > u0; }
    } finally { pay.src = o; pay.busy = ob; }
    if (!ok) return false;
    const s = st(); s.hist.unshift({ d: S.day, cat: b.cat, name: b.name, amt: b.amt, acc: A.name }); s.hist.length = Math.min(s.hist.length, 40);
    try { Bank49.tx(`ชำระบิล ${b.name}`, -b.amt, A.src === 'sav' ? 'main' : (Bank49.curAcct() || {}).id); } catch (e) { }
    toast(`ชำระ${b.name} ${baht(b.amt)} สำเร็จ`, '✅');
    try { if (window.Slip49) window.Slip49.make({ k: 'bill', amt: b.amt, payee: (CATS[b.cat] || {}).from || b.name, memo: b.name, from: A.name + (A.src === 'sav' ? ' ' + Bank49.all()[0].no : ' ' + ((Bank49.curAcct() || {}).no || '')) }); } catch (e) { console.warn('slip', e); }
    try { Phone.msg('ธนาคารสุขใจ', `ชำระบิล ${b.name} ${baht(b.amt)} จากบัญชี${A.name} สำเร็จ · คงเหลือ ${baht(Math.round(balOfSrc(A.src)))}`, true); } catch (e) { }
    return true;
  }
  let selAcct = 'sav';
  const bankHTML = () => {
    const L = list().sort((a, b) => a.due - b.due), A = accts(); if (!A.some(a => a.src === selAcct)) selAcct = 'sav';
    const tot = L.reduce((a, b) => a + b.amt, 0), h = st().hist.slice(0, 6);
    return `<p class="lead">🧾 ชำระบิลผ่านแอปธนาคารเท่านั้น · ${L.length ? `ค้างทั้งหมด ${L.length} รายการ รวม <b>${baht(tot)}</b>` : 'ไม่มีบิลค้างชำระ ✅'}</p>
      <div class="row"><span class="dim">โอนจากบัญชี</span><select id="b84Acct" onchange="UI.H.b84acc({v:this.value})" style="flex:1;min-width:0">${A.map(a => `<option value="${a.src}" ${a.src === selAcct ? 'selected' : ''}>${E(a.name)} · ${baht(Math.round(balOfSrc(a.src)))}</option>`).join('')}</select></div>
      ${L.map(b => { const [k, t] = stateOf(b), C = CATS[b.cat]; return `<div class="card"><div class="ci">${C.i}</div><div class="cb"><h4>${E(b.name)}</h4><p class="dim">${E(C.from)} · ออกบิล ${RD(b.iss)} · ครบกำหนด ${RD(b.due)}</p><p class="${k}">${t}</p></div><button class="btn" data-a="b84pay" data-v="${E(b.id)}" ${balOfSrc(selAcct) >= b.amt ? '' : 'disabled'}>โอนชำระ ${baht(b.amt)}</button></div>`; }).join('')}
      ${L.length > 1 ? `<div class="row"><button class="btn" data-a="b84payall">โอนชำระทุกรายการที่ครบกำหนดแล้ว/ใกล้ครบ</button></div>` : ''}
      <p class="dim">ชำระแล้วระบบหักเงินจากบัญชีที่เลือกทันที และส่งข้อความยืนยันเข้ามือถือ · เลือกตัดบัญชีอัตโนมัติได้ที่แอป "บิล & ค่าบริการ" ในมือถือ</p>
      ${h.length ? `<h5>ประวัติชำระล่าสุด</h5>${h.map(x => `<div style="display:flex;justify-content:space-between;gap:8px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.1)"><span>${CATS[x.cat].i} ${E(x.name)}<br><small class="dim">${RD(x.d)} · ${E(x.acc)}</small></span><b>${baht(x.amt)}</b></div>`).join('')}` : ''}`;
  };
  UI.H.b84acc = d => { selAcct = d.v; try { UI.renderBody(); } catch (e) { } };
  UI.H.b84pay = d => { payBill(String(d.v), selAcct); try { UI.renderBody(); } catch (e) { } };
  UI.H.b84payall = () => { const L = list().filter(b => b.due - S.day <= 3).sort((a, b) => a.due - b.due); let n = 0; if (window.Slip49) window.Slip49.group(true); try { for (const b of L) if (payBill(b.id, selAcct)) n++; } finally { if (window.Slip49) window.Slip49.group(false); } if (!L.length) toast('ไม่มีบิลที่ครบกำหนดหรือใกล้ครบกำหนด', 'ℹ️'); try { UI.renderBody(); } catch (e) { } };
  // the bank app gets a "บิล" tab
  { const _open = UI.open.bind(UI);
    UI.open = function (title, tabs, render, opts) {
      if (title === '📱 แอปธนาคารสุขใจ' && Array.isArray(tabs) && !tabs.includes('🧾 บิล')) { tabs = tabs.concat(['🧾 บิล']); const r0 = render, last = tabs.length - 1; render = t => t === last ? bankHTML() : r0(t); }
      return _open(title, tabs, render, opts);
    }; }
  const openBank = () => { Phone.app = null; try { UI.close(); } catch (e) { } setTimeout(() => { try { Bank49.openApp(0); const c = UI.cur; if (c) { c.tab = c.tabs.length - 1; UI.renderBody(); } } catch (e) { console.warn('v84 bank', e); } }, 50); };
  UI.H.b84bank = () => openBank();
  // every old pay button becomes a pointer to the bank app
  { const _rb = UI.renderBody.bind(UI);
    UI.renderBody = function () {
      _rb();
      try {
        const root = document.getElementById('mBody'); if (!root) return;
        for (const b of root.querySelectorAll('[data-a="paybill"],[data-a="isppay"],[data-a="g24fine"],[data-a="g24bill"],[data-a="b49"][data-v="bill"]')) {
          const s = document.createElement('button'); s.className = 'btn ghost'; s.dataset.a = 'b84bank'; s.textContent = '🧾 จ่ายที่แอปธนาคาร › บิล'; b.replaceWith(s);
        }
      } catch (e) { }
    }; }

  // ---------------- 4. phone: category + one menu per bill ----------------
  const nextText = cat => cat === 'sso' ? '5 วันก่อนครบกำหนดส่งเงินสมทบ' : cat === 'co' ? 'เมื่อบัญชีบริษัทติดลบ' : cat === 'hoa' ? 'ต้นเดือนถัดไป' : cat === 'veh' ? '30 วันก่อนภาษีรถหมดอายุ' : cat === 'ptax' ? 'ต้นปีภาษีถัดไป' : cat === 'rent' ? '2 วันก่อนสัญญาเช่าหมด' : cat === 'ins' ? '5 วันก่อนกรมธรรม์หมดอายุ' : cat === 'card' ? RD(nextOn(DEBIT_DAY)) : cat === 'tax' ? 'ปีหน้า (ตามรอบภาษีรายปี)' : cat === 'fine' ? 'เมื่อมีใบสั่งใหม่' : RD(nextOn(ISSUE_DAY));
  const billPage = cat => {
    const C = CATS[cat], s = st(), L = list().filter(b => b.cat === cat), H = s.hist.filter(x => x.cat === cat).slice(0, 5), auto = !!s.auto[cat];
    let h = `<h4>${C.i} ${C.n}</h4><p class="dim">${E(C.from)}</p><p class="dim">🗓️ ${E(C.cyc)}</p>`;
    if (cat === 'card') {
      const I = cardInfo();
      h += `<div class="card"><div class="ci">🏦</div><div class="cb"><h4>ค่างวดสินเชื่อเดือนนี้ ${baht(I.inst)}</h4><p class="dim">${I.loans.length ? I.loans.map(l => `${E(l.n || l.k || 'สินเชื่อ')} คงเหลือ ${baht(l.left)} · ผ่อน ${baht(l.pay)}/เดือน`).join('<br>') : 'ไม่มีสินเชื่อ'}</p></div></div>
        <div class="card"><div class="ci">💳</div><div class="cb"><h4>บัตรเครดิต ยอดค้าง ${baht(I.card.bal || 0)}</h4><p class="dim">ชำระขั้นต่ำ ${baht(I.min)} · ตัดบัญชีวันที่ ${DEBIT_DAY} ครั้งถัดไป ${RD(nextOn(DEBIT_DAY))}</p></div></div>
        <p class="good">🏧 ช่องทางชำระ: ตัดบัญชีออมทรัพย์อัตโนมัติ (ต้องมีเงินพอในบัญชีก่อนวันที่ ${DEBIT_DAY})</p>`;
    } else {
      h += L.length ? L.map(b => { const [k, t] = stateOf(b); return `<div class="card"><div class="ci">${C.i}</div><div class="cb"><h4>${E(b.name)} · ${baht(b.amt)}</h4><p class="dim">ออกบิล ${RD(b.iss)} · ครบกำหนด ${RD(b.due)}${b.cut ? ` · ตัดไฟหลัง ${RD(b.cut)}` : ''}</p><p class="${k}">${t}</p></div></div>`; }).join('')
        : `<div class="card"><div class="ci">✅</div><div class="cb"><h4>ไม่มียอดค้างชำระ</h4><p class="dim">บิลรอบถัดไป: ${nextText(cat)}</p></div></div>`;
      h += `<h5>ช่องทางชำระ</h5>
        <div class="row"><button class="btn ${auto ? 'ghost' : ''}" data-a="b84ch" data-v="${cat}|bank">📱 โอนเองผ่านแอปธนาคาร${auto ? '' : ' ✓'}</button><button class="btn ${auto ? '' : 'ghost'}" data-a="b84ch" data-v="${cat}|auto">🏧 ตัดบัญชีอัตโนมัติ${auto ? ' ✓' : ''}</button></div>
        <p class="dim">${auto ? 'ระบบจะหักเงินจากบัญชีออมทรัพย์ให้เองก่อนวันครบกำหนด 1 วัน ถ้าเงินไม่พอจะแจ้งเตือน' : 'การโอนจ่ายทำได้ที่แอปธนาคารเท่านั้น (หน้านี้ไม่มีปุ่มจ่ายเงิน)'}</p>`;
      if (L.length && !auto) h += `<div class="row"><button class="btn" data-a="b84bank">🏦 เปิดแอปธนาคารเพื่อโอนจ่าย</button></div>`;
    }
    if (cat === 'elec' && typeof GridApp !== 'undefined' && GridApp.billsHTML) { try { h += GridApp.billsHTML(); } catch (e) { } }
    h += `<h5>ประวัติการชำระ</h5>${H.length ? H.map(x => `<p class="dim" style="margin:3px 0">${RD(x.d)} · ${E(x.name)} ${baht(x.amt)} (${E(x.acc)})</p>`).join('') : '<p class="dim">ยังไม่มีประวัติ</p>'}`;
    return h;
  };
  const summaryPage = () => {
    const L = list().sort((a, b) => a.due - b.due), tot = L.reduce((a, b) => a + b.amt, 0), I = cardInfo();
    return `<h4>🧾 สรุปบิลทั้งหมด</h4><p class="lead">${L.length ? `ค้างชำระ ${L.length} รายการ รวม <b>${baht(tot)}</b>` : 'ไม่มีบิลค้างชำระ ✅'}</p>
      ${ORDER.map(c => `<div class="card"><div class="ci">${CATS[c].i}</div><div class="cb"><h4>${CATS[c].n}</h4><p class="dim">${c === 'card' ? `ตัดบัญชี ${baht(I.inst + I.min)} · วันที่ ${RD(nextOn(DEBIT_DAY))}` : totalOf(c) > 0 ? `ค้าง ${baht(totalOf(c))}` : 'ไม่มียอดค้าง'} · รอบถัดไป ${nextText(c)}</p></div></div>`).join('')}
      <div class="row"><button class="btn" data-a="b84bank">🏦 เปิดแอปธนาคารเพื่อโอนจ่าย</button></div>`;
  };
  UI.H.b84ch = d => { const [c, k] = String(d.v).split('|'); st().auto[c] = k === 'auto' ? 1 : 0; toast(k === 'auto' ? `เปิดตัดบัญชีอัตโนมัติ: ${CATS[c].n}` : `เลือกโอนเองผ่านแอปธนาคาร: ${CATS[c].n}`, '🧾'); try { UI.renderBody(); } catch (e) { } };
  const SHORT = { sso: 'ประกันสังคม', co: 'บริษัท', hoa: 'ค่าส่วนกลาง', veh: 'ภาษีรถ', ptax: 'ภาษีเงินได้', rent: 'ค่าเช่าร้าน', ins: 'เบี้ยประกัน', elec: 'ค่าไฟ', water: 'ค่าน้ำ', net: 'อินเทอร์เน็ต', tax: 'ภาษีที่ดิน', fine: 'ใบสั่ง/ปรับ', card: 'บัตร & สินเชื่อ' };
  const labelOf = c => { const t = totalOf(c); return SHORT[c] + (t > 0 ? ` ${baht(t)}` : ''); };
  for (const c of ORDER) { APPS.push({ id: 'bill_' + c, i: CATS[c].i, get n() { return labelOf(c); } }); Phone.apps['bill_' + c] = function () { return billPage(c); }; }
  APPS.push({ id: 'bill_all', i: '🧾', get n() { const k = list().length; return k ? `สรุปบิล (ค้าง ${k})` : 'สรุปบิล'; } }); Phone.apps.bill_all = function () { return summaryPage(); };
  if (window.Phone59 && Phone59.CATS) { const cat = ['bills', '🧾', 'บิล & ค่าบริการ', ['bill_all'].concat(ORDER.map(c => 'bill_' + c))]; Object.defineProperty(cat, 2, { get() { const k = list().length; return k ? `บิล & ค่าบริการ (${k})` : 'บิล & ค่าบริการ'; } }); Phone59.CATS.splice(1, 0, cat); try { Phone59.resort && Phone59.resort(); } catch (e) { } }

  // ---------------- 5. every day: issue, remind, debit ----------------
  const daily = () => {
    const s = st(), d = dom(S.day);
    // an old save may still carry a weekly bill with no due date: give it one
    if (S.billDue && !S.billDue.due) { S.billDue.due = S.billDue.day; S.billDue.issued = S.billDue.issued || S.day; }
    if (d === ISSUE_DAY) issueMonthly();
    if (d === DEBIT_DAY && creditRun) { try { if (window.Card168) window.Card168.wrapLoans(creditRun); else creditRun(); } catch (e) { console.warn('v84 credit', e); } }
    for (const b of list()) {
      const n = s.n[b.id] = s.n[b.id] || {}, left = b.due - S.day, C = CATS[b.cat];
      if (s.auto[b.cat] && left <= 1 && !n.autoFail && !(window.Evt170 && window.Evt170.outage())) { if (balOfSrc('sav') >= b.amt) { if (payBill(b.id, 'sav')) { msg(`ตัดบัญชีอัตโนมัติ ${b.name} ${baht(b.amt)} เรียบร้อย`); continue; } } else { n.autoFail = 1; msg(`ตัดบัญชีอัตโนมัติ ${b.name} ${baht(b.amt)} ไม่สำเร็จ เงินในบัญชีไม่พอ กรุณาเติมเงินหรือโอนจ่ายที่แอปธนาคาร`); } }
      if (!n.seen) { n.seen = 1; if (!(b.cat === 'elec' || b.cat === 'water' || b.cat === 'net')) msg(`${C.i} มีบิลใหม่: ${b.name} ${baht(b.amt)} ครบกำหนด ${RD(b.due)} ชำระผ่านแอปธนาคาร › บิล`); }
      if (left === 3 && !n.d3) { n.d3 = 1; msg(`⏰ อีก 3 วันครบกำหนด: ${b.name} ${baht(b.amt)} (${RD(b.due)})`); }
      else if (left === 0 && !n.due) { n.due = 1; msg(`🟠 วันนี้ครบกำหนดชำระ: ${b.name} ${baht(b.amt)}`); }
      else if (left < 0 && S.day - (n.late || b.due) >= 3) { n.late = S.day; msg(`🔴 เกินกำหนดแล้ว: ${b.name} ${baht(b.amt)} (เกิน ${-left} วัน)${b.cut && S.day <= b.cut ? ` · ไฟจะถูกตัดหลัง ${RD(b.cut)}` : ''}`); }
    }
    for (const k of Object.keys(s.n)) { if (!list().some(b => b.id === k)) delete s.n[k]; }
  };
  { const _d = Life2.day.bind(Life2); Life2.day = function () { const r = _d.apply(this, arguments); try { daily(); } catch (e) { console.warn('v84 daily', e); } return r; }; }
  window.Bills84 = { list, payBill, issueMonthly, daily, st, CATS };
});
