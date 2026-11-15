'use strict';
// ---------- v228: audit committee, executive KPIs, boardroom conflict ----------
// 1) Audit committee: three independent directors (directors with no stake are independent) review the accounts; mid-size and larger companies need one.
// 2) KPI: every executive has a target each quarter (13 weeks), judged from the books. Pass -> bonus and good mood; fail -> bad mood and a question in the next board meeting; three fails -> resigns.
// 3) Conflict: a director whose mood stays low for weeks first warns, then either resigns or forces a motion of no confidence in the chair onto the next board meeting.
V23.add('v228_gov3', function () {
  if (!window.Agm216 || !Agm216.EXEC || !Agm216.boardMin) return;
  const A = Agm216, K = Equity.core, POSX = A.EXEC.POS, SAL = A.EXEC.SAL, clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const baht0 = x => (typeof baht === 'function' ? baht(x) : String(Math.round(x || 0)));
  const shortPos = k => (POSX[k].n.match(/\(([A-Z]+)\)/) || [0, POSX[k].n])[1];
  const msg = (c, t, imp) => { try { Phone.msg(c.name, t, !imp); } catch (e) { } };   // Phone.msg's third argument is 'quiet': important lines are not quiet
  const hasStake = (c, n) => (A.reg(c) || []).some(h => h.n === n && h.p > 0.0005);

  // ================= 1. audit committee =================
  const NAUD = 3, AUDIT_ITEMS = { qfin: 1, aud: 1, agm: 1, divp: 1, spec: 1 };
  const members = c => (c.auditc || []).filter(n => (c.board || []).some(d => d.n === n && d.trait === 'indep'));
  const required = c => !!c && (c.listed || (A.boardStage(c).tier || 0) >= 5);
  const valid = c => members(c).length >= NAUD;
  A.AUDC = { members, required, valid, NAUD };
  K.AG.audc = { n: 'แต่งตั้งกรรมการตรวจสอบ', opts: [], yes: () => 0.8 };
  { const _a = A.agOf; A.agOf = t => t === 'audc' ? 14 : t === 'nocf' ? 16 : _a(t); }
  { const _l = A.labEx; A.labEx = (m, it) => it.t === 'audc' ? `แต่งตั้ง ${it.who} เป็นกรรมการตรวจสอบ` : it.t === 'nocf' ? `ญัตติไม่ไว้วางใจประธานกรรมการ เสนอโดย ${it.who} (ถ้าผ่าน ${it.who} เป็นประธานแทน)` : (_l ? _l(m, it) : null); }
  K.AG.nocf = { n: 'ญัตติไม่ไว้วางใจประธานกรรมการ', opts: [], yes: () => 0.25 };
  { const _bx = A.bdExtra; A.bdExtra = c => {
    const o = _bx ? _bx(c) : [], mem = members(c);
    for (const d of (c.board || [])) if (d.trait === 'indep' && !mem.includes(d.n) && mem.length < 5) o.push([`audc|1|${d.n}`, `แต่งตั้ง ${d.n} (กรรมการอิสระ) เป็นกรรมการตรวจสอบ (ตอนนี้ ${mem.length}/${NAUD})`]);
    return o; }; }
  const dirOf = (c, n) => (c.board || []).find(d => d.n === n);
  { const _ap = A.applyEx; A.applyEx = function (m, it) {
    const c = it && String(m.key).startsWith('co:') ? Company.get(+String(m.key).slice(3)) : null;
    if (c && it.t === 'audc') {
      const d = dirOf(c, it.who); if (!d) return 'ไม่พบกรรมการ'; if (d.trait !== 'indep') return `${it.who} ไม่ใช่กรรมการอิสระ`;
      c.auditc = c.auditc || []; if (!c.auditc.includes(it.who)) c.auditc.push(it.who);
      c.rep = clamp((c.rep == null ? 50 : c.rep) + 1, 0, 100);
      return `แต่งตั้ง ${it.who} เป็นกรรมการตรวจสอบแล้ว (${members(c).length}/${NAUD}${valid(c) ? ' · ครบองค์ประกอบ' : ''})`;
    }
    if (c && it.t === 'nocf') {
      if (!dirOf(c, it.who)) return `ญัตติตกไป (${it.who} ไม่ได้อยู่ในบอร์ดแล้ว)`;
      const out = _ap.call(this, m, { t: 'chair', v: 1, who: it.who });
      c.rep = clamp((c.rep == null ? 50 : c.rep) - 3, 0, 100); for (const d of (c.board || [])) { d.mood = clamp((d.mood == null ? 50 : d.mood) + 6, 5, 98); d.low = 0; }
      return `ญัตติผ่าน: ${it.who} เป็นประธานกรรมการแทนคุณ ชื่อเสียง −3 · ${out || ''}`;
    }
    const r = _ap ? _ap.apply(this, arguments) : null;
    // a director appointed by resolution who holds no shares is an independent director
    if (c && it.t === 'dir') { try { const d = dirOf(c, it.who); if (d) { d.appt = 1; if (c.autoDir) delete c.autoDir[it.who]; if (!hasStake(c, it.who)) d.trait = 'indep'; } } catch (e) { } }
    return r; }; }
  { const _se = A.stanceEx; A.stanceEx = function (h, it, board) {
    let v = _se ? (_se.apply(this, arguments) || 0) : 0;
    try {
      const SS = A.session, c = SS && SS.m ? Company.get(+String(SS.m.key).slice(3)) : null;
      if (board && c) {
        if (AUDIT_ITEMS[it.t]) { if (valid(c)) v += 0.05; else if (required(c)) v -= 0.06; }
        if (it.t === 'nocf') { const mood = h.ref && h.ref.mood != null ? h.ref.mood : 50; v += -2.4 * (mood - 50) / 100 * 0.9; if (h.n === it.who) v += 0.4; }
      }
    } catch (e) { }
    return v; }; }
  { const _fe = A.failEx; A.failEx = function (m, it) {
    if (it && it.t === 'nocf') {
      const c = Company.get(+String(m.key).slice(3)); const d = c && dirOf(c, it.who); if (!d) return 'ญัตติไม่ผ่าน';
      d.mood = clamp((d.mood == null ? 50 : d.mood) - 12, 5, 98); d.low = 0;
      if (Math.random() < 0.4) { c.board = c.board.filter(x => x !== d); c.noRejoin = c.noRejoin || {}; c.noRejoin[d.n] = S.day + 28; msg(c, `👔 ${d.n} ลาออกจากกรรมการหลังญัตติไม่ผ่าน`, true); return `ญัตติไม่ผ่าน ${it.who} เสียหน้าและลาออกจากกรรมการ`; }
      return `ญัตติไม่ผ่าน ${it.who} เสียหน้า อารมณ์ลดลง`;
    }
    return _fe ? _fe.apply(this, arguments) : ''; }; }

  // ================= 2. KPI =================
  const Q = 91;
  const snapOf = c => ({ day: S.day, cash: c.cash || 0, ytd: c.ytd || 0, staff: (c.staff || []).length, halt: c.haltDays || 0 });
  const KPI = {
    ceo: [c => 'กำไรสะสมไม่ลดลงจากต้นไตรมาส', (c, s) => (c.ytd || 0) >= s.ytd],
    cfo: [c => 'เงินสดไม่ลดเกิน 10% จากต้นไตรมาส', (c, s) => (c.cash || 0) >= s.cash - Math.abs(s.cash) * 0.1],
    coo: [c => 'ต้นทุนรอบล่าสุดไม่เกินรอบก่อน 5%', c => { const m = c.mon || []; return m.length < 2 || m[0].cost <= m[1].cost * 1.05; }],
    cmo: [c => 'รายรับรอบล่าสุดไม่ต่ำกว่ารอบก่อน', c => { const m = c.mon || []; return m.length < 2 || m[0].rev >= m[1].rev; }],
    cto: [c => 'มีงบเทคโนโลยีที่ผ่านมติภายใน 6 เดือน', c => !!c.tech && S.day - c.tech <= 182],
    chro: [c => 'จำนวนพนักงานไม่ลดลงจากต้นไตรมาส', (c, s) => (c.staff || []).length >= s.staff],
    clo: [c => 'ไม่ถูกปรับตามกฎในไตรมาสนี้', (c, s) => (c.fineB || -9999) < s.day && (c.fineA || -9999) < s.day],
    cpo: [c => 'มีประกันทรัพย์สินที่อนุมัติแล้ว', c => !!c.insured],
    // v238: the added departments
    cco: [c => 'มีสัญญาลูกค้าที่ใช้งานอย่างน้อย 1 ฉบับ', c => { try { return Contracts207.st(c).active.length >= 1; } catch (e) { return true; } }],
    cxo: [c => 'ชื่อเสียงบริษัทไม่ต่ำกว่า 50', c => (c.rep || 0) >= 50],
    cso: [c => 'กำไรสะสมเพิ่มขึ้นจากต้นไตรมาส', (c, s) => (c.ytd || 0) > s.ytd],
    cro: [c => 'เงินสดบริษัทไม่ติดลบ', c => (c.cash || 0) >= 0 && !(c.debtWeeks > 0)],
    cao: [c => 'เงินสดปลายรอบล่าสุดไม่ต่ำกว่าต้นรอบ', c => { const m = c.mon || []; return !m.length || m[0].close >= m[0].open; }],
    cdo: [c => 'มีงบเทคโนโลยีที่ผ่านมติภายใน 12 เดือน', c => !!c.tech && S.day - c.tech <= 364],
    ciso: [c => 'ไม่หยุดดำเนินการ (ขาดเงื่อนไข/ไฟดับ) เกิน 3 วันในไตรมาส', (c, s) => c.st === 'open' && (c.haltDays || 0) - (s.halt || 0) <= 3],
    cqo: [c => 'ต้นทุนรอบล่าสุดไม่เกินรอบก่อน 10%', c => { const m = c.mon || []; return m.length < 2 || m[0].cost <= m[1].cost * 1.1; }],
    chso: [c => 'ไม่หยุดดำเนินการเกิน 3 วันในไตรมาส และไม่ถูกปรับตามกฎ', (c, s) => (c.haltDays || 0) - (s.halt || 0) <= 3 && (c.fineB || -9999) < s.day && (c.fineA || -9999) < s.day],
    cbdo: [c => 'มีสาขาที่เปิดอยู่ หรือรายรับรอบล่าสุดไม่ต่ำกว่ารอบก่อน', c => (c.br || []).some(b => b.st === 'open') || ((c.mon || []).length < 2 || c.mon[0].rev >= c.mon[1].rev)],
    cpdo: [c => 'มีงบเทคโนโลยีภายใน 12 เดือน และรายรับไม่ต่ำกว่ารอบก่อน', c => !!c.tech && S.day - c.tech <= 364 && ((c.mon || []).length < 2 || c.mon[0].rev >= c.mon[1].rev)],
    ccuo: [c => 'ต้นทุนรอบล่าสุดไม่เกินรอบก่อน 8% และชื่อเสียงไม่ต่ำกว่า 50', c => { const m = c.mon || []; return (m.length < 2 || m[0].cost <= m[1].cost * 1.08) && (c.rep || 0) >= 50; }],
    cpjo: [c => 'มีสัญญาลูกค้าที่ใช้งาน 1 ฉบับขึ้นไป และไม่หยุดดำเนินการเกิน 3 วัน', (c, s) => { let n = 1; try { n = Contracts207.st(c).active.length; } catch (e) { } return n >= 1 && (c.haltDays || 0) - (s.halt || 0) <= 3; }],
    cno: [c => 'ไม่หยุดดำเนินการเกิน 3 วัน และต้นทุนรอบล่าสุดไม่เกินรอบก่อน 10%', (c, s) => { const m = c.mon || []; return (c.haltDays || 0) - (s.halt || 0) <= 3 && (m.length < 2 || m[0].cost <= m[1].cost * 1.1); }],
    csro: [c => 'ชื่อเสียงไม่ต่ำกว่า 40 และไม่ถูกปรับตามกฎ', c => (c.rep || 0) >= 40 && (c.fineB || -9999) < S.day - 90 && (c.fineA || -9999) < S.day - 90],
  };
  A.KPI228 = KPI;
  const evalKpi = c => {
    const s = c.kpiSnap || snapOf(c);
    for (const e of (c.exec || []).slice()) {
      const D = KPI[e.k]; if (!D) continue; if (S.day - (e.since || 0) < 28) continue;   // a new hire is judged from the next quarter
      const pass = !!D[1](c, s), txt = D[0](c);
      e.kpi = { pass, day: S.day, txt };
      if (pass) {
        e.fails = 0; e.mood = clamp((e.mood == null ? 55 : e.mood) + 10, 5, 98);
        const sl = e.sal || A.execSal(c, e.k), b = Math.round(sl * 0.75); if ((c.cash || 0) >= b + sl * 3) { c.cash -= b; try { Company.book(c, 0, b); } catch (x) { } msg(c, `🧑‍💼 ${e.n} (${shortPos(e.k)}) ผ่านเป้าหมายไตรมาส (${txt}) · จ่ายโบนัส ${baht0(b)}`, false); } else msg(c, `🧑‍💼 ${e.n} (${shortPos(e.k)}) ผ่านเป้าหมายไตรมาส แต่เงินบริษัทไม่พอจ่ายโบนัส`, false);
      } else {
        e.fails = (e.fails || 0) + 1; e.mood = clamp((e.mood == null ? 55 : e.mood) - 12, 5, 98);
        if (e.fails >= 3) { c.exec.splice(c.exec.indexOf(e), 1); if (e.dir) c.board = (c.board || []).filter(b => b.n !== e.n); msg(c, `🧑‍💼 ${e.n} (${shortPos(e.k)}) ไม่ผ่านเป้าหมาย 3 ไตรมาสติด จึงพ้นตำแหน่ง`, true); }
        else msg(c, `⚠️ ${e.n} (${shortPos(e.k)}) ไม่ผ่านเป้าหมายไตรมาส (${txt}) ครั้งที่ ${e.fails} จะถูกถามในที่ประชุมบอร์ด`, true);
      }
    }
    c.kpiSnap = snapOf(c);
  };
  // the board asks about an executive who failed his target
  const PT = { ceo: 5, cfo: 4, coo: 8, cmo: 7, cto: 15, chro: 12, clo: 14, cpo: 13, cco: 7, cxo: 16, cso: 10, cro: 13, cao: 14, cdo: 15, ciso: 15, cqo: 8, csro: 16, chso: 13, cbdo: 9, cpdo: 15, ccuo: 7, cpjo: 8, cno: 8 };
  const TAG = { bal: '(สมดุล) ', agg: '(เชิงรุก) ', cau: '(รอบคอบ) ', dod: '(เลี่ยงตอบ) ' };
  { const _dq = A.dynQ; A.dynQ = (n, SS) => {
    const L = _dq ? _dq(n, SS) : [];
    try {
      if (!SS || !SS.board) return L;
      const c = SS.f && SS.f.c; if (!c) return L;
      for (const e of (c.exec || [])) if (e.kpi && !e.kpi.pass && e.kpiQ !== e.kpi.day && PT[e.k] === n && !(SS._kq && SS._kq[e.k])) {
        (SS._kq = SS._kq || {})[e.k] = 1;
        L.push({ id: 'kpi_' + e.k, text: `ผู้บริหาร ${e.n} (${shortPos(e.k)}) ไม่ผ่านเป้าหมายไตรมาสที่ผ่านมา (${e.kpi.txt}) ครั้งที่ ${e.fails} ประธานจะดำเนินการอย่างไร?`, o: [
          [TAG.bal + 'ให้แผนปรับปรุง 1 ไตรมาส ติดตามรายเดือน และรายงานบอร์ด หากยังไม่ผ่านจะพิจารณาเปลี่ยนตัว', 7, null, null, null, 'bal'],
          [TAG.agg + 'เปลี่ยนตัวทันทีและจ้างผู้มีประสบการณ์มาแทน ยอมรับต้นทุนช่วงเปลี่ยนผ่าน', 5, null, null, null, 'agg'],
          [TAG.cau + 'ให้โอกาสอีกหนึ่งไตรมาสพร้อมเงื่อนไขชัดเจนและผู้ช่วยดูแล', 4, null, null, null, 'cau'],
          [TAG.dod + 'เป็นเรื่องภายในฝ่ายบริหาร ขอไม่ให้รายละเอียดในที่ประชุม', -6, null, null, null, 'dod']] });
      }
    } catch (x) { console.warn('v228 kpiQ', x); }
    return L; }; }

  // ================= 3. conflict =================
  const LOW = 35, OK = 45;
  const dirQuit = (c, d, why) => { c.board = (c.board || []).filter(x => x !== d); c.noRejoin = c.noRejoin || {}; c.noRejoin[d.n] = S.day + 28; c.rep = clamp((c.rep == null ? 50 : c.rep) - 2, 0, 100); msg(c, `👔 ${d.n} ลาออกจากกรรมการ: ${why}`, true); };
  const week = c => {
    if (c.st !== 'open') return;
    for (const d of (c.board || []).slice()) {
      const m = d.mood == null ? 50 : d.mood; d.low = m < LOW ? (d.low || 0) + 1 : (m >= OK ? 0 : (d.low || 0));
      if (d.low === 3) msg(c, `👔 กรรมการ ${d.n} ไม่พอใจการบริหารมาสามสัปดาห์แล้ว ควรคุยหรือตอบคำถามให้ชัดในการประชุมบอร์ดครั้งต่อไป`, true);
      if (d.low >= 6 && !c.confl) {
        if (Math.random() < 0.5) { c.confl = { by: d.n, day: S.day }; d.low = 0; msg(c, `⚠️ กรรมการ ${d.n} จะเสนอญัตติไม่ไว้วางใจประธานในการประชุมบอร์ดครั้งต่อไป`, true); }
        else dirQuit(c, d, 'ไม่พอใจการบริหารต่อเนื่อง');
      }
    }
    if (c.confl && !(c.board || []).some(d => d.n === c.confl.by)) c.confl = null;
    // executives: audit-committee members that left the board drop out; the quarter ends
    c.auditc = members(c);
    if (c.kpiNext == null) { c.kpiNext = S.day + Q; c.kpiSnap = snapOf(c); }
    if (S.day >= c.kpiNext && Array.isArray(c.exec) && c.exec.length) { evalKpi(c); c.kpiNext = S.day + Q; }
    else if (S.day >= c.kpiNext) { c.kpiNext = S.day + Q; c.kpiSnap = snapOf(c); }
  };
  { const _w = Company.week; Company.week = function () { const r = _w.apply(this, arguments); try { for (const c of Company.list()) week(c); } catch (e) { console.warn('v228 week', e); } return r; }; }
  A.week228 = week;
  // the motion is forced onto the next board meeting
  { const o = UI.H.ag217send; if (o) UI.H.ag217send = function (d) {
    const c = Company.get(+d.v), before = c && d.k === 'bd' ? K.st().mt.filter(m => m.key === 'co:' + c.id && m.kind === 'board' && (m.status === 'sched' || m.status === 'due')).map(m => m.id) : [];
    const r = o.apply(this, arguments);
    try {
      if (c && d.k === 'bd' && c.confl && (c.board || []).some(x => x.n === c.confl.by)) {
        const m = K.st().mt.filter(x => x.key === 'co:' + c.id && x.kind === 'board' && (x.status === 'sched' || x.status === 'due') && !before.includes(x.id))[0];
        if (m && !m.items.some(i => i.t === 'nocf')) { m.items.push({ t: 'nocf', v: 1, who: c.confl.by }); UI.toast(`มีญัตติไม่ไว้วางใจประธานจาก ${c.confl.by} ถูกบรรจุในวาระ`, '⚠️'); }
      }
    } catch (e) { console.warn('v228 confl', e); }
    return r; }; }
  { const _od = A.onDone; A.onDone = function (m, res, SS) {
    const r = _od ? _od.apply(this, arguments) : undefined;
    try {
      const c = Company.get(+String(m.key).slice(3));
      if (c) {
        for (const e of (c.exec || [])) if (e.kpi && (SS.log || []).some(l => l.id === 'kpi_' + e.k)) e.kpiQ = e.kpi.day;   // asked for real
        const ni = m.items.findIndex(i => i.t === 'nocf');
        if (ni >= 0 && !(res[ni] && res[ni].defer)) { c.confl = null; for (const d of (c.board || [])) d.low = 0; }   // a deferred motion keeps its warning
      }
    } catch (e) { }
    // explain the audit-committee effect on the result screen
    try {
      const c = Company.get(+String(m.key).slice(3)); if (c && SS && SS.board) res.forEach((r2, i) => { const it = m.items[i]; if (!it || r2.info || r2.defer || !AUDIT_ITEMS[it.t]) return; const t = valid(c) ? 'คณะกรรมการตรวจสอบครบ +5%' : required(c) ? 'ยังไม่มีคณะกรรมการตรวจสอบครบ 3 คน −6%' : ''; if (t) r2.note = (r2.note ? r2.note + ' · ' : 'ปัจจัยอื่น: ') + t; });
    } catch (e) { }
    return r; }; }

  // ================= panel =================
  const _tb = A.tierBadge;
  A.tierBadge = function (c, tr) {
    let h = _tb ? _tb.apply(this, arguments) : '';
    try {
      const mem = members(c), req = required(c);
      h += `<h5>🔍 คณะกรรมการตรวจสอบ</h5><p class="dim">${mem.length}/${NAUD} คน${mem.length ? ' · ' + mem.map(x => x).join(', ') : ''} · ${valid(c) ? '✅ ครบองค์ประกอบ งบการเงินและปันผลผ่านง่ายขึ้น' : req ? '⛔ บริษัทขนาดนี้ต้องมี 3 คน ไม่ครบจะถูกตั้งข้อสังเกตตอนลงมติงบ/ปันผล/ผู้สอบบัญชี' : 'ยังไม่บังคับสำหรับบริษัทขนาดเล็ก'} · กรรมการที่ไม่ถือหุ้นที่แต่งตั้งด้วยมติเป็นกรรมการอิสระ แต่งตั้งเป็นกรรมการตรวจสอบได้ในวาระที่ 14</p>`;
      const ex = (c.exec || []).filter(e => e.kpi);
      if (ex.length) h += `<p class="dim">🎯 เป้าหมายไตรมาสล่าสุด: ${ex.map(e => `${shortPos(e.k)} ${e.kpi.pass ? '✅' : '❌' + (e.fails > 1 ? '×' + e.fails : '')}`).join(' · ')} · ถัดไป ${c.kpiNext != null ? 'วันที่ ' + c.kpiNext : '-'}</p>`;
      else if ((c.exec || []).length) h += `<p class="dim">🎯 ผู้บริหารมีเป้าหมายรายไตรมาส (ทุก 91 วัน) ผ่านแล้วได้โบนัส ไม่ผ่านจะถูกถามในบอร์ด ไม่ผ่าน 3 ไตรมาสติดพ้นตำแหน่ง · ประเมินครั้งแรก วันที่ ${c.kpiNext != null ? c.kpiNext : '-'}</p>`;
      const sad = (c.board || []).filter(d => (d.low || 0) >= 1);
      if (c.confl) h += `<p class="lead" style="border:1px solid rgba(255,120,120,.5);border-radius:12px;padding:8px 12px">⚠️ ${c.confl.by} จะเสนอญัตติไม่ไว้วางใจประธาน (บรรจุในวาระประชุมบอร์ดครั้งต่อไป)</p>`;
      else if (sad.length) h += `<p class="dim">😠 กรรมการที่ไม่พอใจ: ${sad.map(d => `${d.n} (${d.low} สัปดาห์)`).join(', ')} · ถ้าไม่พอใจเกิน 6 สัปดาห์ อาจลาออกหรือเสนอไม่ไว้วางใจประธาน ควรตอบคำถามให้ดีหรือคุยก่อนประชุม</p>`;
    } catch (e) { }
    return h;
  };
});
