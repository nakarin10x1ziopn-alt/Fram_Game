'use strict';
// ---------- Two towns on the main map, reachable by road: ทุ่งทอง (market town, north of the coast road) and ภูผาใหม่ (new town west of the village) ----------
// zones and roads are registered before the world is built so the terrain is levelled and the roads are paved
ZONES.push({ id: 'thong', n: 'เมืองทุ่งทอง', x: 170, z: -268, hw: 46, hd: 38 }, { id: 'phupha', n: 'เมืองภูผาใหม่', x: -105, z: -400, hw: 46, hd: 36 });
// both roads straighten onto the town's main street before the first shophouse, so no kerb-side prop ends up in a lane
ROADS.push({ pts: [[150, -389], [153, -352], [160, -328], [168, -310], [170, -296], [170, -230]], w: 8 }, { pts: [[0, -330], [-30, -340], [-60, -348], [-84, -355], [-99, -363], [-105, -374], [-105, -436]], w: 8 });
SHOPS.hardware = { n: 'ร้านวัสดุก่อสร้างทุ่งทอง', tabs: [{ n: 'อุปกรณ์ฟาร์ม', items: ['tool:sprinkler', 'tool:sprinkler_pro', 'tool:fert', 'tool:sandbag', 'tool:extinguisher', 'tool:pesticide', 'up:can', 'up:rod'] }] };
const TOWN4_NAMES = { thong: ['เฮียหมง', 'เจ๊กิม', 'พี่โต้ง', 'น้องฟาง', 'ลุงเฮง', 'พี่หนิง'], phupha: ['ครูฝึกเอก', 'พี่บีม', 'น้องแบม', 'พี่กอล์ฟ', 'ป้าเพ็ญ', 'พี่ปอ'] };
TOWN4_NAMES.thong.concat(TOWN4_NAMES.phupha).forEach(n => NPC_NAMES.push(n));

// residents hang out on the pavement, never in the traffic lanes of the main street
function kerbSpot(x, z, sx, r) {
  for (let k = 0; k < 24 && roadDist(x, z) < 5.4 + r; k++) x += sx * 0.5;
  return { x, z, r };
}
const Towns4 = {
  init() {
    this.thong(); this.phupha();
  },
  kit(cx, cz) {
    const g = new THREE.Group(); World.outdoor.add(g);
    const B = (o, x, z, rot, shop, icon) => {
      const b = World.building(o); b.position.set(x, World.groundY(x, z), z); b.rotation.y = rot; g.add(b); Col.box(x, z, o.w / 2 + 0.3, o.d / 2 + 0.3, rot, 'bld'); World.clearNear(x, z, Math.max(o.w, o.d) * 0.7, true);
      const door = l2w(x, z, rot, o.doorX || 0, o.d / 2 + 1.7);
      if (shop) World.pois.push({ kind: 'shop', id: shop, x: door.x, z: door.z, r: 2.4, label: o.sign || SHOPS[shop].n, icon: icon || '🏪', map: true });
      return door;
    };
    const P = (d, icon, label, fn) => World.pois.push({ kind: 'act', x: d.x, z: d.z, r: 2.6, label, icon, map: true, act: () => ({ icon, label, fn }) });
    const lamps = (x0, z0, x1, z1, n) => { for (let i = 0; i <= n; i++) World.lamp(g, U.lerp(x0, x1, i / n), U.lerp(z0, z1, i / n)); };
    const people = (names, area) => names.forEach((nm, i) => {
      const o = Models.human({ avatar: People.avatarFor(nm, i + 2) }); World.dyn.add(o);
      const n = { obj: o, name: nm, rot: 0, speed: 0, timer: i, st: 'idle', wave: 0, townRes: true, circ: kerbSpot(area.x + (i % 2 ? 2.6 : -2.6), area.z - 24 + i * 9, i % 2 ? 1 : -1, 1.4) };
      n.x = n.circ.x; n.z = n.circ.z; n.tx = n.x; n.tz = n.z; o.position.set(n.x, World.groundY(n.x, n.z), n.z); G.npcs.push(n);
    });
    return { g, B, P, lamps, people };
  },
  // market town of shophouses along a main street that runs north from the coast road
  thong() {
    const cx = 170, cz = -268, { g, B, P, lamps, people } = this.kit(cx, cz), L = Math.PI / 2, Rr = -Math.PI / 2;
    const shop2 = (wall, roof, sign, bg, aw) => ({ w: 9, d: 8, h: 6, rows: 2, roofH: 2.2, wall, roof, sign, signStyle: { bg }, awning: aw, winF: [-2.6, 2.6], winS: [0], ww: 1.4, wh: 1.3, shutter: 0x6d4c41 });
    B(shop2(0xffe0b2, 0x8d3b2a, 'ไอทีซิตี้ ทุ่งทอง', '#0d47a1', 0x1e88e5), cx - 11, cz - 24, L, 'itshop', '💻');
    B(shop2(0xf8bbd0, 0x6d4c41, 'ร้านอาหารจีนเจ๊กิม', '#b71c1c', 0xe53935), cx - 11, cz - 10, L, 'restaurant', '🥟');
    B(shop2(0xdcedc8, 0x33691e, 'ร้านวัสดุก่อสร้าง', '#33691e', 0x7cb342), cx - 11, cz + 4, L, 'hardware', '🧰');
    B(shop2(0xfff9c4, 0x795548, 'สุขใจมาร์ท ทุ่งทอง', '#2e7d32', 0xff7043), cx - 11, cz + 18, L, 'mart', '🏪');
    B({ w: 14, d: 10, h: 4.6, flat: true, glassFront: true, wall: 0xfafafa, roof: 0xe0e0e0, sign: 'โชว์รูมรถทุ่งทองมอเตอร์', signStyle: { bg: '#263238' }, doorX: 4.5 }, cx + 12, cz - 22, Rr, 'dealer2', '🚙');
    const bank = B({ w: 10, d: 8, h: 4.4, flat: true, glassFront: true, wall: 0xfff8e1, roof: 0xd7ccc8, sign: 'ธนาคารสุขใจ สาขาทุ่งทอง', signStyle: { bg: '#00695c' } }, cx + 11, cz - 6, Rr);
    P(bank, '🏦', 'ธนาคารสุขใจ สาขาทุ่งทอง', () => Bank2.ui());
    const pol = B({ w: 10, d: 8, h: 4.4, flat: true, wall: 0xf1ebdc, roof: 0xe8e2d4, sign: 'สถานีตำรวจทุ่งทอง', signStyle: { bg: '#1d2f5a' } }, cx + 11, cz + 8, Rr);
    P(pol, '🚓', 'สถานีตำรวจทุ่งทอง', () => Emergency.stationUI('police'));
    const hos = B({ w: 11, d: 8, h: 4.4, flat: true, glassFront: true, wall: 0xffffff, roof: 0xe3f2fd, sign: 'โรงพยาบาลทุ่งทอง', signStyle: { bg: '#1565c0' } }, cx + 11, cz + 22, Rr);
    P(hos, '🏥', 'โรงพยาบาลทุ่งทอง', () => Life2.clinicUI());
    // gate arch and red lanterns over the street
    const red = mc(0xc62828), gold = mc(0xe0b13a, { metalness: 0.5, roughness: 0.3 });
    for (const s of [-1, 1]) U.mk(g, GEO.cyl, red, [cx + s * 6, 3, cz - 36], [0.35, 6, 0.35]);
    U.mk(g, GEO.box, red, [cx, 6.2, cz - 36], [14, 0.6, 0.8]); U.mk(g, GEO.box, gold, [cx, 6.8, cz - 36], [12, 0.5, 0.6]);
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.1), new THREE.MeshStandardMaterial({ map: U.signTex('เมืองทุ่งทอง', { w: 512, h: 96, bg: '#b71c1c', fg: '#ffe082' }) })); sg.position.set(cx, 6.2, cz - 35.55); g.add(sg);
    for (const s of [-1, 1]) Col.circle(cx + s * 6, cz - 36, 0.4);
    for (let z = cz - 28; z <= cz + 28; z += 7) U.mk(g, GEO.sph, new THREE.MeshBasicMaterial({ color: 0xff5252 }), [cx, 5.2, z], [0.35, 0.45, 0.35]);
    lamps(cx - 6.6, cz - 30, cx - 6.6, cz + 30, 4); lamps(cx + 6.6, cz - 30, cx + 6.6, cz + 30, 4);
    people(TOWN4_NAMES.thong, { x: cx, z: cz });
  },
  // new town with the driving school, pet centre and arena
  phupha() {
    const cx = -105, cz = -400, { g, B, P, lamps, people } = this.kit(cx, cz), L = Math.PI / 2, Rr = -Math.PI / 2;
    const school = B({ w: 13, d: 9, h: 4.4, flat: true, glassFront: true, wall: 0xfffde7, roof: 0xf9a825, sign: 'โรงเรียนสอนขับรถภูผา', signStyle: { bg: '#f57f17', fg: '#1b1b1b' }, doorX: -3 }, cx - 13, cz - 20, L);
    this.schoolDoor = school;
    P(school, '🚘', 'โรงเรียนสอนขับรถภูผา', () => DriveSchool.ui());
    const pets = B({ w: 12, d: 9, h: 4.2, roofH: 2.4, wall: 0xe1f5fe, roof: 0x0277bd, sign: 'ศูนย์สัตว์เลี้ยงภูผา', signStyle: { bg: '#0277bd' }, awning: 0x4fc3f7, winF: [-3, 3] }, cx - 13, cz + 6, L, 'petshop', '🐾');
    B({ w: 10, d: 8, h: 4, flat: true, glassFront: true, wall: 0xefebe9, roof: 0x8d6e63, sign: 'ไอทีสโตร์ ภูผา', signStyle: { bg: '#4527a0' } }, cx + 12, cz - 22, Rr, 'itshop', '💻');
    B({ w: 9, d: 7, h: 3.6, roofH: 2.2, wallTex: 'wood', wall: 0xd7ccc8, roof: 0x5d4037, sign: 'คาเฟ่ริมเขา', awning: 0x6d4c41, pots: true }, cx + 11, cz - 6, Rr, 'citycafe', '☕');
    B({ w: 9, d: 7, h: 3.6, roofH: 2.2, wall: 0xfce4ec, roof: 0xad1457, sign: 'ร้านดอกไม้ภูผา', awning: 0xf06292, flowers: true }, cx + 11, cz + 8, Rr, 'florist', '💐');
    // driving test yard with cones, and the pet arena with a racing oval
    const yard = { x: cx - 30, z: cz - 20 }; this.yard = yard;
    U.mk(g, new THREE.PlaneGeometry(22, 30), new THREE.MeshStandardMaterial({ map: T.road, roughness: 0.85 }), [yard.x, 0.03, yard.z], 1, [-Math.PI / 2, 0, 0]);
    const cone = mc(0xff6d00, { roughness: 0.6 });
    this.cones = [];
    for (const [x, z] of [[-6, -10], [6, -10], [-6, -4], [6, -4], [0, 2], [-6, 8], [6, 8], [-3, 12], [3, 12]]) { U.mk(g, GEO.cone, cone, [yard.x + x, 0.35, yard.z + z], [0.25, 0.7, 0.25]); this.cones.push({ x: yard.x + x, z: yard.z + z }); }
    const arena = { x: cx + 30, z: cz + 14 }; this.arena = arena;
    U.mk(g, new THREE.RingGeometry(9, 13, 40), texMat('dirt', 0xc8a67a), [arena.x, 0.04, arena.z], 1, [-Math.PI / 2, 0, 0]);
    for (let i = 0; i < 40; i++) { const a = i / 40 * TAU; U.mk(g, GEO.box, mc(0xfafafa), [arena.x + Math.cos(a) * 13.3, 0.5, arena.z + Math.sin(a) * 13.3], [0.08, 1, 0.08]); }
    U.mk(g, GEO.cyl, mc(0x66bb6a), [arena.x, 0.05, arena.z], [8.6, 0.1, 8.6]);
    World.pois.push({ kind: 'act', x: arena.x - 14, z: arena.z, r: 2.6, label: 'สนามแข่งและประกวดสัตว์เลี้ยง', icon: '🏆', map: true, act: () => ({ icon: '🏆', label: 'สนามแข่ง/ประกวดสัตว์เลี้ยง', fn: () => Pets2.arenaUI() }) });
    lamps(cx - 6.6, cz - 30, cx - 6.6, cz + 30, 4); lamps(cx + 6.6, cz - 30, cx + 6.6, cz + 30, 4);
    people(TOWN4_NAMES.phupha, { x: cx, z: cz });
  },
};
