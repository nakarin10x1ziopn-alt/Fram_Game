'use strict';
// ---------- Police & fire stations, fires, night thieves, and emergency vehicles that drive out on the roads ----------
const STATIONS = {
  police: { x: -22, z: -162, rot: Math.PI / 2, n: 'สถานีตำรวจภูธรสุขใจ' },
  fire: { x: 22, z: -162, rot: -Math.PI / 2, n: 'สถานีดับเพลิงสุขใจ' },
};
const UNIFORM = {
  police: { shirt: 0x7a6a45, pants: 0x5a4c30, hat: 'cap', capColor: 0x2b2b2b, longSleeve: true },
  fire: { shirt: 0x2a2f3a, pants: 0x2a2f3a, hat: 'cap', capColor: 0xd8b02a, longSleeve: true, apron: 0xe0b52a },
  ems: { shirt: 0xf2f2f2, pants: 0x3a5a8a, hat: null, longSleeve: true },
  thief: { shirt: 0x1d1d22, pants: 0x1d1d22, hat: 'cap', capColor: 0x111111, longSleeve: true, glasses: true },
};

const Emergency = {
  fires: [], vehicles: [], crews: [], thief: null, flameT: null, t: 0, sirenT: 0, caught: 0,
  init(scene) {
    this.scene = scene;
    this.flameTex = new THREE.CanvasTexture(U.canvas(64, 128, g => {
      const gr = g.createRadialGradient(32, 92, 2, 32, 80, 46);
      gr.addColorStop(0, 'rgba(255,250,210,1)'); gr.addColorStop(0.3, 'rgba(255,190,60,0.95)'); gr.addColorStop(0.65, 'rgba(240,80,20,0.6)'); gr.addColorStop(1, 'rgba(120,20,0,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(32, 2); g.bezierCurveTo(58, 48, 62, 96, 32, 126); g.bezierCurveTo(2, 96, 6, 48, 32, 2); g.fill();
    }));
    this.flameM = new THREE.SpriteMaterial({ map: this.flameTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    this.smokeM = new THREE.SpriteMaterial({ map: T.blob, color: 0x5a5a5a, transparent: true, opacity: 0.35, depthWrite: false });
    this.scorchM = new THREE.MeshBasicMaterial({ map: T.blob, color: 0x000000, transparent: true, opacity: 0.55, depthWrite: false });
    this.buildStations();
    S.emerg = S.emerg || { caught: 0, fires: 0, nextThief: 0 };
    G.targetHooks = G.targetHooks || []; G.targetHooks.push((consider, p, px, pz) => this.targets(consider, p, px, pz));
  },

  // ----- buildings -----
  buildStations() {
    const g = new THREE.Group();
    const thFlag = new THREE.CanvasTexture(U.canvas(96, 64, c => { const st = ['#a51931', '#f4f5f8', '#2d2a4a', '#2d2a4a', '#f4f5f8', '#a51931']; st.forEach((s, i) => { c.fillStyle = s; c.fillRect(0, i * 64 / 6, 96, 64 / 6 + 1); }); }));
    const flagpole = (p, x, z) => {
      U.mk(p, GEO.cylLo, M.metal, [x, 4, z], [0.06, 8, 0.06]); U.mk(p, GEO.sphLo, mc(0xe0b13a, { metalness: 0.5, roughness: 0.3 }), [x, 8.05, z], 0.12);
      const f = U.mk(p, new THREE.PlaneGeometry(1.5, 1), new THREE.MeshStandardMaterial({ map: thFlag, side: THREE.DoubleSide, roughness: 0.8 }), [x + 0.78, 7.4, z]); this.flags = (this.flags || []).concat(f);
      U.mk(p, U.box(1.2, 0.3, 1.2, 1), M.stone, [x, 0.15, z]);
    };
    const place = (k, o, extra) => {
      const s = STATIONS[k], b = World.building(o); b.position.set(s.x, 0, s.z); b.rotation.y = s.rot; g.add(b);
      Col.box(s.x, s.z, o.w / 2 + 0.3, o.d / 2 + 0.3, s.rot, 'bld');
      const f = new THREE.Group(); f.position.copy(b.position); f.rotation.y = s.rot; g.add(f); extra(f, o);
      World.clearNear(s.x, s.z, 12, true);
      const door = l2w(s.x, s.z, s.rot, o.doorX || 0, o.d / 2 + 1.8);
      World.pois.push({ kind: 'act', x: door.x, z: door.z, r: 2.6, label: s.n, icon: k === 'police' ? '🚓' : '🚒', map: true, act: () => ({ icon: k === 'police' ? '👮' : '🧑‍🚒', label: k === 'police' ? 'เข้าสถานีตำรวจ' : 'เข้าสถานีดับเพลิง', fn: () => this.stationUI(k) }) });
      s.door = door; s.out = l2w(s.x, s.z, s.rot, k === 'fire' ? -4.2 : 4.5, o.d / 2 + 4);
      const off = l2w(s.x, s.z, s.rot, k === 'fire' ? 1.6 : -1.6, o.d / 2 + 1.2);
      const h = Models.human(Object.assign({ skin: 0xe0a87e, hair: 0x1b120c }, UNIFORM[k])); h.position.set(off.x, H(off.x, off.z), off.z); h.rotation.y = s.rot; World.dyn.add(h);
      this.crews.push({ obj: h, idle: true });
    };
    // police: two storeys, cream walls with the navy band, flag, guard booth, parked patrol car
    place('police', { w: 15, d: 10, h: 6.4, rows: 2, flat: true, wall: 0xf1ebdc, roof: 0xe8e2d4, sign: STATIONS.police.n, signStyle: { bg: '#1d2f5a', fg: '#ffe9a8' }, winF: [-5, -2.6, 2.6, 5], winS: [-2.5, 2.5], winB: [-4, 0, 4], ww: 1.4, wh: 1.4, door: 0x5a3a22 }, (f, o) => {
      const navy = mc(0x1d2f5a, { roughness: 0.6 }), gold = mc(0xd9b13a, { metalness: 0.5, roughness: 0.35 });
      U.mk(f, GEO.box, navy, [0, 0.4 + 3.25, o.d / 2 + 0.03], [o.w + 0.06, 0.35, 0.06]);
      U.mk(f, GEO.box, navy, [0, 0.4 + 6.25, 0], [o.w + 0.5, 0.25, o.d + 0.5]);
      U.mk(f, GEO.cyl, gold, [0, 0.4 + 2.75, o.d / 2 + 0.08], [0.45, 0.05, 0.45], [Math.PI / 2, 0, 0]);
      U.mk(f, GEO.cyl, navy, [0, 0.4 + 2.75, o.d / 2 + 0.11], [0.3, 0.02, 0.3], [Math.PI / 2, 0, 0]);
      for (const sx of [-1, 1]) U.mk(f, GEO.cyl, mc(0xf4efe4), [sx * 1.3, 1.7, o.d / 2 + 1.4], [0.18, 2.6, 0.18]);
      const cp = U.mk(f, U.box(3.6, 0.15, 2.2, 2), navy, [0, 3.05, o.d / 2 + 1.1]); cp.rotation.x = 0.05;
      U.mk(f, U.box(4, 0.1, 6, 2), texMat('paving', 0xd9d4ca), [0, 0.05, o.d / 2 + 3]);
      flagpole(f, -6.5, o.d / 2 + 3.5);
      const booth = new THREE.Group(); booth.position.set(6.3, 0, o.d / 2 + 4.5); f.add(booth);
      U.mk(booth, U.box(1.6, 2.3, 1.6, 1), mc(0xf1ebdc), [0, 1.15, 0]); U.mk(booth, GEO.box, navy, [0, 2.4, 0], [1.9, 0.18, 1.9]);
      U.mk(booth, GEO.box, M.glass, [0, 1.5, 0.81], [1.1, 0.8, 0.02]);
      for (let i = 0; i < 5; i++) U.mk(f, GEO.cylLo, mc(i % 2 ? 0xf2f2f2 : 0xc62828), [-2 + i, 0.4, o.d / 2 + 6.4], [0.1, 0.8, 0.1]);
      const car = this.vehicleModel('police'); const p = l2w(0, 0, 0, 4.5, o.d / 2 + 4); car.g.position.set(p.x, 0, p.z); car.g.rotation.y = Math.PI; f.add(car.g); this.parked = { police: car };
    });
    // fire station: wide engine bay with red roll-up doors, drill tower, hydrant, engine parked out front
    place('fire', { w: 17, d: 11, h: 6.2, flat: true, wall: 0xf4f1ea, roof: 0xe5e1d8, sign: STATIONS.fire.n, signStyle: { bg: '#b3261e', fg: '#fff' }, winF: [], winS: [-3, 0, 3], winB: [-5, 0, 5], ww: 1.4, wh: 1.3, doorX: 1.3, door: 0x8a2a20 }, (f, o) => {
      const red = mc(0xc62828, { roughness: 0.45, metalness: 0.15 }), roll = new THREE.CanvasTexture(U.canvas(64, 128, c => { c.fillStyle = '#c9302a'; c.fillRect(0, 0, 64, 128); c.fillStyle = 'rgba(0,0,0,.22)'; for (let y = 0; y < 128; y += 8) c.fillRect(0, y, 64, 2); c.fillStyle = 'rgba(255,255,255,.12)'; for (let y = 3; y < 128; y += 8) c.fillRect(0, y, 64, 1); }));
      const rollM = new THREE.MeshStandardMaterial({ map: roll, roughness: 0.5, metalness: 0.2 });
      for (const x of [-5.4, -1.8 - 0.2]) { U.mk(f, GEO.box, M.trim, [x, 2.3, o.d / 2 + 0.04], [3.5, 4.1, 0.08]); U.mk(f, GEO.box, rollM, [x, 2.2, o.d / 2 + 0.09], [3.1, 3.7, 0.04]); }
      U.mk(f, GEO.box, red, [0, 0.4 + 5.0, o.d / 2 + 0.04], [o.w + 0.06, 0.4, 0.06]);
      U.mk(f, GEO.box, red, [0, 0.4 + 6.25, 0], [o.w + 0.5, 0.25, o.d + 0.5]);
      U.mk(f, U.box(9, 0.1, 7, 2), texMat('paving', 0xcfc9bd), [-3.6, 0.05, o.d / 2 + 3.5]);
      for (const x of [-7.2, -3.6, 0]) U.mk(f, GEO.box, mc(0xf2c94c), [x, 0.11, o.d / 2 + 3.5], [0.15, 0.02, 7]);
      // drill tower
      const tw = new THREE.Group(); tw.position.set(o.w / 2 + 2.2, 0, -1.5); f.add(tw);
      U.mk(tw, U.box(3, 13, 3, 2), texMat('brick', 0xffffff), [0, 6.5, 0]);
      U.mk(tw, GEO.box, red, [0, 13.15, 0], [3.4, 0.3, 3.4]);
      for (let y = 2.5; y < 12; y += 3.2) U.mk(tw, GEO.box, M.glass, [0, y, 1.51], [1.1, 1.3, 0.04]);
      U.mk(tw, GEO.cyl, mc(0xe0e0e0, { metalness: 0.5, roughness: 0.3 }), [1.7, 7, 1.6], [0.04, 12, 0.04]);
      Col.box(...Object.values(l2w(STATIONS.fire.x, STATIONS.fire.z, STATIONS.fire.rot, o.w / 2 + 2.2, -1.5)), 1.6, 1.6, STATIONS.fire.rot, 'bld');
      // hydrant + hose reel
      const hy = new THREE.Group(); hy.position.set(4.5, 0, o.d / 2 + 2); f.add(hy);
      U.mk(hy, lathe('hydr', [[0, 0], [0.18, 0], [0.18, 0.08], [0.13, 0.1], [0.13, 0.6], [0.16, 0.62], [0.1, 0.8], [0, 0.82]], 14), red);
      for (const s of [-1, 1]) U.mk(hy, GEO.cylLo, red, [s * 0.16, 0.45, 0], [0.06, 0.12, 0.06], [0, 0, Math.PI / 2]);
      U.mk(f, GEO.cyl, red, [6.8, 1.0, o.d / 2 + 0.4], [0.6, 0.3, 0.6], [Math.PI / 2, 0, 0]);
      U.mk(f, GEO.cyl, mc(0xe8dcc0, { roughness: 0.9 }), [6.8, 1.0, o.d / 2 + 0.45], [0.45, 0.32, 0.45], [Math.PI / 2, 0, 0]);
      flagpole(f, 7.6, o.d / 2 + 5.5);
      const car = this.vehicleModel('fire'); const p = l2w(0, 0, 0, -4.2, o.d / 2 + 4.2); car.g.position.set(p.x, 0, p.z); car.g.rotation.y = 0; f.add(car.g); this.parked.fire = car;
    });
    World.outdoor.add(g);
    this.stationGroup = g;
  },
  // emergency vehicles are the pickup body with livery, light bar and gear on the back
  vehicleModel(kind) {
    const col = { police: 0xf4f4f4, fire: 0xc62828, ems: 0xfafafa }[kind], kn = { police: 'police', fire: 'firetruck', ems: 'ambulance' }[kind];
    const kc = Assets.has('car:' + kn) ? Models.kcar(kn) : null;
    const car = kc || Models.car('pickup', col), g = car.g, by = kc ? kc.top + 0.06 : 1.93, bz = kc ? -0.2 : 0.5;
    const navy = mc(kind === 'police' ? 0x1d2f5a : kind === 'ems' ? 0xe65100 : 0xf2f2f2, { roughness: 0.5 });
    if (!kc) for (const s of [-1, 1]) U.mk(g, GEO.box, navy, [s * 0.985, 0.78, 0], [0.02, 0.16, 4.2]);
    U.mk(g, GEO.box, M.metal, [0, by - 0.09, bz], [1.3, 0.08, 0.3]);
    const red = new THREE.MeshBasicMaterial({ color: 0xff2a2a }), blue = new THREE.MeshBasicMaterial({ color: kind === 'fire' ? 0xff2a2a : 0x2a6bff });
    const lr = U.mk(g, GEO.box, red, [-0.35, by, bz], [0.5, 0.12, 0.24]), lb = U.mk(g, GEO.box, blue, [0.35, by, bz], [0.5, 0.12, 0.24]);
    if (kc) { /* body, ladder and markings come with the model */ } else if (kind === 'fire') {
      U.mk(g, U.box(1.8, 1.0, 2.3, 1), mc(0xb71c1c, { roughness: 0.4 }), [0, 1.65, -1.35]);
      for (const y of [1.4, 1.85]) U.mk(g, GEO.box, mc(0xf2f2f2), [0, y, -1.35], [1.82, 0.06, 2.32]);
      for (const s of [-1, 1]) U.mk(g, GEO.cylLo, mc(0xd5d9dc, { metalness: 0.5, roughness: 0.3 }), [s * 0.45, 2.3, -0.8], [0.04, 3.6, 0.04], [Math.PI / 2, 0, 0]);
      for (let i = 0; i < 9; i++) U.mk(g, GEO.cylLo, mc(0xd5d9dc), [0, 2.3, -2.5 + i * 0.42], [0.03, 0.9, 0.03], [0, 0, Math.PI / 2]);
      U.mk(g, GEO.cyl, mc(0xe8dcc0), [0, 1.35, -2.55], [0.35, 0.25, 0.35], [Math.PI / 2, 0, 0]);
    } else if (kind === 'ems') {
      U.mk(g, U.box(1.9, 1.5, 2.6, 1), mc(0xfafafa, { roughness: 0.4 }), [0, 1.9, -1.2]);
      U.mk(g, GEO.box, new THREE.MeshBasicMaterial({ color: 0xd32f2f }), [0, 2.0, -2.51], [0.5, 0.15, 0.02]); U.mk(g, GEO.box, new THREE.MeshBasicMaterial({ color: 0xd32f2f }), [0, 2.0, -2.51], [0.15, 0.5, 0.02]);
    } else {
      U.mk(g, GEO.box, M.glass, [0, 1.25, -1.5], [1.6, 0.25, 1.6]);
    }
    const glowR = new THREE.SpriteMaterial({ map: T.glow, color: 0xff3030, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const glowB = new THREE.SpriteMaterial({ map: T.glow, color: kind === 'fire' ? 0xff5030 : 0x3070ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const sr = new THREE.Sprite(glowR), sb = new THREE.Sprite(glowB); sr.scale.setScalar(2.2); sb.scale.setScalar(2.2); sr.position.set(-0.35, by + 0.07, bz); sb.position.set(0.35, by + 0.07, bz); g.add(sr, sb);
    car.bar = { lr, lb, glowR, glowB, red, blue }; car.kind = kind;
    return car;
  },
  flash(car, t, on) {
    const a = on ? (Math.floor(t * 6) % 2) : -1, b = car.bar;
    b.glowR.opacity = a === 0 ? 0.9 : 0; b.glowB.opacity = a === 1 ? 0.9 : 0;
    b.red.color.setHex(a === 0 ? 0xff4040 : 0x5a1010); b.blue.color.setHex(a === 1 ? (car.kind === 'fire' ? 0xff4040 : 0x4080ff) : (car.kind === 'fire' ? 0x5a1010 : 0x10204a));
  },

  // ----- calls -----
  call(kind) {
    if (kind === 'ems') return this.ems();
    const busy = this.vehicles.find(v => v.kind === kind);
    if (busy) { UI.toast(kind === 'police' ? 'รถตำรวจกำลังเดินทางไปแล้ว' : 'รถดับเพลิงกำลังเดินทางไปแล้ว', '📞'); return; }
    const target = kind === 'fire' ? this.fires[0] : this.thief;
    if (!target) {
      Phone.msg(kind === 'police' ? 'ตำรวจ 191' : 'ดับเพลิง 199', kind === 'police' ? 'รับแจ้งแล้วครับ ตรวจสอบพื้นที่แล้วไม่พบเหตุผิดปกติ ถ้าเห็นคนแปลกหน้าในไร่ตอนกลางคืนโทรมาได้ทันทีนะครับ' : 'รับแจ้งแล้วครับ ไม่พบควันหรือไฟในพื้นที่ ถ้าเห็นไฟไหม้โทรมาใหม่ได้เลย');
      return;
    }
    UI.toast(kind === 'police' ? 'ตำรวจ: “รับแจ้งแล้วครับ กำลังส่งสายตรวจไปที่ไร่ทันที”' : 'ดับเพลิง: “รับแจ้งเหตุไฟไหม้แล้ว รถดับเพลิงออกจากสถานีเดี๋ยวนี้!”', kind === 'police' ? '🚓' : '🚒');
    this.dispatch(kind, target);
  },
  route(kind, tx, tz) {
    const s = STATIONS[kind], lane = kind === 'police' ? -2.2 : 2.2;
    const pts = [[s.out.x, s.out.z], [lane, s.z - 3]];
    if (tz > -60) { pts.push([lane, -62], [0.5, -50]); }
    else pts.push([lane, U.clamp(tz, -330, -60)]);
    pts.push([tx, tz]);
    return pts;
  },
  dispatch(kind, target) {
    const parked = this.parked[kind]; parked.g.visible = false;
    const car = this.vehicleModel(kind); this.scene.add(car.g);
    const s = STATIONS[kind], pts = this.route(kind, target.x, target.z);
    car.g.position.set(s.out.x, 0, s.out.z);
    this.vehicles.push({ kind, car, pts, i: 1, x: s.out.x, z: s.out.z, h: Math.atan2(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]), speed: 0, st: 'go', target, t: 0 });
  },
  ems() {
    if (G.inside) { UI.toast('กู้ภัย 1669: “ถ้าอยู่ในบ้านลองนอนพักบนเตียงก่อนนะครับ”', '🚑'); return; }
    const low = S.energy < maxEnergy() * 0.3, fee = low ? 150 : 0;
    if (low && this.emsDay === S.day) { UI.toast('กู้ภัย 1669: “วันนี้มารับไปแล้วครั้งหนึ่ง ลองพักผ่อนที่บ้านนะครับ”', '🚑'); return; }
    if (low && S.money < fee) { UI.toast(`ค่ารถพยาบาล ${fee} ฿ เงินไม่พอ`, '💸'); return; }
    if (low) this.emsDay = S.day;
    UI.toast('กู้ภัย 1669: “รับเรื่องแล้วครับ รถพยาบาลกำลังไป”', '🚑'); this.siren(2.5);
    setTimeout(() => fade(() => {
      if (G.inside) setInside(false);
      if (G.inRoom && typeof Rooms !== 'undefined') Rooms.leave(true);
      if (G.driving) exitCar();
      if (G.inMine) Mine.leave(true);
      const d = World.houseDoor; G.player.pos.set(d.x, World.groundY(d.x, d.z), d.z); snapCam();
      if (low) { S.energy = Math.min(maxEnergy(), S.energy + 50); S.money = Math.max(0, S.money - fee); }
      if (S.sick) { S.sick = 0; S.sickDays = 0; S.money = Math.max(0, S.money - (S.st2 && S.st2.cpr ? 400 : 800)); Phone.msg('โรงพยาบาลสุขใจ', 'รถพยาบาลพาไปรักษาที่โรงพยาบาลแล้ว หายป่วยแล้ว ค่ารักษา 800 ฿'); }
      Phone.msg('กู้ภัย 1669', low ? `ส่งคุณกลับถึงบ้านแล้ว ปฐมพยาบาลให้แล้ว พลังงาน +50 ค่าบริการ ${baht(fee)} ดูแลตัวเองด้วยนะครับ` : 'ส่งคุณกลับบ้านแล้ว ตรวจร่างกายแล้วแข็งแรงดีครับ (ไม่เสียค่าใช้จ่าย)');
    }), 2600);
  },
  siren(dur) {
    if (!Sfx.ctx) return;
    for (let i = 0; i < dur / 0.9; i++) { Sfx.tone(700, 0.45, 'triangle', 0.035, 1050, i * 0.9); Sfx.tone(1050, 0.45, 'triangle', 0.035, 700, i * 0.9 + 0.45); }
  },

  // ----- fire -----
  ignite(x, z, why) {
    if (this.fires.length >= 8) return;
    const g = new THREE.Group(); g.position.set(x, H(x, z), z); this.scene.add(g);
    const fl = []; for (let i = 0; i < 5; i++) { const s = new THREE.Sprite(this.flameM); s.position.set((Math.random() - 0.5) * 1.1, 0.5, (Math.random() - 0.5) * 1.1); g.add(s); fl.push({ s, ph: Math.random() * 6 }); }
    const sm = []; for (let i = 0; i < 4; i++) { const s = new THREE.Sprite(this.smokeM.clone()); g.add(s); sm.push({ s, k: i / 4 }); }
    const sc = U.mk(g, new THREE.PlaneGeometry(3, 3), this.scorchM, [0, 0.04, 0], 1, [-Math.PI / 2, 0, 0]); sc.scale.setScalar(0.3);
    const f = { x, z, g, fl, sm, sc, k: 0.35, t: 0 }; this.fires.push(f);
    S.emerg.started = (S.emerg.started || 0) + 1;
    if (why) { UI.toast(why, '🔥'); Phone.msg('แจ้งเตือนภัย', 'ตรวจพบไฟไหม้ในไร่! ดับด้วยบัวรดน้ำ หรือโทร 199 เรียกรถดับเพลิง'); }
    return f;
  },
  douse(f, amt) {
    f.k -= amt; FX.splash && FX.splash(f.x, H(f.x, f.z) + 0.3, f.z);
    if (f.k <= 0) this.out(f);
  },
  out(f) {
    const i = this.fires.indexOf(f); if (i < 0) return; this.fires.splice(i, 1); S.emerg.fires = (S.emerg.fires || 0) + 1;
    if (f.volunteer) { earn(400); Bank2.income('อาสาดับเพลิง', 400); for (const n of G.npcs) if (!n.staff && S.friends[n.name] != null) Friends.add(n.name, 0.1); UI.toast('ดับไฟในหมู่บ้านสำเร็จ! ได้ค่าตอบแทนอาสา 400 ฿', '🧑‍🚒'); Life2.note('ช่วยดับไฟในหมู่บ้าน'); }
    this.scene.remove(f.g); Sfx.burst(0.6, 900, 'lowpass', 0.15);
    if (!this.fires.length) { UI.toast('ดับไฟสำเร็จแล้ว!', '🧯'); Prog.add(15); }
  },
  updateFires(dt) {
    const t = G.t, rain = G.wx.rain;
    for (const f of this.fires.slice()) {
      f.t += dt; f.k = Math.min(1, f.k + dt * (0.018 - rain * 0.05));
      if (S.st2 && S.st2.fireSys && Math.hypot(f.x, f.z - 0) < 90) f.k -= dt * 0.06;
      if (f.k <= 0) { this.out(f); continue; }
      f.sc.scale.setScalar(0.4 + Math.min(1, f.t / 20) * 0.8);
      for (const q of f.fl) { const w = 0.6 + 0.4 * Math.sin(t * 9 + q.ph) * Math.sin(t * 5.3 + q.ph * 2); q.s.scale.set(0.9 * f.k + 0.3, (1.6 + w) * (f.k + 0.2), 1); q.s.position.y = 0.45 * (f.k + 0.3) + w * 0.1; }
      for (const q of f.sm) { q.k = (q.k + dt * 0.18) % 1; q.s.position.set(Math.sin(q.k * 4 + f.x) * 0.6 + q.k * G.wx.wind * 2, 1.5 + q.k * 6, Math.cos(q.k * 3) * 0.5); q.s.scale.setScalar(1 + q.k * 3.5 * f.k); q.s.material.opacity = (1 - q.k) * 0.4 * f.k; }
      // burning crops are lost, strong fires spread to the next plot
      for (let i = 0; i < 30; i++) { const c = plotCenter(i), p = S.plots[i]; if (p.c && f.k > 0.6 && f.t > 15 && Math.hypot(c.x - f.x, c.z - f.z) < 1.4) { Bank2.claim('ไฟไหม้แปลงผัก', CROPS[p.c].sell * 3); p.c = null; p.g = 0; p.w = 0; p.f = 0; refreshPlot(i); UI.toast('ไฟเผาผักไป 1 แปลง!', '🔥'); } }
      if (f.k > 0.85 && Math.random() < dt * 0.04 && this.fires.length < 8) {
        const a = Math.random() * TAU, x = f.x + Math.cos(a) * 2.6, z = f.z + Math.sin(a) * 2.6;
        if (!this.fires.some(o => Math.hypot(o.x - x, o.z - z) < 1.8)) this.ignite(x, z);
      }
    }
    if (this.fires.length && !G.inside) {
      const p = G.player.pos, d = Math.min(...this.fires.map(f => Math.hypot(f.x - p.x, f.z - p.z)));
      if (d < 30 && Sfx.ctx && Math.random() < dt * 6) Sfx.burst(0.15, 600 + Math.random() * 1400, 'bandpass', 0.05 * (1 - d / 30), 2);
    }
  },
  // lightning in storms and dry heat in the hot season can start a fire on the farm
  hourly() {
    if (G.inside && !G.started) return;
    const se = season().id, wx = S.weather.type;
    let p = 0;
    if (wx === 'storm') p = 0.06; else if (se === 'hot' && wx === 'sunny' && S.time > 11 * 60 && S.time < 16 * 60) p = 0.012;
    if (S.emerg.calm > 0) p = 0;
    if (S.st2 && S.st2.fireSafe > S.day) p *= 0.3;
    if (Math.random() < p) {
      const spots = [[-6, 6], [20, 8], [-30, -6], [26, -20], [-10, 30], [12, 30]], sp = U.pick(spots);
      if (wx === 'storm') { Sfx.thunder(); G.flash = 1; }
      this.ignite(sp[0] + Math.random() * 3, sp[1] + Math.random() * 3, wx === 'storm' ? 'ฟ้าผ่าลงในไร่ เกิดไฟไหม้! รีบดับไฟหรือโทร 199' : 'อากาศร้อนจัด หญ้าแห้งติดไฟในไร่! รีบดับไฟหรือโทร 199');
      S.emerg.calm = 2;
    }
    if (S.emerg.calm > 0) S.emerg.calm -= 1 / 24;
    // thieves only on nights when there is something worth stealing
    const h = Math.floor(S.time / 60);
    if (!this.thief && (h === 22 || h === 23 || h === 0) && S.day >= 4 && S.day >= S.emerg.nextThief && Math.random() < 0.12 * (S.furn.doorbell ? 0.7 : 1) * (S.locked ? 0.6 : 1) * (typeof Sec !== 'undefined' ? Sec.thiefMult() : 1)) {
      const ripe = S.plots.map((p, i) => i).filter(i => stageOf(S.plots[i]) === 3);
      if (ripe.length >= 2) this.spawnThief(ripe);
    }
  },

  // ----- thief -----
  spawnThief(ripe) {
    if (S.st2 && S.st2.cctv && Math.random() < 0.35) { S.emerg.caught++; S.emerg.nextThief = S.day + 3; Phone.msg('กล้องวงจรปิดฟาร์ม', 'กล้องจับภาพขโมยได้ ส่งภาพให้ตำรวจแล้ว ขโมยหนีไปก่อนเข้าถึงผลผลิต ไม่มีของหาย (ตำรวจไม่มีเงินรางวัลให้ผู้เสียหาย)'); return; }
    const obj = Models.human(Object.assign({ skin: 0xc68d63, hair: 0x1b120c }, UNIFORM.thief)); World.dyn.add(obj);
    const x = 32, z = 20; obj.position.set(x, H(x, z), z);
    this.thief = { obj, x, z, rot: 0, ripe: ripe.slice(0, 4), st: 'sneak', t: 0, stolen: {}, took: 0 };
    S.emerg.nextThief = S.day + 3;
    UI.toast('มีเสียงแปลก ๆ ในแปลงผัก... เหมือนมีคนแอบเข้ามาขโมยผัก! โทร 191', '🕵️');
    Phone.msg('กล้องวงจรปิดฟาร์ม', 'ตรวจพบคนแปลกหน้าเข้ามาในแปลงผักตอนกลางคืน! ไล่ออกไป หรือโทร 191 ให้ตำรวจมาจับ');
  },
  updateThief(dt) {
    const th = this.thief; if (!th) return;
    th.t += dt;
    let tx, tz, sp = 2.2;
    if (th.st === 'sneak' || th.st === 'steal') {
      const i = th.ripe[0];
      if (i == null || stageOf(S.plots[i]) !== 3) { th.ripe.shift(); if (!th.ripe.length) th.st = 'flee'; }
      else {
        const c = plotCenter(i); tx = c.x + 0.9; tz = c.z;
        if (Math.hypot(tx - th.x, tz - th.z) < 0.3) {
          if (th.st !== 'steal') { th.st = 'steal'; th.t = 0; }
          if (th.t > 4) { const p = S.plots[i], C = CROPS[p.c]; th.stolen[p.c] = (th.stolen[p.c] || 0) + (C.yield || 1); if (C.regrow) p.g = C.grow - C.regrow; else { p.c = null; p.g = 0; p.f = 0; } refreshPlot(i); th.took++; th.ripe.shift(); th.st = 'sneak'; if (!th.ripe.length) th.st = 'flee'; }
        }
      }
    }
    if (th.st === 'flee') { tx = 60; tz = 40; sp = 5.5; }
    if (th.st === 'caught') return;
    if (tx != null) {
      const dx = tx - th.x, dz = tz - th.z, d = Math.hypot(dx, dz);
      const mv = th.st === 'steal' ? 0 : Math.min(d, sp * dt);
      if (d > 0.05) { th.x += dx / d * mv; th.z += dz / d * mv; th.rot = U.angLerp(th.rot, Math.atan2(dx, dz), Math.min(1, dt * 8)); }
      th.obj.position.set(th.x, H(th.x, th.z), th.z); th.obj.rotation.y = th.rot;
      Models.animHuman(th.obj, dt, mv > 0 ? sp : 0, th.st === 'steal' ? 'harvest' : null);
      if (th.st === 'flee' && d < 1) this.endThief(false);
    }
    if (th.st !== 'flee' && !G.inside && Math.hypot(G.player.pos.x - th.x, G.player.pos.z - th.z) < 5 && !th.seen) { th.seen = 1; UI.toast('เจอขโมยแล้ว! เข้าไปไล่ หรือโทร 191 ให้ตำรวจมาจับ', '🕵️'); }
  },
  chase() {
    const th = this.thief; if (!th) return;
    th.st = 'flee'; Sfx.tone(300, 0.2, 'square', 0.05); UI.toast('ขโมยตกใจวิ่งหนีไปแล้ว! (โทร 191 ตำรวจจะได้ตามจับและเอาของคืน)', '🏃');
  },
  endThief(caught) {
    const th = this.thief; if (!th) return;
    World.dyn.remove(th.obj); this.thief = null;
    const lost = Object.keys(th.stolen).map(k => `${CROPS[k].i}${th.stolen[k]}`).join(' ');
    if (caught) {
      for (const k in th.stolen) addItem(k, th.stolen[k]);
      S.emerg.caught++; Prog.add(20);
      Phone.msg('สถานีตำรวจภูธรสุขใจ', `จับขโมยได้แล้วครับ! คืนของให้ ${lost || '-'} (ไม่มีเงินรางวัลนำจับให้ผู้แจ้ง) ขอบคุณที่แจ้งเหตุครับ`);
    } else if (lost) { Bank2.claim('ผลผลิตถูกขโมย', Object.keys(th.stolen).reduce((s, k) => s + CROPS[k].sell * th.stolen[k], 0)); } if (!caught && lost) S.theftDay = S.day; if (!caught && lost && typeof Sec !== 'undefined') Sec.evidence(th.stolen); if (!caught && lost) Phone.msg('กล้องวงจรปิดฟาร์ม', `ขโมยหนีไปได้ พร้อมผลผลิต ${lost} คราวหน้าลองโทร 191 เร็ว ๆ นะ`);
  },

  // ----- vehicles on call -----
  updateVehicles(dt) {
    for (const v of this.vehicles.slice()) {
      v.t += dt; this.flash(v.car, G.t, v.st !== 'park');
      if (v.st === 'go' || v.st === 'back') {
        const p = v.pts[v.i]; if (!p) { v.st === 'go' ? this.arrive(v) : this.home(v); continue; }
        const dx = p[0] - v.x, dz = p[1] - v.z, d = Math.hypot(dx, dz), last = v.i === v.pts.length - 1;
        const want = last ? Math.min(14, d * 1.5) : 16; v.speed = U.lerp(v.speed, want, Math.min(1, dt * 1.5));
        if (d < (last ? 4.5 : 3)) { v.i++; continue; }
        v.h = U.angLerp(v.h, Math.atan2(dx, dz), Math.min(1, dt * 3));
        v.x += Math.sin(v.h) * v.speed * dt; v.z += Math.cos(v.h) * v.speed * dt;
        v.car.g.position.set(v.x, H(v.x, v.z), v.z); v.car.g.rotation.y = v.h;
        for (const w of v.car.wheels) w.rotation.x += v.speed * dt / v.car.r;
        if ((this.sirenT -= dt) <= 0 && v.st === 'go') { this.sirenT = 0.9; const cp = G.camera.position; if (Math.hypot(cp.x - v.x, cp.z - v.z) < 90) this.siren(0.9); }
      } else if (v.st === 'work') this.work(v, dt);
    }
  },
  arrive(v) {
    v.st = 'work'; v.t = 0; v.speed = 0;
    const off = l2w(v.x, v.z, v.h, 1.6, 0);
    const h = Models.human(Object.assign({ skin: 0xe0a87e, hair: 0x1b120c }, UNIFORM[v.kind])); h.position.set(off.x, H(off.x, off.z), off.z); World.dyn.add(h);
    v.crew = { obj: h, x: off.x, z: off.z, rot: v.h };
    if (v.kind === 'police') UI.toast('ตำรวจมาถึงแล้ว!', '👮'); else UI.toast('รถดับเพลิงมาถึงแล้ว กำลังฉีดน้ำดับไฟ', '🧑‍🚒');
    if (v.kind === 'fire') { v.jet = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(60 * 3), 3)), new THREE.PointsMaterial({ color: 0xcfe8ff, size: 0.18, transparent: true, opacity: 0.8, depthWrite: false })); v.jet.frustumCulled = false; this.scene.add(v.jet); }
  },
  work(v, dt) {
    const c = v.crew;
    if (v.kind === 'fire') {
      const f = this.fires.reduce((b, f) => !b || Math.hypot(f.x - c.x, f.z - c.z) < Math.hypot(b.x - c.x, b.z - c.z) ? f : b, null);
      if (!f) { this.finish(v); return; }
      const dx = f.x - c.x, dz = f.z - c.z, d = Math.hypot(dx, dz);
      if (d > 4) { c.x += dx / d * 3 * dt; c.z += dz / d * 3 * dt; }
      c.rot = Math.atan2(dx, dz);
      c.obj.position.set(c.x, H(c.x, c.z), c.z); c.obj.rotation.y = c.rot; Models.animHuman(c.obj, dt, d > 4 ? 3 : 0, d > 4 ? null : 'water');
      if (d <= 4.5) {
        f.k -= dt * 0.22; if (f.k <= 0) this.out(f);
        const a = v.jet.geometry.attributes.position, sx = c.x + Math.sin(c.rot) * 0.6, sz = c.z + Math.cos(c.rot) * 0.6, y0 = H(c.x, c.z) + 1.1;
        for (let i = 0; i < 60; i++) { const k = ((i / 60) + G.t * 1.7) % 1; a.setXYZ(i, U.lerp(sx, f.x, k) + (Math.random() - 0.5) * 0.15, y0 + Math.sin(k * Math.PI) * 1.2 - k * 0.9, U.lerp(sz, f.z, k) + (Math.random() - 0.5) * 0.15); }
        a.needsUpdate = true; v.jet.visible = true;
        if (Math.random() < dt * 8) Sfx.burst(0.2, 2500, 'highpass', 0.04);
      } else v.jet.visible = false;
    } else {
      const th = this.thief;
      if (!th) { this.finish(v); return; }
      th.st = 'caught';
      const dx = th.x - c.x, dz = th.z - c.z, d = Math.hypot(dx, dz);
      if (d > 1.2) { c.x += dx / d * 5 * dt; c.z += dz / d * 5 * dt; }
      c.rot = Math.atan2(dx, dz); c.obj.position.set(c.x, H(c.x, c.z), c.z); c.obj.rotation.y = c.rot; Models.animHuman(c.obj, dt, d > 1.2 ? 5 : 0, null);
      th.obj.rotation.y = c.rot + Math.PI; Models.animHuman(th.obj, dt, 0, 'wave');
      if (d <= 1.2) { v.cuff = (v.cuff || 0) + dt; if (v.cuff > 2) { this.endThief(true); UI.toast('ตำรวจจับขโมยได้แล้ว! ได้ของคืน (ไม่มีเงินรางวัล)', '🚓'); this.finish(v); } }
    }
  },
  finish(v) {
    if (v.crew) World.dyn.remove(v.crew.obj); if (v.jet) this.scene.remove(v.jet);
    v.st = 'back'; v.i = 1; v.pts = this.route(v.kind, v.x, v.z).reverse(); v.pts.push([STATIONS[v.kind].out.x, STATIONS[v.kind].out.z]);
  },
  home(v) {
    this.scene.remove(v.car.g); this.vehicles.splice(this.vehicles.indexOf(v), 1); this.parked[v.kind].g.visible = true;
  },
  // fires and the thief are targets for the action button
  targets(consider, p, px, pz) {
    for (const f of this.fires) { const d = Math.hypot(px - f.x, pz - f.z); if (d < 2.6) consider({ kind: 'ext', act: () => this.fireAct(f) }, d - 1); }
    const th = this.thief; if (th && th.st !== 'caught' && th.st !== 'flee') { const d = Math.hypot(p.x - th.x, p.z - th.z); if (d < 2.6) consider({ kind: 'ext', act: () => ({ icon: '🫵', label: 'ไล่ขโมย!', fn: () => this.chase() }) }, d - 1); }
  },
  fireAct(f) {
    if (count('extinguisher')) return { icon: '🧯', label: 'ฉีดถังดับเพลิง', fn: () => { takeItem('extinguisher'); this.out(f); for (const o of this.fires.slice()) if (Math.hypot(o.x - f.x, o.z - f.z) < 4) this.out(o); Sfx.burst(1.2, 1800, 'highpass', 0.2); } };
    if (S.can.water > 0) return { icon: '💦', label: 'สาดน้ำดับไฟ', fn: () => { if (!useEnergy(2)) return; S.can.water--; playAct('water', 0.6); Sfx.water(); this.douse(f, S.fireTrained ? 0.6 : 0.3); UI.hud(); } };
    return { icon: '🔥', label: 'บัวไม่มีน้ำ! ไปเติมที่บ่อ หรือโทร 199', fn: () => Phone.open('call') };
  },
  stationUI(k) {
    UI.open(STATIONS[k].n, null, () => k === 'police'
      ? `<p class="lead">“สวัสดีครับ ที่นี่สถานีตำรวจภูธรสุขใจ ให้บริการ 24 ชั่วโมง ถ้าเจอคนร้ายหรือขโมยในไร่โทร <b>191</b> ได้ทันที”</p>
        <div class="card"><div class="ci">👮</div><div class="cb"><h4>ผลงานความร่วมมือ</h4><p>จับขโมยด้วยกันแล้ว ${S.emerg.caught} ครั้ง · รางวัลนำจับครั้งละ ${baht(500)}</p><p class="dim">ขโมยจะมาเฉพาะกลางคืนที่มีผักสุกรอเก็บ เก็บผักให้ทันก็ช่วยได้</p></div></div>
        <div class="row"><button class="btn big" data-a="reportui">📝 แจ้งความ / ขอใช้บริการ</button><button class="btn big ghost" data-a="license">${S.license ? '🪪 มีใบขับขี่แล้ว' : '🪪 สอบใบขับขี่ (500 ฿)'}</button></div>
        <div class="card"><div class="ci">📹</div><div class="cb"><h4>ติดกล้องวงจรปิดที่ฟาร์ม</h4><p class="dim">แจ้งเตือนเข้ามือถือทันทีเมื่อมีคนแปลกหน้า (ติดให้ฟรีแล้ว)</p></div></div>`
      : `<p class="lead">“สวัสดีครับ สถานีดับเพลิงสุขใจพร้อมออกเหตุตลอด 24 ชั่วโมง เห็นไฟไหม้โทร <b>199</b>”</p>
        <div class="card"><div class="ci">🧯</div><div class="cb"><h4>ถังดับเพลิง <small>มี ${count('extinguisher')}</small></h4><p class="dim">ฉีดทีเดียวดับไฟรอบตัวหมด ใช้ได้ 1 ครั้ง</p><div class="row"><button class="btn" data-a="buyext" ${S.money < 600 ? 'disabled' : ''}>ซื้อ ${baht(600)}</button></div></div></div>
        <div class="card"><div class="ci">🎓</div><div class="cb"><h4>อบรมดับเพลิงเบื้องต้น</h4><p class="dim">${S.fireTrained ? 'ผ่านการอบรมแล้ว: สาดน้ำดับไฟแรงขึ้น 2 เท่า' : 'ค่าอบรม 500 ฿ ใช้เวลา 2 ชม. สาดน้ำดับไฟแรงขึ้น 2 เท่า'}</p><div class="row"><button class="btn" data-a="firetrain" ${S.fireTrained ? 'disabled' : ''}>สมัครอบรม</button></div></div></div>
        <div class="card"><div class="ci">⚡</div><div class="cb"><h4>ความรู้กันไฟ</h4><p class="dim">ไฟมักเกิดจากฟ้าผ่าตอนพายุ หรือหญ้าแห้งตอนบ่ายฤดูร้อน ฝนช่วยดับไฟได้ ไฟแรงจะลามและเผาผักในแปลง</p><p>ดับไฟไปแล้ว ${S.emerg.fires} ครั้ง</p></div></div>`);
  },
  update(dt) {
    if (!this.scene) return;
    if (this.flags) for (const f of this.flags) f.rotation.y = Math.sin(G.t * 2 + f.position.x) * 0.25;
    for (const k in this.parked) this.flash(this.parked[k], G.t, false);
    this.updateFires(dt); this.updateThief(dt); this.updateVehicles(dt);
  },
  // sleeping through a night: thief leaves with what was taken, fires burn out the crops they were on
  overnight() {
    if (this.thief) { this.thief.st = 'flee'; this.endThief(false); }
    for (const f of this.fires.slice()) this.out(f);
  },
};
UI.H.buyext = () => { if (S.money < 600) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(600), '💸'); return; } S.money -= 600; addItem('extinguisher'); Sfx.coin(); };
ITEMS.extinguisher = { n: 'ถังดับเพลิง', i: '🧯', cat: 'tool' };
TOOLS.extinguisher = { n: 'ถังดับเพลิง', i: '🧯', price: 600, desc: 'ใช้ดับไฟไหม้ได้ทันที 1 ครั้ง' };
