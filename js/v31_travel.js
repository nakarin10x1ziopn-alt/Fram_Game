'use strict';
// ---------- v31_travel: inter-city transport network — intercity bus, train and domestic flights between the main village and the
// 9 cities. Timetables in Thai time, ticket classes and baggage, advance booking (ID card for train and air), seats that run out, holiday
// peak fares, weather/flood delays and cancellations, check-in windows, refunds, missed departures, real travel time passing as game time.
// Phone app "🚆 เดินทางข้ามเมือง" ----------
V23.add('v31_travel', () => {
  const T = () => {
    const x = S.v31t = S.v31t || {};
    if (!Array.isArray(x.tix)) x.tix = [];
    if (!x.sold) x.sold = {};
    if (!x.stats) x.stats = { trips: 0, km: 0, spent: 0, refunded: 0, missed: 0, delayMin: 0 };
    if (x.n == null) x.n = 0;
    if (!x.log) x.log = [];
    return x;
  };
  const msg = (from, t, q) => { try { Phone.msg(from, t, q); } catch (e) { } };
  const hash = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const r01 = s => (hash(s) % 10000) / 10000;
  const hm = m => { m = ((Math.round(m) % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
  const absNow = () => S.day * 1440 + S.time;
  const dur = m => { m = Math.max(0, Math.round(m)); const h = Math.floor(m / 60), n = m % 60; return h ? `${h} ชม.${n ? ' ' + n + ' นาที' : ''}` : `${n} นาที`; };
  const holiday = d => !!(window.Cal24 && typeof Cal24.isHoliday === 'function' && Cal24.isHoliday(d));
  const festive = d => { try { const e = window.Cal24 && Cal24.event && Cal24.event(d); return !!e && !e.hol; } catch (er) { return false; } };
  const dayName = d => ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'][(d - 1) % 7];
  const dayLabel = off => off === 0 ? 'วันนี้' : off === 1 ? 'พรุ่งนี้' : `${dayName(S.day + off)} (+${off})`;
  const hasDoc = id => !window.Gov24 || !!Gov24.has(id);
  const needDoc = (ids, what) => !window.Gov24 || Gov24.need(ids, what);
  const pay = (n, label) => { n = Math.round(+n) || 0; if (S.money < n) { UI.toast(`เงินไม่พอ ต้องใช้ ${baht(n)}`, '💸'); return false; } S.money -= n; try { Bank2.log(label, -n); } catch (e) { } return true; };
  const gain = (n, src) => { n = Math.round(+n) || 0; if (n <= 0) return; try { earn(n); } catch (e) { S.money += n; } try { Bank2.income(src, n); } catch (e) { } };
  const dis = () => window.Disaster31 || null;

  // ================= network =================
  const VIL = { key: 'village', n: 'หมู่บ้านสุขใจ (สถานีลานน้ำพุ)', short: 'หมู่บ้านสุขใจ', icon: '🏡', cx: 0, cz: -260, size: 'village', fee: 80 };
  const nodes = () => { let c = []; try { c = V25.cityList().filter(x => x.size !== 'old'); } catch (e) { } return [VIL].concat(c); };
  const nodeOf = k => nodes().find(n => n.key === k) || VIL;
  const nName = k => { const n = nodeOf(k); return n.short || n.n; };
  const hasAirport = n => n.key === 'village' || n.size === 'large';
  const kmOf = (a, b) => Math.max(25, Math.round(Math.hypot(a.cx - b.cx, a.cz - b.cz) / 10));

  const MODES = {
    bus: {
      n: 'รถโดยสารประจำทาง', i: '🚌', speed: 62, over: 20, base: 30, rate: 1.0, cutoff: 10, close: 3, open: 30, seats: 40, id: false, refund: 0.9,
      cls: [{ k: 'std', n: 'ธรรมดา (พัดลม)', f: 0.8, cmf: 6 }, { k: 'ac', n: 'ปรับอากาศ ชั้น 1', f: 1.15, cmf: 4 }, { k: 'vip', n: 'วีไอพี 24 ที่นั่ง', f: 1.9, cmf: 2 }],
      bag: [{ n: 'ถือขึ้นเอง', p: 0 }, { n: 'ใต้ท้องรถ 1 ใบ', p: 50 }, { n: 'ใต้ท้องรถ 3 ใบ + ลัง', p: 150 }],
    },
    train: {
      n: 'รถไฟ', i: '🚆', speed: 56, over: 30, base: 20, rate: 1.0, cutoff: 30, close: 3, open: 40, seats: 90, id: true, refund: 0.8, minKm: 60,
      cls: [{ k: 't3', n: 'ชั้น 3 นั่ง (พัดลม)', f: 0.3, cmf: 7 }, { k: 't2', n: 'ชั้น 2 นั่งปรับอากาศ', f: 0.75, cmf: 4 }, { k: 'sl', n: 'ชั้น 1 ตู้นอนปรับอากาศ', f: 1.7, cmf: -4 }],
      bag: [{ n: 'ถือขึ้นเอง', p: 0 }, { n: 'ตู้สัมภาระ 1 ใบ', p: 40 }, { n: 'ตู้สัมภาระ 3 ใบ + ลัง', p: 120 }],
    },
    air: {
      n: 'เครื่องบินภายในประเทศ', i: '✈️', speed: 650, over: 85, base: 900, rate: 1.3, cutoff: 60, close: 25, open: 90, seats: 150, id: true, refund: 0.5,
      cls: [{ k: 'eco', n: 'ประหยัด (ถือขึ้น 7 กก.)', f: 1, cmf: 3 }, { k: 'flex', n: 'ยืดหยุ่น (โหลด 20 กก. คืนเงินได้)', f: 1.35, cmf: 2 }, { k: 'biz', n: 'ธุรกิจ (โหลด 32 กก. ที่นั่งกว้าง)', f: 2.6, cmf: -2 }],
      bag: [{ n: 'ถือขึ้นเครื่อง 7 กก.', p: 0 }, { n: 'โหลดใต้ท้อง 20 กก.', p: 450 }, { n: 'โหลดใต้ท้อง 32 กก.', p: 900 }],
    },
  };
  const modeOK = (m, a, b) => {
    const M = MODES[m], km = kmOf(a, b);
    if (a.key === b.key) return false;
    if (m === 'train') return km >= M.minKm;
    if (m === 'air') return hasAirport(a) && hasAirport(b) && km >= 150;
    return true;
  };
  const tripMin = (m, km) => Math.max(90, Math.round(km / MODES[m].speed * 60 + MODES[m].over));
  // timetable: deterministic per route and mode
  const slots = (m, a, b) => {
    const key = m + ':' + [a.key, b.key].join('>'), off = hash(key) % 25, out = [];
    if (m === 'bus') { const gap = a.key === 'village' || b.key === 'village' ? 2 : 1; for (let h = 5; h <= 21; h += gap) out.push(h * 60 + (off + h * 7) % 30); }
    else if (m === 'train') for (const h of [6, 9.5, 13, 17.5, 20.5]) out.push(Math.round(h * 60) + off % 20);
    else for (const h of [7.25, 12.5, 18.75]) out.push(Math.round(h * 60) + off % 15);
    return out.map(d => ({ key, dep: d, dur: tripMin(m, kmOf(a, b)) }));
  };
  const priceOf = (m, a, b, cls, day, bag) => {
    const M = MODES[m], km = kmOf(a, b), C = M.cls.find(c => c.k === cls) || M.cls[0];
    let p = M.base + km * M.rate * C.f;
    const off = day - S.day;
    let dem = 1; if (holiday(day)) dem *= 1.25; else if (festive(day)) dem *= 1.1; if (((day - 1) % 7) === 4 || ((day - 1) % 7) === 6) dem *= 1.08;
    if (m === 'air') { dem *= off >= 7 ? 0.8 : off >= 3 ? 0.9 : off === 0 ? 1.15 : 1; }
    p = Math.round(p * dem / 5) * 5;
    return p + (M.bag[bag || 0] ? M.bag[bag || 0].p : 0);
  };
  const seatsLeft = (m, key, day, dep) => {
    const T0 = T(), k = `${key}@${day}@${dep}`, cap = MODES[m].seats;
    let occ = 0.2 + r01('occ' + k) * 0.65; if (holiday(day) || festive(day)) occ = Math.min(0.97, occ + 0.2);
    return Math.max(0, Math.floor(cap * (1 - occ)) - (T0.sold[k] || 0));
  };
  const here = () => {
    if (G.away) {
      try { for (const k in Town2.areas) if (Town2.areas[k] === G.away) return k; } catch (e) { }
      const n = nodes().find(x => x.cx === G.away.cx && x.cz === G.away.cz); if (n) return n.key;
      return 'other';
    }
    return 'village';
  };
  const hereName = () => { const k = here(); return k === 'other' ? 'นอกเส้นทางหลัก' : nName(k); };

  // ================= ticket status machine =================
  const logT = t => { const L = T().log; L.unshift(`${RD(S.day)}: ${t}`); L.length = Math.min(L.length, 25); };
  const wxOn = d => { try { if (d === S.day) return S.weather.type; if (d === S.day + 1) return S.weather.next; } catch (e) { } return 'sunny'; };
  const decide = t => {
    // fixed once per ticket on the day of departure; seeded so reloading the game does not change the outcome
    t.decided = 1;
    const D = dis(), wx = wxOn(t.day), flood = D && D.on && D.on('flood'), storm = wx === 'storm' || (D && D.on && D.on('storm')), fog = wx === 'fog', rain = wx === 'rain';
    const rr = r01(t.id + ':c' + t.day), rd = r01(t.id + ':d' + t.day), rl = r01(t.id + ':l' + t.day);
    let pc = 0, d0 = 0, dl = 0;
    if (t.mode === 'air') { pc = storm ? 0.4 : flood ? 0.15 : fog ? 0.1 : 0.01; if (storm) { d0 = 90 + rd * 150; dl = 1; } else if (fog) { d0 = 40 + rd * 80; dl = 1; } else if (rain) { d0 = 10 + rd * 30; dl = 1; } else if (rl < 0.12) { d0 = 10 + rd * 35; dl = 1; } }
    else if (t.mode === 'bus') { pc = flood ? 0.55 : storm ? 0.08 : 0; if (flood) { d0 = 40 + rd * 80; dl = 1; } else if (storm) { d0 = 30 + rd * 60; dl = 1; } else if (fog) { d0 = 15 + rd * 30; dl = 1; } else if (rain && rl < 0.5) { d0 = 10 + rd * 20; dl = 1; } else if (rl < 0.2) { d0 = 5 + rd * 20; dl = 1; } }
    else { pc = flood ? 0.4 : storm ? 0.05 : 0; if (flood) { d0 = 60 + rd * 180; dl = 1; } else if (storm) { d0 = 20 + rd * 50; dl = 1; } else if (rain && rl < 0.4) { d0 = 5 + rd * 15; dl = 1; } else if (rl < 0.25) { d0 = 5 + rd * 35; dl = 1; } }
    if (rr < pc) { t.st = 'cancelled'; const back = t.price; gain(back, 'คืนเงินตั๋วถูกยกเลิก'); T().stats.refunded += back; logT(`${MODES[t.mode].n} ${nName(t.from)}→${nName(t.to)} ถูกยกเลิก (${flood ? 'น้ำท่วมเส้นทาง' : storm ? 'สภาพอากาศแปรปรวน' : fog ? 'หมอกหนา' : 'เหตุขัดข้อง'}) คืนเงินเต็มจำนวน`); msg(MODES[t.mode].n, `ขออภัย ${MODES[t.mode].i} ${nName(t.from)} → ${nName(t.to)} เวลา ${hm(t.depMin)} ถูกยกเลิก ${flood ? 'เพราะน้ำท่วมเส้นทาง' : storm ? 'เพราะพายุ' : 'เพราะสภาพอากาศ'} คืนเงิน ${baht(back)} แล้ว`, false); return; }
    t.delay = dl ? Math.round(d0 / 5) * 5 : 0;
    if (t.delay >= 30) msg(MODES[t.mode].n, `${MODES[t.mode].i} ${nName(t.from)} → ${nName(t.to)} ล่าช้า ${t.delay} นาที (ออกเวลา ${hm(t.depMin + t.delay)}) เพราะ${flood ? 'น้ำท่วม' : storm ? 'พายุ' : fog ? 'หมอกหนา' : 'ฝนตก/การจราจร'}`, true);
    if (t.mode === 'air' && t.delay >= 120) { gain(150, 'ค่าอาหารเที่ยวบินล่าช้า'); msg('สายการบิน', 'เที่ยวบินล่าช้าเกิน 2 ชั่วโมง มอบค่าอาหาร 150 ฿ เข้าบัญชีของคุณ', true); }
  };
  const closeAt = t => t.dep + (t.delay || 0) - MODES[t.mode].close;
  const sync = () => {
    const X = T(), now = absNow();
    for (const t of X.tix) {
      if (t.st !== 'booked') continue;
      if (!t.decided && now >= t.dep - 6 * 60) decide(t);
      if (t.st !== 'booked') continue;
      if (!t.rem1 && now >= t.dep - 24 * 60 && now < t.dep) { t.rem1 = 1; msg(MODES[t.mode].n, `เตือนความจำ: พรุ่งนี้ ${hm(t.depMin)} ${MODES[t.mode].i} ${nName(t.from)} → ${nName(t.to)} (${t.pnr}) อย่าลืมเช็กอินก่อนออก ${MODES[t.mode].open} นาที`, true); }
      if (!t.rem2 && now >= t.dep - 3 * 60 && now < t.dep) { t.rem2 = 1; msg(MODES[t.mode].n, `อีกประมาณ 3 ชั่วโมง ${MODES[t.mode].i} ${nName(t.from)} → ${nName(t.to)} ออกเวลา ${hm(t.depMin + (t.delay || 0))} ไปที่สถานีได้เลย`, false); }
      if (now > closeAt(t)) {
        t.st = 'missed'; X.stats.missed++;
        const back = t.mode === 'train' ? Math.round(t.price * 0.2) : (t.mode === 'air' && t.cls === 'flex') ? Math.round(t.price * 0.3) : 0;
        if (back) { gain(back, 'คืนเงินตั๋วที่พลาดขบวน'); X.stats.refunded += back; }
        logT(`พลาด ${MODES[t.mode].n} ${nName(t.from)}→${nName(t.to)} (${t.pnr})${back ? ` คืนเงินบางส่วน ${baht(back)}` : ' ไม่ได้คืนเงิน'}`);
        msg(MODES[t.mode].n, `คุณไม่ได้เช็กอินทันเวลา ตั๋ว ${t.pnr} หมดอายุ${back ? ` ได้คืนเงิน ${baht(back)}` : ' ไม่สามารถขอคืนเงินได้'}`, false);
      }
    }
    if (X.tix.length > 40) X.tix = X.tix.filter(t => t.st === 'booked').concat(X.tix.filter(t => t.st !== 'booked').slice(-25));
  };

  // ================= actions =================
  const sel = { mode: 'bus', from: '', to: '', off: 0, bag: 0 };
  const hub = { tab: 0 };
  const A = {};
  const active = () => T().tix.filter(t => t.st === 'booked');

  A.book = (depMin, cls) => {
    depMin = +depMin; const a = nodeOf(sel.from || here()), b = nodeOf(sel.to), M = MODES[sel.mode];
    if (!sel.to || a.key === b.key) { UI.toast('เลือกต้นทางและปลายทางที่ต่างกันก่อน', '🧭'); return; }
    if (!modeOK(sel.mode, a, b)) { UI.toast('เส้นทางนี้ไม่มีบริการประเภทนี้', '🚫'); return; }
    const day = S.day + sel.off, dep = day * 1440 + depMin, now = absNow();
    if (dep - now < M.cutoff) { UI.toast(`ปิดจำหน่ายตั๋วแล้ว (ต้องซื้อก่อนออก ${M.cutoff} นาที)`, '⏰'); return; }
    if (sel.off > 14) return;
    if (active().length >= 8) { UI.toast('มีตั๋วที่ยังไม่ใช้ครบ 8 ใบแล้ว', '🎫'); return; }
    const s = slots(sel.mode, a, b).find(x => x.dep === depMin); if (!s) return;
    const left = seatsLeft(sel.mode, s.key, day, depMin); if (left <= 0) { UI.toast('ที่นั่งเต็มแล้ว ลองเที่ยวอื่นหรือชั้นอื่น', '🈵'); return; }
    if (M.id && !needDoc(['idcard'], `จองตั๋ว${M.n}`)) return;
    const price = priceOf(sel.mode, a, b, cls, day, sel.bag);
    if (!pay(price, `ตั๋ว${M.n} ${a.short || a.n}→${b.short || b.n}`)) return;
    const X = T(); X.n++; const id = 'K' + X.n, k = `${s.key}@${day}@${depMin}`; X.sold[k] = (X.sold[k] || 0) + 1;
    const pnr = (hash(id + s.key + day).toString(36).toUpperCase() + 'XXXXXX').slice(0, 6);
    X.tix.push({ id, pnr, mode: sel.mode, from: a.key, to: b.key, cls, bag: sel.bag, price, day, depMin, dep, dur: s.dur, km: kmOf(a, b), st: 'booked', delay: 0, bought: now });
    X.stats.spent += price;
    for (const kk in X.sold) { const d = +kk.split('@')[1]; if (d < S.day - 2) delete X.sold[kk]; }
    UI.toast(`จองตั๋วสำเร็จ ${M.i} ${a.short || a.n} → ${b.short || b.n} ${dayLabel(sel.off)} ${hm(depMin)} (${baht(price)})`, '🎫');
    hub.tab = 1; if (UI.cur) UI.cur.tab = 1;
    try { saveGame(true); } catch (e) { }
  };
  A.cancel = id => {
    const t = T().tix.find(x => x.id === id); if (!t || t.st !== 'booked') return;
    const M = MODES[t.mode], left = t.dep - absNow();
    if (left < (t.mode === 'bus' ? 60 : 180)) { UI.toast(`ยกเลิกไม่ได้ ต้องยกเลิกก่อนออกเดินทาง ${t.mode === 'bus' ? '1' : '3'} ชั่วโมง`, '⏰'); return; }
    let rate = M.refund; if (t.mode === 'air') rate = t.cls === 'flex' ? 0.9 : t.cls === 'biz' ? 0.95 : 0.5;
    const back = Math.round(t.price * rate); gain(back, 'คืนเงินตั๋วเดินทาง'); T().stats.refunded += back; t.st = 'refunded';
    const k = `${modeKey(t)}@${t.day}@${t.depMin}`; if (T().sold[k]) T().sold[k]--;
    logT(`ยกเลิกตั๋ว ${t.pnr} คืนเงิน ${baht(back)} (${Math.round(rate * 100)}%)`);
    UI.toast(`ยกเลิกตั๋วแล้ว คืนเงิน ${baht(back)} (หักค่าธรรมเนียม ${Math.round((1 - rate) * 100)}%)`, '↩️');
  };
  const modeKey = t => `${t.mode}:${[t.from, t.to].join('>')}`;
  A.wait = id => {
    const t = T().tix.find(x => x.id === id); if (!t || t.st !== 'booked') return;
    if (here() !== t.from) { UI.toast('ไปที่สถานีต้นทางก่อน', '🚉'); return; }
    const M = MODES[t.mode], openAt = t.dep + (t.delay || 0) - M.open, now = absNow();
    if (now >= openAt) return;
    const w = Math.min(openAt - now, 720); UI.close(); fade(() => { if (w > 60) simulate(w); else tick(w); UI.toast(`รอที่สถานีจนเปิดเช็กอิน (${hm(S.time)})`, '⌛'); try { sync(); } catch (e) { } });
  };
  A.taxi = key => {
    if (G.driving) { UI.toast('ลงจากรถก่อน', '🚗'); return; }
    if (key === 'village') { const i = TAXI_DEST.findIndex(t => /ลานน้ำพุ/.test(t.n)); if (i < 0) return; if (S.money < TAXI_DEST[i].fee) { UI.toast('เงินไม่พอค่าแท็กซี่', '💸'); return; } Town2.taxi(i); }
    else UI.H.v25go({ v: key });
  };
  const arriveEffects = t => {
    const M = MODES[t.mode], C = M.cls.find(c => c.k === t.cls) || M.cls[0], X = T();
    const e = Math.round(t.km / 100 * C.cmf);
    S.energy = Math.max(0, Math.min(maxEnergy(), S.energy - e));
    if (C.cmf < 0) { S.mood = Math.min(100, (S.mood ?? 70) + 3); }
    if (t.mode === 'train') S.mood = Math.min(100, (S.mood ?? 70) + 2);
    if (t.bag >= 1 && S.v26l && S.v26l.abr) { const n = t.bag >= 2 ? 2 : 1; S.v26l.abr.souv = (S.v26l.abr.souv || 0) + n; }
    X.stats.trips++; X.stats.km += t.km; X.stats.delayMin += t.delay || 0;
    t.st = 'used'; t.usedAt = absNow();
    logT(`เดินทาง ${M.n} ${nName(t.from)}→${nName(t.to)} ${t.km} กม.`);
  };
  A.board = id => {
    const t = T().tix.find(x => x.id === id); if (!t || t.st !== 'booked') return;
    sync(); if (t.st !== 'booked') return;
    const M = MODES[t.mode], now = absNow(), openAt = t.dep + (t.delay || 0) - M.open;
    if (G.driving) { UI.toast('ลงจากรถก่อนขึ้นสถานี', '🚗'); return; }
    if (here() !== t.from) { UI.toast(`ต้องอยู่ที่สถานีต้นทาง (${nName(t.from)})`, '🚉'); return; }
    if (now < openAt) { UI.toast(`ยังไม่เปิดเช็กอิน เปิด ${hm(openAt)}`, '⌛'); return; }
    if (M.id && !hasDoc('idcard')) {
      t.st = 'missed'; T().stats.missed++; logT(`ขึ้น${M.n}ไม่ได้ เพราะบัตรประชาชนหมดอายุ (${t.pnr})`);
      UI.toast('บัตรประชาชนหมดอายุ ขึ้นพาหนะไม่ได้ ต้องต่อบัตรที่ที่ว่าการอำเภอก่อน', '🪪'); return;
    }
    const wait = Math.max(0, t.dep + (t.delay || 0) - now), total = wait + t.dur + (t.mode === 'air' && t.bag > 0 ? 20 : 0);
    const dest = nodeOf(t.to);
    UI.close(); Phone.app = null;
    arriveEffects(t);
    const pre = dest.key === 'village' ? total : Math.max(0, total - 90);
    try { if (pre > 60) simulate(pre); else if (pre > 0) tick(pre); } catch (e) { console.warn('v31 travel tick', e); }
    try { sync(); } catch (e) { }
    if (dest.key === 'village') {
      fade(() => {
        try { Town2.leaveAway(true); leaveIndoors(); G.player.pos.set(-14, World.groundY(-14, -262), -262); snapCam(); UI.toast(`ถึง${M.i} สถานีหมู่บ้านสุขใจแล้ว · ใช้เวลาเดินทาง ${dur(total)}`, M.i); } catch (e) { console.warn('v31 arrive', e); }
      });
    } else {
      try { Town2.go(dest.key, 0); } catch (e) { console.warn('v31 go', e); }
      setTimeout(() => { try { UI.toast(`ถึง${dest.short || dest.n}แล้ว · ใช้เวลาเดินทางรวม ${dur(total)}`, M.i); } catch (e) { } }, 1200);
    }
    setTimeout(() => { try { saveGame(true); } catch (e) { } }, 1800);
  };
  A.sm = m => { sel.mode = m; };
  A.sf = k => { sel.from = k; if (sel.to === k) sel.to = ''; };
  A.st = k => { sel.to = k; if (!sel.from) sel.from = here(); };
  A.sd = n => { sel.off = +n; };
  A.sb = n => { sel.bag = +n; };
  A.route = k => { sel.from = here() === 'other' ? 'village' : here(); sel.to = k; hub.tab = 0; if (UI.cur) UI.cur.tab = 0; };
  A.tab = n => { hub.tab = +n; if (UI.cur) UI.cur.tab = +n; };
  UI.H.v31t = d => { const [k, ...r] = String(d.v || '').split('|'); const f = A[k]; if (f) { try { f(...r); } catch (e) { if (e && e.spend173) throw e; console.warn('v31t', k, e); } } };

  // ================= UI =================
  const B = (act, label, o = {}) => `<button class="btn ${o.ghost ? 'ghost' : ''}" data-a="v31t" data-v="${esc(act)}"${o.dis ? ' disabled' : ''}>${label}</button>`;
  const Cd = (i, h, p, btns = '') => `<div class="card"><div class="ci">${i}</div><div class="cb"><h4>${h}</h4><p class="dim">${p}</p>${btns ? `<div class="row">${btns}</div>` : ''}</div></div>`;
  const chip = (act, label, on) => `<button class="btn ${on ? '' : 'ghost'}" data-a="v31t" data-v="${esc(act)}">${label}</button>`;

  const tabBook = () => {
    const from = sel.from || (here() === 'other' ? 'village' : here()), a = nodeOf(from), M = MODES[sel.mode];
    if (!sel.from) sel.from = from;
    let h = `<p class="lead">🚉 คุณอยู่ที่: <b>${hereName()}</b> · เวลา ${hm(S.time)} น. (เวลาไทย) · จองล่วงหน้าได้ 14 วัน · ตั๋วรถไฟและเครื่องบินต้องใช้บัตรประชาชนที่ยังไม่หมดอายุ</p>`;
    h += `<h5>ประเภทการเดินทาง</h5><div class="row">${Object.keys(MODES).map(k => chip('sm|' + k, `${MODES[k].i} ${MODES[k].n}`, sel.mode === k)).join('')}</div>`;
    h += `<h5>ต้นทาง</h5><div class="row">${nodes().map(n => chip('sf|' + n.key, `${n.icon} ${n.short || n.n}`, sel.from === n.key)).join('')}</div>`;
    h += `<h5>ปลายทาง</h5><div class="row">${nodes().filter(n => n.key !== sel.from).map(n => chip('st|' + n.key, `${n.icon} ${n.short || n.n}${modeOK(sel.mode, a, n) ? '' : ' ✖'}`, sel.to === n.key)).join('')}</div>`;
    h += `<h5>วันเดินทาง</h5><div class="row">${[0, 1, 2, 3, 5, 7, 10, 14].map(o => chip('sd|' + o, dayLabel(o), sel.off === o)).join('')}</div>`;
    h += `<h5>สัมภาระ</h5><div class="row">${M.bag.map((b, i) => chip('sb|' + i, `${b.n}${b.p ? ' +' + baht(b.p) : ''}`, sel.bag === i)).join('')}</div>`;
    if (!sel.to) return h + `<p class="empty">เลือกปลายทางเพื่อดูตารางเดินทาง</p>`;
    const b = nodeOf(sel.to);
    if (!modeOK(sel.mode, a, b)) {
      const why = sel.mode === 'train' ? 'ระยะทางสั้นเกินไปสำหรับรถไฟ (ใช้รถทัวร์แทน)' : sel.mode === 'air' ? 'สนามบินมีเฉพาะหมู่บ้านสุขใจและเมืองใหญ่ 4 แห่ง ระยะทางเกิน 150 กม.' : 'ไม่มีบริการ';
      return h + `<p class="empty">เส้นทาง ${a.short || a.n} → ${b.short || b.n} ไม่มี${M.n}: ${why}</p>`;
    }
    const day = S.day + sel.off, now = absNow(), km = kmOf(a, b);
    h += `<h5>${M.i} ${a.short || a.n} → ${b.short || b.n} · ${km} กม. · ${dayLabel(sel.off)}${holiday(day) ? ' · 🎌 วันหยุด ค่าโดยสารช่วงเทศกาลสูงขึ้น' : festive(day) ? ' · 🎉 ช่วงเทศกาล' : ''}</h5>`;
    const list = slots(sel.mode, a, b).filter(s => day * 1440 + s.dep - now >= M.cutoff);
    if (!list.length) return h + `<p class="empty">เที่ยวสุดท้ายของวันนี้ออกไปแล้ว ลองเลือกวันถัดไป</p>`;
    h += `<div class="grid">` + list.map(s => {
      const left = seatsLeft(sel.mode, s.key, day, s.dep), arr = s.dep + s.dur, nd = arr >= 1440 ? ` (+${Math.floor(arr / 1440)} วัน)` : '';
      const btns = M.cls.map(c => B(`book|${s.dep}|${c.k}`, `${c.n} ${baht(priceOf(sel.mode, a, b, c.k, day, sel.bag))}`, { dis: left <= 0 })).join('');
      return Cd(M.i, `${hm(s.dep)} → ${hm(arr)}${nd}`, `ใช้เวลา ${dur(s.dur)} · ที่นั่งว่าง ${left <= 0 ? '<span class="bad">เต็ม</span>' : left < 10 ? `<span class="bad">เหลือ ${left}</span>` : left} · เช็กอินก่อนออก ${M.open} นาที`, btns);
    }).join('') + `</div>`;
    return h;
  };
  const stTxt = t => ({ booked: '🟢 ใช้ได้', used: '✔️ ใช้แล้ว', missed: '⛔ พลาดการเดินทาง', cancelled: '🚫 ถูกยกเลิก (คืนเงินแล้ว)', refunded: '↩️ ยกเลิกเอง' }[t.st] || t.st);
  const tabMine = () => {
    sync();
    const X = T(), act = X.tix.filter(t => t.st === 'booked').sort((a, b) => a.dep - b.dep), old = X.tix.filter(t => t.st !== 'booked').slice(-8).reverse(), now = absNow();
    let h = `<p class="lead">🧳 ตั๋วที่ยังไม่ใช้ ${act.length} ใบ · เดินทางแล้ว ${X.stats.trips} เที่ยว (${X.stats.km} กม.) · ใช้จ่ายรวม ${baht(X.stats.spent)}</p>`;
    if (!act.length) h += `<p class="empty">ยังไม่มีตั๋ว ไปที่แท็บ "จองตั๋ว" ได้เลย</p>`;
    h += `<div class="grid">` + act.map(t => {
      const M = MODES[t.mode], C = M.cls.find(c => c.k === t.cls) || M.cls[0], left = t.dep + (t.delay || 0) - now, openAt = t.dep + (t.delay || 0) - M.open, at = here() === t.from;
      const when = `${dayName(t.day)} ${hm(t.depMin)}${t.delay ? ` → <b class="bad">${hm(t.depMin + t.delay)} (ล่าช้า ${t.delay} นาที)</b>` : ''}`;
      let btns = '';
      if (!at) btns += B('taxi|' + t.from, `🚕 ไปสถานี ${nName(t.from)}`, { ghost: 1 });
      else if (now < openAt) btns += B('wait|' + t.id, `⌛ รอที่สถานี (เปิดเช็กอิน ${hm(openAt)})`);
      else btns += B('board|' + t.id, `${M.i} เช็กอินและขึ้น${t.mode === 'air' ? 'เครื่อง' : 'รถ'}`);
      btns += B('cancel|' + t.id, '↩️ ยกเลิกตั๋ว', { ghost: 1 });
      return Cd(M.i, `${nName(t.from)} → ${nName(t.to)} · ${t.pnr}`, `${when} · ${C.n}${t.bag ? ' · มีสัมภาระ' : ''} · ${t.km} กม. · ใช้เวลา ${dur(t.dur)}<br>${left > 0 ? `อีก ${dur(left)} ออกเดินทาง` : 'ถึงเวลาออกแล้ว'} · จ่ายแล้ว ${baht(t.price)}${at ? '' : '<br><span class="bad">ตอนนี้คุณไม่ได้อยู่ที่สถานีต้นทาง</span>'}`, btns);
    }).join('') + `</div>`;
    if (old.length) h += `<h5>ประวัติตั๋ว</h5><div class="grid">` + old.map(t => Cd(MODES[t.mode].i, `${nName(t.from)} → ${nName(t.to)} · ${t.pnr}`, `${dayName(t.day)} ${RD(t.day)} ${hm(t.depMin)} · ${stTxt(t)} · ${baht(t.price)}`)).join('') + `</div>`;
    if (X.log.length) h += `<h5>บันทึก</h5><ul class="dim">${X.log.slice(0, 6).map(l => `<li>${esc(l)}</li>`).join('')}</ul>`;
    return h;
  };
  const tabMap = () => {
    const from = here() === 'other' ? 'village' : here(), a = nodeOf(from), now = absNow();
    let h = `<p class="lead">🗺️ เครือข่ายเดินทาง: จากสถานี <b>${a.short || a.n}</b> · รถทัวร์ทุกเส้นทาง · รถไฟเมื่อไกลเกิน 60 กม. · เครื่องบินเฉพาะสนามบิน ✈️ (หมู่บ้านสุขใจและเมืองใหญ่)</p><div class="grid">`;
    h += nodes().filter(n => n.key !== a.key).map(n => {
      const km = kmOf(a, n), parts = [];
      for (const m of Object.keys(MODES)) {
        if (!modeOK(m, a, n)) continue;
        const nx = slots(m, a, n).find(s => S.day * 1440 + s.dep - now >= MODES[m].cutoff);
        parts.push(`${MODES[m].i} ฿${priceOf(m, a, n, MODES[m].cls[0].k, S.day, 0)}+ · ${nx ? 'ถัดไป ' + hm(nx.dep) : 'หมดเที่ยววันนี้'}`);
      }
      return Cd(n.icon, `${n.short || n.n} (${n.tag || (n.size === 'village' ? 'หมู่บ้าน' : n.size)})`, `${km} กม.<br>${parts.join('<br>')}`, B('route|' + n.key, '🎫 จองไปที่นี่') + B('taxi|' + n.key, '🚕 ไปเอง', { ghost: 1 }));
    }).join('') + `</div>`;
    return h;
  };
  const TABS = ['🎫 จองตั๋ว', '🧳 ตั๋วของฉัน', '🗺️ เส้นทาง & สถานี'];
  const render = t => { hub.tab = t; try { sync(); } catch (e) { } return t === 0 ? tabBook() : t === 1 ? tabMine() : tabMap(); };
  const open = () => { if (!sel.from) sel.from = here() === 'other' ? 'village' : here(); UI.open('🚆 เดินทางข้ามเมือง', TABS, render, { tab: hub.tab, wide: true }); };
  const addApp = (id, i, n, fn) => {
    if (!APPS.some(a => a.id === id)) APPS.splice(Math.min(APPS.length, 13), 0, { id, i, n });
    Phone.apps[id] = () => { setTimeout(() => { Phone.app = null; UI.close(); fn(); }, 0); return ''; };
    if (typeof APP_GROUPS !== 'undefined') { const gr = APP_GROUPS.find(x => /บริการ/.test(x[0])) || APP_GROUPS[APP_GROUPS.length - 1]; if (gr && !gr[1].includes(id)) gr[1].unshift(id); }
  };
  addApp('travel31', '🚆', 'เดินทางข้ามเมือง', open);

  // hourly and daily upkeep (wrap-and-extend)
  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { sync(); } catch (e) { console.warn('v31 travel daily', e); } return r; }; }
  if (typeof Smart !== 'undefined' && Smart.hour) { const _sh = Smart.hour; Smart.hour = function () { const r = _sh.apply(this, arguments); try { sync(); } catch (e) { console.warn('v31 travel hour', e); } return r; }; }
  if (Phone && Phone.open) { const _o = Phone.open.bind(Phone); Phone.open = function () { try { sync(); } catch (e) { } return _o.apply(this, arguments); }; }
  T();
  window.Travel31 = { open, st: T, nodes, slots, priceOf, kmOf, modeOK, seatsLeft, here, sync, book: A.book, board: A.board, cancel: A.cancel, sel, MODES };
});
