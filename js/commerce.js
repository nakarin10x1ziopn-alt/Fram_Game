'use strict';
// ---------- Shopping: Suk Jai Plaza departments, wearable accessories, restaurant dine-in / takeaway / delivery ----------
// wearable accessories: slot -> mesh builder
const WEAR = {
  cowboy: { n: 'หมวกคาวบอย', i: '🤠', slot: 'head', price: 900 },
  beanie: { n: 'หมวกไหมพรม', i: '🧶', slot: 'head', price: 450 },
  crown: { n: 'มงกุฎดอกไม้', i: '🌸', slot: 'head', price: 650 },
  sunglasses: { n: 'แว่นกันแดด', i: '🕶️', slot: 'face', price: 700 },
  glasses: { n: 'แว่นสายตากรอบทอง', i: '👓', slot: 'face', price: 1200 },
  necklace: { n: 'สร้อยคอทองคำ', i: '📿', slot: 'neck', price: 6500 },
  pearl: { n: 'สร้อยไข่มุก', i: '🦪', slot: 'neck', price: 4800 },
  scarf: { n: 'ผ้าพันคอลายไทย', i: '🧣', slot: 'neck', price: 550 },
  backpack: { n: 'กระเป๋าเป้เดินป่า', i: '🎒', slot: 'back', price: 1100 },
  watch: { n: 'นาฬิกาข้อมือ', i: '⌚', slot: 'wrist', price: 2500 },
  bracelet: { n: 'กำไลหยก', i: '🟢', slot: 'wrist', price: 3200 },
};
for (const id in WEAR) ITEMS['wear_' + id] = { n: WEAR[id].n, i: WEAR[id].i, cat: 'tool' };
// goods with real effects
const GOODS = {
  vitamin: { n: 'วิตามินรวม', i: '💊', price: 120, desc: 'ใช้แล้วพลังงาน +40', use: () => { S.energy = Math.min(maxEnergy(), S.energy + 40); } },
  balm: { n: 'ยาหม่องสมุนไพร', i: '🌿', price: 60, desc: 'ใช้แล้วพลังงาน +15 และเดินไวขึ้นวันนี้', use: () => { S.energy = Math.min(maxEnergy(), S.energy + 15); (S.buff = S.buff || {}).fast = S.day; } },
  book_farm: { n: 'ตำราปลูกผักฉบับเซียน', i: '📗', price: 1500, desc: 'อ่านแล้วผักโตเร็วขึ้นถาวร 5%', use: () => { S.perk = S.perk || {}; if (S.perk.farm) return 'อ่านแล้ว'; S.perk.farm = 1; } },
  book_cook: { n: 'ตำราอาหารไทยโบราณ', i: '📕', price: 1500, desc: 'อ่านแล้วขายอาหารที่ทำเองแพงขึ้นถาวร 10%', use: () => { S.perk = S.perk || {}; if (S.perk.cook) return 'อ่านแล้ว'; S.perk.cook = 1; } },
  book_love: { n: 'นิยายรักริมทุ่ง', i: '📘', price: 400, desc: 'อ่านแล้วจีบเก่งขึ้น: คุยถูกใจได้หัวใจเพิ่ม 20% ถาวร', use: () => { S.perk = S.perk || {}; if (S.perk.love) return 'อ่านแล้ว'; S.perk.love = 1; } },
  book_animal: { n: 'คู่มือเลี้ยงสัตว์', i: '📙', price: 1200, desc: 'อ่านแล้วสัตว์มีความสุขเพิ่มขึ้นทุกวัน', use: () => { S.perk = S.perk || {}; if (S.perk.animal) return 'อ่านแล้ว'; S.perk.animal = 1; } },
  chocolate: { n: 'ช็อกโกแลตกล่องหัวใจ', i: '🍫', price: 280, desc: 'ของขวัญ: ให้คนที่จีบได้หัวใจ +1.5', gift: 1.5 },
  perfume: { n: 'น้ำหอมกลิ่นมะลิ', i: '🧴', price: 1800, desc: 'ของขวัญชั้นดี: หัวใจ +2.5', gift: 2.5 },
  teddy: { n: 'ตุ๊กตาหมีตัวใหญ่', i: '🧸', price: 650, desc: 'ของขวัญ หรือให้ลูกเล่น: ความสุขลูก +30', gift: 1.5, kid: 30 },
  ball: { n: 'ลูกบอลเด็กเล่น', i: '⚽', price: 150, desc: 'ให้ลูกเล่น: ความสุขลูก +20', kid: 20 },
  shoes: { n: 'รองเท้าวิ่ง', i: '👟', price: 2200, desc: 'สวมแล้วเดินและวิ่งเร็วขึ้นถาวร 10%', use: () => { S.perk = S.perk || {}; if (S.perk.shoes) return 'ใส่อยู่แล้ว'; S.perk.shoes = 1; } },
};
for (const id in GOODS) { ITEMS[id] = { n: GOODS[id].n, i: GOODS[id].i, cat: 'tool' }; TOOLS[id] = { n: GOODS[id].n, i: GOODS[id].i, price: GOODS[id].price, desc: GOODS[id].desc }; }
for (const id in WEAR) TOOLS['wear_' + id] = { n: WEAR[id].n, i: WEAR[id].i, price: WEAR[id].price, desc: 'เครื่องประดับ สวมใส่ได้จากกระเป๋า' };
// furniture sold in the electronics department (used at home, see home.js)
Object.assign(FURN, { aircon: { n: 'แอร์ประหยัดไฟ', i: '❄️', price: 9000 }, fan: { n: 'พัดลมตั้งพื้น', i: '🌀', price: 900 }, radio: { n: 'วิทยุเก่าคลาสสิก', i: '📻', price: 1200 }, console: { n: 'เครื่องเล่นเกม', i: '🎮', price: 7500 }, washer: { n: 'เครื่องซักผ้า', i: '🧺', price: 6500 }, bike: { n: 'จักรยานออกกำลังกาย', i: '🚴', price: 5500 } });
MOVABLE.push('fan', 'radio', 'console', 'washer', 'bike');
// restaurant menus
const MENU = {
  restaurant: [
    ['อาหารจานเดียว', [['kapao', 'กะเพราหมูกรอบไข่ดาว', '🍳', 70, 32], ['chicken', 'ข้าวมันไก่', '🍗', 60, 30], ['padthai', 'ผัดไทยกุ้งสด', '🍤', 90, 35], ['greencurry', 'แกงเขียวหวานไก่', '🍛', 85, 34]]],
    ['ก๋วยเตี๋ยว & ต้ม', [['boat', 'ก๋วยเตี๋ยวเรือ', '🍜', 50, 25], ['tomyum', 'ต้มยำกุ้งน้ำข้น', '🥘', 150, 45]]],
    ['ของหวาน & เครื่องดื่ม', [['mango', 'ข้าวเหนียวมะม่วง', '🥭', 80, 28], ['thaitea', 'ชาไทยเย็น', '🧋', 40, 15], ['coconut', 'น้ำมะพร้าวปั่น', '🥥', 45, 18], ['bingsu', 'บิงซูสตรอว์เบอร์รี', '🍧', 120, 30]]],
  ],
  seafood: [
    ['ทะเลสด', [['grillfish', 'ปลากะพงเผาเกลือ', '🐟', 280, 60], ['crab', 'ปูผัดผงกะหรี่', '🦀', 350, 70], ['prawn', 'กุ้งเผาริมหาด', '🦐', 240, 55], ['squid', 'หมึกย่างน้ำจิ้มซีฟู้ด', '🦑', 180, 45]]],
    ['เครื่องดื่ม', [['coconut', 'น้ำมะพร้าวปั่น', '🥥', 45, 18], ['thaitea', 'ชาไทยเย็น', '🧋', 40, 15]]],
  ],
};
for (const shop in MENU) for (const [, items] of MENU[shop]) for (const [id, n, i, price, en] of items) { FOODS[id] = FOODS[id] || { n, i, price, en }; ITEMS['food_' + id] = { n, i, en, cat: 'dish' }; }
const MALL = [
  ['👗 แฟชั่น & เครื่องประดับ', ['tool:wear_cowboy', 'tool:wear_beanie', 'tool:wear_crown', 'tool:wear_sunglasses', 'tool:wear_glasses', 'tool:wear_scarf', 'tool:wear_backpack']],
  ['💍 จิวเวลรี่', ['tool:wear_necklace', 'tool:wear_pearl', 'tool:wear_watch', 'tool:wear_bracelet', 'tool:ring']],
  ['📺 เครื่องใช้ไฟฟ้า', ['furn:tv', 'furn:aircon', 'furn:fan', 'furn:radio', 'furn:console', 'furn:washer', 'furn:bike']],
  ['💊 ยา & สุขภาพ', ['tool:vitamin', 'tool:balm', 'tool:shoes']],
  ['📚 ร้านหนังสือ', ['tool:book_farm', 'tool:book_cook', 'tool:book_animal', 'tool:book_love']],
  ['🎁 ของขวัญ & ของเล่น', ['tool:chocolate', 'tool:perfume', 'tool:teddy', 'tool:ball', 'tool:bouquet']],
  ['🛋️ ของแต่งบ้าน', ['furn:sofa', 'furn:table', 'furn:lamp', 'furn:painting', 'furn:plant', 'furn:flowers']],
];
SHOPS.mall = { n: 'สุขใจพลาซ่า', tabs: MALL.map(([n, items]) => ({ n, items })) };

const Wear = {
  // builds the accessory meshes on a character (hand-built or avatar)
  apply(obj) {
    if (!obj) return;
    if (obj.userData.wearG) obj.userData.wearG.forEach(g => g.parent && g.parent.remove(g));
    obj.userData.wearG = [];
    const raw = S.wear || {}, av = obj.userData.av, w = {}, C2 = k => raw[k] && WEAR[raw[k]] && WEAR[raw[k]].c;
    for (const k in raw) if (raw[k]) w[k] = (WEAR[raw[k]] && WEAR[raw[k]].shape) || raw[k];
    const mount = (bone, fallbackY) => {
      const g = new THREE.Group();
      let b = null;
      if (av) { const s = Avatars.src[obj.userData.avName]; const bb = s && s.bones[bone]; b = bb && obj.getObjectByName(bb.name); }
      else if (bone === 'head') b = obj.userData.head;
      if (b) { obj.updateMatrixWorld(true); const ws = b.getWorldScale(new THREE.Vector3()).x || 1; g.scale.setScalar((av ? 0.62 : 1) / ws); b.add(g); }
      else { g.position.y = fallbackY; obj.add(g); }
      obj.userData.wearG.push(g); return g;
    };
    const toonH = obj.userData.toon, hy = av ? 0.3 : toonH ? 0.36 : 0.15;
    if (w.head) {
      const g = mount('head', 1.75);
      if (w.head === 'cowboy') { U.mk(g, GEO.cyl, mc(C2('head') ?? 0x8d5a2b, { roughness: 0.8 }), [0, hy + 0.08, 0], [0.34, 0.03, 0.34]); U.mk(g, GEO.cyl, mc(C2('head') ?? 0x8d5a2b), [0, hy + 0.17, 0], [0.18, 0.18, 0.18]); U.mk(g, GEO.cyl, mc(0x3e2723), [0, hy + 0.12, 0], [0.185, 0.04, 0.185]); }
      if (w.head === 'beanie') U.mk(g, GEO.sph, mc(C2('head') ?? 0xc62828, { roughness: 1 }), [0, hy + 0.08, 0], [0.17, 0.13, 0.17]);
      if (w.head === 'crown') for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; U.mk(g, GEO.sphLo, mc(C2('head') ?? [0xf48fb1, 0xfff176, 0xffffff][i % 3]), [Math.cos(a) * 0.15, hy + 0.06, Math.sin(a) * 0.15], 0.04); }
    }
    if (w.face) {
      const g = mount('head', 1.6), fz = av ? 0.17 : toonH ? 0.24 : 0.16, c = C2('face') ?? (w.face === 'sunglasses' ? 0x111111 : 0xd4a017);
      for (const s of [-1, 1]) U.mk(g, GEO.box, mc(c, { roughness: 0.2, metalness: 0.5 }), [s * 0.055, hy - 0.06, fz], [0.08, 0.045, 0.01]);
      U.mk(g, GEO.box, mc(c, { metalness: 0.5 }), [0, hy - 0.05, fz], [0.04, 0.01, 0.01]);
    }
    if (w.neck) {
      const g = mount('neck', 1.45), col = C2('neck') ?? w.neck === 'necklace' ? (C2('neck') ?? 0xe0b13a) : w.neck === 'pearl' ? 0xf5f5f0 : 0xc62828;
      const m = U.mk(g, new THREE.TorusGeometry(0.11, w.neck === 'scarf' ? 0.035 : 0.012, 6, 24), mc(col, { roughness: 0.3, metalness: w.neck === 'necklace' ? 0.7 : 0.1 }), [0, -0.02, 0.02]); m.rotation.x = Math.PI / 2 + 0.25;
    }
    if (w.back) { const g = mount(av ? 'chest' : 'none', 1.2); U.mk(g, GEO.box, mc(C2('back') ?? 0x2e7d32, { roughness: 0.9 }), [0, 0.05, -0.17], [0.3, 0.38, 0.16]); }
    if (w.wrist) { const g = mount(av ? 'leftHand' : 'none', 0.9); U.mk(g, GEO.cyl, mc(C2('wrist') ?? (w.wrist === 'watch' ? 0x37474f : 0x43a047), { metalness: 0.4, roughness: 0.3 }), [0, 0, 0], [0.045, 0.03, 0.045]); }
  },
  equip(id) { const W = WEAR[id]; S.wear = S.wear || {}; S.wear[W.slot] = S.wear[W.slot] === id ? null : id; this.apply(G.player.obj); Sfx.click(); },
};

const Food = {
  open(shop) {
    UI.open(SHOPS[shop].n + ' · เมนู', MENU[shop].map(c => c[0]), tab => {
      const [, items] = MENU[shop][tab];
      return `<p class="lead">🍽️ ทานที่ร้าน: นั่งกินร้อน ๆ ได้พลังงาน +20% และความสุข · 🥡 สั่งกลับบ้าน: ได้กล่องอาหารไว้กินทีหลัง (+10 ฿ ค่ากล่อง)</p><div class="grid">${items.map(([id, n, i, price, en]) => `<div class="card"><div class="ci">${i}</div><div class="cb"><h4>${n}</h4><p>${baht(price)} · พลังงาน +${en}</p><div class="row"><button class="btn" data-a="dine" data-id="${id}" data-s="${shop}">🍽️ ทานที่ร้าน</button><button class="btn ghost" data-a="takeaway" data-id="${id}">🥡 กลับบ้าน ${baht(price + 10)}</button></div></div></div>`).join('')}</div>`;
    }, { wide: true });
  },
  dine(id) {
    const F = FOODS[id]; if (S.money < F.price) { UI.toast('เงินไม่พอ', '💸'); return; }
    S.money -= F.price; UI.close();
    const partner = Social.st().partner, withLove = partner && Social.st().stage !== null && G.npcs.find(n => n.name === partner && Math.hypot(n.x - G.player.pos.x, n.z - G.player.pos.z) < 30);
    playAct('sit', 2.5, true);
    fade(() => {
      tick(30); S.energy = Math.min(maxEnergy(), S.energy + Math.round(F.en * 1.2)); Prog.add(3); Sfx.coin();
      if (withLove) Friends.add(partner, 0.3);
      UI.toast(`นั่งทาน${F.n}ที่ร้าน อร่อยมาก! พลังงาน +${Math.round(F.en * 1.2)}${withLove ? ` · ${partner}มานั่งกินด้วย ❤️` : ''}`, F.i);
    });
  },
  takeaway(id) { const F = FOODS[id]; if (S.money < F.price + 10) { UI.toast('เงินไม่พอ', '💸'); return; } S.money -= F.price + 10; addItem('food_' + id); Sfx.coin(); UI.toast(`ได้${F.n}แบบกล่องแล้ว ดูได้ในกระเป๋า`, '🥡'); },
  // phone delivery: arrives at the house after an in-game hour
  deliveryHTML() {
    const all = MENU.restaurant.flatMap(c => c[1]);
    return `<p class="lead">สั่งจากร้านป้าแดง ค่าส่ง 40 ฿ ไรเดอร์ส่งถึงบ้านภายใน 1 ชั่วโมงในเกม</p>${(S.deliv || []).length ? `<p class="lead good">กำลังจัดส่ง ${S.deliv.length} รายการ</p>` : ''}<div class="grid">${all.map(([id, n, i, price]) => `<div class="card"><div class="ci">${i}</div><div class="cb"><h4>${n}</h4><p>${baht(price + 40)}</p><div class="row"><button class="btn" data-a="deliver2" data-id="${id}">สั่งเลย</button></div></div></div>`).join('')}</div>`;
  },
  order(id) { const F = FOODS[id]; if (S.money < F.price + 40) { UI.toast('เงินไม่พอ', '💸'); return; } S.money -= F.price + 40; (S.deliv = S.deliv || []).push({ id, at: S.day * 1440 + S.time + 60 }); UI.toast(`สั่ง${F.n}แล้ว ไรเดอร์กำลังไป`, '🛵'); },
  update() {
    if (!S.deliv || !S.deliv.length) return;
    const now = S.day * 1440 + S.time;
    for (const d of S.deliv.slice()) if (now >= d.at) { S.deliv.splice(S.deliv.indexOf(d), 1); { const a0 = G.acq; G.acq = 'o'; try { addItem('food_' + d.id); } finally { G.acq = a0; } } Phone.msg('ไรเดอร์สุขใจ', `${FOODS[d.id].n} ส่งถึงแล้ว วางไว้หน้าบ้านให้แล้วนะครับ (เข้ากระเป๋าแล้ว)`); }
  },
};

// the plaza fronts the main road; the two suburb houses that stood here moved further along the street
FLAT_PADS.push({ x: -26, z: -112, r: 14 });
const Mall = {
  build() {
    const x = -26, z = -112, rot = Math.PI / 2;
    const o = { w: 20, d: 12, h: 7, rows: 2, flat: true, wall: 0xeceff1, roof: 0xcfd8dc, sign: 'สุขใจพลาซ่า', signStyle: { bg: '#6a1b9a', fg: '#fff' }, glassFront: true, winS: [-3, 0, 3], winB: [-6, -2, 2, 6], ww: 1.6, wh: 1.4 };
    const b = World.building(o); b.position.set(x, World.groundY(x, z), z); b.rotation.y = rot; World.outdoor.add(b);
    Col.box(x, z, o.w / 2 + 0.3, o.d / 2 + 0.3, rot, 'bld'); World.clearNear(x, z, 13, true);
    const f = new THREE.Group(); f.position.copy(b.position); f.rotation.y = rot; World.outdoor.add(f);
    U.mk(f, U.box(16, 0.1, 6, 2), texMat('paving', 0xd7ccc8), [0, 0.05, o.d / 2 + 3]);
    for (const s of [-1, 1]) { U.mk(f, GEO.cylLo, M.metal, [s * 7, 3, o.d / 2 + 0.3], [0.1, 6, 0.1]); const ban = new THREE.Mesh(new THREE.PlaneGeometry(1, 3.2), new THREE.MeshStandardMaterial({ color: s > 0 ? 0xab47bc : 0xff7043, side: THREE.DoubleSide })); ban.position.set(s * 7 + 0.55, 4.2, o.d / 2 + 0.3); f.add(ban); }
    const door = l2w(x, z, rot, 0, o.d / 2 + 2);
    World.pois.push({ kind: 'shop', id: 'mall', x: door.x, z: door.z, r: 3, label: 'สุขใจพลาซ่า', icon: '🛍️', map: true });
    const sp = l2w(x, z, rot, 2, o.d / 2 + 0.8), k = Models.human({ avatar: 'toon:jacket' }); k.position.set(sp.x, World.groundY(sp.x, sp.z), sp.z); k.rotation.y = rot; World.dyn.add(k);
    G.npcs.push({ obj: k, name: 'พี่หญิง', rot, speed: 0, timer: 0, st: 'idle', wave: 0, fixed: true, x: sp.x, z: sp.z, tx: sp.x, tz: sp.z, hx: sp.x, hz: sp.z, hrot: rot, keeper: 'mall' });
  },
};
UI.H.dine = d => Food.dine(d.id);
UI.H.takeaway = d => Food.takeaway(d.id);
UI.H.deliver2 = d => Food.order(d.id);
UI.H.wear = d => Wear.equip(d.id);
UI.H.usegood = d => {
  const G_ = GOODS[d.id]; if (!G_ || !count(d.id)) return;
  if (G_.kid) { const k = Social.st().kids[0]; if (!k) { UI.toast('ยังไม่มีลูกให้เล่นด้วย', '🧸'); return; } takeItem(d.id); k.joy = Math.min(100, (k.joy ?? 60) + G_.kid); UI.toast(`${k.name}ดีใจมาก! ความสุข +${G_.kid}`, G_.i); return; }
  const r = G_.use && G_.use(); if (r) { UI.toast(r, G_.i); return; }
  takeItem(d.id); UI.toast(`ใช้${G_.n}แล้ว`, G_.i); Sfx.pop && Sfx.pop();
};
// restaurants open the dine-in menu instead of the plain shop list
const _shop = UI.shop.bind(UI);
UI.shop = function (id) { if (MENU[id]) return Food.open(id); return _shop(id); };
