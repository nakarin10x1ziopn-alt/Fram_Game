'use strict';
// ---------- Downloaded CC0 assets: real PBR surfaces (Poly Haven) and glTF cars & houses (Kenney), all packed in assets_data.js ----------
const Assets = {
  img: {}, models: {}, ok: false,
  has(k) { return !!this.models[k]; },
  async load(progress) {
    if (typeof ASSET_DATA === 'undefined') return;
    const im = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
    await Promise.all(Object.keys(ASSET_DATA.tex).map(async k => { this.img[k] = await im(ASSET_DATA.tex[k]); }));
    if (THREE.GLTFLoader) {
      const loaders = {};
      for (const set of ['cars', 'suburban']) {
        const mg = new THREE.LoadingManager(); mg.setURLModifier(u => /colormap\.png$/.test(u) ? ASSET_DATA.cmap[set] : u);
        loaders[set] = new THREE.GLTFLoader(mg);
      }
      const keys = Object.keys(ASSET_DATA.glb); let done = 0;
      // a few at a time, and each base64 string is dropped as soon as it is decoded: iPhone Safari kills tabs that peak too high
      let next = 0;
      const worker = async () => { for (let k; (k = keys[next++]) !== undefined;) await one(k); };
      const one = async k => {
        const bin = Uint8Array.from(atob(ASSET_DATA.glb[k]), c => c.charCodeAt(0)).buffer; delete ASSET_DATA.glb[k];
        try {
          const g = await new Promise((res, rej) => loaders[k.startsWith('car:') ? 'cars' : 'suburban'].parse(bin, '', res, rej));
          g.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; if (o.material.map) o.material.map.anisotropy = 4; } });
          this.models[k] = g.scene;
        } catch (e) { console.warn('model', k, e); }
        if (progress && ++done % 6 === 0) progress(`กำลังโหลดโมเดลรถและบ้าน ${Math.round(done / keys.length * 100)}%`);
      };
      await Promise.all([worker(), worker(), worker(), worker()]);
    }
    this.ok = true;
  },
  // replaces the procedural wall, roof, road and dirt textures with real scanned surfaces (+ normal & roughness maps)
  applyTextures() {
    const I = this.img; if (!I.red_brick_diff) return;
    const mk = (src, srgb, fn) => {
      const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'); g.drawImage(src, 0, 0, 512, 512); if (fn) fn(g);
      const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (srgb) t.encoding = THREE.sRGBEncoding; return t;
    };
    // neutral grey copy so building colours still tint walls and roofs
    const grey = (lift) => g => {
      const d = g.getImageData(0, 0, 512, 512), a = d.data; let m = 0;
      for (let i = 0; i < a.length; i += 4) m += a[i] * 0.3 + a[i + 1] * 0.59 + a[i + 2] * 0.11;
      m /= a.length / 4; const k = lift / m;
      for (let i = 0; i < a.length; i += 4) { const v = Math.min(255, (a[i] * 0.3 + a[i + 1] * 0.59 + a[i + 2] * 0.11) * k); a[i] = a[i + 1] = a[i + 2] = v; }
      g.putImageData(d, 0, 0);
    };
    const set = (name, base, diffFn) => { T[name] = mk(I[base + '_diff'], true, diffFn); T[name + '_n'] = mk(I[base + '_nor_gl'], false); T[name + '_r'] = mk(I[base + '_rough'], false); };
    set('brick', 'red_brick');
    set('plaster', 'plastered_wall_04', grey(232));
    set('roof', 'roof_tiles_14', grey(215));
    set('dirt', 'forest_ground_04');
    // asphalt with the same lane paint as before
    set('road', 'aerial_asphalt_01', g => {
      g.fillStyle = 'rgba(40,40,44,0.35)'; g.fillRect(0, 0, 512, 512);
      g.fillStyle = '#e8c547'; for (let y = 0; y < 512; y += 256) g.fillRect(248, y, 16, 144);
      g.fillStyle = '#e9e6dc'; g.fillRect(16, 0, 10, 512); g.fillRect(486, 0, 10, 512);
    });
  },
  clone(k) { const m = this.models[k]; return m ? m.clone(true) : null; },
};

// Kenney car with the same interface as Models.car (wheels spin, front wheels steer, lights, glow)
Models.kcar = function (name) {
  const m = Assets.clone('car:' + name); if (!m) return null;
  const g = new THREE.Group(), S = 1.35; m.scale.setScalar(S); g.add(m);
  const wheels = [], steer = [];
  const nodes = []; m.traverse(o => { if (/^wheel-/.test(o.name)) nodes.push(o); });
  for (const w of nodes) {
    const piv = new THREE.Group(); piv.position.copy(w.position); w.parent.add(piv); piv.add(w); w.position.set(0, 0, 0);
    wheels.push(w); if (/front/.test(w.name)) steer.push(piv);
  }
  const box = new THREE.Box3().setFromObject(m); m.position.y = -box.min.y;
  const W = box.max.x - box.min.x, L = box.max.z - box.min.z, top = box.max.y - box.min.y;
  blobUnder(g, W / 2 + 0.2, L / 2 + 0.25);
  const lightM = U.mat(0xfff6d8, { emissive: 0xfff2c0 }), tailM = U.mat(0xb81d1d, { emissive: 0xff2020 });
  const glowM = new THREE.SpriteMaterial({ map: T.glow, color: 0xfff1c8, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  for (const sd of [-1, 1]) { const sp = new THREE.Sprite(glowM); sp.scale.setScalar(1.5); sp.position.set(sd * (W / 2 - 0.3), 0.75, box.max.z + 0.2); g.add(sp); }
  return { g, wheels, steer, lightM, tailM, r: 0.3 * S, glowM, top, L, W, kenney: true };
};
const _carProc = Models.car;
Models.car = function (type, color) {
  const C = CARS[type];
  if (C && C.k && Assets.has('car:' + C.k)) return Models.kcar(C.k);
  return _carProc(type, color);
};

// new cars for the showrooms, built from the Kenney Car Kit
Object.assign(CARS, {
  tractor: { n: 'รถไถฟาร์ม', i: '🚜', price: 6500, top: 14, acc: 6, k: 'tractor' },
  sedan: { n: 'ซีดานครอบครัว', i: '🚗', price: 12000, top: 32, acc: 11, k: 'sedan' },
  taxi: { n: 'แท็กซี่มือสอง', i: '🚕', price: 11000, top: 31, acc: 11, k: 'taxi' },
  van: { n: 'รถตู้ขนผัก', i: '🚐', price: 15000, top: 29, acc: 9, k: 'van' },
  hatch: { n: 'แฮทช์แบ็กสปอร์ต', i: '🚗', price: 17000, top: 37, acc: 14, k: 'hatchback-sports' },
  suv: { n: 'SUV ลุยทุกทาง', i: '🚙', price: 19000, top: 33, acc: 12, k: 'suv' },
  truck: { n: 'รถบรรทุกเล็ก', i: '🚚', price: 21000, top: 27, acc: 8, k: 'truck' },
  delivery: { n: 'รถส่งของ', i: '🚚', price: 18000, top: 28, acc: 9, k: 'delivery' },
  suvlux: { n: 'SUV หรู', i: '🚙', price: 34000, top: 39, acc: 15, k: 'suv-luxury' },
  sedansp: { n: 'ซีดานสปอร์ต', i: '🏎️', price: 38000, top: 47, acc: 18, k: 'sedan-sports' },
  race: { n: 'รถแข่งสนาม', i: '🏎️', price: 65000, top: 56, acc: 23, k: 'race' },
});
SHOPS.dealer.tabs = [
  { n: 'รถใช้งาน', items: ['car:oldtruck', 'car:pickup', 'car:tractor', 'car:van', 'car:truck', 'car:delivery'] },
  { n: 'รถเก๋ง & SUV', items: ['car:sedan', 'car:taxi', 'car:hatch', 'car:suv'] },
];
SHOPS.supercar.tabs = [{ n: 'รถหรู & สปอร์ต', items: ['car:suvlux', 'car:sedansp', 'car:sports', 'car:race'] }];

for (const [x, z] of [[-24, -84], [-24, -228], [25, -68], [-24, -144], [24, -82], [24, -100], [24, -120], [24, -140]]) FLAT_PADS.push({ x, z, r: 8 });
// small suburb of Kenney houses along the road between the farm and the village
World.buildSuburb = function () {
  if (!Assets.has('house:a')) return;
  const g = new THREE.Group(), types = ['a', 'b', 'c', 'd', 'f', 'g', 'j', 'l', 'n', 't'];
  const lots = [[-24, -84, 1], [-24, -228, 1], [25, -68, -1], [-24, -144, 1], [24, -82, -1], [24, -100, -1], [24, -120, -1], [24, -140, -1]];
  // nothing of a neighbour's lot (house, drive, tree, fence) may reach into the farm, whose fence runs x -72..72, z -58..62
  const inFarm = (x, z, m = 1.5) => x > -72 - m && x < 72 + m && z > -58 - m && z < 62 + m;
  lots.forEach(([x, z, s], i) => {
    const h = Assets.clone('house:' + types[i % types.length]); if (!h) return;
    h.scale.setScalar(7.2); const b = new THREE.Box3().setFromObject(h), w = b.max.x - b.min.x, d = b.max.z - b.min.z;
    const rot = s > 0 ? Math.PI / 2 : -Math.PI / 2, y = this.groundY(x, z);
    h.position.set(x, y - b.min.y * 0, z); h.rotation.y = rot; g.add(h);
    World.clearNear(x, z, Math.max(w, d) * 0.75, true);
    Col.box(x, z, w / 2, d / 2, rot, 'bld');
    const door = l2w(x, z, rot, 0, d / 2 + 1.5);
    (this.homes || (this.homes = [])).push({ x: door.x, z: door.z, zone: 'village' });
    const dw = Assets.clone('prop:driveway-long'); if (dw && !inFarm(x, z, 3)) { dw.scale.setScalar(7.2); const p = l2w(x, z, rot, w * 0.3, d / 2 + 3); dw.position.set(p.x, this.groundY(p.x, p.z) + 0.02, p.z); dw.rotation.y = rot; g.add(dw); }
    const tr = Assets.clone('prop:tree-large'); if (tr && !inFarm(...Object.values(l2w(x, z, rot, -w * 0.55, d / 2 + 2)).slice(0, 2))) { tr.scale.setScalar(5); const p = l2w(x, z, rot, -w * 0.55, d / 2 + 2); tr.position.set(p.x, this.groundY(p.x, p.z), p.z); g.add(tr); Col.circle(p.x, p.z, 0.5); }
    for (const sx of [-1, 1]) { const f = Assets.clone('prop:fence-1x3'); if (!f) continue; f.scale.setScalar(5); const p = l2w(x, z, rot, sx * (w / 2 + 1), d / 2 + 2.5); if (inFarm(p.x, p.z)) continue; f.position.set(p.x, this.groundY(p.x, p.z), p.z); f.rotation.y = rot; g.add(f); }
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.1), new THREE.MeshStandardMaterial({ map: U.signTex('หมู่บ้านจัดสรรสุขใจ', { w: 512, h: 128, bg: '#2f5d4a' }), roughness: 0.7 }));
  sign.position.set(-8, 2.4, -72); sign.rotation.y = Math.PI / 2; g.add(sign);
  for (const sz of [-1.9, 1.9]) U.mk(g, GEO.cylLo, M.darkwood, [-8, 1.2, -72 + sz], [0.08, 2.4, 0.08]);
  this.outdoor.add(g);
};
