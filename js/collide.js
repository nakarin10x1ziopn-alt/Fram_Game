'use strict';
// ---------- Solid-world pass: give every standing prop a collider so nothing can be walked through ----------
const Collide = {
  added: 0,
  covered(x, z) { const p = { x, z }; Col.push(p, 0.05); return Math.hypot(p.x - x, p.z - z) > 0.01; },
  scan(root, groundAt) {
    const box = new THREE.Box3(), v = new THREE.Vector3();
    root.updateMatrixWorld(true);
    root.traverse(o => {
      if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh) return;
      for (let p = o; p; p = p.parent) if (p.userData && p.userData.noCol) return;
      const m = o.material; if (m && (m.transparent && m.opacity < 0.5 || m.blending === THREE.AdditiveBlending)) return;
      box.setFromObject(o); const w = box.max.x - box.min.x, d = box.max.z - box.min.z, h = box.max.y - box.min.y;
      if (h < 0.45 || w > 8 || d > 8 || (w < 0.08 && d < 0.08)) return;
      const cx = (box.min.x + box.max.x) / 2, cz = (box.min.z + box.max.z) / 2, gy = groundAt(cx, cz);
      if (box.min.y > gy + 0.6) return;
      if (this.covered(cx, cz)) return;
      if (w < 0.7 && d < 0.7) Col.circle(cx, cz, Math.max(0.12, Math.max(w, d) / 2));
      else Col.box(cx, cz, Math.max(0.08, w / 2), Math.max(0.08, d / 2), 0);
      this.added++;
    });
  },
  run() {
    // moving things (traffic, NPCs, animals, crops) live in World.dyn and must not become walls
    if (World.dyn) World.dyn.userData.noCol = true;
    this.scan(World.outdoor, (x, z) => World.groundY(x, z));
    if (Town2.areas) for (const k in Town2.areas) if (Town2.areas[k].g) this.scan(Town2.areas[k].g, () => 0);
  },
  // interaction points that ended up inside something solid
  blocked() { return World.pois.filter(p => this.covered(p.x, p.z)).map(p => p.label); },
};
