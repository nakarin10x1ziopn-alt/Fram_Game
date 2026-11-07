'use strict';
// ---------- v39 prices A: food, household goods, agri inputs, farm produce and livestock at real Thai (2026) prices ----------
// Runs AFTER v36_prices.js and v38_audit.js and overrides them for the items listed here. Evidence and the rules used for the long tail are in
// PRICE_SOURCES_A.md. Everything is data: edit a number, reload. Inventory ids never change, only numbers; hunger/energy effects are untouched.
// Units: a crop "harvest unit" is the yield of one bed (see KG below), an egg is one egg, milk is one day's milking, paddy is 1 kg, rice is 1.8 kg milled.
V23.add('v39_prices_a', () => {
  if (window.Price39A) return;
  const log = [];                                                    // { cat, id, from, to }
  const set = (cat, tbl, id, key, to) => {
    const o = tbl && tbl[id]; if (!o || o[key] == null || !isFinite(to)) return;
    const from = o[key]; if (from === to) return; o[key] = to; log.push({ cat, id, from, to }); return from;
  };
  const setItem = (cat, id, to) => { const it = ITEMS[id]; if (it && it.sell != null && it.sell !== to) { log.push({ cat, id: id + ' (ITEMS)', from: it.sell, to }); it.sell = to; } };

  // ===== 1. food & drinks (FOODS, and the price copied into every MENU row) =====
  // rules: one-plate street/canteen dish 45-70 (Wongnai delivery: กะเพราหมูสับ 55-69, ไข่ดาว +12); noodle bowl 40-60; Thai dessert 25-45;
  // cafe drinks follow Café Amazon (ชานมเย็น 50, ชาดำเย็น 40, ลาเต้ 65); convenience-store items follow 7-Eleven shelf prices (water 600 ml 7-9, energy drink 12-15,
  // ready box 32-45); restaurants/seafood keep their menu prices (80-350, in line with Thai seafood restaurants).
  const FOOD_P = {
    rice: 55, noodle: 60, coffee: 50, ice: 35, sandwich: 35, energy: 15, onigiri: 25, kapao: 70, chicken: 55, padthai: 80, boat: 45, tomyum: 180,
    thaitea: 35, coconut: 45, icecoffee: 30, lemonade: 35, milktea: 55, greentea: 45, cocoa: 50, bualoy: 35, roti: 35, khaoman: 60, khaokha: 70, kuaychap: 55,
    yentafo: 50, somtam: 50, kaiyang: 120, moopin: 30, jok: 40, patongko: 20, khanomjeen: 50, massaman: 95, panang: 85, tomkha: 90, mango: 90,
    zlukchin: 25, zmoosatay: 50, zkhaopod: 25, zkluaytod: 25, zlattehot: 65, zcapp: 70, zmocha: 75, zespresso: 60, zicedamer: 60, zlemonsoda: 45,
    zkraprao: 60, zkhaokaijiew: 40, zpadsiew: 55, zkuayteowrua: 45, zsomtamthai: 50, zlarb: 65, zsticky: 40, zkhaoniewmm: 90, zsticky2: 90, zpadthai: 70,
    zcottoncandy: 25, zhotdog: 45, zcorndog: 40, zsoda: 40, zorangejuice: 55, zsugarcane: 25, zlimejuice: 35, zlemongrass: 30, zchrysan: 30, zroselle: 30,
  };
  const menuCols = [];                                              // [id, price] to patch inside MENU rows
  for (const id in FOOD_P) {
    if (!FOODS[id]) continue;
    const from = set('อาหาร/เครื่องดื่ม', FOODS, id, 'price', FOOD_P[id]);
    if (from != null) menuCols.push([id, FOOD_P[id]]);
  }
  if (typeof MENU !== 'undefined') {
    const P = new Map(Object.entries(FOOD_P));
    const walk = x => { if (!Array.isArray(x)) return; if (typeof x[0] === 'string' && typeof x[3] === 'number' && P.has(x[0]) && FOODS[x[0]]) { x[3] = P.get(x[0]); return; } for (const y of x) walk(y); };
    for (const k in MENU) walk(MENU[k]);
  }

  // ===== 2. household goods, medicine, gifts, tools (TOOLS and the same price in GOODS) =====
  const TOOL_P = {
    water: 8, medicine: 25, inhaler: 25, balm: 45, vitamin: 150, vitc: 160, bandage: 90, sunscreen: 190, energydrink2: 20, herbtea: 45, treat: 40, groomkit: 250,
    pettoy: 120, card: 25, letter: 20, comic: 85, magazine: 70, novel2: 280, kite: 150, legoset: 690, yoyo: 60, boardgame: 590, balloon: 30, ball: 150, fishtoy: 70,
    book_farm: 420, book_cook: 380, book_love: 320, book_animal: 450, book_fish: 450, book_money: 390, book_car: 420,
    bouquet: 450, rosegift: 3500, cake2: 590, chocolate: 280, perfume: 2200, teddy: 790, plushie: 380, shoes: 2500, guitar: 3900, easel: 2200,
    sprinkler: 250, sprinkler_pro: 1500, extinguisher: 800, extinguisher_xl: 2200, fireblanket: 450, sandbag: 40, saddle: 3000, krathong: 40,
    wear_necklace: 41000, wear_glasses: 1800, wear_sunglasses: 600, wear_watch: 1990, wear_cowboy: 700, wear_beanie: 250, wear_scarf: 350, wear_backpack: 1200,
    wear_bracelet: 3200, wear_pearl: 4800, wear_crown: 450,
    // agri inputs: 15-15-15 fertiliser ~1,000 THB / 50 kg (≈20/kg), layer feed ~16 THB/kg (one ration ≈ 0.2 kg), tilapia fingerlings ~1 THB each
    feed: 3, fert: 40, fishfeed: 18, fingerling: 25, seedling: 90, pesticide: 85, ladybug: 120, fseed_rose: 25, fseed_jasmine: 20, fseed_orchid: 80,
    v_waterpack: 90, v_compost: 90, v_growtonic: 180, v_growtonic2: 450, v_feedsack: 85, v_feedsack2: 220, v_bonemeal: 120, v_fishmeal: 110, v_guano: 180, v_humus: 150,
    v_seaweedfert: 190, v_mulch: 80, v_workgloves: 70, v_farmhat: 120, v_rainboots: 290, v_liniment: 60, v_firstaid: 220, v_sunscreen: 120, v_farmbook: 450,
    v_dogbiscuit: 60, v_catpouch: 15, v_petfoodbag: 380, v_chewtoy: 90, v_ball: 70, v_scratcher: 160, v_petshampoo: 150, v_petbed: 380, v_leash: 180, v_petcollar: 140,
    v_fishflakes: 40, v_birdseed: 45, v_rabbithay: 60, v_pettreat: 60, v_petfountain: 650,
    v_bouq_tulip: 450, v_bouq_sun: 280, v_bouq_lily: 550, v_bouq_orchid: 650, v_bouq_wild: 200, v_bouq_baby: 320, v_bouq_lav: 420, v_bouq_mix: 550, v_wreath: 380,
    v_candle: 160, v_aromaoil: 290, v_giftbox: 150, v_chocbox: 380, v_perfume: 890, v_gamevoucher: 300, v_streamsub: 349,
  };
  for (const id in TOOL_P) {
    for (const T of [TOOLS, (typeof GOODS !== 'undefined' ? GOODS : null)]) { if (!T) continue; const from = set('ของใช้/อุปกรณ์/ของขวัญ/ปัจจัยการเกษตร', T, id, 'price', TOOL_P[id]); if (from != null && T === TOOLS && ITEMS[id] && ITEMS[id].sell > 0 && from > 0) ITEMS[id].sell = Math.max(1, Math.round(ITEMS[id].sell * TOOL_P[id] / from)); }
  }
  // colour editions of wearables follow their base item (x1.2 as before)
  for (const id of Object.keys(TOOLS)) {
    const m = /^wear_([a-z]+)_[a-z]+$/.exec(id); if (!m) continue; const base = TOOLS['wear_' + m[1]]; if (!base || id in TOOL_P) continue;
    if (m[1] === 'necklace' || m[1] === 'watch') continue;
    set('ของใช้/อุปกรณ์/ของขวัญ/ปัจจัยการเกษตร', TOOLS, id, 'price', Math.round(base.price * 1.2 / 10) * 10);
  }

  // ===== 3. furniture and decor (Thai retail: HomePro 12,000 BTU inverter air ≈ 12-14k, 2-door fridge 10-14k, IKEA lamp 329-590, bed 5,990) =====
  const FURN_P = { aircon: 13900, fan: 1290, lamp: 890, table: 4900, sofa: 12900, bookshelf: 3900, rug: 1800, plant: 180, flowers: 600, painting: 1200, d_vase: 450, d_cactus: 150, d_candle: 120, d_frame: 260 };
  for (const id in FURN_P) set('เฟอร์นิเจอร์/ตกแต่ง', FURN, id, 'price', FURN_P[id]);

  // ===== 4. pets (breeder/pet-shop prices, estimates) =====
  const PET_P = { dog: 5500, cat: 4000, rabbit: 700, hamster: 250, turtle: 800, parrot: 5500, horse: 150000 };
  for (const id in PET_P) set('สัตว์เลี้ยง', PETS, id, 'price', PET_P[id]);

  // ===== 5. farm produce: price per kg (farm-gate / Si Mum Mueang wholesale) x kg of one harvested bed =====
  // KG = [THB per kg, kg per unit, seed/sapling price]
  const KG = {
    carrot: [25, 3, 15], cabbage: [12, 6, 15], tomato: [25, 3, 20], chili: [120, 0.5, 20], corn: [8, 8, 12], eggplant: [25, 2.5, 20], strawberry: [200, 0.5, 60],
    pumpkin: [12, 6, 15], sunflower: [10, 6, 12], watermelon: [8, 8, 25], pineapple: [12, 4, 40], mango: [40, 3, 300], orange: [35, 3, 250],
  };
  const CROP = {};
  for (const id in KG) {
    const C = CROPS[id]; if (!C) continue; const [perKg, kg, seed] = KG[id], to = Math.max(5, Math.round(perKg * kg / 5) * 5);
    CROP[id] = to;
    set('ผลผลิตเกษตร (ราคาขาย/หน่วย)', CROPS, id, 'sell', to); setItem('ผลผลิตเกษตร (ราคาขาย/หน่วย)', id, to);
    set('ผลผลิตเกษตร (เมล็ด/กล้า)', CROPS, id, 'seed', seed);
  }
  setItem('นาข้าว', 'paddy', 16);            // paddy 16.3-16.5 THB/kg (Yasothon commerce office, 17 Apr 2569); one cell gives 8-12 kg
  setItem('นาข้าว', 'rice', 85);              // milled Hom Mali ~45 THB/kg; the mill turns 3 kg paddy into ~1.8 kg rice
  setItem('ผลผลิตสัตว์', 'egg', 7);           // farm-shop free-range egg 6-8 THB (cooperative wholesale is 3.80, Bangkok retail 3.90-4.00)
  setItem('ผลผลิตสัตว์', 'milk', 280);        // one day's milking ≈ 12 kg raw milk x 22.75 THB/kg (Milk Board reference price)
  for (const id of ['egg', 'milk']) { const v = ITEMS[id] && ITEMS[id].sell; if (v != null) set('ผลผลิตสัตว์', PRODUCTS, id, 'sell', v); }
  setItem('ผลผลิตสัตว์', 'wool', 260); setItem('ผลผลิตสัตว์', 'truffle', 160);   // no Thai market; kept (flagged in PRICE_SOURCES_A.md)
  const FISH = { fish_nile: 40, fish_catfish: 40, fish_barb: 40, fish_snakehead: 110, fish_prawn: 180, fish_giant: 2500, fish_mackerel: 45, fish_crab: 110, fish_seabass: 150, fish_squid: 160, fish_octopus: 280, fish_tuna: 1200 };
  for (const id in FISH) setItem('สัตว์น้ำ', id, FISH[id]);
  const ARTI = { coffee_bean: 180, honey: 250, cloth: 560 };
  for (const id in ARTI) setItem('แปรรูป', id, ARTI[id]);
  // livestock purchase prices (estimates: layer hen 250-350, sheep ~40 kg live, dairy cow in milk, a weaner pig 20-25 kg ~2,500-3,500 (a pig no longer makes truffles: it gives manure bags, a real farm product) — Thai PBS Jun-Jul 2569: 66-74 THB/kg)
  const ANI_P = { chicken: 280, sheep: 6500, cow: 48000, pig: 3000 };
  for (const id in ANI_P) set('สัตว์ฟาร์ม', ANIMALS, id, 'price', ANI_P[id]);

  // ===== 6. processed goods must keep a profit over their inputs (machines/factory: one input batch -> one batch of goods) =====
  const hi = ids => Math.max(...ids.map(i => (ITEMS[i] && ITEMS[i].sell) || 0));
  const floor = (id, cost) => { const it = ITEMS[id]; if (!it) return; const want = Math.round(cost * 1.5 / 10) * 10; if (it.sell < want) { log.push({ cat: 'แปรรูป (ขั้นต่ำ = 1.5 x วัตถุดิบ)', id, from: it.sell, to: want }); it.sell = want; } };
  const FR = ['strawberry', 'watermelon', 'pineapple', 'mango', 'orange', 'tomato'], VG = ['carrot', 'cabbage', 'chili', 'eggplant', 'corn', 'pumpkin'];
  floor('jam', hi(FR)); floor('juice', hi(FR)); floor('pickle', hi(VG)); floor('cheese', (ITEMS.milk || {}).sell || 0); floor('cloth', (ITEMS.wool || {}).sell || 0);
  floor('chili_paste', 5 * (ITEMS.chili || {}).sell); floor('tomato_sauce', 4 * (ITEMS.tomato || {}).sell); floor('rice_cracker', 2 * (ITEMS.rice || {}).sell); floor('dried_mango', 3 * (ITEMS.mango || {}).sell);
  // keep the rest of the game's own rules: star variants (x1.25 / x1.5) and dishes selling >= 1.4x their ingredients
  try { if (window.Audit38) { Audit38.syncQuality(); Audit38.syncRecipes(); } } catch (e) { }
  for (const k in (typeof RECIPES !== 'undefined' ? RECIPES : {})) { const d = ITEMS['dish_' + k]; if (d && RECIPES[k] && d.sell !== RECIPES[k].sell) d.sell = RECIPES[k].sell; }
  // dishes follow the audit rule on every new day too (crop prices are static now, but a save loaded later must stay in line)
  // economy guard: never sell for less than 1 and never below what the shop charges for the same item
  for (const id in TOOLS) { const T = TOOLS[id], I = ITEMS[id]; if (I && I.sell > T.price) { log.push({ cat: 'กันขายแพงกว่าซื้อ', id, from: I.sell, to: T.price }); I.sell = T.price; } }

  const byCat = {};
  for (const l of log) { if (typeof l.from !== 'number') continue; const c = byCat[l.cat] || (byCat[l.cat] = { n: 0, from: 0, to: 0, r: [] }); c.n++; c.from += l.from; c.to += l.to; c.r.push(l.to / l.from); }
  const med = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 1; };
  window.Price39A = {
    log, KG, CROP,
    report() { return Object.entries(byCat).map(([cat, c]) => ({ cat, items: c.n, medianRatio: +med(c.r).toFixed(2), avgFrom: Math.round(c.from / c.n), avgTo: Math.round(c.to / c.n) })); },
    table() { return log.map(l => `${l.cat} | ${l.id} | ${l.from} -> ${l.to}`).join('\n'); },
    // income per day of a 30-bed farm planted with one crop (ignores energy/water): used in the report
    // best case: all 30 beds of one crop harvested once per game day (crops grow in game HOURS while the soil is wet): 30 x (sell x yield - seed)
    farmDay(id) { const C = CROPS[id], s = ITEMS[id] && ITEMS[id].sell; if (!C || !s) return 0; return Math.round(30 * (s * (C.yield || 1) - C.seed)); },
  };
});
