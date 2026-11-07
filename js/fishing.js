'use strict';
// ---------- Fishing: cast → wait for a bite → tap → reel minigame (hold to move the green zone over the fish) ----------
const ROD_ZONE = [0.26, 0.26, 0.33, 0.4], ROD_RARE = [1, 1, 1.7, 2.6], ROD_WAIT = [1, 1, 0.9, 0.7];
const Fish = {
  st: null, holding: false,
  init(scene) {
    const b = new THREE.Group();
    U.mk(b, GEO.sph, mc(0xffffff, { roughness: 0.4 }), [0, 0.04, 0], 0.07);
    U.mk(b, GEO.sph, mc(0xe53935, { roughness: 0.4 }), [0, 0.09, 0], [0.071, 0.05, 0.071]);
    U.mk(b, GEO.cylLo, mc(0x222222), [0, 0.17, 0], [0.008, 0.12, 0.008]);
    b.visible = false; scene.add(b); this.bob = b;
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * 16), 3));
    this.line = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: 0xf2f2f2, transparent: true, opacity: 0.75 }));
    this.line.frustumCulled = false; this.line.visible = false; scene.add(this.line);
    const rod = new THREE.Group();
    U.mk(rod, GEO.cyl, mc(0x8a5a2a, { roughness: 0.6 }), [0, 0.2, 0], [0.02, 0.5, 0.02]);
    U.mk(rod, gcache('rodTip', () => new THREE.CylinderGeometry(0.004, 0.013, 1.7, 6)), mc(0x2b2b2b, { roughness: 0.4 }), [0, 1.3, 0]);
    U.mk(rod, GEO.cyl, mc(0xb0b6ba, { metalness: 0.5, roughness: 0.3 }), [0.035, 0.32, 0], [0.045, 0.03, 0.045], [0, 0, Math.PI / 2]);
    rod.position.set(0, -0.26, 0.02); rod.rotation.x = Math.PI / 2; rod.visible = false;
    G.player.obj.userData.elR.add(rod); this.rod = rod;
    this.tip = new THREE.Object3D(); this.tip.position.set(0, 2.15, 0); rod.add(this.tip);
    const ov = document.getElementById('fishUI');
    ov.addEventListener('pointerdown', e => { if (e.target.id === 'fishCancel') return; e.preventDefault(); this.holding = true; this.press(); });
    const up = () => { this.holding = false; };
    ov.addEventListener('pointerup', up); ov.addEventListener('pointercancel', up); ov.addEventListener('pointerleave', up);
    document.getElementById('fishCancel').onclick = () => this.end('เก็บเบ็ดแล้ว', '🎣');
  },
  isWater(x, z) {
    if (Math.hypot(x - 30, z - 20) < 5.3) return 'fresh';
    if (x > 427 && !(x < 470 && Math.abs(z + 380) < 2.6)) return 'sea';
    return null;
  },
  target(water) {
    const P = G.player;
    if (water === 'fresh') {
      const dx = P.pos.x - 30, dz = P.pos.z - 20, d = Math.hypot(dx, dz) || 1, r = 2 + Math.random() * 1.6;
      return { x: 30 + dx / d * r + (Math.random() - 0.5), z: 20 + dz / d * r + (Math.random() - 0.5), y: 0.06 };
    }
    const fx = Math.sin(P.rot), fz = Math.cos(P.rot);
    let x = P.pos.x + fx * 7, z = P.pos.z + fz * 7;
    if (!this.isWater(x, z)) {
      if (Math.abs(P.pos.z + 380) < 3) { z = -380 + (fz >= 0 ? 1 : -1) * (5.5 + Math.random() * 2); x = Math.max(430, P.pos.x + (Math.random() - 0.5) * 3); }
      else { x = Math.max(432, P.pos.x + 8); z = P.pos.z + (Math.random() - 0.5) * 4; }
    }
    return { x, z, y: -0.72 };
  },
  start(water) {
    if (this.st) return;
    if (!S.up.rod) { UI.toast('ต้องมีคันเบ็ดก่อน ซื้อได้ที่ร้านเกษตรรุ่งเรือง', '🎣'); Sfx.error(); return; }
    if (!useEnergy(4)) return;
    const t = this.target(water), P = G.player;
    P.rot = Math.atan2(t.x - P.pos.x, t.z - P.pos.z);
    const lv = S.up.rod, rainy = G.wx.rain > 0.3;
    this.st = { ph: 'cast', t: 0, water, tx: t.x, tz: t.z, ty: t.y, wait: (3.5 + Math.random() * 5) * ROD_WAIT[lv] * (rainy ? 0.75 : 1) };
    playAct('cast', 0.6); Sfx.burst(0.25, 3200, 'bandpass', 0.15);
    this.ui('กำลังเหวี่ยงเบ็ด...', false);
    if (!S.tips.fish) { S.tips.fish = 1; UI.toast('รอให้ทุ่นจม แล้วแตะทันทีเมื่อเห็น ❗', '💡'); }
  },
  pick(water) {
    const lv = S.up.rod, night = G.night > 0.5, list = Object.keys(FISH).filter(k => FISH[k].water === water);
    const w = list.map(k => FISH[k].w * (FISH[k].d >= 2.8 ? ROD_RARE[lv] * (night ? 2 : 1) * (water === 'sea' && Dev.done('pier') ? 1.5 : 1) * (S.amulet ? 1.5 : 1) : 1));
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < list.length; i++) { r -= w[i]; if (r < 0) return list[i]; }
    return list[0];
  },
  press() {
    const s = this.st; if (!s) return;
    if (s.ph === 'bite') {
      const F = FISH[s.fish], lv = S.up.rod;
      s.ph = 'reel'; s.t = 0; s.prog = 0.3;
      s.zone = { x: 0.35, w: ROD_ZONE[lv], v: 0 }; s.fx = 0.5; s.ft = 0.5; s.fTimer = 0;
      s.diff = F.d; this.ui('กดค้างให้แถบเขียวเลื่อนขวา ปล่อยให้เลื่อนซ้าย คุมปลาไว้ในแถบ!', true);
      Sfx.tone(660, 0.1, 'square', 0.05);
    } else if (s.ph === 'wait') this.end('ดึงเบ็ดเร็วไป ปลายังไม่กิน', '🎣');
  },
  ui(hint, bar) {
    document.getElementById('fishUI').hidden = false;
    document.getElementById('fishHint').textContent = hint;
    document.getElementById('fishBar').hidden = !bar;
    document.getElementById('fishUI').classList.toggle('bite', this.st && this.st.ph === 'bite');
  },
  end(msg, icon) {
    this.st = null; this.holding = false;
    this.bob.visible = false; this.line.visible = false;
    document.getElementById('fishUI').hidden = true;
    G.player.act = null;
    if (msg) UI.toast(msg, icon || '🎣');
  },
  catch() {
    const s = this.st, F = FISH[s.fish];
    addItem('fish_' + s.fish); S.stats.fish = (S.stats.fish || 0) + 1; Contests.onFish(s.fish); Prog.add(F.rare ? 30 : 8);
    FX.burst(s.tx, s.ty + 0.2, s.tz, 22, new THREE.Color(0.7, 0.85, 1), 3, 7);
    const sp = U.sprite(F.i, 1.1, false); sp.position.set(s.tx, s.ty + 0.3, s.tz); G.scene.add(sp);
    const from = sp.position.clone(), to = G.player.pos.clone().add(new THREE.Vector3(0, 2.3, 0)); let k = 0;
    const fly = () => { k += 0.04; sp.position.lerpVectors(from, to, k).y += Math.sin(k * Math.PI) * 2; if (k < 1) requestAnimationFrame(fly); else G.scene.remove(sp); };
    fly();
    Sfx.goal();
    this.end(`ได้${F.n}${F.rare ? ' (หายาก!)' : ''} ขายได้ ${F.sell} ฿`, F.i);
    playAct('collect', 0.6, false);
  },
  update(dt) {
    const s = this.st;
    this.rod.visible = !!s || (G.sel === 'rod' && !G.driving && !G.inside);
    if (!s) return;
    s.t += dt;
    const P = G.player;
    if (s.ph !== 'cast' && !(P.act && P.act.type === 'collect')) P.act = { type: 'hold', t: 0.5, dur: 1, lock: true };
    const b = this.bob;
    if (s.ph === 'cast' && s.t > 0.55) {
      s.ph = 'wait'; s.t = 0; b.visible = true; b.position.set(s.tx, s.ty, s.tz);
      FX.burst(s.tx, s.ty + 0.05, s.tz, 10, new THREE.Color(0.7, 0.85, 1), 1.5, 6); Sfx.burst(0.3, 900, 'bandpass', 0.2);
      this.ui('รอปลากินเบ็ด... (แตะตอนนี้ = เก็บเบ็ด)', false);
    }
    if (s.ph === 'wait') {
      b.position.y = s.ty + Math.sin(G.t * 2.5) * 0.02;
      if (s.t > s.wait * 0.75 && Math.random() < dt * 3) b.position.y -= 0.04;
      if (s.t > s.wait) {
        s.ph = 'bite'; s.t = 0; s.fish = this.pick(s.water);
        Sfx.tone(880, 0.12, 'square', 0.07); Sfx.tone(1180, 0.15, 'square', 0.07, null, 0.12); Sfx.burst(0.2, 1200, 'bandpass', 0.3);
        if (G.Q.touch && navigator.vibrate) navigator.vibrate([60, 40, 60]);
        this.ui('❗ ปลากินเบ็ดแล้ว! แตะเลย!', false);
      }
    }
    if (s.ph === 'bite') {
      b.position.y = s.ty - 0.12 + Math.sin(G.t * 18) * 0.04;
      if (Math.random() < dt * 20) FX.spawn(s.tx, s.ty + 0.05, s.tz, (Math.random() - 0.5), 1.2, (Math.random() - 0.5), 0.4, WATER_C, 7);
      if (s.t > 1.4) { this.end('ปลาหลุดไปแล้ว แตะช้าไปนิด', '💨'); Sfx.error(); return; }
    }
    if (s.ph === 'reel') {
      const z = s.zone;
      z.v = U.clamp(z.v + (this.holding ? 2.8 : -2.4) * dt, -1.1, 1.1);
      z.x += z.v * dt;
      if (z.x < 0) { z.x = 0; z.v = Math.max(0, z.v) * 0.3; }
      if (z.x > 1 - z.w) { z.x = 1 - z.w; z.v = Math.min(0, z.v) * 0.3; }
      s.fTimer -= dt;
      if (s.fTimer <= 0) { s.fTimer = (0.5 + Math.random() * 1.3) / Math.sqrt(s.diff); s.ft = U.clamp(s.fx + (Math.random() - 0.5) * (0.4 + s.diff * 0.25), 0.03, 0.97); }
      s.fx += (s.ft - s.fx) * Math.min(1, dt * (0.8 + s.diff * 1.1)) + (Math.random() - 0.5) * 0.01 * s.diff;
      s.fx = U.clamp(s.fx, 0.02, 0.98);
      const inside = s.fx >= z.x && s.fx <= z.x + z.w;
      s.prog = U.clamp(s.prog + (inside ? 0.22 : -(0.17 + s.diff * 0.03)) * dt, 0, 1);
      document.getElementById('fZone').style.left = (z.x * 100) + '%'; document.getElementById('fZone').style.width = (z.w * 100) + '%';
      document.getElementById('fZone').classList.toggle('on', inside);
      document.getElementById('fFish').style.left = (s.fx * 100) + '%';
      document.getElementById('fProg').style.width = (s.prog * 100) + '%';
      b.position.y = s.ty - 0.06 + Math.sin(G.t * 12) * 0.03;
      b.position.x = s.tx + Math.sin(G.t * 3) * 0.3 * s.diff * 0.3;
      if (inside && Math.random() < dt * 8) Sfx.tone(1500 + Math.random() * 200, 0.02, 'square', 0.015);
      if (s.prog >= 1) { this.catch(); return; }
      if (s.prog <= 0) { this.end('ปลาดิ้นหลุดไปแล้ว ลองใหม่นะ', '💨'); Sfx.error(); return; }
    }
    // fishing line: a sagging curve from rod tip to bobber
    if (b.visible) {
      const a = new THREE.Vector3(); this.tip.getWorldPosition(a); const e = b.position, pos = this.line.geometry.attributes.position;
      const sag = s.ph === 'reel' ? 0.15 : 0.7;
      for (let i = 0; i < 16; i++) { const t = i / 15; pos.setXYZ(i, U.lerp(a.x, e.x, t), U.lerp(a.y, e.y + 0.17, t) - Math.sin(t * Math.PI) * sag, U.lerp(a.z, e.z, t)); }
      pos.needsUpdate = true; this.line.visible = true;
    }
  },
};
