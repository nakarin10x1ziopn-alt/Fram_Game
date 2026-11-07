'use strict';
// ---------- v31_disaster: disasters & preparedness — flood, storm, drought, PM2.5 haze and heat wave. Forecasts days ahead (watch → warning →
// strike), preparation (sandbags from the farm shop, moving cars, raising belongings, tying down the roof, crop covers, water and food
// stock, masks, air purifier, rehydration salts), real damage to house / crops / cars / power / health, recovery work, home & car & crop
// insurance claims (through the same record as the insurance-commission counter), disaster-area relief money that needs the ID card and
// house registration (and the farmer registration for crop aid). Phone app "🌪️ ภัยพิบัติ & เตรียมรับมือ" ----------
V23.add('v31_disaster', () => {
  const YD = 84;
  const DEF = () => ({ ev: [], hist: [], kit: { water: 0, food: 0, cover: 0, pur: 0, ors: 0 }, cropIns: 0, last: -99, n: 0, pend: [], stats: { events: 0, loss: 0, ins: 0, aid: 0, spent: 0 } });
  const Dd = () => {
    const x = S.v31dz = S.v31dz || {}, d = DEF();
    for (const k in d) if (x[k] === undefined || x[k] === null) x[k] = d[k];
    for (const k in d.kit) if (typeof x.kit[k] !== 'number') x.kit[k] = 0;
    for (const k in d.stats) if (typeof x.stats[k] !== 'number') x.stats[k] = 0;
    if (!Array.isArray(x.ev)) x.ev = [];
    x.ev = x.ev.filter(e => e && typeof e === 'object' && TYPES[e.type]);
    for (const e of x.ev) {      // an event written by an older build or by hand may lack parts; every reader assumes they exist
      e.prep = e.prep || { sand: 0, raised: 0, moved: 0, tied: 0, cover: 0 };
      const dm = e.dmg = e.dmg || {}; dm.house = dm.house || 0; dm.pts = dm.pts || 0; dm.parts = dm.parts || {}; dm.plots = dm.plots || 0; dm.cropVal = dm.cropVal || 0; dm.cars = Array.isArray(dm.cars) ? dm.cars : []; dm.animals = dm.animals || 0;
      e.ins = e.ins || { home: 0, car: 0, crop: 0 }; e.claims = e.claims || {};
    }
    if (!Array.isArray(x.hist)) x.hist = []; if (!Array.isArray(x.pend)) x.pend = [];
    return x;
  };
  const msg = (from, t, q) => { try { Phone.msg(from, t, q); } catch (e) { } };
  const hold = (n, label) => { n = Math.round(+n) || 0; if (S.money < n) { UI.toast(`เงินไม่พอ ต้องใช้ ${baht(n)}`, '💸'); return false; } S.money -= n; Dd().stats.spent += n; try { Bank2.log(label, -n); } catch (e) { } return true; };
  const gain = (n, src) => { n = Math.round(+n) || 0; if (n <= 0) return; try { earn(n); } catch (e) { S.money += n; } try { Bank2.income(src, n); } catch (e) { } };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const rint = (a, b) => Math.floor(rnd(a, b + 1));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mood = n => { S.mood = clamp((S.mood ?? 70) + n, 0, 100); };
  const energy = n => { S.energy = clamp(S.energy + n, 0, maxEnergy()); };
  const needDoc = (ids, what) => !window.Gov24 || Gov24.need(ids, what);
  const hasDoc = id => !window.Gov24 || !!Gov24.has(id);
  const dayNo = d => RD(d);

  // ================= disaster types =================
  const TYPES = {
    flood: { n: 'น้ำท่วม', i: '🌊', from: 'ปภ. เตือนภัย 1784', p: { hot: 0.004, rain: 0.05, cool: 0.002 }, lead: [2, 4], dur: s => 3 + s },
    storm: { n: 'พายุฝนฟ้าคะนอง', i: '🌀', from: 'กรมอุตุนิยมวิทยา', p: { hot: 0.02, rain: 0.055, cool: 0.004 }, lead: [1, 3], dur: s => s >= 3 ? 2 : 1 },
    drought: { n: 'ภัยแล้ง', i: '🏜️', from: 'กรมป้องกันและบรรเทาสาธารณภัย', p: { hot: 0.05, rain: 0, cool: 0.015 }, lead: [2, 4], dur: s => 4 + s * 2 },
    haze: { n: 'ฝุ่น PM2.5', i: '😷', from: 'กรมควบคุมมลพิษ', p: { hot: 0.003, rain: 0, cool: 0.005 }, lead: [1, 2], dur: s => 3 + s * 2 },
    heat: { n: 'คลื่นความร้อน', i: '🔥', from: 'กรมอุตุนิยมวิทยา', p: { hot: 0.06, rain: 0.004, cool: 0 }, lead: [2, 3], dur: s => 3 + s },
  };
  const LEVEL = ['', '🟡 เฝ้าระวัง', '🟠 เตือนภัย', '🔴 ภัยพิบัติรุนแรง'];
  const COL = ['', 'ระดับ 1 เฝ้าระวัง', 'ระดับ 2 เตือนภัย', 'ระดับ 3 รุนแรง'];
  const TIPS = {
    flood: 'วางกระสอบทรายกั้นน้ำ · ยกของขึ้นที่สูง · ย้ายรถไปที่สูง · สำรองน้ำและอาหารแห้ง · ติดตั้งเครื่องปั่นไฟ/แบตเตอรี่สำรอง · ทำประกันบ้าน',
    storm: 'ปิดหน้าต่างและมัดหลังคา · คลุมแปลงผัก · ย้ายรถ · เตรียมไฟสำรอง · ทำประกันบ้าน',
    drought: 'สำรองน้ำ · ติดตั้งถังเก็บน้ำ/ระบบน้ำหยด/บ่อบาดาล · คลุมแปลงด้วยตาข่ายพรางแสง · ทำประกันพืชผล',
    haze: 'สวมหน้ากาก N95 เมื่ออยู่นอกอาคาร · ใช้เครื่องฟอกอากาศ · หลีกเลี่ยงงานกลางแจ้ง · งดเผาในที่โล่ง',
    heat: 'ดื่มน้ำและเกลือแร่ · เปิดแอร์/พัดลม · เก็บเกี่ยวช่วงเช้า · ใช้ตาข่ายพรางแสงคลุมแปลง',
  };
  const find = id => Dd().ev.find(e => e.id === id);
  const on = type => Dd().ev.find(e => e.type === type && e.st === 'active') || null;
  const forecast = () => Dd().ev.filter(e => e.st === 'forecast');

  // ================= creating and announcing =================
  const create = (type, sev, lead) => {
    const X = Dd(), T = TYPES[type]; if (!T) return null;
    sev = sev || (() => { const r = Math.random(); return r < 0.5 ? 1 : r < 0.85 ? 2 : 3; })();
    lead = lead == null ? rint(T.lead[0], T.lead[1]) : lead;
    const start = S.day + lead, ev = {
      id: ++X.n, type, sev, made: S.day, start, end: start + T.dur(sev) - 1, st: 'forecast',
      prep: { sand: 0, raised: 0, moved: 0, tied: 0, cover: 0 },
      dmg: { house: 0, pts: 0, parts: {}, plots: 0, cropVal: 0, cars: [], cleaned: 0, repaired: 0, carsFixed: 0, peaked: 0, animals: 0 },
      ins: { home: 0, car: 0, crop: 0 }, claims: {}, declared: 0, pm: 0,
    };
    X.ev.push(ev); X.last = start;
    announce(ev, 'new');
    return ev;
  };
  const sizeText = ev => ev.type === 'flood' ? `ระดับน้ำสูงประมาณ ${20 + ev.sev * 25} ซม.` : ev.type === 'storm' ? `ลมกระโชกแรง ${60 + ev.sev * 20} กม./ชม.` : ev.type === 'drought' ? `ฝนทิ้งช่วง ${ev.end - ev.start + 1} วัน` : ev.type === 'haze' ? `ค่า PM2.5 คาด ${55 + ev.sev * 40}–${95 + ev.sev * 40} มคก./ลบ.ม.` : `อุณหภูมิสูงสุด ${38 + ev.sev} °C`;
  function announce(ev, kind) {
    const T = TYPES[ev.type], left = ev.start - S.day;
    if (kind === 'new') msg(T.from, `${T.i} ${LEVEL[ev.sev]}: ${T.n} ในอีก ${left} วัน (${dayNo(ev.start)}–${ev.end}) ${sizeText(ev)} · เตรียมตัวที่แอป "ภัยพิบัติ & เตรียมรับมือ" · คำแนะนำ: ${TIPS[ev.type]}`, ev.sev < 2);
    else if (kind === 'eve') msg(T.from, `${T.i} พรุ่งนี้ ${T.n}! ${LEVEL[ev.sev]} ${sizeText(ev)} · เตรียมให้เสร็จวันนี้`, false);
    else if (kind === 'start') { msg(T.from, `${T.i} ${T.n}เริ่มแล้ว (${LEVEL[ev.sev]}) ${sizeText(ev)} ต่อเนื่องถึง ${dayNo(ev.end)}`, false); try { UI.toast(`${T.i} ${T.n}เริ่มแล้ว: ${COL[ev.sev]}`, T.i); } catch (e) { } }
  }

  // ================= effects =================
  const croppedPlots = () => { const out = []; (S.plots || []).forEach((p, i) => { if (p && p.c) out.push(i); }); return out; };
  const coverN = () => Dd().kit.cover * 6;
  const covered = (ev, k) => ev.prep.cover && k < coverN();     // k = running index among planted plots
  const killPlot = (i, ev) => {
    const p = S.plots[i], C = (typeof CROPS !== 'undefined' && CROPS[p.c]) || {}, val = (C.sell || 40) * (C.yield || 1);
    ev.dmg.plots++; ev.dmg.cropVal += val; p.c = null; p.g = 0; p.f = 0; p.w = 0;
    try { if (typeof refreshPlot === 'function') refreshPlot(i); } catch (e) { }
  };
  const loseCrops = (ev, chance) => { const L = croppedPlots(); L.forEach((i, k) => { const c = chance * (covered(ev, k) ? 0.25 : 1); if (Math.random() < c) killPlot(i, ev); }); };
  const drySome = (ev, chance) => {
    const W = (typeof Water !== 'undefined' && Water.st) ? Water.st() : {}, drip = W.drip ? 0.35 : 1, wet = (W.well || (W.tank && W.lvl > 200)) ? 0.7 : 1;
    croppedPlots().forEach((i, k) => { const c = chance * drip * wet * (covered(ev, k) ? 0.5 : 1); if (Math.random() < c) { const p = S.plots[i]; p.w = 0; p.dry = (p.dry || 0) + 12; } });
  };
  const houseHit = (ev, base, parts, protect) => {
    const loss = Math.round(base * rnd(0.6, 1.4) * (1 - protect) / 50) * 50;
    ev.dmg.house = loss; if (!loss) return;
    const pts = Math.min(60, Math.round(loss / 600)); ev.dmg.pts = pts;
    try { if (typeof Maint !== 'undefined') Maint.st().house = Math.max(0, Maint.st().house - pts); } catch (e) { }
    try {
      const h = S.v26l && S.v26l.house && S.v26l.house.c;
      if (h) for (const k of parts) { const d = Math.min(h[k] ?? 0, Math.round(pts / parts.length)); h[k] = (h[k] ?? 0) - d; ev.dmg.parts[k] = d; }
    } catch (e) { }
  };
  const carsHit = (ev, chance, lossPer) => {
    (S.cars || []).forEach((c, i) => {
      if (ev.prep.moved) return;
      if (Math.random() >= chance) return;
      const st = (typeof Town2 !== 'undefined' && Town2.carState) ? Town2.carState(c) : c, loss = Math.min(st.cond ?? 100, Math.round(lossPer * rnd(0.6, 1.4)));
      if (loss <= 0) return; st.cond = (st.cond ?? 100) - loss; ev.dmg.cars.push({ i, loss, cost: loss * 90 });
    });
  };
  const hurtAnimals = n => { try { for (const a of S.animals || []) a.happy = Math.max(0, (a.happy ?? 50) - n); } catch (e) { } };
  const outage = (hrs, why) => { try { if (typeof Grid !== 'undefined' && Grid.outageStart) Grid.outageStart(hrs, why); } catch (e) { } };
  const sandCount = ev => ev.prep.sand + (() => { try { return (Coop.st().bags >= 10 ? 10 : 0); } catch (e) { return 0; } })();

  const peak = ev => {
    if (ev.dmg.peaked) return; ev.dmg.peaked = 1;
    const T = TYPES[ev.type], s = ev.sev;
    ev.ins = { home: Ins.has('home') ? 1 : 0, car: (Ins.has('car1') || false) ? 1 : 0, crop: Dd().cropIns >= S.day ? 1 : 0 };
    try { const x = window.Agency26 && Agency26.st().ins; if (x && (ev.type === 'flood' || ev.type === 'storm')) x.stormDay = S.day; } catch (e) { }
    if (ev.type === 'flood') {
      const need = s * 20, protect = clamp(sandCount(ev) / need, 0, 1) * 0.7 + (ev.prep.raised ? 0.15 : 0);
      houseHit(ev, [5000, 11000, 22000][s - 1], ['wire', 'plumb', 'paint'], protect);
      loseCrops(ev, 0.25 * s * (1 - protect)); carsHit(ev, 1, 22 * s); hurtAnimals(8 * s);
      if (s >= 2) outage(5 * s, 'น้ำท่วมสถานีไฟฟ้าย่อย');
    } else if (ev.type === 'storm') {
      const protect = ev.prep.tied ? 0.45 : 0;
      houseHit(ev, [4000, 9000, 18000][s - 1], ['roof', 'paint'], protect);
      loseCrops(ev, 0.12 * s); carsHit(ev, 0.12 * s, 30); hurtAnimals(5 * s);
      outage(3 * s, 'พายุทำให้เสาไฟและต้นไม้ล้มทับสายไฟ');
    }
    if (ev.type === 'flood' || ev.type === 'storm' || ev.type === 'drought') {
      if (s >= 2) { ev.declared = 1; try { Coop.st().relief = S.day + 4; } catch (e) { } }
    }
    const d = ev.dmg, carCost = d.cars.reduce((t, c) => t + c.cost, 0);
    if (ev.type === 'flood' || ev.type === 'storm') {
      msg('ปภ. อำเภอ', `${T.i} ความเสียหายเบื้องต้น: บ้านประมาณ ${baht(d.house)} · แปลงผักเสียหาย ${d.plots} แปลง (${baht(d.cropVal)}) · รถ ${d.cars.length} คัน (ซ่อม ${baht(carCost)})${ev.declared ? ' · ประกาศเป็นพื้นที่ภัยพิบัติ ขอเงินเยียวยาได้ที่แอป' : ''}`, false);
      try { UI.toast(`${T.i} ${T.n}: บ้านเสียหาย ${baht(d.house)} · พืชผลเสียหาย ${d.plots} แปลง`, '⚠️'); } catch (e) { }
    }
  };
  const supply = (ev, di) => {
    const X = Dd(), W = (typeof Water !== 'undefined' && Water.st) ? Water.st() : {};
    const waterCut = (ev.type === 'flood' && ev.sev >= 2 && di >= 1) || (ev.type === 'drought' && ev.sev >= 2 && di >= 2);
    const foodCut = ev.type === 'flood' && ev.sev >= 2 && di >= 1;
    if (waterCut) {
      if (X.kit.water > 0) { X.kit.water--; } else if (!(W.well || (W.tank && W.lvl > 200))) { S.thirst = clamp((S.thirst ?? 80) - 22, 0, 100); mood(-2); }
    }
    if (foodCut) { if (X.kit.food > 0) X.kit.food--; else { S.hunger = clamp((S.hunger ?? 80) - 15, 0, 100); mood(-2); } }
  };
  const sick = why => { try { if (!S.sick) { if (typeof Life2 !== 'undefined' && Life2.getSick) Life2.getSick(why); else { S.sick = 1; S.sickDays = 0; } return true; } } catch (e) { } return false; };
  const dayEffects = (ev, di) => {
    const s = ev.sev, X = Dd();
    // keep the sky in line with the event
    try {
      if (ev.type === 'flood') S.weather.type = di === 1 && s >= 2 ? 'storm' : 'rain';
      else if (ev.type === 'storm') S.weather.type = di === 0 ? 'storm' : 'rain';
      else if (ev.type === 'drought' || ev.type === 'heat') S.weather.type = Math.random() < 0.8 ? 'sunny' : 'partly';
      S.weather.change = -1;
    } catch (e) { }
    if (ev.type === 'flood') {
      if (di === 1 || (ev.end === ev.start) || S.day === ev.end) peak(ev);
      supply(ev, di);
      if (!ev.dmg.cleaned && !S.sick && Math.random() < 0.05 * s) sick('โรคฉี่หนูจากน้ำท่วมขังรอบบ้าน');
    } else if (ev.type === 'storm') {
      peak(ev); if (di >= 1) outage(2, 'ไฟฟ้าขัดข้องหลังพายุ');
    } else if (ev.type === 'drought') {
      if (di === 0) peak(ev);
      drySome(ev, 0.35 * s); supply(ev, di);
      try { const W = Water.st(); if (W.tank) W.lvl = Math.max(0, W.lvl - 150 * s); } catch (e) { }
      if (di >= 2) { const L = croppedPlots().filter(i => S.plots[i].w <= 0); L.forEach((i, k) => { const W = (typeof Water !== 'undefined' && Water.st) ? Water.st() : {}; if (Math.random() < 0.04 * s * (W.drip ? 0.3 : 1) * (covered(ev, k) ? 0.5 : 1)) killPlot(i, ev); }); }
      mood(-(1 + s));
    } else if (ev.type === 'haze') {
      if (di === 0) peak(ev);
      ev.pm = Math.round(rnd(55 + s * 40, 95 + s * 40));
      let p = 0.12 * s, mask = false;
      if (count('n95') > 0) { if (!(typeof RL !== 'undefined' && RL.on('pm25') && !G.inside)) takeItem('n95', 1); p *= 0.35; mask = true; }   // RL.day already uses one mask a day while the haze event runs
      if ((S.furn && S.furn.airpurifier) || X.kit.pur) p *= 0.5;
      if (Math.random() < p) sick(`ภูมิแพ้และหอบจากฝุ่น PM2.5 (${ev.pm} มคก./ลบ.ม.)${mask ? '' : ' ไม่ได้สวมหน้ากาก'}`);
      mood(-(s >= 3 ? 3 : 1));
    } else if (ev.type === 'heat') {
      if (di === 0) peak(ev);
      const ac = S.furn && S.furn.aircon && !S.powerOff; let loss = (ac ? 3 : 10) * s, sm = ac ? 0.3 : 1;
      if (X.kit.ors > 0) { X.kit.ors--; loss *= 0.6; sm *= 0.3; }
      energy(-loss); mood(-(1 + s)); drySome(ev, 0.3 * s);
      if (Math.random() < 0.07 * s * sm) sick('ฮีทสโตรกจากอากาศร้อนจัด');
    }
  };
  const onset = ev => {
    ev.st = 'active'; announce(ev, 'start');
    if (ev.type === 'haze') { try { if (typeof RL !== 'undefined' && !RL.on('pm25')) RL.start('pm25', ev.end - ev.start + 1, `ค่าฝุ่น PM2.5 เกินมาตรฐาน (${55 + ev.sev * 40} มคก./ลบ.ม.) ทำงานกลางแจ้งเหนื่อยกว่าปกติ ควรสวมหน้ากาก N95`, '😷'); } catch (e) { } }
    if (ev.type === 'flood' || ev.type === 'storm') ev.ins.home = Ins.has('home') ? 1 : 0;
  };
  const finish = ev => {
    const X = Dd(), T = TYPES[ev.type], d = ev.dmg, carCost = d.cars.reduce((t, c) => t + c.cost, 0), total = d.house + d.cropVal + carCost;
    X.stats.events++; X.stats.loss += total; ev.total = total;
    if (ev.type === 'flood' || ev.type === 'storm' || ev.type === 'drought') {
      msg(T.from, `${T.i} ${T.n}ผ่านไปแล้ว ความเสียหายรวมประมาณ ${baht(total)}${total ? ` · ฟื้นฟูและยื่นเอกสารได้ภายใน 14 วัน (ล้างบ้าน ซ่อมแซม เคลมประกัน ขอเงินเยียวยา)` : ' · เตรียมพร้อมดีมาก ไม่มีความเสียหาย'}`, false);
    } else msg(T.from, `${T.i} ${T.n}คลี่คลายแล้ว ดูแลสุขภาพต่อไปนะ`, true);
  };
  const archive = ev => {
    const X = Dd(); X.hist.unshift({ type: ev.type, sev: ev.sev, start: ev.start, end: ev.end, loss: ev.total || 0, ins: ev.claims.homePaid || 0, aid: ev.claims.aidPaid || 0 });
    X.hist.length = Math.min(X.hist.length, 20); X.ev = X.ev.filter(e => e !== ev);
  };
  const setNextWeather = ev => {
    const left = ev.start - S.day, w = ev.type === 'flood' ? (ev.sev >= 2 ? 'storm' : 'rain') : ev.type === 'storm' ? 'storm' : (ev.type === 'drought' || ev.type === 'heat') ? 'sunny' : null; if (!w) return;
    try { if (left === 1) S.weather.next = w; else if (left === 2) S.weather.next2 = w; } catch (e) { }
  };
  const proc = ev => {
    if (S.day < ev.start) {
      const left = ev.start - S.day; setNextWeather(ev);
      if (left === 1 && !ev.eve) { ev.eve = 1; announce(ev, 'eve'); }
      return;
    }
    if (S.day <= ev.end) { if (ev.st !== 'active') onset(ev); dayEffects(ev, S.day - ev.start); return; }
    if (ev.st === 'active' || ev.st === 'forecast') { ev.st = 'recovery'; finish(ev); }
    if (S.day > ev.end + 14) archive(ev);
  };
  const payouts = () => {
    const X = Dd(), keep = [];
    for (const p of X.pend) { if (S.day >= p.day) { gain(p.amt, p.src); X.stats[p.kind === 'aid' ? 'aid' : 'ins'] += p.amt; msg(p.from, `${p.what} ${baht(p.amt)} โอนเข้าบัญชีแล้ว`, false); } else keep.push(p); }
    X.pend = keep;
  };
  const roll = () => {
    const X = Dd();
    if (S.day < 6 || (typeof G !== 'undefined' && G.fresh && S.day < 8)) return;
    if (X.ev.some(e => e.st === 'forecast' || e.st === 'active')) return;
    if (S.day - X.last < 5) return;
    const se = season().id, keys = Object.keys(TYPES).sort(() => Math.random() - 0.5);
    for (const k of keys) if (Math.random() < TYPES[k].p[se] * 0.6) { create(k); break; }
  };
  const daily = () => {
    const X = Dd();
    for (const ev of X.ev.slice()) { try { proc(ev); } catch (e) { console.warn('v31 disaster proc', e); } }
    try { payouts(); } catch (e) { console.warn('v31 payouts', e); }
    try { roll(); } catch (e) { console.warn('v31 roll', e); }
    // a crop-insurance policy that ran out
    if (X.cropIns && X.cropIns < S.day && !X.cropWarn) { X.cropWarn = 1; msg('ธ.ก.ส.', 'ประกันภัยพืชผลของคุณหมดอายุแล้ว', true); }
  };

  // ================= actions =================
  const A = {}, hub = { tab: 0 };
  const forEvent = id => find(+id);
  const spendTime = (mins, e) => { try { UI.close(); fade(() => { tick(mins); setTimeout(() => open(), 400); }); } catch (er) { } if (e) energy(-e); };
  A.sand = id => {
    const ev = forEvent(id); if (!ev || ev.dmg.peaked) return;
    const have = count('sandbag'), need = ev.sev * 20 - sandCount(ev);
    if (need <= 0) { UI.toast('กระสอบทรายพอแล้ว', '🧱'); return; }
    if (!have) { UI.toast('ไม่มีกระสอบทราย ซื้อ 10 ใบได้ที่แท็บเตรียมพร้อม', '🧱'); return; }
    if (S.energy < 8) { UI.toast('เหนื่อยเกินไป พักก่อน', '😮‍💨'); return; }
    const n = Math.min(10, have, need); takeItem('sandbag', n); ev.prep.sand += n;
    UI.toast(`วางกระสอบทราย ${n} ใบ (รวม ${sandCount(ev)}/${ev.sev * 20})`, '🧱'); spendTime(30, 8);
  };
  A.raise = id => { const ev = forEvent(id); if (!ev || ev.dmg.peaked || ev.prep.raised) return; if (S.energy < 6) { UI.toast('เหนื่อยเกินไป', '😮‍💨'); return; } ev.prep.raised = 1; UI.toast('ยกของมีค่าและเครื่องใช้ไฟฟ้าขึ้นที่สูงแล้ว', '📦'); spendTime(40, 6); };
  A.move = id => { const ev = forEvent(id); if (!ev || ev.dmg.peaked || ev.prep.moved) return; if (!(S.cars || []).length) { UI.toast('คุณยังไม่มีรถ', '🚗'); return; } ev.prep.moved = 1; UI.toast('ย้ายรถไปจอดที่สูงแล้ว', '🚗'); spendTime(20, 3); };
  A.tie = id => { const ev = forEvent(id); if (!ev || ev.dmg.peaked || ev.prep.tied) return; if (S.energy < 10) { UI.toast('เหนื่อยเกินไป', '😮‍💨'); return; } ev.prep.tied = 1; UI.toast('ปิดหน้าต่าง มัดหลังคา เก็บของลานบ้านเรียบร้อย', '🪢'); spendTime(60, 10); };
  A.cover = id => {
    const ev = forEvent(id); if (!ev || ev.dmg.peaked && ev.type !== 'drought' && ev.type !== 'heat' || ev.prep.cover) return;
    if (Dd().kit.cover < 1) { UI.toast('ซื้อตาข่าย/ผ้าคลุมแปลงก่อน', '🧺'); return; } if (S.energy < 6) { UI.toast('เหนื่อยเกินไป', '😮‍💨'); return; }
    ev.prep.cover = 1; UI.toast(`คลุมแปลง ${Math.min(coverN(), croppedPlots().length)} แปลงแล้ว`, '🧺'); spendTime(30, 6);
  };
  const SHOP = {
    sandbag: { n: 'กระสอบทราย 10 ใบ', i: '🧱', p: 450, d: 'วางกั้นน้ำท่วม (ต้องวาง ' + '20/40/60 ใบตามระดับ) · ของเดียวกับที่ร้านเกษตร', buy: () => addItem('sandbag', 10) },
    water: { n: 'น้ำดื่มสำรอง 1 ลัง (ใช้ได้ 3 วัน)', i: '🚰', p: 120, d: 'ใช้เองอัตโนมัติเมื่อน้ำประปาถูกตัด (น้ำท่วมรุนแรง/ภัยแล้ง)', buy: k => { k.water += 3; } },
    food: { n: 'ถุงยังชีพอาหารแห้ง (3 วัน)', i: '🥫', p: 180, d: 'ใช้เองเมื่อน้ำท่วมจนซื้ออาหารไม่ได้', buy: k => { k.food += 3; } },
    cover: { n: 'ตาข่ายพรางแสง/ผ้าคลุมแปลง 1 ชุด (6 แปลง)', i: '🧺', p: 350, d: 'ลดความเสียหายพืชผลจากพายุ ความร้อน และภัยแล้ง (ซื้อเก็บไว้ใช้ซ้ำได้)', buy: k => { k.cover += 1; } },
    pur: { n: 'เครื่องฟอกอากาศ', i: '🌬️', p: 4500, d: 'ลดโอกาสป่วยจากฝุ่น PM2.5 ลงครึ่งหนึ่ง', buy: k => { k.pur = 1; }, once: k => k.pur || (S.furn && S.furn.airpurifier) },
    ors: { n: 'ผงเกลือแร่ 5 ซอง', i: '🧂', p: 75, d: 'ใช้ 1 ซองต่อวันช่วงคลื่นความร้อน ลดพลังงานที่เสียและโอกาสฮีทสโตรก', buy: k => { k.ors += 5; } },
    mask: { n: 'หน้ากาก N95 5 ชิ้น', i: '😷', p: 350, d: 'ใช้ 1 ชิ้นต่อวันช่วงฝุ่น ลดโอกาสป่วย 65%', buy: () => addItem('n95', 5) },
  };
  A.buy = k => { const X = SHOP[k], K = Dd().kit; if (!X) return; if (X.once && X.once(K)) { UI.toast('มีแล้ว', '✔️'); return; } if (!hold(X.p, X.n)) return; X.buy(K); UI.toast(`ซื้อ ${X.n} แล้ว`, X.i); };
  A.cropins = () => { const X = Dd(); if (!needDoc(['idcard'], 'ทำประกันภัยพืชผล')) return; if (!hold(600, 'เบี้ยประกันภัยพืชผล 28 วัน')) return; X.cropIns = Math.max(S.day, X.cropIns || 0) + 28; X.cropWarn = 0; UI.toast(`ประกันภัยพืชผลคุ้มครองถึง ${dayNo(X.cropIns)}`, '🌾'); };
  A.insbuy = k => { if (Ins.has(k)) { UI.toast('กรมธรรม์ยังคุ้มครองอยู่', '🛡️'); return; } Ins.buy(k); };
  A.app = id => { UI.close(); setTimeout(() => { try { Phone.open(id); } catch (e) { } }, 0); };
  // recovery
  A.clean = id => {
    const ev = forEvent(id); if (!ev || ev.dmg.cleaned || ev.type !== 'flood') return; const cost = 600 * ev.sev;
    if (S.energy < 20) { UI.toast('เหนื่อยเกินไป พักก่อน', '😮‍💨'); return; } if (!hold(cost, 'ค่าล้างบ้านหลังน้ำท่วม')) return;
    ev.dmg.cleaned = 1; S.sick = S.sick; UI.toast('ล้างบ้านฆ่าเชื้อหลังน้ำลด เรียบร้อย ลดความเสี่ยงโรคฉี่หนู', '🧹'); spendTime(120, 20);
  };
  A.fixhouse = id => {
    const ev = forEvent(id); if (!ev || ev.dmg.repaired || !ev.dmg.house) return; const cost = Math.round(ev.dmg.house * 0.8);
    if (!hold(cost, `ซ่อมบ้านหลัง${TYPES[ev.type].n}`)) return; ev.dmg.repaired = 1;
    try { if (typeof Maint !== 'undefined') Maint.st().house = Math.min(100, Maint.st().house + ev.dmg.pts); } catch (e) { }
    try { const h = S.v26l && S.v26l.house && S.v26l.house.c; if (h) for (const k in ev.dmg.parts) h[k] = Math.min(100, (h[k] ?? 0) + ev.dmg.parts[k]); } catch (e) { }
    UI.toast(`ซ่อมแซมบ้านเรียบร้อย (${baht(cost)})`, '🔨'); spendTime(180, 15);
  };
  A.fixcars = id => {
    const ev = forEvent(id); if (!ev || ev.dmg.carsFixed || !ev.dmg.cars.length) return; const cost = ev.dmg.cars.reduce((t, c) => t + c.cost, 0);
    if (!hold(cost, `ซ่อมรถหลัง${TYPES[ev.type].n}`)) return; ev.dmg.carsFixed = 1;
    for (const c of ev.dmg.cars) { const car = S.cars[c.i]; if (car) { const st = (typeof Town2 !== 'undefined' && Town2.carState) ? Town2.carState(car) : car; st.cond = Math.min(100, (st.cond ?? 0) + c.loss); } }
    UI.toast(`ซ่อมรถเรียบร้อย (${baht(cost)})`, '🔧');
  };
  const claimsLeft = () => { try { const x = Agency26.st().ins; return x.claims.filter(c => c.day > S.day - YD).length < 2; } catch (e) { return true; } };
  const logClaim = (k, amt) => { try { Agency26.st().ins.claims.push({ day: S.day, k, amt }); } catch (e) { } };
  A.claimhome = id => {
    const ev = forEvent(id); if (!ev || !ev.dmg.house || ev.claims.home) return;
    if (!ev.ins.home) { UI.toast('กรมธรรม์บ้านไม่ได้คุ้มครองตอนเกิดเหตุ', '🛡️'); return; }
    if (S.day > ev.end + 14) { UI.toast('เกินกำหนดเคลม 14 วัน', '⏰'); return; }
    if (!claimsLeft()) { UI.toast('เคลมครบ 2 ครั้งต่อปีแล้ว', '🛡️'); return; }
    try { const x = Agency26.st().ins; if (x.stormPaid && x.stormPaid === x.stormDay && x.stormDay >= ev.start && x.stormDay <= ev.end) { UI.toast('เหตุการณ์นี้เคลมผ่านเคาน์เตอร์ คปภ. ไปแล้ว', '🛡️'); return; } } catch (e) { }
    if (!needDoc(['idcard', 'housereg'], 'เคลมประกันบ้าน')) return;
    const amt = Math.max(0, Math.min(80000, Math.round(ev.dmg.house * 0.7)) - 1000);
    ev.claims.home = 1; ev.claims.homePaid = amt; Dd().pend.push({ day: S.day + 2, amt, what: 'สินไหมประกันบ้าน (หักค่าเสียหายส่วนแรก 1,000 ฿)', from: 'บริษัทประกันภัย', src: 'สินไหมประกันบ้าน', kind: 'ins' });
    logClaim('home', amt); try { const x = Agency26.st().ins; x.stormPaid = x.stormDay; } catch (e) { }
    UI.toast('แจ้งเคลมแล้ว ผู้สำรวจจะตรวจและโอนเงินใน 2 วัน', '🛡️');
  };
  A.claimcar = id => {
    const ev = forEvent(id); const cost = ev ? ev.dmg.cars.reduce((t, c) => t + c.cost, 0) : 0; if (!ev || !cost || ev.claims.car) return;
    if (!ev.ins.car) { UI.toast('ไม่มีประกันรถชั้น 1 ตอนเกิดเหตุ', '🛡️'); return; }
    if (S.day > ev.end + 14) { UI.toast('เกินกำหนดเคลม 14 วัน', '⏰'); return; } if (!claimsLeft()) { UI.toast('เคลมครบ 2 ครั้งต่อปีแล้ว', '🛡️'); return; }
    if (!needDoc(['idcard'], 'เคลมประกันรถ')) return;
    const amt = Math.round(cost * 0.7); ev.claims.car = 1; Dd().pend.push({ day: S.day + 2, amt, what: 'สินไหมประกันรถยนต์ชั้น 1', from: 'บริษัทประกันภัย', src: 'สินไหมประกันรถ', kind: 'ins' }); logClaim('car', amt);
    UI.toast('แจ้งเคลมประกันรถแล้ว โอนเงินใน 2 วัน', '🛡️');
  };
  A.claimcrop = id => {
    const ev = forEvent(id); if (!ev || !ev.dmg.cropVal || ev.claims.crop) return;
    if (!ev.ins.crop) { UI.toast('ไม่มีประกันภัยพืชผลตอนเกิดเหตุ', '🌾'); return; } if (S.day > ev.end + 14) { UI.toast('เกินกำหนดเคลม 14 วัน', '⏰'); return; }
    if (!needDoc(['idcard'], 'เคลมประกันภัยพืชผล')) return;
    const amt = Math.round(ev.dmg.cropVal * 0.7); ev.claims.crop = 1; Dd().pend.push({ day: S.day + 3, amt, what: 'สินไหมประกันภัยพืชผล (ธ.ก.ส.)', from: 'ธ.ก.ส.', src: 'สินไหมประกันพืชผล', kind: 'ins' });
    UI.toast('แจ้งเคลมพืชผลแล้ว เจ้าหน้าที่ลงพื้นที่ตรวจและโอนเงินใน 3 วัน', '🌾');
  };
  const aidAmount = ev => {
    let amt = 0, farmer = hasDoc('farmer');
    if (ev.type === 'flood') amt = ev.sev >= 3 ? 9000 : 5000; else if (ev.type === 'storm') amt = ev.sev >= 3 ? 8000 : 4000; else if (ev.type === 'drought') amt = farmer ? Math.min(15000, 1500 * Math.max(1, ev.dmg.plots) + ev.sev * 1000) : 0;
    if (ev.type !== 'drought' && farmer && ev.dmg.plots) amt += Math.min(12000, 1500 * ev.dmg.plots);
    return amt;
  };
  A.relief = id => {
    const ev = forEvent(id); if (!ev || !ev.declared || ev.claims.aid) return;
    if (S.day > ev.end + 14) { UI.toast('เกินกำหนดยื่นขอเงินเยียวยา 14 วัน', '⏰'); return; }
    const ids = ev.type === 'drought' ? ['idcard', 'housereg', 'farmer'] : ['idcard', 'housereg']; if (!needDoc(ids, 'ขอเงินเยียวยาผู้ประสบภัยพิบัติ')) return;
    const amt = aidAmount(ev); if (amt <= 0) { UI.toast('ไม่เข้าเกณฑ์รับเงินเยียวยา', '🏛️'); return; }
    ev.claims.aid = 1; ev.claims.aidPaid = amt; Dd().pend.push({ day: S.day + 3, amt, what: `เงินเยียวยาผู้ประสบภัย${TYPES[ev.type].n}`, from: 'ที่ว่าการอำเภอสุขใจ', src: 'เงินเยียวยาผู้ประสบภัยพิบัติ', kind: 'aid' });
    UI.toast('ยื่นขอเงินเยียวยาแล้ว อำเภอสำรวจและโอนเงินใน 3 วัน', '🏛️');
  };
  A.help = () => { try { if (Coop.st().relief >= S.day) { UI.close(); setTimeout(() => Coop.reliefUI(), 0); } else UI.toast('ตอนนี้หมู่บ้านไม่ต้องการความช่วยเหลือ', '🛖'); } catch (e) { } };
  A.tab = n => { hub.tab = +n; if (UI.cur) UI.cur.tab = +n; };
  UI.H.v31dz = d => { const [k, ...r] = String(d.v || '').split('|'); const f = A[k]; if (f) { try { f(...r); } catch (e) { if (e && e.spend173) throw e; console.warn('v31dz', k, e); } } };

  // ================= UI =================
  const B = (act, label, o = {}) => `<button class="btn ${o.ghost ? 'ghost' : ''}" data-a="v31dz" data-v="${esc(act)}"${o.dis ? ' disabled' : ''}>${label}</button>`;
  const Cd = (i, h, p, btns = '') => `<div class="card"><div class="ci">${i}</div><div class="cb"><h4>${h}</h4><p class="dim">${p}</p>${btns ? `<div class="row">${btns}</div>` : ''}</div></div>`;
  const tick1 = (ok, t) => `${ok ? '✅' : '⬜'} ${t}`;
  const planned = () => Dd().ev.filter(e => e.st === 'forecast' || e.st === 'active');
  const tabAlert = () => {
    const X = Dd(), list = planned(); let h = '';
    h += `<p class="lead">📡 ศูนย์เตือนภัยพิบัติ · ฤดู${season().n} · ${S.weather ? WEATHER[S.weather.type].i + ' ' + WEATHER[S.weather.type].n : ''} · พรุ่งนี้ ${S.weather ? WEATHER[S.weather.next].i + ' ' + WEATHER[S.weather.next].n : ''}</p>`;
    if (!list.length) h += `<p class="empty">✅ ตอนนี้ไม่มีประกาศเตือนภัย · ภัยเกิดตามฤดู (น้ำท่วม/พายุหน้าฝน · แล้ง/ความร้อนหน้าร้อน · ฝุ่นหน้าหนาว) และเตือนล่วงหน้า 1–4 วัน เตรียมของไว้ก่อนได้เลย</p>`;
    h += `<div class="grid">` + list.map(ev => {
      const T = TYPES[ev.type], left = ev.start - S.day, p = ev.prep;
      const chk = ev.type === 'flood' ? `${tick1(sandCount(ev) >= ev.sev * 20, `กระสอบทราย ${sandCount(ev)}/${ev.sev * 20}`)} · ${tick1(p.raised, 'ยกของขึ้นที่สูง')} · ${tick1(p.moved || !(S.cars || []).length, 'ย้ายรถ')} · ${tick1(Dd().kit.water > 0, 'น้ำสำรอง')} · ${tick1(Dd().kit.food > 0, 'อาหารแห้ง')}`
        : ev.type === 'storm' ? `${tick1(p.tied, 'ปิดหน้าต่าง/มัดหลังคา')} · ${tick1(p.moved || !(S.cars || []).length, 'ย้ายรถ')} · ${tick1(p.cover, 'คลุมแปลง')}`
          : ev.type === 'drought' ? `${tick1(Dd().kit.water > 0, 'น้ำสำรอง')} · ${tick1(p.cover, 'คลุมแปลง')} · ${tick1((typeof Water !== 'undefined' && Water.st && (Water.st().drip || Water.st().well || Water.st().tank)) || false, 'ถังน้ำ/บ่อ/น้ำหยด')} · ${tick1(Dd().cropIns >= S.day, 'ประกันพืชผล')}`
            : ev.type === 'haze' ? `${tick1(count('n95') > 0, `หน้ากาก N95 (${count('n95')})`)} · ${tick1(Dd().kit.pur || (S.furn && S.furn.airpurifier), 'เครื่องฟอกอากาศ')}`
              : `${tick1(Dd().kit.ors > 0, 'เกลือแร่')} · ${tick1(S.furn && S.furn.aircon, 'แอร์')} · ${tick1(p.cover, 'คลุมแปลง')}`;
      const status = ev.st === 'active' ? `<b class="bad">กำลังเกิดขึ้น (ถึง ${dayNo(ev.end)})</b>${ev.type === 'haze' && ev.pm ? ` · PM2.5 วันนี้ ${ev.pm} มคก./ลบ.ม.` : ''}` : `อีก ${left} วัน (${dayNo(ev.start)}–${ev.end})`;
      return Cd(T.i, `${T.n} · ${LEVEL[ev.sev]}`, `${status}<br>${sizeText(ev)}<br>${chk}<br>แนะนำ: ${TIPS[ev.type]}`, B('tab|1', '🎒 ไปเตรียมพร้อม'));
    }).join('') + `</div>`;
    const rec = X.ev.filter(e => e.st === 'recovery').length;
    if (rec) h += `<p class="lead">🧹 มีภัยที่ผ่านไปแล้ว ${rec} เหตุการณ์ที่ยังฟื้นฟู/เคลมได้ ดูแท็บ "ความเสียหาย & ฟื้นฟู"</p>`;
    return h;
  };
  const tabPrep = () => {
    const X = Dd(), K = X.kit, list = planned().filter(e => !e.dmg.peaked || e.type === 'haze' || e.type === 'heat' || e.type === 'drought');
    let h = `<p class="lead">🎒 ชุดเตรียมพร้อมของคุณ: 🧱 กระสอบทราย ${count('sandbag')} · 🚰 น้ำสำรอง ${K.water} วัน · 🥫 อาหารแห้ง ${K.food} วัน · 🧺 ผ้าคลุมแปลง ${K.cover} ชุด · 🧂 เกลือแร่ ${K.ors} · 😷 N95 ${count('n95')} · 🌬️ ${K.pur || (S.furn && S.furn.airpurifier) ? 'มีเครื่องฟอกอากาศ' : 'ไม่มีเครื่องฟอกอากาศ'} · 🌾 ประกันพืชผล ${K.cropIns >= S.day ? 'ถึง ' + dayNo(K.cropIns) : 'ไม่มี'}</p>`;
    if (list.length) {
      h += `<h5>ลงมือเตรียมรับมือ</h5><div class="grid">` + list.map(ev => {
        const T = TYPES[ev.type], p = ev.prep; let b = '';
        if (ev.type === 'flood') b += B('sand|' + ev.id, `🧱 วางกระสอบทราย (${sandCount(ev)}/${ev.sev * 20})`, { dis: sandCount(ev) >= ev.sev * 20 || ev.dmg.peaked }) + B('raise|' + ev.id, p.raised ? '✅ ยกของแล้ว' : '📦 ยกของขึ้นที่สูง', { dis: !!p.raised }) + B('move|' + ev.id, p.moved ? '✅ ย้ายรถแล้ว' : '🚗 ย้ายรถ', { dis: !!p.moved });
        if (ev.type === 'storm') b += B('tie|' + ev.id, p.tied ? '✅ มัดหลังคาแล้ว' : '🪢 ปิดหน้าต่าง/มัดหลังคา', { dis: !!p.tied }) + B('move|' + ev.id, p.moved ? '✅ ย้ายรถแล้ว' : '🚗 ย้ายรถ', { dis: !!p.moved });
        if (ev.type === 'flood' || ev.type === 'storm' || ev.type === 'drought' || ev.type === 'heat') b += B('cover|' + ev.id, p.cover ? '✅ คลุมแปลงแล้ว' : `🧺 คลุมแปลง (มี ${K.cover} ชุด)`, { dis: !!p.cover });
        if (ev.type === 'drought') b += B('app|water', '🚰 แอปน้ำ: ถัง/บ่อ/น้ำหยด', { ghost: 1 });
        if (ev.type === 'flood' || ev.type === 'storm') b += B('app|grid', '⚡ แอปไฟ: เครื่องปั่นไฟ/แบตสำรอง', { ghost: 1 });
        return Cd(T.i, `${T.n} · ${LEVEL[ev.sev]}`, `${ev.st === 'active' ? 'กำลังเกิดอยู่' : `อีก ${ev.start - S.day} วัน`} · พลังงานของคุณ ${Math.round(S.energy)}`, b);
      }).join('') + `</div>`;
    } else h += `<p class="empty">ตอนนี้ยังไม่มีประกาศภัย ซื้อของเตรียมไว้ล่วงหน้าได้</p>`;
    h += `<h5>ร้านอุปกรณ์เตรียมพร้อม</h5><div class="grid">` + Object.keys(SHOP).map(k => { const s = SHOP[k], had = s.once && s.once(K); return Cd(s.i, s.n, `${s.d}`, B('buy|' + k, had ? '✔️ มีแล้ว' : `ซื้อ ${baht(s.p)}`, { dis: !!had })); }).join('') + `</div>`;
    h += `<h5>ประกันภัย</h5><div class="grid">` + [
      Cd('🏠', 'ประกันบ้าน อัคคีภัย + น้ำท่วม', `${Ins.has('home') ? `คุ้มครองถึง ${dayNo(S.ins.home)}` : 'ยังไม่มีกรมธรรม์'} · จ่ายตามความเสียหาย 70% หักส่วนแรก 1,000 ฿`, B('insbuy|home', Ins.has('home') ? '✔️ คุ้มครองอยู่' : `ซื้อ ${baht(INS.home.price)}`, { dis: Ins.has('home') })),
      Cd('🚗', 'ประกันรถชั้น 1', `${Ins.has('car1') ? 'คุ้มครองอยู่' : 'ยังไม่มี'} · ซ่อมรถเสียหายจากน้ำท่วม/ต้นไม้ล้ม 70%`, B('insbuy|car1', Ins.has('car1') ? '✔️ คุ้มครองอยู่' : `ซื้อ ${baht(INS.car1.price)}`, { dis: Ins.has('car1') })),
      Cd('🌾', 'ประกันภัยพืชผล (ธ.ก.ส.) 28 วัน', `${K.cropIns >= S.day ? 'คุ้มครองถึง ' + dayNo(K.cropIns) : 'ยังไม่มี'} · ต้องใช้บัตรประชาชน · จ่าย 70% ของมูลค่าพืชที่เสียหาย`, B('cropins', `${K.cropIns >= S.day ? 'ต่ออายุ' : 'ซื้อ'} ${baht(600)}`)),
    ].join('') + `</div>`;
    return h;
  };
  const tabRecover = () => {
    const X = Dd(), list = X.ev.filter(e => e.st === 'recovery' || (e.dmg.peaked && e.st === 'active')); let h = '';
    if (X.pend.length) h += `<p class="lead">⏳ รอเงินโอน: ${X.pend.map(p => `${p.what} ${baht(p.amt)} (${RD(p.day)})`).join(' · ')}</p>`;
    try { if (Coop.st().relief >= S.day) h += `<div class="row">${B('help', '🤝 ไปช่วยเหลือชาวบ้านที่ประสบภัย', { ghost: 1 })}</div>`; } catch (e) { }
    if (!list.length) return h + `<p class="empty">ยังไม่มีความเสียหายที่ต้องฟื้นฟู</p>`;
    h += `<div class="grid">` + list.map(ev => {
      const T = TYPES[ev.type], d = ev.dmg, carCost = d.cars.reduce((t, c) => t + c.cost, 0), left = ev.end + 14 - S.day;
      const lines = [];
      if (d.house) lines.push(`🏠 บ้านเสียหาย ${baht(d.house)}${d.repaired ? ' (ซ่อมแล้ว)' : ''}`);
      if (d.plots) lines.push(`🌱 แปลงผักเสียหาย ${d.plots} แปลง (${baht(d.cropVal)})`);
      if (d.cars.length) lines.push(`🚗 รถเสียหาย ${d.cars.length} คัน ซ่อม ${baht(carCost)}${d.carsFixed ? ' (ซ่อมแล้ว)' : ''}`);
      if (!lines.length) lines.push('ไม่มีความเสียหายที่ประเมินได้');
      let b = '';
      if (ev.type === 'flood') b += B('clean|' + ev.id, d.cleaned ? '✅ ล้างบ้านแล้ว' : `🧹 ล้างบ้านฆ่าเชื้อ ${baht(600 * ev.sev)}`, { dis: !!d.cleaned });
      if (d.house) b += B('fixhouse|' + ev.id, d.repaired ? '✅ ซ่อมบ้านแล้ว' : `🔨 ซ่อมบ้าน ${baht(Math.round(d.house * 0.8))}`, { dis: !!d.repaired });
      if (d.cars.length) b += B('fixcars|' + ev.id, d.carsFixed ? '✅ ซ่อมรถแล้ว' : `🔧 ซ่อมรถ ${baht(carCost)}`, { dis: !!d.carsFixed });
      if (d.house) b += B('claimhome|' + ev.id, ev.claims.home ? '✅ เคลมบ้านแล้ว' : `🛡️ เคลมประกันบ้าน${ev.ins.home ? '' : ' (ไม่มีกรมธรรม์ตอนเกิดเหตุ)'}`, { dis: !!ev.claims.home || !ev.ins.home, ghost: !ev.ins.home });
      if (d.cars.length) b += B('claimcar|' + ev.id, ev.claims.car ? '✅ เคลมรถแล้ว' : '🛡️ เคลมประกันรถ', { dis: !!ev.claims.car || !ev.ins.car, ghost: !ev.ins.car });
      if (d.cropVal) b += B('claimcrop|' + ev.id, ev.claims.crop ? '✅ เคลมพืชผลแล้ว' : '🌾 เคลมประกันพืชผล', { dis: !!ev.claims.crop || !ev.ins.crop, ghost: !ev.ins.crop });
      if (ev.declared) b += B('relief|' + ev.id, ev.claims.aid ? '✅ ยื่นเงินเยียวยาแล้ว' : `🏛️ ขอเงินเยียวยา ~${baht(aidAmount(ev))}`, { dis: !!ev.claims.aid });
      return Cd(T.i, `${T.n} ${LEVEL[ev.sev]} · ${dayNo(ev.start)}–${ev.end}`, `${lines.join('<br>')}<br>${ev.declared ? '📢 ประกาศเป็นพื้นที่ภัยพิบัติ · ' : ''}${left >= 0 ? `ยื่นเคลม/ขอเงินเยียวยาได้อีก ${left} วัน` : 'หมดเขตยื่นเรื่องแล้ว'}`, b);
    }).join('') + `</div>`;
    return h;
  };
  const tabHist = () => {
    const X = Dd(), s = X.stats; let h = `<p class="lead">📜 สถิติ: ภัยที่ผ่านมา ${s.events} ครั้ง · ความเสียหายรวม ${baht(s.loss)} · ค่าอุปกรณ์/ซ่อม ${baht(s.spent)} · ได้สินไหมประกัน ${baht(s.ins)} · ได้เงินเยียวยา ${baht(s.aid)}</p>`;
    if (!X.hist.length) return h + `<p class="empty">ยังไม่มีประวัติ</p>`;
    h += `<div class="grid">` + X.hist.map(e => Cd(TYPES[e.type].i, `${TYPES[e.type].n} · ${LEVEL[e.sev]}`, `${dayNo(e.start)}–${e.end} · เสียหาย ${baht(e.loss)}${e.ins ? ` · ประกัน ${baht(e.ins)}` : ''}${e.aid ? ` · เยียวยา ${baht(e.aid)}` : ''}`)).join('') + `</div>`;
    return h;
  };
  const TABS = ['📡 เตือนภัย', '🎒 เตรียมพร้อม', '🧹 ความเสียหาย & ฟื้นฟู', '📜 ประวัติ'];
  const render = t => { hub.tab = t; return t === 0 ? tabAlert() : t === 1 ? tabPrep() : t === 2 ? tabRecover() : tabHist(); };
  function open() { UI.open('🌪️ ภัยพิบัติ & เตรียมรับมือ', TABS, render, { tab: hub.tab, wide: true }); }
  const addApp = (id, i, n, fn) => {
    if (!APPS.some(a => a.id === id)) APPS.splice(Math.min(APPS.length, 13), 0, { id, i, n });
    Phone.apps[id] = () => { setTimeout(() => { Phone.app = null; UI.close(); fn(); }, 0); return ''; };
    if (typeof APP_GROUPS !== 'undefined') { const gr = APP_GROUPS.find(x => /บริการ/.test(x[0])) || APP_GROUPS[APP_GROUPS.length - 1]; if (gr && !gr[1].includes(id)) gr[1].unshift(id); }
  };
  addApp('disaster31', '🌪️', 'ภัยพิบัติ & เตรียมรับมือ', open);

  // ================= hook into the older systems so there is one disaster story, not two =================
  try { if (typeof DIS !== 'undefined') { DIS.flood.se = DIS.drought.se = DIS.storm.se = 'v31'; } } catch (e) { }            // the old random flood/drought/storm roll is replaced; wildfire stays
  try {
    if (typeof Coop !== 'undefined' && Coop.day) { const _cd = Coop.day.bind(Coop); Coop.day = function () { const e = this.st(), f = e.flood; e.flood = 1e9; try { return _cd(); } finally { if (e.flood === 1e9) e.flood = f; } }; }
  } catch (e) { }
  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { daily(); } catch (e) { console.warn('v31 disaster daily', e); } return r; }; }
  Dd();
  window.Disaster31 = { open, st: Dd, on, active: () => planned(), forecast, create, daily, TYPES, SHOP };
});
