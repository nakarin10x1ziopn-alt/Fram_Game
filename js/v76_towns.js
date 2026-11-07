// v76_towns.js: fixes and colour for the far towns (every town outside the village map)
//  - colour: the lawns follow the village grass (same tint, same day and night changes), foliage and facades get the richer 3D colour of the village;
//    asphalt, glass, metal, signs and lamps are left as they are, so every fine detail stays natural
//  - residents that were placed on top of a street tree, a lamp post or a shop wall step out onto free pavement
V23.add('v76_towns', () => {
  if (typeof Town2 === 'undefined' || !Town2.areas) return;
  const cl = x => Math.max(0, Math.min(1, x));
  const sat = (c, k, lift = 1) => { const l = c.r * 0.2126 + c.g * 0.7152 + c.b * 0.0722; c.r = cl((l + (c.r - l) * k) * lift); c.g = cl((l + (c.g - l) * k) * lift); c.b = cl((l + (c.b - l) * k) * lift); return c; };
  const done = new WeakSet(), lawns = []; let lawnTex = null;
  function retint(A) {
    if (!A || !A.g || A._tc76) return; A._tc76 = 1;
    const mats = new Set();
    A.g.traverse(o => { const m = o.material; if (m) for (const x of Array.isArray(m) ? m : [m]) mats.add(x); });
    for (const m of mats) {
      if (done.has(m) || !m.color || m.type !== 'MeshStandardMaterial') continue; done.add(m);
      if (m.map && typeof T !== 'undefined' && m.map === T.grass) {   // lawn: follows the village grass. The village texture repeats ~3.5 m per tile; the old 1 m tiles blurred to a flat grey-green
        m.userData.tint76 = m.color.clone(); lawns.push(m);
        if (!lawnTex) { lawnTex = T.grass.clone(); lawnTex.repeat.set(52, 52); lawnTex.needsUpdate = true; }
        m.map = lawnTex; m.needsUpdate = true; continue;
      }
      if (m.transparent || m.metalness > 0.3 || m.emissiveIntensity > 0.1) continue;                                                  // glass, metal, lights: untouched
      const c = m.color, green = !m.map && c.g > c.r * 1.05 && c.g > c.b * 1.05;
      if (green) sat(c, 1.12, 1.05); else sat(c, 1.06);                                                                                  // leaves greener, facades and roofs a little richer
    }
    follow();
  }
  // lawns: the village terrain is a pale texture tinted by per-vertex greens; a town lawn gets that same average green (and follows it through the day),
  // with a faint hint of the town's own tone
  let vc = null;
  const villageGreen = () => {
    if (vc) return vc; vc = [0.25, 0.358, 0.103];
    try { let mesh = null; G.scene.traverse(o => { if (!mesh && o.material === World.terrainMat) mesh = o; }); const ca = mesh.geometry.attributes.color; let r = 0, g = 0, b = 0, n = ca.count; for (let i = 0; i < n; i++) { r += ca.getX(i); g += ca.getY(i); b += ca.getZ(i); } vc = [r / n, g / n, b / n]; } catch (e) { }
    return vc;
  };
  const tmp = new THREE.Color();
  const follow = () => { const v = villageGreen(), t = World.terrainMat.color; tmp.setRGB(t.r * v[0], t.g * v[1], t.b * v[2]); for (const m of lawns) m.color.copy(tmp).lerp(m.userData.tint76, 0.2); };
  const _us = updateSky;
  updateSky = function () { _us.apply(this, arguments); if (lawns.length) follow(); };

  // residents: never inside a collider
  const fixResidents = () => {
    for (const n of G.npcs) {
      if (!n.townRes || n._fx76) continue; n._fx76 = 1;
      const p = { x: n.x, z: n.z };
      for (let k = 0; k < 4; k++) Col.push(p, 0.75);
      if (Math.hypot(p.x - n.x, p.z - n.z) < 0.05) continue;
      n.x = n.tx = p.x; n.z = n.tz = p.z; if (n.circ) { n.circ.x = p.x; n.circ.z = p.z; }
      if (n.obj) n.obj.position.set(p.x, n.obj.position.y, p.z);
    }
  };
  const all = () => { for (const k in Town2.areas) { const A = Town2.areas[k]; if (A && A.g) retint(A); } fixResidents(); };
  const _go = Town2.go.bind(Town2);
  Town2.go = function (k, fee) { const r = _go(k, fee); setTimeout(all, 700); setTimeout(all, 3500); return r; };
  all(); setTimeout(all, 1500);
  window.Towns76 = { retint, fixResidents, all, lawns };
});
