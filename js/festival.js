'use strict';
// ---------- Seasonal festivals: last day of each season in the village plaza (decorations, stall, produce contest) ----------
const Fest = {
  on: false, krathongs: [], splashT: 0, toastT: 0,
  today() { return S.day % SEASON_LEN === 0 ? FESTIVALS[season().id] : null; },
  daysUntil() { return (SEASON_LEN - S.day % SEASON_LEN) % SEASON_LEN; },
  init(scene) {
    const g = new THREE.Group(); g.visible = false; World.outdoor.add(g); this.group = g;
    const cx = -28, cz = -265;
    // paper lanterns strung along the plaza bunting
    const lantM = U.mat(0xe8452c, { emissive: 0xff7a3a, roughness: 0.6 }); this.lantM = lantM;
    const lp = [];
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU + 0.3;
      for (let k = 1; k <= 4; k++) {
        const t = k / 5, x = cx + Math.cos(a) * 12.5 * t, z = cz + Math.sin(a) * 12.5 * t, y = 4.6 + 0.2 * (1 - t) - Math.sin(t * Math.PI) * 0.6 - 0.45;
        U.mk(g, GEO.sph, k % 2 ? lantM : mc(0xf2b233, { roughness: 0.6 }), [x, y, z], [0.22, 0.28, 0.22]);
        U.mk(g, GEO.cylLo, mc(0x2b2b2b), [x, y + 0.3, z], [0.01, 0.12, 0.01]);
        lp.push(x, y, z);
      }
    }
    this.glow = World.glowPoints(lp, 0xff9a4a, 1.6); this.glow.visible = false;
    // festival stall and contest booth facing the plaza
    const booth = (x, z, label, col, kind, id, icon) => {
      const b = new THREE.Group(); b.position.set(x, 0, z); b.rotation.y = Math.PI; g.add(b);
      U.mk(b, U.box(3, 0.95, 1.1, 1.2), M.wood, [0, 0.47, 0]);
      for (const a of [-1, 1]) for (const c of [-1, 1]) U.mk(b, GEO.cylLo, M.darkwood, [a * 1.4, 1.35, c * 0.5], [0.06, 2.7, 0.06]);
      const can = U.mk(b, GEO.box, U.mat(col, { map: T.stripes, roughness: 0.9 }), [0, 2.75, 0.1], [3.4, 0.08, 1.7]); can.rotation.x = 0.16;
      const sm = new THREE.MeshStandardMaterial({ map: U.signTex(label, { bg: '#7a2a1a' }), roughness: 0.7 });
      U.mk(b, new THREE.PlaneGeometry(2.6, 0.55), sm, [0, 2.25, 0.62]);
      // the booth is only solid on festival days, when it is actually there
      (this.boothCols = this.boothCols || []).push(Col.box(x, z, 1.6, 0.7, Math.PI));
      World.pois.push({ kind, id, x, z: z - 1.7, r: 2.2, label, icon, fest: true });
      return b;
    };
    this.stall = booth(-22, -253, 'ซุ้มของในงาน', 0xe53935, 'fstall', null, '🎪');
    const contest = booth(-35, -253, 'ประกวดผลผลิต', 0x1e88e5, 'contest', null, '🏆');
    U.mk(contest, GEO.cyl, mc(0xd9b44a, { metalness: 0.6, roughness: 0.3 }), [0, 1.15, 0], [0.12, 0.35, 0.12]);
    U.mk(contest, GEO.sph, mc(0xd9b44a, { metalness: 0.6, roughness: 0.3 }), [0, 1.42, 0], [0.18, 0.14, 0.18]);
    // sky lanterns (khom loi) for Loy Krathong night
    const n = 60, pos = new Float32Array(n * 3); this.sky = [];
    for (let i = 0; i < n; i++) this.sky.push({ x: 0, y: -999, z: 0, v: 0.8 + Math.random() * 0.8, ph: Math.random() * TAU });
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.skyPts = new THREE.Points(sg, new THREE.PointsMaterial({ map: T.glow, color: 0xffb04a, size: 2.4, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.skyPts.frustumCulled = false; this.skyPts.visible = false; scene.add(this.skyPts);
  },
  krathong(x, z, y, mine) {
    const k = new THREE.Group();
    U.mk(k, GEO.cyl, mc(0x4f8a3a, { roughness: 0.8 }), [0, 0.04, 0], [0.22, 0.08, 0.22]);
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; U.mk(k, GEO.cone, mc(0xf2a7c8, { roughness: 0.6 }), [Math.cos(a) * 0.14, 0.13, Math.sin(a) * 0.14], [0.06, 0.16, 0.03], [Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4]); }
    U.mk(k, GEO.cylLo, mc(0xfff3d0), [0, 0.2, 0], [0.015, 0.14, 0.015]);
    const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow, color: 0xffb04a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); fl.position.y = 0.3; fl.scale.setScalar(0.7); k.add(fl);
    k.position.set(x, y, z); World.outdoor.add(k);
    this.krathongs.push({ k, vx: (Math.random() - 0.5) * 0.25, vz: (Math.random() - 0.5) * 0.25, y, ph: Math.random() * TAU, mine, cx: x, cz: z });
  },
  floatMine(water) {
    if (!takeItem('krathong')) { UI.toast('ไม่มีกระทง ซื้อได้ที่ซุ้มในงาน', '🪷'); return; }
    const t = Fish.target(water); this.krathong(t.x, t.z, t.y, true);
    S.luck = S.day + 1; playAct('plant', 0.8); Sfx.goal(); Prog.add(15);
    UI.toast(`${S.name ? S.name + 'อธิษฐาน' : 'อธิษฐาน'}ให้ผลผลิตงอกงาม พรุ่งนี้ผักมีโอกาสได้คุณภาพดีขึ้น`, '🪷');
  },
  setOn(v) {
    this.on = v; this.group.visible = v;
    for (const c of this.boothCols || []) { Col.remove(c); if (v) Col.add(c); }
    if (!v) { this.krathongs.forEach(o => World.outdoor.remove(o.k)); this.krathongs = []; for (const l of this.sky) l.y = -999; }
    else if (season().id === 'cool') {
      for (let i = 0; i < 14; i++) this.krathong(440 + Math.random() * 25, -395 + Math.random() * 30, -0.72, false);
      for (let i = 0; i < 5; i++) { const a = Math.random() * TAU, r = 1.5 + Math.random() * 3; this.krathong(30 + Math.cos(a) * r, 20 + Math.sin(a) * r, 0.06, false); }
    }
  },
  update(dt) {
    const f = this.today();
    if (!!f !== this.on) this.setOn(!!f);
    if (!this.on) { this.glow.visible = false; this.skyPts.visible = false; return; }
    const night = G.night || 0;
    this.glow.visible = !G.inside; this.glow.material.opacity = 0.25 + night * 0.7; this.lantM.emissiveIntensity = 0.3 + night * 1.6;
    for (const o of this.krathongs) {
      o.cx += o.vx * dt; o.cz += o.vz * dt;
      o.k.position.set(o.cx, o.y + Math.sin(G.t * 1.3 + o.ph) * 0.03, o.cz); o.k.rotation.y += dt * 0.1;
      o.k.children[o.k.children.length - 1].material.opacity = 0.4 + night * 0.6;
      if (o.y > 0 && Math.hypot(o.cx - 30, o.cz - 20) > 4.8) { o.vx *= -1; o.vz *= -1; }
    }
    // Loy Krathong: sky lanterns drift up after dark
    const lanterns = season().id === 'cool' && night > 0.5 && !G.inside;
    this.skyPts.visible = lanterns;
    if (lanterns) {
      const pos = this.skyPts.geometry.attributes.position, p = G.player.pos;
      this.sky.forEach((l, i) => {
        if (l.y < -100 || l.y > 140 || Math.hypot(l.x - p.x, l.z - p.z) > 220) { l.x = p.x + (Math.random() - 0.5) * 160; l.z = p.z + (Math.random() - 0.5) * 160; l.y = 2 + Math.random() * 30; }
        l.y += l.v * dt; l.x += Math.sin(G.t * 0.2 + l.ph) * dt * 0.8 + dt * 0.6;
        pos.setXYZ(i, l.x, l.y, l.z);
      });
      pos.needsUpdate = true;
    }
    // Songkran: villagers near you splash water now and then
    if (season().id === 'hot' && !G.inside && !G.driving) {
      this.splashT -= dt; this.toastT -= dt;
      if (this.splashT <= 0) {
        this.splashT = 1.5 + Math.random() * 2.5;
        const p = G.player.pos, n = G.npcs.find(n => !n.away && n.obj.visible && Math.hypot(n.x - p.x, n.z - p.z) < 6);
        if (n) {
          const dx = p.x - n.x, dz = p.z - n.z, d = Math.hypot(dx, dz) || 1;
          for (let k = 0; k < 30; k++) FX.spawn(n.x, 1.3, n.z, dx / d * (3 + Math.random() * 2) + (Math.random() - 0.5), 2 + Math.random(), dz / d * (3 + Math.random() * 2) + (Math.random() - 0.5), 0.9, WATER_C, 9);
          n.wave = 1.2; Sfx.water();
          if (this.toastT <= 0) { this.toastT = 20; S.energy = Math.min(maxEnergy(), S.energy + 3); UI.toast(`${n.name}สาดน้ำใส่คุณ! สุขสันต์วันสงกรานต์ เย็นชื่นใจ +3⚡`, '💦'); }
        }
      }
    }
  },
  // villagers flock to the plaza on festival days
  plazaTarget() { const a = Math.random() * TAU, r = 5 + Math.random() * 7; return { x: -28 + Math.cos(a) * r, z: -265 + Math.sin(a) * r }; },
  // ---- produce contest ----
  contestScore(id) { const it = ITEMS[id], q = it.q || 0; return Math.round((it.sell || 0) * (1 + q * 0.45) * (0.92 + Math.random() * 0.16)); },
  enter(id) {
    if (S.contestDay === S.day) return;
    if (!takeItem(id)) return;
    S.contestDay = S.day;
    const mine = this.contestScore(id), base = 110 + S.lvl * 14 + S.day * 1.5;
    const rivals = G.npcs.filter(n => !n.fixed).slice(0, 5).map((n, i) => ({ who: n.name, score: Math.round(base * [1.9, 1.5, 1.25, 1.0, 0.75][i] * (0.85 + Math.random() * 0.3)) }));
    const all = rivals.concat([{ who: (S.name || 'คุณ') + ' (คุณ)', score: mine, me: true }]).sort((a, b) => b.score - a.score);
    const rank = all.findIndex(r => r.me) + 1, prize = [3000, 1500, 700][rank - 1] || 150;
    earn(prize); Bank2.income('เงินรางวัลแข่งขัน', prize); Prog.add(rank <= 3 ? 60 : 20); S.stats.contests = (S.stats.contests || 0) + 1;
    if (rank === 1) { S.furn.trophy = 1; World.buildInterior(S.up.house, S); World.interior.visible = G.inside; }
    UI.contestResult(all, rank, prize, ITEMS[id]);
  },
};
