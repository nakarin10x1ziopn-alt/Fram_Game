'use strict';
// ---------- Many more goods in every shop, and the IT shop (25 gadgets with real effects) ----------
// --- food & drinks: [id, name, icon, price, energy] ---
const FOOD2 = [
  ['khaoman', 'ข้าวมันไก่ทอด', '🍗', 65, 30], ['khaokha', 'ข้าวขาหมู', '🍖', 70, 34], ['kuaychap', 'ก๋วยจั๊บน้ำข้น', '🍜', 60, 28], ['yentafo', 'เย็นตาโฟ', '🍜', 55, 26], ['laab', 'ลาบหมู', '🥗', 70, 28], ['somtam', 'ส้มตำไทย', '🥗', 50, 20], ['kaiyang', 'ไก่ย่างเขาสวนกวาง', '🍗', 120, 38], ['moopin', 'หมูปิ้งข้าวเหนียว', '🍢', 40, 22], ['jok', 'โจ๊กหมูใส่ไข่', '🥣', 45, 24], ['patongko', 'ปาท่องโก๋น้ำเต้าหู้', '🥖', 30, 15],
  ['khanomjeen', 'ขนมจีนน้ำยา', '🍝', 55, 26], ['massaman', 'แกงมัสมั่นไก่', '🍛', 95, 36], ['panang', 'พะแนงหมู', '🍛', 85, 32], ['tomkha', 'ต้มข่าไก่', '🥥', 90, 30], ['pla_rad', 'ปลาราดพริก', '🐟', 150, 40], ['hoymalang', 'หอยแมลงภู่อบ', '🦪', 130, 30], ['pupad', 'ปูผัดผงกะหรี่ชุดเล็ก', '🦀', 200, 45], ['icecoffee', 'โอเลี้ยง', '🥤', 25, 10], ['greentea', 'ชาเขียวนมสด', '🍵', 45, 14], ['lemonade', 'น้ำมะนาวโซดา', '🍋', 35, 12],
  ['bualoy', 'บัวลอยไข่หวาน', '🍡', 35, 16], ['tubtim', 'ทับทิมกรอบ', '🍧', 35, 15], ['roti', 'โรตีกล้วยไข่', '🫓', 40, 20], ['waffle', 'วาฟเฟิลเนยสด', '🧇', 55, 18], ['donut', 'โดนัทช็อกโกแลต', '🍩', 35, 14], ['croissant', 'ครัวซองต์เนย', '🥐', 60, 18], ['smoothie', 'สมูทตี้มะม่วง', '🥭', 65, 20], ['milktea', 'ชานมไข่มุก', '🧋', 50, 16], ['cocoa2', 'โกโก้ปั่น', '🍫', 50, 16], ['sushi', 'ซูชิเซ็ต', '🍣', 180, 40],
];
for (const [id, n, i, price, en] of FOOD2) { FOODS[id] = { n, i, price, en }; ITEMS['food_' + id] = { n, i, en, cat: 'dish' }; }
MENU.restaurant.push(['เมนูเพิ่มเติม', FOOD2.slice(0, 17).map(([id, n, i, p, e]) => [id, n, i, p, e])]);
MENU.seafood.push(['ซีฟู้ดจานเดียว', FOOD2.filter(f => ['pla_rad', 'hoymalang', 'pupad', 'sushi', 'tomkha'].includes(f[0])).map(([id, n, i, p, e]) => [id, n, i, p, e])]);
SHOPS.mart.tabs.push({ n: 'ของว่าง & เครื่องดื่ม', items: FOOD2.slice(17, 30).map(f => 'food:' + f[0]) });
SHOPS.citycafe.tabs.push({ n: 'ขนม & เครื่องดื่มพิเศษ', items: ['food:waffle', 'food:croissant', 'food:smoothie', 'food:milktea', 'food:cocoa2', 'food:greentea', 'food:donut'] });
SHOPS.nightmarket.tabs[0].items.push('food:roti', 'food:moopin', 'food:bualoy', 'food:tubtim', 'food:somtam', 'food:kaiyang');
// --- goods with effects: [id, name, icon, price, desc, effect] ---
const GOODS2 = [
  ['energydrink2', 'เครื่องดื่มเกลือแร่', '🧃', 30, 'พลังงาน +20 ดับกระหาย', { en: 20, thirst: 40 }], ['herbtea', 'ชาสมุนไพรคลายเครียด', '🍵', 60, 'อารมณ์ +15', { mood: 15 }], ['inhaler', 'ยาดมสมุนไพร', '🌿', 25, 'พลังงาน +8', { en: 8 }], ['bandage', 'ชุดปฐมพยาบาล', '🩹', 150, 'พลังงาน +30', { en: 30 }], ['sunscreen', 'ครีมกันแดด', '🧴', 120, 'อารมณ์ +5 วันนี้ไม่ร้อน', { mood: 5 }], ['vitc', 'วิตามินซี', '🍊', 90, 'ป้องกันป่วยวันนี้ + พลังงาน +10', { en: 10, cure: 1 }],
  ['rosegift', 'กุหลาบช่อใหญ่ 99 ดอก', '🌹', 1200, 'ของขวัญชั้นดี หัวใจ +3', { gift: 3 }], ['watchgift', 'นาฬิกาคู่รัก', '⌚', 3500, 'ของขวัญพิเศษ หัวใจ +4', { gift: 4 }], ['cake2', 'เค้กวันเกิดปอนด์ใหญ่', '🎂', 450, 'ของขวัญ หัวใจ +2 (วันเกิดได้ 3 เท่า)', { gift: 2 }], ['letter', 'จดหมายเขียนมือ', '✉️', 20, 'ของขวัญเล็ก ๆ หัวใจ +0.8', { gift: 0.8 }], ['plushie', 'ตุ๊กตากระต่าย', '🐰', 380, 'ของขวัญ หัวใจ +1.5 หรือให้ลูก', { gift: 1.5, kid: 25 }], ['jewelbox', 'กล่องเครื่องประดับ', '💎', 5500, 'ของขวัญหรู หัวใจ +5', { gift: 5 }],
  ['book_fish', 'ตำราเซียนตกปลา', '📗', 1300, 'ปลาหายากเจอบ่อยขึ้นถาวร', { perk: 'fish' }], ['book_money', 'หนังสือการเงินส่วนบุคคล', '📒', 900, 'ดอกเบี้ยเงินฝากเพิ่มขึ้นถาวร', { perk: 'money' }], ['book_car', 'คู่มือดูแลรถยนต์', '📓', 700, 'รถเสื่อมช้าลงถาวร', { perk: 'mech' }], ['comic', 'การ์ตูนเล่มใหม่', '📚', 85, 'อ่านแล้วอารมณ์ +12', { mood: 12 }], ['magazine', 'นิตยสารเกษตร', '📰', 60, 'ค่าประสบการณ์ +40', { xp: 40 }], ['novel2', 'นิยายแฟนตาซี', '📖', 220, 'อารมณ์ +20', { mood: 20 }],
  ['kite', 'ว่าวจุฬา', '🪁', 180, 'ให้ลูกเล่น ความสุข +25', { kid: 25 }], ['legoset', 'ชุดตัวต่อ', '🧱', 450, 'ให้ลูกเล่น ความสุข +35', { kid: 35 }], ['yoyo', 'โยโย่', '🪀', 40, 'อารมณ์ +6', { mood: 6 }], ['boardgame', 'บอร์ดเกมครอบครัว', '🎲', 690, 'เล่นกับครอบครัว อารมณ์ +20 ลูกสุข +20', { mood: 20, kid: 20 }], ['balloon', 'ลูกโป่งสวรรค์', '🎈', 30, 'ให้ลูก ความสุข +10', { kid: 10 }], ['fishtoy', 'ไม้ตกแมว', '🎣', 70, 'เล่นกับสัตว์เลี้ยง ความสุข +20', { pet: 20 }],
];
for (const [id, n, i, price, desc, fx] of GOODS2) {
  GOODS[id] = { n, i, price, desc, gift: fx.gift, kid: fx.kid, use: (fx.gift && !fx.kid && !fx.en && !fx.mood) ? null : () => {
    if (fx.perk) { S.perk = S.perk || {}; if (S.perk[fx.perk]) return 'อ่านแล้ว'; S.perk[fx.perk] = 1; }
    if (fx.en) S.energy = Math.min(maxEnergy(), S.energy + fx.en); if (fx.thirst) S.thirst = Math.min(100, (S.thirst || 50) + fx.thirst);
    if (fx.mood) S.mood = Math.min(100, (S.mood || 50) + fx.mood); if (fx.xp) Prog.add(fx.xp); if (fx.cure && S.sick === 1) S.sick = 0;
    if (fx.pet && Pets2.cur()) Pets2.cur().joy = Math.min(100, (Pets2.cur().joy ?? 60) + fx.pet);
  } };
  ITEMS[id] = { n, i, cat: 'tool' }; TOOLS[id] = { n, i, price, desc };
}
SHOPS.mall.tabs.find(t => t.n.includes('สุขภาพ')).items.push(...GOODS2.slice(0, 6).map(g => 'tool:' + g[0]));
SHOPS.mall.tabs.find(t => t.n.includes('ของขวัญ')).items.push(...GOODS2.slice(6, 12).map(g => 'tool:' + g[0]), ...GOODS2.slice(18, 24).map(g => 'tool:' + g[0]));
SHOPS.mall.tabs.find(t => t.n.includes('หนังสือ')).items.push(...GOODS2.slice(12, 18).map(g => 'tool:' + g[0]));
SHOPS.florist.tabs[0].items.push('tool:rosegift', 'tool:letter');
SHOPS.mart.tabs[1].items.push('tool:energydrink2', 'tool:inhaler', 'tool:bandage', 'tool:balloon', 'tool:yoyo', 'tool:comic', 'tool:magazine');
// --- accessories in more colours: [id, base, colour, name] ---
const WEAR2 = [['cowboy_black', 'cowboy', 0x212121, 'หมวกคาวบอยดำ'], ['cowboy_white', 'cowboy', 0xf5f5f5, 'หมวกคาวบอยขาว'], ['beanie_blue', 'beanie', 0x1565c0, 'หมวกไหมพรมน้ำเงิน'], ['beanie_green', 'beanie', 0x2e7d32, 'หมวกไหมพรมเขียว'], ['beanie_pink', 'beanie', 0xec407a, 'หมวกไหมพรมชมพู'], ['beanie_yellow', 'beanie', 0xfbc02d, 'หมวกไหมพรมเหลือง'], ['crown_gold', 'crown', 0xe0b13a, 'มงกุฎทองคำ'], ['crown_blue', 'crown', 0x64b5f6, 'มงกุฎดอกไม้ฟ้า'],
  ['shades_red', 'sunglasses', 0xc62828, 'แว่นกันแดดกรอบแดง'], ['shades_white', 'sunglasses', 0xfafafa, 'แว่นกันแดดกรอบขาว'], ['glasses_black', 'glasses', 0x111111, 'แว่นสายตากรอบดำ'], ['glasses_rose', 'glasses', 0xf48fb1, 'แว่นกรอบโรสโกลด์'], ['scarf_blue', 'scarf', 0x1e88e5, 'ผ้าพันคอฟ้า'], ['scarf_green', 'scarf', 0x43a047, 'ผ้าพันคอเขียว'], ['scarf_purple', 'scarf', 0x8e24aa, 'ผ้าพันคอม่วง'], ['pearl_black', 'pearl', 0x263238, 'สร้อยมุกดำ'],
  ['necklace_silver', 'necklace', 0xcfd8dc, 'สร้อยคอเงิน'], ['backpack_red', 'backpack', 0xc62828, 'เป้สีแดง'], ['backpack_blue', 'backpack', 0x1565c0, 'เป้สีน้ำเงิน'], ['backpack_pink', 'backpack', 0xf06292, 'เป้สีชมพู'], ['watch_gold', 'watch', 0xe0b13a, 'นาฬิกาเรือนทอง'], ['bracelet_ruby', 'bracelet', 0xc62828, 'กำไลทับทิม']];
for (const [id, base, c, n] of WEAR2) { const B = WEAR[base]; WEAR[id] = { n, i: B.i, slot: B.slot, price: Math.round(B.price * 1.2), shape: base, c }; ITEMS['wear_' + id] = { n, i: B.i, cat: 'tool' }; TOOLS['wear_' + id] = { n, i: B.i, price: WEAR[id].price, desc: 'เครื่องประดับ สวมใส่ได้จากกระเป๋า' }; }
SHOPS.mall.tabs[0].items.push(...WEAR2.filter(w => !['necklace', 'pearl', 'watch', 'bracelet'].includes(w[1])).map(w => 'tool:wear_' + w[0]));
SHOPS.mall.tabs[1].items.push(...WEAR2.filter(w => ['necklace', 'pearl', 'watch', 'bracelet'].includes(w[1])).map(w => 'tool:wear_' + w[0]));
// --- decorations shown on display stands at home: [id, name, icon, price] ---
const DECOR2 = [['d_vase', 'แจกันเซรามิก', '🏺', 450], ['d_globe', 'ลูกโลกตั้งโต๊ะ', '🌏', 650], ['d_clock', 'นาฬิกาตั้งพื้นโบราณ', '🕰️', 2800], ['d_guitar', 'กีตาร์ประดับผนัง', '🎸', 1900], ['d_cactus', 'กระบองเพชรจิ๋ว', '🌵', 150], ['d_bonsai', 'บอนไซ', '🪴', 1200], ['d_candle', 'เทียนหอม', '🕯️', 120], ['d_teddy', 'ตุ๊กตาหมียักษ์', '🧸', 900], ['d_robot', 'โมเดลหุ่นยนต์', '🤖', 1500], ['d_car', 'โมเดลรถแข่ง', '🏎️', 1100], ['d_ship', 'โมเดลเรือสำเภา', '⛵', 1700], ['d_cat', 'แมวกวัก', '🐱', 350],
  ['d_buddha', 'พระพุทธรูปบูชา', '🛕', 3200], ['d_fan', 'พัดไทยประดับผนัง', '🪭', 380], ['d_mask', 'หัวโขนจำลอง', '🎭', 2600], ['d_drum', 'กลองยาวไทย', '🥁', 1400], ['d_lamp2', 'โคมไฟล้านนา', '🏮', 520], ['d_aquarium2', 'ตู้ปลาทองเล็ก', '🐠', 980], ['d_frame', 'กรอบรูปครอบครัว', '🖼️', 260], ['d_trophy2', 'ถ้วยรางวัลจำลอง', '🏆', 600], ['d_dino', 'โมเดลไดโนเสาร์', '🦖', 1300], ['d_rocket', 'โมเดลจรวด', '🚀', 1250], ['d_books', 'ชุดหนังสือสะสม', '📚', 700], ['d_plant2', 'ต้นมอนสเตอร่า', '🌿', 640]];
for (const [id, n, i, price] of DECOR2) { FURN[id] = { n, i, price, decor: 1 }; MOVABLE.push(id); }
SHOPS.mall.tabs.find(t => t.n.includes('แต่งบ้าน')).items.push(...DECOR2.map(d => 'furn:' + d[0]));
SHOPS.carpenter.tabs[1].items.push(...DECOR2.slice(0, 12).map(d => 'furn:' + d[0]));
SHOPS.lux.tabs[0].items.push(...DECOR2.slice(12).map(d => 'furn:' + d[0]));
// --- the IT shop: [id, name, icon, price, desc, effect key] ---
const IT_GOODS = [
  ['phone_pro', 'สมาร์ตโฟนรุ่นโปร', '📱', 24900, 'กล้องชัด เก็บรูปได้ 24 รูป แอปลื่นขึ้น', 'phonepro'], ['phone_fold', 'สมาร์ตโฟนจอพับ', '📱', 45900, 'ของสะสมสุดหรู อารมณ์ +30 ครั้งเดียว', 'mood30'], ['tablet', 'แท็บเล็ตอ่านหนังสือ', '📲', 12900, 'อ่าน e-book ทุกวันได้ค่าประสบการณ์ +30', 'tablet'], ['smartwatch', 'สมาร์ตวอทช์สุขภาพ', '⌚', 7900, 'แจ้งเตือนหิว กระหาย เหนื่อย ใช้พลังงานลดลง 5%', 'watch'], ['earbuds', 'หูฟังไร้สาย', '🎧', 3900, 'ฟังเพลงตอนทำงาน อารมณ์ไม่ลดลงง่าย', 'earbuds'], ['powerbank', 'พาวเวอร์แบงก์', '🔋', 990, 'ของจำเป็นนอกบ้าน อารมณ์ +5', 'mood5'],
  ['laptop', 'โน้ตบุ๊กทำงาน', '💻', 25900, 'รับงานออนไลน์จากบ้าน (แอปงานพิเศษ) +500 ฿/ครั้ง', 'laptop'], ['gamingpc', 'คอมเล่นเกมสเปกแรง', '🖥️', 49900, 'เล่นเกมแข่งออนไลน์ อารมณ์ +25 วันละครั้ง', 'gamingpc'], ['vr', 'แว่น VR', '🥽', 15900, 'ท่องโลกเสมือน อารมณ์ +20 วันละครั้ง', 'vr'], ['console2', 'เครื่องเกมพกพา', '🎮', 11900, 'เล่นได้ทุกที่ อารมณ์ +10 วันละครั้ง', 'handheld'], ['keyboard', 'คีย์บอร์ดเกมมิ่ง', '⌨️', 2900, 'ของสะสมสายเกม', 'mood5'], ['monitor', 'จอโค้ง 34 นิ้ว', '🖥️', 13900, 'ของสะสมสายเกม อารมณ์ +10', 'mood10'],
  ['drone', 'โดรนเกษตร', '🚁', 35000, 'สำรวจไร่และพ่นยากำจัดแมลงทุกเช้าอัตโนมัติ', 'drone'], ['soilsensor', 'เซนเซอร์ความชื้นดิน IoT', '📟', 4900, 'แจ้งแปลงที่ดินแห้งในมือถือทุกเช้า', 'soil'], ['weatherstation', 'สถานีตรวจอากาศ', '🌡️', 6900, 'พยากรณ์ล่วงหน้า 3 วันในแอปอากาศ', 'wxstation'], ['gps_tractor', 'ระบบ GPS นำทางรถ', '🛰️', 8900, 'แอปแผนที่บอกทางไปทุกเมือง รถเสื่อมช้าลง', 'gps'], ['cctv_kit', 'ชุดกล้องวงจรปิด 4 ตัว', '📹', 4000, 'ติดตั้งแล้วจับขโมยได้ 60% (เหมือนบริการตำรวจ)', 'cctv'], ['router', 'เราเตอร์ WiFi 6', '📡', 2490, 'เชื่อมต่อทุกอุปกรณ์ อารมณ์ +5', 'mood5'],
  ['aispeaker', 'ลำโพง AI "น้องสุขใจ"', '🔊', 3900, SMART.aispeaker.desc, 'furn'], ['robotvac', 'หุ่นยนต์ดูดฝุ่น', '🤖', 6900, SMART.robotvac.desc, 'furn'], ['smartfridge', 'ตู้เย็นอัจฉริยะ', '🧊', 14900, SMART.smartfridge.desc, 'furn'], ['projector', 'โปรเจกเตอร์', '📽️', 9900, SMART.projector.desc, 'furn'], ['printer3d', 'เครื่องพิมพ์ 3 มิติ', '🖨️', 8900, SMART.printer3d.desc, 'furn'], ['airpurifier', 'เครื่องฟอกอากาศ', '🌬️', 4500, SMART.airpurifier.desc, 'furn'],
  ['smartgarden', 'ระบบรดน้ำอัจฉริยะ', '💧', 16000, SMART.smartgarden.desc, 'furn'], ['solar', 'โซลาร์รูฟท็อป', '☀️', 45000, SMART.solar.desc, 'furn'], ['evcharger', 'จุดเติมพลังงานรถที่บ้าน', '🔌', 12000, SMART.evcharger.desc, 'furn'], ['doorbell', 'กริ่งประตูกล้อง AI', '🔔', 3500, SMART.doorbell.desc, 'furn'],
];
for (const [id, n, i, price, desc, fx] of IT_GOODS) if (fx !== 'furn') {
  GOODS[id] = { n, i, price, desc, use: () => {
    S.gadgets = S.gadgets || {};
    if (fx.startsWith('mood')) { if (S.gadgets[id]) return 'ใช้ไปแล้ว'; S.gadgets[id] = 1; S.mood = Math.min(100, (S.mood || 50) + +fx.slice(4)); return; }
    if (['gamingpc', 'vr', 'handheld', 'tablet'].includes(fx)) { const k = 'g_' + fx; if (S.daily[k]) return 'ใช้ไปแล้ววันนี้'; S.daily[k] = 1; S.gadgets[id] = 1; if (fx === 'tablet') Prog.add(30); else S.mood = Math.min(100, (S.mood || 50) + (fx === 'gamingpc' ? 25 : fx === 'vr' ? 20 : 10)); takeItemBack(id); return; }
    if (S.gadgets[fx]) return 'ติดตั้งแล้ว'; S.gadgets[fx] = 1; if (fx === 'cctv') Stations2.st().cctv = 1; if (fx === 'gps') { S.perk = S.perk || {}; S.perk.mech = 1; } takeItemBack(id); UI.toast(`ติดตั้ง${n}แล้ว`, i);
  } };
  ITEMS[id] = { n, i, cat: 'tool' }; TOOLS[id] = { n, i, price, desc };
}
function takeItemBack(id) { setTimeout(() => { if (!count(id)) addItem(id); }, 0); }
SHOPS.itshop = { n: 'ไอทีซิตี้', tabs: [
  { n: '📱 มือถือ & แกดเจ็ต', items: IT_GOODS.slice(0, 6).map(g => 'tool:' + g[0]) },
  { n: '💻 คอม & เกม', items: IT_GOODS.slice(6, 12).map(g => 'tool:' + g[0]) },
  { n: '🌾 ฟาร์มอัจฉริยะ', items: IT_GOODS.slice(12, 18).map(g => 'tool:' + g[0]) },
  { n: '🏠 สมาร์ตโฮม AI', items: IT_GOODS.slice(18).map(g => 'furn:' + g[0]) },
] };
SHOPS.mall.tabs.find(t => t.n.includes('ไฟฟ้า')).items.push(...IT_GOODS.slice(18).map(g => 'furn:' + g[0]));
SHOPS.online.tabs.push({ n: 'ไอที', items: IT_GOODS.slice(0, 12).map(g => 'tool:' + g[0]) });
// gadget effects that run every day
const Gadgets = {
  has(k) { return S.gadgets && S.gadgets[k]; },
  morning() {
    if (this.has('drone') && S.f2 && Object.keys(S.f2.pests).length) { S.f2.pests = {}; Farm2.refresh(); Phone.msg('โดรนเกษตร', 'บินพ่นยาชีวภาพกำจัดแมลงทั่วไร่เรียบร้อย', true); }
    if (this.has('soil')) { const dry = S.plots.filter(p => p.c && p.w <= 0).length; if (dry) Phone.msg('เซนเซอร์ดิน IoT', `มีแปลงดินแห้ง ${dry} แปลง ควรรดน้ำ`, true); }
    if (this.has('laptop')) Phone.msg('งานออนไลน์', 'มีงานออนไลน์ใหม่รอทำ เปิดแอปงานพิเศษเพื่อรับงาน (+500 ฿)', true);
  },
};
