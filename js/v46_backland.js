'use strict';
// ---------- v46_backland: the two lots for sale at the back of the farm stand together as ONE block ----------
// "ที่ดินริมบ่อน้ำท้ายไร่" (south) keeps its place; "ที่ดินแปลงใหญ่ท้ายไร่" (east) moves next to it (18 m centre to centre: even the widest design, the 14 m mansion, fits on both),
// the ground between is levelled, and one shared frontage (paved walkway, fence line and a sign for the whole block) ties them together.
// Runs when the script loads, before the terrain is built, so the levelling pads and the lot positions agree.
{
  const A = LOTS.find(l => l.id === 'south'), B = LOTS.find(l => l.id === 'east');
  if (A && B) {
    const oldB = { x: B.x, z: B.z }; B.x = A.x + 18; B.z = A.z;
    for (const p of FLAT_PADS) if (p.x === oldB.x && p.z === oldB.z) { p.x = B.x; p.z = B.z; }
    FLAT_PADS.push({ x: (A.x + B.x) / 2, z: A.z, r: 12 });
    B.n = 'ที่ดินท้ายไร่ ส่วนที่ 2 (ในแปลงใหญ่)'; A.n = 'ที่ดินท้ายไร่ แปลงใหญ่ (2 แปลงติดกัน)'; A.price = 65000;   // v1.1: one purchase for the whole block (30,000 + 35,000)
  }
}
V23.add('v46_backland', () => {
  const A = LOTS.find(l => l.id === 'south'), B = LOTS.find(l => l.id === 'east'); if (!A || !B) return;
  const g = new THREE.Group(); World.outdoor.add(g);
  const y = x => { try { return Math.max(0, World.groundY(x, A.z)); } catch (e) { return 0; } };
  const x0 = A.x - 9, x1 = B.x + 9, zc = A.z, zf = A.z - 6.5;          // the frontage faces the farm (smaller z)
  // shared paved walkway along the whole front of the block
  U.mk(g, U.box(x1 - x0, 0.05, 2.2, 1.5), texMat('paving', 0xbdb8ae), [(x0 + x1) / 2, y((x0 + x1) / 2) + 0.03, zf]);
  // fence line along the back of the block with posts every 3 m, and the two outer sides
  const wood = M.darkwood;
  for (let x = x0; x <= x1 + 0.01; x += 3) { U.mk(g, GEO.box, wood, [x, y(x) + 0.5, zc + 7], [0.12, 1.0, 0.12]); }
  U.mk(g, GEO.box, wood, [(x0 + x1) / 2, y((x0 + x1) / 2) + 0.8, zc + 7], [x1 - x0, 0.08, 0.06]);
  for (const sx of [x0, x1]) { U.mk(g, GEO.box, wood, [sx, y(sx) + 0.8, zc + 0.25], [0.06, 0.08, 14]); U.mk(g, GEO.box, wood, [sx, y(sx) + 0.5, zc + 0.25], [0.12, 1.0, 0.12]); }
  // one sign for the whole block
  const cx = (A.x + B.x) / 2, sg = new THREE.MeshStandardMaterial({ map: U.signTex('ที่ดินท้ายไร่ 2 แปลง', { w: 512, h: 128, bg: '#2e7d32' }), roughness: 0.8 });
  U.mk(g, GEO.cylLo, M.darkwood, [cx - 1.3, y(cx) + 1.1, zf - 1.4], [0.08, 2.2, 0.08]); U.mk(g, GEO.cylLo, M.darkwood, [cx + 1.3, y(cx) + 1.1, zf - 1.4], [0.08, 2.2, 0.08]);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.8), sg); p.position.set(cx, y(cx) + 2.0, zf - 1.42); p.rotation.y = Math.PI; g.add(p);
  try { World.clearNear(cx, zc, 16, true); } catch (e) { }
  try { HomeBuild.draw('south'); HomeBuild.draw('east'); } catch (e) { }
  // ---- one purchase: buying the big lot gives both halves; an old save that owns only one half gets the other for free ----
  const lots = () => HomeBuild.st().lots;
  const merge = () => { const L = lots(); let n = false; if (L.south && !L.east) { L.east = { design: null, merged: 1 }; n = true; } else if (L.east && !L.south) { L.south = { design: null, merged: 1 }; n = true; } return n; };
  { const _draw = HomeBuild.draw.bind(HomeBuild);
    HomeBuild.draw = function (id) {
      if (id === 'south' || id === 'east') { const had = !!lots().east; if (merge()) { try { UI.toast('ได้ที่ดินอีกครึ่งของแปลงใหญ่ท้ายไร่ ติดกัน รวมเป็นผืนเดียวแล้ว', '🏞️'); } catch (e) { } setTimeout(() => { try { _draw(id === 'south' ? 'east' : 'south'); } catch (e) { } }, 0); } }
      if (id === 'east' && !lots().east) { const rec = this.g.east; if (rec) { try { World.outdoor.remove(rec.g); } catch (e) { } delete this.g.east; } return; }   // no second sale sign: the block is sold as one
      return _draw(id);
    };
    const _ui = HomeBuild.ui.bind(HomeBuild);
    HomeBuild.ui = function (id) { if (id === 'east' && !lots().east) id = 'south'; const r = _ui(id); try { const c = UI.cur; if (c && id === 'south' && !lots().south && typeof c.render === 'function') { const r0 = c.render; c.render = t => String(r0(t)).replace('ขนาดประมาณ 1 ไร่', 'ขนาดประมาณ 2 ไร่ (2 แปลงติดกัน รวมเป็นผืนเดียว ขายครั้งเดียว)'); UI.renderBody(); } } catch (e) { } return r; };
    const _label = HomeBuild.label.bind(HomeBuild);
    HomeBuild.label = function (L) { if (L && L.id === 'east' && !lots().east) L = LOTS.find(l => l.id === 'south') || L; return _label(L); };
    const _day = HomeBuild.day.bind(HomeBuild); HomeBuild.day = function () { try { if (merge()) { _draw('south'); _draw('east'); } } catch (e) { } return _day(); };
  }
  try { if (merge()) { _redrawBoth(); } } catch (e) { }
  function _redrawBoth() { try { HomeBuild.draw('south'); HomeBuild.draw('east'); } catch (e) { } }
  try { if (!lots().east) HomeBuild.draw('east'); } catch (e) { }
});
