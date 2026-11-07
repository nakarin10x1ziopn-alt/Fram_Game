// v57_cctvspots.js: CCTV installation points.
//  1) nine more spots around the farm (17 in all)
//  2) every spot is checked once the world exists: the pole stands in the clear (not on the driveway or a road, not in the plots, the pen, water,
//     the garage apron or against a building or tree) with an open view of the area it is meant to watch
//  3) choosing a spot in the angle window puts the pole at that spot (no technician fee), ready to be aimed; it no longer just turns the lens
V23.add('v57_cctvspots', () => {
  if (typeof MOUNTS === 'undefined' || typeof CCTV === 'undefined' || typeof Col === 'undefined') return;
  // x,z = pole, lx,lz = what it watches, y = pole height
  Object.assign(MOUNTS, {
    pond: { n: 'บ่อเลี้ยงปลา', x: 18, z: 8, y: 3.2, lx: 25, lz: 15 },
    greenhouse: { n: 'เรือนกระจก', x: 49, z: 25, y: 3.2, lx: 57, lz: 16 },
    paddy: { n: 'แปลงนา', x: 46, z: -3, y: 3.2, lx: 58, lz: -10 },
    flower: { n: 'สวนดอกไม้', x: 27, z: -10, y: 3.2, lx: 34, lz: -18 },
    plant: { n: 'โรงงานแปรรูป', x: 24, z: -45, y: 3.6, lx: 32, lz: -50 },
    solar: { n: 'โซลาร์ฟาร์ม', x: -46, z: 1, y: 3.4, lx: -54, lz: -6 },
    drive: { n: 'ถนนทางเข้าโรงจอดรถ', x: -32, z: -38, y: 3.6, lx: -48, lz: -45 },
    back: { n: 'หลังบ้าน', x: -26, z: -42, y: 3.4, lx: -20, lz: -50 },
    bus: { n: 'ป้ายรถบัสหน้าไร่', x: -14, z: -56, y: 3.6, lx: -6.6, lz: -62 },
  });
  MOUNTS.garage = { n: 'โรงจอดรถ (หน้าโรงรถ)', x: -50, z: -38, y: 4.0, lx: -57, lz: -45 };
  MOUNTS.drive.n = 'ถนนทางเข้าโรงจอดรถ (ทางรถวิ่ง)';

  // ---------- what is a bad place for a pole ----------
  const G0 = typeof GARAGE !== 'undefined' ? GARAGE : { x: -60, z: -46, rot: Math.PI / 2, w: 11, d: 7.5 };
  // the gravel driveway: from the garage front to the farm gate (same numbers as garage.js)
  const DA = { x: G0.x + 0.3, z: G0.z + 4.3 }, DB = { x: G0.x + 62, z: G0.z - 4.3 };
  const segDist = (x, z, a, b) => { const dx = b.x - a.x, dz = b.z - a.z, t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz))); return Math.hypot(x - (a.x + t * dx), z - (a.z + t * dz)); };
  const inApron = (x, z) => { const c = Math.cos(G0.rot), s = Math.sin(G0.rot), dx = x - G0.x, dz = z - G0.z, lx = dx * c - dz * s, lz = dx * s + dz * c; return Math.abs(lx) < 14 && lz > -G0.d / 2 - 2 && lz < G0.d / 2 + 8; };
  const FARM = (typeof ZONES !== 'undefined' && ZONES.find(q => q.id === 'farm')) || { x: 0, z: 2, hw: 80, hd: 68 };
  const bad = (x, z) => {
    if (Math.abs(x - FARM.x) > FARM.hw - 3 || Math.abs(z - FARM.z) > FARM.hd - 3) return 'นอกไร่';
    if (segDist(x, z, DA, DB) < 3.6) return 'ทางรถวิ่ง';
    if (inApron(x, z)) return 'ลานหน้าโรงรถ';
    try { if (roadDist(x, z) < 6.5) return 'ถนน'; } catch (e) { }
    if (typeof FIELD !== 'undefined' && x > FIELD.x0 - 2 && x < FIELD.x0 + FIELD.cols * FIELD.step + 1 && z > FIELD.z0 - 2 && z < FIELD.z0 + FIELD.rows * FIELD.step + 1) return 'แปลงผัก';
    if (typeof PEN !== 'undefined' && x > PEN.x0 - 1.5 && x < PEN.x1 + 1.5 && z > PEN.z0 - 1.5 && z < PEN.z1 + 1.5) return 'คอกสัตว์';
    try { if (Fish.isWater && Fish.isWater(x, z)) return 'น้ำ'; } catch (e) { }
    const p = { x, z }; try { if (Col.push(p, 0.9)) return 'ชนสิ่งก่อสร้าง'; } catch (e) { }
    for (const q of World.pois) { if (q.x != null && !q.lt56 && Math.hypot(q.x - x, q.z - z) < 2.2) return 'ติดจุดใช้งาน'; }
    return '';
  };
  const blockedAt = (x, z) => {
    const a = Col.map.get(Col.key(Math.floor(x / Col.cs), Math.floor(z / Col.cs))); if (!a) return false;
    for (const s of a) {
      if (s.type === 'b') { if (s.hw < 1.0 || s.hd < 1.0) continue; const dx = x - s.x, dz = z - s.z; if (Math.abs(dx * s.c - dz * s.s) < s.hw && Math.abs(dx * s.s + dz * s.c) < s.hd) return true; }
      else if (s.r >= 0.4 && Math.hypot(x - s.x, z - s.z) < s.r) return true;
    }
    return false;
  };
  // share of the view toward (tx,tz) that is blocked by a building or tree before it gets there
  const occlusion = (x, z, tx, tz) => {
    const dist = Math.hypot(tx - x, tz - z), base = Math.atan2(tx - x, tz - z), R = Math.min(32, Math.max(6, dist - 2.5)); let n = 0, bl = 0;
    for (let a = -18; a <= 18; a += 6) { n++; const yaw = base + a * Math.PI / 180; for (let t = 1.6; t <= R; t += 0.8) { if (blockedAt(x + Math.sin(yaw) * t, z + Math.cos(yaw) * t)) { bl++; break; } } }
    return bl / n;
  };

  // ---------- put every pole in the clear ----------
  const report = [];
  function settle() {
    for (const k of Object.keys(MOUNTS)) {
      const M = MOUNTS[k]; if (M.mv || M._v57) continue; M._v57 = 1;
      const nominal = { x: M.x, z: M.z }, why0 = bad(M.x, M.z), occ0 = occlusion(M.x, M.z, M.lx, M.lz);
      if (!why0 && occ0 <= 0.2) continue;
      let best = null;
      for (let r = 0; r <= 16; r += r < 3 ? 1.5 : 2) for (let i = 0; i < (r ? 20 : 1); i++) {
        const a = i / 20 * Math.PI * 2, x = Math.round((nominal.x + Math.cos(a) * r) * 2) / 2, z = Math.round((nominal.z + Math.sin(a) * r) * 2) / 2;
        if (bad(x, z)) continue; if (Math.hypot(M.lx - x, M.lz - z) < 3.5) continue;
        const o = occlusion(x, z, M.lx, M.lz), score = r * 1.0 + o * 45; if (!best || score < best.score) best = { x, z, score, o };
      }
      if (best) { report.push(`${k}: ${nominal.x},${nominal.z} (${why0 || 'มองถูกบัง ' + Math.round(occ0 * 100) + '%'}) -> ${best.x},${best.z}`); M.x = best.x; M.z = best.z; }
      else report.push(`${k}: no clear spot near ${nominal.x},${nominal.z} (${why0})`);
    }
    try { CCTV.draw(); } catch (e) { }
  }
  settle();

  // ---------- choosing a spot in the angle window moves the pole there ----------
  const dev = uid => Sec.site('home').dev.find(d => d.uid === uid);
  const _h = UI.H.v36cc;
  UI.H.v36cc = function (d) {
    const inAngle = UI.cur && UI.cur.title === 'ตั้งมุมกล้อง';
    if (d.s === 'zone' && d.x && inAngle && MOUNTS[d.x]) {
      const dd = dev(d.v); if (!dd) return;
      if (!(window.Cam36 && Cam36.state)) return _h.apply(this, arguments);
      // same permission as before (fresh install, standing by it, or the technician's day); the move itself is free
      const near = Math.hypot(G.player.pos.x - CCTV.spotOf(dd).x, G.player.pos.z - CCTV.spotOf(dd).z) < 30, tech = Cam36.state().tech && Cam36.state().tech[dd.uid] === S.day;
      if (!(dd.fresh || near || tech || dd.k === 'cam_ptz')) { UI.toast('ต้องเรียกช่างหรือเดินไปใกล้กล้องก่อน', '👷'); return; }
      if (dd.spot === d.x) { UI.toast('กล้องอยู่ที่จุดนี้แล้ว', 'ℹ️'); return; }
      const err = CCTV.ok('home', dd, d.x); if (err) { UI.toast(err, '📏'); return; }
      dd.spot = d.x; const p = Cam36.state().pose[dd.uid]; if (p) { p.zone = ''; p.yo = 0; p.po = 0; }
      try { CCTV.draw(); } catch (e) { }
      UI.toast(`📍 วางเสาติดกล้องที่ ${MOUNTS[d.x].n} แล้ว (ฟรี) — ปรับมุมต่อได้เลย`, '📹'); CCTV.vd = dd; return;
    }
    return _h.apply(this, arguments);
  };
  // wording and highlight of the spot list in the angle window
  { const _a = CCTV.angleUI.bind(CCTV);
    CCTV.angleUI = function (uid) {
      _a(uid); const c = UI.cur; if (!c || c._v57) return; c._v57 = 1; const r0 = c.render, d = dev(uid);
      c.render = t => {
        let h = r0(t); const cur = (dev(uid) || d).spot || 'house';
        h = h.replace('<h5>ทิศที่มอง (โซนเฝ้าระวัง)</h5>', '<h5>จุดติดตั้ง / โซนที่เฝ้า (เลือกแล้วเสากล้องไปวางที่จุดนั้นให้เลย ฟรี)</h5>');
        h = h.replace(new RegExp('<button class="btn (?:ghost)?" (data-a="v36cc" data-s="zone" data-v="[^"]+" data-x="' + cur + '")', 'g'), (m, a) => `<button class="btn" ${a}`);
        return h.replace(new RegExp('(data-a="v36cc" data-s="zone" data-v="[^"]+" data-x="' + cur + '"[^>]*>)'), '$1📍 ');
      };
      UI.renderBody();
    }; }
  window.Spots57 = { bad, occlusion, settle, report, MOUNTS };
});
