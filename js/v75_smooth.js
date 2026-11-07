// v75_smooth.js: smoother play on every quality level (colours and models are untouched)
//  - scenery chunks (trees, grass, flowers, rocks) are now frustum-culled: nothing behind or beside the camera is drawn any more
//    (before, every chunk inside the distance limit was drawn even when it was behind the player)
V23.add('v75_smooth', () => {
  if (typeof World === 'undefined' || !World.cull || !World.instChunks) return;
  const m4 = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(), c = new THREE.Vector3();
  // exact bounding sphere of every instance of a static chunk (+ a margin for wind sway), own geometry shell so shared geometry is never touched
  const fit = o => {
    if (!o || !o.isInstancedMesh || o.userData.fit75 || o.count < 1) return;
    try {
      const g0 = o.geometry; if (!g0.boundingBox) g0.computeBoundingBox();
      const bb = g0.boundingBox, gr = Math.max(bb.max.length(), bb.min.length());
      let mx = 0; c.set(0, 0, 0);
      for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m4); m4.decompose(p, q, s); c.add(p); mx = Math.max(mx, s.x, s.y, s.z); }
      c.multiplyScalar(1 / o.count);
      let rad = 0; for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m4); m4.decompose(p, q, s); rad = Math.max(rad, p.distanceTo(c)); }
      const g = new THREE.BufferGeometry(); for (const k in g0.attributes) g.setAttribute(k, g0.attributes[k]); if (g0.index) g.setIndex(g0.index);
      g.boundingSphere = new THREE.Sphere(c.clone(), rad + gr * mx + 1.5); g.boundingBox = bb.clone();
      o.geometry = g; o.frustumCulled = true; o.userData.fit75 = 1;
    } catch (e) { }
  };
  const run = () => { for (const e of World.cull) fit(e.o); };
  run();
  const _ic = World.instChunks.bind(World);
  World.instChunks = function (...a) { const r = _ic(...a); run(); return r; };
  if (typeof Town2 !== 'undefined' && Town2.go) { const _go = Town2.go.bind(Town2); Town2.go = function (k, fee) { const r = _go(k, fee); setTimeout(run, 300); setTimeout(run, 3000); return r; }; }
  window.Smooth75 = { run, fit };
});
