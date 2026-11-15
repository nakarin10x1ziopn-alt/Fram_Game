'use strict';
// ---------- v232: the main house is a two-storey modern concrete house ----------
// * exterior (World.buildHouse): white plaster, grey + golden wood-slat accents, white pointed gable frame, carport bay, balcony with black railing, dark tile roof
//   (the roof is a plain front slope, so the roof solar panels of hitech.js sit on it exactly as before)
// * interior (World.buildInterior in world.js): two walkable floors joined by a real staircase: floor 1 = kitchen, fridge, shower, storage chest, computer desk,
//   network rack / switch / camera wall, living room, built-in backup power cabinet; floor 2 = bed, wardrobe
// * the old farm yard is paved with concrete; the house comes with a built-in backup battery
V23.add('v232_house2', function () {
  if (typeof World === 'undefined' || typeof HOUSE_DEF === 'undefined') return;
  const concrete = () => texMat('plaster', 0xf1f0ec, { roughness: 0.9 });
  const dark = () => mc(0x1d1f22, { roughness: 0.45, metalness: 0.35 });

  // ---------- a modern window / glass door: black frame, bluish glass (registered for the night glow) ----------
  const mwin = (g, x, y, z, w, h, rot, opt = {}) => {
    const wg = new THREE.Group(); wg.position.set(x, y, z); wg.rotation.y = rot || 0; g.add(wg);
    U.mk(wg, GEO.box, dark(), [0, 0, 0.04], [w + 0.16, h + 0.16, 0.1]);
    (World.winMeshes || (World.winMeshes = [])).push(U.mk(wg, GEO.box, M.glass, [0, 0, 0.09], [w, h, 0.03]));
    if (!opt.plain) { U.mk(wg, GEO.box, dark(), [0, 0, 0.115], [0.05, h, 0.03]); if (h > 1.5) U.mk(wg, GEO.box, dark(), [0, h * 0.18, 0.115], [w, 0.05, 0.03]); }
    if (opt.sill !== false) U.mk(wg, GEO.box, mc(0xcfd2d4, { roughness: 0.7 }), [0, -h / 2 - 0.1, 0.12], [w + 0.3, 0.08, 0.25]);
    return wg;
  };
  const tree = (g, x, z, sc = 1) => {
    U.mk(g, GEO.cylLo, mc(0x6b4a30, { roughness: 1 }), [x, 1.6 * sc, z], [0.18 * sc, 3.2 * sc, 0.18 * sc]);
    const leaf = [mc(0x3f8a3a, { roughness: 0.9 }), mc(0x4f9a44, { roughness: 0.9 })];
    for (let i = 0; i < 5; i++) U.mk(g, GEO.sphLo, leaf[i % 2], [x + Math.sin(i * 1.9) * 0.9 * sc, (3.4 + (i % 3) * 0.55) * sc, z + Math.cos(i * 1.9) * 0.9 * sc], [1.5 * sc, 1.2 * sc, 1.5 * sc]);
  };

  World.buildHouseModern = function (lvl) {
    World.v36 = null;
    const hg = this.houseGroup; while (hg.children.length) hg.remove(hg.children[0]);
    (this.houseFenceCols || []).forEach(c => Col.remove(c)); this.houseFenceCols = [];
    const o = HOUSE_DEF[lvl - 1] || HOUSE_DEF[0], w = o.w, d = o.d, H = o.h, rh = o.roofH, base = 0.4, top = base + H, F1 = 3.4, y2 = base + F1;
    const tmp = new THREE.Group(), wallM = concrete(), greyM = texMat('plaster', 0x8e9296, { roughness: 0.9 }), darkG = texMat('plaster', 0x55595d, { roughness: 0.9 });
    const roofM = texMat('roof', o.roof ?? 0x3a3f46, { roughness: 0.75 }), slabM = texMat('plaster', 0xd9d9d6, { roughness: 0.85 });
    const bay = 6.2, bx0 = -w / 2, bx1 = -w / 2 + bay;      // carport bay (left): open on the ground floor
    this.winMeshes = [];
    // plinth + concrete forecourt
    U.mk(tmp, U.box(w + 0.3, base, d + 0.3, 2), M.stone, [0, base / 2, 0]);
    U.mk(tmp, U.box(w + 12, 0.06, 9, 4), texMat('paving', 0xcfcfcb, { roughness: 0.9 }), [-2, 0.03, d / 2 + 4.5]);
    // walls: the right block is full height; over the carport only the upper floor is closed
    U.mk(tmp, U.box(w - bay, H, d, 3), wallM, [(bx1 + w / 2) / 2, base + H / 2, 0]);
    U.mk(tmp, U.box(bay, H - F1, d, 3), wallM, [(bx0 + bx1) / 2, y2 + (H - F1) / 2, 0]);
    // carport: slab beam underneath, back wall, columns, dark fascia
    U.mk(tmp, GEO.box, darkG, [(bx0 + bx1) / 2, base + 1.7, -d / 2 + 0.2], [bay, 3.4, 0.3]);
    U.mk(tmp, U.box(bay + 0.3, 0.45, d + 0.3, 2), slabM, [(bx0 + bx1) / 2, y2 - 0.22, 0]);
    for (const px of [bx0 + 0.3, bx1 - 0.15]) U.mk(tmp, GEO.box, darkG, [px, base + 1.7, d / 2 - 0.3], [0.5, 3.4, 0.5]);
    U.mk(tmp, GEO.box, dark(), [(bx0 + bx1) / 2, y2 - 0.1, d / 2 + 0.05], [bay + 0.4, 0.5, 0.12]);
    for (let i = 0; i < 4; i++) U.mk(tmp, GEO.sph, M.bulb, [bx0 + 1.2 + i * 1.3, y2 - 0.52, d / 2 - 1.2], 0.1);
    // gable roof (ridge along x, front slope faces the street): same construction as World.building so the solar panels fit
    const ov = 0.55, hd = d / 2 + ov, k = rh / (d / 2), L = Math.hypot(hd, hd * k), a = Math.atan(k);
    for (const s of [1, -1]) { const m = U.mk(tmp, U.box(w + 2 * ov, 0.16, L, 2.5), roofM, [0, top + rh - hd / 2 * k, s * hd / 2]); m.rotation.x = s * a; }
    { const sh = new THREE.Shape(); sh.moveTo(-d / 2, 0); sh.lineTo(d / 2, 0); sh.lineTo(0, rh); sh.closePath();
      const gg = new THREE.ExtrudeGeometry(sh, { depth: w, bevelEnabled: false }); gg.rotateY(Math.PI / 2); gg.translate(-w / 2, top, 0); U.mk(tmp, gg, wallM); }
    U.mk(tmp, GEO.cyl, dark(), [0, top + rh + 0.05, 0], [0.14, w + 2 * ov, 0.14], [0, 0, Math.PI / 2]);
    for (const s of [1, -1]) U.mk(tmp, GEO.box, dark(), [0, top - ov * k - 0.06, s * (hd + 0.03)], [w + 2 * ov + 0.1, 0.22, 0.06]);
    // the white pointed gable frame on the front, with a grey panel inside
    const cx = 1.5, fw = 6.4, eave = top - 0.1, apex = top + 2.5;
    { const sh = new THREE.Shape(); sh.moveTo(-fw / 2, 0); sh.lineTo(fw / 2, 0); sh.lineTo(fw / 2, eave - base); sh.lineTo(0, apex - base); sh.lineTo(-fw / 2, eave - base); sh.closePath();
      const hole = new THREE.Path(), t = 0.42; hole.moveTo(-fw / 2 + t, 0.0); hole.lineTo(fw / 2 - t, 0.0); hole.lineTo(fw / 2 - t, eave - base - 0.1); hole.lineTo(0, apex - base - t * 1.9); hole.lineTo(-fw / 2 + t, eave - base - 0.1); hole.closePath(); sh.holes.push(hole);
      const fg = new THREE.ExtrudeGeometry(sh, { depth: 0.42, bevelEnabled: false }); fg.translate(cx, base, d / 2); U.mk(tmp, fg, texMat('plaster', 0xffffff, { roughness: 0.8 }));
      const pn = new THREE.Shape(); pn.moveTo(-fw / 2 + 0.4, 0); pn.lineTo(fw / 2 - 0.4, 0); pn.lineTo(fw / 2 - 0.4, eave - base - 0.1); pn.lineTo(0, apex - base - 0.8); pn.lineTo(-fw / 2 + 0.4, eave - base - 0.1); pn.closePath();
      const pg = new THREE.ExtrudeGeometry(pn, { depth: 0.08, bevelEnabled: false }); pg.translate(cx, base, d / 2 + 0.02); U.mk(tmp, pg, darkG); }
    // tall window stack inside the frame + the front door
    mwin(tmp, cx + 1.4, y2 + 1.95, d / 2 + 0.12, 1.9, 3.6, 0, { plain: false });
    mwin(tmp, cx - 1.7, y2 + 1.5, d / 2 + 0.12, 1.5, 1.6, 0);
    const dx = cx - 0.55;
    mwin(tmp, dx, base + 1.15, d / 2 + 0.12, 1.2, 2.3, 0, { sill: false });
    U.mk(tmp, U.box(2.4, 0.18, 1.5, 2), slabM, [dx, base + 2.55, d / 2 + 0.8]);
    for (const sx of [-1, 1]) U.mk(tmp, GEO.box, dark(), [dx + sx * 1.1, base + 1.3, d / 2 + 1.4], [0.06, 2.6, 0.06]);
    mwin(tmp, cx + 1.5, base + 1.4, d / 2 + 0.12, 1.9, 2.0, 0, { sill: false });
    // golden wood-slat strip
    { const sx = cx + fw / 2 + 0.45, wm = texMat('woodV', 0xd8a23e, { roughness: 0.55 });
      U.mk(tmp, GEO.box, mc(0x8a6a2a, { roughness: 0.7 }), [sx, base + (H - 0.4) / 2 + 0.2, d / 2 + 0.03], [0.8, H - 0.4, 0.08]);
      for (let i = 0; i < 8; i++) U.mk(tmp, GEO.box, wm, [sx - 0.33 + i * 0.095, base + (H - 0.4) / 2 + 0.2, d / 2 + 0.1], [0.07, H - 0.5, 0.06]); }
    // right section: big sliding glass door below, balcony with black railing and a glass door above
    const rx0 = cx + fw / 2 + 1.0, rx1 = w / 2, rc = (rx0 + rx1) / 2, rw = rx1 - rx0;
    mwin(tmp, rc, base + 1.25, d / 2 + 0.12, Math.max(2.4, rw - 1.2), 2.4, 0, { sill: false });
    U.mk(tmp, U.box(rw - 0.2, 0.22, 1.4, 2), slabM, [rc, y2 - 0.1, d / 2 + 0.7]);
    mwin(tmp, rc, y2 + 1.3, d / 2 + 0.12, Math.max(2.4, rw - 1.2), 2.4, 0, { sill: false });
    { const by = y2 + 0.01, rz = d / 2 + 1.35, nb = Math.round((rw - 0.4) / 0.14);
      for (let i = 0; i <= nb; i++) U.mk(tmp, GEO.box, dark(), [rx0 + 0.1 + i * (rw - 0.2) / nb, by + 0.55, rz], [0.025, 1.0, 0.025]);
      U.mk(tmp, GEO.box, dark(), [rc, by + 1.05, rz], [rw - 0.2, 0.05, 0.05]); U.mk(tmp, GEO.box, dark(), [rc, by + 0.1, rz], [rw - 0.2, 0.05, 0.05]);
      for (const sx of [rx0 + 0.1, rx1 - 0.1]) { for (let i = 0; i < 6; i++) U.mk(tmp, GEO.box, dark(), [sx, by + 0.55, d / 2 + 0.15 + i * 0.24], [0.025, 1.0, 0.025]); U.mk(tmp, GEO.box, dark(), [sx, by + 1.05, d / 2 + 0.7], [0.05, 0.05, 1.3]); } }
    // upper windows over the carport, side and back windows
    mwin(tmp, bx0 + 1.6, y2 + 1.5, d / 2 + 0.12, 1.6, 1.7, 0); mwin(tmp, bx0 + 4.3, y2 + 1.5, d / 2 + 0.12, 1.6, 1.7, 0);
    for (const z of [-3.2, 0.2, 3.4]) for (const s of [-1, 1]) { mwin(tmp, s * (w / 2), y2 + 1.5, z, 1.6, 1.7, s * Math.PI / 2); mwin(tmp, s * (w / 2), base + 1.5, z, 1.6, 1.7, s * Math.PI / 2); }
    for (const x of [-6, -2, 2, 6]) { mwin(tmp, x, y2 + 1.5, -d / 2, 1.6, 1.7, Math.PI); mwin(tmp, x, base + 1.5, -d / 2, 1.6, 1.7, Math.PI); }
    // the house's own battery / inverter box and meter on the right wall (the backup power that comes with the house)
    { const bb = new THREE.Group(); U.mk(bb, GEO.box, mc(0xeceff1, { roughness: 0.35 }), [0, 0, 0], [0.95, 1.5, 0.3]); U.mk(bb, GEO.box, mc(0x1565c0, { emissive: 0x0b2a60 }), [0, 0.45, 0.16], [0.5, 0.16, 0.01]); U.mk(bb, GEO.box, mc(0x39ff6a, { emissive: 0x1a7a30 }), [0.3, 0.45, 0.16], [0.05, 0.05, 0.01]);
      bb.position.set(w / 2 + 0.16, base + 1.1, -d / 2 + 2.2); bb.rotation.y = Math.PI / 2; tmp.add(bb);
      const mt = new THREE.Group(); U.mk(mt, GEO.box, mc(0xd9dcde, { roughness: 0.4 }), [0, 0, 0], [0.4, 0.5, 0.18]); mt.position.set(w / 2 + 0.12, base + 1.5, -d / 2 + 3.7); mt.rotation.y = Math.PI / 2; tmp.add(mt); }
    // garden: hedges, flower beds, two trees
    // (the row of shrubs that used to stand here was moved to the plaza fountain in world.js)
    { const flo = [0xe84a6f, 0xf6d13a, 0xf08a2c, 0xffffff];
      for (let i = 0; i < 12; i++) U.mk(tmp, GEO.sphLo, mc(flo[i % 4], { roughness: 0.7 }), [bx1 + 0.5 + (i % 6) * 0.55, 0.55, d / 2 + 2.2 + ((i / 6) | 0) * 0.3], 0.16);
      tree(tmp, -w / 2 - 3.0, d / 2 + 2.5, 1.15); tree(tmp, w / 2 + 3.2, d / 2 + 2.2, 1.0); }
    // black name plate at the door
    { const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.42), new THREE.MeshStandardMaterial({ map: U.signTex(S && S.farm ? S.farm : 'บ้านสุขใจ', { w: 256, h: 110, bg: '#1d1f22', fg: '#f3ead0' }), roughness: 0.6 }));
      sg.position.set(dx + 1.9, base + 1.2, d / 2 + 0.2); tmp.add(sg); }
    const merged = U.mergeByMaterial(tmp);
    const hwp = []; this.harvestWindows(hwp, HOUSE_POS.x, HOUSE_POS.z);
    if (this.houseGlow) this.scene.remove(this.houseGlow);
    this.houseGlow = this.glowPoints(hwp, 0xffc56e, 1.7); this.glows.win.push(this.houseGlow);
    merged.position.set(HOUSE_POS.x, 0, HOUSE_POS.z); hg.add(merged);
    Col.remove(this.houseCol);
    this.houseCol = Col.box(HOUSE_POS.x + (bx1 + w / 2) / 2, HOUSE_POS.z, (w - bay) / 2 + 0.25, d / 2 + 0.25);
    this.houseFenceCols.push(Col.box(HOUSE_POS.x + (bx0 + bx1) / 2, HOUSE_POS.z - d / 2 + 0.3, bay / 2, 0.45));
    for (const px of [bx0 + 0.3, bx1 - 0.15]) this.houseFenceCols.push(Col.circle(HOUSE_POS.x + px, HOUSE_POS.z + d / 2 - 0.3, 0.4));
    this.pois = this.pois.filter(p => p.kind !== 'door');
    this.pois.push({ kind: 'door', x: HOUSE_POS.x + dx, z: HOUSE_POS.z + d / 2 + 1.6, r: 2.0, label: 'บ้านของคุณ', icon: '🏡', map: true });
    this.houseDoor = { x: HOUSE_POS.x + dx, z: HOUSE_POS.z + d / 2 + 2.6 };
  };

  // ---------- the old farm yard becomes concrete ----------
  World.paveYard = function () {
    if (this.yardPave || !this.outdoor) return;
    const g = new THREE.Group(), tex = texMat('paving', 0xc9c7c1, { roughness: 0.95 });
    const x0 = -71.6, x1 = 71.6, z0 = -57.7, z1 = 61.6;      // everything inside the estate fence is concrete now (it used to be grass, the field, pen, orchard, pond and paddy)
    U.mk(g, U.box(x1 - x0, 0.05, z1 - z0, 14), tex, [(x0 + x1) / 2, 0.04, (z0 + z1) / 2]);
    // expansion joints every 6 m
    const jm = mc(0x9a9893, { roughness: 1 });
    for (let x = x0 + 6; x < x1; x += 6) U.mk(g, GEO.box, jm, [x, 0.07, (z0 + z1) / 2], [0.05, 0.01, z1 - z0]);
    for (let z = z0 + 6; z < z1; z += 6) U.mk(g, GEO.box, jm, [(x0 + x1) / 2, 0.07, z], [x1 - x0, 0.01, 0.05]);
    g.userData.noCol = true; this.outdoor.add(g); this.yardPave = g;
    try { for (let x = x0 + 12; x < x1; x += 24) for (let z = z0 + 12; z < z1; z += 24) this.clearNear(x, z, 20, true); } catch (e) { }
  };
  // built-in backup power: the house always has a 10 kWh battery with the inverter (charged), so it keeps the lights on in a power cut
  if (typeof Power !== 'undefined' && Power.st) {
    const _st = Power.st.bind(Power);
    Power.st = function () { const s = _st(); if (s && !s.house232) { s.house232 = 1; s.batt = Math.max(s.batt || 0, 10); s.soc = Math.max(s.soc || 0, s.batt); } return s; };
  }
  if (typeof Power !== 'undefined') {
    Power.roofMax = () => [16, 24, 32][S.up.house - 1] || 16;   // the bigger roof takes more solar panels
    if (Power.hourStep) { const _hs = Power.hourStep.bind(Power); Power.hourStep = function (h) { _hs(h); try { const s = this.st(); if (s.batt > 0 && !(s.out > 0) && !s.trip) s.soc = Math.min(s.batt, s.soc + 2); } catch (e) { } }; }   // the built-in battery charges from the grid, so it is always ready for a cut
  }
  // v36_house (paid wider / taller extensions of the old small house) is replaced by this house: no extension is drawn any more
  try { if (S && S.v36h) { S.v36h.fp = 0; S.v36h.fl = 1; } } catch (e) { }
  let t = 0; const iv = setInterval(() => { try { if (typeof S !== 'undefined' && S && typeof G !== 'undefined' && G.started) { clearInterval(iv); World.buildHouse(S.up.house); World.paveYard(); if (S.v36h) { S.v36h.fp = 0; S.v36h.fl = 1; } if (Power && Power.st) Power.st(); } else if (++t > 600) clearInterval(iv); } catch (e) { } }, 500);
});
