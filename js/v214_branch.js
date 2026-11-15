'use strict';
// ---------- v214: company BRANCHES (สาขา) ----------
// An open company can open branches at other premises (any site that suits its business type, also in the other towns).
// A branch earns about 80% of what the head office earns (its basic sales or its last monthly income incl. customer contracts, whichever is bigger) (town factor on top), brings its own local team, rent, power and internet costs,
// and a one-off set-up (fit-out + 3 months deposit + branch registration, VAT branch ภ.พ.09). Everything is paid from the company account (c.cash).
V23.add('v214_branch', function () {
  if (typeof Company === 'undefined') return;
  const MAXB = 4, BR_SHARE = 0.8, REG_FEE = 1000;
  const TOWN = { metro: 1.25, orchard: 1.0, sunflower: 0.8 };      // customers per town (the capital is busiest, the small village the quietest)
  const TOWN_N = { metro: 'สุขนครมหานคร', orchard: 'สวนทองเมือง', sunflower: 'บ้านทุ่งทานตะวัน' };
  const E = s => (typeof esc === 'function' ? esc(s) : String(s));
  const why = (w, f) => (window.Biz212 && Biz212.withWhy ? Biz212.withWhy(w, f) : f);
  const BR = c => (Array.isArray(c.br) ? c.br : (c.br = []));
  const tf = site => TOWN[(CO_SITES[site] || {}).town] || 1;
  const townName = site => TOWN_N[(CO_SITES[site] || {}).town] || 'หมู่บ้านสุขใจ';
  const staffCost = c => { const T = CO_TYPES[c.type]; let n = 0, pay = 0; for (const [r, k0] of Object.entries(T.staff || {})) { const k = Math.max(1, Math.ceil(k0 * 0.5)); n += k; pay += k * ((ROLES[r] && ROLES[r].sal) || 15000); } return { n, pay }; };
  const fitOut = c => Math.max(200000, Math.round(CO_TYPES[c.type].cap * 0.25));
  const open = c => c && c.st === 'open';
  // what a branch costs every weekly close (= a month in game time): local team (+5% social security), rent, power, internet
  const weekCost = (c, b) => {
    const T = CO_TYPES[c.type], s = staffCost(c), X = CO_SITES[b.site] || { rent: 0 };
    const sso = Math.round(s.pay * 0.05), power = Math.round(T.kw * 0.2 * 24 * 30 * 4.2 * 1.07), net = Math.round((c.net && BIZ_NET[c.net] ? BIZ_NET[c.net].price : 1500) * 0.5);
    return { staff: s.pay + sso, rent: b.rent != null ? b.rent : X.rent, power, net, acct: 1500, total: s.pay + sso + (b.rent != null ? b.rent : X.rent) + power + net + 1500 };
  };
  const sitesFor = c => Object.entries(CO_SITES).filter(([k, X]) => X.kinds.includes(c.type) && k !== c.site && k !== 'home' && !BR(c).some(b => b.site === k));
  const setupCost = (c, site) => { const X = CO_SITES[site]; return { fit: fitOut(c), dep: X.rent * 3, reg: REG_FEE, total: fitOut(c) + X.rent * 3 + REG_FEE }; };

  function openBranch(c, site) {
    if (!open(c)) { UI.toast('บริษัทต้องเปิดดำเนินการแล้วจึงเปิดสาขาได้', '🏢'); return; }
    if (!c.lic || !c.lic.vat) { UI.toast('ต้องจดทะเบียนภาษีมูลค่าเพิ่ม (ภ.พ.20) ก่อน จึงจะจดสาขา (ภ.พ.09) ได้', '📜'); return; }
    if (BR(c).filter(b => b.st === 'open').length >= MAXB) { UI.toast(`เปิดสาขาได้สูงสุด ${MAXB} แห่ง`, '🏢'); return; }
    if (!sitesFor(c).some(([k]) => k === site)) { UI.toast('ที่ตั้งนี้ใช้ไม่ได้หรือมีสาขาอยู่แล้ว', '🏢'); return; }
    const K = setupCost(c, site), X = CO_SITES[site];
    if (c.cash < K.total) { UI.toast(`เงินบริษัทไม่พอ ต้องใช้ ${baht(K.total)} (ตกแต่ง/อุปกรณ์ ${baht(K.fit)} + มัดจำ 3 เดือน ${baht(K.dep)} + จดสาขา ${baht(K.reg)})`, '💸'); return; }
    why('เปิดสาขา: ' + X.n.slice(0, 30), () => { c.cash -= K.total; Company.book(c, 0, K.total); })();
    const id = (c.brN = (c.brN || 0) + 1);
    BR(c).push({ id, site, name: `สาขา${townName(site)} ${id}`, st: 'open', day: S.day, dep: K.dep, rent: X.rent, rev: 0, hist: [] });
    Phone.msg(c.name, `เปิดสาขาใหม่ที่ ${X.n} เรียบร้อย (จดสาขา ภ.พ.09) ทีมพนักงานสาขารายงานตัวแล้ว`, true);
    UI.toast('เปิดสาขาแล้ว 🏪', '🏪'); UI.renderBody();
  }
  function closeBranch(c, id) {
    const b = BR(c).find(x => x.id === +id && x.st === 'open'); if (!b) return;
    b.st = 'closed'; const back = Math.round(b.dep * 0.8);
    why('ปิดสาขา: คืนเงินมัดจำ 80%', () => { c.cash += back; Company.book(c, back, 0); })();
    Phone.msg(c.name, `ปิดสาขา ${b.name} แล้ว ได้รับเงินมัดจำคืน ${baht(back)} (หักค่าเสียหาย 20%)`, false); UI.renderBody();
  }

  // ---- daily income of the branches (after the head office has run its own day) ----
  { const _d = Company.day; Company.day = function () {
    const r = _d.apply(this, arguments);
    try {
      for (const c of Company.list()) {
        if (!open(c) || !BR(c).length) continue;
        const T = CO_TYPES[c.type]; if (Company.checks(c).some(x => !x[0]) || Company.dark(c.id)) continue;   // the head office is stopped: so are the branches
        for (const b of BR(c)) {
          if (b.st !== 'open') continue;
          const q = 0.75 + c.rep / 200 + Math.random() * 0.2, mult = (window.Biz212 && Biz212.mult) ? Biz212.mult(c.type) : 1;
          const base = Math.max(T.rev(c), c.mon && c.mon[0] ? (c.mon[0].rev || 0) / Math.max(28, Math.min(31, c.mon[1] ? c.mon[0].d - c.mon[1].d : 30)) : 0)   /* v237: the monthly revenue per day of the close, not per 7 */, rev = Math.round(base * BR_SHARE * tf(b.site) * q * (mult || 1)), cost = Math.round(rev * T.cost);
          why('รายได้สุทธิ ' + b.name, () => { c.cash += rev - cost; Company.book(c, rev, cost); })();
          b.rev = (b.rev || 0) + rev; b.hist.unshift(`${RD(S.day)}: รายรับ ${baht(rev)}`); b.hist.length = Math.min(b.hist.length, 4);
        }
      }
    } catch (e) { console.warn('v214 branch day', e); }
    return r;
  }; }
  // ---- the monthly (weekly) close ----
  { const _w = Company.week; Company.week = function () {
    const r = _w.apply(this, arguments);
    try {
      for (const c of Company.list()) {
        if (!['setup', 'open'].includes(c.st) || !BR(c).length) continue;
        let tot = 0;
        for (const b of BR(c)) { if (b.st !== 'open') continue; const k = weekCost(c, b); tot += k.total; b.last = k; b.rev = 0; }
        if (tot) why('ปิดงบสาขา (ทีมงาน ค่าเช่า ค่าไฟ เน็ต บัญชี)', () => { c.cash -= tot; Company.book(c, 0, tot); })();
      }
    } catch (e) { console.warn('v214 branch week', e); }
    return r;
  }; }

  // ---- UI inside the company window ----
  const ui = c => {
    const L = BR(c), live = L.filter(b => b.st === 'open'), T = CO_TYPES[c.type], s = staffCost(c);
    const rows = live.map(b => { const k = weekCost(c, b), X = CO_SITES[b.site]; return `<div class="card"><div class="ci">🏪</div><div class="cb"><h4>${E(b.name)}</h4><p class="dim">${E(X ? X.n : b.site)} · เปิดวันที่ ${RD(b.day)} · รายรับรอบนี้ ${baht(b.rev || 0)}</p><p class="dim">ค่าใช้จ่ายรอบปิดงบ ≈ ${baht(k.total)} (ทีม ${baht(k.staff)} · เช่า ${baht(k.rent)} · ไฟ ${baht(k.power)} · เน็ต ${baht(k.net)} · บัญชี ${baht(k.acct)})</p>${b.hist[0] ? `<p class="dim">${E(b.hist[0])}</p>` : ''}<div class="row"><button class="btn ghost danger" data-a="br214close" data-v="${c.id}" data-k="${b.id}">ปิดสาขา (คืนมัดจำ 80%)</button></div></div></div>`; }).join('');
    const opts = sitesFor(c);
    const add = live.length >= MAXB ? `<p class="dim">เปิดสาขาครบ ${MAXB} แห่งแล้ว</p>` : !c.lic || !c.lic.vat ? '<p class="dim">ต้องจดภาษีมูลค่าเพิ่ม (ภ.พ.20) ก่อน จึงจะจดสาขา (ภ.พ.09) ได้</p>' : opts.length ? `<div class="row"><select id="br214site${c.id}">${opts.map(([k, X]) => { const K = setupCost(c, k); return `<option value="${k}">${E(X.n)} · เช่า ${baht(X.rent)}/เดือน · ลงทุน ${baht(K.total)}</option>`; }).join('')}</select><button class="btn" data-a="br214open" data-v="${c.id}">🏪 เปิดสาขา</button></div>` : '<p class="dim">ไม่มีที่ตั้งว่างที่เหมาะกับธุรกิจประเภทนี้</p>';
    return `<h5>🏪 สาขา (${live.length}/${MAXB})</h5><p class="dim">สาขาทำรายได้ราว ${Math.round(BR_SHARE * 100)}% ของสำนักงานใหญ่ (ปรับตามเมือง: มหานคร ×1.25 · ทุ่งทานตะวัน ×0.8) มีทีมประจำสาขา ${s.n} คน (เงินเดือนราว ${baht(s.pay)}/เดือน) · ลงทุนตกแต่ง ${baht(fitOut(c))} + มัดจำ 3 เดือน + จดสาขา ${baht(REG_FEE)} · สำนักงานใหญ่หยุดหรือไฟดับ สาขาก็หยุดด้วย</p>${rows || '<p class="dim">ยังไม่มีสาขา</p>'}${add}`;
  };
  { const _h = Company.html.bind(Company); Company.html = function (t) {
    let s = _h(t); if (t === 1 || t === 3) return s;
    const c = Company.get(Company.sel); if (!c || !open(c)) return s;
    const block = ui(c), key = '<h5>🗓️ ประชุมบอร์ด / ผู้ถือหุ้น</h5>';
    return s.includes(key) ? s.replace(key, block + key) : s.replace('<div class="row"><button class="btn danger" data-a="coclose"', block + '<div class="row"><button class="btn danger" data-a="coclose"');
  }; }
  Object.assign(UI.H, {
    br214open: d => { const c = Company.get(d.v), sel = document.getElementById('br214site' + d.v); if (c && sel) openBranch(c, sel.value); },
    br214close: d => { const c = Company.get(d.v); if (c) closeBranch(c, d.k); },
  });
  window.Branch214 = { open: openBranch, close: closeBranch, weekCost, setupCost, sitesFor, staffCost, MAXB, BR_SHARE };
});
