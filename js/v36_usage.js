'use strict';
// ---------- v36 usage overview: electricity (kWh, ฿), water (m³, ฿) and internet (GB) by hour / day / week / month, per house, per device group,
// peak hours, comparison with the last period, a forecast of the next bill and solar production against use ----------
V23.add('v36_usage', () => {
  const st = () => { if (!S.v36u) S.v36u = { d: {}, range: 7 }; const s = S.v36u; if (!s.d) s.d = {}; return s; };
  const safe = (f, d) => { try { const v = f(); return v == null ? d : v; } catch (e) { return d; } };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmt = (n, k = 1) => (+n || 0).toLocaleString('en-US', { maximumFractionDigits: k, minimumFractionDigits: 0 });
  const baht0 = n => '฿' + fmt(n, 0);
  const day = d => { const s = st(); if (!s.d[d]) s.d[d] = { e: Array(24).fill(0), p: Array(24).fill(0), im: 0, ex: 0, w: Array(24).fill(0), c: {}, g: {}, net: 0 }; return s.d[d]; };
  const prune = () => { const s = st(), keys = Object.keys(s.d).map(Number).sort((a, b) => a - b); while (keys.length > 62) delete s.d[keys.shift()]; };

  // ----- electricity: wrap the hourly power model and split the hour into device groups -----
  const CAT_E = { base: ['🏠', 'ไฟพื้นฐาน/ตู้เย็น/ปั๊ม'], light: ['💡', 'แสงสว่างตอนกลางคืน'], ac: ['❄️', 'เครื่องปรับอากาศ'], app: ['📺', 'เครื่องใช้ไฟฟ้า/เฟอร์นิเจอร์'], it: ['🖥️', 'ไอที/กล้อง/เซิร์ฟเวอร์/ระบบอัจฉริยะ'], pc: ['💻', 'คอมพิวเตอร์ (นับเฉพาะตอนเปิดเครื่อง)'], ev: ['🔌', 'ชาร์จรถ EV'] };
  const CAT_G = { tv: ['📺', 'สมาร์ททีวี/สตรีมมิ่ง'], pc: ['💻', 'คอมพิวเตอร์/งานออนไลน์'], cam: ['📹', 'กล้องวงจรปิด (คลาวด์)'], bak: ['☁️', 'สำรองข้อมูลคลาวด์'], oth: ['📱', 'มือถือ/โซเชียล/อุปกรณ์อัจฉริยะ/อัปเดต'] };
  const _hs = Power.hourStep.bind(Power);
  Power.hourStep = function (h) {
    const s = this.st(), t0 = s.today ? { u: s.today.use, p: s.today.prod, i: s.today.imp, x: s.today.exp } : null;
    const r = _hs(h);
    try {
      if (t0) {
        const D = day(S.day), du = Math.max(0, s.today.use - t0.u), dp = Math.max(0, s.today.prod - t0.p);
        if (s.today.use >= t0.u) { D.e[h] += du; D.p[h] += dp; D.im += Math.max(0, s.today.imp - t0.i); D.ex += Math.max(0, s.today.exp - t0.x); }
        // group the hour
        const night = h >= 18 || h < 6, base = 0.25, light = night ? 0.3 : 0, ac = S.ac ? 1.4 : 0, app = Object.keys(S.furn || {}).length * 0.015;
        let it = 0; for (const f of Power.extra) it += safe(() => f(h), 0) || 0;
        const ev = Math.max(0, du - (base + light + ac + app + it)), tot = base + light + ac + app + it + ev || 1;
        for (const [k, v] of Object.entries({ base, light, ac, app, it, ev })) D.c[k] = (D.c[k] || 0) + du * v / tot;
        internet(D, h);
        if (h === 23) prune();
      }
    } catch (e) { if (!Power._w36) { Power._w36 = 1; console.warn('v36 usage', e); } }
    return r;
  };
  function internet(D, h) {
    if (!(safe(() => ISP.speed(), 0) > 0)) return;
    const evening = h >= 18 && h < 24, work = h >= 8 && h < 18, g = D.g;
    const add = (k, v) => { g[k] = (g[k] || 0) + v; D.net += v; };
    if (S.furn && S.furn.smarttv && evening) add('tv', 2.2 + (safe(() => S.isp.addons.iptv, 0) ? 1 : 0)); else if (evening) add('tv', 0.2);
    const pcs = window.PC39 ? PC39.onCount() : (S.pcs || []).length; if (pcs) add('pc', work ? 0.25 * pcs : evening ? 0.35 * pcs : 0.02);
    const cams = Sec_cloud(); if (cams) add('cam', cams);
    if (safe(() => S.sec.cy.home.backup, 0) && h >= 1 && h < 6) add('bak', 1.2);
    add('oth', 0.1 + (evening ? 0.35 : work ? 0.15 : 0.05) + (S.furn ? Object.keys(S.furn).length * 0.003 : 0));
  }
  // GB per hour that cloud cameras upload (bit-rate Mbps × 3600 s / 8000)
  function Sec_cloud() { return safe(() => { const status = Sec.status('home'); return Sec.site('home').dev.filter(d => DEV[d.k].t === 'cam' && DEV[d.k].cloud && !DEV[d.k].solo && status.isOn(d)).reduce((s, d) => s + (DEV[d.k].br || 2) * 0.45, 0); }, 0); }

  // ----- water: wrap Water.use (the real meter) -----
  { const _u = Water.use.bind(Water);
    Water.use = function (m3) {
      const w = this.st(), wk0 = w.wk, td0 = w.today; _u(m3);
      try { const dm = (w.wk - wk0); if (dm > 0) day(S.day).w[clamp(Math.floor(S.time / 60), 0, 23)] += dm; } catch (e) { }
    }; }

  // ----- tariffs (same steps as the bills in the game) -----
  const elecBill = u => { let e = 0, left = u, prev = 0; for (const [cap, r] of [[150, 3.2484], [400, 4.2218], [1e9, 4.4217]]) { const x = Math.min(left, cap - prev); if (x <= 0) break; e += x * r; left -= x; prev = cap; } const ft = u * 0.3972; return Math.round((e + ft + 24.62) * 1.07); };
  const waterBill = m3 => safe(() => Water.bill(m3), Math.round(m3 * 18));
  const sumArr = a => a.reduce((s, v) => s + v, 0);
  const dayE = d => { const x = st().d[d]; return x ? sumArr(x.e) : 0; };
  const dayW = d => { const x = st().d[d]; return x ? sumArr(x.w) : 0; };
  const dayG = d => { const x = st().d[d]; return x ? x.net : 0; };
  const dayP = d => { const x = st().d[d]; return x ? sumArr(x.p) : 0; };
  const span = (f, n, from = S.day) => { let t = 0; for (let i = 0; i < n; i++) t += f(from - i); return t; };
  const monthly = () => safe(() => ISP.monthly(), 0) + safe(() => N36sum(), 0);
  const N36sum = () => (S.v36n && S.v36n.lines ? S.v36n.lines.reduce((s, L) => s + (NET_PKGS[L.pkg] ? NET_PKGS[L.pkg].price : 0), 0) : 0);
  // cost of one day: the day's units priced by the average rate of the week it belongs to (a bill per game week)
  const rateE = () => { const u = span(dayE, 7); return u > 0 ? elecBill(u) / u : 4.2; };
  const rateW = () => { const m = span(dayW, 7); return m > 0 ? waterBill(m) / m : 18; };

  // ----- charts (inline SVG, theme colours) -----
  function bars(vals, labels, o = {}) {
    const W = 320, H = o.h || 96, n = vals.length, max = Math.max(o.max || 0, ...vals, 0.0001), bw = Math.max(2, (W - 8) / n - 2), col = o.col || '#4fc3f7';
    const over = o.over || [], mx2 = Math.max(max, ...over);
    const b = vals.map((v, i) => { const hgt = Math.round(v / mx2 * (H - 22)), x = 4 + i * ((W - 8) / n); return `<rect x="${x.toFixed(1)}" y="${H - 16 - hgt}" width="${bw.toFixed(1)}" height="${hgt}" rx="1.5" fill="${o.cols ? o.cols[i] || col : col}"><title>${labels[i]}: ${fmt(v, 2)} ${o.unit || ''}</title></rect>`; }).join('');
    const l2 = over.length ? over.map((v, i) => { const hgt = Math.round(v / mx2 * (H - 22)), x = 4 + i * ((W - 8) / n); return `<rect x="${(x + bw * 0.25).toFixed(1)}" y="${H - 16 - hgt}" width="${(bw * 0.5).toFixed(1)}" height="${hgt}" rx="1" fill="${o.col2 || '#ffd54f'}" opacity=".9"/>`; }).join('') : '';
    const step = n > 14 ? Math.ceil(n / 7) : 1, lab = labels.map((t, i) => i % step === 0 ? `<text x="${(4 + i * ((W - 8) / n) + bw / 2).toFixed(1)}" y="${H - 3}" font-size="8" text-anchor="middle" fill="currentColor" opacity=".7">${t}</text>` : '').join('');
    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;max-height:150px"><line x1="4" y1="${H - 16}" x2="${W - 4}" y2="${H - 16}" stroke="currentColor" opacity=".25"/>${b}${l2}${lab}<text x="${W - 4}" y="10" font-size="9" text-anchor="end" fill="currentColor" opacity=".8">สูงสุด ${fmt(mx2, 1)} ${o.unit || ''}</text></svg>`;
  }
  const hbar = (rows, unit) => { const mx = Math.max(...rows.map(r => r[2]), 0.0001); return rows.map(([i, n, v]) => `<div style="display:flex;align-items:center;gap:6px;margin:3px 0"><span style="width:20px">${i}</span><span style="flex:0 0 38%;font-size:12px">${n}</span><div style="flex:1;background:rgba(255,255,255,.1);border-radius:4px;height:10px"><div style="width:${(v / mx * 100).toFixed(0)}%;height:10px;border-radius:4px;background:#66bb6a"></div></div><span style="width:70px;text-align:right;font-size:12px">${fmt(v, 1)} ${unit}</span></div>`).join(''); };
  const range = () => st().range || 7;
  const lastDays = n => { const o = []; for (let i = n - 1; i >= 0; i--) o.push(S.day - i); return o; };
  // fewer bars on long ranges: sum days into weeks when showing 28 days
  const series = (f, n) => { const ds = lastDays(n); if (n <= 7) return { v: ds.map(f), l: ds.map(d => 'ว' + d) }; const out = [], lab = []; for (let i = 0; i < ds.length; i += 4) { out.push(sumArr(ds.slice(i, i + 4).map(f))); lab.push('ว' + ds[i]); } return { v: out, l: lab }; };
  const cmp = (a, b, unit, k = 1) => { if (!b) return '<span class="dim">ยังไม่มีข้อมูลช่วงก่อนหน้า</span>'; const p = (a - b) / b * 100; return `<span style="color:${p > 5 ? '#ef5350' : p < -5 ? '#66bb6a' : 'inherit'}">${p >= 0 ? '▲' : '▼'} ${Math.abs(p).toFixed(0)}% เทียบช่วงก่อนหน้า (${fmt(b, k)} ${unit})</span>`; };
  const rangeBtn = () => `<div class="row">${[1, 7, 28].map(n => `<button class="btn ${range() === n ? '' : 'ghost'}" data-a="v36uv" data-v="${n}">${n === 1 ? 'วันนี้ (รายชั่วโมง)' : n === 7 ? '7 วัน (สัปดาห์)' : '28 วัน (เดือน)'}</button>`).join('')}</div>`;

  // ----- pages -----
  function houses() {
    const out = [{ id: 'main', n: 'บ้านหลัก (ฟาร์ม)', e: dayE(S.day), ew: span(dayE, 7), w: dayW(S.day), ww: span(dayW, 7), live: true }];
    const homes = safe(() => Prop23.V().homes, {}), m = (S.v28 && S.v28.m) || {};
    for (const hid in homes) { const h = homes[hid], mt = m[hid]; const live = !!(safe(() => h.util.e, 0) && true); out.push({ id: hid, n: 'บ้านเพิ่ม ' + (h.name || hid), e: mt ? mt.e.td : 0, ew: mt ? mt.e.wk : 0, w: mt ? mt.w.td : 0, ww: mt ? mt.w.wk : 0, live, mt, h }); }
    return out;
  }
  function overview() {
    const D = day(S.day), e = dayE(S.day), w = dayW(S.day), g = dayG(S.day), p = dayP(S.day);
    const eP = span(dayE, 7), wP = span(dayW, 7), gP = span(dayG, 7), ePrev = span(dayE, 7, S.day - 7), wPrev = span(dayW, 7, S.day - 7), gPrev = span(dayG, 7, S.day - 7);
    const cd = Cal36.date(S.day), dim = Cal36.daysIn(cd.y, cd.m), idx = Math.max(1, cd.dom), wkE = span(dayE, idx), wkW = span(dayW, idx), projE = wkE / idx * dim, projW = wkW / idx * dim;
    const sE = series(dayE, 7), sW = series(dayW, 7), sG = series(dayG, 7);
    const card = (ic, t, big, sub, ch) => `<div class="card" style="grid-column:1/-1"><div class="ci">${ic}</div><div class="cb"><h4>${t}: ${big}</h4><p class="dim">${sub}</p>${ch}</div></div>`;
    return `<div class="grid">
      ${card('⚡', 'ไฟฟ้าวันนี้', `${fmt(e)} kWh · ${baht0(e * rateE())}`, `7 วันล่าสุด ${fmt(eP)} kWh · ${cmp(eP, ePrev, 'kWh')}`, bars(sE.v, sE.l, { unit: 'kWh', col: '#ffca28' }))}
      ${card('💧', 'น้ำวันนี้', `${fmt(w, 2)} ลบ.ม. · ${baht0(w * rateW())}`, `7 วันล่าสุด ${fmt(wP, 2)} ลบ.ม. · ${cmp(wP, wPrev, 'ลบ.ม.', 2)}`, bars(sW.v, sW.l, { unit: 'ลบ.ม.', col: '#29b6f6' }))}
      ${card('🌐', 'อินเทอร์เน็ตวันนี้', `${fmt(g)} GB · ${baht0(monthly() / 7)}/วัน`, `7 วันล่าสุด ${fmt(gP)} GB · ${cmp(gP, gPrev, 'GB')} · ความเร็วรวมตอนนี้ ${safe(() => ISP.speed(), 0)} Mbps`, bars(sG.v, sG.l, { unit: 'GB', col: '#ab47bc' }))}
      <div class="card"><div class="ci">☀️</div><div class="cb"><h4>โซลาร์ผลิต ${fmt(p)} kWh · ใช้ ${fmt(e)} kWh</h4><p class="dim">${p ? `ผลิตครอบคลุม ${Math.min(100, Math.round(p / Math.max(0.01, e) * 100))}% ของที่ใช้ · ขายคืนกริด ${fmt(D.ex)} kWh · ซื้อจากกริด ${fmt(D.im)} kWh` : 'ยังไม่มีแผงโซลาร์ผลิตไฟวันนี้'}</p></div></div>
      <div class="card"><div class="ci">🧾</div><div class="cb"><h4>ประมาณการบิลเดือนนี้ (วันที่ ${idx}/${dim} ของรอบบิล)</h4><p class="dim">ค่าไฟ ~${baht0(elecBill(projE))} (${fmt(projE)} kWh) · ค่าน้ำ ~${baht0(waterBill(projW))} (${fmt(projW, 1)} ลบ.ม.) · อินเทอร์เน็ต ${baht0(monthly() * 1.07)} (รวม VAT)</p></div></div></div>`;
  }
  function electric() {
    const n = range(), ds = lastDays(n), D = day(S.day);
    let ch, sub;
    if (n === 1) { ch = bars(D.e, D.e.map((_, i) => i), { unit: 'kWh', col: '#ffca28', over: D.p, col2: '#66bb6a' }); sub = 'แท่งเหลือง = ใช้ไฟ · เส้นเขียว = โซลาร์ผลิต (รายชั่วโมงของวันนี้)'; }
    else { const s = series(dayE, n); ch = bars(s.v, s.l, { unit: 'kWh', col: '#ffca28' }); sub = n === 7 ? 'ใช้ไฟรายวัน 7 วัน' : 'ใช้ไฟรวมทุก 4 วัน (28 วัน)'; }
    const tot = span(dayE, n), prev = span(dayE, n, S.day - n), cost = tot * rateE();
    // peak hours = average per hour over the last 7 days
    const avg = Array(24).fill(0); for (const d of lastDays(7)) { const x = st().d[d]; if (x) x.e.forEach((v, i) => avg[i] += v / 7); }
    const peaks = avg.map((v, i) => [i, v]).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const cats = {}; for (const d of ds) { const x = st().d[d]; if (x) for (const k in x.c) cats[k] = (cats[k] || 0) + x.c[k]; }
    const rows = Object.entries(CAT_E).map(([k, [i, t]]) => [i, t, cats[k] || 0]).sort((a, b) => b[2] - a[2]);
    return `${rangeBtn()}<div class="card" style="grid-column:1/-1"><div class="cb"><h4>⚡ ไฟฟ้า ${fmt(tot)} kWh · ~${baht0(cost)}</h4><p class="dim">${cmp(tot, prev, 'kWh')}<br>${sub}</p>${ch}</div></div>
      <h5>ช่วงใช้ไฟสูงสุด (เฉลี่ย 7 วัน)</h5><p class="dim">${peaks.map(([h, v]) => `${String(h).padStart(2, '0')}:00–${String(h + 1).padStart(2, '0')}:00 (${fmt(v, 2)} kWh)`).join(' · ')}${safe(() => Grid.st().tou, 0) ? ' · มิเตอร์ TOU: 09:00–22:00 วันธรรมดาเป็นช่วง Peak แพงกว่า' : ''}</p>
      <h5>ใช้ไปกับอะไร</h5>${hbar(rows, 'kWh')}<p class="dim">แบ่งตามสัดส่วนของโหลดแต่ละชั่วโมง (ประมาณการ)</p>${window.PC39 ? PC39.usageHtml() : ''}`;
  }
  function water() {
    const n = range(), D = day(S.day), W0 = safe(() => Water.st(), {});
    let ch; if (n === 1) ch = bars(D.w, D.w.map((_, i) => i), { unit: 'ลบ.ม.', col: '#29b6f6' }); else { const s = series(dayW, n); ch = bars(s.v, s.l, { unit: 'ลบ.ม.', col: '#29b6f6' }); }
    const tot = span(dayW, n), prev = span(dayW, n, S.day - n), leak = safe(() => S.v23it.leak, null);
    return `${rangeBtn()}<div class="card" style="grid-column:1/-1"><div class="cb"><h4>💧 น้ำ ${fmt(tot, 2)} ลบ.ม. · ~${baht0(tot * rateW())}</h4><p class="dim">${cmp(tot, prev, 'ลบ.ม.', 2)}</p>${ch}</div></div>
      <div class="card"><div class="cb"><h4>มิเตอร์ประปา: ${fmt(W0.wk || 0, 2)} ลบ.ม. ในรอบบิลนี้</h4><p class="dim">${W0.well ? 'ใช้บ่อบาดาล (เสียค่าไฟปั๊มแทนค่าน้ำ) · ' : ''}${W0.tank ? `ถังเก็บน้ำ ${Math.round(W0.lvl || 0)} ลิตร · ` : ''}บิลโดยประมาณ ${baht0(waterBill(W0.wk || 0))}${leak ? ` · ⚠️ มีน้ำรั่ว${leak.found ? '' : ' (ยังไม่พบจุดรั่ว)'}` : ''}</p></div></div>
      <p class="dim">ใช้น้ำจากการรดน้ำแปลง สัตว์เลี้ยง คนงาน และของใช้ในบ้าน อัตราตามประปาจริง (ขั้นบันได)</p>`;
  }
  function net() {
    const n = range(), D = day(S.day);
    let ch; if (n === 1) { ch = ''; } else { const s = series(dayG, n); ch = bars(s.v, s.l, { unit: 'GB', col: '#ab47bc' }); }
    const tot = span(dayG, n), prev = span(dayG, n, S.day - n), cats = {}; for (const d of lastDays(n)) { const x = st().d[d]; if (x) for (const k in x.g) cats[k] = (cats[k] || 0) + x.g[k]; }
    const rows = Object.entries(CAT_G).map(([k, [i, t]]) => [i, t, cats[k] || 0]).sort((a, b) => b[2] - a[2]);
    const lines = safe(() => ISP.lines(), []).filter(l => l.P);
    const info = safe(() => ISP.lineInfo(), { v: 0, via: [] });
    return `${rangeBtn()}<div class="card" style="grid-column:1/-1"><div class="cb"><h4>🌐 ข้อมูล ${fmt(tot)} GB${n === 1 ? ' วันนี้' : ''} · ค่าบริการรวม ${baht0(monthly())}/รอบ</h4><p class="dim">${cmp(tot, prev, 'GB')}</p>${ch || '<p class="dim">รายชั่วโมงวันนี้: ' + fmt(D.net) + ' GB</p>'}</div></div>
      <h5>ตามอุปกรณ์ / ประเภทการใช้งาน</h5>${hbar(rows, 'GB')}
      <h5>สายอินเทอร์เน็ตที่ใช้อยู่ (รวม ${info.v} Mbps)</h5><div class="grid">${lines.map(l => `<div class="card"><div class="cb"><h4>${l.main ? 'สายหลัก' : 'สาย ' + l.id}: ${esc(l.P.n)}</h4><p class="dim">${l.v ? '🟢 ' + l.v + ' Mbps' : '🔴 ใช้ไม่ได้'} · ${baht0(l.P.price)}/รอบ${l.L && l.P.cap ? ` · ใช้ข้อมูล ${Math.round(l.L.usedGB || 0)}/${l.P.cap} GB` : ''}${l.mode === 'standby' ? ' · สำรอง' : ''}</p></div></div>`).join('') || '<p class="empty">ยังไม่ได้สมัครอินเทอร์เน็ต</p>'}</div>`;
  }
  function housesTab() {
    return `<p class="lead">บ้านหลักใช้มาตรวัดหลัก ส่วนบ้านที่ซื้อเพิ่มมีมิเตอร์ไฟและน้ำของตัวเอง (เริ่มนับเมื่อขอใช้ไฟ/น้ำแล้ว)</p><div class="grid">${houses().map(h => `<div class="card"><div class="ci">🏠</div><div class="cb"><h4>${esc(h.n)}</h4><p class="dim">ไฟวันนี้ ${fmt(h.e, 2)} kWh · รอบนี้ ${fmt(h.ew, 1)} kWh (~${baht0(elecBill(h.ew))})<br>น้ำวันนี้ ${fmt(h.w, 2)} ลบ.ม. · รอบนี้ ${fmt(h.ww, 1)} ลบ.ม. (~${baht0(waterBill(h.ww))})${h.id !== 'main' && !h.live ? '<br>⚠️ ยังไม่ได้ขอใช้ไฟ/น้ำบ้านหลังนี้' : ''}${h.mt && h.mt.log && h.mt.log[0] ? `<br>เมื่อวาน ${fmt(h.mt.log[0].kwh, 1)} kWh · ${fmt(h.mt.log[0].m3, 2)} ลบ.ม.` : ''}</p></div></div>`).join('')}</div>`;
  }
  const TABS = ['ภาพรวม', 'ไฟฟ้า', 'น้ำ', 'อินเทอร์เน็ต', 'แยกตามบ้าน'];
  const render = t => [overview, electric, water, net, housesTab][t]();
  const openUsage = t => UI.open('📊 ภาพรวมไฟ-น้ำ-เน็ต', TABS, render, { wide: true, tab: t || 0 });
  UI.H.v36uv = d => { st().range = +d.v; };
  const addApp = (id, i, n, fn) => {
    if (!APPS.some(a => a.id === id)) APPS.splice(Math.min(APPS.length, 13), 0, { id, i, n });
    Phone.apps[id] = () => { setTimeout(() => { Phone.app = null; UI.close(); fn(); }, 0); return ''; };
    if (typeof APP_GROUPS !== 'undefined') { const gr = APP_GROUPS.find(x => /บ้าน|สาธารณูปโภค|ไอที/.test(x[0])) || APP_GROUPS[APP_GROUPS.length - 1]; if (gr && !gr[1].includes(id)) gr[1].unshift(id); }
  };
  addApp('usage36', '📊', 'ไฟ-น้ำ-เน็ต', openUsage);
  // backfill: a first sample so the charts are not empty on an old save
  { const D = day(S.day); if (!sumArr(D.e) && S.pw && S.pw.today) { const h = Math.max(0, Math.floor(S.time / 60)); D.e[h] = S.pw.today.use || 0; D.p[h] = S.pw.today.prod || 0; } if (S.wtr && !sumArr(D.w)) D.w[Math.max(0, Math.floor(S.time / 60))] = S.wtr.today || 0; }
  window.Usage36 = { open: openUsage, state: st, rateE, rateW, elecBill, series, dayE, dayW, dayG, overview, electric, water, net, housesTab };
  st();
});
