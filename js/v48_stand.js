'use strict';
// ---------- v48_stand: the farm-fresh vegetable stand at the front of the farm becomes a small business ----------
// 1) PAYMENT: every customer chooses how to pay. Cash goes straight into your wallet (S.money). A bank transfer (PromptPay QR) goes into the bank account (Bank savings) and shows in the bank
//    statement. Transfers need an ID card (the QR is registered with it); without one every customer pays cash. A ledger (today / all time, cash vs transfer) lives in the stand panel.
// 2) STAFF: put up a vacancy and NPCs apply, each with a CV (age, education, experience, five skills, personality, history) and the salary they ask. You can negotiate (they may counter, accept or
//    walk away; nobody works below the legal minimum), hire, and set the contract: monthly / weekly / daily pay, the pay day, cash or bank transfer, the weekly day off. The employee stands behind the
//    stand, brings customers (skill and morale) and keeps it open longer; honesty decides whether the till is ever short. Pay day arrives by the real calendar. If you cannot pay, pay is late, morale drops
//    and after three misses they quit. Raises can be asked for and given; you can pay a bonus or let them go (probation / severance rules).
// State: S.v48 = { open, apps[], emp, led[], tot{cash,tr,n}, day{d,cash,tr}, acc, hist[], seq }
V23.add('v48_stand', () => {
  if (typeof Social === 'undefined' || !Social.STAND) return;
  const MIN_DAY = 370, MIN_WAGE = MIN_DAY * 26, WD = 26;
  const St = () => { const v = S.v48 = S.v48 || {}; v.apps = v.apps || []; v.led = v.led || []; v.tot = v.tot || { cash: 0, tr: 0, n: 0 }; v.hist = v.hist || []; v.seq = v.seq || 0; v.day = v.day || { d: 0, cash: 0, tr: 0 }; if (v.acc == null) v.acc = 1; return v; };
  const E = () => St().emp;
  const val = id => (document.getElementById(id) || {}).value;
  const toast = (t, i) => { try { UI.toast(t, i || '🧺'); } catch (e) { } };
  const hasId = () => { try { return !!Gov24.has('idcard'); } catch (e) { return false; } };
  const canTransfer = () => hasId() && St().acc;
  const R = Math.random, pick = a => a[(R() * a.length) | 0], clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const r100 = n => Math.round(n / 100) * 100;
  const WK = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
  const wkOf = d => (d - 1) % 7;                                     // day 1 is a Monday (v36 calendar)
  const domOf = d => { try { return Cal36.date(d).dom; } catch (e) { return 1 + (d - 1) % 28; } };
  const dimOf = d => { try { const t = Cal36.date(d); return Cal36.daysIn(t.y, t.m); } catch (e) { return 28; } };
  const PAYT = { month: 'รายเดือน', week: 'รายสัปดาห์', day: 'รายวัน' }, MODE = { cash: '💵 เงินสด', transfer: '📲 โอนผ่านธนาคาร' };

  // ===================== 1) payment =====================
  const methodFor = pay => { if (!canTransfer()) return 'cash'; return R() < clamp(0.28 + pay / 700, 0.25, 0.88) ? 'transfer' : 'cash'; };
  Social.settle = function (v, id, n, pay) {
    const s = St(), e = E(), onDuty = e && working(e);
    const m = methodFor(pay); let skim = 0;
    // only CASH can be pocketed (a bank transfer goes straight to your account); the risk grows with dishonesty, low morale, late pay, and falls after an audit or a warning
    if (onDuty && m === 'cash') {
      const h = e.skills.honesty; let risk = (10 - h) * 0.03 + (e.morale < 40 ? 0.06 : 0) + (e.late ? 0.1 : 0) + (e.wage < overall(e.skills) * 450 + MIN_WAGE - 1350 ? 0.03 : 0); if (h >= 8) risk *= 0.2;
      if (s.aud && S.day - s.aud.day <= 3) risk *= 0.4; if (e.warn) risk *= 0.5;
      if (R() < risk) skim = Math.max(1, Math.round(pay * (R() < 0.25 ? 0.6 + R() * 0.4 : 0.15 + R() * 0.3)));
    }
    const got = pay - skim;
    if (m === 'transfer') { const b = Bank.st(); b.sav += got; try { Bank2.log('รับโอนจากแผงหน้าฟาร์ม (พร้อมเพย์)', got); } catch (x) { } }
    else S.money += got;
    try { Bank2.income('แผงหน้าฟาร์ม', got); } catch (x) { }
    if (s.day.d !== S.day) s.day = { d: S.day, cash: 0, tr: 0 };
    s.day[m === 'cash' ? 'cash' : 'tr'] += got; s.tot[m === 'cash' ? 'cash' : 'tr'] += got; s.tot.n += n;
    s.led.unshift({ k: s.lseq = (s.lseq || 0) + 1, d: S.day, t: Phone.clock(), id, n, amt: got, exp: pay, m, by: onDuty ? e.name : '' }); if (s.led.length > 120) s.led.length = 120;
    if (onDuty) { e.sold = (e.sold || 0) + n; e.rev = (e.rev || 0) + got; }
    if (skim) { s.short = (s.short || 0) + skim; s.thefts = (s.thefts || 0) + 1; if (s.short - (s.hinted || 0) >= 400 && R() < 0.5) { s.hinted = s.short; if (!G.simulating) Phone.msg('แผงหน้าฟาร์ม', 'ลูกค้าบอกว่าจ่ายเงินสดครบ แต่ยอดเงินที่เข้ามาดูน้อยกว่าที่ควร ลองไปตรวจสอบยอดขายที่แผง (แท็บพนักงาน)', true); } }
    const near = !G.inside && Math.hypot(G.player.pos.x - v.x, G.player.pos.z - v.z) < 40;
    const txt = `${ITEMS[id].n} ×${n} · ${m === 'cash' ? `จ่ายเงินสด +${baht(got)} เข้ากระเป๋า` : `จ่ายโอน +${baht(got)} เข้าบัญชีธนาคาร`}`;
    if (near) toast('ชาวบ้านซื้อ ' + txt, m === 'cash' ? '💵' : '📲'); else Phone.msg('แผงหน้าฟาร์ม', 'ขาย ' + txt, true);
  };

  // ===================== 2) applicants =====================
  const FM = ['สมชาย', 'วิชัย', 'ประเสริฐ', 'ธนา', 'สุริยา', 'อนุชา', 'ภานุ', 'ณัฐพล', 'กิตติ', 'พงศกร', 'สมพงษ์', 'อรรถพล'];
  const FF = ['สมหญิง', 'มาลี', 'ศิริพร', 'ปรียา', 'นภา', 'จันทร์เพ็ญ', 'กาญจนา', 'พิมพ์ใจ', 'รัตนา', 'อรอุมา', 'วันเพ็ญ', 'ณัฐธิดา'];
  const LN = ['ใจดี', 'สุขสม', 'แก้วมณี', 'ทองดี', 'บุญมา', 'ศรีสุข', 'วงษ์ไทย', 'พึ่งบุญ', 'เรืองศรี', 'จันทร์หอม', 'ดวงแก้ว', 'มีสุข'];
  const EDU = ['ม.3', 'ม.6', 'ปวช.', 'ปวส.', 'ปริญญาตรี'];
  const TRAIT = ['ยิ้มแย้มเป็นกันเอง', 'ขยันตื่นเช้า', 'เงียบขรึมแต่รอบคอบ', 'ช่างพูดช่างขาย', 'ละเอียดเรื่องเงิน', 'ใจเย็น อดทน'];
  const PAST = ['ขายผักที่ตลาดสดในหมู่บ้าน', 'ช่วยพ่อแม่ขายของหน้าบ้าน', 'เป็นแคชเชียร์ร้านโชห่วย', 'ขายของตลาดนัดวันหยุด', 'เป็นพนักงานร้านสะดวกซื้อ', 'ขายผลไม้ริมถนน', 'ทำงานโรงงานแล้วลาออกมาหางานใกล้บ้าน', 'ช่วยงานไร่ของญาติ'];
  const SK = { sales: 'การขาย', math: 'คิดเงิน/ทอนเงิน', service: 'การบริการลูกค้า', diligence: 'ความขยัน', honesty: 'ความซื่อสัตย์' };
  const overall = k => (k.sales * 1.4 + k.math + k.service * 1.1 + k.diligence * 0.8 + k.honesty * 0.9) / 5.2;
  const band = v => (v >= 9 ? 'ดีมาก' : v >= 7 ? 'ดี' : v >= 4 ? 'ปานกลาง' : 'ค่อนข้างต่ำ');
  function genApplicant() {
    const s = St(), fem = R() < 0.55, age = 18 + ((R() * 36) | 0), exp = clamp(Math.round((age - 18) * R() * 0.35), 0, 12), eduI = clamp(((R() * 3) | 0) + (age > 22 && R() < 0.3 ? 1 : 0) + (R() < 0.12 ? 1 : 0), 0, 4);
    const base = () => clamp(Math.round(3 + R() * 5 + exp * 0.25), 1, 10);
    const sk = { sales: base(), math: clamp(base() + (eduI >= 2 ? 1 : 0), 1, 10), service: base(), diligence: clamp(Math.round(3 + R() * 6), 1, 10), honesty: clamp(Math.round(3 + R() * 7), 1, 10) };
    const ov = overall(sk), need = R() < 0.25, ask = Math.max(MIN_WAGE, r100(MIN_WAGE + 450 * (ov - 3) + exp * 160 + (eduI >= 3 ? 700 : 0) + (R() - 0.5) * 800)) - (need ? 300 : 0);
    const history = exp ? [`${pick(PAST)} ${exp} ปี`] : ['เพิ่งเริ่มหางาน ยังไม่มีประสบการณ์ขายของ']; if (exp > 4 && R() < 0.6) history.push(pick(PAST));
    const a = { id: ++s.seq, name: (fem ? pick(FF) : pick(FM)) + ' ' + pick(LN), fem, age, edu: EDU[eduI], exp, skills: sk, trait: pick(TRAIT), history, ask: Math.max(MIN_WAGE, ask), ask0: Math.max(MIN_WAGE, ask), flex: R() * 0.13, patience: 2 + ((R() * 2) | 0), round: 0, got: S.day, until: S.day + 6, st: 'new',
      look: { skin: pick([0xf1c9a5, 0xe0a87e, 0xc68d63]), hair: pick([0x1b120c, 0x3a2416, 0x6b4a2e]), shirt: pick([0x4caf50, 0x42a5f5, 0xef6c00, 0xab47bc, 0x26a69a]), long: fem && R() < 0.7 } };
    return a;
  }
  const working = e => { if (!e) return false; const h = S.time / 60; return h >= 7 && h < 20 && wkOf(S.day) !== e.off && (S.day - e.hired) >= 0 && e.morale > 0 && !e.leave; };
  const staffed = () => working(E());
  const fx = () => { const e = E(); if (!working(e)) return { rate: 1, open: 8, close: 18, max: 2 }; const sk = e.skills; return { rate: clamp((1 + 0.07 * sk.sales + 0.035 * sk.service) * (0.65 + e.morale / 200), 0.7, 2), open: 7, close: 20, max: 3 }; };

  // day: new applicants, expiry, wages accrue, pay day, raises, quitting
  const _nd = newDay;
  newDay = function () {
    const r = _nd.apply(this, arguments);
    try { dayTick(); } catch (e) { console.warn('v48 day', e); }
    return r;
  };
  function dayTick() {
    const s = St(), e = s.emp;
    // applicants
    s.apps = s.apps.filter(a => { if (a.st === 'new' || a.st === 'neg' || a.st === 'agreed') { if (S.day > a.until) { if (!G.simulating) Phone.msg('สมัครงานแผงหน้าฟาร์ม', `${a.name} ไปรับงานที่อื่นแล้ว (ไม่ได้ตอบกลับภายใน 7 วัน)`, true); return false; } return true; } return S.day - a.got < 14; });
    const open = s.apps.filter(a => ['new', 'neg', 'agreed'].includes(a.st)).length;
    if (!e && s.open && open < 4 && R() < 0.5) { const a = genApplicant(); s.apps.push(a); s.unread = (s.unread || 0) + 1; if (!G.simulating) { Phone.msg('สมัครงานแผงหน้าฟาร์ม', `${a.name} (อายุ ${a.age}) ส่งใบสมัครงานคนขายแผงผักสดจากไร่ ขอเงินเดือน ${baht(a.ask)} · ดูประวัติและเจรจาที่แผงหน้าฟาร์ม > พนักงาน`); } }
    if (!e) return;
    // wages accrue on working days
    if (wkOf(S.day) !== e.off) e.owed = (e.owed || 0) + e.wage / WD;
    // pay day
    const due = e.payType === 'day' || (e.payType === 'week' && wkOf(S.day) === e.payWk) || (e.payType === 'month' && domOf(S.day) === Math.min(e.payDay >= 29 ? 99 : e.payDay, dimOf(S.day)));
    if (due && Math.round(e.owed) >= 1) payNow(e.payMode, true);
    // morale drifts with how fair the pay is; unpaid hurts
    const market = overall(e.skills) * 450 + MIN_WAGE - 1350;
    e.morale = clamp(e.morale + (e.wage >= market ? 0.4 : -0.4) + (e.late ? -1.5 : 0.1), 0, 100);
    if (e.morale <= 8 && !e.leave) { quit('ไม่พอใจเงินเดือนและงานที่ทำ'); return; }
    // ask for a raise after 90 days
    if (!e.raiseReq && S.day - (e.raisedAt || e.hired) >= 90 && R() < 0.12 && e.morale >= 40) { const amt = r100(e.wage * (1.06 + R() * 0.06)); e.raiseReq = amt; if (!G.simulating) Phone.msg('พนักงานแผงหน้าฟาร์ม', `${e.name} ขอปรับเงินเดือนเป็น ${baht(amt)} (ทำงานมา ${S.day - e.hired} วัน) ตอบได้ที่แผงหน้าฟาร์ม > พนักงาน`); }
  }
  // pay what is owed: mode cash (wallet) or transfer (bank savings). `auto` = pay day; otherwise a manual payment
  function payNow(mode, auto) {
    const e = E(); if (!e) return false; const amt = Math.round(e.owed || 0); if (amt < 1) { if (!auto) toast('ไม่มียอดค้างจ่าย', 'ℹ️'); return true; }
    const b = Bank.st();
    if (mode === 'transfer' ? b.sav >= amt : S.money >= amt) {
      if (mode === 'transfer') { b.sav -= amt; try { Bank2.log(`โอนเงินเดือน ${e.name} (แผงหน้าฟาร์ม)`, -amt); } catch (x) { } } else { S.money -= amt; try { Bank2.log(`จ่ายเงินสดเงินเดือน ${e.name}`, -amt); } catch (x) { } }
      e.paid = (e.paid || 0) + amt; e.owed = 0; e.lastPay = S.day; e.late = 0; e.morale = clamp(e.morale + 3, 0, 100);
      if (!G.simulating || !auto) Phone.msg(e.name, `ได้รับเงินเดือน ${baht(amt)} ${mode === 'transfer' ? 'โอนเข้าบัญชีแล้ว' : 'เป็นเงินสดแล้ว'} ขอบคุณค่ะ/ครับ 🙏`, true);
      if (!auto) toast(`จ่ายเงินเดือน ${baht(amt)} แล้ว`, '💵'); return true;
    }
    e.late = (e.late || 0) + 1; e.morale = clamp(e.morale - 7, 0, 100);
    Phone.msg('พนักงานแผงหน้าฟาร์ม', `จ่ายเงินเดือน ${e.name} ${baht(amt)} ไม่ได้ (${mode === 'transfer' ? 'เงินในบัญชีธนาคารไม่พอ' : 'เงินสดไม่พอ'}) ค้างจ่าย ${e.late} งวด · ถ้าค้างครบ 3 งวดพนักงานจะลาออก`, false);
    if (e.late >= 3) quit(`ค้างจ่ายเงินเดือน ${e.late} งวด`);
    return false;
  }
  function quit(why) { const s = St(), e = s.emp; if (!e) return; s.hist.unshift({ name: e.name, from: e.hired, to: S.day, why, owed: Math.round(e.owed || 0) }); if (s.hist.length > 10) s.hist.length = 10; Phone.msg('พนักงานแผงหน้าฟาร์ม', `${e.name} ขอลาออก: ${why}${e.owed >= 1 ? ` (ยังค้างจ่าย ${baht(Math.round(e.owed))})` : ''}`, false); s.emp = null; hideStaff(); }

  // ===================== 3) the person at the stand =====================
  let staffObj = null, staffId = 0, sit = 0;
  function hideStaff() { if (staffObj) { World.dyn.remove(staffObj); staffObj = null; staffId = 0; } }
  setInterval(() => {
    try {
      if (!G.started) return; const e = E();
      if (!working(e) || (G.inside && !G.inRoom) || G.inMine) { if (staffObj) staffObj.visible = false; return; }
      if (staffId !== e.id) { hideStaff(); const o = Models.human(Object.assign({ pants: 0x34507a, hat: e.fem ? null : 'straw', long: !!e.look.long }, e.look)); World.dyn.add(o); staffObj = o; staffId = e.id; const p = l2w(Social.STAND.x, Social.STAND.z, Social.STAND.rot, 0, -0.95); o.position.set(p.x, World.groundY(p.x, p.z), p.z); o.rotation.y = Social.STAND.rot; }
      staffObj.visible = true;
      Models.animHuman(staffObj, 0.1, 0, Social.visitors && Social.visitors.some(v => v.st === 'buy') ? 'talk' : (++sit % 80 < 12 ? 'wave' : null));
    } catch (x) { }
  }, 100);

  // customers: more of them, for longer, when somebody good is on duty
  Social.updateVisitors = function (dt) {
    if (!this.standG) return;
    const h = S.time / 60, f = fx(), stock = Object.keys(S.stand || {}).filter(k => S.stand[k] > 0);
    if ((this.visitT -= dt * f.rate) <= 0) {
      this.visitT = 25 + Math.random() * 35;
      if (stock.length && h >= f.open && h < f.close && this.visitors.length < f.max && !isNightTime()) {
        const Rr = Math.random, o = Models.human({ skin: [0xf1c9a5, 0xe0a87e, 0xc68d63][(Rr() * 3) | 0], hair: [0x1b120c, 0x3a2416, 0x9e9e9e][(Rr() * 3) | 0], shirt: [0x4a90c2, 0xe57373, 0x81c784, 0xffb74d, 0xba68c8][(Rr() * 5) | 0], pants: 0x34507a, skirt: Rr() < 0.4 ? 0xc0504d : null, long: Rr() < 0.3, hat: Rr() < 0.4 ? 'straw' : null });
        World.dyn.add(o); const v = { obj: o, x: 1.5, z: -64, st: 'in', t: 0, path: [{ x: 1.2, z: -56 }, this.shopPos] }; o.position.set(v.x, World.groundY(v.x, v.z), v.z);
        this.visitors.push(v);
      }
    }
    for (const v of this.visitors.slice()) {
      if (v.st === 'buy') {
        v.t += dt; v.obj.rotation.y = this.STAND.rot + Math.PI; Models.animHuman(v.obj, dt, 0, null);
        if (v.t > 3) { this.buy(v); v.st = 'out'; v.path = [{ x: 1.2, z: -56 }, { x: 1.5, z: -66 }]; }
        continue;
      }
      const p = v.path[0]; if (!p) { if (v.st === 'in') { v.st = 'buy'; v.t = 0; } else { World.dyn.remove(v.obj); this.visitors.splice(this.visitors.indexOf(v), 1); } continue; }
      const dx = p.x - v.x, dz = p.z - v.z, d = Math.hypot(dx, dz), mv = Math.min(d, 1.5 * dt);
      if (d < 0.2) { v.path.shift(); continue; }
      v.x += dx / d * mv; v.z += dz / d * mv; v.obj.rotation.y = Math.atan2(dx, dz);
      v.obj.position.set(v.x, World.groundY(v.x, v.z), v.z); Models.animHuman(v.obj, dt, 1.5, null);
    }
  };

  // ===================== 4) the panel =====================
  const U48 = { tab: 0, view: 0, form: 0 };
  const bar = v => `<div style="height:7px;border-radius:5px;background:rgba(255,255,255,.14);overflow:hidden;width:120px;display:inline-block;vertical-align:middle"><div style="height:100%;width:${v * 10}%;background:linear-gradient(90deg,#ffd34d,#7ccf5a)"></div></div>`;
  const skillRows = (k, r) => Object.keys(SK).map(x => {
    if (x === 'honesty') return `<tr><td>${SK[x]}</td><td>${r && r.chkTxt ? esc(r.chkTxt) : '<small>ยังไม่ทราบ · ตรวจประวัติ/ผู้ค้ำประกันได้</small>'}</td></tr>`;
    return r && r.int ? `<tr><td>${SK[x]}</td><td>${bar(k[x])} <small>${k[x]}/10</small></td></tr>` : `<tr><td>${SK[x]}</td><td><small>${band(k[x])} (ตามใบสมัคร) · สัมภาษณ์เพื่อดูละเอียด</small></td></tr>`;
  }).join('');
  const cvHtml = a => `<table class="prof36"><tr><td>อายุ / เพศ</td><td>${a.age} ปี · ${a.fem ? '♀ หญิง' : '♂ ชาย'}</td></tr><tr><td>การศึกษา</td><td>${a.edu}</td></tr><tr><td>ประสบการณ์</td><td>${a.exp ? a.exp + ' ปี' : 'ยังไม่มี'}</td></tr><tr><td>ประวัติการทำงาน</td><td>${a.history.map(esc).join('<br>')}</td></tr><tr><td>นิสัย</td><td>${esc(a.trait)}</td></tr>${skillRows(a.skills, a.rev || a)}</table>`;
  const payTxt = e => `${PAYT[e.payType]}${e.payType === 'month' ? ` · จ่ายวันที่ ${e.payDay >= 29 ? 'สิ้นเดือน' : e.payDay}` : e.payType === 'week' ? ` · จ่ายวัน${WK[e.payWk]}` : ' · จ่ายทุกเช้า'} · ${MODE[e.payMode]} · หยุดวัน${WK[e.off]}`;
  const sel = (id, opts, cur) => `<select id="${id}" style="font-size:16px;padding:8px;border-radius:10px;border:1px solid #ccc;margin:2px 0">${opts.map(([v, t]) => `<option value="${v}" ${String(v) === String(cur) ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>`;

  function tabGoods(S2) {
    S.stand = S.stand || {};
    const on = Object.keys(S.stand).filter(k => S.stand[k] > 0), inv = UI.sellables(), e = E();
    return `<p class="lead">วางของไว้ที่แผง ชาวบ้านจะเดินเข้ามาซื้อเอง ${e && working(e) ? '(ตอนนี้มีพนักงานดูแล เปิด 07:00–20:00)' : 'ช่วง 8:00–18:00'} ได้ราคาปกติ +10% · ขายแล้ว ${U.fmt(S.standSold || 0)} ชิ้น</p>
      <h5>บนแผงตอนนี้</h5>${on.length ? `<div class="grid">${on.map(id => `<div class="card"><div class="ci">${ITEMS[id].i}</div><div class="cb"><h4>${esc(ITEMS[id].n)} <small>×${S.stand[id]}</small></h4><p>ขาย ${baht(Math.round(priceOf(id) * 1.1))}</p><div class="row"><button class="btn ghost" data-a="unstand" data-id="${id}">เก็บคืน</button></div></div></div>`).join('')}</div>` : '<p class="empty">แผงยังว่าง</p>'}
      <h5>ของในกระเป๋า</h5>${inv.length ? `<div class="grid">${inv.map(id => `<div class="card"><div class="ci">${ITEMS[id].i}</div><div class="cb"><h4>${esc(ITEMS[id].n)} <small>×${count(id)}</small></h4><div class="row"><button class="btn" data-a="stand" data-id="${id}" data-q="1">วาง 1</button><button class="btn ghost" data-a="stand" data-id="${id}" data-q="all">วางหมด</button></div></div></div>`).join('')}</div>` : '<p class="empty">ไม่มีของที่ขายได้</p>'}`;
  }
  function tabMoney() {
    const s = St(), d = s.day.d === S.day ? s.day : { cash: 0, tr: 0 };
    return `<p class="lead">ลูกค้าเลือกจ่ายเองทุกครั้ง · <b>เงินสด</b> เข้ากระเป๋าทันที · <b>โอน</b> เข้าบัญชีธนาคาร (ดูในแอปธนาคาร)</p>
      <div class="grid"><div class="card"><div class="ci">💵</div><div class="cb"><h4>เงินสด (เข้ากระเป๋า)</h4><p>วันนี้ ${baht(d.cash)} · ทั้งหมด ${baht(s.tot.cash)}</p></div></div>
      <div class="card"><div class="ci">📲</div><div class="cb"><h4>โอนผ่านธนาคาร (พร้อมเพย์)</h4><p>วันนี้ ${baht(d.tr)} · ทั้งหมด ${baht(s.tot.tr)}</p><p class="dim">${hasId() ? `QR รับเงินพร้อมใช้งาน · ยอดออมทรัพย์ ${baht(Bank.st().sav)}` : 'ยังไม่มีบัตรประชาชน จึงลงทะเบียน QR รับโอนไม่ได้ ลูกค้าจ่ายเงินสดอย่างเดียว (ทำบัตรที่ศูนย์ราชการ)'}</p>${hasId() ? `<div class="row"><button class="btn ${s.acc ? '' : 'ghost'}" data-a="v48" data-v="acc">${s.acc ? '✅ เปิดรับโอนอยู่' : '⛔ ปิดรับโอน (เปิด)'}</button></div>` : ''}</div></div></div>
      ${s.short ? `<p class="dim">⚠️ ยอดที่ขาดหายจากการขายโดยพนักงาน รวม ${baht(s.short)}</p>` : ''}
      <h5>รายการขายล่าสุด</h5>${s.led.length ? `<div class="msgs">${s.led.slice(0, 15).map(l => `<div class="msg"><b>${ITEMS[l.id] ? ITEMS[l.id].i + ' ' + esc(ITEMS[l.id].n) : l.id} ×${l.n}</b> <small>${RD(l.d)} ${l.t}${l.by ? ' · ขายโดย ' + esc(l.by) : ''}</small><p>${l.m === 'cash' ? '💵 เงินสด → กระเป๋า' : '📲 โอน → ธนาคาร'} ${baht(l.amt)}</p></div>`).join('')}</div>` : '<p class="empty">ยังไม่มีรายการขาย</p>'}`;
  }
  function tabStaff() {
    const s = St(), e = s.emp;
    if (U48.view === 'contract') return contractForm();
    if (e) return employeeHtml(e);
    const open = s.apps.filter(a => ['new', 'neg', 'agreed'].includes(a.st));
    let h = `<p class="lead">ยังไม่มีพนักงานที่แผง · ${s.open ? '📢 กำลังเปิดรับสมัคร (มีคนสมัครมาเรื่อยๆ)' : 'ยังไม่ได้ประกาศรับสมัคร'}</p>
      <div class="row"><button class="btn ${s.open ? 'ghost' : ''}" data-a="v48" data-v="open">${s.open ? 'ปิดรับสมัคร' : '📢 ประกาศรับสมัครคนขายแผง'}</button></div>
      <p class="dim">ค่าแรงขั้นต่ำที่ต้องจ่าย ${baht(MIN_DAY)}/วัน ≈ ${baht(MIN_WAGE)}/เดือน · ผู้สมัครอยู่ได้ 7 วันก่อนไปทำที่อื่น</p>`;
    h += open.length ? '<div class="grid">' + open.map(a => appCard(a)).join('') + '</div>' : `<p class="empty">${s.open ? 'ยังไม่มีผู้สมัคร รอสักครู่ ใบสมัครจะมาทางข้อความ' : 'ประกาศรับสมัครแล้วจะมีคนสมัครมา'}</p>`;
    if (s.hist.length) h += `<h5>อดีตพนักงาน</h5><ul class="lead">${s.hist.map(x => `<li>${esc(x.name)} · ${RD(x.from)} ถึง ${RD(x.to)} · ${esc(x.why)}</li>`).join('')}</ul>`;
    return h;
  }
  function appCard(a) {
    const open = U48.view === a.id, st = { new: 'ใบสมัครใหม่', neg: `กำลังเจรจา (รอบ ${a.round}/${a.patience})`, agreed: '✅ ตกลงเงินเดือนแล้ว' }[a.st] || a.st;
    const offers = [a.ask - 1000, a.ask - 500, a.ask, a.ask + 500].filter(x => x >= 0);
    return `<div class="card"><div class="ci">${a.fem ? '👩' : '👨'}</div><div class="cb"><h4>${esc(a.name)} <small>${a.age} ปี · ${a.edu} · ประสบการณ์ ${a.exp} ปี</small></h4><p>ขอเงินเดือน <b>${baht(a.ask)}</b> · ${st} · ตอบภายใน${RD(a.until)}</p>
      <div class="row"><button class="btn ghost" data-a="v48" data-v="view|${a.id}">${open ? 'ซ่อนประวัติ' : '📄 ดูประวัติ'}</button><button class="btn" data-a="v48" data-v="hire|${a.id}">✔ รับเข้าทำงาน ${baht(a.ask)}</button><button class="btn ghost" data-a="v48" data-v="rej|${a.id}">ปฏิเสธ</button></div>
      ${open ? cvHtml(a) + `<div class="row"><button class="btn ghost" data-a="v48" data-v="intv|${a.id}" ${a.int ? 'disabled' : ''}>💬 ${a.int ? 'สัมภาษณ์แล้ว' : 'สัมภาษณ์ (30 นาที)'}</button><button class="btn ghost" data-a="v48" data-v="chk|${a.id}" ${a.chkTxt ? 'disabled' : ''}>🔎 ${a.chkTxt ? 'ตรวจประวัติแล้ว' : 'ตรวจประวัติ/ผู้ค้ำ (200 ฿)'}</button></div>` + (a.st !== 'agreed' ? `<h5>เจรจาเงินเดือน (ผู้สมัครขอ ${baht(a.ask)})</h5><div class="row">${offers.map(o => `<button class="btn ghost" data-a="v48" data-v="offer|${a.id}|${o}">เสนอ ${baht(o)}</button>`).join('')}</div><div class="row"><input id="v48Off${a.id}" type="number" min="0" step="100" placeholder="เสนอเอง (บาท/เดือน)" style="flex:1;font-size:16px;padding:8px;border-radius:10px;border:1px solid #ccc"><button class="btn" data-a="v48" data-v="offerx|${a.id}">เสนอ</button></div>` : '') : ''}</div></div>`;
  }
  function contractForm() {
    const a = St().apps.find(x => x.id === U48.form); if (!a) { U48.view = 0; return tabStaff(); }
    return `<p class="lead">สัญญาจ้าง: ${esc(a.name)} · เงินเดือน ${baht(a.ask)}/เดือน · ทดลองงาน 30 วัน</p>
      <div class="card"><div class="cb">
      <p class="dim">รูปแบบการจ่าย</p>${sel('v48Type', [['month', 'รายเดือน'], ['week', 'รายสัปดาห์'], ['day', 'รายวัน (ทุกเช้า)']], 'month')}
      <p class="dim">วันที่จ่าย (รายเดือน)</p>${sel('v48Day', [...Array.from({ length: 28 }, (_, i) => [i + 1, 'วันที่ ' + (i + 1)]), [99, 'สิ้นเดือน']], 28)}
      <p class="dim">วันจ่าย (รายสัปดาห์)</p>${sel('v48Wk', WK.map((n, i) => [i, 'วัน' + n]), 5)}
      <p class="dim">จ่ายด้วย</p>${sel('v48Mode', [['cash', 'เงินสด (หักจากกระเป๋า)'], ['transfer', 'โอนเข้าบัญชี (หักจากบัญชีธนาคาร)']], 'cash')}
      <p class="dim">วันหยุดประจำสัปดาห์</p>${sel('v48Off', WK.map((n, i) => [i, 'วัน' + n]), 6)}</div></div>
      <div class="row end"><button class="btn ghost" data-a="v48" data-v="back">กลับ</button><button class="btn" data-a="v48" data-v="sign|${a.id}">✍️ เซ็นสัญญา เริ่มงานพรุ่งนี้</button></div>`;
  }
  function employeeHtml(e) {
    const on = working(e), sk = e.skills, ten = S.day - e.hired, prob = ten < 30;
    return `<div class="card"><div class="ci">${e.fem ? '👩‍🌾' : '👨‍🌾'}</div><div class="cb"><h4>${esc(e.name)} <small>พนักงานแผงหน้าฟาร์ม · ${on ? '🟢 กำลังขายของ' : '⚪ ไม่ได้อยู่เวร'}</small></h4>
      <p>เงินเดือน <b>${baht(e.wage)}</b>/เดือน · ${payTxt(e)}</p><p class="dim">ทำงานมา ${ten} วัน${prob ? ` (ทดลองงานอีก ${30 - ten} วัน)` : ''} · ขวัญกำลังใจ ${Math.round(e.morale)}% · ขายแล้ว ${e.sold || 0} ชิ้น ${baht(e.rev || 0)} · จ่ายแล้วรวม ${baht(e.paid || 0)}</p>
      <p>ยอดค้างจ่าย <b>${baht(Math.round(e.owed || 0))}</b>${e.late ? ` · ⚠️ ค้าง ${e.late} งวด` : ''}${e.lastPay ? ` · จ่ายล่าสุด ${RD(e.lastPay)}` : ''}</p></div></div>
      ${e.raiseReq ? `<div class="card"><div class="ci">💬</div><div class="cb"><h4>${esc(e.name)} ขอปรับเงินเดือนเป็น ${baht(e.raiseReq)}</h4><div class="row"><button class="btn" data-a="v48" data-v="raiseok">ตกลง</button><button class="btn ghost" data-a="v48" data-v="raiseno">ไม่ตกลง</button></div></div></div>` : ''}
      <div class="row"><button class="btn" data-a="v48" data-v="pay|cash" ${e.owed >= 1 ? '' : 'disabled'}>💵 จ่ายตอนนี้ (เงินสด)</button><button class="btn" data-a="v48" data-v="pay|transfer" ${e.owed >= 1 ? '' : 'disabled'}>📲 จ่ายตอนนี้ (โอน)</button><button class="btn ghost" data-a="v48" data-v="bonus|500">🎁 โบนัส 500</button><button class="btn ghost" data-a="v48" data-v="bonus|1000">🎁 โบนัส 1,000</button></div>
      <h5>แก้สัญญา / ปรับเงินเดือน</h5>
      <p class="dim">รูปแบบ ${sel('v48Type', [['month', 'รายเดือน'], ['week', 'รายสัปดาห์'], ['day', 'รายวัน']], e.payType)} วันที่ ${sel('v48Day', [...Array.from({ length: 28 }, (_, i) => [i + 1, i + 1]), [99, 'สิ้นเดือน']], e.payDay)} วัน ${sel('v48Wk', WK.map((n, i) => [i, n]), e.payWk)} ${sel('v48Mode', [['cash', 'เงินสด'], ['transfer', 'โอน']], e.payMode)} หยุด ${sel('v48Off', WK.map((n, i) => [i, n]), e.off)}</p>
      <div class="row"><button class="btn" data-a="v48" data-v="save">บันทึกสัญญา</button></div>
      <div class="row"><input id="v48Raise" type="number" min="${MIN_WAGE}" step="100" placeholder="เงินเดือนใหม่ (บาท)" style="flex:1;font-size:16px;padding:8px;border-radius:10px;border:1px solid #ccc"><button class="btn" data-a="v48" data-v="raise">เสนอเงินเดือนใหม่</button></div>
      ${auditHtml(e)}
      <h5>ประวัติพนักงาน</h5>${cvHtml(e)}
      <div class="row end"><button class="btn ghost danger" data-a="v48" data-v="fire">เลิกจ้าง</button></div>`;
  }
  function openStand() {
    S.stand = S.stand || {};
    UI.open('🧺 แผงผักสดจากไร่', ['จัดของ', 'การรับเงิน', 'พนักงาน'], t => { U48.tab = t; return t === 0 ? tabGoods() : t === 1 ? tabMoney() : tabStaff(); }, { tab: U48.tab, wide: true });
  }
  Social.standUI = function () { U48.view = 0; openStand(); };
  const refresh = () => { try { UI.renderBody(); } catch (e) { } };

  UI.H.v48 = d => {
    const [a, x, y] = String(d.v || '').split('|'), s = St(), e = s.emp, ap = x && s.apps.find(q => q.id === +x);
    if (a === 'acc') { s.acc = s.acc ? 0 : 1; }
    else if (a === 'open') { s.open = s.open ? 0 : 1; toast(s.open ? 'ประกาศรับสมัครแล้ว จะมีคนสมัครมาทางข้อความ' : 'ปิดรับสมัครแล้ว', '📢'); }
    else if (a === 'view') { U48.view = U48.view === +x ? 0 : +x; }
    else if (a === 'rej') { if (ap) { ap.st = 'rejected'; toast(`ปฏิเสธ ${ap.name} แล้ว`, '🙅'); } }
    else if (a === 'offer' || a === 'offerx') { if (ap) offer(ap, a === 'offer' ? +y : +val('v48Off' + ap.id)); }
    else if (a === 'hire') { if (e) { toast('มีพนักงานอยู่แล้ว', 'ℹ️'); return; } if (ap && ['new', 'neg', 'agreed'].includes(ap.st)) { ap.st = 'agreed'; U48.view = 'contract'; U48.form = ap.id; } }
    else if (a === 'intv' && ap) {
      if (ap.int) return; ap.int = 1; try { tick(30); } catch (z) { }
      const k = ap.skills, sc = overall(k); toast(`สัมภาษณ์ ${ap.name}: ${sc >= 7 ? 'ตอบคล่อง มั่นใจ' : sc >= 5 ? 'พอใช้ ยังต้องเรียนรู้' : 'ประหม่า ตอบไม่ค่อยตรงประเด็น'}`, '💬');
    }
    else if (a === 'chk' && ap) {
      if (ap.chkTxt) return; if (S.money < 200) { toast('ค่าตรวจประวัติ 200 ฿ เงินสดไม่พอ', '💸'); return; } S.money -= 200;
      const h = clamp(ap.skills.honesty + (R() < 0.2 ? (R() < 0.5 ? -2 : 2) : (R() < 0.5 ? -1 : 0)), 1, 10);
      ap.chkTxt = h >= 8 ? '✅ ผู้ค้ำยืนยันว่าซื่อสัตย์มาก' : h >= 6 ? '🙂 ประวัติปกติ ไม่พบเรื่องเสียหาย' : h >= 4 ? '⚠️ ผู้ค้ำบอกว่าเคยมีเรื่องเงินไม่ตรง ควรระวัง' : '🚫 เคยถูกเลิกจ้างเรื่องเงินในร้านเดิม'; toast(`ผลตรวจประวัติ ${ap.name}: ${ap.chkTxt}`, '🔎');
    }
    else if (a === 'audit' && e) auditNow(e);
    else if (a === 'awarn' && e) { e.warn = (e.warn || 0) + 1; e.morale = clamp(e.morale - 8, 0, 100); U48.audit = null; toast(`ตักเตือน ${e.name} เป็นลายลักษณ์อักษร (ครั้งที่ ${e.warn})`, '📄'); if (e.warn >= 3) quit('ถูกตักเตือนเรื่องเงินหลายครั้ง'); }
    else if (a === 'arec' && e && U48.audit) { const d = U48.audit.diff; e.owed = (e.owed || 0) - d; e.morale = clamp(e.morale - 15, 0, 100); U48.audit = null; toast(`หักค่าเสียหาย ${baht(d)} จากเงินเดือนที่ค้างจ่ายของ ${e.name}`, '⚖️'); if (e.skills.honesty <= 3 && R() < 0.35) quit('ไม่พอใจที่ถูกหักเงินเดือน'); }
    else if (a === 'arep' && e && U48.audit) {
      const d = U48.audit.diff, back = R() < 0.6 ? Math.round(d * (0.4 + R() * 0.4)) : 0; U48.audit = null; if (back) { S.money += back; try { Bank2.log('ได้คืนเงินจากคดียักยอก (แผงหน้าฟาร์ม)', back); } catch (z) { } }
      const s2 = St(); s2.hist.unshift({ name: e.name, from: e.hired, to: S.day, why: 'ทุจริตเงินขาย (แจ้งความ ไม่มีค่าชดเชย)', owed: 0 }); s2.emp = null; hideStaff(); toast(back ? `ตำรวจติดตามเงินคืนได้ ${baht(back)}` : 'แจ้งความแล้ว ยังติดตามเงินคืนไม่ได้', '🚓'); Phone.msg('สถานีตำรวจ', `รับแจ้งความคดียักยอกเงินจากแผงหน้าฟาร์ม (${e.name}) ${back ? `ติดตามเงินคืนได้ ${baht(back)}` : 'อยู่ระหว่างติดตาม'}`, true);
    }
    else if (a === 'back') { U48.view = 0; }
    else if (a === 'sign' && ap) {
      if (s.emp) return; const type = val('v48Type') || 'month';
      s.emp = { id: ap.id, name: ap.name, fem: ap.fem, age: ap.age, edu: ap.edu, exp: ap.exp, skills: ap.skills, trait: ap.trait, history: ap.history, look: ap.look, int: 1, chkTxt: ap.chkTxt || '', wage: ap.ask, payType: type, payDay: +val('v48Day') || 28, payWk: +val('v48Wk') || 0, payMode: val('v48Mode') || 'cash', off: +val('v48Off'), hired: S.day + 1, morale: 70, owed: 0, paid: 0, late: 0, sold: 0, rev: 0 };
      if (isNaN(s.emp.off)) s.emp.off = 6;
      ap.st = 'hired'; s.apps = s.apps.filter(q => q.st !== 'hired'); s.open = 0; U48.view = 0; Phone.msg(ap.name, `ขอบคุณที่รับเข้าทำงานนะคะ/ครับ จะเริ่มงานพรุ่งนี้เวลา 07:00 ค่ะ/ครับ 🙏`, true); toast(`${ap.name} เริ่มงานพรุ่งนี้`, '🤝');
    }
    else if (a === 'save' && e) { e.payType = val('v48Type') || e.payType; e.payDay = +val('v48Day') || e.payDay; e.payWk = +val('v48Wk'); e.payMode = val('v48Mode') || e.payMode; e.off = +val('v48Off'); if (isNaN(e.payWk)) e.payWk = 0; if (isNaN(e.off)) e.off = 6; toast('บันทึกสัญญาแล้ว', '📝'); }
    else if (a === 'pay' && e) payNow(x, false);
    else if (a === 'bonus' && e) { const b = +x; if (S.money < b) { toast('เงินสดไม่พอ', '💸'); return; } S.money -= b; e.morale = clamp(e.morale + b / 100, 0, 100); try { Bank2.log('โบนัสพนักงานแผง', -b); } catch (z) { } toast(`จ่ายโบนัส ${baht(b)} ขวัญกำลังใจดีขึ้น`, '🎁'); }
    else if (a === 'raiseok' && e && e.raiseReq) { e.wage = e.raiseReq; e.raisedAt = S.day; e.raiseReq = 0; e.morale = clamp(e.morale + 10, 0, 100); toast('ปรับเงินเดือนแล้ว', '📈'); }
    else if (a === 'raiseno' && e) { e.raiseReq = 0; e.raisedAt = S.day; e.morale = clamp(e.morale - 8, 0, 100); toast('ไม่ปรับเงินเดือน พนักงานผิดหวังเล็กน้อย', '😕'); }
    else if (a === 'raise' && e) {
      const w = +val('v48Raise'); if (!(w > 0)) return;
      if (w < e.wage) { e.morale = clamp(e.morale - 20, 0, 100); toast(`${e.name}: “ลดเงินเดือนผมไม่ยอมนะ”`, '😠'); if (R() < 0.3) quit('ถูกเสนอลดเงินเดือน'); return; }
      if (w < MIN_WAGE) { toast(`ต่ำกว่าค่าแรงขั้นต่ำ ${baht(MIN_WAGE)}`, '⚖️'); return; }
      e.wage = r100(w); e.raisedAt = S.day; e.morale = clamp(e.morale + 8, 0, 100); toast(`ปรับเงินเดือนเป็น ${baht(e.wage)} แล้ว`, '📈');
    }
    else if (a === 'fire' && e) {
      const ten = S.day - e.hired, sev = ten >= 120 ? Math.round(e.wage) : 0, owe = Math.round(e.owed || 0);
      UI.confirm('เลิกจ้างพนักงาน?', `จ่ายค้าง ${baht(owe)}${sev ? ` + ค่าชดเชย ${baht(sev)} (ทำงานเกิน 120 วัน)` : ten < 30 ? ' (อยู่ในช่วงทดลองงาน ไม่มีค่าชดเชย)' : ''} รวม ${baht(owe + sev)} จากเงินสด`, 'เลิกจ้าง', () => {
        const tot = owe + sev; if (S.money < tot) { toast('เงินสดไม่พอจ่ายค้างและค่าชดเชย', '💸'); return; } S.money -= tot; try { Bank2.log('จ่ายเลิกจ้างพนักงานแผง', -tot); } catch (z) { }
        const s2 = St(); s2.hist.unshift({ name: e.name, from: e.hired, to: S.day, why: 'นายจ้างเลิกจ้าง', owed: 0 }); s2.emp = null; hideStaff(); openStand(); U48.tab = 2; UI.renderBody();
      }); return;
    }
    refresh();
  };
  // audit: what the till should have taken against what really arrived, since the last audit
  function auditNow(e) {
    const s = St(), k0 = s.aud ? s.aud.k : 0, rows = s.led.filter(l => l.k > k0 && l.by), exp = rows.reduce((a, l) => a + (l.exp || l.amt), 0), got = rows.reduce((a, l) => a + l.amt, 0), diff = Math.max(0, Math.round(exp - got)), sus = rows.filter(l => (l.exp || l.amt) > l.amt).length;
    s.aud = { k: s.lseq || 0, day: S.day }; U48.audit = { rows: rows.length, exp: Math.round(exp), got: Math.round(got), diff, sus, from: k0 };
    toast(diff ? `ตรวจยอด: เงินขาดหาย ${baht(diff)}` : 'ตรวจยอดแล้ว เงินตรงกับรายการขาย', diff ? '⚠️' : '✅');
  }
  const auditHtml = e => {
    const a = U48.audit, last = St().aud;
    let h = `<h5>🔍 ตรวจสอบยอดขาย / เงินสด</h5><p class="dim">เทียบ "ยอดที่ควรได้" กับ "เงินที่เข้าจริง" ของรายการขายที่พนักงานดูแล${last ? ` · ตรวจล่าสุด ${RD(last.day)}` : ' · ยังไม่เคยตรวจ'} · การตรวจสม่ำเสมอทำให้พนักงานไม่กล้าโกง</p><div class="row"><button class="btn" data-a="v48" data-v="audit">🔍 ตรวจนับยอดตอนนี้</button></div>`;
    if (a) h += `<div class="card"><div class="ci">${a.diff ? '🚨' : '✅'}</div><div class="cb"><h4>ผลตรวจ ${a.rows} รายการขาย</h4><p>ควรได้ ${baht(a.exp)} · เข้าจริง ${baht(a.got)}</p><p class="${a.diff ? 'bad' : 'good'}">${a.diff ? `เงินขาด ${baht(a.diff)} จาก ${a.sus} รายการเงินสดที่ยอดไม่ครบ` : 'ไม่พบความผิดปกติ'}</p>${a.diff ? `<div class="row"><button class="btn ghost" data-a="v48" data-v="awarn">📄 ตักเตือน</button><button class="btn ghost" data-a="v48" data-v="arec">⚖️ หักชดใช้ ${baht(a.diff)}</button><button class="btn ghost danger" data-a="v48" data-v="arep">🚓 เลิกจ้าง + แจ้งความ</button></div>` : ''}</div></div>`;
    return h;
  };
  function offer(a, amt) {
    if (!(amt > 0)) { toast('ใส่จำนวนเงินที่เสนอ', 'ℹ️'); return; }
    amt = r100(amt);
    if (amt < MIN_WAGE) { toast(`${a.name}: “ต่ำกว่าค่าแรงขั้นต่ำ ${baht(MIN_WAGE)} ไม่ได้ค่ะ/ครับ”`, '⚖️'); return; }
    const floor = a.ask0 * (1 - a.flex);
    if (amt >= a.ask || amt >= floor) { a.ask = amt >= a.ask ? a.ask : amt; if (amt > a.ask) a.ask = amt; a.st = 'agreed'; toast(`${a.name}: “ตกลงค่ะ/ครับ ${baht(a.ask)}”`, '🤝'); return; }
    a.round++; a.st = 'neg';
    if (a.round >= a.patience) { a.st = 'withdrawn'; Phone.msg('สมัครงานแผงหน้าฟาร์ม', `${a.name}: “ขอบคุณที่ให้โอกาสนะคะ/ครับ แต่เงินเดือนไม่ตรงกับที่ต้องการ ขอไปหางานที่อื่นก่อน”`, false); toast(`${a.name} ถอนใบสมัคร`, '🙇'); return; }
    a.ask = Math.max(r100(floor), r100((a.ask + amt) / 2)); toast(`${a.name}: “ขอ ${baht(a.ask)} ได้ไหมคะ/ครับ”`, '💬');
  }

  // a new application is never missed: a toast at once and a pop-up the moment nothing else is open
  setInterval(() => {
    try {
      const s = St(); if (!G.started || !s.unread || G.simulating || G.paused) return;
      if (typeof UI.isOpen === 'function' ? UI.isOpen() : !!UI.cur) return;
      const n = s.apps.filter(a => a.st === 'new').length; s.unread = 0; if (!n) return;
      UI.confirm('📢 มีผู้สมัครงานใหม่', `มีผู้สมัครงานคนขายแผงผักสดจากไร่ ${n} คน รอการพิจารณา ดูประวัติ สัมภาษณ์ ต่อรองเงินเดือน แล้วเลือกรับเข้าทำงานหรือปฏิเสธได้ (ผู้สมัครรอได้ 7 วัน)`, 'ดูใบสมัคร', () => { U48.tab = 2; U48.view = 0; Social.standUI(); });
    } catch (x) { }
  }, 2500);
  // phone app + the stand prompt
  if (!APPS.some(a => a.id === 'stand48')) APPS.splice(Math.min(APPS.length, 15), 0, { id: 'stand48', i: '🧺', n: 'แผงผักสดจากไร่' });
  Phone.apps.stand48 = () => { setTimeout(() => { Phone.app = null; UI.close(); Social.standUI(); }, 0); return ''; };
  try { if (typeof APP_GROUPS !== 'undefined') { const gr = APP_GROUPS.find(x => /ฟาร์ม|ไร่/.test(x[0])) || APP_GROUPS[0]; if (gr && !gr[1].includes('stand48')) gr[1].push('stand48'); } } catch (e) { }
  try { const poi = World.pois.find(x => x.label === 'แผงขายหน้าฟาร์ม'); if (poi) poi.act = () => ({ icon: '🧺', label: (St().apps.some(a => a.st === 'new') ? '📢 มีผู้สมัครงานใหม่ · ' : '') + (staffed() ? `แผงหน้าฟาร์ม (${E().name} กำลังขายของ)` : 'แผงหน้าฟาร์ม: จัดของ / การรับเงิน / พนักงาน'), fn: () => Social.standUI() }); } catch (e) { }
  window.Stand48 = { St, genApplicant, payNow, working, offer, fx, hasId, canTransfer, MIN_WAGE };
});
