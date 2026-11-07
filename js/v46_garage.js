'use strict';
// ---------- v46_garage: the garage grows SIDEWAYS, bay by bay, all the same size, with one road in front joining every bay ----------
// The old extension was a carport slab built in FRONT of the garage (across the driveway). Now each purchase (up to 4, cars 3-6) adds one more bay of exactly the same
// size as the two original bays, alternating along the garage line (local x), each with its own partition wall, back wall, roof and number sign. A paved apron runs along
// the whole front and meets the gravel driveway to the farm gate, so every bay can drive straight out. Parking slots, prices and the upgrade button stay as they were.
V23.add('v46_garage', () => {
  if (typeof Prop23 === 'undefined' || typeof GARAGE === 'undefined') return;
  const BAY = GARAGE.w / 2;                       // one original bay is 5.5 m wide; every new bay is the same
  // centres of the extension bays along the garage line (local x): right, left, right, left
  const BAYX = [BAY * 1.5, -BAY * 1.5, BAY * 2.5, -BAY * 2.5];
  Prop23.carportX = BAYX;
  Prop23.slotPos = function (i) { return i < 2 ? l2w(GARAGE.x, GARAGE.z, GARAGE.rot, -2.6 + i * 5.2, -0.4) : l2w(GARAGE.x, GARAGE.z, GARAGE.rot, BAYX[i - 2], -0.4); };
  let cols = [];
  Prop23.drawCarport = function () {
    if (this.cpG) { World.outdoor.remove(this.cpG); this.cpG = null; }
    cols.forEach(c => { try { Col.remove(c); } catch (e) { } }); cols = [];
    const n = this.V().garage, G0 = GARAGE;   // v132: the road in front is drawn for the two original bays too, not only after an extension
    const g = new THREE.Group(); g.position.set(G0.x, World.groundY(G0.x, G0.z), G0.z); g.rotation.y = G0.rot; World.outdoor.add(g); this.cpG = g;
    const wall = texMat('plaster', 0xe9e2d2), roof = texMat('roof', 0x5a6470, { roughness: 0.55, metalness: 0.25 }), conc = texMat('paving', 0xbdb8ae);
    const lo = Math.min(-BAY, ...BAYX.slice(0, n).map(x => x - BAY / 2 * 1)), hi = Math.max(BAY, ...BAYX.slice(0, n).map(x => x + BAY / 2 * 1));
    // the extension bays: same slab, back wall, roof and trim as the original building
    BAYX.slice(0, n).forEach((cx, i) => {
      U.mk(g, U.box(BAY, 0.12, G0.d + 2.5, 2), conc, [cx, 0.06, 1]);
      U.mk(g, U.box(BAY, 3.2, 0.25, 3), wall, [cx, 1.6, -G0.d / 2]);
      const r = U.mk(g, U.box(BAY + 0.1, 0.14, G0.d + 1.2, 2.5), roof, [cx, 3.45, 0.2]); r.rotation.x = -0.08;
      U.mk(g, GEO.box, M.trim, [cx, 3.2, G0.d / 2 + 0.1], [BAY + 0.1, 0.3, 0.12]);
      for (const sx of [-1, 1]) U.mk(g, GEO.box, mc(0xf2f2f2), [cx + sx * 1.3, 0.13, 0.5], [0.1, 0.01, 4.5]);
      const sm = new THREE.MeshStandardMaterial({ map: U.signTex('ช่อง ' + (i + 3), { w: 256, h: 128, bg: '#1565c0' }), roughness: 0.7 });
      U.mk(g, new THREE.PlaneGeometry(1.5, 0.75), sm, [cx, 2.7, G0.d / 2 + 0.2]);
      const b = l2w(G0.x, G0.z, G0.rot, cx, -G0.d / 2); cols.push(Col.box(b.x, b.z, BAY / 2, 0.2, G0.rot));
      try { const p = l2w(G0.x, G0.z, G0.rot, cx, 0); World.clearNear(p.x, p.z, 5, true); } catch (e) { }
    });
    // partitions between neighbouring bays and the two end walls (the original side walls at +-BAY already stand)
    const walls = new Set(); for (const cx of BAYX.slice(0, n)) { walls.add(+(cx - BAY / 2).toFixed(2)); walls.add(+(cx + BAY / 2).toFixed(2)); }
    for (const wx of walls) {
      if (Math.abs(Math.abs(wx) - BAY) < 0.01 || Math.abs(wx) < 0.01) continue;   // already built by the garage
      U.mk(g, U.box(0.25, 3.2, G0.d, 3), wall, [wx, 1.6, 0]); U.mk(g, GEO.box, M.trim, [wx, 1.6, G0.d / 2], [0.3, 3.2, 0.3]);
      const p = l2w(G0.x, G0.z, G0.rot, wx, 0); cols.push(Col.box(p.x, p.z, 0.2, G0.d / 2, G0.rot));
    }
    // the road in front of every bay: paved apron the width of the whole row, meeting the gravel driveway to the gate
    const mid = (lo + hi) / 2, zf = G0.d / 2 + 3.4;
    const asph = mc(0x3b3f44, { roughness: 0.95 });
    U.mk(g, U.box(hi - lo + 1, 0.05, 5.4, 1.2), asph, [mid, 0.04, zf]);
    for (let k = 0; k < Math.floor((hi - lo) / 1.6); k++) U.mk(g, GEO.box, mc(0xf4f4f4), [lo + 0.8 + k * 1.6, 0.075, zf + 2.4], [0.8, 0.01, 0.12]);   // edge dashes
    // one road lane per bay: a dashed divider across the apron at every wall between bays, and a stop line in front of each bay
    const cuts = new Set([-BAY, 0, BAY]); for (const cx of BAYX.slice(0, n)) { cuts.add(+(cx - BAY / 2).toFixed(2)); cuts.add(+(cx + BAY / 2).toFixed(2)); }
    for (const x of cuts) { if (x < lo - 0.01 || x > hi + 0.01) continue; for (let k = 0; k < 3; k++) U.mk(g, GEO.box, mc(0xf4f4f4), [x, 0.075, zf - 1.8 + k * 1.5], [0.12, 0.01, 0.8]); }
    const bayC = [-BAY / 2, BAY / 2].concat(BAYX.slice(0, n));
    for (const cx of bayC) U.mk(g, GEO.box, mc(0xf4f4f4), [cx, 0.075, G0.d / 2 + 1.0], [BAY - 0.9, 0.01, 0.14]);
  };
  Prop23.drawCarport();
  window.Garage46 = { BAYX, bays: () => 2 + Prop23.V().garage };
});
