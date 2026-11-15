'use strict';
// ---------- v212_biz: running several businesses ----------
//  1. company bank book: every baht in / out of a company account is recorded (movements) and each month close is summarised; the statement is shown in the company window
//  2. dividends: the owner takes money out of the company (only from profit, never from the paid-up capital), 10% withholding tax, shared with the other shareholders
//  3. market: a monthly economy / sector event (boom, slowdown, price war, cost shock) that moves the daily revenue of companies, the franchise shops and the prices of customer offers
//  4. franchise shops: a regional manager (+4 branches), shop insurance, and random accidents (theft, fire, flood, equipment) that the insurance mostly covers
//  5. phone app "📊 ภาพรวมธุรกิจ": all companies and shops in one place (cash, monthly fixed cost, income, break-even, runway), alerts, the market, and a checklist that says what is still missing to open a company
V23.add('v212_biz', () => {
  if (typeof Company === 'undefined' || typeof CO_TYPES === 'undefined') return;
  const E = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const toast = (t, i) => { try { UI.toast(t, i || '🏢'); } catch (e) { } };
  const msg = (f, t, imp) => { try { Phone.msg(f, t, !!imp); } catch (e) { } };
  const X = () => (S.v212 = S.v212 || { mk: { until: 0, ev: [] }, seq: 0 });
  const MO = 28, YD = 84, CMO = 30;   // franchise shops use a 28-day month (v31); a company month close is about 30 days (Company.week, once per month on the pay day) — CMO is used for the per-close forecasts
  const nextPay = () => { const t = Cal36.date(S.day); let y = t.y, m = t.m; for (let i = 0; i < 3; i++) { const p = MonthCal.payDayNum(y, m); if (p > S.day) return p; if (++m > 11) { m = 0; y++; } } return S.day + 30; };
  const live = () => Company.list().filter(c => ['setup', 'open'].includes(c.st));
  const rnd = (a, b) => a + Math.random() * (b - a), ri = (a, b) => Math.floor(rnd(a, b + 1));

  // ===================== 1. company bank book =====================
  const track = c => {
    if (!c || c.__led212) return;
    let v = +c.cash || 0;
    if (!Array.isArray(c.led)) c.led = []; if (!Array.isArray(c.mon)) c.mon = [];
    Object.defineProperty(c, 'cash', { enumerable: true, configurable: true, get() { return v; }, set(n) { const d = n - v; v = n; if (d && Math.abs(d) >= 1) note(c, d); } });
    Object.defineProperty(c, '__led212', { value: 1, enumerable: false });
  };
  const WHY = { v: '' };
  const note = (c, d) => {
    const why = WHY.v || (d > 0 ? 'รายรับ / เงินเข้า' : 'ค่าใช้จ่าย / เงินออก'), L = c.led, last = L[0];
    if (last && last[0] === S.day && last[2] === why && (last[1] > 0) === (d > 0)) { last[1] += d; last[3] = Math.round(c.cash); return; }
    L.unshift([S.day, Math.round(d), why, Math.round(c.cash)]); if (L.length > 80) L.length = 80;
  };
  const withWhy = (why, fn) => function () { const p = WHY.v; WHY.v = why; try { return fn.apply(this, arguments); } finally { WHY.v = p; } };
  const ensure = () => { for (const c of Company.st().list) track(c); };
  { const _l = Company.list.bind(Company); Company.list = function () { ensure(); return _l(); }; }
  { const _r = Company.reserve; Company.reserve = function () { const r = _r.apply(this, arguments); ensure(); return r; }; }
  Company.register = withWhy('ชำระค่าหุ้นเริ่มต้น (ทุนจดทะเบียน 25%)', Company.register);
  // name the common movements
  const H = UI.H;
  const label = { coeq: 'ซื้ออุปกรณ์', cohire: 'จ้างพนักงาน', colic: 'ค่าธรรมเนียมใบอนุญาต', conet: 'ค่าอินเทอร์เน็ต/อุปกรณ์เครือข่าย', coinject: 'เพิ่มทุน (เจ้าของโอนเข้า)', ctsign: 'สัญญาลูกค้า: ลงนาม', ctdone: 'สัญญาลูกค้า: ส่งมอบงาน', ctend: 'สัญญาลูกค้า: ยกเลิกสัญญา', coelec: 'งานไฟฟ้า', cocomm: 'ค่าธรรมเนียม' };
  for (const k of Object.keys(label)) if (typeof H[k] === 'function') H[k] = withWhy(label[k], H[k]);
  Company.day = withWhy('รายได้สุทธิรายวัน (ขาย − ต้นทุน)', Company.day);
  { const _w = Company.week; Company.week = function () {
    ensure();
    const before = new Map(Company.list().map(c => [c.id, { cash: c.cash, rev: c.books.rev, cost: c.books.cost, ytd: c.ytd }]));
    const p = WHY.v; WHY.v = 'ปิดงบรายเดือน (เงินเดือน ประกันสังคม ค่าเช่า ค่าไฟ เน็ต บัญชี VAT สัญญาลูกค้า)';
    let r; try { r = _w.apply(this, arguments); } finally { WHY.v = p; }
    for (const c of Company.list()) { const b = before.get(c.id); if (!b) continue; track(c); c.mon.unshift({ d: S.day, rev: Math.round(b.rev), cost: Math.round(b.cost), open: Math.round(b.cash), close: Math.round(c.cash) }); if (c.mon.length > 12) c.mon.length = 12; }
    return r;
  }; }
  const tbl = rows => `<table class="tbl" style="width:100%;font-size:13px">${rows.map((r, i) => `<tr>${r.map((x, j) => `<${i ? 'td' : 'th'} style="text-align:${j ? 'right' : 'left'};padding:2px 4px">${x}</${i ? 'td' : 'th'}>`).join('')}</tr>`).join('')}</table>`;
  const fm = n => (n < 0 ? '−' : '') + Math.abs(Math.round(n)).toLocaleString('en-US');
  const statement = c => {
    track(c); const L = c.led || [], M = c.mon || [];
    let h = `<h5>📒 บัญชีบริษัท ${E(c.name)}</h5><p class="lead">ยอดคงเหลือ <b>${baht(Math.round(c.cash))}</b> · ทุนชำระแล้ว ${baht(c.paid || 0)}${c.cash < 0 ? ' · <span class="bad">⚠️ ติดลบ</span>' : ''}</p>`;
    h += M.length ? '<p class="dim">สรุปรอบปิดงบรายเดือน (ทุกสิ้นเดือน)</p>' + tbl([['วันที่', 'รายรับ', 'ต้นทุน', 'เงินคงเหลือ']].concat(M.slice(0, 6).map(m => [RD(m.d), fm(m.rev), fm(m.cost), fm(m.close)]))) : '<p class="dim">ยังไม่มีการปิดงบ</p>';
    h += L.length ? '<p class="dim">รายการล่าสุด</p>' + tbl([['วันที่', 'รายการ', 'จำนวน', 'คงเหลือ']].concat(L.slice(0, 10).map(l => [RD(l[0]), E(l[2]), `<span class="${l[1] < 0 ? 'bad' : 'good'}">${fm(l[1])}</span>`, fm(l[3])]))) : '';
    return h;
  };

  // ===================== 2. dividends =====================
  const distributable = c => Math.max(0, Math.round(c.cash - (c.paid || 0) - 100000));
  const dividendUi = c => {
    const mineP = c.mine == null ? 1 : c.mine, room = distributable(c);
    return `<h5>💸 จ่ายเงินปันผล</h5><p class="dim">จ่ายได้เฉพาะจากกำไรสะสม ไม่แตะทุนที่ชำระแล้วและต้องเหลือเงินสำรอง 100,000 · ตอนนี้จ่ายได้สูงสุด <b>${baht(room)}</b> · คุณถือหุ้น ${Math.round(mineP * 100)}% (หัก ณ ที่จ่าย 10% ของส่วนที่คุณได้)</p>
      <div class="row">${[50000, 200000, 500000, 1000000, 5000000].map(v => `<button class="btn ghost" data-a="bz212div" data-v="${c.id}" data-k="${v}" ${v > room ? 'disabled' : ''}>${baht(v)}</button>`).join('')}<button class="btn" data-a="bz212div" data-v="${c.id}" data-k="all" ${room < 1000 ? 'disabled' : ''}>ทั้งหมดที่จ่ายได้</button></div>`;
  };
  H.bz212div = d => {
    const c = Company.get(+d.v); if (!c || !['setup', 'open'].includes(c.st)) return;
    const room = distributable(c), amt = d.k === 'all' ? room : Math.min(room, +d.k || 0); if (amt < 1000) { toast('ยังไม่มีกำไรสะสมที่จ่ายปันผลได้', '💸'); return; }
    const mineP = c.mine == null ? 1 : c.mine, my = Math.round(amt * mineP), wht = Math.round(my * 0.1), net = my - wht;
    const p = WHY.v; WHY.v = 'จ่ายเงินปันผล'; try { c.cash -= amt; } finally { WHY.v = p; }
    Bank.st().sav += net; try { Bank2.income('เงินปันผล ' + c.name + ' (หัก ณ ที่จ่าย 10%)', net); } catch (e) { }
    msg(c.name, `จ่ายปันผล ${baht(amt)}: ส่วนของคุณ ${baht(my)} หักภาษี 10% ${baht(wht)} เข้าบัญชีออมทรัพย์ ${baht(net)}${mineP < 1 ? ` · ผู้ถือหุ้นรายอื่นได้ ${baht(amt - my)}` : ''}`, true);
    toast(`รับปันผล ${baht(net)} เข้าบัญชีออมทรัพย์`, '💸');
  };
  // injected into the company window (above the board-meeting block)
  { const _h = Company.html.bind(Company); Company.html = function (t) {
    let s = _h(t); if (t === 1 || t === 3) return s;
    const c = Company.get(Company.sel); if (!c || !['setup', 'open'].includes(c.st)) return s;
    const block = statement(c) + dividendUi(c) + `<div class="row"><button class="btn ghost" data-a="bz212dash">📊 ภาพรวมธุรกิจทั้งหมด / สิ่งที่ต้องทำต่อ</button></div>`;
    const key = '<h5>🗓️ ประชุมบอร์ด / ผู้ถือหุ้น</h5>';
    return s.includes(key) ? s.replace(key, block + key) : s.replace('<div class="row"><button class="btn danger" data-a="coclose"', block + '<div class="row"><button class="btn danger" data-a="coclose"');
  }; }

  // ===================== 3. market =====================
  const SECT = { tech: ['it', 'sec', 'host', 'isp', 'dc', 'app', 'game', 'ai', 'cyber', 'itshop', 'itmaint', 'ecom', 'fintech', 'edtech', 'iot', 'repair', 'bpo', 'agency', 'webag', 'appdev', 'data', 'itsupport', 'smarti'], food: ['cafe', 'food', 'bakery', 'noodle', 'tea', 'catering'], energy: ['solar', 'ev'], trade: ['logistics', 'courier', 'moving'] };
  const SN = { tech: 'ธุรกิจไอที/ดิจิทัล', food: 'อาหารและเครื่องดื่ม', energy: 'พลังงาน', trade: 'ขนส่งและโลจิสติกส์', all: 'ทุกธุรกิจ' };
  const sectorOf = k => { for (const s in SECT) if (SECT[s].includes(k)) return s; return 'other'; };
  const EVENTS = [
    { id: 'boom', ico: '📈', mult: () => rnd(1.12, 1.25), t: s => `ตลาด${SN[s]}คึกคัก ลูกค้าเพิ่ม`, sec: () => ['tech', 'food', 'energy', 'trade'][ri(0, 3)] },
    { id: 'slow', ico: '📉', mult: () => rnd(0.82, 0.92), t: s => `เศรษฐกิจชะลอ ลูกค้าลดงบ (${SN[s]})`, sec: () => 'all' },
    { id: 'war', ico: '⚔️', mult: () => rnd(0.8, 0.9), t: s => `คู่แข่งตัดราคาในกลุ่ม${SN[s]}`, sec: () => ['tech', 'food', 'energy', 'trade'][ri(0, 3)] },
    { id: 'shock', ico: '🛢️', mult: () => rnd(0.88, 0.95), t: s => `ต้นทุนพลังงาน/วัตถุดิบพุ่ง (${SN[s]})`, sec: () => ['food', 'energy', 'trade'][ri(0, 2)] },
  ];
  const mult = (type) => { const x = X(); let m = 1; if (S.day > x.mk.until) return 1; for (const e of x.mk.ev) if (e.sec === 'all' || e.sec === sectorOf(type)) m *= e.m; return m; };
  const rollMarket = () => {
    const x = X(); x.mk.ev = (x.mk.ev || []).filter(e => e.until >= S.day);
    if (x.mk.ev.length < 2 && Math.random() < 0.4) {
      const E0 = EVENTS[ri(0, EVENTS.length - 1)], s = E0.sec(), e = { id: E0.id, ico: E0.ico, sec: s, m: +E0.mult().toFixed(3), until: S.day + ri(14, 42), text: E0.t(s) };
      if (!x.mk.ev.some(q => q.id === e.id && q.sec === s)) { x.mk.ev.push(e); msg('ข่าวเศรษฐกิจ', `${e.ico} ${e.text} · รายได้ปลีกของกลุ่มนี้ ${e.m >= 1 ? '+' : ''}${Math.round((e.m - 1) * 100)}% ไปถึง${RD(e.until)}`, true); }
    }
    x.mk.until = Math.max(0, ...x.mk.ev.map(e => e.until)); x.mk.day = S.day;
  };
  for (const [k, T] of Object.entries(CO_TYPES)) { const r0 = T.rev; T.rev = function (c) { return Math.round(r0.call(this, c) * mult(k)); }; }
  // customer offers follow the same market (patched copy of the price in v207_contracts.js)
  // franchise shops: the base demand of a brand moves with the market of its kind
  const BRSEC = { conv: 'trade', cafe: 'food', thai: 'food', tea: 'food', bake: 'food' };
  let brandBase = null;
  const applyBrands = () => { try { const B = window.Biz31; if (!B) return; if (!brandBase) brandBase = Object.fromEntries(Object.entries(B.BR).map(([k, T]) => [k, T.base])); for (const [k, T] of Object.entries(B.BR)) { const sec = BRSEC[k] || 'other', x = X(); let m = 1; if (S.day <= x.mk.until) for (const e of x.mk.ev) if (e.sec === 'all' || e.sec === sec) m *= e.m; T.base = brandBase[k] * m; } } catch (e) { } };

  // ===================== 4. franchise shops: regional manager, insurance, accidents =====================
  const RM_WAGE = 60000;
  const rmOn = () => !!X().rm;
  const ACC = [
    { id: 'theft', n: 'ขโมยของ/เงินสดในร้าน', p: 0.004, loss: sh => ri(15000, 70000), close: 0 },
    { id: 'equip', n: 'อุปกรณ์เสีย ต้องซ่อมด่วน', p: 0.004, loss: sh => ri(8000, 40000), close: 1 },
    { id: 'flood', n: 'น้ำท่วมร้าน', p: 0.0015, loss: sh => ri(60000, 250000), close: 4 },
    { id: 'fire', n: 'ไฟไหม้ร้าน', p: 0.0007, loss: sh => ri(200000, 700000), close: 10 },
  ];
  const premium = sh => { try { return Math.round(Biz31.BR[sh.brand].fit * 0.0003); } catch (e) { return 80; } };      // per day
  H.bz212ins = d => { const sh = Biz31.shops().find(s => s.id == d.v); if (!sh) return; sh.ins = sh.ins ? 0 : 1; toast(sh.ins ? `ทำประกัน ${sh.name} แล้ว เบี้ย ${baht(premium(sh))}/วัน ครอบคลุม 80% ของความเสียหาย` : `ยกเลิกประกัน ${sh.name}`, '🛡️'); };
  H.bz212rm = () => {
    const x = X(); if (x.rm) { x.rm = 0; toast('ยกเลิกผู้จัดการเขต เปิดร้านใหม่ได้สูงสุด 6 สาขา', '👔'); return; }
    if (S.money < RM_WAGE) { toast(`เงินสดไม่พอจ้างผู้จัดการเขต (ต้องใช้ ${baht(RM_WAGE)} ต่อเดือน)`, '💸'); return; }
    x.rm = S.day; x.rmPaid = S.day; S.money -= RM_WAGE; msg('ระบบบุคคล', `จ้างผู้จัดการเขต เงินเดือน ${baht(RM_WAGE)}/เดือน เปิดสาขาแฟรนไชส์ได้สูงสุด 10 แห่ง`); toast('จ้างผู้จัดการเขตแล้ว (+4 สาขา)', '👔');
  };
  const shopDaily = () => {
    const B = window.Biz31; if (!B) return; const x = X();
    for (const sh of B.shops()) {
      if (sh.st !== 'open') continue;
      if (sh.ins) { const pr = premium(sh); sh.cash -= pr; if (sh.m) sh.m.other = (sh.m.other || 0) + pr; }
      if (sh.closeDays > 0) continue;
      for (const a of ACC) if (Math.random() < a.p) {
        const loss = a.loss(sh), cover = sh.ins ? Math.round(loss * 0.8) : 0, mine = loss - cover;
        sh.cash -= mine; if (sh.m) sh.m.other = (sh.m.other || 0) + mine; if (a.close) sh.closeDays = Math.max(sh.closeDays || 0, a.close);
        msg('แฟรนไชส์', `⚠️ ${sh.name}: ${a.n} เสียหาย ${baht(loss)}${sh.ins ? ` · ประกันจ่ายให้ ${baht(cover)} คุณรับ ${baht(mine)}` : ' · ไม่ได้ทำประกัน (ทำประกันได้ในแอป 📊 ภาพรวมธุรกิจ)'}${a.close ? ` · ปิดซ่อม ${a.close} วัน` : ''}`, true);
        break;
      }
    }
    if (x.rm && S.day - (x.rmPaid || x.rm) >= MO) { if (S.money >= RM_WAGE) { S.money -= RM_WAGE; x.rmPaid = S.day; } else { x.rm = 0; msg('ระบบบุคคล', 'จ่ายเงินเดือนผู้จัดการเขตไม่ได้ ผู้จัดการลาออก (เปิดสาขาใหม่ได้สูงสุด 6 แห่ง)', true); } }
  };

  // ===================== 4b. service agreements between your own companies =====================
  const icList = () => (X().ic = X().ic || []);
  const icDay = () => {
    for (const a of icList().slice()) {
      const pr = Company.get(a.from), by = Company.get(a.to);
      if (!pr || !by || !['setup', 'open'].includes(pr.st) || !['setup', 'open'].includes(by.st)) { icList().splice(icList().indexOf(a), 1); continue; }
      if (!MonthCal.isPayDay(S.day) || a.last === S.day) continue; a.last = S.day;   // v237: once a month, on the month-close pay day (it was every 7 days)
      if (by.cash < a.amt + 50000) { a.miss = (a.miss || 0) + 1; msg(by.name, `จ่ายค่าบริการให้ ${pr.name} ไม่ได้ (เงินสดไม่พอ ${a.miss}/3 เดือน)`, true); if (a.miss >= 3) { icList().splice(icList().indexOf(a), 1); msg(pr.name, `ยกเลิกสัญญาบริการกับ ${by.name} (ค้างจ่าย 3 เดือน)`, true); } continue; }
      a.miss = 0; const p = WHY.v; WHY.v = 'บริการระหว่างบริษัทในเครือ';
      try { by.cash -= a.amt; Company.book(by, 0, a.amt); pr.cash += a.amt; Company.book(pr, a.amt, Math.round(a.amt * (CO_TYPES[pr.type].cost || 0.3))); pr.cash -= Math.round(a.amt * (CO_TYPES[pr.type].cost || 0.3)); } finally { WHY.v = p; }
      msg(pr.name, `รับค่าบริการจาก ${by.name} ${baht(a.amt)} (สัญญาในเครือ)`);
    }
  };
  H.bz212icadd = d => {
    const f = +(document.getElementById('bzF') || {}).value, t = +(document.getElementById('bzT') || {}).value, amt = +(document.getElementById('bzA') || {}).value;
    if (!f || !t || f === t) { toast('เลือกบริษัทผู้ให้บริการและผู้ซื้อให้ต่างกัน', '🔗'); return; }
    if (!(amt >= 10000)) { toast('ใส่ค่าบริการต่อเดือนอย่างน้อย 10,000', '🔗'); return; }
    if (icList().some(a => a.from === f && a.to === t)) { toast('มีสัญญาคู่นี้อยู่แล้ว ยกเลิกก่อนแล้วทำใหม่', '🔗'); return; }
    icList().push({ id: ++X().seq, from: f, to: t, amt, last: S.day, miss: 0 }); toast('ทำสัญญาบริการในเครือแล้ว เก็บเงินทุกรอบปิดงบ (สิ้นเดือน)', '🔗');
  };
  H.bz212icdel = d => { const i = icList().findIndex(a => a.id == d.v); if (i >= 0) icList().splice(i, 1); };
  const icHtml = co => {
    if (co.length < 2) return '';
    const opt = sel => co.map(r => `<option value="${r.c.id}">${r.ico} ${E(r.name.replace(/^บริษัท | จำกัด$/g, ''))}</option>`).join('');
    return `<h5>🔗 สัญญาบริการระหว่างบริษัทในเครือ</h5><p class="dim">เช่น บริษัทดาต้าเซ็นเตอร์ให้บริการแก่บริษัทพัฒนาโปรแกรมของคุณ ผู้ซื้อจ่ายทุกรอบปิดงบ (สิ้นเดือน) ผู้ให้บริการบันทึกเป็นรายได้ (หักต้นทุนตามประเภทธุรกิจ) ถ้าผู้ซื้อเงินสดไม่พอ 3 เดือนติด สัญญาถูกยกเลิก</p>
      <div class="row"><select id="bzF">${opt()}</select><span>ให้บริการ →</span><select id="bzT">${opt()}</select><select id="bzA">${[30000, 50000, 100000, 300000, 1000000].map(v => `<option value="${v}">${baht(v)}/เดือน</option>`).join('')}</select><button class="btn" data-a="bz212icadd">ทำสัญญา</button></div>
      ${icList().map(a => { const f = Company.get(a.from), t = Company.get(a.to); return f && t ? `<div class="row" style="align-items:center"><small style="flex:1">${E(f.name)} → ${E(t.name)} · ${baht(a.amt)}/เดือน · ครั้งถัดไป ${RD(nextPay())}</small><button class="btn ghost" data-a="bz212icdel" data-v="${a.id}">ยกเลิก</button></div>` : ''; }).join('')}`;
  };

  // ===================== day hook =====================
  { const _nd = newDay; newDay = function () {
    const r = _nd.apply(this, arguments);
    try { if ((S.day - 1) % MO === 0 || X().mk.day == null) rollMarket(); applyBrands(); shopDaily(); icDay(); } catch (e) { console.warn('v212 day', e); }
    return r;
  }; }

  // ===================== 5. dashboard + checklist =====================
  const fixedOf = c => {
    const T = CO_TYPES[c.type], pay = c.staff.reduce((s, x) => s + x.sal, 0), sso = c.staff.reduce((s, x) => s + Math.min(875, Math.min(x.sal, 17500) * 0.05), 0);
    let power = 0; try { const M = METERS[Grid.st().lots['co:' + c.id]], kwh = Company.load(c) * 24 * 0.55 * CMO; if (M) power = Math.round((M.kw <= 30 ? kwh * (3.9 + TARIFF.ft) + 33.29 : kwh * (3.1 + TARIFF.ft) + (c.peak || Company.load(c)) * 196.26 + 312.24) * 1.07); } catch (e) { }
    const net = c.net ? Math.round(BIZ_NET[c.net].price * 1.07) : 0, acct = 3000 + (c.lic && c.lic.vat ? 1500 : 0), rent = c.rent || 0;
    return { pay, sso: Math.round(sso), rent, power, net, acct, total: pay + Math.round(sso) + rent + power + net + acct };
  };
  const incomeOf = c => {
    const T = CO_TYPES[c.type]; let ct = 0, ctRev = 0;
    try { const x = c.ct && c.ct.active || []; for (const d of x) if (d.kind === 'ret') { ctRev += d.fee; ct += Math.round(d.fee * (1 - (d.cost || 0.5))); } } catch (e) { }
    let walk = 0; try { walk = Math.round(T.rev(c) * CMO * 0.9 * (1 - T.cost)); } catch (e) { }
    return { ct, ctRev, walk, total: ct + walk };
  };
  const checklist = () => {
    const out = [], cs = Company.list(), c = cs.find(x => x.st === 'open') || cs.find(x => ['setup', 'reg'].includes(x.st)) || cs[cs.length - 1];
    out.push([Gov24.has('idcard'), 'มีบัตรประจำตัวประชาชน (ศูนย์ราชการ)']);
    out.push([cs.some(x => x.st !== 'name'), 'จองชื่อบริษัทและได้รับอนุมัติ (แท็บ "ยื่นจดทะเบียน")']);
    out.push([cs.some(x => ['reg', 'setup', 'open'].includes(x.st)), 'ยื่นจดทะเบียนบริษัท เลือกทุน ที่ตั้ง ผู้ถือหุ้น และชำระค่าหุ้น 25%']);
    if (c && ['setup', 'open'].includes(c.st)) {
      for (const [ok, t] of Company.checks(c)) out.push([ok, t]);
      out.push([c.st === 'open', 'กด "เปิดดำเนินการ" เมื่อรายการข้างบนครบ']);
      out.push([!!(c.ct && ((c.ct.active || []).length || (c.ct.done || []).length)), 'เซ็นสัญญาลูกค้าฉบับแรก (หน้าบริษัท หัวข้อ 📑 สัญญากับลูกค้า)']);
      out.push([(c.mon || []).length > 0, 'ผ่านการปิดงบรายเดือนครั้งแรก (ดูสมุดบัญชีบริษัท)']);
    }
    return { c, items: out };
  };
  const biz = () => {
    const rows = [];
    for (const c of live()) { const f = fixedOf(c), i = incomeOf(c), net = i.total - f.total, run = net >= 0 ? null : Math.floor(Math.max(0, c.cash) / -net); rows.push({ kind: 'co', c, name: c.name, ico: CO_TYPES[c.type].i, st: c.st, cash: c.cash, fixed: f.total, inc: i.total, net, run, f, i }); }
    try { for (const s of Biz31.shops()) { const mm = s.m || {}, mo = (s.hist || []).slice(-1)[0]; rows.push({ kind: 'shop', s, name: s.name, ico: Biz31.BR[s.brand].i, st: s.st, cash: s.cash, net: mo && mo.net != null ? mo.net : null }); } } catch (e) { }
    return rows;
  };
  const alerts = rows => {
    const A = []; const x = X();
    for (const r of rows) {
      if (r.kind === 'co') {
        if (r.st === 'open' && r.cash < r.fixed * 1.1) A.push(['bad', `${r.name}: เงินสด ${baht(Math.round(r.cash))} อาจไม่พอปิดงบรอบหน้า (ค่าใช้จ่ายคงที่ ~${baht(r.fixed)}) · เพิ่มทุนที่ "เพิ่มทุนเข้าบัญชีบริษัท"`]);
        else if (r.st === 'open' && r.net < 0) A.push(['bad', `${r.name}: ขาดทุนประมาณ ${baht(-r.net)}/รอบปิดงบ (1 เดือน) เงินสดพอประมาณ ${r.run} รอบ · ต้องหาสัญญาลูกค้าเพิ่ม`]);
        if (r.st === 'open' && !(r.c.ct && (r.c.ct.active || []).length) && CO_TYPES[r.c.type] && window.Contracts207 && Contracts207.FAMILY[r.c.type]) A.push(['warn', `${r.name}: ยังไม่มีสัญญาลูกค้าที่ใช้งานอยู่ (รายได้หลักของธุรกิจนี้มาจากสัญญา)`]);
      } else {
        if (r.cash < 0 && r.st === 'open') A.push(['bad', `${r.name}: เงินสดร้านติดลบ ${baht(Math.round(-r.cash))} พนักงานอาจลาออก · ฝากเงินหมุนเวียนที่หน้าร้าน`]);
        if (r.st === 'open' && !r.s.ins) A.push(['warn', `${r.name}: ยังไม่ได้ทำประกัน (ไฟไหม้/น้ำท่วม/ขโมยจะเสียเต็มจำนวน)`]);
      }
    }
    for (const e of (x.mk.ev || [])) if (e.until >= S.day) A.push(['info', `${e.ico} ${e.text} (×${e.m}) ถึง${RD(e.until)}`]);
    return A;
  };
  const dashHtml = tab => {
    const rows = biz();
    if (tab === 0) {
      const co = rows.filter(r => r.kind === 'co'), sh = rows.filter(r => r.kind === 'shop');
      const A = alerts(rows); let h = `<p class="lead">บริษัท ${co.length} แห่ง · ร้านแฟรนไชส์ ${sh.length}/${6 + (rmOn() ? 4 : 0)} สาขา · เงินในบัญชีบริษัททั้งหมด <b>${baht(Math.round(co.reduce((s, r) => s + r.cash, 0)))}</b></p>`;
      h += A.length ? `<h5>🔔 เรื่องที่ควรดู</h5>${A.map(([k, t]) => `<p class="${k === 'bad' ? 'bad' : 'dim'}" style="margin:3px 0">${k === 'bad' ? '⚠️' : k === 'warn' ? '❗' : 'ℹ️'} ${E(t)}</p>`).join('')}` : '<p class="good">✅ ไม่มีเรื่องเร่งด่วน</p>';
      if (co.length) h += '<h5>🏢 บริษัท</h5>' + tbl([['บริษัท', 'เงินสด', 'ค่าใช้จ่าย/รอบ', 'รายได้สุทธิ/รอบ', 'ผล/รอบ']].concat(co.map(r => [`${r.ico} ${E(r.name.replace(/^บริษัท | จำกัด$/g, ''))}`, fm(r.cash), fm(r.fixed), fm(r.inc), `<span class="${r.net < 0 ? 'bad' : 'good'}">${fm(r.net)}</span>`]))) + '<p class="dim">ค่าใช้จ่าย = เงินเดือน+ประกันสังคม+เช่า+ไฟ+เน็ต+บัญชี (ประมาณการ) · รายได้สุทธิ = สัญญารายเดือนที่ใช้งานอยู่ + ยอดขายปลีกเฉลี่ย หักต้นทุนผันแปรแล้ว · "รอบ" = รอบปิดงบรายเดือนของบริษัท (ทุก 7 วันในเกม) · "ผล" ติดลบ = ต้องหาลูกค้าเพิ่มหรือเพิ่มทุน</p>';
      h += icHtml(co);
      h += '<h5>🏪 ร้านแฟรนไชส์</h5>';
      if (!sh.length) h += '<p class="empty">ยังไม่มีร้านแฟรนไชส์ (แอป 🏪 แฟรนไชส์ & ร้านค้า)</p>';
      else h += sh.map(r => `<div class="card"><div class="ci">${r.ico}</div><div class="cb"><h4>${E(r.name)}</h4><p class="dim">${r.st === 'open' ? '🟢 เปิด' : r.st === 'setup' ? '🔧 กำลังตั้งร้าน' : r.st} · เงินสดร้าน ${baht(Math.round(r.cash))}${r.net != null ? ` · กำไรเดือนล่าสุด ${baht(Math.round(r.net))}` : ''}${r.s.closeDays > 0 ? ` · ปิดซ่อม ${r.s.closeDays} วัน` : ''}</p><div class="row"><button class="btn ${r.s.ins ? '' : 'ghost'}" data-a="bz212ins" data-v="${r.s.id}">🛡️ ${r.s.ins ? 'มีประกันแล้ว (กดเพื่อยกเลิก)' : `ทำประกัน ${baht(premium(r.s))}/วัน`}</button></div></div></div>`).join('');
      h += `<div class="card"><div class="ci">👔</div><div class="cb"><h4>ผู้จัดการเขต</h4><p class="dim">เปิดสาขาแฟรนไชส์ได้สูงสุด ${rmOn() ? 10 : 6} แห่ง${rmOn() ? ' · จ่าย ' + baht(RM_WAGE) + ' ทุก 28 วัน' : ' (จ้างผู้จัดการเขตเพื่อเพิ่มเป็น 10 แห่ง ' + baht(RM_WAGE) + '/เดือน)'}</p><div class="row"><button class="btn ${rmOn() ? 'ghost' : ''}" data-a="bz212rm">${rmOn() ? 'ยกเลิกผู้จัดการเขต' : '👔 จ้างผู้จัดการเขต'}</button></div></div></div>`;
      return h;
    }
    if (tab === 1) {
      const { c, items } = checklist(); const done = items.filter(i => i[0]).length;
      return `<p class="lead">ตัวนำทางเปิดบริษัท${c ? ' · ' + E(c.name) : ''} · ผ่านแล้ว ${done}/${items.length}</p>${items.map(([ok, t]) => `<p style="margin:4px 0">${ok ? '✅' : '⬜'} ${E(t)}</p>`).join('')}<p class="dim">ลำดับจริงของเกม: จองชื่อ → จดทะเบียน → ใบอนุญาต/ที่ตั้ง/ไฟ/เน็ต/อุปกรณ์/พนักงาน → เปิดดำเนินการ → ลูกค้า</p>`;
    }
    const x = X(), evs = (x.mk.ev || []).filter(e => e.until >= S.day);
    return `<p class="lead">📰 สภาพตลาดตอนนี้</p>${evs.length ? evs.map(e => `<div class="card"><div class="ci">${e.ico}</div><div class="cb"><h4>${E(e.text)}</h4><p class="dim">รายได้ปลีก ×${e.m} · ราคาข้อเสนอลูกค้าตาม · ถึง${RD(e.until)}</p></div></div>`).join('') : '<p class="empty">ตลาดปกติ ไม่มีเหตุการณ์พิเศษ</p>'}<p class="dim">ทุก 4 สัปดาห์มีโอกาสเกิดเหตุการณ์ใหม่: ตลาดคึกคัก เศรษฐกิจชะลอ คู่แข่งตัดราคา หรือต้นทุนพุ่ง มีผลกับบริษัทและร้านแฟรนไชส์ของกลุ่มนั้น</p>`;
  };
  const openDash = tab => UI.open('📊 ภาพรวมธุรกิจ', ['ภาพรวม', 'ตัวนำทาง', 'ตลาด'], dashHtml, { tab: tab || 0 });
  H.bz212dash = () => openDash(0);
  if (typeof APPS !== 'undefined' && !APPS.some(a => a.id === 'biz212')) APPS.push({ id: 'biz212', i: '📊', n: 'ภาพรวมธุรกิจ' });
  Phone.apps.biz212 = () => { setTimeout(() => { Phone.app = null; UI.close(); openDash(0); }, 0); return ''; };
  if (typeof APP_GROUPS !== 'undefined') { const gr = APP_GROUPS.find(x => /บริการ/.test(x[0])) || APP_GROUPS[APP_GROUPS.length - 1]; if (gr && !gr[1].includes('biz212')) gr[1].unshift('biz212'); }

  ensure(); applyBrands();
  window.Biz212 = { icDay, withWhy, mult, track, statement, distributable, fixedOf, incomeOf, checklist, biz, alerts, rollMarket, X, ACC, premium, sectorOf };
});
