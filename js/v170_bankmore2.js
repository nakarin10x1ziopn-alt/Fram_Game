'use strict';
// ---------- v170_bankmore2: FX, special accounts, bank drafts, statements & tax certificates, ATM extras, scams, bank events, banker offers ----------
//  * FX: 5 currencies, rates move day to day, buy/sell spread, a foreign-currency wallet with profit/loss
//  * SPECIAL ACCOUNTS: high-yield savings (4 withdrawals a month), retirement deposit (locked, early withdrawal forfeits interest), goal jars with monthly auto-saving + bonus
//  * BANK DRAFTS: issue to a payee, hand over, redeem or cancel (fee), expire after 168 days
//  * MONTHLY STATEMENT + 50 ทวิ (withholding tax certificate for the year's interest)
//  * ATM EXTRAS: interbank transfer, bill payment, mobile top-up
//  * SCAMS (SMS phishing, fake police call, "bank staff" asking for OTP, card fraud + dispute) - can be switched off
//  * BANK EVENTS: app outage (app / PromptPay payments blocked), ATM out of cash
//  * BANKER OFFERS each month: intro rate, free FX fees, double goal bonus, tips
V23.add('v170_bankmore2', () => {
  const B = window.Bank49; if (!B || typeof UI === 'undefined' || typeof Bank2 === 'undefined' || typeof Cal36 === 'undefined') return;
  const E = s => (typeof esc === 'function' ? esc(String(s == null ? '' : s)) : String(s == null ? '' : s));
  const bS = n => (typeof baht === 'function' ? baht(Math.round(n)) : '฿' + Math.round(n));
  const toast = (t, i) => { try { UI.toast(t, i || '🏦'); } catch (e) { } };
  const msg = (t, good, quiet) => { try { Phone.msg('ธนาคารสุขใจ', t, quiet === undefined ? !!good : quiet); } catch (e) { } };
  const val = id => (document.getElementById(id) || {}).value;
  const slip = o => { try { if (window.Slip49) window.Slip49.make(o); } catch (e) { console.warn('slip', e); } };
  const mkOf = d => { try { const t = Cal36.date(d); return t.be * 12 + t.m; } catch (e) { return Math.floor(d / 30); } };
  const yrOf = d => { try { return Cal36.date(d).be; } catch (e) { return Math.floor(d / 360) + 2500; } };
  const f1 = 'font:inherit;font-size:16px;padding:8px;border-radius:10px;border:1px solid #ccc;margin:2px 0;min-width:0;flex:1';
  const sb = 'font-size:13px;padding:5px 9px';
  const sav = () => Bank.st().sav;
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const fromAcct = () => 'ออมทรัพย์ ' + (B.all()[0] || { no: '' }).no;
  const X = () => {
    const v = B.V(); if (!v.x170) v.x170 = {};
    const x = v.x170; x.fx = x.fx || {}; x.cost = x.cost || {}; x.hy = x.hy || { bal: 0, wd: { mk: 0, n: 0 } }; x.ret = x.ret || { bal: 0, int: 0, unlock: 0, dep: { mk: 0, n: 0 } };
    x.goals = x.goals || []; x.seq = x.seq || 0; x.drafts = x.drafts || []; x.led = x.led || null; x.stm = x.stm || []; x.yr = x.yr || {}; x.ev = x.ev || { out: 0, atm: 0 };
    x.sc = x.sc || null; x.scH = x.scH || []; x.off = x.off || []; x.perk = x.perk || { hy: 0, fx: 0, goal: 0 }; x.cfg = x.cfg || {}; x.sim = x.sim | 0; x.lastSc = x.lastSc | 0;
    return x;
  };
  const delta = () => (window.Policy169 ? window.Policy169.delta() : 0);
  const bar = (v, good) => `<div style="background:rgba(255,255,255,.15);border-radius:6px;height:8px;overflow:hidden;margin:2px 0 6px"><i style="display:block;height:100%;width:${Math.max(2, Math.min(100, v))}%;background:${good ? '#8be28b' : '#ffb74d'}"></i></div>`;
  const log = (t, a) => { try { Bank2.log(t, a); } catch (e) { } };
  const take = (n, t) => { Bank.st().sav -= n; B.tx(t, -n, 'main'); log(t, -n); };
  const give = (n, t) => { Bank.st().sav += n; B.tx(t, n, 'main'); log(t, n); };

  // ===================== FX =====================
  const CUR = { USD: { n: 'ดอลลาร์สหรัฐ', f: '🇺🇸', b: 35, v: 0.05, ph: 0.7, d: 2 }, EUR: { n: 'ยูโร', f: '🇪🇺', b: 38, v: 0.045, ph: 2.1, d: 2 }, JPY: { n: 'เยน (100 เยน)', f: '🇯🇵', b: 24, v: 0.07, ph: 4.2, d: 2 }, GBP: { n: 'ปอนด์สเตอร์ลิง', f: '🇬🇧', b: 44, v: 0.05, ph: 5.6, d: 2 }, CNY: { n: 'หยวน', f: '🇨🇳', b: 4.9, v: 0.035, ph: 1.3, d: 2 } };
  const mid = (c, d) => { const k = CUR[c]; return k.b * (1 + k.v * Math.sin(d / 11 + k.ph) + k.v * 0.5 * Math.sin(d / 3.7 + k.ph * 2)); };
  const r2 = n => Math.round(n * 100) / 100;
  const buyRate = (c, d) => r2(mid(c, d || S.day) * 1.012), sellRate = (c, d) => r2(mid(c, d || S.day) * 0.988);
  const fxFee = n => (X().perk.fx >= S.day ? 0 : Math.max(10, Math.round(n * 0.002)));
  function fxBuy() {
    const c = val('s170fxc'), thb = Math.round(+val('s170fxn') || 0), x = X(); if (!CUR[c]) return; if (thb < 500) { toast('แลกเงินขั้นต่ำ 500 บาท', 'ℹ️'); return; }
    const fee = fxFee(thb); if (sav() < thb + fee) { toast(`เงินในบัญชีออมทรัพย์ไม่พอ (ต้องใช้ ${bS(thb + fee)} รวมค่าธรรมเนียม)`, '💸'); return; }
    const units = Math.floor(thb / buyRate(c) * 100) / 100; take(thb + fee, `แลกเงิน ${c} ${units}`); x.fx[c] = r2((x.fx[c] || 0) + units); x.cost[c] = (x.cost[c] || 0) + thb;
    toast(`ซื้อ ${c} ${units} (อัตรา ${buyRate(c)})`, '💱');
    slip({ k: 'acct', amt: thb, fee, payee: `ซื้อเงินตราต่างประเทศ ${c}`, memo: `${units} ${c} @ ${buyRate(c)}`, from: fromAcct() });
  }
  function fxSell(c, all) {
    const x = X(), have = x.fx[c] || 0; if (!(have > 0)) return; const u = all ? have : Math.min(have, r2(+val('s170fxs_' + c) || 0)); if (!(u > 0)) { toast('พิมพ์จำนวนที่จะขาย', 'ℹ️'); return; }
    const thb = Math.round(u * sellRate(c)), cost = Math.round((x.cost[c] || 0) * u / have); x.fx[c] = r2(have - u); x.cost[c] = Math.max(0, (x.cost[c] || 0) - cost); if (x.fx[c] <= 0) { x.fx[c] = 0; x.cost[c] = 0; }
    give(thb, `ขายเงินตราต่างประเทศ ${c} ${u}`); const pl = thb - cost; toast(`ขาย ${c} ${u} ได้ ${bS(thb)} (${pl >= 0 ? 'กำไร' : 'ขาดทุน'} ${bS(Math.abs(pl))})`, pl >= 0 ? '📈' : '📉');
    slip({ k: 'in', amt: thb, payee: `ขายเงินตราต่างประเทศ ${c}`, memo: `${u} ${c} @ ${sellRate(c)} · ${pl >= 0 ? 'กำไร' : 'ขาดทุน'} ${bS(Math.abs(pl))}`, from: 'ธนาคารสุขใจ' });
  }
  window.Fx170 = { mid, buyRate, sellRate, wallet: () => X().fx };

  // ===================== special accounts =====================
  const hyRate = () => Math.max(0.5, +(2.0 + delta() * 0.6 + (X().perk.hy >= S.day ? 0.5 : 0)).toFixed(2));
  const retRate = () => Math.max(1, +(3.0 + delta() * 0.6).toFixed(2));
  function hyDo(dep) {
    const x = X(), n = Math.round(+val('s170hyn') || 0); if (!(n >= 1)) { toast('พิมพ์จำนวนเงิน', 'ℹ️'); return; }
    if (dep) { if (sav() < n) { toast('เงินในบัญชีออมทรัพย์ไม่พอ', '💸'); return; } take(n, 'ฝากเข้าบัญชีออมทรัพย์ดอกเบี้ยสูง'); x.hy.bal += n; toast(`ฝากเข้าบัญชีดอกเบี้ยสูง ${bS(n)} (${hyRate()}% ต่อปี)`, '🏦'); }
    else { const mk = mkOf(S.day); if (x.hy.wd.mk !== mk) x.hy.wd = { mk, n: 0 }; if (x.hy.wd.n >= 4) { toast('ถอนได้เดือนละ 4 ครั้ง (เดือนนี้ครบแล้ว)', 'ℹ️'); return; } if (x.hy.bal < n) { toast(`ยอดในบัญชีดอกเบี้ยสูงมี ${bS(x.hy.bal)}`, '💸'); return; } x.hy.bal -= n; x.hy.wd.n++; give(n, 'ถอนจากบัญชีออมทรัพย์ดอกเบี้ยสูง'); toast(`ถอน ${bS(n)} เข้าบัญชีออมทรัพย์หลัก`, '🏦'); }
  }
  function retDo(dep) {
    const x = X(), r = x.ret, n = Math.round(+val('s170retn') || 0); if (!(n >= 1)) { toast('พิมพ์จำนวนเงิน', 'ℹ️'); return; }
    if (dep) {
      const mk = mkOf(S.day); if (r.dep.mk !== mk) r.dep = { mk, n: 0 }; if (r.dep.n + n > 50000) { toast(`ฝากเข้าบัญชีเพื่อการเกษียณได้เดือนละไม่เกิน 50,000 (เดือนนี้ฝากแล้ว ${bS(r.dep.n)})`, 'ℹ️'); return; } if (sav() < n) { toast('เงินในบัญชีออมทรัพย์ไม่พอ', '💸'); return; }
      take(n, 'ฝากเข้าบัญชีเพื่อการเกษียณ'); r.bal += n; r.dep.n += n; if (!r.unlock) r.unlock = S.day + 336; toast(`ฝากเพื่อการเกษียณ ${bS(n)} (ล็อกถึง ${RD(r.unlock)})`, '👴');
    } else {
      if (r.bal < n) { toast(`ยอดบัญชีเกษียณมี ${bS(r.bal)}`, '💸'); return; } const early = S.day < r.unlock; let fee = 0;
      if (early) { fee = Math.round(n * 0.01); if (!confirm(`ถอนก่อนครบกำหนด (${RD(r.unlock)}): เสียดอกเบี้ยสะสม ${bS(r.int)} ทั้งหมด และค่าธรรมเนียม ${bS(fee)} ตกลงไหม?`)) return; r.int = 0; }
      r.bal -= n; give(n - fee, early ? 'ถอนเงินฝากเกษียณก่อนกำหนด' : 'ถอนเงินฝากเพื่อการเกษียณ'); toast(`ถอน ${bS(n - fee)} เข้าบัญชีออมทรัพย์`, '👴'); if (r.bal <= 0) { r.bal = 0; r.unlock = 0; }
    }
  }
  function goalNew() {
    const x = X(), name = String(val('s170gn') || '').trim().slice(0, 20), tgt = Math.round(+val('s170gt') || 0), auto = Math.round(+val('s170ga') || 0), mths = Math.max(1, Math.min(60, Math.round(+val('s170gm') || 12)));
    if (!name || tgt < 1000) { toast('ตั้งชื่อเป้าหมายและจำนวนเงินเป้าหมาย (ขั้นต่ำ 1,000)', 'ℹ️'); return; } if (x.goals.length >= 6) { toast('มีเป้าหมายได้สูงสุด 6 อัน', 'ℹ️'); return; }
    x.goals.push({ id: ++x.seq, name, tgt, bal: 0, auto, due: S.day + mths * 7, paid: 0 }); toast(`สร้างเป้าหมาย "${name}" แล้ว`, '🎯');
  }
  function goalPut(id, n) { const x = X(), g = x.goals.find(q => q.id === id); if (!g) return; n = Math.min(n, Math.max(0, g.tgt - g.bal)); if (!(n >= 1)) { toast('เป้าหมายนี้ครบแล้ว', 'ℹ️'); return; } if (sav() < n) { toast('เงินในบัญชีออมทรัพย์ไม่พอ', '💸'); return; } take(n, `ออมเพื่อเป้าหมาย "${g.name}"`); g.bal += n; toast(`ออม ${bS(n)} เข้าเป้าหมาย "${g.name}"`, '🎯'); }
  function goalClose(id) {
    const x = X(), g = x.goals.find(q => q.id === id); if (!g) return; const done = g.bal >= g.tgt, bonus = done && S.day >= g.due - 0 ? Math.min(20000, Math.round(g.tgt * 0.01)) * (x.perk.goal >= S.day ? 2 : 1) : 0;
    if (!done && g.bal > 0 && !confirm(`ปิดเป้าหมาย "${g.name}" ก่อนถึงเป้า? จะได้เงินคืน ${bS(g.bal)} แต่ไม่ได้โบนัส`)) return;
    x.goals = x.goals.filter(q => q.id !== id); if (g.bal + bonus > 0) give(g.bal + bonus, `ปิดเป้าหมาย "${g.name}"${bonus ? ' (รับโบนัส)' : ''}`);
    toast(bonus ? `เป้าหมาย "${g.name}" สำเร็จ! ได้เงิน ${bS(g.bal)} + โบนัส ${bS(bonus)}` : `ปิดเป้าหมาย "${g.name}" คืนเงิน ${bS(g.bal)}`, bonus ? '🎉' : '🎯');
  }

  // ===================== bank drafts =====================
  const dFee = n => Math.max(30, Math.round(n * 0.002));
  function draftNew() {
    const x = X(), n = Math.round(+val('s170dn') || 0), payee = String(val('s170dp') || '').trim().slice(0, 30) || 'ผู้ถือ';
    if (!B.hasId()) { toast('ขอตั๋วเงินธนาคารต้องใช้บัตรประชาชน', '🪪'); return; } if (!B.bankOpen()) { toast('ขอตั๋วเงินได้เฉพาะเวลาทำการสาขา (จ–ศ 08:30–16:30)', '🕘'); return; }
    if (n < 1000 || n > 5000000) { toast('ตั๋วเงินธนาคารมูลค่า 1,000 – 5,000,000 บาท', 'ℹ️'); return; } const fee = dFee(n); if (sav() < n + fee) { toast(`เงินไม่พอ (ต้องใช้ ${bS(n + fee)} รวมค่าธรรมเนียม)`, '💸'); return; }
    take(n + fee, `ซื้อแคชเชียร์ดราฟต์ จ่าย ${payee}`); const d = { id: ++x.seq, no: String(200000 + rnd(0, 799999)), amt: n, payee, day: S.day, exp: S.day + 168, st: 'valid' }; x.drafts.unshift(d); if (x.drafts.length > 12) x.drafts.length = 12;
    toast(`ออกตั๋วเงินธนาคาร ${bS(n)} จ่าย ${payee}`, '📜'); slip({ k: 'acct', amt: n, fee, payee: `ตั๋วเงินธนาคาร #${d.no} จ่าย ${payee}`, memo: `ใช้ได้ถึง ${RD(d.exp)}`, from: fromAcct() });
  }
  function draftAct(id, how) {
    const x = X(), d = x.drafts.find(q => q.id === id); if (!d || d.st !== 'valid') return; const expired = S.day > d.exp;
    if (how === 'pay') { if (expired) { toast('ตั๋วหมดอายุแล้ว นำไปคืนเพื่อขอเงินคืนได้', '⌛'); return; } d.st = 'paid'; toast(`ส่งมอบตั๋ว #${d.no} ให้ ${d.payee} แล้ว`, '🤝'); msg(`${d.payee} นำตั๋วเงินธนาคาร #${d.no} ${bS(d.amt)} ไปขึ้นเงินเรียบร้อย`, true); return; }
    const fee = how === 'cancel' ? 100 : (expired ? 200 : 0); if (d.amt <= fee) return; d.st = how === 'cancel' ? 'cancelled' : 'redeemed'; give(d.amt - fee, `${how === 'cancel' ? 'ยกเลิกตั๋วเงิน' : 'นำตั๋วเงินฝากคืน'} #${d.no}`);
    toast(`ได้เงินคืน ${bS(d.amt - fee)}${fee ? ` (หักค่าธรรมเนียม ${bS(fee)})` : ''}`, '📜');
  }

  // ===================== statements & tax certificate =====================
  const earned = () => (Bank.st().earned || 0);
  function ledGet() { const x = X(); if (!x.led) x.led = { mk: mkOf(S.day), in: 0, out: 0, n: 0, int: 0, e0: earned(), s: S.day, i0: Object.assign({}, Bank2.st().inc || {}) }; return x.led; }
  { const _l = Bank2.log.bind(Bank2); Bank2.log = function (t, a) { const r = _l(t, a); try { const l = ledGet(); a = +a || 0; if (a > 0) l.in += a; else l.out += -a; l.n++; if (a > 0 && /ดอกเบี้ย/.test(String(t))) { const m = /ดอกเบี้ย[^\d]*([\d,]+)/.exec(String(t)); if (m) l.int += +m[1].replace(/,/g, '') || 0; } } catch (e) { } return r; }; }
  const intTotal = () => { const x = X(); return x.yr[yrOf(S.day)] || 0; };
  const addInt = n => { const x = X(), y = yrOf(S.day); x.yr[y] = (x.yr[y] || 0) + n; };
  const whtOf = y => { const x = X(), t = x.yr[y] || 0; return Math.round((x.wht || {})[y] || 0); };
  function closeMonth() {
    const x = X(), l = ledGet(), mk = mkOf(S.day); if (l.mk === mk) return;
    const gain = Math.max(0, earned() - l.e0), it = l.int + gain; const fd = (B.V().fd || []).reduce((s, f) => s + f.amt, 0);
    const incs = Object.entries(Bank2.st().inc || {}).map(([k, v]) => [k, Math.round(v - ((l.i0 || {})[k] || 0))]).filter(q => q[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 4); x.stm.unshift({ inc: incs, mk: l.mk, s: l.s, e: S.day - 1, in: Math.round(l.in), out: Math.round(l.out), n: l.n, int: Math.round(it), end: Math.round(sav()), fd: Math.round(fd), hy: Math.round(x.hy.bal), ret: Math.round(x.ret.bal) }); if (x.stm.length > 12) x.stm.length = 12;
    if (it > 0) { const y = yrOf(S.day - 1); x.yr[y] = (x.yr[y] || 0) + gain + l.int; }
    msg(`ใบแจ้งยอดบัญชีประจำเดือนพร้อมแล้ว (${RD(l.s)} – ${RD(S.day - 1)}) เงินเข้า ${bS(l.in)} เงินออก ${bS(l.out)} ดูได้ในแอปธนาคาร`, true);
    x.led = { mk, in: 0, out: 0, n: 0, int: 0, e0: earned(), s: S.day, i0: Object.assign({}, Bank2.st().inc || {}) };
    monthly();
  }
  function monthly() {
    const x = X();
    if (x.hy.bal > 0) { const g = Math.round(x.hy.bal * hyRate() / 100 / 12); if (g > 0) { const y = yrOf(S.day), b0 = x.yr['hy' + y] || 0, a0 = b0 + g, tax = Math.round((Math.max(0, a0 - 20000) - Math.max(0, b0 - 20000)) * 0.15); x.yr['hy' + y] = a0; x.hy.bal += g - tax; x.hyI = (x.hyI || 0) + g; if (tax) { x.wht = x.wht || {}; x.wht[y] = (x.wht[y] || 0) + tax; } x.yr[y] = (x.yr[y] || 0) + g; log(`ดอกเบี้ยบัญชีดอกเบี้ยสูง (ดอกเบี้ย ${g}${tax ? ` หัก ณ ที่จ่าย ${tax}` : ''})`, 0); msg(`ดอกเบี้ยบัญชีออมทรัพย์ดอกเบี้ยสูง ${bS(g)}${tax ? ` (หักภาษี ณ ที่จ่าย ${bS(tax)})` : ''} เข้าบัญชีแล้ว`, true); } }
    if (x.ret.bal > 0) { const g = Math.round(x.ret.bal * retRate() / 100 / 12); if (g > 0) { x.ret.int += g; x.ret.bal += g; x.yr[yrOf(S.day)] = (x.yr[yrOf(S.day)] || 0) + g; } }
    for (const g of x.goals) if (g.auto > 0 && g.bal < g.tgt) { const n = Math.min(g.auto, g.tgt - g.bal); if (sav() >= n) { take(n, `ออมอัตโนมัติ "${g.name}"`); g.bal += n; if (g.bal >= g.tgt) msg(`เป้าหมาย "${g.name}" ครบ ${bS(g.tgt)} แล้ว! ปิดเป้าหมายเพื่อรับเงินและโบนัสได้ในแอปธนาคาร`, true); } else msg(`ออมอัตโนมัติ "${g.name}" ไม่สำเร็จ: เงินในบัญชีออมทรัพย์ไม่พอ`, false); }
    for (const d of x.drafts) if (d.st === 'valid' && S.day > d.exp && !d.warned) { d.warned = 1; msg(`ตั๋วเงินธนาคาร #${d.no} หมดอายุแล้ว นำไปคืนเพื่อขอเงินคืนได้ (ค่าธรรมเนียม 200 ฿)`, false); }
    genOffers();
  }
  function certify(y) {
    const x = X(), it = Math.round(x.yr[y] || 0), tax = Math.round((x.wht || {})[y] || 0); if (!(it > 0)) { toast(`ปี ${y} ไม่มีดอกเบี้ยรับ`, 'ℹ️'); return; }
    slip({ k: 'acct', amt: it, payee: `หนังสือรับรองการหักภาษี ณ ที่จ่าย (50 ทวิ) ปี ${y}`, memo: `ดอกเบี้ยเงินฝากรวม ${bS(it)} · ภาษีหัก ณ ที่จ่าย ${bS(tax)}`, from: 'ธนาคารสุขใจ', neutral: true }); toast(`ออกหนังสือรับรอง 50 ทวิ ปี ${y}`, '🧾');
  }

  // ===================== bank events =====================
  window.Evt170 = { outage: () => X().ev.out >= S.day, atmOut: () => X().ev.atm === S.day };
  function rollEvents() {
    const x = X(), e = x.ev; if (e.out < S.day && Math.random() < 0.025) { e.out = S.day + rnd(0, 1); msg('⚠️ ระบบแอปธนาคารและพร้อมเพย์ขัดข้องชั่วคราว ธนาคารกำลังแก้ไข ใช้เงินสด/บัตร/ไปสาขาแทนไปก่อน', false); }
    else if (e.out === S.day - 1 && e.out >= 0) { msg('ระบบแอปธนาคารและพร้อมเพย์กลับมาใช้งานได้ตามปกติแล้ว ขออภัยในความไม่สะดวก', true); e.out = 0; }
    if (Math.random() < 0.04) { e.atm = S.day; }
  }

  // ===================== scams =====================
  const SC = {
    sms: { t: '📩 SMS: "บัญชีธนาคารของคุณถูกระงับ ยืนยันตัวตนภายใน 24 ชม. ที่ http://sukjai-bank-verify.co"', q: 'คุณจะทำอย่างไร?', ch: [['click', 'กดลิงก์และกรอกข้อมูล', 'warn'], ['ignore', 'ลบข้อความทิ้ง', ''], ['report', 'แจ้งธนาคาร/ตำรวจไซเบอร์', 'good']] },
    call: { t: '📞 สายโทรเข้า: "ตำรวจ/ดีเอสไอ แจ้งว่าบัญชีคุณเกี่ยวข้องกับการฟอกเงิน ต้องโอนเงินเข้าบัญชีกลางเพื่อตรวจสอบ ห้ามบอกใคร"', q: 'คุณจะทำอย่างไร?', ch: [['pay', 'โอนเงินตามที่บอก', 'warn'], ['hang', 'วางสายแล้วโทรเบอร์ทางการเอง', 'good'], ['ignore', 'ไม่รับสาย', '']] },
    otp: { t: '👤 "เจ้าหน้าที่ธนาคาร" โทรมาว่ามีรายการผิดปกติ ขอรหัส OTP 6 หลักที่เพิ่งส่งไปที่มือถือเพื่อยกเลิกรายการ', q: 'คุณจะทำอย่างไร?', ch: [['pay', 'บอกรหัส OTP', 'warn'], ['hang', 'ไม่บอก วางสาย แล้วโทรเบอร์หลังบัตร', 'good']] },
  };
  function scamRoll() {
    const x = X(); if (x.cfg.scam === 0) return; if (x.sc && S.day - x.sc.day > 3 && x.sc.st === 'open') { x.sc.st = 'expired'; x.scH.unshift({ k: x.sc.k, d: x.sc.day, r: 'ไม่ได้ตอบสนอง' }); x.sc = null; }
    const dd = x.sc && x.sc.disp; if (dd && S.day >= dd.due && !dd.done) { dd.done = 1; if (dd.ok) { give(dd.amt, 'ธนาคารคืนเงินจากรายการที่โต้แย้ง'); msg(`ผลการโต้แย้งรายการบัตรเดบิต: ธนาคารอนุมัติคืนเงิน ${bS(dd.amt)} เข้าบัญชีแล้ว`, true); x.scH.unshift({ k: 'fraud', d: x.sc.day, r: `ได้เงินคืน ${bS(dd.amt)}` }); } else { msg('ผลการโต้แย้งรายการบัตรเดบิต: ธนาคารไม่อนุมัติคืนเงินเพราะแจ้งช้าหรือหลักฐานไม่พอ', false); x.scH.unshift({ k: 'fraud', d: x.sc.day, r: 'ไม่ได้เงินคืน' }); } x.sc = null; }
    if (x.sc || S.day - x.lastSc < 24 || Math.random() > 0.035) return; x.scH.length = Math.min(x.scH.length, 8);
    const d = window.Debit169 && window.Debit169.st(), kinds = ['sms', 'call', 'otp'].concat(d && d.st === 'active' ? ['fraud', 'fraud'] : []), k = kinds[rnd(0, kinds.length - 1)]; x.lastSc = S.day;
    if (k === 'fraud') { const amt = Math.min(sav(), rnd(3, 25) * 1000); if (amt < 1000) return; Bank.st().sav -= amt; B.tx('รายการบัตรเดบิตที่ไม่ได้ทำ (ต่างประเทศ)', -amt, 'main'); log('รายการบัตรเดบิตต่างประเทศ ไม่ทราบที่มา', -amt); x.sc = { k, day: S.day, st: 'open', amt, lost: amt }; msg(`⚠️ มีรายการบัตรเดบิต ${bS(amt)} ที่ร้านค้าออนไลน์ต่างประเทศ หากไม่ใช่คุณ ให้โต้แย้งรายการภายใน 3 วัน (แอปธนาคาร แท็บ ความปลอดภัย)`, false); }
    else { x.sc = { k, day: S.day, st: 'open', amt: 0 }; msg(`📢 ${SC[k].t.replace(/^[^ ]+ /, '')}`, false); }
    toast('มีเรื่องน่าสงสัยเกี่ยวกับบัญชีธนาคาร ตรวจสอบที่แอปธนาคาร แท็บ ความปลอดภัย', '🚨');
  }
  function scamAct(a) {
    const x = X(), s = x.sc; if (!s || s.st !== 'open') return; const k = s.k; let lost = 0, res = '';
    if (k === 'fraud') {
      if (a === 'dispute') { const ok = Math.random() < (S.day - s.day <= 3 ? 0.9 : 0.6); s.disp = { due: S.day + 7, ok, amt: s.amt }; s.st = 'disputing'; toast('ยื่นโต้แย้งรายการแล้ว ธนาคารใช้เวลาตรวจสอบประมาณ 7 วัน', '📨'); return; }
      s.st = 'done'; x.scH.unshift({ k, d: s.day, r: 'ไม่ได้โต้แย้ง เสียเงิน ' + bS(s.amt) }); x.sc = null; toast('ไม่ได้โต้แย้งรายการ เงินไม่ถูกคืน', '😟'); return;
    }
    const otpOn = !(B.V().cfg && B.V().cfg.otp === 0);
    if (a === 'click' || a === 'pay') {
      const pct = k === 'sms' ? 0.15 : k === 'otp' ? 0.2 : 0.3, cap = k === 'sms' ? 40000 : k === 'otp' ? 80000 : 200000;
      if (k !== 'call' && otpOn && Math.random() < 0.4) { res = 'ธนาคารระงับรายการผิดปกติได้ทัน ไม่เสียเงิน'; msg(res + ' โปรดอย่ากดลิงก์/บอกรหัสให้ใคร', true); }
      else { lost = Math.min(sav(), Math.max(1000, Math.round(Math.min(sav() * pct, cap) / 100) * 100)); Bank.st().sav -= lost; B.tx('ถูกมิจฉาชีพหลอกให้โอนเงิน', -lost, 'main'); log('ถูกมิจฉาชีพหลอกโอนเงิน', -lost); res = 'ถูกหลอก เสียเงิน ' + bS(lost); s.lost = lost; msg(`🚨 คุณถูกมิจฉาชีพหลอก เสียเงิน ${bS(lost)} รีบแจ้งธนาคารให้อายัดภายใน 1 วัน`, false); }
    } else if (a === 'report') { res = 'แจ้งธนาคาร/ตำรวจไซเบอร์ ปลอดภัย'; toast('ขอบคุณที่แจ้ง ธนาคารบล็อกเบอร์/เว็บไซต์ปลอมแล้ว', '🛡️'); }
    else if (a === 'hang') { res = 'ไม่หลงกล ปลอดภัย'; toast('ถูกต้อง! ธนาคารและตำรวจไม่ขอ OTP หรือให้โอนเงินทางโทรศัพท์', '🛡️'); }
    else res = 'เมินเฉย ปลอดภัย';
    if (lost > 0) { s.st = 'lost'; s.t = S.day; } else { x.scH.unshift({ k, d: s.day, r: res }); x.sc = null; }
  }
  function scamRecover() {
    const x = X(), s = x.sc; if (!s || s.st !== 'lost' || s.rec) return; s.rec = 1; const ok = S.day - s.day <= 1, back = Math.round(s.lost * (ok ? 0.4 : 0.1) / 100) * 100;
    if (back > 0 && Math.random() < (ok ? 0.8 : 0.3)) { give(back, 'ได้เงินคืนจากการอายัด'); msg(`ธนาคารอายัดบัญชีปลายทางได้บางส่วน คืนเงิน ${bS(back)}`, true); x.scH.unshift({ k: s.k, d: s.day, r: `เสียเงิน ${bS(s.lost)} ได้คืน ${bS(back)}` }); }
    else { msg('แจ้งอายัดแล้ว แต่เงินถูกโอนต่อไปหมดแล้ว ไม่สามารถติดตามคืนได้', false); x.scH.unshift({ k: s.k, d: s.day, r: `เสียเงิน ${bS(s.lost)} ไม่ได้คืน` }); }
    x.sc = null;
  }

  // ===================== banker offers =====================
  function genOffers() {
    const x = X(), d = window.Debit169 && window.Debit169.st(); x.off = x.off.filter(o => o.exp >= S.day); const have = k => x.off.some(o => o.k === k); const add = (k, t, txt) => { if (!have(k) && x.off.length < 3) x.off.push({ k, t, txt, exp: S.day + 14 }); };
    if (x.hy.bal === 0) add('hy', '💰 ดอกเบี้ยพิเศษ +0.5%', 'เปิดใช้บัญชีออมทรัพย์ดอกเบี้ยสูง รับดอกเบี้ยพิเศษเพิ่ม 0.5% ต่อปี นาน 3 เดือน (21 วัน)');
    if (Math.random() < 0.6) add('fx', '💱 ฟรีค่าธรรมเนียมแลกเงิน', 'แลกเงินตราต่างประเทศผ่านแอปไม่เสียค่าธรรมเนียม 28 วัน');
    if (!x.goals.length) add('goal', '🎯 โบนัสเป้าหมายออม x2', 'สร้างเป้าหมายออม เมื่อสำเร็จรับโบนัสสองเท่า (ภายใน 56 วัน)');
    if (!d) add('debit', '💳 บัตรเดบิตใบแรกฟรี', 'ขอบัตรเดบิตใช้จ่ายทุกร้านโดยไม่เสียดอกเบี้ย');
    if (Credit && Credit.st().score >= 700 && !have('tip')) add('tip', '⭐ คะแนนเครดิตดีมาก', 'ธนาคารเชิญคุณขอเพิ่มวงเงินบัตรเครดิตหรือรีไฟแนนซ์สินเชื่อดอกเบี้ยต่ำ ดูที่แท็บ เครดิตบูโร/จัดการหนี้');
    if (x.off.length) toast('ผู้จัดการธนาคารมีข้อเสนอพิเศษสำหรับคุณ (แอปธนาคาร แท็บ ความปลอดภัย/ข้อเสนอ)', '🤵');
  }
  function offerAccept(k) {
    const x = X(), o = x.off.find(q => q.k === k); if (!o || o.exp < S.day) { toast('ข้อเสนอหมดอายุแล้ว', '⌛'); return; }
    if (k === 'hy') { x.perk.hy = S.day + 21; toast('รับสิทธิ์ดอกเบี้ยพิเศษ +0.5% แล้ว ฝากเข้าบัญชีดอกเบี้ยสูงได้เลย', '💰'); }
    else if (k === 'fx') { x.perk.fx = S.day + 28; toast('รับสิทธิ์ฟรีค่าธรรมเนียมแลกเงิน 28 วัน', '💱'); }
    else if (k === 'goal') { x.perk.goal = S.day + 56; toast('รับสิทธิ์โบนัสเป้าหมายออม x2 (ภายใน 56 วัน)', '🎯'); }
    else if (k === 'debit') { if (window.Bank169) window.Bank169.issueDebit(false); }
    x.off = x.off.filter(q => q.k !== k);
  }

  // ===================== ATM extras =====================
  const atmLim = 50000;
  window.Atm170 = {
    html(sub) {
      const btn = (v, t) => `<button class="btn ghost" data-a="atm71" data-v="ext|${v}">${t}</button>`;
      if (sub === 'xfer') return `<p class="lead">🏦 โอนเงินข้ามธนาคาร (ครั้งละไม่เกิน ${bS(atmLim)} · ค่าธรรมเนียม 15 ฿)</p><div class="row"><input id="atmXn" type="text" placeholder="ชื่อผู้รับ" style="${f1}"></div><div class="row"><input id="atmXa" type="number" inputmode="numeric" placeholder="จำนวนเงิน" style="${f1}"></div><div class="row"><button class="btn" data-a="atm71" data-v="ext|xferdo">โอน</button><button class="btn ghost" data-a="atm71" data-v="ext|menu">← กลับ</button></div>`;
      if (sub === 'bill') { const l = window.Bills84 ? window.Bills84.list() : []; return `<p class="lead">🧾 ชำระบิล (หักจากบัญชีออมทรัพย์)</p>${l.length ? l.map(b => `<div class="row" style="justify-content:space-between;gap:8px"><span>${E(b.name)} <b>${bS(b.amt)}</b></span><button class="btn" style="${sb}" data-a="atm71" data-v="ext|pay:${E(b.id)}">ชำระ</button></div>`).join('') : '<p class="empty">ไม่มีบิลค้างชำระ</p>'}<div class="row"><button class="btn ghost" data-a="atm71" data-v="ext|menu">← กลับ</button></div>`; }
      if (sub === 'top') return `<p class="lead">📱 เติมเงินมือถือ (ยอดเงินในซิม ${bS(X().sim)})</p><div class="row"><input id="atmTel" type="tel" inputmode="numeric" maxlength="10" placeholder="เบอร์โทรศัพท์ 10 หลัก" style="${f1}"></div><div class="row" style="flex-wrap:wrap">${[50, 100, 200, 500].map(n => `<button class="btn ghost" style="flex:1;min-width:20%" data-a="atm71" data-v="ext|top:${n}">${n}</button>`).join('')}</div><div class="row"><button class="btn ghost" data-a="atm71" data-v="ext|menu">← กลับ</button></div>`;
      return `<p class="lead">บริการอื่นๆ</p><div class="grid" style="grid-template-columns:repeat(3,1fr);gap:8px">${['xfer|🏦|โอนข้ามธนาคาร', 'bill|🧾|ชำระบิล', 'top|📱|เติมเงินมือถือ'].map(s => { const [v, i, t] = s.split('|'); return `<button class="btn ghost" style="display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 6px" data-a="atm71" data-v="ext|${v}">${`<span style="font-size:24px">${i}</span>${t}`}</button>`; }).join('')}</div><div class="row"><button class="btn ghost" data-a="atm71" data-v="menu">← เมนูหลัก</button></div>`;
    },
    act(x, A, rec) {
      const [a, p] = [x.split(':')[0], x.split(':').slice(1).join(':')];
      if (a === 'menu' || a === 'xfer' || a === 'bill' || a === 'top') { if (a === 'top' && p) return this.top(+p, A, rec); A.sub = a; return; }
      if (a === 'xferdo') {
        const nm = String(val('atmXn') || '').trim().slice(0, 24), n = Math.round(+val('atmXa') || 0); if (nm.length < 2 || !(n >= 1)) { toast('พิมพ์ชื่อผู้รับและจำนวนเงิน', 'ℹ️'); return; } if (n > atmLim) { toast(`โอนที่ตู้ ATM ได้ครั้งละไม่เกิน ${bS(atmLim)}`, '🏧'); return; } if (sav() < n + 15) { toast(`เงินในบัญชีไม่พอ (ต้องใช้ ${bS(n + 15)} รวมค่าธรรมเนียม)`, '💸'); return; }
        take(n + 15, `โอนข้ามธนาคาร ${nm} (ATM)`); rec('🏦', 'โอนเงินข้ามธนาคารสำเร็จ', `ผู้รับ ${nm}`, `จำนวน ${bS(n)} · ค่าธรรมเนียม ${bS(15)}`, `คงเหลือ ${bS(sav())}`); A.sub = 'menu'; return;
      }
      if (a === 'pay') { const b = window.Bills84 && window.Bills84.list().find(q => q.id === p); if (!b) { toast('ไม่พบบิลนี้', 'ℹ️'); return; } const C = window.Card168; if (C) C.quiet = true; let ok = false; window.Evt170.bypass = 1; try { ok = window.Bills84.payBill(p, 'sav'); } finally { window.Evt170.bypass = 0; if (C) C.quiet = false; } if (ok) { rec('🧾', 'ชำระบิลสำเร็จ', b.name, `จำนวน ${bS(b.amt)}`, `คงเหลือ ${bS(sav())}`); A.sub = 'menu'; } return; }
    },
    top(n, A, rec) {
      const tel = String(val('atmTel') || '').replace(/\D/g, ''); if (tel.length !== 10) { toast('ใส่เบอร์โทรศัพท์ 10 หลัก', 'ℹ️'); return; } if (sav() < n) { toast('เงินในบัญชีไม่พอ', '💸'); return; }
      take(n, `เติมเงินมือถือ ${tel} (ATM)`); X().sim += n; rec('📱', 'เติมเงินมือถือสำเร็จ', `เบอร์ ${tel.slice(0, 3)}-${tel.slice(3, 6)}-${tel.slice(6)}`, `จำนวน ${bS(n)}`, `ยอดเงินในซิม ${bS(X().sim)}`); A.sub = 'menu';
    },
  };

  // ===================== handlers =====================
  UI.H.s163fxbuy = fxBuy;
  UI.H.s163fxsell = d => fxSell(String(d.v).split('|')[0], String(d.v).split('|')[1] === 'all');
  UI.H.s163hydep = () => hyDo(true); UI.H.s163hywd = () => hyDo(false);
  UI.H.s163retdep = () => retDo(true); UI.H.s163retwd = () => retDo(false);
  UI.H.s163goalnew = goalNew; UI.H.s163goalput = d => goalPut(+String(d.v).split('|')[0], +String(d.v).split('|')[1]); UI.H.s163goalclose = d => goalClose(+d.v);
  UI.H.s163draftnew = draftNew; UI.H.s163draftact = d => draftAct(+String(d.v).split('|')[0], String(d.v).split('|')[1]);
  UI.H.s163cert = d => certify(+d.v);
  UI.H.s163stm = d => { const s = X().stm[+d.v]; if (!s) return; slip({ k: 'acct', amt: s.in, payee: `ใบแจ้งยอดบัญชี ${RD(s.s)} – ${RD(s.e)}`, memo: `เงินเข้า ${bS(s.in)} · เงินออก ${bS(s.out)} · ${s.n} รายการ · ดอกเบี้ย ${bS(s.int)} · ยอดออมทรัพย์ปลายเดือน ${bS(s.end)}`, from: 'ธนาคารสุขใจ', neutral: true }); };
  UI.H.s163scam = d => scamAct(d.v); UI.H.s163scamrec = scamRecover;
  UI.H.s163scamset = d => { X().cfg.scam = d.v === 'on' ? 1 : 0; toast(d.v === 'on' ? 'เปิดเหตุการณ์มิจฉาชีพ' : 'ปิดเหตุการณ์มิจฉาชีพ', '🚨'); };
  UI.H.s163offer = d => offerAccept(d.v);

  // ===================== screens =====================
  function tabFx() {
    const x = X(); let h = `<p class="lead">💱 แลกเงิน · บัญชีพิเศษ</p>`;
    if (window.Evt170.outage()) h += `<div class="card" style="grid-template-columns:1fr"><div class="cb"><p class="bad">⚠️ ระบบแอปธนาคารขัดข้องอยู่ (จ่ายผ่านแอป/พร้อมเพย์ไม่ได้ชั่วคราว)</p></div></div>`;
    h += `<h5>💱 อัตราแลกเปลี่ยน (วันนี้)</h5><div class="grid">${Object.keys(CUR).map(c => { const k = CUR[c], b = buyRate(c), s = sellRate(c), y = buyRate(c, S.day - 1), up = b >= y, have = x.fx[c] || 0, pl = have > 0 ? Math.round(have * s - (x.cost[c] || 0)) : 0;
      return `<div class="card" style="grid-template-columns:1fr"><div class="cb"><h4>${k.f} ${c} · ${k.n} ${up ? '<span class="good">▲</span>' : '<span class="bad">▼</span>'}</h4><p class="dim">ธนาคารขาย ${b.toFixed(2)} · ธนาคารรับซื้อ ${s.toFixed(2)} บาท</p>${have > 0 ? `<p>ถืออยู่ <b>${have.toFixed(2)} ${c}</b> (มูลค่า ${bS(have * s)}) · <b class="${pl >= 0 ? 'good' : 'bad'}">${pl >= 0 ? 'กำไร' : 'ขาดทุน'} ${bS(Math.abs(pl))}</b></p><div class="row"><input id="s170fxs_${c}" type="number" min="0" step="0.01" placeholder="จำนวน ${c} ที่จะขาย" style="${f1}"><button class="btn ghost" style="${sb}" data-a="s163fxsell" data-v="${c}|part">ขาย</button><button class="btn ghost" style="${sb}" data-a="s163fxsell" data-v="${c}|all">ขายทั้งหมด</button></div>` : ''}</div></div>`; }).join('')}</div>`;
    h += `<div class="row"><select id="s170fxc" style="${f1}">${Object.keys(CUR).map(c => `<option value="${c}">${CUR[c].f} ${c}</option>`).join('')}</select><input id="s170fxn" type="number" min="500" placeholder="จำนวนบาทที่จะแลก (ขั้นต่ำ 500)" style="${f1}"><button class="btn" data-a="s163fxbuy">ซื้อเงินตรา</button></div><p class="dim">ค่าธรรมเนียม ${x.perk.fx >= S.day ? '<b class="good">ฟรี (สิทธิ์พิเศษถึง ' + RD(x.perk.fx) + ')</b>' : '0.2% (ขั้นต่ำ 10 บาท)'} · หักจากบัญชีออมทรัพย์ · อัตราแลกเปลี่ยนเปลี่ยนไปทุกวัน</p>`;
    h += `<h5>💰 บัญชีออมทรัพย์ดอกเบี้ยสูง</h5><div class="card" style="grid-template-columns:1fr"><div class="cb"><p>ยอด <b>${bS(x.hy.bal)}</b> · ดอกเบี้ย ${hyRate()}% ต่อปี${x.perk.hy >= S.day ? ' <b class="good">(รวมดอกพิเศษถึง ' + RD(x.perk.hy) + ')</b>' : ''}</p><p class="dim">จ่ายดอกเบี้ยรายเดือน · ถอนได้เดือนละ 4 ครั้ง · ดอกเบี้ยสะสมเกิน 20,000 ฿/ปี หักภาษี 15%</p><div class="row"><input id="s170hyn" type="number" placeholder="จำนวนเงิน" style="${f1}"><button class="btn" data-a="s163hydep">ฝาก</button><button class="btn ghost" data-a="s163hywd">ถอน</button></div></div></div>`;
    const r = x.ret; h += `<h5>👴 เงินฝากเพื่อการเกษียณ</h5><div class="card" style="grid-template-columns:1fr"><div class="cb"><p>ยอด <b>${bS(r.bal)}</b> (ดอกเบี้ยสะสม ${bS(r.int)}) · ดอกเบี้ย ${retRate()}% ต่อปี${r.unlock ? ` · ล็อกถึง ${RD(r.unlock)}${S.day >= r.unlock ? ' <b class="good">ถอนได้แล้ว</b>' : ''}` : ''}</p><p class="dim">ฝากได้เดือนละไม่เกิน 50,000 ฿ · ถอนก่อนกำหนดเสียดอกเบี้ยสะสมทั้งหมด + ค่าธรรมเนียม 1%</p><div class="row"><input id="s170retn" type="number" placeholder="จำนวนเงิน" style="${f1}"><button class="btn" data-a="s163retdep">ฝาก</button><button class="btn ghost" data-a="s163retwd">ถอน</button></div></div></div>`;
    h += `<h5>🎯 เป้าหมายออมเงิน (${x.goals.length}/6)</h5>` + (x.goals.length ? x.goals.map(g => { const p = Math.round(g.bal / g.tgt * 100), done = g.bal >= g.tgt; return `<div class="card" style="grid-template-columns:1fr"><div class="cb"><h4>${E(g.name)} · ${bS(g.bal)} / ${bS(g.tgt)} (${p}%)</h4>${bar(p, done)}<p class="dim">กำหนด ${RD(g.due)}${g.auto ? ` · ออมอัตโนมัติ ${bS(g.auto)}/เดือน` : ''}${done ? ' · <b class="good">ครบเป้าแล้ว</b>' : ''}</p><div class="row">${[1000, 5000, 10000].map(n => `<button class="btn ghost" style="${sb}" data-a="s163goalput" data-v="${g.id}|${n}" ${done ? 'disabled' : ''}>+${n.toLocaleString('en-US')}</button>`).join('')}<button class="btn" style="${sb}" data-a="s163goalclose" data-v="${g.id}">${done ? (S.day >= g.due ? '🎉 รับเงิน + โบนัส' : 'ปิด (ได้โบนัสเมื่อถึงกำหนด)') : 'ปิดเป้าหมาย'}</button></div></div></div>`; }).join('') : '<p class="dim">ยังไม่มีเป้าหมาย · ตั้งเป้าหมายเพื่อออมเงิน ถึงเป้าและถึงกำหนดรับโบนัส 1% (สูงสุด 20,000 ฿)</p>');
    h += `<div class="row"><input id="s170gn" type="text" maxlength="20" placeholder="ชื่อเป้าหมาย" style="${f1}"><input id="s170gt" type="number" placeholder="เป้าหมาย (฿)" style="${f1}"></div><div class="row"><input id="s170ga" type="number" placeholder="ออมอัตโนมัติต่อเดือน (ถ้าต้องการ)" style="${f1}"><input id="s170gm" type="number" placeholder="ภายใน (เดือน)" value="12" style="${f1}"><button class="btn" data-a="s163goalnew">สร้างเป้าหมาย</button></div>`;
    return h;
  }
  function tabDoc() {
    const x = X(), y = yrOf(S.day); let h = `<p class="lead">📜 ตั๋วเงิน · ใบแจ้งยอด · ภาษี</p>`;
    h += `<h5>📜 ตั๋วเงินธนาคาร (แคชเชียร์ดราฟต์)</h5><p class="dim">ชำระเงินก้อนใหญ่แบบมั่นใจได้ ผู้รับขึ้นเงินได้แน่นอน · ค่าธรรมเนียม 0.2% (ขั้นต่ำ 30 ฿) · ใช้ได้ 168 วัน · ยกเลิกเสีย 100 ฿ · ขอได้เฉพาะเวลาทำการสาขา</p>`;
    h += `<div class="row"><input id="s170dp" type="text" maxlength="30" placeholder="จ่ายให้ (ชื่อผู้รับ)" style="${f1}"><input id="s170dn" type="number" placeholder="จำนวนเงิน" style="${f1}"><button class="btn" data-a="s163draftnew">ออกตั๋ว</button></div>`;
    h += x.drafts.length ? x.drafts.map(d => { const exp = d.st === 'valid' && S.day > d.exp; return `<div class="card" style="grid-template-columns:1fr"><div class="cb"><h4>#${E(d.no)} · ${bS(d.amt)} → ${E(d.payee)}</h4><p class="dim">ออก ${RD(d.day)} · ${d.st === 'valid' ? (exp ? '<b class="bad">หมดอายุ</b>' : 'ใช้ได้ถึง ' + RD(d.exp)) : ({ paid: 'ส่งมอบแล้ว', cancelled: 'ยกเลิกแล้ว', redeemed: 'ฝากคืนแล้ว' }[d.st] || d.st)}</p>${d.st === 'valid' ? `<div class="row"><button class="btn ghost" style="${sb}" data-a="s163draftact" data-v="${d.id}|pay" ${exp ? 'disabled' : ''}>🤝 ส่งมอบผู้รับ</button><button class="btn ghost" style="${sb}" data-a="s163draftact" data-v="${d.id}|cancel">ยกเลิก (-100)</button><button class="btn ghost" style="${sb}" data-a="s163draftact" data-v="${d.id}|redeem">ฝากคืนบัญชี${exp ? ' (-200)' : ''}</button></div>` : ''}</div></div>`; }).join('') : '<p class="dim">ยังไม่มีตั๋วเงิน</p>';
    h += `<h5>🧾 ใบแจ้งยอดบัญชีรายเดือน</h5>` + (x.stm.length ? x.stm.map((s, i) => `<div class="card" style="grid-template-columns:1fr"><div class="cb"><h4>${RD(s.s)} – ${RD(s.e)}</h4><p class="dim">เงินเข้า <b class="good">${bS(s.in)}</b> · เงินออก <b class="bad">${bS(s.out)}</b> · ${s.n} รายการ · ดอกเบี้ย ${bS(s.int)} · ยอดออมทรัพย์ ${bS(s.end)}</p>${(s.inc || []).length ? `<p class="dim">รายได้หลัก: ${s.inc.map(q => E(q[0]) + ' ' + bS(q[1])).join(' · ')}</p>` : ''}<div class="row"><button class="btn ghost" style="${sb}" data-a="s163stm" data-v="${i}">🖨️ พิมพ์ใบแจ้งยอด</button></div></div></div>`).join('') : '<p class="dim">ใบแจ้งยอดจะออกทุกต้นเดือน</p>');
    const ys = [y, y - 1].filter(q => (x.yr[q] || 0) > 0);
    h += `<h5>🧾 หนังสือรับรองภาษี (50 ทวิ)</h5>` + (ys.length ? ys.map(q => `<div class="row" style="justify-content:space-between;gap:8px"><span>ปี ${q}: ดอกเบี้ยรับ <b>${bS(x.yr[q])}</b> · ภาษีหัก ณ ที่จ่าย ${bS((x.wht || {})[q] || 0)}</span><button class="btn ghost" style="${sb}" data-a="s163cert" data-v="${q}">ขอหนังสือรับรอง</button></div>`).join('') : '<p class="dim">ยังไม่มีดอกเบี้ยรับในปีนี้/ปีก่อน</p>');
    return h;
  }
  function tabSafe() {
    const x = X(), s = x.sc; let h = `<p class="lead">🚨 ความปลอดภัย · ข้อเสนอพิเศษ</p>`;
    if (window.Evt170.outage()) h += `<div class="card" style="grid-template-columns:1fr"><div class="cb"><p class="bad">⚠️ ระบบแอปธนาคารขัดข้อง จ่ายผ่านแอป/พร้อมเพย์ไม่ได้ จะกลับมาใช้ได้เร็วๆ นี้</p></div></div>`;
    if (window.Evt170.atmOut()) h += `<div class="card" style="grid-template-columns:1fr"><div class="cb"><p class="bad">🏧 ตู้ ATM เงินสดหมดวันนี้ ถอนเงินที่ตู้ไม่ได้ ใช้เคาน์เตอร์สาขาหรือบัตรแทน</p></div></div>`;
    h += `<h5>🛡️ ศูนย์ความปลอดภัย</h5>`;
    if (s && s.st === 'open') h += `<div class="card" style="grid-template-columns:1fr;border:2px solid #ff8a65"><div class="cb"><p>${s.k === 'fraud' ? `⚠️ มีรายการบัตรเดบิต <b>${bS(s.amt)}</b> ที่ร้านค้าออนไลน์ต่างประเทศ (${RD(s.day)}) คุณเป็นคนทำรายการหรือไม่?` : E(SC[s.k].t)}</p><div class="row" style="flex-wrap:wrap">${s.k === 'fraud' ? `<button class="btn" data-a="s163scam" data-v="dispute">ไม่ใช่ฉัน โต้แย้งรายการ</button><button class="btn ghost" data-a="s163scam" data-v="ignore">ปล่อยผ่าน</button>` : SC[s.k].ch.map(c => `<button class="btn ${c[2] === 'good' ? '' : 'ghost'}" data-a="s163scam" data-v="${c[0]}">${E(c[1])}</button>`).join('')}</div></div></div>`;
    else if (s && s.st === 'lost') h += `<div class="card" style="grid-template-columns:1fr;border:2px solid #ef5350"><div class="cb"><p class="bad">🚨 คุณเสียเงิน ${bS(s.lost)} ให้มิจฉาชีพ</p><p class="dim">แจ้งธนาคารให้อายัดบัญชีปลายทาง: ถ้าแจ้งภายใน 1 วันมีโอกาสได้คืนบางส่วนมากกว่า</p><div class="row"><button class="btn" data-a="s163scamrec" ${s.rec ? 'disabled' : ''}>📞 แจ้งอายัด/ติดตามเงิน</button></div></div></div>`;
    else if (s && s.st === 'disputing') h += `<div class="card" style="grid-template-columns:1fr"><div class="cb"><p>📨 กำลังตรวจสอบรายการโต้แย้ง ${bS(s.amt)} · จะทราบผลวันที่ ${RD(s.disp.due)}</p></div></div>`;
    else h += '<p class="dim">ไม่มีเรื่องที่ต้องตัดสินใจ · ระวังข้อความ/สายโทรศัพท์แปลกๆ ธนาคารไม่ขอรหัส OTP หรือให้โอนเงินทางโทรศัพท์</p>';
    if (x.scH.length) h += `<p class="dim">ประวัติ: ${x.scH.slice(0, 5).map(q => `${RD(q.d)} ${({ sms: 'SMS หลอกลวง', call: 'สายหลอกลวง', otp: 'หลอกขอ OTP', fraud: 'ตัดบัตรเดบิต' }[q.k] || '')}: ${E(q.r)}`).join(' · ')}</p>`;
    h += `<div class="row"><span class="dim">เหตุการณ์มิจฉาชีพ: <b>${x.cfg.scam === 0 ? 'ปิด' : 'เปิด'}</b></span><button class="btn ${x.cfg.scam === 0 ? '' : 'ghost'}" style="${sb}" data-a="s163scamset" data-v="on">เปิด</button><button class="btn ${x.cfg.scam === 0 ? 'ghost' : ''}" style="${sb}" data-a="s163scamset" data-v="off">ปิด</button></div>`;
    h += `<h5>🤵 ข้อเสนอจากผู้จัดการธนาคาร</h5>` + (x.off.length ? x.off.map(o => `<div class="card" style="grid-template-columns:1fr"><div class="cb"><h4>${E(o.t)}</h4><p class="dim">${E(o.txt)} · หมดเขต ${RD(o.exp)}</p><div class="row"><button class="btn" style="${sb}" data-a="s163offer" data-v="${o.k}">${o.k === 'tip' ? 'รับทราบ' : 'รับสิทธิ์'}</button></div></div></div>`).join('') : '<p class="dim">ผู้จัดการจะส่งข้อเสนอให้ทุกต้นเดือน ตามฐานะการเงินและพฤติกรรมของคุณ</p>');
    return h;
  }
  const T = ['💱 แลกเงิน/บัญชีพิเศษ', '📜 ตั๋วเงิน/ใบแจ้งยอด/ภาษี', '🚨 ความปลอดภัย/ข้อเสนอ'];
  { const _open = UI.open.bind(UI);
    UI.open = function (title, tabs, render, opts) {
      if (Array.isArray(tabs) && !tabs.includes(T[0])) {
        const ok = (/^ธนาคารสุขใจ (สาขา|สำนักงาน)/.test(String(title)) && tabs.length >= 2) || (title === '📱 แอปธนาคารสุขใจ' && tabs.length >= 6);
        if (ok) { const base = tabs.length, r0 = render; tabs = tabs.concat(T); render = t => (t === base ? tabFx() : t === base + 1 ? tabDoc() : t === base + 2 ? tabSafe() : r0(t)); }
      }
      return _open(title, tabs, render, opts);
    }; }
  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { closeMonth(); rollEvents(); scamRoll(); } catch (e) { console.warn('v170', e); } return r; }; }
  window.Bank170 = { X, tabFx, tabDoc, tabSafe, closeMonth, monthly, scamRoll, rollEvents, genOffers, fxBuy, fxSell };
});
