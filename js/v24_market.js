'use strict';
// ---------- v24_market: ตลาดหลักทรัพย์สุขใจ (IPO, ซื้อขาย T+2, ปันผล, ซื้อหุ้นคืน, ดัชนี) + ระบบการศึกษา (ม.ปลาย ปวช. ปวส. ป.ตรี ป.โท ป.เอก) ----------
V23.add('market24', () => {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), rnd = Math.random;
  const gauss = () => (rnd() + rnd() + rnd() - 1.5) * 2;
  const pct = (v, d = 1) => (v >= 0 ? '+' : '') + (v * 100).toFixed(d) + '%';
  const wd = (d = S.day) => (d - 1) % 7;                         // 0 = Monday
  const DAYN = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
  const hh = () => S.time / 60;
  const testOn = () => typeof TestMode !== 'undefined' && TestMode.on();
  const hm = h => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;

  // =====================================================================================================
  //  PART 1 — STOCK EXCHANGE
  // =====================================================================================================
  const SEC = {
    'เกษตร': { b: 0.7, rate: -0.2, pe: 11 }, 'ธนาคาร': { b: 1.0, rate: 0.6, pe: 8 }, 'พลังงาน': { b: 1.1, rate: 0, pe: 9 },
    'ยานยนต์': { b: 1.3, rate: -0.5, pe: 14 }, 'เทคโนโลยี': { b: 1.5, rate: -0.7, pe: 22 }, 'ค้าปลีก': { b: 0.9, rate: -0.3, pe: 15 },
    'อาหาร': { b: 0.6, rate: -0.1, pe: 13 }, 'ก่อสร้าง': { b: 1.2, rate: -0.6, pe: 10 },
  };
  const TYPE_SEC = { it: 'เทคโนโลยี', sec: 'เทคโนโลยี', dc: 'เทคโนโลยี', solar: 'พลังงาน', ev: 'พลังงาน', cafe: 'อาหาร', food: 'อาหาร', logistics: 'ยานยนต์' };
  const SHARES0 = { SKJ: 300, TTB: 900, PPE: 700, EVX: 250, CLD: 150, MRT: 500, FDX: 400, CON: 800 };    // ล้านหุ้น
  const EVT = [
    { t: 'ราคาน้ำมันโลกปรับตัวสูงขึ้น ต้นทุนขนส่งเพิ่ม', e: { 'พลังงาน': 0.025, 'ยานยนต์': -0.012, 'อาหาร': -0.006 } },
    { t: 'ราคาน้ำมันโลกลดลง ต้นทุนการผลิตเบาลง', e: { 'พลังงาน': -0.02, 'ยานยนต์': 0.01, 'อาหาร': 0.006 } },
    { t: 'ส่งออกสินค้าเกษตรขยายตัวดี', e: { 'เกษตร': 0.02, 'อาหาร': 0.01 } },
    { t: 'นักท่องเที่ยวต่างชาติเพิ่มขึ้น หนุนค้าปลีกและร้านอาหาร', e: { 'ค้าปลีก': 0.02, 'อาหาร': 0.01 } },
    { t: 'รัฐบาลอนุมัติงบลงทุนโครงสร้างพื้นฐาน', e: { 'ก่อสร้าง': 0.03, 'พลังงาน': 0.01 } },
    { t: 'ภาครัฐออกมาตรการสนับสนุนรถยนต์ไฟฟ้า', e: { 'ยานยนต์': 0.025, 'พลังงาน': 0.008 } },
    { t: 'เกิดเหตุโจมตีทางไซเบอร์ในภาคการเงิน ธุรกิจความปลอดภัยไอทีได้อานิสงส์', e: { 'ธนาคาร': -0.015, 'เทคโนโลยี': 0.01 } },
    { t: 'ดัชนีความเชื่อมั่นผู้บริโภคสูงกว่าคาด', m: 0.01 },
    { t: 'ตลาดโลกผันผวน นักลงทุนต่างชาติขายสุทธิ', m: -0.015 },
    { t: 'ตัวเลข GDP ขยายตัวเหนือคาด', m: 0.012 },
    { t: 'เงินเฟ้อสูงกว่าคาด ธนาคารได้ประโยชน์จากส่วนต่างดอกเบี้ย', m: -0.01, e: { 'ธนาคาร': 0.006 } },
  ];
  const tickSz = p => { const t = p < 2 ? 0.01 : p < 5 ? 0.02 : p < 10 ? 0.05 : p < 25 ? 0.1 : p < 50 ? 0.25 : p < 100 ? 0.5 : p < 200 ? 1 : 2; return t; };
  const tkRound = p => { const t = tickSz(p); return Math.max(0.01, +(Math.round(p / t) * t).toFixed(2)); };
  const holiday = d => !!(window.Cal24 && typeof Cal24.isHoliday === 'function' && Cal24.isHoliday(d));
  const tradingDay = (d = S.day) => wd(d) < 5 && !holiday(d);
  const addBiz = (d, n) => { while (n > 0) { d++; if (tradingDay(d)) n--; } return d; };
  const nextTrading = d => { do d++; while (!tradingDay(d)); return d; };
  const mktOpen = () => { if (!tradingDay()) return false; const h = hh(); return (h >= 10 && h < 12.5) || (h >= 14.5 && h < 16.5); };
  const sessionText = () => {
    const h = hh();
    if (!tradingDay()) return `ตลาดปิด (${wd() >= 5 ? 'วันหยุดสุดสัปดาห์' : 'วันหยุดนักขัตฤกษ์'}) · เปิดอีกครั้ง ${DAYN[wd(nextTrading(S.day))]}ที่ ${nextTrading(S.day)} เวลา 10:00`;
    if (mktOpen()) return `🟢 ตลาดเปิด (รอบ ${h < 13 ? 'เช้า 10:00–12:30' : 'บ่าย 14:30–16:30'})`;
    if (h < 10) return '🟠 ก่อนเปิดตลาด (เปิด 10:00) · คำสั่งที่ส่งตอนนี้จะเข้าคิวเช้านี้';
    if (h < 14.5 && h >= 12.5) return '🟠 พักเที่ยง (เปิดรอบบ่าย 14:30)';
    return '🔴 ตลาดปิดแล้ววันนี้ · คำสั่งที่ส่งตอนนี้จะเข้าคิววันทำการถัดไป';
  };

  const st = () => {
    const m = S.mkt24 = S.mkt24 || {};
    m.sent = m.sent ?? 0; m.rate = m.rate ?? 2.0; m.nextBot = m.nextBot || S.day + 42;
    m.idx = m.idx || []; m.news = m.news || []; m.orders = m.orders || []; m.pending = m.pending || [];
    m.trades = m.trades || []; m.rlz = m.rlz || 0; m.fees = m.fees || 0; m.oid = m.oid || 0; m.divs = m.divs || 0;
    return m;
  };
  const stk = () => Stock.st();
  const cos = () => Company.list().filter(c => c.listed);
  const coOf = k => String(k).startsWith('co:') ? Company.get(+String(k).slice(3)) : null;
  const secOf = k => { const c = coOf(k); return c ? (TYPE_SEC[c.type] || 'เทคโนโลยี') : STOCKS[k].sec; };
  const nameOf = k => { const c = coOf(k); return c ? c.name : STOCKS[k].n; };
  const symOf = k => { const c = coOf(k); return c ? 'CO' + c.id : k; };
  const priceOf = k => { const c = coOf(k); return c ? c.px : stk().px[k]; };
  const prevOf = k => { const c = coOf(k); const h = c ? (c.mk && c.mk.h) : stk().hist[k]; return h && h.length > 1 ? h[h.length - 2] : priceOf(k); };
  const holdOf = k => { const c = coOf(k); return c ? (c.listed ? Math.round((c.mine ?? 1) * c.shares) : 0) : (stk().hist && stk().hold[k]) || 0; };
  const lockedOf = k => st().orders.filter(o => o.k === k && o.side === 'S').reduce((a, o) => a + o.qty, 0);
  const sharesOut = k => { const c = coOf(k); return c ? c.shares : SHARES0[k] * 1e6; };
  const blackout = c => ((S.day - 1) % 21) >= 14;
  const feeOf = v => Stock.fee(v);
  const allKeys = () => Object.keys(STOCKS).concat(cos().map(c => 'co:' + c.id));

  // ----- market index (market-cap weighted, base 1000, divisor adjusted when a company lists / delists) -----
  const capSum = () => allKeys().reduce((a, k) => a + priceOf(k) * sharesOut(k), 0);
  const indexNow = () => { const m = st(); const l = m.idx[m.idx.length - 1]; return l ? l.v : 1000; };
  const updateIndex = () => {
    const m = st(), cap = capSum();
    if (!m.div) { m.div = cap / 1000; m.keys = allKeys().join(','); }
    const keys = allKeys().join(',');
    if (keys !== m.keys) { m.div = cap / indexNow(); m.keys = keys; }
    m.idx.push({ d: S.day, v: +(cap / m.div).toFixed(2) }); if (m.idx.length > 40) m.idx.shift();
  };
  const idxChg = () => { const a = st().idx; return a.length > 1 ? a[a.length - 1].v / a[a.length - 2].v - 1 : 0; };

  // ----- company valuation, driven by the real books of the player's company + market sentiment -----
  const cmk = c => { c.mk = c.mk || {}; const k = c.mk; k.h = k.h || (c.px ? [c.px] : []); k.q = k.q || []; k.qBase = k.qBase ?? c.ytd; k.lastYtd = k.lastYtd ?? c.ytd; k.divs = k.divs || 0; k.payout = k.payout ?? 0.3; return k; };
  const earnEst = c => {
    const k = cmk(c), prog = (((S.day - 1) % 21) + 1) / 21, curQ = c.ytd - k.qBase, run = curQ / Math.max(0.25, prog);
    const hist = k.q.slice(-4), avg = hist.length ? hist.reduce((a, b) => a + b, 0) / hist.length : run * 0.8;
    return (avg * 0.6 + run * 0.4) * 4;
  };
  const fairOf = c => { const E = Math.max(0, earnEst(c)), pe = (SEC[TYPE_SEC[c.type] || 'เทคโนโลยี'].pe) * (k => k.board === 'SET' ? 1.1 : 1)(cmk(c)); return Math.max(0.3, (E * pe + Math.max(0, c.cash) * 0.6) / (c.shares || Math.round(c.paid))) * (1 + 0.1 * st().sent); };

  // ----- news -----
  const news = (t, sec, eff) => { const m = st(); m.news.unshift({ d: S.day, t, sec, eff }); if (m.news.length > 40) m.news.length = 40; Phone.msg('ข่าวตลาดหลักทรัพย์', t + (eff ? ` (${eff})` : ''), true); };

  // ----- daily engine: runs after the company books close (Stock.day is called from Company.day) -----
  Stock.day = function () {
    const m = st(), s = stk(), trade = tradingDay();
    if (!trade) { settle(); return; }
    // sentiment: mean reverting, nudged by news
    m.sent = clamp(m.sent * 0.92 + gauss() * 0.12, -1, 1);
    const shock = {}; let mk = (m.sent * 0.004 + gauss() * 0.006);
    const add = (sec, v) => { shock[sec] = (shock[sec] || 0) + v; };
    // real conditions in the game world move the market
    const w = S.weather && S.weather.type;
    if (w === 'storm') { add('เกษตร', -0.015); add('ก่อสร้าง', -0.006); news('พายุเข้า ผลผลิตเกษตรและงานก่อสร้างหยุดชะงัก', 'เกษตร', 'เกษตร −1.5%'); }
    else if (w === 'rain') add('เกษตร', 0.004);
    if (typeof Power !== 'undefined' && Power.st && Power.st().out > 0) add('พลังงาน', 0.01);
    if (typeof Fest !== 'undefined' && Fest.today && Fest.today()) { add('ค้าปลีก', 0.015); add('อาหาร', 0.01); news('เทศกาลวันนี้ ยอดจับจ่ายคึกคัก', 'ค้าปลีก', 'ค้าปลีก +1.5%'); }
    // policy-rate meeting every 6 weeks
    let dRate = 0;
    if (S.day >= m.nextBot) {
      m.nextBot = S.day + 42; const r = rnd(); dRate = r < 0.25 ? -0.25 : r < 0.75 ? 0 : 0.25; m.rate = Math.max(0.25, +(m.rate + dRate).toFixed(2));
      news(`คณะกรรมการนโยบายการเงินประชุม ${dRate ? (dRate < 0 ? 'ลด' : 'ขึ้น') + 'ดอกเบี้ยนโยบาย 0.25% เป็น ' + m.rate.toFixed(2) + '%' : 'คงดอกเบี้ยนโยบายที่ ' + m.rate.toFixed(2) + '%'}`, 'ธนาคาร', dRate ? 'หมวดธนาคาร ' + (dRate > 0 ? '+' : '−') : '');
    }
    if (rnd() < 0.3) {
      const e = EVT[(rnd() * EVT.length) | 0];
      if (e.m) { mk += e.m; m.sent = clamp(m.sent + e.m * 12, -1, 1); }
      for (const k in (e.e || {})) add(k, e.e[k]);
      news(e.t, Object.keys(e.e || {})[0] || '', Object.entries(e.e || {}).map(([k, v]) => `${k} ${pct(v)}`).join(' · ') || (e.m ? 'ตลาดโดยรวม ' + pct(e.m) : ''));
    }
    const idio = rnd() < 0.25 ? U.pick(Object.keys(STOCKS)) : null;
    for (const k in STOCKS) {
      const X = STOCKS[k], sc = SEC[X.sec], px0 = s.px[k];
      let r = sc.b * mk + (shock[X.sec] || 0) + sc.rate * dRate * 0.05 + gauss() * 0.012 + 0.015 * (X.p * (1 + 0.0004 * S.day) / px0 - 1);
      if (k === idio) { const j = (rnd() < 0.5 ? -1 : 1) * (0.03 + rnd() * 0.06); r += j; news(`${X.n} ประกาศ${j > 0 ? 'ผลประกอบการดีกว่าคาด 📈' : 'ผลประกอบการต่ำกว่าคาด 📉'}`, X.sec, pct(j)); }
      r = clamp(r, -0.3, 0.3); s.px[k] = tkRound(Math.max(0.5, px0 * (1 + r)));
      (s.hist[k] = s.hist[k] || []).push(s.px[k]); if (s.hist[k].length > 30) s.hist[k].shift();
    }
    for (const c of cos()) {
      const k = cmk(c), fair = fairOf(c), sh = shock[TYPE_SEC[c.type] || 'เทคโนโลยี'] || 0;
      let r = 0.25 * (fair / c.px - 1) + SEC[TYPE_SEC[c.type] || 'เทคโนโลยี'].b * mk + sh + gauss() * 0.012;
      if (k.pop) { r += k.pop; k.pop = 0; }
      c.px = tkRound(Math.max(0.3, c.px * (1 + clamp(r, -0.3, 0.3)))); k.h.push(c.px); if (k.h.length > 30) k.h.shift(); k.lastYtd = c.ytd;
    }
    updateIndex(); earnings(); settle(); execAll();
  };
  const origWeek = Stock.week.bind(Stock);
  Stock.week = function () { try { origWeek(); } catch (e) { console.warn('Stock.week', e); } };

  // ----- quarterly earnings of the player's listed companies -----
  const earnings = () => {
    if ((S.day - 1) % 21 !== 0) return;
    for (const c of cos()) {
      const k = cmk(c), profit = Math.round((c.ytd < k.lastYtd ? k.lastYtd : c.ytd) - k.qBase), prev = k.q.length ? k.q[k.q.length - 1] : null;
      k.q.push(profit); if (k.q.length > 8) k.q.shift(); k.qBase = c.ytd < k.lastYtd ? c.ytd : c.ytd;
      const base = prev === null ? Math.max(1, Math.abs(profit)) : Math.max(1e5, Math.abs(prev)), surprise = clamp((profit - (prev ?? profit)) / base, -1, 1);
      const jump = clamp(0.15 * surprise, -0.1, 0.1); c.px = tkRound(Math.max(0.3, c.px * (1 + jump))); k.h[k.h.length - 1] = c.px;
      news(`${c.name} ประกาศงบไตรมาส กำไรสุทธิ ${baht(profit)} ${prev === null ? '' : profit >= prev ? '(เพิ่มขึ้น)' : '(ลดลง)'}`, TYPE_SEC[c.type], `หุ้น ${pct(jump)}`);
      // dividend per the board's payout policy
      const tot = Math.round(Math.min(Math.max(0, profit) * k.payout, Math.max(0, c.cash) * 0.5));
      if (tot > 0 && k.payout > 0) {
        c.cash -= tot; k.divs += tot; const mine = Math.round(tot * (c.mine ?? 1) * 0.9);
        if (mine > 0) { earn(mine); Bank2.income('เงินปันผลจาก ' + c.name + ' (หัก 10%)', mine); st().divs += mine; Bank2.log('ปันผล ' + c.name, mine); }
        Phone.msg('ตลาดหลักทรัพย์สุขใจ', `${c.name} จ่ายเงินปันผลรวม ${baht(tot)} (${(tot / c.shares).toFixed(3)} ฿/หุ้น) คุณได้รับสุทธิ ${baht(mine)} หลังหักภาษี ณ ที่จ่าย 10%`, false);
      }
    }
  };

  // ----- orders, execution and T+2 settlement -----
  const settle = () => {
    const m = st(); const rest = [];
    for (const p of m.pending) { if (S.day >= p.d) { earn(p.amt); try { if (window.Flow171) window.Flow171.in(p.amt, 'รับเงินขายหุ้น ' + p.sym); } catch (e) { } Phone.msg('บริษัทหลักทรัพย์สุขใจ', `รับเงินขาย ${p.sym} ครบกำหนดชำระ T+2: ${baht(p.amt)}`, true); } else rest.push(p); }
    m.pending = rest;
  };
  const cancel = (o, why) => {
    const m = st(); m.orders = m.orders.filter(x => x !== o);
    if (o.side === 'B') S.money += o.esc;
    if (why) UI.toast(`ยกเลิกคำสั่ง ${symOf(o.k)}: ${why}`, '📈');
  };
  const fill = o => {
    if (!tradingDay()) return false;
    const k = o.k, c = coOf(k), px = priceOf(k); if (!px || (c && !c.listed)) { cancel(o, 'หลักทรัพย์ไม่อยู่ในตลาดแล้ว'); return true; }
    if (o.type === 'LMT' && (o.side === 'B' ? px > o.lim : px < o.lim)) return false;
    const v = Math.round(o.qty * px), f = feeOf(v), m = st(), s = stk();
    if (o.side === 'B') {
      S.money += o.esc; o.esc = 0;
      if (c && o.qty > c.shares * (1 - (c.mine ?? 1)) * 0.95) { m.orders = m.orders.filter(x => x !== o); UI.toast(`หุ้น ${symOf(k)} ในตลาดมีไม่พอ`, '📈'); return true; }
      if (S.money < v + f) { m.orders = m.orders.filter(x => x !== o); UI.toast(`คำสั่งซื้อ ${symOf(k)} ถูกปฏิเสธ: เงินไม่พอ`, '💸'); return true; }
      S.money -= v + f; m.fees += f; s.cost[k] = (s.cost[k] || 0) + v + f;
      if (c) c.mine = ((c.mine ?? 1) * c.shares + o.qty) / c.shares; else s.hold[k] = (s.hold[k] || 0) + o.qty;
      Bank2.log(`ซื้อหุ้น ${symOf(k)} ${U.fmt(o.qty)} @ ${px}`, -(v + f));
    } else {
      const have = holdOf(k); const q = Math.min(o.qty, have);
      if (q <= 0) { m.orders = m.orders.filter(x => x !== o); return true; }
      const val = Math.round(q * px), fee = feeOf(val), cost = (s.cost[k] || 0), avg = have ? cost / have : 0;
      m.rlz += (val - fee) - avg * q; s.cost[k] = Math.max(0, cost - avg * q); m.fees += fee;
      if (c) c.mine = ((c.mine ?? 1) * c.shares - q) / c.shares; else { s.hold[k] -= q; if (s.hold[k] <= 0) delete s.hold[k]; }
      m.pending.push({ d: addBiz(S.day, 2), amt: val - fee, sym: symOf(k) });
      Bank2.log(`ขายหุ้น ${symOf(k)} ${U.fmt(q)} @ ${px} (รับเงิน T+2)`, 0); Bank2.income('กำไรจากการขายหุ้น', Math.max(0, (val - fee) - avg * q));
    }
    m.orders = m.orders.filter(x => x !== o);
    m.trades.unshift({ d: S.day, k, side: o.side, q: o.qty, px, f }); if (m.trades.length > 30) m.trades.length = 30;
    Sfx.coin(); UI.toast(`${o.side === 'B' ? 'ซื้อ' : 'ขาย'} ${symOf(k)} ${U.fmt(o.qty)} หุ้น @ ${px.toFixed(2)} สำเร็จ`, '📈');
    return true;
  };
  // orders wait for the session: filled hourly while the market is open; if the player slept through whole sessions the broker fills them at the day's price
  const fillQueue = () => { for (const o of st().orders.slice()) fill(o); };
  const execAll = () => {
    const m = st(); if (!tradingDay()) return;
    for (const o of m.orders.slice()) { o.age = (o.age || 0) + 1; if (o.age >= 2 && fill(o)) continue; if (o.age > 5) cancel(o, 'หมดอายุ (ไม่ถูกจับคู่ภายใน 5 วันทำการ)'); }
  };
  const place = (k, side, qty, type, lim) => {
    const m = st(), c = coOf(k), px = priceOf(k); qty = Math.floor(qty);
    if (!px || qty <= 0) return;
    if (!testOn() && window.Gov24 && typeof Gov24.has === 'function' && !Gov24.has('idcard')) { UI.toast('เปิดบัญชีซื้อขายหลักทรัพย์ต้องใช้บัตรประชาชนที่ยังไม่หมดอายุ (ทำที่ที่ว่าการอำเภอ)', '🪪'); return; }
    if (c && blackout(c)) { UI.toast('ช่วงปิดงบการเงิน (7 วันก่อนประกาศงบ): ผู้บริหารห้ามซื้อขายหุ้นบริษัทตัวเอง (ผู้ถือหุ้นรู้ข้อมูลภายใน)', '🚫'); return; }
    if (side === 'B' && qty % 100) { UI.toast('ซื้อต้องเป็นจำนวนเต็มหน่วย 100 หุ้น (Board lot)', '📈'); return; }
    if (side === 'S') { const av = holdOf(k) - lockedOf(k); if (qty > av) { UI.toast(`มีหุ้นให้ขายไม่พอ (ขายได้ ${U.fmt(av)})`, '📈'); return; } if (qty % 100 && qty !== av) { UI.toast('ขายได้เป็นล็อต 100 หรือขายเศษทั้งหมดที่เหลือ', '📈'); return; } }
    lim = tkRound(lim || px);
    const ref = prevOf(k); if (type === 'LMT' && (lim > ref * 1.3 + 0.001 || lim < ref * 0.7 - 0.001)) { UI.toast(`ราคาจำกัดต้องอยู่ในช่วง ±30% ของราคาปิดก่อนหน้า (${(ref * 0.7).toFixed(2)}–${(ref * 1.3).toFixed(2)})`, '📈'); return; }
    let esc = 0;
    if (side === 'B') {
      const at = type === 'LMT' ? Math.min(lim, px * 1.1) : px * 1.1, need = Math.round(qty * at) + feeOf(qty * at);
      if (S.money < need) { UI.toast(`ต้องสำรองเงิน ${baht(need)} เพื่อส่งคำสั่งซื้อ`, '💸'); return; }
      S.money -= need; esc = need;
    }
    const o = { id: ++m.oid, k, side, qty, type, lim: type === 'LMT' ? lim : 0, esc, d: S.day, age: 0 };
    m.orders.push(o);
    if (mktOpen()) fill(o); else UI.toast(`รับคำสั่ง ${side === 'B' ? 'ซื้อ' : 'ขาย'} ${symOf(k)} แล้ว จะจับคู่เมื่อตลาดเปิด`, '🕒');
  };

  // ----- IPO (listing) process: audit → file with the SEC → offering → first trading day -----
  const BOARD = {
    mai: { n: 'ตลาด mai (บริษัทขนาดกลาง)', paid: 20e6, ytd: 3e6, staff: 10, rep: 0 },
    SET: { n: 'ตลาดหลัก SET', paid: 100e6, ytd: 10e6, staff: 20, rep: 60 },
  };
  const AUDIT_FEE = 800000, ADV_FEE = 1500000, SEC_FEE = 100000;
  const ipoChecks = (c, b) => {
    const B = BOARD[b], k = cmk(c);
    return [
      [c.st === 'open', 'บริษัทเปิดดำเนินการแล้ว (จดทะเบียนกรมพัฒนาธุรกิจการค้า เลขทะเบียน ' + (c.regNo || '-') + ')'],
      [c.paid >= B.paid, `ทุนชำระแล้ว ≥ ${baht(B.paid)} (มี ${baht(c.paid)})`],
      [c.ytd >= B.ytd, `กำไรสะสมปีนี้ ≥ ${baht(B.ytd)} (มี ${baht(Math.round(c.ytd))})`],
      [!!(c.lic && c.lic.vat), 'จดทะเบียนภาษีมูลค่าเพิ่ม (VAT) แล้ว'],
      [c.staff.length >= B.staff, `พนักงาน ≥ ${B.staff} คน (มี ${c.staff.length})`],
      [c.rep >= B.rep, `ชื่อเสียงบริษัท ≥ ${B.rep} (มี ${Math.round(c.rep)})`],
      [(c.cash || 0) >= AUDIT_FEE + ADV_FEE + SEC_FEE, `เงินสดบริษัท ≥ ${baht(AUDIT_FEE + ADV_FEE + SEC_FEE)} สำหรับค่าสอบบัญชี ที่ปรึกษา และ ก.ล.ต. (มี ${baht(Math.round(c.cash || 0))})`],
    ];
  };
  Stock.ipo = function (c) { if (c && !c.listed) { ipoUI.c = c.id; ipoUI.go(); } else if (c) { m24.open(2); } };
  const ipoDay = () => {
    for (const c of Company.list()) {
      const k = c.mk; if (!k || !k.stage || c.listed) continue;
      if (k.stage === 'audit' && S.day >= k.at) { k.stage = 'audited'; Phone.msg('สำนักงานสอบบัญชี สุขใจ แอสโซซิเอท', `ตรวจสอบงบการเงินของ ${c.name} เสร็จสิ้น ได้รับความเห็นแบบไม่มีเงื่อนไข ยื่นไฟลิ่งได้แล้ว`, true); }
      else if (k.stage === 'filed' && S.day >= k.at) {
        const bad = ipoChecks(c, k.board).filter(x => !x[0] && !String(x[1]).startsWith('เงินสด'));
        if (bad.length) { k.stage = 'audited'; Phone.msg('สำนักงาน ก.ล.ต.', `ไม่อนุมัติแบบไฟลิ่งของ ${c.name}: ${bad.map(x => x[1]).join(' · ')} (ค่าธรรมเนียมที่ชำระไม่คืน)`, true); }
        else { k.stage = 'offer'; k.at = S.day + 3; k.ipoPx = tkRound(Math.max(1, fairOf(c) * 0.9)); Phone.msg('สำนักงาน ก.ล.ต.', `อนุมัติไฟลิ่ง ${c.name} เข้าตลาด ${BOARD[k.board].n} เปิดจองซื้อหุ้น IPO ราคา ${k.ipoPx.toFixed(2)} ฿ ถึง${RD(k.at)}`, true); }
      } else if (k.stage === 'offer' && S.day >= k.at && tradingDay()) {
        const old = c.shares || Math.round(c.paid), add = Math.round(old / 3), net = Math.round(add * k.ipoPx * 0.97);
        c.shares = old + add; c.mine = (c.mine ?? 1) * old / c.shares; c.px = k.ipoPx; c.cash += net; c.listed = 1; k.stage = 'listed'; k.listDay = S.day; k.h = [k.ipoPx]; k.qBase = c.ytd; k.lastYtd = c.ytd; k.pop = rnd() * 0.12 + Math.max(0, st().sent) * 0.08;
        Life2.note(`${c.name} เข้าจดทะเบียนในตลาดหลักทรัพย์! 🔔`);
        Phone.msg('ตลาดหลักทรัพย์สุขใจ', `🔔 ${c.name} เริ่มซื้อขายวันนี้ ราคา IPO ${k.ipoPx.toFixed(2)} ฿ ระดมทุนสุทธิ ${baht(net)} (หักค่าธรรมเนียมผู้จัดจำหน่าย 3%) คุณถือหุ้น ${(c.mine * 100).toFixed(1)}%`, true);
        updateIndex();
      }
    }
  };
  const ipoUI = {
    c: 0,
    go() { UI.open('🔔 เข้าจดทะเบียนในตลาดหลักทรัพย์ (IPO)', null, () => this.html(), { wide: true }); },
    html() {
      const c = Company.get(this.c); if (!c) return '<p class="empty">ไม่พบบริษัท</p>'; const k = cmk(c); k.board = k.board || 'mai';
      const stage = k.stage || 'none', stTxt = { none: 'ยังไม่เริ่ม', audit: `ผู้สอบบัญชีกำลังตรวจงบ (เสร็จ${RD(k.at)})`, audited: 'ตรวจงบเสร็จ พร้อมยื่นไฟลิ่ง', filed: `ก.ล.ต. กำลังพิจารณา (ผล${RD(k.at)})`, offer: `เปิดจองซื้อหุ้น IPO ราคา ${k.ipoPx} ฿ (เริ่มซื้อขาย${RD(k.at)})` }[stage];
      const L = ipoChecks(c, k.board);
      return `<p class="lead">🏢 ${esc(c.name)} · ขั้นตอน: ① ผู้สอบบัญชีตรวจงบ ② ยื่นไฟลิ่งต่อ ก.ล.ต. พร้อมที่ปรึกษาทางการเงิน ③ เปิดจองซื้อหุ้น IPO ④ เริ่มซื้อขาย</p>
      <p class="lead"><b>สถานะ:</b> ${stTxt}</p>
      ${stage === 'none' || stage === 'audited' ? `<div class="row">${Object.keys(BOARD).map(b => `<button class="btn ${k.board === b ? '' : 'ghost'}" data-a="ipoboard" data-v="${b}">${BOARD[b].n}</button>`).join('')}</div>` : ''}
      ${L.map(x => `<div class="lead">${x[0] ? '✅' : '⬜'} ${esc(x[1])}</div>`).join('')}
      <div class="row">
        ${stage === 'none' ? `<button class="btn" data-a="ipoaudit" ${(c.cash || 0) < AUDIT_FEE ? 'disabled' : ''}>จ้างผู้สอบบัญชีตรวจงบ ${baht(AUDIT_FEE)} (3 วัน)</button>` : ''}
        ${stage === 'audited' ? `<button class="btn" data-a="ipofile" ${L.some(x => !x[0]) ? 'disabled' : ''}>ยื่นไฟลิ่ง + จ้างที่ปรึกษา ${baht(ADV_FEE + SEC_FEE)} (7 วัน)</button>` : ''}
        <button class="btn ghost" data-a="mkopen" data-v="2">ไปหน้าบริษัทของฉัน</button>
      </div>
      <p class="dim">ขายหุ้นเพิ่มทุน 25% ของหุ้นหลังเสนอขาย ผู้จัดจำหน่ายหัก 3% ราคา IPO กำหนดจากมูลค่าที่เหมาะสม ลด 10% และผู้ก่อตั้งต้องถือหุ้นต่อตามกฎ</p>`;
    },
  };
  Object.assign(UI.H, {
    ipoboard: d => { const c = Company.get(ipoUI.c); if (c) cmk(c).board = d.v; },
    ipoaudit: () => { const c = Company.get(ipoUI.c), k = cmk(c); if (c.cash < AUDIT_FEE) return; c.cash -= AUDIT_FEE; Company.book(c, 0, AUDIT_FEE); k.stage = 'audit'; k.at = S.day + 3; UI.toast('จ้างผู้สอบบัญชีรับอนุญาตตรวจงบแล้ว', '🧾'); },
    ipofile: () => { const c = Company.get(ipoUI.c), k = cmk(c), L = ipoChecks(c, k.board); if (L.some(x => !x[0])) return; c.cash -= ADV_FEE + SEC_FEE; Company.book(c, 0, ADV_FEE + SEC_FEE); k.stage = 'filed'; k.at = S.day + 7; UI.toast('ยื่นแบบไฟลิ่งต่อ ก.ล.ต. แล้ว', '📑'); },
  });

  // ----- company-side actions: payout policy, buy-back, secondary offering, delisting -----
  const co = {
    payout(id, p) { const c = Company.get(id); if (c) { cmk(c).payout = p; UI.toast(`นโยบายจ่ายปันผล ${Math.round(p * 100)}% ของกำไรสุทธิรายไตรมาส`, '💵'); } },
    buyback(id, p) {
      const c = Company.get(id), k = cmk(c); if (!c || !c.listed) return;
      if (S.day < (k.bbAt || 0)) { UI.toast(`ซื้อหุ้นคืนได้อีกครั้ง${RD(k.bbAt)}`, '📈'); return; }
      const q = Math.round(c.shares * p), cost = Math.round(q * c.px * 1.01);
      if ((c.cash || 0) < cost) { UI.toast(`เงินสดบริษัทไม่พอ (ต้อง ${baht(cost)})`, '💸'); return; }
      c.cash -= cost; Company.book(c, 0, 0); const old = c.shares; c.shares -= q; c.mine = (c.mine ?? 1) * old / c.shares; c.px = tkRound(c.px * (1 + p * 0.5)); k.h[k.h.length - 1] = c.px; k.bb = (k.bb || 0) + q; k.bbAt = S.day + 21;
      news(`${c.name} ซื้อหุ้นคืน ${U.fmt(q)} หุ้น (${(p * 100).toFixed(0)}%) ตัดหุ้นออกจากระบบ`, TYPE_SEC[c.type], `หุ้น ${pct(p * 0.5)}`);
    },
    secondary(id, p, pro) {
      const c = Company.get(id), k = cmk(c); if (!c || !c.listed) return;
      if (blackout(c)) { UI.toast('ช่วงปิดงบ: เสนอขายหุ้นเพิ่มทุนไม่ได้', '🚫'); return; }
      if (S.day < (k.soAt || 0)) { UI.toast(`เพิ่มทุนได้อีกครั้ง${RD(k.soAt)}`, '📈'); return; }
      const add = Math.round(c.shares * p), px = tkRound(c.px * 0.97), proceeds = Math.round(add * px * 0.98), mineQ = pro ? Math.round(add * (c.mine ?? 1)) : 0, mineCost = Math.round(mineQ * px);
      if (pro && S.money < mineCost) { UI.toast(`ใช้สิทธิจองซื้อต้องใช้เงิน ${baht(mineCost)}`, '💸'); return; }
      if (pro) { S.money -= mineCost; Bank2.log('จองซื้อหุ้นเพิ่มทุน ' + c.name, -mineCost); }
      const old = c.shares; c.cash += proceeds; c.shares += add; c.mine = ((c.mine ?? 1) * old + mineQ) / c.shares; c.px = tkRound(c.px * (1 - p * 0.25)); k.h[k.h.length - 1] = c.px; k.soAt = S.day + 84;
      news(`${c.name} เสนอขายหุ้นเพิ่มทุน ${U.fmt(add)} หุ้น ราคา ${px.toFixed(2)} ฿ ระดมทุนสุทธิ ${baht(proceeds)}`, TYPE_SEC[c.type], `หุ้น ${pct(-p * 0.25)}`);
    },
    delist(id) {
      const c = Company.get(id); if (!c || !c.listed) return; const pub = Math.round(c.shares * (1 - (c.mine ?? 1))), cost = Math.round(pub * c.px * 1.2);
      UI.confirm('เพิกถอนหุ้นออกจากตลาด', `ต้องทำคำเสนอซื้อหุ้นจากผู้ถือหุ้นรายย่อยทั้งหมด ${U.fmt(pub)} หุ้น ในราคา premium 20% รวม ${baht(cost)} (ใช้เงินส่วนตัว)`, 'ซื้อและเพิกถอน', () => {
        if (S.money < cost) { UI.toast('เงินไม่พอ', '💸'); return; } S.money -= cost; Bank2.log('Tender offer ' + c.name, -cost); c.listed = 0; c.mine = 1; c.mk.stage = null; delete stk().cost['co:' + c.id]; Life2.note(`${c.name} ออกจากตลาดหลักทรัพย์`); updateIndex();
      });
    },
  };
  Object.assign(UI.H, {
    mkpay: d => co.payout(d.v, +d.p), mkbb: d => co.buyback(d.v, +d.p), mkso: d => co.secondary(d.v, +d.p, d.pro === '1'), mkdel: d => co.delist(d.v),
    mkipo: d => { ipoUI.c = +d.v; ipoUI.go(); },
  });

  // ----- UI -----
  let tk = { k: 'SKJ', side: 'B', type: 'MKT', qty: 100, lim: 0 }, tab = 0;
  const spark = a => { if (!a || a.length < 2) return ''; const lo = Math.min(...a), hi = Math.max(...a), ch = '▁▂▃▄▅▆▇█'; return a.slice(-14).map(v => ch[Math.min(7, Math.floor((v - lo) / Math.max(1e-9, hi - lo) * 7.99))]).join(''); };
  const pl = (v, t) => `<span class="${v >= 0 ? 'good' : 'bad'}">${t}</span>`;
  const ticketHtml = () => {
    const px = priceOf(tk.k) || 0, held = holdOf(tk.k), lim = tk.lim || px;
    return `<div class="card"><div class="ci">🧾</div><div class="cb"><h4>ใบสั่ง ${tk.side === 'B' ? 'ซื้อ' : 'ขาย'} ${esc(nameOf(tk.k))}</h4>
      <p class="dim">ราคาล่าสุด ${px.toFixed(2)} ฿ · ถืออยู่ ${U.fmt(held)} หุ้น · ค่าคอม 0.157% + VAT 7% (ขั้นต่ำ 50 ฿) · ${tk.side === 'B' ? 'หักเงินทันที' : 'ได้รับเงิน T+2 (วันทำการที่ 2)'}</p>
      <div class="row"><button class="btn ${tk.side === 'B' ? '' : 'ghost'}" data-a="mktk" data-f="side" data-v="B">ซื้อ</button><button class="btn ${tk.side === 'S' ? '' : 'ghost'}" data-a="mktk" data-f="side" data-v="S">ขาย</button>
        <button class="btn ${tk.type === 'MKT' ? '' : 'ghost'}" data-a="mktk" data-f="type" data-v="MKT">ราคาตลาด</button><button class="btn ${tk.type === 'LMT' ? '' : 'ghost'}" data-a="mktk" data-f="type" data-v="LMT">ระบุราคา</button></div>
      <div class="row">${[100, 500, 1000, 5000, 20000].map(q => `<button class="btn ${tk.qty === q ? '' : 'ghost'}" data-a="mktk" data-f="qty" data-v="${q}">${U.fmt(q)}</button>`).join('')}${tk.side === 'S' && held ? `<button class="btn ghost" data-a="mktk" data-f="qty" data-v="${held}">ทั้งหมด</button>` : ''}</div>
      ${tk.type === 'LMT' ? `<div class="row"><button class="btn ghost" data-a="mktk" data-f="lim" data-v="-1">− ราคา</button><b>${tkRound(lim).toFixed(2)} ฿</b><button class="btn ghost" data-a="mktk" data-f="lim" data-v="1">+ ราคา</button></div>` : ''}
      <p class="lead">${U.fmt(tk.qty)} หุ้น ≈ ${baht(Math.round(tk.qty * (tk.type === 'LMT' ? tkRound(lim) : px)))}</p>
      <div class="row"><button class="btn" data-a="mksend">ส่งคำสั่ง</button><button class="btn ghost" data-a="mkclose">ปิดใบสั่ง</button></div></div></div>`;
  };
  const marketHtml = () => {
    const m = st(), s = stk(), idx = indexNow(), ch = idxChg(), sent = m.sent;
    const rows = allKeys().filter(k => !hook.keep || hook.keep(k)).sort((x, y) => (hook.cmp ? hook.cmp(x, y) : 0)).map(k => {
      const px = priceOf(k), pv = prevOf(k), c = coOf(k), ch1 = pv ? px / pv - 1 : 0, held = holdOf(k), X = STOCKS[k];
      const pe = c ? (Math.max(0, earnEst(c)) > 0 ? px * c.shares / earnEst(c) : 0) : (SEC[X.sec].pe * px / X.p), yd = c ? (px ? Math.max(0, earnEst(c)) * (cmk(c).payout || 0) / (px * c.shares) : 0) : X.div * X.p / px;
      return `<tr><td>${esc(nameOf(k))}<br><small class="dim">${symOf(k)} · ${secOf(k)}${c ? ' · ' + BOARD[cmk(c).board || 'mai'].n.split(' ')[0] + ' ' + (cmk(c).board || 'mai') : ''}</small></td><td>${px.toFixed(2)}<br><small class="dim">${spark(c ? cmk(c).h : s.hist[k])}</small></td><td class="${ch1 >= 0 ? 'good' : 'bad'}">${pct(ch1)}</td><td>${pe ? pe.toFixed(1) : '-'}</td><td>${(yd * 100).toFixed(1)}%</td><td>${held ? U.fmt(held) : '-'}</td><td><button class="btn ghost" data-a="mkpick" data-v="${k}" data-s="B">ซื้อ</button>${held ? `<button class="btn ghost" data-a="mkpick" data-v="${k}" data-s="S">ขาย</button>` : ''}</td></tr>`;
    }).join('');
    return `<p class="lead">${sessionText()}</p>${hook.bar ? hook.bar() : ''}
      <div class="card"><div class="ci">📊</div><div class="cb"><h4>ดัชนีสุขใจ SKJ-INDEX ${idx.toFixed(2)} ${pl(ch, pct(ch, 2))}</h4><p class="dim">${spark(m.idx.map(x => x.v))} · ความเชื่อมั่นตลาด ${sent > 0.3 ? '😀 บวก' : sent < -0.3 ? '😟 ลบ' : '😐 กลาง ๆ'} · ดอกเบี้ยนโยบาย ${m.rate.toFixed(2)}% (ประชุมครั้งต่อไป${RD(m.nextBot)}) · ราคาขึ้น/ลงสูงสุดต่อวัน ±30%</p></div></div>
      ${tk.k && tk.open ? ticketHtml() : ''}
      <table class="tbl"><tr><th>หลักทรัพย์</th><th>ราคา</th><th>วันนี้</th><th>P/E</th><th>ปันผล</th><th>ถือ</th><th></th></tr>${rows}</table>
      <p class="dim">ราคาเปลี่ยนวันละครั้งตอนเช้า วันทำการจันทร์–ศุกร์ ปิดวันหยุดสุดสัปดาห์${window.Cal24 ? ' และนักขัตฤกษ์' : ''} · ราคาหุ้นของบริษัทที่คุณจดทะเบียนอ้างอิงงบการเงินจริงในเกม</p>`;
  };
  const portHtml = () => {
    const m = st(), s = stk(); let tot = 0, cost = 0;
    const rows = allKeys().filter(k => holdOf(k) > 0).map(k => {
      const q = holdOf(k), px = priceOf(k), v = q * px, cs = s.cost[k] || 0; tot += v; cost += cs;
      return `<tr><td>${esc(nameOf(k))}</td><td>${U.fmt(q)}${lockedOf(k) ? `<br><small class="dim">รอขาย ${U.fmt(lockedOf(k))}</small>` : ''}</td><td>${q && cs ? (cs / q).toFixed(2) : '-'}</td><td>${px.toFixed(2)}</td><td>${baht(Math.round(v))}</td><td>${pl(v - cs, cs ? baht(Math.round(v - cs)) : '-')}</td></tr>`;
    }).join('');
    const pend = m.pending.reduce((a, p) => a + p.amt, 0), divs = Object.entries(Bank2.st().inc).filter(([k]) => k.startsWith('เงินปันผล')).reduce((a, [, v]) => a + v, 0);
    return `<p class="lead">💼 มูลค่าหุ้น ${baht(Math.round(tot))} · ต้นทุน ${baht(Math.round(cost))} · กำไร/ขาดทุนที่ยังไม่รับรู้ ${pl(tot - cost, baht(Math.round(tot - cost)))}<br>กำไรจากการขายที่รับรู้แล้ว ${pl(m.rlz, baht(Math.round(m.rlz)))} · ปันผลที่ได้รับ ${baht(Math.round(divs))} · ค่าธรรมเนียมนายหน้าสะสม ${baht(m.fees)}<br>เงินขายหุ้นรอรับ (T+2) ${baht(Math.round(pend))}</p>
      ${rows ? `<table class="tbl"><tr><th>หลักทรัพย์</th><th>จำนวน</th><th>ต้นทุน/หุ้น</th><th>ราคา</th><th>มูลค่า</th><th>กำไร</th></tr>${rows}</table>` : '<p class="empty">ยังไม่มีหุ้นในพอร์ต</p>'}
      <h5>🧾 คำสั่งที่รอจับคู่ (${m.orders.length})</h5>${m.orders.length ? m.orders.map(o => `<div class="lead">#${o.id} ${o.side === 'B' ? '🟢 ซื้อ' : '🔴 ขาย'} ${symOf(o.k)} ${U.fmt(o.qty)} หุ้น ${o.type === 'LMT' ? '@ ' + o.lim.toFixed(2) : 'ราคาตลาด'} <button class="btn ghost" data-a="mkcancel" data-v="${o.id}">ยกเลิก</button></div>`).join('') : '<p class="dim">ไม่มี</p>'}
      <h5>🕘 ประวัติการซื้อขาย</h5>${m.trades.length ? m.trades.slice(0, 10).map(t => `<div class="lead">${RD(t.d)} · ${t.side === 'B' ? 'ซื้อ' : 'ขาย'} ${symOf(t.k)} ${U.fmt(t.q)} @ ${t.px.toFixed(2)} (ค่าคอม ${baht(t.f)})</div>`).join('') : '<p class="dim">ยังไม่มี</p>'}
      <p class="dim">ภาษี: กำไรจากการขายหุ้นของบุคคลธรรมดาในตลาดหลักทรัพย์ได้รับยกเว้น · เงินปันผลถูกหักภาษี ณ ที่จ่าย 10%</p>`;
  };
  const myHtml = () => {
    const L = Company.list(); if (!L.length) return '<p class="empty">คุณยังไม่มีบริษัท · จดทะเบียนบริษัทได้ที่แอปบริษัท/พัฒนาธุรกิจการค้า แล้วเมื่อโตพอจึงนำเข้าตลาดหลักทรัพย์</p>';
    return L.map(c => {
      const k = cmk(c);
      if (!c.listed) return `<div class="card"><div class="ci">🏢</div><div class="cb"><h4>${esc(c.name)}</h4><p class="dim">ยังไม่จดทะเบียนในตลาด · สถานะ: ${k.stage ? k.stage : 'ยังไม่ยื่น'} · กำไรปีนี้ ${baht(Math.round(c.ytd))} · ทุนชำระแล้ว ${baht(c.paid || 0)}</p><div class="row"><button class="btn" data-a="mkipo" data-v="${c.id}" ${c.st !== 'open' ? 'disabled' : ''}>${k.stage ? 'ดูขั้นตอน IPO' : 'เริ่มขั้นตอน IPO'}</button></div></div></div>`;
      const mc = c.px * c.shares, nextQ = S.day + (21 - ((S.day - 1) % 21)), pol = k.payout;
      return `<div class="card"><div class="ci">🔔</div><div class="cb"><h4>${esc(c.name)} <small>${symOf('co:' + c.id)} · ${k.board || 'mai'}</small></h4>
        <p class="dim">ราคา ${c.px.toFixed(2)} ฿ ${spark(k.h)} · มูลค่าตลาด ${baht(Math.round(mc))} · หุ้นทั้งหมด ${U.fmt(c.shares)} · คุณถือ ${((c.mine ?? 1) * 100).toFixed(1)}% (มูลค่า ${baht(Math.round(mc * (c.mine ?? 1)))}) · ราคาเหมาะสมจากงบ ${fairOf(c).toFixed(2)} ฿</p>
        <p class="dim">กำไรรายไตรมาส: ${k.q.length ? k.q.slice(-4).map(baht).join(' · ') : 'ยังไม่ประกาศ'} · ประกาศงบไตรมาสถัดไป${RD(nextQ)}${blackout(c) ? ' · 🚫 ช่วงปิดงบ ห้ามซื้อขายหุ้นตัวเอง' : ''} · ปันผลสะสมที่บริษัทจ่าย ${baht(k.divs)} · ซื้อหุ้นคืนสะสม ${U.fmt(k.bb || 0)} หุ้น</p>
        <div class="row"><span class="dim">นโยบายปันผล:</span>${[0, 0.3, 0.5, 0.7].map(p => `<button class="btn ${Math.abs(pol - p) < 0.01 ? '' : 'ghost'}" data-a="mkpay" data-v="${c.id}" data-p="${p}">${p * 100}%</button>`).join('')}</div>
        <div class="row"><span class="dim">ซื้อหุ้นคืน:</span>${[0.01, 0.03, 0.05].map(p => `<button class="btn ghost" data-a="mkbb" data-v="${c.id}" data-p="${p}">${p * 100}%</button>`).join('')}<span class="dim">เพิ่มทุน:</span>${[0.05, 0.1].map(p => `<button class="btn ghost" data-a="mkso" data-v="${c.id}" data-p="${p}" data-pro="0">${p * 100}%</button><button class="btn ghost" data-a="mkso" data-v="${c.id}" data-p="${p}" data-pro="1">${p * 100}% + จองตามสิทธิ</button>`).join('')}</div>
        <div class="row"><button class="btn ghost" data-a="mkpick" data-v="co:${c.id}" data-s="B">ซื้อหุ้นบริษัทฉัน</button><button class="btn ghost" data-a="mkpick" data-v="co:${c.id}" data-s="S">ขาย</button><button class="btn danger" data-a="mkdel" data-v="${c.id}">เพิกถอนออกจากตลาด</button></div></div></div>`;
    }).join('');
  };
  const calHtml = () => {
    const m = st(), my = cos().map(c => `${esc(c.name)}: ประกาศงบ${RD(S.day + (21 - ((S.day - 1) % 21)))}`);
    return `<h5>📅 ปฏิทินตลาด</h5><p class="lead">เวลาซื้อขาย จันทร์–ศุกร์ 10:00–12:30 และ 14:30–16:30 · ${sessionText()}<br>ประชุมนโยบายการเงินครั้งต่อไป: ${RD(m.nextBot)} · งบไตรมาสทุก 21 วัน${my.length ? '<br>' + my.join('<br>') : ''}</p>
      <h5>📰 ข่าวตลาด</h5>${m.news.length ? m.news.slice(0, 14).map(n => `<div class="lead">${RD(n.d)} · ${esc(n.t)}${n.eff ? ` <small class="dim">(${esc(n.eff)})</small>` : ''}</div>`).join('') : '<p class="dim">ยังไม่มีข่าว ติดตามได้เมื่อตลาดเปิดทำการ</p>'}`;
  };
  const hook = {};   // v28_market plugs a sector filter / sort into the market table here
  const m24 = {
    open(t) { tab = t || 0; UI.open('📈 ตลาดหลักทรัพย์สุขใจ', ['ตลาด', 'พอร์ตของฉัน', 'บริษัทของฉัน', 'ข่าว & ปฏิทิน'], x => [marketHtml, portHtml, myHtml, calHtml][x](), { wide: true, tab }); },
    place, tradingDay, mktOpen, indexNow, holdOf, priceOf, st, addBiz, SEC, SHARES0, hook, symOf, secOf,
  };
  window.Mkt24 = m24;
  Object.assign(UI.H, {
    mkopen: d => { UI.close(); setTimeout(() => m24.open(+d.v), 0); },
    mkpick: d => { tk = { k: d.v, side: d.s, type: 'MKT', qty: 100, lim: 0, open: true }; if (d.s === 'S') tk.qty = Math.min(holdOf(d.v), 100) || 100; UI.cur.tab = 0; },
    mktk: d => {
      if (d.f === 'side') { tk.side = d.v; } else if (d.f === 'type') { tk.type = d.v; if (d.v === 'LMT' && !tk.lim) tk.lim = priceOf(tk.k); } else if (d.f === 'qty') tk.qty = +d.v;
      else if (d.f === 'lim') { const p = tk.lim || priceOf(tk.k); tk.lim = tkRound(p + (+d.v) * tickSz(p)); }
    },
    mksend: () => { place(tk.k, tk.side, tk.qty, tk.type, tk.lim); },
    mkclose: () => { tk.open = false; },
    mkcancel: d => { const o = st().orders.find(x => x.id === +d.v); if (o) cancel(o, 'ยกเลิกโดยผู้ใช้'); },
  });
  APPS.forEach(a => { if (a.id === 'stock') a.n = 'ตลาดหุ้น'; });
  { const _h = Smart.hour.bind(Smart); Smart.hour = function () { _h.apply(this, arguments); try { if (mktOpen()) fillQueue(); } catch (e) { console.warn('fillQueue', e); } }; }
  Phone.apps.stock = () => { setTimeout(() => { Phone.app = null; UI.close(); m24.open(0); }, 0); return ''; };
  { const _d = Company.day.bind(Company); Company.day = () => { _d(); try { ipoDay(); } catch (e) { console.warn('ipoDay', e); } try { Edu24.day(); } catch (e) { console.warn('Edu24.day', e); } }; }
  st(); { const s = stk(); for (const k in STOCKS) { if (!(k in s.px)) { s.px[k] = STOCKS[k].p; s.hist[k] = [STOCKS[k].p]; } } if (!st().idx.length) updateIndex(); }
  for (const c of cos()) cmk(c);

  // =====================================================================================================
  //  PART 2 — EDUCATION: ม.ปลาย · ปวช. · ปวส. · ปริญญาตรี · โท · เอก (compulsory subjects, timetable, attendance rule, exams, GPA, graduation)
  // =====================================================================================================
  // question banks: [question, [correct, wrong, wrong], 0] — answer order is shuffled when asked
  const QB = {
    thai: [['ประโยคใดใช้ราชาศัพท์ถูกต้อง', ['พระองค์ทรงเสวยพระกระยาหาร', 'พระองค์กินข้าว', 'พระองค์ทรงกินพระกระยาหาร']], ['ไตรยางศ์แบ่งอักษรเป็นกี่หมู่', ['3 หมู่', '2 หมู่', '4 หมู่']], ['สระในภาษาไทยมีทั้งหมดกี่รูป', ['21 รูป', '32 รูป', '44 รูป']], ['วรรณยุกต์ในภาษาไทยมีกี่เสียง', ['5 เสียง', '4 เสียง', '6 เสียง']], ['คำใดเป็นคำควบกล้ำแท้', ['กรอบ', 'คน', 'มา']], ['"น้ำท่วมปาก" หมายถึง', ['พูดไม่ออกเพราะเกรงกลัวหรืออึดอัดใจ', 'พูดมาก', 'ดื่มน้ำเยอะ']]],
    math: [['ร้อยละ 15 ของ 2,000 เท่ากับเท่าใด', ['300', '150', '200']], ['ถ้า x + 7 = 19 แล้ว x เท่ากับ', ['12', '26', '11']], ['พื้นที่สี่เหลี่ยมผืนผ้ากว้าง 6 ยาว 9 เท่ากับ', ['54', '30', '15']], ['ดอกเบี้ยคงที่ เงินต้น 10,000 บาท อัตรา 5% ต่อปี 1 ปี เป็นเงิน', ['500 บาท', '50 บาท', '5,000 บาท']], ['2 ยกกำลัง 5 เท่ากับ', ['32', '10', '25']], ['มุมภายในสามเหลี่ยมรวมกันเท่ากับ', ['180 องศา', '360 องศา', '90 องศา']], ['รากที่สองของ 144 คือ', ['12', '14', '72']]],
    sci: [['น้ำเดือดที่ความดันบรรยากาศปกติกี่องศาเซลเซียส', ['100', '90', '120']], ['พืชสังเคราะห์แสงได้น้ำตาลและก๊าซใด', ['ออกซิเจน', 'ไนโตรเจน', 'ฮีเลียม']], ['อวัยวะใดสูบฉีดเลือด', ['หัวใจ', 'ปอด', 'ตับ']], ['ดาวเคราะห์ที่ใกล้ดวงอาทิตย์ที่สุด', ['พุธ', 'ศุกร์', 'โลก']], ['ก๊าซที่มีมากที่สุดในอากาศ', ['ไนโตรเจน', 'ออกซิเจน', 'คาร์บอนไดออกไซด์']], ['แรงโน้มถ่วงของโลกดึงวัตถุเข้าหา', ['ศูนย์กลางโลก', 'ดวงจันทร์', 'ท้องฟ้า']]],
    soc: [['ประเทศไทยปกครองด้วยระบอบ', ['ประชาธิปไตยอันมีพระมหากษัตริย์ทรงเป็นประมุข', 'สาธารณรัฐ', 'เผด็จการทหาร']], ['รัฐธรรมนูญคือ', ['กฎหมายสูงสุดของประเทศ', 'ประกาศร้านค้า', 'ระเบียบโรงเรียน']], ['อาเซียนก่อตั้งเมื่อ พ.ศ.', ['2510', '2490', '2530']], ['เมื่ออุปสงค์เพิ่มขึ้น ราคาสินค้ามักจะ', ['สูงขึ้น', 'ลดลง', 'คงที่เสมอ']], ['วันที่ 5 ธันวาคม เป็นวัน', ['พ่อแห่งชาติ', 'แม่แห่งชาติ', 'เด็กแห่งชาติ']], ['เมืองหลวงของประเทศไทยคือ', ['กรุงเทพมหานคร', 'เชียงใหม่', 'ขอนแก่น']]],
    eng: [['She ___ to school every day.', ['goes', 'go', 'going']], ['The past tense of "buy" is', ['bought', 'buyed', 'buys']], ['"Thank you very much" แปลว่า', ['ขอบคุณมาก', 'ขอโทษ', 'สวัสดี']], ['Opposite of "hot" is', ['cold', 'warm', 'heat']], ['I ___ a student.', ['am', 'is', 'are']], ['Which word is a noun?', ['farmer', 'quickly', 'run']]],
    health: [['ผู้ใหญ่ควรออกกำลังกายระดับปานกลางอย่างน้อยสัปดาห์ละ', ['150 นาที', '30 นาที', '500 นาที']], ['ควรล้างมือด้วยสบู่อย่างน้อย', ['20 วินาที', '2 วินาที', '5 นาที']], ['อัตราการเต้นหัวใจขณะพักของผู้ใหญ่ปกติ', ['60–100 ครั้ง/นาที', '20–30 ครั้ง/นาที', '150–200 ครั้ง/นาที']], ['เบอร์แจ้งเหตุฉุกเฉินทางการแพทย์ของไทย', ['1669', '191', '1784']], ['ผักผลไม้ที่ควรกินต่อวันตามคำแนะนำ WHO อย่างน้อย', ['400 กรัม', '50 กรัม', '1 กิโลกรัม']]],
    phy: [['หน่วย SI ของแรงคือ', ['นิวตัน', 'จูล', 'วัตต์']], ['ความเร็ว = ระยะทาง ÷', ['เวลา', 'มวล', 'แรง']], ['กฎของโอห์ม', ['V = IR', 'F = ma', 'E = mc²']], ['แสงเดินทางด้วยความเร็วประมาณ', ['300,000 กม./วินาที', '3,000 กม./วินาที', '340 กม./วินาที']], ['พลังงานจลน์ขึ้นกับ', ['มวลและความเร็ว', 'สีของวัตถุ', 'อุณหภูมิห้อง']]],
    chem: [['สัญลักษณ์ธาตุของทองคำ', ['Au', 'Ag', 'Gd']], ['สูตรเคมีของน้ำ', ['H2O', 'CO2', 'NaCl']], ['สารละลายที่ pH ต่ำกว่า 7 เป็น', ['กรด', 'เบส', 'กลาง']], ['เลขอะตอมคือจำนวน', ['โปรตอน', 'นิวตรอน', 'โมเลกุล']], ['เกลือแกงคือ', ['NaCl', 'KCl', 'CaCO3']]],
    bio: [['หน่วยพื้นฐานของสิ่งมีชีวิต', ['เซลล์', 'อะตอม', 'โมเลกุล']], ['ไมโทคอนเดรียทำหน้าที่', ['สร้างพลังงานให้เซลล์', 'สร้างผนังเซลล์', 'เก็บน้ำ']], ['เลือดแดงนำก๊าซใดไปเลี้ยงร่างกาย', ['ออกซิเจน', 'ไนโตรเจน', 'ฮีเลียม']], ['DNA เป็นสารพันธุกรรมที่', ['เก็บข้อมูลลักษณะทางพันธุกรรม', 'ย่อยอาหาร', 'ลำเลียงน้ำ']]],
    art: [['"ขอบคุณ" ภาษาจีนกลางคือ', ['เซี่ยเซี่ย', 'หนีห่าว', 'ไจ้เจี้ยน']], ['"อรุณสวัสดิ์" ภาษาญี่ปุ่นคือ', ['โอฮาโย', 'ซาโยนาระ', 'อาริงาโตะ']], ['สีแดงผสมสีเหลืองได้สี', ['ส้ม', 'เขียว', 'ม่วง']], ['จังหวะ 4/4 มีกี่จังหวะต่อห้อง', ['4', '2', '3']], ['ผู้วาดภาพโมนาลิซา', ['เลโอนาร์โด ดา วินชี', 'ปิกัสโซ', 'แวนโก๊ะ']]],
    auto: [['เครื่องยนต์เบนซิน 4 จังหวะทำงานตามลำดับ', ['ดูด อัด ระเบิด คาย', 'อัด ดูด คาย ระเบิด', 'ระเบิด ดูด อัด คาย']], ['น้ำมันเครื่องมีหน้าที่หลัก', ['หล่อลื่นและระบายความร้อน', 'เพิ่มแรงเบรก', 'ล้างกระจก']], ['หัวเทียนใช้กับเครื่องยนต์', ['เบนซิน', 'ดีเซล', 'ไฟฟ้าล้วน']], ['ระบบเบรกส่วนใหญ่ส่งแรงด้วย', ['น้ำมันเบรก (ไฮดรอลิก)', 'น้ำเปล่า', 'ลมยาง']], ['ควรเช็กลมยางตอนที่ยางเป็นอย่างไร', ['เย็น', 'ร้อนจัดหลังวิ่งไกล', 'ไม่ต้องเช็ก']]],
    elec: [['ก่อนซ่อมวงจรไฟฟ้าต้องทำอะไร', ['ตัดไฟและล็อกเบรกเกอร์', 'ใส่ถุงมือผ้า', 'ทำตอนไฟยังมา']], ['หน่วยวัดกำลังไฟฟ้า', ['วัตต์', 'โอห์ม', 'แอมแปร์']], ['เบรกเกอร์ทำหน้าที่', ['ตัดวงจรเมื่อกระแสเกิน', 'เพิ่มแรงดัน', 'เก็บไฟ']], ['สายดินมีไว้เพื่อ', ['ให้ไฟรั่วไหลลงดินอย่างปลอดภัย', 'เพิ่มความเร็วไฟ', 'ประหยัดไฟ']], ['แรงดันไฟฟ้าตามบ้านในไทย', ['220 โวลต์', '110 โวลต์', '380 โวลต์']]],
    acct: [['สินทรัพย์ = หนี้สิน +', ['ส่วนของเจ้าของ', 'รายได้', 'ค่าใช้จ่าย']], ['ภาษีมูลค่าเพิ่ม (VAT) ของไทยอัตรา', ['7%', '10%', '3%']], ['งบที่แสดงรายได้และค่าใช้จ่ายคือ', ['งบกำไรขาดทุน', 'งบแสดงฐานะการเงิน', 'งบกระแสเงินสด']], ['บัญชีสินทรัพย์เพิ่มขึ้นบันทึกด้าน', ['เดบิต', 'เครดิต', 'ไม่บันทึก']], ['หลักการบัญชีคู่หมายถึง', ['ทุกรายการบันทึกเดบิตและเครดิตเท่ากัน', 'บันทึกสองครั้งเผื่อผิด', 'มีสองสมุด']]],
    comp: [['Git ใช้ทำอะไร', ['จัดการเวอร์ชันของโค้ด', 'ตัดต่อวิดีโอ', 'ป้องกันไวรัส']], ['ข้อมูล 8 บิตเท่ากับ', ['1 ไบต์', '1 กิโลไบต์', '1 เมกะไบต์']], ['HTTP คือ', ['โปรโตคอลถ่ายโอนเว็บ', 'ภาษาโปรแกรม', 'ระบบปฏิบัติการ']], ['รหัสผ่านที่ปลอดภัยกว่า', ['ผสมตัวอักษร ตัวเลข สัญลักษณ์ ยาว 12 ตัวขึ้นไป', '123456', 'ชื่อตัวเอง']], ['อัลกอริทึมคือ', ['ขั้นตอนการแก้ปัญหา', 'ชนิดของจอภาพ', 'ไวรัสคอมพิวเตอร์']]],
    food: [['เนื้อไก่ดิบควรเก็บที่อุณหภูมิ', ['ต่ำกว่า 5°C', 'อุณหภูมิห้อง', 'กลางแดด']], ['อาหารปรุงสุกควรอุ่นให้ร้อนถึงอย่างน้อย', ['70°C', '30°C', '40°C']], ['เขียงหั่นเนื้อดิบกับผักสุก', ['ควรแยกกัน', 'ใช้ร่วมได้', 'ล้างน้ำนิดหน่อย']], ['อาหารหลัก 5 หมู่ โปรตีนอยู่ในหมู่', ['1', '3', '5']], ['FIFO ในการจัดเก็บวัตถุดิบหมายถึง', ['เข้าก่อนออกก่อน', 'เข้าหลังออกก่อน', 'ไม่ต้องเก็บ']]],
    edu: [['การวัดผลที่ดีควร', ['หลากหลาย ทั้งงานและการสอบ', 'สอบอย่างเดียว', 'ดูแค่ความจำ']], ['ผู้เรียนเป็นศูนย์กลางหมายถึง', ['ผู้เรียนมีส่วนร่วมสร้างความรู้', 'ครูพูดอย่างเดียว', 'เน้นท่องจำ']], ['แผนการสอนที่ดีควรมี', ['วัตถุประสงค์ กิจกรรม การวัดผล', 'เฉพาะเนื้อหา', 'เฉพาะการบ้าน']], ['การเสริมแรงทางบวกคือ', ['ให้รางวัลเมื่อทำดี', 'ลงโทษเมื่อผิด', 'เพิกเฉย']], ['จรรยาบรรณครูข้อสำคัญ', ['ปฏิบัติต่อผู้เรียนเท่าเทียมและรักษาความลับ', 'เลือกที่รักมักที่ชัง', 'เรียกรับเงินจากผู้ปกครอง']]],
    nurse: [['ผู้ป่วยหมดสติ ไม่หายใจ ต้องทำอะไรก่อน', ['เรียกทีมฉุกเฉินและเริ่ม CPR', 'ให้ดื่มน้ำ', 'รอให้ฟื้นเอง']], ['ก่อนให้ยาต้องตรวจสอบ', ['ชื่อผู้ป่วย ชื่อยา ขนาด เวลา ทางให้ยา และประวัติแพ้ยา', 'สีกล่องยา', 'ราคายา']], ['อัตราการหายใจปกติของผู้ใหญ่', ['12–20 ครั้ง/นาที', '40–60 ครั้ง/นาที', '4–6 ครั้ง/นาที']], ['ความดันโลหิตปกติประมาณ', ['120/80 mmHg', '200/150 mmHg', '60/20 mmHg']], ['การล้างมือ 5 โอกาสของ WHO เพื่อ', ['ป้องกันการติดเชื้อในสถานพยาบาล', 'ประหยัดน้ำ', 'ความสวยงาม']]],
    engr: [['หน่วยของความเค้น (stress) คือ', ['ปาสกาล', 'โอห์ม', 'เฮิรตซ์']], ['วงจรอนุกรม กระแสไฟฟ้าในแต่ละจุด', ['เท่ากัน', 'แบ่งตามความต้านทาน', 'เป็นศูนย์']], ['เหล็กเสริมในคอนกรีตช่วยรับ', ['แรงดึง', 'แรงอัดเท่านั้น', 'ไม่ช่วยอะไร']], ['ค่าความปลอดภัย (Factor of Safety) ควร', ['มากกว่า 1', 'เท่ากับ 0', 'น้อยกว่า 1']], ['หน่วยของกำลัง', ['วัตต์', 'โวลต์', 'โอห์ม']]],
    biz: [['SWOT ใช้วิเคราะห์', ['จุดแข็ง จุดอ่อน โอกาส อุปสรรค', 'ราคาหุ้น', 'ภาษี']], ['กำไรขั้นต้น = รายได้ −', ['ต้นทุนขาย', 'ค่าใช้จ่ายทั้งหมด', 'ภาษี']], ['4P ของการตลาดคือ', ['Product Price Place Promotion', 'Plan Profit Price People', 'ไม่มีจริง']], ['จุดคุ้มทุนคือจุดที่', ['รายได้เท่ากับต้นทุนรวม', 'กำไรสูงสุด', 'ขาดทุนสูงสุด']], ['สภาพคล่องหมายถึง', ['ความสามารถชำระหนี้ระยะสั้น', 'กำไรต่อปี', 'จำนวนพนักงาน']]],
    law: [['หลักนิติธรรมคือ', ['ทุกคนอยู่ใต้กฎหมายเท่าเทียมกัน', 'ผู้มีอำนาจอยู่เหนือกฎหมาย', 'กฎหมายใช้เฉพาะคนจน']], ['อายุความฟ้องคดีแพ่งทั่วไปที่ไม่ได้กำหนดไว้เป็นอย่างอื่น', ['10 ปี', '1 เดือน', '100 ปี']], ['บุคคลบรรลุนิติภาวะเมื่ออายุ', ['20 ปีบริบูรณ์ (หรือสมรสตามเงื่อนไข)', '15 ปี', '25 ปี']], ['สัญญาซื้อขายที่ดินต้อง', ['ทำเป็นหนังสือและจดทะเบียนต่อเจ้าพนักงานที่ดิน', 'พูดปากเปล่าก็พอ', 'ส่งข้อความไลน์']], ['ผู้พิพากษาต้อง', ['เป็นกลางและให้โอกาสทั้งสองฝ่าย', 'ฟังฝ่ายเดียว', 'รับของขวัญจากคู่ความ']]],
    vet: [['อุณหภูมิร่างกายปกติของสุนัข', ['38–39°C', '30°C', '42°C']], ['วัคซีนพิษสุนัขบ้าฉีดเพื่อ', ['ป้องกันโรคพิษสุนัขบ้า', 'ลดน้ำหนัก', 'บำรุงขน']], ['สุนัขกินช็อกโกแลตเป็นอันตรายเพราะมี', ['ธีโอโบรมีน', 'น้ำตาลน้อย', 'วิตามินสูง']], ['ระยะตั้งท้องของแมวประมาณ', ['63–65 วัน', '10 วัน', '200 วัน']], ['โรคที่ติดต่อจากสัตว์สู่คนเรียกว่า', ['Zoonosis', 'Gastritis', 'Anemia']]],
    agri: [['ดินที่เหมาะกับพืชส่วนใหญ่มี pH ราว', ['6–7', '2–3', '10–12']], ['ปุ๋ย N-P-K ธาตุ N คือ', ['ไนโตรเจน', 'ฟอสฟอรัส', 'โพแทสเซียม']], ['การปลูกพืชหมุนเวียนช่วย', ['ลดโรคแมลงและบำรุงดิน', 'เพิ่มวัชพืช', 'ทำให้ดินแข็ง']], ['การให้น้ำแบบหยดเหมาะเพราะ', ['ประหยัดน้ำและให้ตรงจุด', 'ใช้น้ำมากที่สุด', 'ใช้ได้เฉพาะข้าว']], ['พืชตระกูลถั่วช่วยตรึงธาตุใดในดิน', ['ไนโตรเจน', 'เหล็ก', 'ทองแดง']]],
    research: [['สมมติฐานคือ', ['คำตอบชั่วคราวที่ทดสอบได้', 'ผลสรุปสุดท้าย', 'ความเห็นส่วนตัว']], ['การอ้างอิงแหล่งข้อมูลเพื่อ', ['ให้เครดิตและตรวจสอบได้', 'ให้เล่มยาวขึ้น', 'ปกปิดที่มา']], ['การคัดลอกผลงานผู้อื่นโดยไม่อ้างอิงเรียกว่า', ['การโจรกรรมทางวิชาการ', 'การวิจัย', 'การสังเคราะห์']], ['ตัวแปรต้นคือ', ['ตัวแปรที่ผู้วิจัยจัดกระทำ', 'ผลที่วัดได้', 'ค่าคงที่']], ['กลุ่มตัวอย่างขนาดใหญ่ขึ้นมักทำให้', ['ผลน่าเชื่อถือขึ้น', 'ผลไม่แน่นอน', 'ไม่มีผล']]],
    gen: [['ทักษะแห่งศตวรรษที่ 21 รวมถึง', ['การคิดวิเคราะห์และการทำงานร่วมกัน', 'การท่องจำอย่างเดียว', 'การหลีกเลี่ยงเทคโนโลยี']], ['ข่าวปลอมควรตรวจสอบโดย', ['เทียบหลายแหล่งที่เชื่อถือได้', 'แชร์ต่อทันที', 'เชื่อทุกครั้ง']], ['PDPA คือกฎหมายคุ้มครอง', ['ข้อมูลส่วนบุคคล', 'ทรัพย์สินทางปัญญา', 'การจราจร']], ['การจัดการเวลาที่ดี', ['จัดลำดับความสำคัญ', 'ผัดวันประกันพรุ่ง', 'ทำทุกอย่างพร้อมกัน']], ['เป้าหมายการพัฒนาที่ยั่งยืน (SDGs) มีกี่ข้อ', ['17', '10', '5']]],
  };
  const SJ = {};
  const sj = (id, n, bank, cr = 3, online = false) => { SJ[id] = { id, n, cr, bank, online }; return id; };
  // ----- ม.ปลาย -----
  for (let t = 1; t <= 3; t++) {
    const g = 'ม.' + (3 + t);
    sj('hs_th' + t, 'ภาษาไทย ' + g, 'thai'); sj('hs_ma' + t, 'คณิตศาสตร์ ' + g, 'math'); sj('hs_en' + t, 'ภาษาอังกฤษ ' + g, 'eng'); sj('hs_so' + t, 'สังคมศึกษา ' + g, 'soc'); sj('hs_pe' + t, 'สุขศึกษา-พลศึกษา ' + g, 'health', 1);
    sj('hs_ph' + t, 'ฟิสิกส์ ' + g, 'phy'); sj('hs_ch' + t, 'เคมี ' + g, 'chem'); sj('hs_bi' + t, 'ชีววิทยา ' + g, 'bio'); sj('hs_la' + t, 'ภาษาต่างประเทศที่ 2 ' + g, 'art'); sj('hs_ar' + t, 'ศิลปะ-ดนตรี ' + g, 'art', 1);
  }
  // ----- สายอาชีพ (ปวช. 9 วิชาชีพ + ปวส. 6 วิชาชีพ ต่อสาขา) -----
  const VOCM = {
    auto: { n: 'ช่างยนต์', b: 'auto', names: ['งานเครื่องยนต์เบนซินเบื้องต้น', 'งานไฟฟ้ารถยนต์', 'งานบำรุงรักษารถยนต์', 'ระบบส่งกำลัง', 'ระบบเบรกและช่วงล่าง', 'งานเครื่องยนต์ดีเซล', 'การวิเคราะห์และแก้ปัญหาเครื่องยนต์', 'ระบบปรับอากาศรถยนต์', 'ปฏิบัติงานอู่ซ่อมรถ', 'ระบบหัวฉีดอิเล็กทรอนิกส์', 'รถยนต์ไฟฟ้าและไฮบริด', 'การจัดการอู่ซ่อมรถ', 'ระบบ OBD และการวินิจฉัย', 'งานตัวถังและสี', 'โครงงานช่างยนต์'] },
    elec: { n: 'ช่างไฟฟ้ากำลัง', b: 'elec', names: ['วงจรไฟฟ้าเบื้องต้น', 'เครื่องมือวัดไฟฟ้า', 'งานติดตั้งไฟฟ้าอาคาร', 'มอเตอร์และหม้อแปลง', 'อิเล็กทรอนิกส์เบื้องต้น', 'การควบคุมมอเตอร์', 'การออกแบบระบบไฟฟ้าอาคาร', 'ความปลอดภัยทางไฟฟ้า', 'ปฏิบัติงานติดตั้งไฟฟ้า', 'ระบบไฟฟ้ากำลัง', 'โซลาร์เซลล์และพลังงานทดแทน', 'PLC และระบบอัตโนมัติ', 'การตรวจสอบและทดสอบระบบไฟฟ้า', 'การประมาณราคางานไฟฟ้า', 'โครงงานช่างไฟฟ้า'] },
    acct: { n: 'การบัญชี', b: 'acct', names: ['การบัญชีเบื้องต้น', 'การบัญชีร้านค้า', 'คอมพิวเตอร์ในงานบัญชี', 'การบัญชีสินค้า', 'ภาษีอากรเบื้องต้น', 'เอกสารทางการค้า', 'การบัญชีต้นทุนเบื้องต้น', 'การบัญชีเงินเดือน', 'ปฏิบัติงานสำนักงานบัญชี', 'การบัญชีบริษัทจำกัด', 'การบัญชีต้นทุน', 'ภาษีเงินได้นิติบุคคลและ VAT', 'การสอบบัญชีเบื้องต้น', 'โปรแกรมสำเร็จรูปทางการบัญชี', 'โครงงานการบัญชี'] },
    comp: { n: 'เทคโนโลยีสารสนเทศ', b: 'comp', names: ['พื้นฐานการเขียนโปรแกรม', 'การประกอบและซ่อมคอมพิวเตอร์', 'เว็บเพจเบื้องต้น', 'ฐานข้อมูลเบื้องต้น', 'ระบบเครือข่ายเบื้องต้น', 'สร้างแอปพลิเคชัน', 'การดูแลระบบสำนักงาน', 'ความมั่นคงปลอดภัยสารสนเทศ', 'ปฏิบัติงานด้านไอที', 'การเขียนโปรแกรมเชิงวัตถุ', 'ระบบเครือข่ายองค์กร', 'ระบบปฏิบัติการเซิร์ฟเวอร์', 'คลาวด์เบื้องต้น', 'การพัฒนาเว็บแอป', 'โครงงานคอมพิวเตอร์'] },
    food: { n: 'อาหารและโภชนาการ', b: 'food', names: ['สุขาภิบาลอาหาร', 'การเตรียมวัตถุดิบ', 'ครัวไทยเบื้องต้น', 'เบเกอรี่เบื้องต้น', 'โภชนาการ', 'การควบคุมต้นทุนอาหาร', 'ครัวนานาชาติ', 'การบริการอาหารและเครื่องดื่ม', 'ปฏิบัติงานครัว', 'การจัดการครัวเชิงพาณิชย์', 'ขนมไทยและของหวาน', 'การออกแบบเมนูและการตั้งราคา', 'ความปลอดภัยอาหาร GMP/HACCP', 'การแปรรูปอาหาร', 'โครงงานอาหาร'] },
  };
  for (const mj in VOCM) VOCM[mj].names.forEach((n, i) => sj(`vm_${mj}${i}`, n, VOCM[mj].b, 3, false));
  [['vc_th1', 'ภาษาไทยเพื่อการสื่อสารในอาชีพ', 'thai'], ['vc_ma1', 'คณิตศาสตร์ประยุกต์งานอาชีพ', 'math'], ['vc_en2', 'ภาษาอังกฤษเพื่ออาชีพ 1', 'eng'], ['vc_so2', 'หน้าที่พลเมืองและศีลธรรม', 'soc'], ['vc_en3', 'ภาษาอังกฤษเพื่ออาชีพ 2', 'eng'], ['vc_li3', 'ทักษะชีวิตและการสร้างอาชีพ', 'gen'],
    ['dp_en1', 'ภาษาอังกฤษเพื่อการสื่อสารในงานอาชีพ', 'eng'], ['dp_bz1', 'การจัดการธุรกิจเบื้องต้น', 'biz'], ['dp_et2', 'จริยธรรมและจรรยาบรรณวิชาชีพ', 'gen']].forEach(a => sj(a[0], a[1], a[2]));
  // ----- ปริญญาตรี 8 คณะ × 4 ภาคเรียน (3 วิชาเอก + 1 วิชาศึกษาทั่วไป) -----
  const FAC = {
    edu: { n: 'ครุศาสตร์', deg: 'ครุศาสตรบัณฑิต', b: 'edu', fee: 14000, names: ['จิตวิทยาการศึกษา', 'หลักการศึกษาและปรัชญา', 'ภาษาไทยสำหรับครู', 'การพัฒนาหลักสูตร', 'การจัดการเรียนรู้', 'การวัดและประเมินผลการศึกษา', 'เทคโนโลยีการศึกษา', 'การบริหารจัดการชั้นเรียน', 'การศึกษาพิเศษ', 'การวิจัยในชั้นเรียน', 'จรรยาบรรณและกฎหมายวิชาชีพครู', 'ฝึกประสบการณ์วิชาชีพครู'] },
    nurse: { n: 'พยาบาลศาสตร์', deg: 'พยาบาลศาสตรบัณฑิต', b: 'nurse', fee: 28000, names: ['กายวิภาคศาสตร์และสรีรวิทยา', 'จุลชีววิทยาและปรสิตวิทยา', 'การพยาบาลพื้นฐาน', 'เภสัชวิทยาทางการพยาบาล', 'การพยาบาลผู้ใหญ่', 'โภชนศาสตร์คลินิก', 'การพยาบาลมารดาและทารก', 'การพยาบาลเด็กและวัยรุ่น', 'สุขภาพจิตและการพยาบาลจิตเวช', 'การพยาบาลผู้สูงอายุ', 'การพยาบาลชุมชนและเวชปฏิบัติครอบครัว', 'ฝึกปฏิบัติการพยาบาลวิชาชีพ'] },
    engr: { n: 'วิศวกรรมศาสตร์', deg: 'วิศวกรรมศาสตรบัณฑิต', b: 'engr', fee: 30000, names: ['แคลคูลัสสำหรับวิศวกร', 'ฟิสิกส์วิศวกรรม', 'เขียนแบบวิศวกรรม', 'วงจรไฟฟ้า', 'กลศาสตร์วิศวกรรม', 'วัสดุวิศวกรรม', 'อิเล็กทรอนิกส์', 'เทอร์โมไดนามิกส์', 'ระบบควบคุม', 'ไฟฟ้ากำลังและมอเตอร์', 'การออกแบบทางวิศวกรรม', 'โครงงานวิศวกรรมและจรรยาบรรณ'] },
    cs: { n: 'วิทยาการคอมพิวเตอร์', deg: 'วิทยาศาสตรบัณฑิต', b: 'comp', fee: 24000, names: ['การเขียนโปรแกรมเบื้องต้น', 'คณิตศาสตร์ดิสครีต', 'ระบบคอมพิวเตอร์', 'โครงสร้างข้อมูลและอัลกอริทึม', 'ฐานข้อมูล', 'เครือข่ายคอมพิวเตอร์', 'วิศวกรรมซอฟต์แวร์', 'ระบบปฏิบัติการ', 'ความมั่นคงปลอดภัยไซเบอร์', 'การพัฒนาเว็บและแอป', 'ปัญญาประดิษฐ์เบื้องต้น', 'โครงงานซอฟต์แวร์'] },
    biz: { n: 'บริหารธุรกิจ', deg: 'บริหารธุรกิจบัณฑิต', b: 'biz', fee: 16000, names: ['หลักการบัญชี', 'หลักเศรษฐศาสตร์', 'การจัดการเบื้องต้น', 'การตลาด', 'การเงินธุรกิจ', 'สถิติธุรกิจ', 'กฎหมายธุรกิจ', 'การบัญชีต้นทุน', 'การจัดการการดำเนินงาน', 'การวางแผนภาษี', 'การเป็นผู้ประกอบการ', 'แผนธุรกิจและการวิเคราะห์การลงทุน'] },
    law: { n: 'นิติศาสตร์', deg: 'นิติศาสตรบัณฑิต', b: 'law', fee: 15000, names: ['หลักนิติศาสตร์', 'กฎหมายรัฐธรรมนูญ', 'กฎหมายแพ่งว่าด้วยบุคคลและนิติกรรม', 'กฎหมายอาญาภาคทั่วไป', 'กฎหมายหนี้และสัญญา', 'กฎหมายทรัพย์สินและที่ดิน', 'กฎหมายอาญาภาคความผิด', 'วิธีพิจารณาความแพ่ง', 'กฎหมายปกครอง', 'กฎหมายภาษีอากร', 'วิธีพิจารณาความอาญา', 'จริยธรรมและวิชาชีพทนายความ'] },
    vet: { n: 'สัตวแพทยศาสตร์', deg: 'สัตวแพทยศาสตรบัณฑิต', b: 'vet', fee: 40000, names: ['กายวิภาคสัตว์', 'สรีรวิทยาสัตว์', 'โภชนศาสตร์สัตว์', 'เภสัชวิทยาสัตวแพทย์', 'พยาธิวิทยา', 'จุลชีววิทยาสัตวแพทย์', 'อายุรศาสตร์สัตว์เล็ก', 'ศัลยศาสตร์สัตวแพทย์', 'สูติศาสตร์และการสืบพันธุ์สัตว์', 'สาธารณสุขสัตวแพทย์', 'เวชศาสตร์สัตว์ใหญ่', 'ฝึกปฏิบัติคลินิกสัตว์'] },
    agri: { n: 'เกษตรศาสตร์', deg: 'วิทยาศาสตรบัณฑิต (เกษตรศาสตร์)', b: 'agri', fee: 14000, names: ['ปฐพีศาสตร์', 'พืชศาสตร์เบื้องต้น', 'กีฏวิทยาและโรคพืช', 'การผลิตพืชผักและไม้ผล', 'เกษตรอินทรีย์', 'ระบบการให้น้ำ', 'เทคโนโลยีหลังเก็บเกี่ยว', 'เศรษฐศาสตร์เกษตร', 'สัตวศาสตร์เบื้องต้น', 'เกษตรอัจฉริยะ', 'การตลาดสินค้าเกษตร', 'โครงงานเกษตรกรรม'] },
  };
  const practice = n => /ฝึก|โครงงาน|ปฏิบัติ|พยาบาลผู้|พยาบาลมารดา|พยาบาลเด็ก/.test(n);
  for (const f in FAC) FAC[f].names.forEach((n, i) => sj(`bc_${f}${i}`, n, f === 'biz' && /บัญชี/.test(n) ? 'acct' : FAC[f].b, 3, !practice(n)));
  [['bc_en', 'ภาษาอังกฤษเพื่อการสื่อสาร', 'eng', true], ['bc_dg', 'ชีวิตและสังคมดิจิทัล', 'gen', true], ['bc_ct', 'จริยธรรมและความเป็นพลเมือง', 'soc', true], ['bc_ea', 'ศิลปะกับชีวิต', 'art', true], ['bc_ep', 'การออกกำลังกายเพื่อสุขภาพ', 'health', false], ['bc_ec', 'ภาษาจีนเบื้องต้น', 'art', true]].forEach(a => sj(a[0], a[1], a[2], 3, a[3]));
  // ----- ป.โท / ป.เอก -----
  for (const f in FAC) {
    const n = FAC[f].n;
    sj('ms_th1_' + f, 'ทฤษฎีขั้นสูงทาง' + n + ' 1', FAC[f].b, 3, true); sj('ms_th2_' + f, 'ทฤษฎีขั้นสูงทาง' + n + ' 2', FAC[f].b, 3, true);
    sj('pd_th_' + f, 'ทฤษฎีวิพากษ์ทาง' + n, FAC[f].b, 3, true);
  }
  [['ms_rm', 'ระเบียบวิธีวิจัยขั้นสูง', 'research', 3, true], ['ms_sm', 'สัมมนาทางวิชาการ', 'research', 1, true], ['ms_ts', 'วิทยานิพนธ์', 'research', 6, false], ['pd_rm', 'ระเบียบวิธีวิจัยเชิงลึกและสถิติขั้นสูง', 'research', 3, true], ['pd_sm', 'สัมมนาขั้นสูง', 'research', 2, true], ['pd_qe', 'การสอบวัดคุณสมบัติและเสนอโครงร่างดุษฎีนิพนธ์', 'research', 3, false], ['pd_ds', 'ดุษฎีนิพนธ์', 'research', 12, false]].forEach(a => sj(a[0], a[1], a[2], a[3], a[4]));

  const HS_M = { sci: 'สายวิทยาศาสตร์-คณิตศาสตร์', art: 'สายศิลป์-ภาษา' };
  const PROG = {
    hs: { n: 'มัธยมศึกษาตอนปลาย (ม.4–6)', i: '📗', lvl: 2, fee: () => 1500, mode: 'eve', majors: HS_M, note: 'เรียนภาคค่ำ จ.–ศ. 17:00–21:00 · ได้วุฒิ ม.6', where: 'โรงเรียนบ้านสุขใจ' },
    voc: { n: 'ประกาศนียบัตรวิชาชีพ (ปวช.)', i: '🛠️', lvl: 2, fee: () => 4500, mode: 'day', majors: Object.fromEntries(Object.entries(VOCM).map(([k, v]) => [k, v.n])), note: '3 ภาคเรียน เรียนจ.–ศ. ภาคกลางวัน มีวิชาชีพบังคับ 9 วิชา', where: 'วิทยาลัยชุมชนสุขใจ' },
    dip: { n: 'ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)', i: '🔧', lvl: 3, fee: () => 7500, mode: 'day', majors: Object.fromEntries(Object.entries(VOCM).map(([k, v]) => [k, v.n])), note: '2 ภาคเรียน ต้องมีวุฒิ ม.6 หรือ ปวช.', where: 'วิทยาลัยชุมชนสุขใจ' },
    bach: { n: 'ปริญญาตรี', i: '🎓', lvl: 4, fee: mj => FAC[mj].fee, mode: 'day', majors: Object.fromEntries(Object.entries(FAC).map(([k, v]) => [k, 'คณะ' + v.n])), note: '4 ภาคเรียน ต้องสอบคัดเลือกเข้าคณะ + มีวุฒิ ม.6/ปวช./ปวส. และบัตรประชาชน', where: 'วิทยาลัยชุมชนสุขใจ' },
    mast: { n: 'ปริญญาโท', i: '📜', lvl: 5, fee: () => 30000, mode: 'day', majors: Object.fromEntries(Object.entries(FAC).map(([k, v]) => [k, 'สาขา' + v.n])), note: '2 ภาคเรียน + วิทยานิพนธ์ ต้องมีปริญญาตรี เกรดเฉลี่ย ≥ 2.75 และสอบวิจัย', where: 'วิทยาลัยชุมชนสุขใจ' },
    phd: { n: 'ปริญญาเอก', i: '🏅', lvl: 6, fee: () => 50000, mode: 'day', majors: Object.fromEntries(Object.entries(FAC).map(([k, v]) => [k, 'สาขา' + v.n])), note: '3 ภาคเรียน + ดุษฎีนิพนธ์ ต้องมีปริญญาโท เกรดเฉลี่ย ≥ 3.25', where: 'วิทยาลัยชุมชนสุขใจ' },
  };
  const plan = (pid, mj) => {
    const T = [];
    if (pid === 'hs') for (let t = 1; t <= 3; t++) T.push({ subs: [`hs_th${t}`, `hs_ma${t}`, `hs_en${t}`, `hs_so${t}`, `hs_pe${t}`].concat(mj === 'sci' ? [`hs_ph${t}`, `hs_ch${t}`, `hs_bi${t}`] : [`hs_la${t}`, `hs_ar${t}`]) });
    else if (pid === 'voc') { const core = [['vc_th1', 'vc_ma1'], ['vc_en2', 'vc_so2'], ['vc_en3', 'vc_li3']]; for (let t = 0; t < 3; t++) T.push({ subs: core[t].concat([0, 1, 2].map(j => `vm_${mj}${t * 3 + j}`)) }); }
    else if (pid === 'dip') { const core = [['dp_en1', 'dp_bz1'], ['dp_et2']]; for (let t = 0; t < 2; t++) T.push({ subs: core[t].concat([0, 1, 2].map(j => `vm_${mj}${9 + t * 3 + j}`)) }); }
    else if (pid === 'bach') {
      const g = ['bc_en', 'bc_dg', null, 'bc_ct'];
      for (let t = 0; t < 4; t++) T.push({ subs: [0, 1, 2].map(j => `bc_${mj}${t * 3 + j}`).concat(g[t] ? [g[t]] : []), elec: t === 2 ? ['bc_ea', 'bc_ep', 'bc_ec'] : null });
    } else if (pid === 'mast') T.push({ subs: ['ms_th1_' + mj, 'ms_rm', 'ms_sm'] }, { subs: ['ms_th2_' + mj, 'ms_ts'] });
    else if (pid === 'phd') T.push({ subs: ['pd_th_' + mj, 'pd_rm'] }, { subs: ['pd_sm', 'pd_qe'] }, { subs: ['pd_ds'] });
    return T;
  };
  const TERM = 28, BREAK = 7, PER = { eve: [17, 19], day: [8, 10, 13, 15] };
  const GR = [[80, 'A', 4], [75, 'B+', 3.5], [70, 'B', 3], [65, 'C+', 2.5], [60, 'C', 2], [55, 'D+', 1.5], [50, 'D', 1], [0, 'F', 0]];
  const gradeOf = p => GR.find(g => p >= g[0]);
  const ed = () => { const e = S.edu24 = S.edu24 || {}; e.certs = e.certs || []; e.hist = e.hist || []; e.sg = e.sg || {}; e.loan = e.loan || 0; e.sch = e.sch || 0; e.adm = e.adm || null; return e; };
  const certName = (pid, mj) => pid === 'hs' ? `วุฒิมัธยมศึกษาตอนปลาย (ม.6) ${HS_M[mj]}` : pid === 'voc' ? `ประกาศนียบัตรวิชาชีพ (ปวช.) สาขา${VOCM[mj].n}` : pid === 'dip' ? `ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.) สาขา${VOCM[mj].n}` : pid === 'bach' ? `${FAC[mj].deg} คณะ${FAC[mj].n}` : pid === 'mast' ? `ปริญญาโท สาขา${FAC[mj].n}` : `ปริญญาเอก (ปร.ด.) สาขา${FAC[mj].n}`;
  const civLv = () => { try { const c = S.civic && S.civic.ed; return c && c.certs && (c.certs.includes('m6') || c.certs.includes('voc')) ? 2 : 1; } catch (e) { return 1; } };
  const lvlOf = () => Math.max(civLv(), ...ed().certs.map(c => c.lvl));
  const hasDeg = (mj, lv) => ed().certs.some(c => c.mj === mj && c.lvl >= lv);
  const gpaOf = (map, ids) => { let p = 0, c = 0; for (const id of ids) { const g = map[id]; if (g) { p += g.gp * g.cr; c += g.cr; } } return c ? p / c : 0; };
  const nextMon = () => S.day + (((7 - wd()) % 7) || 7);
  const slotOf = (c, i) => { const per = PER[PROG[c.pid].mode]; return { d: i % 5, h: per[Math.floor(i / 5) % per.length] }; };
  const sessionsOf = (c, i) => { const s = slotOf(c, i); let tot = 0, past = 0; for (let k = 0; k < 24; k++) { const d = c.tStart + k; if (wd(d) === s.d) { tot++; if (d < S.day || (d === S.day && hh() >= s.h + 2)) past++; } } return { tot, past, need: Math.ceil(tot * 0.75) }; };
  const tIdx = c => S.day - c.tStart;
  const examWin = (c, k) => { const i = tIdx(c); return k === 'mid' ? i >= 11 && i <= 13 : i >= 24 && i <= 27; };
  const msg = (t, quiet) => Phone.msg('ฝ่ายทะเบียนและวัดผล วิทยาลัยชุมชนสุขใจ', t, quiet);
  const termSubs = c => { const T = plan(c.pid, c.mj)[Math.min(c.term, plan(c.pid, c.mj).length) - 1]; return c.extra ? c.retake.slice() : T.subs.concat(c.elec ? [c.elec] : []).concat(c.retake.filter(r => !T.subs.includes(r))).slice(0, 10); };
  const initTerm = c => { c.subj = {}; c.ids = termSubs(c); c.ids.forEach(id => { c.subj[id] = { att: 0, last: 0, asg: null, mid: null, fin: null }; }); c.exams = { mid: 0, fin: 0 }; };
  const termFee = c => { const base = PROG[c.pid].fee(c.mj), re = c.retake.length * 1500; return { base, re, off: Math.round(base * ed().sch), total: Math.round(base * (1 - ed().sch)) + re }; };
  const levelNeed = pid => ({ hs: 1, voc: 1, dip: 2, bach: 2, mast: 4, phd: 5 })[pid];

  const Edu24 = {
    st: ed, SJ, PROG, plan, lvlOf, hasDeg,
    certs() { return ed().certs.map(c => ({ id: c.id, n: c.n, lvl: c.lvl, gpax: c.gpax, day: c.day, honors: c.honors })); },
    payMult() { const l = lvlOf(); return l >= 5 ? 2 : l >= 4 ? 1.6 : l >= 2 ? 1.15 : 1; },
    jobReq(k) {
      const L = lvlOf();
      const R = { teacher: [hasDeg('edu', 4), 'ปริญญาตรี ครุศาสตร์ (ศึกษาศาสตร์) พร้อมใบประกอบวิชาชีพครู'], nurse: [hasDeg('nurse', 4) || L >= 3, 'ปริญญาตรีพยาบาลศาสตร์ (ผู้ช่วยพยาบาลใช้ ปวส. ขึ้นไป)'], bank: [L >= 2, 'วุฒิ ม.6 / ปวช. ขึ้นไป'], police: [L >= 2, 'วุฒิ ม.6 / ปวช. ขึ้นไป'], firefighter: [L >= 2, 'วุฒิ ม.6 / ปวช. ขึ้นไป'], carsales: [L >= 2, 'วุฒิ ม.6 / ปวช. ขึ้นไป'], electrician: [L >= 2, 'วุฒิ ม.6 / ปวช. (แนะนำ ช่างไฟฟ้ากำลัง)'], programmer: [hasDeg('comp', 2) || hasDeg('cs', 4) || hasDeg('engr', 4), 'ปวช./ปวส. เทคโนโลยีสารสนเทศ หรือ ปริญญาตรีวิทยาการคอมพิวเตอร์/วิศวกรรม'], vet: [hasDeg('vet', 4), 'ปริญญาตรีสัตวแพทยศาสตร์'] }[k];
      return R && !R[0] ? R[1] : '';
    },
    // ----- enrolment -----
    entry(pid, mj) {
      const e = ed(), L = lvlOf(), P = PROG[pid];
      if (e.cur) return 'กำลังศึกษาอยู่ ต้องจบหรือลาออกก่อน';
      if (L >= P.lvl && !['mast', 'phd'].includes(pid) && pid !== 'bach' && L > P.lvl) return 'มีวุฒิสูงกว่าหลักสูตรนี้แล้ว';
      if (L < levelNeed(pid) && !testOn()) return `ต้องมีวุฒิระดับ ${['', 'ม.3', 'ม.6/ปวช.', 'ปวส.', 'ปริญญาตรี', 'ปริญญาโท'][levelNeed(pid)]} ขึ้นไป`;
      if (pid === 'bach') { if (!(e.adm && e.adm.pid === pid && e.adm.mj === mj && e.adm.until >= S.day) && !testOn()) return 'ต้องสอบคัดเลือกเข้าคณะนี้ผ่านก่อน (ใบผ่านสอบใช้ได้ 60 วัน)'; }
      if (pid === 'mast' || pid === 'phd') { const need = pid === 'mast' ? 2.75 : 3.25, last = e.certs.filter(c => c.lvl === levelNeed(pid)).pop(); if ((!last || last.gpax < need) && !testOn()) return `ต้องมีเกรดเฉลี่ยสะสมวุฒิก่อนหน้า ≥ ${need.toFixed(2)}`; if (!(e.adm && e.adm.pid === pid && e.adm.until >= S.day) && !testOn()) return 'ต้องสอบวัดความรู้ด้านการวิจัยผ่านก่อน (ใช้ได้ 60 วัน)'; }
      if (['bach', 'mast', 'phd'].includes(pid) && !testOn() && window.Gov24 && typeof Gov24.has === 'function' && !Gov24.has('idcard')) return 'ต้องมีบัตรประจำตัวประชาชนที่ยังไม่หมดอายุ (ทำที่ที่ว่าการอำเภอ)';
      return '';
    },
    enroll(pid, mj, loan) {
      const e = ed(), P = PROG[pid], bad = this.entry(pid, mj); if (bad) { UI.toast(bad, '📋'); return; }
      const c = { pid, mj, term: 1, extra: 0, retake: [], elec: null, regd: 0, status: 'reg', tStart: nextMon(), start: S.day };
      if (plan(pid, mj)[0].elec) { c.elec = null; }
      e.cur = c; initTerm(c); this.pay(c, loan, true);
    },
    pay(c, loan, first) {
      const e = ed(), f = termFee(c), pl = plan(c.pid, c.mj)[Math.min(c.term, plan(c.pid, c.mj).length) - 1];
      if (!c.extra && pl && pl.elec && !c.elec) { UI.toast('เลือกวิชาเลือกของภาคเรียนนี้ก่อนลงทะเบียน', '📝'); return false; }
      let tot = f.total;
      if (tot > 0 && loan) {
        if (S.money > 300000 && !testOn()) { UI.toast('กยศ. ให้กู้เฉพาะผู้มีรายได้/ทรัพย์สินไม่เกิน 300,000 ฿', '🏦'); return false; }
        if (c.pid === 'mast' || c.pid === 'phd') { UI.toast('กยศ. ให้กู้ถึงระดับปริญญาตรี', '🏦'); return false; }
        e.loan += tot; Bank2.log('กู้ กยศ. ค่าเล่าเรียน', 0); tot = 0; UI.toast(`กู้ กยศ. ${baht(f.total)} (ดอกเบี้ย 1%/ปี เริ่มผ่อนหลังเรียนจบ)`, '🏦');
      } else if (tot > S.money) { UI.toast(`ค่าเล่าเรียนภาคนี้ ${baht(tot)} เงินไม่พอ`, '💸'); return false; }
      else if (tot > 0) { S.money -= tot; Bank2.log(`ค่าเล่าเรียน ${PROG[c.pid].n}`, -tot); }
      c.regd = 1; c.paid = f.total; if (first) { c.status = 'reg'; } if (c.status === 'leave') { c.status = 'reg'; c.tStart = nextMon(); initTerm(c); }
      UI.toast(`ลงทะเบียนเรียนแล้ว เปิดเรียน${RD(c.tStart)}${f.off ? ` · ทุนลดค่าเล่าเรียน ${baht(f.off)}` : ''}`, '🎓');
      msg(`ลงทะเบียน${PROG[c.pid].n} ภาคเรียนที่ ${c.term} เรียบร้อย ชำระค่าเล่าเรียน ${baht(f.total)} เปิดภาคเรียน${RD(c.tStart)} ตารางเรียนดูได้ในแอปการศึกษา`, true);
      return true;
    },
    // ----- class, homework, exams -----
    attend(i, online) {
      const e = ed(), c = e.cur; if (!c || c.status !== 'study') return; const id = c.ids[i], s = c.subj[id], sl = slotOf(c, i), J = SJ[id];
      if (tIdx(c) > 23) { UI.toast('สิ้นสุดการเรียนการสอนแล้ว เหลือสอบปลายภาค', '📚'); return; }
      if (wd() !== sl.d || hh() < sl.h || hh() >= sl.h + 1.5) { UI.toast(`วิชานี้เรียน${DAYN[sl.d]} ${hm(sl.h)}–${hm(sl.h + 2)} (เข้าห้องเรียนได้ถึง ${hm(sl.h + 1.5)})`, '⏰'); return; }
      if (s.last === S.day) { UI.toast('เข้าเรียนวิชานี้ไปแล้ววันนี้', '✅'); return; }
      if (online) {
        if (!J.online) { UI.toast('วิชานี้ต้องเรียนในห้องเรียน (ปฏิบัติ/ระดับต่ำกว่าปริญญา)', '🏫'); return; }
        if (typeof PC === 'undefined' || !PC.best || !PC.best()) { UI.toast('เรียนออนไลน์ต้องมีคอมพิวเตอร์ที่ใช้งานได้ (ซื้อและติดตั้งที่ร้านคอม)', '💻'); return; }
        if (typeof ISP === 'undefined' || ISP.speed() < 10) { UI.toast('เรียนออนไลน์ต้องมีอินเทอร์เน็ตอย่างน้อย 10 Mbps', '📶'); return; }
        if (typeof Power !== 'undefined' && Power.st && Power.st().out > 0) { UI.toast('ไฟดับ เรียนออนไลน์ไม่ได้', '🔌'); return; }
      } else if (!Edu24.atCampus) { UI.toast('ต้องไปเข้าห้องเรียนที่โรงเรียน/วิทยาลัยด้วยตัวเอง (เลือกแท็บวิทยาลัยในโรงเรียนบ้านสุขใจ)', '🏫'); return; }
      if (!useEnergy(online ? 4 : 7)) return; s.last = S.day; UI.close();
      fade(() => { tick(120); s.att++; Prog.add(4); UI.toast(`เข้าเรียน ${J.n} (${s.att}/${sessionsOf(c, i).tot})${online ? ' · ออนไลน์' : ''}`, '📚'); });
    },
    homework(i) {
      const c = ed().cur; if (!c || c.status !== 'study') return; const id = c.ids[i], s = c.subj[id]; if (s.asg !== null) return;
      if (tIdx(c) < 3 || tIdx(c) > 22) { UI.toast('ส่งงานได้ระหว่างวันที่ 4–23 ของภาคเรียน', '📝'); return; }
      if (!useEnergy(5)) return; UI.close();
      fade(() => { tick(60); const sc = clamp(Math.round(52 + (S.energy / 100) * 14 + Math.min(14, (S.lvl || 1) * 0.7) + rnd() * 16 + (SJ[id].bank === 'comp' && typeof PC !== 'undefined' && PC.best && PC.best() ? 5 : 0)), 40, 98); s.asg = sc; UI.toast(`ส่งงานวิชา ${SJ[id].n} ได้ ${sc}/100`, '📝'); });
    },
    exam(kind) {
      const c = ed().cur; if (!c || c.status !== 'study' || c.exams[kind]) return;
      if (!examWin(c, kind)) { UI.toast(kind === 'mid' ? 'สอบกลางภาควันที่ 12–14 ของภาคเรียน' : 'สอบปลายภาควันที่ 25–28 ของภาคเรียน', '📅'); return; }
      if (!Edu24.atCampus) { UI.toast('ต้องไปสอบที่ห้องสอบโรงเรียน/วิทยาลัยด้วยตัวเอง', '🏫'); return; }
      if (hh() < 8 || hh() > 14) { UI.toast('ห้องสอบเปิด 08:00–14:00', '⏰'); return; }
      const ids = c.ids.filter(id => kind === 'mid' || this.eligible(c, id)); if (!ids.length) { UI.toast('ไม่มีวิชาที่มีสิทธิ์สอบ', '🚫'); return; }
      const items = []; ids.forEach(id => { const bank = QB[SJ[id].bank].slice().sort(() => rnd() - 0.5).slice(0, kind === 'mid' ? 2 : 3); bank.forEach(q => items.push(shuf(id, q))); });
      c.exams[kind] = 1;
      runQuiz(kind === 'mid' ? 'สอบกลางภาค' : 'สอบปลายภาค', items, res => { for (const id of ids) { const r = res[id]; c.subj[id][kind] = Math.round(r.ok / r.n * 100); } tick(kind === 'mid' ? 120 : 180); useEnergy(8); });
    },
    eligible(c, id) { const i = c.ids.indexOf(id), q = sessionsOf(c, i); return c.subj[id].att >= q.need; },
    admission(pid, mj) {
      const bad = this.entry(pid, mj); if (bad && !/สอบ/.test(bad)) { UI.toast(bad, '📋'); return; }
      if (!Edu24.atCampus) { UI.toast('สอบคัดเลือกต้องไปสอบที่วิทยาลัย', '🏫'); return; }
      if (S.money < 500) { UI.toast('ค่าสมัครสอบ 500 ฿', '💸'); return; } S.money -= 500; Bank2.log('ค่าสมัครสอบคัดเลือก', -500);
      const pick = (b, n) => QB[b].slice().sort(() => rnd() - 0.5).slice(0, n), items = [];
      if (pid === 'bach') ['thai', 'math', 'eng', 'sci', 'soc'].forEach(b => pick(b, b === 'sci' || b === 'soc' ? 1 : 2).forEach(q => items.push(shuf('x', q)))), pick(FAC[mj].b, 2).forEach(q => items.push(shuf('x', q)));
      else ['research', 'research', 'gen'].forEach(b => pick(b, 3).forEach(q => items.push(shuf('x', q))));
      runQuiz('สอบคัดเลือก: ' + PROG[pid].n + (pid === 'bach' ? ' คณะ' + FAC[mj].n : ''), items, res => {
        const r = res.x, ok = r.ok / r.n >= 0.6; if (ok) { ed().adm = { pid, mj, until: S.day + 60 }; msg(`ผลสอบคัดเลือก${PROG[pid].n}: ผ่าน (${r.ok}/${r.n}) ยืนยันสิทธิ์ภายใน 60 วัน`, true); } else msg(`ผลสอบคัดเลือก: ไม่ผ่าน (${r.ok}/${r.n}) ต้องได้อย่างน้อย 60% สมัครสอบใหม่ได้`, true);
      });
    },
    leave() { const e = ed(), c = e.cur; if (!c) return; if (c.status === 'study') { UI.toast('ลาพักการศึกษาได้ช่วงปิดภาคเรียนเท่านั้น', '📋'); return; } c.status = 'leave'; c.leaveAt = S.day; msg('อนุมัติลาพักการศึกษา สงวนสถานภาพได้ไม่เกิน 120 วัน', true); },
    withdraw() { const e = ed(), c = e.cur; if (!c) return; UI.confirm('ลาออกจากการศึกษา', 'ค่าเล่าเรียนที่ชำระแล้วไม่คืน หน่วยกิตที่สอบผ่านยังเก็บไว้', 'ลาออก', () => { e.hist.push({ pid: c.pid, mj: c.mj, term: c.term, out: 'ลาออก', day: S.day }); e.cur = null; UI.toast('ลาออกแล้ว', '📋'); }); },
    // ----- term end -----
    finishTerm() {
      const e = ed(), c = e.cur, P = plan(c.pid, c.mj), subs = []; let cr = 0, pts = 0; const fails = [];
      c.ids.forEach((id, i) => {
        const s = c.subj[id], q = sessionsOf(c, i), ok = s.att >= q.need, attP = Math.min(100, s.att / Math.max(1, q.tot) * 100);
        const sc = attP * 0.1 + (s.asg || 0) * 0.2 + (s.mid || 0) * 0.3 + (s.fin || 0) * 0.4, g = ok ? gradeOf(sc) : GR[7];
        const J = SJ[id]; cr += J.cr; pts += g[2] * J.cr; e.sg[id] = { gp: g[2], cr: J.cr, g: g[1] };
        subs.push({ id, n: J.n, cr: J.cr, g: g[1], sc: Math.round(sc), note: ok ? '' : 'ขาดเรียนเกินกำหนด (ไม่มีสิทธิ์สอบ)' }); if (g[2] === 0) fails.push(id);
      });
      const gpa = cr ? pts / cr : 0;
      c.allIds = (c.allIds || []).concat(c.ids.filter(id => !(c.allIds || []).includes(id))); const gx = gpaOf(e.sg, c.allIds);
      e.hist.push({ pid: c.pid, mj: c.mj, term: c.term + (c.extra ? 'x' : ''), gpa, gpax: gx, cr, subs, day: S.day });
      e.sch = gpa >= 3.75 ? 1 : gpa >= 3.5 ? 0.5 : 0;
      msg(`ประกาศผลสอบภาคเรียนที่ ${c.term}${c.extra ? ' (ภาคซ่อม)' : ''}: เกรดเฉลี่ยภาคนี้ ${gpa.toFixed(2)} สะสม ${gx.toFixed(2)}${fails.length ? ` · ไม่ผ่าน ${fails.length} วิชา (ต้องลงทะเบียนเรียนซ้ำ)` : ''}${e.sch ? ` · ได้ทุนเรียนดี ลดค่าเล่าเรียนภาคถัดไป ${e.sch * 100}%` : ''}`, false);
      UI.toast(`ประกาศผลภาคเรียนที่ ${c.term}: เกรด ${gpa.toFixed(2)}`, '🎓');
      c.retake = fails;
      if (c.term >= 2 && gx < 1.5) { e.cur = null; e.hist.push({ pid: c.pid, mj: c.mj, out: 'พ้นสภาพ (เกรดเฉลี่ยสะสมต่ำกว่า 1.50)', day: S.day }); msg('ท่านพ้นสภาพการเป็นนักเรียน/นักศึกษา เนื่องจากเกรดเฉลี่ยสะสมต่ำกว่า 1.50', false); return; }
      if (gpa < 2 && gx < 2) msg('เกรดเฉลี่ยสะสมต่ำกว่า 2.00 ท่านอยู่ในสถานะวิทยาทัณฑ์ (ต้องเพิ่มเกรดเฉลี่ยในภาคถัดไป)', false);
      const last = c.term >= P.length && !c.extra;
      if ((last || c.extra) && !fails.length && gx >= 2) { this.graduate(); return; }
      if (last || c.extra) {
        if ((c.extra || 0) >= 2) { e.cur = null; e.hist.push({ pid: c.pid, mj: c.mj, out: 'หมดสิทธิ์ภาคซ่อม', day: S.day }); msg('หมดสิทธิ์ลงทะเบียนภาคซ่อม ไม่สามารถสำเร็จการศึกษาได้', false); return; }
        c.extra = (c.extra || 0) + 1; if (!c.retake.length) { const low = c.allIds.filter(id => e.sg[id].gp <= 1).slice(0, 3); c.retake = low.length ? low : c.allIds.slice(0, 2); }
        msg(`ยังสำเร็จการศึกษาไม่ได้ (${fails.length ? 'มีวิชาที่ไม่ผ่าน' : 'เกรดเฉลี่ยสะสมต่ำกว่า 2.00'}) ต้องลงทะเบียนภาคซ่อมและเรียนซ้ำ`, false);
      } else c.term++;
      c.tStart = c.tStart + TERM + BREAK; c.status = 'reg'; c.regd = 0; c.elec = null; initTerm(c);
    },
    graduate() {
      const e = ed(), c = e.cur, gx = e.hist.filter(h => h.pid === c.pid && h.mj === c.mj && h.gpax !== undefined).pop().gpax, P = PROG[c.pid];
      const hon = c.pid === 'bach' ? (gx >= 3.6 ? 'เกียรตินิยมอันดับ 1' : gx >= 3.25 ? 'เกียรตินิยมอันดับ 2' : '') : '';
      const cert = { id: c.pid + ':' + c.mj, pid: c.pid, mj: c.mj, lvl: P.lvl, n: certName(c.pid, c.mj) + (hon ? ' ' + hon : ''), gpax: gx, day: S.day, honors: hon };
      e.certs.push(cert); e.cur = null; e.sch = 0;
      try { if (typeof Civic !== 'undefined' && Civic.st) { const ce = Civic.st().ed; if (c.pid === 'hs') { if (!ce.certs.includes('m6')) ce.certs.push('m6'); ce.lv = 'm6'; } if (c.pid === 'voc' && !ce.certs.includes('voc')) ce.certs.push('voc'); } } catch (x) { }
      if (c.pid === 'voc' && c.mj === 'auto') { S.perk = S.perk || {}; S.perk.mech = 1; }
      Prog.add(60 * P.lvl); Life2.note(`สำเร็จการศึกษา: ${cert.n} 🎓`);
      Phone.msg('วิทยาลัยชุมชนสุขใจ', `🎓 ยินดีด้วย! ท่านสำเร็จการศึกษา ${cert.n} เกรดเฉลี่ยสะสม ${gx.toFixed(2)} รับใบประกาศนียบัตรและใบรับรองผลการเรียน (Transcript) ได้ที่ฝ่ายทะเบียน วุฒิใหม่ใช้สมัครงานและศึกษาต่อได้`, true);
      UI.toast(`สำเร็จการศึกษา ${cert.n}`, '🎓');
    },
    // ----- daily -----
    day() {
      const e = ed(), c = e.cur;
      if (e.loan > 0 && S.day % 7 === 0 && (!c || c.status !== 'study')) { const p = Math.min(e.loan, 1500, Math.max(0, S.money)); if (p > 0) { S.money -= p; e.loan -= p; Bank2.log('ผ่อนชำระ กยศ.', -p); Phone.msg('กองทุนเงินให้กู้ยืมเพื่อการศึกษา (กยศ.)', `หักชำระเงินกู้ ${baht(p)} คงเหลือ ${baht(Math.round(e.loan))}`, true); } }
      if (e.adm && e.adm.until < S.day) e.adm = null;
      if (!c) return;
      if (c.status === 'reg') {
        if (S.day === c.tStart - 3 && !c.regd) msg(`เตือน: ลงทะเบียนภาคเรียนที่ ${c.term} ได้แล้ว เปิดเรียน${RD(c.tStart)} (ชำระภายใน 3 วันหลังเปิดเรียน)`, true);
        if (S.day >= c.tStart) { if (c.regd) { c.status = 'study'; msg(`เปิดภาคเรียนที่ ${c.term} วันนี้ ตารางเรียนอยู่ในแอปการศึกษา · เรียนครบ 75% จึงมีสิทธิ์สอบ`, false); } else if (S.day > c.tStart + 3) { c.status = 'leave'; c.leaveAt = S.day; msg('ไม่ได้ลงทะเบียนภายในกำหนด ถูกสงวนสถานภาพ (ลงทะเบียนใหม่ได้ภายใน 120 วัน)', false); } }
      } else if (c.status === 'study') { c.tEnd = c.tStart + TERM; if (S.day >= c.tEnd) this.finishTerm(); else if (tIdx(c) === 10) msg('อีก 2 วันสอบกลางภาค (วันที่ 12–14 ของภาคเรียน ที่ห้องสอบ 08:00–14:00)', true); else if (tIdx(c) === 23) msg('สอบปลายภาคเริ่มพรุ่งนี้ (วันที่ 25–28) ผู้ขาดเรียนเกิน 25% ไม่มีสิทธิ์สอบ', true); }
      else if (c.status === 'leave' && S.day - c.leaveAt > 120) { e.cur = null; e.hist.push({ pid: c.pid, mj: c.mj, out: 'พ้นสภาพ (ลาพักเกิน 120 วัน)', day: S.day }); msg('พ้นสภาพเนื่องจากสงวนสถานภาพเกิน 120 วัน', false); }
    },
  };
  // quiz runner shared by admission and term exams
  const shuf = (sid, q) => { const idx = [0, 1, 2].sort(() => rnd() - 0.5); return { sid, q: q[0], ch: idx.map(i => q[1][i]), ans: idx.indexOf(0) }; };
  let quiz = null;
  const runQuiz = (title, items, done) => {
    quiz = { title, items, i: 0, res: {}, done };
    UI.open(title, null, () => {
      const q = quiz; if (!q) return '';
      if (q.i >= q.items.length) { const tot = Object.values(q.res).reduce((a, r) => ({ ok: a.ok + r.ok, n: a.n + r.n }), { ok: 0, n: 0 }); return `<p class="lead">ส่งข้อสอบเรียบร้อย · ตอบถูกรวม ${tot.ok}/${tot.n} ข้อ ผลคะแนนแต่ละวิชาดูได้ในแอปการศึกษา</p><div class="row"><button class="btn" data-a="edback">กลับ</button></div>`; }
      const it = q.items[q.i]; return `<p class="dim">ข้อ ${q.i + 1}/${q.items.length}${it.sid !== 'x' && SJ[it.sid] ? ' · ' + esc(SJ[it.sid].n) : ''}</p><p class="lead">${esc(it.q)}</p>${it.ch.map((x, i) => `<button class="btn ghost choice" data-a="edq" data-i="${i}">${esc(x)}</button>`).join('')}`;
    });
  };
  UI.H.edq = d => { const q = quiz; if (!q || q.i >= q.items.length) return; const it = q.items[q.i], r = q.res[it.sid] = q.res[it.sid] || { ok: 0, n: 0 }; r.n++; if (+d.i === it.ans) r.ok++; q.i++; if (q.i >= q.items.length) { try { q.done(q.res); } catch (e) { console.warn(e); } } };
  UI.H.edback = () => { UI.close(); quiz = null; };

  // ----- UI -----
  let sel = { pid: 'hs', mj: 'sci' }, etab = 0;
  const fmtSlot = (c, i) => { const s = slotOf(c, i); return `${DAYN[s.d]} ${hm(s.h)}–${hm(s.h + 2)}`; };
  const tableRows = (c, inP) => c.ids.map((id, i) => {
    const s = c.subj[id], J = SJ[id], q = sessionsOf(c, i), st = c.status === 'study', sl = slotOf(c, i);
    const onNow = st && wd() === sl.d && hh() >= sl.h && hh() < sl.h + 1.5 && s.last !== S.day && tIdx(c) <= 23;
    const retake = c.retake.includes(id) && c.ids.indexOf(id) >= plan(c.pid, c.mj)[Math.min(c.term, plan(c.pid, c.mj).length) - 1].subs.length;
    return `<tr><td>${esc(J.n)}${retake ? ' <small class="bad">เรียนซ้ำ</small>' : ''}<br><small class="dim">${J.cr} หน่วยกิต · ${fmtSlot(c, i)}</small></td><td>${s.att}/${q.tot}<br><small class="${s.att >= q.need ? 'dim' : 'bad'}">ต้อง ≥ ${q.need}</small></td><td>${s.asg === null ? (st ? `<button class="btn ghost" data-a="edhw" data-i="${i}">ทำงาน</button>` : '-') : s.asg}</td><td>${s.mid ?? '-'}</td><td>${s.fin ?? '-'}</td><td>${st ? `<button class="btn ghost" data-a="edatt" data-i="${i}" ${inP && onNow ? '' : 'disabled'}>เข้าเรียน</button>${J.online ? `<button class="btn ghost" data-a="edonl" data-i="${i}" ${onNow ? '' : 'disabled'}>ออนไลน์</button>` : ''}` : ''}</td></tr>`;
  }).join('');
  const hubHtml = inP => {
    const e = ed(), c = e.cur, L = lvlOf();
    const lvName = ['', 'ม.3 (ภาคบังคับ)', 'ม.6 / ปวช.', 'ปวส.', 'ปริญญาตรี', 'ปริญญาโท', 'ปริญญาเอก'][L];
    let h = `<p class="lead">🎓 วุฒิสูงสุด: <b>${lvName}</b>${e.certs.length ? '<br>' + e.certs.map(x => '🏅 ' + esc(x.n) + ` (เกรด ${x.gpax.toFixed(2)})`).join('<br>') : ''}${e.loan > 0 ? `<br>🏦 หนี้ กยศ. ${baht(Math.round(e.loan))} (หักชำระสัปดาห์ละ 1,500 ฿ เมื่อไม่ได้เรียน)` : ''}${e.sch ? `<br>🎖️ ทุนเรียนดี: ลดค่าเล่าเรียนภาคถัดไป ${e.sch * 100}%` : ''}<br><small class="dim">${inP ? 'คุณอยู่ที่วิทยาลัย: เข้าเรียน สอบ และสมัครสอบคัดเลือกได้' : 'ผ่านแอป: ลงทะเบียน ส่งงาน เรียนออนไลน์ (ระดับปริญญา) ดูผลการเรียนได้ · เข้าเรียนในห้องและสอบต้องไปโรงเรียนบ้านสุขใจ แท็บ 🎓 วิทยาลัย'}</small></p>`;
    h += `<div class="row">${['หลักสูตร', 'ตารางเรียน', 'ผลการเรียน'].map((n, i) => `<button class="btn ${etab === i ? '' : 'ghost'}" data-a="edtab" data-v="${i}">${n}</button>`).join('')}</div>`;
    if (etab === 2) {
      return h + (e.hist.length ? e.hist.slice().reverse().map(x => x.out ? `<div class="lead">${esc(PROG[x.pid].n)} · ${esc(x.out)} (${RD(x.day)})</div>` : `<div class="card"><div class="cb"><h4>${esc(PROG[x.pid].n)} ภาคเรียนที่ ${x.term} · เกรดภาค ${x.gpa.toFixed(2)} · สะสม ${x.gpax.toFixed(2)}</h4>${x.subs.map(s => `<div class="lead">${esc(s.n)} (${s.cr}) <b>${s.g}</b> · ${s.sc}% ${esc(s.note)}</div>`).join('')}</div></div>`).join('') : '<p class="empty">ยังไม่มีผลการเรียน</p>');
    }
    if (etab === 1) {
      if (!c) return h + '<p class="empty">ยังไม่ได้ลงทะเบียนเรียน · เลือกหลักสูตรในแท็บ "หลักสูตร"</p>';
      const f = termFee(c), pl = plan(c.pid, c.mj)[Math.min(c.term, plan(c.pid, c.mj).length) - 1];
      const stTxt = { reg: c.regd ? `ลงทะเบียนแล้ว · เปิดเรียน${RD(c.tStart)}` : `รอลงทะเบียนภาคเรียนที่ ${c.term} (เปิดเรียน${RD(c.tStart)})`, study: `กำลังเรียน วันที่ ${tIdx(c) + 1}/${TERM} ของภาคเรียน (สอบกลางภาควันที่ 12–14 · สอบปลายภาควันที่ 25–28)`, leave: 'ลาพักการศึกษา' }[c.status];
      h += `<div class="card"><div class="ci">${PROG[c.pid].i}</div><div class="cb"><h4>${esc(PROG[c.pid].n)} · ${esc(PROG[c.pid].majors[c.mj])}</h4><p class="dim">ภาคเรียนที่ ${c.term}${c.extra ? ` (ภาคซ่อม ${c.extra})` : ''}/${plan(c.pid, c.mj).length} · ${stTxt}</p>`;
      if (c.status !== 'study' && !c.regd || c.status === 'leave') {
        if (!c.extra && pl && pl.elec) h += `<p class="lead">เลือกวิชาเลือก: ${pl.elec.map(id => `<button class="btn ${c.elec === id ? '' : 'ghost'}" data-a="edelec" data-v="${id}">${esc(SJ[id].n)}</button>`).join('')}</p>`;
        h += `<p class="lead">ค่าเล่าเรียนภาคนี้ ${baht(f.total)}${f.off ? ` (ทุนลด ${baht(f.off)})` : ''}${f.re ? ` รวมค่าเรียนซ้ำ ${baht(f.re)}` : ''}</p><div class="row"><button class="btn" data-a="edreg" data-l="0">ลงทะเบียน + ชำระ</button><button class="btn ghost" data-a="edreg" data-l="1">ลงทะเบียน (กู้ กยศ.)</button></div>`;
      }
      if (c.status === 'study') {
        h += `<table class="tbl"><tr><th>วิชา</th><th>เข้าเรียน</th><th>งาน</th><th>กลาง</th><th>ปลาย</th><th></th></tr>${tableRows(c, inP)}</table><div class="row"><button class="btn" data-a="edexam" data-v="mid" ${inP && !c.exams.mid && examWin(c, 'mid') ? '' : 'disabled'}>${c.exams.mid ? 'สอบกลางภาคแล้ว' : 'สอบกลางภาค'}</button><button class="btn" data-a="edexam" data-v="fin" ${inP && !c.exams.fin && examWin(c, 'fin') ? '' : 'disabled'}>${c.exams.fin ? 'สอบปลายภาคแล้ว' : 'สอบปลายภาค'}</button></div>
          <p class="dim">เกณฑ์: เข้าเรียน 10% + งาน 20% + กลางภาค 30% + ปลายภาค 40% · A ≥ 80, B+ ≥ 75, B ≥ 70, C+ ≥ 65, C ≥ 60, D+ ≥ 55, D ≥ 50 · ขาดเรียนเกิน 25% = ไม่มีสิทธิ์สอบ (ได้ F)</p>`;
      } else h += `<p class="dim">วิชาที่จะเรียน: ${c.ids.map(id => esc(SJ[id].n)).join(' · ')}</p>`;
      h += `<div class="row"><button class="btn ghost" data-a="edleave" ${c.status === 'study' ? 'disabled' : ''}>ลาพักการศึกษา</button><button class="btn danger" data-a="edwd">ลาออก</button></div></div></div>`;
      return h;
    }
    // programs
    if (c) h += `<p class="lead">กำลังศึกษา ${esc(PROG[c.pid].n)} · ดูแท็บ "ตารางเรียน"</p>`;
    h += `<div class="row">${Object.keys(PROG).map(k => `<button class="btn ${sel.pid === k ? '' : 'ghost'}" data-a="edsel" data-p="${k}">${PROG[k].i} ${PROG[k].n.split(' ')[0]}</button>`).join('')}</div>`;
    if (!PROG[sel.pid]) sel.pid = Object.keys(PROG)[0]; const P = PROG[sel.pid]; if (!P.majors[sel.mj]) sel.mj = Object.keys(P.majors)[0];
    const bad = Edu24.entry(sel.pid, sel.mj), terms = plan(sel.pid, sel.mj), subsAll = terms.map((t, i) => `<b>ภาคที่ ${i + 1}:</b> ${t.subs.map(id => esc(SJ[id].n)).join(' · ')}${t.elec ? ' · (เลือก 1: ' + t.elec.map(id => esc(SJ[id].n)).join('/') + ')' : ''}`).join('<br>');
    const admOk = ed().adm && ed().adm.pid === sel.pid && (sel.pid !== 'bach' || ed().adm.mj === sel.mj) && ed().adm.until >= S.day;
    h += `<div class="card"><div class="ci">${P.i}</div><div class="cb"><h4>${esc(P.n)}</h4><p class="dim">${esc(P.note)} · เรียนที่ ${esc(P.where)} · ค่าเล่าเรียน ${baht(P.fee(sel.mj))}/ภาคเรียน</p>
      <div class="row">${Object.entries(P.majors).map(([k, n]) => `<button class="btn ${sel.mj === k ? '' : 'ghost'}" data-a="edsel" data-p="${sel.pid}" data-m="${k}">${esc(n)}</button>`).join('')}</div>
      <p class="lead">วิชาบังคับตามหลักสูตร (${terms.length} ภาคเรียน)<br>${subsAll}</p>
      ${bad ? `<p class="bad">${esc(bad)}</p>` : '<p class="good">✅ มีคุณสมบัติสมัครได้</p>'}
      <div class="row">${['bach', 'mast', 'phd'].includes(sel.pid) ? `<button class="btn ghost" data-a="edadm" ${inP ? '' : 'disabled'}>${admOk ? '✅ ผ่านสอบคัดเลือกแล้ว' : inP ? 'สอบคัดเลือก (500 ฿)' : 'สอบคัดเลือก (ต้องไปที่วิทยาลัย)'}</button>` : ''}
      <button class="btn" data-a="edenroll" data-l="0" ${bad ? 'disabled' : ''}>สมัครเรียน + ชำระภาค 1</button><button class="btn ghost" data-a="edenroll" data-l="1" ${bad ? 'disabled' : ''}>สมัคร (กู้ กยศ.)</button></div></div></div>`;
    return h;
  };
  Object.assign(UI.H, {
    edtab: d => { etab = +d.v; }, edsel: d => { sel.pid = d.p; if (d.m) sel.mj = d.m; else sel.mj = Object.keys(PROG[d.p].majors)[0]; },
    edenroll: d => { Edu24.enroll(sel.pid, sel.mj, d.l === '1'); if (ed().cur) etab = 1; }, edreg: d => { const c = ed().cur; if (c) Edu24.pay(c, d.l === '1', false); },
    edelec: d => { const c = ed().cur; if (c) { c.elec = d.v; c.ids = termSubs(c); initTerm(c); } },
    edatt: d => Edu24.attend(+d.i, false), edonl: d => Edu24.attend(+d.i, true), edhw: d => Edu24.homework(+d.i), edexam: d => Edu24.exam(d.v), edadm: () => Edu24.admission(sel.pid, sel.mj),
    edleave: () => Edu24.leave(), edwd: () => Edu24.withdraw(),
  });
  Edu24.html = hubHtml; window.Edu24 = Edu24;
  Edu24.open = () => { Edu24.atCampus = false; UI.open('🎓 การศึกษา', null, () => hubHtml(false), { wide: true }); };
  // the campus lives in the village school: an extra tab for adults
  if (typeof Civic !== 'undefined' && Civic.schoolUI) {
    const _s = Civic.schoolUI.bind(Civic);
    Civic.schoolUI = function () {
      _s(); const cur = UI.cur; if (!cur) return; cur.tabs.push('🎓 วิทยาลัย'); const r = cur.render, oc = cur.onClose; Edu24.atCampus = true;
      cur.render = t => t === cur.tabs.length - 1 ? hubHtml(true) : r(t); cur.onClose = () => { Edu24.atCampus = false; if (oc) oc(); }; UI.renderBody();
    };
  }
  // phone app + job requirements + tutoring pay
  APPS.splice(Math.min(APPS.length, 14), 0, { id: 'edu24', i: '🎓', n: 'การศึกษา' });
  Phone.apps.edu24 = () => { Edu24.atCampus = false; return hubHtml(false); };
  if (typeof APP_GROUPS !== 'undefined') { const g = APP_GROUPS.find(x => /บริการ/.test(x[0])) || APP_GROUPS[APP_GROUPS.length - 1]; if (g) g[1].unshift('edu24'); }
  { const _a = Career.apply.bind(Career); Career.apply = function (k) { const why = Edu24.jobReq(k); if (why && !testOn()) { UI.toast('ต้องมีวุฒิ: ' + why, '🎓'); return; } return _a(k); }; for (const k in JOBS2) { const need = { teacher: 'ปริญญาตรีครุศาสตร์', nurse: 'ปริญญาตรีพยาบาลศาสตร์/ปวส.', bank: 'ม.6/ปวช.+', police: 'ม.6/ปวช.+', firefighter: 'ม.6/ปวช.+', carsales: 'ม.6/ปวช.+', electrician: 'ม.6/ปวช.+', programmer: 'ปวช.-ปวส. ไอที/ป.ตรี คอมพิวเตอร์', vet: 'ปริญญาตรีสัตวแพทยศาสตร์' }[k]; if (need && !String(JOBS2[k].req).includes('วุฒิ')) JOBS2[k].req += ' · วุฒิ ' + need; } }
  { const tj = PT_JOBS.find(j => j.k === 'tutor'); if (tj) { const base = tj.pay; Object.defineProperty(tj, 'pay', { get() { return Math.round(base * Edu24.payMult()); }, configurable: true }); } }
});
