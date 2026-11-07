'use strict';
// ---------- v29: nine characters modelled after the pictures in Desktop/image/game-characters-set-2 ----------
// 1) they are offered in the main character creator as image cards (next to the six from v27);
// 2) they replace every older NPC look (100Avatars models and the first-generation toons) for villagers, shop staff,
//    partners and the town pedestrians of v27_npc.js. A villager's look is chosen from a hash of the name, so it never changes.
// The player's own look is never remapped: an old save that uses Kate, Kyle ... still renders (the 100Avatars pack is then
// loaded on demand, instead of at every start for nobody).
(() => {
  const SET2 = {
    set2_1: { n: 'น้องกล้า (เสื้อแดง ยิ้มแป้น)', fem: false, kid: 0.8, skin: 0xf4c8a8, hair: 'wavy', hairC: 0x5a3a28, eye: 0x5a2a12, shirt: 0xe8452e, pants: 0x3a86c8, shoe: 0x6e6a72, shorts: true },
    set2_2: { n: 'ไรเดอร์ (แจ็กเก็ตแดง ฮู้ดฟ้า)', fem: false, skin: 0xf4c8a8, hair: 'short', hairC: 0x4a2a20, eye: 0x7a8a40, shirt: 0xd8381c, inner: 0x3a9a64, jacket: true, pants: 0x1f3a78, shoe: 0xd8381c, belt: 0xa83a2a, hood: 0x1fa0b0, gloves: 0xd8381c, boots: 0x6a3a22 },
    set2_3: { n: 'น้องใบบัว (เสื้อโค้ตน้ำตาล)', fem: true, skin: 0xf6d0b4, hair: 'bob', hairC: 0xd8b48a, eye: 0x2a9ad0, shirt: 0x8a3a28, inner: 0xf4f2ee, jacket: true, pants: 0x3a6da8, shoe: 0xb85a3a, belt: 0x8a8a8a, buns: 0xd8b48a, coatTail: 0x8a3a28, boots: 0xb85a3a },
    set2_4: { n: 'น้องมีน (เสื้อเชิ้ตฟ้า)', fem: true, skin: 0xf6d0b4, hair: 'long', hairC: 0x9a4a30, eye: 0x6a2a12, shirt: 0x4fd0d8, inner: 0xf2a030, jacket: true, pants: 0x4a6f9e, shoe: 0xe03a3a, capri: true },
    set2_5: { n: 'น้องใบเตย (ชุดเขียวสดใส)', fem: true, kid: 0.8, skin: 0xf6cdb0, hair: 'bob', hairC: 0x9a6a3e, eye: 0x58b82c, shirt: 0x8ad43c, pants: 0x4aa83e, shoe: 0x8ad43c, pigtails: 0x9a6a3e },
    set2_6: { n: 'น้องฟ้าใส (กระเป๋าสะพายม่วง)', fem: true, skin: 0xf6cdb0, hair: 'bob', hairC: 0x8a5a44, eye: 0x4a2412, shirt: 0xa8dcd8, pants: 0x4a5f90, shoe: 0xe8854a, capri: true, bag: 0x4a3a8a, emblem: 0xe8854a },
    set2_7: { n: 'น้องภู (โปโลฟ้า กางเกงขาสั้น)', fem: false, skin: 0xf4c8a8, hair: 'wavy', hairC: 0x7a5238, eye: 0x6a3a1a, shirt: 0x1e9be8, pants: 0xa8805a, shoe: 0xb8602e, shorts: true, bag: 0x8a4a2a, polo: true },
    set2_8: { n: 'น้องนที (เสื้อลายขาวฟ้า)', fem: false, skin: 0xf8d6bc, hair: 'short', hairC: 0x6a5240, eye: 0x6a3a1a, shirt: 0xf6f3ee, pants: 0x6a86b8, shoe: 0xf2efe8, shorts: true, stripes: 0xa8d4f0, belt: 0x7a4a2a },
    set2_9: { n: 'น้องเก่ง (ชุดช่างน้ำเงิน เป้น้ำตาล)', fem: false, kid: 0.8, skin: 0xf8d0b0, hair: 'side', hairC: 0xa8623a, eye: 0x5a2a12, shirt: 0xf2b81c, pants: 0x2f5f9a, shoe: 0x8a4a2a, shorts: true, bag: 0x8a4a2a, bib: 0x2f5f9a },
  };
  Object.assign(TOONS, SET2);
  const KEYS = Object.keys(SET2);

  // ---- tints: a villager keeps one look, but shirts, skin tones and hair differ so a crowd is not nine clones ----
  const SKIN = [null, 0xe9bb94, 0xd9a47c, 0xc58f66, 0xf6d3b8, 0xb98056];
  const HAIR = [null, 0x2a1a12, 0x1b120c, 0x3a2416, null, 0x1b120c];
  function tint(base, v) {
    const t = Object.assign({}, base), c = new THREE.Color(base.shirt); c.offsetHSL(0.07 * v, 0, v % 2 ? -0.03 : 0.02); t.shirt = c.getHex();
    if (!base.denim) { const p = new THREE.Color(base.pants); p.offsetHSL(0.05 * v, 0, 0); t.pants = p.getHex(); }
    if (SKIN[v]) t.skin = SKIN[v]; if (HAIR[v]) { t.hairC = HAIR[v]; t.eye = 0x2a1812; }
    return t;
  }

  // ---- the model: Models.toon already builds head, hair, outfit; here come the extras of each picture ----
  const _toon = Models.toon;
  let seq = 0;
  Models.toon = function (key) {
    const m = /^(set2_\d)(?:@([\d.]+))?(?:~(\d))?$/.exec(key || '');
    if (!m || !SET2[m[1]]) return _toon(key);
    const base = SET2[m[1]], v = +m[3] || 0, sc = +m[2] || 1, T_ = v ? tint(base, v) : base;
    const useKey = v ? m[1] + '_t' + (seq++) : m[1];
    if (v) TOONS[useKey] = T_;
    let g; try { g = _toon(useKey); } finally { if (v) delete TOONS[useKey]; }
    if (!g) return g;
    const P = g.userData, U2 = P.upper.children[0], H = P.head.children[0];
    const skinM = mc(T_.skin, { roughness: 0.55 }), shirtM = mc(T_.shirt, { roughness: 0.85 });
    if (T_.shorts || T_.capri) {   // short or cropped trousers: bare lower legs
      for (const k of [P.knL, P.knR]) U.mk(k, capsule(0.062, T_.capri ? 0.17 : 0.26), skinM, [0, T_.capri ? -0.24 : -0.19, 0]);
      for (const k of [P.knL, P.knR]) U.mk(k, GEO.cyl, mc(T_.pants, { roughness: 0.9 }), [0, T_.capri ? -0.05 : -0.04, 0], [0.072, 0.03, 0.072]);   // rolled cuff
    }
    if (T_.stripes) for (let i = 0; i < 4; i++) U.mk(U2, GEO.cyl, mc(T_.stripes), [0, 1.04 + i * 0.12, 0], [0.176 - Math.abs(i - 1.5) * 0.004, 0.05, 0.123]);
    if (T_.polo) { U.mk(U2, GEO.box, shirtM, [0, 1.46, 0.07], [0.12, 0.03, 0.06]); for (let i = 0; i < 2; i++) U.mk(U2, GEO.sphLo, mc(0xdddddd), [0, 1.4 - i * 0.04, 0.125], 0.008); }
    if (T_.bib) { U.mk(U2, GEO.cyl, mc(T_.bib, { roughness: 0.9 }), [0, 1.16, 0.0], [0.178, 0.34, 0.124]); U.mk(U2, GEO.box, mc(0x3a6fb0), [0, 1.2, 0.123], [0.1, 0.1, 0.01]); U.mk(U2, GEO.cyl, mc(0xf2b81c), [0, 1.5, 0.0], [0.06, 0.016, 0.06]); }
    if (T_.emblem) U.mk(U2, GEO.sph, mc(T_.emblem), [0, 1.2, 0.125], [0.05, 0.05, 0.008]);
    if (T_.bag) {
      const bg = mc(T_.bag, { roughness: 0.8 });
      U.mk(U2, GEO.box, bg, [0, 1.17, -0.16], [0.3, 0.38, 0.14]);
      for (const s of [-1, 1]) { U.mk(U2, GEO.box, bg, [s * 0.085, 1.28, 0.115], [0.03, 0.3, 0.012]); U.mk(U2, GEO.box, bg, [s * 0.085, 1.46, -0.02], [0.03, 0.012, 0.28]); }
    }
    if (T_.hood) U.mk(U2, GEO.sph, mc(T_.hood, { roughness: 0.9 }), [0, 1.5, -0.075], [0.15, 0.085, 0.1]);
    if (T_.gloves) for (const e of [P.elL, P.elR]) U.mk(e, GEO.sph, mc(T_.gloves, { roughness: 0.6 }), [0, -0.28, 0], [0.052, 0.058, 0.052]);
    if (T_.coatTail) U.mk(U2, GEO.cyl, mc(T_.coatTail, { roughness: 0.75 }), [0, 0.9, 0], [0.19, 0.2, 0.14]);
    if (T_.boots) for (const k of [P.knL, P.knR]) U.mk(k, GEO.cyl, mc(T_.boots, { roughness: 0.7 }), [0, -0.34, 0], [0.07, 0.1, 0.07]);
    if (T_.buns) for (const s of [-1, 1]) U.mk(H, GEO.sph, mc(T_.buns, { roughness: 0.5 }), [s * 0.2, -0.02, -0.03], [0.085, 0.085, 0.085]);
    if (T_.pigtails) for (const s of [-1, 1]) { U.mk(H, GEO.sph, mc(T_.pigtails, { roughness: 0.5 }), [s * 0.2, -0.04, -0.02], [0.07, 0.09, 0.075]); U.mk(H, GEO.sph, mc(T_.pigtails, { roughness: 0.5 }), [s * 0.21, -0.13, -0.02], [0.05, 0.08, 0.06]); }
    g.scale.setScalar((T_.kid || (T_.fem ? 0.95 : 0.93)) * sc);
    P.toon = m[1]; g.userData.avName = 'toon:' + key;
    return Models.compact(g);   // fold the extras above into the existing per-material meshes (fewer draw calls)
  };

  // ---- NPC looks: every older look becomes one of the nine ----
  const POOL = {
    kidM: [1, 9], kidF: [5],
    teenM: [7, 8, 2], teenF: [6, 3, 4],
    adultM: [2, 7, 8], adultF: [3, 4, 6],
  };
  const hash = s => { let h = 7; s = String(s); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };
  function look(name, fem, age, i = 0) {
    const h = hash(name) + i * 7, arr = POOL[(age < 13 ? 'kid' : age < 18 ? 'teen' : 'adult') + (fem ? 'F' : 'M')];
    const k = arr[h % arr.length], v = (h >> 3) % 6, sc = age < 13 ? 1 : 0.97 + ((h >> 6) % 7) * 0.012;
    return `toon:set2_${k}@${sc.toFixed(2)}~${v}`;
  }
  const AV_FEM = { Erika: 1, Kate: 1, Lydia: 1, Rose: 1, Olivia: 1, Jennifer: 1, Kyle: 0, Robert: 0 };
  const isOldToon = k => TOONS[k] && !SET2[k] && !(window.CHAR_PICS || []).includes(k);
  function remap(av) {
    if (av.startsWith('toon:')) { const k = av.slice(5); return isOldToon(k) ? look(av, !!TOONS[k].fem, 30) : null; }
    if (av in AV_FEM) return look(av, !!AV_FEM[av], av === 'Jennifer' ? 11 : 30);
    return null;
  }
  People.avatarFor = function (name, i) { const p = this.prof(name); return look(name, p.fem, p.age, 0); };

  // the player: never remapped. lookOpts() builds the player's options, so mark them there
  const _lo = lookOpts;
  lookOpts = l => { const o = _lo(l); o.player = true; return o; };
  let lazy = false;
  const _human = Models.human;
  Models.human = function (o) {
    if (o && typeof o.avatar === 'string') {
      if (!o.player) { const m = remap(o.avatar); if (m) o = Object.assign({}, o, { avatar: m }); }
      else if (o.avatar in AV_FEM && !Avatars.ok && !lazy && typeof Avatars.load === 'function') {   // old save: bring the pack in, then redraw the player
        lazy = true; Avatars.want = true;
        Avatars.load().then(() => { try { if (Avatars.ok && G.player && S.look && S.look.avatar in AV_FEM) rebuildPlayer(); } catch (e) { console.warn('v29 avatar', e); } });
      }
    }
    return _human(o);
  };

  window.V29 = { SET2, look, hash };
})();

V23.add('v29_set2', () => {
  const { look, hash } = window.V29;
  const KEYS = Object.keys(TOONS).filter(k => /^set2_\d$/.test(k));
  // ---- creator: image cards for these nine as well ----
  window.CHAR_PICS = (window.CHAR_PICS || []).concat(KEYS.filter(k => !(window.CHAR_PICS || []).includes(k)));
  const _card = window.charCardHtml;
  window.charCardHtml = (v, t, on) => {
    const m = /^toon:set2_(\d)$/.exec(v);
    if (!m) return _card ? _card(v, t, on) : '';
    return `<button data-a="lkav" data-v="${v}" class="txt charcard ${on ? 'on' : ''}"><img src="assets/chars_pic/s2_${m[1]}.jpg" alt=""><span>${t}</span></button>`;
  };

  // ---- town pedestrians (v27_npc.js): same roles, names, lines and props, drawn with the nine models ----
  const N = window.Npc27; if (!N) return;
  const tm = (c, o) => mc(c, o || { roughness: 0.8 });
  const PROPS = {
    rider: (P, U2, H) => {
      const hm = tm(0x1faa59, { roughness: 0.4 }), wh = tm(0xffffff, { roughness: 0.4 });
      U.mk(H, gcache('v29helm', () => new THREE.SphereGeometry(1, 18, 10, 0, TAU, 0, Math.PI * 0.62)), hm, [0, 0.03, -0.005], [0.235, 0.215, 0.23]);
      U.mk(H, GEO.box, wh, [0, 0.2, 0], [0.07, 0.012, 0.32]);
      U.mk(H, GEO.box, tm(0x111111, { roughness: 0.2 }), [0, 0.06, 0.2], [0.34, 0.07, 0.014]);
      U.mk(U2, GEO.box, hm, [0, 1.22, -0.27], [0.46, 0.46, 0.4]); U.mk(U2, GEO.box, wh, [0, 1.46, -0.27], [0.48, 0.03, 0.42]); U.mk(U2, GEO.box, wh, [0, 1.22, -0.475], [0.26, 0.2, 0.01]);
    },
    student: (P, U2, H, R) => {
      const bag = tm([0x1565c0, 0xc62828, 0x2e7d32, 0x6a1b9a][(R() * 4) | 0]);
      U.mk(U2, GEO.box, bag, [0, 1.2, -0.2], [0.34, 0.42, 0.18]); U.mk(U2, GEO.box, bag, [0, 1.1, -0.31], [0.24, 0.16, 0.06]);
      for (const s of [-1, 1]) U.mk(U2, GEO.box, bag, [s * 0.1, 1.3, -0.02], [0.04, 0.3, 0.2]);
    },
    office: (P, U2, H, R) => {
      U.mk(U2, GEO.box, tm(0x1565c0, { roughness: 0.5 }), [0, 1.24, 0.122], [0.035, 0.2, 0.01]);
      U.mk(U2, GEO.box, tm(0xffffff), [0, 1.12, 0.126], [0.07, 0.09, 0.008]); U.mk(U2, GEO.box, tm(0x1565c0), [0, 1.155, 0.13], [0.07, 0.02, 0.004]);
      U.mk(U2, GEO.box, tm(0x4e342e, { roughness: 0.6 }), [0.27, 0.78, 0.04], [0.06, 0.3, 0.38]);
      if (R() < 0.4) { const gm = tm(0x2a2a2a, { roughness: 0.3 }), ring = gcache('v29lens', () => new THREE.TorusGeometry(0.06, 0.01, 8, 20)); for (const s of [-1, 1]) U.mk(H, ring, gm, [s * 0.075, -0.005, 0.2]); U.mk(H, GEO.box, gm, [0, 0, 0.205], [0.06, 0.008, 0.008]); }
    },
    vendor: (P, U2, H) => {
      const wood = tm(0x8d6e63, { roughness: 0.9 }), straw = tm(0xd9b45a, { roughness: 0.95 });
      U.mk(U2, GEO.box, wood, [0, 1.0, 0.3], [0.5, 0.04, 0.34]);
      for (const [x, c] of [[-0.15, 0xe53935], [0, 0xffb300], [0.15, 0x7cb342]]) U.mk(U2, GEO.sph, tm(c, { roughness: 0.6 }), [x, 1.07, 0.3], 0.07);
      for (const s of [-1, 1]) U.mk(U2, GEO.box, wood, [s * 0.1, 1.28, 0.18], [0.03, 0.55, 0.22], [0.5, 0, 0]);
      U.mk(H, GEO.cyl, straw, [0, 0.19, 0], [0.34, 0.012, 0.34]); U.mk(H, GEO.sph, straw, [0, 0.2, 0], [0.19, 0.12, 0.19]);
      U.mk(U2, GEO.box, tm(0xfff8e1), [0, 1.07, 0.125], [0.2, 0.34, 0.012]);   // apron
    },
    tourist: (P, U2, H, R) => {
      const bag = tm(0x455a64);
      U.mk(U2, GEO.box, bag, [0, 1.2, -0.2], [0.36, 0.46, 0.2]); U.mk(U2, GEO.box, tm(0x111111, { roughness: 0.5 }), [0, 1.07, 0.15], [0.14, 0.09, 0.07]);
      U.mk(U2, GEO.cyl, tm(0x222222), [0, 1.07, 0.21], [0.03, 0.05, 0.03], [Math.PI / 2, 0, 0]); U.mk(U2, GEO.box, tm(0x222222), [0, 1.3, 0.12], [0.02, 0.4, 0.01]);
      const cap = tm([0xf5f5f5, 0xe53935, 0x1e88e5][(R() * 3) | 0]);
      U.mk(H, gcache('v29cap', () => new THREE.SphereGeometry(1, 16, 9, 0, TAU, 0, Math.PI * 0.55)), cap, [0, 0.07, -0.01], [0.225, 0.2, 0.215]); U.mk(H, GEO.box, cap, [0, 0.1, 0.2], [0.22, 0.016, 0.14], [-0.12, 0, 0]);
      U.mk(H, GEO.box, tm(0x0a0a0a, { roughness: 0.15 }), [0, 0.0, 0.205], [0.3, 0.05, 0.014]);
    },
  };
  const AGE = { rider: [21, 34], student: [14, 22], office: [25, 45], vendor: [38, 62], tourist: [22, 58] };
  N.make = function (role, line) {
    const r = N.ROLES[role], R = Math.random, name = r.names[(R() * r.names.length) | 0], fem = r.fem.includes(name);
    const a = AGE[role] || r.age, age = a[0] + (hash(name) % (a[1] - a[0] + 1));
    People._p = People._p || {};
    const tk = Object.keys(TRAITS);
    People._p[name] = { fem, age, trait: tk[hash(name) % tk.length], job: r.job, single: false };
    const o = Models.human({ avatar: look(name, fem, age, (R() * 50) | 0) });
    const P = o.userData, U2 = P.upper.children[0];
    PROPS[role](P, U2, P.head.children[0] || P.head, R);
    o.scale.multiplyScalar(0.97 + R() * 0.08); World.dyn.add(o);
    const zs = line[2] - line[1], z = line[1] + R() * zs;
    const n = { obj: o, name, rot: R() * TAU, speed: 0, timer: R() * 3, st: 'idle', wave: 0, line, x: line[0], z, tx: line[0], tz: z, role, npc27: true, townRes: true, pace: r.pace * (0.9 + R() * 0.2) };
    o.position.set(n.x, World.groundY(n.x, z), z);
    G.npcs.push(n);
    return n;
  };
});
