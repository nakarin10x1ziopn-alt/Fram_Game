'use strict';
// ---------- v46_backland (v234): ONE lot of 100 square wah (400 m2, 20 x 20 m) inside the estate fence, for sale / to build on ----------
// The old two back lots are gone. The lot id stays 'south' (HomeBuild). Drawn here: a paved apron, concrete kerb around the 20 x 20 plot and one sign.
V23.add('v46_backland', () => {
  const A = LOTS.find(l => l.id === 'south'); if (!A) return;
  const g = new THREE.Group(); World.outdoor.add(g);
  const kerb = mc(0xe9e8e4, { roughness: 0.9 }), h = 10, y0 = 0.07;
  U.mk(g, GEO.box, kerb, [A.x, y0, A.z - h], [h * 2 + 0.2, 0.12, 0.2]); U.mk(g, GEO.box, kerb, [A.x, y0, A.z + h], [h * 2 + 0.2, 0.12, 0.2]);
  U.mk(g, GEO.box, kerb, [A.x - h, y0, A.z], [0.2, 0.12, h * 2]); U.mk(g, GEO.box, kerb, [A.x + h, y0, A.z], [0.2, 0.12, h * 2]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) U.mk(g, GEO.box, M.darkwood, [A.x + sx * h, 0.4, A.z + sz * h], [0.16, 0.8, 0.16]);
  const sg = new THREE.MeshStandardMaterial({ map: U.signTex('ที่ดิน 100 ตารางวา', { w: 512, h: 128, bg: '#2e7d32' }), roughness: 0.8 });
  const sx = A.x, sz = A.z - h - 1.2;
  U.mk(g, GEO.cylLo, M.darkwood, [sx - 1.3, 1.1, sz], [0.08, 2.2, 0.08]); U.mk(g, GEO.cylLo, M.darkwood, [sx + 1.3, 1.1, sz], [0.08, 2.2, 0.08]);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.8), sg); p.position.set(sx, 2.0, sz - 0.02); p.rotation.y = Math.PI; g.add(p);
});
