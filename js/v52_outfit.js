// v52_outfit.js: the main character can change every garment: shirt, trousers, hat, shoes, and the colour of each piece.
// The garments are modelled in 3D from primitives (no downloaded pictures), added on top of the base rig so they follow every animation.
(function () {
  const PAL = [0xc8433a, 0x3e7cc8, 0x4f9a4a, 0xf2c12e, 0xf0f0f0, 0x8e44ad, 0xf08aa0, 0x2d2d2d,
    0xe8782a, 0x2aa5a5, 0x7a4a2a, 0x9aa3ad, 0x1f3a6e, 0x7bc4e8, 0xb8d86b, 0x6e1f2e];
  const SHIRTS = [[0, 'เสื้อยืด'], [1, 'เสื้อแขนยาว'], [2, 'เสื้อกล้าม'], [3, 'ฮู้ดดี้'], [4, 'แจ็คเก็ต'], [5, 'โปโล']];
  const PANTS = [[0, 'กางเกงขายาว'], [1, 'กางเกงขาสั้น'], [2, 'กางเกงสามส่วน'], [3, 'กระโปรง']];
  const HATS = [[0, 'ไม่ใส่'], [1, 'หมวกฟาง'], [2, 'หมวกแก๊ป'], [3, 'หมวกบักเก็ต'], [4, 'หมวกไหมพรม'], [5, 'หมวกคาวบอย'], [6, 'หมวกกันแดด']];
  const SHOES = [[0, 'รองเท้าผ้าใบ'], [1, 'บูท'], [2, 'รองเท้าแตะ'], [3, 'เท้าเปล่า']];
  const LEGACY_HAT = [1, 2, 0];
  const shade = (hex, f) => { const r = Math.min(255, (hex >> 16 & 255) * f | 0), g = Math.min(255, (hex >> 8 & 255) * f | 0), b = Math.min(255, (hex & 255) * f | 0); return r << 16 | g << 8 | b; };
  const pick = (l, k, def) => (l[k] == null ? def : Math.max(0, +l[k] | 0));
  const hatOf = l => l.hatSt != null ? pick(l, 'hatSt', 0) : (LEGACY_HAT[l.hat | 0] ?? 0);

  // ---- options: the colours go straight into the base rig, the styles are drawn by dress() below ----
  const _lo = lookOpts;
  lookOpts = l => {
    const o = _lo(l);
    if (o.avatar) return o;
    const sh = pick(l, 'shirtSt', 0), ps = pick(l, 'pantsSt', 0), hs = hatOf(l), ss = pick(l, 'shoeSt', 0);
    if (l.shirtCol != null) o.shirt = PAL[l.shirtCol % PAL.length];
    if (l.pantsCol != null) { o.pants = PAL[l.pantsCol % PAL.length]; if (o.overalls != null) o.overalls = o.pants; }
    if (l.shoeCol != null) o.shoe = PAL[l.shoeCol % PAL.length];
    o.longSleeve = sh === 1 || sh === 3 || sh === 4; o.sleeveless = sh === 2;
    if (ps === 3) o.skirt = o.pants;
    const hatCol = l.hatCol != null ? PAL[l.hatCol % PAL.length] : null;
    o.hat = null;
    o.outfit = { sh, ps, hs, ss, hatCol: hatCol ?? (hs === 2 ? o.capColor : null), shirt: o.shirt, pants: o.pants, shoe: o.shoe, skin: o.skin };
    return o;
  };

  // ---- garments ----
  const G_ = {};
  const geo = (k, f) => G_[k] || (G_[k] = f());
  function dress(h, o) {
    const P = h.userData, f = o.outfit; if (!P || !P.head || !P.upper) return;
    const U2 = P.upper.children[0] || P.rig, head = P.head;
    const skin = mc(f.skin, { roughness: 0.55 }), tint = c => mc(c, { roughness: 0.85 });
    const add = (par, g, m, p, s, r) => { const x = U.mk(par, g, m, p, s, r); x.castShadow = true; return x; };
    // shirts
    const sm = tint(f.shirt), dk = tint(shade(f.shirt, 0.7)), lt = tint(shade(f.shirt, 1.25));
    if (f.sh === 3) {
      add(U2, GEO.sph, sm, [0, 1.5, -0.085], [0.13, 0.1, 0.09]);
      add(U2, GEO.box, dk, [0, 1.04, 0.121], [0.2, 0.08, 0.012]);
      for (const s of [-1, 1]) add(U2, GEO.box, lt, [s * 0.025, 1.43, 0.118], [0.008, 0.1, 0.008]);
    } else if (f.sh === 4) {
      add(U2, GEO.cyl, dk, [0, 1.47, 0], [0.078, 0.04, 0.068]);
      add(U2, GEO.box, lt, [0, 1.2, 0.121], [0.012, 0.5, 0.006]);
      for (const s of [-1, 1]) add(U2, GEO.box, dk, [s * 0.09, 1.05, 0.12], [0.07, 0.05, 0.012]);
    } else if (f.sh === 5) {
      for (const s of [-1, 1]) add(U2, GEO.box, dk, [s * 0.04, 1.46, 0.085], [0.05, 0.022, 0.012], [0.2, 0, -s * 0.5]);
      add(U2, GEO.box, lt, [0, 1.38, 0.12], [0.014, 0.12, 0.006]);
    }
    // trousers / skirt / shorts: skin shows where the leg is bare
    for (const s of [-1, 1]) {
      const hp = P[s < 0 ? 'legL' : 'legR'], kn = P[s < 0 ? 'knL' : 'knR']; if (!hp || !kn) continue;
      if (f.ps === 1) add(hp, capsule(0.074, 0.06), skin, [0, -0.35, 0]), add(kn, capsule(0.062, 0.3), skin, [0, -0.2, 0]);
      else if (f.ps === 2) add(kn, capsule(0.062, 0.08), skin, [0, -0.34, 0]);
      else if (f.ps === 3) add(hp, capsule(0.076, 0.3), skin, [0, -0.2, 0]), add(kn, capsule(0.062, 0.3), skin, [0, -0.2, 0]);
      // shoes
      const sh = tint(f.shoe);
      if (f.ss === 1) { add(kn, capsule(0.066, 0.08), sh, [0, -0.36, 0]); add(kn, GEO.cyl, mc(shade(f.shoe, 0.6), { roughness: 0.6 }), [0, -0.31, 0], [0.068, 0.02, 0.068]); }
      else if (f.ss === 2) { add(kn, GEO.sph, skin, [0, -0.43, 0.035], [0.066, 0.047, 0.112]); add(kn, GEO.box, sh, [0, -0.42, 0.06], [0.07, 0.012, 0.03]); add(kn, GEO.box, sh, [0, -0.415, -0.005], [0.07, 0.012, 0.02]); }
      else if (f.ss === 3) add(kn, GEO.sph, skin, [0, -0.43, 0.035], [0.067, 0.048, 0.113]);
      else if (f.ss === 0) add(kn, GEO.sph, mc(0xf2f2f2, { roughness: 0.6 }), [0, -0.441, 0.083], [0.05, 0.03, 0.05]);
    }
    // hats
    const hc = f.hatCol, hm = hc != null ? tint(hc) : null, cap = geo('haircap', () => new THREE.SphereGeometry(1, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.55));
    if (f.hs === 1) {
      const straw = (typeof texMat === 'function') ? texMat('straw', 0xffffff, { roughness: 0.9 }) : tint(0xd8b86a);
      add(head, geo('brim', () => new THREE.CylinderGeometry(0.29, 0.29, 0.012, 28)), straw, [0, 0.085, -0.005]);
      add(head, geo('crown', () => new THREE.CylinderGeometry(0.105, 0.128, 0.12, 22)), straw, [0, 0.14, -0.005]);
      add(head, geo('band', () => new THREE.CylinderGeometry(0.129, 0.129, 0.028, 22)), tint(hc ?? 0xb8322a), [0, 0.105, -0.005]);
    } else if (f.hs === 2) {
      add(head, cap, hm, [0, 0.03, -0.005], [0.132, 0.13, 0.138], [-0.12, 0, 0]);
      add(head, GEO.sphLo, hm, [0, 0.055, 0.13], [0.09, 0.012, 0.07]);
    } else if (f.hs === 3) {
      const m = tint(hc ?? 0x3e7cc8);
      add(head, GEO.cyl, m, [0, 0.07, -0.005], [0.205, 0.012, 0.205]);
      add(head, GEO.cyl, m, [0, 0.118, -0.005], [0.126, 0.1, 0.13]);
      add(head, GEO.sph, m, [0, 0.165, -0.005], [0.115, 0.03, 0.118]);
    } else if (f.hs === 4) {
      const m = tint(hc ?? 0xc8433a);
      add(head, cap, m, [0, 0.02, -0.005], [0.134, 0.15, 0.142], [-0.15, 0, 0]);
      add(head, GEO.cyl, tint(shade(hc ?? 0xc8433a, 0.75)), [0, 0.04, -0.012], [0.137, 0.035, 0.143]);
      add(head, GEO.sph, tint(0xf0f0f0), [0, 0.172, -0.03], 0.034);
    } else if (f.hs === 5) {
      const m = tint(hc ?? 0x7a4a2a);
      add(head, GEO.cyl, m, [0, 0.08, -0.005], [0.27, 0.012, 0.2]);
      add(head, GEO.cyl, m, [0, 0.145, -0.005], [0.112, 0.13, 0.122]);
      add(head, GEO.sph, m, [0, 0.21, -0.005], [0.112, 0.03, 0.122]);
      add(head, GEO.cyl, tint(shade(hc ?? 0x7a4a2a, 0.55)), [0, 0.1, -0.005], [0.123, 0.025, 0.133]);
    } else if (f.hs === 6) {
      const m = tint(hc ?? 0xf2c12e);
      add(head, GEO.cyl, m, [0, 0.07, -0.01], [0.134, 0.032, 0.14]);
      add(head, GEO.sphLo, m, [0, 0.062, 0.13], [0.1, 0.012, 0.07]);
    }
  }

  const _human = Models.human;
  Models.human = function (o) {
    const h = _human(o);
    if (o && o.outfit && !o.avatar) { try { dress(h, o); } catch (e) { console.warn('v52 dress', e); } }
    return h;
  };

  // ---- the dresser ----
  V23.add('v52_outfit', () => {
    const rows = (l, f, arr) => `<div class="sw small">${arr.map(([v, t]) => `<button data-a="lk" data-f="${f}" data-v="${v}" class="txt ${(l[f] | 0) === v && (l[f] != null || v === 0) ? 'on' : ''}">${t}</button>`).join('')}</div>`;
    const cols = (l, f) => `<div class="sw small">${PAL.map((c, i) => `<button data-a="lk" data-f="${f}" data-v="${i}" class="${l[f] === i ? 'on' : ''}" style="background:#${c.toString(16).padStart(6, '0')}" aria-label="${f} ${i + 1}"></button>`).join('')}</div>`;
    const _look = UI.look;
    UI.look = function (first) {
      _look.call(this, first);
      try {
        // the modal is redrawn after every pick: swap the old shirt / trousers / hat rows for the full wardrobe each time
        const c = this.cur, r0 = c.render;
        c.render = t => {
          const html = r0(t), l = S.look || DEFAULT_LOOK;
          if (l.avatar) return html;
          return html.replace(/<h5>เสื้อ<\/h5>[\s\S]*?(?=\s*<div class="row end"><button class="btn big" data-a="lookdone")/, () => wardrobe(l));
        };
        this.renderBody();
      } catch (e) { console.warn('v52 look', e); }
    };
    const wardrobe = l => {
      const ov = typeof LOOK !== 'undefined' && LOOK.ov ? `<h5>ชุด</h5>${rows(l, 'ov', LOOK.ov.map((v, i) => [i, v[1]]))}` : '';
      const hv = hatOf(l);
      return `<h5>เสื้อ</h5>${rows(l, 'shirtSt', SHIRTS)}<h5>สีเสื้อ</h5>${cols(l, 'shirtCol')}
        <h5>กางเกง / กระโปรง</h5>${rows(l, 'pantsSt', PANTS)}<h5>สีกางเกง</h5>${cols(l, 'pantsCol')}${ov}
        <h5>หมวก</h5><div class="sw small">${HATS.map(([v, t]) => `<button data-a="lk" data-f="hatSt" data-v="${v}" class="txt ${hv === v ? 'on' : ''}">${t}</button>`).join('')}</div>${hv ? `<h5>สีหมวก</h5>${cols(l, 'hatCol')}` : ''}
        <h5>รองเท้า</h5>${rows(l, 'shoeSt', SHOES)}<h5>สีรองเท้า</h5>${cols(l, 'shoeCol')}`;
    };
    // the modal is redrawn after each pick: keep the wardrobe in step
    const _lk = UI.H.lk;
    UI.H.lk = function (d) { _lk.call(this, d); try { if (d.f === 'hatSt' && S.look) S.look.hat = Math.min(2, S.look.hat | 0); rebuildPlayer(); } catch (e) { } };
    try { if (G.player && G.player.obj && S.look) rebuildPlayer(); } catch (e) { }
    window.V52 = { PAL, SHIRTS, PANTS, HATS, SHOES };
  });
})();
