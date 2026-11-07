// v93_ipadperf.js: smoother play on iPad / iPhone (Apple touch devices only; notebooks and PCs are untouched)
//  What made an iPad (A16, medium) run at 20-30 fps:
//   1. a CSS filter on the whole 3D canvas (colour tweak on medium) and about 18 blurred glass panels (backdrop-filter) laid over the live 3D picture: Safari re-blurs and re-filters
//      them on every frame. Both are switched off on Apple devices (panels keep their dark glass colour, just without the blur)
//   2. up to 13 lights in the scene: three.js runs every light on every pixel even when its intensity is 0. The 5 pooled yard-light lights (unused until you place a light) and 2 of the
//      4 street-lamp lights are now left out of the scene until needed
//   3. a resolution scaler follows the real frame rate: medium starts at 1.5x, steps down by 0.1 when below 40 fps (never below 1.0x so text stays readable) and back up
//      by 0.1 every 6 s of steady 57+ fps, as far as the screen's native sharpness (2x on an iPad)
//   4. rain used up to 100 % of its streaks even on a tablet: 55 % on Apple devices
//   5. (ios.js) the quality governor ignored a steady 26-34 fps because that can be Low Power Mode; it now ignores it only once the picture is already down to 1.0x
V23.add('v93_ipadperf', () => {
  if (typeof IOS === 'undefined' || !IOS) return;
  const css = document.createElement('style');
  css.textContent = `
body.ios *, body.ios *::before, body.ios *::after { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
body.ios #c { filter: none !important; }
body.ios #modal { background: rgba(5, 12, 9, .74) !important; }
body.ios .panel { background-color: rgba(16, 34, 24, .93); }
/* crisp text: grey-scale smoothing, no half-pixel blur from centring with a transform */
body.ios, body.ios * { -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
/* gradient-clipped headings (background-clip:text) are drawn soft on Safari: solid colour instead */
body.ios .mhead h2, body.ios .logo { background: none !important; -webkit-background-clip: border-box !important; background-clip: border-box !important; -webkit-text-fill-color: #fff1c0 !important; color: #fff1c0 !important; }
body.ios * { -webkit-text-size-adjust: 100%; font-synthesis: none; }
body.ios .btn:hover { transform: none !important; filter: none !important; }
body.ios #hudB, body.ios #prompt { left: 0; right: 0; transform: none; margin-left: auto; margin-right: auto; width: fit-content; }`;
  document.head.appendChild(css);

  // ---- 2) fewer lights ----
  const cut = [];
  const cutLights = () => {
    try {
      G.scene.children.forEach(o => { if (o.isPointLight && o.distance === 20 && o.intensity === 0 && !o.userData.cut93 && !cut.includes(o)) { cut.push(o); o.visible = false; o.userData.cut93 = 1; } });   // the v56 yard-light pool
      if (G.lamps && G.lamps.length > 2) for (const l of G.lamps.slice(2)) if (!l.userData.cut93) { cut.push(l); l.visible = false; l.userData.cut93 = 1; }
    } catch (e) { console.warn('v93 lights', e); }
  };
  cutLights(); setTimeout(cutLights, 3000); setTimeout(cutLights, 12000);
  const poolBack = () => { try { if (window.Light56 && Light56.st().lights.length && cut.length) { for (const l of cut) if (l.userData.cut93 && !(G.lamps || []).includes(l)) { l.visible = true; l.userData.cut93 = 0; } } } catch (e) { } };
  setInterval(poolBack, 2000);

  // ---- 3) resolution ----
  const capPr = () => { try { if (G.Q && G.Q.lvl !== 'high' && G.Q.lvl !== 'ultra') { const cap = G.Q.lvl === 'low' ? 1.0 : 1.25; if (G.Q.pr > cap) G.Q.pr = cap; if (G.pr > cap) Perf.setPr(cap); } } catch (e) { } };
  capPr();
  // v149: reacts after 1 s (not 1.25 s) at 46 fps, steps down 0.15 when well under, and never climbs back above the level that made it drop (ceil)
  let last = performance.now(), acc = [], okT = 0, t0 = performance.now(), floor = 1.0, ceil = 99, lastUp = 0;
  const step = now => {
    requestAnimationFrame(step);
    const dt = now - last; last = now; if (dt > 250 || document.hidden || !G.started) { acc.length = 0; return; }
    acc.push(dt); if (acc.length < 60) return;
    const avg = acc.reduce((a, b) => a + b, 0) / acc.length; acc.length = 0;
    const fps = 1000 / avg, cap = G.Q.lvl === 'low' ? 1.0 : Math.min(ceil, 1.5);
    if (now - t0 < 4000) return;
    if (fps < 46 && G.pr > floor + 0.01) { okT = 0; if (now - lastUp < 20000 && G.pr > floor + 0.11) ceil = Math.max(floor, +(G.pr - 0.1).toFixed(2)); Perf.setPr(Math.max(floor, +(G.pr - (fps < 36 ? 0.15 : 0.1)).toFixed(2))); }
    else if (fps > 57) { okT += avg * 60; if (okT > 8000 && G.pr < cap - 0.01) { okT = 0; lastUp = now; Perf.setPr(Math.min(cap, +(G.pr + 0.05).toFixed(2))); } }
    else okT = 0;
  };
  requestAnimationFrame(step);

  // ---- colour: a touch more contrast and life from the tone-mapper (no extra work for the GPU) ----
  window.EXP141 = 1.08; setInterval(() => { try { if (G.Q.lvl !== 'high' && G.Q.lvl !== 'ultra' && !G.inMine) { const r = G.renderer; r.toneMappingExposure += (1.08 - r.toneMappingExposure) * 0.25; } } catch (e) { } }, 400);
  // ---- 4) rain ----
  try { if (G.rain && !G.rain.n93) { G.rain.n93 = 1; G.rain.n = Math.floor(G.rain.n * 0.55); } } catch (e) { }
  window.IpadPerf93 = { cut: () => cut.length, pr: () => G.pr, lights: () => { let n = 0; G.scene.traverseVisible(o => { if (o.isLight) n++; }); return n; } };
});
