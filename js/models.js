'use strict';
// ---------- Shared geometry / material caches ----------
// smoother silhouettes on every quality except low (more segments on the shared round shapes: spheres, cylinders, cones)
const _GQ = (() => { try { return localStorage.getItem('raisukjai3d_quality'); } catch (e) { return null; } })(), GHQ = _GQ !== 'low';
const GEO = {
  sph: new THREE.SphereGeometry(1, GHQ ? 24 : 14, GHQ ? 16 : 10),
  sphLo: new THREE.SphereGeometry(1, GHQ ? 16 : 10, GHQ ? 12 : 8),
  cyl: new THREE.CylinderGeometry(1, 1, 1, GHQ ? 24 : 14),
  cylLo: new THREE.CylinderGeometry(1, 1, 1, GHQ ? 12 : 7),
  cone: new THREE.ConeGeometry(1, 1, GHQ ? 20 : 12),
  box: new THREE.BoxGeometry(1, 1, 1),
  leaf: new THREE.SphereGeometry(1, GHQ ? 14 : 9, GHQ ? 10 : 6),
};
const _gc = {}, _mc = {};
function gcache(k, fn) { return _gc[k] || (_gc[k] = fn()); }
function mc(hex, o) { const k = hex + '|' + (o ? JSON.stringify(o) : ''); return _mc[k] || (_mc[k] = U.mat(hex, o)); }
function texMat(tex, hex, o) { const k = 'T' + tex + '|' + hex + '|' + (o ? JSON.stringify(o) : ''); return _mc[k] || (_mc[k] = U.mat(hex, Object.assign({ map: T[tex] }, T[tex + '_n'] ? { normalMap: T[tex + '_n'], roughnessMap: T[tex + '_r'], normalScale: new THREE.Vector2(0.9, 0.9) } : {}, o || {}))); }
function capsule(r, len, seg = 12) {
  return gcache('cap' + r + '_' + len, () => {
    const pts = [], n = 6;
    for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + i / n * Math.PI / 2; pts.push(new THREE.Vector2(Math.max(1e-4, Math.cos(a) * r), -len / 2 + Math.sin(a) * r)); }
    for (let i = 0; i <= n; i++) { const a = i / n * Math.PI / 2; pts.push(new THREE.Vector2(Math.max(1e-4, Math.cos(a) * r), len / 2 + Math.sin(a) * r)); }
    return new THREE.LatheGeometry(pts, seg);
  });
}
function lathe(k, arr, seg = 20) { return gcache('l' + k, () => new THREE.LatheGeometry(arr.map(p => new THREE.Vector2(p[0], p[1])), seg)); }
GEO.leaf2 = (() => {
  const g = new THREE.PlaneGeometry(2, 2, 4, 8); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), t = (z + 1) / 2;
    const w = Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.08)), 0.75) * (0.35 + 0.65 * Math.min(1, t * 2.2));
    p.setXYZ(i, x * w, Math.abs(x * w) * 0.45 - t * t * 0.35, z);
  }
  g.computeVertexNormals(); return g;
})();
function leafAt(g, mat, ang, tilt, len, wid, y = 0, r0 = 0, geo) {
  const m = new THREE.Mesh(geo || GEO.leaf, mat);
  const dx = Math.sin(ang), dz = Math.cos(ang), ct = Math.cos(tilt), st = Math.sin(tilt);
  m.position.set(dx * (ct * len * 0.5 + r0), y + st * len * 0.5, dz * (ct * len * 0.5 + r0));
  m.rotation.set(-tilt, ang, 0, 'YXZ');
  m.scale.set(wid, geo ? wid * 0.8 : Math.max(0.006, wid * 0.14), len * 0.5);
  m.castShadow = true; m.receiveShadow = true;
  g.add(m); return m;
}
function shadowAll(o, cast = true) { o.traverse(m => { if (m.isMesh) { m.castShadow = cast; m.receiveShadow = true; } }); return o; }

const Models = {};
// Merge sibling meshes that share a material inside each animated group (keeps joints, cuts draw calls)
Models.compact = function (root) {
  const groups = []; root.traverse(o => { if (o.isGroup || o === root) groups.push(o); });
  for (const g of groups) {
    const by = new Map();
    for (const m of g.children) if (m.isMesh && !m.children.length) { if (!by.has(m.material)) by.set(m.material, []); by.get(m.material).push(m); }
    for (const [mat, arr] of by) {
      if (arr.length < 2) continue;
      const mm = new THREE.Mesh(U.mergeGeos(arr.map(m => { m.updateMatrix(); return U.bake(m.geometry, m.matrix); })), mat);
      mm.castShadow = arr[0].castShadow; mm.receiveShadow = true;
      arr.forEach(m => g.remove(m)); g.add(mm);
    }
  }
  return root;
};
Models.setShadow = function (root, v) { root.traverse(m => { if (m.isMesh) m.castShadow = v; }); };

// ---------- People (smooth, rounded anatomy) ----------
Models.human = function (o = {}) {
  const skin = mc(o.skin ?? 0xe0a87e, { roughness: 0.55 });
  const shirt = mc(o.shirt ?? 0xd35d47, { roughness: 0.85 });
  const pants = mc(o.pants ?? 0x34507a, { roughness: 0.9 });
  const hairM = mc(o.hair ?? 0x2b1a10, { roughness: 0.6 });
  const shoeM = mc(o.shoe ?? 0x4a3020, { roughness: 0.5 });
  const dark = mc(0x161210, { roughness: 0.25 });
  const root = new THREE.Group(), rig = new THREE.Group(); root.add(rig);
  const upper = new THREE.Group(); upper.position.y = 0.95; rig.add(upper);
  const U2 = new THREE.Group(); U2.position.y = -0.95; upper.add(U2);
  const P = { rig, upper, phase: 0, t: 0 };
  U.mk(U2, GEO.sph, pants, [0, 0.97, 0], [0.165, 0.12, 0.115]);
  const torso = lathe('torso', [[0, 0], [0.15, 0], [0.16, 0.08], [0.152, 0.2], [0.166, 0.36], [0.18, 0.46], [0.155, 0.53], [0.08, 0.575], [0, 0.585]]);
  U.mk(U2, torso, shirt, [0, 0.92, 0], [1, 1, 0.7]);
  if (o.overalls) {
    const ov = mc(o.overalls, { roughness: 0.9 });
    U.mk(U2, lathe('bib', [[0, 0], [0.157, 0], [0.167, 0.08], [0.159, 0.2], [0.165, 0.3], [0.0, 0.305]]), ov, [0, 0.915, 0], [1.01, 1, 0.72]);
    U.mk(U2, GEO.box, ov, [0, 1.28, 0.107], [0.2, 0.15, 0.02]);
    for (const s of [-1, 1]) {
      U.mk(U2, GEO.box, ov, [s * 0.075, 1.38, 0.112], [0.035, 0.18, 0.015]);
      U.mk(U2, GEO.box, ov, [s * 0.075, 1.33, -0.11], [0.035, 0.26, 0.015]);
      U.mk(U2, GEO.sphLo, mc(0xd9b44a, { metalness: 0.6, roughness: 0.3 }), [s * 0.075, 1.31, 0.12], 0.014);
    }
  }
  U.mk(U2, GEO.cyl, skin, [0, 1.52, 0], [0.052, 0.1, 0.052]);
  if (o.skirt != null) {
    const sk = gcache('skirtM' + o.skirt, () => { const m = U.mat(o.skirt, { roughness: 0.85 }); m.side = THREE.DoubleSide; return m; });
    U.mk(U2, lathe('skirt', [[0.16, 0], [0.19, -0.1], [0.245, -0.42], [0.25, -0.44]], 18), sk, [0, 1.0, 0], [1, 1, 0.8]);
  }
  if (o.apron != null) {
    const am = mc(o.apron, { roughness: 0.9 });
    U.mk(U2, GEO.box, am, [0, 1.07, 0.112], [0.25, 0.36, 0.012]);
    U.mk(U2, GEO.box, am, [0, 1.36, 0.11], [0.16, 0.16, 0.012]);
  }
  // head
  const head = new THREE.Group(); head.position.set(0, 1.645, 0); U2.add(head); P.head = head;
  U.mk(head, GEO.sph, skin, [0, 0, 0], [0.118, 0.135, 0.125]);
  const eyes = new THREE.Group(); eyes.position.y = 0.012; head.add(eyes); P.eyes = eyes;
  for (const s of [-1, 1]) {
    U.mk(head, GEO.sphLo, skin, [s * 0.117, -0.005, -0.005], [0.024, 0.04, 0.03]);
    U.mk(eyes, GEO.sphLo, mc(0xffffff, { roughness: 0.3 }), [s * 0.043, 0, 0.104], [0.022, 0.024, 0.012]);
    U.mk(eyes, GEO.sphLo, dark, [s * 0.043, -0.001, 0.113], [0.013, 0.016, 0.008]);
    U.mk(head, GEO.box, hairM, [s * 0.045, 0.052, 0.112], [0.042, 0.009, 0.01], [0, 0, -s * 0.12]);
    U.mk(head, GEO.sphLo, mc(0xf09a8a, { roughness: 0.7 }), [s * 0.068, -0.038, 0.096], [0.022, 0.014, 0.01]);
  }
  U.mk(head, GEO.sphLo, skin, [0, -0.022, 0.124], [0.018, 0.024, 0.02]);
  U.mk(head, GEO.box, mc(0x9a4a40), [0, -0.062, 0.112], [0.042, 0.008, 0.01]);
  const cap = gcache('haircap', () => new THREE.SphereGeometry(1, 18, 10, 0, TAU, 0, Math.PI * 0.55));
  U.mk(head, cap, hairM, [0, 0.012, -0.008], [0.128, 0.146, 0.136], [-0.28, 0, 0]);
  U.mk(head, GEO.sph, hairM, [0, -0.015, -0.05], [0.121, 0.122, 0.1]);
  if (o.long) U.mk(head, GEO.sph, hairM, [0, -0.15, -0.075], [0.11, 0.21, 0.065]);
  if (o.bun) U.mk(head, GEO.sph, hairM, [0, 0.11, -0.09], 0.06);
  if (o.pony) { U.mk(head, GEO.sph, hairM, [0, 0.0, -0.15], [0.05, 0.05, 0.05]); U.mk(head, capsule(0.04, 0.16), hairM, [0, -0.1, -0.17], 1, [0.25, 0, 0]); }
  if (o.beard) U.mk(head, GEO.sph, hairM, [0, -0.085, 0.07], [0.09, 0.065, 0.06]);
  if (o.glasses) {
    const gm = mc(0x2b2b2b, { roughness: 0.3, metalness: 0.4 }), ring = gcache('lens', () => new THREE.TorusGeometry(0.026, 0.005, 6, 16));
    for (const s of [-1, 1]) U.mk(head, ring, gm, [s * 0.043, 0.012, 0.122]);
    U.mk(head, GEO.box, gm, [0, 0.016, 0.124], [0.034, 0.005, 0.005]);
  }
  if (o.hat === 'straw') {
    const straw = texMat('straw', 0xffffff, { roughness: 0.9 });
    U.mk(head, gcache('brim', () => new THREE.CylinderGeometry(0.29, 0.29, 0.012, 28)), straw, [0, 0.085, -0.005]);
    U.mk(head, gcache('crown', () => new THREE.CylinderGeometry(0.105, 0.128, 0.12, 22)), straw, [0, 0.14, -0.005]);
    U.mk(head, gcache('band', () => new THREE.CylinderGeometry(0.129, 0.129, 0.028, 22)), mc(0xb8322a), [0, 0.105, -0.005]);
  } else if (o.hat === 'cap') {
    const cm = mc(o.capColor ?? 0x2f6db5, { roughness: 0.8 });
    U.mk(head, cap, cm, [0, 0.03, -0.005], [0.132, 0.13, 0.138], [-0.12, 0, 0]);
    U.mk(head, GEO.sphLo, cm, [0, 0.055, 0.13], [0.09, 0.012, 0.07]);
  }
  // arms
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.205, 1.43, 0); sh.rotation.z = s * 0.08; U2.add(sh);
    U.mk(sh, GEO.sph, shirt, [0, -0.01, 0], 0.068);
    U.mk(sh, capsule(0.052, 0.2), o.sleeveless ? skin : shirt, [0, -0.12, 0]);
    const el = new THREE.Group(); el.position.y = -0.265; sh.add(el);
    U.mk(el, capsule(0.043, 0.18), o.longSleeve ? shirt : skin, [0, -0.11, 0]);
    U.mk(el, GEO.sph, skin, [0, -0.255, 0.005], [0.043, 0.058, 0.032]);
    U.mk(el, GEO.sph, skin, [-s * 0.03, -0.24, 0.022], [0.016, 0.028, 0.016], [0.3, 0, s * 0.4]);
    P[s < 0 ? 'armL' : 'armR'] = sh; P[s < 0 ? 'elL' : 'elR'] = el;
  }
  // legs
  for (const s of [-1, 1]) {
    const hp = new THREE.Group(); hp.position.set(s * 0.088, 0.93, 0); rig.add(hp);
    U.mk(hp, capsule(0.072, 0.3), pants, [0, -0.2, 0]);
    const kn = new THREE.Group(); kn.position.y = -0.43; hp.add(kn);
    U.mk(kn, capsule(0.058, 0.3), pants, [0, -0.2, 0]);
    U.mk(kn, GEO.sph, shoeM, [0, -0.43, 0.035], [0.064, 0.045, 0.11]);
    U.mk(kn, GEO.sph, mc(0x241a14, { roughness: 0.8 }), [0, -0.462, 0.035], [0.067, 0.016, 0.115]);
    P[s < 0 ? 'legL' : 'legR'] = hp; P[s < 0 ? 'knL' : 'knR'] = kn;
  }
  root.userData = P;
  return blobUnder(Models.compact(shadowAll(root)), 0.42);
};

Models.animHuman = function (h, dt, speed, act) {
  const P = h.userData; P.t += dt;
  const s = U.clamp(speed / 3.6, 0, 1.4);   // limb swing for real walking speeds (1.4-1.8 m/s walk, ~4 m/s jog)
  if (s > 0.02) P.phase += dt * (4 + speed * 1.55);
  const sw = Math.sin(P.phase), cw = Math.cos(P.phase), amp = Math.min(s, 1.15);
  let legL = -sw * 0.62 * amp, legR = sw * 0.62 * amp;
  let knL = Math.max(0, cw) * 0.85 * amp + 0.04, knR = Math.max(0, -cw) * 0.85 * amp + 0.04;
  let armL = sw * 0.5 * amp, armR = -sw * 0.5 * amp, elL = -0.2 - 0.35 * amp, elR = -0.2 - 0.35 * amp;
  let bodyX = 0.07 * amp, bodyY = Math.abs(cw) * 0.04 * amp, headX = 0;
  const br = Math.sin(P.t * 2.2) * 0.008;
  const idle = 1 - Math.min(1, amp * 2);
  armL += (-0.08 + Math.sin(P.t * 1.1) * 0.03) * idle; armR += (-0.08 + Math.sin(P.t * 1.1 + 1) * 0.03) * idle;
  elL -= 0.12 * idle; elR -= 0.12 * idle;
  P.lookT = (P.lookT || 0) - dt;
  if (P.lookT <= 0) { P.lookT = 2 + Math.random() * 4; P.lookY = Math.random() < 0.5 ? 0 : (Math.random() - 0.5) * 1.1; }
  const headY = (P.lookY || 0) * idle;
  if (P.pose === 'scare') { armL = 0; armR = 0; }
  if (act) {
    const k = Math.sin(Math.PI * U.clamp(act.t / act.dur, 0, 1));
    switch (act.type) {
      case 'water': armR = U.lerp(armR, -1.2, k); elR = U.lerp(elR, -0.1, k); bodyX += 0.12 * k; break;
      case 'plant': case 'harvest': case 'pet': case 'collect':
        bodyX += 0.8 * k; armR = U.lerp(armR, -1.15, k); armL = U.lerp(armL, -1.0, k);
        knL += 0.75 * k; knR += 0.75 * k; legL -= 0.55 * k; legR -= 0.55 * k; bodyY -= 0.13 * k; headX = -0.25 * k; break;
      case 'eat': armR = U.lerp(armR, -0.45, k); elR = U.lerp(elR, -2.1, k); headX = -0.1 * k; break;
      case 'fill': armR = U.lerp(armR, -0.9, k); bodyX += 0.45 * k; knL += 0.4 * k; knR += 0.4 * k; legL -= 0.3 * k; legR -= 0.3 * k; bodyY -= 0.06 * k; break;
      case 'cast': armR = U.lerp(armR, -2.6, k); elR = U.lerp(elR, -0.3, k); bodyX -= 0.1 * k; break;
      case 'hold': armR = -0.75; elR = -0.55; armL = -0.5; elL = -0.9; break;
      case 'wave': armR = U.lerp(armR, -2.7, k); elR = -0.4 + Math.sin(P.t * 12) * 0.5 * k; break;
    }
  }
  const f = Math.min(1, dt * 14), L = (o, k, v) => { o[k] = U.lerp(o[k], v, f); };
  L(P.legL.rotation, 'x', legL); L(P.legR.rotation, 'x', legR);
  L(P.knL.rotation, 'x', knL); L(P.knR.rotation, 'x', knR);
  L(P.armL.rotation, 'x', armL); L(P.armR.rotation, 'x', armR);
  L(P.elL.rotation, 'x', elL); L(P.elR.rotation, 'x', elR);
  L(P.upper.rotation, 'x', bodyX); L(P.head.rotation, 'x', headX);
  P.head.rotation.y = U.lerp(P.head.rotation.y, act ? 0 : headY, Math.min(1, dt * 3));
  P.upper.rotation.z = Math.sin(P.t * 0.8) * 0.018 * idle + Math.sin(P.phase) * 0.03 * amp;
  P.armL.rotation.z = U.lerp(P.armL.rotation.z, P.pose === 'scare' ? -1.45 : -0.1 - 0.04 * idle, f); P.armR.rotation.z = U.lerp(P.armR.rotation.z, P.pose === 'scare' ? 1.45 : 0.1 + 0.04 * idle, f);
  P.rig.position.y = U.lerp(P.rig.position.y, bodyY, f);
  P.upper.scale.y = 1 + br;
  if (P.eyes) { P.blinkT = (P.blinkT ?? 2) - dt; if (P.blinkT < 0) { P.blinkT = 2 + Math.random() * 4; } P.eyes.scale.y = P.blinkT < 0.12 ? 0.15 : 1; }
};

Models.can = function () {
  const g = new THREE.Group();
  const m = mc(0x3f8f5a, { roughness: 0.35, metalness: 0.35 });
  U.mk(g, lathe('canbody', [[0, 0], [0.085, 0], [0.095, 0.02], [0.095, 0.16], [0.08, 0.18], [0, 0.18]]), m, [0, 0, 0]);
  U.mk(g, GEO.cyl, m, [0, 0.12, 0.15], [0.014, 0.22, 0.014], [1.0, 0, 0]);
  U.mk(g, GEO.cone, mc(0xb8c2c8, { metalness: 0.5, roughness: 0.3 }), [0, 0.2, 0.24], [0.03, 0.05, 0.03], [-0.6, 0, 0]);
  U.mk(g, gcache('canh', () => new THREE.TorusGeometry(0.07, 0.012, 6, 14, Math.PI)), m, [0, 0.18, -0.01], 1, [0, Math.PI / 2, 0]);
  return shadowAll(g);
};

// ---------- Animals ----------
Models.chicken = function (brown) {
  const g = new THREE.Group(), P = { legs: [], legRate: 14 };
  const bm = mc(brown ? 0xb5652b : 0xf7f4ee, { roughness: 0.9 });
  const body = new THREE.Group(); g.add(body); P.body = body;
  U.mk(body, GEO.sph, bm, [0, 0.3, 0], [0.17, 0.17, 0.22]);
  U.mk(body, GEO.sph, bm, [0, 0.41, -0.17], [0.07, 0.13, 0.1], [-0.6, 0, 0]);
  for (const s of [-1, 1]) U.mk(body, GEO.sph, bm, [s * 0.15, 0.31, -0.01], [0.05, 0.11, 0.16], [0.15, 0, 0]);
  const head = new THREE.Group(); head.position.set(0, 0.47, 0.16); body.add(head); P.head = head;
  U.mk(head, GEO.sph, bm, [0, 0, 0], 0.085);
  U.mk(head, GEO.cone, mc(0xf2a516), [0, -0.01, 0.1], [0.03, 0.07, 0.03], [Math.PI / 2, 0, 0]);
  const red = mc(0xd92b2b, { roughness: 0.6 });
  for (let i = 0; i < 3; i++) U.mk(head, GEO.sphLo, red, [0, 0.085, -0.03 + i * 0.035], [0.02, 0.035, 0.022]);
  U.mk(head, GEO.sphLo, red, [0, -0.06, 0.07], [0.018, 0.03, 0.015]);
  for (const s of [-1, 1]) { U.mk(head, GEO.sphLo, mc(0x111111, { roughness: 0.2 }), [s * 0.06, 0.02, 0.055], 0.016); U.mk(head, GEO.sphLo, mc(0xffffff, { roughness: 0.1 }), [s * 0.066, 0.027, 0.066], 0.005); }
  for (const s of [-1, 1]) {
    const lg = new THREE.Group(); lg.position.set(s * 0.06, 0.17, 0); g.add(lg);
    U.mk(lg, GEO.cylLo, mc(0xf2a516), [0, -0.08, 0], [0.014, 0.16, 0.014]);
    U.mk(lg, GEO.sphLo, mc(0xf2a516), [0, -0.16, 0.03], [0.035, 0.01, 0.05]);
    P.legs.push(lg);
  }
  g.userData = P; return shadowAll(g);
};
Models.cow = function () {
  const g = new THREE.Group(), P = { legs: [], legRate: 7 };
  const bm = texMat('cow', 0xffffff, { roughness: 0.8 });
  const body = new THREE.Group(); g.add(body); P.body = body;
  U.mk(body, capsule(0.42, 0.95, 16), bm, [0, 1.0, 0], [1, 1, 0.9], [Math.PI / 2, 0, 0]);
  U.mk(body, GEO.sph, mc(0xf0a6a6, { roughness: 0.6 }), [0, 0.62, -0.35], [0.15, 0.11, 0.15]);
  const head = new THREE.Group(); head.position.set(0, 1.3, 0.82); body.add(head); P.head = head;
  U.mk(head, GEO.sph, bm, [0, 0, 0.1], [0.22, 0.24, 0.3]);
  U.mk(head, GEO.sph, mc(0xf2b0a8, { roughness: 0.5 }), [0, -0.1, 0.34], [0.17, 0.13, 0.12]);
  const dk = mc(0x1c1512, { roughness: 0.3 });
  for (const s of [-1, 1]) {
    U.mk(head, GEO.sphLo, dk, [s * 0.06, -0.09, 0.45], [0.022, 0.03, 0.01]);
    U.mk(head, GEO.sphLo, dk, [s * 0.165, 0.07, 0.22], 0.038); U.mk(head, GEO.sphLo, mc(0xffffff, { roughness: 0.1 }), [s * 0.172, 0.085, 0.252], 0.011);
    U.mk(head, GEO.sph, bm, [s * 0.25, 0.08, 0.02], [0.12, 0.04, 0.07], [0, 0, s * 0.35]);
    U.mk(head, GEO.cone, mc(0xeee3c8, { roughness: 0.5 }), [s * 0.12, 0.23, 0.0], [0.03, 0.13, 0.03], [0, 0, -s * 0.5]);
  }
  for (const [x, z] of [[-0.24, 0.5], [0.24, 0.5], [-0.24, -0.5], [0.24, -0.5]]) {
    const lg = new THREE.Group(); lg.position.set(x, 0.78, z); g.add(lg);
    U.mk(lg, capsule(0.085, 0.5), bm, [0, -0.34, 0]);
    U.mk(lg, GEO.cyl, dk, [0, -0.7, 0], [0.09, 0.08, 0.09]);
    P.legs.push(lg);
  }
  U.mk(body, gcache('collar', () => new THREE.TorusGeometry(0.24, 0.035, 8, 20)), mc(0x8a2b2b, { roughness: 0.6 }), [0, 1.15, 0.7], 1, [0.5, 0, 0]);
  U.mk(body, lathe('bell', [[0, 0], [0.1, 0], [0.08, 0.06], [0.06, 0.16], [0, 0.18]], 14), mc(0xd9b44a, { metalness: 0.6, roughness: 0.3 }), [0, 0.85, 0.86]);
  const tail = new THREE.Group(); tail.position.set(0, 1.28, -0.86); body.add(tail); P.tail = tail;
  U.mk(tail, GEO.cylLo, bm, [0, -0.3, -0.05], [0.02, 0.6, 0.02], [0.18, 0, 0]);
  U.mk(tail, GEO.sphLo, dk, [0, -0.62, -0.1], [0.05, 0.08, 0.05]);
  g.userData = P; return shadowAll(g);
};
Models.sheep = function () {
  const g = new THREE.Group(), P = { legs: [], legRate: 8 };
  const wool = mc(0xf3eee2, { roughness: 1 }), face = mc(0x2c2622, { roughness: 0.7 });
  const body = new THREE.Group(); g.add(body); P.body = body;
  const wg = gcache('wool', () => {
    const R = U.rng(7), arr = [], m = new THREE.Matrix4();
    for (let i = 0; i < 26; i++) {
      const a = R() * TAU, b = (R() - 0.5) * 2;
      const r = 0.17 + R() * 0.07;
      m.makeScale(r, r, r).setPosition(Math.cos(a) * 0.26 * Math.sqrt(1 - b * b * 0.5), b * 0.16, Math.sin(a) * 0.36);
      arr.push(U.bake(GEO.sphLo, m));
    }
    return U.mergeGeos(arr);
  });
  U.mk(body, wg, wool, [0, 0.78, 0]);
  const head = new THREE.Group(); head.position.set(0, 0.95, 0.42); body.add(head); P.head = head;
  U.mk(head, GEO.sph, face, [0, -0.02, 0.08], [0.11, 0.14, 0.17]);
  U.mk(head, GEO.sph, wool, [0, 0.09, 0.02], [0.13, 0.08, 0.12]);
  const st = new THREE.Group(); st.position.set(0, 0.85, -0.42); body.add(st); P.tail = st; U.mk(st, GEO.sph, wool, [0, -0.05, -0.04], [0.09, 0.11, 0.08]);
  for (const s of [-1, 1]) {
    U.mk(head, GEO.sph, face, [s * 0.14, 0.02, 0], [0.09, 0.025, 0.04], [0, 0, s * 0.4]);
    U.mk(head, GEO.sphLo, mc(0x111111, { roughness: 0.2 }), [s * 0.065, 0.03, 0.2], 0.022); U.mk(head, GEO.sphLo, mc(0xffffff, { roughness: 0.1 }), [s * 0.07, 0.04, 0.218], 0.007);
  }
  for (const [x, z] of [[-0.15, 0.25], [0.15, 0.25], [-0.15, -0.25], [0.15, -0.25]]) {
    const lg = new THREE.Group(); lg.position.set(x, 0.58, z); g.add(lg);
    U.mk(lg, capsule(0.045, 0.42), face, [0, -0.28, 0]);
    P.legs.push(lg);
  }
  g.userData = P; return shadowAll(g);
};
Models.pig = function () {
  const g = new THREE.Group(), P = { legs: [], legRate: 9 };
  const pk = mc(0xf2a9a0, { roughness: 0.6 }), dk = mc(0x3a2020, { roughness: 0.3 });
  const body = new THREE.Group(); g.add(body); P.body = body;
  U.mk(body, GEO.sph, pk, [0, 0.52, 0], [0.36, 0.34, 0.52]);
  const head = new THREE.Group(); head.position.set(0, 0.6, 0.46); body.add(head); P.head = head;
  U.mk(head, GEO.sph, pk, [0, 0, 0.05], [0.24, 0.23, 0.22]);
  U.mk(head, GEO.cyl, mc(0xe8918a, { roughness: 0.5 }), [0, -0.04, 0.27], [0.1, 0.08, 0.08], [Math.PI / 2, 0, 0]);
  for (const s of [-1, 1]) {
    U.mk(head, GEO.sphLo, dk, [s * 0.035, -0.04, 0.31], [0.018, 0.025, 0.01]);
    U.mk(head, GEO.sphLo, dk, [s * 0.11, 0.08, 0.2], 0.028); U.mk(head, GEO.sphLo, mc(0xffffff, { roughness: 0.1 }), [s * 0.116, 0.088, 0.225], 0.008);
    U.mk(head, GEO.sphLo, mc(0xf07a80, { roughness: 0.6 }), [s * 0.15, -0.03, 0.17], [0.05, 0.03, 0.03]);
    U.mk(head, GEO.cone, pk, [s * 0.13, 0.2, 0.06], [0.07, 0.13, 0.03], [0.5, 0, -s * 0.3]);
  }
  for (const [x, z] of [[-0.18, 0.28], [0.18, 0.28], [-0.18, -0.28], [0.18, -0.28]]) {
    const lg = new THREE.Group(); lg.position.set(x, 0.3, z); g.add(lg);
    U.mk(lg, capsule(0.065, 0.16), pk, [0, -0.17, 0]);
    U.mk(lg, GEO.cyl, dk, [0, -0.28, 0], [0.065, 0.04, 0.065]);
    P.legs.push(lg);
  }
  const pt = new THREE.Group(); pt.position.set(0, 0.62, -0.52); body.add(pt); P.tail = pt;
  U.mk(pt, gcache('ptail', () => new THREE.TorusGeometry(0.05, 0.016, 6, 14, TAU * 0.8)), pk, [0, 0, -0.02], 1, [0, Math.PI / 2, 0]);
  g.userData = P; return shadowAll(g);
};
// ---- house pets ----
function petBase(body, headCol, legLen, P) {
  const g = new THREE.Group(), b = new THREE.Group(); g.add(b); P.body = b; return [g, b];
}
Models.dog = function () {
  const P = { legs: [], legRate: 11 }, fur = mc(0xc8955a, { roughness: 0.9 }), light = mc(0xf1dcc0, { roughness: 0.9 }), dk = mc(0x1a1412, { roughness: 0.3 });
  const [g, b] = petBase(null, null, null, P);
  U.mk(b, capsule(0.15, 0.4, 12), fur, [0, 0.42, 0], 1, [Math.PI / 2, 0, 0]);
  U.mk(b, GEO.sph, light, [0, 0.36, 0.12], [0.13, 0.12, 0.2]);
  const head = new THREE.Group(); head.position.set(0, 0.62, 0.3); b.add(head); P.head = head;
  U.mk(head, GEO.sph, fur, [0, 0, 0], [0.13, 0.13, 0.14]);
  U.mk(head, GEO.sph, light, [0, -0.04, 0.12], [0.07, 0.06, 0.1]);
  U.mk(head, GEO.sph, dk, [0, -0.01, 0.21], 0.028);
  for (const sd of [-1, 1]) {
    U.mk(head, GEO.sph, dk, [sd * 0.055, 0.04, 0.11], 0.022); U.mk(head, GEO.sphLo, mc(0xffffff, { roughness: 0.1 }), [sd * 0.058, 0.05, 0.128], 0.007);
    U.mk(head, GEO.sph, mc(0x8a5a32, { roughness: 0.9 }), [sd * 0.12, -0.02, -0.01], [0.03, 0.1, 0.06], [0, 0, sd * 0.25]);
  }
  U.mk(head, GEO.box, mc(0xe85a7a, { roughness: 0.5 }), [0, -0.09, 0.17], [0.04, 0.008, 0.05]);
  for (const [x, z] of [[-0.09, 0.18], [0.09, 0.18], [-0.09, -0.18], [0.09, -0.18]]) { const lg = new THREE.Group(); lg.position.set(x, 0.33, z); g.add(lg); U.mk(lg, capsule(0.045, 0.2), fur, [0, -0.15, 0]); U.mk(lg, GEO.sph, light, [0, -0.3, 0.02], [0.05, 0.03, 0.06]); P.legs.push(lg); }
  const tail = new THREE.Group(); tail.position.set(0, 0.5, -0.33); b.add(tail); P.tail = tail;
  U.mk(tail, capsule(0.03, 0.2), fur, [0, 0.1, -0.06], 1, [-0.6, 0, 0]);
  g.userData = P; return blobUnder(Models.compact(shadowAll(g)), 0.45);
};
Models.cat = function () {
  const P = { legs: [], legRate: 12 }, fur = mc(0xe39a4a, { roughness: 0.9 }), light = mc(0xfbe9d4, { roughness: 0.9 }), dk = mc(0x1a1412, { roughness: 0.3 });
  const [g, b] = petBase(null, null, null, P);
  U.mk(b, capsule(0.11, 0.32, 12), fur, [0, 0.3, 0], 1, [Math.PI / 2, 0, 0]);
  U.mk(b, GEO.sph, light, [0, 0.26, 0.1], [0.09, 0.08, 0.14]);
  const head = new THREE.Group(); head.position.set(0, 0.45, 0.24); b.add(head); P.head = head;
  U.mk(head, GEO.sph, fur, [0, 0, 0], [0.11, 0.1, 0.1]);
  U.mk(head, GEO.sph, light, [0, -0.035, 0.07], [0.05, 0.035, 0.04]);
  U.mk(head, GEO.sphLo, mc(0xe8798a), [0, -0.01, 0.1], 0.013);
  for (const sd of [-1, 1]) {
    U.mk(head, GEO.cone, fur, [sd * 0.06, 0.1, -0.01], [0.04, 0.08, 0.025], [0, 0, -sd * 0.2]);
    U.mk(head, GEO.sph, mc(0x6aa84f, { roughness: 0.15 }), [sd * 0.045, 0.02, 0.08], [0.02, 0.024, 0.012]);
    U.mk(head, GEO.sphLo, dk, [sd * 0.045, 0.02, 0.09], [0.008, 0.02, 0.006]);
  }
  for (const [x, z] of [[-0.06, 0.13], [0.06, 0.13], [-0.06, -0.13], [0.06, -0.13]]) { const lg = new THREE.Group(); lg.position.set(x, 0.22, z); g.add(lg); U.mk(lg, capsule(0.032, 0.14), fur, [0, -0.1, 0]); U.mk(lg, GEO.sph, light, [0, -0.2, 0.015], [0.035, 0.022, 0.045]); P.legs.push(lg); }
  const tail = new THREE.Group(); tail.position.set(0, 0.36, -0.25); b.add(tail); P.tail = tail;
  U.mk(tail, capsule(0.022, 0.3), fur, [0, 0.16, -0.04], 1, [-0.25, 0, 0]);
  g.userData = P; return blobUnder(Models.compact(shadowAll(g)), 0.32);
};
// soft dark contact shadow under feet / wheels (grounds objects even when the sun is behind clouds)
function blobUnder(o, rx, rz) {
  const m = new THREE.Mesh(gcache('blobG', () => new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2)), gcache('blobM', () => new THREE.MeshBasicMaterial({ map: T.blob, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })));
  m.scale.set(rx, 1, rz || rx); m.position.y = 0.025; m.renderOrder = 1; m.castShadow = false; m.receiveShadow = false; o.add(m); return o;
}
Models.chick = function () {
  const g = new THREE.Group(), y = mc(0xf7d94c, { roughness: 0.9 }), P = { legs: [], legRate: 18 };
  const body = new THREE.Group(); g.add(body); P.body = body;
  U.mk(body, GEO.sph, y, [0, 0.09, 0], [0.07, 0.065, 0.08]);
  const head = new THREE.Group(); head.position.set(0, 0.16, 0.05); body.add(head); P.head = head;
  U.mk(head, GEO.sph, y, [0, 0, 0], 0.05);
  U.mk(head, GEO.cone, mc(0xf28c1a), [0, -0.005, 0.055], [0.015, 0.03, 0.015], [Math.PI / 2, 0, 0]);
  for (const s of [-1, 1]) U.mk(head, GEO.sphLo, mc(0x111111, { roughness: 0.2 }), [s * 0.025, 0.012, 0.04], 0.009);
  for (const s of [-1, 1]) { const lg = new THREE.Group(); lg.position.set(s * 0.025, 0.04, 0); g.add(lg); U.mk(lg, GEO.cylLo, mc(0xf28c1a), [0, -0.02, 0], [0.006, 0.04, 0.006]); P.legs.push(lg); }
  g.userData = P; return Models.compact(shadowAll(g));
};
Models.animal = function (type) {
  const sz = { chicken: [0.3, 0.35], cow: [0.65, 1.25], sheep: [0.5, 0.75], pig: [0.48, 0.7] }[type];
  return blobUnder(Models.compact(type === 'chicken' ? Models.chicken(Math.random() < 0.4) : Models[type]()), sz[0], sz[1]);
};
Models.animAnimal = function (a, dt, speed, mode) {
  const P = a.userData; P.t = (P.t || 0) + dt; P.ph = (P.ph || 0) + dt * speed * P.legRate;
  const amp = Math.min(1, speed * 1.6);
  P.legs.forEach((l, i) => { const s = (i % 2 === 0 ? 1 : -1) * (i < 2 ? 1 : -1); l.rotation.x = Math.sin(P.ph) * 0.6 * amp * s; });
  let hx = Math.sin(P.ph * 2) * 0.05 * amp;
  if (mode === 'graze') hx += 0.75 + Math.sin(P.t * 3) * 0.08;
  else if (mode === 'peck') hx += Math.max(0, Math.sin(P.t * 9)) * 0.9;
  if (mode === 'sleep') hx = 0.55;
  P.head.rotation.x = U.lerp(P.head.rotation.x, hx, Math.min(1, dt * 6));
  P.body.position.y = Math.abs(Math.sin(P.ph)) * 0.03 * amp;
  if (P.tail) P.tail.rotation.z = Math.sin(P.t * (mode === 'happy' ? 18 : 3)) * (mode === 'happy' ? 0.6 : 0.25);
  const lie = P.lie = U.lerp(P.lie || 0, mode === 'sleep' ? 1 : 0, Math.min(1, dt * 2));
  if (lie > 0.01) P.legs.forEach((l, i) => { l.rotation.x = U.lerp(l.rotation.x, (i < 2 ? -1 : 1) * 1.3, lie); });
};

// ---------- Crops (procedural, per growth stage) ----------
Models.cropOne = function (type, stage, seed = 1) {
  const g = new THREE.Group(); const R = U.rng(seed * 9973 + stage * 31 + 7);
  if (stage === 0) {
    U.mk(g, GEO.sphLo, mc(0x4a3220, { roughness: 1 }), [0, 0, 0], [0.2, 0.06, 0.2]);
    for (let i = 0; i < 3; i++) U.mk(g, GEO.sphLo, mc(0xd9c48a), [(R() - 0.5) * 0.15, 0.05, (R() - 0.5) * 0.15], 0.018);
    return g;
  }
  const f = stage === 1 ? 0.4 : stage === 2 ? 0.75 : 1;
  const LG = cropMat(0x4f9a2e), LL = cropMat(0x78b843), LD = cropMat(0x356e22), ST = mc(0x5b8a32, { roughness: 0.8 });
  const leafC = (gg, mat, a, t, l, w, y, r0) => leafAt(gg, mat, a, t, l, w, y, r0, GEO.leaf2);
  const ros = (n, mat, len, wid, tilt, y = 0, r0 = 0) => { for (let i = 0; i < n; i++) leafC(g, mat, i / n * TAU + R() * 0.4, tilt + (R() - 0.5) * 0.2, len * (0.85 + R() * 0.3), wid * 1.3, y, r0); };
  switch (type) {
    case 'carrot':
      ros(stage === 1 ? 4 : 8, LG, 0.42 * f, 0.035, 1.05, 0.02);
      if (stage === 3) U.mk(g, GEO.cone, mc(0xe8741e, { roughness: 0.55 }), [0, 0.03, 0], [0.065, 0.15, 0.065], [Math.PI, 0, 0]);
      break;
    case 'cabbage':
      if (stage < 3) ros(stage === 1 ? 4 : 7, LL, 0.28 * f + 0.04, 0.13 * f, 0.45, 0.02);
      else {
        ros(8, LG, 0.36, 0.17, 0.3, 0.02);
        U.mk(g, GEO.sph, mc(0xb3da74, { roughness: 0.55 }), [0, 0.15, 0], [0.17, 0.15, 0.17]);
        ros(6, mc(0x96c95c, { roughness: 0.6 }), 0.2, 0.12, 0.95, 0.1);
      }
      break;
    case 'tomato': case 'eggplant': case 'chili': {
      const hgt = (type === 'tomato' ? 0.9 : type === 'eggplant' ? 0.65 : 0.5) * f;
      U.mk(g, GEO.cylLo, ST, [0, hgt / 2, 0], [0.018, hgt, 0.018]);
      if (type === 'tomato' && stage >= 2) U.mk(g, GEO.cylLo, mc(0x9a7a50), [0.09, 0.5, 0], [0.014, 1.0, 0.014]);
      const tiers = stage === 1 ? 2 : 4;
      for (let t = 0; t < tiers; t++) ros(4, t % 2 ? LG : LD, (type === 'chili' ? 0.17 : 0.24) * f + 0.03, 0.07 * f + 0.02, 0.35, hgt * (0.25 + 0.75 * t / tiers));
      if (stage >= 2) {
        const N = stage === 3 ? 7 : 4;
        for (let i = 0; i < N; i++) {
          const a = R() * TAU, rr = 0.08 + R() * 0.1, y = hgt * (0.35 + R() * 0.5), x = Math.cos(a) * rr, z = Math.sin(a) * rr;
          if (type === 'tomato') U.mk(g, GEO.sph, mc(stage === 3 ? (R() < 0.85 ? 0xd8261c : 0xf08a20) : 0x7cb342, { roughness: 0.3 }), [x, y, z], stage === 3 ? 0.055 : 0.035);
          else if (type === 'eggplant') {
            const s = stage === 3 ? 1 : 0.5;
            U.mk(g, GEO.sph, mc(stage === 3 ? 0x4a1f5c : 0x8a6a9a, { roughness: 0.22 }), [x, y - 0.06 * s, z], [0.045 * s, 0.12 * s, 0.045 * s]);
            U.mk(g, GEO.cone, LD, [x, y + 0.05 * s, z], [0.04 * s, 0.05 * s, 0.04 * s]);
          } else U.mk(g, GEO.cone, mc(stage === 3 ? (R() < 0.8 ? 0xd61f1f : 0xf07a1a) : 0x5aa83a, { roughness: 0.3 }), [x, y, z], [0.016, 0.09, 0.016], [Math.PI + (R() - 0.5) * 0.6, 0, (R() - 0.5) * 0.6]);
        }
      }
      break;
    }
    case 'corn': {
      const hgt = 1.7 * f;
      U.mk(g, GEO.cylLo, mc(0x7aa83c), [0, hgt / 2, 0], [0.03, hgt, 0.03]);
      const n = stage === 1 ? 3 : 7;
      for (let i = 0; i < n; i++) leafC(g, i % 2 ? LG : LL, i * 2.4, 0.35 - i * 0.03, 0.6 * f + 0.1, 0.08, hgt * (0.08 + 0.8 * i / n));
      if (stage === 3) {
        U.mk(g, GEO.cone, mc(0xd8c070), [0, hgt + 0.1, 0], [0.05, 0.25, 0.05]);
        for (const s of [1, -1]) {
          const e = new THREE.Group(); e.position.set(0.06 * s, hgt * 0.55, 0); e.rotation.z = -0.35 * s; g.add(e);
          U.mk(e, GEO.sph, mc(0xf2c94c, { roughness: 0.5 }), [0, 0.1, 0], [0.05, 0.13, 0.05]);
          U.mk(e, GEO.sph, LL, [0, 0.07, 0], [0.058, 0.12, 0.058]);
        }
      }
      break;
    }
    case 'strawberry':
      ros(stage === 1 ? 4 : 7, LG, 0.16 * f + 0.05, 0.08 * f + 0.02, 0.3, 0.02);
      if (stage === 2) for (let i = 0; i < 4; i++) { const a = R() * TAU; U.mk(g, GEO.sphLo, mc(0xffffff, { roughness: 0.6 }), [Math.cos(a) * 0.12, 0.1, Math.sin(a) * 0.12], 0.025); }
      if (stage === 3) for (let i = 0; i < 6; i++) {
        const a = R() * TAU, rr = 0.12 + R() * 0.1;
        U.mk(g, GEO.cone, mc(0xe3262f, { roughness: 0.3 }), [Math.cos(a) * rr, 0.06, Math.sin(a) * rr], [0.035, 0.07, 0.035], [Math.PI, 0, 0]);
        U.mk(g, GEO.sphLo, LG, [Math.cos(a) * rr, 0.1, Math.sin(a) * rr], [0.03, 0.01, 0.03]);
      }
      break;
    case 'pumpkin': case 'watermelon': {
      ros(stage === 1 ? 3 : 6, LG, 0.3 * f + 0.1, 0.16 * f + 0.04, 0.12, 0.02, 0.1 * f);
      if (stage >= 2) {
        const s = stage === 3 ? 1 : 0.45;
        if (type === 'pumpkin') {
          const pm = mc(stage === 3 ? 0xe8781c : 0x8aa83a, { roughness: 0.5 });
          for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; U.mk(g, GEO.sph, pm, [Math.cos(a) * 0.08 * s, 0.17 * s, Math.sin(a) * 0.08 * s], [0.15 * s, 0.16 * s, 0.15 * s], [0, -a, 0]); }
          U.mk(g, GEO.cylLo, mc(0x6b5a2a), [0, 0.34 * s, 0], [0.025, 0.1, 0.025], [0.2, 0, 0]);
        } else U.mk(g, GEO.sph, texMat('melon', 0xffffff, { roughness: 0.35 }), [0.05, 0.19 * s, 0], [0.22 * s, 0.3 * s, 0.2 * s], [Math.PI / 2, 0, 0]);
      }
      break;
    }
    case 'sunflower': {
      const hgt = 1.6 * f;
      U.mk(g, GEO.cylLo, ST, [0, hgt / 2, 0], [0.028, hgt, 0.028]);
      for (let i = 0; i < (stage === 1 ? 2 : 5); i++) leafC(g, LG, i * 2.3, 0.25, 0.3 * f + 0.05, 0.14 * f + 0.03, hgt * (0.15 + 0.15 * i));
      if (stage === 2) U.mk(g, GEO.sph, LG, [0, hgt, 0], 0.07);
      if (stage === 3) {
        const hd = new THREE.Group(); hd.position.set(0, hgt, 0.06); hd.rotation.x = -0.35; g.add(hd);
        U.mk(hd, GEO.cyl, mc(0x5a3518, { roughness: 0.9 }), [0, 0, 0], [0.14, 0.06, 0.14], [Math.PI / 2, 0, 0]);
        const pm = mc(0xf7c21a, { roughness: 0.6 });
        for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; U.mk(hd, GEO.leaf, pm, [Math.cos(a) * 0.2, Math.sin(a) * 0.2, 0], [0.04, 0.1, 0.012], [0, 0, a - Math.PI / 2]); }
      }
      break;
    }
    case 'pineapple':
      ros(10, cropMat(0x5f8f4a), 0.45 * f + 0.05, 0.035, 0.6, 0.02);
      if (stage === 3) {
        U.mk(g, GEO.sph, texMat('pine', 0xffffff, { roughness: 0.6 }), [0, 0.24, 0], [0.11, 0.17, 0.11]);
        for (let i = 0; i < 7; i++) leafC(g, cropMat(0x5f8f4a), i / 7 * TAU, 1.15, 0.2, 0.035, 0.38);
      }
      break;
  }
  return g;
};

// Crop leaf materials: double-sided (thin leaf shapes) and swaying gently in the wind
function cropMat(hex) {
  return gcache('cropM' + hex, () => {
    const m = U.mat(hex, { roughness: 0.7 }); m.side = THREE.DoubleSide; addSway(m, 0.05, 0.12);
    World.folMats.splice(World.folMats.indexOf(m), 1); // keep its own green: the season tint is for white-based foliage
    return m;
  });
}
// A planted bed: several plants spaced along the three soil ridges (big vines get one, corn and sunflowers a row)
const CROP_LAYOUT = {
  carrot: [[-0.45, -0.55], [0.45, -0.55], [-0.45, 0], [0.45, 0], [-0.45, 0.55], [0.45, 0.55]],
  cabbage: [[0.1, -0.55], [-0.1, 0], [0.1, 0.55]], strawberry: [[-0.1, -0.55], [0.15, 0], [-0.1, 0.55]],
  chili: [[0.1, -0.55], [-0.1, 0], [0.1, 0.55]], pineapple: [[0, -0.45], [0, 0.45]],
  tomato: [[0, -0.45], [0, 0.45]], eggplant: [[0, -0.45], [0, 0.45]],
  corn: [[-0.4, -0.55], [0.4, 0], [-0.4, 0.55]], sunflower: [[0, -0.45], [0, 0.45]],
};
Models.crop = function (type, stage, seed = 1) {
  const lay = CROP_LAYOUT[type] || [[0, 0]], g = new THREE.Group(), many = lay.length > 1;
  lay.forEach(([x, z], k) => {
    const p = Models.cropOne(type, stage, seed * 7 + k); p.position.set(x, 0, z); p.rotation.y = (seed * 1.3 + k * 2.1) % TAU;
    if (many) p.scale.setScalar(lay.length >= 6 ? 0.72 : 0.85); g.add(p);
  });
  return g;
};
Models.fruitTree = function (type, stage, seed = 1) {
  const g = new THREE.Group(); const R = U.rng(seed * 131 + 5);
  const trunk = mc(0x6b4a2e, { roughness: 0.95 }), fol = mc(type === 'mango' ? 0x3f7d2a : 0x4c8c32, { roughness: 0.8 });
  if (stage === 0) {
    U.mk(g, GEO.cylLo, trunk, [0, 0.3, 0], [0.025, 0.6, 0.025]);
    for (let i = 0; i < 4; i++) leafAt(g, fol, i * 1.6, 0.4, 0.2, 0.07, 0.55);
    return g;
  }
  const s = stage === 1 ? 0.5 : 1;
  U.mk(g, gcache('ftrunk', () => new THREE.CylinderGeometry(0.12, 0.2, 1, 9)), trunk, [0, 0.9 * s, 0], [s, 1.8 * s, s]);
  const cy = 2.2 * s;
  const blobs = [[0, 0, 0, 1], [0.6, -0.15, 0.2, 0.75], [-0.55, -0.1, -0.2, 0.75], [0.1, 0.35, -0.5, 0.7], [-0.15, 0.3, 0.5, 0.7]];
  for (const [x, y, z, r] of blobs) U.mk(g, GEO.sph, fol, [x * s, cy + y * s, z * s], r * s);
  if (stage === 3) {
    const fm = mc(type === 'mango' ? 0xf2b233 : 0xf28c1a, { roughness: 0.4 });
    for (let i = 0; i < 14; i++) {
      const a = R() * TAU, e = -0.2 + R() * 0.9, rr = 1.02;
      U.mk(g, GEO.sph, fm, [Math.cos(a) * Math.cos(e) * rr, cy + Math.sin(e) * rr * 0.8 - 0.1, Math.sin(a) * Math.cos(e) * rr], type === 'mango' ? [0.08, 0.11, 0.08] : 0.085);
    }
  }
  return g;
};

// ---------- Sprinkler ----------
Models.sprinkler = function (pro) {
  const g = new THREE.Group();
  const metal = mc(pro ? 0xc9a24a : 0xa8b0b5, { roughness: 0.3, metalness: 0.35 });
  U.mk(g, GEO.cyl, mc(0x2f3a2f), [0, 0.03, 0], [0.16, 0.06, 0.16]);
  U.mk(g, GEO.cyl, metal, [0, 0.3, 0], [0.028, 0.55, 0.028]);
  const head = new THREE.Group(); head.position.y = 0.6; g.add(head);
  U.mk(head, GEO.cyl, metal, [0, 0, 0], [0.06, 0.08, 0.06]);
  for (const s of [-1, 1]) U.mk(head, GEO.cyl, metal, [s * 0.1, 0.02, 0], [0.015, 0.2, 0.015], [0, 0, Math.PI / 2 + s * 0.3]);
  if (pro) U.mk(head, GEO.sph, mc(0x3a7bd5, { roughness: 0.3 }), [0, 0.07, 0], 0.05);
  return { g: shadowAll(g), head };
};

// ---------- Vehicles (rounded extruded bodies) ----------
Models.car = function (type, color) {
  const S = CARS[type]; const g = new THREE.Group();
  const paint = U.mat(color ?? S.color, { roughness: 0.22, metalness: 0.45 });
  const glass = mc(0x1b2833, { roughness: 0.05, metalness: 0.1 });
  const chrome = mc(0xd5d9dc, { roughness: 0.2, metalness: 0.4 });
  const black = mc(0x1e1e1e, { roughness: 0.7 });
  const sp = S.kind === 'sports';
  const L = sp ? 4.3 : 5.0, W = sp ? 1.95 : 1.95;
  const extrude = (shape, depth, bevel) => {
    const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: !!bevel, bevelThickness: bevel || 0, bevelSize: bevel || 0, bevelSegments: 3, steps: 1, curveSegments: 10 });
    geo.translate(0, 0, -depth / 2); geo.rotateY(-Math.PI / 2); return geo;
  };
  const sh = new THREE.Shape();
  let cab, win, ws, rw;
  if (!sp) {
    sh.moveTo(-L / 2, 0.45); sh.lineTo(L / 2 - 0.2, 0.45); sh.quadraticCurveTo(L / 2, 0.45, L / 2, 0.65);
    sh.lineTo(L / 2, 0.92); sh.quadraticCurveTo(L / 2, 1.08, L / 2 - 0.3, 1.1); sh.lineTo(-L / 2 + 0.1, 1.12);
    sh.quadraticCurveTo(-L / 2, 1.12, -L / 2, 1.0); sh.lineTo(-L / 2, 0.45);
    cab = [[-0.65, 1.08], [0.95, 1.08], [0.38, 1.78], [-0.6, 1.8]];
    win = [[-0.52, 1.17], [0.8, 1.17], [0.35, 1.7], [-0.5, 1.71]];
    ws = [[0.95, 1.1], [0.38, 1.78]]; rw = [[-0.65, 1.1], [-0.6, 1.8]];
  } else {
    sh.moveTo(-L / 2, 0.32); sh.lineTo(L / 2 - 0.35, 0.32); sh.quadraticCurveTo(L / 2, 0.32, L / 2, 0.5);
    sh.lineTo(L / 2 - 0.1, 0.64); sh.lineTo(-L / 2 + 0.25, 0.84); sh.quadraticCurveTo(-L / 2, 0.86, -L / 2, 0.7); sh.lineTo(-L / 2, 0.32);
    cab = [[-1.35, 0.8], [0.75, 0.66], [0.05, 1.18], [-0.95, 1.2]];
    win = [[-1.2, 0.86], [0.6, 0.74], [0.04, 1.12], [-0.9, 1.13]];
    ws = [[0.75, 0.68], [0.05, 1.18]]; rw = [[-1.35, 0.82], [-0.95, 1.2]];
  }
  U.mk(g, extrude(sh, W - 0.16, 0.08), paint);
  const poly = pts => { const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]); s.closePath(); return s; };
  const cw = W - 0.34;
  U.mk(g, extrude(poly(cab), cw - 0.12, 0.06), paint);
  U.mk(g, extrude(poly(win), cw + 0.02, 0), glass);
  const pane = (a, b, front) => {
    const dz = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dz, dy);
    const nz = (front ? dy : -dy) / len, ny = (front ? -dz : dz) / len;
    const m = U.mk(g, GEO.box, glass, [0, (a[1] + b[1]) / 2 + ny * 0.07, (a[0] + b[0]) / 2 + nz * 0.07], [cw - 0.15, len * 0.86, 0.02]);
    m.rotation.x = Math.atan2(dz, dy) * (front ? 1 : 1);
  };
  pane(ws[0], ws[1], true); pane(rw[0], rw[1], false);
  const lightM = U.mat(0xfff6d8, { emissive: 0xfff2c0, roughness: 0.2 }); lightM.emissiveIntensity = 0.1;
  const tailM = U.mat(0xb81d1d, { emissive: 0xff2020, roughness: 0.3 }); tailM.emissiveIntensity = 0.2;
  const fy = sp ? 0.5 : 0.85, ry = sp ? 0.62 : 0.95;
  for (const s of [-1, 1]) {
    U.mk(g, GEO.sph, lightM, [s * (W / 2 - 0.32), fy, L / 2 + 0.03], [0.17, 0.08, 0.06]);
    U.mk(g, GEO.box, tailM, [s * (W / 2 - 0.2), ry, -L / 2 - 0.07], [0.25, 0.12, 0.04]);
    U.mk(g, GEO.sph, black, [s * (cw / 2 + 0.12), sp ? 0.95 : 1.4, sp ? 0.55 : 0.75], [0.04, 0.07, 0.1]);
  }
  U.mk(g, GEO.box, black, [0, sp ? 0.42 : 0.72, L / 2 + 0.06], [W * 0.42, sp ? 0.08 : 0.22, 0.04]);
  for (const z of [L / 2 + 0.1, -L / 2 - 0.1]) U.mk(g, capsule(0.07, W - 0.3), sp ? black : chrome, [0, sp ? 0.36 : 0.5, z], 1, [0, 0, Math.PI / 2]);
  if (!sp) U.mk(g, GEO.box, mc(0x2a2a2a, { roughness: 0.9 }), [0, 1.165, -1.5], [W - 0.32, 0.02, 1.7]);
  else {
    U.mk(g, GEO.box, paint, [0, 1.0, -L / 2 + 0.2], [W - 0.2, 0.05, 0.3]);
    for (const s of [-1, 1]) U.mk(g, GEO.box, black, [s * 0.6, 0.9, -L / 2 + 0.2], [0.05, 0.18, 0.08]);
  }
  const r = sp ? 0.36 : 0.43, wz = sp ? 1.38 : 1.62, wheels = [], steer = [];
  const tire = gcache('tire' + r, () => new THREE.CylinderGeometry(r, r, 0.28, 24).rotateZ(Math.PI / 2));
  const rim = gcache('rim' + r, () => new THREE.CylinderGeometry(r * 0.62, r * 0.62, 0.29, 16).rotateZ(Math.PI / 2));
  for (const z of [wz, -wz]) for (const s of [-1, 1]) {
    const st = new THREE.Group(); st.position.set(s * (W / 2 - 0.06), r, z); g.add(st);
    const wh = new THREE.Group(); st.add(wh);
    U.mk(wh, tire, black); U.mk(wh, rim, chrome);
    U.mk(wh, GEO.box, mc(0x8a8f94, { metalness: 0.4, roughness: 0.3 }), [0, 0, 0], [0.3, r * 0.9, 0.08]);
    wheels.push(wh); if (z > 0) steer.push(st);
  }
  Models.compact(shadowAll(g)); blobUnder(g, W / 2 + 0.25, L / 2 + 0.3);
  const glowM = new THREE.SpriteMaterial({ map: T.glow, color: 0xfff1c8, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  for (const sd of [-1, 1]) { const sp = new THREE.Sprite(glowM); sp.scale.setScalar(1.6); sp.position.set(sd * (W / 2 - 0.32), fy, L / 2 + 0.25); g.add(sp); }
  return { g, wheels, steer, lightM, tailM, r, glowM };
};
