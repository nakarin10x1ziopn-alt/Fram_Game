'use strict';
// ---------- Game data ----------
// grow / regrow in game hours (1 game hour = 30 real seconds)
const CROPS = {
  carrot:     { n: 'แครอท', i: '🥕', seed: 20, sell: 45, grow: 5, en: 8 },
  cabbage:    { n: 'กะหล่ำปลี', i: '🥬', seed: 35, sell: 80, grow: 8, en: 10 },
  tomato:     { n: 'มะเขือเทศ', i: '🍅', seed: 45, sell: 38, grow: 7, regrow: 4, en: 6 },
  chili:      { n: 'พริกขี้หนู', i: '🌶️', seed: 25, sell: 20, grow: 6, regrow: 3, en: 2 },
  corn:       { n: 'ข้าวโพด', i: '🌽', seed: 55, sell: 115, grow: 10, en: 12 },
  eggplant:   { n: 'มะเขือม่วง', i: '🍆', seed: 50, sell: 42, grow: 8, regrow: 4.5, en: 7 },
  strawberry: { n: 'สตรอว์เบอร์รี', i: '🍓', seed: 90, sell: 55, grow: 9, regrow: 4.5, en: 8 },
  pumpkin:    { n: 'ฟักทอง', i: '🎃', seed: 120, sell: 340, grow: 15, en: 20 },
  sunflower:  { n: 'ทานตะวัน', i: '🌻', seed: 70, sell: 160, grow: 12, en: 0 },
  watermelon: { n: 'แตงโม', i: '🍉', seed: 160, sell: 450, grow: 18, en: 25 },
  pineapple:  { n: 'สับปะรด', i: '🍍', seed: 180, sell: 480, grow: 20, en: 20 },
  mango:      { n: 'มะม่วง', i: '🥭', seed: 900, sell: 110, grow: 24, regrow: 8, en: 12, tree: true, yield: 3 },
  orange:     { n: 'ส้ม', i: '🍊', seed: 750, sell: 90, grow: 22, regrow: 7, en: 10, tree: true, yield: 3 },
};
// Three Thai seasons of 7 days each; crops grow 30% faster in their season but sell cheaper (more supply)
const SEASON_LEN = 7;
const SEASONS = [
  { id: 'hot', n: 'ฤดูร้อน', i: '🌞', tint: 0xf4eccc, w: { sunny: 50, partly: 27, cloudy: 10, rain: 6, storm: 3, fog: 4 } },
  { id: 'rain', n: 'ฤดูฝน', i: '🌧️', tint: 0xd6f0cc, w: { sunny: 14, partly: 22, cloudy: 22, rain: 28, storm: 11, fog: 3 } },
  { id: 'cool', n: 'ฤดูหนาว', i: '❄️', tint: 0xf2e2c6, w: { sunny: 38, partly: 25, cloudy: 12, rain: 4, storm: 1, fog: 20 } },
];
const CROP_SEASON = { watermelon: 'hot', pineapple: 'hot', corn: 'hot', sunflower: 'hot', chili: 'hot', mango: 'hot', tomato: 'rain', eggplant: 'rain', pumpkin: 'rain', cabbage: 'cool', carrot: 'cool', strawberry: 'cool', orange: 'cool' };
// Character creator options
const LOOK = {
  skin: [0xf1c9a5, 0xe3b08a, 0xc68d63, 0x8d5a3b],
  hair: [0x1b120c, 0x3a2416, 0x7a4a26, 0xc9a15a, 0x9e9e9e, 0x8e3b2b],
  style: [['short', 'ผมสั้น'], ['long', 'ผมยาว'], ['bun', 'มัดจุก']],
  shirt: [0xc8433a, 0x3e7cc8, 0x4f9a4a, 0xf2c12e, 0xf0f0f0, 0x8e44ad, 0xf08aa0, 0x2d2d2d],
  pants: [0x3e6aa8, 0x2f3b4a, 0x6b4a2e, 0x4f6b3a, 0x8a2b2b, 0xd8c8a8],
  hat: [['straw', 'หมวกฟาง'], ['cap', 'หมวกแก๊ป'], ['none', 'ไม่ใส่']],
  ov: [['overalls', 'ชุดเอี๊ยม'], ['plain', 'เสื้อ+กางเกง']],
};
const MOVABLE = ['rug', 'sofa', 'tv', 'table', 'plant', 'bookshelf', 'lamp', 'piano', 'aquarium', 'elephant', 'lanternL', 'trophy', 'trophy2', 'flowers'];
// one festival on the last day of every season, held in the village plaza
const FESTIVALS = {
  hot: { n: 'เทศกาลสงกรานต์', i: '💦', shop: 'fest_hot', desc: 'สาดน้ำคลายร้อนกับชาวบ้าน ประกวดผลผลิต และซื้อของที่ระลึก' },
  rain: { n: 'งานเกษตรแฟร์', i: '🎪', shop: 'fest_rain', desc: 'ขายผักได้ราคาแพงขึ้น 20% ทั้งวัน และมีประกวดผลผลิต' },
  cool: { n: 'งานลอยกระทง', i: '🪷', shop: 'fest_cool', desc: 'ซื้อกระทงไปลอยที่บ่อน้ำหรือท่าเรือตอนกลางคืน ชมโคมลอยเต็มฟ้า' },
};
// farmer level needed to buy each seed
const SEED_LVL = { carrot: 1, cabbage: 1, chili: 1, tomato: 2, corn: 3, eggplant: 3, strawberry: 4, sunflower: 4, pumpkin: 5, watermelon: 6, pineapple: 6, orange: 7, mango: 8 };
const PETS = { dog: { n: 'สุนัข', i: '🐕', price: 1500 }, cat: { n: 'แมว', i: '🐈', price: 1200 } };
// minerals found in the mine; d = minimum floor, w = weight, hp = pickaxe hits at level 1
const MINERALS = {
  stone:    { n: 'หินก้อน', i: '🪨', sell: 8, d: 1, w: 60, hp: 1 },
  copper:   { n: 'แร่ทองแดง', i: '🟠', sell: 35, d: 1, w: 26, hp: 2 },
  iron:     { n: 'แร่เหล็ก', i: '⚫', sell: 70, d: 3, w: 18, hp: 3 },
  amethyst: { n: 'อเมทิสต์', i: '💜', sell: 260, d: 4, w: 5, hp: 3 },
  gold:     { n: 'แร่ทองคำ', i: '🟡', sell: 160, d: 6, w: 10, hp: 4 },
  ruby:     { n: 'ทับทิม', i: '🔴', sell: 520, d: 8, w: 3, hp: 4 },
  diamond:  { n: 'เพชร', i: '💎', sell: 1200, d: 12, w: 1.2, hp: 5 },
};
const PRODUCTS = {
  egg:     { n: 'ไข่ไก่', i: '🥚', sell: 55, en: 10 },
  milk:    { n: 'นมสด', i: '🥛', sell: 190, en: 15 },
  wool:    { n: 'ขนแกะ', i: '🧶', sell: 220 },
  truffle: { n: 'เห็ดทรัฟเฟิล', i: '🍄', sell: 380, en: 12 },   // no longer produced (a pig does not make truffles); kept so old saves can still sell them
  manure:  { n: 'ปุ๋ยมูลหมู (ถุง 25 กก.)', i: '🧺', sell: 45 },
};
const ANIMALS = {
  chicken: { n: 'ไก่', i: '🐔', price: 400, prod: 'egg', speed: 1.1, r: 0.35 },
  sheep:   { n: 'แกะ', i: '🐑', price: 1600, prod: 'wool', speed: 0.9, r: 0.7 },
  cow:     { n: 'วัว', i: '🐄', price: 2200, prod: 'milk', speed: 0.8, r: 1.0 },
  pig:     { n: 'หมู', i: '🐖', price: 2800, prod: 'manure', speed: 0.9, r: 0.7 },
};
const ANIMAL_NAMES = ['ป๊อปคอร์น', 'มะลิ', 'ข้าวตู', 'บัวลอย', 'ทองดี', 'ส้มโอ', 'นมเย็น', 'ขนมปัง', 'ลูกชุบ', 'โกโก้', 'มัชฉะ', 'ถั่วแดง', 'สายไหม', 'น้ำผึ้ง', 'ปุยฝ้าย', 'ทับทิม'];
// d = difficulty (fish speed in the reel minigame); w = catch weight
const FISH = {
  nile:     { n: 'ปลานิล', i: '🐟', sell: 35, d: 1.0, w: 40, water: 'fresh' },
  catfish:  { n: 'ปลาดุก', i: '🐟', sell: 55, d: 1.4, w: 25, water: 'fresh' },
  barb:     { n: 'ปลาตะเพียน', i: '🐠', sell: 50, d: 1.5, w: 20, water: 'fresh' },
  snakehead:{ n: 'ปลาช่อน', i: '🐟', sell: 90, d: 2.0, w: 15, water: 'fresh' },
  prawn:    { n: 'กุ้งก้ามกราม', i: '🦐', sell: 200, d: 2.4, w: 8, water: 'fresh' },
  giant:    { n: 'ปลาบึก', i: '🐋', sell: 1500, d: 3.6, w: 1.5, water: 'fresh', rare: true },
  mackerel: { n: 'ปลาทู', i: '🐟', sell: 40, d: 1.0, w: 35, water: 'sea' },
  crab:     { n: 'ปูม้า', i: '🦀', sell: 110, d: 1.5, w: 18, water: 'sea' },
  seabass:  { n: 'ปลากะพง', i: '🐟', sell: 130, d: 2.0, w: 20, water: 'sea' },
  squid:    { n: 'หมึกกล้วย', i: '🦑', sell: 160, d: 2.3, w: 14, water: 'sea' },
  octopus:  { n: 'หมึกยักษ์', i: '🐙', sell: 280, d: 2.9, w: 6, water: 'sea' },
  tuna:     { n: 'ปลาอินทรี', i: '🐡', sell: 1200, d: 3.5, w: 1.5, water: 'sea', rare: true },
};
const RECIPES = {
  salad:    { n: 'สลัดผักสด', i: '🥗', need: { cabbage: 1, tomato: 1, carrot: 1 }, en: 45, sell: 260 },
  omelet:   { n: 'ไข่เจียวพริก', i: '🍳', need: { egg: 2, chili: 1 }, en: 40, sell: 170 },
  stirfry:  { n: 'ผัดมะเขือม่วง', i: '🍛', need: { eggplant: 2, chili: 1 }, en: 45, sell: 160 },
  cornsoup: { n: 'ซุปข้าวโพด', i: '🍲', need: { corn: 1, milk: 1 }, en: 55, sell: 300 },
  pie:      { n: 'พายฟักทอง', i: '🥧', need: { pumpkin: 1, egg: 1, milk: 1 }, en: 90, sell: 650 },
  smoothie: { n: 'มะม่วงปั่นนมสด', i: '🥤', need: { mango: 1, milk: 1 }, en: 60, sell: 330 },
  grilled:  { n: 'ปลานิลเผาเกลือ', i: '🐟', need: { fish_nile: 1, chili: 1 }, en: 50, sell: 240 },
  tomyum:   { n: 'ต้มยำกุ้ง', i: '🍲', need: { fish_prawn: 1, chili: 1, tomato: 1 }, en: 75, sell: 650 },
  tuchili:  { n: 'ปลาทูน้ำพริก', i: '🍱', need: { fish_mackerel: 1, chili: 2, cabbage: 1 }, en: 55, sell: 300 },
  squidfry: { n: 'หมึกผัดไข่เค็ม', i: '🥘', need: { fish_squid: 1, egg: 1 }, en: 60, sell: 480 },
  fruits:   { n: 'ผลไม้รวมเย็นชื่นใจ', i: '🍧', need: { watermelon: 1, pineapple: 1, strawberry: 2 }, en: 80, sell: 1300 },
};
const FOODS = {
  rice:    { n: 'ข้าวผัดไข่', i: '🍚', price: 90, en: 35 },
  noodle:  { n: 'ก๋วยเตี๋ยวต้มยำ', i: '🍜', price: 80, en: 30 },
  coffee:  { n: 'กาแฟเย็น', i: '🧋', price: 60, en: 20 },
  seafood: { n: 'กุ้งเผาริมหาด', i: '🦐', price: 240, en: 75 },
  ice:     { n: 'ลอดช่องน้ำกะทิ', i: '🍧', price: 40, en: 30 },
};
const TOOLS = {
  feed:          { n: 'อาหารสัตว์', i: '🌾', price: 12, desc: 'เติมรางอาหาร สัตว์กิน 1 ถุง/ตัว/วัน' },
  fert:          { n: 'ปุ๋ยเร่งโต', i: '🧪', price: 50, desc: 'ผักโตเร็วขึ้น 50% จนกว่าจะเก็บเกี่ยว' },
  sprinkler:     { n: 'สปริงเกอร์', i: '💦', price: 450, r: 2.2, desc: 'รดน้ำอัตโนมัติ 4 แปลงรอบตัว ตอน 6:00 และ 15:00' },
  krathong:      { n: 'กระทงใบตอง', i: '🪷', price: 50, desc: 'ลอยที่บ่อน้ำหรือท่าเรือในคืนลอยกระทง ขอพรให้ผลผลิตวันพรุ่งนี้ได้คุณภาพดี' },
  sprinkler_pro: { n: 'สปริงเกอร์โปร', i: '⛲', price: 1500, r: 4.0, desc: 'รดน้ำอัตโนมัติ 12 แปลงรอบตัว ตอน 6:00 และ 15:00' },
};
const FURN = {
  rug:       { n: 'พรมทอมือ', i: '🧵', price: 300 },
  plant:     { n: 'ต้นไม้ในกระถาง', i: '🪴', price: 180 },
  lamp:      { n: 'โคมไฟตั้งพื้น', i: '💡', price: 320 },
  painting:  { n: 'ภาพวาดทิวทัศน์', i: '🖼️', price: 450 },
  table:     { n: 'โต๊ะกินข้าว', i: '🍽️', price: 550 },
  bookshelf: { n: 'ชั้นหนังสือ', i: '📚', price: 650 },
  sofa:      { n: 'โซฟาผ้านุ่ม', i: '🛋️', price: 900 },
  tv:        { n: 'ทีวีจอแบน', i: '📺', price: 1500 },
  aquarium:  { n: 'ตู้ปลา', i: '🐠', price: 3500 },
  piano:     { n: 'เปียโน', i: '🎹', price: 5000 },
  elephant:  { n: 'ตุ๊กตาช้างไม้แกะสลัก', i: '🐘', price: 2500 },
  lanternL:  { n: 'โคมไฟล้านนา', i: '🏮', price: 1800 },
  trophy:    { n: 'ถ้วยรางวัลประกวดผลผลิต', i: '🏆', price: 0 },
};
const CARS = {
  oldtruck: { n: 'กระบะเก่าคู่ใจ', i: '🛻', price: 3500, color: 0x4f8a8b, top: 19, acc: 7, kind: 'pickup' },
  pickup:   { n: 'กระบะ 4 ประตู', i: '🛻', price: 9500, color: 0xb8322a, top: 28, acc: 10, kind: 'pickup' },
  sports:   { n: 'รถสปอร์ตริมหาด', i: '🏎️', price: 28000, color: 0xf2c12e, top: 44, acc: 17, kind: 'sports' },
};
const WEATHER = {
  sunny:  { n: 'แดดจ้า', i: '☀️', cloud: 0.12, rain: 0, fog: 0, wind: 0.2 },
  partly: { n: 'มีเมฆบางส่วน', i: '⛅', cloud: 0.45, rain: 0, fog: 0, wind: 0.35 },
  cloudy: { n: 'เมฆครึ้ม', i: '☁️', cloud: 0.88, rain: 0, fog: 0.15, wind: 0.5 },
  rain:   { n: 'ฝนตก', i: '🌧️', cloud: 1, rain: 0.65, fog: 0.25, wind: 0.6 },
  storm:  { n: 'พายุฝนฟ้าคะนอง', i: '⛈️', cloud: 1, rain: 1, fog: 0.35, wind: 1, storm: 1 },
  fog:    { n: 'หมอกหนา', i: '🌫️', cloud: 0.6, rain: 0, fog: 1, wind: 0.1 },
};
const WEATHER_W = [['sunny', 34], ['partly', 26], ['cloudy', 14], ['rain', 13], ['storm', 6], ['fog', 7]];
const WALLS = [
  { n: 'ครีม', c: 0xf1e3c8 }, { n: 'ฟ้าพาสเทล', c: 0xc9dff0 }, { n: 'เขียวมิ้นต์', c: 0xcfe8d2 },
  { n: 'ชมพูอ่อน', c: 0xf2d3da }, { n: 'เหลืองนวล', c: 0xf5e7b4 }, { n: 'เทาหมอก', c: 0xd8d8d4 },
];
const FLOORS = [
  { n: 'ไม้สัก', c: 0xc9965f, t: 'wood' }, { n: 'ไม้เข้ม', c: 0x7a4e30, t: 'wood' },
  { n: 'กระเบื้องขาว', c: 0xf2efe8, t: 'tile' }, { n: 'กระเบื้องฟ้า', c: 0xb9d4e4, t: 'tile' },
];
const FIELD_COUNTS = [6, 12, 18, 30];
const SOIL_MULT = [1, 1.3, 1.6];
const CAN_CAP = [15, 30, 50];
const BARN_CAP = [4, 8, 14];
const UPG = {
  house:   { n: 'อัปเกรดบ้าน', i: '🏡', start: 1, cost: [0, 6000, 18000], desc: ['', 'บ้านหลังใหญ่ ระเบียง ปล่องไฟ ห้องกว้างขึ้น', 'บ้าน 2 ชั้นหลังงาม ห้องใหญ่ที่สุด'] },
  field:   { n: 'ขยายแปลงผัก', i: '🟫', start: 1, cost: [0, 1500, 4500, 12000], desc: ['', 'เพิ่มเป็น 12 แปลง', 'เพิ่มเป็น 18 แปลง', 'เพิ่มเป็น 30 แปลง'] },
  soil:    { n: 'ปรับปรุงดิน', i: '🌱', start: 1, cost: [0, 2500, 7000], desc: ['', 'โตเร็วขึ้น 30% · มีโอกาสได้ผลผลิตเพิ่ม · ขอบแปลงไม้', 'โตเร็วขึ้น 60% · ผลผลิตเพิ่มบ่อยขึ้น · ขอบแปลงหิน'] },
  barn:    { n: 'ขยายโรงเรือนสัตว์', i: '🐄', start: 1, cost: [0, 3500, 9000], desc: ['', 'เลี้ยงสัตว์ได้ 8 ตัว', 'เลี้ยงสัตว์ได้ 14 ตัว'] },
  feeder:  { n: 'เครื่องให้อาหารอัตโนมัติ', i: '⚙️', start: 0, cost: [4000], desc: ['เติมรางอาหารจากกระเป๋าให้เองทุกเช้า'] },
  orchard: { n: 'เปิดสวนผลไม้', i: '🌳', start: 0, cost: [3000], desc: ['หลุมปลูกไม้ผล 6 หลุม (มะม่วง ส้ม)'] },
  rod:     { n: 'คันเบ็ดตกปลา', i: '🎣', start: 0, cost: [300, 2500, 8000], desc: ['คันเบ็ดไม้ไผ่ ตกปลาที่บ่อในฟาร์มและท่าเรือ', 'คันเบ็ดคาร์บอน: ช่องดึงกว้างขึ้น ปลาหายากมาบ่อยขึ้น', 'คันเบ็ดทองคำ: ช่องดึงกว้างสุด ปลากินเบ็ดไวขึ้น'] },
  pick:    { n: 'จอบขุดแร่', i: '⛏️', start: 0, cost: [500, 3000, 9000], desc: ['ใช้ขุดหินและแร่ในเหมืองบนเขา', 'จอบเหล็ก: ขุดแรงขึ้น 2 เท่า', 'จอบทองคำ: ขุดแรงขึ้น 3 เท่า'] },
  can:     { n: 'อัปเกรดบัวรดน้ำ', i: '🚿', start: 1, cost: [0, 1500, 5000], desc: ['', 'จุน้ำ 30 · รดทีละ 3 แปลงในแถว', 'จุน้ำ 50 · รดทีละ 9 แปลง (3×3)'] },
};
const SHOPS = {
  farmshop:   { n: 'ร้านเกษตรรุ่งเรือง', tabs: [
    { n: 'เมล็ดพันธุ์', items: ['seed:carrot', 'seed:cabbage', 'seed:tomato', 'seed:chili', 'seed:corn', 'seed:eggplant', 'seed:strawberry', 'seed:pumpkin', 'seed:sunflower'] },
    { n: 'อุปกรณ์', items: ['up:rod', 'up:can', 'tool:sprinkler', 'tool:sprinkler_pro', 'tool:fert', 'tool:feed'] }] },
  ranch:      { n: 'ฟาร์มปศุสัตว์ลุงมี', tabs: [
    { n: 'สัตว์เลี้ยง', items: ['animal:chicken', 'animal:sheep', 'animal:cow'] },
    { n: 'อาหารสัตว์', items: ['tool:feed'] },
    { n: 'สัตว์เลี้ยงในบ้าน', items: ['pet:dog', 'pet:cat'] }] },
  fest_hot: { n: 'ซุ้มงานสงกรานต์', tabs: [{ n: 'ของในงาน', items: ['food:ice', 'furn:elephant', 'furn:lanternL'] }] },
  fest_rain: { n: 'ซุ้มเกษตรแฟร์', tabs: [{ n: 'ของในงาน', items: ['seed:watermelon', 'seed:pineapple', 'tool:fert', 'food:ice', 'furn:lanternL'] }] },
  fest_cool: { n: 'ซุ้มลอยกระทง', tabs: [{ n: 'ของในงาน', items: ['tool:krathong', 'food:ice', 'furn:lanternL', 'furn:elephant'] }] },
  online: { n: 'ร้านค้าออนไลน์ (ส่งถึงบ้านพรุ่งนี้เช้า)', tabs: [
    { n: 'เมล็ดพันธุ์', items: ['seed:carrot', 'seed:cabbage', 'seed:tomato', 'seed:chili', 'seed:corn', 'seed:eggplant', 'seed:strawberry', 'seed:pumpkin', 'seed:sunflower', 'seed:watermelon', 'seed:pineapple'] },
    { n: 'อุปกรณ์', items: ['tool:feed', 'tool:fert', 'tool:sprinkler'] }] },
  carpenter:  { n: 'ช่างไม้ & เฟอร์นิเจอร์', tabs: [
    { n: 'อัปเกรดฟาร์ม', items: ['up:pick', 'up:house', 'up:field', 'up:soil', 'up:barn', 'up:feeder', 'up:orchard'] },
    { n: 'เฟอร์นิเจอร์', items: ['furn:rug', 'furn:plant', 'furn:lamp', 'furn:painting', 'furn:table', 'furn:bookshelf', 'furn:sofa', 'furn:tv'] }] },
  dealer:     { n: 'โชว์รูมรถยนต์สุขใจ', tabs: [{ n: 'รถยนต์', items: ['car:oldtruck', 'car:pickup'] }] },
  restaurant: { n: 'ร้านอาหารป้าแดง', tabs: [{ n: 'เมนู', items: ['food:rice', 'food:noodle', 'food:coffee'] }] },
  rare:       { n: 'ร้านพันธุ์ไม้หายาก', tabs: [
    { n: 'พันธุ์หายาก', items: ['seed:watermelon', 'seed:pineapple', 'seed:mango', 'seed:orange'] },
    { n: 'พิเศษ', items: ['up:rod', 'animal:pig', 'tool:sprinkler_pro', 'tool:fert'] }] },
  lux:        { n: 'บ้านสวยเฟอร์นิเจอร์', tabs: [{ n: 'ของแต่งบ้านหรู', items: ['furn:piano', 'furn:aquarium', 'furn:tv', 'furn:sofa', 'furn:painting'] }] },
  supercar:   { n: 'ซุปเปอร์คาร์ริมหาด', tabs: [{ n: 'รถยนต์', items: ['car:sports', 'car:pickup'] }] },
  seafood:    { n: 'ร้านซีฟู้ดริมหาด', tabs: [{ n: 'เมนู', items: ['food:seafood', 'food:coffee', 'food:rice'] }] },
};
const NPC_LINES = [
  'ผักต้องการน้ำทุกวันนะ ถ้าดินแห้งจะหยุดโต',
  'วันไหนฝนตก ไม่ต้องรดน้ำเลย สบายไป!',
  'ตลาดริมทะเลรับซื้อผลผลิตแพงกว่าที่อื่นตั้ง 50%',
  'สปริงเกอร์ช่วยรดน้ำตอนเช้ากับบ่ายให้อัตโนมัติ',
  'อยากได้ไข่ไก่ทุกวัน อย่าลืมเติมอาหารในรางนะ',
  'ร้านช่างไม้รับอัปเกรดบ้านกับขยายแปลงผัก',
  'ทำอาหารในครัวที่บ้าน ขายได้ราคาดีกว่าผักสดอีก',
  'ถ้าเหนื่อยก็กินอะไรหน่อย หรือกลับไปนอนพักนะ',
  'ข้ามถนนระวังรถด้วยนะหลานเอ๋ย',
  'ได้ยินว่าร้านพันธุ์ไม้หายากมีต้นมะม่วงขายด้วย',
  'ดูพยากรณ์อากาศจากทีวีที่บ้านได้นะ ถ้ามีทีวี',
  'ปุ๋ยเร่งโตทำให้ผักโตไวขึ้นเยอะเลย',
  'ตกปลาตอนกลางคืน มีโอกาสเจอปลาหายากนะ',
  'ที่ท่าเรือริมทะเลมีหมึกกับปลาอินทรีด้วย',
];
const NPC_NAMES = ['ป้าแดง', 'ลุงมี', 'น้องฝน', 'พี่ต้น', 'ยายสาย', 'ครูเอ', 'พี่หมอก', 'น้าชม', 'ตาเพิ่ม', 'น้องข้าวหอม', 'พี่ทะเล', 'ป้าจิ๋ว'];
const GOALS = [
  { t: 'ปลูกผัก 3 แปลง', k: s => s.stats.planted, n: 3, reward: 100 },
  { t: 'รดน้ำผัก 4 ครั้ง', k: s => s.stats.watered, n: 4, reward: 100 },
  { t: 'เก็บเกี่ยวผลผลิต 5 ชิ้น', k: s => s.stats.harvest, n: 5, reward: 150 },
  { t: 'ส่งขายของที่กล่องหน้าบ้าน', k: s => s.stats.sold, n: 1, reward: 100 },
  { t: 'ไปร้านเกษตรในหมู่บ้าน ซื้อของ 1 ชิ้น', k: s => s.stats.bought, n: 1, reward: 150 },
  { t: 'ซื้อไก่ตัวแรกที่ฟาร์มปศุสัตว์', k: s => s.animals.length, n: 1, reward: 200 },
  { t: 'เติมอาหารในรางอาหารสัตว์', k: s => s.stats.fed, n: 1, reward: 100 },
  { t: 'เก็บผลผลิตจากสัตว์', k: s => s.stats.products, n: 1, reward: 200 },
  { t: 'ทำอาหารในครัวที่บ้าน', k: s => s.stats.cooked, n: 1, reward: 200 },
  { t: 'วางสปริงเกอร์ในแปลงผัก', k: s => s.sprinklers.length, n: 1, reward: 300 },
  { t: 'เก็บเงินซื้อรถคันแรก', k: s => s.cars.length, n: 1, reward: 500 },
  { t: 'ขับรถไปเมืองริมทะเล', k: s => s.stats.sea ? 1 : 0, n: 1, reward: 500 },
  { t: 'อัปเกรดบ้านเป็นระดับ 2', k: s => s.up.house - 1, n: 1, reward: 1000 },
  { t: 'มีสัตว์เลี้ยง 6 ตัว', k: s => s.animals.length, n: 6, reward: 1500 },
  { t: 'ตกปลาได้ 3 ตัว', k: s => s.stats.fish || 0, n: 3, reward: 800 },
  { t: 'ส่งของตามออเดอร์บนกระดานในหมู่บ้าน', k: s => s.stats.orders || 0, n: 1, reward: 300 },
  { t: 'เป็นเพื่อนสนิทกับชาวบ้าน 3 หัวใจ', k: s => Math.max(0, ...Object.values(s.friends || {})) >= 3 ? 1 : 0, n: 1, reward: 600 },
  { t: 'สะสมเงิน 50,000 บาท', k: s => s.money, n: 50000, reward: 5000 },
];

// Unified item registry
const ITEMS = {};
(function () {
  for (const id in CROPS) {
    const c = CROPS[id];
    ITEMS[id] = { n: c.n, i: c.i, sell: c.sell, en: c.en, cat: 'crop' };
    ITEMS['seed_' + id] = { n: (c.tree ? 'ต้นกล้า' : 'เมล็ด') + c.n, i: c.i, cat: 'seed', seed: id, badge: c.tree ? '🌱' : '•' };
  }
  for (const id in PRODUCTS) ITEMS[id] = Object.assign({ cat: 'product' }, PRODUCTS[id]);
  for (const id in RECIPES) ITEMS['dish_' + id] = { n: RECIPES[id].n, i: RECIPES[id].i, sell: RECIPES[id].sell, en: RECIPES[id].en, cat: 'dish' };
  for (const id in FOODS) ITEMS['food_' + id] = { n: FOODS[id].n, i: FOODS[id].i, en: FOODS[id].en, cat: 'dish' };
  // silver (★) and gold (★★) quality produce
  for (const id in CROPS) for (const q of [1, 2]) {
    const b = ITEMS[id]; ITEMS[id + '@' + q] = Object.assign({}, b, { n: b.n + (q === 1 ? ' ★' : ' ★★'), sell: Math.round(b.sell * (q === 1 ? 1.25 : 1.5)), base: id, q });
  }
  for (const id in FISH) ITEMS['fish_' + id] = { n: FISH[id].n, i: FISH[id].i, sell: FISH[id].sell, cat: 'fish' };
  for (const id in MINERALS) ITEMS[id] = { n: MINERALS[id].n, i: MINERALS[id].i, sell: MINERALS[id].sell, cat: 'mineral' };
  for (const id in TOOLS) ITEMS[id] = { n: TOOLS[id].n, i: TOOLS[id].i, cat: 'tool' };
})();
