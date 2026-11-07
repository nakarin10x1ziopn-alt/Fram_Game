'use strict';
// ---------- The approved 22-point plan: highway to the far towns, traffic lights, licence expiry & truck licence,
// cross-town cargo and new town jobs, pet breeding, a seasonal horse league, weekend markets, your own shop in town,
// town quests, town festivals, phone saving/benchmark/battery modes, online friends & gifts, more achievements and a collection book ----------
// highway south out of ภูผาใหม่ with a toll plaza; driving through it takes you (and your car) to the far towns
ROADS.push({ pts: [[-105, -436], [-105, -480], [-105, -528]], w: 9 });
const HW = { x: -105, z: -506 };
FLAT_PADS.push({ x: HW.x, z: HW.z, r: 12 });
const LIGHTS = [{ x: 0, z: -326, n: 'แยกหมู่บ้าน' }, { x: 152, z: -389, n: 'แยกทุ่งทอง' }];
const WK_SPOTS = [{ k: 'thong', n: 'เมืองทุ่งทอง', x: 200, z: -300 }, { k: 'phupha', n: 'เมืองภูผาใหม่', x: -72, z: -410 }, { k: 'village', n: 'ลานหญ้าหมู่บ้านสุขใจ', x: 62, z: -200 }];
for (const w of WK_SPOTS) FLAT_PADS.push({ x: w.x, z: w.z, r: 9 });
const MYSHOP = { x: 181, z: -233, rot: -Math.PI / 2 };
// new part-time jobs in the new towns
PT_JOBS.push(
  { k: 'cargo', n: 'ขับรถส่งสินค้าข้ามเมือง', i: '🚚', pay: 900, desc: 'รับสินค้าที่สุขใจมาร์ทในหมู่บ้าน ขับไปส่งเมืองทุ่งทองหรือภูผาใหม่ (ต้องมีรถ)' },
  { k: 'instructor', n: 'ครูฝึกขับรถ (โรงเรียนภูผา)', i: '🚘', pay: 600, desc: 'สอนขับรถ 2 ชั่วโมง (ต้องมีใบขับขี่)' },
  { k: 'vet', n: 'ผู้ช่วยสัตวแพทย์ (ศูนย์สัตว์เลี้ยงภูผา)', i: '🩺', pay: 450, desc: 'ดูแลสัตว์ป่วย 2 ชั่วโมง (ต้องเลี้ยงสัตว์อย่างน้อย 1 ตัว)' },
  { k: 'itfix', n: 'ช่างซ่อมคอม (คอมพิวเตอร์พลาซ่า)', i: '🛠️', pay: 550, desc: 'ซ่อมและประกอบคอมให้ลูกค้า 2 ชั่วโมง (ต้องเคยประกอบคอมเอง)' },
);
const HEAVY = ['deliveryflat', 'garbage', 'shovel'];
// quests for the two towns on the main map
const TOWN_Q = {
  thong: [
    { g: 'เฮียหมง', n: 'ผักสดให้ร้านอาหาร', d: 'ส่งผักอะไรก็ได้ 10 ชิ้น', bring: ['crop', 10], pay: 1500 },
    { g: 'เจ๊กิม', n: 'ไข่ไก่ทำขนม', d: 'ส่งไข่ 6 ฟอง', bring: ['egg', 6], pay: 1200 },
    { g: 'พี่โต้ง', n: 'สายไอที', d: 'ประกอบคอมพิวเตอร์ของตัวเองให้ได้ 1 เครื่อง', cond: () => (S.pcs || []).length >= 1, pay: 2500 },
    { g: 'น้องฟาง', n: 'ช่วยโปรโมตร้าน', d: 'ไลฟ์สตรีมให้มีผู้ติดตาม 100 คน', cond: () => (S.fans || 0) >= 100, pay: 3000 },
    { g: 'ลุงเฮง', n: 'พลังงานสะอาด', d: 'ติดโซลาร์ที่บ้านอย่างน้อย 4 แผง', cond: () => S.pw && S.pw.panels + S.pw.farm >= 4, pay: 4000 },
    { g: 'พี่หนิง', n: 'นักธุรกิจตัวจริง', d: 'เปิดร้านของคุณเองในทุ่งทองและขายได้ 5,000 ฿', cond: () => S.myshop && (S.myshop.earned || 0) >= 5000, pay: 6000 },
  ],
  phupha: [
    { g: 'ครูฝึกเอก', n: 'ผู้ขับขี่มือโปร', d: 'สอบใบขับขี่ให้ผ่าน', cond: () => !!S.license, pay: 1500 },
    { g: 'พี่บีม', n: 'เพื่อนสี่ขา', d: 'มีสัตว์เลี้ยงอย่างน้อย 2 ตัว', cond: () => (S.pets || []).length >= 2, pay: 1500 },
    { g: 'น้องแบม', n: 'ดอกไม้ให้คุณแม่', d: 'ส่งดอกไม้ (ผลผลิตจากไร่) 5 ชิ้น', bring: ['flower', 5], pay: 1800 },
    { g: 'พี่กอล์ฟ', n: 'รถแห่งอนาคต', d: 'มีรถยนต์ไฟฟ้า EV 1 คัน', cond: () => S.cars.some(c => CARS[c.type] && CARS[c.type].ev), pay: 5000 },
    { g: 'ป้าเพ็ญ', n: 'แชมป์สนามภูผา', d: 'ชนะการแข่งขันสัตว์เลี้ยง 1 ครั้ง', cond: () => (S.pets || []).some(p => p.wins > 0), pay: 3000 },
    { g: 'พี่ปอ', n: 'บ้านในฝัน', d: 'สร้างบ้านหลังใหม่บนที่ดินของคุณให้เสร็จ', cond: () => S.hb && Object.values(S.hb.lots).some(l => l.stage >= 3), pay: 10000 },
  ],
};
// 22 more achievements
ACH.push(
  ['solar', 'บ้านพลังแดด', '☀️', s => s.pw && s.pw.panels + s.pw.farm >= 4], ['solar40', 'เจ้าของโซลาร์ฟาร์ม', '🔆', s => s.pw && s.pw.farm >= 20], ['batt', 'ไฟไม่มีดับ', '🔋', s => s.pw && s.pw.batt >= 10],
  ['ev', 'สายรักษ์โลก EV', '⚡', s => s.cars.some(c => CARS[c.type] && CARS[c.type].ev)], ['auto', 'รถขับเอง', '🤖', s => !!s.autopilot],
  ['build', 'เจ้าของบ้านหลังที่สอง', '🏡', s => s.hb && Object.values(s.hb.lots).some(l => l.stage >= 3)], ['landlord', 'เศรษฐีบ้านเช่า', '🏘️', s => s.hb && Object.values(s.hb.lots).reduce((a, l) => a + (l.earned || 0), 0) >= 20000], ['ext', 'ต่อเติมครบ', '🧱', s => s.ext && Object.keys(s.ext).length >= 4],
  ['pc', 'ประกอบคอมเอง', '🖥️', s => (s.pcs || []).length >= 1 && (s.pcSkill || 0) >= 1], ['pc8k', 'คอมแรงระดับท็อป', '🚀', s => (s.pcs || []).some(p => p.score >= 8000)], ['fans', 'สตรีมเมอร์ดาวรุ่ง', '📺', s => (s.fans || 0) >= 1000],
  ['bot', 'ไร่อัจฉริยะ', '🤖', s => s.fut && s.fut.farmbot], ['vfarm', 'ฟาร์มแห่งอนาคต', '🥬', s => s.fut && s.fut.vfarm], ['bus', 'ขาประจำรถบัสไฟฟ้า', '🚌', s => (s.busRides || 0) >= 5],
  ['league', 'แชมป์ลีกม้า', '🏇', s => (s.leagueWins || 0) >= 1], ['breed', 'นักผสมพันธุ์', '🧬', s => (s.pets || []).some(p => (p.gen || 0) >= 1)],
  ['tq6', 'ฮีโร่เมืองทุ่งทอง', '🏮', s => s.tq && s.tq.thong >= 6], ['tqp6', 'ฮีโร่เมืองภูผา', '⛰️', s => s.tq && s.tq.phupha >= 6], ['myshop', 'เถ้าแก่น้อย', '🏪', s => s.myshop && (s.myshop.earned || 0) >= 10000],
  ['road', 'ขับข้ามจังหวัด', '🛣️', s => (s.hwTrips || 0) >= 1], ['truck', 'ใบขับขี่รถบรรทุก', '🚛', s => !!s.lic2], ['market', 'พ่อค้าตลาดนัด', '🧺', s => (s.wkSold || 0) >= 50],
);

const Plan = {
  hwExit() { return { x: HW.x, z: HW.z + 12 }; },
  init() {
    this.buildHighway(); this.buildLights(); this.buildMarkets(); this.buildMyShop(); this.buildBoards(); this.buildFestivals();
    // breeding clinic and the horse league at the ภูผา pet centre
    const a = Towns4.arena;
    World.pois.push({ kind: 'act', x: a.x + 14, z: a.z, r: 2.6, label: 'ลีกแข่งม้าประจำฤดู', icon: '🏇', map: true, act: () => ({ icon: '🏇', label: 'ลีกแข่งม้าประจำฤดู', fn: () => this.leagueUI() }) });
    World.pois.push({ kind: 'act', x: a.x, z: a.z - 14, r: 2.6, label: 'คลินิกผสมพันธุ์สัตว์เลี้ยง', icon: '🧬', map: true, act: () => ({ icon: '🧬', label: 'คลินิกผสมพันธุ์สัตว์เลี้ยง', fn: () => this.breedUI() }) });
    // the player can't be left standing in a far town after a reload (that area is only shown while visiting)
    if (G.player.pos.x > 2500) { const p = this.hwExit(); G.player.pos.set(p.x + 3, World.groundY(p.x + 3, p.z), p.z); }
    // phone apps
    APPS.splice(APPS.length - 2, 0, { id: 'cloud', i: '☁️', n: 'เซฟออนไลน์' }, { id: 'friends', i: '👥', n: 'เพื่อนออนไลน์' }, { id: 'collect', i: '📚', n: 'สมุดสะสม' });
    Phone.apps.cloud = () => this.cloudHTML(); Phone.apps.friends = () => this.friendsHTML(); Phone.apps.collect = () => this.collectHTML();
    if (Net.on) { setTimeout(() => this.pullMail(), 4000); setInterval(() => this.pullMail(), 60000); }
    // jobs, licences and the settings menu
    const _sj = Life2.startJob.bind(Life2); Life2.startJob = k => this.job(k) || _sj(k);
    const _uj = Life2.updateJob.bind(Life2); Life2.updateJob = dt => (Life2.job && Life2.job.k === 'cargo' ? this.cargoUpdate(dt) : _uj(dt));
    const _menu = UI.menu.bind(UI); UI.menu = () => { _menu(); const r = UI.cur.render; UI.cur.render = t => r(t).replace('<button class="btn danger" data-a="newgame">', this.menuHTML() + '<button class="btn danger" data-a="newgame">'); UI.renderBody(); };
    if (S.license && !S.licExp) S.licExp = S.day + 60;
    if (S.mobile) this.applyMobile();
  },
  // ===== 1. highway =====
  buildHighway() {
    const g = new THREE.Group(), x = HW.x, z = HW.z, y = World.groundY(x, z); World.outdoor.add(g); World.clearNear(x, z, 10, true);
    const roof = mc(0x1565c0), white = mc(0xfafafa);
    U.mk(g, GEO.box, roof, [x, y + 5.2, z], [16, 0.5, 4]);
    for (const sx of [-7.5, 7.5]) { U.mk(g, GEO.box, white, [x + sx, y + 2.6, z], [0.5, 5.2, 0.5]); Col.circle(x + sx, z, 0.4); }
    // toll booths on the centre island and outside the kerbs, never in a lane
    for (const [sx, w] of [[-5.6, 1.2], [0, 0.9], [5.6, 1.2]]) { U.mk(g, GEO.box, mc(0xeceff1), [x + sx, y + 1.2, z], [w, 2.4, 1.8]); Col.box(x + sx, z, w / 2 + 0.05, 0.95); }
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(10, 1.2), new THREE.MeshStandardMaterial({ map: U.signTex('ทางหลวงหมายเลข 1 · ด่านเก็บเงิน', { w: 768, h: 96, bg: '#1565c0' }) })); sg.position.set(x, y + 5.2, z + 2.05); g.add(sg);
    const gs = new THREE.Mesh(new THREE.PlaneGeometry(5, 2), new THREE.MeshStandardMaterial({ map: U.signTex('เชียงสุข · สุขใจซิตี้ · ดอยสุขใจ', { w: 512, h: 160, bg: '#2e7d32' }) })); gs.position.set(x + 7, y + 3.4, z + 14); g.add(gs);
    U.mk(g, GEO.box, M.trim, [x + 7, y + 1.2, z + 13.95], [0.15, 2.4, 0.1]);
    World.pois.push({ kind: 'act', x, z: z + 4, r: 7, label: 'ด่านทางหลวงหมายเลข 1', icon: '🛣️', map: true, act: () => G.driving ? { icon: '🛣️', label: 'ขึ้นทางหลวงไปเมืองไกล (ค่าทางด่วน 60 ฿)', fn: () => this.hwUI() } : { icon: '🛣️', label: 'ทางหลวงไปเมืองไกล (ต้องขับรถ หรือเรียกแท็กซี่/แท็กซี่บิน)', fn: () => UI.toast('ขับรถมาที่ด่านเพื่อขึ้นทางหลวง', '🛣️') } });
    // the exit gate in every far town (cars arrive on its main street)
    (G.driveHooks = G.driveHooks || []).push(consider => {
      if (!G.away || !G.driving) return; const A = G.away, ex = { x: A.cx, z: A.cz + 62 }, d = Math.hypot(G.driving.d.x - ex.x, G.driving.d.z - ex.z);
      if (d < 10) consider({ kind: 'ext', act: () => ({ icon: '🛣️', label: 'ขับกลับทางหลวงสู่ภูผาใหม่', fn: () => this.hwBack() }) }, d);
    });
    // driving targets: findTarget returns early while driving, so the toll plaza is offered through this hook
    const _ft = findTarget; findTarget = function () { const t = _ft(); if (t || !G.driving) return t; let best = null, bd = 1e9; const c = G.driving.d; for (const f of G.driveHooks || []) f((tt, d) => { if (d < bd) { bd = d; best = tt; } }); const hd = Math.hypot(c.x - HW.x, c.z - HW.z - 4); if (!G.away && hd < 8 && hd < bd) best = { kind: 'ext', act: () => ({ icon: '🛣️', label: 'ขึ้นทางหลวงไปเมืองไกล (60 ฿)', fn: () => Plan.hwUI() }) }; if (best) best.drive = true; return best; };
  },
  hwUI() {
    const dests = [['chiang', 90], ['city', 120], ['mount', 70]].concat(Plan.hwExtra || []).filter(([k]) => Town2.areas[k]);
    UI.open('ทางหลวงหมายเลข 1', null, () => `<p class="lead">🛣️ ขับรถของคุณไปเมืองไกล ค่าทางด่วน 60 ฿ (ใช้น้ำมัน/แบตตามระยะทาง)</p><div class="grid">${dests.map(([k, min]) => { const A = Town2.areas[k]; return `<div class="card"><div class="ci">${A.icon}</div><div class="cb"><h4>${A.n}</h4><p class="dim">ประมาณ ${min} นาที · ใช้พลังงานรถ ${Math.round(min / 4)}%</p><div class="row"><button class="btn" data-a="hwgo" data-v="${k}" data-m="${min}">ออกเดินทาง</button></div></div></div>`; }).join('')}</div>`);
  },
  hwGo(k, min) {
    const c = G.driving, A = Town2.areas[k]; if (!c || !A) return;
    const d = Town2.carState(c.d), use = Math.round(min / 4);
    if (d.fuel < use + 2) { UI.toast(isEV(d) ? 'แบตไม่พอ ชาร์จก่อนนะ' : 'น้ำมันไม่พอ เติมก่อนนะ', '⛽'); return; }
    if (S.money < 60) { UI.toast('เงินไม่พอจ่ายค่าทางด่วน', '💸'); return; }
    S.money -= 60; Bank2.log('ค่าทางด่วน', -60); UI.close();
    fade(() => {
      tick(min); d.fuel -= use; G.away = A; A.g.visible = true; S.hwTrips = (S.hwTrips || 0) + 1;
      c.speed = 0; d.x = A.cx + 2.5; d.z = A.cz + 58; d.r = Math.PI; c.g.position.set(d.x, 0, d.z); c.g.rotation.set(0, d.r, 0);
      G.player.pos.set(d.x, 0, d.z); G.cam.yaw = d.r + Math.PI; snapCam();
      UI.toast(`ขับถึง${A.n}แล้ว! ขับกลับได้ที่ปลายถนนเมือง`, A.icon); Life2.note('ขับรถไป' + A.n + ' ทางหลวง 🛣️');
    });
  },
  hwBack() {
    const c = G.driving; if (!c || !G.away) return; const A = G.away, d = Town2.carState(c.d);
    if (d.fuel < 10) { UI.toast('พลังงานรถไม่พอขับกลับ (เรียกรถลากได้ที่แอปแท็กซี่)', '⛽'); return; }
    if (S.money < 60) { UI.toast('ค่าทางด่วน 60 ฿', '💸'); return; } S.money -= 60;
    fade(() => {
      tick(90); d.fuel = Math.max(0, d.fuel - 20); G.away = null; A.g.visible = false;
      const p = this.hwExit(); c.speed = 0; d.x = p.x + 2.2; d.z = p.z + 4; d.r = Math.PI; c.g.position.set(d.x, World.groundY(d.x, d.z), d.z); c.g.rotation.set(0, d.r, 0);
      G.player.pos.set(d.x, World.groundY(d.x, d.z), d.z); G.cam.yaw = 0; snapCam(); UI.toast('กลับถึงภูผาใหม่แล้ว', '🛣️');
    });
  },
  // ===== 2. traffic lights =====
  buildLights() {
    G.stopPts = [];
    for (const L of LIGHTS) {
      const g = new THREE.Group(), y = World.groundY(L.x, L.z); World.outdoor.add(g);
      const heads = [];
      // poles stand on the two corners farthest from every road (a Y junction has a road where a fixed corner would be)
      const corners = [[1, 1], [-1, -1], [1, -1], [-1, 1]].map(([sx, sz]) => { let px = L.x + sx * 6.5, pz = L.z + sz * 6.5; for (let k = 0; k < 6 && roadDist(px, pz) < 5.2; k++) { px += sx; pz += sz; } return [px - L.x, pz - L.z, roadDist(px, pz)]; }).sort((a, b) => b[2] - a[2]);
      for (const [[ox, oz], ax] of [[corners[0], 0], [corners[1], 1]]) {
        const px = L.x + ox, pz = L.z + oz; U.mk(g, GEO.cyl, mc(0x37474f), [px, y + 2.3, pz], [0.09, 4.6, 0.09]); Col.circle(px, pz, 0.2);
        const h = new THREE.Group(); h.position.set(px, y + 4.2, pz); g.add(h); U.mk(h, GEO.box, mc(0x212121), [0, 0, 0], [0.4, 1.1, 0.35]);
        const lamps = [0xff1744, 0xffc400, 0x00e676].map((c, i) => { const m = new THREE.MeshBasicMaterial({ color: c, toneMapped: false }); for (const s of [-1, 1]) U.mk(h, GEO.sph, m, [0, 0.33 - i * 0.33, s * 0.18], 0.11); for (const s of [-1, 1]) U.mk(h, GEO.sph, m, [s * 0.21, 0.33 - i * 0.33, 0], 0.11); return { m, c: new THREE.Color(c) }; });
        heads.push({ ax, lamps });
      }
      L.heads = heads; L.t = Math.random() * 30;
      // phase 0: traffic along z goes, phase 1: traffic along x goes (with 3 s of amber between)
      L.state = ax => { const t = L.t % 34, ph = t < 17 ? 0 : 1, tt = t % 17; return ph !== ax ? 'red' : tt > 14 ? 'amber' : 'green'; };
      L.redFor = h => { const ax = Math.abs(Math.cos(h)) > 0.7 ? 0 : Math.abs(Math.sin(h)) > 0.7 ? 1 : -1; return ax >= 0 && L.state(ax) !== 'green'; };
      G.stopPts.push({ x: L.x, z: L.z, red: h => L.redFor(h) });
    }
  },
  updateLights(dt) {
    for (const L of LIGHTS) {
      if (!L.heads) continue; L.t += dt;
      for (const hd of L.heads) { const st = hd.ax === 0 ? L.state(0) : L.state(1); hd.lamps.forEach((l, i) => l.m.color.copy(l.c).multiplyScalar((st === 'red' && i === 0) || (st === 'amber' && i === 1) || (st === 'green' && i === 2) ? 1 : 0.12)); }
      // the player's own car running a red light gets a camera ticket
      const c = G.driving; if (!c || G.away) continue;
      const d = Math.hypot(c.d.x - L.x, c.d.z - L.z);
      if (d < 4 && !L.crossed) { L.crossed = true; if (L.redFor(c.d.r) && Math.abs(c.speed) > 3 && L.state(Math.abs(Math.cos(c.d.r)) > 0.7 ? 0 : 1) === 'red') this.ticket('ฝ่าไฟแดงที่' + L.n, 500); }
      if (d > 9) L.crossed = false;
    }
  },
  ticket(t, a) {
    // fines come out of cash first, then the savings account; whatever is really paid can be refunded on appeal
    let paid = Math.min(S.money, a); S.money -= paid; const b = Bank.st(), more = Math.min(b.sav, a - paid); b.sav -= more; paid += more;
    if (paid < a) b.debt = (b.debt || 0) + (a - paid);
    Bank2.log('ใบสั่ง: ' + t, -a); Stations2.ticket(t, a);
    Phone.msg('กล้องจราจรอัจฉริยะ', `${t} ปรับ ${baht(a)} และตัดแต้ม 1 แต้ม (แต้มรวม ${Stations2.st().points}/5)`); UI.toast(`📸 ${t}! ปรับ ${baht(a)}`, '🚦');
  },
  // ===== 3. licence expiry and the truck licence =====
  licDay() {
    if (S.license && !S.licExp) S.licExp = S.day + 60;
    if (S.license && S.licExp && S.day === S.licExp - 3) Phone.msg('กรมการขนส่งทางบก', 'ใบขับขี่จะหมดอายุใน 3 วัน ต่ออายุได้ที่โรงเรียนสอนขับรถภูผา (300 ฿)');
    if (S.license && S.licExp && S.day > S.licExp) { S.license = 0; S.licOld = 1; Phone.msg('กรมการขนส่งทางบก', 'ใบขับขี่หมดอายุแล้ว! ขับรถตอนนี้ถือว่าไม่มีใบขับขี่ ต่ออายุที่โรงเรียนสอนขับรถภูผา'); }
  },
  renew() { if (S.money < 300 || !(S.licOld || S.license)) return; S.money -= 300; UI.close(); fade(() => { tick(60); S.license = 1; S.licOld = 0; S.licExp = S.day + 5 * (typeof YEAR_DAYS !== 'undefined' ? YEAR_DAYS : 84); UI.toast('ต่ออายุใบขับขี่แล้ว ใช้ได้อีก 5 ปี (ถึง' + RD(S.licExp) + ')', '🪪'); }); },
  // ===== 5 & 14. jobs =====
  job(k) {
    if (S.jobN !== S.day) { S.jobN = S.day; S.jobC = 0; } if (S.jobC >= 2) return true;
    if (k === 'cargo') {
      if (!G.cars.length) { UI.toast('ต้องมีรถก่อน', '🚚'); return true; }
      const dest = U.pick([{ x: 164, z: -250, n: 'สุขใจมาร์ท ทุ่งทอง' }, { x: -98, z: -392, n: 'ร้านดอกไม้ภูผา' }, { x: -99, z: -406, n: 'คาเฟ่ริมเขา ภูผา' }]);
      UI.close(); S.jobC++;
      Life2.job = { k, n: 'ส่งสินค้าข้ามเมือง', pay: 900, step: 0, start: { x: 9.8, z: -66 }, dest, t: 0, hint: 'ขับรถไปรับสินค้าที่หน้าสุขใจมาร์ทในหมู่บ้าน' };
      Life2.marker(); UI.toast(Life2.job.hint, '🚚'); return true;
    }
    const J = PT_JOBS.find(j => j.k === k); if (!J || !['instructor', 'vet', 'itfix'].includes(k)) return false;
    if (k === 'instructor' && !S.license) { UI.toast('ต้องมีใบขับขี่ก่อน', '🚘'); return true; }
    if (k === 'vet' && !(S.pets || []).length && !S.animals.length) { UI.toast('ต้องเลี้ยงสัตว์อย่างน้อย 1 ตัว', '🩺'); return true; }
    if (k === 'itfix' && !(S.pcSkill >= 1)) { UI.toast('ต้องเคยประกอบคอมเองก่อน', '🛠️'); return true; }
    S.jobC++; UI.close();
    fade(() => { tick(120); useEnergy(10); earn(J.pay); Bank2.income('งานพิเศษ', J.pay); Prog.add(15); if (k === 'vet') for (const p of S.pets || []) p.joy = Math.min(100, (p.joy ?? 60) + 5); UI.toast(`ทำงาน${J.n}เสร็จ ได้ ${baht(J.pay)}`, J.i); });
    return true;
  },
  cargoUpdate(dt) {
    const j = Life2.job; j.t += dt; Life2.mk.rotation.y += dt * 2;
    if (!G.driving) { if (!Contests.race) { Contests.hud.hidden = false; Contests.hud.textContent = '🚚 ขึ้นรถก่อนนะ งานนี้ต้องขับรถ'; } return; }
    const me = G.driving.d, tgt = j.step === 0 ? j.start : j.dest, d = Math.hypot(me.x - tgt.x, me.z - tgt.z);
    if (!Contests.race) { Contests.hud.hidden = false; Contests.hud.textContent = `🚚 ${j.hint} · ${Math.round(d)} ม.`; }
    if (d < 7) {
      if (j.step === 0) { j.step = 1; j.t = 0; j.hint = 'นำสินค้าไปส่งที่ ' + j.dest.n; UI.toast(j.hint, '📦'); Life2.marker(); }
      else { const bonus = Math.max(0, Math.round((240 - j.t) * 3)), pay = j.pay + bonus; earn(pay); Bank2.income('ส่งสินค้าข้ามเมือง', pay); Prog.add(25); UI.toast(`ส่งสินค้าสำเร็จ! ได้ ${baht(pay)}${bonus ? ` (โบนัสส่งไว ${baht(bonus)})` : ''}`, '💰'); Life2.endJob(); }
    }
  },
  // ===== 6. breeding =====
  breedUI() {
    const L = Pets2.list(), pairs = [];
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) if (L[i].type === L[j].type) pairs.push([i, j]);
    UI.open('คลินิกผสมพันธุ์สัตว์เลี้ยง', null, () => `<p class="lead">🧬 จับคู่สัตว์ชนิดเดียวกัน ลูกได้ค่าความเร็ว/ความงาม/เสียงร้องเฉลี่ยจากพ่อแม่ และมีโอกาสเก่งกว่า · ค่าบริการ 1,500 ฿ · แต่ละตัวผสมได้ทุก 7 วัน · มีสัตว์ได้สูงสุด 5 ตัว</p>${pairs.length ? `<div class="grid">${pairs.map(([i, j]) => { const a = L[i], b = L[j], wait = [a, b].some(p => p.bred && S.day - p.bred < 7); return `<div class="card"><div class="ci">${PETS[a.type].i}</div><div class="cb"><h4>${esc(a.name)} × ${esc(b.name)}</h4><p class="dim">${PETS[a.type].n}</p><div class="row"><button class="btn" data-a="breed" data-i="${i}" data-v="${j}" ${wait || L.length >= 5 || S.money < 1500 ? 'disabled' : ''}>${L.length >= 5 ? 'สัตว์ครบ 5 ตัวแล้ว' : wait ? 'ยังต้องพัก' : 'ผสมพันธุ์'}</button></div></div></div>`; }).join('')}</div>` : '<p class="empty">ต้องมีสัตว์เลี้ยงชนิดเดียวกัน 2 ตัวขึ้นไป (ซื้อเพิ่มที่ศูนย์สัตว์เลี้ยงภูผา)</p>'}`);
  },
  breed(i, j) {
    const L = Pets2.list(), a = L[+i], b = L[+j]; if (!a || !b || a.type !== b.type || L.length >= 5 || S.money < 1500) return;
    S.money -= 1500; a.bred = b.bred = S.day;
    const mix = k => Math.max(0, Math.min(15, Math.round(((a[k] || 0) + (b[k] || 0)) / 2 + (Math.random() * 3 - 0.8))));
    const baby = { type: a.type, name: 'ลูก' + a.name, spd: mix('spd'), beauty: mix('beauty'), sing: mix('sing'), joy: 80, wins: 0, gen: Math.max(a.gen || 0, b.gen || 0) + 1 };
    L.push(baby); UI.close(); Life2.note(`${a.name}กับ${b.name}มีลูกแล้ว! 🧬`);
    UI.toast(`ได้ลูก${PETS[a.type].n} "${baby.name}" ความเร็ว ${baby.spd} ความงาม ${baby.beauty}${baby.sing ? ' เสียง ' + baby.sing : ''}`, PETS[a.type].i);
  },
  // ===== 7. seasonal horse league =====
  league() { const sid = Math.floor((S.day - 1) / SEASON_LEN); if (!S.league || S.league.sid !== sid) S.league = { sid, pts: { 'สายฟ้า': 0, 'เพชรน้ำหนึ่ง': 0, 'ทองแท้': 0, 'ราชันย์': 0, 'ลมกรด': 0 }, done: {}, mine: 0 }; return S.league; },
  leagueUI() {
    const lg = this.league(), dIn = ((S.day - 1) % SEASON_LEN) + 1, round = [1, 2, 4, 6].indexOf(dIn), horses = Pets2.list().filter(p => p.type === 'horse');
    const table = Object.entries(lg.pts).map(([n, v]) => ({ n, v })).concat([{ n: 'คุณ', v: lg.mine, me: 1 }]).sort((a, b) => b.v - a.v);
    UI.open('ลีกแข่งม้าประจำฤดู', null, () => `<p class="lead">🏇 แข่ง 4 สนามต่อฤดู (วันที่ 1, 2, 4, 6 ของฤดู) อันดับ 1-5 ได้ 10/6/4/2/1 คะแนน · จบฤดูแชมป์ได้ 20,000 ฿ + ถ้วย · วันนี้วันที่ ${dIn} ของฤดู</p>
      <table class="tbl"><tr><th>#</th><th>ทีม</th><th>คะแนน</th></tr>${table.map((r, i) => `<tr${r.me ? ' class="good"' : ''}><td>${i + 1}</td><td>${esc(r.n)}</td><td>${r.v}</td></tr>`).join('')}</table>
      ${round < 0 ? '<p class="dim">วันนี้ไม่มีการแข่งลีก</p>' : lg.done[round] ? '<p class="dim">สนามนี้แข่งไปแล้ว</p>' : horses.length ? `<div class="row">${horses.map((h, i) => `<button class="btn" data-a="league" data-i="${Pets2.list().indexOf(h)}">ส่ง ${esc(h.name)} ลงสนามที่ ${round + 1}</button>`).join('')}</div>` : '<p class="empty">ต้องมีม้าก่อน (ศูนย์สัตว์เลี้ยงภูผา)</p>'}`);
  },
  leagueRace(i) {
    const lg = this.league(), dIn = ((S.day - 1) % SEASON_LEN) + 1, round = [1, 2, 4, 6].indexOf(dIn), p = Pets2.list()[+i];
    if (round < 0 || lg.done[round] || !p) return; lg.done[round] = 1;
    const st = Pets2.stat(p), mine = st.spd * 10 + (p.joy ?? 60) / 5 + Math.random() * 30;
    const all = Object.keys(lg.pts).map((n, k) => ({ who: n, score: Math.round(110 * [1.2, 1.1, 1.0, 0.9, 0.8][k] * (0.85 + Math.random() * 0.3)) })).concat([{ who: p.name + ' (ของคุณ)', score: Math.round(mine), me: true }]).sort((a, b) => b.score - a.score);
    const P = [10, 6, 4, 2, 1, 0]; all.forEach((r, k) => { if (r.me) lg.mine += P[k]; else lg.pts[r.who] += P[k]; });
    const rank = all.findIndex(r => r.me) + 1, pay = [3000, 1500, 800][rank - 1] || 200; earn(pay); Bank2.income('ลีกแข่งม้า', pay); p.joy = Math.min(100, (p.joy ?? 60) + 8);
    UI.contestResult(all, rank, pay, { i: '🏇', n: p.name + ' · ลีกสนามที่ ' + (round + 1) });
  },
  leagueEnd() {
    const lg = S.league; if (!lg || lg.paid) return; const dIn = ((S.day - 1) % SEASON_LEN) + 1; if (dIn !== SEASON_LEN || !Object.keys(lg.done).length) return;
    lg.paid = 1;
    // rival stables race every round, whether or not you enter
    const P = [10, 6, 4, 2, 1];
    for (let r = 0; r < 4; r++) if (!lg.done[r]) Object.keys(lg.pts).sort(() => Math.random() - 0.5).forEach((n, k) => { lg.pts[n] += P[k]; });
    const best = Math.max(...Object.values(lg.pts));
    if (lg.mine >= best) { S.leagueWins = (S.leagueWins || 0) + 1; earn(20000); Bank2.income('แชมป์ลีกม้า', 20000); S.furn.trophy = 1; Phone.msg('สมาคมแข่งม้าภูผา', `ยินดีด้วย! ม้าของคุณเป็นแชมป์ลีกประจำฤดู ได้รางวัล 20,000 ฿ และถ้วยแชมป์ 🏆`); Life2.note('คว้าแชมป์ลีกแข่งม้าประจำฤดู! 🏆'); }
    else Phone.msg('สมาคมแข่งม้าภูผา', `จบฤดูกาลแล้ว คุณได้ ${lg.mine} คะแนน ฤดูหน้าลองใหม่นะ`, false);
  },
  // ===== 12. weekend market rotating between towns =====
  wkSpot() { const wd = (S.day - 1) % 7; if (wd !== 5 && wd !== 6) return null; return WK_SPOTS[Math.floor((S.day - 1) / 7) % WK_SPOTS.length]; },
  buildMarkets() {
    this.wk = {};
    SHOPS.wkmarket = { n: 'ตลาดนัดสุดสัปดาห์', tabs: [{ n: 'ของกิน', items: ['food:khanom', 'food:mango', 'food:thaitea', 'food:boat', 'food:coffee'].filter(k => FOODS[k.slice(5)]) }, { n: 'ของแปลก & เมล็ดหายาก', items: Object.keys(CROPS).filter(k => !CROPS[k].tree && (SEED_LVL[k] || 1) >= 4).slice(0, 6).map(k => 'seed:' + k).concat(['tool:krathong', 'tool:treat']) }] };
    for (const W of WK_SPOTS) {
      World.clearNear(W.x, W.z, 9, true);
      const g = new THREE.Group(), y = World.groundY(W.x, W.z); g.position.set(W.x, y, W.z); g.visible = false; World.outdoor.add(g); this.wk[W.k] = g;
      const cols = [0xd84315, 0x6a1b9a, 0x00897b, 0xf9a825, 0x1565c0, 0xc2185b];
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, sx = Math.cos(a) * 6, sz = Math.sin(a) * 6, s = new THREE.Group(); s.position.set(sx, 0, sz); s.rotation.y = -a - Math.PI / 2; g.add(s); U.mk(s, U.box(2.2, 0.85, 1.1, 1.2), M.wood, [0, 0.42, 0]); const c = U.mk(s, GEO.box, U.mat(cols[i], { map: T.stripes }), [0, 2.2, 0], [2.6, 0.08, 1.6]); c.rotation.x = 0.15; for (const k of [-1, 1]) U.mk(s, GEO.cylLo, M.darkwood, [k * 1.1, 1.1, 0.5], [0.05, 2.2, 0.05]); for (let j = 0; j < 4; j++) U.mk(s, GEO.sph, mc([0xe53935, 0xfdd835, 0x43a047, 0xff7043][j]), [-0.7 + j * 0.45, 0.95, 0], 0.15); }
      World.pois.push({ kind: 'act', x: W.x, z: W.z, r: 4, label: 'ตลาดนัดสุดสัปดาห์', icon: '🧺', act: () => this.wkSpot() === W ? { icon: '🧺', label: 'ตลาดนัด: ขายผลผลิต +30% / ซื้อของหายาก', fn: () => this.wkUI() } : null });
    }
    this.wkShow();
  },
  wkShow() { const s = this.wkSpot(); for (const W of WK_SPOTS) this.wk[W.k].visible = s === W; },
  wkUI() {
    const ids = Object.keys(S.inv).filter(id => ITEMS[id] && ITEMS[id].sell && S.inv[id] > 0 && ['crop', 'product', 'dish', 'artisan', 'fish'].includes(ITEMS[id].cat));
    UI.open('ตลาดนัดสุดสัปดาห์', ['ขายของ (+30%)', 'ซื้อของ'], t => t === 1 ? `<div class="row"><button class="btn" data-a="wkshop">เปิดแผงขายของในตลาด</button></div>` : (ids.length ? `<p class="lead">คนเดินตลาดเยอะ ขายได้ราคาดีกว่าปกติ 30%</p><div class="grid">${ids.map(id => `<div class="card"><div class="ci">${ITEMS[id].i}</div><div class="cb"><h4>${ITEMS[id].n} ×${S.inv[id]}</h4><p>${baht(priceOf(id, 1.3))}/ชิ้น</p><div class="row"><button class="btn" data-a="wksell" data-v="${id}" data-q="1">ขาย 1</button><button class="btn ghost" data-a="wksell" data-v="${id}" data-q="all">ขายหมด</button></div></div></div>`).join('')}</div>` : '<p class="empty">ไม่มีของขาย</p>'));
  },
  wkSell(id, q) { const n = q === 'all' ? count(id) : Math.min(1, count(id)); if (!n) return; const v = priceOf(id, 1.3) * n; takeItem(id, n); earn(v); S.stats.sold += n; S.wkSold = (S.wkSold || 0) + n; Bank2.income('ตลาดนัด', v); UI.toast(`ขาย ${ITEMS[id].n} ×${n} ได้ ${baht(v)}`, '🧺'); },
  // ===== 13. your own shop in ทุ่งทอง =====
  buildMyShop() {
    const { x, z, rot } = MYSHOP, o = { w: 8, d: 7, h: 5.6, rows: 2, roofH: 2, wall: 0xfff8e1, roof: 0x6d4c41, sign: 'ร้านค้าให้เช่า', signStyle: { bg: '#6d4c41' }, awning: 0xffa000, glassFront: true };
    const b = World.building(o); b.position.set(x, World.groundY(x, z), z); b.rotation.y = rot; World.outdoor.add(b); Col.box(x, z, o.w / 2 + 0.3, o.d / 2 + 0.3, rot, 'bld'); World.clearNear(x, z, 6, true);
    const door = l2w(x, z, rot, 0, o.d / 2 + 1.7);
    World.pois.push({ kind: 'act', x: door.x, z: door.z, r: 2.4, label: 'ร้านของฉัน', icon: '🏪', map: true, act: () => ({ icon: '🏪', label: S.myshop && S.myshop.until >= S.day ? 'ร้านของฉัน: เติมสต็อก ตั้งราคา' : 'เช่าห้องแถวเปิดร้านของคุณเอง', fn: () => this.shopUI() }) });
  },
  ms() { if (!S.myshop) S.myshop = { until: 0, stock: {}, markup: 1.2, staff: 0, earned: 0, log: [] }; return S.myshop; },
  shopUI() {
    const m = this.ms(), open = m.until >= S.day;
    const ids = Object.keys(S.inv).filter(id => ITEMS[id] && ITEMS[id].sell && S.inv[id] > 0 && ['crop', 'product', 'dish', 'artisan', 'fish', 'bar'].includes(ITEMS[id].cat));
    UI.open('ร้านของฉัน (ทุ่งทอง)', open ? ['สต็อกในร้าน', 'นำของมาวาง', 'ตั้งค่าร้าน'] : null, t => {
      if (!open) return `<p class="lead">ห้องแถว 2 ชั้นกลางเมืองทุ่งทอง ค่าเช่า 3,000 ฿/7 วัน วางของจากไร่ขายเองได้ ตั้งราคาเอง ยิ่งแพงยิ่งขายช้า</p><div class="row"><button class="btn" data-a="msrent" ${S.money >= 3000 ? '' : 'disabled'}>เช่า 7 วัน (3,000 ฿)</button></div>${m.earned ? `<p class="dim">ยอดขายรวมตลอดกาล ${baht(m.earned)}</p>` : ''}`;
      if (t === 0) { const st = Object.entries(m.stock).filter(([, n]) => n > 0); return `<p class="lead">เช่าถึง${RD(m.until)} · ตั้งราคา ×${m.markup.toFixed(1)} ของราคาตลาด · ${m.staff ? 'มีพนักงานขาย' : 'ไม่มีพนักงาน (ขายได้น้อย)'} · ยอดขายรวม ${baht(m.earned)}</p>${st.length ? `<div class="grid">${st.map(([id, n]) => `<div class="card"><div class="ci">${ITEMS[id].i}</div><div class="cb"><h4>${ITEMS[id].n} ×${n}</h4><p>ราคาขาย ${baht(Math.round(priceOf(id) * m.markup))}</p><div class="row"><button class="btn ghost" data-a="msback" data-v="${id}">เอาคืน</button></div></div></div>`).join('')}</div>` : '<p class="empty">ร้านยังว่าง ไปที่แท็บ "นำของมาวาง"</p>'}${m.log.length ? `<h5>ขายเมื่อวาน</h5><p class="dim">${m.log.map(esc).join(' · ')}</p>` : ''}`; }
      if (t === 1) return ids.length ? `<div class="grid">${ids.map(id => `<div class="card"><div class="ci">${ITEMS[id].i}</div><div class="cb"><h4>${ITEMS[id].n} ×${S.inv[id]}</h4><div class="row"><button class="btn" data-a="msput" data-v="${id}" data-q="all">วางทั้งหมด</button><button class="btn ghost" data-a="msput" data-v="${id}" data-q="5">วาง 5</button></div></div></div>`).join('')}</div>` : '<p class="empty">ไม่มีของในกระเป๋า</p>';
      return `<h5>ตั้งราคา (เทียบราคาตลาด)</h5><div class="row">${[0.9, 1.0, 1.2, 1.4, 1.6].map(v => `<button class="btn ${m.markup === v ? '' : 'ghost'}" data-a="msmark" data-v="${v}">×${v.toFixed(1)}</button>`).join('')}</div>
        <h5>พนักงานขาย</h5><div class="row"><button class="btn ${m.staff ? 'ghost' : ''}" data-a="msstaff">${m.staff ? 'เลิกจ้างพนักงาน' : 'จ้างพนักงาน 300 ฿/วัน (ขายได้ 3 เท่า)'}</button></div>
        <h5>สัญญาเช่า</h5><div class="row"><button class="btn ghost" data-a="msrent" ${S.money >= 3000 ? '' : 'disabled'}>ต่อสัญญาอีก 7 วัน (3,000 ฿)</button></div>`;
    }, { wide: true });
  },
  shopDay() {
    const m = S.myshop; if (!m || m.until < S.day - 1) return; m.log = [];
    if (m.until < S.day) { for (const [id, n] of Object.entries(m.stock)) if (n > 0) addItem(id, n); m.stock = {}; Phone.msg('เจ้าของห้องแถว', 'สัญญาเช่าร้านหมดแล้ว ของในร้านส่งคืนเข้ากระเป๋าให้แล้วนะ', false); return; }
    // no money for wages: the staff member quits instead of the balance going negative
    if (m.staff) { if (S.money >= 300) { S.money -= 300; Bank2.log('ค่าจ้างพนักงานร้าน', -300); } else { m.staff = 0; Phone.msg('ร้านของฉัน', 'ไม่มีเงินจ่ายค่าจ้าง พนักงานลาออกแล้ว'); } }
    let cap = m.staff ? 36 : 12, rev = 0; const p = U.clamp(1.25 - m.markup * 0.55, 0.06, 0.9);
    for (const [id, n] of Object.entries(m.stock)) { let sold = 0; for (let i = 0; i < n && cap > 0; i++) if (Math.random() < p) { sold++; cap--; } if (sold) { m.stock[id] -= sold; const v = Math.round(priceOf(id) * m.markup) * sold; rev += v; m.log.push(`${ITEMS[id].n}×${sold}`); } }
    if (rev) { earn(rev); m.earned += rev; Bank2.income('ร้านของฉัน', rev); Phone.msg('ร้านของฉัน', `เมื่อวานขายได้ ${baht(rev)}: ${m.log.join(', ')}`, false); }
  },
  // ===== 15. town quests =====
  buildBoards() {
    for (const [k, x, z] of [['thong', 170 - 6.5, -268 - 31], ['phupha', -105 - 6.5, -400 - 31]]) {
      const g = new THREE.Group(), y = World.groundY(x, z); g.position.set(x, y, z); World.outdoor.add(g);
      U.mk(g, GEO.box, M.darkwood, [0, 1.3, 0], [1.8, 1.2, 0.1]); for (const s of [-1, 1]) U.mk(g, GEO.box, M.darkwood, [s * 0.8, 0.9, 0], [0.1, 1.8, 0.1]);
      const p = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0), new THREE.MeshStandardMaterial({ map: U.signTex('ภารกิจเมือง', { w: 256, h: 160, bg: '#8d6e63' }) })); p.position.set(0, 1.3, 0.06); g.add(p); Col.box(x, z, 1, 0.2);
      World.pois.push({ kind: 'act', x, z: z + 1.2, r: 2.2, label: 'กระดานภารกิจเมือง', icon: '📜', map: true, act: () => ({ icon: '📜', label: 'กระดานภารกิจเมือง', fn: () => this.questUI(k) }) });
    }
  },
  questUI(k) {
    S.tq = S.tq || { thong: 0, phupha: 0 }; const i = S.tq[k] || 0, L = TOWN_Q[k], q = L[i];
    UI.open('ภารกิจเมือง' + (k === 'thong' ? 'ทุ่งทอง' : 'ภูผาใหม่'), null, () => `<p class="lead">ทำแล้ว ${i}/${L.length} ภารกิจ</p><div class="prog"><i style="width:${i / L.length * 100}%"></i></div>${q ? `<div class="card"><div class="ci">📜</div><div class="cb"><h4>${q.n} — จาก${q.g}</h4><p>${q.d}</p><p class="dim">รางวัล ${baht(q.pay)} + ความสนิทกับ${q.g}</p><div class="row"><button class="btn" data-a="tqdone" data-v="${k}" ${this.qReady(q) ? '' : 'disabled'}>${this.qReady(q) ? 'ส่งภารกิจ' : 'ยังทำไม่ครบ'}</button></div></div></div>` : '<p class="lead good">🎉 ทำภารกิจของเมืองนี้ครบทุกข้อแล้ว ชาวเมืองรักคุณมาก!</p>'}`);
  },
  qHave(q) { const [id, n] = q.bring; if (id === 'crop' || id === 'flower') { const ok = Object.keys(S.inv).filter(k => ITEMS[k] && ITEMS[k].cat === 'crop' && (id === 'crop' || /flower|rose|sunflower|tulip|lotus|orchid|marigold|jasmine/.test(k))); return { ids: ok, n: ok.reduce((s, k) => s + S.inv[k], 0) }; } return { ids: Object.keys(S.inv).filter(k => k === id || (ITEMS[k] && ITEMS[k].base === id)), n: countBase ? countBase(id) : count(id) }; },
  qReady(q) { if (q.cond) return q.cond(); const h = this.qHave(q); return h.n >= q.bring[1]; },
  qDone(k) {
    const i = S.tq[k] || 0, q = TOWN_Q[k][i]; if (!q || !this.qReady(q)) return;
    if (q.bring) { let need = q.bring[1]; for (const id of this.qHave(q).ids) { const t = Math.min(need, count(id)); if (t) { takeItem(id, t); need -= t; } if (!need) break; } }
    S.tq[k] = i + 1; earn(q.pay); Bank2.income('ภารกิจเมือง', q.pay); Friends.add(q.g, 1); Prog.add(40); UI.close();
    UI.toast(`ภารกิจ "${q.n}" สำเร็จ! ได้ ${baht(q.pay)} ${q.g}ขอบคุณมาก`, '📜'); Life2.note(`ช่วย${q.g}ทำภารกิจ "${q.n}"`);
  },
  // ===== 16. town festivals: Songkran street in ทุ่งทอง, Loy Krathong pond in ภูผาใหม่ =====
  festToday() { const d = S.day % SEASON_LEN; return d === 3 ? 'songkran' : d === 4 ? 'loy' : null; },
  buildFestivals() {
    // Songkran: water barrels and foam stage along ทุ่งทอง street
    const g1 = new THREE.Group(); g1.visible = false; World.outdoor.add(g1); this.fs = g1;
    for (let i = 0; i < 6; i++) { const z = -268 - 25 + i * 10, x = 170 + (i % 2 ? 5 : -5), y = World.groundY(x, z); U.mk(g1, GEO.cyl, mc(0x1e88e5), [x, y + 0.5, z], [0.45, 1, 0.45]); U.mk(g1, GEO.cyl, mc(0x4fc3f7, { roughness: 0.1 }), [x, y + 1.01, z], [0.4, 0.02, 0.4]); }
    World.pois.push({ kind: 'act', x: 170, z: -268, r: 6, label: 'สงกรานต์ถนนทุ่งทอง', icon: '💦', act: () => this.festToday() === 'songkran' ? { icon: '💦', label: 'เล่นสาดน้ำสงกรานต์', fn: () => this.songkran() } : null });
    // Loy Krathong: a lantern-lit pond inside the pet arena oval
    const a = Towns4.arena, g2 = new THREE.Group(); g2.visible = false; World.outdoor.add(g2); this.fl = g2;
    const ay = World.groundY(a.x, a.z), w = new THREE.Mesh(new THREE.CircleGeometry(6.5, 32), new THREE.MeshStandardMaterial({ color: U.col(0x0d47a1), roughness: 0.08, metalness: 0.3 })); w.rotation.x = -Math.PI / 2; w.position.set(a.x, ay + 0.13, a.z); g2.add(w);
    for (let i = 0; i < 12; i++) { const an = i / 12 * TAU, k = new THREE.Group(); k.position.set(a.x + Math.cos(an) * (2 + (i % 3)), ay + 0.2, a.z + Math.sin(an) * (2 + (i % 3))); g2.add(k); U.mk(k, GEO.cyl, mc(0x66bb6a), [0, 0, 0], [0.25, 0.1, 0.25]); U.mk(k, GEO.sph, new THREE.MeshBasicMaterial({ color: 0xffb74d, toneMapped: false }), [0, 0.18, 0], 0.07); }
    for (let i = 0; i < 16; i++) U.mk(g2, GEO.sph, new THREE.MeshBasicMaterial({ color: 0xffa726, toneMapped: false }), [a.x + (Math.random() - 0.5) * 30, ay + 10 + Math.random() * 18, a.z + (Math.random() - 0.5) * 30], [0.35, 0.45, 0.35]);
    World.pois.push({ kind: 'act', x: a.x + 7.5, z: a.z, r: 3, label: 'ลอยกระทงภูผา', icon: '🪷', act: () => this.festToday() === 'loy' ? { icon: '🪷', label: count('krathong') ? 'ลอยกระทงขอพร' : 'ซื้อกระทง (50 ฿) แล้วลอย', fn: () => this.loy() } : null });
    this.festShow();
  },
  festShow() { const f = this.festToday(); this.fs.visible = f === 'songkran'; this.fl.visible = f === 'loy'; if (f && !this.toldFest) { this.toldFest = S.day; setTimeout(() => UI.toast(f === 'songkran' ? 'วันนี้มีสงกรานต์ที่ถนนเมืองทุ่งทอง! ไปเล่นน้ำกัน' : 'คืนนี้มีลอยกระทงที่สนามภูผาใหม่', f === 'songkran' ? '💦' : '🪷'), 2500); } },
  songkran() {
    if (S.skDay === S.day) { UI.toast('เล่นน้ำจนเปียกโชกแล้ว พักก่อนนะ', '💦'); return; } S.skDay = S.day;
    if (!useEnergy(5)) return; const p = G.player.pos;
    for (let k = 0; k < 60; k++) FX.spawn(p.x + (Math.random() - 0.5) * 4, 1.5, p.z + (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, 2 + Math.random() * 2, (Math.random() - 0.5) * 4, 1, WATER_C, 9);
    S.mood = Math.min(100, (S.mood || 50) + 20); for (const n of TOWN4_NAMES.thong) Friends.add(n, 0.2); playAct('water', 1); Sfx.water();
    UI.toast('สาดน้ำกับชาวทุ่งทองสนุกมาก! อารมณ์ +20 ชาวเมืองสนิทขึ้น', '💦');
  },
  loy() {
    if (!count('krathong')) { if (S.money < 50) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(50), '💸'); return; } S.money -= 50; addItem('krathong'); }
    if (S.loyDay === S.day) { UI.toast('ลอยไปแล้วปีนี้... เอ๊ย วันนี้', '🪷'); return; }
    takeItem('krathong'); S.loyDay = S.day; S.mood = Math.min(100, (S.mood || 50) + 15); (S.buff = S.buff || {}).luck = S.day + 1;
    const a = Towns4.arena; if (Fest.krathong) Fest.krathong(a.x + 4, a.z, World.groundY(a.x, a.z) + 0.2, true);
    UI.toast('ลอยกระทงขอพร ขอให้ผลผลิตพรุ่งนี้งาม อารมณ์ +15', '🪷'); Life2.note('ลอยกระทงที่ภูผาใหม่ 🪷');
  },
  // ===== 17/18. settings: phone battery mode and a benchmark =====
  menuHTML() {
    return `<h5>📱 มือถือ & ทดสอบเครื่อง</h5>
      <button class="btn ghost" data-a="mobile">${S.mobile ? '✅' : '⬜'} โหมดมือถือประหยัดแบต (ความคมชัดต่ำ ปิดเงา จำกัด 30 FPS)</button>
      <button class="btn ghost" data-a="bench">⏱️ ทดสอบความแรงเครื่อง 8 วินาที (แนะนำระดับกราฟิก)</button>`;
  },
  applyMobile() { G.fpsCap = S.mobile ? 30 : 0; if (S.mobile) { Perf.setPr(Math.min(G.pr, 1)); if (G.shadow) Perf.setShadow(false); G.view = Math.min(G.view, 0.6); Gfx.drop(); } },
  bench() { UI.close(); this.b = { t: 0, n: 0, yaw: G.cam.yaw, auto: Perf.auto, cap: G.fpsCap }; Perf.auto = false; G.fpsCap = 0; UI.toast('กำลังทดสอบ... อย่าเพิ่งกดอะไร', '⏱️'); },
  benchUpdate(dt) {
    const b = this.b; if (!b) return; b.t += dt; b.n++; G.cam.yaw += dt * 0.8; G.cam.lastDrag = performance.now();
    if (b.t < 8) return;
    this.b = null; Perf.auto = b.auto; G.fpsCap = b.cap; const fps = b.n / b.t, cur = G.Q.lvl;
    const order = ['low', 'med', 'high', 'ultra'], i = order.indexOf(cur), rec = fps >= 75 && i < 3 ? order[i + 1] : fps < 40 && i > 0 ? order[i - 1] : cur, TH = { low: 'ต่ำ', med: 'กลาง', high: 'สูง', ultra: 'อัลตร้า' };
    UI.open('ผลทดสอบความแรงเครื่อง', null, () => `<p class="lead">⏱️ เฉลี่ย <b>${Math.round(fps)} FPS</b> ที่กราฟิกระดับ${TH[cur]} · ความคมชัด ${Math.round(G.pr * 100)}% · ${G.renderer.info.render.calls} draw calls · ${U.fmt(G.renderer.info.render.triangles)} สามเหลี่ยม</p>
      <p class="lead">${rec === cur ? `✅ ระดับ${TH[cur]}เหมาะกับเครื่องนี้แล้ว` : `แนะนำเปลี่ยนเป็นระดับ <b>${TH[rec]}</b> ${order.indexOf(rec) > i ? '(เครื่องแรงพอ ภาพสวยขึ้นได้)' : '(จะลื่นขึ้น)'}`}</p>
      <div class="row">${rec !== cur ? `<button class="btn" data-a="benchset" data-v="${rec}">ใช้ระดับ${TH[rec]} แล้วโหลดใหม่</button>` : ''}<button class="btn ghost" data-a="close">ปิด</button></div>`);
  },
  // ===== 20/21. cloud saves, online friends and gifts =====
  cloudHTML() {
    if (!Net.on) return `<p class="empty">ยังไม่ได้เชื่อมเซิร์ฟเวอร์ — เปิดเกมผ่าน start-game.bat บนคอม (หรือ server-node) เพื่อเก็บเซฟไว้ในเครื่อง สำรองอัตโนมัติ และเล่นกับเพื่อน</p>`;
    if (!this.bk) { this.bk = []; Net.api('backups?id=' + Net.id()).then(r => { this.bk = r.list || []; if (Phone.app === 'cloud') UI.renderBody(); }).catch(() => {}); }
    return `<p class="lead">☁️ เซฟอยู่บนเซิร์ฟเวอร์ (โฟลเดอร์ saves ในคอมที่เปิดเซิร์ฟเวอร์) บันทึกอัตโนมัติทุก 25 วินาที และสำรองย้อนหลัง 5 ชุด (ห่างกันอย่างน้อย 10 นาที)</p>
      <div class="row"><button class="btn" data-a="cloudsave">บันทึกขึ้นเซิร์ฟเวอร์ตอนนี้</button></div>
      <h5>จุดสำรองย้อนหลัง</h5>${this.bk.length ? `<ul class="lead">${this.bk.map(b => `<li>ชุดที่ ${b.n} · ${new Date(b.t * 1000).toLocaleString('th-TH')} <button class="btn ghost" data-a="cloudload" data-v="${b.n}">${this.ask === b.n ? 'กดอีกครั้งเพื่อยืนยัน' : 'ย้อนกลับไปชุดนี้'}</button></li>`).join('')}</ul>` : '<p class="dim">ยังไม่มีจุดสำรอง (จะเริ่มสำรองหลังเล่นไปสักพัก)</p>'}`;
  },
  async cloudLoad(n) {
    if (this.ask !== +n) { this.ask = +n; return; }
    try { const r = await Net.api(`backup?id=${Net.id()}&n=${n}`); if (!r.save) throw 0; await Net.api('save', { id: Net.id(), save: r.save }); safeSet(saveKey(), JSON.stringify(r.save)); UI.toast('กู้เซฟแล้ว กำลังโหลดเกมใหม่...', '☁️'); setTimeout(() => location.reload(), 900); } catch (e) { UI.toast('กู้เซฟไม่สำเร็จ', '⚠️'); }
  },
  friendsHTML() {
    if (!Net.on) return `<p class="empty">ต้องเล่นผ่านเซิร์ฟเวอร์ก่อน (start-game.bat) เพื่อนในวงแลน/อินเทอร์เน็ตเดียวกันจะเห็นกัน</p>`;
    if (!this.pl || performance.now() - this.plT > 15000) { this.plT = performance.now(); Net.api('players').then(r => { this.pl = (r.players || []).filter(p => p.id !== Net.id()); if (Phone.app === 'friends') UI.renderBody(); }).catch(() => {}); }
    const f = this.farm, gifts = Object.keys(S.inv).filter(id => ITEMS[id] && S.inv[id] > 0 && ['crop', 'product', 'dish', 'fish', 'artisan'].includes(ITEMS[id].cat)).slice(0, 8);
    return `<p class="lead">👥 ผู้เล่นบนเซิร์ฟเวอร์นี้ (ส่งของขวัญ ดูฟาร์ม หรือวาร์ปไปหาเพื่อนที่ออนไลน์)</p>${(this.pl || []).length ? `<div class="grid">${this.pl.map(p => `<div class="card"><div class="ci">${p.on ? '🟢' : '⚪'}</div><div class="cb"><h4>${esc(p.name || 'ชาวไร่')}</h4><p class="dim">Lv.${p.lvl || 1} ${p.on ? '· ออนไลน์' : ''}</p><div class="row"><button class="btn ghost" data-a="frfarm" data-v="${esc(p.id)}">ดูฟาร์ม</button>${p.on && Net.others.has(p.id) ? `<button class="btn ghost" data-a="frwarp" data-v="${esc(p.id)}">ไปหา</button>` : ''}${gifts.length ? `<button class="btn ghost" data-a="frgift" data-v="${esc(p.id)}">ส่งของขวัญ ${ITEMS[gifts[0]].i}</button>` : ''}</div></div></div>`).join('')}</div>` : '<p class="dim">ยังไม่มีผู้เล่นอื่น</p>'}
      ${f ? `<h5>🏡 ${esc(f.farm || 'ฟาร์ม')} ของ ${esc(f.name || 'ชาวไร่')}</h5><p class="lead">วันที่ ${f.day} · Lv.${f.lvl} · บ้านระดับ ${f.house} · บ้านหลังที่สอง ${f.homes} · โซลาร์ ${f.solar} แผง · คอม ${f.pcs} เครื่อง · รายได้รวม ${baht(f.earned)}</p><p class="dim">ปลูก: ${f.crops.map(c => (CROPS[c] || {}).i || '🌱').join('')} · สัตว์: ${f.animals.map(a => (ANIMALS[a] || {}).i || '🐾').join('')} · รถ: ${f.cars.map(c => (CARS[c] || {}).i || '🚗').join('')} · สัตว์เลี้ยง: ${f.pets.map(p => (PETS[p] || {}).i || '🐾').join('')}</p>` : ''}`;
  },
  friendFarm(id) { Net.api('farm?id=' + encodeURIComponent(id)).then(r => { const f = r.farm; this.farm = f && Object.assign({}, f, Object.fromEntries(['day', 'lvl', 'house', 'homes', 'solar', 'pcs'].map(k => [k, Number(f[k]) || 0]))); UI.renderBody(); }).catch(() => {}); },
  warp(id) { const o = Net.others.get(id); if (!o || o.inside) { UI.toast('เพื่อนอยู่ในบ้าน รอให้ออกมาก่อน', '👥'); return; } Phone.app = null; UI.close(); fade(() => { leaveIndoors(); if (G.away) Town2.leaveAway(true); G.player.pos.set(o.x + 2, World.groundY(o.x + 2, o.z), o.z); snapCam(); UI.toast('วาร์ปมาหาเพื่อนแล้ว!', '👥'); }); },
  gift(id) {
    const g = Object.keys(S.inv).filter(k => ITEMS[k] && S.inv[k] > 0 && ['crop', 'product', 'dish', 'fish', 'artisan'].includes(ITEMS[k].cat))[0]; if (!g) return;
    // take the item first (one gift in flight at a time) and give it back if the server refuses
    if (this.sending || id.replace(/_s\d+$/, '') === Net.id().replace(/_s\d+$/, '') || !takeItem(g)) return; this.sending = true;
    Net.api('mail', { id: Net.id(), to: id, name: S.name || 'ชาวไร่', item: g, n: 1, msg: 'ของฝากจากไร่' + (S.farm || '') }).finally(() => { this.sending = false; }).catch(() => { addItem(g); UI.toast('ส่งไม่สำเร็จ คืนของแล้ว', '⚠️'); }).then(r => { if (!r) return; if (!r.ok) addItem(g); if (r.ok) { UI.toast(`ส่ง${ITEMS[g].n}ให้เพื่อนแล้ว`, '🎁'); } else UI.toast('กล่องของเพื่อนเต็ม', '📪'); }).catch(() => UI.toast('ส่งไม่สำเร็จ', '⚠️'));
  },
  pullMail() { if (!Net.on || !G.started) return; Net.api('mail?id=' + Net.id()).then(r => { for (const m of r.mail || []) { if (ITEMS[m.item]) addItem(m.item, m.n || 1); Phone.msg(m.name || 'เพื่อน', `ส่ง${ITEMS[m.item] ? ITEMS[m.item].n + ' ×' + (m.n || 1) : 'ของขวัญ'}มาให้: "${m.msg || ''}"`); UI.toast(`${m.name || 'เพื่อน'}ส่งของขวัญมาให้!`, '🎁'); } }).catch(() => {}); },
  // ===== 22. collection book =====
  colScan() {
    const c = S.col = S.col || { cars: {}, pets: {}, parts: {}, fut: {} };
    for (const x of S.cars) c.cars[x.type] = 1; for (const p of S.pets || []) c.pets[p.type] = 1;
    for (const k in S.inv) if (k.startsWith('pc_') && S.inv[k] > 0) c.parts[k.slice(3)] = 1; for (const p of S.pcs || []) for (const k of p.parts) c.parts[k] = 1;
    for (const k in S.fut || {}) c.fut[k] = 1;
  },
  collectHTML() {
    this.colScan(); const c = S.col, sec = (t, all, got, ic) => { const n = all.filter(k => got[k]).length; return `<h5>${t} ${n}/${all.length}</h5><div class="prog"><i style="width:${n / all.length * 100}%"></i></div><p class="lead" style="font-size:22px;letter-spacing:4px">${all.map(k => got[k] ? ic(k) : '❔').join('')}</p>`; };
    return sec('🚗 รถที่เคยเป็นเจ้าของ', Object.keys(CARS), c.cars, k => CARS[k].i) + sec('🐾 สัตว์เลี้ยง', Object.keys(PETS), c.pets, k => PETS[k].i) + sec('🖥️ ชิ้นส่วนคอมพิวเตอร์', Object.keys(PC_PARTS), c.parts, k => PC_PARTS[k].i) + sec('🏠 เทคโนโลยีในบ้าน', Object.keys(FUT), c.fut, k => FUT[k].i) + sec('🧺 ผลผลิตและของในสมุด', Object.keys(ITEMS).filter(k => ['crop', 'fish', 'product', 'mineral'].includes(ITEMS[k].cat) && !ITEMS[k].base), S.found, k => ITEMS[k].i);
  },
  // ===== loop hooks =====
  hour() { if (G.driving && !G.driving.school && HEAVY.includes(G.driving.d.type) && !S.lic2 && Math.random() < 0.2) this.ticket('ขับรถบรรทุกโดยไม่มีใบขับขี่ประเภท 2', 1000); },
  day() { this.licDay(); this.leagueEnd(); this.shopDay(); this.wkShow(); this.festShow(); this.colScan(); this.toldFest = 0; },
  update(dt) {
    this.updateLights(dt); this.benchUpdate(dt); if (typeof Fut !== 'undefined') Fut.update(dt);
    const a = this.fl && this.fl.visible; if (a) this.fl.children.forEach((k, i) => { if (i > 0 && i <= 12) k.position.y += Math.sin(G.t * 2 + i) * 0.002; else if (i > 12) k.position.y += dt * 0.25; if (k.position.y > 60) k.position.y = 10; });
  },
};
Object.assign(UI.H, {
  hwgo: d => Plan.hwGo(d.v, +d.m), breed: d => Plan.breed(d.i, d.v), league: d => Plan.leagueRace(d.i),
  wksell: d => Plan.wkSell(d.v, d.q), wkshop: () => { UI.close(); UI.shop('wkmarket'); },
  msrent: () => { const m = Plan.ms(); if (S.money < 3000) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(3000), '💸'); return; } S.money -= 3000; Bank2.log('ค่าเช่าร้าน', -3000); m.until = Math.max(m.until, S.day) + 7; UI.toast(`เช่าร้านถึง${RD(m.until)} นำของมาวางขายได้เลย`, '🏪'); },
  msput: d => { const m = Plan.ms(), n = d.q === 'all' ? count(d.v) : Math.min(5, count(d.v)); if (!n) return; takeItem(d.v, n); m.stock[d.v] = (m.stock[d.v] || 0) + n; },
  msback: d => { const m = Plan.ms(), n = m.stock[d.v] || 0; if (n) addItem(d.v, n); delete m.stock[d.v]; },
  msmark: d => { Plan.ms().markup = +d.v; }, msstaff: () => { const m = Plan.ms(); m.staff = m.staff ? 0 : 1; },
  tqdone: d => Plan.qDone(d.v),
  mobile: () => { S.mobile = !S.mobile; Plan.applyMobile(); if (!S.mobile) UI.toast('ปิดโหมดประหยัดแล้ว ระบบปรับกราฟิกอัตโนมัติจะค่อย ๆ เพิ่มคุณภาพคืน', '📱'); },
  bench: () => Plan.bench(), benchset: d => { safeSet(Q_KEY, d.v); location.reload(); },
  cloudsave: () => { Net.saveRemote(true); UI.toast('บันทึกขึ้นเซิร์ฟเวอร์แล้ว', '☁️'); Plan.bk = null; },
  cloudload: d => Plan.cloudLoad(d.v),
  frfarm: d => Plan.friendFarm(d.v), frwarp: d => Plan.warp(d.v), frgift: d => Plan.gift(d.v),
  dsrenew: () => Plan.renew(), dstruck: () => DriveSchool.startDrive('deliveryflat'),
});
