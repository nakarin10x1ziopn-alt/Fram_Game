// v56_lights.js: farm lighting. 10 kinds of lamp (pole, wall, flood, bollard, stake, string) in three families: ordinary (incandescent/halogen),
// LED and solar. Sold at the farm and hardware shops, placed freely anywhere on your own farm, and really lit: the nearest lamps cast a real
// light on the ground, every lamp paints a pool of light. Each lamp has its own brightness, colour, schedule; solar lamps run on a battery
// that charges in the sun, mains lamps use the house electricity (and stop in a power cut).
V23.add('v56_lights', () => {
  const E = s => (typeof esc === 'function' ? esc(s) : String(s));
  const baht0 = n => '฿' + Math.round(n).toLocaleString('en-US');
  const FAM = { inc: ['🔌', 'ไฟธรรมดา'], led: ['💡', 'LED'], solar: ['☀️', 'โซล่าเซลล์'] };
  const KELVIN = [['🔥', 'อุ่น 2700K', 0xffb46b], ['🌤️', 'ขาวนวล 4000K', 0xfff0d6], ['❄️', 'ขาวเย็น 6500K', 0xdbe6ff]];
  const MODE = { auto: ['🌙', 'อัตโนมัติ (พลบค่ำ→รุ่งเช้า)'], on: ['🟢', 'เปิดตลอด'], off: ['⚫', 'ปิด'], timer: ['⏰', 'ตั้งเวลา'] };
  // w = watts at full brightness, lm = light output, r = how far the light reaches (m), h = bulb height
  const T = {
    inc_pole: { n: 'เสาไฟสนาม หลอดไส้ธรรมดา', i: '🏮', fam: 'inc', mount: 'pole', w: 100, lm: 1500, r: 9, h: 4.2, price: 1800, k: 0, desc: 'ไฟธรรมดาแสงส้มอุ่น กินไฟ 100W สว่างพอเดินในไร่' },
    led_pole: { n: 'เสาไฟ LED สว่างจ้า 60W', i: '💡', fam: 'led', mount: 'pole', w: 60, lm: 7000, r: 17, h: 5, price: 3900, k: 1, desc: 'LED สว่างมาก ไกล 17 ม. ประหยัดกว่าหลอดไส้หลายเท่า' },
    solar_pole: { n: 'เสาไฟโซล่าเซลล์ 30W', i: '☀️', fam: 'solar', mount: 'pole', w: 30, lm: 3200, r: 12, h: 4.6, price: 5500, k: 2, desc: 'ไม่ใช้ไฟบ้าน ชาร์จแบตตอนกลางวัน ติดตั้งตรงไหนก็ได้' },
    inc_wall: { n: 'ไฟติดผนังฮาโลเจน 50W', i: '🔆', fam: 'inc', mount: 'wall', w: 50, lm: 900, r: 6, h: 2.5, price: 790, k: 0, desc: 'ไฟติดผนัง/ติดเสาเตี้ย แสงอุ่น' },
    led_wall: { n: 'ไฟติดผนัง LED 15W', i: '💡', fam: 'led', mount: 'wall', w: 15, lm: 1900, r: 8, h: 2.5, price: 690, k: 1, desc: 'ไฟติดผนัง LED ประหยัดไฟ สว่างกว่าฮาโลเจน' },
    solar_wall: { n: 'ไฟติดผนังโซล่าเซลล์ 10W', i: '🌤️', fam: 'solar', mount: 'wall', w: 10, lm: 1100, r: 6, h: 2.4, price: 990, k: 2, desc: 'ติดผนังไม่ต้องเดินสาย ชาร์จด้วยแผงเล็กในตัว' },
    led_flood: { n: 'สปอตไลท์ฟลัดไลท์ LED 150W', i: '🔦', fam: 'led', mount: 'flood', w: 150, lm: 16000, r: 26, h: 2.2, price: 4800, k: 2, desc: 'สว่างที่สุด ส่องไกล 26 ม. เหมาะลานโรงเรือน/คอกสัตว์' },
    led_bollard: { n: 'ไฟสนามเตี้ย LED 8W', i: '🕯️', fam: 'led', mount: 'bollard', w: 8, lm: 500, r: 4, h: 0.7, price: 590, k: 1, desc: 'ไฟเตี้ยริมทางเดิน ส่องพื้นนุ่ม ๆ' },
    solar_stake: { n: 'โคมไฟโซล่าปักดิน 3W', i: '🌞', fam: 'solar', mount: 'stake', w: 3, lm: 250, r: 3.2, h: 0.55, price: 290, k: 0, desc: 'ปักดินริมแปลง ราคาถูก ใช้แบตเตอรี่ในตัว' },
    led_string: { n: 'ไฟสายประดับ LED 20W (ยาว 6 ม.)', i: '🎄', fam: 'led', mount: 'string', w: 20, lm: 1500, r: 8, h: 2.5, price: 1200, k: 0, desc: 'สายไฟประดับระหว่างเสา 2 ต้น แสงอุ่น สวยตอนกลางคืน' },
  };
  for (const k in T) ITEMS['light_' + k] = { n: T[k].n, i: T[k].i, cat: 'part', sell: Math.round(T[k].price * 0.5) };
  ENTRY_KINDS.light = id => { const t = T[id]; return { icon: t.i, name: t.n, desc: `${FAM[t.fam][0]} ${FAM[t.fam][1]} · ${t.w}W · สว่าง ${t.lm} ลูเมน ไกล ${t.r} ม. · ${t.desc} · วางที่ไหนก็ได้ในไร่ ปรับความสว่างได้`, price: t.price, multi: true, own: count('light_' + id), buy: q => addItem('light_' + id, q || 1) }; };
  const shopTab = { n: '💡 ไฟส่องสว่าง (10 แบบ)', items: Object.keys(T).map(k => 'light:' + k) };
  const addTabs = () => { for (const id in SHOPS) { const sh = SHOPS[id]; if (!sh.tabs || sh.tabs.some(t => t === shopTab)) continue; if (id === 'farmshop' || id === 'carpenter' || /วัสดุก่อสร้าง|อุปกรณ์ฟาร์ม|เกษตร/.test(sh.n || '')) sh.tabs.push(shopTab); } };
  addTabs();

  // ---------- state ----------
  const st = () => { const s = (S.lt = S.lt || {}); s.lights = s.lights || []; s.n = s.n || 0; s.g = s.g || { dusk: 18, dawn: 6, save: 0 }; s.last = s.last == null ? null : s.last; return s; };
  const hourOf = () => S.time / 60;
  const gridUp = () => { try { return !(Grid.st().src === 'none') && !(Power.st().out > 0); } catch (e) { return true; } };
  const inDark = (h, g) => g.dusk > g.dawn ? (h >= g.dusk || h < g.dawn) : (h >= g.dusk && h < g.dawn);
  const wantOn = (L, h) => { const g = st().g; if (L.mode === 'on') return true; if (L.mode === 'off') return false; if (L.mode === 'timer') return L.from > L.to ? (h >= L.from || h < L.to) : (h >= L.from && h < L.to); return inDark(h, g); };
  const brAt = (L, h) => (L.br / 100) * (st().g.save && h >= 0 && h < 4 ? 0.5 : 1);
  // actual state at hour h: { on, why, br }
  function state(L, h) {
    const t = T[L.t], want = wantOn(L, h), br = brAt(L, h);
    if (!want) return { on: false, why: L.mode === 'off' ? 'ปิดอยู่' : 'รอถึงเวลาเปิด', br: 0 };
    if (t.fam === 'solar') return (L.batt || 0) > 1 ? { on: true, br, why: 'สว่าง' } : { on: false, why: 'แบตหมด รอชาร์จตอนกลางวัน', br: 0 };
    return gridUp() ? { on: true, br, why: 'สว่าง' } : { on: false, why: 'ไฟฟ้าดับ', br: 0 };
  }
  const now = L => state(L, hourOf());

  // ---------- 3D ----------
  const group = new THREE.Group(); group.name = 'v56lights';
  const cols = [], pois = [];
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 2, 64, 64, 62); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; })();
  const metal = mc(0x5d646b, { roughness: 0.5, metalness: 0.6 }), dark = mc(0x2b2f33, { roughness: 0.7 }), white = mc(0xeceff1, { roughness: 0.4 }), panelM = mc(0x1b2a4a, { roughness: 0.2, metalness: 0.6 });
  const mk = (p, geo, m, pos, scl, rot) => { const o = U.mk(p, geo, m, pos, scl, rot); o.castShadow = true; return o; };
  function model(L) {
    const t = T[L.t], g = new THREE.Group(), bulb = new THREE.MeshBasicMaterial({ color: 0xfff6dc, toneMapped: false });
    g.userData.bulb = bulb; g.userData.bulbs = [bulb];
    const panel = (x, y, z, w, d, tilt) => { const p = mk(g, GEO.box, panelM, [x, y, z], [w, 0.04, d]); p.rotation.x = tilt || -0.5; };
    if (t.mount === 'pole') {
      mk(g, GEO.cyl, metal, [0, t.h / 2, 0], [0.07, t.h, 0.07]); mk(g, GEO.cyl, metal, [0, 0.12, 0], [0.16, 0.24, 0.16]); mk(g, GEO.box, metal, [0.35, t.h - 0.05, 0], [0.8, 0.06, 0.06]);
      mk(g, GEO.box, dark, [0.7, t.h - 0.02, 0], [0.5, 0.08, 0.28]); mk(g, GEO.sphLo, bulb, [0.7, t.h - 0.12, 0], t.fam === 'led' ? [0.2, 0.05, 0.12] : 0.09);
      if (t.fam === 'solar') panel(-0.2, t.h + 0.2, 0, 0.9, 0.55, -0.45);
    } else if (t.mount === 'wall') {
      mk(g, GEO.cyl, metal, [0, 1.25, 0], [0.06, 2.5, 0.06]); mk(g, GEO.box, white, [0, 1.6, 0.07], [0.32, 0.55, 0.04]);
      mk(g, GEO.box, metal, [0, t.h - 0.05, 0.22], [0.05, 0.05, 0.4]); mk(g, GEO.cyl, dark, [0, t.h - 0.02, 0.4], [0.17, 0.12, 0.17]); mk(g, GEO.sphLo, bulb, [0, t.h - 0.1, 0.4], 0.1);
      if (t.fam === 'solar') panel(0, t.h + 0.25, 0.1, 0.4, 0.3, -0.7);
    } else if (t.mount === 'flood') {
      for (const s of [-1, 1]) mk(g, GEO.cyl, metal, [s * 0.35, 0.55, 0], [0.04, 1.1, 0.04], [0, 0, s * 0.2]);
      mk(g, GEO.cyl, metal, [0, 1.1, 0], [0.04, 0.9, 0.04], [0, 0, Math.PI / 2]); const head = new THREE.Group(); head.position.set(0, 1.5, 0.05); head.rotation.x = 0.45; g.add(head);
      mk(head, GEO.box, dark, [0, 0, 0], [0.7, 0.5, 0.18]); mk(head, GEO.box, bulb, [0, 0, 0.1], [0.62, 0.42, 0.02]);
    } else if (t.mount === 'bollard') {
      mk(g, GEO.cyl, metal, [0, 0.33, 0], [0.1, 0.66, 0.1]); mk(g, GEO.cyl, bulb, [0, 0.52, 0], [0.105, 0.08, 0.105]); mk(g, GEO.cyl, dark, [0, 0.68, 0], [0.12, 0.06, 0.12]);
    } else if (t.mount === 'stake') {
      mk(g, GEO.cyl, dark, [0, 0.2, 0], [0.025, 0.4, 0.025]); mk(g, GEO.cyl, white, [0, 0.48, 0], [0.07, 0.14, 0.07]); mk(g, GEO.sphLo, bulb, [0, 0.52, 0], 0.075); panel(0, 0.6, 0, 0.14, 0.14, 0);
    } else {   // string: two posts and a sagging string of bulbs
      const half = 3, bulbs = [];
      for (const s of [-1, 1]) mk(g, GEO.cyl, metal, [s * half, 1.35, 0], [0.05, 2.7, 0.05]);
      for (let i = 0; i <= 12; i++) { const u = i / 12, x = -half + u * 2 * half, y = 2.6 - Math.sin(u * Math.PI) * 0.5; if (i % 2 === 0) { const b = new THREE.MeshBasicMaterial({ color: 0xfff0c8, toneMapped: false }); g.userData.bulbs.push(b); mk(g, GEO.sphLo, b, [x, y - 0.06, 0], 0.07); } mk(g, GEO.box, dark, [x, y, 0], [2 * half / 12 + 0.02, 0.015, 0.015]); }
    }
    return g;
  }
  const bulbPos = L => { const t = T[L.t]; const c = Math.cos(L.rot || 0), s = Math.sin(L.rot || 0); const off = t.mount === 'pole' ? 0.7 : t.mount === 'wall' ? 0.4 : t.mount === 'flood' ? 0.15 : 0; return { x: L.x + c * off, z: L.z - s * off, y: World.groundY(L.x, L.z) + t.h }; };
  function rebuild() {
    try {
      if (group.parent) group.parent.remove(group);
      while (group.children.length) group.remove(group.children[0]);
      for (const c of cols.splice(0)) { try { Col.remove(c); } catch (e) { } }
      for (const p of pois.splice(0)) { const i = World.pois.indexOf(p); if (i >= 0) World.pois.splice(i, 1); }
      World.outdoor.add(group);
      for (const L of st().lights) {
        const t = T[L.t]; if (!t) continue;
        const m = model(L); m.position.set(L.x, World.groundY(L.x, L.z), L.z); m.rotation.y = L.rot || 0; group.add(m); L._m = m;
        // pool of light on the ground and a halo around the bulb (both additive, so they only show where it is dark)
        const pool = new THREE.Mesh(new THREE.CircleGeometry(t.r, 28), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, opacity: 0 }));
        pool.rotation.x = -Math.PI / 2; pool.position.set(L.mx != null ? L.mx : L.x, World.groundY(L.x, L.z) + 0.07, L.z); group.add(pool); L._pool = pool;
        const hp = bulbPos(L), halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, opacity: 0 })); halo.position.set(hp.x, hp.y, hp.z); halo.scale.set(1.6, 1.6, 1); group.add(halo); L._halo = halo;
        if (t.mount !== 'stake' && t.mount !== 'string') cols.push(Col.circle(L.x, L.z, 0.22));
        const p = { kind: 'act', x: L.x, z: L.z, r: 2.4, label: `${t.i} ${t.n} #${L.id}`, icon: t.i, lt56: 1, act: () => ({ icon: '💡', label: `ปรับไฟ #${L.id}`, fn: () => openApp(0, L.id) }) }; World.pois.push(p); pois.push(p);
      }
      refresh(true);
    } catch (e) { console.warn('v56 rebuild', e); }
  }

  // ---------- real light: a fixed pool of lights follows the nearest lit lamps (constant count = no shader recompiles) ----------
  const N_POOL = (G.Q && G.Q.lvl === 'low') ? 2 : 5, rl = [];
  for (let i = 0; i < N_POOL; i++) { const l = new THREE.PointLight(0xffe4c0, 0, 20, 1.7); G.scene.add(l); rl.push(l); }
  function refresh(force) {
    const h = hourOf(), night = G.inside ? 0 : (G.night || 0), f = G.focus || G.player.pos, lit = [];
    for (const L of st().lights) {
      if (!L._pool) continue; const t = T[L.t], s = state(L, h), kc = KELVIN[L.k != null ? L.k : t.k][2], on = s.on;
      const day = 0.12 + 0.88 * night, a = on ? s.br * day : 0;
      L._pool.material.opacity = Math.min(0.24, a * 0.2 * (t.mount === 'flood' ? 1.15 : 1)); L._pool.material.color.setHex(kc); L._pool.visible = a > 0.01 && !G.inside;
      L._halo.material.opacity = Math.min(1, a * 0.9); L._halo.material.color.setHex(kc); L._halo.visible = a > 0.01 && !G.inside; const hs = (0.8 + Math.min(1.6, t.lm / 4000)) * (0.7 + 0.5 * s.br); L._halo.scale.set(hs, hs, 1);
      if (L._m) for (const b of L._m.userData.bulbs) { b.color.setHex(on ? kc : 0x6a6f74); b.color.multiplyScalar(on ? 0.5 + 0.5 * s.br : 1); }
      if (on && !G.inside) lit.push({ L, d: (L.x - f.x) ** 2 + (L.z - f.z) ** 2, s, kc, t });
    }
    lit.sort((a, b) => a.d - b.d);
    rl.forEach((l, i) => {
      const x = lit[i]; if (!x || x.d > 90 * 90) { l.intensity = 0; return; }
      const p = bulbPos(x.L); l.position.set(p.x, p.y, p.z); l.color.setHex(x.kc);
      l.intensity = Math.max(0.45, Math.min(4.5, 0.5 + x.t.lm / 3400)) * x.s.br * (0.3 + 0.7 * night); l.distance = x.t.r * (1.2 + 0.4 * x.s.br);
    });
  }
  setInterval(() => { try { refresh(); } catch (e) { } }, 250);

  // ---------- energy: mains lamps load the house meter; solar batteries charge in the sun and drain when lit ----------
  Power.extra.push(h => { let kw = 0; for (const L of st().lights) { const t = T[L.t]; if (!t || t.fam === 'solar') continue; const s = state(L, h); if (s.on) kw += t.w / 1000 * s.br; } return kw; });
  const absMin = () => S.day * 1440 + S.time;
  function integrate() {
    const s = st(), a = absMin(); if (s.last == null || a < s.last || a - s.last > 1440 * 3) { s.last = a; return; }
    let m = s.last; s.last = a;
    while (m < a) {
      const dt = Math.min(30, a - m); m += dt; const h = ((m / 60) % 24 + 24) % 24;
      for (const L of s.lights) {
        const t = T[L.t]; if (!t || t.fam !== 'solar') continue; L.batt = L.batt == null ? 60 : L.batt;
        L.batt = Math.min(100, L.batt + (Power.sun(h) > 0 ? Power.sun(h) * 14 * dt / 60 : 0));
        const on = wantOn(L, h) && L.batt > 1; if (on) L.batt = Math.max(0, L.batt - t.w * 0.38 * brAt(L, h) * dt / 60);
      }
    }
  }
  setInterval(() => { try { integrate(); } catch (e) { } }, 500);

  // ---------- placing: free anywhere on your own farm ----------
  const PM = { on: false, k: null, from: null, rot: 0, d: 2.6, ghost: null, ring: null, ok: false, x: 0, z: 0 };
  const farm = () => (typeof ZONES !== 'undefined' && ZONES.find(z => z.id === 'farm')) || { x: 0, z: 2, hw: 80, hd: 68 };
  function okAt(x, z, self) {
    const f = farm(); if (Math.abs(x - f.x) > f.hw - 1 || Math.abs(z - f.z) > f.hd - 1) return 'อยู่นอกเขตไร่ของคุณ';
    try { if (Fish.isWater && Fish.isWater(x, z)) return 'จุดนี้เป็นน้ำ'; } catch (e) { }
    const p = { x, z }; try { if (Col.push(p, 0.3) || Math.hypot(p.x - x, p.z - z) > 0.05) return 'ชนสิ่งก่อสร้าง/ต้นไม้'; } catch (e) { }
    for (const L of st().lights) if (L !== self && Math.hypot(L.x - x, L.z - z) < 0.5) return 'ใกล้ไฟดวงอื่นเกินไป';
    return '';
  }
  const ui = () => { let d = document.getElementById('ltPlace'); if (d) return d; d = document.createElement('div'); d.id = 'ltPlace'; d.hidden = true; d.style.cssText = 'position:fixed;left:50%;bottom:96px;transform:translateX(-50%);z-index:60;background:rgba(22,46,33,.92);border:1px solid rgba(255,255,255,.2);border-radius:16px;padding:10px 12px;max-width:94vw;text-align:center;font-size:14px;color:#f6f3e8';
    d.innerHTML = '<div id="ltMsg" style="margin-bottom:8px"></div><div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center"><button class="btn ghost" data-a="lt56" data-v="rotl">⟲</button><button class="btn ghost" data-a="lt56" data-v="rotr">⟳</button><button class="btn ghost" data-a="lt56" data-v="near">ใกล้</button><button class="btn ghost" data-a="lt56" data-v="far">ไกล</button><button class="btn" data-a="lt56" data-v="put">✅ วางตรงนี้</button><button class="btn ghost" data-a="lt56" data-v="cancel">❌ ยกเลิก</button></div>'; d.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b && UI.H[b.dataset.a]) UI.H[b.dataset.a](b.dataset); }); document.body.appendChild(d); return d; };
  function startPlace(type, from) {
    if (G.inside) { UI.toast('วางไฟได้เฉพาะนอกบ้านในเขตไร่ เดินออกมาข้างนอกก่อน', '🏠'); return; }
    if (!from && !count('light_' + type)) { UI.toast('ไม่มีไฟชนิดนี้ในกระเป๋า ซื้อได้ที่ร้านเกษตร/ร้านวัสดุ', '🛒'); return; }
    UI.close(); stopPlace(true); PM.on = true; PM.k = type; PM.from = from || null; PM.rot = from ? from.rot || 0 : G.player.rot || 0; PM.d = 2.6;
    PM.ghost = model({ t: type, rot: 0 }); PM.ghost.traverse(o => { if (o.material && o.material !== undefined) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.7; } }); G.scene.add(PM.ghost);
    PM.ring = new THREE.Mesh(new THREE.RingGeometry(T[type].r - 0.12, T[type].r, 48), new THREE.MeshBasicMaterial({ color: 0x66ff88, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false })); PM.ring.rotation.x = -Math.PI / 2; G.scene.add(PM.ring);
    ui().hidden = false; tickPlace(); clearInterval(PM.tm); PM.tm = setInterval(tickPlace, 80);
  }
  function tickPlace() {
    if (!PM.on) return; const P = G.player.pos, r = G.player.rot || 0;
    { const dp = window.Drag89 ? Drag89.pos(P.x + Math.sin(r) * PM.d, P.z + Math.cos(r) * PM.d) : { x: P.x + Math.sin(r) * PM.d, z: P.z + Math.cos(r) * PM.d }; PM.x = Math.round(dp.x * 4) / 4; PM.z = Math.round(dp.z * 4) / 4; }
    const why = okAt(PM.x, PM.z, PM.from); PM.ok = !why; const y = World.groundY(PM.x, PM.z);
    PM.ghost.position.set(PM.x, y, PM.z); PM.ghost.rotation.y = PM.rot; PM.ring.position.set(PM.x, y + 0.1, PM.z); PM.ring.material.color.setHex(PM.ok ? 0x66ff88 : 0xff6a5a);
    const m = document.getElementById('ltMsg'); if (m) m.textContent = `${T[PM.k].i} ${T[PM.k].n} · ${PM.ok ? 'วางได้ (วงสีเขียว = ระยะที่แสงถึง)' : '❌ ' + why} · เดินเพื่อเลือกที่ · ห่าง ${PM.d.toFixed(1)} ม.`;
  }
  function stopPlace(silent) { clearInterval(PM.tm); if (PM.ghost) G.scene.remove(PM.ghost); if (PM.ring) G.scene.remove(PM.ring); PM.ghost = PM.ring = null; PM.on = false; const d = document.getElementById('ltPlace'); if (d) d.hidden = true; }
  function put() {
    if (!PM.on) return; if (!PM.ok) { UI.toast('วางตรงนี้ไม่ได้ ขยับไปที่อื่น (วงสีแดง)', '⚠️'); return; }
    const s = st(), t = T[PM.k];
    if (PM.from) { PM.from.x = PM.x; PM.from.z = PM.z; PM.from.rot = PM.rot; }
    else { if (!takeItem('light_' + PM.k)) return; s.lights.push({ id: ++s.n, t: PM.k, x: PM.x, z: PM.z, rot: PM.rot, mode: 'auto', br: 80, k: t.k, from: 18, to: 6, batt: 60, at: S.day }); }
    UI.toast(`${t.i} ${PM.from ? 'ย้าย' : 'วาง'}${t.n} แล้ว · ตั้งค่าความสว่างได้ในแอป 💡`, '💡'); stopPlace(); rebuild(); try { Sfx.coin(); } catch (e) { }
    if (s.lights.length && !(S.v56tip)) { S.v56tip = 1; setTimeout(() => UI.toast('เปิดแอป "ไฟส่องสว่าง" ในมือถือ หรือเดินเข้าใกล้ไฟแล้วกดปุ่มกระทำ เพื่อปรับความสว่าง สี และเวลาเปิด-ปิด', '💡'), 800); }
  }

  // ---------- the phone app ----------
  const A = { tab: 0, focus: null };
  const dirs = ['เหนือ', 'ตะวันออกเฉียงเหนือ', 'ตะวันออก', 'ตะวันออกเฉียงใต้', 'ใต้', 'ตะวันตกเฉียงใต้', 'ตะวันตก', 'ตะวันตกเฉียงเหนือ'];
  const where = L => { const me = G.player.pos, dx = L.x - me.x, dz = L.z - me.z, a = Math.atan2(dx, -dz), i = ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8; return `(${Math.round(L.x)}, ${Math.round(L.z)}) · ห่างคุณ ${Math.round(Math.hypot(dx, dz))} ม. ทาง${dirs[i]}`; };
  const hh = h => String(Math.floor(h)).padStart(2, '0') + ':00';
  function card(L) {
    const t = T[L.t], s = now(L), fam = FAM[t.fam], on = s.on, kw = t.fam === 'solar' ? 0 : t.w * (L.br / 100) / 1000;
    const stat = on ? `🟢 สว่าง ${Math.round(s.br * 100)}%` : `⚫ ดับ · ${s.why}`;
    const extra = t.fam === 'solar' ? `🔋 แบต ${Math.round(L.batt || 0)}%` : `⚡ ${Math.round(t.w * L.br / 100)}W (~${(kw * 12).toFixed(1)} หน่วย/คืน)`;
    return `<div class="card" ${A.focus === L.id ? 'style="border-color:#ffcf3f"' : ''}><div class="ci">${t.i}</div><div class="cb"><h4>#${L.id} ${E(t.n)}</h4>
      <p class="dim">${fam[0]} ${fam[1]} · ${stat} · ${extra}</p><p class="dim">📍 ${where(L)}</p>
      <p class="dim" style="margin-bottom:2px">ความสว่าง <b id="ltv${L.id}">${L.br}</b>%</p><input type="range" min="5" max="100" step="5" value="${L.br}" data-lt="br" data-id="${L.id}" style="width:100%">
      <div class="row">${KELVIN.map((k, i) => `<button class="btn ${((L.k != null ? L.k : t.k) === i) ? '' : 'ghost'}" data-a="lt56" data-v="k" data-id="${L.id}" data-n="${i}">${k[0]} ${k[1]}</button>`).join('')}</div>
      <div class="row">${Object.keys(MODE).map(m => `<button class="btn ${L.mode === m ? '' : 'ghost'}" data-a="lt56" data-v="mode" data-id="${L.id}" data-n="${m}">${MODE[m][0]} ${MODE[m][1]}</button>`).join('')}</div>
      ${L.mode === 'timer' ? `<div class="row"><button class="btn ghost" data-a="lt56" data-v="from" data-id="${L.id}" data-n="-1">−</button><span style="align-self:center">เปิด ${hh(L.from)}</span><button class="btn ghost" data-a="lt56" data-v="from" data-id="${L.id}" data-n="1">＋</button><button class="btn ghost" data-a="lt56" data-v="to" data-id="${L.id}" data-n="-1">−</button><span style="align-self:center">ปิด ${hh(L.to)}</span><button class="btn ghost" data-a="lt56" data-v="to" data-id="${L.id}" data-n="1">＋</button></div>` : ''}
      <div class="row"><button class="btn ghost" data-a="lt56" data-v="move" data-id="${L.id}">📍 ย้าย</button><button class="btn ghost" data-a="lt56" data-v="find" data-id="${L.id}">🔦 ชี้ที่ตั้ง</button><button class="btn ghost" data-a="lt56" data-v="pick" data-id="${L.id}">🎒 เก็บเข้ากระเป๋า</button></div></div></div>`;
  }
  function html(tab) {
    const s = st(), g = s.g;
    if (tab === 0) {
      const L = s.lights; if (!L.length) return '<p class="lead">ยังไม่ได้วางไฟ — ซื้อไฟได้ที่ร้านเกษตร/ร้านวัสดุ (แท็บ 💡 ไฟส่องสว่าง) แล้วมาวางที่แท็บ "วางไฟ"</p>';
      const w = L.reduce((t, x) => { const q = T[x.t]; return t + (q.fam === 'solar' ? 0 : q.w * x.br / 100 * (now(x).on ? 1 : 0)); }, 0);
      return `<p class="lead">มีไฟ ${L.length} ดวง · สว่างอยู่ ${L.filter(x => now(x).on).length} ดวง · ใช้ไฟบ้านตอนนี้ ~${Math.round(w)}W · ไฟโซล่า ${L.filter(x => T[x.t].fam === 'solar').length} ดวงไม่เสียค่าไฟ</p><div class="grid">${L.map(card).join('')}</div>`;
    }
    if (tab === 1) {
      const bag = Object.keys(T).filter(k => count('light_' + k) > 0);
      return `<p class="lead">เลือกไฟจากกระเป๋า แล้วเดินไปที่ที่อยากวาง (ภายในไร่ ที่ไหนก็ได้ อิสระ) หมุนและขยับระยะได้ กด ✅ วางตรงนี้</p>` + (bag.length ? `<div class="grid">${bag.map(k => `<div class="card"><div class="ci">${T[k].i}</div><div class="cb"><h4>${E(T[k].n)} ×${count('light_' + k)}</h4><p class="dim">${FAM[T[k].fam][0]} ${FAM[T[k].fam][1]} · ${T[k].w}W · ไกล ${T[k].r} ม.</p><div class="row"><button class="btn" data-a="lt56" data-v="place" data-id="${k}">วางไฟ</button></div></div></div>`).join('')}</div>` : '<p class="dim">ไม่มีไฟในกระเป๋า — ซื้อได้ที่ร้านเกษตรรุ่งเรือง ช่างไม้ หรือร้านวัสดุก่อสร้าง</p>');
    }
    if (tab === 2) {
      const all = s.lights.length, avg = all ? Math.round(s.lights.reduce((t, x) => t + x.br, 0) / all) : 0, sol = s.lights.filter(x => T[x.t].fam === 'solar'), bat = sol.length ? Math.round(sol.reduce((t, x) => t + (x.batt || 0), 0) / sol.length) : 0;
      return `<p class="lead">ตั้งค่ารวมทุกดวง (ไฟ ${all} ดวง · ความสว่างเฉลี่ย ${avg}% · แบตโซล่าเฉลี่ย ${bat}%)</p>
        <p class="dim" style="margin-bottom:2px">ปรับความสว่างทุกดวงพร้อมกัน <b id="ltvg">${avg}</b>%</p><input type="range" min="5" max="100" step="5" value="${avg || 80}" data-lt="all" style="width:100%">
        <div class="row"><button class="btn" data-a="lt56" data-v="allmode" data-n="on">🟢 เปิดทั้งหมด</button><button class="btn ghost" data-a="lt56" data-v="allmode" data-n="off">⚫ ปิดทั้งหมด</button><button class="btn ghost" data-a="lt56" data-v="allmode" data-n="auto">🌙 อัตโนมัติทั้งหมด</button></div>
        <h5>เวลาของโหมดอัตโนมัติ</h5><div class="row"><button class="btn ghost" data-a="lt56" data-v="dusk" data-n="-1">−</button><span style="align-self:center">เริ่มเปิดไฟ ${hh(g.dusk)}</span><button class="btn ghost" data-a="lt56" data-v="dusk" data-n="1">＋</button><button class="btn ghost" data-a="lt56" data-v="dawn" data-n="-1">−</button><span style="align-self:center">ปิดไฟ ${hh(g.dawn)}</span><button class="btn ghost" data-a="lt56" data-v="dawn" data-n="1">＋</button></div>
        <div class="row"><button class="btn ${g.save ? '' : 'ghost'}" data-a="lt56" data-v="save">${g.save ? '✅ โหมดประหยัดไฟ: หรี่ 50% ช่วง 00:00–04:00' : '⬜ โหมดประหยัดไฟ: หรี่ 50% ช่วง 00:00–04:00'}</button></div>
        <p class="dim">⚡ ไฟธรรมดา/LED ใช้ไฟบ้านและคิดเข้าค่าไฟ (ไฟดับ = ดับ) · ☀️ ไฟโซล่าเซลล์ใช้แบตในตัว ชาร์จตอนแดดออก (ฝนตกชาร์จช้า) ปรับให้หรี่ลงถ้าอยากให้สว่างได้ทั้งคืน</p>`;
    }
    return `<p class="lead">ไฟส่องสว่าง 10 แบบ (ซื้อได้ที่ร้านเกษตรรุ่งเรือง ช่างไม้ และร้านวัสดุก่อสร้าง)</p><div class="grid">${Object.keys(T).map(k => { const t = T[k]; return `<div class="card"><div class="ci">${t.i}</div><div class="cb"><h4>${E(t.n)}</h4><p class="dim">${FAM[t.fam][0]} ${FAM[t.fam][1]} · ${t.w}W · ${t.lm} ลูเมน · ไกล ${t.r} ม. · ${baht0(t.price)}</p><p class="dim">${E(t.desc)}</p></div></div>`; }).join('')}</div>`;
  }
  function openApp(tab, focus) { A.tab = tab || 0; A.focus = focus || null; UI.open('💡 ไฟส่องสว่าง', ['ไฟในไร่', 'วางไฟ', 'ตั้งค่ารวม', 'แคตตาล็อก'], t => { A.tab = t; return html(t); }, { wide: true, tab: A.tab }); }
  const byId = id => st().lights.find(x => x.id === +id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  UI.H.lt56 = d => {
    const s = st(), L = d.id != null ? byId(d.id) : null, v = d.v;
    if (v === 'place') startPlace(d.id);
    else if (v === 'rotl') { if (PM.on) PM.rot -= Math.PI / 8; } else if (v === 'rotr') { if (PM.on) PM.rot += Math.PI / 8; }
    else if (v === 'near') { if (PM.on) PM.d = clamp(PM.d - 0.5, 1, 8); } else if (v === 'far') { if (PM.on) PM.d = clamp(PM.d + 0.5, 1, 8); }
    else if (v === 'put') put(); else if (v === 'cancel') { stopPlace(); UI.toast('ยกเลิกการวางไฟ', 'ℹ️'); }
    else if (v === 'k' && L) L.k = +d.n; else if (v === 'mode' && L) L.mode = d.n;
    else if (v === 'from' && L) L.from = ((L.from + +d.n) + 24) % 24; else if (v === 'to' && L) L.to = ((L.to + +d.n) + 24) % 24;
    else if (v === 'move' && L) startPlace(L.t, L);
    else if (v === 'pick' && L) { addItem('light_' + L.t); s.lights.splice(s.lights.indexOf(L), 1); UI.toast('เก็บไฟเข้ากระเป๋าแล้ว', '🎒'); rebuild(); }
    else if (v === 'find' && L) { const me = G.player.pos; UI.toast(`🔦 ไฟ #${L.id} อยู่ที่ ${where(L)}`, '💡'); beam(L); }
    else if (v === 'allmode') { s.lights.forEach(x => { x.mode = d.n; }); }
    else if (v === 'dusk') s.g.dusk = ((s.g.dusk + +d.n) + 24) % 24; else if (v === 'dawn') s.g.dawn = ((s.g.dawn + +d.n) + 24) % 24;
    else if (v === 'save') s.g.save = s.g.save ? 0 : 1;
    refresh();
  };
  // sliders: live, without redrawing the window
  document.addEventListener('input', e => {
    const el = e.target; if (!el || !el.dataset || !el.dataset.lt) return; const val = +el.value, s = st();
    if (el.dataset.lt === 'br') { const L = byId(el.dataset.id); if (L) { L.br = val; const o = document.getElementById('ltv' + L.id); if (o) o.textContent = val; } }
    else if (el.dataset.lt === 'all') { s.lights.forEach(x => { x.br = val; }); const o = document.getElementById('ltvg'); if (o) o.textContent = val; }
    refresh();
  });
  let beamM = null;
  function beam(L) { try { if (beamM && beamM.parent) beamM.parent.remove(beamM); const g = new THREE.Group(); U.mk(g, GEO.cyl, new THREE.MeshBasicMaterial({ color: 0xffcf3f, transparent: true, opacity: 0.35, depthWrite: false, toneMapped: false }), [0, 14, 0], [0.35, 28, 0.35]); g.position.set(L.x, World.groundY(L.x, L.z), L.z); World.outdoor.add(g); beamM = g; setTimeout(() => { if (g.parent) g.parent.remove(g); }, 60000); } catch (e) { } UI.close(); }

  APPS.splice(Math.min(APPS.length, 8), 0, { id: 'lights56', i: '💡', n: 'ไฟส่องสว่าง' });
  Phone.apps.lights56 = () => { setTimeout(() => { Phone.app = null; UI.close(); openApp(0); }, 0); return ''; };
  try { if (typeof APP_GROUPS !== 'undefined') { const gr = APP_GROUPS.find(x => /บ้าน|สาธารณูปโภค|ไอที/.test(x[0])) || APP_GROUPS[APP_GROUPS.length - 1]; if (gr && !gr[1].includes('lights56')) gr[1].push('lights56'); } } catch (e) { }
  // the escape key cancels a placement
  addEventListener('keydown', e => { if (PM.on && e.code === 'Escape') stopPlace(); });
  st(); rebuild(); setTimeout(() => { try { addTabs(); } catch (e) { } }, 3000);
  window.Light56 = { T, st, state, openApp, startPlace, rebuild, refresh, okAt, PM };
});
