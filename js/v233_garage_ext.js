'use strict';
// ---------- v233: the extension bays of the home garage use the same modern design (see garage2.js) ----------
V23.add('v233_garage_ext', function () {
  if (typeof Prop23 === 'undefined' || typeof Garage2 === 'undefined' || !Prop23.carportX) return;
  const BAY = Garage2.BAY, BAYX = Prop23.carportX;
  let cols = [];
  Prop23.drawCarport = function () {
    if (this.cpG) { World.outdoor.remove(this.cpG); this.cpG = null; }
    cols.forEach(c => { try { Col.remove(c); } catch (e) { } }); cols = [];
    const n = this.V().garage, G0 = GARAGE;
    const g = new THREE.Group(); g.position.set(G0.x, World.groundY(G0.x, G0.z), G0.z); g.rotation.y = G0.rot; World.outdoor.add(g); this.cpG = g;
    const M_ = Garage2.m();
    const lo = Math.min(-BAY, ...BAYX.slice(0, n).map(x => x - BAY / 2)), hi = Math.max(BAY, ...BAYX.slice(0, n).map(x => x + BAY / 2));
    // the extension bays: same slab, back wall, roof slab with the LED canopy edge and a number plate
    BAYX.slice(0, n).forEach((cx, i) => {
      Garage2.bay(g, cx, i + 3);
      const b = l2w(G0.x, G0.z, G0.rot, cx, -G0.d / 2); cols.push(Col.box(b.x, b.z, BAY / 2, 0.2, G0.rot));
      try { const p = l2w(G0.x, G0.z, G0.rot, cx, 0); World.clearNear(p.x, p.z, 5, true); } catch (e) { }
    });
    // walls between neighbouring bays; the outermost ones get the wood-slat finish
    const walls = new Set([-BAY, 0, BAY]); for (const cx of BAYX.slice(0, n)) { walls.add(+(cx - BAY / 2).toFixed(2)); walls.add(+(cx + BAY / 2).toFixed(2)); }
    for (const wx of walls) {
      const end = wx <= lo + 0.01 || wx >= hi - 0.01;
      Garage2.wall(g, wx, end); if (end) Garage2.slats(g, wx + (wx > 0 ? 0.13 : -0.13), wx > 0 ? 1 : -1);
      if (Math.abs(Math.abs(wx) - BAY) < 0.01 || Math.abs(wx) < 0.01) continue;   // those three have their colliders from the garage itself
      const p = l2w(G0.x, G0.z, G0.rot, wx, 0); cols.push(Col.box(p.x, p.z, 0.2, G0.d / 2, G0.rot));
    }
    // a wide paved apron in front of all bays, with dashed lane markers
    const mid = (lo + hi) / 2, zf = G0.d / 2 + 3.4;
    U.mk(g, U.box(hi - lo + 1, 0.05, 5.4, 1.2), texMat('paving', 0xc6c4be, { roughness: 0.95 }), [mid, 0.04, zf]);
    for (let k = 0; k < Math.floor((hi - lo) / 1.6); k++) U.mk(g, GEO.box, M_.line, [lo + 0.8 + k * 1.6, 0.075, zf + 2.4], [0.8, 0.01, 0.12]);
    const cuts = new Set([-BAY, 0, BAY]); for (const cx of BAYX.slice(0, n)) { cuts.add(+(cx - BAY / 2).toFixed(2)); cuts.add(+(cx + BAY / 2).toFixed(2)); }
    for (const x of cuts) { if (x < lo - 0.01 || x > hi + 0.01) continue; for (let k = 0; k < 3; k++) U.mk(g, GEO.box, M_.line, [x, 0.075, zf - 1.8 + k * 1.5], [0.12, 0.01, 0.8]); }
    Garage2.planters(g, lo, hi);
  };
  Prop23.drawCarport();
});
