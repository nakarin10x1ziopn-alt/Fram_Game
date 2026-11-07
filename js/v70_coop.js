// v70_coop.js: the little wooden house beside the red barn is the hen house and egg-sorting room, and you can walk in
//  - 🥚 nesting boxes along the back wall: collect the eggs from all the chickens
//  - 🧺 egg-sorting table: sell eggs and the other produce you carry
//  - 🐥 brooder corner: a quick health check of the flock (how many chickens, hungry or sick ones)
//  everything inside is solid, nothing stands in front of the door or the walking space
V23.add('v70_coop', () => {
  if (typeof Rooms === 'undefined' || typeof ROOM_KIND === 'undefined' || !World.pois) return;
  ROOM_KIND.coop = { w: 9, d: 7, floor: 0xb89a68, wall: 0xe4c48c, title: 'เล้าไก่และโรงคัดไข่' };
  // the door is on the front of the coop (the coop stands at -24, 8; its door faces south)
  World.pois.push({ kind: 'act', x: -24, z: 11.3, r: 1.8, label: 'เล้าไก่และโรงคัดไข่', icon: '🐔', map: true, room: { kind: 'coop', title: 'เล้าไก่และโรงคัดไข่' }, act: () => null });

  const chickens = () => (S.animals || []).filter(a => a.type === 'chicken');
  const collectEggs = () => {
    const list = chickens().filter(a => (a.pend || 0) > 0);
    if (!list.length) { UI.toast(chickens().length ? 'ยังไม่มีไข่ในรัง ไว้มาใหม่ทีหลัง' : 'ยังไม่มีไก่ในฟาร์ม ซื้อไก่ได้ที่ฟาร์มปศุสัตว์', '🥚'); return; }
    let tot = 0; const prod = (typeof ANIMALS !== 'undefined' && ANIMALS.chicken && ANIMALS.chicken.prod) || 'egg';
    for (const a of list) { addItem(prod, a.pend); S.stats.products = (S.stats.products || 0) + a.pend; tot += a.pend; a.pend = 0; a.prod = false; }
    try { Prog.add(Math.min(24, 4 * tot)); Sfx.pop(); } catch (e) { }
    UI.toast(`เก็บไข่จากรัง ${tot} ฟอง`, '🥚');
  };
  const eggCount = () => chickens().reduce((s, a) => s + (a.pend || 0), 0);
  const health = () => {
    const c = chickens(); if (!c.length) { UI.toast('ยังไม่มีไก่ในฟาร์ม', '🐔'); return; }
    const hungry = c.filter(a => a.hungry || S.trough <= 0).length, sick = c.filter(a => a.sick).length, happy = Math.round(c.reduce((s, a) => s + (a.happy == null ? 50 : a.happy), 0) / c.length);
    UI.toast(`ไก่ ${c.length} ตัว · ความสุขเฉลี่ย ${happy}% · หิว ${hungry} · ป่วย ${sick} · ในรางอาหาร ${S.trough} ถุง`, '🐥');
  };

  const _build = Rooms.build.bind(Rooms);
  Rooms.build = function (def, K) {
    if (def.kind !== 'coop') return _build(def, K);
    const g = this.group; while (g.children.length) g.remove(g.children[0]); this.cols.forEach(x => Col.remove(x)); this.cols = []; this.pois = []; this.staff = [];
    const W = K.w, D = K.d, X = RM0.x, Z = RM0.z, H = 3.4;
    const wallM = texMat('woodV', 0xe4c48c), floorM = texMat('wood', K.floor), dark = M.darkwood, straw = texMat('straw', 0xffffff, { roughness: 1 });
    const box = (x, z, w, d, h, m, y = 0, col = true) => { const o = U.mk(g, GEO.box, m, [X + x, y + h / 2, Z + z], [w, h, d]); if (col) this.cols.push(Col.box(X + x, Z + z, w / 2, d / 2, 0)); return o; };
    const poi = (x, z, label, icon, fn, r = 1.4) => this.pois.push({ kind: 'act', x: X + x, z: Z + z, r, label, icon, act: () => ({ icon, label: typeof label === 'function' ? label() : label, fn }) });
    U.mk(g, new THREE.PlaneGeometry(W, D), floorM, [X, 0.01, Z], 1, [-Math.PI / 2, 0, 0]);
    // straw bedding on the floor (flat, no collision)
    for (const [x, z, w, d] of [[-2.8, -0.6, 2.4, 1.6], [0.5, 0.9, 2.0, 1.4], [3.0, -1.0, 1.8, 1.2]]) U.mk(g, GEO.box, straw, [X + x, 0.02, Z + z], [w, 0.03, d]);
    box(0, -D / 2, W, 0.2, H, wallM); box(-W / 2, 0, 0.2, D, H, wallM); box(W / 2, 0, 0.2, D, H, wallM);
    const fw = W / 2 - 1.5; for (const s of [-1, 1]) box(s * (1.5 + fw / 2), D / 2, fw, 0.2, 1.0, wallM);
    U.mk(g, GEO.box, mc(0x6d4c41), [X, 0.05, Z + D / 2], [3.0, 0.1, 0.4]);
    U.mk(g, GEO.box, dark, [X, H - 0.1, Z - D / 2 + 0.15], [W, 0.25, 0.3]); for (const s of [-1, 1]) U.mk(g, GEO.box, dark, [X + s * (W / 2 - 0.15), H - 0.1, Z], [0.3, 0.25, D]);
    // window and lamps (warm glow, no real lights)
    U.mk(g, GEO.box, dark, [X + 2.8, 2.1, Z - D / 2 + 0.13], [1.2, 1.0, 0.08]); U.mk(g, GEO.box, new THREE.MeshBasicMaterial({ color: 0xcfe6ff }), [X + 2.8, 2.1, Z - D / 2 + 0.18], [1.0, 0.8, 0.05]);
    for (const [x, z] of [[-W / 2 + 0.3, 0.5], [W / 2 - 0.3, 0.5]]) { U.mk(g, GEO.box, M.metal, [X + x, 2.7, Z + z], [0.08, 0.08, 0.3]); U.mk(g, GEO.sph, new THREE.MeshBasicMaterial({ color: 0xffe3a0 }), [X + x, 2.55, Z + z], [0.18, 0.24, 0.18]); }
    this.pois.push({ kind: 'act', x: X, z: Z + D / 2 - 0.5, r: 1.6, label: 'ออกจากเล้า', icon: '🚪', act: () => ({ icon: '🚪', label: 'ออกไปข้างนอก', fn: () => this.leave() }) });

    // back wall: a row of five nesting boxes with straw and eggs
    for (let i = 0; i < 5; i++) { const x = -3.0 + i * 1.5; box(x, -D / 2 + 0.55, 1.2, 0.8, 0.7, M.wood); U.mk(g, GEO.sph, straw, [X + x, 0.78, Z - D / 2 + 0.55], [0.46, 0.1, 0.3]); for (const k of [-1, 1]) U.mk(g, GEO.sph, mc(0xf4efe0), [X + x + k * 0.14, 0.86, Z - D / 2 + 0.55], [0.1, 0.13, 0.1]); }
    poi(0, -D / 2 + 1.6, () => { const n = eggCount(); return `เก็บไข่จากรังไก่${n ? ' (' + n + ' ฟอง)' : ''}`; }, '🥚', collectEggs, 2.0);
    // right side: the egg-sorting table
    box(3.4, 1.5, 1.2, 2.4, 0.9, mc(0x8d6e63));
    for (const [z, c] of [[0.8, 0xf4efe0], [1.5, 0xe9d5b5], [2.2, 0xf4efe0]]) U.mk(g, U.box(0.5, 0.18, 0.4, 1), mc(0xb08650), [X + 3.4, 1.0, Z + z]), U.mk(g, GEO.sph, mc(c), [X + 3.4, 1.12, Z + z], [0.16, 0.1, 0.12]);
    poi(2.1, 1.5, 'โต๊ะคัดไข่: ขายไข่และผลผลิต', '🧺', () => UI.sell(1, 'โต๊ะคัดไข่'));
    // left side: the brooder corner (a low pen with a heat lamp and chicks)
    box(-3.5, 1.9, 1.9, 0.12, 0.6, dark); box(-4.45, 2.7, 0.12, 1.7, 0.6, dark); box(-2.55, 2.7, 0.12, 1.7, 0.6, dark);
    U.mk(g, GEO.cylLo, M.metal, [X - 3.5, 1.8, Z + 3.0], [0.02, 1.9, 0.02]); U.mk(g, GEO.sph, new THREE.MeshBasicMaterial({ color: 0xffb060 }), [X - 3.5, 1.15, Z + 3.0], [0.22, 0.12, 0.22]);
    for (const [x, z] of [[-3.9, 2.9], [-3.4, 3.3], [-3.0, 2.8], [-3.7, 3.6]]) { U.mk(g, GEO.sph, mc(0xffe066), [X + x, 0.14, Z + z], [0.12, 0.11, 0.11]); U.mk(g, GEO.sph, mc(0xffe066), [X + x, 0.27, Z + z + 0.07], 0.06); }
    poi(-2.0, 0.4, 'ตรวจสุขภาพฝูงไก่ (มุมลูกไก่)', '🐥', health);
    // a perch rail across the middle, a feed trough and a water pot
    box(0.2, 0.2, 3.0, 0.1, 0.5, dark); for (const s of [-1, 1]) U.mk(g, GEO.box, dark, [X + 0.2 + s * 1.5, 0.3, Z + 0.2], [0.1, 0.6, 0.1]);
    box(-3.4, -1.4, 0.7, 1.6, 0.35, M.wood); box(-3.4, -2.8, 0.5, 0.5, 0.45, mc(0x6d4c41));
    // sacks of feed by the door side wall
    for (const [x, z, y] of [[3.8, 3.2, 0.3], [3.2, 3.3, 0.3], [3.5, 3.25, 0.7]]) U.mk(g, GEO.sph, mc(0xd8c49a, { roughness: 1 }), [X + x, y, Z + z], [0.34, 0.28, 0.3]);
    this.cols.push(Col.box(X + 3.5, Z + 3.25, 0.7, 0.4, 0));
  };
  { const _e = Rooms.enter.bind(Rooms); Rooms.enter = function (poi) { _e(poi); if (poi && poi.room && poi.room.kind === 'coop') setTimeout(() => { if (G.inRoom) this.amb.intensity = 0.95; }, 600); }; }
});
