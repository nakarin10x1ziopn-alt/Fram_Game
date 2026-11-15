'use strict';
// ---------- v249: franchise network and logistics across the village and the three cities ----------
// Company page > tab "สาขา/แฟรนไชส์" (below the branches). An open company with reputation 40+ that is at least 120 days old can sell franchises:
//  - the franchisee pays a one-off fee; every month the company earns a 6% royalty on its sales and pays the logistics (3% of the sales x distance factor,
//    x0.6 when the city has a distribution centre)
//  - quality (0-100) follows the supply: a late delivery (12% a month, 4% with a distribution centre) lowers it, a standards audit raises it;
//    under 35 the brand loses reputation every month, under 20 for two months the franchise is closed
//  - sales depend on the town (the capital is the busiest), the company's reputation and the quality; at most 8 franchisees (4 / 3 / 2 / 2 per town)
V23.add('v249_franchise', function () {
  if (typeof Company === 'undefined' || !Company.list || typeof Cal36 === 'undefined') return;
  const E = s => (typeof esc === 'function' ? esc(s) : String(s));
  const B = n => (typeof baht0 === 'function' ? baht0(n) : typeof baht === 'function' ? baht(n) : Math.round(n).toLocaleString('en-US') + ' ฿');
  const rnd = (a, b) => a + Math.random() * (b - a), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const TOWN = {
    metro: { n: 'สุขนครมหานคร', i: '🌆', tf: 1.3, dist: 1.4, cap: 4, dc: 600000, fee: 220000 },
    orchard: { n: 'สวนทองเมือง', i: '🍊', tf: 1.0, dist: 1.0, cap: 3, dc: 400000, fee: 160000 },
    sunflower: { n: 'บ้านทุ่งทานตะวัน', i: '🌻', tf: 0.7, dist: 0.8, cap: 2, dc: 250000, fee: 110000 },
    village: { n: 'หมู่บ้านสุขใจ', i: '🏡', tf: 0.9, dist: 0.5, cap: 2, dc: 150000, fee: 120000 },
  };
  const MAXF = 8, SETUP = 40000, AUDIT = 20000;
  const open = c => c && c.st === 'open';
  const F = c => { const f = c.fr = c.fr || {}; f.net = f.net || []; f.dc = f.dc || {}; f.seq = f.seq || 0; return f; };
  const msg = (c, t, q) => { try { Phone.msg(c.name, t, !!q); } catch (e) { } };
  const hist = (c, t) => { try { c.hist.unshift(`${RD(S.day)}: ${t}`); } catch (e) { } };
  const eligible = c => (c.rep || 0) >= 40 && (c.regDay == null || S.day - c.regDay >= 120);
  const baseSales = (c, town) => Math.round(45000 * TOWN[town].tf * (0.6 + (c.rep || 0) / 100));
  const salesOf = (c, f) => Math.round(f.base * (0.7 + f.q / 200));
  const logiCost = (c, f) => Math.round(salesOf(c, f) * 0.03 * TOWN[f.town].dist * (F(c).dc[f.town] ? 0.6 : 1));
  const netOf = (c, f) => Math.round(salesOf(c, f) * 0.06) - logiCost(c, f);

  const monthly = c => {
    const fr = F(c); let inc = 0, cost = 0;
    for (const f of fr.net.slice()) {
      const dc = !!fr.dc[f.town], sales = Math.round(salesOf(c, f) * rnd(0.92, 1.08)), roy = Math.round(sales * 0.06), lg = logiCost(c, f);
      inc += roy; cost += lg;
      if (Math.random() < (dc ? 0.04 : 0.12)) { f.q = clamp(f.q - 8, 0, 100); msg(c, `🚚 สินค้าส่งไป ${f.name} ล่าช้า คุณภาพร้านลดลง${dc ? '' : ' (มีศูนย์กระจายสินค้าในเมืองจะลดปัญหานี้)'}`, true); }
      f.q = clamp(Math.round(f.q + (70 - f.q) * 0.1), 0, 100);
      if (f.q < 35) { c.rep = clamp((c.rep || 0) - 2, 0, 100); f.low = (f.low || 0) + 1; msg(c, `⚠️ ${f.name} มาตรฐานต่ำ (${f.q}) ภาพลักษณ์แบรนด์เสียหาย ตรวจมาตรฐานด่วน`); } else f.low = 0;
      if (f.q < 20 && f.low >= 2) { fr.net = fr.net.filter(q => q !== f); c.rep = clamp((c.rep || 0) - 5, 0, 100); msg(c, `🚫 ปิดแฟรนไชส์ ${f.name} เพราะมาตรฐานต่ำเกินไป ชื่อเสียงบริษัทเสียหาย`); hist(c, `ปิดแฟรนไชส์ ${f.name}`); }
    }
    if (inc || cost) { c.cash += inc - cost; try { Company.book(c, inc, cost); } catch (e) { } msg(c, `🏪 เครือแฟรนไชส์ ${fr.net.length} ร้าน: ค่าสิทธิ์ ${B(inc)} − ค่าขนส่ง ${B(cost)} = ${B(inc - cost)}`, true); }
  };
  const daily = () => {
    for (const c of Company.list()) {
      if (!open(c) || !c.fr || !c.fr.net.length) continue;
      const t = Cal36.date(S.day); if (t.dom === 1 && c.frM !== S.day) { c.frM = S.day; monthly(c); }
    }
  };
  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { daily(); } catch (e) { console.warn('v249 daily', e); } return r; }; }

  const section = c => {
    const fr = F(c), ok = eligible(c), total = fr.net.length;
    const rows = Object.keys(TOWN).map(k => {
      const T = TOWN[k], list = fr.net.filter(f => f.town === k), dc = !!fr.dc[k];
      const items = list.map(f => `<div class="cx-card"><h4>${T.i} ${E(f.name)}</h4><p class="cx-meta">คุณภาพ <b>${f.q}</b>/100 · ยอดขาย ${B(salesOf(c, f))}/เดือน · ค่าสิทธิ์ ${B(Math.round(salesOf(c, f) * 0.06))} − ขนส่ง ${B(logiCost(c, f))} = สุทธิ ${B(netOf(c, f))}</p><div class="cx-chips"><span class="cx-chip ${f.q >= 60 ? 'good' : f.q < 35 ? 'bad' : ''}">${f.q >= 60 ? 'มาตรฐานดี' : f.q < 35 ? 'ต่ำกว่าเกณฑ์' : 'พอใช้'}</span></div><div class="cx-actions"><button class="btn ghost" data-a="fr249" data-v="audit|${f.id}" ${c.cash >= AUDIT ? '' : 'disabled'}>ตรวจมาตรฐาน ${B(AUDIT)}</button><button class="btn ghost" data-a="fr249" data-v="close|${f.id}">เลิกแฟรนไชส์</button></div></div>`).join('');
      const can = ok && total < MAXF && list.length < T.cap && c.cash >= SETUP;
      return `<div class="cx-card"><h4>${T.i} ${T.n}</h4><p class="cx-meta">ร้านแฟรนไชส์ ${list.length}/${T.cap} · ค่าสิทธิ์แรกเข้าที่ได้รับ ${B(T.fee)} (หักค่าจัดระบบ ${B(SETUP)}) · ระยะขนส่ง ×${T.dist}</p><div class="cx-chips"><span class="cx-chip ${dc ? 'good' : ''}">${dc ? '✅ มีศูนย์กระจายสินค้า (ขนส่งถูกลง 40% ส่งช้าน้อยลง)' : 'ยังไม่มีศูนย์กระจายสินค้า'}</span></div><div class="cx-actions"><button class="btn" data-a="fr249" data-v="open|${k}" ${can ? '' : 'disabled'}>ขายแฟรนไชส์</button>${dc ? '' : `<button class="btn ghost" data-a="fr249" data-v="dc|${k}" ${c.cash >= T.dc ? '' : 'disabled'}>สร้างศูนย์กระจายสินค้า ${B(T.dc)}</button>`}</div></div>${items}`;
    }).join('');
    const sum = fr.net.reduce((a, f) => a + netOf(c, f), 0);
    return `<h5>🚚 แฟรนไชส์และโลจิสติกส์ข้ามเมือง</h5>
      <p class="lead">ขยายแบรนด์ <b>${E(c.name)}</b> ด้วยแฟรนไชส์ในหมู่บ้านและ 3 เมือง · ตอนนี้ ${total}/${MAXF} ร้าน · รายได้สุทธิต่อเดือน ${B(sum)} · ${ok ? '✅ พร้อมขายแฟรนไชส์' : `❌ ต้องมีชื่อเสียง 40 ขึ้นไป (ตอนนี้ ${Math.round(c.rep || 0)}) และเปิดมาอย่างน้อย 120 วัน`}</p>
      <p class="dim">ค่าสิทธิ์รายเดือน 6% ของยอดขายร้าน หักค่าขนส่ง 3% × ระยะทาง (ศูนย์กระจายสินค้าลด 40%) · ถ้าส่งของล่าช้าหรือไม่ตรวจมาตรฐาน คุณภาพร้านตก และร้านที่ห่วยจะทำให้ชื่อเสียงบริษัทเสีย</p>
      <div class="cx-grid">${rows}</div>`;
  };
  { const _h = Company.html.bind(Company);
    Company.html = function (t) {
      const html = _h(t);
      if (t !== 0) return html;
      try {
        const c = Company.get(Company.sel); if (!c || c.st !== 'open' || Company.tab229 !== 'br') return html;
        const box = document.createElement('div'); box.innerHTML = html; const body = box.querySelector('.cx-body'); if (!body) return html;
        body.insertAdjacentHTML('beforeend', section(c)); return box.innerHTML;
      } catch (e) { console.warn('v249 page', e); return html; }
    }; }
  UI.H.fr249 = d => {
    const [a, x] = String(d.v || '').split('|'), c = Company.get(Company.sel); if (!c || c.st !== 'open') return; const fr = F(c);
    if (a === 'open') {
      const T = TOWN[x]; if (!T || !eligible(c) || fr.net.length >= MAXF || fr.net.filter(f => f.town === x).length >= T.cap || c.cash < SETUP) return;
      const f = { id: ++fr.seq, town: x, name: `${c.name} แฟรนไชส์${T.n} ${fr.seq}`, q: 70, base: baseSales(c, x), since: S.day, low: 0 }; fr.net.push(f);
      c.cash += T.fee - SETUP; try { Company.book(c, T.fee, SETUP); } catch (e) { }
      msg(c, `🏪 ขายแฟรนไชส์ที่${T.n}แล้ว: ได้ค่าสิทธิ์แรกเข้า ${B(T.fee)} (หักค่าจัดระบบ ${B(SETUP)})`); hist(c, `เปิดแฟรนไชส์ ${T.n}`); UI.toast(`เปิดแฟรนไชส์ที่${T.n}`, T.i); return;
    }
    if (a === 'dc') { const T = TOWN[x]; if (!T || fr.dc[x] || c.cash < T.dc) return; c.cash -= T.dc; try { Company.book(c, 0, T.dc); } catch (e) { } fr.dc[x] = S.day; msg(c, `🏭 เปิดศูนย์กระจายสินค้าที่${T.n} ใช้ ${B(T.dc)}`); UI.toast('สร้างศูนย์กระจายสินค้าแล้ว', '🏭'); return; }
    const f = fr.net.find(q => String(q.id) === x); if (!f) return;
    if (a === 'audit') { if (c.cash < AUDIT) return; c.cash -= AUDIT; try { Company.book(c, 0, AUDIT); } catch (e) { } f.q = clamp(f.q + 15, 0, 100); f.low = 0; UI.toast(`ตรวจมาตรฐาน ${f.name} คุณภาพ ${f.q}`, '✅'); return; }
    if (a === 'close') { fr.net = fr.net.filter(q => q !== f); c.rep = clamp((c.rep || 0) - 1, 0, 100); msg(c, `เลิกสัญญาแฟรนไชส์ ${f.name}`); UI.toast('เลิกแฟรนไชส์แล้ว', '🗑️'); }
  };
  window.Fran249 = { F, TOWN, monthly, daily, section, salesOf, logiCost, netOf, eligible };
});
