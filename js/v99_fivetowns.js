// v99_fivetowns.js: the places left in the game (the owner's decision; more can be added back later by removing this file from the FILES list)
//  Kept: the farm, หมู่บ้านสุขใจ, and 3 far cities: สุขนครมหานคร (large), สวนทองเมือง (medium), บ้านทุ่งทานตะวัน (small), by taxi / highway.
//  Removed from play: the other 6 far cities, ดอยสุขใจ, เกาะสุขใจ, เชียงสุข, สุขใจซิตี้, and the three towns on the main map (เมืองริมทะเล, เมืองทุ่งทอง, เมืองภูผาใหม่, with the highway toll plaza):
//   - far cities / side areas: no taxi, no highway entry, no map marker, no phone-app entry, the meshes of the old areas are freed
//   - main-map towns: every building and prop inside them is taken out of the scene (the meshes are freed), their bus stops, fuel pumps, ATMs, fishing spots, job kiosks and townsfolk are gone,
//     and anyone found inside the old boundary (a save made there, a car) is brought back to the village fountain
//   - the SERVICES and SHOPS that were in those towns (driving school, house builder, electricity office, EV centre, pet centre, PC plaza, IT stores, car dealer, supercars, hardware, rare plants,
//     furniture, your rented shop, the town-quest boards, the seaside market ...) are not deleted: the very same interaction points are moved to a booth plaza in สุขนครมหานคร (built with the city on the first visit);
//     the IT shop, network / security shop and PC plaza (with the build counter) have proper shopfronts on the east side of the main road at the village entrance. The two friends who lived at the seaside move to the village plaza.
//  The save itself is not edited, except that cars parked inside a removed town are moved to the village garage spots.
V23.add('v99_fivetowns', () => {
  if (typeof Town2 === 'undefined' || !window.V23Kit) return;
  const KEEP = ['metro', 'orchard', 'sunflower'], KEEP_OLD = [], CLOSE_OLD = ['chiang', 'city', 'mount', 'island'];
  const gone = new Set(CLOSE_OLD.concat(V23Kit.TOWNS.map(t => t.key).filter(k => !KEEP.includes(k))));
  // rectangles of the removed main-map towns: [centre x, centre z, half width, half depth] (a margin is included)
  const RECTS = [[170, -268, 56, 48], [-105, -440, 62, 84], [420, -385, 142, 66]];
  const inRect = (x, z, pad) => RECTS.some(r => Math.abs(x - r[0]) < r[2] + (pad || 0) && Math.abs(z - r[1]) < r[3] + (pad || 0));
  const inPlace = (arr, keep) => { if (!Array.isArray(arr)) return 0; let n = 0; for (let i = arr.length - 1; i >= 0; i--) if (!keep(arr[i], i)) { arr.splice(i, 1); n++; } return n; };
  const keyOf = o => (o && (o.key || o.id || o.away)) || (Array.isArray(o) ? o[0] : null);
  const toast = (t, i) => { try { UI.toast(t, i); } catch (e) { } };
  const sharedGeo = new Set(Object.values(typeof GEO !== 'undefined' ? GEO : {}));
  const freeGroup = g => { try { if (g.parent) g.parent.remove(g); g.traverse(o => { if (o.geometry && !sharedGeo.has(o.geometry)) o.geometry.dispose(); }); } catch (e) { } };
  const HUB = { x: -50, z: -255 }, COLS = 5, GX = 6.0, GZ = 5.2;
  const MOVE = /โรงเรียนสอนขับรถ|รับสร้างบ้าน|การไฟฟ้า|ศูนย์ EV|ศูนย์สัตว์เลี้ยง|คลินิกผสมพันธุ์|สนามแข่งและประกวดสัตว์|ลีกแข่งม้า|ไอทีซีเคียวริตี้|ช่างวางระบบเครือข่าย|ไอทีซิตี้|ไอทีสโตร์|โชว์รูมรถทุ่งทอง|ซุปเปอร์คาร์|ร้านวัสดุก่อสร้าง|ร้านพันธุ์ไม้หายาก|บ้านสวยเฟอร์นิเจอร์|^ร้านของฉัน|^คอมพิวเตอร์พลาซ่า|เคาน์เตอร์ประกอบคอม|หอพัก|ตลาดริมทะเล|ตลาดน้ำริมทะเล|ร้านซีฟู้ด|ร้านดอกไม้ภูผา|คาเฟ่ริมเขา|ร้านอาหารจีน|กระดานภารกิจเมือง/;
  const NOMOVE = /^(ตู้|ป้าย)/;
  const FRIENDS = ['แก้ว', 'ภูผา'];

  // ---- far cities ----
  inPlace(V23Kit.TOWNS, t => !gone.has(t.key));
  inPlace(window.V23Towns, t => !gone.has(keyOf(t)));
  inPlace(window.V25Towns, t => !gone.has(keyOf(t)));
  inPlace(TAXI_DEST, d => !(d.away && gone.has(d.away)));
  try { if (Plan && Plan.hwExtra) inPlace(Plan.hwExtra, d => !gone.has(d[0])); } catch (e) { }
  for (const k of gone) { const A = Town2.areas && Town2.areas[k]; if (A && A.g && G.away !== A) freeGroup(A.g); if (Town2.areas) delete Town2.areas[k]; }

  // ---- main-map towns ----
  const counts = { meshes: 0, pois: 0, moved: 0, npcs: 0, moved_names: [], dropped: [] };
  { // static props and buildings: judged by the centre of their bounding box (the few huge meshes - ground, roads - are kept)
    const bb = new THREE.Box3(), c = new THREE.Vector3(), s = new THREE.Vector3(), kill = [];
    const walk = (o, d) => { for (const ch of o.children) { if (ch.isMesh || ch.isLine || ch.isPoints) { if (!ch.geometry) continue; ch.updateWorldMatrix(true, false); if (!ch.geometry.boundingBox) ch.geometry.computeBoundingBox(); bb.copy(ch.geometry.boundingBox).applyMatrix4(ch.matrixWorld); bb.getCenter(c); bb.getSize(s); if (s.x < 150 && s.z < 150 && inRect(c.x, c.z, 0)) kill.push(ch); } else if (d < 8) walk(ch, d + 1); } };
    try { walk(World.outdoor, 0); for (const m of kill) { if (m.parent) m.parent.remove(m); if (m.geometry && !sharedGeo.has(m.geometry)) m.geometry.dispose(); counts.meshes++; } } catch (e) { console.warn('v99 purge', e); }
  }
  // interaction points: services and shops move to the village plaza, the rest of what stood in the towns is dropped
  const moving = [];
  try {
    counts.pois = inPlace(World.pois, p => {
      if (!p) return true;
      const lab = String(p.label || '');
      if (p.label === 'ท่าเรือข้ามไปเกาะ') { counts.dropped.push(lab); return false; }
      if (!Number.isFinite(p.x) || !inRect(p.x, p.z, 0)) return true;
      if (MOVE.test(lab) && !NOMOVE.test(lab)) { p._ox = p.x; moving.push(p); return false; }
      counts.dropped.push(lab + '@' + Math.round(p.x) + ',' + Math.round(p.z)); return false;
    });
  } catch (e) { console.warn('v99 pois', e); }
  // ---- where the moved points go ----
  //  village: the IT shop, the network / security shop (+ installer) and the PC plaza (+ build counter) get proper shopfronts in the west of the village
  //  สุขนครมหานคร: every other service and shop gets a booth plaza, built together with the city on the first visit (the points are not in the world before that)
  const IT_RE = /ไอทีสโตร์|ไอทีซีเคียวริตี้|ช่างวางระบบเครือข่าย|^คอมพิวเตอร์พลาซ่า|เคาน์เตอร์ประกอบคอม/;
  const VSH = /^(lux|supercar|dealer2|evcenter|seafood|floating|citycafe)$/, DROPSH = /^(hardware|petshop|rare|restaurant|florist|itshop)$/;   // v184: these shops get proper shopfronts in the village (v184_villageshops.js); the others are merged / already have a door in the village
  const isSh = (p, re) => p.kind === 'shop' && re.test(p.id) && !IT_RE.test(String(p.label));
  const toVillage = moving.filter(p => IT_RE.test(String(p.label))), toMetro = moving.filter(p => !IT_RE.test(String(p.label)) && !isSh(p, VSH) && !isSh(p, DROPSH));
  window.__v99VillageShops = moving.filter(p => isSh(p, VSH));
  // shops added by later modules (the PC plaza, the security shop) never got a walk-in room: give every moved shop one, like the other shops have
  const ensureRoom = p => { try { if (p.kind === 'shop' && !p.room && !p.noRoom && p.id !== 'floating' && SHOPS[p.id]) p.room = { kind: SHOP_ROOM[p.id] || 'shop', shop: p.id, title: SHOPS[p.id].n }; } catch (e) { } };
  const sign = (txt, bg) => new THREE.MeshBasicMaterial({ map: U.signTex(txt, { w: 512, h: 128, bg, fg: '#ffffff' }) });
  try { for (const id of ['pcshop', 'secshop']) if (SHOPS[id] && SHOPS[id].n) SHOPS[id].n = SHOPS[id].n.replace('ทุ่งทอง', 'สุขใจ'); } catch (e) { }
  try { // ---- village: three shopfronts facing east ----
    const defs = [
      { z: -130, name: 'ไอที & ซีเคียวริตี้ สุขใจ (ไอที เครือข่าย กล้อง)', bg: '#0d47a1', wall: 0xe3f2fd, find: p => /ไอทีสโตร์/.test(p.label), extra: [p => /ช่างวางระบบเครือข่าย/.test(p.label)], label: 'ไอที & ซีเคียวริตี้ สุขใจ', icon: '💻' },   // v179: the IT shop and the security shop are one shop now (one shopfront)
      { z: -118, name: 'คอมพิวเตอร์พลาซ่า สุขใจ (คอมประกอบ)', bg: '#4527a0', wall: 0xede7f6, find: p => /^คอมพิวเตอร์พลาซ่า/.test(p.label), extra: [p => /เคาน์เตอร์ประกอบคอม/.test(p.label)], label: 'คอมพิวเตอร์พลาซ่า สุขใจ', icon: '🖥️' },
    ];
    const X = 11.5, rot = -Math.PI / 2;   // east side of the main road, facing the road
    for (const d of defs) {
      const o = { w: 10, d: 8, h: 5, rows: 1, flat: true, glassFront: true, wall: d.wall, roof: 0xe0e0e0, sign: d.name, signStyle: { bg: d.bg } };
      const b = World.building(o); b.position.set(X, World.groundY(X, d.z), d.z); b.rotation.y = rot; World.outdoor.add(b);
      try { Col.box(X, d.z, o.w / 2 + 0.3, o.d / 2 + 0.3, rot, 'bld'); } catch (e) { }
      const main = toVillage.find(d.find);
      if (main) { const dr = l2w(X, d.z, rot, 0, o.d / 2 + 1.7); main.x = dr.x; main.z = dr.z; main.r = 2.4; main.map = false; main.label = d.label; main.icon = d.icon; ensureRoom(main); World.pois.push(main); counts.moved++; counts.moved_names.push(d.label + ' (หมู่บ้าน)'); }
      d.extra.forEach((f, k) => { const p = toVillage.find(f); if (!p) return; const dr = l2w(X, d.z, rot, 3.6, o.d / 2 + 1.7); p.x = dr.x; p.z = dr.z; p.r = 1.8; p.map = false; World.pois.push(p); counts.moved++; counts.moved_names.push(p.label + ' (หมู่บ้าน)'); });
    }
    World.pois.push({ kind: 'act', x: X + 9, z: -124, r: 2.2, label: 'ย่านไอทีสุขใจ', icon: '💻', map: true, act: () => ({ icon: '💻', label: 'ย่านไอทีสุขใจ: อุปกรณ์ไอที เครือข่าย และคอมประกอบ', fn: () => toast('ร้านไอที เครือข่ายและกล้อง และคอมพิวเตอร์พลาซ่า (ประกอบคอม) อยู่ริมถนนใหญ่ ทางเข้าหมู่บ้าน', '💻') }) });
    TAXI_DEST.push({ n: 'ย่านไอทีสุขใจ (ร้านไอที/คอม/เครือข่าย)', x: 2.5, z: -124, fee: 60 });
  } catch (e) { console.warn('v99 village IT', e); }
  // ---- สุขนครมหานคร: the booth plaza ----
  const buildPlaza = A => {
    try {
      const CM = 4, n = toMetro.length, rows = Math.ceil(n / CM), W = CM * GX + 8, D = rows * GZ + 10, g0 = A.g, T0 = V23Kit.TOWNS.find(t => t.key === 'metro'), cx = T0.cx, cz = T0.cz;
      // a free flat spot: fewest meshes inside the rectangle, nearest to the taxi stand
      const bb = new THREE.Box3(), c = new THREE.Vector3(), s = new THREE.Vector3(), pts = [];
      g0.updateWorldMatrix(true, true);
      g0.traverse(m => { if (m.isMesh && m.geometry) { if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); m.updateWorldMatrix(true, false); bb.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld); bb.getSize(s); if (s.x < 120 && s.z < 120 && s.y > 0.3) { bb.getCenter(c); pts.push([c.x, c.z]); } } });
      let best = null; const sp = A.spawn || { x: cx, z: cz + 58 };
      const xa = A.x0 + W / 2 + 1, xb = A.x1 - W / 2 - 1, za = A.z0 + D / 2 + 1, zb = A.z1 - D / 2 - 1;   // the player can only walk inside the area limits
      for (let x = xa; x <= xb; x += 4) for (let z = za; z <= zb; z += 4) { let k = 0; for (const p of pts) if (Math.abs(p[0] - x) < W / 2 + 3 && Math.abs(p[1] - z) < D / 2 + 3) k++; let cv = 0; if (k < 6) { for (let qx = x - W / 2; qx <= x + W / 2; qx += 3) for (let qz = z - D / 2; qz <= z + D / 2; qz += 3) { const q = { x: qx, z: qz }; if (Col.push(q, 0.4)) cv++; } }   // existing colliders (lamps, trees ...) inside the rectangle
        const sc = k * 1000 + cv * 400 + Math.hypot(x - sp.x, z - sp.z); if (!best || sc < best.sc) best = { sc, x, z, k }; }
      const px = best.x, pz = best.z, g = new THREE.Group(); g.position.set(px, 0, pz); g0.add(g);
      const pad = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshLambertMaterial({ color: 0xd6cdb6 })); pad.rotation.x = -Math.PI / 2; pad.position.y = 0.05; g.add(pad);
      const body = new THREE.BoxGeometry(3.1, 2.3, 1.8), plane = new THREE.PlaneGeometry(2.9, 0.72);
      const mats = [0x2e7d6b, 0x3f6fb5, 0xb5653f, 0x7a5aa6, 0xa88a2e].map(cc => new THREE.MeshLambertMaterial({ color: cc }));
      const BG = ['#1f5f50', '#2a4f86', '#8a4524', '#573b80', '#7d6518'];
      toMetro.forEach((p, i) => {
        const col = i % CM, row = Math.floor(i / CM), lx = (col - (CM - 1) / 2) * GX, lz = (row - (rows - 1) / 2) * GZ, ci = i % mats.length;
        const b = new THREE.Mesh(body, mats[ci]); b.position.set(lx, 1.15, lz); g.add(b);
        let lab = String(p.label || ''); if (lab === 'กระดานภารกิจเมือง') { lab += p._ox > 0 ? ' · ทุ่งทอง' : ' · ภูผา'; p.label = lab; }
        const sg = new THREE.Mesh(plane, sign(((p.icon || '') + ' ' + lab).slice(0, 26), BG[ci])); sg.position.set(lx, 2.75, lz + 0.93); g.add(sg);
        try { Col.box(px + lx, pz + lz, 1.65, 1.0, 0, 'bld'); } catch (e) { }
        p.x = px + lx; p.z = pz + lz + 2.3; p.r = Math.max(p.r || 2.4, 2.2); p.map = false; ensureRoom(p); World.pois.push(p); counts.moved++; counts.moved_names.push(lab + ' (สุขนคร)');
      });
      const head = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.5), sign('🏪 ย่านบริการสุขนคร', '#b71c1c')); head.position.set(0, 4.3, -D / 2 + 1); g.add(head);
      for (const sx of [-4, 4]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.3, 0.2), mats[2]); post.position.set(sx, 2.15, -D / 2 + 0.9); g.add(post); }
      A.hello = (A.hello || '') + ' · ย่านบริการ (ขับรถ สร้างบ้าน ไฟฟ้า สัตว์เลี้ยง รถหรู วัสดุ ฯลฯ) อยู่ใกล้ป้ายแท็กซี่';
      counts.plaza = { x: px, z: pz, meshesInRect: best.k };
    } catch (e) { console.warn('v99 metro plaza', e); }
  };
  try { const stub = Town2.areas.metro; if (stub && stub.lazy && toMetro.length) { const L0 = stub.lazy; stub.lazy = () => { const A = L0(); buildPlaza(A); return A; }; } } catch (e) { console.warn('v99 metro hook', e); }
  // people: the two friends from the seaside move to the village plaza, the other townsfolk and shop keepers of the removed towns are gone
  try {
    counts.npcs = inPlace(G.npcs, n => {
      const p = n.obj && n.obj.position; const out = p && inRect(p.x, p.z, 0); if (!out) return true;
      if (FRIENDS.includes(n.name) && World.npcRoutes && World.npcRoutes.village && World.npcRoutes.village.plaza) {
        const pl = World.npcRoutes.village.plaza, a = Math.random() * Math.PI * 2;
        delete n.line; n.fixed = false; n.circ = pl; n.x = pl.x + Math.cos(a) * pl.r; n.z = pl.z + Math.sin(a) * pl.r; n.tx = 0; n.tz = 0; n.st = 'idle'; n.path = null;
        n.obj.position.set(n.x, World.groundY(n.x, n.z), n.z);
        try { const homes = (World.homes || []).filter(h => h.zone === 'village'); if (homes.length) n.home = homes[Math.floor(Math.random() * homes.length)]; } catch (e) { }
        return true;
      }
      try { n.obj.parent && n.obj.parent.remove(n.obj); } catch (e) { } return false;
    });
  } catch (e) { }
  inPlace(TAXI_DEST, d => !(d.x != null && inRect(d.x, d.z, 0)));
  try { inPlace(EBUS_STOPS, p => !inRect(p.x, p.z, 8)); } catch (e) { }
  try { inPlace(WK_SPOTS, w => !inRect(w.x, w.z, 8)); } catch (e) { }
  try { if (Plan && Plan.wkShow) Plan.wkShow(); } catch (e) { }

  // ---- solid world: nothing can be walked through ----
  // late props (made after the boot collision pass) get colliders; spots where a wall had no collider (found by a ray audit of the farm and the village) are filled with small boxes
  const HOLES = [[-22.2,-27],[-22.2,-26.4],[-21.6,-27],[-21.6,-26.4],[-18.6,-27],[-44.4,0.6],[-44.4,9.6],[10.2,-220.8],[10.2,-208.8],[12.6,-226.2],[12.6,-214.2],[-82.8,-201.6],[-82.8,-201],[-82.8,-199.2],[-82.8,-198.6],[-82.8,-198],[-81.6,-202.8],[-81.6,-196.8],[-81,-202.8],[21.6,-152.4],[21.6,-151.8],[21.6,-151.2],[21.6,-150.6],[21.6,-150],[-11.4,-169.2],[-11.4,-168.6],[-63.6,-52.2],[-63,-52.2],[-62.4,-52.2],[-61.8,-52.2],[-61.2,-52.2],[-60.6,-52.2],[-60,-52.2],[-59.4,-52.2],[-58.8,-52.2],[-58.2,-52.2],[-57.6,-52.2],[-57,-52.2],[-56.4,-52.2],[-55.8,-51.6],[-55.8,-46.2],[-55.8,-40.8],[37.2,-331.2],[37.2,-330.6],[-12,-148.2],[-12,-147],[67.8,-201],[-12.6,-345.6],[-72,-321],[-93,-328.8],[-92.4,-328.8],[-91.8,-328.8],[-91.2,-328.8],[-90.6,-328.8],[-90,-328.8],[-89.4,-328.8],[-88.8,-328.8],[-88.2,-328.8],[-87.6,-328.8],[-113.4,-328.2],[-113.4,-326.4],[-113.4,-325.8],[-113.4,-325.2],[-113.4,-324.6],[-113.4,-324],[-113.4,-323.4],[-113.4,-321.6],[-112.8,-328.8],[-112.2,-328.8],[-111.6,-328.8],[-111,-328.8],[-110.4,-328.8],[-109.8,-328.8],[-109.2,-328.8],[-108.6,-328.8],[-108,-328.8],[-107.4,-328.8],[-9,-207],[-9,-202.2],[40.8,-165]];
  // ray audit used at run time for the far cities (cheap: they are small): wall surfaces within 0.4 m of a spot a player (radius 0.3) can stand on, with no collider -> a small box
  // only things that have not moved since the previous pass count (taxis, vans and walkers in a city are meshes too and must never become walls)
  const lastPos = new WeakMap(), VEH = /(^|-)(taxi|sedan|van|bus|ebus|truck|oldtruck|delivery|sports|police|fire|ambulance|pickup|suv|hatch|hatchback|minibus|lorry|moto|bike|tuk|car|vehicle)(-|$)/i;
  const isVehicle = (o, root) => { for (let p = o; p && p !== root; p = p.parent) { const n = p.name || ''; if (p.R || p.patrol || p.city || p.xfer !== undefined || p.userData && (p.userData.veh || p.userData.vehicle)) return true; if (VEH.test(n) || (typeof CARS !== 'undefined' && CARS[n])) return true; const T = window.Traf39; if (T && ((T.pool && T.pool.includes(p)) || (T.active && T.active.includes(p)))) return true; } return false; };
  const patchHoles = (root, groundAt, sink, once, skip) => {
    let added = 0;
    try {
      const rc = new THREE.Raycaster(), bx = new THREE.Box3(), dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]; root.updateMatrixWorld(true);
      root.traverse(o => {
        if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh) return; for (let p = o; p; p = p.parent) if (p.userData && p.userData.noCol) return; if (isVehicle(o, root)) return;
        const m = o.material; if (m && ((m.transparent && m.opacity < 0.5) || m.blending === THREE.AdditiveBlending)) return;
        bx.setFromObject(o); const w = bx.max.x - bx.min.x, d = bx.max.z - bx.min.z, h = bx.max.y - bx.min.y; { const lp = lastPos.get(o), cxp = (bx.min.x + bx.max.x) / 2, czp = (bx.min.z + bx.max.z) / 2; lastPos.set(o, [cxp, czp]); if (!once && (!lp || Math.abs(lp[0] - cxp) > 0.02 || Math.abs(lp[1] - czp) > 0.02)) return; } if (h < 0.9 || w * d < 4 || w > 45 || d > 45) return;
        const gy0 = groundAt((bx.min.x + bx.max.x) / 2, (bx.min.z + bx.max.z) / 2); if (bx.min.y > gy0 + 1.2) return;
        for (let x = bx.min.x - 0.4; x <= bx.max.x + 0.4; x += 0.6) for (let z = bx.min.z - 0.4; z <= bx.max.z + 0.4; z += 0.6) {
          if (skip && skip(x, z)) continue;   // never on a traffic lane
          const q = { x, z }; Col.push(q, 0.3); if (Math.hypot(q.x - x, q.z - z) > 0.01) continue;
          const y = Math.max(groundAt(x, z) + 0.9, bx.min.y + 0.3);
          for (const [dx, dz] of dirs) { rc.set(new THREE.Vector3(x, y, z), new THREE.Vector3(dx, 0, dz)); rc.far = 0.4; const hs = rc.intersectObject(o, false); if (hs.length && hs[0].distance < 0.4) { const cb = Col.box(x, z, 0.33, 0.33, 0, 'v157'); if (sink) sink.push(cb); added++; break; } }
        }
      });
    } catch (e) { console.warn('v99 patchHoles', e); }
    return added;
  };
  try { Collide.scan(World.outdoor, (x, z) => World.groundY(x, z)); for (const c of HOLES) Col.box(c[0], c[1], 0.33, 0.33, 0, 'v157'); } catch (e) { console.warn('v99 solid', e); }
  // shop / office rooms: the same audit when a room is built (the boxes belong to the room and are removed with it)
  try { if (typeof Rooms !== 'undefined' && Rooms.build) { const _rb = Rooms.build.bind(Rooms); Rooms.build = function () { const r = _rb.apply(this, arguments); try { counts.roomHoles = (counts.roomHoles || 0) + patchHoles(this.group, () => 0, this.cols, true); } catch (e) { } return r; }; } } catch (e) { }
  // the kept far cities: the same audit when each one is built (first visit)
  for (const k of KEEP) { try { const stub = Town2.areas[k]; if (!stub || !stub.lazy) continue; const L1 = stub.lazy; stub.lazy = () => { const A = L1(); try { const laneSkip = (x, z) => { const sts = A.streets || []; for (const st of sts) if (Math.abs(x - (A.cx + st)) < 5) return true; if (A.size === 'large' && Math.abs(z - (A.cz + 50)) < 5 && Math.abs(x - A.cx) < 66) return true; return false; }; counts['holes_' + k] = patchHoles(A.g, () => 0, null, false, laneSkip); for (const ms of [3000, 6000, 10000, 16000, 30000, 60000]) setTimeout(() => { try { counts['holes_' + k] += patchHoles(A.g, () => 0, null, false, laneSkip); } catch (e) { } }, ms); } catch (e) { } return A; }; /* again after the city's props are merged into big meshes (a few seconds after the build) */ } catch (e) { } }

  // ---- guards ----
  const _go = Town2.go.bind(Town2);
  Town2.go = function (k, fee) { if (gone.has(k) || !Town2.areas[k]) { toast('สถานที่นี้ปิดให้บริการแล้ว', '🚧'); return; } return _go(k, fee); };
  const _tx = Town2.taxiHTML.bind(Town2);
  Town2.taxiHTML = function () { return _tx().replace(/\(\d+ เมือง\)/, `(${V23Kit.TOWNS.length + KEEP_OLD.length} เมือง)`); };
  try { const _pm = Phone.msg; Phone.msg = function (a, t) { if (typeof t === 'string') t = t.replace(/เปิดเมืองไกลแล้ว \d+ เมือง \(ใหญ่ 4 · กลาง 3 · เล็ก 2\)/, `เปิดเมืองไกลแล้ว ${V23Kit.TOWNS.length} เมือง (ใหญ่ 1 · กลาง 1 · เล็ก 1)`); return _pm.apply(this, [a, t].concat([].slice.call(arguments, 2))); }; } catch (e) { }
  // delivery job: destinations in the removed towns become the village fountain
  try {
    const _job = Plan.job.bind(Plan);
    Plan.job = function (k) { const r = _job.apply(null, arguments); try { const j = Life2.job; if (j && j.k === 'cargo' && j.dest && inRect(j.dest.x, j.dest.z, 0)) { j.dest = { x: -14, z: -262, n: 'ลานน้ำพุหมู่บ้านสุขใจ' }; Life2.marker(); } } catch (e) { } return r; };
  } catch (e) { }
  // the supercar showroom delivered to the seaside: now the village garage
  try { const _bc = buyCar; buyCar = function (type, where) { return _bc.call(this, type, where === 'seaside' ? 'village' : where); }; } catch (e) { }
  // cars parked inside a removed town (a save made before) move to the village garage spots
  const moveCars = () => {
    try {
      if (!S.cars || S.v99cars) return; S.v99cars = 1; let k = 0; const spots = [[2.2, -238, Math.PI], [2.2, -247, Math.PI]];
      S.cars.forEach((c, i) => { if (c && inRect(c.x, c.z, 0)) { const sp = spots[k++ % 2]; c.x = sp[0]; c.z = sp[1]; c.r = sp[2]; const o = G.cars && G.cars[i]; if (o) { if ('x' in o) { o.x = sp[0]; o.z = sp[1]; o.r = sp[2]; } if (o.obj && o.obj.position) { o.obj.position.x = sp[0]; o.obj.position.z = sp[1]; o.obj.rotation.y = sp[2]; } } } });
    } catch (e) { console.warn('v99 cars', e); }
  };
  // anyone (or any car) inside a removed town: back to the village fountain
  setInterval(() => {
    try {
      if (!G.started) return;
      moveCars();
      if (G.away) { if (!Object.values(Town2.areas).includes(G.away)) { Town2.leaveAway(true); G.player.pos.set(-14, World.groundY(-14, -262), -262); try { snapCam(); } catch (e) { } toast('ที่นี่ปิดแล้ว พากลับหมู่บ้านสุขใจ', '🚕'); } return; }
      const d = G.driving ? G.driving.d : null, p = d || G.player.pos;
      if (!G.inside && inRect(p.x, p.z, 0)) {
        if (d) { d.x = -14; d.z = -262; d.speed = 0; if (G.driving) G.driving.speed = 0; }
        G.player.pos.set(-14, World.groundY(-14, -262), -262); try { snapCam(); } catch (e) { }
        toast('เมืองนี้ปิดแล้ว พากลับหมู่บ้านสุขใจ', '🚧');
      }
    } catch (e) { }
  }, 1000);
  window.FiveTowns99 = { patchHoles, keep: KEEP.concat(KEEP_OLD), gone: [...gone], towns: () => V23Kit.TOWNS.map(t => t.key), counts, inRect, moveCars, hub: HUB };
});
