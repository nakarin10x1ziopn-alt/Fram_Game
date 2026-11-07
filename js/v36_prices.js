'use strict';
// ---------- v36 prices: one reviewable table that retunes the game's price tables to current (2026) Thai market prices ----------
// Rule used everywhere: goods and property cost what they cost in Thailand today; income comes from the wages the game already pays
// (monthly salaries 11,000-130,000 ฿, minimum wage ~400 ฿/day); crops, animals and products sell at farm-gate/market prices
// (one harvest unit ~ 1 kg or 1 piece of retail produce). Inventory ids never change, only numbers; owned items, loans and contracts keep their saved values.
// Everything below is data: edit a number, reload, done. Window.Price36.report() prints before -> after for every changed entry.
V23.add('v36_prices', () => {
  if (window.Price36) return;
  const log = [];                                    // { cat, id, from, to }
  const set = (cat, tbl, id, key, to) => {
    const o = tbl[id]; if (!o || o[key] == null || !isFinite(to)) return;
    const from = o[key]; if (from === to) return; o[key] = to; log.push({ cat, id, from, to });
    return from;
  };
  // goods that are also sold back (ITEMS[id].sell): keep the old sell/price ratio so the resale value follows the new price
  const rescaleSell = (id, from, to) => { const it = typeof ITEMS !== 'undefined' && ITEMS[id]; if (it && it.sell && from > 0) it.sell = Math.max(1, Math.round(it.sell * to / from)); };

  // ===== 1. cars, tractors, EVs, karts: [real 2026 new-price (used price for the old truck), THB] =====
  const CAR = {
    oldtruck: 65000, pickup: 649000, sports: 1890000, tractor: 450000, sedan: 599000, taxi: 569000, van: 1399000, hatch: 549000, suv: 899000,
    truck: 1590000, delivery: 689000, suvlux: 2790000, sedansp: 1990000, race: 5900000, truckflat: 1350000, deliveryflat: 790000, garbage: 3200000,
    shovel: 2500000, kart: 120000, kart2: 135000, racefuture: 16000000, ev_city: 699000, ev_sedan: 1099000, ev_suv: 1399000, ev_van: 1490000,
    ev_pickup: 1190000, ev_super: 9900000, reefer: 1990000,
  };
  const oldCar = Object.fromEntries(Object.entries(CARS).map(([k, c]) => [k, c.price]));
  for (const id in CAR) set('รถยนต์', CARS, id, 'price', CAR[id]);
  // colour editions follow their base car (same ratio as before)
  for (const id of Object.keys(CARS)) {
    if (id in CAR) continue;
    const m = /^v23c_(.+)_\d+$/.exec(id) || /^(.+)_(red|blue|yellow|green|black|purple|white)$/.exec(id);
    const base = m && m[1]; if (!base || !(base in CAR) || !oldCar[base]) continue;
    set('รถยนต์ (สีพิเศษ)', CARS, id, 'price', Math.round(CAR[base] * (oldCar[id] / oldCar[base]) / 1000) * 1000);
  }

  // ===== 2. house appliances, furniture and decor (FURN): only entries that were far from a real shelf price =====
  const FURN_P = {
    aircon: 16900, washer: 11900, robotvac: 9900, smartfridge: 32900, massagechair: 35900, smartmirror: 7900, evcharger: 28000, smartgarden: 22000,
    console: 16900, tv: 6900, sofa: 12900, table: 4900, bookshelf: 3900, rug: 1800, lamp: 890, painting: 1200, aquarium: 8500, piano: 29900,
    elephant: 3500, pcdesk: 4500, d_guitar: 3900, d_clock: 2800, d_buddha: 4500, fan: 1290, radio: 1500, bike: 7900, doorbell: 3500,
  };
  for (const id in FURN_P) set('เครื่องใช้ไฟฟ้า/เฟอร์นิเจอร์', FURN, id, 'price', FURN_P[id]);

  // ===== 3. tools, gadgets, jewellery, gifts (TOOLS): clearly off from real shelf prices =====
  const TOOL_P = {
    console2: 16900, ring: 25000, wear_necklace: 39000, wear_necklace_silver: 4500, wear_watch_gold: 48000, watchgift: 9900, jewelbox: 12000,
    shoes: 2500, guitar: 3900, easel: 2200, tablet: 14900, drone: 29900, smartwatch: 7500, bouquet: 450, cake2: 590, perfume: 2200,
    medicine: 70, balm: 45, vitamin: 150, inhaler: 40, bandage: 90, sunscreen: 190, vitc: 120, water: 12, ball: 250, teddy: 790,
    book_farm: 450, book_cook: 380, book_love: 320, book_animal: 450, book_fish: 450, book_money: 390, book_car: 420,
  };
  for (const id in TOOL_P) { const from = set('ของใช้/อุปกรณ์/ของขวัญ', TOOLS, id, 'price', TOOL_P[id]); if (from != null) rescaleSell(id, from, TOOL_P[id]); }
  // wearable colour/metal editions follow their base
  for (const id of Object.keys(TOOLS)) {
    if (!id.startsWith('wear_') || id in TOOL_P) continue;
    const m = /^wear_(.+?)_[a-z]+$/.exec(id); const base = m && TOOLS['wear_' + m[1]]; if (!base) continue;
    if (!['necklace', 'watch'].includes(m[1])) continue;
    const old0 = log.find(l => l.id === 'wear_' + m[1]); if (!old0) continue;
    set('ของใช้/อุปกรณ์/ของขวัญ', TOOLS, id, 'price', Math.round(TOOLS[id].price * old0.to / old0.from / 100) * 100);
  }

  // ===== 4. pets =====
  const PET_P = { dog: 3500, cat: 3000, rabbit: 700, hamster: 250, turtle: 800, parrot: 5500, horse: 150000 };
  for (const id in PET_P) set('สัตว์เลี้ยง', PETS, id, 'price', PET_P[id]);

  // ===== 5. property: building cost, land, rent, extra rooms =====
  const HOUSE_P = { tiny: [450000, 3500], thai: [1200000, 8000], resort: [1800000, 12000], modern: [1900000, 12000], smart: [3500000, 22000], townhome: [2800000, 15000], villa: [6500000, 45000], mansion: [15000000, 120000] };
  for (const id in HOUSE_P) { set('บ้าน (ค่าก่อสร้าง)', HOUSE_DESIGNS, id, 'price', HOUSE_P[id][0]); set('บ้าน (ค่าเช่า/รอบ)', HOUSE_DESIGNS, id, 'rent', HOUSE_P[id][1]); }
  if (typeof LOTS !== 'undefined') for (const l of LOTS) if (l.price) set('ที่ดิน', { [l.id]: l }, l.id, 'price', Math.round(l.price * 12 / 1000) * 1000);
  if (typeof HOUSE_EXT !== 'undefined') for (const id in HOUSE_EXT) set('ห้องต่อเติม', HOUSE_EXT, id, 'price', Math.round(HOUSE_EXT[id].price * 4 / 1000) * 1000);

  // ===== 6. produce, livestock products, animals (market / farm-gate; one harvest unit ~ 1 kg or one bunch) =====
  // seed cost keeps the old sell:seed ratio, so crop profitability per plant is unchanged in relative terms
  const CROP_P = { carrot: 45, cabbage: 45, tomato: 45, chili: 60, corn: 35, eggplant: 40, strawberry: 120, pumpkin: 90, sunflower: 60, watermelon: 130, pineapple: 45, mango: 90, orange: 65 };
  for (const id in CROP_P) {
    const C = CROPS[id]; if (!C) continue; const oldSell = C.sell, oldSeed = C.seed;
    set('ผลผลิตเกษตร (ราคาขาย)', CROPS, id, 'sell', CROP_P[id]); if (typeof ITEMS !== 'undefined' && ITEMS[id]) ITEMS[id].sell = CROP_P[id];
    set('ผลผลิตเกษตร (ราคาเมล็ด/กล้า)', CROPS, id, 'seed', Math.max(8, Math.round(oldSeed * CROP_P[id] / oldSell)));
  }
  const PROD_P = { egg: 14, milk: 320, wool: 260, truffle: 160, manure: 45 };
  for (const id in PROD_P) { set('ผลผลิตสัตว์', PRODUCTS, id, 'price', PROD_P[id]); if (PRODUCTS[id] && PRODUCTS[id].sell != null) set('ผลผลิตสัตว์', PRODUCTS, id, 'sell', PROD_P[id]); if (typeof ITEMS !== 'undefined' && ITEMS[id]) ITEMS[id].sell = PROD_P[id]; }
  const ANI_P = { chicken: 250, sheep: 5500, cow: 18000, pig: 3000 };
  for (const id in ANI_P) set('สัตว์ฟาร์ม', ANIMALS, id, 'price', ANI_P[id]);

  // ===== 7. food and drink at street/shop level: a few that were under real prices =====
  const FOOD_P = { icecoffee: 45, lemonade: 45, milktea: 55, ice: 40, energy: 40, bingsu: 149, cake: 129, coffee: 60, zespresso: 60 };
  for (const id in FOOD_P) set('อาหาร/เครื่องดื่ม', FOODS, id, 'price', FOOD_P[id]);

  // ===== 8. fuel: a full tank (100 %) was 800 ฿ -> ~45 L x 40 ฿ = 1,800 ฿ =====
  const FUEL_K = 2.25;                               // multiplier on the original 8 ฿ per tank-percent (-> 18 ฿ per %)
  if (typeof Town2 !== 'undefined' && Town2.refuelNear) {
    const _r = Town2.refuelNear.bind(Town2);
    Town2.refuelNear = function () {
      const m = S.money, r = _r.apply(this, arguments), spent = m - S.money;
      if (spent > 0) { const extra = Math.min(S.money, Math.round(spent * (FUEL_K - 1))); if (extra > 0) { S.money -= extra; try { Bank2.log('น้ำมัน (ราคาตามจริง)', -extra); } catch (e) { } } }
      return r;
    };
    log.push({ cat: 'น้ำมัน', id: 'ถังเต็ม (100%)', from: 800, to: 1800 });
  }

  // ===== summary =====
  const byCat = {};
  for (const l of log) { if (typeof l.from !== 'number') continue; const c = byCat[l.cat] || (byCat[l.cat] = { n: 0, from: 0, to: 0, ratios: [] }); c.n++; c.from += l.from; c.to += l.to; c.ratios.push(l.to / l.from); }
  const med = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 1; };
  window.Price36 = {
    log,
    report() { return Object.entries(byCat).map(([cat, c]) => ({ cat, items: c.n, medianRatio: +med(c.ratios).toFixed(2), avgFrom: Math.round(c.from / c.n), avgTo: Math.round(c.to / c.n) })); },
    table() { return log.map(l => `${l.cat} | ${l.id} | ${l.from} -> ${l.to}`).join('\n'); },
  };
});
