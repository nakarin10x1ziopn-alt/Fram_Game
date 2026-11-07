'use strict';
// ---------- v47_cctv: real-looking CCTV cameras whose housing points exactly where the picture looks, clear mounting spots, and a recorder-style picture ----------
// * Cam47.model(d): one detailed 3D model per camera type, modelled on the real products: IP bullet (hood, IR LED ring, ball-joint bracket), IP turret dome (clear dome, IR ring),
//   4K bullet (big body, white-light LEDs), PTZ speed dome (wall arm, smoked dome, moving head), WiFi ball camera (stand + pan-tilt head), 4G solar bullet (panel + antenna), AHD analog bullet.
//   Forward is +z, the origin is the wall / pole bracket.
// * Cam47.aim(model, pose): the housing is turned by the SAME yaw and pitch the live view uses (CCTV.pose), so the model always faces what the picture shows (before, the housing looked at the
//   spot's default point while the picture used the chosen zone / turn / tilt).
// * Cam47.occ(d): does a building or a tree trunk stand in front of the lens? (rays across the field of view marched through the collision map) -> shown in the angle score,
//   and "auto aim" picks the clearest direction.
// * Cam47.osd(): the on-screen display of a real recorder (camera name, date, time, REC dot, codec / megapixels), drawn crisp at the picture's own resolution.
V23.add('v47_cctv', () => {
  if (typeof CCTV === 'undefined' || typeof Sec === 'undefined') return;
  const D2R = Math.PI / 180;
  const M = {
    white: mc(0xeef1f3, { roughness: 0.28, metalness: 0.12 }), grey: mc(0xa4adb4, { roughness: 0.38, metalness: 0.65 }), dark: mc(0x15181b, { roughness: 0.5 }),
    glass: mc(0x04070a, { roughness: 0.04, metalness: 0.9 }), steel: mc(0x6b747b, { roughness: 0.4, metalness: 0.8 }), black: mc(0x0d0f11, { roughness: 0.8 }),
    dome: new THREE.MeshStandardMaterial({ color: 0x1a2127, roughness: 0.05, metalness: 0.6, transparent: true, opacity: 0.42 }),
    led: new THREE.MeshBasicMaterial({ color: 0xff3b30 }), ir: new THREE.MeshBasicMaterial({ color: 0x4a0b0e }), wled: new THREE.MeshBasicMaterial({ color: 0xfff3c9 }),
    panel: mc(0x16245a, { roughness: 0.25, metalness: 0.5 }), cable: mc(0x0b0b0c, { roughness: 0.9 }),
  };
  const cyl = (p, m, x, y, z, r, h, rot) => U.mk(p, GEO.cyl, m, [x, y, z], [r, h, r], rot || [0, 0, 0]);
  const zcyl = (p, m, x, y, z, r, len) => U.mk(p, GEO.cyl, m, [x, y, z], [r, len, r], [Math.PI / 2, 0, 0]);       // cylinder lying along +z
  const box = (p, m, x, y, z, w, h, d) => U.mk(p, GEO.box, m, [x, y, z], [w, h, d]);
  const ball = (p, m, x, y, z, r) => U.mk(p, GEO.sph, m, [x, y, z], r);
  const ring = (p, m, z, R, n, r) => { for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; ball(p, m, Math.cos(a) * R, Math.sin(a) * R, z, r); } };
  // the wall / pole bracket: base plate, ball joint and a short arm to the body
  const bracket = (g, len = 0.06) => { box(g, M.grey, 0, 0, 0.006, 0.1, 0.1, 0.012); for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) cyl(g, M.steel, sx * 0.038, sy * 0.038, 0.014, 0.006, 0.006, [Math.PI / 2, 0, 0]); ball(g, M.grey, 0, 0, 0.03, 0.026); zcyl(g, M.grey, 0, 0, 0.012 + len / 2, 0.012, len); };

  // ---------- the models ----------
  function bullet(g, o) {                                   // IP / AHD bullet: tube body, hood, IR ring, rear cable gland
    const r = o.r, len = o.len, z0 = 0.075, head = new THREE.Group(); g.add(head); g.userData.head = null;
    bracket(g, 0.05);
    zcyl(head, o.body || M.white, 0, 0, z0 + len / 2, r, len);
    zcyl(head, M.grey, 0, 0, z0 + 0.012, r * 1.04, 0.024);                                        // rear cap
    zcyl(head, M.dark, 0, 0, z0 + len + 0.004, r * 0.93, 0.01);                                   // front bezel
    zcyl(head, M.ir, 0, 0, z0 + len + 0.011, r * 0.86, 0.004);                                    // IR window
    zcyl(head, M.glass, 0, 0, z0 + len + 0.015, r * 0.36, 0.006); ball(head, M.black, 0, 0, z0 + len + 0.017, r * 0.18);
    ring(head, o.white ? M.wled : M.led, z0 + len + 0.016, r * 0.62, o.white ? 4 : 6, r * 0.075);
    // sun hood: a plate over the top, longer than the body
    box(head, o.body || M.white, 0, r + 0.006, z0 + len * 0.52, r * 2.3, 0.008, len * 1.08); box(head, o.body || M.white, 0, r - 0.002, z0 + len * 1.04, r * 2.3, 0.02, 0.006);
    cyl(head, M.dark, 0, -r * 0.55, z0 + 0.016, r * 0.2, 0.04);                                  // cable gland
    box(head, M.led, r * 0.55, r * 0.35, z0 + len + 0.014, 0.006, 0.006, 0.003);                 // status LED
    g.userData.pitchOn = head; return g;
  }
  function turret(g, o) {                                   // IP turret / dome: base ring + clear dome, lens ball inside, IR LED ring
    const r = o.r, head = new THREE.Group(); g.add(head); bracket(g, 0.04);
    zcyl(head, M.white, 0, 0, 0.07, r * 1.08, 0.05); zcyl(head, M.grey, 0, 0, 0.098, r * 1.1, 0.008);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.dome); dome.scale.set(r, r, r * 0.95); dome.rotation.x = Math.PI / 2; dome.position.set(0, 0, 0.1); head.add(dome);
    ball(head, M.black, 0, 0, 0.13, r * 0.46); zcyl(head, M.glass, 0, 0, 0.13 + r * 0.46, r * 0.3, 0.008); ring(head, M.led, 0.118, r * 0.8, 8, r * 0.05);
    g.userData.pitchOn = head; return g;
  }
  function ptz(g) {                                         // PTZ speed dome: wall arm, white housing, smoked dome with a head that really turns
    box(g, M.grey, 0, 0, 0.01, 0.13, 0.13, 0.02); zcyl(g, M.grey, 0, 0.02, 0.14, 0.03, 0.26); box(g, M.white, 0, 0.0, 0.27, 0.08, 0.1, 0.1);
    const hang = new THREE.Group(); hang.position.set(0, -0.06, 0.3); g.add(hang);
    cyl(hang, M.white, 0, 0.02, 0, 0.105, 0.14); cyl(hang, M.grey, 0, -0.055, 0, 0.112, 0.012);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 22, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.dome); dome.scale.set(0.105, 0.105, 0.105); dome.position.set(0, -0.06, 0); hang.add(dome);
    const head = new THREE.Group(); head.position.set(0, -0.115, 0); hang.add(head);
    ball(head, M.black, 0, 0, 0, 0.045); zcyl(head, M.glass, 0, 0, 0.045, 0.03, 0.016); ring(head, M.led, 0.04, 0.034, 6, 0.006);
    g.userData.head = head; g.userData.headBase = hang; return g;
  }
  function wifi(g) {                                        // WiFi ball camera on a small stand: pan-tilt head with a black glass face
    cyl(g, M.white, 0, -0.02, 0.02, 0.055, 0.03); cyl(g, M.white, 0, 0.0, 0.02, 0.022, 0.05);
    const head = new THREE.Group(); head.position.set(0, 0.06, 0.02); g.add(head);
    ball(head, M.white, 0, 0, 0, 0.06); const face = new THREE.Mesh(new THREE.CircleGeometry(0.043, 24), M.glass); face.position.set(0, 0.004, 0.056); head.add(face);
    zcyl(head, M.black, 0, 0.004, 0.058, 0.02, 0.006); ball(head, M.led, 0.028, -0.026, 0.05, 0.004);
    g.userData.head = head; return g;
  }
  function solar(g) {                                       // 4G solar bullet: bullet, small solar panel on a hinge, antenna
    bullet(g, { r: 0.034, len: 0.17 });
    const pn = new THREE.Group(); pn.position.set(0, 0.075, 0.13); pn.rotation.x = -0.5; g.add(pn); box(pn, M.panel, 0, 0.0, 0, 0.2, 0.012, 0.15);
    for (let i = -2; i <= 2; i++) box(pn, M.steel, i * 0.04, 0.007, 0, 0.002, 0.001, 0.15); box(pn, M.steel, 0, 0.007, 0, 0.2, 0.001, 0.002);
    cyl(g, M.black, 0.05, 0.03, 0.04, 0.008, 0.16); return g;
  }
  function model(d) {
    const g = new THREE.Group(), k = d && d.k || 'cam_b2';
    if (k === 'cam_ptz') ptz(g);
    else if (k === 'cam_wifi') wifi(g);
    else if (k === 'cam_4g') solar(g);
    else if (k === 'cam_d4') turret(g, { r: 0.062 });
    else if (k === 'cam_8k') bullet(g, { r: 0.05, len: 0.27, white: 1 });
    else if (k === 'cam_ahd') bullet(g, { r: 0.034, len: 0.2, body: M.grey });
    else bullet(g, { r: 0.037, len: 0.21 });
    g.userData.kind = k; return g;
  }
  // turn the housing like the picture: yaw about the vertical, pitch down about the lens axis (the head only, for heads that move)
  function aim(g, o) {
    if (!g || !o) return g; g.rotation.order = 'YXZ'; g.rotation.y = o.yaw; g.rotation.x = 0;
    const ph = o.pitch * D2R;
    if (g.userData.head) { g.userData.head.rotation.order = 'YXZ'; g.userData.head.rotation.x = ph; }
    else if (g.userData.pitchOn) { g.userData.pitchOn.rotation.order = 'YXZ'; g.userData.pitchOn.rotation.x = ph; }
    else g.rotation.x = ph;
    return g;
  }

  // ---------- drawing every camera where it hangs, aimed like its picture ----------
  const prevDraw = CCTV.draw.bind(CCTV);                       // cctv2 (switches, access points) + life5 (cable lines) build this.g first; the cameras are added to it
  CCTV.draw = function () {
    prevDraw(); const g = this.g;
    const seen = {};
    for (const d of Sec.site('home').dev) {
      const D = DEV[d.k]; if (!D) continue;
      if (D.t !== 'cam') continue;
      if (window.Move37 && Move37.moved(d)) continue;                                       // moved cameras are built by v37 (same model + same aim)
      const sp = d.spot || 'house', Mt = MOUNTS[sp]; if (!Mt) continue; let o; try { o = CCTV.pose(d); } catch (e) { continue; }
      const gy = World.groundY(Mt.x, Mt.z), n = seen[sp] = (seen[sp] || 0) + 1;
      if (n === 1) { const poleTop = o.y - gy; cyl(g, mc(0x9e9e9e, { metalness: 0.5, roughness: 0.5 }), Mt.x, gy + poleTop / 2, Mt.z, 0.045, poleTop); cyl(g, M.steel, Mt.x, gy + 0.02, Mt.z, 0.12, 0.04); }
      const m = model(d); aim(m, o);
      // mounted on the pole (or the house wall), a little off it toward where it looks so the bracket clears the pole
      m.position.set(o.x - Math.sin(o.yaw) * 0.06, o.y - (n - 1) * 0.3 + (d.k === 'cam_ptz' ? 0.05 : 0), o.z - Math.cos(o.yaw) * 0.06);
      g.add(m);
    }
  };
  // the housings turn with every change of angle
  { const _h = UI.H.v36cc; UI.H.v36cc = function (d) { const r = _h.apply(this, arguments); try { CCTV.draw(); } catch (e) { } return r; }; }

  // ---------- is anything standing in front of the lens? ----------
  const blockedAt = (x, z) => {
    const a = Col.map.get(Col.key(Math.floor(x / Col.cs), Math.floor(z / Col.cs))); if (!a) return false;
    for (const s of a) {
      if (s.type === 'b') { if (s.hw < 1.0 || s.hd < 1.0) continue; const dx = x - s.x, dz = z - s.z; if (Math.abs(dx * s.c - dz * s.s) < s.hw && Math.abs(dx * s.s + dz * s.c) < s.hd) return true; }
      else if (s.r >= 0.28 && Math.hypot(x - s.x, z - s.z) < s.r) return true;
    }
    return false;
  };
  function occAt(x, z, yaw, fov, R) {
    const N = 9; let blocked = 0, use = 0;
    for (let k = 0; k < N; k++) {
      const a = yaw + (k / (N - 1) - 0.5) * fov * D2R * 0.9; let hit = R;
      for (let t = 1.4; t <= R; t += 0.6) { if (blockedAt(x + Math.sin(a) * t, z + Math.cos(a) * t)) { hit = t; break; } }
      if (hit < R * 0.75) blocked++; use += hit / R;
    }
    return { frac: blocked / N, use: use / N };
  }
  function occ(d, o) { try { o = o || CCTV.pose(d); return occAt(o.x, o.z, o.yaw, o.fov, Math.min(40, Math.max(8, o.dist * 1.1 + 3))); } catch (e) { return { frac: 0, use: 1 }; } }
  // auto aim: of all directions, the clearest one that stays close to where the spot is meant to look
  function autoAim(d) {
    const o = CCTV.pose(d), p = o.p, base = o.yaw - p.yo * D2R; let best = null;
    for (let yo = -180; yo < 180; yo += 15) {
      const yaw = base + yo * D2R, r = occAt(o.x, o.z, yaw, o.fov, Math.min(40, Math.max(8, o.dist * 1.1 + 3))), pen = Math.abs(yo) / 180 * 0.18, sc = (1 - r.frac) * 0.55 + r.use * 0.45 - pen;
      if (!best || sc > best.sc) best = { yo, sc, r };
    }
    return best;
  }

  // ---------- a recorder-style on-screen display ----------
  function osd(g2, d, o, W, H) {
    const px = Math.round(W / 40), pad = Math.round(W / 60), nm = (CCTV.spotOf(d) || {}).n || '', no = String(Sec.site('home').dev.filter(x => DEV[x.k].t === 'cam').indexOf(d) + 1).padStart(2, '0');
    g2.save(); g2.font = `600 ${px}px "Courier New",monospace`; g2.textBaseline = 'top';
    const t = (s, x, y, al) => { g2.textAlign = al; g2.lineWidth = Math.max(2, px / 5); g2.strokeStyle = 'rgba(0,0,0,.85)'; g2.strokeText(s, x, y); g2.fillStyle = '#fff'; g2.fillText(s, x, y); };
    t(`CAM ${no}  ${nm}`, pad, pad, 'left');
    let ts = ''; try { const dd = Cal36.date(); ts = `${dd.be}-${String(dd.m + 1).padStart(2, '0')}-${String(dd.dom).padStart(2, '0')}  ${Phone.clock()}:${String(Math.floor((Date.now() / 1000) % 60)).padStart(2, '0')}`; } catch (e) { ts = Phone.clock(); }
    t(ts, W - pad, pad, 'right');
    const blink = Math.floor(Date.now() / 600) % 2 === 0;
    if (blink) { g2.fillStyle = '#ff2d2d'; g2.beginPath(); g2.arc(pad + px * 0.45, H - pad - px * 0.5, px * 0.36, 0, 7); g2.fill(); }
    t('REC', pad + px * 1.1, H - pad - px * 1.05, 'left');
    let sp = ''; try { sp = (window.Cam36 ? '' : ''); } catch (e) { }
    t(`${d.k === 'cam_8k' ? '4K 8MP' : d.k === 'cam_d4' || d.k === 'cam_ptz' ? '4MP' : '2MP'} H.265  ${o.zoom > 1 ? o.zoom + '× ' : ''}${G.night > 0.5 ? 'IR' : 'COLOR'}`, W - pad, H - pad - px * 1.05, 'right');
    g2.restore();
  }
  window.Cam47 = { model, aim, occ, autoAim, osd, blockedAt };
  CCTV.draw();
});
