'use strict';
// ---------- Companies like real life: reserve a name and register with the business-development office
// (2+ shareholders, registered capital with 25% paid up, fees by capital, an office address), then get the
// licences, premises, power (3-phase or a private transformer), business internet, network/CCTV and staff
// that each business type needs before it may open; run it day to day with payroll, social security, rent,
// business electricity tariff, VAT and corporate tax ----------
// bigger supplies for businesses (there is no "2-phase" or "4-phase" service in Thailand: it is 1-phase 2-wire,
// 3-phase 4-wire, or medium voltage 22 kV with your own transformer)
Object.assign(METERS, {
  m3p30: { n: 'มิเตอร์ 30(100)A 3 เฟส 4 สาย', kw: 69, fee: 24500, dep: 12000, cable: 35, three: 1 },
  m3pct: { n: 'มิเตอร์ 3 เฟส 4 สาย ซีทีมิเตอร์ 200A', kw: 138, fee: 52000, dep: 30000, cable: 95, three: 1, biz: 1 },
  tr160: { n: 'หม้อแปลงเฉพาะราย 160 kVA (แรงสูง 22 kV)', kw: 128, fee: 45000, dep: 90000, mv: 1, kva: 160 },
  tr250: { n: 'หม้อแปลงเฉพาะราย 250 kVA (22 kV)', kw: 200, fee: 60000, dep: 140000, mv: 1, kva: 250 },
  tr500: { n: 'หม้อแปลงเฉพาะราย 500 kVA (22 kV)', kw: 400, fee: 90000, dep: 280000, mv: 1, kva: 500 },
  tr1000: { n: 'หม้อแปลงเฉพาะราย 1,000 kVA (22 kV)', kw: 800, fee: 150000, dep: 550000, mv: 1, kva: 1000 },
  tr2000: { n: 'หม้อแปลงเฉพาะราย 2,000 kVA (22 kV)', kw: 1600, fee: 260000, dep: 1100000, mv: 1, kva: 2000 },
});
// business internet (per company site) and data SIM plans
// tier: S small business (shop, SME) · M medium · L large (enterprise) · X data-centre / carrier level (v202: many more plans in every tier)
const BIZ_TIERS = [['S', '🏪 ธุรกิจขนาดเล็ก (ร้านค้า · SME เริ่มต้น)'], ['M', '🏢 ธุรกิจขนาดกลาง (สำนักงาน · หลายสาขา)'], ['L', '🏭 ธุรกิจขนาดใหญ่ (องค์กร · โรงงาน)'], ['X', '🗄️ ระดับดาต้าเซ็นเตอร์ / ผู้ให้บริการ']];
const BIZ_NET = {
  sfib100: { tier: 'S', n: 'ไฟเบอร์ธุรกิจ SOHO 100/100 Mbps + IP คงที่ 1 ตัว', down: 100, up: 100, price: 1100, days: 1 },
  sfib300: { tier: 'S', n: 'ไฟเบอร์ธุรกิจ SME 300/300 Mbps + IP คงที่ 1 ตัว', down: 300, up: 300, price: 1490, days: 1 },
  sfib500: { tier: 'S', n: 'ไฟเบอร์ธุรกิจ SME 500/500 Mbps + IP คงที่ 2 ตัว', down: 500, up: 500, price: 1899, days: 1 },
  s5gb: { tier: 'S', n: 'เน็ต 5G ธุรกิจ 300/60 Mbps (สายสำรอง ไม่ต้องรอช่าง)', down: 300, up: 60, price: 1490, days: 1 },
  bfib: { tier: 'M', n: 'ไฟเบอร์ธุรกิจ 1Gbps + Fixed IP', down: 1000, up: 500, price: 2199, days: 1 },
  bfib2: { tier: 'M', n: 'ไฟเบอร์ธุรกิจ 2000/500 Mbps + IP คงที่ SLA 12 ชม.', down: 2000, up: 500, price: 3299, days: 2 },
  dia500m: { tier: 'M', n: 'DIA 500 Mbps SLA 99.9% (สายเฉพาะไม่แชร์)', down: 500, up: 500, price: 18800, days: 2, router: 1 },
  sdwan: { tier: 'M', n: 'วงจรเชื่อมสาขา SD-WAN/MPLS 500 Mbps (ทุกสาขา)', down: 500, up: 500, price: 18000, days: 3, router: 1 },
  bfib5: { tier: 'M', n: 'ไฟเบอร์ธุรกิจ 5 Gbps SLA 99.5%', down: 5000, up: 2500, price: 9900, days: 2, router: 1 },
  dia1: { tier: 'M', n: 'Dedicated Internet (DIA) 1 Gbps SLA 99.9% (เน็ตในประเทศ รวม IP 32 ตัว)', down: 1000, up: 1000, price: 12500, days: 2, router: 1 },
  dia2: { tier: 'L', n: 'DIA 2 Gbps SLA 99.9% + BGP', down: 2000, up: 2000, price: 16500, days: 3, router: 1 },
  dia5: { tier: 'L', n: 'DIA 5 Gbps SLA 99.95% + BGP', down: 5000, up: 5000, price: 24000, days: 3, router: 1 },
  dia10: { tier: 'L', n: 'DIA 10 Gbps SLA 99.95%', down: 10000, up: 10000, price: 32000, days: 3, fw: 1 },
  dia20: { tier: 'L', n: 'DIA 20 Gbps (2 เส้นทางสำรองกัน)', down: 20000, up: 20000, price: 55000, days: 3, fw: 1 },
  dia40: { tier: 'L', n: 'DIA 40 Gbps (4 เส้นทางสำรองกัน SLA 99.99%)', down: 40000, up: 40000, price: 85000, days: 4, fw: 1 },
  dia100: { tier: 'X', n: 'IP Transit 100 Gbps (ระดับดาต้าเซ็นเตอร์)', down: 100000, up: 100000, price: 160000, days: 4, fw: 1, dc: 1 },
  dia200: { tier: 'X', n: 'IP Transit 200 Gbps (2 × 100G)', down: 200000, up: 200000, price: 300000, days: 5, fw: 1, dc: 1 },
  dia500: { tier: 'X', n: 'IP Transit 500 Gbps (ระดับผู้ให้บริการ)', down: 500000, up: 500000, price: 680000, days: 5, fw: 1, dc: 1 },
  dia1t: { tier: 'X', n: 'IP Transit 1 Tbps (ระดับ Tier-1 ผู้ให้บริการ)', down: 1000000, up: 1000000, price: 1300000, days: 6, fw: 1, dc: 1 },
};
const SIM_PLANS = { s10: { n: 'ซิมเน็ต 10GB/เดือน', gb: 10, price: 150 }, s20: { n: 'ซิมเน็ต 20GB/เดือน', gb: 20, price: 220 }, s100: { n: 'ซิมเน็ต 100GB/เดือน', gb: 100, price: 450 }, s500: { n: 'ซิมเน็ต 500GB/เดือน', gb: 500, price: 899 } };
const CO_SITES = {
  home: { n: 'ใช้บ้านตัวเองเป็นที่ตั้งสำนักงาน', rent: 0, kinds: ['it', 'sec', 'solar'] },
  office: { n: 'อาคารสำนักงาน หมู่บ้านสุขใจ (ฝั่งตะวันตก)', rent: 12000, kinds: ['it', 'sec', 'solar', 'logistics'] },
  shop: { n: 'อาคารพาณิชย์ 2 คูหา หมู่บ้านสุขใจ (ฝั่งตะวันออก)', rent: 25000, kinds: ['cafe', 'sec', 'it', 'logistics'] },
  land: { n: 'ที่ดินเปล่า 2 ไร่ + อาคารสำเร็จรูป หมู่บ้านสุขใจ', rent: 45000, kinds: ['ev', 'dc', 'food', 'logistics'] },
  factory: { n: 'โรงงานสำเร็จรูป 1,000 ตร.ม. พร้อมห้องเซิร์ฟเวอร์ หมู่บ้านสุขใจ', rent: 80000, kinds: ['food', 'dc', 'logistics'] },
  // v195: premises in the other towns (rent follows the size of the town)
  office_metro: { n: 'อาคารสำนักงาน สุขนครมหานคร', rent: 18000, kinds: ['it', 'sec', 'solar', 'logistics'], town: 'metro' },
  shop_metro: { n: 'อาคารพาณิชย์ 2 คูหา สุขนครมหานคร', rent: 37500, kinds: ['cafe', 'sec', 'it', 'logistics'], town: 'metro' },
  land_metro: { n: 'ที่ดินเปล่า 2 ไร่ + อาคารสำเร็จรูป สุขนครมหานคร', rent: 67500, kinds: ['ev', 'dc', 'food', 'logistics'], town: 'metro' },
  factory_metro: { n: 'โรงงานสำเร็จรูป 1,000 ตร.ม. พร้อมห้องเซิร์ฟเวอร์ สุขนครมหานคร', rent: 120000, kinds: ['food', 'dc', 'logistics'], town: 'metro' },
  office_orchard: { n: 'อาคารสำนักงาน สวนทองเมือง', rent: 12000, kinds: ['it', 'sec', 'solar', 'logistics'], town: 'orchard' },
  shop_orchard: { n: 'อาคารพาณิชย์ 2 คูหา สวนทองเมือง', rent: 25000, kinds: ['cafe', 'sec', 'it', 'logistics'], town: 'orchard' },
  land_orchard: { n: 'ที่ดินเปล่า 2 ไร่ + อาคารสำเร็จรูป สวนทองเมือง', rent: 45000, kinds: ['ev', 'dc', 'food', 'logistics'], town: 'orchard' },
  office_sunflower: { n: 'อาคารสำนักงานเล็ก บ้านทุ่งทานตะวัน', rent: 8000, kinds: ['it', 'sec', 'solar', 'logistics'], town: 'sunflower' },
  shop_sunflower: { n: 'อาคารพาณิชย์ 2 คูหา บ้านทุ่งทานตะวัน', rent: 17500, kinds: ['cafe', 'sec', 'it', 'logistics'], town: 'sunflower' },
};
const CO_LIC = {
  vat: { n: 'จดทะเบียนภาษีมูลค่าเพิ่ม ภ.พ.20 (กรมสรรพากร)', fee: 0, days: 1 },
  nbtc: { n: 'ใบอนุญาตโทรคมนาคมแบบที่ 1 (กสทช.)', fee: 5000, days: 2 },
  erc: { n: 'ใบอนุญาตกิจการพลังงาน/ผู้ให้บริการอัดประจุ (กกพ.)', fee: 20000, days: 3 },
  build: { n: 'ใบอนุญาตก่อสร้าง/ดัดแปลงอาคาร (อ.1 เทศบาล)', fee: 8000, days: 2 },
  fda: { n: 'ใบอนุญาตผลิตอาหาร (อย.) + มาตรฐาน GMP', fee: 15000, days: 3, need: c => c.eq.gmp ? '' : 'ต้องปรับปรุงสถานที่ผลิตตามมาตรฐาน GMP ก่อน' },
  rong4: { n: 'ใบอนุญาตประกอบกิจการโรงงาน (รง.4)', fee: 25000, days: 3 },
  food: { n: 'ใบอนุญาตจัดตั้งสถานที่จำหน่ายอาหาร (เทศบาล)', fee: 2000, days: 1, need: c => c.eq.kitchen ? '' : 'ต้องมีครัวมาตรฐานก่อน' },
  dlt: { n: 'ใบอนุญาตประกอบการขนส่งไม่ประจำทาง (กรมการขนส่งทางบก)', fee: 10000, days: 2 },
};
const CO_EQ = {
  ws: { n: 'คอมพิวเตอร์พนักงาน + โต๊ะ + ไลเซนส์ซอฟต์แวร์ (ต่อคน)', price: 35000, w: 250, multi: 1 },
  kitchen: { n: 'ครัวสแตนเลสมาตรฐาน + เครื่องดูดควัน', price: 180000, w: 12000 },
  gmp: { n: 'ปรับปรุงสถานที่ผลิตตาม GMP (ห้องสะอาด ท่อระบาย)', price: 350000, w: 0 },
  line: { n: 'ไลน์เครื่องจักรแปรรูป (ล้าง หั่น อบ บรรจุ)', price: 900000, w: 45000 },
  evdc: { n: 'เครื่องชาร์จ EV DC Fast Charge 120 kW', price: 950000, w: 120000, multi: 1 },
  evac: { n: 'เครื่องชาร์จ EV AC 22 kW (3 เฟส)', price: 45000, w: 22000, multi: 1 },
  gen: { n: 'เครื่องกำเนิดไฟฟ้าดีเซลสำรอง 500 kVA + ATS', price: 1800000, w: 0 },
  canopy: { n: 'หลังคาสถานีชาร์จ + ป้ายไฟ + ลานจอด', price: 600000, w: 500 },
  tools: { n: 'ชุดเครื่องมือช่างติดตั้ง (บันได เครื่องเข้าหัวสาย เครื่องทดสอบ)', price: 45000, w: 0 },
  solarkit: { n: 'สต็อกแผง/อินเวอร์เตอร์สำหรับงานลูกค้า', price: 400000, w: 0 },
};
const ROLES = {
  dev: { n: 'โปรแกรมเมอร์', sal: 35000 }, admin: { n: 'ธุรการ/บัญชี', sal: 15000 }, tech: { n: 'ช่างเทคนิค', sal: 18000 }, eng: { n: 'วิศวกรไฟฟ้า (มีใบ กว.)', sal: 45000 },
  guard: { n: 'พนักงานรักษาความปลอดภัย', sal: 12000 }, worker: { n: 'พนักงานฝ่ายผลิต', sal: 11000 }, qa: { n: 'เจ้าหน้าที่ควบคุมคุณภาพ', sal: 22000 }, chef: { n: 'เชฟ', sal: 20000 }, staff: { n: 'พนักงานบริการ', sal: 11000 }, driver: { n: 'พนักงานขับรถ (ท.2)', sal: 15000 }, installer: { n: 'ช่างติดตั้ง', sal: 15000 },
};
// what each business needs before it may open: [check, text]
const CO_TYPES = {
  it: { n: 'บริษัทพัฒนาซอฟต์แวร์', i: '💻', cap: 1e6, staff: { dev: 2, admin: 1 }, kw: 5, mbps: 500, lic: [], eq: { ws: 3 }, net: ['router|firewall', 'switch'], rev: c => 2 * 7500 * Math.max(0, c.staff.filter(s => s.r === 'dev').length - 1) + 7500, cost: 0.1 },
  sec: { n: 'บริษัทติดตั้งกล้องวงจรปิดและระบบเครือข่าย', i: '📷', cap: 1e6, staff: { installer: 2 }, kw: 3, mbps: 100, lic: [], eq: { tools: 1 }, net: ['router|firewall', 'switch', 'nvr', 'cam'], car: ['pickup', 'van', 'oldtruck', 'truckflat', 'ev_pickup', 'ev_van'], rev: c => c.staff.filter(s => s.r === 'installer').length * 6500, cost: 0.45 },
  solar: { n: 'บริษัทรับติดตั้งโซลาร์เซลล์และเครื่องชาร์จ EV', i: '☀️', cap: 2e6, staff: { eng: 1, installer: 3 }, kw: 3, mbps: 100, lic: [], eq: { tools: 1, solarkit: 1 }, net: [], car: ['pickup', 'truckflat', 'deliveryflat', 'ev_pickup'], rev: c => Math.floor(c.staff.filter(s => s.r === 'installer').length / 3) * 32000, cost: 0.62 },
  cafe: { n: 'ร้านอาหารและคาเฟ่ (นิติบุคคล)', i: '☕', cap: 1e6, staff: { chef: 1, staff: 2 }, kw: 15, mbps: 100, lic: ['food'], eq: { kitchen: 1 }, net: ['router|firewall', 'cam'], rev: () => 65 * 135, cost: 0.38 },
  food: { n: 'บริษัทแปรรูปผลผลิตเกษตร', i: '🏭', cap: 3e6, staff: { worker: 4, qa: 1 }, kw: 60, three: 1, mbps: 100, lic: ['fda', 'rong4'], eq: { gmp: 1, line: 1 }, net: ['router|firewall', 'cam'], rev: c => 4 * 9000 + Math.min(40, Company.crops()) * 120, cost: 0.55 },
  logistics: { n: 'บริษัทขนส่งสินค้า', i: '🚚', cap: 1e6, staff: { driver: 2, admin: 1 }, kw: 5, mbps: 100, lic: ['dlt'], eq: {}, net: ['router|firewall'], trucks: 2, rev: c => Math.min(c.staff.filter(s => s.r === 'driver').length, G.cars.filter(o => HEAVY.includes(o.d.type) || ['truckflat', 'pickup', 'van'].includes(o.d.type)).length) * 8500, cost: 0.35 },
  ev: { n: 'สถานีชาร์จรถยนต์ไฟฟ้า', i: '⚡', cap: 2e6, staff: { tech: 1, guard: 1 }, kw: 300, mv: 1, mbps: 100, lic: ['erc', 'build'], eq: { evdc: 2, canopy: 1 }, net: ['router|firewall', 'cam', 'cam'], rev: c => (c.eq.evdc || 0) * 380 * 7.5 + (c.eq.evac || 0) * 90 * 7.5, cost: 0.08, energy: c => (c.eq.evdc || 0) * 380 + (c.eq.evac || 0) * 90 },
  dc: { n: 'ดาต้าเซ็นเตอร์ / รับฝากเซิร์ฟเวอร์', i: '🗄️', cap: 5e6, staff: { eng: 2, tech: 2, guard: 2 }, kw: 150, mv: 1, mbps: 10000, lic: ['nbtc'], eq: { gen: 1 }, net: ['firewall', 'switch', 'rack', 'rack', 'rack', 'rack', 'ups', 'ups', 'pac', 'pac', 'fire', 'access', 'cam', 'cam', 'cam', 'cam'], rev: c => Sec.site('co:' + c.id).dev.filter(d => DEV[d.k].t === 'rack' && DEV[d.k].u >= 42).length * 28000 / 7 * Math.min(1, 0.5 + c.rep / 100), cost: 0.05 },
};

const Company = {
  st() { if (!S.co) S.co = { list: [], n: 0, names: [] }; return S.co; },
  list() { return this.st().list.filter(c => c.st !== 'closed'); },
  get(id) { return this.st().list.find(c => c.id == id); },
  crops() { return Object.keys(S.inv).filter(k => ITEMS[k] && ITEMS[k].cat === 'crop').reduce((t, k) => t + S.inv[k], 0); },
  feeOf(cap) { return Math.min(25000, Math.max(500, cap / 1e5 * 50)) + Math.min(250000, Math.max(5000, cap / 1e5 * 500)); },
  partners() { const r = Social.st(); const L = Object.entries(S.friends).filter(([, v]) => v >= 5).map(([n]) => n); if (r.stage === 'married' && r.partner && !L.includes(r.partner)) L.unshift(r.partner); return L; },
  // ----- registration -----
  reserve(name, type) {
    name = String(name || '').trim().slice(0, 40); if (name.length < 3) { UI.toast('ตั้งชื่อบริษัทอย่างน้อย 3 ตัวอักษร', '📝'); return; }
    if (this.st().list.some(c => c.name === name && c.st !== 'closed')) { UI.toast('ชื่อนี้มีผู้ใช้แล้ว', '📝'); return; }
    const c = { id: ++this.st().n, name: 'บริษัท ' + name + ' จำกัด', type, st: 'name', nameOK: S.day + 1, staff: [], lic: {}, licApp: {}, eq: {}, cash: 0, rep: 30, books: { rev: 0, cost: 0 }, ytd: 0, year: Math.floor((S.day - 1) / 84), hist: [] };
    this.st().list.push(c); Phone.msg('สำนักงานพัฒนาธุรกิจการค้า', `รับคำขอจองชื่อ "${c.name}" แล้ว ผลการตรวจสอบชื่อแจ้งพรุ่งนี้ (ชื่อที่ได้รับอนุมัติใช้ได้ 30 วัน)`);
  },
  register(id, cap, partner, site) {
    const c = this.get(id), T = CO_TYPES[c.type]; if (!c || c.st !== 'named') return;
    if (cap < T.cap) { UI.toast(`ธุรกิจนี้ควรมีทุนจดทะเบียนอย่างน้อย ${baht(T.cap)}`, '💰'); return; }
    if (!partner) { UI.toast('บริษัทจำกัดต้องมีผู้ถือหุ้นอย่างน้อย 2 คน (คู่สมรสหรือเพื่อนสนิท 5 หัวใจขึ้นไป)', '👥'); return; }
    if (!CO_SITES[site].kinds.includes(c.type)) { UI.toast('ที่ตั้งนี้ใช้กับธุรกิจประเภทนี้ไม่ได้', '🏢'); return; }
    const paid = Math.round(cap * 0.25), fee = this.feeOf(cap), dep = CO_SITES[site].rent * 3;
    if (S.money < paid + fee + dep) { UI.toast(`เงินสดไม่พอ ต้องใช้ ${baht(paid + fee + dep)} (ชำระค่าหุ้น 25% + ค่าธรรมเนียม + ค่าเช่าล่วงหน้า/มัดจำ 3 เดือน)`, '💸'); return; }
    S.money -= paid + fee + dep; Bank2.log('จดทะเบียนบริษัท + ชำระค่าหุ้น', -(paid + fee + dep));
    Object.assign(c, { cap, paid, partner, site, st: 'reg', regDay: S.day + 1, cash: paid, rent: CO_SITES[site].rent });
    UI.close(); Phone.msg('สำนักงานพัฒนาธุรกิจการค้า', `ยื่นจดทะเบียน ${c.name} ทุน ${baht(cap)} (ชำระแล้ว ${baht(paid)}) ค่าธรรมเนียม ${baht(fee)} นายทะเบียนพิจารณาภายใน 1 วันทำการ`);
  },
  // ----- requirements before opening -----
  checks(c) {
    const T = CO_TYPES[c.type], L = [], ok = (b, t) => L.push([!!b, t]);
    const site = Sec.site('co:' + c.id).dev, has = t => site.filter(d => t.split('|').includes(DEV[d.k].t) || t.split('|').includes(d.k)).length;
    ok(c.st === 'setup' || c.st === 'open', 'จดทะเบียนนิติบุคคลเรียบร้อย');
    ok(c.staff.length === 0 || c.lic.sso, 'ขึ้นทะเบียนนายจ้างกับประกันสังคม (ภายใน 30 วันหลังจ้างงาน)');
    for (const [r, n] of Object.entries(T.staff)) { const have = c.staff.filter(s => s.r === r).length + (r === 'eng' && typeof Career !== 'undefined' && Career.is('electrician') && Career.st().rank >= 4 ? 1 : 0) + (r === 'installer' && Career.is('electrician') ? 1 : 0) + (r === 'eng' && window.Gov24 && Gov24.has('lic_eng') ? 1 : 0); ok(have >= n, `พนักงาน ${ROLES[r].n} ${have}/${n} คน`); }
    for (const k of T.lic) ok(c.lic[k], CO_LIC[k].n);
    for (const [k, n] of Object.entries(T.eq)) ok((c.eq[k] || 0) >= n, `${CO_EQ[k].n} ${c.eq[k] || 0}/${n}`);
    const need = {}; for (const t of T.net) need[t] = (need[t] || 0) + 1;
    for (const [t, n] of Object.entries(need)) ok(has(t) >= n, `ติดตั้งในสถานที่: ${t.split('|').map(x => ({ router: 'เราเตอร์', firewall: 'ไฟร์วอลล์', switch: 'สวิตช์', nvr: 'NVR', cam: 'กล้องวงจรปิด', rack: 'ตู้แร็ค 42U', ups: 'UPS', pac: 'แอร์ห้องเซิร์ฟเวอร์', fire: 'ระบบดับเพลิง FM-200', access: 'ระบบควบคุมประตู' })[x] || x).join('/')} ${has(t)}/${n}`);
    const M = METERS[Grid.st().lots['co:' + c.id]], load = this.load(c);
    ok(M && (!T.three || M.three || M.mv) && (!T.mv || M.mv) && M.kw >= load, `ไฟฟ้า: ${M ? M.n + ` (${M.kw} kW)` : 'ยังไม่มีมิเตอร์'} · โหลดที่ต้องใช้ ~${Math.round(load)} kW${T.mv ? ' · ต้องเป็นหม้อแปลงแรงสูงเฉพาะราย' : T.three ? ' · ต้องเป็นไฟ 3 เฟส' : ''}`);
    ok(c.net && BIZ_NET[c.net].down >= T.mbps, `อินเทอร์เน็ตธุรกิจอย่างน้อย ${T.mbps >= 1000 ? T.mbps / 1000 + ' Gbps' : T.mbps + ' Mbps'}${c.netWait ? ' (รอติดตั้ง)' : ''}`);
    if (T.car) ok(G.cars.some(o => T.car.includes(o.d.type)), 'มีรถกระบะ/รถตู้สำหรับออกงาน');
    if (T.trucks) ok(G.cars.filter(o => HEAVY.includes(o.d.type) || ['truckflat', 'pickup', 'van'].includes(o.d.type)).length >= T.trucks && S.lic2, `รถบรรทุก ${T.trucks} คัน + ใบขับขี่รถบรรทุก`);
    return L;
  },
  load(c) { const T = CO_TYPES[c.type]; let w = c.staff.length * 300 + Sec.watts('co:' + c.id); for (const [k, n] of Object.entries(c.eq)) w += (CO_EQ[k].w || 0) * n * (k === 'evdc' || k === 'evac' ? 0.7 : 1); return Math.max(T.kw, w / 1000); },
  dark(id) { const c = this.get(id); return !!(Power.st().out > 0 && !(c && c.eq.gen)); },
  elecCheck(id, target) { const c = this.get(id), M = METERS[target], out = []; if (!c || c.st === 'name' || c.st === 'named' || c.st === 'reg') out.push('ต้องจดทะเบียนบริษัทให้เสร็จก่อน'); if (c && !c.elec) out.push('ยังไม่ได้ทำระบบไฟฟ้าภายในอาคาร (จ้างผู้รับเหมาในหน้าบริษัท)'); if (c && M && M.mv && c.elec !== 'mv') out.push('ไฟแรงสูงต้องมีงานติดตั้งหม้อแปลงและแบบวิศวกรรับรอง'); return out; },
  elecWork(id, mv) { const c = this.get(id); const cost = mv ? 1250000 : 85000; if (c.cash < cost) { UI.toast(`เงินบริษัทไม่พอ (ต้อง ${baht(cost)})`, '💸'); return; } c.cash -= cost; this.book(c, 0, cost); c.elec = mv ? 'mv' : 'lv'; UI.toast(mv ? 'ผู้รับเหมาติดตั้งหม้อแปลง สายแรงสูง ตู้ MDB และแบบวิศวกรรับรองเรียบร้อย' : 'เดินระบบไฟฟ้าอาคาร ตู้ไฟ 3 เฟส และหลักดินเรียบร้อย', '⚡'); },
  // ----- day to day -----
  book(c, rev, cost) { c.books.rev += rev; c.books.cost += cost; c.ytd += rev - cost; },
  day() {
    for (const c of this.st().list) {
      if (c.st === 'name' && S.day >= c.nameOK) { c.st = 'named'; Phone.msg('สำนักงานพัฒนาธุรกิจการค้า', `อนุมัติการจองชื่อ "${c.name}" แล้ว ยื่นจดทะเบียนได้ภายใน 30 วัน`); }
      if (c.st === 'named' && S.day > c.nameOK + 30) { c.st = 'closed'; Phone.msg('สำนักงานพัฒนาธุรกิจการค้า', `ชื่อ "${c.name}" หมดอายุการจอง`, false); }
      if (c.st === 'reg' && S.day >= c.regDay) { c.st = 'setup'; c.regNo = '0' + (105567000000 + c.id * 7919 + S.day) % 1e12; Phone.msg('สำนักงานพัฒนาธุรกิจการค้า', `จดทะเบียน ${c.name} สำเร็จ เลขทะเบียนนิติบุคคล ${c.regNo} เปิดบัญชีธนาคารบริษัทแล้ว ต่อไปเตรียมใบอนุญาต สถานที่ ไฟฟ้า อินเทอร์เน็ต และพนักงาน`); Life2.note('ก่อตั้ง' + c.name + ' 🏢'); }
      for (const [k, d] of Object.entries(c.licApp)) if (S.day >= d) { delete c.licApp[k]; c.lic[k] = 1; Phone.msg(c.name, `ได้รับ${CO_LIC[k].n}แล้ว`, false); }
      if (c.netWait && S.day >= c.netWait.day) { c.net = c.netWait.k; c.netWait = null; Phone.msg(c.name, `ติดตั้ง ${BIZ_NET[c.net].n} เรียบร้อย`, false); }
      if (c.st !== 'open') continue;
      // a day of business
      const T = CO_TYPES[c.type], fails = this.checks(c).filter(x => !x[0]);
      if (fails.length) { c.hist.unshift(`${RD(S.day)}: หยุดดำเนินการ (${fails[0][1]})`); c.hist.length = Math.min(c.hist.length, 8); continue; }
      const M = METERS[Grid.st().lots['co:' + c.id]], load = this.load(c);
      if (this.dark(c.id)) { c.rep = Math.max(0, c.rep - (c.type === 'dc' ? 8 : 2)); c.hist.unshift(`${RD(S.day)}: ไฟดับ ไม่มีไฟสำรอง ขายได้ 0`); continue; }
      const q = 0.75 + c.rep / 200 + Math.random() * 0.2, rev = Math.round(T.rev(c) * q), cost = Math.round(rev * T.cost);
      if (c.type === 'food') { let n = 40; for (const k of Object.keys(S.inv)) { if (!n) break; if (ITEMS[k] && ITEMS[k].cat === 'crop') { const t = Math.min(n, S.inv[k]); takeItem(k, t); earn(priceOf(k) * t); n -= t; } } }
      c.cash += rev - cost; this.book(c, rev, cost); c.rep = Math.min(100, c.rep + 1);
      c.kwh = (c.kwh || 0) + load * 24 * 0.55 + (T.energy ? T.energy(c) : 0); c.peak = Math.max(c.peak || 0, load);
      c.hist.unshift(`${RD(S.day)}: รายรับ ${baht(rev)} ต้นทุน ${baht(cost)}`); c.hist.length = Math.min(c.hist.length, 8);
    }
  },
  // weekly close = monthly in game time: payroll, social security, rent, power, internet, accountant, VAT; yearly tax every 12 weeks
  week() {
    for (const c of this.list()) {
      if (!['setup', 'open'].includes(c.st)) continue;
      const pay = c.staff.reduce((s, x) => s + x.sal, 0), sso = c.staff.reduce((s, x) => s + Math.min(875, Math.min(x.sal, 17500) * 0.05), 0);
      const M = METERS[Grid.st().lots['co:' + c.id]], kwh = c.kwh || 0;
      const power = !M ? 0 : Math.round((M.kw <= 30 ? kwh * (3.9 + TARIFF.ft) + 33.29 : kwh * (3.1 + TARIFF.ft) + (c.peak || 0) * 196.26 + 312.24) * 1.07);
      const net = c.net ? Math.round(BIZ_NET[c.net].price * 1.07) : 0, acct = 3000 + (c.lic.vat ? 1500 : 0);
      const vat = c.lic.vat ? Math.round(Math.max(0, c.books.rev - c.books.cost) * 0.07) : 0;
      const total = pay + sso + c.rent + power + net + acct + vat;
      c.cash -= total; this.book(c, 0, total);
      Phone.msg(c.name, `ปิดงบเดือน: เงินเดือน ${baht(pay)} · ประกันสังคมนายจ้าง ${baht(Math.round(sso))} · ค่าเช่า ${baht(c.rent)} · ค่าไฟธุรกิจ ${baht(power)} (${Math.round(kwh)} หน่วย${M && M.kw > 30 ? `, ค่าดีมานด์ ${Math.round(c.peak || 0)} kW` : ''}) · เน็ต ${baht(net)} · ทำบัญชี ${baht(acct)}${vat ? ` · VAT ${baht(vat)}` : ''} · เงินในบัญชีบริษัท ${baht(Math.round(c.cash))}`, false);
      c.kwh = 0; c.peak = 0; c.books = { rev: 0, cost: 0 };
      if (!c.lic.vat && c.ytd > 1800000) Phone.msg(c.name, 'รายได้เกิน 1.8 ล้านบาทต่อปี ต้องจดทะเบียนภาษีมูลค่าเพิ่ม (ภ.พ.20) ภายใน 30 วัน', true);
      if (c.cash < 0) { c.debtWeeks = (c.debtWeeks || 0) + 1; Phone.msg(c.name, `⚠️ บัญชีบริษัทติดลบ ${baht(Math.round(-c.cash))} เพิ่มทุนหรือลดค่าใช้จ่าย${c.debtWeeks >= 3 ? ' — ธนาคารระงับวงเงิน บริษัทหยุดดำเนินการ' : ''}`, true); if (c.debtWeeks >= 3 && c.st === 'open') c.st = 'setup'; } else c.debtWeeks = 0;
      const yr = Math.floor((S.day - 1) / 84); if (yr !== c.year) { const p = Math.max(0, c.ytd), tax = Math.round(p <= 300000 ? 0 : p <= 3e6 ? (p - 300000) * 0.15 : 405000 + (p - 3e6) * 0.2); c.cash -= tax + 15000; Phone.msg(c.name, `ปิดงบประจำปี: กำไร ${baht(Math.round(c.ytd))} ภาษีเงินได้นิติบุคคล ${baht(tax)} ค่าผู้สอบบัญชี 15,000 ฿`, true); c.ytd = 0; c.year = yr; }
    }
  },
  // ----- UI -----
  html(tab) {
    const L = this.list();
    if (tab === 1) {
      const names = L.filter(c => c.st === 'named');
      return `<p class="lead">ขั้นตอนจริง: ① จองชื่อ (อนุมัติวันถัดไป) → ② จดทะเบียนบริษัทจำกัด (ผู้ถือหุ้น 2 คนขึ้นไป ชำระค่าหุ้น 25% ค่าธรรมเนียมตามทุน มีที่ตั้งสำนักงาน) → ③ ขอใบอนุญาตเฉพาะธุรกิจ จัดหาสถานที่ ไฟฟ้า อินเทอร์เน็ต อุปกรณ์ จ้างพนักงาน → ④ เปิดดำเนินการ</p>
        <h5>① จองชื่อบริษัท</h5><div class="row"><input id="coName" maxlength="30" placeholder="เช่น สุขใจเทค" style="flex:1"><select id="coType">${Object.entries(CO_TYPES).map(([k, T]) => `<option value="${k}">${T.i} ${T.n}</option>`).join('')}</select><button class="btn" data-a="coreserve">ยื่นจองชื่อ</button></div>
        <div class="grid">${Object.entries(CO_TYPES).map(([k, T]) => `<div class="card"><div class="ci">${T.i}</div><div class="cb"><h4>${T.n}</h4><p class="dim">ทุนแนะนำ ${baht(T.cap)} · พนักงาน ${Object.entries(T.staff).map(([r, n]) => ROLES[r].n + ' ' + n).join(', ')} · ไฟ ${T.mv ? 'หม้อแปลงแรงสูง' : T.three ? '3 เฟส' : '1/3 เฟส'} ~${T.kw} kW+ · เน็ต ≥${T.mbps >= 1000 ? T.mbps / 1000 + 'Gbps' : T.mbps + 'Mbps'}${T.lic.length ? ' · ใบอนุญาต: ' + T.lic.map(x => CO_LIC[x].n).join(', ') : ''}</p></div></div>`).join('')}</div>
        ${names.length ? `<h5>② จดทะเบียน (ชื่อที่อนุมัติแล้ว)</h5>${names.map(c => `<div class="card"><div class="ci">📜</div><div class="cb"><h4>${esc(c.name)}</h4><p class="dim">${CO_TYPES[c.type].n} · ชื่อใช้ได้ถึง${RD(c.nameOK + 30)}</p>
          <div class="row"><select id="coCap${c.id}">${[1e6, 2e6, 3e6, 5e6, 10e6].map(v => `<option value="${v}">ทุน ${baht(v)} (ค่าธรรมเนียม ${baht(this.feeOf(v))})</option>`).join('')}</select>
          <select id="coPartner${c.id}">${this.partners().map(n => `<option>${esc(n)}</option>`).join('') || '<option value="">— ไม่มีผู้ถือหุ้นร่วม —</option>'}</select>
          <select id="coSite${c.id}">${Object.entries(CO_SITES).filter(([, X]) => X.kinds.includes(c.type)).map(([k, X]) => `<option value="${k}">${X.n}${X.rent ? ' · เช่า ' + baht(X.rent) + '/เดือน' : ''}</option>`).join('')}</select>
          <button class="btn" data-a="coreg" data-v="${c.id}">ยื่นจดทะเบียน</button></div></div></div>`).join('')}` : ''}`;
    }
    if (!L.length) return '<p class="empty">ยังไม่มีบริษัท ไปที่แท็บ "จดทะเบียนบริษัทใหม่"</p>';
    const c = this.get(this.sel) || L[0]; this.sel = c.id; const T = CO_TYPES[c.type], ch = ['setup', 'open'].includes(c.st) ? this.checks(c) : [], ready = ch.length && ch.every(x => x[0]);
    const stName = { name: '🕓 รออนุมัติชื่อ', named: '📜 จองชื่อแล้ว รอจดทะเบียน', reg: '🕓 นายทะเบียนกำลังพิจารณา', setup: '🛠️ จดทะเบียนแล้ว กำลังเตรียมเปิด', open: '🟢 เปิดดำเนินการ' }[c.st];
    return `<div class="row">${L.map(x => `<button class="btn ${x.id === c.id ? '' : 'ghost'}" data-a="cosel" data-v="${x.id}">${CO_TYPES[x.type].i} ${esc(x.name)}</button>`).join('')}</div>
      <p class="lead">${T.i} <b>${esc(c.name)}</b> · ${stName}${c.regNo ? ` · เลขนิติบุคคล ${c.regNo}` : ''}${c.cap ? ` · ทุน ${baht(c.cap)} ชำระแล้ว ${baht(c.paid)} · ผู้ถือหุ้น: คุณ, ${esc(c.partner)}` : ''}${c.site ? ` · ที่ตั้ง: ${CO_SITES[c.site].n}` : ''}</p>
      ${['setup', 'open'].includes(c.st) ? `<p class="lead">💰 บัญชีบริษัท ${baht(Math.round(c.cash))} · ชื่อเสียง ${c.rep}/100 · กำไรสะสมปีนี้ ${baht(Math.round(c.ytd))} <span class="dim">เพิ่มทุนเข้าบัญชีบริษัท:</span> ${[[5e6, '5 ล้านบาท'], [1e7, '10 ล้านบาท'], [5e7, '50 ล้านบาท'], [1e8, '100 ล้านบาท']].map(([v, t]) => `<button class="btn ghost" data-a="coinject" data-v="${c.id}" data-p="${v}">เพิ่มทุน ${t}</button>`).join('')}<button class="btn ghost" data-a="codiv" data-v="${c.id}">ปันผล 100,000 (หัก 10%)</button></p>
      <h5>เงื่อนไขก่อนเปิดดำเนินการ</h5><ul class="lead">${ch.map(([ok, t]) => `<li>${ok ? '✅' : '❌'} ${esc(t)}</li>`).join('')}</ul>
      <div class="row">${c.st === 'setup' ? `<button class="btn" data-a="coopen" data-v="${c.id}" ${ready ? '' : 'disabled'}>เปิดดำเนินการ</button>` : ''}<button class="btn ghost" data-a="cosec" data-v="${c.id}">ผังเครือข่าย/กล้องที่บริษัท</button><button class="btn ghost" data-a="cogrid">ขอไฟฟ้าที่การไฟฟ้า</button></div>
      <h5>ใบอนุญาต</h5><div class="row">${['vat', ...T.lic].map(k => `<button class="btn ${c.lic[k] ? 'ghost' : ''}" data-a="colic" data-v="${c.id}" data-k="${k}" ${c.lic[k] || c.licApp[k] ? 'disabled' : ''}>${c.lic[k] ? '✅ ' : c.licApp[k] ? '🕓 ' : ''}${CO_LIC[k].n}${!c.lic[k] && !c.licApp[k] ? ` (${baht(CO_LIC[k].fee)}, ${CO_LIC[k].days} วัน)` : ''}</button>`).join('')}${c.staff.length && !c.lic.sso ? `<button class="btn" data-a="cosso" data-v="${c.id}">ขึ้นทะเบียนนายจ้างประกันสังคม</button>` : ''}</div>
      <h5>ระบบไฟฟ้าภายในอาคาร</h5><div class="row">${c.elec ? `<span class="dim">✅ ${c.elec === 'mv' ? 'หม้อแปลงแรงสูงพร้อม' : 'ระบบไฟฟ้าแรงต่ำ 3 เฟสพร้อม'}</span>` : ''}${c.elec !== 'mv' ? `<button class="btn ghost" data-a="coelec" data-v="${c.id}" data-k="${c.elec ? 'mv' : 'lv'}">${c.elec ? 'ติดตั้งหม้อแปลง+ไฟแรงสูง 1,250,000 ฿' : 'เดินระบบไฟอาคาร 3 เฟส 85,000 ฿'}</button>${!c.elec ? `<button class="btn ghost" data-a="coelec" data-v="${c.id}" data-k="mv">ทำระบบแรงสูง+หม้อแปลงเลย 1,250,000 ฿</button>` : ''}` : ''}</div>
      <h5>อินเทอร์เน็ตธุรกิจ</h5>${BIZ_TIERS.map(([tk, tn]) => `<p class="dim" style="margin:8px 0 2px"><b>${tn}</b></p><div class="row">${Object.entries(BIZ_NET).filter(([, X]) => X.tier === tk).map(([k, X]) => `<button class="btn ${c.net === k ? '' : 'ghost'}" data-a="conet" data-v="${c.id}" data-k="${k}" ${c.net === k || (c.netWait && c.netWait.k === k) ? 'disabled' : ''}>${X.n} · ${baht(X.price)}/เดือน${X.fw ? ' · ต้องมีไฟร์วอลล์ 10G' : X.router ? ' · ต้องมีเราเตอร์' : ''}${X.dc ? ' · เฉพาะดาต้าเซ็นเตอร์ / ISP / โฮสติ้ง' : ''}${X.fw || X.router ? ` · ต้องมีเราเตอร์/ไฟร์วอลล์ ≥ ${X.down >= 1e6 ? X.down / 1e6 + 'T' : X.down >= 1000 ? X.down / 1000 + 'G' : X.down + 'M'}` : ''}</button>`).join('')}</div>`).join('')}
      <h5>อุปกรณ์/ทรัพย์สิน</h5><div class="row">${Object.entries(CO_EQ).filter(([k]) => T.eq[k] != null || ['ws', 'evac', 'gen', 'tools'].includes(k)).map(([k, X]) => `<button class="btn ghost" data-a="coeq" data-v="${c.id}" data-k="${k}" ${!CO_EQ[k].multi && c.eq[k] ? 'disabled' : ''}>${X.n} ${baht(X.price)}${c.eq[k] ? ' (มี ' + c.eq[k] + ')' : ''}</button>`).join('')}</div>
      <h5>พนักงาน ${c.staff.length} คน</h5><div class="row">${Object.keys(T.staff).concat(['admin', 'guard']).filter((v, i, a) => a.indexOf(v) === i).map(r => `<button class="btn ghost" data-a="cohire" data-v="${c.id}" data-k="${r}">จ้าง${ROLES[r].n} ${baht(ROLES[r].sal)}/เดือน</button>`).join('')}</div>
      ${c.staff.length ? `<p class="dim">${c.staff.map((s, i) => `${esc(s.name)} (${ROLES[s.r].n}) <button class="btn ghost" data-a="cofire" data-v="${c.id}" data-k="${i}">เลิกจ้าง</button>`).join(' · ')}</p>` : ''}
      ${c.hist.length ? `<h5>บันทึกการดำเนินงาน</h5><p class="dim">${c.hist.map(esc).join('<br>')}</p>` : ''}
      <div class="row"><button class="btn danger" data-a="coclose" data-v="${c.id}">เลิกกิจการ/ชำระบัญชี</button></div>` : `<p class="dim">รอขั้นตอนทะเบียน</p>`}`;
  },
  open() { UI.open('บริษัทของฉัน (ระบบจดทะเบียนนิติบุคคล)', ['บริษัทของฉัน', 'จดทะเบียนบริษัทใหม่'], t => this.html(t), { wide: true }); },
  init() { this.st(); const _b = Life2.bill.bind(Life2); Life2.bill = () => { _b(); this.week(); SIMs.week(); }; },
};
const pay = (c, n, why) => { if (c.cash < n) { UI.toast(`เงินในบัญชีบริษัทไม่พอ (ต้อง ${baht(n)}) เพิ่มทุนก่อน`, '💸'); return false; } c.cash -= n; Company.book(c, 0, n); return true; };
const STAFF_NAMES = ['สมชาย', 'สมหญิง', 'วิชัย', 'มาลี', 'ประยุทธ', 'กนกพร', 'ธนพล', 'ปิยะนุช', 'อนุชา', 'ศิริพร', 'ณัฐวุฒิ', 'จันทร์เพ็ญ', 'ชยพล', 'วรรณา', 'ภาคิน', 'สุดารัตน์'];
Object.assign(UI.H, {
  coreserve: () => { Company.reserve(($('coName') || {}).value, ($('coType') || {}).value); },
  coreg: d => Company.register(+d.v, +($('coCap' + d.v) || {}).value, ($('coPartner' + d.v) || {}).value, ($('coSite' + d.v) || {}).value),
  cosel: d => { Company.sel = +d.v; },
  coopen: d => { const c = Company.get(d.v); if (!Company.checks(c).every(x => x[0])) return; c.st = 'open'; Life2.note(c.name + ' เปิดดำเนินการ 🎉'); UI.toast('เปิดดำเนินการแล้ว! รายได้เข้าบัญชีบริษัททุกวัน ปิดงบทุกสัปดาห์', '🏢'); },
  colic: d => { const c = Company.get(d.v), L = CO_LIC[d.k]; const e = L.need ? L.need(c) : ''; if (e) { UI.toast(e, '📋'); return; } if (!pay(c, L.fee)) return; c.licApp[d.k] = S.day + L.days; UI.toast(`ยื่นขอ${L.n}แล้ว พิจารณา ${L.days} วัน`, '📄'); },
  cosso: d => { const c = Company.get(d.v); c.lic.sso = 1; UI.toast('ขึ้นทะเบียนนายจ้างแล้ว หักเงินสมทบ 5% (สูงสุด 875 ฿/คน) ทุกเดือน', '🏥'); },
  coelec: d => Company.elecWork(+d.v, d.k === 'mv'),
  conet: d => {
    const c = Company.get(d.v), X = BIZ_NET[d.k], site = Sec.site('co:' + c.id).dev; if (!['setup', 'open'].includes(c.st)) return;
    // v207: carrier-level links (IP Transit) are sold to data centres, ISPs and hosting providers; the router / firewall at the site must be able to carry the speed
    if (X.dc && !['dc', 'isp', 'host'].includes(c.type)) { UI.toast(`ลิงก์ระดับนี้ขายให้เฉพาะดาต้าเซ็นเตอร์ ผู้ให้บริการอินเทอร์เน็ต (ISP) และโฮสติ้ง — บริษัท "${c.name}" เป็นบริษัทประเภทอื่น ตรวจว่าเลือกบริษัทถูกตัว`, '🌐'); return; }
    if (X.fw && !site.some(x => DEV[x.k].t === 'firewall' || (DEV[x.k].t === 'router' && (DEV[x.k].thr || 0) >= 100000))) { UI.toast('ลิงก์ 10 Gbps ขึ้นไปต้องติดตั้งไฟร์วอลล์ 10G ขึ้นไป (หรือเราเตอร์ Core 100G) ก่อน — ซื้อได้ที่ร้านไอทีซีเคียวริตี้ แท็บเราเตอร์', '🛡️'); return; }
    if (X.router && !site.some(x => ['router', 'firewall'].includes(DEV[x.k].t))) { UI.toast('ต้องมีเราเตอร์หรือไฟร์วอลล์ที่สถานที่ก่อน', '📡'); return; }
    if (X.fw || X.router) { const have = Math.max(0, ...site.filter(x => ['router', 'firewall'].includes(DEV[x.k].t)).map(x => DEV[x.k].thr || 0)); if (have < X.down) { const g = v => v >= 1e6 ? (v / 1e6) + ' Tbps' : v >= 1000 ? (v / 1000) + ' Gbps' : v + ' Mbps'; UI.toast(`ลิงก์ ${g(X.down)} ต้องมีเราเตอร์/ไฟร์วอลล์ที่รับได้อย่างน้อย ${g(X.down)} (ที่ติดตั้งอยู่รับได้ ${g(have)}) — ซื้อรุ่นที่แรงกว่าได้ที่ร้านไอทีซีเคียวริตี้ แท็บเราเตอร์`, '🛡️'); return; } }
    c.netWait = { k: d.k, day: S.day + X.days }; UI.toast(`นัดสำรวจและติดตั้ง ${X.n} เสร็จ${RD(S.day + X.days)}`, '🌐');
  },
  coeq: d => { const c = Company.get(d.v), X = CO_EQ[d.k]; if (!['setup', 'open'].includes(c.st)) return; if (!pay(c, X.price)) return; c.eq[d.k] = (c.eq[d.k] || 0) + 1; UI.toast('จัดซื้อ ' + X.n + ' แล้ว', '📦'); },
  cohire: d => { const c = Company.get(d.v); if (!['setup', 'open'].includes(c.st)) return; c.staff.push({ r: d.k, sal: ROLES[d.k].sal, name: U.pick(STAFF_NAMES) }); UI.toast(`จ้าง${ROLES[d.k].n}แล้ว (อย่าลืมขึ้นทะเบียนประกันสังคม)`, '🤝'); },
  cofire: d => { const c = Company.get(d.v), s = c.staff[+d.k]; if (!s) return; if (pay(c, s.sal)) { c.staff.splice(+d.k, 1); UI.toast('เลิกจ้างแล้ว จ่ายค่าชดเชยตามกฎหมายแรงงาน 1 เดือน', '📄'); } },
  coinject: d => { const n = +d.p; if (![5e6, 1e7, 5e7, 1e8].includes(n)) { UI.toast('เพิ่มทุนได้เฉพาะ 5 / 10 / 50 / 100 ล้านบาท', '⚠️'); return; } coInject(Company.get(d.v), n); },
  codiv: d => { const c = Company.get(d.v); if (c.cash < 100000 || c.ytd <= 0) { UI.toast('จ่ายปันผลได้เมื่อบริษัทมีกำไรและเงินพอ', '💰'); return; } c.cash -= 100000; earn(90000); Bank2.income('เงินปันผลบริษัท (หักภาษี ณ ที่จ่าย 10%)', 90000); },
  coclose: d => { const c = Company.get(d.v); const back = Math.max(0, Math.round(c.cash - 20000)); c.st = 'closed'; if (back) { earn(back); Bank2.income('คืนทุนหลังชำระบัญชี', back); } UI.toast(`จดทะเบียนเลิกบริษัทและชำระบัญชีแล้ว ได้เงินคืน ${baht(back)}`, '📕'); },
  cosec: d => { UI.close(); Sec.ui('co:' + d.v); },
  cogrid: () => { UI.close(); GridApp.open(); UI.cur.tab = 1; UI.renderBody(); },
});
APPS.splice(8, 0, { id: 'company', i: '🏢', n: 'บริษัทของฉัน' });
Phone.apps.company = () => { setTimeout(() => { Phone.app = null; UI.close(); Company.open(); }, 0); return ''; };

// ----- data SIM plans (for 4G routers and 4G solar cameras): billed monthly with the home internet, with a fair-use cap -----
const SIMs = {
  list() { return (S.isp = S.isp || {}).sims || (S.isp.sims = []); },
  sync() { const n = {}; for (const s of this.list()) n[s.site] = (n[s.site] || 0) + 1; Sec.st().sims = n; },
  add(site, k) { this.list().push({ site, k, used: 0 }); this.sync(); UI.toast(`เปิดใช้ ${SIM_PLANS[k].n} สำหรับ${Sec.siteName(site)}`, '📶'); },
  day() { for (const s of this.list()) { const devs = Sec.site(s.site).dev.filter(d => DEV[d.k].sim).length, cams = Sec.site(s.site).dev.filter(d => DEV[d.k].t === 'cam').length; s.used += devs * 0.3 + (Sec.site(s.site).dev.some(d => d.k === 'r4g') ? 1.2 + cams * 0.6 : 0); if (s.used > SIM_PLANS[s.k].gb && !s.fup) { s.fup = 1; Phone.msg('สุขใจโมบาย', `${SIM_PLANS[s.k].n} ใช้ครบ ${SIM_PLANS[s.k].gb}GB แล้ว ความเร็วลดเหลือ 1 Mbps จนถึงรอบบิลถัดไป`, false); } } },
  week() { let t = 0; for (const s of this.list()) { t += SIM_PLANS[s.k].price; s.used = 0; s.fup = 0; } if (t) { const pay = Math.round(t * 1.07), cash = Math.min(Math.max(0, S.money), pay); S.money -= cash; if (pay > cash) { const b = Bank.st(); b.debt = (b.debt || 0) + pay - cash; } Bank2.log('ค่าซิมเน็ต', -pay); } },
  html() { return `<h5>📶 ซิมเน็ตสำหรับเราเตอร์ 4G / กล้องโซลาร์ 4G</h5><div class="grid">${Object.entries(SIM_PLANS).map(([k, P]) => `<div class="card"><div class="ci">📶</div><div class="cb"><h4>${P.n}</h4><p class="dim">${baht(P.price)}/เดือน · ใช้เกินโควตาความเร็วลดเหลือ 1 Mbps</p><div class="row">${['home'].concat(Company.list().map(c => 'co:' + c.id)).map(s => `<button class="btn ghost" data-a="simadd" data-v="${s}" data-k="${k}">เปิดซิมที่${esc(Sec.siteName(s)).slice(0, 18)}</button>`).join('')}</div></div></div>`).join('')}</div>${this.list().length ? `<p class="lead">ซิมที่ใช้อยู่: ${this.list().map((s, i) => `${SIM_PLANS[s.k].n} (${esc(Sec.siteName(s.site))}) ใช้ไป ${s.used.toFixed(1)}GB${s.fup ? ' ⚠️ลดความเร็ว' : ''} <button class="btn ghost" data-a="simdel" data-v="${i}">ยกเลิก</button>`).join(' · ')}</p>` : ''}`; },
};
Object.assign(UI.H, { simadd: d => SIMs.add(d.v, d.k), simdel: d => { SIMs.list().splice(+d.v, 1); SIMs.sync(); } });
{ const _h = ISP.html.bind(ISP); ISP.html = t => _h(t) + (t === 1 ? SIMs.html() : ''); }

// v198: capital injection by the owner: any amount (typed or one of the quick buttons), taken from the cash in hand, goes to the company account and to paid-up capital
function coInject(c, n) {
  if (!c) return;
  if (!(n >= 1000)) { UI.toast('ใส่จำนวนเงินเพิ่มทุนอย่างน้อย 1,000 ฿', '⚠️'); return; }
  if (S.money < n) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(n), '💸'); return; }
  // the money goes into the company account and into paid-up capital; what is not covered by the unpaid part of the registered capital raises the registered capital too (capital increase)
  const room = Math.max(0, (c.cap || 0) - (c.paid || 0)), raise = Math.max(0, n - room);
  S.money -= n; c.cash += n; c.paid += n; if (raise) c.cap = (c.cap || 0) + raise;
  UI.toast('เพิ่มทุนเข้าบริษัท ' + baht(n) + (raise ? ` · ทุนจดทะเบียนเพิ่มเป็น ${baht(c.cap)}` : ` · ชำระค่าหุ้นที่ยังค้างครบ ${baht(Math.min(n, room))}`), '💰');
}
