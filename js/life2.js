'use strict';
// ---------- Set B: hunger & thirst, illness & clinic, utility bills, part-time jobs, mood, hobbies, birthdays, diary ----------
const DRINKS = ['food_coffee', 'food_thaitea', 'food_coconut', 'food_energy', 'food_ice', 'food_bingsu', 'juice', 'milk'];
const CLINIC = { x: -19, z: -200, rot: Math.PI / 2 }; // on the main street's west frontage line between the farm shop and the carpenter (was hidden behind the plaza at x=-45)
Object.assign(GOODS, {
  medicine: { n: 'ยาแก้ไข้', i: '💊', price: 90, desc: 'รักษาอาการป่วยเล็กน้อย', use: () => { if (!S.sick) return 'ยังไม่ได้ป่วย'; if (S.sick === 2) return 'อาการหนักเกินกว่ายาธรรมดา ต้องไปโรงพยาบาล'; S.sick = 0; UI.toast('หายป่วยแล้ว!', '💊'); } },
  water: { n: 'น้ำดื่มขวด', i: '💧', price: 10, desc: 'ดับกระหาย +40', use: () => { S.thirst = Math.min(100, (S.thirst ?? 80) + 40); } },
  easel: { n: 'ขาตั้งวาดรูปและสี', i: '🎨', price: 1800, desc: 'งานอดิเรกวาดรูป: วาดภาพ 1 ชม. ได้ภาพไปขาย ฝีมือดีขึ้นเรื่อย ๆ', use: () => { Life2.paint(); return 'ok'; } },
  guitar: { n: 'กีตาร์โปร่ง', i: '🎸', price: 2400, desc: 'เล่นเพลงคลายเครียด หรือไปเปิดหมวกที่ลานน้ำพุ', use: () => { Life2.play(); return 'ok'; } },
});
for (const id of ['medicine', 'water', 'easel', 'guitar']) { ITEMS[id] = { n: GOODS[id].n, i: GOODS[id].i, cat: 'tool' }; TOOLS[id] = { n: GOODS[id].n, i: GOODS[id].i, price: GOODS[id].price, desc: GOODS[id].desc }; }
ITEMS.art = { n: 'ภาพวาดฝีมือคุณ', i: '🖼️', sell: 150, cat: 'artisan' };
SHOPS.mall.tabs.find(t => t.n.includes('สุขภาพ')).items.push('tool:medicine', 'tool:water');
SHOPS.mall.tabs.push({ n: '🎨 งานอดิเรก', items: ['tool:easel', 'tool:guitar'] });
SHOPS.mart.tabs[0].items.push('tool:water');
const PT_JOBS = [
  { k: 'deliver', n: 'ส่งพัสดุในหมู่บ้าน', i: '📦', pay: 180, desc: 'รับพัสดุที่สุขใจมาร์ท ไปส่งบ้านในหมู่บ้าน ยิ่งเร็วยิ่งได้ทิป' },
  { k: 'taxi', n: 'ขับแท็กซี่รับส่งคน', i: '🚕', pay: 450, desc: 'ขับรถของคุณรับผู้โดยสารที่ลานน้ำพุ ไปส่งตลาดริมทะเล (ต้องมีรถ)' },
  { k: 'tutor', n: 'สอนพิเศษเด็กในหมู่บ้าน', i: '📚', pay: 320, desc: 'สอน 2 ชั่วโมง (ต้อง Lv.3 ขึ้นไป)' },
  { k: 'online', n: 'งานออนไลน์จากบ้าน (ต้องมีโน้ตบุ๊ก)', i: '💻', pay: 500, desc: 'รับงานออกแบบ/พิมพ์งานผ่านเน็ต 2 ชั่วโมง' },
  { k: 'fix', n: 'ช่วยช่างหนุ่มซ่อมรถ', i: '🔧', pay: 260, desc: 'ช่วยงานที่อู่ 2 ชั่วโมง' },
];

const Life2 = {
  init() {
    if (S.artVal) ITEMS.art.sell = S.artVal;
    S.hunger = S.hunger ?? 80; S.thirst = S.thirst ?? 80; S.mood = S.mood ?? 70; S.diary = S.diary || []; S.hob = S.hob || { paint: 0, music: 0 };
    if (!S.bday) S.bday = 1 + (Math.abs(strHash(S.name || 'x')) % 21);
    const hud = document.createElement('div'); hud.className = 'meta'; hud.id = 'needs'; document.getElementById('stats').insertBefore(hud, document.getElementById('loc')); this.hudEl = hud;
    // clinic in the village
    const o = { w: 13, d: 10, h: 5.4, flat: true, wall: 0xffffff, roof: 0xe3f2fd, sign: 'โรงพยาบาลสุขใจ', signStyle: { bg: '#1565c0', fg: '#fff' }, glassFront: true, winS: [-2, 2], ww: 1.4, wh: 1.2 };
    const b = World.building(o); b.position.set(CLINIC.x, World.groundY(CLINIC.x, CLINIC.z), CLINIC.z); b.rotation.y = CLINIC.rot; World.outdoor.add(b);
    const f = new THREE.Group(); f.position.copy(b.position); f.rotation.y = CLINIC.rot; World.outdoor.add(f);
    const red = new THREE.MeshBasicMaterial({ color: 0xe53935 }); U.mk(f, GEO.box, red, [-4.6, 4.2, o.d / 2 + 0.08], [1.1, 0.34, 0.04]); U.mk(f, GEO.box, red, [-4.6, 4.2, o.d / 2 + 0.08], [0.34, 1.1, 0.04]);
    Col.box(CLINIC.x, CLINIC.z, o.w / 2 + 0.3, o.d / 2 + 0.3, CLINIC.rot, 'bld'); World.clearNear(CLINIC.x, CLINIC.z, 10, true);
    const door = l2w(CLINIC.x, CLINIC.z, CLINIC.rot, 0, o.d / 2 + 1.8);
    World.pois.push({ kind: 'act', x: door.x, z: door.z, r: 2.6, label: 'คลินิก', icon: '🏥', map: true, act: () => ({ icon: '🏥', label: 'พบแพทย์ / ตรวจสุขภาพ', fn: () => this.clinicUI() }) });
    const sp = l2w(CLINIC.x, CLINIC.z, CLINIC.rot, 2, o.d / 2 + 0.8), doc = Models.human({ avatar: 'Olivia' }); doc.position.set(sp.x, World.groundY(sp.x, sp.z), sp.z); doc.rotation.y = CLINIC.rot; World.dyn.add(doc);
    G.npcs.push({ obj: doc, name: 'หมอนิด', rot: CLINIC.rot, speed: 0, timer: 0, st: 'idle', wave: 0, fixed: true, x: sp.x, z: sp.z, tx: sp.x, tz: sp.z, hx: sp.x, hz: sp.z, hrot: CLINIC.rot, staff: true });
    (People._p || (People._p = {}))['หมอนิด'] = { fem: true, age: 34, trait: 'kind', job: 'แพทย์ประจำคลินิก', single: false };
    // job board and busking spot at the plaza
    World.pois.push({ kind: 'act', x: -16, z: -252, r: 2.2, label: 'กระดานหางานพิเศษ', icon: '💼', map: true, act: () => ({ icon: '💼', label: 'ดูงานพิเศษวันนี้', fn: () => this.jobsUI() }) });
    { const g = new THREE.Group(); g.position.set(-14.5, 0, -252); g.rotation.y = Math.PI / 2; for (const s of [-1, 1]) U.mk(g, GEO.cylLo, M.darkwood, [s * 0.9, 1, 0], [0.06, 2, 0.06]); U.mk(g, GEO.box, mc(0x2e7d32), [0, 1.5, 0], [2, 1, 0.08]); const sm = new THREE.MeshStandardMaterial({ map: U.signTex('💼 หางานพิเศษ', { w: 384, h: 128, bg: '#2e7d32' }) }); U.mk(g, new THREE.PlaneGeometry(1.8, 0.6), sm, [0, 1.6, 0.05]); World.outdoor.add(g); Col.box(-14.5, -252, 0.1, 1, Math.PI / 2); }
    World.pois.push({ kind: 'act', x: -22, z: -265, r: 2, label: 'จุดเปิดหมวกเล่นดนตรี', icon: '🎸', act: () => ({ icon: '🎸', label: count('guitar') ? 'เล่นดนตรีเปิดหมวก 1 ชม.' : 'ต้องมีกีตาร์ (สุขใจพลาซ่า)', fn: () => count('guitar') && this.busk() }) });
    this.hud();
  },
  note(t) { S.diary = S.diary || []; S.diary.unshift({ d: S.day, t }); S.diary.length = Math.min(S.diary.length, 80); },
  // hunger / thirst / mood drain per game hour
  tick(h) {
    if (G.inside && G.sleeping) return;
    const sl = G.simulating ? 0.45 : 1; S.hunger = Math.max(0, S.hunger - h * 1.6 * sl); S.thirst = Math.max(0, S.thirst - h * 2.4 * sl); // half as hungry as before
    let dm = 0; if (S.hunger < 20) dm -= 3; if (S.thirst < 20) dm -= 3; if (S.sick) dm -= 2; if (S.hunger > 60 && S.thirst > 60) dm += 0.6;
    if (dm < 0 && Gadgets.has('earbuds')) dm *= 0.5;
    S.mood = U.clamp(S.mood + dm * h, 0, 100);
    if (!G.simulating) {
      this.warnT = (this.warnT || 0) - h;
      if (this.warnT <= 0 && (S.hunger < 15 || S.thirst < 15)) { this.warnT = 2; UI.toast(S.hunger < 15 ? 'หิวมาก! กินอะไรหน่อย ทำงานจะเหนื่อยขึ้น' : 'คอแห้งมาก! ดื่มน้ำที่บ่อหรือซื้อน้ำดื่ม', S.hunger < 15 ? '🍽️' : '💧'); }
      if (!S.sick && (S.hunger < 5 || S.thirst < 5) && Math.random() < h * 0.015 * (S.furn.airpurifier ? 0.5 : 1)) this.getSick('อดอาหารและน้ำจนป่วย');
      if (!S.sick && !(S.sickFree > S.day) && !(S.vax > S.day) && G.wx.rain > 0.5 && !G.inside && !G.driving && Math.random() < h * 0.0006 * (S.furn.airpurifier ? 0.5 : 1)) this.getSick('ตากฝนจนเป็นไข้หวัด');
    }
  },
  costMult() { return (Gadgets.has('watch') ? 0.95 : 1) * (S.hunger < 15 ? 1.4 : 1) * (S.thirst < 15 ? 1.4 : 1) * (S.sick ? 1.3 : 1) * (S.mood < 25 ? 1.2 : 1); },
  xpMult() { return S.mood > 75 ? 1.1 : 1; },
  ate(id) {
    const it = ITEMS[id]; S.hunger = Math.min(100, S.hunger + (it.en || 10) * 1.3);
    if (DRINKS.includes(id)) S.thirst = Math.min(100, S.thirst + 45);
    S.mood = Math.min(100, S.mood + (id.startsWith('dish_') || id.startsWith('food_') ? 4 : 1));
  },
  drink() { S.thirst = Math.min(100, S.thirst + 50); Sfx.water(); UI.toast('ดื่มน้ำเย็น ๆ สดชื่น!', '💧'); },
  getSick(why) { S.sick = 1; S.sickFree = S.day + 10; Phone.msg('สุขภาพ', `${why} พลังงานใช้มากขึ้น ไปคลินิกในหมู่บ้านหรือกินยาแก้ไข้นะ`); this.note('ไม่สบาย: ' + why); },
  clinicUI() {
    UI.open('โรงพยาบาลสุขใจ', null, () => `<p class="lead">หมอนิด: “${S.sick ? 'มีไข้นิดหน่อยนะคะ รับยาแล้วพักผ่อนเยอะ ๆ' : 'สุขภาพแข็งแรงดีค่ะ ดื่มน้ำให้พอนะคะ'}”</p>
      <p class="lead">ความหิว ${Math.round(S.hunger)}% · ความกระหาย ${Math.round(S.thirst)}% · อารมณ์ ${Math.round(S.mood)}% ${S.sick ? '· 🤒 กำลังป่วย' : ''}</p>
      <div class="grid"><div class="card"><div class="ci">🩺</div><div class="cb"><h4>รักษาอาการป่วย${S.sick === 2 ? ' (อาการหนัก)' : ''}</h4><p class="dim">${S.sick === 2 ? '1,500' : '300'} ฿ หายทันที พลังงาน +30</p><div class="row"><button class="btn" data-a="cure" ${S.sick && S.money >= (S.sick === 2 ? 1500 : 300) ? '' : 'disabled'}>รักษา</button></div></div></div>
      <div class="card"><div class="ci">💉</div><div class="cb"><h4>ฉีดวัคซีนไข้หวัด</h4><p class="dim">500 ฿ ไม่ป่วยจากการตากฝน 14 วัน</p><div class="row"><button class="btn" data-a="vaccine" ${S.money >= 500 && !(S.vax > S.day) ? '' : 'disabled'}>${S.vax > S.day ? 'ฉีดแล้ว' : 'ฉีดวัคซีน'}</button></div></div></div>
      <div class="card"><div class="ci">🧘</div><div class="cb"><h4>นวดแผนไทยคลายเครียด</h4><p class="dim">250 ฿ อารมณ์ +30 พลังงาน +20</p><div class="row"><button class="btn" data-a="massage" ${S.money >= 250 ? '' : 'disabled'}>นวด 1 ชม.</button></div></div></div></div>`);
  },
  // ----- utility bills every 7 days -----
  bill() {
    const ap = ['aircon', 'washer', 'console', 'tv', 'fan', 'aquarium'].filter(k => S.furn[k]).length;
    const elec = Math.round((120 + ap * 60 + (S.ac ? 210 : 0) + S.up.house * 40) * (S.furn.solar ? 0.4 : 1)), water = 60 + S.animals.length * 8 + (S.f2 ? 30 : 0);
    const old = S.billDue; S.billDue = { elec: elec + (old ? old.elec : 0), water: water + (old ? old.water : 0), day: S.day + 3 }; Phone.msg('การไฟฟ้า & การประปา', `บิลสัปดาห์นี้: ค่าไฟ ${baht(elec)} ค่าน้ำ ${baht(water)} ชำระภายใน${RD(S.billDue.day)} ผ่านแอปธนาคาร`);
  },
  payBill() { const b = S.billDue; if (!b) return; const t = b.elec + b.water; if (S.money < t) { UI.toast('เงินไม่พอจ่ายบิล', '💸'); return; } S.money -= t; Bank2.log('ค่าน้ำค่าไฟ', -t); S.billDue = null; S.powerOff = 0; UI.toast('ชำระค่าน้ำค่าไฟแล้ว', '🧾'); },
  billHTML() { const b = S.billDue; return `<h5>🧾 ค่าน้ำค่าไฟ</h5>${b ? `<div class="card"><div class="ci">⚡</div><div class="cb"><h4>ค้างชำระ ${baht(b.elec + b.water)}</h4><p class="dim">ไฟ ${baht(b.elec)} · น้ำ ${baht(b.water)} · ครบกำหนด${RD(b.day)}${S.powerOff ? ' · ⚠️ ถูกตัดไฟแล้ว แอร์ ทีวี เกม ใช้ไม่ได้' : ''}</p><div class="row"><button class="btn" data-a="paybill">ชำระเลย</button></div></div></div>` : '<p class="lead">ไม่มีบิลค้างชำระ (บิลออกทุก 7 วัน)</p>'}`; },
  // ----- part-time jobs -----
  jobsUI() {
    UI.open('งานพิเศษวันนี้', null, () => this.job ? `<p class="lead">กำลังทำงาน: ${this.job.n} — ${this.job.hint}</p><div class="row"><button class="btn ghost" data-a="jobquit">ยกเลิกงาน</button></div>` : `<p class="lead">ทำได้วันละ 2 งาน (วันนี้ทำไปแล้ว ${S.jobN === S.day ? S.jobC : 0})</p><div class="grid">${PT_JOBS.map(j => `<div class="card"><div class="ci">${j.i}</div><div class="cb"><h4>${j.n}</h4><p class="dim">${j.desc} · ประมาณ ${baht(j.pay)}</p><div class="row"><button class="btn" data-a="jobgo" data-k="${j.k}" ${(S.jobN === S.day && S.jobC >= 2) ? 'disabled' : ''}>รับงาน</button></div></div></div>`).join('')}</div>`);
  },
  startJob(k) {
    const J = PT_JOBS.find(j => j.k === k); if (S.jobN !== S.day) { S.jobN = S.day; S.jobC = 0; } if (S.jobC >= 2) return;
    if (k === 'tutor' && S.lvl < 3) { UI.toast('ต้อง Lv.3 ขึ้นไป', '📚'); return; }
    if (k === 'taxi' && !G.cars.length) { UI.toast('ต้องมีรถก่อน', '🚕'); return; }
    UI.close();
    if (k === 'online' && !Gadgets.has('laptop')) { UI.toast('ต้องมีโน้ตบุ๊กก่อน (ร้านไอที)', '💻'); return; }
    if (k === 'tutor' || k === 'fix' || k === 'online') { S.jobC++; fade(() => { tick(120); useEnergy(10); earn(J.pay); Bank2.income('งานพิเศษ', J.pay); Prog.add(15); S.mood = Math.max(0, S.mood - 5); UI.toast(`ทำงาน${J.n}เสร็จ ได้ ${baht(J.pay)}`, J.i); }); return; }
    const homes = (World.homes || []).filter(h => h.zone === 'village'), dest = k === 'deliver' ? U.pick(homes) : { x: 330, z: -372 };
    const start = k === 'deliver' ? { x: 9.8, z: -66 } : { x: -16, z: -262 };
    this.job = { k, n: J.n, pay: J.pay, step: 0, start, dest, t: 0, hint: k === 'deliver' ? 'ไปรับพัสดุที่หน้าสุขใจมาร์ท' : 'ขับรถไปรับผู้โดยสารที่ลานน้ำพุ' };
    S.jobC++; this.marker();
    UI.toast(this.job.hint, J.i);
  },
  marker() {
    if (!this.mk) { this.mk = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.4, 4), new THREE.MeshBasicMaterial({ color: 0xffd166, toneMapped: false })); this.mk.rotation.x = Math.PI; G.scene.add(this.mk); }
    const p = this.job ? (this.job.step === 0 ? this.job.start : this.job.dest) : null; this.mk.visible = !!p; if (p) this.mk.position.set(p.x, World.groundY(p.x, p.z) + 3, p.z);
  },
  updateJob(dt) {
    const j = this.job; if (!j) return;
    j.t += dt; this.mk.position.y += Math.sin(G.t * 4) * 0.01; this.mk.rotation.y += dt * 2;
    const me = G.driving ? G.driving.d : G.player.pos, tgt = j.step === 0 ? j.start : j.dest, d = Math.hypot(me.x - tgt.x, me.z - tgt.z);
    if (j.k === 'taxi' && !G.driving) return;
    if (!Contests.race && !Contests.derby) { Contests.hud.hidden = false; Contests.hud.textContent = `${PT_JOBS.find(x => x.k === j.k).i} ${j.hint} · ${Math.round(d)} ม.`; }
    if (d < (G.driving ? 6 : 2.5)) {
      if (j.step === 0) { j.step = 1; j.t = 0; j.hint = j.k === 'deliver' ? 'นำพัสดุไปส่งบ้านที่มีลูกศร' : 'ไปส่งผู้โดยสารที่ตลาดริมทะเล'; Sfx.pop && Sfx.pop(); UI.toast(j.hint, '📍'); this.marker(); }
      else { const bonus = Math.max(0, Math.round((j.k === 'deliver' ? 90 - j.t : 120 - j.t) * 2)), pay = j.pay + bonus; earn(pay); Bank2.income('งานพิเศษ', pay); Prog.add(15); UI.toast(`ส่งงานสำเร็จ! ได้ ${baht(pay)}${bonus ? ` (ทิปส่งไว ${baht(bonus)})` : ''}`, '💰'); this.endJob(); }
    }
  },
  endJob() { this.job = null; this.marker(); if (!Contests.race && !Contests.derby) Contests.hud.hidden = true; },
  // ----- hobbies -----
  paint() {
    if (S.paintDay === S.day && S.paintN >= 2) { UI.toast('วาดไปแล้ว 2 ภาพวันนี้ มือล้าแล้ว', '🎨'); return; }
    if (S.paintDay !== S.day) { S.paintDay = S.day; S.paintN = 0; } S.paintN++;
    UI.close(); fade(() => { tick(60); S.hob.paint = Math.min(20, S.hob.paint + 1); const v = 100 + S.hob.paint * 45 + ((Math.random() * 100) | 0); addItem('art'); S.artVal = v; ITEMS.art.sell = v; S.mood = Math.min(100, S.mood + 12); UI.toast(`วาดภาพเสร็จ! ฝีมือวาดรูป Lv.${S.hob.paint} ภาพนี้ขายได้ประมาณ ${baht(v)}`, '🎨'); });
  },
  play() { UI.close(); fade(() => { tick(30); S.hob.music = Math.min(20, S.hob.music + 1); S.mood = Math.min(100, S.mood + 15); UI.toast(`เล่นกีตาร์คลายเครียด อารมณ์ดีขึ้น! ฝีมือดนตรี Lv.${S.hob.music}`, '🎸'); }); },
  busk() {
    if (S.buskDay === S.day) { UI.toast('วันนี้เปิดหมวกไปแล้ว', '🎸'); return; }
    S.buskDay = S.day; fade(() => { tick(60); S.hob.music = Math.min(20, S.hob.music + 1); const tip = 40 + S.hob.music * 25 + ((Math.random() * 80) | 0); earn(tip); Bank2.income('เปิดหมวก', tip); S.mood = Math.min(100, S.mood + 10); UI.toast(`ชาวบ้านมาฟังเพลงเต็มเลย ได้ทิป ${baht(tip)}!`, '🎸'); });
  },
  // ----- birthdays -----
  bdayOf(name) { return 1 + (Math.abs(strHash(name + 'b')) % 21); },
  dayInYear() { return ((S.day - 1) % 21) + 1; },
  day() {
    const d = this.dayInYear();
    if (S.vax > S.day) {} else if (S.vax) S.vax = 0;
    if (S.day % 7 === 0) this.bill();
    if (S.billDue && S.day > S.billDue.day && !S.powerOff) { S.powerOff = 1; S.ac = false; Phone.msg('การไฟฟ้า', 'ค้างชำระเกินกำหนด ระงับการจ่ายไฟชั่วคราว ชำระแล้วไฟจะกลับมาทันที'); }
    const bd = G.npcs.filter(n => !n.staff && this.bdayOf(n.name) === d).slice(0, 2);
    for (const n of bd) Phone.msg('ปฏิทิน', `วันนี้วันเกิด${n.name}! ให้ของขวัญวันนี้ได้หัวใจ 3 เท่า`, true);
    this.bdays = bd.map(n => n.name);
    if (d === S.bday) { const gift = 300 + G.npcs.filter(n => Friends.get(n.name) >= 3).length * 100; earn(gift); S.mood = 100; this.note('วันเกิดของฉัน! ชาวบ้านจัดงานเลี้ยงให้ ได้ของขวัญ ' + baht(gift)); setTimeout(() => UI.toast(`สุขสันต์วันเกิด! ชาวบ้านให้ของขวัญรวม ${baht(gift)} 🎂`, '🎂'), 1600); }
  },
  diaryHTML() {
    return `<div class="row"><input id="diaryIn" maxlength="120" placeholder="เขียนบันทึกวันนี้..." style="flex:1"><button class="btn" data-a="diaryadd">บันทึก</button></div><div class="msgs">${(S.diary || []).map(e => `<div class="msg"><small>${RD(e.d)}</small><p>${esc(e.t)}</p></div>`).join('') || '<p class="empty">ยังไม่มีบันทึก</p>'}</div>`;
  },
  hud() {
    if (!this.hudEl || !S) return;
    const face = S.sick ? '🤒' : S.mood > 75 ? '😄' : S.mood > 45 ? '🙂' : S.mood > 25 ? '😐' : '😣';
    const c = v => v < 20 ? ' style="color:#ff8a7a"' : '';
    this.hudEl.innerHTML = `<span${c(S.hunger)}>🍗${Math.round(S.hunger)}</span><span${c(S.thirst)}>💧${Math.round(S.thirst)}</span><span>${face}${Math.round(S.mood)}</span>`;
  },
};
UI.H.cure = () => { const fee = S.sick === 2 ? 1500 : 300; if (S.money < fee) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(fee), '💸'); return; } S.money -= fee; S.sickDays = 0; S.sick = 0; S.energy = Math.min(maxEnergy(), S.energy + 30); UI.toast('หายป่วยแล้ว ขอบคุณคุณหมอ!', '🩺'); };
UI.H.vaccine = () => { if (S.money < 500) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(500), '💸'); return; } S.money -= 500; S.vax = S.day + 14; UI.toast('ฉีดวัคซีนแล้ว', '💉'); };
UI.H.massage = () => { if (S.money < 250) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(250), '💸'); return; } S.money -= 250; UI.close(); fade(() => { tick(60); S.mood = Math.min(100, S.mood + 30); S.energy = Math.min(maxEnergy(), S.energy + 20); UI.toast('นวดเสร็จ ตัวเบาสบาย!', '🧘'); }); };
UI.H.paybill = () => Life2.payBill();
UI.H.jobgo = d => Life2.startJob(d.k);
UI.H.jobquit = () => { Life2.endJob(); UI.close(); };
UI.H.diaryadd = () => { const el = $('diaryIn'); if (el && el.value.trim()) { Life2.note('✍️ ' + el.value.trim()); el.value = ''; } };
