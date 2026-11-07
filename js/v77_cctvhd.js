// v77_cctvhd.js: sharper CCTV pictures and a camera that copes with street lamps at night
//  1. resolution follows the camera model's megapixels (2 MP = 1920x1080, 4 MP = 2560x1440, 8 MP = 3840x2160) instead of one fixed 960x540,
//     so the picture holds 4x to 16x more pixels, plus a light sharpening pass and less sensor grain
//  2. night (infrared) picture: the old fixed gain (x2.6 + offset) turned any lamp-lit street into a white wall. The camera now meters the scene like a real one:
//     shadows are lifted, the exposure follows the average of the scene without the brightest 5 % (highlight compensation), and highlights roll off softly,
//     so a lamp post becomes a bright spot while the road, people and walls around it stay readable
V23.add('v77_cctvhd', () => {
  if (typeof CCTV === 'undefined' || !CCTV.shot || !CCTV.pose) return;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const MP = { cam_8k: 8, cam_d4: 4, cam_ptz: 4 };
  const sizeFor = d => {
    const mp = MP[d.k] || 2, lvl = G.Q && G.Q.lvl;
    let cap = (S && S.mobile) || lvl === 'low' ? 2 : lvl === 'med' ? 4 : 8;
    const m = Math.min(mp, cap), w = m >= 8 ? 3840 : m >= 4 ? 2560 : 1920;
    return [w, w * 9 / 16, m];
  };
  let fresh = false;
  { const r = G.renderer, _rp = r.readRenderTargetPixels.bind(r); r.readRenderTargetPixels = function (t) { if (t === CCTV.rt) fresh = true; return _rp.apply(r, arguments); }; }
  const _shot = CCTV.shot.bind(CCTV);
  const hist = new Uint32Array(256);
  let cost = 150, ae = 1, ex = 1, last = null, lastAt = 0, lastKey = '';
  CCTV.shot = function (d, w, h) {
    if (w) return _shot(d, w, h);                                           // thumbnails and alert snapshots keep their small size
    const [W, H, mp] = sizeFor(d), key = d.uid + ':' + W, nowMs = performance.now(), gap = clamp(cost * 3, 200, 1600);
    if (last && key === lastKey && nowMs - lastAt < gap) return last;       // big pictures refresh a few times a second, like a real stream
    // render exposure: the picture is 8 bit, so a lamp-lit street is already clipped to white before any processing can help. At night every light is scaled
    // for this render (auto exposure) until at most ~5 % of the picture is near white; the scale eases back up when the scene is dark again
    const night = G.night > 0.5; let img = null;
    for (let it = 0; it < (night ? 3 : 1); it++) {
      const lights = []; if (night && ex < 0.999) G.scene.traverse(o => { if (o.isLight) { lights.push([o, o.intensity]); o.intensity *= ex; } });
      fresh = false; try { img = _shot(d, W, H); } finally { for (const [o, v] of lights) o.intensity = v; }
      if (!night || !fresh || !this.buf || this.buf.length !== W * H * 4) break;
      let sat = 0, m = 0; const b0 = this.buf; for (let i = 0; i < b0.length; i += 4 * 29) { m++; if (b0[i] * 0.3 + b0[i + 1] * 0.59 + b0[i + 2] * 0.11 >= 232) sat++; }
      sat /= Math.max(1, m);
      if (sat > 0.05 && ex > 0.04) { ex = Math.max(0.04, ex * 0.5); continue; }
      if (sat < 0.012) ex = Math.min(1, ex * 1.2);
      break;
    }
    if (!night) ex = 1;
    if (!fresh || !this.buf || this.buf.length !== W * H * 4) return img;   // inside-house stub or anything that did not render: leave it
    const ir = G.night > 0.5, buf = this.buf, out = img.data;
    if (ir) {
      const o = CCTV.pose(d), gain = Math.pow(clamp(o.ir / Math.max(6, o.dist), 0.3, 1.15), 0.5);
      // metering: histogram of the raw luminance (sampled), then the mean without the top 5 %
      hist.fill(0); let n = 0;
      for (let i = 0; i < buf.length; i += 4 * 23) { const l = (buf[i] * 0.3 + buf[i + 1] * 0.59 + buf[i + 2] * 0.11) | 0; hist[l]++; n++; }
      // anchor the 90th percentile of the scene at ~58 % grey: dark scenes are lifted (up to x3.2), lamp-lit scenes are pulled down so the lit road keeps its texture
      let acc = 0, p90 = 255; for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= n * 0.9) { p90 = v; break; } }
      const t90 = Math.max(0.03, Math.pow(Math.max(4, p90) / 255, 0.62)), want = clamp(0.58 / t90, 0.3, 3.2) * gain;
      ae += (want - ae) * 0.5;                                             // the exposure eases in, no flicker
      const k = ae, ht = this.ht, nz = this.noise; let ni = (Math.random() * 8000) | 0;
      const lut = new Uint8Array(256);
      for (let v = 0; v < 256; v++) { let t = Math.pow(v / 255, 0.62) * k; t = t < 0.75 ? t : 0.75 + 0.25 * (1 - Math.exp(-(t - 0.75) / 0.25)); lut[v] = clamp(t * 255, 0, 255); }
      for (let row = 0; row < H; row++) {
        let s = (H - 1 - row) * W * 4, p = row * W * 4, vi = row * W;
        for (let x = 0; x < W; x++, s += 4, p += 4, vi++) {
          const l = (buf[s] * 0.3 + buf[s + 1] * 0.59 + buf[s + 2] * 0.11) | 0;
          let v = lut[l] * (0.82 + 0.18 * ht[vi]) + nz[(ni = (ni + 7) & 8191)] * 0.6;
          v = v < 0 ? 0 : v > 255 ? 255 : v; out[p] = out[p + 1] = out[p + 2] = v; out[p + 3] = 255;
        }
      }
    } else ae += (1 - ae) * 0.5;
    // light sharpening (the lens/sensor of a good camera): centre x1.9, four neighbours -0.225 each
    const rowB = W * 4, prev = new Uint8ClampedArray(rowB), cur = new Uint8ClampedArray(rowB);
    prev.set(out.subarray(0, rowB));
    for (let y = 1; y < H - 1; y++) {
      const o0 = y * rowB; cur.set(out.subarray(o0, o0 + rowB));
      for (let i = 4; i < rowB - 4; i++) { if ((i & 3) === 3) continue; out[o0 + i] = cur[i] * 1.9 - 0.225 * (prev[i] + out[o0 + rowB + i] + cur[i - 4] + cur[i + 4]); }
      prev.set(cur);
    }
    cost = performance.now() - nowMs; last = img; lastAt = performance.now(); lastKey = key; return img;
  };
  window.Cctv77 = { sizeFor };
});
