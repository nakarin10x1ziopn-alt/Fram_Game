'use strict';
// ---------- v245: the farm is gone for good - what replaces it ----------
//  1. shops: tab names and goods that were only about farming are renamed or dropped (works for every shop, also the city ones built later)
//  2. the front yard of the house, where the well and the farm stand used to be, becomes a small park:
//       - a fountain court with benches, flower planters and lamps (east of the path from the gate)
//       - a coffee cart with two umbrella tables, a real shop (drinks and snacks)
//       - a gazebo on the west lawn where you can sit and rest
//     every piece is placed only where nothing else stands (solids and interaction points are checked first), and keeps the gate path open
V23.add('v245_yard', function () {
  // ---------------- 1. shops ----------------
  const REN = [[/อุปกรณ์ช่าง & ฟาร์ม/, 'อุปกรณ์ช่างและของใช้'], [/🐄\s*อุปกรณ์ปศุสัตว์/, '🧴 ของใช้ทั่วไป'], [/อุปกรณ์ปศุสัตว์/, 'ของใช้ทั่วไป'], [/อัปเกรดฟาร์ม/, 'อัปเกรดบ้านและเครื่องมือ'], [/🌾\s*ฟาร์มอัจฉริยะ/, '📡 ไอทีและเซนเซอร์'], [/ฟาร์มอัจฉริยะ/, 'ไอทีและเซนเซอร์'], [/เมล็ดหายาก/, 'ของฝาก']];
  const DROP = new Set(['tool:v_troughfill', 'tool:v_hormone', 'tool:gps_tractor', 'fut:farmbot', 'fut:vfarm', 'fut:powertools']);
  const clean = () => {
    try {
      for (const sid in SHOPS) {
        const sh = SHOPS[sid]; if (!sh || !Array.isArray(sh.tabs)) continue;
        for (const t of sh.tabs) { for (const [rx, to] of REN) if (rx.test(t.n)) t.n = t.n.replace(rx, to); t.items = (t.items || []).filter(k => !DROP.has(k)); }
        sh.tabs = sh.tabs.filter(t => (t.items || []).length > 0);
      }
    } catch (e) { console.warn('v245 shops', e); }
  };
  clean(); setTimeout(clean, 2500); window.Yard245 = { clean };
  { const _s = UI.shop; if (typeof _s === 'function') UI.shop = function () { clean(); return _s.apply(this, arguments); }; }

  // ---------------- 2. the front yard park ----------------
  const free = (x, z, r) => {
    for (let ix = Math.floor((x - r - 8) / 8); ix <= Math.floor((x + r + 8) / 8); ix++) for (let iz = Math.floor((z - r - 8) / 8); iz <= Math.floor((z + r + 8) / 8); iz++) {
      const a = Col.map.get(Col.key(ix, iz)); if (!a) continue;
      for (const s of a) { if (s.type === 'c') { if (Math.hypot(x - s.x, z - s.z) < s.r + r) return false; } else { const dx = x - s.x, dz = z - s.z, lx = Math.abs(dx * s.c - dz * s.s), lz = Math.abs(dx * s.s + dz * s.c); if (lx < s.hw + r && lz < s.hd + r) return false; } }
    }
    for (const p of World.pois || []) if (Math.hypot(p.x - x, p.z - z) < r + 1.6) return false;
    return true;
  };
  const mat = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85 }, o || {}));
  const put = (g, geo, m, x, y, z, rx, ry, rz) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); if (rx || ry || rz) o.rotation.set(rx || 0, ry || 0, rz || 0); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
  const M = { stone: mat(0xb9b4a8), dark: mat(0x6d4c41), wood: mat(0xa9744a), water: mat(0x4fc3f7, { transparent: true, opacity: 0.8, roughness: 0.2 }), green: mat(0x4e8a3a), lamp: mat(0xfff3b0, { emissive: 0xffe08a, emissiveIntensity: 0.9 }), metal: mat(0x37474f), roof: mat(0x9c3d2a), cloth: [mat(0xe53935), mat(0x1e88e5), mat(0xfdd835)], bloom: [mat(0xff80ab), mat(0xffd54f), mat(0xce93d8), mat(0xff8a65)] };
  const grp = (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, World.groundY(x, z), z); g.rotation.y = ry || 0; World.outdoor.add(g); return g; };
  const bench = (x, z, face) => {
    const g = grp(x, z, face);
    put(g, new THREE.BoxGeometry(1.8, 0.1, 0.55), M.wood, 0, 0.5, 0); put(g, new THREE.BoxGeometry(1.8, 0.4, 0.08), M.wood, 0, 0.85, -0.25);
    for (const s of [-0.75, 0.75]) put(g, new THREE.BoxGeometry(0.1, 0.5, 0.5), M.dark, s, 0.25, 0);
    Col.box(x, z, 0.95, 0.35, face, 'yard');
  };
  const planter = (x, z, i) => {
    const g = grp(x, z, 0); put(g, new THREE.BoxGeometry(1.1, 0.5, 1.1), M.stone, 0, 0.25, 0);
    put(g, new THREE.SphereGeometry(0.5, 10, 8), M.green, 0, 0.75, 0).scale.set(1, 0.7, 1);
    for (let k = 0; k < 5; k++) put(g, new THREE.SphereGeometry(0.11, 8, 6), M.bloom[(i + k) % 4], Math.cos(k * 1.26) * 0.32, 0.98 + (k % 2) * 0.05, Math.sin(k * 1.26) * 0.32);
    Col.box(x, z, 0.6, 0.6, 0, 'yard');
  };
  const lamp = (x, z) => {
    const g = grp(x, z, 0); put(g, new THREE.CylinderGeometry(0.07, 0.09, 3.2, 8), M.metal, 0, 1.6, 0); put(g, new THREE.SphereGeometry(0.28, 10, 8), M.lamp, 0, 3.3, 0);
    Col.circle(x, z, 0.2, 'yard');
  };
  const fountain = (x, z) => {
    const g = grp(x, z, 0);
    put(g, new THREE.CylinderGeometry(1.75, 1.85, 0.55, 28), M.stone, 0, 0.275, 0); put(g, new THREE.CylinderGeometry(1.45, 1.45, 0.06, 28), M.water, 0, 0.5, 0);
    put(g, new THREE.CylinderGeometry(0.2, 0.26, 1.2, 12), M.stone, 0, 1.0, 0); put(g, new THREE.CylinderGeometry(0.7, 0.35, 0.22, 20), M.stone, 0, 1.6, 0); put(g, new THREE.CylinderGeometry(0.58, 0.58, 0.05, 20), M.water, 0, 1.72, 0);
    Col.circle(x, z, 1.9, 'yard');
  };
  const court = (cx, cz) => {
    if (!free(cx, cz, 7.2)) return false;
    fountain(cx, cz);
    [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(([dx, dz], i) => bench(cx + dx * 4.4, cz + dz * 4.4, Math.atan2(-dx, -dz) + (dx ? 0 : 0)));
    [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([dx, dz], i) => planter(cx + dx * 5.4, cz + dz * 5.4, i));
    lamp(cx + 7, cz); lamp(cx - 7, cz);
    return true;
  };
  const cart = (x, z) => {
    if (!free(x, z, 3.2)) return false;
    const g = grp(x, z, -Math.PI / 2);
    put(g, new THREE.BoxGeometry(2.3, 0.95, 1.2), mat(0x8d5b3a), 0, 0.7, 0); put(g, new THREE.BoxGeometry(2.4, 0.08, 1.3), M.dark, 0, 1.2, 0);
    for (const s of [-0.9, 0.9]) put(g, new THREE.CylinderGeometry(0.3, 0.3, 0.12, 14), M.metal, s, 0.3, 0.68, Math.PI / 2);
    for (const sx of [-1.1, 1.1]) for (const sz of [-0.55, 0.55]) put(g, new THREE.CylinderGeometry(0.05, 0.05, 1.3, 6), M.dark, sx, 1.85, sz);
    const roof = put(g, new THREE.BoxGeometry(2.8, 0.08, 1.7), M.cloth[0], 0, 2.5, 0); roof.rotation.x = 0.12;
    const sm = new THREE.MeshStandardMaterial({ map: U.signTex('☕ กาแฟหน้าบ้าน', { w: 384, h: 96, bg: '#6d4c41', fg: '#fff1c9' }), roughness: 0.8 });
    put(g, new THREE.PlaneGeometry(2.1, 0.5), sm, 0, 2.0, 0.7);
    Col.box(x, z, 0.65, 1.2, 0, 'yard');
    [-1, 1].forEach((s, i) => {
      const tx = x + 4.2, tz = z + s * 2.6; if (!free(tx, tz, 1.6)) return;
      const t = grp(tx, tz, 0);
      put(t, new THREE.CylinderGeometry(0.55, 0.55, 0.06, 18), M.wood, 0, 0.78, 0); put(t, new THREE.CylinderGeometry(0.05, 0.05, 0.78, 6), M.dark, 0, 0.39, 0); put(t, new THREE.CylinderGeometry(0.28, 0.28, 0.04, 12), M.dark, 0, 0.02, 0);
      put(t, new THREE.CylinderGeometry(0.03, 0.03, 2.2, 6), M.dark, 0, 1.1, 0); put(t, new THREE.ConeGeometry(1.35, 0.5, 12), M.cloth[i + 1], 0, 2.25, 0);
      for (const a of [0.8, 3.9]) { const sx = Math.cos(a) * 0.95, sz = Math.sin(a) * 0.95; put(t, new THREE.CylinderGeometry(0.2, 0.2, 0.45, 10), M.dark, sx, 0.23, sz); Col.circle(tx + sx, tz + sz, 0.25, 'yard'); }
      Col.circle(tx, tz, 0.6, 'yard');
    });
    SHOPS.cafecart = SHOPS.cafecart || { n: 'รถเข็นกาแฟหน้าบ้าน', tabs: [{ n: '☕ เครื่องดื่ม', items: ['food:coffee', 'food:icecoffee', 'food:milktea', 'food:thaitea', 'food:lemonade'] }, { n: '🍰 ของว่าง', items: ['food:cake', 'food:sandwich', 'food:khanom', 'food:onigiri'] }].map(t => ({ n: t.n, items: t.items.filter(k => typeof FOODS !== 'undefined' && FOODS[k.slice(5)]) })).filter(t => t.items.length) };
    World.pois.push({ kind: 'shop', id: 'cafecart', x: x - 2.2, z, r: 2.2, label: 'รถเข็นกาแฟหน้าบ้าน', icon: '☕', map: true });
    return true;
  };
  const gazebo = (x, z) => {
    if (!free(x, z, 4.2)) return false;
    const g = grp(x, z, 0);
    put(g, new THREE.BoxGeometry(4.6, 0.2, 4.6), M.wood, 0, 0.1, 0);
    for (const sx of [-2, 2]) for (const sz of [-2, 2]) { put(g, new THREE.CylinderGeometry(0.1, 0.1, 2.7, 8), M.dark, sx, 1.55, sz); Col.circle(x + sx, z + sz, 0.22, 'yard'); }
    put(g, new THREE.ConeGeometry(3.6, 1.3, 4), M.roof, 0, 3.55, 0, 0, Math.PI / 4, 0);
    put(g, new THREE.BoxGeometry(1.8, 0.1, 0.55), M.wood, 0, 0.7, 1.6); put(g, new THREE.BoxGeometry(1.8, 0.4, 0.08), M.wood, 0, 1.05, 1.85);
    put(g, new THREE.CylinderGeometry(0.5, 0.5, 0.06, 16), M.wood, 0, 0.85, -0.2); put(g, new THREE.CylinderGeometry(0.06, 0.06, 0.65, 6), M.dark, 0, 0.5, -0.2);
    [[-1, 0], [1, 0]].forEach(([s], i) => planter(x + s * 4.2, z + 3.2, i + 1));
    World.pois.push({ kind: 'act', x, z: z + 3.6, r: 2.6, label: 'ศาลาพักผ่อน', icon: '🪑', map: true, act: () => ({ icon: '🪑', label: 'นั่งพักในศาลา 20 นาที', fn: () => {
      const now = S.day * 1440 + (S.time || 0), last = S.rest245 || -999;
      if (now - last < 120) { UI.toast('เพิ่งพักไป นั่งอีกครั้งได้หลังผ่านไป 2 ชั่วโมง', '🪑'); return; }
      S.rest245 = now; const e0 = S.energy; S.energy = Math.min(maxEnergy(), S.energy + 8); try { tick(20); } catch (e) { }
      UI.toast(`นั่งพักในศาลา พลังงาน +${Math.round(S.energy - e0)}`, '🪑');
    } }) });
    return true;
  };
  const built = { court: false, cart: false, gazebo: false };
  const build = () => {
    if (window.__yard245) return; window.__yard245 = 1;
    try { built.court = court(12, -28); built.cart = cart(9, -47); built.gazebo = gazebo(-46, -20); } catch (e) { console.warn('v245 yard', e); }
    window.Yard245 = Object.assign(window.Yard245 || {}, { built, free });
  };
  let tries = 0; const iv = setInterval(() => { try { if (typeof G !== 'undefined' && G.started && World.outdoor && World.pois && Col.map) { clearInterval(iv); setTimeout(build, 1500); } else if (++tries > 900) clearInterval(iv); } catch (e) { } }, 700);
});
