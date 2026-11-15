'use strict';
// ---------- v243: company insurance and internal control (real, connected systems) ----------
// Before this, "insurance" and "internal control" were a flat fee in a board resolution that only set a flag. Now:
//  - the board resolution gives the AUTHORITY to buy (when the company has directors); the purchase itself is made on the company page,
//    tab "ใบอนุญาต/ระบบ/ทรัพย์สิน" > "🛡️ ประกันภัยบริษัท" and "🧰 ระบบควบคุมภายในบริษัท"
//  - 6 insurance products from 3 insurers, priced from the company's insurable value and size, valid 365 days, renewed (or lapsing) at the end
//  - 5 internal-control measures (one-off cost + monthly running cost) that give a control score; the company counts as "having internal control" at 50 points
//  - company incidents (fire, flood, theft, fraud, cyber attack, lawsuit, staff injury) happen at random; controls reduce the loss, the policy pays a share of what is left
//  - c.insured / c.ctrl (read by the board, the answers to shareholder questions and the executives' promises) follow the real state
V23.add('v243_risk', function () {
  if (typeof Company === 'undefined' || !Company.html || !Company.list) return;
  const E = s => (typeof esc === 'function' ? esc(s) : String(s));
  const B = n => (typeof baht0 === 'function' ? baht0(n) : typeof baht === 'function' ? baht(n) : Math.round(n).toLocaleString('en-US') + ' ฿');
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const R = c => { const r = c.rk = c.rk || {}; r.pol = r.pol || {}; r.ic = r.ic || {}; r.log = r.log || []; if (r.auto == null) r.auto = 1; return r; };

  // ----- products -----
  const PROD = {
    prop: { i: '🔥', n: 'ประกันอัคคีภัยและทรัพย์สิน', min: 12000, rate: 0.004, share: 0.8, ded: 0.05, cov: 'ไฟไหม้ น้ำท่วม โจรกรรมทรัพย์สินของบริษัท จ่าย 80% ของความเสียหาย (บริษัทรับส่วนแรก 5%) วงเงินเท่ามูลค่าทรัพย์สินที่เอาประกัน' },
    liab: { i: '⚖️', n: 'ประกันความรับผิดต่อบุคคลภายนอก', min: 8000, rate: 0.0015, per: 150, share: 0.9, limit: 2000000, cov: 'ลูกค้าหรือผู้เสียหายฟ้องเรียกค่าเสียหาย จ่าย 90% วงเงินสูงสุด 2,000,000 ฿ ต่อปี' },
    cash: { i: '💵', n: 'ประกันเงินสดและความซื่อสัตย์ของพนักงาน', min: 6000, rate: 0.001, share: 0.7, limit: 500000, cov: 'พนักงานทุจริต เบิกจ่ายผิดปกติ ยักยอก จ่าย 70% วงเงินสูงสุด 500,000 ฿ (ถ้ามีระบบควบคุมภายในครบ 50 คะแนน เบี้ยลด 20%)' },
    cyber: { i: '🛡️', n: 'ประกันภัยไซเบอร์', min: 15000, rate: 0.002, share: 0.7, limit: 1000000, cov: 'ข้อมูลรั่ว แรนซัมแวร์ ระบบถูกเจาะ จ่าย 70% วงเงินสูงสุด 1,000,000 ฿' },
    group: { i: '🩹', n: 'ประกันอุบัติเหตุและสุขภาพกลุ่มพนักงาน', min: 6000, per: 1500, share: 1, limit: 300000, cov: 'พนักงานบาดเจ็บหรือเจ็บป่วยจากการทำงาน จ่ายเต็ม วงเงิน 300,000 ฿ ต่อเหตุ (เบี้ย 1,500 ฿ ต่อคนต่อปี)' },
    bi: { i: '⏸️', n: 'ประกันธุรกิจหยุดชะงัก (ต้องมีประกันทรัพย์สิน)', min: 8000, share: 1, req: 'prop', cov: 'ไฟไหม้หรือน้ำท่วมจนต้องหยุดกิจการ ชดเชยรายได้ที่เสียไประหว่างหยุด (ส่วนที่ประกันทรัพย์สินไม่คุ้มครอง) เบี้ย 60% ของประกันทรัพย์สิน' },
  };
  const INS = {
    sukjai: { n: 'สุขใจประกันภัย', pm: 1.0, pay: 1.0, note: 'เบี้ยมาตรฐาน จ่ายสินไหมเต็มตามกรมธรรม์' },
    mankhong: { n: 'มั่นคงวินาศภัย', pm: 0.88, pay: 0.9, note: 'เบี้ยถูกกว่า 12% แต่จ่ายสินไหมเพียง 90% ของที่กรมธรรม์ให้' },
    thungthong: { n: 'ทุ่งทองอินชัวรันส์', pm: 1.15, pay: 1.0, fast: 1, note: 'เบี้ยแพงกว่า 15% จ่ายสินไหมไวและเคลมสำเร็จแล้วชื่อเสียงบริษัท +1' },
  };
  // ----- internal control -----
  const IC = {
    seg: { i: '🔀', n: 'แยกหน้าที่และกำหนดวงเงินอนุมัติ', cost: 8000, mo: 0, pts: 25, mit: 0.25, how: 'จ้างที่ปรึกษาทำคู่มือ: ผู้ขอเบิก ผู้อนุมัติ และผู้จ่ายเงิน เป็นคนละคน มีวงเงินอนุมัติแต่ละระดับ', gain: 'ความเสียหายจากทุจริตลด 25%' },
    erp: { i: '🧾', n: 'ระบบบัญชี/ERP พร้อมบันทึกการเข้าถึง', cost: 90000, mo: 1800, pts: 25, mit: 0.25, how: 'ติดตั้งซอฟต์แวร์บัญชีที่ล็อกสิทธิ์ผู้ใช้และเก็บประวัติการแก้ไขทุกรายการ', gain: 'ความเสียหายจากทุจริตลด 25%' },
    aud: { i: '🕵️', n: 'ผู้ตรวจสอบภายใน (จ้างสำนักงานบัญชีภายนอก)', cost: 15000, mo: 6000, pts: 30, mit: 0.35, how: 'สำนักงานบัญชีภายนอกเข้าตรวจเอกสารและการเบิกจ่ายทุกเดือน รายงานตรงถึงบอร์ด', gain: 'ตรวจพบทุจริตเร็ว ความเสียหายลด 35%' },
    hot: { i: '📞', n: 'สายด่วนแจ้งเบาะแสและจรรยาบรรณ', cost: 12000, mo: 500, pts: 10, mit: 0.1, how: 'เปิดช่องทางลับให้พนักงานแจ้งเรื่องไม่ชอบมาพากล พร้อมประกาศจรรยาบรรณ', gain: 'ความเสียหายจากทุจริตลด 10% และชื่อเสียง +2 (ครั้งเดียว)' },
    vault: { i: '📹', n: 'กล้องวงจรปิดและตู้นิรภัย', cost: 45000, mo: 800, pts: 10, mit: 0, how: 'ติดกล้องทุกจุดเก็บเงินและตู้นิรภัยเก็บเงินสด', gain: 'ความเสียหายจากโจรกรรมลด 50% และเบี้ยประกันทรัพย์สินลด 10%' },
  };
  const NEED = 50;

  // ----- numbers -----
  const openBr = c => (c.br || []).filter(b => b.st === 'open').length;
  const value = c => Math.max(500000, Math.round((c.cash || 0) * 0.5 + openBr(c) * 800000 + (c.paid || c.cap || 0) * 0.4 + (c.staff || []).length * 25000));
  const score = c => { const r = R(c); let s = 0; for (const k in IC) if (r.ic[k] && !r.ic[k].off) s += IC[k].pts; return s; };
  const hasIC = (c, k) => { const x = R(c).ic[k]; return !!(x && !x.off); };
  const mitFraud = c => Math.min(0.85, Object.keys(IC).reduce((t, k) => t + (hasIC(c, k) ? IC[k].mit : 0), 0));
  const active = (c, p) => { const x = R(c).pol[p]; return x && x.until >= S.day ? x : null; };
  const premium = (c, p, ik) => {
    const P = PROD[p], I = INS[ik] || INS.sukjai, v = value(c), n = (c.staff || []).length;
    let x = p === 'bi' ? premium(c, 'prop', 'sukjai') * 0.6 : Math.max(P.min, (P.rate || 0) * v + (P.per || 0) * n);
    if (p === 'group') x = Math.max(P.min, P.per * n);
    if (p === 'cash' && score(c) >= NEED) x *= 0.8;
    if (p === 'prop' && hasIC(c, 'vault')) x *= 0.9;
    return Math.max(P.min, Math.round(x * I.pm / 100) * 100);
  };
  const sync = c => {
    const r = R(c);
    if (!r.mig) {      // an old save: the flat-fee flags become a real policy and real measures once
      r.mig = 1;
      if (c.insured && !r.pol.prop) r.pol.prop = { ins: 'sukjai', day: c.insured, until: c.insured + 365, prem: 40000 };
      if (c.ctrl && !r.ic.seg) { r.ic.seg = { day: c.ctrl, free: 1 }; r.ic.erp = { day: c.ctrl, free: 1 }; }
    }
    const p = active(c, 'prop'); c.insured = p ? p.day : 0;
    if (score(c) >= NEED) { if (!c.ctrl) c.ctrl = S.day; } else c.ctrl = 0;
  };
  const msg = (from, t) => { try { Phone.msg(from, t, false); } catch (e) { } };
  const hist = (c, t) => { try { c.hist.unshift(`${RD(S.day)}: ${t}`); } catch (e) { } };
  const pay = (c, amt, why) => { c.cash -= amt; try { Company.book(c, 0, amt); } catch (e) { } hist(c, `${why} ${B(amt)}`); };
  const needBoard = c => { try { return window.Board217 && Board217.board(c).length > 0; } catch (e) { return false; } };
  const authOK = (c, k) => { if (!needBoard(c)) return true; const a = R(c)[k]; return !!a && S.day - a <= 365; };

  // ----- incidents -----
  const KINDS = [
    { id: 'fire', n: 'ไฟไหม้', cls: 'prop', p: 1 / 900, stop: 0.4, loss: v => v * rnd(0.08, 0.3), t: 'เกิดไฟไหม้ที่ทำการ' },
    { id: 'flood', n: 'น้ำท่วม', cls: 'prop', p: 1 / 700, stop: 0.5, loss: v => v * rnd(0.05, 0.2), t: 'น้ำท่วมที่ทำการ' },
    { id: 'theft', n: 'โจรกรรม', cls: 'prop', p: 1 / 500, loss: v => v * rnd(0.01, 0.05), t: 'มีคนร้ายงัดทรัพย์สินและเงินสด' },
    { id: 'fraud', n: 'พนักงานทุจริต', cls: 'cash', p: 1 / 300, loss: (v, c) => 20000 + Math.max(0, c.cash || 0) * rnd(0.01, 0.05), t: 'ตรวจพบการเบิกจ่ายผิดปกติ มีพนักงานทุจริต' },
    { id: 'cyber', n: 'ข้อมูลรั่ว/แรนซัมแวร์', cls: 'cyber', p: 1 / 600, loss: v => 30000 + v * rnd(0.01, 0.06), t: 'ระบบถูกเจาะ ข้อมูลรั่วไหลและถูกเรียกค่าไถ่' },
    { id: 'lawsuit', n: 'ถูกฟ้องร้อง', cls: 'liab', p: 1 / 700, loss: v => 50000 + v * rnd(0.02, 0.1), t: 'ลูกค้าหรือผู้เสียหายฟ้องเรียกค่าเสียหาย' },
    { id: 'hurt', n: 'พนักงานบาดเจ็บ/เจ็บป่วย', cls: 'group', p: 1 / 500, loss: () => rnd(8000, 60000), t: 'พนักงานบาดเจ็บหรือเจ็บป่วยจากการทำงาน' },
  ];
  const incident = (c, k, forced) => {
    const K = typeof k === 'string' ? KINDS.find(x => x.id === k) : k; if (!K) return null;
    const r = R(c), v = value(c);
    let loss = Math.round(Math.min(K.loss(v, c), Math.max(40000, v * 0.4)));
    const note = [];
    if (K.id === 'fraud') { const m = mitFraud(c); if (m > 0) { loss = Math.round(loss * (1 - m)); note.push(`ระบบควบคุมภายในลดความเสียหาย ${Math.round(m * 100)}%`); } }
    if (K.id === 'theft' && hasIC(c, 'vault')) { loss = Math.round(loss / 2); note.push('กล้องและตู้นิรภัยลดความเสียหาย 50%'); }
    const stopLoss = K.stop ? Math.round(loss * K.stop) : 0;      // lost income while closed (only the business-interruption policy pays it)
    let base = loss, recv = 0, who = '';
    const pol = active(c, K.cls);
    if (pol) {
      const P = PROD[K.cls], I = INS[pol.ins] || INS.sukjai;
      const ded = base * (P.ded || 0);
      recv = Math.round(Math.min(P.limit || value(c), Math.max(0, base - ded) * P.share * I.pay));
      who = I.n;
      if (I.fast) { c.rep = clamp((c.rep || 0) + 1, 0, 100); }
    }
    let stopPaid = 0; const bi = K.stop ? active(c, 'bi') : null;
    if (bi) { const I = INS[bi.ins] || INS.sukjai; stopPaid = Math.round(stopLoss * I.pay); who = who || I.n; }
    const total = base + stopLoss, covered = recv + stopPaid, mine = total - covered;
    c.cash = Math.max(0, (c.cash || 0) - mine); try { Company.book(c, 0, mine); } catch (e) { }
    if (!pol && K.cls !== 'group') c.rep = clamp((c.rep || 0) - 1, 0, 100);
    const line = `${K.t} ความเสียหาย ${B(total)} · ${covered > 0 ? `${who} จ่ายสินไหม ${B(covered)} · บริษัทรับ ${B(mine)}` : `ไม่มีประกันที่คุ้มครอง บริษัทรับเต็มจำนวน`}${note.length ? ' · ' + note.join(' ') : ''}`;
    r.log.unshift({ day: S.day, k: K.id, n: K.n, loss: total, paid: covered }); if (r.log.length > 12) r.log.length = 12;
    hist(c, `${c.name}: ${line}`);
    if (!forced || forced === 'msg') msg('ฝ่ายบริหารความเสี่ยง · ' + c.name, (covered > 0 ? '✅ ' : '⚠️ ') + line + (covered > 0 ? '' : ' (ดูแพ็กเกจประกันได้ที่หน้าบริษัท > ใบอนุญาต/ระบบ/ทรัพย์สิน)'));
    return { loss: total, paid: covered, mine, note };
  };

  // ----- daily -----
  const month = () => { try { return Cal36.date(S.day).dom === 1; } catch (e) { return S.day % 30 === 0; } };
  const daily = () => {
    for (const c of Company.list()) {
      if (c.st !== 'open') continue;
      const r = R(c); sync(c);
      // renewal: warning 30 days before, then auto-renew with the same insurer or lapse
      for (const p in r.pol) {
        const x = r.pol[p]; if (!x) continue;
        if (x.until === S.day + 30) msg('บริษัทประกัน', `กรมธรรม์ ${PROD[p].n} ของ ${c.name} จะหมดอายุใน 30 วัน (ต่ออายุเบี้ย ${B(premium(c, p, x.ins))})${r.auto ? ' ระบบจะต่ออายุอัตโนมัติถ้าเงินบริษัทพอ' : ''}`);
        if (x.until < S.day && !x.lapsed) {
          const pr = premium(c, p, x.ins);
          if (r.auto && c.cash >= pr && (p !== 'bi' || active(c, 'prop'))) { pay(c, pr, `ต่ออายุ${PROD[p].n}`); x.day = S.day; x.until = S.day + 365; x.prem = pr; msg('บริษัทประกัน', `ต่ออายุ ${PROD[p].n} ของ ${c.name} แล้ว เบี้ย ${B(pr)}`); }
          else { x.lapsed = 1; msg('บริษัทประกัน', `⚠️ ${PROD[p].n} ของ ${c.name} หมดอายุแล้ว ไม่มีความคุ้มครอง`); }
        }
      }
      // internal-control running costs once a month
      if (month() && r.lastMo !== S.day) {
        r.lastMo = S.day;
        for (const k in r.ic) { const x = r.ic[k]; if (!x || x.free || !IC[k].mo) continue; if (c.cash >= IC[k].mo) { pay(c, IC[k].mo, `ค่าดำเนินงาน${IC[k].n}`); x.off = 0; } else if (!x.off) { x.off = 1; msg('ฝ่ายตรวจสอบ', `⚠️ ${c.name}: เงินบริษัทไม่พอจ่าย ${IC[k].n} ระบบนี้หยุดทำงานจนกว่าจะมีเงินจ่ายค่าดำเนินงาน`); } }
      }
      sync(c);
      // random incidents (never in the first month, at most one per ten days)
      if (c.regDay != null && S.day - c.regDay < 30) continue;
      if (r.lastInc && S.day - r.lastInc < 10) continue;
      const n = (c.staff || []).length;
      for (const K of KINDS) {
        let p = K.p; if (K.id === 'fraud') p *= n >= 2 ? 1 : 0.3; if (K.id === 'hurt') p *= n >= 1 ? Math.min(3, 0.5 + n / 6) : 0;
        if (Math.random() < p) { r.lastInc = S.day; incident(c, K); break; }
      }
    }
  };
  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { daily(); } catch (e) { console.warn('v243 daily', e); } return r; }; }

  // ----- the company page -----
  const section = c => {
    const r = R(c); sync(c);
    const authI = authOK(c, 'insAuth'), authC = authOK(c, 'ctrlAuth'), v = value(c), sc = score(c);
    const gate = (ok, what) => ok ? '' : `<p class="bad">⛔ บริษัทนี้มีกรรมการ ต้องให้ที่ประชุมบอร์ดอนุมัติวาระ "${what}" ก่อน (แท็บ 👔 บอร์ด/ผู้บริหาร > นัดประชุมบอร์ด) จึงจะซื้อได้</p>`;
    const pols = Object.keys(PROD).map(p => {
      const P = PROD[p], x = active(c, p), lapsed = r.pol[p] && !x;
      const head = `<h4>${P.i} ${E(P.n)}</h4><p class="cx-meta">${E(P.cov)}</p>`;
      if (x) { const I = INS[x.ins]; return `<div class="cx-card">${head}<div class="cx-chips"><span class="cx-chip good">✅ คุ้มครองถึง ${RD(x.until)}</span><span class="cx-chip">${E(I.n)}</span><span class="cx-chip">เบี้ย ${B(x.prem)}/ปี</span></div></div>`; }
      const reqOK = !P.req || active(c, P.req);
      const btns = Object.keys(INS).map(ik => `<button class="btn ${ik === 'sukjai' ? '' : 'ghost'}" data-a="rk243" data-v="buy|${p}|${ik}" ${authI && reqOK && c.cash >= premium(c, p, ik) ? '' : 'disabled'}>${E(INS[ik].n)} ${B(premium(c, p, ik))}</button>`).join('');
      return `<div class="cx-card">${head}<div class="cx-chips"><span class="cx-chip bad">${lapsed ? '⚠️ หมดอายุแล้ว' : '❌ ยังไม่มี'}</span></div>${reqOK ? '' : '<p class="dim">ต้องซื้อประกันอัคคีภัยและทรัพย์สินก่อน</p>'}<div class="cx-actions">${btns}</div></div>`;
    }).join('');
    const ics = Object.keys(IC).map(k => {
      const M = IC[k], x = r.ic[k];
      const state = x ? `<span class="cx-chip ${x.off ? 'bad' : 'good'}">${x.off ? '⏸️ หยุดเพราะเงินไม่พอจ่ายค่าดำเนินงาน' : '✅ ใช้งานอยู่'}</span>` : '<span class="cx-chip bad">❌ ยังไม่มี</span>';
      const btn = x ? (x.off ? `<button class="btn" data-a="rk243" data-v="resume|${k}" ${M.mo && c.cash >= M.mo ? '' : 'disabled'}>เปิดใช้ใหม่ ${B(M.mo)}</button>` : '') : `<button class="btn" data-a="rk243" data-v="icbuy|${k}" ${authC && c.cash >= M.cost ? '' : 'disabled'}>ติดตั้ง ${B(M.cost)}${M.mo ? ` + ${B(M.mo)}/เดือน` : ''}</button>`;
      return `<div class="cx-card"><h4>${M.i} ${E(M.n)} <small>(+${M.pts} คะแนน)</small></h4><p class="cx-meta">${E(M.how)}<br>ได้อะไร: ${E(M.gain)}</p><div class="cx-chips">${state}</div><div class="cx-actions">${btn}</div></div>`;
    }).join('');
    const log = r.log.length ? `<table class="tbl" style="width:100%"><tr><th>วันที่</th><th>เหตุการณ์</th><th>เสียหาย</th><th>ประกันจ่าย</th></tr>${r.log.slice(0, 6).map(l => `<tr><td>${RD(l.day)}</td><td>${E(l.n)}</td><td>${B(l.loss)}</td><td>${B(l.paid)}</td></tr>`).join('')}</table>` : '<p class="dim">ยังไม่เคยเกิดเหตุที่ต้องเคลม</p>';
    return `<h5>🛡️ ประกันภัยบริษัท</h5>
      <p class="lead">ซื้อกรมธรรม์ได้จาก 3 บริษัทประกันในตารางนี้ อายุ 365 วัน เบี้ยคิดจากมูลค่าทรัพย์สินที่เอาประกัน (ตอนนี้ ${B(v)}) และจำนวนพนักงาน · เมื่อเกิดเหตุ (ไฟไหม้ น้ำท่วม โจรกรรม ทุจริต ข้อมูลรั่ว ถูกฟ้อง พนักงานบาดเจ็บ) กรมธรรม์ที่มีจะจ่ายสินไหมให้เองทันที</p>
      ${gate(authI, 'ซื้อประกันภัยบริษัท')}
      <p class="dim">บริษัทประกัน: ${Object.values(INS).map(I => `<b>${E(I.n)}</b> — ${E(I.note)}`).join(' · ')}</p>
      <div class="row"><label><input type="checkbox" ${r.auto ? 'checked' : ''} onchange="UI.H.rk243({v:'auto|'+(this.checked?1:0)});UI.renderBody()"> ต่ออายุอัตโนมัติเมื่อหมดอายุ (ถ้าเงินบริษัทพอ)</label></div>
      <div class="cx-grid">${pols}</div>
      <h5>📋 ประวัติเหตุและการเคลม</h5>${log}
      <h5>🧰 ระบบควบคุมภายในบริษัท</h5>
      <p class="lead">คะแนนควบคุมภายใน <b>${sc}/100</b> · ${sc >= NEED ? '✅ ผ่านเกณฑ์ 50 คะแนน ถือว่าบริษัทมีระบบควบคุมภายใน (บอร์ดและผู้ถือหุ้นเห็นสถานะนี้)' : `❌ ยังไม่ถึง 50 คะแนน (ขาดอีก ${NEED - sc})`} · ทุจริตภายในลดความเสียหายได้แล้ว ${Math.round(mitFraud(c) * 100)}%</p>
      ${gate(authC, 'ตั้งระบบควบคุมภายในและตรวจสอบภายใน')}
      <div class="cx-grid">${ics}</div>`;
  };
  const wrap = () => {
    const _h = Company.html.bind(Company);
    Company.html = function (t) {
      const html = _h(t);
      if (t !== 0) return html;
      try {
        const c = Company.get(Company.sel); if (!c || c.st !== 'open' || Company.tab229 !== 'lic') return html;
        const box = document.createElement('div'); box.innerHTML = html; const body = box.querySelector('.cx-body'); if (!body) return html;
        body.insertAdjacentHTML('beforeend', section(c)); return box.innerHTML;
      } catch (e) { console.warn('v243 page', e); return html; }
    };
  };
  wrap();
  UI.H.rk243 = d => {
    const [a, x, y] = String(d.v || '').split('|'), c = Company.get(Company.sel); if (!c || c.st !== 'open') return; const r = R(c);
    if (a === 'auto') { r.auto = x === '1' ? 1 : 0; return; }
    if (a === 'buy') {
      const P = PROD[x]; if (!P || !INS[y]) return;
      if (!authOK(c, 'insAuth')) { UI.toast('ต้องผ่านมติบอร์ดอนุมัติซื้อประกันก่อน', '⛔'); return; }
      if (P.req && !active(c, P.req)) { UI.toast('ต้องซื้อประกันอัคคีภัยและทรัพย์สินก่อน', '⛔'); return; }
      if (active(c, x)) { UI.toast('มีกรมธรรม์นี้อยู่แล้ว', 'ℹ️'); return; }
      const pr = premium(c, x, y); if (c.cash < pr) { UI.toast('เงินบริษัทไม่พอจ่ายเบี้ย ' + B(pr), '⚠️'); return; }
      pay(c, pr, `ซื้อ${P.n} (${INS[y].n})`); r.pol[x] = { ins: y, day: S.day, until: S.day + 365, prem: pr }; sync(c);
      UI.toast(`ซื้อ${P.n}จาก${INS[y].n}แล้ว คุ้มครอง 365 วัน`, P.i); return;
    }
    if (a === 'icbuy') {
      const M = IC[x]; if (!M || r.ic[x]) return;
      if (!authOK(c, 'ctrlAuth')) { UI.toast('ต้องผ่านมติบอร์ดอนุมัติระบบควบคุมภายในก่อน', '⛔'); return; }
      if (c.cash < M.cost) { UI.toast('เงินบริษัทไม่พอ ' + B(M.cost), '⚠️'); return; }
      pay(c, M.cost, `ติดตั้ง${M.n}`); r.ic[x] = { day: S.day }; if (x === 'hot') c.rep = clamp((c.rep || 0) + 2, 0, 100); sync(c);
      UI.toast(`ติดตั้ง${M.n}แล้ว คะแนนควบคุมภายใน ${score(c)}`, M.i); return;
    }
    if (a === 'resume') { const M = IC[x]; if (!M || !r.ic[x] || c.cash < M.mo) return; pay(c, M.mo, `ค่าดำเนินงาน${M.n}`); r.ic[x].off = 0; sync(c); }
  };
  window.Risk243 = { R, PROD, INS, IC, value, score, premium, incident, section, sync, daily, active, KINDS, NEED, authOK };
});
