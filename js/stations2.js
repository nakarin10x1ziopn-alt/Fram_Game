'use strict';
// ---------- Six more services at each station (used inside the police and fire station rooms) ----------
ITEMS.lostwallet = { n: 'กระเป๋าสตางค์ที่มีคนทำหาย', i: '👛', cat: 'tool' };
const Stations2 = {
  st() { if (!S.st2) S.st2 = { points: 0, tickets: [], cctv: 0, appealDay: -99, watchDay: -99, bounty: null, wallet: null, fireSafe: 0, fireSys: 0, cpr: 0, shiftDay: -99, tourDay: -99, tankDay: -99, faint: null }; return S.st2; },
  // ----- police -----
  policeRoom(g, pois, X, Z, W, D, box) {
    const P = (x, z, icon, label, fn) => pois.push({ kind: 'act', x: X + x, z: Z + z, r: 1.4, label, icon, act: () => ({ icon, label, fn }) });
    box(-W / 2 + 0.3, -1, 0.1, 2.4, 1.6, mc(0xd7ccc8), 0.8, false);
    P(-W / 2 + 1.3, -1, '📋', 'กระดานประกาศจับ (รางวัลนำจับ)', () => this.bountyUI());
    box(W / 2 - 0.8, 2, 1, 1, 1.2, mc(0x795548)); P(W / 2 - 1.8, 2, '📦', 'ตู้รับแจ้งของหาย/ส่งคืนของ', () => this.lostUI());
    box(-3.5, 2.8, 2.2, 0.8, 0.75, mc(0x8d6e63)); P(-3.5, 1.8, '🚦', 'อบรมกฎจราจร (ล้างแต้มใบขับขี่)', () => this.trafficSchool());
    box(3.5, -0.5, 1.6, 0.6, 1.0, mc(0x37474f)); U.mk(g, GEO.box, new THREE.MeshBasicMaterial({ color: 0x4fc3f7 }), [X + 3.5, 1.3, Z - 0.2], [1.2, 0.6, 0.05]); P(3.5, 0.6, '📹', 'ติดตั้งกล้องวงจรปิดที่ฟาร์ม', () => this.cctvUI());
    P(0, 2.8, '🧾', 'ประวัติใบสั่ง / อุทธรณ์ค่าปรับ', () => this.ticketsUI());
    P(-W / 2 + 1.5, 3.2, '🔦', 'อาสาเวรยามกลางคืน (20:00–23:00)', () => this.nightWatch());
  },
  bountyUI() {
    const s = this.st(), b = s.bounty;
    UI.open('ประกาศจับประจำวัน', null, () => b && b.day === S.day ? `<p class="lead">ผู้ต้องสงสัยแอบขโมยของในตลาด รูปพรรณ: ${b.fem ? 'ผู้หญิง' : 'ผู้ชาย'} อายุราว ${b.age - 3}–${b.age + 3} ปี นิสัย${TRAITS[b.trait].n} ${b.done ? '<br><b class="good">ปิดคดีแล้ว ขอบคุณที่ช่วย</b>' : '<br>ไปถามชาวบ้านทีละคน ถ้าเจอคนที่ตรงลักษณะให้กด "แจ้งเบาะแส" ในหน้าคุย รางวัล 800 ฿ (แจ้งผิดคนจะเสียความสนิท)'}</p>` : '<p class="empty">วันนี้ยังไม่มีประกาศ</p>');
  },
  matchBounty(n) { const b = this.st().bounty; if (!b || b.done || b.day !== S.day) return false; const p = People.prof(n.name); return p.fem === b.fem && Math.abs(p.age - b.age) <= 3 && p.trait === b.trait; },
  accuse(n) {
    const b = this.st().bounty; if (!b || b.done) return;
    if (n.name === b.name || this.matchBounty(n)) { b.done = 1; earn(800); Bank2.income('รางวัลนำจับ', 800); UI.toast(`แจ้งเบาะแสถูกต้อง! ตำรวจจับ${n.name}ได้ รับรางวัล 800 ฿`, '🚓'); Life2.note('ช่วยตำรวจจับผู้ต้องสงสัย'); }
    else { S.friends[n.name] = Math.max(0, Friends.get(n.name) - 1); UI.toast(`${n.name}ไม่พอใจที่ถูกกล่าวหา ความสนิท -1`, '😠'); }
  },
  lostUI() {
    UI.open('ตู้รับแจ้งของหาย', null, () => `<p class="lead">บางวันจะมีคนทำกระเป๋าสตางค์ตกในหมู่บ้าน (มีไอคอน 👛 บนพื้น) เก็บมาส่งที่นี่จะได้รางวัลน้ำใจและเจ้าของจะซึ้งใจ</p><div class="row"><button class="btn" data-a="returnwallet" ${count('lostwallet') ? '' : 'disabled'}>ส่งคืนกระเป๋าสตางค์ (${count('lostwallet')})</button></div>`);
  },
  trafficSchool() {
    const s = this.st();
    UI.open('อบรมกฎจราจร', null, () => `<p class="lead">แต้มใบขับขี่ของคุณ: <b>${s.points}/5</b> (ครบ 5 แต้มถูกพักใบขับขี่) · อบรม 2 ชม. ค่าอบรม 600 ฿ ล้างแต้มเป็น 0</p><div class="row"><button class="btn" data-a="trschool" ${s.points && S.money >= 600 ? '' : 'disabled'}>เข้าอบรม</button></div>`);
  },
  cctvUI() { const s = this.st(); UI.open('กล้องวงจรปิดฟาร์ม', null, () => `<p class="lead">${s.cctv ? '✅ ติดตั้งแล้ว: ขโมยที่บุกเข้าไร่มีโอกาส 60% ถูกตำรวจจับได้ทันทีโดยไม่เสียของ' : 'ติดตั้ง 4,000 ฿ เชื่อมต่อสถานีตำรวจ ขโมยมีโอกาส 60% ถูกจับทันทีที่เข้าไร่'}</p><div class="row"><button class="btn" data-a="cctv" ${!s.cctv && S.money >= 4000 ? '' : 'disabled'}>ติดตั้ง</button></div>`); },
  ticketsUI() {
    const s = this.st();
    UI.open('ประวัติใบสั่ง', null, () => `<p class="lead">อุทธรณ์ได้สัปดาห์ละครั้ง มีโอกาส 50% ได้เงินค่าปรับคืน</p>${s.tickets.length ? `<ul class="lead">${s.tickets.slice(-8).reverse().map(t => `<li>${RD(t.d)}: ${esc(t.t)} ${baht(t.a)}${t.back ? ' (คืนเงินแล้ว)' : ''}</li>`).join('')}</ul>` : '<p class="empty">ยังไม่เคยโดนใบสั่ง</p>'}<div class="row"><button class="btn" data-a="appeal" ${s.tickets.some(t => !t.back) && S.day - s.appealDay >= 7 ? '' : 'disabled'}>อุทธรณ์ใบสั่งล่าสุด</button></div>`);
  },
  nightWatch() {
    const s = this.st(), h = S.time / 60;
    if (!(h >= 20 && h < 23)) { UI.toast('เวรยามรับสมัครช่วง 20:00–23:00', '🔦'); return; }
    if (s.watchDay === S.day) { UI.toast('ทำเวรไปแล้วคืนนี้', '🔦'); return; }
    s.watchDay = S.day; UI.close(); fade(() => { tick(120); earn(350); Bank2.income('งานพิเศษ', 350); S.emerg.nextThief = Math.max(S.emerg.nextThief || 0, S.day + 2); UI.toast('เดินตรวจกับตำรวจเสร็จ ได้ 350 ฿ ขโมยไม่กล้ามา 2 คืน', '🔦'); });
  },
  ticket(t, a) { const s = this.st(); s.tickets.push({ d: S.day, t, a }); s.points++; if (s.points >= 5 && S.license) { S.license = 0; Phone.msg('สถานีตำรวจภูธรสุขใจ', 'แต้มครบ 5 แต้ม ใบขับขี่ถูกพัก! เข้าอบรมกฎจราจรแล้วสอบใหม่ได้'); } },
  // ----- fire -----
  fireRoom(g, pois, X, Z, W, D, box) {
    const P = (x, z, icon, label, fn) => pois.push({ kind: 'act', x: X + x, z: Z + z, r: 1.4, label, icon, act: () => ({ icon, label, fn }) });
    P(-3.5, 2.2, '🔍', 'ขอเจ้าหน้าที่ตรวจความปลอดภัยฟาร์ม', () => this.inspect());
    box(W / 2 - 1.2, 3.5, 1.6, 1, 1.2, mc(0xe53935)); P(W / 2 - 2.6, 3.5, '🚨', 'ติดสัญญาณเตือนไฟ + สปริงเกอร์ดับเพลิงในไร่', () => this.fireSystem());
    P(1, 2.6, '🧑‍🚒', 'ลงเวรอาสาดับเพลิง (วันละครั้ง)', () => this.shift());
    box(-W / 2 + 1, 3.6, 1.6, 0.8, 0.5, mc(0xffffff)); P(-W / 2 + 2.4, 3.6, '❤️‍🩹', 'อบรม CPR & ปฐมพยาบาล', () => this.cpr());
    P(4.5, 0.5, '🚒', 'พาลูก ๆ ทัวร์สถานีดับเพลิง', () => this.tour());
    box(-W / 2 + 0.8, -1.5, 1.2, 1.2, 1.8, mc(0x1565c0)); P(-W / 2 + 2.2, -1.5, '💧', 'บริการรถน้ำเติมน้ำให้ไร่ (300 ฿)', () => this.tank());
  },
  inspect() { const s = this.st(); if (S.money < 800) { UI.toast('ค่าตรวจ 800 ฿', '💸'); return; } S.money -= 800; s.fireSafe = S.day + 14; UI.toast('ตรวจแล้ว! ปรับปรุงจุดเสี่ยง โอกาสไฟไหม้ในไร่ลดลง 70% เป็นเวลา 14 วัน', '🔍'); },
  fireSystem() { const s = this.st(); if (s.fireSys) { UI.toast('ติดตั้งแล้ว ทำงานอยู่', '🚨'); return; } if (S.money < 6000) { UI.toast('ค่าติดตั้ง 6,000 ฿', '💸'); return; } S.money -= 6000; s.fireSys = 1; UI.toast('ติดตั้งระบบเตือนไฟและสปริงเกอร์แล้ว ไฟในไร่จะถูกฉีดดับอัตโนมัติ', '🚨'); Life2.note('ติดตั้งระบบดับเพลิงอัตโนมัติในไร่'); },
  shift() {
    const s = this.st(); if (s.shiftDay === S.day) { UI.toast('ลงเวรไปแล้ววันนี้', '🧑‍🚒'); return; }
    s.shiftDay = S.day; UI.close();
    const spots = [[-14, -232], [14, -205], [-12, -290], [12, -300]], sp = U.pick(spots);
    fade(() => { if (G.inRoom && typeof Rooms !== 'undefined') Rooms.leave(true); if (G.inside) setInside(false); G.player.pos.set(sp[0] + 3, World.groundY(sp[0] + 3, sp[1]), sp[1]); snapCam(); const f = Emergency.ignite(sp[0], sp[1], null); if (f) { f.k = 0.55; f.volunteer = true; } Emergency.call('fire'); UI.toast('มีไฟไหม้ในหมู่บ้าน! ช่วยรถดับเพลิงสาดน้ำดับไฟ (ต้องมีน้ำในบัว)', '🔥'); });
  },
  cpr() { const s = this.st(); if (s.cpr) { UI.toast('ผ่านการอบรมแล้ว', '❤️‍🩹'); return; } if (S.money < 700) { UI.toast('ค่าอบรม 700 ฿', '💸'); return; } S.money -= 700; s.cpr = 1; UI.close(); fade(() => { tick(120); UI.toast('ผ่านการอบรม CPR! ช่วยชาวบ้านที่เป็นลมได้ และค่ารถพยาบาลลดครึ่ง', '❤️‍🩹'); }); },
  tour() {
    const s = this.st(), kids = Social.st().kids; if (!kids.length) { UI.toast('ยังไม่มีลูกให้พามาทัวร์', '🚒'); return; } if (s.tourDay === S.day) { UI.toast('ทัวร์ไปแล้ววันนี้', '🚒'); return; }
    if (S.money < 100) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(100), '💸'); return; } S.money -= 100; s.tourDay = S.day; kids.forEach(k => k.joy = Math.min(100, (k.joy ?? 60) + 30)); S.mood = Math.min(100, (S.mood || 50) + 10); UI.toast('ลูก ๆ ได้นั่งรถดับเพลิงและฉีดน้ำ ดีใจกันใหญ่!', '🚒');
  },
  tank() { const s = this.st(); if (s.tankDay === S.day || S.money < 300) { UI.toast(s.tankDay === S.day ? 'สั่งไปแล้ววันนี้' : 'ค่าบริการ 300 ฿', '💧'); return; } S.money -= 300; s.tankDay = S.day; S.can.water = CAN_CAP[S.up.can - 1]; S.plots.forEach(p => { if (p.c) p.w = 1; }); UI.toast('รถน้ำมารดน้ำทุกแปลงและเติมบัวให้เต็มแล้ว', '💧'); },
  // ----- daily events -----
  day() {
    const s = this.st();
    // bounty suspect
    const pool = G.npcs.filter(n => !n.staff && !n.keeper && !n.single && n.x < 100); if (pool.length) { const n = U.pick(pool), p = People.prof(n.name); s.bounty = { day: S.day, name: n.name, fem: p.fem, age: p.age, trait: p.trait }; }
    // lost wallet somewhere in the village
    if (Math.random() < 0.15) { const x = U.lerp(-8, 8, Math.random()), z = U.lerp(-200, -310, Math.random()), owner = U.pick(G.npcs.filter(n => !n.staff)).name; s.wallet = { x, z, owner, day: S.day }; this.drawWallet(); }
    // someone faints (CPR)
    s.faint = Math.random() < 0.05 ? U.pick(G.npcs.filter(n => !n.staff && n.x < 100)).name : null;
    if (s.faint) Phone.msg('ข่าวด่วนหมู่บ้าน', `${s.faint}เป็นลมกลางหมู่บ้าน! ใครปฐมพยาบาลเป็นรีบไปช่วยที`);
  },
  drawWallet() {
    const s = this.st(); if (this.wSprite) { G.scene.remove(this.wSprite); this.wSprite = null; }
    if (!s.wallet) return;
    this.wSprite = U.sprite('👛', 0.7); this.wSprite.position.set(s.wallet.x, World.groundY(s.wallet.x, s.wallet.z) + 0.5, s.wallet.z); G.scene.add(this.wSprite);
  },
  init() {
    this.st(); this.drawWallet();
    G.targetHooks.push((consider, p) => { const w = this.st().wallet; if (w && !G.inside) { const d = Math.hypot(p.x - w.x, p.z - w.z); if (d < 1.6) consider({ kind: 'ext', act: () => ({ icon: '👛', label: 'เก็บกระเป๋าสตางค์ที่ตกอยู่', fn: () => { addItem('lostwallet'); this.st().wallet.got = 1; this.st().walletOwner = w.owner; this.st().wallet = null; this.drawWallet(); UI.toast('เก็บได้กระเป๋าสตางค์! นำไปส่งที่สถานีตำรวจ', '👛'); } }) }, d); } });
  },
};
UI.H.returnwallet = () => { if (!takeItem('lostwallet')) return; const o = Stations2.st().walletOwner; earn(300); Bank2.income('รางวัลน้ำใจ', 300); if (o && S.friends[o] != null) Friends.add(o, 1); UI.toast(`ส่งคืนเจ้าของ${o ? ' (' + o + ')' : ''} แล้ว ได้รางวัลน้ำใจ 300 ฿`, '👛'); Life2.note('เก็บกระเป๋าสตางค์ได้แล้วส่งคืนเจ้าของ'); };
UI.H.trschool = () => { if (S.money < 600) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(600), '💸'); return; } S.money -= 600; Stations2.st().points = 0; UI.close(); fade(() => { tick(120); UI.toast('อบรมเสร็จ แต้มใบขับขี่กลับเป็น 0', '🚦'); }); };
UI.H.cctv = () => { if (S.money < 4000) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(4000), '💸'); return; } S.money -= 4000; Stations2.st().cctv = 1; UI.toast('ติดกล้องวงจรปิดแล้ว', '📹'); };
UI.H.appeal = () => { const s = Stations2.st(), t = s.tickets.slice().reverse().find(x => !x.back); if (!t) return; s.appealDay = S.day; if (Math.random() < 0.5) { t.back = 1; S.money += t.a || 0; UI.toast(`อุทธรณ์สำเร็จ ได้คืน ${baht(t.a)}`, '🧾'); } else UI.toast('อุทธรณ์ไม่สำเร็จ ใบสั่งยังมีผล', '🧾'); };
UI.H.accuse = () => Stations2.accuse(UI.talkTo);
UI.H.cprhelp = () => { const n = UI.talkTo, s = Stations2.st(); if (s.faint !== n.name) return; s.faint = null; Friends.add(n.name, 1.5); earn(300); UI.toast(`ปฐมพยาบาล${n.name}จนฟื้น! ชาวบ้านชื่นชม ได้ 300 ฿`, '❤️‍🩹'); Life2.note(`ช่วยชีวิต${n.name}ด้วย CPR`); };
