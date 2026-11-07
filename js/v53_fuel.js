// v53_fuel.js: petrol stations and EV charging points are now separate sites, in every town (big, medium, small), with real-market prices.
// Petrol: PTT pump prices 29 Oct 2026 (gasohol 95 41.54, E20 33.50, diesel 42.54; gasohol 91 estimated), moved daily by the game's world-oil factor (RL.st().fuel).
// EV: Thai public charging, AC 22 kW 6.50 baht/kWh, DC 8.00 (Zeekr Power list price Jul 2026), DC ultra-fast 9.50.
V23.add('v53_fuel', () => {
  const GR = { g95: ['แก๊สโซฮอล์ 95', 41.54, 'e'], g91: ['แก๊สโซฮอล์ 91', 41.17, 'e'], e20: ['แก๊สโซฮอล์ E20', 33.5, 'e'], dsl: ['ดีเซล B7', 42.54, 'd'] };
  const CH = { ac: ['AC 22 kW', 22, 6.5, 0.95, '🔌'], dc: ['DC เร็ว 120 kW', 120, 8.0, 0.65, '⚡'], uc: ['DC อัลตร้า 360 kW', 360, 9.5, 0.5, '⚡⚡'] };
  const mult = () => { try { return RL.st().fuel || 1; } catch (e) { return 1; } };
  const price = g => Math.round(GR[g][1] * mult() * 100) / 100;
  // what every car takes: engine, accepted grades, tank (litres) and km per litre (the burn rate follows from these)
  const DSL = { pickup: [70, 12], truck: [100, 7], 'truck-flat': [100, 7], delivery: [100, 7], 'delivery-flat': [100, 7], 'garbage-truck': [150, 2.5], tractor: [80, 3], 'tractor-shovel': [80, 3], van: [70, 10] };
  const GASK = { sedan: [45, 14], taxi: [50, 12], 'hatchback-sports': [40, 16], suv: [60, 10], sports: [50, 7], 'sedan-sports': [55, 9], 'suv-luxury': [70, 8], race: [60, 5], 'race-future': [60, 5], kart: [8, 40] };
  const PREM = { sports: 1, 'sedan-sports': 1, 'suv-luxury': 1, race: 1, 'race-future': 1 };
  const specOf = type => {
    const c = CARS[type] || {}, k = (c.k || c.kind || '').replace(/^kart.*/, 'kart');
    if (c.ev) return { kind: 'ev', icon: '🔌', label: 'ไฟฟ้า (ชาร์จที่จุดชาร์จ EV)', grades: [], kwh: (c.range || 300) * (type === 'ev_super' ? 0.2 : 0.16) };
    const dsl = DSL[k] || DSL[c.kind];
    if (dsl) return { kind: 'dsl', icon: '⛽', label: 'ดีเซล B7', grades: ['dsl'], tank: dsl[0], kmpl: dsl[1] };
    const g = GASK[k] || GASK[c.kind] || [45, 14];
    return { kind: 'gas', icon: '⛽', label: PREM[k] ? 'เบนซิน แก๊สโซฮอล์ 95 เท่านั้น' : 'เบนซิน แก๊สโซฮอล์ 95 / 91 / E20', grades: PREM[k] ? ['g95'] : ['g95', 'g91', 'e20'], tank: g[0], kmpl: g[1] };
  };
  const dieselCar = d => specOf(d.type).kind === 'dsl';
  const tankL = d => specOf(d.type).tank || 45;
  // % of the tank per game metre: 0.012 is the original burn of a 45 L / 14 km/L car
  const burnOf = d => { const sp = specOf(d.type); return sp.tank ? 0.012 * 630 / (sp.tank * sp.kmpl) : 0.012; };
  const rangeKm = d => { const sp = specOf(d.type); if (sp.kind === 'ev') return d.fuel / (0.012 * 280 / ((CARS[d.type].range) || 300)) / 100; return d.fuel / (burnOf(d) * 100); };
  const fuelLine = type => { const sp = specOf(type); if (sp.kind === 'ev') return `🔌 ไฟฟ้า · แบต ~${sp.kwh.toFixed(0)} kWh · ชาร์จที่จุดชาร์จ EV`; return `⛽ ${sp.label} · ถัง ${sp.tank} ลิตร`; };
  const battKwh = d => specOf(d.type).kwh;
  const f2 = n => (Math.round(n * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const stations = [];

  // ---------- picking a free spot ----------
  const rectDist = (px, pz, x, z, hw, hd) => Math.hypot(Math.max(Math.abs(px - x) - hw, 0), Math.max(Math.abs(pz - z) - hd, 0));
  const free = (x, z, hw, hd, A, m = 3.6) => {
    if (A && (x - hw < A.x0 + 3 || x + hw > A.x1 - 3 || z - hd < A.z0 + 3 || z + hd > A.z1 - 3)) return false;
    if (A && Math.hypot(x - A.cx, z - (A.cz + 60)) < hw + 8) return false;          // keep the arrival road clear
    const seen = new Set();
    for (let ix = Math.floor((x - hw - m - 8) / Col.cs); ix <= Math.floor((x + hw + m + 8) / Col.cs); ix++) for (let iz = Math.floor((z - hd - m - 8) / Col.cs); iz <= Math.floor((z + hd + m + 8) / Col.cs); iz++) {
      const a = Col.map.get(Col.key(ix, iz)); if (!a) continue;
      for (const s of a) { if (seen.has(s)) continue; seen.add(s); if (rectDist(s.x, s.z, x, z, hw + m, hd + m) < (s.type === 'c' ? s.r : s.br)) return false; }
    }
    for (const p of World.pois) if (p.x != null && Math.abs(p.x - x) < hw + 3 && Math.abs(p.z - z) < hd + 3) return false;
    for (const t of stations) if (Math.abs(t.x - x) < hw + t.hw + 3 && Math.abs(t.z - z) < hd + t.hd + 3 && t.A === (A || null)) return false;
    if (!A) {
      for (const [dx, dz] of [[0, 0], [hw, hd], [-hw, hd], [hw, -hd], [-hw, -hd]]) if (roadDist(x + dx, z + dz) < 6.5) return false;
      const y0 = World.groundY(x, z); if (y0 < -0.05) return false;
      for (const [dx, dz] of [[hw, hd], [-hw, hd], [hw, -hd], [-hw, -hd]]) { const y = World.groundY(x + dx, z + dz); if (y < -0.05 || Math.abs(y - y0) > 0.7) return false; }
    }
    return true;
  };
  const find = (tx, tz, hw, hd, A) => {
    const c = []; for (let r = 0; r <= 110; r += 4) for (let k = 0; k < (r ? 24 : 1); k++) { const a = k / 24 * Math.PI * 2; c.push([tx + Math.cos(a) * r, tz + Math.sin(a) * r]); }
    for (const m of [3.6, 1.8]) for (const [x, z] of c) if (free(x, z, hw, hd, A, m)) return { x, z };
    return null;
  };

  // ---------- 3D sites ----------
  const board = (title, rows, bg) => {
    const c = U.canvas(384, 64 + rows.length * 46, g => {
      g.fillStyle = bg; g.fillRect(0, 0, 384, 300); g.strokeStyle = '#fff'; g.lineWidth = 6; g.strokeRect(3, 3, 378, 58 + rows.length * 46);
      g.font = '600 28px Kanit, Tahoma, sans-serif'; g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText(title, 192, 32);
      rows.forEach(([l, v], i) => { const y = 78 + i * 46; g.font = '600 24px Kanit, Tahoma, sans-serif'; g.textAlign = 'left'; g.fillStyle = '#fff'; g.fillText(l, 16, y); g.textAlign = 'right'; g.fillStyle = '#ffe082'; g.fillText(v, 368, y); });
    });
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t;
  };
  const rowsPump = () => Object.keys(GR).map(k => [GR[k][0], f2(price(k))]);
  const rowsEv = () => Object.keys(CH).map(k => [CH[k][0], f2(CH[k][2])]);
  const boards = [];

  const buildPump = (g, name) => {
    const red = mc(0xd32f2f, { roughness: 0.4 }), white = mc(0xf5f5f5), dark = mc(0x37474f, { roughness: 0.6 });
    U.mk(g, U.box(18, 0.1, 14, 2), texMat('paving', 0xa9a9a9), [0, 0.05, 0]);
    U.mk(g, GEO.box, white, [0, 4.6, 1], [13, 0.4, 7]); U.mk(g, GEO.box, red, [0, 4.35, 1], [13.1, 0.14, 7.1]);
    for (const x of [-5.5, 5.5]) for (const z of [-1.8, 3.8]) { U.mk(g, GEO.box, white, [x, 2.3, z], [0.35, 4.6, 0.35]); }
    for (const x of [-3, 3]) { U.mk(g, GEO.box, mc(0xcfd8dc), [x, 0.12, 1], [1.2, 0.24, 6]); for (const z of [-0.6, 2.6]) { U.mk(g, GEO.box, red, [x, 0.95, z], [0.7, 1.7, 0.5]); U.mk(g, GEO.box, new THREE.MeshBasicMaterial({ color: 0x80deea }), [x, 1.4, z + (z < 1 ? -0.26 : 0.26)], [0.45, 0.3, 0.01]); } }
    U.mk(g, GEO.box, white, [0, 1.6, -6], [9, 3.2, 3.4]); U.mk(g, GEO.box, mc(0x4fc3f7, { roughness: 0.1, metalness: 0.4 }), [0, 1.5, -4.28], [7.4, 1.8, 0.06]); U.mk(g, GEO.box, red, [0, 3.3, -6], [9.2, 0.25, 3.6]);
    const sm = new THREE.MeshStandardMaterial({ map: U.signTex('⛽ ปั๊มน้ำมัน ' + name, { w: 512, h: 96, bg: '#d32f2f' }) }); U.mk(g, new THREE.PlaneGeometry(6, 1.1), sm, [0, 4.35, 4.58]);
    U.mk(g, GEO.cylLo, dark, [8.2, 2.5, 5], [0.12, 5, 0.12]);
    const bd = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6 * (64 + 4 * 46) / 384), new THREE.MeshBasicMaterial({ map: board('ราคาน้ำมันวันนี้', rowsPump(), '#b71c1c'), toneMapped: false })); bd.position.set(8.2, 4.6, 5.1); g.add(bd); boards.push({ m: bd, f: () => board('ราคาน้ำมันวันนี้', rowsPump(), '#b71c1c') });
  };
  const buildEv = (g, name) => {
    const green = mc(0x00a152, { roughness: 0.4 }), white = mc(0xf5f5f5), dark = mc(0x263238, { roughness: 0.4 });
    U.mk(g, U.box(16, 0.1, 12, 2), texMat('paving', 0x6f7478), [0, 0.05, 0]);
    U.mk(g, GEO.box, mc(0x1b3a5c, { roughness: 0.2, metalness: 0.5 }), [0, 4.2, -0.5], [12, 0.2, 6]); U.mk(g, GEO.box, green, [0, 4.0, -0.5], [12.1, 0.14, 6.1]);
    for (const x of [-5.6, 5.6]) U.mk(g, GEO.box, white, [x, 2.1, -3], [0.3, 4.2, 0.3]);
    for (let i = 0; i < 4; i++) {
      const x = -4.5 + i * 3; U.mk(g, GEO.box, dark, [x, 0.9, -3], [0.55, 1.8, 0.4]); U.mk(g, GEO.box, new THREE.MeshBasicMaterial({ color: 0x00e5ff, toneMapped: false }), [x, 1.4, -2.78], [0.4, 0.3, 0.02]); U.mk(g, GEO.box, green, [x, 1.85, -3], [0.62, 0.1, 0.46]);
      for (const s of [-1, 1]) U.mk(g, GEO.box, white, [x + s * 1.4, 0.07, 0.6], [0.1, 0.02, 4.4]);
    }
    U.mk(g, GEO.box, white, [-6, 0.07, 0.6], [0.1, 0.02, 4.4]);
    U.mk(g, GEO.box, mc(0xffffff), [0, 0.07, 3.0], [12, 0.02, 0.1]);
    const sm = new THREE.MeshStandardMaterial({ map: U.signTex('⚡ จุดชาร์จ EV ' + name, { w: 512, h: 96, bg: '#00a152' }) }); U.mk(g, new THREE.PlaneGeometry(6, 1.1), sm, [0, 4.25, 2.6]);
    U.mk(g, GEO.cylLo, dark, [-7.2, 2.5, 4], [0.12, 5, 0.12]);
    const bd = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6 * (64 + 3 * 46) / 384), new THREE.MeshBasicMaterial({ map: board('ค่าไฟชาร์จ ฿/kWh', rowsEv(), '#00695c'), toneMapped: false })); bd.position.set(-7.2, 4.4, 4.1); g.add(bd);
  };

  // ---------- placing ----------
  const place = (kind, name, tx, tz, A) => {
    const hw = kind === 'pump' ? 9 : 8, hd = kind === 'pump' ? 8 : 7, p = find(tx, tz, hw, hd, A);
    if (!p) { console.warn('v53 no room for', kind, name); return null; }
    const par = A ? A.g : World.outdoor, g = new THREE.Group(), y = A ? 0 : World.groundY(p.x, p.z);
    g.position.set(p.x, y, p.z); par.add(g);
    if (kind === 'pump') buildPump(g, name); else buildEv(g, name);
    if (!A) World.clearNear(p.x, p.z, 9, true);
    if (kind === 'pump') { Col.box(p.x, p.z - 6, 4.6, 1.8); for (const x of [-3, 3]) Col.box(p.x + x, p.z + 1, 0.8, 2.8); for (const x of [-5.5, 5.5]) for (const z of [-1.8, 3.8]) Col.circle(p.x + x, p.z + z, 0.35); }
    else { for (let i = 0; i < 4; i++) Col.circle(p.x - 4.5 + i * 3, p.z - 3, 0.45); for (const x of [-5.6, 5.6]) Col.circle(p.x + x, p.z - 3, 0.3); }
    const st = { kind, name, x: p.x, z: p.z, hw, hd, A: A || null };
    const label = kind === 'pump' ? 'ปั๊มน้ำมัน ' + name : 'จุดชาร์จ EV ' + name, icon = kind === 'pump' ? '⛽' : '⚡';
    World.pois.push({ kind: 'act', x: p.x, z: p.z + (kind === 'pump' ? 4.6 : 3.6), r: 6.5, label, icon, map: !A, act: () => (A && G.away !== A) ? null : ({ icon, label: kind === 'pump' ? 'เติมน้ำมัน (เลือกชนิด / ดูราคาวันนี้)' : 'ชาร์จรถ EV (เลือกหัวชาร์จ / ดูราคา)', fn: () => open(st) }) });
    stations.push(st); return st;
  };

  // ---------- menus ----------
  const carAt = st => {
    const list = G.cars.filter(o => o.d && Math.hypot(o.d.x - st.x, o.d.z - st.z) < 18);
    if (G.driving && list.indexOf(G.driving) < 0 && Math.hypot(G.driving.d.x - st.x, G.driving.d.z - st.z) < 18) list.push(G.driving);
    return G.driving && list.indexOf(G.driving) >= 0 ? G.driving : list.sort((a, b) => Math.hypot(a.d.x - st.x, a.d.z - st.z) - Math.hypot(b.d.x - st.x, b.d.z - st.z))[0] || null;
  };
  const F = { st: null, grade: null, ch: 'dc' };
  const open = st => {
    F.st = st; F.grade = null;
    UI.open((st.kind === 'pump' ? '⛽ ' : '⚡ ') + (st.kind === 'pump' ? 'ปั๊มน้ำมัน ' : 'จุดชาร์จ EV ') + st.name, null, () => st.kind === 'pump' ? htmlPump(st) : htmlEv(st));
  };
  const htmlPump = st => {
    const c = carAt(st);
    if (!c) return '<p class="lead">ขับรถมาจอดที่ปั๊มก่อน (ปั๊มนี้ใช้เติมน้ำมันเท่านั้น รถ EV ไปชาร์จที่จุดชาร์จ EV ซึ่งอยู่แยกไปอีกที่)</p>';
    const d = Town2.carState(c.d), cn = CARS[c.d.type];
    if (cn.ev) return `<div class="card"><div class="ci">${cn.i}</div><div class="cb"><h4>${cn.n}</h4><p class="dim">รถไฟฟ้า เติมน้ำมันไม่ได้ ไปที่ "จุดชาร์จ EV" ในเมืองนี้แทน</p></div></div>`;
    const diesel = dieselCar(c.d), sp = specOf(c.d.type), ok = k => sp.grades.includes(k), L = tankL(c.d), need = (100 - d.fuel) / 100 * L;
    const g = F.grade && ok(F.grade) ? F.grade : sp.grades[0], p = price(g);
    return `<div class="card"><div class="ci">${cn.i}</div><div class="cb"><h4>${cn.n}</h4><p class="dim">ถังน้ำมัน ${L} ลิตร · ตอนนี้ ${Math.round(d.fuel)}% (ขาดอีก ${need.toFixed(1)} ลิตร) · ${sp.label} · วิ่งต่อได้ ≈ ${Math.round(rangeKm(d))} กม.</p></div></div>
      <h5>เลือกชนิดน้ำมัน (ราคา ณ วันนี้)</h5><div class="sw small">${Object.keys(GR).map(k => `<button data-a="f53" data-v="grade" data-k="${k}" class="txt ${g === k ? 'on' : ''}" ${ok(k) ? '' : 'disabled style="opacity:.4"'}>${GR[k][0]} ${f2(price(k))} ฿/ล.</button>`).join('')}</div>
      <p class="dim">ราคาอ้างอิงปั๊ม ปตท. 29 ต.ค. 2569 ปรับรายวันตามราคาน้ำมันตลาดโลก (ตอนนี้ ×${mult().toFixed(2)}) · รถคันนี้ใช้ได้เฉพาะ: ${sp.label} (เติมผิดชนิดไม่ได้ ปุ่มที่เทาคือใช้ไม่ได้)</p>
      <div class="row end"><button class="btn" data-a="f53" data-v="fill" data-k="full" ${need < 0.3 ? 'disabled' : ''}>เติมเต็มถัง ≈ ${baht(Math.round(need * p))}</button><button class="btn ghost" data-a="f53" data-v="fill" data-k="20" ${need < 0.3 ? 'disabled' : ''}>20 ลิตร ≈ ${baht(Math.round(Math.min(20, need) * p))}</button><button class="btn ghost" data-a="f53" data-v="fill" data-k="500" ${need < 0.3 ? 'disabled' : ''}>เติม 500 ฿</button></div>`;
  };
  const htmlEv = st => {
    const c = carAt(st);
    if (!c) return '<p class="lead">ขับรถ EV มาจอดที่ช่องจอดหน้าตู้ชาร์จก่อน (จุดนี้ชาร์จไฟฟ้าอย่างเดียว ไม่มีน้ำมัน รถน้ำมันไปที่ปั๊มซึ่งอยู่แยกกัน)</p>';
    const d = Town2.carState(c.d), cn = CARS[c.d.type];
    if (!cn.ev) return `<div class="card"><div class="ci">${cn.i}</div><div class="cb"><h4>${cn.n}</h4><p class="dim">รถน้ำมัน ชาร์จไฟไม่ได้ ไปเติมที่ "ปั๊มน้ำมัน" ในเมืองนี้แทน</p></div></div>`;
    const kwh = battKwh(c.d), ch = CH[F.ch] || CH.dc;
    const info = pct => { const need = Math.max(0, pct - d.fuel) / 100 * kwh, cost = Math.round(need * ch[2]), min = Math.ceil(need / (ch[1] * ch[3]) * 60); return { need, cost, min }; };
    const a = info(80), b = info(100), tm = m => m >= 60 ? `${Math.floor(m / 60)} ชม. ${m % 60} น.` : `${m} นาที`;
    return `<div class="card"><div class="ci">${cn.i}</div><div class="cb"><h4>${cn.n}</h4><p class="dim">แบตเตอรี่ ~${kwh.toFixed(0)} kWh · ตอนนี้ ${Math.round(d.fuel)}% · วิ่งต่อได้ ≈ ${Math.round(rangeKm(d))} กม.</p></div></div>
      <h5>เลือกหัวชาร์จ (ค่าไฟ ณ วันนี้)</h5><div class="sw small">${Object.keys(CH).map(k => `<button data-a="f53" data-v="ch" data-k="${k}" class="txt ${F.ch === k ? 'on' : ''}">${CH[k][4]} ${CH[k][0]} · ${f2(CH[k][2])} ฿/kWh</button>`).join('')}</div>
      <p class="dim">ราคาตามตลาดชาร์จสาธารณะในไทย (AC ~6.5 · DC ~8 · อัลตร้าเร็ว ~9.5 ฿/kWh) เทียบเท่า ~${(0.16 * ch[2]).toFixed(2)} ฿/กม.</p>
      <div class="row end"><button class="btn" data-a="f53" data-v="chg" data-k="80" ${a.need < 0.2 ? 'disabled' : ''}>ถึง 80% · ${baht(a.cost)} · ${tm(a.min)}</button><button class="btn ghost" data-a="f53" data-v="chg" data-k="100" ${b.need < 0.2 ? 'disabled' : ''}>เต็ม 100% · ${baht(b.cost)} · ${tm(b.min)}</button></div>`;
  };
  UI.H.f53 = d => {
    const st = F.st; if (!st) return;
    if (d.v === 'grade') { F.grade = d.k; return; }
    if (d.v === 'ch') { F.ch = d.k; return; }
    const c = carAt(st); if (!c) { UI.toast('ขับรถมาจอดใกล้ ๆ ก่อน', '🚗'); return; }
    const dd = Town2.carState(c.d);
    if (d.v === 'fill') {
      if (CARS[c.d.type].ev) return;
      const sp = specOf(c.d.type), g = F.grade && sp.grades.includes(F.grade) ? F.grade : sp.grades[0], p = price(g), L = tankL(c.d), need = (100 - dd.fuel) / 100 * L;
      const lit = d.k === 'full' ? need : d.k === '20' ? Math.min(20, need) : Math.min(need, 500 / p), cost = Math.round(lit * p);
      if (lit < 0.1) { UI.toast('น้ำมันเต็มถังแล้ว', '⛽'); return; }
      if (S.money < cost) { UI.toast(`ต้องใช้ ${baht(cost)}`, '💸'); return; }
      S.money -= cost; dd.fuel = Math.min(100, dd.fuel + lit / L * 100); try { Bank2.log('เติมน้ำมัน ' + GR[g][0], -cost); } catch (e) { } Sfx.water();
      UI.toast(`เติม ${GR[g][0]} ${lit.toFixed(1)} ลิตร × ${f2(p)} = ${baht(cost)}`, '⛽');
    } else if (d.v === 'chg') {
      if (!CARS[c.d.type].ev) return;
      const ch = CH[F.ch] || CH.dc, target = +d.k, need = Math.max(0, target - dd.fuel) / 100 * battKwh(c.d), cost = Math.round(need * ch[2]), min = Math.ceil(need / (ch[1] * ch[3]) * 60);
      if (need < 0.2) { UI.toast('แบตเต็มแล้ว', '🔋'); return; }
      if (S.money < cost) { UI.toast(`ต้องใช้ ${baht(cost)}`, '💸'); return; }
      S.money -= cost; try { Bank2.log('ชาร์จรถ EV ' + ch[0], -cost); } catch (e) { }
      UI.close(); fade(() => { tick(Math.max(5, min)); dd.fuel = target; UI.toast(`ชาร์จถึง ${target}% (${need.toFixed(1)} kWh × ${f2(ch[2])} = ${baht(cost)})`, '⚡'); });
    }
  };

  // ---------- build every site ----------
  // main map: the village station stays where it was; the old EV post next to it is gone (hitech.js) and has its own site
  const gasPoi = World.pois.find(p => p.kind === 'act' && p.label === 'ปั๊มน้ำมัน');
  if (gasPoi) {
    const gst = { kind: 'pump', name: 'ปั๊มสุขใจ', x: GAS.x, z: GAS.z, hw: 6, hd: 5, A: null }; stations.push(gst);
    gasPoi.act = () => ({ icon: '⛽', label: 'เติมน้ำมัน (เลือกชนิด / ดูราคาวันนี้)', fn: () => open(gst) });
    gasPoi.r = 7;
  }
  place('ev', 'หมู่บ้านสุขใจ', GAS.x + 40, GAS.z - 40, null);
  place('pump', 'ทุ่งทอง', 140, -232, null); place('ev', 'ทุ่งทอง', 195, -232, null);
  place('pump', 'ภูผาใหม่', -135, -430, null); place('ev', 'ภูผาใหม่', -72, -430, null);
  place('pump', 'เมืองริมทะเล', 315, -335, null); place('ev', 'เมืองริมทะเล', 400, -335, null);

  // far towns are built on the first visit: add the two sites when you arrive
  const OFF = { large: [[-22, 72], [22, 72]], medium: [[-38, 54], [38, 54]], small: [[-30, 46], [30, 46]], old: [[-30, 48], [32, 48]] };
  const watch = () => {
    const A = G.away; if (!A || A._f53 || !A.g) return; A._f53 = 1;
    let key = null; for (const k in Town2.areas) if (Town2.areas[k] === A) key = k;
    const o = OFF[A.size] || OFF.old, nm = A.n.replace(/ \(.*\)$/, '');
    place('pump', nm, A.cx + o[0][0], A.cz + o[0][1], A); place('ev', nm, A.cx + o[1][0], A.cz + o[1][1], A);
    try { Collide.scan && 0; } catch (e) { }
  };
  setInterval(() => { try { watch(); } catch (e) { console.warn('v53', e); } }, 600);
  // refresh the price boards when the day changes
  let lastDay = S && S.day;
  setInterval(() => { try { if (S && S.day !== lastDay) { lastDay = S.day; for (const b of boards) { b.m.material.map = b.f(); b.m.material.needsUpdate = true; } } } catch (e) { } }, 2000);
  // ---------- where you can see it ----------
  // 1) the shop card of every car says what it takes
  const _en = UI.entry.bind(UI);
  UI.entry = function (key, shop) { const e = _en(key, shop); try { if (e && /^car:/.test(key) && CARS[key.slice(4)] && !/เชื้อเพลิง/.test(e.desc || '')) e.desc = (e.desc || '') + ' · เชื้อเพลิง: ' + fuelLine(key.slice(4)).replace(/^[^ ]+ /, ''); } catch (x) { } return e; };
  // 2) the speed bar shows the fuel type, the % left and how far it will go
  const _hud = UI.hud.bind(UI);
  UI.hud = function () {
    const r = _hud();
    try { if (G.driving) { const d = Town2.carState(G.driving.d), sp = specOf(G.driving.d.type); $('speed').textContent = `${Math.round(Math.abs(G.driving.speed) * 3.6)} กม./ชม. · ${sp.kind === 'ev' ? '🔋' : '⛽'}${sp.kind === 'ev' ? 'ไฟฟ้า' : sp.kind === 'dsl' ? 'ดีเซล' : 'เบนซิน'} ${Math.round(d.fuel)}% (≈${Math.round(rangeKm(d))} กม.) · 🛠️${Math.round(d.cond)}%`; } } catch (x) { }
    return r;
  };
  // 3) every type of car burns by its own tank and km/L; a low-fuel warning names the nearest site that sells what the car needs
  const _drive = Town2.drive.bind(Town2);
  Town2.drive = function (c, dist, hit, dt) {
    const d = c.d, ev = isEV(d), f0 = d.fuel == null ? 100 : d.fuel;
    const r = _drive(c, dist, hit, dt);
    if (!ev) d.fuel = Math.max(0, f0 - dist * burnOf(d));
    if (d.fuel < 15 && d.fuel > 0 && !d._low53) {
      d._low53 = 1; const want = ev ? 'ev' : 'pump', here = G.away ? s => s.A === G.away : s => !s.A;
      const near = stations.filter(s => s.kind === want && here(s)).sort((a, b) => Math.hypot(a.x - d.x, a.z - d.z) - Math.hypot(b.x - d.x, b.z - d.z))[0];
      UI.toast(`${ev ? 'แบตใกล้หมด' : 'น้ำมันใกล้หมด'} เหลือ ${Math.round(d.fuel)}%` + (near ? ` · ${near.kind === 'pump' ? 'ปั๊ม' : 'จุดชาร์จ'}ใกล้สุด: ${near.name} ห่าง ~${Math.round(Math.hypot(near.x - d.x, near.z - d.z))} ม.` : ''), '⚠️');
    }
    if (d.fuel >= 30) d._low53 = 0;
    return r;
  };
  window.Fuel53 = { specOf, fuelLine, rangeKm, price, GR, CH, stations, open, place, find, free };
});
