// v78_realism.js: three things that did not behave like real life
//  1. temperature: the game had a weather forecast but no temperature. Now there is one (Thai climate: hot season 26-36 C, rainy 25-32 C, cool 19-31 C, coolest at dawn,
//     warmest mid-afternoon, cooler under cloud and rain, much colder on the mountain), shown next to the weather icon. Heat makes you thirstier, cold makes you hungrier
//  2. day length: sunrise and sunset were fixed all year. Thai days are longest in the rainy season (05:50-18:45) and shortest in the cool season (06:30-17:55)
//  (3. car acceleration, braking and coasting are in game.js updateCar)
V23.add('v78_realism', () => {
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, sm = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  // ---------- temperature ----------
  const CLIMATE = { hot: [26, 36], rain: [25, 32], cool: [19, 31] };
  const temp = () => {
    if (!S) return 30;
    const [lo, hi] = CLIMATE[season().id] || CLIMATE.hot, hr = S.time / 60;
    let f; if (hr >= 6 && hr < 14.5) f = sm((hr - 6) / 8.5); else { const h = hr < 6 ? hr + 24 : hr; f = 1 - sm((h - 14.5) / 15.5); }
    const dayJit = (U.hash(S.day * 13 + 5, 77) - 0.5) * 3;                       // one day is a little warmer or cooler than the next
    let t = lo + (hi - lo) * f + dayJit;
    const wx = G.wx || { cloud: 0, rain: 0 }; t -= wx.cloud * 2 + wx.rain * 2.5 + (wx.storm || 0) * 1.5;
    if (G.away) { const A = G.away; if (A.n && /ดอย/.test(A.n)) t -= 9; else if (A.key === 'brook' || A.key === 'riverside') t -= 2; }
    return Math.round(t * 10) / 10;
  };
  window.Temp78 = { now: temp, thirstMult: () => clamp(1 + (temp() - 30) * 0.1, 1, 1.8), hungerMult: () => temp() < 20 ? 1 + (20 - temp()) * 0.04 : 1 };
  { const _hud = UI.hud.bind(UI); UI.hud = function () { _hud(); try { const e = $('wx'); if (e && S) { const t = temp(); e.textContent += ` ${Math.round(t)}°`; e.title += ` · ${t.toFixed(1)}°C`; } } catch (x) { } }; }
  { const _t = Life2.tick.bind(Life2);
    Life2.tick = function (h) {
      const th = S.thirst, hu = S.hunger; _t(h);
      if (G.inside && G.sleeping) return;
      const sl = G.simulating ? 0.45 : 1, tm = Temp78.thirstMult(), hm = Temp78.hungerMult();
      if (tm > 1) S.thirst = Math.max(0, S.thirst - h * 2.4 * sl * (tm - 1));
      if (hm > 1) S.hunger = Math.max(0, S.hunger - h * 1.6 * sl * (hm - 1));
    }; }

  // ---------- day length ----------
  const SUN = { hot: [5.92, 18.58], rain: [5.83, 18.75], cool: [6.5, 17.92] };
  const warp = hr => {
    const [sr, ss] = SUN[season().id] || SUN.hot;
    if (hr >= sr && hr <= ss) return 6 + (hr - sr) / (ss - sr) * 12;
    const h = hr > ss ? hr : hr + 24; return (18 + (h - ss) / (24 + sr - ss) * 12) % 24;
  };
  const _us = updateSky;
  updateSky = function () {
    if (!S) return _us.apply(this, arguments);
    const t0 = S.time; S.time = warp(t0 / 60) * 60;
    try { return _us.apply(this, arguments); } finally { S.time = t0; }
  };
  window.Sun78 = { warp, SUN };
});

// ---------- crops and the weather: temperature now matters (a second small module so the first one stays readable) ----------
//  cool-season crops (cabbage, carrot, strawberry, orange) slow down in real heat, hot-season crops (watermelon, pineapple, corn, sunflower, chilli, mango) slow down in the cold
V23.add('v78_cropheat', () => {
  if (typeof grow !== 'function' || !window.Temp78) return;
  const _g = grow;
  grow = function (p, h, rain) {
    const c = p && p.c, g0 = c ? p.g : 0; _g.apply(this, arguments);
    if (!c || !CROP_SEASON[c]) return;
    const t = Temp78.now(), want = CROP_SEASON[c];
    const f = want === 'cool' ? (t > 34 ? 0.6 : t > 31 ? 0.8 : 1) : want === 'hot' ? (t < 21 ? 0.7 : t < 24 ? 0.88 : 1) : 1;
    if (f < 1 && p.g > g0) p.g = g0 + (p.g - g0) * f;
  };
});
