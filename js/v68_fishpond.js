// v68_fishpond.js: the fish farm pond comes alive
//  - every fish you stock is a real fish swimming in the pond: they grow with the days, wander, avoid the walkway, and the pond ripples now and then
//  - stocking drops the fish in from the end of the walkway; feeding throws pellets on the water and the fish swim over to eat them; catching empties the pond with splashes
//  - stocking and feeding only work from the end of the walkway (see farm2.js / world.js)
V23.add('v68_fishpond', () => {
  if (typeof Farm2 === 'undefined' || !World.outdoor || !World.update) return;
  const CX = 30, CZ = 20, MAXF = 40, END = { x: 29.45, z: 20 };
  const shoreR = a => 6 + Math.sin(a * 3) * 0.6 + Math.cos(a * 5) * 0.4;
  const inWater = (x, z, m) => { const dx = x - CX, dz = z - CZ; return Math.hypot(dx, dz) < shoreR(Math.atan2(dz, dx)) - m && !(x < 29.8 && Math.abs(z - CZ) < 1.5); };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const group = new THREE.Group(); group.userData.noCol = true; World.outdoor.add(group);

  // ---- one merged, vertex-coloured fish model (tilapia-like), two colour variants ----
  const part = (geo, p, s, rot, col) => { const g = geo.clone(), m = new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...(rot || [0, 0, 0]))), new THREE.Vector3(...s)); g.applyMatrix4(m); const ng = g.toNonIndexed(), n = ng.attributes.position.count, c = new Float32Array(n * 3), k = new THREE.Color(col).convertSRGBToLinear(); for (let i = 0; i < n; i++) c.set([k.r, k.g, k.b], i * 3); ng.setAttribute('color', new THREE.BufferAttribute(c, 3)); ng.deleteAttribute('uv'); return ng; };
  const merge = list => { const pos = [], nor = [], col = []; for (const g of list) { pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array); col.push(...g.attributes.color.array); } const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); m.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); return m; };
  const SPH = new THREE.SphereGeometry(1, 10, 8), CONE = new THREE.ConeGeometry(1, 1, 8);
  const fishGeo = (back, belly, fin) => merge([
    part(SPH, [0, 0, 0], [0.12, 0.15, 0.4], null, back), part(SPH, [0, -0.05, 0.02], [0.1, 0.1, 0.36], null, belly), part(SPH, [0, 0, 0.3], [0.09, 0.11, 0.17], null, back),
    part(CONE, [0, 0.01, -0.5], [0.02, 0.2, 0.15], [Math.PI / 2, 0, 0], fin), part(CONE, [0, 0.16, -0.02], [0.014, 0.12, 0.2], [0, 0, 0], fin), part(CONE, [0, -0.13, -0.18], [0.012, 0.07, 0.09], [Math.PI, 0, 0], fin),
    part(CONE, [0.1, -0.04, 0.12], [0.012, 0.1, 0.07], [Math.PI / 2, 0, -1.1], fin), part(CONE, [-0.1, -0.04, 0.12], [0.012, 0.1, 0.07], [Math.PI / 2, 0, 1.1], fin),
    part(SPH, [0.065, 0.04, 0.36], [0.025, 0.025, 0.025], null, 0x111111), part(SPH, [-0.065, 0.04, 0.36], [0.025, 0.025, 0.025], null, 0x111111),
  ]);
  const GEOS = [fishGeo(0x8fa39a, 0xe8e2d0, 0x6f8780), fishGeo(0xe08a6c, 0xf6dcc2, 0xc96a55)];
  const FMAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, metalness: 0.2 });

  // ---- ripples and pellets ----
  const rippleGeo = new THREE.RingGeometry(0.1, 0.15, 28); rippleGeo.rotateX(-Math.PI / 2);
  const ripples = [], pellets = [], fish = [];
  const ripple = (x, z, big) => { let r = ripples.find(q => !q.on); if (!r) { if (ripples.length >= 28) return; const m = new THREE.Mesh(rippleGeo, new THREE.MeshBasicMaterial({ color: 0xe6f6ff, transparent: true, opacity: 0, depthWrite: false })); m.visible = false; group.add(m); r = { m, on: false, t: 0, big: 1 }; ripples.push(r); } r.on = true; r.t = 0; r.big = big ? 1.8 : 1; r.m.position.set(x, 0.075, z); r.m.visible = true; };
  const pelM = new THREE.MeshStandardMaterial({ color: 0xc89b5a, roughness: 0.9 }), pelG = new THREE.SphereGeometry(0.05, 6, 5);
  const feedBurst = () => { for (let i = 0; i < 16; i++) { const m = new THREE.Mesh(pelG, pelM); const x = rnd(30.0, 32.2), z = rnd(18.6, 21.4); m.position.set(x, 0.09, z); group.add(m); pellets.push({ m, x, z, t: 0, life: rnd(7, 11) }); ripple(x, z, false); } };

  const spawn = (fromEnd) => {
    const i = fish.length, m = new THREE.Mesh(GEOS[Math.random() < 0.3 ? 1 : 0], FMAT); m.castShadow = false; group.add(m);
    const f = { m, x: fromEnd ? END.x + rnd(0, 0.5) : 0, z: fromEnd ? END.z + rnd(-0.6, 0.6) : 0, a: fromEnd ? rnd(-0.6, 0.6) + Math.PI / 2 * 1 : rnd(0, 6.28), sp: fromEnd ? 1.8 : 0.5, tx: 0, tz: 0, w: 0, ph: rnd(0, 6.28), k: rnd(0.9, 1.12), burst: fromEnd ? 1.4 : 0 };
    // heading is measured from +z towards +x: east is pi/2
    if (!fromEnd) for (let k = 0; k < 20; k++) { const x = CX + rnd(-5, 5), z = CZ + rnd(-5, 5); if (inWater(x, z, 1.0)) { f.x = x; f.z = z; break; } }
    if (!f.x) { f.x = CX + 2; f.z = CZ + 2; }
    f.tx = f.x; f.tz = f.z; fish.push(f); if (fromEnd) ripple(f.x, f.z, true); return f;
  };
  const wander = f => { for (let k = 0; k < 14; k++) { const x = CX + rnd(-5.6, 5.6), z = CZ + rnd(-5.6, 5.6); if (inWater(x, z, 0.9)) { f.tx = x; f.tz = z; f.w = rnd(2.5, 6); return; } } f.tx = CX; f.tz = CZ + 2; f.w = 3; };

  let lastFed = Farm2.st().pond.fed, lastN = -1, acc = 0, near = true;
  const step = dt => {
    const p = Farm2.st().pond, n = Math.min(MAXF, p.n | 0), t = performance.now() / 1000;
    const P = G.player && G.player.pos; if (P) near = Math.hypot(P.x - CX, P.z - CZ) < 80; group.visible = near && !G.inside;
    if (!near) return;
    // fish count follows the pond
    if (lastN < 0) { for (let i = 0; i < n; i++) spawn(false); lastN = n; }
    else if (n !== lastN) { if (n > lastN) for (let i = lastN; i < n; i++) spawn(true); else { while (fish.length > n) { const f = fish.pop(); ripple(f.x, f.z, true); group.remove(f.m); } } lastN = n; }
    // feeding
    if (p.fed !== lastFed) { if (p.fed === S.day && n > 0) feedBurst(); lastFed = p.fed; }
    const hungry = p.fed !== S.day, size = 0.5 + 0.5 * Math.min(1, (p.g || 0) / 3);
    // pellets float, then sink away
    for (let i = pellets.length - 1; i >= 0; i--) { const q = pellets[i]; q.t += dt; q.m.position.y = 0.085 + Math.sin(t * 3 + i) * 0.01; q.m.position.x = q.x + Math.sin(t * 0.7 + i) * 0.05; if (q.t > q.life) { group.remove(q.m); pellets.splice(i, 1); } }
    for (const f of fish) {
      // target: the nearest pellet if there is one, otherwise wander
      let tgt = null, bd = 7; for (const q of pellets) { const d = Math.hypot(q.x - f.x, q.z - f.z); if (d < bd) { bd = d; tgt = q; } }
      if (tgt) { f.tx = tgt.x; f.tz = tgt.z; f.w = 1; } else { f.w -= dt; if (f.w <= 0 || Math.hypot(f.tx - f.x, f.tz - f.z) < 0.5) wander(f); }
      const want = Math.atan2(f.tx - f.x, f.tz - f.z); let da = want - f.a; da = Math.atan2(Math.sin(da), Math.cos(da));
      f.a += Math.max(-dt * 2.4, Math.min(dt * 2.4, da));
      const top = (tgt ? 1.1 : hungry ? 0.45 : 0.7) * f.k; f.burst = Math.max(0, f.burst - dt); f.sp += ((f.burst > 0 ? 1.8 : top) - f.sp) * Math.min(1, dt * 2);
      let nx = f.x + Math.sin(f.a) * f.sp * dt, nz = f.z + Math.cos(f.a) * f.sp * dt;
      if (!inWater(nx, nz, 0.35) && !(f.burst > 0)) { f.a += Math.PI * 0.6; wander(f); nx = f.x; nz = f.z; }
      f.x = nx; f.z = nz;
      if (tgt && Math.hypot(tgt.x - f.x, tgt.z - f.z) < 0.35) { ripple(tgt.x, tgt.z, false); group.remove(tgt.m); pellets.splice(pellets.indexOf(tgt), 1); }
      const sw = Math.sin(t * (6 + f.sp * 3) + f.ph) * 0.14 * (0.4 + f.sp);
      f.m.position.set(f.x, 0.075 + Math.sin(t * 1.7 + f.ph) * 0.012, f.z); f.m.rotation.set(0, f.a + sw, Math.sin(t * 1.3 + f.ph) * 0.05); f.m.scale.setScalar(size * f.k);
    }
    // a fish breaks the surface now and then
    acc += dt; if (acc > 2.2 && fish.length) { acc = rnd(0, 1.2); const f = fish[(Math.random() * fish.length) | 0]; ripple(f.x, f.z, false); }
    for (const r of ripples) if (r.on) { r.t += dt; const k = r.t / 1.5; if (k >= 1) { r.on = false; r.m.visible = false; continue; } r.m.scale.setScalar(1 + k * 3.2 * r.big); r.m.material.opacity = (1 - k) * 0.55; }
  };
  const _wu = World.update.bind(World); World.update = function (dt, t) { const r = _wu(dt, t); try { step(Math.min(dt, 0.1)); } catch (e) { if (!step.err) { step.err = 1; console.warn('fishpond', e); } } return r; };
  // catching: the splash shows at once (the count change is picked up in the next frame)
  Farm2.fishPond = { fish, ripple, feedBurst, END };
});
