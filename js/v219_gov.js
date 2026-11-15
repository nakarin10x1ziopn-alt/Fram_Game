'use strict';
// ---------- v219: corporate governance layer ----------
//   tier        which business needs which meetings: small owner-held companies = board only (owner decisions go through the board); large / regulated companies, or any
//               company with another shareholder or a listing = board AND shareholders' meeting
//   agm         the shareholders' meeting follows 8 fixed agenda points, each with an information panel from the books and its own questions (like the board)
//   promises    an answer such as "I will open a branch this year" becomes a promise; the next meeting checks it (kept = trust up, broken = trust down + a question)
//   minutes     every meeting is archived with its questions and your answers
//   directors   each director has a temperament (careful / growth / independent); directors can be removed, a chair can be elected, you may lose the casting vote
//   law         a shareholders' meeting every year (large companies) and a board meeting every quarter-and-a-half, otherwise fines / loss of trust
//   power       holders may ask to sell back or buy more; an IPO needs a shareholders' resolution
V23.add('v219_gov', function () {
  if (!window.Agm216 || !window.Board217 || !Equity.core) return;
  const A = Agm216, K = Equity.core, B7 = Board217, pc = K.pc, E = s => (typeof esc === 'function' ? esc(s) : String(s));
  const baht0 = n => (typeof baht === 'function' ? baht(n) : String(n)), clamp = (x, a, b) => Math.max(a, Math.min(b, x)), rnd = (a, b) => a + Math.random() * (b - a);
  const open = c => c && c.st === 'open';
  const face = m => (m >= 70 ? '😊' : m >= 50 ? '🙂' : m >= 35 ? '😐' : '😠');
  const card = (t, b) => `<div class="card"><div class="cb"><h4>${t}</h4>${b}</div></div>`, ul = L => `<ul class="lead">${L.map(x => `<li>${x}</li>`).join('')}</ul>`;
  const pct = v => Math.round(v * 100) + '%';

  // ================= 1. which meetings does this business need =================
  const BOTH = ['fintech', 'isp', 'dc', 'ev', 'food', 'cyber', 'host', 'ai', 'logistics', 'edtech'], SMALL = ['catering'];
  A.tier = c => {
    A.reg(c); const pub = !!c.listed;   // shareholders' meeting = public limited companies (listed) only
    return { both: pub, why: pub ? 'บริษัทมหาชนจำกัด (จดทะเบียนในตลาดหลักทรัพย์) จึงต้องมีทั้งบอร์ดและประชุมสามัญผู้ถือหุ้น' : 'บริษัทจำกัด (ยังไม่เป็นบริษัทมหาชน) ใช้ประชุมบอร์ดอย่างเดียว มติที่ต้องผ่านผู้ถือหุ้นให้ลงมติในที่ประชุมบอร์ด จะมีประชุมสามัญผู้ถือหุ้นเมื่อเข้าตลาดหลักทรัพย์ (IPO)' };
  };
  A.agmOK = c => !!c && !!c.listed;
  A.tierBadge = (c, tr) => `<p class="lead" style="border:1px solid rgba(255,255,255,.2);border-radius:12px;padding:8px 12px">${tr.both ? '🏛️ + 👔 บริษัทนี้ต้องมีทั้งประชุมผู้ถือหุ้นและประชุมบอร์ด' : '👔 บริษัทนี้ประชุมบอร์ดอย่างเดียว'}<br><span class="dim">${E(tr.why)}</span></p>`;

  // ================= agenda registry =================
  Object.assign(K.AG, {
    dirx: { n: 'ถอดถอนกรรมการ', opts: [], yes: () => 0.6 },
    chair: { n: 'เลือกประธานคณะกรรมการ', opts: [], yes: () => 0.7 },
    ipo: { n: 'อนุมัติแผนนำบริษัทเข้าจดทะเบียนในตลาดหลักทรัพย์ (IPO)', opts: [], yes: () => 0.5 },
  });
  const _lab = A.labEx;
  A.labEx = (m, it) => {
    const w = it.who || '';
    if (it.t === 'dirx') return `ถอดถอน ${w} ออกจากตำแหน่งกรรมการ`;
    if (it.t === 'chair') return w === 'me' ? 'เลือกคุณเป็นประธานคณะกรรมการ' : `เลือก ${w} เป็นประธานคณะกรรมการ`;
    if (it.t === 'ipo') return K.AG.ipo.n;
    if (it.t === 'dir' && it.v === 2) return `แต่งตั้ง ${w} เป็นกรรมการอิสระ`;
    return _lab ? _lab(m, it) : null;
  };
  // board items → agenda point (the owner's decisions of a small company are handled in point 6)
  const _ago = A.agOf; A.agOf = t => ({ divp: 6, aud: 6, dpay: 6, ipo: 6, chair: 6, dirx: 6, dir: 6, spec: 6, cap: 6, newholder: 6, bylaw: 6, holder: 6, agm: 4 })[t] || _ago(t);
  // shareholders' meeting: 8 fixed points
  A.AGNS = {
    1: { n: 'ประธานแจ้งให้ที่ประชุมทราบ', k: 'รับทราบ' }, 2: { n: 'รับรองรายงานการประชุมผู้ถือหุ้นครั้งก่อน', k: 'พิจารณารับรอง' },
    3: { n: 'รับทราบรายงานผลการดำเนินงานประจำปี', k: 'รับทราบ' }, 4: { n: 'พิจารณาอนุมัติงบการเงิน', k: 'พิจารณาอนุมัติ' },
    5: { n: 'พิจารณาจัดสรรกำไรและการจ่ายเงินปันผล', k: 'พิจารณาอนุมัติ' }, 6: { n: 'เลือกตั้งกรรมการและกำหนดค่าตอบแทน', k: 'พิจารณาอนุมัติ' },
    7: { n: 'แต่งตั้งผู้สอบบัญชีและกำหนดค่าสอบบัญชี', k: 'พิจารณาอนุมัติ' }, 8: { n: 'วาระพิเศษและเรื่องอื่น ๆ', k: 'พิจารณา' },
  };
  const AGS = { minp: 2, rptp: 3, agm: 4, divp: 5, spec: 5, dirr: 6, dir: 6, dirx: 6, dpay: 6, aud: 7, cap: 8, newholder: 8, bylaw: 8, holder: 8, ipo: 8 };
  A.agOfS = t => AGS[t] || 8;
  A.QAGS = Object.assign({}, ...Object.entries({ 1: 'sh_equal sh_agenda sh_conf', 3: 'sh_roe sh_share sh_future sh_cust sh_cost sh_price sh_br2 sh_loss2 sh_rep1 sh_rep2 loss good comp expand branch staff esg key power sh_digital', 4: 'cashlow cashhigh debt sh_report sh_tax2 tax rpt sh_loan1 sh_loan0', 5: 'div sh_divhist sh_val', 6: 'pay sh_fee sh_partner', 7: 'audit sh_aud sh_whistle', 8: 'cap ipo sh_newh listed sh_lst2 sh_lst3 sh_lst4 info' }).map(([n, ids]) => Object.fromEntries(ids.split(' ').map(id => [id, +n]))));

  // owner decisions of a small company and the extra items of the big ones
  A.shExtra = c => {
    const o = [], B = B7.board(c);
    for (const d of B) o.push([`dirx|1|${d.n}`, `ถอดถอนกรรมการ: ${d.n}`]);
    for (const p of B7.cands(c).filter(x => !x.director).slice(0, 4)) o.push([`dir|2|${p.n}`, `แต่งตั้ง ${p.n} เป็นกรรมการอิสระ`]);
    if (!c.listed && !c.ipoOK) o.push(['ipo|1|', 'อนุมัติแผนเข้าตลาดหลักทรัพย์ (IPO) (มติพิเศษ ¾)']);
    return o;
  };
  A.bdExtra = c => {
    const o = [], tr = A.tier(c), B = B7.board(c);
    for (const d of B) o.push([`chair|1|${d.n}`, `เลือก ${d.n} เป็นประธานคณะกรรมการ`]); if (c.chair) o.push(['chair|0|me', 'เลือกคุณกลับมาเป็นประธานคณะกรรมการ']);
    if (!tr.both) {   // a small owner-held company: the owner's decisions go through the board
      for (const v of [0.3, 0.5, 0.7]) o.push([`divp|${v}|`, `(มติเจ้าของ) จ่ายปันผล ${pct(v)} ของกำไรที่จ่ายได้`]);
      o.push(['aud|60000|สำนักงานบัญชีขนาดเล็ก', '(มติเจ้าของ) แต่งตั้งผู้สอบบัญชี: สำนักงานบัญชีขนาดเล็ก (60,000 ฿)'], ['aud|250000|ผู้สอบบัญชีรับอนุญาตรายใหญ่', '(มติเจ้าของ) แต่งตั้งผู้สอบบัญชีรายใหญ่ (250,000 ฿)']);
      for (const v of (A.feeOpts ? A.feeOpts(c) : [10000, 30000])) o.push([`dpay|${v}|`, `(มติเจ้าของ) ค่าตอบแทนกรรมการ ${baht0(v)}/คน/เดือน + เบี้ยประชุมครั้งละครึ่งหนึ่ง (ผู้บริหารที่เป็นกรรมการไม่ได้รับ)`]);
      for (const p of B7.cands(c).filter(x => !x.director).slice(0, 4)) o.push([`dir|1|${p.n}`, `(มติเจ้าของ) แต่งตั้ง ${p.n} เป็นกรรมการ`]);
      for (const d of B) o.push([`dirx|1|${d.n}`, `(มติเจ้าของ) ถอดถอนกรรมการ: ${d.n}`]);
      if (!c.listed && !c.ipoOK) o.push(['ipo|1|', '(มติเจ้าของ) อนุมัติแผนเข้าตลาดหลักทรัพย์ (IPO)']);
      for (const v of [1e5, 5e5, 1e6]) o.push([`spec|${v}|`, `(มติเจ้าของ) จ่ายปันผลพิเศษ ${baht0(v)}`]);
      for (const v of [1e6, 2e6, 5e6]) o.push([`cap|${v}|`, `(มติเจ้าของ) เพิ่มทุน เรียกชำระ ${baht0(v)} (มติพิเศษ ¾)`]);
      o.push(['bylaw|1|', '(มติเจ้าของ) แก้ไขข้อบังคับบริษัท (มติพิเศษ ¾)'], ['holder|0|', '(มติเจ้าของ) เปลี่ยนผู้ถือหุ้นร่วม']);
    }
    return o;
  };

  // ================= 2. directors with a temperament =================
  const TR = {
    cons: { n: '🛡️ สายระมัดระวัง', s: { expand: -.2, branch: -.2, credit: -.25, mkt: -.1, mgr: -.05, ins: .2, ctrl: .2, budget: .15, riskr: .15, csr: -.05, repay: .15 } },
    growth: { n: '🚀 สายขยายธุรกิจ', s: { expand: .2, branch: .25, credit: .15, mkt: .2, mgr: .1, ins: -.05, ctrl: -.05, bonus: .1, repay: -.1 } },
    indep: { n: '⚖️ กรรมการอิสระ', s: { cg: .25, ctrl: .25, ins: .1, riskr: .2, ctsign: -.1, closebr: .05, csr: .1, budget: .1 } },
  };
  const randTrait = () => { const r = Math.random(); return r < 0.4 ? 'cons' : r < 0.8 ? 'growth' : 'indep'; };
  A.traitName = t => (TR[t] ? TR[t].n : '');
  A.stanceEx = (h, it, board) => (board && h.ref && h.ref.trait && TR[h.ref.trait] ? (TR[h.ref.trait].s[it.t] || 0) : 0);
  A.prefer = (n, h, board) => { if (!board || !h.ref) return 1; const t = h.ref.trait; if (n === 7 && t === 'indep') return 3; if (n === 5 && (t === 'cons' || t === 'growth')) return 2; if (n === 6 && t === 'growth') return 1.6; if (n === 4 && t === 'cons') return 1.6; return 1; };
  A.tieEx = (SS, it) => { const c = SS.f && SS.f.c; return c && c.chair ? Math.random() < 0.5 : null; };   // someone else is the chair: the tie is not yours to decide
  { const _bh = A.boardH; A.boardH = k => { const H = _bh(k); if (H) B7.board(H.f.c).forEach(d => { if (!d.trait) d.trait = d.n === H.f.c.partner ? 'cons' : randTrait(); }); return H; }; }

  // ================= 3. what an answer can promise =================
  const nb = c => (c.br || []).filter(b => b.st === 'open').length;
  const PR = {
    div: { txt: 'จ่ายปันผลตามนโยบาย', due: 84, ok: (c, p) => (c.divDay || 0) >= p.day },
    branch: { txt: 'เปิดสาขาใหม่', due: 84, base: c => nb(c), ok: (c, p) => nb(c) > p.base },
    budget: { txt: 'อนุมัติงบประมาณประจำปี', due: 21, ok: (c, p) => (c.bud || 0) >= p.day },
    ins: { txt: 'ซื้อประกันทรัพย์สิน', due: 21, ok: (c, p) => (c.insured || 0) >= p.day },
    ctrl: { txt: 'ตั้งระบบควบคุมภายใน', due: 28, ok: (c, p) => (c.ctrl || 0) >= p.day },
    aud: { txt: 'แต่งตั้งผู้สอบบัญชี', due: 28, ok: (c, p) => (c.audDay || 0) >= p.day },
    risk: { txt: 'จัดทำแผนบริหารความเสี่ยง', due: 28, ok: (c, p) => (c.riskplan || 0) >= p.day },
    hire: { txt: 'รับพนักงานเพิ่ม', due: 28, base: c => (c.staff || []).length, ok: (c, p) => (c.staff || []).length > p.base },
    report: { txt: 'รายงานผลงานต่อผู้ถือหุ้นสม่ำเสมอ (ประชุมบอร์ดอีก 2 ครั้ง)', due: 84, base: c => c.bcount || 0, ok: (c, p) => (c.bcount || 0) >= p.base + 2 },
    bonus: { txt: 'จ่ายโบนัสพนักงาน', due: 42, ok: (c, p) => (c.bonusDay || 0) >= p.day },
    ups: { txt: 'ติดตั้ง UPS/ระบบสำรองไฟ', due: 28, ok: c => { try { return A.facts('co:' + c.id).ups; } catch (e) { return false; } } },
  };
  for (const [id, ix, key] of [['div', 0, 'div'], ['expand', 0, 'branch'], ['good', 0, 'branch'], ['staff', 2, 'hire'], ['info', 0, 'report'], ['b_ins', 1, 'ins'], ['audit', 2, 'aud'], ['b_bcp', 1, 'risk'], ['power', 1, 'ups']]) { const x = A.Q.find(y => y.id === id); if (x && x.o[ix]) { const o = x.o[ix]; while (o.length < 4) o.push(0); o[4] = key; } }
  A.PR = PR;
  A.promiseAdd = (SS, h, key) => {
    const c = SS.f && SS.f.c; if (!c || !PR[key]) return; c.prom = c.prom || []; if (c.prom.some(x => x.id === key)) return;
    c.prom.push({ id: key, txt: PR[key].txt, day: S.day, due: S.day + PR[key].due, base: PR[key].base ? PR[key].base(c) : 0, who: h.n });
    try { UI.toast(`📝 คำมั่นต่อที่ประชุม: ${PR[key].txt} ภายใน ${PR[key].due} วัน`, '📝'); } catch (e) { }
  };
  const moodAll = (c, d) => { (c.reg || []).forEach(h => { h.mood = clamp((h.mood == null ? 50 : h.mood) + d, 5, 98); }); (c.board || []).forEach(h => { h.mood = clamp((h.mood == null ? 50 : h.mood) + d, 5, 98); }); };
  A.promiseStart = SS => {
    const c = SS.f && SS.f.c; if (!c || !c.prom || !c.prom.length) return; const keep = [];
    for (const p of c.prom) { const d = PR[p.id]; if (!d) continue; if (d.ok(c, p)) SS.promo.ok.push(p); else if (S.day > p.due) SS.promo.bad.push(p); else keep.push(p); }
    c.prom = keep; SS.promo.pending = keep;
    if (SS.promo.ok.length) { moodAll(c, 8 * Math.min(2, SS.promo.ok.length)); c.rep = Math.min(100, (c.rep || 50) + SS.promo.ok.length); }
    if (SS.promo.bad.length) { moodAll(c, -10 * Math.min(2, SS.promo.bad.length)); c.rep = Math.max(0, (c.rep || 50) - 2 * SS.promo.bad.length); }
  };
  const promoHtml = (SS, c) => {
    const P = SS.promo || { ok: [], bad: [] }, pend = (c.prom || []).concat(P.pending || []).filter((x, i, a) => a.indexOf(x) === i);
    const rows = [...P.ok.map(p => `<tr><td>${E(p.txt)}</td><td>✅ ทำตามที่รับปากแล้ว</td><td>ความเชื่อมั่นเพิ่มขึ้น</td></tr>`), ...P.bad.map(p => `<tr><td>${E(p.txt)}</td><td>❌ เลยกำหนดแต่ยังไม่ทำ</td><td>ผู้ถือหุ้นและกรรมการไม่พอใจ ชื่อเสียงลด</td></tr>`), ...pend.map(p => `<tr><td>${E(p.txt)}</td><td>⏳ ภายใน ${RD(p.due)}</td><td class="dim">รับปากกับ ${E(p.who)}</td></tr>`)];
    return rows.length ? card('📝 คำมั่นที่เคยให้ไว้ในที่ประชุม', `<table class="tbl" style="width:100%"><tr><th>คำมั่น</th><th>สถานะ</th><th>ผล</th></tr>${rows.join('')}</table>`) : '';
  };
  A.recentQ = SS => { const c = SS.f && SS.f.c; return c && c.qhist ? [].concat(...c.qhist) : []; };

  // ================= 4. minutes of every meeting =================
  { const _od = A.onDone; A.onDone = (m, res, SS) => {
    if (_od) _od(m, res, SS); if (!m.key.startsWith('co:')) return; const c = Company.get(+m.key.slice(3)); if (!c) return; const kind = m.kind === 'board' ? 'board' : 'agm';
    c.arch = c.arch || [];
    c.arch.unshift({ kind, day: S.day, rows: res.filter(x => !x.info).map(x => ({ txt: x.txt, pass: x.pass, out: x.out || '', yes: x.yes, no: x.no })), info: res.filter(x => x.info).map(x => x.txt + (x.summary ? ': ' + x.summary : '')), qa: (SS && SS.log) || [], att: ((SS && SS.att) || []).map(h => h.n), promo: SS && SS.promo ? { ok: SS.promo.ok.map(p => p.txt), bad: SS.promo.bad.map(p => p.txt) } : null });
    if (c.arch.length > 10) c.arch.length = 10;
    if (kind === 'board') { c.lastBoard = S.day; c.bcount = (c.bcount || 0) + 1; } else c.lastAgm = S.day;
    c.qhist = c.qhist || []; c.qhist.unshift(((SS && SS.log) || []).map(x => x.id)); if (c.qhist.length > 3) c.qhist.length = 3;
  }; }
  const archHtml = c => {
    const L = c.arch || []; if (!L.length) return '<p class="dim">ยังไม่มีรายงานการประชุมย้อนหลัง</p>';
    return L.map(a => `<details style="margin:6px 0"><summary class="lead">${a.kind === 'board' ? '👔 ประชุมคณะกรรมการ' : '🏛️ ประชุมผู้ถือหุ้น'} · ${RD(a.day)} · ผ่าน ${a.rows.filter(r => r.pass).length}/${a.rows.length} วาระ · ถาม-ตอบ ${a.qa.length} ข้อ</summary>
      <p class="dim">ผู้เข้าร่วม: คุณ${a.att.length ? ', ' + a.att.map(E).join(', ') : ''}</p>${a.info && a.info.length ? `<p class="dim">รับทราบ: ${a.info.map(E).join(' · ')}</p>` : ''}
      ${a.promo && (a.promo.ok.length || a.promo.bad.length) ? `<p class="dim">คำมั่น: ${a.promo.ok.map(x => '✅ ' + E(x)).join(' · ')} ${a.promo.bad.map(x => '❌ ' + E(x)).join(' · ')}</p>` : ''}
      <ul class="lead">${a.rows.map(r => `<li>${r.pass ? '✅' : '❌'} ${E(r.txt)}${r.out ? ' — ' + E(r.out) : ''}</li>`).join('')}</ul>
      ${a.qa.length ? `<p class="dim">คำถามและคำตอบ</p><ul class="lead">${a.qa.map(x => `<li>วาระ ${x.ag || '-'} · <b>${E(x.n)}</b>: “${E(x.q)}”<br>↳ คุณตอบ: ${E(x.a)} ${x.lie ? '⚠️ ไม่ตรงกับงบ' : ''}</li>`).join('')}</ul>` : ''}</details>`).join('');
  };

  // ================= 5. the law: meetings must be held =================
  const valueOf = c => Math.max(c.paid || 0, (c.cash || 0) * 0.5) + Math.max(0, c.ytd || 0) * 4;
  const events = c => {
    c.req = (c.req || []).filter(r => r.exp >= S.day); if (c.listed || c.req.length >= 2) return;
    const H = (c.reg || []).filter(h => (h.k === 'inv' || h.k === 'vil' || h.k === 'ofc') && h.p > 0.01); if (!H.length || Math.random() > 0.05) return;
    const h = H[Math.floor(Math.random() * H.length)];
    if (c.req.some(r => r.who === h.n)) return;
    if (Math.random() < 0.65) { const p = +(h.p * rnd(0.5, 1)).toFixed(3), price = Math.round(valueOf(c) * p * 0.95); c.req.push({ t: 'sell', who: h.n, pct: p, price, exp: S.day + 14 }); Phone.msg(h.n, `ผมขอขายหุ้น ${c.name} ที่ถืออยู่ ${(p * 100).toFixed(1)}% คืนให้คุณ ราคา ${baht0(price)} สนใจไหม (ตอบภายใน 14 วัน)`, true); }
    else { const p = +Math.min(0.1, Math.max(0.03, h.p * 0.5)).toFixed(3), price = Math.round(valueOf(c) * p / (1 - p) * 0.9); c.req.push({ t: 'buy', who: h.n, pct: p, price, exp: S.day + 14 }); Phone.msg(h.n, `ผมอยากซื้อหุ้น ${c.name} เพิ่มอีก ${(p * 100).toFixed(1)}% ราคา ${baht0(price)} ช่วยพิจารณาให้หน่อย (ต้องผ่านที่ประชุมผู้ถือหุ้น)`, true); }
  };
  { const _w = Company.week; Company.week = function () {
    const r = _w.apply(this, arguments);
    try {
      for (const c of Company.list()) {
        if (c.st !== 'open') continue; const tr = A.tier(c); if (c.lastBoard == null) c.lastBoard = S.day; if (c.lastAgm == null) c.lastAgm = S.day;
        const bd = S.day - c.lastBoard;
        if (bd > 42 && S.day - (c.fineB || 0) >= 7) { c.fineB = S.day; c.rep = Math.max(0, (c.rep || 50) - 1); (c.board || []).forEach(d => { d.mood = clamp((d.mood == null ? 50 : d.mood) - 3, 5, 98); }); Phone.msg(c.name, '⚠️ ไม่ได้ประชุมคณะกรรมการเกิน 6 สัปดาห์ (ควรประชุมอย่างน้อยทุกไตรมาส) ชื่อเสียงลดและกรรมการไม่พอใจ', true); }
        else if (bd > 35 && bd <= 42 && c.warnB !== c.lastBoard) { c.warnB = c.lastBoard; Phone.msg(c.name, 'เตือน: ใกล้ถึงกำหนดประชุมคณะกรรมการประจำไตรมาส', false); }
        if (tr.both) {
          const ad = S.day - c.lastAgm;
          if (ad > 112 && S.day - (c.fineA || 0) >= 7) { c.fineA = S.day; c.cash -= 5000; Company.book(c, 0, 5000); c.rep = Math.max(0, (c.rep || 50) - 2); moodAll(c, -4); Phone.msg(c.name, '⚠️ ไม่ได้จัดประชุมสามัญผู้ถือหุ้นประจำปีภายในกำหนด ถูกปรับ 5,000 ฿ ผู้ถือหุ้นไม่พอใจ ชื่อเสียงลด', true); }
          else if (ad > 98 && ad <= 112 && c.warnA !== c.lastAgm) { c.warnA = c.lastAgm; Phone.msg(c.name, 'เตือน: ใกล้ครบกำหนดประชุมสามัญผู้ถือหุ้นประจำปี (ต้องจัดปีละครั้ง)', false); }
        }
        events(c);
      }
    } catch (e) { console.warn('v219 week', e); }
    return r;
  }; }

  // ================= 6. power of the holders, IPO needs a resolution =================
  const _ipo = (typeof Stock !== 'undefined' && Stock) ? Stock.ipo : null;
  if (_ipo) Stock.ipo = function (c) { if (c && !c.listed && !c.ipoOK) { UI.toast('การเข้าตลาดหลักทรัพย์ต้องผ่านมติที่ประชุมผู้ถือหุ้น/บอร์ดก่อน (วาระ "อนุมัติแผน IPO" มติพิเศษ ¾)', '🏛️'); return; } return _ipo.apply(this, arguments); };
  { const _mk = UI.H.mkipo; if (_mk) UI.H.mkipo = function (d) { const c = Company.get(+d.v); if (c && !c.listed && !c.ipoOK) { UI.toast('การเข้าตลาดหลักทรัพย์ต้องผ่านมติที่ประชุมก่อน (วาระ "อนุมัติแผน IPO")', '🏛️'); return; } return _mk.apply(this, arguments); }; }
  Object.assign(UI.H, {
    ag219sell: d => {
      const c = Company.get(+d.v), i = +d.i, r = c && (c.req || [])[i]; if (!r || r.t !== 'sell') return;
      if (S.money < r.price) { UI.toast(`เงินสดของคุณไม่พอ (ต้อง ${baht0(r.price)})`, '💸'); return; }
      const h = (c.reg || []).find(x => x.n === r.who); if (!h) { c.req.splice(i, 1); return; }
      S.money -= r.price; try { Bank2.log('ซื้อหุ้นคืนจาก ' + r.who + ' (' + c.name + ')', -r.price); } catch (e) { }
      h.p = Math.max(0, h.p - r.pct); if (h.p < 0.0005) c.reg.splice(c.reg.indexOf(h), 1); c.mine = Math.min(1, (c.mine == null ? 1 : c.mine) + r.pct);
      c.req.splice(i, 1); Phone.msg(r.who, 'ขอบคุณที่ซื้อหุ้นคืน ยินดีที่ได้ร่วมงานกัน', false); UI.toast(`ซื้อหุ้นคืน ${(r.pct * 100).toFixed(1)}% แล้ว สัดส่วนของคุณ ${Math.round(c.mine * 100)}%`, '🤝');
    },
    ag219buy: d => {
      const c = Company.get(+d.v), i = +d.i, r = c && (c.req || [])[i]; if (!r || r.t !== 'buy') return;
      c.pend = c.pend || []; if (!c.pend.some(p => p.who === r.who)) c.pend.push({ who: r.who, pct: r.pct, price: r.price, day: S.day });
      c.req.splice(i, 1); UI.toast(`รับพิจารณาข้อเสนอของ ${r.who} จะถูกใส่ในวาระประชุมผู้ถือหุ้น`, '🤝');
    },
    ag219rej: d => { const c = Company.get(+d.v), i = +d.i, r = c && (c.req || [])[i]; if (!r) return; const h = (c.reg || []).find(x => x.n === r.who); if (h) h.mood = clamp((h.mood == null ? 50 : h.mood) - 6, 5, 98); c.req.splice(i, 1); },
  });
  // merge two lines of the same person in the register (a holder who buys more)
  { const _ap = A.applyEx; A.applyEx = (m, it) => {
    const c = m.key.startsWith('co:') ? Company.get(+m.key.slice(3)) : null, w = it.who;
    if (c) {
      if (it.t === 'dirx') { const B = B7.board(c), i = B.findIndex(d => d.n === w); if (i < 0) return 'ไม่พบกรรมการ'; B.splice(i, 1); if (c.chair === w) c.chair = null; return `${w} พ้นจากตำแหน่งกรรมการ`; }
      if (it.t === 'chair') { c.chair = w === 'me' ? null : w; return c.chair ? `${w} เป็นประธานกรรมการคนใหม่ (คุณไม่มีเสียงชี้ขาดเมื่อคะแนนเสมออีกแล้ว)` : 'คุณกลับมาเป็นประธานคณะกรรมการ'; }
      if (it.t === 'ipo') { c.ipoOK = S.day; return 'อนุมัติแผนเข้าตลาดหลักทรัพย์แล้ว เริ่มขั้นตอน IPO ได้ที่แอปหุ้นหรือหน้าบริษัท'; }
    }
    const r = _ap ? _ap(m, it) : null;
    if (c && r) {
      if (it.t === 'dir' && /เข้าเป็นกรรมการ/.test(r)) { const d = B7.board(c).find(x => x.n === w); if (d) { d.trait = it.v === 2 ? 'indep' : randTrait(); d.since = S.day; } }
      if (it.t === 'divp' && /จ่ายปันผล/.test(r)) c.divDay = S.day;
      if (it.t === 'aud' && /แต่งตั้ง/.test(r)) c.audDay = S.day;
      if (it.t === 'bonus' && /จ่ายโบนัส/.test(r)) c.bonusDay = S.day;
      if (it.t === 'newholder' && w && c.reg) { const same = c.reg.filter(h => h.n === w); if (same.length > 1) { same[0].p = same.reduce((a, h) => a + h.p, 0); c.reg = c.reg.filter(h => h === same[0] || h.n !== w); } }
    }
    return r;
  }; }

  // ================= panels in the company window =================
  A.govPanels = (c, tr) => {
    const R = c.req || [], pend = c.prom || [];
    const reqs = R.length ? `<h5>📨 ข้อเสนอจากผู้ถือหุ้น</h5>${R.map((r, i) => `<div class="card"><div class="cb"><p class="lead">${r.t === 'sell' ? `<b>${E(r.who)}</b> ขอขายหุ้นคืน ${(r.pct * 100).toFixed(1)}% ราคา ${baht0(r.price)}` : `<b>${E(r.who)}</b> ขอซื้อหุ้นเพิ่ม ${(r.pct * 100).toFixed(1)}% ราคา ${baht0(r.price)} (ต้องผ่านที่ประชุมผู้ถือหุ้น มติพิเศษ ¾)`} <span class="dim">· ตอบภายใน ${RD(r.exp)}</span></p><div class="row">${r.t === 'sell' ? `<button class="btn" data-a="ag219sell" data-v="${c.id}" data-i="${i}">ซื้อคืนด้วยเงินของคุณ</button>` : `<button class="btn" data-a="ag219buy" data-v="${c.id}" data-i="${i}">รับพิจารณา (ส่งเข้าที่ประชุม)</button>`}<button class="btn ghost" data-a="ag219rej" data-v="${c.id}" data-i="${i}">ปฏิเสธ</button></div></div></div>`).join('')}` : '';
    const prom = pend.length ? `<h5>📝 คำมั่นที่ค้างอยู่</h5><ul class="lead">${pend.map(p => `<li>${E(p.txt)} — ภายใน ${RD(p.due)} (รับปากกับ ${E(p.who)})</li>`).join('')}</ul>` : '';
    const lb = c.lastBoard == null ? '-' : RD(c.lastBoard), la = c.lastAgm == null ? '-' : RD(c.lastAgm);
    const law = `<p class="dim">ตามกฎ: ประชุมคณะกรรมการอย่างน้อยทุกไตรมาส (ครั้งล่าสุด ${lb}) ${tr.both ? `· ประชุมสามัญผู้ถือหุ้นปีละครั้ง (ครั้งล่าสุด ${la}) ขาดแล้วถูกปรับและชื่อเสียงลด` : ''}${(c.loan || 0) ? ` · หนี้เงินกู้ ${baht0(c.loan)}` : ''}${c.ipoOK ? ' · ✅ ได้มติ IPO แล้ว' : ''}</p>`;
    return `${reqs}${prom}${law}<h5>📜 รายงานการประชุมย้อนหลัง</h5>${archHtml(c)}`;
  };

  // ================= the shareholders' meeting: information panels =================
  const staffCnt = c => (c.staff || []).length;
  A.agmInfo = (n, SS) => {
    const c = SS.f && SS.f.c; if (!c) return ''; const f = SS.f, R = A.reg(c), mine = c.mine == null ? 1 : c.mine, amin = c.amin;
    const room = (window.Biz212 && Biz212.distributable) ? Biz212.distributable(c) : Math.max(0, Math.round(c.cash - (c.paid || 0) - 100000));
    if (n === 1) {
      const block = R.filter(h => h.p > 0.25).map(h => `${E(h.n)} ${pc(h.p)}`);
      const L = [`ประชุม${SS.m.items.some(i => i.t === 'minp') ? 'สามัญประจำปี' : 'ผู้ถือหุ้น'} ${E(c.name)} · ผู้ถือหุ้นที่มา ${SS.att.length + 1} ราย คิดเป็น ${pc(SS.attP)} ของหุ้นทั้งหมด`, `คุณถือ ${pc(mine)} ${mine >= 0.75 ? '→ ผ่านมติพิเศษ (¾) ได้ด้วยเสียงของคุณเอง' : mine > 0.5 ? '→ ผ่านมติธรรมดาได้เอง แต่มติพิเศษ (¾) ต้องมีเสียงสนับสนุน' : '→ ต้องหาเสียงสนับสนุนทุกมติ'}`];
      if (block.length) L.push(`⛔ ผู้ถือหุ้นที่ถือเกิน 25% ขวางมติพิเศษได้: ${block.join(', ')}`);
      if (c.divRec != null) L.push(`บอร์ดเสนอนโยบายปันผล ${pct(c.divRec)} ของกำไรที่จ่ายได้`);
      for (const p of (c.pend || [])) L.push(`🏡 ${E(p.who)} ขอร่วมหุ้น ${pct(p.pct)} ราคา ${baht0(p.price)} (วาระที่ 8)`);
      return card('📢 ประธานแจ้งที่ประชุม', ul(L)) + promoHtml(SS, c);
    }
    if (n === 2) return card('📝 รายงานการประชุมผู้ถือหุ้นครั้งก่อน', amin ? `<p class="dim">ประชุมวันที่ ${RD(amin.day)}</p>${ul(amin.rows.map(x => `${x.pass ? '✅' : '❌'} ${E(x.txt)}`))}` : '<p class="dim">ยังไม่มีรายงานครั้งก่อน (นี่คือการประชุมผู้ถือหุ้นครั้งแรก) ที่ประชุมจะลงมติรับรองเป็นฉบับแรก</p>');
    if (n === 3) return ((A.boardInfoOld || A.boardInfo) ? (A.boardInfoOld || A.boardInfo)(4, SS) : '') + promoHtml(SS, c);
    if (n === 4) {
      const mon = (c.mon || []).slice(0, 3);
      return card('📑 งบการเงินที่เสนอให้อนุมัติ', ul([`ทุนที่ชำระแล้ว ${baht0(c.paid || 0)} · กำไรสะสมปีนี้ ${baht0(Math.round(f.ytd))} · เงินสด ${baht0(Math.round(f.cash))} · หนี้ ${baht0(c.loan || 0)}`, c.aud ? `✅ ผู้สอบบัญชี ${E(audName(c))} ตรวจสอบและรับรองงบแล้ว` : '⚠️ ยังไม่มีผู้สอบบัญชี งบยังไม่ผ่านการตรวจสอบจากบุคคลอิสระ']) + (mon.length ? `<table class="tbl" style="width:100%"><tr><th>รอบปิดงบ</th><th>รายรับ</th><th>ค่าใช้จ่าย</th><th>เงินคงเหลือ</th></tr>${mon.map(m => `<tr><td>${RD(m.d)}</td><td>${baht0(m.rev)}</td><td>${baht0(m.cost)}</td><td>${baht0(m.close)}</td></tr>`).join('')}</table>` : ''));
    }
    if (n === 5) {
      const rows = [0, 0.3, 0.5, 0.7].map(v => { const amt = Math.round(room * v), my = Math.round(amt * mine * 0.9); return `<tr${c.divRec === v ? ' style="outline:1px solid var(--sun)"' : ''}><td>${v ? pct(v) : 'งดจ่าย'}${c.divRec === v ? ' ⭐ บอร์ดเสนอ' : ''}</td><td>${baht0(amt)}</td><td>${baht0(my)}</td><td>${baht0(amt - Math.round(amt * mine))}</td></tr>`; }).join('');
      return card('💸 กำไรที่จ่ายปันผลได้และทางเลือก', ul([`กำไรที่จ่ายปันผลได้ (หลังเหลือเงินสำรอง) ${baht0(room)} · ปันผลครั้งล่าสุด ${c.divDay ? RD(c.divDay) : 'ยังไม่เคยจ่าย'}`]) + `<table class="tbl" style="width:100%"><tr><th>อัตรา</th><th>เงินที่จ่ายออก</th><th>คุณได้ (หลังภาษี 10%)</th><th>ผู้ถือหุ้นอื่นได้</th></tr>${rows}</table>`);
    }
    if (n === 6) {
      const B = B7.board(c); return card('👔 กรรมการและค่าตอบแทน', `<table class="tbl" style="width:100%"><tr><th>กรรมการ</th><th>ลักษณะ</th><th>ดำรงตำแหน่ง</th><th>อารมณ์</th></tr><tr><td><b>คุณ</b></td><td>${c.chair ? 'กรรมการ' : '👑 ประธาน'}</td><td>—</td><td>—</td></tr>${B.map(d => `<tr><td>${E(d.n)}${c.chair === d.n ? ' 👑' : ''}</td><td>${E(A.traitName(d.trait))}</td><td>${Math.max(0, S.day - (d.since || S.day))} วัน${S.day - (d.since || S.day) >= 84 ? ' · ครบวาระ' : ''}</td><td>${face(d.mood == null ? 50 : d.mood)}</td></tr>`).join('')}</table><p class="dim">ค่าตอบแทนกรรมการ ${c.dfee ? baht0(c.dfee) + '/คน/เดือน (รวม ' + baht0(c.dfee * B.length) + '/เดือน)' : 'ไม่จ่าย'}</p>`);
    }
    if (n === 7) return card('🧮 ผู้สอบบัญชี', ul([`ผู้สอบบัญชีปัจจุบัน: ${c.aud ? E(audName(c)) + ` (ค่าตรวจ ${baht0(c.audFee || 0)}/ปี)` : '❌ ยังไม่มี'}`, `ระบบควบคุมภายใน ${c.ctrl ? '✅' : '❌'} · ประกัน ${c.insured ? '✅' : '❌'} · งบประมาณ ${c.bud ? '✅' : '❌'} (ผู้สอบบัญชีจะดูสิ่งเหล่านี้)`]));
    const L = [`ทุนจดทะเบียน ${baht0(c.cap || 0)} ชำระแล้ว ${baht0(c.paid || 0)}`, `การเข้าตลาดหลักทรัพย์: ${c.listed ? '✅ จดทะเบียนแล้ว' : c.ipoOK ? '✅ ได้มติเริ่มขั้นตอน IPO แล้ว' : 'ยังไม่ได้อนุมัติ'}`];
    for (const p of (c.pend || [])) L.push(`🏡 ข้อเสนอร่วมหุ้น: ${E(p.who)} ${pct(p.pct)} ราคา ${baht0(p.price)}`);
    return card('🗣️ วาระพิเศษและเรื่องอื่น ๆ', ul(L) + '<p class="dim">วาระพิเศษ เช่น เพิ่มทุน รับผู้ถือหุ้นใหม่ แก้ข้อบังคับ แผน IPO ต้องผ่านมติพิเศษ (¾) หลังจากนั้นผู้ถือหุ้นซักถามเรื่องอื่นๆ ได้</p>');
  };
  // questions of the shareholders' meeting built from the real books, and the extras for both meetings
  const mkq = (id, text, o) => ({ id, text, o });
  const agmDyn = (n, SS) => {
    const c = SS.f && SS.f.c; if (!c) return []; const f = SS.f, L = [], R = A.reg(c), mine = c.mine == null ? 1 : c.mine;
    if (n === 3) {
      const mon = c.mon || [];
      if (mon.length >= 2 && mon[1].rev > 0) { const ch = (mon[0].rev - mon[1].rev) / mon[1].rev, up = ch >= 0; L.push(mkq('ag_trend', `รายรับรอบล่าสุด ${baht0(mon[0].rev)} ${up ? 'เพิ่มขึ้น' : 'ลดลง'} ${Math.abs(Math.round(ch * 100))}% จากรอบก่อน ผู้ถือหุ้นอยากทราบสาเหตุครับ`, up ? [['มาจากสัญญาใหม่และลูกค้าประจำ น่าจะต่อเนื่อง', 6], ['เป็นช่วงฤดูกาล ไม่แน่ใจว่าจะต่อเนื่อง', 1], ['ไม่ทราบสาเหตุแน่ชัด', -4]] : [['แยกสาเหตุเป็นรายสัญญา/สาขา และมีแผนแก้ภายใน 1 รอบ', 6], ['ตลาดโดยรวมชะลอตัว', -3], ['ยังไม่ได้วิเคราะห์', -6]])); }
    }
    if (n === 4 && !c.aud) L.push(mkq('ag_noaud', 'งบการเงินนี้ยังไม่ได้ผ่านผู้สอบบัญชีอิสระ ผู้ถือหุ้นจะเชื่อถือตัวเลขได้อย่างไร?', [['จะเสนอแต่งตั้งผู้สอบบัญชีในวาระที่ 7 และให้ตรวจงบย้อนหลัง', 5, null, 0, 'aud'], ['งบนี้นักบัญชีจัดทำถูกต้องแล้ว', -6], ['ผู้ถือหุ้นเชื่อใจฝ่ายบริหารได้', -8]]));
    if (n === 5) {
      if ((c.loan || 0) > 0 && (c.divRec == null || c.divRec > 0)) L.push(mkq('ag_divloan', `บริษัทมีหนี้ ${baht0(Math.round(c.loan))} แต่ยังจะจ่ายปันผล ถ้าเงินสดไม่พอจะทำอย่างไร?`, [['จ่ายเท่าที่เงินสดเหลือเพียงพอ และชำระหนี้ตามแผน', 5, f => f.cash > f.loan * 0.3], ['กู้เพิ่มเพื่อจ่ายปันผล', -7], ['งดปันผลจนกว่าจะหมดหนี้', 1]]));
      if (f.ytd > 300000 && c.divRec === 0) L.push(mkq('ag_nodiv', 'บริษัทมีกำไรแต่บอร์ดเสนองดปันผล ผู้ถือหุ้นขอทราบเหตุผล', [['ต้องเก็บกำไรไว้ลงทุนตามแผนที่บอร์ดอนุมัติ และจะจ่ายเมื่อโครงการเสร็จ', 2, null, 0, 'div'], ['เจ้าของยังไม่ต้องการเงินปันผล', -6], ['จะจ่ายปันผลปีหน้าแน่นอน', 3, null, 0, 'div']]));
    }
    if (n === 6) {
      const B = B7.board(c), old = B.slice().sort((a, b) => (a.since || 0) - (b.since || 0))[0];
      if (B.length < 3) L.push(mkq('ag_fewdir', `คณะกรรมการมีเพียง ${B.length + 1} คน ไม่มีกรรมการอิสระถ่วงดุล ผู้ถือหุ้นรายย่อยจะมั่นใจได้อย่างไร?`, [['จะเสนอแต่งตั้งกรรมการอิสระในที่ประชุมครั้งนี้หรือครั้งหน้า', 6], ['ธุรกิจยังเล็ก ไม่ต้องมีหลายคน', -3], ['คนที่มีอยู่เพียงพอ', -5]]));
      if (old && S.day - (old.since || S.day) >= 84) L.push(mkq('ag_tenure', `กรรมการ ${old.n} ดำรงตำแหน่งมานาน ${S.day - old.since} วัน ผลงานเป็นอย่างไร ควรเลือกตั้งอีกวาระไหม?`, [['ประเมินผลงานและการเข้าประชุมของกรรมการต่อที่ประชุม', 6], ['ทำงานดีมาก ไม่ต้องประเมินใหม่', 0], ['กรรมการท่านนี้เป็นคนของผม ไม่ต้องถาม', -7]]));
    }
    if (n === 7 && c.aud) L.push(mkq('ag_audfee', `ค่าสอบบัญชี ${baht0(c.audFee || 0)} ต่อปี สมเหตุสมผลกับขนาดบริษัทหรือไม่ และผู้สอบบัญชีเปลี่ยนมาแล้วกี่ปี?`, [['เทียบราคาจากสำนักงานบัญชีหลายแห่งและกำหนดรอบเปลี่ยนผู้สอบ', 6], ['ใช้เจ้าเดิมเพราะรู้ธุรกิจดี', 0], ['ไม่ทราบรายละเอียด', -5]]));
    if (n === 8) {
      for (const p of (c.pend || [])) { L.push(mkq('ag_pend', `ผู้ถือหุ้นขอทราบเรื่องการรับ ${p.who} เป็นผู้ถือหุ้นใหม่ ${Math.round(p.pct * 100)}% ราคา ${baht0(p.price)} ราคานี้เป็นธรรมกับผู้ถือหุ้นเดิมหรือไม่?`, [['อธิบายวิธีประเมินมูลค่าและให้ผู้ถือหุ้นเดิมมีสิทธิจองก่อน', 7], ['ราคาตกลงกันได้จากการเจรจา', -3], ['ผู้ถือหุ้นเดิมไม่ต้องกังวล', -6]])); break; }
      const big = R.find(h => h.p > 0.25);
      if (big && mine < 0.75) L.push(mkq('ag_block', `ผู้ถือหุ้นรายใหญ่ ${big.n} ถือ ${pc(big.p)} มีสิทธิขวางมติพิเศษ ผู้บริหารจะรับฟังเสียงของผู้ถือหุ้นรายนี้อย่างไร?`, [['ประชุมหารือกับผู้ถือหุ้นรายใหญ่ล่วงหน้าก่อนเสนอวาระสำคัญทุกครั้ง', 6], ['ใช้เสียงข้างมากโดยไม่ต้องคุยก่อน', -4], ['เสนอซื้อหุ้นคืนเพื่อลดอำนาจต่อรอง', 1]]));
    }
    return L;
  };
  { const _dq = A.dynQ; A.dynQ = (n, SS) => {
    const c = SS.f && SS.f.c, base = SS.board ? (_dq ? _dq(n, SS) : []) : agmDyn(n, SS), L = [];
    if (c && n === 3 && SS.promo && SS.promo.bad.length) { const p = SS.promo.bad[0]; L.push(mkq('dy_broken', `ครั้งก่อนคุณรับปากว่า "${p.txt}" แต่ตอนนี้ยังไม่ได้ทำ ผู้ถือหุ้นขอคำอธิบาย`, [['ยอมรับว่าล่าช้า และกำหนดวันที่ทำได้จริงพร้อมผู้รับผิดชอบ', 3], ['สถานการณ์เปลี่ยน จึงยังไม่ได้ทำ', -5], ['ไม่เคยรับปากแบบนั้น', -10]])); }
    if (c && SS.board && n === 5 && !c.bud) L.push(mkq('dy_nobud', 'ปีนี้ยังไม่มีงบประมาณที่บอร์ดอนุมัติ แล้วจะควบคุมค่าใช้จ่ายและวัดผลงานได้อย่างไร?', [['จะเสนองบประมาณเข้าอนุมัติภายใน 3 สัปดาห์', 5, null, 0, 'budget'], ['ใช้ประสบการณ์ของผู้บริหารควบคุมไปก่อน', -5], ['งบประมาณทำให้ธุรกิจไม่ยืดหยุ่น', -7]]));
    if (c && SS.board && n === 7 && !c.ctrl) L.push(mkq('dy_noctrl', 'ยังไม่มีระบบควบคุมภายในและตรวจสอบภายใน ถ้ามีทุจริตจะรู้ได้อย่างไร?', [['จะเสนอตั้งระบบควบคุมภายในในที่ประชุมบอร์ดครั้งถัดไป', 6, null, 0, 'ctrl'], ['ไว้ใจพนักงานทุกคน', -6], ['เจ้าของตรวจเองได้', -3]]));
    return L.concat(base);
  }; }
});
