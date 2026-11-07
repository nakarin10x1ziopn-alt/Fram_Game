'use strict';
// ---------- Walk-in interiors: every shop and public building has a real room with staff at the counter ----------
const RM0 = new THREE.Vector3(2600, 0, 2600);
const ROOM_KIND = {
  police: { w: 14, d: 11, floor: 0xcfd8dc, wall: 0xe8eaf6, title: 'สถานีตำรวจ' },
  fire: { w: 16, d: 12, floor: 0xb0bec5, wall: 0xffebee, title: 'สถานีดับเพลิง' },
  bank: { w: 13, d: 10, floor: 0xe0d7c6, wall: 0xfff8e1, title: 'ธนาคาร' },
  hospital: { w: 14, d: 10, floor: 0xe3f2fd, wall: 0xffffff, title: 'โรงพยาบาล' },
  school: { w: 13, d: 11, floor: 0xd7ccc8, wall: 0xfff3e0, title: 'ห้องเรียน' },
  restaurant: { w: 13, d: 10, floor: 0xbcaaa4, wall: 0xfbe9e7, title: 'ร้านอาหาร' },
  mall: { w: 18, d: 13, floor: 0xeceff1, wall: 0xf3e5f5, title: 'ห้างสรรพสินค้า' },
  shop: { w: 11, d: 9, floor: 0xd7ccc8, wall: 0xfffde7, title: 'ร้านค้า' },
};
const SHOP_ROOM = { restaurant: 'restaurant', seafood: 'restaurant', mall: 'mall' };
// building POIs (by label) that become walk-in rooms, with who serves you there
const BUILDING_ROOMS = [
  [/สถานีตำรวจ/, 'police', { name: 'ร.ต.ท.สมชาย', look: UNIFORM.police }],
  [/สถานีดับเพลิง/, 'fire', { name: 'หัวหน้าวิชัย', look: UNIFORM.fire }],
  [/ธนาคาร/, 'bank', { name: 'พนักงานธนาคารแอน', avatar: 'toon:chic' }],
  [/โรงพยาบาล|คลินิก/, 'hospital', { name: 'หมอนิด', avatar: 'Olivia' }],
  [/โรงเรียน/, 'school', { name: 'ครูสมศรี', avatar: 'toon:civil' }],
];

const Rooms = {
  group: null, cols: [], cur: null, staff: [],
  init() {
    this.group = new THREE.Group(); this.group.visible = false; G.scene.add(this.group);
    this.amb = new THREE.AmbientLight(0xfff4e0, 0); G.scene.add(this.amb);
    // wrap building and shop entrances so you walk inside instead of opening a menu at the door
    for (const poi of World.pois) {
      if (poi.kind === 'shop' && poi.id !== 'floating' && !poi.noRoom && SHOPS[poi.id]) poi.room = { kind: SHOP_ROOM[poi.id] || 'shop', shop: poi.id, title: SHOPS[poi.id].n };
      if (poi.kind === 'act') for (const [re, kind, staff] of BUILDING_ROOMS) if (re.test(poi.label) && !poi.room) { const orig = poi.act; poi.room = { kind, title: poi.label, staff, service: () => { const a = orig(); a && a.fn(); } }; }
    }
  },
  entrance(poi) { return { icon: '🚪', label: 'เข้าไปใน ' + poi.room.title, fn: () => this.enter(poi) }; },
  keeperFor(def) {
    if (def.staff) return def.staff;
    const n = G.npcs.find(x => x.keeper === def.shop);
    return n ? { name: n.name, avatar: n.obj.userData.avName || null, npc: n } : { name: 'พนักงานร้าน', avatar: 'toon:jacket' };
  },
  enter(poi) {
    const def = poi.room, K = ROOM_KIND[def.kind];
    UI.close(); Sfx.door();
    fade(() => {
      if (Fish.st) Fish.end();
      this.saved = this.saved || { room: World.room, pois: World.inPois };
      this.build(def, K);
      this.cur = { def, back: { x: poi.x, z: poi.z, away: G.away } };
      G.inRoom = true; G.inside = true; this.amb.intensity = 0.75; World.room = { w: K.w, d: K.d }; World.inPois = this.pois;
      World.outdoor.visible = false; World.interior.visible = false; World.sky.visible = false; World.stars.visible = false; this.group.visible = true;
      if (G.away) G.away.g.visible = false;
      G.scene.background = new THREE.Color(0x2b2622);
      G.player.pos.set(RM0.x, 0, RM0.z + K.d / 2 - 1.2); G.player.rot = Math.PI; G.cam.yaw = 0; G.cam.pitch = 0.75; G.cam.dist = Math.min(G.cam.dist, 8); snapCam(); UI.buttons();
      UI.toast(`ยินดีต้อนรับสู่${def.title}`, '🚪');
    });
  },
  leave(instant) {
    if (!G.inRoom) return;
    const go = () => {
      const c = this.cur; G.inRoom = false; this.group.visible = false; this.amb.intensity = 0; this.cols.forEach(x => Col.remove(x)); this.cols = [];
      World.room = this.saved.room; World.inPois = this.saved.pois; this.saved = null;
      setInside(false);
      if (c.back.away) { G.away = c.back.away; G.away.g.visible = true; }
      const b = c.back; G.player.pos.set(b.x, G.away ? G.away.y : World.groundY(b.x, b.z), b.z); snapCam();
      this.cur = null;
    };
    if (instant) go(); else { Sfx.door(); fade(go); }
  },
  // ---- room builder ----
  build(def, K) {
    const g = this.group; while (g.children.length) g.remove(g.children[0]); this.cols.forEach(x => Col.remove(x)); this.cols = []; this.pois = []; this.staff = [];
    const W = K.w, D = K.d, X = RM0.x, Z = RM0.z, wallM = texMat('plaster', K.wall), floorM = texMat(def.kind === 'police' || def.kind === 'hospital' || def.kind === 'mall' || def.kind === 'bank' ? 'paving' : 'wood', K.floor);
    const box = (x, z, w, d, h, m, y = 0, col = true) => { const o = U.mk(g, GEO.box, m, [X + x, y + h / 2, Z + z], [w, h, d]); if (col) this.cols.push(Col.box(X + x, Z + z, w / 2, d / 2, 0)); return o; };
    U.mk(g, new THREE.PlaneGeometry(W, D), floorM, [X, 0.01, Z], 1, [-Math.PI / 2, 0, 0]);
    box(0, -D / 2, W, 0.2, 3.4, wallM); box(-W / 2, 0, 0.2, D, 3.4, wallM); box(W / 2, 0, 0.2, D, 3.4, wallM);
    // the entrance wall is kept low so the camera can look into the room
    box(-W / 4 - 0.6, D / 2, W / 2 - 1.2, 0.2, 1.0, wallM); box(W / 4 + 0.6, D / 2, W / 2 - 1.2, 0.2, 1.0, wallM);
    U.mk(g, GEO.box, mc(0x6d4c41), [X, 0.05, Z + D / 2], [2.4, 0.1, 0.3]);
    for (let i = -1; i <= 1; i++) U.mk(g, GEO.box, new THREE.MeshBasicMaterial({ color: 0xfff6dc }), [X + i * W / 3.2, 3.37, Z], [1.6, 0.04, 0.4]);
    this.pois.push({ kind: 'act', x: X, z: Z + D / 2 - 0.5, r: 1.5, label: 'ออกจากอาคาร', icon: '🚪', act: () => ({ icon: '🚪', label: 'ออกไปข้างนอก', fn: () => this.leave() }) });
    const staffAt = (x, z, who, label, fn, rot = 0) => {
      const o = Models.human(Object.assign({ skin: 0xe0a87e, hair: 0x1b120c }, who.look || {}, who.avatar ? { avatar: who.avatar } : {}));
      o.position.set(X + x, 0, Z + z); o.rotation.y = rot; g.add(o); this.staff.push(o);
      this.pois.push({ kind: 'act', x: X + x, z: Z + z + (rot === 0 ? 1.6 : -1.6), r: 1.6, label, icon: '🙋', act: () => ({ icon: '🙋', label: `${who.name}: ${label}`, fn }) });
    };
    const counter = (x, z, w, m = mc(0x8d6e63)) => { box(x, z, w, 0.7, 1.05, m); U.mk(g, GEO.box, mc(0xeeeeee), [X + x, 1.08, Z + z], [w + 0.1, 0.06, 0.8]); };
    const keeper = this.keeperFor(def);
    const kind = def.kind;
    if (kind === 'shop') {
      counter(0, -D / 2 + 2.2, 4);
      for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) { box(sx * (W / 2 - 0.5), -2.5 + i * 2.2, 0.6, 1.8, 2.2, mc(0x8d6e63)); for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) U.mk(g, GEO.box, mc([0xe57373, 0x81c784, 0x64b5f6, 0xffd54f, 0xba68c8][(i + r + k) % 5]), [X + sx * (W / 2 - 0.5), 0.5 + r * 0.6, Z - 3.1 + i * 2.2 + k * 0.4], [0.4, 0.4, 0.3]); }
      staffAt(0, -D / 2 + 1.3, keeper, 'ซื้อ / ขายของ', () => this.openShop(def));
    } else if (kind === 'restaurant') {
      counter(0, -D / 2 + 1.6, 5);
      for (const [x, z] of [[-3.5, 0], [0, 0], [3.5, 0], [-3.5, 2.6], [3.5, 2.6]]) { box(x, z, 1.2, 1.2, 0.75, mc(0x6d4c41)); for (const s of [-1, 1]) box(x + s * 0.95, z, 0.45, 0.45, 0.45, mc(0x8d6e63)); this.pois.push({ kind: 'act', x: X + x, z: Z + z + 1.1, r: 1.1, label: 'โต๊ะอาหาร', icon: '🍽️', act: () => ({ icon: '🍽️', label: 'นั่งสั่งอาหารที่โต๊ะนี้', fn: () => Food.open(def.shop) }) }); }
      staffAt(0, -D / 2 + 0.8, keeper, 'สั่งอาหาร / สั่งกลับบ้าน', () => Food.open(def.shop));
    } else if (kind === 'mall') {
      MALL.forEach((m, i) => { const x = -W / 2 + 2 + (i % 4) * ((W - 4) / 3), z = i < 4 ? -D / 2 + 2.2 : 1.2; counter(x, z, 2.6, mc([0xab47bc, 0x42a5f5, 0x66bb6a, 0xffa726, 0xef5350, 0x26a69a, 0x8d6e63][i % 7]));
        const s = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.5), new THREE.MeshBasicMaterial({ map: U.signTex(m[0], { w: 384, h: 80, bg: '#4a148c' }) })); s.position.set(X + x, 2.4, Z + z - 0.36); g.add(s);
        staffAt(x, z - 0.9, { name: 'พนักงานแผนก', avatar: ['toon:chic', 'Erika', 'toon:jacket', 'Lydia', 'toon:skater', 'Olivia', 'Kate'][i % 7] }, m[0], () => { UI.shop('mall'); UI.cur.tab = i; UI.renderBody(); }); });
    } else if (kind === 'bank') {
      counter(0, -D / 2 + 2, W - 3, mc(0x00695c));
      for (let i = -1; i <= 1; i++) U.mk(g, GEO.box, M.glass, [X + i * 3, 1.7, Z - D / 2 + 2], [2.2, 1.1, 0.04]);
      for (let i = 0; i < 4; i++) box(-3 + i * 2, 2.5, 1.2, 0.5, 0.45, mc(0x37474f));
      staffAt(0, -D / 2 + 1.1, def.staff, 'ฝาก ถอน กู้ ลงทุน ประกัน', def.service);
      staffAt(3, -D / 2 + 1.1, { name: 'พนักงานบริการลูกค้า', avatar: 'toon:suit' }, 'ชำระค่าน้ำค่าไฟ / ดูรายการ', () => Phone.open('bank'));
    } else if (kind === 'police') {
      counter(0, -D / 2 + 2.4, 5, mc(0x1d2f5a));
      for (let i = 0; i < 9; i++) U.mk(g, GEO.cylLo, M.metal, [X + W / 2 - 3.6 + i * 0.4, 1.4, Z - D / 2 + 1.6], [0.03, 2.8, 0.03]);
      box(W / 2 - 1.9, -D / 2 + 1.6, 3.6, 0.1, 0.1, M.metal, 2.8, false);
      box(-W / 2 + 1.5, 1.5, 0.5, 3, 0.45, mc(0x5d4037));
      staffAt(0, -D / 2 + 1.5, def.staff, 'แจ้งความ / สอบใบขับขี่ / บริการ', def.service);
      Stations2.policeRoom(g, this.pois, X, Z, W, D, box);
    } else if (kind === 'fire') {
      const truck = Emergency.vehicleModel('fire'); truck.g.position.set(X - 3.5, 0, Z - 1); g.add(truck.g); this.cols.push(Col.box(X - 3.5, Z - 1, 1.2, 2.6, 0));
      for (let i = 0; i < 5; i++) { box(W / 2 - 0.4, -3 + i * 1.0, 0.5, 0.8, 2, mc(0xc62828)); U.mk(g, GEO.sph, mc(0xffd54f), [X + W / 2 - 0.65, 1.6, Z - 3 + i], 0.14); }
      U.mk(g, GEO.cylLo, M.metal, [X + 2, 1.7, Z + 1], [0.06, 3.4, 0.06]); this.cols.push(Col.circle(X + 2, Z + 1, 0.12));
      counter(3, -D / 2 + 2, 3.5, mc(0xb71c1c));
      staffAt(3, -D / 2 + 1.2, def.staff, 'ซื้อถังดับเพลิง / อบรม / บริการ', def.service);
      Stations2.fireRoom(g, this.pois, X, Z, W, D, box);
    } else if (kind === 'hospital') {
      counter(0, -D / 2 + 2, 4, mc(0x1565c0));
      for (const x of [-4.5, 4.5]) { box(x, 1.5, 1.1, 2.1, 0.6, mc(0xffffff)); U.mk(g, GEO.box, mc(0x90caf9), [X + x, 0.68, Z + 0.7], [1, 0.12, 0.5]); }
      staffAt(0, -D / 2 + 1.2, def.staff, 'พบแพทย์ / รักษา / นวด', def.service);
    } else if (kind === 'school') {
      U.mk(g, GEO.box, mc(0x2e5d3a), [X, 1.7, Z - D / 2 + 0.12], [5, 1.6, 0.05]);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { box(-4.5 + c * 3, -1 + r * 2.2, 1.1, 0.6, 0.75, mc(0xa1887f)); box(-4.5 + c * 3, -0.4 + r * 2.2, 0.45, 0.45, 0.45, mc(0x5d4037)); }
      staffAt(0, -D / 2 + 1.2, def.staff, 'เรียนภาคค่ำ / เรื่องลูก ๆ', def.service);
    }
    World.inPois = this.pois;
  },
  openShop(def) { UI.shop(def.shop); },
  update(dt) { if (G.inRoom) for (const o of this.staff) Models.animHuman(o, dt, 0, null); },
};
