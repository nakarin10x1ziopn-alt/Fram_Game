// v82_visual.js: lighting continuity
//  - sunrise and sunset: the game switches between moonlight and sunlight the instant the sun crosses the horizon, so the light jumped from ~0 to 0.76 in a few minutes
//    (and back). Real sunlight fades in over the first ~7 degrees of elevation (the sun is dim and reddish near the horizon), so the sun's strength now follows its height
//  - after a big jump of the clock (sleeping, travelling, a taxi ride) the sky reflection used on trees and cars is refreshed at once, instead of showing the old hour for a few seconds
V23.add('v82_visual', () => {
  if (typeof updateSky !== 'function' || !G.sun) return;
  let lastH = null;
  const _us = updateSky, v = new THREE.Vector3();
  updateSky = function () {
    _us.apply(this, arguments);
    try {
      const u = World.sky && World.sky.material.uniforms; if (!u || !S) return;
      const hr = S.time / 60;
      if (lastH != null) { let d = Math.abs(hr - lastH); if (d > 12) d = 24 - d; if (d > 0.4 && typeof Env !== 'undefined' && Env.update) { try { Env.update(0, true); } catch (e) { } } }
      lastH = hr;
      const f = G.focus || G.player.pos; v.copy(G.sun.position).sub(f).normalize();
      if (v.dot(u.sunDir.value) > 0.99 && u.sunDir.value.y < 0.12) G.sun.intensity *= U.smooth(0, 0.12, Math.max(0, u.sunDir.value.y));
    } catch (e) { }
  };
});
