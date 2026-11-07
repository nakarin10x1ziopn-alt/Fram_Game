'use strict';
// ---------- Math / noise / helpers ----------
const TAU = Math.PI * 2;
const U = {
  clamp(v, a, b) { return v < a ? a : v > b ? b : v; },
  lerp(a, b, t) { return a + (b - a) * t; },
  pick(a) { return a[(Math.random() * a.length) | 0]; },
  smooth(e0, e1, x) { const t = U.clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); },
  rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },
  hash(x, z) {
    let h = (Math.imul(x | 0, 374761393) + Math.imul(z | 0, 668265263)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  },
  noise2(x, z) {
    const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
    const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
    const a = U.hash(ix, iz), b = U.hash(ix + 1, iz), c = U.hash(ix, iz + 1), d = U.hash(ix + 1, iz + 1);
    return U.lerp(U.lerp(a, b, ux), U.lerp(c, d, ux), uz);
  },
  noise2p(x, z, p) {
    const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
    const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
    const m = v => ((v % p) + p) % p;
    const a = U.hash(m(ix), m(iz)), b = U.hash(m(ix + 1), m(iz)), c = U.hash(m(ix), m(iz + 1)), d = U.hash(m(ix + 1), m(iz + 1));
    return U.lerp(U.lerp(a, b, ux), U.lerp(c, d, ux), uz);
  },
  fbm(x, z, o = 4) { let s = 0, a = 0.5, n = 0, f = 1; for (let i = 0; i < o; i++) { s += a * U.noise2(x * f, z * f); n += a; a *= 0.5; f *= 2.03; } return s / n; },
  fbmP(x, z, p, o = 4) { let s = 0, a = 0.5, n = 0, f = 1; for (let i = 0; i < o; i++) { s += a * U.noise2p(x * f, z * f, p * f); n += a; a *= 0.5; f *= 2; } return s / n; },
  col(hex) { return new THREE.Color(hex).convertSRGBToLinear(); },
  angLerp(a, b, t) { const d = ((b - a + Math.PI) % TAU + TAU) % TAU - Math.PI; return a + d * t; },
  fmt(n) { return Math.floor(n).toLocaleString('en-US'); },
  mat(hex, o) {
    const m = new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.85, metalness: 0 }, o || {}));
    m.color = U.col(hex);
    if (o && o.emissive !== undefined) m.emissive = U.col(o.emissive);
    return m;
  },
  mk(parent, geo, mat, p, s, r) {
    const m = new THREE.Mesh(geo, mat);
    if (p) m.position.set(p[0], p[1], p[2]);
    if (s != null) { if (typeof s === 'number') m.scale.setScalar(s); else m.scale.set(s[0], s[1], s[2]); }
    if (r) m.rotation.set(r[0], r[1], r[2], r[3] || 'XYZ');
    m.castShadow = true; m.receiveShadow = true;
    if (parent) parent.add(m);
    return m;
  },
  // box with UVs scaled to meters (s = meters per texture tile)
  box(w, h, d, s) {
    const g = new THREE.BoxGeometry(w, h, d);
    if (s) {
      const uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
      for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * dims[f][0] / s, uv.getY(k) * dims[f][1] / s); }
    }
    return g;
  },
  canvas(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; },
  tex(c, rx = 1, ry = 1, srgb = true) {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
    if (srgb) t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 8; return t;
  },
  pix(size, fn) {
    return U.canvas(size, size, (g, w, h) => {
      const id = g.createImageData(w, h), d = id.data;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const c = fn(x, y, w); const k = (y * w + x) * 4;
        d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 255;
      }
      g.putImageData(id, 0, 0);
    });
  },
  roundRect(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  },
  _emo: {},
  emojiTex(e, bubble = true) {
    const k = e + (bubble ? 1 : 0);
    if (U._emo[k]) return U._emo[k];
    const c = U.canvas(128, 128, g => {
      if (bubble) {
        g.fillStyle = 'rgba(255,255,255,0.93)'; g.beginPath(); g.arc(64, 58, 48, 0, TAU); g.fill();
        g.beginPath(); g.moveTo(52, 98); g.lineTo(64, 122); g.lineTo(76, 98); g.fill();
      }
      g.font = '62px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e, 64, bubble ? 62 : 68);
    });
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
    return (U._emo[k] = t);
  },
  sprite(e, s = 0.8, bubble = true) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: U.emojiTex(e, bubble), transparent: true, depthWrite: false, toneMapped: false }));
    sp.scale.set(s, s, s); return sp;
  },
  signTex(text, o = {}) {
    const w = o.w || 512, h = o.h || 128, K = U.SIGNK || 1;                  // K = 1.5 on tablets (v141): crisper text on signs, shop fronts and name boards
    const c = U.canvas(Math.round(w * K), Math.round(h * K), g => {
      if (K !== 1) g.scale(K, K);
      g.fillStyle = o.bg || '#6b4226'; U.roundRect(g, 5, 5, w - 10, h - 10, 18); g.fill();
      g.lineWidth = 8; g.strokeStyle = o.border || '#3f2412'; g.stroke();
      let fs = o.fs || Math.floor(h * 0.5);
      const font = () => `600 ${fs}px Kanit, Tahoma, sans-serif`;
      g.font = font();
      while (g.measureText(text).width > w - 44 && fs > 10) { fs -= 2; g.font = font(); }
      g.fillStyle = o.fg || '#fff4d6'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(text, w / 2, h / 2 + fs * 0.05);
    });
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t;
  },
  SIGNK: (() => { try { const ua = navigator.userAgent, tab = /[?&](ipad|ios)=1/.test(location.search) || /iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) || (matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) >= 700); return tab ? 1.5 : 1; } catch (e) { return 1; } })(),
  // Merge non-indexed geometries (position/normal/uv/color)
  mergeGeos(geos) {
    let n = 0; for (const g of geos) n += g.attributes.position.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
    const hasCol = geos.some(g => g.attributes.color);
    const col = hasCol ? new Float32Array(n * 3) : null;
    let o = 0;
    for (const g of geos) {
      const c = g.attributes.position.count;
      pos.set(g.attributes.position.array, o * 3);
      if (g.attributes.normal) nor.set(g.attributes.normal.array, o * 3);
      if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
      if (col) { if (g.attributes.color) col.set(g.attributes.color.array, o * 3); else col.fill(1, o * 3, (o + c) * 3); }
      o += c;
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    if (col) out.setAttribute('color', new THREE.BufferAttribute(col, 3));
    out.computeBoundingSphere();
    return out;
  },
  bake(geo, matrix) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (matrix) g.applyMatrix4(matrix);
    return g;
  },
  // Collapse a static group into one mesh per material
  mergeByMaterial(root) {
    root.updateMatrixWorld(true);
    const buckets = new Map();
    root.traverse(o => {
      if (!o.isMesh) return;
      const k = o.material.uuid;
      if (!buckets.has(k)) buckets.set(k, { mat: o.material, geos: [], shadow: o.castShadow });
      buckets.get(k).geos.push(U.bake(o.geometry, o.matrixWorld));
    });
    const out = new THREE.Group();
    for (const b of buckets.values()) {
      const m = new THREE.Mesh(U.mergeGeos(b.geos), b.mat);
      m.castShadow = b.shadow; m.receiveShadow = true; out.add(m);
      b.geos.forEach(g => g.dispose());
    }
    return out;
  },
  shareGeo(geo) {
    const g = new THREE.BufferGeometry();
    for (const k in geo.attributes) g.setAttribute(k, geo.attributes[k]);
    if (geo.index) g.setIndex(geo.index);
    return g;
  },
};

// ---------- Procedural textures ----------
const T = {};
function speckle(g, w, h, n, cols, s0, s1, al) {
  for (let i = 0; i < n; i++) {
    g.globalAlpha = al * (0.4 + Math.random() * 0.6);
    g.fillStyle = cols[(Math.random() * cols.length) | 0];
    const s = s0 + Math.random() * (s1 - s0);
    g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, s, s * (0.5 + Math.random() * 0.5), Math.random() * 3, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
}
T.init = function () {
  const P = (x, y, w, p, o) => U.fbmP(x / w * p, y / w * p, p, o);
  const R = Math.random;
  T.grass = U.tex(U.pix(256, (x, y, w) => {
    const n = P(x, y, w, 8, 4), m = P(x, y, w, 32, 2);
    const v = (0.8 + (n - 0.5) * 0.4 + (m - 0.5) * 0.25 + (R() - 0.5) * 0.14) * 255;
    return [v * 0.97, v, v * 0.92];
  }));
  {
    const c = U.pix(256, (x, y, w) => {
      const n = P(x, y, w, 6, 4), m = P(x + 50, y, w, 24, 2);
      const v = 0.78 + (n - 0.5) * 0.5 + (m - 0.5) * 0.3 + (R() - 0.5) * 0.16;
      const f = 0.86 + 0.14 * Math.sin(y / w * TAU * 4);
      return [v * f * 118, v * f * 82, v * f * 55];
    });
    speckle(c.getContext('2d'), 256, 256, 260, ['#3b2716', '#2e1d10', '#8c6a4a', '#a4876a'], 1, 4, 0.7);
    T.soil = U.tex(c);
  }
  const plank = (x, y, w, vertical) => {
    if (vertical) { const t = x; x = y; y = t; }
    const row = Math.floor(y / 32), rs = 0.82 + 0.18 * U.hash(row, 1);
    const grain = 0.9 + 0.1 * Math.sin(x / w * TAU * 3 + P(x, y * 3, w, 4, 2) * 14 + row * 2);
    const gap = (y % 32) < 2 ? 0.45 : 1;
    const jx = U.hash(row, 7) * w; const joint = Math.abs(((x - jx) % w + w) % w) < 2 ? 0.5 : 1;
    const v = rs * grain * gap * joint * 245;
    return [v, v * 0.97, v * 0.93];
  };
  T.wood = U.tex(U.pix(256, (x, y, w) => plank(x, y, w, false)));
  T.woodV = U.tex(U.pix(256, (x, y, w) => plank(x, y, w, true)));
  T.roof = U.tex(U.pix(256, (x, y, w) => {
    const row = Math.floor(y / 32), off = (row % 2) * 24, col = Math.floor((x + off) / 48);
    const ts = 0.78 + 0.22 * U.hash(col, row), yy = y % 32;
    let v = ts * (1 - 0.35 * Math.pow(yy / 32, 3));
    if ((x + off) % 48 < 2 || yy > 29) v *= 0.55;
    v *= 0.92 + (R() - 0.5) * 0.1;
    return [v * 250, v * 250, v * 250];
  }));
  T.brick = U.tex(U.pix(256, (x, y, w) => {
    const row = Math.floor(y / 21), off = (row % 2) * 26, col = Math.floor((x + off) / 52);
    const mortar = (y % 21) < 3 || ((x + off) % 52) < 3;
    if (mortar) { const v = 200 + R() * 20; return [v, v * 0.97, v * 0.92]; }
    const s = 0.8 + 0.2 * U.hash(col, row) + (R() - 0.5) * 0.08;
    return [168 * s, 82 * s, 60 * s];
  }));
  T.stone = U.tex(U.canvas(256, 256, (g, w, h) => {
    g.fillStyle = '#6f6a63'; g.fillRect(0, 0, w, h);
    for (let yy = 0; yy < 8; yy++) for (let xx = 0; xx < 8; xx++) {
      const x = xx * 32 + (yy % 2) * 16 + (R() - 0.5) * 6, y = yy * 32 + (R() - 0.5) * 6;
      const v = 150 + R() * 70;
      g.fillStyle = `rgb(${v},${v * 0.97},${v * 0.92})`;
      U.roundRect(g, x + 2, y + 2, 28 + R() * 4, 27 + R() * 4, 9); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.12)'; U.roundRect(g, x + 5, y + 4, 18, 8, 4); g.fill();
      if (x + 32 > w) { g.fillStyle = `rgb(${v},${v * 0.97},${v * 0.92})`; U.roundRect(g, x + 2 - w, y + 2, 28, 27, 9); g.fill(); }
    }
  }));
  T.plaster = U.tex(U.pix(256, (x, y, w) => { const v = (0.92 + (P(x, y, w, 16, 3) - 0.5) * 0.12 + (R() - 0.5) * 0.05) * 255; return [v, v, v]; }));
  {
    const c = U.pix(256, (x, y, w) => { const v = 66 + P(x, y, w, 32, 3) * 34 + (R() - 0.5) * 22; return [v, v, v * 1.03]; });
    const g = c.getContext('2d');
    g.fillStyle = '#e8c547'; for (let y = 0; y < 256; y += 128) g.fillRect(124, y, 8, 72);
    g.fillStyle = '#e9e6dc'; g.fillRect(8, 0, 5, 256); g.fillRect(243, 0, 5, 256);
    T.road = U.tex(c);
  }
  {
    const c = U.pix(256, (x, y, w) => { const n = P(x, y, w, 8, 4); const v = 0.8 + (n - 0.5) * 0.4 + (R() - 0.5) * 0.1; return [172 * v, 140 * v, 98 * v]; });
    speckle(c.getContext('2d'), 256, 256, 300, ['#7a5c3a', '#d6c09a', '#8a7a68'], 1, 3, 0.8);
    T.dirt = U.tex(c);
  }
  T.paving = U.tex(U.pix(256, (x, y, w) => {
    const gap = (x % 64) < 3 || (y % 64) < 3; const t = U.hash(Math.floor(x / 64), Math.floor(y / 64));
    const v = gap ? 150 : (205 + t * 30 + (R() - 0.5) * 14);
    return [v, v * 0.97, v * 0.93];
  }));
  {
    const c = U.canvas(256, 256, (g, w, h) => {
      g.fillStyle = '#fbfaf6'; g.fillRect(0, 0, w, h); g.fillStyle = '#1d1b1a';
      for (let i = 0; i < 10; i++) {
        const x = R() * w, y = R() * h, s = 14 + R() * 26;
        for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) {
          g.beginPath(); g.ellipse(x + dx, y + dy, s, s * (0.5 + R() * 0.4), R() * 3, 0, TAU); g.fill();
        }
      }
    });
    T.cow = U.tex(c);
  }
  T.melon = U.tex(U.pix(128, (x, y, w) => { const s = Math.sin(x / w * TAU * 8 + Math.sin(y / w * TAU * 2) * 1.2); return s > 0.15 ? [40, 92, 38] : [110, 168, 72]; }));
  T.pine = U.tex(U.pix(128, (x, y, w) => {
    const u = x / w * 8, v = y / w * 12;
    const d = Math.abs((u + v) % 1 - 0.5) + Math.abs(((u - v) % 1 + 1) % 1 - 0.5);
    const e = d < 0.12 ? 0.45 : 1; return [214 * e, 160 * e, 52 * e];
  }));
  T.metal = U.tex(U.pix(128, (x, y, w) => { const v = (0.8 + 0.15 * Math.sin(x / w * TAU * 12) + (R() - 0.5) * 0.05) * 230; return [v, v, v]; }));
  T.straw = U.tex(U.pix(128, (x, y, w) => { const v = 0.75 + 0.25 * U.noise2(x * 0.5, y * 0.03) + (R() - 0.5) * 0.15; return [236 * v, 200 * v, 110 * v]; }));
  T.stripes = U.tex(U.pix(128, (x, y, w) => (Math.floor(y / 16) % 2 ? [205, 52, 46] : [250, 248, 240])));
  T.blob = new THREE.CanvasTexture(U.canvas(64, 64, g => {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(0,0,0,0.5)'); gr.addColorStop(0.5, 'rgba(0,0,0,0.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  }));
  // soft halo for fake bloom around lights
  T.glow = new THREE.CanvasTexture(U.canvas(128, 128, g => {
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.12, 'rgba(255,255,255,0.75)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  }));
  T.foam = U.tex(U.canvas(256, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < 220; i++) {
      const x = Math.random() * w, y = h * 0.5 + (Math.random() - 0.5) * h * 0.7 * Math.random();
      g.fillStyle = `rgba(255,255,255,${0.25 + Math.random() * 0.5})`; g.beginPath(); g.ellipse(x, y, 3 + Math.random() * 9, 1.5 + Math.random() * 3, 0, 0, TAU); g.fill();
    }
  }), 1, 1);
  T.dot = new THREE.CanvasTexture(U.canvas(64, 64, g => {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  }));
  // tileable water normal map
  {
    const S = 256, waves = [[1, 2, 0.3], [3, -1, 1.7], [-2, 3, 2.5], [5, 4, 0.9], [-6, 2, 4.1], [7, -5, 3.3], [2, 9, 5.2]];
    const h = (x, y) => { let s = 0; for (const [a, b, p] of waves) s += Math.sin(TAU * (a * x + b * y) / S + p) / Math.hypot(a, b); return s; };
    const c = U.pix(S, (x, y) => {
      const dx = h(x + 1, y) - h(x - 1, y), dy = h(x, y + 1) - h(x, y - 1);
      const nx = -dx * 2.2, ny = -dy * 2.2, nz = 1, l = Math.hypot(nx, ny, nz);
      return [(nx / l * 0.5 + 0.5) * 255, (ny / l * 0.5 + 0.5) * 255, (nz / l * 0.5 + 0.5) * 255];
    });
    T.waterN = U.tex(c, 1, 1, false);
  }
  T.tile = U.tex(U.pix(256, (x, y, w) => { const gap = (x % 64) < 2 || (y % 64) < 2; const v = gap ? 175 : 245 + (R() - 0.5) * 8; return [v, v, v]; }));
  T.lighthouse = U.tex(U.pix(64, (x, y) => (Math.floor(y / 16) % 2 ? [200, 40, 40] : [245, 245, 240])));
  T.wallpaper = U.tex(U.canvas(256, 256, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.05)'; for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 10, h);
    g.fillStyle = 'rgba(255,255,255,0.6)';
    for (let y = 16; y < h; y += 64) for (let x = 21; x < w; x += 64) { g.beginPath(); g.arc(x, y, 4, 0, TAU); g.arc(x + 32, y + 32, 4, 0, TAU); g.fill(); }
  }));
};
