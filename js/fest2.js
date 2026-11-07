'use strict';
// ---------- Festival light & sound: fireworks with bloom, sky lanterns, sweeping stage beams, string lights and confetti,
// plus a village calendar of real Thai days (New Year countdown, Children's Day, Chinese New Year, Valentine's, Makha Bucha,
// Songkran, Labour Day, Visakha Bucha, Mother's Day, sports day, Red Cross fair, Halloween, Loy Krathong / Yi Peng,
// Father's Day, Christmas) — 1 game week = 1 month, so week 1 is January ----------
// the follower pet is gone: pets live at home and in the arena only
Pet.spawn = function () { if (this.obj) { World.dyn.remove(this.obj); G.scene.remove(this.obj); } this.obj = null; S.riding = false; };
Pets2.toggleRide = () => UI.toast('เลิกระบบสัตว์เลี้ยงเดินตามแล้ว ม้าลงแข่งที่สนามภูผาได้ตามเดิม', '🐎');

const PLAZA = { x: -28, z: -265 };
const CAL = [
  { w: 0, d: 1, k: 'newyear', n: 'วันขึ้นปีใหม่', i: '🎆', fx: 'fireworks', desc: 'ทำบุญตักบาตรตอนเช้า ส่งความสุขปีใหม่ให้ทุกคน' },
  { w: 0, d: 3, k: 'kids', n: 'วันเด็กแห่งชาติ', i: '🧒', fx: 'confetti', desc: 'แจกของขวัญเด็ก ๆ ในหมู่บ้าน ลูกของคุณได้ของเล่น' },
  { w: 1, d: 2, k: 'cny', n: 'ตรุษจีน', i: '🧧', fx: 'cny', desc: 'โคมแดงทั่วเมืองทุ่งทอง แจกอั่งเปา ไหว้เจ้าขอพร' },
  { w: 1, d: 5, k: 'valentine', n: 'วันวาเลนไทน์', i: '💝', fx: 'hearts', desc: 'ซื้อกุหลาบให้คนรัก ความรักเพิ่มเป็นพิเศษ' },
  { w: 2, d: 4, k: 'makha', n: 'วันมาฆบูชา', i: '🕯️', fx: 'candles', desc: 'เวียนเทียนรอบโบสถ์ตอนค่ำ ทำบุญได้บุญสองเท่า' },
  { w: 3, d: 4, k: 'songkran', n: 'สงกรานต์ (ปีใหม่ไทย)', i: '💦', fx: 'water', desc: 'รดน้ำดำหัวผู้ใหญ่ สาดน้ำทั้งหมู่บ้าน' },
  { w: 4, d: 1, k: 'labour', n: 'วันแรงงานแห่งชาติ', i: '🛠️', fx: 'confetti', desc: 'วันหยุดพนักงาน บริษัทของคุณได้ขวัญกำลังใจ' },
  { w: 4, d: 6, k: 'visakha', n: 'วันวิสาขบูชา', i: '🪔', fx: 'candles', desc: 'เวียนเทียนรอบโบสถ์ตอนค่ำ' },
  { w: 5, d: 6, k: 'sports', n: 'งานกีฬาสีหมู่บ้าน', i: '🏃', fx: 'confetti', desc: 'วิ่งแข่ง ชักเย่อ เชียร์ลีดเดอร์ ลุ้นถ้วยรางวัล' },
  { w: 7, d: 5, k: 'mother', n: 'วันแม่แห่งชาติ', i: '🌼', fx: 'confetti', desc: 'มอบพวงมาลัยดอกมะลิให้แม่ ความสนิทเพิ่มทั้งครอบครัว' },
  { w: 8, d: 5, k: 'redcross', n: 'งานกาชาดประจำปี', i: '🎡', fx: 'fireworks', desc: 'ชิงช้าสวรรค์ สอยดาว ซุ้มเกม ของรางวัลเพียบ' },
  { w: 9, d: 7, k: 'halloween', n: 'ปาร์ตี้ฮาโลวีน', i: '🎃', fx: 'halloween', desc: 'ฟักทองแกะสลัก ประกวดชุดแฟนซี' },
  { w: 10, d: 4, k: 'loy', n: 'ลอยกระทง & ยี่เป็ง', i: '🏮', fx: 'lanterns', desc: 'โคมลอยเต็มฟ้า ลอยกระทง และพลุตอนสามทุ่ม' },
  { w: 11, d: 1, k: 'father', n: 'วันพ่อแห่งชาติ', i: '💛', fx: 'confetti', desc: 'ทำความดีเพื่อพ่อ ปลูกต้นไม้ร่วมกัน' },
  { w: 11, d: 5, k: 'xmas', n: 'คริสต์มาส', i: '🎄', fx: 'xmas', desc: 'ต้นคริสต์มาสยักษ์ที่ลานน้ำพุ แลกของขวัญ' },
  { w: 11, d: 7, k: 'countdown', n: 'เคาท์ดาวน์ส่งท้ายปี', i: '🥂', fx: 'fireworks', big: 1, desc: 'คอนเสิร์ตที่ลานน้ำพุ นับถอยหลังเที่ยงคืนพร้อมพลุอลังการ' },
];
// only these are real festivals with a plaza light show; the other calendar days are news and small rewards
const SHOW_DAYS = ['newyear', 'cny', 'songkran', 'redcross', 'halloween', 'loy', 'xmas', 'countdown'];
const Fest2 = {
  today() { const y = (S.day - 1) % 84, w = Math.floor(y / 7), d = (y % 7) + 1; return CAL.find(e => e.w === w && e.d === d) || null; },
  next() { const y = (S.day - 1) % 84; for (let k = 1; k <= 84; k++) { const t = (y + k) % 84, w = Math.floor(t / 7), d = (t % 7) + 1, e = CAL.find(x => x.w === w && x.d === d); if (e) return { e, in: k }; } return null; },
  // ---------- particles: one pooled Points cloud for fireworks / confetti / hearts ----------
  // two particle pools: big glowing sparks for fireworks, small ones for fireflies, butterflies and confetti
  pool(N, size) {
    const geo = new THREE.BufferGeometry(), P = { N, k: 0, n: 0, pos: new Float32Array(N * 3), col: new Float32Array(N * 3), vel: new Float32Array(N * 3), life: new Float32Array(N) };
    geo.setAttribute('position', new THREE.BufferAttribute(P.pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(P.col, 3));
    P.pts = new THREE.Points(geo, new THREE.PointsMaterial({ size, map: this.tex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    P.pts.frustumCulled = false; G.scene.add(P.pts); for (let i = 0; i < N; i++) P.pos[i * 3 + 1] = -999;
    P.spawn = (x, y, z, vx, vy, vz, c, life) => { const i = P.k; P.k = (P.k + 1) % N; P.pos.set([x, y, z], i * 3); P.vel.set([vx, vy, vz], i * 3); P.col.set([c.r, c.g, c.b], i * 3); P.life[i] = life; P.n = Math.min(N, P.n + 1); };
    P.update = (dt, grav) => {
      if (!P.n) return; const Q = P.pos, V = P.vel, L = P.life, C = P.col; let alive = 0;
      for (let i = 0; i < N; i++) { if (L[i] <= 0) continue; alive++; L[i] -= dt; const j = i * 3; V[j + 1] -= grav * dt; V[j] *= 0.985; V[j + 2] *= 0.985; Q[j] += V[j] * dt; Q[j + 1] += V[j + 1] * dt; Q[j + 2] += V[j + 2] * dt; if (L[i] < 0.6) { C[j] *= 0.94; C[j + 1] *= 0.94; C[j + 2] *= 0.94; } if (L[i] <= 0) Q[j + 1] = -999; }
      P.n = alive; P.pts.geometry.attributes.position.needsUpdate = true; P.pts.geometry.attributes.color.needsUpdate = true;
    };
    return P;
  },
  initFX() {
    this.tex = new THREE.CanvasTexture((() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c; })());
    this.big = this.pool(3500, 1.6); this.small = this.pool(900, 0.45); this.pts = this.big.pts; this.rockets = [];
  },
  spawn(...a) { this.big.spawn(...a); },
  spawnS(...a) { this.small.spawn(...a); },
  rocket(x, z, big) { this.rockets.push({ x: x + (Math.random() - 0.5) * 20, y: 2, z: z + (Math.random() - 0.5) * 20, vy: 20 + Math.random() * 6, t: 0, big }); Sfx.tone(300, 0.6, 'sawtooth', 0.015, 1400); },
  burst(r) {
    const pal = [[0xff3b5c, 0xffd23f], [0x3ddc97, 0x40c4ff], [0xff9f1c, 0xfff3b0], [0xc77dff, 0xff70a6], [0x00f5d4, 0xfee440]][Math.floor(Math.random() * 5)].map(U.col);
    const n = r.big ? 260 : 160, sp = r.big ? 15 : 11, ring = Math.random() < 0.3;
    for (let i = 0; i < n; i++) { const u = Math.random() * 2 - 1, a = Math.random() * TAU, s = Math.sqrt(1 - u * u), v = sp * (ring ? 1 : 0.6 + Math.random() * 0.4); this.spawn(r.x, r.y, r.z, Math.cos(a) * s * v, (ring ? 0 : u) * v, Math.sin(a) * s * v, pal[i % 2], 1.6 + Math.random() * 0.9); }
    Sfx.burst(0.5, 120, 'lowpass', r.big ? 0.5 : 0.3); Sfx.burst(0.25, 2400, 'highpass', 0.08, 1, 0.15);
    if (this.flash) this.flash.intensity = r.big ? 6 : 3;
  },
  updateFX(dt) {
    if (!this.big) return;
    for (const r of this.rockets.slice()) { r.t += dt; r.y += r.vy * dt; r.vy -= 9 * dt; this.spawn(r.x, r.y, r.z, (Math.random() - .5), -2, (Math.random() - .5), U.col(0xffe0a0), 0.4); if (r.vy < 4) { this.burst(r); this.rockets.splice(this.rockets.indexOf(r), 1); } }
    this.big.update(dt, 4); this.small.update(dt, 0.6);
    if (this.flash) this.flash.intensity *= Math.max(0, 1 - dt * 6);
  },
  // ---------- plaza decorations per event ----------
  decor(e) {
    if (this.g) { G.scene.remove(this.g); if (typeof Free !== 'undefined') Free.tree(this.g); this.g = null; } if (this.flash) this.flash.intensity = 0; if (!e) return;
    const g = new THREE.Group(), y = World.groundY(PLAZA.x, PLAZA.z); g.position.set(PLAZA.x, y, PLAZA.z); G.scene.add(g); this.g = g; this.beams = [];
    const glow = c => new THREE.MeshBasicMaterial({ color: c, toneMapped: false });
    // string lights around the plaza
    const cols = e.fx === 'cny' ? [0xff1744, 0xffd600] : e.fx === 'xmas' ? [0xff1744, 0x00e676, 0xffffff] : e.fx === 'halloween' ? [0xff9100, 0x9c27b0] : [0xffd54f, 0x4fc3f7, 0xff4081, 0x69f0ae];
    for (let i = 0; i < 64; i++) { const a = i / 64 * TAU, r = 13, h = 4.2 + Math.sin(i * 0.5) * 0.4; U.mk(g, GEO.sph, glow(cols[i % cols.length]), [Math.cos(a) * r, h, Math.sin(a) * r], 0.14); }
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; U.mk(g, GEO.cylLo, mc(0x5d4037), [Math.cos(a) * 13, 2.2, Math.sin(a) * 13], [0.08, 4.4, 0.08]); }
    if (e.fx === 'cny' || e.fx === 'lanterns') for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; U.mk(g, GEO.sph, glow(e.fx === 'cny' ? 0xff1744 : 0xffb74d), [Math.cos(a) * 11, 5, Math.sin(a) * 11], [0.45, 0.55, 0.45]); }
    if (e.fx === 'xmas') { for (let k = 0; k < 5; k++) U.mk(g, GEO.cone, mc(0x1b5e20), [16, 2 + k * 1.6, 0], [3.2 - k * 0.55, 2.4, 3.2 - k * 0.55]); U.mk(g, GEO.sph, glow(0xffeb3b), [16, 10.4, 0], 0.5); for (let i = 0; i < 40; i++) { const t = Math.random(), a = Math.random() * TAU, rr = (1 - t) * 2.8; U.mk(g, GEO.sph, glow(cols[i % 3]), [16 + Math.cos(a) * rr, 1.5 + t * 8, Math.sin(a) * rr], 0.12); } }
    if (e.fx === 'halloween') for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; U.mk(g, GEO.sph, mc(0xff6d00), [Math.cos(a) * 9, 0.4, Math.sin(a) * 9], [0.5, 0.4, 0.5]); U.mk(g, GEO.sph, glow(0xffd180), [Math.cos(a) * 9 * 1.04, 0.45, Math.sin(a) * 9 * 1.04], 0.12); }
    if (e.fx === 'candles') for (let i = 0; i < 60; i++) { const a = i / 60 * TAU; U.mk(g, GEO.cylLo, mc(0xfff8e1), [Math.cos(a) * 8, 0.25, Math.sin(a) * 8], [0.05, 0.5, 0.05]); U.mk(g, GEO.sph, glow(0xffb300), [Math.cos(a) * 8, 0.56, Math.sin(a) * 8], [0.05, 0.09, 0.05]); }
    // concert stage with sweeping light beams for the big nights
    if (e.fx === 'fireworks' || e.fx === 'xmas' || e.fx === 'lanterns') {
      U.mk(g, U.box(10, 1, 6, 2), mc(0x263238), [0, 0.5, -16]); U.mk(g, GEO.box, mc(0x37474f), [0, 5, -19], [11, 0.4, 0.4]); for (const s of [-1, 1]) U.mk(g, GEO.box, mc(0x37474f), [s * 5.3, 2.6, -19], [0.3, 5, 0.3]);
      U.mk(g, GEO.box, glow(0x7c4dff), [0, 3.2, -18.9], [8, 3.4, 0.05]);
      const beamGeo = new THREE.ConeGeometry(2.2, 18, 20, 1, true); beamGeo.translate(0, -9, 0);
      for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: [0x40c4ff, 0xff4081, 0xffd740, 0x69f0ae, 0xe040fb][i], transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })); m.position.set(-4 + i * 2, 5, -18.6); g.add(m); this.beams.push(m); }
    }
    // one light that stays in the scene all year: adding/removing a light makes every material recompile (a long stutter)
    if (!this.flash) { this.flash = new THREE.PointLight(0xfff0d0, 0, 120, 1.5); G.scene.add(this.flash); } this.flash.position.set(PLAZA.x, y + 30, PLAZA.z);
    this.sky = e.fx === 'lanterns' ? [] : null;
  },
  update(dt) {
    this.updateFX(dt);
    const e = this.cur, h = S.time / 60; if (!e || !this.g) return;
    this.g.visible = !G.inside;
    for (const [i, b] of (this.beams || []).entries()) { b.rotation.z = Math.sin(G.t * 0.8 + i * 1.3) * 0.7; b.rotation.x = Math.cos(G.t * 0.6 + i) * 0.35 - 0.3; b.visible = G.night > 0.3; }
    if (G.inside) return;
    const near = Math.hypot(G.player.pos.x - PLAZA.x, G.player.pos.z - PLAZA.z) < 220;
    // fireworks shows: 20:00-22:00 on fireworks nights, every few seconds; the countdown night ends with a huge finale at midnight
    if (near && G.night > 0.5 && (e.fx === 'fireworks' || e.fx === 'lanterns') && h >= 20 && h < 23.95) { this.ft = (this.ft || 0) - dt; if (this.ft <= 0) { this.ft = e.big && h > 23.7 ? 0.25 : 1.2 + Math.random() * 1.6; this.rocket(PLAZA.x, PLAZA.z - 20, e.big && h > 23.7); } }
    if (e.k === 'countdown' && h >= 23.97 && !this.told) { this.told = 1; UI.toast('🎉 สวัสดีปีใหม่! 5…4…3…2…1…', '🎆'); for (let i = 0; i < 14; i++) setTimeout(() => this.rocket(PLAZA.x, PLAZA.z - 20, true), i * 180); }
    // sky lanterns drifting up on Yi Peng night
    if (this.sky && G.night > 0.5 && near) { this.lt = (this.lt || 0) - dt; if (this.lt <= 0 && this.sky.length < 60) { this.lt = 0.3; const m = U.mk(this.g, GEO.cylLo, new THREE.MeshBasicMaterial({ color: 0xffa726, toneMapped: false }), [(Math.random() - 0.5) * 20, 2, (Math.random() - 0.5) * 20], [0.35, 0.6, 0.35]); this.sky.push(m); } for (const m of this.sky.slice()) { m.position.y += dt * 1.6; m.position.x += Math.sin(G.t + m.id) * dt * 0.6; if (m.position.y > 90) { this.g.remove(m); this.sky.splice(this.sky.indexOf(m), 1); } } }
    // daytime confetti / hearts bursts while you're at the plaza
    if ((e.fx === 'confetti' || e.fx === 'hearts' || e.fx === 'water') && Math.hypot(G.player.pos.x - PLAZA.x, G.player.pos.z - PLAZA.z) < 25) { this.ct = (this.ct || 0) - dt; if (this.ct <= 0) { this.ct = 0.08; const c = U.col(e.fx === 'hearts' ? 0xff4081 : e.fx === 'water' ? 0x4fc3f7 : [0xff5252, 0xffd740, 0x69f0ae, 0x40c4ff, 0xe040fb][(Math.random() * 5) | 0]); this.spawnS(PLAZA.x + (Math.random() - 0.5) * 20, 9, PLAZA.z + (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 2, -1, (Math.random() - 0.5) * 2, c, 3); } }
    // festival music near the plaza
    if (near && h >= 9 && h < 24) { this.mt = (this.mt || 0) - dt; if (this.mt <= 0) { this.mt = 0.42; const sc = e.fx === 'cny' ? [523, 587, 659, 784, 880] : [392, 440, 494, 587, 659, 784]; Sfx.tone(sc[(Math.random() * sc.length) | 0], 0.25, 'triangle', 0.012); } }
  },
  // ---------- activities at the plaza ----------
  acts(e) {
    const once = (k, fn) => () => { const st = (S.cal = S.cal || {}); if (st[k + S.day]) { UI.toast('ร่วมกิจกรรมนี้ไปแล้ววันนี้', '🎉'); return; } st[k + S.day] = 1; fn(); };
    const moodUp = (n, t, i) => { S.mood = Math.min(100, (S.mood || 50) + n); UI.toast(t, i); };
    const friends = v => { for (const n of G.npcs) if (!n.staff && S.friends[n.name] != null) Friends.add(n.name, v); };
    const r = Social.st();
    const A = {
      newyear: [['ตักบาตรเช้าวันปีใหม่ (ทำบุญ 200 ฿)', once('ny1', () => { if (S.money < 200) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(200), '💸'); return; } S.money -= 200; S.s2 = S.s2 || {}; S.s2.merit = (S.s2.merit || 0) + 400; moodUp(20, 'อิ่มบุญรับปีใหม่ สุขภาพแข็งแรงทั้งปี', '🙏'); })], ['ส่งการ์ดอวยพรให้ทุกคน', once('ny2', () => { friends(0.3); moodUp(10, 'ส่งความสุขปีใหม่ ชาวบ้านยิ้มรับ', '💌'); })]],
      kids: [['แจกขนมและของเล่นให้เด็ก ๆ (1,000 ฿)', once('kd', () => { if (S.money < 1000) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(1000), '💸'); return; } S.money -= 1000; friends(0.4); for (const k of r.kids || []) k.joy = 100; moodUp(15, 'เด็ก ๆ ทั้งหมู่บ้านดีใจมาก', '🎁'); })]],
      cny: [['ไหว้เจ้าขอพร (ชุดไหว้ 500 ฿)', once('cny1', () => { if (S.money < 500) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(500), '💸'); return; } S.money -= 500; (S.buff = S.buff || {}).luck = S.day + 3; moodUp(12, 'ขอพรให้ค้าขายร่ำรวย โชคดี 3 วัน', '🧧'); })], ['รับอั่งเปาจากผู้ใหญ่', once('cny2', () => { const v = 200 + Math.round(Math.random() * 800); earn(v); UI.toast(`ได้อั่งเปา ${baht(v)}`, '🧧'); })]],
      valentine: [[r.partner ? `มอบกุหลาบให้${r.partner} (300 ฿)` : 'ซื้อกุหลาบ 1 ดอก (300 ฿)', once('val', () => { if (S.money < 300) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(300), '💸'); return; } S.money -= 300; if (r.partner) Friends.add(r.partner, 1.2); moodUp(15, r.partner ? `${r.partner}ซึ้งใจมาก ❤️` : 'มอบกุหลาบให้ตัวเอง รักตัวเองก่อน', '🌹'); })]],
      makha: [['เวียนเทียนรอบโบสถ์', once('mk', () => fade(() => { tick(60); S.s2 = S.s2 || {}; S.s2.merit = (S.s2.merit || 0) + 600; moodUp(18, 'เวียนเทียน 3 รอบ จิตใจสงบ', '🕯️'); }))]],
      visakha: [['เวียนเทียนรอบโบสถ์', once('vs', () => fade(() => { tick(60); S.s2 = S.s2 || {}; S.s2.merit = (S.s2.merit || 0) + 600; moodUp(18, 'เวียนเทียนวันวิสาขบูชา', '🪔'); }))]],
      songkran: [['รดน้ำดำหัวผู้ใหญ่ในหมู่บ้าน', once('sk1', () => { friends(0.5); moodUp(10, 'ผู้ใหญ่ให้พรปีใหม่ไทย', '💐'); })], ['สาดน้ำกับชาวบ้าน', once('sk2', () => { if (!useEnergy(6)) return; moodUp(22, 'เปียกทั้งตัว สนุกสุด ๆ!', '💦'); })]],
      labour: [['ให้พนักงานบริษัทหยุดพักผ่อน (โบนัสคนละ 1,000)', once('lb', () => { for (const c of Company.list()) { const n = c.staff.length * 1000; c.cash -= n; c.rep = Math.min(100, c.rep + 5); } moodUp(5, 'พนักงานขวัญกำลังใจดี ชื่อเสียงบริษัทเพิ่ม', '🛠️'); })]],
      sports: [['ลงแข่งวิ่ง 100 เมตร (พลังงาน 15)', once('sp1', () => { if (!useEnergy(15)) return; const win = Math.random() < 0.3 + (S.fit || 0) * 0.03; if (win) { earn(2000); S.furn.trophy = 1; } moodUp(12, win ? 'ชนะเลิศวิ่ง 100 เมตร ได้ 2,000 ฿ และถ้วย!' : 'เข้าเส้นชัยอันดับ 3 สนุกมาก', '🏃'); })], ['ชักเย่อทีมไร่สุขใจ', once('sp2', () => { friends(0.3); moodUp(10, 'ทีมเราชนะชักเย่อ!', '🪢'); })]],
      mother: [['มอบพวงมาลัยดอกมะลิให้แม่และคนในครอบครัว (150 ฿)', once('mo', () => { if (S.money < 150) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(150), '💸'); return; } S.money -= 150; if (r.partner) Friends.add(r.partner, 0.8); moodUp(15, 'ครอบครัวอบอุ่น', '🌼'); })]],
      redcross: [['สอยดาว (ใบละ 20 ฿ ×5)', once('rc1', () => { if (S.money < 100) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(100), '💸'); return; } S.money -= 100; const w = Math.random(); if (w < 0.08) { earn(3000); UI.toast('สอยได้รางวัลใหญ่ 3,000 ฿!', '⭐'); } else if (w < 0.5) { addItem('teddy'); UI.toast('ได้ตุ๊กตาหมี', '🧸'); } else UI.toast('ได้ขนมกับพวงกุญแจ', '🍬'); })], ['นั่งชิงช้าสวรรค์ชมวิว (80 ฿)', once('rc2', () => { if (S.money < 80) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(80), '💸'); return; } S.money -= 80; moodUp(15, 'วิวงานกาชาดจากด้านบนสวยมาก', '🎡'); })]],
      halloween: [['ประกวดชุดแฟนซี', once('hw', () => { const win = Math.random() < 0.4; if (win) earn(1500); moodUp(12, win ? 'ชุดผีกระสือของคุณชนะเลิศ! +1,500 ฿' : 'ได้รางวัลขวัญใจ', '🎃'); })]],
      loy: [['ลอยกระทงขอขมาพระแม่คงคา (กระทง 50 ฿)', once('loy1', () => { if (S.money < 50) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(50), '💸'); return; } S.money -= 50; (S.buff = S.buff || {}).luck = S.day + 1; moodUp(15, 'ลอยกระทงอธิษฐาน ผลผลิตพรุ่งนี้งาม', '🪷'); })], ['ปล่อยโคมลอย (100 ฿)', once('loy2', () => { if (S.money < 100) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(100), '💸'); return; } S.money -= 100; moodUp(15, 'โคมของคุณลอยไปรวมกับโคมนับพันบนฟ้า', '🏮'); })]],
      father: [['ปลูกต้นไม้ร่วมกับชาวบ้าน', once('fa', () => { if (!useEnergy(10)) return; friends(0.4); moodUp(12, 'ร่วมปลูกต้นไม้ 99 ต้นรอบหมู่บ้าน', '🌳'); })]],
      xmas: [['แลกของขวัญ (ซื้อของขวัญ 500 ฿)', once('xm', () => { if (S.money < 500) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(500), '💸'); return; } S.money -= 500; friends(0.3); const g = U.pick(['teddy', 'cake', 'pettoy']); if (ITEMS[g]) addItem(g); moodUp(15, 'ได้ของขวัญจากซานต้าแห่งไร่สุขใจ', '🎁'); })]],
      countdown: [['ดูคอนเสิร์ตเคาท์ดาวน์ (ข้ามไป 23:50)', once('cd', () => fade(() => { const m = 23 * 60 + 50 - S.time; if (m > 0) tick(m); moodUp(20, 'คอนเสิร์ตมันส์มาก เตรียมนับถอยหลัง!', '🎤'); }))]],
    };
    return A[e.k] || [];
  },
  ui() {
    const e = this.cur; if (!e) return;
    const L = this.acts(e);
    UI.open(`${e.i} ${e.n}`, null, () => `<p class="lead">${e.desc}</p><div class="menu">${L.map(([t], i) => `<button class="btn" data-a="calact" data-i="${i}">${t}</button>`).join('')}</div>`);
  },
  day() {
    this.cur = this.today(); this.told = 0; this.decor(this.cur && SHOW_DAYS.includes(this.cur.k) ? this.cur : null); if (this.sky) this.sky = this.cur && this.cur.fx === 'lanterns' ? [] : null;
    { const e = this.cur; if (e && !G.simulating) setTimeout(() => UI.toast(`วันนี้ ${e.i} ${e.n} ที่ลานน้ำพุหมู่บ้าน`, e.i), 2000); }
    const n = this.next(); if (n && n.in === 1) Phone.msg('ข่าวหมู่บ้าน', `พรุ่งนี้ ${n.e.i} ${n.e.n}: ${n.e.desc}`, false);
  },
  init() {
    if (!this.flash) { this.flash = new THREE.PointLight(0xfff0d0, 0, 120, 1.5); G.scene.add(this.flash); }
    this.initFX(); this.day();
    World.pois.push({ kind: 'act', x: PLAZA.x + 6, z: PLAZA.z + 6, r: 4, label: 'งานเทศกาลลานน้ำพุ', icon: '🎉', act: () => this.cur ? { icon: this.cur.i, label: `ร่วมงาน${this.cur.n}`, fn: () => this.ui() } : null });
    // the seasonal fairs from the older festival module also get fireworks at night
    const _fu = Fest.update.bind(Fest); Fest.update = dt => { _fu(dt); if (Fest.on && Fest.today() && /ลอยกระทง/.test(Fest.today().n) && G.night > 0.6 && !G.inside && !this.cur) { this.ft2 = (this.ft2 || 0) - dt; if (this.ft2 <= 0) { this.ft2 = 3 + Math.random() * 3; this.rocket(PLAZA.x, PLAZA.z - 20); } } };
  },
  calHTML() { const n = this.next(); return `<p class="lead">📅 วันนี้: ${this.cur ? this.cur.i + ' ' + this.cur.n : 'ไม่มีเทศกาล'} · ถัดไป: ${n ? `${n.e.i} ${n.e.n} อีก ${n.in} วัน` : '-'}</p><div class="grid">${CAL.map(e => `<div class="card"><div class="ci">${e.i}</div><div class="cb"><h4>${e.n}</h4><p class="dim">เดือนที่ ${e.w + 1} (สัปดาห์ ${e.w + 1}) ${RD(e.d)} · ${e.desc}</p></div></div>`).join('')}</div>`; },
};
UI.H.calact = d => { const L = Fest2.acts(Fest2.cur); const a = L[+d.i]; if (a) { UI.close(); a[1](); } };
