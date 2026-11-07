'use strict';
// ---------- v169_bankmore: debit card, OTP, policy rate, credit bureau report, debt management ----------
//  * DEBIT CARD: issued on request, a payment method at every shop (straight from savings, up to 100,000 a day), lock / unlock, report lost, new card (100 baht)
//  * OTP: transfers of 20,000+ and card payments of 30,000+ need a 6-digit one-time code sent to the phone (can be switched off in the security card)
//  * POLICY RATE: the central bank moves it now and then; card, cash-line and fixed-deposit rates follow
//  * CREDIT BUREAU REPORT: grade A-F, what counts (payment record, debt, utilisation, enquiries, age) and tips; the interest rate you get depends on the score
//  * DEBT MANAGEMENT: restructure a loan (payment holiday / longer term / lower rate), refinance a loan at a lower rate, secured loans (against a fixed deposit or a car),
//    loan protection insurance (the bank pays the instalment while you are ill), and consolidating card debt into one loan
V23.add('v169_bankmore', () => {
  const B = window.Bank49; if (!B || typeof UI === 'undefined' || typeof Credit === 'undefined' || typeof Bank2 === 'undefined') return;
  const E = s => (typeof esc === 'function' ? esc(String(s == null ? '' : s)) : String(s == null ? '' : s));
  const bS = n => (typeof baht === 'function' ? baht(Math.round(n)) : '฿' + Math.round(n));
  const toast = (t, i) => { try { UI.toast(t, i || '🏦'); } catch (e) { } };
  const msg = (t, good) => { try { Phone.msg('ธนาคารสุขใจ', t, !!good); } catch (e) { } };
  const val = id => (document.getElementById(id) || {}).value;
  const V = () => { const v = B.V(); if (!v.cfg) v.cfg = {}; return v; };
  const slip = o => { try { if (window.Slip49) window.Slip49.make(o); } catch (e) { console.warn('slip', e); } };
  const mkOf = d => { try { const t = Cal36.date(d); return t.be * 12 + t.m; } catch (e) { return Math.floor(d / 30); } };
  const domOf = d => { try { return Cal36.date(d).dom; } catch (e) { return 1; } };
  const f1 = 'font:inherit;font-size:16px;padding:8px;border-radius:10px;border:1px solid #ccc;margin:2px 0;min-width:0;flex:1';
  const annuity = (P, r, n) => (r > 0 ? Math.round(P * (r / 12) / (1 - Math.pow(1 + r / 12, -n))) : Math.ceil(P / n));
  const remMonths = l => { const i = l.r / 12; if (!(l.pay > 0)) return l.n || 12; if (i <= 0) return Math.max(1, Math.ceil(l.left / l.pay)); const x = 1 - l.left * i / l.pay; return x <= 0 ? 99 : Math.max(1, Math.ceil(-Math.log(x) / Math.log(1 + i))); };
  const KIND = { home: 'บ้าน', car: 'รถ', sme: 'ธุรกิจ SME', personal: 'ส่วนบุคคล' };
  const sav = () => Bank.st().sav;

  // ===================== policy rate =====================
  const pol = () => { const v = V(); if (!v.pol) v.pol = { rate: 2.0, mk: mkOf(S.day) }; return v.pol; };
  window.Policy169 = { rate: () => pol().rate, delta: () => pol().rate - 2.0 };
  function polMonth() {
    const p = pol(), mk = mkOf(S.day); if (p.mk === mk) return; p.mk = mk;
    if (Math.random() < 0.3) { const up = Math.random() < 0.5, nr = Math.max(0.75, Math.min(4.5, p.rate + (up ? 0.25 : -0.25))); if (nr !== p.rate) { p.rate = nr; try { Phone.msg('ธนาคารแห่งชาติ', `คณะกรรมการนโยบายการเงิน${up ? 'ขึ้น' : 'ลด'}ดอกเบี้ยนโยบายเป็น ${nr.toFixed(2)}% ดอกเบี้ยบัตรเครดิต สินเชื่อกดเงินสด และเงินฝากประจำใหม่จะ${up ? 'สูงขึ้น' : 'ต่ำลง'}ตามนี้`, true); } catch (e) { } } }
  }

  // ===================== OTP =====================
  const OT = { cb: null, cancel: null, code: '', ref: '', tries: 0, amt: 0, prev: null, txt: '', msg: '' };
  const capture = () => (UI.cur ? { title: UI.cur.title, tabs: UI.cur.tabs, tab: UI.cur.tab, render: UI.cur.render, wide: UI.cur.wide } : null);
  const restore = p => { if (p && p.title) UI.open(p.title, p.tabs && p.tabs.length ? p.tabs : null, p.render, { tab: p.tab, wide: p.wide }); else UI.close(); };
  const sendCode = () => { OT.code = String(100000 + Math.floor(Math.random() * 900000)); OT.ref = Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 24)]).join(''); msg(`รหัส OTP ${OT.code} (Ref ${OT.ref}) ใช้ยืนยันรายการ ${bS(OT.amt)} อย่าบอกรหัสนี้กับใคร รวมถึงเจ้าหน้าที่ธนาคาร`, false); toast(`📩 รหัส OTP ของคุณ: ${OT.code} (Ref ${OT.ref})`, '🔐'); };
  window.Otp169 = {
    need: (amt, kind) => V().cfg.otp !== 0 && amt >= (kind === 'card' ? 30000 : 20000),
    ask(cb, cancel, amt) {
      OT.cb = cb; OT.cancel = cancel; OT.tries = 0; OT.amt = amt || 0; OT.txt = ''; OT.msg = ''; OT.prev = capture(); sendCode();
      UI.open('🔐 ยืนยันรหัส OTP', null, () => `<p class="lead">ยืนยันรายการ ${bS(OT.amt)}</p><p class="dim">ส่งรหัส OTP 6 หลักไปที่มือถือของคุณแล้ว (Ref <b>${OT.ref}</b>) ดูได้ที่ข้อความแจ้งเตือน 🔔 หรือแอปข้อความ · ใส่ผิดได้อีก ${3 - OT.tries} ครั้ง</p>
        <div class="row"><input id="s169otp" type="text" inputmode="numeric" maxlength="6" autocomplete="off" placeholder="รหัส OTP 6 หลัก" oninput="Otp169.setTxt(this.value)" style="flex:1;font:inherit;font-size:24px;letter-spacing:6px;text-align:center;padding:10px;border-radius:12px;border:2px solid #b9a77a;background:#fffdf3;color:#3a2f10"></div>
        ${OT.msg ? `<p style="color:#ffb3a3;font-weight:600">${E(OT.msg)}</p>` : ''}<div class="row end"><button class="btn ghost" data-a="s163otpx">ยกเลิก</button><button class="btn ghost" data-a="s163otpnew">ขอรหัสใหม่</button><button class="btn" data-a="s163otpok">✅ ยืนยัน</button></div>`, {});
      setTimeout(() => { const e = document.getElementById('s169otp'); if (e) e.focus(); }, 80);
    },
    setTxt: t => { OT.txt = t; },
  };
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target && e.target.id === 's169otp') { e.preventDefault(); const b = document.querySelector('#mBody [data-a="s163otpok"]'); if (b) b.click(); } });
  UI.H.s163otpx = () => { const f = OT.cancel, p = OT.prev; OT.cb = null; OT.cancel = null; if (f) f(); else restore(p); };
  UI.H.s163otpnew = () => { OT.tries = 0; OT.msg = ''; sendCode(); };
  UI.H.s163otpok = () => {
    if (!OT.cb) return; if (String(OT.txt).trim() === OT.code) { const f = OT.cb, p = OT.prev; OT.cb = null; OT.cancel = null; restore(p); f(); return; }
    OT.tries++; OT.txt = ''; if (OT.tries >= 3) { toast('ใส่ OTP ผิดครบ 3 ครั้ง ยกเลิกรายการ', '❌'); UI.H.s163otpx(); return; } OT.msg = `รหัส OTP ไม่ถูกต้อง (เหลืออีก ${3 - OT.tries} ครั้ง)`; toast('รหัส OTP ไม่ถูกต้อง', '❌');
  };

  // ===================== debit card =====================
  const deb = () => V().deb || null;
  const DEB_DAY = 100000;
  const debUsed = () => { const d = deb(); return d && d.day && d.day.d === S.day ? d.day.n : 0; };
  window.Debit169 = {
    methods(n) {
      const d = deb(), why = !d ? 'ยังไม่มีบัตรเดบิต ขอได้ที่ธนาคารสาขา/แอป แท็บ "เครดิตบูโร/จัดการหนี้"' : d.st !== 'active' ? (d.st === 'locked' ? 'บัตรเดบิตถูกล็อก ปลดล็อกในแอปธนาคาร' : 'บัตรเดบิตถูกอายัด ต้องขอบัตรใหม่') : n > DEB_DAY - debUsed() ? `เกินวงเงินบัตรเดบิตต่อวัน (เหลือ ${bS(DEB_DAY - debUsed())})` : sav() < n ? `เงินในบัญชีออมทรัพย์ ${bS(sav())} ไม่พอ` : '';
      return [{ k: 'debit', ok: !why, why: why || `บัตรเดบิต ${d.no.slice(-4).padStart(8, '•')} · หักจากบัญชีออมทรัพย์ทันที คงเหลือ ${bS(sav() - n)} · วงเงินวันนี้เหลือ ${bS(DEB_DAY - debUsed() - n)}`, fee: 0 }];
    },
    use(n) { const d = deb(); if (!d) return; if (!d.day || d.day.d !== S.day) d.day = { d: S.day, n: 0 }; d.day.n += n; },
    st: deb,
  };
  function issueDebit(reissue) {
    const v = V(); if (!B.hasId()) { toast('ขอบัตรเดบิตต้องใช้บัตรประชาชน (ทำที่ศูนย์ราชการ)', '🪪'); return; }
    if (reissue) { if (!deb()) return; if (sav() < 100) { toast('ค่าธรรมเนียมออกบัตรใหม่ 100 ฿ เงินไม่พอ', '💸'); return; } Bank.st().sav -= 100; B.tx('ค่าออกบัตรเดบิตใหม่', -100, 'main'); try { Bank2.log('ค่าออกบัตรเดบิตใหม่', -100); } catch (e) { } }
    else if (deb()) { toast('มีบัตรเดบิตอยู่แล้ว', 'ℹ️'); return; }
    v.deb = { no: '5' + String(Math.floor(Math.random() * 1e15)).padStart(15, '0'), st: 'active', issued: S.day, day: { d: 0, n: 0 } };
    msg(`${reissue ? 'ออกบัตรเดบิตใบใหม่' : 'อนุมัติบัตรเดบิต'} หมายเลข ${v.deb.no.slice(-4).padStart(8, '•')} ผูกกับบัญชีออมทรัพย์หลัก ใช้จ่ายได้ทุกร้าน วงเงินต่อวัน ${bS(DEB_DAY)}`, true); toast('ได้บัตรเดบิตแล้ว', '💳');
  }
  UI.H.s163debnew = () => issueDebit(false);
  UI.H.s163debre = () => issueDebit(true);
  UI.H.s163deblock = () => { const d = deb(); if (!d || d.st === 'lost') return; d.st = d.st === 'locked' ? 'active' : 'locked'; toast(d.st === 'locked' ? 'ล็อกบัตรเดบิตชั่วคราวแล้ว' : 'ปลดล็อกบัตรเดบิตแล้ว', '🔒'); };
  UI.H.s163deblost = () => { const d = deb(); if (!d || d.st === 'lost') return; if (!confirm('แจ้งบัตรเดบิตหาย/อายัดบัตร? บัตรใบนี้จะใช้ไม่ได้อีก ต้องขอบัตรใหม่ (100 ฿)')) return; d.st = 'lost'; d.lostDay = S.day; toast('อายัดบัตรเดบิตแล้ว', '🛑'); msg('อายัดบัตรเดบิตตามที่แจ้งแล้ว รายการหลังจากนี้จะไม่ถูกตัดเงิน ขอบัตรใหม่ได้ที่สาขาหรือแอปธนาคาร', true); };
  UI.H.s163otpset = d => { V().cfg.otp = d.v === 'on' ? 1 : 0; toast(d.v === 'on' ? 'เปิดการยืนยัน OTP' : 'ปิดการยืนยัน OTP (เสี่ยงต่อการถูกโกง)', '🔐'); };

  // ===================== credit bureau report =====================
  const gradeOf = sc => (sc >= 780 ? ['A+', 'ดีเยี่ยม', 'good'] : sc >= 720 ? ['A', 'ดีมาก', 'good'] : sc >= 650 ? ['B', 'ดี', 'good'] : sc >= 600 ? ['C', 'พอใช้', ''] : sc >= 550 ? ['D', 'ต่ำ', 'bad'] : ['F', 'เสี่ยงสูง', 'bad']);
  function totals() {
    const cr = Credit.st(), c = window.Card168 ? window.Card168.st() : cr.card, cl = cr.cl || { bal: 0, limit: 0 };
    const loans = cr.loans.reduce((a, l) => a + l.left, 0), card = c.bal || 0, line = cl.bal || 0, lim = (c.limit || 0) + (cl.limit || 0);
    return { loans, card, line, debt: loans + card + line, limit: lim, util: lim > 0 ? Math.round((card + line) / lim * 100) : 0, miss: (c.missed || 0) + cr.loans.reduce((a, l) => a + (l.miss || 0), 0), inq: (cr.inq || []).filter(d => S.day - d <= 84).length, clean: c.clean || 0 };
  }
  function bureauHtml() {
    const cr = Credit.st(), sc = cr.score, g = gradeOf(sc), t = totals(), A = window.Card168, apr = A ? A.aprFor() : 0.18, tips = [];
    if (t.util > 60) tips.push('ใช้วงเงินเกิน 60% ของวงเงินรวม ชำระคืนให้เหลือไม่เกิน 30% คะแนนจะดีขึ้น');
    if (t.miss > 0) tips.push('มีประวัติค้างชำระ ชำระตรงเวลาต่อเนื่องจะค่อยๆ ลบรอย');
    if (t.inq >= 3) tips.push('ยื่นขอสินเชื่อ/บัตรหลายครั้งในช่วงสั้นๆ ทำให้คะแนนลด รอให้ครบ 84 วันก่อนยื่นใหม่');
    if (t.clean < 3 && A && A.has()) tips.push('ชำระบัตรเครดิตตรงเวลาให้ครบ 3 รอบบิล จะขอเพิ่มวงเงินได้');
    if (!tips.length) tips.push('ประวัติเครดิตดี รักษาการชำระตรงเวลาและใช้วงเงินไม่เกิน 30% ต่อไป');
    const bar = (v, good) => `<div style="background:rgba(255,255,255,.15);border-radius:6px;height:8px;overflow:hidden;margin:2px 0 6px"><i style="display:block;height:100%;width:${Math.max(3, Math.min(100, v))}%;background:${good ? '#8be28b' : '#ffb74d'}"></i></div>`;
    return `<h5>📊 รายงานเครดิตบูโร</h5><div class="card" style="grid-template-columns:90px 1fr"><div class="ci" style="font-size:42px;font-weight:800;text-align:center" ><span class="${g[2]}">${g[0]}</span></div><div class="cb"><h4>คะแนน <b class="${g[2]}">${sc}</b>/900 · ${g[1]}</h4>${bar(Math.round((sc - 300) / 6), sc >= 650)}<p class="dim">ดอกเบี้ยที่คุณได้ตอนนี้: บัตรเครดิต ${(apr * 100).toFixed(1)}% · กดเงินสดจากบัตร ${((apr + 0.02) * 100).toFixed(1)}% · สินเชื่อกดเงินสด ${((apr + 0.06) * 100).toFixed(1)}% ต่อปี (คะแนนสูงดอกเบี้ยต่ำกว่า) · ดอกเบี้ยนโยบาย ${pol().rate.toFixed(2)}%</p></div></div>
      <div class="card" style="grid-template-columns:1fr"><div class="cb"><p>🧾 หนี้รวม <b>${bS(t.debt)}</b> (สินเชื่อ ${bS(t.loans)} · บัตรเครดิต ${bS(t.card)} · กดเงินสด ${bS(t.line)})</p><p>📈 วงเงินที่ใช้ ${t.util}% ${bar(t.util, t.util <= 30)}</p><p>⏱️ ชำระตรงเวลาต่อเนื่อง ${t.clean} รอบบิล · ค้างชำระสะสม ${t.miss} ครั้ง · ยื่นขอสินเชื่อ/บัตร 84 วันล่าสุด ${t.inq} ครั้ง</p><p class="dim">💡 ${tips.map(E).join('<br>💡 ')}</p></div></div>`;
  }

  // ===================== debt management =====================
  const wcut = () => (window.Cards171 && window.Cards171.rateCut ? window.Cards171.rateCut() : 0);
  const rateBase = (k, sc) => ({ home: 0.0625, car: 0.045, sme: 0.075, personal: 0.18 }[k] || 0.18) + (sc < 600 ? 0.03 : sc > 750 ? -0.01 : 0) - wcut();
  function canRestructure(l) { const inc = Credit.income(), sc = Credit.st().score; if (S.day - (l.rs || -999) < 168) return `ขอได้ทุก 168 วัน (ครั้งถัดไป ${RD((l.rs || 0) + 168)})`; if (!(l.miss > 0 || inc < l.pay * 2.5 || sc < 620)) return 'ธนาคารพิจารณาเฉพาะลูกหนี้ที่ค้างชำระ รายได้ไม่พอ หรือคะแนนต่ำ'; return ''; }
  function restructure(i, how) {
    const cr = Credit.st(), l = cr.loans[+i]; if (!l) return; const why = canRestructure(l); if (why) { toast(why, '🏦'); return; }
    const fee = Math.max(300, Math.round(l.left * 0.01)); if (sav() < fee) { toast(`ค่าธรรมเนียมปรับโครงสร้างหนี้ ${bS(fee)} เงินไม่พอ`, '💸'); return; }
    Bank.st().sav -= fee; B.tx('ค่าธรรมเนียมปรับโครงสร้างหนี้', -fee, 'main'); try { Bank2.log('ค่าธรรมเนียมปรับโครงสร้างหนี้', -fee); } catch (e) { }
    const nr = remMonths(l); let note = '';
    if (how === 'hold') { l.hold = 1; note = 'พักชำระ 1 เดือน (ดอกเบี้ยยังคิดตามปกติ)'; }
    else if (how === 'extend') { const n2 = nr + 12; l.pay = annuity(l.left, l.r, n2); note = `ขยายงวดอีก 12 เดือน ค่างวดใหม่ ${bS(l.pay)}`; }
    else if (how === 'rate') { if (!(l.miss > 0)) { toast('ลดดอกเบี้ยได้เฉพาะสินเชื่อที่ค้างชำระ', '🏦'); Bank.st().sav += fee; return; } l.r = Math.max(0.03, l.r * 0.8); l.pay = annuity(l.left, l.r, nr); note = `ลดดอกเบี้ยเหลือ ${(l.r * 100).toFixed(2)}% ค่างวดใหม่ ${bS(l.pay)}`; }
    l.miss = 0; l.rs = S.day; cr.score = Math.max(300, cr.score - 10);
    msg(`อนุมัติปรับโครงสร้างหนี้ ${KIND[l.kind] || ''}: ${note} · ค่าธรรมเนียม ${bS(fee)} (บันทึกในเครดิตบูโร คะแนนลด 10)`, true); toast('อนุมัติปรับโครงสร้างหนี้', '🤝');
    slip({ k: 'acct', amt: fee, payee: 'ปรับโครงสร้างหนี้', memo: note, from: 'ออมทรัพย์ ' + B.all()[0].no });
  }
  function refiQuote(l) { const sc = Credit.st().score, rn = rateBase(l.kind, sc) - 0.003; if (rn > l.r - 0.005) return null; const nr0 = remMonths(l), nr = nr0 >= 99 ? Math.max(l.n || 120, 120) : nr0, fee = Math.max(1000, Math.round(l.left * 0.01)) + (l.kind === 'home' ? Math.round(l.left * 0.01) : 0), pay = annuity(l.left, rn, nr); if (pay > l.pay) return null; return { r: rn, nr, pay, fee }; }
  function refinance(i) {
    const cr = Credit.st(), l = cr.loans[+i]; if (!l) return; if (l.tag === 'fd') { toast('สินเชื่อค้ำเงินฝากรีไฟแนนซ์ไม่ได้', 'ℹ️'); return; } const q = refiQuote(l); if (!q) { toast('ตอนนี้ยังไม่มีอัตราดอกเบี้ยที่ต่ำกว่าเดิมอย่างน้อย 0.5% ให้รีไฟแนนซ์', 'ℹ️'); return; }
    if (sav() < q.fee) { toast(`ค่าธรรมเนียมรีไฟแนนซ์ ${bS(q.fee)} เงินไม่พอ`, '💸'); return; } const saving = (l.pay - q.pay) * q.nr;
    if (!confirm(`รีไฟแนนซ์: ดอกเบี้ย ${(l.r * 100).toFixed(2)}% → ${(q.r * 100).toFixed(2)}% ค่างวด ${bS(l.pay)} → ${bS(q.pay)} (ประหยัดประมาณ ${bS(saving)}) ค่าธรรมเนียม ${bS(q.fee)} ตกลงไหม?`)) return;
    Bank.st().sav -= q.fee; B.tx('ค่าธรรมเนียมรีไฟแนนซ์', -q.fee, 'main'); try { Bank2.log('ค่าธรรมเนียมรีไฟแนนซ์สินเชื่อ', -q.fee); } catch (e) { } l.r = q.r; l.pay = q.pay; l.rf = S.day; cr.score = Math.max(300, cr.score - 5); (cr.inq = cr.inq || []).push(S.day);
    msg(`รีไฟแนนซ์สินเชื่อ${KIND[l.kind]} สำเร็จ ดอกเบี้ยใหม่ ${(q.r * 100).toFixed(2)}% ค่างวดใหม่ ${bS(q.pay)}`, true); toast('รีไฟแนนซ์สำเร็จ', '🔁');
  }
  function buyPpi(i) {
    const cr = Credit.st(), l = cr.loans[+i]; if (!l || l.ppi) return; const fee = Math.max(100, Math.round(l.left * 0.02)); if (sav() < fee) { toast(`เบี้ยประกัน ${bS(fee)} เงินไม่พอ`, '💸'); return; }
    Bank.st().sav -= fee; l.ppi = 1; l.ppiUsed = 0; B.tx('เบี้ยประกันคุ้มครองสินเชื่อ', -fee, 'main'); try { Bank2.log('เบี้ยประกันคุ้มครองสินเชื่อ', -fee); } catch (e) { }
    toast(`ซื้อประกันคุ้มครองสินเชื่อ ${bS(fee)} แล้ว (จ่ายค่างวดแทนถ้าป่วย สูงสุด 3 ครั้ง)`, '🛡️'); slip({ k: 'acct', amt: fee, payee: 'ประกันคุ้มครองสินเชื่อ', memo: `สินเชื่อ${KIND[l.kind]} คงเหลือ ${bS(l.left)}`, from: 'ออมทรัพย์ ' + B.all()[0].no });
  }
  const lockedFd = id => Credit.st().loans.some(l => l.tag === 'fd' && l.fdId === id);
  window.Secured169 = {
    locked: lockedFd,
    settle(f, tot) { const cr = Credit.st(), l = cr.loans.find(x => x.tag === 'fd' && x.fdId === f.id); if (!l) return tot; const p = Math.min(tot, l.left); l.left -= p; if (l.left <= 0) cr.loans.splice(cr.loans.indexOf(l), 1); msg(`เงินฝากประจำครบกำหนด ธนาคารหักชำระสินเชื่อที่ค้ำประกัน ${bS(p)}${l.left > 0 ? ` (ยังเหลือหนี้ ${bS(l.left)})` : ' ปิดสินเชื่อแล้ว'}`, true); return tot - p; },
  };
  function secureFd() {
    const v = B.V(), f = (v.fd || []).find(x => String(x.id) === String(val('s169fd'))); if (!f) { toast('เลือกบัญชีเงินฝากประจำ', 'ℹ️'); return; } if (lockedFd(f.id)) { toast('เงินฝากนี้ค้ำสินเชื่ออยู่แล้ว', 'ℹ️'); return; }
    const mx = Math.floor(f.amt * 0.9), n = Math.min(mx, Math.round(+val('s169fdAmt') || mx)); if (n < 5000) { toast('กู้ค้ำเงินฝากขั้นต่ำ 5,000 ฿', 'ℹ️'); return; }
    const r = (f.rate + 2) / 100, pay = annuity(n, r, 12); Credit.st().loans.push({ kind: 'personal', tag: 'fd', fdId: f.id, left: n, pay, r, n: 12, ref: 'กู้ค้ำเงินฝากประจำ', miss: 0 }); Bank.st().sav += n; B.tx('กู้ค้ำเงินฝากประจำ', n, 'main'); try { Bank2.log('กู้ค้ำเงินฝากประจำ', n); } catch (e) { }
    msg(`อนุมัติสินเชื่อค้ำเงินฝากประจำ ${bS(n)} ดอกเบี้ย ${(r * 100).toFixed(2)}% ต่อปี ผ่อน 12 เดือน เดือนละ ${bS(pay)} (เงินฝากประจำถูกล็อกจนกว่าจะชำระหมด)`, true); toast(`กู้ค้ำเงินฝาก ${bS(n)} เข้าบัญชีแล้ว`, '🏦');
  }
  function secureCar() {
    const i = +val('s169car'), car = (S.cars || [])[i]; if (!car) { toast('เลือกรถ', 'ℹ️'); return; } const price = (typeof CARS !== 'undefined' && CARS[car.type] ? CARS[car.type].price : 10000);
    if (Credit.st().loans.some(l => l.kind === 'car' && l.ref === i)) { toast('รถคันนี้ค้ำสินเชื่ออยู่แล้ว', 'ℹ️'); return; } const mx = Math.floor(price * 0.5), n = Math.min(mx, Math.round(+val('s169carAmt') || mx)); if (n < 3000) { toast('ขั้นต่ำ 3,000 ฿ (รถมูลค่าน้อยเกินไป)', 'ℹ️'); return; }
    const r = 0.16 + (Credit.st().score < 600 ? 0.03 : 0) - wcut(), pay = annuity(n, r, 24); Credit.st().loans.push({ kind: 'car', ref: i, left: n, pay, r, n: 24, miss: 0, tag: 'title' }); Bank.st().sav += n; B.tx('จำนำทะเบียนรถ', n, 'main'); try { Bank2.log('สินเชื่อจำนำทะเบียนรถ', n); } catch (e) { }
    msg(`อนุมัติสินเชื่อจำนำทะเบียนรถ ${bS(n)} (ไม่เกิน 50% ของมูลค่ารถ) ดอกเบี้ย ${(r * 100).toFixed(1)}% ต่อปี ผ่อน 24 เดือน เดือนละ ${bS(pay)} ผ่อนไม่ไหวโดนยึดรถ`, true); toast(`ได้เงิน ${bS(n)} เข้าบัญชีออมทรัพย์`, '🚗');
  }
  function consolidate() {
    const A = window.Card168; if (!A || !A.has()) { toast('ยังไม่มีบัตรเครดิต', 'ℹ️'); return; } const c = A.st(), amt = Math.round(c.rev + c.ca); if (amt < 5000) { toast('ยอดหนี้บัตรที่ออกใบแจ้งหนี้แล้วต้องไม่ต่ำกว่า 5,000 ฿ จึงรวมหนี้ได้', 'ℹ️'); return; }
    const cr = Credit.st(); if (cr.score < 600) { toast(`คะแนนเครดิต ${cr.score} ต่ำกว่า 600 ธนาคารไม่อนุมัติ`, '🏦'); return; } const n = +val('s169consN') || 24, r = Math.max(0.08, 0.13 + (cr.score < 650 ? 0.03 : 0) + (window.Policy169 ? window.Policy169.delta() / 100 : 0) - wcut()), fee = Math.max(300, Math.round(amt * 0.01)), tot = amt + fee, pay = annuity(tot, r, n);
    if (!confirm(`รวมหนี้บัตรเครดิต ${bS(amt)} เป็นสินเชื่อก้อนเดียว: ดอกเบี้ย ${(r * 100).toFixed(1)}% ต่อปี ผ่อน ${n} เดือน เดือนละ ${bS(pay)} ค่าธรรมเนียม ${bS(fee)} ตกลงไหม?`)) return;
    c.rev = 0; c.ca = 0; if (c.stmt) c.stmt.closed = true; c.apr = A.aprFor(); cr.loans.push({ kind: 'personal', tag: 'consol', left: tot, pay, r, n, ref: 'รวมหนี้บัตรเครดิต', miss: 0 }); cr.score = Math.max(300, cr.score - 10); (cr.inq = cr.inq || []).push(S.day);
    msg(`รวมหนี้บัตรเครดิต ${bS(amt)} เป็นสินเชื่อส่วนบุคคล ดอกเบี้ย ${(r * 100).toFixed(1)}% ผ่อน ${n} เดือน เดือนละ ${bS(pay)} (บัตรเครดิตกลับมาใช้วงเงินได้)`, true); toast('รวมหนี้สำเร็จ', '🧮');
    slip({ k: 'acct', amt: amt, fee, payee: 'รวมหนี้บัตรเครดิต', memo: `สินเชื่อใหม่ ${bS(tot)} ผ่อน ${n} เดือน`, from: 'ธนาคารสุขใจ', neutral: true });
  }
  UI.H.s163lrs = d => { const [i, how] = String(d.v).split('|'); restructure(i, how); };
  UI.H.s163lrefi = d => refinance(d.v);
  UI.H.s163lppi = d => buyPpi(d.v);
  UI.H.s163lfd = () => secureFd();
  UI.H.s163lcar = () => secureCar();
  UI.H.s163lcons = () => consolidate();

  // ===================== the screen =====================
  function tabDebt() {
    const cr = Credit.st(), d = deb(), v = B.V(), A = window.Card168;
    let h = `<p class="lead">📊 เครดิตบูโร · บัตรเดบิต · จัดการหนี้</p>` + bureauHtml();
    h += `<h5>💳 บัตรเดบิต</h5>` + (!d ? `<div class="card" style="grid-template-columns:1fr"><div class="cb"><p class="dim">ใช้จ่ายได้ทุกร้านโดยหักจากบัญชีออมทรัพย์ทันที (ไม่ต้องจ่ายดอกเบี้ย) วงเงินต่อวัน ${bS(DEB_DAY)} · ออกบัตรใบแรกฟรี ใช้บัตรประชาชนยืนยัน</p><div class="row"><button class="btn" data-a="s163debnew">📝 ขอบัตรเดบิต</button></div></div></div>`
      : `${window.Cards171 ? window.Cards171.visual('debit') : `<div style="background:linear-gradient(135deg,#0d47a1,#42a5f5);color:#fff;border-radius:16px;padding:12px 14px;max-width:420px;margin:6px auto"><div style="display:flex;justify-content:space-between;font-size:12.5px"><b>ธนาคารสุขใจ · Debit</b><span>${d.st === 'active' ? '✅ ใช้งานได้' : d.st === 'locked' ? '🔒 ล็อกชั่วคราว' : '🛑 อายัดแล้ว'}</span></div><div style="font-size:18px;letter-spacing:3px;margin:10px 0 4px">${E(d.no.replace(/(\d{4})/g, '$1 ').trim())}</div><div style="font-size:12px">${E((S.name || 'ชาวไร่').toUpperCase())} · ใช้วันนี้ ${bS(debUsed())}/${bS(DEB_DAY)}</div></div>`}
        <div class="row">${d.st === 'lost' ? '<button class="btn" data-a="s163debre">ขอบัตรใหม่ (100 ฿)</button>' : `<button class="btn ghost" data-a="s163deblock">${d.st === 'locked' ? '🔓 ปลดล็อกบัตร' : '🔒 ล็อกบัตรชั่วคราว'}</button><button class="btn ghost" data-a="s163deblost">🛑 แจ้งบัตรหาย/อายัด</button>`}</div>`);
    h += `<h5>🔐 ความปลอดภัย</h5><div class="card" style="grid-template-columns:1fr"><div class="cb"><p class="dim">ยืนยัน OTP ทางมือถือสำหรับการโอน 20,000 ฿ ขึ้นไป และจ่ายด้วยบัตรเครดิต 30,000 ฿ ขึ้นไป · ปัจจุบัน: <b class="${v.cfg && v.cfg.otp === 0 ? 'bad' : 'good'}">${v.cfg && v.cfg.otp === 0 ? 'ปิด' : 'เปิด'}</b></p><div class="row"><button class="btn ${v.cfg && v.cfg.otp === 0 ? 'ghost' : ''}" data-a="s163otpset" data-v="on">เปิด OTP</button><button class="btn ${v.cfg && v.cfg.otp === 0 ? '' : 'ghost'}" data-a="s163otpset" data-v="off">ปิด OTP</button></div></div></div>`;
    h += `<h5>🏦 สินเชื่อของฉัน (${cr.loans.length})</h5>`;
    if (!cr.loans.length) h += '<p class="dim">ไม่มีสินเชื่อค้างอยู่ · ขอกู้ได้ที่แท็บ "สินเชื่อ ลงทุน ประกัน" หรือกู้ค้ำประกันด้านล่าง</p>';
    cr.loans.forEach((l, i) => {
      const why = canRestructure(l), rq = l.tag === 'fd' ? null : refiQuote(l), rem = remMonths(l);
      h += `<div class="card" style="grid-template-columns:1fr"><div class="cb"><h4>${KIND[l.kind] || ''} ${l.ref && typeof l.ref === 'string' ? '· ' + E(l.ref) : ''}${l.ppi ? ' 🛡️' : ''}${l.hold ? ' ⏸' : ''}</h4><p class="dim">คงเหลือ ${bS(l.left)} · ผ่อน ${bS(l.pay)}/เดือน · ดอกเบี้ย ${(l.r * 100).toFixed(2)}% · เหลือประมาณ ${rem} งวด${l.miss ? ` · <b class="bad">ค้าง ${l.miss} งวด</b>` : ''}${l.ppi ? ` · ประกันคุ้มครองใช้แล้ว ${l.ppiUsed || 0}/3` : ''}</p>
        <div class="row"><button class="btn ghost" style="font-size:13px;padding:5px 9px" data-a="s163lrs" data-v="${i}|hold" ${why ? 'disabled' : ''}>⏸ พักชำระ 1 เดือน</button><button class="btn ghost" style="font-size:13px;padding:5px 9px" data-a="s163lrs" data-v="${i}|extend" ${why ? 'disabled' : ''}>📆 ขยายงวด +12</button><button class="btn ghost" style="font-size:13px;padding:5px 9px" data-a="s163lrs" data-v="${i}|rate" ${why || !l.miss ? 'disabled' : ''}>📉 ลดดอกเบี้ย</button></div>
        <div class="row"><button class="btn ghost" style="font-size:13px;padding:5px 9px" data-a="s163lrefi" data-v="${i}" ${rq ? '' : 'disabled'}>🔁 รีไฟแนนซ์${rq ? ` (ดอกเบี้ย ${(rq.r * 100).toFixed(2)}% · ค่างวด ${bS(rq.pay)})` : ''}</button><button class="btn ghost" style="font-size:13px;padding:5px 9px" data-a="s163lppi" data-v="${i}" ${l.ppi ? 'disabled' : ''}>🛡️ ประกันคุ้มครองสินเชื่อ (${bS(Math.max(100, l.left * 0.02))})</button></div>${why ? `<p class="dim" style="font-size:12px">ปรับโครงสร้างหนี้: ${E(why)}</p>` : ''}</div></div>`;
    });
    h += `<h5>🔒 กู้ค้ำประกัน (ดอกเบี้ยต่ำกว่ากู้ทั่วไป)</h5><p class="dim">ค้ำด้วยเงินฝากประจำ: กู้ได้ 90% ของยอดฝาก ดอกเบี้ย = ดอกเบี้ยเงินฝาก + 2% ผ่อน 12 เดือน (เงินฝากถูกล็อก) · จำนำทะเบียนรถ: กู้ได้ 50% ของมูลค่ารถ ดอกเบี้ย 16% ผ่อน 24 เดือน ผ่อนไม่ไหวโดนยึดรถ</p>`;
    h += (v.fd || []).length ? `<div class="row"><select id="s169fd" style="${f1}">${v.fd.map(f => `<option value="${f.id}" ${lockedFd(f.id) ? 'disabled' : ''}>เงินฝากประจำ ${bS(f.amt)} · ${f.term} เดือน${lockedFd(f.id) ? ' (ค้ำอยู่)' : ''}</option>`).join('')}</select><input id="s169fdAmt" type="number" min="5000" placeholder="จำนวนที่กู้ (ว่าง = สูงสุด)" style="${f1}"><button class="btn" data-a="s163lfd">กู้ค้ำเงินฝาก</button></div>` : '<p class="dim">ยังไม่มีเงินฝากประจำ (ฝากที่แท็บ "เงินฝากประจำ")</p>';
    h += (S.cars || []).length ? `<div class="row"><select id="s169car" style="${f1}">${S.cars.map((c, i) => `<option value="${i}">${E((typeof CARS !== 'undefined' && CARS[c.type] ? CARS[c.type].n : 'รถ') + ' · ' + (c.plate || '#' + (i + 1)))} · มูลค่า ${bS(typeof CARS !== 'undefined' && CARS[c.type] ? CARS[c.type].price : 10000)}</option>`).join('')}</select><input id="s169carAmt" type="number" min="3000" placeholder="จำนวนที่กู้ (ว่าง = สูงสุด)" style="${f1}"><button class="btn" data-a="s163lcar">จำนำทะเบียนรถ</button></div>` : '<p class="dim">ยังไม่มีรถ</p>';
    if (A && A.has()) { const c = A.st(), amt = Math.round(c.rev + c.ca); h += `<h5>🧮 รวมหนี้บัตรเครดิต</h5><p class="dim">ยอดหนี้บัตรที่ออกใบแจ้งหนี้แล้ว ${bS(amt)} · รวมเป็นสินเชื่อก้อนเดียว ดอกเบี้ยต่ำกว่าบัตร (ประมาณ 13–16% ต่อปี) ผ่อนคงที่ ค่าธรรมเนียม 1% · มีผลต่อเครดิตบูโรเล็กน้อย</p><div class="row"><select id="s169consN" style="${f1}"><option value="12">12 เดือน</option><option value="24" selected>24 เดือน</option><option value="36">36 เดือน</option></select><button class="btn" data-a="s163lcons" ${amt >= 5000 ? '' : 'disabled'}>รวมหนี้</button></div>`; }
    return h;
  }
  { const _open = UI.open.bind(UI);
    UI.open = function (title, tabs, render, opts) {
      if (Array.isArray(tabs) && !tabs.includes('📊 เครดิตบูโร/จัดการหนี้')) {
        if (/^ธนาคารสุขใจ (สาขา|สำนักงาน)/.test(String(title)) && tabs.length >= 2) { const base = tabs.length, r0 = render; tabs = tabs.concat(['📊 เครดิตบูโร/จัดการหนี้']); render = t => (t === base ? tabDebt() : r0(t)); }
        else if (title === '📱 แอปธนาคารสุขใจ' && tabs.length >= 6) { const base = tabs.length, r0 = render; tabs = tabs.concat(['📊 เครดิตบูโร/จัดการหนี้']); render = t => (t === base ? tabDebt() : r0(t)); }
      }
      return _open(title, tabs, render, opts);
    }; }
  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { polMonth(); } catch (e) { console.warn('v169 pol', e); } return r; }; }
  window.Bank169 = { tabDebt, bureauHtml, totals, gradeOf, issueDebit, restructure, refinance, consolidate, annuity, remMonths };
});
