// v74_realmodels.js: model materials that look like real things instead of toys
//  - painted and plastic-looking surfaces are a little less saturated (real paint, plaster, roofing and timber are never candy-bright)
//  - non-metal surfaces are never mirror-shiny: roughness has a realistic floor (matte plaster, wood, soil, fabric), and env reflections on them are subtle
//  - glass, water, lights, effects and photo-textured assets are left alone; far towns are processed when they are built
V23.add('v74_realmodels', () => {
  const mute = (c, k) => { const l = c.r * 0.2126 + c.g * 0.7152 + c.b * 0.0722; c.r = l + (c.r - l) * k; c.g = l + (c.g - l) * k; c.b = l + (c.b - l) * k; };
  const fix = m => {
    if (!m || !m.userData || m.userData.rm) return; m.userData.rm = 1;
    if (!m.isMeshStandardMaterial && !m.isMeshLambertMaterial && !m.isMeshPhongMaterial) return;
    if (m.transparent && m.opacity < 0.95) return;                                  // glass, water surfaces, shadows, fx
    if (m.emissive && m.emissive.getHex() > 0 && (m.emissiveIntensity || 0) > 0.3) return;   // lit windows, lamps
    if (m.isMeshStandardMaterial && m.roughness < 0.12 && m.metalness < 0.5) return;       // water / glass-like
    if (m.color && !m.vertexColors) { const c = m.color; if (!(c.r > 0.92 && c.g > 0.92 && c.b > 0.92)) mute(c, 1.03); }
    if (m.isMeshStandardMaterial) {
      if (m.metalness < 0.25) { m.roughness = Math.max(m.roughness, 0.55); m.metalness = Math.min(m.metalness, 0.05); }
      else if (m.metalness < 0.7) m.roughness = Math.max(m.roughness, 0.35);
      if (m.envMapIntensity == null || m.envMapIntensity > 0.7) m.envMapIntensity = m.metalness > 0.5 ? 1 : 0.6;
      m.needsUpdate = true;
    }
  };
  const run = root => { let n = 0; root.traverse(o => { if (!o.material) return; if (Array.isArray(o.material)) o.material.forEach(fix); else fix(o.material); n++; }); return n; };
  setTimeout(() => { try { run(G.scene); } catch (e) { console.warn('v74', e); } }, 1500);
  { const _go = Town2.go.bind(Town2); Town2.go = function (k, fee) { const r = _go(k, fee); setTimeout(() => { try { run(G.scene); } catch (e) { } }, 2500); return r; }; }
  window.Real74 = { run, fix };
});
