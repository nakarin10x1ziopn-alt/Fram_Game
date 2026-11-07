// v90_thaiweather.js: weather the way it really behaves in Thailand
//  The game had six weather types that switched on and off for the whole day. Now each weather day has a shape in time, like the real tropics:
//   - rainy season: dry bright mornings, towering cloud building after noon, a violent afternoon thunderstorm for one to three hours, then a slow taper to light rain and mist; monsoon days of
//     steady drizzle / light / moderate rain with heavy bursts
//   - hot season: very hot dry days (heat waves up to about 39 C), short sharp summer storms late in the afternoon
//   - cool season: cold mornings with mist and dew, cold snaps (about -4 C) with wind, dry sunny days, haze / PM2.5 in the dry months
//   - lightning bolts you can see (jagged, branching, flickering), with thunder that arrives after the flash by the real speed of sound (distance / 343 m/s), cracking when close and rolling when far
//   - five rain intensities (drizzle, light, moderate, heavy, very heavy) with their own rain look, sound level and ground splashes, gusty wind that rises before a storm
//   - heat index (feels-like), humidity, UV, PM2.5, wind and an hour-by-hour forecast in the phone weather app; early warnings in the style of the Thai Meteorological Department
//  The save is not touched: the shape of a day is worked out from the day number, the season and the weather type, so a save made in any version behaves the same.
V23.add('v90_thaiweather', () => {
  if (typeof updateWeather !== 'function' || typeof WEATHER === 'undefined') return;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, sm = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const bump = (h, c, w) => sm(1 - Math.abs(h - c) / w);
  const lerp = (a, b, t) => a + (b - a) * t;
  const wDay = () => (S.time < 360 ? S.day - 1 : S.day);
  const hz = (k, wd) => U.hash((wd == null ? wDay() : wd) * 31 + k, 4711);
  const rsn = () => season().id;

  // ---------- 1) the shape of one weather day ----------
  // hh = hours on the weather-day clock (06:00 -> 30:00); returns the visual targets for that hour
  function shape(type, hh, wd) {
    const rs = rsn(), W = WEATHER[type] || WEATHER.sunny, o = { rain: 0, cloud: W.cloud, storm: 0, hs: null, d: 0 };
    if (type === 'storm') {
      const hs = rs === 'rain' ? 13 + hz(1, wd) * 3.5 : rs === 'hot' ? 14.5 + hz(1, wd) * 4 : 10 + hz(1, wd) * 8, d = 1.5 + hz(2, wd) * 1.7;
      o.hs = hs; o.d = d;
      const p = sm((hh - (hs - 1.6)) / 1.6);
      if (hh < hs) { o.rain = 0; o.cloud = 0.3 + 0.7 * p; o.storm = hh > hs - 0.7 ? 0.35 : 0; }
      else if (hh < hs + d) { o.rain = 0.72 + 0.28 * bump(hh, hs + d * 0.45, d * 0.6); o.cloud = 1; o.storm = 1; }
      else { const a = sm(1 - (hh - (hs + d)) / 2.6); o.rain = 0.45 * a; o.cloud = lerp(0.65, 1, a); o.storm = hh < hs + d + 1.3 ? 0.45 * (1 - (hh - hs - d) / 1.3) : 0; }
    } else if (type === 'rain') {
      const c = 10 + hz(3, wd) * 10, burst = bump(hh, c, 1.6) * (0.4 + 0.6 * hz(4, wd)), base = 0.22 + 0.16 * Math.sin(hh * 0.9 + (wd || 0));
      o.rain = clamp(base + burst * 0.7, 0.1, 1); o.storm = o.rain > 0.85 && rs === 'rain' && hz(5, wd) > 0.5 ? 0.45 : 0; o.cloud = 1;
    } else if (type === 'cloudy') {
      if (hz(6, wd) < 0.3) o.rain = 0.14 * bump(hh, 15 + hz(7, wd) * 3, 2.5);          // a little drizzle on a grey afternoon
    } else if (type === 'partly') {
      if (rs === 'rain' && hz(8, wd) < 0.25) { o.rain = 0.3 * bump(hh, 14 + hz(9, wd) * 4, 1.1); o.cloud = 0.45 + 0.3 * bump(hh, 15, 2.5); }   // a passing shower
    } else if (type === 'sunny' && rs === 'rain' && hh > 12) o.cloud = Math.max(o.cloud, 0.12 + 0.3 * bump(hh, 15, 3));   // clouds build up after noon even on a clear day
    return o;
  }
  const hhNow = () => { const h = S.time / 60; return h < 6 ? h + 24 : h; };
  const mist = () => { const h = S.time / 60; return rsn() === 'cool' ? 0.55 * bump(h, 6.4, 2.4) : rsn() === 'rain' ? 0.12 * bump(h, 6.2, 1.6) : 0; };
  const hazeOn = () => { try { return !!(typeof RL !== 'undefined' && RL.on && RL.on('pm25')); } catch (e) { return false; } };
  const heatWave = () => rsn() === 'hot' && hz(11) < 0.3 && /sunny|partly/.test(S.weather.type);
  const coldSnap = () => rsn() === 'cool' && hz(12) < 0.33 && /sunny|partly|fog|cloudy/.test(S.weather.type);

  // ---------- 2) live state, smoothed ----------
  const V = { rain: 0, cloud: 0.1, fog: 0, wind: 0.2, storm: 0, nb: 6, q: [], fl: [], t0: 0, bolts: [], warned: {}, lastTier: '', toastAt: 0, preToast: -1 };
  const tierOf = r => { const mm = 50 * Math.pow(r, 2.2); return mm < 0.15 ? 0 : mm < 0.8 ? 1 : mm < 2.5 ? 2 : mm < 7.5 ? 3 : mm < 20 ? 4 : 5; };
  const TIERS = ['', 'ฝนปรอย', 'ฝนเล็กน้อย', 'ฝนปานกลาง', 'ฝนตกหนัก', 'ฝนตกหนักมาก'];
  const mmh = r => 50 * Math.pow(r, 2.2);
  const _uw = updateWeather;
  updateWeather = function (dt) {
    G.lightT = 999;                                   // the old random flash is replaced by real bolts below
    _uw(dt);
    try { live(dt); } catch (e) { if (!live.err) { live.err = 1; console.warn('v90', e); } }
  };
  function live(dt) {
    if (!S || !G.started) return;
    const W = WEATHER[S.weather.type] || WEATHER.sunny, sh = shape(S.weather.type, hhNow(), wDay()), k = 1 - Math.exp(-dt * 0.35);
    let cl = sh.cloud, fg = Math.max(W.fog * (S.weather.type === 'fog' ? 1 : 0.6), mist());
    if (hazeOn()) { fg = Math.max(fg, 0.3); cl = Math.max(cl, 0.3); }
    fg = Math.max(fg, sh.rain * 0.28);
    V.rain += (sh.rain - V.rain) * k; V.cloud += (cl - V.cloud) * k; V.fog += (fg - V.fog) * k; V.storm += (sh.storm - V.storm) * k;
    // wind: slow gusts, stronger before and during a storm and on a cold snap
    const g = 0.5 + 0.5 * Math.sin(G.t * 0.55) * Math.sin(G.t * 1.7 + 1.3), pre = sh.hs != null && hhNow() > sh.hs - 1 && hhNow() < sh.hs + sh.d ? 0.35 : 0;
    const wt = clamp(W.wind * (0.7 + 0.6 * g) + V.storm * 0.35 + pre * (0.5 + 0.5 * g) + (coldSnap() ? 0.25 : 0) + (V.gustKick || 0), 0.05, 1.2);
    V.gustKick = Math.max(0, (V.gustKick || 0) - dt * 0.4); V.wind += (wt - V.wind) * Math.min(1, dt * 1.2);
    G.wx.rain = V.rain; G.wx.cloud = V.cloud; G.wx.fog = V.fog; G.wx.storm = V.storm; G.wx.wind = V.wind;
    const R = G.rain; if (R && R.m) { R.m.material.opacity = 0.12 + 0.46 * Math.pow(V.rain, 0.8); R.m.material.color.setHex(V.rain > 0.7 ? 0xa9b9ca : 0xc4d1de); }
    if (G.simulating || G.paused) return;
    lightning(dt); thunder(); bulletin(); tierToasts(sh);
  }

  // ---------- 3) lightning and thunder ----------
  const bolts = [], mkLine = (op) => { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(60 * 3), 3)); const l = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xe9f1ff, transparent: true, opacity: 0, fog: false, depthWrite: false })); l.frustumCulled = false; l.visible = false; G.scene.add(l); return l; };
  const pool = []; for (let i = 0; i < 6; i++) pool.push(mkLine());
  const camDir = () => { const d = new THREE.Vector3(); G.camera.getWorldDirection(d); return Math.atan2(d.x, d.z); };
  function buildBolt(x, z, top, jag) {
    const pts = [], n = 16, rnd = () => Math.random() - 0.5; let px = x + rnd() * 20, pz = z + rnd() * 20;
    for (let i = 0; i <= n; i++) { const t = i / n; const y = top * (1 - t); px += rnd() * jag * (1 - t * 0.5); pz += rnd() * jag * (1 - t * 0.5); pts.push([lerp(px, x, t * t), Math.max(0, y), lerp(pz, z, t * t)]); }
    return pts;
  }
  function setLine(l, pts, off) { const a = l.geometry.attributes.position.array; let i = 0; for (const p of pts) { a[i++] = p[0] + off; a[i++] = p[1]; a[i++] = p[2] + off; } l.geometry.setDrawRange(0, pts.length); l.geometry.attributes.position.needsUpdate = true; l.visible = true; }
  function fire(force, fd) {
    const inside = !!(G.inside || G.inMine || G.inRoom), st = V.storm, now = performance.now() / 1000;
    const near = Math.random() < 0.12 * st && !inside, dist = fd || (near ? 15 + Math.random() * 30 : 60 + Math.pow(Math.random(), 1.5) * (st > 0.7 ? 800 : 1500));
    const sheet = !fd && Math.random() < 0.35 && !near;                                         // lightning inside the cloud: the whole sky glows, no bolt to the ground
    const I = clamp(1.25 - dist / 600, 0.18, 1) * (inside ? 0.28 : 1) * (sheet ? 0.55 : 1);
    V.fl = [[0, I], [0.11, I * 0.35], [0.19, I * 0.95], [0.33, I * 0.3], [0.45, I * 0.5]]; V.t0 = now; V.flDone = 0;
    if (!inside && !sheet) {
      const p = G.player.pos, ang = camDir() + (Math.random() - 0.5) * (near ? 3 : 2.2), x = G.camera.position.x + Math.sin(ang) * dist, z = G.camera.position.z + Math.cos(ang) * dist;
      const pts = buildBolt(x, z, 150 + Math.random() * 60, 14 + Math.random() * 8), br = (() => { const o = pts[7], dx = (Math.random() - 0.5) * 90, dz = (Math.random() - 0.5) * 90, r = []; for (let i = 0; i <= 7; i++) { const t = i / 7; r.push([o[0] + dx * t + (Math.random() - 0.5) * 8, o[1] * (1 - t * 0.75), o[2] + dz * t + (Math.random() - 0.5) * 8]); } return r; })();
      const lines = []; [[pool[0], pts, 0], [pool[1], pts, Math.max(0.4, dist * 0.004)], [pool[2], pts, -Math.max(0.4, dist * 0.004)], [pool[3], br, 0]].forEach(([l, pp, off]) => { setLine(l, pp, off); lines.push(l); });
      V.bolts.push({ lines, t0: now, I });
      if (V.bolts.length > 1) V.bolts.shift();
    }
    V.q.push({ at: now + Math.min(7, dist / 343), dist, inside, I });
    V.gustKick = Math.max(V.gustKick || 0, 0.3);
    if (near) { G.flash = 1; try { UI.toast('ฟ้าผ่าใกล้มาก! อย่ายืนกลางทุ่งหรือใต้ต้นไม้ใหญ่', '⚡'); } catch (e) { } }
  }
  function lightning(dt) {
    const now = performance.now() / 1000, el = now - V.t0;
    if (V.fl.length) { for (const [t, v] of V.fl) if (el >= t && el < t + 0.1) G.flash = Math.max(G.flash, v); if (el > 0.6) V.fl = []; }
    for (const b of V.bolts) { const e = now - b.t0; const pat = e < 0.11 ? 1 : e < 0.19 ? 0.25 : e < 0.33 ? 0.9 : e < 0.45 ? 0.3 : 0; b.lines.forEach((l, i) => { l.material.opacity = pat * (i === 3 ? 0.6 : i === 0 ? 1 : 0.45); l.visible = pat > 0.01; }); if (e > 0.5) { b.lines.forEach(l => { l.visible = false; }); b.dead = 1; } }
    V.bolts = V.bolts.filter(b => !b.dead);
    if (V.storm < 0.12 || G.inMine) return;
    V.nb -= dt; if (V.nb <= 0) { fire(); V.nb = lerp(16, 2.6, clamp(V.storm, 0, 1)) * (0.5 + Math.random()); }
  }
  function thunder() {
    const now = performance.now() / 1000;
    for (let i = V.q.length - 1; i >= 0; i--) {
      const q = V.q[i]; if (now < q.at) continue; V.q.splice(i, 1);
      const vol = clamp(1.15 - q.dist / 750, 0.1, 1) * (q.inside ? 0.45 : 1);
      try {
        if (q.dist < 160) { Sfx.burst(0.18, 3200, 'highpass', 0.55 * vol, 0.7); Sfx.burst(0.5, 700, 'bandpass', 0.5 * vol, 0.8, 0.02); Sfx.burst(3.2, 120, 'lowpass', 0.95 * vol, 0.5, 0.08); Sfx.burst(2.0, 70, 'lowpass', 0.7 * vol, 0.5, 0.5); }
        else { Sfx.burst(4.5, 95, 'lowpass', 0.55 * vol, 0.4); Sfx.burst(3, 170, 'lowpass', 0.35 * vol, 0.5, 0.9); Sfx.burst(2.5, 80, 'lowpass', 0.4 * vol, 0.5, 2.2); }
      } catch (e) { }
    }
  }

  // ---------- 4) temperature extras: heat waves, cold snaps, storm cooling ----------
  if (window.Temp78) {
    const _now = Temp78.now, hr = () => S.time / 60;
    const adj = () => {
      let a = 0; const peak = bump(hr(), 14.5, 4.5);
      if (heatWave()) a += 3.2 * peak + 0.8;
      if (coldSnap()) a -= 4 * (0.6 + 0.4 * (1 - peak));
      if (rsn() === 'hot' && /sunny/.test(S.weather.type)) a += 1.2 * peak;
      a -= V.storm * 3 + (V.rain > 0.4 ? 1.2 : 0);
      return a;
    };
    const now2 = () => Math.round((_now() + adj()) * 10) / 10;
    Temp78.now = now2; Temp78.thirstMult = () => clamp(1 + (now2() - 30) * 0.1, 1, 1.8); Temp78.hungerMult = () => now2() < 20 ? 1 + (20 - now2()) * 0.04 : 1;
  }
  const temp = () => (window.Temp78 ? Temp78.now() : 30);
  const humidity = () => Math.round(clamp(52 + V.rain * 34 + V.cloud * 10 + (rsn() === 'rain' ? 14 : rsn() === 'hot' ? -8 : 0) + (V.fog * 12) - bump(S.time / 60, 14.5, 4.5) * 16, 25, 99));
  const feels = () => { const t = temp(), h = humidity(); return Math.round((t + Math.max(0, t - 26) * (h - 35) / 100 * 0.95 - V.wind * 1.5) * 10) / 10; };
  const uv = () => { const hr = S.time / 60, s = Math.max(0, Math.sin((hr - 6.2) / 11.6 * Math.PI)); return Math.round(clamp(11.5 * s * (1 - V.cloud * 0.72) * (1 - V.rain * 0.5), 0, 12)); };
  const pm25 = () => { const base = rsn() === 'cool' ? 40 : rsn() === 'hot' ? 30 : 13; let v = base * (1 - V.rain * 0.6) * (1 + 0.5 * bump(S.time / 60, 7, 2.5) * (rsn() === 'cool' ? 1 : 0.3)) + (hazeOn() ? 55 : 0); return Math.round(v + hz(21) * 8); };
  const pmTier = v => v <= 15 ? ['ดีมาก', '🟢'] : v <= 25 ? ['ดี', '🟢'] : v <= 37.5 ? ['ปานกลาง', '🟡'] : v <= 75 ? ['เริ่มมีผลต่อสุขภาพ', '🟠'] : ['มีผลต่อสุขภาพ', '🔴'];
  const kmh = () => Math.round(V.wind * 38);
  function condition() {
    const t = tierOf(V.rain);
    if (V.storm > 0.5 && t >= 3) return { i: '⛈️', n: 'พายุฝนฟ้าคะนอง' + (t >= 4 ? ' ฝนตกหนัก' : '') };
    if (V.storm > 0.5) return { i: '🌩️', n: 'ฟ้าคะนอง ฟ้าแลบฟ้าร้อง' };
    if (t >= 4) return { i: '🌧️', n: TIERS[t] };
    if (t === 3) return { i: '🌧️', n: TIERS[t] };
    if (t >= 1) return { i: '🌦️', n: TIERS[t] };
    if (V.fog > 0.6) return { i: '🌫️', n: 'หมอกหนา' };
    if (hazeOn() && V.fog > 0.25) return { i: '😷', n: 'หมอกควัน ฝุ่น PM2.5' };
    if (V.fog > 0.35) return { i: '🌫️', n: 'หมอกบาง' };
    if (heatWave() && temp() > 36) return { i: '🥵', n: 'ร้อนจัด' };
    if (coldSnap() && temp() < 21) return { i: '🥶', n: 'อากาศหนาวเย็น' };
    return null;
  }
  { const _hud = UI.hud.bind(UI);
    UI.hud = function () { _hud(); try { const e = document.getElementById('wx'); if (!e || !S || G.night > 0.5 && !condition()) return; const c = condition(), t = temp(); const moon = G.night > 0.5 && (S.weather.type === 'sunny' || S.weather.type === 'partly'); if (c) { e.textContent = c.i + ' ' + Math.round(t) + '°'; e.title = c.n + ' · ' + t.toFixed(1) + '°C · รู้สึกเหมือน ' + feels() + '°C'; } else if (!moon) { e.title += ' · รู้สึกเหมือน ' + feels() + '°C'; } } catch (x) { } };
  }

  // ---------- 5) warnings and small announcements ----------
  const hhmm = h => { h = h % 24; return String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.floor((h % 1) * 60)).padStart(2, '0'); };
  function bulletin() {
    const key = S.day; if (V.warned[key] || S.time < 405 || S.time > 540) return; V.warned = { [key]: 1 };
    const sh = shape(S.weather.type, 8, wDay()), msgs = [];
    if (S.weather.type === 'storm' && sh.hs != null) msgs.push(`⚡ เตือนภัย: ฝนฟ้าคะนองและลมกระโชกแรง คาดว่าเริ่มประมาณ ${hhmm(sh.hs)} น. นาน ${sh.d.toFixed(1)} ชม. ฟ้าผ่า น้ำท่วมขังบนถนน เก็บของที่ตากไว้ และอย่าอยู่กลางทุ่งหรือใต้ต้นไม้ใหญ่`);
    if (heatWave()) msgs.push(`🥵 อากาศร้อนจัด อุณหภูมิสูงสุดประมาณ ${Math.round(temp() + 3)}°C ดื่มน้ำให้พอ หลีกเลี่ยงงานกลางแดด 11:00-15:00 ระวังฮีทสโตรก`);
    if (coldSnap()) msgs.push('🥶 มวลอากาศเย็นกำลังแรงจากประเทศจีน อุณหภูมิลดลงฉับพลัน มีลมแรง ใส่เสื้อกันหนาวและดูแลสัตว์เลี้ยงให้อบอุ่น');
    if (hazeOn()) msgs.push(`😷 ค่าฝุ่น PM2.5 อยู่ในระดับ${pmTier(pm25())[0]} ใส่หน้ากาก N95 เมื่อออกนอกอาคาร`);
    if (rsn() === 'cool' && S.weather.type === 'fog') msgs.push('🌫️ หมอกหนาจัดช่วงเช้า ทัศนวิสัยต่ำ ขับรถช้าลง เปิดไฟตัดหมอก');
    for (const m of msgs) try { Phone.msg('กรมอุตุนิยมวิทยา', m, true); } catch (e) { }
  }
  function tierToasts(sh) {
    if (G.inside) return; const now = performance.now() / 1000;
    const t = tierOf(V.rain), key = t >= 4 ? 'heavy' : t >= 1 ? 'rain' : 'dry';
    if (key !== V.lastTier) {
      if (V.lastTier && now - V.toastAt > 25) { V.toastAt = now; try { if (key === 'heavy') UI.toast('ฝนตกหนักมาก ถนนเริ่มมีน้ำท่วมขัง', '🌧️'); else if (key === 'dry' && V.lastTier !== 'dry') UI.toast('ฝนซาแล้ว', '🌤️'); else if (key === 'rain' && V.lastTier === 'dry') UI.toast(TIERS[t] + 'เริ่มตก', '🌦️'); } catch (e) { } }
      V.lastTier = key;
    }
    if (sh.hs != null && S.weather.type === 'storm') { const lead = sh.hs - hhNow(); if (lead > 0.2 && lead < 0.75 && V.preToast !== S.day) { V.preToast = S.day; try { UI.toast('ท้องฟ้ามืดครึ้ม ลมเริ่มแรง เมฆฝนฟ้าคะนองกำลังเข้า', '🌩️'); } catch (e) { } } }
  }

  // ---------- 6) the phone weather app ----------
  if (typeof Phone !== 'undefined' && Phone.apps && Phone.apps.wx) {
    const _wx = Phone.apps.wx;
    Phone.apps.wx = function () {
      let h = _wx.apply(this, arguments);
      try {
        const c = condition(), pmv = pm25(), pt = pmTier(pmv), u = uv(), nx = WEATHER[S.weather.next], wd = wDay();
        const hours = []; for (let hh = 6; hh <= 22; hh += 1) { const s = shape(S.weather.type, hh, wd), t = tierOf(s.rain), cur = Math.floor(hhNow()) === hh; hours.push(`<span style="display:inline-block;width:12%;text-align:center;font-size:11px;${cur ? 'background:rgba(255,193,7,.25);border-radius:6px' : ''}">${String(hh).padStart(2, '0')}<br>${s.storm > 0.6 && t >= 3 ? '⛈️' : t >= 4 ? '🌧️' : t >= 1 ? '🌦️' : s.cloud > 0.75 ? '☁️' : s.cloud > 0.35 ? '⛅' : (hh >= 18 || hh < 6) ? '🌙' : '☀️'}</span>`); }
        const chance = ty => ({ sunny: 5, partly: 15, cloudy: 35, rain: 80, storm: 90, fog: 10 }[ty] || 10);
        // v1.1: 7-day forecast in the style of the Thai Meteorological Department. Today and the next two days are already decided (high confidence); later days are chances from the season's weather mix
        const known = [S.weather.type, S.weather.next, S.weather.next2], dn = ['วันนี้', 'พรุ่งนี้', 'มะรืนนี้'];
        const fc = []; for (let d = 0; d < 7; d++) { const day = S.day + d, w = season(day).w, tot = Object.values(w).reduce((a, b) => a + b, 0), pc = k => Math.round((w[k] || 0) / tot * 100), rainP = pc('rain') + pc('storm');
          const label = d < 3 ? dn[d] : (() => { try { const t = Cal36.date(day); return Cal36.DAYN[t.dow].slice(3) + ' ' + t.dom + ' ' + Cal36.MONS[t.m]; } catch (e) { return 'อีก ' + d + ' วัน'; } })();
          if (d < 3 && known[d]) { const t = known[d], W = WEATHER[t]; fc.push(`<div style="display:grid;grid-template-columns:96px 1fr auto;gap:6px;align-items:center;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.1);font-size:13px"><b>${label}</b><span>${W.i} ${W.n}${t === 'storm' ? ' (ฟ้าคะนอง)' : ''}</span><span>☔ ${chance(t)}% <small class="dim">แน่นอนสูง</small></span></div>`); }
          else { const order = ['sunny', 'partly', 'cloudy', 'rain', 'storm', 'fog'].filter(k => w[k]), top = order.slice().sort((a, b) => (w[b] || 0) - (w[a] || 0))[0]; fc.push(`<div style="padding:5px 0;border-bottom:1px solid rgba(255,255,255,.1);font-size:13px"><div style="display:grid;grid-template-columns:96px 1fr auto;gap:6px;align-items:center"><b>${label}</b><span>${WEATHER[top].i} น่าจะ${WEATHER[top].n}</span><span>☔ ${rainP}%</span></div><div class="dim" style="font-size:11.5px">${order.map(k => WEATHER[k].i + pc(k) + '%').join(' · ')}</div></div>`); } }
        const sId = season().id, sw = season().w, st0 = Object.values(sw).reduce((a, b) => a + b, 0), mix = Object.keys(sw).map(k => `${WEATHER[k].i} ${WEATHER[k].n} ${Math.round(sw[k] / st0 * 100)}%`).join(' · ');
        const mm = mmh(V.rain);
        h += `<div class="card"><div class="ci">${c ? c.i : '🌡️'}</div><div class="cb"><h4>${c ? c.n : 'อากาศ' + WEATHER[S.weather.type].n} ${temp().toFixed(1)}°C</h4>
          <p class="dim">รู้สึกเหมือน ${feels()}°C · ความชื้น ${humidity()}% · ลม ${kmh()} กม./ชม.${V.storm > 0.3 ? ' (กระโชกถึง ' + Math.round(kmh() * 1.7) + ')' : ''}</p>
          <p class="dim">☔ ${V.rain > 0.02 ? TIERS[tierOf(V.rain)] + ' ประมาณ ' + mm.toFixed(1) + ' มม./ชม.' : 'ไม่มีฝนตอนนี้'} · โอกาสฝนพรุ่งนี้ ${chance(S.weather.next)}%</p>
          <p class="dim">🔆 ดัชนี UV ${u}${u >= 8 ? ' (สูงมาก ทาครีมกันแดด)' : u >= 6 ? ' (สูง)' : u >= 3 ? ' (ปานกลาง)' : ' (ต่ำ)'} · ${pt[1]} PM2.5 ${pmv} µg/ลบ.ม. (${pt[0]})</p></div></div>
          <div class="card"><div class="cb" style="width:100%"><h4>📅 พยากรณ์ 7 วัน (กรมอุตุนิยมวิทยาสุขใจ)</h4>${fc.join('')}<p class="dim" style="margin-top:6px">${season().n}: โอกาสเกิดในแต่ละวัน ${mix}</p><p class="dim">สภาพอากาศสุ่มตามฤดูกาล · 3 วันแรกชัดเจนแล้ว วันถัด ๆ ไปเป็นเปอร์เซ็นต์โอกาสเกิด</p></div></div>
          <div class="card"><div class="cb" style="width:100%"><h4>🕐 พยากรณ์รายชั่วโมงวันนี้</h4><div>${hours.join('')}</div>
          <p class="dim">${S.weather.type === 'storm' ? 'ฟ้าคะนองช่วงบ่าย ฟ้าผ่าและลมกระโชกแรงตอนฝนหนัก' : S.weather.type === 'rain' ? 'ฝนตกเป็นช่วง มีฝนหนักสลับฝนปรอย' : rsn() === 'rain' ? 'หน้าฝน: เช้าโปร่ง บ่ายเมฆก่อตัว อาจมีฝนฟ้าคะนองฉับพลัน' : rsn() === 'cool' ? 'หน้าหนาว: เช้าหมอกและอากาศเย็น กลางวันแดดอุ่น' : 'หน้าร้อน: แดดแรงช่วงบ่าย พายุฤดูร้อนอาจเกิดช่วงเย็น'}</p></div></div>`;
      } catch (e) { console.warn('v90 app', e); }
      return h;
    };
  }
  window.Wx90 = { shape, V, tierOf, temp, feels, humidity, uv, pm25, condition, fire, heatWave, coldSnap };
});
