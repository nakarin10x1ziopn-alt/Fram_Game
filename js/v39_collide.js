'use strict';
// ---------- v39: solid world + never-stuck player ----------
// 1. every building made with World.building gets a collider if nobody registered one, and standing props whose centre was
//    covered by a tiny pole (so Collide.scan skipped the whole wall) get their own oriented footprint
// 2. moving things the player can bump into on foot (shopper cars, fire/ambulance vehicles, animals, crews, customers) become solid
// 3. big frames are split into small steps so nothing is tunnelled, and an overlap is resolved in several passes
// 4. a watchdog finds the player stuck (trapped inside colliders, ghost driving state, stale modal, stuck action lock,
//    joystick pointer that never got its pointerup) and frees them
V23.add('v39_collide', () => {
  const C = window.Col39 = { added: [], log: [], passes: 0, freed: 0, stats: {} };
  const box3 = new THREE.Box3(), tv = new THREE.Vector3();
  const st = () => { S.v39c = S.v39c || { n: 0, log: [] }; return S.v39c; };
  const note = (kind, extra) => { const e = Object.assign({ k: kind, d: S.day, t: Math.round(S.time) }, extra || {}); C.log.push(e); if (C.log.length > 40) C.log.shift(); try { const s = st(); s.n++; s.log.push(e); if (s.log.length > 12) s.log.shift(); } catch (er) { } };
  const covered = (x, z) => Collide.covered(x, z);
  const topOf = o => { let p = o; while (p.parent) p = p.parent; return p; };
  const attached = o => topOf(o) === topOf(World.outdoor);
  const gyOf = (x, z) => (G.away ? 0 : World.groundY(x, z));

  // ---------------- 1. static colliders ----------------
  // a World.building group starts with a stone plinth (w+0.3 x 0.4 x d+0.3) then the wall box (w x h x d)
  function bldInfo(g) {
    const k = g.children; if (k.length < 3) return null;
    const a = k[0], b = k[1]; if (!a.isMesh || !b.isMesh || !a.geometry || !b.geometry) return null;
    if (!a.geometry.boundingBox) a.geometry.computeBoundingBox(); if (!b.geometry.boundingBox) b.geometry.computeBoundingBox();
    const A = a.geometry.boundingBox, B = b.geometry.boundingBox;
    const ah = A.max.y - A.min.y, bh = B.max.y - B.min.y, aw = A.max.x - A.min.x, bw = B.max.x - B.min.x, ad = A.max.z - A.min.z, bd = B.max.z - B.min.z;
    if (Math.abs(ah - 0.4) > 0.02 || bh < 1.8 || Math.abs(aw - bw - 0.3) > 0.03 || Math.abs(ad - bd - 0.3) > 0.03) return null;
    return { w: bw, d: bd, h: bh, wall: b };
  }
  const yawOf = m => Math.atan2(-m.elements[2], m.elements[0]);
  const sampleUnc = (cx, cz, hw, hd, yaw) => {
    const c = Math.cos(yaw), s = Math.sin(yaw); let unc = 0;
    for (const [fx, fz] of [[0, 0], [-.3, -.3], [.3, -.3], [-.3, .3], [.3, .3]]) {
      const lx = fx * hw * 2, lz = fz * hd * 2;   // local offsets, rotated back to world (inverse of Col's frame)
      const wx = cx + lx * c + lz * s, wz = cz - lx * s + lz * c;
      if (!covered(wx, wz)) unc++;
    }
    return unc;
  };
  // never wall off an interaction point
  const poiInside = sh => {
    for (const p of World.pois) {
      const dx = p.x - sh.x, dz = p.z - sh.z; if (Math.abs(dx) > 25 || Math.abs(dz) > 25) continue;
      if (sh.type === 'c') { if (Math.hypot(dx, dz) < sh.r - 0.1) return p; }
      else { const lx = dx * sh.c - dz * sh.s, lz = dx * sh.s + dz * sh.c; if (Math.abs(lx) < sh.hw - 0.9 && Math.abs(lz) < sh.hd - 0.9) return p; }   // a door POI right at the edge is fine: its reach is 1.4+ m
    }
    return null;
  };
  const track = (sh, owner, kind) => {
    const p = poiInside(sh); if (p) { Col.remove(sh); C.stats.rejectedPoi = (C.stats.rejectedPoi || 0) + 1; return false; }
    C.added.push({ sh, owner, kind }); C.stats[kind] = (C.stats[kind] || 0) + 1; return true;
  };
  function pass(root, gy) {
    if (!root) return 0; let n = 0;
    root.updateMatrixWorld(true);
    root.traverse(o => {
      if (o.userData && (o.userData.c39 || o.userData.noCol)) return;
      if (o.isGroup || (o.isObject3D && !o.isMesh && o.children.length >= 3)) {
        const bi = bldInfo(o);
        if (bi) {
          o.userData.c39b = 1; o.userData.c39 = 1;
          const e = o.matrixWorld; tv.set(bi.wall.position.x, 0, bi.wall.position.z).applyMatrix4(e);
          const yaw = yawOf(e), hw = bi.w / 2 + 0.3, hd = bi.d / 2 + 0.3;
          if (sampleUnc(tv.x, tv.z, hw, hd, yaw) >= 3) { const sh = Col.box(tv.x, tv.z, hw, hd, yaw, 'bld'); if (track(sh, o, 'bld')) n++; }
        }
        return;
      }
      if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || !o.geometry) return;
      o.userData.c39 = 1;
      // merged meshes (perf4/perf5/stable) are many separate parts glued into one buffer: their box is not a solid, so never wall them off
      if (o.userData && (o.userData.merged2 || o.userData.merged3 || o.userData.merged)) return;
      for (let p = o.parent; p; p = p.parent) if (p.userData && (p.userData.noCol || p.userData.c39b || p.userData.merged2 || p.userData.merged3)) return;
      const m = o.material; if (m && (m.transparent && m.opacity < 0.5 || m.blending === THREE.AdditiveBlending || m.visible === false)) return;
      box3.setFromObject(o); const W = box3.max.x - box3.min.x, D = box3.max.z - box3.min.z, H = box3.max.y - box3.min.y;
      if (H < 0.9 || W > 14 || D > 14 || W * D > 120 || (W < 0.12 && D < 0.12)) return;
      const g0 = gy((box3.min.x + box3.max.x) / 2, (box3.min.z + box3.max.z) / 2);
      if (box3.min.y > g0 + 0.6) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      const B = o.geometry.boundingBox, e = o.matrixWorld.elements;
      const sx = Math.hypot(e[0], e[1], e[2]) || 1, sy = Math.hypot(e[4], e[5], e[6]) || 1, sz = Math.hypot(e[8], e[9], e[10]) || 1;
      let cx, cz, hw, hd, yaw = 0;
      if (Math.abs(e[1]) / sx > 0.25 || Math.abs(e[9]) / sz > 0.25 || Math.abs(e[6]) / sy > 0.25) { cx = (box3.min.x + box3.max.x) / 2; cz = (box3.min.z + box3.max.z) / 2; hw = W / 2; hd = D / 2; }
      else { tv.set((B.min.x + B.max.x) / 2, 0, (B.min.z + B.max.z) / 2).applyMatrix4(o.matrixWorld); cx = tv.x; cz = tv.z; hw = (B.max.x - B.min.x) * sx / 2; hd = (B.max.z - B.min.z) * sz / 2; yaw = yawOf(o.matrixWorld); }
      if (hw * 2 > 14 || hd * 2 > 14) return;
      if (sampleUnc(cx, cz, hw, hd, yaw) < 3) return;
      const sh = (hw < 0.8 && hd < 0.8 && Math.abs(hw - hd) < 0.12) ? Col.circle(cx, cz, Math.max(0.15, Math.max(hw, hd)), 'c39') : Col.box(cx, cz, Math.max(0.1, hw), Math.max(0.1, hd), yaw, 'c39');
      if (track(sh, o, 'prop')) n++;
    });
    return n;
  }
  const roots = () => { const r = [[World.outdoor, (x, z) => World.groundY(x, z)]]; if (typeof Town2 !== 'undefined' && Town2.areas) for (const k in Town2.areas) { const A = Town2.areas[k]; if (A && A.g) r.push([A.g, () => 0]); } return r; };
  let sig = '';
  function scan(force) {
    const rs = roots(), s2 = rs.map(r => r[0].children.length).join(',');
    if (!force && s2 === sig) return 0; sig = s2; C.passes++;
    let n = 0; for (const [r, gy] of rs) n += pass(r, gy);
    // colliders whose object left the scene (moved device, finished scaffold, rebuilt house) are dropped
    // (an owner that was only merged into a bigger mesh keeps its collider: something solid still stands there)
    let boxes = null;
    const standing = (x, z) => {
      if (!boxes) { boxes = []; for (const [r, gy] of rs) { r.updateMatrixWorld(true); r.traverse(o => { if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh) return; for (let p = o; p; p = p.parent) if (p.userData && p.userData.noCol) return; const b = new THREE.Box3().setFromObject(o); if (b.max.y - b.min.y < 0.5 || b.max.x - b.min.x > 60 || b.max.z - b.min.z > 60) return; boxes.push(b); }); } }
      for (const b of boxes) if (x > b.min.x - 0.3 && x < b.max.x + 0.3 && z > b.min.z - 0.3 && z < b.max.z + 0.3) return true; return false;
    };
    for (let i = C.added.length - 1; i >= 0; i--) { const a = C.added[i]; if (!attached(a.owner) && !standing(a.sh.x, a.sh.z)) { Col.remove(a.sh); C.added.splice(i, 1); C.stats.dropped = (C.stats.dropped || 0) + 1; } }
    return n;
  }
  C.scan = scan; C.pass = pass;

  // ---------------- 2. moving solids for the player on foot ----------------
  const car2 = (p, r, cx, cz, h) => {
    let hit = false; const sx = Math.sin(h), sz = Math.cos(h);
    for (const k of [1.3, -1.3]) { const ox = cx + sx * k, oz = cz + sz * k, dx = p.x - ox, dz = p.z - oz, d = Math.hypot(dx, dz), m = r + 1.05; if (d < m && d > 1e-4) { p.x = ox + dx / d * m; p.z = oz + dz / d * m; hit = true; } }
    return hit;
  };
  const disc = (p, r, x, z, rr) => { const dx = p.x - x, dz = p.z - z, d = Math.hypot(dx, dz), m = r + rr; if (d < m && d > 1e-4) { p.x = x + dx / d * m; p.z = z + dz / d * m; return true; } return false; };
  function solids(p, r) {
    let hit = false;
    if (typeof Shoppers !== 'undefined') for (const s of Shoppers.list) { if (s.car && s.car.g && s.car.g.visible !== false && Math.abs(s.x - p.x) < 8 && Math.abs(s.z - p.z) < 8) hit = car2(p, r, s.x, s.z, s.h) || hit; }
    if (typeof Emergency !== 'undefined') {
      for (const v of Emergency.vehicles) if (Math.abs(v.x - p.x) < 8 && Math.abs(v.z - p.z) < 8) hit = car2(p, r, v.x, v.z, v.h) || hit;
      for (const c of Emergency.crews) if (c.obj && c.obj.visible && !c.idle) hit = disc(p, r, c.obj.position.x, c.obj.position.z, 0.3) || hit;
      if (Emergency.thief && Emergency.thief.obj) hit = disc(p, r, Emergency.thief.x, Emergency.thief.z, 0.3) || hit;
    }
    for (const A of G.animals) { if (!A.obj || !A.obj.visible || A.d.away) continue; const rr = Math.min(0.75, (ANIMALS[A.d.type] ? ANIMALS[A.d.type].r : 0.5) * 0.65); hit = disc(p, r, A.d.x, A.d.z, rr) || hit; }
    if (typeof Life6 !== 'undefined' && Life6.cust) for (const c of Life6.cust) { if (c.o && c.o.visible) hit = disc(p, r, c.o.position.x, c.o.position.z, 0.3) || hit; }
    return hit;
  }
  C.solids = solids;
  const resolve = (p, r) => { for (let i = 0; i < 4; i++) { let h = Col.push(p, r); h = solids(p, r) || h; if (!h) return i > 0; } return true; };

  // ---------------- 3. small steps + multi-pass resolve ----------------
  let lastGood = null;
  const _up = updatePlayer;
  updatePlayer = function (dt) {
    const n = dt > 0.026 ? Math.min(10, Math.ceil(dt / 0.026)) : 1, sd = dt / n, P = G.player;
    for (let i = 0; i < n; i++) {
      _up(sd);
      if (!G.inside && !G.driving) {
        const p = P.pos, bx = p.x, bz = p.z;
        if (resolve(p, 0.34) && (Math.abs(p.x - bx) > 1e-4 || Math.abs(p.z - bz) > 1e-4)) { if (!G.away) p.y = World.groundY(p.x, p.z); P.obj.position.copy(p); }
        if (isFinite(p.x) && isFinite(p.z)) { if (!lastGood) lastGood = { x: p.x, z: p.z }; else { lastGood.x = p.x; lastGood.z = p.z; } }
      }
    }
  };

  // ---------------- 4. never stuck ----------------
  const free = (x, z) => { const q = { x, z }; resolve(q, 0.34); return Math.hypot(q.x - x, q.z - z) < 0.03; };   // touching a wall (pushed 0.00x m) still counts as free
  function trapped(p) {
    if (free(p.x, p.z)) {
      for (let a = 0; a < 8; a++) { const th = a * Math.PI / 4, q = { x: p.x + Math.sin(th) * 0.5, z: p.z + Math.cos(th) * 0.5 }; resolve(q, 0.34); if (Math.hypot(q.x - p.x, q.z - p.z) > 0.3) return false; }
      return true;
    }
    // overlapping something that will not push out cleanly
    const q = { x: p.x, z: p.z }; resolve(q, 0.34); return !free(q.x, q.z);
  }
  function nearestFree(p) {
    let best = null, bc = 1e9;
    for (let r = 0.8; r <= 12; r += 0.8) for (let a = 0; a < 16; a++) {
      const th = a * Math.PI / 8 + r, x = p.x + Math.sin(th) * r, z = p.z + Math.cos(th) * r;
      if (!G.away && World.groundY(x, z) < -0.3) continue;
      if (!free(x, z)) continue;
      const rd = G.away ? 5 : roadDist(x, z), cost = r + (rd < 2.2 ? 4 : 0);
      if (cost < bc) { bc = cost; best = { x, z }; }
    }
    return best;
  }
  function resetJoy() {
    const j = Input.joy; j.id = null; j.x = 0; j.y = 0; const el = document.getElementById('joy'); if (el) el.classList.remove('on');
  }
  function unstick(reason) {
    const P = G.player, p = P.pos; const spot = nearestFree(p) || lastGood;
    note('unstick', { why: reason, x: Math.round(p.x), z: Math.round(p.z) });
    if (!spot) return false;
    p.x = spot.x; p.z = spot.z; if (!G.away) p.y = World.groundY(p.x, p.z); P.vel.set(0, 0, 0); P.act = null; P.obj.position.copy(p);
    if (S.p) { S.p.x = p.x; S.p.z = p.z; } C.freed++;
    UI.toast('ปลดล็อกตัวละครแล้ว', '🔓'); return true;
  }
  C.unstick = unstick; C.trapped = trapped; C.free = free;

  // pointers that never sent their pointerup (system gesture, notification, button overlay) must not freeze or drive the joystick
  const live = new Set();
  addEventListener('pointerdown', e => { live.add(e.pointerId); const j = Input.joy; if (j.id !== null && j.id !== e.pointerId && !live.has(j.id)) { resetJoy(); note('joy-stale'); } }, true);
  for (const t of ['pointerup', 'pointercancel']) addEventListener(t, e => { live.delete(e.pointerId); if (Input.joy.id === e.pointerId) resetJoy(); }, true);
  addEventListener('touchend', e => { if (e.touches.length === 0) { live.clear(); resetJoy(); Input.ptr.clear(); Input.pinch = 0; } }, true);
  addEventListener('touchcancel', e => { if (e.touches.length === 0) { live.clear(); resetJoy(); Input.ptr.clear(); Input.pinch = 0; } }, true);
  for (const t of ['blur', 'pagehide', 'orientationchange']) addEventListener(t, () => { live.clear(); resetJoy(); Input.ptr.clear(); Input.pinch = 0; });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { live.clear(); resetJoy(); Input.ptr.clear(); Input.pinch = 0; Input.keys = {}; } });

  let stuckT = 0, lx = 0, lz = 0, joyT = 0, pausedT = 0, sleepT = 0;
  function watch(dt) {
    if (!G.started || !G.player || !S || G.simulating) return;
    const P = G.player;
    // a driving state that points at nothing leaves the player invisible and frozen
    if (G.driving && (!G.cars.includes(G.driving) || !G.driving.d)) { G.driving = null; P.obj.visible = true; note('ghost-driving'); }
    // a modal flag with no window on screen blocks movement for good
    const md = document.getElementById('modal');
    if (UI.cur && md && !md.classList.contains('show')) { UI.cur = null; document.body.classList.remove('modal-open'); note('ui-ghost'); }
    // a lock that never ends (bad duration) or an act left behind by a removed module
    if (P.act && P.act.lock && (!isFinite(P.act.dur) || P.act.t > (P.act.dur || 0) + 2.5)) { P.act = null; note('act-lock'); }
    if (!isFinite(P.pos.x) || !isFinite(P.pos.z)) { const g = lastGood || { x: HOUSE_POS.x + 4, z: HOUSE_POS.z + 6 }; P.pos.x = g.x; P.pos.z = g.z; note('nan-pos'); }
    // a pause flag left behind by a cutscene/fade/photo mode that threw halfway freezes the player on the spot
    const fd = document.getElementById('fade');
    if (G.paused && !(fd && fd.classList.contains('on')) && !(typeof Cut !== 'undefined' && Cut.on) && !(typeof Photo !== 'undefined' && Photo.on) && !(typeof Bench2 !== 'undefined' && Bench2.st) && !(typeof Perf4 !== 'undefined' && Perf4.st)) { if ((pausedT += dt) > 4) { G.paused = false; pausedT = 0; note('paused-stale'); } } else pausedT = 0;
    if (G.sleeping) { if ((sleepT += dt) > 6) { G.sleeping = false; sleepT = 0; note('sleep-stale'); } } else sleepT = 0;
    // joystick pointer that is not touching the screen any more
    if (Input.joy.id !== null) { if (!live.has(Input.joy.id)) { if ((joyT += dt) > 1.2) { resetJoy(); joyT = 0; note('joy-orphan'); } } else joyT = 0; } else joyT = 0;
    if (G.driving || G.paused || G.sleeping || UI.isOpen() || (typeof Cut !== 'undefined' && Cut.on) || (P.act && P.act.lock)) { stuckT = 0; lx = P.pos.x; lz = P.pos.z; return; }
    const a = Input.axis(), mag = Math.hypot(a.x, a.y), moved = Math.hypot(P.pos.x - lx, P.pos.z - lz); lx = P.pos.x; lz = P.pos.z;
    if (mag > 0.4 && moved < 0.02) stuckT += dt; else stuckT = Math.max(0, stuckT - dt * 2);
    if (stuckT >= 2) {
      stuckT = 0;
      if (G.inside) return;                                  // rooms clamp the player on purpose
      if (trapped(P.pos)) unstick('trapped');
      else if (!free(P.pos.x, P.pos.z)) { const q = P.pos; resolve(q, 0.34); }
    }
  }
  setInterval(() => { try { watch(0.2); } catch (e) { console.warn('v39 watch', e); } }, 200);
  setInterval(() => { try { if (G.started) scan(false); } catch (e) { console.warn('v39 scan', e); } }, 3000);
  try { scan(true); } catch (e) { console.warn('v39 scan00', e); }
  setTimeout(() => { try { scan(true); } catch (e) { console.warn('v39 scan0', e); } }, 1200);
  setTimeout(() => { try { scan(true); } catch (e) { console.warn('v39 scan1', e); } }, 9000);

  // ---------------- audit helpers ----------------
  // walk-in test: every 'bld' collider is approached from 8 directions with the real resolver; any run that ends inside the walls is a leak
  C.audit = function () {
    const seen = new Set(), out = { buildings: 0, pen: [], groups: [] };
    for (const arr of Col.map.values()) for (const sh of arr) {
      if (seen.has(sh) || sh.type !== 'b' || sh.hw < 1.4 || sh.hd < 1.4) continue; seen.add(sh); out.buildings++;
      let worst = 0;
      for (let k = 0; k < 8; k++) {
        const th = k * Math.PI / 4, R = Math.max(sh.hw, sh.hd) + 3, p = { x: sh.x + Math.sin(th) * R, z: sh.z + Math.cos(th) * R };
        for (let i = 0; i < 400; i++) { const dx = sh.x - p.x, dz = sh.z - p.z, dl = Math.hypot(dx, dz); if (dl < 0.05) break; const s2 = Math.min(0.2, dl); p.x += dx / dl * s2; p.z += dz / dl * s2; resolve(p, 0.34); }
        const ex = p.x - sh.x, ez = p.z - sh.z, lx2 = ex * sh.c - ez * sh.s, lz2 = ex * sh.s + ez * sh.c;
        const depth = Math.min(sh.hw - Math.abs(lx2), sh.hd - Math.abs(lz2)); if (depth > worst) worst = depth;
      }
      if (worst > 0.15) out.pen.push([Math.round(sh.x), Math.round(sh.z), +worst.toFixed(2)]);
    }
    // top-level groups that look like buildings but have nothing solid under them
    const bx = new THREE.Box3();
    for (const [root, gy] of roots()) for (const c of root.children) {
      if (c.userData && c.userData.noCol) continue; bx.setFromObject(c); if (!isFinite(bx.min.x)) continue;
      const w = bx.max.x - bx.min.x, d = bx.max.z - bx.min.z, h = bx.max.y - bx.min.y; if (h < 2.4 || w < 2.5 || d < 2.5 || w > 45 || d > 45) continue;
      const cx = (bx.min.x + bx.max.x) / 2, cz = (bx.min.z + bx.max.z) / 2; if (bx.min.y > gy(cx, cz) + 1) continue;
      let unc = 0; for (const [fx, fz] of [[0, 0], [-.3, -.3], [.3, -.3], [-.3, .3], [.3, .3]]) if (!covered(cx + fx * w, cz + fz * d)) unc++;
      if (unc >= 3) { let best = null, bd = 1e9; for (const p of World.pois) { const dd = Math.hypot(p.x - cx, p.z - cz); if (dd < bd) { bd = dd; best = p; } } out.groups.push([Math.round(cx), Math.round(cz), +w.toFixed(1), +d.toFixed(1), +h.toFixed(1), unc, best && best.label, Math.round(bd)]); }
    }
    return out;
  };
  // one-call state dump for bug reports ('I am stuck')
  C.diagnose = function () {
    const P = G.player, near = [], seen = new Set(), ix = Math.floor(P.pos.x / Col.cs), iz = Math.floor(P.pos.z / Col.cs);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const sh of (Col.map.get(Col.key(ix + a, iz + b)) || [])) { if (seen.has(sh)) continue; seen.add(sh); const d = Math.hypot(sh.x - P.pos.x, sh.z - P.pos.z); if (d < 6) near.push([sh.type, +sh.x.toFixed(1), +sh.z.toFixed(1), sh.type === 'c' ? sh.r : [+sh.hw.toFixed(1), +sh.hd.toFixed(1)], sh.tag || '', +d.toFixed(1)]); }
    return { pos: [+P.pos.x.toFixed(2), +P.pos.z.toFixed(2)], driving: !!G.driving, inside: G.inside, away: !!G.away, ui: !!UI.cur, paused: G.paused, sleeping: G.sleeping, act: P.act && P.act.type, joy: Input.joy.id, free: free(P.pos.x, P.pos.z), trapped: trapped(P.pos), near, traffic: G.traffic.map(t => [+t.x.toFixed(1), +t.z.toFixed(1), +Math.hypot(t.x - P.pos.x, t.z - P.pos.z).toFixed(1)]).filter(a => a[2] < 12) };
  };
  C.report = () => ({ added: C.added.length, stats: C.stats, passes: C.passes, freed: C.freed, log: C.log.slice(-8) });
});
