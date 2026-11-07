'use strict';
// ---------- v39 traffic: cars keep their own lane in the village AND in every city ----------
// Thailand drives on the left. Each two-way road has one lane per direction, centred 2 m left of the centre line in the
// direction of travel (the road is 8 m wide and the pavement starts at 4 m, so a car body stays inside road half-width - 0.8 m).
// The village already has an AI-car engine in game.js (updateTraffic / placeTraffic: lane offset, junction turns on Bezier paths,
// give way to the player and people, traffic lights through G.stopPts). Cities had none. Instead of writing a second engine, the
// city streets are turned into the same kind of route graph and the engine is pointed at them while the player is in that city:
//   - G.traffic / G.stopPts are swapped for the city's own cars and lights while G.away is a city, and swapped back afterwards
//   - the city route graph is made of segments between junctions, so every junction is a real graph node: straight (weighted),
//     left (short) and right (crossing) turns come out of the engine's own Bezier turn code
//   - cars are pooled (one model per active slot, re-used), capped by quality tier and by city size, thinned at night, thickened at rush hours
//   - at the street ends (city limits) cars drive out of town and are recycled; new cars come in from the limits
// Traf39.audit() samples every car for N minutes and reports lane / heading / off-road / overlap / stuck violations.
V23.add('v39_traffic', () => {
  if (typeof updateTraffic !== 'function' || typeof placeTraffic !== 'function' || typeof G === 'undefined' || !G.traffic) return;
  const LANE = 2, HALF = 4;
  // same layout as v23_town.js buildTown / v25_town.js SPEC: vertical streets (along z) and, in large cities, one cross avenue (along x)
  const SPEC = {
    large: { st: [-40, 0, 40], zLen: 180, cross: 50, crossHW: 62 },
    medium: { st: [-20, 20], zLen: 140, cross: null },
    small: { st: [0], zLen: 140, cross: null },
  };
  const OLD = { chiang: { st: [0], zLen: 140, cross: null, z1: 30 }, city: { st: [0], zLen: 140, cross: null } };   // chiang: the walking-street stalls start 33 m south of the centre   // towns3.js: one main street
  const BASE = { large: 20, medium: 12, small: 5 }, SIZECAP = { large: 24, medium: 10, small: 5 };
  const TIERCAP = { low: 6, med: 10, high: 16, ultra: 24 };
  const TYPES_K = ['sedan', 'sedan', 'taxi', 'van', 'suv', 'hatch', 'delivery', 'truck'], TYPES_P = ['pickup', 'oldtruck', 'sports'];
  const COLS = [0xf2f2f2, 0xa9b0b6, 0x2f5d9e, 0x1d1d1d, 0x8a2b2b, 0x3a7a4a, 0xd9a02a, 0xf5f5f5, 0x6d4c9f, 0xff7043];

  const T39 = window.Traf39 = { mode: 'village', key: null, net: null, nets: {}, active: [], pool: [], vt: null, vstop: null, entryDebt: 0, spawnT: 0, log: [] };
  const warn = (w, e) => { if (T39.log.length < 20) T39.log.push(w + ': ' + (e && e.message || e)); if (typeof console !== 'undefined' && !T39['w' + w]) { T39['w' + w] = 1; console.warn('v39 traffic ' + w, e); } };

  // ===== village: speeds as in real life (streets 30-40 km/h, the long rural road 40-50 km/h), nothing spawns on the player =====
  const villageTune = () => {
    const rs = G.routes || []; const P = G.player && G.player.pos;
    for (const t of G.traffic) {
      if (t.patrol || t.city) continue;
      const ri = rs.indexOf(t.R);
      t.max = ri === 1 ? 11 + Math.random() * 2.9 : 8.4 + Math.random() * 2.6;
      if (P && Math.hypot(t.x - P.x, t.z - P.z) < 16) { t.s = U.clamp(t.s + t.dir * 40, 1, t.R.len - 1); placeTraffic(t, 0); }
    }
  };

  // ===== city road graph =====
  const mkSeg = (x0, z0, x1, z1, kind) => {
    const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(3, Math.ceil(len / 2) + 1), step = len / (n - 1), sp = [];
    for (let i = 0; i < n; i++) sp.push({ x: x0 + (x1 - x0) * i / (n - 1), z: z0 + (z1 - z0) * i / (n - 1) });
    return { sp, step, len, kind, ends: [[], []], branches: [], a: { x: x0, z: z0 }, b: { x: x1, z: z1 }, tx: (x1 - x0) / len, tz: (z1 - z0) / len, city: true };
  };
  const specFor = (key, A) => {
    if (A && A.streets && A.size && SPEC[A.size]) return Object.assign({ cx: A.cx, cz: A.cz }, SPEC[A.size], { st: A.streets.slice() });
    if (OLD[key] && A) return Object.assign({ cx: A.cx, cz: A.cz }, OLD[key]);
    return null;
  };
  const buildNet = (key, A) => {
    const sp = specFor(key, A); if (!sp) return null;
    const { cx, cz } = sp, routes = [], nodes = [], hasCross = sp.cross != null;
    const zA = cz - sp.zLen / 2, zB = sp.z1 != null ? cz + sp.z1 : cz + sp.zLen / 2;
    for (const sx of sp.st) {
      const zs = hasCross ? [zA, cz + sp.cross, zB] : [zA, zB];
      for (let i = 0; i < zs.length - 1; i++) routes.push(mkSeg(cx + sx, zs[i], cx + sx, zs[i + 1], 'street'));
    }
    if (hasCross) {
      const xs = [cx - sp.crossHW].concat(sp.st.map(s => cx + s), [cx + sp.crossHW]).sort((a, b) => a - b);
      for (let i = 0; i < xs.length - 1; i++) routes.push(mkSeg(xs[i], cz + sp.cross, xs[i + 1], cz + sp.cross, 'avenue'));
      for (const s of sp.st) nodes.push({ x: cx + s, z: cz + sp.cross });
    }
    // link: two route ends that meet at a node are connected; going straight on is weighted three times a turn
    const same = (p, q) => Math.hypot(p.x - q.x, p.z - q.z) < 0.6;
    for (const R of routes) for (let e = 0; e < 2; e++) {
      const p = e ? R.b : R.a, fR = { x: R.tx * (e ? 1 : -1), z: R.tz * (e ? 1 : -1) };
      for (const Q of routes) {
        if (Q === R) continue;
        for (let eq = 0; eq < 2; eq++) {
          if (!same(p, eq ? Q.b : Q.a)) continue;
          const dq = eq ? -1 : 1, fQ = { x: Q.tx * dq, z: Q.tz * dq }, straight = fR.x * fQ.x + fR.z * fQ.z > 0.95;
          const ent = { Q, s: eq ? Q.len : 0, dir: dq };
          R.ends[e].push(ent); if (straight) { R.ends[e].push(ent); R.ends[e].push(ent); }
        }
      }
    }
    for (const R of routes) R.dead = [R.ends[0].length === 0, R.ends[1].length === 0];
    const net = { key, A, cx, cz, routes, nodes, size: A.size || 'small', lights: [], stops: [], lens: routes.map(r => r.len) };
    // traffic lights where the cross avenue meets the streets (large cities)
    for (const n of nodes) net.lights.push(mkLight(A, n.x, n.z));
    net.stops = net.lights.map(L => ({ x: L.x, z: L.z, red: h => L.redFor(h) }));
    return net;
  };
  // a traffic light: two poles on opposite corners, one head per axis; ax 0 = traffic along z, ax 1 = along x (17 s green, 3 s amber)
  const mkLight = (A, x, z) => {
    const L = { x, z, t: Math.random() * 34, heads: [] }, g = new THREE.Group(); A.g.add(g);
    [[1, 1, 0], [-1, -1, 1]].forEach(([sx, sz, ax]) => {
      const px = x + sx * 6.4, pz = z + sz * 6.4;
      U.mk(g, GEO.cyl, mc(0x37474f), [px, 2.3, pz], [0.09, 4.6, 0.09]);
      if (typeof Col !== 'undefined') Col.circle(px, pz, 0.2);
      const h = new THREE.Group(); h.position.set(px, 4.2, pz); g.add(h);
      U.mk(h, GEO.box, mc(0x212121), [0, 0, 0], ax ? [0.35, 1.1, 0.4] : [0.4, 1.1, 0.35]);
      const lamps = [0xff1744, 0xffc400, 0x00e676].map((c, i) => {
        const m = new THREE.MeshBasicMaterial({ color: c, toneMapped: false });
        for (const s of [-1, 1]) U.mk(h, GEO.sph, m, ax ? [s * 0.18, 0.33 - i * 0.33, 0] : [0, 0.33 - i * 0.33, s * 0.18], 0.11);
        return { m, c: new THREE.Color(c) };
      });
      L.heads.push({ ax, lamps });
    });
    L.state = ax => { const t = L.t % 34, ph = t < 17 ? 0 : 1, tt = t % 17; return ph !== ax ? 'red' : tt > 14 ? 'amber' : 'green'; };
    L.redFor = h => { const ax = Math.abs(Math.cos(h)) > 0.7 ? 0 : Math.abs(Math.sin(h)) > 0.7 ? 1 : -1; return ax >= 0 && L.state(ax) !== 'green'; };
    return L;
  };
  const updLights = (net, dt) => {
    for (const L of net.lights) {
      L.t += dt;
      for (const hd of L.heads) { const st = L.state(hd.ax); hd.lamps.forEach((l, i) => l.m.color.copy(l.c).multiplyScalar((st === 'red' && i === 0) || (st === 'amber' && i === 1) || (st === 'green' && i === 2) ? 1 : 0.1)); }
    }
  };

  // ===== pool, spawn, retire =====
  const tierCap = () => TIERCAP[G.Q && G.Q.lvl] || 10;
  const hourFactor = () => { const h = (S.time || 0) / 60; return h >= 22 || h < 5 ? 0.15 : h < 7 ? 0.5 : h < 9 ? 1 : h < 16 ? 0.7 : h < 19 ? 1 : 0.5; };
  const target = net => Math.max(net.size === 'large' ? 1 : 0, Math.min(tierCap(), SIZECAP[net.size] || 5, Math.round((BASE[net.size] || 5) * hourFactor())));
  const newCar = net => {
    const kenney = typeof Assets !== 'undefined' && Assets.has && Assets.has('car:sedan'), T = kenney ? TYPES_K : TYPES_P;
    const m = Models.car(T[Math.floor(Math.random() * T.length)], COLS[Math.floor(Math.random() * COLS.length)]);
    net.A.g.add(m.g); try { if (typeof Merge2 !== 'undefined') Merge2.car(m); } catch (e) { }
    m.city = true; m.patrol = null; return m;
  };
  const playerPos = () => G.driving ? { x: G.driving.d.x, z: G.driving.d.z } : G.player.pos;
  const laneXZ = (R, s, dir) => { const p = routeAt(R, s); return { x: p.x + p.tz * dir * LANE, z: p.z - p.tx * dir * LANE, tx: p.tx * dir, tz: p.tz * dir }; };
  const clearAt = (net, R, dir, s, x, z) => {
    for (const o of T39.active) {
      if (Math.hypot(o.x - x, o.z - z) < 7) return false;
      if (o.R === R && o.dir === dir && Math.abs(o.s - s) < 14) return false;
    }
    return true;
  };
  const place = (net, R, dir, s, speedF) => {
    const t = T39.pool.pop() || newCar(net);
    if (t.g.parent !== net.A.g) net.A.g.add(t.g);
    const kind = R.kind === 'avenue' ? 1 : 0;
    Object.assign(t, { R, s, dir, speed: 0, max: (kind ? 13 : 11) + Math.random() * 3, max0: undefined, plan: undefined, planR: null, planDir: 0, w39: 0, turn: -1, h: 0, vh: null, block: 0, stuck: 0, ghost: 0, xfer: null, city: true });
    t.speed = t.max * speedF; placeTraffic(t, 0); t.g.visible = true; T39.active.push(t); return t;
  };
  const retire = t => {
    const i = T39.active.indexOf(t); if (i >= 0) T39.active.splice(i, 1);
    t.xfer = null; t.g.visible = false; T39.pool.push(t);
  };
  // random free spot on the network, away from the player
  const spawnRandom = (net, minD) => {
    const P = playerPos(); let tot = 0; for (const l of net.lens) tot += l;
    for (let k = 0; k < 30; k++) {
      let r = Math.random() * tot, R = net.routes[0]; for (const q of net.routes) { if ((r -= q.len) <= 0) { R = q; break; } }
      const dir = Math.random() < 0.5 ? 1 : -1, s = 9 + Math.random() * Math.max(1, R.len - 18), p = laneXZ(R, s, dir);
      const rem = dir > 0 ? R.len - s : s;
      if (R.dead[dir > 0 ? 1 : 0] && rem < 24) continue;
      if (Math.hypot(p.x - P.x, p.z - P.z) < (k < 18 ? minD : minD * 0.6)) continue;
      if (!clearAt(net, R, dir, s, p.x, p.z)) continue;
      return place(net, R, dir, s, 0.6);
    }
    return null;
  };
  // cars arrive from the city limits (the dead ends), heading into town
  const spawnEntry = net => {
    const P = playerPos(), cand = [];
    for (const R of net.routes) for (let e = 0; e < 2; e++) if (R.dead[e]) cand.push([R, e]);
    for (let k = 0; k < 8 && cand.length; k++) {
      const [R, e] = cand[Math.floor(Math.random() * cand.length)], dir = e ? -1 : 1, s = e ? R.len - 3 : 3, p = laneXZ(R, s, dir);
      if (Math.hypot(p.x - P.x, p.z - P.z) < 28 || !clearAt(net, R, dir, s, p.x, p.z)) continue;
      return place(net, R, dir, s, 0.7);
    }
    return null;
  };

  // ===== switching between the village list and a city list =====
  const keyOf = A => {
    if (!A) return null;
    if (A._t39 !== undefined) return A._t39;
    let k = null; for (const kk of Object.keys(Town2.areas)) if (Town2.areas[kk] === A) { k = kk; break; }
    A._t39 = k && specFor(k, A) ? k : null; return A._t39;
  };
  // towns3.js (chiang, city): residents were set to stroll at x = centre +-3, i.e. in the carriageway; move them onto the pavement
  const fixOldTownNpcs = (key, A) => {
    if (!OLD[key] || A._npcFix) return; A._npcFix = 1;
    for (const n of G.npcs) {
      if (!n.circ || n.circ.x < A.x0 || n.circ.x > A.x1 || n.circ.z < A.z0 || n.circ.z > A.z1) continue;
      if (Math.abs(n.circ.x - A.cx) < 4.8) { n.circ.x = A.cx + (n.circ.x >= A.cx ? 5.6 : -5.6); n.circ.r = Math.min(n.circ.r || 1.4, 1.3); n.x = n.circ.x; n.tx = n.x; if (n.obj) n.obj.position.x = n.x; }
    }
  };
  const enterCity = (key, A) => {
    fixOldTownNpcs(key, A);
    if (T39.mode === 'village') { T39.vt = G.traffic; T39.vstop = G.stopPts; }
    const net = T39.nets[key] || (T39.nets[key] = buildNet(key, A));
    if (!net) return false;
    for (const t of T39.active.slice()) retire(t);
    T39.active = []; G.traffic = T39.active; G.stopPts = net.stops;
    T39.mode = 'city'; T39.key = key; T39.net = net; T39.entryDebt = 0; T39.spawnT = 0;
    const want = target(net); for (let i = 0; i < want; i++) spawnRandom(net, 32);
    return true;
  };
  const leaveCity = () => {
    for (const t of T39.active.slice()) retire(t);
    G.traffic = T39.vt || G.traffic; G.stopPts = T39.vstop || G.stopPts;
    T39.mode = 'village'; T39.key = null; T39.net = null; T39.active = [];
  };
  const sync = () => {
    const A = G.away, key = keyOf(A);
    if (key) { if (T39.mode !== 'city' || T39.key !== key) { if (!enterCity(key, A) && T39.mode === 'city') leaveCity(); } }
    else if (T39.mode === 'city') leaveCity();
  };

  // ===== junction manners: decide straight / left / right early, right-turners (who cross the oncoming lane) give way, queues are not driven through =====
  const turnClass = (t, Q, dir) => {
    const e = t.dir > 0 ? 1 : 0, p = routeAt(t.R, e ? t.R.len : 0), q = routeAt(Q, dir > 0 ? 0 : Q.len), fx = p.tx * (e ? 1 : -1), fz = p.tz * (e ? 1 : -1), qx = q.tx * dir, qz = q.tz * dir;
    return fx * qx + fz * qz > 0.9 ? 'S' : fx * qz - fz * qx < 0 ? 'L' : 'R';
  };
  // a junction turn hugs the corner point (the engine's Bezier bulged to the kerb corner on 8 m roads) and is taken at about 12 km/h
  const _sx = startXfer;
  startXfer = function (t, R, s, dir) {
    if (!t.patrol && t.plan === 'R' && !t.xfer && rightTurnBlocked(t)) return;     // wait at the line; the engine asks again next frame
    // never merge into a lane on top of another car: wait until the stretch of the target lane (10 m behind to 12 m ahead of the entry point) is clear
    if (!t.patrol && !t.xfer && laneTaken(t, R, dir, U.clamp(s, 1, R.len - 1))) return;
    _sx.apply(this, arguments);
    const X = t.xfer; if (!X || t.patrol) return;
    const C1 = { x: X.x0 + (X.x1 - X.x0) * 1.5, z: X.z0 + (X.z1 - X.z0) * 1.5 }, C2 = { x: X.x3 + (X.x2 - X.x3) * 1.5, z: X.z3 + (X.z2 - X.z3) * 1.5 };
    if (Math.hypot(C1.x - C2.x, C1.z - C2.z) > 0.5) return;      // a straight-on S-bend, not a corner
    const f = 0.86;
    X.x1 = X.x0 + (C1.x - X.x0) * f; X.z1 = X.z0 + (C1.z - X.z0) * f; X.x2 = X.x3 + (C1.x - X.x3) * f; X.z2 = X.z3 + (C1.z - X.z3) * f;
    let len = 0, px = X.x0, pz = X.z0; for (let i = 1; i <= 12; i++) { const u = i / 12, a = (1 - u) ** 3, b = 3 * u * (1 - u) ** 2, c = 3 * u * u * (1 - u), d = u ** 3; const x = a * X.x0 + b * X.x1 + c * X.x2 + d * X.x3, z = a * X.z0 + b * X.z1 + c * X.z2 + d * X.z3; len += Math.hypot(x - px, z - pz); px = x; pz = z; }
    X.len = Math.max(1, len); X.slow = true;
  };
  const _xo = xferOK;
  xferOK = function (t, R, s, dir) {
    if (!t.patrol && t.plan && t.planR === t.R && t.planDir === t.dir && !t.xfer && turnClass(t, R, dir) !== t.plan) return false;
    return _xo.apply(this, arguments);
  };
  const choosePlan = t => {
    const e = t.dir > 0 ? 1 : 0, have = {};
    for (const en of t.R.ends[e]) have[turnClass(t, en.Q, en.dir)] = 1;
    const opts = Object.keys(have); t.planR = t.R; t.planDir = t.dir;
    if (!opts.length) { t.plan = null; return; }
    const w = { S: 0.6, L: 0.2, R: 0.2 }; let tot = 0; for (const o of opts) tot += w[o]; let r = Math.random() * tot;
    for (const o of opts) { if ((r -= w[o]) <= 0) { t.plan = o; return; } } t.plan = opts[0];
  };
  const redAhead = t => {
    if (!G.stopPts) return false; const fx = Math.sin(t.h), fz = Math.cos(t.h);
    for (const st of G.stopPts) { const dx = st.x - t.x, dz = st.z - t.z, lz = dx * fx + dz * fz, lx = dx * fz - dz * fx; if (lz > 3 && lz < 34 && Math.abs(lx) < 9 && st.red(t.h)) return true; }
    return false;
  };
  const leaderOf = t => {
    const fx = Math.sin(t.h), fz = Math.cos(t.h); let best = null, bd = 9;
    for (const o of G.traffic) { if (o === t) continue; const dx = o.x - t.x, dz = o.z - t.z, lz = dx * fx + dz * fz, lx = dx * fz - dz * fx; if (lz > 0 && lz < bd && Math.abs(lx) < 1.7) { bd = lz; best = o; } }
    return best;
  };
  // true while a right-turner must wait: oncoming straight / left traffic is near or inside the junction, or an opposite right-turner has priority
  const rightTurnBlocked = t => {
    const e = t.dir > 0 ? 1 : 0, rem = e ? t.R.len - t.s : t.s, node = routeAt(t.R, e ? t.R.len : 0), hx = Math.sin(t.h), hz = Math.cos(t.h);
    for (const o of G.traffic) {
      if (o === t || o.patrol) continue;
      const d = Math.hypot(o.x - node.x, o.z - node.z), oh = Math.sin(o.vh == null ? o.h : o.vh) * hx + Math.cos(o.vh == null ? o.h : o.vh) * hz;
      const ohd = o.vh == null ? o.h : o.vh, toward = (node.x - o.x) * Math.sin(ohd) + (node.z - o.z) * Math.cos(ohd) > 0;   // heading for the junction, not already past it
      const inBox = d < 6.5 && !(o.R === t.R && o.dir === t.dir);
      if (inBox && (o.xfer || o.speed > 0.5)) return true;
      if (oh < -0.6 && toward && (d < 24 || (o.speed > 1 && d < 50 && d / o.speed < 4.5)) && (o.speed > 0.8 || (d < 14 && !redAhead(o))) && o.plan !== 'R') return true;
      // two opposite right-turners cannot both go: the one nearer the junction (then the older car) goes first
      if (oh < -0.6 && toward && d < 24 && o.plan === 'R' && !(o.max0 !== undefined && o.speed < 0.3 && d > rem + 0.5) && (d < rem - 0.5 || (Math.abs(d - rem) <= 0.5 && G.traffic.indexOf(o) < G.traffic.indexOf(t)))) return true;
    }
    return false;
  };
  // is the stretch of lane a car would turn into already taken (a car 10 m behind to 12 m ahead of the entry point, or one turning in there)
  const laneTaken = (t, R, dir, ts) => {
    for (const o of G.traffic) {
      if (o === t || o.patrol) continue;
      const R2 = o.xfer ? o.xfer.R : o.R, d2 = o.xfer ? o.xfer.dir : o.dir, s2 = o.xfer ? o.xfer.s : o.s;
      if (R2 === R && d2 === dir && (s2 - ts) * dir > -12 && (s2 - ts) * dir < 10) return true;
    }
    return false;
  };
  const mergeBlocked = t => {
    const e = t.dir > 0 ? 1 : 0, ens = t.R.ends[e].filter(en => !t.plan || turnClass(t, en.Q, en.dir) === t.plan);
    return ens.length > 0 && ens.every(en => laneTaken(t, en.Q, en.dir, U.clamp(en.s + en.dir * 9, 1, en.Q.len - 1)));
  };
  const manners = dt => {
    const city = T39.mode === 'city', net = T39.net;
    for (const t of G.traffic) {
      if (t.patrol) continue;
      t.w39 = t.speed < 0.3 ? (t.w39 || 0) + dt : 0;
      // waiting in a queue or at a red light is not being stuck: do not let the engine ease the car through the one in front
      if (t.stuck > 3 && !t.xfer) { if (redAhead(t)) { t.stuck = 0; t.ghost = 0; } else { const L = leaderOf(t); if (L && (L.w39 || 0) < 30) { t.stuck = 0; t.ghost = 0; } } }
      // safe following distance: never close in on the car in front faster than it moves away (bumper gap about 0.3 m at a stop)
      { const L0 = leaderOf(t); if (L0) { const fx = Math.sin(t.h), fz = Math.cos(t.h), lz = (L0.x - t.x) * fx + (L0.z - t.z) * fz; if (lz < 7.5) t.speed = Math.min(t.speed, Math.max(0, (L0.speed || 0) + (lz - 4.8) * 1.2)); } }
      if (t.xfer) continue;
      const e = t.dir > 0 ? 1 : 0, rem = e ? t.R.len - t.s : t.s;
      if (t.planR !== t.R || t.planDir !== t.dir) t.plan = undefined;
      if (rem <= 24 && t.plan === undefined && t.R.ends[e].length) choosePlan(t);
      // the chosen turn must still be drivable when the car gets there; otherwise let the engine pick any turn instead of a U-turn
      if (t.plan && rem <= 11 && t.R.ends[e].length) {
        const okAny = t.R.ends[e].some(en => turnClass(t, en.Q, en.dir) === t.plan && [9, 14, 20].some(off => _xo(t, en.Q, en.s + en.dir * off, en.dir)));
        if (!okAny) { t.plan = null; t.planR = t.R; t.planDir = t.dir; }
      }
      // a right-turner (crosses the oncoming lane) waits while oncoming straight / left traffic is near or inside the junction
      const hold = rem > 6 && rem < 18 && ((t.plan === 'R' && rightTurnBlocked(t)) || mergeBlocked(t));
      if (hold) { if (t.max0 === undefined) t.max0 = t.max; t.max = 0.01; } else if (t.max0 !== undefined) { t.max = t.max0; t.max0 = undefined; }
    }
  };

  // ===== per frame in a city: recycle at the city limits, keep the density right, lights =====
  const cityStep = dt => {
    const net = T39.net, P = playerPos();
    updLights(net, dt);
    for (const t of T39.active.slice()) {
      if (t.xfer) continue;
      const e = t.dir > 0 ? 1 : 0, rem = e ? t.R.len - t.s : t.s;
      if (rem < 10 && t.R.dead[e] && Math.hypot(t.x - P.x, t.z - P.z) > 26) { retire(t); T39.entryDebt++; }
    }
    if ((T39.spawnT -= dt) > 0) return; T39.spawnT = 0.8;
    const want = target(net), n = T39.active.length;
    if (n < want) { let c = null; if (T39.entryDebt > 0 || Math.random() < 0.6) { c = spawnEntry(net); if (c) T39.entryDebt = Math.max(0, T39.entryDebt - 1); } if (!c) spawnRandom(net, 36); }
    else if (n > want + 1) {
      let far = null, fd = 45; for (const t of T39.active) { const d = Math.hypot(t.x - P.x, t.z - P.z); if (d > fd) { fd = d; far = t; } } if (far) retire(far);
    }
  };

  const _ut = updateTraffic;
  updateTraffic = function (dt) {
    try { sync(); } catch (e) { warn('sync', e); }
    try { manners(dt); } catch (e) { warn('manners', e); }
    _ut(dt);
    if (T39.mode === 'city') try { cityStep(dt); } catch (e) { warn('city', e); }
  };
  // a patrol that ends while the player is in a city must still leave the village list
  if (typeof Patrol !== 'undefined' && Patrol.end) { const _end = Patrol.end; Patrol.end = function (p) { _end.call(this, p); if (T39.vt) { const i = T39.vt.indexOf(p.t); if (i >= 0) T39.vt.splice(i, 1); } }; }

  // ===== audit: sample every car for N simulated minutes =====
  const distToRoutes = (routes, x, z) => {
    let best = 1e9;
    for (const R of routes) {
      const sp = R.sp; for (let i = 0; i < sp.length - 1; i++) {
        const a = sp[i], b = sp[i + 1], dx = b.x - a.x, dz = b.z - a.z, l2 = dx * dx + dz * dz || 1;
        const u = U.clamp(((x - a.x) * dx + (z - a.z) * dz) / l2, 0, 1), d = Math.hypot(x - (a.x + dx * u), z - (a.z + dz * u)); if (d < best) best = d;
      }
    }
    return best;
  };
  // village junctions: route ends that lie close to another route (a T or Y junction): a 12 m square around each counts as road surface
  const jnodes = routes => {
    const out = [];
    for (const R of routes) for (const p of [R.sp[0], R.sp[R.sp.length - 1]]) { let near = 0; for (const Q of routes) { if (Q === R) continue; for (let i = 0; i < Q.sp.length; i += 2) if (Math.hypot(Q.sp[i].x - p.x, Q.sp[i].z - p.z) < 12) { near = 1; break; } if (near) break; } if (near) out.push({ x: p.x, z: p.z }); }
    return out;
  };
  // two car bodies (4.4 x 1.8 m, drawn heading) touch: separating-axis test on the two rectangles
  const bodiesOverlap = (a, b) => {
    const ha = a.vh == null ? a.h : a.vh, hb = b.vh == null ? b.h : b.vh;
    const axes = [[Math.sin(ha), Math.cos(ha)], [Math.cos(ha), -Math.sin(ha)], [Math.sin(hb), Math.cos(hb)], [Math.cos(hb), -Math.sin(hb)]];
    const corners = (c, h) => { const HL = (c.L || 4.2) / 2 * 0.9, HW = (c.W || 1.9) / 2 * 0.9, f = [Math.sin(h), Math.cos(h)], r = [Math.cos(h), -Math.sin(h)]; return [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([i, j]) => [c.x + f[0] * HL * i + r[0] * HW * j, c.z + f[1] * HL * i + r[1] * HW * j]); };
    const A = corners(a, ha), B = corners(b, hb);
    for (const [ax, az] of axes) {
      let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9;
      for (const [x, z] of A) { const d = x * ax + z * az; if (d < a0) a0 = d; if (d > a1) a1 = d; }
      for (const [x, z] of B) { const d = x * ax + z * az; if (d < b0) b0 = d; if (d > b1) b1 = d; }
      if (a1 < b0 || b1 < a0) return false;
    }
    return true;
  };
  T39.audit = (minutes = 2, opts = {}) => {
    sync();
    const routes = T39.mode === 'city' ? T39.net.routes : (G.routes || []), dt = 0.05, steps = Math.round(minutes * 60 / dt);
    const V = { wrongSide: 0, laneDrift: 0, heading: 0, offRoad: 0, inBuilding: 0, overlap: 0, stuck: 0, samples: 0, cars: 0 }, ex = [], seen = new Set(), still = new Map();
    const add = (k, t, extra) => { V[k]++; if (ex.length < 12) ex.push(k + ' ' + (extra || '') + ' @' + Math.round(t.x) + ',' + Math.round(t.z)); };
    const save = S.time; if (opts.time != null) S.time = opts.time;
    let maxN = 0;
    for (let i = 0; i < steps; i++) {
      if (T39.mode === 'village' && typeof Plan !== 'undefined' && Plan.updateLights) Plan.updateLights(dt);   // the audit steps the clock itself, so the village lights must be stepped too
      updateTraffic(dt);
      if (i % 5) continue;
      const list = G.traffic.filter(t => !t.patrol); maxN = Math.max(maxN, list.length);
      for (const t of list) {
        V.samples++; seen.add(t);
        if (!t.xfer) {
          const p = routeAt(t.R, t.s), lat = (t.x - p.x) * (p.tz * t.dir) + (t.z - p.z) * (-p.tx * t.dir);
          if (lat < 0.8) add('wrongSide', t, lat.toFixed(2)); else if (Math.abs(lat - LANE) > 0.45) add('laneDrift', t, lat.toFixed(2));
          const hx = p.tx * t.dir, hz = p.tz * t.dir, hh = t.vh == null ? t.h : t.vh, dh = Math.abs(Math.atan2(Math.sin(hh - Math.atan2(hx, hz)), Math.cos(hh - Math.atan2(hx, hz))));
          if (dh > 0.4) add('heading', t, dh.toFixed(2));
        }
        { const d = distToRoutes(routes, t.x, t.z), inBox = (T39.mode === 'city' ? T39.net.nodes : jnodes(routes)).some(n => Math.abs(t.x - n.x) <= (T39.mode === 'city' ? HALF - 0.3 : 6.5) && Math.abs(t.z - n.z) <= (T39.mode === 'city' ? HALF - 0.3 : 6.5));
          if (d > HALF - 0.8 + 0.05 && !inBox) add('offRoad', t, d.toFixed(1) + (t.xfer ? ' xfer u=' + t.xfer.u.toFixed(2) + ' plan=' + t.plan : ' road s=' + t.s.toFixed(0))); }
        if (typeof Col !== 'undefined' && !G.cars.some(c => Math.hypot(c.d.x - t.x, c.d.z - t.z) < 4)) { const q = { x: t.x, z: t.z }; Col.push(q, 0.9); if (Math.hypot(q.x - t.x, q.z - t.z) > 0.15) add('inBuilding', t); }
        for (const o of list) if (list.indexOf(o) > list.indexOf(t) && Math.hypot(o.x - t.x, o.z - t.z) < 5 && bodiesOverlap(t, o)) add('overlap', t, 'd=' + Math.hypot(o.x - t.x, o.z - t.z).toFixed(1));
        const st = still.get(t) || 0;
        if (t.speed < 0.3) { const redNear = (G.stopPts || []).some(s => Math.hypot(s.x - t.x, s.z - t.z) < 38 && s.red(t.h)); if (!redNear) { still.set(t, st + 0.25); if (st + 0.25 > 20 && st <= 20) add('stuck', t, 'speed=' + t.speed.toFixed(2)); } else still.set(t, 0); } else still.set(t, 0);
      }
    }
    S.time = save; V.cars = seen.size; V.maxActive = maxN; V.minutes = minutes; V.violations = V.wrongSide + V.laneDrift + V.heading + V.offRoad + V.inBuilding + V.overlap + V.stuck; V.examples = ex;
    return V;
  };
  // audit the village and every city in turn (the player is moved into each city without the travel fade, then put back)
  T39.auditAll = (minutes = 2, time = 8 * 60) => {
    const out = {}, P = G.player.pos, back = { x: P.x, z: P.z }, away0 = G.away;
    try {
      leaveCity(); G.away = null; out.village = T39.audit(minutes, { time });
      for (const k of Object.keys(Town2.areas)) {
        let A = Town2.areas[k]; if (!A) continue;
        if (A.lazy && typeof Town3 !== 'undefined' && Town3.ensure) A = Town3.ensure(k);
        if (!A || !specFor(k, A)) continue;
        if (G.away) G.away.g.visible = false; G.away = A; A.g.visible = true; P.set(A.cx + (A.size === 'large' ? 20 : A.size === 'medium' ? 0 : 26), 0, A.cz - 30);
        sync(); out[k] = T39.audit(minutes, { time });
        out[k].size = A.size || 'small'; out[k].lights = (T39.net.lights || []).length;
      }
    } finally {
      leaveCity(); if (G.away) G.away.g.visible = false; G.away = null; if (away0) { G.away = away0; away0.g.visible = true; } P.set(back.x, 0, back.z); sync();
    }
    return out;
  };
  T39.status = () => ({ mode: T39.mode, key: T39.key, active: T39.active.length, pool: T39.pool.length, target: T39.net ? target(T39.net) : null, tier: G.Q && G.Q.lvl, log: T39.log });

  villageTune();
});
