'use strict';
// ---------- v39 prices B: real Thai (Oct-Nov 2026) prices for vehicles, electronics/IT, PC parts, internet, utilities, solar/EV, medical ----------
// Runs after v36_prices / v36_pc / v36_net (script order), so these numbers win. Table-driven: every entry carries src =
//   'V' verified against a web page checked on 2026-11-01 (see PRICE_SOURCES_B.md for the URL)
//   'E' estimate from Thai market knowledge that could not be re-verified online (marked honestly, easy to edit)
// Inventory ids never change; owned items, loans, contracts keep their saved values. Window.Price39B.report()/table() list every change.
V23.add('v39_prices_b', () => {
  if (window.Price39B) return;
  const log = [];
  const set = (cat, tbl, id, key, to, src) => {
    const o = tbl && tbl[id]; if (!o || o[key] == null || !isFinite(to)) return false;
    const from = o[key]; if (from === to) return false; o[key] = to; log.push({ cat, id, from, to, src: src || 'E' }); return true;
  };
  const resell = (id, ratio) => { const it = typeof ITEMS !== 'undefined' && ITEMS[id]; if (it && it.sell != null) it.sell = Math.max(1, Math.round(it.price ? it.price * ratio : it.sell)); };

  // ===== 1. electricity (MEA residential, bill cycle Sep 2026, ERC resolution 5 Aug 2026; Ft Sep-Dec 2026 = 16.23 satang) [V] =====
  if (typeof TARIFF !== 'undefined') {
    const from = JSON.stringify(TARIFF.steps);
    TARIFF.steps = [[200, 3.0], [400, 4.1584], [1e9, 4.3583]];
    TARIFF.ft = 0.1623;
    log.push({ cat: 'ไฟฟ้า (อัตรา กฟน. บ้านอยู่อาศัย กย. 2569)', id: 'ขั้นบันได/Ft', from, to: JSON.stringify(TARIFF.steps) + ' Ft 0.1623', src: 'V' });
  }

  // ===== 2. fuel: PTT 29 Oct 2026 gasohol 95 = 41.54 ฿/L, diesel 42.54, E20 33.50. A 45-litre tank = 1,869 ฿ =~ 18.69 ฿ per tank-percent [V] =====
  // v36_prices charged 18 ฿ per % (2.25 x the original 8); top up the remaining +3.8 % so the refuel bill equals the real pump price
  if (typeof Town2 !== 'undefined' && Town2.refuelNear) {
    const _r = Town2.refuelNear.bind(Town2), K = 18.69 / 18 - 1;
    Town2.refuelNear = function () {
      const m = S.money, r = _r.apply(this, arguments), spent = m - S.money;
      if (spent > 0) { const extra = Math.min(S.money, Math.round(spent * K)); if (extra > 0) { S.money -= extra; try { Bank2.log('น้ำมัน (ราคาปั๊มจริง 41.54 ฿/ลิตร)', -extra); } catch (e) { } } }
      return r;
    };
    log.push({ cat: 'น้ำมัน', id: 'เต็มถัง 45 ลิตร (แก๊สโซฮอล์ 95)', from: 1800, to: 1869, src: 'V' });
  }

  // ===== 3. vehicles: [new-car list price incl. VAT, THB, src] =====
  // V = confirmed by a 2026 Thai page: Yaris ATIV HEV 719,000; Hilux Champ 459,000; Alphard 3.59 M; GR Supra 4.999 M; BYD Dolphin 599,900
  const CAR = {
    oldtruck: [65000, 'E'],      // used 2000s pickup: below real market (80-150k) on purpose, it is the first reachable vehicle
    sedan: [619000, 'E'],        // City / Yaris ATIV class: 549,000-719,000 (ATIV HEV 719,000 [V])
    hatch: [579000, 'E'],        // Yaris / Jazz class
    taxi: [389000, 'E'],         // used Camry/Altis taxi
    pickup: [699000, 'E'],       // 4-door pickup: Hilux Revo / D-Max / Triton ~ 689,000-1,000,000
    truckflat: [459000, 'V'],    // single-cab work pickup: Hilux Champ 459,000
    van: [1499000, 'E'],         // Toyota Commuter class
    delivery: [689000, 'E'],
    deliveryflat: [1090000, 'E'],// 6-wheel light truck
    truck: [1390000, 'E'],
    suv: [1199000, 'E'],         // Fortuner / CR-V class
    suvlux: [3590000, 'V'],      // Toyota Alphard 2026 starts 3.59 M
    sedansp: [1799000, 'E'],
    sports: [2490000, 'E'],      // GR86 / MX-5 class
    race: [4999000, 'V'],        // Toyota GR Supra 4,999,000
    tractor: [549000, 'E'],      // 40-hp Kubota class
    ev_city: [599900, 'V'],      // BYD Dolphin Standard 599,900 (a Jan 2026 page shows 499,000: prices moved after EV 3.0 ended)
    ev_sedan: [1099000, 'E'],    // BYD Seal class
    ev_suv: [1059000, 'E'],      // BYD Atto 3 class
    ev_pickup: [1099000, 'E'],
  };
  const oldCar = Object.fromEntries(Object.entries(CARS).map(([k, c]) => [k, c.price]));
  for (const id in CAR) set('รถยนต์', CARS, id, 'price', CAR[id][0], CAR[id][1]);
  for (const id of Object.keys(CARS)) {                                  // colour editions keep their ratio to the base model
    if (id in CAR) continue;
    const m = /^v23c_(.+)_\d+$/.exec(id) || /^(.+)_(red|blue|yellow|green|black|purple|white)$/.exec(id);
    const base = m && m[1]; if (!base || !(base in CAR) || !oldCar[base]) continue;
    set('รถยนต์ (สีพิเศษ)', CARS, id, 'price', Math.round(CAR[base][0] * (oldCar[id] / oldCar[base]) / 1000) * 1000, CAR[base][1]);
  }

  // ===== 4. phones, tablets, wearables, consoles, gaming PC [iPhone 17 line: 256GB 29,900 / Air 39,900 / Pro 43,900 / Pro Max 48,900 = V] =====
  const T = [
    ['phone_pro', 43900, 'V'], ['phone_fold', 64900, 'E'], ['tablet', 12900, 'E'], ['smartwatch', 8900, 'E'], ['earbuds', 5990, 'E'],
    ['gamingpc', 59900, 'E'],   // 32 GB DDR5 alone costs ~20,000 in 2026, so the old 49,900 build no longer exists
  ];
  for (const [id, p, s] of T) if (set('มือถือ/แกดเจ็ต', TOOLS, id, 'price', p, s)) resell(id, 0.5);

  // ===== 5. solar, battery, EV wallbox (installed Thai prices; PW_ITEMS) =====
  if (typeof PW_ITEMS !== 'undefined') {
    set('โซลาร์/แบตเตอรี่/ชาร์จ EV', PW_ITEMS, 'roof', 'price', 59000, 'E');       // 2.2 kW rooftop ~ 25-30k per kW installed
    set('โซลาร์/แบตเตอรี่/ชาร์จ EV', PW_ITEMS, 'farm', 'price', 139000, 'E');     // 5.5 kW ground mount
    set('โซลาร์/แบตเตอรี่/ชาร์จ EV', PW_ITEMS, 'batt', 'price', 129000, 'E');     // 10 kWh LFP installed
    set('โซลาร์/แบตเตอรี่/ชาร์จ EV', PW_ITEMS, 'wallbox', 'price', 25900, 'E');   // 7 kW wallbox + install
  }

  // ===== 6. internet packages (AIS Fibre3 1000/1000 = 799; True 1 Gbps = 799; 500/500 = 599; 300/300 = 499 at 12 months; 2000/1000 = 1,399 [V]) =====
  const NET = { f2000: 1399, t300: 449 };
  for (const id in NET) set('อินเทอร์เน็ต', NET_PKGS, id, 'price', NET[id], 'V');

  // ===== 7. PC parts: the 2026 memory shortage doubled-to-quintupled RAM and SSD prices =====
  const PCP = {
    // DDR5: 16 GB single stick 9,590-10,400, 32 GB kit 19,890-20,490 on JIB [V]; larger kits follow ~620-670 ฿/GB [E]
    r_d5_16: [9900, 'V'], r_d5_32: [19900, 'V'], r_d5_32b: [20490, 'V'], ram_5_32: [20490, 'V'], r_d5_32c: [22500, 'E'], r_d5_48: [30500, 'E'],
    r_d5_64: [41000, 'E'], ram_5_64: [41000, 'E'], r_d5_64b: [44500, 'E'], r_d5_96: [62500, 'E'], r_d5_128: [85000, 'E'], ram_5_128: [85000, 'E'], r_d5_192: [128000, 'E'],
    // DDR4 [E]
    ram_4_16: [5500, 'E'], r_d4_8: [2900, 'E'], r_d4_16: [5400, 'E'], r_d4_16b: [5900, 'E'], r_d4_32: [10500, 'E'], r_d4_32b: [11200, 'E'], r_d4_64: [21500, 'E'],
    // NVMe/SATA SSD: Kingston NV3 1TB Gen4 5,190-5,590, WD SN850X 1TB 5,990, Samsung 990 PRO 1TB 6,290, 990 EVO Plus 1TB 7,290 [V]; other capacities scaled [E]
    ssd_1: [5290, 'V'], d_n4_1t: [6290, 'V'], ssd_05: [2900, 'E'], ssd_2: [10500, 'E'], ssd_4: [33000, 'E'],
    d_s256: [1500, 'E'], d_s512: [2900, 'E'], d_s1t: [5500, 'E'], d_s2t: [10500, 'E'],
    d_n3_500: [2900, 'E'], d_n3_1t: [4700, 'E'], d_n3_2t: [9200, 'E'], d_n4_500: [3300, 'E'], d_n4_2t: [11900, 'E'], d_n4_4t: [24000, 'E'],
    d_n5_1t: [9500, 'E'], d_n5_2t: [17500, 'E'], d_n5_4t: [33000, 'E'],
    x_ex_ssd1: [6300, 'E'], x_ex_ssd2: [11500, 'E'], x_usb_128: [650, 'E'], x_sd_256: [1300, 'E'],
    // CPUs: Ryzen 7 9800X3D 17,990 (JIB); i5-14400F 5,290 (SpeedCom) [V]
    c_r7_9800x3d: [17990, 'V'], c_i5_14400f: [5290, 'V'],
    // GPUs: RTX 5070 12 GB cards 28,000-30,190 (ASUS TUF 28,590, Aorus 28,000) [V]; current-generation cards scaled by the same ~1.2 [E]
    g_r5070: [28500, 'V'], g_r5050: [10700, 'E'], g_r5060: [14300, 'E'], g_r5060ti: [21500, 'E'], g_r5070ti: [38300, 'E'], g_r5080: [51500, 'E'], g_r5090: [108000, 'E'],
    g_rx9060xt: [17200, 'E'], g_rx9070: [28600, 'E'], g_rx9070xt: [32000, 'E'], g_b570: [9300, 'E'], g_b580: [10900, 'E'],
  };
  if (typeof PC_PARTS !== 'undefined') for (const id in PCP) { if (set('ชิ้นส่วนคอม', PC_PARTS, id, 'price', PCP[id][0], PCP[id][1]) && ITEMS['pc_' + id]) ITEMS['pc_' + id].sell = Math.round(PCP[id][0] * 0.55); }

  // ===== 8. medical (private hospital level; public rights still apply through the game's own rights table) [E] =====
  if (typeof CV_HOS !== 'undefined') { set('การแพทย์', CV_HOS, 'er', 'price', 2500, 'E'); set('การแพทย์', CV_HOS, 'dental', 'price', 1200, 'E'); set('การแพทย์', CV_HOS, 'checkup', 'price', 3500, 'E'); }

  // ===== summary =====
  const byCat = {};
  for (const l of log) { if (typeof l.from !== 'number') continue; const c = byCat[l.cat] || (byCat[l.cat] = { n: 0, v: 0, ratios: [], from: 0, to: 0 }); c.n++; if (l.src === 'V') c.v++; c.from += l.from; c.to += l.to; c.ratios.push(l.to / l.from); }
  const med = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 1; };
  window.Price39B = {
    log,
    report() { return Object.entries(byCat).map(([cat, c]) => ({ cat, items: c.n, verified: c.v, medianRatio: +med(c.ratios).toFixed(2), avgFrom: Math.round(c.from / c.n), avgTo: Math.round(c.to / c.n) })); },
    table() { return log.map(l => `${l.src} | ${l.cat} | ${l.id} | ${l.from} -> ${l.to}`).join('\n'); },
  };
});
