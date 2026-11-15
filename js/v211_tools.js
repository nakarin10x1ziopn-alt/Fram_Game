'use strict';
// ---------- v211_tools: keep the game healthy ----------
//  1. new-version banner: the page knows the build it was loaded with; when the server's build changes it offers a one-tap reload (saves first). The build is shown in the settings window.
//  2. another device is playing the same save: a clear warning (server lease, see server.py)
//  3. a <select> you changed is kept when the same window is drawn again (the company capital that went back to 1 million after paying is this class of bug)
//  4. start screen: what a NEW save starts with (test / medium / real)
//  5. self-test: open the game with ?selftest=1 (or the settings button 🧪) - runs the checks below on THIS device, shows the result and sends it to the server. Nothing is saved while it runs.
V23.add('v211_tools', () => {
  if (typeof UI === 'undefined' || typeof Net === 'undefined') return;
  const E = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const toast = (t, i) => { try { UI.toast(t, i || '🔄'); } catch (e) { } };
  const BUILD = window.__BUILD_ID || '';
  try { if (typeof CoMap !== 'undefined' && CoMap.drawAll) CoMap.drawAll(); } catch (e) { console.warn('v211 company buildings', e); }   // companies of the extra types are drawn now that every module has registered its types

  // ===== 1. new version =====
  let banner = null;
  const showBanner = nb => {
    if (banner) return;
    banner = document.createElement('button');
    banner.textContent = '🔄 มีเกมเวอร์ชันใหม่ — แตะเพื่อโหลดใหม่ (เซฟให้ก่อน)';
    banner.style.cssText = 'position:fixed;top:calc(8px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);z-index:60;padding:8px 14px;border-radius:14px;border:2px solid #ffd54f;background:#1b5e20;color:#fff;font:600 14px Kanit,sans-serif;max-width:92vw';
    banner.onclick = () => { try { if (G.started) saveGame(true); } catch (e) { } const go = () => { try { sessionStorage.setItem('raisukjai_recov', String(Date.now())); } catch (e) { } location.reload(); }; try { Net.flush(go); } catch (e) { go(); } };
    document.body.appendChild(banner);
  };
  const checkBuild = async () => {
    try {
      if (!BUILD || !Net.on || document.hidden) return;
      const p = await Net.api('ping'); if (p && p.build && p.build !== BUILD) showBanner(p.build);
    } catch (e) { }
  };
  setInterval(checkBuild, 60000); document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(checkBuild, 1500); });
  { const _m = UI.menu; if (_m) UI.menu = function () {
    const r = _m.apply(this, arguments);
    try { const c = UI.cur, rr = c && c.render; if (rr && !c.bld211) { c.bld211 = 1; c.render = function () { const h = rr.apply(this, arguments); return h.replace('</div>', `</div><p class="dim" style="margin:6px 4px">เวอร์ชันเกมในเครื่องนี้: <b>${E(BUILD || 'ไม่ทราบ (โหลดจากเว็บ)')}</b> · <button class="btn ghost" style="padding:2px 10px;min-height:0" data-a="selftest211">🧪 ตรวจระบบ</button></p>`); }; UI.renderBody(); } } catch (e) { }
    return r;
  }; }
  UI.H.selftest211 = () => { try { saveGame(true); } catch (e) { } const go = () => { location.href = location.pathname + '?selftest=1'; }; try { Net.flush(go); } catch (e) { go(); } };

  // ===== 2. another device =====
  let lastWarn = 0;
  Net.onConflict = r => { const now = Date.now(); if (now - lastWarn < 60000) return; lastWarn = now; toast(`⚠️ ${r.other || 'อีกเครื่อง'} เพิ่งเซฟเกมนี้เมื่อ ${r.secs || 0} วินาทีก่อน ถ้าเล่นสองเครื่องพร้อมกัน เซฟจะทับกัน ปิดเกมเครื่องใดเครื่องหนึ่ง`, '⚠️'); };

  // ===== 3. keep chosen <select> values when the same window is drawn again =====
  { let last = null; const _r = UI.renderBody;
    UI.renderBody = function () {
      const c = UI.cur, key = c ? c.title + '|' + c.tab : null; let snap = null;
      if (key && key === last) { try { snap = [...document.querySelectorAll('#mBody select[id]')].map(s => [s.id, s.value]); } catch (e) { } }
      const r = _r.apply(this, arguments); last = key;
      if (snap) try { for (const [id, v] of snap) { const e = document.getElementById(id); if (e && e.tagName === 'SELECT' && e.value !== v && [...e.options].some(o => o.value === v)) e.value = v; } } catch (e) { }
      return r;
    }; }

  // ===== 4. start screen: money of a new save =====
  const PROFILES = [['test', '🧪 ทดสอบ: ออมทรัพย์ 10,000 ล้าน · เลเวล 50'], ['mid', '⚖️ กลาง: ออมทรัพย์ 1 ล้าน · เลเวล 5'], ['real', '🌱 เล่นจริง: ออมทรัพย์ 30,000 + เงินสด 10,000 · เลเวล 1']];
  if (typeof Slots !== 'undefined' && Slots.initStart) {
    const _is = Slots.initStart.bind(Slots);
    Slots.initStart = function () {
      _is();
      try {
        const box = document.getElementById('slots'); if (!box || document.getElementById('startProf211')) return;
        let cur = 'test'; try { cur = localStorage.getItem('raisukjai_startmoney') || 'test'; } catch (e) { }
        const row = document.createElement('div'); row.id = 'startProf211'; row.style.cssText = 'display:flex;gap:8px;justify-content:center;align-items:center;margin:6px 0;flex-wrap:wrap;font-size:13px';
        row.innerHTML = `<span>เงินเริ่มต้นของเซฟ <b>ใหม่</b>:</span><select id="startSel211" style="font:inherit;font-size:13px;padding:5px 8px;border-radius:10px;max-width:92vw">${PROFILES.map(([k, t]) => `<option value="${k}" ${k === cur ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
        box.parentNode.insertBefore(row, box.nextSibling);
        document.getElementById('startSel211').onchange = e => { try { localStorage.setItem('raisukjai_startmoney', e.target.value); } catch (x) { } };
      } catch (e) { console.warn('v211 start', e); }
    };
  }

  // ===== 5. self-test =====
  const sleep = ms => new Promise(r => setTimeout(r, ms)), ri = () => Math.floor(Math.random() * 900 + 100);
  const errs = []; addEventListener('error', e => errs.push(`${e.message} @${String(e.filename || '').split('/').pop()}:${e.lineno}`)); addEventListener('unhandledrejection', e => errs.push('promise: ' + (e.reason && e.reason.message || e.reason)));
  const finite = (o, path, out, depth) => { if (depth > 6 || out.length > 12) return; if (typeof o === 'number') { if (!isFinite(o)) out.push(path); } else if (Array.isArray(o)) { o.forEach((x, i) => { if (x == null && depth <= 2) out.push(path + '[' + i + '] is empty'); else finite(x, path + '[' + i + ']', out, depth + 1); }); } else if (o && typeof o === 'object') { for (const k in o) finite(o[k], path + '.' + k, out, depth + 1); } };
  const TESTS = [
    ['เกมเริ่มได้ ไม่มี error ตอนโหลด', async () => { if (!S || !G.started) throw new Error('เกมยังไม่เริ่ม'); if (window.__bootErr) throw new Error(window.__bootErr); return `วันที่ ${S.day}`; }],
    ['โมดูลสำคัญโหลดครบ', async () => { const need = ['Company', 'Bank49', 'Gov24', 'Agency26', 'Contracts207', 'Bag208', 'Hours36', 'ServerSave209', 'Walkin28', 'Equity', 'DocRules']; const miss = need.filter(k => !window[k] && (() => { try { return typeof eval(k) === 'undefined'; } catch (e) { return true; } })()); if (miss.length) throw new Error('ขาด: ' + miss.join(', ')); return need.length + ' โมดูล'; }],
    ['เวลาเปิดทำการ ธนาคาร+ราชการ 05:00–18:00 ทุกวัน', async () => { const d0 = S.day, t0 = S.time, bad = []; let hol = null; for (let d = 1; d < 300; d++) if (Cal24.isHoliday(d)) { hol = d; break; } for (const d of [1, 6, 7, hol].filter(x => x)) { S.day = d; for (const [t, want] of [[4.9, 0], [5, 1], [12, 1], [17.9, 1], [18, 0]]) { S.time = t * 60; const b = Bank49.bankOpen() ? 1 : 0, g = ['revenue', 'district', 'sso2', 'docs'].map(i => Hours36.open(i) ? 1 : 0); if (b !== want || g.some(x => x !== want)) bad.push(`วัน ${d} เวลา ${t}`); } } S.day = d0; S.time = t0; if (bad.length) throw new Error(bad.slice(0, 3).join('; ')); return 'ผ่านทุกวัน/วันหยุด'; }],
    ['จำลอง 30 วันไม่ล้ม (ระบบรายวันทำงานจริง)', async () => {
      // tick(1440) moves the date but never crosses 06:00, so the daily systems do NOT run; tick(1439) crosses it once per call and runs newDay
      const d0 = S.day, w = []; const cw = console.warn; console.warn = function () { w.push([...arguments].map(x => String(x && x.message || x)).join(' ').slice(0, 120)); return cw.apply(console, arguments); };
      let nd = 0; const _nd = newDay; newDay = function () { nd++; return _nd.apply(this, arguments); };
      try { for (let i = 0; i < 30; i++) { tick(1439); if (S._c < 1000) S._c = 1000; } } finally { newDay = _nd; console.warn = cw; }
      if (nd < 28) throw new Error('ระบบรายวันทำงานแค่ ' + nd + ' ครั้งใน 30 วัน');
      const bad = []; finite(S, 'S', bad, 0); if (bad.length) throw new Error('ค่าผิดปกติ: ' + bad.slice(0, 4).join(', '));
      const sys = w.filter(x => /^v\d+|shop|month|day|contract|company/i.test(x)); if (sys.length) throw new Error('ระบบรายวันแจ้งข้อผิดพลาด: ' + sys.slice(0, 3).join(' | '));
      return `วัน ${d0} → ${S.day} (รายวันทำงาน ${nd} ครั้ง)`; }],
    ['เซฟแล้วอ่านกลับได้ ขนาดไม่ผิดปกติ', async () => { const txt = JSON.stringify(S), back = JSON.parse(txt); if (!back || back.day !== S.day) throw new Error('อ่านกลับไม่ตรง'); const kb = Math.round(new TextEncoder().encode(txt).length / 1024); if (kb > 5000) throw new Error('ใหญ่เกิน ' + kb + ' KB'); const holes = []; for (const k of ['animals', 'cars', 'plots']) if (Array.isArray(S[k]) && S[k].some(x => x == null)) holes.push(k); if (holes.length) throw new Error('มีช่องว่างในรายการ ' + holes.join(',')); return kb + ' KB'; }],
    ['กระเป๋าแยกที่มาถูกต้อง', async () => { const bad = Bag208.audit(); if (bad.length) throw new Error('ไม่ตรง: ' + bad.slice(0, 5).join(',')); return 'ตรง'; }],
    ['จดทะเบียนบริษัท ทุน 5 ล้าน จ่ายผ่านหน้าต่างชำระเงิน', async () => {
      const keep = { c: S._c, sav: Bank.st().sav };
      try { Gov24.grantId(); } catch (e) { }
      if (Bank.st().sav < 5e6) Bank.st().sav = 5e7; S._c = 2000;
      const nm = 'ทดสอบ' + Math.floor(Math.random() * 900 + 100); Company.reserve(nm, 'isp'); const c = Company.list().slice(-1)[0]; if (!c) throw new Error('จองชื่อไม่ได้'); c.st = 'named'; c.nameOK = S.day;
      Company.open && Company.open(); await sleep(300); UI.cur.tab = 3; UI.renderBody(); await sleep(200);
      const sel = document.getElementById('coCap' + c.id); if (!sel) throw new Error('ไม่เจอช่องเลือกทุน'); sel.value = '5000000';
      const code = []; const _pm = Phone.msg; Phone.msg = function (f, t) { const m = /รหัส OTP (\d{6})/.exec(String(t)); if (m) code.push(m[1]); return _pm.apply(this, arguments); };
      try {
        document.querySelector('button[data-a="coreg"][data-v="' + c.id + '"]').click(); await sleep(500);
        const pay = document.querySelector('button[data-a="p49m"][data-v="app"]'); if (!pay) throw new Error('หน้าต่างชำระเงินไม่ขึ้น');
        pay.click(); await sleep(500);
        if (document.getElementById('s169otp')) { if (!code.length) throw new Error('ไม่ได้รับรหัส OTP'); Otp169.setTxt(code[code.length - 1]); document.getElementById('s169otp').value = code[code.length - 1]; document.querySelector('button[data-a="s163otpok"]').click(); await sleep(800); }
      } finally { Phone.msg = _pm; }
      if (c.st !== 'reg' || c.cap !== 5000000) throw new Error(`สถานะ ${c.st} ทุน ${c.cap}`);
      return 'จดสำเร็จ ทุน 5,000,000';
    }],
    ['ธุรกิจ: สมุดบัญชีบริษัท ปันผล ตลาด แดชบอร์ด', async () => {
      if (!window.Biz212) throw new Error('ไม่มีโมดูลธุรกิจ (v212)');
      const c = Company.list().find(x => ['setup', 'open'].includes(x.st)); if (!c) { Gov24.grantId && Gov24.grantId(); }
      let co = c; if (!co) { Company.reserve('ตรวจ' + ri(), 'cafe'); co = Company.list().slice(-1)[0]; co.st = 'named'; co.nameOK = S.day; Company.register(co.id, CO_TYPES.cafe.cap, Company.partners()[0], Object.entries(CO_SITES).find(([k, X]) => X.kinds.includes('cafe'))[0]); for (let i = 0; i < 3; i++) tick(1439); }
      const l0 = co.led.length; co.cash += 1000000; if (co.led.length <= l0 && !co.led[0]) throw new Error('สมุดบัญชีไม่บันทึกเงินเข้า');
      const back = JSON.parse(JSON.stringify(S)), bc = back.co.list.find(x => x.id === co.id); if (!bc || bc.cash !== co.cash || !bc.led.length) throw new Error('เซฟสมุดบัญชีไม่ครบ');
      const room = Biz212.distributable(co), sav0 = Bank.st().sav; UI.H.bz212div({ v: co.id, k: '50000' }); if (room >= 50000 && !(Bank.st().sav > sav0)) throw new Error('จ่ายปันผลแล้วเงินไม่เข้าบัญชี');
      const x = Biz212.X(); const keep = JSON.stringify(x.mk); x.mk.ev = [{ id: 'boom', ico: '📈', sec: 'all', m: 1.5, until: S.day + 5, text: 't' }]; x.mk.until = S.day + 5; const m = Biz212.mult('cafe'); x.mk = JSON.parse(keep); if (Math.abs(m - 1.5) > 0.001) throw new Error('ตลาดไม่ส่งผลต่อรายได้');
      const rows = Biz212.biz(); if (!rows.length) throw new Error('แดชบอร์ดไม่เจอบริษัท'); Biz212.alerts(rows); if (!Biz212.checklist().items.length) throw new Error('ตัวนำทางว่าง');
      return `บริษัท ${rows.length} · สมุดบัญชี ${co.led.length} รายการ`; }],
    ['โหลดเกมที่มีบริษัทประเภทใหม่ (IT/ISP/โฮสติ้ง) ไม่ล้ม', async () => {
      // the first draw of company buildings happens at start-up BEFORE the modules that add those company types; it must skip them instead of crashing the whole boot
      const k = Object.keys(CO_TYPES).find(x => !['it', 'sec', 'solar', 'cafe', 'food', 'logistics', 'ev', 'dc'].includes(x)); if (!k) return 'ไม่มีประเภทเสริม (ข้าม)';
      const T0 = CO_TYPES[k], fake = { id: 99991, type: k, st: 'setup', site: 'office', name: 'ทดสอบบูต', staff: [], eq: {}, lic: {}, licApp: {} };
      delete CO_TYPES[k]; try { CoMap.draw(fake); } finally { CO_TYPES[k] = T0; }
      return 'ข้ามประเภทที่ยังไม่ลงทะเบียนได้ (' + k + ')'; }],
    ['สัญญาลูกค้า: มีข้อเสนอทุกประเภทธุรกิจ', async () => { const miss = []; for (const k of Object.keys(CO_TYPES)) { if (k === 'sec') continue; const fam = Contracts207.FAMILY[k]; if (!fam || !fam.length) miss.push(k); } if (miss.length) throw new Error('ไม่มีสัญญา: ' + miss.join(',')); return Object.keys(CO_TYPES).length + ' ประเภท'; }],
    ['ประชุมบอร์ด: ครบ 6 คน แต่ต้องมีกรรมการโหวตได้ 3 คน · อนุมัติสัญญาดูเนื้อสัญญา · ไม่เลื่อนเกินวันหมดอายุ', async () => {
      const A = window.Agm216; if (!A || !A.boardOK || !A.ctScore) return 'ไม่มีระบบบอร์ด (ข้าม)';
      const mk = (nb, ne) => ({ id: 99992, st: 'closed', name: 'ทดสอบบอร์ด', cap: 1e5, reg: [], mine: 1, cash: 1e6, board: Array.from({ length: nb }, (_, i) => ({ n: 'ก' + i })), exec: Array.from({ length: ne }, (_, i) => ({ n: 'ผ' + i, k: 'ceo' })) });
      const a = mk(1, 4), b = mk(2, 3), c5 = mk(2, 2);   // chair+1 vote +4 exec = 6 but only 2 can vote; chair+2+3 = 6 and 3 vote; chair+2+2 = 5
      if (A.boardOK(a)) throw new Error('บอร์ดที่โหวตได้ 2 คนไม่ควรผ่าน'); if (!A.boardOK(b)) throw new Error('ประธาน+กรรมการ 2+ผู้บริหาร 3 (6 คน โหวต 3) ควรประชุมได้'); if (A.boardOK(c5)) throw new Error('5 คนไม่ควรประชุมได้');
      const good = { reqs: [], sla: 0, cost: 0.3, value: 100000 }, bad = { reqs: [['x', 'ขาด']].map(r => r), sla: 99, cost: 0.8, value: 9e6 };
      const hi = A.ctScore(b, good); const lo = A.ctScore(b, Object.assign({}, bad, { reqs: [] })); if (!(hi > lo)) throw new Error('สัญญาดีควรผ่านง่ายกว่าสัญญาเสี่ยง ' + hi + ' vs ' + lo);
      { const d = mk(0, 3); const n0 = A.dirCount(d), v0 = A.dirOnly(d); d.exec[0].dir = 1; d.board.push({ n: d.exec[0].n, role: 'dir', appt: 1 }); d.exec[1].dir = 1; d.board.push({ n: d.exec[1].n, role: 'dir', appt: 1 });
        if (A.dirCount(d) !== n0 + 2 - 2 + 0 && A.dirCount(d) !== n0) throw new Error('ผู้บริหารที่เลื่อนเป็นกรรมการถูกนับซ้ำ'); if (A.dirOnly(d) !== v0 + 2) throw new Error('จำนวนคนโหวตไม่เพิ่ม'); if (!A.boardOK(Object.assign(d, { exec: d.exec.concat([{ n: 'x1', k: 'cmo' }, { n: 'x2', k: 'cto' }]) }))) throw new Error('ประธาน+ผู้บริหาร 2 คนที่เป็นกรรมการ ควรประชุมได้'); }
      { const small = mk(1, 0), big2 = Object.assign(mk(1, 0), { cap: 2e7 }); const s1 = A.execSal(small, 'ceo'), s2 = A.execSal(big2, 'ceo'); if (!(s1 >= 80000 && s2 > s1)) throw new Error('เงินเดือนผู้บริหารควรสมจริงและเพิ่มตามขนาดบริษัท ' + s1 + '/' + s2); if (A.feeOpts(big2)[0] <= A.feeOpts(small)[0]) throw new Error('ค่าตอบแทนกรรมการควรเพิ่มตามขนาดบริษัท'); if (A.feeCount(Object.assign(mk(2, 0), { board: [{ n: 'a' }, { n: 'b', execK: 'ceo' }] })) !== 2.5) throw new Error('ผู้บริหารที่เป็นกรรมการไม่ควรได้ค่าตอบแทนกรรมการ (ประธาน 1.5 เท่า)'); const w1 = A.wht(90000), w2 = A.wht(300000); if (!(w1 > 0 && w2 > w1 * 3)) throw new Error('หัก ณ ที่จ่ายควรก้าวหน้า ' + w1 + '/' + w2); if (A.sevDays({ since: S.day }) !== 0 || A.sevDays({ since: S.day - 84 }) !== 90 || A.sevDays({ since: S.day - 84 * 3 }) !== 180) throw new Error('ค่าชดเชยตามอายุงานไม่ตรง'); }
      { const f = Object.assign(mk(0, 0), { name: 'ทดสอบเงินเดือน', cash: 1e6, ytd: 0, books: { rev: 0, cost: 0 }, exec: [{ k: 'ceo', n: 'ซีอีโอทดสอบ', since: S.day - 84, sal: 90000 }] }); const c0 = f.cash; A.monthly(f);
        const e = f.exec[0]; if (f.cash >= c0 - 90000 || e.pvd !== 9000 || !(f.whtPaid > 0)) throw new Error('จ่ายเงินเดือนผู้บริหารไม่ถูก (เงินสด ' + f.cash + ' กองทุน ' + e.pvd + ')');
        f.cash = 1000; A.monthly(f); if (!f.exec.length || !f.owe.length) throw new Error('เดือนแรกที่เงินไม่พอควรค้างจ่ายและยังไม่ลาออก'); A.monthly(f); if (f.exec.length) throw new Error('ค้างจ่าย 2 เดือนควรลาออก'); }
      { const big = { id: 99993, st: 'open', name: 'ทดสอบ', paid: 8e6, cash: 6e6, ytd: 2e6, reg: [], mine: 1, board: [], exec: [] }; const L2 = Board217.cands(big); if (!L2.length) throw new Error('ไม่มีผู้ที่เชิญเป็นกรรมการได้เลย'); if (L2.some(x => /ชาวบ้าน|เพื่อน|คนสนิท/.test(x.src))) throw new Error('รายชื่อกรรมการต้องไม่มีชาวบ้าน/เพื่อนแล้ว'); const need = Math.round(big.paid * 0.05 / 0.95 * 0.9); if (L2.some(x => x.wealth < need)) throw new Error('ผู้ที่เชิญควรมีเงินพอสำหรับหุ้น 5% (' + need + ')'); }
      return `โหวตได้ 3 ผ่าน · โอกาสอนุมัติ ดี ${Math.round(hi * 100)}% / เสี่ยง ${Math.round(lo * 100)}%`; }],
    ['ประชุมบอร์ด: เลือกหลายวาระนัดครั้งเดียว · ถามตอบเฉพาะวาระที่เลือก (ประชุมใหญ่ถึงครบทุกวาระ)', async () => {
      const A = window.Agm216, K = window.Equity && Equity.core; if (!A || !A.startSession || !K) return 'ไม่มีระบบประชุม (ข้าม)';
      const c = Company.list().find(x => ['setup', 'open'].includes(x.st)); if (!c) return 'ไม่มีบริษัท (ข้าม)'; const st0 = c.st; c.st = 'open'; try {
      const kk = o => ({ t: o.split('|')[0], v: +o.split('|')[1] || o.split('|')[1] });
      c.dr = { sh: [], bd: [] }; UI.H.ag217tog({ v: c.id, k: 'bd', x: 'budget|1|' }); UI.H.ag217tog({ v: c.id, k: 'bd', x: 'riskr|1|' }); UI.H.ag217tog({ v: c.id, k: 'bd', x: 'ins|1|' });
      if (c.dr.bd.length !== 3) throw new Error('ติ๊กหลายวาระไม่ได้ (' + c.dr.bd.length + ')'); UI.H.ag217tog({ v: c.id, k: 'bd', x: 'ins|1|' }); if (c.dr.bd.length !== 2) throw new Error('ติ๊กซ้ำควรยกเลิก'); UI.H.ag217clr({ v: c.id, k: 'bd' });
      const run = scope => { const m = K.mk('co:' + c.id, [{ t: 'budget', v: 1 }, { t: 'riskr', v: 1 }], S.day + 1, 'me'); m.kind = 'board'; m.scope = scope; const r0 = Math.random; Math.random = () => 0.01; try { A.startSession(m); } finally { Math.random = r0; } const SS = A.session; return SS && SS.script ? { n: new Set(SS.script.filter(x => x.k === 'ag').map(x => x.n)).size, q: SS.script.filter(x => x.k === 'q').length, SS } : null; };
      const a = run('items'), f = run('full'); if (!a || !f) return 'ประชุมไม่ครบองค์ประชุมในเทสต์ (ข้าม)';
      const pts = new Set(a.SS.m.items.map(it => A.agOf(it.t))); if (a.n > pts.size) throw new Error('ประชุมเฉพาะวาระที่เลือกแต่มี ' + a.n + ' วาระ (เลือกไว้ ' + pts.size + ' จุด)'); if (!(f.n > a.n)) throw new Error('ประชุมใหญ่ควรมีวาระมากกว่า ' + f.n + ' vs ' + a.n);
      return `เฉพาะที่เลือก ${a.n} วาระ ${a.q} คำถาม · ประชุมใหญ่ ${f.n} วาระ ${f.q} คำถาม`; } finally { c.st = st0; } }],
    ['ประชุมบอร์ด: ประธานไม่ลงคะแนน ออกเสียงชี้ขาดเฉพาะเมื่อคะแนนกรรมการเสมอ · ผู้บริหารไม่มีสิทธิออกเสียง', async () => {
      const A = window.Agm216, K = window.Equity && Equity.core; if (!A || !A.chairOf || !A.finishNow || !K) return 'ไม่มีระบบประชุม (ข้าม)';
      const L = Company.st().list, ty = Object.keys(CO_TYPES)[0], r0 = Math.random, key = 'co:99941';
      const mkd = n => ({ n, role: 'dir', mood: 50, trait: 'cons', since: S.day - 10 });
      const f = { id: 99941, name: 'ทดสอบประธาน', type: ty, st: 'open', cash: 9e6, loan: 0, mine: 0.6, paid: 9e6, cap: 9e6, ytd: 0, rep: 70, regDay: -400, h: [], reg: [], staff: [], br: [], pend: [], hist: [], books: { rev: 0, cost: 0 }, board: ['ก', 'ข', 'ค', 'ง'].map(n => mkd('กรรมการ ' + n)), exec: [{ k: 'ceo', n: 'ซีอีโอ ทดสอบ', sal: 90000, since: S.day - 100, mood: 60, trait: 'cons' }], lic: {}, eq: {}, of: [], shares: 10000, par: 100, licApp: {}, licExp: {}, renew: {}, mon: [], led: [] };
      L.push(f);
      const seq = a => { let i = 0; Math.random = () => (i < a.length ? a[i++] : 0.5); };
      const start = () => { const m = K.mk(key, [{ t: 'riskr', v: 1 }], S.day + 1, 'me'); m.kind = 'board'; m.scope = 'items'; Math.random = () => 0.01; A.startSession(m); const SS = A.session; if (!SS || !SS.quorum) throw new Error('เปิดประชุมทดสอบไม่ได้'); SS.ph = 'vote'; SS.vi = 0; return SS; };
      try {
        // 1) you chair: 4 directors vote 2-2, you are not counted, then you cast the deciding vote
        let SS = start(); if (!A.chairOf(SS).me) throw new Error('ไม่มีประธานที่เลือกไว้ คุณต้องเป็นประธาน');
        if (!/ขอให้กรรมการลงมติ/.test(A.screen()) || /data-y="1"/.test(A.screen())) throw new Error('ประธานต้องไม่มีปุ่มลงคะแนนก่อนกรรมการลงมติ');
        seq([0.01, 0.99, 0.01, 0.99]); UI.H.agm216call(); let r = SS.pre[0];
        if (r.votes.length !== 4 || r.cy !== 2 || r.cn !== 2) throw new Error('กรรมการ 4 คนควรลงคะแนน 2-2 โดยไม่นับประธาน ได้ ' + r.cy + '-' + r.cn + ' จาก ' + r.votes.length);
        if (r.votes.some(v => /ซีอีโอ/.test(v.n))) throw new Error('ผู้บริหารต้องไม่มีสิทธิออกเสียง');
        if (!/ชี้ขาด: เห็นด้วย/.test(A.screen())) throw new Error('คะแนนเสมอ ต้องให้ประธานชี้ขาด');
        UI.H.agm216vote({ y: '0' }); let res = A.finishNow(); if (res[0].pass || !/ชี้ขาด: ไม่เห็นด้วย/.test(res[0].chairTxt)) throw new Error('ประธานชี้ขาดไม่เห็นด้วย มติต้องไม่ผ่าน');
        // 2) 3-1: decided by the directors, no button for the chair to vote
        SS = start(); seq([0.01, 0.01, 0.01, 0.99]); UI.H.agm216call(); const h2 = A.screen();
        if (/ชี้ขาด: เห็นด้วย/.test(h2) || !/ประธานไม่ต้องออกเสียง/.test(h2)) throw new Error('คะแนนไม่เสมอ ประธานต้องไม่ได้ออกเสียง');
        UI.H.agm216vote({ y: '-' }); res = A.finishNow(); if (!res[0].pass || res[0].cy !== 3 || res[0].cn !== 1 || !/ไม่ออกเสียง/.test(res[0].chairTxt)) throw new Error('3-1 ต้องผ่านโดยประธานไม่ออกเสียง');
        // 3) an elected chair: that director does not vote; you vote as a director; on a tie the chair decides
        f.chair = 'กรรมการ ก'; SS = start(); const cx = A.chairOf(SS); if (cx.me || cx.h.n !== 'กรรมการ ก') throw new Error('ประธานที่เลือกไว้ต้องเป็นผู้ดำเนินการประชุม');
        if (!/data-y="1"/.test(A.screen())) throw new Error('เมื่อคนอื่นเป็นประธาน คุณต้องลงคะแนนในฐานะกรรมการได้');
        UI.H.agm216vote({ y: '1' }); seq([0.01, 0.99, 0.99, 0.01]); res = A.finishNow();
        if (res[0].votes.some(v => v.n === 'กรรมการ ก')) throw new Error('ประธานต้องไม่อยู่ในรายชื่อผู้ลงคะแนน'); if (res[0].cy !== 2 || res[0].cn !== 2) throw new Error('ควรเสมอ 2-2 ได้ ' + res[0].cy + '-' + res[0].cn);
        if (!res[0].pass || !/กรรมการ ก.*ชี้ขาด: เห็นด้วย/.test(res[0].chairTxt)) throw new Error('คะแนนเสมอ ประธานที่เลือกไว้ต้องชี้ขาด');
        SS = start(); UI.H.agm216vote({ y: '1' }); seq([0.01, 0.01, 0.99]); res = A.finishNow(); if (!res[0].pass || res[0].cy !== 3 || !/ไม่ออกเสียง/.test(res[0].chairTxt)) throw new Error('3-1 ประธานที่เลือกไว้ต้องไม่ออกเสียง');
        return 'ผ่าน · เสมอ 2-2 ประธานชี้ขาด · 3-1 ประธานไม่ออกเสียง · ผู้บริหารไม่มีสิทธิ';
      } finally { Math.random = r0; try { UI.H.agm216quit(); } catch (e) { } const s = K.st(); for (const k of ['mt', 'mins']) if (Array.isArray(s[k])) for (let i = s[k].length - 1; i >= 0; i--) if (s[k][i] && s[k][i].key === key) s[k].splice(i, 1); const j = L.indexOf(f); if (j >= 0) L.splice(j, 1); } }],
    ['นอน: เลือกจำนวนวัน 1-30 · 1 คืนเหมือนเดิม · หลายคืนวันเดินตามที่เลือก · เกิน 30 ถูกจำกัด', async () => {
      const Z = window.SleepDays260; if (!Z) return 'ไม่มีระบบ (ข้าม)'; if (TimeMode.real()) return 'โหมดเวลาจริง (ข้าม)';
      const w = ms => new Promise(r => setTimeout(r, ms)), res = [];
      const night = async n => { S.time = 1320; UI.close(); UI.confirm('นอนหลับถึงเช้า?', 'x', 'นอนเลย', () => window.sleep(false)); if (!/sd260pick/.test(document.getElementById('mBody').innerHTML)) throw new Error('ไม่มีตัวเลือกจำนวนวัน'); const inp = document.getElementById('sd260n'); inp.value = n; const d0 = S.day; UI.H.sd260go(); const p0 = Z.pending(); await w(2500); const dd = S.day - d0; if (S.time < 330 || S.time > 420) throw new Error('ตื่นผิดเวลา ' + S.time + ' pend ' + p0 + ' paused ' + G.paused + ' d ' + dd); return dd; };
      let d = await night(1); if (d !== 1) throw new Error('คืนเดียวควรเดิน 1 วัน ได้ ' + d); res.push('1→' + d);
      d = await night(3); if (d !== 3) throw new Error('3 วันควรเดิน 3 วัน ได้ ' + d); res.push('3→' + d);
      if (S.hunger < 19 || S.thirst < 19) throw new Error('หิว/กระหายต่ำเกินไป');
      d = await night(99); if (d !== 30) throw new Error('99 ต้องถูกจำกัดที่ 30 ได้ ' + d); res.push('99→' + d);
      if (Z.pending() !== 0) throw new Error('คำขอนอนค้าง');
      return 'ผ่าน · ' + res.join(' · ');
    }],
    ['จดทะเบียนบริษัท: ตัวเลือกผู้ถือหุ้นร่วมเป็นคนภายนอก 4 คน ไม่มีชาวบ้าน/เพื่อน/คู่สมรส · ใช้ชื่อนอกรายชื่อไม่ได้', async () => {
      if (!window.Partners259) return 'ไม่มีระบบ (ข้าม)';
      const P = Partners259, bad = Invite257.villagers(); const keep = S.coPartners, f0 = S.friends['เพื่อนทดสอบ'];
      try {
        S.friends['เพื่อนทดสอบ'] = 9; S.coPartners = null; const L = P.pool(); if (L.length !== 4) throw new Error('ต้องมี 4 ตัวเลือก ได้ ' + L.length);
        if (new Set(L.map(p => p.n)).size !== 4) throw new Error('ชื่อซ้ำ'); if (L.some(p => bad.has(p.n) || p.n === 'เพื่อนทดสอบ')) throw new Error('มีคนในหมู่บ้านในตัวเลือก');
        if (Company.partners().includes('นักลงทุนอิสระ') || Company.partners().includes('เพื่อนทดสอบ')) throw new Error('ตัวเลือกเก่ายังอยู่');
        const again = P.pool(); if (again !== L && again.map(p => p.n).join() !== L.map(p => p.n).join()) throw new Error('ตัวเลือกเปลี่ยนเองก่อนครบ 30 วัน');
        const c = { id: 99945, name: 'ทดสอบจด', type: Object.keys(CO_TYPES)[0], st: 'named', nameOK: S.day }; Company.st().list.push(c); const m0 = S.money;
        try { Company.register(99945, 1e9, 'เพื่อนทดสอบ', Object.keys(CO_SITES)[0]); if (c.st !== 'named' || S.money !== m0) throw new Error('ใช้เพื่อนเป็นผู้ถือหุ้นร่วมได้'); }
        finally { const j = Company.st().list.indexOf(c); if (j >= 0) Company.st().list.splice(j, 1); }
        const h = Company.html(3); if (h.includes('id="coPartner') && !h.includes(L[0].n)) throw new Error('หน้าจดทะเบียนไม่แสดงรายชื่อ');
        return 'ผ่าน · ' + L.map(p => p.n).join(', ');
      } finally { if (f0 == null) delete S.friends['เพื่อนทดสอบ']; else S.friends['เพื่อนทดสอบ'] = f0; S.coPartners = keep; } }],
    ['เลิกกิจการ: ชำระหนี้เงินกู้และค่าชดเชยก่อน แล้วแบ่งตามสัดส่วนหุ้น · ปันผลไม่แตะทุนที่ชำระแล้ว', async () => {
      const L = Company.st().list, m0 = S.money, ty = Object.keys(CO_TYPES)[0];
      const mkc = (id, o) => Object.assign({ id, name: 'ทดสอบ' + id, type: ty, st: 'open', cash: 0, loan: 0, mine: 1, paid: 0, ytd: 1, h: [], staff: [], br: [], pend: [], hist: [], books: { rev: 0, cost: 0 } }, o);
      const a = mkc(99001, { cash: 520000, loan: 100000, mine: 0.5, partner: 'หุ้นส่วน', h: [{ id: 1, n: 'หุ้นส่วน', k: 'npc', pct: 0.5, div: 0 }], staff: [{ r: 'worker', sal: 30000, name: 'พนักงานทดสอบ', since: S.day - 100 }], br: [{ id: 1, st: 'open', dep: 10000 }] });
      const b = mkc(99002, { cash: 150000, paid: 100000 }), c2 = mkc(99003, { cash: 500000 });
      L.push(a, b, c2); try {
        UI.H.coclose({ v: 99001 });
        // 520000 + 8000 (branch deposit 80%) - 20000 - 90000 (severance 90 days) - 100000 (loan) = 318000, half to the founder
        if (S.money - m0 !== 159000) throw new Error('เงินคืนเจ้าของผิด ' + (S.money - m0) + ' (ควร 159000)');
        if (a.cash !== 0 || a.loan !== 0 || a.staff.length || a.st !== 'closed' || a.br[0].st !== 'closed') throw new Error('ล้างสถานะบริษัทไม่ครบ');
        { const got = (a.reg || []).reduce((t, h) => t + (h.div || 0), 0); if (got !== 159000) throw new Error('ผู้ถือหุ้นอื่นรวมกันได้ส่วนแบ่งผิด ' + got + ' (ควร 159000)'); }
        const m1 = S.money; UI.H.coclose({ v: 99001 }); if (S.money !== m1) throw new Error('เลิกกิจการซ้ำจ่ายเงินอีก');
        const m2 = S.money; UI.H.codiv({ v: 99002 }); if (S.money !== m2 || b.cash !== 150000) throw new Error('ปันผลแตะทุนที่ชำระแล้ว');
        UI.H.codiv({ v: 99003 }); if (c2.cash !== 400000) throw new Error('ปันผลปกติควรจ่ายได้ 100000 (เหลือ ' + c2.cash + ')');
        return 'ผ่าน'; } finally { for (const x of [a, b, c2]) { const i = L.indexOf(x); if (i >= 0) L.splice(i, 1); } S.money = m0; } }],
    ['สัญญาลูกค้าใหญ่ (≥ 1,000,000): เจ้าของอนุมัติเองได้เฉพาะตอนที่บอร์ดยังประชุมไม่ได้', async () => {
      const L = Company.st().list, ty = Object.keys(CO_TYPES)[0], A = window.Agm216; if (!A || !A.boardOK || !UI.H.ctown) return 'ไม่มีระบบบอร์ด (ข้าม)';
      const f = { id: 99010, name: 'ทดสอบสัญญา', type: ty, st: 'open', cash: 0, mine: 1, paid: 0, h: [], staff: [], br: [], exec: [], board: [], pend: [], hist: [] };
      L.push(f); try {
        if (A.boardOK(f)) throw new Error('บริษัทที่มีแค่เจ้าของไม่ควรประชุมบอร์ดได้');
        const ct = Contracts207.st(f), big = { id: 1, value: 1200000, exp: S.day + 1, title: 'งานใหญ่', cust: 'ทดสอบ' }, small = { id: 2, value: 200000, exp: S.day + 1, title: 'งานเล็ก', cust: 'ทดสอบ' };
        ct.offers.list.push(big, small);
        UI.H.ctown({ v: f.id, i: 2 }); if (small.boardOK) throw new Error('สัญญาต่ำกว่า 1,000,000 ไม่ควรถูกอนุมัติผ่านปุ่มนี้');
        UI.H.ctown({ v: f.id, i: 1 }); if (!big.boardOK) throw new Error('บอร์ดยังไม่ครบ เจ้าของควรอนุมัติสัญญาใหญ่ได้'); if (big.exp < S.day + 3) throw new Error('ควรขยายวันหมดอายุอย่างน้อย 3 วัน');
        // with a full board the owner shortcut must be refused
        const full = Object.assign({}, f, { id: 99011, board: [{ n: 'ก', role: 'dir' }, { n: 'ข', role: 'dir' }], exec: [{ n: 'ค', k: 'cfo' }, { n: 'ง', k: 'cmo' }, { n: 'จ', k: 'cto' }], ct: { offers: { day: -99, list: [{ id: 3, value: 700000, exp: S.day + 1, title: 'งานใหญ่ 2', cust: 'ทดสอบ' }] }, active: [], done: [], seq: 0 } });
        L.push(full); try { if (!A.boardOK(full)) return 'ข้ามส่วนบอร์ดครบ (เงื่อนไขทดสอบไม่ครบ)'; UI.H.ctown({ v: 99011, i: 3 }); if (full.ct.offers.list[0].boardOK) throw new Error('บอร์ดครบแล้ว เจ้าของไม่ควรข้ามมติ'); } finally { const i = L.indexOf(full); if (i >= 0) L.splice(i, 1); }
        return 'ผ่าน'; } finally { const i = L.indexOf(f); if (i >= 0) L.splice(i, 1); } }],
    ['ผู้บริหารหลายฝ่าย: ทุกตำแหน่งมีชื่อย่อ เงินเดือน เป้าหมายไตรมาส และอยู่ในฝ่ายใดฝ่ายหนึ่ง', async () => {
      const A = window.Agm216; if (!A || !A.EXEC || !A.DEPT || !A.KPI228) return 'ไม่มีระบบผู้บริหาร (ข้าม)';
      const P = A.EXEC.POS, ks = Object.keys(P); if (ks.length < 15) throw new Error('ตำแหน่งผู้บริหารมีแค่ ' + ks.length + ' ตำแหน่ง ควรมีอย่างน้อย 15');
      const inDept = new Set(); for (const d of A.DEPT) for (const k of d[2]) { if (inDept.has(k)) throw new Error('ตำแหน่ง ' + k + ' อยู่ซ้ำหลายฝ่าย'); inDept.add(k); }
      const c = { cap: 1e6, paid: 1e6, cash: 5e6, listed: false, reg: [], exec: [], board: [] };
      for (const k of ks) {
        if (!/\(([A-Z]+)\)/.test(P[k].n)) throw new Error(k + ' ไม่มีชื่อย่อในวงเล็บ'); if (!(A.EXEC.base[k] > 0) || !(A.execSal(c, k) > 0)) throw new Error(k + ' ไม่มีเงินเดือน');
        if (!A.KPI228[k]) throw new Error(k + ' ไม่มีเป้าหมายไตรมาส'); if (!inDept.has(k)) throw new Error(k + ' ไม่อยู่ในฝ่ายใดเลย'); if (!Array.isArray(P[k].cover) || !P[k].cover.length) throw new Error(k + ' ไม่มีวาระที่ดูแล');
      }
      for (const k of inDept) if (!P[k]) throw new Error('ฝ่ายอ้างตำแหน่ง ' + k + ' ที่ไม่มีจริง');
      return `${ks.length} ตำแหน่ง ใน ${A.DEPT.length} ฝ่าย`; }],
    ['ผู้บริหารตามประเภทธุรกิจ: ทุกประเภทมีตำแหน่งแนะนำที่มีจริง · ประเภทกรรมการคละกัน ไม่ซ้ำประเภทเดียวทั้งบอร์ด', async () => {
      const A = window.Agm216; if (!A || !A.recFor || !A.pickTrait) return 'ไม่มีระบบ (ข้าม)'; const P = A.EXEC.POS, fams = {};
      for (const k of Object.keys(CO_TYPES)) { const c = { type: k }, rec = A.recFor(c); if (!rec.length) throw new Error(k + ' ไม่มีตำแหน่งแนะนำ'); for (const x of rec) if (!P[x]) throw new Error(k + ' แนะนำตำแหน่ง ' + x + ' ที่ไม่มีอยู่จริง'); if (!rec.includes('ceo') || !rec.includes('cfo')) throw new Error(k + ' ต้องมี CEO และ CFO'); fams[A.famOf(c)] = (fams[A.famOf(c)] || 0) + 1; }
      if (A.recFor({ type: 'it' }).join() === A.recFor({ type: 'logistics' }).join()) throw new Error('ธุรกิจต่างกันควรได้ตำแหน่งแนะนำต่างกัน'); if (!A.recFor({ type: 'cafe' }).includes('ccuo') || !A.recFor({ type: 'logistics' }).includes('chso') || !A.recFor({ type: 'it' }).includes('ciso')) throw new Error('ตำแหน่งเฉพาะธุรกิจหายไป');
      const r0 = Math.random; let seed = 12345; Math.random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
      try {
        let mixed = 0, N = 300; const cnt = { cons: 0, growth: 0, indep: 0 };
        for (let t = 0; t < N; t++) { const c = { type: 'cafe', exec: [], board: [] }, set = new Set(); for (const k of ['ceo', 'cfo', 'cmo', 'cto', 'coo', 'cso']) { const tr = A.pickTrait(c, k); c.exec.push({ k, trait: tr }); set.add(tr); cnt[tr]++; } if (set.size >= 2) mixed++; }
        if (mixed / N < 0.99) throw new Error('บอร์ดที่เป็นประเภทเดียวกันทั้งชุดมากเกินไป (หลากหลายแค่ ' + mixed + '/' + N + ')');
        const tot = N * 6; for (const t of Object.keys(cnt)) if (cnt[t] / tot < 0.15) throw new Error('ประเภท ' + t + ' แทบไม่ถูกสุ่มเลย (' + cnt[t] + ')');
        let cf = 0, rk = 0; for (let t = 0; t < N; t++) { if (A.pickTrait({ exec: [], board: [] }, 'cfo') === 'cons') cf++; if (A.pickTrait({ exec: [], board: [] }, 'cbdo') === 'growth') rk++; } if (cf / N < 0.4 || rk / N < 0.5) throw new Error('ประเภทตามตำแหน่งไม่เป็นไปตามคาด (CFO สายระมัดระวัง ' + cf + '/' + N + ', CBDO สายขยาย ' + rk + '/' + N + ')');
        return `ครอบคลุม ${Object.keys(CO_TYPES).length} ประเภทธุรกิจ (${Object.entries(fams).map(([f, n]) => f + ' ' + n).join(', ')}) · คละกัน ${mixed}/${N}`;
      } finally { Math.random = r0; } }],
    ['มือถือแนวนอน (ไอแพด/โน้ตบุ๊ก): ซ้าย=หมวดแอป ขวา=เนื้อหา · แนวตั้ง/มือถือยังเป็นแบบเดิม', async () => {
      const L = window.PhoneLand240; if (!L || typeof Phone === 'undefined') return 'ไม่มีโมดูลมือถือแนวนอน (ข้าม)';
      const a0 = Phone.app, c0 = Phone.cat, f0 = L.force;
      try {
        L.force = true; Phone.app = null; Phone.cat = null; let h = Phone.render();
        if (!/class="phl"/.test(h) || !/phl-side/.test(h) || !/phl-main/.test(h)) throw new Error('แนวนอนต้องแบ่งเป็นซ้าย/ขวา');
        if (!/phl-sosbar/.test(h) || !/data-v="191"/.test(h)) throw new Error('เบอร์ฉุกเฉินหาย');
        const tiles = (h.match(/data-a="pcat"|data-a="app"/g) || []).length; if (tiles < 12) throw new Error('แอป/หมวดน้อยเกินไป ' + tiles);
        if (/pc59bg/.test(h)) throw new Error('แนวนอนไม่ควรมีหน้าต่างป๊อปอัปหมวด');
        Phone.cat = 'social'; h = Phone.render(); if (!/phl-head/.test(h) || !/class="on"/.test(h)) throw new Error('เปิดหมวดแล้วต้องมีหัวข้อและไฮไลต์หมวดทางซ้าย');
        const id = (APPS.find(x => x.id === 'msgs') || APPS[0]).id; Phone.cat = null; Phone.app = id; h = Phone.render(); if (!/phl-head/.test(h) || /ph-back/.test(h)) throw new Error('เปิดแอปแล้วต้องมีหัวข้อ และไม่มีปุ่มกลับแบบเดิมซ้ำ');
        Phone.app = null; L.force = false; h = Phone.render(); if (/class="phl"/.test(h)) throw new Error('แนวตั้งต้องเป็นแบบเดิม');
        return `${tiles} ช่องทางซ้าย · แนวตั้งไม่เปลี่ยน`;
      } finally { Phone.app = a0; Phone.cat = c0; L.force = f0; } }],
    ['ผู้สอบบัญชี: แสดงชื่อ ไม่ใช่รหัสตัวอักษร · ค่าตรวจบัญชีประจำปีไม่พังเมื่อแต่งตั้งด้วยมติบอร์ด', async () => {
      if (typeof audName !== 'function') throw new Error('ไม่มี audName');
      if (audName({ aud: 'a' }) === 'a' || !/สำนักงานบัญชี/.test(audName({ aud: 'a' }))) throw new Error('รหัส a ต้องแสดงเป็นชื่อสำนักงานบัญชี (ได้ ' + audName({ aud: 'a' }) + ')');
      if (audName({ aud: 'สำนักงานบัญชีขนาดเล็ก' }) !== 'สำนักงานบัญชีขนาดเล็ก') throw new Error('ชื่อที่ตั้งด้วยมติต้องแสดงตามเดิม'); if (audName({}) !== '') throw new Error('ยังไม่แต่งตั้งต้องว่าง');
      // a named auditor (from a board resolution) is not in the registration table: the January fee must still be charged without an error
      const L = Company.st().list, d0 = S.day, ty = Object.keys(CO_TYPES)[0], t = Cal36.date(d0), jan1 = MonthCal.dayNum(t.y + 1, 0, 1);
      const f = { id: 99040, name: 'ทดสอบผู้สอบบัญชี', type: ty, st: 'open', cash: 1e6, ytd: 0, mine: 1, paid: 0, h: [], staff: [], br: [], exec: [], board: [], pend: [], hist: [], books: { rev: 0, cost: 0 }, lic: {}, eq: {}, rep: 50, aud: 'สำนักงานบัญชีขนาดเล็ก', audFee: 60000, of: [], licApp: {}, licExp: {}, renew: {}, mon: [], led: [], ct: { offers: { day: -99, list: [] }, active: [], done: [], seq: 0 }, reg: [], steps: {}, year: 0, kwh: 0, peak: 0 };
      L.push(f); try { S.day = jan1; dayTick50(); if (f.cash !== 1e6 - 60000) throw new Error('ค่าตรวจบัญชี 1 ม.ค. ไม่ถูกหักตามที่ตกลง (เงินเหลือ ' + f.cash + ')'); return 'ผ่าน'; } finally { S.day = d0; const i = L.indexOf(f); if (i >= 0) L.splice(i, 1); } }],
    ['นักลงทุนภายนอก: นักธุรกิจ/เศรษฐี/นายทหารตำรวจยศสูงขอร่วมหุ้น · ข้าราชการประจำเป็นกรรมการไม่ได้ · ทะเบียนผู้ถือหุ้นถูกต้อง', async () => {
      const I = window.Inv241, A = window.Agm216; if (!I || !A) return 'ไม่มีระบบ (ข้าม)';
      const cnt = { biz: 0, rich: 0, officer: 0 }, srv = { s: 0, r: 0 }; let nul = 0;
      for (let t = 0; t < 400; t++) {
        const p = I.pick(1e7, 1); if (!p) { nul++; continue; } cnt[p.cls]++;
        if (!p.n || !p.prof) throw new Error('นักลงทุนไม่มีชื่อหรืออาชีพ'); if (!(p.pct >= 0.05 && p.pct <= 0.25)) throw new Error('สัดส่วนผิด ' + p.pct);
        if (p.ticket < I.MIN_TICKET[p.cls]) throw new Error('เช็คเล็กเกินกว่าที่คนกลุ่มนี้จะลงทุน ' + p.ticket); if (p.ticket > p.wealth * 0.5 + 1) throw new Error('เสนอเกินกำลังเงิน ' + p.ticket + ' / ' + p.wealth);
        if (p.k !== (p.cls === 'officer' ? 'ofc' : 'inv')) throw new Error('ชนิดผู้ถือหุ้นผิด');
        if (p.cls === 'officer') { p.serving ? srv.s++ : srv.r++; if (!/^(พ|น.)/.test(p.n)) throw new Error('นายทหาร/ตำรวจต้องมียศนำหน้า ' + p.n); }
      }
      if (nul > 80) throw new Error('บริษัทมูลค่า 10 ล้านควรมีนักลงทุนสนใจเกือบทุกครั้ง (ว่าง ' + nul + '/400)');
      for (const k of Object.keys(cnt)) if (cnt[k] < 30) throw new Error('ประเภท ' + k + ' แทบไม่ปรากฏ (' + cnt[k] + ')'); if (!srv.s || !srv.r) throw new Error('ต้องมีทั้งประจำการและเกษียณ');
      // a serving officer cannot sit on the board; a retired one can
      const c0 = { id: 99950, st: 'open', name: 'ทดสอบนายพล', type: 'it', mine: 0.6, board: [], exec: [], reg: [{ n: 'พล.ต.ต. ก', k: 'ofc', p: 0.2, serving: true, prof: 'x' }, { n: 'พล.ต. ข', k: 'ofc', p: 0.2, ret: true, prof: 'y' }], cap: 1e6, paid: 1e6, cash: 1e6 };
      A.syncBoard(c0); if (c0.board.some(d => d.n === 'พล.ต.ต. ก')) throw new Error('ข้าราชการประจำไม่ควรเป็นกรรมการ'); if (!c0.board.some(d => d.n === 'พล.ต. ข')) throw new Error('ผู้เกษียณที่ถือหุ้น 20% ควรเป็นกรรมการได้');
      // accepting an offer: the holder is in both registers with the right stake, and the company's reputation grows
      const L = Company.st().list, f = { id: 99951, name: 'ทดสอบรับนักลงทุน', type: 'it', st: 'open', cash: 1e6, ytd: 0, mine: 1, paid: 1e6, cap: 1e6, h: [], reg: [], staff: [], br: [], exec: [], board: [], pend: [], hist: [], books: { rev: 0, cost: 0 }, lic: {}, eq: {}, rep: 50, of: [], shares: 10000, par: 100 };
      L.push(f); try {
        const o = { id: 98001, who: 'คุณทดสอบ ผู้ลงทุน', kind: 'inv', pct: 0.1, mode: 'new', bid: 1e6, exp: S.day + 5, prof: 'เจ้าของโรงสีข้าวและโกดังสินค้า', cls: 'biz', serving: false, ret: false }; f.of = [o];
        UI.H.v50({ v: 'sel|' + f.id }); const rep0 = f.rep; UI.H.v50({ v: 'ok|98001' });
        const sum = (f.reg || []).reduce((t, h) => t + h.p, 0); if (Math.abs(sum - (1 - f.mine)) > 0.002) throw new Error('ทะเบียนผู้ถือหุ้นรวมไม่ตรงกับส่วนของเจ้าของ (' + sum.toFixed(3) + ' กับ ' + (1 - f.mine).toFixed(3) + ')');
        const h = (f.reg || []).find(x => x.n === o.who); if (!h || h.prof !== o.prof || Math.abs(h.p - 0.1) > 0.002) throw new Error('นักลงทุนไม่อยู่ในทะเบียนของห้องประชุมตามสัดส่วน'); if (!(f.h || []).some(x => x.n === o.who)) throw new Error('นักลงทุนไม่อยู่ในรายชื่อรับปันผล'); if (!(f.rep > rep0)) throw new Error('ชื่อเสียงควรเพิ่มเมื่อมีนักลงทุนใหม่');
      } finally { const i = L.indexOf(f); if (i >= 0) L.splice(i, 1); }
      return `ธุรกิจ ${cnt.biz} · เศรษฐี ${cnt.rich} · นายทหาร/ตำรวจ ${cnt.officer} (ประจำการ ${srv.s} เกษียณ ${srv.r}) จาก 400 ครั้ง`; }],
    ['เสนอตัวกับนักลงทุน: จ่ายค่านำเสนอ รอ 3 วัน ได้คำเสนอจากกลุ่มที่เลือก · พักได้ 14 วัน', async () => {
      const I = window.Inv241; if (!I || !window.dayTick50) return 'ไม่มีระบบ (ข้าม)';
      const L = Company.st().list, d0 = S.day, f = { id: 99961, name: 'ทดสอบเสนอตัว', type: 'it', st: 'open', cash: 3e6, ytd: 100000, mine: 1, paid: 3e6, cap: 3e6, h: [], reg: [], staff: [], br: [], exec: [], board: [], pend: [], hist: [], books: { rev: 0, cost: 0 }, lic: {}, eq: {}, rep: 75, of: [], shares: 10000, par: 100, licApp: {}, licExp: {}, renew: {}, mon: [], led: [] };
      L.push(f); const r0 = Math.random; try {
        Company.open(); UI.cur.tab = 2; UI.H.v50({ v: 'sel|' + f.id }); const cls = document.getElementById('v50PitchCls'), pc = document.getElementById('v50PitchPct'); if (!cls || !pc) throw new Error('ไม่มีแบบฟอร์มเสนอตัวในหน้าผู้ถือหุ้น');
        cls.value = 'officer'; pc.value = '0.1'; const c0 = f.cash; UI.H.v50({ v: 'pitch' }); if (!f.pitch || f.pitch.cls !== 'officer') throw new Error('กดนำเสนอแล้วไม่เกิดการนำเสนอ'); if (c0 - f.cash !== 30000) throw new Error('ค่านำเสนอไม่ถูกหัก (หักไป ' + (c0 - f.cash) + ')');
        const c1 = f.cash; UI.H.v50({ v: 'pitch' }); if (f.cash !== c1) throw new Error('นำเสนอซ้อนระหว่างรอผลไม่ควรจ่ายซ้ำ');
        const P0 = Object.assign({}, f.pitch); S.day = f.pitch.due; let o = null;
        for (let k = 0; k < 12 && !o; k++) { if (k) { f.pitch = Object.assign({}, P0); f.pitchNext = 0; } try { window.dayTick50(); } finally { } o = f.of.find(x => x.pitched); }   // the answer is random (a chance of a yes, a chance that nobody fits): the test tries again a few times
        o = o || f.of.find(x => x.pitched); if (!o) throw new Error('ครบ 3 วันแล้วควรมีคำเสนอจากผู้ที่ถูกเสนอตัว'); if (o.cls !== 'officer' || o.kind !== 'ofc') throw new Error('ได้คนผิดกลุ่ม ' + o.cls); if (o.pct > 0.1 + 1e-9) throw new Error('สัดส่วนเกินที่เสนอไว้ ' + o.pct);
        if (f.pitch) throw new Error('นำเสนอเสร็จแล้วต้องเคลียร์'); if (!(f.pitchNext > S.day)) throw new Error('ต้องมีช่วงพัก'); const c2 = f.cash; UI.H.v50({ v: 'pitch' }); if (f.cash !== c2 || f.pitch) throw new Error('ช่วงพักยังนำเสนอได้');
        return `${o.who} (${o.prof}) ขอ ${Math.round(o.pct * 100)}% ราคา ${o.bid}`;
      } finally { Math.random = r0; S.day = d0; try { UI.close(); } catch (e) { } const i = L.indexOf(f); if (i >= 0) L.splice(i, 1); } }],
    ['นายทหาร/ตำรวจในห้องประชุม: ถามเรื่องความปลอดภัย/กฎระเบียบ/ผลประโยชน์ทับซ้อน · อดีตนายทหารตำรวจเปิดงานหน่วยงานรัฐ ข้าราชการประจำไม่เปิด', async () => {
      const A = window.Agm216, I = window.Inv241; if (!A || !I || !window.Contracts207) return 'ไม่มีระบบ (ข้าม)';
      // 1) the room
      const L = Company.st().list, K = Equity.core, mkb = (n, ofc) => ({ n, role: 'dir', mood: 60, trait: 'cons', since: S.day - 10, ofc: !!ofc, prof: ofc ? 'ทดสอบ' : '' });
      const f = { id: 99962, name: 'ทดสอบห้องประชุม', type: 'it', st: 'open', cash: 3e6, ytd: 400000, mine: 0.6, paid: 3e6, cap: 3e6, h: [], reg: [], staff: [], br: [], exec: [], board: [mkb('พล.ร.ต. ทดสอบ เกษียณ', true), mkb('กรรมการ ข'), mkb('กรรมการ ค')], pend: [], hist: [], books: { rev: 0, cost: 0 }, lic: {}, eq: {}, rep: 60, of: [], shares: 10000, par: 100, licApp: {}, licExp: {}, renew: {}, mon: [], led: [] };
      L.push(f); const r0 = Math.random; let SSq = null;
      try {
        const m = K.mk('co:' + f.id, [{ t: 'riskr', v: 1 }, { t: 'cg', v: 1 }, { t: 'budget', v: 1 }], S.day + 1, 'me'); m.kind = 'board'; m.scope = 'items';
        Math.random = () => 0.01; try { A.startSession(m); } finally { Math.random = r0; } SSq = A.session; if (!SSq || !SSq.qs) throw new Error('เริ่มประชุมไม่ได้');
        const oq = SSq.qs.filter(x => x.q && x.q.askBy === 'ofc'); if (!oq.length) throw new Error('นายทหารในห้องประชุมต้องถามคำถามเฉพาะสายงาน'); if (oq.some(x => !x.by || !/พล\.ร\.ต\./.test(x.by.n))) throw new Error('คำถามเฉพาะนายทหารต้องถามโดยนายทหาร'); if (oq.length > 2) throw new Error('ถามมากเกินไป ' + oq.length);
        const opts = oq[0].q.o; if (!Array.isArray(opts) || opts.length < 3) throw new Error('คำถามต้องมีตัวเลือกตอบอย่างน้อย 3 ข้อ');
        // a room without an officer never gets these questions
        f.board = [mkb('กรรมการ ก'), mkb('กรรมการ ข'), mkb('กรรมการ ค')]; const m2 = K.mk('co:' + f.id, [{ t: 'riskr', v: 1 }, { t: 'cg', v: 1 }], S.day + 1, 'me'); m2.kind = 'board'; m2.scope = 'items'; Math.random = () => 0.01; try { A.startSession(m2); } finally { Math.random = r0; }
        if ((A.session.qs || []).some(x => x.q && x.q.askBy)) throw new Error('ห้องที่ไม่มีนายทหารไม่ควรได้คำถามเฉพาะสายงาน');
        // 2) public-body offers
        const gov = (reg) => { const g = { id: 99963, name: 'ทดสอบสัญญารัฐ', type: 'it', st: 'open', cash: 3e6, ytd: 0, mine: 0.7, paid: 3e6, rep: 70, h: [], reg, staff: [], br: [], exec: [], board: [], lic: {}, eq: {}, licApp: {}, licExp: {}, renew: {}, hist: [], mon: [], led: [], of: [] }; let n = 0, vat = 0; for (let i = 0; i < 60; i++) { Contracts207.st(g).offers = { day: -99, list: [] }; for (const o of Contracts207.offers(g)) if (o.gov) { n++; if (o.reqs.some(r => r.k === 'lic' && r.r === 'vat')) vat++; } } return { n, vat }; };
        const ret = gov([{ n: 'พล.ต. เกษียณ', k: 'ofc', p: 0.1, ret: true, prof: 'x' }]), srv = gov([{ n: 'พล.ต. ประจำการ', k: 'ofc', p: 0.1, serving: true, prof: 'x' }]), none = gov([]);
        if (ret.n < 10) throw new Error('ผู้ถือหุ้นที่เป็นอดีตนายทหารควรเปิดงานหน่วยงานรัฐบ่อย (ได้ ' + ret.n + ')'); if (ret.vat !== ret.n) throw new Error('งานรัฐต้องต้องจดภาษีมูลค่าเพิ่มทุกงาน'); if (srv.n || none.n) throw new Error('ข้าราชการประจำหรือไม่มีนายทหารไม่ควรเปิดงานรัฐ (' + srv.n + '/' + none.n + ')');
        return `คำถามเฉพาะนายทหาร ${oq.length} ข้อ · งานหน่วยงานรัฐ ${ret.n} งานจาก 60 รอบ (ประจำการ ${srv.n}, ไม่มี ${none.n})`;
      } finally { Math.random = r0; const i = L.indexOf(f); if (i >= 0) L.splice(i, 1); } }],
    ['ประกันและควบคุมภายในบริษัท: ซื้อจริง จ่ายเบี้ย เคลมเมื่อเกิดเหตุ · ระบบควบคุมลดทุจริต · ต้องมีมติบอร์ดเมื่อมีกรรมการ', async () => {
      const X = window.Risk243; if (!X) return 'ไม่มีระบบ (ข้าม)';
      const L = Company.st().list, ty = 'it', r0 = Math.random, hasB = !!window.Board217;
      const f = { id: 99970, name: 'ทดสอบความเสี่ยง', type: ty, st: 'open', cash: 3e6, loan: 0, mine: 1, paid: 3e6, cap: 3e6, ytd: 1, rep: 50, h: [], reg: [], staff: [], br: [], pend: [], hist: [], books: { rev: 0, cost: 0 }, board: [], exec: [], lic: {}, eq: {}, of: [], shares: 10000, par: 100, licApp: {}, licExp: {}, renew: {}, mon: [], led: [] };
      L.push(f);
      try {
        Company.open(); Company.sel = f.id; Company.tab229 = 'lic';
        const html = Company.html(0); if (!/ประกันภัยบริษัท/.test(html) || !/ระบบควบคุมภายในบริษัท/.test(html)) throw new Error('หน้าบริษัทต้องมีส่วนประกันและควบคุมภายใน');
        // 1) buy property insurance: premium paid from company cash, flag follows
        const pr = X.premium(f, 'prop', 'sukjai'); if (pr < 12000) throw new Error('เบี้ยขั้นต่ำประกันทรัพย์สิน 12,000 ได้ ' + pr);
        const c0 = f.cash; UI.H.rk243({ v: 'buy|prop|sukjai' });
        if (f.cash !== c0 - pr) throw new Error('จ่ายเบี้ยไม่ตรง ' + (c0 - f.cash) + ' ต้อง ' + pr); if (!f.insured) throw new Error('ซื้อแล้วต้องมีประกัน (c.insured)');
        UI.H.rk243({ v: 'buy|prop|sukjai' }); if (f.cash !== c0 - pr) throw new Error('ซื้อซ้ำไม่ควรหักเงินอีก');
        UI.H.rk243({ v: 'buy|bi|mankhong' }); if (!X.active(f, 'bi')) throw new Error('ซื้อประกันธุรกิจหยุดชะงักไม่ได้ทั้งที่มีประกันทรัพย์สิน');
        // 2) a fire: the policy pays 80% of the loss less the 5% excess, the rest is the company's
        Math.random = () => 0.5; const k0 = f.cash, res = X.incident(f, 'fire', 'quiet'); Math.random = r0;
        if (!(res.paid > 0) || res.paid >= res.loss || f.cash !== Math.max(0, k0 - res.mine)) throw new Error('เคลมไฟไหม้ผิดปกติ ' + JSON.stringify(res));
        // 3) no policy => the company pays it all
        const g = { ...f, id: 99971, cash: 3e6, rk: {}, hist: [], books: { rev: 0, cost: 0 } }; L.push(g); Math.random = () => 0.5; const k1 = g.cash, r2 = X.incident(g, 'theft', 'quiet'); Math.random = r0; L.splice(L.indexOf(g), 1);
        if (r2.paid !== 0 || g.cash !== k1 - r2.loss) throw new Error('ไม่มีประกันต้องรับเต็ม ' + JSON.stringify(r2));
        // 4) internal control: score, running cost, fraud loss reduced
        Math.random = () => 0.5; const h0 = { ...f, id: 99972, rk: {}, cash: 3e6, hist: [], books: { rev: 0, cost: 0 } }; L.push(h0); const fr0 = X.incident(h0, 'fraud', 'quiet'); L.splice(L.indexOf(h0), 1); Math.random = r0;
        UI.H.rk243({ v: 'icbuy|seg' }); UI.H.rk243({ v: 'icbuy|aud' }); X.sync(f);
        if (X.score(f) !== 55 || !f.ctrl) throw new Error('คะแนนควบคุมภายในควรเป็น 55 และผ่านเกณฑ์ ได้ ' + X.score(f));
        Math.random = () => 0.5; const fr1 = X.incident({ ...f, cash: 3e6, rk: f.rk, hist: [], books: { rev: 0, cost: 0 } }, 'fraud', 'quiet'); Math.random = r0;
        if (!(fr1.loss < fr0.loss * 0.6)) throw new Error('ระบบควบคุมต้องลดความเสียหายจากทุจริตเกิน 40% (' + fr0.loss + ' → ' + fr1.loss + ')');
        // 5) a company with directors needs the board's approval first
        if (hasB && f.board) { const g2 = { ...f, id: 99973, rk: {}, board: [{ n: 'กรรมการ ก', role: 'dir', mood: 60, trait: 'cons', since: S.day - 10 }], hist: [], books: { rev: 0, cost: 0 } }; L.push(g2); Company.sel = g2.id;
          try { if (Board217.board(g2).length > 0) { const c9 = g2.cash; UI.H.rk243({ v: 'buy|liab|sukjai' }); if (g2.cash !== c9) throw new Error('มีกรรมการแต่ซื้อได้โดยไม่มีมติบอร์ด'); g2.rk.insAuth = S.day; UI.H.rk243({ v: 'buy|liab|sukjai' }); if (g2.cash === c9) throw new Error('มีมติบอร์ดแล้วควรซื้อได้'); } } finally { L.splice(L.indexOf(g2), 1); Company.sel = f.id; } }
        // 6) expiry: auto-renew pays again, or lapses when the cash is short
        f.rk.pol.prop.until = S.day - 1; f.cash = 3e6; X.daily(); if (!X.active(f, 'prop') || f.rk.pol.prop.until <= S.day) throw new Error('ต่ออายุอัตโนมัติไม่ทำงาน');
        f.rk.pol.prop.until = S.day - 1; f.rk.pol.prop.lapsed = 0; f.cash = 100; X.daily(); if (X.active(f, 'prop')) throw new Error('เงินไม่พอต้องไม่ต่ออายุ'); if (f.insured) throw new Error('หมดอายุแล้ว c.insured ต้องเป็น 0');
        return 'ผ่าน · เบี้ยประกันทรัพย์สิน ' + pr + ' · เคลมไฟไหม้ ' + res.paid + '/' + res.loss + ' · ทุจริตลด ' + fr0.loss + ' → ' + fr1.loss;
      } finally { Math.random = r0; const j = L.indexOf(f); if (j >= 0) L.splice(j, 1); } }],
    ['เมืองที่เหลือ 3 เมือง: สองแถว/รถตู้รถทัวร์ไปถึงเมืองจริง · ไม่มีสำนักงานเกษตร/ร้านฟาร์มค้าง', async () => {
      if (typeof CV_INTER === 'undefined' || !window.Gov24 || !window.V23Kit) return 'ไม่มีระบบ (ข้าม)';
      const bad = CV_SONG.filter(r => /ทุ่งทอง|ภูผา|ริมทะเล/.test(r.n + r.stops.map(s => s.n).join('')));
      if (bad.length) throw new Error('สองแถวยังวิ่งไปเมืองที่ถูกลบ: ' + bad.map(r => r.n).join(', '));
      const keys = V23Kit.TOWNS.map(t => t.key), ik = CV_INTER.map(x => x.k);
      for (const k of keys) if (!ik.includes(k)) throw new Error('รถตู้/รถทัวร์ไม่มีปลายทาง ' + k);
      for (const k of ik) if (!keys.includes(k)) throw new Error('รถตู้/รถทัวร์ไปเมืองที่ไม่มีแล้ว ' + k);
      for (const D of CV_INTER) for (const o of D.o) if (!(o.fee > 0) || !(o.dur > 0) || !(o.every || o.at)) throw new Error('ตารางรถไม่ครบ ' + D.k);
      const off = Gov24.offices.filter(o => ['agri', 'livestock', 'fisheries'].includes(o.id)); if (off.length) throw new Error('ยังมีสำนักงานเกษตรค้าง');
      const names = V23Kit.TOWNS.map(t => t.shops.map(s => s[1]).join('|')).join('|'); if (/เกษตร|เมล็ดพันธุ์/.test(names)) throw new Error('ชื่อร้านในเมืองยังมีคำว่าเกษตร/เมล็ดพันธุ์');
      for (const t of V23Kit.TOWNS) t.shops.forEach(([ty], j) => { const tabs = V23Kit.stockFor(ty, t.size, 'v23_' + t.key + '_' + j); if (tabs.some(x => /ฟาร์ม/.test(x.n))) throw new Error('แท็บสินค้ายังเป็นฟาร์ม ' + t.key + ' ' + ty); });
      if (World.pois.some(o => /ศูนย์แข่งขัน/.test(o.label || '') || o.kind === 'contest')) throw new Error('ศูนย์แข่งขัน/ประกวดผลผลิตยังอยู่');
      if (typeof SYS !== 'undefined' && SYS.coop) throw new Error('สหกรณ์การเกษตรยังอยู่');
      return 'ผ่าน · ปลายทาง ' + ik.join(', ') + ' · สองแถว ' + CV_SONG.length + ' สาย';
    }],
    ['ไม่มีฟาร์มเหลือ: ไม่มีการแข่งขัน/แท็บฟาร์ม · ลานหน้าบ้านใหม่ (น้ำพุ รถเข็นกาแฟ ศาลา) วางครบและไม่ทับสิ่งเดิม', async () => {
      const Y = window.Yard245; if (!Y) return 'ไม่มีระบบ (ข้าม)';
      for (let i = 0; i < 20 && !Y.built; i++) await new Promise(r => setTimeout(r, 500));
      if (!Y.built || !Y.built.court || !Y.built.cart || !Y.built.gazebo) throw new Error('ลานหน้าบ้านสร้างไม่ครบ ' + JSON.stringify(Y.built));
      for (const l of ['รถเข็นกาแฟหน้าบ้าน', 'ศาลาพักผ่อน']) if (!World.pois.some(p => p.label === l)) throw new Error('ไม่มีจุดโต้ตอบ ' + l);
      const sh = SHOPS.cafecart; if (!sh || sh.tabs.reduce((a, t) => a + t.items.length, 0) < 5) throw new Error('รถเข็นกาแฟไม่มีสินค้า');
      Y.clean(); const bad = []; for (const id in SHOPS) for (const t of SHOPS[id].tabs || []) if (/ฟาร์ม|ปศุสัตว์|เกษตร/.test(t.n)) bad.push(id + ':' + t.n); if (bad.length) throw new Error('ยังมีแท็บฟาร์ม ' + bad.slice(0, 4).join(', '));
      if (World.pois.some(p => /ศูนย์แข่งขัน|ลีกแข่งม้า/.test(p.label || ''))) throw new Error('ศูนย์แข่งขันยังอยู่');
      if (typeof RaceFX !== 'undefined' || typeof CONTESTS !== 'undefined') throw new Error('โค้ดแข่งขันยังอยู่');
      // the new pieces must not sit inside each other or inside an old solid
      const ys = []; for (const arr of Col.map.values()) for (const s of arr) if (s.tag === 'yard' && !ys.includes(s)) ys.push(s);
      for (const a of ys) for (const b of ys) if (a !== b && a.type === 'c' && b.type === 'c' && Math.hypot(a.x - b.x, a.z - b.z) < Math.min(a.r, b.r) * 0.6) throw new Error('ชิ้นส่วนลานทับกัน');
      return 'ผ่าน · ชิ้นส่วนลาน ' + ys.length + ' ชิ้น';
    }],
    ['เศษฟาร์มที่เหลือในมือถือ/เควสต์/ความสำเร็จ: ไม่มีให้เห็นแล้ว', async () => {
      if (typeof SIDE === 'undefined' || typeof ACH === 'undefined') return 'ไม่มีระบบ (ข้าม)';
      const bad = []; const FARMQ = /ปลูก|รดน้ำ|เก็บเกี่ยว|ตกปลา|สัตว์|ผลผลิต|ตลาดริมทะเล/;
      SIDE.forEach((c, i) => c.forEach(q => { if (FARMQ.test(q[1])) bad.push('quest ' + i + ':' + q[1]); }));
      for (const id of ['race', 'win3', 'travel', 'hands']) if (ACH.some(a => a[0] === id)) bad.push('ach ' + id);
      if (typeof TIPS !== 'undefined') for (const t of TIPS) if (/ผัก|ฟาร์ม|บัวรดน้ำ|สัตว์ที่มี|แผงขาย/.test(t)) bad.push('tip ' + t.slice(0, 30));
      if (typeof APPS !== 'undefined') for (const a of APPS) if (/ฟาร์ม|เกษตร|ปลูก|สวนผัก/.test(a.n)) bad.push('app ' + a.n);
      const sh = JSON.stringify(SHOPS.evcenter || {}); if (/fut:(farmbot|vfarm|powertools)/.test(sh)) bad.push('evcenter farm tech');
      if (World.pois.some(p => /ไร่ริมถนน/.test(p.label || ''))) bad.push('ที่ดินทำไร่ยังอยู่');
      if (typeof BIG_FIELDS !== 'undefined' && BIG_FIELDS.length) bad.push('BIG_FIELDS');
      for (const n of Object.keys(SINGLE_FAV || {}).concat(['ลุงมี', 'น้องเมฆ', 'ป้าแดง'])) { const f = favOf(n), it = ITEMS[f]; if (!it || ['crop', 'product', 'fish', 'artisan', 'seed'].includes(it.cat)) bad.push('fav ' + n + '=' + f); }
      if (typeof Contests !== 'undefined' && Contests.race) bad.push('race');
      if (bad.length) throw new Error(bad.slice(0, 5).join(' | '));
      return 'ผ่าน';
    }],
    ['ระบบพนักงาน: ทดลองงาน → ผ่านโปร · ขึ้นเงินเดือน · โบนัสจากกำไร · งานเลี้ยงที่ประธานนัด · สัญญาลูกค้าเสนอราคา x2', async () => {
      const X = window.HR247; if (!X || !window.Contracts207) return 'ไม่มีระบบ (ข้าม)';
      const L = Company.st().list, r0 = Math.random;
      const f = { id: 99980, name: 'ทดสอบพนักงาน', type: 'it', st: 'open', cash: 5e6, loan: 0, mine: 1, paid: 5e6, cap: 5e6, ytd: 0, rep: 60, h: [], reg: [], staff: [{ r: 'dev', sal: 30000, name: 'เก่า' }, { r: 'admin', sal: 15000, name: 'เก่า 2' }], br: [], pend: [], hist: [], books: { rev: 0, cost: 0 }, board: [], exec: [], lic: {}, eq: {}, of: [], shares: 10000, par: 100, licApp: {}, licExp: {}, renew: {}, mon: [], led: [] };
      L.push(f);
      try {
        X.daily(); if (f.staff.some(s => s.prob)) throw new Error('พนักงานเดิมต้องนับว่าผ่านโปรแล้ว');
        f.staff.push({ r: 'dev', sal: 40000, name: 'ใหม่' }); X.daily(); const nw = f.staff[2];
        if (!nw.prob || nw.sal !== 34000 || nw.sal0 !== 40000) throw new Error('พนักงานใหม่ต้องทดลองงาน 85% ได้ ' + JSON.stringify(nw));
        const d0 = S.day; S.day = nw.prob; try { X.daily(); } finally { S.day = d0; }
        if (nw.prob || nw.sal !== 40000) throw new Error('ผ่านโปรแล้วต้องได้เงินเดือนเต็ม ได้ ' + nw.sal);
        // raise + bonus at the year end
        const h = X.H(f); h.raise = 5; h.bonus = 10; h.yp = 1000000; const pay0 = X.payroll(f), c0 = f.cash; f.staff.forEach(s => { s.hd = S.day - 300; });
        X.yearEnd(f, h); const pool = c0 - f.cash; if (!(pool > 0) || pool > 3 * pay0) throw new Error('โบนัสผิดปกติ ' + pool); if (!(X.payroll(f) > pay0)) throw new Error('ไม่ได้ขึ้นเงินเดือน');
        if (h.yp > 0 && h.yp !== 0) throw new Error('กำไรปีต้องเริ่มนับใหม่');
        // party on the day
        f.staff.forEach(s => { s.mo = 50; }); const cost = X.evCost(f, 'newyear', 1), c1 = f.cash, rep1 = f.rep;
        const e = { id: 1, day: S.day, k: 'newyear', lv: 1 }; X.runEvent(f, e);
        if (f.cash !== c1 - cost || f.rep <= rep1 || X.avgMo(f) < 58) throw new Error('งานเลี้ยงไม่ให้ผล ' + (c1 - f.cash) + '/' + cost);
        f.cash = 100; f.staff.forEach(s => { s.mo = 60; }); X.runEvent(f, { id: 2, day: S.day, k: 'trip', lv: 2 }); if (f.cash !== 100 || X.avgMo(f) >= 60) throw new Error('เงินไม่พอต้องงดงานและขวัญตก');
        // monthly effect
        f.cash = 1e6; f.staff.forEach(s => { s.mo = 95; }); h.boost = null; h.mRev = 1000000; const c2 = f.cash; X.monthly(f, h); if (!(f.cash > c2)) throw new Error('ขวัญดีต้องได้รายได้เพิ่ม');
        // scheduling through the page handler
        Company.open(); Company.sel = f.id; Company.tab229 = 'staff'; const html = Company.html(0); if (!/กิจกรรมพนักงานและค่าตอบแทน/.test(html)) throw new Error('หน้าบริษัทไม่มีส่วนกิจกรรมพนักงาน');
        // customer offers are twice as high and marked
        let n = 0; const rs = []; for (let k = 0; k < 20; k++) { Contracts207.st(f).offers = { day: -99, list: [] }; for (const o of Contracts207.offers(f)) { n++; if (!o.x2) throw new Error('ข้อเสนอลูกค้าไม่ใช่ราคา x2'); rs.push(o.kind === 'ret' || o.fee ? o.fee : o.price); } }
        if (!n) throw new Error('ไม่มีข้อเสนอสัญญา');
        return 'ผ่าน · โบนัส ' + pool + ' · ข้อเสนอ ' + n + ' รายการ ราคากลาง ' + rs.sort((a, b) => a - b)[rs.length >> 1];
      } finally { Math.random = r0; const j = L.indexOf(f); if (j >= 0) L.splice(j, 1); } }],
    ['ซื้อ-ขายกิจการ · แฟรนไชส์ข้ามเมือง · สวัสดิการ/อบรม/เลื่อนตำแหน่ง · แดชบอร์ด · รายงานประจำปี', async () => {
      const M = window.MNA248, FR = window.Fran249, P = window.People250, H = window.Hr250, X = window.Exec251;
      if (!M || !FR || !P || !H || !X) return 'ไม่มีระบบ (ข้าม)';
      const L = Company.st().list, r0 = Math.random, ty = Object.keys(CO_TYPES)[0];
      const mk = id => ({ id, name: 'ทดสอบ' + id, type: ty, st: 'open', cash: 8e6, loan: 0, mine: 1, paid: 8e6, cap: 8e6, ytd: 0, rep: 70, regDay: -500, h: [], reg: [{ n: 'ผู้ถือหุ้น', p: 0.2, mood: 60 }], staff: [{ r: 'dev', sal: 30000, name: 'เอ', hd: -400, mo: 70, prob: 0 }, { r: 'dev', sal: 30000, name: 'บี', hd: -400, mo: 70, prob: 0 }], br: [], pend: [], hist: [], books: { rev: 0, cost: 0 }, board: [], exec: [], lic: {}, eq: {}, of: [], shares: 10000, par: 100, licApp: {}, licExp: {}, renew: {}, mon: [], led: [] });
      const f = mk(99991); L.push(f);
      try {
        // M&A
        const ts = M.refresh(); if (ts.length < 3) throw new Error('ตลาดกิจการต้องมีรายการ');
        const t = ts[0]; t.reserve = 100000; const c0 = f.cash; UI.H.mna248({ v: 'dd|' + t.id }); Company.sel = f.id; UI.H.mna248({ v: 'dd|' + t.id }); if (!t.dd || f.cash !== c0 - 30000) throw new Error('ตรวจสอบกิจการไม่ตัดเงิน');
        t.ask = 500000; t.reserve = 400000; t.debt = 100000; const c1 = f.cash; UI.H.mna248({ v: 'offer|' + t.id + '|1' });
        if (M.subsOf(f).length !== 1 || f.cash > c1 - 500000 || f.loan !== 100000) throw new Error('ซื้อกิจการไม่สำเร็จ ' + (c1 - f.cash));
        const s = M.subsOf(f)[0]; s.law = 0; s.key = 0; const pr = M.profitOf(s, f); if (!(pr !== 0)) throw new Error('กำไรบริษัทในเครือต้องไม่เป็นศูนย์'); const c2 = f.cash; M.monthly(f); if (f.cash === c2) throw new Error('ไม่มีกำไรไหลเข้าบริษัทแม่');
        const c3 = f.cash; UI.H.mna248({ v: 'sell|0' }); if (M.subsOf(f).length !== 0 || f.cash === c3) throw new Error('ขายกิจการไม่ได้');
        // franchise
        f.rep = 70; UI.H.fr249({ v: 'open|metro' }); UI.H.fr249({ v: 'open|village' }); if (FR.F(f).net.length !== 2) throw new Error('ขายแฟรนไชส์ไม่ได้'); const fx = FR.F(f).net[0], n0 = FR.netOf(f, fx);
        UI.H.fr249({ v: 'dc|metro' }); if (!FR.F(f).dc.metro) throw new Error('สร้างศูนย์กระจายสินค้าไม่ได้'); if (!(FR.netOf(f, fx) > n0)) throw new Error('ศูนย์กระจายสินค้าต้องลดค่าขนส่ง'); const c4 = f.cash; FR.monthly(f); if (f.cash === c4) throw new Error('แฟรนไชส์ไม่มีรายได้รายเดือน');
        // benefits, training, promotion
        UI.H.p250({ v: 'ben|pf|1' }); UI.H.p250({ v: 'ben|health|1' }); UI.H.p250({ v: 'ben|meal|1' }); UI.H.p250({ v: 'ben|leave|15' }); if (H.target(f) !== 70 + 4 + 4 + 3 + 5) throw new Error('คะแนนสวัสดิการผิด ' + H.target(f)); if (H.quitMul(f) !== 0.25) throw new Error('สวัสดิการสูงต้องลดการลาออก');
        const c5 = f.cash; const cal = window.Cal36; const d0 = S.day; S.day = cal.dayOf(2027, 2, 1); try { P.daily(); } finally { S.day = d0; } if (f.cash >= c5) throw new Error('ไม่ได้หักค่าสวัสดิการรายเดือน');
        const a = f.staff[0]; if (P.canPromote(f, a) === 'ok') throw new Error('ทักษะ 1 ยังเลื่อนไม่ได้'); UI.H.p250({ v: 'train|0|skill' }); if (!a.tr) throw new Error('ส่งอบรมไม่ได้'); S.day = a.tr.end; try { P.daily(); } finally { S.day = d0; }
        if (a.tr || a.sk !== 2) throw new Error('จบอบรมแล้วทักษะต้องเพิ่ม ' + JSON.stringify([a.tr, a.sk])); if (P.canPromote(f, a) !== 'ok') throw new Error('ทักษะ 2 + ครบ 180 วันต้องเลื่อนได้ ได้ ' + P.canPromote(f, a));
        const sal0 = a.sal; UI.H.p250({ v: 'promote|0' }); if (a.tl !== 1 || !(a.sal > sal0)) throw new Error('เลื่อนตำแหน่งไม่ได้');
        // dashboard + yearly report
        const ex = X.EX(f); ex.yR = 2000000; ex.yC = 1200000; ex.mR = 100000; const rep1 = f.rep; X.closeYear(f); const rp = ex.rpt[0]; if (!rp || rp.profit !== 800000 || !/[ABCD]/.test(rp.grade)) throw new Error('รายงานประจำปีผิด ' + JSON.stringify(rp)); if (ex.yR !== 0) throw new Error('ปีใหม่ต้องเริ่มนับใหม่');
        Company.open(); Company.sel = f.id; for (const tab of ['ov', 'fin', 'staff', 'br', 'mna']) { Company.tab229 = tab; const html = Company.html(0); const want = { ov: /แดชบอร์ดผู้บริหาร/, fin: /รายงานประจำปีถึงผู้ถือหุ้น/, staff: /สวัสดิการและการพัฒนาพนักงาน/, br: /แฟรนไชส์และโลจิสติกส์/, mna: /ซื้อ-ขายกิจการ/ }[tab]; if (!want.test(html)) throw new Error('หน้าบริษัทแท็บ ' + tab + ' ไม่มีส่วนใหม่'); }
        return 'ผ่าน · กำไรปี ' + rp.profit + ' เกรด ' + rp.grade;
      } finally { Math.random = r0; const j = L.indexOf(f); if (j >= 0) L.splice(j, 1); } }],
    ['งานประจำ: ทุกอาชีพมีที่ทำงานจริง · ทดลองงาน · ประเมิน/โบนัสประจำปี · กองทุน · ลาออกแจ้งล่วงหน้า · ว่างงานหลังลาออก · อบรม', async () => {
      const J = window.Jobs252; if (!J || typeof Career === 'undefined') return 'ไม่มีระบบ (ข้าม)';
      // 1) every job has a door in the village (the kiosks are made when the world is built)
      const miss = Object.keys(JOBS2).filter(k => !World.pois.some(q => q.label && JOBS2[k].at.test(q.label) && q.x < 2500)); if (miss.length) throw new Error('อาชีพที่ยังไม่มีที่ทำงาน: ' + miss.join(','));
      for (let w = 0; w < 24 && Object.keys(JOBS2).some(k => !World.pois.some(q => q.job === k)); w++) await new Promise(r => setTimeout(r, 500)); const kiosk = Object.keys(JOBS2).filter(k => !World.pois.some(q => q.job === k)); if (kiosk.length > 0) throw new Error('ตู้ลงเวลาไม่ครบ: ' + kiosk.join(','));
      { const K = World.pois.filter(q => q.job && q.grp), bad = []; for (const k of K) { for (const q of K) if (q !== k && k.job < q.job && Math.hypot(q.x - k.x, q.z - k.z) < 1.4) bad.push(k.job + '~' + q.job); for (const p of World.pois) if (!p.job && p.label && p.x < 2500 && Math.hypot(p.x - k.x, p.z - k.z) < 1.2) bad.push(k.job + '~' + p.label); } if (bad.length) throw new Error('ตู้ลงเวลาทับกับสิ่งอื่น: ' + bad.slice(0, 4).join(', ')); }
      const j = Career.st(), snap = JSON.stringify(j), m0 = S.money, d0 = S.day, un0 = window.Realism183 ? JSON.stringify(Realism183.X().un || null) : null, r0 = Math.random;
      try {
        Object.assign(j, { k: 'cashier', rank: 0, pts: 0, weeks: 0, warn: 0, late: 0, absent: 0, done: {}, onLeave: {}, slips: [], empDays: 0, start: S.day }); delete j.x252;
        Career.html(0); const x = j.x252; if (!x || !x.prob) throw new Error('งานใหม่ต้องเริ่มทดลองงาน');
        const base = JOBS2.cashier.ranks[0][1]; const sal = Career.salary(); if (Math.abs(sal - base * 0.85) > 100) throw new Error('ทดลองงานต้องได้ 85% ได้ ' + sal + ' จาก ' + base);
        const pr = j.rank; j.pts = 999; Career.promote(); if (j.rank !== pr) throw new Error('ระหว่างโปรเลื่อนตำแหน่งไม่ได้');
        S.day = x.prob; try { J.daily(); } finally { S.day = d0; } if (x.prob || Math.abs(Career.salary() - base) > 100) throw new Error('ผ่านโปรแล้วต้องได้เงินเต็ม ได้ ' + Career.salary());
        // yearly review
        x.hire = S.day - 400; x.y = { ok: 200, late: 0, abs: 0 }; j.warn = 0; const m1 = S.money; J.review(j, x); if (!(S.money > m1) || !(x.rz > 0)) throw new Error('ประเมินประจำปีไม่มีโบนัส/ปรับเงินเดือน');
        if (!(Career.salary() > base)) throw new Error('เงินเดือนต้องสูงขึ้นหลังปรับ');
        // provident fund at the pay day
        UI.H.j252({ v: 'pf|5' }); if (x.pf.rate !== 5) throw new Error('ตั้งกองทุนไม่ได้'); const dp = MonthCal.nextPayDay ? MonthCal.nextPayDay(S.day) : null; j.slips = []; j.lastPay = S.day - 30; j.start = S.day - 400; j.empDays = 400;
        let paid = false; for (let k = 0; k < 40 && !paid; k++) { S.day = d0 + k; try { if (MonthCal.isPayDay(S.day)) { Career.payday(); paid = true; } } finally { } } S.day = d0;
        if (!paid || !(x.pf.e > 0) || !(x.pf.r > 0)) throw new Error('กองทุนไม่มีเงินสมทบ ' + JSON.stringify(x.pf));
        // training
        S.money = Math.max(S.money, 100000); UI.H.j252({ v: 'train|eng' }); const s2 = J.S2(); if (!s2.tr) throw new Error('ลงเรียนไม่ได้'); const p0 = j.pts; S.day = s2.tr.end; try { J.daily(); } finally { S.day = d0; } if (s2.tr || !(j.pts > p0) || s2.eng < 0.02) throw new Error('จบหลักสูตรแล้วต้องได้ผล');
        // resign: notice first, then the end gives the fund and the unemployment benefit
        Career.resign(); if (!j.x252.notice) throw new Error('ลาออกต้องแจ้งล่วงหน้า'); UI.H.j252({ v: 'cancel' }); if (j.x252.notice) throw new Error('ถอนใบลาออกไม่ได้');
        Career.resign(); j.x252.notice = S.day; const m2 = S.money; Career.resign('final'); if (j.k) throw new Error('ครบกำหนดแจ้งแล้วต้องออกจากงาน'); if (!(S.money > m2)) throw new Error('ลาออกแล้วต้องได้เงินกองทุน');
        if (window.Realism183 && !Realism183.X().un) throw new Error('ลาออกถูกต้องแล้วต้องมีสิทธิ์เงินว่างงาน');
        // immediate exit costs money and gives no benefit
        Object.assign(j, { k: 'cashier', rank: 0, empDays: 400, start: S.day - 400 }); delete j.x252; if (window.Realism183) Realism183.X().un = null; Career.html(0); const x2 = j.x252; x2.prob = 0; x2.hire = S.day - 400; const m3 = S.money; Career.resign('now'); if (j.k || !(S.money < m3)) throw new Error('ลาออกทันทีต้องเสียค่าปรับ'); if (window.Realism183 && Realism183.X().un) throw new Error('ลาออกทันทีต้องไม่ได้เงินว่างงาน');
        return 'ผ่าน · อาชีพที่มีที่ทำงานครบ ' + Object.keys(JOBS2).length + ' · โบนัสประจำปีและกองทุนทำงาน';
      } finally { Math.random = r0; S.day = d0; for (const k of Object.keys(j)) delete j[k]; Object.assign(j, JSON.parse(snap)); S.money = m0; try { if (window.Realism183) Realism183.X().un = un0 ? JSON.parse(un0) : null; } catch (e) { } try { delete S.job2; } catch (e) { } } }],
    ['มือถือ: ตำแหน่งเลื่อนไม่เด้งกลับขึ้นบน (ซ้าย/ขวา/แนวตั้ง) · ไม่มีสุขภาพในมือถือ', async () => {
      if (!window.PhoneFix253 || !window.PhoneLand240) return 'ไม่มีระบบ (ข้าม)';
      const L = PhoneLand240, sleep = ms => new Promise(r => setTimeout(r, ms)), f0 = L.force; S.lvl = Math.max(S.lvl || 1, 20);
      try {
        // no health: apps, category, message folder
        if (APPS.some(a => a.id === 'health31' || a.id === 'civhos')) throw new Error('ยังมีแอปสุขภาพในมือถือ'); if (Phone59.CATS.some(c => c[0] === 'health')) throw new Error('ยังมีหมวดสุขภาพ');
        const n0 = (S.msgs || []).length; Phone.msg('โรงพยาบาลทุ่งทอง', 'ทดสอบข้อความสุขภาพ'); if ((S.msgs || []).length !== n0) throw new Error('ข้อความจากโรงพยาบาลต้องไม่เข้ามือถือ');
        // two panes
        UI.close(); L.force = 1; Phone.cat = null; Phone.app = null; Phone.open(null); await sleep(250);
        const sc = () => document.querySelector('.phl-scroll');
        if (sc() && sc().scrollHeight > sc().clientHeight + 40) {
          sc().scrollTop = sc().scrollHeight; await sleep(50); const y0 = sc().scrollTop;
          const tile = [...document.querySelectorAll('.phl-side [data-a="pcat"]')].reverse().find(b => b.dataset.v && b.dataset.v !== 'other'); tile.click(); await sleep(120);
          if (Math.abs(sc().scrollTop - y0) > 4) throw new Error('กดหมวดแล้วฝั่งซ้ายเลื่อนเอง ' + y0 + ' → ' + sc().scrollTop);
          const x = document.querySelector('.phl-head [data-a="pcat"]'); if (!x) throw new Error('ไม่มีปุ่มปิดหมวด'); x.click(); await sleep(120);
          if (Math.abs(sc().scrollTop - y0) > 4) throw new Error('ปิดหมวดแล้วฝั่งซ้ายเด้งขึ้นบน ' + y0 + ' → ' + sc().scrollTop);
        }
        // one column
        UI.close(); L.force = 0; Phone.cat = null; Phone.app = null; Phone.open(null); await sleep(250);
        const mb = document.getElementById('mBody'); if (mb.scrollHeight > mb.clientHeight + 60) { mb.scrollTop = 90; await sleep(40); const y1 = mb.scrollTop; UI.H.app({ v: 'msgs' }); UI.renderBody(); await sleep(60); UI.H.app({ v: '' }); UI.renderBody(); await sleep(60); if (Math.abs(mb.scrollTop - y1) > 4) throw new Error('กลับจากแอปแล้วหน้าหลักเด้งขึ้นบน ' + y1 + ' → ' + mb.scrollTop); }
        return 'ผ่าน';
      } finally { L.force = f0; try { UI.close(); } catch (e) { } Phone.cat = null; Phone.app = null; } }],
    ['ไม่มีระบบสุขภาพ: ไม่ป่วย ไม่มีคลินิก/โรงพยาบาล ไม่มียา ไม่มีงานพยาบาล/เภสัช ไม่มีประกันสุขภาพ · หิว/กระหายยังอยู่', async () => {
      const N = window.NoHealth254; if (!N) return 'ไม่มีระบบ (ข้าม)'; N.all(); await new Promise(r => setTimeout(r, 200)); N.all();
      const bad = [];
      S.sick = 2; S.sickDays = 5; if (S.sick !== 0) bad.push('S.sick ต้องเป็น 0 เสมอ'); try { Life2.getSick('ทดสอบ'); } catch (e) { } if (S.sick !== 0) bad.push('getSick ยังทำให้ป่วย');
      if (World.pois.some(p => /โรงพยาบาล|^คลินิก$|ศูนย์ความปลอดภัยและสาธารณสุข|ร้านขายยา/.test(p.label || ''))) bad.push('ยังมีจุดโรงพยาบาล/คลินิก');
      if (JOBS2.nurse || JOBS2.pharmacist) bad.push('ยังมีงานพยาบาล/เภสัชกร'); if (World.pois.some(p => p.job === 'nurse' || p.job === 'pharmacist')) bad.push('ยังมีตู้ลงเวลาพยาบาล/เภสัช');
      if (APPS.some(a => /^(health31|civhos)$/.test(a.id))) bad.push('ยังมีแอปสุขภาพ');
      if (typeof INS !== 'undefined' && INS.health) bad.push('ยังมีประกันสุขภาพ'); if (Gov24.offices.some(o => /^health|^hospreg/.test(o.id))) bad.push('ยังมีสำนักงานสาธารณสุข'); if (Agency26.agencies.some(a => a.id === 'rc' || a.id === 'clinic')) bad.push('ยังมีศูนย์โลหิต/คลินิกเอกชน');
      let meds = 0; for (const sid in SHOPS) for (const t of SHOPS[sid].tabs || []) { if (/💊|ยาs*&|ยาและ/.test(t.n)) bad.push('แท็บยา ' + sid); for (const k of t.items || []) if (N.isMed(k)) meds++; } if (meds) bad.push('ยังมียา ' + meds + ' รายการ');
      if (typeof Life2.tick !== 'function') bad.push('ระบบกินดื่มหาย'); else { const h0 = S.hunger, t0 = S.thirst, sl0 = G.sleeping; G.sleeping = false; Life2.tick(1); G.sleeping = sl0; if (!(S.hunger < h0 && S.thirst < t0)) bad.push('หิว/กระหายไม่ลดตามเวลา'); S.hunger = h0; S.thirst = t0; }
      if (!Number.isFinite(S.hunger) || !Number.isFinite(S.thirst)) bad.push('ค่าหิว/กระหายหาย');
      if (bad.length) throw new Error(bad.slice(0, 5).join(' | '));
      return 'ผ่าน';
    }],
    ['ใบรับรองแพทย์: ตรวจที่โรงเรียนสอนขับรถ 200 ฿ · ใช้สอบใบขับขี่ได้', async () => {
      if (!window.Med255 || typeof Agency26 === 'undefined') return 'ไม่มีระบบ (ข้าม)';
      const m0 = S.money; const x0 = Gov24.st(); const saved = x0.docs.medcert; delete x0.docs.medcert;
      S.money = Math.max(S.money, 1000); const before = S.money; UI.H.dsmed(); const spent = before - S.money;
      if (!Med255.has()) throw new Error('ตรวจแล้วต้องได้ใบรับรองแพทย์');
      if (spent !== Med255.FEE) throw new Error('ค่าตรวจไม่ถูกต้อง: ' + spent);
      S.money = m0; if (saved) x0.docs.medcert = saved; return 'ผ่าน · ค่าตรวจ ' + Med255.FEE + ' ฿';
    }],
    ['ชวนคนภายนอกร่วมลงทุน: เลือกสัดส่วน 5/10/15/20% เองได้ · ไม่มีชาวบ้าน/เพื่อน · ตอบ 3 วัน · รับเป็นผู้ถือหุ้นจริง · ป๊อปอัปวาระคงที่', async () => {
      if (!window.Invite257 || !window.AgPop256) return 'ไม่มีระบบ (ข้าม)';
      const L = Company.st().list, r0 = Math.random, ty = Object.keys(CO_TYPES)[0], I = Invite257;
      const f = { id: 99993, name: 'ทดสอบชวนลงทุน', type: ty, st: 'open', cash: 5e6, loan: 0, mine: 0.9, paid: 8e6, cap: 8e6, ytd: 3000000, rep: 70, regDay: -400, h: [], reg: [], staff: [], br: [], pend: [], hist: [], books: { rev: 0, cost: 0 }, board: [], exec: [], lic: {}, eq: {}, of: [], shares: 10000, par: 100, licApp: {}, licExp: {}, renew: {}, mon: [], led: [] };
      L.push(f);
      try {
        if (I.STAKES.join() !== '0.05,0.1,0.15,0.2') throw new Error('ตัวเลือกสัดส่วนต้องเป็น 5/10/15/20% ได้ ' + I.STAKES.join());
        // nobody from the village or the friends list, over many refreshes
        const bad = I.villagers(); const names = new Set(); let withAll4 = 0;
        for (let k = 0; k < 40; k++) { f.inv257 = null; I.refresh(f); const x = I.INV(f); if (!x.list.length) throw new Error('ต้องมีรายชื่อคนภายนอก'); for (const p of x.list) { names.add(p.who); if (bad.has(p.who)) throw new Error('มีคนในหมู่บ้านในรายชื่อ: ' + p.who); if (!['inv', 'ofc'].includes(p.kind)) throw new Error('ชนิดผู้ถือหุ้นผิด ' + p.kind); if (I.afford(f, p).length === 4) withAll4++; } }
        if (!withAll4) throw new Error('ควรมีคนที่รับได้ทั้ง 4 สัดส่วนอย่างน้อยบางคน');
        // invite with a chosen stake
        f.inv257 = null; I.refresh(f); const x = I.INV(f); Company.sel = f.id; const p = x.list.find(q => I.afford(f, q).length >= 2) || x.list[0], opts = I.afford(f, p), pct = opts[opts.length - 1], c0 = f.cash;
        UI.H.inv257({ v: 'invite|' + x.list.indexOf(p) + '|' + pct }); if (!p.invited || p.invited.pct !== pct || f.cash !== c0 - I.INVITE_FEE) throw new Error('ชวนแล้วต้องจ่ายค่าติดต่อและจำสัดส่วนที่เลือก');
        UI.H.inv257({ v: 'invite|' + x.list.indexOf(p) + '|' + pct }); if (f.cash !== c0 - I.INVITE_FEE) throw new Error('ชวนคนเดิมซ้ำต้องไม่หักเงินอีก');
        const unaff = I.STAKES.find(s => I.why(f, p, s)); if (unaff != null) { const q = x.list.find(z => z !== p && !z.invited && I.why(f, z, unaff)); if (q) { const c1 = f.cash; UI.H.inv257({ v: 'invite|' + x.list.indexOf(q) + '|' + unaff }); if (f.cash !== c1 || q.invited) throw new Error('สัดส่วนที่เขาซื้อไม่ไหวต้องเสนอไม่ได้'); } }
        const d0 = S.day; S.day = p.invited.due; Math.random = () => 0.01; try { I.daily(); } finally { Math.random = r0; S.day = d0; }
        const o = (f.of || []).find(q => q.who === p.who && q.fromInvite); if (!o || o.pct !== pct || o.mode !== 'new') throw new Error('คำตอบรับต้องเป็นคำเสนอซื้อหุ้นใหม่ตามสัดส่วนที่เลือก');
        // the owner accepts it like any other offer: the person becomes a shareholder
        const m0 = f.mine, cash0 = f.cash; Company.open(); UI.cur.tab = 2; UI.H.v50({ v: 'sel|' + f.id }); UI.H.v50({ v: 'ok|' + o.id }); const h = (f.h || []).concat(f.reg || []).find(q => q.n === p.who);
        if (!h) throw new Error('รับคำเสนอแล้วต้องเป็นผู้ถือหุ้น'); if (!(f.cash > cash0) || !(f.mine < m0)) throw new Error('ได้เงินเข้าบริษัทและหุ้นของคุณต้องลดลง');
        // popup: fixed overlay, list paints, close works
        Company.open(); Company.sel = f.id; Company.tab229 = 'hold'; UI.renderBody();
        UI.H.agpop({ v: String(f.id), k: 'sh' }); const box = document.getElementById('agpop256'); if (!box) throw new Error('ป๊อปอัปวาระไม่ขึ้น');
        if (getComputedStyle(box).position !== 'fixed') throw new Error('ป๊อปอัปต้องอยู่กับที่');
        AgPop256.close(); Company.tab229 = 'board'; UI.renderBody(); UI.H.agpop({ v: String(f.id), k: 'bd' });
        { const bx = document.getElementById('agpop256'), ls = bx && bx.querySelector('.agl'); if (!ls) throw new Error('ป๊อปอัปวาระประชุมไม่ขึ้น');
          const items = () => [...ls.querySelectorAll('button[data-a="ag217tog"]')]; if (items().length < 10) throw new Error('รายการวาระน้อยผิดปกติ');
          ls.scrollTop = 400; const y0 = ls.scrollTop, b = items()[8]; b.click();
          if (!bx.isConnected || !AgPop256.open()) throw new Error('กดเลือกแล้วป๊อปอัปปิดเอง');
          if (Math.abs(ls.scrollTop - y0) > 2) throw new Error('กดเลือกแล้วรายการเลื่อนเอง ' + y0 + '→' + ls.scrollTop);
          if (!items()[8].classList.contains('on')) throw new Error('ติ๊กแล้วต้องแสดงว่าเลือก');
          items()[8].click(); if (items()[8].classList.contains('on')) throw new Error('กดซ้ำต้องยกเลิก'); }
        AgPop256.close(); if (AgPop256.open()) throw new Error('ปิดป๊อปอัปไม่ได้');
        return 'ผ่าน · ชวน ' + Math.round(pct * 100) + '% แล้ว ' + p.who + ' เป็นผู้ถือหุ้น · ชื่อไม่ซ้ำ ' + names.size + ' คนจาก 40 รอบ ไม่มีคนในหมู่บ้าน';
      } finally { Math.random = r0; const j = L.indexOf(f); if (j >= 0) L.splice(j, 1); } }],
    ['กำหนดตำแหน่งเอง: ประธาน · กรรมการตรวจสอบ · สายการโหวต · ย้าย/สลับ/แต่งตั้งผู้บริหาร', async () => {
      const R = window.Roles258, A = window.Agm216; if (!R || !A) return 'ไม่มีระบบ (ข้าม)';
      const L = Company.st().list, ty = Object.keys(CO_TYPES)[0];
      const mkd = (n, trait) => ({ n, role: 'dir', mood: 60, trait, since: S.day - 10 });
      const f = { id: 99996, name: 'ทดสอบตำแหน่ง', type: ty, st: 'open', cash: 9e6, loan: 0, mine: 0.6, paid: 9e6, cap: 9e6, ytd: 0, rep: 70, regDay: -400, h: [], reg: [], staff: [], br: [], pend: [], hist: [], books: { rev: 0, cost: 0 }, board: [mkd('กรรมการ ก', 'indep'), mkd('กรรมการ ข', 'cons'), mkd('กรรมการ ค', 'growth')], exec: [{ k: 'ceo', n: 'ซีอีโอ ทดสอบ', sal: 90000, since: S.day - 100, mood: 60, trait: 'cons' }, { k: 'cfo', n: 'ซีเอฟโอ ทดสอบ', sal: 70000, since: S.day - 100, mood: 60, trait: 'cons' }], lic: {}, eq: {}, of: [], shares: 10000, par: 100, licApp: {}, licExp: {}, renew: {}, mon: [], led: [] };
      L.push(f);
      try {
        Company.open(); Company.sel = f.id; Company.tab229 = 'board'; const html = Company.html(0); if (!/กำหนดตำแหน่งเอง/.test(html)) throw new Error('ไม่มีส่วนกำหนดตำแหน่งเอง');
        const call = (k, x, y) => UI.H.rl258({ v: String(f.id), k, x, y });
        call('chair', 'กรรมการ ข'); if (f.chair !== 'กรรมการ ข') throw new Error('เลือกประธานไม่ได้'); call('chair', 'me'); if (f.chair) throw new Error('คืนตำแหน่งประธานให้ผู้เล่นไม่ได้');
        call('audon', 'กรรมการ ข'); if ((f.auditc || []).includes('กรรมการ ข')) throw new Error('สายระมัดระวังต้องเป็นกรรมการตรวจสอบไม่ได้');
        call('audon', 'กรรมการ ก'); if (!(f.auditc || []).includes('กรรมการ ก')) throw new Error('แต่งตั้งกรรมการตรวจสอบสายอิสระไม่ได้'); call('audoff', 'กรรมการ ก'); if ((f.auditc || []).includes('กรรมการ ก')) throw new Error('ถอดกรรมการตรวจสอบไม่ได้');
        call('trait', 'กรรมการ ข', 'indep'); if (f.board[1].trait !== 'indep') throw new Error('เปลี่ยนสายไม่ได้'); call('trait', 'กรรมการ ข', 'growth'); if (f.board[1].trait !== 'indep') throw new Error('เปลี่ยนสายซ้ำใน 60 วันต้องไม่ได้');
        call('audon', 'กรรมการ ข'); if (!(f.auditc || []).includes('กรรมการ ข')) throw new Error('หลังเป็นสายอิสระต้องเป็นกรรมการตรวจสอบได้');
        // executives: move to a free position, then swap
        const sel = document.createElement('select'); sel.id = 'rl258mv_' + f.id + '_cfo'; sel.innerHTML = '<option value="free:cmo">x</option>'; document.body.appendChild(sel);
        try { call('move', 'cfo'); } finally { sel.remove(); } const cfo = f.exec.find(e => e.n === 'ซีเอฟโอ ทดสอบ'); if (!cfo || cfo.k !== 'cmo' || cfo.sal !== A.execSal(f, 'cmo')) throw new Error('ย้ายผู้บริหารไปตำแหน่งว่างไม่ได้ ' + JSON.stringify(cfo));
        const s2 = document.createElement('select'); s2.id = 'rl258mv_' + f.id + '_ceo'; s2.innerHTML = '<option value="swap:cmo">x</option>'; document.body.appendChild(s2);
        try { call('move', 'ceo'); } finally { s2.remove(); } const ceo = f.exec.find(e => e.n === 'ซีอีโอ ทดสอบ'), cfo2 = f.exec.find(e => e.n === 'ซีเอฟโอ ทดสอบ'); if (ceo.k !== 'cmo' || cfo2.k !== 'ceo') throw new Error('สลับตำแหน่งไม่ได้');
        // appoint a director as an executive
        const a1 = document.createElement('select'); a1.id = 'rl258ap_' + f.id; a1.innerHTML = '<option value="กรรมการ ค">x</option>'; const a2 = document.createElement('select'); a2.id = 'rl258apk_' + f.id; a2.innerHTML = '<option value="cto">x</option>'; document.body.append(a1, a2);
        try { call('appoint', ''); } finally { a1.remove(); a2.remove(); } const ex = f.exec.find(e => e.n === 'กรรมการ ค'); if (!ex || ex.k !== 'cto' || f.board[2].execK !== 'cto') throw new Error('แต่งตั้งกรรมการเป็นผู้บริหารไม่ได้');
        // vice chair: chosen from the directors, decides a tie when the elected chair is away, and takes over when the chair leaves
        call('chair', 'กรรมการ ข'); call('vice', 'กรรมการ ข'); if (R.viceOf(f)) throw new Error('ประธานต้องเป็นรองประธานไม่ได้'); call('vice', 'กรรมการ ก'); if (R.viceOf(f) !== 'กรรมการ ก') throw new Error('ตั้งรองประธานไม่ได้');
        f.board[0].mood = 98; const r0 = Math.random; let t1, t2;
        try { Math.random = () => 0.69; t1 = A.tieEx({ f: { c: f }, att: [{ k: 'dir', n: 'กรรมการ ก' }] }, {}); t2 = A.tieEx({ f: { c: f }, att: [{ k: 'dir', n: 'กรรมการ ก' }, { k: 'dir', n: 'กรรมการ ข' }] }, {}); } finally { Math.random = r0; }
        if (t1 !== true) throw new Error('ประธานไม่อยู่ รองประธานต้องเป็นผู้ชี้ขาด (ได้ ' + t1 + ')'); if (t2 !== false) throw new Error('ประธานอยู่ ต้องใช้กติกาเดิม (ได้ ' + t2 + ')');
        f.board = f.board.filter(d => d.n !== 'กรรมการ ข'); A.syncBoard(f); if (f.chair !== 'กรรมการ ก' || f.vice) throw new Error('ประธานออก รองประธานต้องขึ้นเป็นประธาน (chair=' + f.chair + ')');
        return 'ผ่าน · ผู้บริหาร ' + f.exec.length + ' ตำแหน่ง กรรมการ ' + f.board.length + ' คน';
      } finally { const j = L.indexOf(f); if (j >= 0) L.splice(j, 1); } }],
    ['ราคาข้อเสนอสัญญาลูกค้า: ระดับ x4 มีเพดาน ทุกประเภทธุรกิจ · ข้อเสนอเก่าถูกปรับครั้งเดียว', async () => {
      if (!window.Contracts207) return 'ไม่มีระบบ (ข้าม)';
      const L = Company.st().list, ty = Object.keys(CO_TYPES);
      const mk = (id, type) => ({ id, name: 'ทดสอบราคา' + id, type, st: 'open', cash: 3e6, loan: 0, mine: 1, paid: 3e6, cap: 3e6, ytd: 1, rep: 60, h: [], reg: [], staff: [], br: [], pend: [], hist: [], books: { rev: 0, cost: 0 }, board: [], exec: [], lic: {}, eq: {}, of: [], shares: 10000, par: 100, licApp: {}, licExp: {}, renew: {}, mon: [], led: [] });
      const cs = ty.slice(0, 5).map((t, k) => mk(99940 + k, t)); L.push(...cs);
      try {
        let n = 0; const bad = [];
        for (const c of cs) for (let k = 0; k < 6; k++) { Contracts207.st(c).offers = { day: -99, list: [] }; for (const o of Contracts207.offers(c)) { n++; if (o.xm !== 4) bad.push(c.type + ':' + o.xm); const T = CO_TYPES[c.type], pay = Object.entries((T && T.staff) || {}).reduce((a, [r, q]) => a + q * ((ROLES[r] && ROLES[r].sal) || 15000), 0) || 40000, gov = o.gov ? 1.11 : 1; if (o.fee && o.fee > Math.max(150000, 5 * pay) * gov + 1000) bad.push('เกินเพดานรายเดือน ' + c.type + ':' + o.fee); if (o.price && o.price > Math.max(600000, 25 * pay) * gov + 5000) bad.push('เกินเพดานโครงการ ' + c.type + ':' + o.price); } }
        if (!n) throw new Error('ไม่มีข้อเสนอสัญญา'); if (bad.length) throw new Error('ข้อเสนอที่ไม่ใช่ระดับ x4: ' + bad.slice(0, 3).join(','));
        // an offer saved at the x2 level is doubled once (x4 in all); one at x8 is halved; an old one (no level) is x4
        const c = cs[0], x = Contracts207.st(c); x.offers = { day: S.day, list: [{ id: 1, title: 'เก่า x2', cust: 'ก', kind: 'proj', x2: 1, price: 100000, value: 100000, exp: S.day + 5, reqs: [] }, { id: 2, title: 'เก่ามาก', cust: 'ข', kind: 'proj', price: 50000, value: 50000, exp: S.day + 5, reqs: [] }, { id: 3, title: 'x8', cust: 'ค', kind: 'proj', x2: 1, xm: 8, price: 800000, value: 800000, exp: S.day + 5, reqs: [] }] };
        const L2 = Contracts207.offers(c), a = L2.find(o => o.id === 1), b = L2.find(o => o.id === 2), z = L2.find(o => o.id === 3); if (!a || !b || !z || a.price !== 200000 || b.price !== 200000 || z.price !== 400000) throw new Error('ย้ายราคาข้อเสนอเก่าไม่ถูก ' + JSON.stringify([a && a.price, b && b.price, z && z.price]));
        Contracts207.offers(c); if (a.price !== 200000 || z.price !== 400000) throw new Error('ข้อเสนอเก่าต้องถูกปรับครั้งเดียว');
        return 'ผ่าน · ข้อเสนอ ' + n + ' รายการเป็นระดับ x4 และไม่เกินเพดาน';
      } finally { for (const c of cs) { const j = L.indexOf(c); if (j >= 0) L.splice(j, 1); } } }],
    ['รอบ 7 วัน: เดือนของสัญญาลูกค้า = 30 วัน · สัญญาบริการในเครือจ่ายเดือนละครั้งในวันจ่าย', async () => {
      if (!window.Contracts207 || !window.Biz212 || !Biz212.icDay) return 'ไม่มีระบบ (ข้าม)';
      if (Contracts207.MO !== 30) throw new Error('เดือนของสัญญาลูกค้าควรเป็น 30 วัน ได้ ' + Contracts207.MO);
      const L = Company.st().list, d0 = S.day, ty = Object.keys(CO_TYPES)[0], ic = (Biz212.X().ic = Biz212.X().ic || []);
      const mkc = (id, cash) => ({ id, name: 'ทดสอบ' + id, type: ty, st: 'open', cash, ytd: 0, mine: 1, paid: 0, h: [], staff: [], br: [], exec: [], board: [], pend: [], hist: [], books: { rev: 0, cost: 0 }, lic: {}, eq: {} });
      const p = mkc(99020, 0), b = mkc(99021, 1e6), ag = { id: 98765, from: 99020, to: 99021, amt: 10000, last: d0 - 40, miss: 0 };
      L.push(p, b); ic.push(ag);
      try {
        const t = Cal36.date(d0), pd = MonthCal.payDayNum(t.y, t.m);
        S.day = pd - 2; Biz212.icDay(); if (b.cash !== 1e6) throw new Error('จ่ายก่อนวันจ่ายประจำเดือน');
        S.day = pd; Biz212.icDay(); if (b.cash !== 1e6 - 10000) throw new Error('ถึงวันจ่ายแล้วไม่จ่าย (เงินผู้ซื้อ ' + b.cash + ')');
        Biz212.icDay(); if (b.cash !== 1e6 - 10000) throw new Error('วันเดียวกันจ่ายซ้ำ');
        return 'ผ่าน';
      } finally { S.day = d0; for (const x of [p, b]) { const i = L.indexOf(x); if (i >= 0) L.splice(i, 1); } const i = ic.indexOf(ag); if (i >= 0) ic.splice(i, 1); } }],
    ['ปฏิทินเดือนจริง: ใบอนุญาตบริษัท 1 ปี = 365 วัน (ต่อได้ก่อน 90 วัน) · เงินฝากประจำ 3/6/12 เดือน = 90/180/360 วัน ดอกเบี้ยเท่าสัดส่วนปีเกม และฝากเดิมไม่เปลี่ยน', async () => {
      const Lr = window.LicRules206, F = window.FD167; if (!Lr || !F) return 'ไม่มีระบบ (ข้าม)';
      if (Lr.LIC_LIFE.food !== 365 || Lr.LIC_LIFE.nbtc !== 1825 || Lr.LIC_WIN !== 90) throw new Error('อายุใบอนุญาตบริษัทผิด ' + JSON.stringify(Lr.LIC_LIFE) + ' ต่อก่อน ' + Lr.LIC_WIN);
      if (F.FDT[3].days !== 90 || F.FDT[6].days !== 180 || F.FDT[12].days !== 360) throw new Error('ระยะฝากประจำผิด');
      const nw = F.interest({ amt: 100000, rate: 2.4, term: 12, start: 0, due: 360 }), old = F.interest({ amt: 100000, rate: 2.4, term: 12, start: 0, due: 84 });
      if (nw !== Math.round(100000 * 0.024 * 360 / 84)) throw new Error('ดอกเบี้ยฝากใหม่ผิด ' + nw); if (old !== 2400) throw new Error('เงินฝากเดิม 84 วันควรได้ดอกเบี้ยเท่าเดิม 2400 ได้ ' + old);
      return `ฝากใหม่ 12 เดือน ดอกเบี้ย ${nw} · ฝากเดิม ${old}`; }],
    ['ภาษีปีปฏิทิน: ภาษีบุคคลของเงินเดือน 12 เดือนไม่ถูกคืนเกือบหมด · ภาษีนิติบุคคลปิดงบเดือนธันวาคมครั้งเดียวต่อปี', async () => {
      if (typeof PTax === 'undefined' || typeof Biz31 === 'undefined') return 'ไม่มีระบบภาษี (ข้าม)';
      if (PTax.yr() !== Cal36.date(S.day).y) throw new Error('ปีภาษีควรเป็นปีปฏิทิน');
      const sal = 12 * 30000, wht = 12 * Biz31.whtMonthly(30000), r = PTax.calc({ sal, wht, ss: 12 * 875, rent: 0, div: 0, other: 0, life: 0, rmf: 0 });
      if (r.tax <= 0) throw new Error('เงินเดือน 30,000 ต่อเดือนควรมีภาษี'); if (Math.abs(r.due) > Math.max(1500, r.tax * 0.3)) throw new Error('ภาษีที่หักไว้ ' + wht + ' ต่างจากภาษีจริง ' + r.tax + ' มากเกินไป (ต้องชำระ/คืน ' + r.due + ')');
      const L = Company.st().list, d0 = S.day, t = Cal36.date(d0), ty = Object.keys(CO_TYPES)[0];
      const f = { id: 99030, name: 'ทดสอบภาษี', type: ty, st: 'open', cash: 5e6, ytd: 1000000, rent: 0, mine: 1, paid: 0, h: [], staff: [], br: [], exec: [], board: [], pend: [], hist: [], books: { rev: 0, cost: 0 }, lic: {}, eq: {}, rep: 50 };
      L.push(f); try {
        S.day = MonthCal.payDayNum(t.y, 5); Company.week(); if (f.taxYear != null || f.ytd < 900000) throw new Error('กลางปีไม่ควรปิดงบประจำปี (ytd ' + f.ytd + ')');
        S.day = MonthCal.payDayNum(t.y, 11); const c1 = f.cash; Company.week(); if (f.ytd !== 0 || f.taxYear !== t.y) throw new Error('ปิดงบเดือนธันวาคมควรหักภาษีและล้างกำไรสะสม'); if (c1 - f.cash < 120000) throw new Error('ภาษีนิติบุคคล 105,000 + ค่าสอบบัญชี 15,000 ไม่ถูกหัก (หักไป ' + (c1 - f.cash) + ')');
        f.ytd = 500000; Company.week(); if (f.ytd < 400000) throw new Error('ปีเดียวกันไม่ควรหักภาษีซ้ำ (ytd ' + f.ytd + ')');
        return `ภาษีบุคคล ${r.tax} หักไว้ ${wht} · ภาษีบริษัทหัก ${c1 - f.cash > 120000 ? 'ครบ' : ''}`;
      } finally { S.day = d0; const i = L.indexOf(f); if (i >= 0) L.splice(i, 1); } }],
    ['งานประจำ: เงินเดือนออกตามวันจ่ายรายเดือน (เลื่อนวันเสาร์) · เดือนแรกจ่ายตามวันที่ทำงาน · ออกจากงานได้เงินงวดสุดท้ายและสถานะไม่ติดไปงานใหม่', async () => {
      if (typeof Career === 'undefined' || typeof JOBS2 === 'undefined') return 'ไม่มีระบบงานประจำ (ข้าม)';
      const k = Object.keys(JOBS2)[0], j0 = S.job == null ? null : JSON.stringify(S.job), d0 = S.day, m0 = S.money; let pt = null; try { pt = JSON.stringify(PTax.st().cur); } catch (e) { }
      try {
        let found = null; const Y = Cal36.date(S.day).y;
        outer: for (let y = Y; y < Y + 8; y++) for (let m = 0; m < 12; m++) if (Cal36.dowOf(Cal36.epoch(MonthCal.dayNum(y, m, Cal36.daysIn(y, m)))) === 5) { found = [y, m]; break outer; }
        if (!found) return 'ไม่พบเดือนที่สิ้นเดือนเป็นวันเสาร์ (ข้าม)';
        const [y, m] = found, last = MonthCal.dayNum(y, m, Cal36.daysIn(y, m)), pd = MonthCal.payDayNum(y, m), mid = MonthCal.dayNum(y, m, 15);
        const setJob = o => { S.job = null; const j = Career.st(); Object.assign(j, { k, rank: 0, pts: 0, weeks: 5, warn: 0, late: 0, absent: 0, done: {}, onLeave: {}, slips: [], lastPay: null, start: pd - 200, empDays: 200, examOK: 0 }, o); return j; };
        let j = setJob({ lastPay: pd - 35 }), a;
        S.day = last; a = S.money; Career.payday(); if (S.money !== a) throw new Error('เงินเดือนออกวันเสาร์สิ้นเดือน (ควรเลื่อนเป็นวันพุธ)');
        S.day = pd; a = S.money; Career.payday(); const full = S.money - a; if (full <= 0) throw new Error('ถึงวันจ่ายแล้วไม่ได้เงินเดือน');
        j = setJob({ start: pd - 5 }); S.day = pd; a = S.money; Career.payday(); const part = S.money - a;
        if (!(part > 0 && part < full)) throw new Error('เดือนแรกควรจ่ายตามวันที่ทำงาน (ได้ ' + part + ' เต็มเดือน ' + full + ')');
        j = setJob({ leave: { sick: 0, biz: 0, vac: 0, cy: y - 1, year: 0 } }); S.day = mid; Career.payday(); if (Career.st().leave.sick !== 30) throw new Error('ขึ้นปีใหม่ควรได้โควตาลาป่วย 30 วัน (ได้ ' + Career.st().leave.sick + ')');
        j = setJob({ lastPay: MonthCal.dayNum(y, m, 1) - 5, examOK: 1 }); S.day = mid; a = S.money; Career.resign('final'); const fin = S.money - a;
        if (!(fin > 0 && fin < full)) throw new Error('ลาออกกลางเดือนควรได้เงินงวดสุดท้ายบางส่วน (ได้ ' + fin + ' เต็มเดือน ' + full + ')');
        j = Career.st(); if (j.k || j.examOK !== 0 || j.empDays !== 0) throw new Error('ออกจากงานแล้วสิทธิ์สอบ/วันทำงานเดิมยังค้าง');
        j = setJob({ lastPay: MonthCal.dayNum(y, m, 10) }); S.day = MonthCal.dayNum(y, m, 20); a = S.money; Career.resign('final'); if (S.money !== a) throw new Error('จ่ายเงินเดือนเดือนนี้ไปแล้ว ไม่ควรจ่ายซ้ำตอนลาออก');
        return `เต็มเดือน ${full} · เดือนแรก ${part} · งวดสุดท้าย ${fin}`;
      } finally { S.job = j0 == null ? undefined : JSON.parse(j0); S.day = d0; S.money = m0; try { if (pt) PTax.st().cur = JSON.parse(pt); } catch (e) { } } }],
    ['รายเดือน: วันจ่ายเงิน = วันสุดท้ายของเดือน (ถ้าเป็นวันเสาร์ ย้อน 3 วัน) ทั้งปี', async () => {
      if (!window.MonthCal) throw new Error('ไม่มี MonthCal'); const y = Cal36.date(S.day).y, out = [];
      for (let m = 0; m < 12; m++) { const dim = Cal36.daysIn(y, m), last = MonthCal.dayNum(y, m, dim), pd = MonthCal.payDayNum(y, m), t = Cal36.date(pd);
        const sat = Cal36.dowOf(Cal36.epoch(last)) === 5, want = sat ? dim - 3 : dim;
        if (t.m !== m || t.dom !== want) throw new Error('เดือน ' + (m + 1) + ' จ่ายวันที่ ' + t.dom + ' ควรเป็น ' + want);
        if (!MonthCal.isPayDay(pd) || (MonthCal.isPayDay(pd - 1) && pd - 1 !== pd)) throw new Error('isPayDay ผิด');
        out.push(t.dom); }
      return 'วันจ่ายแต่ละเดือน: ' + out.join(', '); }],
    ['รายเดือน: ทั้งปีจ่าย 12 ครั้ง และวันจ่ายทุกเดือนไม่ซ้ำ/ไม่ตกหล่น', async () => {
      if (!window.MonthCal) throw new Error('ไม่มี MonthCal'); const y = Cal36.date(S.day).y; let n = 0; const seen = new Set();
      for (let d = MonthCal.dayNum(y, 0, 1); d <= MonthCal.dayNum(y, 11, 31); d++) if (MonthCal.isPayDay(d)) { n++; seen.add(Cal36.date(d).m); }
      if (n !== 12 || seen.size !== 12) throw new Error('จ่ายได้ ' + n + ' ครั้ง ในเดือนที่ต่างกัน ' + seen.size);
      return '12 ครั้งต่อปี'; }],
    ['รายเดือน: take() คิดค่าไฟ/น้ำเพียงครั้งเดียวต่อวัน และไม่นับข้ามต้นเดือน', async () => {
      if (!window.MonthCal) throw new Error('ไม่มี MonthCal'); const keep = S.mcLast; try {
        const y = Cal36.date(S.day).y, d = MonthCal.dayNum(y, 5, 15), first = MonthCal.dayNum(y, 5, 1);
        S.mcLast = first - 1; const a = MonthCal.take(d), b = MonthCal.take(d);
        if (a !== 15) throw new Error('ควรนับ 15 วัน ได้ ' + a); if (b !== 0) throw new Error('เรียกซ้ำวันเดียวกันควรได้ 0 ได้ ' + b);
        S.mcLast = first - 10; const c = MonthCal.take(d); if (c !== 15) throw new Error('ค่าไฟต้องไม่นับก่อนต้นเดือน ได้ ' + c);
        return 'ผ่าน'; } finally { S.mcLast = keep; } }],
    ['เซิร์ฟเวอร์เกม (ถ้าต่ออยู่)', async () => { if (!Net.on) return 'ไม่ได้ต่อเซิร์ฟเวอร์ (ข้าม)'; const p = await Net.api('ping'); if (!p.ok) throw new Error('ping ไม่ตอบ'); if (p.writable === false) throw new Error('เซิร์ฟเวอร์เขียนโฟลเดอร์ saves ไม่ได้'); if (p.freeMB != null && p.freeMB >= 0 && p.freeMB < 500) throw new Error('ดิสก์เหลือน้อย ' + p.freeMB + ' MB'); const f = await Net.api('files'); if (!f.files || f.files.length < 100) throw new Error('รายการไฟล์เกมผิดปกติ'); if (BUILD && f.build !== BUILD) throw new Error(`เวอร์ชันในเครื่อง ${BUILD} ไม่ตรงกับเซิร์ฟเวอร์ ${f.build} (กดรีเฟรช)`); const l = await Net.api('saves'); return `${p.srv || 'server'} · เวอร์ชัน ${f.build} · เซฟ ${l.saves.length} ชุด · ดิสก์ว่าง ${Math.round((p.freeMB || 0) / 1024)} GB`; }],
    ['ความลื่นของภาพ (วัด 3 วินาที)', async () => { let n = 0, t0 = performance.now(); await new Promise(res => { const f = () => { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); setTimeout(res, 5000); }); const el = (performance.now() - t0) / 1000, fps = Math.round(n / el), mem = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB' : 'ไม่ทราบ'; if (document.hidden || n < 5) return 'หน้าจอไม่ได้แสดงอยู่ จึงวัดไม่ได้ (ข้าม)'; const soft = /SwiftShader|llvmpipe|Software/i.test((() => { try { const c = document.createElement('canvas'), g = c.getContext('webgl'), x = g && g.getExtension('WEBGL_debug_renderer_info'); return x ? g.getParameter(x.UNMASKED_RENDERER_WEBGL) : ''; } catch (e) { return ''; } })()); if (soft) return `${fps} FPS (เรนเดอร์ด้วยซอฟต์แวร์ ไม่มีการ์ดจอ จึงไม่ตัดสินผ่าน/ไม่ผ่าน) · หน่วยความจำ ${mem}`; if (fps < 15) throw new Error(`ช้ามาก ${fps} FPS`); return `${fps} FPS · หน่วยความจำ ${mem}`; }],
    ['ไม่มี error แฝงระหว่างทดสอบ', async () => { if (errs.length) throw new Error(errs.slice(0, 3).join(' | ')); return 'ไม่มี'; }],
  ];
  async function run(show) {
    const res = [], t00 = performance.now();
    const block = Slots.cur ? Slots.cur() : 1; Slots.deleting = block;       // nothing is saved to this device or the server while the tests change the game
    for (const [name, fn] of TESTS) {
      const t0 = performance.now(); let ok = true, note = '';
      try { note = await Promise.race([fn(), new Promise((_, rej) => setTimeout(() => rej(new Error('ใช้เวลานานเกิน 25 วินาที (หน้าจออาจถูกซ่อนอยู่)')), 25000))]); } catch (e) { ok = false; note = String(e && e.message || e); }
      res.push({ name, ok, note, ms: Math.round(performance.now() - t0) });
      if (show) show(res);
    }
    const rep = { time: new Date().toISOString(), build: BUILD, ua: navigator.userAgent.slice(0, 120), pass: res.filter(r => r.ok).length, fail: res.filter(r => !r.ok).length, secs: Math.round((performance.now() - t00) / 100) / 10, results: res };
    try { localStorage.setItem('raisukjai_selftest', JSON.stringify(rep)); } catch (e) { }
    try { if (Net.on) await Net.api('selftest', rep); } catch (e) { }
    return rep;
  }
  window.Selftest = { run, TESTS };
  if (/[?&]selftest=1/.test(location.search)) {
    const box = document.createElement('div');
    box.id = 'selftest211'; box.style.cssText = 'position:fixed;inset:0;z-index:100;background:rgba(5,12,9,.94);color:#e8f5e9;font:14px/1.5 Kanit,sans-serif;overflow:auto;padding:16px';
    document.body.appendChild(box);
    const draw = (res, done, rep) => { box.innerHTML = `<h2 style="margin:0 0 8px">🧪 ตรวจระบบเกม ${done ? (rep.fail ? `<span style="color:#ff8a80">ไม่ผ่าน ${rep.fail} ข้อ</span>` : '<span style="color:#9fff9f">ผ่านทั้งหมด</span>') : '(กำลังตรวจ...)'}</h2><p style="opacity:.8;margin:0 0 10px">ระหว่างตรวจ เกมจะไม่บันทึกอะไรเลย เซฟของคุณไม่ถูกแตะ</p>` + res.map(r => `<div style="padding:6px 8px;margin:4px 0;border-radius:8px;background:${r.ok ? 'rgba(46,125,50,.35)' : 'rgba(183,28,28,.45)'}">${r.ok ? '✅' : '❌'} <b>${E(r.name)}</b> <small>(${r.ms} ms)</small><br><small>${E(r.note)}</small></div>`).join('') + (done ? `<p><button id="stBack211" style="padding:10px 18px;border-radius:12px;font:600 16px Kanit,sans-serif">↩️ กลับไปเล่นเกม (โหลดใหม่)</button></p><pre id="selftest-result" style="display:none">${E(JSON.stringify({ pass: rep.pass, fail: rep.fail, results: rep.results }))}</pre>` : ''); if (done) document.getElementById('stBack211').onclick = () => { Slots.deleting = 0; location.href = location.pathname; }; };
    (async () => {
      draw([], false);
      for (let i = 0; i < 80 && !(window.S && window.G && G.player); i++) await sleep(500);          // wait for the game to finish loading
      if (!G.started) { const b = document.getElementById('btnPlay'); if (b) b.click(); await sleep(2500); }
      const rep = await run(res => draw(res, false)); draw(rep.results, true, rep);
    })();
  }
});
