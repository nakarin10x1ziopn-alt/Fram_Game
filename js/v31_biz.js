'use strict';
// ---------- v31_biz: franchise shops in the villages and cities, with employees, payroll, social security, withholding tax, VAT, rent,
// royalties, inspections, monthly P&L and the exit (close / sell). Everything runs per game day through newDay (so it is independent of the
// clock speed / real Thai time). Documents come from the Gov24 wallet (trade registration, food handler, fire safety, employer registration,
// pharmacy licence). Phone app "🏪 แฟรนไชส์ & ร้านค้า" ----------
V23.add('v31_biz', () => {
  const YD = 84, MO = 28;                                     // a game year = 12 weeks, a "month" = 4 weeks (same as v26)
  const MIN_WAGE = 12000;                                     // full-time minimum per 4-week month (~400 ฿/day x 30)
  const SSO_RATE = 0.05, SSO_BASE = 17500, SSO_CAP = 875, VAT = 0.07, VAT_LIMIT = 1800000;
  const MAX_SHOPS = 6, MAX_STAFF = 8;
  const B31 = () => { const x = S.v31b = S.v31b || {}; if (!x.shops) x.shops = []; if (!x.n) x.n = 0; if (!x.cand) x.cand = {}; if (!x.hist) x.hist = []; if (x.mon === undefined) x.mon = -1; if (!x.fines) x.fines = 0; if (!x.log) x.log = []; return x; };

  // ================= helpers =================
  const msg = (from, t) => { try { Phone.msg(from, t); } catch (e) { } };
  const num = n => Math.round(+n) || 0;
  const pay = (n, label) => { n = num(n); if (n > 0 && S.money < n) { UI.toast(`เงินไม่พอ ต้องใช้ ${baht(n)}`, '💸'); return false; } if (n > 0) { S.money -= n; try { Bank2.log(label, -n); } catch (e) { } } return true; };
  const gain = (n, src) => { n = num(n); if (n > 0) { try { earn(n); } catch (e) { S.money += n; } try { Bank2.income(src, n); } catch (e) { } } };
  const hrOf = () => S.time / 60;
  const dayIdx = () => (S.day - 1) % 7;
  const holiday = () => !!(window.Cal24 && typeof Cal24.isHoliday === 'function' && Cal24.isHoliday(S.day));
  const fest = () => { try { return !!(window.Fest24 && Fest24.today && Fest24.today()); } catch (e) { return false; } };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const monthIdx = () => Math.floor((S.day - 1) / MO);
  const need = (ids, what) => { try { if (window.Agency26 && Agency26.need) return Agency26.need(ids, what); if (window.Gov24) return Gov24.need(ids, what); } catch (e) { } return true; };
  const hasDoc = id => { try { return !!Gov24.has(id); } catch (e) { return true; } };
  const powerOut = () => { try { return Power.st().out > 0; } catch (e) { return false; } };
  const hh = h => `${String(Math.floor(h)).padStart(2, '0')}:00`;
  const ID = () => ++B31().n;

  // ---- new documents that only this system issues (they join the Gov24 wallet so they expire and show like any other paper) ----
  const NEWD = {
    pharmlic: { n: 'ใบอนุญาตขายยาแผนปัจจุบัน (ขย.2)', i: '💊', life: YD, off: 'v31' },
    franchise: { n: 'สัญญาแฟรนไชส์ (มีผลทางกฎหมาย)', i: '📑', life: 0, off: 'v31' },
  };
  try { for (const k in NEWD) if (!Gov24.docs[k]) Gov24.docs[k] = NEWD[k]; } catch (e) { }
  const grantDoc = (id, data) => {
    try { const D = Gov24.docs[id], x = Gov24.st(); x.n = (x.n || 0) + 1; x.docs[id] = { no: `${id.slice(0, 3).toUpperCase()}-${String(S.day).padStart(4, '0')}-${String(x.n).padStart(3, '0')}`, issued: S.day, exp: D.life ? (window.DocRules ? DocRules.expFor(id, x.docs[id]) : S.day + D.life) : 0, data: data || {} }; UI.toast(`${D.i} ได้รับ${D.n}แล้ว`, '✅'); msg('หน่วยงานรัฐ', `ออก${D.n} เลขที่ ${x.docs[id].no} ${D.life ? `ใช้ได้ถึง${RD(x.docs[id].exp)}` : ''}`); } catch (e) { console.warn('v31 grant', e); }
  };

  // ================= the franchise brands (fictional, real-life shaped) =================
  // fee = franchise fee, fit = fit-out/equipment, roy = royalty % of sales, cogs = cost of goods % of sales, base = customers/day in a medium city,
  // tkt = average ticket, cap = customers one full-time staffer can serve a day, minOn = people needed on shift, docs = papers the shop needs to trade
  const BR = {
    conv: { n: 'มินิมาร์ทสุขใจ 24 ชม.', i: '🏪', fee: 350000, fit: 450000, roy: 4, cogs: 74, base: 130, tkt: 68, cap: 90, minOn: 2, setup: 10, docs: ['idcard', 'commreg', 'firecert'], roles: ['cashier'], wk: 1.05, hol: 1.1, heat: 1.05, rain: 0.95, util: 520, rent: 1.0, fest: 1.15 },
    cafe: { n: 'บีนส์แอนด์บลูม คาเฟ่', i: '☕', fee: 220000, fit: 380000, roy: 5, cogs: 36, base: 95, tkt: 92, cap: 55, minOn: 2, setup: 9, docs: ['idcard', 'commreg', 'foodsan'], roles: ['cashier', 'cook'], wk: 1.3, hol: 1.35, heat: 1.1, rain: 0.9, util: 420, rent: 1.0, fest: 1.2 },
    thai: { n: 'ครัวบ้านทุ่ง ตามสั่ง', i: '🍛', fee: 120000, fit: 220000, roy: 3, cogs: 42, base: 105, tkt: 72, cap: 60, minOn: 2, setup: 8, docs: ['idcard', 'commreg', 'foodsan'], roles: ['cook', 'cashier'], wk: 1.0, hol: 1.1, heat: 0.95, rain: 1.12, util: 480, rent: 0.9, fest: 1.25 },
    tea: { n: 'ชานมไข่มุก มุกมุก', i: '🧋', fee: 90000, fit: 160000, roy: 6, cogs: 33, base: 120, tkt: 58, cap: 80, minOn: 1, setup: 6, docs: ['idcard', 'commreg', 'foodsan'], roles: ['cashier'], wk: 1.25, hol: 1.3, heat: 1.35, rain: 0.8, util: 300, rent: 0.8, fest: 1.2 },
    bake: { n: 'เบเกอรี่ขนมหอม', i: '🥐', fee: 180000, fit: 330000, roy: 5, cogs: 40, base: 80, tkt: 110, cap: 50, minOn: 2, setup: 9, docs: ['idcard', 'commreg', 'foodsan', 'foodprod'], roles: ['cook', 'cashier'], wk: 1.2, hol: 1.35, heat: 0.95, rain: 1.0, util: 560, rent: 0.95, fest: 1.3 },
    phone: { n: 'ซ่อมมือถือ เร็วดี', i: '📱', fee: 80000, fit: 140000, roy: 3, cogs: 48, base: 24, tkt: 520, cap: 22, minOn: 1, setup: 6, docs: ['idcard', 'commreg'], roles: ['tech'], wk: 0.95, hol: 0.8, heat: 1.0, rain: 1.05, util: 260, rent: 0.7, fest: 0.9 },
    pharm: { n: 'ร้านยาใกล้บ้าน', i: '💊', fee: 260000, fit: 520000, roy: 4, cogs: 66, base: 62, tkt: 190, cap: 45, minOn: 1, setup: 14, docs: ['idcard', 'commreg', 'pharmlic'], roles: ['cashier', 'pharmacist'], pharm: 1, wk: 0.9, hol: 0.85, heat: 1.0, rain: 1.15, util: 380, rent: 1.0, fest: 0.9 },
    wash: { n: 'ซักอบรีดทันใจ', i: '🧺', fee: 100000, fit: 280000, roy: 3, cogs: 22, base: 42, tkt: 175, cap: 45, minOn: 1, setup: 8, docs: ['idcard', 'commreg'], roles: ['cashier'], wk: 0.95, hol: 0.9, heat: 0.95, rain: 1.2, util: 900, rent: 0.8, fest: 0.9 },
    fit: { n: 'ฟิตเนสฟิตเฟิร์ม', i: '🏋️', fee: 300000, fit: 800000, roy: 5, cogs: 14, base: 48, tkt: 160, cap: 70, minOn: 1, setup: 15, docs: ['idcard', 'commreg', 'firecert'], roles: ['cashier', 'tech'], wk: 1.3, hol: 1.3, heat: 0.9, rain: 1.15, util: 1100, rent: 1.4, fest: 0.9 },
    agri: { n: 'ร้านเกษตรสุขใจ', i: '🌾', fee: 140000, fit: 260000, roy: 3, cogs: 68, base: 36, tkt: 360, cap: 40, minOn: 1, setup: 8, docs: ['idcard', 'commreg'], roles: ['cashier', 'tech'], wk: 0.95, hol: 0.8, heat: 0.95, rain: 0.8, util: 300, rent: 0.85, fest: 0.9 },
  };
  const ROLE = {
    cashier: { n: 'พนักงานขาย/แคชเชียร์', i: '🧾', w: 12000 },
    cook: { n: 'พ่อครัว/พนักงานครัว', i: '🧑‍🍳', w: 15000 },
    tech: { n: 'ช่าง/เทรนเนอร์', i: '🛠️', w: 16000 },
    pharmacist: { n: 'เภสัชกรผู้มีหน้าที่ปฏิบัติการ', i: '⚕️', w: 45000 },
    manager: { n: 'ผู้จัดการร้าน', i: '🧑‍💼', w: 26000 },
  };
  const SIZE = { large: { k: 1.6, rent: 26000, u: 1.3, n: 'เมืองใหญ่' }, medium: { k: 1.1, rent: 15000, u: 1.0, n: 'เมืองกลาง' }, small: { k: 0.65, rent: 8000, u: 0.8, n: 'เมืองเล็ก' }, village: { k: 0.8, rent: 10000, u: 0.85, n: 'หมู่บ้าน' } };
  const NAMES = ['สมชาย', 'สมหญิง', 'มาลี', 'ประเสริฐ', 'วิไล', 'ธนากร', 'พิมพ์ชนก', 'อนุชา', 'กมลา', 'สุรชัย', 'นภา', 'ปรีชา', 'ศิริพร', 'วรากร', 'จันทร์เพ็ญ', 'เกรียงไกร', 'อรทัย', 'ชัยวัฒน์', 'รัตนา', 'ณัฐพล', 'สุดารัตน์', 'วีระ', 'ปวีณา', 'พงศกร'];
  const SURN = ['ใจดี', 'แสนสุข', 'รักษา', 'มั่นคง', 'บุญมา', 'ทองดี', 'ศรีสุข', 'วงศ์ไทย', 'สายสุวรรณ', 'เพชรรัตน์'];

  const locs = () => {
    const out = [{ key: 'home', n: 'หมู่บ้านสุขใจ (ตลาดกลางหมู่บ้าน)', i: '🏡', size: 'village', visited: true }];
    try { for (const c of V25.cityList()) out.push({ key: c.key, n: c.n, i: c.icon, size: c.size, visited: !!c.visited, fee: c.fee }); } catch (e) { }
    return out;
  };
  const locOf = k => locs().find(l => l.key === k) || { key: k, n: k, i: '🏙️', size: 'medium', visited: true };
  const shopById = id => B31().shops.find(s => s.id == id);
  const live = () => B31().shops.filter(s => s.st !== 'gone');

  // ================= tax helpers (Thai rules, simplified) =================
  const taxAnnual = net => { net = Math.max(0, net); let t = 0, prev = 0; for (const [cap, r] of [[150000, 0], [300000, .05], [500000, .1], [750000, .15], [1000000, .2], [2000000, .25], [5000000, .3], [Infinity, .35]]) { const x = Math.min(net, cap) - prev; if (x <= 0) break; t += x * r; prev = cap; } return Math.round(t); };
  // withholding tax on one employee's monthly wage (an annual projection, 50% expense capped 100,000 + 60,000 personal + the SSO paid)
  const whtMonthly = wage => { const yr = wage * 12, ded = Math.min(yr * 0.5, 100000) + 60000 + Math.min(wage, SSO_BASE) * SSO_RATE * 12; return Math.round(taxAnnual(yr - ded) / 12); };
  const ssoOf = wage => Math.min(SSO_CAP, Math.round(Math.min(wage, SSO_BASE) * SSO_RATE));
  const sevDays = svc => svc >= 7300 ? 400 : svc >= 3650 ? 300 : svc >= 2190 ? 240 : svc >= 1095 ? 180 : svc >= 365 ? 90 : svc >= 120 ? 30 : 0;          // Labour Protection Act: 120 days / 1 yr / 3 yrs
  const sevPay = (st, sh) => Math.round(st.wage / 30 * sevDays(S.day - st.hired));

  // ================= shop lifecycle =================
  const emptyM = () => ({ rev: 0, cogs: 0, wage: 0, sso: 0, wht: 0, rent: 0, util: 0, roy: 0, mkt: 0, vat: 0, tax: 0, other: 0, cust: 0, days: 0, lost: 0 });
  const missing = sh => {                                         // what the shop still needs before it may open / trade
    const T = BR[sh.brand], out = [];
    for (const d of T.docs) if (!hasDoc(d)) { const D = Gov24.docs[d]; out.push(`${D ? D.i : '📄'} ${D ? D.n : d}`); }
    if (T.pharm && !sh.staff.some(s => s.role === 'pharmacist')) out.push('⚕️ ต้องจ้างเภสัชกรประจำร้าน');
    return out;
  };
  const buyFranchise = (brand, locKey) => {
    const T = BR[brand], L = locOf(locKey), z = SIZE[L.size] || SIZE.medium, b = B31();
    if (!T) return;
    if (live().length >= MAX_SHOPS) { UI.toast(`เปิดร้านได้สูงสุด ${MAX_SHOPS} สาขา`, '🏪'); return; }
    if (live().some(s => s.brand === brand && s.loc === locKey)) { UI.toast('มีสาขาแบรนด์นี้ในทำเลนี้แล้ว (เจ้าของแฟรนไชส์ไม่อนุญาตให้ซ้อนทำเล)', '📑'); return; }
    if (!L.visited) { UI.toast(`ต้องไปดูทำเลที่${L.n}ก่อน (กดปุ่ม "ไปดูทำเล")`, '🗺️'); return; }
    if (!need(['idcard', 'commreg'], `ซื้อแฟรนไชส์ ${T.n}`)) return;
    const rent = Math.round(z.rent * T.rent / 100) * 100, dep = rent * 3, total = T.fee + T.fit + dep;
    if (!pay(total, `แฟรนไชส์ ${T.n}: ค่าสิทธิ + ตกแต่ง + มัดจำเช่า`)) return;
    const sh = { id: ID(), brand, loc: locKey, name: `${T.n} สาขา${L.n.replace(/^.*?(?=[ก-๙])/, '').split(' ')[0]}`, st: 'setup', setup: S.day + T.setup, bought: S.day, term: S.day + 3 * YD, cash: 0, rent, dep, staff: [], hours: 'std', price: 1, mkt: 0, rep: 50, morale: 60, stock: 1, auto: 1, m: emptyM(), hist: [], ytd: { rev: 0, net: 0 }, insp: S.day + num(rnd(24, 40)), warn: 0, closeDays: 0, unpaid: 0, last: null, svcTot: 0 };
    b.shops.push(sh);
    grantDoc('franchise', { shop: sh.id, brand });
    msg('เจ้าของแฟรนไชส์', `ยินดีต้อนรับ! ${T.n} (${L.n}) สัญญา 3 ปี ค่าสิทธิ ${baht(T.fee)} ค่ารอยัลตี้ ${T.roy}% ของยอดขาย · ร้านจะพร้อม${RD(sh.setup)} (ตกแต่งและอบรมระบบ)`);
    UI.toast(`เซ็นสัญญาแฟรนไชส์ ${T.n} แล้ว ร้านพร้อม${RD(sh.setup)}`, T.i);
  };
  const openShop = sh => {
    const T = BR[sh.brand], miss = missing(sh);
    if (miss.length) return false;
    if (T.roles.length && sh.staff.length < T.minOn) return false;
    sh.st = 'open'; sh.open = sh.open || S.day; sh.m = emptyM(); sh.ytd = sh.ytd || { rev: 0, net: 0 };
    msg('แฟรนไชส์', `${sh.name} เปิดให้บริการแล้ว! เปิด ${hh(HRS[sh.hours][0])}–${hh(HRS[sh.hours][1])} น.`);
    UI.toast(`${T.i} ${sh.name} เปิดแล้ว`, '🎉');
    return true;
  };
  const HRS = { short: [9, 18, 9], std: [8, 20, 12], long: [6, 22, 16] };

  // ================= staff =================
  const marketWage = (role, skill) => Math.max(role === 'pharmacist' ? 40000 : MIN_WAGE, Math.round(ROLE[role].w * (0.88 + 0.06 * skill) / 100) * 100);
  const genCand = (role) => {
    const sk = role === 'pharmacist' ? 3 + Math.floor(Math.random() * 3) : 1 + Math.floor(Math.random() * 4);
    const full = Math.random() < 0.8, w = marketWage(role, sk);
    return { cid: ID(), name: `${pick(NAMES)} ${pick(SURN)}`, role, skill: sk, type: full ? 'full' : 'part', ask: full ? w : Math.max(6500, Math.round(w * 0.55 / 100) * 100), age: 19 + Math.floor(Math.random() * 30), day: S.day };
  };
  const cands = (shopId, role) => { const b = B31(), k = shopId + ':' + role; const c = b.cand[k]; if (!c || S.day - c.day > 7 || !c.list.length) b.cand[k] = { day: S.day, list: [genCand(role), genCand(role), genCand(role), genCand(role)] }; return b.cand[k].list; };
  const hire = (shopId, cid, role) => {
    const sh = shopById(shopId); if (!sh || sh.st === 'gone') return;
    if (sh.staff.length >= MAX_STAFF) { UI.toast(`ร้านนี้จ้างได้สูงสุด ${MAX_STAFF} คน`, '👥'); return; }
    if (!need(['idcard', 'employer'], 'จ้างพนักงาน')) return;
    const k = shopId + ':' + role, c = (B31().cand[k] || { list: [] }).list.find(x => x.cid == cid); if (!c) return;
    if (role === 'manager' && sh.staff.some(s => s.role === 'manager')) { UI.toast('มีผู้จัดการร้านแล้ว', '👥'); return; }
    const mw = c.type === 'full' ? MIN_WAGE : Math.round(MIN_WAGE * 0.5); if (c.ask < mw) c.ask = mw;
    const st = { id: ID(), name: c.name, role: c.role, skill: c.skill, type: c.type, wage: c.ask, hired: S.day, prob: S.day + MO, morale: 70, unpaid: 0, trained: 0, bonus: 0, age: c.age };
    sh.staff.push(st); B31().cand[k].list = B31().cand[k].list.filter(x => x.cid != cid);
    try { Pets2 && 0; } catch (e) { }
    msg('ระบบบุคคล', `จ้าง ${st.name} เป็น${ROLE[role].n} เงินเดือน ${baht(st.wage)} (${st.type === 'full' ? 'เต็มเวลา' : 'พาร์ทไทม์'}) ทดลองงานถึง${RD(st.prob)} · ต้องส่งประกันสังคมเดือนละ ${baht(ssoOf(st.wage))} ทั้งสองฝ่าย`);
    UI.toast(`จ้าง ${st.name} แล้ว`, ROLE[role].i);
    if (sh.st === 'setup' && S.day >= sh.setup) openShop(sh);
  };
  const dismiss = (sh, st, why) => {
    const sev = why === 'quit' ? 0 : (S.day <= st.prob ? 0 : sevPay(st, sh));
    sh.staff = sh.staff.filter(x => x.id !== st.id);
    if (sev > 0) { if (sh.cash >= sev) sh.cash -= sev; else if (!pay(sev - Math.max(0, sh.cash), `ค่าชดเชยเลิกจ้าง ${st.name}`)) { st.unpaid += sev; B31().fines += 0; } else sh.cash = 0; sh.m.other += sev; }
    return sev;
  };
  const hireOpts = {};
  const wageNow = sh => sh.staff.reduce((t, s) => t + s.wage, 0);

  // ================= daily simulation of one shop =================
  const demandOf = (sh) => {
    const T = BR[sh.brand], L = locOf(sh.loc), z = SIZE[L.size] || SIZE.medium, wk = dayIdx() >= 5, hol = holiday();
    let d = T.base * z.k;
    if (wk || hol) d *= hol ? T.hol : T.wk;
    if (fest()) d *= T.fest;
    const w = S.weather && S.weather.type, sea = (typeof season === 'function' && season().id) || '';
    if (w === 'storm') d *= 0.55; else if (w === 'rain') d *= T.rain; else if (w === 'fog') d *= 0.92;
    if (sea === 'hot') d *= T.heat; else if (sea === 'cool') d *= 2 - T.heat;
    d *= 0.55 + sh.rep / 110;                                                 // reputation 0..100 -> x0.55..1.46
    d *= Math.pow(clamp(sh.price, 0.7, 1.4), -1.5);                           // price elasticity
    d *= 1 + 0.07 * sh.mkt;
    const dup = live().filter(o => o !== sh && o.loc === sh.loc && o.st === 'open' && BR[o.brand].roles.join() === T.roles.join() && o.brand !== sh.brand).length;
    d *= Math.pow(0.9, dup);                                                  // another of your own shops in the same town takes some of the walk-ins
    if (powerOut()) d *= sh.gen ? 1 : 0.5;
    return d * rnd(0.88, 1.12);
  };
  const dayShop = sh => {
    const T = BR[sh.brand], m = sh.m, hrs = HRS[sh.hours];
    if (sh.st === 'setup') { if (S.day >= sh.setup) { if (!openShop(sh) && !sh.msgSetup) { sh.msgSetup = 1; msg('แฟรนไชส์', `${sh.name} ตกแต่งเสร็จแล้ว แต่ยังเปิดไม่ได้: ${missing(sh).join(', ') || 'ต้องจ้างพนักงานขั้นต่ำ ' + T.minOn + ' คน'} (ดูแท็บ 🏪 ร้านของฉัน)`); } } return; }
    if (sh.st !== 'open') return;
    if (sh.closeDays > 0) { sh.closeDays--; m.days++; m.lost++; sh.last = { cust: 0, rev: 0, note: 'ถูกสั่งปิดชั่วคราว' }; if (sh.closeDays === 0) msg('แฟรนไชส์', `${sh.name} เปิดทำการต่อได้แล้ว`); return; }
    // probation ends, morale drift, quitting
    for (const st of sh.staff.slice()) {
      const mw = marketWage(st.role, st.skill);
      let dm = (st.wage >= mw ? 0.6 : -1.2) + (sh.morale > 60 ? 0.3 : -0.2) - (st.unpaid > 0 ? 6 : 0) - (sh.staff.length > 0 && coverage(sh) < 0.8 ? 1.2 : 0) + (sh.owner === S.day ? 0.8 : 0);
      st.morale = clamp(st.morale + dm, 0, 100);
      if (S.day === st.prob + 1) msg('ระบบบุคคล', `${st.name} ผ่านทดลองงานแล้ว (ถ้าเลิกจ้างต่อไปจะต้องจ่ายค่าชดเชยตามกฎหมาย)`);
      if (st.morale < 30 && Math.random() < 0.1) { dismiss(sh, st, 'quit'); msg('ระบบบุคคล', `${st.name} (${ROLE[st.role].n}) ลาออก เพราะ${st.unpaid > 0 ? 'ค้างจ่ายเงินเดือน' : 'ขวัญกำลังใจต่ำ/ค่าจ้างต่ำกว่าตลาด'} · ต้องจ้างคนใหม่`); }
    }
    sh.morale = sh.staff.length ? Math.round(sh.staff.reduce((t, s) => t + s.morale, 0) / sh.staff.length) : 50;
    // is it allowed to trade today?
    const miss = missing(sh);
    if (miss.length) {                                              // inspectors close a shop that has lost a required paper
      if (!sh.warn) { sh.warn = S.day + 7; msg('เทศกิจ/สาธารณสุข', `${sh.name}: ขาดเอกสาร ${miss.join(', ')} ให้เวลา 7 วัน มิฉะนั้นสั่งปิด`); }
      else if (S.day > sh.warn) { sh.closeDays = 3; sh.warn = 0; sh.m.other += 0; msg('เทศกิจ/สาธารณสุข', `${sh.name} ถูกสั่งปิด 3 วัน เพราะยังขาดเอกสาร: ${miss.join(', ')}`); return; }
    } else sh.warn = 0;
    const cov = coverage(sh), openFrac = Math.min(1, cov);
    const dem = demandOf(sh) * openFrac;
    const skillAvg = sh.staff.length ? sh.staff.reduce((t, s) => t + s.skill * (0.5 + s.morale / 100), 0) / sh.staff.length : 1;
    let capTot = 0; for (const s of sh.staff) capTot += T.cap * (0.7 + 0.1 * s.skill) * (s.type === 'full' ? 1 : 0.5) * (0.6 + s.morale / 250);
    if (sh.owner === S.day) capTot += T.cap * 0.7;
    const served = Math.max(0, Math.min(dem, capTot * Math.min(1.25, 1 + (cov - 1) * 0.2)));
    const lost = Math.max(0, dem - served);
    const rev = served * T.tkt * sh.price * rnd(0.93, 1.07) * (1 + (skillAvg - 2.5) * 0.02);
    const cogs = rev * (T.cogs / 100) * (sh.stock < 0.9 ? 1.04 : 1) / Math.max(0.85, sh.price) * Math.min(1, sh.price + 0.02) * (sh.price < 1 ? 1 : 1);
    const util = T.util * (SIZE[locOf(sh.loc).size] || SIZE.medium).u * (hrs[2] / 12) * rnd(0.9, 1.1);
    sh.cash += rev - cogs - util;
    m.rev += rev; m.cogs += cogs; m.util += util; m.cust += served; m.days++; m.lost += lost;
    sh.ytd.rev += rev;
    // reputation moves towards what customers feel: skilled, happy, enough staff, fair price, no empty shelves
    const target = clamp(38 + skillAvg * 9 + sh.morale * 0.18 + (cov >= 1 ? 6 : -12 * (1 - cov)) - Math.max(0, sh.price - 1) * 40 + (sh.price < 0.95 ? 4 : 0) + (lost > served * 0.4 ? -6 : 0) + (sh.mkt * 1.5), 5, 98);
    sh.rep = clamp(sh.rep + (target - sh.rep) * 0.06, 0, 100);
    sh.last = { cust: Math.round(served), lost: Math.round(lost), rev: Math.round(rev), cov: +cov.toFixed(2), note: '' };
    // inspections
    if (S.day >= sh.insp) inspect(sh);
  };
  const coverage = sh => {
    const T = BR[sh.brand], hrs = HRS[sh.hours];
    let h = 0; for (const s of sh.staff) h += (s.type === 'full' ? 8 : 4) * (6 / 7);
    if (sh.owner === S.day) h += 6;
    return h / (hrs[2] * T.minOn);
  };
  const inspect = sh => {
    const T = BR[sh.brand]; sh.insp = S.day + num(rnd(26, 42));
    const miss = missing(sh), probs = [];
    if (miss.length) probs.push(['ขาดเอกสาร', 3000 + miss.length * 2500]);
    if (sh.staff.length && !sh.staff.every(s => s.wage >= (s.type === 'full' ? MIN_WAGE : MIN_WAGE * 0.5))) probs.push(['จ่ายค่าจ้างต่ำกว่าอัตราขั้นต่ำ', 15000]);
    if (sh.price > 1.25 && /conv|pharm/.test(sh.brand)) probs.push(['ตั้งราคาสินค้าสูงเกินสมควร', 5000]);
    if (sh.staff.some(s => s.unpaid > 0)) probs.push(['ค้างจ่ายค่าจ้างลูกจ้าง', 10000]);
    if (!probs.length) { sh.rep = clamp(sh.rep + 3, 0, 100); msg('เจ้าหน้าที่ตรวจร้าน', `${sh.name}: ผ่านการตรวจ ไม่พบข้อบกพร่อง ✅ ชื่อเสียง +3`); return; }
    const fine = probs.reduce((t, p) => t + p[1], 0);
    if (!sh.warnedInsp) { sh.warnedInsp = 1; msg('เจ้าหน้าที่ตรวจร้าน', `${sh.name}: พบข้อบกพร่อง (${probs.map(p => p[0]).join(', ')}) ตักเตือนครั้งแรก ให้แก้ไขภายใน 14 วัน`); sh.insp = S.day + 14; return; }
    sh.warnedInsp = 0; B31().fines += fine;
    if (sh.cash >= fine) sh.cash -= fine; else { const rest = fine - Math.max(0, sh.cash); sh.cash = Math.min(0, sh.cash); if (!pay(rest, `ค่าปรับ ${sh.name}`)) S.money = 0; }
    sh.m.other += fine; sh.rep = clamp(sh.rep - 6, 0, 100);
    msg('เจ้าหน้าที่ตรวจร้าน', `${sh.name}: ปรับ ${baht(fine)} (${probs.map(p => p[0]).join(', ')}) ชื่อเสียง −6`);
  };

  // ---- monthly close: payroll + SSO + withholding tax, rent, royalty, marketing, VAT, P&L history ----
  const topUp = (sh, amt) => { if (sh.cash >= amt) return true; if (!sh.auto) return false; const x = Math.ceil(amt - sh.cash); if (S.money < x) return false; S.money -= x; sh.cash += x; try { Bank2.log(`เติมเงินหมุนเวียน ${sh.name}`, -x); } catch (e) { } return true; };
  const monthClose = sh => {
    const T = BR[sh.brand], m = sh.m; if (sh.st !== 'open' && sh.st !== 'setup') return;
    const L = locOf(sh.loc);
    // payroll
    let gross = 0, sso = 0, wht = 0, ssoEmp = 0, net = 0;
    for (const s of sh.staff) { const e = ssoOf(s.wage), w = whtMonthly(s.wage); gross += s.wage; sso += e; ssoEmp += e; wht += w; net += s.wage - e - w; }
    const payTotal = net + sso + ssoEmp + wht;                                 // wages paid net + employee SSO + employer SSO + tax to the revenue office
    const rent = sh.rent, roy = Math.round(m.rev * T.roy / 100), mktC = [0, 3000, 8000, 15000][sh.mkt];
    // value-added tax: registered when a year's sales pass 1.8 M
    const regVat = sh.ytd.rev > VAT_LIMIT || sh.vat;
    if (regVat && !sh.vat) { sh.vat = 1; msg('กรมสรรพากร', `${sh.name}: รายได้สะสมเกิน ${baht(VAT_LIMIT)} ต้องจดทะเบียนภาษีมูลค่าเพิ่ม ราคาขายรวม VAT 7% แล้ว ยื่น ภ.พ.30 ทุกเดือน`); }
    const vat = regVat ? Math.round((m.rev - m.cogs - m.util - rent) * VAT / (1 + VAT)) : 0;
    const total = payTotal + rent + roy + mktC + Math.max(0, vat);
    const okPay = topUp(sh, total);
    if (okPay) {
      sh.cash -= total; sh.unpaid = 0; for (const s of sh.staff) s.unpaid = 0;
      if (vat < 0) sh.cash += -vat;
      m.wage = gross; m.sso = ssoEmp; m.wht = wht; m.rent = rent; m.roy = roy; m.mkt = mktC; m.vat = vat;
    } else {                                                                   // not enough money: staff get paid first (law), the rest is late
      sh.unpaid++; const wagesOnly = net + sso + ssoEmp + wht;
      if (topUp(sh, wagesOnly)) { sh.cash -= wagesOnly; for (const s of sh.staff) s.unpaid = 0; m.wage = gross; m.sso = ssoEmp; m.wht = wht; }
      else { for (const s of sh.staff) { s.unpaid++; s.morale = clamp(s.morale - 15, 0, 100); } msg('ระบบบุคคล', `${sh.name}: เงินไม่พอจ่ายเงินเดือน! ลูกจ้างจะร้องเรียนสวัสดิการแรงงานและลาออก`); }
      m.other += Math.round((rent + roy) * 0.02);                                // late fee on rent/royalty
      if (sh.unpaid >= 2) { terminateFranchise(sh, 'ค้างชำระค่าเช่า/รอยัลตี้ 2 เดือนติด'); return; }
      msg('แฟรนไชส์', `${sh.name}: ค้างชำระค่าเช่า ${baht(rent)} และรอยัลตี้ ${baht(roy)} (เสียค่าปรับ 2%) ถ้าค้างอีกเดือนจะถูกยกเลิกสัญญา`);
    }
    const profit = m.rev - m.cogs - m.util - m.wage - m.sso - m.rent - m.roy - m.mkt - Math.max(0, m.vat) - m.other;
    m.net = Math.round(profit); sh.ytd.net += profit;
    sh.hist.unshift(Object.assign({}, m, { mon: monthIdx(), net: m.net })); sh.hist.length = Math.min(sh.hist.length, 8);
    msg('รายงานร้านค้า', `${sh.name}: เดือนนี้ลูกค้า ${num(m.cust)} คน ยอดขาย ${baht(num(m.rev))} กำไรสุทธิ ${m.net >= 0 ? '' : '−'}${baht(Math.abs(m.net))} (ชื่อเสียง ${Math.round(sh.rep)}/100)`);
    sh.m = emptyM();
  };
  const terminateFranchise = (sh, why) => {
    msg('เจ้าของแฟรนไชส์', `ยกเลิกสัญญาแฟรนไชส์ ${sh.name}: ${why} · ริบเงินมัดจำและอุปกรณ์`);
    for (const s of sh.staff.slice()) dismiss(sh, s, 'franchise');
    sh.st = 'gone'; sh.end = S.day; sh.cash = 0; try { delete Gov24.st().docs.franchise; } catch (e) { }
  };
  const yearClose = () => {                                                    // income tax on the shops' profit (sole proprietor, progressive rates)
    const b = B31(); const net = live().reduce((t, s) => t + (s.ytd ? s.ytd.net : 0), 0);
    if (net <= 0) { for (const s of live()) if (s.ytd) { s.ytd.net = 0; s.ytd.rev = 0; } return; }
    const tax = taxAnnual(net - 60000);
    if (tax > 0) { if (!pay(tax, 'ภาษีเงินได้จากกำไรร้านค้า (ภ.ง.ด.90)')) { b.fines += Math.round(tax * 0.2); S.money = Math.max(0, S.money); } msg('กรมสรรพากร', `ภาษีเงินได้จากกำไรร้านค้าปีนี้: กำไรสุทธิ ${baht(Math.round(net))} → ภาษี ${baht(tax)} (หักลดหย่อนส่วนตัว 60,000)`); }
    for (const s of live()) if (s.ytd) { s.ytd.net = 0; s.ytd.rev = 0; }
  };

  // ================= phone app =================
  const hub = { tab: 0, sel: 0, hire: null };
  const B = (act, label, o = {}) => `<button class="btn ${o.ghost ? 'ghost' : ''}" data-a="v31b" data-v="${esc(act)}"${o.dis ? ' disabled' : ''}>${label}</button>`;
  const C = (i, h, p, btns = '') => `<div class="card"><div class="ci">${i}</div><div class="cb"><h4>${h}</h4><p class="dim">${p}</p>${btns ? `<div class="row">${btns}</div>` : ''}</div></div>`;
  const GR = x => `<div class="grid">${x}</div>`;
  const LEAD = t => `<p class="lead">${t}</p>`;
  const DIM = t => `<p class="dim">${t}</p>`;
  const TABS = ['🏪 ร้านของฉัน', '📑 ซื้อแฟรนไชส์', '👥 พนักงาน', '📊 การเงิน & ภาษี'];
  const A = {};
  UI.H.v31b = d => { const [k, ...r] = String(d.v || '').split('|'); const f = A[k]; if (f) { try { f(...r); } catch (e) { if (e && e.spend173) throw e; console.warn('v31b', k, e); } try { if (UI.cur && UI.cur.render) UI.renderBody(); } catch (e) { } } };
  const stars = r => '⭐'.repeat(Math.max(1, Math.round(r / 20))) + ` ${Math.round(r)}`;
  const shopCard = sh => {
    const T = BR[sh.brand], L = locOf(sh.loc), miss = missing(sh);
    const stTxt = sh.st === 'setup' ? `🔧 กำลังตกแต่ง (พร้อม${RD(sh.setup)})${S.day >= sh.setup ? ' · รอเอกสาร/พนักงานครบ' : ''}` : sh.closeDays > 0 ? `⛔ ถูกสั่งปิด อีก ${sh.closeDays} วัน` : sh.st === 'open' ? '🟢 เปิดให้บริการ' : '⚫ ปิดแล้ว';
    const l = sh.last ? `เมื่อวาน ลูกค้า ${sh.last.cust} คน${sh.last.lost ? ` (ตกหล่น ${sh.last.lost})` : ''} · ${baht(sh.last.rev)} · ความพร้อมพนักงาน ${Math.round((sh.last.cov || 0) * 100)}%` : 'ยังไม่มีข้อมูลยอดขาย';
    return C(T.i, esc(sh.name), `${L.i} ${esc(L.n)} · ${stTxt}<br>ชื่อเสียง ${stars(sh.rep)} · ขวัญกำลังใจพนักงาน ${sh.morale}% · เงินสดในร้าน ${baht(num(sh.cash))}<br>${l}${miss.length ? `<br>⚠️ ต้องมี: ${miss.join(' · ')}` : ''}`,
      B('shop.sel|' + sh.id, '🔍 จัดการร้าน', { ghost: 0 }));
  };
  const shopView = sh => {
    const T = BR[sh.brand], L = locOf(sh.loc), z = SIZE[L.size] || SIZE.medium, hrs = HRS[sh.hours];
    const m = sh.m, openDays = Math.max(1, m.days), staffRows = sh.staff.map(s => `<tr><td>${ROLE[s.role].i} ${esc(s.name)}</td><td>${ROLE[s.role].n}${s.type === 'part' ? ' (พาร์ทไทม์)' : ''}</td><td>ทักษะ ${s.skill}/5</td><td>${baht(s.wage)}</td><td>${Math.round(s.morale)}%${s.unpaid ? ' ⚠️ค้างจ่าย' : ''}</td><td>${S.day <= s.prob ? 'ทดลองงาน' : 'ประจำ'}</td></tr>`).join('');
    return `<div class="row">${B('shop.back', '‹ กลับรายการร้าน', { ghost: 1 })}</div><h5>${T.i} ${esc(sh.name)}</h5>` + DIM(`${L.i} ${esc(L.n)} (${z.n}) · ค่าเช่า ${baht(sh.rent)}/เดือน · มัดจำ ${baht(sh.dep)} · สัญญาถึง${RD(sh.term)} · รอยัลตี้ ${T.roy}% · ตรวจร้านครั้งถัดไปราว${RD(sh.insp)}`) +
      GR(
        C('⚙️', 'ตั้งค่าร้าน', `เวลาเปิด ${hh(hrs[0])}–${hh(hrs[1])} (ต้องมีพนักงานครอบคลุม ${hrs[2]} ชม. × ${T.minOn} คน) · ระดับราคา ×${sh.price.toFixed(2)} · การตลาดระดับ ${sh.mkt}`,
          ['short', 'std', 'long'].map(k => B('shop.hours|' + sh.id + '|' + k, `${hh(HRS[k][0])}–${hh(HRS[k][1])}`, { ghost: sh.hours !== k })).join('') + B('shop.price|' + sh.id + '|-0.05', 'ลดราคา 5%', { ghost: 1, dis: sh.price <= 0.75 }) + B('shop.price|' + sh.id + '|0.05', 'ขึ้นราคา 5%', { ghost: 1, dis: sh.price >= 1.35 }) + [0, 1, 2, 3].map(k => B('shop.mkt|' + sh.id + '|' + k, ['ไม่โฆษณา', 'ป้ายไวนิล 3,000', 'โซเชียล 8,000', 'ทั้งสื่อ 15,000'][k], { ghost: sh.mkt !== k })).join('')),
        C('💵', 'เงินสดของร้าน', `เงินในร้าน ${baht(num(sh.cash))} · ${sh.auto ? 'เติมเงินหมุนเวียนจากกระเป๋าอัตโนมัติเมื่อไม่พอจ่าย' : 'ปิดการเติมอัตโนมัติ (ระวังค้างจ่าย)'}`,
          B('shop.wd|' + sh.id + '|10000', 'ถอน 10,000', { ghost: 1, dis: sh.cash < 10000 }) + B('shop.wd|' + sh.id + '|all', 'ถอนทั้งหมด', { ghost: 1, dis: sh.cash <= 0 }) + B('shop.dep|' + sh.id + '|20000', 'ฝาก 20,000', { ghost: 1, dis: S.money < 20000 }) + B('shop.auto|' + sh.id, sh.auto ? 'ปิดเติมอัตโนมัติ' : 'เปิดเติมอัตโนมัติ', { ghost: 1 })),
        C('🧑‍🍳', 'ลงมือช่วยที่ร้าน', `เจ้าของลงกะวันนี้ ช่วยขายและเพิ่มกำลังบริการ (เหนื่อย −25 พลังงาน ใช้เวลา 4 ชม.)${sh.owner === S.day ? ' · วันนี้ลงกะแล้ว' : ''}`, B('shop.work|' + sh.id, 'ลงกะวันนี้', { dis: sh.st !== 'open' || sh.owner === S.day || S.energy < 25 })),
        C('📋', 'ใบอนุญาต/เอกสารของร้าน', `ต้องมี: ${T.docs.map(d => { const D = Gov24.docs[d]; return (hasDoc(d) ? '✅' : '❌') + ' ' + (D ? D.n : d); }).join(' · ')}`,
          (T.pharm ? B('lic.pharm|' + sh.id, 'ขอ/ต่อใบอนุญาตขายยา (5,000฿)', { dis: !sh.staff.some(s => s.role === 'pharmacist') }) : '') + B('shop.renew|' + sh.id, 'ต่อสัญญาแฟรนไชส์', { ghost: 1, dis: sh.term - S.day > 28 || sh.st === 'gone' }))
      ) + `<h5>👥 พนักงานในร้าน (${sh.staff.length}/${MAX_STAFF})</h5>` + (sh.staff.length ? `<table class="tbl"><tr><th>ชื่อ</th><th>ตำแหน่ง</th><th>ทักษะ</th><th>เงินเดือน</th><th>ขวัญ</th><th>สถานะ</th></tr>${staffRows}</table>` : DIM('ยังไม่มีพนักงาน — ไปแท็บ 👥 พนักงาน เพื่อจ้าง (ต้องมีทะเบียนนายจ้าง)')) +
      `<div class="row">${B('hub.tab|2', '👥 ไปจ้าง/จัดการพนักงาน')}${B('shop.sell|' + sh.id, '💰 ขายกิจการ', { ghost: 1 })}${B('shop.close|' + sh.id, '🚪 เลิกกิจการ', { ghost: 1 })}</div>` +
      DIM(`เดือนนี้ (${openDays} วันที่เปิด): ยอดขาย ${baht(num(m.rev))} · ต้นทุนสินค้า ${baht(num(m.cogs))} · ค่าน้ำไฟ ${baht(num(m.util))} · ลูกค้า ${num(m.cust)} คน`);
  };
  const render = t => {
    hub.tab = t; const b = B31();
    if (t === 0) {
      const sh = shopById(hub.sel);
      if (sh && sh.st !== 'gone') return shopView(sh);
      const L = live();
      return LEAD(`ร้านค้าแฟรนไชส์ของคุณ ${L.length}/${MAX_SHOPS} สาขา · เจ้าของแฟรนไชส์เก็บรอยัลตี้ทุกเดือน · พนักงานต้องส่งประกันสังคม 5% (เพดาน ${baht(SSO_CAP)}) และหักภาษี ณ ที่จ่าย`) + (L.length ? GR(L.map(shopCard).join('')) : DIM('ยังไม่มีร้านค้า ไปแท็บ 📑 ซื้อแฟรนไชส์ เพื่อเปิดสาขาแรก (ต้องมีบัตรประชาชนและทะเบียนพาณิชย์)'));
    }
    if (t === 1) {
      const ls = locs(), h = hub.loc || 'home', Lc = locOf(h), z = SIZE[Lc.size] || SIZE.medium;
      return LEAD('เลือกทำเล แล้วเลือกแบรนด์แฟรนไชส์ · ค่าสิทธิ + ค่าตกแต่ง + มัดจำค่าเช่า 3 เดือน จ่ายครั้งเดียว · ร้านเปิดได้เมื่อเอกสารและพนักงานครบ') +
        `<div class="row">${ls.map(l => B('hub.loc|' + l.key, `${l.i} ${esc(l.n.split(' ')[0])}${l.visited ? '' : ' 🔒'}`, { ghost: h !== l.key })).join('')}</div>` +
        DIM(`ทำเล: ${Lc.i} ${esc(Lc.n)} (${z.n}) · คนเดินผ่าน ×${z.k} · ค่าเช่าเริ่มต้นราว ${baht(z.rent)}/เดือน`) +
        (Lc.visited ? '' : `<div class="row">${B('loc.go|' + Lc.key, `🚕 ไปดูทำเลที่${esc(Lc.n)} (${baht(Lc.fee || 0)})`)}</div>`) +
        GR(Object.entries(BR).map(([k, T]) => { const rent = Math.round(z.rent * T.rent / 100) * 100, tot = T.fee + T.fit + rent * 3, ex = live().some(s => s.brand === k && s.loc === h); return C(T.i, esc(T.n), `ค่าสิทธิ ${baht(T.fee)} · ตกแต่ง ${baht(T.fit)} · เช่า ${baht(rent)}/เดือน (มัดจำ 3 เดือน) · รอยัลตี้ ${T.roy}%<br>รวมจ่ายวันเซ็นสัญญา ${baht(tot)} · ต้องมี: ${T.docs.map(d => (Gov24.docs[d] || { n: d }).n).join(', ')}${T.pharm ? ' + เภสัชกรประจำ' : ''}<br>ลูกค้าโดยประมาณ ${Math.round(T.base * z.k)} คน/วัน · ราคาเฉลี่ย ${baht(T.tkt)}/ราย · ต้นทุนสินค้า ${T.cogs}%`, B('fr.buy|' + k + '|' + h, 'ซื้อแฟรนไชส์', { dis: ex || S.money < tot || live().length >= MAX_SHOPS })); }).join(''));
    }
    if (t === 2) {
      const L = live().filter(s => s.st !== 'gone');
      if (!L.length) return DIM('ยังไม่มีร้านที่จะจ้างพนักงาน');
      const sh = shopById(hub.hireShop) && shopById(hub.hireShop).st !== 'gone' ? shopById(hub.hireShop) : L[0], roles = Object.keys(ROLE);
      const role = hub.role && ROLE[hub.role] ? hub.role : (BR[sh.brand].roles[0]);
      const cl = cands(sh.id, role), employer = hasDoc('employer');
      return LEAD(`จ้างพนักงาน: ต้องมี 🪪 บัตรประชาชน + 🏭 ทะเบียนนายจ้าง (สปส.1-03) จากหน่วยงานเพิ่มเติม · ค่าจ้างเต็มเวลาไม่ต่ำกว่า ${baht(MIN_WAGE)}/เดือน · ทดลองงาน 4 สัปดาห์ · เลิกจ้างหลังผ่านทดลองต้องจ่ายค่าชดเชย (30/90/180 วัน ตามอายุงาน)`) + (employer ? '' : DIM('⚠️ ยังไม่มีทะเบียนนายจ้าง — ขอได้ที่แอป 🏛️ หน่วยงานเพิ่มเติม › 1111 + คุ้มครองแรงงาน')) +
        `<div class="row">${L.map(s => B('hub.hs|' + s.id, `${BR[s.brand].i} ${esc(locOf(s.loc).n.split(' ')[0])}`, { ghost: sh.id !== s.id })).join('')}</div><div class="row">${roles.map(r => B('hub.role|' + r, `${ROLE[r].i} ${ROLE[r].n.split('/')[0]}`, { ghost: role !== r })).join('')}${B('hub.refresh|' + sh.id + '|' + role, '🔄 ประกาศรับสมัครใหม่', { ghost: 1 })}</div>` +
        `<h5>ผู้สมัคร: ${ROLE[role].n} → ${esc(sh.name)}</h5>` + GR(cl.map(c => C(ROLE[role].i, `${esc(c.name)} (${c.age} ปี)`, `ทักษะ ${c.skill}/5 · ${c.type === 'full' ? 'เต็มเวลา' : 'พาร์ทไทม์'} · ขอ ${baht(c.ask)}/เดือน<br>ค่าประกันสังคมฝ่ายนายจ้าง ${baht(ssoOf(c.ask))}/เดือน`, B('hire.do|' + sh.id + '|' + c.cid + '|' + role, 'จ้างงาน', { dis: sh.staff.length >= MAX_STAFF }))).join('')) +
        (sh.staff.length ? `<h5>จัดการพนักงานปัจจุบัน</h5>` + GR(sh.staff.map(s => C(ROLE[s.role].i, `${esc(s.name)} · ${ROLE[s.role].n}`, `เงินเดือน ${baht(s.wage)} · ทักษะ ${s.skill}/5 · ขวัญ ${Math.round(s.morale)}% · ${S.day <= s.prob ? 'ทดลองงานถึง' + RD(s.prob) : 'พนักงานประจำ'}<br>ถ้าเลิกจ้างตอนนี้ ค่าชดเชย ${baht(S.day <= s.prob ? 0 : sevPay(s, sh))}`, B('st.raise|' + sh.id + '|' + s.id, 'ขึ้นเงินเดือน 8%', { ghost: 1 }) + B('st.bonus|' + sh.id + '|' + s.id, `โบนัส ${baht(Math.round(s.wage * 0.5))}`, { ghost: 1, dis: S.money < s.wage * 0.5 }) + B('st.train|' + sh.id + '|' + s.id, 'ส่งอบรม 2,500', { ghost: 1, dis: s.skill >= 5 || S.money < 2500 }) + B('st.fire|' + sh.id + '|' + s.id, 'เลิกจ้าง', { ghost: 1 }))).join('')) : '');
    }
    // finance
    const L = live(); let cash = 0, ytdNet = 0, ytdRev = 0, monthly = 0;
    for (const s of L) { cash += s.cash; ytdNet += s.ytd.net; ytdRev += s.ytd.rev; monthly += s.hist[0] ? s.hist[0].net : 0; }
    const rows = L.map(s => { const h = s.hist[0]; return `<tr><td>${BR[s.brand].i} ${esc(s.name.slice(0, 22))}</td><td>${h ? baht(num(h.rev)) : '-'}</td><td>${h ? baht(num(h.cogs)) : '-'}</td><td>${h ? baht(num(h.wage + h.sso)) : '-'}</td><td>${h ? baht(num(h.rent + h.roy)) : '-'}</td><td>${h ? baht(num(h.util + h.mkt + h.other)) : '-'}</td><td>${h ? baht(num(Math.max(0, h.vat))) : '-'}</td><td><b>${h ? (h.net >= 0 ? '' : '−') + baht(Math.abs(h.net)) : '-'}</b></td></tr>`; }).join('');
    return LEAD(`งบรายเดือนของร้านทั้งหมด · ปิดบัญชีทุก 28 วัน · กำไรสุทธิเดือนล่าสุด ${monthly >= 0 ? '' : '−'}${baht(Math.abs(monthly))} · เงินสดในร้าน ${baht(num(cash))}`) +
      (L.length ? `<table class="tbl"><tr><th>ร้าน</th><th>ยอดขาย</th><th>ต้นทุน</th><th>ค่าจ้าง+ปส.</th><th>เช่า+รอยัลตี้</th><th>อื่นๆ</th><th>VAT</th><th>กำไร</th></tr>${rows}</table>` : DIM('ยังไม่มีงบ')) +
      GR(
        C('🧾', 'ภาษีที่เกี่ยวข้อง', `ยอดขายสะสมปีนี้ ${baht(num(ytdRev))} · กำไรสะสม ${baht(num(ytdNet))} · ประมาณการภาษีเงินได้ปีนี้ ${baht(taxAnnual(ytdNet - 60000))}<br>ภาษีมูลค่าเพิ่ม 7% จดเมื่อยอดขายเกิน ${baht(VAT_LIMIT)} · ภาษีหัก ณ ที่จ่ายและประกันสังคมจ่ายทุกสิ้นเดือน · ค่าปรับสะสม ${baht(B31().fines)}`),
        C('📑', 'สัญญาแฟรนไชส์', L.length ? L.map(s => `${BR[s.brand].i} ${esc(s.name.slice(0, 24))}: ถึง${RD(s.term)}`).join('<br>') : 'ยังไม่มีสัญญา')
      ) + (L.some(s => s.hist.length > 1) ? `<h5>แนวโน้มกำไร 6 เดือนล่าสุด</h5>` + L.filter(s => s.hist.length).map(s => DIM(`${BR[s.brand].i} ${esc(s.name.slice(0, 22))}: ` + s.hist.slice(0, 6).map(h => (h.net >= 0 ? '+' : '−') + Math.round(Math.abs(h.net) / 1000) + 'k').join(' · '))).join('') : '');
  };
  A['hub.tab'] = t => { hub.tab = +t; UI.close(); setTimeout(open, 0); };
  A['hub.loc'] = k => { hub.loc = k; };
  A['hub.hs'] = id => { hub.hireShop = +id; };
  A['hub.role'] = r => { hub.role = r; };
  A['hub.refresh'] = (id, r) => { delete B31().cand[id + ':' + r]; };
  A['shop.sel'] = id => { hub.sel = +id; };
  A['shop.back'] = () => { hub.sel = 0; };
  A['loc.go'] = k => { UI.close(); try { UI.H.v25go({ v: k }); } catch (e) { UI.toast('ไปไม่ได้', '🚕'); } };
  A['fr.buy'] = (k, l) => buyFranchise(k, l);
  A['shop.hours'] = (id, k) => { const s = shopById(id); if (s && HRS[k]) { s.hours = k; UI.toast(`เปลี่ยนเวลาเปิดเป็น ${hh(HRS[k][0])}–${hh(HRS[k][1])}`, '🕒'); } };
  A['shop.price'] = (id, d) => { const s = shopById(id); if (s) s.price = clamp(Math.round((s.price + +d) * 100) / 100, 0.7, 1.4); };
  A['shop.mkt'] = (id, k) => { const s = shopById(id); if (s) { s.mkt = +k; UI.toast(`ตั้งงบการตลาดระดับ ${k} (หักตอนปิดงบเดือน)`, '📣'); } };
  A['shop.wd'] = (id, v) => { const s = shopById(id); if (!s) return; const n = v === 'all' ? Math.floor(s.cash) : Math.min(+v, Math.floor(s.cash)); if (n <= 0) return; s.cash -= n; gain(n, `ถอนเงินจากร้าน ${s.name}`); };
  A['shop.dep'] = (id, v) => { const s = shopById(id); if (!s || !pay(+v, `ฝากเงินหมุนเวียนร้าน ${s.name}`)) return; s.cash += +v; };
  A['shop.auto'] = id => { const s = shopById(id); if (s) s.auto = s.auto ? 0 : 1; };
  A['shop.work'] = id => { const s = shopById(id); if (!s || s.st !== 'open' || s.owner === S.day) return; if (S.energy < 25) { UI.toast('เหนื่อยเกินไป', '😮‍💨'); return; } UI.close(); fade(() => { try { tick(240); } catch (e) { } S.energy = Math.max(0, S.energy - 25); s.owner = S.day; s.morale = clamp(s.morale + 2, 0, 100); try { Prog.add(6); } catch (e) { } UI.toast(`ช่วยงานที่ ${s.name} 4 ชั่วโมง ลูกน้องสบายใจขึ้น`, '🧑‍🍳'); saveGame(true); setTimeout(open, 600); }); };
  A['shop.renew'] = id => { const s = shopById(id), T = s && BR[s.brand]; if (!s || s.term - S.day > 28) return; const fee = Math.round(T.fee * 0.2); if (!pay(fee, `ต่อสัญญาแฟรนไชส์ ${s.name}`)) return; s.term += 3 * YD; msg('เจ้าของแฟรนไชส์', `ต่อสัญญา ${s.name} อีก 3 ปี ค่าต่อสัญญา ${baht(fee)}`); };
  A['lic.pharm'] = id => { const s = shopById(id); if (!s || !s.staff.some(x => x.role === 'pharmacist')) { UI.toast('ต้องมีเภสัชกรประจำร้าน', '💊'); return; } if (!need(['idcard', 'commreg'], 'ขอใบอนุญาตขายยา')) return; if (!pay(5000, 'ค่าธรรมเนียมใบอนุญาตขายยา (ขย.2)')) return; UI.close(); fade(() => { try { tick(180); } catch (e) { } grantDoc('pharmlic', { shop: s.id, pharmacist: s.staff.find(x => x.role === 'pharmacist').name }); if (s.st === 'setup' && S.day >= s.setup) openShop(s); saveGame(true); setTimeout(open, 600); }); };
  A['hire.do'] = (sid, cid, role) => hire(sid, cid, role);
  A['st.raise'] = (sid, stid) => { const s = shopById(sid), p = s && s.staff.find(x => x.id == stid); if (!p) return; p.wage = Math.round(p.wage * 1.08 / 100) * 100; p.morale = clamp(p.morale + 12, 0, 100); UI.toast(`ขึ้นเงินเดือน ${p.name} เป็น ${baht(p.wage)}`, '📈'); };
  A['st.bonus'] = (sid, stid) => { const s = shopById(sid), p = s && s.staff.find(x => x.id == stid); if (!p) return; const n = Math.round(p.wage * 0.5); if (!pay(n, `โบนัสพนักงาน ${p.name}`)) return; p.morale = clamp(p.morale + 15, 0, 100); p.bonus = S.day; UI.toast(`จ่ายโบนัส ${p.name} ${baht(n)}`, '🎁'); };
  A['st.train'] = (sid, stid) => { const s = shopById(sid), p = s && s.staff.find(x => x.id == stid); if (!p || p.skill >= 5) return; if (!pay(2500, `ค่าอบรม ${p.name}`)) return; p.skill++; p.morale = clamp(p.morale + 6, 0, 100); UI.toast(`${p.name} ผ่านการอบรม ทักษะเป็น ${p.skill}/5`, '🎓'); };
  A['st.fire'] = (sid, stid) => { const s = shopById(sid), p = s && s.staff.find(x => x.id == stid); if (!p) return; const sev = S.day <= p.prob ? 0 : sevPay(p, s);
    UI.confirm ? UI.confirm('เลิกจ้างพนักงาน', `เลิกจ้าง ${p.name}? ${sev ? `ต้องจ่ายค่าชดเชยตามกฎหมายแรงงาน ${baht(sev)}` : 'ยังอยู่ในช่วงทดลองงาน ไม่ต้องจ่ายค่าชดเชย'}`, 'เลิกจ้าง', () => { const r = dismiss(s, p, 'fire'); msg('ระบบบุคคล', `เลิกจ้าง ${p.name} จ่ายค่าชดเชย ${baht(r)} และออกหนังสือรับรองการทำงาน`); UI.toast(`เลิกจ้าง ${p.name} แล้ว`, '👋'); open(); }) : (dismiss(s, p, 'fire'), 0); };
  A['shop.close'] = id => { const s = shopById(id); if (!s) return; const sev = s.staff.reduce((t, p) => t + (S.day <= p.prob ? 0 : sevPay(p, s)), 0), pen = Math.round(BR[s.brand].fee * 0.25 * Math.max(0, (s.term - S.day)) / (3 * YD));
    const go = () => { if (!pay(pen, `ค่าปรับเลิกสัญญาแฟรนไชส์ ${s.name}`)) return; for (const p of s.staff.slice()) dismiss(s, p, 'close'); gain(Math.max(0, Math.floor(s.cash)) + s.dep, `เลิกกิจการ ${s.name}: เงินสดในร้าน + คืนมัดจำ`); s.st = 'gone'; s.end = S.day; hub.sel = 0; try { delete Gov24.st().docs.franchise; } catch (e) { } msg('เจ้าของแฟรนไชส์', `ยกเลิกสัญญา ${s.name} เรียบร้อย ค่าปรับเลิกสัญญา ${baht(pen)} คืนมัดจำ ${baht(s.dep)}`); UI.toast('เลิกกิจการแล้ว', '🚪'); open(); };
    UI.confirm ? UI.confirm('เลิกกิจการ', `เลิกกิจการ ${s.name}: ค่าชดเชยพนักงานรวม ${baht(sev)} · ค่าปรับเลิกสัญญาก่อนกำหนด ${baht(pen)} · คืนมัดจำ ${baht(s.dep)} + เงินสดในร้าน`, 'เลิกกิจการ', go) : go(); };
  A['shop.sell'] = id => { const s = shopById(id); if (!s) return; const T = BR[s.brand], avg = s.hist.length ? s.hist.slice(0, 3).reduce((t, h) => t + h.net, 0) / Math.min(3, s.hist.length) : 0, val = Math.max(Math.round(T.fit * 0.4), Math.round(Math.max(0, avg) * 8 + T.fit * 0.4)), apr = Math.round(T.fee * 0.05), net = val - apr;
    const go = () => { for (const p of s.staff.slice()) dismiss(s, p, 'sell'); gain(net + s.dep + Math.max(0, Math.floor(s.cash)), `ขายกิจการ ${s.name}`); s.st = 'gone'; s.end = S.day; hub.sel = 0; try { delete Gov24.st().docs.franchise; } catch (e) { } msg('เจ้าของแฟรนไชส์', `โอนสิทธิ์ ${s.name} ให้ผู้ซื้อใหม่ ราคา ${baht(val)} หักค่าอนุมัติโอนสิทธิ์ ${baht(apr)}`); UI.toast('ขายกิจการแล้ว', '💰'); open(); };
    UI.confirm ? UI.confirm('ขายกิจการ', `ผู้ซื้อเสนอ ${baht(val)} (กำไร 3 เดือนล่าสุด × 8 + มูลค่าอุปกรณ์) หักค่าอนุมัติโอนสิทธิ์ ${baht(apr)} · คืนมัดจำ ${baht(s.dep)} + เงินสดในร้าน`, 'ขาย', go) : go(); };

  const open = () => UI.open('🏪 แฟรนไชส์ & ร้านค้า', TABS, render, { tab: hub.tab, wide: true });
  const addApp = (id, i, n, fn) => {
    if (!APPS.some(a => a.id === id)) APPS.splice(Math.min(APPS.length, 13), 0, { id, i, n });
    Phone.apps[id] = () => { setTimeout(() => { Phone.app = null; UI.close(); fn(); }, 0); return ''; };
    if (typeof APP_GROUPS !== 'undefined') { const gr = APP_GROUPS.find(x => /บริการ/.test(x[0])) || APP_GROUPS[APP_GROUPS.length - 1]; if (gr && !gr[1].includes(id)) gr[1].unshift(id); }
  };
  addApp('biz31', '🏪', 'แฟรนไชส์ & ร้านค้า', open);

  // ================= daily / monthly / yearly processing =================
  const daily = () => {
    const b = B31();
    for (const sh of b.shops) { if (sh.st === 'gone') continue; try { dayShop(sh); } catch (e) { console.warn('v31 shop', e); } }
    if ((S.day - 1) % MO === MO - 1 || (S.day % MO === 0)) {             // closing day of a 4-week month
      if (b.mon !== monthIdx()) { b.mon = monthIdx(); for (const sh of b.shops) { if (sh.st === 'gone') continue; try { monthClose(sh); } catch (e) { console.warn('v31 month', e); } } }
    }
    if (S.day % YD === 0 && b.yr !== Math.floor(S.day / YD)) { b.yr = Math.floor(S.day / YD); try { yearClose(); } catch (e) { console.warn('v31 year', e); } }
    for (const sh of b.shops) if (sh.st === 'gone' && sh.end < S.day - 120) sh.pruned = 1;
    b.shops = b.shops.filter(s => !s.pruned);
    if (b.shops.length && Math.random() < 0.02) { const s = pick(b.shops.filter(x => x.st === 'open')); if (s) { const ev = pick([['ลูกค้าชมร้านในโซเชียล', 3], ['ลูกค้าร้องเรียนบริการช้า', -3], ['มีรีวิวดีจากอินฟลูเอนเซอร์', 5]]); s.rep = clamp(s.rep + ev[1], 0, 100); msg('ร้านค้า', `${s.name}: ${ev[0]} (ชื่อเสียง ${ev[1] > 0 ? '+' : ''}${ev[1]})`); } }
  };
  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { daily(); } catch (e) { console.warn('v31 biz daily', e); } return r; }; }
  window.Biz31 = { open, st: B31, BR, ROLE, shops: live, buy: buyFranchise, hire, daily, missing, openShop, taxAnnual, whtMonthly, ssoOf, sevDays, cands, locs, monthClose, demandOf, coverage };
});
