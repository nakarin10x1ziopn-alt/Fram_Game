'use strict';
// ---------- Ambient life: fireflies on clear nights, butterflies on fine days, both drifting around the player ----------
const Life = {
  init(scene) {
    const n = G.Q.lvl === 'low' ? 35 : 70;
    this.ff = []; const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) this.ff.push({ x: 0, y: 0, z: 0, ph: Math.random() * TAU, sp: 0.6 + Math.random() * 0.8, fresh: true });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.ffPts = new THREE.Points(g, new THREE.PointsMaterial({ map: T.glow, size: 0.45, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.ffPts.frustumCulled = false; this.ffPts.visible = false; scene.add(this.ffPts);
    this.bfMat = new THREE.SpriteMaterial({ map: U.emojiTex('🦋', false), transparent: true, depthWrite: false });
    this.bf = [];
    for (let i = 0; i < 9; i++) {
      const s = new THREE.Sprite(this.bfMat); s.visible = false; scene.add(s);
      this.bf.push({ s, ph: Math.random() * TAU, tx: 0, tz: 0, fresh: true });
    }
  },
  spawnNear(o, r, P) { const a = Math.random() * TAU, d = 4 + Math.random() * r; o.x = P.x + Math.cos(a) * d; o.z = P.z + Math.sin(a) * d; o.fresh = false; },
  update(dt) {
    const P = G.player.pos, t = G.t, out = !G.inside && !G.driving;
    const nightOn = out && G.night > 0.6 && G.wx.rain < 0.2;
    this.ffPts.visible = nightOn;
    if (nightOn) {
      const pos = this.ffPts.geometry.attributes.position, col = this.ffPts.geometry.attributes.color;
      this.ff.forEach((f, i) => {
        if (f.fresh || Math.hypot(f.x - P.x, f.z - P.z) > 32) { this.spawnNear(f, 26, P); f.y = World.groundY(f.x, f.z) + 0.4 + Math.random() * 2; }
        f.x += Math.sin(t * 0.4 * f.sp + f.ph) * dt * 0.6; f.z += Math.cos(t * 0.33 * f.sp + f.ph * 2) * dt * 0.6;
        f.y += Math.sin(t * 0.7 + f.ph) * dt * 0.15;
        const b = Math.pow(Math.max(0, Math.sin(t * 1.6 * f.sp + f.ph)), 3);
        pos.setXYZ(i, f.x, f.y, f.z); col.setXYZ(i, 0.7 * b, 1.0 * b, 0.35 * b);
      });
      pos.needsUpdate = true; col.needsUpdate = true;
    }
    const dayOn = out && G.night < 0.2 && G.wx.rain < 0.1 && G.wx.wind < 0.7;
    for (const b of this.bf) {
      b.s.visible = dayOn; if (!dayOn) { b.fresh = true; continue; }
      if (b.fresh || Math.hypot(b.s.position.x - P.x, b.s.position.z - P.z) > 26) {
        this.spawnNear(b, 18, P); b.s.position.set(b.x, World.groundY(b.x, b.z) + 0.8 + Math.random(), b.z); b.tx = b.x; b.tz = b.z;
      }
      const p = b.s.position;
      if (Math.hypot(b.tx - p.x, b.tz - p.z) < 0.5) { b.tx = p.x + (Math.random() - 0.5) * 8; b.tz = p.z + (Math.random() - 0.5) * 8; }
      const dx = b.tx - p.x, dz = b.tz - p.z, d = Math.hypot(dx, dz) || 1;
      p.x += dx / d * dt * 1.3 + Math.sin(t * 3 + b.ph) * dt * 0.6; p.z += dz / d * dt * 1.3;
      p.y = World.groundY(p.x, p.z) + 1.0 + Math.sin(t * 2 + b.ph) * 0.35;
      const flap = 0.25 + 0.75 * Math.abs(Math.sin(t * 13 + b.ph));
      b.s.scale.set(0.34 * flap, 0.32, 1);
    }
  },
};
