'use strict';
// ---------- Perf 5 (integrated GPUs such as Intel Iris Xe): fewer draw calls everywhere with the picture unchanged,
// trimmed lights on low/medium, and a nicer "low" look (soft contact shadows, more trees) ----------

// ===== 1. a second, deeper merge: static meshes that sit next to things that can't merge are still combined =====
const Merge2 = {
  snap: null,
  // remember every candidate's world matrix and visibility, then only merge the ones that stayed still
  begin() {
    this.snap = new Map(); this.P = Merge.protectedSet();
    const skip = new Set([World.dyn, World.interior]);
    World.outdoor.updateMatrixWorld(true);
    const walk = (g, d, top) => {
      if (d > 16 || skip.has(g)) return;
      for (const o of g.children) {
        if (skip.has(o)) continue;
        // a group a module holds on to (or hides by distance) becomes its own merge scope, so hiding/removing it still works
        const t = !top || this.P.has(o) ? o : top;
        if (o.isMesh && !o.isSkinnedMesh && !o.isInstancedMesh && !o.children.length && !Array.isArray(o.material) && o.geometry && o.geometry.attributes.position && o.geometry.attributes.normal && !o.geometry.morphAttributes.position && !o.userData.noMerge && !o.userData.keep)
          this.snap.set(o, { m: o.matrixWorld.elements.slice(), top: t });
        if (o.children.length) walk(o, d + 1, t);
      }
    };
    walk(World.outdoor, 0, null);
    // colours that change over time (traffic lights, seasons, signs that blink) must keep their own material
    this.colourSnap = new Map(); this.keySnap = new Map(); for (const o of this.snap.keys()) if (o.material && o.material.color) { this.colourSnap.set(o.material, o.material.color.getHex()); this.keySnap.set(o.material, this.canonKey(o.material)); }
  },
  // two materials that would draw exactly the same pixels can be one material
  canonKey(m) {
    const t = x => x ? (x.image ? (x.image.src || x.image.uuid || (x.image.__k = x.image.__k || Math.random().toString(36).slice(2))) : x.uuid) + x.repeat.x + ',' + x.repeat.y + ',' + x.offset.x + ',' + x.offset.y + ',' + x.wrapS + x.wrapT : '';
    return [m.type, m.color ? m.color.getHex() : '', m.emissive ? m.emissive.getHex() : '', m.emissiveIntensity, m.roughness, m.metalness, m.side, m.transparent, m.opacity, m.alphaTest, m.vertexColors, m.flatShading, m.depthWrite, m.depthTest, m.polygonOffset, m.envMapIntensity, t(m.map), t(m.emissiveMap), t(m.normalMap), t(m.alphaMap)].join('|');
  },
  run() {
    if (!this.snap) return; const shared = Merge.shared(), CELL = 64; let removed = 0, added = 0;
    World.outdoor.updateMatrixWorld(true);
    const canon = new Map(), groups = new Map();
    for (const [o, s] of this.snap) {
      if (!o.parent || !o.visible || o.material === undefined) continue;
      // hidden by distance at the scope's own level is fine (the merged mesh hides with it); hidden below it is not
      let vis = true, inScope = true; for (let p = o.parent; p && p !== World.outdoor; p = p.parent) { if (p === s.top) inScope = false; if (!p.visible && inScope) { vis = false; break; } }
      if (!vis || o.matrixWorld.elements.some((e, i) => Math.abs(e - s.m[i]) > 1e-5)) continue;
      const m = o.material, vc = this.colourOK(m);
      let mat; if (vc) mat = this.vcMat(m); else { const k = this.canonKey(m); if (this.keySnap.get(m) !== k) mat = m; else { if (!canon.has(k)) canon.set(k, m); mat = canon.get(k); } }
      if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
      const c = o.geometry.boundingSphere.center.clone().applyMatrix4(o.matrixWorld), cell = Math.floor(c.x / CELL) + ',' + Math.floor(c.z / CELL);
      const k = s.top.id + '|' + cell + '|' + mat.uuid + (o.castShadow ? 's' : '') + (o.receiveShadow ? 'r' : '') + (o.renderOrder || 0) + (o.geometry.attributes.uv ? 'u' : '') + (vc || o.geometry.attributes.color ? 'c' : '');
      if (!groups.has(k)) groups.set(k, { top: s.top, mat, vc, L: [] }); groups.get(k).L.push(o);
    }
    for (const { top, mat, vc, L } of groups.values()) {
      if (L.length < 2) continue;
      try {
        const inv = new THREE.Matrix4().copy(top.matrixWorld).invert();
        const geos = L.map(o => {
          const g = U.bake(o.geometry, new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
          if (vc) { const n = g.attributes.position.count, c = o.material.color, old = o.material.vertexColors ? g.attributes.color : null, col = new Float32Array(n * 3); for (let i = 0; i < n; i++) { col[i * 3] = c.r * (old ? old.getX(i) : 1); col[i * 3 + 1] = c.g * (old ? old.getY(i) : 1); col[i * 3 + 2] = c.b * (old ? old.getZ(i) : 1); } g.setAttribute('color', new THREE.BufferAttribute(col, 3)); }
          return g;
        });
        const m = new THREE.Mesh(U.mergeGeos(geos), mat); m.castShadow = L[0].castShadow; m.receiveShadow = L[0].receiveShadow; m.renderOrder = L[0].renderOrder; m.matrixAutoUpdate = false; m.userData.merged3 = 1;
        geos.forEach(x => x.dispose());
        for (const o of L) { o.parent.remove(o); if (!shared.has(o.geometry)) o.geometry.dispose(); }
        top.add(m); m.updateMatrixWorld(true); removed += L.length; added++;
      } catch (e) { }
    }
    this.snap = null; this.info = { removed, added, materials: canon.size };
    console.info('merge2', JSON.stringify(this.info));
  },
  // a standard material whose colour never changes can be swapped for a shared vertex-coloured one (the colour is
  // baked into the vertices). Textured ones share by texture; roughness/metalness are rounded to 0.05 (not visible)
  colourOK(m) {
    return m && m.isMeshStandardMaterial && !m.emissiveMap && !m.alphaMap && !m.normalMap && !m.roughnessMap && !m.metalnessMap && !m.aoMap && !m.lightMap && !m.transparent && m.opacity === 1 && !m.polygonOffset && !m.wireframe && !m.alphaTest &&
      m.emissive.r + m.emissive.g + m.emissive.b === 0 && !(World.folMats || []).includes(m) && m !== World.terrainMat && m !== World.roadMat && !(this.colourSnap && this.colourSnap.get(m) !== m.color.getHex());
  },
  vcMats: new Map(),
  vcMat(m) {
    const q = v => (Math.round(v * 20) / 20).toFixed(2), t = m.map;
    const tk = t ? (t.image ? (t.image.src || (t.image.__k = t.image.__k || Math.random().toString(36).slice(2))) : t.uuid) + [t.repeat.x, t.repeat.y, t.offset.x, t.offset.y, t.wrapS, t.wrapT, t.rotation].join(',') : '';
    const k = [q(m.roughness), q(m.metalness), m.side, m.flatShading, m.envMapIntensity, m.depthWrite, m.depthTest, tk].join('|');
    if (!this.vcMats.has(k)) this.vcMats.set(k, new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, map: t || null, roughness: +q(m.roughness), metalness: +q(m.metalness), side: m.side, flatShading: m.flatShading, envMapIntensity: m.envMapIntensity, depthWrite: m.depthWrite, depthTest: m.depthTest }));
    return this.vcMats.get(k);
  },
  // vehicles that drive around: their body parts become one mesh per material (wheels, steering and light bars stay separate)
  car(m) {
    if (!m || !m.g || m.g.userData.merged3) return; m.g.userData.merged3 = 1;
    const keep = new Set(); const mark = o => o && o.traverse && o.traverse(x => keep.add(x));
    (m.wheels || []).forEach(mark); (m.steer || []).forEach(mark); if (m.bar) { mark(m.bar.lr); mark(m.bar.lb); }
    m.g.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(m.g.matrixWorld).invert(), buckets = new Map(), shared = Merge.shared();
    m.g.traverse(o => {
      if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh || keep.has(o) || Array.isArray(o.material) || !o.geometry.attributes.normal || o.children.length) return;
      for (let p = o.parent; p && p !== m.g; p = p.parent) if (keep.has(p)) return;
      const k = o.material.uuid + (o.castShadow ? 's' : '') + (o.geometry.attributes.uv ? 'u' : '') + (o.geometry.attributes.color ? 'c' : '');
      if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(o);
    });
    for (const L of buckets.values()) {
      if (L.length < 2) continue;
      try {
        const geos = L.map(o => U.bake(o.geometry, new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld))), mm = new THREE.Mesh(U.mergeGeos(geos), L[0].material);
        mm.castShadow = L[0].castShadow; geos.forEach(x => x.dispose());
        for (const o of L) { o.parent.remove(o); if (!shared.has(o.geometry)) o.geometry.dispose(); }
        m.g.add(mm);
      } catch (e) { }
    }
  },
};

// ===== 1b. villagers: parts that always move together (head + hair + hat, torso + shirt details) become one mesh each =====
const PeopleMerge = {
  begin() { this.snap = new Map(); for (const n of G.npcs) n.obj.traverse(o => { if (o.isMesh && !o.isSkinnedMesh && !o.children.length && !Array.isArray(o.material)) this.snap.set(o, { m: o.matrix.elements.slice(), v: o.visible, mat: o.material }); }); },
  run() {
    if (!this.snap) return; let removed = 0, added = 0; const groups = new Map(), shared = Merge.shared();
    for (const [o, s] of this.snap) {
      if (!o.parent || o.visible !== s.v || !o.visible || o.material !== s.mat || o.matrix.elements.some((e, i) => Math.abs(e - s.m[i]) > 1e-6)) continue;
      const k = o.parent.id + '|' + o.material.uuid + (o.castShadow ? 's' : '') + (o.geometry.attributes.uv ? 'u' : '') + (o.geometry.attributes.color ? 'c' : '');
      if (!groups.has(k)) groups.set(k, { par: o.parent, L: [] }); groups.get(k).L.push(o);
    }
    for (const { par, L } of groups.values()) {
      if (L.length < 2 || !L[0].geometry.attributes.normal) continue;
      try {
        const geos = L.map(o => { o.updateMatrix(); return U.bake(o.geometry, o.matrix); }), m = new THREE.Mesh(U.mergeGeos(geos), L[0].material);
        m.castShadow = L[0].castShadow; m.receiveShadow = L[0].receiveShadow; geos.forEach(x => x.dispose());
        for (const o of L) { par.remove(o); if (!shared.has(o.geometry)) o.geometry.dispose(); }
        par.add(m); removed += L.length; added++;
      } catch (e) { }
    }
    this.snap = null; this.info = { removed, added };
  },
};

// ===== 2. soft round contact shadows for the low setting (one draw call for every character, animal and car) =====
const Blobs = {
  init() {
    const c = U.canvas(64, 64, g => { const gr = g.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(0.6, 'rgba(0,0,0,0.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
    const tex = new THREE.CanvasTexture(c), geo = new THREE.PlaneGeometry(1, 1); geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    this.mesh = new THREE.InstancedMesh(geo, mat, 96); this.mesh.frustumCulled = false; this.mesh.count = 0; this.mesh.renderOrder = 1; G.scene.add(this.mesh);
    this.m = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.s = new THREE.Vector3(); this.p = new THREE.Vector3(); this.up = new THREE.Vector3(0, 1, 0);
  },
  put(i, x, z, sx, sz, rot) { this.p.set(x, World.groundY(x, z) + 0.03, z); this.q.setFromAxisAngle(this.up, rot || 0); this.s.set(sx, 1, sz); this.m.compose(this.p, this.q, this.s); this.mesh.setMatrixAt(i, this.m); },
  update() {
    if (!this.mesh) return; this.mesh.visible = !G.inside; if (G.inside) return;
    const P = G.player.pos, near = (x, z) => Math.abs(x - P.x) + Math.abs(z - P.z) < 70; let i = 0;
    if (!G.driving) this.put(i++, P.x, P.z, 1.0, 1.0);
    for (const n of G.npcs) { if (i >= 95) break; if (n.obj.visible && near(n.x, n.z)) this.put(i++, n.x, n.z, 0.95, 0.95); }
    for (const A of G.animals) { if (i >= 95) break; if (near(A.d.x, A.d.z)) { const s = { chicken: 0.5, sheep: 1.1, cow: 1.7, pig: 1.1 }[A.d.type] || 1; this.put(i++, A.d.x, A.d.z, s, s * 1.4, A.rot); } }
    for (const t of G.traffic) { if (i >= 95) break; if (t.g.visible && near(t.x, t.z)) this.put(i++, t.x, t.z, 2.3, 4.8, t.vh ?? t.h); }
    for (const c of G.cars) { if (i >= 95) break; if (near(c.d.x, c.d.z)) this.put(i++, c.d.x, c.d.z, 2.3, 4.8, c.d.r); }
    this.mesh.count = i; this.mesh.instanceMatrix.needsUpdate = true;
  },
};

const Perf5 = {
  init() {
    const lvl = G.Q.lvl;
    // lights: every light in the scene costs shading on every pixel, even at zero brightness
    if (lvl !== 'high') {
      if (Fest2.flash && Fest2.flash.parent) Fest2.flash.parent.remove(Fest2.flash);
      if (lvl === 'low' && Look.rim && Look.rim.parent) Look.rim.parent.remove(Look.rim);
      const keep = lvl === 'low' ? 1 : 2; for (const l of G.lamps.slice(keep)) l.parent && l.parent.remove(l); G.lamps.length = Math.min(G.lamps.length, keep);
    }
    if (lvl === 'low') Blobs.init();
    // deeper merge after the first merge (6 s) has run; vehicles are merged as they appear
    setTimeout(() => { Merge2.begin(); PeopleMerge.begin(); }, 6500); setTimeout(() => { Merge2.run(); PeopleMerge.run(); try { G.renderer.compile(G.scene, G.camera); } catch (e) { } }, 9000);
    for (const t of G.traffic) Merge2.car(t);
    const _ps = Patrol.start.bind(Patrol); Patrol.start = k => { const r = _ps(k); for (const p of Patrol.list) Merge2.car(p.t); return r; };
    const _ss = Shoppers.spawn.bind(Shoppers); Shoppers.spawn = () => { const r = _ss(); for (const s of Shoppers.list) Merge2.car(s.car); return r; };
  },
  update() { if (Blobs.mesh) Blobs.update(); },
};
