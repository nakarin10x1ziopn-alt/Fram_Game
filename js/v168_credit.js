'use strict';
// ---------- v168_credit: credit card, instalments, cash advance and a cash credit line, like a real bank ----------
// * CREDIT CARD: apply (ID card + income), a limit that you can ask to raise (every 28 days, needs on-time payments and a good score), monthly statement (day 1) with a due date (day 25),
//   minimum payment, interest on what is not paid in full, late fee, auto-debit (off / minimum / full), credit score effects
// * EVERY SHOP: in the "how do you pay" window the card is a payment method, and any purchase of 3,000 baht or more can be turned into instalments (3 / 6 months at 0 %, 10 / 12 / 24 months with interest)
// * CASH ADVANCE from the card (fee 3 %, interest 20 % a year from day one, at most half of the limit)
// * CASH CREDIT LINE (สินเชื่อกดเงินสด): a revolving limit you draw into your account, 24 % a year, 5 % minimum a month
// Everything is in the credit tab of every bank branch and of the phone bank app, and the ATM. Data lives in S.cr.card (+ S.cr.cl); older saves keep their old card balance.
V23.add('v168_credit', () => {
  const B = window.Bank49, P = window.Pay49; if (!B || !P || typeof Credit === 'undefined' || typeof Bank2 === 'undefined') return;
  const E = s => (typeof esc === 'function' ? esc(String(s == null ? '' : s)) : String(s == null ? '' : s));
  const bS = n => (typeof baht === 'function' ? baht(Math.round(n)) : '฿' + Math.round(n));
  const toast = (t, i) => { try { UI.toast(t, i || '💳'); } catch (e) { } };
  const msg = (t, good) => { try { Phone.msg('บัตรเครดิตสุขใจ', t, !!good); } catch (e) { } };
  const val = id => (document.getElementById(id) || {}).value;
  const slip = o => { try { if (window.Slip49) window.Slip49.make(card168.quiet ? Object.assign({}, o, { quiet: true }) : o); } catch (e) { console.warn('slip', e); } };
  const mkOf = d => { try { const t = Cal36.date(d); return t.be * 12 + t.m; } catch (e) { return Math.floor(d / 30); } };
  const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const PL = { inst3: { m: 3, r: 0, min: 3000 }, inst6: { m: 6, r: 0, min: 3000 }, inst10: { m: 10, r: 0.008, min: 3000 }, inst12: { m: 12, r: 0.0089, min: 10000 }, inst24: { m: 24, r: 0.011, min: 20000 } };
  // a special 0 % window for the long instalments: 6 days out of every 21
  const promoOn = () => ((S.day - 1) % 21) < 6;
  const pmt = (p, T) => (T.r ? Math.round(p * T.r / (1 - Math.pow(1 + T.r, -T.m))) : Math.ceil(p / T.m));
  const DUE_AFTER = 24, APR = 0.16;
  const PRODS = { std: { n: 'บัตรมาตรฐาน', fee: 0, min: 0, d: 'ไม่มีค่าธรรมเนียมรายปี' }, cash: { n: 'บัตรคืนเงิน', fee: 500, min: 30000, d: 'คืนเงิน 1% ของยอดใช้จ่ายเป็นส่วนลดในใบแจ้งหนี้ · ค่าธรรมเนียมรายปี 500 ฿' }, pts: { n: 'บัตรสะสมแต้ม', fee: 300, min: 30000, d: '25 ฿ = 1 แต้ม · 500 แต้มแลกส่วนลด 100 ฿ · ค่าธรรมเนียมรายปี 300 ฿' }, travel: { n: 'บัตรท่องเที่ยว', fee: 1500, min: 100000, d: '40 ฿ = 1 แต้ม · ประกันเดินทาง · ค่าธรรมเนียมรายปี 1,500 ฿' } };
  const pol = () => (window.Policy169 ? window.Policy169.delta() : 0);   // policy-rate effect in percentage points
  const aprFor = () => { const sc = Credit.st().score; return Math.min(0.16, Math.max(0.08, (sc >= 780 ? 0.14 : sc >= 720 ? 0.16 : sc >= 650 ? 0.18 : sc >= 600 ? 0.20 : 0.24) + pol() / 100 - (window.Cards171 && window.Cards171.rateCut ? window.Cards171.rateCut() : 0))); };   // v182: Bank of Thailand ceiling for credit cards is 16 % a year
  const caApr = () => Math.min(0.25, aprFor() + 0.09), clApr = () => Math.min(0.25, aprFor() + 0.06);   // cash advance and personal revolving credit: 25 % ceiling
  const inquire = () => { const x = Credit.st(); (x.inq = x.inq || []).push(S.day); x.inq = x.inq.filter(d => S.day - d <= 168); };

  // ---------------- the account ----------------
  const st = () => {
    const c = Credit.st().card;
    if (c.rev == null) { c.rev = Math.max(0, c.bal || 0); c.cur = 0; c.ca = 0; c.plans = []; c.tx = []; c.auto = 'min'; c.clean = 0; c.lastReq = 0; c.stmt = null; c.stmtMk = mkOf(S.day); c.apr = APR; c.issued = c.limit > 0 ? S.day : 0; c.seq = 0; }
    if (c.limit > 0 && !c.no) c.no = '4' + String(hash((S.name || 'x') + c.limit) % 1e15).padStart(15, '0');
    if (c.limit > 0 && !c.cards) c.cards = [{ id: 1, prod: 'std', no: c.no, since: c.issued || S.day, feeAt: S.day, spend: 0 }];
    if (c.cb == null) { c.cb = 0; c.pts = 0; }
    return c;
  };
  const sync = c => { c.bal = Math.round(c.rev + c.cur + c.ca + c.plans.reduce((a, p) => a + p.prin, 0)); return c.bal; };
  const mask = (i = 0) => { const c = st(), k = c.cards && c.cards[i]; return k ? '•••• ' + k.no.slice(-4) : c.no ? '•••• ' + c.no.slice(-4) : ''; };
  const avail = () => { const c = st(); return Math.max(0, Math.round(c.limit - sync(c))); };
  const has = () => st().limit > 0;
  const income = () => { let i = 0; try { i = Credit.income(); } catch (e) { } const v = B.V(); const dep = Bank.st().sav + B.all().filter(a => !a.main).reduce((s, a) => s + a.bal, 0) + (v.fd || []).reduce((s, f) => s + f.amt, 0); return i + dep * 0.005; };
  const tier = lim => (lim < 100000 ? ['Classic', '#37474f,#78909c'] : lim < 500000 ? ['Gold', '#8d6e1f,#f3d36b'] : lim < 2000000 ? ['Platinum', '#455a64,#cfd8dc'] : ['Signature', '#111,#4a4a55']);
  const cap = () => { const sc = Credit.st().score; return Math.round(Math.min(income() * 5, sc >= 750 ? 10e6 : sc >= 700 ? 3e6 : sc >= 650 ? 1e6 : 3e5) / 1000) * 1000; };
  const minDue = c => { const open = c.stmt && !c.stmt.closed ? c.stmt : null; return open ? Math.max(0, open.min - open.paid) : 0; };

  // ---------------- the Pay49 source 'card' (the "how do you pay" window) ----------------
  P.cardAvail = avail;
  const card168 = {
    avail, has, mask, st,
    charge(n) { const c = st(); c.cur += n; sync(c); },
    refund(n) { const c = st(); let r = n; const a = Math.min(c.cur, r); c.cur -= a; r -= a; const b = Math.min(c.rev, r); c.rev -= b; sync(c); },
    methods(n) {
      const c = st(), ok = has() && avail() >= n, out = [];
      const why = !has() ? 'ยังไม่มีบัตรเครดิต สมัครได้ที่ธนาคารทุกสาขาหรือแอปธนาคาร แท็บ "บัตรเครดิต/สินเชื่อ"' : `วงเงินคงเหลือ ${bS(avail())} ไม่พอ (ขอเพิ่มวงเงินได้ที่แท็บบัตรเครดิต/สินเชื่อ)`;
      const due = c.stmt && !c.stmt.closed ? c.stmt.due : null;
      (c.cards || [{ prod: 'std', no: c.no }]).forEach((k, i) => out.push({ k: i ? 'card' + 'BC'[i - 1] : 'card', ok, why: ok ? `${PRODS[k.prod].n} ${mask(i)} · วงเงินคงเหลือหลังซื้อ ${bS(avail() - n)} · ไม่มีดอกเบี้ยถ้าชำระเต็มจำนวนก่อนวันครบกำหนด${k.prod === 'cash' ? ' · ได้คืนเงิน 1%' : k.prod === 'pts' ? ` · ได้ ${Math.floor(n / 25)} แต้ม` : k.prod === 'travel' ? ` · ได้ ${Math.floor(n / 40)} แต้ม` : ''}` : why, fee: 0 }));
      for (const k of Object.keys(PL)) { const T0 = PL[k]; if (n < T0.min) continue; const promo = promoOn() && T0.m >= 10, T = promo ? Object.assign({}, T0, { r: 0 }) : T0, mo = pmt(n, T), tot = mo * T.m;
        out.push({ k, ok, why: ok ? `ผ่อน ${T.m} เดือน เดือนละ ${bS(mo)} · ${T.r ? `ดอกเบี้ย ${(T.r * 100).toFixed(2)}% ต่อเดือน รวมจ่าย ${bS(tot)} (ดอกเบี้ย ${bS(tot - n)})` : promo ? '🔥 โปรพิเศษ ดอกเบี้ย 0% ไม่มีค่าธรรมเนียม' : 'ดอกเบี้ย 0% ไม่มีค่าธรรมเนียม'} · ตัดวงเงินเต็มจำนวนจนกว่าจะผ่อนหมด` : why, fee: 0 }); }
      return out;
    },
    // called by the checkout after the purchase went through the card: returns a short text for the slip
    record(m, spent, label, payee) {
      const c = st();
      if (m.startsWith('card')) { const i = m === 'card' ? 0 : 'BC'.indexOf(m.slice(4)) + 1; reward(i, spent); c.tx.unshift({ d: S.day, t: label || 'ซื้อสินค้า', p: payee || '', a: Math.round(spent) }); c.tx.length = Math.min(c.tx.length, 60); return `${PRODS[(c.cards[i] || c.cards[0]).prod].n} ${mask(i)}`; }
      const T0 = PL[m]; if (!T0) return ''; const T = promoOn() && T0.m >= 10 ? Object.assign({}, T0, { r: 0 }) : T0; reward(0, spent);
      c.cur = Math.max(0, c.cur - spent); const mo = pmt(spent, T);
      c.plans.push({ id: ++c.seq, label: label || 'ซื้อสินค้า', payee: payee || '', total: Math.round(spent), m: T.m, left: T.m, prin: Math.round(spent), r: T.r, mo, start: S.day });
      c.tx.unshift({ d: S.day, t: `${label || 'ซื้อสินค้า'} (ผ่อน ${T.m} เดือน)`, p: payee || '', a: Math.round(spent) }); c.tx.length = Math.min(c.tx.length, 60); sync(c);
      return `ผ่อน ${T.m} เดือน เดือนละ ${bS(mo)}${T.r ? '' : ' (0%)'}`;
    },
  };

  function reward(i, spent) { const c = st(), k = c.cards && c.cards[i]; if (!k) return; k.spend = (k.spend || 0) + spent; if (k.prod === 'cash') c.cb += spent * 0.01; else if (k.prod === 'pts') c.pts += Math.floor(spent / 25); else if (k.prod === 'travel') c.pts += Math.floor(spent / 40); try { if (window.Cards171) window.Cards171.perk(i, spent); } catch (e) { } }
  function addCard(prod) {
    const c = st(), P0 = PRODS[prod]; if (!has()) { toast('ต้องมีบัตรเครดิตหลักก่อน', 'ℹ️'); return; } if (!P0 || prod === 'std') return; if (c.cards.length >= 3) { toast('มีบัตรเครดิตได้สูงสุด 3 ใบ', 'ℹ️'); return; } if (c.cards.some(x => x.prod === prod)) { toast('มีบัตรประเภทนี้แล้ว', 'ℹ️'); return; }
    if (c.limit < P0.min) { toast(`บัตรนี้ต้องมีวงเงินบัตรตั้งแต่ ${bS(P0.min)} (ตอนนี้ ${bS(c.limit)}) ขอเพิ่มวงเงินก่อน`, '💳'); return; } if (avail() < P0.fee) { toast('วงเงินคงเหลือไม่พอสำหรับค่าธรรมเนียมแรกเข้า', '💳'); return; }
    c.cards.push({ id: c.cards.length + 1, prod, no: '4' + String(hash(prod + (S.name || 'x') + S.day) % 1e15).padStart(15, '0'), since: S.day, feeAt: S.day, spend: 0 }); c.cur += P0.fee; sync(c); inquire();
    msg(`อนุมัติ${P0.n} ${mask(c.cards.length - 1)} ใช้วงเงินร่วมกับบัตรหลัก · ${P0.d}`, true); toast(`ได้${P0.n}แล้ว`, '💳'); slip({ k: 'acct', amt: P0.fee, payee: `${P0.n} ${mask(c.cards.length - 1)}`, memo: 'ค่าธรรมเนียมแรกเข้า', from: 'บัตรเครดิต ' + mask(), neutral: false });
  }
  function redeem() { const c = st(), n = Math.floor(c.pts / 500); if (n < 1) { toast(`ต้องมี 500 แต้มขึ้นไป (ตอนนี้ ${Math.floor(c.pts)})`, 'ℹ️'); return; } c.pts -= n * 500; card168.refund(n * 100); toast(`แลกแต้ม ${n * 500} แต้ม เป็นส่วนลด ${bS(n * 100)} ในใบแจ้งหนี้`, '🎁'); }
  // ---------------- applying, raising the limit ----------------
  function apply() {
    const c = st(); if (has()) { toast('มีบัตรเครดิตอยู่แล้ว', 'ℹ️'); return; }
    if (!B.hasId()) { toast('สมัครบัตรเครดิตต้องใช้บัตรประชาชน (ทำที่ศูนย์ราชการ)', '🪪'); return; }
    const inc = income(), sc = Credit.st().score;
    if (inc < 15000) { toast(`รายได้ประเมิน ${bS(inc)}/เดือน ต่ำกว่าเกณฑ์ 15,000 ฿ (มีงานประจำ เงินเดือน ค่าเช่า รายได้ฟาร์ม หรือเงินฝากช่วยได้)`, '🏦'); return; }
    if (sc < 600) { toast(`คะแนนเครดิตบูโร ${sc} ต่ำกว่า 600 ธนาคารไม่อนุมัติ`, '🏦'); return; }
    c.limit = Math.max(20000, Math.min(300000, Math.round(inc * 3 / 1000) * 1000)); c.issued = S.day; inquire(); c.clean = 0; c.lastReq = S.day; c.stmtMk = mkOf(S.day); st();
    Credit.st().score = Math.max(300, sc - 5);   // an inquiry on the credit bureau
    msg(`อนุมัติบัตรเครดิต ${tier(c.limit)[0]} หมายเลข ${mask()} วงเงิน ${bS(c.limit)} · ใบแจ้งหนี้ออกวันที่ 1 ของเดือน ครบกำหนดวันที่ 25`, true);
    toast(`อนุมัติบัตรเครดิต ${tier(c.limit)[0]} วงเงิน ${bS(c.limit)}`, '💳');
    slip({ k: 'acct', amt: c.limit, payee: `บัตรเครดิต ${tier(c.limit)[0]} ${mask()}`, memo: `อนุมัติวงเงิน ${bS(c.limit)} ดอกเบี้ย ${(APR * 100)}% ต่อปี`, from: 'ธนาคารสุขใจ', neutral: true });
  }
  function raise() {
    const c = st(); if (!has()) { toast('ยังไม่มีบัตรเครดิต', 'ℹ️'); return; }
    if (!B.hasId()) { toast('ต้องมีบัตรประชาชน', '🪪'); return; }
    const wait = c.lastReq + 28 - S.day; if (wait > 0) { toast(`ขอเพิ่มวงเงินได้ทุก 28 วัน (อีก ${wait} วัน)`, '⏳'); return; }
    c.lastReq = S.day; inquire(); const sc = Credit.st().score, mx = cap();
    const no = r => { Credit.st().score = Math.max(300, sc - 5); msg(`ไม่อนุมัติเพิ่มวงเงิน: ${r}`, false); toast(`ไม่อนุมัติ: ${r}`, '🏦'); };
    if (c.clean < 3) { no(`ต้องชำระตรงเวลาอย่างน้อย 3 รอบบิลติดกัน (ตอนนี้ ${c.clean} รอบ)`); return; }
    if (sc < 680) { no(`คะแนนเครดิต ${sc} ต่ำกว่า 680`); return; }
    if (c.limit >= mx) { no(`วงเงิน ${bS(c.limit)} ถึงเพดานตามรายได้/คะแนนแล้ว (สูงสุด ${bS(mx)}) ต้องมีรายได้หรือเงินฝากเพิ่ม`); return; }
    const nl = Math.min(mx, Math.max(c.limit + 5000, Math.round(c.limit * 1.35 / 1000) * 1000)); const old = c.limit; c.limit = nl; Credit.st().score = Math.max(300, sc - 3);
    msg(`อนุมัติเพิ่มวงเงินบัตรเครดิต ${bS(old)} → ${bS(nl)} (ระดับ ${tier(nl)[0]})`, true); toast(`อนุมัติเพิ่มวงเงิน ${bS(old)} → ${bS(nl)}`, '💳');
  }

  // ---------------- paying, cash advance, closing a plan ----------------
  const acctOf = k => (k === 'cur' ? B.curAcct() : k === 'cash' ? null : B.all()[0]);
  const bal0 = k => (k === 'cash' ? S._c : (acctOf(k) ? B.balOf(acctOf(k)) : 0));
  const take = (k, n) => { if (k === 'cash') S._c -= n; else { const a = acctOf(k); B.setBal(a, B.balOf(a) - n); } };
  const srcName = k => (k === 'cash' ? 'เงินสดในกระเป๋า' : (acctOf(k) ? acctOf(k).name + ' ' + acctOf(k).no : ''));
  function pay(n, k) {
    const c = st(), owe = Math.round(c.rev + c.ca + c.cur); n = Math.min(Math.round(+n || 0), owe); if (!(n >= 1)) { toast(owe ? 'พิมพ์จำนวนเงินที่จะชำระ' : 'ไม่มียอดค้างชำระ', 'ℹ️'); return false; }
    if (k !== 'cash' && !acctOf(k)) { toast('ไม่พบบัญชีที่เลือก', 'ℹ️'); return false; } if (bal0(k) < n) { toast(`เงินใน${srcName(k)}ไม่พอ (มี ${bS(bal0(k))})`, '💸'); return false; }
    take(k, n); let r = n; for (const f of ['rev', 'ca', 'cur']) { const a = Math.min(c[f], r); c[f] -= a; r -= a; }
    if (c.stmt && !c.stmt.closed) c.stmt.paid += n; sync(c);
    B.tx(`ชำระบัตรเครดิต ${mask()}`, k === 'cash' ? 0 : -n, k === 'cur' ? (B.curAcct() || {}).id : 'main'); try { if (k !== 'cash') Bank2.log(`ชำระบัตรเครดิต ${mask()}`, -n); } catch (e) { }
    toast(`ชำระบัตรเครดิต ${bS(n)} แล้ว · ยอดค้าง ${bS(c.bal)}`, '💳');
    slip({ k: 'acct', amt: n, payee: `บัตรเครดิตสุขใจ ${mask()}`, memo: 'ชำระบัตรเครดิต', from: srcName(k), neutral: true });
    return true;
  }
  function advance(n, dest) {
    const c = st(); n = Math.round(+n || 0); if (!has()) { toast('ยังไม่มีบัตรเครดิต', 'ℹ️'); return false; }
    if (n < 500) { toast('กดเงินสดขั้นต่ำ 500 ฿', 'ℹ️'); return false; } const fee = Math.max(200, Math.round(n * 0.03)), maxAdv = Math.floor(c.limit * 0.5 - c.ca);
    if (n > maxAdv) { toast(`กดเงินสดได้ไม่เกิน 50% ของวงเงิน (ตอนนี้กดได้อีก ${bS(Math.max(0, maxAdv))})`, '💳'); return false; }
    if (avail() < n + fee) { toast(`วงเงินคงเหลือ ${bS(avail())} ไม่พอ (ต้องใช้ ${bS(n + fee)} รวมค่าธรรมเนียม ${bS(fee)})`, '💳'); return false; }
    c.ca += n + fee; sync(c); if (dest === 'cash') S._c += n; else { Bank.st().sav += n; B.tx(`กดเงินสดจากบัตรเครดิต ${mask()}`, n, 'main'); try { Bank2.log(`กดเงินสดจากบัตรเครดิต ${mask()}`, n); } catch (e) { } }
    c.tx.unshift({ d: S.day, t: 'กดเงินสดจากบัตร', p: '', a: n + fee }); c.tx.length = Math.min(c.tx.length, 60);
    toast(`กดเงินสด ${bS(n)} จากบัตรเครดิต (ค่าธรรมเนียม ${bS(fee)}) · ดอกเบี้ย ${(caApr() * 100).toFixed(0)}% ต่อปีนับตั้งแต่วันนี้`, '💳');
    slip({ k: 'acct', amt: n, fee, payee: `กดเงินสดบัตรเครดิต ${mask()}`, memo: `ค่าธรรมเนียม ${bS(fee)} ดอกเบี้ย ${(caApr() * 100).toFixed(0)}% ต่อปี`, from: 'บัตรเครดิต ' + mask(), neutral: true });
    return true;
  }
  function payoff(id) {
    const c = st(), p = c.plans.find(x => x.id === +id); if (!p) return; const fee = Math.max(100, Math.round(p.prin * 0.03)), tot = p.prin + fee;
    if (!confirm(`ปิดยอดผ่อน "${p.label}" ก่อนกำหนด? ต้องจ่าย ${bS(tot)} (เงินต้นคงเหลือ ${bS(p.prin)} + ค่าธรรมเนียมปิดก่อนกำหนด ${bS(fee)}) จากบัญชีออมทรัพย์หลัก`)) return;
    if (!pay0(tot, 'sav', `ปิดยอดผ่อน ${p.label}`)) return; c.plans = c.plans.filter(x => x.id !== p.id); sync(c); toast('ปิดยอดผ่อนเรียบร้อย', '✅');
  }
  const pay0 = (n, k, memo) => { if (bal0(k) < n) { toast(`เงินใน${srcName(k)}ไม่พอ (ต้องใช้ ${bS(n)})`, '💸'); return false; } take(k, n); B.tx(memo, -n, 'main'); try { Bank2.log(memo, -n); } catch (e) { } slip({ k: 'acct', amt: n, payee: 'บัตรเครดิตสุขใจ ' + mask(), memo, from: srcName(k), neutral: true }); return true; };

  // ---------------- cash credit line (สินเชื่อกดเงินสด) ----------------
  const cl = () => { const s = Credit.st(); if (!s.cl) s.cl = { limit: 0, bal: 0, paid: 0, mk: mkOf(S.day) }; return s.cl; };
  function applyCL() {
    const x = cl(); if (x.limit > 0) { toast('มีสินเชื่อกดเงินสดอยู่แล้ว', 'ℹ️'); return; } if (!B.hasId()) { toast('ต้องใช้บัตรประชาชน (ทำที่ศูนย์ราชการ)', '🪪'); return; }
    const inc = income(), sc = Credit.st().score; if (inc < 12000) { toast(`รายได้ประเมิน ${bS(inc)}/เดือน ต่ำกว่าเกณฑ์ 12,000 ฿`, '🏦'); return; } if (sc < 620) { toast(`คะแนนเครดิต ${sc} ต่ำกว่า 620 ธนาคารไม่อนุมัติ`, '🏦'); return; }
    x.limit = Math.max(10000, Math.min(500000, Math.round(inc * 1.5 / 1000) * 1000)); Credit.st().score = Math.max(300, sc - 5); inquire();
    msg(`อนุมัติสินเชื่อกดเงินสด (วงเงินหมุนเวียน) ${bS(x.limit)} ดอกเบี้ย ${(clApr() * 100).toFixed(0)}% ต่อปี ผ่อนขั้นต่ำ 5% ต่อเดือน`, true); toast(`อนุมัติสินเชื่อกดเงินสด วงเงิน ${bS(x.limit)}`, '💵');
    slip({ k: 'acct', amt: x.limit, payee: 'สินเชื่อกดเงินสด', memo: `วงเงินหมุนเวียน ${bS(x.limit)} ดอกเบี้ย ${(clApr() * 100).toFixed(0)}% ต่อปี`, from: 'ธนาคารสุขใจ', neutral: true });
  }
  function drawCL(n) {
    const x = cl(); n = Math.round(+n || 0); if (!(x.limit > 0)) { toast('ยังไม่มีสินเชื่อกดเงินสด', 'ℹ️'); return; } if (n < 1000) { toast('กดเงินขั้นต่ำ 1,000 ฿', 'ℹ️'); return; } if (n > x.limit - x.bal) { toast(`วงเงินคงเหลือ ${bS(x.limit - x.bal)} ไม่พอ`, '💵'); return; }
    x.bal += n; Bank.st().sav += n; B.tx('กดเงินสดจากสินเชื่อกดเงินสด', n, 'main'); try { Bank2.log('กดเงินสดจากสินเชื่อกดเงินสด', n); } catch (e) { }
    toast(`กดเงินสด ${bS(n)} เข้าบัญชีออมทรัพย์ · ยอดหนี้ ${bS(x.bal)}`, '💵');
  }
  function repayCL(n, k) {
    const x = cl(); n = Math.min(Math.round(+n || 0), x.bal); if (!(n >= 1)) { toast(x.bal ? 'พิมพ์จำนวนเงิน' : 'ไม่มียอดหนี้', 'ℹ️'); return; } if (bal0(k) < n) { toast(`เงินใน${srcName(k)}ไม่พอ`, '💸'); return; }
    take(k, n); x.bal -= n; x.paid += n; B.tx('ชำระสินเชื่อกดเงินสด', k === 'cash' ? 0 : -n, 'main'); try { if (k !== 'cash') Bank2.log('ชำระสินเชื่อกดเงินสด', -n); } catch (e) { }
    toast(`ชำระสินเชื่อกดเงินสด ${bS(n)} · ยอดหนี้ ${bS(x.bal)}`, '💵'); slip({ k: 'acct', amt: n, payee: 'สินเชื่อกดเงินสด', memo: 'ชำระคืน', from: srcName(k), neutral: true });
  }

  // ---------------- the month: statement on day 1, due day 25 ----------------
  function issueStatement(c) {
    let inst = 0;
    for (const p of c.plans) { const it = Math.round(p.prin * p.r), last = p.left === 1, bill = last ? p.prin + it : Math.min(p.mo, p.prin + it), prinPart = Math.max(0, bill - it); c.rev += bill; inst += bill; p.prin = Math.max(0, p.prin - prinPart); p.left--; }
    c.plans = c.plans.filter(p => p.left > 0 && p.prin > 0);
    if (c.ca > 0) c.ca += Math.round(c.ca * caApr() / 12);
    c.rev += c.cur; const charges = c.cur; c.cur = 0; c.apr = aprFor();
    for (const k of c.cards || []) if (k.prod !== 'std' && S.day - k.feeAt >= 84) { k.feeAt = S.day; if ((k.spend || 0) < 50000) { c.rev += PRODS[k.prod].fee; msg(`ค่าธรรมเนียมรายปี${PRODS[k.prod].n} ${bS(PRODS[k.prod].fee)} (ใช้จ่ายครบ 50,000 ฿ ในรอบปีฟรีค่าธรรมเนียม)`, false); } k.spend = 0; }
    if (c.cb >= 1 && c.rev > 0) { const cr = Math.min(Math.floor(c.cb), c.rev); c.rev -= cr; c.cb -= cr; msg(`คืนเงินบัตรเครดิต ${bS(cr)} หักจากใบแจ้งหนี้`, true); }
    sync(c);
    const rest = Math.max(0, c.rev - inst), caMin = c.ca > 0 ? Math.max(300, Math.round(c.ca * 0.05)) : 0, min = Math.min(c.rev + c.ca, inst + (rest > 0 ? Math.max(500, Math.round(rest * 0.08)) : 0) + caMin);
    c.stmt = { mk: mkOf(S.day), issued: S.day, due: S.day + DUE_AFTER, total: c.rev + c.ca, min: c.rev + c.ca > 0 ? min : 0, paid: 0, closed: c.rev + c.ca <= 0, inst, charges };
    if (!c.stmt.closed) msg(`ใบแจ้งหนี้บัตรเครดิต ${mask()}: ยอดที่ต้องชำระ ${bS(c.stmt.total)} (ค่างวดผ่อน ${bS(inst)}) ชำระขั้นต่ำ ${bS(c.stmt.min)} ภายใน ${RD(c.stmt.due)} · ชำระเต็มจำนวนไม่มีดอกเบี้ย · ชำระในแอปธนาคาร แท็บ "บัตรเครดิต/สินเชื่อ"`, false);
  }
  function dueCheck(c) {
    const s = c.stmt; if (!s || s.closed || S.day < s.due) return; const sc = Credit.st();
    if (c.auto !== 'off') { const want = c.auto === 'full' ? Math.round(c.rev + c.ca) : Math.max(0, s.min - s.paid), n = Math.min(want, Math.round(Bank.st().sav)); if (n >= 1 && want > 0) pay(n, 'sav'); }
    const unpaid = Math.round(c.rev + c.ca);
    if (unpaid <= 0) { c.clean++; sc.score = Math.min(900, sc.score + 4); msg('ชำระบัตรเครดิตเต็มจำนวนตรงเวลา ไม่มีดอกเบี้ย คะแนนเครดิตเพิ่มขึ้น', true); }
    else if (s.paid >= s.min) { const it = Math.round(c.rev * (c.apr || APR) / 12); c.rev += it; c.clean++; sc.score = Math.min(900, sc.score + 1); msg(`ชำระขั้นต่ำแล้ว ยอดที่เหลือ ${bS(unpaid)} คิดดอกเบี้ย ${(APR * 100)}% ต่อปี ${bS(it)}`, false); }
    else { const it = Math.round(c.rev * (c.apr || APR) / 12), fee = 250; c.rev += it + fee; c.missed = (c.missed || 0) + 1; c.clean = 0; sc.score = Math.max(300, sc.score - 20); msg(`⚠️ ชำระไม่ถึงขั้นต่ำ: ค่าปรับชำระล่าช้า ${bS(fee)} + ดอกเบี้ย ${bS(it)} คะแนนเครดิตลดลง · ชำระโดยเร็ว`, false); }
    s.closed = true; sync(c);
  }
  function clMonth() {
    const x = cl(); if (!(x.limit > 0) || x.mk === mkOf(S.day)) return; x.mk = mkOf(S.day);
    if (x.bal > 0) { x.bal += Math.round(x.bal * clApr() / 12); const req = Math.min(x.bal, Math.max(500, Math.round(x.bal * 0.05)));
      if (x.paid < req && st().auto !== 'off') { const n = Math.min(req - x.paid, Math.round(Bank.st().sav)); if (n >= 1) { Bank.st().sav -= n; x.bal -= n; x.paid += n; B.tx('ตัดบัญชีชำระสินเชื่อกดเงินสดอัตโนมัติ', -n, 'main'); try { Bank2.log('ชำระสินเชื่อกดเงินสด (ตัดบัญชีอัตโนมัติ)', -n); } catch (e) { } } }
      if (x.paid < req) { x.bal += 150; const sc = Credit.st(); sc.score = Math.max(300, sc.score - 15); msg(`⚠️ สินเชื่อกดเงินสด: ชำระขั้นต่ำ ${bS(req)} ไม่ครบ ค่าปรับ 150 ฿ คะแนนเครดิตลดลง`, false); } else Credit.st().score = Math.min(900, Credit.st().score + 1); }
    x.paid = 0;
  }
  function daily() {
    const c = st(); if (c.limit > 0) {
      const mk = mkOf(S.day); if (c.stmtMk !== mk) { c.stmtMk = mk; issueStatement(c); }
      dueCheck(c);
      if (c.stmt && !c.stmt.closed && c.stmt.due - S.day === 3) msg(`อีก 3 วันครบกำหนดชำระบัตรเครดิต ยอดค้าง ${bS(c.rev + c.ca)} ขั้นต่ำ ${bS(minDue(c))}`, false);
    }
    clMonth();
  }
  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { daily(); } catch (e) { console.warn('v168 daily', e); } return r; }; }
  // the old loan screens' card buttons and the old monthly card run now go through this module
  UI.H.card = d => { if (d.v === 'cash') advance(10000, 'sav'); else { const owe = Math.round(st().rev + st().ca + st().cur); pay(owe, 'sav'); } };
  card168.wrapLoans = fn => {
    const cr = Credit.st(), c = cr.card, keep = { limit: c.limit, bal: c.bal, missed: c.missed }, held = [], paid = [];
    for (const l of cr.loans) { if (l.hold > 0) held.push(l); else if (l.ppi && S.sick && (l.ppiUsed || 0) < 3) paid.push(l); }
    cr.loans = cr.loans.filter(l => !held.includes(l) && !paid.includes(l)); c.bal = 0; c.limit = 0;
    try { fn(); } finally {
      c.limit = keep.limit; c.bal = keep.bal; c.missed = keep.missed;
      for (const l of held) { l.hold--; l.left = Math.round(l.left * (1 + l.r / 12)); }
      for (const l of paid) { const due = Math.min(l.pay, Math.round(l.left * (1 + l.r / 12))); l.left = Math.round(l.left * (1 + l.r / 12) - due); l.ppiUsed = (l.ppiUsed || 0) + 1; msg(`ประกันคุ้มครองสินเชื่อจ่ายค่างวดแทนคุณ ${bS(due)} (เพราะไม่สบาย) ครั้งที่ ${l.ppiUsed}/3`, true); }
      cr.loans = cr.loans.concat(held, paid.filter(l => l.left > 0));
    }
  };

  // ---------------- the screen (a tab in every branch and in the phone bank app) ----------------
  const f1 = 'font:inherit;font-size:16px;padding:8px;border-radius:10px;border:1px solid #ccc;margin:2px 0;min-width:0;flex:1';
  const srcOpts = id => `<select id="${id}" style="${f1}"><option value="sav">ออมทรัพย์หลัก (${bS(Bank.st().sav)})</option>${B.curAcct() ? `<option value="cur">กระแสรายวัน (${bS(B.curAcct().bal)})</option>` : ''}<option value="cash">เงินสด (${bS(S._c)})</option></select>`;
  function tabCredit() {
    const c = st(), x = cl(), sc = Credit.st().score, scCls = sc >= 700 ? 'good' : sc < 600 ? 'bad' : '';
    let h = `<p class="lead">💳 บัตรเครดิต และสินเชื่อ</p><p class="dim">คะแนนเครดิตบูโร <b class="${scCls}">${sc}</b>/900 · รายได้ประเมิน ~${bS(income())}/เดือน · ผ่อนจ่ายได้ทุกร้านที่ราคา 3,000 ฿ ขึ้นไป (เลือก "ผ่อน" ในหน้าต่างเลือกวิธีชำระเงินตอนซื้อของ) · เงินกู้บ้าน รถ ธุรกิจ ส่วนบุคคลอยู่แท็บ "สินเชื่อ ลงทุน ประกัน"</p>`;
    if (!has()) h += `<div class="card" style="grid-template-columns:1fr"><div class="cb"><h4>💳 สมัครบัตรเครดิตสุขใจ</h4><p class="dim">คุณสมบัติ: มีบัตรประชาชน · รายได้ประเมินตั้งแต่ 15,000 ฿/เดือน · คะแนนเครดิตตั้งแต่ 600 · วงเงินเริ่มต้น 3 เท่าของรายได้ (สูงสุด 300,000) ขอเพิ่มได้ภายหลัง · ดอกเบี้ย ${APR * 100}% ต่อปี (ถ้าไม่ชำระเต็ม) · ชำระขั้นต่ำ 8% (ขั้นต่ำ 500 ฿) · ค่าปรับล่าช้า 250 ฿</p><div class="row"><button class="btn" data-a="s163ccapply">📝 สมัครบัตรเครดิต</button></div></div></div>`;
    else {
      const T = tier(c.limit), util = Math.min(100, Math.round(sync(c) / c.limit * 100)), s = c.stmt;
      h += `${window.Cards171 ? window.Cards171.visual('cc0') : `<div style="background:linear-gradient(135deg,${T[1]});color:#fff;border-radius:16px;padding:14px 16px;margin:8px auto;max-width:430px;box-shadow:0 6px 16px rgba(0,0,0,.4)"><div style="display:flex;justify-content:space-between;font-size:13px"><b>ธนาคารสุขใจ · ${T[0]}</b><span>VISA</span></div><div style="font-size:19px;letter-spacing:3px;margin:12px 0 6px">${E(c.no.replace(/(\d{4})/g, '$1 ').trim())}</div><div style="display:flex;justify-content:space-between;font-size:12.5px"><span>${E((S.name || 'ชาวไร่').toUpperCase())}</span><span>วงเงิน ${bS(c.limit)}</span></div></div>`}
        <div class="card" style="grid-template-columns:1fr"><div class="cb"><h4>🎴 บัตรของฉัน (${(c.cards || []).length}/3 ใบ · ใช้วงเงินร่วมกัน)</h4>${(c.cards || []).map((k, i) => `<p style="margin:3px 0"><b>${PRODS[k.prod].n}</b> ${mask(i)} <span class="dim">· ${PRODS[k.prod].d}</span></p>`).join('')}<p class="dim">แต้มสะสม <b>${Math.floor(c.pts)}</b> แต้ม · เงินคืนสะสม <b>${bS(c.cb)}</b> (หักในใบแจ้งหนี้ถัดไป)</p><div class="row">${['cash', 'pts', 'travel'].filter(p => !(c.cards || []).some(x => x.prod === p)).map(p => `<button class="btn ghost" data-a="s163ccaddcard" data-v="${p}" ${(c.cards || []).length >= 3 ? 'disabled' : ''}>➕ ${PRODS[p].n}</button>`).join('')}<button class="btn ghost" data-a="s163ccredeem" ${c.pts >= 500 ? '' : 'disabled'}>🎁 แลกแต้ม</button></div>${promoOn() ? '<p class="good">🔥 ตอนนี้โปรผ่อน 0% นาน 10–24 เดือน (ไม่ต้องจ่ายดอกเบี้ย)</p>' : `<p class="dim">โปรผ่อน 0% นาน 10–24 เดือน รอบหน้าเริ่มวันที่ ${S.day + (21 - ((S.day - 1) % 21))}</p>`}</div></div>
        <div class="card" style="grid-template-columns:1fr"><div class="cb"><p>วงเงินคงเหลือ <b class="good">${bS(avail())}</b> · ยอดใช้ไป <b>${bS(c.bal)}</b> (${util}%) ${c.plans.length ? `· ผ่อนอยู่ ${c.plans.length} รายการ` : ''}</p><div style="background:rgba(255,255,255,.15);border-radius:6px;height:8px;overflow:hidden"><i style="display:block;height:100%;width:${Math.max(2, util)}%;background:${util > 80 ? '#ff7043' : '#8be28b'}"></i></div>
        <p class="dim">${s && !s.closed ? `📄 ใบแจ้งหนี้ ${E(RD(s.issued))}: ยอดทั้งหมด ${bS(s.total)} · ขั้นต่ำ ${bS(s.min)} · ชำระแล้ว ${bS(s.paid)} · ครบกำหนด <b>${E(RD(s.due))}</b>` : '📄 ไม่มียอดค้างในใบแจ้งหนี้ ใบแจ้งหนี้ใบถัดไปออกวันที่ 1 ของเดือน'} · ยอดใช้ในรอบนี้ (ยังไม่ออกบิล) ${bS(c.cur)}</p></div></div>
        <h5>ชำระบัตรเครดิต</h5><div class="row"><input id="ccPayAmt" type="number" min="1" placeholder="จำนวนเงิน" style="${f1}">${srcOpts('ccPaySrc')}</div>
        <div class="row"><button class="btn" data-a="s163ccpay" data-v="amt">💳 ชำระตามที่กรอก</button><button class="btn ghost" data-a="s163ccpay" data-v="min">ขั้นต่ำ ${bS(minDue(c))}</button><button class="btn ghost" data-a="s163ccpay" data-v="full">เต็มจำนวน ${bS(c.rev + c.ca + c.cur)}</button></div>
        <div class="row"><span class="dim" style="flex:none">ตัดบัญชีออมทรัพย์อัตโนมัติวันครบกำหนด:</span>${[['off', 'ปิด'], ['min', 'ขั้นต่ำ'], ['full', 'เต็มจำนวน']].map(([k, t]) => `<button class="btn ${c.auto === k ? '' : 'ghost'}" style="padding:5px 10px;font-size:13px" data-a="s163ccauto" data-v="${k}">${t}</button>`).join('')}</div>
        <h5>กดเงินสดจากบัตร</h5><p class="dim">ค่าธรรมเนียม 3% (ขั้นต่ำ 200 ฿) · ดอกเบี้ย ${(caApr() * 100).toFixed(0)}% ต่อปีนับตั้งแต่วันที่กด ไม่มีช่วงปลอดดอกเบี้ย · กดได้ไม่เกิน 50% ของวงเงิน (ตอนนี้กดได้อีก ${bS(Math.max(0, Math.floor(c.limit * 0.5 - c.ca)))})</p>
        <div class="row"><input id="ccAdvAmt" type="number" min="500" placeholder="จำนวนเงินที่ต้องการกด" style="${f1}"><select id="ccAdvTo" style="${f1}"><option value="sav">เข้าบัญชีออมทรัพย์หลัก</option><option value="cash">รับเป็นเงินสด</option></select><button class="btn" data-a="s163ccadv">กดเงินสด</button></div>
        <h5>ขอเพิ่มวงเงิน</h5><p class="dim">เงื่อนไข: ชำระตรงเวลา 3 รอบบิลติดกัน (ตอนนี้ ${c.clean}) · คะแนนเครดิต ≥ 680 · ขอได้ทุก 28 วัน · วงเงินสูงสุดตามรายได้/คะแนนตอนนี้ ${bS(cap())} · การขอมีผลต่อคะแนนเครดิตเล็กน้อย${c.lastReq + 28 > S.day ? ` · ขอครั้งถัดไปได้ ${E(RD(c.lastReq + 28))}` : ''}</p><div class="row"><button class="btn" data-a="s163ccraise">⬆️ ขอเพิ่มวงเงิน</button></div>
        <h5>รายการผ่อนชำระ (${c.plans.length})</h5>${c.plans.length ? c.plans.map(p => `<div class="card" style="grid-template-columns:1fr auto"><div class="cb"><h4>${E(p.label)}</h4><p class="dim">${E(p.payee || '')} · ซื้อ ${E(RD(p.start))} · ${bS(p.total)} ผ่อน ${p.m} เดือน เดือนละ ${bS(p.mo)}${p.r ? ` (ดอกเบี้ย ${(p.r * 100).toFixed(2)}%/เดือน)` : ' (0%)'} · เหลือ ${p.left} งวด เงินต้นคงเหลือ ${bS(p.prin)}</p></div><button class="btn ghost" data-a="s163ccpayoff" data-v="${p.id}">ปิดยอดก่อนกำหนด</button></div>`).join('') : '<p class="dim">ยังไม่มีรายการผ่อน · ซื้อของราคา 3,000 ฿ ขึ้นไป แล้วเลือก "ผ่อน" ตอนชำระเงิน</p>'}
        <h5>รายการใช้บัตรล่าสุด</h5>${c.tx.length ? `<div class="msgs">${c.tx.slice(0, 8).map(t => `<div class="msg"><b>${E(t.t)}</b> <small>${E(RD(t.d))}${t.p ? ' · ' + E(t.p) : ''}</small><p>${bS(t.a)}</p></div>`).join('')}</div>` : '<p class="dim">ยังไม่มีรายการ</p>'}`;
    }
    h += `<h5>💵 สินเชื่อกดเงินสด (วงเงินหมุนเวียน)</h5>`;
    if (!(x.limit > 0)) h += `<div class="card" style="grid-template-columns:1fr"><div class="cb"><p class="dim">วงเงินหมุนเวียนที่กดเข้าบัญชีได้ทันทีเมื่อต้องการเงิน ใช้เท่าไรคิดดอกเบี้ยเท่านั้น · ดอกเบี้ย ${(clApr() * 100).toFixed(0)}% ต่อปี · ผ่อนขั้นต่ำ 5% ต่อเดือน (ขั้นต่ำ 500 ฿) · คุณสมบัติ: บัตรประชาชน รายได้ตั้งแต่ 12,000 ฿/เดือน คะแนนเครดิต ≥ 620 · วงเงิน 1.5 เท่าของรายได้ (สูงสุด 500,000)</p><div class="row"><button class="btn" data-a="s163clapply">📝 สมัครสินเชื่อกดเงินสด</button></div></div></div>`;
    else h += `<div class="card" style="grid-template-columns:1fr"><div class="cb"><p>วงเงิน ${bS(x.limit)} · ยอดหนี้ <b class="${x.bal ? 'bad' : ''}">${bS(x.bal)}</b> · กดได้อีก <b class="good">${bS(x.limit - x.bal)}</b></p><p class="dim">ดอกเบี้ยบวกเข้ายอดหนี้ทุกต้นเดือน ${(clApr() * 100).toFixed(0)}% ต่อปี · ต้องชำระขั้นต่ำ ${bS(Math.min(x.bal, Math.max(500, Math.round(x.bal * 0.05))))} ต่อเดือน (ตัดบัญชีออมทรัพย์อัตโนมัติถ้าเปิดตัดบัญชีไว้) ไม่ชำระมีค่าปรับ 150 ฿ และคะแนนเครดิตลด</p></div></div>
      <div class="row"><input id="ccClAmt" type="number" min="1000" placeholder="จำนวนเงิน" style="${f1}">${srcOpts('ccClSrc')}</div><div class="row"><button class="btn" data-a="s163cldraw">💵 กดเงินเข้าบัญชีออมทรัพย์</button><button class="btn ghost" data-a="s163clrepay">ชำระคืน</button></div>`;
    return h;
  }
  UI.H.s163ccapply = () => apply();
  UI.H.s163ccaddcard = d => addCard(d.v);
  UI.H.s163ccredeem = () => redeem();
  UI.H.s163ccraise = () => raise();
  UI.H.s163ccauto = d => { st().auto = d.v; toast(d.v === 'off' ? 'ปิดการตัดบัญชีอัตโนมัติ' : d.v === 'min' ? 'ตัดบัญชีขั้นต่ำอัตโนมัติวันครบกำหนด' : 'ตัดบัญชีเต็มจำนวนอัตโนมัติวันครบกำหนด', '💳'); };
  UI.H.s163ccpay = d => { const c = st(), k = val('ccPaySrc') || 'sav'; const n = d.v === 'min' ? minDue(c) : d.v === 'full' ? Math.round(c.rev + c.ca + c.cur) : +val('ccPayAmt'); if (d.v === 'min' && !n) { toast('ไม่มียอดขั้นต่ำที่ต้องชำระ', 'ℹ️'); return; } pay(n, k); };
  UI.H.s163ccadv = () => { advance(+val('ccAdvAmt'), val('ccAdvTo')); };
  UI.H.s163ccpayoff = d => payoff(d.v);
  UI.H.s163clapply = () => applyCL();
  UI.H.s163cldraw = () => drawCL(+val('ccClAmt'));
  UI.H.s163clrepay = () => repayCL(+val('ccClAmt'), val('ccClSrc') || 'sav');

  // tabs: every branch window and the phone bank app
  { const _open = UI.open.bind(UI);
    UI.open = function (title, tabs, render, opts) {
      if (Array.isArray(tabs) && !tabs.includes('💳 บัตรเครดิต/สินเชื่อ')) {
        if (/^ธนาคารสุขใจ (สาขา|สำนักงาน)/.test(String(title)) && tabs.length >= 2) { const base = tabs.length, r0 = render; tabs = tabs.concat(['💳 บัตรเครดิต/สินเชื่อ']); render = t => (t === base ? tabCredit() : r0(t)); }
        else if (title === '📱 แอปธนาคารสุขใจ' && tabs.length >= 6) { const base = tabs.length, r0 = render; tabs = tabs.concat(['💳 บัตรเครดิต/สินเชื่อ']); render = t => (t === base ? tabCredit() : r0(t)); }
      }
      return _open(title, tabs, render, opts);
    }; }
  window.Card168 = Object.assign(card168, { addCard, redeem, aprFor, caApr, clApr, inquire, promoOn, PRODS, apply, raise, pay, advance, payoff, applyCL, drawCL, repayCL, daily, tabCredit, cl, cap, income, minDue, issueStatement, dueCheck, PL });
});
