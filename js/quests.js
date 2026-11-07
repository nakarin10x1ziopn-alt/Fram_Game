'use strict';
// ---------- Story quests from shopkeepers, and village projects funded by the player ----------

// Objective helpers
const qHave = (id, n) => ({ text: () => `${ITEMS[id].i} ${ITEMS[id].n} ${Math.min(n, countBase(id))}/${n}`, ok: () => countBase(id) >= n, pay: () => takeBase(id, n) });
const qFish = n => ({ text: () => `🐟 ปลาอะไรก็ได้ ${Math.min(n, fishCount())}/${n}`, ok: () => fishCount() >= n, pay: () => takeFish(n) });
function fishCount() { return Object.keys(S.inv).filter(k => k.startsWith('fish_')).reduce((a, k) => a + S.inv[k], 0); }
function takeFish(n) { for (const k of Object.keys(S.inv).filter(k => k.startsWith('fish_'))) { const t = Math.min(n, S.inv[k]); takeItem(k, t); n -= t; if (!n) break; } }

const QUESTS = [
  { giver: 'farmshop', t: 'ผักแรกของชาวไร่', lvl: 1,
    intro: 'ยินดีต้อนรับสู่หมู่บ้านนะ! ลุงอยากเห็นฝีมือหน่อย ปลูกแครอทมาให้ดู 5 หัว แล้วลุงจะให้เมล็ดมะเขือเทศไปลองปลูก',
    done: 'แครอทสวยมาก! มือเย็นแบบนี้ปลูกอะไรก็ขึ้นแน่นอน เอาเมล็ดมะเขือเทศไปเลย',
    obj: [qHave('carrot', 5)], reward: { money: 300, items: { seed_tomato: 6 } } },
  { giver: 'restaurant', t: 'เมนูใหม่ของร้านป้า', lvl: 2,
    intro: 'ป้าอยากทำเมนูน้ำพริกใหม่ แต่พริกกับมะเขือเทศในตลาดไม่สดเลย ช่วยเอามะเขือเทศ 3 ลูกกับพริก 2 เม็ดมาให้ป้าหน่อยนะ',
    done: 'หอมสดชื่นมาก! เมนูนี้ป้าจะตั้งชื่อตามฟาร์มหนูเลย รับข้าวผัดไปกินด้วยนะ',
    obj: [qHave('tomato', 3), qHave('chili', 2)], reward: { money: 600, items: { food_rice: 3 }, heart: 2 } },
  { giver: 'ranch', t: 'ไข่สดทุกเช้า', lvl: 2,
    intro: 'คนในหมู่บ้านอยากได้ไข่ไก่สด ๆ มีไก่สัก 2 ตัวแล้วเอาไข่มาให้ลุง 4 ฟอง ลุงจะแถมอาหารสัตว์ให้',
    done: 'ไข่ฟองโต แสดงว่าดูแลไก่ดีมาก รับอาหารสัตว์ไปเลย',
    obj: [{ text: () => `🐔 มีไก่ ${Math.min(2, S.animals.filter(a => a.type === 'chicken').length)}/2 ตัว`, ok: () => S.animals.filter(a => a.type === 'chicken').length >= 2, pay: () => {} }, qHave('egg', 4)],
    reward: { money: 800, items: { feed: 12 } } },
  { giver: 'carpenter', t: 'เตรียมงานเทศกาล', lvl: 4,
    intro: 'ช่างกำลังทำซุ้มสำหรับงานเทศกาล อยากได้ฟักทองลูกโตไว้ประดับซุ้ม 1 ลูก กับข้าวโพด 3 ฝัก มาช่วยกันหน่อยนะ',
    done: 'ซุ้มปีนี้สวยที่สุดเลย! ช่างทำกระถางต้นไม้ไว้ให้ ไปวางในบ้านนะ',
    obj: [qHave('pumpkin', 1), qHave('corn', 3)], reward: { money: 1500, furn: 'plant', heart: 1 } },
  { giver: 'market', t: 'ปลาสดส่งตลาด', lvl: 3,
    intro: 'เรือประมงออกไม่ได้หลายวันแล้ว ตลาดขาดปลา ช่วยตกปลามาส่ง 3 ตัวได้ไหมจ๊ะ',
    done: 'ขอบใจมากจ้ะ ตลาดกลับมาคึกคักแล้ว รับปุ๋ยไปใช้ในไร่นะ',
    obj: [qFish(3)], reward: { money: 1200, items: { fert: 5 } } },
  { giver: 'rare', t: 'ต้นไม้แห่งความหวัง', lvl: 5,
    intro: 'ต้นไม้ผลจะอยู่กับฟาร์มไปอีกนาน ลองเปิดสวนผลไม้แล้วปลูกมะม่วงหรือส้มสักต้นสิ',
    done: 'เห็นต้นไม้ของเธอแล้วชื่นใจ นี่ต้นกล้ามะม่วงพันธุ์ดีอีกต้น',
    obj: [{ text: () => `🌳 ปลูกต้นไม้ผลในสวน ${S.trees.some(t => t.c) ? 1 : 0}/1`, ok: () => S.trees.some(t => t.c), pay: () => {} }],
    reward: { money: 2000, items: { seed_mango: 1 } } },
  { giver: 'farmshop', t: 'เกษตรกรดีเด่นประจำหมู่บ้าน', lvl: 6,
    intro: 'ทั้งหมู่บ้านพูดถึงฟาร์มของเธอ ถ้าถึงระดับ 8 และมีผลผลิตเกรดทอง ★★ มาให้ดูสักชิ้น ลุงจะเสนอชื่อเป็นเกษตรกรดีเด่น',
    done: 'ยินดีด้วย! ตั้งแต่วันนี้เธอคือเกษตรกรดีเด่นของหมู่บ้านสุขใจ',
    obj: [{ text: () => `⭐ ระดับเกษตรกร ${Math.min(8, S.lvl)}/8`, ok: () => S.lvl >= 8, pay: () => {} },
      { text: () => `★★ มีผลผลิตเกรดทอง ${Object.keys(S.inv).some(k => k.endsWith('@2')) ? 1 : 0}/1`, ok: () => Object.keys(S.inv).some(k => k.endsWith('@2')), pay: () => { const k = Object.keys(S.inv).find(k => k.endsWith('@2')); takeItem(k); } }],
    reward: { money: 5000, title: 'เกษตรกรดีเด่น' } },
];

const Quest = {
  markers: new Map(), t: 0,
  cur() { return QUESTS[S.quest.i]; },
  giverOf(q) { return G.npcs.find(n => n.keeper === q.giver); },
  complete(q) { return q.obj.every(o => o.ok()); },
  isGiver(n) { const q = this.cur(); return q && n.keeper === q.giver && S.lvl >= q.lvl; },
  accept() { S.quest.st = 'active'; Sfx.click(); UI.toast('รับเควสต์: ' + this.cur().t, '📜'); },
  turnIn(n) {
    const q = this.cur(); if (!q || !this.complete(q)) return;
    q.obj.forEach(o => o.pay());
    const r = q.reward;
    if (r.money) earn(r.money);
    for (const k in (r.items || {})) addItem(k, r.items[k]);
    if (r.furn) { S.furn[r.furn] = 1; World.buildInterior(S.up.house, S); World.interior.visible = G.inside; }
    if (r.title) S.title = r.title;
    Friends.add(n.name, r.heart || 1); Prog.add(80);
    UI.toast(`${n.name}: “${q.done}”`, '📜');
    setTimeout(() => UI.toast(`เควสต์สำเร็จ! ${q.t} · รับ ${U.fmt(r.money || 0)} ฿`, '🏅'), 900);
    S.quest = { i: S.quest.i + 1, st: 'avail' }; Sfx.goal();
  },
  tracker() {
    const q = this.cur(); if (!q) return null;
    const g = this.giverOf(q), who = g ? g.name : 'ชาวบ้าน';
    if (S.lvl < q.lvl) return { t: `เควสต์ถัดไปเปิดที่ Lv.${q.lvl}`, sub: '' };
    if (S.quest.st === 'avail') return { t: `${who}มีเรื่องอยากให้ช่วย`, sub: 'ไปคุยที่หน้าร้าน ❗' };
    return { t: q.t, sub: q.obj.map(o => o.text()).join(' · ') + (this.complete(q) ? ' → ส่งที่' + who : '') };
  },
  // floating ! / ? above the quest giver's head
  update(dt) {
    this.t -= dt; if (this.t > 0) return; this.t = 0.4;
    const q = this.cur(), g = q && S.lvl >= q.lvl ? this.giverOf(q) : null;
    for (const [n, sp] of this.markers) if (n !== g) sp.visible = false;
    if (!g) return;
    let sp = this.markers.get(g);
    if (!sp) { sp = U.sprite('❗', 0.7); g.obj.add(sp); sp.position.y = 2.35; this.markers.set(g, sp); }
    const icon = S.quest.st === 'avail' ? '❗' : this.complete(q) ? '❓' : '';
    sp.visible = !!icon && g.obj.visible;
    if (icon && sp.material.map !== U.emojiTex(icon)) { sp.material.map = U.emojiTex(icon); sp.material.needsUpdate = true; }
  },
};

// ---------- Village projects ----------
const PROJECTS = [
  { id: 'lamps', n: 'ไฟส่องทางจากฟาร์มถึงหมู่บ้าน', i: '💡', money: 3000, items: {}, perk: 'เสาไฟ 8 ต้นตลอดถนน ขับรถกลางคืนปลอดภัย' },
  { id: 'garden', n: 'สวนดอกไม้รอบลานน้ำพุ', i: '🌻', money: 1500, items: { sunflower: 5 }, perk: 'ลานสวยขึ้น ชาวบ้านทุกคนสนิทกับคุณเพิ่ม ❤️+1' },
  { id: 'bus', n: 'รถสองแถวรับส่ง 3 ป้าย', i: '🚌', money: 4000, items: {}, perk: 'ป้ายรถที่ฟาร์ม หมู่บ้าน และเมืองริมทะเล เดินทางได้ทันที 20 ฿' },
  { id: 'market', n: 'ตลาดนัดชุมชน', i: '🧺', money: 5000, items: { cabbage: 5, tomato: 5 }, perk: 'แผงรับซื้อในหมู่บ้าน ให้ราคา +20%' },
  { id: 'pier', n: 'ขยายท่าเรือประมง', i: '⚓', money: 8000, items: { fish_mackerel: 3 }, perk: 'มีเรือประมงจอดเพิ่ม ปลาหายากที่ท่าเรือมาบ่อยขึ้น 1.5 เท่า' },
];
const Dev = {
  give(id, what) {
    const p = PROJECTS.find(x => x.id === id), st = S.projects[id] = S.projects[id] || { money: 0, items: {} };
    if (st.done) return;
    if (what === 'money') { const need = p.money - st.money, n = Math.min(need, S.money, need); if (n <= 0) { UI.toast('เงินไม่พอ', '💸'); return; } S.money -= n; st.money += n; Sfx.coin(); }
    else { const need = p.items[what] - (st.items[what] || 0), n = Math.min(need, countBase(what)); if (n <= 0) { UI.toast('ยังไม่มีของนี้', '📦'); return; } takeBase(what, n); st.items[what] = (st.items[what] || 0) + n; Sfx.plant(); }
    if (st.money >= p.money && Object.keys(p.items).every(k => (st.items[k] || 0) >= p.items[k])) {
      st.done = true; this.apply(id, true); Prog.add(100);
      UI.toast(`โครงการ "${p.n}" สำเร็จ! ${p.perk}`, p.i);
    }
    saveGame(true);
  },
  done(id) { return S.projects[id] && S.projects[id].done; },
  applyAll() { for (const p of PROJECTS) if (this.done(p.id)) this.apply(p.id, false); },
  apply(id, fresh) {
    const g = new THREE.Group(); World.outdoor.add(g);
    if (id === 'lamps') {
      const pos = [];
      for (let z = -70; z >= -160; z -= 13) { const x = (z / 13) % 2 ? 5.2 : -5.2; World.lamp(g, x, z); pos.push(x, 4.3, z); }
      World.glows.lamp.push(World.glowPoints(pos, 0xffd08a, 3.2));
    }
    if (id === 'garden') {
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2, x = -28 + Math.cos(a) * 11.2, z = -265 + Math.sin(a) * 11.2; if (Math.abs(z + 265) < 3 && x > -20) continue;
        U.mk(g, U.box(1.6, 0.35, 0.8, 1.5), M.stone, [x, 0.18, z], 1, [0, -a, 0]);
        for (let k = 0; k < 3; k++) { const sf = Models.compact(Models.cropOne('sunflower', 3, i * 3 + k)); sf.position.set(x + Math.cos(-a) * (k - 1) * 0.45, 0.35, z - Math.sin(-a) * (k - 1) * 0.45); sf.rotation.y = -a + Math.PI / 2; sf.scale.setScalar(0.8); g.add(sf); } }
      if (fresh) for (const n of G.npcs) Friends.add(n.name, 1);
    }
    if (id === 'bus') for (const s of BUS_STOPS) {
      const b = new THREE.Group(); b.position.set(s.x, 0, s.z); b.rotation.y = s.r; g.add(b);
      U.mk(b, U.box(3, 0.12, 1.6, 2), M.stone, [0, 0.06, 0]);
      for (const sx of [-1.4, 1.4]) U.mk(b, GEO.cylLo, M.metal, [sx, 1.2, -0.6], [0.06, 2.4, 0.06]);
      U.mk(b, U.box(3.3, 0.1, 1.9, 2.5), texMat('roof', 0x2f6db5), [0, 2.45, -0.1], 1, [0.1, 0, 0]);
      U.mk(b, U.box(2.6, 0.08, 0.45, 1.5), M.wood, [0, 0.5, -0.5]);
      U.mk(b, GEO.cylLo, M.metal, [1.7, 1.2, 0.5], [0.04, 2.4, 0.04]);
      U.mk(b, new THREE.PlaneGeometry(0.7, 0.5), new THREE.MeshStandardMaterial({ map: U.signTex('🚌 ' + s.n, { bg: '#2f6db5', w: 256, h: 180 }), roughness: 0.6 }), [1.7, 2.3, 0.52]);
      Col.box(s.x, s.z, 1.5, 0.3, s.r);
      const d = l2w(s.x, s.z, s.r, 0, 1.3); World.pois.push({ kind: 'bus', x: d.x, z: d.z, r: 2.2, label: 'ป้ายรถสองแถว ' + s.n, icon: '🚌', map: true });
    }
    if (id === 'market') {
      const mx = -12, mz = -283, b = new THREE.Group(); b.position.set(mx, 0, mz); b.rotation.y = Math.PI / 2; g.add(b);
      U.mk(b, U.box(3.2, 0.9, 1.3, 1.2), M.wood, [0, 0.45, 0]);
      for (const a of [-1, 1]) for (const c of [-1, 1]) U.mk(b, GEO.cylLo, M.darkwood, [a * 1.5, 1.3, c * 0.6], [0.06, 2.6, 0.06]);
      U.mk(b, GEO.box, U.mat(0xff9800, { map: T.stripes, roughness: 0.9 }), [0, 2.65, 0], [3.6, 0.08, 1.9], [0.15, 0, 0]);
      const cols = [0xe8781c, 0x6cb33f, 0xd8261c, 0xf2c94c];
      for (let k = 0; k < 16; k++) U.mk(b, GEO.sphLo, mc(cols[k % 4], { roughness: 0.5 }), [-1.3 + (k % 8) * 0.37, 0.98, -0.3 + ((k / 8) | 0) * 0.5], 0.13);
      Col.box(mx, mz, 1.7, 0.7, Math.PI / 2);
      World.pois.push({ kind: 'vmarket', x: mx + 1.7, z: mz, r: 2.2, label: 'ตลาดนัดชุมชน (+20%)', icon: '🧺', map: true });
    }
    if (id === 'pier') {
      for (const [x, z, r] of [[452, -387, 0.1], [462, -373, -0.2], [436, -371, 0.3]]) { const b = new THREE.Group(); b.position.set(x, -0.6, z); World.outdoor.add(b); longtail(b, 0, 0.1, 0, r); World.boats.push(b); }
      U.mk(g, U.box(4, 2.6, 3, 2.4), texMat('woodV', 0x8a6a48), [468, 1.9, -380]);
      U.mk(g, U.box(4.6, 0.12, 3.6, 2.5), texMat('roof', 0x2f6d8a), [468, 3.3, -380]);
    }
    if (fresh) World.buildMapImage();
  },
};
const BUS_STOPS = [   // at the kerb, front to the road, clear of shops and kiosks, a few tens of metres from the other stops
  { n: 'หน้าฟาร์ม', x: 6.6, z: -87.9, r: -1.571 },
  { n: 'หมู่บ้าน', x: -6.6, z: -231.4, r: 1.571 },
  { n: 'เมืองริมทะเล', x: 298.7, z: -385.9, r: -0.062 },
];
function busTo(i) {
  const s = BUS_STOPS[i];
  if (S.money < 20) { UI.toast('ค่ารถ 20 ฿ เงินไม่พอ', '💸'); return; }
  S.money -= 20; UI.close(); Sfx.door();
  fade(() => { const d = l2w(s.x, s.z, s.r, 0, 1.6); G.player.pos.set(d.x, World.groundY(d.x, d.z), d.z); G.player.rot = s.r; snapCam(); simulate(15); UI.toast(`ถึงป้าย${s.n}แล้ว`, '🚌'); });
}
