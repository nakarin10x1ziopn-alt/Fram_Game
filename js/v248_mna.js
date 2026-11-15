'use strict';
// ---------- v248: buying and selling companies (M&A) ----------
// Company page > tab "ซื้อ-ขายกิจการ". The market lists 4-6 small companies for sale (refreshed every 14 days, each stays 28 days).
//  - what the seller shows (profit) can be too rosy: a due-diligence check (30,000) reveals the true profit, the debt and the hidden problems
//  - you offer a price: the seller has a hidden lowest price; a near miss gets a counter offer
//  - a bought company becomes a SUBSIDIARY of the company that paid: 90 days of integration at 70% performance, then its profit (+10% synergy when it is the same kind of
//    business) flows into the parent every month, minus interest on the debt you took over; hidden problems can hit: a lawsuit, or the key people leaving (revenue -30%)
//  - a subsidiary can be sold again: 16 months of profit minus its debt
V23.add('v248_mna', function () {
  if (typeof Company === 'undefined' || !Company.list || typeof CO_TYPES === 'undefined' || typeof Cal36 === 'undefined') return;
  const E = s => (typeof esc === 'function' ? esc(s) : String(s));
  const B = n => (typeof baht0 === 'function' ? baht0(n) : typeof baht === 'function' ? baht(n) : Math.round(n).toLocaleString('en-US') + ' ฿');
  const rnd = (a, b) => a + Math.random() * (b - a), ri = (a, b) => Math.round(rnd(a, b)), pick = a => a[Math.floor(Math.random() * a.length)];
  const R10k = n => Math.round(n / 10000) * 10000;
  const DD_FEE = 30000, MAXT = 6, LIFE = 28;
  const PRE = ['สุขใจ', 'ทองดี', 'ไทยเจริญ', 'มั่งคั่ง', 'รุ่งโรจน์', 'ศรีสยาม', 'นครพัฒนา', 'ภูมิพัฒน์', 'ธนกร', 'อรุณไทย', 'พัฒนาการ', 'ใจดี'];
  const X = () => { const x = S.mna = S.mna || {}; x.targets = x.targets || []; x.day = x.day || 0; x.seq = x.seq || 0; x.log = x.log || []; return x; };
  const open = c => c && c.st === 'open';
  const msg = (c, t, q) => { try { Phone.msg(c.name, t, !!q); } catch (e) { } };
  const hist = (c, t) => { try { c.hist.unshift(`${RD(S.day)}: ${t}`); } catch (e) { } };

  const make = () => {
    const x = X(), keys = Object.keys(CO_TYPES), k = pick(keys), T = CO_TYPES[k], n = ri(3, 14), rev = Math.round(n * rnd(35000, 70000) / 1000) * 1000;
    const mTrue = rnd(0.08, 0.24), over = Math.random() < 0.55 ? rnd(0.1, 0.5) : 0, mShown = mTrue * (1 + over), debt = Math.random() < 0.6 ? Math.round(rev * rnd(0.3, 3) / 10000) * 10000 : 0;
    const shown = Math.round(rev * mShown), ask = Math.max(100000, R10k(shown * rnd(14, 22)));
    return { id: ++x.seq, name: `${pick(PRE)} ${(T.n || k).replace(/^บริษัท/, '').trim()}`.slice(0, 40), type: k, i: T.i || '🏢', staff: n, rev, mTrue, mShown, debt, ask, reserve: Math.round(ask * rnd(0.78, 0.95) / 10000) * 10000, law: Math.random() < 0.25, key: Math.random() < 0.25, born: S.day, until: S.day + LIFE, dd: 0, counter: 0 };
  };
  const refresh = () => {
    const x = X(); x.targets = x.targets.filter(t => t.until >= S.day);
    if (S.day - x.day < 14 && x.targets.length >= 3) return x.targets; x.day = S.day;
    while (x.targets.length < MAXT) x.targets.push(make());
    return x.targets;
  };
  const subsOf = c => (c.subs = c.subs || []);
  const profitOf = (s, parent) => {
    const f = (S.day < s.integ ? 0.7 : 1) * (s.type === (parent && parent.type) ? 1.1 : 1);
    return Math.round(s.rev * s.mTrue * f - s.debt * 0.01);
  };

  const buy = (c, t, price) => {
    const fee = Math.round(price * 0.02);
    if (c.cash < price + fee) { UI.toast(`เงินบริษัทไม่พอ ต้องใช้ ${B(price + fee)} (รวมค่าธรรมเนียม 2%)`, '⚠️'); return false; }
    c.cash -= price + fee; try { Company.book(c, 0, fee); } catch (e) { }
    c.loan = (c.loan || 0) + t.debt;
    const s = { id: t.id, name: t.name, type: t.type, i: t.i, staff: t.staff, rev: t.rev, mTrue: t.mTrue, debt: t.debt, since: S.day, integ: S.day + 90, paid: price, law: t.law ? S.day + ri(20, 60) : 0, key: t.key ? S.day + 45 : 0 };
    subsOf(c).push(s); const x = X(); x.targets = x.targets.filter(q => q.id !== t.id);
    msg(c, `🤝 ซื้อกิจการ ${t.name} สำเร็จ ราคา ${B(price)} (+ค่าธรรมเนียม ${B(fee)}) รับหนี้มา ${B(t.debt)} · ช่วงปรับตัว 90 วัน ผลงานจะอยู่ที่ 70%`); hist(c, `ซื้อกิจการ ${t.name} ${B(price)}`);
    c.rep = Math.min(100, (c.rep || 0) + 1);
    return true;
  };

  const monthly = c => {
    for (const s of subsOf(c)) {
      const p = profitOf(s, c), rev = Math.round(s.rev * (S.day < s.integ ? 0.7 : 1));
      c.cash += p; try { Company.book(c, Math.max(0, rev), Math.max(0, rev - p)); } catch (e) { }
      msg(c, `🏢 บริษัทในเครือ ${s.name}: รายได้ ${B(rev)} · กำไรเข้าบริษัทแม่ ${B(p)}${S.day < s.integ ? ' (ช่วงปรับตัว)' : ''}`, true);
    }
  };
  const daily = () => {
    refresh();
    for (const c of Company.list()) {
      if (!open(c) || !c.subs || !c.subs.length) continue;
      for (const s of c.subs) {
        if (s.law && S.day >= s.law) { const cost = Math.round(s.rev * rnd(0.5, 2)); s.law = 0; c.cash -= cost; try { Company.book(c, 0, cost); } catch (e) { } msg(c, `⚖️ ${s.name} ถูกฟ้อง (ปัญหาที่ซ่อนอยู่ก่อนซื้อ) จ่ายค่าเสียหายและค่าทนาย ${B(cost)}`); }
        if (s.key && S.day >= s.key) { s.key = 0; s.rev = Math.round(s.rev * 0.7); msg(c, `📤 คนสำคัญของ ${s.name} ลาออกหลังควบรวม รายได้ลดลง 30%`); }
      }
      const t = Cal36.date(S.day); if (t.dom === 1 && c.mnaM !== S.day) { c.mnaM = S.day; monthly(c); }
    }
  };
  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { daily(); } catch (e) { console.warn('v248 daily', e); } return r; }; }

  const section = c => {
    const L = refresh(), subs = subsOf(c);
    const own = subs.length ? `<div class="cx-grid">${subs.map((s, i) => `<div class="cx-card"><h4>${s.i} ${E(s.name)}</h4><p class="cx-meta">พนักงาน ${s.staff} คน · รายได้ ${B(s.rev)}/เดือน · กำไรเข้าแม่ ${B(profitOf(s, c))}/เดือน<br>หนี้ที่รับมา ${B(s.debt)} · ซื้อมา ${B(s.paid)} · ${S.day < s.integ ? `ปรับตัวอีก ${s.integ - S.day} วัน` : '✅ ปรับตัวเสร็จแล้ว'}${s.type === c.type ? ' · เสริมกัน +10%' : ''}</p><div class="cx-actions"><button class="btn ghost" data-a="mna248" data-v="sell|${i}">ขายกิจการ ${B(Math.max(0, profitOf(s, c) * 16 - s.debt))}</button></div></div>`).join('')}</div>` : '<p class="dim">ยังไม่มีบริษัทในเครือ</p>';
    const mk = L.map(t => {
      const profit = t.dd ? Math.round(t.rev * t.mTrue) : Math.round(t.rev * t.mShown);
      const dd = t.dd ? `<span class="cx-chip ${t.mTrue < t.mShown * 0.9 ? 'bad' : 'good'}">✔ ตรวจแล้ว: กำไรจริง ${B(profit)}${t.mTrue < t.mShown * 0.9 ? ' (ต่ำกว่าที่โชว์)' : ''}</span><span class="cx-chip">หนี้ ${B(t.debt)}</span>${t.law ? '<span class="cx-chip bad">มีคดีความค้าง</span>' : ''}${t.key ? '<span class="cx-chip bad">คนสำคัญจะลาออก</span>' : ''}${!t.law && !t.key && t.mTrue >= t.mShown * 0.9 ? '<span class="cx-chip good">ไม่พบปัญหา</span>' : ''}` : '<span class="cx-chip">ยังไม่ได้ตรวจสอบ</span>';
      const offers = [0.8, 0.9, 1].map(p => `<button class="btn ${p === 1 ? '' : 'ghost'}" data-a="mna248" data-v="offer|${t.id}|${p}" ${c.cash >= t.ask * p ? '' : 'disabled'}>เสนอ ${Math.round(p * 100)}% (${B(Math.round(t.ask * p / 10000) * 10000)})</button>`).join('');
      return `<div class="cx-card"><h4>${t.i} ${E(t.name)}</h4><p class="cx-meta">พนักงาน ${t.staff} คน · รายได้ ${B(t.rev)}/เดือน · กำไรที่โชว์ ${B(Math.round(t.rev * t.mShown))}/เดือน<br>ราคาขอ ${B(t.ask)} · เปิดขายอีก ${t.until - S.day} วัน</p><div class="cx-chips">${dd}</div>${t.counter ? `<p class="bad">ผู้ขายยื่นราคาใหม่ ${B(t.counter)}</p><div class="cx-actions"><button class="btn" data-a="mna248" data-v="accept|${t.id}" ${c.cash >= t.counter ? '' : 'disabled'}>ตกลง ${B(t.counter)}</button></div>` : ''}<div class="cx-actions">${t.dd ? '' : `<button class="btn ghost" data-a="mna248" data-v="dd|${t.id}" ${c.cash >= DD_FEE ? '' : 'disabled'}>🔍 ตรวจสอบกิจการ ${B(DD_FEE)}</button>`}${offers}</div></div>`;
    }).join('');
    return `<h5>🤝 ซื้อ-ขายกิจการ (M&A)</h5>
      <p class="lead">ซื้อบริษัทเล็กมาเป็นบริษัทในเครือของ <b>${E(c.name)}</b> (เงินสด ${B(c.cash)}) · ตลาดอัปเดตทุก 14 วัน · ควรจ่ายค่าตรวจสอบกิจการก่อนเสนอราคา เพราะกำไรที่โชว์อาจสูงเกินจริงหรือมีปัญหาซ่อนอยู่ · ค่าธรรมเนียมโอน 2%</p>
      <h5>🏢 บริษัทในเครือ (${subs.length})</h5>${own}
      <h5>📋 กิจการที่เปิดขาย</h5><div class="cx-grid">${mk}</div>`;
  };
  { const _h = Company.html.bind(Company);
    Company.html = function (t) {
      const html = _h(t);
      if (t !== 0) return html;
      try {
        const c = Company.get(Company.sel); if (!c || c.st !== 'open' || Company.tab229 !== 'mna') return html;
        const box = document.createElement('div'); box.innerHTML = html; const body = box.querySelector('.cx-body'); if (!body) return html;
        body.innerHTML = section(c); return box.innerHTML;
      } catch (e) { console.warn('v248 page', e); return html; }
    }; }
  UI.H.mna248 = d => {
    const [a, id, p] = String(d.v || '').split('|'), c = Company.get(Company.sel); if (!c || c.st !== 'open') return;
    if (a === 'sell') {
      const s = subsOf(c)[+id]; if (!s) return; const price = Math.max(0, profitOf(s, c) * 16 - s.debt); c.cash += price; c.loan = Math.max(0, (c.loan || 0) - s.debt);
      subsOf(c).splice(+id, 1); msg(c, `💰 ขายกิจการ ${s.name} ได้เงินสุทธิ ${B(price)} (หักหนี้ ${B(s.debt)} แล้ว)`); hist(c, `ขายกิจการ ${s.name} ${B(price)}`); UI.toast('ขายกิจการแล้ว', '💰'); return;
    }
    const t = X().targets.find(q => q.id === +id); if (!t) return;
    if (a === 'dd') { if (c.cash < DD_FEE) return; c.cash -= DD_FEE; try { Company.book(c, 0, DD_FEE); } catch (e) { } t.dd = 1; UI.toast('ตรวจสอบกิจการเสร็จแล้ว', '🔍'); return; }
    if (a === 'accept') { if (t.counter && buy(c, t, t.counter)) UI.toast('ซื้อกิจการสำเร็จ', '🤝'); return; }
    if (a === 'offer') {
      const price = Math.round(t.ask * +p / 10000) * 10000;
      if (price >= t.reserve) { if (buy(c, t, price)) UI.toast(`ผู้ขายตกลง ${B(price)}`, '🤝'); }
      else if (price >= t.reserve * 0.92) { t.counter = t.reserve; UI.toast(`ผู้ขายขอเพิ่มเป็น ${B(t.reserve)}`, '🗣️'); }
      else { t.until = Math.min(t.until, S.day + 7); UI.toast('ผู้ขายปฏิเสธราคานี้ และเริ่มเสนอขายให้รายอื่นแล้ว', '❌'); }
    }
  };
  window.MNA248 = { X, refresh, make, buy, profitOf, subsOf, monthly, daily, section };
});
