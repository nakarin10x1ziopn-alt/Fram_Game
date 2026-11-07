'use strict';
// ---------- v23_shop: 30 products in every shop, real effects for every new good, "where is it kept" after buying,
// eat-in at cafés and stalls that also fills hunger/thirst ----------
// every paint edition must exist as soon as this file loads: a saved game's owned cars are built in boot(), before V23.init() runs,
// and an unknown car type there crashed the whole load
for (const _b of Object.keys(CARS)) {
  const B = CARS[_b]; if (!B.k || B.paint || _b.startsWith('v23c_')) continue;
  for (let _p = 1; _p < PAINTS.length; _p++) { const _id = `v23c_${_b}_${_p}`; if (!CARS[_id]) CARS[_id] = { n: `${B.n} สี${PAINTS[_p][0]}`, i: B.i, price: Math.round(B.price * 1.06 / 100) * 100, top: B.top, acc: B.acc, k: B.k, paint: _p }; }
}
V23.add('shop', () => {
  // ===== 1. new foods and drinks: [id, name, icon, price, energy, drink?] =====
  const FOOD_POOLS = {
    cafe: [['lattehot', 'ลาเต้ร้อน', '☕', 65, 14, 1], ['mocha', 'มอคค่าเย็น', '🥤', 75, 15, 1], ['matcha', 'มัทฉะลาเต้', '🍵', 80, 14, 1], ['capp', 'คาปูชิโน่', '☕', 70, 14, 1], ['espresso', 'เอสเปรสโซ่ดับเบิ้ลช็อต', '☕', 55, 12, 1],
      ['brownie', 'บราวนี่ช็อกโกแลต', '🍫', 60, 20], ['cheesecake', 'ชีสเค้กบลูเบอร์รี่', '🍰', 90, 24], ['tiramisu', 'ทิรามิสุ', '🍰', 95, 24], ['scone', 'สโคนเนยสด', '🥐', 55, 18], ['bagel', 'เบเกิลครีมชีส', '🥯', 70, 24],
      ['panini', 'พานินี่แฮมชีส', '🥪', 95, 32], ['clubsand', 'คลับแซนด์วิช', '🥪', 110, 36], ['pancake', 'แพนเค้กน้ำผึ้ง', '🥞', 85, 28], ['frenchtoast', 'ขนมปังปิ้งเนยนมสด', '🍞', 65, 24], ['honeytoast', 'ฮันนี่โทสต์ไอศกรีม', '🍨', 99, 30],
      ['affogato', 'อะฟฟอกาโต้', '🍨', 85, 18, 1], ['icedamer', 'อเมริกาโน่เย็น', '🥤', 60, 12, 1], ['lemonsoda', 'เลมอนโซดา', '🥤', 50, 10, 1], ['strawsmooth', 'สตรอว์เบอร์รี่สมูทตี้', '🍓', 80, 18, 1], ['mangosmooth', 'มะม่วงปั่น', '🥭', 70, 18, 1],
      ['chocmilk', 'นมช็อกโกแลตเย็น', '🥛', 55, 16, 1], ['hotchoc', 'โกโก้ร้อนมาร์ชแมลโลว์', '☕', 75, 18, 1], ['yogurtbowl', 'โยเกิร์ตผลไม้รวม', '🥣', 90, 22], ['granola', 'กราโนล่าโยเกิร์ต', '🥣', 85, 24], ['crepecake', 'เครปเค้กชาเขียว', '🍰', 95, 22],
      ['macaron', 'มาการองคละสี', '🍪', 120, 14], ['cookie', 'คุกกี้ช็อกชิพ', '🍪', 40, 14], ['eclair', 'เอแคลร์ครีมสด', '🥐', 65, 18], ['mochi', 'โมจิไอศกรีม', '🍡', 55, 14], ['tarttart', 'ทาร์ตไข่', '🥧', 45, 16]],
    street: [['moosatay', 'หมูสะเต๊ะน้ำจิ้มถั่ว', '🍢', 50, 20], ['saiua', 'ไส้อั่วเหนือ', '🌭', 60, 22], ['kanomkrok', 'ขนมครกหน้ากุ้ง', '🥞', 30, 12], ['lukchin', 'ลูกชิ้นทอดน้ำจิ้ม', '🍡', 25, 10], ['khaoniewmm', 'ข้าวเหนียวมะม่วง', '🥭', 80, 28],
      ['kraprao', 'ผัดกะเพราหมูสับไข่ดาว', '🍳', 60, 30], ['khaokaijiew', 'ข้าวไข่เจียวหมูสับ', '🍳', 40, 24], ['gaitod', 'ไก่ทอดหาดใหญ่', '🍗', 70, 28], ['hoytod', 'หอยทอดกรอบ', '🦪', 70, 26], ['padthai', 'ผัดไทยกุ้งสด', '🍝', 70, 30],
      ['todmun', 'ทอดมันปลากราย', '🍘', 55, 18], ['kanombuang', 'ขนมเบื้องไส้หวาน', '🌮', 35, 14], ['kluaytod', 'กล้วยทอดน้ำผึ้ง', '🍌', 25, 12], ['khaopod', 'ข้าวโพดต้ม', '🌽', 20, 12], ['kluaybuat', 'กล้วยบวชชี', '🍌', 30, 14],
      ['fakthong', 'ฟักทองสังขยา', '🎃', 45, 18], ['yakisoba', 'ยากิโซบะ', '🍜', 65, 28], ['takoyaki', 'ทาโกะยากิ', '🐙', 50, 18], ['hotdog', 'ฮอตดอกจัมโบ้', '🌭', 45, 22], ['corndog', 'คอร์นด็อก', '🌭', 40, 20],
      ['cottoncandy', 'สายไหมสีรุ้ง', '🍭', 25, 8], ['icecreamroll', 'ไอศกรีมโรล', '🍦', 60, 14], ['sticky', 'ข้าวเหนียวหมูทอด', '🍙', 45, 26], ['padsiew', 'ผัดซีอิ๊วหมู', '🍜', 55, 30], ['kuayteowrua', 'ก๋วยเตี๋ยวเรือ', '🍜', 45, 24],
      ['somtamthai', 'ส้มตำไทยปูปลาร้า', '🥗', 50, 16], ['larb', 'ลาบหมูข้าวเหนียว', '🥗', 65, 28], ['namtok', 'น้ำตกหมูย่าง', '🥗', 70, 28], ['grilledsquid', 'หมึกย่างซอสซีฟู้ด', '🦑', 60, 20], ['coconutcake', 'ขนมถ้วยฟู', '🍮', 20, 8]],
    sea: [['prawngrill', 'กุ้งแม่น้ำเผา', '🦐', 280, 40], ['crabcurry', 'ปูผัดผงกะหรี่', '🦀', 320, 44], ['steamfish', 'ปลากะพงนึ่งมะนาว', '🐟', 260, 40], ['fishsauce', 'ปลาทับทิมทอดน้ำปลา', '🐠', 240, 38], ['musselpot', 'หอยแมลงภู่อบหม้อดิน', '🦪', 150, 28],
      ['oystergrill', 'หอยนางรมสด', '🦪', 180, 20], ['clamstir', 'หอยลายผัดน้ำพริกเผา', '🐚', 120, 26], ['squidegg', 'ปลาหมึกไข่นึ่ง', '🦑', 160, 28], ['tomyumsea', 'ต้มยำทะเลน้ำข้น', '🍲', 190, 34], ['seafriedrice', 'ข้าวผัดทะเล', '🍚', 110, 36],
      ['crabrice', 'ข้าวผัดปู', '🍚', 130, 36], ['prawnsalad', 'ยำกุ้งสด', '🥗', 150, 26], ['seafoodsalad', 'ยำทะเลรวม', '🥗', 170, 28], ['grilledshrimp', 'กุ้งเผาจิ้มแจ่ว', '🍤', 220, 36], ['friedshrimp', 'กุ้งชุบแป้งทอด', '🍤', 160, 30],
      ['fishcake', 'ทอดมันปลา', '🍘', 80, 20], ['seabass', 'ปลากะพงทอดสามรส', '🐟', 290, 42], ['lobster', 'กุ้งมังกรอบชีส', '🦞', 650, 60], ['salmonsushi', 'ซูชิแซลมอน', '🍣', 140, 26], ['sashimi', 'ซาชิมิรวม', '🍣', 260, 32],
      ['seaport', 'ซีฟู้ดจานรวมมิตร', '🍽️', 420, 54], ['tomkhakoong', 'ต้มข่ากุ้ง', '🍲', 180, 32], ['shrimpcake', 'ปอเปี๊ยะกุ้ง', '🥟', 90, 22], ['fishnoodle', 'ก๋วยเตี๋ยวปลา', '🍜', 70, 26], ['crabstick', 'ปูอัดทอด', '🍤', 70, 18],
      ['coconutsea', 'มะพร้าวเผาไอศกรีม', '🥥', 70, 14, 1], ['seasoup', 'ซุปครีมอาหารทะเล', '🥣', 110, 24], ['grilledcrab', 'ปูม้านึ่ง', '🦀', 300, 40], ['cuttlefish', 'ปลาหมึกกล้วยย่าง', '🦑', 140, 26], ['shellrice', 'ข้าวต้มทะเล', '🍲', 90, 28]],
    drink: [['mojito', 'โมจิโต้ไม่มีแอลกอฮอล์', '🍹', 90, 14, 1], ['bluehawaii', 'บลูฮาวายโซดา', '🍹', 85, 14, 1], ['pinacolada', 'พิน่าโคลาดาสไตล์เด็ก', '🍹', 95, 16, 1], ['watermelonjuice', 'แตงโมปั่น', '🍉', 50, 14, 1], ['limejuice', 'น้ำมะนาวโซดา', '🍋', 40, 10, 1],
      ['orangejuice', 'น้ำส้มคั้นสด', '🍊', 55, 14, 1], ['pineappleshake', 'สับปะรดปั่น', '🍍', 55, 14, 1], ['lycheejuice', 'น้ำลิ้นจี่', '🧃', 50, 12, 1], ['gingertea', 'น้ำขิงร้อน', '🍵', 35, 10, 1], ['lemongrass', 'น้ำตะไคร้ใบเตย', '🍵', 30, 10, 1],
      ['rosejuice', 'น้ำกุหลาบเย็น', '🌹', 45, 10, 1], ['roselle', 'น้ำกระเจี๊ยบ', '🥤', 35, 10, 1], ['chrysan', 'น้ำเก๊กฮวย', '🥤', 30, 10, 1], ['soda', 'โซดามะนาวมินต์', '🥤', 45, 8, 1], ['icelemontea', 'ชามะนาวเย็น', '🥤', 40, 10, 1],
      ['coconutshake', 'มะพร้าวปั่น', '🥥', 60, 16, 1], ['kiwismoothie', 'กีวีสมูทตี้', '🥝', 75, 16, 1], ['bananashake', 'กล้วยหอมปั่นนมสด', '🍌', 60, 18, 1], ['avocadoshake', 'อะโวคาโดปั่น', '🥑', 85, 20, 1], ['passion', 'เสาวรสโซดา', '🥤', 55, 12, 1],
      ['grapejuice', 'น้ำองุ่นแท้', '🍇', 55, 12, 1], ['tamarind', 'น้ำมะขาม', '🥤', 30, 10, 1], ['sugarcane', 'น้ำอ้อยสด', '🎋', 30, 12, 1], ['pomegranate', 'น้ำทับทิม', '🥤', 60, 12, 1], ['aloe', 'น้ำว่านหางจระเข้', '🥤', 40, 8, 1],
      ['beachice', 'น้ำแข็งใสหน้าหาด', '🍧', 45, 12, 1], ['coconutjelly', 'วุ้นมะพร้าวอ่อน', '🥥', 40, 12], ['friedicecream', 'ไอศกรีมทอด', '🍨', 65, 18], ['seaseasalt', 'ไอติมกะทิสด', '🍦', 40, 12], ['halohalo', 'น้ำแข็งไสรวมมิตร', '🍧', 55, 14, 1]],
    north: [['khaosoi', 'ข้าวซอยไก่', '🍜', 80, 32], ['namprik', 'น้ำพริกหนุ่มผักสด', '🥗', 60, 20], ['gaengHang', 'แกงฮังเลหมู', '🍛', 85, 32], ['khanomjeennamngiao', 'ขนมจีนน้ำเงี้ยว', '🍜', 70, 28], ['laplanna', 'ลาบเหนือ', '🥗', 70, 26],
      ['jaew', 'จิ้นส้มทอด', '🍖', 55, 20], ['khaokhanjin', 'ข้าวกั๊นจิ๊น', '🍙', 45, 24], ['khaotom', 'ข้าวต้มมัด', '🍌', 25, 12], ['sticky2', 'ข้าวเหนียวมะม่วงดอย', '🥭', 70, 26], ['hotcoffeedoi', 'กาแฟดอยร้อน', '☕', 60, 14, 1],
      ['teabloom', 'ชาร้อนอัสสัม', '🍵', 45, 10, 1], ['macadamia', 'ถั่วแมคคาเดเมียอบ', '🥜', 90, 18], ['strawberrycream', 'สตรอว์เบอร์รี่ครีมสด', '🍓', 80, 18], ['avocadodoi', 'อะโวคาโดดอย', '🥑', 60, 18], ['kaipingdoi', 'ไก่ย่างดอย', '🍗', 110, 36],
      ['mushroomstew', 'ต้มเห็ดป่า', '🍲', 75, 24], ['bamboosoup', 'แกงหน่อไม้', '🍲', 60, 22], ['porkhock', 'ขาหมูพะโล้', '🍖', 95, 36], ['gaeng_kae', 'แกงแคผักรวม', '🍲', 60, 22], ['grilledtrout', 'ปลาเทราต์ย่างเกลือ', '🐟', 130, 34],
      ['hilltea', 'ชาอู่หลงภูเขา', '🍵', 55, 10, 1], ['cinnamonbun', 'ขนมปังอบอุ่นเนยโอ่', '🥐', 50, 18], ['honeycomb', 'น้ำผึ้งรวงสด', '🍯', 120, 20], ['pumpkinsoup', 'ซุปฟักทองร้อน', '🥣', 55, 20], ['sweetpotato', 'มันเผาร้อนๆ', '🍠', 30, 16],
      ['roastchestnut', 'เกาลัดคั่ว', '🌰', 45, 14], ['ginger_milk', 'นมสดขิงร้อน', '🥛', 45, 12, 1], ['bambooRice', 'ข้าวหลามหนองมน', '🎋', 50, 22], ['mountaintea', 'ชาดอกไม้ดอย', '🍵', 55, 10, 1], ['roastcorn', 'ข้าวโพดหวานย่าง', '🌽', 30, 14]],
  };
  const addFoods = pool => pool.forEach(([k, n, i, price, en, drink]) => {
    const id = 'z' + k; if (FOODS[id]) return;
    FOODS[id] = { n, i, price, en }; ITEMS['food_' + id] = { n, i, en, cat: 'dish', sell: Math.round(price * 0.35) };
    if (drink) DRINKS.push('food_' + id);
  });
  for (const k in FOOD_POOLS) addFoods(FOOD_POOLS[k]);

  // ===== 2. goods with real effects =====
  // fx keys: en energy · hunger · thirst · mood · xp · cure · pet (joy) · water (every plot) · fert (every planted plot)
  //          grow (hours of growth on every planted plot) · trough (feed bags into the trough) · feed (bags to bag) · gift (heart points when given)
  const GOODS3 = {};
  const G3 = (pool, rows) => rows.forEach(([id, n, i, price, desc, fx]) => { id = 'v_' + id; GOODS3[id] = { id, n, i, price, desc, fx, pool }; });
  G3('farm', [
    ['waterpack', 'แพ็กรดน้ำเร่งด่วน', '💧', 120, 'รดน้ำทุกแปลงที่ปลูกพืชไว้ในไร่ทันที', { water: 1 }], ['compost', 'ปุ๋ยหมักอินทรีย์ 1 ถุง', '🟤', 90, 'ใส่ปุ๋ยให้ทุกแปลงที่ปลูกอยู่ โตเร็วขึ้น', { fert: 1 }], ['growtonic', 'ยาเร่งราก', '🧪', 260, 'พืชทุกแปลงโตเพิ่ม 2 ชั่วโมงทันที', { grow: 2 }],
    ['growtonic2', 'ยาเร่งโตเข้มข้น', '⚗️', 600, 'พืชทุกแปลงโตเพิ่ม 6 ชั่วโมงทันที', { grow: 6 }], ['feedsack', 'อาหารสัตว์กระสอบใหญ่ (10 ถุง)', '🌾', 110, 'ได้อาหารสัตว์ 10 ถุงเข้ากระเป๋า', { feed: 10 }], ['feedsack2', 'อาหารสัตว์ถุงใหญ่พิเศษ (30 ถุง)', '🌾', 300, 'ได้อาหารสัตว์ 30 ถุงเข้ากระเป๋า', { feed: 30 }],
    ['troughfill', 'ชุดเติมรางอาหารอัตโนมัติ', '🥣', 70, 'เติมรางอาหารให้สัตว์ทุกตัววันนี้', { trough: 20 }], ['bonemeal', 'ปุ๋ยกระดูกป่น', '🦴', 150, 'ใส่ปุ๋ยทุกแปลง + โตเพิ่ม 1 ชั่วโมง', { fert: 1, grow: 1 }], ['fishmeal', 'ปุ๋ยปลาหมัก', '🐟', 130, 'ใส่ปุ๋ยทุกแปลงที่ปลูกอยู่', { fert: 1 }],
    ['guano', 'ปุ๋ยมูลค้างคาว', '🦇', 220, 'ใส่ปุ๋ย + รดน้ำทุกแปลง', { fert: 1, water: 1 }], ['humus', 'ดินปลูกคุณภาพสูง', '🪴', 180, 'รดน้ำทุกแปลง + โตเพิ่ม 1 ชั่วโมง', { water: 1, grow: 1 }], ['seaweedfert', 'ปุ๋ยสาหร่ายทะเล', '🌿', 200, 'ใส่ปุ๋ยทุกแปลง + โตเพิ่ม 2 ชั่วโมง', { fert: 1, grow: 2 }],
    ['rainwater', 'น้ำฝนบรรจุถัง', '🪣', 80, 'รดน้ำทุกแปลง', { water: 1 }], ['hormone', 'ฮอร์โมนไข่', '🥚', 140, 'โตเพิ่ม 3 ชั่วโมง', { grow: 3 }], ['mulch', 'ฟางคลุมดิน', '🌾', 95, 'รดน้ำทุกแปลง (เก็บความชื้น) + โตเพิ่ม 1 ชั่วโมง', { water: 1, grow: 1 }],
    ['workgloves', 'ถุงมือทำสวนกันหนาม', '🧤', 85, 'ใส่แล้วทำงานสบาย พลังงาน +10', { en: 10 }], ['farmhat', 'หมวกปีกกว้างกันแดด', '👒', 150, 'อารมณ์ +8 พลังงาน +5', { mood: 8, en: 5 }], ['rainboots', 'รองเท้าบูตยางลุยโคลน', '🥾', 320, 'อารมณ์ +10', { mood: 10 }],
    ['liniment', 'ยาหม่องนวดคลายเมื่อย', '🧴', 60, 'พลังงาน +15', { en: 15 }], ['firstaid', 'ชุดปฐมพยาบาลฟาร์ม', '🧰', 220, 'รักษาอาการป่วย + พลังงาน +10', { cure: 1, en: 10 }], ['wateringcan2', 'ถังน้ำดื่มสะอาด', '🚰', 35, 'ความกระหาย +50', { thirst: 50 }],
    ['elecdrink', 'น้ำเกลือแร่ทำงานกลางแดด', '🧃', 40, 'ความกระหาย +40 พลังงาน +15', { thirst: 40, en: 15 }], ['lunchbox', 'ปิ่นโตข้าวกับข้าว', '🍱', 90, 'อิ่มท้อง ความหิว +40 พลังงาน +30', { hunger: 40, en: 30 }], ['sunscreen', 'ครีมกันแดดทำไร่', '🧴', 120, 'อารมณ์ +5 พลังงาน +10', { mood: 5, en: 10 }],
    ['farmbook', 'คู่มือเกษตรอินทรีย์', '📘', 500, 'ได้ประสบการณ์ +60', { xp: 60 }], ['farmbook2', 'ตำราดินและน้ำ', '📙', 800, 'ได้ประสบการณ์ +100', { xp: 100 }], ['almanac', 'ปฏิทินชาวนา', '📅', 250, 'ได้ประสบการณ์ +30', { xp: 30 }],
    ['honeyfarm', 'น้ำผึ้งบำรุงแรง', '🍯', 180, 'พลังงาน +35 ความหิว +15', { en: 35, hunger: 15 }], ['herbalbalm', 'สมุนไพรอบลูกประคบ', '🌿', 130, 'พลังงาน +25 อารมณ์ +5', { en: 25, mood: 5 }], ['energybar', 'ธัญพืชอัดแท่ง', '🍫', 45, 'ความหิว +20 พลังงาน +18', { hunger: 20, en: 18 }],
  ]);
  G3('pet', [
    ['dogbiscuit', 'ขนมสุนัขแสนอร่อย', '🦴', 60, 'ความสุขสัตว์เลี้ยง +10', { pet: 10 }], ['catpouch', 'อาหารเปียกแมวซอง', '🐟', 35, 'ความสุขสัตว์เลี้ยง +8', { pet: 8 }], ['petfoodbag', 'อาหารสัตว์เลี้ยงถุงใหญ่', '🥫', 220, 'ความสุขสัตว์เลี้ยง +25', { pet: 25 }], ['chewtoy', 'ของเล่นกัดยาง', '🧸', 90, 'ความสุขสัตว์เลี้ยง +15', { pet: 15 }],
    ['ball', 'ลูกบอลยางเด้ง', '🎾', 70, 'ความสุขสัตว์เลี้ยง +12', { pet: 12 }], ['catnip', 'กัญชาแมว (แคทนิป)', '🌿', 55, 'ความสุขสัตว์เลี้ยง +14', { pet: 14 }], ['scratcher', 'ที่ลับเล็บแมว', '🐾', 160, 'ความสุขสัตว์เลี้ยง +18', { pet: 18 }], ['petshampoo', 'แชมพูอาบน้ำสัตว์เลี้ยง', '🧼', 120, 'ความสุขสัตว์เลี้ยง +20', { pet: 20 }],
    ['petvit', 'วิตามินบำรุงขน', '💊', 150, 'ความสุขสัตว์เลี้ยง +16', { pet: 16 }], ['pettreat', 'ขนมทรีตรวมรส', '🍖', 85, 'ความสุขสัตว์เลี้ยง +12', { pet: 12 }], ['petvaccine', 'ชุดตรวจสุขภาพสัตว์เลี้ยง', '💉', 350, 'ความสุขสัตว์เลี้ยง +30', { pet: 30 }], ['petbed', 'เบาะนอนนุ่มสัตว์เลี้ยง', '🛏️', 380, 'ความสุขสัตว์เลี้ยง +28', { pet: 28 }],
    ['leash', 'สายจูงเดินเล่น', '🦮', 180, 'พาเดินเล่น ความสุขสัตว์เลี้ยง +20 อารมณ์ +5', { pet: 20, mood: 5 }], ['petcollar', 'ปลอกคอกระดิ่ง', '🔔', 140, 'ความสุขสัตว์เลี้ยง +14', { pet: 14 }], ['fishflakes', 'อาหารปลาสวยงาม', '🐠', 40, 'ความสุขสัตว์เลี้ยง +6', { pet: 6 }], ['birdseed', 'เมล็ดธัญพืชนก', '🐦', 45, 'ความสุขสัตว์เลี้ยง +7', { pet: 7 }],
    ['rabbithay', 'หญ้าแห้งกระต่าย', '🌾', 50, 'ความสุขสัตว์เลี้ยง +9', { pet: 9 }], ['petfountain', 'น้ำพุน้ำดื่มสัตว์เลี้ยง', '⛲', 420, 'ความสุขสัตว์เลี้ยง +30', { pet: 30 }], ['pettoy2', 'เชือกดึงเล่น', '🪢', 65, 'ความสุขสัตว์เลี้ยง +10', { pet: 10 }], ['petbook', 'หนังสือฝึกสัตว์เลี้ยง', '📗', 400, 'ได้ประสบการณ์ +50', { xp: 50 }],
  ]);
  G3('gift', [
    ['bouq_tulip', 'ช่อทิวลิป', '🌷', 350, 'ของขวัญ หัวใจ +1', { gift: 1 }], ['bouq_sun', 'ช่อทานตะวัน', '🌻', 280, 'ของขวัญ หัวใจ +1', { gift: 1 }], ['bouq_lily', 'ช่อลิลลี่ขาว', '💐', 450, 'ของขวัญ หัวใจ +2', { gift: 2 }], ['bouq_orchid', 'กล้วยไม้ช่อสวย', '🪻', 650, 'ของขวัญ หัวใจ +2', { gift: 2 }],
    ['bouq_wild', 'ช่อดอกไม้ป่า', '🌼', 200, 'ของขวัญ หัวใจ +1', { gift: 1 }], ['bouq_baby', 'ช่อเบบี้เบรธ', '🤍', 320, 'ของขวัญ หัวใจ +1', { gift: 1 }], ['bouq_lav', 'ช่อลาเวนเดอร์', '💜', 420, 'ของขวัญ หัวใจ +2', { gift: 2 }], ['bouq_mix', 'ช่อมิกซ์ฤดูกาล', '💐', 550, 'ของขวัญ หัวใจ +2', { gift: 2 }],
    ['wreath', 'พวงหรีดดอกไม้แห้ง', '🌿', 380, 'อารมณ์ +10', { mood: 10 }], ['seedmix', 'ชุดเมล็ดดอกไม้คละสี', '🌸', 90, 'ได้ประสบการณ์ +15', { xp: 15 }], ['flowertea', 'ชาดอกไม้อบแห้ง', '🍵', 110, 'อารมณ์ +12 ความกระหาย +20', { mood: 12, thirst: 20 }], ['potpourri', 'ถุงหอมสมุนไพร', '🛍️', 75, 'อารมณ์ +8', { mood: 8 }],
    ['aromaoil', 'น้ำมันหอมระเหย', '🧴', 290, 'อารมณ์ +18', { mood: 18 }], ['candle', 'เทียนหอมดอกไม้', '🕯️', 160, 'อารมณ์ +10', { mood: 10 }], ['flowercard', 'การ์ดดอกไม้อวยพร', '💌', 45, 'ของขวัญ หัวใจ +1', { gift: 1 }], ['honeyjar', 'น้ำผึ้งดอกไม้ป่า', '🍯', 180, 'ของขวัญ หัวใจ +1 / พลังงาน +20', { gift: 1, en: 20 }],
    ['giftbox', 'กล่องของขวัญริบบิ้น', '🎁', 250, 'ของขวัญ หัวใจ +2', { gift: 2 }], ['teddy', 'ตุ๊กตาหมีตัวใหญ่', '🧸', 690, 'ของขวัญ หัวใจ +3', { gift: 3 }], ['chocbox', 'ช็อกโกแลตกล่องสวย', '🍫', 480, 'ของขวัญ หัวใจ +2', { gift: 2 }], ['perfume', 'น้ำหอมกลิ่นดอกไม้', '🧴', 890, 'ของขวัญ หัวใจ +3', { gift: 3 }],
  ]);
  G3('it', [
    ['usbhub', 'ฮับ USB 7 พอร์ต', '🔌', 590, 'ใช้ทำงานเร็วขึ้น ได้ประสบการณ์ +20', { xp: 20 }], ['powerbank', 'พาวเวอร์แบงก์ 20000mAh', '🔋', 890, 'ชาร์จหูฟัง/มือถือ อารมณ์ +6 พลังงาน +10', { mood: 6, en: 10 }], ['earbuds', 'หูฟังไร้สายตัดเสียงรบกวน', '🎧', 2900, 'ฟังเพลงผ่อนคลาย อารมณ์ +20', { mood: 20 }], ['smartband', 'สายรัดข้อวัดสุขภาพ', '⌚', 1900, 'อารมณ์ +12 พลังงาน +10', { mood: 12, en: 10 }],
    ['onlinecourse', 'คอร์สออนไลน์พัฒนาทักษะ', '🎓', 1500, 'เรียนจบ ได้ประสบการณ์ +120', { xp: 120 }], ['codingbook', 'หนังสือเขียนโปรแกรมเบื้องต้น', '📘', 650, 'ได้ประสบการณ์ +50', { xp: 50 }], ['netbook', 'ตำราเครือข่ายคอมพิวเตอร์ CCNA', '📕', 950, 'ได้ประสบการณ์ +80', { xp: 80 }], ['securitybook', 'คู่มือความปลอดภัยไซเบอร์', '📗', 890, 'ได้ประสบการณ์ +70', { xp: 70 }],
    ['gamevoucher', 'บัตรเติมเกมออนไลน์', '🎮', 300, 'เล่นเกมคลายเครียด อารมณ์ +15', { mood: 15 }], ['streamsub', 'บัตรดูหนังสตรีมมิ่ง 1 เดือน', '🎬', 349, 'ดูหนังผ่อนคลาย อารมณ์ +18', { mood: 18 }], ['cleankit', 'ชุดทำความสะอาดอุปกรณ์ไอที', '🧽', 220, 'บำรุงอุปกรณ์ ได้ประสบการณ์ +10', { xp: 10 }], ['coolpad', 'แผ่นรองระบายความร้อน', '🌬️', 650, 'ทำงานสบาย พลังงาน +8', { en: 8 }],
    ['chargecable', 'สายชาร์จ EV ใช้งานหนัก', '🔌', 1200, 'ได้ประสบการณ์ +25', { xp: 25 }], ['evmanual', 'คู่มือบำรุงรักษารถ EV', '📘', 700, 'ได้ประสบการณ์ +50', { xp: 50 }], ['solarbook', 'หนังสือติดตั้งโซลาร์เซลล์', '📗', 800, 'ได้ประสบการณ์ +60', { xp: 60 }], ['energysaver', 'ปลั๊กประหยัดไฟตั้งเวลา', '🔌', 450, 'ได้ประสบการณ์ +20', { xp: 20 }],
    ['smartbulb', 'หลอดไฟอัจฉริยะ', '💡', 390, 'อารมณ์ +8', { mood: 8 }], ['ledstrip', 'ไฟ LED ตกแต่งห้อง', '🌈', 590, 'อารมณ์ +12', { mood: 12 }], ['keyboardmech', 'คีย์บอร์ดเมคานิคอล', '⌨️', 2400, 'พิมพ์งานลื่น ได้ประสบการณ์ +30', { xp: 30 }], ['webcam', 'เว็บแคมความละเอียดสูง', '📷', 1500, 'ประชุมออนไลน์ ได้ประสบการณ์ +25', { xp: 25 }],
  ]);
  const goodsPools = { farm: [], pet: [], gift: [], it: [] };
  for (const id in GOODS3) {
    const g = GOODS3[id]; if (TOOLS[id]) continue;
    GOODS[id] = { n: g.n, i: g.i, price: g.price, desc: g.desc, gift: g.fx.gift, use: () => { } };
    ITEMS[id] = { n: g.n, i: g.i, cat: 'tool', sell: Math.round(g.price * 0.3) }; TOOLS[id] = { n: g.n, i: g.i, price: g.price, desc: g.desc };
    goodsPools[g.pool].push('tool:' + id);
  }
  // applies an effect; returns { fail } when it would do nothing so the item is kept
  const applyFx = fx => {
    const planted = S.plots.filter(p => p.c);
    if ((fx.water || fx.fert || fx.grow) && !planted.length) return { fail: 'ยังไม่มีพืชที่ปลูกอยู่ในไร่ ใช้ตอนมีพืชในแปลง' };
    if (fx.trough !== undefined && (!S.animals.length || S.trough >= (typeof Animal40 !== 'undefined' ? Animal40.need() : S.animals.length))) return { fail: S.animals.length ? 'รางอาหารเต็มแล้ว' : 'ยังไม่มีสัตว์ในคอก' };
    if (fx.pet && !(Pets2.cur && Pets2.cur())) return { fail: 'ยังไม่มีสัตว์เลี้ยง ไปรับเลี้ยงที่ศูนย์สัตว์เลี้ยง' };
    if (fx.cure && !S.sick && Object.keys(fx).length === 1) return { fail: 'ตอนนี้ไม่ได้ป่วย' };
    const msg = [];
    if (fx.water) { planted.forEach(p => p.w = 1); msg.push(`รดน้ำ ${planted.length} แปลง`); }
    if (fx.fert) { planted.forEach(p => p.f = 1); msg.push(`ใส่ปุ๋ย ${planted.length} แปลง`); }
    if (fx.grow) { planted.forEach(p => { const C = CROPS[p.c]; if (C) p.g = Math.min(C.grow, p.g + fx.grow); }); msg.push(`พืชโตเพิ่ม ${fx.grow} ชม.`); }
    if (fx.trough !== undefined) { const n = Math.min(fx.trough, Math.max(0, (typeof Animal40 !== 'undefined' ? Animal40.need() : S.animals.length) - S.trough)); S.trough += n; msg.push(`เติมราง ${n} ที่`); }
    if (fx.feed) { addItem('feed', fx.feed); msg.push(`ได้อาหารสัตว์ ${fx.feed} ถุง`); }
    if (fx.en) { S.energy = Math.min(maxEnergy(), S.energy + fx.en); msg.push(`พลังงาน +${fx.en}`); }
    if (fx.hunger) { S.hunger = Math.min(100, (S.hunger ?? 50) + fx.hunger); msg.push(`ความหิว +${fx.hunger}`); }
    if (fx.thirst) { S.thirst = Math.min(100, (S.thirst ?? 50) + fx.thirst); msg.push(`ความกระหาย +${fx.thirst}`); }
    if (fx.mood) { S.mood = Math.min(100, (S.mood ?? 50) + fx.mood); msg.push(`อารมณ์ +${fx.mood}`); }
    if (fx.xp) { Prog.add(fx.xp); msg.push(`ประสบการณ์ +${fx.xp}`); }
    if (fx.cure && S.sick) { S.sick = 0; msg.push('หายป่วยแล้ว'); }
    if (fx.pet) { const p = Pets2.cur(); p.joy = Math.min(100, (p.joy ?? 60) + fx.pet); msg.push(`สัตว์เลี้ยงมีความสุข +${fx.pet}`); }
    if (fx.gift && !msg.length) msg.push('เก็บไว้ให้เป็นของขวัญได้');
    return { msg: msg.join(' · ') };
  };
  const _ug = UI.H.usegood;
  UI.H.usegood = d => {
    const g = GOODS3[d.id]; if (!g) return _ug(d);
    if (!count(d.id)) return;
    if (g.fx.gift && Object.keys(g.fx).length === 1) { UI.toast(`${g.n}: ใช้เป็นของขวัญ — ไปคุยกับคนที่อยากให้แล้วเลือกมอบของขวัญ`, g.i); return; }
    const r = applyFx(g.fx); if (r.fail) { UI.toast(r.fail, g.i); return; }
    takeItem(d.id); UI.toast(`ใช้${g.n}แล้ว — ${r.msg}`, g.i); Sfx.pop && Sfx.pop(); saveGame(true);
  };

  // ===== 3. more display decor (placeable at home like the other decorations) =====
  const DECOR3 = [['d3_orchidpot', 'กระถางกล้วยไม้ช้างกระ', '🪻', 850], ['d3_bonsai2', 'บอนไซสนจิ๋ว', '🌲', 1500], ['d3_fishbowl', 'อ่างบัวและปลาทอง', '🐟', 1100], ['d3_tapestry', 'ผ้าทอลายขอพระราชทาน', '🧶', 1300], ['d3_mirror', 'กระจกเงากรอบไม้แกะสลัก', '🪞', 1700], ['d3_candles', 'เชิงเทียนทองเหลือง', '🕯️', 650],
    ['d3_telescope', 'กล้องดูดาวตั้งพื้น', '🔭', 3500], ['d3_chess', 'ชุดหมากรุกไม้สัก', '♟️', 1200], ['d3_radio', 'วิทยุโบราณวินเทจ', '📻', 1800], ['d3_typewriter', 'เครื่องพิมพ์ดีดโบราณ', '⌨️', 2200], ['d3_vinyl', 'เครื่องเล่นแผ่นเสียง', '💿', 4200], ['d3_swordwall', 'ดาบไทยโบราณติดผนัง', '🗡️', 3900],
    ['d3_boat', 'เรือสำเภาจำลอง', '⛵', 2600], ['d3_elephant2', 'ช้างทองเหลืองคู่', '🐘', 3100], ['d3_lotus', 'โคมลอยดอกบัว', '🪷', 780], ['d3_bamboo', 'กระถางไผ่มงคล', '🎍', 520], ['d3_ricesack', 'ถังข้าวเปลือกตกแต่ง', '🌾', 450], ['d3_cartwheel', 'ล้อเกวียนตกแต่ง', '🛞', 1400]];
  for (const [id, n, i, price] of DECOR3) if (!FURN[id]) { FURN[id] = { n, i, price, decor: 1 }; MOVABLE.push(id); }
  const decorKeys = DECOR3.map(d => 'furn:' + d[0]);

  // ===== 4. more car editions: every dealership reaches 30 models (real paint editions of the real models) =====
  const bases = Object.keys(CARS).filter(k => CARS[k].k && !CARS[k].paint && !k.startsWith('v23c_'));
  const mkEdition = (base, paint) => {
    const id = `v23c_${base}_${paint}`; if (CARS[id]) return id;
    const B = CARS[base], pn = PAINTS[paint][0];
    CARS[id] = { n: `${B.n} สี${pn}`, i: B.i, price: Math.round(B.price * 1.06 / 100) * 100, top: B.top, acc: B.acc, k: B.k, paint };
    return id;
  };
  const carFill = (shop, baseList) => {
    const sh = SHOPS[shop], tab = { n: '🎨 รุ่นสีพิเศษเพิ่มเติม', items: [] }; sh.tabs.push(tab);
    const have = () => sh.tabs.reduce((a, t) => a + t.items.length, 0);
    for (let p = 1; p < PAINTS.length && have() < 30; p++) for (const b of baseList) { if (have() >= 30) break; tab.items.push('car:' + mkEdition(b, p)); }
    if (!tab.items.length) sh.tabs.pop();
  };
  carFill('dealer', ['sedan', 'hatch', 'suv', 'van', 'pickup'].filter(b => CARS[b] && CARS[b].k));
  carFill('supercar', ['suvlux', 'sedansp', 'race'].filter(b => CARS[b] && CARS[b].k));
  carFill('dealer2', ['truckflat', 'deliveryflat', 'tractor', 'delivery', 'truck'].filter(b => CARS[b] && CARS[b].k));

  // ===== 5. top every shop up to 30 products =====
  const total = sh => sh.tabs.reduce((a, t) => a + t.items.length, 0) + (MENU[sh.id] ? MENU[sh.id].reduce((a, c) => a + c[1].length, 0) : 0);
  const foodKeys = k => FOOD_POOLS[k].map(f => 'food:z' + f[0]);
  const taken = sh => new Set(sh.tabs.flatMap(t => t.items));
  const topUp = (shopId, tabName, sources, onlyTool) => {
    const sh = SHOPS[shopId]; if (!sh) return; sh.id = shopId;
    let need = 30 - total(sh); if (need <= 0) return;
    const have = taken(sh), pick = [];
    for (const src of sources) for (const k of src) { if (pick.length >= need) break; if (have.has(k) || pick.includes(k)) continue; if (onlyTool && !k.startsWith('tool:')) continue; pick.push(k); }
    // keep tab sizes readable: split into tabs of at most 12
    for (let i = 0; i < pick.length; i += 12) sh.tabs.push({ n: tabName + (pick.length > 12 ? ` ${i / 12 + 1}` : ''), items: pick.slice(i, i + 12) });
  };
  const F = {
    cafe: foodKeys('cafe'), street: foodKeys('street'), sea: foodKeys('sea'), drink: foodKeys('drink'), north: foodKeys('north'),
    farm: goodsPools.farm, pet: goodsPools.pet, gift: goodsPools.gift, it: goodsPools.it, decor: decorKeys,
  };
  // restaurants use a menu (dine-in / takeaway): add a tab to the menu
  const menuFill = (shopId, pools) => {
    const sh = SHOPS[shopId], m = MENU[shopId]; if (!sh || !m) return; sh.id = shopId;
    const have = new Set(m.flatMap(c => c[1].map(r => r[0]))); let need = 30 - total(sh); if (need <= 0) return;
    const rows = [];
    for (const pool of pools) for (const f of FOOD_POOLS[pool]) { const id = 'z' + f[0]; if (rows.length >= need) break; if (!have.has(id)) rows.push([id, f[1], f[2], f[3], f[4]]); }
    m.push(['🍽️ เมนูพิเศษของร้าน', rows]);
  };
  menuFill('restaurant', ['street', 'north']); menuFill('seafood', ['sea']);
  topUp('citycafe', '☕ คาเฟ่เพิ่มเติม', [F.cafe, F.drink]);
  topUp('nightmarket', '🍢 ของกินริมทาง', [F.street]);
  topUp('wkmarket', '🛍️ ตลาดนัดเพิ่มเติม', [F.street, F.drink, F.gift]);
  topUp('floating', '🚤 ของกินบนเรือ', [F.sea, F.drink]);
  topUp('islandbar', '🍹 บาร์ริมหาด', [F.drink, F.sea]);
  topUp('mountain', '⛰️ ของดอย', [F.north, F.gift]);
  topUp('fest_hot', '🍧 ของเย็นหน้าร้อน', [F.drink, F.street]);
  topUp('fest_rain', '🍲 ของร้อนหน้าฝน', [F.north, F.street]);
  topUp('fest_cool', '🍵 ของอุ่นหน้าหนาว', [F.north, F.cafe]);
  topUp('farmshop', '🧰 วัสดุเกษตรเพิ่มเติม', [F.farm], true);
  topUp('ranch', '🐄 อุปกรณ์ปศุสัตว์', [F.farm, F.pet], true);
  topUp('hardware', '🔧 อุปกรณ์ช่าง & ฟาร์ม', [F.farm], true);
  topUp('rare', '💎 ของหายากเพิ่มเติม', [F.farm, F.gift], true);
  topUp('online', '📦 สินค้าออนไลน์เพิ่มเติม', [F.farm, F.gift, F.it], true);
  topUp('florist', '💐 ดอกไม้ & ของขวัญ', [F.gift, F.decor]);
  topUp('petshop', '🐾 อุปกรณ์สัตว์เลี้ยง', [F.pet], true);
  topUp('lux', '🏺 ของตกแต่งหรู', [F.decor]);
  topUp('carpenter', '🪑 ของตกแต่งไม้', [F.decor]);
  topUp('itshop', '💻 อุปกรณ์เสริมไอที', [F.it], true);
  topUp('evcenter', '⚡ อุปกรณ์ & ความรู้พลังงาน', [F.it], true);
  topUp('dealer', '🔑 อื่นๆ', [[]]); topUp('supercar', '🔑 อื่นๆ', [[]]); topUp('dealer2', '🔑 อื่นๆ', [[]]);
  for (const id in SHOPS) { SHOPS[id].id = id; SHOPS[id].tabs = SHOPS[id].tabs.filter(t => t.items.length); }

  // ===== 6. where a purchase is kept =====
  const where = key => {
    const [k, id] = key.split(':'), bag = (n) => `🎒 กระเป๋า (มี ${n || 0} ชิ้น)`;
    if (k === 'furn') return '🏠 ส่งเข้าบ้าน — วาง/ย้ายได้ในโหมดแต่งบ้าน (ต้องอยู่ในบ้าน)';
    if (k === 'car') return '🅿️ จอดหน้าโชว์รูม/โรงจอดรถ — เดินไปขึ้นรถ';
    if (k === 'animal') return '🐄 คอกสัตว์ในฟาร์ม';
    if (k === 'pet') return '🏠 อยู่ในบ้านและเดินตามคุณ';
    if (k === 'seed') return bag(count('seed_' + id));
    if (k === 'food') return bag(count('food_' + id)) + ' — กดกินจากกระเป๋าได้';
    if (k === 'tool') return bag(count(id));
    if (k === 'pc') return bag(count('pc_' + id)) + ' — ประกอบ/ติดตั้งที่โต๊ะคอม';
    if (k === 'sec') return bag(count('sec_' + id)) + ' — นำไปติดตั้งที่บ้านผ่านช่างเครือข่าย';
    if (k === 'up') return '⬆️ อัปเกรดทันที';
    if (k === 'fut' || k === 'pw') return '🏠 ติดตั้งที่บ้านทันที';
    return '🎒 กระเป๋า';
  };
  const EATIN = new Set(['citycafe', 'nightmarket', 'wkmarket', 'floating', 'islandbar', 'mountain', 'fest_hot', 'fest_rain', 'fest_cool']);

  // ===== 7. shop window: shows where each item is stored, plus "eat here" at cafés and stalls =====
  const _shop = UI.shop;
  UI.shop = function (id) {
    if (MENU[id]) return _shop.call(UI, id);
    const sh = SHOPS[id]; this.shopId = id;
    const bagN = Object.values(S.inv).reduce((a, b) => a + b, 0);
    this.open(sh.n + ` · ${total(sh)} รายการ`, sh.tabs.map(t => t.n), tab => {
      return `<p class="dim">🎒 กระเป๋าตอนนี้ ${bagN} ชิ้น · 🍽️ ความหิว ${Math.round(S.hunger ?? 0)}% · ความกระหาย ${Math.round(S.thirst ?? 0)}%</p><div class="grid">${sh.tabs[tab].items.map(key => {
        const e = this.entry(key, id), mu = (id === 'online' ? 1.1 : (typeof shopDiscount === 'function' ? shopDiscount(id) : 1)), px = e.price ? Math.round(e.price * mu) : 0, poor = S.money < px;   // v162: the price shown is the price charged
        const dine = EATIN.has(id) && key.startsWith('food:') && FOODS[key.slice(5)] ? `<button class="btn ghost" data-a="v23dine" data-id="${key.slice(5)}" ${poor ? 'disabled' : ''}>ทานที่ร้าน</button>` : '';
        const btns = e.block ? `<button class="btn" disabled>${esc(e.block)}</button>` :
          `<button class="btn" data-a="buy" data-k="${key}" data-q="1" ${poor ? 'disabled' : ''}>${e.price ? baht(px) : 'ฟรี'}</button>` +
          (e.multi ? `<button class="btn ghost" data-a="buy" data-k="${key}" data-q="5" ${S.money < px * 5 ? 'disabled' : ''}>×5</button>` : '') + dine;
        return `<div class="card"><div class="ci">${e.icon}</div><div class="cb"><h4>${esc(e.name)}${e.own ? `<small> มี ${e.own}</small>` : ''}</h4><p>${esc(e.desc)}</p><p class="dim">📍 เก็บที่: ${esc(where(key).replace(/^[^ ]+ /, ''))}</p><div class="row">${btns}</div></div></div>`;
      }).join('')}</div>`;
    });
  };
  UI.H.v23dine = d => Food.dine(d.id);
  const _buy = UI.H.buy;
  UI.H.buy = function (d) {
    const m0 = S.money, shop = UI.shopId; _buy.call(this, d);
    if (S.money < m0 && d.k) { const t = shop === 'online' ? 'พัสดุจะมาส่งพรุ่งนี้เช้า แล้วเก็บเข้ากระเป๋า' : 'เก็บที่: ' + where(d.k).replace(/^[^ ]+ /, ''); setTimeout(() => UI.toast(t, '📍'), 350); }
  };

  // ===== 8. eating at a shop also fills hunger (and thirst for drinks) =====
  Food.dine = function (id) {
    const F2 = FOODS[id]; if (!F2) return;
    if (S.money < F2.price) { UI.toast('เงินไม่พอ', '💸'); return; }
    if (S.hunger > 96 && S.energy >= maxEnergy() && !DRINKS.includes('food_' + id)) { UI.toast('อิ่มแล้ว พลังงานเต็ม ไม่ต้องกินเพิ่ม', '😊'); return; }
    S.money -= F2.price; UI.close();
    const st = Social.st(), partner = st.partner, withLove = partner && st.stage !== null && G.npcs.find(n => n.name === partner && Math.hypot(n.x - G.player.pos.x, n.z - G.player.pos.z) < 30);
    const drink = DRINKS.includes('food_' + id);
    playAct('sit', 2.5, true);
    fade(() => {
      tick(drink ? 10 : 30);
      const en = Math.round(F2.en * 1.2), hu = Math.round(F2.en * 1.3 * 1.2);
      S.energy = Math.min(maxEnergy(), S.energy + en);
      S.hunger = Math.min(100, (S.hunger ?? 50) + (drink ? Math.round(hu * 0.4) : hu));
      if (drink) S.thirst = Math.min(100, (S.thirst ?? 50) + 55);
      S.mood = Math.min(100, (S.mood ?? 50) + 4);
      Prog.add(3); Sfx.coin(); S.stats.cooked = S.stats.cooked || 0;
      if (withLove) Friends.add(partner, 0.3);
      UI.toast(`${drink ? 'ดื่ม' : 'นั่งทาน'}${F2.n}ที่ร้าน! พลังงาน +${en} · ความหิว +${drink ? Math.round(hu * 0.4) : hu}${drink ? ' · ความกระหาย +55' : ''}${withLove ? ` · ${partner}มานั่งกินด้วย ❤️` : ''}`, F2.i);
    });
  };
});
