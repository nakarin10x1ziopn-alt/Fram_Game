'use strict';
// ---------- v25_town: city planner for the far cities (street grid, zoning, free civic lots), overlap audit, the cities map panel
// (big map inset + travel list + phone app + first-visit hint). Cities themselves live in v23_town.js; this file decides where every
// building, house, plaza, tree and tower goes, so nothing stacks and every front door faces a street ----------
const V25 = window.V25 = {
  hooks: {}, built: {}, cities: [],
  // callback(A, info) runs once right after city `id` ('*' = every city) has been built; runs now if it is already built
  ensureHook(id, fn) {
    (this.hooks[id] = this.hooks[id] || []).push(fn);
    const b = this.built[id]; if (b) { try { fn(b, this.info(id)); } catch (e) { console.error('V25 hook failed', id, e); } }
  },
  fire(id, A) {
    this.built[id] = A; const info = this.info(id);
    for (const k of [id, '*']) for (const fn of this.hooks[k] || []) { try { fn(A, info); } catch (e) { console.error('V25 hook failed', k, e); } }
  },
  info(id) { return (window.V25Towns || []).find(t => t.id === id); },
  // centre of a building with depth d that sits on lot `lot`, aligned with the street-side facade line of the lot
  lotPos(lot, d) { return { x: lot.fx + lot.side * (d != null ? d : lot.d) / 2, z: lot.z, rot: lot.rot }; },
  freeLots(id, kind) { const t = this.info(id); return t ? t.lots.filter(l => !l.taken && (!kind || l.kind === kind)) : []; },
  takeLot(id, lotId) { const t = this.info(id), l = t && t.lots.find(x => x.id === lotId); if (l) l.taken = true; return l; },
};

(() => {
  const L90 = Math.PI / 2, R90 = -Math.PI / 2, F = 7.5; // facade line: 0.5 m beyond the 7 m wide road + pavement
  const SPEC = {
    large: { st: [-40, 0, 40], rows: 7, z0: -72, step: 17, cross: 50, zLen: 180, R: 88 },
    medium: { st: [-20, 20], rows: 7, z0: -52, step: 15, cross: null, zLen: 140, R: 70 },
    small: { st: [0], rows: 6, z0: -52, step: 15, cross: null, zLen: 140, R: 70 },
  };
  const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = seed => { let a = hash(seed); return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

  // ---------- planning ----------
  const plan = T => {
    if (T._plan) return T._plan;
    const sp = SPEC[T.size], cx = T.cx, cz = T.cz, key = T.key;
    const slot = (st, side, row) => ({ st, side, row, z: cz + sp.z0 + row * sp.step, rot: side < 0 ? L90 : R90, fx: cx + st + side * F, x: cx + st + side * 11 });
    const grid = {}; for (const st of sp.st) for (const side of [-1, 1]) for (let r = 0; r < sp.rows; r++) grid[st + '|' + side + '|' + r] = slot(st, side, r);
    const at = (st, side, r) => grid[st + '|' + side + '|' + r];
    const nShop = T.shops.length + T.svc.length;
    const shopSlots = [], houses = [], lots = [];
    let plaza = null;
    const lot = (kind, w, d, st, side, rows) => {
      if (rows.length === 1) w = Math.min(w, sp.step - 1);
      const s0 = at(st, side, rows[0]), s1 = at(st, side, rows[rows.length - 1]);
      lots.push({ id: key + ':' + kind + lots.length, kind, w, d, st, side, rot: s0.rot, fx: s0.fx, z: (s0.z + s1.z) / 2, x: s0.fx + side * d / 2, taken: false, rows: rows.slice() });
    };
    if (T.size === 'large') {
      const com = []; for (let r = sp.rows - 1; r >= 0; r--) for (const st of [0, -40]) for (const side of [-1, 1]) com.push(at(st, side, r));
      shopSlots.push(...com.slice(0, nShop)); houses.push(...com.slice(nShop));
      for (let r = 0; r < 7; r++) lot('civic', 16, 11, 40, 1, [r]);                    // east side of the third street: government row
      lot('civic', 16, 11, 40, -1, [0]); lot('civic', 16, 11, 40, -1, [1]); lot('civic', 16, 11, 40, -1, [6]);
      lot('mall', 24, 16, 40, -1, [4, 5]);                                             // department store / mall
      const a = at(40, -1, 2), b = at(40, -1, 3);                                      // civic square between the main street and the third street
      plaza = { x: cx + 24.75, z: (a.z + b.z) / 2, hw: 7.75, hd: 17 };
    } else if (T.size === 'medium') {
      const com = []; for (let r = sp.rows - 1; r >= 0; r--) for (const side of [-1, 1]) com.push(at(-20, side, r));
      shopSlots.push(...com.slice(0, nShop)); houses.push(...com.slice(nShop));
      for (let r = 3; r < 7; r++) lot('civic', 16, 11, 20, -1, [r]);
      lot('mall', 24, 16, 20, -1, [1, 2]);
      for (let r = 0; r < 7; r++) houses.push(at(20, 1, r));
      houses.push(at(20, -1, 0));
    } else {
      const com = []; for (let r = sp.rows - 1; r >= 0; r--) for (const side of [-1, 1]) com.push(at(0, side, r));
      shopSlots.push(...com.slice(0, nShop)); const rest = com.slice(nShop);
      for (const s of rest) { if (s.side < 0 && s.row <= 1) lot('civic', 16, 11, 0, -1, [s.row]); else houses.push(s); }
    }
    if (T.size === 'large') for (let k = 0; k < 2 && houses.length > 6; k++) { const s = houses.pop(); lot('civic', 16, 11, s.st, s.side, [s.row]); } // two more civic lots (museum, convention centre...)
    const P = { key, T, sp, cx, cz, shopSlots, houses, lots, plaza, foots: [], trees: [], towers: [] };
    P.foot = (x, z, rot, w, d, tag) => { P.foots.push({ type: 'r', x, z, hw: w / 2, hd: d / 2, rot, tag }); };
    // reserved lots are footprints too: nothing else may be planned on them
    for (const l of lots) P.foot(l.x, l.z, l.rot, l.w, l.d, 'lot-' + l.kind);
    if (plaza) P.foots.push({ type: 'r', x: plaza.x, z: plaza.z, hw: plaza.hw, hd: plaza.hd, rot: 0, tag: 'plaza' });
    P.pos = (sl, o) => ({ x: sl.fx + sl.side * o.d / 2, z: sl.z });
    T._plan = P; return P;
  };
  window.V25Layout = {
    plan,
    // v23_town asks the planner for shop slots and positions through this thin adapter
    forTown(T) {
      const P = plan(T);
      return {
        shopSlots: P.shopSlots,
        pos: (sl, o) => P.pos(sl, o),
        foot: (x, z, rot, w, d, tag) => P.foot(x, z, rot, w, d, tag),
        inCross: z => P.sp.cross != null && Math.abs(z - (P.cz + P.sp.cross)) < 9,
        decorate: (T2, A, g) => decorate(P, A, g),
      };
    },
  };
  // v23_town calls V25Layout.plan(T) and uses .shopSlots/.pos/.inCross/.decorate/.foot; make the plan object expose them
  { const _p = plan; window.V25Layout.plan = T => { const P = _p(T); if (!P.inCross) { const f = window.V25Layout.forTown(T); P.inCross = f.inCross; P.decorate = f.decorate; } return P; }; }

  // ---------- geometry helpers for the audit ----------
  const rectAxes = r => { const c = Math.cos(r.rot), s = Math.sin(r.rot); return [{ x: c, z: -s }, { x: s, z: c }]; };
  const rectOverlap = (a, b, m = 0) => {
    for (const ax of rectAxes(a).concat(rectAxes(b))) {
      const pr = (r) => { const A = rectAxes(r); const e = r.hw * Math.abs(ax.x * A[0].x + ax.z * A[0].z) + r.hd * Math.abs(ax.x * A[1].x + ax.z * A[1].z); const c = r.x * ax.x + r.z * ax.z; return [c - e, c + e]; };
      const p = pr(a), q = pr(b); if (p[1] <= q[0] + m || q[1] <= p[0] + m) return false;
    }
    return true;
  };
  const circleRect = (c, r, m = 0) => {
    const ax = rectAxes(r), dx = c.x - r.x, dz = c.z - r.z, u = dx * ax[0].x + dz * ax[0].z, v = dx * ax[1].x + dz * ax[1].z;
    const qx = Math.max(-r.hw, Math.min(r.hw, u)), qz = Math.max(-r.hd, Math.min(r.hd, v));
    return Math.hypot(u - qx, v - qz) < c.r + m;
  };
  const roadRects = P => {
    const out = [], { sp, cx, cz } = P;
    for (const st of sp.st) out.push({ type: 'r', x: cx + st, z: cz, hw: 7, hd: sp.zLen / 2, rot: 0, tag: 'street' });
    if (sp.cross != null) out.push({ type: 'r', x: cx, z: cz + sp.cross, hw: 62, hd: 4, rot: 0, tag: 'cross' });
    return out;
  };
  // overlaps among everything planned in a city (and against its roads); an empty list means a clean layout
  V25.audit = key => {
    const T = window.V23Kit && V23Kit.TOWNS.find(t => t.key === key); if (!T || !T._plan) return null;
    const P = T._plan, roads = roadRects(P), bad = [], rects = P.foots.filter(f => f.type === 'r' && !f.raw), circles = P.foots.filter(f => f.type === 'c');
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) if (rectOverlap(rects[i], rects[j])) bad.push(`${rects[i].tag}@${rects[i].x | 0},${rects[i].z | 0} × ${rects[j].tag}@${rects[j].x | 0},${rects[j].z | 0}`);
      for (const rd of roads) if (rectOverlap(rects[i], rd)) bad.push(`${rects[i].tag}@${rects[i].x | 0},${rects[i].z | 0} on ${rd.tag}`);
    }
    for (const c of circles) { if (c.tag === 'flag') continue; for (const r of rects) if (circleRect(c, r)) bad.push(`tree@${c.x | 0},${c.z | 0} in ${r.tag}`); for (const rd of roads) if (circleRect(c, rd, -0.1) && c.tag !== 'streettree') bad.push(`tree@${c.x | 0},${c.z | 0} on ${rd.tag}`); }
    return bad;
  };
  // overlaps among the walk-in buildings of the main map (collision boxes tagged 'bld'), reported once per pair
  V25.auditMain = () => {
    const seen = new Set(), boxes = [], bad = [];
    for (const arr of Col.map.values()) for (const s of arr) if (s.type === 'b' && s.tag === 'bld' && !seen.has(s)) { seen.add(s); boxes.push(s); }
    const R = s => ({ x: s.x, z: s.z, hw: s.hw - 0.3, hd: s.hd - 0.3, rot: s.rot });
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j]; if (Math.hypot(a.x - b.x, a.z - b.z) > a.br + b.br) continue;
      if (a.x > 2500 || b.x > 2500) continue;
      if (rectOverlap(R(a), R(b))) bad.push({ a: [a.x | 0, a.z | 0, +(a.hw * 2).toFixed(1), +(a.hd * 2).toFixed(1)], b: [b.x | 0, b.z | 0, +(b.hw * 2).toFixed(1), +(b.hd * 2).toFixed(1)] });
    }
    return { boxes: boxes.length, overlaps: bad };
  };

  // ---------- building a planned city ----------
  const HOUSE = {
    modern: i => ({ w: 9, d: 7, h: 6.2, rows: 2, flat: true, wall: [0xeceff1, 0xe3f2fd, 0xf3e5f5, 0xe8f5e9][i % 4], roof: 0xe0e0e0, winF: [-2.4, 2.4], winS: [0], awning: [0x1e88e5, 0x7cb342, 0xff7043, 0xab47bc][i % 4] }),
    thai: i => ({ w: 9, d: 7, h: 3.8, rows: 1, roofH: 2.2, wall: [0xffe0b2, 0xf8bbd0, 0xdcedc8, 0xfff9c4][i % 4], roof: [0x8d3b2a, 0x6d4c41, 0x33691e][i % 3], winF: [-2.4, 2.4], winS: [0], pots: true, flowers: i % 2 === 0 }),
    wood: i => ({ w: 9, d: 7, h: 3.6, rows: 1, roofH: 2.4, wallTex: 'wood', wall: [0xb08968, 0xc8a27c, 0xa1887f, 0xbcaaa4][i % 4], roof: 0x4e342e, winF: [-2.4, 2.4], winS: [0], pots: true, flowers: i % 2 === 0 }),
    resort: i => ({ w: 9, d: 7, h: 3.8, rows: 1, roofH: 2.4, wall: [0xfffde7, 0xe1f5fe, 0xffe4ec, 0xe0f2f1][i % 4], roof: [0x0288d1, 0xd84315, 0x00897b][i % 3], winF: [-2.4, 2.4], winS: [0], flowers: true, pots: true }),
  };
  const TOWERS = [[-78, -70, 12, 12, 46], [78, -72, 14, 10, 58], [-80, 10, 12, 14, 38], [80, 14, 10, 10, 50], [-76, 70, 14, 12, 44], [78, 72, 12, 12, 40]];
  const decorate = (P, A, g) => {
    const { T, sp, cx, cz, lots } = P, big = T.size === 'large', pr = rng(T.key + 'v25');
    if (big) for (const [dx, dz, w, d] of TOWERS) P.foot(cx + dx, cz + dz, 0, w, d, 'tower');
    // cross street: one slab on top of the street pavements so the crossing reads as a junction
    if (sp.cross != null) {
      const road = new THREE.MeshStandardMaterial({ map: TEXROAD(), normalMap: TEXROADN() || null, roughness: 0.85 });
      const slab = U.mk(g, U.box(124, 0.07, 8, 4), road, [cx, 0.14, cz + sp.cross]); slab.castShadow = false;
      const pave = texMat('paving', 0xe2dbd0, { roughness: 0.9 });
      for (const s of [-1, 1]) U.mk(g, U.box(124, 0.1, 3, 2), pave, [cx, 0.05, cz + sp.cross + s * 5.5]).castShadow = false;
    }
    // civic square
    if (P.plaza) {
      const pl = P.plaza, pave = texMat('paving', 0xd7ccc8, { roughness: 0.9 });
      U.mk(g, U.box(pl.hw * 2, 0.12, pl.hd * 2, 2), pave, [pl.x, 0.06, pl.z]).castShadow = false;
      const water = new THREE.MeshStandardMaterial({ color: 0x4fc3f7, roughness: 0.1, metalness: 0.2 });
      U.mk(g, GEO.cyl, mc(0xcfd8dc, { roughness: 0.6 }), [pl.x, 0.35, pl.z], [3.2, 0.5, 3.2]); U.mk(g, GEO.cyl, water, [pl.x, 0.62, pl.z], [2.8, 0.06, 2.8]);
      U.mk(g, GEO.cylLo, mc(0xb0bec5), [pl.x, 1.4, pl.z], [0.25, 1.8, 0.25]); U.mk(g, GEO.sph, mc(0x81d4fa, { roughness: 0.2 }), [pl.x, 2.4, pl.z], 0.45);
      Col.circle(pl.x, pl.z, 3.3);
      // flag, benches, planters on the square
      const fx = pl.x, fz = pl.z - 11; U.mk(g, GEO.cylLo, M.metal, [fx, 4.5, fz], [0.08, 9, 0.08]); U.mk(g, U.box(2.4, 1.4, 0.04), new THREE.MeshStandardMaterial({ map: U.signTex(T.icon + ' ' + T.n, { w: 256, h: 128, bg: '#1565c0', fg: '#ffffff' }) }), [fx + 1.3, 8.2, fz]); Col.circle(fx, fz, 0.3);
      const wood = mc(0x8d6e63);
      for (const [bx, bz, br] of [[pl.x - 5.2, pl.z - 6, 0], [pl.x + 5.2, pl.z - 6, 0], [pl.x - 5.2, pl.z + 6, 0], [pl.x + 5.2, pl.z + 6, 0]]) {
        U.mk(g, U.box(2.2, 0.15, 0.7, 1), wood, [bx, 0.55, bz]); U.mk(g, U.box(2.2, 0.5, 0.1, 1), wood, [bx, 0.9, bz + (bz < pl.z ? -0.32 : 0.32)]);
        for (const dx of [-0.9, 0.9]) U.mk(g, U.box(0.1, 0.5, 0.5, 1), M.metal, [bx + dx, 0.28, bz]); Col.box(bx, bz, 1.1, 0.4, 0, 'bench');
      }
      for (const [px2, pz2] of [[pl.x - 6.2, pl.z - 14], [pl.x + 6.2, pl.z - 14], [pl.x - 6.2, pl.z + 14], [pl.x + 6.2, pl.z + 14]]) { U.mk(g, GEO.cyl, mc(0x6d4c41), [px2, 0.3, pz2], [0.7, 0.6, 0.7]); U.mk(g, GEO.sph, mc(0x66bb6a), [px2, 0.9, pz2], 0.55); Col.circle(px2, pz2, 0.7); }
      P.foots.push({ type: 'c', x: fx, z: fz, r: 0.5, tag: 'flag' });
    }
    // residential houses on the remaining frontage
    P.houses.forEach((sl, i) => {
      const o = (HOUSE[T.st] || HOUSE.thai)(i), x = sl.fx + sl.side * o.d / 2, z = sl.z;
      const b = World.building(o); b.position.set(x, 0, z); b.rotation.y = sl.rot; g.add(b); Col.box(x, z, o.w / 2 + 0.3, o.d / 2 + 0.3, sl.rot, 'bld');
      P.foot(x, z, sl.rot, o.w, o.d, 'house');
      // low garden wall line and a letter-box in front, so the street edge reads tidy
      const mx = sl.fx + sl.side * 0.4; U.mk(g, U.box(0.5, 0.9, 0.5, 1), mc(0x8d6e63), [mx, 0.45, z + 4.8]);
    });
    // street trees on the pavements (instanced: one draw call for all trunks, one for all canopies)
    const spots = [];
    for (const st of sp.st) for (const side of [-1, 1]) for (let r = 0; r < sp.rows - 1; r++) {
      const z = cz + sp.z0 + (r + 0.5) * sp.step; if (sp.cross != null && Math.abs(z - (cz + sp.cross)) < 8) continue;
      if (lots.some(l => l.rows.length > 1 && l.st === st && l.side === side && Math.abs(l.z - z) < 2.2)) continue;   // a two-row lot (mall) has its door right here
      spots.push({ x: cx + st + side * 5.6, z, r: 0.35, street: true });
    }
    // trees fill the back gardens and the edge of the town, never on a footprint, a street or the arrival point
    const keep = [{ x: cx + 3, z: cz + 60, r: 9 }, { x: cx, z: cz - sp.zLen / 2 + 3, r: 8 }];
    const roads = roadRects(P), want = big ? 52 : T.size === 'medium' ? 34 : 24; let guard = 0, n = 0;
    while (n < want && guard++ < 4000) {
      const x = cx + (pr() * 2 - 1) * (sp.R - 3), z = cz + (pr() * 2 - 1) * (sp.R - 3), c = { x, z, r: 1.6 };
      if (P.foots.some(f => f.type === 'r' ? circleRect(c, f, 1.2) : Math.hypot(f.x - x, f.z - z) < 3)) continue;
      if (roads.some(rd => circleRect(c, rd, 1.4))) continue;
      if (keep.some(k => Math.hypot(k.x - x, k.z - z) < k.r)) continue;
      if (spots.some(s => !s.street && Math.hypot(s.x - x, s.z - z) < 4.2)) continue;
      spots.push({ x, z, r: 0.35 }); n++;
    }
    const trunk = mc(0x5d4037), leaf = mc(T.st === 'wood' ? 0x3f6f3a : 0x5c8f4a, { roughness: 0.9 });
    const tm = new THREE.InstancedMesh(GEO.cylLo, trunk, spots.length), lm = new THREE.InstancedMesh(GEO.sph, leaf, spots.length);
    const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), pv = new THREE.Vector3(), sv = new THREE.Vector3();
    spots.forEach((s, i) => {
      const k = 0.85 + pr() * 0.35;
      tm.setMatrixAt(i, M4.compose(pv.set(s.x, 1.2 * k, s.z), q, sv.set(0.22, 2.4 * k, 0.22)));
      lm.setMatrixAt(i, M4.compose(pv.set(s.x, 3.2 * k, s.z), q, sv.set(1.5 * k, 1.5 * k, 1.5 * k)));
      Col.circle(s.x, s.z, 0.35); P.foots.push({ type: 'c', x: s.x, z: s.z, r: s.street ? 0.35 : 1.6, tag: s.street ? 'streettree' : 'tree' });
    });
    for (const m of [tm, lm]) { m.castShadow = true; m.receiveShadow = true; m.userData.solid = 1; m.frustumCulled = false; g.add(m); }
    // skyline towers just outside the lots
    if (big) {
      const gl = mc(0x5d8aa8, { roughness: 0.1, metalness: 0.6 });
      TOWERS.forEach(([dx, dz, w, d, h], i) => {
        const b = new THREE.Group(); b.position.set(cx + dx, 0, cz + dz); g.add(b);
        U.mk(b, U.box(w, h, d, 3), texMat('plaster', [0xb0bec5, 0xcfd8dc, 0x90a4ae, 0xeceff1][i % 4]), [0, h / 2, 0]);
        for (let y = 2; y < h - 1; y += 3) U.mk(b, GEO.box, gl, [0, y, d / 2 + 0.02], [w - 1, 1.4, 0.06]);
        Col.box(cx + dx, cz + dz, w / 2 + 0.3, d / 2 + 0.3, 0, 'bld');
      });
    }
  };
  const TEXROAD = () => T.road, TEXROADN = () => T.road_n; // T is the global texture table (v23_town shadows it locally)

  // ---------- the cities map panel ----------
  const SIZE = { large: 'เมืองใหญ่', medium: 'เมืองกลาง', small: 'เมืองเล็ก' };
  const THEME = { metro: 'ห้างสรรพสินค้า ไอที และไฮเทคครบวงจร', port: 'อาหารทะเล ประมง และค้าส่ง', andaman: 'ท่องเที่ยว ของที่ระลึก และรีสอร์ท', tech: 'เมืองมหาวิทยาลัย ร้านไอทีและเกม', brook: 'งานฝีมือ กาแฟ และเฟอร์นิเจอร์ไม้', grain: 'ตลาดผลผลิต เกษตรและปศุสัตว์', orchard: 'สวนผลไม้ ตลาดผลไม้และน้ำผลไม้', riverside: 'ร้านจำเป็นครบ เงียบสงบริมน้ำ', sunflower: 'ทุ่งดอกไม้ ร้านชำและกาแฟ' };
  const OLD = { mount: ['⛰️', 'ดอยสุขใจ', 'เมืองภูเขา'], island: ['🏝️', 'เกาะสุขใจ', 'เกาะ'], chiang: ['🏮', 'เชียงสุข', 'เมืองเก่า'], city: ['🏙️', 'สุขใจซิตี้', 'เมืองใหม่'] };
  const cityList = () => {
    const out = [], kit = (window.V23Kit && V23Kit.TOWNS) || [], seen = new Set();
    for (const T of kit) { const t = TAXI_DEST.find(d => d.away === T.key); out.push({ key: T.key, n: T.n, icon: T.icon, size: T.size, tag: SIZE[T.size], cx: T.cx, cz: T.cz, fee: t ? t.fee : T.fee, min: T.min, shops: T.shops.length + T.svc.length, svc: T.svc.length, theme: THEME[T.key] || '', visited: !!(S.towns23 && S.towns23[T.key]) }); seen.add(T.key); }
    for (const k in OLD) { const A = Town2.areas[k]; if (!A) continue; const t = TAXI_DEST.find(d => d.away === k); out.push({ key: k, n: OLD[k][1], icon: OLD[k][0], size: 'old', tag: OLD[k][2], cx: A.cx, cz: A.cz, fee: t ? t.fee : 300, min: 90, shops: 0, theme: '', visited: false }); }
    const rank = { large: 0, medium: 1, small: 2, old: 3 }; out.sort((a, b) => rank[a.size] - rank[b.size] || b.cx - a.cx);
    return out;
  };
  V25.cityList = cityList;
  const panel = () => {
    const L = cityList(), big = L.filter(c => c.size === 'large').length, med = L.filter(c => c.size === 'medium').length, sm = L.filter(c => c.size === 'small').length;
    const hw = typeof HW !== 'undefined' ? HW : null;
    return `<h5>🌆 เมืองต่างๆ นอกแผนที่ (เมืองใหญ่ ${big} · เมืองกลาง ${med} · เมืองเล็ก ${sm})</h5>
      <p class="lead">เมืองเหล่านี้อยู่ไกลออกไปนอกกรอบแผนที่ (ดูกรอบ "เมืองไกล" มุมขวาล่างของแผนที่) ไปได้ 2 วิธี: <b>🚕 แท็กซี่</b> กดปุ่มด้านล่างได้เลย (ค่าโดยสารตามขนาดเมือง) หรือ <b>🛣️ ขับรถไปเอง</b> ขับรถของคุณไปที่ด่านทางหลวง${hw ? ' (ทางใต้ของเมืองภูผาใหม่ ไอคอน 🛣️ บนแผนที่)' : ''} แล้วเลือกเมือง ค่าทางด่วน 60 ฿ ใช้น้ำมันตามระยะทาง ในเมืองจะมีแท็กซี่พากลับที่ปลายถนน</p>
      <div class="grid">${L.map(c => `<div class="card"><div class="ci">${c.icon}</div><div class="cb"><h4>${esc(c.n)} <span class="dim">· ${c.tag}${c.visited ? ' · ไปแล้ว ✅' : c.size === 'old' ? '' : ' · ยังไม่เคยไป'}</span></h4>
        <p class="dim">${c.shops ? `ร้านค้า/บริการ ${c.shops} แห่ง · ` : ''}${esc(c.theme)}${c.min ? ` · ขับทางหลวง ~${c.min} นาที` : ''}</p>
        <div class="row"><button class="btn" data-a="v25go" data-v="${c.key}" ${S.money < c.fee ? 'disabled' : ''}>🚕 ไปเลย ${baht(c.fee)}</button>${hw ? `<button class="btn ghost" data-a="v25hw" data-v="${c.key}">🛣️ ไปด่านทางหลวง</button>` : ''}</div></div></div>`).join('')}</div>`;
  };
  V25.openCities = () => UI.open('🌆 เมืองต่างๆ', null, panel);
  // inset on the big map: where the far cities lie relative to each other, plus the highway toll plaza on the real map
  const drawInset = () => {
    const cv = document.getElementById('bigmap'), img = World.mapImg; if (!cv || !img) return;
    const g = cv.getContext('2d'), k = cv.width / img.width, toS = (x, z) => [(x - WORLD.minX) / 2 * k, (z - WORLD.minZ) / 2 * k];
    const L = cityList(); if (!L.length) return;
    if (typeof HW !== 'undefined') {
      const [x, y] = toS(HW.x, HW.z), r = cv.width * 0.018;
      g.lineWidth = 4; g.strokeStyle = '#4fc3f7'; g.fillStyle = 'rgba(79,195,247,.3)'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.stroke();
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `${Math.round(cv.width * 0.022)}px "Segoe UI Emoji","Apple Color Emoji",sans-serif`; g.fillStyle = '#fff'; g.fillText('🛣️', x, y);
      g.font = `600 ${Math.round(cv.width * 0.017)}px Kanit, sans-serif`; g.lineWidth = 5; g.strokeStyle = 'rgba(20,35,25,.9)'; g.fillStyle = '#b3e5fc';
      g.strokeText('ด่านทางหลวง → เมืองไกล', x, y - r - 8); g.fillText('ด่านทางหลวง → เมืองไกล', x, y - r - 8);
    }
    const bw = cv.width * 0.46, bh = cv.height * 0.42, bx = cv.width - bw - cv.width * 0.015, by = cv.height - bh - cv.height * 0.015, pad = bw * 0.07;
    g.fillStyle = 'rgba(14,28,22,.86)'; g.strokeStyle = '#7bd389'; g.lineWidth = 3; g.beginPath(); g.rect(bx, by, bw, bh); g.fill(); g.stroke();
    g.textAlign = 'left'; g.textBaseline = 'top'; g.fillStyle = '#e8f5e9'; g.font = `600 ${Math.round(cv.width * 0.02)}px Kanit, sans-serif`;
    g.fillText('🌆 เมืองไกล (นอกแผนที่)', bx + pad, by + pad * 0.6);
    const minX = Math.min(...L.map(c => c.cx)) - 250, maxX = Math.max(...L.map(c => c.cx)) + 250, minZ = Math.min(...L.map(c => c.cz)) - 250, maxZ = Math.max(...L.map(c => c.cz)) + 250;
    const ix = bx + pad, iy = by + pad * 2.4, iw = bw - pad * 2, ih = bh - pad * 3.2;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const c of L) {
      const px = ix + (c.cx - minX) / (maxX - minX) * iw, py = iy + (c.cz - minZ) / (maxZ - minZ) * ih, r = c.size === 'large' ? 0.020 : c.size === 'medium' ? 0.015 : 0.011;
      g.fillStyle = c.visited ? 'rgba(255,207,63,.55)' : 'rgba(129,212,250,.4)'; g.strokeStyle = c.visited ? '#ffcf3f' : '#81d4fa'; g.lineWidth = 3;
      g.beginPath(); g.arc(px, py, cv.width * r, 0, Math.PI * 2); g.fill(); g.stroke();
      g.font = `${Math.round(cv.width * (r * 1.15))}px "Segoe UI Emoji","Apple Color Emoji",sans-serif`; g.fillStyle = '#fff'; g.fillText(c.icon, px, py);
      g.font = `600 ${Math.round(cv.width * 0.0145)}px Kanit, sans-serif`; g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,.8)'; g.fillStyle = '#fff';
      g.strokeText(c.n, px, py + cv.width * (r + 0.011)); g.fillText(c.n, px, py + cv.width * (r + 0.011));
    }
    g.textAlign = 'left'; g.font = `${Math.round(cv.width * 0.0125)}px Kanit, sans-serif`; g.fillStyle = '#b2dfdb';
    g.fillText('วงเหลือง = เคยไปแล้ว · ไปได้ที่ปุ่มใต้แผนที่', bx + pad, by + bh - pad * 0.95);
  };

  // ---------- init ----------
  V23.add('town25', () => {
    const kit = window.V23Kit; if (!kit) return;
    // registry for the government/mall agent: every city, its free lots, and a callback when the city has been built
    window.V25Towns = kit.TOWNS.map(T => { const P = plan(T); return { id: T.key, name: T.n, size: T.size, icon: T.icon, x: T.cx, z: T.cz, rot: 0, lots: P.lots, plaza: P.plaza, shops: T.shops.length + T.svc.length }; });
    for (const T of kit.TOWNS) {
      const A0 = Town2.areas[T.key]; if (!A0 || !A0.lazy || A0._v25) continue; A0._v25 = 1;
      const _l = A0.lazy; A0.lazy = () => { const A = _l(); V25.fire(T.key, A); return A; };
    }
    // map: the panel and the inset go on top of the property markers (Prop23 wraps the map first)
    const _bm = UI.bigMap.bind(UI);
    UI.bigMap = function () {
      _bm(); const c = UI.cur; if (!c || c.title !== 'แผนที่') return; const r = c.render, a = c.after;
      c.render = t => r(t) + panel(); c.after = () => { if (a) a(); try { drawInset(); } catch (e) { console.warn('map inset', e); } }; UI.renderBody();
    };
    UI.H.v25go = d => { const i = TAXI_DEST.findIndex(t => t.away === d.v); if (i < 0) return; const t = TAXI_DEST[i]; if (S.money < t.fee) { UI.toast('เงินไม่พอค่าแท็กซี่ ' + baht(t.fee), '💸'); return; } Town2.taxi(i); };
    UI.H.v25hw = () => {
      if (typeof HW === 'undefined') return;
      const go = window.Prop23 && Prop23.goXZ; if (go) { Prop23.goXZ(HW.x + 6, HW.z + 10, 'ด่านทางหลวง'); UI.toast('ขับรถของคุณเข้าด่านทางหลวง แล้วเลือกเมืองที่จะไป ค่าทาง 60 ฿', '🛣️'); }
      else UI.toast('ด่านทางหลวงอยู่ทางใต้ของเมืองภูผาใหม่ ขับรถเข้าไปแล้วเลือกเมือง', '🛣️');
    };
    UI.H.v25cities = () => V25.openCities();
    // phone app + a shortcut at the bottom of the taxi app
    APPS.push({ id: 'cities', i: '🌆', n: 'เมืองต่างๆ' }); Phone.apps.cities = phoneGo(() => V25.openCities());
    if (typeof APP_GROUPS !== 'undefined') { const g = APP_GROUPS.find(x => /เดินทาง|ท่องเที่ยว|ขนส่ง/.test(x[0])) || APP_GROUPS[0]; if (g && !g[1].includes('cities')) g[1].unshift('cities'); }
    { const _t = Town2.taxiHTML.bind(Town2); Town2.taxiHTML = () => _t() + `<div class="row"><button class="btn ghost" data-a="v25cities">🌆 ดูเมืองต่างๆ ทั้งหมด (${kit.TOWNS.length + 4} เมือง)</button></div>`; }
    // first-visit hint: how to reach the far cities (once per save, old saves included)
    const st = S.v25 = S.v25 || {};
    if (!st.hint) { st.hint = 1; setTimeout(() => { Phone.msg('ข่าวหมู่บ้าน', `เปิดเมืองไกลแล้ว ${kit.TOWNS.length} เมือง (ใหญ่ 4 · กลาง 3 · เล็ก 2) ดูตำแหน่งได้ที่แผนที่ (กด M) หรือแอป 🌆 เมืองต่างๆ ไปได้ด้วยแท็กซี่ หรือขับรถไปด่านทางหลวง 🛣️ ทางใต้ของภูผาใหม่`); UI.toast('มีเมืองใหม่ให้ไปเที่ยว! ดูที่แอป 🌆 เมืองต่างๆ หรือแผนที่ (M)', '🌆'); }, 6000); }
    // audit result for the console: V25.auditAll() -> overlaps per city
    V25.auditAll = () => { const out = {}; for (const T of kit.TOWNS) out[T.key] = T._plan && T.built ? V25.audit(T.key) : 'not built'; out.main = V25.auditMain(); return out; };
  });
})();
