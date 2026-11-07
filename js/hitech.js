'use strict';
// ---------- Hi-tech living: home power grid (solar roof, solar farm, battery, meter, outages, net metering),
// EV cars and a charging network, building your own houses on bought land, house extensions,
// the smart-home phone app and multi-step AI commands with schedules ----------
const LOTS = [
  { id: 'east', n: 'ที่ดินแปลงใหญ่ท้ายไร่', x: 55, z: 50, rot: Math.PI, price: 35000 },
  { id: 'south', n: 'ที่ดินริมบ่อน้ำท้ายไร่', x: 25, z: 50, rot: Math.PI, price: 30000 },
  { id: 'phupha', n: 'ที่ดินในเมืองภูผาใหม่', x: -132, z: -372, rot: Math.PI / 2, price: 60000 },
];
const SOLAR_FARM = { x: -54, z: -6 };
for (const L of LOTS) FLAT_PADS.push({ x: L.x, z: L.z, r: 10 });
FLAT_PADS.push({ x: SOLAR_FARM.x, z: SOLAR_FARM.z, r: 11 });
// house designs a contractor can build on a lot: price, rent per day, look
const HOUSE_DESIGNS = {
  thai: { n: 'บ้านไม้ไทยประยุกต์', i: '🛖', price: 180000, rent: 450, o: { w: 9, d: 7, h: 3.2, roofH: 2.6, wallTex: 'wood', wall: 0xc8a27c, roof: 0x8d3b2a, winF: [-2.6, 2.6], winS: [0], flowers: true, pots: true, shutter: 0x5d4037 } },
  resort: { n: 'บ้านพักตากอากาศ', i: '🏕️', price: 220000, rent: 600, o: { w: 10, d: 8, h: 3.4, roofH: 3.2, wallTex: 'wood', wall: 0xefebe9, roof: 0x4e342e, winF: [-3, 3], winS: [-1.5, 1.5], pots: true, shutter: 0x2e7d32 } },
  modern: { n: 'บ้านโมเดิร์นหลังคาแบน', i: '🏠', price: 260000, rent: 650, flat: 1, o: { w: 10, d: 8, h: 3.6, flat: true, glassFront: true, wall: 0xfafafa, roof: 0x9e9e9e, winS: [-2, 2] } },
  smart: { n: 'บ้านสมาร์ทโฮมกระจก 2 ชั้น', i: '🏢', price: 420000, rent: 1000, flat: 1, o: { w: 11, d: 9, h: 6.2, rows: 2, flat: true, glassFront: true, wall: 0xeceff1, roof: 0x607d8b, winS: [-2.5, 2.5] } },
};
// rooms added onto the main house
const HOUSE_EXT = {
  office: { n: 'ห้องทำงานที่บ้าน', i: '🧑‍💻', price: 45000, desc: 'งานออนไลน์/งานพิเศษที่ทำจากบ้านได้เงินเพิ่ม 40% วางคอมประกอบเองได้' },
  guest: { n: 'ห้องนอนแขก (โฮมสเตย์)', i: '🛏️', price: 60000, desc: 'นักท่องเที่ยวมาพักทุกคืน รายได้ 250-450 ฿ ต่อวัน' },
  gym: { n: 'ห้องฟิตเนส', i: '🏋️', price: 38000, desc: 'ออกกำลังกายวันละครั้ง พลังงานสูงสุดถาวร +1 (สูงสุด +30)' },
  rooftop: { n: 'ดาดฟ้าชมวิวและสวนลอยฟ้า', i: '🌇', price: 30000, desc: 'นั่งชมวิวพระอาทิตย์ตก อารมณ์ +15 วันละครั้ง' },
};
// EV models (battery stored in d.fuel as percent, charged at chargers instead of the petrol station)
Object.assign(CARS, {
  ev_city: { n: 'EV ซิตี้คาร์ สีขาวมุก', i: '🔋', price: 22000, top: 34, acc: 16, k: 'hatchback-sports', paint: 10, ev: 1, range: 320 },
  ev_sedan: { n: 'EV ซีดาน สีฟ้าทะเล', i: '🔋', price: 32000, top: 40, acc: 18, k: 'sedan-sports', paint: 5, ev: 1, range: 480 },
  ev_suv: { n: 'EV SUV ครอบครัว สีเงิน', i: '🔋', price: 42000, top: 38, acc: 17, k: 'suv-luxury', paint: 11, ev: 1, range: 520, auto: 1 },
  ev_van: { n: 'EV รถตู้ขนผักไฟฟ้า', i: '🔋', price: 28000, top: 30, acc: 12, k: 'van', paint: 4, ev: 1, range: 300 },
  ev_pickup: { n: 'EV กระบะไฟฟ้า', i: '🔋', price: 36000, top: 36, acc: 16, k: 'truck', paint: 9, ev: 1, range: 420 },
  ev_super: { n: 'EV ไฮเปอร์คาร์ 0-100 ใน 2 วิ', i: '⚡', price: 160000, top: 70, acc: 34, k: 'race-future', paint: 6, ev: 1, range: 600, auto: 1 },
});
SHOPS.evcenter = {
  n: 'ศูนย์ EV & พลังงานสะอาดภูผา', tabs: [
    { n: 'รถยนต์ไฟฟ้า EV', items: ['car:ev_city', 'car:ev_van', 'car:ev_sedan', 'car:ev_pickup', 'car:ev_suv', 'car:ev_super'] },
    { n: 'โซลาร์ & แบตเตอรี่', items: ['pw:roof', 'pw:farm', 'pw:batt', 'pw:meter', 'pw:wallbox', 'pw:autopilot'] },
  ],
};
const isEV = d => !!(d && CARS[d.type] && CARS[d.type].ev);

const PW_ITEMS = {
  roof: { n: 'แผงโซลาร์บนหลังคาบ้าน +4 แผง (2.2 kW)', i: '☀️', price: 32000, desc: () => `ติดบนหลังคาบ้านหลัก ตอนนี้ ${Power.st().panels}/${Power.roofMax()} แผง (หลังคาใหญ่ขึ้นเมื่ออัปเกรดบ้าน)`, block: () => Power.st().panels + 4 > Power.roofMax() ? 'หลังคาเต็มแล้ว' : '', buy: () => { Power.st().panels += 4; Power.visual(); } },
  farm: { n: 'โซลาร์ฟาร์มภาคพื้นดิน +10 แผง (5.5 kW)', i: '🔆', price: 70000, desc: () => `ลานแผงข้างโรงจอดรถ ผลิตไฟขายคืนการไฟฟ้า ตอนนี้ ${Power.st().farm}/40 แผง`, block: () => Power.st().farm >= 40 ? 'เต็มพื้นที่แล้ว' : '', buy: () => { Power.st().farm += 10; Power.visual(); } },
  batt: { n: 'แบตเตอรี่บ้าน 10 kWh', i: '🔋', price: 49000, desc: () => `เก็บไฟโซลาร์ไว้ใช้กลางคืน และสำรองไฟตอนไฟดับ ตอนนี้ ${Power.st().batt}/30 kWh`, block: () => Power.st().batt >= 30 ? 'ครบ 30 kWh แล้ว' : '', buy: () => { Power.st().batt += 10; Power.visual(); } },
  meter: { n: 'ขยายมิเตอร์ไฟฟ้า', i: '⚡', price: 4500, desc: () => `ตอนนี้รับไฟได้ ${Power.st().amp} kW · ${Power.st().amp < 10 ? 'ขยายเป็น 15(45)A รับได้ 10 kW (จำเป็นสำหรับชาร์จรถ EV ที่บ้าน)' : 'ขยายเป็น 30(100)A รับได้ 22 kW'}`, block: () => Power.st().amp >= 22 ? 'สูงสุดแล้ว' : '', buy: () => { const s = Power.st(); s.amp = s.amp < 10 ? 10 : 22; s.trip = 0; } },
  wallbox: { n: 'เครื่องชาร์จ EV Wallbox 7 kW ที่บ้าน', i: '🔌', price: 12000, desc: () => 'จอดรถ EV ที่โรงจอดแล้วชาร์จเองชั่วโมงละ ~22% ใช้ไฟโซลาร์ก่อน ต้องขยายมิเตอร์ด้วย', block: () => S.furn.evcharger ? 'ติดตั้งแล้ว' : '', buy: () => { S.furn.evcharger = 1; } },
  autopilot: { n: 'ระบบขับขี่อัตโนมัติ (Autopilot)', i: '🤖', price: 39000, desc: () => 'ติดตั้งให้รถ EV ทุกคัน กดเลือกจุดหมายแล้วรถพาไปเอง', block: () => S.autopilot ? 'ติดตั้งแล้ว' : '', buy: () => { S.autopilot = 1; } },
};
// custom shop entries ('pw:', and later 'pc:' / 'fut:' from other modules)
const ENTRY_KINDS = {
  pw: id => { const P = PW_ITEMS[id]; return { icon: P.i, name: P.n, desc: P.desc(), price: P.price, block: P.block(), buy: () => { P.buy(); Life2.note('ติดตั้ง' + P.n); UI.toast(`ติดตั้ง${P.n}เรียบร้อย`, P.i); } }; },
};
const _uiEntry = UI.entry;
UI.entry = function (key, shop) { const [k, id] = key.split(':'); return ENTRY_KINDS[k] ? ENTRY_KINDS[k](id, shop) : _uiEntry.call(this, key, shop); };

// ===================== Power grid =====================
const Power = {
  st() {
    if (!S.pw) S.pw = { panels: S.furn.solar ? 8 : 0, farm: 0, batt: 0, soc: 0, amp: 3.3, wkImp: 0, wkExp: 0, today: { prod: 0, use: 0, imp: 0, exp: 0 }, out: 0, trip: 0, evOn: 1, lastH: null };
    return S.pw;
  },
  roofMax() { return [8, 12, 20][S.up.house - 1] || 8; },
  kwp() { const s = this.st(); return (s.panels + s.farm) * 0.55; },
  sun(h) { const k = { sunny: 1, partly: 0.78, cloudy: 0.42, fog: 0.5, rain: 0.2, storm: 0.08 }[S.weather.type] ?? 0.6; return Math.max(0, Math.sin((h - 6) / 12 * Math.PI)) * k; },
  // kW used in this hour: base, lights at night, air-con, gadgets, plus extra loads that other modules register
  extra: [],
  load(h) {
    let kw = 0.25 + (h >= 18 || h < 6 ? 0.3 : 0) + (S.ac ? 1.4 : 0) + Object.keys(S.furn).length * 0.015;
    for (const f of this.extra) kw += f(h) || 0;
    return kw;
  },
  // run the grid for one game hour (called for every hour, including those skipped while sleeping)
  hourStep(h) {
    const s = this.st(), dark = s.out > 0 || s.trip;
    let ev = 0;
    if (S.furn.evcharger && s.evOn && !dark) for (const o of G.cars) { const d = o.d; if (!isEV(d) || G.driving === o) continue; Town2.carState(d); if (d.fuel < 100 && Math.hypot(d.x - GARAGE.x, d.z - GARAGE.z) < 14) { const add = Math.min(100 - d.fuel, 22); d.fuel += add; ev += 7 * add / 22; } }
    const prod = this.kwp() * this.sun(h), use = this.load(h) + ev;
    if (use > s.amp && !s.trip && !(prod >= use)) { s.trip = 1; S.ac = false; if (!G.simulating) { UI.toast('เบรกเกอร์ตัด! ใช้ไฟเกินมิเตอร์ (' + s.amp + ' kW) รีเซ็ตได้ที่แอปบ้านอัจฉริยะ', '⚡'); } Phone.msg('บ้านอัจฉริยะ', `ไฟเกิน ${use.toFixed(1)} kW แต่มิเตอร์รับได้ ${s.amp} kW เบรกเกอร์จึงตัด ลองลดการใช้ไฟหรือขยายมิเตอร์ที่ศูนย์ EV ภูผา`, false); return; }
    let net = prod - use;
    if (net > 0) { const room = s.batt - s.soc, c = Math.min(room, net); s.soc += c; net -= c; s.today.exp += net; s.wkExp += net; }
    else { const need = -net, b = Math.min(s.soc, need); s.soc -= b; const imp = need - b; if (s.out > 0 && imp > 0.01) { /* outage and battery empty */ } else { s.today.imp += imp; s.wkImp += imp; } }
    s.today.prod += prod; s.today.use += use;
    if (s.out > 0) { s.out--; if (!s.out && S.powerOff === 2) { S.powerOff = 0; if (!G.simulating) UI.toast('ไฟฟ้ากลับมาแล้ว', '💡'); } }
    // storms knock the grid out now and then; a charged battery keeps the house running
    if (!s.out && S.weather.type === 'storm' && Math.random() < 0.08) {
      s.out = 2 + ((Math.random() * 3) | 0);
      if (s.soc > 2) { if (!G.simulating) UI.toast(`ไฟดับจากพายุ! แบตเตอรี่บ้านจ่ายไฟสำรองให้ (${Math.round(s.soc)} kWh)`, '🔋'); }
      else { if (!S.powerOff) S.powerOff = 2; S.ac = false; S.mood = Math.max(0, (S.mood || 50) - 5); if (!G.simulating) UI.toast('ไฟดับจากพายุ ประมาณ ' + s.out + ' ชั่วโมง (ติดแบตเตอรี่บ้านไว้สำรองไฟได้)', '🌩️'); }
    }
  },
  // catch up every hour since the last call
  sync() {
    const s = this.st(), now = S.day * 24 + Math.floor(S.time / 60);
    if (s.lastH == null || now - s.lastH > 36 || now < s.lastH) s.lastH = now - 1;
    while (s.lastH < now) { s.lastH++; this.hourStep(((s.lastH % 24) + 24) % 24); }
  },
  morning() { const s = this.st(); s.yday = s.today; s.today = { prod: 0, use: 0, imp: 0, exp: 0 }; },
  status() {
    const s = this.st(), h = Math.floor(S.time / 60), prod = this.kwp() * this.sun(h), use = this.load(h);
    return { prod, use, soc: s.soc, batt: s.batt, dark: s.out > 0 || s.trip };
  },
  // ----- visuals: panels on the main roof's front slope and a ground array beside the garage -----
  visual() {
    const s = this.st();
    if (this.g) { World.outdoor.remove(this.g); this.g = null; }
    if (!s.panels && !s.farm && !s.batt) return;
    const g = new THREE.Group(); World.outdoor.add(g); this.g = g;
    const cell = mc(0x1a237e, { roughness: 0.25, metalness: 0.6 }), frame = mc(0xb0bec5, { metalness: 0.7, roughness: 0.3 });
    if (s.panels) {
      const o = HOUSE_DEF[S.up.house - 1], rh = o.roofH, d = o.d, hd = d / 2 + 0.55, k = rh / (d / 2), a = Math.atan(k), top = 0.4 + (o.h || 3.2);
      const roof = new THREE.Group(); roof.position.set(HOUSE_POS.x, top + rh - hd / 2 * k + 0.13, HOUSE_POS.z + hd / 2); roof.rotation.x = a; g.add(roof);
      const cols = Math.ceil(s.panels / 2), pw = Math.min(1.05, (o.w - 1) / cols);
      for (let i = 0; i < s.panels; i++) { const c = i % cols, r = (i / cols) | 0; U.mk(roof, GEO.box, cell, [(c - (cols - 1) / 2) * pw, 0, (r - 0.5) * 1.65], [pw - 0.08, 0.05, 1.55]); }
    }
    if (s.farm) {
      if (!this.cleared) { this.cleared = 1; World.clearNear(SOLAR_FARM.x, SOLAR_FARM.z, 11, true); }
      const rows = Math.ceil(s.farm / 10);
      for (let r = 0; r < rows; r++) for (let c = 0; c < 10 && r * 10 + c < s.farm; c++) {
        const x = SOLAR_FARM.x - 8 + c * 1.75, z = SOLAR_FARM.z - 6 + r * 4, y = World.groundY(x, z);
        U.mk(g, GEO.box, frame, [x, y + 0.55, z], [0.08, 1.1, 0.08]);
        const p = U.mk(g, GEO.box, cell, [x, y + 1.15, z], [1.6, 0.05, 2.0]); p.rotation.x = -0.45;
      }
      if (!this.farmCol) this.farmCol = Col.box(SOLAR_FARM.x, SOLAR_FARM.z, 9, 8);
    }
    if (s.batt) { const p = l2w(GARAGE.x, GARAGE.z, GARAGE.rot, -GARAGE.w / 4, -GARAGE.d / 2 - 0.6); U.mk(g, GEO.box, mc(0xeceff1, { roughness: 0.3 }), [p.x, World.groundY(p.x, p.z) + 0.6 + 0.2 * (s.batt / 10), p.z], [0.3, 1.2 + 0.4 * (s.batt / 10), 0.8]); U.mk(g, GEO.box, new THREE.MeshBasicMaterial({ color: 0x69f0ae, toneMapped: false }), [p.x + 0.16, World.groundY(p.x, p.z) + 1.2, p.z], [0.02, 0.05, 0.4]); }
  },
};

// ===================== EV: charging network and autopilot =====================
const EV = {
  stations: [],
  init() {
    // public DC fast chargers: the petrol station, both towns and the EV centre
    const pts = [];   // since v83 the EV charging sites are built by v53_fuel.js, apart from the petrol stations, in every town
    for (const p of pts) {
      const g = new THREE.Group(), y = World.groundY(p.x, p.z); g.position.set(p.x, y, p.z); World.outdoor.add(g);
      U.mk(g, GEO.box, mc(0x263238, { roughness: 0.4 }), [0, 0.9, 0], [0.6, 1.8, 0.4]); U.mk(g, GEO.box, new THREE.MeshBasicMaterial({ color: 0x00e5ff, toneMapped: false }), [0, 1.45, 0.21], [0.4, 0.3, 0.02]);
      U.mk(g, GEO.box, mc(0x00c853), [0, 2.05, 0], [0.7, 0.12, 0.5]); Col.circle(p.x, p.z, 0.45);
      World.pois.push({ kind: 'act', x: p.x, z: p.z + 1.4, r: 4, label: p.n, icon: '⚡', map: true, act: () => ({ icon: '⚡', label: 'ชาร์จเร็ว DC รถ EV ที่จอดใกล้ ๆ (1.5 ฿/%)', fn: () => this.charge(p, 1.5) }) });
      this.stations.push(p);
    }
    // petrol pumps do not fill electric cars
    const _ref = Town2.refuelNear.bind(Town2);
    Town2.refuelNear = function () { const c = G.driving || G.cars.find(o => Math.hypot(o.d.x - GAS.x, o.d.z - GAS.z) < 10); if (c && isEV(c.d)) { UI.toast('รถ EV เติมน้ำมันไม่ได้ ไปที่จุดชาร์จ EV (แยกจากปั๊ม)', '⚡'); return; } return _ref(); };
    // electric cars use far less per km
    const _drive = Town2.drive.bind(Town2);
    Town2.drive = function (c, dist, hit, dt) { const d = c.d; if (isEV(d)) { Town2.carState(d); const f = d.fuel; _drive(c, dist, hit, dt); d.fuel = Math.max(0, f - dist * 0.012 * 280 / (CARS[d.type].range || 300)); if (d.fuel <= 0 && !EV.told) { EV.told = 1; UI.toast('แบตรถหมด! ไปชาร์จที่สถานีชาร์จ EV หรือเรียกรถลาก', '🔋'); } if (d.fuel > 0) EV.told = 0; return; } return _drive(c, dist, hit, dt); };
    // home EV charging at the garage POI (from smarthome) keeps working; charging there is cheap
    // cars left in far towns are brought back to the highway exit on reload
    for (const o of G.cars) if (o.d.x > 2500) { const p = typeof Plan !== 'undefined' ? Plan.hwExit() : { x: GARAGE.x + 6, z: GARAGE.z }; o.d.x = p.x + 4; o.d.z = p.z; o.d.r = Math.PI; o.g.position.set(o.d.x, World.groundY(o.d.x, o.d.z), o.d.z); if (o.col) { Col.remove(o.col); o.col = Col.box(o.d.x, o.d.z, 1.0, 2.45, o.d.r); } }
  },
  charge(p, rate) {
    const c = G.driving || G.cars.filter(o => isEV(o.d)).sort((a, b) => Math.hypot(a.d.x - p.x, a.d.z - p.z) - Math.hypot(b.d.x - p.x, b.d.z - p.z))[0];
    if (!c || !isEV(c.d) || Math.hypot(c.d.x - p.x, c.d.z - p.z) > 12) { UI.toast('จอดรถ EV ใกล้ ๆ ตู้ชาร์จก่อน', '⚡'); return; }
    const d = Town2.carState(c.d), need = 100 - d.fuel, cost = Math.ceil(need * rate);
    if (need < 1) { UI.toast('แบตเต็มแล้ว', '🔋'); return; } if (S.money < cost) { UI.toast('เงินไม่พอ', '💸'); return; }
    S.money -= cost; Bank2.log('ชาร์จรถ EV', -cost);
    fade(() => { tick(Math.max(10, need * 0.35)); d.fuel = 100; UI.toast(`ชาร์จเต็ม 100% (${baht(cost)}) ถูกกว่าน้ำมันเกือบ 5 เท่า`, '⚡'); });
  },
  // Autopilot: pick a place and the car drives itself there (fast-forwarded), battery drops with distance
  autoUI() {
    if (!G.driving || !isEV(G.driving.d) || !S.autopilot) return;
    if (G.away) { UI.toast('ระบบขับอัตโนมัติใช้ได้ในแผนที่หลัก ขับกลับทางหลวงก่อน', '🤖'); return; }
    const dest = TAXI_DEST.filter(t => !t.away).concat([{ n: 'บ้าน (โรงจอดรถ)', x: GARAGE.x + 6, z: GARAGE.z }, { n: 'เมืองทุ่งทอง', x: 170, z: -300 }, { n: 'เมืองภูผาใหม่', x: -105, z: -430 }]);
    this.dest = dest;
    UI.open('ระบบขับขี่อัตโนมัติ', null, () => `<p class="lead">🤖 เลือกจุดหมาย รถจะขับไปเองอย่างปลอดภัย (ใช้แบตตามระยะทาง)</p><div class="grid">${dest.map((t, i) => { const km = Math.hypot(t.x - G.driving.d.x, t.z - G.driving.d.z) / 100; return `<div class="card"><div class="ci">📍</div><div class="cb"><h4>${t.n}</h4><p class="dim">ประมาณ ${km.toFixed(1)} กม.</p><div class="row"><button class="btn" data-a="autogo" data-i="${i}">ไปเลย</button></div></div></div>`; }).join('')}</div>`);
  },
  autoGo(i) {
    const t = this.dest[+i], c = G.driving; if (!t || !c) return;
    const d = c.d, dist = Math.hypot(t.x - d.x, t.z - d.z), use = dist * 0.012 * 280 / (CARS[d.type].range || 300);
    Town2.carState(d); if (d.fuel < use + 2) { UI.toast('แบตไม่พอไปถึง ชาร์จก่อนนะ', '🔋'); return; }
    UI.close();
    fade(() => {
      tick(Math.max(5, dist / 14 / 60 * 60 * 1.5)); d.fuel -= use;
      const q = { x: t.x, z: t.z }; Col.push(q, 1.6); d.x = q.x; d.z = q.z; d.r = Math.atan2(t.x - c.g.position.x, t.z - c.g.position.z) || d.r; c.speed = 0;
      c.g.position.set(d.x, World.groundY(d.x, d.z), d.z); G.player.pos.set(d.x, World.groundY(d.x, d.z), d.z); snapCam();
      UI.toast(`ถึง${t.n}แล้ว ขับเองอัตโนมัติ ${(dist / 100).toFixed(1)} กม.`, '🤖');
    });
  },
};

// ===================== Build your own houses =====================
const HomeBuild = {
  st() { if (!S.hb) S.hb = { lots: {} }; return S.hb; },
  g: {},
  init() {
    for (const L of LOTS) {
      World.clearNear(L.x, L.z, 9, true);
      World.pois.push({ kind: 'act', x: L.x, z: L.z + 0, r: 7, label: L.n, icon: '🏗️', map: true, act: () => ({ icon: '🏗️', label: this.label(L), fn: () => this.ui(L.id) }) });
      this.draw(L.id);
    }
  },
  lot(id) { return LOTS.find(l => l.id === id); },
  label(L) { const s = this.st().lots[L.id]; return !s ? `${L.n} (ขาย ${baht(L.price)})` : !s.design ? `${L.n} ของคุณ: เลือกแบบบ้าน` : s.stage < 3 ? `ไซต์ก่อสร้าง${HOUSE_DESIGNS[s.design].n} (${['ลงเสาเข็ม', 'ขึ้นโครง', 'มุงหลังคา'][s.stage]})` : `${s.name || HOUSE_DESIGNS[s.design].n} ของคุณ`; },
  ui(id) {
    const L = this.lot(id), s = this.st().lots[id];
    UI.open(L.n, null, () => {
      if (!s && !this.st().lots[id]) return `<p class="lead">ที่ดินเปล่าพร้อมโฉนด ขนาดประมาณ 1 ไร่ ราคา ${baht(L.price)}</p><div class="row"><button class="btn" data-a="lotbuy" data-v="${id}" ${S.money >= L.price ? '' : 'disabled'}>ซื้อที่ดิน</button></div>`;
      const st = this.st().lots[id];
      if (!st.design) return `<p class="lead">เลือกแบบบ้านที่จะสร้าง (ผู้รับเหมาบ้านสุขใจ ใช้เวลาสร้าง 3 วัน)</p><div class="grid">${Object.entries(HOUSE_DESIGNS).map(([k, D]) => `<div class="card"><div class="ci">${D.i}</div><div class="cb"><h4>${D.n}</h4><p class="dim">ค่าก่อสร้าง ${baht(D.price)} · ปล่อยเช่าได้ ~${baht(D.rent)}/วัน${D.flat ? ' · หลังคาแบนติดโซลาร์ได้ 12 แผง' : ''}</p><div class="row"><button class="btn" data-a="lotbuild" data-v="${id}" data-k="${k}" ${S.money >= D.price ? '' : 'disabled'}>จ้างสร้าง</button></div></div></div>`).join('')}</div>`;
      const D = HOUSE_DESIGNS[st.design];
      if (st.stage < 3) return `<p class="lead">🏗️ กำลังสร้าง${D.n} — ขั้น${['ลงเสาเข็มและเทพื้น', 'ขึ้นโครงเสาคาน', 'ก่อผนังและมุงหลังคา'][st.stage]} · เสร็จเช้า${RD(st.start + 3)}</p><p class="dim">ช่างทำงานทุกวัน มาดูความคืบหน้าได้เลย</p>`;
      const inc = this.rentOf(st);
      return `<p class="lead">${D.i} ${esc(st.name || D.n)} · สร้างเสร็จ${RD(st.start + 3)}${st.solar ? ` · ☀️ โซลาร์ ${st.solar} แผง` : ''}${st.smart ? ' · 🤖 สมาร์ทโฮม' : ''}</p>
        <div class="row"><button class="btn ${st.rent ? 'ghost' : ''}" data-a="lotrent" data-v="${id}">${typeof Estate39 !== 'undefined' ? '🏘️ จัดการเช่า / ขาย / เปิดธุรกิจ' : (st.rent ? '🔑 เลิกปล่อยเช่า (ใช้พักเอง)' : `🏷️ ปล่อยเช่ารายวัน (~${baht(inc)}/วัน)`)}</button>
        ${!st.rent ? `<button class="btn ghost" data-a="lotrest" data-v="${id}">🛌 พักผ่อนที่บ้านหลังนี้ 2 ชม.</button>` : ''}
        ${D.flat && (st.solar || 0) < 12 ? `<button class="btn ghost" data-a="lotsolar" data-v="${id}" ${S.money >= 40000 ? '' : 'disabled'}>☀️ ติดโซลาร์บนหลังคา 6 แผง (40,000 ฿)</button>` : ''}
        ${!st.smart ? `<button class="btn ghost" data-a="lotsmart" data-v="${id}" ${S.money >= 25000 ? '' : 'disabled'}>🤖 ติดชุดสมาร์ทโฮม (25,000 ฿ ค่าเช่า +30%)</button>` : ''}</div>
        ${st.rent ? `<p class="dim">รายได้ค่าเช่าเข้าบัญชีทุกเช้า · ได้ไปแล้วทั้งหมด ${baht(st.earned || 0)}</p>` : ''}`;
    });
  },
  rentOf(st) { const D = HOUSE_DESIGNS[st.design]; return Math.round(D.rent * (st.smart ? 1.3 : 1) * (1 + (st.solar || 0) * 0.02)); },
  buy(id) { const L = this.lot(id); if (this.st().lots[id] || S.money < L.price) return; S.money -= L.price; Bank2.log('ซื้อที่ดิน', -L.price); this.st().lots[id] = { design: null }; Life2.note('ซื้อ' + L.n); UI.toast('ซื้อที่ดินแล้ว! เลือกแบบบ้านที่จะสร้างได้เลย', '📜'); this.draw(id); },
  build(id, k) { const st = this.st().lots[id], D = HOUSE_DESIGNS[k]; if (!st || st.design || S.money < D.price) return; S.money -= D.price; Bank2.log('จ้างสร้างบ้าน', -D.price); Object.assign(st, { design: k, start: S.day, stage: 0 }); UI.toast(`เริ่มสร้าง${D.n}! เสร็จใน 3 วัน`, '🏗️'); this.draw(id); },
  day() {
    for (const [id, st] of Object.entries(this.st().lots)) {
      if (!st.design) continue;
      const stg = Math.min(3, S.day - st.start);
      if (stg !== st.stage) { st.stage = stg; this.draw(id); if (stg === 3) { Phone.msg('ผู้รับเหมาบ้านสุขใจ', `${HOUSE_DESIGNS[st.design].n}สร้างเสร็จแล้ว! ปล่อยเช่าหรือเข้าพักได้เลย`); Life2.note('สร้างบ้านหลังใหม่เสร็จ: ' + HOUSE_DESIGNS[st.design].n + ' 🏡'); Prog.add(120); } }
      if (st.stage >= 3 && st.rent) { const v = Math.round(this.rentOf(st) * (0.8 + Math.random() * 0.4)); earn(v); Bank2.income('ค่าเช่าบ้าน', v); st.earned = (st.earned || 0) + v; }
      if (st.solar) Power.st().wkExp += st.solar * 0.55 * 4.5;
    }
  },
  draw(id) {
    const L = this.lot(id), st = this.st().lots[id];
    if (this.g[id]) { World.outdoor.remove(this.g[id].g); if (this.g[id].col) Col.remove(this.g[id].col); }
    const g = new THREE.Group(), y = World.groundY(L.x, L.z); g.position.set(L.x, y, L.z); g.rotation.y = L.rot; World.outdoor.add(g);
    const rec = { g }; this.g[id] = rec;
    if (!st || !st.design) {
      // sale sign or "sold" sign with corner stakes
      const sign = U.signTex(st ? 'ที่ดินของคุณ' : 'ขายที่ดิน ' + U.fmt(L.price) + ' ฿', { w: 512, h: 128, bg: st ? '#2e7d32' : '#c62828' });
      const p = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.65), new THREE.MeshStandardMaterial({ map: sign })); p.position.set(0, 1.6, 3); g.add(p);
      U.mk(g, GEO.box, M.darkwood, [-1.1, 0.8, 2.98], [0.1, 1.6, 0.1]); U.mk(g, GEO.box, M.darkwood, [1.1, 0.8, 2.98], [0.1, 1.6, 0.1]);
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) U.mk(g, GEO.box, mc(0xff7043), [sx * 6, 0.4, sz * 5], [0.12, 0.8, 0.12]);
      return;
    }
    const D = HOUSE_DESIGNS[st.design], o = D.o;
    // concrete slab first
    U.mk(g, U.box(o.w + 0.6, 0.3, o.d + 0.6, 2), M.stone, [0, 0.15, 0]);
    if (st.stage === 0) { for (let i = 0; i < 8; i++) U.mk(g, GEO.cylLo, mc(0x9e9e9e), [(i % 4 - 1.5) * o.w / 3.2, 0.5, ((i / 4) | 0) ? o.d / 2 - 0.4 : -o.d / 2 + 0.4], [0.18, 0.6, 0.18]); }
    else if (st.stage === 1 || st.stage === 2) {
      const steel = mc(0x90a4ae, { metalness: 0.5 }), H = (o.h || 3.2) + 0.4;
      for (const sx of [-1, 0, 1]) for (const sz of [-1, 1]) U.mk(g, GEO.box, M.stone, [sx * o.w / 2.1, H / 2, sz * o.d / 2.1], [0.3, H, 0.3]);
      U.mk(g, GEO.box, M.stone, [0, H, o.d / 2.1], [o.w, 0.3, 0.3]); U.mk(g, GEO.box, M.stone, [0, H, -o.d / 2.1], [o.w, 0.3, 0.3]);
      if (st.stage === 2) U.mk(g, U.box(o.w - 0.4, H * 0.7, o.d - 0.4, 3), texMat('brick', 0xffffff), [0, H * 0.35, 0]);
      // scaffolding
      for (let i = 0; i < 6; i++) U.mk(g, GEO.cylLo, steel, [-o.w / 2 - 0.6 + (i % 3) * (o.w / 2 + 0.6), H / 2 + 0.3, o.d / 2 + 0.7], [0.05, H + 0.6, 0.05]);
      for (const yy of [1, 2.2, 3.4]) U.mk(g, GEO.box, M.wood, [0, yy, o.d / 2 + 0.7], [o.w + 1.4, 0.06, 0.5]);
    } else {
      const b = World.building(o); g.add(b);
      if (st.solar && D.flat) { const cell = mc(0x1a237e, { roughness: 0.25, metalness: 0.6 }), top = 0.4 + (o.h || 3.2) + 0.45; for (let i = 0; i < st.solar; i++) { const p = U.mk(g, GEO.box, cell, [(i % 4 - 1.5) * 2.1, top, (((i / 4) | 0) - 1) * 2.2], [1.9, 0.05, 1.5]); p.rotation.x = -0.25; } }
      if (st.smart) U.mk(g, GEO.box, new THREE.MeshBasicMaterial({ color: 0x00e5ff, toneMapped: false }), [o.w / 2 - 0.6, 2, o.d / 2 + 0.06], [0.25, 0.25, 0.02]);
      const sg = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.5), new THREE.MeshStandardMaterial({ map: U.signTex(st.rent ? 'ให้เช่ารายวัน' : (S.name ? 'บ้านของ' + S.name : 'บ้านของฉัน'), { w: 512, h: 112, bg: st.rent ? '#1565c0' : '#6d4c41' }) })); sg.position.set(-o.w / 2 + 1.4, 1.2, o.d / 2 + 1.8); g.add(sg);
    }
    rec.col = Col.box(L.x, L.z, o.w / 2 + 0.4, o.d / 2 + 0.4, L.rot, 'bld');
  },
};

// ===================== Extensions on the main house =====================
const HouseExt = {
  pos() { return { x: HOUSE_POS.x - (HOUSE_DEF[S.up.house - 1].w / 2) - 4.2, z: HOUSE_POS.z - 1 }; },
  init() {
    World.pois.push({ kind: 'act', x: 0, z: 0, r: 2.6, label: 'ต่อเติมบ้าน', icon: '🧱', dyn: 'ext', act: () => ({ icon: '🧱', label: Object.keys(S.ext || {}).length ? 'ห้องต่อเติม: ใช้งาน/ต่อเติมเพิ่ม' : 'ต่อเติมบ้าน (เพิ่มห้องใหม่)', fn: () => this.ui() }) });
    this.draw();
  },
  ui() {
    const E = S.ext = S.ext || {};
    UI.open('ต่อเติมบ้าน', null, () => `<p class="lead">ผู้รับเหมาต่อเติมปีกบ้านด้านซ้ายให้เสร็จภายในวันเดียว</p><div class="grid">${Object.entries(HOUSE_EXT).map(([k, X]) => `<div class="card"><div class="ci">${X.i}</div><div class="cb"><h4>${X.n}${E[k] ? ' ✅' : ''}</h4><p class="dim">${X.desc}</p><div class="row">${E[k] ? this.useBtn(k) : `<button class="btn" data-a="extbuy" data-v="${k}" ${S.money >= X.price ? '' : 'disabled'}>ต่อเติม ${baht(X.price)}</button>`}</div></div></div>`).join('')}</div>`);
  },
  useBtn(k) {
    if (k === 'gym') return `<button class="btn ghost" data-a="extuse" data-v="gym" ${S.gymDay === S.day ? 'disabled' : ''}>ออกกำลังกาย 1 ชม. (พลังงานสูงสุด +1)</button>`;
    if (k === 'rooftop') return `<button class="btn ghost" data-a="extuse" data-v="rooftop" ${S.roofDay === S.day ? 'disabled' : ''}>ขึ้นไปนั่งชมวิว</button>`;
    if (k === 'office') return `<button class="btn ghost" data-a="extuse" data-v="office">นั่งทำงาน (เปิดกระดานงาน)</button>`;
    return `<span class="dim">มีแขกเข้าพัก ${S.guestN || 0} คืนแล้ว</span>`;
  },
  buy(k) { const X = HOUSE_EXT[k]; S.ext = S.ext || {}; if (S.ext[k] || S.money < X.price) return; S.money -= X.price; Bank2.log('ต่อเติมบ้าน', -X.price); S.ext[k] = 1; UI.close(); fade(() => { tick(240); this.draw(); Life2.note('ต่อเติม' + X.n); UI.toast(`ต่อเติม${X.n}เสร็จแล้ว!`, X.i); }); },
  use(k) {
    if (k === 'gym') { if (S.gymDay === S.day || !useEnergy(10)) return; S.gymDay = S.day; UI.close(); fade(() => { tick(60); S.fit = Math.min(30, (S.fit || 0) + 1); S.mood = Math.min(100, (S.mood || 50) + 5); UI.toast(`ฟิตขึ้น! พลังงานสูงสุด +${S.fit} ถาวร`, '🏋️'); }); }
    if (k === 'rooftop') { if (S.roofDay === S.day) return; S.roofDay = S.day; UI.close(); fade(() => { tick(45); S.mood = Math.min(100, (S.mood || 50) + 15); UI.toast('ลมเย็น ๆ บนดาดฟ้า วิวไร่สวยมาก อารมณ์ +15', '🌇'); }); }
    if (k === 'office') { UI.close(); Life2.jobsUI(); }
  },
  day() { if (S.ext && S.ext.guest && Math.random() < 0.8) { const v = 250 + ((Math.random() * 200) | 0); earn(v); Bank2.income('โฮมสเตย์', v); S.guestN = (S.guestN || 0) + 1; } },
  draw() {
    if (this.g) { World.outdoor.remove(this.g); this.g = null; } if (this.col) { Col.remove(this.col); this.col = null; }
    const p = this.pos(), poi = World.pois.find(q => q.dyn === 'ext'); if (poi) { poi.x = p.x + 0.4; poi.z = p.z + 4.2; }
    const ks = Object.keys(S.ext || {}); if (!ks.length) return;
    World.clearNear(p.x, p.z, 4.6, true);
    const g = new THREE.Group(); g.position.set(p.x, World.groundY(p.x, p.z), p.z); World.outdoor.add(g); this.g = g;
    const h = ks.includes('rooftop') ? 3.4 : 3;
    const b = World.building({ w: 6, d: 6, h, flat: true, wall: 0xf6ecd6, roof: 0xd7ccc8, winF: [-1.5, 1.5], winS: [0], glassFront: ks.includes('office') }); g.add(b);
    if (ks.includes('rooftop')) { for (const s of [-1, 1]) U.mk(g, GEO.box, M.trim, [s * 3, h + 1.1, 0], [0.06, 0.8, 6]); U.mk(g, GEO.box, M.trim, [0, h + 1.1, -3], [6, 0.8, 0.06]); for (let i = 0; i < 4; i++) U.mk(g, GEO.sph, mc(0x43a047), [-2 + i * 1.3, h + 1, -2.4], 0.45); }
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.45), new THREE.MeshStandardMaterial({ map: U.signTex(ks.map(k => HOUSE_EXT[k].i).join(' ') + ' ปีกบ้าน', { w: 512, h: 104, bg: '#5d4037' }) })); sg.position.set(0, h - 0.2, 3.05); g.add(sg);
    this.col = Col.box(p.x, p.z, 3.3, 3.3);
  },
};

// ===================== Smart home phone app & AI commands =====================
const SmartApp = {
  html() {
    const s = Power.st(), st = Power.status(), y = s.yday || s.today;
    const evs = G.cars.filter(o => isEV(o.d));
    return `<h5>⚡ พลังงานบ้านตอนนี้</h5><div class="grid">
      <div class="card"><div class="ci">☀️</div><div class="cb"><h4>โซลาร์ผลิต ${st.prod.toFixed(1)} kW</h4><p class="dim">แผง ${s.panels + s.farm} แผง (${Power.kwp().toFixed(1)} kWp) · วันนี้ ${s.today.prod.toFixed(1)} kWh</p></div></div>
      <div class="card"><div class="ci">🏠</div><div class="cb"><h4>บ้านใช้ไฟ ${st.use.toFixed(1)} kW</h4><p class="dim">มิเตอร์รับได้ ${s.amp} kW · ซื้อไฟวันนี้ ${s.today.imp.toFixed(1)} kWh · ขายคืน ${s.today.exp.toFixed(1)} kWh</p></div></div>
      <div class="card"><div class="ci">🔋</div><div class="cb"><h4>แบตเตอรี่ ${s.batt ? Math.round(s.soc / s.batt * 100) + '%' : 'ไม่มี'}</h4><p class="dim">${s.batt ? `${s.soc.toFixed(1)}/${s.batt} kWh สำรองไฟตอนไฟดับ` : 'ติดตั้งได้ที่ศูนย์ EV ภูผาใหม่'}</p></div></div>
      <div class="card"><div class="ci">${st.dark ? '🌑' : '💡'}</div><div class="cb"><h4>${s.trip ? 'เบรกเกอร์ตัด!' : s.out ? 'ไฟดับ (เหลือ ' + s.out + ' ชม.)' : 'ไฟปกติ'}</h4><div class="row">${s.trip ? '<button class="btn" data-a="pwreset">รีเซ็ตเบรกเกอร์</button>' : ''}</div></div></div></div>
      <h5>🏠 สั่งงานอุปกรณ์</h5><div class="row topics">
      <button class="btn ghost" data-a="sh" data-v="ac">${S.ac ? '❄️ ปิดแอร์' : '❄️ เปิดแอร์'}</button>
      ${S.furn.smartgarden ? '<button class="btn ghost" data-a="sh" data-v="water">💧 รดน้ำแปลงตอนนี้</button>' : ''}
      ${S.furn.evcharger ? `<button class="btn ghost" data-a="sh" data-v="ev">🔌 ชาร์จรถที่บ้าน: ${s.evOn ? 'เปิด' : 'ปิด'}</button>` : ''}
      <button class="btn ghost" data-a="sh" data-v="lock">${S.locked ? '🔒 ปลดล็อกบ้าน' : '🔓 ล็อกบ้าน (กันขโมย)'}</button>
      ${S.furn.aispeaker ? '<button class="btn ghost" data-a="sh" data-v="ai">🔊 คุยกับน้องสุขใจ</button>' : ''}</div>
      ${evs.length ? `<h5>🚗 รถ EV</h5><ul class="lead">${evs.map(o => `<li>${CARS[o.d.type].n}: แบต ${Math.round(Town2.carState(o.d).fuel)}%${Math.hypot(o.d.x - GARAGE.x, o.d.z - GARAGE.z) < 14 ? ' · จอดที่บ้าน' : ''}</li>`).join('')}</ul>` : ''}
      ${(S.sched || []).length ? `<h5>⏰ ตารางสั่งงานอัตโนมัติ</h5><ul class="lead">${S.sched.map((x, i) => `<li>${String(x.h).padStart(2, '0')}:00 ${esc(x.t)}${x.daily ? ' (ทุกวัน)' : ''} <button class="btn ghost" data-a="schdel" data-i="${i}">ลบ</button></li>`).join('')}</ul>` : ''}
      <p class="dim">เมื่อวาน: ผลิต ${y.prod.toFixed(1)} kWh · ใช้ ${y.use.toFixed(1)} kWh · สัปดาห์นี้ซื้อไฟ ${s.wkImp.toFixed(0)} kWh / ขายคืน ${s.wkExp.toFixed(0)} kWh</p>`;
  },
  act(v) {
    if (v === 'ac') { if (!S.furn.aircon) { UI.toast('บ้านยังไม่มีแอร์', '❄️'); return; } if (S.powerOff) { UI.toast('ไฟดับอยู่', '🌑'); return; } S.ac = !S.ac; }
    if (v === 'water') Smart.water('สั่งจากมือถือ');
    if (v === 'ev') Power.st().evOn = Power.st().evOn ? 0 : 1;
    if (v === 'lock') { S.locked = !S.locked; UI.toast(S.locked ? 'ล็อกประตูบ้านแล้ว ขโมยเข้ายากขึ้น' : 'ปลดล็อกแล้ว', '🔒'); }
    if (v === 'ai') { Phone.app = null; UI.close(); Smart.ai(); }
  },
};
APPS.splice(3, 0, { id: 'home', i: '🏠', n: 'บ้านอัจฉริยะ' });
Phone.apps.home = () => SmartApp.html();

// multi-step commands: "รดน้ำตอน 6 โมงทุกวัน แล้วเปิดแอร์ตอน 2 ทุ่ม"
const AICmd = {
  hourOf(t) {
    let m;
    if ((m = t.match(/(\d{1,2})[:.](\d{2})/))) return +m[1] % 24;
    if ((m = t.match(/(\d{1,2})\s*ทุ่ม/))) return (18 + +m[1]) % 24;
    if ((m = t.match(/บ่าย\s*(\d{1,2})/))) return (12 + +m[1]) % 24;
    if ((m = t.match(/ตี\s*(\d{1,2})/))) return +m[1] % 24;
    if ((m = t.match(/(\d{1,2})\s*โมงเย็น/))) return (12 + +m[1]) % 24;
    if ((m = t.match(/(\d{1,2})\s*(โมง|นาฬิกา)/))) return +m[1] % 24;
    if (/เที่ยงคืน/.test(t)) return 0; if (/เที่ยง/.test(t)) return 12;
    return null;
  },
  // returns a reply, or null when the part is not a device command
  run(t, silent) {
    const say = x => x;
    if (/รดน้ำ/.test(t)) { if (!S.furn.smartgarden) return say('ยังไม่มีระบบรดน้ำอัจฉริยะค่ะ'); Smart.water('สั่งด้วยเสียง'); return say('รดน้ำแปลงที่แห้งให้แล้วค่ะ'); }
    if (/เปิดแอร์/.test(t)) { if (!S.furn.aircon) return say('ยังไม่มีแอร์ค่ะ'); if (S.powerOff) return say('ไฟดับอยู่ค่ะ'); S.ac = true; return say('เปิดแอร์แล้วค่ะ'); }
    if (/ปิดแอร์/.test(t)) { S.ac = false; return say('ปิดแอร์แล้วค่ะ'); }
    if (/ชาร์จรถ/.test(t)) { Power.st().evOn = /หยุด|ปิด/.test(t) ? 0 : 1; return say(Power.st().evOn ? 'เปิดชาร์จรถ EV ที่บ้านแล้วค่ะ' : 'หยุดชาร์จรถแล้วค่ะ'); }
    if (/ล็อก/.test(t)) { S.locked = !/ปลด/.test(t); return say(S.locked ? 'ล็อกบ้านแล้วค่ะ' : 'ปลดล็อกแล้วค่ะ'); }
    if (/ไฟฟ้า|พลังงาน|โซลาร์|แบต/.test(t)) { const st = Power.status(), s = Power.st(); return say(`โซลาร์ผลิต ${st.prod.toFixed(1)} kW บ้านใช้ ${st.use.toFixed(1)} kW แบต ${s.batt ? Math.round(s.soc / s.batt * 100) + '%' : 'ไม่มี'} วันนี้ขายไฟคืน ${s.today.exp.toFixed(1)} kWh ค่ะ`); }
    if (/ดูดฝุ่น|ทำความสะอาด/.test(t)) { if (!S.furn.robotvac) return say('ยังไม่มีหุ่นยนต์ดูดฝุ่นค่ะ'); (S.buff = S.buff || {}).clean = S.day; return say('สั่งหุ่นยนต์ดูดฝุ่นทำความสะอาดแล้วค่ะ'); }
    if (/ให้อาหารสัตว์|เติมอาหาร/.test(t)) { const n = Math.min(Math.max(0, (typeof Animal40 !== 'undefined' ? Animal40.need() : S.animals.length) - S.trough), count('feed')); if (!n) return say('รางอาหารเต็มหรือไม่มีอาหารสัตว์ค่ะ'); takeItem('feed', n); S.trough += n; return say(`เติมอาหารสัตว์ ${n} ถุงด้วยระบบให้อาหารอัตโนมัติแล้วค่ะ`); }
    return null;
  },
  answer(q) {
    if (/เตือน|จำ|รายการ|ล้าง/.test(q)) return null;
    const parts = q.split(/\s*(?:และ|แล้วก็|แล้ว|จากนั้น|,|ต่อด้วย)\s*/).filter(Boolean), out = [];
    for (const p of parts) {
      const h = this.hourOf(p), dev = /รดน้ำ|แอร์|ชาร์จ|ล็อก|ดูดฝุ่น|ให้อาหาร|เติมอาหาร/.test(p);
      if (h != null && dev) { const daily = /ทุกวัน/.test(p); (S.sched = S.sched || []).push({ h, t: p.trim(), cmd: p, daily }); out.push(`ตั้งเวลา ${String(h).padStart(2, '0')}:00 "${p.trim()}"${daily ? ' ทุกวัน' : ''} แล้วค่ะ`); }
      else { const r = this.run(p); if (r) out.push(r); }
    }
    return out.length ? out.join(' · ') : null;
  },
  // schedules between 02:00 and 06:00 fall into sleep: run them when the day starts
  night() { if (!S.sched) return; for (const x of S.sched.slice()) if (x.h >= 2 && x.h < 6) { const r = this.run(x.cmd); if (r) Phone.msg('น้องสุขใจ AI', `${String(x.h).padStart(2, '0')}:00 ทำตามที่ตั้งไว้: ${r}`, false); if (!x.daily) S.sched.splice(S.sched.indexOf(x), 1); } },
  hour() {
    const h = Math.floor(S.time / 60) % 24; if (!S.sched || !S.sched.length) return;
    for (const x of S.sched.slice()) if (x.h === h) { const r = this.run(x.cmd) || ''; if (r) Phone.msg('น้องสุขใจ AI', `${String(h).padStart(2, '0')}:00 ทำตามที่ตั้งไว้: ${r}`, false); if (!x.daily) S.sched.splice(S.sched.indexOf(x), 1); }
  },
};
const _aiAnswer = Smart.answer.bind(Smart);
Smart.answer = function (q) {
  const t = String(q || '').trim(); if (!t) return;
  const r = AICmd.answer(t);
  if (r) { this.log.push({ t }); this.log.push({ ai: 1, t: r }); Sfx.tone(980, 0.08, 'sine', 0.04); return; }
  return _aiAnswer(q);
};

// ===================== hooks =====================
const _smartHour = Smart.hour.bind(Smart);
Smart.hour = function () { _smartHour(); Power.sync(); AICmd.hour(); { const h = Math.floor(S.time / 60) % 24; if (typeof ISP !== 'undefined') ISP.hour(h); if (typeof Career !== 'undefined') Career.hour(h); if (typeof Plan10 !== 'undefined') Plan10.hour(h); } if (typeof PC !== 'undefined') PC.hourCheck(); if (typeof Fut !== 'undefined') Fut.hour(); if (typeof Plan !== 'undefined') Plan.hour(); };
const _smartMorning = Smart.morning.bind(Smart);
Smart.morning = function () { _smartMorning(); HiTech.solarFurn(); AICmd.night(); Power.sync(); Power.morning(); if (typeof Career !== 'undefined') Career.payday(); if (typeof Plan10 !== 'undefined') Plan10.day(); if (typeof Company !== 'undefined') { Company.day(); Sec.morning(); SIMs.day(); } if (typeof Life3 !== 'undefined') Life3.day(); if (typeof Life5 !== 'undefined') { Fest2.day(); RL.day(); Life5.day(); } if (typeof Prune !== 'undefined') Prune.day(); if (typeof Fun !== 'undefined') Fun.day(); HomeBuild.day(); HouseExt.day(); if (typeof Fut !== 'undefined') Fut.day(); if (typeof PC !== 'undefined') PC.day(); if (typeof Plan !== 'undefined') Plan.day(); };
const _bill = Life2.bill.bind(Life2);
Life2.bill = function () {
  _bill(); const s = Power.st(), b = S.billDue; if (!b) return;
  if (typeof Grid !== 'undefined') return; // the grid module bills with the real tariff
  let elec = Math.round(s.wkImp * 4.4 - s.wkExp * 2.2 + 38);
  if (elec < 0) { earn(-elec); Bank2.income('ขายไฟฟ้าคืนการไฟฟ้า', -elec); Phone.msg('การไฟฟ้า', `สัปดาห์นี้คุณผลิตไฟเกินใช้ ได้รับเงินค่าไฟคืน ${baht(-elec)} 🌞`); elec = 0; }
  b.elec = elec; s.wkImp = 0; s.wkExp = 0;
};
// thieves give up on a locked smart home more often
// a locked house lowers the thief chance inside Emergency.hourly
// working from the home office pays more
{ const _sj = Life2.startJob.bind(Life2); Life2.startJob = function (k) { const J = PT_JOBS.find(j => j.k === k); if (J && S.ext && S.ext.office && ['online', 'tutor'].includes(k) && !J._o) { J._o = J.pay; J.pay = Math.round(J.pay * 1.4); const r = _sj(k); setTimeout(() => { J.pay = J._o; delete J._o; }, 3000); return r; } return _sj(k); }; }
Power.extra.push(() => (S.ext ? Object.keys(S.ext).length * 0.05 : 0));
// a bigger house means a bigger roof and a wider footprint for the extension wing
{ const _bh = World.buildHouse.bind(World); World.buildHouse = function (lvl) { _bh(lvl); if (G.started || typeof S !== 'undefined' && S && S.pw) { try { Power.visual(); HouseExt.draw(); } catch (e) { } } }; }

const HiTech = {
  solarFurn() { const s = Power.st(); if (S.furn.solar && !s.furnDone) { s.furnDone = 1; s.panels = Math.min(Power.roofMax(), Math.max(s.panels, 8)); Power.visual(); } },
  init() {
    Power.st(); this.solarFurn(); Power.visual(); EV.init(); HomeBuild.init(); HouseExt.init();
    // EV & solar centre and the house builder in ภูผาใหม่
    const cx = -105, cz = -400, mk = (o, x, z, rot, shop, icon, act) => {
      const b = World.building(o); b.position.set(x, World.groundY(x, z), z); b.rotation.y = rot; World.outdoor.add(b); Col.box(x, z, o.w / 2 + 0.3, o.d / 2 + 0.3, rot, 'bld'); World.clearNear(x, z, Math.max(o.w, o.d) * 0.7, true);
      const door = l2w(x, z, rot, 0, o.d / 2 + 1.7);
      if (shop) World.pois.push({ kind: 'shop', id: shop, x: door.x, z: door.z, r: 2.4, label: o.sign, icon, map: true });
      if (act) World.pois.push({ kind: 'act', x: door.x, z: door.z, r: 2.4, label: o.sign, icon, map: true, act: () => ({ icon, label: o.sign, fn: act }) });
      return door;
    };
    mk({ w: 12, d: 9, h: 4.6, flat: true, glassFront: true, wall: 0xe0f7fa, roof: 0x00838f, sign: 'ศูนย์ EV & พลังงานสะอาด', signStyle: { bg: '#00838f' } }, cx + 11, cz - 37, -Math.PI / 2, 'evcenter', '⚡');
    mk({ w: 11, d: 8, h: 4.2, roofH: 2.4, wall: 0xfff3e0, roof: 0xe65100, sign: 'บ้านสุขใจ รับสร้างบ้าน', signStyle: { bg: '#e65100' }, winF: [-3, 3] }, cx - 13, cz + 26, Math.PI / 2, null, '🏗️', () => this.builderUI());
    // the garage POI from the smart-home module also starts autopilot when sitting in an EV
    (G.driveHooks = G.driveHooks || []).push(consider => { if (G.driving && isEV(G.driving.d) && S.autopilot) consider({ kind: 'ext', act: () => ({ icon: '🤖', label: 'ขับอัตโนมัติไปยัง...', fn: () => EV.autoUI() }) }, 99); });
  },
  builderUI() {
    UI.open('บ้านสุขใจ รับสร้างบ้าน', null, () => `<p class="lead">ซื้อที่ดิน เลือกแบบ สร้างเสร็จใน 3 วัน · ต่อเติมบ้านหลังเดิมได้ที่ป้ายข้างบ้าน</p><div class="grid">${LOTS.map(L => { const s = HomeBuild.st().lots[L.id]; return `<div class="card"><div class="ci">${s ? '🏡' : '📜'}</div><div class="cb"><h4>${L.n}</h4><p class="dim">${HomeBuild.label(L)}</p><div class="row">${s ? `<button class="btn ghost" data-a="lotui" data-v="${L.id}">จัดการ</button>` : `<button class="btn" data-a="lotbuy" data-v="${L.id}" ${S.money >= L.price ? '' : 'disabled'}>ซื้อ ${baht(L.price)}</button>`}</div></div></div>`; }).join('')}</div>
      <div class="row"><button class="btn ghost" data-a="extui">🧱 ต่อเติมบ้านหลังเดิม</button></div>`);
  },
};
Object.assign(UI.H, {
  lotbuy: d => HomeBuild.buy(d.v), lotbuild: d => HomeBuild.build(d.v, d.k), lotui: d => { UI.close(); HomeBuild.ui(d.v); },
  lotrent: d => { const st = HomeBuild.st().lots[d.v]; st.rent = !st.rent; HomeBuild.draw(d.v); },
  lotrest: d => { const st = HomeBuild.st().lots[d.v]; if (!st || st.restDay === S.day) { UI.toast('พักที่บ้านหลังนี้ไปแล้ววันนี้', '🛌'); return; } st.restDay = S.day; UI.close(); fade(() => { tick(120); S.energy = Math.min(maxEnergy(), S.energy + 35); S.mood = Math.min(100, (S.mood || 50) + 8); UI.toast('พักผ่อนบ้านหลังใหม่ สบายมาก พลังงาน +35', '🛌'); }); },
  lotsolar: d => { const st = HomeBuild.st().lots[d.v]; if (S.money < 40000) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(40000), '💸'); return; } S.money -= 40000; st.solar = Math.min(12, (st.solar || 0) + 6); HomeBuild.draw(d.v); UI.toast('ติดโซลาร์บนหลังคาแล้ว ค่าเช่าเพิ่ม และขายไฟคืนได้', '☀️'); },
  lotsmart: d => { const st = HomeBuild.st().lots[d.v]; if (S.money < 25000) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(25000), '💸'); return; } S.money -= 25000; st.smart = 1; HomeBuild.draw(d.v); UI.toast('ติดชุดสมาร์ทโฮมแล้ว ค่าเช่า +30%', '🤖'); },
  extbuy: d => HouseExt.buy(d.v), extuse: d => HouseExt.use(d.v), extui: () => { UI.close(); HouseExt.ui(); },
  pwreset: () => { const s = Power.st(); s.trip = 0; UI.toast('รีเซ็ตเบรกเกอร์แล้ว ไฟกลับมา (ระวังเปิดเครื่องใช้ไฟพร้อมกันเยอะ)', '⚡'); },
  sh: d => SmartApp.act(d.v), schdel: d => { (S.sched || []).splice(+d.i, 1); },
  autogo: d => EV.autoGo(d.i),
});
