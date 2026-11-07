'use strict';
// ---------- v184_villageshops: the shops that stood as booths in the big city get proper shopfronts along the village main road ----------
//  After the shop merge (v179) and the five-town change (v99) some village shops only had a booth in the "service plaza" of the big city. Seven of them now have a real building
//  in the free lawn frontage of the village main road: three on the east side (EV centre, car dealer "ทุ่งทองมอเตอร์", supercars) and four on the west side
//  (seafood, café & bar, floating market & walking street, luxury furniture). Each stands on the same line as the existing IT row (front face about 7.5 m from the road),
//  keeps a gap to its neighbours and to the fences, and leaves a free corridor to the mall door. Nothing is saved: the buildings are made from code every start (old saves and new saves alike).
V23.add('v184_villageshops', () => {
  // v99 builds its list when it runs (it can run after this file): wait for it
  let tries = 0; const iv = setInterval(() => { if (window.__v99VillageShops && typeof World !== 'undefined' && World.building) { clearInterval(iv); build(window.__v99VillageShops); } else if (++tries > 100) clearInterval(iv); }, 200);
  function build(list) {
  if (!list.length) return;
  const SLOTS = {   // shop id -> [side, z]   side +1 = east (door faces west to the road), -1 = west
    dealer2: [1, -82], supercar: [1, -94], evcenter: [1, -106],
    seafood: [-1, -86], citycafe: [-1, -98], floating: [-1, -110], lux: [-1, -122],
  };
  const STYLE = {
    dealer2: { wall: 0xe3f2fd, roof: 0xe0e0e0, bg: '#1565c0', flat: true, glass: true },
    supercar: { wall: 0x2b2f33, roof: 0x3a3f44, bg: '#b71c1c', flat: true, glass: true },
    evcenter: { wall: 0xe8f5e9, roof: 0xe0e0e0, bg: '#2e7d32', flat: true, glass: true },
    seafood: { wall: 0xe1f5fe, roof: 0x0277bd, bg: '#0277bd', awning: 0x29b6f6 },
    citycafe: { wall: 0xfce4ec, roof: 0xad1457, bg: '#ad1457', awning: 0xf06292 },
    lux: { wall: 0xf3e5f5, roof: 0x6a1b9a, bg: '#4a148c', awning: 0x8e24aa },
    floating: { wall: 0xfff3e0, roof: 0x6d4c41, bg: '#e65100', awning: 0xff9800, wood: true },
  };
  const VNAME = { dealer2: 'สุขใจมอเตอร์', supercar: 'ซุปเปอร์คาร์สุขใจ', evcenter: 'ศูนย์ EV & พลังงานสะอาด สุขใจ', seafood: 'ร้านซีฟู้ดสุขใจ', lux: 'บ้านสวยเฟอร์นิเจอร์' };   // the old names pointed at towns that are gone (the merged shops keep their merged names)
  const W = 10, D = 6.5, XF = 7.5;                 // width along the road, depth, front face distance from the road centre line
  // v191: the lawn beside the road is bumpy (a low berm about 12 m from the road line, up to 0.7 m): standing on the centre height lifted the road side of the shop on a plinth. Stand on the LOWEST ground under the footprint instead
  const lowY = (x, z, rot, w, d) => { let m = Infinity; for (let i = 0; i <= 4; i++) for (let j = 0; j <= 4; j++) { const q = l2w(x, z, rot, (i / 4 - 0.5) * w, (j / 4 - 0.5) * d); m = Math.min(m, World.groundY(q.x, q.z)); } return Number.isFinite(m) ? m : World.groundY(x, z); };
  const made = [];
  for (const p of list) {
    const slot = SLOTS[p.id], S0 = STYLE[p.id]; if (!slot || !S0) continue;
    const side = slot[0], z = slot[1], x = side * (XF + D / 2), rot = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    const name = VNAME[p.id] || (window.ShopMerge179 ? ShopMerge179.nameFor(p.id, (SHOPS[p.id] || {}).n || p.label) : (SHOPS[p.id] || {}).n) || p.label || p.id;
    try { if (SHOPS[p.id]) SHOPS[p.id].n = name; if (window.ShopMerge179) for (const m of ShopMerge179.M) if (m.host === p.id) for (const ab of m.abs) if (SHOPS[ab]) SHOPS[ab].n = name; } catch (e) { }
    const o = { w: W, d: D, h: S0.flat ? 4.8 : 4.2, rows: 1, flat: !!S0.flat, glassFront: !!S0.glass, roofH: S0.flat ? undefined : 2.4, wall: S0.wall, roof: S0.roof, sign: name.slice(0, 30), signStyle: { bg: S0.bg }, awning: S0.awning, winF: S0.flat ? undefined : [-2.6, 2.6], winS: [0], wallTex: S0.wood ? 'wood' : undefined, pots: !S0.flat, flowers: p.id === 'citycafe' };
    try {
      const b = World.building(o); b.position.set(x, lowY(x, z, rot, W, D), z); b.rotation.y = rot; World.outdoor.add(b);
      try { Col.box(x, z, W / 2 + 0.3, D / 2 + 0.3, rot, 'bld'); } catch (e) { }
      const dr = l2w(x, z, rot, 0, D / 2 + 1.7);
      p.x = dr.x; p.z = dr.z; p.r = 2.4; p.map = true; p.label = name; p.room = { kind: (typeof SHOP_ROOM !== 'undefined' && SHOP_ROOM[p.id]) || 'shop', shop: p.id, title: name };
      World.pois.push(p); made.push(p.id + '@' + Math.round(x * 10) / 10 + ',' + z);
    } catch (e) { console.warn('v184 shop', p.id, e); }
  }
  window.VillageShops184 = { made, SLOTS };
  }
});
