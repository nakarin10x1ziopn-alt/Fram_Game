'use strict';
// ---------- v28_infra: (A) a university campus in the medium cities, tied to the Edu24 education system;
// (B) 3D models for the IT gear installed in the main house (router, switch, rack, UPS, NAS, server, NVR, cameras, alarm, PC towers, meters...);
// (C) separate electricity and water meters for every new house (Prop23), with readings, weekly bills and dashboards. ----------
V23.add('v28_infra', () => {
  const st8 = () => (S.v28 = S.v28 || {});
  const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

  // =====================================================================================================
  // A. university campus in every medium city
  // =====================================================================================================
  const kit = window.V23Kit;
  if (kit && window.V25) {
    // reserve one more civic lot (east side of the main street) by taking a house slot out of the plan; the plan object is shared with V25Towns
    const addUniLot = T => {
      const P = T._plan; if (!P || T.built || P.lots.some(l => l.v28)) return;
      const i = P.houses.findIndex(s => s.st === 20 && s.side === 1 && s.row === 3); if (i < 0) return;
      const s = P.houses.splice(i, 1)[0], d = 11;
      const lot = { id: P.key + ':civic' + P.lots.length, kind: 'civic', w: Math.min(16, P.sp.step - 1), d, st: s.st, side: s.side, rot: s.rot, fx: s.fx, z: s.z, x: s.fx + s.side * d / 2, taken: false, rows: [s.row], v28: 1 };
      P.lots.push(lot); P.foot(lot.x, lot.z, lot.rot, lot.w, lot.d, 'lot-civic');
    };
    for (const T of kit.TOWNS) if (T.size === 'medium') addUniLot(T);
    { const lp = window.V25Layout && V25Layout.plan; if (lp) V25Layout.plan = function (T) { const had = !!T._plan, P = lp.call(this, T); if (!had && T.size === 'medium') addUniLot(T); return P; }; }

    const once = k => { const s = (S.v25 = S.v25 || {}); s.d = s.d || {}; if (s.d[k] === S.day) return false; s.d[k] = S.day; return true; };
    const campus = () => {
      if (!window.Edu24 || !Edu24.html) { UI.toast('ระบบการศึกษายังไม่พร้อม', '🎓'); return; }
      Edu24.atCampus = true; UI.open('🎓 มหาวิทยาลัย — ลงทะเบียนเรียน เข้าห้องเรียน และห้องสอบ', null, () => Edu24.html(true), { wide: true });
      const c = UI.cur, oc = c && c.onClose; if (c) c.onClose = () => { Edu24.atCampus = false; if (oc) oc(); };
    };
    const library = () => {
      if (!once('lib28')) { UI.toast('วันนี้อ่านหนังสือที่ห้องสมุดไปแล้ว', '📚'); return; }
      tick(60); S.mood = Math.min(100, (S.mood || 50) + 4); Prog.add(6); UI.toast('อ่านหนังสือที่ห้องสมุดมหาวิทยาลัย 1 ชั่วโมง (ฟรี)', '📚');
    };
    V25.ensureHook('*', (A, info) => {
      if (info.size !== 'medium' || A._v28uni) return;
      const T = kit.TOWNS.find(t => t.key === info.id); if (!T) return;
      const lot = V25.freeLots(info.id, 'civic').find(l => l.v28); if (!lot) return; A._v28uni = 1;
      const name = `มหาวิทยาลัย ${T.n}`, o = { w: Math.min(lot.w - 1, 14), d: Math.min(lot.d - 1, 9.5), h: 5.4, flat: true, glassFront: true, wall: 0xf3e5f5, roof: 0x4a148c, sign: name, signStyle: { bg: '#4a148c' } };
      const p = V25.lotPos(lot, o.d), b = World.building(o); b.position.set(p.x, 0, p.z); b.rotation.y = p.rot; A.g.add(b);
      Col.box(p.x, p.z, o.w / 2 + 0.3, o.d / 2 + 0.3, p.rot, 'bld'); V25.takeLot(info.id, lot.id);
      const door = l2w(p.x, p.z, p.rot, 0, o.d / 2 + 1.7), kind = `v28_${info.id}_uni`;
      const items = () => [{ label: 'ลงทะเบียน / ห้องเรียน / สอบ', icon: '🎓', fn: campus }, { label: 'ห้องสมุดมหาวิทยาลัย', icon: '📚', fn: library }];
      ROOM_KIND[kind] = { w: 16, d: 11, floor: 0xe8e0d0, wall: 0xfdf6e3, title: name };
      World.pois.push({ kind: 'act', x: door.x, z: door.z, r: 2.6, label: name, icon: '🎓', map: false, room: { kind, title: name, v25: { items, per: 2, bg: '#4a148c' } }, act: () => G.away === A ? { icon: '🎓', label: name, fn: () => { } } : null });
    });
  }

  // =====================================================================================================
  // B. 3D models for installed IT gear
  // =====================================================================================================
  const leds = [];
  const blk = mc(0x25292d, { roughness: 0.5 }), gry = mc(0x4a5157, { roughness: 0.5 }), wht = mc(0xeceff1, { roughness: 0.4 }), met = mc(0x90a4ae, { metalness: 0.5, roughness: 0.4 });
  const bx = (p, w, h, d, mat, x, y, z) => U.mk(p, GEO.box, mat, [x, y, z], [w, h, d]);
  const ledMat = (on, blink, color) => { const m = new THREE.MeshBasicMaterial({ color: on ? color : 0xff3b30 }); if (on && blink) leds.push({ m, c: color, t: Math.random() * 3 }); return m; };
  const led = (p, on, blink, x, y, z, color = 0x4cff6a, r = 0.007) => U.mk(p, GEO.sphLo, ledMat(on, blink, color), [x, y, z], r);
  const dispMat = (on, c) => new THREE.MeshBasicMaterial({ color: on ? c : 0x101214 });
  const devs = () => { try { return Sec.site('home').dev.filter(d => !(window.Move37 && Move37.moved(d))); } catch (e) { return []; } };
  const TY = k => (typeof DEV !== 'undefined' && DEV[k] && DEV[k].t) || '';
  const hasF = k => !!(typeof V23 !== 'undefined' && V23.IT && V23.IT.has(k));
  const solarOn = () => { try { const s = Power.st(); return s.panels + s.farm > 0; } catch (e) { return false; } };

  // one rack-mount style unit; returns its height. front face is +z
  const unit = (g, y, k, D, on) => {
    const t = D.t, W = 0.44, Dp = 0.3;
    if (t === 'ups') { const h = D.va >= 5000 ? 0.46 : 0.24; bx(g, W, h, Dp, blk, 0, y + h / 2, 0); bx(g, 0.18, 0.07, 0.01, dispMat(on, 0x69f0ae), -0.1, y + h * 0.7, 0.156); led(g, on, true, 0.12, y + h * 0.7, 0.155); led(g, on, false, 0.16, y + h * 0.7, 0.155, 0xffc107); bx(g, 0.3, 0.012, 0.01, gry, 0, y + h * 0.3, 0.156); return h; }
    if (t === 'server') { const h = 0.09; bx(g, W, h, Dp, mc(0x1c1f22), 0, y + h / 2, 0); bx(g, 0.34, 0.05, 0.01, gry, -0.04, y + h / 2, 0.156); for (let i = 0; i < 6; i++) led(g, on, true, 0.15 + (i % 3) * 0.0, y + 0.02 + (i >> 1) * 0.02, 0.157, i % 2 ? 0x4cff6a : 0x40c4ff, 0.005); return h; }
    if (t === 'nas') { const h = 0.17; bx(g, W, h, Dp, mc(0x2d3238), 0, y + h / 2, 0); for (let i = 0; i < Math.min(4, D.bays || 4); i++) { bx(g, 0.07, 0.13, 0.01, gry, -0.15 + i * 0.1, y + h / 2, 0.156); led(g, on, true, -0.15 + i * 0.1, y + 0.025, 0.162, 0x40c4ff, 0.004); } return h; }
    if (t === 'nvr' || t === 'dvr') { const h = 0.06; bx(g, W, h, Dp, mc(0x20252a), 0, y + h / 2, 0); bx(g, 0.2, 0.025, 0.01, gry, -0.08, y + h / 2, 0.156); bx(g, 0.07, 0.02, 0.01, dispMat(on, 0x40c4ff), 0.13, y + h / 2, 0.156); led(g, on, true, 0.06, y + h / 2, 0.158, 0xff5252); return h; }
    if (t === 'switch') { const h = 0.045, n = Math.min(D.lan || 8, 24), cols = Math.min(n, 12); bx(g, W, h, 0.2, mc(0x37474f), 0, y + h / 2, 0); for (let i = 0; i < cols; i++) { bx(g, 0.02, 0.014, 0.008, blk, -0.2 + i * (0.4 / Math.max(1, cols - 1)), y + h * 0.58, 0.104); led(g, on, true, -0.2 + i * (0.4 / Math.max(1, cols - 1)), y + h * 0.2, 0.105, D.poe ? 0xffb300 : 0x4cff6a, 0.004); } return h; }
    if (t === 'firewall') { const h = 0.07, c = mc(0x3b1f14); bx(g, W, h, Dp, c, 0, y + h / 2, 0); bx(g, W, 0.012, 0.012, mc(0xff6d00), 0, y + h - 0.01, 0.152); for (let i = 0; i < 4; i++) led(g, on, true, -0.17 + i * 0.05, y + 0.03, 0.155, 0x4cff6a, 0.005); return h; }
    if (t === 'patch') { const h = 0.04; bx(g, W, h, 0.1, mc(0x607d8b), 0, y + h / 2, 0); for (let i = 0; i < 12; i++) bx(g, 0.022, 0.016, 0.006, blk, -0.2 + i * 0.036, y + h / 2, 0.052); return h; }
    if (t === 'router') {
      const h = 0.04; bx(g, 0.28, h, 0.17, k === 'rt_biz' ? mc(0x263238) : wht, 0, y + h / 2, 0);
      for (const s of [-1, 0, 1]) { const a = U.mk(g, GEO.cylLo, k === 'rt_biz' ? blk : wht, [s * 0.1, y + h + 0.11, -0.04], [0.007, 0.22, 0.007]); a.rotation.z = -s * 0.12; }
      for (let i = 0; i < 3; i++) led(g, on, true, -0.06 + i * 0.03, y + 0.02, 0.087, i === 0 ? 0x40c4ff : 0x4cff6a, 0.005);
      if (D.sim) bx(g, 0.05, 0.012, 0.03, mc(0xffc107), 0.1, y + h + 0.006, 0.02);
      return h;
    }
    return 0;
  };
  const camMesh = (D, on) => {
    const g = new THREE.Group(); bx(g, 0.06, 0.06, 0.05, wht, 0, 0, 0);
    const c = new THREE.Group(); c.position.set(0, -0.06, 0.08); c.rotation.x = 0.45; g.add(c);
    if (D.t === 'cam' && (D.ip && (D.poeIn || 0) >= 25)) { U.mk(c, GEO.sph, mc(0xcfd8dc, { roughness: 0.3 }), [0, 0, 0], 0.11); U.mk(c, GEO.sph, mc(0x101214, { roughness: 0.1 }), [0, -0.02, 0.07], 0.05); }
    else if (/d4|wifi/.test(D.n || '') || D.wifiC) { U.mk(c, GEO.sph, wht, [0, 0, 0], 0.075); U.mk(c, GEO.sph, mc(0x101214, { roughness: 0.1 }), [0, -0.01, 0.045], 0.035); }
    else { bx(c, 0.07, 0.07, 0.2, wht, 0, 0, 0.04); U.mk(c, GEO.cyl, mc(0x101214, { roughness: 0.1 }), [0, 0, 0.145], [0.03, 0.01, 0.03], [Math.PI / 2, 0, 0]); }
    led(c, on, true, 0.04, 0.045, 0.1, 0xff1744, 0.006);
    return g;
  };
  const apMesh = on => { const g = new THREE.Group(); U.mk(g, GEO.cyl, wht, [0, 0, 0], [0.16, 0.03, 0.16]); led(g, on, true, 0, -0.018, 0, 0x4cff6a, 0.015); return g; };
  const towerMesh = (pc, i) => {
    const g = new THREE.Group(), hi = pc.score >= 600, mid = pc.score >= 300;
    bx(g, 0.2, 0.43, 0.4, mc(hi ? 0x15181b : mid ? 0x263238 : 0x37474f, { roughness: 0.45 }), 0, 0.215, 0);
    bx(g, 0.012, 0.3, 0.3, new THREE.MeshBasicMaterial({ color: hi ? 0x1a2a3a : 0x1e2a30, transparent: true, opacity: 0.8 }), 0.1, 0.22, 0);
    const col = [0xff1744, 0x40c4ff, 0x69f0ae, 0xffc107][i % 4];
    if (hi) { U.mk(g, GEO.cyl, new THREE.MeshBasicMaterial({ color: col }), [0.1, 0.3, 0.1], [0.05, 0.004, 0.05], [0, 0, Math.PI / 2]); U.mk(g, GEO.cyl, new THREE.MeshBasicMaterial({ color: 0x40c4ff }), [0.1, 0.18, -0.1], [0.05, 0.004, 0.05], [0, 0, Math.PI / 2]); }
    led(g, !pc.broken, !pc.broken, 0.1, 0.38, 0.14, pc.broken ? 0xff3b30 : 0x4cff6a, 0.01);
    return g;
  };

  const state = { grp: null, cols: [], sig: '' };
  const onlineMap = () => { let S2 = null; try { S2 = Sec.status('home'); } catch (e) { } return d => !!(S2 && S2.isOn(d)); };
  const sigNow = () => {
    let on = '', pw = '';
    try { const S2 = Sec.status('home'); pw = S2.on ? 1 : 0; on = devs().map(d => (S2.isOn(d) ? '+' : '-') + d.k).join(','); } catch (e) { }
    const fl = ['e_mdb', 'e_smart', 'w_dmeter', 'e_surge', 'n_ups'].map(k => hasF(k) ? 1 : 0).join('');
    let sol = ''; try { sol = solarOn() ? (Power.st().batt > 0 ? 2 : 1) : 0; } catch (e) { }
    return [on, pw, fl, sol, (S.pcs || []).map(p => (p.score >> 6) + (p.broken ? 'b' : '')).join(',')].join('|');
  };
  const buildIT = (W, w, d) => {
    if (state.grp && state.grp.parent) state.grp.parent.remove(state.grp);
    state.cols.forEach(c => { try { Col.remove(c); } catch (e) { } }); state.cols = []; leds.length = 0;
    const host = W.interior; if (!host) return; const root = new THREE.Group(); root.name = 'v28it'; host.add(root); state.grp = root;
    const on = onlineMap(), L = devs(), by = t => L.filter(x => TY(x.k) === t), F = (g, x, y, z, rot) => { g.position.set(x, y, z); g.rotation.y = rot; root.add(g); return g; };
    const wallZ = d / 2 - 0.03;

    // ----- network cabinet right of the front door -----
    const stack = [];
    const ups = by('ups').sort((a, b) => DEV[b.k].va - DEV[a.k].va)[0], small = hasF('n_ups') && !ups;
    if (ups) stack.push(['ups', ups]); else if (small) stack.push(['ups', { k: 'ups1', virt: 1 }]);
    for (const t of ['server', 'nas', 'nvr', 'dvr']) { const x = by(t)[0]; if (x) stack.push([t, x]); }
    if (L.some(x => TY(x.k) === 'switch') && (Sec.st().cable > 0 || L.some(x => TY(x.k) === 'cam' || TY(x.k) === 'ap'))) stack.push(['patch', null]);
    for (const x of by('switch').slice(0, 6)) stack.push(['switch', x]);
    for (const x of by('firewall').slice(0, 1)) stack.push(['firewall', x]);
    for (const x of by('router').slice(0, 1)) stack.push(['router', x]);
    if (stack.length) {
      const g = new THREE.Group(), rackBig = L.some(x => x.k === 'rack42'), rack = L.some(x => TY(x.k) === 'rack');
      let y = 0.1;
      for (const [t, x] of stack) { const D = x ? DEV[x.k] : { t: 'patch' }; const h = unit(g, y, x ? x.k : '', D, x ? (x.virt ? on({ p: 'site' }) : on(x)) : true); y += h + 0.012; }
      const H = rackBig ? Math.max(1.9, y + 0.1) : Math.max(0.65, y + 0.1);
      const post = rack ? blk : mc(0xa1887f, { roughness: 0.7 });
      for (const sx of [-0.25, 0.25]) bx(g, 0.03, H, 0.34, post, sx, H / 2, 0);
      bx(g, 0.5, 0.03, 0.34, post, 0, H, 0); bx(g, 0.5, 0.04, 0.34, post, 0, 0.02, 0); bx(g, 0.46, H, 0.02, mc(0x2d3238), 0, H / 2, -0.17);
      F(g, 1.4, 0, d / 2 - 0.27, Math.PI); state.cols.push(Col.box(IN.x + 1.4, IN.z + d / 2 - 0.27, 0.28, 0.2, 0));
      if (by('fire')[0]) { const f = U.mk(root, GEO.cyl, mc(0xd32f2f, { roughness: 0.4 }), [1.95, 0.3, d / 2 - 0.22], [0.075, 0.6, 0.075]); U.mk(root, GEO.cyl, blk, [1.95, 0.64, d / 2 - 0.22], [0.03, 0.06, 0.03]); }
      if (by('pac')[0]) { const a = new THREE.Group(); bx(a, 0.9, 0.28, 0.2, wht, 0, 0, 0); bx(a, 0.8, 0.03, 0.01, met, 0, -0.06, 0.105); led(a, on(by('pac')[0]), false, 0.38, 0.08, 0.105, 0x40c4ff); F(a, 1.4, 2.35, d / 2 - 0.12, Math.PI); }
    }
    // ----- ceiling access points / mesh, smoke detector -----
    const aps = L.filter(x => TY(x.k) === 'ap'), apPos = [[-w / 4, -d / 4], [w / 4, -d / 4], [0, d / 4]];
    aps.slice(0, 3).forEach((x, i) => F(apMesh(on(x)), apPos[i][0], 3.17, apPos[i][1], 0));
    if (by('sensor').some(x => x.k === 'smoke') || L.some(x => x.k === 'smoke')) { const m = new THREE.Group(); U.mk(m, GEO.cyl, wht, [0, 0, 0], [0.1, 0.03, 0.1]); led(m, true, true, 0, -0.018, 0, 0xff1744, 0.01); F(m, 0, 3.17, 0.9, 0); }
    // ----- cameras (corner brackets, facing the room) and sensors -----
    const slots = [[-w / 2 + 0.25, -d / 2 + 0.25], [w / 2 - 0.25, -d / 2 + 0.25], [w / 2 - 0.25, d / 2 - 0.25], [-w / 2 + 0.25, d / 2 - 0.25]];
    /* camera housings are drawn by v47_cctv at the real mounting point, aimed like the picture */
    L.filter(x => x.k === 'pir').slice(0, 3).forEach((x, i) => { const [cx, cz] = slots[(i + 2) % 4]; const m = new THREE.Group(); bx(m, 0.07, 0.09, 0.04, wht, 0, 0, 0); U.mk(m, GEO.sph, mc(0xfafafa, { roughness: 0.2 }), [0, 0.0, 0.03], [0.03, 0.035, 0.015]); led(m, on(x), true, 0, -0.035, 0.022, 0xff1744, 0.004); F(m, cx, 2.35, cz, Math.atan2(-cx, -cz)); });
    if (L.some(x => x.k === 'siren')) { const s = new THREE.Group(); bx(s, 0.18, 0.12, 0.08, mc(0xd32f2f), 0, 0, 0); U.mk(s, GEO.cone, blk, [0, 0, 0.1], [0.07, 0.1, 0.07], [Math.PI / 2, 0, 0]); F(s, 3.0, 2.9, -d / 2 + 0.06, 0); }
    // ----- door side: keypad, finger/card reader, digital lock -----
    const alarm = by('alarm')[0]; if (alarm) { const k = new THREE.Group(); bx(k, 0.13, 0.19, 0.03, blk, 0, 0, 0); bx(k, 0.09, 0.04, 0.005, dispMat(on(alarm), 0x40c4ff), 0, 0.055, 0.018); for (let i = 0; i < 6; i++) bx(k, 0.025, 0.02, 0.005, gry, -0.03 + (i % 3) * 0.03, -0.01 - (i >> 1) * 0.03 + (i >> 1 ? 0 : 0), 0.018); led(k, on(alarm), true, 0.05, 0.085, 0.018, S.sec && S.sec.armed ? 0xff1744 : 0x4cff6a, 0.006); F(k, 0.85, 1.35, wallZ, Math.PI); }
    if (by('lock')[0]) { const l = new THREE.Group(); bx(l, 0.07, 0.22, 0.05, blk, 0, 0, 0); bx(l, 0.04, 0.05, 0.006, dispMat(on(by('lock')[0]), 0x40c4ff), 0, 0.05, 0.028); led(l, on(by('lock')[0]), true, 0, -0.07, 0.028, 0x40c4ff, 0.007); F(l, -0.42, 1.0, d / 2 - 0.06, Math.PI); }
    // ----- wall equipment left of the door: reader, breaker box, smart meter, digital water meter, solar inverter + battery -----
    const items = [];
    if (by('access')[0]) items.push({ id: 'acc', w: 0.14, y: 1.25 });
    if (!(window.Move37 && Move37.movedId('mdb')) && hasF('e_mdb')) items.push({ id: 'mdb', w: 0.4, y: 1.5 });
    if (hasF('e_smart')) items.push({ id: 'sm', w: 0.24, y: 1.5 });
    if (hasF('w_dmeter')) items.push({ id: 'dm', w: 0.22, y: 1.3 });
    if (!(window.Move37 && Move37.movedId('inv')) && solarOn()) items.push({ id: 'inv', w: 0.46, y: 1.55 });
    if (!(window.Move37 && Move37.movedId('sg')) && hasF('e_surge')) items.push({ id: 'sg', w: 0.32, y: 0.95 });
    const limit = -(w / 4 + 0.6) + 0.75 - 0.05; let cx = -0.78, row = 0;
    for (const it of items) {
      if (cx - it.w < limit) { cx = -0.78; row++; }
      const x = cx - it.w / 2, y = it.y - row * 0.6, g = new THREE.Group(); cx -= it.w + 0.08;
      if (it.id === 'acc') { bx(g, 0.1, 0.16, 0.03, blk, 0, 0, 0); led(g, on(by('access')[0]), true, 0, 0.04, 0.018, 0x40c4ff, 0.008); bx(g, 0.05, 0.05, 0.005, gry, 0, -0.03, 0.018); }
      if (it.id === 'mdb') { bx(g, 0.38, 0.5, 0.1, mc(0x78909c, { roughness: 0.5, metalness: 0.4 }), 0, 0, 0); bx(g, 0.32, 0.4, 0.01, mc(0x546e7a), 0, 0, 0.055); for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) bx(g, 0.03, 0.05, 0.02, c === 0 ? mc(0xd32f2f) : wht, -0.125 + c * 0.05, 0.08 - r * 0.12, 0.065); }
      if (it.id === 'sm') { bx(g, 0.22, 0.3, 0.08, wht, 0, 0, 0); bx(g, 0.16, 0.06, 0.005, dispMat(true, 0x69f0ae), 0, 0.07, 0.042); led(g, true, true, -0.07, -0.05, 0.042, 0x4cff6a, 0.008); led(g, true, false, 0.07, -0.05, 0.042, 0xffc107, 0.008); }
      if (it.id === 'dm') { U.mk(g, GEO.cyl, mc(0x1565c0, { roughness: 0.4 }), [0, 0, 0], [0.1, 0.06, 0.1], [Math.PI / 2, 0, 0]); bx(g, 0.1, 0.04, 0.005, dispMat(true, 0x80d8ff), 0, 0, 0.035); }
      if (it.id === 'inv') { bx(g, 0.44, 0.5, 0.12, wht, 0, 0, 0); bx(g, 0.2, 0.08, 0.005, dispMat(S.time > 360 && S.time < 1080, 0x69f0ae), -0.08, 0.12, 0.062); led(g, true, true, 0.12, 0.12, 0.062, 0x4cff6a, 0.01); if (Power.st().batt > 0) { bx(g, 0.46, 0.6, 0.16, mc(0x263238), 0, -0.58, 0.02); bx(g, 0.3, 0.03, 0.005, dispMat(true, 0x69f0ae), 0, -0.4, 0.105); } }
      if (it.id === 'sg') { bx(g, 0.3, 0.06, 0.06, wht, 0, 0, 0); led(g, true, false, 0.1, 0, 0.032, 0x4cff6a, 0.008); }
      F(g, x, y, wallZ, Math.PI);
    }
    // ----- PC towers beside the computer desk -----
    (S.pcs || []).filter(pc => !(window.Move37 && Move37.movedPC(pc))).slice(0, 2).forEach((pc, i) => { const t = towerMesh(pc, i), x = w / 2 - 0.28, z = -d / 2 + 2.9 + i * 0.28; F(t, x, 0, z, -Math.PI / 2); state.cols.push(Col.box(IN.x + x, IN.z + z, 0.12, 0.2, 0)); });
    state.sig = sigNow();
  };
  const rebuildIT = () => { try { if (World.interior) { const [w, d] = ROOM[S.up.house - 1]; buildIT(World, w, d); } } catch (e) { console.warn('v28 IT models', e); } };
  { const _sp = Smart.place.bind(Smart);
    Smart.place = function (W, has, placeK, w, d) { _sp(W, has, placeK, w, d); try { buildIT(W, w, d); } catch (e) { console.warn('v28 IT models', e); } }; }
  setInterval(() => { try { if (World.interior && sigNow() !== state.sig) rebuildIT(); } catch (e) { } }, 3000);
  setInterval(() => { try { if (!leds.length || !(G.inside && !G.inRoom)) return; const k = (performance.now() / 1000); for (const l of leds) { const on = Math.sin(k * 5 + l.t * 7) > -0.2; l.m.color.setHex(on ? l.c : 0x18301c); } } catch (e) { } }, 220);

  // =====================================================================================================
  // C. separate meters for every new house
  // =====================================================================================================
  if (typeof Prop23 === 'undefined') return;
  // watts / litres model: [kWh per hour, 1 = only while someone is in the house]
  const EL = { tv: [0.09, 1], fridge: [0.045, 0], fan: [0.05, 1], console: [0.15, 1], radio: [0.012, 1], pcdesk: [0.25, 1], washer: [0.1, 1], shower: [0.12, 1], lamp: [0.01, 1], lantern: [0.01, 1], kitchen: [0.06, 1], aquarium: [0.02, 0] };
  const WT = { shower: 0.025, kitchen: 0.012, washer: 0.02, plant: 0.003 };
  const BASE_KWH = 0.008;
  const M = hid => { const s = st8(); s.m = s.m || {}; const r = s.m[hid] = s.m[hid] || { e: { r: 0, wk: 0, td: 0 }, w: { r: 0, wk: 0, td: 0 }, log: [], bills: [] }; return r; };
  const live = (h, k) => !!(h.util && h.util[k] && S.day >= h.util[k]);
  const occupied = hid => !!(G.inRoom && Rooms.cur && Rooms.cur.def && Rooms.cur.def.home === hid);
  const rates = (h, occ) => {
    let kw = BASE_KWH, m3 = 0;
    for (const it of h.items || []) {
      const e = EL[it.k]; if (it.k === 'pcdesk' && window.PC39) kw += PC39.homeKw(it); else if (e && (!e[1] || occ)) kw += e[0];
      if (occ && WT[it.k]) m3 += WT[it.k];
    }
    return { kw, m3 };
  };
  const cache = {};
  const _tick = tick;
  tick = function (m) {
    _tick(m);
    try {
      const homes = Prop23.V().homes, hr = m / 60;
      for (const hid in homes) {
        const h = homes[hid], e = live(h, 'e'), w = live(h, 'w'); if (!e && !w) continue;
        const occ = occupied(hid), key = hid + (occ ? 'o' : 'u') + (window.PC39 ? PC39.homeSig(h) : ''), c = cache[key];
        let r; if (c && c.n > 0 && c.len === (h.items || []).length) { c.n--; r = c.r; } else { r = rates(h, occ); cache[key] = { n: 30, len: (h.items || []).length, r }; }
        const mt = M(hid);
        if (e && !S.powerOff && Power.st().out <= 0) { mt.e.r += r.kw * hr; mt.e.wk += r.kw * hr; mt.e.td += r.kw * hr; }
        if (w && r.m3) { mt.w.r += r.m3 * hr; mt.w.wk += r.m3 * hr; mt.w.td += r.m3 * hr; }
      }
    } catch (er) { if (!tick._warned) { tick._warned = 1; console.warn('v28 meters', er); } }
  };
  { const _nd = newDay; newDay = function () {
    _nd();
    try { for (const hid in Prop23.V().homes) { const mt = M(hid); mt.log.unshift({ day: S.day - 1, kwh: +mt.e.td.toFixed(2), m3: +mt.w.td.toFixed(2) }); mt.log.length = Math.min(mt.log.length, 7); mt.e.td = 0; mt.w.td = 0; } } catch (e) { console.warn('v28 meter log', e); }
  }; }
  const elecBill = u => {
    let energy = 0, left = u, prev = 0;
    for (const [cap, rate] of TARIFF.steps) { const x = Math.min(left, cap - prev); if (x <= 0) break; energy += x * rate; left -= x; prev = cap; }
    const ft = u * TARIFF.ft, vat = (energy + ft + TARIFF.service) * TARIFF.vat;
    return Math.round(energy + ft + TARIFF.service + vat);
  };
  const waterBill = m3 => { let left = m3, prev = 0, t = 0; for (const [cap, r] of WATER_STEPS) { const x = Math.min(left, cap - prev); if (x <= 0) break; t += x * r; left -= x; prev = cap; } return Math.round(Math.max(50, t) * 1.07); };
  { const _b = Life2.bill.bind(Life2);
    Life2.bill = function () {
      const oldB = S.billDue; _b();
      const nb = S.billDue; if (!nb) return;
      const rows = [];
      try {
        for (const [hid, h] of Object.entries(Prop23.V().homes)) {
          const e = live(h, 'e'), w = live(h, 'w'); if (!e && !w) continue;
          const mt = M(hid), ke = mt.e.wk, kw = mt.w.wk, be = e ? elecBill(ke) : 0, bw = w ? waterBill(kw) : 0;
          rows.push({ hid, name: Prop23.homeName(hid), kwh: +ke.toFixed(1), m3: +kw.toFixed(1), elec: be, water: bw, day: S.day });
          mt.bills.unshift({ day: S.day, kwh: +ke.toFixed(1), m3: +kw.toFixed(1), elec: be, water: bw }); mt.bills.length = Math.min(mt.bills.length, 6);
          mt.e.wk = 0; mt.w.wk = 0;
          nb.elec += be; nb.water += bw;
          Phone.msg('การไฟฟ้า & การประปา', `บิลมิเตอร์ ${Prop23.homeName(hid)}: ไฟ ${ke.toFixed(1)} หน่วย ${baht(be)} · น้ำ ${kw.toFixed(1)} ลบ.ม. ${baht(bw)} (รวมในบิลที่ค้างชำระ)`, true);
        }
      } catch (er) { console.warn('v28 house bills', er); }
      nb.homes = ((oldB && oldB.homes) || []).concat(rows);
    }; }
  { const _bh = Life2.billHTML.bind(Life2);
    Life2.billHTML = function () {
      const b = S.billDue, r = _bh();
      if (!b || !b.homes || !b.homes.length) return r;
      return r + `<p class="dim">แยกตามมิเตอร์บ้านใหม่: ${b.homes.map(x => `${esc(x.name)} ไฟ ${baht(x.elec)} น้ำ ${baht(x.water)}`).join(' · ')}</p>`;
    }; }

  const mno = (hid, k) => (k === 'e' ? 'PEA-' : 'PWA-') + String(hash(hid + k) % 1e8).padStart(8, '0');
  const metersHtml = kind => {
    const homes = Object.entries(Prop23.V().homes); if (!homes.length) return '';
    const rows = homes.map(([hid, h]) => {
      const on = live(h, kind), req = h.util && h.util[kind], mt = M(hid), x = mt[kind], last = mt.bills[0];
      const status = on ? '<span class="good">✅ ใช้งาน</span>' : req ? `<span class="dim">⏳ ช่างติดตั้ง${RD(req)}</span>` : '<span class="bad">ยังไม่มีมิเตอร์</span>';
      return `<tr><td>${esc(Prop23.homeName(hid))}</td><td>${mno(hid, kind)}</td><td>${on ? x.r.toFixed(1) : '-'}</td><td>${on ? x.wk.toFixed(1) : '-'}</td><td>${last ? baht(kind === 'e' ? last.elec : last.water) : '-'}</td><td>${status}</td></tr>`;
    }).join('');
    const rate = kind === 'e' ? 'อัตราบ้านอยู่อาศัยแบบก้าวหน้า + Ft + ค่าบริการ + VAT 7%' : 'อัตราประปาบ้านอยู่อาศัย ขั้นต่ำ 50 ฿ + VAT 7%';
    const nm = kind === 'e' ? '⚡ มิเตอร์ไฟฟ้าบ้านใหม่ (แยกจากบ้านหลัก)' : '🚰 มาตรน้ำบ้านใหม่ (แยกจากบ้านหลัก)';
    const unit = kind === 'e' ? 'หน่วย' : 'ลบ.ม.';
    return `<h5>${nm}</h5><table class="tbl"><tr><th>บ้าน</th><th>เลขมิเตอร์</th><th>เลขอ่านสะสม (${unit})</th><th>รอบนี้ (${unit})</th><th>บิลล่าสุด</th><th>สถานะ</th></tr>${rows}</table><p class="dim">${rate} · บิลออกทุก 7 วันรวมกับบิลบ้านหลัก ไฟดับหรือยังไม่จ่ายบิลมิเตอร์ไม่เดิน</p>`;
  };
  { const h = GridApp.html.bind(GridApp); GridApp.html = function (t) { const r = h(t); return t === 0 || t === 3 ? r + metersHtml('e') : r; }; }
  { const h = Water.html.bind(Water); Water.html = function () { return h() + metersHtml('w'); }; }
  { const o = UI.open.bind(UI);
    UI.open = function (title, tabs, render, opts) {
      const r = o(title, tabs, render, opts);
      try { if (/ศูนย์ไอที & สาธารณูปโภค/.test(title) && UI.cur && UI.cur.render && Object.keys(Prop23.V().homes).length) { const rr = UI.cur.render; UI.cur.render = t => rr(t) + (t === 0 ? metersHtml('e') + metersHtml('w') : ''); UI.renderBody(); } } catch (e) { }
      return r;
    }; }

  // the breaker panel of a new house gets two meter faces that show the live readings
  { const _rb = Rooms.build;
    Rooms.build = function (def, K) {
      _rb.call(this, def, K);
      try {
        if (!def.home) return;
        const h = Prop23.home(def.home), mt = M(def.home), g = Rooms.group, X = RM0.x, Z = RM0.z, W = K.w, D = K.d;
        const face = (kind, x, txt, ok, bg) => {
          const m = new THREE.Group(); bx(m, 0.26, 0.32, 0.09, wht, 0, 0, 0); U.mk(m, GEO.cyl, mc(kind === 'e' ? 0xffb300 : 0x1565c0), [0, 0.1, 0.05], [0.025, 0.012, 0.025], [Math.PI / 2, 0, 0]);
          const p = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.09), new THREE.MeshBasicMaterial({ map: U.signTex(txt, { w: 256, h: 96, bg, fg: ok ? '#69f0ae' : '#ff8a80' }) })); p.position.set(0, -0.04, 0.047); m.add(p);
          m.position.set(X - W / 2 + x, 1.55, Z + D / 2 - 0.24); m.rotation.y = Math.PI; g.add(m);
        };
        face('e', 1.2, live(h, 'e') ? `${Math.round(mt.e.r)} kWh` : 'ไม่มีมิเตอร์', live(h, 'e'), '#0d1b2a');
        face('w', 1.55, live(h, 'w') ? `${mt.w.r.toFixed(1)} m³` : 'ไม่มีมาตร', live(h, 'w'), '#0d1b2a');
      } catch (e) { console.warn('v28 meter faces', e); }
    }; }

  window.Infra28 = {
    rebuild: rebuildIT, sig: sigNow, state, meter: M, rates, elecBill, waterBill, leds,
    audit() { return window.V25 ? V25.auditAll() : null; },
  };
});
