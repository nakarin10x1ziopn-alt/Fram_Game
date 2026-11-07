'use strict';
// ---------- Set A: rice paddy, greenhouse, flower garden, fish farm, factory, pests, compost, farmhands, contracts, weekend market ----------
const NEW_ITEMS = {
  paddy: { n: 'ข้าวเปลือก', i: '🌾', sell: 60, cat: 'crop' }, rice: { n: 'ข้าวหอมมะลิ (ข้าวสาร)', i: '🍚', sell: 140, cat: 'product', en: 12 },
  seedling: { n: 'ต้นกล้าข้าว', i: '🌱', cat: 'tool' }, fingerling: { n: 'ลูกปลานิล', i: '🐟', cat: 'tool' }, fishfeed: { n: 'อาหารปลา', i: '🟤', cat: 'tool' },
  pesticide: { n: 'ยาฆ่าแมลงชีวภาพ', i: '🧴', cat: 'tool' }, ladybug: { n: 'เต่าทองกำจัดเพลี้ย', i: '🐞', cat: 'tool' }, compost: { n: 'ปุ๋ยหมัก', i: '🟫', cat: 'tool' },
  rose: { n: 'ดอกกุหลาบ', i: '🌹', sell: 45, cat: 'crop' }, jasmine: { n: 'ดอกมะลิ', i: '🤍', sell: 35, cat: 'crop' }, orchid: { n: 'ดอกกล้วยไม้', i: '🪻', sell: 90, cat: 'crop' },
  fseed_rose: { n: 'เมล็ดกุหลาบ', i: '🌹', cat: 'tool' }, fseed_jasmine: { n: 'กิ่งมะลิ', i: '🤍', cat: 'tool' }, fseed_orchid: { n: 'หน่อกล้วยไม้', i: '🪻', cat: 'tool' },
  chili_paste: { n: 'น้ำพริกเผา', i: '🫙', sell: 260, cat: 'artisan', en: 10 }, tomato_sauce: { n: 'ซอสมะเขือเทศ', i: '🥫', sell: 220, cat: 'artisan' },
  rice_cracker: { n: 'ข้าวตังหน้าตั้ง', i: '🍘', sell: 300, cat: 'artisan', en: 20 }, dried_mango: { n: 'มะม่วงอบแห้ง', i: '🥭', sell: 380, cat: 'artisan', en: 15 },
};
Object.assign(ITEMS, NEW_ITEMS);
Object.assign(TOOLS, {
  seedling: { n: 'ต้นกล้าข้าว (มัดละ 1 แปลงนา)', i: '🌱', price: 80, desc: 'ใช้ดำนาในแปลงนาที่ไถแล้ว' },
  fingerling: { n: 'ลูกปลานิล (ถุงละ 10 ตัว)', i: '🐟', price: 300, desc: 'ปล่อยในบ่อเลี้ยงปลา โต 3 วัน' },
  fishfeed: { n: 'อาหารปลา', i: '🟤', price: 25, desc: 'ให้ปลาในบ่อวันละ 1 ถุง ปลาโตทันเวลา' },
  pesticide: { n: 'ยาฆ่าแมลงชีวภาพ', i: '🧴', price: 70, desc: 'ฉีดกำจัดแมลงในแปลงทันที' },
  ladybug: { n: 'เต่าทองกำจัดเพลี้ย', i: '🐞', price: 150, desc: 'ปล่อยแล้วป้องกันแมลงทั้งไร่ 4 วัน (ศัตรูธรรมชาติ)' },
  fseed_rose: { n: 'เมล็ดกุหลาบ', i: '🌹', price: 30, desc: 'ปลูกในสวนดอกไม้ โต 1 วัน' }, fseed_jasmine: { n: 'กิ่งมะลิ', i: '🤍', price: 20, desc: 'ปลูกในสวนดอกไม้ โต 1 วัน' }, fseed_orchid: { n: 'หน่อกล้วยไม้', i: '🪻', price: 60, desc: 'ปลูกในสวนดอกไม้ โต 2 วัน' },
});
SHOPS.farmshop.tabs.push({ n: 'นาข้าว ประมง ดอกไม้', items: ['tool:seedling', 'tool:fingerling', 'tool:fishfeed', 'tool:pesticide', 'tool:ladybug', 'tool:fseed_rose', 'tool:fseed_jasmine', 'tool:fseed_orchid'] });
SHOPS.florist.tabs.push({ n: 'เมล็ดดอกไม้', items: ['tool:fseed_rose', 'tool:fseed_jasmine', 'tool:fseed_orchid'] });
RECIPES.ricebowl = { n: 'ข้าวหอมมะลิกับไข่เจียว', i: '🍚', need: { rice: 1, egg: 1 }, en: 45, sell: 260 };
ITEMS.dish_ricebowl = { n: RECIPES.ricebowl.n, i: RECIPES.ricebowl.i, sell: RECIPES.ricebowl.sell, en: RECIPES.ricebowl.en, cat: 'dish' };
const FACTORY = [
  { id: 'chili_paste', need: { chili: 5 }, h: 10 }, { id: 'tomato_sauce', need: { tomato: 4 }, h: 8 },
  { id: 'rice_cracker', need: { rice: 2 }, h: 12 }, { id: 'dried_mango', need: { mango: 3 }, h: 14 },
];
const GH_BX = i => -3.2 + (i % 3) * 3.2, GH_BZ = i => (i < 3 ? -1.6 : 1.6);   // plant bed spots inside a greenhouse (local)
const FLOWERS = { rose: 24, jasmine: 24, orchid: 48 };
const PADDY = { x: 58, z: -10 }, GH = { x: 58, z: 16 }, FACT = { x: 38, z: -50 }, COMPOST = { x: 21, z: -15 }, POND_POI = { x: 28.2, z: 20 }, FLOWER = { x: 44, z: 15 }, MARKET = { x: -38, z: -250 };

const Farm2 = {
  st() {
    if (!S.f2) S.f2 = { paddy: [0, 1, 2, 3].map(() => ({ s: 0, g: 0 })), gh: Array.from({ length: 6 }, () => ({ c: null, g: 0 })), fl: Array.from({ length: 6 }, () => ({ c: null, g: 0 })), pond: { n: 0, g: 0, fed: 0 }, fac: [], comp: [], hands: 0, contract: null, mstock: {}, pests: {}, lady: 0 };
    const f = S.f2; if (!f.ghp) f.ghp = { x: GH.x, z: GH.z, r: 0 }; if (!f.ghx) f.ghx = [];   // greenhouse 1 position, and up to 5 extra greenhouses (v67)
    return f;
  },
  init(scene) {
    this.scene = scene; this.st();
    { const f = this.st(); if (f.ghx.some(h => h.un)) { for (const h of f.ghx) if (h.un) { if (window.Refund181) Refund181.give(h.paid || 0, 'คืนเงินเรือนกระจกที่ยังไม่ได้วาง'); else S.money += h.paid || 0; } f.ghx = f.ghx.filter(h => !h.un); } }   // a greenhouse that was bought but never placed (page closed) is refunded
    const g = new THREE.Group(); World.outdoor.add(g); this.g = g;
    const mud = mc(0x5d4632, { roughness: 1 }), dike = texMat('dirt', 0x9c7b56), water = new THREE.MeshStandardMaterial({ color: 0x3f5f4a, roughness: 0.12, metalness: 0.2, transparent: true, opacity: 0.6 });
    // rice paddy: four flooded cells with earthen dikes
    this.paddyObj = [0, 1, 2, 3].map(i => {
      const x = PADDY.x - 3.6 + (i % 2) * 7.2, z = PADDY.z - 3.6 + ((i / 2) | 0) * 7.2, c = new THREE.Group(); c.position.set(x, 0, z); g.add(c);
      U.mk(c, GEO.box, mud, [0, 0.02, 0], [6.4, 0.04, 6.4]);
      for (const [a, b, w, d] of [[0, -3.4, 7.2, 0.6], [0, 3.4, 7.2, 0.6], [-3.4, 0, 0.6, 7.2], [3.4, 0, 0.6, 7.2]]) U.mk(c, U.box(w, 0.3, d, 2), dike, [a, 0.15, b]);
      const wt = U.mk(c, GEO.box, water, [0, 0.07, 0], [6.3, 0.02, 6.3]);
      const blades = new THREE.Group(); blades.userData.noCol = true; c.add(blades);
      const bm = mc(0x7cb342, { roughness: 0.9 });
      for (let k = 0; k < 36; k++) U.mk(blades, GEO.cone, bm, [-2.6 + (k % 6) * 1.04, 0.3, -2.6 + ((k / 6) | 0) * 1.04], [0.07, 0.6, 0.07]);
      World.pois.push({ kind: 'act', x, z, r: 3.3, label: 'แปลงนา ' + (i + 1), icon: '🌾', act: () => this.paddyAct(i) });
      return { c, wt, blades, bm };
    });
    World.clearNear(PADDY.x, PADDY.z, 9, true);
    // greenhouses: the first is here from the start, up to 5 more can be bought, and every one can be moved (see v67_nursery.js)
    this.ghObjs = []; for (let i = 0; i < this.ghHouses().length; i++) this.buildGH(i);
    // flower garden beside the greenhouse
    this.flPlants = [];
    for (let i = 0; i < 6; i++) { const x = FLOWER.x - 2 + (i % 3) * 2, z = FLOWER.z - 1 + ((i / 3) | 0) * 2.2; U.mk(g, U.box(1.6, 0.25, 1.6, 2), texMat('soil', 0x5d4037), [x, 0.12, z]); const p = new THREE.Group(); p.position.set(x, 0.25, z); g.add(p); this.flPlants.push(p);
      World.pois.push({ kind: 'act', x, z: z + 1.0, r: 1.1, label: 'สวนดอกไม้', icon: '🌹', act: () => this.slotAct('fl', i) }); }
    // compost bin, fish farm sign, factory, market stall
    { const b = new THREE.Group(); b.position.set(COMPOST.x, 0, COMPOST.z); g.add(b); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; U.mk(b, U.box(1.4, 0.9, 0.08, 1.2), M.wood, [Math.cos(a) * 0.7, 0.45, Math.sin(a) * 0.7], 1, [0, a + Math.PI / 2, 0]); } U.mk(b, GEO.box, mc(0x4e342e, { roughness: 1 }), [0, 0.6, 0], [1.3, 0.2, 1.3]); Col.circle(COMPOST.x, COMPOST.z, 0.9);
      World.pois.push({ kind: 'act', x: COMPOST.x - 1.6, z: COMPOST.z, r: 1.6, label: 'ถังปุ๋ยหมัก', icon: '🟫', act: () => ({ icon: '🟫', label: 'ถังปุ๋ยหมัก', fn: () => this.compostUI() }) }); }
    World.pois.push({ kind: 'act', x: 8, z: -22.8, r: 1.2, label: 'ดื่มน้ำบ่อ', icon: '🚰', act: () => ({ icon: '🚰', label: 'ดื่มน้ำจากบ่อ', fn: () => Life2.drink() }) });
    World.pois.push({ kind: 'act', x: POND_POI.x, z: POND_POI.z, r: 1.15, label: 'บ่อเลี้ยงปลา', icon: '🐟', act: () => ({ icon: '🐟', label: 'บ่อเลี้ยงปลา', fn: () => this.pondUI() }) });
    { const o = { w: 12, d: 8, h: 4.6, flat: true, wall: 0xe0e0e0, roof: 0x90a4ae, sign: 'โรงงานแปรรูปไร่สุขใจ', signStyle: { bg: '#455a64' }, winF: [-3.5, 3.5], winS: [0], ww: 1.6, wh: 1.2, doorX: 0 };
      const b = World.building(o); b.position.set(FACT.x, 0, FACT.z); b.rotation.y = -Math.PI / 2; g.add(b); Col.box(FACT.x, FACT.z, o.w / 2 + 0.3, o.d / 2 + 0.3, -Math.PI / 2, 'bld'); World.clearNear(FACT.x, FACT.z, 9, true);
      U.mk(g, GEO.cyl, M.metal, [FACT.x + 2, 5.8, FACT.z - 4], [0.35, 3, 0.35]);
      const door = l2w(FACT.x, FACT.z, -Math.PI / 2, 0, o.d / 2 + 1.6);
      World.pois.push({ kind: 'act', x: door.x, z: door.z, r: 2.4, label: 'โรงงานแปรรูป', icon: '🏭', map: true, act: () => ({ icon: '🏭', label: 'สั่งผลิตสินค้าแปรรูป', fn: () => this.factoryUI() }) }); }
    { const s = new THREE.Group(); s.position.set(MARKET.x, 0, MARKET.z); s.rotation.y = Math.PI / 2; g.add(s); U.mk(s, U.box(2.6, 0.9, 1.2, 1.2), M.wood, [0, 0.45, 0]); for (const a of [-1, 1]) for (const b of [-1, 1]) U.mk(s, GEO.cylLo, M.darkwood, [a * 1.2, 1.2, b * 0.55], [0.05, 2.4, 0.05]);
      const can = U.mk(s, GEO.box, U.mat(0xffb300, { map: T.stripes, roughness: 0.9 }), [0, 2.45, 0], [2.9, 0.08, 1.6]); can.rotation.x = 0.15; Col.box(MARKET.x, MARKET.z, 0.7, 1.3);
      World.pois.push({ kind: 'act', x: MARKET.x + 1.6, z: MARKET.z, r: 2.2, label: 'แผงตลาดนัดของคุณ', icon: '🛒', map: true, act: () => ({ icon: '🛒', label: 'แผงตลาดนัดเสาร์-อาทิตย์', fn: () => this.marketUI() }) }); }
    this.bugMat = new THREE.SpriteMaterial({ map: U.emojiTex('🐛'), transparent: true, depthWrite: false }); this.bugs = {};
    this.refresh();
    G.targetHooks.push((consider, p) => { for (const [k, v] of Object.entries(this.st().pests)) if (v) { const c = plotCenter(+k); const d = Math.hypot(p.x - c.x, p.z - c.z); if (d < 1.6) consider({ kind: 'ext', act: () => this.pestAct(+k) }, d - 0.8); } });
  },
  weekend() { const d = (S.day - 1) % 7; return d === 5 || d === 6; },
  // ----- rice -----
  paddyAct(i) {
    const p = this.st().paddy[i];
    if (p.s === 0) return { icon: '🚜', label: 'ไถนา (พลังงาน 6)', fn: () => { if (!useEnergy(6)) return; p.s = 1; playAct('plant', 1.2); Sfx.step('dirt'); Prog.add(3); this.refresh(); } };
    if (p.s === 1) return count('seedling') ? { icon: '🌱', label: 'ดำนา (ใช้ต้นกล้า 1 มัด)', fn: () => { if (!useEnergy(5)) return; takeItem('seedling'); p.s = 2; p.g = 0; p.wet = 2; playAct('plant', 1.4); Sfx.water(); Prog.add(4); this.refresh(); } } : { icon: '🌱', label: 'ต้องมีต้นกล้าข้าว (ร้านเกษตร)', fn: () => {} };
    if (p.s === 2) return { icon: '🌾', label: `ข้าวกำลังโต ${Math.round(p.g / 30 * 100)}% (${p.wet > 0 ? 'น้ำขังอยู่' : 'นาแห้ง! ใช้บัวเติมน้ำ'})`, fn: () => { if (S.can.water > 0) { S.can.water--; p.wet = Math.min(3, (p.wet || 0) + 1); playAct('water', 0.8); Sfx.water(); UI.toast('เติมน้ำเข้านาแล้ว', '💧'); } } };
    return { icon: '🌾', label: 'เกี่ยวข้าว', fn: () => { if (!useEnergy(6)) return; p.s = 0; p.g = 0; addItem('paddy', 8 + ((Math.random() * 5) | 0)); playAct('harvest', 1.4); Prog.add(15); this.refresh(); UI.toast('เกี่ยวข้าวได้ข้าวเปลือก! นำไปสีที่โรงงานแปรรูป', '🌾'); } };
  },
  // ----- greenhouses (nursery): positions are {x, z, r} with r = quarter turns -----
  ghHouses() { const f = this.st(); return [{ pos: f.ghp, s: f.gh }].concat(f.ghx.map(h => ({ pos: h, s: h.s }))); },
  ghSlots() { const out = []; for (const h of this.ghHouses()) for (const s of h.s) out.push(s); return out; },
  buildGH(h) {
    const gh = new THREE.Group(); this.g.add(gh);
    const glass = new THREE.MeshStandardMaterial({ color: 0xdff3ff, transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide }), fr = mc(0xeceff1, { metalness: 0.4, roughness: 0.4 });
    U.mk(gh, GEO.box, texMat('paving', 0xbcaaa4), [0, 0.05, 0], [10, 0.1, 7]);
    const shell = U.mk(gh, new THREE.CylinderGeometry(3.5, 3.5, 10, 16, 1, true, 0, Math.PI), glass, [0, 1.2, 0], 1, [0, 0, Math.PI / 2]); shell.castShadow = false;
    U.mk(gh, GEO.box, glass, [5, 1.2, 0], [0.04, 2.4, 7]);
    for (let i = -2; i <= 2; i++) U.mk(gh, new THREE.TorusGeometry(3.5, 0.05, 6, 16, Math.PI), fr, [i * 2.5, 1.2, 0], 1, [0, Math.PI / 2, 0]);
    for (let i = 0; i < 6; i++) U.mk(gh, U.box(2.2, 0.35, 1.6, 2), texMat('soil', 0x6d4c33), [GH_BX(i), 0.2, GH_BZ(i)]);
    const plants = [], pois = [];
    for (let i = 0; i < 6; i++) {
      const p = new THREE.Group(); p.position.set(GH_BX(i), 0.38, GH_BZ(i)); gh.add(p); plants.push(p);
      const poi = { kind: 'act', x: 0, z: 0, r: 1.3, label: h ? `แปลงในเรือนกระจก ${h + 1}` : 'แปลงในเรือนกระจก', icon: '🏡', act: () => this.slotAct('gh', i, h) };
      World.pois.push(poi); pois.push(poi);
    }
    this.ghObjs[h] = { gh, plants, pois, cols: [] };
    this.placeGH(h, true);
  },
  // put house h at its saved spot: model, solid walls and plant beds (rotated with it), and the plot prompts
  placeGH(h, clear) {
    const ob = this.ghObjs[h], o = this.ghHouses()[h].pos, rot = o.r * Math.PI / 2;
    ob.gh.position.set(o.x, 0, o.z); ob.gh.rotation.y = rot;
    this.unsolidGH(h);
    const box = (lx, lz, hw, hd) => { const c = l2w(o.x, o.z, rot, lx, lz); ob.cols.push(Col.box(c.x, c.z, hw, hd, rot)); };
    box(0, -3.5, 5, 0.1); box(0, 3.5, 5, 0.1); box(5, 0, 0.1, 3.5);    // front, back and the glass end (the other end is the open door)
    for (let i = 0; i < 6; i++) box(GH_BX(i), GH_BZ(i), 1.1, 0.8);       // the plant beds are solid too
    ob.pois.forEach((p, i) => { const q = l2w(o.x, o.z, rot, GH_BX(i), GH_BZ(i) + (i < 3 ? 1.1 : -1.1)); p.x = q.x; p.z = q.z; });
    if (clear) World.clearNear(o.x, o.z, 7, true);
  },
  unsolidGH(h) { const ob = this.ghObjs[h]; ob.cols.forEach(c => Col.remove(c)); ob.cols = []; },
  removeGH(h) {   // only ever used for the newest house (cancelling a purchase)
    const ob = this.ghObjs[h]; this.unsolidGH(h); this.g.remove(ob.gh); for (const p of ob.pois) { const i = World.pois.indexOf(p); if (i >= 0) World.pois.splice(i, 1); }
    this.ghObjs.splice(h, 1); this.st().ghx.splice(h - 1, 1);
  },
  // ----- greenhouse & flowers share the same slot logic -----
  slotAct(k, i, h) {
    const s = (k === 'gh' ? this.ghHouses()[h || 0].s : this.st()[k])[i];
    if (!s.c) {
      if (k === 'gh') { const seed = Object.keys(S.inv).find(x => x.startsWith('seed_') && S.inv[x] > 0 && CROPS[x.slice(5)] && !CROPS[x.slice(5)].tree); return seed ? { icon: '🌱', label: `ปลูก${ITEMS[seed].n} (โตได้ทุกฤดู ไม่ต้องรดน้ำ)`, fn: () => { takeItem(seed); s.c = seed.slice(5); s.g = 0; playAct('plant', 1); this.refresh(); } } : { icon: '🌱', label: 'ต้องมีเมล็ดผัก', fn: () => {} }; }
      const fl = Object.keys(FLOWERS).find(f => count('fseed_' + f)); return fl ? { icon: '🌸', label: `ปลูก${ITEMS[fl].n}`, fn: () => { takeItem('fseed_' + fl); s.c = fl; s.g = 0; playAct('plant', 1); this.refresh(); } } : { icon: '🌸', label: 'ต้องมีเมล็ดดอกไม้ (ร้านดอกไม้)', fn: () => {} };
    }
    const need = k === 'gh' ? CROPS[s.c].grow : FLOWERS[s.c];
    if (s.g < need) return { icon: '⏳', label: `${ITEMS[s.c].n} โต ${Math.round(s.g / need * 100)}%`, fn: () => {} };
    return { icon: '🧺', label: 'เก็บ' + ITEMS[s.c].n, fn: () => { addItem(s.c, k === 'gh' ? (CROPS[s.c].yield || 1) + 1 : 3); S.stats.harvest++; Prog.add(5); playAct('harvest', 1); if (k === 'gh' && CROPS[s.c].regrow) s.g = CROPS[s.c].grow - CROPS[s.c].regrow; else s.c = null; this.refresh(); } };
  },
  // ----- fish farm -----
  pondUI() {
    UI.open('บ่อเลี้ยงปลานิล', null, () => { const p = this.st().pond;
      return `<p class="lead">ปล่อยลูกปลา ให้อาหารทุกวัน ครบ 3 วันจับขายได้ ปลาที่ไม่ได้กินอาหารจะโตช้า</p><div class="card"><div class="ci">🐟</div><div class="cb"><h4>ในบ่อ ${p.n} ตัว</h4><p class="dim">${p.n ? `โตแล้ว ${Math.min(100, Math.round(p.g / 3 * 100))}% · ${p.fed === S.day ? 'วันนี้ให้อาหารแล้ว' : 'ยังไม่ได้ให้อาหารวันนี้'}` : 'บ่อว่าง'}</p>
        <div class="row"><button class="btn" data-a="f2pond" data-v="stock" ${count('fingerling') && p.n < 40 ? '' : 'disabled'}>ปล่อยลูกปลา (มี ${count('fingerling')})</button><button class="btn ghost" data-a="f2pond" data-v="feed" ${p.n && count('fishfeed') && p.fed !== S.day ? '' : 'disabled'}>ให้อาหาร (มี ${count('fishfeed')})</button><button class="btn" data-a="f2pond" data-v="catch" ${p.n && p.g >= 3 ? '' : 'disabled'}>จับปลาทั้งบ่อ</button></div></div></div>`; });
  },
  pond(v) {
    const p = this.st().pond;
    if (v === 'stock') { if (p.n > 0 && p.g >= 1) { UI.toast('จับปลาชุดเดิมให้หมดก่อนแล้วค่อยปล่อยลูกปลาชุดใหม่', '🐟'); return; } if (takeItem('fingerling')) { p.n += 10; if (p.n === 10) p.g = 0; Sfx.water(); } }
    if (v === 'feed' && takeItem('fishfeed')) { p.fed = S.day; Sfx.water(); }
    if (v === 'catch') { const got = Math.round(p.n * 1.6); addItem('fish_nile', got); UI.toast(`จับปลานิลได้ ${got} ตัว! (ตัวโตขยายพันธุ์เพิ่ม)`, '🐟'); Prog.add(p.n); p.n = 0; p.g = 0; }
  },
  // ----- factory -----
  factoryUI() {
    UI.open('โรงงานแปรรูปไร่สุขใจ', null, () => { const f = this.st().fac;
      const mill = `<div class="card"><div class="ci">⚙️</div><div class="cb"><h4>เครื่องสีข้าว</h4><p class="dim">ข้าวเปลือก 3 → ข้าวสาร 2 ทันที</p><div class="row"><button class="btn" data-a="f2mill" ${count('paddy') >= 3 ? '' : 'disabled'}>สีข้าว (มี ${count('paddy')})</button></div></div></div>`;
      return `<p class="lead">สั่งผลิตได้พร้อมกัน 3 ล็อต ล็อตละ 3 ชิ้น ได้มากกว่าเครื่องจักรในไร่</p>${mill}<div class="grid">${FACTORY.map(r => { const ok = Object.keys(r.need).every(k => countBase(k) >= r.need[k]); return `<div class="card"><div class="ci">${ITEMS[r.id].i}</div><div class="cb"><h4>${ITEMS[r.id].n} ×3</h4><p class="need">${Object.keys(r.need).map(k => `<span class="${countBase(k) >= r.need[k] ? 'have' : 'miss'}">${ITEMS[k].i}${r.need[k]}</span>`).join(' ')} · ${r.h} ชม. · ขายชิ้นละ ${baht(ITEMS[r.id].sell)}</p><div class="row"><button class="btn" data-a="f2make" data-id="${r.id}" ${ok && f.length < 3 ? '' : 'disabled'}>สั่งผลิต</button></div></div></div>`; }).join('')}</div>
        ${f.length ? `<h5>กำลังผลิต</h5><ul class="lead">${f.map(j => `<li>${ITEMS[j.id].i} ${ITEMS[j.id].n} ${j.left <= 0 ? '✅ เสร็จแล้ว (จะเข้ากระเป๋าอัตโนมัติ)' : `เหลือ ${Math.ceil(j.left)} ชม.`}</li>`).join('')}</ul>` : ''}`; });
  },
  make(id) { const r = FACTORY.find(x => x.id === id), f = this.st().fac; if (f.length >= 3 || !Object.keys(r.need).every(k => countBase(k) >= r.need[k])) return; for (const k in r.need) takeBase(k, r.need[k]); f.push({ id, left: r.h }); Sfx.tone(300, 0.3, 'sawtooth', 0.04); },
  mill() { if (!takeItem('paddy', 3)) return; addItem('rice', 2); Sfx.burst(0.5, 600, 'lowpass', 0.2); Prog.add(3); },
  // ----- compost -----
  compostUI() {
    UI.open('ถังปุ๋ยหมัก', null, () => { const c = this.st().comp, scraps = Object.keys(S.inv).filter(k => ITEMS[k] && ITEMS[k].cat === 'crop' && S.inv[k] > 0);
      return `<p class="lead">ใส่ผักหรือผลไม้ 3 ชิ้น หมัก 2 วัน ได้ปุ๋ยหมัก 2 ถุง ใช้แทนปุ๋ยเร่งโตได้ (ถือแล้วกดที่แปลง)</p>${c.length ? `<p class="lead">กำลังหมัก: ${c.map(x => x.day <= S.day ? '✅ พร้อมแล้ว' : `อีก ${x.day - S.day} วัน`).join(', ')}</p>` : ''}
        <div class="row"><button class="btn" data-a="f2comp" ${scraps.reduce((s, k) => s + S.inv[k], 0) >= 3 ? '' : 'disabled'}>ใส่เศษผัก 3 ชิ้น</button><button class="btn ghost" data-a="f2compget" ${c.some(x => x.day <= S.day) ? '' : 'disabled'}>เก็บปุ๋ยหมัก</button></div>`; });
  },
  compost() { let n = 3; const scraps = Object.keys(S.inv).filter(k => ITEMS[k] && ITEMS[k].cat === 'crop' && S.inv[k] > 0).sort((a, b) => ITEMS[a].sell - ITEMS[b].sell); for (const k of scraps) { while (n > 0 && count(k)) { takeItem(k); n--; } } this.st().comp.push({ day: S.day + 2 }); Sfx.step('dirt'); },
  compostGet() { const c = this.st().comp, ready = c.filter(x => x.day <= S.day); this.st().comp = c.filter(x => x.day > S.day); addItem('compost', ready.length * 2); UI.toast(`ได้ปุ๋ยหมัก ${ready.length * 2} ถุง`, '🟫'); },
  // ----- pests -----
  pestAct(i) {
    if (count('pesticide')) return { icon: '🧴', label: 'ฉีดยากำจัดแมลง', fn: () => { takeItem('pesticide'); delete this.st().pests[i]; playAct('water', 0.8); Sfx.burst(0.5, 3000, 'highpass', 0.1); this.refresh(); } };
    return { icon: '🐛', label: 'มีแมลงกินผัก! เก็บด้วยมือ (พลังงาน 4)', fn: () => { if (!useEnergy(4)) return; delete this.st().pests[i]; playAct('harvest', 1); this.refresh(); } };
  },
  // ----- contracts & weekend market (managed from the phone business app) -----
  newContract() {
    const pool = Object.keys(CROPS).filter(k => !CROPS[k].tree && (SEED_LVL[k] || 1) <= S.lvl), crop = U.pick(pool), qty = 10 + ((Math.random() * 10) | 0);
    const who = U.pick(['ร้านอาหารป้าแดง', 'ร้านซีฟู้ดริมหาด', 'สุขใจมาร์ท', 'โรงแรมริมทะเล']);
    return { crop, qty, who, due: S.day + 7, pay: Math.round(CROPS[crop].sell * qty * 1.6), done: 0 };
  },
  bizHTML() {
    const f = this.st(), c = f.contract;
    return `<h5>📃 สัญญาส่งผักรายสัปดาห์</h5>${c ? `<div class="card"><div class="ci">${CROPS[c.crop].i}</div><div class="cb"><h4>${c.who}: ${CROPS[c.crop].n} ${c.done}/${c.qty}</h4><p class="dim">ส่งภายใน${RD(c.due)} · ค่าตอบแทน ${baht(c.pay)} (แพงกว่าตลาด 60%) · ผิดสัญญาเสียค่าปรับ 10%</p><div class="row"><button class="btn" data-a="f2ship" ${countBase(c.crop) ? '' : 'disabled'}>ส่งของที่มี (${countBase(c.crop)})</button></div></div></div>` : `<div class="row"><button class="btn" data-a="f2deal">รับสัญญาใหม่</button></div>`}
      <h5>👷 คนงานในฟาร์ม</h5><div class="card"><div class="ci">👷</div><div class="cb"><h4>จ้างอยู่ ${f.hands} คน</h4><p class="dim">ค่าแรงคนละ 300 ฿/วัน · ทุกเช้าช่วยรดน้ำผัก 10 แปลง และเก็บผักสุกเข้าหีบในบ้าน</p><div class="row"><button class="btn" data-a="f2hire" data-v="1" ${f.hands < 3 ? '' : 'disabled'}>จ้างเพิ่ม</button><button class="btn ghost" data-a="f2hire" data-v="-1" ${f.hands ? '' : 'disabled'}>เลิกจ้าง 1 คน</button></div></div></div>
      <h5>🛒 แผงตลาดนัดเสาร์-อาทิตย์</h5><p class="lead">${this.weekend() ? 'วันนี้ตลาดนัดเปิด! ของบนแผงขายได้เอง +30%' : `ตลาดนัดเปิดวันเสาร์-อาทิตย์ (อีก ${((12 - ((S.day - 1) % 7)) % 7) || 7} วัน)`} · ของบนแผง ${Object.values(f.mstock).reduce((s, v) => s + v, 0)} ชิ้น · จัดของได้ที่แผงข้างลานน้ำพุ</p>`;
  },
  marketUI() {
    UI.open('แผงตลาดนัดของคุณ', null, () => { const m = this.st().mstock, on = Object.keys(m).filter(k => m[k] > 0), inv = UI.sellables();
      return `<p class="lead">${this.weekend() ? 'ตลาดนัดเปิดอยู่! ' : 'เปิดเฉพาะเสาร์-อาทิตย์ '}ลูกค้าจะซื้อของบนแผงทุกชั่วโมงช่วง 8:00–18:00 ราคา +30%</p><h5>บนแผง</h5>${on.length ? on.map(k => `<p>${ITEMS[k].i} ${esc(ITEMS[k].n)} ×${m[k]}</p>`).join('') : '<p class="empty">ว่าง</p>'}
        <h5>วางขาย</h5><div class="grid">${inv.map(id => `<div class="card"><div class="ci">${ITEMS[id].i}</div><div class="cb"><h4>${esc(ITEMS[id].n)} <small>×${count(id)}</small></h4><div class="row"><button class="btn" data-a="f2stock" data-id="${id}">วางทั้งหมด</button></div></div></div>`).join('') || '<p class="empty">ไม่มีของขาย</p>'}</div>`; });
  },
  // ----- time -----
  tick(h, rain) {
    const f = this.st();
    for (const p of f.paddy) if (p.s === 2) { if (rain) p.wet = 3; if (p.wet > 0) p.g += h; if (p.g >= 30) p.s = 3; }
    for (const s of this.ghSlots()) if (s.c) s.g = Math.min(CROPS[s.c].grow, s.g + h);
    for (const s of f.fl) if (s.c) s.g += h;
    for (const j of f.fac) j.left -= h;
    for (const j of f.fac.slice()) if (j.left <= 0) { f.fac.splice(f.fac.indexOf(j), 1); addItem(j.id, 3); if (!G.simulating) UI.toast(`โรงงานผลิต${ITEMS[j.id].n} ×3 เสร็จแล้ว`, '🏭'); }
    // weekend market sales
    const hr = S.time / 60;
    if (this.weekend() && hr >= 8 && hr < 18 && Math.random() < h * 1.2) {
      const ks = Object.keys(f.mstock).filter(k => f.mstock[k] > 0);
      if (ks.length) { const k = U.pick(ks), n = Math.min(f.mstock[k], 1 + ((Math.random() * 3) | 0)), v = Math.round(priceOf(k) * 1.3) * n; f.mstock[k] -= n; earn(v); Bank2.income('ตลาดนัด', v); S.stats.sold += n; }
    }
    if (!G.simulating && (this._rt = (this._rt || 0) + h) > 1) { this._rt = 0; this.refresh(); }
  },
  day() {
    const f = this.st();
    for (const p of f.paddy) p.wet = Math.max(0, (p.wet || 0) - 1);
    if (f.pond.n) f.pond.g += f.pond.fed === S.day - 1 || f.pond.fed === S.day ? 1 : 0.4;
    // pests: up to two plots, unless ladybugs guard the farm
    if (f.lady < S.day && Math.random() < 0.35) { const cand = S.plots.map((p, i) => p.c ? i : -1).filter(i => i >= 0 && !f.pests[i]); for (let n = 0; n < 2 && cand.length; n++) f.pests[cand.splice((Math.random() * cand.length) | 0, 1)[0]] = 1; if (cand.length !== S.plots.filter(p => p.c).length) Phone.msg('เตือนภัยแมลง', 'พบหนอนกินผักในแปลง! ผักจะโตช้าลงจนกว่าจะกำจัด', true); }
    // farmhands
    if (f.hands) { const cost = f.hands * 300; if (S.money >= cost) { S.money -= cost; let w = 0, hv = 0; S.plots.forEach((p, i) => { if (p.c && p.w <= 0 && w < 10 * f.hands) { p.w = 1; w++; } if (stageOf(p) === 3 && hv < 6 * f.hands) { const C = CROPS[p.c]; S.chest[p.c] = (S.chest[p.c] || 0) + (C.yield || 1); if (C.regrow) p.g = C.grow - C.regrow; else { p.c = null; p.g = 0; p.f = 0; } hv++; } }); Phone.msg('คนงานในฟาร์ม', `วันนี้รดน้ำ ${w} แปลง เก็บผัก ${hv} แปลงเข้าหีบในบ้าน (ค่าแรง ${baht(cost)})`, true); } else { f.hands = 0; Phone.msg('คนงานในฟาร์ม', 'เงินไม่พอจ่ายค่าแรง คนงานลาออกแล้ว'); } }
    // contract deadline
    const c = f.contract; if (c && S.day > c.due) { const fine = Math.round(c.pay * 0.1); S.money = Math.max(0, S.money - fine); Phone.msg(c.who, `ส่งของไม่ครบตามสัญญา ปรับ ${baht(fine)} นะครับ`); f.contract = null; }
  },
  slowGrowth(i) { return this.st().pests[i] ? 0.5 : 1; },
  refresh() {
    if (!this.paddyObj) return; const f = this.st();
    this.paddyObj.forEach((o, i) => { const p = f.paddy[i]; o.wt.visible = p.s >= 2; o.blades.visible = p.s >= 2; const k = p.s === 3 ? 1 : Math.min(1, 0.2 + p.g / 30); o.blades.scale.set(1, k, 1); o.bm.color.copy(U.col(p.s === 3 ? 0xd4b44a : 0x7cb342)); });
    const draw = (arr, objs, emoji) => arr.forEach((s, i) => { const g = objs[i]; while (g.children.length) g.remove(g.children[0]); if (!s.c) return; const need = emoji ? FLOWERS[s.c] : CROPS[s.c].grow, k = Math.min(1, 0.25 + s.g / need); const sp = U.sprite(ITEMS[s.c].i, 0.6 * k + 0.2, false); sp.position.y = 0.4 * k + 0.1; g.add(sp); });
    this.ghHouses().forEach((H, i) => this.ghObjs[i] && draw(H.s, this.ghObjs[i].plants, false)); draw(f.fl, this.flPlants, true);
    this.bugs = this.bugs || {}; if (!this.bugMat) return;
    for (const k in this.bugs) if (!f.pests[k]) { G.scene.remove(this.bugs[k]); delete this.bugs[k]; }
    for (const k in f.pests) if (!this.bugs[k]) { const c = plotCenter(+k), s = new THREE.Sprite(this.bugMat); s.scale.setScalar(0.5); s.position.set(c.x, 0.9, c.z); G.scene.add(s); this.bugs[k] = s; }
  },
};
UI.H.f2pond = d => Farm2.pond(d.v);
UI.H.f2make = d => Farm2.make(d.id);
UI.H.f2mill = () => Farm2.mill();
UI.H.f2comp = () => Farm2.compost();
UI.H.f2compget = () => Farm2.compostGet();
UI.H.f2deal = () => { Farm2.st().contract = Farm2.newContract(); Sfx.coin(); };
UI.H.f2ship = () => { const c = Farm2.st().contract, n = Math.min(countBase(c.crop), c.qty - c.done); takeBase(c.crop, n); c.done += n; if (c.done >= c.qty) { earn(c.pay); Bank2.income('สัญญาส่งผัก', c.pay); Phone.msg(c.who, `รับของครบแล้ว โอนเงิน ${baht(c.pay)} ให้แล้วครับ ขอบคุณมาก!`); Farm2.st().contract = null; Prog.add(40); } else UI.toast(`ส่ง${CROPS[c.crop].n} ${n} ชิ้น รถจะมารับพรุ่งนี้เช้า`, '🚚'); };
UI.H.f2hire = d => { const f = Farm2.st(); f.hands = U.clamp(f.hands + +d.v, 0, 3); UI.toast(+d.v > 0 ? 'จ้างคนงานแล้ว เริ่มงานพรุ่งนี้เช้า' : 'เลิกจ้างแล้ว', '👷'); };
UI.H.f2stock = d => { const n = count(d.id); if (!takeItem(d.id, n)) return; const m = Farm2.st().mstock; m[d.id] = (m[d.id] || 0) + n; };
// using items on the farm: compost works like fertiliser, ladybugs guard the farm
UI.H.usegood2 = d => { if (d.id === 'ladybug' && takeItem('ladybug')) { Farm2.st().lady = S.day + 4; Farm2.st().pests = {}; Farm2.refresh(); UI.toast('ปล่อยเต่าทองแล้ว ไร่ปลอดแมลง 4 วัน', '🐞'); } };
