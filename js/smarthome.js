'use strict';
// ---------- Smart home & AI assistant "น้องสุขใจ": 12 connected devices that really change how the day goes ----------
const SMART = {
  aispeaker: { n: 'ลำโพง AI "น้องสุขใจ"', i: '🔊', price: 3900, desc: 'ผู้ช่วย AI สั่งงานด้วยข้อความ: วางแผนปลูก สรุปฟาร์ม สรุปเงิน สั่งอาหาร ตั้งเตือน' },
  robotvac: { n: 'หุ่นยนต์ดูดฝุ่น', i: '🤖', price: 6900, desc: 'ทำความสะอาดทุกเช้า บ้านสะอาด คุยถูกใจได้หัวใจเพิ่ม 25% ทุกวัน' },
  smartfridge: { n: 'ตู้เย็นอัจฉริยะ', i: '🧊', price: 14900, desc: 'ดูของกินในกระเป๋า แนะนำเมนูที่ทำได้ทันที สั่งวัตถุดิบส่งถึงบ้าน' },
  massagechair: { n: 'เก้าอี้นวดไฟฟ้า', i: '💺', price: 18900, desc: 'นวด 30 นาที พลังงาน +25 อารมณ์ +10 วันละครั้ง' },
  smartmirror: { n: 'กระจกอัจฉริยะ', i: '🪞', price: 7900, desc: 'บอกอากาศ แนะนำการแต่งตัว เปิดหน้าแต่งตัวได้ทันที' },
  solar: { n: 'โซลาร์รูฟท็อป', i: '☀️', price: 45000, desc: 'ผลิตไฟเอง ค่าไฟลดลง 60%' },
  evcharger: { n: 'จุดชาร์จ/เติมพลังงานรถที่บ้าน', i: '🔌', price: 12000, desc: 'เติมน้ำมัน/ชาร์จรถที่โรงจอดในราคาครึ่งเดียว' },
  smartgarden: { n: 'ระบบรดน้ำอัจฉริยะ IoT', i: '💧', price: 16000, desc: 'เซนเซอร์ความชื้นรดน้ำแปลงที่แห้งให้เองตอน 6:00 และ 15:00' },
  doorbell: { n: 'กริ่งประตูกล้อง AI', i: '🔔', price: 3500, desc: 'แจ้งเตือนคนแปลกหน้า ขโมยมาน้อยลง 30%' },
  projector: { n: 'โปรเจกเตอร์โฮมเธียเตอร์', i: '📽️', price: 9900, desc: 'ดูหนังจอใหญ่ อารมณ์ +20 พาแฟนดูได้หัวใจเพิ่ม' },
  printer3d: { n: 'เครื่องพิมพ์ 3 มิติ', i: '🖨️', price: 8900, desc: 'พิมพ์ของเล่นสัตว์เลี้ยง ตุ๊กตาให้ลูก หรือของแต่งบ้าน' },
  airpurifier: { n: 'เครื่องฟอกอากาศ', i: '🌬️', price: 4500, desc: 'อากาศสะอาด โอกาสป่วยลดลงครึ่งหนึ่ง' },
};
for (const k in SMART) { FURN[k] = { n: SMART[k].n, i: SMART[k].i, price: SMART[k].price }; MOVABLE.push(k); }
const AI_HELP = 'ลองพิมพ์: "วันนี้ควรปลูกอะไร" "สรุปฟาร์ม" "สรุปเงิน" "อากาศ" "สั่งอาหาร" "เตือนให้รดน้ำ" "เปิดเพลง" "ปิดแอร์" "ทำอาหารอะไรได้บ้าง"';

const Smart = {
  initOutdoor() { const p = l2w(GARAGE.x, GARAGE.z, GARAGE.rot, 4.8, GARAGE.d / 2 - 1); World.pois.push({ kind: 'act', x: p.x, z: p.z, r: 2.4, label: 'จุดเติมพลังงานรถที่บ้าน', icon: '🔌', act: () => S.furn.evcharger ? { icon: '🔌', label: 'เติมพลังงานรถที่โรงจอด (ราคาครึ่งเดียว)', fn: () => { const c = G.driving || G.cars.find(o => Math.hypot(o.d.x - GARAGE.x, o.d.z - GARAGE.z) < 10); if (!c) { UI.toast('จอดรถที่โรงจอดก่อน', '🔌'); return; } const d = Town2.carState(c.d), cost = Math.ceil((100 - d.fuel) * 4); if (S.money < cost) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(cost), '💸'); return; } S.money -= cost; d.fuel = 100; UI.toast(`เติมเต็มแล้ว ${baht(cost)}`, '🔌'); } } : null }); },
  has(k) { return S.furn[k] && !S.decor.hide[k]; },
  // indoor placement, called from Home.place
  place(W, has, placeK, w, d) {
    const act = (icon, label, fn) => ({ kind: 'act', icon, label, act: () => ({ icon, label, fn }) });
    const box = (c, sx, sy, sz, y = 0) => { const g = new THREE.Group(); U.mk(g, GEO.box, mc(c, { roughness: 0.35 }), [0, y + sy / 2, 0], [sx, sy, sz]); return g; };
    if (has('aispeaker')) { const g = new THREE.Group(); U.mk(g, GEO.cyl, mc(0x263238, { roughness: 0.4 }), [0, 0.95, 0], [0.09, 0.2, 0.09]); U.mk(g, GEO.cyl, new THREE.MeshBasicMaterial({ color: 0x40c4ff }), [0, 1.06, 0], [0.092, 0.012, 0.092]); placeK('aispeaker', g, W.lay.table[0], W.lay.table[1], 0, 0, 0, act('🔊', 'คุยกับผู้ช่วย AI "น้องสุขใจ"', () => this.ai())); }
    if (has('massagechair')) { const g = box(0x4e342e, 0.8, 0.5, 0.9); U.mk(g, GEO.box, mc(0x4e342e), [0, 0.95, -0.38], [0.8, 0.9, 0.15]); placeK('massagechair', g, W.lay.massagechair[0], W.lay.massagechair[1], 0, 0.4, 0.45, act('💺', 'นั่งเก้าอี้นวด 30 นาที', () => this.massage())); }
    if (has('smartmirror')) { const g = new THREE.Group(); U.mk(g, GEO.box, mc(0xb0bec5, { metalness: 0.6, roughness: 0.1 }), [0, 1.5, 0], [0.7, 1.2, 0.03]); U.mk(g, GEO.box, new THREE.MeshBasicMaterial({ color: 0x80deea }), [0.2, 1.9, 0.02], [0.2, 0.08, 0.01]); placeK('smartmirror', g, w / 2 - 0.05, d / 2 - 2.2, -Math.PI / 2, 0, 0, act('🪞', 'ส่องกระจกอัจฉริยะ', () => this.mirror())); }
    if (has('smartfridge')) { const g = box(0xcfd8dc, 0.9, 1.9, 0.7); U.mk(g, GEO.box, new THREE.MeshBasicMaterial({ color: 0x4fc3f7 }), [0.2, 1.3, 0.36], [0.3, 0.2, 0.01]); placeK('smartfridge', g, W.lay.smartfridge[0], W.lay.smartfridge[1], 0, 0.45, 0.35, act('🧊', 'เปิดตู้เย็นอัจฉริยะ', () => this.fridge())); }
    if (has('projector')) { const g = new THREE.Group(); U.mk(g, GEO.box, mc(0xfafafa), [0, 1.8, 0], [2.2, 1.3, 0.02]); placeK('projector', g, -w / 2 + 2.6, d / 2 - 0.08, Math.PI, 0, 0, act('📽️', 'ดูหนังโฮมเธียเตอร์', () => this.movie())); }
    if (has('printer3d')) { const g = box(0xeceff1, 0.5, 0.5, 0.5, 0.75); placeK('printer3d', g, W.lay.printer3d[0], W.lay.printer3d[1], W.lay.printer3d[2], 0.25, 0.25, act('🖨️', 'ใช้เครื่องพิมพ์ 3 มิติ', () => this.print())); }
    if (has('airpurifier')) placeK('airpurifier', box(0xf5f5f5, 0.35, 0.8, 0.35), W.lay.airpurifier[0], W.lay.airpurifier[1], 0, 0.2, 0.2);
    if (has('robotvac')) { const g = new THREE.Group(); U.mk(g, GEO.cyl, mc(0x37474f, { roughness: 0.3 }), [0, 0.05, 0], [0.18, 0.08, 0.18]); U.mk(g, GEO.cyl, new THREE.MeshBasicMaterial({ color: 0x69f0ae }), [0, 0.1, 0.08], [0.03, 0.01, 0.03]); g.position.set(IN.x, IN.y, IN.z); W.interior.add(g); this.vac = g; this.vacT = 0; }
  },
  // ----- AI assistant -----
  ai() {
    this.log = this.log || [{ ai: 1, t: 'สวัสดีค่ะ หนูชื่อน้องสุขใจ ผู้ช่วย AI ประจำบ้าน ' + AI_HELP }];
    UI.open('ผู้ช่วย AI น้องสุขใจ', null, () => `<div class="chatlog" style="max-height:260px">${this.log.slice(-10).map(l => `<p class="${l.ai ? 'them' : 'me'}"><b>${l.ai ? '🔊 น้องสุขใจ' : 'คุณ'}:</b> ${esc(l.t)}</p>`).join('')}</div>
      <div class="row"><input id="aiSay" maxlength="80" placeholder="สั่งงานน้องสุขใจ..." style="flex:1"><button class="btn" data-a="aisend">ส่ง</button></div>
      <div class="row topics">${['วันนี้ควรปลูกอะไร', 'สรุปฟาร์ม', 'สรุปเงิน', 'อากาศ', 'ทำอาหารอะไรได้บ้าง', 'สั่งอาหาร', 'เปิดเพลง', 'รายการเตือน'].map(q => `<button class="btn ghost" data-a="aiq" data-v="${q}">${q}</button>`).join('')}</div>`, { wide: true });
    UI.cur.after = () => { const i = $('aiSay'); if (i) i.focus(); };
  },
  answer(q) {
    const t = q.trim(); if (!t) return;
    let a;
    if (/ปลูก|แนะนำ/.test(t)) { const se = season(), pool = Object.keys(CROPS).filter(k => !CROPS[k].tree && (SEED_LVL[k] || 1) <= S.lvl).sort((x, y) => priceOf(y) / CROPS[y].grow * (inSeason(y) ? 1.3 : 1) - priceOf(x) / CROPS[x].grow * (inSeason(x) ? 1.3 : 1)); a = `ตอนนี้${se.n} แนะนำปลูก ${pool.slice(0, 3).map(k => `${CROPS[k].i}${CROPS[k].n} (${baht(priceOf(k))}, โต ${CROPS[k].grow} ชม.${inSeason(k) ? ', ตามฤดู' : ''})`).join(', ')} ได้กำไรต่อชั่วโมงดีที่สุดค่ะ`; }
    else if (/ฟาร์ม|ไร่|สถานะ/.test(t)) { const dry = S.plots.filter(p => p.c && p.w <= 0).length, ripe = S.plots.filter(p => stageOf(p) === 3).length, empty = S.plots.filter((p, i) => !p.c && plotUnlocked(i, S.up.field)).length, pests = Object.keys((S.f2 || {}).pests || {}).length; a = `แปลงแห้ง ${dry} · ผักสุกรอเก็บ ${ripe} · แปลงว่าง ${empty} · สัตว์ ${S.animals.length} ตัว อาหารในราง ${S.trough}${pests ? ` · มีแมลง ${pests} แปลง!` : ''}${S.f2 && S.f2.contract ? ` · สัญญาส่ง${CROPS[S.f2.contract.crop].n} ${S.f2.contract.done}/${S.f2.contract.qty}` : ''}`; }
    else if (/เงิน|บัญชี|รายได้/.test(t)) { const b = Bank.st(); a = `เงินสด ${baht(S.money)} · ในธนาคาร ${baht(Bank.total())} · หนี้ ${baht((b.debt || 0))} · รายได้สะสม ${baht(S.stats.earned)}${S.billDue ? ` · มีบิลค้าง ${baht(S.billDue.elec + S.billDue.water)}` : ''}`; }
    else if (/อากาศ|ฝน|พยากรณ์/.test(t)) { const W = WEATHER[S.weather.type], N = WEATHER[S.weather.next]; a = `ตอนนี้${W.n} พรุ่งนี้${N.n}${N.rain > 0.3 ? ' ไม่ต้องรดน้ำค่ะ' : ' อย่าลืมรดน้ำนะคะ'}${N.storm ? ' ระวังฟ้าผ่าด้วยค่ะ' : ''}`; }
    else if (/ทำอาหาร|เมนู|กินอะไร/.test(t)) { const ok = Object.keys(RECIPES).filter(k => Object.keys(RECIPES[k].need).every(x => countBase(x) >= RECIPES[k].need[x])); a = ok.length ? `วัตถุดิบตอนนี้ทำได้: ${ok.map(k => RECIPES[k].i + RECIPES[k].n).join(', ')}` : 'ตอนนี้วัตถุดิบยังไม่พอทำเมนูไหนเลยค่ะ ลองเก็บผักหรือไข่ก่อนนะคะ'; }
    else if (/สั่งอาหาร|หิว|เดลิเวอรี่/.test(t)) { setTimeout(() => { UI.close(); Phone.open('food'); }, 300); a = 'เปิดแอปสั่งอาหารให้แล้วค่ะ'; }
    else if (/เปิดเพลง/.test(t)) { S.music = true; Music.setOn(true); a = 'เปิดเพลงลูกทุ่งคลอเบา ๆ ให้แล้วค่ะ 🎵'; }
    else if (/ปิดเพลง/.test(t)) { S.music = false; Music.setOn(false); a = 'ปิดเพลงแล้วค่ะ'; }
    else if (/ปิดแอร์/.test(t)) { S.ac = false; a = 'ปิดแอร์แล้วค่ะ ประหยัดไฟ'; }
    else if (/เปิดแอร์/.test(t)) { if (S.furn.aircon) { S.ac = true; a = 'เปิดแอร์ให้แล้ว เย็นสบายค่ะ'; } else a = 'บ้านเรายังไม่มีแอร์เลยค่ะ'; }
    else if (/เตือน|จำ/.test(t) && !/รายการ/.test(t)) { S.todo = S.todo || []; S.todo.push(t.replace(/^(ช่วย)?เตือน(ให้)?/, '').trim() || t); a = `บันทึกแล้วค่ะ จะเตือนทุกเช้า (${S.todo.length} รายการ)`; }
    else if (/รายการ/.test(t)) a = (S.todo || []).length ? 'รายการเตือน: ' + S.todo.map((x, i) => `${i + 1}. ${x}`).join(' ') + ' (พิมพ์ "ล้างรายการ" เพื่อลบ)' : 'ยังไม่มีรายการเตือนค่ะ';
    else if (/ล้าง/.test(t)) { S.todo = []; a = 'ล้างรายการเตือนแล้วค่ะ'; }
    else if (/สวัสดี|หวัดดี/.test(t)) a = `สวัสดีค่ะคุณ${S.name || ''} วันนี้${RD(S.day)} มีอะไรให้ช่วยไหมคะ`;
    else a = 'ขอโทษค่ะ หนูยังไม่เข้าใจ ' + AI_HELP;
    this.log.push({ t }); this.log.push({ ai: 1, t: a }); Sfx.tone(980, 0.08, 'sine', 0.04);
  },
  massage() { if (S.daily.massage) { UI.toast('นวดไปแล้ววันนี้', '💺'); return; } S.daily.massage = 1; fade(() => { tick(30); S.energy = Math.min(maxEnergy(), S.energy + 25); S.mood = Math.min(100, (S.mood || 50) + 10); UI.toast('ผ่อนคลายสุด ๆ พลังงาน +25', '💺'); }); },
  mirror() { const N = WEATHER[S.weather.type]; UI.toast(`กระจกอัจฉริยะ: วันนี้${N.n} ${N.rain > 0.3 ? 'แนะนำหมวกกันฝน' : 'แนะนำหมวกฟางกันแดด'} · อารมณ์คุณ ${Math.round(S.mood || 50)}%`, '🪞'); setTimeout(() => UI.look(false), 600); },
  fridge() {
    const foods = Object.keys(S.inv).filter(k => ITEMS[k] && ITEMS[k].en && S.inv[k] > 0), ok = Object.keys(RECIPES).filter(k => Object.keys(RECIPES[k].need).every(x => countBase(x) >= RECIPES[k].need[x]));
    UI.open('ตู้เย็นอัจฉริยะ', null, () => `<p class="lead">ของกินในตู้: ${foods.map(k => ITEMS[k].i + '×' + S.inv[k]).join(' ') || 'ว่าง'}</p><p class="lead">🍳 ทำได้ตอนนี้: ${ok.map(k => RECIPES[k].i + RECIPES[k].n).join(', ') || 'ยังไม่มี'}</p><div class="row"><button class="btn" data-a="groceries" ${S.money >= 950 && !S.daily.groc ? '' : 'disabled'}>สั่งวัตถุดิบชุดทำอาหาร (ไข่ 4 นม 2 แครอท 4) 950 ฿ วันละครั้ง</button><button class="btn ghost" data-a="eatbtn">เลือกของกิน</button></div>`);
  },
  movie() { if (S.daily.movie) { UI.toast('ดูหนังไปแล้ววันนี้', '📽️'); return; } S.daily.movie = 1; const r = Social.st(); fade(() => { tick(120); S.mood = Math.min(100, (S.mood || 50) + 20); if (r.partner && r.stage === 'married') Friends.add(r.partner, 0.5); UI.toast(`ดูหนังเรื่อง${U.pick(['รักนี้ที่ไร่สุขใจ', 'ผจญภัยในเหมืองลึก', 'ตำนานเมืองทุ่งทอง'])} สนุกมาก!${r.partner && r.stage === 'married' ? ' ดูกับ' + r.partner + ' ด้วย ❤️' : ''}`, '📽️'); }); },
  print() { UI.open('เครื่องพิมพ์ 3 มิติ', null, () => `<p class="lead">ใช้เส้นพลาสติกชีวภาพ ครั้งละ 150 ฿ ใช้เวลา 1 ชม.</p><div class="row"><button class="btn" data-a="print3d" data-v="pettoy">ของเล่นสัตว์เลี้ยง</button><button class="btn" data-a="print3d" data-v="teddy">ตุ๊กตาให้ลูก</button><button class="btn" data-a="print3d" data-v="trophy">ถ้วยรางวัลจำลอง</button></div>`); },
  // ----- daily effects -----
  morning() {
    if (this.has('robotvac')) (S.buff = S.buff || {}).clean = S.day;
    if (S.furn.smartgarden) this.water('เช้า');
    if (S.todo && S.todo.length && S.furn.aispeaker) Phone.msg('น้องสุขใจ AI', 'อรุณสวัสดิ์ค่ะ รายการเตือนวันนี้: ' + S.todo.join(' / '), false);
  },
  water(when) { let n = 0; S.plots.forEach(p => { if (p.c && p.w <= 0) { p.w = 1; n++; } }); if (n && !G.simulating) UI.toast(`ระบบรดน้ำอัจฉริยะรดน้ำ ${n} แปลง (รอบ${when})`, '💧'); },
  hour() { if (S.furn.smartgarden && Math.floor(S.time / 60) === 15) this.water('บ่าย'); },
  update(dt) {
    if (!this.vac || !G.inside || G.inRoom) return;
    this.vacT -= dt; const v = this.vac, r = World.room;
    if (this.vacT <= 0 || !v.userData.t) { this.vacT = 3 + Math.random() * 3; v.userData.t = { x: IN.x + (Math.random() - 0.5) * (r.w - 2), z: IN.z + (Math.random() - 0.5) * (r.d - 2) }; }
    const t = v.userData.t, dx = t.x - v.position.x, dz = t.z - v.position.z, d = Math.hypot(dx, dz);
    if (d > 0.1) { v.position.x += dx / d * Math.min(d, 0.5 * dt); v.position.z += dz / d * Math.min(d, 0.5 * dt); v.rotation.y = Math.atan2(dx, dz); }
  },
};
UI.H.aisend = () => { const el = $('aiSay'); if (el) { Smart.answer(el.value); el.value = ''; } };
UI.H.aiq = d => Smart.answer(d.v);
UI.H.groceries = () => { if (S.money < 950 || S.daily.groc) { if (S.daily.groc) UI.toast('สั่งวัตถุดิบได้วันละครั้ง', '🧊'); return; } S.daily.groc = 1; S.money -= 950; (S.deliv = S.deliv || []); addItem('egg', 4); addItem('milk', 2); addItem('carrot', 4); UI.toast('วัตถุดิบมาส่งถึงหน้าบ้านแล้ว', '🛵'); };
UI.H.eatbtn = () => { UI.close(); UI.inventory('food'); };
UI.H.print3d = d => { if (S.money < 150) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(150), '💸'); return; } S.money -= 150; UI.close(); fade(() => { tick(60); if (d.v === 'trophy') { S.furn.trophy = 1; World.buildInterior(S.up.house, S); World.interior.visible = G.inside; } else addItem(d.v); UI.toast('พิมพ์เสร็จแล้ว!', '🖨️'); }); };
document.addEventListener('keydown', e => { if (e.target && e.target.id === 'aiSay' && e.key === 'Enter') { e.preventDefault(); UI.H.aisend(); UI.renderBody(); } });
