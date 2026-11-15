'use strict';
// ---------- v217: the BOARD OF DIRECTORS and the SHAREHOLDERS' MEETING are two separate things, and villagers can buy into a company ----------
//   🏛️ shareholders' meeting (annual / extra): the owners decide on their own matters, votes are counted by SHARES:
//        accept the accounts, special dividend, capital increase, appoint a DIRECTOR, appoint an AUDITOR, take a new shareholder (¾ special resolution), change the co-shareholder
//   👔 board meeting: the directors (you = chair + the people the shareholders appointed) manage the company, ONE DIRECTOR = ONE VOTE (the chair decides a tie):
//        hire a manager, invest, open a branch, close a branch, pay a staff bonus. The directors ask operating questions (cash flow, controls, insurance, suppliers ...).
//   🤝 outside investors (business owners, wealthy investors, senior officers) ask to buy in by themselves (v50 offers + v241_investors.js); villagers and friends are no longer invited.
V23.add('v217_board', function () {
  if (typeof Company === 'undefined' || !window.Agm216 || !Equity.core) return;
  const K = Equity.core, A = Agm216, E = s => (typeof esc === 'function' ? esc(s) : String(s)), pc = K.pc;
  // a board meeting needs at least 10 co-shareholders who hold shares (the register: holders with a stake above zero)
  const BOARD_MIN = 10;
  A.coCount = c => (A.reg(c) || []).filter(h => h.p > 0.0005).length;
  A.boardOK = c => !!c && A.coCount(c) >= BOARD_MIN;
  A.boardBlockMsg = c => `นัดประชุมบอร์ดได้เมื่อมีผู้ร่วมหุ้นอย่างน้อย ${BOARD_MIN} คน (ตอนนี้ ${A.coCount(c)} คน)`;
  const rnd = (a, b) => a + Math.random() * (b - a), clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const hash = s => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
  const baht0 = n => (typeof baht === 'function' ? baht(n) : String(n));
  const open = c => c && c.st === 'open';
  const face = m => (m >= 70 ? '😊' : m >= 50 ? '🙂' : m >= 35 ? '😐' : '😠');
  const MAXDIR = 14;   // a board holds at most 15 including the chair (v226 BOARD_MAX)

  // ---------- new kinds of agenda ----------
  Object.assign(K.AG, {
    dir: { n: 'แต่งตั้งกรรมการ', opts: [{ v: 1, l: 'แต่งตั้งกรรมการใหม่' }], yes: () => 0.65 },
    aud: { n: 'แต่งตั้งผู้สอบบัญชี', opts: [], yes: () => 0.8 },
    branch: { n: 'เปิดสาขาใหม่', opts: [{ v: 1, l: 'เปิดสาขาใหม่' }], yes: () => 0.6 },
    closebr: { n: 'ปิดสาขา', opts: [], yes: () => 0.5 },
    bonus: { n: 'โบนัสพนักงาน', opts: [{ v: 1, l: 'จ่ายโบนัสพนักงาน 1 เดือน' }], yes: () => 0.6 },
  });
  // ----- the agenda of real meetings -----
  // shareholders' annual meeting: minutes, report, accounts, profit and dividend, elect directors, directors' fees, auditor, other business
  // board meeting: minutes, performance report, accounts, budget, risk, internal control, credit, investment, CSR / governance, call the AGM
  const pct = v => Math.round(v * 100) + '%';
  Object.assign(K.AG, {
    minp: { n: 'รับรองรายงานการประชุมผู้ถือหุ้นครั้งก่อน', opts: [], yes: () => 0.95 },
    rptp: { n: 'รับทราบรายงานผลการดำเนินงานประจำปีของบริษัท', opts: [], info: true },
    divp: { n: 'จัดสรรกำไรและจ่ายเงินปันผล', opts: [0, 0.3, 0.5, 0.7].map(v => ({ v, l: v ? `จ่ายปันผล ${pct(v)} ของกำไรที่จ่ายได้` : 'งดจ่ายปันผล เก็บกำไรไว้ขยายกิจการ' })), yes: o => 0.4 + 0.5 * (o.v || 0) },
    dirr: { n: 'เลือกตั้งกรรมการแทนผู้ที่ครบวาระ', opts: [], yes: () => 0.8 },
    dpay: { n: 'กำหนดค่าตอบแทนกรรมการ', opts: [0, 5000, 10000, 15000, 20000, 30000, 50000, 80000].map(v => ({ v, l: v ? `ค่าตอบแทน ${baht0(v)} ต่อกรรมการต่อเดือน` : 'ไม่จ่ายค่าตอบแทนกรรมการ' })), yes: o => (o.v ? 0.75 : 0.85) },
    bylaw: { n: 'แก้ไขข้อบังคับบริษัท', opts: [], yes: () => 0.55 },
    minb: { n: 'รับรองรายงานการประชุมคณะกรรมการครั้งก่อน', opts: [], yes: () => 0.95 },
    perfb: { n: 'รับทราบผลการดำเนินงานและรายงานฝ่ายบริหาร', opts: [], info: true },
    qfin: { n: 'อนุมัติงบการเงินรอบปิดงบ', opts: [], yes: () => 0.9 },
    riskr: { n: 'ทบทวนการบริหารความเสี่ยงและแผนฉุกเฉิน', opts: [], yes: () => 0.8 },
    budget: { n: 'อนุมัติงบประมาณประจำปี', opts: [], yes: () => 0.75 },
    ins: { n: 'อนุมัติให้ซื้อประกันภัยบริษัท (เลือกแพ็กเกจและบริษัทประกันที่หน้าบริษัท)', opts: [], yes: () => 0.7 },
    ctrl: { n: 'อนุมัติให้ตั้งระบบควบคุมภายในและตรวจสอบภายใน (เลือกมาตรการที่หน้าบริษัท)', opts: [], yes: () => 0.7 },
    credit: { n: 'อนุมัติวงเงินสินเชื่อธนาคาร', opts: [1e6, 3e6].map(v => ({ v, l: `กู้ ${baht0(v)} (ดอกเบี้ย 1.2% ต่อรอบปิดงบ)` })), yes: () => 0.5 },
    repay: { n: 'ชำระคืนเงินกู้', opts: [], yes: () => 0.8 },
    cg: { n: 'นโยบายบรรษัทภิบาลและจรรยาบรรณ', opts: [], yes: () => 0.85 },
    csr: { n: 'อนุมัติงบ CSR และกิจกรรมชุมชน (50,000 ฿)', opts: [], yes: () => 0.7 },
    mkt: { n: 'อนุมัติงบการตลาด (100,000 ฿)', opts: [], yes: () => 0.65 },
    divrec: { n: 'เสนอนโยบายปันผลต่อที่ประชุมผู้ถือหุ้น', opts: [0.3, 0.5, 0.7].map(v => ({ v, l: `เสนอจ่ายปันผล ${pct(v)} ของกำไรที่จ่ายได้` })), yes: () => 0.75 },
    agmcall: { n: 'กำหนดวันและวาระประชุมสามัญผู้ถือหุ้น', opts: [], yes: () => 0.9 },
  });
  const NOOPT = new Set(['ctsign_', 'minp', 'rptp', 'dirr', 'bylaw', 'minb', 'perfb', 'qfin', 'riskr', 'budget', 'ins', 'ctrl', 'repay', 'cg', 'csr', 'mkt', 'agmcall']);
  const routineAgm = c => { const L = [{ t: 'minp', v: 1 }, { t: 'rptp', v: 1 }, { t: 'agm', v: 1 }, { t: 'divp', v: c.divRec == null ? 0.5 : c.divRec }]; const B = (c.board || []).slice().sort((a, b) => (a.since || 0) - (b.since || 0)); if (B.length) L.push({ t: 'dirr', v: 1, who: B[0].n }); L.push({ t: 'dpay', v: c.dfee || 0 }, { t: 'aud', v: c.audFee || 60000, who: c.aud || 'สำนักงานบัญชีขนาดเล็ก' }); return L; };
  // v234: the standing agenda of EVERY board meeting (added automatically unless "ไม่ใส่วาระประจำ" is chosen):
  //   minutes, performance report, accounts, annual budget, risk review, repay loan (only if there is one) and an approval for EVERY pending customer contract of 1,000,000 baht or more
  const routineBoard = c => {
    const L = [{ t: 'minb', v: 1 }, { t: 'perfb', v: 1 }, { t: 'qfin', v: 1 }, { t: 'budget', v: 1 }, { t: 'riskr', v: 1 }];
    if ((c.loan || 0) > 0) L.push({ t: 'repay', v: 1 });
    try { for (const d of (c.board || []).filter(d => !d.execK && S.day - (d.since == null ? S.day : d.since) >= (A.TERM || 252)).slice(0, 3)) L.push({ t: 'dirr', v: 1, who: d.n }); } catch (e) { }   // v234: directors whose 3-year term has ended stand for re-election
    try { for (const x of offersOf(c).filter(q => (q.value || 0) >= BIGCT && !q.boardOK)) L.push({ t: 'ctsign', v: x.id, who: `${x.title} — ${x.cust} (${baht0(x.value || 0)})` }); } catch (e) { }
    return L;
  };
  // the standard agenda of the board: 8 points, each connected to a part of the company's real data
  A.AGN = {
    1: { n: 'เรื่องที่ประธานแจ้งให้ที่ประชุมทราบ', k: 'รับทราบ' }, 2: { n: 'รับรองรายงานการประชุมครั้งที่ผ่านมา', k: 'พิจารณารับรอง' },
    3: { n: 'ติดตามผลการดำเนินงานตามมติครั้งก่อน', k: 'รับทราบ/พิจารณา' }, 4: { n: 'รายงานผลประกอบการและสถานะทางการเงิน', k: 'รับทราบ/พิจารณา' },
    5: { n: 'พิจารณาแผนธุรกิจ งบประมาณ และการลงทุน', k: 'พิจารณาอนุมัติ' }, 6: { n: 'พิจารณาการบริหารงานและเรื่องสำคัญของบริษัท', k: 'พิจารณาอนุมัติ' },
    7: { n: 'รายงานความเสี่ยง การตรวจสอบ และการกำกับดูแล', k: 'รับทราบ/พิจารณา' }, 8: { n: 'เรื่องอื่น ๆ (ถ้ามี)', k: 'พิจารณา' },
  };
  const AGB = { minb: 2, perfb: 4, qfin: 4, budget: 5, expand: 5, branch: 5, closebr: 5, credit: 5, repay: 5, mkt: 5, ctsign: 6, mgr: 6, bonus: 6, divrec: 6, agmcall: 6, cg: 6, csr: 6, riskr: 7, ctrl: 7, ins: 7 };
  A.agOf = t => AGB[t] || 6;
  // v234: how likely the directors are to approve a contract depends on the contract itself: unmet requirements, heavy SLA, cost ratio, size against the cash on hand
  const ctOffer = (c, id) => { try { return Contracts207.st(c).offers.list.find(q => q.id === +id); } catch (e) { return null; } };
  const ctScore = (c, o) => {
    let p = 0.7; if (!c || !o) return p;
    try { const miss = Contracts207.reqAll(c, o.reqs || []).filter(r => !r[0]).length; p += miss ? -0.17 * Math.min(3, miss) : 0.06; } catch (e) { }
    if ((o.sla || 0) >= 99) p -= 0.06;
    if ((o.cost || 0.5) > 0.6) p -= 0.1; else if ((o.cost || 0.5) < 0.4) p += 0.08;
    if ((o.value || 0) > Math.max(1, c.cash || 0) * 2) p -= 0.08;
    return clamp(p, 0.1, 0.92);
  };
  A.ctScore = ctScore;
  K.AG.ctsign = { n: 'อนุมัติรับสัญญาลูกค้ารายใหญ่', opts: [], yes: it => { const c = A.cur && A.cur.f && A.cur.f.c; return ctScore(c, c && ctOffer(c, it.v)); } };
  // v234: a board meeting that carries a contract must happen before the offer expires, and a deferred contract is not pushed past its expiry
  const ctExp = (c, L) => { let e = Infinity; for (const it of L) if (it.t === 'ctsign') { const o = ctOffer(c, it.v); if (o) e = Math.min(e, o.exp); } return e; };
  A.deferDay = (m, items) => { const c = Company.get(+String(m.key).slice(3)), e = c ? ctExp(c, items) : Infinity; return Math.max(S.day + 1, Math.min(S.day + 7, e)); };
  const BIGCT = 1000000;
  A.labEx = (m, it) => {
    const w = it.who || '';
    if (NOOPT.has(it.t)) return K.AG[it.t].n + (w ? ': ' + w : '');
    if (it.t === 'dir') return `แต่งตั้ง ${w} เป็นกรรมการบริษัท`;
    if (it.t === 'aud') return `แต่งตั้งผู้สอบบัญชี: ${w} (ค่าตรวจ ${baht0(it.v)})`;
    if (it.t === 'branch') return `เปิดสาขาใหม่: ${(CO_SITES[w] || {}).n || w}`;
    if (it.t === 'closebr') { const c = m.key.startsWith('co:') ? Company.get(+m.key.slice(3)) : null, b = c && (c.br || []).find(x => x.id === +it.v); return `ปิดสาขา: ${b ? b.name : it.v}`; }
    if (it.t === 'ctsign') return `อนุมัติรับสัญญา: ${w}`;
    if (it.t === 'newholder' && w) return `รับ ${w} เป็นผู้ถือหุ้นใหม่ ${Math.round((it.pct || 0) * 100)}% (ชำระเข้าบริษัท ${baht0(it.price || 0)})`;
    return null;
  };

  // ---------- the board ----------
  const mood0 = c => clamp(55 + (c.ytd > 0 ? 6 : -6) + rnd(-6, 8), 25, 82);
  const board = c => { if (!Array.isArray(c.board)) { c.board = []; if (c.partner) c.board.push({ n: c.partner, role: 'dir', mood: mood0(c), since: S.day - 100 }); } return c.board; };
  A.boardH = k => {
    const f = A.facts(k); if (!f || !f.co) return null; const B = board(f.c), N = B.length + 1;
    return { f, me: 1 / N, list: B.map(d => ({ n: d.n, k: 'dir', p: 1 / N, ref: d })) };
  };

  // ---------- people who may become directors / shareholders ----------
  // v241: people who may be asked onto the board: outside holders already in the register (never a serving officer) and independent professionals (v241_investors.js) - no more villagers or friends
  function cands(c) {
    const L = [], seen = new Set(), inBoard = new Set((c.board || []).map(d => d.n)), inReg = new Set((c.reg || []).map(h => h.n));
    const add = (n, src, lv) => { n = String(n || '').trim(); if (!n || seen.has(n) || n === 'ผู้เล่น') return; seen.add(n); L.push({ n, lv: lv || 0, src, wealth: Math.round(priceFor(c, 0.25)), holder: inReg.has(n), director: inBoard.has(n) }); };
    for (const h of (c.reg || [])) if (h.p > 0.0005 && !h.serving && h.k !== 'fund' && h.k !== 'ret') add(h.n, h.prof || 'ผู้ถือหุ้น', 5);
    for (const p of (window.Inv241 ? Inv241.dirPool(c) : [])) add(p.n, p.prof, p.lv);
    return L.slice(0, 12);
  }
  const value = c => Math.max(c.paid || 0, (c.cash || 0) * 0.5) + Math.max(0, c.ytd || 0) * 4;
  const priceFor = (c, pct) => Math.round(value(c) * pct / (1 - pct) * 0.9);

  // ---------- applying the new decisions ----------
  A.applyEx = (m, it) => {
    if (!m.key.startsWith('co:')) return null;
    const c = Company.get(+m.key.slice(3)); if (!c) return null; const w = it.who;
    if (it.t === 'dir') {
      const B = board(c); if (B.length >= MAXDIR) return 'คณะกรรมการเต็ม (สูงสุด ' + (MAXDIR + 1) + ' คนรวมประธาน)'; if (B.some(d => d.n === w)) return w + ' เป็นกรรมการอยู่แล้ว';
      B.push({ n: w, role: 'dir', mood: 60, since: S.day }); return `${w} เข้าเป็นกรรมการบริษัท (กรรมการ ${B.length + 1} คนรวมประธาน)`;
    }
    if (it.t === 'aud') { if (c.cash < it.v) return 'เงินบริษัทไม่พอจ่ายค่าตรวจบัญชี'; c.cash -= it.v; Company.book(c, 0, it.v); c.aud = w; c.audFee = it.v; c.rep = Math.min(100, (c.rep || 50) + (it.v >= 200000 ? 5 : 2)); return `แต่งตั้ง ${w} เป็นผู้สอบบัญชี ชื่อเสียง +${it.v >= 200000 ? 5 : 2}`; }
    if (it.t === 'newholder' && w) {
      const mine = c.mine == null ? 1 : c.mine, pct = it.pct || 0; if (mine * (1 - pct) < 0.2) return 'สัดส่วนของคุณจะต่ำกว่า 20% จึงไม่ออกหุ้น';
      A.reg(c); c.reg.forEach(h => h.p *= (1 - pct)); c.mine = mine * (1 - pct); c.reg.push({ n: w, k: 'inv', p: pct, mood: 72 });
      c.cash += it.price; c.paid = (c.paid || 0) + it.price; c.cap = Math.max(c.cap || 0, c.paid); c.pend = (c.pend || []).filter(p => p.who !== w);
      Phone.msg(w, `ขอบคุณที่รับผมเป็นผู้ถือหุ้นของ ${c.name} ${Math.round(pct * 100)}% ผมจะตั้งใจดูแลธุรกิจร่วมกัน`, true);
      return `${w} เป็นผู้ถือหุ้นใหม่ ${Math.round(pct * 100)}% ชำระเข้าบริษัท ${baht0(it.price)} (สัดส่วนคุณเหลือ ${Math.round(c.mine * 100)}%)`;
    }
    if (it.t === 'branch') { const n0 = (c.br || []).length; try { Branch214.open(c, w); } catch (e) { } return (c.br || []).length > n0 ? 'เปิดสาขาใหม่ตามมติบอร์ด' : 'เปิดสาขาไม่สำเร็จ (เงินหรือเงื่อนไขไม่ครบ)'; }
    if (it.t === 'closebr') { try { Branch214.close(c, it.v); } catch (e) { } return 'ปิดสาขาตามมติบอร์ด'; }
    if (it.t === 'bonus') {
      const pay = (c.staff || []).reduce((s, x) => s + (x.sal || 0), 0); if (!pay) return 'ไม่มีพนักงานให้จ่ายโบนัส'; if (c.cash < pay + 100000) return 'เงินบริษัทไม่พอจ่ายโบนัส';
      c.cash -= pay; Company.book(c, 0, pay); c.rep = Math.min(100, (c.rep || 50) + 3); return `จ่ายโบนัสพนักงาน ${baht0(pay)} ขวัญกำลังใจดีขึ้น ชื่อเสียง +3`;
    }
    const rep = n => { c.rep = Math.min(100, (c.rep == null ? 50 : c.rep) + n); }, spend = n => { if (c.cash < n + 50000) return false; c.cash -= n; Company.book(c, 0, n); return true; };
    const dm = n => board(c).forEach(d => { d.mood = clamp((d.mood == null ? 50 : d.mood) + n, 5, 98); }), rm = n => (c.reg || []).forEach(h => { h.mood = clamp((h.mood == null ? 50 : h.mood) + n, 5, 98); });
    if (it.t === 'ctsign') { const o = window.Contracts207 && Contracts207.st(c).offers.list.find(q => q.id === +it.v); if (!o) return 'ข้อเสนอสัญญานี้หมดอายุแล้ว'; o.boardOK = S.day; o.exp = Math.max(o.exp, S.day + 3); return `บอร์ดอนุมัติให้รับสัญญา "${o.title}" แล้ว ไปที่ "สัญญาลูกค้า" เพื่อลงนามภายในวันที่ ${o.exp} (เหลือ ${o.exp - S.day} วัน)`; }
    switch (it.t) {
      case 'minp': case 'minb': return 'รับรองรายงานการประชุมครั้งก่อนแล้ว';
      case 'qfin': rep(1); return 'อนุมัติงบการเงินรอบปิดงบ';
      case 'divp': {
        const room = (window.Biz212 && Biz212.distributable) ? Biz212.distributable(c) : Math.max(0, Math.round(c.cash - (c.paid || 0) - 100000)), amt = Math.round(room * (it.v || 0));
        if (!it.v) { rm(-1); return 'งดจ่ายปันผล เก็บกำไรไว้ในบริษัท'; } if (amt <= 0) return 'ไม่มีกำไรสะสมที่จ่ายปันผลได้';
        c.cash -= amt; const my = Math.round(amt * Math.min(0.99, c.mine == null ? 1 : c.mine) * 0.9); if (my > 0) { earn(my); try { Bank2.income('เงินปันผล ' + c.name + ' (หัก 10%)', my); } catch (e) { } } rm(6); return `จ่ายปันผล ${baht0(amt)} (คุณได้รับ ${baht0(my)} หลังหักภาษี 10%) ผู้ถือหุ้นพอใจ`;
      }
      case 'dirr': { const d = board(c).find(x => x.n === w); if (!d) return 'ไม่พบกรรมการ'; d.since = S.day; d.mood = clamp((d.mood || 50) + 8, 5, 98); return `${w} ได้รับเลือกตั้งกลับเข้าเป็นกรรมการอีกวาระ`; }
      case 'dpay': c.dfee = it.v || 0; dm(c.dfee ? 8 : -6); return c.dfee ? `กำหนดค่าตอบแทนกรรมการ ${baht0(c.dfee)} ต่อคนต่อเดือน (จ่ายทุกรอบปิดงบ)` : 'ไม่จ่ายค่าตอบแทนกรรมการ (กรรมการไม่ค่อยพอใจ)';
      case 'bylaw': rep(1); return 'แก้ไขข้อบังคับบริษัทเรียบร้อย';
      case 'riskr': c.riskplan = S.day; rep(2); return 'รับรองแผนบริหารความเสี่ยงและแผนฉุกเฉิน ชื่อเสียง +2';
      case 'budget': c.bud = S.day; rep(2); return 'อนุมัติงบประมาณประจำปี ชื่อเสียง +2';
      case 'ins': { const r = Risk243.R(c); r.insAuth = S.day; rep(1); return 'บอร์ดอนุมัติให้ซื้อประกันภัยบริษัทแล้ว (ใช้ได้ 1 ปี) ไปเลือกบริษัทประกันและแพ็กเกจที่หน้าบริษัท > ใบอนุญาต/ระบบ/ทรัพย์สิน > ประกันภัยบริษัท'; }
      case 'ctrl': { const r = Risk243.R(c); r.ctrlAuth = S.day; rep(1); return 'บอร์ดอนุมัติให้ตั้งระบบควบคุมภายในแล้ว (ใช้ได้ 1 ปี) ไปเลือกมาตรการที่หน้าบริษัท > ใบอนุญาต/ระบบ/ทรัพย์สิน > ระบบควบคุมภายในบริษัท'; }
      case 'credit': c.loan = (c.loan || 0) + it.v; c.cash += it.v; return `ได้วงเงินกู้ ${baht0(it.v)} หนี้สินรวม ${baht0(c.loan)} (ดอกเบี้ยจ่ายทุกรอบปิดงบ)`;
      case 'repay': { const pay = Math.min(c.loan || 0, Math.max(0, Math.round(c.cash - 150000))); if (pay <= 0) return 'ไม่มีหนี้หรือเงินสดไม่พอชำระ'; c.loan -= pay; c.cash -= pay; return `ชำระคืนเงินกู้ ${baht0(pay)} คงเหลือหนี้ ${baht0(c.loan)}`; }
      case 'cg': rep(2); dm(5); c.cgDay = S.day; return 'รับรองนโยบายบรรษัทภิบาลและจรรยาบรรณ ชื่อเสียง +2';
      case 'csr': if (!spend(50000)) return 'เงินบริษัทไม่พอ'; rep(3); return 'อนุมัติงบ CSR ชื่อเสียง +3';
      case 'mkt': if (!spend(100000)) return 'เงินบริษัทไม่พอ'; rep(4); return 'อนุมัติงบการตลาด ชื่อเสียง +4';
      case 'divrec': c.divRec = it.v; return `เสนอนโยบายปันผล ${pct(it.v)} ต่อที่ประชุมสามัญผู้ถือหุ้น`;
      case 'agmcall': { if (!A.agmOK(c)) return 'ประชุมสามัญผู้ถือหุ้นจัดได้เฉพาะบริษัทมหาชนจำกัด (ยังไม่ได้จดทะเบียนในตลาดหลักทรัพย์)'; const m2 = K.mk('co:' + c.id, routineAgm(c), S.day + 7, 'me'); m2.kind = 'agm'; return 'กำหนดประชุมสามัญผู้ถือหุ้นในอีก 7 วัน'; }
    }
    return null;
  };

  A.failEx = (m, it) => {
    if (it.t === 'dirr' && m.key.startsWith('co:')) { const c = Company.get(+m.key.slice(3)); if (!c) return ''; const B = board(c), i = B.findIndex(x => x.n === it.who); if (i >= 0) { B.splice(i, 1); c.noRejoin = c.noRejoin || {}; c.noRejoin[it.who] = S.day + 28; if (c.chair === it.who) c.chair = null; return `${it.who} ไม่ได้รับเลือกตั้ง พ้นจากตำแหน่งกรรมการ`; } }
    return '';
  };
  A.infoEx = (m, it, f) => {
    if (!f) return ''; const c = f.c;
    if (it.t === 'rptp' || it.t === 'perfb') return `กำไรสะสมปีนี้ ${baht0(Math.round(f.ytd))} · เงินสดบริษัท ${baht0(Math.round(f.cash))} · ชื่อเสียง ${Math.round(f.rep)}/100 · พนักงาน ${f.staff} คน${f.branches ? ` · ${f.branches} สาขา` : ''}${c && c.loan ? ` · หนี้เงินกู้ ${baht0(c.loan)}` : ''}${f.listed ? ' · จดทะเบียนในตลาดหลักทรัพย์' : ''}`;
    return '';
  };
  A.factsEx = f => { const c = f.c; if (c) Object.assign(f, { ins: !!c.insured, ctrl: !!c.ctrl, aud: !!c.aud, bud: !!c.bud, loan: c.loan || 0, dfee: c.dfee || 0, risk: !!c.riskplan }); else Object.assign(f, { ins: true, ctrl: true, aud: true, bud: true, loan: 0, dfee: 0, risk: true }); return f; };
  // loan interest and directors' fees come out of the company account at every monthly close
  { const _w = Company.week; Company.week = function () {
    const r = _w.apply(this, arguments);
    try { for (const c of Company.list()) { if (!['setup', 'open'].includes(c.st)) continue; const it = Math.round((c.loan || 0) * 0.012), fee = (c.dfee || 0) * (A.feeCount ? A.feeCount(c) : (c.board || []).length); if (it + fee > 0) { c.cash -= it + fee; Company.book(c, 0, it + fee); if (fee > 0 && A.feeIncome) A.feeIncome(c, 1); } } } catch (e) { console.warn('v217 week', e); }
    return r;
  }; }

  // ---------- questions the directors ask ----------
  const bq = (id, when, text, opts) => A.Q.push({ id, grp: 'all', who: 'bd', cond: !!when, when: when || (() => true), text, o: opts });
  bq('b_cf', null, 'งบกระแสเงินสดสามเดือนข้างหน้าเป็นอย่างไร มีเดือนไหนที่เงินสดจะตึงหรือไม่?', [['นำเสนอประมาณการกระแสเงินสดรายเดือนพร้อมแผนสำรอง', 6, f => f.cash >= 300000], ['ตัวเลขยังไม่ได้ทำละเอียด แต่คาดว่าไม่มีปัญหา', -4], ['ขอให้บอร์ดอนุมัติวงเงินกู้สำรองไว้ก่อน', 1]]);
  bq('b_cust', null, 'ลูกค้ารายใหญ่ที่สุดคิดเป็นกี่เปอร์เซ็นต์ของรายได้ มีความเสี่ยงพึ่งพาลูกค้ารายเดียวไหม?', [['ไม่เกิน 25% และกำลังหาลูกค้ารายใหม่เพิ่ม', 6], ['ลูกค้ารายใหญ่ 2 รายเป็นรายได้เกินครึ่ง', -3], ['ไม่เคยแยกดูตัวเลขนี้', -6]]);
  bq('b_price', null, 'นโยบายตั้งราคาเทียบคู่แข่งเป็นอย่างไร กำไรขั้นต้นต่อหน่วยลดลงหรือไม่?', [['ตั้งราคาจากต้นทุนบวกส่วนเพิ่มที่ชัดเจน และทบทวนทุกไตรมาส', 5], ['ลดราคาเพื่อรักษาลูกค้า', -2], ['ใช้ราคาเดิมมาหลายปีแล้ว', -4]]);
  bq('b_people', null, 'ตำแหน่งสำคัญมีคนทำแทนกันได้หรือไม่ และเงินเดือนเทียบตลาดแล้วเป็นอย่างไร?', [['มีคู่มือและผู้ช่วยสำรองสำหรับทุกตำแหน่งสำคัญ', 6, f => f.staff >= 2], ['พนักงานบางคนรู้งานอยู่คนเดียว', -4], ['จะจ้างเพิ่มเมื่อมีงบ', 0]]);
  bq('b_ctrl', null, 'ระบบควบคุมภายใน: ใครเบิกจ่ายเงินได้บ้าง มีการตรวจสอบสองชั้นไหม?', [['ผู้เบิกกับผู้อนุมัติเป็นคนละคน และมีตรวจบัญชีรายเดือน', 7, f => f.vat], ['เจ้าของอนุมัติเองทุกรายการ', -3], ['ยังไม่มีระเบียบเป็นลายลักษณ์อักษร', -7]]);
  bq('b_ins', null, 'ความเสี่ยงไฟไหม้ น้ำท่วม ขโมย มีประกันคุ้มครองทรัพย์สินหรือไม่?', [['มีประกันอัคคีภัยและโจรกรรมครอบคลุมทรัพย์สินหลัก', 7], ['มีบางส่วน กำลังเปรียบเทียบเบี้ยประกัน', 1], ['ยังไม่มี ถือเป็นความเสี่ยงที่รับได้', -6]]);
  bq('b_lic', null, 'ใบอนุญาตและทะเบียนของบริษัทหมดอายุเมื่อไร มีผู้รับผิดชอบติดตามไหม?', [['มีปฏิทินกำกับดูแลและผู้รับผิดชอบทุกใบอนุญาต', 6, f => f.vat], ['ยังไม่ได้ทำตาราง', -4], ['ให้นักบัญชีเตือนเมื่อใกล้หมดอายุ', 1]]);
  bq('b_roi', null, 'โครงการลงทุนใหม่คืนทุนกี่ปี ถ้ายอดขายต่ำกว่าแผน 30% จะเป็นอย่างไร?', [['ทำ 3 สถานการณ์ (ดี/กลาง/แย่) และกำหนดจุดตัดขาดทุน', 7], ['คาดว่ายอดขายจะเป็นไปตามแผน', -4], ['คืนทุนภายใน 2 ปีแน่นอน', 4, f => f.ytd > 1500000]]);
  bq('b_sup', null, 'ซัพพลายเออร์หลักมีรายเดียวหรือหลายราย ถ้าเขาขึ้นราคาหรือส่งของช้าจะทำอย่างไร?', [['มีซัพพลายเออร์สำรองอย่างน้อยหนึ่งราย', 6], ['พึ่งรายเดียวเพราะได้ราคาดี', -3], ['เจรจาสัญญาระยะยาวล็อกราคา', 3]]);
  bq('b_it', null, 'ข้อมูลบริษัทสำรองไว้และกู้คืนได้ถ้าระบบเสียหรือไม่?', [['สำรองอัตโนมัติทุกวันและทดสอบกู้คืนทุกไตรมาส', 6, f => f.ups], ['สำรองเองเป็นครั้งคราว', -2], ['ยังไม่เคยสำรอง', -8]]);
  bq('b_var', null, 'ผลงานจริงเทียบงบประมาณที่อนุมัติไว้ต่างกันเท่าไร สาเหตุหลักคืออะไร?', [['ส่งรายงานเปรียบเทียบงบจริงกับแผนทุกเดือนพร้อมสาเหตุ', 6], ['ยังไม่ได้ตั้งงบประมาณ', -6], ['ต่างกันเล็กน้อย ไม่น่ากังวล', 0]]);
  bq('b_str', null, 'ภาพของบริษัทในอีก 3 ปีข้างหน้าเป็นอย่างไร ยุทธศาสตร์หลักคืออะไร?', [['ตั้งเป้ายอดขายและส่วนแบ่งตลาดพร้อมตัวชี้วัดรายไตรมาส', 6], ['เติบโตตามโอกาสที่เข้ามา', -2], ['ยังไม่ได้วางแผนระยะยาว', -6]]);
  bq('b_bonus', null, 'ขวัญกำลังใจพนักงาน จะมีโบนัสหรือสวัสดิการเพิ่มหรือไม่ ถ้ากำไรไม่ถึงเป้า?', [['โบนัสผูกกับกำไร ถ้าไม่ถึงเป้าลดตามสัดส่วน', 5], ['จ่ายโบนัสเต็มทุกปีไม่ว่ากำไรเป็นอย่างไร', 3, f => f.ytd > 0], ['งดโบนัสทั้งหมด', -4]]);
  bq('b_branch', f => f.branches > 0, 'สาขาที่ขาดทุนต่อเนื่อง บอร์ดควรตัดสินใจอย่างไร?', [['ตั้งเกณฑ์ ถ้าขาดทุนสองรอบติดให้ปรับปรุงหรือปิดสาขา', 6], ['ให้เวลาอีกหนึ่งปีโดยไม่ตั้งเงื่อนไข', -3], ['ปิดทันทีเมื่อขาดทุนครั้งแรก', 0]]);
  bq('b_law', null, 'มีข้อพิพาทกับลูกค้าหรือพนักงานที่อาจเป็นคดีหรือไม่ ได้ปรึกษาที่ปรึกษากฎหมายหรือยัง?', [['ไม่มีข้อพิพาท และมีทนายตรวจสัญญาก่อนลงนาม', 5, f => f.vat], ['มีบางกรณี กำลังเจรจา', 0], ['ไม่เคยให้ทนายตรวจสัญญา', -6]]);

  // the checks of some earlier questions now follow what the board really decided
  for (const [id, fn] of [['audit', f => f.aud], ['b_ins', f => f.ins], ['b_ctrl', f => f.ctrl], ['b_var', f => f.bud], ['power', f => f.ups]]) { const x = A.Q.find(y => y.id === id); if (x && x.o[0]) x.o[0][2] = fn; }

  // a big customer contract and a new branch need a decision of the board (agenda point 6 / 5)
  { const _s = UI.H.ctsign; if (_s) UI.H.ctsign = function (d) {
    try { const c = Company.get(d.v), o = c && Contracts207.st(c).offers.list.find(q => q.id == d.i); if (o && (o.value || 0) >= BIGCT && !o.boardOK) { UI.toast(`สัญญามูลค่า ${baht0(o.value)} เกิน ${baht0(BIGCT)} ต้องผ่านมติคณะกรรมการ (วาระที่ 8 จัดซื้อและสัญญาธุรกิจ) ก่อนลงนาม${A.boardOK(c) ? '' : ' · ตอนนี้บอร์ดยังนัดประชุมไม่ได้ กด "เจ้าของอนุมัติทันที" ได้'}`, '👔'); return; } } catch (e) { }
    return _s.apply(this, arguments);
  }; }
  // v237: while the board cannot meet yet (fewer than the minimum people or fewer than 3 voters) the owner may approve a big contract directly, like a new-shareholder offer; once the board can meet it must go through a board vote
  UI.H.ctown = function (d) {
    const c = Company.get(d.v), o = c && Contracts207.st(c).offers.list.find(q => q.id == d.i); if (!o) return;
    if ((o.value || 0) < BIGCT || o.boardOK) { UI.toast('สัญญานี้ไม่ต้องขอมติบอร์ด', '👔'); return; }
    if (A.boardOK(c)) { UI.toast('บอร์ดครบแล้ว ต้องนำเข้าที่ประชุมบอร์ด (วาระที่ 8)', '👔'); return; }
    o.boardOK = S.day; o.exp = Math.max(o.exp, S.day + 3);
    UI.toast(`เจ้าของอนุมัติรับสัญญา "${o.title}" แล้ว ลงนามได้ภายในวันที่ ${o.exp}`, '✅'); try { UI.renderBody(); } catch (e) { }
  };
  { const _ch = Company.html.bind(Company); Company.html = t => {
    let s = _ch(t);
    if (t === 1 || t === 3 || typeof s !== 'string') return s;
    return s.replace(/<button class="btn[^"]*" data-a="ctsign" data-v="(\d+)" data-i="(\d+)">✍️ ดูสัญญาและลงนาม<\/button>/g, (m0, cid, oid) => {
      try { const c = Company.get(cid), o = c && Contracts207.st(c).offers.list.find(q => q.id == oid); if (o && (o.value || 0) >= BIGCT && !o.boardOK && !A.boardOK(c)) return m0 + `<button class="btn" data-a="ctown" data-v="${cid}" data-i="${oid}">✅ เจ้าของอนุมัติทันที (บอร์ดยังประชุมไม่ได้)</button>`; } catch (e) { }
      return m0;
    });
  }; }
  { const _b = UI.H.br214open; if (_b) UI.H.br214open = function (d) { UI.toast('การเปิดสาขาต้องผ่านมติคณะกรรมการ (วาระที่ 9 โครงการลงทุน) นัดประชุมบอร์ดแล้วเพิ่มวาระ "เปิดสาขา"', '👔'); }; }
  // minutes of the last meetings (the base of agenda points 2 and 3)
  A.onDone = (m, res) => { if (!m.key.startsWith('co:')) return; const c = Company.get(+m.key.slice(3)); if (!c) return; const rows = res.filter(x => !x.info).map(x => ({ txt: x.txt, pass: x.pass, out: x.out || '' })); c[m.kind === 'board' ? 'bmin' : 'amin'] = { day: S.day, rows }; };

  // ---------- agenda points: the information panel of each point, from the real books ----------
  const card = (title, body) => `<div class="card"><div class="cb"><h4>${title}</h4>${body}</div></div>`;
  const ul = L => `<ul class="lead">${L.map(x => `<li>${x}</li>`).join('')}</ul>`;
  const roleName = r => (typeof ROLES !== 'undefined' && ROLES[r] ? ROLES[r].n : r);
  const staffBy = c => { const m = {}; for (const x of (c.staff || [])) m[x.r] = (m[x.r] || 0) + 1; return m; };
  const typeKpi = c => {
    const T = CO_TYPES[c.type] || {}, sb = staffBy(c), L = [];
    L.push('พนักงาน: ' + (Object.keys(sb).map(r => `${roleName(r)} ${sb[r]}`).join(', ') || 'ยังไม่มี') + ` (เงินเดือนรวม ${baht0((c.staff || []).reduce((a, x) => a + (x.sal || 0), 0))}/เดือน)`);
    const eq = Object.entries(c.eq || {}).filter(([, n]) => n > 0).map(([k, n]) => `${(typeof CO_EQ !== 'undefined' && CO_EQ[k] ? CO_EQ[k].n.split(' ')[0] : k)} ×${n}`);
    if (eq.length) L.push('อุปกรณ์/ทรัพย์สิน: ' + eq.join(', '));
    try { const d = Sec.site('co:' + c.id).dev; if (d.length) L.push(`ระบบเครือข่ายในสถานที่: ${d.length} ชิ้น`); } catch (e) { }
    if (c.net && typeof BIZ_NET !== 'undefined' && BIZ_NET[c.net]) L.push('อินเทอร์เน็ต: ' + BIZ_NET[c.net].n);
    try { const n = (G.cars || []).filter(o => ['truckflat', 'pickup', 'van', 'deliveryflat'].includes(o.d.type)).length; if (n && (T.trucks || T.car)) L.push(`รถใช้งาน/ขนส่งของบริษัท ${n} คัน`); } catch (e) { }
    return L;
  };
  const failing = c => { try { return Company.checks(c).filter(x => !x[0]).map(x => x[1]); } catch (e) { return []; } };
  const offersOf = c => { try { return Contracts207.offers(c) || []; } catch (e) { return []; } };
  const BAD = /ไม่พอ|ไม่สำเร็จ|ไม่พบ|ไม่ออก|ไม่มี/;
  A.boardInfo = (n, SS) => {
    const c = SS.f && SS.f.c; if (!c) return '';
    const f = SS.f, T = CO_TYPES[c.type] || {}, bm = c.bmin, fl = failing(c), of = offersOf(c);
    if (n === 1) {
      const L = [`วันนี้ ${RD(S.day)} · ${T.i || ''} ${E(c.name)} (${E(T.n || '')})`];
      try { for (const e of (Biz212.X().mk.ev || [])) if (e.until >= S.day) L.push(`${e.ico} ${E(e.text)} (×${e.m}) ถึง ${RD(e.until)}`); L.push(`ตัวคูณตลาดของธุรกิจเรา ×${Biz212.mult(c.type).toFixed(2)}`); } catch (e) { }
      for (const p of (c.pend || [])) L.push(`🏡 ${E(p.who)} สนใจร่วมหุ้น ${Math.round(p.pct * 100)}% ราคา ${baht0(p.price)} รอเข้าที่ประชุมผู้ถือหุ้น`);
      for (const m of K.st().mt.filter(x => x.key === 'co:' + c.id && x.kind === 'agm' && (x.status === 'sched' || x.status === 'due'))) L.push(`🏛️ นัดประชุมผู้ถือหุ้นวันที่ ${RD(m.day)}`);
      L.push(`ข้อเสนอสัญญาลูกค้าที่รออยู่ ${of.length} ราย${of.some(o => (o.value || 0) >= BIGCT) ? ' (มีรายใหญ่ ต้องขอมติบอร์ด)' : ''}`);
      L.push(fl.length ? `⚠️ ข้อกำหนดการดำเนินงานที่ยังไม่ผ่าน ${fl.length} ข้อ (ดูวาระที่ 14)` : '✅ ข้อกำหนดการดำเนินงานผ่านครบ');
      return card('📢 ประธานแจ้งที่ประชุมทราบ', ul(L));
    }
    if (n === 2) return card('📝 รายงานการประชุมครั้งที่ผ่านมา', bm ? `<p class="dim">ประชุมคณะกรรมการ วันที่ ${RD(bm.day)}</p>${ul(bm.rows.map(x => `${x.pass ? '✅' : '❌'} ${E(x.txt)}`))}` : '<p class="dim">ยังไม่มีรายงานครั้งก่อน (นี่คือการประชุมคณะกรรมการครั้งแรก) ที่ประชุมจะลงมติรับรองรายงานนี้เป็นฉบับแรก</p>');
    if (n === 3) {
      if (!bm) return card('🔎 ติดตามมติครั้งก่อน', '<p class="dim">ยังไม่มีมติครั้งก่อนให้ติดตาม</p>');
      const row = x => { const st = !x.pass ? '❌ ไม่ผ่านมติ' : BAD.test(x.out) ? '⚠️ ติดปัญหา' : '✅ ดำเนินการแล้ว'; return `<tr><td>${E(x.txt)}</td><td>${st}</td><td class="dim">${E(x.out || '')}</td></tr>`; };
      return card('🔎 ติดตามผลตามมติครั้งก่อน (' + RD(bm.day) + ')', `<table class="tbl" style="width:100%"><tr><th>มติ</th><th>สถานะ</th><th>ผลที่เกิดขึ้น</th></tr>${bm.rows.map(row).join('')}</table>`);
    }
    if (n === 4) {
      const mon = (c.mon || []).slice(0, 3), ct = window.Contracts207 ? Contracts207.st(c) : { active: [] }, act = ct.active || [];
      const ret = act.filter(k => k.kind === 'ret').reduce((a, k) => a + (k.fee || 0), 0), prj = act.filter(k => k.kind !== 'ret').length, badc = act.filter(k => (k.bad || 0) > 0).length;
      let h = card('💰 ผลประกอบการและฐานะการเงิน', ul([`กำไรสะสมปีนี้ ${baht0(Math.round(f.ytd))} · เงินสดบริษัท ${baht0(Math.round(f.cash))} · ทุนชำระแล้ว ${baht0(c.paid || 0)}`, `หนี้เงินกู้ ${baht0(c.loan || 0)}${c.loan ? ` · ดอกเบี้ยรอบละ ${baht0(Math.round(c.loan * 0.012))}` : ''} · ค่าตอบแทนกรรมการ ${c.dfee ? baht0(c.dfee * (c.board || []).length) + '/เดือน' : 'ไม่จ่าย'}`, `สัญญาลูกค้ารายเดือน ${act.filter(k => k.kind === 'ret').length} ฉบับ รายได้ประจำ ${baht0(ret)}/เดือน · งานโครงการ ${prj} งาน${badc ? ` · <b>${badc} สัญญามีปัญหาผิดข้อตกลง</b>` : ''}`]) + (mon.length ? `<table class="tbl" style="width:100%"><tr><th>รอบปิดงบ</th><th>รายรับ</th><th>ต้นทุน/ค่าใช้จ่าย</th><th>เงินคงเหลือ</th></tr>${mon.map(m => `<tr><td>${RD(m.d)}</td><td>${baht0(m.rev)}</td><td>${baht0(m.cost)}</td><td>${baht0(m.close)}</td></tr>`).join('')}</table>` : '<p class="dim">ยังไม่มีรอบปิดงบ</p>'));
      const br = (c.br || []).filter(b => b.st === 'open');
      if (br.length) h += card('🏪 ผลรายสาขา', `<table class="tbl" style="width:100%"><tr><th>สาขา</th><th>รายรับรอบนี้</th><th>ค่าใช้จ่ายต่อรอบ</th><th>สถานะ</th></tr>${br.map(b => { let cost = 0; try { cost = Branch214.weekCost(c, b).total; } catch (e) { } return `<tr><td>${E(b.name)}</td><td>${baht0(b.rev || 0)}</td><td>${baht0(cost)}</td><td>${(b.rev || 0) >= cost * 0.8 ? '🙂' : '😟'}</td></tr>`; }).join('')}</table>`);
      return h + card('🧩 ปัจจัยหลักของธุรกิจ ' + E(T.n || ''), ul(typeKpi(c)));
    }
    if (n === 5) {
      let sites = 0; try { sites = Branch214.sitesFor(c).length; } catch (e) { }
      return card('🧭 แผนธุรกิจ งบประมาณ และการลงทุน', ul([`งบประมาณประจำปี: ${c.bud ? '✅ อนุมัติแล้ว (' + RD(c.bud) + ')' : '❌ ยังไม่ได้อนุมัติ'}`, `เงินที่ลงทุนได้โดยเหลือเงินสำรอง 150,000: ${baht0(Math.max(0, Math.round(f.cash - 150000)))} · หนี้ ${baht0(c.loan || 0)}`, `สาขา ${f.branches}/${Branch214 ? Branch214.MAXB : 4} แห่ง · ที่ตั้งที่เหมาะกับธุรกิจนี้ยังว่าง ${sites} แห่ง`, 'การเปิดสาขา กู้เงิน ขยายกิจการ และงบการตลาด ต้องผ่านมติในวาระนี้']));
    }
    if (n === 6) {
      const sb = staffBy(c), small = of.slice(0, 6);
      return card('👥 การบริหารงานและเรื่องสำคัญ', ul([`พนักงาน ${f.staff} คน: ${Object.keys(sb).map(r => `${roleName(r)} ${sb[r]}`).join(', ') || '-'} · กรรมการ ${(c.board || []).length + 1} คน`, `นโยบายปันผลที่เสนอผู้ถือหุ้น: ${c.divRec == null ? 'ยังไม่ได้เสนอ' : Math.round(c.divRec * 100) + '%'} · ผู้สอบบัญชี ${E(audName(c) || 'ยังไม่แต่งตั้ง')}`]) + (small.length ? `<p class="dim">ข้อเสนอสัญญาลูกค้าที่รออยู่</p><table class="tbl" style="width:100%"><tr><th>สัญญา</th><th>ลูกค้า</th><th>มูลค่ารวม</th><th>ต้องผ่านบอร์ด</th></tr>${small.map(o => `<tr><td>${E(o.title)}</td><td>${E(o.cust)}</td><td>${baht0(o.value || 0)}</td><td>${(o.value || 0) >= BIGCT ? (o.boardOK ? '✅ อนุมัติแล้ว' : '⚠️ ต้องขอมติ') : 'ไม่ต้อง'}</td></tr>`).join('')}</table>` : '<p class="dim">ยังไม่มีข้อเสนอสัญญาลูกค้า</p>'));
    }
    if (n === 7) {
      let sec = '';
      try { const S2 = Sec.status('co:' + c.id); sec = `ระบบเครือข่าย: ${S2.on ? '⚡ มีไฟ' : '🌑 ไม่มีไฟ'} · กล้อง ${S2.onCnt}/${S2.cams} ออนไลน์ · บันทึก ${S2.rec}${S2.days ? ' · เก็บย้อนหลัง ~' + S2.days.toFixed(1) + ' วัน' : ''} · กันขโมย ${S2.alarm ? '✅' : '❌'}`; } catch (e) { }
      const dark = (() => { try { return Company.dark(c.id); } catch (e) { return false; } })();
      return card('🛡️ ความเสี่ยง การตรวจสอบ และการกำกับดูแล', ul([`ประกันทรัพย์สิน ${c.insured ? '✅' : '❌'} · ระบบควบคุมภายใน ${c.ctrl ? '✅' : '❌'} · ผู้สอบบัญชี ${c.aud ? '✅ ' + E(audName(c)) : '❌ ยังไม่มี'} · แผนความเสี่ยง ${c.riskplan ? '✅' : '❌'} · จด VAT ${f.vat ? '✅' : '❌'}`, `ไฟฟ้าสำรอง/UPS ${f.ups ? '✅' : '❌'}${dark ? ' · ⚠️ ขณะนี้ไฟดับ' : ''}`, sec, fl.length ? `⚠️ ข้อกำหนดที่ยังไม่ผ่าน: ${fl.map(E).join(' · ')}` : '✅ ข้อกำหนดการเปิดดำเนินการผ่านครบ'].filter(Boolean)));
    }
    return card('🗣️ เรื่องอื่น ๆ', '<p class="dim">กรรมการสามารถเสนอเรื่องเพิ่มเติมและซักถามได้ในวาระนี้ ถ้าไม่มีเรื่องใดเสนอ ประธานจะสรุปมติและปิดการประชุม</p>');
  };

  // ---------- questions built from the real data of that company (each belongs to an agenda point) ----------
  A.dynQ = (n, SS) => {
    const c = SS.f && SS.f.c; if (!c) return []; const f = SS.f, L = [], bm = c.bmin, fl = failing(c), of = offersOf(c), mk = (id, text, o) => ({ id, text, o });
    if (n === 1 && (c.pend || []).length) { const p = c.pend[0]; L.push(mk('dy_pend', `ได้ทราบว่า ${p.who} สนใจร่วมหุ้น ${Math.round(p.pct * 100)}% ประธานจะนำเรื่องนี้เข้าที่ประชุมผู้ถือหุ้นเมื่อไร และราคาเหมาะสมหรือไม่?`, [['บรรจุเป็นวาระในที่ประชุมผู้ถือหุ้นครั้งถัดไป (มติพิเศษ ¾) พร้อมที่มาของราคา', 6], ['ยังไม่รีบ รอดูสถานการณ์ก่อน', -2], ['ตกลงกับเขาไว้แล้ว ไม่ต้องผ่านที่ประชุม', -8]])); }
    if (n === 3 && bm) { const x = bm.rows.find(r => !r.pass || BAD.test(r.out)); if (x) L.push(mk('dy_follow', `มติครั้งก่อนเรื่อง "${x.txt}" ${x.pass ? 'ติดปัญหา: ' + x.out : 'ไม่ผ่านมติ'} จะดำเนินการต่ออย่างไร?`, [['ตั้งผู้รับผิดชอบและกำหนดวันแล้วเสร็จใหม่ รายงานบอร์ดครั้งหน้า', 6], ['รอให้เงินสดพร้อมก่อนแล้วค่อยทำ', 1], ['เรื่องนี้ไม่สำคัญแล้ว ปล่อยไปก่อน', -6]])); }
    if (n === 4) {
      const mon = c.mon || [];
      if (mon.length >= 2 && mon[1].rev > 0) { const ch = (mon[0].rev - mon[1].rev) / mon[1].rev, up = ch >= 0; L.push(mk('dy_trend', `รายรับรอบปิดงบล่าสุด ${baht0(mon[0].rev)} ${up ? 'เพิ่มขึ้น' : 'ลดลง'} ${Math.abs(Math.round(ch * 100))}% จากรอบก่อน สาเหตุหลักคืออะไร?`, up ? [['วิเคราะห์ว่ามาจากสัญญาใหม่และลูกค้าประจำ จึงน่าจะต่อเนื่อง', 6], ['เป็นช่วงฤดูกาลหรือโชคดี ไม่แน่ใจว่าจะต่อเนื่อง', 1], ['ไม่ทราบสาเหตุแน่ชัด', -4]] : [['แยกสาเหตุเป็นรายสัญญา/รายสาขาและมีแผนแก้ภายใน 1 รอบ', 6], ['ตลาดโดยรวมชะลอ ไม่ใช่ความผิดของเรา', -3], ['ยังไม่ได้วิเคราะห์', -6]])); }
      const act = window.Contracts207 ? (Contracts207.st(c).active || []) : [], bad = act.find(k => (k.bad || 0) > 0);
      if (bad) L.push(mk('dy_sla', `สัญญา ${bad.no || ''} กับ ${bad.cust} ผิดข้อตกลงบริการมา ${bad.bad} ครั้ง ถ้าลูกค้ายกเลิกสัญญาจะกระทบรายได้แค่ไหน?`, [['ตั้งทีมแก้ปัญหา ลดความเสี่ยงของสัญญาและแจ้งลูกค้าก่อน', 6], ['ลูกค้ารายนี้ไม่สำคัญ ยกเลิกก็ได้', -4], ['ยังไม่ทราบรายละเอียด', -6]]));
      if (f.cash < 600000) L.push(mk('dy_cash', `เงินสดบริษัทเหลือ ${baht0(Math.round(f.cash))} รอบปิดงบหน้ามีค่าใช้จ่ายประจำ (เงินเดือน ค่าเช่า ค่าไฟ เน็ต) พอจ่ายหรือไม่?`, [['ประมาณค่าใช้จ่ายรอบหน้าและเตรียมเงินสดหรือวงเงินกู้ล่วงหน้า', 5], ['คาดว่ามีรายรับเข้ามาทัน', -1, f => f.cash >= 300000], ['ยังไม่ได้คำนวณ', -6]]));
    }
    if (n === 5) {
      try { const ev = (Biz212.X().mk.ev || []).find(e => e.until >= S.day && (e.sec === 'all' || e.sec === Biz212.sectorOf(c.type))); if (ev) L.push(mk('dy_mkt', `ตอนนี้ตลาดมีเหตุการณ์ "${ev.text}" (ตัวคูณ ×${ev.m}) แผนธุรกิจและงบประมาณปรับตามหรือยัง?`, [['ปรับประมาณการรายได้และงบลงทุนตามสถานการณ์ตลาด', 6], ['ใช้แผนเดิม เพราะเป็นเหตุการณ์ชั่วคราว', -2], ['ไม่ได้ติดตามข่าวตลาด', -6]])); } catch (e) { }
      if ((c.loan || 0) > 0 && f.ytd <= 0) L.push(mk('dy_loan', `บริษัทมีหนี้ ${baht0(Math.round(c.loan))} แต่กำไรสะสมยังไม่เป็นบวก ภาระดอกเบี้ยจะทำให้ขาดทุนเพิ่มหรือไม่?`, [['เสนอแผนชำระคืนบางส่วนและงดลงทุนใหม่จนกว่าจะมีกำไร', 6], ['กู้เพิ่มเพื่อหมุนเวียน', -6], ['กำไรจะกลับมาเอง', -4]]));
    }
    if (n === 6) {
      const sb = staffBy(c), act = window.Contracts207 ? (Contracts207.st(c).active || []) : [], big = of.find(o => (o.value || 0) >= BIGCT);
      L.push(mk('dy_ops', `งานของ${(CO_TYPES[c.type] || {}).n || 'บริษัท'}ตอนนี้ใช้พนักงาน ${f.staff} คน (${Object.keys(sb).map(r => roleName(r) + ' ' + sb[r]).join(', ') || '-'}) รองรับสัญญาที่รับไว้ ${act.length} ฉบับ ได้เต็มที่หรือไม่?`, [['วางแผนกำลังคนตามสัญญาที่ลงนามไว้และจ้างเพิ่มเมื่อภาระเกิน 80%', 6, () => f.staff >= 2], ['ยังพอรับได้ ถ้ามีปัญหาค่อยจ้างเพิ่ม', 0], ['พนักงานทำงานล่วงเวลาเอา', -5]]));
      if (big) L.push(mk('dy_big', `สัญญา "${big.title}" มูลค่ารวม ${baht0(big.value || 0)} ทีมของเรามีกำลังและความสามารถรับงานนี้จริงหรือไม่ ก่อนที่บอร์ดจะอนุมัติ?`, [['ตรวจเงื่อนไขและกำลังคนครบแล้ว พร้อมรับงานตามข้อกำหนดของสัญญา', 6, () => failing(c).length === 0], ['น่าจะทำได้ ถ้าขาดอะไรค่อยหาเพิ่ม', -2], ['รับไว้ก่อนเพื่อไม่ให้เสียลูกค้า', -8]]));
    }
    if (n === 7) {
      if (fl.length) L.push(mk('dy_chk', `ข้อกำหนดในการดำเนินงานยังไม่ผ่าน: "${fl[0]}" จะแก้ไขเมื่อไรและใครรับผิดชอบ?`, [['แก้ภายใน 7 วัน มีผู้รับผิดชอบและรายงานผลให้บอร์ด', 6], ['อยู่ระหว่างดำเนินการ', 1], ['ไม่กระทบธุรกิจ ไม่ต้องรีบ', -8]]));
      if (!c.insured && ((c.br || []).length > 0 || f.cash > 1500000)) L.push(mk('dy_ins', 'ทรัพย์สินและเงินสดของบริษัทมีมูลค่าสูงขึ้น แต่ยังไม่มีประกัน ถ้าเกิดไฟไหม้หรือน้ำท่วมใครรับผิดชอบ?', [['เสนอซื้อประกันทรัพย์สินในการประชุมครั้งนี้', 7], ['เจ้าของจะรับความเสี่ยงเอง', -5], ['จะพิจารณาปีหน้า', -2]]));
    }
    return L;
  };
  // which agenda point each of the older questions belongs to (bank of v216 / v217 / v218)
  A.QAG = Object.assign({}, ...Object.entries({ 1: 'b_duty b_freq', 3: 'b_follow', 4: 'b_cf b_var b_kpi b_wc b_inv b_cov d5 s6 r1 r6', 5: 'b_price b_roi b_str b_branch b_capex b_rate b_mkt b_brand b_dig f1 f4 f7 e1 e3 e7 t1 t7 i3 i4 i6 d4 s2 s4 r2 r3 r7', 6: 'b_cust b_people b_sup b_bonus b_turn b_train b_qual b_ctr b_succ b_drec f3 f5 e5 t3 t4 t5 t6 i5 d1 d3 d7 s1 s5 s7 r4', 8: 'b_exit b_comp2 b_vet', 7: 'b_ctrl b_ins b_lic b_it b_law b_safe b_pdpa b_bcp b_findings b_eth b_reg f2 f6 e2 e4 e6 i1 i2 i7 d2 d6 s3 r5' }).map(([n, ids]) => Object.fromEntries(ids.split(' ').map(id => [id, +n]))));

  // ---------- the meeting forms in the company window ----------
  const DR = c => (c.dr = c.dr || { sh: [], bd: [] });
  const shOpts = c => {
    const o = [['agm|1|', 'อนุมัติงบการเงินประจำปี'], ['minp|1|', 'รับรองรายงานการประชุมครั้งก่อน'], ...[0, 0.3, 0.5, 0.7].map(v => [`divp|${v}|`, v ? `จ่ายปันผล ${pct(v)} ของกำไรที่จ่ายได้` : 'งดจ่ายปันผล']), ...[0].concat(A.feeOpts ? A.feeOpts(c) : [10000, 30000]).map(v => [`dpay|${v}|`, v ? `ค่าตอบแทนกรรมการ ${baht0(v)}/คน/เดือน + เบี้ยประชุมครั้งละครึ่งหนึ่ง` : 'ไม่จ่ายค่าตอบแทนกรรมการ']), ['bylaw|1|', 'แก้ไขข้อบังคับบริษัท (มติพิเศษ ¾)'], ...[1e5, 5e5, 1e6, 3e6].map(v => [`spec|${v}|`, `จ่ายปันผลพิเศษ ${baht0(v)}`]), ...[1e6, 2e6, 5e6].map(v => [`cap|${v}|`, `เพิ่มทุน เรียกชำระ ${baht0(v)} (มติพิเศษ ¾)`]), ['aud|60000|สำนักงานบัญชีขนาดเล็ก', 'แต่งตั้งผู้สอบบัญชี: สำนักงานบัญชีขนาดเล็ก (60,000 ฿)'], ['aud|250000|ผู้สอบบัญชีรับอนุญาตรายใหญ่', 'แต่งตั้งผู้สอบบัญชี: รายใหญ่ (250,000 ฿ ชื่อเสียง +5)'], ['holder|0|', 'เปลี่ยนผู้ถือหุ้นร่วม']];
    for (const p of cands(c).filter(x => !x.director).slice(0, 8)) o.push([`dir|1|${p.n}`, `แต่งตั้ง ${p.n} (${p.src}) เป็นกรรมการ`]);
    if (A.shExtra) o.push(...A.shExtra(c));
    return o;
  };
  const bdOpts = c => {
    const o = [['mgr|1|', 'จ้างผู้จัดการมืออาชีพ (150,000 ฿)'], ['expand|1|', 'ลงทุนขยาย/ปรับปรุงกิจการ (500,000 ฿)'], ['bonus|1|', 'จ่ายโบนัสพนักงาน 1 เดือน'], ['budget|1|', 'อนุมัติงบประมาณประจำปี'], ['riskr|1|', 'ทบทวนความเสี่ยงและแผนฉุกเฉิน'], ['ins|1|', 'ซื้อประกันทรัพย์สิน (40,000 ฿)'], ['ctrl|1|', 'ตั้งระบบควบคุมภายใน (30,000 ฿)'], ['cg|1|', 'นโยบายบรรษัทภิบาลและจรรยาบรรณ'], ['csr|1|', 'งบ CSR ชุมชน (50,000 ฿)'], ['mkt|1|', 'งบการตลาด (100,000 ฿)'], ...[0.3, 0.5, 0.7].map(v => [`divrec|${v}|`, `เสนอนโยบายปันผล ${pct(v)} ต่อที่ประชุมผู้ถือหุ้น`]), ['agmcall|1|', 'กำหนดวันประชุมสามัญผู้ถือหุ้น (ใน 7 วัน)'], ...[1e6, 3e6].map(v => [`credit|${v}|`, `ขอวงเงินกู้ ${baht0(v)}`]), ['repay|1|', 'ชำระคืนเงินกู้']];
    try { for (const [k, X] of Branch214.sitesFor(c)) o.push([`branch|1|${k}`, `เปิดสาขา: ${X.n}`]); } catch (e) { }
    for (const b of (c.br || []).filter(x => x.st === 'open')) o.push([`closebr|${b.id}|`, `ปิดสาขา: ${b.name}`]);
    if (A.bdExtra) o.push(...A.bdExtra(c));
    for (const x of offersOf(c).filter(q => (q.value || 0) >= BIGCT && !q.boardOK).slice(0, 6)) o.push([`ctsign|${x.id}|${x.title} — ${x.cust} (${baht0(x.value || 0)})`, `อนุมัติรับสัญญา: ${x.title} — ${x.cust} (${baht0(x.value || 0)})`]);
    return o;
  };
  const itemLabel = (c, it) => A.labEx({ key: 'co:' + c.id }, it) || K.label('co:' + c.id, it);
  const mine = c => (K.st().mt || []).filter(m => m.key === 'co:' + c.id && (m.status === 'sched' || m.status === 'due'));
  // v234: pick as many agenda items as you like (tap to tick), choose how the meeting runs, send ONE notice
  const optKey = o => { const [t, v, ...w] = String(o).split('|'); return { t, v: isNaN(+v) ? v : +v, who: w.join('|') }; };
  const hasIt = (L, o) => { const k = optKey(o); return L.some(x => x.t === k.t && String(x.v) === String(k.v) && (x.who || '') === k.who); };
  const draftBox = (c, kind) => {
    const d = DR(c)[kind], isSh = kind === 'sh', opts = isSh ? shOpts(c) : bdOpts(c), canPend = isSh || !(A.agmOK && A.agmOK(c));
    const pend = canPend ? (c.pend || []) : [];
    const btn = (val, label, on) => `<button class="btn ${on ? '' : 'ghost'}" style="display:block;width:100%;text-align:left;margin:2px 0;white-space:normal" data-a="ag217tog" data-v="${c.id}" data-k="${kind}" data-x="${E(val)}">${on ? '☑' : '☐'} ${E(label)}</button>`;
    const groups = isSh ? [['', opts]] : Object.keys(A.AGN).map(Number).filter(n => opts.some(([v]) => A.agOf(v.split('|')[0]) === n)).map(n => [`วาระที่ ${n} ${A.AGN[n].n}`, opts.filter(([v]) => A.agOf(v.split('|')[0]) === n)]);
    const list = groups.map(([h, L]) => `${h ? `<p class="dim" style="margin:8px 0 2px"><b>${E(h)}</b></p>` : ''}${L.map(([v, l]) => btn(v, l, hasIt(d, v))).join('')}`).join('')
      + (pend.length ? `<p class="dim" style="margin:8px 0 2px"><b>ข้อเสนอร่วมหุ้นที่รออนุมัติ</b></p>${pend.map(p => btn(`newholder|0.1|${p.who}`, `รับ ${p.who} ร่วมหุ้น ${Math.round(p.pct * 100)}% (${baht0(p.price)})`, d.some(x => x.t === 'newholder' && x.who === p.who))).join('')}` : '');
    return `<p class="lead">เลือกวาระที่ต้องการ (กดเพื่อติ๊ก/ยกเลิก) แล้วนัดประชุม<b>ครั้งเดียว</b> · เลือกแล้ว <b>${d.length}</b> วาระ ${d.length ? `<button class="btn ghost" data-a="ag217clr" data-v="${c.id}" data-k="${kind}">ล้างที่เลือก</button>` : ''}</p>
      <button class="btn" data-a="agpop" data-v="${c.id}" data-k="${kind}">📋 เลือกวาระ (เลือกแล้ว ${d.length} วาระ)</button><div class="ag256src" data-cid="${c.id}" data-kind="${kind}" hidden>${list}</div>
      <div class="row"><select id="ag217ord_${kind}${c.id}" style="max-width:100%"><option value="i">เฉพาะวาระที่เลือก (ถาม-ตอบเฉพาะเรื่องที่เลือก)</option><option value="o">ประชุมประจำ (เพิ่มวาระประจำ: ${isSh ? 'รายงาน งบการเงิน ปันผล เลือกกรรมการ' : 'รายงานการประชุม ผลดำเนินงาน งบการเงิน งบประมาณ ความเสี่ยง สัญญาลูกค้ารายใหญ่ทุกฉบับ'} แต่ถามเฉพาะวาระที่เกี่ยวข้อง)</option><option value="f">ประชุมใหญ่ทุกวาระ (ถาม-ตอบครบทั้ง ${isSh ? Object.keys(A.AGNS).length : Object.keys(A.AGN).length} วาระ)</option></select></div>
      <div class="row"><select id="ag217day_${kind}${c.id}">${(isSh ? [3, 5, 7, 14] : [1, 3, 7]).map(n => `<option value="${n}">อีก ${n} วัน</option>`).join('')}</select><button class="btn" data-a="ag217send" data-v="${c.id}" data-k="${kind}" >ส่งหนังสือนัดประชุม${isSh ? 'ผู้ถือหุ้น' : 'คณะกรรมการ'}</button></div>`;
  };
  const section = c => {
    const B = board(c), N = B.length + 1, ms = mine(c), P = c.pend || [], CL = cands(c), tr = A.tier ? A.tier(c) : { both: true, why: '' };
    return `${A.tierBadge ? A.tierBadge(c, tr) : ''}<h5>👔 คณะกรรมการบริษัท (${N} คน)</h5>
      <p class="dim">บอร์ดดูแลงานบริหาร กรรมการลงมติคนละ 1 เสียง ผู้บริหารที่ไม่ได้เป็นกรรมการไม่มีสิทธิออกเสียง ประธาน${c.chair ? ' (' + E(c.chair) + ')' : ' (คุณ)'} ไม่ลงคะแนน เว้นแต่คะแนนเสมอกันจึงออกเสียงชี้ขาด · กรรมการแต่งตั้งโดยมติที่ประชุมผู้ถือหุ้น${N < 3 ? ' · <b>ยังมีกรรมการน้อย ควรแต่งตั้งเพิ่มในที่ประชุมผู้ถือหุ้นก่อน เพื่อให้บอร์ดมีคำถามและถ่วงดุล</b>' : ''}</p>
      <table class="tbl" style="width:100%"><tr><th>กรรมการ</th><th>ตำแหน่ง</th><th>อารมณ์</th></tr><tr><td><b>คุณ</b></td><td>${c.chair ? '👔 กรรมการ' : '👑 ประธานกรรมการ'}</td><td>—</td></tr>${B.map(d => `<tr><td>${E(d.n)}</td><td>${c.chair === d.n ? '👑 ประธานกรรมการ' : '👔 กรรมการ'}${d.trait && A.traitName ? ' · ' + A.traitName(d.trait) : ''} · ดำรงตำแหน่งมา ${Math.max(0, S.day - (d.since || S.day))} วัน</td><td>${face(d.mood == null ? 50 : d.mood)}</td></tr>`).join('')}</table><p class="dim">ค่าตอบแทนกรรมการ ${c.dfee ? baht0(c.dfee) + '/คน/เดือน' : 'ไม่จ่าย'} · ผู้สอบบัญชี ${E(audName(c) || 'ยังไม่แต่งตั้ง')} · เงินกู้ ${baht0(c.loan || 0)} · ประกัน ${c.insured ? '✅' : '❌'} · ควบคุมภายใน ${c.ctrl ? '✅' : '❌'} · งบประมาณ ${c.bud ? '✅' : '❌'}</p>
      ${ms.length ? `<h5>🗓️ การประชุมที่นัดไว้</h5>${ms.map(m => `<div class="card"><div class="cb"><h4>${m.kind === 'board' ? '👔 ประชุมคณะกรรมการ' : '🏛️ ประชุมผู้ถือหุ้น'} · ${RD(m.day)} ${m.status === 'due' ? '🔔 ถึงกำหนดแล้ว' : '🕓'}</h4><ul class="lead">${m.items.map(it => `<li>${E(itemLabel(c, it))}</li>`).join('')}</ul><div class="row">${m.status === 'due' ? `<button class="btn" data-a="bdclose" data-v="${m.id}">🎙️ เข้าห้องประชุม</button>` : ''}<button class="btn ghost" data-a="bdcancel" data-v="${m.id}">ยกเลิกการประชุม</button></div></div></div>`).join('')}` : ''}
      ${tr.both ? `<h5>🏛️ นัดประชุมผู้ถือหุ้น</h5><p class="dim">ประชุมสามัญประจำปีมีวาระมาตรฐาน: ① รับรองรายงานการประชุมครั้งก่อน ② รับทราบผลการดำเนินงาน ③ อนุมัติงบการเงิน ④ จัดสรรกำไร/ปันผล ⑤ เลือกตั้งกรรมการแทนผู้ครบวาระ ⑥ ค่าตอบแทนกรรมการ ⑦ แต่งตั้งผู้สอบบัญชี ⑧ เรื่องอื่นๆ (ผู้ถือหุ้นซักถาม) · วาระพิเศษที่เพิ่มเองได้: เพิ่มทุน รับผู้ถือหุ้นใหม่ แก้ข้อบังคับ · โหวดตามจำนวนหุ้น · แจ้งล่วงหน้าอย่างน้อย 3 วัน</p>${draftBox(c, 'sh')}` : ''}
      <h5>👔 นัดประชุมคณะกรรมการ</h5><p class="dim">ระเบียบวาระ 18 ข้อ: 1 ประธานแจ้ง · 2 รับรองรายงานเดิมและติดตามมติ · 3 ผลประกอบการ · 4 ฐานะการเงิน · 5 แผนธุรกิจและกลยุทธ์ · 6 งบประมาณ · 7 การตลาดและยอดขาย · 8 จัดซื้อและสัญญาธุรกิจ · 9 โครงการลงทุน (สาขา) · 10 ลงทุนในบริษัทอื่น · 11 จัดหาเงินทุน · 12 บุคลากรและผู้บริหาร · 13 บริหารความเสี่ยง · 14 กฎหมายและการตรวจสอบ · 15 เทคโนโลยี · 16 กำกับดูแลกิจการ · 17 เรื่องเสนอผู้ถือหุ้น · 18 เรื่องอื่นๆ · แต่ละวาระมีข้อมูลจริงของบริษัทและคำถามจากกรรมการ · กรรมการหนึ่งคนหนึ่งเสียง · แจ้งล่วงหน้าอย่างน้อย 1 วัน</p>${draftBox(c, 'bd')}
      ${A.govPanels ? A.govPanels(c, tr) : ''}
      <h5>🤝 นักลงทุนที่สนใจบริษัท</h5>
      <p class="dim">นักธุรกิจ เศรษฐี และนายทหาร/ตำรวจยศสูงจะติดต่อเข้ามาเองเมื่อบริษัทมีผลงานและชื่อเสียงดี (ชาวบ้านและเพื่อนไม่ได้มาร่วมหุ้นแล้ว เพราะส่วนใหญ่ไม่มีเงินลงทุน) · ดูคำเสนอและตอบรับที่แท็บ "ผู้ถือหุ้น & นักลงทุน" ของหน้าต่างบริษัท · ข้าราชการประจำถือหุ้นได้แต่เป็นกรรมการไม่ได้ ผู้เกษียณเป็นกรรมการได้ · ตอนนี้มีคำเสนอรออยู่ ${(c.of || []).length} ราย</p>
      ${P.length ? `<p class="lead">ข้อเสนอที่รออนุมัติ: ${P.map((p, i) => `${E(p.who)} ${Math.round(p.pct * 100)}% (${baht0(p.price)}) ${A.dirOnly && A.dirOnly(c) < (A.VOTE_MIN || 3) ? `<button class="btn" data-a="ag217own" data-v="${c.id}" data-i="${i}">✅ เจ้าของอนุมัติทันที</button> ` : ''}<button class="btn ghost" data-a="ag217pc" data-v="${c.id}" data-i="${i}">ยกเลิก</button>`).join(' · ')}</p>` : ''}
      ${c.listed ? '<p class="dim">บริษัทอยู่ในตลาดหลักทรัพย์แล้ว ซื้อขายหุ้นผ่านตลาดแทน</p>' : ''}`;
  };
  { const _h = Company.html.bind(Company); Company.html = function (t) {
    let s = _h(t); if (t === 1 || t === 3) return s; const c = Company.get(Company.sel); if (!c || !open(c)) return s;
    const re = /<h5>🗓️ ประชุมบอร์ด \/ ผู้ถือหุ้น<\/h5><div class="row"><button class="btn" data-a="bdco"[^>]*>[^<]*<\/button><\/div>/;
    return re.test(s) ? s.replace(re, () => section(c)) : s;
  }; }

  Object.assign(UI.H, {
    ag217add: d => { const c = Company.get(+d.v), sel = document.getElementById(`ag217sel_${d.k}${d.v}`); if (!c || !sel) return; const [t, v, ...w] = String(sel.value).split('|'), who = w.join('|'), L = DR(c)[d.k]; if (L.length >= 5 && !d.all) { UI.toast('เพิ่มวาระได้ไม่เกิน 5 วาระ', '🗓️'); return; } if (L.some(x => x.t === t && String(x.v) === v && (x.who || '') === who)) { UI.toast('มีวาระนี้แล้ว', '🗓️'); return; } const it = { t, v: isNaN(+v) ? v : +v }; if (who) it.who = who; L.push(it); },
    ag217tog: d => {
      const c = Company.get(+d.v); if (!c) return; const L = DR(c)[d.k], k = optKey(d.x), i = L.findIndex(x => x.t === k.t && String(x.v) === String(k.v) && (x.who || '') === k.who);
      if (i >= 0) { L.splice(i, 1); return; }
      if (k.t === 'newholder') { const p = (c.pend || []).find(q => q.who === k.who); if (!p) return; L.push({ t: 'newholder', v: 0.1, who: p.who, pct: p.pct, price: p.price }); return; }
      const it = { t: k.t, v: k.v }; if (k.who) it.who = k.who; L.push(it);
    },
    ag217clr: d => { const c = Company.get(+d.v); if (c) DR(c)[d.k] = []; },
    ag217rm: d => { const c = Company.get(+d.v); if (c) DR(c)[d.k].splice(+d.i, 1); },
    ag217send: d => {
      const c = Company.get(+d.v); if (!c) return; const isSh = d.k === 'sh', L = DR(c)[d.k].slice();
      if (isSh && A.agmOK && !A.agmOK(c)) { UI.toast('ประชุมสามัญผู้ถือหุ้นจัดได้เฉพาะบริษัทมหาชนจำกัด (จดทะเบียนในตลาดหลักทรัพย์)', '🏛️'); return; }
      if (!isSh && !A.boardOK(c)) { UI.toast(A.boardBlockMsg(c), '👔'); return; }
      const mode = (document.getElementById(`ag217ord_${d.k}${d.v}`) || {}).value || 'i', ord = mode !== 'i';   // i = only the chosen items, o = + the standing items, f = the full meeting
      if (ord && (isSh || !(A.agmOK && A.agmOK(c)))) for (const p of (c.pend || [])) if (!L.some(x => x.t === 'newholder' && x.who === p.who)) L.push({ t: 'newholder', v: 0.1, who: p.who, pct: p.pct, price: p.price });
      if (ord) { const base = isSh ? routineAgm(c) : routineBoard(c); for (const r of base.reverse()) if (!L.some(x => x.t === r.t && (!['ctsign', 'dirr'].includes(r.t) || (r.t === 'ctsign' ? String(x.v) === String(r.v) : x.who === r.who)))) L.unshift(r); }
      if (!isSh) { for (let i = L.length - 1; i >= 0; i--) if (L[i].t === 'ctsign') { const o = ctOffer(c, L[i].v); if (!o || o.exp < S.day + 1) { UI.toast(`ข้อเสนอสัญญา "${(o && o.title) || ''}" จะหมดอายุก่อนวันประชุม จึงตัดออกจากวาระ`, '⏳'); L.splice(i, 1); } } }
      if (!L.length) return; let dd = +(((document.getElementById(`ag217day_${d.k}${d.v}`) || {}).value) || (isSh ? 3 : 1));
      if (!isSh) { const e = ctExp(c, L); if (e !== Infinity && S.day + dd > e) { dd = Math.max(1, e - S.day); UI.toast(`มีสัญญาที่ข้อเสนอจะหมดอายุวันที่ ${e} จึงนัดประชุมเร็วขึ้นเป็นวันที่ ${S.day + dd}`, '⏳'); } }
      const m = K.mk('co:' + c.id, L, S.day + Math.max(isSh ? 3 : 1, dd), 'me'); m.kind = isSh ? 'agm' : 'board'; m.scope = mode === 'f' ? 'full' : 'items'; DR(c)[d.k] = [];
      UI.toast(isSh ? 'ส่งหนังสือนัดประชุมผู้ถือหุ้นแล้ว' : 'ส่งหนังสือนัดประชุมคณะกรรมการแล้ว', '🗓️');
    },
    ag217own: d => { const c = Company.get(+d.v), p = c && (c.pend || [])[+d.i]; if (!c || !p) return; if (A.dirOnly(c) >= (A.VOTE_MIN || 3)) { UI.toast('บอร์ดครบแล้ว ต้องนำเข้าที่ประชุมบอร์ด', '👔'); return; }
      const r = A.applyEx({ key: 'co:' + c.id }, { t: 'newholder', v: 0.1, who: p.who, pct: p.pct, price: p.price }); try { A.syncBoard(c); } catch (e) { } UI.toast(r || 'อนุมัติแล้ว', '🤝'); },
    ag217pc: d => { const c = Company.get(+d.v); if (c && c.pend) c.pend.splice(+d.i, 1); },
  });
  window.Board217 = { board, cands, priceFor, section };
});
