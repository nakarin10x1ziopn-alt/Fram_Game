'use strict';
// ---------- v163_slip: transfer slips, payment receipts, and signed cheques ----------
// * Every bank payment (app transfer, PromptPay, own-account transfer, bill, cheque, cashier's cheque, counter withdrawal) makes a slip with a bill number, weekday, date, time and status.
//   The slip pops up with a close button and stays in the bank app > "สลิป/ใบเสร็จ" tab so it can be opened any time. Cash payments only leave a quiet receipt in that tab.
// * Personal cheques and cashier's cheques must be signed: finger on a tablet, mouse on a computer. The first signature is kept as the specimen at the bank;
//   later ones must look like it (stroke-shape match), otherwise the cheque is refused.
// Data lives in S.v49.slips / S.v49.sig (saved with the bank state). Dev hooks: Slip49.sim(a,b), Slip49.compact(strokes).
V23.add('v163_slip', () => {
  const B = window.Bank49; if (!B || typeof UI === 'undefined') return;
  const E = s => (typeof esc === 'function' ? esc(String(s == null ? '' : s)) : String(s == null ? '' : s));
  const pad = n => String(n).padStart(2, '0');
  const hhmm = t => `${pad(Math.floor((+t || 0) / 60) % 24)}:${pad(Math.floor((+t || 0) % 60))}`;
  const money = n => (typeof baht === 'function' ? baht(n) : '฿' + n);
  const toast = (t, i) => { try { UI.toast(t, i || '🧾'); } catch (e) { } };
  const V = () => { const v = B.V(); if (!v.slips) v.slips = []; if (!v.sseq) v.sseq = 0; return v; };
  const SIM_OK = 0.5;                          // similarity needed to pass (0..1)
  const TITLE = { xfer: 'สลิปโอนเงิน', pp: 'สลิปพร้อมเพย์', app: 'สลิปโอนเงิน', bill: 'ใบเสร็จชำระบิล', cheque: 'ใบเช็ค', cashier: 'แคชเชียร์เช็ค', draw: 'ใบเบิก/โอนที่เคาน์เตอร์', cash: 'ใบเสร็จเงินสด', in: 'ใบแจ้งเงินเข้า', acct: 'ใบบริการธนาคาร', card: 'ใบเสร็จบัตรเครดิต', debit: 'ใบเสร็จบัตรเดบิต', out: 'ใบเสร็จรายจ่าย', atm: 'สลิป ATM / เคาน์เตอร์', chdep: 'ใบนำฝากเช็ค' };
  const ICON = { xfer: '📲', pp: '🔳', app: '📲', bill: '🧾', cheque: '🧾', cashier: '🏦', draw: '🏛️', cash: '💵', in: '💰', acct: '📒', card: '💳', debit: '💳', out: '🧾', atm: '🏧', chdep: '📥' };
  const PRE = { xfer: 'TRF', pp: 'PPY', app: 'TRF', bill: 'BIL', cheque: 'CHQ', cashier: 'CSC', draw: 'WDR', cash: 'RCP', in: 'INC', acct: 'SVC', card: 'CRD', debit: 'DBT', out: 'OUT', atm: 'ATM', chdep: 'DEP' };
  const capture = () => (UI.cur ? { title: UI.cur.title, tabs: UI.cur.tabs, tab: UI.cur.tab, render: UI.cur.render, wide: UI.cur.wide } : null);
  const restore = p => { if (p && p.title) UI.open(p.title, p.tabs && p.tabs.length ? p.tabs : null, p.render, { tab: p.tab, wide: p.wide }); else UI.close(); };

  // ===================== slips =====================
  function refNo(k) {
    const v = V(); v.sseq++; let ds = String(S.day);
    try { const t = Cal36.date(S.day); ds = String(t.be % 100) + pad(t.m + 1) + pad(t.dom); } catch (e) { }
    return `${PRE[k] || 'TRX'}${ds}${String(v.sseq).padStart(5, '0')}`;
  }
  const chOf = no => (no == null ? null : V().ch.find(c => String(c.no) === String(no)) || null);
  function statusOf(s) {
    const c = s.ch != null ? chOf(s.ch) : null;
    if (c && c.kind === 'personal') return c.status === 'pending' ? `⏳ รอเคลียร์ (ตัดบัญชี ${RD(c.clearAt)})` : c.status === 'cleared' ? '✅ จ่ายเช็คแล้ว' : c.status === 'bounced' ? '❌ เช็คคืน (เงินไม่พอ)' : c.status === 'stopped' ? '⛔ ระงับจ่าย' : c.status;
    if (s.k === 'chdep') return (window.BankPlus && window.BankPlus.rcvStatus(s.ch)) || '✅ ทำรายการสำเร็จ';
    if (s.k === 'cashier') return '✅ ออกแคชเชียร์เช็คแล้ว';
    if (s.k === 'cash') return '✅ รับเงินแล้ว';
    return '✅ ทำรายการสำเร็จ';
  }
  const SL = { on: null, prev: null };
  // every Bank2.log line (the bank statement) also becomes a receipt: money in = notice of deposit, other money out = receipt; lines already covered by a slip made in the same moment are skipped
  const PEND = []; let pendT = null;
  const LOUD = /ถอน|ฝาก|ผ่อน|ชำระ|ภาษี|ค่าปรับ|คืนเงินกู้|บัตรเครดิต/;
  function onLog(t, a) { a = Math.round(a); if (!a) return; PEND.push({ t: String(t), a }); if (!pendT) pendT = setTimeout(flush, 0); }
  function flush() {
    pendT = null; const L = PEND.splice(0);
    for (const p of L) { try {
      const out = p.a < 0, amt = Math.abs(p.a), atm = /ถอน|ฝาก/.test(p.t) && /ATM|เงินสด|เคาน์เตอร์/.test(p.t);
      const main = (() => { try { return 'ออมทรัพย์ ' + B.all()[0].no; } catch (e) { return ''; } })();
      make({ k: atm ? 'atm' : out ? 'out' : 'in', amt, payee: out ? '' : 'ธนาคารสุขใจ / ผู้โอน', memo: p.t, from: main, neutral: atm, quiet: !(LOUD.test(p.t) && (out || atm)), dir: out ? 'out' : 'in', noLog: 1 });
    } catch (e) { console.warn('slip log', e); } }
  }
  const GR = { on: null };
  function group(on) {
    if (on) { GR.on = { items: [] }; return; }
    const g = GR.on; GR.on = null; if (!g || !g.items.length) return;
    if (g.items.length === 1) { show(g.items[0]); return; }
    const sum = g.items.reduce((a, x) => a + x.amt, 0), s = make({ k: 'bill', amt: sum, payee: 'ชำระหลายรายการ', memo: g.items.length + ' รายการ', from: g.items[0].from, items: g.items.map(x => ({ payee: x.payee, memo: x.memo, amt: x.amt })), quiet: true, noLog: 1, neutral: true }); show(s);
  }
  function make(o) {
    const v = V(), fee = Math.round(o.fee || 0), amt = Math.round(o.amt || 0);
    if (!o.noLog) { const i = PEND.findIndex(p => Math.abs(p.a) === amt + fee); if (i >= 0) PEND.splice(i, 1); }
    const s = { id: refNo(o.k), k: o.k, d: S.day, t: S.time, amt, fee, payee: o.payee || '', memo: o.memo || '', from: o.from || '', ch: o.ch == null ? null : o.ch };
    if (o.dir) s.dir = o.dir; if (o.items) s.items = o.items; if (o.neutral || o.memo === 'โอนระหว่างบัญชีตัวเอง') s.neutral = 1;
    v.slips.unshift(s); if (v.slips.length > 300) v.slips.length = 300;
    // an unusually large transfer (50,000+ or 3x your usual) is texted to the phone
    try { if ((o.k === 'xfer' || o.k === 'pp') && !s.neutral && (amt >= 50000 || amt >= 5000 && amt > 3 * (v.slips.filter(q => (q.k === 'xfer' || q.k === 'pp') && !q.neutral && q !== s).slice(0, 10).reduce((a, q, i, ar) => a + q.amt / ar.length, 0) || 1e12))) Phone.msg('ธนาคารสุขใจ', '⚠️ แจ้งเตือนการโอนผิดปกติ: ' + money(amt) + ' ให้ ' + (s.payee || '-') + ' (' + s.id + ') · ถ้าไม่ใช่รายการของคุณ ให้ตั้งรหัส PIN ในแอปธนาคาร > ตั้งค่า', false); } catch (e) { }
    if (GR.on) { GR.on.items.push(s); return s; }
    if (!o.quiet) show(s);
    return s;
  }
  const row = (a, b) => `<div style="display:flex;justify-content:space-between;gap:12px;padding:5px 0;border-bottom:1px dashed #cfd8d0;font-size:13.5px"><span style="color:#44564a;flex:none">${a}</span><b style="text-align:right;color:#1b2a1f;word-break:break-word">${b}</b></div>`;
  function slipPaper(s) {
    const title = TITLE[s.k] || 'สลิป';
    return `<div style="background:#fff;color:#1b2a1f;border-radius:14px;overflow:hidden;max-width:430px;margin:4px auto;box-shadow:0 6px 18px rgba(0,0,0,.35)">
      <div style="background:linear-gradient(135deg,#08481f,#0b5a2a);color:#fff;padding:12px 14px"><div style="font-size:12px;opacity:.9">ธนาคารสุขใจ</div><div style="font-size:18px;font-weight:700">${ICON[s.k] || '🧾'} ${title}</div><div style="font-size:13px;margin-top:2px">${statusOf(s)}</div></div>
      <div style="padding:12px 14px"><div style="text-align:center;margin:2px 0 8px"><div style="font-size:12px;color:#44564a">จำนวนเงิน</div><div style="font-size:30px;font-weight:800;color:#0b5a2a">${money(s.amt)}</div></div>
        ${row('เลขที่บิล / รายการ', E(s.id))}${row('วัน-วันที่', E(RD(s.d)))}${row('เวลา', hhmm(s.t) + ' น.')}${s.from ? row(s.k === 'cash' ? 'ชำระด้วย' : (s.k === 'in' || s.k === 'chdep' || s.dir === 'in') ? 'เข้าบัญชี' : 'จากบัญชี', E(s.from)) : ''}${s.payee ? row(s.k === 'cash' ? 'ผู้รับเงิน' : (s.k === 'in') ? 'จาก / ผู้โอน' : 'ถึง / ผู้รับ', E(s.payee)) : ''}${s.memo ? row('รายการ', E(s.memo)) : ''}${(s.items || []).map((x, i) => row(`${i + 1}. ${E(x.memo)}`, money(x.amt))).join('')}${s.fee ? row('ค่าธรรมเนียม', money(s.fee)) : ''}${s.ch != null ? row('เลขที่เช็ค', E(s.ch)) : ''}${row('สถานะ', statusOf(s))}
        <p style="font-size:11.5px;color:#5a6b5f;margin:8px 0 0;text-align:center">เก็บสลิปนี้ไว้เป็นหลักฐาน · เปิดดูย้อนหลังได้ที่แอปธนาคาร &gt; สลิป/ใบเสร็จ</p></div></div>`;
  }
  const TXTF = "font-family:'Mali','Sarabun','Brush Script MT','Segoe Script',cursive;font-style:italic;color:#1a2a8a;font-weight:600";
  const STY = [
    { n: 'พู่กัน', f: "'Dancing Script','Sriracha','Mali',cursive", rot: -7, skew: -12, w: 500, k: 1, big: 1.7 },
    { n: 'หรูหรา', f: "'Great Vibes','Charmonman','Sriracha',cursive", rot: -5, skew: -9, w: 400, k: 1.2, big: 1.5 },
    { n: 'ลายมือ', f: "'Allura','Mali','Sriracha',cursive", rot: -6, skew: -14, w: 500, k: 1.1, big: 1.6 },
    { n: 'นักธุรกิจ', f: "'Mr De Haviland','Sriracha','Charmonman',cursive", rot: -9, skew: -16, w: 400, k: 1.2, big: 2.0 },
    null,   // slot 4: the fine-line style was removed; old signatures that used it show the business style
    { n: 'คลาสสิก', f: "'Sacramento','Charmonman','Sriracha',cursive", rot: -5, skew: -8, w: 400, k: 1.3, big: 1.5 },
    { n: 'โมเดิร์น', f: "'Caveat','Mali','Sriracha',cursive", rot: -4, skew: -8, w: 600, k: 1.2, big: 1.4 }];
  let _gid = 0;
  const sigText = (t, px, si) => {
    const st = STY[si] || STY[3], sz = Math.round(px * st.k), cs = [...String(t)], mark = /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/; let hi = 1; while (hi < cs.length && mark.test(cs[hi])) hi++;
    const first = cs.slice(0, hi).join(''), rest = cs.slice(hi).join(''), gid = 'stg' + (++_gid), h = Math.round(px * 0.55);
    return `<span style="display:inline-block;position:relative;padding:${Math.round(px * 0.3)}px ${Math.round(px * 0.35)}px ${Math.round(px * 0.55)}px;line-height:1.1;white-space:nowrap"><span style="display:inline-block;font-family:${st.f};font-weight:${st.w};font-size:${sz}px;transform:rotate(${st.rot}deg) skewX(${st.skew}deg);transform-origin:left bottom;color:#14289a;text-shadow:0 0 1px rgba(20,40,154,.55),1px 1px 0 rgba(42,82,216,.25)"><span style="font-size:${st.big}em;line-height:.8;display:inline-block;margin-right:.03em">${E(first)}</span>${E(rest)}</span><svg viewBox="0 0 120 18" preserveAspectRatio="none" style="position:absolute;left:-4%;bottom:0;width:116%;height:${h}px;overflow:visible"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0b2a9e" stop-opacity=".25"/><stop offset=".35" stop-color="#14289a"/><stop offset="1" stop-color="#2a52d8"/></linearGradient></defs><path d="M2 16 C30 9 72 13 118 1.5 C74 11 34 16 2 16 Z" fill="url(#${gid})"/><path d="M16 17.5 C46 13.5 84 14.5 110 8.5" fill="none" stroke="#2a52d8" stroke-width="1" stroke-linecap="round" vector-effect="non-scaling-stroke" opacity=".7"/><path d="M114 4.5 l2 -1" stroke="#14289a" stroke-width="2.4" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg></span>`;
  };
  const sigSvg = (sg, w) => {
    if (sg && sg.txt) return sigText(sg.txt, Math.max(16, Math.min(30, Math.round((w || 170) / 6))), sg.sty || 0);
    if (!sg || !sg.s || !sg.s.length) return '<span style="color:#7a6a3a;font-size:12px">(ไม่มีลายเซ็นบันทึกไว้)</span>';
    const d = sg.s.map(st => { let p = 'M' + st[0] + ' ' + st[1]; if (st.length <= 2) return p + 'l.1 .1'; for (let i = 2; i < st.length - 2; i += 2) p += 'Q' + st[i] + ' ' + st[i + 1] + ' ' + ((st[i] + st[i + 2]) / 2).toFixed(1) + ' ' + ((st[i + 1] + st[i + 3]) / 2).toFixed(1); p += 'L' + st[st.length - 2] + ' ' + st[st.length - 1]; return p; }).join(''), gid = 'sgg' + (sigSvg.n = (sigSvg.n || 0) + 1);
    return `<svg viewBox="${-6} ${-6} ${sg.w + 12} ${sg.h + 12}" style="width:${w || 170}px;max-width:100%;height:auto;display:block"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0b2a9e"/><stop offset="1" stop-color="#2a52d8"/></linearGradient></defs><path d="${d}" fill="none" stroke="url(#${gid})" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  };
  const owner = () => E(S.name || 'ชาวไร่');
  function chequePaper(c, s) {
    const cash = (c.kind === 'cashier'), st = statusOf({ k: cash ? 'cashier' : 'cheque', ch: c.no }), amt = c.amt;
    const stamp = c.status === 'bounced' ? '#b3261e' : c.status === 'stopped' ? '#8a5a00' : '#0b5a2a';
    return `<div style="background:linear-gradient(135deg,#fdf6d8,#f1e2a6);color:#3a2f10;border:2px solid #b9a77a;border-radius:12px;padding:10px 12px;margin:4px auto;max-width:460px;box-shadow:inset 0 0 0 3px rgba(185,167,122,.35),0 6px 18px rgba(0,0,0,.35);position:relative">
      <div style="display:flex;justify-content:space-between;gap:8px;font-size:12.5px;font-weight:700"><span>ธนาคารสุขใจ · ${cash ? 'แคชเชียร์เช็ค (CASHIER\'S CHEQUE)' : 'เช็คเลขที่'} ${E(c.no)}</span></div>
      <div style="display:flex;justify-content:space-between;gap:8px;font-size:12.5px;margin-top:3px"><span>${E(RD(c.date))}</span><span>เวลา ${hhmm(c.t != null ? c.t : (s && s.t))} น.</span></div>
      <div style="display:grid;grid-template-columns:auto 1fr;gap:5px 8px;align-items:baseline;margin-top:8px;font-size:14px"><span>จ่าย</span><b>${E(c.payee)}</b><span>ตัวอักษร</span><b>${E(B.words(amt))}</b><span>รายการ</span><span>${E(c.memo || '-')}</span><span>จำนวนเงิน</span><b style="font-size:20px">${money(amt)}</b></div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:8px;margin-top:10px"><b style="border:1px solid #3a2f10;padding:0 6px;font-size:11.5px">A/C PAYEE ONLY</b>
        <div style="text-align:center;border-bottom:1px solid #3a2f10;min-width:150px;padding:0 6px">${sigSvg(c.sig, 150)}</div></div>
      <div style="text-align:right;font-size:11.5px;margin-top:2px">${cash ? 'ผู้ขอออกเช็ค / ลงชื่อ' : 'ผู้สั่งจ่าย'} ${owner()}</div>
      <div style="margin-top:8px;font-size:13px"><b>สถานะ:</b> ${st}</div>
      <div style="position:absolute;right:10px;top:34px;transform:rotate(-12deg);border:3px solid ${stamp};color:${stamp};font-weight:800;font-size:15px;padding:0 8px;border-radius:6px;opacity:.55">${c.status === 'bounced' ? 'เช็คคืน' : c.status === 'stopped' ? 'ระงับจ่าย' : c.status === 'pending' ? 'รอเคลียร์' : 'จ่ายแล้ว'}</div></div>`;
  }
  const docHtml = s => { const c = (s.k === 'cheque' || s.k === 'cashier') ? chOf(s.ch) : null; return c ? chequePaper(c, s) + slipSummary(s) : slipPaper(s); };
  const slipSummary = s => `<div style="background:rgba(255,255,255,.08);border-radius:10px;padding:6px 12px;margin:8px auto;max-width:460px;font-size:13px">${row('เลขที่รายการ', E(s.id))}${s.from ? row('ตัดจากบัญชี', E(s.from)) : ''}${s.fee ? row('ค่าธรรมเนียม', money(s.fee)) : ''}</div>`.replace(/color:#44564a/g, 'color:#cfe3d4').replace(/color:#1b2a1f/g, 'color:#fff');
  function show(s, fromList) {
    const title = '🧾 ' + (TITLE[s.k] || 'สลิป');
    if (!(UI.cur && SL.on && UI.cur.title === SL.on)) SL.prev = capture();
    SL.on = title;
    UI.open(title, null, () => `${docHtml(s)}<div class="row end" style="margin-top:10px"><button class="btn ghost" data-a="s163all">📂 สลิปทั้งหมด</button><button class="btn" data-a="s163x">ปิดสลิป</button></div>`, {});
  }
  UI.H.s163x = () => { const p = SL.prev; SL.on = null; SL.prev = null; restore(p); };
  UI.H.s163all = () => { SL.on = null; SL.prev = null; try { B.openApp(5); } catch (e) { UI.close(); } };
  UI.H.s163v = d => { const s = V().slips.find(q => q.id === d.v); if (s) show(s); };
  UI.H.s163cv = d => {
    const c = chOf(d.v); if (!c) return;
    const s = V().slips.find(q => String(q.ch) === String(c.no)) || { id: '-', k: c.kind === 'cashier' ? 'cashier' : 'cheque', d: c.issued, t: c.t, amt: c.amt, fee: 0, payee: c.payee, memo: c.memo, from: '', ch: c.no };
    show(s);
  };
  // ---- month summary + filters ----
  const CATS = [['ค่าไฟ/น้ำ/เน็ต/บิล', /ไฟ|น้ำ|ประปา|อินเทอร์เน็ต|เน็ต|บิล/], ['ค่าเช่า/ที่ดิน/บ้าน', /เช่า|ที่ดิน|บ้าน|ต่อเติม|ก่อสร้าง/], ['ผ่อน/หนี้/ดอกเบี้ย', /ผ่อน|กู้|หนี้|ดอกเบี้ย|บัตรเครดิต|งวด/], ['ภาษี/ค่าธรรมเนียม/ค่าปรับ', /ภาษี|ธรรมเนียม|ปรับ|จดทะเบียน|ประกัน/], ['ค่าบริการ/ซ่อม/รักษา', /บริการ|ซ่อม|รักษา|หมอ|เรียน|อบรม/], ['ซื้อสินค้า', /ซื้อ|สินค้า|สั่ง|ช้อป|ร้าน/]];
  const catOf = x => { const t = (x.memo || '') + ' ' + (x.payee || ''); for (const [n, rx] of CATS) if (rx.test(t)) return n; return 'อื่น ๆ'; };
  const mkOf = d => { try { const t = Cal36.date(d); return t.be * 12 + t.m; } catch (e) { return 0; } };
  const mkName = k => { try { return Cal36.MONS[k % 12] + ' ' + Math.floor(k / 12); } catch (e) { return String(k); } };
  const isIn = x => x.k === 'in' || x.k === 'chdep' && false;
  const isChq = x => x.k === 'cheque' || x.k === 'cashier' || x.k === 'chdep';
  function tabHtml() {
    const v = V(), All = v.slips, cur = mkOf(S.day), mk = SL.mo == null ? null : cur + SL.mo, q = (SL.q || '').toLowerCase().trim(), f = SL.f || 'all';
    if (!All.length) return '<p class="empty">ยังไม่มีสลิปหรือใบเสร็จ · จ่ายเงินผ่านธนาคาร จ่ายบิล หรือเซ็นเช็ค ระบบจะเก็บสลิปไว้ที่นี่</p>';
    const inMonth = x => mk == null || mkOf(x.d) === mk;
    const M = All.filter(inMonth); let inc = 0, exp = 0; const cat = {};
    for (const x of M) { if (x.neutral) continue; if (x.k === 'in') inc += x.amt; else { exp += x.amt + (x.fee || 0); const c = catOf(x); cat[c] = (cat[c] || 0) + x.amt; } }
    const top = Object.entries(cat).sort((a, b) => b[1] - a[1]).slice(0, 6), mx = top.length ? top[0][1] : 1;
    const pass = x => inMonth(x) && (f === 'all' || (f === 'out' && x.k !== 'in' && !x.neutral) || (f === 'in' && x.k === 'in') || (f === 'chq' && isChq(x)) || (f === 'bill' && (x.k === 'bill' || /บิล|ไฟ|น้ำ|เน็ต/.test(x.memo || '')))) && (!q || (x.payee + ' ' + x.memo + ' ' + x.id + ' ' + x.amt).toLowerCase().includes(q));
    const L = All.filter(pass), show = SL.all ? L.slice(0, 150) : L.slice(0, 25);
    const chip = (k, t) => `<button class="btn ${f === k ? '' : 'ghost'}" style="padding:4px 10px;font-size:13px" data-a="s163f" data-v="${k}">${t}</button>`;
    const sum = `<div class="card" style="grid-template-columns:1fr"><div class="cb"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><button class="btn ghost" style="padding:2px 10px" data-a="s163mo" data-v="-1">◀</button><h4 style="margin:0">📊 สรุป ${mk == null ? 'ทุกเดือน' : mkName(mk)}</h4><button class="btn ghost" style="padding:2px 10px" data-a="s163mo" data-v="+1" ${SL.mo === 0 ? 'disabled' : ''}>▶</button></div>
      <p style="margin:6px 0 2px">💰 เงินเข้า <b style="color:#8be28b">${money(inc)}</b> · 🧾 จ่ายออก <b style="color:#ffb3a3">${money(exp)}</b> · สุทธิ <b>${inc - exp >= 0 ? '+' : '−'}${money(Math.abs(inc - exp))}</b></p>
      ${top.map(([n, a]) => `<div style="display:grid;grid-template-columns:130px 1fr auto;gap:6px;align-items:center;font-size:12.5px;margin:2px 0"><span>${E(n)}</span><span style="background:rgba(255,255,255,.12);border-radius:4px;height:9px;overflow:hidden"><i style="display:block;height:100%;width:${Math.max(4, Math.round(a / mx * 100))}%;background:#ffcf3f"></i></span><b>${money(a)}</b></div>`).join('') || '<p class="dim" style="margin:2px 0">ยังไม่มีรายจ่ายในเดือนนี้</p>'}
      <div class="row" style="margin:6px 0 0"><button class="btn ghost" style="padding:3px 10px;font-size:12.5px" data-a="s163mo" data-v="all">${mk == null ? '✓ ทุกเดือน' : 'ดูทุกเดือน'}</button></div></div></div>`;
    const bar = `<div class="row" style="margin:4px 0">${chip('all', 'ทั้งหมด')}${chip('out', 'จ่ายออก')}${chip('in', 'เงินเข้า')}${chip('chq', 'เช็ค')}${chip('bill', 'บิล')}</div><div class="row" style="margin:0 0 6px"><input id="s163q" type="text" value="${E(SL.q || '')}" placeholder="ค้นหา ชื่อผู้รับ / รายการ / เลขที่บิล / จำนวนเงิน" style="flex:1;min-width:0;font:inherit;font-size:15px;padding:7px 9px;border-radius:10px;border:1px solid #ccc"><button class="btn" data-a="s163find">🔍 ค้นหา</button></div>`;
    return `${sum}${bar}<p class="dim">พบ ${L.length} ใบ จากทั้งหมด ${All.length} ใบ · กด "เปิดดู" เพื่อดูใหม่ได้ตลอด</p>` + (show.map(x => `<div class="card" style="grid-template-columns:40px 1fr auto"><div class="ci">${ICON[x.k] || '🧾'}</div><div class="cb"><h4>${E(TITLE[x.k] || 'สลิป')} · ${x.k === 'in' ? '+' : ''}${money(x.amt)}</h4><p class="dim">${E(x.payee || '-')}${x.memo ? ' · ' + E(x.memo) : ''}</p><p class="dim">${E(x.id)} · ${E(RD(x.d))} ${hhmm(x.t)} น.</p><p style="font-size:12.5px">${statusOf(x)}</p></div><button class="btn ghost" data-a="s163v" data-v="${E(x.id)}">เปิดดู</button></div>`).join('') || '<p class="empty">ไม่พบสลิปที่ตรงกับตัวกรอง</p>') + (L.length > 25 ? `<div class="row"><button class="btn ghost" data-a="s163more">${SL.all ? 'แสดงน้อยลง' : 'ดูเพิ่ม'}</button></div>` : '');
  }
  UI.H.s163f = d => { SL.f = d.v; SL.all = false; };
  UI.H.s163mo = d => { if (d.v === 'all') SL.mo = SL.mo == null ? 0 : null; else if (SL.mo == null) SL.mo = 0; else SL.mo = Math.min(0, SL.mo + (d.v === '-1' ? -1 : 1)); SL.all = false; };
  UI.H.s163find = () => { SL.q = (document.getElementById('s163q') || {}).value || ''; SL.all = false; };
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target && e.target.id === 's163q') { e.preventDefault(); const b = document.querySelector('#mBody [data-a="s163find"]'); if (b) b.click(); } });
  UI.H.s163more = () => { SL.all = !SL.all; };

  // ===================== signing =====================
  const SG = { strokes: [], title: null, info: null, ok: null, cancel: null, prev: null, msg: '', drawing: false, pend: null };
  const CW = 600, CH = 200;
  const canType = () => true;   // laptops/PCs: typing or mouse; tablets: finger (typing only if the specimen was typed on a computer)
  const specMode = () => { const sp = V().sig; return sp ? (sp.txt ? 'type' : 'draw') : null; };
  const touch = () => { try { return ('ontouchstart' in window) || navigator.maxTouchPoints > 0; } catch (e) { return false; } };
  function compact(strokes) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const s of strokes) for (const p of s) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
    if (x0 > x1) return { w: 1, h: 1, s: [] };
    const bw = Math.max(1, x1 - x0), bh = Math.max(1, y1 - y0), k = 300 / Math.max(bw, bh), out = [];
    for (const s of strokes) { const a = []; let lx = -99, ly = -99; for (let i = 0; i < s.length; i++) { const x = Math.round((s[i][0] - x0) * k), y = Math.round((s[i][1] - y0) * k); if (i === 0 || i === s.length - 1 || Math.hypot(x - lx, y - ly) >= 2) { a.push(x, y); lx = x; ly = y; } } if (a.length) out.push(a); }
    return { w: Math.max(1, Math.round(bw * k)), h: Math.max(1, Math.round(bh * k)), s: out };
  }
  const inkLen = strokes => { let L = 0; for (const s of strokes) for (let i = 1; i < s.length; i++) L += Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]); return L; };
  // evenly spaced points along the ink, in the unit square of the signature's own bounding box
  function samples(g, N) {
    const strokes = g.s.map(a => { const r = []; for (let i = 0; i < a.length; i += 2) r.push([a[i] / g.w, a[i + 1] / g.h]); return r; });
    let tot = 0; for (const s of strokes) for (let i = 1; i < s.length; i++) tot += Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]);
    const out = [], step = Math.max(tot / N, 1e-4);
    for (const s of strokes) { if (s.length === 1) { out.push(s[0]); continue; } let carry = 0; out.push(s[0]); for (let i = 1; i < s.length; i++) { let a = s[i - 1], b = s[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]); let t = step - carry; while (t <= d) { const f = t / d; out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]); t += step; } carry = d - (t - step); } }
    return out;
  }
  const chamfer = (A, Bp) => { let s = 0; for (const a of A) { let m = 9; for (const b of Bp) { const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (d < m) m = d; } s += m; } return s / A.length; };
  // what the player sees: a pass (raw 0.5 and up) reads 90-100 %, a miss reads below 90 %
  const shown = raw => (raw >= SIM_OK ? Math.min(100, 90 + Math.round((raw - SIM_OK) / (0.8 - SIM_OK) * 10)) : Math.round(raw / SIM_OK * 89));
  function sim(a, b) {
    if (!a || !b || !a.s || !b.s || !a.s.length || !b.s.length) return 0;
    const ar = (a.w / a.h) / (b.w / b.h); if (ar > 2.5 || ar < 1 / 2.5) return 0;
    const A = samples(a, 90), Bp = samples(b, 90); if (!A.length || !Bp.length) return 0;
    const rotP = (P, a) => { const c = Math.cos(a), sn = Math.sin(a); return P.map(([x, y]) => [0.5 + (x - 0.5) * c - (y - 0.5) * sn, 0.5 + (x - 0.5) * sn + (y - 0.5) * c]); };
    let best = 9; for (const ang of [0, -0.1, 0.1, -0.2, 0.2]) { const R = ang ? rotP(A, ang) : A; best = Math.min(best, (chamfer(R, Bp) + chamfer(Bp, R)) / 2); }   // a signature written a little tilted still matches
    return Math.max(0, Math.min(1, 1 - best / 0.1));
  }
  function redraw() {
    const c = document.getElementById('s163Pad'); if (!c) return; const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height);
    g.strokeStyle = '#14289a'; g.fillStyle = '#14289a'; g.lineCap = 'round'; g.lineJoin = 'round'; g.shadowColor = 'rgba(20,40,154,.35)'; g.shadowBlur = 1.2;
    // pen-like ink: the line is smoothed with curves and gets thinner where the finger moves fast, thicker where it slows down
    for (const st of SG.strokes) {
      if (st.length === 1) { g.beginPath(); g.arc(st[0][0], st[0][1], 2.2, 0, 7); g.fill(); continue; }
      for (let i = 1; i < st.length; i++) {
        const p0 = st[i - 1], p1 = st[i], sp = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]); g.lineWidth = Math.max(1.8, Math.min(5, 5.4 - sp * 0.12));
        g.beginPath(); if (i === 1) g.moveTo(p0[0], p0[1]); else { const pm = st[i - 2]; g.moveTo((pm[0] + p0[0]) / 2, (pm[1] + p0[1]) / 2); }
        g.quadraticCurveTo(p0[0], p0[1], i === st.length - 1 ? p1[0] : (p0[0] + p1[0]) / 2, i === st.length - 1 ? p1[1] : (p0[1] + p1[1]) / 2); g.stroke();
      }
    }
    g.shadowBlur = 0;
  }
  const ptOf = (e, c) => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) * c.width / Math.max(1, r.width), (e.clientY - r.top) * c.height / Math.max(1, r.height)]; };
  const isPad = e => e.target && e.target.id === 's163Pad';
  document.addEventListener('pointerdown', e => { if (!isPad(e) || (e.pointerType === 'mouse' && e.button !== 0)) return; e.preventDefault(); try { e.target.setPointerCapture(e.pointerId); } catch (x) { } SG.drawing = true; SG.strokes.push([ptOf(e, e.target)]); redraw(); }, true);
  document.addEventListener('pointermove', e => { if (!SG.drawing || !isPad(e)) return; e.preventDefault(); const s = SG.strokes[SG.strokes.length - 1]; if (s) { s.push(ptOf(e, e.target)); redraw(); } }, true);
  const up = e => { if (SG.drawing) { SG.drawing = false; } };
  document.addEventListener('pointerup', up, true); document.addEventListener('pointercancel', up, true);
  { const rb = UI.renderBody.bind(UI); UI.renderBody = function () { rb(); if (SG.title && UI.cur && UI.cur.title === SG.title) redraw(); }; }

  function signHtml() {
    const i = SG.info, cash = i.kind === 'cashier', spec = V().sig, first = !spec, ctr = i.kind === 'contract';
    return `<p class="lead">✍️ ${ctr ? 'เซ็นสัญญา' : cash ? 'ลงชื่อขอออกแคชเชียร์เช็ค' : 'เซ็นสั่งจ่ายเช็ค'} · <b>${money(i.amt)}</b> · ${E(i.payee)}</p>
      ${first ? '<p class="dim">🆕 ครั้งแรก: ลายเซ็นนี้จะถูกบันทึกเป็น <b>ลายเซ็นตัวอย่างที่ธนาคาร</b> ครั้งต่อไปต้องเซ็นให้เหมือน/คล้ายกัน ไม่เช่นนั้นจ่ายเช็คและแคชเชียร์เช็คไม่ได้</p>' : `<div style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.08);border-radius:10px;padding:6px 10px;margin:6px 0"><span class="dim" style="flex:none;font-size:12.5px">ลายเซ็นตัวอย่างที่ธนาคาร</span><span style="background:#fffdf3;border-radius:6px;padding:2px 8px">${sigSvg(spec, 110)}</span></div>`}
      ${canType() ? `<div class="row" style="margin:6px 0"><button class="btn ${SG.mode === 'type' ? '' : 'ghost'}" data-a="s163mode" data-v="type">⌨️ พิมพ์ชื่อ</button><button class="btn ${SG.mode === 'draw' ? '' : 'ghost'}" data-a="s163mode" data-v="draw">${touch() ? '👆 เซ็นด้วยนิ้ว' : '🖱️ เซ็นด้วยเมาส์'}</button></div>` : ''}
      ${spec && specMode() !== SG.mode ? `<p style="color:#ffd27a;margin:4px 0;font-size:13px">⚠️ ลายเซ็นตัวอย่างที่ธนาคารเป็นแบบ${specMode() === 'type' ? 'พิมพ์ชื่อ' : 'เซ็นด้วยมือ/นิ้ว/เมาส์'} ต้องเซ็นแบบเดียวกัน (หรือขอเปลี่ยนลายเซ็นตัวอย่างที่สาขา)</p>` : ''}
      <div style="background:linear-gradient(135deg,#fdf6d8,#f1e2a6);color:#3a2f10;border:2px solid #b9a77a;border-radius:12px;padding:10px 12px;max-width:460px;margin:6px auto">
        <div style="font-size:12.5px;font-weight:700">${ctr ? 'สัญญา ' + E(i.title || '') + ' · เลขที่' : 'ธนาคารสุขใจ · ' + (cash ? 'แคชเชียร์เช็ค' : 'เช็คเลขที่')} ${E(i.no)}</div>
        <div style="font-size:12.5px;margin:2px 0 6px">${E(RD(i.date))} · เวลา ${hhmm(i.t)} น.</div>
        <div style="display:grid;grid-template-columns:auto 1fr;gap:4px 8px;font-size:14px">${ctr ? '<span>คู่สัญญา</span><b>' + E(i.payee) + '</b>' + (i.terms || []).map(x => '<span>' + E(x[0]) + '</span><span>' + E(x[1]) + '</span>').join('') + '<span>มูลค่าสัญญา</span><b style="font-size:19px">' + money(i.amt) + '</b>' : '<span>จ่าย</span><b>' + E(i.payee) + '</b><span>ตัวอักษร</span><b>' + E(B.words(i.amt)) + '</b><span>รายการ</span><span>' + E(i.memo || '-') + '</span><span>จำนวนเงิน</span><b style="font-size:19px">' + money(i.amt) + '</b>'}</div>
        ${SG.mode === 'type' ? `<div style="margin-top:8px;font-size:12px;font-weight:600">⌨️ พิมพ์ชื่อผู้เซ็น ภาษาไทยหรือ English ก็ได้ แล้วกด Enter หรือปุ่มยืนยัน</div><input id="s163Txt" type="text" maxlength="30" autocomplete="off" value="${E(SG.txt)}" placeholder="พิมพ์ชื่อ-นามสกุลที่ใช้เซ็น" oninput="Slip49.SG.txt=this.value;Slip49.prev()" style="width:100%;box-sizing:border-box;font:inherit;font-size:16px;padding:8px;border-radius:8px;border:2px solid #8a7a4a;background:#fffef7;color:#3a2f10;margin-top:4px">${!spec ? `<input id="s163Alt" type="text" maxlength="30" autocomplete="off" value="${E(SG.alt || '')}" placeholder="ชื่ออีกภาษา เช่น Nakarin L. (ไม่บังคับ เซ็นได้ทั้งสองภาษา)" oninput="Slip49.SG.alt=this.value" style="width:100%;box-sizing:border-box;font:inherit;font-size:15px;padding:7px 8px;border-radius:8px;border:2px solid #b9a77a;background:#fffef7;color:#3a2f10;margin-top:6px">` : (spec.alt ? `<div style="font-size:11.5px;margin-top:4px">ชื่อที่ธนาคารรับ: ${E(spec.txt)} / ${E(spec.alt)}</div>` : '')}<div id="s163Prev" style="background:#fffef7;border:2px dashed #8a7a4a;border-radius:8px;margin-top:6px;min-height:150px;display:flex;align-items:center;justify-content:center;padding:14px 10px 8px;overflow:hidden">${sigText(SG.txt || 'ชื่อของคุณ', 26, SG.sty)}</div><div class="row" style="margin:6px 0 0">${STY.map((x, k) => !x ? '' : `<button class="btn ghost" style="padding:5px 12px;font-size:13px;${SG.sty === k ? 'background:#16329e;color:#fff;border-color:#16329e' : 'background:rgba(22,50,158,.10);color:#16329e;border:1px solid #16329e'}" data-a="s163sty" data-v="${k}">${x.n}</button>`).join('')}</div>` : `<div style="margin-top:8px;font-size:12px;font-weight:600">✍️ เซ็นชื่อตรงกรอบนี้ (${touch() ? 'ใช้นิ้วเขียนบนกรอบ' : 'กดเมาส์ค้างแล้วลากเพื่อเซ็น'})</div>        <canvas id="s163Pad" width="${CW}" height="${CH}" style="touch-action:none;display:block;width:100%;height:auto;aspect-ratio:${CW}/${CH};background:#fffef7;border:2px dashed #8a7a4a;border-radius:8px;cursor:crosshair"></canvas>`}
        <div style="display:flex;justify-content:space-between;font-size:11.5px;margin-top:4px"><b style="border:1px solid #3a2f10;padding:0 6px">${ctr ? 'ลายมือชื่อผู้รับจ้าง' : 'A/C PAYEE ONLY'}</b><span>${ctr ? 'ผู้รับจ้าง' : cash ? 'ผู้ขอ' : 'ผู้สั่งจ่าย'} ${owner()}</span></div></div>
      ${SG.msg ? `<p style="color:#ffb3a3;font-weight:600;margin:6px 0">${E(SG.msg)}</p>` : ''}
      <div class="row end"><button class="btn ghost" data-a="s163cancel">ยกเลิก</button><button class="btn ghost" data-a="s163clr">🧽 ล้างลายเซ็น</button><button class="btn" data-a="s163ok">✅ ${ctr ? 'ลงนามในสัญญา' : 'ยืนยันเซ็น' + (cash ? 'ขอแคชเชียร์เช็ค' : 'จ่ายเช็ค')}</button></div>`;
  }
  // info: {kind:'cheque'|'cashier', no, payee, amt, date, memo, t}   onOk(sig)   onCancel()
  function sign(info, onOk, onCancel) {
    { const v0 = V(); if (v0.sigLock && S.day <= v0.sigLock) { toast('ธนาคารระงับการเซ็นเช็คชั่วคราว (ลายเซ็นไม่ตรงครบ 3 ครั้ง) ลองใหม่พรุ่งนี้', '⛔'); if (onCancel) onCancel(); return; } }
    SG.alt = ''; SG.pend = null; SG.strokes = []; SG.msg = ''; SG.txt = V().sig ? '' : (() => { const p = String(S.name || '').trim().split(/\s+/); return p.length > 1 ? p[0] + ' ' + [...p[1]][0] + '.' : p[0] || ''; })(); SG.sty = V().sig ? (V().sig.sty || 0) : 3; if (!STY[SG.sty]) SG.sty = 3; SG.mode = specMode() || (touch() ? 'draw' : 'type'); SG.info = info; SG.ok = onOk; SG.cancel = onCancel; SG.title = info.kind === 'contract' ? '✍️ เซ็นสัญญา' : info.kind === 'cashier' ? '✍️ ลงชื่อแคชเชียร์เช็ค' : '✍️ เซ็นเช็ค';
    SG.prev = capture(); UI.open(SG.title, null, signHtml, { wide: true }); setTimeout(redraw, 0);
  }
  UI.H.s163clr = () => { SG.strokes = []; SG.txt = ''; SG.msg = ''; };
  UI.H.s163sty = d => { SG.sty = +d.v || 0; };
  const prevNow = () => { const p = document.getElementById('s163Prev'); if (p) p.innerHTML = sigText(SG.txt || 'ชื่อของคุณ', 26, SG.sty); };
  UI.H.s163mode = d => { if (d.v === 'type' && !canType()) return; SG.mode = d.v === 'type' ? 'type' : 'draw'; SG.msg = ''; setTimeout(() => { const e = document.getElementById('s163Txt'); if (e) e.focus(); }, 60); };
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target && e.target.id === 's163Txt') { e.preventDefault(); const b = document.querySelector('#mBody [data-a="s163ok"]'); if (b) b.click(); } });
  UI.H.s163cancel = () => { const f = SG.cancel; SG.title = null; SG.ok = null; SG.cancel = null; if (f) f(); else restore(SG.prev); };
  const lev = (a, b) => { const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i]); for (let j = 1; j <= n; j++) d[0][j] = j; for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[m][n]; };
  const normT = t => String(t || '').toLowerCase().replace(/\s+/g, '');
  const txtSim = (a, b) => { const x = normT(a), y = normT(b); const L = Math.max(x.length, y.length); return L ? 1 - lev(x, y) / L : 0; };
  const SIM_TXT = 0.8;
  UI.H.s163ok = () => {
    if (!SG.ok) return;
    const v = V(), spec = v.sig; let cur = null, pc = 100;
    if (SG.mode === 'type') {
      const t = String(SG.txt || '').replace(/\s+/g, ' ').trim();
      if (t.length < 2) { SG.msg = 'ยังไม่ได้พิมพ์ชื่อ พิมพ์ชื่อที่ใช้เซ็นอย่างน้อย 2 ตัวอักษร'; toast('ยังไม่ได้พิมพ์ชื่อผู้เซ็น', '✍️'); return; }
      cur = { txt: t, sty: SG.sty || 0 };
      if (spec) {
        if (!spec.txt) { SG.msg = '❌ ลายเซ็นตัวอย่างที่ธนาคารเป็นแบบเซ็นด้วยมือ/นิ้ว ใช้การพิมพ์ชื่อไม่ได้ (เลือกเซ็นด้วยเมาส์ หรือขอเปลี่ยนลายเซ็นตัวอย่างที่สาขา)'; toast('วิธีเซ็นไม่ตรงกับตัวอย่าง', '❌'); return; }
        const sc = Math.max(txtSim(spec.txt, t), spec.alt ? txtSim(spec.alt, t) : 0); pc = Math.round(sc * 100);
        if (sc < SIM_TXT) { SG.msg = `❌ ชื่อที่พิมพ์ไม่ตรงกับลายเซ็นตัวอย่างที่ธนาคารเก็บไว้ (คล้าย ${pc}% ต้องอย่างน้อย ${Math.round(SIM_TXT * 100)}%) จ่ายเช็คไม่ได้ ลองพิมพ์ใหม่`; SG.txt = ''; toast(`ลายเซ็นไม่ตรง (คล้าย ${pc}%) ธนาคารไม่จ่ายเช็ค`, '❌'); return; }
      } else { v.sig = { txt: t, sty: SG.sty || 0, day: S.day, name: S.name || '' }; { const al = String(SG.alt || '').replace(/\s+/g, ' ').trim(); if (al.length >= 2) v.sig.alt = al; } toast('บันทึกลายเซ็นตัวอย่างที่ธนาคารแล้ว', '✍️'); }
    } else {
      if (inkLen(SG.strokes) < 150 || SG.strokes.reduce((a, s) => a + s.length, 0) < 8) { SG.msg = 'ยังไม่ได้เซ็นชื่อ (หรือเซ็นสั้นเกินไป) เซ็นในกรอบให้ชัดเจนก่อน'; toast('ยังไม่ได้เซ็นชื่อ', '✍️'); return; }
      cur = compact(SG.strokes);
      if (spec) {
        if (spec.txt) { SG.msg = '❌ ลายเซ็นตัวอย่างที่ธนาคารเป็นแบบพิมพ์ชื่อ ใช้การเซ็นด้วยมือไม่ได้ (เลือกพิมพ์ชื่อ หรือขอเปลี่ยนลายเซ็นตัวอย่างที่สาขา)'; SG.strokes = []; toast('วิธีเซ็นไม่ตรงกับตัวอย่าง', '❌'); return; }
        const sc = sim(spec, cur); pc = shown(sc);
        if (sc < SIM_OK) { SG.msg = `❌ ลายเซ็นไม่ตรงกับตัวอย่างที่ธนาคารเก็บไว้ (คล้าย ${pc}% ต้องอย่างน้อย 90%) จ่ายเช็คไม่ได้ ลองเซ็นใหม่ให้เหมือนเดิม`; SG.strokes = []; toast(`ลายเซ็นไม่ตรง (คล้าย ${pc}%) ธนาคารไม่จ่ายเช็ค`, '❌'); return; }
      } else { v.sig = { w: cur.w, h: cur.h, s: cur.s, day: S.day, name: S.name || '' }; toast('บันทึกลายเซ็นตัวอย่างที่ธนาคารแล้ว', '✍️'); }
    }
    SG.last = pc; SG.pend = cur; const f = SG.ok; SG.ok = null; SG.cancel = null; SG.title = null; f(cur);
  };
  { const ok0 = UI.H.s163ok; UI.H.s163ok = function () {
      const v = V(), had = !!SG.ok, before = v.sigFail || 0; SG.msg = ""; ok0.apply(this, arguments);
      if (!had) return;
      if (!SG.ok) { v.sigFail = 0; return; }                    // it went through
      if (/ไม่ตรงกับ(ลายเซ็น)?ตัวอย่าง/.test(SG.msg || '')) { v.sigFail = before + 1; if (v.sigFail >= 3) { v.sigLock = S.day; v.sigFail = 0; SG.msg += ' · ผิดครบ 3 ครั้ง ธนาคารระงับการเซ็นเช็คชั่วคราวจนถึงพรุ่งนี้'; toast('ธนาคารระงับการเซ็นเช็คชั่วคราว จนถึงพรุ่งนี้', '⛔'); setTimeout(() => { if (UI.cur && UI.cur.title === SG.title) UI.H.s163cancel(); }, 1500); } }
    }; }
  // the signature of the cheque being paid right now (taken once)
  function takeSig() { const s = SG.pend; SG.pend = null; return s; }
  // re-register the specimen at a branch
  UI.H.s163rs = () => { if (!V().sig) { toast('ยังไม่มีลายเซ็นตัวอย่าง เซ็นเช็คใบแรกเพื่อบันทึก', 'ℹ️'); return; } if (!B.bankOpen()) { toast('เปลี่ยนลายเซ็นตัวอย่างได้เฉพาะเวลาทำการธนาคาร (จ–ศ 08:30–16:30)', '🕘'); return; } if (!B.hasId()) { toast('ต้องมีบัตรประชาชน (ทำที่ศูนย์ราชการ)', '🪪'); return; } V().sig = null; toast('ยกเลิกลายเซ็นตัวอย่างเดิมแล้ว เช็คใบถัดไปจะบันทึกลายเซ็นใหม่', '✍️'); };
  UI.H.s163addalt = () => { const sp = V().sig, t = String((document.getElementById('s163Alt2') || {}).value || '').replace(/\s+/g, ' ').trim(); if (!sp || !sp.txt) return; if (t.length < 2) { toast('พิมพ์ชื่ออีกภาษาอย่างน้อย 2 ตัวอักษร', 'ℹ️'); return; } sp.alt = t; toast('เพิ่มชื่อลายเซ็นอีกภาษาแล้ว เซ็นเช็คได้ทั้ง ' + sp.txt + ' และ ' + t, '✍️'); };
  const sigCard = () => { const sp = V().sig; return `<div class="card" style="grid-template-columns:46px 1fr"><div class="ci">✍️</div><div class="cb"><h4>ลายเซ็นตัวอย่างที่ธนาคาร</h4>${sp ? `<div style="background:#fffdf3;border-radius:8px;padding:4px 10px;display:inline-block;margin:2px 0">${sigSvg(sp, 150)}</div><p class="dim">เช็คและแคชเชียร์เช็คทุกใบต้องเซ็นให้ตรงกับลายเซ็นนี้ · บันทึกวัน${E(RD(sp.day))}</p>${sp.txt ? (sp.alt ? `<p class="dim">ชื่อที่รับเซ็นได้: ${E(sp.txt)} · ${E(sp.alt)}</p>` : `<div class="row"><input id="s163Alt2" type="text" maxlength="30" placeholder="เพิ่มชื่ออีกภาษา เช่น Nakarin L." style="flex:1;min-width:0;font:inherit;font-size:15px;padding:7px;border-radius:10px;border:1px solid #ccc"><button class="btn" data-a="s163addalt">➕ เพิ่ม</button></div>`) : ''}<div class="row"><button class="btn ghost" data-a="s163rs">🔄 ขอเปลี่ยนลายเซ็นตัวอย่าง (สาขา จ–ศ ต้องมีบัตร ปชช.)</button></div>` : '<p class="dim">ยังไม่มี · เซ็นเช็คใบแรกแล้วระบบจะบันทึกให้เป็นลายเซ็นตัวอย่าง</p>'}</div></div>`; };

  try { if (typeof Bank2 !== 'undefined' && Bank2.log && !Bank2._slip) { const l0 = Bank2.log; Bank2.log = function (t, a) { const r = l0.apply(this, arguments); try { onLog(t, a); } catch (e) { } return r; }; Bank2._slip = 1; } } catch (e) { }
  window.Slip49 = { prev: prevNow, sigText, group, onLog, mkOf, make, show, sign, takeSig, tabHtml, sigCard, back: () => restore(SG.prev), sim, compact, statusOf, V, SIM_OK, SG };
});
