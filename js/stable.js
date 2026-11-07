'use strict';
// ---------- Stability, smoothness and sharpness: a frame never dies on one module's error, the GPU can be lost and
// recovered, the auto-governor gives up effects before resolution, and text stays crisp ----------
const Stable = {
  errs: new Map(),
  init() {
    // 1. one failing subsystem must not freeze the picture: catch it, report each distinct error once, keep drawing
    const _loop = loop;
    loop = function () {
      try { _loop(); } catch (e) {
        const k = String(e && e.message || e); const n = (Stable.errs.get(k) || 0) + 1; Stable.errs.set(k, n);
        if (n === 1) console.warn('frame error (game keeps running):', e);
        try { Gfx.render(); } catch (e2) { }
      }
    };
    // 2. phones drop the GPU context when memory runs short: save, explain, and reload once it comes back
    const cv = document.getElementById('c');
    cv.addEventListener('webglcontextlost', e => { e.preventDefault(); try { saveGame(true); } catch (x) { } UI.toast('หน่วยความจำกราฟิกเต็ม กำลังกู้คืน...', '🛟'); }, false);
    cv.addEventListener('webglcontextrestored', () => { setTimeout(() => location.reload(), 300); }, false);
    // 3. the auto-governor: effects, shadows and view distance go first; resolution only drops to a sharp floor
    const floor = this.floor();
    if (G.pr < floor && G.Q.pr >= floor) Perf.setPr(Math.min(G.Q.pr, floor));
    Perf.down = function () {
      if (Gfx.drop()) return;
      if (G.shadow) { this.setShadow(false); this.note(); return; }
      if (G.view > 0.7) { G.view = Math.max(0.7, +(G.view - 0.1).toFixed(2)); return; }
      if (G.pr > floor + 0.01) { this.setPr(Math.max(floor, +(G.pr - 0.1).toFixed(2))); safeSet('raisukjai3d_pr', String(G.pr)); this.note(); return; }
      if (G.view > 0.5) G.view = Math.max(0.5, +(G.view - 0.1).toFixed(2));
    };
    Perf.up = function () {
      const maxView = G.Q.lvl === 'low' ? 0.6 : G.Q.lvl === 'med' ? 0.8 : G.Q.lvl === 'ultra' ? 1.35 : 1;
      if (G.pr < G.Q.pr) { this.setPr(Math.min(G.Q.pr, +(G.pr + 0.05).toFixed(2))); safeSet('raisukjai3d_pr', String(G.pr)); }
      else if (G.view < maxView) G.view = Math.min(maxView, +(G.view + 0.1).toFixed(2));
      else if (!G.shadow && G.Q.shadow > 0) this.setShadow(true);
    };
    Perf.note = function () { if (!this.told) { this.told = true; UI.toast('ปรับกราฟิกอัตโนมัติให้เล่นลื่นขึ้น', '⚙️'); } };
    // 4. never save a broken position: NaN from any source falls back to the last good spot
    const _save = saveGame;
    saveGame = function (silent) {
      const p = G.player && G.player.pos;
      if (p && (!Number.isFinite(p.x) || !Number.isFinite(p.z))) { const g = Stable.good || { x: HOUSE_POS.x + 2, z: HOUSE_POS.z + 6 }; p.set(g.x, World.groundY(g.x, g.z), g.z); }
      if (G.driving && (!Number.isFinite(G.driving.d.x) || !Number.isFinite(G.driving.d.z) || !Number.isFinite(G.driving.speed))) { const g = Stable.good || { x: 2.2, z: -238 }; Object.assign(G.driving.d, { x: g.x, z: g.z }); G.driving.speed = 0; }
      if (!Number.isFinite(S.money)) S.money = 0;
      return _save(silent);
    };
    this.css();
    this.solid = this.solidInstances(World.outdoor);
    if (Town3.ensure) { const _e = Town3.ensure; Town3.ensure = k => { const A = _e(k); if (A && A.g) Stable.solidInstances(A.g); return A; }; }
  },
  // 6. instanced things (tree trunks, bushes, fences, rocks) were never solid: give each standing one a collider
  solidInstances(root) {
    if (!root) return 0;
    const m = new THREE.Matrix4(), pos = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), e = new THREE.Euler(); let n = 0;
    root.updateMatrixWorld(true);
    root.traverse(o => {
      if (!o.isInstancedMesh || o.userData.solid) return;
      for (let p = o; p; p = p.parent) if (p.userData && p.userData.noCol) return;
      const mat = o.material; if (mat && (mat.transparent && mat.opacity < 0.5 || mat.blending === THREE.AdditiveBlending)) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox; o.userData.solid = 1;
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, m); m.premultiply(o.matrixWorld); m.decompose(pos, q, sc);
        const h = (bb.max.y - bb.min.y) * sc.y, base = pos.y + bb.min.y * sc.y, w = (bb.max.x - bb.min.x) * sc.x, d = (bb.max.z - bb.min.z) * sc.z;
        if (h < 0.8 || w > 9 || d > 9 || w < 0.05) continue;
        const cx = pos.x + (bb.max.x + bb.min.x) / 2 * sc.x, cz = pos.z + (bb.max.z + bb.min.z) / 2 * sc.z;
        if (base > World.groundY(cx, cz) + 0.6) continue;          // canopies and hanging things
        if (roadDist(cx, cz) < 4.6 || Collide.covered(cx, cz)) continue;
        if (World.pois.some(p => Math.abs(p.x - cx) < 1.4 && Math.abs(p.z - cz) < 1.4)) continue;
        const big = Math.max(w, d), small = Math.min(w, d);
        if (big / Math.max(small, 0.01) < 1.6) Col.circle(cx, cz, U.clamp(small * 0.42, 0.14, 1.3));
        else { e.setFromQuaternion(q, 'YXZ'); Col.box(cx, cz, w / 2, d / 2, e.y); }
        n++;
      }
    });
    return n;
  },
  // never below one canvas pixel per CSS pixel: text drawn into the 3D view stays sharp
  floor() { return Math.min(1, devicePixelRatio); },
  update() {
    // remember the last good position every second
    if ((this.t = (this.t || 0) + 1) % 60) return;
    const p = G.driving ? G.driving.d : G.player && G.player.pos;
    if (p && Number.isFinite(p.x) && Number.isFinite(p.z) && !G.inside && !G.away) this.good = { x: p.x, z: p.z };
  },
  // 5. crisp, readable text everywhere: smoother font rendering, a readable minimum size and a soft outline over the 3D view
  css() {
    const s = document.createElement('style');
    s.textContent = `html{-webkit-text-size-adjust:100%;text-size-adjust:100%}
body{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;font-kerning:normal}
.hud,.panel,#toasts,#prompt{font-feature-settings:"kern" 1}
.hud *,#prompt,#toasts .toast{text-shadow:0 1px 2px rgba(0,0,0,.45)}
.panel .dim,.card .dim,.lead,.need{line-height:1.5}
@media (max-width:640px){.card h4{font-size:14.5px}.card p,.dim,.lead{font-size:13px}button,.btn{font-size:14px}}
canvas#c{image-rendering:auto}`;
    document.head.appendChild(s);
  },
};
