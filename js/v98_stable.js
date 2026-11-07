// v98_stable.js: steadier frame rate on iPad and notebooks (medium and low quality; High / Ultra are left alone)
//  1. notebooks / PCs: the 5 pooled yard-light lights (zero until a yard light is placed) are left out of the scene, like v93 does on Apple devices: every light costs every pixel
//  2. every texture is uploaded to the GPU in small slices shortly after the game starts, and the shaders are compiled again once the interior exists, so the first walk
//     into a new street or house does not freeze for a moment
//  3. NPCs further than 40 m from the player stop casting a shadow (they are invisible in the shadow map's range anyway), which makes the shadow pass cheaper in a busy town
V23.add('v98_stable', () => {
  if (typeof G === 'undefined') return;
  const med = () => G.Q && G.Q.lvl !== 'high' && G.Q.lvl !== 'ultra';
  // ---- 1) lights on notebooks ----
  if (typeof IOS === 'undefined' || !IOS) {
    const cut = [];
    const cutLights = () => { try { if (!med()) return; G.scene.children.forEach(o => { if (o.isPointLight && o.distance === 20 && o.intensity === 0 && !o.userData.cut98 && !cut.includes(o)) { cut.push(o); o.visible = false; o.userData.cut98 = 1; } }); } catch (e) { console.warn('v98 lights', e); } };
    cutLights(); setTimeout(cutLights, 3000); setTimeout(cutLights, 12000);
    // a yard light was placed: give the pool back (one recompile)
    setInterval(() => { try { if (cut.length && window.Light56 && Light56.st().lights.length) for (const l of cut) if (l.userData.cut98) { l.visible = true; l.userData.cut98 = 0; } } catch (e) { } }, 2000);
  }
  // ---- 2) texture and shader warm-up, a few at a time ----
  const warm = () => {
    try {
      const seen = new Set(), list = [];
      const add = t => { if (t && t.isTexture && !seen.has(t)) { seen.add(t); list.push(t); } };
      const each = m => { if (!m) return; for (const k of ['map', 'emissiveMap', 'normalMap', 'roughnessMap', 'alphaMap', 'bumpMap']) add(m[k]); };
      G.scene.traverse(o => { if (o.material) Array.isArray(o.material) ? o.material.forEach(each) : each(o.material); });
      let i = 0;
      const pump = () => { const t0 = performance.now(); while (i < list.length && performance.now() - t0 < 4) { try { G.renderer.initTexture(list[i]); } catch (e) { } i++; } if (i < list.length) setTimeout(pump, 60); else { try { G.renderer.compile(G.scene, G.camera); if (World.interior) G.renderer.compile(World.interior, G.camera); } catch (e) { } } };
      pump();
    } catch (e) { console.warn('v98 warm', e); }
  };
  let started = setInterval(() => { if (G.started) { clearInterval(started); setTimeout(warm, 4000); setTimeout(warm, 30000); } }, 1000);
  // ---- 3) far NPCs: no shadow ----
  let acc = 0;
  const _npc = typeof updateNPCs === 'function' ? updateNPCs : null;
  if (_npc) {
    updateNPCs = function (dt) {
      const r = _npc.apply(this, arguments);
      acc += dt;
      if (acc > 0.6) {
        acc = 0;
        try {
          if (med() && G.player && G.npcs) {
            const p = G.player.pos;
            for (const n of G.npcs) { const g = n.obj; if (!g) continue; const dx = g.position.x - p.x, dz = g.position.z - p.z, far = dx * dx + dz * dz > 1600; if (g.userData.far98 !== far) { g.userData.far98 = far; g.traverse(m => { if (m.isMesh) m.castShadow = !far; }); } }
          }
        } catch (e) { }
      }
      return r;
    };
  }
  window.Stable98 = { warm };
});
