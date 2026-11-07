'use strict';
// v60_jobspots.js: the time-clock / "apply for a job here" kiosks. They used to stand 2 m beside each workplace door, where some sat on top of the next
// shop's door, a lamp, a tree, or on top of each other (the hospital's nurse and pharmacist kiosks shared one spot). Now every kiosk stands in a tidy row at
// the kerb of the nearest road, in front of its workplace, with its own sign naming the job, clear of every solid object and other doorway.
V23.add('v60_jobspots', () => {
  const kiosks = World.pois.filter(p => p.job && p.grp);
  if (!kiosks.length) return;
  const OFFS = [5.0, 5.7, 6.4];                                  // metres from the road centre line (the asphalt is 8 m wide, so 1 m clear of the kerb)
  const SHIFTS = [0, 1.7, -1.7, 3.4, -3.4, 5.1, -5.1, 6.8, -6.8, 8.5, -8.5, 10.2, -10.2];
  const mine = new Set(kiosks.map(p => p.grp));
  for (const p of kiosks) if (p.col) p.col.col59 = 1;                  // the kiosks' own old collision circles do not count as obstacles

  // nearest point on the road network to (x, z), with the road direction there
  const nearRoad = (x, z) => {
    let best = null;
    for (const s of ROAD_SEGS) {
      const dx = s[2] - s[0], dz = s[3] - s[1], l2 = dx * dx + dz * dz || 1, t = U.clamp(((x - s[0]) * dx + (z - s[1]) * dz) / l2, 0, 1);
      const px = s[0] + dx * t, pz = s[1] + dz * t, d = Math.hypot(x - px, z - pz);
      if (!best || d < best.d) { const l = Math.sqrt(l2); best = { d, px, pz, tx: dx / l, tz: dz / l }; }
    }
    return best;
  };
  // footprints of loose objects (signs, benches, stalls...) that have no collision shape, so a kiosk never stands on one
  const boxes = [];
  for (const c of World.outdoor.children) {
    if (mine.has(c) || !c.visible) continue;
    const b = new THREE.Box3().setFromObject(c); if (b.isEmpty()) continue;
    if (b.max.x - b.min.x > 14 || b.max.z - b.min.z > 14) continue;      // terrain / road sheets, not objects
    boxes.push(b);
  }
  // why a point is not a good spot ('' = fine)
  const why = (x, z, own) => {
    if (roadDist(x, z) < 4.7) return 'road';
    if (placed.some(q => Math.hypot(q.x - x, q.z - z) < 1.5)) return 'kiosk';
    const po = World.pois.find(q => !q.job && q.x < 2500 && Math.hypot(q.x - x, q.z - z) < (q === own ? 1.5 : 1.9)); if (po) return 'poi:' + po.label;
    const ix = Math.floor(x / Col.cs), iz = Math.floor(z / Col.cs), m = 0.55;
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const s of Col.map.get(Col.key(ix + i, iz + j)) || []) {
      if (s.col59) continue;
      const dx = x - s.x, dz = z - s.z;
      if (s.type === 'c') { if (Math.hypot(dx, dz) < s.r + m) return 'col:c' + s.x.toFixed(1) + ',' + s.z.toFixed(1); }
      else { const lx = dx * s.c - dz * s.s, lz = dx * s.s + dz * s.c; if (Math.abs(lx) < s.hw + m && Math.abs(lz) < s.hd + m) return 'col:b' + s.x.toFixed(1) + ',' + s.z.toFixed(1); }
    }
    return boxes.some(b => x > b.min.x - m && x < b.max.x + m && z > b.min.z - m && z < b.max.z + m) ? 'object' : '';
  };
  const placed = [];
  const okAt = (x, z, own) => !why(x, z, own);

  const sorted = kiosks.slice().sort((a, b) => a.z - b.z || a.x - b.x);
  for (const p of sorted) { const C = JOBS2[p.job]; if (C) { const d = World.pois.find(q => q.label && C.at.test(q.label) && q.x < 2500); p.door = d || null; } }
  for (const p of sorted) {
    const C = JOBS2[p.job], door = p.door; if (!C || !door) { placed.push({ x: p.x, z: p.z - 0.6 }); continue; }
    const r = nearRoad(door.x, door.z);
    if (!r || r.d > 25) { placed.push({ x: p.x, z: p.z - 0.6 }); continue; }   // e.g. the bus stop: not on a street, leave it where it is
    let nx = door.x - r.px, nz = door.z - r.pz; const nl = Math.hypot(nx, nz);
    if (nl < 0.3) { nx = -r.tz; nz = r.tx; } else { nx /= nl; nz /= nl; }
    let pick = null;
    for (const o of OFFS) { for (const t of SHIFTS) {
      const x = r.px + r.tx * t + nx * o, z = r.pz + r.tz * t + nz * o;
      if (okAt(x, z, door)) { pick = { x, z }; break; }
    } if (pick) break; }
    if (!pick) { placed.push({ x: p.x, z: p.z - 0.6 }); continue; }
    // move: model, collision, interaction point, sign
    const g = p.grp; g.position.set(pick.x, World.groundY(pick.x, pick.z), pick.z); g.rotation.y = Math.atan2(nx, nz);
    Col.remove(p.col); p.col = Col.circle(pick.x, pick.z, 0.25); p.col.col59 = 1;
    p.x = pick.x + nx * 0.6; p.z = pick.z + nz * 0.6; p.label = 'เครื่องสแกนลงเวลา · ' + C.n;
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.3), new THREE.MeshStandardMaterial({ map: U.signTex(`${C.i} ${C.n}`, { w: 512, h: 128, bg: '#0d47a1' }), roughness: 0.7, side: THREE.DoubleSide }));
    sign.position.set(0, 1.5, 0); g.add(sign);
    placed.push(pick);
  }
  window.Jobspots60 = { kiosks, placed, why };
});
