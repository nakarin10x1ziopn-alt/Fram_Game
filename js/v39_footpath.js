'use strict';
// ---------- v39_footpath: footpaths with kerbs along every street that has buildings (village, district, seaside, far towns),
// zebra crossings with dropped kerbs and tactile paving, approach paths to shop doors, street bins and benches, plus the hospital's
// new street-front surroundings (ambulance bay, portico, street sign). Everything is merged into a few meshes per area. ----------
(() => {
  const DS = THREE.DoubleSide, KERB_H = 0.16, PAVE_H = 0.1;
  let MAT = null;
  const mats = () => MAT || (MAT = {
    pave: new THREE.MeshStandardMaterial({ map: T.paving, color: 0xe2dbd0, roughness: 0.9, side: DS }),
    kerb: new THREE.MeshStandardMaterial({ color: 0xc9c5bc, roughness: 0.85, side: DS }),
    zebra: new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.75, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6, side: DS }),
    tact: new THREE.MeshStandardMaterial({ color: 0xf2c12e, roughness: 0.7, side: DS }),
    bin: new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.6, side: DS }),
    red: new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, side: DS }),
  });
  // ----- tiny merged-geometry accumulator -----
  class Acc {
    constructor() { this.p = []; this.n = []; this.u = []; this.i = []; }
    quad(a, b, c, d, us, up) {
      const o = this.p.length / 3, ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      if (up && ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
      this.p.push(...a, ...b, ...c, ...d); for (let k = 0; k < 4; k++) this.n.push(nx, ny, nz);
      this.u.push(us[0], us[1], us[2], us[3], us[4], us[5], us[6], us[7]); this.i.push(o, o + 1, o + 2, o, o + 2, o + 3);
    }
    box(cx, cy, cz, sx, sy, sz, ry, uvk) {
      const g = new THREE.BoxGeometry(sx, sy, sz), uv = g.attributes.uv, k = uvk || 0.5;
      if (uvk !== 0) for (let f = 0; f < 6; f++) { const a = f < 2 ? [sz, sy] : f < 4 ? [sx, sz] : [sx, sy]; for (let v = 0; v < 4; v++) { const q = f * 4 + v; uv.setXY(q, uv.getX(q) * a[0] * k, uv.getY(q) * a[1] * k); } }
      if (ry) g.rotateY(ry); g.translate(cx, cy, cz);
      const o = this.p.length / 3, P = g.attributes.position, N = g.attributes.normal;
      for (let q = 0; q < P.count; q++) { this.p.push(P.getX(q), P.getY(q), P.getZ(q)); this.n.push(N.getX(q), N.getY(q), N.getZ(q)); this.u.push(uv.getX(q), uv.getY(q)); }
      for (const ix of g.index.array) this.i.push(o + ix);
      g.dispose();
    }
    mesh(mat, parent) {
      if (!this.i.length) return null;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2));
      g.setIndex(this.i.length > 60000 ? new THREE.Uint32BufferAttribute(this.i, 1) : new THREE.Uint16BufferAttribute(this.i, 1));
      const m = new THREE.Mesh(g, mat); m.castShadow = false; m.receiveShadow = true; m.userData.noCol = true; m.userData.fp39 = 1; parent.add(m); return m;
    }
  }
  const baseY = (x, z) => (World.groundY ? World.groundY(x, z) : 0);

  // ----- ribbon along a sample polyline, lateral offsets o0..o1 on side s (+1/-1) -----
  function ribbon(acc, sp, s, o0, o1, y0, y1, side, gaps, tile) {
    const n = sp.length; let dist = 0;
    for (let i = 0; i < n - 1; i++) {
      const a = sp[i], b = sp[i + 1], tx = b.x - a.x, tz = b.z - a.z, l = Math.hypot(tx, tz) || 1, nx = tz / l * s, nz = -tx / l * s; dist += l;
      if (gaps && gaps.some(g => Math.hypot((a.x + b.x) / 2 - g.x, (a.z + b.z) / 2 - g.z) < g.r)) continue;
      const v = (x, y, z) => [x, y, z], A0 = [a.x + nx * o0, y1, a.z + nz * o0], A1 = [a.x + nx * o1, y1, a.z + nz * o1], B0 = [b.x + nx * o0, y1, b.z + nz * o0], B1 = [b.x + nx * o1, y1, b.z + nz * o1];
      const u0 = (dist - l) * tile, u1 = dist * tile, w = (o1 - o0) * tile;
      acc.quad(A0, B0, B1, A1, [u0, 0, u1, 0, u1, w, u0, w], true);
      if (side) { // vertical face toward the road
        acc.quad([A0[0], y0, A0[2]], [B0[0], y0, B0[2]], [B0[0], y1, B0[2]], [A0[0], y1, A0[2]], [u0, 0, u1, 0, u1, (y1 - y0) * tile, u0, (y1 - y0) * tile], false);
      }
    }
  }

  // ----- crossing: stripes + dropped-kerb ramps + tactile paving at both ends. p = point on road axis, t = unit tangent, hw = road half width -----
  function crossing(zeb, tact, ramp, p, t, hw, y, sides) {
    const nx = t.z, nz = -t.x, ang = Math.atan2(t.x, t.z), gy = y;
    for (let o = -hw + 0.6; o <= hw - 0.5; o += 1.0) zeb.box(p.x + nx * o, gy + 0.012, p.z + nz * o, 0.5, 0.025, 3.2, ang, 0);
    // stop line (white bar) is skipped: the road already carries lane marks
    for (const s of sides || [1, -1]) {
      // ramp from road level up to the footpath
      const o0 = hw, o1 = hw + 1.3, cx = p.x, cz = p.z, hl = 1.4;
      const q = (o, l, yy) => [cx + nx * s * o + t.x * l, yy, cz + nz * s * o + t.z * l];
      ramp.quad(q(o0, -hl, gy + 0.03), q(o0, hl, gy + 0.03), q(o1, hl, PAVE_H + 0.002), q(o1, -hl, PAVE_H + 0.002), [0, 0, 2, 0, 2, 1, 0, 1], true);
      // tactile paving on the footpath next to the kerb (blister tiles as one slab)
      tact.box(cx + nx * s * (o1 + 0.55), PAVE_H + 0.008, cz + nz * s * (o1 + 0.55), 0.9, 0.016, 2.6, ang, 0);
    }
  }

  // ----- bin and bench props (merged) -----
  function bin(acc, lid, x, z, ry) { acc.box(x, 0.42, z, 0.42, 0.84, 0.42, ry || 0, 0); lid.box(x, 0.87, z, 0.5, 0.08, 0.5, ry || 0, 0); }

  // ===== main village / district / seaside / far towns: along every road curve that has buildings beside it =====
  function villageFootpaths() {
    if (!World.roadCurves || !World.outdoor) return;
    const M = mats(), g = World.outdoor;
    // existing paving boxes (so nothing is drawn twice) and building boxes
    const have = [], blds = [], seen = new Set(), bx = new THREE.Box3();
    World.outdoor.updateMatrixWorld(true);
    World.outdoor.traverse(o => {
      if (!o.isMesh || !o.material || o.userData.fp39) return;
      if (o.material.map !== T.paving) return;
      bx.setFromObject(o); const h = bx.max.y - bx.min.y, w = bx.max.x - bx.min.x, d = bx.max.z - bx.min.z;
      if (h < 0.25 && w > 1.5 && d > 1.5 && (w > 12 || d > 12)) have.push({ x0: bx.min.x - 0.6, x1: bx.max.x + 0.6, z0: bx.min.z - 0.6, z1: bx.max.z + 0.6 });
    });
    for (const arr of Col.map.values()) for (const s of arr) if (s.type === 'b' && s.tag === 'bld' && !seen.has(s) && s.x < 2500) { seen.add(s); blds.push(s); }
    const covered = (x, z) => have.some(b => x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1);
    const near = (x, z, r) => blds.some(b => Math.hypot(b.x - x, b.z - z) < r);
    const pave = new Acc(), kerb = new Acc(), zeb = new Acc(), tact = new Acc(), ramp = new Acc(), bins = new Acc(), lids = new Acc();
    const roads = []; // for approach paths
    // crossings: [curve index, anchor z or x]
    const CROSS = [[0, 'z', -150], [0, 'z', -200], [0, 'z', -236], [0, 'z', -266], [0, 'z', -308], [1, 'x', 28]];
    const cross = [];
    World.roadCurves.forEach((rc, ci) => {
      const hw = rc.r.w / 2, sp = rc.sp;
      for (const c of CROSS) if (c[0] === ci) {
        let best = 0, bd = 1e9; sp.forEach((q, i) => { const d = Math.abs((c[1] === 'z' ? q.z : q.x) - c[2]); if (d < bd) { bd = d; best = i; } });
        const a = sp[Math.max(0, best - 1)], b = sp[Math.min(sp.length - 1, best + 1)], l = Math.hypot(b.x - a.x, b.z - a.z) || 1;
        cross.push({ ci, p: sp[best], t: { x: (b.x - a.x) / l, z: (b.z - a.z) / l }, hw });
      }
    });
    World.roadCurves.forEach((rc, ci) => {
      const hw = rc.r.w / 2, sp = rc.sp, gaps = cross.filter(c => c.ci === ci).map(c => ({ x: c.p.x, z: c.p.z, r: 2.4 }));
      if (hw > 5) return;
      for (const s of [1, -1]) {
        let run = [];
        const flush = () => {
          if (run.length > 2) { const pts = run.slice(); ribbon(pave, pts, s, hw + 0.22, hw + 3.0, 0.01, PAVE_H, false, null, 0.5); ribbon(kerb, pts, s, hw, hw + 0.22, 0.02, KERB_H, true, gaps, 0.5); roads.push({ ci, pts, s, hw }); }
          run = [];
        };
        for (let i = 0; i < sp.length; i++) {
          const a = sp[Math.max(0, i - 1)], b = sp[Math.min(sp.length - 1, i + 1)], l = Math.hypot(b.x - a.x, b.z - a.z) || 1, nx = (b.z - a.z) / l * s, nz = -(b.x - a.x) / l * s, q = sp[i];
          const cx = q.x + nx * (hw + 1.6), cz = q.z + nz * (hw + 1.6);
          const ok = q.z < -100 && q.x < 480 && !covered(cx, cz) && near(q.x + nx * 13, q.z + nz * 13, 15) && Math.abs(World.groundY(cx, cz) - World.groundY(q.x, q.z)) < 0.6;
          if (ok) run.push(q); else flush();
        }
        flush();
      }
    });
    // existing straight strips get their kerb stones (they already carry the paving): main village x=±5.6, seaside z=-380±5.6
    const kerbStrip = (x0, z0, x1, z1, hw, side, ci, gapList) => {
      const sp = []; const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 2); for (let i = 0; i <= n; i++) sp.push({ x: x0 + (x1 - x0) * i / n, z: z0 + (z1 - z0) * i / n });
      ribbon(kerb, sp, side, hw, hw + 0.22, 0.02, KERB_H, true, gapList, 0.5);
    };
    const gMain = cross.filter(c => c.ci === 0).map(c => ({ x: c.p.x, z: c.p.z, r: 2.4 }));
    for (const s of [1, -1]) kerbStrip(0, -164, 0, -332, 4, s, 0, gMain);
    // seaside promenade road: z=-380 between x=292 and x=412
    if (covered(352, -380 + 5.6)) for (const s of [1, -1]) kerbStrip(292, -380, 412, -380, 4, s, 1, null);
    // crossings
    for (const c of cross) {
      const y = baseY(c.p.x, c.p.z) + 0.06; crossing(zeb, tact, ramp, c.p, c.t, c.hw, y);
    }
    // approach paths from shop/service doors to the nearest footpath
    const ap = new Acc(), doors = [];
    for (const p of World.pois) {
      if (!p || (p.kind !== 'shop' && p.kind !== 'act') || p.x > 480 || p.x < -160 || p.z > -100 || p.z < -440) continue;
      if (!blds.some(b => Math.hypot(b.x - p.x, b.z - p.z) < Math.max(b.hw, b.hd) + 3.2)) continue;
      if (doors.some(d => Math.hypot(d.x - p.x, d.z - p.z) < 3)) continue;
      let best = null, bd = 1e9;
      for (const r of roads) for (let i = 0; i < r.pts.length; i += 2) { const q = r.pts[i], d = Math.hypot(q.x - p.x, q.z - p.z); if (d < bd) { bd = d; best = { r, i, q }; } }
      if (!best) { // existing straight strips: nearest point on x=±5.6 for the main street
        if (Math.abs(p.x) < 30 && p.z < -164 && p.z > -332) best = { tx: Math.sign(p.x) * 5.6, tz: p.z }; else continue;
      } else { const q = best.q, i = best.i, a = best.r.pts[Math.max(0, i - 1)], b = best.r.pts[Math.min(best.r.pts.length - 1, i + 1)], l = Math.hypot(b.x - a.x, b.z - a.z) || 1; best.tx = q.x + (b.z - a.z) / l * best.r.s * (best.r.hw + 1.6); best.tz = q.z - (b.x - a.x) / l * best.r.s * (best.r.hw + 1.6); }
      const dx = best.tx - p.x, dz = best.tz - p.z, len = Math.hypot(dx, dz); if (len < 1.2 || len > 24) continue;
      let blocked = false; for (let k = 0.15; k < 1; k += 0.1) { const x = p.x + dx * k, z = p.z + dz * k; if (blds.some(b => rectHit(b, x, z))) { blocked = true; break; } }
      if (blocked) continue;
      doors.push({ x: p.x, z: p.z });
      const ang = Math.atan2(dx, dz); ap.box(p.x + dx / 2, 0.035, p.z + dz / 2, 1.9, 0.07, len + 0.4, ang, 0.5);
    }
    // street bins along the main street footpaths (between the lamps), kept off door lines and crossings
    for (let z = -183; z >= -315; z -= 26) for (const s of [-1, 1]) {
      if (cross.some(c => Math.abs(c.p.z - z) < 4) || doors.some(d => Math.abs(d.z - z) < 3 && Math.abs(d.x) < 30)) continue;
      bin(bins, lids, s * 6.6, z, 0);
    }
    const out = [pave.mesh(M.pave, g), kerb.mesh(M.kerb, g), zeb.mesh(M.zebra, g), tact.mesh(M.tact, g), ramp.mesh(M.pave, g), ap.mesh(M.pave, g), bins.mesh(M.bin, g), lids.mesh(M.kerb, g)].filter(Boolean);
    window.FP39 = Object.assign(window.FP39 || {}, { village: { meshes: out.length, crossings: cross.length, doorPaths: doors.length, ribbons: roads.length } });
  }
  function rectHit(b, x, z) {
    const c = Math.cos(b.rot || 0), s = Math.sin(b.rot || 0), dx = x - b.x, dz = z - b.z, lx = dx * c - dz * s, lz = dx * s + dz * c;
    return Math.abs(lx) < b.hw + 0.4 && Math.abs(lz) < b.hd + 0.4;
  }

  // ===== far cities (V25 planner): kerbs along every street, zebra crossings, dropped kerbs, tactile paving, bins =====
  const SPEC = { large: { st: [-40, 0, 40], zLen: 180, cross: 50 }, medium: { st: [-20, 20], zLen: 140, cross: null }, small: { st: [0], zLen: 140, cross: null } };
  function cityFootpaths(A, info) {
    const sp = SPEC[info.size]; if (!sp || !A || !A.g || A._fp39) return; A._fp39 = 1;
    const M = mats(), g = A.g, cx = info.x, cz = info.z, kerb = new Acc(), zeb = new Acc(), tact = new Acc(), ramp = new Acc(), bins = new Acc(), lids = new Acc();
    const zs = sp.cross != null ? [cz - 30, cz + 20, cz + 38, cz + 62] : [cz - 30, cz + 12];
    if (info.plaza) { const pz = info.plaza.z; if (!zs.some(z => Math.abs(z - pz) < 12)) zs.push(pz); }
    const cr = (sx, z) => ({ p: { x: cx + sx, z }, t: { x: 0, z: 1 } });
    for (const sx of sp.st) {
      const x = cx + sx, z0 = cz - sp.zLen / 2, z1 = cz + sp.zLen / 2;
      const gaps = zs.map(z => ({ x, z, r: 2.4 })); if (sp.cross != null) gaps.push({ x, z: cz + sp.cross, r: 5.6 });
      const line = []; for (let z = z0; z <= z1; z += 2) line.push({ x, z });
      for (const s of [1, -1]) ribbon(kerb, line, s, 4, 4.22, 0.02, KERB_H, true, gaps, 0.5);
      for (const z of zs) { const c = cr(sx, z); crossing(zeb, tact, ramp, c.p, c.t, 4, 0.05 + 0.01); }
      // bins on the footpath kerb side between the crossings
      for (let z = z0 + 14; z < z1 - 8; z += 17) for (const s of [-1, 1]) { if (zs.some(q => Math.abs(q - z) < 4) || (sp.cross != null && Math.abs(z - (cz + sp.cross)) < 8)) continue; bin(bins, lids, x + s * 4.75, z, 0); }
    }
    [kerb.mesh(M.kerb, g), zeb.mesh(M.zebra, g), tact.mesh(M.tact, g), ramp.mesh(M.pave, g), bins.mesh(M.bin, g), lids.mesh(M.kerb, g)];
    const st = window.FP39 = window.FP39 || {}; (st.cities = st.cities || {})[info.id] = { crossings: zs.length * sp.st.length };
  }

  // ===== hospital surroundings: portico, ambulance bay, roof lettering and a street pylon sign =====
  function hospitalSurroundings() {
    if (typeof CLINIC === 'undefined' || !World.outdoor || CLINIC._fp39) return; CLINIC._fp39 = 1;
    const o = { w: 13, d: 10, h: 5.4 }, g = new THREE.Group(); g.position.set(CLINIC.x, World.groundY(CLINIC.x, CLINIC.z), CLINIC.z); g.rotation.y = CLINIC.rot; World.outdoor.add(g);
    const white = mc(0xf5f5f5, { roughness: 0.6 }), blue = mc(0x1565c0, { roughness: 0.55 }), red = mc(0xd32f2f, { roughness: 0.6 });
    // entrance portico (two pillars + roof) over the main door
    U.mk(g, GEO.box, white, [0, 3.35, o.d / 2 + 1.7], [5.2, 0.25, 3.0]); U.mk(g, GEO.box, blue, [0, 3.52, o.d / 2 + 1.7], [5.3, 0.08, 3.1]);
    for (const s of [-1, 1]) U.mk(g, GEO.cylLo, white, [s * 2.3, 1.7, o.d / 2 + 3.0], [0.16, 3.4, 0.16]);
    // ambulance bay to the right of the door: red apron, roof, 'ฉุกเฉิน' board
    const bx = 4.6, bz = o.d / 2 + 3.4;
    U.mk(g, GEO.box, mc(0xcfd8dc, { roughness: 0.8 }), [bx, 0.05, bz], [5.2, 0.1, 6.2]);
    for (let i = 0; i < 4; i++) U.mk(g, GEO.box, mc(i % 2 ? 0xffffff : 0xd32f2f, { roughness: 0.8 }), [bx - 1.95 + i * 1.3, 0.11, bz + 2.6], [1.0, 0.02, 0.5]);
    U.mk(g, GEO.box, white, [bx, 3.2, bz - 0.8], [5.2, 0.2, 4.4]); for (const s of [-1, 1]) U.mk(g, GEO.cylLo, white, [bx + s * 2.4, 1.6, bz + 1.3], [0.12, 3.2, 0.12]);
    U.mk(g, new THREE.PlaneGeometry(4.2, 0.7), new THREE.MeshStandardMaterial({ map: U.signTex('ฉุกเฉิน 24 ชม.', { bg: '#c62828', fg: '#ffffff', w: 512, h: 96 }), roughness: 0.7 }), [bx, 2.7, o.d / 2 + 0.1 + 0.02], 1);
    // roof lettering board facing the street
    const rm = new THREE.MeshStandardMaterial({ map: U.signTex('🏥 โรงพยาบาลสุขใจ', { bg: '#0d47a1', fg: '#ffffff', w: 768, h: 128 }), roughness: 0.6 });
    U.mk(g, GEO.box, blue, [0, o.h + 0.85, o.d / 2 - 0.3], [9.2, 1.5, 0.3]); U.mk(g, new THREE.PlaneGeometry(9.0, 1.3), rm, [0, o.h + 0.85, o.d / 2 - 0.13], 1);
    U.mk(g, GEO.box, red, [-5.2, o.h + 1.2, o.d / 2 - 0.3], [0.5, 1.8, 0.25]); U.mk(g, GEO.box, red, [-5.2, o.h + 1.2, o.d / 2 - 0.3], [1.8, 0.5, 0.25]);
    // street pylon sign beside the footpath, readable from the road in both directions
    const px = l2w(CLINIC.x, CLINIC.z, CLINIC.rot, 4.8, o.d / 2 + 5.6); // lateral offset along the street, close to the footpath back edge
    const pg = new THREE.Group(); pg.position.set(px.x, World.groundY(px.x, px.z), px.z); World.outdoor.add(pg);
    U.mk(pg, GEO.cylLo, mc(0x37474f, { roughness: 0.5, metalness: 0.4 }), [0, 1.9, 0], [0.12, 3.8, 0.12]);
    const sm = new THREE.MeshStandardMaterial({ map: U.signTex('🏥 โรงพยาบาลสุขใจ · ฉุกเฉิน 24 ชม.', { bg: '#0d47a1', fg: '#ffffff', w: 512, h: 160 }), roughness: 0.6, side: THREE.DoubleSide });
    U.mk(pg, GEO.box, blue, [0, 3.7, 0], [0.1, 1.2, 3.7]);
    for (const sd of [1, -1]) { const pl = U.mk(pg, new THREE.PlaneGeometry(3.6, 1.1), sm, [sd * 0.07, 3.7, 0]); pl.rotation.y = sd > 0 ? Math.PI / 2 : -Math.PI / 2; }
    Col.circle(px.x, px.z, 0.25);
    // a footpath-level approach strip from the door to the street footpath plus a zebra in front already comes from villageFootpaths()
  }

  V23.add('v39_footpath', () => {
    try { hospitalSurroundings(); } catch (e) { console.error('v39 hospital', e); }
    try { villageFootpaths(); } catch (e) { console.error('v39 village footpaths', e); }
    if (window.V25) V25.ensureHook('*', (A, info) => { try { cityFootpaths(A, info); } catch (e) { console.error('v39 city footpaths', e); } });
  });
})();
