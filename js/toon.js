'use strict';
// ---------- Stylized "toon" characters modelled after the reference pictures in Desktop/image ----------
// Each reuses the hand-built rig from Models.human (so walking, waving, harvesting all still animate)
// and swaps in a big round head with large eyes, blush, sculpted hair and outfit details.
const TOONS = {
  suit: { n: 'คุณวิทย์ (สูทแว่นกลม)', fem: false, skin: 0xf3d6bd, hair: 'side', hairC: 0x2a2a30, eye: 0x1c1c1c, glasses: true, shirt: 0x6e7278, inner: 0xf5f5f2, tie: 0x405d7e, pants: 0x5a5e64, shoe: 0x1e1e1e, longSleeve: true, jacket: true },
  tee: { n: 'น้องภูมิ (เสื้อยืดกรม)', fem: false, skin: 0xf3d6bd, hair: 'short', hairC: 0x1d1d22, eye: 0x1c1c1c, shirt: 0x2f3a4c, pants: 0x3a4456, shoe: 0x2a2a2a, badge: 0xd84343, watch: true },
  casual: { n: 'ไมค์ (ผมน้ำตาลตาฟ้า)', fem: false, skin: 0xf4c9ad, hair: 'wavy', hairC: 0x6e4a2f, eye: 0x3a8fd8, brows: 0x5a3a22, shirt: 0x1e1e20, pants: 0x2d2d33, shoe: 0x262626 },
  civil: { n: 'ครูแพรว (ชุดข้าราชการ)', fem: true, skin: 0xf5d8c0, hair: 'pony', hairC: 0x111114, eye: 0x4a2e1e, shirt: 0xc9ab82, skirt: 0xc9ab82, pants: 0xf5d8c0, shoe: 0x141414, boards: true, belt: 0xa47b3c, lips: 0xe0606a },
  chic: { n: 'ลิลลี่ (เสื้อดำกางเกงขาว)', fem: true, skin: 0xf7d9c8, hair: 'long', hairC: 0x3a2822, eye: 0x2c1a12, shirt: 0x1c1c1f, pants: 0xf2f2ef, shoe: 0xf2f2ef, longSleeve: true, choker: true, belt: 0x161616, lips: 0xe06a6a },
  jacket: { n: 'ดาวเรือง (แจ็กเก็ตดำ)', fem: true, skin: 0xd9a682, hair: 'bob', hairC: 0x18120f, eye: 0x2c1a12, shirt: 0x202024, inner: 0xf2efe6, pants: 0xd8c6a1, shoe: 0x8a5a36, jacket: true, longSleeve: true, watch: true, shades: true },
  skater: { n: 'น้องมายด์ (หมวกสเก็ตบอร์ด)', fem: true, skin: 0xf5d8c0, hair: 'bob', hairC: 0x4a2f22, eye: 0x3a2214, shirt: 0xffc94d, pants: 0x4a78b5, shoe: 0xf5f5f5, hat: 0xd94f4f, board: true },
};

Models.toon = function (key) {
  const T_ = TOONS[key]; if (!T_) return null;
  const g = Models.human({ skin: T_.skin, shirt: T_.shirt, pants: T_.pants, shoe: T_.shoe, hair: T_.hairC, skirt: T_.skirt ?? null, longSleeve: T_.longSleeve, overalls: null });
  const P = g.userData, head = P.head;
  // remove the old head parts and build the big toon head in their place
  while (head.children.length) head.remove(head.children[0]);
  const skin = mc(T_.skin, { roughness: 0.5 }), hairM = mc(T_.hairC, { roughness: 0.45 }), white = mc(0xffffff, { roughness: 0.2 }), dark = mc(0x101010, { roughness: 0.2 });
  const H = new THREE.Group(); H.position.y = 0.11; H.scale.setScalar(1.12); head.add(H);
  U.mk(H, GEO.sph, skin, [0, 0, 0], [0.205, 0.2, 0.19]);
  U.mk(H, GEO.sph, skin, [0, -0.075, 0.02], [0.17, 0.12, 0.16]);
  const eyes = new THREE.Group(); eyes.position.set(0, -0.005, 0); H.add(eyes); P.eyes = eyes;
  for (const s of [-1, 1]) {
    U.mk(H, GEO.sph, skin, [s * 0.195, -0.02, -0.01], [0.04, 0.055, 0.035]);
    U.mk(eyes, GEO.sph, white, [s * 0.068, 0, 0.165], [0.036, 0.03, 0.022]);
    U.mk(eyes, GEO.sph, mc(T_.eye, { roughness: 0.15 }), [s * 0.068, -0.002, 0.18], [0.022, 0.024, 0.01]);
    U.mk(eyes, GEO.sphLo, dark, [s * 0.068, -0.002, 0.186], [0.011, 0.012, 0.006]);
    U.mk(eyes, GEO.sphLo, white, [s * 0.062, 0.008, 0.19], 0.005);
    U.mk(eyes, GEO.box, mc(T_.skin, { roughness: 0.5 }), [s * 0.068, 0.026, 0.178], [0.075, 0.016, 0.02]);
    if (T_.fem) U.mk(eyes, GEO.box, dark, [s * 0.088, 0.035, 0.182], [0.03, 0.006, 0.006], [0, 0, -s * 0.5]);
    U.mk(H, GEO.box, mc(T_.brows ?? T_.hairC), [s * 0.072, 0.07, 0.172], [0.06, 0.012, 0.012], [0, 0, -s * 0.12]);
    U.mk(H, GEO.sphLo, mc(0xf29a9a, { roughness: 0.8 }), [s * 0.115, -0.065, 0.14], [0.04, 0.025, 0.012]);
  }
  U.mk(H, GEO.sph, mc(T_.skin, { roughness: 0.4 }), [0, -0.045, 0.19], [0.022, 0.02, 0.02]);
  const smile = U.mk(H, gcache('smile', () => new THREE.TorusGeometry(0.035, 0.006, 6, 14, Math.PI)), mc(T_.lips ?? 0xa34a42), [0, -0.095, 0.178]); smile.rotation.z = Math.PI;
  // hair
  const cap = gcache('toonCap', () => new THREE.SphereGeometry(1, 20, 12, 0, TAU, 0, Math.PI * 0.55));
  U.mk(H, cap, hairM, [0, 0.02, -0.01], [0.215, 0.215, 0.205], [-0.25, 0, 0]);
  if (T_.hair === 'side' || T_.hair === 'short') {
    for (let i = 0; i < 5; i++) U.mk(H, GEO.sph, hairM, [-0.13 + i * 0.07, 0.12 - Math.abs(i - 1.5) * 0.012, 0.13], [0.065, 0.05, 0.05], [0.4, 0, (T_.hair === 'side' ? 0.6 : 0.15) * (i - 2) * 0.3]);
    U.mk(H, GEO.sph, hairM, [0, 0.02, -0.06], [0.2, 0.19, 0.16]);
  }
  if (T_.hair === 'wavy') { for (let i = 0; i < 7; i++) { const a = -0.9 + i * 0.3; U.mk(H, GEO.sph, hairM, [Math.sin(a) * 0.17, 0.12 + Math.cos(a) * 0.04, Math.cos(a) * 0.08], [0.08, 0.06, 0.07]); } for (const s of [-1, 1]) U.mk(H, GEO.sph, hairM, [s * 0.19, 0.0, -0.04], [0.05, 0.11, 0.1]); U.mk(H, GEO.sph, hairM, [0, 0.0, -0.08], [0.2, 0.19, 0.15]); }
  if (T_.hair === 'long' || T_.hair === 'pony' || T_.hair === 'bob') {
    U.mk(H, GEO.sph, hairM, [0, 0.03, -0.06], [0.215, 0.2, 0.16]);
    for (const s of [-1, 1]) U.mk(H, GEO.sph, hairM, [s * 0.1, 0.13, 0.12], [0.11, 0.05, 0.06], [0.4, 0, -s * 0.5]);
    const len = T_.hair === 'bob' ? 0.2 : 0.42;
    U.mk(H, GEO.sph, hairM, [0, -0.08 - len * 0.3, -0.09], [0.2, 0.1 + len * 0.55, 0.11]);
    for (const s of [-1, 1]) U.mk(H, GEO.sph, hairM, [s * 0.17, -0.06 - len * 0.25, -0.01], [0.055, 0.08 + len * 0.45, 0.07]);
    if (T_.hair === 'pony') { U.mk(H, GEO.sph, hairM, [0, 0.2, -0.12], [0.08, 0.08, 0.08]); U.mk(H, capsule(0.055, 0.2), hairM, [0, 0.12, -0.21], 1, [0.5, 0, 0]); const bow = mc(0x111111, { roughness: 0.4 }); for (const s of [-1, 1]) U.mk(H, GEO.sph, bow, [s * 0.05, 0.22, -0.17], [0.05, 0.03, 0.02], [0, 0, s * 0.4]); }
  }
  if (T_.glasses) { const gm = mc(0x2a2a2a, { roughness: 0.3, metalness: 0.3 }), ring = gcache('toonLens', () => new THREE.TorusGeometry(0.055, 0.009, 8, 22)); for (const s of [-1, 1]) U.mk(H, ring, gm, [s * 0.07, -0.002, 0.2]); U.mk(H, GEO.box, gm, [0, 0.0, 0.205], [0.035, 0.008, 0.008]); for (const s of [-1, 1]) U.mk(H, GEO.box, gm, [s * 0.16, 0.0, 0.1], [0.008, 0.008, 0.2]); }
  if (T_.hat) { const hm = mc(T_.hat, { roughness: 0.8 }); U.mk(H, cap, hm, [0, 0.05, -0.01], [0.225, 0.2, 0.215], [-0.15, 0, 0]); U.mk(H, GEO.cyl, hm, [0, 0.07, 0.01], [0.27, 0.012, 0.27]); }
  // outfit details on the torso (U2 = first child chain of upper)
  const U2 = P.upper.children[0];
  if (T_.jacket) { const jm = mc(T_.shirt, { roughness: 0.75 }), im = mc(T_.inner ?? 0xffffff); U.mk(U2, GEO.box, im, [0, 1.3, 0.118], [0.1, 0.24, 0.01]); for (const s of [-1, 1]) U.mk(U2, GEO.box, jm, [s * 0.06, 1.33, 0.122], [0.05, 0.2, 0.012], [0, 0, s * 0.35]); }
  if (T_.tie) U.mk(U2, GEO.box, mc(T_.tie), [0, 1.28, 0.126], [0.035, 0.2, 0.01]);
  if (T_.badge) U.mk(U2, GEO.cyl, mc(T_.badge), [0.07, 1.36, 0.115], [0.028, 0.006, 0.028], [Math.PI / 2, 0, 0]);
  if (T_.boards) for (const s of [-1, 1]) U.mk(U2, GEO.box, mc(0x8a6a3a), [s * 0.15, 1.47, 0], [0.07, 0.01, 0.1]);
  if (T_.belt) U.mk(U2, GEO.cyl, mc(T_.belt), [0, 1.0, 0], [0.165, 0.03, 0.12]);
  if (T_.choker) U.mk(U2, GEO.cyl, mc(0x111111), [0, 1.55, 0], [0.058, 0.015, 0.058]);
  if (T_.shades) for (const s of [-1, 1]) U.mk(U2, GEO.sphLo, mc(0x222222, { roughness: 0.1 }), [s * 0.025, 1.33, 0.125], [0.022, 0.016, 0.006]);
  if (T_.watch) { U.mk(U2, GEO.cyl, mc(0x222222), [-0.22, 1.02, 0.02], [0.04, 0.025, 0.04]); }
  if (T_.board) { const b = new THREE.Group(); b.position.set(0.32, 0.3, -0.05); b.rotation.z = 1.35; g.add(b); U.mk(b, U.box(0.2, 0.02, 0.7, 1), mc(0x8e44ad), [0, 0, 0]); for (const z of [-0.25, 0.25]) for (const s of [-1, 1]) U.mk(b, GEO.cyl, mc(0xffffff), [s * 0.08, -0.03, z], [0.03, 0.03, 0.03], [0, 0, Math.PI / 2]); }
  g.scale.setScalar(0.96); g.userData.toon = key; g.userData.avName = 'toon:' + key;
  return Models.compact(shadowAll(g));
};

// cartoon puppy from the picture: cream fur, floppy tan ears, big shiny eyes, tongue out
const _dogProc = Models.dog;
Models.dog = function () {
  const g = _dogProc(), P = g.userData, head = P.head;
  while (head.children.length) head.remove(head.children[0]);
  const cream = mc(0xf3e2c4, { roughness: 0.85 }), tan = mc(0xd9a35f, { roughness: 0.85 }), dark = mc(0x1b1410, { roughness: 0.2 }), white = mc(0xffffff, { roughness: 0.1 });
  head.scale.setScalar(1.35); head.position.y += 0.05;
  U.mk(head, GEO.sph, cream, [0, 0, 0], [0.15, 0.14, 0.14]);
  U.mk(head, GEO.sph, cream, [0, -0.05, 0.1], [0.09, 0.07, 0.08]);
  for (const s of [-1, 1]) {
    U.mk(head, GEO.sph, tan, [s * 0.065, 0.03, 0.105], [0.05, 0.05, 0.03]);
    U.mk(head, GEO.sph, mc(0x3b2416, { roughness: 0.2 }), [s * 0.06, 0.03, 0.125], [0.034, 0.038, 0.02]);
    U.mk(head, GEO.sphLo, white, [s * 0.052, 0.045, 0.142], 0.01);
    U.mk(head, GEO.sph, tan, [s * 0.15, 0.02, -0.01], [0.05, 0.12, 0.08], [0, 0, s * 0.45]);
  }
  U.mk(head, GEO.sph, dark, [0, -0.02, 0.18], [0.035, 0.026, 0.022]);
  U.mk(head, GEO.sph, mc(0x7a2a2a), [0, -0.09, 0.14], [0.05, 0.025, 0.03]);
  U.mk(head, GEO.sph, mc(0xe8607a, { roughness: 0.5 }), [0, -0.115, 0.15], [0.03, 0.04, 0.012], [0.3, 0, 0]);
  const fur = mc(0xc8955a, { roughness: 0.9 }); g.traverse(o => { if (o.isMesh && o.material === fur) o.material = cream; });
  return g;
};

// make "toon:<key>" usable everywhere a character is created
const _humanAv = Models.human;
Models.human = function (o) {
  if (o && typeof o.avatar === 'string' && o.avatar.startsWith('toon:')) { const t = Models.toon(o.avatar.slice(5)); if (t) return t; }
  return _humanAv(o);
};
