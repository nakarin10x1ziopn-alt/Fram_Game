'use strict';
// ---------- v30 stability: the right starting quality for each kind of device (iPhone, iPad, notebook, desktop), a render-size
// budget, a cap on how many detailed people are drawn at once, tabs that pause quietly in the background, saves that survive a full
// storage quota, a step down in quality after the graphics memory was lost once, and a small diagnostics report: Stab30.report() ----------
const Stab30 = {
  // ===== 1. what kind of device is this =====
  _dev: null,
  gpu() {
    if (this._g !== undefined) return this._g;
    let g = '';
    try {
      const c = document.createElement('canvas'), gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (gl) {
        const e = gl.getExtension('WEBGL_debug_renderer_info');
        g = String(e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
        const l = gl.getExtension('WEBGL_lose_context'); if (l) l.loseContext();   // give the context back before the game makes its own
      }
    } catch (e) { }
    return this._g = g;
  },
  device() {
    if (this._dev) return this._dev;
    const ua = navigator.userAgent, tp = navigator.maxTouchPoints || 0;
    const iphone = /iPhone|iPod/.test(ua), ipad = /iPad/.test(ua) || (navigator.platform === 'MacIntel' && tp > 1);
    const android = /Android/.test(ua), touch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    const gpu = this.gpu(), cores = navigator.hardwareConcurrency || 4, mem = navigator.deviceMemory || 0;
    const soft = /swiftshader|llvmpipe|software|basic render|softpipe/i.test(gpu);
    const integrated = !iphone && !ipad && !android && /intel.*(hd|uhd|iris|graphics|xe)|mali|adreno|powervr|microsoft basic|radeon\(tm\) graphics|vega \d+ graphics/i.test(gpu);
    const kind = iphone ? 'iphone' : ipad ? 'ipad' : android ? 'android' : touch && !/Windows|Macintosh|Linux x86/.test(ua) ? 'tablet' : 'computer';
    return this._dev = { kind, touch, gpu: gpu.replace(/ANGLE \(|\)$/g, '').slice(0, 70), cores, mem, soft, integrated, ios: iphone || ipad };
  },
  // the quality tier a device should START on when the player has never chosen one (the governor still adapts from there)
  pick(touch, weak) {
    try {
      const d = this.device();
      if (d.soft) return 'low';
      if (d.kind === 'iphone' || d.kind === 'ipad') return 'med';          // iPhone 15 / iPad (A16): medium shadows and 1.5x sharpness, bloom off
      if (d.kind === 'android' || d.kind === 'tablet') return weak || d.mem && d.mem <= 4 ? 'low' : 'med';
      if (d.integrated || d.cores <= 4 || d.mem && d.mem <= 4) return 'med'; // notebooks with shared graphics: no bloom/MSAA pass
      return null;                                                          // a desktop graphics card: the normal default ('high')
    } catch (e) { return null; }
  },
  // pixels the GPU may fill per frame (millions) by device class: keeps big screens and small GPUs smooth
  budget() {
    const d = this.device();
    return d.soft ? 0.8 : d.kind === 'iphone' ? 1.7 : d.kind === 'ipad' ? 3.2 : d.kind === 'android' || d.kind === 'tablet' ? 1.8 : d.integrated || d.cores <= 4 ? 2.8 : 6.5;
  },
  fitPr() {
    if (!G.renderer || !G.Q) return;
    if (this.pr0 === undefined) this.pr0 = G.Q.pr;
    const k = Math.sqrt(this.budget() * 1e6 / Math.max(1, innerWidth * innerHeight));
    const lim = Math.max(0.75, Math.min(this.pr0, +k.toFixed(2)));
    if (Math.abs(lim - G.Q.pr) < 0.01) return;
    G.Q.pr = lim; if (G.pr > lim) Perf.setPr(lim);
  },

  // ===== 2. people: never draw more detailed (30-mesh) people than the device can afford =====
  caps: { low: 8, med: 14, high: 26, ultra: 40 },
  hide: [], hideT: 0,
  npcCap() {
    const cap = this.caps[G.Q.lvl] || 20;
    if (G.inside) return;
    const list = [], cp = G.camera.position;
    for (const n of G.npcs) if (n.obj && n.obj.visible) list.push([Math.abs(cp.x - n.x) + Math.abs(cp.z - n.z), n]);
    this.visN = list.length;
    if (list.length <= cap) { this.hide.length = 0; return; }
    list.sort((a, b) => a[0] - b[0]);
    this.hide = list.slice(cap).map(a => a[1]);
  },

  // ===== 2b. far static scenery: ~900 small meshes 120-600 m away were drawn whenever they were in the view cone; each tier draws only
  // what is within its radius (fog already hides the rest). Meshes are looked up once and only toggled, never rebuilt =====
  far: { map: new Map(), cur: null, t: 0, hidden: 0, list: [] },
  // cities are small and dense, so they use a shorter radius than the open countryside
  farR(inCity) { const d = this.device(), r = G.Q.lvl === 'ultra' ? 0 : G.Q.lvl === 'low' || d.soft ? 190 : G.Q.lvl === 'med' ? (d.ios || d.kind === 'android' ? 230 : 260) : 380; return inCity ? Math.round(r * 0.6) : r; },
  farBuild(root, strict) {
    const E = { root, list: [], n: root.children.length, on: false }; root.updateMatrixWorld(true);
    const bs = new THREE.Sphere();
    const add = o => {
      if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || !o.geometry || !o.geometry.attributes.position) return;
      if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
      bs.copy(o.geometry.boundingSphere).applyMatrix4(o.matrixWorld);
      if (bs.radius > 90 || !Number.isFinite(bs.radius)) return;      // ground, roads, sea: always drawn
      E.list.push({ m: o, x: bs.center.x, z: bs.center.z, r: bs.radius, hid: false });
    };
    for (const g of root.children) {
      if (strict) { let cnt = 0; g.traverse(o => { if (o.isMesh) cnt++; }); if (cnt < 12) continue; }   // small props near the farm stay as they are
      g.traverse(add);
    }
    return E;
  },
  // a city is ~1400 separate meshes = ~1700 draw calls. The countryside's buildings are merged by material at boot (Perf3.run, then Merge.run);
  // the cities are built later, so the same two routines run once on a city the first time it is entered
  mergeCity(g) {
    if (!g || typeof Merge === 'undefined' || typeof Perf3 === 'undefined' || G.simulating) return false;
    const real = World.outdoor, info = Merge.info, t = performance.now(); let before = 0, after = 0;
    g.traverse(o => { if (o.isMesh) before++; });
    try {
      const L = []; g.traverse(o => { if (o.userData && o.userData.staticB && !o.userData.merged) L.push(o); });
      for (const b of L) { b.userData.merged = 1; try { Perf3.merge(b); } catch (e) { } }
      World.outdoor = g; Merge.run();
    } catch (e) { console.warn('v30 merge', e); } finally { World.outdoor = real; Merge.info = info; }
    g.traverse(o => { if (o.isMesh) after++; });
    this.farRestore(this.far.map.get(g)); this.far.map.delete(g); this.far.cur = null;   // the mesh list changed: look it up again
    this.merged = (this.merged || []).concat([[before, after, Math.round(performance.now() - t)]]);
    return true;
  },
  farRestore(E) { if (!E) return; for (const e of E.list) if (e.hid) { e.m.visible = true; e.hid = false; } E.on = false; this.far.hidden = 0; },
  farUpdate(dt) {
    const F = this.far; if ((F.t -= dt) > 0) return; F.t = 0.5;
    const city = G.away && G.away.g && !G.inside ? G.away.g : null, root = city || World.outdoor, R = this.farR(!!city);
    if (F.cur && F.cur.root !== root) { this.farRestore(F.cur); F.cur = null; }
    if (!R || G.inside || !root || !G.started) { this.farRestore(F.cur); return; }
    if (performance.now() < (this.farAfter || 0)) return;       // wait until the one-time scenery merge has run
    if (city && !city.userData.v30m) { city.userData.v30m = 1; setTimeout(() => { try { this.mergeCity(city); } catch (e) { } }, 1500); }
    let E = F.map.get(root);
    if (!E || E.n !== root.children.length) { this.farRestore(E); E = this.farBuild(root, !city); F.map.set(root, E); F.builds = (F.builds || 0) + 1; }
    F.cur = E; F.list = E.list; E.on = true;
    const c = G.camera.position, cx = c.x, cz = c.z; let hid = 0;
    for (const e of E.list) {
      const dx = e.x - cx, dz = e.z - cz, h = dx * dx + dz * dz > (R + e.r) * (R + e.r);
      if (h !== e.hid) { e.m.visible = !h; e.hid = h; }
      if (h) hid++;
    }
    F.hidden = hid;
  },

  // ===== 3. the tab goes to the background: save, stop the sound, forget the long frame =====
  lifecycle() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (!(typeof IOS !== 'undefined' && IOS)) { try { if (G.started) saveGame(true); } catch (e) { } }
        try { if (Sfx.ctx && Sfx.ctx.state === 'running') Sfx.ctx.suspend(); } catch (e) { }
      } else {
        try { Sfx.resume(); } catch (e) { }
        try { _clock.getDelta(); } catch (e) { }
        Perf.acc = 0; Perf.n = 0; this.last = 0;
      }
    });
    addEventListener('freeze', () => { try { if (G.started) saveGame(true); } catch (e) { } });
    let rt = 0; const refit = () => { clearTimeout(rt); rt = setTimeout(() => this.fitPr(), 400); };
    addEventListener('resize', refit); addEventListener('orientationchange', refit);
  },
  // graphics memory lost once = this device cannot hold this tier: start one step lower next time
  context() {
    const cv = document.getElementById('c'); if (!cv) return;
    cv.addEventListener('webglcontextlost', () => {
      this.lost = (this.lost || 0) + 1;
      const lower = { ultra: 'high', high: 'med', med: 'low' }[G.Q.lvl];
      if (lower) safeSet(Q_KEY, lower);
    }, false);
  },

  // ===== 4. a full storage quota must not silently lose progress =====
  freeSpace() {
    let n = 0;
    try {
      for (const k of Object.keys(localStorage)) if (/^raisukjai3d_(album|bench|iostip)/.test(k)) { localStorage.removeItem(k); n++; }
    } catch (e) { }
    return n;
  },
  quota() {
    const _ss = safeSet;
    safeSet = function (k, v) {
      if (_ss(k, v)) return true;
      if (typeof saveKey === 'function' && k === saveKey()) {
        Stab30.freeSpace();
        if (_ss(k, v)) return true;
        if (!Stab30.quotaTold) { Stab30.quotaTold = true; try { UI.toast('พื้นที่เก็บข้อมูลของเบราว์เซอร์เต็ม บันทึกในเครื่องไม่ได้ ลองลบรูปถ่ายหรือล้างข้อมูลเว็บอื่น', '⚠️'); } catch (e) { } }
      }
      return false;
    };
  },

  // ===== 5. diagnostics =====
  fr: [], last: 0,
  frame() {
    const _f = Perf.frame;
    Perf.frame = function (dt) {
      const now = performance.now(), s = Stab30;
      if (s.last && !document.hidden && G.started && !G.paused) { const d = now - s.last; if (d < 1000) { s.fr.push(d); if (s.fr.length > 300) s.fr.shift(); } }
      s.last = now;
      return _f.call(this, dt);
    };
  },
  measure() {
    const r = G.renderer, i = r.info, ar = i.autoReset;
    i.autoReset = false; i.reset();
    try { Gfx.render(); } finally { i.autoReset = ar; }
    return { calls: i.render.calls, tris: i.render.triangles };
  },
  report() {
    const f = this.fr.slice().sort((a, b) => a - b), n = f.length, avg = n ? f.reduce((s, x) => s + x, 0) / n : 0;
    const p95 = n ? f[Math.min(n - 1, Math.floor(n * 0.95))] : 0;
    const m = performance.memory, info = G.renderer.info.memory, d = this.device();
    const sk = []; try { for (const k of Object.keys(S)) sk.push([k, JSON.stringify(S[k]).length]); sk.sort((a, b) => b[1] - a[1]); } catch (e) { }
    let saveKB = 0; try { saveKB = Math.round(JSON.stringify(S).length / 1024); } catch (e) { }
    return {
      tier: G.Q.lvl, device: d.kind, gpu: d.gpu, cores: d.cores, mem: d.mem, pr: +(G.pr || 0).toFixed(2), prMax: G.Q.pr, shadow: !!G.shadow, view: G.view,
      screen: `${innerWidth}x${innerHeight}`, budgetMP: this.budget(),
      fpsAvg: avg ? Math.round(1000 / avg) : null, fpsP5: p95 ? Math.round(1000 / p95) : null, frames: n,
      render: this.measure(), geometries: info.geometries, textures: info.textures,
      heapMB: m ? Math.round(m.usedJSHeapSize / 1e6) : null,
      farHidden: this.far.hidden || 0, farTracked: this.far.list.length, farBuilds: this.far.builds || 0, cityMerges: this.merged || [], farRadius: this.farR(!!(G.away && G.away.g)), shadowBox: this.shadowBox || 42,
      npcsShown: this.visN || 0, npcsHiddenByCap: this.hide.length, npcCap: this.caps[G.Q.lvl],
      saveKB, bigSaveKeys: sk.slice(0, 5), contextLost: this.lost || 0,
      assetStringsFreed: !(typeof ASSET_DATA !== 'undefined' && (ASSET_DATA.glb && Object.keys(ASSET_DATA.glb).length || ASSET_DATA.chars)),
      slowInit: (V23.times || []).filter(t => t[1] >= 40), initTotalMs: (V23.times || []).reduce((s, t) => s + t[1], 0),
      frameErrors: typeof Stable !== 'undefined' ? [...Stable.errs].slice(0, 5) : [],
    };
  },
  // runs the real loop N times with the browser's frame callback switched off (works even when the tab is hidden) and times each part
  profile(frames = 60) {
    const targets = [
      ['updatePlayer'], ['updateNPCs'], ['updateAnimals'], ['updateTraffic'], ['updateWeather'], ['updateCamera'], ['updateSky'], ['updateRain'], ['updateSprinklers'], ['updatePlotsAnim'], ['updateLamps'],
      ['People', 'tags'], ['Life', 'update'], ['Net', 'update'], ['Town2', 'update'], ['Rooms', 'update'], ['FX', 'update'], ['World', 'update'], ['Env', 'update'], ['Sfx', 'update'], ['Gfx', 'render'], ['UI', 'hud'], ['UI', 'minimap'], ['Perf', 'frame'],
    ];
    const T = {}, undo = [];
    for (const t of targets) {
      const nm = t.join('.'); let host, key, fn;
      if (t.length === 1) { host = window; key = t[0]; } else { try { host = eval(t[0]); } catch (e) { continue; } key = t[1]; }
      fn = host && host[key]; if (typeof fn !== 'function') continue;
      T[nm] = 0; host[key] = function () { const a = performance.now(); try { return fn.apply(this, arguments); } finally { T[nm] += performance.now() - a; } };
      undo.push(() => { host[key] = fn; });
    }
    const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0;
    const t0 = performance.now();
    try { for (let i = 0; i < frames; i++) loop(); } finally { window.requestAnimationFrame = raf; undo.forEach(u => u()); }
    const total = performance.now() - t0;
    const rows = Object.entries(T).map(([k, v]) => [k, +(v / frames).toFixed(2)]).sort((a, b) => b[1] - a[1]);
    return { msPerFrame: +(total / frames).toFixed(2), top: rows.slice(0, 10) };
  },

  init() {
    const d = this.device();
    document.body.classList.add('dev-' + d.kind);
    this.pr0 = G.Q.pr; this.fitPr();
    // a notebook that picked the medium tier keeps the shadow map at 1024; phones and tablets never go above it
    if (d.ios || d.kind === 'android') { try { if (G.sun && G.sun.shadow && G.sun.shadow.mapSize.x > 1024) { G.sun.shadow.mapSize.set(1024, 1024); if (G.sun.shadow.map) { G.sun.shadow.map.dispose(); G.sun.shadow.map = null; } } } catch (e) { } }
    // a smaller shadow box: far fewer casters to draw twice and sharper shadows from the same 1024 map (default is 42 m each way)
    try {
      const box = d.ios || d.kind === 'android' || d.kind === 'tablet' ? 28 : (d.integrated || G.Q.lvl === 'low' || G.Q.lvl === 'med') ? 34 : 0;
      if (box && G.sun && G.sun.shadow) { const sc = G.sun.shadow.camera; sc.left = -box; sc.right = box; sc.top = box; sc.bottom = -box; sc.updateProjectionMatrix(); this.shadowBox = box; }
    } catch (e) { }
    this.farAfter = performance.now() + 9000;
    this.lifecycle(); this.context(); this.quota(); this.frame();
    // keep the cap in force every frame (updateNPCs sets visibility again each time it runs)
    const _u = updateNPCs;
    updateNPCs = function (dt) {
      _u(dt);
      const s = Stab30;
      if ((s.hideT -= dt) <= 0) { s.hideT = 0.4; s.npcCap(); }
      s.farUpdate(dt);
      for (const n of s.hide) if (n.obj) n.obj.visible = false;
    };
  },
};
V23.add('v30_stable', () => Stab30.init());
