'use strict';
// ---------- World layout ----------
const WORLD = { minX: -260, maxX: 560, minZ: -560, maxZ: 180 };
const ZONES = [
  { id: 'farm', n: 'ฟาร์มของคุณ', x: 0, z: 2, hw: 80, hd: 68 },
  { id: 'village', n: 'หมู่บ้านสุขใจ', x: 0, z: -245, hw: 70, hd: 90 },
  { id: 'seaside', n: 'เมืองริมทะเล', x: 355, z: -385, hw: 72, hd: 60 },
];
const ROADS = [
  { pts: [[0, -58], [0, -130], [0, -250], [0, -335]], w: 8 },
  { pts: [[0, -318], [18, -342], [75, -368], [150, -390], [230, -392], [290, -380], [418, -380]], w: 8 },
];
// the farm's footpaths: one connected network of smooth curves. Every branch starts on the centre line of the path it leaves (so the crossings are clean)
// and ends at the front of the place it serves: gate -> house, workshop, shipping corner, field, pen gate, barn and coop, well, orchard, compost, pond walkway, paddy, greenhouse
const PATHS = [
  { pts: [[0, -57], [0.5, -49], [-2, -42], [-8, -35], [-15, -28.8], [-18.6, -26.2], [-19.6, -25.2]], w: 3.2 },                                            // gate -> house door
  { pts: [[-8, -35], [-10.2, -37.4], [-12.6, -38.7]], w: 2.2 },                                                                               // -> workshop
  { pts: [[-2, -42], [-3, -34], [-3.5, -26], [-4, -19], [-1, -12], [0.5, -4], [1, 4], [-5, 13], [-11.5, 22.5], [-14.8, 27.8], [-17.8, 29.4]], w: 2.8 },          // spine: gate -> bin -> field -> pen gate
  { pts: [[-3.5, -24], [-6, -21.6], [-8.5, -21.8]], w: 2.0 },                                                                                 // -> shipping corner
  { pts: [[-2, -42], [6, -38], [14, -33], [21, -30], [27.5, -30]], w: 2.6 },                                                                  // east to the orchard
  { pts: [[13, -34], [9.5, -29.5], [8, -27.2]], w: 2.0 },                                                                                     // -> well
  { pts: [[21, -30], [23, -24], [24, -16], [24.4, -8], [24, 2], [23.4, 10], [21.8, 15], [21.2, 19], [22.6, 20.2]], w: 2.6 },                                          // east side: compost, field edge, pond walkway
  { pts: [[24, -16], [21.8, -15.6], [19.9, -15.3]], w: 1.8 },                                                                                 // -> compost
  { pts: [[24.4, -8], [34, -8.5], [44, -10], [50, -10.6]], w: 2.4 },                                                                          // -> rice paddy
  { pts: [[23.5, 9.5], [30, 6.8], [38, 6.2], [46, 9], [50, 13.4], [52, 16]], w: 2.4 },                                                              // -> greenhouse
  { pts: [[-5, 13], [-12, 12.9], [-20, 12.9], [-24, 12.8], [-31, 12.9], [-38, 12.6]], w: 1.8 },                                            // barn and coop fronts
];
const FIELD = { x0: 2, z0: -10, step: 2.4, size: 1.8, cols: 6, rows: 5 };
const PEN = { x0: -52, x1: -18, z0: 14, z1: 44 };
const HOUSE_POS = { x: -20, z: -32 };
const IN = new THREE.Vector3(2000, 0, 2000);
const HOUSE_DEF = [
  { w: 8, d: 6.5, h: 3.0, roofH: 2.2, wallTex: 'wood', wall: 0xe9d6b0, roof: 0xb23a2a, winF: [-2.5, 2.5], winS: [0], porch: 3.6, flowers: true, shutter: 0x3d6b4f, pots: true },
  { w: 11, d: 8, h: 3.3, roofH: 2.8, wallTex: 'plaster', wall: 0xf6ecd6, roof: 0x8c3b2a, winF: [-3.6, 3.6], winS: [-1.8, 1.8], winB: [-3, 0, 3], porch: 4.4, chimney: true, flowers: true, shutter: 0x2f5d8a, pots: true, wains: 'stone' },
  { w: 12.5, d: 9, h: 6.0, roofH: 3.2, rows: 2, wallTex: 'plaster', wall: 0xfaf4e8, roof: 0x3b556f, winF: [-4.2, -2.1, 2.1, 4.2], winS: [-2.2, 2.2], winB: [-3.5, 0, 3.5], porch: 5, chimney: true, flowers: true, shutter: 0x6b3f2a, balcony: true, pots: true, wains: 'stone', trimCol: 0x5a3a24 },
];
const ROOM = [[14, 12], [17, 13.5], [20, 15]];   // interior floor sizes (w x d metres): roomy enough to give every fixture its own standing spot
function plotCenter(i) { const c = i % 6, r = (i / 6) | 0; return { x: FIELD.x0 + c * FIELD.step + FIELD.size / 2, z: FIELD.z0 + r * FIELD.step + FIELD.size / 2 }; }
function plotUnlocked(i, lvl) { const c = i % 6, r = (i / 6) | 0; return lvl >= 4 ? true : lvl === 3 ? r < 3 : lvl === 2 ? r < 2 : (r < 2 && c < 3); }
function orchardSpot(i) { return { x: 31 + (i % 3) * 7, z: -36 + ((i / 3) | 0) * 8 }; }
function l2w(x, z, rot, lx, lz) { const c = Math.cos(rot), s = Math.sin(rot); return { x: x + lx * c + lz * s, z: z - lx * s + lz * c }; }
const SWAY = { time: { value: 0 }, wind: { value: 0.3 } };
function addSway(mat, base, amp) {
  mat.onBeforeCompile = sh => {
    sh.uniforms.uTime = SWAY.time; sh.uniforms.uWind = SWAY.wind;
    sh.vertexShader = 'uniform float uTime;\nuniform float uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float hh = max(position.y - ${base.toFixed(2)}, 0.0);
      vec3 ip = vec3(0.0);
      #ifdef USE_INSTANCING
      ip = vec3(instanceMatrix[3][0], 0.0, instanceMatrix[3][2]);
      #else
      ip = vec3(modelMatrix[3][0], 0.0, modelMatrix[3][2]);
      #endif
      float ph = uTime * 1.6 + ip.x * 0.13 + ip.z * 0.17;
      transformed.x += sin(ph) * hh * ${amp.toFixed(3)} * uWind;
      transformed.z += cos(ph * 0.8) * hh * ${(amp * 0.6).toFixed(3)} * uWind;`);
  };
  mat.customProgramCacheKey = () => 'sway' + base + '_' + amp;
  (World.folMats || (World.folMats = [])).push(mat);
  return mat;
}

// ---------- Collision (spatial hash of circles and rotated boxes) ----------
const Col = {
  cs: 8, map: new Map(),
  key(ix, iz) { return ix * 100003 + iz; },
  add(s) {
    s.br = s.type === 'c' ? s.r : Math.hypot(s.hw, s.hd);
    s.cells = [];
    const x0 = Math.floor((s.x - s.br) / this.cs), x1 = Math.floor((s.x + s.br) / this.cs);
    const z0 = Math.floor((s.z - s.br) / this.cs), z1 = Math.floor((s.z + s.br) / this.cs);
    for (let ix = x0; ix <= x1; ix++) for (let iz = z0; iz <= z1; iz++) {
      const k = this.key(ix, iz); let a = this.map.get(k); if (!a) { a = []; this.map.set(k, a); } a.push(s); s.cells.push(k);
    }
    return s;
  },
  remove(s) { if (!s) return; for (const k of s.cells) { const a = this.map.get(k); if (a) { const i = a.indexOf(s); if (i >= 0) a.splice(i, 1); } } },
  box(x, z, hw, hd, rot = 0, tag) { return this.add({ type: 'b', x, z, hw, hd, rot, c: Math.cos(rot), s: Math.sin(rot), tag }); },
  circle(x, z, r, tag) { return this.add({ type: 'c', x, z, r, tag }); },
  hitBig(x, z) {
    const a = this.map.get(this.key(Math.floor(x / this.cs), Math.floor(z / this.cs))); if (!a) return false;
    for (const s of a) {
      if (s.type !== 'b' || s.hw < 1.4 || s.hd < 1.4) continue;
      const dx = x - s.x, dz = z - s.z;
      if (Math.abs(dx * s.c - dz * s.s) < s.hw && Math.abs(dx * s.s + dz * s.c) < s.hd) return true;
    }
    return false;
  },
  push(p, r) {
    let hit = false; const seen = new Set();
    const ix = Math.floor(p.x / this.cs), iz = Math.floor(p.z / this.cs);
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      const a = this.map.get(this.key(ix + dx, iz + dz)); if (!a) continue;
      for (const s of a) {
        if (seen.has(s)) continue; seen.add(s);
        const ddx = p.x - s.x, ddz = p.z - s.z;
        if (s.type === 'c') {
          const d = Math.hypot(ddx, ddz), m = r + s.r;
          if (d < m && d > 1e-5) { p.x = s.x + ddx / d * m; p.z = s.z + ddz / d * m; hit = true; }
        } else {
          let lx = ddx * s.c - ddz * s.s, lz = ddx * s.s + ddz * s.c;
          const cx = U.clamp(lx, -s.hw, s.hw), cz = U.clamp(lz, -s.hd, s.hd);
          const ex = lx - cx, ez = lz - cz, d2 = ex * ex + ez * ez;
          if (d2 < r * r) {
            if (d2 > 1e-8) { const d = Math.sqrt(d2), k = (r - d) / d; lx += ex * k; lz += ez * k; }
            else { const px = s.hw - Math.abs(lx) + r, pz = s.hd - Math.abs(lz) + r; if (px < pz) lx += Math.sign(lx || 1) * px; else lz += Math.sign(lz || 1) * pz; }
            p.x = s.x + lx * s.c + lz * s.s; p.z = s.z - lx * s.s + lz * s.c; hit = true;
          }
        }
      }
    }
    return hit;
  },
};

// ---------- Terrain height ----------
const RG = { cs: 4, nx: 0, nz: 0, d: null };
let ROAD_SEGS = [];
function roadDist(x, z) {
  const fx = (x - WORLD.minX) / RG.cs, fz = (z - WORLD.minZ) / RG.cs;
  if (fx < 0 || fz < 0 || fx >= RG.nx - 1 || fz >= RG.nz - 1) return 200;
  const ix = fx | 0, iz = fz | 0, tx = fx - ix, tz = fz - iz, n = RG.nx, d = RG.d;
  const a = d[iz * n + ix], b = d[iz * n + ix + 1], c = d[(iz + 1) * n + ix], e = d[(iz + 1) * n + ix + 1];
  return U.lerp(U.lerp(a, b, tx), U.lerp(c, e, tx), tz);
}
function zoneDist(x, z) {
  let m = 1e9;
  for (const Z of ZONES) { const dx = Math.max(Math.abs(x - Z.x) - Z.hw, 0), dz = Math.max(Math.abs(z - Z.z) - Z.hd, 0); m = Math.min(m, Math.hypot(dx, dz)); }
  return m;
}
function zoneAt(x, z) { for (const Z of ZONES) if (Math.abs(x - Z.x) < Z.hw && Math.abs(z - Z.z) < Z.hd) return Z; return null; }
// level building pads registered by later scripts before the terrain is built
const FLAT_PADS = [];
function H(x, z) {
  if (x > 2500 || z > 2500) return 0;   // interiors and travel areas are flat
  let pd = 1e9; for (const p of FLAT_PADS) pd = Math.min(pd, Math.hypot(x - p.x, z - p.z) - p.r);
  const d = Math.min(roadDist(x, z) - 6, zoneDist(x, z), pd);
  const t = U.smooth(0, 38, d);
  let h = 0;
  if (t > 0) {
    const n = U.fbm(x * 0.011 + 3.1, z * 0.011 - 7.3, 4);
    h = t * (Math.max(0, n - 0.36) * 42 + U.noise2(x * 0.05, z * 0.05) * 1.6);
  }
  const b = Math.min(x - WORLD.minX, z - WORLD.minZ, WORLD.maxZ - z, x < 380 ? WORLD.maxX - x + 200 : 999);
  if (b < 95) h += Math.pow(1 - b / 95, 2) * 60 * (0.7 + 0.3 * U.noise2(x * 0.03, z * 0.03));
  const s = U.smooth(412, 448, x);
  if (s > 0) h = U.lerp(h, -4.5, s);
  return h;
}

const World = { pois: [], inPois: [], npcSpots: [], extraTrees: [], palms: [], boats: [], anim: [], cull: [] };
// view distance per instanced category (scaled by the quality governor)
const CULL_DIST = { grass: 80, rock: 260, tree: 460 };
World.cullUpdate = function (cx, cz, k) {
  for (const c of this.cull) {
    const d = Math.max(0, Math.hypot(c.x - cx, c.z - cz) - c.r);
    c.o.visible = d < CULL_DIST[c.cat] * k;
    if (c.shadow) c.o.castShadow = d < 70;
  }
};
World.groundY = function (x, z) {
  if (x > 414 && x < 470 && Math.abs(z + 380) < 2.1) return 0.72;
  return H(x, z);
};

World.build = async function (scene, Q, progress) {
  const step = async (msg, fn) => { progress(msg); await new Promise(r => setTimeout(r, 0)); fn(); };
  this.scene = scene; this.Q = Q;
  this.outdoor = new THREE.Group(); scene.add(this.outdoor);
  this.dyn = new THREE.Group(); this.outdoor.add(this.dyn);
  await step('กำลังวางถนน...', () => this.buildRoadGrid());
  await step('กำลังปั้นภูเขาและทุ่งหญ้า...', () => this.buildTerrain());
  await step('กำลังสร้างท้องฟ้าและทะเล...', () => { this.buildSky(); this.buildWater(); this.buildRoads(); this.buildPuddles(); });
  await step('กำลังสร้างฟาร์ม...', () => this.buildFarm());
  await step('กำลังสร้างหมู่บ้าน...', () => this.buildVillage());
  await step('กำลังสร้างเมืองริมทะเล...', () => this.buildSeaside());
  await step('กำลังปลูกต้นไม้...', () => this.buildTrees());
  await step('กำลังสร้างหมู่บ้านจัดสรร...', () => this.buildSuburb && this.buildSuburb());
  await step('กำลังโรยหญ้าและดอกไม้...', () => this.buildGrass());
  await step('กำลังจุดไฟในเมือง...', () => this.buildGlows());
  await step('กำลังวาดแผนที่...', () => this.buildMapImage());
};

World.buildRoadGrid = function () {
  const curves = ROADS.map(r => {
    const c = new THREE.CatmullRomCurve3(r.pts.map(p => new THREE.Vector3(p[0], 0, p[1])), false, 'centripetal');
    return { r, c, sp: c.getSpacedPoints(Math.max(2, Math.ceil(c.getLength() / 2))) };
  });
  this.roadCurves = curves;
  ROAD_SEGS = [];
  for (const { sp } of curves) for (let i = 0; i < sp.length - 1; i++) ROAD_SEGS.push([sp[i].x, sp[i].z, sp[i + 1].x, sp[i + 1].z]);
  RG.nx = (WORLD.maxX - WORLD.minX) / RG.cs + 1; RG.nz = (WORLD.maxZ - WORLD.minZ) / RG.cs + 1;
  RG.d = new Float32Array(RG.nx * RG.nz);
  for (let iz = 0; iz < RG.nz; iz++) for (let ix = 0; ix < RG.nx; ix++) {
    const x = WORLD.minX + ix * RG.cs, z = WORLD.minZ + iz * RG.cs;
    let m = 200;
    for (const s of ROAD_SEGS) {
      if (Math.abs(x - s[0]) > m + 4 && Math.abs(x - s[2]) > m + 4) continue;
      if (Math.abs(z - s[1]) > m + 4 && Math.abs(z - s[3]) > m + 4) continue;
      const vx = s[2] - s[0], vz = s[3] - s[1], wx = x - s[0], wz = z - s[1];
      const t = U.clamp((wx * vx + wz * vz) / (vx * vx + vz * vz), 0, 1);
      const d = Math.hypot(wx - vx * t, wz - vz * t); if (d < m) m = d;
    }
    RG.d[iz * RG.nx + ix] = m;
  }
};

World.buildTerrain = function () {
  const W = WORLD.maxX - WORLD.minX, D = WORLD.maxZ - WORLD.minZ;
  const geo = new THREE.PlaneGeometry(W, D, W / 4, D / 4); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, cols = new Float32Array(pos.count * 3);
  const cx = (WORLD.minX + WORLD.maxX) / 2, cz = (WORLD.minZ + WORLD.maxZ) / 2;
  const C = h => U.col(h);
  const gA = C(0x5c9a34), gB = C(0x86b84a), dry = C(0xb3ad62), rock = C(0x8f877c), sand = C(0xe6d3a0), wet = C(0xa89770), dirt = C(0xa58a5e), dark = C(0x3f7a2c);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + cx, z = pos.getZ(i) + cz, h = H(x, z);
    pos.setXYZ(i, x, h, z);
    const n1 = U.noise2(x * 0.03, z * 0.03), n2 = U.noise2(x * 0.007 + 9, z * 0.007);
    c.copy(gA).lerp(gB, n1);
    c.lerp(dry, U.smooth(0.55, 0.85, n2) * 0.55);
    c.lerp(dark, U.smooth(4, 14, h) * 0.35);
    c.lerp(rock, U.smooth(16, 30, h));
    const rd = roadDist(x, z); if (rd < 8) c.lerp(dirt, (1 - rd / 8) * 0.45);
    const s = U.smooth(396, 414, x); if (s > 0) c.lerp(h < -0.3 ? wet : sand, s);
    cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  geo.computeVertexNormals();
  T.grass.repeat.set(W / 5, D / 5);
  this.terrainMat = new THREE.MeshStandardMaterial({ vertexColors: true, map: T.grass, roughness: 0.95, metalness: 0 });
  const m = new THREE.Mesh(geo, this.terrainMat); m.receiveShadow = true;
  this.outdoor.add(m);
};

World.ribbon = function (pts, w, mat, yoff, vs) {
  const curve = pts.getSpacedPoints ? pts : new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], 0, p[1])), false, 'centripetal');
  const n = Math.max(2, Math.ceil(curve.getLength() / 1.5)), sp = curve.getSpacedPoints(n);
  const P = [], UV = [], I = []; let dist = 0;
  for (let i = 0; i <= n; i++) {
    const a = sp[Math.max(0, i - 1)], b = sp[Math.min(n, i + 1)];
    let tx = b.x - a.x, tz = b.z - a.z; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    const sx = tz, sz = -tx, p = sp[i];
    if (i > 0) dist += sp[i].distanceTo(sp[i - 1]);
    for (const k of [1, -1]) {
      const x = p.x + sx * w / 2 * k, z = p.z + sz * w / 2 * k;
      P.push(x, World.groundY(x, z) + yoff, z); UV.push(k > 0 ? 0 : 1, dist / vs);
    }
    if (i < n) { const o = i * 2; I.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
  g.setIndex(I); g.computeVertexNormals();
  if (g.attributes.normal.getY(0) < 0) { for (let i = 0; i < I.length; i += 3) { const t = I[i + 1]; I[i + 1] = I[i + 2]; I[i + 2] = t; } g.setIndex(I); g.computeVertexNormals(); }
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true; return m;
};
World.buildRoads = function () {
  this.roadMat = new THREE.MeshStandardMaterial({ map: T.road, normalMap: T.road_n || null, roughnessMap: T.road_r || null, roughness: 0.85, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  this.roadCurves.forEach((rc, i) => this.outdoor.add(this.ribbon(rc.c, rc.r.w, this.roadMat, 0.05 + i * 0.01, 8)));
  const dm = new THREE.MeshStandardMaterial({ map: T.dirt, normalMap: T.dirt_n || null, roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  dm.map = T.dirt;
  for (const p of PATHS) this.outdoor.add(this.ribbon(p.pts, p.w, dm, 0.035, 3));
};

// Rain puddles: irregular reflective blobs on roads and farm paths, faded in by wetness
World.winPos = []; World.glows = { lamp: [], win: [] };
World.harvestWindows = function (out, ox = 0, oz = 0) {
  const v = new THREE.Vector3();
  for (const m of this.winMeshes || []) { m.updateMatrixWorld(true); m.localToWorld(v.set(0, 0, 6)); out.push(v.x + ox, v.y, v.z + oz); }
  this.winMeshes = [];
};
// one Points cloud per light group, additive, faded in at night by the game loop
World.glowPoints = function (pos, color, size) {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ map: T.glow, color, size, sizeAttenuation: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  p.frustumCulled = false; this.scene.add(p); return p;
};
World.buildGlows = function () {
  const lp = []; for (const l of this.lampSpots) lp.push(l.x, World.groundY(l.x, l.z) + 4.3, l.z);
  this.glows.lamp.push(this.glowPoints(lp, 0xffd08a, 3.2));
  this.glows.win.push(this.glowPoints(this.winPos, 0xffc56e, 1.7));
  // sea foam along the shoreline
  const fg = new THREE.PlaneGeometry(3.5, 740, 1, 1); fg.rotateX(-Math.PI / 2);
  T.foam.wrapS = T.foam.wrapT = THREE.RepeatWrapping; T.foam.repeat.set(1, 60); T.foam.rotation = Math.PI / 2;
  this.foamMat = new THREE.MeshBasicMaterial({ map: T.foam, transparent: true, opacity: 0.6, depthWrite: false });
  this.foam = new THREE.Mesh(fg, this.foamMat); this.foam.position.set(424.5, -0.7, -190); this.outdoor.add(this.foam);
};

World.buildPuddles = function () {
  const R = U.rng(404), spots = [];
  for (const rc of this.roadCurves) for (let i = 0; i < rc.sp.length; i += 5) {
    if (R() < 0.3) continue;
    const a = rc.sp[i], b = rc.sp[Math.min(rc.sp.length - 1, i + 1)], tx = b.x - a.x, tz = b.z - a.z, l = Math.hypot(tx, tz) || 1, off = (R() - 0.5) * 5.5;
    spots.push([a.x + tz / l * off, a.z - tx / l * off, 0.5 + R() * 1.1, 0.075]);
  }
  for (const p of PATHS) for (const q of p.pts) if (R() < 0.8) spots.push([q[0] + (R() - 0.5) * 1.5, q[1] + (R() - 0.5) * 1.5, 0.4 + R() * 0.6, 0.06]);
  for (let i = 0; i < 14; i++) spots.push([-2 + R() * 22, -14 + R() * 18, 0.35 + R() * 0.5, 0.03]);
  const geos = [], m = new THREE.Matrix4();
  for (const [x, z, r, y] of spots) {
    const sh = new THREE.Shape(), k = R() * 10;
    for (let j = 0; j <= 18; j++) { const a = j / 18 * TAU, rad = r * (0.75 + 0.25 * Math.sin(a * 3 + k) + 0.12 * Math.sin(a * 5 + k * 2)); j ? sh.lineTo(Math.cos(a) * rad, Math.sin(a) * rad * 0.7) : sh.moveTo(Math.cos(a) * rad, Math.sin(a) * rad * 0.7); }
    const g = new THREE.ShapeGeometry(sh, 2); g.rotateX(-Math.PI / 2);
    m.makeRotationY(R() * TAU).setPosition(x, World.groundY(x, z) + y, z);
    geos.push(U.bake(g, m));
  }
  this.puddleMat = new THREE.MeshStandardMaterial({ color: U.col(0x8494a0), roughness: 0.04, metalness: 0.3, normalMap: T.waterN, normalScale: new THREE.Vector2(0.12, 0.12), transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  this.puddles = new THREE.Mesh(U.mergeGeos(geos), this.puddleMat); this.puddles.receiveShadow = true; this.puddles.visible = false;
  this.outdoor.add(this.puddles);
};

World.buildSky = function () {
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), new THREE.ShaderMaterial({
    uniforms: { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, gnd: { value: new THREE.Color() }, sunCol: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, moonDir: { value: new THREE.Vector3(0, -1, 0) }, night: { value: 0 }, rays: { value: 0 }, time: { value: 0 }, moonPh: { value: 3.14 } },
    vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 top, hor, gnd, sunCol; uniform vec3 sunDir, moonDir; uniform float night, rays, time, moonPh; varying vec3 vD;
      float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hs(i), hs(i + vec2(1.0, 0.0)), f.x), mix(hs(i + vec2(0.0, 1.0)), hs(i + vec2(1.0)), f.x), f.y); }
      void main(){ vec3 d = normalize(vD); float h = d.y;
        vec3 c = mix(hor, top, pow(clamp(h, 0.0, 1.0), 0.5));
        c = mix(c, gnd, 1.0 - smoothstep(-0.25, 0.0, h));
        float sd = max(dot(d, sunDir), 0.0);
        c += sunCol * (pow(sd, 1500.0) * 5.0 + pow(sd, 40.0) * 0.25 + pow(sd, 5.0) * 0.14);
        if (rays > 0.001) {
          vec3 ax = normalize(cross(sunDir, vec3(0.0, 1.0, 0.0)) + vec3(1e-4)); vec3 ay = cross(ax, sunDir);
          float an = atan(dot(d, ay), dot(d, ax));
          float st = 0.5 + 0.5 * sin(an * 19.0 + sin(an * 7.0 + time * 0.05) * 2.5);
          st *= 0.55 + 0.45 * sin(an * 31.0 - time * 0.04);
          c += sunCol * rays * pow(sd, 2.2) * st * 0.6 * smoothstep(-0.05, 0.12, h);
        }
        if (night > 0.001) {
          // faint milky way band and a deep blue-violet glow high in the night sky
          vec3 bn = normalize(vec3(0.35, 0.75, 0.55)); float bd = dot(d, bn);
          float band = exp(-bd * bd * 55.0) * (0.45 + 0.55 * vn(d.xz * 6.0 / (0.4 + abs(d.y)) + d.y * 9.0)) * smoothstep(0.02, 0.35, h);
          c += vec3(0.30, 0.34, 0.62) * band * 0.16 * night;
          c += vec3(0.05, 0.07, 0.20) * smoothstep(0.1, 0.9, h) * night * 0.5;
          // the moon: a lit disc with craters and phase, a soft halo and a wide glow
          float md = dot(d, moonDir);
          vec3 ax = normalize(cross(moonDir, vec3(0.0, 1.0, 0.0)) + vec3(1e-4)); vec3 ay = cross(moonDir, ax);
          vec2 uv = vec2(dot(d, ax), dot(d, ay)) / 0.052;
          float r2 = dot(uv, uv);
          float lit = 0.35 + 0.65 * (0.5 - 0.5 * cos(moonPh));
          if (md > 0.0 && r2 < 1.0) {
            vec3 nn = vec3(uv, sqrt(1.0 - r2)); vec3 ld = normalize(vec3(sin(moonPh), 0.25, -cos(moonPh)));
            float df = clamp(dot(nn, ld) * 1.15 + 0.1, 0.0, 1.0);
            float tex = 0.72 + 0.28 * vn(uv * 4.0 + 3.0) + 0.14 * vn(uv * 9.0) - 0.18 * smoothstep(0.55, 0.8, vn(uv * 2.6 + 11.0)) ;
            float cr = smoothstep(0.1, 0.0, abs(length(fract(uv * 3.1 + 0.37) - 0.5) - 0.3)) * 0.08;
            vec3 mc = vec3(1.0, 0.97, 0.88) * (tex - cr) * (0.05 + df * 0.72);
            c = mix(c, mc, smoothstep(1.0, 0.9, sqrt(r2)) * night);
          }
          float md2 = max(md, 0.0);
          c += vec3(0.55, 0.66, 1.0) * (pow(md2, 120.0) * 0.12 * (1.0 - step(1.0, 2.0 - r2)) + pow(md2, 22.0) * 0.22 + pow(md2, 5.0) * 0.08) * night * lit;
        }
        gl_FragColor = vec4(c, 1.0); }`,
    side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false, toneMapped: false,
  }));
  sky.renderOrder = -10; sky.frustumCulled = false; this.sky = sky; this.scene.add(sky);
  const N = 2600, sp = new Float32Array(N * 3), ss = new Float32Array(N), sc = new Float32Array(N * 3), sph = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const a = Math.random() * TAU, e = Math.asin(Math.random() * 0.95 + 0.05); sp.set([Math.cos(a) * Math.cos(e) * 1400, Math.sin(e) * 1400, Math.sin(a) * Math.cos(e) * 1400], i * 3);
    const m = Math.random(); ss[i] = m > 0.97 ? 3.4 : m > 0.85 ? 2.4 : 1.5; sph[i] = Math.random() * 60;
    const t = Math.random(); sc.set(t < 0.25 ? [0.7, 0.8, 1] : t < 0.4 ? [1, 0.85, 0.65] : [1, 1, 1], i * 3);
  }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.setAttribute('sz', new THREE.BufferAttribute(ss, 1)); sg.setAttribute('col', new THREE.BufferAttribute(sc, 3)); sg.setAttribute('ph', new THREE.BufferAttribute(sph, 1));
  const smat = new THREE.ShaderMaterial({
    uniforms: { op: { value: 0 }, time: { value: 0 }, px: { value: 1 } },
    vertexShader: 'attribute float sz, ph; attribute vec3 col; uniform float time, px; varying vec3 vC; varying float vT; void main(){ vC = col; vT = 0.65 + 0.35 * sin(time * (1.5 + fract(ph) * 2.0) + ph); gl_PointSize = sz * px * (0.8 + 0.4 * vT); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float op; varying vec3 vC; varying float vT; void main(){ float r = length(gl_PointCoord - 0.5) * 2.0; float a = smoothstep(1.0, 0.0, r); gl_FragColor = vec4(vC * (0.6 + 0.7 * vT), a * a * op * vT); }',
    transparent: true, depthWrite: false, fog: false, toneMapped: false,
  });
  // the day/night code drives star brightness through .opacity
  Object.defineProperty(smat, 'opacity', { get() { return smat.uniforms.op.value; }, set(v) { smat.uniforms.op.value = v; } });
  this.stars = new THREE.Points(sg, smat);
  this.stars.frustumCulled = false; this.scene.add(this.stars);
  // clouds
  const cg = gcache('cloud', () => {
    const arr = [], m = new THREE.Matrix4(), R = U.rng(3);
    for (let i = 0; i < 16; i++) { const r = 0.45 + R() * 0.6, x = (R() - 0.5) * 3, top = 1 - Math.abs(x) / 1.8; m.makeScale(r * 1.25, r * 0.85, r).setPosition(x, R() * 0.45 * top, (R() - 0.5) * 1.3); arr.push(U.bake(GEO.sph, m)); }
    const cg = U.mergeGeos(arr), p = cg.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < -0.1) p.setY(i, -0.1 + (y + 0.1) * 0.12); }
    return cg;
  });
  this.cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x444444 });
  this.clouds = [];
  const R = U.rng(11);
  for (let i = 0; i < 46; i++) {
    const c = new THREE.Mesh(cg, this.cloudMat); const s = 14 + R() * 22;
    c.scale.set(s, s * (0.7 + R() * 0.4), s * (0.8 + R() * 0.5));
    c.position.set(-500 + R() * 1400, 150 + R() * 70, -900 + R() * 1200); c.rotation.y = R() * TAU;
    this.clouds.push(c); this.scene.add(c);
  }
  // rainbow
  const rb = new THREE.Mesh(new THREE.RingGeometry(260, 300, 96, 1, 0, Math.PI), new THREE.ShaderMaterial({
    uniforms: { op: { value: 0 } }, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide,
    vertexShader: 'varying float r; void main(){ r = length(position.xy); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform float op; varying float r; vec3 hue(float h){ return clamp(abs(mod(h*6.0+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.); }
      void main(){ float t = (r - 260.0) / 40.0; float a = smoothstep(0.0,0.15,t) * smoothstep(1.0,0.85,t); gl_FragColor = vec4(hue(t*0.8), a*op*0.45); }`,
  }));
  rb.visible = false; this.rainbow = rb; this.scene.add(rb);
};

World.buildWater = function () {
  T.waterN.repeat.set(28, 40);
  this.seaMat = new THREE.MeshStandardMaterial({ color: U.col(0x2c84a8), roughness: 0.08, metalness: 0.05, normalMap: T.waterN, transparent: true, opacity: 0.9 });
  this.seaMat.normalScale.set(0.38, 0.38);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1400), this.seaMat);
  sea.rotation.x = -Math.PI / 2; sea.position.set(920, -0.75, -200); sea.receiveShadow = true;
  this.outdoor.add(sea);
  const pn = T.waterN.clone(); pn.needsUpdate = true; pn.repeat.set(3, 3);
  this.pondMat = new THREE.MeshStandardMaterial({ color: U.col(0x3a8aa0), roughness: 0.06, metalness: 0.05, normalMap: pn, transparent: true, opacity: 0.88 });
  this.pondTex = pn;
};

// ---------- Building kit ----------
const M = {};
function initMats() {
  M.glass = U.mat(0x9cc4dc, { roughness: 0.06, metalness: 0.1, emissive: 0xffc56e }); M.glass.emissiveIntensity = 0;
  M.bulb = U.mat(0xfff3d0, { emissive: 0xffd38a, roughness: 0.3 }); M.bulb.emissiveIntensity = 0.1;
  M.trim = mc(0xffffff, { roughness: 0.6 });
  M.darkwood = texMat('wood', 0x6b4426, { roughness: 0.8 });
  M.wood = texMat('wood', 0xb07a4a, { roughness: 0.85 });
  M.stone = texMat('stone', 0xd2cbc0, { roughness: 0.9 });
  M.metal = mc(0x4a5560, { roughness: 0.4, metalness: 0.5 });
  M.gutter = mc(0x8a9097, { roughness: 0.4, metalness: 0.4 });
  M.soilDry = U.mat(0xffffff, { map: T.soil, roughness: 1 });
  M.soilWet = U.mat(0x8a6a58, { map: T.soil, roughness: 0.55 });
  M.water = World.pondMat;
}
function addWindow(g, x, y, z, rot, o = {}) {
  const w = o.w || 1.0, h = o.h || 1.2, wg = new THREE.Group(); wg.position.set(x, y, z); wg.rotation.y = rot; g.add(wg);
  U.mk(wg, GEO.box, M.trim, [0, 0, 0.03], [w + 0.18, h + 0.18, 0.08]);
  (World.winMeshes || (World.winMeshes = [])).push(U.mk(wg, GEO.box, M.glass, [0, 0, 0.06], [w, h, 0.03]));
  U.mk(wg, GEO.box, M.trim, [0, 0, 0.085], [0.05, h, 0.03]);
  U.mk(wg, GEO.box, M.trim, [0, h * 0.1, 0.085], [w, 0.05, 0.03]);
  U.mk(wg, GEO.box, M.trim, [0, -h / 2 - 0.08, 0.1], [w + 0.32, 0.07, 0.2]);
  if (o.shutter != null) for (const s of [-1, 1]) {
    U.mk(wg, GEO.box, mc(o.shutter, { roughness: 0.7 }), [s * (w / 2 + 0.3), 0, 0.06], [0.42, h + 0.1, 0.05]);
  }
  if (o.flowers) {
    U.mk(wg, GEO.box, M.darkwood, [0, -h / 2 - 0.22, 0.18], [w, 0.2, 0.22]);
    const R = U.rng((x * 13 + z * 7) | 0);
    for (let i = 0; i < 6; i++) U.mk(wg, GEO.sphLo, mc([0xe84a6f, 0xf6d13a, 0xf08a2c, 0xc24fd6, 0xffffff][(R() * 5) | 0], { roughness: 0.7 }), [-w / 2 + 0.12 + i * (w - 0.24) / 5, -h / 2 - 0.08, 0.2 + (R() - 0.5) * 0.08], 0.075);
    U.mk(wg, GEO.box, mc(0x4f8a2e), [0, -h / 2 - 0.12, 0.18], [w - 0.1, 0.06, 0.18]);
  }
}
function addDoor(g, x, y, z, color, rot = 0) {
  const dg = new THREE.Group(); dg.position.set(x, y, z); dg.rotation.y = rot; g.add(dg);
  U.mk(dg, GEO.box, M.trim, [0, 1.12, 0.03], [1.36, 2.36, 0.08]);
  U.mk(dg, U.box(1.1, 2.2, 0.08, 1.2), texMat('woodV', color, { roughness: 0.7 }), [0, 1.1, 0.07]);
  for (const yy of [0.6, 1.55]) U.mk(dg, GEO.box, texMat('woodV', color, { roughness: 0.7 }), [0, yy, 0.12], [0.8, 0.6, 0.03]);
  U.mk(dg, GEO.sphLo, mc(0xd8b04a, { metalness: 0.6, roughness: 0.25 }), [0.42, 1.05, 0.15], 0.045);
  U.mk(dg, M.stone ? U.box(1.8, 0.22, 0.7, 2) : GEO.box, M.stone, [0, -0.29, 0.4]);
  U.mk(dg, GEO.box, M.metal, [0.88, 2.45, 0.1], [0.06, 0.06, 0.18]);
  U.mk(dg, GEO.sph, M.bulb, [0.88, 2.35, 0.2], 0.09);
}
World.building = function (o) {
  const g = new THREE.Group(); const w = o.w, d = o.d, h = o.h || 3.2, rh = o.roofH ?? d * 0.35, base = 0.4, top = base + h;
  const ts = o.wallTex === 'wood' ? 2.4 : o.wallTex === 'brick' ? 1.6 : 3;
  const wallM = texMat(o.wallTex || 'plaster', o.wall ?? 0xf2e8d5, { roughness: 0.9 });
  const roofM = texMat('roof', o.roof ?? 0xb5442e, { roughness: 0.75 });
  U.mk(g, U.box(w + 0.3, base, d + 0.3, 2), M.stone, [0, base / 2, 0]);
  U.mk(g, U.box(w, h, d, ts), wallM, [0, base + h / 2, 0]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) U.mk(g, GEO.box, M.trim, [sx * w / 2, base + h / 2, sz * d / 2], [0.16, h, 0.16]);
  if (o.rows === 2) U.mk(g, GEO.box, M.trim, [0, base + h / 2, 0], [w + 0.1, 0.14, d + 0.1]);
  if (o.flat) {
    U.mk(g, U.box(w + 0.5, 0.35, d + 0.5, 3), texMat('plaster', o.roof ?? 0xe5e1d8), [0, top + 0.17, 0]);
  } else {
    const ov = 0.55, hd = d / 2 + ov, k = rh / (d / 2), L = Math.hypot(hd, hd * k), a = Math.atan(k);
    for (const s of [1, -1]) {
      const m = U.mk(g, U.box(w + 2 * ov, 0.16, L, 2.5), roofM, [0, top + rh - hd / 2 * k, s * hd / 2]);
      m.rotation.x = s * a;
    }
    const sh = new THREE.Shape(); sh.moveTo(-d / 2, 0); sh.lineTo(d / 2, 0); sh.lineTo(0, rh); sh.closePath();
    const gg = new THREE.ExtrudeGeometry(sh, { depth: w, bevelEnabled: false }); gg.rotateY(Math.PI / 2); gg.translate(-w / 2, top, 0);
    U.mk(g, gg, wallM);
    U.mk(g, GEO.cyl, roofM, [0, top + rh + 0.05, 0], [0.12, w + 2 * ov, 0.12], [0, 0, Math.PI / 2]);
    if (o.chimney) {
      U.mk(g, U.box(0.8, rh + 1.4, 0.8, 1.6), texMat('brick', 0xffffff), [w * 0.28, top + rh * 0.55, -d * 0.18]);
      U.mk(g, GEO.box, M.stone, [w * 0.28, top + rh * 0.55 + (rh + 1.4) / 2 + 0.06, -d * 0.18], [0.98, 0.12, 0.98]);
    }
    // roof trim: fascia + gutters along the eaves, barge boards up the gables, downpipes, round gable vents
    const eaveY = top - ov * k, trimM = o.trimCol != null ? mc(o.trimCol, { roughness: 0.6 }) : M.trim;
    for (const s of [1, -1]) {
      U.mk(g, GEO.box, trimM, [0, eaveY - 0.06, s * (hd + 0.03)], [w + 2 * ov + 0.1, 0.2, 0.05]);
      U.mk(g, GEO.cyl, M.gutter, [0, eaveY - 0.14, s * (hd + 0.1)], [0.07, w + 2 * ov, 0.07], [0, 0, Math.PI / 2]);
      for (const sx of [-1, 1]) { const bb = U.mk(g, GEO.box, trimM, [sx * (w / 2 + ov + 0.03), top + rh - hd / 2 * k + 0.04, s * hd / 2], [0.06, 0.24, L + 0.05]); bb.rotation.x = s * a; }
      U.mk(g, GEO.cylLo, M.gutter, [s * (w / 2 + 0.14), (base + eaveY) / 2, s * (hd + 0.1)], [0.05, eaveY - base, 0.05]);
    }
    for (const sx of [-1, 1]) {
      U.mk(g, GEO.cyl, trimM, [sx * (w / 2 + 0.02), top + rh * 0.42, 0], [0.34, 0.06, 0.34], [0, 0, Math.PI / 2]);
      U.mk(g, GEO.cyl, M.glass, [sx * (w / 2 + 0.05), top + rh * 0.42, 0], [0.26, 0.04, 0.26], [0, 0, Math.PI / 2]);
    }
  }
  if (o.wains) U.mk(g, U.box(w + 0.06, 0.95, d + 0.06, 1.6), o.wains === 'wood' ? M.darkwood : M.stone, [0, base + 0.47, 0]);
  addDoor(g, o.doorX || 0, base, d / 2, o.door ?? 0x7a4a2a);
  const rows = o.rows === 2 ? [base + 1.55, base + 1.55 + h / 2] : [base + 1.6];
  const wopt = { shutter: o.shutter, flowers: o.flowers, w: o.ww, h: o.wh };
  for (const y of rows) {
    for (const x of (o.winF || [])) addWindow(g, x, y, d / 2, 0, Object.assign({}, wopt, { flowers: o.flowers && y === rows[0] }));
    for (const z of (o.winS || [])) { addWindow(g, w / 2, y, z, Math.PI / 2, wopt); addWindow(g, -w / 2, y, z, -Math.PI / 2, wopt); }
    for (const x of (o.winB || [])) addWindow(g, x, y, -d / 2, Math.PI, wopt);
  }
  if (o.rows === 2) addWindow(g, o.doorX || 0, rows[1], d / 2, 0, wopt);
  if (o.porch) {
    const pw = o.porch;
    U.mk(g, U.box(pw, 0.2, 2.2, 2), M.wood, [0, base - 0.1, d / 2 + 1.1]);
    for (const s of [-1, 1]) U.mk(g, GEO.cyl, M.trim, [s * (pw / 2 - 0.15), base + 1.3, d / 2 + 2.05], [0.08, 2.6, 0.08]);
    const pr = U.mk(g, U.box(pw + 0.4, 0.12, 2.6, 2.5), roofM, [0, base + 2.75, d / 2 + 1.2]); pr.rotation.x = 0.22;
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) U.mk(g, GEO.cylLo, M.trim, [s * (pw / 2 - 0.15), base + 0.45, d / 2 + 0.35 + i * 0.55], [0.03, 0.7, 0.03]);
    for (const s of [-1, 1]) U.mk(g, GEO.box, M.trim, [s * (pw / 2 - 0.15), base + 0.82, d / 2 + 1.2], [0.07, 0.06, 1.8]);
  }
  if (o.balcony) {
    const by = base + h / 2;
    U.mk(g, U.box(w * 0.5, 0.15, 1.4, 2), M.wood, [0, by, -d / 2 - 0.7]);
    for (let i = 0; i <= 10; i++) U.mk(g, GEO.cylLo, M.trim, [-w * 0.25 + i * w * 0.05, by + 0.45, -d / 2 - 1.35], [0.03, 0.9, 0.03]);
    U.mk(g, GEO.box, M.trim, [0, by + 0.92, -d / 2 - 1.35], [w * 0.5, 0.07, 0.08]);
  }
  if (o.sign) {
    const sw = Math.min(w * 0.75, 7), sy = top - 0.62;
    U.mk(g, GEO.box, M.darkwood, [0, sy, d / 2 + 0.05], [sw + 0.2, 1.05, 0.1]);
    const sm = new THREE.MeshStandardMaterial({ map: U.signTex(o.sign, o.signStyle || {}), roughness: 0.7 });
    U.mk(g, new THREE.PlaneGeometry(sw, 0.9), sm, [0, sy, d / 2 + 0.11]);
  }
  if (o.awning) {
    const am = U.mat(o.awning, { map: T.stripes, roughness: 0.9 });
    const aw = U.mk(g, GEO.box, am, [0, base + 2.75, d / 2 + 0.75], [w * 0.92, 0.06, 1.5]); aw.rotation.x = 0.33;
  }
  const dx = o.doorX || 0;
  if (o.canopy && !o.porch) {
    const cp = U.mk(g, U.box(1.9, 0.08, 1.0, 2.5), roofM, [dx, base + 2.62, d / 2 + 0.45]); cp.rotation.x = 0.32;
    for (const sx of [-1, 1]) U.mk(g, GEO.box, M.darkwood, [dx + sx * 0.82, base + 2.42, d / 2 + 0.25], [0.06, 0.06, 0.5], [0.7, 0, 0]);
  }
  if (o.pots) for (const sx of [-1, 1]) {
    const px = dx + sx * (o.porch ? o.porch / 2 + 0.5 : 1.0), pz = d / 2 + (o.porch ? 0.5 : 0.42);
    U.mk(g, lathe('pot3', [[0, 0], [0.17, 0], [0.24, 0.42], [0.2, 0.42], [0.2, 0.38], [0, 0.38]], 14), mc(0xb8653a, { roughness: 0.8 }), [px, 0, pz]);
    U.mk(g, GEO.sph, mc(0x3f7f2c, { roughness: 0.9 }), [px, 0.62, pz], [0.3, 0.32, 0.3]);
    const fc = [0xe84a6f, 0xf6d13a, 0xffffff, 0xc24fd6][(Math.abs(Math.round(w * 7 + d * 3 + sx)) % 4)];
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + sx; U.mk(g, GEO.sphLo, mc(fc, { roughness: 0.7 }), [px + Math.cos(a) * 0.2, 0.78 + (i % 2) * 0.08, pz + Math.sin(a) * 0.2], 0.06); }
  }
  if (o.crates) for (const sx of [-1, 1]) {
    const cx = dx + sx * 2.0, cz = d / 2 + 1.0, cols = sx > 0 ? [0xe8781c, 0xf2c94c, 0xd8261c] : [0x6cb33f, 0xa8d468, 0x4a1f5c];
    U.mk(g, U.box(1.1, 0.5, 0.7, 1.2), M.wood, [cx, 0.25, cz]);
    for (let i = 0; i < 8; i++) U.mk(g, GEO.sphLo, mc(cols[i % 3], { roughness: 0.5 }), [cx - 0.38 + (i % 4) * 0.25, 0.55, cz - 0.15 + ((i / 4) | 0) * 0.3], 0.12);
  }
  if (o.garden) {
    const fz = d / 2 + 3.2, white = M.trim;
    for (let x = -w / 2 - 0.4; x <= w / 2 + 0.4; x += 0.36) if (Math.abs(x - dx) > 0.75) U.mk(g, GEO.box, white, [x, 0.42, fz], [0.08, 0.84, 0.04]);
    for (const sx of [-1, 1]) {
      const x0 = sx < 0 ? -w / 2 - 0.4 : dx + 0.75, x1 = sx < 0 ? dx - 0.75 : w / 2 + 0.4;
      for (const y of [0.3, 0.62]) U.mk(g, GEO.box, white, [(x0 + x1) / 2, y, fz - 0.04], [x1 - x0, 0.06, 0.03]);
    }
    U.mk(g, U.box(1.1, 0.06, 2.7, 2), texMat('paving', 0xe2dbd0), [dx, 0.03, d / 2 + 1.9]);
    const bush = mc(0x4a8a30, { roughness: 0.9 });
    for (const sx of [-1, 1]) for (let i = 0; i < 2; i++) U.mk(g, GEO.sph, bush, [dx + sx * (1.6 + i * 1.4), 0.38, d / 2 + 2.6], [0.55, 0.42, 0.45]);
  }
  if (o.glassFront) {
    // shop front: rows of ordinary framed windows (same style as every other building, so they glow like the rest at night) either side of the door
    const gx = o.doorX || 0, ww = 1.9, wh = h >= 6 ? 1.5 : 1.8, step = 3.3, wopt2 = { w: ww, h: wh };
    const ys = h >= 6 ? [base + 1.55, base + 1.55 + h / 2.2] : [base + 1.65];
    for (const y of ys) for (const sx of [-1, 1]) for (let k = 0; ; k++) {
      const x = gx + sx * (2.5 + k * step); if (Math.abs(x) > w / 2 - 1.2) break;
      addWindow(g, x, y, d / 2, 0, wopt2);
    }
    // entrance canopy over the door
    U.mk(g, GEO.box, M.trim, [gx, base + 2.78, d / 2 + 0.4], [2.7, 0.12, 0.8]);
    for (const sx of [-1, 1]) U.mk(g, GEO.cylLo, M.trim, [gx + sx * 1.2, base + 1.4, d / 2 + 0.72], [0.05, 2.8, 0.05]);
  }
  return g;
};

// ---------- Farm ----------
World.buildFarm = function () {
  initMats();
  const g = new THREE.Group(), out = this.outdoor;
  const woodM = texMat('wood', 0xa77a52, { roughness: 0.9 });
  const fence = (x1, z1, x2, z2, col = true, mat = woodM) => {
    const dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz), n = Math.max(1, Math.round(len / 2.5)), rot = Math.atan2(dx, dz);
    for (let i = 0; i <= n; i++) { const t = i / n; U.mk(g, GEO.cylLo, mat, [x1 + dx * t, 0.55, z1 + dz * t], [0.07, 1.1, 0.07]); }
    for (const y of [0.45, 0.85]) { const m = U.mk(g, U.box(0.06, 0.1, len, 2), mat, [(x1 + x2) / 2, y, (z1 + z2) / 2]); m.rotation.y = rot; }
    if (col) Col.box((x1 + x2) / 2, (z1 + z2) / 2, 0.15, len / 2, rot);
  };
  this.fence = fence;
  fence(-72, -58, -5, -58); fence(5, -58, 72, -58); fence(72, -58, 72, 62); fence(72, 62, -72, 62); fence(-72, 62, -72, -58);
  for (const s of [-1, 1]) { U.mk(g, GEO.cyl, M.darkwood, [s * 5, 2.3, -58], [0.22, 4.6, 0.22]); Col.circle(s * 5, -58, 0.35); }
  U.mk(g, GEO.box, M.darkwood, [0, 4.4, -58], [10.6, 0.3, 0.3]);
  const sTex = U.signTex('ไร่สุขใจ', { w: 512, h: 160, bg: '#7a4a24', fg: '#fff1c9' });
  this.gateMat = new THREE.MeshStandardMaterial({ map: sTex, roughness: 0.7 });
  for (const s of [1, -1]) { const p = U.mk(g, new THREE.PlaneGeometry(4.2, 1.3), this.gateMat, [0, 3.55, -58 + s * -0.08]); p.rotation.y = s > 0 ? Math.PI : 0; }
  // animal pen
  fence(PEN.x0, PEN.z0, PEN.x1, PEN.z0); fence(PEN.x1, PEN.z0, PEN.x1, 27); fence(PEN.x1, 31, PEN.x1, PEN.z1);
  fence(PEN.x1, PEN.z1, PEN.x0, PEN.z1); fence(PEN.x0, PEN.z1, PEN.x0, PEN.z0);
  // barn
  this.buildBarn(g, -38, 5);
  // silo
  U.mk(g, GEO.cyl, texMat('metal', 0xc7cdd2, { roughness: 0.45, metalness: 0.3 }), [-50, 4.6, 3], [2.2, 9.2, 2.2]);
  U.mk(g, GEO.sph, mc(0xa9b2b8, { roughness: 0.35, metalness: 0.4 }), [-50, 9.2, 3], [2.25, 1.4, 2.25]);
  Col.circle(-50, 3, 2.4);
  // coop
  const coop = this.building({ w: 5, d: 4, h: 2.2, roofH: 1.3, wallTex: 'woodV', wall: 0xe4c48c, roof: 0x7b4a2e, door: 0x8a5a32, winS: [0] });
  coop.position.set(-24, 0, 8); g.add(coop); Col.box(-24, 8, 2.7, 2.2);
  // trough
  U.mk(g, U.box(3.2, 0.5, 0.9, 1.5), M.darkwood, [-34, 0.35, 15.2]);
  for (const s of [-1, 1]) U.mk(g, GEO.box, M.darkwood, [-34 + s * 1.4, 0.15, 15.2], [0.15, 0.3, 1.0]);
  Col.box(-34, 15.2, 1.6, 0.45);
  this.troughFeed = U.mk(null, GEO.box, texMat('straw', 0xffffff), [-34, 0.58, 15.2], [3.0, 0.08, 0.7]); out.add(this.troughFeed);
  this.pois.push({ kind: 'trough', x: -34, z: 16.8, r: 2.4, label: 'รางอาหารสัตว์', icon: '🌾' });
  // hay bales
  const hayM = texMat('straw', 0xffffff, { roughness: 1 });
  // hay stack at the left corner of the barn front: two bales on the ground, one on top, all solid
  for (const [x, y, z] of [[-42.3, 0.55, 10.85], [-42.3, 0.55, 11.95], [-42.3, 1.5, 11.4]]) U.mk(g, GEO.cyl, hayM, [x, y, z], [0.55, 1.2, 0.55], [0, 0, Math.PI / 2]);
  Col.box(-42.3, 11.4, 0.75, 1.25);
  // shipping bin
  // shipping corner: a paved pad with the bin in the middle, sacks piled to its right; everything solid, the pad is entered from the south
  {
    const BX = -8.5, BZ = -25.3, pm = texMat('paving', 0xb7ada0);
    U.mk(g, U.box(5.0, 0.1, 3.8, 2), pm, [BX + 0.95, 0.05, -24.6]);   // v132: the pad now only covers the bin and the sacks
    U.mk(g, U.box(1.8, 0.9, 1.1, 1.2), M.wood, [BX, 0.55, BZ]);
    const lid = U.mk(g, U.box(1.9, 0.08, 1.2, 1.2), M.darkwood, [BX, 1.05, BZ - 0.25]); lid.rotation.x = -0.25;
    const bs = new THREE.MeshStandardMaterial({ map: U.signTex('ส่งขาย', { bg: '#2f6d3c' }), roughness: 0.8 });
    U.mk(g, new THREE.PlaneGeometry(1.2, 0.3), bs, [BX, 0.6, BZ + 0.56]);
    Col.box(BX, BZ, 0.95, 0.6);
    for (const [x, z, y] of [[-6.5, -25.2, 0.38], [-6.0, -24.6, 0.38], [-6.7, -24.5, 0.38], [-6.35, -24.9, 0.78]]) U.mk(g, GEO.sph, mc(0xd8c49a, { roughness: 1 }), [x, y, z], [0.32, 0.3, 0.28]);
    Col.box(-6.4, -24.85, 0.65, 0.75);
    this.pois.push({ kind: 'bin', x: BX, z: -23.2, r: 2.0, label: 'กล่องส่งขาย', icon: '📦', map: true });
  }
  // well
  U.mk(g, lathe('well', [[0.62, 0], [0.95, 0], [0.95, 0.85], [0.8, 0.9], [0.62, 0.85]], 22), M.stone, [8, 0, -25]);
  U.mk(g, new THREE.CircleGeometry(0.64, 20), World.pondMat, [8, 0.5, -25], 1, [-Math.PI / 2, 0, 0]);
  for (const s of [-1, 1]) U.mk(g, GEO.cylLo, M.darkwood, [8 + s * 0.85, 1.35, -25], [0.07, 2.0, 0.07]);
  for (const s of [1, -1]) { const r = U.mk(g, U.box(2.2, 0.08, 0.9, 2.5), texMat('roof', 0x8c3b2a), [8, 2.45, -25 + s * 0.38]); r.rotation.x = s * 0.55; }
  U.mk(g, GEO.cyl, M.darkwood, [8, 1.75, -25], [0.08, 1.7, 0.08], [0, 0, Math.PI / 2]);
  U.mk(g, GEO.cyl, mc(0x8a8f94, { metalness: 0.4, roughness: 0.4 }), [8, 1.25, -25], [0.16, 0.3, 0.16]);
  Col.circle(8, -25, 1.0);
  this.pois.push({ kind: 'well', x: 8, z: -25, r: 2.4, label: 'บ่อน้ำ', icon: '💧' });
  // pond
  {
    const sh = new THREE.Shape(), R = U.rng(5);
    for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU, r = 6 + Math.sin(a * 3) * 0.6 + Math.cos(a * 5) * 0.4; if (i === 0) sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); else sh.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    this.fpMat = World.pondMat.clone(); this.fpMat.color = U.col(0x2f7f90); this.fpMat.opacity = 0.74;   // the fish pond is a little clearer and deeper-coloured so the fish show through
    const pw = new THREE.Mesh(new THREE.ShapeGeometry(sh), this.fpMat); pw.rotation.x = -Math.PI / 2; pw.position.set(30, 0.05, 20); pw.receiveShadow = true; out.add(pw);
    const ring = new THREE.Mesh(new THREE.RingGeometry(5.6, 7.4, 48), U.mat(0xb8a27a, { map: T.dirt, roughness: 1 })); ring.rotation.x = -Math.PI / 2; ring.position.set(30, 0.03, 20); ring.receiveShadow = true; out.add(ring);
    const rockM = mc(0x9a948a, { roughness: 0.9 });
    for (let i = 0; i < 26; i++) { const a = R() * TAU, r = 6.6 + R() * 0.8, sx = 0.3 + R() * 0.4, sy = 0.2 + R() * 0.25, sz = 0.3 + R() * 0.4, rx = 30 + Math.cos(a) * r, rz = 20 + Math.sin(a) * r; U.mk(g, GEO.sphLo, rockM, [rx, 0.1, rz], [sx, sy, sz]); if (!(rx < 29.9 && Math.abs(rz - 20) < 1.5)) Col.circle(rx, rz, Math.max(0.3, (sx + sz) / 2 * 0.95)); }   // every rock is solid
    const reed = mc(0x5d7f34, { roughness: 0.8 });
    for (let i = 0; i < 40; i++) { const a = 3.6 + R() * 1.6, r = 5.6 + R() * 0.8; U.mk(g, GEO.cylLo, reed, [30 + Math.cos(a) * r, 0.6, 20 + Math.sin(a) * r], [0.025, 1.2 + R() * 0.5, 0.025], [(R() - 0.5) * 0.3, 0, (R() - 0.5) * 0.3]); }
    const lily = mc(0x4f8f3a, { roughness: 0.6 });
    for (let i = 0; i < 9; i++) { const a = R() * TAU, r = R() * 4.5; U.mk(g, GEO.cyl, lily, [30 + Math.cos(a) * r, 0.08, 20 + Math.sin(a) * r], [0.35, 0.02, 0.35]); if (i % 3 === 0) U.mk(g, GEO.sphLo, mc(0xf5a6c8), [30 + Math.cos(a) * r, 0.16, 20 + Math.sin(a) * r], 0.1); }
    // ---- a wooden walkway from the shore out over the water (23.2 -> 29.2 along z = 20); fish are stocked and fed from its far end only ----
    {
      const pad = mc(0x8a5f3a, { roughness: 0.85 }), pad2 = mc(0x9a6f46, { roughness: 0.85 }), post = M.darkwood;
      for (let k = 0; k < 11; k++) U.mk(g, GEO.box, k % 2 ? pad : pad2, [23.5 + k * 0.56, 0.1, 20], [0.5, 0.1, 2.0]);
      for (let k = 0; k <= 5; k++) for (const sz of [-1, 1]) { const x = 23.7 + k * 1.1; U.mk(g, GEO.cylLo, post, [x, 0.5, 20 + sz * 1.0], [0.07, 1.0, 0.07]); U.mk(g, GEO.cylLo, post, [x, -0.1, 20 + sz * 0.8], [0.09, 0.5, 0.09]); }
      for (const sz of [-1, 1]) { U.mk(g, GEO.box, post, [26.45, 0.92, 20 + sz * 1.0], [5.6, 0.07, 0.07]); U.mk(g, GEO.box, post, [26.45, 0.55, 20 + sz * 1.0], [5.6, 0.05, 0.05]); }
      U.mk(g, GEO.box, post, [29.0, 0.92, 20], [0.07, 0.07, 2.0]); U.mk(g, GEO.box, post, [29.0, 0.55, 20], [0.05, 0.05, 2.0]); U.mk(g, GEO.cylLo, post, [29.0, 0.5, 19.0], [0.07, 1.0, 0.07]); U.mk(g, GEO.cylLo, post, [29.0, 0.5, 21.0], [0.07, 1.0, 0.07]);
      // the sign at the entrance faces the shore
      const fsm = new THREE.MeshStandardMaterial({ map: U.signTex('บ่อเลี้ยงปลา', { w: 512, h: 160, bg: '#2f6f86', fg: '#fff1c9' }), roughness: 0.8, side: THREE.DoubleSide });
      U.mk(g, GEO.cylLo, post, [23.35, 1.0, 18.85], [0.07, 2.0, 0.07]); U.mk(g, GEO.cylLo, post, [23.35, 1.0, 21.15], [0.07, 2.0, 0.07]); U.mk(g, GEO.box, post, [23.35, 2.0, 20], [0.08, 0.08, 2.4]);
      const sg = U.mk(g, new THREE.PlaneGeometry(2.0, 0.62), fsm, [23.33, 1.62, 20]); sg.rotation.y = -Math.PI / 2;
      // solid rails and the end of the walkway, so you can only leave it by the shore
      Col.box(26.45, 19.0, 2.85, 0.07); Col.box(26.45, 21.0, 2.85, 0.07); Col.box(29.05, 20, 0.07, 1.0);
      // a crate of fish feed at the shore beside the walkway
      U.mk(g, U.box(0.9, 0.6, 0.7, 1.2), M.wood, [22.3, 0.3, 18.2]); U.mk(g, GEO.sph, mc(0xd8c49a, { roughness: 1 }), [22.1, 0.72, 18.2], [0.32, 0.22, 0.28]); U.mk(g, GEO.sph, mc(0xd8c49a, { roughness: 1 }), [22.6, 0.68, 18.3], [0.28, 0.2, 0.25]); Col.box(22.3, 18.2, 0.5, 0.4);
      // the water and its shore are solid except along the walkway
      for (let gx = 22.5; gx <= 37.5; gx += 1.0) for (let gz = 12.5; gz <= 27.5; gz += 1.0) {
        const dx = gx - 30, dz = gz - 20, an = Math.atan2(dz, dx), rr = 6 + Math.sin(an * 3) * 0.6 + Math.cos(an * 5) * 0.4;
        if (Math.hypot(dx, dz) > rr + 0.45 || (gx < 29.9 && Math.abs(gz - 20) < 1.25)) continue;
        Col.circle(gx, gz, 0.75);
      }
    }
    this.pois.push({ kind: 'pond', x: 24.2, z: 20, r: 2.2, label: 'บ่อน้ำ', icon: '🎣', map: true });
  }
  // scarecrow
  {
    const sc = Models.human({ shirt: 0xb84a3a, pants: 0x5a6b8a, skin: 0xe9d39b, hair: 0xd9b45a, hat: 'straw', longSleeve: true });
    sc.userData.pose = 'scare'; Models.animHuman(sc, 1, 0, null); sc.position.set(19.8, 0.5, -4); sc.rotation.y = -Math.PI / 2;
    sc.updateMatrixWorld(true); g.add(sc);
    U.mk(g, GEO.cyl, M.darkwood, [19.8, 0.8, -4], [0.06, 1.6, 0.06]);
    Col.circle(19.8, -4, 0.35);
  }
  // mailbox + lamps
  U.mk(g, GEO.cylLo, M.darkwood, [7, 0.6, -55], [0.06, 1.2, 0.06]);
  U.mk(g, capsule(0.18, 0.4), mc(0x2f6db5, { roughness: 0.5 }), [7, 1.3, -55], 1, [Math.PI / 2, 0, 0]);
  for (const [x, z] of [[-7, -56], [7, -60], [-13, -21]]) this.lamp(g, x, z);
  // orchard mounds
  this.orchardGroup = new THREE.Group(); out.add(this.orchardGroup);
  for (let i = 0; i < 6; i++) { const p = orchardSpot(i); U.mk(this.orchardGroup, GEO.sphLo, U.mat(0xffffff, { map: T.soil, roughness: 1 }), [p.x, 0, p.z], [1.1, 0.12, 1.1]); }
  const os = new THREE.MeshStandardMaterial({ map: U.signTex('สวนผลไม้', { bg: '#3f6b2f' }), roughness: 0.8 });
  U.mk(this.orchardGroup, GEO.cylLo, M.darkwood, [28, 0.7, -39], [0.06, 1.4, 0.06]);
  U.mk(this.orchardGroup, new THREE.PlaneGeometry(1.6, 0.4), os, [28, 1.35, -38.95]);
  // decorative trees around the farm
  for (const [x, z] of [[-62, -48], [-66, -20], [-64, 8], [-62, 52], [-40, 55], [-8, 56], [22, 56], [50, 54], [66, 32], [66, 4], [64, -30], [52, -50], [40, -12], [-46, -46], [-34, -18], [-56, 26]]) this.extraTrees.push({ x, z, s: 1.1 + Math.random() * 0.4, type: 'oak' });
  // farmhouse slot
  this.houseGroup = new THREE.Group(); out.add(this.houseGroup);
  // parking hint
  // ---- farm props ----
  const metalM = mc(0x9aa3a8, { roughness: 0.35, metalness: 0.45 }), redM = mc(0xb23a2a, { roughness: 0.6 });
  // wheelbarrow by the field
  {
    const wb = new THREE.Group(); wb.position.set(19.5, 0, -11.5); wb.rotation.y = 0.6; g.add(wb);
    U.mk(wb, lathe('wbTray', [[0, 0], [0.32, 0], [0.5, 0.32], [0.46, 0.34], [0.3, 0.05], [0, 0.05]], 4), redM, [0, 0.42, 0], [1.2, 1, 1.6], [0, Math.PI / 4, 0]);
    U.mk(wb, gcache('wbWheel', () => new THREE.TorusGeometry(0.2, 0.06, 8, 16)), mc(0x222222), [0, 0.24, 0.75], 1, [0, Math.PI / 2, 0]);
    for (const s of [-1, 1]) { U.mk(wb, GEO.cylLo, M.darkwood, [s * 0.28, 0.45, -0.3], [0.03, 1.4, 0.03], [Math.PI / 2 - 0.25, 0, 0]); U.mk(wb, GEO.cylLo, metalM, [s * 0.25, 0.2, -0.35], [0.025, 0.4, 0.025]); }
    U.mk(wb, GEO.sph, texMat('soil', 0xffffff), [0, 0.68, 0], [0.42, 0.12, 0.55]);
  }
  // milk cans and a wall lantern at the barn
  // three milk cans on a low stand to the right of the barn door
  U.mk(g, U.box(1.9, 0.14, 1.3, 1.2), M.wood, [-33.2, 0.07, 11]);
  for (const [x, z] of [[-33.8, 10.7], [-33.1, 10.7], [-33.45, 11.35]]) {
    U.mk(g, lathe('milk', [[0, 0], [0.2, 0], [0.2, 0.55], [0.12, 0.68], [0.12, 0.8], [0.15, 0.82], [0, 0.84]], 16), metalM, [x, 0.14, z]);
  }
  Col.box(-33.2, 11, 0.95, 0.65);
  for (const sx of [-1, 1]) {
    U.mk(g, GEO.box, M.metal, [-38 + sx * 2.6, 3.1, 9.65], [0.08, 0.08, 0.3]);
    U.mk(g, GEO.sph, M.bulb, [-38 + sx * 2.6, 2.95, 9.85], [0.12, 0.16, 0.12]);
    this.winPos.push(-38 + sx * 2.6, 2.95, 9.95);
  }
  // ---- animal pen: worn dirt floor, mud wallow, shade shelter, stone water trough, scattered straw ----
  {
    const sh = new THREE.Shape(), R = U.rng(17), x0 = PEN.x0 + 1.2, x1 = PEN.x1 - 1.2, z0 = PEN.z0 + 1.2, z1 = PEN.z1 - 1.2, pts = [];
    const n = 48;
    for (let i = 0; i < n; i++) {
      const t = i / n * 4, side = Math.floor(t), f = t - side, j = (R() - 0.5) * 1.6;
      if (side === 0) pts.push([U.lerp(x0, x1, f), z0 + j]); else if (side === 1) pts.push([x1 + j, U.lerp(z0, z1, f)]);
      else if (side === 2) pts.push([U.lerp(x1, x0, f), z1 + j]); else pts.push([x0 + j, U.lerp(z1, z0, f)]);
    }
    pts.forEach((p, i) => i ? sh.lineTo(p[0], -p[1]) : sh.moveTo(p[0], -p[1]));
    const dt = T.dirt.clone(); dt.needsUpdate = true; dt.repeat.set(0.3, 0.3);
    const floor = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshStandardMaterial({ map: dt, color: U.col(0xc9b48c), roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = 0.02; floor.receiveShadow = true; out.add(floor);
    const mud = new THREE.Mesh(new THREE.CircleGeometry(2.6, 28), new THREE.MeshStandardMaterial({ color: U.col(0x4a3524), roughness: 0.25, metalness: 0.1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    mud.rotation.x = -Math.PI / 2; mud.scale.set(1.4, 1, 1); mud.position.set(-27, 0.03, 34); mud.receiveShadow = true; out.add(mud);
    const strawM = mc(0xe2c46a, { roughness: 1 });
    for (let i = 0; i < 70; i++) U.mk(g, GEO.sphLo, strawM, [U.lerp(x0 + 1, x1 - 1, R()), 0.02, U.lerp(z0 + 1, z1 - 1, R())], [0.25 + R() * 0.35, 0.02, 0.12 + R() * 0.2], [0, R() * TAU, 0]);
    // shade shelter
    const sx = -45, sz = 37;
    for (const a of [-1, 1]) for (const b of [-1, 1]) U.mk(g, GEO.cylLo, M.darkwood, [sx + a * 2.4, 1.25, sz + b * 1.8], [0.1, 2.5, 0.1]);
    const sr = U.mk(g, U.box(5.6, 0.12, 4.4, 2.5), texMat('roof', 0x7a4a2e), [sx, 2.6, sz]); sr.rotation.x = 0.12;
    U.mk(g, U.box(4.2, 0.5, 3, 1.2), texMat('straw', 0xffffff, { roughness: 1 }), [sx, 0.12, sz], [1, 0.3, 1]);
    Col.circle(sx - 2.4, sz - 1.8, 0.2); Col.circle(sx + 2.4, sz - 1.8, 0.2); Col.circle(sx - 2.4, sz + 1.8, 0.2); Col.circle(sx + 2.4, sz + 1.8, 0.2);
    // stone water trough
    U.mk(g, U.box(2.4, 0.6, 0.9, 1.5), M.stone, [-22, 0.3, 40.5]);
    U.mk(g, new THREE.PlaneGeometry(2.1, 0.62), World.pondMat, [-22, 0.56, 40.5], 1, [-Math.PI / 2, 0, 0]);
    Col.box(-22, 40.5, 1.2, 0.45);
    // nesting boxes on the coop
    // (on the east wall, clear of the door and the path to it)
    for (let i = 0; i < 3; i++) { U.mk(g, U.box(0.6, 0.55, 0.7, 1.2), M.wood, [-21.15, 0.3, 6.9 + i * 0.85]); U.mk(g, GEO.sph, strawM, [-21.15, 0.6, 6.9 + i * 0.85], [0.22, 0.08, 0.28]); }
    Col.box(-21.15, 7.75, 0.35, 1.3);
  }
  // ---- windmill (water pump) by the pond: lattice tower, spinning rotor, tail vane ----
  {
    const wx = 37.5, wz = 11, H = 8.2, legM = mc(0x8a9097, { roughness: 0.4, metalness: 0.5 });
    for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const bx = a * 1.3, bz = b * 1.3, tx = a * 0.3, tz = b * 0.3, len = Math.hypot(bx - tx, H, bz - tz);
      const leg = U.mk(g, GEO.cylLo, legM, [wx + (bx + tx) / 2, H / 2, wz + (bz + tz) / 2], [0.06, len, 0.06]);
      leg.lookAt(wx + tx, H, wz + tz); leg.rotateX(Math.PI / 2);
    }
    for (let k = 1; k <= 3; k++) {
      const y = k * H / 4, r = U.lerp(1.3, 0.3, y / H);
      for (const [a, b, rot] of [[0, -1, 0], [0, 1, 0], [-1, 0, Math.PI / 2], [1, 0, Math.PI / 2]]) U.mk(g, GEO.box, legM, [wx + a * r, y, wz + b * r], [2 * r, 0.05, 0.05], [0, rot, 0]);
    }
    U.mk(g, GEO.box, M.wood, [wx, H, wz], [1.0, 0.1, 1.0]);
    Col.circle(wx, wz, 1.5);
    const head = new THREE.Group(); head.position.set(wx, H + 0.35, wz); out.add(head);
    U.mk(head, GEO.box, legM, [0, 0, -0.3], [0.25, 0.25, 0.9]);
    U.mk(head, GEO.box, redM, [0, 0.1, -1.7], [0.05, 0.9, 1.4]);
    U.mk(head, GEO.cylLo, legM, [0, 0, -1.0], [0.04, 1.4, 0.04], [Math.PI / 2, 0, 0]);
    const rotor = new THREE.Group(); rotor.position.z = 0.25; head.add(rotor);
    U.mk(rotor, GEO.cyl, legM, [0, 0, 0], [0.18, 0.25, 0.18], [Math.PI / 2, 0, 0]);
    const bladeM = mc(0xe8e4dc, { roughness: 0.5, metalness: 0.2 });
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, bl = new THREE.Group(); bl.rotation.z = a; rotor.add(bl); U.mk(bl, GEO.box, bladeM, [0, 0.95, 0], [0.24, 1.4, 0.02], [0.35, 0, 0]); }
    U.mk(rotor, gcache('windRing', () => new THREE.TorusGeometry(1.1, 0.025, 6, 32)), legM);
    this.windmill = { head, rotor };
  }
  // ---- weather vane on the barn ridge ----
  {
    const v = new THREE.Group(); v.position.set(-38, 9.0, 5); out.add(v);
    U.mk(v, GEO.cylLo, M.metal, [0, 0.5, 0], [0.03, 1.0, 0.03]);
    for (const r of [0, Math.PI / 2]) U.mk(v, GEO.box, M.metal, [0, 0.55, 0], [0.7, 0.03, 0.03], [0, r, 0]);
    const arrow = new THREE.Group(); arrow.position.y = 1.0; v.add(arrow);
    const blk = mc(0x1e1e1e, { roughness: 0.4, metalness: 0.4 });
    U.mk(arrow, GEO.box, blk, [0, 0, 0], [0.04, 0.04, 1.2]);
    U.mk(arrow, GEO.cone, blk, [0, 0, 0.66], [0.08, 0.18, 0.03], [Math.PI / 2, 0, 0]);
    U.mk(arrow, GEO.box, blk, [0, 0.08, -0.5], [0.02, 0.28, 0.32]);
    U.mk(arrow, GEO.sph, blk, [0, 0.25, 0.05], [0.07, 0.17, 0.2]);
    U.mk(arrow, GEO.sph, blk, [0, 0.42, 0.17], [0.05, 0.06, 0.06]);
    U.mk(arrow, GEO.cone, mc(0xc0392b), [0, 0.48, 0.15], [0.03, 0.06, 0.03]);
    this.vane = arrow;
  }
  out.add(U.mergeByMaterial(g)); this.harvestWindows(this.winPos);
};
// Remove scattered trees/rocks/bushes (instances + their trunk colliders) around a point, e.g. to open a path
World.clearNear = function (x, z, r, grass) {
  const m4 = new THREE.Matrix4(), v = new THREE.Vector3(), zero = new THREE.Matrix4().makeScale(0, 0, 0);
  for (const c of this.cull) {
    if ((c.cat === 'grass' && !grass) || Math.hypot(c.x - x, c.z - z) > c.r + r + 5) continue;
    const im = c.o; let dirty = false;
    for (let i = 0; i < im.count; i++) { im.getMatrixAt(i, m4); v.setFromMatrixPosition(m4); if (Math.hypot(v.x - x, v.z - z) < r) { im.setMatrixAt(i, zero); dirty = true; } }
    if (dirty) im.instanceMatrix.needsUpdate = true;
  }
  const seen = new Set();
  for (let ix = Math.floor((x - r) / Col.cs) - 1; ix <= Math.floor((x + r) / Col.cs) + 1; ix++) for (let iz = Math.floor((z - r) / Col.cs) - 1; iz <= Math.floor((z + r) / Col.cs) + 1; iz++) {
    for (const s of (Col.map.get(Col.key(ix, iz)) || []).slice()) if (!seen.has(s) && s.type === 'c' && !s.tag && s.r < 1.2 && Math.hypot(s.x - x, s.z - z) < r) { seen.add(s); Col.remove(s); }
  }
};
World.setFarmName = function (name) { this.gateMat.map = U.signTex(name || 'ไร่สุขใจ', { w: 512, h: 160, bg: '#7a4a24', fg: '#fff1c9' }); this.gateMat.needsUpdate = true; };
World.lamp = function (g, x, z) {
  (this.lampSpots || (this.lampSpots = [])).push({ x, z });
  U.mk(g, GEO.cylLo, mc(0x2f3b33, { roughness: 0.5, metalness: 0.3 }), [x, 2.2, z], [0.07, 4.4, 0.07]);
  U.mk(g, GEO.cone, mc(0x2f3b33, { roughness: 0.5, metalness: 0.3 }), [x, 4.55, z], [0.3, 0.3, 0.3]);
  U.mk(g, GEO.sph, M.bulb, [x, 4.3, z], 0.16);
  Col.circle(x, z, 0.2);
};
World.buildBarn = function (g, x, z) {
  const w = 12, d = 9, h = 5, rh = 3.6, base = 0.3;
  const red = texMat('woodV', 0xb5342a, { roughness: 0.8 }), white = M.trim, roof = texMat('roof', 0x6f7478, { roughness: 0.6, metalness: 0.2 });
  const b = new THREE.Group(); b.position.set(x, 0, z); g.add(b);
  U.mk(b, U.box(w + 0.3, base, d + 0.3, 2), M.stone, [0, base / 2, 0]);
  U.mk(b, U.box(w, h, d, 3), red, [0, base + h / 2, 0]);
  const sh = new THREE.Shape(); sh.moveTo(-d / 2, 0); sh.lineTo(d / 2, 0); sh.lineTo(0, rh); sh.closePath();
  const gg = new THREE.ExtrudeGeometry(sh, { depth: w, bevelEnabled: false }); gg.rotateY(Math.PI / 2); gg.translate(-w / 2, base + h, 0);
  U.mk(b, gg, red);
  const ov = 0.6, hd = d / 2 + ov, k = rh / (d / 2), L = Math.hypot(hd, hd * k), a = Math.atan(k);
  for (const s of [1, -1]) { const m = U.mk(b, U.box(w + 1.2, 0.18, L, 2.5), roof, [0, base + h + rh - hd / 2 * k, s * hd / 2]); m.rotation.x = s * a; }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) U.mk(b, GEO.box, white, [sx * w / 2, base + h / 2, sz * d / 2], [0.25, h, 0.25]);
  const dz = d / 2 + 0.05;
  U.mk(b, GEO.box, mc(0x8a2620, { roughness: 0.8 }), [0, base + 1.8, dz], [4, 3.6, 0.1]);
  U.mk(b, GEO.box, white, [0, base + 3.65, dz + 0.05], [4.3, 0.2, 0.12]);
  for (const s of [-1, 1]) U.mk(b, GEO.box, white, [s * 2.05, base + 1.8, dz + 0.05], [0.2, 3.7, 0.12]);
  U.mk(b, GEO.box, white, [0, base + 1.8, dz + 0.05], [0.15, 3.6, 0.12]);
  for (const s of [-1, 1]) { const ln = Math.hypot(2, 3.5); U.mk(b, GEO.box, white, [s * 1.0, base + 1.8, dz + 0.08], [0.16, ln, 0.1], [0, 0, s * Math.atan2(2, 3.5)]); }
  U.mk(b, GEO.box, white, [0, base + h + 1.2, dz - 0.02], [1.6, 1.4, 0.12]);
  U.mk(b, GEO.box, mc(0x3a1a12), [0, base + h + 1.2, dz + 0.02], [1.3, 1.1, 0.1]);
  Col.box(x, z, w / 2 + 0.2, d / 2 + 0.2);
};

World.buildHouse = function (lvl) {
  const hg = this.houseGroup; while (hg.children.length) hg.remove(hg.children[0]);
  (this.houseFenceCols || []).forEach(c => Col.remove(c)); this.houseFenceCols = [];
  const o = HOUSE_DEF[lvl - 1];
  const tmp = new THREE.Group();
  const b = this.building(Object.assign({ door: 0x7a3f22 }, o)); tmp.add(b);
  if (lvl >= 2) {
    const fm = M.trim;
    for (const s of [-1, 1]) {
      const x0 = s * (o.porch / 2 + 0.3), x1 = s * (o.w / 2 + 1.2);
      for (let i = 0; i <= 6; i++) U.mk(tmp, GEO.box, fm, [U.lerp(x0, x1, i / 6), 0.45, o.d / 2 + 2.6], [0.1, 0.9, 0.05]);
      U.mk(tmp, GEO.box, fm, [(x0 + x1) / 2, 0.6, o.d / 2 + 2.6], [Math.abs(x1 - x0), 0.08, 0.05]);
      this.houseFenceCols.push(Col.box(HOUSE_POS.x + (x0 + x1) / 2, HOUSE_POS.z + o.d / 2 + 2.6, Math.abs(x1 - x0) / 2 + 0.08, 0.1));   // the fence is solid
    }
    const bush = mc(0x3f7f2c, { roughness: 0.9 });
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { U.mk(tmp, GEO.sph, bush, [s * (o.porch / 2 + 0.9 + i * 1.1), 0.45, o.d / 2 + 1.2], [0.6, 0.5, 0.55]); this.houseFenceCols.push(Col.circle(HOUSE_POS.x + s * (o.porch / 2 + 0.9 + i * 1.1), HOUSE_POS.z + o.d / 2 + 1.2, 0.5)); }   // and so are the bushes
  }
  const merged = U.mergeByMaterial(tmp);
  const hw = []; this.harvestWindows(hw, HOUSE_POS.x, HOUSE_POS.z);
  if (this.houseGlow) this.scene.remove(this.houseGlow);
  this.houseGlow = this.glowPoints(hw, 0xffc56e, 1.7); this.glows.win.push(this.houseGlow);
  merged.position.set(HOUSE_POS.x, 0, HOUSE_POS.z);
  hg.add(merged);
  Col.remove(this.houseCol);
  this.houseCol = Col.box(HOUSE_POS.x, HOUSE_POS.z, o.w / 2 + 0.25, o.d / 2 + 0.25);
  this.pois = this.pois.filter(p => p.kind !== 'door');
  this.pois.push({ kind: 'door', x: HOUSE_POS.x, z: HOUSE_POS.z + o.d / 2 + 1.4, r: 2.0, label: 'บ้านของคุณ', icon: '🏡', map: true });
  this.houseDoor = { x: HOUSE_POS.x, z: HOUSE_POS.z + o.d / 2 + 2.4 };
};

// ---------- Town dressing helpers ----------
// Festival bunting: a sagging string of colored pennants between two points (vertex-colored triangles)
function bunting(g, x1, z1, x2, z2, y, sag, n, y2d = 0) {
  const P = [], C = [], cols = [0xe53935, 0xfdd835, 0x1e88e5, 0x43a047, 0xffffff, 0xfb8c00].map(U.col);
  const dx = x2 - x1, dz = z2 - z1, yy = t => y + y2d * (1 - t) - Math.sin(t * Math.PI) * sag;
  for (let i = 0; i < n; i++) {
    const t0 = (i + 0.12) / n, t1 = (i + 0.88) / n, tm = (i + 0.5) / n, c = cols[i % cols.length];
    P.push(x1 + dx * t0, yy(t0), z1 + dz * t0, x1 + dx * t1, yy(t1), z1 + dz * t1, x1 + dx * tm, yy(tm) - 0.42, z1 + dz * tm);
    for (let k = 0; k < 3; k++) C.push(c.r, c.g, c.b);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); geo.computeVertexNormals();
  const mat = gcache('buntingM', () => new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.8 }));
  const m = new THREE.Mesh(geo, mat); m.castShadow = false; g.add(m);
  const line = [];
  for (let i = 0; i < 12; i++) { const a = i / 12, b = (i + 1) / 12; line.push([x1 + dx * a, yy(a), z1 + dz * a], [x1 + dx * b, yy(b), z1 + dz * b]); }
  for (let i = 0; i < line.length; i += 2) {
    const [p, q] = [line[i], line[i + 1]], len = Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
    const s = U.mk(g, GEO.cylLo, gcache('twine', () => mc(0x3a3a3a)), [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2], [0.012, len, 0.012]);
    s.lookAt(q[0], q[1], q[2]); s.rotateX(Math.PI / 2); s.castShadow = false;
  }
}
// Stone planter box with a mound of flowers (or a tropical plant)
function planter(g, x, z, rot, round, tropical) {
  const p = new THREE.Group(); p.position.set(x, 0, z); p.rotation.y = rot; g.add(p);
  if (round) U.mk(p, GEO.cyl, M.stone, [0, 0.25, 0], [0.6, 0.5, 0.6]); else U.mk(p, U.box(1.5, 0.5, 0.6, 1.5), M.stone, [0, 0.25, 0]);
  U.mk(p, GEO.box, texMat('soil', 0xffffff), [0, 0.5, 0], round ? [0.9, 0.04, 0.9] : [1.35, 0.04, 0.45]);
  if (tropical) { for (let i = 0; i < 7; i++) leafAt(p, mc(0x3f8a3a, { roughness: 0.7 }), i * 0.9, 0.7, 0.9, 0.16, 0.5); return; }
  const R = U.rng(Math.round(x * 13 + z * 7)), fc = [0xe84a6f, 0xf6d13a, 0xffffff, 0xc24fd6, 0xff8c42];
  U.mk(p, GEO.sph, mc(0x3f7f2c, { roughness: 0.9 }), [0, 0.6, 0], round ? [0.5, 0.22, 0.5] : [0.68, 0.2, 0.26]);
  for (let i = 0; i < 9; i++) U.mk(p, GEO.sphLo, mc(fc[(R() * 5) | 0], { roughness: 0.7 }), round ? [(R() - 0.5) * 0.8, 0.74, (R() - 0.5) * 0.8] : [(R() - 0.5) * 1.2, 0.74, (R() - 0.5) * 0.35], 0.07);
}
// Thai longtail boat: slim hull, garlanded prow, long-shaft engine
function longtail(g, x, y, z, rot) {
  const b = new THREE.Group(); b.position.set(x, y, z); b.rotation.y = rot; g.add(b);
  U.mk(b, lathe('hull', [[0, -0.5], [0.6, -0.4], [0.95, 0], [1.0, 0.35], [0, 0.35]], 20), texMat('wood', 0x8a5a34, { roughness: 0.8 }), [0, 0, 0], [0.55, 0.6, 4.2]);
  U.mk(b, GEO.cone, texMat('wood', 0x8a5a34), [0, 0.45, 4.2], [0.12, 0.9, 0.12], [0.5, 0, 0]);
  const rib = [0xe53935, 0xfdd835, 0x1e88e5, 0x43a047, 0xec407a];
  for (let i = 0; i < 5; i++) U.mk(b, GEO.sphLo, mc(rib[i], { roughness: 0.6 }), [0, 0.5 + i * 0.12, 4.0 + i * 0.07], [0.09, 0.06, 0.12]);
  U.mk(b, GEO.box, mc(0x3a3a3a, { roughness: 0.5, metalness: 0.4 }), [0, 0.45, -3.7], [0.35, 0.35, 0.5]);
  U.mk(b, GEO.cylLo, mc(0x777777, { metalness: 0.5, roughness: 0.4 }), [0, 0.3, -5.0], [0.03, 2.6, 0.03], [Math.PI / 2 + 0.15, 0, 0]);
  for (let i = -1; i <= 1; i++) U.mk(b, GEO.box, M.wood, [0, 0.25, i * 1.3], [0.9, 0.05, 0.25]);
  return b;
}

// ---------- Village ----------
World.buildVillage = function () {
  const g = new THREE.Group();
  const B = (o, x, z, rot, shop, icon) => {
    const b = this.building(o); b.position.set(x, 0, z); b.rotation.y = rot; g.add(b);
    Col.box(x, z, o.w / 2 + 0.3, o.d / 2 + 0.3, rot, 'bld');
    const door = l2w(x, z, rot, o.doorX || 0, o.d / 2 + 1.7);
    if (shop) { this.pois.push({ kind: 'shop', id: shop, x: door.x, z: door.z, r: 2.4, label: SHOPS[shop].n, icon: icon || '🏪', map: true }); this.npcSpots.push({ x: door.x, z: door.z, rot, shop }); }
    else (this.homes || (this.homes = [])).push({ x: door.x, z: door.z, zone: 'village' });
    return door;
  };
  const L = Math.PI / 2, Rr = -Math.PI / 2;
  B({ w: 12, d: 9, h: 4.2, roofH: 2.6, wall: 0xf3e2c0, roof: 0x2f6b3f, sign: 'ร้านเกษตรรุ่งเรือง', signStyle: { bg: '#2f6b3f' }, awning: 0x4caf50, crates: true, wains: 'wood', winF: [-3.6, 3.6], ww: 2, wh: 1.5, winS: [-2, 2] }, -19, -185, L, 'farmshop', '🌱');
  B({ w: 12, d: 9, h: 4.2, roofH: 2.6, wallTex: 'wood', wall: 0xdab688, roof: 0x7a3b22, sign: 'ฟาร์มปศุสัตว์ลุงมี', awning: 0xd8892a, winF: [-3.6, 3.6], ww: 2, wh: 1.5, winS: [0] }, 19, -185, Rr, 'ranch', '🐄');
  B({ w: 12, d: 9, h: 4.2, roofH: 2.6, wallTex: 'wood', wall: 0xc7a27a, roof: 0x5a4636, sign: 'ช่างไม้ & เฟอร์นิเจอร์', signStyle: { bg: '#5a3a22' }, awning: 0x8d6e63, winF: [-3.6, 3.6], ww: 2, wh: 1.5, winS: [-2, 2] }, -19, -215, L, 'carpenter', '🔨');
  B({ w: 15, d: 11, h: 4.6, flat: true, wall: 0xf5f5f2, roof: 0xd8d8d8, sign: 'โชว์รูมรถยนต์สุขใจ', signStyle: { bg: '#1f4e8c' }, glassFront: true, doorX: 5.5, winS: [-2.5, 2.5] }, 22, -218, Rr, 'dealer', '🚗');
  B({ w: 11, d: 8, h: 4.0, roofH: 2.4, wall: 0xf6d9b8, roof: 0xb03a2e, sign: 'ร้านอาหารป้าแดง', signStyle: { bg: '#a3302a' }, awning: 0xe53935, pots: true, winF: [-3.2, 3.2], ww: 1.8, wh: 1.4, winS: [0] }, 19, -252, Rr, 'restaurant', '🍜');
  const houses = [
    [-45, -180, L, 0xf2d7d0, 0x8c3b2a], [-45, -212, L, 0xd6e6f2, 0x3b556f], [-45, -300, L, 0xf3eac2, 0x6b4a2e],
    [-19, -300, L, 0xdcefd8, 0xa0402a], [19, -282, Rr, 0xf6e1c6, 0x2f5d4a], [19, -306, Rr, 0xe8d8f0, 0x5a3e7a],
    [45, -186, Rr, 0xfbe3d2, 0x7a3b22], [45, -214, Rr, 0xe0ecd4, 0x8c3b2a], [45, -252, Rr, 0xf3e6d8, 0x3b556f], [45, -288, Rr, 0xd8e4ef, 0xa0402a],
  ];
  const shut = [0x2f6b3f, 0x2f5d8a, 0x7a3b22, 0x5a3e7a];
  houses.forEach(([x, z, r, wall, roof], i) => B({ w: 9, d: 7, h: 3.2, roofH: 2.3, wall, roof, winF: [-2.6, 2.6], winS: [0], shutter: shut[i % 4], flowers: true, chimney: i % 3 === 0, wains: ['', 'stone', 'wood'][i % 3], canopy: true, pots: true, garden: i % 2 === 0, trimCol: i % 4 === 3 ? 0x6b4426 : null }, x, z, r));
  // display cars at the dealer lot
  for (const [t, zz] of [['oldtruck', -212], ['pickup', -224]]) { const c = Models.car(t); c.g.position.set(11, 0, zz); c.g.rotation.y = -0.6; g.add(c.g); Col.box(11, zz, 1.1, 2.6, -0.6); }
  // sidewalks
  const pave = texMat('paving', 0xe2dbd0, { roughness: 0.9 });
  for (const s of [-1, 1]) U.mk(g, U.box(3, 0.1, 168, 2), pave, [s * 5.6, 0.05, -248]);
  // plaza
  U.mk(g, new THREE.CylinderGeometry(13, 13, 0.1, 48), pave, [-28, 0.05, -265]);
  U.mk(g, U.box(10, 0.1, 4, 2), pave, [-12, 0.05, -265]);
  U.mk(g, lathe('basin', [[0, 0], [3, 0], [3.1, 0.1], [3.1, 0.7], [2.85, 0.75], [2.8, 0.35], [0, 0.35]], 32), M.stone, [-28, 0, -265]);
  U.mk(g, new THREE.CircleGeometry(2.8, 32), World.pondMat, [-28, 0.62, -265], 1, [-Math.PI / 2, 0, 0]);
  U.mk(g, GEO.cyl, M.stone, [-28, 1.2, -265], [0.3, 2.2, 0.3]);
  U.mk(g, lathe('bowl', [[0, 0], [0.9, 0.25], [1.0, 0.35], [0.9, 0.38], [0, 0.2]], 24), M.stone, [-28, 2.1, -265]);
  Col.circle(-28, -265, 3.3);
  this.fountain = { x: -28, z: -265 };
  // sala (Thai pavilion)
  {
    const sx = -30, sz = -241;
    U.mk(g, U.box(7, 0.5, 7, 2), M.stone, [sx, 0.25, sz]);
    for (const a of [-1, 1]) for (const b of [-1, 1]) U.mk(g, GEO.cyl, mc(0xf4efe4), [sx + a * 3, 1.85, sz + b * 3], [0.18, 2.8, 0.18]);
    const rm = mc(0xc0392b, { roughness: 0.6 }), gold = mc(0xe0b13a, { roughness: 0.35, metalness: 0.5 });
    U.mk(g, GEO.box, gold, [sx, 3.3, sz], [7.2, 0.25, 7.2]);
    U.mk(g, gcache('pyr1', () => new THREE.ConeGeometry(5.4, 1.8, 4, 1)), rm, [sx, 4.3, sz], 1, [0, Math.PI / 4, 0]);
    U.mk(g, gcache('pyr2', () => new THREE.ConeGeometry(3.2, 1.8, 4, 1)), rm, [sx, 5.5, sz], 1, [0, Math.PI / 4, 0]);
    U.mk(g, GEO.cone, gold, [sx, 6.9, sz], [0.2, 1.4, 0.2]);
    for (const a of [-1, 1]) U.mk(g, U.box(5.5, 0.12, 0.6, 1.5), M.wood, [sx, 0.95, sz + a * 2.4]);
    Col.box(sx, sz, 3.6, 0.3); Col.box(sx, sz - 3, 3.5, 0.3);
  }
  // market stalls
  [[-20, -275, 0.6], [-36, -276, -0.6], [-40, -260, -1.5]].forEach(([x, z, r], i) => {
    const s = new THREE.Group(); s.position.set(x, 0, z); s.rotation.y = r; g.add(s);
    U.mk(s, U.box(2.4, 0.9, 1.2, 1.2), M.wood, [0, 0.45, 0]);
    for (const a of [-1, 1]) for (const b of [-1, 1]) U.mk(s, GEO.cylLo, M.darkwood, [a * 1.1, 1.2, b * 0.5], [0.05, 2.4, 0.05]);
    const can = U.mk(s, GEO.box, U.mat([0x4caf50, 0xe53935, 0x1e88e5][i], { map: T.stripes, roughness: 0.9 }), [0, 2.45, 0], [2.7, 0.08, 1.6]); can.rotation.x = 0.15;
    const cols = [[0xe8781c, 0xf2c94c, 0xd8261c], [0x6cb33f, 0xa8d468, 0x4a1f5c], [0xf28c1a, 0xf2b233, 0xe3262f]][i];
    for (let k = 0; k < 14; k++) U.mk(s, GEO.sphLo, mc(cols[k % 3], { roughness: 0.5 }), [-0.9 + (k % 7) * 0.3, 0.98, -0.25 + ((k / 7) | 0) * 0.4], 0.11);
    Col.box(x, z, 1.3, 0.7, r);
  });
  // benches
  for (const [x, z, r] of [[-28, -254, 0], [-28, -276, Math.PI], [-17.5, -260, Math.PI / 2]]) {
    const s = new THREE.Group(); s.position.set(x, 0, z); s.rotation.y = r; g.add(s);
    U.mk(s, U.box(1.8, 0.08, 0.5, 1.5), M.wood, [0, 0.45, 0]); U.mk(s, U.box(1.8, 0.4, 0.06, 1.5), M.wood, [0, 0.75, -0.22]);
    for (const a of [-1, 1]) U.mk(s, GEO.box, M.metal, [a * 0.8, 0.22, 0], [0.06, 0.44, 0.45]);
  }
  for (let z = -170; z >= -325; z -= 26) for (const s of [-1, 1]) this.lamp(g, s * 7.4, z);
  // trees
  for (const [x, z] of [[-42, -255], [-14, -248], [-42, -275], [-14, -282], [30, -200], [32, -240], [30, -268], [-32, -198], [-32, -228], [32, -296], [-32, -310]]) this.extraTrees.push({ x, z, s: 0.9 + Math.random() * 0.3, type: 'oak' });
  // ---- street dressing: shade trees, flower planters, festival bunting ----
  for (let z = -183; z >= -322; z -= 26) for (const s of [-1, 1]) {
    if (s > 0 && Math.abs(z + 218) < 13) continue;
    if (s < 0 && z < -248 && z > -282) continue;
    this.extraTrees.push({ x: s * 10.2, z, s: 0.75 + Math.random() * 0.2, type: 'oak' });
  }
  for (let z = -170; z >= -325; z -= 26) for (const s of [-1, 1]) if (!(s > 0 && Math.abs(z + 218) < 13)) planter(g, s * 8.4, z - 6.5, Math.PI / 2);
  for (const z of [-196, -236, -296]) { bunting(g, -7.9, z, 7.9, z, 5.4, 0.9, 16); for (const s of [-1, 1]) U.mk(g, GEO.cylLo, M.darkwood, [s * 7.9, 2.85, z], [0.08, 5.7, 0.08]); }
  // radial bunting over the plaza from the fountain column
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * TAU + 0.3, px = -28 + Math.cos(a) * 12.5, pz = -265 + Math.sin(a) * 12.5;
    U.mk(g, GEO.cylLo, M.darkwood, [px, 2.4, pz], [0.07, 4.8, 0.07]); Col.circle(px, pz, 0.15);
    bunting(g, -28, -265, px, pz, 4.6, 0.6, 12, 4.8 - 4.6);
  }
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; planter(g, -28 + Math.cos(a) * 9, -265 + Math.sin(a) * 9, a + Math.PI / 2, true); }
  {
    const bx = -15.6, bz = -258.5, b = new THREE.Group(); b.position.set(bx, 0, bz); b.rotation.y = Math.PI / 2; g.add(b);
    for (const sx of [-1, 1]) U.mk(b, GEO.cylLo, M.darkwood, [sx * 1.05, 1.2, 0], [0.08, 2.4, 0.08]);
    U.mk(b, GEO.box, M.darkwood, [0, 1.55, 0], [2.2, 1.3, 0.08]);
    U.mk(b, GEO.box, mc(0xc49a6c, { roughness: 1 }), [0, 1.55, 0.045], [2.0, 1.1, 0.02]);
    const rf = U.mk(b, U.box(2.5, 0.08, 0.7, 2.5), texMat('roof', 0x8c3b2a), [0, 2.42, 0.1]); rf.rotation.x = 0.35;
    [[-0.6, 1.8, 0xfffbe8], [0.05, 1.75, 0xfff1c8], [0.65, 1.8, 0xe8f4ff], [-0.4, 1.3, 0xffffff], [0.45, 1.28, 0xfff1c8]].forEach(([x, y, c], i) => {
      U.mk(b, GEO.box, mc(c, { roughness: 0.9 }), [x, y, 0.06], [0.42, 0.34, 0.01], [0, 0, (i % 2 ? 0.06 : -0.05)]);
      U.mk(b, GEO.sphLo, mc([0xe53935, 0x1e88e5, 0x43a047][i % 3]), [x, y + 0.13, 0.07], 0.025);
    });
    Col.box(bx, bz, 0.2, 1.1, Math.PI / 2);
    this.pois.push({ kind: 'board', x: bx + 1.6, z: bz, r: 2.3, label: 'กระดานรับออเดอร์', icon: '📋', map: true });
  }
  // NPC paths
  this.npcRoutes = { village: { lines: [[-5.8, -168, -326], [5.8, -168, -326]], plaza: { x: -28, z: -265, r: 7 } } };
  this.outdoor.add(U.mergeByMaterial(g)); this.harvestWindows(this.winPos);
};

// ---------- Seaside town ----------
World.buildSeaside = function () {
  const g = new THREE.Group();
  const B = (o, x, z, rot, shop, icon) => {
    const b = this.building(o); b.position.set(x, 0, z); b.rotation.y = rot; g.add(b);
    Col.box(x, z, o.w / 2 + 0.3, o.d / 2 + 0.3, rot, 'bld');
    const door = l2w(x, z, rot, o.doorX || 0, o.d / 2 + 1.7);
    if (shop) { this.pois.push({ kind: shop === 'market' ? 'market' : 'shop', id: shop, x: door.x, z: door.z, r: 2.4, label: shop === 'market' ? 'ตลาดริมทะเล (รับซื้อ +50%)' : SHOPS[shop].n, icon: icon || '🏪', map: true }); this.npcSpots.push({ x: door.x, z: door.z, rot, shop }); }
    else (this.homes || (this.homes = [])).push({ x: door.x, z: door.z, zone: 'seaside' });
  };
  const N = 0, S = Math.PI;
  B({ w: 14, d: 9, h: 4.2, roofH: 2.6, wall: 0xa8d8e8, roof: 0xe07a3a, sign: 'ตลาดริมทะเล รับซื้อ +50%', signStyle: { bg: '#1f6f8b' }, awning: 0x29b6f6, crates: true, winF: [-4.2, 4.2], ww: 2.2, wh: 1.5, winS: [0] }, 305, -397, N, 'market', '💰');
  B({ w: 11, d: 8, h: 4.0, roofH: 2.4, wall: 0xd6eccf, roof: 0x4f7f3a, sign: 'ร้านพันธุ์ไม้หายาก', signStyle: { bg: '#3f6b2f' }, awning: 0x66bb6a, winF: [-3.2, 3.2], ww: 1.8, wh: 1.4 }, 326, -397, N, 'rare', '🌴');
  B({ w: 12, d: 8, h: 4.2, flat: true, wall: 0xf7e1e6, roof: 0xf0f0f0, sign: 'บ้านสวยเฟอร์นิเจอร์', signStyle: { bg: '#8e4a6b' }, awning: 0xec407a, winF: [-3.6, 3.6], ww: 2, wh: 1.6 }, 347, -397, N, 'lux', '🛋️');
  B({ w: 15, d: 10, h: 4.6, flat: true, wall: 0xfafafa, roof: 0xdedede, sign: 'ซุปเปอร์คาร์ริมหาด', signStyle: { bg: '#222', fg: '#f2c12e' }, glassFront: true, doorX: 5.5 }, 305, -363, S, 'supercar', '🏎️');
  B({ w: 12, d: 8, h: 4.0, roofH: 2.4, wall: 0xfff1d6, roof: 0x1f6f8b, sign: 'ร้านซีฟู้ดริมหาด', signStyle: { bg: '#1f6f8b' }, awning: 0x29b6f6, winF: [-3.6, 3.6], ww: 1.8, wh: 1.4 }, 327, -363, S, 'seafood', '🦐');
  const pastel = [[0xffd6a5, 0x2f6d8a], [0xcaffbf, 0xe07a3a], [0xbde0fe, 0xb03a2e], [0xffc6ff, 0x3b556f], [0xfdffb6, 0x2f6b3f]];
  [[367, -397, N], [387, -397, N], [347, -363, S], [367, -363, S], [387, -363, S]].forEach(([x, z, r], i) =>
    B({ w: 9, d: 7, h: 3.3, flat: i % 2 === 0, roofH: 2.2, wall: pastel[i][0], roof: i % 2 === 0 ? 0xf2f2f2 : pastel[i][1], winF: [-2.6, 2.6], winS: [0], shutter: 0x2f6d8a, flowers: true, canopy: true, pots: true }, x, z, r));
  const pave = texMat('paving', 0xece4d6, { roughness: 0.9 });
  for (const s of [-1, 1]) U.mk(g, U.box(124, 0.1, 3, 2), pave, [352, 0.05, -380 + s * 5.6]);
  for (let x = 292; x < 412; x += 24) for (const s of [-1, 1]) this.lamp(g, x, -380 + s * 7.4);
  // pier
  const pierM = texMat('wood', 0x9c7650, { roughness: 0.85 });
  U.mk(g, U.box(56, 0.2, 4, 2), pierM, [442, 0.6, -380]);
  for (let x = 416; x <= 470; x += 4) for (const s of [-1, 1]) U.mk(g, GEO.cylLo, M.darkwood, [x, -0.4, -380 + s * 1.9], [0.14, 2.2, 0.14]);
  for (const s of [-1, 1]) U.mk(g, GEO.box, M.darkwood, [442, 1.2, -380 + s * 1.95], [56, 0.08, 0.08]);
  // lighthouse
  {
    const lx = 404, lz = -424;
    U.mk(g, gcache('lh', () => new THREE.CylinderGeometry(1.4, 2.2, 14, 24)), texMat('lighthouse', 0xffffff, { roughness: 0.6 }), [lx, 7, lz]);
    U.mk(g, GEO.cyl, mc(0x333333, { roughness: 0.5 }), [lx, 14.2, lz], [2.0, 0.3, 2.0]);
    U.mk(g, GEO.cyl, M.glass, [lx, 15.3, lz], [1.1, 2.0, 1.1]);
    U.mk(g, GEO.cone, mc(0xb02a2a, { roughness: 0.5 }), [lx, 17.0, lz], [1.4, 1.5, 1.4]);
    Col.circle(lx, lz, 2.4);
    const beam = new THREE.Mesh(new THREE.ConeGeometry(4, 60, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    beam.geometry.translate(0, -30, 0); beam.rotation.z = Math.PI / 2;
    const piv = new THREE.Group(); piv.position.set(lx, 15.3, lz); piv.add(beam); this.outdoor.add(piv);
    this.lighthouse = { piv, beam };
  }
  // boats
  const hull = lathe('hull', [[0, -0.5], [0.6, -0.4], [0.95, 0], [1.0, 0.35], [0, 0.35]], 20);
  for (const [x, z, c] of [[430, -388, 0xe5e5e5], [446, -372, 0x2f6d8a], [458, -389, 0xd84a3a]]) {
    const b = new THREE.Group(); b.position.set(x, -0.6, z); this.outdoor.add(b);
    U.mk(b, hull, mc(c, { roughness: 0.5 }), [0, 0, 0], [1, 1, 2.6]);
    U.mk(b, GEO.box, mc(0xf4f1e8), [0, 0.65, -0.4], [1.1, 0.7, 1.4]);
    U.mk(b, GEO.cylLo, M.darkwood, [0, 2.0, 0.8], [0.06, 3.0, 0.06]);
    this.boats.push(b);
  }
  for (const [x, z, r] of [[438, -396, 0.3], [452, -366, -0.4]]) { const b = new THREE.Group(); b.position.set(x, -0.6, z); this.outdoor.add(b); longtail(b, 0, 0.1, 0, r); this.boats.push(b); }
  this.buoys = [];
  { const R3 = U.rng(9);
    for (let i = 0; i < 9; i++) { const by = new THREE.Group(); by.position.set(440 + R3() * 50, -0.7, -420 + R3() * 80); if (Math.abs(by.position.z + 380) < 4) by.position.z += 8; this.outdoor.add(by);
      U.mk(by, GEO.sph, mc(0xe53935, { roughness: 0.4 }), [0, 0.1, 0], 0.32); U.mk(by, GEO.sph, mc(0xffffff, { roughness: 0.4 }), [0, 0.32, 0], [0.24, 0.12, 0.24]); U.mk(by, GEO.cylLo, M.metal, [0, 0.7, 0], [0.025, 0.6, 0.025]);
      this.buoys.push(by); } }
  this.gulls = [];
  for (let i = 0; i < 7; i++) {
    const gl = new THREE.Group(), wm = mc(0xf5f5f5, { roughness: 0.7 }); this.outdoor.add(gl);
    U.mk(gl, GEO.sph, wm, [0, 0, 0], [0.12, 0.1, 0.32]); U.mk(gl, GEO.cone, mc(0xf2a516), [0, 0.02, 0.36], [0.03, 0.1, 0.03], [Math.PI / 2, 0, 0]);
    const wings = [];
    for (const sd of [-1, 1]) { const w = new THREE.Group(); w.position.set(sd * 0.08, 0.04, 0); gl.add(w); U.mk(w, GEO.box, wm, [sd * 0.45, 0, 0], [0.9, 0.02, 0.24]); U.mk(w, GEO.box, mc(0x555555), [sd * 0.86, 0, -0.02], [0.18, 0.025, 0.2]); wings.push(w); }
    this.gulls.push({ g: gl, wings, r: 14 + Math.random() * 22, h: 10 + Math.random() * 10, a: Math.random() * TAU, sp: 0.12 + Math.random() * 0.12, cx: 420 + Math.random() * 25, cz: -385 + (Math.random() - 0.5) * 40 });
  }
  // beach umbrellas
  const R = U.rng(21);
  for (let i = 0; i < 8; i++) {
    const x = 403 + R() * 9, z = -410 + i * 9 + (i > 3 ? 14 : 0); if (Math.abs(z + 380) < 4) continue;
    U.mk(g, GEO.cylLo, mc(0xeeeeee), [x, 1.2, z], [0.04, 2.4, 0.04]);
    U.mk(g, gcache('umb', () => new THREE.ConeGeometry(1.4, 0.6, 12, 1, true)), U.mat([0xe53935, 0x1e88e5, 0xfdd835][i % 3], { map: T.stripes, side: THREE.DoubleSide, roughness: 0.8 }), [x, 2.4, z]);
    U.mk(g, U.box(0.7, 0.12, 1.8, 1), mc(0xf5f5f5), [x + 1.2, 0.3, z], 1, [0.2, 0, 0]);
  }
  // ---- seaside dressing ----
  for (const x of [312, 342, 372]) { bunting(g, x, -387.6, x, -372.4, 5.2, 0.8, 16); for (const s of [-1, 1]) U.mk(g, GEO.cylLo, M.darkwood, [x, 2.75, -380 + s * 7.6], [0.08, 5.5, 0.08]); }
  for (let x = 300; x < 400; x += 24) for (const s of [-1, 1]) planter(g, x + 12, -380 + s * 8.3, 0, false, true);
  for (const x of [430, 449, 467]) this.lamp(g, x, -381.95);
  // beach cafe kiosk with thatched roof, tables and parasols
  {
    const kx = 408, kz = -352, bam = texMat('woodV', 0xd8b47a, { roughness: 0.9 }), thatch = texMat('straw', 0xffffff, { roughness: 1 });
    U.mk(g, GEO.cyl, bam, [kx, 1.2, kz], [1.8, 2.4, 1.8]);
    U.mk(g, GEO.box, M.darkwood, [kx - 1.75, 1.05, kz], [0.5, 0.12, 2.6]);
    U.mk(g, GEO.box, mc(0x1d2a33, { roughness: 0.3 }), [kx - 1.79, 1.75, kz], [0.04, 0.9, 2.2]);
    U.mk(g, gcache('thatch', () => new THREE.ConeGeometry(3, 1.8, 18)), thatch, [kx, 3.3, kz]);
    const sm = new THREE.MeshStandardMaterial({ map: U.signTex('กาแฟริมหาด', { bg: '#1f6f8b' }), roughness: 0.7 });
    U.mk(g, new THREE.PlaneGeometry(2.2, 0.55), sm, [kx - 1.86, 2.55, kz], 1, [0, -Math.PI / 2, 0]);
    Col.circle(kx, kz, 2.0);
    const umb = gcache('umb', () => new THREE.ConeGeometry(1.4, 0.6, 12, 1, true));
    [[-5, -2], [-5, 2.5], [-2.5, 5]].forEach(([dx, dz], i) => {
      const tx = kx + dx, tz = kz + dz;
      U.mk(g, GEO.cyl, M.wood, [tx, 0.72, tz], [0.5, 0.05, 0.5]); U.mk(g, GEO.cylLo, M.darkwood, [tx, 0.36, tz], [0.05, 0.72, 0.05]);
      for (const a of [0, Math.PI]) U.mk(g, GEO.cyl, M.wood, [tx + Math.cos(a + i) * 0.85, 0.42, tz + Math.sin(a + i) * 0.85], [0.2, 0.06, 0.2]);
      U.mk(g, GEO.cylLo, mc(0xeeeeee), [tx, 1.3, tz], [0.035, 2.6, 0.035]);
      U.mk(g, umb, U.mat([0xff7043, 0x26a69a, 0xffca28][i], { map: T.stripes, side: THREE.DoubleSide, roughness: 0.8 }), [tx, 2.55, tz]);
      U.mk(g, GEO.cylLo, mc(0xf5f5f5, { roughness: 0.2 }), [tx + 0.15, 0.82, tz], [0.05, 0.16, 0.05]);
      Col.circle(tx, tz, 0.55);
    });
  }
  // shoreline rocks
  { const R2 = U.rng(55), rm = mc(0x8f897f, { roughness: 0.9 });
    for (let i = 0; i < 18; i++) { const x = 412 + R2() * 12, z = i < 10 ? -432 + R2() * 18 : -350 + R2() * 10; U.mk(g, GEO.sphLo, rm, [x, H(x, z) + 0.05, z], [0.5 + R2() * 0.9, 0.35 + R2() * 0.5, 0.5 + R2() * 0.8], [0, R2() * 3, 0]); } }
  // beached longtail boats
  for (const [x, z, r] of [[415.5, -397, 1.4], [416, -364, 1.8]]) longtail(g, x, H(x, z) + 0.45, z, r);
  const palmSpots = [];
  for (let x = 296; x < 404; x += 12) palmSpots.push([x, -373.5], [x + 6, -386.5]);
  for (let i = 0; i < 18; i++) palmSpots.push([399 + R() * 12, -440 + R() * 110]);
  for (const [x, z] of palmSpots) if (Math.abs(z + 380) > 3 || x < 400) this.palms.push({ x, z, s: 0.9 + R() * 0.35 });
  for (const [x, z] of [[446, -380], [466, -380], [421, -404], [421, -356]]) this.pois.push({ kind: 'fish', x, z, r: 3, label: 'จุดตกปลา', icon: '🎣', map: x === 466 });
  this.npcRoutes.seaside = { lines: [[-386, 294, 410, true], [-374, 294, 410, true]] };
  this.outdoor.add(U.mergeByMaterial(g)); this.harvestWindows(this.winPos);
};

// ---------- Trees (instanced, chunked) ----------
World.instChunks = function (items, parts, cs, parent) {
  const chunks = new Map();
  for (const it of items) { const k = Math.floor(it.x / cs) + ',' + Math.floor(it.z / cs); if (!chunks.has(k)) chunks.set(k, []); chunks.get(k).push(it); }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  for (const arr of chunks.values()) {
    let cx = 0, cz = 0, cy = 0; for (const it of arr) { cx += it.x; cz += it.z; cy += it.y; } cx /= arr.length; cz /= arr.length; cy /= arr.length;
    let rad = 0; for (const it of arr) rad = Math.max(rad, Math.hypot(it.x - cx, it.z - cz, it.y - cy));
    for (const p of parts) {
      const geo = U.shareGeo(p.geo); geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, cy, cz), rad + p.r);
      const im = new THREE.InstancedMesh(geo, p.mat, arr.length);
      arr.forEach((it, i) => {
        q.setFromEuler(e.set(0, it.r || 0, 0)); m4.compose(v.set(it.x, it.y, it.z), q, sc.set(it.s, it.s * (it.sy || 1), it.s));
        im.setMatrixAt(i, m4); if (p.color) im.setColorAt(i, p.color(it));
      });
      im.castShadow = !!p.shadow; im.receiveShadow = true; parent.add(im);
      this.cull.push({ o: im, x: cx, z: cz, r: rad, cat: p.cat || 'tree', shadow: !!p.shadow });
    }
  }
};
function blobGeo(blobs, seed, seg = 10) {
  const arr = [], R = U.rng(seed);
  for (const [bx, by, bz, r] of blobs) {
    const g = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.7)).toNonIndexed();
    const p = g.attributes.position, n = g.attributes.normal, col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const k = 1 + (U.noise2(x * 2.3 + bx * 3 + 11, z * 2.3 + y * 1.7) - 0.5) * 0.32;
      p.setXYZ(i, bx + x * r * k, by + y * r * k * 0.85, bz + z * r * k);
      n.setXYZ(i, x, y, z);
      const sh = 0.55 + 0.45 * U.clamp((y + 1) / 2, 0, 1);
      col[i * 3] = sh; col[i * 3 + 1] = sh; col[i * 3 + 2] = sh;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    arr.push(g);
  }
  return U.mergeGeos(arr);
}
World.buildTrees = function () {
  const Q = this.Q, R = U.rng(1234), oak = [], pine = [];
  const N = Math.floor(1000 * Q.trees);
  for (let i = 0; i < N * 4 && oak.length + pine.length < N; i++) {
    const x = WORLD.minX + 10 + R() * (WORLD.maxX - WORLD.minX - 20), z = WORLD.minZ + 10 + R() * (WORLD.maxZ - WORLD.minZ - 20);
    if (x > 392) continue;
    if (zoneDist(x, z) < 6 || roadDist(x, z) < 11) continue;
    const h = H(x, z);
    const it = { x, z, y: h - 0.2, s: 0.8 + R() * 0.7, r: R() * TAU, c: R() };
    if (h > 16 || R() < 0.22) pine.push(it); else oak.push(it);
  }
  for (const t of this.extraTrees) oak.push({ x: t.x, z: t.z, y: H(t.x, t.z) - 0.1, s: t.s, r: R() * TAU, c: R() });
  for (const t of oak.concat(pine)) Col.circle(t.x, t.z, 0.45 * t.s);   // v157: every tree is solid, not only those near a zone or road
  const trunkM = U.mat(0x6b4f36, { map: T.woodV, roughness: 0.95 });
  const oakTrunk = gcache('oakT', () => { const g = new THREE.CylinderGeometry(0.2, 0.34, 3.4, 8); g.translate(0, 1.7, 0); return g; });
  const oakFol = blobGeo([[0, 4.2, 0, 1.9], [1.2, 3.6, 0.4, 1.4], [-1.1, 3.7, -0.3, 1.45], [0.2, 3.5, -1.2, 1.3], [-0.3, 3.6, 1.2, 1.3], [0.1, 5.2, 0.1, 1.2]], 5, 8);
  const folM = addSway(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }), 2.5, 0.025);
  const oc = new THREE.Color(), ga = U.col(0x3f7f2a), gb = U.col(0x6aa338), gc = U.col(0x8fae3a);
  this.instChunks(oak, [
    { geo: oakTrunk, mat: trunkM, shadow: true, r: 6 },
    { geo: oakFol, mat: folM, shadow: true, r: 7, color: it => oc.copy(ga).lerp(it.c > 0.85 ? gc : gb, it.c) },
  ], 170, this.outdoor);
  const pineT = gcache('pineT', () => { const g = new THREE.CylinderGeometry(0.14, 0.26, 2.2, 7); g.translate(0, 1.1, 0); return g; });
  const pineF = gcache('pineF', () => {
    const arr = [];
    for (let i = 0; i < 4; i++) {
      const g = new THREE.ConeGeometry(2.3 - i * 0.45, 2.6, 10, 2).toNonIndexed(); g.translate(0, 2.4 + i * 1.35, 0);
      const p = g.attributes.position, col = new Float32Array(p.count * 3);
      for (let k = 0; k < p.count; k++) { const y = p.getY(k), v = 0.5 + 0.5 * U.clamp((y - 1) / 7, 0, 1); col.set([v, v, v], k * 3); }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3)); arr.push(g);
    }
    return U.mergeGeos(arr);
  });
  const pineM = addSway(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }), 2, 0.02);
  const pa = U.col(0x2d5e2e), pb = U.col(0x4a7c3a);
  this.instChunks(pine, [
    { geo: pineT, mat: trunkM, shadow: true, r: 4 },
    { geo: pineF, mat: pineM, shadow: true, r: 8, color: it => oc.copy(pa).lerp(pb, it.c) },
  ], 170, this.outdoor);
  // palms
  const palmT = gcache('palmT', () => {
    const arr = [], m = new THREE.Matrix4();
    for (let i = 0; i < 7; i++) { const g = new THREE.CylinderGeometry(0.17 - i * 0.012, 0.2 - i * 0.012, 1.1, 8); m.makeRotationZ(-0.04 * i).setPosition(i * i * 0.025, 0.55 + i * 1.0, 0); arr.push(U.bake(g, m)); }
    return U.mergeGeos(arr);
  });
  const palmF = gcache('palmF', () => {
    const tmp = new THREE.Group();
    for (let i = 0; i < 9; i++) { const l = leafAt(tmp, null, i / 9 * TAU, -0.35 + (i % 2) * 0.2, 3.2, 0.42, 7.0, 0.1); l.position.x += 1.0; }
    for (let i = 0; i < 4; i++) U.mk(tmp, GEO.sphLo, null, [1.0 + Math.cos(i * 1.6) * 0.25, 6.75, Math.sin(i * 1.6) * 0.25], 0.17);
    tmp.updateMatrixWorld(true); const arr = [];
    tmp.children.forEach(c => arr.push(U.bake(c.geometry, c.matrixWorld)));
    return U.mergeGeos(arr);
  });
  const palms = this.palms.map(p => ({ x: p.x, z: p.z, y: H(p.x, p.z) - 0.1, s: p.s, r: R() * TAU, c: R() }));
  palms.forEach(p => Col.circle(p.x, p.z, 0.3));
  const palmFM = addSway(new THREE.MeshStandardMaterial({ roughness: 0.8, side: THREE.DoubleSide }), 6, 0.05);
  const pc1 = U.col(0x3f8a2a), pc2 = U.col(0x6aa83a);
  this.instChunks(palms, [
    { geo: palmT, mat: U.mat(0x8a6a48, { map: T.woodV, roughness: 0.95 }), shadow: true, r: 9 },
    { geo: palmF, mat: palmFM, shadow: true, r: 9, color: it => oc.copy(pc1).lerp(pc2, it.c) },
  ], 160, this.outdoor);
  // bushes: soft round shrubs along fences, houses, roadsides and forest edges
  const bushes = [], bush = (x, z, s) => bushes.push({ x, z, y: H(x, z) - 0.05, s, r: R() * TAU, c: R() });
  for (let x = -68; x <= 68; x += 3 + R() * 3) { if (Math.abs(x) > 7) bush(x, -55.5 + R(), 0.6 + R() * 0.5); bush(x, 59.5 - R(), 0.6 + R() * 0.5); }
  for (let z = -54; z <= 58; z += 3 + R() * 3) { bush(-69.5 + R(), z, 0.6 + R() * 0.5); bush(69.5 - R(), z, 0.6 + R() * 0.5); }
  for (const h of this.homes || []) for (let k = 0; k < 3; k++) bush(h.x + (R() - 0.5) * 7, h.z + (R() - 0.5) * 2, 0.5 + R() * 0.4);
  for (let i = 0; i < 900 * Q.trees; i++) {
    const x = WORLD.minX + 10 + R() * (WORLD.maxX - WORLD.minX - 20), z = WORLD.minZ + 10 + R() * (WORLD.maxZ - WORLD.minZ - 20);
    if (x > 395) continue; const rd = roadDist(x, z), zd = zoneDist(x, z);
    if (rd < 6.5 || zd < 3 || (rd > 22 && zd > 25 && R() < 0.6)) continue;
    bush(x, z, 0.7 + R() * 0.9);
  }
  const bushG = blobGeo([[0, 0.55, 0, 0.75], [0.55, 0.42, 0.15, 0.55], [-0.5, 0.45, -0.15, 0.6], [0.1, 0.75, -0.25, 0.45]], 21, 8);
  const bc1 = U.col(0x3f7a2c), bc2 = U.col(0x6f9e3a), bfl = U.col(0x9c6aa8);
  this.instChunks(bushes, [{ geo: bushG, mat: addSway(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }), 0.3, 0.03), shadow: true, r: 2, cat: 'rock', color: it => oc.copy(bc1).lerp(it.c > 0.93 ? bfl : bc2, it.c) }], 160, this.outdoor);

  // rocks
  const rocks = [];
  for (let i = 0; i < 260 * Q.trees; i++) {
    const x = WORLD.minX + R() * (WORLD.maxX - WORLD.minX), z = WORLD.minZ + R() * (WORLD.maxZ - WORLD.minZ);
    if (x > 400 || zoneDist(x, z) < 4 || roadDist(x, z) < 8) continue;
    rocks.push({ x, z, y: H(x, z) - 0.2, s: 0.4 + R() * 1.4, sy: 0.6 + R() * 0.4, r: R() * TAU, c: R() });
  }
  const rockG = blobGeo([[0, 0.3, 0, 1]], 9, 8);
  const rc1 = U.col(0x8a857c), rc2 = U.col(0xa8a196);
  this.instChunks(rocks, [{ geo: rockG, mat: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }), shadow: true, r: 3, cat: 'rock', color: it => oc.copy(rc1).lerp(rc2, it.c) }], 200, this.outdoor);
};

World.buildGrass = function () {
  const Q = this.Q, R = U.rng(77);
  const blade = gcache('grass', () => {
    const P = [], C = [], base = U.col(0x5a8a30), tip = U.col(0xbfe07a);
    for (let i = 0; i < 11; i++) {
      const a = R() * TAU, r = R() * 0.22, x = Math.cos(a) * r, z = Math.sin(a) * r, h = 0.16 + R() * 0.24, w = 0.045, lean = (R() - 0.5) * 0.3;
      const ca = Math.cos(a + 1.3) * w, sa = Math.sin(a + 1.3) * w;
      P.push(x - ca, 0, z - sa, x + ca, 0, z + sa, x + lean, h, z + lean * 0.5);
      C.push(base.r, base.g, base.b, base.r, base.g, base.b, tip.r, tip.g, tip.b);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
    g.computeVertexNormals();
    const n = g.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
    return g;
  });
  const items = [], flowers = [];
  const ok = (x, z) => {
    if (x > FIELD.x0 - 1.5 && x < FIELD.x0 + 15.5 && z > FIELD.z0 - 1.5 && z < FIELD.z0 + 13) return false;
    if (Math.hypot(x - 30, z - 20) < 7.6) return false;
    if (Math.abs(x - HOUSE_POS.x) < 9 && Math.abs(z - HOUSE_POS.z) < 9) return false;
    if (Math.abs(x + 38) < 8 && Math.abs(z - 5) < 6) return false;
    if (x > PEN.x0 + 2 && x < PEN.x1 - 2 && z > PEN.z0 + 2 && z < PEN.z1 - 2) return false;
    if (Math.hypot(x - 37.5, z - 11) < 1.6) return false;
    if (roadDist(x, z) < 5) return false;
    for (const p of PATHS) for (const q of p.pts) if (Math.hypot(x - q[0], z - q[1]) < 2.5) return false;
    return true;
  };
  const n1 = Math.floor(8500 * Q.grass);
  for (let i = 0; i < n1; i++) {
    let x, z;
    if (i < n1 * 0.6) { x = -70 + R() * 140; z = -56 + R() * 116; }
    else if (i < n1 * 0.85) { x = -70 + R() * 140; z = -330 + R() * 165; if (Math.abs(x) < 12) continue; }
    else { const a = R() * TAU, r = 30 + R() * 60; x = Math.cos(a) * r; z = Math.sin(a) * r; }
    if (!ok(x, z)) continue;
    items.push({ x, z, y: H(x, z), s: 0.8 + R() * 0.7, r: R() * TAU, c: R() });
  }
  for (let i = 0; i < 1000 * Q.grass; i++) {
    let x, z;
    if (i % 3 === 0) { x = HOUSE_POS.x - 9 + R() * 18; z = HOUSE_POS.z + 5 + R() * 6; }
    else { x = -70 + R() * 140; z = -56 + R() * 116; }
    if (!ok(x, z) && i % 3) continue;
    if (Math.abs(x - HOUSE_POS.x) < 6.5 && Math.abs(z - HOUSE_POS.z) < 7) continue;
    flowers.push({ x, z, y: H(x, z), s: 0.8 + R() * 0.5, r: R() * TAU, c: R() });
  }
  const gm = addSway(new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 1 }), 0, 0.22);
  const gc = new THREE.Color(), g1 = U.col(0xdcebc0), g2 = U.col(0xffffff);
  this.instChunks(items, [{ geo: blade, mat: gm, shadow: false, r: 1, cat: 'grass', color: it => gc.copy(g1).lerp(g2, it.c * 0.6) }], 64, this.outdoor);
  const fl = gcache('flower', () => {
    const tmp = new THREE.Group();
    // a flower is a few centimetres wide and there are hundreds in view: a low-poly stem and petals look identical and cost ~1% of the triangles
    const fStem = new THREE.CylinderGeometry(1, 1, 1, 5), fPet = new THREE.SphereGeometry(1, 6, 4);
    U.mk(tmp, fStem, null, [0, 0.15, 0], [0.012, 0.3, 0.012]);
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; U.mk(tmp, fPet, null, [Math.cos(a) * 0.045, 0.3, Math.sin(a) * 0.045], [0.04, 0.012, 0.04]); }
    tmp.updateMatrixWorld(true); const arr = []; tmp.children.forEach(c => arr.push(U.bake(c.geometry, c.matrixWorld)));
    const m = U.mergeGeos(arr); const col = new Float32Array(m.attributes.position.count * 3);
    for (let i = 0; i < m.attributes.position.count; i++) { const top = m.attributes.position.getY(i) > 0.28; col.set(top ? [1, 1, 1] : [0.25, 0.5, 0.18], i * 3); }
    m.setAttribute('color', new THREE.BufferAttribute(col, 3)); return m;
  });
  const fcols = [0xff6b8a, 0xffd23f, 0xffffff, 0xb57bff, 0xff8c42].map(U.col);
  this.instChunks(flowers, [{ geo: fl, mat: addSway(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 }), 0, 0.15), shadow: false, r: 1, cat: 'grass', color: it => fcols[Math.floor(it.c * 5)] }], 64, this.outdoor);
};

// ---------- Interior ----------
World.buildInterior = function (lvl, S, moving) {
  this.furnObjs = {};
  if (this.interior) this.scene.remove(this.interior);
  (this.inCols || []).forEach(c => Col.remove(c));
  this.inCols = []; this.inPois = [];
  const [w, d] = ROOM[lvl - 1], g = new THREE.Group(); g.position.copy(IN); this.interior = g;
  this.room = { w, d };
  const wall = WALLS[S.decor.wall] || WALLS[0], floor = FLOORS[S.decor.floor] || FLOORS[0];
  const ft = (floor.t === 'wood' ? T.wood : T.tile).clone(); ft.needsUpdate = true; ft.repeat.set(w / (floor.t === 'wood' ? 2.5 : 1.6), d / (floor.t === 'wood' ? 2.5 : 1.6));
  const fm = U.mat(floor.c, { map: ft, roughness: floor.t === 'wood' ? 0.55 : 0.3 });
  U.mk(g, new THREE.PlaneGeometry(w, d), fm, [0, 0, 0], 1, [-Math.PI / 2, 0, 0]);
  const void_ = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial({ color: U.col(0x2a2420) })); void_.rotation.x = -Math.PI / 2; void_.position.y = -0.05; g.add(void_);
  const wt = T.wallpaper.clone(); wt.needsUpdate = true; wt.repeat.set(3, 1);
  const wm = U.mat(wall.c, { map: wt, roughness: 0.9 });
  const bm = mc(0x6b4a30, { roughness: 0.7 });
  const H3 = 3.2;
  // ONE place decides where every fixture stands (x, z, rotation): each interactive spot gets its own standing area (>= 1.4 m apart) so pressing E always
  // reaches the thing in front of you. Other modules read this.lay too (home.js, smarthome.js, v25_home.js).
  const hw = w / 2, hd = d / 2;
  this.lay = {
    bed: [-hw + 1.25, -hd + 1.35, 0], chest: [-hw + 1.25, -hd + 4.8, 0], wardrobe: [-hw + 0.35, hd - 1.75, Math.PI / 2],
    kitchen: [hw - 1.75, -hd + 0.38, 0], fridge: [hw - 4.0, -hd + 0.45, 0], smartfridge: [hw - 5.5, -hd + 0.45, 0], cooler: [hw - 0.45, -hd + 3.0, -Math.PI / 2], desk: [hw - 0.45, -hd + 5.0, -Math.PI / 2],
    aircon: [0.2, -hd + 0.12, 0], hub: [-1.2, -hd + 0.05, 0], fan: [-hw + 3.7, -hd + 0.5, 0], airpurifier: [-hw + 4.4, -hd + 0.4, 0], trophy: [-hw + 5.2, -hd + 0.35, 0], trophy2: [-hw + 5.9, -hd + 0.35, 0],
    table: [hw - 3.6, -hd + 3.9, 0], vase: [hw - 3.6, -hd + 3.9, 0], plant: [hw - 0.5, -hd + 1.6, 0], lanternL: [-2.2, 0.8, 0],
    sofa: [-hw + 2.6, hd - 0.55, Math.PI], tv: [-hw + 2.6, hd - 3.2, 0], console: [-hw + 4.7, hd - 3.2, 0], rug: [-hw + 2.6, hd - 1.9, 0], lamp: [-hw + 0.45, hd - 0.45, 0], elephant: [-3.0, hd - 1.3, Math.PI],
    aquarium: [-hw + 0.35, 0.9, Math.PI / 2], printer3d: [-hw + 0.4, 2.2, Math.PI / 2], bookshelf: [hw - 1.6, hd - 0.25, Math.PI], painting: [hw - 1.6, hd - 0.02, Math.PI], piano: [3.2, hd - 0.6, Math.PI],
    radio: [hw - 0.35, 1.0, -Math.PI / 2], washer: [hw - 0.45, hd - 3.5, -Math.PI / 2], bike: [-1.2, 1.0, 0], massagechair: [-1.5, -1.2, 0], calendar: [-2.4, hd, Math.PI],
  };
  const L = this.lay;
  const walls = [[0, -d / 2, 0, w], [0, d / 2, Math.PI, w], [-w / 2, 0, Math.PI / 2, d], [w / 2, 0, -Math.PI / 2, d]];
  for (const [x, z, r, len] of walls) {
    U.mk(g, new THREE.PlaneGeometry(len, H3), wm, [x, H3 / 2, z], 1, [0, r, 0]);
    const off = 0.01, nx = Math.sin(r) * off, nz = Math.cos(r) * off;
    U.mk(g, new THREE.PlaneGeometry(len, 0.14), bm, [x + nx, 0.07, z + nz], 1, [0, r, 0]);
  }
  this.inWinMat = new THREE.MeshBasicMaterial({ color: 0xbfe0f5 });
  const frame = mc(0xffffff, { roughness: 0.5 });
  const curtainGeo = gcache('curtain', () => { const cg = new THREE.PlaneGeometry(0.6, 1.85, 10, 1), p = cg.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 26) * 0.035); cg.computeVertexNormals(); return cg; });
  const curtainM = gcache('curtainM' + S.decor.wall, () => { const m = U.mat([0xc0504d, 0x2f5d8a, 0x6b8e4e, 0x9a4a7a, 0xd9a02a, 0x5a6470][S.decor.wall] ?? 0xc0504d, { roughness: 0.95 }); return m; });
  // crown molding along the top of each wall
  for (const [x, z, r, len] of walls) U.mk(g, new THREE.PlaneGeometry(len, 0.12), mc(0xffffff, { roughness: 0.6 }), [x + Math.sin(r) * 0.01, 3.14, z + Math.cos(r) * 0.01], 1, [0, r, 0]);
  const winAt = (x, z, r) => {
    const nx = Math.sin(r) * 0.015, nz = Math.cos(r) * 0.015;
    U.mk(g, new THREE.PlaneGeometry(1.5, 1.35), frame, [x + nx, 1.75, z + nz], 1, [0, r, 0]);
    U.mk(g, new THREE.PlaneGeometry(1.3, 1.15), this.inWinMat, [x + nx * 2, 1.75, z + nz * 2], 1, [0, r, 0]);
    U.mk(g, new THREE.PlaneGeometry(0.05, 1.15), frame, [x + nx * 3, 1.75, z + nz * 3], 1, [0, r, 0]);
    const tx = Math.cos(r), tz = -Math.sin(r);
    for (const sd of [-1, 1]) U.mk(g, curtainGeo, curtainM, [x + tx * sd * 0.92 + nx * 5, 1.72, z + tz * sd * 0.92 + nz * 5], 1, [0, r, 0]);
    // the rod is solid, so skip it on the front wall the camera looks through
    if (Math.abs(r - Math.PI) > 0.01) U.mk(g, GEO.cyl, M.darkwood, [x + nx * 7, 2.62, z + nz * 7], [0.025, 2.4, 0.025], [0, r, Math.PI / 2]);
  };
  winAt(-w / 2, -hd * 0.2, Math.PI / 2); winAt(w / 2, hd * 0.35, -Math.PI / 2); winAt(-hw + 4.6, -d / 2, 0);
  winAt(-w / 4 - 0.6, d / 2, Math.PI); winAt(w / 4 + 0.6, d / 2, Math.PI);
  // exit door
  U.mk(g, new THREE.PlaneGeometry(1.2, 2.3), texMat('woodV', 0x7a3f22), [0, 1.15, d / 2 - 0.012], 1, [0, Math.PI, 0]);
  U.mk(g, GEO.sphLo, mc(0xd8b04a, { metalness: 0.6, roughness: 0.3 }), [-0.42, 1.05, d / 2 - 0.05], 0.05);
  const doormat = mc(0x8a5a3a, { roughness: 1 });
  U.mk(g, GEO.box, doormat, [0, 0.01, d / 2 - 0.6], [1.2, 0.02, 0.7]);
  this.inPois.push({ kind: 'exit', x: IN.x, z: IN.z + d / 2 - 0.5, r: 1.4, label: 'ออกจากบ้าน', icon: '🚪' });
  const place = (obj, x, z, rot, cw, cd, poi, key) => {
    if (key) { const sp = S.decor.pos && S.decor.pos[key]; if (sp) { x = sp.x; z = sp.z; rot = sp.r; } this.furnObjs[key] = { obj }; if (key === moving) { cw = 0; poi = null; } }
    obj.position.set(x, 0, z); obj.rotation.y = rot; g.add(obj);
    if (cw) this.inCols.push(Col.box(IN.x + x, IN.z + z, cw, cd, rot));
    if (poi) { const p = l2w(IN.x + x, IN.z + z, rot, 0, cd + 0.7); this.inPois.push(Object.assign({ x: p.x, z: p.z, r: 1.5 }, poi)); }
  };
  place(this.furn.bed(lvl), L.bed[0], L.bed[1], 0, 1.0, 1.25, { kind: 'bed', label: 'นอนหลับ', icon: '🛏️' }, 'bed');
  place(this.furn.kitchen(), L.kitchen[0], L.kitchen[1], 0, 1.6, 0.38, { kind: 'kitchen', label: 'ครัว (ทำอาหาร)', icon: '🍳' }, 'kitchen');
  place(this.furn.fridge(), L.fridge[0], L.fridge[1], 0, 0.45, 0.4, { kind: 'fridge', label: 'ตู้เย็น (ของกิน)', icon: '🧊' }, 'fridge');
  const has = k => S.furn[k] && !S.decor.hide[k];
  const placeK = (key, obj, x, z, rot, cw, cd, poi) => place(obj, x, z, rot, cw, cd, poi, key);
  const PK = (k, obj, cw, cd, poi) => { const q = L[k]; placeK(k, obj, q[0], q[1], q[2], cw, cd, poi); };
  if (has('rug')) PK('rug', this.furn.rug());
  if (has('sofa')) PK('sofa', this.furn.sofa(), 1.1, 0.45);
  if (has('tv')) PK('tv', this.furn.tv(), 0.8, 0.25, { kind: 'tv', label: 'ดูพยากรณ์อากาศ', icon: '📺' });
  if (has('table')) PK('table', this.furn.table(), 0.8, 0.6);
  if (has('plant')) PK('plant', this.furn.plant(), 0.3, 0.3);
  if (has('bookshelf')) PK('bookshelf', this.furn.bookshelf(), 0.7, 0.22);
  if (has('lamp')) PK('lamp', this.furn.lamp(), 0.2, 0.2);
  if (has('painting')) PK('painting', this.furn.painting());
  if (has('piano')) PK('piano', this.furn.piano(), 0.75, 0.35, { kind: 'piano', label: 'เล่นเปียโน', icon: '🎹' });
  if (has('elephant')) PK('elephant', this.furn.elephant(), 0.4, 0.3);
  if (has('lanternL')) PK('lanternL', this.furn.lanternL());
  if (has('trophy')) PK('trophy', this.furn.trophy(), 0.3, 0.25);
  if (has('trophy2')) { const t2 = this.furn.trophy(); t2.scale.setScalar(1.25); PK('trophy2', t2, 0.3, 0.25); }
  if (has('flowers')) { const q = L.vase; placeK('flowers', this.furn.vase(), q[0] + 1.5, q[1] + 0.2, 0, 0.25, 0.25); }
  if (has('aquarium')) PK('aquarium', this.furn.aquarium(), 0.7, 0.3);
  if (typeof Home !== 'undefined') Home.place(this, has, placeK, w, d);
  // everyday fixtures: wardrobe, storage chest, shower, computer desk, calendar, pet bed
  place(this.furn.wardrobe(), L.wardrobe[0], L.wardrobe[1], L.wardrobe[2], 0.6, 0.3, { kind: 'wardrobe', label: 'ตู้เสื้อผ้า (แต่งตัว/ตั้งชื่อ)', icon: '👕' }, 'wardrobe');
  place(this.furn.chest(), L.chest[0], L.chest[1], 0, 0.5, 0.28, { kind: 'chest', label: 'หีบเก็บของ', icon: '🧰' }, 'chest');
  place(this.furn.shower(), w / 2 - 0.75, d / 2 - 0.75, Math.PI, 0, 0);
  this.inPois.push({ kind: 'shower', x: IN.x + w / 2 - 0.75, z: IN.z + d / 2 - 0.75, r: 1.2, label: 'อาบน้ำ', icon: '🚿' });
  this.inCols.push(Col.box(IN.x + w / 2 - 1.47, IN.z + d / 2 - 0.75, 0.03, 0.7));
  place(this.furn.desk(), L.desk[0], L.desk[1], L.desk[2], 0.7, 0.35, { kind: 'computer', label: 'คอมพิวเตอร์ (ช้อปออนไลน์)', icon: '💻' }, 'desk');
  { const cal = this.drawCalendar(S); U.mk(g, new THREE.PlaneGeometry(0.75, 0.95), new THREE.MeshStandardMaterial({ map: cal, roughness: 0.8 }), [L.calendar[0], 2.0, L.calendar[1] - 0.02], 1, [0, Math.PI, 0]);
    this.inPois.push({ kind: 'calendar', x: IN.x + L.calendar[0], z: IN.z + L.calendar[1] - 1.0, r: 0.9, label: 'ปฏิทิน', icon: '📅' }); }
  // drinking water has its own stand (a water cooler on the east wall), not the kitchen counter
  { const cg = new THREE.Group(); U.mk(cg, GEO.box, mc(0xeceff1, { roughness: 0.4 }), [0, 0.45, 0], [0.36, 0.9, 0.34]); U.mk(cg, GEO.cyl, mc(0x4fc3f7, { roughness: 0.15, transparent: true, opacity: 0.8 }), [0, 1.12, 0], [0.26, 0.42, 0.26]); U.mk(cg, GEO.box, mc(0x1565c0), [0, 0.72, 0.18], [0.1, 0.05, 0.03]);
    place(cg, L.cooler[0], L.cooler[1], L.cooler[2], 0.2, 0.2, { kind: 'act', icon: '🚰', label: 'ดื่มน้ำ (ตู้น้ำดื่ม)', act: () => ({ icon: '🚰', label: 'ดื่มน้ำจากตู้น้ำดื่ม', fn: () => Life2.drink() }) }, 'cooler'); }
  if (S.pet) place(this.furn.petbed(), -hw + 6.4, hd - 0.6, 0);
  this.inLight = new THREE.PointLight(0xffe6c0, 1.1, 30, 1.6); this.inLight.position.set(0, 2.9, 0); g.add(this.inLight);
  // wall clock
  { const cx = -w / 2 + 2.6, cz = -d / 2 + 0.03;
    U.mk(g, GEO.cyl, M.darkwood, [cx, 2.55, cz + 0.02], [0.32, 0.05, 0.32], [Math.PI / 2, 0, 0]);
    U.mk(g, GEO.cyl, mc(0xfaf6ea, { roughness: 0.5 }), [cx, 2.55, cz + 0.05], [0.27, 0.02, 0.27], [Math.PI / 2, 0, 0]);
    this.clockH = U.mk(g, GEO.box, mc(0x222222), [cx, 2.55, cz + 0.07], [0.025, 0.15, 0.01]); this.clockM = U.mk(g, GEO.box, mc(0x222222), [cx, 2.55, cz + 0.075], [0.016, 0.22, 0.01]);
    this.clockH.geometry = gcache('handGeo', () => new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0)); this.clockM.geometry = this.clockH.geometry; }
  // tiled backsplash behind the kitchen counter
  { const tt = T.tile.clone(); tt.needsUpdate = true; tt.repeat.set(6, 2);
    U.mk(g, new THREE.PlaneGeometry(3.2, 0.85), U.mat(0xcfe3ee, { map: tt, roughness: 0.25 }), [w / 2 - 1.75, 1.38, -d / 2 + 0.012]); }
  // nightstand with a glowing table lamp
  { const nx = -w / 2 + 2.55, nz = -d / 2 + 0.4;
    U.mk(g, U.box(0.6, 0.6, 0.5, 1), texMat('wood', 0x8a5a3a, { roughness: 0.6 }), [nx, 0.3, nz]);
    U.mk(g, lathe('tlamp', [[0, 0], [0.1, 0], [0.06, 0.05], [0.04, 0.3], [0, 0.3]], 14), mc(0xc9a050, { metalness: 0.4, roughness: 0.4 }), [nx, 0.6, nz]);
    U.mk(g, gcache('tshade', () => new THREE.CylinderGeometry(0.1, 0.18, 0.22, 16, 1, true)), M.bulb, [nx, 1.0, nz]);
    this.inLamp = new THREE.PointLight(0xffc27a, 0, 7, 2); this.inLamp.position.set(nx, 1.05, nz + 0.2); g.add(this.inLamp);
    this.inGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow, color: 0xffd08a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.inGlow.position.set(nx, 1.0, nz); this.inGlow.scale.setScalar(1.6); g.add(this.inGlow);
    this.inCols.push(Col.box(IN.x + nx, IN.z + nz, 0.3, 0.25)); }
  // potted plant beside the door
  { const px = -1.15, pz = d / 2 - 0.45;
    U.mk(g, lathe('pot2', [[0, 0], [0.18, 0], [0.24, 0.42], [0.2, 0.42]], 16), mc(0xc0663a, { roughness: 0.8 }), [px, 0, pz]);
    const lm = mc(0x3f8a3a, { roughness: 0.7 }), pg = new THREE.Group(); pg.position.set(px, 0, pz); g.add(pg);
    for (let i = 0; i < 9; i++) leafAt(pg, lm, i * 0.7, 0.6 + (i % 3) * 0.25, 0.7, 0.13, 0.4);
    this.inCols.push(Col.circle(IN.x + px, IN.z + pz, 0.25)); }
  this.interior = g; g.visible = false; this.scene.add(g);
};
// Wall calendar: season, day grid, today's weather and open orders
World.drawCalendar = function (S) {
  if (!this.calCanvas) { this.calCanvas = document.createElement('canvas'); this.calCanvas.width = 256; this.calCanvas.height = 320; this.calTex = new THREE.CanvasTexture(this.calCanvas); this.calTex.encoding = THREE.sRGBEncoding; }
  const g = this.calCanvas.getContext('2d'), se = SEASONS[Math.floor((S.day - 1) / SEASON_LEN) % SEASONS.length], dIn = (S.day - 1) % SEASON_LEN;
  g.fillStyle = '#fbf7ee'; g.fillRect(0, 0, 256, 320);
  g.fillStyle = ['#e8902c', '#3f8ac0', '#7aa0c8'][SEASONS.indexOf(se)]; g.fillRect(0, 0, 256, 70);
  g.fillStyle = '#fff'; g.font = '600 30px Kanit, sans-serif'; g.textAlign = 'center'; g.fillText(se.n, 128, 47);
  g.font = '500 22px Kanit, sans-serif';
  for (let i = 0; i < SEASON_LEN; i++) {
    const x = 26 + (i % 4) * 68, y = 110 + Math.floor(i / 4) * 70;
    if (i === dIn) { g.fillStyle = '#e53935'; g.beginPath(); g.arc(x + 4, y - 8, 24, 0, TAU); g.fill(); }
    g.fillStyle = i === dIn ? '#fff' : i < dIn ? '#b8b0a0' : '#3a3530'; g.fillText(String(S.day - dIn + i), x + 4, y);
  }
  g.fillStyle = '#3a3530'; g.font = '500 20px Kanit, sans-serif';
  g.fillText(`ออเดอร์ค้าง ${(S.orders || []).length} รายการ`, 128, 292);
  { const i = SEASON_LEN - 1, x = 26 + (i % 4) * 68, y = 110 + Math.floor(i / 4) * 70; g.font = '20px "Segoe UI Emoji","Apple Color Emoji",sans-serif'; g.fillText(FESTIVALS[se.id].i, x + 4, y + 26); }
  this.calTex.needsUpdate = true; return this.calTex;
};
World.furn = {
  wardrobe() {
    const g = new THREE.Group(), wd = texMat('woodV', 0x9a6a42, { roughness: 0.6 }), dk = mc(0x5a3a22, { roughness: 0.6 });
    U.mk(g, U.box(1.2, 2.1, 0.6, 1.2), wd, [0, 1.05, 0]);
    for (const sx of [-1, 1]) { U.mk(g, GEO.box, wd, [sx * 0.3, 1.1, 0.31], [0.56, 1.8, 0.03]); U.mk(g, GEO.cylLo, mc(0xd9b44a, { metalness: 0.6, roughness: 0.3 }), [sx * 0.06, 1.1, 0.34], [0.015, 0.25, 0.015]); }
    U.mk(g, GEO.box, dk, [0, 2.14, 0], [1.26, 0.08, 0.64]);
    return g;
  },
  chest() {
    const g = new THREE.Group(), wd = texMat('wood', 0x8a5a34, { roughness: 0.6 }), band = mc(0x4a4f55, { metalness: 0.5, roughness: 0.4 });
    U.mk(g, U.box(1.0, 0.45, 0.55, 1), wd, [0, 0.225, 0]);
    U.mk(g, gcache('chestLid', () => new THREE.CylinderGeometry(0.275, 0.275, 1.0, 14, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateX(-Math.PI / 2)), wd, [0, 0.45, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
    for (const sx of [-0.35, 0.35]) U.mk(g, GEO.box, band, [sx, 0.35, 0], [0.06, 0.72, 0.57]);
    U.mk(g, GEO.box, mc(0xd9b44a, { metalness: 0.6, roughness: 0.3 }), [0, 0.42, 0.29], [0.12, 0.14, 0.03]);
    return g;
  },
  shower() {
    const g = new THREE.Group(), tile = T.tile.clone(); tile.needsUpdate = true; tile.repeat.set(2, 2);
    U.mk(g, U.box(1.4, 0.1, 1.4), U.mat(0xe8f0f4, { map: tile, roughness: 0.2 }), [0, 0.05, 0]);
    const glass = gcache('showerGlass', () => new THREE.MeshStandardMaterial({ color: U.col(0xcfe8f2), transparent: true, opacity: 0.28, roughness: 0.05, depthWrite: false }));
    U.mk(g, GEO.box, glass, [0.72, 1.1, 0], [0.02, 2.0, 1.4]);
    const chrome = mc(0xd5d9dc, { metalness: 0.6, roughness: 0.2 });
    U.mk(g, GEO.cylLo, chrome, [-0.6, 1.25, -0.6], [0.025, 2.0, 0.025]);
    U.mk(g, GEO.cyl, chrome, [-0.42, 2.2, -0.42], [0.12, 0.03, 0.12]);
    U.mk(g, GEO.cylLo, chrome, [-0.52, 2.24, -0.52], [0.02, 0.3, 0.02], [0, 0, 0.9]);
    U.mk(g, GEO.box, mc(0xf2f2f2), [0.5, 1.3, -0.68], [0.25, 0.3, 0.05]);
    U.mk(g, GEO.box, mc(0x4a9fd8, { roughness: 0.9 }), [-0.3, 0.11, 0.3], [0.5, 0.02, 0.35]);
    return g;
  },
  desk() {
    const g = new THREE.Group(), wd = texMat('wood', 0xb07a4a, { roughness: 0.5 }), bk = mc(0x1e1e1e, { roughness: 0.4 });
    U.mk(g, GEO.box, wd, [0, 0.75, 0], [1.4, 0.05, 0.7]);
    for (const sx of [-0.62, 0.62]) U.mk(g, GEO.box, wd, [sx, 0.37, 0], [0.06, 0.74, 0.64]);
    U.mk(g, GEO.box, bk, [0, 1.1, -0.18], [0.7, 0.42, 0.04]);
    const scr = U.mat(0x223344, { emissive: 0x4a90c8, roughness: 0.2 }); scr.emissiveIntensity = 0.8;
    U.mk(g, GEO.box, scr, [0, 1.1, -0.155], [0.64, 0.36, 0.01]);
    U.mk(g, GEO.box, bk, [0, 0.86, -0.18], [0.06, 0.18, 0.04]);
    U.mk(g, GEO.box, mc(0xd8d8d8), [0, 0.785, 0.08], [0.45, 0.02, 0.15]);
    U.mk(g, GEO.sph, mc(0xd8d8d8), [0.33, 0.79, 0.08], [0.04, 0.02, 0.06]);
    U.mk(g, GEO.box, mc(0x3f5a7a, { roughness: 0.8 }), [0, 0.47, 0.55], [0.5, 0.06, 0.45]);
    U.mk(g, GEO.box, mc(0x3f5a7a, { roughness: 0.8 }), [0, 0.8, 0.76], [0.5, 0.6, 0.06]);
    U.mk(g, GEO.cylLo, bk, [0, 0.23, 0.55], [0.04, 0.46, 0.04]);
    return g;
  },
  elephant() {
    const g = new THREE.Group(), wd = texMat('wood', 0x6b4426, { roughness: 0.5 });
    U.mk(g, U.box(0.8, 0.12, 0.5, 1), wd, [0, 0.06, 0]);
    U.mk(g, GEO.sph, wd, [0, 0.45, 0], [0.32, 0.24, 0.2]);
    U.mk(g, GEO.sph, wd, [0.3, 0.58, 0], [0.16, 0.16, 0.15]);
    U.mk(g, capsule(0.035, 0.25), wd, [0.45, 0.45, 0], 1, [0, 0, -0.3]);
    for (const s of [-1, 1]) { U.mk(g, GEO.sph, wd, [0.26, 0.6, s * 0.13], [0.03, 0.12, 0.1]); for (const x of [-0.18, 0.18]) U.mk(g, capsule(0.055, 0.12), wd, [x, 0.22, s * 0.1]); }
    U.mk(g, GEO.box, mc(0xc0392b, { roughness: 0.7 }), [0, 0.68, 0], [0.3, 0.02, 0.25]);
    U.mk(g, GEO.box, mc(0xd9b44a, { metalness: 0.5, roughness: 0.4 }), [0, 0.69, 0], [0.32, 0.01, 0.04]);
    return g;
  },
  lanternL() {
    const g = new THREE.Group();
    U.mk(g, GEO.cylLo, mc(0x2b2b2b), [0, 2.95, 0], [0.01, 0.5, 0.01]);
    U.mk(g, lathe('lanna', [[0, 0], [0.12, 0.02], [0.28, 0.18], [0.3, 0.32], [0.24, 0.46], [0.1, 0.52], [0, 0.52]], 12), U.mat(0xe8452c, { emissive: 0xff7a3a, roughness: 0.6, side: THREE.DoubleSide }), [0, 2.15, 0]);
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; U.mk(g, GEO.cylLo, mc(0xf2c94c), [Math.cos(a) * 0.12, 1.98, Math.sin(a) * 0.12], [0.008, 0.3, 0.008]); }
    return g;
  },
  vase() {
    const g = new THREE.Group();
    U.mk(g, GEO.cyl, mc(0x6b4a2e), [0, 0.35, 0], [0.32, 0.7, 0.32]);
    U.mk(g, lathe('vase', [[0, 0], [0.12, 0], [0.16, 0.12], [0.1, 0.32], [0.13, 0.4], [0, 0.4]], 16), mc(0x4fc3f7, { roughness: 0.15, metalness: 0.1 }), [0, 0.7, 0]);
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; U.mk(g, GEO.sphLo, mc([0xe84a6f, 0xf6d13a, 0xffffff][i % 3]), [Math.cos(a) * 0.12, 1.2 + (i % 2) * 0.08, Math.sin(a) * 0.12], 0.07); U.mk(g, GEO.cylLo, mc(0x3f7f2c), [Math.cos(a) * 0.06, 1.0, Math.sin(a) * 0.06], [0.01, 0.4, 0.01]); }
    return g;
  },
  trophy() {
    const g = new THREE.Group(), gold = mc(0xe0b13a, { metalness: 0.7, roughness: 0.25 });
    U.mk(g, U.box(0.5, 0.9, 0.4, 1), texMat('wood', 0x5a3a22, { roughness: 0.5 }), [0, 0.45, 0]);
    U.mk(g, U.box(0.24, 0.08, 0.24, 1), mc(0x2b2b2b), [0, 0.94, 0]);
    U.mk(g, GEO.cyl, gold, [0, 1.05, 0], [0.03, 0.16, 0.03]);
    U.mk(g, lathe('cup', [[0, 0], [0.04, 0], [0.13, 0.14], [0.15, 0.26], [0.13, 0.26], [0.11, 0.16], [0, 0.04]], 18), gold, [0, 1.13, 0]);
    for (const s of [-1, 1]) U.mk(g, gcache('cupHandle', () => new THREE.TorusGeometry(0.06, 0.012, 6, 12, Math.PI)), gold, [s * 0.15, 1.3, 0], 1, [0, 0, s > 0 ? -Math.PI / 2 : Math.PI / 2]);
    return g;
  },
  petbed() {
    const g = new THREE.Group();
    U.mk(g, gcache('petbedT', () => new THREE.TorusGeometry(0.4, 0.13, 10, 24)), mc(0xc0504d, { roughness: 0.95 }), [0, 0.1, 0], 1, [Math.PI / 2, 0, 0]);
    U.mk(g, GEO.cyl, mc(0xf2e6c9, { roughness: 0.95 }), [0, 0.06, 0], [0.38, 0.08, 0.38]);
    return g;
  },
  bed(lvl) {
    const g = new THREE.Group(), wd = texMat('wood', 0x8a5a3a, { roughness: 0.6 });
    U.mk(g, U.box(1.9, 0.35, 2.4, 1), wd, [0, 0.25, 0]);
    U.mk(g, U.box(1.9, 1.1, 0.12, 1), wd, [0, 0.75, -1.18]);
    U.mk(g, capsule(0.22, 1.5), mc(0xf5f2ea, { roughness: 0.9 }), [0, 0.55, 0], [1, 1, 1], [0, 0, Math.PI / 2]);
    U.mk(g, GEO.box, mc(0xf5f2ea, { roughness: 0.9 }), [0, 0.55, 0.05], [1.75, 0.22, 2.2]);
    U.mk(g, GEO.sph, mc(0xffffff, { roughness: 0.9 }), [-0.42, 0.75, -0.85], [0.35, 0.12, 0.2]);
    U.mk(g, GEO.sph, mc(0xffffff, { roughness: 0.9 }), [0.42, 0.75, -0.85], [0.35, 0.12, 0.2]);
    const quilt = gcache('quilt' + lvl, () => {
      const pal = [['#4a78b5', '#f2e6c9', '#8fb3d9'], ['#c0504d', '#f5e3c4', '#e89a7a'], ['#6b8e4e', '#f3ecd2', '#c9a050']][lvl - 1];
      const c = U.canvas(128, 128, (x, cw, ch) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.fillStyle = pal[(i + j * 2) % 3]; x.fillRect(i * 16, j * 16, 16, 16); x.strokeStyle = 'rgba(0,0,0,0.12)'; x.strokeRect(i * 16 + 0.5, j * 16 + 0.5, 15, 15); } });
      const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return U.mat(0xffffff, { map: t, roughness: 0.95 });
    });
    U.mk(g, GEO.box, quilt, [0, 0.68, 0.45], [1.82, 0.08, 1.4]);
    return g;
  },
  kitchen() {
    const g = new THREE.Group(), cab = mc(0xf2efe6, { roughness: 0.5 }), top = mc(0x5a5550, { roughness: 0.3 });
    U.mk(g, GEO.box, cab, [0, 0.45, 0], [3.2, 0.9, 0.7]);
    U.mk(g, GEO.box, top, [0, 0.92, 0], [3.25, 0.05, 0.74]);
    for (let i = 0; i < 4; i++) U.mk(g, GEO.box, mc(0x9fb7c6, { roughness: 0.6 }), [-1.2 + i * 0.8, 0.45, 0.36], [0.72, 0.8, 0.02]);
    U.mk(g, GEO.box, mc(0x2a2a2a, { roughness: 0.4 }), [0.8, 0.96, 0], [0.8, 0.03, 0.6]);
    for (const [a, b] of [[0.6, -0.15], [1.0, -0.15], [0.6, 0.15], [1.0, 0.15]]) U.mk(g, GEO.cyl, mc(0x111111), [a, 0.985, b], [0.11, 0.01, 0.11]);
    U.mk(g, lathe('pot', [[0, 0], [0.16, 0], [0.17, 0.18], [0.15, 0.18]], 16), mc(0xb0b6ba, { metalness: 0.5, roughness: 0.3 }), [0.6, 1.0, -0.15]);
    U.mk(g, GEO.box, mc(0xcfd8dc, { metalness: 0.4, roughness: 0.2 }), [-0.9, 0.93, 0], [0.6, 0.03, 0.45]);
    U.mk(g, GEO.box, cab, [0, 2.1, -0.15], [3.2, 0.7, 0.4]);
    return g;
  },
  fridge() {
    const g = new THREE.Group(), m = mc(0xdfe6ea, { roughness: 0.25, metalness: 0.1 });
    U.mk(g, U.box(0.85, 1.9, 0.75), m, [0, 0.95, 0]);
    U.mk(g, GEO.box, mc(0x9aa5ab), [0, 1.25, 0.38], [0.84, 0.02, 0.01]);
    U.mk(g, GEO.box, mc(0x777777, { metalness: 0.5 }), [-0.32, 1.5, 0.4], [0.04, 0.4, 0.04]);
    return g;
  },
  sofa() {
    const g = new THREE.Group(), f = mc(0x5b7f9e, { roughness: 0.95 }), c = mc(0x6e93b3, { roughness: 0.95 });
    U.mk(g, U.box(2.2, 0.4, 0.9), f, [0, 0.3, 0]);
    U.mk(g, capsule(0.18, 1.8), f, [0, 0.8, -0.35], [1, 1, 1.4], [0, 0, Math.PI / 2]);
    for (const s of [-1, 1]) { U.mk(g, capsule(0.15, 0.6), f, [s * 1.05, 0.6, 0], [1, 1, 1], [Math.PI / 2, 0, 0]); U.mk(g, GEO.sph, c, [s * 0.5, 0.55, 0.05], [0.48, 0.12, 0.38]); }
    U.mk(g, GEO.sph, mc(0xf2c94c, { roughness: 0.9 }), [-0.7, 0.75, -0.15], [0.18, 0.18, 0.08], [0.3, 0, 0.3]);
    return g;
  },
  rug() { const g = new THREE.Group(); U.mk(g, GEO.cyl, U.mat(0xc94f4f, { map: T.stripes, roughness: 1 }), [0, 0.012, 0], [1.6, 0.02, 1.1]); return g; },
  tv() {
    const g = new THREE.Group();
    U.mk(g, U.box(1.6, 0.5, 0.45, 1), texMat('wood', 0x5a3a22), [0, 0.25, 0]);
    U.mk(g, GEO.box, mc(0x111111, { roughness: 0.3 }), [0, 1.05, 0], [1.4, 0.82, 0.06]);
    const scr = U.mat(0x223344, { emissive: 0x3a6a9a, roughness: 0.2 }); scr.emissiveIntensity = 0.6;
    U.mk(g, GEO.box, scr, [0, 1.05, 0.032], [1.3, 0.72, 0.01]);
    return g;
  },
  table() {
    const g = new THREE.Group(), wd = texMat('wood', 0xa36b3f, { roughness: 0.5 });
    U.mk(g, GEO.cyl, wd, [0, 0.75, 0], [0.75, 0.06, 0.75]);
    U.mk(g, GEO.cyl, wd, [0, 0.38, 0], [0.08, 0.72, 0.08]);
    for (const s of [-1, 1]) {
      U.mk(g, GEO.box, wd, [s * 1.0, 0.45, 0], [0.45, 0.06, 0.45]);
      U.mk(g, GEO.box, wd, [s * 1.2, 0.75, 0], [0.06, 0.6, 0.45]);
      for (const a of [-1, 1]) for (const b of [-1, 1]) U.mk(g, GEO.cylLo, wd, [s * 1.0 + a * 0.18, 0.22, b * 0.18], [0.025, 0.44, 0.025]);
    }
    U.mk(g, GEO.cyl, mc(0xffffff, { roughness: 0.3 }), [0, 0.8, 0], [0.18, 0.03, 0.18]);
    U.mk(g, GEO.sph, mc(0xe8781c), [0, 0.86, 0], 0.07);
    return g;
  },
  plant() {
    const g = new THREE.Group();
    U.mk(g, lathe('pot2', [[0, 0], [0.18, 0], [0.24, 0.42], [0.2, 0.42]], 16), mc(0xc0663a, { roughness: 0.8 }), [0, 0, 0]);
    const lm = mc(0x3f8a3a, { roughness: 0.7 });
    for (let i = 0; i < 9; i++) leafAt(g, lm, i * 0.7, 0.6 + (i % 3) * 0.25, 0.7, 0.13, 0.4);
    return g;
  },
  bookshelf() {
    const g = new THREE.Group(), wd = texMat('wood', 0x6b4426, { roughness: 0.7 });
    U.mk(g, GEO.box, wd, [0, 0.95, 0], [1.4, 1.9, 0.42]);
    const R = U.rng(3), cols = [0xc0392b, 0x2f6db5, 0xf2c94c, 0x3f8a3a, 0x8e44ad, 0xe67e22];
    for (let r = 0; r < 4; r++) { let x = -0.6; while (x < 0.58) { const bw = 0.05 + R() * 0.05, bh = 0.25 + R() * 0.12; U.mk(g, GEO.box, mc(cols[(R() * 6) | 0], { roughness: 0.8 }), [x + bw / 2, 0.15 + r * 0.45 + bh / 2, 0.06], [bw, bh, 0.3]); x += bw + 0.01; } }
    return g;
  },
  lamp() {
    const g = new THREE.Group();
    U.mk(g, GEO.cyl, mc(0x333333, { metalness: 0.4 }), [0, 0.02, 0], [0.2, 0.04, 0.2]);
    U.mk(g, GEO.cylLo, mc(0x333333, { metalness: 0.4 }), [0, 0.8, 0], [0.025, 1.6, 0.025]);
    U.mk(g, gcache('shade', () => new THREE.CylinderGeometry(0.15, 0.28, 0.35, 18, 1, true)), M.bulb, [0, 1.65, 0]);
    return g;
  },
  painting() {
    const g = new THREE.Group();
    const c = U.canvas(256, 180, (x, w, h) => {
      const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9fd3f0'); gr.addColorStop(0.55, '#e8f4f8'); gr.addColorStop(0.56, '#7fb85a'); gr.addColorStop(1, '#4f8a3a');
      x.fillStyle = gr; x.fillRect(0, 0, w, h);
      x.fillStyle = '#5a7f9a'; x.beginPath(); x.moveTo(0, 100); x.lineTo(70, 40); x.lineTo(140, 100); x.fill();
      x.fillStyle = '#6a8fa8'; x.beginPath(); x.moveTo(90, 100); x.lineTo(170, 30); x.lineTo(256, 100); x.fill();
      x.fillStyle = '#ffd23f'; x.beginPath(); x.arc(210, 40, 16, 0, TAU); x.fill();
    });
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
    U.mk(g, GEO.box, texMat('wood', 0xc8a050), [0, 2.35, 0.03], [1.25, 0.9, 0.05]);
    U.mk(g, new THREE.PlaneGeometry(1.1, 0.76), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }), [0, 2.35, 0.06]);
    return g;
  },
  piano() {
    const g = new THREE.Group(), bk = mc(0x111111, { roughness: 0.15 });
    U.mk(g, GEO.box, bk, [0, 0.7, -0.1], [1.5, 1.2, 0.5]);
    U.mk(g, GEO.box, bk, [0, 0.72, 0.25], [1.5, 0.08, 0.35]);
    U.mk(g, GEO.box, mc(0xf8f8f2, { roughness: 0.3 }), [0, 0.77, 0.27], [1.36, 0.02, 0.18]);
    for (let i = 0; i < 18; i++) if (i % 7 !== 2 && i % 7 !== 6) U.mk(g, GEO.box, bk, [-0.64 + i * 0.075, 0.79, 0.22], [0.035, 0.02, 0.1]);
    for (const s of [-1, 1]) U.mk(g, GEO.box, bk, [s * 0.7, 0.35, 0.3], [0.06, 0.7, 0.06]);
    U.mk(g, GEO.box, bk, [0, 0.45, 0.85], [0.8, 0.08, 0.35]);
    return g;
  },
  aquarium() {
    const g = new THREE.Group();
    U.mk(g, U.box(1.4, 0.7, 0.55, 1), texMat('wood', 0x4a3020), [0, 0.35, 0]);
    const gl = new THREE.MeshStandardMaterial({ color: U.col(0x7fd3f0), transparent: true, opacity: 0.35, roughness: 0.05 });
    U.mk(g, GEO.box, gl, [0, 1.05, 0], [1.35, 0.7, 0.5]);
    U.mk(g, GEO.box, mc(0xe6d3a0), [0, 0.74, 0], [1.3, 0.06, 0.46]);
    const R = U.rng(8);
    for (let i = 0; i < 6; i++) U.mk(g, GEO.cone, mc([0xff8c1a, 0xffd23f, 0x2f9fe0][i % 3], { roughness: 0.4 }), [-0.5 + R(), 0.9 + R() * 0.3, (R() - 0.5) * 0.3], [0.04, 0.12, 0.03], [0, 0, Math.PI / 2]);
    for (let i = 0; i < 4; i++) U.mk(g, GEO.cylLo, mc(0x3f9a4a), [-0.5 + i * 0.3, 0.95, -0.12], [0.02, 0.4, 0.02]);
    return g;
  },
};

// ---------- Minimap image ----------
World.buildMapImage = function () {
  const W = (WORLD.maxX - WORLD.minX) / 2, D = (WORLD.maxZ - WORLD.minZ) / 2;
  const c = U.canvas(W, D, (g) => {
    const id = g.createImageData(W, D), d = id.data;
    for (let y = 0; y < D; y++) for (let x = 0; x < W; x++) {
      const wx = WORLD.minX + x * 2, wz = WORLD.minZ + y * 2, h = H(wx, wz), k = (y * W + x) * 4;
      let r, gg, b;
      if (wx > 410 && h < -0.4) { r = 70; gg = 150; b = 200; }
      else if (wx > 398 && h < 2) { r = 230; gg = 214; b = 165; }
      else { const s = U.clamp(h / 40, 0, 1); r = 110 + s * 60; gg = 170 - s * 40; b = 80 + s * 40; if (h > 22) { r = 160; gg = 155; b = 145; } }
      const n = (U.noise2(wx * 0.05, wz * 0.05) - 0.5) * 18;
      d[k] = r + n; d[k + 1] = gg + n; d[k + 2] = b + n; d[k + 3] = 255;
    }
    g.putImageData(id, 0, 0);
    const tx = x => (x - WORLD.minX) / 2, tz = z => (z - WORLD.minZ) / 2;
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const rc of this.roadCurves) { g.strokeStyle = '#5b5b5b'; g.lineWidth = 5; g.beginPath(); rc.sp.forEach((p, i) => i ? g.lineTo(tx(p.x), tz(p.z)) : g.moveTo(tx(p.x), tz(p.z))); g.stroke(); g.strokeStyle = '#d9d3c4'; g.lineWidth = 1; g.stroke(); }
    g.strokeStyle = '#8a6a3f'; g.lineWidth = 3; g.strokeRect(tx(-72), tz(-58), 144 / 2, 120 / 2);
    g.fillStyle = '#7a5434'; for (let i = 0; i < 30; i++) { const p = plotCenter(i); g.fillRect(tx(p.x) - 0.6, tz(p.z) - 0.6, 1.2, 1.2); }
    g.fillStyle = '#4a9ab8'; g.beginPath(); g.arc(tx(30), tz(20), 3, 0, TAU); g.fill();
    g.fillStyle = '#a5523d';
    for (const k of Col.map.values()) for (const s of k) if (s.tag === 'bld' && !s._drawn) {
      s._drawn = true; g.save(); g.translate(tx(s.x), tz(s.z)); g.rotate(-s.rot); g.fillRect(-s.hw / 2, -s.hd / 2, s.hw, s.hd); g.restore();
    }
    g.fillRect(tx(-38) - 3, tz(5) - 2.2, 6, 4.5);
  });
  this.mapImg = c;
};

World.update = function (dt, t) {
  const o = t * 0.012;
  if (this.seaMat) { this.seaMat.normalMap.offset.set(o, o * 0.6); }
  if (this.pondTex) this.pondTex.offset.set(o * 2, -o);
  for (const [i, b] of this.boats.entries()) { b.position.y = -0.6 + Math.sin(t * 1.2 + i) * 0.08; b.rotation.z = Math.sin(t * 0.9 + i * 2) * 0.04; b.rotation.x = Math.sin(t * 0.7 + i) * 0.03; }
  if (this.lighthouse) this.lighthouse.piv.rotation.y = t * 0.6;
  const wind = SWAY.wind.value;
  if (this.buoys) this.buoys.forEach((b, i) => { b.position.y = -0.72 + Math.sin(t * 1.4 + i) * 0.07; b.rotation.z = Math.sin(t * 1.1 + i * 2) * 0.12; });
  if (this.gulls) for (const gl of this.gulls) {
    gl.a += dt * gl.sp; const x = gl.cx + Math.cos(gl.a) * gl.r, z = gl.cz + Math.sin(gl.a) * gl.r;
    gl.g.position.set(x, gl.h + Math.sin(t * 0.7 + gl.r) * 1.5, z); gl.g.rotation.set(0, -gl.a, Math.sin(t * 0.5 + gl.r) * 0.15 - 0.2);
    const f = Math.sin(t * 7 + gl.r) * (Math.sin(t * 0.4 + gl.r) > 0.2 ? 0.55 : 0.08);
    gl.wings[0].rotation.z = -f; gl.wings[1].rotation.z = f;
  }
  if (this.windmill) { this.windmill.rotor.rotation.z -= dt * (0.6 + wind * 5); this.windmill.head.rotation.y = -Math.PI / 2 + Math.sin(t * 0.13) * 0.25; }
  if (this.vane) this.vane.rotation.y = -Math.PI / 2 + Math.sin(t * 0.13) * 0.25 + Math.sin(t * 2.3) * 0.06 * wind;
  if (this.foam) { this.foam.position.x = 424.5 + Math.sin(t * 0.5) * 0.9; this.foamMat.opacity = 0.35 + Math.sin(t * 0.5 + 1) * 0.2; T.foam.offset.y = t * 0.01; }
};
