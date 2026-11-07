'use strict';
// ---------- v30: ten more NPC-only characters (same toon rig as the main characters) ----------
// They are never offered in the character creator: they live in their own table (NPC10), and a look is only put into TOONS
// for the instant it is built. The creator lists Object.keys(TOONS), so it never sees them.
// Villagers, shop staff and city people pick them from a hash of the name (about 4 in 10), or by their job / name when it fits:
// ยาย/ตา/ลุง, หมอ, เชฟ, ช่าง, ครู, แม่ค้า. The player's own look is never touched.
(() => {
  const NPC10 = {
    npc10_1: { n: 'ยายชาวสวน (หมวกสาน)', fem: true, skin: 0xe2bc9a, hair: 'bob', hairC: 0xe6e6e6, eye: 0x3a2a1a, shirt: 0x9a5a86, skirt: 0x2d5a68, pants: 0xe2bc9a, shoe: 0x5a4030, longSleeve: true, scale: 0.9, fixedSkin: true },
    npc10_2: { n: 'ลุงหนวดขาว (ม่อฮ่อม)', fem: false, skin: 0xd09a72, hair: 'short', hairC: 0xf0f0f0, brows: 0xe8e8e8, eye: 0x2a1a10, shirt: 0x1f3d73, pants: 0x1f3d73, shoe: 0x6a4a30, longSleeve: true, scale: 0.96, fixedSkin: true },
    npc10_3: { n: 'คุณหมอ (เสื้อกาวน์)', fem: true, skin: 0xf4d0b8, hair: 'pony', hairC: 0x2a1a14, eye: 0x3a2214, shirt: 0x3a9fb0, pants: 0x3a9fb0, shoe: 0xf4f4f4, fixed: true },
    npc10_4: { n: 'เชฟ (หมวกขาว)', fem: false, skin: 0xf0c8a0, hair: 'short', hairC: 0x2a1a10, eye: 0x2a1a10, shirt: 0xffffff, pants: 0x3a3a44, shoe: 0x1e1e1e, longSleeve: true, fixed: true, wide: 1.1 },
    npc10_5: { n: 'ช่างซ่อม (ชุดหมี หมวกนิรภัย)', fem: false, skin: 0xd8a87c, hair: 'short', hairC: 0x2a1a10, eye: 0x2a1a10, shirt: 0xe8892a, pants: 0x2d4a78, shoe: 0x4a3a2a, longSleeve: true, fixed: true },
    npc10_6: { n: 'วัยรุ่นฮิปฮอป (หูฟัง)', fem: false, skin: 0xc58f66, hair: 'short', hairC: 0x111111, eye: 0x1a1210, shirt: 0xf2c230, pants: 0x4a5a6a, shoe: 0xffffff, longSleeve: true, scale: 0.97 },
    npc10_7: { n: 'คุณครู (แว่น ถือหนังสือ)', fem: true, skin: 0xf4d0b8, hair: 'pony', hairC: 0x1a1210, eye: 0x3a2214, glasses: true, shirt: 0x8a2a3a, skirt: 0x2a3a58, pants: 0xf4d0b8, shoe: 0x222222, longSleeve: true },
    npc10_8: { n: 'แม่ค้า (ผ้าถุง ตะกร้า)', fem: true, skin: 0xd9a47c, hair: 'bob', hairC: 0x1a1210, eye: 0x2a1a10, shirt: 0xe86a8a, skirt: 0x2f7a5a, pants: 0xd9a47c, shoe: 0x6a4a30, scale: 0.94 },
    npc10_9: { n: 'นักปั่นจักรยาน (หมวกกันน็อก)', fem: false, skin: 0xe0aa80, hair: 'short', hairC: 0x2a1a10, eye: 0x2a1a10, shirt: 0xe83a30, pants: 0x1a1a1a, shoe: 0x1a1a1a, shorts: true, stripes: 0x111111 },
    npc10_10: { n: 'เด็กนักเรียน (กระเป๋าใบโต)', fem: true, kid: 0.72, skin: 0xf6d0b4, hair: 'bob', hairC: 0x2a1a12, eye: 0x3a2214, shirt: 0xffffff, skirt: 0x1e2f6a, pants: 0xf6d0b4, shoe: 0x222222, pigtails: 0x2a1a12 },
  };
  const SKIN = [null, 0xe9bb94, 0xd9a47c, 0xc58f66];
  const _toon = Models.toon;
  let seq = 0;
  const domeGeo = () => gcache('v30dome', () => new THREE.SphereGeometry(1, 16, 9, 0, TAU, 0, Math.PI * 0.55));
  const torusGeo = r => gcache('v30torus' + r, () => new THREE.TorusGeometry(r, 0.012, 6, 16));

  const EXTRA = {
    1: (T_, P, U2, H) => {   // straw hat, bun, scarf over the shoulder
      const st = mc(0xd8b45a, { roughness: 0.95 });
      U.mk(H, GEO.cyl, st, [0, 0.19, 0], [0.37, 0.012, 0.37]); U.mk(H, domeGeo(), st, [0, 0.14, -0.005], [0.2, 0.17, 0.2]);
      U.mk(H, GEO.cyl, mc(0xb23a30), [0, 0.215, 0], [0.205, 0.02, 0.205]);
      U.mk(H, GEO.sph, mc(0xe6e6e6, { roughness: 0.6 }), [0, 0.02, -0.2], [0.07, 0.07, 0.07]);
      U.mk(U2, GEO.box, mc(0x7a2a5a), [0.15, 1.5, 0.0], [0.1, 0.035, 0.2]);
    },
    2: (T_, P, U2, H) => {   // white moustache, red checked waist cloth and shoulder cloth
      const w = mc(0xf4f4f4, { roughness: 0.7 }), red = mc(0xc0392b, { roughness: 0.85 });
      for (const s of [-1, 1]) U.mk(H, GEO.sph, w, [s * 0.035, -0.078, 0.18], [0.05, 0.016, 0.016], [0, 0, -s * 0.25]);
      U.mk(U2, GEO.cyl, red, [0, 1.0, 0], [0.174, 0.055, 0.126]);
      U.mk(U2, GEO.box, red, [0.14, 1.5, 0.0], [0.1, 0.04, 0.2]); U.mk(U2, GEO.box, mc(0xffffff), [0.14, 1.521, 0.0], [0.1, 0.006, 0.05]);
    },
    3: (T_, P, U2, H) => {   // white coat, stethoscope
      const w = mc(0xfafafa, { roughness: 0.8 });
      U.mk(U2, GEO.cyl, w, [0, 1.13, 0], [0.19, 0.4, 0.135]); U.mk(U2, GEO.cyl, w, [0, 0.88, 0], [0.205, 0.17, 0.147]);
      for (const s of [-1, 1]) { U.mk(U2, GEO.box, w, [s * 0.07, 1.4, 0.125], [0.07, 0.17, 0.012], [0, 0, s * 0.35]); U.mk(P['el' + (s < 0 ? 'L' : 'R')], capsule(0.05, 0.2), w, [0, -0.12, 0]); }
      U.mk(U2, torusGeo(0.1), mc(0x2a2a2a), [0, 1.43, 0.03], 1, [Math.PI / 2, 0, 0]); U.mk(U2, GEO.sph, mc(0x9aa0a8, { metalness: 0.5, roughness: 0.3 }), [0.04, 1.22, 0.135], 0.022);
      U.mk(U2, GEO.box, mc(0x3a9fb0), [-0.07, 1.2, 0.132], [0.05, 0.03, 0.006]);
    },
    4: (T_, P, U2, H) => {   // tall chef hat, double-breasted buttons, apron, neckerchief
      const w = mc(0xffffff, { roughness: 0.8 });
      U.mk(H, GEO.cyl, w, [0, 0.21, 0], [0.17, 0.05, 0.17]); U.mk(H, GEO.cyl, w, [0, 0.31, 0], [0.15, 0.12, 0.15]);
      for (const [x, z] of [[0, 0], [0.09, 0.04], [-0.09, 0.04], [0, -0.08]]) U.mk(H, GEO.sph, w, [x, 0.44, z], [0.1, 0.09, 0.1]);
      const bk = mc(0x222222);
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) U.mk(U2, GEO.sphLo, bk, [s * 0.045, 1.38 - i * 0.1, 0.124], 0.011);
      U.mk(U2, GEO.box, mc(0x2f4f8a), [0, 1.02, 0.13], [0.22, 0.32, 0.012]);
      U.mk(U2, GEO.cyl, mc(0xd8381c), [0, 1.53, 0], [0.07, 0.022, 0.07]);
    },
    5: (T_, P, U2, H) => {   // bib overalls, hard hat, gloves, red toolbox
      const bib = mc(0x2d4a78, { roughness: 0.9 }), ye = mc(0xf2c81c, { roughness: 0.5 });
      U.mk(U2, GEO.cyl, bib, [0, 1.16, 0], [0.178, 0.34, 0.124]); U.mk(U2, GEO.box, mc(0x1c3358), [0, 1.2, 0.123], [0.1, 0.1, 0.01]);
      for (const s of [-1, 1]) U.mk(U2, GEO.box, bib, [s * 0.085, 1.4, 0.1], [0.03, 0.22, 0.012]);
      U.mk(H, domeGeo(), ye, [0, 0.06, -0.005], [0.235, 0.21, 0.225]); U.mk(H, GEO.box, ye, [0, 0.1, 0.2], [0.26, 0.016, 0.12], [-0.1, 0, 0]);
      U.mk(H, GEO.box, ye, [0, 0.25, 0], [0.04, 0.016, 0.3]);
      for (const e of [P.elL, P.elR]) U.mk(e, GEO.sph, mc(0x8a8a8a, { roughness: 0.7 }), [0, -0.28, 0], [0.052, 0.058, 0.052]);
      const tb = mc(0xd03a2a, { roughness: 0.5 }); U.mk(P.elR, GEO.box, tb, [0, -0.4, 0.03], [0.3, 0.17, 0.15]); U.mk(P.elR, GEO.box, tb, [0, -0.3, 0.03], [0.14, 0.02, 0.02]);
    },
    6: (T_, P, U2, H) => {   // backwards cap, headphones, chain, hood
      const cap = mc(0x1a1a1a, { roughness: 0.8 });
      U.mk(H, domeGeo(), cap, [0, 0.05, -0.01], [0.226, 0.2, 0.216]); U.mk(H, GEO.box, cap, [0, 0.08, -0.22], [0.22, 0.016, 0.13], [0.1, 0, 0]);
      U.mk(U2, torusGeo(0.1), mc(0x222222), [0, 1.5, 0.02], 1, [Math.PI / 2, 0, 0]);
      for (const s of [-1, 1]) U.mk(U2, GEO.cyl, mc(0xd8381c, { roughness: 0.4 }), [s * 0.1, 1.48, 0.04], [0.035, 0.03, 0.035], [0, 0, Math.PI / 2]);
      U.mk(U2, torusGeo(0.05), mc(0xe0b83c, { roughness: 0.3, metalness: 0.6 }), [0, 1.37, 0.115], 1, [0.3, 0, 0]);
      U.mk(U2, GEO.sph, mc(0xf2c230, { roughness: 0.9 }), [0, 1.5, -0.075], [0.15, 0.085, 0.1]);
    },
    7: (T_, P, U2, H) => {   // book in the hand, name tag, small scarf
      const cv = mc(0x2c5aa0, { roughness: 0.6 }), pg = cv;
      U.mk(P.elL, GEO.box, cv, [0, -0.34, 0.1], [0.2, 0.04, 0.27]); U.mk(P.elL, GEO.box, pg, [0, -0.325, 0.1], [0.18, 0.03, 0.25]);
      U.mk(U2, GEO.box, pg, [-0.07, 1.22, 0.128], [0.06, 0.03, 0.006]);
      U.mk(U2, GEO.cyl, cv, [0, 1.52, 0], [0.065, 0.02, 0.065]);
    },
    8: (T_, P, U2, H) => {   // head cloth, skirt border, basket, towel
      U.mk(H, domeGeo(), mc(0xe8c040, { roughness: 0.9 }), [0, 0.06, -0.015], [0.224, 0.19, 0.214]);
      U.mk(U2, GEO.cyl, mc(0xd4a82c, { roughness: 0.6 }), [0, 0.62, 0], [0.27, 0.03, 0.2]);
      const bk = mc(0xb8884a, { roughness: 0.95 });
      U.mk(P.elL, GEO.cyl, bk, [0, -0.33, 0.12], [0.13, 0.09, 0.13]);
      for (const [x, c] of [[-0.05, 0xe53935], [0.05, 0xffb300], [0, 0x7cb342]]) U.mk(P.elL, GEO.sph, mc(c, { roughness: 0.6 }), [x, -0.26, 0.12], 0.045);
      U.mk(U2, GEO.box, mc(0x6aa0d8), [0.14, 1.5, 0.0], [0.09, 0.03, 0.12]);
    },
    9: (T_, P, U2, H) => {   // helmet, sunglasses, bare legs, small hydration pack
      const hm = mc(0xf5f5f5, { roughness: 0.4 }), red = mc(0xe83a30, { roughness: 0.5 });
      U.mk(H, domeGeo(), hm, [0, 0.06, -0.01], [0.236, 0.2, 0.236]); U.mk(H, GEO.box, red, [0, 0.2, -0.01], [0.07, 0.012, 0.3]);
      for (const s of [-1, 1]) U.mk(H, GEO.box, red, [s * 0.1, 0.17, 0.06], [0.04, 0.012, 0.2], [0, 0, -s * 0.5]);
      U.mk(H, GEO.box, mc(0x0a0a0a, { roughness: 0.15 }), [0, 0.0, 0.205], [0.3, 0.05, 0.014]);
      const skinM = mc(T_.skin, { roughness: 0.55 });
      for (const k of [P.knL, P.knR]) U.mk(k, capsule(0.062, 0.25), skinM, [0, -0.19, 0]);
      U.mk(U2, GEO.box, mc(0x222222), [0, 1.25, -0.16], [0.2, 0.34, 0.12]);
    },
    10: (T_, P, U2, H) => {   // sailor collar, ribbon, pigtails, a big backpack
      const nv = mc(0x1e2f6a, { roughness: 0.8 }), bag = mc(0xc62828, { roughness: 0.8 });
      U.mk(U2, GEO.box, nv, [0, 1.46, 0.105], [0.24, 0.03, 0.1]); U.mk(U2, GEO.sph, mc(0xd8381c), [0, 1.44, 0.15], [0.04, 0.03, 0.02]);
      U.mk(U2, GEO.box, bag, [0, 1.17, -0.17], [0.34, 0.44, 0.17]); U.mk(U2, GEO.box, bag, [0, 1.06, -0.27], [0.24, 0.16, 0.05]);
      for (const s of [-1, 1]) { U.mk(U2, GEO.box, bag, [s * 0.09, 1.3, 0.1], [0.035, 0.26, 0.012]); U.mk(U2, GEO.box, bag, [s * 0.09, 1.46, -0.03], [0.035, 0.012, 0.26]); }
      for (const s of [-1, 1]) { const m = mc(T_.pigtails, { roughness: 0.5 }); U.mk(H, GEO.sph, m, [s * 0.2, -0.04, -0.02], [0.07, 0.09, 0.075]); U.mk(H, GEO.sph, m, [s * 0.21, -0.13, -0.02], [0.05, 0.08, 0.05]); U.mk(H, GEO.sph, mc(0xd8381c), [s * 0.2, 0.02, -0.02], 0.025); }
    },
  };

  Models.toon = function (key) {
    const m = /^npc10_(\d+)(?:@([\d.]+))?(?:~(\d))?$/.exec(key || '');
    if (!m || !NPC10['npc10_' + m[1]]) return _toon(key);
    const id = +m[1], base = NPC10['npc10_' + m[1]], v = +m[3] || 0, sc = +m[2] || 1, T_ = Object.assign({}, base);
    if (v) {
      if (!T_.fixedSkin && SKIN[v]) T_.skin = SKIN[v];
      if (!T_.fixed) { const c = new THREE.Color(T_.shirt); c.offsetHSL(0.06 * v, 0, v % 2 ? -0.03 : 0.02); T_.shirt = c.getHex(); }
    }
    const useKey = 'npc10_t' + (seq++); TOONS[useKey] = T_;
    let g; try { g = _toon(useKey); } finally { delete TOONS[useKey]; }
    if (!g) return g;
    const P = g.userData, U2 = P.upper.children[0], H = P.head.children[0];
    if (T_.stripes) for (let i = 0; i < 4; i++) U.mk(U2, GEO.cyl, mc(T_.stripes), [0, 1.04 + i * 0.12, 0], [0.176 - Math.abs(i - 1.5) * 0.004, 0.05, 0.123]);
    EXTRA[id](T_, P, U2, H);
    const s = (T_.kid || T_.scale || 0.96) * sc;
    g.scale.set(s * (T_.wide || 1), s, s * (T_.wide || 1));
    P.toon = key; g.userData.avName = 'toon:' + key; g.userData.npc10 = id;
    return Models.compact(g);
  };

  // ---- who gets which look ----
  const hash = s => { let h = 7; s = String(s); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };
  const mk = (k, h) => `toon:npc10_${k}@${(0.97 + ((h >> 6) % 7) * 0.01).toFixed(2)}~${(h >> 3) % 4}`;
  function pick(name, p) {
    const h = hash('v30' + name), s = String(name), j = s + (p.job || '');
    if (p.age < 13) return p.fem && h % 2 ? mk(10, h) : 0;
    if (p.age < 18) return 0;
    if (/^ยาย/.test(s) || (p.fem && p.age >= 60)) return mk(1, h);
    if (/^(ตา|ลุง)/.test(s) || (!p.fem && p.age >= 60)) return mk(2, h);
    if (p.fem && /หมอ|พยาบาล|แพทย์|คลินิก|โรงพยาบาล/.test(j)) return mk(3, h);
    if (!p.fem && /เชฟ|กุ๊ก|ครัว|ร้านอาหาร|ภัตตาคาร|พ่อครัว/.test(j)) return mk(4, h);
    if (!p.fem && /ช่าง|อู่|ซ่อม/.test(j)) return mk(5, h);
    if (p.fem && /ครู|อาจารย์/.test(j)) return mk(7, h);
    if (p.fem && /แม่ค้า|ตลาด|ขายของ|พ่อค้า/.test(j)) return mk(8, h);
    if (h % 10 >= 4) return 0;   // the other six in ten keep the set-2 looks
    const q = (h >> 5) % 3;
    if (p.fem) return mk([3, 7, 8][q], h);
    return mk(p.age < 26 ? [6, 6, 9][q] : [4, 5, 9][q], h);
  }
  const _for = People.avatarFor;
  People.avatarFor = function (name, i) {
    const base = _for.call(this, name, i), k = pick(name, this.prof(name));
    return k || base;
  };

  window.V30 = { NPC10, pick, hash, mk };
})();

V23.add('v30_npc10', () => {
  // a line-up for checking the ten looks in front of the player (console: V30.lineup())
  window.V30.lineup = function () {
    const P = G.player.pos, out = [];
    for (let i = 1; i <= 10; i++) {
      const o = Models.human({ avatar: `toon:npc10_${i}` }); World.dyn.add(o);
      o.position.set(P.x - 5.4 + (i - 1) * 1.2, World.groundY(P.x, P.z), P.z + 4); o.rotation.y = Math.PI; out.push(o);
    }
    window.V30.lined = out; return out.length;
  };
  window.V30.clear = () => { for (const o of window.V30.lined || []) World.dyn.remove(o); window.V30.lined = []; };
  window.V30.meshes = () => { const r = {}; for (let i = 1; i <= 10; i++) { const o = Models.human({ avatar: `toon:npc10_${i}` }); let n = 0; o.traverse(c => { if (c.isMesh || c.isSkinnedMesh) n++; }); r[i] = n; } return r; };
});
