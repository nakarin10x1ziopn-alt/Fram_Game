'use strict';
// ---------- Village shops (convenience store + florist) and the shared HUD line ----------
// v246: the competitions (car time trial, fishing derby, cooking and animal shows) and the contest board are gone.

FOODS.sandwich = { n: 'แซนด์วิชแฮมชีส', i: '🥪', price: 45, en: 18 };
FOODS.energy = { n: 'เครื่องดื่มชูกำลัง', i: '🥤', price: 35, en: 25 };
FOODS.onigiri = { n: 'ข้าวปั้นไส้ทูน่า', i: '🍙', price: 30, en: 15 };
FOODS.cake = { n: 'เค้กสตรอว์เบอร์รี', i: '🍰', price: 120, en: 40 };
for (const id of ['sandwich', 'energy', 'onigiri', 'cake']) ITEMS['food_' + id] = { n: FOODS[id].n, i: FOODS[id].i, en: FOODS[id].en, cat: 'dish' };
FURN.flowers = { n: 'แจกันดอกไม้สด', i: '💐', price: 600 };
FURN.trophy2 = { n: 'ถ้วยแชมป์แข่งรถ', i: '🏆', price: 0 };   // kept: an old save may still own it
SHOPS.mart = { n: 'ร้านสะดวกซื้อสุขใจมาร์ท', tabs: [{ n: 'อาหาร & เครื่องดื่ม', items: ['food:sandwich', 'food:onigiri', 'food:energy', 'food:coffee', 'food:cake'] }, { n: 'ของใช้', items: ['tool:extinguisher', 'tool:feed', 'tool:fert'] }] };
SHOPS.florist = { n: 'ร้านดอกไม้บ้านมะลิ', tabs: [{ n: 'ดอกไม้', items: ['tool:bouquet', 'furn:flowers', 'furn:plant', 'seed:sunflower', 'seed:strawberry'] }] };

const Contests = {
  race: null, derby: null,
  st() { if (!S.contest) S.contest = { day: {}, best: {}, wins: 0 }; return S.contest; },
  init(scene) {
    this.scene = scene;
    const hud = document.createElement('div'); hud.id = 'raceHud'; hud.hidden = true; document.body.appendChild(hud); this.hud = hud;
    this.buildShops();
  },
  buildShops() {
    const mk = (x, z, rot, o, shop, icon) => {
      const b = World.building(o); b.position.set(x, World.groundY(x, z), z); b.rotation.y = rot; World.outdoor.add(b);
      Col.box(x, z, o.w / 2 + 0.3, o.d / 2 + 0.3, rot, 'bld'); World.clearNear(x, z, 7, true);
      const door = l2w(x, z, rot, o.doorX || 0, o.d / 2 + 1.7);
      World.pois.push({ kind: 'shop', id: shop, x: door.x, z: door.z, r: 2.4, label: SHOPS[shop].n, icon, map: true });
      const k = Models.human({ skin: 0xf1c9a5, hair: 0x1b120c, shirt: 0x2e7d32, pants: 0x34507a, avatar: shop === 'mart' ? 'Olivia' : 'Erika' });
      const sp = l2w(x, z, rot, 1.6, o.d / 2 + 0.6); k.position.set(sp.x, World.groundY(sp.x, sp.z), sp.z); k.rotation.y = rot; World.dyn.add(k);
      G.npcs.push({ obj: k, name: shop === 'mart' ? 'พี่โอ๋มาร์ท' : 'ป้ามะลิวัลย์', rot, speed: 0, timer: 0, st: 'idle', wave: 0, fixed: true, x: sp.x, z: sp.z, tx: sp.x, tz: sp.z, hx: sp.x, hz: sp.z, hrot: rot, keeper: shop });
    };
    mk(15, -70, -Math.PI / 2, { w: 9, d: 7, h: 3.6, flat: true, wall: 0xf5f5f5, roof: 0xe0e0e0, sign: 'สุขใจมาร์ท 24 ชม.', signStyle: { bg: '#2e7d32', fg: '#fff' }, glassFront: true, winS: [0], ww: 1.4, wh: 1.2, awning: 0xff7043 }, 'mart', '🏪');
    mk(-15, -70, Math.PI / 2, { w: 8, d: 6.5, h: 3.4, roofH: 2.2, wallTex: 'wood', wall: 0xf8e1e7, roof: 0x8e3b5a, sign: 'ร้านดอกไม้บ้านมะลิ', signStyle: { bg: '#ad1457' }, awning: 0xf06292, flowers: true, pots: true, winF: [-2.4, 2.4], winS: [0] }, 'florist', '💐');
  },
  onFish() { },
  update() { },
};
