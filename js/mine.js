'use strict';
// ---------- Collection book & the hillside mine ----------

// ---- Collection book: every crop, fish, animal product, dish and mineral you have ever obtained ----
const BOOK = [
  { id: 'crop', n: 'ผักผลไม้', list: () => Object.keys(CROPS), reward: 3000 },
  { id: 'fish', n: 'ปลา', list: () => Object.keys(FISH).map(k => 'fish_' + k), reward: 3000 },
  { id: 'product', n: 'ผลผลิตสัตว์', list: () => Object.keys(PRODUCTS), reward: 1000 },
  { id: 'dish', n: 'อาหาร', list: () => Object.keys(RECIPES).map(k => 'dish_' + k), reward: 2000 },
  { id: 'mineral', n: 'แร่และอัญมณี', list: () => Object.keys(MINERALS), reward: 3000 },
  { id: 'artisan', n: 'ของแปรรูป', list: () => Object.keys(ARTISAN), reward: 2000 },
];
const Book = {
  note(id) {
    const it = ITEMS[id]; if (!it || !['crop', 'fish', 'product', 'dish', 'mineral', 'artisan'].includes(it.cat)) return;
    const b = it.base || id; if (S.found[b]) return;
    S.found[b] = 1;
    if (G.started) UI.toast(`บันทึกลงสมุดสะสมใหม่: ${ITEMS[b].i} ${ITEMS[b].n}`, '📖');
    for (const c of BOOK) {
      const l = c.list(); if (S.bookRew[c.id] || !l.includes(b)) continue;
      if (l.every(k => S.found[k])) { S.bookRew[c.id] = 1; earn(c.reward); Prog.add(150); setTimeout(() => UI.toast(`สะสม${c.n}ครบทุกชนิด! รับรางวัล ${U.fmt(c.reward)} ฿`, '🏅'), 900); }
    }
  },
  progress() { let a = 0, n = 0; for (const c of BOOK) { const l = c.list(); n += l.length; a += l.filter(k => S.found[k]).length; } return [a, n]; },
};

// ---- Mine ----
const MINE0 = new THREE.Vector3(-2000, 0, 2000), MINE_W = 24, MINE_ENT = { x: -80, z: -200 };
const Mine = {
  floor: 0, rocks: [], pois: [], cols: [],
  init(scene) {
    this.group = new THREE.Group(); this.group.position.copy(MINE0); this.group.visible = false; scene.add(this.group);
    const dk = (hex, o) => { const m = U.mat(hex, Object.assign({ roughness: 0.95 }, o)); m.envMapIntensity = 0.15; return m; };
    this.rockM = dk(0x6a625a); this.wallM = dk(0x4a423a); const ft = T.stone.clone(); ft.needsUpdate = true; ft.repeat.set(6, 6); this.floorM = U.mat(0x5a4e44, { map: ft, roughness: 0.95 }); this.floorM.envMapIntensity = 0.1;
    this.oreM = {}; for (const k in MINERALS) this.oreM[k] = dk({ stone: 0x8a8278, copper: 0xd9772c, iron: 0x3a3a40, amethyst: 0x9b59d0, gold: 0xf2c12e, ruby: 0xd02040, diamond: 0xbfefff }[k], { roughness: 0.3, metalness: 0.3, emissive: { amethyst: 0x4a1a70, ruby: 0x600010, diamond: 0x305060, gold: 0x403000 }[k] ?? 0x000000 });
    this.rockGeo = blobGeo([[0, 0.45, 0, 0.7]], 31, 9);
    // entrance at the foot of the western hills, behind the farm-supply shop, with a dirt track to it
    const g = new THREE.Group(), y = H(MINE_ENT.x, MINE_ENT.z), wd = M.darkwood;
    g.position.set(MINE_ENT.x, y, MINE_ENT.z); g.rotation.y = Math.PI / 2; World.outdoor.add(g);
    U.mk(g, this.rockGeo, mc(0x7d766c, { roughness: 0.95 }), [0, -0.6, -1.2], [4.2, 3.6, 2.6]);
    U.mk(g, GEO.box, mc(0x110d0a), [0, 1.2, 0.05], [2.2, 2.6, 0.4]);
    for (const sx of [-1.25, 1.25]) U.mk(g, GEO.box, wd, [sx, 1.3, 0.3], [0.25, 2.8, 0.25]);
    U.mk(g, GEO.box, wd, [0, 2.75, 0.3], [2.9, 0.3, 0.3]);
    U.mk(g, new THREE.PlaneGeometry(1.8, 0.45), new THREE.MeshStandardMaterial({ map: U.signTex('เหมืองเก่าบนเขา', { bg: '#4a3020' }), roughness: 0.7 }), [0, 3.25, 0.32]);
    U.mk(g, GEO.box, wd, [1.9, 0.3, 1.2], [0.8, 0.6, 0.6]); U.mk(g, GEO.sphLo, mc(0x8a8278), [1.9, 0.75, 1.2], [0.3, 0.2, 0.25]);
    const lg = new THREE.Group(); lg.position.y = H(MINE_ENT.x + 1, MINE_ENT.z + 2.4); World.outdoor.add(lg); World.lamp(lg, MINE_ENT.x + 1, MINE_ENT.z + 2.4);
    Col.box(MINE_ENT.x - 1.2, MINE_ENT.z, 1.2, 2.2);
    World.outdoor.add(World.ribbon([[-4.5, MINE_ENT.z], [-14, MINE_ENT.z + 1.5], [-45, MINE_ENT.z - 1.5], [MINE_ENT.x + 1.6, MINE_ENT.z]], 2.6, new THREE.MeshStandardMaterial({ map: T.dirt, roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }), 0.05, 3));
    for (let t = 0; t <= 1; t += 0.1) World.clearNear(U.lerp(-4.5, MINE_ENT.x + 2, t), MINE_ENT.z + 0.5, 4);
    World.pois.push({ kind: 'mine', x: MINE_ENT.x + 1.8, z: MINE_ENT.z, r: 2.4, label: 'เหมืองเก่าบนเขา', icon: '⛏️', map: true });
    // pickaxe carried in the right hand while in the mine
    const pk = new THREE.Group();
    U.mk(pk, GEO.cylLo, mc(0x8a5a32), [0, 0.25, 0], [0.025, 0.6, 0.025]);
    U.mk(pk, capsule(0.03, 0.4), mc(0x9aa3a8, { metalness: 0.5, roughness: 0.3 }), [0, 0.52, 0], 1, [0, 0, Math.PI / 2]);
    pk.position.set(0, -0.26, 0.02); pk.rotation.x = Math.PI / 2; pk.visible = false; this.pick = pk;
  },
  attachPick() { G.player.obj.userData.elR.add(this.pick); },
  oreAt(n) {
    const pool = Object.keys(MINERALS).filter(k => MINERALS[k].d <= n);
    const w = pool.map(k => MINERALS[k].w * (k === 'stone' ? Math.max(0.4, 1 - n * 0.04) : 1 + n * 0.05));
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < pool.length; i++) { r -= w[i]; if (r < 0) return pool[i]; }
    return 'stone';
  },
  build(n) {
    const g = this.group; while (g.children.length) g.remove(g.children[0]);
    this.cols.forEach(c => Col.remove(c)); this.cols = []; this.pois = []; this.rocks = [];
    this.floor = n; S.mineMax = Math.max(S.mineMax || 1, n);
    const R = U.rng(n * 977 + S.day), h = MINE_W / 2;
    U.mk(g, new THREE.PlaneGeometry(MINE_W + 6, MINE_W + 6), this.floorM, [0, 0, 0], 1, [-Math.PI / 2, 0, 0]);
    // jagged rock walls around the chamber
    const wall = new THREE.Group();
    for (let i = 0; i < 64; i++) {
      const t = i / 64 * 4, side = Math.floor(t), f = t - side, j = R() * 1.5;
      const p = [[-h + f * MINE_W, -h - j], [h + j, -h + f * MINE_W], [h - f * MINE_W, h + j], [-h - j, h - f * MINE_W]][side];
      // the wall nearest the camera stays low so it never hides the player
      const low = side === 2 ? 0.35 : 1;
      U.mk(wall, this.rockGeo, this.wallM, [p[0], -0.4, p[1]], [1.6 + R() * 1.4, (2.2 + R() * 2.6) * low, 1.6 + R() * 1.4], [0, R() * TAU, 0]);
    }
    for (let i = 0; i < 10; i++) U.mk(wall, GEO.cone, this.wallM, [(R() - 0.5) * (MINE_W - 6), 0.6, (R() - 0.5) * (MINE_W - 6)], [0.25 + R() * 0.2, 1.2 + R(), 0.25 + R() * 0.2]);
    g.add(U.mergeByMaterial(wall));
    // glowing crystal clusters for atmosphere
    const glow = [];
    for (let i = 0; i < 6; i++) {
      const x = (R() - 0.5) * (MINE_W - 3), z = (R() - 0.5) * (MINE_W - 3), m = [this.oreM.amethyst, this.oreM.diamond][i % 2];
      for (let k = 0; k < 4; k++) U.mk(g, GEO.cone, m, [x + (R() - 0.5) * 0.4, 0.3, z + (R() - 0.5) * 0.4], [0.08, 0.6 + R() * 0.4, 0.08], [(R() - 0.5) * 0.6, 0, (R() - 0.5) * 0.6]);
      glow.push(x, 0.6, z);
    }
    const gp = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(glow, 3)), new THREE.PointsMaterial({ map: T.glow, color: 0xb48cff, size: 2.6, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
    g.add(gp);
    // ladder up at the start
    this.ladder(g, 0, h - 1.5, 'mineup', 'ขึ้นจากเหมือง');
    // rocks: one hides the ladder down
    const count = 20 + Math.min(10, n);
    const ladderIdx = Math.floor(R() * count);
    for (let i = 0; i < count; i++) {
      let x, z, tries = 0;
      do { x = (R() - 0.5) * (MINE_W - 4); z = (R() - 0.5) * (MINE_W - 4); tries++; } while ((Math.hypot(x, z - (h - 1.5)) < 3.5 || this.rocks.some(r => Math.hypot(r.x - x, r.z - z) < 1.6)) && tries < 30);
      const ore = this.oreAt(n), m = new THREE.Group(); m.position.set(x, 0, z); m.rotation.y = R() * TAU; g.add(m);
      const s = ore === 'stone' ? 0.6 + R() * 0.3 : 0.75 + R() * 0.25;
      U.mk(m, this.rockGeo, this.rockM, [0, 0, 0], [s, s * 0.8, s]);
      if (ore !== 'stone') for (let k = 0; k < 7; k++) { const a = R() * TAU, e = R() * 1.1; U.mk(m, GEO.sphLo, this.oreM[ore], [Math.cos(a) * Math.cos(e) * 0.6 * s, 0.4 * s + Math.sin(e) * 0.45 * s, Math.sin(a) * Math.cos(e) * 0.6 * s], 0.09 + R() * 0.06); }
      const rk = { x, z, ore, hp: MINERALS[ore].hp, m, s, ladder: i === ladderIdx && n < 20 };
      rk.col = Col.circle(MINE0.x + x, MINE0.z + z, 0.55 * s); this.cols.push(rk.col);
      const poi = { kind: 'rock', rock: rk, x: MINE0.x + x, z: MINE0.z + z, r: 1.3 + s * 0.4, label: MINERALS[ore].n, icon: MINERALS[ore].i };
      rk.poi = poi; this.pois.push(poi); this.rocks.push(rk);
    }
    this.light = new THREE.PointLight(0xffc27a, 0.5, 40, 1.5); this.light.position.set(0, 6, 0); g.add(this.light);
  },
  ladder(g, x, z, kind, label) {
    const l = new THREE.Group(); l.position.set(x, 0, z); g.add(l);
    for (const sx of [-0.3, 0.3]) U.mk(l, GEO.box, M.darkwood, [sx, 1.4, 0], [0.08, 2.8, 0.08]);
    for (let i = 0; i < 7; i++) U.mk(l, GEO.box, M.darkwood, [0, 0.3 + i * 0.38, 0], [0.6, 0.05, 0.06]);
    if (kind === 'minedown') U.mk(l, GEO.cyl, mc(0x050403), [0, 0.01, 0.5], [0.8, 0.02, 0.8]);
    this.pois.push({ kind, x: MINE0.x + x, z: MINE0.z + z, r: 1.6, label, icon: kind === 'mineup' ? '🪜' : '⬇️' });
  },
  hit(rk) {
    if (!S.up.pick) { UI.toast('ต้องมีจอบขุดแร่ก่อน ซื้อได้ที่ร้านช่างไม้', '⛏️'); Sfx.error(); return; }
    if (!useEnergy(2)) return;
    rk.hp -= S.up.pick; playAct('harvest', 0.45);
    Sfx.tone(900 + Math.random() * 300, 0.06, 'square', 0.05); Sfx.burst(0.12, 2400, 'bandpass', 0.15);
    const p = { x: MINE0.x + rk.x, z: MINE0.z + rk.z };
    FX.burst(p.x, 0.6, p.z, 8, new THREE.Color(0.55, 0.5, 0.45), 2, 9);
    rk.m.position.x = rk.x + (Math.random() - 0.5) * 0.08;
    if (rk.hp > 0) return;
    const ore = rk.ore, n = ore === 'stone' ? 1 + (Math.random() < 0.4 ? 1 : 0) : 1 + (Math.random() < 0.15 ? 1 : 0);
    addItem(ore, n); if (ore !== 'stone' && Math.random() < 0.5) addItem('stone', 1);
    Prog.add(ore === 'stone' ? 1 : 3 + MINERALS[ore].d);
    UI.toast(`ขุดได้ ${MINERALS[ore].n} +${n}`, MINERALS[ore].i);
    if (MINERALS[ore].d >= 4) FX.burst(p.x, 0.8, p.z, 20, new THREE.Color(1, 0.85, 0.4), 3, 6);
    this.group.remove(rk.m); Col.remove(rk.col); this.pois.splice(this.pois.indexOf(rk.poi), 1); this.rocks.splice(this.rocks.indexOf(rk), 1);
    World.inPois = this.pois;
    if (rk.ladder) { this.ladder(this.group, rk.x, rk.z, 'minedown', 'ลงไปชั้น ' + (this.floor + 1)); World.inPois = this.pois; UI.toast('เจอบันไดลงชั้นถัดไป!', '⬇️'); Sfx.goal(); }
  },
  enter(n) {
    UI.close(); Sfx.door();
    fade(() => {
      if (Fish.st) Fish.end();
      this.build(n);
      if (!G.inMine) this.saved = { room: World.room, pois: World.inPois };
      G.inMine = true; G.inside = true;
      World.room = { w: MINE_W, d: MINE_W }; World.inPois = this.pois;
      World.outdoor.visible = false; World.interior.visible = false; World.sky.visible = false; World.stars.visible = false; this.group.visible = true;
      G.scene.background = new THREE.Color(0x0b0907);
      G.player.pos.set(MINE0.x, 0, MINE0.z + MINE_W / 2 - 3); G.player.rot = Math.PI; G.cam.yaw = 0; G.cam.pitch = 0.85; G.cam.dist = Math.min(G.cam.dist, 9); snapCam();
      this.attachPick(); UI.buttons();
      UI.toast(`เหมืองชั้น ${n}${n % 5 === 0 ? ' (จุดพักลิฟต์)' : ''}`, '⛏️');
    });
  },
  leave(instant) {
    const go = () => {
      G.inMine = false; this.group.visible = false; this.cols.forEach(c => Col.remove(c)); this.cols = [];
      if (this.saved) { World.room = this.saved.room; World.inPois = this.saved.pois; }
      setInside(false);
      const d = { x: MINE_ENT.x + 2.6, z: MINE_ENT.z }; G.player.pos.set(d.x, World.groundY(d.x, d.z), d.z); G.player.rot = Math.PI / 2; G.cam.yaw = -Math.PI / 2; snapCam();
    };
    if (instant) go(); else { Sfx.door(); fade(go); }
  },
};
