'use strict';
// ---------- v36 blackout realism: when the house has no backup power and the grid is out (or the breaker trips / the bill is unpaid and the power is cut)
// the lamps inside really go dark: ceiling light, table lamp, window glow, screens, glowing decorations, and at night the room is nearly black
// with only a dim phone-torch glow. With a backup (battery, solar hybrid, generator + ATS) the house keeps its light. A grid outage also darkens the
// street lamps and the neighbours' windows. Power coming back gives a short flicker. ----------
V23.add('v36_blackout', () => {
  const safe = (f, d) => { try { const v = f(); return v == null ? d : v; } catch (e) { return d; } };
  const B = { ownDark: false, village: false, flick: 0, last: '', n: 0 };
  const state = () => {
    const w = safe(() => Power.st(), {}), g = safe(() => Grid.st(), {});
    const village = (w.out || 0) > 0;                                                         // the whole area is out
    const ownDark = g.src === 'none' || !!w.trip || !!S.powerOff;                             // this house has no power (no backup, breaker, or cut for unpaid bill)
    return { village, ownDark };
  };
  // ----- glowing things inside the house (screens, lanterns, decor) -----
  const shared = () => new Set([M.glass, M.bulb]);
  function interiorMats() {
    const out = new Set(), root = World.interior; if (!root) return out; const sh = shared();
    root.traverse(o => { const m = o.material; if (!m) return; for (const x of Array.isArray(m) ? m : [m]) if (x && x.emissive && !sh.has(x) && (x.userData.v36e != null || (x.emissive.getHex() > 0 && x.emissiveIntensity > 0.05))) out.add(x); });
    return out;
  }
  function applyInterior(dark) {
    let n = 0;
    for (const m of interiorMats()) {
      if (dark) { if (m.userData.v36e == null) m.userData.v36e = m.emissiveIntensity; m.emissiveIntensity = 0; n++; }
      else if (m.userData.v36e != null) { m.emissiveIntensity = m.userData.v36e; delete m.userData.v36e; n++; }
    }
    return n;
  }
  const _bi = World.buildInterior && World.buildInterior.bind(World);
  if (_bi) World.buildInterior = function () { const r = _bi.apply(this, arguments); try { B.last = ''; } catch (e) { } return r; };
  // ----- frame hook: runs right after the sky/lamps have set their values -----
  const _sky = updateSky;
  updateSky = function () {
    _sky.apply(this, arguments);
    const s = state(), key = (s.ownDark ? 1 : 0) + '' + (s.village ? 1 : 0) + (G.inside ? 1 : 0) + (World.interior ? World.interior.uuid : '');
    if (key !== B.last) {
      const wasDark = B.ownDark; B.last = key; B.ownDark = s.ownDark; B.village = s.village;
      if (G.inside || wasDark !== s.ownDark) B.n = applyInterior(s.ownDark);
      if (wasDark && !s.ownDark) B.flick = 1.2;                                                // power is back: lights flicker on
    }
    const night = G.night || 0, flick = B.flick > 0 ? (Math.sin(G.t * 38) > -0.2 ? 1 : 0.15) : 1; if (B.flick > 0) B.flick = Math.max(0, B.flick - 0.016);
    if (s.village) {                                                                          // grid outage: street and neighbours dark; own lights only if there is a backup
      M.glass.emissiveIntensity *= 0.1;
      if (!(G.inside && !s.ownDark)) M.bulb.emissiveIntensity = 0.04 + 0.1 * (1 - night);
    }
    if (B.env && !(G.inside && s.ownDark && night > 0.4)) { G.scene.environment = B.env; B.env = null; }
    if (G.inside && World.inLamp) {
      if (s.ownDark) {
        World.inLamp.intensity = 0; World.inGlow.material.opacity = 0;
        World.inLight.color.setHex(0xcfe0ff); World.inLight.intensity = night > 0.3 ? 0.16 + 0.1 * (1 - night) : 0.5;   // phone torch / daylight only
        if (night > 0.2) { G.hemi.intensity = Math.max(0.03, G.hemi.intensity - 0.25 * night - 0.1 * night); G.sun.intensity *= 1 - 0.7 * night; }
        M.bulb.emissiveIntensity = 0.02;
        // the sky reflection map must not light the room at night either
        if (night > 0.4 && G.scene.environment) { B.env = G.scene.environment; G.scene.environment = null; }
      } else {
        if (World.inLight.color.getHex() !== 0xffe6c0) World.inLight.color.setHex(0xffe6c0);
        if (B.flick > 0) { World.inLamp.intensity *= flick; World.inLight.intensity *= flick; }
      }
    }
  };
  const _lamps = updateLamps;
  updateLamps = function (dt) { _lamps.apply(this, arguments); if (B.village && G.lamps) for (const l of G.lamps) l.intensity = 0; };
  // a blackout also makes the electric-only extras sensible: the player's lantern is the only light outside
  window.Blackout36 = { state, apply: applyInterior, info: () => Object.assign({}, B, state()) };
});
