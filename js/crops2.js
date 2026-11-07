'use strict';
// ---------- crops2: a big new seed catalogue ----------
//  • 30 vegetables, herbs, roots and mushrooms      (planted in the field beds, like the old vegetables)
//  • 25 fruit plants: melons, grapes, berries, dragon fruit, bananas, papaya, pineapples (field beds)
//  • 28 fruit, nut and bean trees                   (planted in the orchard pits, give several fruit again and again)
// All of them are real entries of CROPS: they grow, are harvested, sold (with star quality), cooked and processed like the old ones, have a 3D model for every
// growth stage, and are on sale in the seed shops (ร้านเกษตรรุ่งเรือง, the online shop, the rare plants shop and the phone shop).
// loaded right after models.js: the plant models of the new crops are built here and plugged into Models.cropOne / Models.fruitTree.
(function () {
  const NEW = [];
  // field crops: id, name, icon, look, product colour, leaf colour, seed price, sell price, grow hours, regrow hours, energy, farmer level, season, fruit shape
  const F = (grp, id, n, i, look, col, lf, seed, sell, grow, regrow, en, lvl, season, fs) => {
    CROPS[id] = Object.assign({ n, i, seed, sell, grow, en, grp, look, col, lf, fs }, regrow ? { regrow } : {});
    SEED_LVL[id] = lvl; if (season) CROP_SEASON[id] = season; NEW.push(id);
  };
  // trees: id, name, icon, fruit colour, leaf colour, sapling price, sell price per fruit, grow hours, regrow hours, fruit per harvest, energy, farmer level, season, shape, size, where the fruit hangs
  const T = (id, n, i, col, lf, seed, sell, grow, regrow, yld, en, lvl, season, shape, size, fpos) => {
    CROPS[id] = { n, i, seed, sell, grow, regrow, en, tree: true, yield: yld, grp: 'tree', look: 'tree', col, lf, shape: shape || 'round', size: size || 1, fpos: fpos || 'crown' };
    SEED_LVL[id] = lvl; if (season) CROP_SEASON[id] = season; NEW.push(id);
  };

  // ===== 30 vegetables, herbs, roots =====
  F('veg', 'lettuce', 'ผักกาดหอม', '🥬', 'head', 0x9be36a, 0x6ec44f, 10, 40, 4, 0, 5, 1, 'cool');
  F('veg', 'bokchoy', 'ผักกวางตุ้ง', '🥬', 'head', 0x7fc24f, 0x5aa83a, 8, 35, 4, 0, 5, 1, 'cool');
  F('veg', 'napa', 'ผักกาดขาว', '🥬', 'head', 0xdfeab0, 0x8fc04a, 12, 55, 6, 0, 6, 2, 'cool');
  F('veg', 'kale', 'คะน้า', '🥬', 'head', 0x2f7d32, 0x2f7d32, 12, 45, 5, 2.5, 6, 2, 'cool');
  F('veg', 'waterspinach', 'ผักบุ้ง', '🌿', 'herb', 0x5fb34a, 0x4f9a3a, 6, 30, 3, 1.5, 4, 1, 'rain');
  F('veg', 'broccoli', 'บรอกโคลี', '🥦', 'head', 0x2e8b3c, 0x2d7a35, 25, 85, 8, 0, 8, 3, 'cool');
  F('veg', 'cauliflower', 'กะหล่ำดอก', '🥦', 'head', 0xf3efe2, 0x6fa545, 25, 90, 9, 0, 8, 3, 'cool');
  F('veg', 'cucumber', 'แตงกวา', '🥒', 'vine', 0x3f8f3a, 0x3c8a34, 12, 45, 6, 3, 5, 2, 'hot', 'long');
  F('veg', 'yardlongbean', 'ถั่วฝักยาว', '🌱', 'bush', 0x6bb04a, 0x4f9a3a, 12, 50, 7, 3.5, 6, 3, 'rain');
  F('veg', 'waxgourd', 'ฟักเขียว', '🥒', 'vine', 0xb7d58a, 0x4a9a3a, 14, 60, 10, 0, 10, 4, 'rain', 'long');
  F('veg', 'luffa', 'บวบ', '🥒', 'vine', 0x7bbd4a, 0x4a9a3a, 12, 45, 8, 4, 6, 3, 'rain', 'long');
  F('veg', 'bittermelon', 'มะระ', '🥒', 'vine', 0x5f9f3f, 0x4a9a3a, 14, 60, 8, 4, 6, 3, 'hot', 'long');
  F('veg', 'okra', 'กระเจี๊ยบเขียว', '🌿', 'bush', 0x7bbd4a, 0x3f8f3a, 14, 60, 7, 3.5, 5, 3, 'hot');
  F('veg', 'bellpepper', 'พริกหยวก', '🌶️', 'bush', 0x6bbd4a, 0x3f8f3a, 18, 65, 7, 3.5, 5, 3, 'hot');
  F('veg', 'bigchili', 'พริกชี้ฟ้า', '🌶️', 'bush', 0xd61f1f, 0x3f8f3a, 18, 70, 7, 3.5, 3, 3, 'hot');
  F('veg', 'thaieggplant', 'มะเขือเปราะ', '🍆', 'bush', 0xe8f0c8, 0x3f8f3a, 16, 50, 7, 3.5, 6, 3, 'rain');
  F('veg', 'radish', 'หัวไชเท้า', '🥕', 'root', 0xf5f0e8, 0x5aa83a, 8, 40, 5, 0, 6, 1, 'cool');
  F('veg', 'onion', 'หอมหัวใหญ่', '🧅', 'root', 0xd9a3c9, 0x6fb14f, 14, 60, 8, 0, 8, 3, 'cool');
  F('veg', 'garlic', 'กระเทียม', '🧄', 'root', 0xf3efe2, 0x7fc15a, 20, 85, 9, 0, 6, 4, 'cool');
  F('veg', 'potato', 'มันฝรั่ง', '🥔', 'root', 0xc9a36b, 0x4f9a4a, 14, 60, 9, 0, 10, 3, 'cool');
  F('veg', 'sweetpotato', 'มันเทศ', '🍠', 'root', 0xc0603a, 0x5aa650, 12, 55, 9, 0, 10, 3, 'rain');
  F('veg', 'ginger', 'ขิง', '🌱', 'root', 0xe7c98a, 0x6fb14f, 20, 90, 10, 0, 5, 4, 'rain');
  F('veg', 'galangal', 'ข่า', '🌱', 'root', 0xf0d9a8, 0x6fb14f, 18, 80, 10, 0, 5, 4, 'rain');
  F('veg', 'turmeric', 'ขมิ้น', '🌱', 'root', 0xf2a41a, 0x6fb14f, 18, 80, 10, 0, 5, 4, 'rain');
  F('veg', 'beet', 'บีทรูท', '🥕', 'root', 0x8e1f4a, 0x5aa83a, 16, 70, 8, 0, 8, 4, 'cool');
  F('veg', 'lemongrass', 'ตะไคร้', '🌿', 'stalk', 0xa8c75a, 0x7fb04a, 10, 40, 6, 3, 4, 2, 'rain');
  F('veg', 'holybasil', 'กะเพรา', '🌿', 'herb', 0x2f9e44, 0x2f9e44, 6, 30, 4, 2, 3, 1, 'hot');
  F('veg', 'mint', 'สะระแหน่', '🌿', 'herb', 0x6fd08a, 0x4fbf6a, 8, 35, 4, 2, 3, 1, 'cool');
  F('veg', 'coriander', 'ผักชี', '🌿', 'herb', 0x5fb34a, 0x4f9a3a, 8, 35, 4, 0, 3, 1, 'cool');
  F('veg', 'oystermushroom', 'เห็ดนางฟ้า', '🍄', 'mush', 0xf1e6cf, 0xf1e6cf, 15, 80, 6, 3, 6, 2, null);

  // ===== 25 fruit plants (field beds) =====
  F('fruit', 'melon', 'เมลอน', '🍈', 'vine', 0xe9c46a, 0x4a9a3a, 70, 260, 16, 0, 15, 8, 'hot', 'round');
  F('fruit', 'cantaloupe', 'แคนตาลูป', '🍈', 'vine', 0xf0a15a, 0x4a9a3a, 65, 230, 15, 0, 14, 7, 'hot', 'round');
  F('fruit', 'honeydew', 'ฮันนี่ดิว', '🍈', 'vine', 0xcfe8a0, 0x4a9a3a, 65, 230, 15, 0, 14, 7, 'hot', 'round');
  F('fruit', 'goldmelon', 'เมลอนทอง', '🍈', 'vine', 0xf2c744, 0x4a9a3a, 80, 300, 16, 0, 15, 9, 'hot', 'round');
  F('fruit', 'japanmelon', 'เมลอนญี่ปุ่น', '🍈', 'vine', 0xb8e08a, 0x4a9a3a, 110, 420, 18, 0, 18, 11, 'hot', 'round');
  F('fruit', 'yellowwatermelon', 'แตงโมเหลือง', '🍉', 'vine', 0xf2d04a, 0x3f9a4a, 70, 260, 17, 0, 16, 8, 'hot', 'round');
  F('fruit', 'seedlesswatermelon', 'แตงโมไร้เมล็ด', '🍉', 'vine', 0x3f9a4a, 0x3f9a4a, 85, 320, 18, 0, 18, 9, 'hot', 'round');
  F('fruit', 'greengrape', 'องุ่นเขียว', '🍇', 'grape', 0x9ccf4a, 0x3f8f3a, 90, 150, 14, 5, 10, 9, 'cool');
  F('fruit', 'redgrape', 'องุ่นแดง', '🍇', 'grape', 0xb02a4a, 0x3f8f3a, 95, 160, 14, 5, 10, 10, 'cool');
  F('fruit', 'blackgrape', 'องุ่นดำ', '🍇', 'grape', 0x3a1f5c, 0x3f8f3a, 100, 170, 14, 5, 11, 11, 'cool');
  F('fruit', 'whitedragon', 'แก้วมังกรเนื้อขาว', '🌵', 'cactus', 0xe0457a, 0x4f9a4a, 60, 110, 16, 6, 12, 8, 'hot');
  F('fruit', 'reddragon', 'แก้วมังกรเนื้อแดง', '🌵', 'cactus', 0xb3125a, 0x4f9a4a, 75, 140, 16, 6, 12, 10, 'hot');
  F('fruit', 'passionfruit', 'เสาวรส', '🟣', 'grape', 0x7a3b8f, 0x3f8f3a, 60, 100, 12, 4, 10, 8, 'rain');
  F('fruit', 'kiwi', 'กีวี', '🥝', 'grape', 0x8a7a3a, 0x3f8f3a, 95, 160, 16, 6, 12, 12, 'cool');
  F('fruit', 'blueberry', 'บลูเบอร์รี', '🫐', 'berry', 0x3a4fa8, 0x3f8f3a, 90, 140, 12, 4.5, 8, 9, 'cool');
  F('fruit', 'raspberry', 'ราสป์เบอร์รี', '🍓', 'berry', 0xc2185b, 0x3f8f3a, 85, 130, 11, 4.5, 8, 9, 'cool');
  F('fruit', 'blackberry', 'แบล็กเบอร์รี', '🫐', 'berry', 0x2a1a3a, 0x3f8f3a, 80, 125, 11, 4.5, 8, 9, 'cool');
  F('fruit', 'mulberry', 'หม่อน', '🍇', 'berry', 0x5a1f5c, 0x3f8f3a, 50, 90, 9, 4, 8, 6, 'rain');
  F('fruit', 'cherrytomato', 'มะเขือเทศเชอร์รี', '🍒', 'berry', 0xe0342a, 0x3f8f3a, 40, 80, 8, 4, 7, 5, 'rain');
  F('fruit', 'banana', 'กล้วยหอม', '🍌', 'palm', 0xf5d63c, 0x5aa63f, 55, 120, 18, 8, 14, 6, 'rain', 'banana');
  F('fruit', 'namwabanana', 'กล้วยน้ำว้า', '🍌', 'palm', 0xe8c93a, 0x5aa63f, 45, 100, 17, 8, 14, 5, 'rain', 'banana');
  F('fruit', 'eggbanana', 'กล้วยไข่', '🍌', 'palm', 0xf2dc4a, 0x5aa63f, 50, 110, 17, 8, 14, 6, 'rain', 'banana');
  F('fruit', 'papaya', 'มะละกอ', '🍈', 'palm', 0xf08a2a, 0x4a9a3a, 40, 90, 15, 6, 12, 5, 'hot', 'papaya');
  F('fruit', 'phuketpineapple', 'สับปะรดภูเก็ต', '🍍', 'pine', 0xf4c430, 0x5f8f4a, 70, 150, 20, 0, 12, 10, 'hot');
  F('fruit', 'smallpineapple', 'สับปะรดนางแล', '🍍', 'pine', 0xf0b820, 0x5f8f4a, 85, 180, 20, 0, 12, 12, 'hot');

  // ===== 28 fruit, nut and bean trees (orchard pits) =====
  T('durian', 'ทุเรียน', '🍈', 0xc9b84a, 0x2f6f2a, 1300, 420, 40, 14, 3, 20, 20, 'hot', 'tall', 1.3, 'crown');
  T('rambutan', 'เงาะ', '🍒', 0xd9262c, 0x3f7d2a, 600, 80, 30, 10, 5, 8, 13, 'hot', 'round', 1.0);
  T('mangosteen', 'มังคุด', '🍇', 0x5a1f5c, 0x2f6f2a, 800, 130, 34, 11, 4, 8, 14, 'rain', 'round', 1.0);
  T('longan', 'ลำไย', '🟤', 0xb8895a, 0x3f7d2a, 550, 75, 28, 9, 6, 8, 12, 'rain', 'round', 1.0);
  T('lychee', 'ลิ้นจี่', '🍒', 0xe04a4a, 0x3f7d2a, 650, 95, 30, 10, 5, 8, 14, 'hot', 'round', 1.0);
  T('jackfruit', 'ขนุน', '🥭', 0xc9a83a, 0x2f6f2a, 700, 170, 36, 12, 2, 18, 15, 'hot', 'tall', 1.25, 'trunk');
  T('pomelo', 'ส้มโอ', '🍊', 0xd8d05a, 0x3f7d2a, 650, 90, 30, 10, 4, 10, 12, 'rain', 'round', 1.05);
  T('lime', 'มะนาว', '🍋', 0x9ccf3a, 0x3f7d2a, 250, 35, 20, 6, 8, 5, 6, 'rain', 'low', 0.8);
  T('coconut', 'มะพร้าว', '🥥', 0x8a6a3a, 0x3f8f3a, 550, 45, 32, 9, 5, 10, 11, 'hot', 'palm', 1.2);
  T('guava', 'ฝรั่ง', '🍐', 0xa8d060, 0x3f7d2a, 300, 40, 20, 6, 6, 8, 7, 'rain', 'low', 0.85);
  T('roseapple', 'ชมพู่', '🍎', 0xe8527a, 0x3f7d2a, 350, 50, 22, 7, 6, 7, 8, 'hot', 'low', 0.9);
  T('starfruit', 'มะเฟือง', '⭐', 0xe8d040, 0x3f7d2a, 350, 45, 22, 7, 6, 7, 8, 'rain', 'low', 0.9);
  T('tamarind', 'มะขาม', '🟤', 0x8a5a3a, 0x3f7d2a, 400, 60, 26, 8, 6, 6, 10, 'cool', 'round', 1.1);
  T('sapodilla', 'ละมุด', '🟤', 0xb88a5a, 0x2f6f2a, 450, 55, 26, 8, 5, 8, 10, 'cool', 'round', 1.0);
  T('santol', 'กระท้อน', '🟡', 0xe0b83a, 0x3f7d2a, 450, 50, 26, 8, 5, 8, 10, 'rain', 'round', 1.05);
  T('langsat', 'ลองกอง', '🟡', 0xe6c870, 0x2f6f2a, 700, 100, 32, 10, 5, 8, 15, 'rain', 'round', 1.0);
  T('custardapple', 'น้อยหน่า', '🍏', 0x9ac060, 0x3f7d2a, 450, 90, 24, 8, 4, 9, 11, 'hot', 'low', 0.9);
  T('pomegranate', 'ทับทิม', '🍎', 0xc0262c, 0x3f7d2a, 500, 100, 26, 8, 4, 8, 12, 'hot', 'low', 0.9);
  T('jujube', 'พุทรา', '🍏', 0xb8c85a, 0x4f8f3a, 280, 45, 18, 6, 8, 6, 7, 'cool', 'low', 0.85);
  T('persimmon', 'ลูกพลับ', '🍊', 0xf08a2a, 0x4f8f3a, 600, 85, 30, 10, 5, 8, 14, 'cool', 'round', 1.0);
  T('avocado', 'อะโวคาโด', '🥑', 0x3a5a2a, 0x2f6f2a, 900, 140, 34, 11, 4, 12, 16, 'cool', 'round', 1.1);
  T('coffee', 'กาแฟ', '☕', 0xc0262c, 0x2f6f2a, 400, 70, 24, 6, 8, 5, 9, 'cool', 'low', 0.85);
  T('cacao', 'โกโก้', '🍫', 0xd8a02a, 0x2f6f2a, 700, 110, 30, 9, 4, 8, 15, 'rain', 'low', 0.95, 'trunk');
  T('cashew', 'มะม่วงหิมพานต์', '🥜', 0xe8a02a, 0x3f7d2a, 600, 95, 28, 9, 5, 8, 13, 'hot', 'round', 1.05);
  T('peach', 'พีช', '🍑', 0xf2a07a, 0x4f8f3a, 800, 120, 28, 9, 5, 9, 17, 'cool', 'round', 0.95);
  T('apple', 'แอปเปิล', '🍎', 0xd62828, 0x3f7d2a, 900, 130, 30, 10, 5, 9, 18, 'cool', 'round', 1.0);
  T('fig', 'มะเดื่อ', '🍇', 0x6a2c5c, 0x4f8f3a, 650, 110, 26, 8, 5, 8, 16, 'hot', 'low', 0.95);
  T('olive', 'มะกอกฝรั่ง', '🫒', 0x5a6a2a, 0x6f8f5a, 750, 105, 32, 10, 5, 8, 17, 'hot', 'round', 0.95);

  // ===== register them like the old crops: items, star quality, seed items =====
  for (const id of NEW) {
    const c = CROPS[id];
    ITEMS[id] = { n: c.n, i: c.i, sell: c.sell, en: c.en, cat: 'crop' };
    ITEMS['seed_' + id] = { n: (c.tree ? 'ต้นกล้า' : 'เมล็ด') + c.n, i: c.i, cat: 'seed', seed: id, badge: c.tree ? '🌱' : '•' };
    for (const q of [1, 2]) { const b = ITEMS[id]; ITEMS[id + '@' + q] = Object.assign({}, b, { n: b.n + (q === 1 ? ' ★' : ' ★★'), sell: Math.round(b.sell * (q === 1 ? 1.25 : 1.5)), base: id, q }); }
  }
  // ===== seed shops =====
  const seeds = g => NEW.filter(id => CROPS[id].grp === g).map(id => 'seed:' + id);
  const veg = seeds('veg'), fruit = seeds('fruit'), trees = seeds('tree');
  if (typeof SHOPS !== 'undefined') {
    // new tabs go at the end: other modules address the first two tabs of the farm shop by number
    SHOPS.farmshop.tabs.push({ n: 'ผัก & สมุนไพร (30)', items: veg }, { n: 'ผลไม้ (25)', items: fruit }, { n: 'ต้นกล้าไม้ผล (28)', items: trees });
    if (SHOPS.online) SHOPS.online.tabs.push({ n: 'ผัก & ผลไม้เพิ่มเติม', items: veg.concat(fruit) }, { n: 'ต้นกล้าไม้ผล', items: trees });
    if (SHOPS.rare) SHOPS.rare.tabs[0].items.push(...trees);
  }
  // ===== bed layouts and 3D models =====
  const LAY = {
    root: [[-0.45, -0.55], [0.45, -0.55], [-0.45, 0], [0.45, 0], [-0.45, 0.55], [0.45, 0.55]], head: [[0.1, -0.55], [-0.1, 0], [0.1, 0.55]], herb: [[-0.4, -0.5], [0.4, -0.5], [0, 0], [-0.4, 0.5], [0.4, 0.5]],
    bush: [[0, -0.45], [0, 0.45]], vine: [[0, 0]], stalk: [[-0.4, -0.55], [0.4, 0], [-0.4, 0.55]], mush: [[-0.35, -0.4], [0.35, -0.4], [0, 0.05], [-0.35, 0.5], [0.35, 0.5]],
    pine: [[0, -0.45], [0, 0.45]], palm: [[0, 0]], grape: [[0, -0.4], [0, 0.45]], cactus: [[0, -0.45], [0, 0.45]], berry: [[-0.35, -0.45], [0.35, 0], [-0.35, 0.5]],
  };
  for (const id of NEW) if (!CROPS[id].tree) CROP_LAYOUT[id] = LAY[CROPS[id].look] || [[0, 0]];

  const dark = (hex, k) => { const r = (hex >> 16 & 255) * k, g = (hex >> 8 & 255) * k, b = (hex & 255) * k; return (r << 16) | (g << 8) | (b | 0); };
  function plant(type, stage, seed) {
    const c = CROPS[type], g = new THREE.Group(), R = U.rng(seed * 9973 + stage * 31 + 7);
    if (stage === 0) {
      U.mk(g, GEO.sphLo, mc(0x4a3220, { roughness: 1 }), [0, 0, 0], [0.2, 0.06, 0.2]);
      for (let i = 0; i < 3; i++) U.mk(g, GEO.sphLo, mc(0xd9c48a), [(R() - 0.5) * 0.15, 0.05, (R() - 0.5) * 0.15], 0.018);
      return g;
    }
    const f = stage === 1 ? 0.4 : stage === 2 ? 0.75 : 1, LG = cropMat(c.lf), LD = cropMat(dark(c.lf, 0.75)), col = mc(c.col, { roughness: 0.45 }), ST = mc(0x5b8a32, { roughness: 0.8 });
    const leaf = (mat, a, t, l, w, y, r0) => leafAt(g, mat, a, t, l, w, y, r0, GEO.leaf2);
    const ros = (n, mat, len, wid, tilt, y = 0, r0 = 0) => { for (let i = 0; i < n; i++) leaf(mat, i / n * TAU + R() * 0.4, tilt + (R() - 0.5) * 0.2, len * (0.85 + R() * 0.3), wid * 1.3, y, r0); };
    switch (c.look) {
      case 'root': {
        ros(stage === 1 ? 4 : 8, LG, 0.4 * f, 0.035, 1.0, 0.02);
        if (stage >= 2) { const s = stage === 3 ? 1 : 0.5; U.mk(g, GEO.sph, mc(c.col, { roughness: 0.55 }), [0, 0.045 * s, 0], [0.085 * s, 0.07 * s, 0.085 * s]); }
        break;
      }
      case 'head': {
        if (stage < 3) ros(stage === 1 ? 4 : 7, LG, 0.28 * f + 0.04, 0.13 * f, 0.45, 0.02);
        else { ros(8, LG, 0.34, 0.16, 0.3, 0.02); U.mk(g, GEO.sph, col, [0, 0.14, 0], [0.16, 0.14, 0.16]); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; U.mk(g, GEO.sph, col, [Math.cos(a) * 0.09, 0.2, Math.sin(a) * 0.09], 0.075); } }
        break;
      }
      case 'herb': ros(stage === 1 ? 5 : 9, LG, 0.2 * f + 0.04, 0.06 + 0.02 * f, 0.55, 0.02); if (stage === 3) for (let i = 0; i < 4; i++) U.mk(g, GEO.sphLo, col, [(R() - 0.5) * 0.12, 0.2 + R() * 0.06, (R() - 0.5) * 0.12], 0.03); break;
      case 'bush': {
        const hgt = 0.6 * f; U.mk(g, GEO.cylLo, ST, [0, hgt / 2, 0], [0.018, hgt, 0.018]);
        for (let t = 0; t < (stage === 1 ? 2 : 4); t++) ros(4, t % 2 ? LG : LD, 0.2 * f + 0.03, 0.07 * f + 0.02, 0.35, hgt * (0.25 + 0.2 * t));
        if (stage >= 2) { const N = stage === 3 ? 7 : 3, big = id => ['bellpepper', 'thaieggplant'].includes(id); for (let i = 0; i < N; i++) { const a = R() * TAU, rr = 0.07 + R() * 0.09, y = hgt * (0.3 + R() * 0.55); if (big(type)) U.mk(g, GEO.sph, col, [Math.cos(a) * rr, y, Math.sin(a) * rr], [0.045, 0.06, 0.045]); else U.mk(g, GEO.cone, col, [Math.cos(a) * rr, y, Math.sin(a) * rr], [0.014, 0.1, 0.014], [Math.PI + (R() - 0.5) * 0.7, 0, (R() - 0.5) * 0.7]); } }
        break;
      }
      case 'vine': {
        ros(stage === 1 ? 3 : 6, LG, 0.3 * f + 0.1, 0.16 * f + 0.04, 0.12, 0.02, 0.1 * f);
        if (stage >= 2) { const s = stage === 3 ? 1 : 0.45; if (c.fs === 'round') U.mk(g, GEO.sph, col, [0.04, 0.17 * s, 0], [0.19 * s, 0.17 * s, 0.19 * s]); else { for (let i = 0; i < (stage === 3 ? 3 : 1); i++) U.mk(g, GEO.sph, col, [(i - 1) * 0.2, 0.06 * s, 0.1 + i * 0.05], [0.055 * s, 0.055 * s, 0.17 * s], [0, 0.3 * i, 0]); } }
        break;
      }
      case 'stalk': { const hgt = 1.2 * f; U.mk(g, GEO.cylLo, mc(c.col), [0, hgt / 2, 0], [0.025, hgt, 0.025]); const n = stage === 1 ? 4 : 9; for (let i = 0; i < n; i++) leaf(i % 2 ? LG : LD, i * 2.4, 0.5 - i * 0.03, 0.5 * f + 0.1, 0.05, hgt * (0.1 + 0.8 * i / n)); break; }
      case 'mush': { const n = stage === 1 ? 2 : 4; for (let i = 0; i < n; i++) { const a = i / n * TAU + R(), rr = 0.04 + R() * 0.06, h = (0.06 + R() * 0.05) * (stage === 1 ? 0.6 : 1); U.mk(g, GEO.cylLo, mc(0xefe6d0), [Math.cos(a) * rr, h / 2, Math.sin(a) * rr], [0.014, h, 0.014]); U.mk(g, GEO.sph, col, [Math.cos(a) * rr, h + 0.005, Math.sin(a) * rr], [0.045 * f + 0.02, 0.025 * f + 0.012, 0.045 * f + 0.02]); } break; }
      case 'pine': { ros(10, LG, 0.45 * f + 0.05, 0.035, 0.6, 0.02); if (stage === 3) { U.mk(g, GEO.sph, col, [0, 0.24, 0], [0.11, 0.17, 0.11]); for (let i = 0; i < 7; i++) leaf(LG, i / 7 * TAU, 1.15, 0.2, 0.035, 0.38); } break; }
      case 'palm': {
        const hgt = 0.9 * f + 0.1; U.mk(g, GEO.cylLo, mc(c.fs === 'papaya' ? 0x9a8a5a : 0x7aa04a), [0, hgt / 2, 0], [0.05, hgt, 0.05]);
        for (let i = 0; i < (stage === 1 ? 3 : 6); i++) leaf(LG, i / 6 * TAU + R() * 0.3, 0.9 - 0.1 * (i % 2), 0.55 * f + 0.15, 0.17, hgt, 0.02);
        if (stage === 3) { if (c.fs === 'banana') for (let i = 0; i < 7; i++) U.mk(g, GEO.sph, col, [0.08 + (i % 3) * 0.04, hgt - 0.12 - i * 0.03, (i % 2) * 0.05 - 0.02], [0.025, 0.1, 0.025], [0.3, 0, 0.5]); else for (let i = 0; i < 5; i++) U.mk(g, GEO.sph, col, [Math.cos(i * 1.3) * 0.07, hgt - 0.07 - (i % 2) * 0.05, Math.sin(i * 1.3) * 0.07], [0.05, 0.08, 0.05]); }
        break;
      }
      case 'grape': {
        U.mk(g, GEO.cylLo, mc(0x6b4a2e), [0, 0.3 * f, 0], [0.02, 0.6 * f, 0.02]); for (let i = 0; i < (stage === 1 ? 3 : 7); i++) U.mk(g, GEO.sph, LG, [(R() - 0.5) * 0.3 * f, 0.25 * f + R() * 0.3 * f, (R() - 0.5) * 0.3 * f], [0.11 * f + 0.02, 0.07 * f + 0.02, 0.11 * f + 0.02]);
        if (stage === 3) for (let k = 0; k < 3; k++) for (let j = 0; j < 4; j++) U.mk(g, GEO.sph, col, [Math.cos(k * 2.1) * 0.14 + (j % 2) * 0.025, 0.3 - j * 0.04, Math.sin(k * 2.1) * 0.14], 0.032);
        break;
      }
      case 'cactus': {
        for (let i = 0; i < 3; i++) { const a = i * 2.1; U.mk(g, GEO.cylLo, mc(0x4f9a4a), [Math.cos(a) * 0.07 * f, 0.18 * f + i * 0.04, Math.sin(a) * 0.07 * f], [0.045, 0.36 * f + i * 0.08, 0.045], [Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35]); }
        if (stage === 3) for (let i = 0; i < 3; i++) { const a = i * 2.1; U.mk(g, GEO.sph, col, [Math.cos(a) * 0.16, 0.34 + i * 0.05, Math.sin(a) * 0.16], [0.06, 0.08, 0.06]); }
        break;
      }
      case 'berry': {
        for (let i = 0; i < (stage === 1 ? 3 : 6); i++) U.mk(g, GEO.sph, LG, [Math.cos(i * 1.1) * 0.12 * f, 0.15 * f + (i % 2) * 0.08, Math.sin(i * 1.1) * 0.12 * f], [0.1 * f + 0.03, 0.08 * f + 0.02, 0.1 * f + 0.03]);
        if (stage >= 2) { const N = stage === 3 ? 12 : 4; for (let i = 0; i < N; i++) { const a = R() * TAU, rr = 0.1 + R() * 0.1; U.mk(g, GEO.sph, col, [Math.cos(a) * rr, 0.1 + R() * 0.16, Math.sin(a) * rr], stage === 3 ? 0.028 : 0.016); } }
        break;
      }
      default: U.mk(g, GEO.sph, col, [0, 0.2, 0], 0.15);
    }
    return g;
  }
  function tree(type, stage, seed) {
    const c = CROPS[type], g = new THREE.Group(), R = U.rng(seed * 131 + 5), sz = c.size || 1, trunk = mc(c.shape === 'palm' ? 0x8a7a5a : 0x6b4a2e, { roughness: 0.95 }), fol = mc(c.lf, { roughness: 0.8 }), fol2 = mc(dark(c.lf, 0.85), { roughness: 0.8 }), fm = mc(c.col, { roughness: 0.4 });
    if (stage === 0) { U.mk(g, GEO.cylLo, trunk, [0, 0.3, 0], [0.025, 0.6, 0.025]); for (let i = 0; i < 4; i++) leafAt(g, fol, i * 1.6, 0.4, 0.2, 0.07, 0.55); return g; }
    const s = (stage === 1 ? 0.5 : 1) * sz;
    if (c.shape === 'palm') {
      U.mk(g, gcache('ptrunk', () => new THREE.CylinderGeometry(0.1, 0.17, 1, 9)), trunk, [0, 1.3 * s, 0], [s, 2.6 * s, s]);
      const top = 2.65 * s; for (let i = 0; i < 9; i++) leafAt(g, cropMat(c.lf), i / 9 * TAU, 0.75 + (i % 2) * 0.25, 1.9 * s, 0.34 * s, top, 0.05, GEO.leaf2);
      if (stage === 3) for (let i = 0; i < 5; i++) U.mk(g, GEO.sph, fm, [Math.cos(i * 1.3) * 0.2, top - 0.12 - (i % 2) * 0.08, Math.sin(i * 1.3) * 0.2], 0.14);
      return g;
    }
    const tall = c.shape === 'tall', low = c.shape === 'low', th = (tall ? 2.4 : low ? 1.1 : 1.8) * s, cy = th * 1.22, cr = (low ? 0.8 : tall ? 0.85 : 1) * s;
    U.mk(g, gcache('ftrunk', () => new THREE.CylinderGeometry(0.12, 0.2, 1, 9)), trunk, [0, th / 2, 0], [s, th, s]);
    const blobs = low ? [[0, 0, 0, 1], [0.55, -0.1, 0.2, 0.7], [-0.5, -0.05, -0.2, 0.7], [0.1, 0.25, -0.45, 0.65], [-0.15, 0.2, 0.45, 0.65]] : [[0, 0, 0, 1], [0.6, -0.15, 0.2, 0.75], [-0.55, -0.1, -0.2, 0.75], [0.1, 0.35, -0.5, 0.7], [-0.15, 0.3, 0.5, 0.7]];
    blobs.forEach(([x, y, z, r], i) => U.mk(g, GEO.sph, i % 2 ? fol2 : fol, [x * cr, cy + y * cr, z * cr], r * cr));
    if (stage === 3) {
      const big = ['durian', 'jackfruit', 'pomelo', 'coconut', 'cacao'].includes(type), N = big ? 6 : 14;
      for (let i = 0; i < N; i++) {
        if (c.fpos === 'trunk') { const a = R() * TAU, h = th * (0.25 + R() * 0.6); U.mk(g, GEO.sph, fm, [Math.cos(a) * 0.2 * s, h, Math.sin(a) * 0.2 * s], type === 'jackfruit' ? [0.13, 0.2, 0.13] : [0.07, 0.11, 0.07]); continue; }
        const a = R() * TAU, e = -0.2 + R() * 0.9, rr = 1.02 * cr; U.mk(g, GEO.sph, fm, [Math.cos(a) * Math.cos(e) * rr, cy + Math.sin(e) * rr * 0.8 - 0.1, Math.sin(a) * Math.cos(e) * rr], big ? 0.14 * sz : 0.08 * sz);
      }
    }
    return g;
  }
  const _co = Models.cropOne, _ft = Models.fruitTree;
  Models.cropOne = function (type, stage, seed = 1) { const c = CROPS[type]; return c && c.look && !c.tree ? plant(type, stage, seed) : _co.apply(this, arguments); };
  Models.fruitTree = function (type, stage, seed = 1) { const c = CROPS[type]; return c && c.tree && c.look ? tree(type, stage, seed) : _ft.apply(this, arguments); };
  window.Crops2 = { NEW, plant, tree };
})();
