'use strict';
// ---------- More cars: work vehicles, karts, a future racer and colour editions; a second dealership in ทุ่งทอง ----------
Object.assign(CARS, {
  truckflat: { n: 'กระบะพื้นเรียบขนผัก', i: '🛻', price: 16000, top: 28, acc: 9, k: 'truck-flat' },
  deliveryflat: { n: 'รถบรรทุกพื้นเรียบ 6 ล้อ', i: '🚚', price: 24000, top: 25, acc: 7, k: 'delivery-flat' },
  garbage: { n: 'รถขนขยะ (รับจ้างเก็บขยะได้)', i: '🚛', price: 26000, top: 23, acc: 6, k: 'garbage-truck' },
  shovel: { n: 'รถตักดินหน้าฟาร์ม', i: '🚜', price: 30000, top: 12, acc: 5, k: 'tractor-shovel' },
  kart: { n: 'โกคาร์ทสีส้ม', i: '🏎️', price: 9000, top: 30, acc: 20, k: 'kart-oobi' },
  kart2: { n: 'โกคาร์ทสีเขียว', i: '🏎️', price: 9500, top: 31, acc: 20, k: 'kart-oozi' },
  racefuture: { n: 'รถแข่งแห่งอนาคต', i: '🚀', price: 120000, top: 64, acc: 27, k: 'race-future' },
  sedan_red: { n: 'ซีดานครอบครัว รุ่นสีแดง', i: '🚗', price: 13500, top: 32, acc: 11, k: 'sedan', paint: 1 },
  sedan_blue: { n: 'ซีดานครอบครัว รุ่นสีฟ้า', i: '🚗', price: 13500, top: 32, acc: 11, k: 'sedan', paint: 5 },
  hatch_yellow: { n: 'แฮทช์แบ็ก รุ่นสีเหลืองซิ่ง', i: '🚗', price: 18500, top: 37, acc: 14, k: 'hatchback-sports', paint: 3 },
  suv_green: { n: 'SUV รุ่นเขียวป่า', i: '🚙', price: 20500, top: 33, acc: 12, k: 'suv', paint: 4 },
  suvlux_black: { n: 'SUV หรู รุ่นดำเงา', i: '🚙', price: 36000, top: 39, acc: 15, k: 'suv-luxury', paint: 9 },
  sedansp_purple: { n: 'ซีดานสปอร์ต รุ่นม่วงราตรี', i: '🏎️', price: 40000, top: 47, acc: 18, k: 'sedan-sports', paint: 7 },
  sports_blue: { n: 'รถสปอร์ตริมหาด สีน้ำเงิน', i: '🏎️', price: 29000, color: 0x1565c0, top: 44, acc: 17, kind: 'sports' },
  van_white: { n: 'รถตู้ขนผัก รุ่นขาวมุก', i: '🚐', price: 15500, top: 29, acc: 9, k: 'van', paint: 10 },
});
SHOPS.dealer.tabs.push({ n: 'รุ่นสีพิเศษ', items: ['car:sedan_red', 'car:sedan_blue', 'car:hatch_yellow', 'car:suv_green', 'car:van_white'] });
SHOPS.supercar.tabs[0].items.push('car:sports_blue', 'car:sedansp_purple', 'car:suvlux_black', 'car:racefuture');
SHOPS.dealer2 = { n: 'ทุ่งทองมอเตอร์', tabs: [{ n: 'รถทำงาน', items: ['car:truckflat', 'car:deliveryflat', 'car:garbage', 'car:shovel', 'car:tractor'] }, { n: 'โกคาร์ท & รถแข่ง', items: ['car:kart', 'car:kart2', 'car:race'] }] };
// colour editions keep their paint after purchase
const _buyCar = buyCar;
buyCar = function (type, where) {
  _buyCar(type, where);
  const C = CARS[type]; if (C.paint == null) return;
  const o = G.cars[G.cars.length - 1]; o.d.tune = Object.assign(o.d.tune || {}, { paint: C.paint }); Garage.rebuild(o);
};
