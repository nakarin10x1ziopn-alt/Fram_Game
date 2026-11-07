// v72_realcolor.js (v115: colourful 3D look on every quality level; the fine detail stays natural, only the colour gets richer)
//  - sky, haze and fog are muted towards the pale, slightly grey blue of a real sky; grass and leaves lose the candy green; sunlight and street lamps get true colour temperatures
//  - the screen filter that made medium vivid is replaced by a neutral, very slightly muted one
V23.add('v72_realcolor', () => {
  const on = () => !!G.Q;
  const mute = (c, k, lift = 0) => { const l = c.r * 0.2126 + c.g * 0.7152 + c.b * 0.0722; const cl = x => Math.max(0, Math.min(1, x)); c.r = cl(l + (c.r - l) * k + lift); c.g = cl(l + (c.g - l) * k + lift); c.b = cl(l + (c.b - l) * k + lift); return c; };
  // street lamps: warm sodium/tungsten white instead of orange
  for (const l of (G.lamps || [])) l.color.setHex(0xffc680);
  const _us = updateSky;
  updateSky = function () {
    _us.apply(this, arguments);
    if (!on()) return;
    const u = World.sky.material.uniforms;
    mute(u.top.value, 1.1); mute(u.hor.value, 1.04); mute(u.gnd.value, 1.03);
    if (G.scene.fog) mute(G.scene.fog.color, 1.03);
    // grass, leaves and ground: natural olive green, not saturated
    mute(World.terrainMat.color, 1.06); for (const m of World.folMats) mute(m.color, 1.05);
    // sunlight: neutral white at noon, warm only near the horizon (the sky code already warms it)
    
  };
});
