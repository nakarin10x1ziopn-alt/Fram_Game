'use strict';
// ---------- Set D: hospital care, school & night classes, floating market, fuel & gas station, breakdowns, licence & tickets, taxi, mountain town, island ferry ----------
const SCHOOL = { x: 32, z: -322, rot: -Math.PI / 2 }, GAS = { x: -12, z: -149 };
FLAT_PADS.push({ x: GAS.x, z: GAS.z, r: 9 });
const CLASSES = {
  cook: { n: 'คอร์สทำอาหารไทย', i: '🍳', price: 1500, perk: 'cook', desc: 'อาหารที่ทำเองขายแพงขึ้น 10%' },
  mech: { n: 'คอร์สช่างยนต์เบื้องต้น', i: '🔧', price: 2000, perk: 'mech', desc: 'ค่าซ่อมรถถูกลงครึ่งหนึ่ง และรถเสื่อมช้าลง' },
  lang: { n: 'คอร์สภาษาและการสื่อสาร', i: '🗣️', price: 1200, perk: 'love', desc: 'คุยถูกใจได้หัวใจเพิ่ม 20%' },
  agri: { n: 'คอร์สเกษตรสมัยใหม่', i: '🌱', price: 1800, perk: 'farm', desc: 'ผักโตเร็วขึ้นถาวร 5%' },
};
const LICENSE_Q = [
  ['ประเทศไทยขับรถชิดฝั่งไหน?', ['ซ้าย', 'ขวา', 'ตรงกลาง'], 0],
  ['ความเร็วสูงสุดในเขตหมู่บ้านคือเท่าไร?', ['60 กม./ชม.', '90 กม./ชม.', '120 กม./ชม.'], 0],
  ['เจอไฟเหลืองควรทำอย่างไร?', ['เร่งให้ผ่าน', 'ชะลอและเตรียมหยุด', 'บีบแตรยาว ๆ'], 1],
  ['ได้ยินเสียงไซเรนรถดับเพลิงควรทำอย่างไร?', ['ขับแข่ง', 'หลบชิดซ้ายให้ทาง', 'หยุดกลางถนน'], 1],
  ['ก่อนออกรถควรทำอะไร?', ['คาดเข็มขัดนิรภัย', 'เปิดเพลงดัง ๆ', 'เล่นมือถือ'], 0],
];
const TAXI_DEST = [
  { n: 'หน้าฟาร์ม', x: 3, z: -62, fee: 0 }, { n: 'หมู่บ้าน (ลานน้ำพุ)', x: -14, z: -262, fee: 80 }, { n: 'สุขใจพลาซ่า', x: -16, z: -112, fee: 60 },
  { n: 'วัดสุขใจาราม', x: -22, z: -322, fee: 90 }, { n: 'โรงเรียน', x: 24, z: -320, fee: 90 }, { n: 'เมืองริมทะเล', x: 300, z: -372, fee: 180 },
  { n: 'ดอยสุขใจ (เมืองภูเขา)', away: 'mount', fee: 350 }, { n: 'เกาะสุขใจ (ทางเรือ)', away: 'island', fee: 400 },
];
Object.assign(ITEMS, { shell: { n: 'เปลือกหอยสวย', i: '🐚', sell: 60, cat: 'mineral' }, pearl: { n: 'ไข่มุกธรรมชาติ', i: '⚪', sell: 650, cat: 'mineral' }, coffee_bean: { n: 'เมล็ดกาแฟดอย', i: '🫘', sell: 180, cat: 'product' } });
FOODS.cocoa = { n: 'โกโก้ร้อนบนดอย', i: '☕', price: 50, en: 20 }; FOODS.khanom = { n: 'ขนมครกตลาดน้ำ', i: '🥞', price: 40, en: 18 }; FOODS.coconutice = { n: 'ไอศกรีมกะทิ', i: '🍨', price: 35, en: 15 };
for (const id of ['cocoa', 'khanom', 'coconutice']) ITEMS['food_' + id] = { n: FOODS[id].n, i: FOODS[id].i, en: FOODS[id].en, cat: 'dish' };
SHOPS.floating = { n: 'ตลาดน้ำริมทะเล', tabs: [{ n: 'ของกินบนเรือ', items: ['food:boat', 'food:khanom', 'food:coconutice', 'food:mango', 'food:coconut'] }, { n: 'ผลไม้', items: ['seed:mango', 'seed:orange', 'seed:pineapple'] }] };
SHOPS.mountain = { n: 'ร้านค้าบนดอย', tabs: [{ n: 'คาเฟ่ดอย', items: ['food:cocoa', 'food:coffee', 'food:cake'] }, { n: 'ของฝากชาวเขา', items: ['tool:wear_scarf', 'tool:wear_beanie', 'tool:wear_bracelet', 'seed:strawberry'] }] };
SHOPS.islandbar = { n: 'บาร์ริมหาดเกาะสุขใจ', tabs: [{ n: 'เครื่องดื่ม', items: ['food:coconut', 'food:thaitea', 'food:coconutice'] }, { n: 'ทะเล', items: ['food:prawn', 'food:grillfish', 'food:squid'] }] };

const Town2 = {
  init() {
    this.buildSchool(); this.buildGas(); this.buildFloating();
    this.areas = { mount: this.buildMountain(), island: this.buildIsland() };
    World.pois.push({ kind: 'act', x: 466, z: -380, r: 2.5, label: 'ท่าเรือข้ามไปเกาะ', icon: '⛴️', map: true, act: () => ({ icon: '⛴️', label: 'นั่งเรือไปเกาะสุขใจ (150 ฿)', fn: () => this.go('island', 150) }) });
  },
  // ----- school & classes -----
  buildSchool() {
    const s = SCHOOL, o = { w: 18, d: 9, h: 6.4, rows: 2, roofH: 2.4, wall: 0xfff3e0, roof: 0xc62828, sign: 'โรงเรียนบ้านสุขใจ', signStyle: { bg: '#1565c0' }, winF: [-6.5, -3.5, 3.5, 6.5], winS: [-2, 2], ww: 1.6, wh: 1.3 };
    const b = World.building(o); b.position.set(s.x, World.groundY(s.x, s.z), s.z); b.rotation.y = s.rot; World.outdoor.add(b);
    Col.box(s.x, s.z, o.w / 2 + 0.3, o.d / 2 + 0.3, s.rot, 'bld'); World.clearNear(s.x, s.z, 12, true);
    const f = new THREE.Group(); f.position.copy(b.position); f.rotation.y = s.rot; World.outdoor.add(f);
    U.mk(f, U.box(16, 0.08, 9, 3), texMat('dirt', 0xc8a97e), [0, 0.04, o.d / 2 + 5]);
    U.mk(f, GEO.cylLo, M.metal, [-7, 4, o.d / 2 + 8.5], [0.06, 8, 0.06]);
    for (const x of [4, 6]) { U.mk(f, GEO.box, M.metal, [x, 1.2, o.d / 2 + 8], [0.06, 2.4, 0.06]); } U.mk(f, GEO.box, M.metal, [5, 2.4, o.d / 2 + 8], [2.2, 0.06, 0.06]);
    const door = l2w(s.x, s.z, s.rot, 0, o.d / 2 + 1.8);
    World.pois.push({ kind: 'act', x: door.x, z: door.z, r: 2.6, label: 'โรงเรียนบ้านสุขใจ', icon: '🏫', map: true, act: () => ({ icon: '🏫', label: 'เข้าโรงเรียน (เรียนภาคค่ำ ลูกไปเรียน)', fn: () => this.schoolUI() }) });
    const t = Models.human({ avatar: 'toon:civil' }), sp = l2w(s.x, s.z, s.rot, 2, o.d / 2 + 1); t.position.set(sp.x, World.groundY(sp.x, sp.z), sp.z); t.rotation.y = s.rot; World.dyn.add(t);
    G.npcs.push({ obj: t, name: 'ครูสมศรี', rot: s.rot, speed: 0, timer: 0, st: 'idle', wave: 0, fixed: true, x: sp.x, z: sp.z, tx: sp.x, tz: sp.z, hx: sp.x, hz: sp.z, hrot: s.rot, staff: true });
    (People._p || (People._p = {}))['ครูสมศรี'] = { fem: true, age: 38, trait: 'kind', job: 'ครูประจำชั้น โรงเรียนบ้านสุขใจ', single: false };
  },
  schoolUI() {
    UI.open('โรงเรียนบ้านสุขใจ', ['เรียนภาคค่ำ', 'ลูก ๆ'], tab => {
      if (tab === 1) { const kids = Social.st().kids.filter(k => { const a = window.Kid182 ? Kid182.d(k) : S.day - k.born; return a >= 7 && a < 45; }); return kids.length ? `<p class="lead">เด็กเล็กและเด็กโตไปโรงเรียนเองทุกวันจันทร์-ศุกร์ ความรู้ช่วยให้โตมามีอาชีพเก่งขึ้น</p>${kids.map(k => `<p>🎒 ${esc(k.name)} · ความรู้ ${k.edu || 0}</p>`).join('')}` : '<p class="empty">ยังไม่มีลูกวัยเรียน</p>'; }
      const h = S.time / 60, open = h >= 17 && h < 21;
      return `<p class="lead">ครูสมศรี: “เรียนภาคค่ำเปิด 17:00–21:00 เรียนครั้งเดียวจบ ได้ความสามารถติดตัวถาวรค่ะ” ${open ? '' : '· ⏰ ตอนนี้ยังไม่เปิดสอน'}</p><div class="grid">${Object.entries(CLASSES).map(([k, C]) => { const done = S.classes && S.classes[k]; return `<div class="card"><div class="ci">${C.i}</div><div class="cb"><h4>${C.n}</h4><p class="dim">${C.desc} · ${baht(C.price)} · 3 ชม.</p><div class="row"><button class="btn" data-a="study" data-k="${k}" ${!done && open && S.money >= C.price ? '' : 'disabled'}>${done ? 'เรียนจบแล้ว' : 'ลงเรียน'}</button></div></div></div>`; }).join('')}</div>`;
    });
  },
  study(k) {
    const C = CLASSES[k]; if (S.money < C.price) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(C.price), '💸'); return; } S.money -= C.price; UI.close();
    fade(() => { tick(180); S.classes = S.classes || {}; S.classes[k] = 1; S.perk = S.perk || {}; S.perk[C.perk] = 1; Prog.add(40); UI.toast(`เรียนจบ${C.n}! ${C.desc}`, '🎓'); Life2.note('เรียนจบ' + C.n); });
  },
  // ----- floating market -----
  buildFloating() {
    const g = new THREE.Group(); World.outdoor.add(g); this.boats = [];
    [[430, -370, 0.3], [437, -366, -0.4], [432, -390, 2.6]].forEach(([x, z, r], i) => {
      const b = new THREE.Group(); b.position.set(x, -0.05, z); b.rotation.y = r; g.add(b);
      U.mk(b, lathe('sampan', [[0, 0], [0.55, 0.05], [0.7, 0.35], [0, 0.35]], 10), M.darkwood, [0, 0, 0], [1, 1, 3.2]);
      for (let k = 0; k < 8; k++) U.mk(b, GEO.sphLo, mc([0xffb300, 0xe53935, 0x7cb342, 0xff7043][k % 4]), [-0.3 + (k % 2) * 0.6, 0.45, -1 + k * 0.28], 0.13);
      const v = Models.human({ avatar: ['Rose', 'Olivia', 'Lydia'][i] }); v.position.set(0, 0.25, 1.2); v.scale.setScalar(0.95); b.add(v);
      const hat = U.mk(b, GEO.cone, mc(0xd7b56d), [0, 2.05, 1.2], [0.45, 0.25, 0.45]); this.boats.push({ b, v, ph: i });
    });
    World.pois.push({ kind: 'shop', id: 'floating', x: 432, z: -378.5, r: 2.4, label: 'ตลาดน้ำริมทะเล', icon: '🛶', map: true });
  },
  // ----- gas station, fuel, wear, licence -----
  buildGas() {
    const g = new THREE.Group(); g.position.set(GAS.x, 0, GAS.z); World.outdoor.add(g);
    const red = mc(0xd32f2f, { roughness: 0.4 }), white = mc(0xf5f5f5);
    U.mk(g, U.box(10, 0.1, 8, 2), texMat('paving', 0xbdbdbd), [0, 0.05, 0]);
    U.mk(g, GEO.box, white, [0, 4.2, 0], [9, 0.35, 6]); U.mk(g, GEO.box, red, [0, 4.0, 0], [9.1, 0.12, 6.1]);
    for (const x of [-3.5, 3.5]) U.mk(g, GEO.box, white, [x, 2.1, 0], [0.3, 4.2, 0.3]);
    for (const z of [-1.4, 1.4]) { U.mk(g, GEO.box, red, [0, 0.8, z], [0.7, 1.6, 0.5]); U.mk(g, GEO.box, new THREE.MeshBasicMaterial({ color: 0x80deea }), [0, 1.25, z + 0.26], [0.45, 0.3, 0.01]); Col.box(GAS.x, GAS.z + z, 0.35, 0.25); }
    const sm = new THREE.MeshStandardMaterial({ map: U.signTex('⛽ ปั๊มสุขใจ', { w: 384, h: 96, bg: '#d32f2f' }) }); U.mk(g, new THREE.PlaneGeometry(4, 1), sm, [0, 4.25, 3.02]);
    World.clearNear(GAS.x, GAS.z, 7, true);
    World.pois.push({ kind: 'act', x: GAS.x - 2, z: GAS.z, r: 4, label: 'ปั๊มน้ำมัน', icon: '⛽', map: true, act: () => ({ icon: '⛽', label: 'เติมน้ำมันรถที่จอดใกล้ ๆ', fn: () => this.refuelNear() }) });
  },
  carState(d) { if (d.fuel == null) d.fuel = 100; if (d.cond == null) d.cond = 100; return d; },
  // called from updateCar after movement
  drive(c, dist, hitSpeed, dt) {
    const d = this.carState(c.d);
    d.fuel = Math.max(0, d.fuel - dist * 0.012);
    d.cond = Math.max(0, d.cond - dist * (S.perk && S.perk.mech ? 0.00025 : 0.0005) - (hitSpeed * 0.4 + hitSpeed * hitSpeed * 0.04));   // crash damage grows with the square of the speed
    if (d.fuel <= 0 && !this.toldFuel) { this.toldFuel = 1; UI.toast('น้ำมันหมด! รถวิ่งได้ช้ามาก ไปเติมที่ปั๊มใกล้สถานีตำรวจ', '⛽'); }
    if (d.cond <= 0 && !this.toldBroke) { this.toldBroke = 1; UI.toast('รถเสีย! เรียกช่างลากรถในแอปแท็กซี่/บริการ หรือดันไปซ่อมที่อู่', '🛠️'); }
    if (d.fuel > 0) this.toldFuel = 0; if (d.cond > 0) this.toldBroke = 0;
    // traffic law: speed cameras in the village, unlicensed driving
    const z = zoneAt(d.x, d.z);
    if (z && z.id === 'village') {
      if (Math.abs(c.speed) * 3.6 > 62 && S.ticketDay !== S.day) { S.ticketDay = S.day; { const paid = Math.min(Math.max(0, S.money), 500); S.money -= paid; Bank2.log('ใบสั่งขับเร็ว', -paid); Stations2.ticket('ขับเร็วเกินกำหนดในหมู่บ้าน', paid); } Phone.msg('สถานีตำรวจภูธรสุขใจ', `กล้องจับความเร็วได้ ${Math.round(Math.abs(c.speed) * 3.6)} กม./ชม. ในเขตหมู่บ้าน (จำกัด 60) ปรับ 500 ฿`); }
      if (!S.license && Math.random() < dt * 0.004 && S.unlicDay !== S.day) { S.unlicDay = S.day; { const paid = Math.min(Math.max(0, S.money), 1000); S.money -= paid; Bank2.log('ขับรถไม่มีใบขับขี่', -paid); Stations2.ticket('ขับรถไม่มีใบขับขี่', paid); } Phone.msg('ด่านตรวจ', 'ขับรถโดยไม่มีใบขับขี่ ปรับ 1,000 ฿ สอบใบขับขี่ได้ที่สถานีตำรวจนะครับ'); }
    }
  },
  topMult(d) { this.carState(d); return (d.fuel <= 0 ? 0.12 : 1) * (d.cond <= 0 ? 0 : d.cond < 30 ? 0.7 : 1); },
  refuelNear() {
    const c = G.driving || G.cars.find(o => Math.hypot(o.d.x - GAS.x, o.d.z - GAS.z) < 9);
    if (!c) { UI.toast('ขับรถมาจอดที่ปั๊มก่อน', '⛽'); return; }
    const d = this.carState(c.d), cost = Math.ceil((100 - d.fuel) * 8); if (cost <= 0) { UI.toast('น้ำมันเต็มถังแล้ว', '⛽'); return; }
    if (S.money < cost) { UI.toast(`ต้องใช้ ${baht(cost)}`, '💸'); return; }
    S.money -= cost; d.fuel = 100; Bank2.log('เติมน้ำมัน', -cost); Sfx.water(); UI.toast(`เติมน้ำมันเต็มถัง ${baht(cost)}`, '⛽');
  },
  repairCost(d) { this.carState(d); return Math.ceil((100 - d.cond) * 15 * (S.perk && S.perk.mech ? 0.5 : 1)); },
  repair() { const o = G.driving; if (!o) return; const cost = this.repairCost(o.d); if (!cost || S.money < cost) return; S.money -= cost; o.d.cond = 100; Bank2.log('ซ่อมรถ', -cost); UI.toast('ซ่อมรถเสร็จ เหมือนใหม่!', '🛠️'); },
  tow() {
    const o = G.cars.find(c => c.d.cond <= 0 || c.d.fuel <= 0) || G.driving; if (!o) { UI.toast('ไม่มีรถที่ต้องลาก', '🛻'); return; }
    if (S.money < 500) { UI.toast('ค่าลากรถ 500 ฿', '💸'); return; }
    if (Garage.full && Garage.full(o)) { UI.toast('โรงจอดรถเต็ม ย้ายรถคันอื่นออกก่อน', '🛻'); return; }
    if (G.driving) { G.driving.speed = 0; exitCar(); }
    S.money -= 500; this.carState(o.d); o.d.fuel = Math.max(o.d.fuel, 20); o.d.cond = Math.max(o.d.cond, 40); Bank2.log('รถลาก', -500);
    UI.close(); fade(() => { Garage.callHome(o); UI.toast('รถลากพารถไปส่งที่โรงจอดในฟาร์ม ซ่อมเบื้องต้นให้แล้ว', '🛻'); });
  },
  licenseUI() {
    if (S.license) { UI.toast('คุณมีใบขับขี่แล้ว', '🪪'); return; }
    UI.toast('สอบใบขับขี่ได้ที่โรงเรียนสอนขับรถภูผา ในเมืองภูผาใหม่ (ถนนทางตะวันตกของวัด)', '🚘'); return;
    this.quiz = { i: 0, ok: 0, qs: LICENSE_Q.slice().sort(() => Math.random() - 0.5).slice(0, 3) };
    UI.open('สอบใบขับขี่ (ค่าสอบ 500 ฿)', null, () => { const q = this.quiz; if (q.i >= 3) return `<p class="lead">${q.ok >= 2 ? '🎉 สอบผ่าน! ได้รับใบขับขี่แล้ว' : '❌ สอบไม่ผ่าน ลองใหม่ได้'} (ถูก ${q.ok}/3)</p>`; const [t, ch] = q.qs[q.i]; return `<p class="lead">ข้อ ${q.i + 1}/3: ${t}</p>${ch.map((c, i) => `<button class="btn ghost choice" data-a="lq" data-i="${i}">${c}</button>`).join('')}`; });
  },
  answer(i) {
    const q = this.quiz; if (q.i === 0 && !q.paid) { if (S.money < 500) { UI.toast('ค่าสอบ 500 ฿', '💸'); return; } S.money -= 500; q.paid = 1; }
    if (+i === q.qs[q.i][2]) q.ok++; q.i++;
    if (q.i >= 3 && q.ok >= 2) { S.license = 1; Life2.note('สอบได้ใบขับขี่แล้ว 🪪'); Prog.add(20); }
  },
  // ----- taxi & away areas -----
  taxiHTML() {
    return `<p class="lead">เรียกแท็กซี่ไปส่งที่ไหนก็ได้ (ใช้เวลาตามระยะทาง)</p><div class="grid">${TAXI_DEST.map((t, i) => `<div class="card"><div class="ci">${t.away ? (t.away === 'island' ? '🏝️' : t.away === 'mount' ? '⛰️' : (Town2.areas[t.away] && Town2.areas[t.away].icon) || '🏙️') : '🚕'}</div><div class="cb"><h4>${t.n}</h4><p>${t.fee ? baht(t.fee) : 'ฟรี (กลับบ้าน)'}</p><div class="row"><button class="btn" data-a="taxi" data-i="${i}" ${S.money >= t.fee ? '' : 'disabled'}>ไปเลย</button></div></div></div>`).join('')}</div>
      <h5>🛻 บริการรถ</h5><div class="row"><button class="btn ghost" data-a="tow">เรียกรถลาก/ช่างฉุกเฉิน (500 ฿)</button></div>`;
  },
  taxi(i) {
    const t = TAXI_DEST[i]; if (S.money < t.fee) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(t.fee), '💸'); return; }
    if (G.driving) { UI.toast('ลงจากรถก่อนเรียกแท็กซี่', '🚕'); return; }
    if (t.away) return this.go(t.away, t.fee);
    S.money -= t.fee; Phone.app = null; UI.close();
    fade(() => { this.leaveAway(true); leaveIndoors(); tick(t.fee / 4); G.player.pos.set(t.x, World.groundY(t.x, t.z), t.z); snapCam(); UI.toast(`แท็กซี่ส่งถึง${t.n}แล้ว`, '🚕'); });
  },
  go(k, fee) {
    if (S.money < fee) { UI.toast('เงินไม่พอ', '💸'); return; }
    if (G.driving) { UI.toast('ลงจากรถก่อน', '🚗'); return; }
    S.money -= fee; Phone.app = null; UI.close();
    const A = this.areas[k];
    fade(() => { leaveIndoors(); if (G.away) G.away.g.visible = false; tick(90); G.away = A; A.g.visible = true; G.player.pos.set(A.spawn.x, A.y, A.spawn.z); G.player.rot = Math.PI; snapCam(); UI.toast(A.hello, A.icon); Life2.note('เดินทางไป' + A.n); });
  },
  leaveAway(silent) {
    if (!G.away) return; const A = G.away; G.away = null; A.g.visible = false;
    if (!silent) fade(() => { tick(90); const b = A.back; G.player.pos.set(b.x, World.groundY(b.x, b.z), b.z); snapCam(); UI.toast('กลับถึงแล้ว', '🚕'); });
  },
  area(n, icon, cx, cz, ground, hello, back) {
    const g = new THREE.Group(); g.visible = false; G.scene.add(g);
    U.mk(g, new THREE.PlaneGeometry(180, 180), ground, [cx, 0, cz], 1, [-Math.PI / 2, 0, 0]).castShadow = false;
    return { n, icon, g, x0: cx - 60, x1: cx + 60, z0: cz - 60, z1: cz + 60, y: 0, spawn: { x: cx, z: cz + 20 }, hello, back, cx, cz };
  },
  buildMountain() {
    const A = this.area('ดอยสุขใจ', '⛰️', 3000, 3000, new THREE.MeshStandardMaterial({ map: T.grass, color: U.col(0x7fa86a), roughness: 0.95 }), 'ถึงดอยสุขใจแล้ว อากาศเย็นสบาย 14°C', { x: -14, z: -262 });
    const g = A.g, pine = mc(0x2e5d3a, { roughness: 0.9 }), trunk = mc(0x5d4037);
    for (let i = 0; i < 70; i++) { const a = Math.random() * TAU, r = 25 + Math.random() * 55, x = A.cx + Math.cos(a) * r, z = A.cz + Math.sin(a) * r, s = 0.8 + Math.random(); U.mk(g, GEO.cylLo, trunk, [x, 1 * s, z], [0.2 * s, 2 * s, 0.2 * s]); U.mk(g, GEO.cone, pine, [x, 3.6 * s, z], [1.6 * s, 4.5 * s, 1.6 * s]); }
    for (let i = 0; i < 4; i++) { const hx = A.cx - 60 + i * 40; U.mk(g, GEO.cone, mc(0x6d8f5e), [hx, 14, A.cz - 75], [30, 28, 20]); }
    const cab = (x, z, r, sign) => { const b = World.building({ w: 7, d: 6, h: 3, roofH: 2.6, wallTex: 'wood', wall: 0xa1887f, roof: 0x4e342e, sign, winF: [-2, 2], winS: [0], pots: true }); b.position.set(x, 0, z); b.rotation.y = r; g.add(b); Col.box(x, z, 3.8, 3.3, r); return l2w(x, z, r, 0, 4.7); };
    const d1 = cab(A.cx - 10, A.cz - 8, 0, 'คาเฟ่บนดอย'), d2 = cab(A.cx + 10, A.cz - 8, 0, 'ของฝากชาวเขา');
    cab(A.cx - 22, A.cz + 6, Math.PI / 2, ''); cab(A.cx + 22, A.cz + 6, -Math.PI / 2, '');
    // strawberry field and viewpoint
    for (let i = 0; i < 6; i++) U.mk(g, U.box(1.4, 0.3, 8, 2), texMat('soil', 0x6d4c33), [A.cx - 4 + i * 1.8, 0.15, A.cz + 32]);
    for (let i = 0; i < 40; i++) U.mk(g, GEO.sphLo, mc(i % 3 ? 0x43a047 : 0xe53935), [A.cx - 4 + (i % 6) * 1.8, 0.4, A.cz + 28.5 + ((i / 6) | 0) * 1.2], 0.18);
    U.mk(g, U.box(6, 0.3, 4, 2), M.wood, [A.cx, 1.5, A.cz - 40]); for (const s of [-1, 1]) U.mk(g, GEO.cylLo, M.darkwood, [A.cx + s * 2.8, 0.75, A.cz - 40], [0.12, 1.5, 0.12]);
    const P = (x, z, icon, label, fn) => World.pois.push({ kind: 'act', x, z, r: 2.4, label, icon, act: () => G.away === A ? { icon, label, fn } : null });
    World.pois.push({ kind: 'shop', id: 'mountain', x: d1.x, z: d1.z, r: 2.4, label: 'คาเฟ่ & ของฝากบนดอย', icon: '☕' });
    World.pois.push({ kind: 'shop', id: 'mountain', x: d2.x, z: d2.z, r: 2.4, label: 'ของฝากชาวเขา', icon: '🧣' });
    P(A.cx, A.cz - 37, '🏞️', 'จุดชมวิวทะเลหมอก (อารมณ์ +25 วันละครั้ง)', () => { if (S.viewDay === S.day) { UI.toast('ชมวิวไปแล้ววันนี้', '🏞️'); return; } S.viewDay = S.day; S.mood = Math.min(100, (S.mood || 50) + 25); UI.toast('ทะเลหมอกสวยมาก! ถ่ายรูปด้วยแอปกล้องได้นะ', '🏞️'); });
    P(A.cx + 6, A.cz + 30, '🍓', 'เก็บสตรอว์เบอร์รีสด (100 ฿ ได้ 5 ลูก วันละครั้ง)', () => { if (S.money < 100 || S.berryDay === S.day) { if (S.berryDay === S.day) UI.toast('เก็บไปแล้ววันนี้', '🍓'); return; } S.berryDay = S.day; S.money -= 100; addItem('strawberry', 5); playAct('harvest', 1); UI.toast('เก็บสตรอว์เบอร์รีหวานฉ่ำ 5 ลูก', '🍓'); });
    P(A.cx - 14, A.cz + 30, '🫘', 'รับซื้อเมล็ดกาแฟจากชาวบ้าน (300 ฿ ได้ 3 ถุง วันละครั้ง)', () => { if (S.money < 300 || S.coffeeDay === S.day) { if (S.coffeeDay === S.day) UI.toast('ชาวบ้านขายให้วันละครั้ง', '🫘'); return; } S.coffeeDay = S.day; S.money -= 300; addItem('coffee_bean', 3); UI.toast('ได้เมล็ดกาแฟดอย 3 ถุง ขายต่อในเมืองได้', '🫘'); });
    P(A.cx, A.cz + 24, '🚐', 'นั่งรถสองแถวกลับหมู่บ้าน', () => this.leaveAway());
    return A;
  },
  buildIsland() {
    const A = this.area('เกาะสุขใจ', '🏝️', 3000, 3400, new THREE.MeshStandardMaterial({ color: U.col(0xf3e2b3), roughness: 1 }), 'ถึงเกาะสุขใจแล้ว ทะเลใสมาก!', { x: 462, z: -380 });
    const g = A.g; A.x0 = A.cx - 35; A.x1 = A.cx + 35; A.z0 = A.cz - 35; A.z1 = A.cz + 35;
    const sea = new THREE.Mesh(new THREE.RingGeometry(38, 200, 48), new THREE.MeshStandardMaterial({ color: U.col(0x1fa3c4), roughness: 0.1, metalness: 0.2 })); sea.rotation.x = -Math.PI / 2; sea.position.set(A.cx, 0.02, A.cz); g.add(sea);
    const palm = (x, z) => { const t = new THREE.Group(); t.position.set(x, 0, z); g.add(t); const lean = (Math.random() - 0.5) * 0.4; for (let i = 0; i < 6; i++) U.mk(t, GEO.cylLo, mc(0x8d6e63), [lean * i * 0.5, 0.5 + i * 0.9, 0], [0.18 - i * 0.015, 0.95, 0.18 - i * 0.015]); for (let k = 0; k < 7; k++) { const a = k / 7 * TAU, l = U.mk(t, GEO.box, mc(0x388e3c, { roughness: 0.8 }), [lean * 3 + Math.cos(a) * 1.1, 5.5, Math.sin(a) * 1.1], [2.4, 0.05, 0.5]); l.rotation.y = -a; l.rotation.z = -0.4; } Col.circle(x, z, 0.3); };
    for (let i = 0; i < 26; i++) { const a = Math.random() * TAU, r = 10 + Math.random() * 22; palm(A.cx + Math.cos(a) * r, A.cz + Math.sin(a) * r); }
    const b = World.building({ w: 7, d: 5, h: 3, roofH: 2, wallTex: 'wood', wall: 0xd7ccc8, roof: 0x8d6e63, sign: 'บาร์ริมหาด', awning: 0x26c6da }); b.position.set(A.cx - 8, 0, A.cz - 10); g.add(b); Col.box(A.cx - 8, A.cz - 10, 3.8, 2.8);
    U.mk(g, GEO.box, mc(0xffffff), [A.cx + 8, 0.6, A.cz - 6], [1.8, 0.05, 0.9]);
    const P = (x, z, icon, label, fn) => World.pois.push({ kind: 'act', x, z, r: 2.4, label, icon, act: () => G.away === A ? { icon, label, fn } : null });
    World.pois.push({ kind: 'shop', id: 'islandbar', x: A.cx - 8, z: A.cz - 6.5, r: 2.4, label: 'บาร์ริมหาด', icon: '🍹' });
    P(A.cx, A.cz + 34, '🤿', 'ดำน้ำดูปะการัง (พลังงาน 15 วันละ 2 ครั้ง)', () => { if ((S.dive || {})[S.day] >= 2) { UI.toast('ดำน้ำพอแล้ววันนี้', '🤿'); return; } if (!useEnergy(15)) return; S.dive = { [S.day]: ((S.dive || {})[S.day] || 0) + 1 }; const r = Math.random(); fade(() => { tick(45); if (r < 0.15) { addItem('pearl'); UI.toast('เจอไข่มุกธรรมชาติ! ✨', '⚪'); } else { addItem('shell', 2); UI.toast('ได้เปลือกหอยสวย 2 ชิ้น และเห็นปลาการ์ตูนเต็มเลย', '🐚'); } S.mood = Math.min(100, (S.mood || 50) + 10); }); });
    P(A.cx + 8, A.cz - 4, '🛌', 'นอนเปลญวนรับลม (พลังงาน +30 วันละครั้ง)', () => { if (S.hamDay === S.day) { UI.toast('พักไปแล้ววันนี้', '🛌'); return; } S.hamDay = S.day; fade(() => { tick(60); S.energy = Math.min(maxEnergy(), S.energy + 30); S.mood = Math.min(100, (S.mood || 50) + 15); UI.toast('หลับสบายใต้ต้นมะพร้าว', '🌴'); }); });
    P(A.cx, A.cz + 26, '⛴️', 'นั่งเรือกลับท่าเรือริมทะเล', () => this.leaveAway());
    return A;
  },
  update(dt) {
    if (this.boats) for (const o of this.boats) { o.b.position.y = -0.05 + Math.sin(G.t * 1.3 + o.ph) * 0.05; o.b.rotation.z = Math.sin(G.t * 0.9 + o.ph) * 0.04; Models.animHuman(o.v, dt, 0, null); }
  },
  // daily: school days and severe illness
  day() {
    const wd = (S.day - 1) % 7 < 5;
    for (const k of Social.st().kids) { const a = window.Kid182 ? Kid182.d(k) : S.day - k.born; if (a >= 7 && a < 45 && wd) k.edu = (k.edu || 0) + 1; }
    if (S.sick) { S.sickDays = (S.sickDays || 0) + 1; if (S.sickDays >= 4 && S.sick === 1 && !S.sickEsc) { S.sickEsc = 1; S.sick = 2; Phone.msg('สุขภาพ', 'อาการป่วยหนักขึ้น! ยาธรรมดาไม่หาย ต้องไปโรงพยาบาลหรือโทร 1669'); } } else { S.sickDays = 0; S.sickEsc = 0; }   // the warning comes once per illness, not every day
  },
};
UI.H.study = d => Town2.study(d.k);
UI.H.taxi = d => Town2.taxi(+d.i);
UI.H.tow = () => Town2.tow();
UI.H.lq = d => Town2.answer(d.i);
UI.H.license = () => Town2.licenseUI();
UI.H.repaircar = () => Town2.repair();
