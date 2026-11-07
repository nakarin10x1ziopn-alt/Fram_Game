'use strict';
// ---------- v190_driveyard: the driving-test yard was in a town that v99 removed (black / void, and the car was thrown back to the fountain at once).
// A new test yard is built on the free grass west of the village plaza and the driving school uses it ----------
V23.add('v190_driveyard', () => {
  if (typeof Towns4 === 'undefined' || typeof DriveSchool === 'undefined') return;
  const yard = { x: -62, z: -258 }, g = new THREE.Group(); g.name = 'driveyard190';
  U.mk(g, new THREE.PlaneGeometry(22, 30), new THREE.MeshStandardMaterial({ map: T.road, roughness: 0.85 }), [yard.x, 0.03, yard.z], 1, [-Math.PI / 2, 0, 0]);
  const cone = new THREE.MeshStandardMaterial({ color: 0xff6d00, roughness: 0.6 });
  const cones = [];
  for (const [x, z] of [[-6, -10], [6, -10], [-6, -4], [6, -4], [0, 2], [-6, 8], [6, 8], [-3, 12], [3, 12]]) { U.mk(g, GEO.cone, cone, [yard.x + x, 0.35, yard.z + z], [0.25, 0.7, 0.25]); cones.push({ x: yard.x + x, z: yard.z + z }); }
  try { const sg = new THREE.Mesh(new THREE.PlaneGeometry(5, 0.95), new THREE.MeshStandardMaterial({ map: U.signTex('ลานสอบขับรถ', { w: 512, h: 96, bg: '#f57f17', fg: '#1b1b1b' }) })); sg.position.set(yard.x, 2.6, yard.z - 15.2); g.add(sg); } catch (e) { }
  World.outdoor.add(g);
  Towns4.yard = yard; Towns4.cones = cones;
});
