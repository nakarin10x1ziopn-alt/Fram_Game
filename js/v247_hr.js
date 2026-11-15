'use strict';
// ---------- v247: staff pay and staff events (probation, raises, profit bonus, parties) ----------
// For every open company, shown on the company page > "พนักงาน" tab > "🎉 กิจกรรมพนักงานและค่าตอบแทน".
//  1. Probation: a new hire works 119 days at 85% pay, then passes (full pay) - a very unhappy hire gets 30 more days once
//  2. Yearly raise (1 Jan): the chairman sets 0 / 3 / 5 / 8 %. 0% makes people unhappy, 5%+ makes them happy
//  3. Profit bonus (1 Jan): the chairman sets 0 / 5 / 10 / 15 % of last year's profit, shared by salary, capped at 3 months of payroll
//     and at 60% of the cash; plus a special bonus (half or one month) any time, once every 60 days
//  4. Morale 0-100 per person: drifts back to 70 each month; the monthly effect on the company = +2.5% of the month's sales when the average is 80+,
//     -2% when it is under 40 (and under 30 somebody may quit)
//  5. Events the chairman puts in the calendar (new year party, Songkran, dinner, team building, company anniversary, merit-making, yearly trip):
//     on the day the company pays (per head x budget level), morale and reputation go up, and the team works better for a month (extra % of sales)
//     They also show in the phone calendar.
V23.add('v247_hr', function () {
  if (typeof Company === 'undefined' || !Company.list || typeof Cal36 === 'undefined') return;
  const E = s => (typeof esc === 'function' ? esc(s) : String(s));
  const B = n => (typeof baht0 === 'function' ? baht0(n) : typeof baht === 'function' ? baht(n) : Math.round(n).toLocaleString('en-US') + ' ฿');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const R100 = n => Math.round(n / 100) * 100;
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const PROB = 119, PROB_PAY = 0.85;
  const EV = {
    newyear: { i: '🎆', n: 'งานเลี้ยงปีใหม่', per: 800, mo: 12, rep: 2, boost: 0.02, hint: 'จับฉลากของขวัญ ดนตรี และอาหารมื้อใหญ่' },
    songkran: { i: '💦', n: 'สงกรานต์รดน้ำดำหัว', per: 300, mo: 8, rep: 1, boost: 0.01, hint: 'รดน้ำขอพรผู้ใหญ่ ซุ้มอาหาร และสาดน้ำคลายร้อน' },
    dinner: { i: '🍽️', n: 'เลี้ยงขอบคุณทีมงาน', per: 600, mo: 10, rep: 1, boost: 0.01, hint: 'ทานข้าวมื้อค่ำพร้อมหน้า ประธานกล่าวขอบคุณ' },
    teambuild: { i: '🧗', n: 'กิจกรรมสร้างทีม (Team Building)', per: 1200, mo: 14, rep: 1, boost: 0.03, hint: 'เกมทีมและกิจกรรมกลางแจ้ง ทำให้ทำงานเข้าขากันขึ้น' },
    anniv: { i: '🎂', n: 'งานครบรอบบริษัท', per: 700, mo: 10, rep: 2, boost: 0.02, hint: 'เป่าเค้กครบรอบ เล่าเรื่องการเติบโตของบริษัท' },
    merit: { i: '🙏', n: 'ทำบุญบริษัท', per: 400, mo: 6, rep: 3, boost: 0.01, hint: 'ถวายสังฆทานและเลี้ยงเพลพระ เสริมชื่อเสียงให้บริษัท' },
    trip: { i: '🏝️', n: 'ทริปประจำปีของบริษัท', per: 3500, mo: 20, rep: 3, boost: 0.04, hint: 'พาทั้งบริษัทไปพักผ่อนต่างจังหวัด 2 วัน 1 คืน' },
  };
  const LV = [{ n: 'ประหยัด', cost: 0.6, eff: 0.7 }, { n: 'มาตรฐาน', cost: 1, eff: 1 }, { n: 'จัดเต็ม', cost: 1.8, eff: 1.4 }];
  const SPICE = ['จับฉลากของขวัญ ทุกคนได้รางวัล', 'ประธานขึ้นร้องเพลงคาราโอเกะ ทุกคนหัวเราะลั่น', 'ถ่ายรูปหมู่ทั้งบริษัท', 'พนักงานใหม่ได้ทำความรู้จักทีมมากขึ้น', 'มีคนเสนอไอเดียงานใหม่กลางวงสังสรรค์', 'เล่นเกมทายคำ ทีมไหนแพ้ต้องเลี้ยงกาแฟ'];
  const msg = (c, t, quiet) => { try { Phone.msg(c.name, t, !!quiet); } catch (e) { } };
  const hist = (c, t) => { try { c.hist.unshift(`${RD(S.day)}: ${t}`); } catch (e) { } };
  const open = c => c && c.st === 'open';
  const payroll = c => (c.staff || []).reduce((a, s) => a + (s.sal || 0), 0);

  const H = c => {
    const h = c.hr = c.hr || {};
    if (!h.init) {   // first sight of this company: everybody already there counts as having passed probation
      h.init = 1; h.lastM = S.day; h.raise = 3; h.bonus = 10; h.yp = 0; h.mRev = 0; h.ev = []; h.done = []; h.seq = 0;
      for (const s of c.staff || []) { s.hd = S.day - 400; s.mo = 70; s.prob = 0; }
    }
    return h;
  };
  // every booking feeds this year's profit and this month's sales
  { const _b = Company.book.bind(Company);
    Company.book = function (c, rev, cost) { const r = _b(c, rev, cost); try { const h = c && c.hr; if (h && h.init) { h.yp += (rev || 0) - (cost || 0); if (rev > 0) h.mRev += rev; } } catch (e) { } return r; }; }

  const avgMo = c => { const L = c.staff || []; return L.length ? L.reduce((a, s) => a + (s.mo == null ? 70 : s.mo), 0) / L.length : 70; };
  const moAll = (c, d) => { for (const s of c.staff || []) s.mo = clamp((s.mo == null ? 70 : s.mo) + d, 0, 100); };
  const evCost = (c, k, lv) => Math.round(((c.staff || []).length + 1) * EV[k].per * LV[lv].cost + 3000 * LV[lv].cost);

  const runEvent = (c, e) => {
    const h = H(c), K = EV[e.k], L = LV[e.lv] || LV[1], cost = evCost(c, e.k, e.lv);
    e.done = 1;
    if (c.cash < cost) { moAll(c, -5); msg(c, `⚠️ ${K.i} งดจัด${K.n} เพราะเงินบริษัทไม่พอ (ต้องใช้ ${B(cost)}) พนักงานผิดหวังเล็กน้อย`); hist(c, `งดจัด${K.n} เงินไม่พอ`); return; }
    c.cash -= cost; try { Company.book(c, 0, cost); } catch (er) { }
    const gain = Math.round(K.mo * L.eff);
    for (const s of c.staff || []) s.mo = clamp((s.mo == null ? 70 : s.mo) + gain + Math.round(Math.random() * 4 - 2), 0, 100);
    c.rep = clamp((c.rep || 0) + Math.max(0, Math.round(K.rep * (e.lv === 0 ? 0.5 : 1))), 0, 100);
    h.boost = { pct: K.boost * L.eff, until: S.day + 35 };
    h.done.unshift({ day: S.day, n: K.n, i: K.i, cost }); if (h.done.length > 8) h.done.length = 8;
    msg(c, `${K.i} ${K.n} (${L.n}) จัดแล้ว · ${(c.staff || []).length + 1} คน · ใช้ ${B(cost)} · ขวัญกำลังใจ +${gain} · ชื่อเสียงบริษัทดีขึ้น · ${pick(SPICE)} · ทีมจะทำงานดีขึ้นอีกราว 1 เดือน`);
    hist(c, `${K.n} (${L.n}) ใช้ ${B(cost)}`);
  };

  const monthly = (c, h) => {
    const L = c.staff || [], TG = window.Hr250 ? Hr250.target(c) : 70;
    for (const s of L) s.mo = clamp(Math.round((s.mo == null ? 70 : s.mo) + (TG - (s.mo == null ? 70 : s.mo)) * 0.15 - (c.cash < 0 ? 4 : 0)), 0, 100);
    const A = avgMo(c), boost = h.boost && S.day <= h.boost.until ? h.boost.pct : 0;
    const pctV = (L.length ? (A >= 80 ? 0.025 : A < 40 ? -0.02 : 0) : 0) + boost + (window.Hr250 ? Hr250.revPct(c) : 0), amt = Math.round(h.mRev * pctV);
    if (amt > 0) { c.cash += amt; try { Company.book(c, amt, 0); } catch (e) { } msg(c, `😊 ทีมงานขวัญกำลังใจดี (เฉลี่ย ${Math.round(A)}) ผลงานเดือนนี้เพิ่มรายได้ ${B(amt)}`, true); }
    else if (amt < 0) { c.cash += amt; try { Company.book(c, 0, -amt); } catch (e) { } msg(c, `😞 พนักงานหมดไฟ (ขวัญเฉลี่ย ${Math.round(A)}) งานเสียหายราว ${B(-amt)} ลองจัดงานเลี้ยงหรือขึ้นเงินเดือน`, true); }
    h.mRev = 0;
    if (L.length > 1 && A < 30 && Math.random() < 0.15 * (window.Hr250 ? Hr250.quitMul(c) : 1)) { const i = L.reduce((b, s, k) => ((s.mo == null ? 70 : s.mo) < (L[b].mo == null ? 70 : L[b].mo) ? k : b), 0); const g = L.splice(i, 1)[0]; msg(c, `📤 ${g.name} ลาออก เพราะขวัญกำลังใจต่ำ (ดูแลพนักงานให้ดีขึ้นจะช่วยได้)`); hist(c, `${g.name} ลาออก`); }
  };
  const yearEnd = (c, h) => {
    const base = payroll(c), L = c.staff || [];
    // profit bonus
    if (h.bonus > 0 && h.yp > 0 && L.length && base > 0) {
      let pool = Math.round(h.yp * h.bonus / 100); pool = Math.min(pool, base * 3, Math.max(0, Math.round(c.cash * 0.6)));
      if (pool >= 1000) {
        c.cash -= pool; try { Company.book(c, 0, pool); } catch (e) { }
        moAll(c, clamp(Math.round(pool / base * 12), 3, 16)); c.rep = clamp((c.rep || 0) + 1, 0, 100);
        msg(c, `🎁 โบนัสประจำปี: กำไรปีที่ผ่านมา ${B(h.yp)} · แจกพนักงาน ${L.length} คน รวม ${B(pool)} (เฉลี่ย ${B(Math.round(pool / L.length))}/คน ตามสัดส่วนเงินเดือน)`); hist(c, `จ่ายโบนัสประจำปี ${B(pool)}`);
      } else msg(c, `ปีนี้กำไร ${B(h.yp)} แต่เงินบริษัทไม่พอจ่ายโบนัสตามนโยบาย ${h.bonus}%`, true);
    } else if (h.yp > 0 && h.bonus === 0 && L.length) { moAll(c, -4); msg(c, 'ปีนี้บริษัทมีกำไรแต่ไม่แจกโบนัส พนักงานบางส่วนผิดหวัง', true); }
    h.yp = 0;
    // yearly raise
    const R = h.raise;
    if (R > 0 && c.cash >= 0) {
      let n = 0, add = 0; for (const s of L) if (!s.prob && S.day - (s.hd == null ? -999 : s.hd) >= 150) { const ns = R100(s.sal * (1 + R / 100)); add += ns - s.sal; s.sal = ns; n++; }
      if (n) { moAll(c, R >= 5 ? 6 : 3); msg(c, `📈 ปรับเงินเดือนประจำปี +${R}% ให้พนักงาน ${n} คน (ผ่านโปรแล้ว) ค่าใช้จ่ายเงินเดือนเพิ่มเดือนละ ${B(add)}`); hist(c, `ปรับเงินเดือน +${R}%`); }
    } else if (R === 0 && L.length) { moAll(c, -6); msg(c, 'ปีนี้ไม่ได้ปรับเงินเดือน พนักงานบ่นกันบ้าง', true); }
  };

  const daily = () => {
    for (const c of Company.list()) {
      if (!open(c)) continue; const h = H(c);
      for (const s of c.staff || []) if (s.hd == null) {   // a new hire: on probation
        s.hd = S.day; s.mo = 75; s.prob = S.day + PROB; s.sal0 = s.sal; s.sal = R100(s.sal * PROB_PAY);
        msg(c, `👋 ${s.name} เริ่มงาน · ทดลองงาน ${PROB} วัน เงินเดือน ${B(s.sal)} (85%) ผ่านโปรแล้วเต็ม ${B(s.sal0)}`, true);
      }
      for (const s of c.staff || []) if (s.prob && S.day >= s.prob) {
        if ((s.mo == null ? 70 : s.mo) < 35 && !s.ext) { s.ext = 1; s.prob = S.day + 30; msg(c, `⏳ ${s.name} ต่อโปรอีก 30 วัน เพราะยังไม่เข้าที่`, true); continue; }
        s.prob = 0; if (s.sal0) s.sal = s.sal0; s.mo = clamp((s.mo == null ? 70 : s.mo) + 8, 0, 100);
        msg(c, `✅ ${s.name} ผ่านทดลองงาน · เงินเดือนเต็ม ${B(s.sal)} ขวัญกำลังใจดีขึ้น`);
      }
      for (const e of h.ev) if (!e.done && S.day === e.day) runEvent(c, e);
      h.ev = h.ev.filter(e => !e.done || S.day - e.day < 1);
      const t = Cal36.date(S.day);
      if (t.dom === 1 && h.lastM !== S.day) { h.lastM = S.day; if (t.m === 0) yearEnd(c, h); monthly(c, h); }
    }
  };
  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { daily(); } catch (e) { console.warn('v247 daily', e); } return r; }; }

  // the phone calendar lists the company events
  try {
    if (window.Appt39 && Appt39.reg) Appt39.reg('co247', (a, b, out) => {
      for (const c of Company.list()) { if (!open(c) || !c.hr || !c.hr.ev) continue; for (const e of c.hr.ev) if (!e.done && e.day >= a && e.day <= b) out.push({ c: 'fest', d: e.day, t: 18 * 60, t2: 21 * 60, i: EV[e.k].i, n: `${EV[e.k].n} · ${c.name}`, x: 'งานของบริษัท จัดโดยประธาน', app: 'company', key: 'co247:' + c.id + ':' + e.id }); }
    });
  } catch (e) { console.warn('v247 cal', e); }

  // ----- the page -----
  const section = c => {
    const h = H(c), L = c.staff || [], A = avgMo(c), now = Cal36.date(S.day), base = payroll(c);
    const bar = `<div style="height:10px;border-radius:6px;background:rgba(255,255,255,.15);overflow:hidden;max-width:260px"><div style="height:100%;width:${Math.round(A)}%;background:${A >= 80 ? '#66bb6a' : A >= 40 ? '#ffca28' : '#ef5350'}"></div></div>`;
    const prob = L.filter(s => s.prob).map(s => `${E(s.name)} (เหลือ ${Math.max(0, s.prob - S.day)} วัน)`).join(' · ');
    const sel = (id, opts, cur) => `<select id="${id}">${opts.map(([v, l]) => `<option value="${v}" ${String(v) === String(cur) ? 'selected' : ''}>${E(l)}</option>`).join('')}</select>`;
    const months = []; for (let i = 0; i < 12; i++) { const m = (now.m + i) % 12, y = now.y + Math.floor((now.m + i) / 12); months.push([y * 12 + m, `${Cal36.MONS[m]} ${y + 543}`]); }
    const up = h.ev.filter(e => !e.done).sort((a, b) => a.day - b.day);
    const sp = S.day - (h.sb || -999) >= 60;
    return `<h5>🎉 กิจกรรมพนักงานและค่าตอบแทน</h5>
      <p class="lead">ประธานกรรมการกำหนดนโยบายค่าตอบแทนและนัดงานเลี้ยงในปฏิทินได้ที่นี่ · พนักงาน ${L.length} คน · ขวัญกำลังใจเฉลี่ย <b>${Math.round(A)}</b>/100 ${bar}</p>
      <p class="dim">ขวัญกำลังใจ 80 ขึ้นไป ทีมทำงานดี รายได้เดือนละ +2.5% · ต่ำกว่า 40 งานเสีย −2% และอาจมีคนลาออก · งานเลี้ยงและโบนัสช่วยเพิ่มขวัญกำลังใจ งานเลี้ยงยังทำให้ทีมทำงานดีขึ้นอีกราว 1 เดือน</p>
      <div class="cx-grid">
        <div class="cx-card"><h4>📈 ขึ้นเงินเดือนประจำปี (1 ม.ค.)</h4><p class="cx-meta">ขึ้นให้คนที่ผ่านโปรและทำงานเกิน 150 วัน</p><div class="cx-actions">${[0, 3, 5, 8].map(v => `<button class="btn ${h.raise === v ? '' : 'ghost'}" data-a="hr247" data-v="raise|${v}">${v}%</button>`).join('')}</div></div>
        <div class="cx-card"><h4>🎁 โบนัสจากกำไร (1 ม.ค.)</h4><p class="cx-meta">แบ่งจากกำไรปีที่ผ่านมา ตามสัดส่วนเงินเดือน สูงสุด 3 เดือนของเงินเดือนรวม และไม่เกิน 60% ของเงินสด · กำไรปีนี้ถึงตอนนี้ ${B(Math.max(0, h.yp))}</p><div class="cx-actions">${[0, 5, 10, 15].map(v => `<button class="btn ${h.bonus === v ? '' : 'ghost'}" data-a="hr247" data-v="bonus|${v}">${v}%</button>`).join('')}</div></div>
        <div class="cx-card"><h4>💰 โบนัสพิเศษทันที</h4><p class="cx-meta">เงินเดือนรวมเดือนละ ${B(base)} · แจกได้ทุก 60 วัน ขวัญกำลังใจขึ้นทันที</p><div class="cx-actions"><button class="btn" data-a="hr247" data-v="sb|0.5" ${sp && L.length && c.cash >= base * 0.5 ? '' : 'disabled'}>ครึ่งเดือน ${B(base * 0.5)}</button><button class="btn ghost" data-a="hr247" data-v="sb|1" ${sp && L.length && c.cash >= base ? '' : 'disabled'}>1 เดือน ${B(base)}</button></div>${sp ? '' : '<p class="dim">แจกพิเศษไปเมื่อไม่นานมานี้</p>'}</div>
      </div>
      <h5>🗓️ นัดงานเลี้ยงในปฏิทิน</h5>
      <div class="row">${sel('hr247t', Object.keys(EV).map(k => [k, EV[k].i + ' ' + EV[k].n]), 'newyear')} ${sel('hr247l', LV.map((l, i) => [i, 'งบ' + l.n]), 1)} ${sel('hr247m', months, now.y * 12 + now.m)} <input id="hr247d" type="number" min="1" max="31" value="${Math.min(28, now.dom + 1)}" style="width:70px" aria-label="วันที่"> <button class="btn" data-a="hr247" data-v="sched" ${L.length ? '' : 'disabled'}>📌 นัดวันงาน</button></div>
      <p class="dim">ค่าใช้จ่าย = (พนักงาน + ประธาน) × งบต่อหัวของงาน × ระดับงบ + ค่าสถานที่ · จ่ายจากเงินบริษัทในวันงาน ถ้าเงินไม่พอจะงดจัดและพนักงานผิดหวัง</p>
      ${up.length ? `<div class="cx-grid">${up.map(e => `<div class="cx-card"><h4>${EV[e.k].i} ${EV[e.k].n}</h4><p class="cx-meta">${Cal36.full ? Cal36.full(e.day) : RD(e.day)} · งบ${LV[e.lv].n} · ประมาณ ${B(evCost(c, e.k, e.lv))}<br>${E(EV[e.k].hint)}</p><div class="cx-actions"><button class="btn ghost" data-a="hr247" data-v="cancel|${e.id}">ยกเลิกงาน</button></div></div>`).join('')}</div>` : '<p class="dim">ยังไม่มีงานที่นัดไว้</p>'}
      ${h.done.length ? `<p class="dim">งานที่ผ่านมา: ${h.done.slice(0, 4).map(d => `${d.i} ${E(d.n)} (${RD(d.day)}, ${B(d.cost)})`).join(' · ')}</p>` : ''}
      ${prob ? `<p class="dim">🧑‍💼 กำลังทดลองงาน: ${prob} (เงินเดือน 85% จนผ่านโปร)</p>` : ''}`;
  };
  { const _h = Company.html.bind(Company);
    Company.html = function (t) {
      const html = _h(t);
      if (t !== 0) return html;
      try {
        const c = Company.get(Company.sel); if (!c || c.st !== 'open' || Company.tab229 !== 'staff') return html;
        const box = document.createElement('div'); box.innerHTML = html; const body = box.querySelector('.cx-body'); if (!body) return html;
        body.insertAdjacentHTML('beforeend', section(c)); return box.innerHTML;
      } catch (e) { console.warn('v247 page', e); return html; }
    }; }
  UI.H.hr247 = d => {
    const [a, x] = String(d.v || '').split('|'), c = Company.get(Company.sel); if (!c || c.st !== 'open') return; const h = H(c);
    if (a === 'raise') { h.raise = +x; UI.toast(`นโยบายขึ้นเงินเดือนประจำปี ${x}%`, '📈'); return; }
    if (a === 'bonus') { h.bonus = +x; UI.toast(`นโยบายโบนัส ${x}% ของกำไร`, '🎁'); return; }
    if (a === 'sb') {
      const m = +x, cost = Math.round(payroll(c) * m), L = c.staff || [];
      if (!L.length || S.day - (h.sb || -999) < 60) return; if (c.cash < cost) { UI.toast('เงินบริษัทไม่พอ', '⚠️'); return; }
      c.cash -= cost; try { Company.book(c, 0, cost); } catch (e) { } h.sb = S.day; moAll(c, m >= 1 ? 14 : 8); c.rep = clamp((c.rep || 0) + 1, 0, 100);
      msg(c, `💰 แจกโบนัสพิเศษ ${m >= 1 ? '1 เดือน' : 'ครึ่งเดือน'} ให้พนักงาน ${L.length} คน รวม ${B(cost)} ขวัญกำลังใจดีขึ้นมาก`); hist(c, `แจกโบนัสพิเศษ ${B(cost)}`); UI.toast('แจกโบนัสแล้ว', '💰'); return;
    }
    if (a === 'cancel') { h.ev = h.ev.filter(e => String(e.id) !== x); UI.toast('ยกเลิกงานแล้ว', '🗑️'); return; }
    if (a === 'sched') {
      const g = id => (document.getElementById(id) || {}).value, k = g('hr247t'), lv = +g('hr247l'), ym = +g('hr247m'), dom = +g('hr247d');
      if (!EV[k] || !LV[lv] || !ym || !dom) return;
      const y = Math.floor(ym / 12), m = ym % 12, dim = Cal36.daysIn(y, m); if (dom < 1 || dom > dim) { UI.toast(`เดือนนี้มี ${dim} วัน`, '⚠️'); return; }
      const day = Cal36.dayOf(y, m, dom); if (day <= S.day) { UI.toast('ต้องเลือกวันในอนาคต', '⚠️'); return; } if (day > S.day + 400) { UI.toast('นัดล่วงหน้าได้ไม่เกิน 1 ปี', '⚠️'); return; }
      if (h.ev.some(e => !e.done && e.day === day)) { UI.toast('วันนั้นมีงานอื่นแล้ว', '⚠️'); return; }
      h.ev.push({ id: ++h.seq, day, k, lv }); UI.toast(`นัด${EV[k].n}วันที่ ${Cal36.short ? Cal36.short(day) : RD(day)} แล้ว`, EV[k].i);
    }
  };
  window.HR247 = { H, EV, LV, evCost, daily, runEvent, monthly, yearEnd, avgMo, payroll, section };
});
