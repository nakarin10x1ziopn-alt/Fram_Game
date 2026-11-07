'use strict';
// ---------- v39_estate: a real-life property economy on top of the houses, lots and market properties the game already has ----------
// Rent (listing, applicants, 12-month lease, deposit 2 + advance 1, monthly rent on the 1st, late payment, repairs, damage, renewal, notice, eviction),
// sale (appraisal, offers, counter-offers, buyer mortgage, closing at the land office with the real Thai taxes: transfer fee 2% of the government
// appraisal split 50/50, specific business tax 3.3%, stamp duty 0.5%, withholding tax on the government appraisal by years held), buying from the
// market (inspection, offer, mortgage with DSR + credit-score rate 3.5-6.25%, down payment, monthly instalments, default and foreclosure),
// running a business in an owned building (shop, cafe, office/warehouse for rent, guesthouse/homestay with platform fee) and a property
// management app "🏘️ อสังหาริมทรัพย์ของฉัน". Dates follow the real calendar (Cal36). State: S.v39e.
V23.add('v39_estate', () => {
  const X = () => {
    const x = S.v39e = S.v39e || {};
    if (!x.props) x.props = {}; if (!x.mkt) x.mkt = { day: -99, list: [], n: 0 }; if (!x.mort) x.mort = []; if (!x.idx) x.idx = {}; if (!x.dem) x.dem = {};
    if (x.mon === undefined) x.mon = -1; if (!x.n) x.n = 0; if (!x.log) x.log = []; if (!x.tax) x.tax = { rent: 0, sale: 0, biz: 0 }; if (!x.v) x.v = 1;
    return x;
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const num = n => { n = Math.round(+n); return Number.isFinite(n) ? n : 0; };
  const rd = (n, s) => Math.round(n / s) * s;
  const msg = (from, t) => { try { Phone.msg(from, t); } catch (e) { } };
  const toast = (t, i) => { try { UI.toast(t, i || '🏘️'); } catch (e) { } };
  const pay = (n, label) => { n = num(n); if (n <= 0) return true; if (S.money < n) { toast(`เงินไม่พอ ต้องใช้ ${baht(n)}`, '💸'); return false; } S.money -= n; try { Bank2.log(label, -n); } catch (e) { } return true; };
  const gain = (n, src) => { n = num(n); if (n > 0) { try { earn(n); } catch (e) { S.money += n; } try { Bank2.income(src, n); } catch (e) { } } return n; };
  const note = (t, v) => { const x = X(); x.log.unshift({ d: S.day, t, v: num(v) }); x.log.length = Math.min(x.log.length, 60); };
  const D = (d = S.day) => Cal36.date(d);
  const mkey = (d = S.day) => { const t = D(d); return t.y * 12 + t.m; };
  const fmtD = d => { try { return Cal36.dm(d); } catch (e) { return 'วันที่ ' + d; } };
  const has = id => { try { return !!Gov24.has(id); } catch (e) { return true; } };
  const needDocs = (ids, what) => { try { return Gov24.need(ids, what); } catch (e) { return true; } };
  const hoursOpen = (id, d = S.day, t = S.time) => { try { return Hours36.open(id, t, d); } catch (e) { return D(d).dow < 5; } };
  const hoursWin = (id, d) => { try { return Hours36.win(id, d); } catch (e) { return D(d).dow < 5 ? [8, 16] : null; } };
  const nextOpenDay = (id, from) => { for (let d = from; d < from + 14; d++) { if (hoursWin(id, d)) return d; } return from; };
  const sizeF = { large: 1.6, medium: 1.2, small: 0.85, village: 1 };

  const FIRST = ['สมชาย', 'สมหญิง', 'วิชัย', 'ปรีชา', 'นภา', 'กมล', 'ธนากร', 'อรุณี', 'พิมพ์ใจ', 'ชาตรี', 'สุรีย์', 'ภัทรา', 'ณัฐวุฒิ', 'กัญญา', 'ประเสริฐ', 'วรรณา', 'อนุชา', 'รัตนา', 'เอกชัย', 'ปิยะ', 'มาลี', 'สุดา', 'ธีรพงษ์', 'จิราพร'];
  const LAST = ['ใจดี', 'รุ่งเรือง', 'สุขสวัสดิ์', 'แสงทอง', 'พึ่งบุญ', 'ศรีสุข', 'วงศ์ไทย', 'มั่นคง', 'เจริญผล', 'ทองดี', 'บุญมา', 'สายสุวรรณ', 'ชัยมงคล', 'พูลสวัสดิ์'];
  const JOBS = [['พนักงานบริษัท', 18000, 45000], ['ครู', 22000, 38000], ['ข้าราชการ', 20000, 50000], ['ช่างฝีมือ', 12000, 25000], ['พนักงานโรงแรม', 11000, 19000], ['ฟรีแลนซ์', 10000, 60000], ['นักศึกษาฝึกงาน', 8000, 15000], ['เจ้าของร้านค้า', 15000, 70000], ['วิศวกร', 35000, 90000], ['พยาบาล', 20000, 38000]];
  const nameOf = () => pick(FIRST) + ' ' + pick(LAST);

  // ================= cities and the market index =================
  const cities = () => {
    const L = [{ k: 'village', n: 'หมู่บ้านสุขใจ', f: 1, sz: 'village' }];
    try { for (const c of V25.cityList()) L.push({ k: c.key, n: c.n, f: sizeF[c.size] || 1, sz: c.size }); } catch (e) { }
    return L;
  };
  const cityOf = k => cities().find(c => c.k === k) || cities()[0];
  const idxOf = k => { const x = X(); return (x.idx[k] || 1) * ((typeof S.est === 'object' && S.est && S.est.idx) ? S.est.idx : 1); };
  const demOf = k => X().dem[k] || 1;
  function shock(k, pct, why) { const x = X(); x.idx[k] = +((x.idx[k] || 1) * (1 + pct)).toFixed(4); if (why) note(`ราคาตลาด ${cityOf(k).n} ${pct > 0 ? '+' : ''}${(pct * 100).toFixed(1)}% · ${why}`, 0); }

  // ================= the properties =================
  const PT = { house: ['บ้านเดี่ยว', '🏡'], townhome: ['ทาวน์โฮม', '🏘️'], condo: ['คอนโด', '🏢'], land: ['ที่ดินเปล่า', '🌳'], commercial: ['อาคารพาณิชย์', '🏬'], dorm: ['หอพัก/อพาร์ตเมนต์', '🏨'] };
  const EST_TYPE = { condo1: 'condo', shop1: 'commercial', land1: 'land', house1: 'house', dorm: 'dorm' };

  function ids() {
    const out = ['main'];
    try { for (const [id, st] of Object.entries((S.hb && S.hb.lots) || {})) out.push((st.design && st.stage >= 3 ? 'hb:' : st.design ? 'bld:' : 'land:') + id); } catch (e) { }
    try { for (const k of Object.keys((S.est && S.est.own) || {})) out.push('est:' + k); } catch (e) { }
    for (const id of Object.keys(X().props)) if (id.startsWith('mkt:') && X().props[id].own) out.push(id);
    return out;
  }
  const lotOf = id => { try { return HomeBuild.lot(id); } catch (e) { return null; } };
  function info(id) {
    const [kind, key] = id.split(':');
    if (id === 'main') return { id, kind: 'main', n: 'บ้านหลักของฉัน (ไร่สุขใจ)', i: '🏠', type: 'house', city: 'village', land: 0, bld: 0 };
    if (kind === 'hb' || kind === 'bld') { const st = S.hb.lots[key], L = lotOf(key) || {}, Dg = (typeof HOUSE_DESIGNS !== 'undefined' && HOUSE_DESIGNS[st.design]) || { n: 'บ้าน', i: '🏠', price: 600000, o: { w: 9, d: 7 } }; const area = Math.round(Dg.o.w * Dg.o.d);
      return { id, kind, key, n: (st.name || Dg.n) + ' · ' + (L.n || key), i: Dg.i, type: area <= 45 ? 'house' : 'house', city: 'village', land: (L.price || 35000), bld: Dg.price * 0.9, area, rooms: clamp(Math.round(area / 22), 1, 5), site: 'lot' }; }
    if (kind === 'land') { const L = lotOf(key) || {}; return { id, kind, key, n: L.n || 'ที่ดินเปล่า', i: '🌳', type: 'land', city: 'village', land: (L.price || 35000), bld: 0, area: 400 }; }
    if (kind === 'est') { const P = (typeof PROPS !== 'undefined' && PROPS.find(p => p.k === key)) || { n: key, i: '🏢', p: 1000000 }; const t = EST_TYPE[key] || 'house'; return { id, kind, key, n: P.n, i: P.i, type: t, city: 'village', land: 0, bld: 0, units: key === 'dorm' ? 20 : 1, area: 60, rooms: key === 'condo1' ? 1 : 3 }; }
    if (kind === 'mkt') { const p = X().props[id] || {}; return { id, kind, key, n: p.n || 'ทรัพย์', i: p.i || '🏠', type: p.type || 'house', city: p.city || 'village', land: 0, bld: 0, area: p.area || 80, rooms: p.rooms || 2, units: p.units || 1 }; }
    return { id, kind: 'x', n: id, i: '🏠', type: 'house', city: 'village', land: 0, bld: 0 };
  }
  function P(id) {
    const x = X(); let p = x.props[id];
    if (!p) {
      const [kind, key] = id.split(':'); let acq = S.day, paid = 0;
      try { if (kind === 'hb' || kind === 'bld') { const st = S.hb.lots[key]; acq = st.start || S.day; paid = ((typeof HOUSE_DESIGNS !== 'undefined' && HOUSE_DESIGNS[st.design]) || { price: 0 }).price; } if (kind === 'est') { const o = S.est.own[key]; acq = o.day || S.day; paid = o.paid || 0; } } catch (e) { }
      p = x.props[id] = { st: 'home', acq, paid, cond: 92, furn: false, own: true, hist: [] };
    }
    return p;
  }
  function value(id) {
    const I = info(id), p = P(id); let v;
    if (id === 'main') { const lv = (S.up && S.up.house) || 1; v = 700000 + lv * 450000 + ((S.v36h && +S.v36h.fp) || 0) * 300000 + (Math.max(1, (S.v36h && +S.v36h.fl) || 1) - 1) * 600000; return rd(v, 1000); }
    if (I.kind === 'est') { try { v = Estate.price(PROPS.find(x => x.k === I.key)); } catch (e) { v = p.paid || 1000000; } return rd(v, 1000); }
    if (I.kind === 'mkt') v = (p.base || 1000000) * idxOf(I.city) * (0.82 + clamp(p.cond, 0, 100) / 100 * 0.22);
    else { const age = Math.max(0, (S.day - p.acq) / 365); v = (I.land + I.bld * (1 - Math.min(0.5, age * 0.012))) * idxOf(I.city) * (0.82 + clamp(p.cond, 0, 100) / 100 * 0.22) * (p.furn ? 1.04 : 1); }
    return Math.max(1000, rd(v, 1000));
  }
  const govApp = id => rd(value(id) * 0.7, 1000);
  function marketRent(id) {
    const I = info(id), p = P(id), v = value(id); if (I.type === 'land') return 0;
    const y = I.type === 'commercial' ? 0.0075 : I.type === 'dorm' ? 0.0052 : I.type === 'condo' ? 0.0048 : 0.0044;
    return Math.max(1500, rd(v * y * (p.furn ? 1.12 : 1) * (0.88 + 0.12 * clamp(p.cond, 0, 100) / 100) * demOf(I.city), 100));
  }
  const airMarket = id => Math.max(300, rd(marketRent(id) / 11, 50));    // a night is ~1/11 of a month: ~60% occupancy beats a long lease, with more work

  // ================= Thai property taxes =================
  const BRK = [[150000, 0], [300000, 0.05], [500000, 0.10], [750000, 0.15], [1000000, 0.20], [2000000, 0.25], [5000000, 0.30], [Infinity, 0.35]];
  const progTax = n => { let t = 0, lo = 0; for (const [hi, r] of BRK) { if (n > lo) t += (Math.min(n, hi) - lo) * r; lo = hi; } return t; };
  const DEDUCT = [0.92, 0.84, 0.77, 0.71, 0.65, 0.60, 0.55, 0.50];
  // withholding tax of an individual selling property: (government appraisal - expenses by years held) / years held, less 60,000, progressive, x years
  const whtTax = (appr, heldDays) => { const yrs = Math.max(1, Math.ceil(heldDays / 365)), ded = DEDUCT[Math.min(yrs, 8) - 1], per = Math.max(0, appr * (1 - ded) / yrs - 60000); return Math.round(progTax(per) * yrs); };
  function saleCosts(price, appr, heldDays) {
    const sbtOn = heldDays < 5 * 365, base = Math.max(price, appr);
    const out = { transfer: Math.round(appr * 0.01), sbt: sbtOn ? Math.round(base * 0.033) : 0, stamp: sbtOn ? 0 : Math.round(base * 0.005), wht: whtTax(appr, heldDays) };
    out.total = out.transfer + out.sbt + out.stamp + out.wht; return out;
  }
  const pmtOf = (P0, rate, months) => { const r = rate / 12; return r ? Math.round(P0 * r / (1 - Math.pow(1 + r, -months))) : Math.round(P0 / months); };
  const rateFor = () => { let sc = 650; try { sc = Credit.st().score; } catch (e) { } return sc >= 750 ? 0.0359 : sc >= 650 ? 0.045 : sc >= 550 ? 0.055 : 0.0625; };

  // ================= money helpers for the bank =================
  const liquid = () => { let b = 0; try { b = (S.bank && S.bank.sav) || 0; } catch (e) { } return S.money + b; };
  const takeCash = n => { n = num(n); if (S.money >= n) { S.money -= n; return true; } try { const need = n - S.money, sav = (S.bank && S.bank.sav) || 0; if (sav >= need) { S.bank.sav -= need; S.money = 0; return true; } } catch (e) { } return false; };
  const incomeEst = () => { let inc = 0; try { inc = Credit.income(); } catch (e) { } return Math.max(inc, liquid() / 48); };
  const monthlyDebt = () => X().mort.filter(m => m.bal > 0).reduce((t, m) => t + m.pmt, 0);

  // ================= tenants =================
  const demandProb = (ratio, id) => { const I = info(id); const base = I.type === 'commercial' ? 0.12 : 0.2; return clamp(base * Math.exp(-3.4 * (ratio - 1)) * (ratio < 0.8 ? 1.2 : 1), 0, 0.5); };
  function newApplicant(id, ask) {
    const J = pick(JOBS), inc = Math.round(rnd(J[1], J[2]) / 500) * 500, ratio = inc / Math.max(1, ask);
    const score = clamp(Math.round(30 + Math.min(40, ratio * 8) + rnd(-12, 30)), 20, 98);
    return { id: ++X().n, name: nameOf(), job: J[0], inc, score, pets: Math.random() < 0.2, fam: 1 + Math.floor(Math.random() * 4), exp: S.day + 5, ref: score >= 70 ? 'มีหนังสือรับรองจากเจ้าของบ้านเดิม' : score >= 50 ? 'ผู้ค้ำประกัน 1 คน' : 'ไม่มีผู้ค้ำประกัน' };
  }
  const leaseEndDay = start => { const t = D(start); try { return Cal36.dayOf(t.y + 1, t.m, t.dom); } catch (e) { return start + 365; } };
  function signLease(id, ap) {
    const p = P(id), ask = p.ask, dep = ask * 2, adv = ask;
    S.money += dep; try { Bank2.log('รับเงินประกันผู้เช่า (เก็บไว้คืน)', dep); } catch (e) { }   // the deposit is the tenant's money held in trust, not income
    p.held = (p.held || 0) + dep; gain(adv, `ค่าเช่าล่วงหน้า 1 เดือน ${info(id).n}`);
    p.lease = { t: ap, start: S.day, end: leaseEndDay(S.day), rent: ask, dep, sat: 70, late: 0, miss: 0, arrears: 0, reqs: [], damage: 0, paidMon: mkey(), months: 0 };
    p.st = 'rent'; p.apps = []; p.vacant = 0; p.lastRent = ask;
    msg('ผู้เช่า ' + ap.name, `เซ็นสัญญาเช่า ${info(id).n} 12 เดือน ค่าเช่า ${baht(ask)}/เดือน วางเงินประกัน ${baht(dep)} + ค่าเช่าล่วงหน้า ${baht(adv)}`);
    note(`เซ็นสัญญาเช่า ${info(id).n} กับ ${ap.name} (${baht(ask)}/เดือน)`, adv); toast(`เซ็นสัญญากับ ${ap.name} แล้ว รับเงินประกัน+ล่วงหน้า ${baht(dep + adv)}`, '🔑');
  }
  function endLease(id, why) {
    const p = P(id), L = p.lease; if (!L) return;
    const cleaning = 500, due = L.arrears + L.damage + cleaning; let held = p.held || 0, take = Math.min(held, due), refund = held - take, short = due - take;
    let insPaid = 0; if (short > 0 && p.ins >= S.day) { insPaid = Math.round(Math.min(short, L.rent * 2 + 20000) * 0.8); }
    if (refund > 0) { if (S.money >= refund) { S.money -= refund; try { Bank2.log('คืนเงินประกันผู้เช่า', -refund); } catch (e) { } } else { refund = S.money; S.money = 0; } }
    else { /* nothing to return */ }
    if (insPaid) gain(insPaid, 'เคลมประกันเจ้าของบ้าน');
    p.held = 0; p.hist.unshift({ d: S.day, t: `ผู้เช่า ${L.t.name} ย้ายออก (${why})`, v: take - refund }); p.hist.length = 12;
    msg('ผู้เช่า ' + L.t.name, `ย้ายออกจาก ${info(id).n} (${why}) · คืนเงินประกัน ${baht(refund)} หักค่าเสียหาย/ค่าค้าง/ทำความสะอาด ${baht(take)}${insPaid ? ` · ประกันจ่าย ${baht(insPaid)}` : ''}`);
    note(`ผู้เช่าย้ายออก ${info(id).n} (${why})`, -refund);
    p.cond = clamp(p.cond - rnd(1, 4) - (L.damage ? 6 : 0), 20, 100); p.lease = null; p.st = p.autoRelist ? 'rent' : 'vacant'; p.vacant = 0; p.apps = [];
    if (p.st === 'rent' && !p.ask) p.ask = marketRent(id);
    killVis(id);
  }

  // ================= daily / monthly engine =================
  function rentDaily(id, p, I) {
    const x = X();
    if (p.st === 'rent' && !p.lease) {                                     // listed: applicants arrive
      p.vacant = (p.vacant || 0) + 1; p.apps = (p.apps || []).filter(a => a.exp >= S.day);
      const ask = p.ask || marketRent(id), ratio = ask / marketRent(id);
      if (p.apps.length < 3 && Math.random() < demandProb(ratio, id)) { const a = newApplicant(id, ask); p.apps.push(a); msg('ผู้สนใจเช่า', `${a.name} (${a.job}) สนใจเช่า ${I.n} นัดดูห้อง ดูรายละเอียดในแอป 🏘️`); }
      return;
    }
    const L = p.lease; if (!L) return;
    if (L.owed && S.day >= L.owed.pay) { gain(L.owed.amt, `ค่าเช่า ${I.n} (จ่ายล่าช้า)`); msg('ผู้เช่า ' + L.t.name, `โอนค่าเช่าที่ค้างแล้ว ${baht(L.owed.amt)}`); L.owed = null; }
    // repairs left alone for two weeks make the tenant unhappy
    for (const r of L.reqs) if (!r.done && S.day - r.day >= 14 && !r.late) { r.late = 1; L.sat = clamp(L.sat - 15, 0, 100); msg('ผู้เช่า ' + L.t.name, `ยังไม่ได้ซ่อม "${r.n}" ที่ ${I.n} นานเกิน 2 สัปดาห์`); }
    if (L.ev) {
      if (L.ev.stage === 'notice' && S.day >= L.ev.until) { if (L.t.score < 45 && Math.random() < 0.45) { L.ev = { stage: 'refuse' }; msg('ผู้เช่า ' + L.t.name, 'ไม่ยอมย้ายออกตามหนังสือบอกเลิกสัญญา ต้องฟ้องขับไล่ที่ศาล'); } else endLease(id, 'ถูกบอกเลิกสัญญา'); }
      else if (L.ev.stage === 'court' && S.day >= L.ev.hear) { msg('ศาลจังหวัด', `คำพิพากษาขับไล่ ${L.t.name} ออกจาก ${I.n} ผู้เช่าต้องออกภายใน 7 วัน`); L.ev = { stage: 'evict', until: S.day + 7 }; }
      else if (L.ev.stage === 'evict' && S.day >= L.ev.until) endLease(id, 'ศาลสั่งขับไล่');
      return;
    }
    if (L.leaving && S.day >= L.leaving) { endLease(id, L.leaveWhy || 'ครบกำหนดสัญญา'); return; }
    if (S.day >= L.end - 30 && !L.renewAsked) { L.renewAsked = 1; const want = Math.random() < clamp(0.25 + L.sat / 130 - (L.miss ? 0.3 : 0), 0.05, 0.9); L.renewWant = want; msg('ผู้เช่า ' + L.t.name, want ? `สัญญาเช่า ${I.n} ใกล้ครบ ${fmtD(L.end)} อยากต่อสัญญาอีก 12 เดือน` : `สัญญาเช่า ${I.n} ใกล้ครบ ${fmtD(L.end)} ผู้เช่าจะไม่ต่อสัญญา`); }
    if (S.day >= L.end) { if (L.renewWant && L.renewOK) { L.start = S.day; L.end = leaseEndDay(S.day); L.rent = L.newRent || L.rent; p.ask = L.rent; L.renewAsked = 0; L.renewWant = false; L.renewOK = false; L.sat = clamp(L.sat + 5, 0, 100); msg('ผู้เช่า ' + L.t.name, `ต่อสัญญาเช่า ${I.n} อีก 12 เดือน ค่าเช่า ${baht(L.rent)}`); } else if (L.renewWant && !L.renewAsked2) { L.renewAsked2 = 1; L.grace = S.day + 7; } else if (!L.grace || S.day >= L.grace) endLease(id, 'ครบกำหนดสัญญา'); }
  }
  function monthClose(id, p, I) {
    const L = p.lease; if (!L) return;
    L.months++; const r = (100 - L.t.score) / 100, rent = L.rent;
    if (L.paidMon === mkey()) { /* signed this month: advance rent covers it */ }
    else if (L.ev && L.ev.stage !== 'notice') { /* in court: no rent collected */ }
    else if (Math.random() < 0.015 + 0.10 * r) { L.arrears += rent; L.miss++; L.sat = clamp(L.sat - 5, 0, 100); msg('ผู้เช่า ' + L.t.name, `ไม่ได้โอนค่าเช่างวด ${D().m + 1}/${D().be} ของ ${I.n} (ค้าง ${L.miss} งวด) · ติดต่อไม่ได้`); }
    else if (Math.random() < 0.06 + 0.28 * r) { L.late++; L.owed = { amt: rent + (L.arrears > 0 && Math.random() < 0.5 ? L.arrears : 0), pay: S.day + Math.floor(rnd(3, 14)) }; if (L.owed.amt > rent) L.arrears -= (L.owed.amt - rent); if (L.arrears <= 0) { L.miss = 0; L.arrears = 0; } msg('ผู้เช่า ' + L.t.name, `ขอเลื่อนจ่ายค่าเช่า ${I.n} ไปอีกไม่กี่วัน (ปกติจ่ายวันที่ 1)`); }
    else { gain(rent, `ค่าเช่า ${I.n}`); if (L.arrears > 0 && Math.random() < 0.3) { gain(L.arrears, `ค่าเช่า ${I.n} (ชำระค้าง)`); L.arrears = 0; } if (L.arrears <= 0) { L.miss = 0; L.arrears = 0; } L.sat = clamp(L.sat + 1, 0, 100); }
    if (L.miss >= 2 && !L.ev && !L.noticeHint) { L.noticeHint = 1; msg('ผู้ดูแลอสังหา', `${L.t.name} ค้างค่าเช่า ${L.miss} งวด ที่ ${I.n} บอกเลิกสัญญาและขับไล่ได้ในแอป`); }
    if (Math.random() < 0.13) { const R = pick([['ก๊อกน้ำรั่ว', 800], ['แอร์ไม่เย็น', 2500], ['ไฟฟ้าลัดวงจร', 1500], ['ประตูล็อกไม่ได้', 1200], ['หลังคารั่ว', 4500], ['ท่อตัน', 1000]]); L.reqs.push({ n: R[0], c: R[1], day: S.day, done: false }); msg('ผู้เช่า ' + L.t.name, `แจ้งซ่อม: ${R[0]} ที่ ${I.n} (ค่าซ่อมโดยประมาณ ${baht(R[1])})`); }
    if (Math.random() < 0.025 + 0.06 * r) { const c = Math.round(rnd(3000, 15000) / 500) * 500; L.damage += c; p.cond = clamp(p.cond - 5, 20, 100); }
    if (Math.random() < 0.012 && !L.leaving) { L.leaving = S.day + 30; L.leaveWhy = 'ผู้เช่าขอเลิกก่อนกำหนด (ยึดเงินประกันครึ่งหนึ่ง)'; const pen = Math.round(p.held * 0.5); if (pen) { p.held -= pen; gain(pen, 'ค่าปรับผู้เช่าเลิกสัญญาก่อนกำหนด'); } msg('ผู้เช่า ' + L.t.name, `แจ้งย้ายออกจาก ${I.n} ภายใน 30 วัน (เลิกก่อนกำหนด)`); }
    if (L.sat < 25 && !L.leaving && Math.random() < 0.5) { L.leaving = S.day + 30; L.leaveWhy = 'ผู้เช่าไม่พอใจ'; msg('ผู้เช่า ' + L.t.name, `ไม่พอใจการดูแล จะย้ายออกจาก ${I.n} ใน 30 วัน`); }
    p.cond = clamp(p.cond - 0.15, 20, 100);
  }
  // ---- sale ----
  function saleDaily(id, p, I) {
    const S0 = p.sale; if (!S0) return; const val = value(id);
    if (S0.deal) { dealDaily(id, p, I); return; }
    S0.offers = (S0.offers || []).filter(o => o.exp >= S.day || o.state === 'counter-wait');
    for (const o of S0.offers) if (o.state === 'counter-wait' && S.day > o.resp) { const gap = o.cnt / Math.max(1, o.amt) - 1, pr = gap <= 0.03 ? 0.7 : gap <= 0.06 ? 0.4 : 0.12; if (Math.random() < pr) { o.amt = o.cnt; o.state = 'agreed'; msg('ผู้ซื้อ ' + o.buyer, `ตกลงราคา ${baht(o.amt)} สำหรับ ${I.n}`); } else { o.state = 'reject'; msg('ผู้ซื้อ ' + o.buyer, `ขอถอนข้อเสนอสำหรับ ${I.n} ราคาที่ขอสูงเกินไป`); } }
    S0.offers = S0.offers.filter(o => o.state !== 'reject');
    if (S0.offers.length < 3) { const ratio = S0.ask / val, base = (S0.agent ? 0.34 : 0.2) * Math.exp(-4.2 * (ratio - 1)) * (I.type === 'land' ? 0.6 : 1); if (Math.random() < clamp(base, 0.01, 0.5)) { const mort = Math.random() < 0.6, amt = rd(S0.ask * rnd(ratio <= 1 ? 0.93 : 0.82, ratio <= 1 ? 1.0 : 0.96), 1000); const o = { id: ++X().n, buyer: nameOf(), amt, mort, appr: Math.round(rnd(5, 14)), exp: S.day + 6, state: 'new' }; S0.offers.push(o); msg('ผู้สนใจซื้อ', `${o.buyer} เสนอซื้อ ${I.n} ราคา ${baht(amt)}${mort ? ' (ขอสินเชื่อธนาคาร)' : ' (เงินสด)'} ดูข้อเสนอในแอป 🏘️`); } }
    S0.days = (S0.days || 0) + 1;
  }
  function dealDaily(id, p, I) {
    const dl = p.sale.deal;
    if (dl.state === 'approval') { if (S.day >= dl.appr) { if (Math.random() < 0.12) { const back = dl.deposit; if (back) { S.money = Math.max(0, S.money - back); } msg('ผู้ซื้อ ' + dl.buyer, `ธนาคารไม่อนุมัติสินเชื่อ ขอยกเลิกซื้อ ${I.n} (คืนมัดจำ ${baht(back)})`); p.sale.deal = null; p.sale.offers = []; return; } dl.state = 'ready'; dl.close = nextOpenDay('land', Math.max(S.day + 1, dl.appr)); msg('สำนักงานที่ดิน', `นัดโอนกรรมสิทธิ์ ${I.n} วันที่ ${fmtD(dl.close)} ที่สำนักงานที่ดิน พร้อมบัตรประชาชนและทะเบียนบ้าน`); } return; }
    if (dl.state === 'ready' && S.day > dl.close + 3) { const pen = dl.deposit * 2; const paid = Math.min(S.money, pen); S.money -= paid; try { Bank2.log('ชดใช้ผู้ซื้อ (ผิดนัดโอน)', -paid); } catch (e) { } msg('ผู้ซื้อ ' + dl.buyer, `ผู้ขายไม่มาโอนตามนัด ยกเลิกสัญญา คืนมัดจำและเรียกค่าเสียหายรวม ${baht(pen)}`); note(`ผิดนัดโอน ${I.n}`, -paid); p.sale.deal = null; p.sale.offers = []; }
  }
  function closeSale(id) {
    const p = P(id), I = info(id), dl = p.sale && p.sale.deal; if (!dl || dl.state !== 'ready') return;
    if (S.day < dl.close) { toast(`ยังไม่ถึงวันนัดโอน (${fmtD(dl.close)})`, '📅'); return; }
    if (!hoursOpen('land')) { toast(`สำนักงานที่ดินปิดอยู่ ตอนนี้ ${Cal36.hhmm()} (เปิด ${Hours36.todayText ? Hours36.todayText('land') : 'จ-ศ'})`, '🕐'); return; }
    if (!needDocs(['idcard', 'housereg'], 'โอนกรรมสิทธิ์อสังหาริมทรัพย์')) return;
    const val = value(id), appr = govApp(id), c = saleCosts(dl.amt, appr, S.day - p.acq), agent = p.sale.agent ? Math.round(dl.amt * 0.03) : 0;
    const m = X().mort.find(q => q.prop === id && q.bal > 0), payoff = m ? m.bal : 0, net = dl.amt - c.total - agent - payoff + (0);
    if (net < -S.money) { toast('ขายไม่ได้ ยอดหนี้สินเชื่อและภาษีสูงกว่าราคาขาย', '⚠️'); return; }
    // the 5% deposit was received when the deal was agreed: only the rest comes from the buyer now
    const cash = dl.amt - dl.deposit - c.total - agent - payoff;
    if (cash >= 0) gain(cash, `ขายอสังหาริมทรัพย์ ${I.n}`); else { S.money = Math.max(0, S.money + cash); try { Bank2.log('ชำระส่วนต่างหนี้ตอนขาย', cash); } catch (e) { } }
    if (m) { m.bal = 0; m.closed = S.day; }
    X().tax.sale += c.total;
    if (p.lease) endLease(id, 'ขายอสังหาริมทรัพย์');
    note(`ขาย ${I.n} ${baht(dl.amt)} (ภาษี/ค่าโอน ${baht(c.total)})`, net);
    msg('สำนักงานที่ดิน', `โอนกรรมสิทธิ์ ${I.n} ให้ ${dl.buyer} เรียบร้อย · ราคา ${baht(dl.amt)} · ค่าโอนฝั่งผู้ขาย ${baht(c.transfer)} · ภาษีธุรกิจเฉพาะ ${baht(c.sbt)} · อากรแสตมป์ ${baht(c.stamp)} · หัก ณ ที่จ่าย ${baht(c.wht)}${agent ? ` · ค่านายหน้า ${baht(agent)}` : ''}${payoff ? ` · ปิดสินเชื่อ ${baht(payoff)}` : ''}`);
    removeProperty(id); toast(`ขาย ${I.n} สำเร็จ ได้รับสุทธิ ${baht(Math.max(0, cash))}`, '🏷️');
  }
  function removeProperty(id) {
    const [kind, key] = id.split(':'); const x = X();
    try { if (kind === 'hb' || kind === 'bld' || kind === 'land') { delete S.hb.lots[key]; try { HomeBuild.draw(key); } catch (e) { } try { delete S.v23.homes[key]; } catch (e) { } try { delete S.v28.m[key]; } catch (e) { } } } catch (e) { }
    try { if (kind === 'est') delete S.est.own[key]; } catch (e) { }
    delete x.props[id]; killVis(id); try { if (S.v39e) { for (const k of Object.keys(vis)) if (k.startsWith(id)) killVis(k); } } catch (e) { }
  }
  // ---- buying from the market ----
  const TYPES = [['house', 'บ้านเดี่ยว', 1200000, 6500000, 4], ['townhome', 'ทาวน์โฮม', 900000, 3200000, 3], ['condo', 'คอนโด', 1100000, 4500000, 2], ['land', 'ที่ดินเปล่า', 400000, 3000000, 3], ['commercial', 'อาคารพาณิชย์', 2500000, 9000000, 3], ['dorm', 'อพาร์ตเมนต์/หอพัก', 5000000, 14000000, 3]];
  const DEFECTS = ['หลังคารั่วบางจุด', 'ท่อน้ำทิ้งอุดตัน', 'สีผนังลอก', 'ระบบไฟเก่า', 'ปลวกในโครงไม้', 'พื้นทรุดเล็กน้อย', 'น้ำท่วมขังหน้าบ้านช่วงฝน', 'เพื่อนบ้านเสียงดัง'];
  function refreshMarket() {
    const x = X(), m = x.mkt; m.list = m.list.filter(l => l.exp >= S.day || l.deal);
    const want = 9; let guard = 0;
    while (m.list.filter(l => !l.deal).length < want && guard++ < 30) {
      const C = pick(cities()), T = pick(TYPES), base = rd(rnd(T[2], T[3]) * C.f, 10000), cond = Math.round(rnd(55, 96)), ndef = cond < 70 ? 2 : cond < 85 ? 1 : 0;
      const defects = []; while (defects.length < ndef) { const d = pick(DEFECTS); if (!defects.includes(d)) defects.push(d); }
      const id = ++m.n, ask = rd(base * rnd(0.97, 1.16), 10000), rooms = T[0] === 'land' ? 0 : T[4] + Math.floor(Math.random() * 2);
      m.list.push({ id, city: C.k, type: T[0], name: `${T[1]} ${C.n}${T[0] === 'land' ? ' ' + (1 + Math.floor(Math.random() * 3)) + ' ไร่' : ' ' + (30 + Math.floor(Math.random() * 90)) + ' ตร.ม.'}`, i: PT[T[0]][1], base, ask, cond, defects, insp: false, rooms, area: 30 + Math.floor(Math.random() * 120), exp: S.day + Math.round(rnd(21, 35)), units: T[0] === 'dorm' ? 12 + Math.floor(Math.random() * 14) : 1 });
    }
  }
  const lst = id => X().mkt.list.find(l => l.id === +id);
  function offerResp(l) {
    const o = l.offer; if (!o || o.state !== 'wait' || S.day < o.resp) return;
    const floor = l.base * rnd(0.9, 0.98);
    if (o.amt >= floor || o.amt >= l.ask * 0.985) { o.state = 'accepted'; msg('เจ้าของทรัพย์', `ตกลงขาย ${l.name} ให้ราคา ${baht(o.amt)} · ติดต่อธนาคาร/นัดโอนได้ในแอป`); }
    else if (o.amt >= floor * 0.93 && !o.countered) { o.countered = 1; o.state = 'counter'; o.cnt = rd((o.amt + l.ask) / 2, 10000); msg('เจ้าของทรัพย์', `ต่อรอง ${l.name} ราคา ${baht(o.cnt)}`); }
    else { o.state = 'rejected'; msg('เจ้าของทรัพย์', `ปฏิเสธข้อเสนอ ${baht(o.amt)} สำหรับ ${l.name}`); }
  }
  function buyerDaily() {
    for (const l of X().mkt.list) {
      offerResp(l);
      const dl = l.deal; if (!dl) continue;
      if (dl.state === 'approval' && S.day >= dl.appr) { const ok = dl.dsrOK; if (ok) { dl.state = 'ready'; dl.close = nextOpenDay('land', S.day + 1); msg('ธนาคารสุขใจ', `อนุมัติสินเชื่อ ${baht(dl.loan)} อัตรา ${(dl.rate * 100).toFixed(2)}% ต่อปี · ผ่อน ${baht(dl.pmt)}/เดือน · นัดโอนวันที่ ${fmtD(dl.close)}`); } else { dl.state = 'rejected'; msg('ธนาคารสุขใจ', `ไม่อนุมัติสินเชื่อ ${l.name}: ภาระหนี้ต่อรายได้เกิน 40% (DSR) · เสียมัดจำคืนครบ`); S.money += dl.deposit; l.deal = null; l.offer = null; } }
      if (dl && dl.state === 'ready' && S.day > dl.close + 3) { msg('ผู้ขาย', `คุณไม่มาโอน ${l.name} ตามนัด ผู้ขายยึดเงินมัดจำ ${baht(dl.deposit)}`); note(`เสียมัดจำ ${l.name}`, -dl.deposit); l.deal = null; l.offer = null; }
    }
  }
  function closeBuy(lid) {
    const l = lst(lid), dl = l && l.deal; if (!dl || dl.state !== 'ready') return;
    if (S.day < dl.close) { toast(`ยังไม่ถึงวันนัดโอน (${fmtD(dl.close)})`, '📅'); return; }
    if (!hoursOpen('land')) { toast('สำนักงานที่ดินปิดอยู่ มาใหม่ในเวลาทำการ', '🕐'); return; }
    if (!needDocs(['idcard', 'housereg'], 'โอนกรรมสิทธิ์อสังหาริมทรัพย์')) return;
    const appr = rd(dl.amt * 0.7, 1000), fee = Math.round(appr * 0.01), reg = dl.loan ? Math.min(200000, Math.round(dl.loan * 0.01)) + 3000 : 0, bal = dl.amt - dl.deposit - dl.loan, total = bal + fee + reg;
    if (S.money < total) { toast(`ต้องเตรียมเงิน ${baht(total)} (ส่วนที่เหลือ ${baht(bal)} + ค่าโอน ${baht(fee)}${reg ? ' + จดจำนอง ' + baht(reg) : ''})`, '💸'); return; }
    S.money -= total; try { Bank2.log(`ซื้ออสังหา ${l.name} (ส่วนที่เหลือ+ค่าโอน)`, -total); } catch (e) { }
    const id = 'mkt:' + l.id; X().props[id] = { st: 'home', acq: S.day, paid: dl.amt, cond: l.cond, furn: false, own: true, hist: [], n: l.name, i: l.i, type: l.type, city: l.city, base: l.base, area: l.area, rooms: l.rooms, units: l.units, defects: l.defects.slice() };
    if (dl.loan) X().mort.push({ id: ++X().n, prop: id, principal: dl.loan, bal: dl.loan, rate: dl.rate, term: dl.term, pmt: dl.pmt, start: S.day, miss: 0, paid: 0 });
    X().mkt.list = X().mkt.list.filter(q => q.id !== l.id);
    note(`ซื้อ ${l.name} ${baht(dl.amt)}${dl.loan ? ` (กู้ ${baht(dl.loan)})` : ''}`, -total);
    msg('สำนักงานที่ดิน', `โอนกรรมสิทธิ์ ${l.name} ให้คุณแล้ว · ราคา ${baht(dl.amt)} · ค่าโอน ${baht(fee)}${dl.loan ? ` · สินเชื่อ ${baht(dl.loan)} ผ่อน ${baht(dl.pmt)}/เดือนทุกวันที่ 1` : ''}`);
    toast(`ซื้อ ${l.name} สำเร็จ`, '🏠');
  }
  // ---- mortgage instalments ----
  function mortMonthly() {
    for (const m of X().mort) {
      if (m.bal <= 0) continue; const I = info(m.prop);
      if (!X().props[m.prop] && !(m.prop === 'main')) { /* the property is gone: the bank was paid at sale */ }
      const r = m.rate / 12, interest = Math.round(m.bal * r), principal = Math.min(m.bal, Math.max(0, m.pmt - interest)), due = interest + principal;
      if (takeCash(due)) { m.bal = Math.max(0, m.bal - principal); m.paid += due; m.miss = 0; try { Bank2.log(`ผ่อนสินเชื่อบ้าน ${I.n}`, -due); } catch (e) { } if (m.bal <= 0) { msg('ธนาคารสุขใจ', `ปิดสินเชื่อ ${I.n} ครบแล้ว ขอบคุณที่ผ่อนตรงเวลา`); } }
      else {
        m.miss++; const late = Math.round(m.pmt * 0.03); m.lateFee = (m.lateFee || 0) + late;
        try { const c = Credit.st(); c.score = Math.max(300, c.score - 15); } catch (e) { }
        msg('ธนาคารสุขใจ', m.miss >= 3 ? `ค้างผ่อน ${I.n} ${m.miss} งวด ธนาคารส่งหนังสือแจ้งบังคับจำนอง` : `ผ่อนสินเชื่อ ${I.n} ไม่ได้ ค้าง ${m.miss} งวด เบี้ยปรับ ${baht(late)}`);
        if (m.miss >= 4) { msg('ธนาคารสุขใจ', `ธนาคารยึดและขายทอดตลาด ${I.n} เพื่อชำระหนี้ เครดิตบูโรเสียหาย`); try { const c = Credit.st(); c.score = Math.max(300, c.score - 80); } catch (e) { } m.bal = 0; m.closed = S.day; note(`ถูกยึด ${I.n}`, 0); try { removeProperty(m.prop); } catch (e) { } }
      }
    }
  }
  // ---- market index / listings ----
  function marketMonthly() {
    const x = X();
    for (const c of cities()) { const v = c.sz === 'large' ? 0.012 : c.sz === 'medium' ? 0.009 : 0.007; x.idx[c.k] = +clamp((x.idx[c.k] || 1) * (1 + 0.0025 + rnd(-v, v)), 0.7, 1.8).toFixed(4); x.dem[c.k] = +clamp((x.dem[c.k] || 1) + rnd(-0.03, 0.03) + (1 - (x.dem[c.k] || 1)) * 0.2, 0.8, 1.25).toFixed(3); }
    try { const ev = S.v31dz && S.v31dz.ev; if (ev && ev.length) { const e = ev[0]; if (e && e.k === 'flood' && S.day - (e.day || e.d || 0) < 35) shock('village', -0.012, 'น้ำท่วมในพื้นที่'); } } catch (e) { }
  }
  // ---- guesthouse (homestay / Airbnb) ----
  function airDaily(id, p, I) {
    const a = p.air; if (!a || p.st !== 'air') return;
    const mk = airMarket(id), ratio = a.rate / mk, t = D(); let f = 0.52;
    if (t.dow >= 4 && t.dow <= 5) f *= 1.25; try { if (Cal24.isHoliday(S.day)) f *= 1.35; } catch (e) { } try { if (Fest24.today()) f *= 1.2; } catch (e) { }
    const mo = t.m; f *= (mo >= 4 && mo <= 9) ? 0.88 : (mo >= 10 || mo <= 1) ? 1.18 : 1;       // rainy season low, cool season high
    f *= Math.exp(-2.4 * (ratio - 1)) * (0.6 + (a.rating || 4.2) / 5 * 0.55) * (0.75 + p.cond / 400);
    if (a.busy > 0) { a.busy--; a.nights = (a.nights || 0) + 1; return; }
    if (Math.random() < clamp(f * 0.55, 0, 0.9)) {
      const nights = 1 + Math.floor(Math.random() * 3), gross = nights * a.rate, fee = Math.round(gross * 0.15), clean = 300, net = gross - fee - clean;
      a.busy = nights - 1; a.nights = (a.nights || 0) + 1; a.rev = (a.rev || 0) + gross; a.fees = (a.fees || 0) + fee + clean; a.stays = (a.stays || 0) + 1; a.mrev = (a.mrev || 0) + net;
      gain(net, `ค่าเช่าโฮมสเตย์ ${I.n}`);
      const rv = clamp(4.5 + (p.cond - 80) / 60 - Math.max(0, ratio - 1) * 1.2 + rnd(-0.9, 0.5), 1, 5); a.rating = +(((a.rating || 4.2) * Math.min(a.stays, 20) + rv) / (Math.min(a.stays, 20) + 1)).toFixed(2);
      p.cond = clamp(p.cond - 0.08, 20, 100); showGuest(id);
    }
  }
  // ---- own business in a building ----
  const BIZ = { shop: { n: 'ร้านขายของชำ/ร้านสะดวกซื้อ', i: '🏪', basket: 85, cogs: 0.72, base: 38, docs: ['commreg'], sign: 'ร้านชำ' }, cafe: { n: 'ร้านกาแฟ/อาหาร', i: '☕', basket: 78, cogs: 0.38, base: 34, docs: ['commreg', 'foodsan'], sign: 'คาเฟ่' }, office: { n: 'ให้เช่าเป็นสำนักงาน/ร้านค้า', i: '🏢', rentOnly: 1 }, warehouse: { n: 'ให้เช่าเป็นโกดัง', i: '📦', rentOnly: 1 } };
  function bizDaily(id, p, I) {
    const b = p.biz; if (!b || p.st !== 'biz') return; const T = BIZ[b.t], t = D(); if (!T || T.rentOnly) return;
    const zone = idxOf(I.city) * (cityOf(I.city).f), stock = b.stock > 0 ? 1 : 0.35;
    let f = T.base * (0.8 + 0.2 * zone) * (0.7 + (b.rep || 50) / 160); if (t.dow >= 5) f *= 1.25; try { if (Cal24.isHoliday(S.day)) f *= 0.8; } catch (e) { }
    f *= Math.exp(-1.6 * (b.price - 1)) * stock; const cap = 70 + 60 * (b.staff || 0), cust = Math.round(Math.min(cap, f * rnd(0.8, 1.2)));
    const rev = Math.round(cust * T.basket * b.price), cogs = Math.round(rev * T.cogs * (b.stock > 0 ? 1 : 1)), wage = (b.staff || 0) * 400, util = 150;
    b.stock = Math.max(0, (b.stock || 0) - cust * 1.0); const profit = rev - cogs - wage - util;
    b.rev = (b.rev || 0) + rev; b.cost = (b.cost || 0) + cogs + wage + util; b.cust = (b.cust || 0) + cust; b.mrev = (b.mrev || 0) + rev; b.mcost = (b.mcost || 0) + cogs + wage + util;
    S.money += profit; try { S.stats.earned += Math.max(0, profit); if (profit > 0) Bank2.income(`รายได้ร้าน ${b.name}`, profit); else Bank2.log(`ขาดทุนร้าน ${b.name}`, profit); } catch (e) { }
    b.rep = clamp((b.rep || 50) + (b.price <= 1 ? 0.15 : -0.1) + (b.stock > 0 ? 0.05 : -1.5) + (cust > 30 ? 0.05 : 0), 5, 100);
    if (b.stock <= 0 && !b.warned) { b.warned = 1; msg('ร้าน ' + b.name, 'สินค้าหมดสต็อก ซื้อของเข้าร้านที่แอป 🏘️'); } if (b.stock > 0) b.warned = 0;
    if (cust > 6) showCustomer(id);
  }
  function monthlyTax(id, p, I) { /* rent tax is handled by PTax through the 'ค่าเช่า' label; nothing extra here */ }
  // ================= daily / monthly drivers =================
  let busy = false;
  function daily() {
    if (busy) return; busy = true;
    try {
      const x = X();
      migrate();
      const mk = mkey(), newMonth = x.mon !== mk;
      if (x.mkt.day < S.day - 6) { refreshMarket(); x.mkt.day = S.day; }
      buyerDaily();
      for (const id of ids()) {
        const p = P(id), I = info(id);
        try {
          if (p.ins && p.ins < S.day && !p.insNoted) { p.insNoted = 1; msg('ประกันเจ้าของบ้าน', `กรมธรรม์ ${I.n} หมดอายุแล้ว`); }
          if (p.sale) saleDaily(id, p, I);
          if (p.st === 'rent') rentDaily(id, p, I);
          if (p.st === 'air') airDaily(id, p, I);
          if (p.st === 'biz') bizDaily(id, p, I);
        } catch (e) { console.warn('v39 prop', id, e); }
      }
      if (newMonth) {
        x.mon = mk;
        for (const id of ids()) { const p = P(id), I = info(id); try { if (p.lease) monthClose(id, p, I); if (p.st === 'rent' && !p.lease && !I.rentOnly) { /* vacancy */ } if ((p.air || p.biz)) { (p.hist || (p.hist = [])).unshift({ d: S.day, t: p.air ? 'รายได้โฮมสเตย์เดือนที่แล้ว' : 'ผลประกอบการร้านเดือนที่แล้ว', v: p.air ? (p.air.mrev || 0) : (p.biz.mrev || 0) - (p.biz.mcost || 0) }); p.hist.length = 12; if (p.air) p.air.mrev = 0; if (p.biz) { p.biz.mrev = 0; p.biz.mcost = 0; } } } catch (e) { console.warn('v39 month', id, e); } }
        if (D().m === 0) for (const id of ids()) if (id.startsWith('mkt:')) { const I = info(id), r = I.type === 'commercial' || I.type === 'dorm' ? 0.003 : I.type === 'land' ? 0.0015 : 0.0003, tx = Math.round(value(id) * r); if (tx > 0) { S.money = Math.max(0, S.money - tx); try { Bank2.log(`ภาษีที่ดินและสิ่งปลูกสร้าง ${I.n}`, -tx); } catch (e) { } x.tax.prop = (x.tax.prop || 0) + tx; msg('เทศบาล', `ชำระภาษีที่ดินและสิ่งปลูกสร้างประจำปี ${I.n} ${baht(tx)}`); } }
        mortMonthly(); marketMonthly();
      }
    } finally { busy = false; }
  }
  function migrate() {
    const x = X(); if (x.migrated) return; x.migrated = 1;
    try {
      for (const [id, st] of Object.entries((S.hb && S.hb.lots) || {})) {
        if (st.rent) { st.rent = false; const pid = (st.design && st.stage >= 3 ? 'hb:' : 'bld:') + id, p = P(pid); p.st = 'air'; p.air = { rate: airMarket(pid), rating: 4.2, stays: 0, busy: 0, paused: !has('hotel') }; p.migrated = 1; if (!has('hotel')) { p.st = 'vacant'; msg('อสังหาริมทรัพย์', `บ้านที่เคยปล่อยเช่ารายวันต้องมีใบอนุญาตกิจการที่พัก (โฮมสเตย์) ก่อนรับแขก — ปรับเป็นว่าง ขอใบอนุญาตที่ศูนย์ราชการหรือแอปยื่นเอกสาร แล้วเปิดใหม่ได้ในแอป 🏘️`); } }
      }
      for (const [k, o] of Object.entries((S.est && S.est.own) || {})) if (o.rent) { const pid = 'est:' + k, p = P(pid); if (info(pid).type !== 'land') { p.st = 'rent'; p.ask = marketRent(pid); p.autoRelist = true; p.apps = []; p.vacant = 0; } }   // the old automatic rent becomes a real listing
    } catch (e) { console.warn('v39 migrate', e); }
  }
  // ================= wrappers around the old systems =================
  try { const _d = HomeBuild.day.bind(HomeBuild); HomeBuild.day = function () { const lots = (S.hb && S.hb.lots) || {}, saved = {}; for (const k in lots) { saved[k] = lots[k].rent; lots[k].rent = false; } try { return _d(); } finally { for (const k in lots) if (lots[k]) lots[k].rent = false; } }; } catch (e) { }
  try { const _w = Estate.week.bind(Estate); Estate.week = function () { const own = (S.est && S.est.own) || {}, sv = {}; for (const k in own) { sv[k] = own[k].rent; own[k].rent = false; } try { return _w(); } finally { for (const k in own) if (own[k]) own[k].rent = sv[k]; } }; } catch (e) { }
  try { const _s = Estate.sell.bind(Estate); Estate.sell = function (k) { openDetail('est:' + k, true); }; Estate._sell0 = _s; } catch (e) { }
  try { UI.H.lotrent = d => { const st = ((S.hb || {}).lots || {})[d.v]; if (!st) return; UI.close(); setTimeout(() => openDetail(((st.design && st.stage >= 3) ? 'hb:' : 'bld:') + d.v), 0); }; } catch (e) { }
  try { const _b = Life2.bill.bind(Life2); Life2.bill = function () {   // a tenant pays the water and electricity of the house they live in
    const m = (S.v28 && S.v28.m) || {}, sv = {}; for (const id of ids()) { const p = X().props[id], k = id.split(':')[1]; if (p && p.lease && m[k]) { sv[k] = [m[k].e.wk, m[k].w.wk]; m[k].e.wk = 0; m[k].w.wk = 0; } }
    try { return _b(); } finally { for (const k in sv) { m[k].e.wk = sv[k][0]; m[k].w.wk = sv[k][1]; } } }; } catch (e) { }
  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { daily(); } catch (e) { console.warn('v39 estate', e); } return r; }; }

  // ================= visible residents / guests / customers + signs =================
  const vis = {};
  function houseGroup(id) { const key = id.split(':')[1]; try { return HomeBuild.g[key] && HomeBuild.g[key].g; } catch (e) { return null; } }
  function killVis(id) { for (const k of Object.keys(vis)) if (k === id || k.startsWith(id + '#')) { const v = vis[k]; try { if (v.obj && v.obj.parent) v.obj.parent.remove(v.obj); } catch (e) { } delete vis[k]; } }
  function mkHuman(seed) { let o = null; try { o = Models.human({ avatar: 'toon:set2_' + (1 + seed % 9) }); } catch (e) { } if (!o) { try { o = Models.human({}); } catch (e) { } } return o; }
  function spawn(id, tag, seed, hrs) {
    const key = id + '#' + tag, g = houseGroup(id); if (!g) return; let v = vis[key];
    if (v && (!v.obj || v.obj.parent !== g)) { killVis(key.split('#')[0]); v = null; }
    if (!v) { const o = mkHuman(seed); if (!o) return; const st = (S.hb.lots[id.split(':')[1]] || {}), Dg = HOUSE_DESIGNS[st.design]; if (!Dg) return; g.add(o); v = vis[key] = { obj: o, door: [0, Dg.o.d / 2 + 1.3], w: Dg.o.w, d: Dg.o.d, state: 'in', t: 0, x: 0, z: Dg.o.d / 2 + 1.3, tx: 0, tz: 0, hrs, life: 40 }; o.visible = false; }
    return v;
  }
  function showGuest(id) { if (id.startsWith('hb:') && nearPlayer(id)) { const v = spawn(id, 'guest', 3 + Math.floor(Math.random() * 6), null); if (v && v.state === 'in') { v.state = 'out'; v.t = 0; } } }
  function showCustomer(id) { if (id.startsWith('hb:') && nearPlayer(id)) { const v = spawn(id, 'cust' + (Math.random() < 0.5 ? 'a' : 'b'), 1 + Math.floor(Math.random() * 8), null); if (v && v.state === 'in') { v.state = 'out'; v.t = 0; v.shop = 1; } } }
  function nearPlayer(id) { try { const L = lotOf(id.split(':')[1]), p = G.player.pos; return L && Math.hypot(p.x - L.x, p.z - L.z) < 80 && !G.inside; } catch (e) { return false; } }
  function tickVis(dt) {
    const h = S.time / 60;
    for (const id of ids()) {
      if (!id.startsWith('hb:')) continue; const p = X().props[id]; if (!p) continue;
      if (p.lease && nearPlayer(id) && !G.inside) { const v = spawn(id, 'res', p.lease.t.id, null); if (v && v.state === 'in' && ((h > 6.5 && h < 8.5) || (h > 17.2 && h < 21)) && Math.random() < 0.04) { v.state = 'out'; v.t = 0; } }
      else if (!nearPlayer(id)) killVis(id);
    }
    for (const k of Object.keys(vis)) {
      const v = vis[k]; if (!v.obj) continue;
      if (v.state === 'in') { v.obj.visible = false; continue; }
      v.t += dt; v.obj.visible = true;
      if (v.state === 'out') { v.x = v.door[0]; v.z = v.door[1]; v.tx = (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 3); v.tz = v.d / 2 + 3.2 + Math.random() * 2; v.state = 'walk'; v.wait = 3 + Math.random() * 5; }
      let spd = 0;
      if (v.state === 'walk') { const dx = v.tx - v.x, dz = v.tz - v.z, dist = Math.hypot(dx, dz); if (dist < 0.2) { v.state = 'idle'; } else { const s = Math.min(dist, 1.3 * dt); v.x += dx / dist * s; v.z += dz / dist * s; spd = 1.3; v.obj.rotation.y = Math.atan2(dx, dz); } }
      else if (v.state === 'idle') { v.wait -= dt; if (v.wait <= 0) { v.state = 'back'; } }
      else if (v.state === 'back') { const dx = v.door[0] - v.x, dz = v.door[1] - v.z, dist = Math.hypot(dx, dz); if (dist < 0.25) { v.state = 'in'; v.obj.visible = false; continue; } const s = Math.min(dist, 1.4 * dt); v.x += dx / dist * s; v.z += dz / dist * s; spd = 1.4; v.obj.rotation.y = Math.atan2(dx, dz); }
      v.obj.position.set(v.x, 0.05, v.z); try { Models.animHuman(v.obj, dt, spd, null); } catch (e) { }
      if (v.t > 90) { v.state = 'back'; }
    }
  }
  setInterval(() => { try { if (G && G.started && !G.simulating && !document.hidden) tickVis(0.15); } catch (e) { } }, 150);
  // for sale / for rent / shop sign next to each completed house
  try {
    const _draw = HomeBuild.draw.bind(HomeBuild);
    HomeBuild.draw = function (id) {
      _draw(id);
      try {
        const st = (S.hb.lots || {})[id], rec = this.g[id]; if (!st || !st.design || st.stage < 3 || !rec) return; const p = X().props['hb:' + id]; if (!p) return;
        const Dg = HOUSE_DESIGNS[st.design]; let txt = null, bg = '#1565c0';
        if (p.st === 'sale' || (p.sale && p.sale.ask)) { txt = 'ขาย ' + U.fmt(p.sale.ask) + ' ฿'; bg = '#c62828'; }
        else if (p.st === 'rent' && !p.lease) { txt = 'ให้เช่า ' + U.fmt(p.ask || 0) + ' ฿/ด.'; bg = '#1565c0'; }
        else if (p.st === 'air') { txt = 'โฮมสเตย์ ' + U.fmt(p.air.rate) + '/คืน'; bg = '#00897b'; }
        else if (p.st === 'biz' && p.biz) { txt = p.biz.name; bg = '#6a1b9a'; }
        else if (p.lease) { txt = 'มีผู้เช่าแล้ว'; bg = '#455a64'; }
        if (!txt) return;
        const g = rec.g, sg = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.62), new THREE.MeshStandardMaterial({ map: U.signTex(txt, { w: 512, h: 128, bg }) }));
        sg.position.set(Dg.o.w / 2 + 1.4, 1.5, Dg.o.d / 2 + 2.2); g.add(sg);
        U.mk(g, GEO.box, M.darkwood, [Dg.o.w / 2 + 0.3, 0.75, Dg.o.d / 2 + 2.18], [0.1, 1.5, 0.1]); U.mk(g, GEO.box, M.darkwood, [Dg.o.w / 2 + 2.5, 0.75, Dg.o.d / 2 + 2.18], [0.1, 1.5, 0.1]);
      } catch (e) { }
    };
  } catch (e) { }
  const redraw = id => { try { if (id.startsWith('hb:')) HomeBuild.draw(id.split(':')[1]); } catch (e) { } };

  // ================= the phone app =================
  const hub = { sel: null, tab: 0, mkt: null, dp: 0.2, term: 20, ask: 0 };
  const TABS = ['🏠 ทรัพย์สินของฉัน', '🏷️ ตลาด / ซื้อทรัพย์', '🏦 สินเชื่อบ้าน', '📊 รายรับ-ภาษี', '🗓️ กำหนดการ'];
  const B = (act, label, o = {}) => `<button class="btn ${o.ghost ? 'ghost' : ''}" data-a="v39e" data-v="${esc(act)}"${o.dis ? ' disabled' : ''}>${label}</button>`;
  const C = (i, h, p, btns = '') => `<div class="card"><div class="ci">${i}</div><div class="cb"><h4>${h}</h4><p class="dim">${p}</p>${btns ? `<div class="row">${btns}</div>` : ''}</div></div>`;
  const GR = x => `<div class="grid">${x}</div>`;
  const DIM = t => `<p class="dim">${t}</p>`;
  const A = {};
  UI.H.v39e = d => { const [k, ...r] = String(d.v || '').split('|'); const f = A[k]; if (f) { try { f(...r); } catch (e) { if (e && e.spend173) throw e; console.warn('v39e', k, e); } try { if (UI.cur && UI.cur.render) UI.renderBody(); } catch (e) { } } };
  const statusTxt = (id, p) => {
    if (id === 'main') return '🏠 บ้านหลักที่พักอาศัย'; const I = info(id);
    if (p.sale && p.sale.deal) return '🤝 ตกลงขายแล้ว รอโอน'; if (p.sale) return `🏷️ ประกาศขาย ${baht(p.sale.ask)}`;
    if (p.st === 'rent' && p.lease) return `🔑 มีผู้เช่า · ${baht(p.lease.rent)}/เดือน`; if (p.st === 'rent') return `📢 ประกาศให้เช่า ${baht(p.ask || 0)}/เดือน · ว่างมา ${p.vacant || 0} วัน`;
    if (p.st === 'air') return `🛎️ โฮมสเตย์ ${baht(p.air.rate)}/คืน · ⭐${(p.air.rating || 4.2).toFixed(1)}`; if (p.st === 'biz') return `🏪 ${esc(p.biz ? p.biz.name : '')}`;
    return p.st === 'vacant' ? '⬜ ว่าง ไม่ได้ใช้งาน' : I.type === 'land' ? '🌳 ที่ดินเปล่า' : '🏡 เจ้าของอยู่เอง';
  };
  function propCard(id) {
    const p = P(id), I = info(id), v = value(id), m = X().mort.find(q => q.prop === id && q.bal > 0);
    return C(I.i, esc(I.n), `${PT[I.type] ? PT[I.type][0] : ''} · มูลค่าประเมิน ${baht(v)}${m ? ` · 🏦 ค้างสินเชื่อ ${baht(m.bal)}` : ''}<br>${statusTxt(id, p)} · สภาพ ${Math.round(p.cond)}%`, B('sel|' + id, '🔍 จัดการ'));
  }
  const stepper = (key, val, lo) => `${B(`adj|${key}|-0.1`, '−10%', { ghost: 1 })}${B(`adj|${key}|-0.05`, '−5%', { ghost: 1 })}${B(`adj|${key}|0.05`, '+5%', { ghost: 1 })}${B(`adj|${key}|0.1`, '+10%', { ghost: 1 })}`;
  function detail(id) {
    const p = P(id), I = info(id), v = value(id), mr = marketRent(id), m = X().mort.find(q => q.prop === id && q.bal > 0);
    let h = `<div class="row">${B('sel|', '‹ กลับรายการ', { ghost: 1 })}</div><h5>${I.i} ${esc(I.n)}</h5>`;
    h += DIM(`${PT[I.type] ? PT[I.type][0] : ''} · มูลค่าตลาด ${baht(v)} · ราคาประเมินราชการ ${baht(govApp(id))} · สภาพ ${Math.round(p.cond)}% · ถือครองมา ${Math.floor((S.day - p.acq) / 30)} เดือน${m ? ` · 🏦 สินเชื่อคงเหลือ ${baht(m.bal)} ผ่อน ${baht(m.pmt)}/เดือน` : ''}`);
    h += DIM(`${statusTxt(id, p)} · ค่าเช่าตลาดโดยประมาณ ${mr ? baht(mr) + '/เดือน' : '—'}`);
    if (id === 'main') return h + DIM('บ้านหลักที่คุณอยู่อาศัย ไม่สามารถขายหรือปล่อยเช่าได้ ต่อเติมได้ที่แอป 🏗️ ต่อเติมบ้านหลัก');
    if (p.sale) return h + saleView(id, p, I);
    if (p.st === 'air') return h + airView(id, p, I);
    if (p.st === 'biz') return h + bizView(id, p, I);
    if (p.lease) return h + leaseView(id, p, I);
    if (p.st === 'rent') return h + listingView(id, p, I);
    // idle: choose a use
    const btns = [];
    if (I.type !== 'land') { btns.push(B('listRent|' + id, '📢 ประกาศให้เช่าระยะยาว')); btns.push(B('air.start|' + id, '🛎️ ทำโฮมสเตย์ (รายวัน)', { ghost: 1 })); btns.push(B('biz.menu|' + id, '🏪 เปิดธุรกิจในอาคาร', { ghost: 1 })); }
    btns.push(B('sale.start|' + id, '🏷️ ประกาศขาย', { ghost: 1 }));
    h += `<div class="row">${btns.join('')}</div>`;
    h += DIM(`🛡️ ประกันเจ้าของบ้าน: ${p.ins >= S.day ? 'คุ้มครองถึง ' + fmtD(p.ins) : 'ไม่มี'} · ${B('ins|' + id, p.ins >= S.day ? 'ต่ออายุ' : 'ซื้อประกัน ' + baht(Math.max(600, Math.round(v * 0.0012))) + '/ปี', { ghost: 1 })}`);
    h += DIM(`🛋️ ${p.furn ? 'ตกแต่งพร้อมเข้าอยู่ (ค่าเช่า +12%)' : 'ไม่มีเฟอร์นิเจอร์'} ${B('furn|' + id, p.furn ? 'เอาเฟอร์นิเจอร์ออก' : 'จัดเฟอร์นิเจอร์ ' + baht(Math.round(v * 0.03)), { ghost: 1 })}`);
    h += DIM(`🛠️ ปรับปรุงสภาพ ${B('fix|' + id, 'ซ่อมบำรุงใหญ่ ' + baht(Math.round(v * 0.008)) + ' (+15% สภาพ)', { ghost: 1 })}`);
    if (p.hist && p.hist.length) h += '<h5>ประวัติล่าสุด</h5>' + `<table class="tbl">${p.hist.slice(0, 6).map(r => `<tr><td>${fmtD(r.d)}</td><td>${esc(r.t)}</td><td>${r.v ? baht(r.v) : ''}</td></tr>`).join('')}</table>`;
    return h;
  }
  function listingView(id, p, I) {
    const ask = p.ask || marketRent(id), mr = marketRent(id), ratio = ask / mr, prob = demandProb(ratio, id);
    let h = `<h5>📢 ประกาศให้เช่า</h5>` + DIM(`ค่าเช่าที่ตั้ง ${baht(ask)}/เดือน (ตลาด ${baht(mr)} · ${ratio < 0.95 ? 'ถูกกว่าตลาด หาผู้เช่าเร็ว' : ratio > 1.1 ? 'แพงกว่าตลาด หาผู้เช่ายาก' : 'ใกล้เคียงตลาด'}) · คาดว่ามีคนสนใจเฉลี่ยทุก ${prob > 0.01 ? Math.round(1 / prob) : '>100'} วัน`);
    h += `<div class="row">${stepper('rent|' + id, ask)}${B('unlist|' + id, '✖ ยกเลิกประกาศ', { ghost: 1 })}${B('auto|' + id, p.autoRelist ? '🔁 ประกาศใหม่อัตโนมัติ: เปิด' : '🔁 ประกาศใหม่อัตโนมัติ: ปิด', { ghost: 1 })}</div>`;
    const ap = (p.apps || []).filter(a => a.exp >= S.day);
    h += `<h5>ผู้สนใจเช่า (${ap.length})</h5>` + (ap.length ? GR(ap.map(a => C('🙋', `${esc(a.name)} · ${esc(a.job)}`, `รายได้ ${baht(a.inc)}/เดือน ${a.inc >= ask * 2.5 ? '✅ ผ่านเกณฑ์ 2.5 เท่า' : '⚠️ รายได้ต่ำกว่า 2.5 เท่าของค่าเช่า'} · ครอบครัว ${a.fam} คน${a.pets ? ' · 🐶 มีสัตว์เลี้ยง' : ''}<br>ความน่าเชื่อถือ ${a.score}/100 · ${esc(a.ref)} · ตอบก่อน ${fmtD(a.exp)}`, B(`ap.yes|${id}|${a.id}`, '✍️ ทำสัญญาเช่า 12 เดือน') + B(`ap.no|${id}|${a.id}`, 'ปฏิเสธ', { ghost: 1 }))).join('')) : DIM('ยังไม่มีผู้สนใจ รอสักพักหรือปรับค่าเช่าให้ใกล้ราคาตลาด'));
    return h + DIM('ทำสัญญาแล้วรับเงินประกัน 2 เดือน + ค่าเช่าล่วงหน้า 1 เดือน · ค่าเช่าเข้าทุกวันที่ 1 ของเดือน · ผู้เช่าจ่ายค่าน้ำค่าไฟเอง');
  }
  function leaseView(id, p, I) {
    const L = p.lease, mr = marketRent(id);
    let h = `<h5>🔑 สัญญาเช่า</h5>` + DIM(`ผู้เช่า ${esc(L.t.name)} (${esc(L.t.job)}) · ความพอใจ ${L.sat}% · น่าเชื่อถือ ${L.t.score}/100<br>ค่าเช่า ${baht(L.rent)}/เดือน (ตลาด ${baht(mr)}) · เงินประกันที่ถือไว้ ${baht(p.held || 0)} · สัญญา ${fmtD(L.start)} – ${fmtD(L.end)}<br>จ่ายล่าช้า ${L.late} ครั้ง · ค้างค่าเช่า ${baht(L.arrears)}${L.miss ? ' (' + L.miss + ' งวด)' : ''}${L.damage ? ' · ค่าเสียหายที่ตรวจพบ ' + baht(L.damage) : ''}${L.leaving ? `<br>⚠️ ผู้เช่าจะย้ายออก ${fmtD(L.leaving)}` : ''}${L.ev ? `<br>⚖️ ขั้นตอนขับไล่: ${{ notice: 'ส่งหนังสือบอกเลิกแล้ว', refuse: 'ผู้เช่าไม่ยอมออก ต้องฟ้อง', court: 'ฟ้องที่ศาล นัด ' + fmtD(L.ev.hear), evict: 'ศาลสั่งขับไล่' }[L.ev.stage]}` : ''}`);
    const reqs = L.reqs.filter(r => !r.done);
    if (reqs.length) h += '<h5>🛠️ แจ้งซ่อม</h5>' + GR(reqs.map((r, i) => C('🛠️', esc(r.n), `แจ้งเมื่อ ${fmtD(r.day)} · ค่าซ่อม ${baht(r.c)}`, B(`fixreq|${id}|${L.reqs.indexOf(r)}`, 'ซ่อมเลย', { dis: S.money < r.c })) ).join(''));
    if (S.day >= L.end - 30 && L.renewWant && !L.renewOK) { const nr = Math.min(Math.round(L.rent * 1.1), Math.round(mr * 1.05)); h += `<div class="row">${B(`renew|${id}|${L.rent}`, '📝 ต่อสัญญา ราคาเดิม ' + baht(L.rent))}${B(`renew|${id}|${nr}`, '📝 ต่อสัญญา ปรับเป็น ' + baht(nr), { ghost: 1 })}</div>`; }
    if (L.renewOK) h += DIM('✅ ตกลงต่อสัญญาแล้ว มีผลเมื่อสัญญาปัจจุบันครบ');
    h += `<div class="row">${!L.ev ? B('ev.notice|' + id, '⚖️ บอกเลิกสัญญา/ขับไล่', { ghost: 1 }) : ''}${L.ev && L.ev.stage === 'refuse' ? B('ev.court|' + id, '🏛️ ฟ้องขับไล่ (ค่าธรรมเนียม 3,500 ฿)') : ''}${B('ins|' + id, p.ins >= S.day ? '🛡️ ประกันเจ้าของบ้านมีผลถึง ' + fmtD(p.ins) : '🛡️ ซื้อประกันเจ้าของบ้าน', { ghost: 1 })}${B('sale.start|' + id, '🏷️ ประกาศขาย (ผู้เช่าอยู่ต่อได้)', { ghost: 1 })}</div>`;
    return h + DIM('ค่าเช่าที่ได้ถูกนับเป็นรายได้ค่าเช่าในภาษีเงินได้ประจำปี (หักค่าใช้จ่ายเหมา 30%) ดูที่แอปภาษี');
  }
  function saleView(id, p, I) {
    const s = p.sale, val = value(id), c = saleCosts(s.deal ? s.deal.amt : s.ask, govApp(id), S.day - p.acq), m = X().mort.find(q => q.prop === id && q.bal > 0);
    let h = `<h5>🏷️ ประกาศขาย</h5>` + DIM(`ราคาขาย ${baht(s.ask)} (ประเมิน ${baht(val)} · ${s.ask > val * 1.1 ? 'สูงกว่าตลาด ขายยาก' : s.ask < val * 0.95 ? 'ต่ำกว่าตลาด ขายเร็ว' : 'ใกล้ตลาด'}) · ประกาศมา ${s.days || 0} วัน${s.agent ? ' · 🤝 ใช้นายหน้า (3%)' : ''}`);
    h += DIM(`ภาษี/ค่าธรรมเนียมที่ผู้ขายต้องจ่าย (ประมาณ): ค่าโอน ${baht(c.transfer)} · ภาษีธุรกิจเฉพาะ ${baht(c.sbt)} · อากรแสตมป์ ${baht(c.stamp)} · หัก ณ ที่จ่าย ${baht(c.wht)}${m ? ` · ปิดสินเชื่อ ${baht(m.bal)}` : ''}`);
    if (!s.deal) {
      h += `<div class="row">${stepper('ask|' + id, s.ask)}${B('agent|' + id, s.agent ? '🤝 เลิกใช้นายหน้า' : '🤝 ใช้นายหน้า (ค่านายหน้า 3%)', { ghost: 1 })}${B('unsell|' + id, '✖ ยกเลิกประกาศ', { ghost: 1 })}</div>`;
      const of = s.offers || []; h += `<h5>ข้อเสนอซื้อ (${of.length})</h5>` + (of.length ? GR(of.map(o => C('🤝', `${esc(o.buyer)} เสนอ ${baht(o.amt)}`, `${o.mort ? '🏦 ขอสินเชื่อธนาคาร (อนุมัติใน ~' + o.appr + ' วัน)' : '💵 เงินสด'} · ${o.amt >= s.ask * 0.98 ? 'ใกล้ราคาขาย' : 'ต่ำกว่าที่ตั้ง ' + Math.round((1 - o.amt / s.ask) * 100) + '%'}${o.state === 'counter-wait' ? ` · รอตอบราคาต่อรอง ${baht(o.cnt)}` : ''}${o.state === 'agreed' ? ' · ✅ ตกลงราคาแล้ว' : ''}<br>หมดอายุ ${fmtD(o.exp)}`, (o.state === 'new' || o.state === 'agreed' ? B(`of.yes|${id}|${o.id}`, '✅ ตกลงขาย') : '') + (o.state === 'new' ? B(`of.cnt|${id}|${o.id}`, `↩️ ต่อรอง ${baht(rd(Math.max(o.amt * 1.04, s.ask * 0.97), 1000))}`, { ghost: 1 }) : '') + B(`of.no|${id}|${o.id}`, 'ปฏิเสธ', { ghost: 1 }))).join('')) : DIM('ยังไม่มีผู้เสนอซื้อ ปรับราคาให้ใกล้ตลาดหรือใช้นายหน้าเพื่อเร่งขาย'));
    } else {
      const dl = s.deal;
      h += `<h5>🤝 ตกลงขายแล้ว</h5>` + DIM(`ผู้ซื้อ ${esc(dl.buyer)} · ราคา ${baht(dl.amt)} · รับมัดจำแล้ว ${baht(dl.deposit)}<br>${dl.state === 'approval' ? `🏦 รอธนาคารอนุมัติสินเชื่อผู้ซื้อ (~${fmtD(dl.appr)})` : `📅 นัดโอนที่สำนักงานที่ดิน ${fmtD(dl.close)} (ต้องมีบัตรประชาชน+ทะเบียนบ้าน และมาก่อน ${fmtD(dl.close + 3)})`}`);
      if (dl.state === 'ready') h += `<div class="row">${B('close.sell|' + id, '🏛️ ไปโอนกรรมสิทธิ์ที่สำนักงานที่ดิน')}${B('go.land|', '🚕 ไปสำนักงานที่ดิน', { ghost: 1 })}</div>`;
    }
    return h;
  }
  function airView(id, p, I) {
    const a = p.air, mk = airMarket(id);
    let h = `<h5>🛎️ โฮมสเตย์ / เช่ารายวัน</h5>` + DIM(`ราคา ${baht(a.rate)}/คืน (ตลาด ${baht(mk)}) · คะแนนรีวิว ⭐${(a.rating || 4.2).toFixed(2)} (${a.stays || 0} การเข้าพัก) · เดือนนี้รายได้สุทธิ ${baht(a.mrev || 0)} · ค่าธรรมเนียมแพลตฟอร์ม 15% + ค่าทำความสะอาด 300 ฿/ครั้ง<br>คนเข้าพักมากช่วงเสาร์-อาทิตย์ วันหยุด และฤดูหนาว น้อยช่วงฤดูฝน`);
    return h + `<div class="row">${stepper('air|' + id, a.rate)}${B('air.stop|' + id, '✖ เลิกรับแขก', { ghost: 1 })}${B('sale.start|' + id, '🏷️ ประกาศขาย', { ghost: 1 })}</div>`;
  }
  function bizView(id, p, I) {
    const b = p.biz, T = BIZ[b.t];
    let h = `<h5>${T.i} ${esc(b.name)}</h5>`;
    if (T.rentOnly) return h + DIM('ให้เช่าเชิงพาณิชย์ — ใช้ระบบประกาศให้เช่าเหมือนกัน') + `<div class="row">${B('biz.stop|' + id, '✖ เลิก', { ghost: 1 })}</div>`;
    h += DIM(`ราคาขาย ×${b.price.toFixed(2)} · ชื่อเสียง ${Math.round(b.rep || 50)}/100 · สต็อก ${Math.round(b.stock || 0)} หน่วย · พนักงาน ${b.staff || 0} คน (400 ฿/วัน) · ลูกค้ารวม ${b.cust || 0} คน · รายได้รวม ${baht(b.rev || 0)} ต้นทุนรวม ${baht(b.cost || 0)}`);
    h += `<div class="row">${B('biz.stock|' + id + '|100', '📦 ซื้อสต็อก 100 หน่วย ' + baht(Math.round(100 * T.basket * T.cogs * 0.9)))}${B('biz.stock|' + id + '|300', '📦 ซื้อสต็อก 300 หน่วย', { ghost: 1 })}${B('biz.price|' + id + '|-0.1', 'ลดราคา 10%', { ghost: 1 })}${B('biz.price|' + id + '|0.1', 'เพิ่มราคา 10%', { ghost: 1 })}${B('biz.staff|' + id + '|1', '👤 จ้างพนักงาน', { ghost: 1, dis: (b.staff || 0) >= 3 })}${B('biz.staff|' + id + '|-1', 'ลดพนักงาน', { ghost: 1, dis: !(b.staff || 0) })}${B('biz.stop|' + id, '✖ ปิดกิจการ', { ghost: 1 })}</div>`;
    return h + DIM('เปิดร้านถูกกฎหมายต้องมีทะเบียนพาณิชย์ (ร้านอาหารต้องมีใบรับรองสุขาภิบาลอาหาร) กำไรสุทธิเข้ากระเป๋าทุกวัน คนเดินเข้าร้านจริงที่บ้านในหมู่บ้าน');
  }
  // ---- market tab ----
  function marketTab() {
    if (!X().mkt.list.length) refreshMarket();
    const x = X(), L = x.mkt.list.filter(l => !l.deal || l.deal.state !== 'rejected'); let h = DIM(`ตลาดอสังหาฯ อัปเดตทุกสัปดาห์ · ดัชนีราคาในเมืองของคุณ ×${idxOf('village').toFixed(3)} · อัตราดอกเบี้ยบ้านตอนนี้ ${(rateFor() * 100).toFixed(2)}% ต่อปี (ตามเครดิตบูโร)`);
    if (hub.mkt) { const l = lst(hub.mkt); if (l) return h + listingDetail(l); hub.mkt = null; }
    h += GR(L.map(l => C(l.i, esc(l.name), `${esc(cityOf(l.city).n)} · ${PT[l.type][0]}${l.rooms ? ' · ' + l.rooms + ' ห้องนอน' : ''} · ราคาขาย ${baht(l.ask)}<br>${l.insp ? `🔎 ตรวจแล้ว สภาพ ${l.cond}%${l.defects.length ? ' · ' + esc(l.defects.join(', ')) : ' · ไม่พบจุดบกพร่อง'}` : 'ยังไม่ได้ตรวจสภาพ'}${l.deal ? ' · 🤝 กำลังซื้อ' : l.offer ? ' · ยื่นข้อเสนอแล้ว' : ''}`, B('mk.sel|' + l.id, '🔍 ดูรายละเอียด'))).join(''));
    return h;
  }
  function listingDetail(l) {
    const mr = l.type === 'land' ? 0 : rd(l.base * (l.type === 'commercial' ? 0.0075 : 0.0046), 100);
    let h = `<div class="row">${B('mk.sel|', '‹ กลับรายการ', { ghost: 1 })}</div><h5>${l.i} ${esc(l.name)}</h5>` + DIM(`${esc(cityOf(l.city).n)} · ราคาขาย ${baht(l.ask)} · ${l.area} ตร.ม. · ${l.rooms ? l.rooms + ' ห้องนอน · ' : ''}ประกาศถึง ${fmtD(l.exp)}${mr ? ` · ค่าเช่าที่คาด ~${baht(mr)}/เดือน (ผลตอบแทน ~${(mr * 12 / l.ask * 100).toFixed(1)}%/ปี)` : ''}`);
    h += DIM(l.insp ? `🔎 ผลตรวจสภาพ: ${l.cond}% ${l.defects.length ? '· พบ: ' + esc(l.defects.join(', ')) : '· ไม่พบจุดบกพร่อง'} · ประเมินมูลค่าตลาด ~${baht(rd(l.base * (0.82 + l.cond / 100 * 0.22), 10000))}` : 'ยังไม่ได้ตรวจทรัพย์ — นัดดูทรัพย์ 2 ชั่วโมงเพื่อดูสภาพจริงก่อนตัดสินใจ');
    if (!l.insp) h += `<div class="row">${B('mk.insp|' + l.id, '🔎 นัดดูทรัพย์ (ใช้เวลา 2 ชม.)')}</div>`;
    if (!l.offer && !l.deal) h += `<h5>ยื่นข้อเสนอ</h5><div class="row">${[1, 0.95, 0.9, 0.85].map(f => B(`mk.offer|${l.id}|${f}`, `${Math.round(f * 100)}% = ${baht(rd(l.ask * f, 10000))}`, { ghost: f < 1 })).join('')}</div>`;
    const o = l.offer;
    if (o && !l.deal) {
      h += `<h5>ข้อเสนอของคุณ ${baht(o.amt)}</h5>`;
      if (o.state === 'wait') h += DIM(`รอเจ้าของตอบ (~${fmtD(o.resp)})`);
      if (o.state === 'rejected') h += DIM('เจ้าของปฏิเสธ — ยื่นข้อเสนอใหม่ได้') + `<div class="row">${B('mk.reoffer|' + l.id, 'ยื่นใหม่', { ghost: 1 })}</div>`;
      if (o.state === 'counter') h += DIM(`เจ้าของต่อรองที่ ${baht(o.cnt)}`) + `<div class="row">${B('mk.cacc|' + l.id, '✅ ตกลง ' + baht(o.cnt))}${B('mk.reoffer|' + l.id, '✖ ไม่เอา', { ghost: 1 })}</div>`;
      if (o.state === 'accepted') h += financeView(l);
    }
    const dl = l.deal;
    if (dl) {
      h += `<h5>🤝 ซื้อขายแล้ว ${baht(dl.amt)}</h5>` + DIM(`จ่ายมัดจำแล้ว ${baht(dl.deposit)} · ${dl.loan ? `สินเชื่อ ${baht(dl.loan)} ${(dl.rate * 100).toFixed(2)}% ${Math.round(dl.term / 12)} ปี ผ่อน ${baht(dl.pmt)}/เดือน` : 'ชำระเงินสด'}<br>${dl.state === 'approval' ? `🏦 รอธนาคารอนุมัติ ~${fmtD(dl.appr)}` : `📅 นัดโอนที่สำนักงานที่ดิน ${fmtD(dl.close)} (มาก่อน ${fmtD(dl.close + 3)} ไม่งั้นเสียมัดจำ)`}`);
      if (dl.state === 'ready') { const appr = rd(dl.amt * 0.7, 1000), fee = Math.round(appr * 0.01), reg = dl.loan ? Math.min(200000, Math.round(dl.loan * 0.01)) + 3000 : 0; h += DIM(`วันโอนต้องเตรียม ${baht(dl.amt - dl.deposit - dl.loan + fee + reg)} (ส่วนที่เหลือ + ค่าโอนฝั่งผู้ซื้อ 1% ของราคาประเมิน${reg ? ' + ค่าจดจำนอง' : ''})`) + `<div class="row">${B('close.buy|' + l.id, '🏛️ ไปโอนกรรมสิทธิ์')}${B('go.land|', '🚕 ไปสำนักงานที่ดิน', { ghost: 1 })}</div>`; }
    }
    return h;
  }
  function financeView(l) {
    const amt = l.offer.amt, dp = hub.dp, term = hub.term, loan = Math.round(amt * (1 - dp) / 1000) * 1000, rate = rateFor(), pmt = pmtOf(loan, rate, term * 12), deposit = Math.round(amt * 0.03);
    const inc = incomeEst(), dsr = (monthlyDebt() + pmt) / Math.max(1, inc);
    let h = '<h5>วิธีชำระเงิน</h5>' + DIM(`ข้อเสนอที่เจ้าของตกลง ${baht(amt)} · มัดจำ 3% = ${baht(deposit)} จ่ายวันนี้`);
    h += `<div class="row">${B(`mk.cash|${l.id}`, '💵 จ่ายเงินสด ' + baht(amt))}</div>`;
    h += DIM(`🏦 กู้ธนาคาร: เงินดาวน์ ${Math.round(dp * 100)}% (${baht(amt * dp)}) · ${term} ปี · ดอกเบี้ย ${(rate * 100).toFixed(2)}%/ปี → ผ่อน ${baht(pmt)}/เดือน · DSR ${(dsr * 100).toFixed(0)}% ${dsr <= 0.4 ? '✅' : '⚠️ เกิน 40% อาจไม่ผ่านอนุมัติ'}`);
    h += `<div class="row">${[0.1, 0.2, 0.3].map(f => B('mk.dp|' + f, `ดาวน์ ${f * 100}%`, { ghost: hub.dp !== f })).join('')}${[10, 20, 30].map(t => B('mk.term|' + t, `${t} ปี`, { ghost: hub.term !== t })).join('')}${B('mk.mort|' + l.id, '🏦 ขอสินเชื่อ ' + baht(loan))}</div>`;
    return h;
  }
  function mortTab() {
    const L = X().mort, act = L.filter(m => m.bal > 0); let h = DIM(`ผ่อนตัดบัญชีทุกวันที่ 1 ของเดือน (เงินสดก่อน แล้วค่อยหักเงินฝาก) · ค้าง 3 งวดธนาคารส่งหนังสือแจ้ง ค้าง 4 งวดยึดทรัพย์ · ภาระหนี้รวม ${baht(monthlyDebt())}/เดือน`);
    h += act.length ? `<table class="tbl"><tr><th>ทรัพย์</th><th>คงเหลือ</th><th>ผ่อน/เดือน</th><th>ดอกเบี้ย</th><th>ค้าง</th><th></th></tr>${act.map(m => `<tr><td>${esc(info(m.prop).n.slice(0, 22))}</td><td>${baht(m.bal)}</td><td>${baht(m.pmt)}</td><td>${(m.rate * 100).toFixed(2)}%</td><td>${m.miss}</td><td>${B('mort.pay|' + m.id, 'ปิดบัญชี', { ghost: 1, dis: S.money < m.bal })}</td></tr>`).join('')}</table>` : DIM('ยังไม่มีสินเชื่อบ้าน ซื้อทรัพย์ในแท็บตลาดแล้วขอสินเชื่อได้');
    return h;
  }
  function moneyTab() {
    const x = X(); let inc = 0, exp = 0; const rows = [];
    for (const id of ids()) { if (id === 'main') continue; const p = P(id), I = info(id); let r = 0; if (p.lease) r = p.lease.rent; else if (p.air) r = (p.air.mrev || 0); else if (p.biz) r = (p.biz.mrev || 0) - (p.biz.mcost || 0); const m = x.mort.find(q => q.prop === id && q.bal > 0); inc += r; exp += m ? m.pmt : 0; rows.push(`<tr><td>${esc(I.n.slice(0, 24))}</td><td>${statusTxt(id, p).replace(/<[^>]+>/g, '')}</td><td>${baht(r)}</td><td>${m ? baht(m.pmt) : '-'}</td></tr>`); }
    let h = DIM(`รายได้เช่า/ธุรกิจต่อเดือน (โดยประมาณ) ${baht(inc)} · ค่าผ่อนบ้านต่อเดือน ${baht(exp)} · ภาษี/ค่าโอนตอนขายสะสม ${baht(x.tax.sale)}`);
    h += `<table class="tbl"><tr><th>ทรัพย์</th><th>สถานะ</th><th>รายได้/เดือน</th><th>ผ่อน/เดือน</th></tr>${rows.join('') || '<tr><td colspan="4">ยังไม่มีทรัพย์สิน</td></tr>'}</table>`;
    h += DIM(`🧾 ภาษี: ค่าเช่าถูกนับเป็นเงินได้ 40(5) หักค่าใช้จ่ายเหมา 30% ภาษีที่ดินและสิ่งปลูกสร้างคิดรายปีในแอปภาษี ตอนขาย: ค่าโอน 2% ของราคาประเมิน (แบ่งผู้ขายผู้ซื้อคนละ 1%) · ภาษีธุรกิจเฉพาะ 3.3% ถ้าถือครองไม่เกิน 5 ปี (ถ้าเกินเสียอากรแสตมป์ 0.5%) · หัก ณ ที่จ่ายตามปีที่ถือครอง`);
    if (x.log.length) h += '<h5>บันทึกล่าสุด</h5>' + `<table class="tbl">${x.log.slice(0, 12).map(r => `<tr><td>${fmtD(r.d)}</td><td>${esc(r.t)}</td><td>${r.v ? baht(r.v) : ''}</td></tr>`).join('')}</table>`;
    return h;
  }
  function events() {
    const ev = [], d1 = (() => { const t = D(); return Cal36.dayOf(t.m === 11 ? t.y + 1 : t.y, (t.m + 1) % 12, 1); })();
    for (const id of ids()) { const p = X().props[id]; if (!p) continue; const I = info(id);
      if (p.lease) { ev.push({ d: d1, t: `🔑 ค่าเช่า ${I.n} ${baht(p.lease.rent)}` }); ev.push({ d: p.lease.end, t: `📝 สัญญาเช่า ${I.n} ครบกำหนด` }); if (p.lease.leaving) ev.push({ d: p.lease.leaving, t: `🚪 ${p.lease.t.name} ย้ายออก ${I.n}` }); if (p.lease.ev && p.lease.ev.hear) ev.push({ d: p.lease.ev.hear, t: `⚖️ นัดศาล ขับไล่ ${p.lease.t.name}` }); }
      if (p.sale && p.sale.deal && p.sale.deal.close) ev.push({ d: p.sale.deal.close, t: `🏛️ นัดโอนกรรมสิทธิ์ ขาย ${I.n}` });
      if (p.ins >= S.day) ev.push({ d: p.ins, t: `🛡️ ประกัน ${I.n} หมดอายุ` }); }
    for (const l of X().mkt.list) if (l.deal && l.deal.close) ev.push({ d: l.deal.close, t: `🏛️ นัดโอนกรรมสิทธิ์ ซื้อ ${l.name}` });
    if (X().mort.some(m => m.bal > 0)) ev.push({ d: d1, t: `🏦 ผ่อนสินเชื่อบ้าน ${baht(monthlyDebt())}` });
    return ev.filter(e => e.d >= S.day).sort((a, b) => a.d - b.d);
  }
  function calTab() { const ev = events(); return DIM('วันนัดและกำหนดชำระที่เกี่ยวกับอสังหาริมทรัพย์ (รวมในปฏิทินนัดหมายของมือถือถ้ามี)') + (ev.length ? `<table class="tbl">${ev.slice(0, 25).map(e => `<tr><td>${fmtD(e.d)}</td><td>${esc(e.t)}</td><td>${e.d - S.day === 0 ? 'วันนี้' : 'อีก ' + (e.d - S.day) + ' วัน'}</td></tr>`).join('')}</table>` : DIM('ไม่มีกำหนดการ')); }
  const render = t => {
    hub.tab = t;
    if (t === 0) { if (hub.sel && ids().includes(hub.sel)) return detail(hub.sel); hub.sel = null; const L = ids(); const h = DIM(`ทรัพย์สินทั้งหมด ${L.length} รายการ · มูลค่ารวม ${baht(L.reduce((s, id) => s + (id === 'main' ? 0 : value(id)), 0))} (ไม่รวมบ้านหลัก) · ผู้เช่าจ่ายค่าเช่าทุกวันที่ 1 ของเดือน`); return h + GR(L.map(propCard).join('')); }
    if (t === 1) return marketTab(); if (t === 2) return mortTab(); if (t === 3) return moneyTab(); return calTab();
  };
  const openApp = () => UI.open('🏘️ อสังหาริมทรัพย์ของฉัน', TABS, render, { tab: hub.tab, wide: true });
  function openDetail(id, sale) { hub.sel = id; hub.tab = 0; UI.close(); setTimeout(() => { openApp(); if (sale) A['sale.start'](id); try { UI.renderBody(); } catch (e) { } }, 0); }
  const addApp = (id, i, n, fn) => {
    if (!APPS.some(a => a.id === id)) APPS.splice(Math.min(APPS.length, 13), 0, { id, i, n });
    Phone.apps[id] = () => { setTimeout(() => { Phone.app = null; UI.close(); fn(); }, 0); return ''; };
    if (typeof APP_GROUPS !== 'undefined') { const gr = APP_GROUPS.find(x => /บริการ/.test(x[0])) || APP_GROUPS[APP_GROUPS.length - 1]; if (gr && !gr[1].includes(id)) gr[1].unshift(id); }
  };
  addApp('estate39', '🏘️', 'อสังหาริมทรัพย์ของฉัน', openApp);

  // ================= actions =================
  A['sel'] = id => { hub.sel = id || null; };
  A['mk.sel'] = id => { hub.mkt = id ? +id : null; };
  A['listRent'] = id => { const p = P(id), I = info(id); if (I.type === 'land') return; if (!needDocs(['idcard'], 'ประกาศให้เช่า')) return; p.st = 'rent'; p.ask = marketRent(id); p.apps = []; p.vacant = 0; p.sale = p.sale; redraw(id); toast('ประกาศให้เช่าแล้ว รอผู้สนใจ', '📢'); };
  A['unlist'] = id => { const p = P(id); if (p.lease) return; p.st = 'vacant'; p.apps = []; redraw(id); };
  A['auto'] = id => { const p = P(id); p.autoRelist = !p.autoRelist; };
  A['adj'] = (what, id, f) => { const p = P(id), k = +f; if (what === 'rent') { const mr = marketRent(id); p.ask = clamp(rd((p.ask || mr) * (1 + k), 100), Math.round(mr * 0.4), Math.round(mr * 2.5)); redraw(id); } else if (what === 'ask') { const v = value(id); p.sale.ask = clamp(rd(p.sale.ask * (1 + k), 1000), Math.round(v * 0.5), Math.round(v * 2)); redraw(id); } else if (what === 'air') { const mk = airMarket(id); p.air.rate = clamp(rd(p.air.rate * (1 + k), 50), Math.round(mk * 0.4), Math.round(mk * 3)); redraw(id); } };
  A['ap.yes'] = (id, aid) => { const p = P(id), ap = (p.apps || []).find(a => a.id === +aid); if (!ap) return; if (!needDocs(['idcard'], 'ทำสัญญาเช่า')) return; signLease(id, ap); redraw(id); };
  A['ap.no'] = (id, aid) => { const p = P(id); p.apps = (p.apps || []).filter(a => a.id !== +aid); };
  A['fixreq'] = (id, i) => { const p = P(id), L = p.lease, r = L && L.reqs[+i]; if (!r || r.done) return; if (!pay(r.c, `ซ่อม ${r.n} ${info(id).n}`)) return; r.done = true; L.sat = clamp(L.sat + 8, 0, 100); p.cond = clamp(p.cond + 2, 0, 100); toast(`ซ่อม ${r.n} แล้ว ผู้เช่าพอใจขึ้น`, '🛠️'); };
  A['renew'] = (id, nr) => { const L = P(id).lease; if (!L) return; L.renewOK = true; L.newRent = +nr; toast('ตกลงต่อสัญญากับผู้เช่าแล้ว', '📝'); };
  A['ev.notice'] = id => { const p = P(id), L = p.lease; if (!L || L.ev) return; UI.confirm('บอกเลิกสัญญาเช่า', `ส่งหนังสือบอกเลิกสัญญาให้ ${L.t.name} ออกภายใน 15 วัน ถ้าผู้เช่าไม่ยอมออกต้องฟ้องศาล`, 'ส่งหนังสือ', () => { L.ev = { stage: 'notice', until: S.day + 15 }; msg('ผู้เช่า ' + L.t.name, 'ได้รับหนังสือบอกเลิกสัญญาเช่าแล้ว'); try { UI.renderBody(); } catch (e) { } }); };
  A['ev.court'] = id => { const p = P(id), L = p.lease; if (!L || !L.ev || L.ev.stage !== 'refuse') return; if (!pay(3500, 'ค่าธรรมเนียมฟ้องขับไล่')) return; L.ev = { stage: 'court', hear: S.day + Math.round(rnd(30, 50)) }; msg('ศาลจังหวัด', `รับฟ้องขับไล่ ${L.t.name} นัดฟังคำพิพากษา ${fmtD(L.ev.hear)}`); };
  A['ins'] = id => { const p = P(id), v = value(id), pr = Math.max(600, Math.round(v * 0.0012)); if (!pay(pr, `เบี้ยประกันเจ้าของบ้าน ${info(id).n}`)) return; p.ins = Math.max(S.day, p.ins || 0) + 365; p.insNoted = 0; toast(`ซื้อประกันเจ้าของบ้านถึง ${fmtD(p.ins)}`, '🛡️'); };
  A['furn'] = id => { const p = P(id), v = value(id); if (p.furn) { p.furn = false; return; } if (!pay(Math.round(v * 0.03), `เฟอร์นิเจอร์ ${info(id).n}`)) return; p.furn = true; };
  A['fix'] = id => { const p = P(id), v = value(id); if (!pay(Math.round(v * 0.008), `ซ่อมบำรุงใหญ่ ${info(id).n}`)) return; p.cond = clamp(p.cond + 15, 0, 100); toast('ซ่อมบำรุงเรียบร้อย', '🛠️'); };
  // sale
  A['sale.start'] = id => { const p = P(id), I = info(id); if (id === 'main') return; if (!needDocs(['idcard', 'housereg'], 'ประกาศขายอสังหาริมทรัพย์')) return; const m = X().mort.find(q => q.prop === id && q.bal > 0); if (p.air) p.air = null; if (p.biz) p.biz = null; p.sale = { ask: rd(value(id) * 1.05, 1000), offers: [], days: 0, agent: false }; if (m) toast(`ทรัพย์นี้ติดสินเชื่อ ${baht(m.bal)} ราคาขายต้องไม่ต่ำกว่ายอดหนี้ + ภาษี`, '🏦'); p.st = p.lease ? 'rent' : 'sale'; redraw(id); };
  A['unsell'] = id => { const p = P(id); if (p.sale && p.sale.deal) return; p.sale = null; if (p.st === 'sale') p.st = 'vacant'; redraw(id); };
  A['agent'] = id => { const p = P(id); if (p.sale) p.sale.agent = !p.sale.agent; };
  A['of.no'] = (id, oid) => { const p = P(id); if (p.sale) p.sale.offers = p.sale.offers.filter(o => o.id !== +oid); };
  A['of.cnt'] = (id, oid) => { const p = P(id), o = p.sale.offers.find(q => q.id === +oid); if (!o) return; o.cnt = rd(Math.max(o.amt * 1.04, p.sale.ask * 0.97), 1000); o.state = 'counter-wait'; o.resp = S.day + 1; toast(`ส่งราคาต่อรอง ${baht(o.cnt)} ให้ผู้ซื้อแล้ว`, '↩️'); };
  A['of.yes'] = (id, oid) => {
    const p = P(id), I = info(id), o = p.sale.offers.find(q => q.id === +oid); if (!o) return; const m = X().mort.find(q => q.prop === id && q.bal > 0);
    const c = saleCosts(o.amt, govApp(id), S.day - p.acq); if (m && o.amt < m.bal + c.total) { toast('ราคานี้ไม่พอปิดสินเชื่อและภาษี', '⚠️'); return; }
    const dep = Math.round(o.amt * 0.05); S.money += dep; try { Bank2.log(`รับเงินมัดจำซื้อ ${I.n} (ยังไม่ใช่รายได้)`, dep); } catch (e) { }
    p.sale.deal = { buyer: o.buyer, amt: o.amt, deposit: dep, state: o.mort ? 'approval' : 'ready', appr: S.day + o.appr, close: o.mort ? 0 : nextOpenDay('land', S.day + 3) };
    p.sale.offers = []; msg('ผู้ซื้อ ' + o.buyer, `ตกลงซื้อ ${I.n} ราคา ${baht(o.amt)} วางมัดจำ ${baht(dep)}${o.mort ? ' · รอธนาคารอนุมัติสินเชื่อ' : ` · นัดโอน ${fmtD(p.sale.deal.close)}`}`);
  };
  A['close.sell'] = id => closeSale(id);
  A['go.land'] = () => { try { UI.close(); const o = Gov24.hall && Gov24.hall(); if (o && G.player) { toast('สำนักงานที่ดินอยู่ที่ศูนย์ราชการ/ศูนย์รวมบริการภาครัฐ ใช้แท็กซี่ไปได้', '🏛️'); } } catch (e) { } };
  // buy
  A['mk.insp'] = id => { const l = lst(id); if (!l || l.insp) return; try { fade(() => { tick(120); l.insp = true; try { UI.renderBody(); } catch (e) { } }); } catch (e) { tick(120); l.insp = true; } };
  A['mk.offer'] = (id, f) => { const l = lst(id); if (!l || l.deal) return; if (!needDocs(['idcard'], 'ยื่นข้อเสนอซื้อทรัพย์')) return; l.offer = { amt: rd(l.ask * +f, 10000), resp: S.day + 1, state: 'wait' }; toast(`ยื่นข้อเสนอ ${baht(l.offer.amt)} แล้ว เจ้าของตอบพรุ่งนี้`, '🤝'); };
  A['mk.reoffer'] = id => { const l = lst(id); if (l) l.offer = null; };
  A['mk.cacc'] = id => { const l = lst(id); if (!l || !l.offer || l.offer.state !== 'counter') return; l.offer.amt = l.offer.cnt; l.offer.state = 'accepted'; };
  A['mk.dp'] = f => { hub.dp = +f; }; A['mk.term'] = t => { hub.term = +t; };
  A['mk.cash'] = id => { const l = lst(id); if (!l || !l.offer || l.offer.state !== 'accepted') return; const dep = Math.round(l.offer.amt * 0.03); if (!pay(dep, `มัดจำซื้อ ${l.name}`)) return; l.deal = { amt: l.offer.amt, deposit: dep, loan: 0, state: 'ready', close: nextOpenDay('land', S.day + 3) }; msg('ผู้ขาย', `ตกลงขาย ${l.name} ${baht(l.deal.amt)} นัดโอน ${fmtD(l.deal.close)} ที่สำนักงานที่ดิน`); };
  A['mk.mort'] = id => {
    const l = lst(id); if (!l || !l.offer || l.offer.state !== 'accepted') return; const amt = l.offer.amt, loan = Math.round(amt * (1 - hub.dp) / 1000) * 1000, rate = rateFor(), term = hub.term * 12, pmt = pmtOf(loan, rate, term), dep = Math.round(amt * 0.03);
    if (!needDocs(['idcard', 'housereg'], 'ขอสินเชื่อบ้าน')) return; if (!pay(dep, `มัดจำซื้อ ${l.name}`)) return;
    const inc = incomeEst(), dsr = (monthlyDebt() + pmt) / Math.max(1, inc);
    l.deal = { amt, deposit: dep, loan, rate, term, pmt, state: 'approval', appr: S.day + Math.round(rnd(5, 10)), dsrOK: dsr <= 0.4 && (hub.dp >= 0.1) };
    msg('ธนาคารสุขใจ', `รับคำขอสินเชื่อ ${baht(loan)} สำหรับ ${l.name} ผลอนุมัติภายใน ~${fmtD(l.deal.appr)}`);
  };
  A['close.buy'] = id => closeBuy(id);
  A['mort.pay'] = id => { const m = X().mort.find(q => q.id === +id); if (!m || m.bal <= 0 || S.money < m.bal) return; S.money -= m.bal; try { Bank2.log('ปิดสินเชื่อบ้าน', -m.bal); } catch (e) { } m.bal = 0; m.closed = S.day; toast('ปิดสินเชื่อบ้านแล้ว', '🏦'); };
  // guesthouse
  A['air.start'] = id => { const p = P(id); if (!needDocs(['idcard', 'housereg'], 'เปิดโฮมสเตย์')) return; if (!needDocs(['hotel'], 'เปิดโฮมสเตย์ (ต้องมีใบอนุญาตกิจการที่พัก)')) return; p.air = { rate: airMarket(id), rating: 4.2, stays: 0, busy: 0 }; p.st = 'air'; redraw(id); toast('เปิดรับแขกโฮมสเตย์แล้ว', '🛎️'); };
  A['air.stop'] = id => { const p = P(id); p.air = null; p.st = 'vacant'; redraw(id); };
  // own business
  A['biz.menu'] = id => { hub.bizPick = id; };
  A['biz.go'] = (id, t) => {
    const p = P(id), T = BIZ[t], I = info(id); if (!T) return; if (!needDocs(['idcard', 'housereg'], `เปิด${T.n}`)) return; if (T.docs) for (const d of T.docs) if (!needDocs([d], `เปิด${T.n}`)) return;
    if (T.rentOnly) { p.biz = { t, name: T.n }; p.st = 'rent'; p.ask = rd(marketRent(id) * 1.2, 100); p.apps = []; p.vacant = 0; p.biz = null; toast(`ประกาศให้เช่าเชิงพาณิชย์ ${baht(p.ask)}/เดือน`, '📢'); redraw(id); return; }
    p.biz = { t, name: `${T.sign} ${S.name || 'สุขใจ'}`, price: 1, stock: 60, staff: 0, rep: 50, rev: 0, cost: 0, cust: 0 }; p.st = 'biz'; redraw(id); toast(`เปิด${T.n}แล้ว`, T.i);
  };
  A['biz.stock'] = (id, n) => { const p = P(id), b = p.biz, T = b && BIZ[b.t]; if (!b) return; const c = Math.round(+n * T.basket * T.cogs * 0.9); if (!pay(c, `ซื้อสต็อก ${b.name}`)) return; b.stock = (b.stock || 0) + +n; };
  A['biz.price'] = (id, k) => { const b = P(id).biz; if (b) b.price = clamp(+(b.price * (1 + +k)).toFixed(2), 0.7, 1.6); };
  A['biz.staff'] = (id, k) => { const b = P(id).biz; if (b) b.staff = clamp((b.staff || 0) + +k, 0, 3); };
  A['biz.stop'] = id => { const p = P(id); p.biz = null; p.st = 'vacant'; redraw(id); };
  const _detail = detail;
  detail = function (id) { let h = _detail(id); if (hub.bizPick === id) { h += `<h5>เลือกประเภทธุรกิจ</h5>` + GR(Object.entries(BIZ).map(([k, T]) => C(T.i, T.n, T.rentOnly ? 'ประกาศให้เช่าราคาเชิงพาณิชย์ (สูงกว่าบ้านพักอาศัย ~20%)' : `ต้องมี ${T.docs.map(d => (Gov24.docs[d] || {}).n || d).join(' + ')} · ขายของให้ลูกค้าในหมู่บ้านจริง`, B(`biz.go|${id}|${k}`, 'เริ่มเลย'))).join('')); } return h; };


  // the unified appointment calendar (v39_appt) shows every property date: rent days, lease ends, closing dates, court dates, instalments
  try {
    if (window.Appt39 && Appt39.reg) Appt39.reg('estate39', (a, b, out) => {
      for (const e of events()) if (e.d >= a && e.d <= b) { const m = /^(\S+)\s+(.*)$/.exec(e.t) || [0, '🏘️', e.t]; out.push({ c: /นัด|ศาล|โอน/.test(e.t) ? 'gov' : 'money', d: e.d, t: /นัด|โอน/.test(e.t) ? 9 * 60 : null, t2: /นัด|โอน/.test(e.t) ? 15 * 60 : null, i: m[1], n: m[2], x: 'อสังหาริมทรัพย์', app: 'estate39', key: 'est39:' + e.d + ':' + e.t }); }
    });
  } catch (e) { console.warn('v39 estate appt', e); }
  window.Estate39 = { X, ids, info, value, govApp, marketRent, airMarket, saleCosts, whtTax, progTax, pmtOf, rateFor, daily, A, events, refreshMarket, signLease, endLease, closeSale, closeBuy, hub, shock, vis, idxOf, PT };
});
