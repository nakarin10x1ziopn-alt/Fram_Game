// v66_barn.js: the red barn in front of the animal pen is now a real walk-in building
//  - a door on the front of the barn leads into a room built like the other buildings
//  - inside: animal register board, feed store (refill the trough, buy feed), produce crates, hay bed for a nap, carpenter's bench for barn upgrades
V23.add('v66_barn', () => {
  if (typeof Rooms === 'undefined' || typeof ROOM_KIND === 'undefined' || !World.pois) return;
  ROOM_KIND.barn = { w: 17, d: 12, floor: 0xa98259, wall: 0xb5703c, title: 'โรงเรือนสัตว์' };

  // ---- the door on the front of the barn (the building itself is solid, so the prompt stands in the yard in front of it) ----
  World.pois.push({ kind: 'act', x: -38, z: 11.4, r: 2.4, label: 'โรงเรือนสัตว์', icon: '🐄', map: true, room: { kind: 'barn', title: 'โรงเรือนสัตว์' }, act: () => null });

  const E = s => (typeof esc === 'function' ? esc(s) : String(s));
  const feedPrice = () => (TOOLS.feed && TOOLS.feed.price) || 30;
  const buyFeed = n => {
    const cost = feedPrice() * n;
    if (S.money < cost) { UI.toast(`เงินไม่พอ (ต้องใช้ ${baht(cost)})`, '💸'); return; }
    S.money -= cost; addItem('feed', n); try { Sfx.coin(); } catch (e) { }
    UI.toast(`ซื้ออาหารสัตว์ ${n} ถุง (${baht(cost)}) · ในกระเป๋า ${count('feed')} ถุง`, '🌾');
  };
  const nap = () => {
    const max = maxEnergy();
    if (S.energy >= max - 5) { UI.toast('ยังไม่เหนื่อย ไม่ต้องงีบ', '😌'); return; }
    fade(() => {
      simulate(60); S.energy = Math.min(max, S.energy + 25);
      UI.toast('งีบบนกองฟางหอมๆ หนึ่งชั่วโมง พลังงาน +25', '😴');
    });
  };
  const board = () => UI.open('🐄 ทะเบียนสัตว์ในโรงเรือน', null, () => (window.Animal40 && Animal40.penHtml ? Animal40.penHtml() : '<p class="empty">ยังไม่มีสัตว์</p>'));
  const bench = () => { UI.shop('carpenter'); if (UI.cur) { UI.cur.tab = 0; UI.renderBody && UI.renderBody(); } };

  const _build = Rooms.build.bind(Rooms);
  Rooms.build = function (def, K) {
    if (def.kind !== 'barn') return _build(def, K);
    const g = this.group; while (g.children.length) g.remove(g.children[0]); this.cols.forEach(x => Col.remove(x)); this.cols = []; this.pois = []; this.staff = [];
    const W = K.w, D = K.d, X = RM0.x, Z = RM0.z, H = 4.4;
    const wallM = texMat('woodV', 0xb5703c), floorM = texMat('wood', K.floor), darkM = M.darkwood, strawM = texMat('straw', 0xffffff, { roughness: 1 });
    const box = (x, z, w, d, h, m, y = 0, col = true) => { const o = U.mk(g, GEO.box, m, [X + x, y + h / 2, Z + z], [w, h, d]); if (col) this.cols.push(Col.box(X + x, Z + z, w / 2, d / 2, 0)); return o; };
    const poi = (x, z, label, icon, fn, r = 1.5) => this.pois.push({ kind: 'act', x: X + x, z: Z + z, r, label, icon, act: () => ({ icon, label: typeof label === 'function' ? label() : label, fn }) });

    U.mk(g, new THREE.PlaneGeometry(W, D), floorM, [X, 0.01, Z], 1, [-Math.PI / 2, 0, 0]);
    // walls: planks on the back and sides, a low front wall with the door gap so the camera can look in
    box(0, -D / 2, W, 0.2, H, wallM); box(-W / 2, 0, 0.2, D, H, wallM); box(W / 2, 0, 0.2, D, H, wallM);
    const fw = W / 2 - 1.8; for (const s of [-1, 1]) box(s * (1.8 + fw / 2), D / 2, fw, 0.2, 1.0, wallM);
    U.mk(g, GEO.box, mc(0x6d4c41), [X, 0.05, Z + D / 2], [3.6, 0.1, 0.4]);
    // top rail along the walls and warm wall lamps (nothing hangs across the room, so the camera looks in freely)
    U.mk(g, GEO.box, darkM, [X, H - 0.1, Z - D / 2 + 0.15], [W, 0.25, 0.3]);
    for (const s of [-1, 1]) U.mk(g, GEO.box, darkM, [X + s * (W / 2 - 0.15), H - 0.1, Z], [0.3, 0.25, D]);
    for (const [x, z, rot] of [[-W / 2 + 0.3, -2, 0], [-W / 2 + 0.3, 3, 0], [W / 2 - 0.3, -2, 0], [W / 2 - 0.3, 3, 0], [-2.6, -D / 2 + 0.3, 1], [2.6, -D / 2 + 0.3, 1]]) {
      U.mk(g, GEO.box, M.metal, [X + x, 3.1, Z + z], rot ? [0.3, 0.08, 0.08] : [0.08, 0.08, 0.3]);
      U.mk(g, GEO.sph, new THREE.MeshBasicMaterial({ color: 0xffe3a0 }), [X + x, 2.95, Z + z], [0.2, 0.26, 0.2]);
    }
    // windows high on the back wall
    for (const x of [-4.5, 4.5]) {
      U.mk(g, GEO.box, darkM, [X + x, 2.7, Z - D / 2 + 0.13], [1.5, 1.3, 0.08]);
      U.mk(g, GEO.box, new THREE.MeshBasicMaterial({ color: 0xcfe6ff }), [X + x, 2.7, Z - D / 2 + 0.18], [1.3, 1.1, 0.05]);
      U.mk(g, GEO.box, darkM, [X + x, 2.7, Z - D / 2 + 0.2], [0.06, 1.1, 0.06]); U.mk(g, GEO.box, darkM, [X + x, 2.7, Z - D / 2 + 0.2], [1.3, 0.06, 0.06]);
    }
    this.pois.push({ kind: 'act', x: X, z: Z + D / 2 - 0.5, r: 1.6, label: 'ออกจากโรงเรือน', icon: '🚪', act: () => ({ icon: '🚪', label: 'ออกไปข้างนอก', fn: () => this.leave() }) });

    // ---- back left: feed store (refill the trough, buy feed) ----
    box(-6.2, -4.8, 2.4, 1.2, 1.1, mc(0x8d6e63));            // feed bin
    U.mk(g, GEO.box, mc(0x5d4037), [X - 6.2, 1.18, Z - 4.8], [2.5, 0.12, 1.3]);
    U.mk(g, GEO.box, strawM, [X - 6.2, 1.28, Z - 4.8], [2.0, 0.08, 0.9]);
    for (const [x, z, h] of [[-7.4, -2.4, 0.5], [-6.5, -2.3, 0.5], [-7.0, -2.35, 1.0], [-7.4, -1.5, 0.5]]) { // sacks of feed
      const y = h === 1.0 ? 0.75 : 0.25; U.mk(g, GEO.sph, mc(0xd8c49a, { roughness: 1 }), [X + x, y, Z + z], [0.45, 0.28, 0.32]);
    }
    this.cols.push(Col.box(X - 7.0, Z - 1.95, 0.95, 0.75, 0));
    poi(-5.0, -3.2, () => `เติมรางอาหารสัตว์ (ในราง ${S.trough} · มีอาหาร ${count('feed')} ถุง)`, '🌾', () => fillTrough());
    poi(-4.7, -1.2, () => `ซื้ออาหารสัตว์ 10 ถุง (${baht(feedPrice() * 10)})`, '🛒', () => buyFeed(10));

    // ---- back centre: animal register board on the wall and a writing desk ----
    const bm = new THREE.MeshStandardMaterial({ map: U.signTex('ทะเบียนสัตว์', { w: 512, h: 160, bg: '#4e342e', fg: '#fff1c9' }), roughness: 0.8 });
    U.mk(g, new THREE.PlaneGeometry(3.2, 1.0), bm, [X, 2.5, Z - D / 2 + 0.13]);
    box(0, -4.9, 2.6, 1.0, 0.85, mc(0x8d6e63));
    U.mk(g, GEO.box, mc(0xf4efe0), [X - 0.4, 0.9, Z - 4.9], [0.7, 0.04, 0.5]); U.mk(g, GEO.box, mc(0x2e5d3a), [X + 0.5, 0.92, Z - 4.9], [0.5, 0.06, 0.4]);
    poi(0, -3.5, () => `ดูแลสัตว์ ${S.animals.length} ตัว · ทะเบียน`, '📋', board);

    // ---- back right: produce crates and milk cans ----
    box(6.0, -5.0, 2.6, 1.0, 0.8, mc(0x8d6e63));
    for (const [x, y] of [[5.3, 0.9], [6.0, 0.9], [6.7, 0.9]]) U.mk(g, U.box(0.6, 0.3, 0.5, 1.2), M.wood, [X + x, y + 0.15, Z - 5.0]);
    for (const [x, z] of [[7.2, -3.4], [7.2, -2.7], [7.2, -2.0]]) { U.mk(g, lathe('milk', [[0, 0], [0.2, 0], [0.2, 0.55], [0.12, 0.68], [0.12, 0.8], [0.15, 0.82], [0, 0.84]], 16), mc(0x9aa3a8, { roughness: 0.35, metalness: 0.45 }), [X + x, 0, Z + z]); this.cols.push(Col.circle(X + x, Z + z, 0.25)); }
    poi(5.0, -3.5, () => { const n = S.animals.reduce((s, a) => s + (a.pend || 0), 0); return `เก็บผลผลิตทั้งหมด${n ? ' (' + n + ')' : ''}`; }, '🧺', () => (window.Animal40 && Animal40.collectAll ? Animal40.collectAll() : UI.toast('ยังไม่มีผลผลิต', '🧺')));

    // ---- right side: hay bed for a nap ----
    U.mk(g, U.box(3.4, 0.5, 2.2, 1.2), strawM, [X + 6.2, 0.25, Z + 1.6], [1, 1, 1]);
    U.mk(g, GEO.box, mc(0xb84a3a), [X + 6.2, 0.53, Z + 1.9], [2.2, 0.06, 1.3]);
    U.mk(g, GEO.sph, mc(0xf4efe0), [X + 7.2, 0.62, Z + 1.0], [0.4, 0.16, 0.3]);
    this.cols.push(Col.box(X + 6.2, Z + 1.6, 1.7, 1.1, 0));
    poi(4.2, 1.6, 'งีบบนกองฟาง (1 ชม. · พลังงาน +25)', '😴', nap);
    for (const z of [4.4, 5.3]) U.mk(g, GEO.cyl, strawM, [X + 7.3, 0.55, Z + z], [0.55, 1.2, 0.55], [0, 0, Math.PI / 2]);
    this.cols.push(Col.box(X + 7.3, Z + 4.85, 0.7, 1.0, 0));

    // ---- left side: carpenter's bench (barn upgrades) and tool rack ----
    box(-7.4, 2.8, 1.2, 3.2, 0.95, mc(0x8d6e63));
    for (const [x, z, w, d] of [[-7.4, 2.0, 0.5, 0.2], [-7.4, 3.0, 0.4, 0.4], [-7.4, 3.6, 0.2, 0.7]]) U.mk(g, GEO.box, M.metal, [X + x, 1.0, Z + z], [w, 0.08, d]);
    U.mk(g, GEO.box, darkM, [X - W / 2 + 0.2, 2.2, Z + 2.8], [0.08, 1.2, 3.4]);          // rack board
    for (let i = 0; i < 4; i++) { U.mk(g, GEO.cylLo, M.wood, [X - W / 2 + 0.3, 2.2, Z + 1.6 + i * 0.8], [0.03, 1.5, 0.03]); U.mk(g, GEO.box, M.metal, [X - W / 2 + 0.3, 2.95, Z + 1.6 + i * 0.8], [0.06, 0.12, 0.35 - i * 0.05]); }
    poi(-5.5, 2.8, 'โต๊ะช่าง: อัปเกรดโรงเรือน', '🔧', bench);

    // ---- stall rails along the middle and a few props so the room feels used ----
    for (const [x, z, w] of [[-2.2, 0.4, 0.15], [2.2, 0.4, 0.15]]) { U.mk(g, GEO.box, darkM, [X + x, 0.9, Z + z], [w, 0.12, 2.6]); U.mk(g, GEO.box, darkM, [X + x, 0.5, Z + z], [w, 0.12, 2.6]); for (const k of [-1.2, 1.2]) U.mk(g, GEO.box, darkM, [X + x, 0.7, Z + z + k], [0.18, 1.4, 0.18]); }
    this.cols.push(Col.box(X - 2.2, Z + 0.4, 0.15, 1.35, 0), Col.box(X + 2.2, Z + 0.4, 0.15, 1.35, 0));
    for (const [x, z] of [[-7.5, 5.2], [7.5, -0.4]]) { U.mk(g, GEO.cyl, mc(0x6d4c41), [X + x, 0.5, Z + z], [0.45, 1.0, 0.45]); this.cols.push(Col.circle(X + x, Z + z, 0.5)); }
    U.mk(g, GEO.box, mc(0x7a5a3a), [X, 0.012, Z + 3.4], [3.6, 0.02, 2.2]);   // worn mat in the middle
  };

  // the room is warm and a little brighter than the other buildings
  { const _e = Rooms.enter.bind(Rooms); Rooms.enter = function (poi) { _e(poi); if (poi && poi.room && poi.room.kind === 'barn') setTimeout(() => { if (G.inRoom) this.amb.intensity = 0.95; }, 600); }; }
});
