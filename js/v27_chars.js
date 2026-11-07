'use strict';
// ---------- v27: six creator characters modelled after the pictures in Desktop/image/game-character-images ----------
// Built on Models.toon (same rig, so every animation keeps working); each gets a few extra parts to match its picture.
V23.add('v27_chars', () => {
  const PICS = {
    pic1: { n: 'น้องส้ม (เสื้อลายส้ม)', fem: false, skin: 0xf6d3b8, hair: 'short', hairC: 0x4a2e22, eye: 0x2a1812, shirt: 0xf0a030, pants: 0x3f5f93, shoe: 0xa0603a, shorts: true, stripes: 0xf7ecd8 },
    pic2: { n: 'น้องฟ้า (เสื้อน้ำเงินขาว)', fem: false, skin: 0xf7d6bb, hair: 'side', hairC: 0x15161c, eye: 0x4a2a1a, shirt: 0x2f55c8, pants: 0x2c3f78, shoe: 0xf4f4f4, shorts: true, chest: 0xffffff },
    pic3: { n: 'น้องแก้ม (หมวกแดง ฮู้ดฟ้า)', fem: false, skin: 0xf6d3b8, hair: 'short', hairC: 0x3a2618, eye: 0x4a86b8, shirt: 0x2aa6e8, inner: 0xf2b94a, jacket: true, pants: 0xcfc8bd, shoe: 0xe03030, hat: 0xd83a3a },
    pic4: { n: 'น้องเมฆ (เสื้อฟ้า กางเกงคาร์โก้)', fem: false, skin: 0xf6d3b8, hair: 'short', hairC: 0x6b4a30, eye: 0x2a9ad8, shirt: 0x34c4f2, pants: 0xcdb48c, shoe: 0x2f4fc0 },
    pic5: { n: 'พิมพ์ใจ (แม่มดน้อย)', fem: true, skin: 0xf8d8c4, hair: 'long', hairC: 0xe8742c, eye: 0x2fa050, shirt: 0x4c3a60, skirt: 0xc86a86, pants: 0xf8d8c4, shoe: 0x1d1a20, witch: true, belt: 0x1a1a1a },
    pic6: { n: 'เทพธิดาหยก (ชุดเวทมนตร์)', fem: true, skin: 0xf6d6c2, hair: 'long', hairC: 0x8a5a36, eye: 0x4a2e1e, shirt: 0x2f8a96, skirt: 0xcfc4ee, pants: 0xf2f2f6, shoe: 0xd9b24a, lips: 0xd04a5a, belt: 0x2a3338, sorc: true },
  };
  Object.assign(TOONS, PICS);
  const gold = () => mc(0xe0b83c, { roughness: 0.3, metalness: 0.6 });
  const _toon = Models.toon;
  Models.toon = function (key) {
    const g = _toon(key), T_ = PICS[key]; if (!g || !T_) return g;
    const P = g.userData, U2 = P.upper.children[0], H = P.head.children[0];
    const shirtM = mc(T_.shirt, { roughness: 0.85 });
    if (T_.shorts) {   // short trousers: bare lower legs
      const skinM = mc(T_.skin, { roughness: 0.55 });
      for (const k of [P.knL, P.knR]) U.mk(k, capsule(0.062, 0.26), skinM, [0, -0.19, 0]);
    }
    if (T_.stripes) for (let i = 0; i < 5; i++) U.mk(U2, GEO.cyl, mc(T_.stripes), [0, 1.0 + i * 0.075, 0], [0.172 - Math.abs(i - 2) * 0.006, 0.022, 0.12]);
    if (T_.chest) U.mk(U2, GEO.cyl, mc(T_.chest), [0, 1.14, 0], [0.176, 0.19, 0.125]);
    if (T_.witch) {
      const dk = mc(0x2c2631, { roughness: 0.8 }), br = mc(0x7a3a4e, { roughness: 0.8 });
      U.mk(H, new THREE.CylinderGeometry(0.34, 0.34, 0.025, 28), br, [0, 0.14, 0]);
      U.mk(H, new THREE.CylinderGeometry(0.32, 0.32, 0.02, 28), dk, [0, 0.155, 0]);
      U.mk(H, new THREE.ConeGeometry(0.19, 0.5, 20), dk, [0, 0.4, -0.01]);
      U.mk(H, new THREE.CylinderGeometry(0.17, 0.2, 0.07, 20), br, [0, 0.2, -0.005]);
      U.mk(H, GEO.box, gold(), [0, 0.2, 0.19], [0.07, 0.06, 0.02]);
      for (let i = 0; i < 4; i++) U.mk(U2, GEO.cyl, mc(0x4c3a60), [0, 0.7 - i * 0.14, 0], [0.26 + i * 0.012, 0.045, 0.2]);   // dress stripes
      U.mk(U2, GEO.cyl, mc(0xf2de4a), [0, 1.5, 0.0], [0.07, 0.014, 0.07]);   // yellow collar
      const bro = new THREE.Group(); bro.position.set(0, -0.255, 0.01); P.elR.add(bro);   // broom in the right hand
      U.mk(bro, GEO.cyl, mc(0x8a5a2e), [0, -0.05, 0], [0.012, 0.9, 0.012]);
      U.mk(bro, new THREE.ConeGeometry(0.06, 0.28, 10), mc(0xc89a52, { roughness: 0.95 }), [0, -0.52, 0], 1, [Math.PI, 0, 0]);
      for (const k of [P.knL, P.knR]) for (const z of [0, 1]) U.mk(k, GEO.cyl, mc(0xf2de4a), [0, -0.36 - z * 0.04, 0.03], [0.066, 0.008, 0.066]);   // boot laces
    }
    if (T_.sorc) {
      const lav = new THREE.CylinderGeometry(0.17, 0.34, 0.92, 24, 1, true), m = mc(T_.skirt, { roughness: 0.7 }); m.side = THREE.DoubleSide;
      U.mk(U2, lav, m, [0, 0.52, 0], [1, 1, 0.85]);
      U.mk(U2, new THREE.CylinderGeometry(0.34, 0.345, 0.07, 24, 1, true), mc(0x3a63b0, { roughness: 0.7, side: THREE.DoubleSide }), [0, 0.1, 0], [1, 1, 0.85]);
      const tl = mc(0x2f8a96, { roughness: 0.8 }), gd = gold();
      for (const e of [P.elL, P.elR]) {   // wide hanging sleeves
        const sl = new THREE.CylinderGeometry(0.055, 0.15, 0.34, 14, 1, true); const sm = mc(0x2f8a96, { roughness: 0.8 }); sm.side = THREE.DoubleSide;
        U.mk(e, sl, sm, [0, -0.12, 0]); U.mk(e, GEO.cyl, gd, [0, -0.29, 0], [0.15, 0.012, 0.15]);
      }
      U.mk(U2, GEO.cyl, mc(0x2a3338), [0, 1.04, 0], [0.17, 0.09, 0.125]);
      // crown
      U.mk(H, new THREE.TorusGeometry(0.1, 0.014, 6, 18, Math.PI), gd, [0, 0.16, 0.06], 1, [Math.PI / 2 - 0.4, 0, 0]);
      U.mk(H, GEO.sph, mc(0x2fc26a, { roughness: 0.2 }), [0, 0.2, 0.12], [0.02, 0.03, 0.016]);
      for (const s of [-1, 1]) U.mk(H, GEO.sphLo, mc(0x38c0b8), [s * 0.12, -0.05, 0.1], [0.012, 0.04, 0.012]);
    }
    if (!T_.fem) g.scale.setScalar(0.9);
    return g;
  };

  // creator: image cards for these six
  window.CHAR_PICS = Object.keys(PICS);
  window.charCardHtml = (v, t, on) => {
    const k = v.slice(5);
    return `<button data-a="lkav" data-v="${v}" class="txt charcard ${on ? 'on' : ''}"><img src="assets/chars_pic/${k}.jpg" alt=""><span>${t}</span></button>`;
  };
  const st = document.createElement('style');
  st.textContent = '.charcards{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:6px 0 10px}.charcard{display:flex;flex-direction:column;align-items:center;gap:4px;padding:6px 4px;border-radius:12px;font-size:12px;line-height:1.2;text-align:center;white-space:normal}.charcard img{width:100%;max-width:84px;height:112px;object-fit:cover;object-position:top;border-radius:8px;background:#111}.charcard.on{outline:2px solid #ffd54a}';
  document.head.appendChild(st);
});
