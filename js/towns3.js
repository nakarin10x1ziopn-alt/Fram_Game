'use strict';
// ---------- Two more towns with shops, bank, police, hospital and people: เชียงสุข (old Lanna town) and สุขใจซิตี้ (modern city) ----------
SHOPS.nightmarket = { n: 'ถนนคนเดินเชียงสุข', tabs: [{ n: 'ของกิน', items: ['food:khanom', 'food:mango', 'food:thaitea', 'food:boat', 'food:cocoa'] }, { n: 'งานฝีมือ', items: ['tool:wear_scarf', 'tool:wear_bracelet', 'tool:wear_crown', 'tool:card', 'furn:lanternL', 'furn:elephant'] }] };
SHOPS.citycafe = { n: 'คาเฟ่ลอยฟ้า สุขใจซิตี้', tabs: [{ n: 'เมนู', items: ['food:coffee', 'food:cake', 'food:bingsu', 'food:sandwich', 'food:thaitea'] }] };
const TOWN_NAMES = { a: ['ป้าบัวคำ', 'ลุงแสง', 'พี่เอื้อง', 'น้องคำแก้ว', 'พี่จันทร์', 'ตาหนานอิ่น'], b: ['พี่เจมส์', 'คุณมิ้ว', 'พี่ต่อ', 'คุณนิว', 'พี่แพท', 'น้องไอซ์'] };
TOWN_NAMES.a.forEach(n => NPC_NAMES.push(n)); TOWN_NAMES.b.forEach(n => NPC_NAMES.push(n));

const Town3 = {
  init() {
    Town2.areas.chiang = this.build('chiang', 'เชียงสุข (เมืองเก่า)', '🏮', 3600, 3000, 'a');
    Town2.areas.city = this.build('city', 'สุขใจซิตี้ (เมืองใหม่)', '🏙️', 3600, 3600, 'b');
    TAXI_DEST.push({ n: 'เชียงสุข (เมืองเก่าล้านนา)', away: 'chiang', fee: 300 }, { n: 'สุขใจซิตี้ (เมืองใหม่)', away: 'city', fee: 450 });
  },
  build(key, name, icon, cx, cz, set) {
    const A = Town2.area(name, icon, cx, cz, new THREE.MeshStandardMaterial({ map: T.grass, color: U.col(set === 'a' ? 0x8fb27a : 0x9aa79a), roughness: 0.95 }), `ถึง${name}แล้ว`, { x: -14, z: -262 });
    const g = A.g; A.x0 = cx - 70; A.x1 = cx + 70; A.z0 = cz - 70; A.z1 = cz + 70;
    // main street with sidewalks
    const road = new THREE.MeshStandardMaterial({ map: T.road, normalMap: T.road_n || null, roughness: 0.85 });
    const r1 = U.mk(g, new THREE.PlaneGeometry(8, 140), road, [cx, 0.02, cz], 1, [-Math.PI / 2, 0, 0]); r1.receiveShadow = true;
    const pave = texMat('paving', 0xe2dbd0, { roughness: 0.9 });
    for (const s of [-1, 1]) U.mk(g, U.box(3, 0.1, 140, 2), pave, [cx + s * 5.5, 0.05, cz]);
    const P = (x, z, icon, label, fn, room) => { const p = { kind: 'act', x, z, r: 2.6, label, icon, act: () => G.away === A ? { icon, label, fn } : null }; if (room) p.room = room; World.pois.push(p); };
    const B = (o, x, z, rot, shop, icon) => {
      const b = World.building(o); b.position.set(x, 0, z); b.rotation.y = rot; g.add(b); Col.box(x, z, o.w / 2 + 0.3, o.d / 2 + 0.3, rot, 'bld');
      const door = l2w(x, z, rot, o.doorX || 0, o.d / 2 + 1.7);
      if (shop) World.pois.push({ kind: 'shop', id: shop, x: door.x, z: door.z, r: 2.4, label: SHOPS[shop].n, icon: icon || '🏪', map: false });
      return door;
    };
    const L = Math.PI / 2, Rr = -Math.PI / 2;
    if (set === 'a') {
      const wood = { wallTex: 'wood', roofH: 2.8, h: 3.6, winF: [-2.5, 2.5], winS: [0], flowers: true, pots: true };
      B(Object.assign({ w: 10, d: 8, wall: 0xb08968, roof: 0x4e342e, sign: 'ข้าวซอยเชียงสุข', signStyle: { bg: '#6d4c41' }, awning: 0xd84315 }, wood), cx - 11, cz - 40, L, 'restaurant', '🍜');
      B(Object.assign({ w: 10, d: 8, wall: 0xc8a27c, roof: 0x5d4037, sign: 'ร้านเกษตรเชียงสุข', awning: 0x558b2f, crates: true }, wood), cx - 11, cz - 20, L, 'farmshop', '🌱');
      B(Object.assign({ w: 10, d: 8, wall: 0xa1887f, roof: 0x3e2723, sign: 'เฟอร์นิเจอร์ไม้สัก' }, wood), cx - 11, cz, L, 'carpenter', '🔨');
      B(Object.assign({ w: 10, d: 8, wall: 0xd7ccc8, roof: 0x4e342e, sign: 'ร้านดอกไม้ล้านนา', awning: 0xec407a }, wood), cx - 11, cz + 20, L, 'florist', '💐');
      B(Object.assign({ w: 10, d: 8, wall: 0xf5f5f5, roof: 0x795548, sign: 'สุขใจมาร์ท สาขาเชียงสุข', awning: 0xff7043 }, wood), cx + 11, cz - 40, Rr, 'mart', '🏪');
      const bank = B({ w: 11, d: 8, h: 4.2, flat: true, wall: 0xfff8e1, roof: 0xd7ccc8, sign: 'ธนาคารสุขใจ สาขาเชียงสุข', signStyle: { bg: '#00695c' }, glassFront: true }, cx + 11, cz - 20, Rr);
      P(bank.x, bank.z, '🏦', 'ธนาคารสุขใจ สาขาเชียงสุข', () => Bank2.ui());
      const pol = B({ w: 11, d: 8, h: 4.2, flat: true, wall: 0xf1ebdc, roof: 0xe8e2d4, sign: 'สถานีตำรวจเชียงสุข', signStyle: { bg: '#1d2f5a' } }, cx + 11, cz, Rr);
      P(pol.x, pol.z, '🚓', 'สถานีตำรวจเชียงสุข', () => Emergency.stationUI('police'));
      const hos = B({ w: 11, d: 8, h: 4.2, flat: true, wall: 0xffffff, roof: 0xe3f2fd, sign: 'โรงพยาบาลเชียงสุข', signStyle: { bg: '#1565c0' }, glassFront: true }, cx + 11, cz + 20, Rr);
      P(hos.x, hos.z, '🏥', 'โรงพยาบาลเชียงสุข', () => Life2.clinicUI());
      // walking street stalls with lanterns
      for (let i = 0; i < 6; i++) { const z = cz + 34 + i * 5, s = new THREE.Group(); s.position.set(cx, 0, z); g.add(s); U.mk(s, U.box(2.4, 0.9, 1.2, 1.2), M.wood, [-2.3, 0.45, 0]); const can = U.mk(s, GEO.box, U.mat([0xd84315, 0x6a1b9a, 0x00897b][i % 3], { map: T.stripes }), [-2.3, 2.3, 0], [2.7, 0.08, 1.6]); can.rotation.x = 0.15; for (const a of [-1, 1]) U.mk(s, GEO.cylLo, M.darkwood, [-2.3 + a * 1.1, 1.15, 0.5], [0.05, 2.3, 0.05]); U.mk(s, GEO.sph, new THREE.MeshBasicMaterial({ color: 0xffb74d }), [0, 3, 0], 0.22); Col.box(cx - 2.3, z, 1.3, 0.7); }
      World.pois.push({ kind: 'shop', id: 'nightmarket', x: cx - 0.5, z: cz + 44, r: 3, label: SHOPS.nightmarket.n, icon: '🏮', noRoom: true });
      // small temple
      const t = new THREE.Group(); t.position.set(cx - 30, 0, cz + 10); g.add(t); U.mk(t, U.box(10, 0.6, 8, 2), M.stone, [0, 0.3, 0]); U.mk(t, U.box(7, 3.5, 5, 2), texMat('plaster', 0xfaf6ee), [0, 2.35, 0]);
      for (const s of [1, -1]) { const r = U.mk(t, U.box(9, 0.15, 3.8, 2), mc(0x8e2a1e), [0, 4.9, s * 1.4]); r.rotation.x = s * 0.75; } Col.box(cx - 30, cz + 10, 5, 4);
    } else {
      const tower = (x, z, w, d, h, col) => { const b = new THREE.Group(); b.position.set(x, 0, z); g.add(b); U.mk(b, U.box(w, h, d, 3), texMat('plaster', col), [0, h / 2, 0]); const gl = mc(0x5d8aa8, { roughness: 0.1, metalness: 0.6 }); for (let y = 2; y < h - 1; y += 3) for (const s of [-1, 1]) U.mk(b, GEO.box, gl, [0, y, s * (d / 2 + 0.02)], [w * 0.85, 1.6, 0.04]); Col.box(x, z, w / 2, d / 2); };
      tower(cx - 30, cz - 30, 12, 12, 42, 0xb0bec5); tower(cx + 30, cz - 32, 14, 10, 55, 0xcfd8dc); tower(cx - 32, cz + 30, 12, 14, 36, 0x90a4ae); tower(cx + 30, cz + 30, 10, 10, 48, 0xeceff1);
      const glass = { flat: true, glassFront: true, h: 5, wall: 0xf5f5f5, roof: 0xe0e0e0 };
      B(Object.assign({ w: 18, d: 12, h: 7, rows: 2, sign: 'สุขใจซิตี้ มอลล์', signStyle: { bg: '#6a1b9a' } }, glass), cx - 13, cz - 40, L, 'mall', '🛍️');
      B(Object.assign({ w: 14, d: 10, sign: 'โชว์รูมซุปเปอร์คาร์ซิตี้', signStyle: { bg: '#212121' } }, glass), cx - 12, cz - 15, L, 'supercar', '🏎️');
      B(Object.assign({ w: 12, d: 9, sign: 'โชว์รูมรถยนต์ซิตี้', signStyle: { bg: '#1f4e8c' } }, glass), cx - 12, cz + 5, L, 'dealer', '🚗');
      B(Object.assign({ w: 11, d: 8, sign: 'ซีฟู้ดซิตี้', signStyle: { bg: '#0277bd' }, awning: 0x0288d1 }, glass), cx - 12, cz + 22, L, 'seafood', '🦐');
      B(Object.assign({ w: 10, d: 8, sign: 'คาเฟ่ลอยฟ้า', signStyle: { bg: '#4e342e' } }, glass), cx + 12, cz - 40, Rr, 'citycafe', '☕');
      const bank = B(Object.assign({ w: 11, d: 8, sign: 'ธนาคารสุขใจ สำนักงานใหญ่', signStyle: { bg: '#00695c' } }, glass), cx + 12, cz - 22, Rr);
      P(bank.x, bank.z, '🏦', 'ธนาคารสุขใจ สำนักงานใหญ่', () => Bank2.ui());
      const pol = B(Object.assign({ w: 12, d: 9, sign: 'สถานีตำรวจนครบาลซิตี้', signStyle: { bg: '#1d2f5a' } }, glass), cx + 12, cz - 4, Rr);
      P(pol.x, pol.z, '🚓', 'สถานีตำรวจนครบาลซิตี้', () => Emergency.stationUI('police'));
      const fire = B(Object.assign({ w: 13, d: 9, sign: 'สถานีดับเพลิงซิตี้', signStyle: { bg: '#b3261e' } }, glass), cx + 12, cz + 14, Rr);
      P(fire.x, fire.z, '🚒', 'สถานีดับเพลิงซิตี้', () => Emergency.stationUI('fire'));
      const hos = B(Object.assign({ w: 14, d: 10, sign: 'โรงพยาบาลสุขใจซิตี้', signStyle: { bg: '#1565c0' } }, glass), cx + 12, cz + 34, Rr);
      P(hos.x, hos.z, '🏥', 'โรงพยาบาลสุขใจซิตี้', () => Life2.clinicUI());
      for (let z = cz - 60; z <= cz + 60; z += 15) for (const s of [-1, 1]) { U.mk(g, GEO.cylLo, M.metal, [cx + s * 7.2, 2.5, z], [0.08, 5, 0.08]); U.mk(g, GEO.sph, new THREE.MeshBasicMaterial({ color: 0xfff3c4 }), [cx + s * 6.6, 5, z], 0.18); Col.circle(cx + s * 7.2, z, 0.12); }
    }
    // trees and benches around town
    const leaf = mc(set === 'a' ? 0x4f7a3a : 0x5c8f4a, { roughness: 0.9 }), trunk = mc(0x5d4037);
    for (let i = 0; i < 26; i++) { const x = cx + (Math.random() < 0.5 ? -1 : 1) * (22 + Math.random() * 40), z = cz - 60 + Math.random() * 120; if (Math.abs(x - cx) < 26 && Math.abs(z - cz) < 50) continue; U.mk(g, GEO.cylLo, trunk, [x, 1.2, z], [0.22, 2.4, 0.22]); U.mk(g, GEO.sph, leaf, [x, 3.3, z], [1.8, 1.6, 1.8]); Col.circle(x, z, 0.35); }
    P(cx + 3, cz + 62, '🚕', 'เรียกแท็กซี่กลับหมู่บ้านสุขใจ', () => Town2.leaveAway());
    A.spawn = { x: cx + 3, z: cz + 58 };
    // people living in town
    TOWN_NAMES[set].forEach((nm, i) => {
      const p = People.prof(nm), o = Models.human({ avatar: People.avatarFor(nm, i + (set === 'b' ? 3 : 0)) }); World.dyn.add(o);
      const n = { obj: o, name: nm, rot: 0, speed: 0, timer: i, st: 'idle', wave: 0, circ: { x: cx + (i % 2 ? 3 : -3), z: cz - 30 + i * 12, r: 2 } };
      n.x = n.circ.x; n.z = n.circ.z; n.tx = n.x; n.tz = n.z; o.position.set(n.x, 0, n.z); G.npcs.push(n);
    });
    return A;
  },
};
