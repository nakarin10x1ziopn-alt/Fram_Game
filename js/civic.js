'use strict';
// ---------- Civic services like real Thailand 2026: hospital with rights (บัตรทอง / ประกันสังคม / ข้าราชการ / จ่ายเอง / ประกันเอกชน),
// queues, HN cards and appointments; schools with compulsory education (ป.1–ม.3), เรียนฟรี 15 ปี subsidies, kids' enrolment,
// report cards, scholarships, parent meetings and กศน./ปวช. for the adult player; and public transport: ride-hailing (car/bike),
// วินมอเตอร์ไซค์, สองแถว on fixed routes, the electric bus, and รถตู้/รถทัวร์ to the far towns ----------

// ===== hospital services =====
// price = full cash price; c = what each right pays out of pocket (number, or a rule keyword); ins = covered by private health insurance
const CV_HOS = {
  opd: { n: 'ตรวจโรคทั่วไป (OPD)', i: '🩺', q: 'A', price: 450, min: 20, when: 'opd', c: { ucs: 30, sso: 0, gov: 0 }, ins: 1, d: 'ไข้ หวัด ปวดท้อง อาการทั่วไป · ถ้าป่วยได้ใบรับรองแพทย์ไปลาป่วย' },
  er: { n: 'ห้องฉุกเฉิน (ER) 24 ชม.', i: '🚑', q: 'E', price: 1500, min: 40, when: 'er', c: { ucs: 30, sso: 0, gov: 0 }, ins: 1, d: 'อาการหนัก หมดแรง · คัดกรองตามความรุนแรง ผู้ป่วยวิกฤตรักษาฟรีทุกสิทธิ (UCEP)' },
  dental: { n: 'ทันตกรรม ขูดหินปูน/อุดฟัน', i: '🦷', q: 'D', price: 900, min: 40, when: 'office', c: { ucs: 0, sso: 'dent', gov: 0 }, ins: 0, d: 'ปีละครั้ง · บัตรทองฟรี · ประกันสังคมเบิกได้ปีละ 900 ฿' },
  eye: { n: 'ตรวจตา วัดสายตา ตัดแว่น', i: '👓', q: 'C', price: 1500, min: 45, when: 'office', c: { ucs: 1200, sso: 1200, gov: 0 }, ins: 0, d: 'ตรวจตาฟรีตามสิทธิ ค่าแว่นจ่ายเอง (ข้าราชการเบิกได้)' },
  checkup: { n: 'ตรวจสุขภาพประจำปี', i: '📋', q: 'K', price: 2500, min: 90, when: 'office', c: { ucs: 0, sso: 0, gov: 0 }, ins: 0, d: 'ปีละครั้ง · เลือด ปัสสาวะ ความดัน เอกซเรย์ปอด · ฟรีทุกสิทธิรัฐ' },
  vflu: { n: 'วัคซีนไข้หวัดใหญ่', i: '💉', q: 'V', price: 600, min: 15, when: 'office', c: { ucs: 'flu', sso: 600, gov: 600 }, ins: 0, d: 'กันป่วยจากตากฝน 28 วัน · บัตรทองฉีดฟรีถ้ามีโรคเรื้อรัง' },
  vden: { n: 'วัคซีนไข้เลือดออก', i: '🦟', q: 'V', price: 2500, min: 20, when: 'office', c: { ucs: 2500, sso: 2500, gov: 2500 }, ins: 0, d: 'ลดความเสี่ยงไข้เลือดออก 56 วัน · ยังไม่อยู่ในสิทธิ ต้องจ่ายเอง' },
  lab: { n: 'เจาะเลือดตรวจแล็บ', i: '🧪', q: 'L', price: 700, min: 30, when: 'office', c: { ucs: 0, sso: 0, gov: 0 }, ins: 1, d: 'น้ำตาล ไขมัน ไต ตับ · ควรงดอาหารก่อน 8 ชม.' },
  xray: { n: 'เอกซเรย์ปอด', i: '🩻', q: 'X', price: 400, min: 25, when: 'office', c: { ucs: 0, sso: 0, gov: 0 }, ins: 1, d: 'ตรวจปอดหลังเจอฝุ่น PM2.5 หรือไอเรื้อรัง' },
  physio: { n: 'กายภาพบำบัด', i: '🦵', q: 'P', price: 450, min: 60, when: 'office', c: { ucs: 30, sso: 0, gov: 0 }, ins: 1, d: 'ปวดหลังจากงานไร่ · พลังงาน +30 วันละครั้ง' },
  anc: { n: 'ฝากครรภ์ (ANC)', i: '🤰', q: 'M', price: 0, min: 45, when: 'office', c: { ucs: 0, sso: 0, gov: 0 }, ins: 1, d: 'พาคู่ชีวิตไปฝากครรภ์ อัลตราซาวด์ ฟรีทุกสิทธิ' },
  mental: { n: 'คลินิกสุขภาพจิต', i: '🧠', q: 'J', price: 800, min: 50, when: 'office', c: { ucs: 0, sso: 0, gov: 0 }, ins: 1, d: 'เครียด หมดไฟ นอนไม่หลับ · อารมณ์ +25 · สายด่วนสุขภาพจิต 1323 ฟรี 24 ชม.' },
  refill: { n: 'รับยาโรคเรื้อรังต่อเนื่อง', i: '💊', q: 'R', price: 350, min: 30, when: 'office', c: { ucs: 0, sso: 0, gov: 0 }, ins: 1, d: 'ยา 14 วัน · สำหรับผู้มีโรคประจำตัว' },
  cert: { n: 'ใบรับรองแพทย์ (สมัครงาน/ใบขับขี่)', i: '📄', q: 'A', price: 100, min: 20, when: 'opd', c: { ucs: 100, sso: 100, gov: 100 }, ins: 0, d: 'ใช้ได้ 30 วัน · ไม่อยู่ในสิทธิ ต้องจ่ายเอง' },
};
const CV_RIGHTS = { ucs: 'บัตรทอง (30 บาทรักษาทุกที่)', sso: 'ประกันสังคม', gov: 'สิทธิข้าราชการ (เบิกจ่ายตรง)', ins: 'ประกันสุขภาพเอกชน', self: 'จ่ายเอง' };

// ===== schools =====
const CV_LV = {
  ecd: { n: 'ศูนย์พัฒนาเด็กเล็ก อบต.', i: '🧸', g: '', sub: 300 },
  k: { n: 'อนุบาล', i: '🖍️', g: 'อ.', sub: 400 },
  p: { n: 'ประถมศึกษา', i: '🎒', g: 'ป.', sub: 555 },
  m: { n: 'มัธยมศึกษาตอนต้น', i: '📘', g: 'ม.', sub: 760 },
  hs: { n: 'มัธยมศึกษาตอนปลาย', i: '📗', g: 'ม.', sub: 730 },
  voc: { n: 'อาชีวศึกษา ปวช.', i: '🛠️', g: 'ปวช.', sub: 900 },
};
const CV_OPTS = {
  bus: { n: 'รถรับส่งนักเรียน', i: '🚐', wk: 150 },
  lunch: { n: 'อาหารกลางวัน', i: '🍱', wk: 125 },
  tutor: { n: 'เรียนพิเศษ', i: '📚', wk: 600 },
};
const CV_ADULT = {
  nfe: { n: 'กศน. ม.ปลาย (การศึกษานอกระบบ)', i: '📖', fee: 0, need: 6, days: [5, 6], h0: 9, h1: 15, cert: 'm6', cn: 'วุฒิ ม.6 (กศน.)', d: 'เรียนฟรี เสาร์-อาทิตย์ 09:00–15:00 ครบ 6 ครั้งแล้วสอบปลายภาค' },
  voc: { n: 'ปวช. ช่างยนต์ ภาคสมทบ', i: '🔧', fee: 2500, need: 8, days: [0, 1, 2, 3, 4], h0: 17, h1: 21, cert: 'voc', cn: 'ปวช. สาขาช่างยนต์', d: 'ค่าเทอม 2,500 ฿ จันทร์-ศุกร์ 17:00–21:00 ครบ 8 ครั้งแล้วสอบปฏิบัติ · จบแล้วซ่อมรถถูกลงครึ่งหนึ่ง' },
};
const CV_EXAM = {
  nfe: [['การศึกษาภาคบังคับของไทยมีกี่ปี', ['6 ปี', '9 ปี', '12 ปี'], 1], ['ประเทศไทยมีกี่จังหวัด (รวมกรุงเทพฯ)', ['76', '77', '78'], 1], ['สัตว์ชนิดใดเลี้ยงลูกด้วยนม', ['ปลาวาฬ', 'ปลาฉลาม', 'จระเข้'], 0], ['ร้อยละ 7 ของ 1,000 บาท คือเท่าไร', ['7 บาท', '70 บาท', '700 บาท'], 1]],
  voc: [['เครื่องยนต์เบนซิน 4 จังหวะ ทำงานตามลำดับใด', ['ดูด อัด ระเบิด คาย', 'อัด ดูด คาย ระเบิด', 'ระเบิด ดูด อัด คาย'], 0], ['ควรเปลี่ยนน้ำมันเครื่องเมื่อไร', ['ตามระยะที่ผู้ผลิตกำหนด', 'เมื่อรถพังแล้ว', 'ไม่ต้องเปลี่ยนเลย'], 0], ['ไฟเตือนรูปกาน้ำมันสีแดงหมายถึง', ['แรงดันน้ำมันเครื่องต่ำ', 'น้ำมันเชื้อเพลิงเต็ม', 'เปิดไฟหน้าอยู่'], 0], ['ก่อนถอดขั้วแบตเตอรี่ควรถอดขั้วใดก่อน', ['ขั้วบวก (+)', 'ขั้วลบ (-)', 'ถอดพร้อมกัน'], 1]],
};

// ===== transport =====
const CV_KM = 40; // world units per km
const CV_SONG = [
  { n: 'สาย 1 ไร่สุขใจ–หมู่บ้าน–วัด', c: '🔵', stops: [{ n: 'หน้าไร่', x: 7.5, z: -64 }, { n: 'สุขใจพลาซ่า', x: -16, z: -112 }, { n: 'หมู่บ้าน', x: 8.6, z: -232 }, { n: 'โรงเรียน', x: 24, z: -320 }, { n: 'วัดสุขใจาราม', x: -22, z: -322 }] },
  { n: 'สาย 2 หมู่บ้าน–ทุ่งทอง–ริมทะเล', c: '🟡', stops: [{ n: 'หมู่บ้าน', x: 8.6, z: -232 }, { n: 'เมืองทุ่งทอง', x: 200, z: -248 }, { n: 'ตลาดริมทะเล', x: 300, z: -373 }] },
  { n: 'สาย 3 หมู่บ้าน–ภูผาใหม่', c: '🟢', stops: [{ n: 'หมู่บ้าน', x: 8.6, z: -232 }, { n: 'วัดสุขใจาราม', x: -22, z: -322 }, { n: 'เมืองภูผาใหม่', x: -70, z: -430 }] },
];
const CV_INTER = [
  { k: 'mount', n: 'ดอยสุขใจ (เมืองภูเขา)', i: '⛰️', o: [{ n: 'รถตู้ปรับอากาศ', i: '🚐', fee: 150, dur: 150, every: [6, 18] }] },
  { k: 'chiang', n: 'เชียงสุข (เมืองเก่าล้านนา)', i: '🏮', o: [{ n: 'รถทัวร์ ป.2', i: '🚌', fee: 220, dur: 300, at: [7, 10, 14, 21] }, { n: 'รถทัวร์ VIP 24 ที่นั่ง', i: '🛋️', fee: 380, dur: 270, at: [9, 20, 22] }] },
  { k: 'city', n: 'สุขใจซิตี้ (เมืองใหม่)', i: '🏙️', o: [{ n: 'รถตู้ปรับอากาศ', i: '🚐', fee: 200, dur: 180, every: [6, 19] }, { n: 'รถทัวร์ ป.1', i: '🚌', fee: 260, dur: 210, at: [8, 12, 16, 20] }] },
  { k: 'island', n: 'เกาะสุขใจ', i: '🏝️', o: [{ n: 'ตั๋วร่วม รถตู้ + เรือ', i: '⛴️', fee: 280, dur: 180, at: [7, 9, 11, 13, 15] }] },
];

const Civic = {
  atHosp: null, atSchool: false, rtab: 0, rzone: null, quiz: null,
  st() {
    const c = S.civic = S.civic || {};
    c.hn = c.hn || {}; c.appt = c.appt || []; c.hist = c.hist || []; c.kids = c.kids || {}; c.warn = c.warn || {};
    c.ed = c.ed || { lv: 'm3', certs: [], prog: null, n: 0, last: 0, examDay: 0 };
    if (!Array.isArray(c.ed.certs)) c.ed.certs = [];
    c.rides = c.rides || 0;
    return c;
  },
  // ----- small helpers -----
  money(n) { n = Math.round(+n); return Number.isFinite(n) && n > 0 ? n : 0; },
  pay(n, label) {
    if (!Number.isFinite(S.money)) S.money = 0;
    n = this.money(n); if (S.money < n) { UI.toast(`เงินไม่พอ ต้องใช้ ${baht(n)}`, '💸'); return false; }
    if (n) { S.money -= n; if (typeof Bank2 !== 'undefined') Bank2.log(label, -n); }
    return true;
  },
  charge(n, label) { n = this.money(n); if (!n) return 0; if (!Number.isFinite(S.money)) S.money = 0; const t = Math.min(S.money, n); S.money -= t; if (t && typeof Bank2 !== 'undefined') Bank2.log(label, -t); return t; },
  gift(n, label) { n = this.money(n); if (!n) return; earn(n); if (typeof Bank2 !== 'undefined') Bank2.income(label, n); },
  hour() { return S.time / 60; },
  dIdx(d = S.day) { return (d - 1) % 7; },
  weekday(d = S.day) { return this.dIdx(d) < 5; },
  hhmm(m) { m = ((Math.round(m) % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; },
  year() { return typeof Y5 === 'function' ? Y5() : Math.floor((S.day - 1) / 84); },
  kids() { return (typeof Social !== 'undefined' && Social.st().kids) || []; },
  inPhone() { const m = document.getElementById('modal'); return !!(m && m.classList.contains('phone')); },
  busy() {
    if (G.driving) { UI.toast('ลงจากรถก่อน', '🚗'); return true; }
    if (G.inMine) { UI.toast('ออกจากเหมืองก่อน', '⛏️'); return true; }
    if (G.sleeping) return true;
    return false;
  },
  // where the player really is (rooms and the house sit far away from the map)
  here() {
    if (G.inRoom && typeof Rooms !== 'undefined' && Rooms.cur) { const b = Rooms.cur.back; return { x: b.x, z: b.z, away: b.away || null }; }
    if (G.away) return { x: G.player.pos.x, z: G.player.pos.z, away: G.away };
    if (G.inside && World.houseDoor) return { x: World.houseDoor.x, z: World.houseDoor.z, away: null };
    return { x: G.player.pos.x, z: G.player.pos.z, away: null };
  },
  mainWorld(p) { return Math.abs(p.x) < 1500 && Math.abs(p.z) < 1500; },

  // ================= HOSPITAL =================
  hospitals() {
    return World.pois.filter(p => p.kind === 'act' && this.mainWorld(p) && (/โรงพยาบาล/.test(p.label) || p.label === 'คลินิก')).map(p => ({ n: this.hName(p.label), x: p.x, z: p.z }));
  },
  hName(label) { return label === 'คลินิก' || !label ? 'โรงพยาบาลสุขใจ' : /โรงพยาบาล/.test(label) ? label : 'โรงพยาบาลสุขใจ'; },
  curHosp() {
    if (G.inRoom && typeof Rooms !== 'undefined' && Rooms.cur && Rooms.cur.def) return this.hName(Rooms.cur.def.title);
    const p = G.player.pos; let best = null, bd = 1e9;
    for (const q of World.pois) if (q.kind === 'act' && (/โรงพยาบาล/.test(q.label) || q.label === 'คลินิก')) { const d = Math.hypot(q.x - p.x, q.z - p.z); if (d < bd) { bd = d; best = q; } }
    return this.hName(best && best.label);
  },
  mainRight() { return typeof Ins !== 'undefined' && Ins.rights ? Ins.rights() : 'ucs'; },
  rights() { const L = [this.mainRight()]; if (typeof Ins !== 'undefined' && Ins.has && Ins.has('health')) L.push('ins'); L.push('self'); return L; },
  right() { const c = this.st(), L = this.rights(); return L.includes(c.right) ? c.right : L[0]; },
  // which part of the day the hospital serves this service: 'office' | 'after' | null (closed)
  slot(k) {
    const h = this.hour(), wd = this.weekday(), w = CV_HOS[k].when;
    if (w === 'er') return 'office';
    if (window.Hours36) return Hours36.hospSlot(w, h, wd);
    const office = wd && h >= 8 && h < 16;
    if (office) return 'office';
    if (w === 'opd' && ((wd && h >= 16 && h < 20) || (!wd && h >= 8 && h < 12))) return 'after';
    return null;
  },
  cost(k, right, hosp) {
    const X = CV_HOS[k], c = this.st(); let pay, why = '';
    if (right === 'self') pay = X.price;
    else if (right === 'ins') { pay = X.ins ? 0 : X.price; if (!X.ins) why = 'ประกันเอกชนไม่คุ้มครองบริการนี้'; }
    else if (right === 'sso' && k !== 'er' && c.ssoH && hosp && c.ssoH !== hosp) { pay = X.price; why = `ไม่ใช่ รพ.ตามสิทธิ (${c.ssoH})`; }
    else {
      const v = X.c[right];
      if (v === 'dent') pay = c.dentY === this.year() ? X.price : Math.max(0, X.price - 900);
      else if (v === 'flu') pay = S.chronic ? 0 : 600;
      else pay = +v || 0;
      if (k === 'er' && S.sick === 2) { pay = 0; why = 'ผู้ป่วยวิกฤต รักษาฟรี (UCEP)'; }
    }
    if (this.slot(k) === 'after') { pay += 150; why = (why ? why + ' · ' : '') + 'ค่าบริการนอกเวลาราชการ 150 ฿'; }
    return { pay: this.money(pay), why };
  },
  // can this service be used right now? returns a reason string when not
  block(k) {
    const c = this.st();
    if (!this.slot(k)) return window.Hours36 ? Hours36.hospText(CV_HOS[k].when) : CV_HOS[k].when === 'opd' ? 'เปิด จ-ศ 08:00–20:00 · ส-อา 08:00–12:00' : 'เปิดเฉพาะ จ-ศ 08:00–16:00';
    if (k === 'anc' && !(typeof Social !== 'undefined' && Social.st().baby > 0)) return 'สำหรับคู่ชีวิตที่ตั้งครรภ์';
    if (k === 'refill' && !S.chronic) return 'สำหรับผู้มีโรคประจำตัว';
    if (k === 'dental' && c.dentY === this.year()) return 'ทำฟันไปแล้วปีนี้';
    if (k === 'checkup' && S.checkY === this.year()) return 'ตรวจสุขภาพไปแล้วปีนี้';
    if (k === 'physio' && c.physioDay === S.day) return 'ทำกายภาพไปแล้ววันนี้';
    if (k === 'mental' && c.mentalDay === S.day) return 'พบผู้เชี่ยวชาญไปแล้ววันนี้';
    if (k === 'eye' && c.glasses) return 'มีแว่นสายตาแล้ว';
    if (k === 'vflu' && S.vax > S.day) return `ฉีดแล้ว คุ้มกันถึง${RD(S.vax)}`;
    if (k === 'vden' && typeof RL !== 'undefined' && RL.st().dengueSafe > S.day + 14) return `ฉีดแล้ว คุ้มกันถึง${RD(RL.st().dengueSafe)}`;
    return '';
  },
  wait(k, hosp) {
    const h = this.hour(), c = this.st();
    if (c.appt.some(a => a.day === S.day && a.k === k && (!a.h || a.h === hosp))) return 15;
    if (k === 'er') return S.sick === 2 ? 5 : S.sick ? 40 : 100;
    const base = h < 10 ? 110 : h < 12 ? 75 : h < 16 ? 45 : 30;
    return Math.round(base * (0.7 + Math.random() * 0.6));
  },
  hospUI() {
    this.atHosp = this.curHosp(); this.st();
    UI.open(this.atHosp, ['บริการ', 'บัตร สิทธิ & นัด'], tab => tab === 1 ? this.cardHTML(true) : this.hospHTML(), {});
    UI.cur.onClose = () => { this.atHosp = null; };
  },
  rightChips() {
    const r = this.right();
    return `<div class="row topics">${this.rights().map(k => `<button class="btn ${k === r ? '' : 'ghost'}" data-a="cvright" data-v="${k}">${k === r ? '✅ ' : ''}${CV_RIGHTS[k]}</button>`).join('')}</div>`;
  },
  hospHTML() {
    const H = this.atHosp, c = this.st(), r = this.right(), first = !c.hn[H];
    const status = S.sick === 2 ? '🤒 ป่วยหนัก ควรไปห้องฉุกเฉิน' : S.sick ? '🤒 กำลังป่วย' : '🙂 สุขภาพปกติ';
    return `<p class="lead">🕐 ${this.hhmm(S.time)} · ${status}${first ? ' · 🆕 มาครั้งแรก ต้องทำบัตรผู้ป่วยก่อน (เพิ่ม 20 นาที ฟรี)' : ` · บัตรผู้ป่วย ${c.hn[H]}`}<br>เลือกสิทธิรักษาที่จะใช้:</p>${this.rightChips()}
      <div class="grid">${Object.keys(CV_HOS).map(k => { const X = CV_HOS[k], b = this.block(k), q = this.cost(k, r, H); return `<div class="card"><div class="ci">${X.i}</div><div class="cb"><h4>${X.n}</h4><p class="dim">${X.d}</p><p>${b ? '⛔ ' + b : `จ่าย ${q.pay ? baht(q.pay) : 'ฟรี'}${q.pay !== X.price && X.price ? ` (ราคาเต็ม ${baht(X.price)})` : ''}${q.why ? ' · ' + q.why : ''}`}</p><div class="row"><button class="btn" data-a="cvsvc" data-k="${k}" ${b || S.money < q.pay ? 'disabled' : ''}>รับบัตรคิว</button></div></div></div>`; }).join('')}
        <div class="card"><div class="ci">💆</div><div class="cb"><h4>คลินิกด่วน & นวดแผนไทย</h4><p class="dim">บริการเดิมของหมอนิด: รักษาด่วน ฉีดวัคซีน นวดคลายเครียด</p><div class="row"><button class="btn ghost" data-a="cvold">เปิดคลินิกด่วน</button></div></div></div></div>`;
  },
  visit(k) {
    const X = CV_HOS[k], H = this.atHosp, c = this.st(); if (!X || !H) { UI.toast('ต้องมาที่โรงพยาบาลก่อน', '🏥'); return; }
    if (G.driving) { UI.toast('ลงจากรถก่อน', '🚗'); return; }
    const b = this.block(k); if (b) { UI.toast(b, '⛔'); return; }
    let r = this.right(); const q = this.cost(k, r, H);
    if (S.money < q.pay) { UI.toast(`เงินไม่พอ ต้องใช้ ${baht(q.pay)}`, '💸'); return; }
    if (r === 'sso' && !c.ssoH) c.ssoH = H;
    const first = !c.hn[H]; if (first) c.hn[H] = `HN ${String(60 + (S.day % 10)).padStart(2, '0')}-${String(100000 + ((Math.random() * 899999) | 0)).slice(0, 6)}`;
    const w = this.wait(k, H) + (first ? 20 : 0), hasAppt = c.appt.findIndex(a => a.day === S.day && a.k === k && (!a.h || a.h === H));
    if (hasAppt >= 0) c.appt.splice(hasAppt, 1);
    const qn = X.q + String(Math.max(1, Math.round((this.hour() - 7) * 14 + Math.random() * 9))).padStart(3, '0');
    UI.close(); this.atHosp = H;
    UI.toast(`${first ? 'ทำบัตรผู้ป่วยใหม่แล้ว · ' : ''}รับบัตรคิว ${qn} รอประมาณ ${w} นาที`, '🎫');
    fade(() => {
      tick(w + X.min);
      if (!this.pay(q.pay, `${H}: ${X.n}`)) return;
      const out = this.effect(k, r) || '';
      c.hist.unshift({ d: S.day, t: `${X.i} ${X.n} · ${H}`, p: q.pay, r }); c.hist.length = Math.min(c.hist.length, 20);
      UI.toast(`${X.n} เสร็จแล้ว · ใช้สิทธิ${CV_RIGHTS[r]} จ่าย ${q.pay ? baht(q.pay) : 'ฟรี'}${out ? ' · ' + out : ''}`, X.i);
      if (typeof Prog !== 'undefined') Prog.add(3);
      this.atHosp = null;
    });
  },
  // what the visit does; returns a short result text
  effect(k, r) {
    const c = this.st(), mx = maxEnergy();
    const cure = () => { const was = S.sick; S.sick = 0; S.sickDays = 0; this.sickLeave(); return was; };
    switch (k) {
      case 'opd': {
        if (S.sick === 2) { tick(120); cure(); S.energy = Math.min(mx, S.energy + 30); this.book('opd', 7, this.atHosp); return 'อาการหนัก หมอให้น้ำเกลือและสังเกตอาการ 2 ชม. นัดติดตามอาการอีก 7 วัน'; }
        if (S.sick) { cure(); S.energy = Math.min(mx, S.energy + 25); this.book('opd', 5, this.atHosp); return 'ได้ยาและใบรับรองแพทย์ นัดติดตามอาการอีก 5 วัน'; }
        S.mood = Math.min(100, (S.mood || 50) + 3); return 'ไม่พบความผิดปกติ หมอแนะนำให้ดื่มน้ำและนอนให้พอ';
      }
      case 'er': {
        if (S.sick === 2) {
          const ipd = r === 'self' ? 3500 : r === 'ins' ? 0 : 0; tick(480); cure(); S.energy = mx;
          if (ipd) this.charge(ipd, 'ค่านอนโรงพยาบาล (IPD)');
          return `นอนโรงพยาบาล 1 คืน หายดีแล้ว${ipd ? ` ค่าห้องและค่ายา ${baht(ipd)}` : ' ค่ารักษาผู้ป่วยในฟรีตามสิทธิ'}`;
        }
        if (S.sick) { cure(); S.energy = Math.min(mx, S.energy + 40); return 'ให้ยาและน้ำเกลือ อาการดีขึ้น'; }
        S.energy = Math.max(S.energy, Math.round(mx * 0.5)); return 'คัดกรองเป็นผู้ป่วยไม่ฉุกเฉิน (สีเขียว) ครั้งหน้าใช้ OPD จะรอน้อยกว่า';
      }
      case 'dental': c.dentY = this.year(); S.mood = Math.min(100, (S.mood || 50) + 4); return 'ฟันสะอาด ไม่มีฟันผุ ทำฟันได้อีกครั้งปีหน้า';
      case 'eye': c.glasses = 1; S.mood = Math.min(100, (S.mood || 50) + 5); return 'สายตาสั้นเล็กน้อย ได้แว่นใหม่ มองไกลชัดขึ้น';
      case 'checkup': {
        S.checkY = this.year(); S.mood = Math.min(100, (S.mood || 50) + 5);
        if (S.chronic) return `ตรวจพบ${S.chronic} ควบคุมได้ดีถ้ากินยาสม่ำเสมอ`;
        if (S.day > 60 && Math.random() < 0.15) { c.risk = 1; return 'ค่าน้ำตาลเริ่มสูง (ภาวะเสี่ยงเบาหวาน) ลดหวานและออกกำลังกาย'; }
        return 'ผลตรวจปกติดี แข็งแรง';
      }
      case 'vflu': S.vax = S.day + 28; return 'คุ้มกันไข้หวัดจากการตากฝน 28 วัน';
      case 'vden': if (typeof RL !== 'undefined') RL.st().dengueSafe = S.day + 56; return 'ลดความเสี่ยงไข้เลือดออก 56 วัน';
      case 'lab': return S.chronic ? `ผลเลือดเข้ากับ${S.chronic} หมอปรับยาให้` : c.risk ? 'น้ำตาลสูงกว่าปกติเล็กน้อย ควรคุมอาหาร' : (S.hunger > 85 ? 'ค่าน้ำตาลสูงเพราะเพิ่งกินอาหาร ครั้งหน้าควรงดอาหารก่อนตรวจ' : 'ผลเลือดปกติทุกค่า');
      case 'xray': return typeof RL !== 'undefined' && RL.on && RL.on('pm25') ? 'ปอดปกติ แต่ช่วงฝุ่น PM2.5 ควรใส่หน้ากาก N95' : 'ปอดปกติดี';
      case 'physio': c.physioDay = S.day; S.energy = Math.min(mx, S.energy + 30); S.mood = Math.min(100, (S.mood || 50) + 8); return 'ปวดหลังทุเลา พลังงาน +30';
      case 'anc': c.anc = (c.anc || 0) + 1; S.mood = Math.min(100, (S.mood || 50) + 10); if (typeof Life2 !== 'undefined') Life2.note('พาคู่ชีวิตไปฝากครรภ์ 🤰'); return 'ลูกในครรภ์แข็งแรงดี ได้สมุดสีชมพูและวิตามินบำรุง';
      case 'mental': c.mentalDay = S.day; S.mood = Math.min(100, (S.mood || 50) + 25); return 'ได้ระบายความเครียด รู้สึกเบาใจขึ้น อารมณ์ +25';
      case 'refill': addItem('pills', 14); this.book('refill', 14, this.atHosp); return 'รับยา 14 วัน นัดรับยาครั้งต่อไปอีก 14 วัน';
      case 'cert': c.medcert = S.day + 30; return `ได้ใบรับรองแพทย์ ใช้ได้ถึง${RD(c.medcert)}`;
    }
    return '';
  },
  // with a doctor's certificate, today's work shift becomes sick leave automatically
  sickLeave() {
    if (typeof Career === 'undefined' || !Career.C() || !Career.shift(S.day)) return;
    const j = Career.st(); if (j.done[S.day] || j.onLeave[S.day] || !(j.leave && j.leave.sick > 0)) return;
    Career.leave('sick', S.day);
  },
  nextWorkday(after) { let d = S.day + Math.max(1, after); while (!this.weekday(d)) d++; return d; },
  book(k, after, h) {
    const c = this.st(), day = this.nextWorkday(after);
    if (c.appt.some(a => a.k === k && a.day >= S.day)) return;
    c.appt.push({ day, k, h: h || c.home || 'โรงพยาบาลสุขใจ' }); c.appt.sort((a, b) => a.day - b.day); c.appt.length = Math.min(c.appt.length, 6);
  },
  bookUser(k) {
    const c = this.st(); if (!CV_HOS[k]) return;
    if (c.appt.some(a => a.k === k && a.day >= S.day)) { UI.toast('มีนัดบริการนี้อยู่แล้ว', '📅'); return; }
    const h = c.home || 'โรงพยาบาลสุขใจ'; this.book(k, 1, h);
    const a = c.appt.find(x => x.k === k); UI.toast(`จองคิว${CV_HOS[k].n} ที่${h} ${RD(a ? a.day : '-')} เช้า (ไปถึงแล้วรอแค่ 15 นาที)`, '📅');
  },
  cardHTML(inPerson) {
    const c = this.st(), r = this.right(), mr = this.mainRight(), H = this.atHosp;
    const hn = Object.entries(c.hn);
    return `<div class="card"><div class="ci">🪪</div><div class="cb"><h4>${esc(S.name || 'ผู้ป่วย')} · สิทธิหลัก: ${CV_RIGHTS[mr]}</h4><p class="dim">${mr === 'ucs' ? 'ใช้บัตรประชาชนใบเดียว รักษาได้ทุกหน่วยบริการ' : mr === 'sso' ? `ผู้ประกันตนจากงานประจำ · รพ.ตามสิทธิ: ${c.ssoH ? esc(c.ssoH) : 'ยังไม่ได้เลือก (เลือกอัตโนมัติเมื่อใช้ครั้งแรก)'}` : 'ข้าราชการและครอบครัว เบิกจ่ายตรง ไม่ต้องสำรองจ่าย'}${typeof Ins !== 'undefined' && Ins.has && Ins.has('health') ? ' · มีประกันสุขภาพเอกชน' : ''}</p>
        <p class="dim">${S.chronic ? `โรคประจำตัว: ${S.chronic} · ` : ''}${S.vax > S.day ? `วัคซีนไข้หวัดถึง${RD(S.vax)} · ` : ''}${c.glasses ? 'ใส่แว่นสายตา · ' : ''}ตรวจสุขภาพปีนี้: ${S.checkY === this.year() ? 'ตรวจแล้ว' : 'ยังไม่ตรวจ'}${c.medcert >= S.day ? ` · ใบรับรองแพทย์ใช้ได้ถึง${RD(c.medcert)}` : ''}</p>
        ${hn.length ? `<p class="dim">บัตรผู้ป่วย: ${hn.map(([h, n]) => `${esc(h)} (${esc(n)})`).join(' · ')}</p>` : '<p class="dim">ยังไม่มีบัตรผู้ป่วย ทำบัตรได้เมื่อไปโรงพยาบาลครั้งแรก</p>'}
        ${inPerson && mr === 'sso' && H && c.ssoH && c.ssoH !== H ? `<div class="row"><button class="btn ghost" data-a="cvsso" ${c.ssoY === this.year() ? 'disabled' : ''}>ย้าย รพ.ตามสิทธิมาที่นี่ (ปีละครั้ง)</button></div>` : ''}</div></div>
      <h5>📅 นัดหมาย</h5>${c.appt.length ? c.appt.map((a, i) => `<p class="lead">${a.day === S.day ? '🔔 วันนี้' : `${RD(a.day)}`} · ${CV_HOS[a.k] ? CV_HOS[a.k].i + ' ' + CV_HOS[a.k].n : esc(a.k)} · ${esc(a.h || '')} <button class="btn ghost" data-a="cvcancel" data-i="${i}">ยกเลิก</button></p>`).join('') : '<p class="lead">ไม่มีนัด</p>'}
      <h5>🧾 ประวัติการรักษา</h5>${c.hist.length ? c.hist.slice(0, 8).map(h => `<p class="lead">${RD(h.d)} · ${esc(h.t)} · ${h.p ? baht(h.p) : 'ฟรี'}</p>`).join('') : '<p class="lead">ยังไม่มีประวัติ</p>'}`;
  },
  tele() {
    const r = this.right(), fee = r === 'self' ? 350 : r === 'ins' ? 0 : r === 'ucs' ? 0 : 200;
    if (S.sick === 2) { UI.toast('อาการหนัก แพทย์ออนไลน์แนะนำให้ไปห้องฉุกเฉินหรือโทร 1669 ทันที', '🚑'); return; }
    if (S.money < fee) { UI.toast(`ค่าปรึกษา ${baht(fee)}`, '💸'); return; }
    const c = this.st(); if (c.teleDay === S.day) { UI.toast('ปรึกษาแพทย์ออนไลน์ไปแล้ววันนี้', '📱'); return; }
    c.teleDay = S.day; Phone.app = null; UI.close();
    fade(() => {
      tick(30); if (!this.pay(fee, 'พบแพทย์ออนไลน์')) return;
      let out = 'หมอแนะนำให้พักผ่อน ดื่มน้ำมาก ๆ';
      if (S.sick) { S.sick = 0; S.sickDays = 0; this.sickLeave(); out = 'หมอวินิจฉัยไข้หวัด ส่งยาถึงบ้านทางไปรษณีย์ หายป่วยแล้ว'; }
      c.hist.unshift({ d: S.day, t: '📱 พบแพทย์ออนไลน์ (เทเลเมดิซีน)', p: fee, r }); c.hist.length = Math.min(c.hist.length, 20);
      UI.toast(`${out} · ${fee ? baht(fee) : 'ฟรีตามสิทธิ'}`, '📱');
    });
  },
  hospApp() {
    const c = this.st(), near = this.nearest(this.hospitals());
    const bookable = ['opd', 'dental', 'eye', 'checkup', 'lab', 'physio', 'mental', 'vflu'].concat(typeof CV24_BOOK !== 'undefined' ? CV24_BOOK : []);
    return `<p class="lead">🏥 หมอสุขใจ · ${S.sick === 2 ? '🤒 ป่วยหนัก ไป ER หรือโทร 1669' : S.sick ? '🤒 กำลังป่วย ปรึกษาหมอออนไลน์ได้' : '🙂 สุขภาพปกติ'}</p>
      <div class="grid"><div class="card"><div class="ci">📱</div><div class="cb"><h4>พบแพทย์ออนไลน์ 24 ชม.</h4><p class="dim">อาการทั่วไป ไข้ หวัด ส่งยาถึงบ้าน · บัตรทองฟรี · ใช้เวลา 30 นาที</p><div class="row"><button class="btn" data-a="cvtele">ปรึกษาหมอ</button><button class="btn danger" data-a="dial" data-v="1669">🚑 1669</button></div></div></div>
      <div class="card"><div class="ci">🚕</div><div class="cb"><h4>ไปโรงพยาบาล</h4><p class="dim">${near ? `ใกล้สุด: ${esc(near.n)} ห่าง ${this.km(this.here(), near).toFixed(1)} กม.` : 'ไม่พบโรงพยาบาลบนแผนที่'}</p><div class="row">${near ? `<button class="btn" data-a="cvride" data-x="${near.x}" data-z="${near.z}" data-n="${esc(near.n)}" data-m="car">เรียกรถไป ${baht(this.quote(this.km(this.here(), near), 'car').fare)}</button>` : ''}</div></div></div></div>
      <h5>📅 จองคิวล่วงหน้า (${esc(c.home || 'โรงพยาบาลสุขใจ')})</h5><div class="row topics">${bookable.map(k => `<button class="btn ghost" data-a="cvbook" data-k="${k}">${CV_HOS[k].i} ${CV_HOS[k].n}</button>`).join('')}</div>
      <div class="row topics">${['โรงพยาบาลสุขใจ'].concat(this.hospitals().map(h => h.n)).filter((v, i, a) => a.indexOf(v) === i).map(h => `<button class="btn ${h === (c.home || 'โรงพยาบาลสุขใจ') ? '' : 'ghost'}" data-a="cvhome" data-v="${esc(h)}">🏥 ${esc(h)}</button>`).join('')}</div>
      ${this.cardHTML(false)}`;
  },

  // ================= SCHOOL =================
  // kid's age in years from days lived (school-age stage of the game spans ป.1–ม.3 exactly)
  yrs(k) {
    if (window.Kid182) return Kid182.age(k);
    const d = Math.max(0, S.day - (+k.born || S.day));
    if (d < 14) return d * 6 / 14;
    if (d < 42) return 6 + (d - 14) * 9 / 28;
    if (d < 70) return 15 + (d - 42) * 3 / 28;
    if (d < 84) return 18 + (d - 70) * 4 / 14;
    return 22 + (d - 84) / 21;
  },
  kst(k) { const c = this.st(); return c.kids[k.name] || null; },
  enrolled(k) { const e = this.kst(k); return !!((e && e.on) || k.school); },
  // level by age (track chosen at 15: hs or voc)
  level(k) {
    const y = this.yrs(k), e = this.kst(k);
    if (y < 2) return null; if (y < 3) return 'ecd'; if (y < 6) return 'k'; if (y < 12) return 'p'; if (y < 15) return 'm';
    if (y < 18) return e && e.track ? e.track : 'hs?'; return 'done';
  },
  gradeName(k) {
    const y = this.yrs(k), lv = this.level(k); if (!lv || lv === 'done' || lv === 'hs?') return '';
    const L = CV_LV[lv]; if (lv === 'ecd') return L.n;
    const g = lv === 'k' ? Math.floor(y - 3) + 1 : lv === 'p' ? Math.floor(y - 6) + 1 : lv === 'm' ? Math.floor(y - 12) + 1 : Math.floor(y - 15) + 1;
    return `${L.g}${Math.min(lv === 'p' ? 6 : 3, Math.max(1, g))}`;
  },
  compulsory(k) { const y = this.yrs(k); return y >= 6 && y < 15; },
  enrol(name) {
    const k = this.kids().find(x => x.name === name); if (!k) return;
    const lv = this.level(k); if (!lv || lv === 'done') { UI.toast('ยังไม่ถึงวัยเข้าเรียน', '🎒'); return; }
    const c = this.st(); const e = c.kids[name] = c.kids[name] || { on: 0, track: null, bus: 0, lunch: 1, tutor: 0, gpa: null, gpas: [], told: {} };
    if (lv === 'hs?') { UI.toast('เลือก ม.4 หรือ ปวช. ก่อน', '🎓'); return; }
    e.on = 1; e.at = S.day; if (!k.school && ['p', 'm', 'hs', 'voc'].includes(lv)) k.school = 'gov';
    delete c.warn[name];
    UI.toast(`มอบตัว${k.name}เข้าเรียน${this.gradeName(k) || CV_LV[lv].n}แล้ว · เรียนฟรีตามนโยบายเรียนฟรี 15 ปี`, '🎒');
    if (typeof Life2 !== 'undefined') Life2.note(`พา${k.name}ไปมอบตัวเข้าเรียน${this.gradeName(k)}`);
  },
  track(name, v) {
    const k = this.kids().find(x => x.name === name); if (!k || !['hs', 'voc'].includes(v)) return;
    const c = this.st(), e = c.kids[name] = c.kids[name] || { on: 0, track: null, bus: 0, lunch: 1, tutor: 0, gpa: null, gpas: [], told: {} };
    e.track = v; e.on = 1; if (!k.school) k.school = 'gov';
    UI.toast(`${k.name}เรียนต่อ${CV_LV[v].n}แล้ว`, CV_LV[v].i);
  },
  opt(name, o) { const e = this.st().kids[name]; if (!e || !CV_OPTS[o]) return; e[o] = e[o] ? 0 : 1; UI.toast(`${CV_OPTS[o].n}: ${e[o] ? 'สมัครแล้ว' : 'ยกเลิกแล้ว'}`, CV_OPTS[o].i); },
  optFee(k, o) { const lv = this.level(k); if (o === 'lunch' && ['ecd', 'k', 'p'].includes(lv)) return 0; return CV_OPTS[o].wk; },
  kidsHTML(inPerson) {
    const L = this.kids(); const c = this.st();
    if (!L.length) return '<p class="empty">ยังไม่มีลูก · เมื่อมีลูก จะพามาเข้าเรียนที่นี่ได้ (ภาคบังคับ ป.1–ม.3 ตามกฎหมาย)</p>';
    return `<p class="lead">📜 การศึกษาภาคบังคับ 9 ปี (ป.1–ม.3) ผู้ปกครองต้องส่งลูกเข้าเรียน · เรียนฟรี 15 ปี (อนุบาล–ม.6/ปวช.) รัฐอุดหนุนค่าเล่าเรียน หนังสือ เครื่องแบบ อุปกรณ์ และกิจกรรม · ประถมได้อาหารกลางวันและนมฟรี</p><div class="grid">${L.map(k => {
      const lv = this.level(k), e = c.kids[k.name], on = this.enrolled(k), y = this.yrs(k), nm = esc(k.name);
      const age = `${Math.floor(y)} ${y < 15 ? 'ขวบ' : 'ปี'}`;
      let body = '';
      if (!lv) body = '<p class="dim">ยังเล็ก อยู่บ้านกับพ่อแม่ (เข้าศูนย์เด็กเล็กได้ตอน 2 ขวบ)</p>';
      else if (lv === 'done') body = '<p class="dim">จบการศึกษาขั้นพื้นฐานแล้ว (เรื่องมหาวิทยาลัยดูในแอปครอบครัว)</p>';
      else if (lv === 'hs?') body = `<p class="dim">จบ ม.3 แล้ว 🎉 เลือกเส้นทางต่อ</p><div class="row"><button class="btn" data-a="cvtrack" data-n="${nm}" data-v="hs">📗 ม.4 สายสามัญ</button><button class="btn" data-a="cvtrack" data-n="${nm}" data-v="voc">🛠️ ปวช. สายอาชีพ</button></div>`;
      else if (!on) body = `<p class="dim">${this.compulsory(k) ? '⚠️ อยู่ในวัยภาคบังคับ ต้องเข้าเรียน' : 'ไม่บังคับ แต่ช่วยพัฒนาการ'} · ระดับ ${CV_LV[lv].n}</p><div class="row"><button class="btn" data-a="cvenrol" data-n="${nm}">มอบตัวเข้าเรียน (ฟรี)</button></div>`;
      else body = `<p class="dim">${k.school === 'inter' ? 'โรงเรียนนานาชาติ' : 'โรงเรียนบ้านสุขใจ (รัฐ)'} · ${this.gradeName(k) || CV_LV[lv].n}${e && e.gpa != null ? ` · เกรดเฉลี่ยล่าสุด ${e.gpa.toFixed(2)}` : ''}${e && e.sch ? ` · ได้ทุนแล้ว ${e.sch} ครั้ง` : ''} · ความรู้ ${k.edu || 0}</p>
        ${e && lv !== 'ecd' ? `<div class="row topics">${Object.entries(CV_OPTS).map(([o, X]) => { const f = this.optFee(k, o); return `<button class="btn ${e[o] ? '' : 'ghost'}" data-a="cvopt" data-n="${nm}" data-v="${o}">${e[o] ? '✅' : X.i} ${X.n} ${f ? baht(f) + '/สัปดาห์' : 'ฟรี'}</button>`; }).join('')}</div>` : ''}`;
      return `<div class="card"><div class="ci">${lv && CV_LV[lv] ? CV_LV[lv].i : '👶'}</div><div class="cb"><h4>${nm} · ${age}</h4>${body}</div></div>`;
    }).join('')}</div>${inPerson ? '' : '<p class="lead">💡 สมัครเรียนออนไลน์ได้ แต่ประชุมผู้ปกครองต้องไปที่โรงเรียน</p>'}`;
  },
  meetHTML(inPerson) {
    const c = this.st(), m = c.meet, h = this.hour();
    const term = Math.floor((S.day - 1) / 14), tDay = (S.day - 1) % 14 + 1;
    let s = `<p class="lead">📆 ภาคเรียนที่ ${term % 2 + 1} · สัปดาห์ที่ ${tDay <= 7 ? 1 : 2} (วันที่ ${tDay}/14 ของเทอม) · สมุดพกออกวันสุดท้ายของเทอม</p>`;
    if (m && !m.done && m.day >= S.day) s += `<div class="card"><div class="ci">👨‍👩‍👧</div><div class="cb"><h4>ประชุมผู้ปกครอง${RD(m.day)} เวลา 09:00–15:00</h4><p class="dim">คุยกับครูประจำชั้นเรื่องการเรียนและความประพฤติ · ลูกมีกำลังใจ ความรู้ +1</p><div class="row"><button class="btn" data-a="cvmeet" ${inPerson && m.day === S.day && h >= 9 && h < 15 ? '' : 'disabled'}>${inPerson ? (m.day === S.day ? 'เข้าร่วมประชุม (2 ชม.)' : 'ยังไม่ถึงวันประชุม') : 'ต้องไปที่โรงเรียน'}</button></div></div></div>`;
    else s += '<p class="lead">ยังไม่มีประชุมผู้ปกครอง (จัดต้นเทอมทุกเทอม)</p>';
    const rows = this.kids().map(k => ({ k, e: c.kids[k.name] })).filter(o => o.e && o.e.gpas && o.e.gpas.length);
    s += `<h5>📒 สมุดพก (ผลการเรียน)</h5>${rows.length ? rows.map(({ k, e }) => `<p class="lead">${esc(k.name)}: ${e.gpas.slice(-4).map(g => g.toFixed(2)).join(' → ')}</p>`).join('') : '<p class="lead">ยังไม่มีผลการเรียน</p>'}
      <h5>🎓 ทุนการศึกษา</h5><p class="lead">ทุนเรียนดี: เกรดเฉลี่ย 3.50 ขึ้นไป รับ 2,000 ฿/เทอม · ทุนเสมอภาค (กสศ.): ครอบครัวรายได้น้อย เด็กวัยภาคบังคับ รับ 1,500 ฿/เทอม · พิจารณาอัตโนมัติตอนออกสมุดพก</p>`;
    return s;
  },
  adultHTML(inPerson) {
    const c = this.st(), ed = c.ed, h = this.hour();
    const certs = ['วุฒิ ม.3 (ภาคบังคับ)'].concat(ed.certs.map(k => (Object.values(CV_ADULT).find(a => a.cert === k) || { cn: k }).cn));
    let s = `<p class="lead">🎓 วุฒิของคุณ: ${certs.join(' · ')}<br>มีวุฒิ ม.6 หรือ ปวช. แล้วสมัครงานพนักงานธนาคาร ครู พยาบาล ได้เร็วขึ้น (ลดเกณฑ์เลเวลลง 1)</p><div class="grid">`;
    for (const [k, A] of Object.entries(CV_ADULT)) {
      const done = ed.certs.includes(A.cert), cur = ed.prog === k, open = A.days.includes(this.dIdx()) && h >= A.h0 && h < A.h1 - 2;
      let act = '';
      if (done) act = '<p>✅ เรียนจบแล้ว</p>';
      else if (!cur) act = `<div class="row"><button class="btn" data-a="cvadult" data-v="${k}" ${ed.prog || S.money < A.fee ? 'disabled' : ''}>${ed.prog ? 'กำลังเรียนหลักสูตรอื่น' : `สมัครเรียน${A.fee ? ' ' + baht(A.fee) : ' (ฟรี)'}`}</button></div>`;
      else if (ed.n >= A.need) act = `<p>เข้าเรียนครบ ${ed.n}/${A.need} ครั้ง พร้อมสอบ</p><div class="row"><button class="btn" data-a="cvexam" ${inPerson && ed.examDay !== S.day ? '' : 'disabled'}>${inPerson ? (ed.examDay === S.day ? 'สอบใหม่ได้พรุ่งนี้' : 'สอบปลายภาค') : 'สอบที่โรงเรียน'}</button></div>`;
      else act = `<p>เข้าเรียนแล้ว ${ed.n}/${A.need} ครั้ง</p><div class="row"><button class="btn" data-a="cvclass" ${inPerson && open && ed.last !== S.day ? '' : 'disabled'}>${!inPerson ? 'เรียนที่โรงเรียน' : ed.last === S.day ? 'เรียนแล้ววันนี้' : open ? 'เข้าเรียน 3 ชม. (พลังงาน 10)' : 'ยังไม่ถึงเวลาเรียน'}</button><button class="btn ghost" data-a="cvquit">ลาออก</button></div>`;
      s += `<div class="card"><div class="ci">${A.i}</div><div class="cb"><h4>${A.n}</h4><p class="dim">${A.d}</p>${act}</div></div>`;
    }
    return s + '</div>';
  },
  schoolUI() {
    this.atSchool = true; this.st();
    UI.open('โรงเรียนบ้านสุขใจ', ['ลูก ๆ', 'ผู้ใหญ่ กศน. & ปวช.', 'ประชุม สมุดพก & ทุน', 'คอร์สภาคค่ำ'], tab => tab === 0 ? this.kidsHTML(true) : tab === 1 ? this.adultHTML(true) : tab === 2 ? this.meetHTML(true)
      : '<p class="lead">ครูสมศรีเปิดคอร์สภาคค่ำระยะสั้น (ทำอาหาร ช่างยนต์ ภาษา เกษตร) เรียนครั้งเดียวได้ความสามารถถาวร</p><div class="row"><button class="btn" data-a="cvsold">ดูคอร์สภาคค่ำ</button></div>', {});
    UI.cur.onClose = () => { this.atSchool = false; };
  },
  schoolApp() {
    const t = this.stab || 0, tabs = ['ลูก ๆ', 'ผู้ใหญ่', 'ประชุม & ทุน'];
    return `<div class="row topics">${tabs.map((n, i) => `<button class="btn ${i === t ? '' : 'ghost'}" data-a="cvstab" data-v="${i}">${n}</button>`).join('')}</div>` + (t === 1 ? this.adultHTML(false) : t === 2 ? this.meetHTML(false) : this.kidsHTML(false));
  },
  adultEnrol(k) {
    const A = CV_ADULT[k], ed = this.st().ed; if (!A || ed.prog || ed.certs.includes(A.cert)) return;
    if (!this.pay(A.fee, 'ค่าเทอม ' + A.n)) return;
    ed.prog = k; ed.n = 0; ed.last = 0; UI.toast(`สมัคร${A.n}แล้ว · ${A.d}`, A.i);
  },
  attend() {
    const ed = this.st().ed, A = CV_ADULT[ed.prog]; if (!A || !this.atSchool) return;
    const h = this.hour(); if (ed.last === S.day || !A.days.includes(this.dIdx()) || h < A.h0 || h >= A.h1 - 2) { UI.toast('ยังไม่ถึงเวลาเรียน', '⏰'); return; }
    if (!useEnergy(10)) return;
    ed.last = S.day; UI.close();
    fade(() => { tick(180); ed.n++; if (typeof Prog !== 'undefined') Prog.add(8); UI.toast(`เข้าเรียน${A.n} ครั้งที่ ${ed.n}/${A.need}${ed.n >= A.need ? ' · พร้อมสอบปลายภาคแล้ว!' : ''}`, A.i); });
  },
  examStart() {
    const ed = this.st().ed, A = CV_ADULT[ed.prog]; if (!A || ed.n < A.need || ed.examDay === S.day || !this.atSchool) return;
    ed.examDay = S.day; const qs = CV_EXAM[ed.prog].slice().sort(() => Math.random() - 0.5).slice(0, 3);
    this.quiz = { i: 0, ok: 0, qs, k: ed.prog };
    UI.open(`สอบปลายภาค: ${A.n}`, null, () => {
      const q = this.quiz; if (!q) return '';
      if (q.i >= q.qs.length) return `<p class="lead">${q.ok >= 2 ? `🎉 สอบผ่าน! ได้รับ${A.cn}` : '❌ ยังไม่ผ่าน สอบใหม่ได้พรุ่งนี้'} (ถูก ${q.ok}/${q.qs.length})</p><div class="row"><button class="btn" data-a="close">ปิด</button></div>`;
      const [t, ch] = q.qs[q.i]; return `<p class="lead">ข้อ ${q.i + 1}/${q.qs.length}: ${t}</p>${ch.map((x, i) => `<button class="btn ghost choice" data-a="cvq" data-i="${i}">${x}</button>`).join('')}`;
    });
    UI.cur.onClose = () => { this.atSchool = false; };
  },
  answer(i) {
    const q = this.quiz; if (!q || q.i >= q.qs.length) return;
    if (+i === q.qs[q.i][2]) q.ok++; q.i++;
    if (q.i < q.qs.length) return;
    const ed = this.st().ed, A = CV_ADULT[q.k];
    if (q.ok >= 2 && A) {
      if (!ed.certs.includes(A.cert)) ed.certs.push(A.cert); ed.prog = null; ed.n = 0;
      if (A.cert === 'm6') ed.lv = 'm6';
      if (A.cert === 'voc') { S.perk = S.perk || {}; S.perk.mech = 1; }
      if (typeof Prog !== 'undefined') Prog.add(60); if (typeof Life2 !== 'undefined') Life2.note(`เรียนจบ ได้${A.cn} 🎓`);
      Phone.msg('โรงเรียนบ้านสุขใจ', `ยินดีด้วย! คุณสอบผ่านและได้รับ${A.cn} รับใบประกาศได้ที่ห้องธุรการ`, true);
    }
  },
  meet() {
    const c = this.st(), m = c.meet, h = this.hour(); if (!m || m.done || m.day !== S.day || h < 9 || h >= 15 || !this.atSchool) return;
    m.done = 1; UI.close();
    fade(() => {
      tick(120);
      for (const k of this.kids()) if (this.enrolled(k)) { k.joy = Math.min(100, (k.joy ?? 60) + 10); k.edu = (k.edu || 0) + 1; const e = c.kids[k.name]; if (e) e.met = 1; }
      if (typeof Prog !== 'undefined') Prog.add(5);
      UI.toast('ประชุมผู้ปกครองเสร็จ ครูชมว่าลูกตั้งใจเรียน ลูก ๆ ดีใจที่พ่อแม่มา', '👨‍👩‍👧');
    });
  },
  // daily school life: letters for children who should be in school, subsidies, weekly extras, report cards, scholarships
  schoolDay() {
    const c = this.st(), wd = this.weekday(), tDay = (S.day - 1) % 14, kids = this.kids();
    for (const k of kids) {
      const lv = this.level(k), e = c.kids[k.name], on = this.enrolled(k);
      if (this.compulsory(k) && !on) {
        const w = c.warn[k.name] = c.warn[k.name] || { first: S.day, n: 0 };
        if (w.n === 0) { w.n = 1; Phone.msg('โรงเรียนบ้านสุขใจ', `${k.name}อยู่ในวัยการศึกษาภาคบังคับแล้ว กรุณาพามามอบตัวเข้าเรียนที่โรงเรียนหรือสมัครในแอปการศึกษา`); }
        else if (w.n === 1 && S.day - w.first >= 4) { w.n = 2; Phone.msg('อบต.สุขใจ', `หนังสือเตือน: ${k.name}ยังไม่ได้เข้าเรียน ตาม พ.ร.บ.การศึกษาภาคบังคับ ผู้ปกครองต้องส่งเด็กเข้าเรียน หากไม่ดำเนินการภายใน 4 วันมีโทษปรับไม่เกิน 1,000 บาท`); }
        else if (w.n === 2 && S.day - w.first >= 8) { w.n = 3; const t = this.charge(1000, 'ค่าปรับ พ.ร.บ.การศึกษาภาคบังคับ'); Phone.msg('อบต.สุขใจ', `ปรับ ${baht(t)} เนื่องจากไม่ส่ง${k.name}เข้าเรียนตามกฎหมาย กรุณาพาเด็กไปมอบตัวโดยเร็ว`); }
        else if (w.n === 3 && S.day - w.first >= 22) { c.warn[k.name] = { first: S.day, n: 1 }; Phone.msg('อบต.สุขใจ', `${k.name}ยังไม่ได้เข้าเรียน เจ้าหน้าที่จะติดตามอีกครั้ง`); }
        if (wd && k.edu > 0) k.edu--; // the village school day counted it; the child actually stayed home
        continue;
      }
      if (on) delete c.warn[k.name];
      const ee = c.kids[k.name] = c.kids[k.name] || { on: on ? 1 : 0, track: null, bus: 0, lunch: 1, tutor: 0, gpa: null, gpas: [], told: {} };
      ee.told = ee.told || {}; ee.gpas = ee.gpas || [];
      if (lv && !ee.told[lv]) {
        ee.told[lv] = 1;
        if (lv === 'ecd' && !on) Phone.msg('อบต.สุขใจ', `${k.name}อายุ 2 ขวบแล้ว ฝากเลี้ยงที่ศูนย์พัฒนาเด็กเล็กได้ฟรี มีอาหารกลางวันและนม`, true);
        else if (lv === 'k' && !on) Phone.msg('โรงเรียนบ้านสุขใจ', `เปิดรับสมัครอนุบาล ${k.name}เข้าเรียนได้ฟรีตามนโยบายเรียนฟรี 15 ปี`, true);
        else if (lv === 'hs?') Phone.msg('โรงเรียนบ้านสุขใจ', `${k.name}จบ ม.3 แล้ว! เลือกเรียนต่อ ม.4 หรือ ปวช. ได้ในแอปการศึกษา`);
        else if (on && lv !== 'done') Phone.msg('โรงเรียนบ้านสุขใจ', `${k.name}เลื่อนชั้นขึ้น${CV_LV[lv] ? CV_LV[lv].n : ''}แล้ว`, true);
      }
      if (!on || !lv || lv === 'done' || lv === 'hs?') continue;
      if (wd && (lv === 'hs' || lv === 'voc')) k.edu = (k.edu || 0) + 1;
      if (wd && (lv === 'ecd' || lv === 'k')) k.joy = Math.min(100, (k.joy ?? 60) + 2);
      // Monday: weekly extras
      if (this.dIdx() === 0 && lv !== 'ecd') {
        let fee = 0; for (const o of Object.keys(CV_OPTS)) if (ee[o]) fee += this.optFee(k, o);
        if (fee) this.charge(fee, `ค่ารถ/อาหาร/เรียนพิเศษ ${k.name}`);
        if (ee.tutor) k.edu = (k.edu || 0) + 2;
        if (ee.bus || ee.lunch) k.joy = Math.min(100, (k.joy ?? 60) + 3);
      }
      // term start: เรียนฟรี 15 ปี cash for uniform and supplies
      if (tDay === 0 && CV_LV[lv]) { const sub = CV_LV[lv].sub; this.gift(sub, 'เงินอุดหนุนเรียนฟรี 15 ปี'); Phone.msg('โรงเรียนบ้านสุขใจ', `เปิดเทอมใหม่ ${k.name}ได้รับหนังสือเรียนฟรี และเงินอุดหนุนค่าเครื่องแบบและอุปกรณ์การเรียน ${baht(sub)} โอนเข้าบัญชีผู้ปกครองแล้ว`, true); ee.met = 0; }
      // term end: report card and scholarships
      if (tDay === 13 && !['ecd', 'k'].includes(lv)) {
        const g = Math.max(1, Math.min(4, 2.1 + (ee.tutor ? 0.5 : 0) + ((k.joy ?? 60) > 60 ? 0.3 : 0) + (k.skill || 0) * 0.1 + (ee.met ? 0.2 : 0) + (k.school === 'inter' ? 0.2 : 0) + (Math.random() - 0.5) * 0.8));
        ee.gpa = Math.round(g * 100) / 100; ee.gpas.push(ee.gpa); if (ee.gpas.length > 8) ee.gpas.shift();
        let msg = `สมุดพก${k.name} ชั้น${this.gradeName(k)} เกรดเฉลี่ย ${ee.gpa.toFixed(2)}`;
        if (ee.gpa >= 3.5) { this.gift(2000, 'ทุนเรียนดี'); ee.sch = (ee.sch || 0) + 1; msg += ' · ได้ทุนเรียนดี 2,000 ฿!'; }
        else if (this.compulsory(k) && S.money + (typeof Bank !== 'undefined' ? Bank.total() : 0) < 30000) { this.gift(1500, 'ทุนเสมอภาค กสศ.'); ee.sch = (ee.sch || 0) + 1; msg += ' · ได้ทุนเสมอภาค กสศ. 1,500 ฿'; }
        Phone.msg('โรงเรียนบ้านสุขใจ', msg);
      }
    }
    // parent meeting on day 3 of each term
    if (tDay === 0 && kids.some(k => this.enrolled(k))) { c.meet = { day: S.day + 2, done: 0 }; }
    if (c.meet && !c.meet.done && c.meet.day === S.day) Phone.msg('โรงเรียนบ้านสุขใจ', 'วันนี้มีประชุมผู้ปกครอง 09:00–15:00 ที่โรงเรียน เชิญผู้ปกครองทุกท่านค่ะ', true);
    if (c.meet && !c.meet.done && c.meet.day === S.day - 1) { c.meet.done = 1; for (const k of kids) if (this.enrolled(k)) k.joy = Math.max(0, (k.joy ?? 60) - 5); Phone.msg('ครูประจำชั้น', 'เมื่อวานผู้ปกครองไม่ได้มาประชุม ครูส่งเอกสารให้ทางแอปแล้วนะคะ', true); }
    // adult classes: idle too long and the course lapses
    const ed = c.ed; if (ed.prog && ed.last && S.day - ed.last > 21) { Phone.msg('โรงเรียนบ้านสุขใจ', `คุณขาดเรียน${CV_ADULT[ed.prog].n}นานเกินไป ถูกพ้นสภาพนักศึกษา สมัครใหม่ได้`); ed.prog = null; ed.n = 0; }
  },

  // ================= TRANSPORT =================
  km(a, b) { return Math.max(0.3, Math.hypot(a.x - b.x, a.z - b.z) / CV_KM); },
  nearest(L) { const h = this.here(); if (h.away) return null; let best = null, bd = 1e9; for (const p of L) { const d = Math.hypot(p.x - h.x, p.z - h.z); if (d < bd) { bd = d; best = p; } } return best; },
  surge() {
    const h = this.hour(), wd = this.weekday(); let m = 1; const why = [];
    if (wd && ((h >= 7 && h < 9) || (h >= 16.5 && h < 19))) { m *= 1.3; why.push('ชั่วโมงเร่งด่วน ×1.3'); }
    if (G.wx && G.wx.rain > 0.5) { m *= 1.2; why.push('ฝนตก ×1.2'); }
    if (h >= 22 || h < 5) { m *= 1.2; why.push('ค่าบริการกลางคืน +20%'); }
    m = Math.min(1.8, m);
    const fuel = typeof RL !== 'undefined' && RL.st ? (+RL.st().fuel || 1) : 1;
    return { m, fuel: 0.9 + 0.1 * U.clamp(fuel, 0.8, 1.4), why };
  },
  quote(km, mode) {
    const s = this.surge(), h = this.hour();
    if (mode === 'win') {
      if (km > 3) return { ok: false, why: 'วินรับเฉพาะระยะใกล้ไม่เกิน 3 กม.' };
      const fare = (km <= 1 ? 20 : km <= 2 ? 30 : 40) + (h >= 22 || h < 5 ? 10 : 0);
      return { ok: true, fare, min: 2 + Math.round(km * 2), wait: 1 };
    }
    if (mode === 'bike') {
      if (km > 15) return { ok: false, why: 'ไรด์มอเตอร์ไซค์รับไม่เกิน 15 กม.' };
      const fare = Math.round((20 + 6 * km) * s.m * s.fuel) + 5;
      return { ok: true, fare, min: Math.round(km * 2), wait: 3 + ((h >= 22 || h < 5) ? 5 : 0) };
    }
    const fare = Math.round((40 + 9 * km) * s.m * s.fuel) + 10;
    return { ok: true, fare, min: Math.round(km * 2.4), wait: 5 + ((h >= 22 || h < 5) ? 6 : 0) };
  },
  winZone(h) { const z = !h.away && zoneAt(h.x, h.z); return z && ['village', 'thong', 'phupha', 'seaside'].includes(z.id) ? z : null; },
  dests() {
    const seen = new Set(), L = [];
    const add = (n, i, x, z) => { if (!n || seen.has(n) || !Number.isFinite(x) || !Number.isFinite(z) || !this.mainWorld({ x, z })) return; seen.add(n); const zn = zoneAt(x, z); L.push({ n, i: i || '📍', x, z, zone: zn ? zn.n : 'นอกเมือง & ริมทาง' }); };
    for (const p of World.pois) if (p.map) add(p.label === 'คลินิก' ? 'โรงพยาบาลสุขใจ' : p.label, p.icon, p.x, p.z);
    if (typeof TAXI_DEST !== 'undefined') for (const t of TAXI_DEST) if (!t.away) add(t.n, '🚕', t.x, t.z);
    return L;
  },
  ride(x, z, n, mode) {
    if (!Number.isFinite(x) || !Number.isFinite(z) || !['car', 'bike', 'win'].includes(mode)) return;
    if (this.busy()) return;
    const h = this.here();
    if (h.away) { UI.toast('อยู่ต่างเมือง ใช้รถตู้/รถทัวร์กลับก่อนนะ', '🚐'); return; }
    if (mode === 'win' && !this.winZone(h)) { UI.toast('แถวนี้ไม่มีวินมอเตอร์ไซค์ (มีในหมู่บ้านและตัวเมือง)', '🏍️'); return; }
    const km = this.km(h, { x, z }); if (km <= 0.31 && Math.hypot(h.x - x, h.z - z) < 8) { UI.toast('อยู่ใกล้แล้ว เดินไปได้เลย', '🚶'); return; }
    const q = this.quote(km, mode); if (!q.ok) { UI.toast(q.why, '⛔'); return; }
    if (!this.pay(q.fare, mode === 'win' ? 'ค่าวินมอเตอร์ไซค์' : mode === 'bike' ? 'ไรด์มอเตอร์ไซค์' : 'ไรด์รถยนต์')) return;
    this.st().rides++; Phone.app = null; UI.close();
    const v = mode === 'car' ? '🚗' : '🛵';
    UI.toast(mode === 'win' ? 'พี่วินเสื้อส้มมารับแล้ว ใส่หมวกกันน็อกด้วยนะ' : `คนขับรับงานแล้ว จะมาถึงใน ${q.wait} นาที`, v);
    fade(() => {
      leaveIndoors(); tick(q.wait + q.min);
      G.player.pos.set(x, World.groundY(x, z), z); snapCam();
      if (mode !== 'car' && G.wx && G.wx.rain > 0.5) S.mood = Math.max(0, (S.mood || 50) - 3);
      UI.toast(`ถึง${n}แล้ว · ${q.min + q.wait} นาที · ${baht(q.fare)}${mode !== 'car' && G.wx && G.wx.rain > 0.5 ? ' (เปียกฝนนิดหน่อย)' : ''}`, v);
    });
  },
  songBoard(h, R) { let best = -1, bd = 1e9; R.stops.forEach((s, i) => { const d = Math.hypot(s.x - h.x, s.z - h.z); if (d < bd) { bd = d; best = i; } }); return { i: best, d: bd }; },
  song(ri, to) {
    const R = CV_SONG[ri]; if (!R || !R.stops[to] || this.busy()) return;
    const h = this.here(); if (h.away) { UI.toast('สองแถววิ่งเฉพาะในอำเภอสุขใจ', '🚐'); return; }
    const hr = this.hour(); if (hr < 6 || hr >= 18.5) { UI.toast('สองแถววิ่ง 06:00–18:30 เท่านั้น', '🌙'); return; }
    const b = this.songBoard(h, R); if (b.d > 30) { UI.toast(`เดินไปรอที่ป้าย${R.stops[b.i].n}ก่อน`, '🚏'); return; }
    if (b.i === to) { UI.toast('อยู่ที่ป้ายนี้แล้ว', '🚏'); return; }
    const hops = Math.abs(to - b.i), fare = Math.min(30, 10 + 5 * hops); let dist = 0;
    for (let i = Math.min(b.i, to); i < Math.max(b.i, to); i++) dist += Math.hypot(R.stops[i + 1].x - R.stops[i].x, R.stops[i + 1].z - R.stops[i].z);
    const wait = 5 + ((Math.random() * 12) | 0), min = Math.round(dist / CV_KM * 3) + hops * 2, s = R.stops[to];
    if (!this.pay(fare, 'ค่ารถสองแถว')) return;
    Phone.app = null; UI.close();
    fade(() => { leaveIndoors(); tick(wait + min); G.player.pos.set(s.x + 2, World.groundY(s.x + 2, s.z), s.z); snapCam(); UI.toast(`ลงป้าย${s.n} · รอรถ ${wait} นาที นั่ง ${min} นาที · ${baht(fare)}`, '🚐'); });
  },
  nextDep(o) {
    const now = S.time;
    if (o.every) { for (let h = o.every[0]; h <= o.every[1]; h++) if (h * 60 >= now) return h * 60 - now; return null; }
    for (const h of o.at) if (h * 60 >= now) return h * 60 - now; return null;
  },
  inter(k, oi) {
    const D = CV_INTER.find(x => x.k === k), o = D && D.o[+oi]; if (!o || this.busy()) return;
    if (typeof Town2 === 'undefined' || !Town2.areas || !Town2.areas[k]) { UI.toast('ยังไม่มีเส้นทางนี้', '⛔'); return; }
    const h = this.here(); if (h.away && h.away === Town2.areas[k]) { UI.toast('อยู่ที่นี่แล้ว', '📍'); return; }
    const w = this.nextDep(o); if (w == null) { UI.toast('เที่ยวสุดท้ายของวันนี้ออกไปแล้ว มาใหม่พรุ่งนี้เช้า', '🌙'); return; }
    if (S.money < o.fee) { UI.toast(`ค่าตั๋ว ${baht(o.fee)}`, '💸'); return; }
    Phone.app = null; UI.close();
    UI.toast(`ซื้อตั๋ว${o.n}แล้ว ออกเดินทาง ${this.hhmm(S.time + w)}`, o.i);
    tick(Math.max(0, w + o.dur - 90));
    const m0 = S.money; Town2.go(k, o.fee);
    if (S.money < m0 && typeof Bank2 !== 'undefined') Bank2.log('ตั๋ว' + o.n, -(m0 - S.money));
  },
  homeFromAway(oi) {
    const h = this.here(); if (!h.away || typeof Town2 === 'undefined' || this.busy()) return;
    const D = CV_INTER.find(x => Town2.areas[x.k] === h.away), o = D ? D.o[+oi] : { n: 'รถตู้กลับ', i: '🚐', fee: 150, dur: 150, every: [6, 19] };
    if (!o) return;
    const w = this.nextDep(o); if (w == null) { UI.toast('เที่ยวสุดท้ายของวันนี้ออกไปแล้ว', '🌙'); return; }
    if (!this.pay(o.fee, 'ตั๋ว' + o.n + 'กลับ')) return;
    Phone.app = null; UI.close(); leaveIndoors();
    UI.toast(`ขึ้น${o.n}กลับ ออก ${this.hhmm(S.time + w)}`, o.i);
    tick(Math.max(0, w + o.dur - 90)); Town2.leaveAway();
  },
  rideApp() {
    const t = this.rtab || 0, tabs = ['🚗 เรียกรถ', '🏍️ วิน & สองแถว', '🚌 รถบัสไฟฟ้า', '🚐 รถตู้ & รถทัวร์'];
    const head = `<div class="row topics">${tabs.map((n, i) => `<button class="btn ${i === t ? '' : 'ghost'}" data-a="cvrtab" data-v="${i}">${n}</button>`).join('')}</div>`;
    const h = this.here();
    if (G.driving) return head + '<p class="empty">กำลังขับรถอยู่ จอดและลงจากรถก่อนเรียกรถ</p>';
    if (t === 3) return head + this.interHTML(h);
    if (h.away) return head + `<p class="empty">ตอนนี้อยู่ที่${esc(h.away.n || 'ต่างเมือง')} ในเมืองนี้ใช้รถตู้/รถทัวร์กลับอำเภอสุขใจ (แท็บรถตู้ & รถทัวร์)</p>`;
    if (t === 1) return head + this.localHTML(h);
    if (t === 2) return head + this.ebusHTML(h);
    const s = this.surge(), L = this.dests(), zones = [...new Set(L.map(d => d.zone))];
    const hz = (zoneAt(h.x, h.z) || {}).n, zsel = zones.includes(this.rzone) ? this.rzone : zones.includes(hz) ? hz : zones[0];
    const list = L.filter(d => d.zone === zsel).map(d => ({ d, km: this.km(h, d) })).sort((a, b) => a.km - b.km);
    return head + `<p class="lead">🚖 ไรด์สุขใจ · ค่าโดยสาร = ค่าเริ่มต้น + ตามระยะทาง${s.why.length ? ' · ⚡ ' + s.why.join(' · ') : ' · ราคาปกติ'} · ค่าบริการแอป รถยนต์ 10 ฿ / มอเตอร์ไซค์ 5 ฿</p>
      <div class="row topics">${zones.map(z => `<button class="btn ${z === zsel ? '' : 'ghost'}" data-a="cvzone" data-v="${esc(z)}">${esc(z)}</button>`).join('')}</div>
      <div class="grid">${list.map(({ d, km }) => { const c = this.quote(km, 'car'), b = this.quote(km, 'bike'); return `<div class="card"><div class="ci">${d.i}</div><div class="cb"><h4>${esc(d.n)}</h4><p class="dim">${km.toFixed(1)} กม. · ประมาณ ${c.min + c.wait} นาที</p><div class="row"><button class="btn" data-a="cvride" data-x="${d.x}" data-z="${d.z}" data-n="${esc(d.n)}" data-m="car" ${S.money >= c.fare ? '' : 'disabled'}>🚗 ${baht(c.fare)}</button>${b.ok ? `<button class="btn ghost" data-a="cvride" data-x="${d.x}" data-z="${d.z}" data-n="${esc(d.n)}" data-m="bike" ${S.money >= b.fare ? '' : 'disabled'}>🛵 ${baht(b.fare)}</button>` : ''}</div></div></div>`; }).join('') || '<p class="empty">ไม่มีจุดหมายในโซนนี้</p>'}</div>`;
  },
  localHTML(h) {
    const wz = this.winZone(h), hr = this.hour();
    let s = `<h5>🏍️ วินมอเตอร์ไซค์ ${wz ? '· ' + esc(wz.n) : ''}</h5>`;
    if (!wz) s += '<p class="lead">แถวนี้ไม่มีวิน (มีในหมู่บ้านสุขใจ ทุ่งทอง ภูผาใหม่ และริมทะเล) · ราคาตามป้าย 20/30/40 ฿ กลางคืน +10 ฿</p>';
    else {
      const L = this.dests().map(d => ({ d, km: this.km(h, d) })).filter(o => o.km <= 3 && Math.hypot(o.d.x - h.x, o.d.z - h.z) > 8).sort((a, b) => a.km - b.km).slice(0, 10);
      s += `<p class="lead">ป้ายราคาวิน: ไม่เกิน 1 กม. 20 ฿ · 2 กม. 30 ฿ · 3 กม. 40 ฿${hr >= 22 || hr < 5 ? ' · กลางคืน +10 ฿' : ''}</p><div class="row topics">${L.map(({ d, km }) => { const q = this.quote(km, 'win'); return `<button class="btn ghost" data-a="cvride" data-x="${d.x}" data-z="${d.z}" data-n="${esc(d.n)}" data-m="win" ${S.money >= q.fare ? '' : 'disabled'}>${d.i} ${esc(d.n)} ${baht(q.fare)}</button>`; }).join('') || '<span class="dim">ไม่มีจุดหมายใกล้ ๆ</span>'}</div>`;
    }
    s += `<h5>🚐 รถสองแถวประจำทาง (06:00–18:30 · 10–30 ฿)</h5>`;
    for (let ri = 0; ri < CV_SONG.length; ri++) {
      const R = CV_SONG[ri], b = this.songBoard(h, R), near = b.d <= 30;
      s += `<div class="card"><div class="ci">${R.c}</div><div class="cb"><h4>${R.n}</h4><p class="dim">${near ? `รอรถที่ป้าย${R.stops[b.i].n}` : `ป้ายใกล้สุด: ${R.stops[b.i].n} ห่าง ${Math.round(b.d * 25)} ม. (เดินไปก่อน)`}</p><div class="row topics">${R.stops.map((st, i) => i === b.i ? '' : `<button class="btn ghost" data-a="cvsong" data-r="${ri}" data-v="${i}" ${near ? '' : 'disabled'}>${esc(st.n)} ${baht(Math.min(30, 10 + 5 * Math.abs(i - b.i)))}</button>`).join('')}</div></div></div>`;
    }
    return s;
  },
  ebusHTML(h) {
    if (typeof EBUS_STOPS === 'undefined' || typeof Fut === 'undefined') return '<p class="empty">ยังไม่มีรถบัสไฟฟ้า</p>';
    let best = null, bd = 1e9; for (const p of EBUS_STOPS) { const d = Math.hypot(p.x - h.x, p.z - h.z); if (d < bd) { bd = d; best = p; } }
    const at = best && bd <= 25;
    return `<p class="lead">🚌 รถบัสไฟฟ้าระหว่างเมือง วิ่งทุก 30 นาที ค่าโดยสารตามระยะทาง 40–80 ฿</p>${at ? `<p class="lead">📍 อยู่ที่${esc(best.n)}</p><div class="grid">${EBUS_STOPS.filter(p => p.k !== best.k).map(p => { const fee = Fut.fare(best, p); return `<div class="card"><div class="ci">🚏</div><div class="cb"><h4>${esc(p.n)}</h4><p class="dim">${baht(fee)} · ประมาณ ${Fut.mins(best, p)} นาที</p><div class="row"><button class="btn" data-a="cvebus" data-v="${p.k}" data-f="${best.k}" ${S.money >= fee ? '' : 'disabled'}>ขึ้นรถ</button></div></div></div>`; }).join('')}</div>`
      : `<p class="lead">ป้ายใกล้สุด: ${best ? esc(best.n) : '-'} ห่าง ${Math.round(bd * 25)} ม. · เดินไปหรือเรียกวิน/ไรด์ไปที่ป้าย</p>${best ? `<div class="row"><button class="btn" data-a="cvride" data-x="${best.x}" data-z="${best.z}" data-n="${esc(best.n)}" data-m="bike">🛵 ไปป้ายรถบัส ${baht(this.quote(this.km(h, best), 'bike').fare)}</button></div>` : ''}`}`;
  },
  interHTML(h) {
    const sched = o => o.every ? `ทุกชั่วโมง ${String(o.every[0]).padStart(2, '0')}:00–${o.every[1]}:00` : 'ออก ' + o.at.map(x => String(x).padStart(2, '0') + ':00').join(' ');
    const dep = o => { const w = this.nextDep(o); return w == null ? 'หมดเที่ยวแล้ววันนี้' : `เที่ยวถัดไป ${this.hhmm(S.time + w)}`; };
    if (h.away) {
      const D = typeof Town2 !== 'undefined' && CV_INTER.find(x => Town2.areas[x.k] === h.away);
      const O = D ? D.o : [{ n: 'รถตู้กลับ', i: '🚐', fee: 150, dur: 150, every: [6, 19] }];
      return `<p class="lead">🚐 กลับอำเภอสุขใจจาก${esc(h.away.n || 'ต่างเมือง')} (ส่งที่ลานน้ำพุหมู่บ้าน/ท่าเรือ)</p><div class="grid">${O.map((o, i) => `<div class="card"><div class="ci">${o.i}</div><div class="cb"><h4>${o.n} ${baht(o.fee)}</h4><p class="dim">${sched(o)} · ${dep(o)} · เดินทาง ${Math.round(o.dur / 60 * 10) / 10} ชม.</p><div class="row"><button class="btn" data-a="cvback" data-v="${i}" ${S.money >= o.fee && this.nextDep(o) != null ? '' : 'disabled'}>ซื้อตั๋วกลับ</button></div></div></div>`).join('')}</div>`;
    }
    return `<p class="lead">🚐 รถตู้และรถทัวร์จากสถานีขนส่ง (บขส.) ถูกกว่าแท็กซี่ แต่ต้องรอตามตารางเวลา</p><div class="grid">${CV_INTER.filter(D => typeof Town2 !== 'undefined' && Town2.areas && Town2.areas[D.k]).map(D => `<div class="card"><div class="ci">${D.i}</div><div class="cb"><h4>${D.n}</h4>${D.o.map((o, i) => `<p class="dim">${o.i} ${o.n} ${baht(o.fee)} · ${sched(o)} · ${dep(o)} · ${Math.round(o.dur / 60 * 10) / 10} ชม.</p><div class="row"><button class="btn ghost" data-a="cvinter" data-k="${D.k}" data-v="${i}" ${S.money >= o.fee && this.nextDep(o) != null ? '' : 'disabled'}>ซื้อตั๋ว ${o.n}</button></div>`).join('')}</div></div>`).join('')}</div>`;
  },

  // ================= wiring =================
  init() {
    this.st();
    APPS.push({ id: 'civhos', i: '🏥', n: 'หมอสุขใจ' }, { id: 'civsch', i: '🎒', n: 'การศึกษา' }, { id: 'civride', i: '🚖', n: 'ไรด์สุขใจ' });
    Phone.apps.civhos = () => this.hospApp();
    Phone.apps.civsch = () => this.schoolApp();
    Phone.apps.civride = () => this.rideApp();
    if (typeof APP_GROUPS !== 'undefined') { const g = APP_GROUPS.find(x => /บริการ/.test(x[0])) || APP_GROUPS[APP_GROUPS.length - 1]; if (g) g[1].unshift('civride', 'civhos', 'civsch'); }
    // every hospital (village clinic, far-town hospitals, walk-in rooms) opens the full hospital
    if (typeof Life2 !== 'undefined' && Life2.clinicUI) { this._clinic = Life2.clinicUI.bind(Life2); Life2.clinicUI = () => this.hospUI(); }
    // the village school opens the full school; the old night classes stay one tab away
    if (typeof Town2 !== 'undefined' && Town2.schoolUI) {
      this._school = Town2.schoolUI.bind(Town2); Town2.schoolUI = () => this.schoolUI();
      if (Town2.taxiHTML) { const _t = Town2.taxiHTML.bind(Town2); Town2.taxiHTML = () => `<div class="row"><button class="btn" data-a="app" data-v="civride">🚖 เปิดไรด์สุขใจ (รถยนต์/มอเตอร์ไซค์/วิน/สองแถว/รถตู้)</button></div>` + _t(); }
    }
    // เรียนฟรี 15 ปี: public-school tuition charged by the family module is paid back by the state for enrolled children
    if (typeof Family !== 'undefined' && Family.week) {
      const _w = Family.week.bind(Family);
      Family.week = () => {
        const kids = this.kids(), free = kids.filter(k => Family.stage(k) === 'วัยเรียน' && k.school !== 'inter' && this.enrolled(k)).length, m0 = S.money;
        _w();
        if (!free) return;
        let got = 0; for (const k of kids) if (k.job && k.job !== 'นักวิชาการเกษตร' && k.job !== 'ชาวไร่รุ่นใหม่') got += k.job === 'แพทย์' ? 8000 : 5000;
        const back = Math.min(free * 1500, Math.max(0, m0 - S.money + got));
        if (back > 0) { S.money += back; if (typeof Bank2 !== 'undefined') Bank2.income('รัฐอุดหนุนค่าเล่าเรียน (เรียนฟรี 15 ปี)', back); }
      };
    }
    // a certificate (ม.6 or ปวช.) lowers the level needed for office jobs by one
    if (typeof JOBS2 !== 'undefined') {
      const cert = () => { const c = S.civic; return !!(c && c.ed && c.ed.certs && c.ed.certs.length); };
      for (const [k, lv] of [['bank', 2], ['teacher', 3], ['nurse', 3]]) {
        const J = JOBS2[k]; if (!J || typeof J.ok !== 'function') continue;
        const _ok = J.ok; J.ok = () => _ok() || (cert() && (S.lvl || 1) >= lv - 1);
        J.req = J.req + ` (มีวุฒิ ม.6/ปวช. ใช้ Lv.${lv - 1} ได้)`;
      }
    }
  },
  update() {},
  day() {
    if (!S) return; const c = this.st();
    // appointment reminders and missed appointments
    for (const a of c.appt.slice()) {
      const X = CV_HOS[a.k]; if (!X) { c.appt.splice(c.appt.indexOf(a), 1); continue; }
      if (a.day === S.day) Phone.msg(a.h || 'โรงพยาบาล', `เตือนนัดวันนี้: ${X.n} มาก่อน 10:00 แสดงบัตรนัดแล้วไม่ต้องรอคิว`, true);
      else if (a.day === S.day + 1) Phone.msg(a.h || 'โรงพยาบาล', `พรุ่งนี้มีนัด${X.n} อย่าลืมนำบัตรประชาชนมาด้วยนะคะ`, true);
      else if (a.day < S.day) { c.appt.splice(c.appt.indexOf(a), 1); Phone.msg(a.h || 'โรงพยาบาล', `คุณขาดนัด${X.n}เมื่อ${RD(a.day)} นัดใหม่ได้ในแอปหมอสุขใจ`, true); }
    }
    if (S.sick === 2 && !c.toldER) { c.toldER = S.day; Phone.msg('หมอสุขใจ', 'อาการแบบนี้ควรไปห้องฉุกเฉิน (เปิด 24 ชม.) หรือโทร 1669 ได้ทันที', true); }
    if (!S.sick) c.toldER = 0;
    this.schoolDay();
  },
};

Object.assign(UI.H, {
  cvright: d => { if (Civic.rights().includes(d.v)) Civic.st().right = d.v; },
  cvsvc: d => Civic.visit(d.k),
  cvold: () => { if (Civic._clinic) { UI.close(); Civic._clinic(); } },
  cvsso: () => { const c = Civic.st(); if (!Civic.atHosp || c.ssoY === Civic.year()) return; c.ssoH = Civic.atHosp; c.ssoY = Civic.year(); UI.toast(`ย้ายโรงพยาบาลตามสิทธิประกันสังคมเป็น${Civic.atHosp}แล้ว`, '🏥'); },
  cvcancel: d => { const c = Civic.st(); if (c.appt[+d.i]) { c.appt.splice(+d.i, 1); UI.toast('ยกเลิกนัดแล้ว', '📅'); } },
  cvtele: () => Civic.tele(),
  cvbook: d => Civic.bookUser(d.k),
  cvhome: d => { Civic.st().home = d.v; },
  cvenrol: d => Civic.enrol(d.n),
  cvtrack: d => Civic.track(d.n, d.v),
  cvopt: d => Civic.opt(d.n, d.v),
  cvmeet: () => Civic.meet(),
  cvadult: d => Civic.adultEnrol(d.v),
  cvclass: () => Civic.attend(),
  cvquit: () => { const ed = Civic.st().ed; if (ed.prog) { UI.toast(`ลาออกจาก${CV_ADULT[ed.prog].n}แล้ว`, '📖'); ed.prog = null; ed.n = 0; } },
  cvexam: () => Civic.examStart(),
  cvq: d => Civic.answer(d.i),
  cvsold: () => { if (Civic._school) { UI.close(); Civic._school(); } },
  cvstab: d => { Civic.stab = +d.v || 0; },
  cvrtab: d => { Civic.rtab = +d.v || 0; },
  cvzone: d => { Civic.rzone = d.v; },
  cvride: d => Civic.ride(+d.x, +d.z, d.n || 'จุดหมาย', d.m),
  cvsong: d => Civic.song(+d.r, +d.v),
  cvebus: d => { if (Civic.busy()) return; Phone.app = null; Fut.bus(d.v, d.f); },
  cvinter: d => Civic.inter(d.k, d.v),
  cvback: d => Civic.homeFromAway(d.v),
});
