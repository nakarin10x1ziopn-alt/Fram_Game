'use strict';
// ---------- Electricity like real life: the electricity office and its app (new meter, bigger meter, TOU meter,
// grid-tied solar permit) with inspection → fee → meter installation, an electrician for the house wiring,
// realistic appliance loads, the Thai progressive / TOU tariff, and power cuts where the house switches to
// the home battery, the EV (V2H / V2L) or a generator, the way a real installation behaves ----------
const METERS = {
  m5: { n: 'มิเตอร์ 5(15)A 1 เฟส', kw: 3.3, fee: 1600, dep: 300, cable: 10 },
  m15: { n: 'มิเตอร์ 15(45)A 1 เฟส', kw: 10, fee: 4450, dep: 2000, cable: 16 },
  m30: { n: 'มิเตอร์ 30(100)A 1 เฟส', kw: 22, fee: 10500, dep: 6000, cable: 35 },
  m3p: { n: 'มิเตอร์ 15(45)A 3 เฟส', kw: 30, fee: 15500, dep: 6000, cable: 16, three: 1 },
};
const TARIFF = { steps: [[150, 3.2484], [400, 4.2218], [1e9, 4.4217]], ft: 0.3972, service: 24.62, vat: 0.07, touPeak: 5.7982, touOff: 2.6369, touService: 38.22, export: 2.2 };
// realistic appliance loads in kW and when they run
const LOADS = [
  ['fridge', 'ตู้เย็น', () => 0.09], ['lights', 'ไฟส่องสว่าง', h => (h >= 18 || h < 6 ? 0.18 : 0.02)],
  ['aircon', 'แอร์ 12,000 BTU', h => (S.ac ? (h >= 20 || h < 6 ? 1.0 : 1.25) : 0)], ['fan', 'พัดลม', h => (S.furn.fan && (h >= 21 || h < 6) && S.fanOn ? 0.05 : 0)],
  ['heater', 'เครื่องทำน้ำอุ่น 3.5 kW', h => (h === 7 || h === 19 ? 0.9 : 0)], ['cooker', 'หม้อหุงข้าว/เตาไฟฟ้า', h => (h === 6 || h === 11 || h === 17 ? 0.7 : 0)],
  ['tv', 'ทีวี', h => ((S.furn.tv || S.furn.smarttv) && h >= 18 && h < 23 ? 0.13 : 0)], ['washer', 'เครื่องซักผ้า', h => (S.furn.washer && h === 9 ? 0.45 : 0)],
  ['pump', 'ปั๊มน้ำ', h => (h === 6 || h === 18 ? 0.4 : 0.03)], ['router', 'เราเตอร์/อุปกรณ์สแตนด์บาย', () => 0.04],
];
for (const [k, n, f] of LOADS) Power.extra.push(f);
Object.assign(PW_ITEMS, {
  v2h: { n: 'เครื่องชาร์จ EV สองทิศทาง (V2H) 10 kW', i: '🔄', price: 45000, desc: () => 'ไฟดับเมื่อไหร่ รถ EV ที่จอดที่บ้านจ่ายไฟให้ทั้งบ้านอัตโนมัติ (ต้องมีตู้สลับไฟ ATS จากช่างไฟ)', block: () => Grid.st().v2h ? 'ติดตั้งแล้ว' : '', buy: () => { Grid.st().v2h = 1; S.furn.evcharger = 1; } },
  v2l: { n: 'หัวแปลง V2L ดึงไฟจากรถ EV 2.2 kW', i: '🔌', price: 4500, desc: () => 'เสียบสายจากรถมาจ่ายตู้เย็น ไฟ พัดลม เราเตอร์ ตอนไฟดับ (สั่งเสียบเองในแอปการไฟฟ้า)', block: () => Grid.st().v2l ? 'มีแล้ว' : '', buy: () => { Grid.st().v2l = 1; } },
  gen: { n: 'เครื่องปั่นไฟเบนซิน 5 kW', i: '⛽', price: 18000, desc: () => `สำรองไฟตอนไฟดับ กินน้ำมัน ~1.5 ลิตร/ชม. (ต้องมีตู้สลับไฟ ATS) น้ำมันในถัง ${Math.round(Grid.st().genFuel)} ลิตร`, block: () => Grid.st().gen ? 'มีแล้ว' : '', buy: () => { const E = Grid.st(); E.gen = 1; E.genFuel = Math.max(E.genFuel, 10); } },
});
PW_ITEMS.batt.desc = () => `อินเวอร์เตอร์ไฮบริด + แบตลิเทียม: ใช้ไฟโซลาร์ตอนกลางคืน และสลับมาจ่ายไฟเองทันทีเมื่อไฟดับ ตอนนี้ ${Power.st().batt}/30 kWh`;
{ const t = SHOPS.evcenter.tabs[1].items; t.splice(t.indexOf('pw:meter'), 1); t.push('pw:v2h', 'pw:v2l', 'pw:gen'); }
CARS.ev_city.v2l = 1; CARS.ev_van.v2l = 1; for (const k of ['ev_sedan', 'ev_suv', 'ev_pickup']) { CARS[k].v2l = 1; CARS[k].v2h = 1; }
const ELEC_SVC = {
  ground: { n: 'ตอกหลักดินและเดินสายดิน', price: 1500, desc: 'มาตรฐานการไฟฟ้า: ต้องมีสายดินก่อนขอมิเตอร์/ตรวจรับ' },
  rcbo: { n: 'เปลี่ยนตู้ไฟเป็นตู้คอนซูเมอร์ + เบรกเกอร์กันดูด (RCBO)', price: 4500, desc: 'กันไฟดูด ไฟรั่วตัดอัตโนมัติ การไฟฟ้ากำหนดให้มี' },
  cable16: { n: 'เปลี่ยนสายเมนเป็น 16 ตร.มม.', price: 3500, desc: 'รองรับมิเตอร์ 15(45)A และ 3 เฟส 15(45)A' },
  cable35: { n: 'เปลี่ยนสายเมนเป็น 35 ตร.มม.', price: 7500, desc: 'รองรับมิเตอร์ 30(100)A' },
  panel3p: { n: 'ตู้ไฟ 3 เฟส + เดินสายใหม่', price: 12000, desc: 'จำเป็นสำหรับมิเตอร์ 3 เฟส (บ้านใหญ่/ชาร์จ EV หลายคัน)' },
  ats: { n: 'ตู้สลับแหล่งจ่ายไฟอัตโนมัติ (ATS) + กันไฟย้อน', price: 8500, desc: 'จำเป็นสำหรับเครื่องปั่นไฟและ V2H (ห้ามจ่ายไฟย้อนเข้าสายการไฟฟ้า อันตรายต่อช่าง)' },
  eng: { n: 'วิศวกรรับรองระบบโซลาร์ (ใช้ยื่นขอขนานไฟ)', price: 3000, desc: 'ตรวจอินเวอร์เตอร์ตามบัญชีรายชื่อที่การไฟฟ้ารับรอง และเซ็นแบบ' },
};
const APP_KIND = {
  up: { n: 'ขอเพิ่มขนาดมิเตอร์', i: '⚡' }, newm: { n: 'ขอใช้ไฟฟ้าบ้านใหม่', i: '🏠' }, tou: { n: 'ขอเปลี่ยนเป็นมิเตอร์ TOU', i: '🕒' }, solar: { n: 'ขอขนานไฟโซลาร์ (โซลาร์ภาคประชาชน)', i: '☀️' },
};

const Grid = {
  st() {
    if (!S.el) {
      const a = Power.st().amp; S.el = { meter: a >= 22 ? 'm30' : a >= 10 ? 'm15' : 'm5', tou: false, wire: { ground: 0, rcbo: 1, cable: a >= 22 ? 35 : a >= 10 ? 16 : 10, p3: 0 }, apps: [], solarOK: false, v2h: 0, v2l: 0, v2lOn: 0, ats: 0, gen: 0, genFuel: 0, lots: {}, src: 'grid', darkH: 0, cause: '', plan: null, n: 0, bills: [], wkPeak: 0, wkOff: 0 };
      // houses already built in older saves keep their power
      for (const [id, l] of Object.entries((S.hb || {}).lots || {})) if (l.stage >= 3) S.el.lots[id] = 'm15';
    }
    Power.st().amp = METERS[S.el.meter].kw; return S.el;
  },
  meterKW() { return METERS[this.st().meter].kw; },
  // ----- applications -----
  check(E, kind, target) {
    const w = E.wire, M = METERS[target] || METERS.m5, out = [];
    if (kind === 'tou') return out;
    if (!w.ground) out.push('ยังไม่มีหลักดิน/สายดิน');
    if (!w.rcbo) out.push('ตู้ไฟยังไม่มีเบรกเกอร์กันดูด (RCBO)');
    if (kind === 'up' && w.cable < M.cable) out.push(`สายเมนเล็กเกินไป (มี ${w.cable} ต้อง ${M.cable} ตร.มม.)`);
    if (kind === 'up' && M.three && !w.p3) out.push('ยังไม่มีตู้ไฟ 3 เฟส');
    if (kind === 'solar' && !E.eng) out.push('ยังไม่มีวิศวกรรับรองระบบโซลาร์');
    if (kind === 'solar' && !(Power.st().panels + Power.st().farm)) out.push('ยังไม่ได้ติดแผงโซลาร์');
    return out;
  },
  apply(kind, target, lot) {
    const E = this.st();
    if (E.apps.some(a => a.kind === kind && a.lot == lot && a.st !== 'done' && a.st !== 'cancel')) { UI.toast('มีคำร้องเรื่องนี้ค้างอยู่แล้ว', '📄'); return; }
    const M = METERS[target], fee = kind === 'tou' ? 6000 : kind === 'solar' ? 0 : kind === 'up' ? Math.max(1000, M.fee - METERS[E.meter].fee + M.dep - METERS[E.meter].dep) : M.fee + M.dep;
    const a = { no: 'คร.' + (6700 + (++E.n)), kind, target, lot: lot || null, st: kind === 'tou' ? 'pay' : 'wait', day: S.day, insp: S.day + 1, fee, note: kind === 'tou' ? 'ไม่ต้องตรวจสอบหน้างาน ชำระเงินแล้วนัดเปลี่ยนมิเตอร์' : 'นัดเจ้าหน้าที่ตรวจสอบสถานที่ พรุ่งนี้ 10:00 น.' };
    E.apps.push(a); UI.toast(`ยื่นคำร้อง ${a.no} แล้ว: ${a.note}`, '📄'); Phone.msg('การไฟฟ้าอำเภอสุขใจ', `รับคำร้อง ${a.no} (${APP_KIND[kind].n}${M ? ' · ' + M.n : ''}) ${a.note}`);
  },
  pay(no) {
    const a = this.st().apps.find(x => x.no === no); if (!a || a.st !== 'pay' || S.money < a.fee) return;
    S.money -= a.fee; Bank2.log('ค่าธรรมเนียมการไฟฟ้า', -a.fee); a.st = 'install'; a.inst = S.day + 1; a.note = `ชำระแล้ว นัดติดตั้ง${RD(a.inst)}`; UI.toast(a.note, '🧾');
  },
  recheck(no) { const a = this.st().apps.find(x => x.no === no); if (!a || a.st !== 'fail' || S.money < 300) return; S.money -= 300; a.st = 'wait'; a.insp = S.day + 1; a.note = 'ขอตรวจใหม่ นัดพรุ่งนี้ 10:00 น.'; UI.toast(a.note, '🔁'); },
  // runs every hour: inspections at 10:00, installations at 13:00
  appsHour(h) {
    const E = this.st();
    for (const a of E.apps) {
      if (a.st === 'wait' && S.day >= a.insp && h >= 10) {
        const bad = a.lot && String(a.lot).startsWith('co:') && typeof Company !== 'undefined' ? Company.elecCheck(a.lot.slice(3), a.target) : this.check(a.lot ? { wire: { ground: 1, rcbo: 1, cable: 16, p3: 0 }, eng: 1 } : E, a.kind, a.target);
        if (bad.length) { a.st = 'fail'; a.note = 'ไม่ผ่านการตรวจ: ' + bad.join(' · '); Phone.msg('การไฟฟ้าอำเภอสุขใจ', `คำร้อง ${a.no} ${a.note} — แก้ไขแล้วขอตรวจใหม่ได้ (ค่าตรวจ 300 ฿)`); }
        else if (a.fee > 0) { a.st = 'pay'; a.note = `ผ่านการตรวจ ชำระค่าธรรมเนียม+เงินประกัน ${baht(a.fee)}`; Phone.msg('การไฟฟ้าอำเภอสุขใจ', `คำร้อง ${a.no} ผ่านการตรวจแล้ว กรุณาชำระ ${baht(a.fee)} ในแอปหรือที่สำนักงาน`); }
        else { a.st = 'install'; a.inst = S.day + 1; a.note = 'ผ่านการตรวจ นัดเปลี่ยนมิเตอร์พรุ่งนี้'; }
      }
      if (a.st === 'install' && S.day >= a.inst && h >= 13) {
        a.st = 'done'; a.note = 'ดำเนินการเสร็จสิ้น';
        if (a.kind === 'up') { E.meter = a.target; Power.st().amp = METERS[a.target].kw; Power.st().trip = 0; }
        if (a.kind === 'newm') E.lots[a.lot] = a.target;
        if (a.kind === 'tou') E.tou = true;
        if (a.kind === 'solar') E.solarOK = true;
        Phone.msg('การไฟฟ้าอำเภอสุขใจ', `คำร้อง ${a.no} ${APP_KIND[a.kind].n} ติดตั้งเรียบร้อยแล้ว ⚡`); Life2.note(APP_KIND[a.kind].n + 'เสร็จเรียบร้อย');
      }
    }
  },
  hire(k) {
    const E = this.st(), J = ELEC_SVC[k], price = Math.round(J.price * (typeof Career !== 'undefined' && Career.is('electrician') ? 0.6 : 1));
    if (S.money < price) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(price), '💸'); return; } S.money -= price; Bank2.log('ค่าช่างไฟ', -price); UI.close();
    fade(() => {
      tick(120);
      if (k === 'ground') E.wire.ground = 1; if (k === 'rcbo') E.wire.rcbo = 1; if (k === 'cable16') E.wire.cable = Math.max(E.wire.cable, 16); if (k === 'cable35') E.wire.cable = 35;
      if (k === 'panel3p') { E.wire.p3 = 1; E.wire.cable = Math.max(E.wire.cable, 16); } if (k === 'ats') E.ats = 1; if (k === 'eng') E.eng = 1;
      UI.toast(`ช่างไฟทำงาน "${J.n}" เสร็จแล้ว${price < J.price ? ' (คุณเป็นช่างไฟเอง ลดค่าแรง 40%)' : ''}`, '🛠️');
    });
  },
  // ----- tariff -----
  bill(imp, peak, off, exp) {
    const E = this.st(); let energy = 0, left = imp, prev = 0;
    if (E.tou) energy = peak * TARIFF.touPeak + off * TARIFF.touOff;
    else for (const [cap, rate] of TARIFF.steps) { const u = Math.min(left, cap - prev); if (u <= 0) break; energy += u * rate; left -= u; prev = cap; }
    const ft = imp * TARIFF.ft, service = E.tou ? TARIFF.touService : TARIFF.service, vat = (energy + ft + service) * TARIFF.vat, credit = E.solarOK ? exp * TARIFF.export : 0;
    return { units: imp, energy, ft, service, vat, total: Math.round(energy + ft + service + vat), credit: Math.round(credit) };
  },
  // ----- power cuts -----
  outageStart(hrs, cause) { const s = Power.st(), E = this.st(); if (s.out > 0) return; s.out = hrs; E.cause = cause; E.darkH = 0; E.notified = 0; },
  hourCuts(h) {
    const E = this.st(), w = S.weather.type;
    if (E.plan && E.plan.day === S.day && h === E.plan.from) this.outageStart(E.plan.hrs, 'ดับไฟตามประกาศเพื่อซ่อมบำรุงสายส่ง');
    if (w === 'storm' && Math.random() < 0.08) this.outageStart(2 + ((Math.random() * 4) | 0), 'พายุทำให้ต้นไม้ล้มทับสายไฟ');
    else if (w === 'rain' && Math.random() < 0.012) this.outageStart(1 + ((Math.random() * 2) | 0), 'ฝนตกหนัก ฟ้าผ่าหม้อแปลง');
    else if (Math.random() < 0.002) this.outageStart(1 + ((Math.random() * 3) | 0), U.pick(['รถชนเสาไฟฟ้า', 'หม้อแปลงไฟฟ้าขัดข้อง', 'งูขึ้นเสาไฟ ทำให้ไฟฟ้าลัดวงจร']));
  },
  morning() {
    const E = this.st();
    if (!E.plan && Math.random() < 0.06) { E.plan = { day: S.day + 2, from: 9, hrs: 6 }; Phone.msg('การไฟฟ้าอำเภอสุขใจ', `ประกาศดับไฟเพื่อปรับปรุงระบบจำหน่าย ${RD(S.day + 2)} เวลา 09:00-15:00 น. ขออภัยในความไม่สะดวก`); }
    if (E.plan && E.plan.day < S.day) E.plan = null;
  },
  evHome(need) { return G.cars.find(o => isEV(o.d) && G.driving !== o && (!need || CARS[o.d.type][need]) && Math.hypot(o.d.x - GARAGE.x, o.d.z - GARAGE.z) < 14 && Town2.carState(o.d).fuel > 15); },
  evKWh(d) { return (CARS[d.type].range || 300) / 6; },
  SRC: { grid: '🔌 ไฟจากการไฟฟ้า', batt: '🔋 แบตเตอรี่บ้าน (อินเวอร์เตอร์ไฮบริด)', solar: '☀️ โซลาร์ + แบตเตอรี่ (ระบบแยกจากกริด)', v2h: '🚗 รถ EV จ่ายไฟทั้งบ้าน (V2H)', gen: '⛽ เครื่องปั่นไฟ', v2l: '🚗 ดึงไฟจากรถ EV เฉพาะเครื่องใช้จำเป็น (V2L)', none: '🌑 ไม่มีไฟ' },
};

// the hourly power model replaces the simpler one from the hi-tech module
Power.hourStep = function (h) {
  const s = this.st(), E = Grid.st(), weekday = (S.day - 1) % 7 < 5, peak = E.tou && weekday && h >= 9 && h < 22;
  Grid.appsHour(h); Grid.hourCuts(h);
  const down = s.out > 0, hybrid = s.batt > 0;
  // grid-tied inverters switch off in a power cut (anti-islanding); a hybrid inverter keeps running on its battery
  const prod = down && !hybrid ? 0 : this.kwp() * this.sun(h) * (1 - (S.solarDust || 0));
  let ev = 0;
  if (!down && S.furn.evcharger && s.evOn && !s.trip) for (const o of G.cars) { const d = o.d; if (!isEV(d) || G.driving === o) continue; Town2.carState(d); if (d.fuel < 100 && Math.hypot(d.x - GARAGE.x, d.z - GARAGE.z) < 14 && (!E.tou || !peak || d.fuel < 30)) { const add = Math.min(100 - d.fuel, 7 / Grid.evKWh(d) * 100); d.fuel += add; ev += add / 100 * Grid.evKWh(d); } }
  const use = this.load(h) + ev; let src = 'grid';
  s.today.prod += prod; s.today.use += use;
  if (!down) {
    if (s.trip) { src = 'none'; }
    else if (use - prod - (hybrid ? Math.min(s.soc, 5) : 0) > s.amp) {
      s.trip = 1; S.ac = false; src = 'none';
      Phone.msg('บ้านอัจฉริยะ', `ไฟเกิน: ใช้ ${use.toFixed(1)} kW แต่${METERS[E.meter].n}รับได้ ${s.amp} kW เบรกเกอร์ตัด! ลดการใช้ไฟ หรือยื่นขอเพิ่มขนาดมิเตอร์ที่การไฟฟ้า`, false);
      if (!G.simulating) UI.toast('เบรกเกอร์ตัด! ใช้ไฟเกินขนาดมิเตอร์ (รีเซ็ตในแอปบ้านอัจฉริยะ)', '⚡');
    } else {
      let net = prod - use;
      if (net > 0) { const c = Math.min(s.batt - s.soc, net); s.soc += c; net -= c; s.today.exp += net; s.wkExp += net; }
      else { const b = Math.min(s.soc, -net); s.soc -= b; const imp = -net - b; s.today.imp += imp; s.wkImp += imp; if (peak) E.wkPeak += imp; else E.wkOff += imp; }
    }
  } else {
    // power cut: pick the first backup that can carry the house
    let need = Math.max(0, use - prod); const surplus = Math.max(0, prod - use);
    if (hybrid) { s.soc = Math.min(s.batt, s.soc + surplus); const b = Math.min(s.soc, need); s.soc -= b; need -= b; if (b > 0 || prod > 0) src = prod > use * 0.5 ? 'solar' : 'batt'; }
    if (need > 0.01) {
      const car = E.v2h && E.ats ? Grid.evHome('v2h') : null;
      if (car) { car.d.fuel = Math.max(0, car.d.fuel - need / Grid.evKWh(car.d) * 100); need = 0; src = 'v2h'; }
      else if (E.gen && E.ats && E.genFuel > 0) { const kw = Math.min(5, need); E.genFuel = Math.max(0, E.genFuel - 0.3 * kw - 0.4); need -= kw; src = 'gen'; }
      else if (E.v2l && E.v2lOn && Grid.evHome('v2l')) { const car2 = Grid.evHome('v2l'), ess = 0.09 + 0.18 + 0.05 + 0.04; car2.d.fuel = Math.max(0, car2.d.fuel - ess / Grid.evKWh(car2.d) * 100); need = 0; src = 'v2l'; S.ac = false; }
      else if (need > 0.01) src = 'none';
    }
    s.out--;
    if (!s.out) { Phone.msg('การไฟฟ้าอำเภอสุขใจ', 'กระแสไฟฟ้ากลับมาใช้งานได้ตามปกติแล้ว', false); if (!G.simulating) UI.toast('ไฟฟ้ากลับมาแล้ว', '💡'); }
  }
  // what happens in the house
  if (src !== E.src) {
    if (down && src !== 'grid') { const m = src === 'none' ? `ไฟดับ (${E.cause}) บ้านไม่มีไฟสำรอง${hybrid ? ' แบตหมดแล้ว' : ''}${s.panels + s.farm && !hybrid ? ' · อินเวอร์เตอร์ออนกริดตัดตัวเองตามมาตรฐานความปลอดภัย' : ''}` : `ไฟดับ (${E.cause}) ระบบสลับไปใช้ ${Grid.SRC[src]} อัตโนมัติ`; Phone.msg('บ้านอัจฉริยะ', m, false); if (!G.simulating) UI.toast(m, src === 'none' ? '🌑' : '🔋'); }
    E.src = src;
  }
  if (src === 'none') { if (!S.powerOff) S.powerOff = 2; S.ac = false; E.darkH++; if (E.darkH === 5) { const per = ['milk', 'egg', 'fish_tilapia', 'meat'].filter(k => count(k) > 0); let lost = 0; for (const k of per) { const n = Math.ceil(count(k) * 0.3); takeItem(k, n); lost += n; } if (lost) Phone.msg('ตู้เย็น', `ไฟดับนานเกิน 4 ชั่วโมง ของสดในตู้เย็นเสีย ${lost} ชิ้น`, false); } }
  else { E.darkH = 0; if (S.powerOff === 2) S.powerOff = 0; }
};
Power.status = function () {
  const s = this.st(), h = Math.floor(S.time / 60), hybrid = s.batt > 0, down = s.out > 0;
  return { prod: down && !hybrid ? 0 : this.kwp() * this.sun(h), use: this.load(h), soc: s.soc, batt: s.batt, dark: Grid.st().src === 'none' || s.trip, src: Grid.st().src };
};
// the weekly bill uses the real tariff (1 game week = 1 billing month)
{
  const _bill = Life2.bill.bind(Life2);
  Life2.bill = function () {
    const s = Power.st(), E = Grid.st(), imp = s.wkImp, exp = s.wkExp, pk = E.wkPeak, off = E.wkOff; _bill();
    const b = Grid.bill(imp, pk, off, exp), due = S.billDue; E.wkPeak = 0; E.wkOff = 0; s.wkImp = 0; s.wkExp = 0;
    if (due) {
      due.elec = Math.max(0, b.total - b.credit); due.detail = b;
      E.bills.unshift({ day: S.day, ...b, exp: Math.round(exp) }); E.bills.length = Math.min(E.bills.length, 6);
      if (b.credit > b.total) { const extra = b.credit - b.total; earn(extra); Bank2.income('ขายไฟคืนการไฟฟ้า', extra); }
      if (!E.solarOK && exp > 5) Phone.msg('การไฟฟ้าอำเภอสุขใจ', `สัปดาห์นี้โซลาร์ของคุณจ่ายไฟเกินใช้ ${Math.round(exp)} หน่วย แต่ยังไม่ได้ขออนุญาตขนานไฟ จึงขายคืนไม่ได้ ยื่นขอได้ในแอปการไฟฟ้า`);
    }
  };
}
const GridApp = {
  html(tab) {
    const E = Grid.st(), s = Power.st(), M = METERS[E.meter];
    if (tab === 1) return `<p class="lead">ยื่นคำร้องออนไลน์ เจ้าหน้าที่นัดตรวจสถานที่วันถัดไป 10:00 → ผ่านแล้วชำระค่าธรรมเนียม → ติดตั้งวันถัดไป 13:00</p><div class="grid">
      ${Object.entries(METERS).filter(([k]) => METERS[k].kw > M.kw && !METERS[k].mv && !METERS[k].biz).map(([k, X]) => `<div class="card"><div class="ci">⚡</div><div class="cb"><h4>ขอเพิ่มเป็น${X.n}</h4><p class="dim">รับไฟได้ ~${X.kw} kW · ค่าธรรมเนียม+เงินประกันส่วนเพิ่ม ~${baht(Math.max(1000, X.fee - M.fee + X.dep - M.dep))} · ต้องใช้สายเมน ${X.cable} ตร.มม.${X.three ? ' + ตู้ 3 เฟส' : ''}</p><div class="row"><button class="btn" data-a="elapply" data-k="up" data-v="${k}">ยื่นคำร้อง</button></div></div></div>`).join('')}
      ${!E.tou ? `<div class="card"><div class="ci">🕒</div><div class="cb"><h4>ขอเปลี่ยนเป็นมิเตอร์ TOU</h4><p class="dim">ค่าไฟกลางคืน/วันหยุด ${TARIFF.touOff} ฿ กลางวันวันทำงาน ${TARIFF.touPeak} ฿ เหมาะกับชาร์จรถ EV ตอนกลางคืน · ค่าเปลี่ยนมิเตอร์ 6,000 ฿</p><div class="row"><button class="btn" data-a="elapply" data-k="tou" data-v="tou">ยื่นคำร้อง</button></div></div></div>` : ''}
      ${!E.solarOK ? `<div class="card"><div class="ci">☀️</div><div class="cb"><h4>ขอขนานไฟโซลาร์ (ขายไฟคืน ${TARIFF.export} ฿/หน่วย)</h4><p class="dim">ต้องมีแผงโซลาร์ และวิศวกรรับรองระบบ · ไม่มีค่าธรรมเนียม</p><div class="row"><button class="btn" data-a="elapply" data-k="solar" data-v="solar">ยื่นคำร้อง</button></div></div></div>` : ''}
      ${typeof Company !== 'undefined' ? Company.list().filter(c => ['setup', 'open'].includes(c.st)).map(c => { const cur = E.lots['co:' + c.id]; return `<div class="card"><div class="ci">🏢</div><div class="cb"><h4>ไฟฟ้า${esc(c.name)}</h4><p class="dim">ตอนนี้: ${cur ? METERS[cur].n : 'ยังไม่มีมิเตอร์'} · ต้องทำระบบไฟอาคาร (และงานแรงสูงถ้าใช้หม้อแปลง) ในหน้าบริษัทก่อน · อัตราค่าไฟประเภทกิจการ</p><div class="row">${Object.entries(METERS).filter(([k, X]) => X.kw >= 10 && (!cur || X.kw > METERS[cur].kw)).map(([k, X]) => `<button class="btn ghost" data-a="elapply" data-k="newm" data-v="${k}" data-l="co:${c.id}">${X.n} ~${X.kw} kW · ${baht(X.fee + X.dep)}</button>`).join('')}</div></div></div>`; }).join('') : ''}
      ${LOTS.filter(L => HomeBuild.st().lots[L.id] && HomeBuild.st().lots[L.id].stage >= 3 && !E.lots[L.id]).map(L => `<div class="card"><div class="ci">🏠</div><div class="cb"><h4>ขอใช้ไฟฟ้าบ้านใหม่: ${L.n}</h4><p class="dim">บ้านใหม่ต้องมีไฟก่อนเข้าอยู่/ปล่อยเช่า</p><div class="row"><button class="btn" data-a="elapply" data-k="newm" data-v="m5" data-l="${L.id}">5(15)A ${baht(METERS.m5.fee + METERS.m5.dep)}</button><button class="btn ghost" data-a="elapply" data-k="newm" data-v="m15" data-l="${L.id}">15(45)A ${baht(METERS.m15.fee + METERS.m15.dep)}</button></div></div></div>`).join('')}</div>`;
    if (tab === 2) return `<p class="lead">ช่างไฟฟ้ารับอนุญาต (ทำเสร็จภายใน 2 ชม.)${typeof Career !== 'undefined' && Career.is('electrician') ? ' · คุณเป็นช่างไฟ ลดค่าแรง 40%' : ''}</p><p class="dim">สภาพบ้านตอนนี้: หลักดิน ${E.wire.ground ? '✅' : '❌'} · เบรกเกอร์กันดูด ${E.wire.rcbo ? '✅' : '❌'} · สายเมน ${E.wire.cable} ตร.มม. · ตู้ 3 เฟส ${E.wire.p3 ? '✅' : '❌'} · ATS ${E.ats ? '✅' : '❌'} · วิศวกรรับรองโซลาร์ ${E.eng ? '✅' : '❌'}</p><div class="grid">${Object.entries(ELEC_SVC).map(([k, J]) => { const done = (k === 'ground' && E.wire.ground) || (k === 'rcbo' && E.wire.rcbo) || (k === 'cable16' && E.wire.cable >= 16) || (k === 'cable35' && E.wire.cable >= 35) || (k === 'panel3p' && E.wire.p3) || (k === 'ats' && E.ats) || (k === 'eng' && E.eng); return `<div class="card"><div class="ci">🛠️</div><div class="cb"><h4>${J.n} ${done ? '✅' : ''}</h4><p class="dim">${J.desc}</p><div class="row"><button class="btn" data-a="elhire" data-v="${k}" ${done || S.money < J.price ? 'disabled' : ''}>${done ? 'ทำแล้ว' : 'จ้าง ' + baht(J.price)}</button></div></div></div>`; }).join('')}</div>`;
    if (tab === 3) return `<p class="lead">🧾 บิลค่าไฟย้ายไปรวมที่หมวด "บิล & ค่าบริการ" ในมือถือ (ค่าไฟฟ้า) และชำระที่แอปธนาคาร แท็บ บิล</p>`;
    const st = Power.status();
    return `<div class="grid"><div class="card"><div class="ci">⚡</div><div class="cb"><h4>${M.n}</h4><p class="dim">รับไฟได้ ~${M.kw} kW${E.tou ? ' · มิเตอร์ TOU' : ''}${E.solarOK ? ' · ขนานไฟโซลาร์แล้ว' : ''} · ตอนนี้ใช้ ${st.use.toFixed(2)} kW</p></div></div>
      <div class="card"><div class="ci">${s.out > 0 ? '🌩️' : '💡'}</div><div class="cb"><h4>${s.out > 0 ? 'ไฟดับ: ' + E.cause : 'ไฟปกติ'}</h4><p class="dim">แหล่งไฟตอนนี้: ${Grid.SRC[E.src] || '-'}${s.out > 0 ? ` · คาดว่าไฟมาใน ${s.out} ชม.` : ''}${E.plan ? ` · ประกาศดับไฟ${RD(E.plan.day)} 09:00-15:00` : ''}</p>${E.v2l ? `<div class="row"><button class="btn ghost" data-a="elv2l">${E.v2lOn ? '🔌 ถอดสาย V2L' : '🔌 เสียบสาย V2L จากรถ EV (ใช้ตอนไฟดับ)'}</button></div>` : ''}${E.gen ? `<p class="dim">เครื่องปั่นไฟ: น้ำมัน ${Math.round(E.genFuel)} ลิตร</p><div class="row"><button class="btn ghost" data-a="elfuel" ${S.money >= 420 ? '' : 'disabled'}>สั่งน้ำมันเบนซิน 10 ลิตร (420 ฿)</button></div>` : ''}</div></div></div>
      <h5>คำร้องของฉัน</h5>${E.apps.length ? `<div class="grid">${E.apps.slice().reverse().slice(0, 8).map(a => `<div class="card"><div class="ci">${APP_KIND[a.kind].i}</div><div class="cb"><h4>${a.no} · ${APP_KIND[a.kind].n}${METERS[a.target] ? ' ' + METERS[a.target].n : ''}</h4><p class="${a.st === 'fail' ? 'bad' : a.st === 'done' ? 'good' : 'dim'}">${{ wait: '🕓 รอตรวจสอบ', pay: '💳 รอชำระเงิน', install: '🔧 รอติดตั้ง', done: '✅ เสร็จสิ้น', fail: '❌ ไม่ผ่าน' }[a.st]} · ${esc(a.note)}</p><div class="row">${a.st === 'pay' ? `<button class="btn" data-a="elpay" data-v="${a.no}" ${S.money >= a.fee ? '' : 'disabled'}>ชำระ ${baht(a.fee)}</button>` : ''}${a.st === 'fail' ? `<button class="btn ghost" data-a="elre" data-v="${a.no}">ขอตรวจใหม่ (300 ฿)</button>` : ''}</div></div></div>`).join('')}</div>` : '<p class="dim">ยังไม่มีคำร้อง</p>'}`;
  },
  billsHTML() { const E = Grid.st(), B8 = window.Bills84 ? Bills84.st() : null, H = (B8 && B8.elecHist) || [], cur = (B8 && B8.acc && B8.acc.wk) || [], u = cur.reduce((a, x) => a + (x.units || 0), 0), pend = cur.reduce((a, x) => a + Math.max(0, (x.total || 0) - (x.credit || 0)), 0);
    return `<h5>⚡ บิลค่าไฟรายเดือน</h5><p class="dim">มิเตอร์จดหน่วยตลอดเดือน ออกบิลวันที่ 1 ของทุกเดือน ครบกำหนดชำระ 14 วัน และถ้าค้างเกิน 7 วันหลังครบกำหนดจะถูกตัดไฟ</p><div class="card"><div class="cb"><h4>รอบบิลปัจจุบัน (ยังไม่ออกบิล)</h4><p class="dim">ใช้ไปแล้วประมาณ ${Math.round(u)} หน่วย · ค่าไฟสะสม ~${baht(Math.round(pend))}</p></div></div>${H.length ? `<table class="tbl"><tr><th>ออกบิล</th><th>หน่วย</th><th>ค่าพลังงาน</th><th>Ft</th><th>ค่าบริการ</th><th>VAT</th><th>ขายคืน</th><th>สุทธิ</th></tr>${H.map(x => `<tr><td>${RD(x.iss)}</td><td>${Math.round(x.units)}</td><td>${Math.round(x.energy)}</td><td>${Math.round(x.ft)}</td><td>${(+x.service).toFixed(2)}</td><td>${Math.round(x.vat)}</td><td>${Math.round(x.credit)}</td><td><b>${Math.round(x.net)}</b></td></tr>`).join('')}</table>` : '<p class="dim">ยังไม่มีบิลรายเดือน (ออกบิลวันที่ 1 ของเดือนถัดไป)</p>'}
      <p class="dim">อัตรา${E.tou ? `ทีโอยู: Peak ${TARIFF.touPeak} / Off-peak ${TARIFF.touOff} ฿/หน่วย` : `ก้าวหน้า: 1-150 หน่วย ${TARIFF.steps[0][1]} · 151-400 ${TARIFF.steps[1][1]} · เกิน 400 ${TARIFF.steps[2][1]} ฿/หน่วย`} + ค่า Ft ${TARIFF.ft} + VAT 7%</p>`; },
  open() { UI.open('การไฟฟ้าอำเภอสุขใจ', ['ภาพรวม & คำร้อง', 'ยื่นคำร้องใหม่', 'จ้างช่างไฟ', 'มิเตอร์ไฟ'], t => this.html(t), { wide: true }); },
};
APPS.splice(4, 0, { id: 'grid', i: '⚡', n: 'การไฟฟ้า' });
Phone.apps.grid = () => { setTimeout(() => { Phone.app = null; UI.close(); GridApp.open(); }, 0); return ''; };
Object.assign(UI.H, {
  elapply: d => Grid.apply(d.k, d.v, d.l), elpay: d => Grid.pay(d.v), elre: d => Grid.recheck(d.v), elhire: d => Grid.hire(d.v),
  elv2l: () => { const E = Grid.st(); if (!E.v2lOn && !Grid.evHome('v2l')) { UI.toast('ต้องจอดรถ EV ที่รองรับ V2L ไว้ที่โรงจอดก่อน', '🚗'); return; } E.v2lOn = E.v2lOn ? 0 : 1; },
  elfuel: () => { if (S.money < 420) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(420), '💸'); return; } S.money -= 420; const E = Grid.st(); E.genFuel = Math.min(40, E.genFuel + 10); UI.toast('น้ำมันมาส่งแล้ว เติมเครื่องปั่นไฟ +10 ลิตร', '⛽'); },
});
// new houses need their own meter before they can be rented
{
  const _rent = UI.H.lotrent; UI.H.lotrent = d => { const st = HomeBuild.st().lots[d.v]; if (!st.rent && !Grid.st().lots[d.v]) { UI.toast('บ้านหลังนี้ยังไม่มีไฟฟ้า ยื่นขอใช้ไฟฟ้าบ้านใหม่ในแอปการไฟฟ้าก่อน', '⚡'); return; } _rent(d); };
}
const GridOffice = {
  init() {
    Grid.st();
    const cx = -105, cz = -400, x = cx - 13, z = cz - 7, rot = Math.PI / 2, o = { w: 9, d: 8, h: 4.2, flat: true, glassFront: true, wall: 0xfff3e0, roof: 0x6a1b9a, sign: 'การไฟฟ้าอำเภอสุขใจ', signStyle: { bg: '#6a1b9a' } };
    const b = World.building(o); b.position.set(x, World.groundY(x, z), z); b.rotation.y = rot; World.outdoor.add(b); Col.box(x, z, o.w / 2 + 0.3, o.d / 2 + 0.3, rot, 'bld'); World.clearNear(x, z, 6, true);
    const door = l2w(x, z, rot, 0, o.d / 2 + 1.7); this.door = door;
    World.pois.push({ kind: 'act', x: door.x, z: door.z, r: 2.4, label: 'การไฟฟ้าอำเภอสุขใจ', icon: '⚡', map: true, act: () => ({ icon: '⚡', label: 'การไฟฟ้า: ยื่นคำร้อง ชำระบิล จ้างช่างไฟ', fn: () => GridApp.open() }) });
    const _sm = Power.morning.bind(Power); Power.morning = () => { _sm(); Grid.morning(); };
  },
};
