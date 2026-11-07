'use strict';
// ---------- v36_house: expand THE MAIN HOUSE itself instead of buying another one ----------
// Footprint steps (wider / deeper), 2-4 storeys with a real exterior, a staircase in the interior and one walkable room per extra floor
// (furniture catalogue + room editor from Prop23, partitions, colours, lighting, windows), building permit through the Gov24 wallet,
// contractor cost per square metre, build time with scaffolding, utilities / property tax / insurance that grow with the floor area.
// State: S.v36h = { fp, fl, proj, floors, fh, lift, spent, taxY }
V23.add('v36_house', () => {
  if (typeof World === 'undefined' || typeof Prop23 === 'undefined' || typeof Rooms === 'undefined' || typeof HOUSE_DEF === 'undefined') return;
  const YD = typeof YEAR_DAYS !== 'undefined' ? YEAR_DAYS : 84;
  const BASE_ROOM = ROOM.map(r => r.slice());
  const FPS = [
    { dw: 0, dd: 0, n: 'ขนาดเดิม' },
    { dw: 2, dd: 1.5, n: 'ขยายเล็ก (กว้างขึ้น 2 ม. ลึกขึ้น 1.5 ม.)' },
    { dw: 4, dd: 3, n: 'ขยายกลาง (กว้างขึ้น 4 ม. ลึกขึ้น 3 ม.)' },
    { dw: 6, dd: 4.5, n: 'ขยายใหญ่ (กว้างขึ้น 6 ม. ลึกขึ้น 4.5 ม.)' },
  ];
  const RATE = 12000;                       // ฿ per square metre of new floor (structure, walls, roof, finishes)
  const PILE3 = 180000, PILE4 = 320000;      // piles / ground-beam strengthening before the 3rd and 4th floor
  const LIFT = 380000;                       // home lift
  const ENG = 35000;                         // architect + engineer + supervision
  const ROOM_NAMES = ['ห้องนั่งเล่น', 'ห้องนอนใหญ่', 'ห้องนอนเด็ก', 'ห้องทำงาน', 'ห้องเซิร์ฟเวอร์ / ไอที', 'ห้องครัว', 'ห้องน้ำ', 'ห้องเก็บของ', 'โฮมเธียเตอร์', 'ห้องออกกำลังกาย', 'ห้องพระ', 'ห้องแขก', 'ห้องซักรีด', 'ห้องดนตรี'];
  const LAYOUTS = { open: 'โล่งทั้งชั้น', split: 'แบ่ง 2 ห้อง (ผนังขวาง)', rooms3: 'แบ่ง 3 ห้อง', corridor: 'แบ่ง 3 ห้องเรียงข้าง' };
  const LIGHTS = { warm: ['🟠', 'แสงวอร์ม', 0xfff0d6], white: ['⚪', 'แสงขาว', 0xffffff], cool: ['🔵', 'แสงเดย์ไลท์', 0xe6f1ff] };
  const msg = (f, t) => { try { Phone.msg(f, t); } catch (e) { } };
  const st = () => {
    const x = S.v36h = S.v36h || {};
    x.fp = x.fp | 0; x.fl = x.fl || 1; x.floors = x.floors || {}; x.fh = x.fh || {}; x.spent = x.spent || 0; x.lift = x.lift | 0;
    return x;
  };
  const lvl = () => S.up.house;
  const baseDef = () => HOUSE_DEF[lvl() - 1];
  const dims = () => { const o = baseDef(), f = FPS[st().fp]; return { w: o.w + f.dw, d: o.d + f.dd, o }; };
  // the front face stays where it was (bin, workbench and garden are in front); extra depth grows toward the back
  const czOf = () => HOUSE_POS.z - (dims().d - baseDef().d) / 2;
  const roomDims = (fp = st().fp) => { const b = BASE_ROOM[lvl() - 1], f = FPS[fp]; return [b[0] + f.dw, b[1] + f.dd]; };
  const extActive = () => st().fp > 0 || st().fl > 1;
  const area = (fp, fl) => { const b = HOUSE_DEF[lvl() - 1], f = FPS[fp]; return (b.w + f.dw) * (b.d + f.dd) * fl; };
  const baseArea = () => area(0, 1);
  const totalArea = () => area(st().fp, st().fl);
  const extraArea = () => Math.max(0, totalArea() - baseArea());
  const extraValue = () => Math.round(extraArea() * 9000);
  const plan = i => st().floors[i] = st().floors[i] || { name: ROOM_NAMES[(i * 2 - 1) % ROOM_NAMES.length], wall: i % WALLS.length, flr: i % FLOORS.length, layout: 'open', areas: ['ห้องนอนใหญ่', 'ห้องน้ำ', 'ห้องแต่งตัว'], light: 'warm', win: 2 };
  const applyRoom = () => { for (let i = 0; i < ROOM.length; i++) { const f = FPS[st().fp]; ROOM[i] = [BASE_ROOM[i][0] + f.dw, BASE_ROOM[i][1] + f.dd]; } };

  // ================= upper floors as walkable rooms =================
  const hidOf = i => 'main:f' + i;
  const isMain = h => typeof h === 'string' && h.startsWith('main:');
  const floorOfDef = def => def && def.home && isMain(def.home) ? +def.home.slice(6) : 0;
  const syncKinds = () => {
    const [rw, rd] = roomDims(), W = Math.floor(rw), D = Math.floor(rd);
    for (let i = 1; i < st().fl; i++) {
      const p = plan(i), key = 'ownMain' + i;
      ROOM_KIND[key] = { w: W, d: D, floor: (FLOORS[p.flr] || FLOORS[0]).c, wall: (WALLS[p.wall] || WALLS[0]).c, title: `ชั้น ${i + 1} · ${p.name}` };
      const door = World.houseDoor || { x: HOUSE_POS.x, z: HOUSE_POS.z + 8 };
      const po = Prop23.homePoi[hidOf(i)] = Prop23.homePoi[hidOf(i)] || { kind: 'act', x: door.x, z: door.z, r: 1, icon: '🪜' };
      po.x = door.x; po.z = door.z; po.label = ROOM_KIND[key].title;
      po.room = { kind: key, title: ROOM_KIND[key].title, home: hidOf(i), staff: null, service: () => { } };
    }
  };
  const _home = Prop23.home.bind(Prop23);
  Prop23.home = function (id) {
    if (isMain(id)) { const h = st().fh[id] = st().fh[id] || { items: [], boxes: {}, orders: [], util: { e: 1, w: 1 }, seen: 1 }; h.util = h.util || { e: 1, w: 1 }; h.items = h.items || []; h.boxes = h.boxes || {}; h.orders = h.orders || []; return h; }
    return _home(id);
  };
  // furniture may not sit on the staircase block (back-right corner of every upper floor)
  const stairCells = (W, D) => ({ x0: W - 3, x1: W - 1, y0: 0, y1: 3 });
  const _fits = Prop23.fits.bind(Prop23);
  Prop23.fits = function (h, W, D, k, x, y, r) {
    if (!_fits(h, W, D, k, x, y, r)) return false;
    if (isMain(Prop23.plHid)) {
      const sp = HF[k]; if (sp && !sp.floor) { const odd = r % 2, fw = odd ? sp.d : sp.w, fd = odd ? sp.w : sp.d, c = stairCells(W, D); if (x < c.x1 + 1 && x + fw > c.x0 && y < c.y1 + 1 && y + fd > c.y0) return false; }
    }
    return true;
  };

  const mkSign = (g, text, x, y, z, rot, w = 2.6) => {
    const m = new THREE.MeshBasicMaterial({ map: U.signTex(text, { w: 384, h: 80, bg: '#5d4037', fg: '#fff3e0' }) });
    const s = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 80 / 384), m); s.position.set(x, y, z); s.rotation.y = rot; g.add(s); return s;
  };
  const wallBox = (g, cols, X, Z, x, z, w, d, color) => {
    const o = U.mk(g, GEO.box, mc(color, { roughness: 0.9 }), [X + x, 1.7, Z + z], [w, 3.4, d]); cols.push(Col.box(X + x, Z + z, w / 2, d / 2, 0)); return o;
  };
  const upperExtras = (def, K) => {
    const fi = floorOfDef(def), p = plan(fi), g = Rooms.group, X = RM0.x, Z = RM0.z, W = K.w, D = K.d;
    // this floor is reached by the stairs only: no street door, no meter strip of a separate house
    Rooms.pois = Rooms.pois.filter(q => !/ออกจากอาคาร|แผงเบรกเกอร์/.test(q.label || ''));
        // windows on the three solid walls
    const frame = mc(0xffffff, { roughness: 0.5 }), glass = new THREE.MeshBasicMaterial({ color: 0xbfe0f5 });
    const nW = Math.max(1, Math.min(4, p.win | 0 || 2));
    const win = (x, z, r) => { const nx = Math.sin(r) * 0.12, nz = Math.cos(r) * 0.12; U.mk(g, new THREE.PlaneGeometry(1.5, 1.35), frame, [X + x + nx, 1.8, Z + z + nz], 1, [0, r, 0]); U.mk(g, new THREE.PlaneGeometry(1.3, 1.15), glass, [X + x + nx * 1.3, 1.8, Z + z + nz * 1.3], 1, [0, r, 0]); };
    for (let i = 0; i < nW; i++) { const x = -W / 2 + (i + 0.5) * (W - 3.2) / nW + 0.4; win(x, -D / 2, 0); }
    for (let i = 0; i < nW; i++) { const z = -D / 2 + 4.2 + (i + 0.5) * (D - 6) / nW; win(-W / 2, z, Math.PI / 2); win(W / 2, z, -Math.PI / 2); }
    // partitions on cell boundaries (doorways 2 cells wide)
    const ys = Math.round(D / 2), xm = Math.round(W / 2), th = 0.14, doorGap = (a, b, gs, ge) => [[a, gs], [ge, b]];
    const hWall = (y, x0, x1, gapAt) => { const gs = gapAt, ge = gapAt + 2; for (const [a, b] of [[x0, gs], [ge, x1]]) if (b > a) wallBox(g, Rooms.cols, X, Z, -W / 2 + (a + b) / 2, -D / 2 + y, b - a, th, K.wall); };
    const vWall = (x, y0, y1, gapAt) => { const gs = gapAt, ge = gapAt + 2; for (const [a, b] of [[y0, gs], [ge, y1]]) if (b > a) wallBox(g, Rooms.cols, X, Z, -W / 2 + x, -D / 2 + (a + b) / 2, th, b - a, K.wall); };
    const areas = p.areas || [];
    if (p.layout === 'split') {
      hWall(ys, 0, W - 3, Math.max(0, Math.round((W - 3) / 2) - 1));
      mkSign(g, areas[0] || 'ห้อง A', X - W / 2 + 3, 2.7, Z - D / 2 + ys - 0.12, Math.PI); mkSign(g, areas[1] || 'ห้อง B', X - W / 2 + 3, 2.7, Z - D / 2 + ys + 0.12, 0);
    } else if (p.layout === 'rooms3') {
      hWall(ys, 0, W - 3, 1); vWall(xm, ys, D - 1, ys + 1 < D - 3 ? ys + 1 : ys);
      mkSign(g, areas[0] || 'ห้อง A', X - W / 2 + 3, 2.7, Z - D / 2 + ys - 0.12, Math.PI); mkSign(g, areas[1] || 'ห้อง B', X - W / 2 + xm / 2, 2.7, Z - D / 2 + ys + 0.12, 0); mkSign(g, areas[2] || 'ห้อง C', X - W / 2 + xm + (W - xm) / 2, 2.7, Z - D / 2 + ys + 0.12, 0);
    } else if (p.layout === 'corridor') {
      const x1 = Math.round(W / 3), x2 = Math.round(W * 2 / 3) - 1;
      vWall(x1, 0, D - 1, Math.round(D / 2) - 1); vWall(x2, 4, D - 1, Math.round(D / 2));
      mkSign(g, areas[0] || 'ห้อง A', X - W / 2 + x1 / 2, 2.7, Z - D / 2 + 0.15, 0); mkSign(g, areas[1] || 'ห้อง B', X - W / 2 + (x1 + x2) / 2, 2.7, Z - D / 2 + 0.15, 0, 2.2); mkSign(g, areas[2] || 'ห้อง C', X - W / 2 + x2 + 2.2, 2.7, Z - D / 2 + 0.15, 0, 2.2);
    }
    mkSign(g, `ชั้น ${fi + 1} · ${p.name}`, X - W / 4, 3.05, Z + D / 2 - 0.1, Math.PI, 3.4);
    // staircase against the back-right corner (steps rise toward the back wall) + the way down
    const sx = X + W / 2 - 1.0, z0 = Z - D / 2 + 3.2, steps = 9, wood = mc(0x8a5a32, { roughness: 0.7 });
    for (let i = 0; i < steps; i++) U.mk(g, GEO.box, wood, [sx, (i + 1) * 0.32 / 2, z0 - i * 0.3 - 0.15], [1.6, (i + 1) * 0.32, 0.3]);
    U.mk(g, GEO.box, mc(0x5d4037), [sx - 0.85, 1.0, z0 - 1.3], [0.06, 1.2, 2.9], [0.0, 0, 0]);
    Rooms.cols.push(Col.box(sx, z0 - 1.35, 0.85, 1.5, 0));
    if (fi < st().fl - 1) Rooms.pois.push({ kind: 'act', x: sx, z: z0 + 0.7, r: 1.3, label: `ขึ้นไปชั้น ${fi + 2}`, icon: '🪜', act: () => ({ icon: '🪜', label: `ขึ้นบันไดไปชั้น ${fi + 2}`, fn: () => goFloor(fi + 1) }) });
    Rooms.pois.push({ kind: 'act', x: sx - 1.9, z: z0 - 1.0, r: 1.3, label: `ลงไปชั้น ${fi}`, icon: '⬇️', act: () => ({ icon: '⬇️', label: `ลงบันไดไปชั้น ${fi}`, fn: () => goFloor(fi - 1) }) });
    if (st().lift) Rooms.pois.push({ kind: 'act', x: sx - 1.9, z: z0 + 0.8, r: 1.2, label: 'ลิฟต์บ้าน', icon: '🛗', act: () => ({ icon: '🛗', label: 'ใช้ลิฟต์บ้าน (เลือกชั้น)', fn: () => liftUI(fi) }) });
    U.mk(g, GEO.box, mc(0xb0bec5, { metalness: 0.5, roughness: 0.4 }), [sx - 1.9, 1.2, z0 + 1.55], [1.1, 2.4, 0.12]);
    // lighting
    const L = LIGHTS[p.light] || LIGHTS.warm; Rooms.amb.color.set(L[2]);
    World.inPois = Rooms.pois;
  };
  { const _rb = Rooms.build.bind(Rooms);
    Rooms.build = function (def, K) {
      if (Rooms.amb && !(def.home && isMain(def.home))) Rooms.amb.color.set(0xfff4e0);
      _rb(def, K);
      if (def.home && isMain(def.home)) { try { upperExtras(def, K); } catch (e) { console.warn('v36 floor', e); } }
    };
  }
  const liftUI = from => {
    UI.open('ลิฟต์บ้าน', null, () => `<p class="lead">เลือกชั้นที่ต้องการไป (ชั้นปัจจุบัน ${from + 1})</p><div class="row">${Array.from({ length: st().fl }, (_, i) => `<button class="btn ${i === from ? 'ghost' : ''}" data-a="v36hgo" data-v="${i}" ${i === from ? 'disabled' : ''}>ชั้น ${i + 1}</button>`).join('')}</div>`);
  };

  // arrival spots
  const upArrive = () => { const [rw, rd] = roomDims(), W = Math.floor(rw), D = Math.floor(rd); return { x: RM0.x + W / 2 - 1.0, z: RM0.z - D / 2 + 4.5 }; };
  const poll = fn => { let n = 0; const t = setInterval(() => { try { if (++n > 80 || fn()) clearInterval(t); } catch (e) { clearInterval(t); } }, 60); };
  const standGround = () => {
    const s = World.v36stair, r = World.room; const sp = s ? { x: s.ax, z: s.az } : { x: IN.x, z: IN.z + r.d / 2 - 1.3 };
    G.player.pos.set(sp.x, IN.y, sp.z); G.player.rot = Math.PI; snapCam();
  };
  function goFloor(i) {
    UI.close();
    if (i === 0) {
      if (!G.inRoom) return;
      fade(() => { Rooms.leave(true); setInside(true); standGround(); });
      return;
    }
    if (i < 0 || i >= st().fl) return;
    syncKinds();
    const poi = Prop23.homePoi[hidOf(i)];
    if (G.inRoom && Rooms.cur && floorOfDef(Rooms.cur.def)) {
      fade(() => { const def = poi.room, K = ROOM_KIND[def.kind]; Rooms.cur.def = def; Rooms.build(def, K); World.room = { w: K.w, d: K.d }; World.inPois = Rooms.pois; const a = upArrive(); G.player.pos.set(a.x, 0, a.z); G.player.rot = Math.PI; snapCam(); });
    } else if (G.inside && !G.inRoom) {
      Rooms.enter(poi);
      poll(() => { if (G.inRoom && Rooms.cur && floorOfDef(Rooms.cur.def) === i && Rooms.group.visible) { const a = upArrive(); G.player.pos.set(a.x, 0, a.z); G.player.rot = Math.PI; snapCam(); return true; } return false; });
    }
  }

  // ================= main interior: staircase against a free wall =================
  const addMainStairs = lv => {
    World.v36stair = null;
    if (st().fl <= 1) return;
    const g = World.interior, [w, d] = ROOM[lv - 1], L = 2.6, hw = 0.7;
    const free = (cx, cz, th) => {   // footprint + approach in local frame (wall at local z = 0, room toward +z)
      for (let lx = -hw; lx <= hw + 0.01; lx += 0.35) for (let lz = 0.1; lz <= L + 1.0; lz += 0.4) {
        const p = l2w(cx, cz, th, lx, lz); if (Math.abs(p.x - IN.x) > w / 2 - 0.3 || Math.abs(p.z - IN.z) > d / 2 - 0.3) return false;
        if (typeof Collide !== 'undefined' && Collide.covered(p.x, p.z)) return false;
        if (Math.hypot(p.x - IN.x, p.z - (IN.z + d / 2 - 0.5)) < 1.6) return false;
      }
      return true;
    };
    const cands = [];
    for (let z = -d / 2 + 2.0; z <= d / 2 - 3.6; z += 0.7) { cands.push([IN.x + w / 2, IN.z + z, -Math.PI / 2]); cands.push([IN.x - w / 2, IN.z + z, Math.PI / 2]); }
    for (let x = -w / 2 + 2.2; x <= w / 2 - 2.2; x += 0.6) cands.push([IN.x + x, IN.z - d / 2, 0]);
    let at = cands.find(c => free(c[0], c[1], c[2]));
    if (!at) at = [IN.x + w / 2, IN.z - d / 2 + 5.5, -Math.PI / 2];
    const [cx, cz, th] = at, grp = new THREE.Group(); grp.position.set(cx - IN.x, 0, cz - IN.z); grp.rotation.y = th; g.add(grp);
    const wood = mc(0x8a5a32, { roughness: 0.7 }), steps = 9;
    for (let i = 0; i < steps; i++) U.mk(grp, GEO.box, wood, [0, (i + 1) * 0.31 / 2, L - i * (L / steps) - L / steps / 2], [hw * 2, (i + 1) * 0.31, L / steps]);
    for (const s of [-1, 1]) U.mk(grp, GEO.box, mc(0x5d4037), [s * (hw + 0.04), 1.1, L / 2], [0.06, 1.4, L]);
    U.mk(grp, GEO.box, mc(0x2a2420), [0, 2.95, 0.3], [hw * 2, 0.1, 0.6]);
    World.inCols.push(Col.box(...(() => { const p = l2w(cx, cz, th, 0, L / 2); return [p.x, p.z, hw + 0.05, L / 2, th]; })()));
    const b = l2w(cx, cz, th, 0, L + 0.5), a = l2w(cx, cz, th, 0, L + 1.0);
    World.v36stair = { ax: a.x, az: a.z };
    World.inPois.push({ kind: 'act', x: b.x, z: b.z, r: 1.3, label: 'บันไดขึ้นชั้น 2', icon: '🪜', act: () => ({ icon: '🪜', label: 'ขึ้นบันไดไปชั้น 2', fn: () => goFloor(1) }) });
    if (st().lift) { const q = l2w(cx, cz, th, 1.8, L + 0.2); World.inPois.push({ kind: 'act', x: q.x, z: q.z, r: 1.2, label: 'ลิฟต์บ้าน', icon: '🛗', act: () => ({ icon: '🛗', label: 'ใช้ลิฟต์บ้าน (เลือกชั้น)', fn: () => liftUI(0) }) }); }
  };
  { const _bi = World.buildInterior.bind(World);
    World.buildInterior = function (lv, S2, moving) { applyRoom(); _bi(lv, S2, moving); try { addMainStairs(lv); } catch (e) { console.warn('v36 stairs', e); } };
  }

  // ================= exterior =================
  let extG = null, scaf = null;
  const spread = (n, len, skip) => { const a = []; for (let i = 0; i < n; i++) { const x = -len / 2 + (i + 0.5) * len / n; if (!skip || Math.abs(x) > skip) a.push(+x.toFixed(2)); } return a; };
  const buildExt = lv => {
    const { w: W, d: D, o } = dims(), n = st().fl, hg = World.houseGroup;
    while (hg.children.length) hg.remove(hg.children[0]);
    World.winMeshes = [];
    const tmp = new THREE.Group(), H = 3.3, base = 0.4, SL = 0.35;
    const fz = Math.max(2, Math.round(W / 3.4)), sz = Math.max(1, Math.round(D / 3.6)), bz = Math.max(2, Math.round(W / 3.4));
    const g0 = Object.assign({ door: 0x7a3f22 }, o, { w: W, d: D, winF: spread(fz, W - 2, 1.5), winS: spread(sz, D - 1.5), winB: spread(bz, W - 2), porch: o.porch, roofH: o.roofH + (D - o.d) * 0.3 });
    if (n > 1) Object.assign(g0, { h: H, rows: 1, flat: true, chimney: false, balcony: false });
    tmp.add(World.building(g0));
    let roofTop = n > 1 ? base + H + SL : base + (o.h || 3.2) + (o.roofH || 2.5);
    if (n > 1) {
      const wallM = texMat(o.wallTex || 'plaster', o.wall ?? 0xf2e8d5, { roughness: 0.9 }), slabM = texMat('plaster', o.roof ?? 0xe5e1d8), railM = mc(0xeceff1, { roughness: 0.4 });
      for (let k = 1; k < n; k++) {
        const y0 = base + k * (H + SL);
        U.mk(tmp, U.box(W, H, D, 3), wallM, [0, y0 + H / 2, 0]);
        for (const sx of [-1, 1]) for (const sz2 of [-1, 1]) U.mk(tmp, GEO.box, M.trim, [sx * W / 2, y0 + H / 2, sz2 * D / 2], [0.16, H, 0.16]);
        U.mk(tmp, U.box(W + 0.5, SL, D + 0.5, 3), slabM, [0, y0 + H + SL / 2, 0]);
        const wopt = { shutter: o.shutter, w: 1.5, h: 1.45 };
        for (const x of spread(fz, W - 2)) addWindow(tmp, x, y0 + 1.65, D / 2, 0, wopt);
        for (const x of spread(bz, W - 2)) addWindow(tmp, x, y0 + 1.65, -D / 2, Math.PI, wopt);
        for (const z of spread(sz, D - 1.5)) { addWindow(tmp, W / 2, y0 + 1.65, z, Math.PI / 2, wopt); addWindow(tmp, -W / 2, y0 + 1.65, z, -Math.PI / 2, wopt); }
        // front balcony on every upper floor
        const bw = Math.min(W * 0.55, 7);
        U.mk(tmp, U.box(bw, 0.18, 1.5, 2), M.stone, [0, y0 + 0.04, D / 2 + 0.75]);
        for (let i = 0; i <= 8; i++) U.mk(tmp, GEO.cylLo, railM, [-bw / 2 + 0.05 + i * (bw - 0.1) / 8, y0 + 0.62, D / 2 + 1.45], [0.03, 1.0, 0.03]);
        U.mk(tmp, GEO.box, railM, [0, y0 + 1.12, D / 2 + 1.45], [bw, 0.06, 0.06]);
        for (const sx of [-1, 1]) U.mk(tmp, GEO.box, railM, [sx * bw / 2, y0 + 1.12, D / 2 + 0.75], [0.06, 0.06, 1.4]);
      }
      // roof terrace: parapet, stair hut, water tank
      const ty = base + n * (H + SL);
      for (const sz2 of [-1, 1]) U.mk(tmp, GEO.box, slabM, [0, ty + 0.45, sz2 * (D / 2 + 0.2)], [W + 0.5, 0.9, 0.18]);
      for (const sx of [-1, 1]) U.mk(tmp, GEO.box, slabM, [sx * (W / 2 + 0.2), ty + 0.45, 0], [0.18, 0.9, D + 0.5]);
      U.mk(tmp, U.box(2.4, 2.4, 2.4, 2), wallM, [W / 2 - 2, ty + 1.2, -D / 2 + 1.8]); U.mk(tmp, GEO.box, slabM, [W / 2 - 2, ty + 2.5, -D / 2 + 1.8], [2.8, 0.18, 2.8]);
      U.mk(tmp, GEO.cyl, mc(0x607d8b, { roughness: 0.5, metalness: 0.4 }), [-W / 2 + 1.5, ty + 0.9, -D / 2 + 1.5], [0.9, 1.5, 0.9]);
      roofTop = ty;
    }
    // porch / front garden railing as the original level-2+ house had
    if (lv >= 2) {
      for (const s of [-1, 1]) {
        const x0 = s * (o.porch / 2 + 0.3), x1 = s * (W / 2 + 1.2);
        for (let i = 0; i <= 6; i++) U.mk(tmp, GEO.box, M.trim, [U.lerp(x0, x1, i / 6), 0.45, D / 2 + 2.6], [0.1, 0.9, 0.05]);
        U.mk(tmp, GEO.box, M.trim, [(x0 + x1) / 2, 0.6, D / 2 + 2.6], [Math.abs(x1 - x0), 0.08, 0.05]);
      }
      const bush = mc(0x3f7f2c, { roughness: 0.9 });
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) U.mk(tmp, GEO.sph, bush, [s * (o.porch / 2 + 0.9 + i * 1.1), 0.45, D / 2 + 1.2], [0.6, 0.5, 0.55]);
    }
    const cz = czOf(), merged = U.mergeByMaterial(tmp), hw = []; World.harvestWindows(hw, HOUSE_POS.x, cz);
    if (World.houseGlow) { World.scene.remove(World.houseGlow); const i = World.glows.win.indexOf(World.houseGlow); if (i >= 0) World.glows.win.splice(i, 1); }
    World.houseGlow = World.glowPoints(hw, 0xffc56e, 1.7); World.glows.win.push(World.houseGlow);
    merged.position.set(HOUSE_POS.x, 0, cz); hg.add(merged);
    Col.remove(World.houseCol); World.houseCol = Col.box(HOUSE_POS.x, cz, W / 2 + 0.25, D / 2 + 0.25);
    World.pois = World.pois.filter(p => p.kind !== 'door');
    World.pois.push({ kind: 'door', x: HOUSE_POS.x, z: cz + D / 2 + 1.4, r: 2.0, label: 'บ้านของคุณ', icon: '🏡', map: true });
    World.houseDoor = { x: HOUSE_POS.x, z: cz + D / 2 + 2.4 };
    World.v36 = { W, D, n, roofTop, cz };
    return merged;
  };
  { const _bh = World.buildHouse.bind(World);
    World.buildHouse = function (lv) { if (!extActive()) { World.v36 = null; return _bh(lv); } buildExt(lv); try { if (typeof Power !== 'undefined' && Power.visual) Power.visual(); } catch (e) { } };
  }
  // roof solar panels follow the real roof (flat roof terrace on a multi-storey house)
  if (typeof Power !== 'undefined' && Power.visual) {
    const _v = Power.visual.bind(Power);
    Power.visual = function () {
      _v();
      try {
        const v = World.v36, g = this.g; if (!v || v.n < 2 || !g) return;
        for (const c of g.children) if (c.isGroup && Math.abs(c.rotation.x) > 0.05 && Math.abs(c.position.x - HOUSE_POS.x) < 0.01) { c.rotation.x = 0.3; c.position.set(HOUSE_POS.x, v.roofTop + 0.75, v.cz + 0.2); }
      } catch (e) { }
    };
  }
  const clearAround = () => { try { const { W, D } = dims(); World.clearNear(HOUSE_POS.x, czOf() + 1, Math.max(W, D) / 2 + 5, true); } catch (e) { } };

  // scaffolding while a project is running
  const drawScaffold = () => {
    if (scaf) { World.outdoor.remove(scaf); scaf = null; }
    const x = st(), pr = x.proj; if (!pr || S.day >= pr.done) return;
    const o = baseDef(), f = FPS[pr.t === 'fp' ? pr.to : x.fp], W = o.w + f.dw + 1.6, D = o.d + f.dd + 1.6, n = pr.t === 'fl' ? pr.to : x.fl, Hh = Math.max(7, n * 3.65 + 1.5);
    const g = new THREE.Group(); g.position.set(HOUSE_POS.x, 0, HOUSE_POS.z - ((o.d + f.dd) - o.d) / 2); World.outdoor.add(g); scaf = g;
    const pole = mc(0xb0bec5, { roughness: 0.5, metalness: 0.5 }), plank = mc(0xa1887f, { roughness: 0.8 }), net = new THREE.MeshBasicMaterial({ color: 0x66bb6a, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false });
    const post = (px, pz) => U.mk(g, GEO.cylLo, pole, [px, Hh / 2, pz], [0.06, Hh, 0.06]);
    for (let i = 0; i <= Math.round(W / 2.2); i++) { const px = -W / 2 + i * W / Math.round(W / 2.2); post(px, D / 2); post(px, -D / 2); }
    for (let i = 1; i < Math.round(D / 2.2); i++) { const pz = -D / 2 + i * D / Math.round(D / 2.2); post(-W / 2, pz); post(W / 2, pz); }
    for (let y = 3.5; y < Hh; y += 3.5) { U.mk(g, GEO.box, plank, [0, y, D / 2], [W, 0.08, 0.5]); U.mk(g, GEO.box, plank, [0, y, -D / 2], [W, 0.08, 0.5]); U.mk(g, GEO.box, plank, [W / 2, y, 0], [0.5, 0.08, D]); U.mk(g, GEO.box, plank, [-W / 2, y, 0], [0.5, 0.08, D]); }
    for (const [px, pz, r, len] of [[0, D / 2 + 0.02, 0, W], [0, -D / 2 - 0.02, 0, W], [W / 2 + 0.02, 0, Math.PI / 2, D], [-W / 2 - 0.02, 0, Math.PI / 2, D]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(len, Hh - 0.6), net); m.position.set(px, Hh / 2 + 0.2, pz); m.rotation.y = r; g.add(m); }
    // a cement mixer and a stack of bricks so it looks like a worksite
    U.mk(g, GEO.box, mc(0xc0392b, { roughness: 0.7 }), [W / 2 + 1.5, 0.45, D / 2 + 1.2], [1.0, 0.9, 0.8]);
    U.mk(g, GEO.box, mc(0xbf6a3a, { roughness: 0.9 }), [-W / 2 - 1.5, 0.3, D / 2 + 1.2], [1.2, 0.6, 0.8]);
  };

  // ================= costs, requirements, projects =================
  const costFp = to => { const o = baseDef(), a = FPS[st().fp], b = FPS[to], add = (o.w + b.dw) * (o.d + b.dd) - (o.w + a.dw) * (o.d + a.dd); return Math.round(add * st().fl * RATE * 1.08 + ENG); };
  const costFl = to => { const a = area(st().fp, 1); return Math.round(a * RATE + ENG + (to >= 3 ? PILE3 : 0) + (to >= 4 ? PILE4 : 0)); };
  const daysFp = to => { const o = baseDef(), a = FPS[st().fp], b = FPS[to], add = (o.w + b.dw) * (o.d + b.dd) - (o.w + a.dw) * (o.d + a.dd); return Math.ceil(add * st().fl / 16) + 6; };
  const daysFl = to => Math.ceil(area(st().fp, 1) / 22) + 8 + (to >= 3 ? 6 : 0);
  const reqFp = to => { const x = st(); if (x.proj) return 'มีงานก่อสร้างอยู่ระหว่างดำเนินการ'; if (to !== x.fp + 1) return x.fp >= to ? 'ขยายแล้ว' : 'ต้องขยายตามลำดับขั้น'; if (lvl() < 2) return 'ต้องอัปเกรดบ้านถึงระดับ 2 ก่อน (ร้านช่างไม้)'; return ''; };
  const reqFl = to => { const x = st(); if (x.proj) return 'มีงานก่อสร้างอยู่ระหว่างดำเนินการ'; if (to !== x.fl + 1) return x.fl >= to ? 'สร้างแล้ว' : 'ต้องต่อเติมทีละชั้น'; if (lvl() < 2) return 'ต้องอัปเกรดบ้านถึงระดับ 2 ก่อน'; if (to >= 3 && (lvl() < 3 || x.fp < 1)) return 'ชั้น 3 ต้องมีบ้านระดับ 3 และขยายพื้นที่แล้วอย่างน้อย 1 ขั้น (ฐานรากรับน้ำหนัก)'; if (to >= 4 && x.fp < 2) return 'ชั้น 4 ต้องขยายพื้นที่แล้วอย่างน้อย 2 ขั้น'; return ''; };
  const permitOK = () => { try { return Gov24.has('buildext'); } catch (e) { return false; } };
  const PERMIT_FEE = 3200, PERMIT_DAYS = 5;
  const filePermit = () => {
    const x = st();
    if (x.permit) { UI.toast('ยื่นคำขอไว้แล้ว รอผลการพิจารณา', '📜'); return; }
    if (permitOK()) { UI.toast('มีใบอนุญาตที่ยังไม่หมดอายุอยู่แล้ว', '📜'); return; }
    if (x.proj) { UI.toast('มีงานก่อสร้างอยู่ระหว่างดำเนินการ', '🏗️'); return; }
    if (lvl() < 2) { UI.toast('ต้องอัปเกรดบ้านเป็นระดับ 2 ขึ้นไปก่อน (ร้านช่างไม้)', '🏗️'); return; }
    if (typeof Gov24 !== 'undefined' && !Gov24.need(['idcard', 'housereg'], 'ขออนุญาตดัดแปลง/ต่อเติมอาคาร')) return;
    if (S.money < PERMIT_FEE) { UI.toast(`เงินไม่พอค่าธรรมเนียม ${baht(PERMIT_FEE)}`, '💸'); return; }
    S.money -= PERMIT_FEE; try { Bank2.log('ค่าธรรมเนียมขออนุญาตดัดแปลงอาคาร', -PERMIT_FEE); } catch (e) { }
    x.permit = { day: S.day, due: S.day + PERMIT_DAYS };
    UI.toast(`ยื่นขออนุญาตแล้ว รอ ${PERMIT_DAYS} วัน`, '📜');
    msg('เทศบาลตำบลสุขใจ (กองช่าง)', `รับคำขออนุญาตดัดแปลง/ต่อเติมอาคาร (บ้านหลัก) ชำระ ${baht(PERMIT_FEE)} ผลการพิจารณา${RD(x.permit.due)}`);
  };
  const decidePermit = () => {
    const x = st(), pm = x.permit; if (!pm || S.day < pm.due) return;
    x.permit = null;
    try {
      const g = Gov24.st(); g.n = (g.n || 0) + 1;
      g.docs.buildext = { no: `BEX-${String(S.day).padStart(4, '0')}-${String(g.n).padStart(3, '0')}`, issued: S.day, exp: S.day + YD, data: {} };
    } catch (e) { return; }
    msg('เทศบาลตำบลสุขใจ (กองช่าง)', 'อนุมัติใบอนุญาตดัดแปลง/ต่อเติมอาคารแล้ว เริ่มจ้างผู้รับเหมาได้ที่แอป "🏗️ ต่อเติมบ้านหลัก" (ใช้ได้ 1 งาน ภายใน 1 ปีเกม)');
    UI.toast('ได้ใบอนุญาตต่อเติมอาคารแล้ว', '📜');
  };
  const startProject = (t, to) => {
    const x = st(), why = t === 'fp' ? reqFp(to) : reqFl(to); if (why) { UI.toast(why, '🏗️'); return; }
    if (typeof Gov24 !== 'undefined' && !Gov24.need(['idcard', 'housereg', 'buildext'], 'ต่อเติมบ้านหลัก (ใบอนุญาตดัดแปลงอาคาร)')) return;
    const cost = t === 'fp' ? costFp(to) : costFl(to); if (S.money < cost) { UI.toast(`เงินไม่พอ ต้องใช้ ${baht(cost)}`, '💸'); return; }
    S.money -= cost; try { Bank2.log(t === 'fp' ? 'ค่าก่อสร้างขยายพื้นที่บ้านหลัก' : `ค่าก่อสร้างต่อเติมเป็น ${to} ชั้น`, -cost); } catch (e) { }
    try { delete Gov24.st().docs.buildext; } catch (e) { }
    const days = t === 'fp' ? daysFp(to) : daysFl(to);
    x.proj = { t, to, start: S.day, done: S.day + days, cost }; x.spent += cost;
    drawScaffold(); UI.toast(`เริ่มก่อสร้าง ใช้เวลา ${days} วัน (เสร็จ${RD(S.day + days)})`, '🏗️');
    msg('ผู้รับเหมาบ้านสุขใจ', `เริ่มงาน${t === 'fp' ? 'ขยายพื้นที่บ้าน' : `ต่อเติมเป็น ${to} ชั้น`} งบ ${baht(cost)} นัดส่งมอบ${RD(S.day + days)} ตอนนี้ตั้งนั่งร้านรอบบ้านแล้ว`);
    try { if (typeof Diary31 !== 'undefined') Diary31.log('🏗️', `เริ่มต่อเติมบ้านหลัก`, `${t === 'fp' ? FPS[to].n : to + ' ชั้น'} · ${baht(cost)}`, 'home', 'v36:' + t + ':' + to); } catch (e) { }
  };
  const finishProject = () => {
    const x = st(), pr = x.proj; if (!pr) return;
    if (pr.t === 'fp') x.fp = pr.to; else { x.fl = pr.to; plan(pr.to - 1); }
    x.proj = null; applyRoom(); syncKinds();
    World.buildHouse(lvl()); World.buildInterior(lvl(), S); clearAround(); drawScaffold();
    if (G.inside && !G.inRoom) setInside(true);
    const { w, d } = dims();
    msg('ผู้รับเหมาบ้านสุขใจ', `ส่งมอบงานต่อเติมบ้านหลักเรียบร้อย! ตอนนี้บ้านกว้าง ${w.toFixed(1)}×${d.toFixed(1)} ม. สูง ${x.fl} ชั้น (พื้นที่ใช้สอยรวม ${Math.round(totalArea())} ตร.ม.)`);
    UI.toast('งานต่อเติมบ้านเสร็จแล้ว!', '🏡');
    try { Sfx.tone(660, 0.3, 'sine', 0.06, 990); } catch (e) { }
    try { if (typeof Diary31 !== 'undefined') Diary31.log('🏡', 'ต่อเติมบ้านหลักเสร็จ', `${x.fl} ชั้น · ${Math.round(totalArea())} ตร.ม.`, 'home', 'v36:done:' + x.fp + ':' + x.fl); } catch (e) { }
  };

  // ================= phone app / carpenter UI =================
  const E = { gold: '#ffcf3f' };
  const card = (i, h, p, btn) => `<div class="card"><div class="ci">${i}</div><div class="cb"><h4>${h}</h4><p class="dim">${p}</p>${btn ? `<div class="row">${btn}</div>` : ''}</div></div>`;
  const tab0 = () => {
    const x = st(), { w, d } = dims(), pr = x.proj, permit = permitOK(), o = baseDef();
    const info = `<p class="lead">🏡 บ้านหลักของคุณตอนนี้ กว้าง ${w.toFixed(1)} × ลึก ${d.toFixed(1)} ม. · ${x.fl} ชั้น · พื้นที่ใช้สอยรวม ${Math.round(totalArea())} ตร.ม. (ระดับบ้าน ${lvl()}/3)</p>`;
    const proj = pr ? card('🏗️', `กำลังก่อสร้าง: ${pr.t === 'fp' ? FPS[pr.to].n : 'ต่อเติมเป็น ' + pr.to + ' ชั้น'}`, `ชำระแล้ว ${baht(pr.cost)} · เริ่ม${RD(pr.start)} · ส่งมอบ${RD(pr.done)} (อีก ${Math.max(0, pr.done - S.day)} วัน) · มีนั่งร้านรอบบ้านระหว่างก่อสร้าง`) : '';
    const perm = card('📜', permit ? 'ใบอนุญาตดัดแปลงอาคาร: ผ่านแล้ว ✅' : x.permit ? `ใบอนุญาตดัดแปลงอาคาร: รอพิจารณา ⏳ (ผล${RD(x.permit.due)})` : 'ใบอนุญาตดัดแปลงอาคาร: ยังไม่มี', permit ? 'ใช้ได้กับงานก่อสร้างครั้งถัดไป 1 งาน (ดูในกระเป๋าเอกสาร 🏛️ ราชการ)' : `ต้องยื่นที่เทศบาล (กองช่าง) ค่าธรรมเนียม ${baht(PERMIT_FEE)} รอ ${PERMIT_DAYS} วัน ต้องมีบัตรประชาชนและทะเบียนบ้านที่ยังไม่หมดอายุ`, permit || x.permit ? '' : `<button class="btn" data-a="v36hfile" ${S.money < PERMIT_FEE ? 'disabled' : ''}>📜 ยื่นขออนุญาต ${baht(PERMIT_FEE)}</button>`);
    const fpc = FPS.slice(1).map((f, i) => { const to = i + 1, why = reqFp(to); return card(x.fp >= to ? '✅' : '↔️', f.n, `พื้นที่บ้านรวม ${Math.round((o.w + f.dw) * (o.d + f.dd))} ตร.ม. ต่อชั้น · ค่าก่อสร้างโดยประมาณ ${x.fp >= to ? '-' : baht(costFp(to))} (ตร.ม.ละ ${baht(RATE)} + ค่าออกแบบ/วิศวกร ${baht(ENG)}) · ใช้เวลา ${x.fp >= to ? '-' : daysFp(to) + ' วัน'}${why && x.fp < to ? `<br>⚠️ ${why}` : ''}`, x.fp >= to ? '' : `<button class="btn" data-a="v36hstart" data-t="fp" data-to="${to}" ${why || S.money < costFp(to) ? 'disabled' : ''}>เริ่มก่อสร้าง ${baht(costFp(to))}</button>`); }).join('');
    const flc = [2, 3, 4].map(to => { const why = reqFl(to); return card(x.fl >= to ? '✅' : '🏢', `ต่อเติมเป็น ${to} ชั้น`, `เพิ่มพื้นที่ใช้สอย ${Math.round(area(x.fp, 1))} ตร.ม. · ค่าก่อสร้างโดยประมาณ ${x.fl >= to ? '-' : baht(costFl(to))}${to >= 3 ? ` (รวมเสาเข็ม/ตอม่อเสริม ${baht(to >= 4 ? PILE3 + PILE4 : PILE3)})` : ''} · ใช้เวลา ${x.fl >= to ? '-' : daysFl(to) + ' วัน'}${why && x.fl < to ? `<br>⚠️ ${why}` : ''}`, x.fl >= to ? '' : `<button class="btn" data-a="v36hstart" data-t="fl" data-to="${to}" ${why || S.money < costFl(to) ? 'disabled' : ''}>เริ่มก่อสร้าง ${baht(costFl(to))}</button>`); }).join('');
    const lift = x.fl >= 3 ? card('🛗', x.lift ? 'ลิฟต์บ้าน: ติดตั้งแล้ว' : 'ติดตั้งลิฟต์บ้าน', `ขึ้นลงทุกชั้นได้สะดวก ${baht(LIFT)} (ติดตั้งทันที)`, x.lift ? '' : `<button class="btn" data-a="v36hlift" ${S.money < LIFT ? 'disabled' : ''}>ติดตั้ง ${baht(LIFT)}</button>`) : '';
    return `${info}${proj}${perm}<h5>ขั้นที่ 1 · ขยายพื้นที่ (กว้าง/ลึกขึ้น)</h5><div class="grid">${fpc}</div><h5>ขั้นที่ 2 · เพิ่มจำนวนชั้น (สูงสุด 4 ชั้น)</h5><div class="grid">${flc}${lift}</div><p class="dim">ขั้นตอนจริง: ยื่นขออนุญาต → จ้างผู้รับเหมา (จ่ายทั้งหมดตอนเริ่ม) → ก่อสร้างตามกำหนด → ส่งมอบ เฟอร์นิเจอร์ที่วางไว้เดิมคงอยู่ ชั้นบนเป็นห้องว่างให้สั่งเฟอร์นิเจอร์จากแคตตาล็อกในคอมพิวเตอร์หรือที่ชั้นนั้น</p>`;
  };
  const tab1 = () => {
    const x = st(); if (x.fl <= 1) return `<p class="lead">ยังไม่มีชั้นบน ต่อเติมเป็น 2 ชั้นขึ้นไปก่อน แล้วค่อยออกแบบห้องแต่ละชั้นที่นี่</p><p class="dim">ชั้นล่าง (ชั้น 1) ตกแต่งผ่านเมนู "ตกแต่งภายในบ้าน" ในตู้เสื้อผ้า/ช่างไม้ตามเดิม</p>`;
    const rows = [];
    for (let i = 1; i < x.fl; i++) {
      const p = plan(i), pick = (k, arr, cur, fmt) => arr.map((v, j) => `<button class="btn ${cur === (k === 'name' ? v : j) ? '' : 'ghost'}" data-a="v36hset" data-f="${i}" data-k="${k}" data-v="${k === 'name' ? v : j}" style="padding:4px 8px;font-size:12px">${fmt(v, j)}</button>`).join('');
      rows.push(`<div class="card"><div class="ci">🪜</div><div class="cb"><h4>ชั้น ${i + 1} · ${esc(p.name)}</h4>
        <p class="dim">ชื่อห้อง/การใช้งาน</p><div class="row" style="flex-wrap:wrap">${pick('name', ROOM_NAMES, p.name, v => v)}</div>
        <p class="dim">สีผนัง</p><div class="row">${pick('wall', WALLS, p.wall, v => v.n)}</div>
        <p class="dim">พื้น</p><div class="row">${pick('flr', FLOORS, p.flr, v => v.n)}</div>
        <p class="dim">ผนังกั้นห้อง</p><div class="row" style="flex-wrap:wrap">${Object.entries(LAYOUTS).map(([k, t]) => `<button class="btn ${p.layout === k ? '' : 'ghost'}" data-a="v36hset" data-f="${i}" data-k="layout" data-v="${k}" style="padding:4px 8px;font-size:12px">${t}</button>`).join('')}</div>
        ${p.layout !== 'open' ? `<p class="dim">ชื่อห้องที่แบ่ง</p>${[0, 1, 2].slice(0, p.layout === 'split' ? 2 : 3).map(a => `<div class="row" style="flex-wrap:wrap"><small>ห้อง ${'ABC'[a]}:</small>${ROOM_NAMES.slice(0, 8).map(n => `<button class="btn ${p.areas[a] === n ? '' : 'ghost'}" data-a="v36hset" data-f="${i}" data-k="area${a}" data-v="${n}" style="padding:2px 6px;font-size:11px">${n}</button>`).join('')}</div>`).join('')}` : ''}
        <p class="dim">แสงไฟ</p><div class="row">${Object.entries(LIGHTS).map(([k, v]) => `<button class="btn ${p.light === k ? '' : 'ghost'}" data-a="v36hset" data-f="${i}" data-k="light" data-v="${k}" style="padding:4px 8px;font-size:12px">${v[0]} ${v[1]}</button>`).join('')}</div>
        <p class="dim">หน้าต่างต่อผนัง</p><div class="row">${[1, 2, 3, 4].map(n => `<button class="btn ${p.win === n ? '' : 'ghost'}" data-a="v36hset" data-f="${i}" data-k="win" data-v="${n}" style="padding:4px 8px;font-size:12px">${n}</button>`).join('')}</div>
        <p class="dim">ตกแต่ง/วางเฟอร์นิเจอร์ได้เมื่อเดินขึ้นไปที่ชั้นนี้ (กดบันไดในบ้าน) ผนังกั้นห้องเปลี่ยนได้ฟรี เฟอร์นิเจอร์ที่ขวางจะถูกเก็บเข้ากล่อง</p></div></div>`);
    }
    return `<p class="lead">ออกแบบห้องแต่ละชั้นเอง: ชื่อห้อง สีผนัง พื้น ผนังกั้นห้อง แสงไฟ และหน้าต่าง</p><div class="grid">${rows.join('')}</div>`;
  };
  const tab2 = () => {
    const x = st(), ea = extraArea(), kw = ea * 0.0035, m3 = ea * 0.0006, ptax = Math.round(extraValue() * 0.0003), ins = Math.round(extraValue() * 0.0004);
    return `<p class="lead">สรุปบ้านหลักหลังต่อเติม</p><div class="grid">
      ${card('📐', 'พื้นที่', `ต่อชั้น ${Math.round(area(x.fp, 1))} ตร.ม. × ${x.fl} ชั้น = รวม ${Math.round(totalArea())} ตร.ม. (เดิม ${Math.round(baseArea())} ตร.ม.)`)}
      ${card('💰', 'มูลค่าส่วนต่อเติม', `ประมาณ ${baht(extraValue())} · ลงทุนต่อเติมไปแล้ว ${baht(x.spent)}`)}
      ${card('⚡', 'ไฟฟ้าและน้ำที่เพิ่ม', `ใช้ไฟเพิ่มราว ${kw.toFixed(2)} kW ตลอดวัน · น้ำเพิ่มราว ${m3.toFixed(2)} ลบ.ม./วัน (เห็นในแอปไฟ/น้ำ/ศูนย์ไอที)`)}
      ${card('🏞️', 'ภาษีที่ดินและสิ่งปลูกสร้าง', `ส่วนต่อเติมเพิ่มภาษีประมาณ ${baht(ptax)}/ปี (ออกพร้อมใบแจ้งภาษีต้นปี)`)}
      ${card('🛡️', 'ประกันบ้าน', `เบี้ยประกันบ้านเพิ่มตามมูลค่า ประมาณ ${baht(ins)} ต่อครั้งที่ซื้อ`)}
      ${card('🛗', 'ลิฟต์', x.lift ? 'ติดตั้งแล้ว' : x.fl >= 3 ? 'ยังไม่ติดตั้ง' : 'ติดตั้งได้เมื่อมี 3 ชั้นขึ้นไป')}
    </div>`;
  };
  const openApp = tab => UI.open('ต่อเติมบ้านหลัก', ['แผนต่อเติม', 'ห้อง & ตกแต่งชั้น', 'สรุปบ้าน'], t => [tab0, tab1, tab2][t](), { tab: tab || 0 });

  // handlers
  Object.assign(UI.H, {
    v36hstart: d => startProject(d.t, +d.to),
    v36hfile: () => filePermit(),
    v36hlift: () => { const x = st(); if (x.lift || x.fl < 3 || S.money < LIFT) return; S.money -= LIFT; try { Bank2.log('ติดตั้งลิฟต์บ้าน', -LIFT); } catch (e) { } x.lift = 1; x.spent += LIFT; World.buildInterior(lvl(), S); if (G.inside && !G.inRoom) setInside(true); UI.toast('ติดตั้งลิฟต์บ้านแล้ว', '🛗'); },
    v36hgo: d => goFloor(+d.v),
    v36hset: d => {
      const i = +d.f, p = plan(i), k = d.k; let v = d.v;
      if (k === 'name') p.name = v; else if (k === 'wall') p.wall = +v; else if (k === 'flr') p.flr = +v; else if (k === 'layout') p.layout = v; else if (k === 'light') p.light = v; else if (k === 'win') p.win = +v;
      else if (/^area\d$/.test(k)) { p.areas = p.areas || []; p.areas[+k[4]] = v; }
      syncKinds();
      if (G.inRoom && Rooms.cur && floorOfDef(Rooms.cur.def) === i) Rooms.build(Rooms.cur.def, ROOM_KIND[Rooms.cur.def.kind]);
      Sfx.click();
    },
  });
  APPS.push({ id: 'house36', i: '🏗️', n: 'ต่อเติมบ้านหลัก' });
  Phone.apps.house36 = phoneGo(() => openApp(0));

  // carpenter / property menu entry
  { const _t3 = Prop23.t3.bind(Prop23); Prop23.t3 = function () { return _t3() + `<div class="grid"><div class="card"><div class="ci">🏗️</div><div class="cb"><h4>ต่อเติมบ้านหลัก</h4><p class="dim">ขยายบ้านหลังเดิมให้กว้างขึ้น สูงขึ้นถึง 4 ชั้น ออกแบบห้องเอง ไม่ต้องสร้างบ้านหลังใหม่ ปัจจุบัน ${st().fl} ชั้น พื้นที่ ${Math.round(totalArea())} ตร.ม.</p><div class="row"><button class="btn" data-a="v36happ">เปิดแผนต่อเติม</button></div></div></div></div>`; }; }
  UI.H.v36happ = () => { UI.close(); openApp(0); };

  // permit paper: an application in the existing 📄 ยื่นเอกสาร app
  if (typeof Gov24 !== 'undefined') {
    if (!Gov24.docs.buildext) Gov24.docs.buildext = { n: 'ใบอนุญาตดัดแปลง/ต่อเติมอาคาร', i: '🏗️', life: YD, off: 'municipal' };
  }

  // ================= daily processing =================
  { const _nd = newDay;
    newDay = function () {
      _nd.apply(this, arguments);
      try {
        const x = st();
        decidePermit();
        if (x.proj && S.day >= x.proj.done) finishProject();
        for (const hid in x.fh) { try { Prop23.deliver(Prop23.home(hid)); } catch (e) { } }
        // the yearly land-and-building tax also covers the extension
        const t = S.v26l && S.v26l.ltax;
        if (t && t.issued === S.day && x.taxY !== t.yr && extraArea() > 0) { x.taxY = t.yr; const add = Math.round(extraValue() * 0.0003); if (add > 0) { t.due = (t.due || 0) + add; msg('สำนักงานที่ดิน', `ภาษีสิ่งปลูกสร้างปีนี้รวมส่วนต่อเติมบ้านหลัก เพิ่ม ${baht(add)}`); } }
      } catch (e) { if (!newDay._w) { newDay._w = 1; console.warn('v36 day', e); } }
    };
  }
  // electricity and water grow with the floor area
  if (typeof Power !== 'undefined' && Power.extra) Power.extra.push(h => extraArea() * 0.0035 * (h >= 18 || h < 6 ? 1.25 : 1));
  if (typeof Water !== 'undefined' && Water.day) { const _wd = Water.day.bind(Water); Water.day = function () { _wd(); try { const ea = extraArea(); if (ea > 0) this.use(ea * 0.0006); } catch (e) { } }; }
  // home insurance premium follows the value of the house
  if (typeof Ins !== 'undefined' && Ins.buy) { const _ib = Ins.buy.bind(Ins); Ins.buy = function (k) { const m0 = S.money; _ib(k); try { if (k === 'home' && S.money < m0 && extraArea() > 0) { const add = Math.min(S.money, Math.round(extraValue() * 0.0004)); S.money -= add; Bank2.log('เบี้ยประกันบ้านส่วนต่อเติม', -add); } } catch (e) { } }; }
  // saving while upstairs stores the player at the staircase of the ground floor
  { const _sg = saveGame;
    saveGame = function () {
      if (G.inRoom && Rooms.cur && floorOfDef(Rooms.cur.def) && G.player) {
        const p = G.player.pos, ox = p.x, oy = p.y, oz = p.z, a = World.v36stair, [rw, rd] = ROOM[lvl() - 1], inR = G.inRoom;
        p.set(a ? a.ax : IN.x, IN.y, a ? a.az : IN.z + rd / 2 - 1.3);
        try { return _sg.apply(this, arguments); } finally { p.set(ox, oy, oz); }
      }
      return _sg.apply(this, arguments);
    };
  }

  // ================= boot =================
  applyRoom(); syncKinds();
  if (extActive()) { World.buildHouse(lvl()); World.buildInterior(lvl(), S); }
  drawScaffold();
  window.House36 = { st, plan, goFloor, goGround: () => goFloor(0), openApp, startProject, finishProject, dims, totalArea, extraArea, costFp, costFl, FPS, buildExt, drawScaffold, syncKinds, extActive, setFp: n => { st().fp = n; applyRoom(); syncKinds(); }, setFl: n => { st().fl = n; for (let i = 1; i < n; i++) plan(i); syncKinds(); } };
});
