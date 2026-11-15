'use strict';
// ---------- v226: governance additions ----------
// 1) a persistent notice in the company window (board needs 10 holders, shareholders' meeting = public companies only)
// 2) a co-investor (partner / investor / villager) holding 10%+ is a director automatically; the chair is the player; a board meeting needs 10 directors (chair included)
// 3) agenda point 15 (technology / R&D) gets an approval item
V23.add('v226_gov2', function () {
  if (!window.Agm216 || !Agm216.tier) return;
  const A = Agm216, K = Equity.core;
  // ---- 1. notice
  const _tb = A.tierBadge;
  A.tierBadge = function (c, tr) {
    let h = _tb ? _tb.apply(this, arguments) : '';
    try {
      const n = A.coCount(c), ok = A.boardOK(c);
      h += `<p class="lead" style="border:1px solid rgba(255,255,255,.2);border-radius:12px;padding:8px 12px">${ok ? '✅' : '⛔'} ประชุมบอร์ด: ต้องมีคณะกรรมการและผู้บริหารอย่างน้อย ${A.boardMin(c)} คน รวมประธาน และมีกรรมการที่โหวตได้อย่างน้อย ${VOTE_MIN} คน (ตอนนี้โหวตได้ ${A.dirOnly(c)} คน) ตอนนี้ ${n} คน${ok ? '' : ' · ยังนัดไม่ได้'} · ผู้ร่วมลงทุนถือหุ้น ${pcs(DIR_MIN)} ขึ้นไปเป็นกรรมการอัตโนมัติ (ออกเมื่อต่ำกว่า ${pcs(DIR_OUT)}) · แต่งตั้งกรรมการด้วยมติบอร์ดได้ · บอร์ดสูงสุด ${BOARD_MAX} คน<br>${c.listed ? '🏛️ ประชุมสามัญผู้ถือหุ้น: จัดได้ (บริษัทมหาชนจำกัด)' : '🏛️ ประชุมสามัญผู้ถือหุ้น: จัดได้เฉพาะบริษัทมหาชนจำกัด (หลังเข้าตลาดหลักทรัพย์) · ตอนนี้ให้ลงมติเรื่องผู้ถือหุ้นที่ประชุมบอร์ด'}</p>`;
    } catch (e) { }
    return h;
  };
  // ---- 3. technology item (agenda point 15)
  if (K.AG) K.AG.tech = { n: 'อนุมัติงบเทคโนโลยีและวิจัยพัฒนา (80,000 ฿)', opts: [], yes: () => 0.7 };
  const _ago = A.agOf; A.agOf = t => t === 'tech' ? 15 : _ago(t);
  const _lab = A.labEx; A.labEx = (m, it) => it.t === 'tech' ? 'อนุมัติงบเทคโนโลยีและวิจัยพัฒนา (80,000 ฿)' : (_lab ? _lab(m, it) : null);
  const _bx = A.bdExtra; A.bdExtra = c => { const o = _bx ? _bx(c) : []; o.push(['tech|1|', 'อนุมัติงบเทคโนโลยีและวิจัยพัฒนา (80,000 ฿)']); return o; };
  const _ap = A.applyEx;
  A.applyEx = function (m, it) {
    if (it && it.t === 'tech') {
      const c = Company.get(+String(m.key).slice(3)); if (!c) return 'ไม่พบบริษัท';
      if (c.cash < 130000) return 'เงินบริษัทไม่พอ';
      c.cash -= 80000; Company.book(c, 0, 80000); c.tech = S.day; c.rep = Math.min(100, (c.rep == null ? 50 : c.rep) + 2);
      return 'อนุมัติงบเทคโนโลยีและวิจัยพัฒนา 80,000 ฿ ชื่อเสียง +2';
    }
    return _ap ? _ap.apply(this, arguments) : null;
  };
  // ---- 2. every co-investor (partner / investor / villager with a stake) is a director; the chair is always the player
  const TR = ['cons', 'growth', 'indep'];
  const DIR_MIN = 0.05, DIR_OUT = 0.025, BOARD_MIN = 10, BOARD_MAX = 15;   // join at 5%+, leave below 2.5%; a board meeting needs 10 directors (the chair included); the board holds at most 15
  A.DIRCFG = { DIR_MIN, DIR_OUT, BOARD_MIN, BOARD_MAX };
  // the minimum board (directors + chair + executives) grows with the company: new and small 3, mid-size 5, large or public 10
  A.boardStage = c => {
    const cap = (c && (c.cap || c.paid)) || 0, hold = ((A.reg(c) || []).filter(h => h.p > 0.0005)).length;
    // v234: every company can hold a board meeting from 6 people (directors + chair + executives); tier keeps the old size class (3 / 5 / 10) for the audit committee rule
    const M = 6;
    if (c.listed || cap > 10e6) return { min: M, tier: BOARD_MIN, why: c.listed ? 'บริษัทมหาชน (จดทะเบียนในตลาดหลักทรัพย์)' : 'ทุนจดเกิน 10 ล้านบาท' };
    if (cap >= 2e6 || hold >= 5) return { min: M, tier: 5, why: cap >= 2e6 ? 'ทุนจด 2–10 ล้านบาท' : 'มีผู้ถือหุ้นตั้งแต่ 5 คน' };
    return { min: M, tier: 3, why: 'ข้อกำหนดขั้นต่ำของบริษัท' };
  };
  A.boardMin = c => A.boardStage(c).min;
  const pcs = x => (Math.round(x * 1000) / 10) + '%';
  const KIND = h => (h.k === 'partner' || h.k === 'inv' || h.k === 'vil' || h.k === 'ofc') && !h.serving;   // v241: a serving police / military officer may hold shares but cannot sit on the board
  const INV = h => h.p >= DIR_MIN - 1e-9 && KIND(h), KEEP = h => h.p >= DIR_OUT - 1e-9 && KIND(h);
  A.syncBoard = c => {
    if (!c || c.st !== 'open') return;
    const R = A.reg(c);
    if (!Array.isArray(c.board)) { c.board = []; }
    c.autoDir = c.autoDir || {};
    // a partner who holds nothing is not a director
    // a partner who holds nothing, or an automatic director whose stake is gone, leaves (a director appointed by resolution stays)
    const gone = d => !d.appt && ((d.n === c.partner && !c.autoDir[d.n]) || c.autoDir[d.n]) && !R.some(h => h.n === d.n && KEEP(h));
    c.board = c.board.filter(d => { if (gone(d)) { delete c.autoDir[d.n]; return false; } return true; });
    if (c.chair && !c.board.some(d => d.n === c.chair)) c.chair = null;   // the elected chair left the board: the chair is the player again
    for (const h of R.slice().sort((a, b) => b.p - a.p)) {
      if (!INV(h) || c.board.some(d => d.n === h.n) || ((c.noRejoin || {})[h.n] || 0) > S.day) continue;
      if (c.board.length + 1 >= BOARD_MAX) break;   // the board is full (the chair counts)
      c.autoDir[h.n] = 1;
      c.board.push({ n: h.n, role: 'dir', mood: h.mood == null ? 55 : h.mood, since: S.day, trait: A.pickTrait(c, null), ofc: h.k === 'ofc', prof: h.prof || '' });
      try { Phone.msg(c.name, `👔 ${h.n} ถือหุ้นตั้งแต่ ${pcs(DIR_MIN)} จึงเข้าเป็นกรรมการ (ประธานกรรมการคือคุณ)`, true); } catch (e) { }
    }
  };
  A.dirCount = c => { try { A.syncBoard(c); } catch (e) { } return (Array.isArray(c.board) ? c.board.length : 0) + 1 + (Array.isArray(c.exec) ? c.exec.filter(e => !e.dir).length : 0); };   // an executive promoted to director (e.dir) is counted once, as a director   // directors + the chair (the player) + executives (non-voting)
  A.dirOnly = c => (Array.isArray(c.board) ? c.board.length : 0) + 1;
  A.coCount = A.dirCount;
  const VOTE_MIN = 3;   // v234: at least 3 people who can VOTE (the chair + 2 directors); executives count toward the 6 but never vote
  A.VOTE_MIN = VOTE_MIN;
  A.boardOK = c => !!c && A.dirCount(c) >= A.boardMin(c) && A.dirOnly(c) >= VOTE_MIN;
  A.boardBlockMsg = c => A.dirCount(c) >= A.boardMin(c) && A.dirOnly(c) < VOTE_MIN ? `นัดประชุมบอร์ดไม่ได้: ต้องมีกรรมการที่มีสิทธิ์ออกเสียงอย่างน้อย ${VOTE_MIN} คน รวมประธาน (ตอนนี้ ${A.dirOnly(c)} คน · ผู้บริหารไม่มีสิทธิ์โหวต) กด "เลื่อนเป็นกรรมการ" ให้ผู้บริหารที่จ้างไว้ หรือชวนเพื่อนร่วมหุ้นตั้งแต่ 5% แล้วกด "เจ้าของอนุมัติทันที" ได้โดยไม่ต้องประชุม` : `นัดประชุมบอร์ดได้เมื่อมีคณะกรรมการและผู้บริหารอย่างน้อย ${A.boardMin(c)} คน รวมประธาน เพราะ${A.boardStage(c).why} (ตอนนี้ ${A.dirCount(c)} คน = กรรมการ ${A.dirOnly(c)} + ผู้บริหาร ${(c.exec || []).length} · ผู้ร่วมลงทุนถือหุ้น ${pcs(DIR_MIN)} ขึ้นไปจึงเป็นกรรมการ หรือแต่งตั้งด้วยมติบอร์ด · สูงสุด ${BOARD_MAX} คน)`;
  { const _od = A.onDone; A.onDone = function (m, res, SS) {
    const r = _od ? _od.apply(this, arguments) : undefined;
    try {
      if (m && m.kind === 'board' && SS && SS.board) { const c = Company.get(+String(m.key).slice(3)); if (c && c.dfee > 0) {
        const per = Math.round(c.dfee * 0.5), who = (SS.att || []).filter(h => !h.nv && h.k === 'dir' && h.ref && !h.ref.execK), units = who.reduce((a, h) => a + (h.n === c.chair ? 1.5 : 1), 0) + (c.chair ? 1 : 1.5), tot = Math.round(per * units);
        if (tot > 0 && (c.cash || 0) >= tot) { c.cash -= tot; try { Company.book(c, 0, tot); } catch (x) { } A.feeIncome(c, 0.5); try { Phone.msg(c.name, `💼 จ่ายเบี้ยประชุมกรรมการ ${who.length + 1} คน รวม ${tot.toLocaleString('th-TH')} ฿ (ประธาน 1.5 เท่า · คุณได้รับส่วนของคุณหลังหักภาษีแล้ว)`, false); } catch (x) { } }
      } }
    } catch (e) { console.warn('v234 allowance', e); }
    return r; }; }
  { const _ap2 = A.applyEx; A.applyEx = function (m, it) {   // the board holds at most BOARD_MAX directors
    if (it && it.t === 'dir') { const c = Company.get(+String(m.key).slice(3)); if (c && Array.isArray(c.board) && c.board.length + 1 >= BOARD_MAX && !c.board.some(d => d.n === it.who)) return `บอร์ดเต็มแล้ว (สูงสุด ${BOARD_MAX} คน รวมประธาน)`; }
    return _ap2 ? _ap2.apply(this, arguments) : null; }; }
  // ---- executives (non-voting; count toward the board-meeting minimum; hired by the owner, paid every week)
  const POS = {
    ceo: { n: 'ผู้จัดการทั่วไป (CEO)', cover: ['mgr', 'expand', 'branch', 'bonus'] },
    cfo: { n: 'ผู้บริหารการเงิน (CFO)', cover: ['divp', 'spec', 'dpay', 'credit', 'repay', 'aud', 'budget', 'cap'] },
    coo: { n: 'ผู้บริหารปฏิบัติการ (COO)', cover: ['buyg', 'ctsign', 'expand', 'closebr', 'branch'] },
    cmo: { n: 'ผู้บริหารการตลาด (CMO)', cover: ['mkt', 'branch', 'ctsign'] },
    cto: { n: 'ผู้บริหารเทคโนโลยี (CTO)', cover: ['tech', 'ctrl'] },
    chro: { n: 'ผู้บริหารบุคคล (CHRO)', cover: ['bonus', 'dir', 'dirx', 'mgr'] },
    clo: { n: 'ผู้บริหารกฎหมายและกำกับดูแล (CLO)', cover: ['bylaw', 'cg', 'ctrl', 'ipo', 'newholder', 'aud'] },
    cpo: { n: 'ผู้บริหารจัดซื้อและห่วงโซ่อุปทาน (CPO)', cover: ['buyg', 'stake', 'ctsign', 'ins', 'riskr'] },
    // v238: more departments
    cco: { n: 'ผู้บริหารการค้าและฝ่ายขาย (CCO)', cover: ['mkt', 'ctsign', 'branch', 'expand'] },
    cxo: { n: 'ผู้บริหารประสบการณ์ลูกค้า (CXO)', cover: ['mkt', 'csr', 'ctsign'] },
    cso: { n: 'ผู้บริหารกลยุทธ์และพัฒนาธุรกิจ (CSO)', cover: ['expand', 'stake', 'ipo', 'cap', 'newholder', 'branch'] },
    cro: { n: 'ผู้บริหารความเสี่ยง (CRO)', cover: ['riskr', 'ins', 'ctrl', 'credit', 'repay'] },
    cao: { n: 'ผู้บริหารบัญชีและตรวจสอบภายใน (CAO)', cover: ['aud', 'ctrl', 'qfin', 'divrec'] },
    cdo: { n: 'ผู้บริหารข้อมูลและ AI (CDO)', cover: ['tech', 'mkt', 'budget'] },
    ciso: { n: 'ผู้บริหารความมั่นคงปลอดภัยสารสนเทศ (CISO)', cover: ['ctrl', 'tech', 'riskr'] },
    cqo: { n: 'ผู้บริหารการผลิตและคุณภาพ (CQO)', cover: ['expand', 'buyg', 'closebr', 'ctrl'] },
    csro: { n: 'ผู้บริหารความยั่งยืนและชุมชน (CSRO)', cover: ['csr', 'cg', 'dpay'] },
    // v239: roles that real companies in these lines of business have (see FAM / REC below)
    chso: { n: 'ผู้บริหารความปลอดภัยและอาชีวอนามัย (CHSO)', cover: ['ins', 'ctrl', 'riskr', 'closebr'] },
    cbdo: { n: 'ผู้บริหารพัฒนาธุรกิจและขยายสาขา (CBDO)', cover: ['branch', 'expand', 'stake', 'ctsign'] },
    cpdo: { n: 'ผู้บริหารผลิตภัณฑ์ (CPDO)', cover: ['tech', 'mkt', 'budget', 'expand'] },
    ccuo: { n: 'ผู้บริหารอาหารและเมนู (CCUO)', cover: ['mkt', 'buyg', 'expand', 'csr'] },
    cpjo: { n: 'ผู้บริหารโครงการและงานติดตั้ง (CPJO)', cover: ['ctsign', 'expand', 'buyg', 'branch'] },
    cno: { n: 'ผู้บริหารเครือข่ายและปฏิบัติการภาคสนาม (CNO)', cover: ['expand', 'closebr', 'buyg', 'ctsign'] },
  };
  const SAL = 10000, NM = ['สมเกียรติ', 'วรรณา', 'ธนกร', 'พิมพ์ชนก', 'ศักดิ์ชัย', 'นภัสสร', 'อนุชา', 'กัญญา', 'ภูริทัต', 'ชุติมา', 'ปรเมศวร์', 'ศิริพร', 'วีระพงษ์', 'จิราภา', 'เอกชัย', 'สุนิสา'];
  // v234: realistic pay. Executives earn a monthly salary (a game month = 7 days) by position and company size (small x1, mid-size x1.5, large/public x2.5) plus the employer's social-security share (875);
  // directors who are not executives get a monthly retainer and a meeting allowance (half the retainer per meeting attended). Executives who sit on the board get no director fee.
  const EXEC_BASE = { ceo: 90000, cfo: 70000, coo: 65000, cmo: 55000, cto: 70000, chro: 50000, clo: 60000, cpo: 50000, cco: 60000, cxo: 52000, cso: 65000, cro: 65000, cao: 58000, cdo: 62000, ciso: 62000, cqo: 58000, csro: 50000, chso: 56000, cbdo: 62000, cpdo: 64000, ccuo: 54000, cpjo: 60000, cno: 58000 };
  const SSO = 875, TIERM = { 3: 1, 5: 1.5, 10: 2.5 };
  A.execSal = (c, k) => Math.round((EXEC_BASE[k] || 50000) * (TIERM[A.boardStage(c).tier] || 1) / 1000) * 1000;
  A.feeOpts = c => { const t = A.boardStage(c).tier; return t >= 10 ? [30000, 50000, 80000] : t >= 5 ? [10000, 20000, 30000] : [5000, 10000, 15000]; };
  A.feeCount = c => (Array.isArray(c.board) ? c.board.filter(d => !d.execK).length : 0);   // directors who are paid a fee
  A.EXEC = { POS, SAL, base: EXEC_BASE, SSO };
  // v238: executives are shown as cards grouped by department; the hire box lists the free positions by department with their monthly salary
  const DEPT = [
    ['👑', 'บริหารทั่วไปและปฏิบัติการ', ['ceo', 'coo', 'cqo', 'cpjo', 'cno']],
    ['💰', 'การเงินและบัญชี', ['cfo', 'cao', 'cro']],
    ['📣', 'การตลาดและลูกค้า', ['cmo', 'cco', 'cxo']],
    ['🧪', 'ผลิตภัณฑ์และนวัตกรรม', ['cpdo', 'ccuo']],
    ['💻', 'เทคโนโลยีและข้อมูล', ['cto', 'cdo', 'ciso']],
    ['⚖️', 'บุคคล กฎหมาย ธรรมาภิบาล และความปลอดภัย', ['chro', 'clo', 'csro', 'chso']],
    ['🧭', 'กลยุทธ์ พัฒนาธุรกิจ และห่วงโซ่อุปทาน', ['cso', 'cbdo', 'cpo']],
  ];
  A.DEPT = DEPT;
  // v239: which positions a company of each kind really has (from the executive teams of real companies: software/SaaS, data-centre operators, solar EPC and installers, restaurant groups,
  // food manufacturers, trucking and logistics, EV charging). Titles differ by industry: the COO usually owns operations and often quality, supply chain and safety; software firms add product, data and security chiefs;
  // restaurants add a culinary head and a development (franchise / new branch) head; contractors and logistics firms add a project or network operations head and a safety head.
  const FAM = {
    tech: ['it', 'app', 'game', 'ai', 'cyber', 'itmaint', 'ecom', 'fintech', 'edtech', 'webagency', 'appstudio', 'data', 'itoutsource', 'itshop'],
    infra: ['dc', 'host', 'isp', 'iot'], project: ['sec', 'solar', 'smarthome', 'repair'], foodsvc: ['cafe', 'bakery', 'noodle', 'tea', 'catering'],
    mfg: ['food'], logistics: ['logistics', 'courier', 'moving'], energy: ['ev'], service: ['bpo', 'agency'],
  };
  const FAMN = { tech: 'ธุรกิจซอฟต์แวร์/ไอที', infra: 'โครงสร้างพื้นฐานดิจิทัล', project: 'งานติดตั้งและโครงการ', foodsvc: 'ร้านอาหารและเครื่องดื่ม', mfg: 'การผลิตและแปรรูป', logistics: 'ขนส่งและโลจิสติกส์', energy: 'พลังงานและสถานีชาร์จ', service: 'ธุรกิจบริการ', general: 'ธุรกิจทั่วไป' };
  const REC = {
    tech: ['ceo', 'cfo', 'cto', 'cpdo', 'cdo', 'ciso', 'cco', 'chro', 'clo'],
    infra: ['ceo', 'cfo', 'coo', 'cto', 'ciso', 'cno', 'cpjo', 'chso', 'cco', 'cro'],
    project: ['ceo', 'cfo', 'coo', 'cpjo', 'chso', 'cqo', 'cco', 'cpo', 'cro'],
    foodsvc: ['ceo', 'cfo', 'coo', 'ccuo', 'cbdo', 'cmo', 'cxo', 'cpo', 'cqo', 'chro'],
    mfg: ['ceo', 'cfo', 'coo', 'cqo', 'cpo', 'chso', 'cmo', 'cco', 'cro', 'csro'],
    logistics: ['ceo', 'cfo', 'coo', 'cno', 'chso', 'cpo', 'cro', 'chro', 'cco'],
    energy: ['ceo', 'cfo', 'coo', 'cpjo', 'cto', 'chso', 'cmo', 'cxo', 'cso'],
    service: ['ceo', 'cfo', 'coo', 'cmo', 'cco', 'cxo', 'chro', 'cto', 'clo'],
    general: ['ceo', 'cfo', 'coo', 'cmo', 'cto', 'chro', 'clo'],
  };
  A.famOf = c => { const t = c && c.type; for (const f of Object.keys(FAM)) if (FAM[f].includes(t)) return f; return 'general'; };
  A.recFor = c => REC[A.famOf(c)] || REC.general;
  A.famName = c => FAMN[A.famOf(c)];
  // v239: a director's temperament follows the role (a finance or risk chief leans careful, sales and business development lean to growth, legal and governance lean independent)
  // and the board stays mixed: a type that is already common among the executives and directors is less likely to be picked again
  const TRW = {
    ceo: [2, 3, 1], cfo: [4, 1, 2], coo: [2, 2, 2], cmo: [1, 4, 1], cto: [1, 3, 2], chro: [2, 1, 3], clo: [3, 0.5, 4], cpo: [3, 1, 2], cco: [1, 4, 1], cxo: [1, 2, 3], cso: [1, 4, 2],
    cro: [5, 0.5, 2], cao: [4, 0.5, 3], cdo: [1.5, 3, 2], ciso: [4, 0.5, 3], cqo: [3, 1, 2], csro: [2, 1, 4], chso: [4, 0.5, 3], cbdo: [1, 5, 1], cpdo: [1, 3, 2], ccuo: [2, 2, 2], cpjo: [2, 2, 2], cno: [3, 2, 2],
  };
  A.pickTrait = (c, k) => {
    const w = (TRW[k] || [1, 1, 1]).slice(), n = [0, 0, 0];
    for (const d of (c && c.board) || []) { const i = TR.indexOf(d.trait); if (i >= 0) n[i]++; }
    for (const e of (c && c.exec) || []) { const i = TR.indexOf(e.trait); if (i >= 0 && !e.dir) n[i]++; }
    const ww = w.map((x, i) => x / (1 + 0.9 * n[i])), t = ww.reduce((a, b) => a + b, 0); let r = Math.random() * t;
    for (let i = 0; i < 3; i++) { r -= ww[i]; if (r <= 0) return TR[i]; } return TR[2];
  };
  const deptIdx = k => DEPT.findIndex(d => d[2].includes(k));
  const TRN = { cons: '🛡️ สายระมัดระวัง', growth: '🚀 สายขยายธุรกิจ', indep: '⚖️ สายอิสระ' };
  const execHtml = c => {
    const L = Array.isArray(c.exec) ? c.exec : [], free = Object.keys(POS).filter(k => !L.some(e => e.k === k));
    const btn = (a, k, label, cls) => `<button class="btn${cls ? ' ' + cls : ''}" data-a="${a}" data-v="${c.id}" data-k="${k}">${label}</button>`;
    const cards = L.slice().sort((a, b) => deptIdx(a.k) - deptIdx(b.k)).map(e => {
      const D = DEPT[deptIdx(e.k)] || ['🧑‍💼', 'อื่น ๆ'], sal = e.sal || A.execSal(c, e.k);
      return `<div class="cx-card"><div class="cx-dept">${D[0]} ${D[1]}</div><h4>${POS[e.k].n}</h4><div class="cx-meta"><b>${e.n}</b><br>เงินเดือน ${th(sal)} ฿/เดือน · หัก ณ ที่จ่ายประมาณ ${th(A.wht(sal))} ฿</div>
        <div class="cx-chips">${e.dir ? '<span class="cx-chip good">👔 กรรมการ (โหวตได้)</span>' : ''}${A.recFor(c).includes(e.k) ? '<span class="cx-chip good">⭐ ตรงกับธุรกิจ</span>' : ''}${TRN[e.trait] ? `<span class="cx-chip">${TRN[e.trait]}</span>` : ''}<span class="cx-chip">อยู่มา ${A.tenureTxt(e)}</span><span class="cx-chip">กองทุนสำรองฯ ${th(e.pvd || 0)} ฿</span>${e.miss ? '<span class="cx-chip bad">⚠️ ค้างจ่าย</span>' : ''}</div>
        ${e.ask ? `<div class="cx-ask">ขอปรับเงินเดือนเป็น <b>${th(e.ask)} ฿</b><div class="cx-actions">${btn('exe226raise', e.k, 'อนุมัติ')}${btn('exe226deny', e.k, 'ไม่อนุมัติ', 'ghost')}</div></div>` : ''}
        <div class="cx-actions">${e.dir ? btn('exe226undir', e.k, 'ถอดจากกรรมการ', 'ghost') : btn('exe226dir', e.k, '⬆️ เลื่อนเป็นกรรมการ')}${btn('exe226fire', e.k, 'เลิกจ้าง', 'ghost')}</div></div>`;
    }).join('');
    const rec = A.recFor(c).filter(k => free.includes(k)), opt = k => `<option value="${k}">${POS[k].n} · ${th(A.execSal(c, k))} ฿/เดือน</option>`;
    const recGroup = rec.length ? `<optgroup label="⭐ แนะนำสำหรับ${A.famName(c)}">${rec.map(opt).join('')}</optgroup>` : '';
    const groups = recGroup + DEPT.map(([ic, nm, ks]) => { const f = ks.filter(k => free.includes(k) && !rec.includes(k)); return f.length ?`<optgroup label="${ic} ${nm}">${f.map(k => `<option value="${k}">${POS[k].n} · ${th(A.execSal(c, k))} ฿/เดือน</option>`).join('')}</optgroup>` : ''; }).join('');
    return `<h5>🧑‍💼 ผู้บริหาร ${L.length} คน (มีได้ ${Object.keys(POS).length} ตำแหน่ง ใน ${DEPT.length} ฝ่าย)</h5><p class="dim">ไม่มีสิทธิออกเสียง · นับรวมในเกณฑ์ ${A.boardMin(c)} คน · เงินเดือนตามตำแหน่งและขนาดบริษัท · จ่ายทุกเดือน</p><p class="dim">⭐ ธุรกิจนี้เป็นกลุ่ม "${A.famName(c)}" ตำแหน่งที่มีดาวคือตำแหน่งที่บริษัทแบบนี้มีจริง (ช่วยเพิ่มโอกาสเห็นด้วยในวาระที่ตรงสายงานได้ +5% แทนที่จะเป็น +3%)</p>${L.length ? `<div class="cx-grid">${cards}</div>` : '<p class="dim">ยังไม่มีผู้บริหาร</p>'}${free.length ? `<div class="cx-hire"><select id="exe226sel${c.id}">${groups}</select><button class="btn" data-a="exe226hire" data-v="${c.id}">➕ จ้างผู้บริหาร</button></div>` : ''}<p class="dim">ผู้บริหารเข้าประชุมบอร์ด ตอบและถามในสายงานของตน (มีนิสัยแบบกรรมการ แต่ไม่มีสิทธิออกเสียง) และเพิ่มโอกาสเห็นด้วย +3% ในเรื่องที่ตรงสายงาน จ้างได้เองโดยไม่ต้องรอประชุมบอร์ด</p>`;
  };
  const _tb2 = A.tierBadge;
  A.tierBadge = function (c, tr) {
    let h = _tb2 ? _tb2.apply(this, arguments) : '';
    try {
      const L = Array.isArray(c.exec) ? c.exec : [], free = Object.keys(POS).filter(k => !L.some(e => e.k === k));
      h += execHtml(c);
    } catch (e) { }
    return h;
  };
  Object.assign(UI.H, {
    exe226hire: d => {
      const c = Company.get(+d.v); if (!c) return; const sel = document.getElementById('exe226sel' + c.id), k = sel && sel.value; if (!k || !POS[k]) return;
      c.exec = Array.isArray(c.exec) ? c.exec : []; if (c.exec.some(e => e.k === k)) { UI.toast('ตำแหน่งนี้มีผู้บริหารแล้ว', '🧑‍💼'); return; }
      const sal0 = A.execSal(c, k); if ((c.cash || 0) < (sal0 + SSO) * 3) { UI.toast(`เงินบริษัทไม่พอ ต้องมีสำรองเงินเดือนอย่างน้อย 3 เดือน (${((sal0 + SSO) * 3).toLocaleString('th-TH')} ฿ · เงินเดือน ${sal0.toLocaleString('th-TH')} ฿/เดือน)`, '🧑‍💼'); return; }
      const used = new Set(c.exec.map(e => e.n)), pool = NM.filter(n => !used.has(n)), name = (pool[Math.floor(Math.random() * pool.length)] || 'ผู้บริหาร') + ' ' + ['ใจดี', 'มั่นคง', 'รุ่งเรือง', 'วงศ์ไทย'][Math.floor(Math.random() * 4)];
      c.exec.push({ k, n: name, sal: sal0, since: S.day, mood: 55, trait: A.pickTrait(c, k) }); UI.toast(`จ้าง ${name} เป็น${POS[k].n}แล้ว (ตอนนี้ ${A.dirCount(c)} คน)`, '🧑‍💼');
    },
    exe226dir: d => {   // v234: an executive is promoted to a voting director (stays an executive too)
      const c = Company.get(+d.v); if (!c || !Array.isArray(c.exec)) return; const e = c.exec.find(x => x.k === d.k); if (!e || e.dir) return;
      c.board = Array.isArray(c.board) ? c.board : []; if (c.board.length + 1 >= BOARD_MAX) { UI.toast(`บอร์ดเต็มแล้ว (สูงสุด ${BOARD_MAX} คน รวมประธาน)`, '👔'); return; }
      e.dir = 1; c.board.push({ n: e.n, role: 'dir', appt: 1, execK: e.k, mood: e.mood == null ? 60 : e.mood, since: S.day, trait: e.trait || A.pickTrait(c, e.k) });
      UI.toast(`${e.n} เป็นกรรมการที่โหวตได้แล้ว (กรรมการที่โหวตได้ ${A.dirOnly(c)} คนรวมประธาน)`, '👔');
    },
    exe226undir: d => { const c = Company.get(+d.v); if (!c || !Array.isArray(c.exec)) return; const e = c.exec.find(x => x.k === d.k); if (!e || !e.dir) return; delete e.dir; c.board = (c.board || []).filter(b => b.n !== e.n); UI.toast(`${e.n} กลับเป็นผู้บริหารที่ไม่มีสิทธิ์โหวต`, '👔'); },
    exe226fire: d => {   // v234: severance by length of service (Thai labour law), paid by the company; the provident-fund balance goes to the executive
      const c = Company.get(+d.v); if (!c || !Array.isArray(c.exec)) return; const i = c.exec.findIndex(e => e.k === d.k); if (i < 0) return; const e = c.exec[i];
      const sal = e.sal || A.execSal(c, e.k), days = A.sevDays(e), sev = Math.round(sal / 30 * days);
      if ((c.cash || 0) < sev) { UI.toast(`เงินบริษัทไม่พอจ่ายค่าชดเชย ${sev.toLocaleString('th-TH')} ฿ (${days} วัน ตามอายุงาน ${A.tenureTxt(e)})`, '💸'); return; }
      c.cash -= sev; try { Company.book(c, 0, sev); } catch (x) { } c.exec.splice(i, 1); if (e.dir) c.board = (c.board || []).filter(b => b.n !== e.n);
      UI.toast(`เลิกจ้าง ${e.n} แล้ว จ่ายค่าชดเชย ${sev.toLocaleString('th-TH')} ฿ (${days} วัน ตามอายุงาน ${A.tenureTxt(e)})${e.pvd ? ` · คืนกองทุนสำรองเลี้ยงชีพ ${e.pvd.toLocaleString('th-TH')} ฿` : ''}`, '🧑‍💼');
    },
  });
  // executives attend the board meeting (about 80% of the time like everyone), ask questions in their own field and have a temperament, but never vote
  const PT = { ceo: [5, 9, 12], cfo: [3, 4, 6, 11, 17], coo: [8, 9, 12], cmo: [5, 7], cto: [15], chro: [12], clo: [14, 16, 17], cpo: [8, 10, 13] };
  const shortPos = k => (POS[k].n.match(/\(([A-Z]+)\)/) || [0, POS[k].n])[1];
  { const _bh = A.boardH; A.boardH = k => {
    const H = _bh(k); if (!H) return H;
    try {
      const c = H.f.c; if (c && Array.isArray(c.exec)) for (const e of c.exec) {
        if (!POS[e.k] || e.dir) continue; /* a promoted executive already sits in the list as a voting director */ if (!e.trait) e.trait = A.pickTrait(c, e.k); if (e.mood == null) e.mood = 55;
        H.list.push({ n: `${e.n} (${shortPos(e.k)})`, k: 'exec', p: 0, nv: true, role: e.k, ref: e });
      }
    } catch (x) { console.warn('v226 exec', x); }
    return H; }; }
  { const _pf = A.prefer; A.prefer = (n, h, board) => {
    let w = _pf ? _pf(n, h, board) : 1;
    if (h && h.nv && PT[h.role]) w *= PT[h.role].includes(n) ? 3 : 0.3;   // an executive speaks mostly in his own field
    return w; }; }
  { const _se3 = A.stanceEx; A.stanceEx = function (h, it, board) {
    let v = _se3 ? (_se3.apply(this, arguments) || 0) : 0;
    try { const SS = A.session; if (board && SS && SS.m) { const c = Company.get(+String(SS.m.key).slice(3)); const hit = c ? (c.exec || []).filter(e => POS[e.k] && POS[e.k].cover.includes(it.t)) : []; if (hit.length) v += hit.some(e => A.recFor(c).includes(e.k)) ? 0.05 : 0.03; } } catch (e) { }   // v239: +5% when the executive's role is one this kind of business really has, +3% otherwise
    return v; }; }

  // ===== v234: realistic employment rules for executives, directors and the chair =====
  const cl = (x, lo, hi) => Math.max(lo, Math.min(hi, x)), YD2 = (typeof YEAR_DAYS !== 'undefined' ? YEAR_DAYS : 84), TERM = 3 * YD2;   // a game year = 84 days; a director's term is 3 years
  const say = (c, t, urgent) => { try { Phone.msg(c.name, t, !!urgent); } catch (x) { } };
  const th = n => Math.round(n).toLocaleString('th-TH');
  // monthly withholding tax on a salary (annualised: 50% expense deduction up to 100,000 + 60,000 personal allowance, then the progressive Thai brackets)
  A.wht = m => { const g = m * 12, net = Math.max(0, g - Math.min(100000, g * 0.5) - 60000); let t = 0, lo = 0; for (const [hi, r] of [[150000, 0], [300000, .05], [500000, .1], [750000, .15], [1000000, .2], [2000000, .25], [5000000, .3], [Infinity, .35]]) { if (net > lo) t += (Math.min(net, hi) - lo) * r; lo = hi; } return Math.round(t / 12); };
  const years = e => Math.max(0, (S.day - (e.since == null ? S.day : e.since)) / YD2);
  A.tenureTxt = e => { const y = years(e); return y >= 1 ? `${Math.floor(y)} ปี ${Math.round((y % 1) * 12)} เดือน` : `${Math.round(y * 12)} เดือน`; };
  // severance (days of pay): 120 days of service 30, 1 year 90, 3 years 180, 6 years 240, 10 years 300, 20 years 400
  A.sevDays = e => { const y = years(e); return y >= 20 ? 400 : y >= 10 ? 300 : y >= 6 ? 240 : y >= 3 ? 180 : y >= 1 ? 90 : y >= 1 / 3 ? 30 : 0; };
  // the chair earns 1.5 x the retainer; executives who sit on the board get no director fee. The player gets their own share as taxed income.
  A.feeCount = c => { let u = 0; for (const d of (Array.isArray(c.board) ? c.board : [])) if (!d.execK) u += d.n === c.chair ? 1.5 : 1; return u + (c.chair ? 1 : 1.5); };   // fee units: the player counts too
  A.feeIncome = (c, mult) => {
    const share = Math.round((c.dfee || 0) * mult * (c.chair ? 1 : 1.5)); if (share <= 0) return;
    const tax = A.wht(share), net = share - tax; try { earn(net); } catch (x) { S.money += net; }
    try { Bank2.income(`${c.chair ? 'ค่าตอบแทนกรรมการ' : 'ค่าตอบแทนประธานกรรมการ'} ${c.name} (หักภาษี ${th(tax)})`, net); } catch (x) { }
    c.whtPaid = (c.whtPaid || 0) + tax;
  };
  A.monthly = c => {
    c.owe = Array.isArray(c.owe) ? c.owe : [];
    for (const o of c.owe.slice()) if ((c.cash || 0) >= o.amt) { c.cash -= o.amt; try { Company.book(c, 0, o.amt); } catch (x) { } c.owe.splice(c.owe.indexOf(o), 1); say(c, `💸 จ่ายเงินเดือนที่ค้างให้ ${o.n} ${th(o.amt)} ฿ แล้ว`, false); }
    for (const e of (Array.isArray(c.exec) ? c.exec.slice() : [])) {
      if (!e.sal) e.sal = A.execSal(c, e.k);
      const pvd = Math.round(e.sal * 0.05), pay = e.sal + SSO + pvd;   // company cost = salary + social security + 5% provident-fund match
      if ((c.cash || 0) >= pay) {
        c.cash -= pay; try { Company.book(c, 0, pay); } catch (x) { } e.miss = 0; c.whtPaid = (c.whtPaid || 0) + A.wht(e.sal); e.pvd = (e.pvd || 0) + pvd * 2;   // 5% from the employee + 5% from the company go into the fund
      } else {
        e.miss = (e.miss || 0) + 1; e.mood = cl((e.mood == null ? 55 : e.mood) - 15, 5, 98); c.owe.push({ n: e.n, amt: pay });
        if (e.miss >= 2) { c.exec.splice(c.exec.indexOf(e), 1); if (e.dir) c.board = (c.board || []).filter(b => b.n !== e.n); say(c, `🧑‍💼 ${e.n} (${POS[e.k].n}) ลาออก เพราะบริษัทค้างจ่ายเงินเดือน 2 เดือนติด (ค้างจ่าย ${th(pay * 2)} ฿ บริษัทต้องจ่ายคืนเมื่อมีเงิน)`, true); }
        else say(c, `⚠️ เงินบริษัทไม่พอจ่ายเงินเดือน ${e.n} (${POS[e.k].n}) ${th(pay)} ฿ ค้างจ่ายไว้ก่อน ถ้าค้างอีกเดือนเขาจะลาออก`, true);
        continue;
      }
      // yearly salary review: the market rate caught up with the company's size, or a good performer
      if (!e.ask && S.day - (e.lastRaise == null ? (e.since || 0) : e.lastRaise) >= YD2) {
        const market = A.execSal(c, e.k), perf = e.kpi && e.kpi.pass && !e.fails, want = e.sal < market * 0.92 ? market : perf ? Math.round(e.sal * 1.08 / 1000) * 1000 : 0;
        if (want > e.sal) { e.ask = want; e.askDay = S.day; say(c, `🧑‍💼 ${e.n} (${POS[e.k].n}) ขอปรับเงินเดือนเป็น ${th(want)} ฿ (ปัจจุบัน ${th(e.sal)} ฿) ตัดสินใจที่หน้าบริษัท`, true); }
        else e.lastRaise = S.day;
      } else if (e.ask && S.day - e.askDay >= 6 * 7) {   // no answer for 6 months: unhappy, maybe poached
        e.askDay = S.day; e.mood = cl((e.mood == null ? 55 : e.mood) - 10, 5, 98);
        if (e.mood < 45 && Math.random() < 0.35) { c.exec.splice(c.exec.indexOf(e), 1); if (e.dir) c.board = (c.board || []).filter(b => b.n !== e.n); say(c, `🧑‍💼 ${e.n} (${POS[e.k].n}) ถูกบริษัทอื่นซื้อตัวไป เพราะไม่ได้รับการตอบเรื่องเงินเดือน`, true); }
      }
    }
    for (const d of (c.board || [])) if (!d.execK && S.day - (d.since == null ? S.day : d.since) >= TERM && d.warnT !== d.since) { d.warnT = d.since; say(c, `👔 กรรมการ ${d.n} ครบวาระ 3 ปี จะถูกใส่ในวาระเลือกตั้งของการประชุมบอร์ดครั้งถัดไป`, false); }
  };
  A.TERM = TERM;
  Object.assign(UI.H, {
    exe226raise: d => { const c = Company.get(+d.v), e = c && (c.exec || []).find(x => x.k === d.k); if (!e || !e.ask) return; e.sal = e.ask; delete e.ask; e.lastRaise = S.day; e.mood = cl((e.mood == null ? 55 : e.mood) + 8, 5, 98); UI.toast(`ปรับเงินเดือน ${e.n} เป็น ${th(e.sal)} ฿ แล้ว`, '🧑‍💼'); },
    exe226deny: d => {
      const c = Company.get(+d.v), e = c && (c.exec || []).find(x => x.k === d.k); if (!e || !e.ask) return; delete e.ask; e.lastRaise = S.day; e.mood = cl((e.mood == null ? 55 : e.mood) - 12, 5, 98);
      if (e.mood < 40 && Math.random() < 0.3) { c.exec.splice(c.exec.indexOf(e), 1); if (e.dir) c.board = (c.board || []).filter(b => b.n !== e.n); UI.toast(`${e.n} ไม่พอใจและลาออกไปอยู่ที่อื่น`, '🧑‍💼'); }
      else UI.toast(`ไม่อนุมัติ ${e.n} ไม่ค่อยพอใจ`, '🧑‍💼');
    },
  });
  // a director who is not re-elected leaves the board for a quarter
  { const _fe = A.failEx; A.failEx = function (m, it) {
    let out = _fe ? _fe.apply(this, arguments) : '';
    try { if (it && it.t === 'dirr') { const c = Company.get(+String(m.key).slice(3)); if (c && Array.isArray(c.board)) { const i = c.board.findIndex(d => d.n === it.who); if (i >= 0) { c.board.splice(i, 1); c.noRejoin = c.noRejoin || {}; c.noRejoin[it.who] = S.day + 3 * 7; out = `${it.who} ไม่ได้รับเลือกตั้งกลับ พ้นจากตำแหน่งกรรมการ`; } } } } catch (x) { console.warn('v234 dirr fail', x); }
    return out; }; }
  const _w = Company.week;
  Company.week = function () {
    const r = _w.apply(this, arguments);
    try { for (const c of Company.list()) { A.syncBoard(c); if (c.st === 'open') A.monthly(c); } } catch (e) { console.warn('v226 week', e); }
    return r;
  };
  for (const h of ['ag217send', 'bdclose']) {
    const o = UI.H[h]; if (!o) continue;
    UI.H[h] = function (d) { try { if (h === 'bdclose') { const m = K.st().mt.find(x => x.id == d.v); if (m && String(m.key).startsWith('co:')) A.syncBoard(Company.get(+m.key.slice(3))); } else { const c = Company.get(+d.v); if (c) A.syncBoard(c); } } catch (e) { } return o.apply(this, arguments); };
  }
});
