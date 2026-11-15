'use strict';
// ---------- garage2: the home garage redesigned (modern flat-roof concrete carport matching the new house) ----------
// Charcoal back wall, white partition walls with black columns, a thin white slab roof that overhangs the front on black steel posts, warm LED strips under the
// canopy, wood-slat end walls, wheel stops and bay numbers, an EV wall charger, planters, a concrete driveway. Same size, same slots, same colliders as before.
const Garage2 = {
  BAY: 5.5, H: 3.3,
  m() {
    if (this._m) return this._m;
    return this._m = {
      white: texMat('plaster', 0xf1f0ec, { roughness: 0.9 }), char: texMat('plaster', 0x3b3f44, { roughness: 0.9 }), slab: texMat('plaster', 0xe4e3df, { roughness: 0.85 }),
      floor: texMat('paving', 0xb9b7b1, { roughness: 0.95 }), black: mc(0x1d1f22, { roughness: 0.45, metalness: 0.4 }), wood: texMat('woodV', 0xd8a23e, { roughness: 0.55 }),
      led: mc(0xfff2c8, { emissive: 0xffe3a0, roughness: 0.4 }), line: mc(0xf4f4f4), stop: mc(0x8d9196, { roughness: 0.8 }), plate: mc(0x1d1f22, { roughness: 0.6 }),
    };
  },
  // one parking bay centred at local x = cx (width BAY): floor, back wall, roof segment with its canopy overhang, LED strip, wheel stop, number plate
  bay(g, cx, label) {
    const B = this.BAY, H = this.H, D = GARAGE.d, M_ = this.m();
    U.mk(g, U.box(B, 0.14, D + 2.6, 3), M_.floor, [cx, 0.07, 1.0]);
    U.mk(g, U.box(B, H, 0.28, 3), M_.char, [cx, H / 2, -D / 2]);
    U.mk(g, U.box(B + 0.02, 0.34, D + 2.2, 2.5), M_.slab, [cx, H + 0.17, 0.55]);                       // the thin white roof slab (overhangs the front by 1.65 m)
    U.mk(g, U.box(B + 0.04, 0.08, D + 2.3, 2), M_.black, [cx, H - 0.02, 0.55]);                        // dark soffit line
    U.mk(g, GEO.box, M_.black, [cx, H + 0.2, D / 2 + 1.68], [B + 0.04, 0.4, 0.07]);                    // black fascia at the front edge
    U.mk(g, GEO.box, M_.led, [cx, H - 0.1, D / 2 + 1.5], [B - 0.5, 0.05, 0.06]);                       // warm LED strip under the canopy
    U.mk(g, GEO.box, M_.led, [cx, H - 0.1, -D / 2 + 0.2], [B - 0.8, 0.05, 0.05]);                      // and one over the back wall
    for (const sx of [-1, 1]) U.mk(g, GEO.box, M_.line, [cx + sx * 1.3, 0.16, 0.5], [0.1, 0.01, 4.6]);  // parking lines
    U.mk(g, GEO.box, M_.stop, [cx, 0.24, -D / 2 + 1.0], [1.7, 0.16, 0.3]);                              // wheel stop
    U.mk(g, GEO.box, M_.line, [cx, 0.16, D / 2 + 0.7], [B - 1.0, 0.01, 0.14]);                          // stop line
    if (label != null) {
      U.mk(g, GEO.box, M_.plate, [cx, H - 0.55, D / 2 + 1.62], [1.0, 0.45, 0.05]);
      U.mk(g, new THREE.PlaneGeometry(0.9, 0.36), new THREE.MeshStandardMaterial({ map: U.signTex(String(label), { w: 192, h: 80, bg: '#1d1f22', fg: '#f3ead0' }), roughness: 0.6 }), [cx, H - 0.55, D / 2 + 1.66]);
    }
    for (let k = 0; k < 3; k++) U.mk(g, GEO.sph, M.bulb, [cx - 1.6 + k * 1.6, H - 0.18, D / 2 + 1.2], 0.07);
  },
  // a wall between two bays (white plaster) with a black steel post at the front corner of the canopy
  wall(g, wx, isEnd) {
    const H = this.H, D = GARAGE.d, M_ = this.m();
    U.mk(g, U.box(0.26, H, D, 3), isEnd ? M_.char : M_.white, [wx, H / 2, 0]);
    U.mk(g, GEO.box, M_.black, [wx, H / 2, D / 2 + 1.55], [0.22, H, 0.22]);                              // steel post under the canopy edge
    U.mk(g, GEO.box, M_.black, [wx, H / 2, D / 2 + 0.02], [0.3, H, 0.3]);                                // black column at the building front
    U.mk(g, GEO.sph, M.bulb, [wx, H * 0.62, D / 2 + 1.35], 0.09);                                        // post lamp
  },
  // wood-slat feature on an outer end wall
  slats(g, wx, dir) {
    const H = this.H, D = GARAGE.d, M_ = this.m(), x = wx + dir * 0.18;
    U.mk(g, GEO.box, mc(0x8a6a2a, { roughness: 0.7 }), [x, H / 2, D / 2 - 1.3], [0.05, H - 0.4, 2.2]);
    for (let i = 0; i < 12; i++) U.mk(g, GEO.box, M_.wood, [x + dir * 0.05, H / 2, D / 2 - 2.3 + i * 0.185], [0.05, H - 0.5, 0.1]);
  },
  // the EV wall charger on the partition, the garden strip and the name plate (original two bays)
  extras(g) {
    const H = this.H, D = GARAGE.d, M_ = this.m();
    const ch = new THREE.Group(); U.mk(ch, GEO.box, mc(0x2a2f35, { roughness: 0.4 }), [0, 0, 0], [0.34, 0.5, 0.12]); U.mk(ch, GEO.box, mc(0x39ff6a, { emissive: 0x1a7a30 }), [0, 0.14, 0.07], [0.2, 0.05, 0.01]);
    U.mk(ch, GEO.cylLo, M_.black, [0.18, -0.2, 0.08], [0.03, 0.5, 0.03], [0, 0, 0.3]);
    ch.position.set(0.19, 1.15, D / 2 - 1.2); ch.rotation.y = Math.PI / 2; g.add(ch);
    // big name plate on the canopy fascia
    U.mk(g, GEO.box, M_.black, [0, H + 0.2, D / 2 + 1.74], [3.4, 0.34, 0.04]);
    U.mk(g, new THREE.PlaneGeometry(3.2, 0.3), new THREE.MeshStandardMaterial({ map: U.signTex('โรงจอดรถ', { w: 640, h: 56, bg: '#1d1f22', fg: '#f3ead0' }), roughness: 0.6 }), [0, H + 0.2, D / 2 + 1.77]);
    // shelf with tools at the back of the first bay
    U.mk(g, GEO.box, mc(0x5a5f63, { roughness: 0.6 }), [-4.5, 1.0, -D / 2 + 0.45], [0.8, 2, 0.55]);
    for (let i = 0; i < 3; i++) U.mk(g, GEO.cyl, mc([0xc62828, 0x1565c0, 0x2e7d32][i]), [-4.5 + (i - 1) * 0.22, 2.15, -D / 2 + 0.45], [0.09, 0.3, 0.09]);
  },
  planters(g, lo, hi) {
    const D = GARAGE.d, bush = mc(0x3f7f2c, { roughness: 0.9 }), flo = [0xe84a6f, 0xf6d13a, 0xffffff];
    for (const x of [lo - 0.9, hi + 0.9]) {
      U.mk(g, GEO.box, mc(0x6b6f73, { roughness: 0.9 }), [x, 0.2, D / 2 + 0.2], [0.9, 0.4, 2.4]);
      for (let i = 0; i < 4; i++) U.mk(g, GEO.sph, bush, [x + (i % 2 - 0.5) * 0.35, 0.65, D / 2 - 0.5 + i * 0.5], [0.45, 0.4, 0.45]);
      for (let i = 0; i < 4; i++) U.mk(g, GEO.sphLo, mc(flo[i % 3], { roughness: 0.7 }), [x + (i % 2 - 0.5) * 0.3, 0.85, D / 2 - 0.3 + i * 0.5], 0.09);
    }
  },
  buildModern() {
    const G0 = GARAGE, B = Garage2.BAY;
    const g = new THREE.Group(); g.position.set(G0.x, World.groundY(G0.x, G0.z), G0.z); g.rotation.y = G0.rot;
    Garage2.bay(g, -B / 2, 1); Garage2.bay(g, B / 2, 2);
    Garage2.extras(g);   // the walls, wood slats and planters are drawn by Prop23.drawCarport (v233) because they depend on how many bays the garage has
    World.outdoor.add(g); Garage2.root = g;
    // concrete driveway (with two light curb lines) from the farm gate to the garage, same line as the old gravel track
    const len = Math.hypot(G0.x + 2, G0.z + 54) + 4, rot = Math.atan2(G0.x + 2, G0.z + 54) + Math.PI, cx = (G0.x - 2) / 2 + 2, cz = (G0.z - 54) / 2 + 4;
    const dr = new THREE.Group(); dr.position.set(cx, 0.03, cz); dr.rotation.y = rot + Math.PI; World.outdoor.add(dr);
    const pv = new THREE.Mesh(new THREE.PlaneGeometry(4.6, len), texMat('paving', 0xc6c4be, { roughness: 0.95 })); pv.rotation.x = -Math.PI / 2; pv.receiveShadow = true; dr.add(pv);
    for (const s of [-1, 1]) { const cb = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, len), mc(0xe9e8e4, { roughness: 0.9 })); cb.position.set(s * 2.38, 0.04, 0); dr.add(cb); }
    // colliders: end walls, back wall and the middle wall (same as before)
    for (const s of [-1, 1]) { const p = l2w(G0.x, G0.z, G0.rot, s * B, 0); Col.box(p.x, p.z, 0.2, G0.d / 2, G0.rot); }
    { const p = l2w(G0.x, G0.z, G0.rot, 0, -G0.d / 2); Col.box(p.x, p.z, B, 0.2, G0.rot); }
    { const p = l2w(G0.x, G0.z, G0.rot, 0, 0); Col.box(p.x, p.z, 0.15, G0.d / 2, G0.rot); }
    World.clearNear(G0.x, G0.z, 9, true);
    const door = l2w(G0.x, G0.z, G0.rot, -4.8, G0.d / 2 - 1);
    setTimeout(() => { for (const o of G.cars.slice()) if (o.d.parked) { const p = this.slot(o.d.slot || 0); Object.assign(o.d, { x: p.x, z: p.z, r: G0.rot + Math.PI }); this.rebuild(o); } }, 0);
    World.pois.push({ kind: 'act', x: door.x, z: door.z, r: 2.4, label: 'โรงจอดรถ', icon: '🅿️', map: true, act: () => ({ icon: '🅿️', label: 'จัดการรถในโรงจอด', fn: () => this.ui() }) });
  },
};
// Garage.build (garage.js) is called by the game start; hand it over to the new design
Garage.buildModern = () => Garage2.buildModern.call(Garage);
