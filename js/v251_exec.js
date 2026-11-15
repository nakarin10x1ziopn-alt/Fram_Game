'use strict';
// ---------- v251: executive dashboard and the yearly shareholder report ----------
//  DASHBOARD (company page > overview, at the top): cash, this month's and last month's sales and profit, this year's profit, runway (months of cash at the current
//   monthly burn), staff and morale, insurance cover and internal-control score, running contracts, branches / franchisees / subsidiaries, debt, reputation,
//   and a list of warnings (low cash, a policy ending, low morale, probation ending, party or contract coming up, a poor franchise ...); with several companies a group total
//  YEARLY REPORT (company page > accounts, and a phone message on 1 January): sales, costs, profit and margin of the year, growth against the year before, staff and morale,
//   claims, parties, contracts, a rating A-D and a short outlook; shareholders (the register of the company) are pleased or disappointed by the rating
V23.add('v251_exec', function () {
  if (typeof Company === 'undefined' || !Company.list || typeof Cal36 === 'undefined') return;
  const E = s => (typeof esc === 'function' ? esc(s) : String(s));
  const B = n => (typeof baht0 === 'function' ? baht0(n) : typeof baht === 'function' ? baht(n) : Math.round(n).toLocaleString('en-US') + ' ฿');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const open = c => c && c.st === 'open';
  const EX = c => { const e = c.ex = c.ex || {}; if (e.yR == null) { e.yR = 0; e.yC = 0; e.mR = 0; e.mC = 0; e.pR = 0; e.pC = 0; e.rpt = []; e.lastY = 0; } return e; };
  { const _b = Company.book.bind(Company);
    Company.book = function (c, rev, cost) { const r = _b(c, rev, cost); try { if (c) { const e = EX(c); e.yR += rev || 0; e.yC += cost || 0; e.mR += rev || 0; e.mC += cost || 0; } } catch (er) { } return r; }; }
  const msg = (c, t, q) => { try { Phone.msg(c.name, t, !!q); } catch (e) { } };
  const payroll = c => (c.staff || []).reduce((a, s) => a + (s.sal || 0), 0);
  const hr = c => (window.HR247 ? HR247.H(c) : {});
  const avgMo = c => (window.HR247 ? HR247.avgMo(c) : 70);
  const pols = c => { try { return Object.keys(Risk243.PROD).filter(p => Risk243.active(c, p)).length; } catch (e) { return 0; } };
  const contracts = c => { try { const a = Contracts207.st(c).active || []; return { n: a.length, fee: a.reduce((s, k) => s + (k.fee || 0), 0), list: a }; } catch (e) { return { n: 0, fee: 0, list: [] }; } };
  const burn = c => payroll(c) + (c.rent || 0) + 15000;

  const makeReport = c => {
    const e = EX(c), h = hr(c), y = Cal36.date(S.day - 1).be, profit = e.yR - e.yC, margin = e.yR > 0 ? profit / e.yR : 0, prev = e.rpt[0], growth = prev && prev.rev > 0 ? (e.yR - prev.rev) / prev.rev : null;
    const r = (c.rk && c.rk.log || []).filter(l => S.day - l.day <= 366), evs = (h.done || []).filter(d => S.day - d.day <= 366);
    const ct = contracts(c), score = (margin >= 0.2 ? 3 : margin >= 0.1 ? 2 : margin > 0 ? 1 : 0) + (growth != null && growth > 0.1 ? 1 : 0) + (avgMo(c) >= 70 ? 1 : 0), grade = score >= 5 ? 'A' : score === 4 ? 'B' : score >= 2 ? 'C' : 'D';
    const note = { A: 'ผลงานยอดเยี่ยม ผู้ถือหุ้นพอใจมาก ควรขยายกิจการต่อ', B: 'ผลงานดี มั่นคง ควรรักษาจังหวะและควบคุมค่าใช้จ่าย', C: 'ผลงานพอใช้ ควรเพิ่มรายได้หรือลดต้นทุน', D: 'ผลงานน่าห่วง ผู้ถือหุ้นกังวล ต้องปรับแผนด่วน' }[grade];
    return { y, rev: Math.round(e.yR), cost: Math.round(e.yC), profit: Math.round(profit), margin, growth, staff: (c.staff || []).length, mo: Math.round(avgMo(c)), claims: r.length, claimLoss: r.reduce((a, l) => a + l.loss, 0), claimPaid: r.reduce((a, l) => a + l.paid, 0), parties: evs.length, contracts: ct.n, cash: Math.round(c.cash), loan: Math.round(c.loan || 0), subs: (c.subs || []).length, fr: c.fr && c.fr.net ? c.fr.net.length : 0, grade, note };
  };
  const closeYear = c => {
    const e = EX(c), rp = makeReport(c);
    if (e.yR || e.yC || (c.staff || []).length) {
      e.rpt.unshift(rp); if (e.rpt.length > 6) e.rpt.length = 6;
      const d = { A: 8, B: 4, C: 0, D: -6 }[rp.grade]; for (const h of c.reg || []) if (h && h.p > 0 && h.mood != null) h.mood = clamp(h.mood + d, 5, 99);
      if (rp.grade === 'A') c.rep = clamp((c.rep || 0) + 1, 0, 100); if (rp.grade === 'D') c.rep = clamp((c.rep || 0) - 1, 0, 100);
      msg(c, `📑 รายงานประจำปี ${rp.y}: รายได้ ${B(rp.rev)} · กำไร ${B(rp.profit)} (${(rp.margin * 100).toFixed(1)}%)${rp.growth != null ? ` · เติบโต ${(rp.growth * 100).toFixed(0)}%` : ''} · เกรด ${rp.grade} — ${rp.note}`);
    }
    e.yR = 0; e.yC = 0;
  };
  const daily = () => {
    for (const c of Company.list()) {
      if (!open(c)) continue; const e = EX(c), t = Cal36.date(S.day);
      if (t.dom === 1 && e.lastM !== S.day) { e.lastM = S.day; if (t.m === 0 && S.day > 30) closeYear(c); e.pR = e.mR; e.pC = e.mC; e.mR = 0; e.mC = 0; }
    }
  };
  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { daily(); } catch (er) { console.warn('v251 daily', er); } return r; }; }

  const alerts = c => {
    const A = [], h = hr(c), b = burn(c), run = b > 0 ? c.cash / b : 99;
    if (c.cash < 0) A.push(['bad', `บัญชีติดลบ ${B(-c.cash)} เพิ่มทุนหรือลดค่าใช้จ่ายด่วน`]); else if (run < 2) A.push(['bad', `เงินสดพอจ่ายแค่ ${run.toFixed(1)} เดือน`]); else if (run < 4) A.push(['warn', `เงินสดพอจ่าย ${run.toFixed(1)} เดือน ควรเพิ่มรายได้หรือเงินทุน`]);
    try { if (!Risk243.active(c, 'prop')) A.push(['warn', 'ยังไม่มีประกันอัคคีภัยและทรัพย์สิน']); for (const p in c.rk.pol) { const x = c.rk.pol[p]; if (x && x.until >= S.day && x.until - S.day <= 30) A.push(['warn', `${Risk243.PROD[p].n} หมดอายุใน ${x.until - S.day} วัน`]); } if (Risk243.score(c) < 50) A.push(['info', `ระบบควบคุมภายใน ${Risk243.score(c)}/50 คะแนน`]); } catch (e) { }
    const m = avgMo(c); if ((c.staff || []).length && m < 50) A.push([m < 40 ? 'bad' : 'warn', `ขวัญกำลังใจพนักงานเฉลี่ย ${Math.round(m)} ลองจัดงานเลี้ยงหรือเพิ่มสวัสดิการ`]);
    for (const s of c.staff || []) if (s.prob && s.prob - S.day <= 14) A.push(['info', `${s.name} จะครบทดลองงานใน ${Math.max(0, s.prob - S.day)} วัน`]);
    for (const ev of h.ev || []) if (!ev.done && ev.day - S.day <= 14 && ev.day >= S.day) A.push(['info', `${HR247.EV[ev.k].n} ใน ${ev.day - S.day} วัน`]);
    for (const k of contracts(c).list) if (k.end && k.end - S.day <= 14) A.push(['info', `สัญญา ${k.cust || ''} ${k.title || ''} ใกล้ครบกำหนด (${Math.max(0, k.end - S.day)} วัน)`]);
    try { for (const f of (c.fr && c.fr.net) || []) if (f.q < 40) A.push(['warn', `แฟรนไชส์ ${f.name} คุณภาพ ${f.q} ควรตรวจมาตรฐาน`]); } catch (e) { }
    if (!A.length) A.push(['good', 'ไม่มีเรื่องที่ต้องรีบจัดการ']);
    return A;
  };
  const kpi = (i, t, v, s) => `<div class="cx-card"><div class="cx-dept">${i} ${t}</div><h4>${v}</h4>${s ? `<div class="cx-meta">${s}</div>` : ''}</div>`;
  const dash = c => {
    const e = EX(c), p0 = e.pR - e.pC, ytd = e.yR - e.yC, b = burn(c), run = b > 0 ? c.cash / b : 99, ct = contracts(c), nb = (c.br || []).filter(x => x.st === 'open').length;
    const sub = (c.subs || []).length, fr = c.fr && c.fr.net ? c.fr.net.length : 0;
    const cards = [
      kpi('💰', 'เงินสดบริษัท', B(c.cash), `เผาเงินราว ${B(b)}/เดือน · พอ ${run > 60 ? '60+' : run.toFixed(1)} เดือน`),
      kpi('📈', 'ยอดขายเดือนนี้', B(e.mR), `เดือนก่อน ${B(e.pR)} · กำไรเดือนก่อน ${B(p0)}`),
      kpi('🧾', 'กำไรสะสมปีนี้', `<span class="${ytd >= 0 ? 'good' : 'bad'}">${B(ytd)}</span>`, `รายได้ ${B(e.yR)} · ต้นทุน ${B(e.yC)}`),
      kpi('👥', 'พนักงาน', `${(c.staff || []).length} คน`, `ขวัญ ${Math.round(avgMo(c))}/100 · เงินเดือนรวม ${B(payroll(c))}`),
      kpi('🛡️', 'ความเสี่ยง', `ประกัน ${pols(c)}/6`, `ควบคุมภายใน ${(function () { try { return Risk243.score(c); } catch (er) { return 0; } })()}/100`),
      kpi('📑', 'สัญญาที่ทำอยู่', `${ct.n} ฉบับ`, `รายได้สัญญา ${B(ct.fee)}`),
      kpi('🏪', 'เครือข่าย', `${nb} สาขา`, `แฟรนไชส์ ${fr} · บริษัทในเครือ ${sub}`),
      kpi('🏦', 'หนี้สิน', B(c.loan || 0), `ชื่อเสียง ${Math.round(c.rep || 0)}/100`),
    ].join('');
    const A = alerts(c).map(([k, t]) => `<li class="${k === 'bad' ? 'bad' : k === 'good' ? 'good' : ''}">${k === 'bad' ? '🔴' : k === 'warn' ? '🟠' : k === 'good' ? '🟢' : '🔵'} ${E(t)}</li>`).join('');
    const L = Company.list().filter(open);
    const grp = L.length > 1 ? `<h5>🏢 ภาพรวมทุกบริษัท (${L.length})</h5><table class="tbl" style="width:100%"><tr><th>บริษัท</th><th>เงินสด</th><th>กำไรปีนี้</th><th>พนักงาน</th><th>ชื่อเสียง</th></tr>${L.map(x => { const ex = EX(x); return `<tr><td>${E(x.name)}</td><td>${B(x.cash)}</td><td>${B(ex.yR - ex.yC)}</td><td>${(x.staff || []).length}</td><td>${Math.round(x.rep || 0)}</td></tr>`; }).join('')}<tr><th>รวม</th><th>${B(L.reduce((a, x) => a + x.cash, 0))}</th><th>${B(L.reduce((a, x) => a + EX(x).yR - EX(x).yC, 0))}</th><th>${L.reduce((a, x) => a + (x.staff || []).length, 0)}</th><th></th></tr></table>` : '';
    return `<h5>📊 แดชบอร์ดผู้บริหาร · ${E(c.name)}</h5><div class="cx-grid">${cards}</div><h5>🔔 เรื่องที่ควรรู้</h5><ul>${A}</ul>${grp}`;
  };
  const report = c => {
    const e = EX(c), live = makeReport(c); live.y = Cal36.date(S.day).be + ' (ถึงวันนี้)';
    const row = r => `<tr><td>${r.y}</td><td>${B(r.rev)}</td><td>${B(r.cost)}</td><td class="${r.profit >= 0 ? 'good' : 'bad'}">${B(r.profit)}</td><td>${(r.margin * 100).toFixed(1)}%</td><td>${r.growth == null ? '-' : (r.growth * 100).toFixed(0) + '%'}</td><td>${r.staff}</td><td>${r.mo}</td><td><b>${r.grade || '-'}</b></td></tr>`;
    const last = e.rpt[0];
    const det = last ? `<div class="cx-card"><h4>📑 รายงานปี ${last.y} · เกรด ${last.grade}</h4><p class="cx-meta">${E(last.note)}<br>รายได้ ${B(last.rev)} · ต้นทุน ${B(last.cost)} · กำไร ${B(last.profit)} (${(last.margin * 100).toFixed(1)}%)<br>พนักงาน ${last.staff} คน (ขวัญ ${last.mo}) · งานเลี้ยง/กิจกรรม ${last.parties} ครั้ง · เคลมประกัน ${last.claims} ครั้ง (เสียหาย ${B(last.claimLoss)} · ประกันจ่าย ${B(last.claimPaid)})<br>สัญญาที่ทำอยู่ ${last.contracts} ฉบับ · บริษัทในเครือ ${last.subs} · แฟรนไชส์ ${last.fr} · เงินสด ${B(last.cash)} · หนี้ ${B(last.loan)}</p></div>` : '<p class="dim">ยังไม่มีรายงานปีที่ปิดแล้ว (ระบบจะสร้างให้อัตโนมัติทุกวันที่ 1 มกราคม และส่งข้อความเข้ามือถือ)</p>';
    return `<h5>📑 รายงานประจำปีถึงผู้ถือหุ้น</h5><p class="lead">สรุปผลประกอบการรายปีของ <b>${E(c.name)}</b> · ผู้ถือหุ้นพอใจหรือผิดหวังตามเกรด (A–D) · เกรด A เพิ่มชื่อเสียง เกรด D ลดชื่อเสียง</p>${det}<table class="tbl" style="width:100%"><tr><th>ปี</th><th>รายได้</th><th>ต้นทุน</th><th>กำไร</th><th>อัตรากำไร</th><th>เติบโต</th><th>คน</th><th>ขวัญ</th><th>เกรด</th></tr>${row(live)}${e.rpt.map(row).join('')}</table>`;
  };
  { const _h = Company.html.bind(Company);
    Company.html = function (t) {
      const html = _h(t);
      if (t !== 0) return html;
      try {
        const c = Company.get(Company.sel); if (!c || c.st !== 'open') return html; const tab = Company.tab229;
        if (tab !== 'ov' && tab !== 'fin') return html;
        const box = document.createElement('div'); box.innerHTML = html; const body = box.querySelector('.cx-body'); if (!body) return html;
        if (tab === 'ov') body.insertAdjacentHTML('afterbegin', dash(c)); else body.insertAdjacentHTML('beforeend', report(c));
        return box.innerHTML;
      } catch (e) { console.warn('v251 page', e); return html; }
    }; }
  window.Exec251 = { EX, makeReport, closeYear, daily, alerts, dash, report, burn };
});
