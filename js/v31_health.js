'use strict';
// ---------- v31_health: full health & hospital system on top of Civic (rights, queues, HN card), Ins and Life2.getSick:
// named seasonal illnesses (flu, cold, sore throat, dengue, heat stroke, PM2.5 asthma, food poisoning) with severity that follows care,
// self-care / pharmacy / private clinic / hospital OPD / ER, tests and diagnosis, prescriptions taken on a schedule (adherence matters),
// specialist appointments with referral letters and slots, elective & emergency surgery with recovery, chronic diseases that need monthly
// check-ups, health-insurance claims (cashless or reimbursement) and medical certificates through the document wallet. App "🩺 สุขภาพ & โรงพยาบาล" ----------
V23.add('v31_health', () => {
  const YD = 84, MO = 28;
  const DEF = () => ({
    cond: [], nid: 1, chr: {}, rx: [], appt: [], refer: { exp: 0, from: '' }, bills: [], claims: [], insYr: { yr: -1, opd: 0, ipd: 0, n: 0 },
    need: null, plan: null, post: null, inv: { para: 0, ors: 0, antihis: 0, cough: 0, antac: 0, n95: 0 }, mask: 1, adh: { t: 0, m: 0 },
    hist: [], lastDay: 0, sel: 0, lastSick: -99, certs: 0, msgd: {}, bias: 0
  });
  const H = () => { const x = S.v31h = S.v31h || {}; const d = DEF(); for (const k in d) if (x[k] === undefined || x[k] === null) x[k] = d[k]; return x; };

  // ================= helpers =================
  const msg = (from, t, q) => { try { Phone.msg(from, t, q); } catch (e) { } };
  const hrOf = () => S.time / 60;
  const hh = h => `${String(Math.floor(h)).padStart(2, '0')}:${h % 1 ? '30' : '00'}`;
  const holiday = (d = S.day) => !!(window.Cal24 && typeof Cal24.isHoliday === 'function' && Cal24.isHoliday(d));
  const wdOf = (d = S.day) => (d - 1) % 7 < 5;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const yearIdx = () => Math.floor((S.day - 1) / YD);
  const mood = n => { S.mood = clamp((S.mood ?? 70) + n, 0, 100); };
  const energy = n => { S.energy = clamp(S.energy + n, 0, maxEnergy()); };
  const right = () => { try { return Civic.right(); } catch (e) { return 'ucs'; } };
  const hosp = () => { try { return Civic.hName(Civic.st().home || ''); } catch (e) { return 'โรงพยาบาลสุขใจ'; } };
  const RN = { ucs: 'บัตรทอง', sso: 'ประกันสังคม', gov: 'ข้าราชการ', ins: 'ประกันเอกชน', self: 'จ่ายเอง' };
  const pay = (n, label) => { n = Math.round(+n) || 0; if (n > 0 && S.money < n) { UI.toast(`เงินไม่พอ ต้องใช้ ${baht(n)}`, '💸'); return false; } if (n > 0) { S.money -= n; try { Bank2.log(label, -n); } catch (e) { } } return true; };
  const gain = (n, src) => { n = Math.round(+n) || 0; if (n > 0) { earn(n); try { Bank2.income(src, n); } catch (e) { } } };
  const note = t => { try { Life2.note(t); } catch (e) { } };
  const spend = (mins, fn) => { UI.close(); fade(() => { try { tick(mins); } catch (e) { console.warn('v31h tick', e); } try { fn(); } catch (e) { console.warn('v31h', e); } try { saveGame(true); } catch (e) { } setTimeout(() => hubOpen(), 650); }); };
  const hasIns = () => { try { return !!Ins.has('health'); } catch (e) { return false; } };
  const gov = (ids, what) => !window.Gov24 || Gov24.need(ids, what);
  const hist = t => { const h = H(); h.hist.unshift({ d: S.day, t }); if (h.hist.length > 14) h.hist.length = 14; };

  // ================= data =================
  const MED = { // [name, icon, price per dose at a private clinic/pharmacy]
    para: ['พาราเซตามอล 500 มก.', '💊', 3], ors: ['เกลือแร่ ORS', '🧂', 12], osel: ['ยาต้านไวรัสไข้หวัดใหญ่', '🧬', 60], amox: ['ยาปฏิชีวนะ อะม็อกซีซิลลิน', '💊', 12],
    antihis: ['ยาแก้แพ้ ลอราทาดีน', '💊', 6], cough: ['ยาแก้ไอ', '🍯', 8], antac: ['ยาลดกรด', '💊', 5], inh: ['ยาพ่นขยายหลอดลม', '🫁', 45],
    amlo: ['แอมโลดิพีน (ลดความดัน)', '💊', 4], metf: ['เมทฟอร์มิน (เบาหวาน)', '💊', 4], ctrl: ['ยาพ่นสเตียรอยด์ควบคุมหอบ', '🫁', 35],
    abx2: ['ยาปฏิชีวนะหลังผ่าตัด', '💊', 15], pain: ['ยาแก้ปวดหลังผ่าตัด', '💊', 8]
  };
  const OTC = { para: ['พาราเซตามอล 10 เม็ด', 25, 10], ors: ['เกลือแร่ ORS 5 ซอง', 60, 5], antihis: ['ยาแก้แพ้ 10 เม็ด', 40, 10], cough: ['ยาแก้ไอ 1 ขวด', 60, 6], antac: ['ยาลดกรด 10 เม็ด', 35, 10], n95: ['หน้ากาก N95 5 ชิ้น', 60, 5] };
  const COND = {
    flu: { n: 'ไข้หวัดใหญ่', i: '🤧', dur: 5, esc: 0.05, help: ['para', 'ors'], test: ['atk', 'ตรวจสว็อบไข้หวัดใหญ่ (ATK)', 350], sp: 'im' },
    cold: { n: 'ไข้หวัด / เจ็บคอ', i: '🤒', dur: 3, esc: 0.015, help: ['para', 'cough', 'antihis'], sp: 'ent' },
    throat: { n: 'ทอนซิลอักเสบ (ติดเชื้อแบคทีเรีย)', i: '😷', dur: 5, esc: 0.03, help: ['para'], test: ['swab', 'ตรวจเชื้อคอ (Strep test)', 300], sp: 'ent', abx: 1 },
    dengue: { n: 'ไข้เลือดออก', i: '🦟', dur: 7, esc: 0.08, help: ['para', 'ors'], test: ['ns1', 'ตรวจ NS1 + CBC (เกล็ดเลือด)', 800], sp: 'im', crit: [3, 6], noNsaid: 1 },
    heat: { n: 'โรคลมแดด / เพลียแดด', i: '🥵', dur: 2, esc: 0.12, help: ['ors'], sp: 'im' },
    pm25: { n: 'หอบหืดกำเริบ (ฝุ่น PM2.5)', i: '😮‍💨', dur: 4, esc: 0.07, help: ['antihis'], test: ['xray', 'เอกซเรย์ปอด', 400], sp: 'pulm' },
    food: { n: 'อาหารเป็นพิษ / ท้องเสีย', i: '🤢', dur: 3, esc: 0.05, help: ['ors', 'antac'], sp: 'im', appx: 1 },
    wound: { n: 'แผลผ่าตัดติดเชื้อ', i: '🩹', dur: 5, esc: 0.08, help: ['para'], sp: 'surg', abx: 1 },
    compl: { n: 'อาการแทรกซ้อนจากโรคเรื้อรัง', i: '🚨', dur: 6, esc: 0.1, help: [], sp: 'im', emerg: 1 }
  };
  const CHR = {
    htn: { n: 'ความดันโลหิตสูง', i: '🫀', med: 'amlo', per: 1, sp: 'card', comp: 'เส้นเลือดสมองตีบ', test: 'วัดความดัน' },
    dm: { n: 'เบาหวาน', i: '🩸', med: 'metf', per: 2, sp: 'endo', comp: 'ภาวะน้ำตาลสูงรุนแรง', test: 'เจาะน้ำตาลปลายนิ้ว' },
    asth: { n: 'หอบหืดเรื้อรัง', i: '🫁', med: 'ctrl', per: 1, sp: 'pulm', comp: 'หอบรุนแรง', test: 'วัดสมรรถภาพปอด' }
  };
  const SPEC = { im: ['อายุรแพทย์', '🩺', 700], card: ['อายุรแพทย์หัวใจ', '🫀', 900], endo: ['ต่อมไร้ท่อ/เบาหวาน', '🩸', 900], pulm: ['อายุรแพทย์โรคปอด/ภูมิแพ้', '🫁', 800], ortho: ['กระดูกและข้อ', '🦴', 900], eye: ['จักษุแพทย์', '👁️', 800], ent: ['หู คอ จมูก', '👂', 700], surg: ['ศัลยแพทย์ทั่วไป', '🔪', 800] };
  const SURG = {
    appx: { n: 'ผ่าตัดไส้ติ่ง (ฉุกเฉิน)', i: '🔪', emerg: 1, ipd: 3, cost: 60000, rec: 10, sp: 'surg' },
    fx: { n: 'ผ่าตัดกระดูกหัก/ดามเหล็ก (ฉุกเฉิน)', i: '🦴', emerg: 1, ipd: 4, cost: 120000, rec: 28, sp: 'ortho' },
    hernia: { n: 'ผ่าตัดไส้เลื่อน', i: '🔪', ipd: 1, cost: 45000, rec: 10, sp: 'surg' },
    cat: { n: 'ผ่าตัดต้อกระจก', i: '👁️', ipd: 0, cost: 35000, rec: 5, sp: 'eye' }
  };
  const NEEDTXT = { hernia: 'ปวดถ่วงที่หน้าท้อง/ขาหนีบเวลายกของหนัก (สงสัยไส้เลื่อน)', cat: 'ตามัว มองเห็นไม่ชัด (สงสัยต้อกระจก)' };

  // ================= state access =================
  const active = () => H().cond.filter(c => !c.done);
  const condById = id => H().cond.find(c => c.id === id);
  const insLimit = () => { const h = H(); if (h.insYr.yr !== yearIdx()) h.insYr = { yr: yearIdx(), opd: 0, ipd: 0, n: 0 }; return h.insYr; };

  // ================= bills, insurance =================
  // record a bill the player paid out of pocket (claimable) or covered; cat: 'opd' | 'ipd'
  function bill(label, amt, cat, o = {}) {
    const h = H(); amt = Math.round(amt); if (amt <= 0) return;
    h.bills.unshift({ id: h.nid++, d: S.day, label, amt, cat: cat || 'opd', paid: o.paid !== false, claim: 0, cashless: !!o.cashless });
    if (h.bills.length > 30) h.bills.length = 30;
  }
  // what the player must pay at a hospital for a service of the given list price, by rights. returns {pay, ins}
  function hospPay(price, kind, spec) {
    const r = right(), il = insLimit();
    if (r === 'self') return { pay: price, ins: 0 };
    if (r === 'ucs' || r === 'gov') return { pay: spec ? price : 0, ins: 0 };
    if (r === 'sso') return { pay: spec ? price : 0, ins: 0 };
    if (r === 'ins') { // cashless up to the policy limits
      const cap = kind === 'ipd' ? 100000 - il.ipd : (il.n >= 20 ? 0 : 1500 - 0); const cov = clamp(Math.min(price, cap), 0, price);
      return { pay: price - cov, ins: cov, kind };
    }
    return { pay: price, ins: 0 };
  }
  function useIns(cov, kind) { if (cov > 0) { const il = insLimit(); if (kind === 'ipd') il.ipd += cov; else { il.opd += cov; il.n++; } } }
  const claimable = b => hasIns() && b.paid && !b.claim && b.cat && b.amt > 0 && S.day - b.d <= 30;
  function doClaim(id) {
    const h = H(), b = h.bills.find(x => x.id === +id); if (!b || !claimable(b)) { UI.toast('เคลมไม่ได้: ไม่มีกรมธรรม์สุขภาพที่ยังคุ้มครอง หรือเกิน 30 วัน', 'ℹ️'); return; }
    const il = insLimit(), cap = b.cat === 'ipd' ? 100000 - il.ipd : (il.n >= 20 ? 0 : 1500), cov = Math.round(clamp(Math.min(b.amt * 0.9, cap), 0, b.amt));
    if (cov <= 0) { UI.toast('เกินวงเงิน/จำนวนครั้งต่อปีของกรมธรรม์แล้ว', 'ℹ️'); b.claim = -1; return; }
    b.claim = 1; h.claims.push({ id: h.nid++, bill: b.id, amt: cov, due: S.day + 3, cat: b.cat });
    UI.toast(`ยื่นเคลม ${b.label} แล้ว บริษัทประกันจะโอนเงิน ${baht(cov)} ภายใน 3 วัน`, '🛡️');
  }

  // ================= medicines & prescriptions =================
  const HRS = { 1: [8], 2: [8, 20], 3: [8, 13, 19] };
  function newRx(med, per, days, o = {}) {
    const h = H(); if (!MED[med]) return null;
    const ex = h.rx.find(r => r.med === med && r.left > 0 && r.cid === (o.cid || 0)); if (ex) { ex.left += per * days; return ex; }
    const r = { id: h.nid++, med, per, left: per * days, cid: o.cid || 0, chr: o.chr || '', today: [], t: 0, m: 0 };
    h.rx.push(r); planDoses(r); return r;
  }
  function planDoses(r) { r.today = r.left > 0 ? (HRS[r.per] || [8]).map(hr => ({ h: hr, st: 0 })).slice(0, Math.min(r.per, r.left)) : []; }
  function rxCost(list) { return list.reduce((a, [m, per, days]) => a + MED[m][2] * per * days, 0); }
  // what the doctor prescribes for a condition
  function rxFor(c) {
    const k = c.k, L = [];
    if (k === 'flu') { L.push(['para', 3, 5]); if (c.tested && c.pos && c.age <= 2) L.push(['osel', 2, 5]); else L.push(['cough', 2, 3]); }
    else if (k === 'cold') { L.push(['para', 3, 3], ['antihis', 1, 3]); }
    else if (k === 'throat') { L.push(['para', 3, 4]); if (c.tested && c.pos) L.push(['amox', 3, 5]); else if (Math.random() < 0.3) L.push(['amox', 3, 5]); }
    else if (k === 'dengue') { L.push(['para', 3, 7], ['ors', 3, 7]); }
    else if (k === 'heat') { L.push(['ors', 3, 2]); }
    else if (k === 'pm25') { L.push(['inh', 2, 4], ['antihis', 1, 4]); }
    else if (k === 'food') { L.push(['ors', 3, 3], ['antac', 2, 3]); }
    else if (k === 'wound') { L.push(['abx2', 2, 5], ['para', 3, 4]); }
    else if (k === 'compl') { L.push(['para', 1, 2]); }
    return L;
  }
  function takeDose(id, i) {
    const r = H().rx.find(x => x.id === +id); if (!r || !r.today[+i]) return; const d = r.today[+i];
    if (d.st !== 0) return; if (hrOf() < d.h - 1.5) { UI.toast(`ยังไม่ถึงเวลากินยา (${hh(d.h)} น.)`, '⏰'); return; }
    d.st = 1; r.left--; r.t++; H().adh.t++; UI.toast(`กิน ${MED[r.med][0]} แล้ว (เหลือ ${r.left} ครั้ง)`, MED[r.med][1]);
    if (r.left <= 0) UI.toast(`ยาครบคอร์ส: ${MED[r.med][0]}`, '✅');
  }
  function buyOTC(k) {
    const h = H(), o = OTC[k]; if (!o) return; const hr = hrOf(); if (hr < 8 || hr >= 22) { UI.toast('ร้านยาปิดแล้ว (เปิด 08:00–22:00)', '🕒'); return; }
    if (!pay(o[1], 'ซื้อยาที่ร้านยา: ' + o[0])) return; h.inv[k] = (h.inv[k] || 0) + o[2]; UI.toast(`ซื้อ ${o[0]} แล้ว`, '💊');
  }
  function useOTC(cid, k) {
    const h = H(), c = condById(+cid); if (!c || c.done || !(h.inv[k] > 0)) { UI.toast('ไม่มียานี้ในกระเป๋า', 'ℹ️'); return; }
    const info = COND[c.k]; if (!info.help.includes(k)) { UI.toast(`${OTC[k][0]} ไม่ช่วยอาการนี้`, 'ℹ️'); return; }
    h.inv[k]--; c.fx.self = Math.min(1, (c.fx.self || 0) + (k === 'ors' ? 0.35 : 0.3)); c.fx[k] = (c.fx[k] || 0) + 1;
    UI.toast(`ใช้ ${OTC[k][0]} บรรเทาอาการ`, '💊');
  }
  function nsaid(cid) { // the classic mistake: ibuprofen/aspirin for dengue fever
    const c = condById(+cid); if (!c || c.k !== 'dengue') return; c.nsaid = 1; c.sev = Math.min(3, c.sev + 1); UI.toast('กินยากลุ่ม NSAIDs ในไข้เลือดออกเสี่ยงเลือดออก! อาการแย่ลง', '⚠️'); msg('สุขภาพ', 'ไข้เลือดออกห้ามกินแอสไพริน/ไอบูโพรเฟน ควรใช้พาราเซตามอลเท่านั้น และไปตรวจเลือด', true);
  }
  function wearMask() { const h = H(); h.mask = h.mask ? 0 : 1; UI.toast(h.mask ? 'จะสวมหน้ากาก N95 วันที่ฝุ่นสูง' : 'ไม่สวมหน้ากาก', '😷'); }

  // ================= onset of illness =================
  function startCond(k, why) {
    const h = H(), info = COND[k]; if (!info) return null;
    if (active().some(c => c.k === k)) return null;
    const c = { id: h.nid++, k, day: S.day, age: 0, sev: info.emerg ? 3 : 1, left: info.dur, seen: 0, tested: 0, pos: 0, fx: {}, mon: 0, tx: 0, cx: 0, why: why || '', erDay: 0, certDay: 0, done: 0 };
    h.cond.push(c); h.lastSick = S.day; if (h.cond.length > 40) h.cond = h.cond.filter(x => !x.done).concat(h.cond.filter(x => x.done).slice(-12));
    S.sick = S.sick || (c.sev >= 3 ? 2 : 1); if (c.sev >= 3) S.sick = 2; if (!S.sickDays) S.sickDays = 0; S.sickAuto31 = 1;
    msg('สุขภาพ', `${info.i} คุณมีอาการของ ${info.n}${why ? ' (' + why + ')' : ''} ดูวิธีดูแลและไปหาหมอได้ในแอป 🩺 สุขภาพ`, true);
    hist(`เริ่มป่วย: ${info.n}`); note(`ไม่สบาย: ${info.n}`);
    return c;
  }
  // N95 masks: the pharmacy stock here and the bag item the disaster shop sells are one pool, so a mask bought anywhere protects
  const n95n = () => ((H().inv.n95 | 0) + (typeof count === 'function' ? count('n95') : 0));
  const protect = () => (S.furn && S.furn.airpurifier ? 0.35 : 1);
  function onsetDaily() {
    const h = H(), se = season().id, act = active(); if (act.length >= 2 || S.sickFree > S.day) return;
    const rain = se === 'rain', cool = se === 'cool', hot = se === 'hot', rl = k => { try { return typeof RL !== 'undefined' && RL.on(k); } catch (e) { return false; } };
    const vaxFlu = S.vax > S.day, safeD = (() => { try { return RL.st().dengueSafe; } catch (e) { return 0; } })();
    const P = [
      ['flu', 0.012 * (cool ? 2.2 : 1) * (rain ? 1.3 : 1) * (vaxFlu ? 0.35 : 1)],
      ['cold', 0.014 * (rain ? 1.5 : 1)],
      ['throat', 0.006 * (cool ? 1.5 : 1)],
      ['dengue', 0.005 * (rain ? 3 : 0.3) * (rl('dengue') ? 2.5 : 1) * (safeD >= S.day ? 0.3 : 1) * (safeD > S.day + 14 ? 0.5 : 1)],
      ['heat', 0.01 * (hot || (window.Disaster31 && Disaster31.on && Disaster31.on('heat')) ? 3 : 0.1) * (S.thirst < 40 ? 2 : 1) * (S.furn && S.furn.aircon ? 0.3 : 1)],
      ['pm25', (rl('pm25') ? 0.05 : 0.002) * protect() * (rl('pm25') && h.mask && n95n() > 0 ? 0.4 : 1)],
      ['food', 0.006]
    ];
    for (const [k, p] of P) { if (S.sick && act.length) break; if (Math.random() < p * 0.02) { startCond(k); S.sickFree = S.day + 10; break; } }   // a game year is 84 days: a few illnesses a year, not one a week
    // the mask itself is used up once a day by the older PM2.5 event in reallife.js (Life2.day), so nothing is taken here
  }
  const chronicDaily = () => {
    const h = H();
    if (S.day >= 40 && S.day % MO === 0) for (const [k, p] of [['htn', 0.06], ['dm', 0.04], ['asth', 0.03]]) if (!h.chr[k] && Math.random() < p) { h.chr[k] = { dx: 0, ctl: 55, next: 0, last: 0, rxDay: 0, sp: 0, since: S.day }; }
    for (const k in h.chr) {
      const c = h.chr[k], info = CHR[k]; if (!c) continue;
      const rx = h.rx.find(r => r.chr === k), took = rx ? rx.today.filter(d => d.st === 1).length : 0, tot = rx && rx.today.length ? rx.today.length : 0;
      if (c.dx && rx) { c.ctl = clamp(c.ctl + ((tot ? took / tot : 0) - 0.5) * 1.4, 0, 100); if (tot && took === 0) c.m = (c.m || 0) + 1; }
      else c.ctl = clamp(c.ctl - 0.7, 0, 100);
      if (c.dx && c.next && S.day > c.next + 7) c.ctl = clamp(c.ctl - 0.6, 0, 100);
      if (c.dx && c.next && S.day === c.next) msg('คลินิกโรคเรื้อรัง', `${info.i} ถึงนัดตรวจ ${info.n} แล้ว ไปรับยาและตรวจติดตามในแอป 🩺 สุขภาพ`, true);
      if (c.ctl < 25 && Math.random() < 0.01 && !active().some(x => x.k === 'compl')) { const cc = startCond('compl', `${info.n}ควบคุมไม่ได้: ${info.comp}`); if (cc) { c.dx = 1; S.chronic = 1; } }
    }
  };
  const surgNeedDaily = () => {
    const h = H(); if (h.need || h.plan || h.post) return;
    const p = [['hernia', 0.002 * (S.energy < 30 ? 2 : 1)], ['cat', S.day > 250 ? 0.002 : 0]];
    for (const [k, v] of p) if (Math.random() < v) { h.need = { k, day: S.day, dx: 0 }; msg('สุขภาพ', `🩺 ${NEEDTXT[k]} ไปพบแพทย์เพื่อตรวจ`, true); break; }
    if (!h.need && Math.random() < 0.0001) { const c = startCond('compl', 'กระดูกหักจากอุบัติเหตุ'); if (c) { c.fxFracture = 1; } }
  };

  // ================= daily progression =================
  function progress(c) {
    const info = COND[c.k], h = H(); c.age = S.day - c.day;
    const rxs = h.rx.filter(r => r.cid === c.id); let took = 0, tot = 0;
    for (const r of rxs) { took += r.today.filter(d => d.st === 1).length; tot += r.today.length; }
    const txF = tot ? took / tot : 0, self = Math.min(1, c.fx.self || 0), rest = c.fx.rest ? 1 : 0, fl = c.fx.ors ? 1 : 0, monitored = c.fx.mon ? 1 : 0;
    c.tx = txF; const care = Math.max(txF, self * 0.6);
    // sickness escalates without care, falls with it
    let esc = info.esc * (1 - 0.6 * care - 0.2 * rest - 0.1 * fl) * (c.age >= 2 && !care && !c.seen ? 1.8 : 1) * (c.nsaid ? 1.8 : 1);
    if (info.crit && c.age >= info.crit[0] && c.age <= info.crit[1]) esc += 0.16 * (monitored ? 0.15 : 1) * (c.tested ? 0.8 : 1.2);
    if (c.k === 'food' && c.sev >= 2 && !c.seen && c.age >= 2) esc += 0.03;
    if (c.sev < 3 && Math.random() < esc) {
      c.sev++; c.cx++;
      if (c.sev >= 3) { c.erDay = 0; c.sev3d = 0; S.sick = 2; msg('สุขภาพ', `🚨 ${info.n} รุนแรงขึ้น! ไปห้องฉุกเฉินหรือโทร 1669`, true); }
      else msg('สุขภาพ', `${info.i} อาการ ${info.n} แย่ลง ควรไปพบแพทย์`, true);
    }
    const d = 0.6 + 0.55 * txF + 0.25 * self + 0.2 * rest + 0.15 * fl - (c.sev >= 3 ? 0.6 : 0);
    if (c.sev < 3 || c.erDay) c.left -= Math.max(0.1, d);
    if (c.sev >= 3 && !c.erDay && c.age - c.cx >= 0 && (c.sev3d = (c.sev3d || 0) + 1) >= 2) forceAdmit(c);
    if (c.left <= 0 && c.sev < 3) { c.done = 1; c.end = S.day; mood(6); msg('สุขภาพ', `✅ ${info.n} หายดีแล้ว${c.cx ? ' (ผ่านช่วงอาการหนัก)' : ''}`, true); hist(`หายจาก ${info.n} (${c.age + 1} วัน)`); }
    c.fx = {}; c.seenToday = 0;
  }
  // too ill and nobody took them: an ambulance takes them to the ER on the second day of severe illness
  function forceAdmit(c) {
    const info = COND[c.k]; c.erDay = S.day; c.sev = 2; c.left = Math.min(c.left, 3);
    const pr = 6000 + (c.emerg ? 20000 : 0), ucep = { pay: 0 }, r = hospPay(pr, 'ipd'), fee = r.pay; useIns(r.ins, 'ipd');
    const paid = Math.min(S.money, fee); S.money -= paid; if (paid) { try { Bank2.log(`ห้องฉุกเฉิน/รักษาตัวใน รพ. ${info.n}`, -paid); } catch (e) { } } bill(`รักษาตัวใน รพ. (รถพยาบาล) ${info.n}`, pr, 'ipd', { paid: r.pay > 0 });
    energy(-30); mood(-12); msg('โรงพยาบาลสุขใจ', `🚑 ทีมกู้ชีพนำส่ง ER เพราะอาการหนัก พักรักษาตัว 2 วัน ${fee ? 'ค่าใช้จ่าย ' + baht(paid) : 'ไม่เสียค่าใช้จ่าย (UCEP/สิทธิ)'}`, true);
    hist(`ถูกนำส่ง ER: ${info.n}`); if (c.fxFracture) { c.done = 1; doSurgery('fx', true, true, true); return; } if (c.k === 'food' && Math.random() < 0.25) { H().plan = null; H().need = null; msg('โรงพยาบาลสุขใจ', 'แพทย์ตรวจพบไส้ติ่งอักเสบ ต้องผ่าตัดด่วน', true); doSurgery('appx', true, true, true); }
  }
  function syncSick() {
    const act = active(); if (!act.length) { if (S.sick && S.sickAuto31) { S.sick = 0; S.sickDays = 0; } S.sickAuto31 = 0; return; }
    S.sickAuto31 = 1; S.sick = act.some(c => c.sev >= 3) ? 2 : 1;
  }
  function reconcileA() { // the old clinic/medicine paths clear S.sick directly: treat that as the illness being cured
    const act = active(); if (!S.sick && act.length) for (const c of act) { c.done = 1; c.end = S.day; c.fast = 1; hist(`หายจาก ${COND[c.k].n} (รักษาที่คลินิก/ยา)`); }
  }
  function reconcileB() {
    if (S.sick && !active().length && S.day - H().lastSick > 0) { const se = season().id; startCond(S.thirst < 20 || S.hunger < 20 ? 'food' : se === 'cool' ? 'flu' : 'cold', 'ป่วยจากสภาพร่างกาย'); }
  }

  // ================= visits =================
  const CLINIC = { n: 'คลินิกเวชกรรมสุขใจ', fee: 350 };
  function clinicOpen() { if (window.Hours36) return Hours36.open('clinic'); const hr = hrOf(), d = S.day; return holiday(d) ? (hr >= 9 && hr < 15) : (hr >= 9 && hr < (wdOf(d) ? 20 : 17)); }
  function hospOpen(k) { try { return Civic.slot(k || 'opd'); } catch (e) { return wdOf() && hrOf() >= 8 && hrOf() < 16 ? 'office' : null; } }
  function recordVisit(c, where) {
    c.seen = S.day; c.at = where; c.seenToday = 1;
    const info = COND[c.k], il = [];
    // diagnosis: the clinic is right most of the time, a hospital nearly always
    if (c.k === 'dengue' && !c.tested) il.push('สงสัยไข้เลือดออก ควรตรวจเลือด NS1/CBC และมาติดตามเกล็ดเลือดทุกวันช่วงวันที่ 3–6');
    if (info.sp && c.sev >= 2) { const h = H(); const r = right(); h.refer = { exp: S.day + 14, from: where === 'hosp' ? hosp() : CLINIC.n }; il.push(`แพทย์เขียนใบส่งตัวพบ${SPEC[info.sp][0]} (ใช้ได้ถึง${RD(h.refer.exp)})`); }
    const rx = rxFor(c); c.rx = rx.map(([m, per, d]) => `${MED[m][0]} ${per}×/วัน ${d} วัน`);
    return { il, rx };
  }
  function consult(cid, where) {
    const h = H(), c = condById(+cid); if (!c || c.done) return; const info = COND[c.k];
    if (where === 'clinic') {
      if (!clinicOpen()) { UI.toast('คลินิกปิด (' + (window.Hours36 ? Hours36.text('clinic') : 'เปิด 09:00–20:00') + ')', '🕒'); return; }
      if (!pay(CLINIC.fee, `ค่าตรวจ ${CLINIC.n}`)) return;
      spend(45, () => { const o = recordVisit(c, 'clinic'); bill(`ค่าตรวจ ${CLINIC.n}: ${info.n}`, CLINIC.fee, 'opd'); issueRx(c, 'clinic'); c.fx.rest = 1; UI.toast(`พบแพทย์ที่คลินิก: ${info.n}`, '🩺'); if (o.il.length) msg(CLINIC.n, o.il.join(' · '), true); });
    } else if (where === 'hosp') {
      const slot = hospOpen('opd'); if (!slot) { UI.toast('OPD โรงพยาบาลปิด (เปิด จ-ศ 08:00–20:00, ส-อา 08:00–12:00) · ไป ER ได้ตลอด 24 ชม.', '🕒'); return; }
      let cost = 0, wait = 60; try { const x = Civic.cost('opd', right(), hosp()); cost = x.pay; wait = Civic.wait('opd', hosp()); } catch (e) { cost = right() === 'ucs' ? 30 : 450; }
      if (!pay(cost, `ค่าตรวจ OPD ${hosp()}`)) return;
      spend(wait + 25, () => { const o = recordVisit(c, 'hosp'); if (cost) bill(`ค่าตรวจ OPD ${hosp()}`, cost, 'opd'); issueRx(c, 'hosp'); c.fx.rest = 1; UI.toast(`พบแพทย์ที่ ${hosp()} (รอคิว ${wait} นาที)`, '🏥'); if (o.il.length) msg(hosp(), o.il.join(' · '), true); });
    } else { // ER
      let cost = 0; try { cost = Civic.cost('er', right(), hosp()).pay; } catch (e) { cost = 1500; }
      if (c.sev >= 3) cost = right() === 'self' ? 4500 : 0; if (!pay(cost, `ห้องฉุกเฉิน ${hosp()}`)) return;
      spend(120, () => { const o = recordVisit(c, 'hosp'); c.erDay = S.day; c.sev = Math.min(c.sev, 2); c.left = Math.min(c.left, c.k === 'dengue' ? 5 : 3); c.fx.rest = 1; c.fx.mon = 1; c.sev3d = 0; energy(-10);
        if (cost) bill(`ห้องฉุกเฉิน ${hosp()}`, cost, 'opd'); issueRx(c, 'hosp'); if (c.emerg && c.fxFracture) { c.done = 1; doSurgery('fx', true, true); return; } UI.toast(`ER รักษาเบื้องต้น ${info.n} อาการทุเลาลง`, '🚑'); if (o.il.length) msg(hosp(), o.il.join(' · '), true); });
    }
  }
  function issueRx(c, where) {
    const L = rxFor(c); let tot = 0;
    for (const [m, per, d] of L) { newRx(m, per, d, { cid: c.id }); tot += MED[m][2] * per * d; }
    if (!tot) return;
    if (where === 'clinic') { const p = Math.round(tot * 1.1); if (S.money >= p) { S.money -= p; try { Bank2.log('ค่ายา ' + CLINIC.n, -p); } catch (e) { } bill('ค่ายา ' + CLINIC.n, p, 'opd'); } else { UI.toast('เงินไม่พอจ่ายค่ายา ได้ใบสั่งยาแต่ไม่ได้รับยา', '💸'); H().rx = H().rx.filter(r => r.cid !== c.id); } }
    else { const r = hospPay(Math.round(tot * 0.8), 'opd'); if (r.pay > 0 && !pay(r.pay, 'ค่ายา ' + hosp())) { H().rx = H().rx.filter(x => x.cid !== c.id); UI.toast('เงินไม่พอจ่ายค่ายา', '💸'); return; } useIns(r.ins, 'opd'); if (r.pay > 0) bill('ค่ายา ' + hosp(), r.pay, 'opd'); }
    UI.toast(`ได้รับยา ${L.length} รายการ ดูตารางกินยาในแท็บ ยา`, '💊');
  }
  function doTest(cid) {
    const c = condById(+cid), info = c && COND[c.k]; if (!c || !info || !info.test || c.tested) return; if (!c.seen || S.day - c.seen > 1) { UI.toast('ต้องพบแพทย์ก่อนจึงจะสั่งตรวจ', 'ℹ️'); return; }
    const [, nm, pr] = info.test; let cost;
    if (c.at === 'hosp') { const r = hospPay(Math.round(pr * 1.3), 'opd'); cost = r.pay; if (!hospOpen('lab') && !c.erDay) { UI.toast('ห้องแล็บปิดแล้ว', '🕒'); return; } if (!pay(cost, `ค่าตรวจ ${nm}`)) return; useIns(r.ins, 'opd'); if (cost) bill(`ค่าตรวจ ${nm}`, cost, 'opd'); }
    else { cost = pr; if (!pay(cost, `ค่าตรวจ ${nm}`)) return; bill(`ค่าตรวจ ${nm}`, cost, 'opd'); }
    spend(40, () => {
      c.tested = 1; const prob = c.k === 'flu' ? 0.7 : c.k === 'throat' ? 0.5 : 1; c.pos = Math.random() < prob ? 1 : 0;
      if (c.k === 'dengue') { c.fx.mon = 1; c.tested = 1; c.pos = 1; }
      const res = c.k === 'dengue' ? 'NS1 ให้ผลบวก เกล็ดเลือดเริ่มลดลง ต้องมาติดตามทุกวันถึงวันที่ 6' : c.pos ? `ผลบวก — ${info.n}` : c.k === 'pm25' ? 'ปอดอักเสบจากฝุ่นเล็กน้อย' : 'ผลลบ (ไม่พบเชื้อ)';
      if (c.pos) { issueRx(c, c.at === 'hosp' ? 'hosp' : 'clinic'); } UI.toast(`ผลตรวจ: ${res}`, '🧪'); msg(c.at === 'hosp' ? hosp() : CLINIC.n, `ผลตรวจ ${nm}: ${res}`, true); hist(`ตรวจ ${nm}: ${res}`);
    });
  }
  function monitor(cid) { // dengue: daily blood count during the critical phase
    const c = condById(+cid); if (!c || c.k !== 'dengue' || !c.tested || c.fx.mon) return;
    const cost = c.at === 'hosp' ? hospPay(500, 'opd').pay : 600; if (!pay(cost, 'ตรวจเกล็ดเลือดติดตาม')) return; if (cost) bill('ตรวจเกล็ดเลือดติดตาม', cost, 'opd');
    spend(35, () => { c.fx.mon = 1; c.mon++; const ok = c.sev < 3; UI.toast(ok ? `เกล็ดเลือดติดตาม${RD(c.age + 1)}: ${c.age >= 5 ? 'เริ่มฟื้นตัว' : 'ยังต่ำ ให้ดื่มน้ำมาก ๆ และพัก'}` : 'เกล็ดเลือดต่ำมาก แพทย์ให้ไปห้องฉุกเฉิน', '🩸'); });
  }
  function rest(cid) { const c = condById(+cid); if (!c || c.done || c.fx.rest) return; spend(180, () => { c.fx.rest = 1; energy(+12); mood(2); UI.toast('นอนพักผ่อน ดื่มน้ำ ร่างกายฟื้นตัวดีขึ้น', '🛌'); }); }
  function cert(cid) {
    const c = condById(+cid), h = H(); if (!c) return; if (!c.seen || S.day - c.seen > 2) { UI.toast('ต้องพบแพทย์ภายใน 2 วันก่อน จึงขอใบรับรองแพทย์ได้', 'ℹ️'); return; }
    if (c.certDay === S.day) { UI.toast('ขอใบรับรองแพทย์วันนี้แล้ว', 'ℹ️'); return; } if (!gov(['idcard'], 'ขอใบรับรองแพทย์')) return;
    const fee = c.at === 'hosp' ? 100 : 200; if (!pay(fee, 'ค่าใบรับรองแพทย์')) return;
    c.certDay = S.day; h.certs++; const days = Math.max(1, Math.min(7, Math.ceil(c.left)));
    try { if (window.Agency26 && Agency26.grant) Agency26.grant('medcert', { dx: COND[c.k].n, rest: days, by: c.at === 'hosp' ? hosp() : CLINIC.n }, c.at === 'hosp' ? hosp() : CLINIC.n, 'ออก'); } catch (e) { console.warn('medcert', e); }
    try { Civic.sickLeave(); } catch (e) { } UI.toast(`ได้ใบรับรองแพทย์ พักรักษาตัว ${days} วัน (ใช้ลาป่วยได้)`, '📄');
  }

  // ================= specialists & referral =================
  function specFee(sp) {
    const r = right(), price = SPEC[sp][2], ref = H().refer.exp >= S.day;
    if (r === 'self') return { pay: price, why: 'จ่ายเอง' };
    if (r === 'ins') { const cap = Math.min(price, 3000); return { pay: price - cap, why: 'ประกันเอกชน (จ่ายตรง)', ins: cap }; }
    if (!ref) return { pay: price, why: 'ไม่มีใบส่งตัว จ่ายเอง' };
    return { pay: r === 'ucs' ? 30 : 0, why: `${RN[r]} (มีใบส่งตัว)` };
  }
  function bookAppt(sp, day, slot) {
    const h = H(); day = +day; if (!SPEC[sp]) return; if (h.appt.some(a => a.sp === sp && a.day >= S.day)) { UI.toast('มีนัดแผนกนี้อยู่แล้ว', 'ℹ️'); return; }
    if (!wdOf(day) || holiday(day)) { UI.toast('วันนั้นแพทย์เฉพาะทางไม่ออกตรวจ', 'ℹ️'); return; }
    if (h.appt.some(a => a.day === day && a.slot === slot)) { UI.toast('ช่วงเวลานี้มีนัดอื่นแล้ว', 'ℹ️'); return; }
    h.appt.push({ id: h.nid++, sp, day, slot, ref: h.refer.exp >= S.day ? 1 : 0, h: hosp() }); h.appt.sort((a, b) => a.day - b.day || a.slot.localeCompare(b.slot));
    UI.toast(`จองนัด${SPEC[sp][0]} ${RD(day)} ${slot === 'am' ? 'ช่วงเช้า 09:00–12:00' : 'ช่วงบ่าย 13:00–16:00'}`, '📅');
  }
  function attend(id) {
    const h = H(), a = h.appt.find(x => x.id === +id); if (!a || a.day !== S.day) { UI.toast('ยังไม่ถึงวันนัด', 'ℹ️'); return; }
    const hr = hrOf(); if (hr < (a.slot === 'am' ? 9 : 13) - 0.5 || hr >= (a.slot === 'am' ? 12 : 16)) { UI.toast(`เวลานัด ${a.slot === 'am' ? '09:00–12:00' : '13:00–16:00'} น.`, '🕒'); return; }
    const f = specFee(a.sp); if (!pay(f.pay, `ค่าพบ${SPEC[a.sp][0]}`)) return; const spn = a.sp;
    spend(70, () => {
      h.appt = h.appt.filter(x => x.id !== a.id); if (f.pay) bill(`ค่าพบ${SPEC[spn][0]}`, f.pay, 'opd'); useIns(f.ins || 0, 'opd');
      let out = `พบ${SPEC[spn][0]} (${f.why})`;
      for (const k in h.chr) { const c = h.chr[k]; if (CHR[k].sp === spn) { if (!c.dx) { c.dx = 1; S.chronic = 1; out += ` · วินิจฉัย: ${CHR[k].n}`; msg(hosp(), `แพทย์วินิจฉัย ${CHR[k].n} ต้องกินยาต่อเนื่องและมาตรวจทุก 4 สัปดาห์`, true); } c.ctl = clamp(c.ctl + 12, 0, 100); c.sp = S.day; c.next = S.day + MO; rxChr(k, 28); out += ` · ปรับยา ${CHR[k].n} ควบคุมดีขึ้น`; } }
      for (const c of active()) if (COND[c.k].sp === spn) { c.fx.rest = 1; c.left = Math.max(0.5, c.left - 1); out += ` · รักษา ${COND[c.k].n}`; }
      if (h.need && SURG[h.need.k].sp === spn && !h.need.dx) { h.need.dx = 1; out += ` · ${SURG[h.need.k].n}`; msg(hosp(), `แพทย์แนะนำ ${SURG[h.need.k].n} นัดผ่าตัดได้ในแท็บ นัดหมาย & ผ่าตัด`, true); }
      UI.toast(out, '🩺'); hist(out);
    });
  }
  function rxChr(k, days) { const info = CHR[k]; const cost = MED[info.med][2] * info.per * days; const r = right() === 'self' ? { pay: cost } : hospPay(cost, 'opd'); const p = Math.round(r.pay); if (p > 0) { if (S.money < p) { UI.toast('เงินไม่พอจ่ายค่ายาเรื้อรัง', '💸'); return false; } S.money -= p; try { Bank2.log('ค่ายา ' + info.n, -p); } catch (e) { } bill('ค่ายา ' + info.n, p, 'opd'); } newRx(info.med, info.per, days, { chr: k }); return true; }
  function chrVisit(k, where) {
    const h = H(), c = h.chr[k], info = CHR[k]; if (!c) return;
    if (where === 'clinic') { if (!clinicOpen()) { UI.toast('คลินิกปิด', '🕒'); return; } if (!pay(CLINIC.fee, `ค่าตรวจ ${CLINIC.n} (${info.n})`)) return; bill(`ค่าตรวจ ${CLINIC.n} (${info.n})`, CLINIC.fee, 'opd'); }
    else { if (!hospOpen('refill')) { UI.toast('คลินิกโรคเรื้อรังโรงพยาบาลปิด (จ-ศ 08:00–16:00)', '🕒'); return; } let cost = 0; try { cost = Civic.cost('refill', right(), hosp()).pay; } catch (e) { } if (!pay(cost, `ค่าตรวจ ${info.n} ${hosp()}`)) return; if (cost) bill(`ค่าตรวจ ${info.n}`, cost, 'opd'); }
    spend(where === 'clinic' ? 45 : 80, () => {
      let out = `ตรวจ${info.n} (${info.test})`;
      if (!c.dx) { c.dx = 1; S.chronic = 1; out += ` — พบ ${info.n}! เริ่มกินยาต่อเนื่อง`; }
      c.ctl = clamp(c.ctl + 10, 0, 100); c.next = S.day + MO; c.last = S.day; if (where === 'hosp' && right() !== 'self') { h.refer = { exp: S.day + 14, from: hosp() }; out += ' · ได้ใบส่งตัว'; } if (rxChr(k, 28)) out += ' · รับยา 28 วัน'; UI.toast(out, info.i); hist(out);
    });
  }
  function screen(where) {
    const h = H(), cost = where === 'clinic' ? 300 : (right() === 'self' ? 500 : 0); if (where === 'clinic' && !clinicOpen()) { UI.toast('คลินิกปิด', '🕒'); return; } if (where === 'hosp' && !hospOpen('checkup')) { UI.toast('คลินิกตรวจสุขภาพโรงพยาบาลปิด (จ-ศ 08:00–16:00)', '🕒'); return; }
    if (!pay(cost, 'ตรวจคัดกรองความดัน/น้ำตาล/ปอด')) return; if (cost) bill('ตรวจคัดกรองสุขภาพ', cost, 'opd');
    spend(50, () => { const found = Object.keys(h.chr).filter(k => !h.chr[k].dx); for (const k of found) { h.chr[k].dx = 1; h.chr[k].next = S.day + MO; S.chronic = 1; } UI.toast(found.length ? `ตรวจพบ: ${found.map(k => CHR[k].n).join(', ')} ควรเริ่มรักษา` : 'ผลคัดกรองปกติ ไม่พบโรคเรื้อรัง', '📋'); if (found.length) msg(where === 'hosp' ? hosp() : CLINIC.n, `ตรวจพบ ${found.map(k => CHR[k].n).join(', ')} พบแพทย์เพื่อเริ่มยาได้ในแท็บ ยา`, true); });
  }

  // ================= surgery =================
  function sched(k) {
    const h = H(), s = SURG[k]; if (!h.need || h.need.k !== k || !h.need.dx || h.plan) return;
    const r = right(); const wait = r === 'ucs' ? 14 : r === 'sso' || r === 'gov' ? 7 : 3; let day = S.day + wait; while (!wdOf(day) || holiday(day)) day++;
    h.plan = { k, day, pre: 0, dx: 1 }; h.need = null; UI.toast(`นัดผ่าตัด ${s.n} ${RD(day)} (ตรวจก่อนผ่าตัดอย่างน้อย 1 วันก่อน)`, '📅'); msg(hosp(), `นัดผ่าตัด ${s.n} ${RD(day)} ตรวจเลือดและ ECG ก่อนผ่าตัดที่แผนกตรวจก่อนผ่าตัด`, true);
  }
  function preop() {
    const h = H(), p = h.plan; if (!p || p.pre) return; if (!hospOpen('lab')) { UI.toast('แผนกตรวจก่อนผ่าตัดปิด (จ-ศ 08:00–16:00)', '🕒'); return; }
    const price = 1800, r = hospPay(price, 'opd'); if (!pay(r.pay, 'ตรวจก่อนผ่าตัด (เลือด + ECG)')) return; useIns(r.ins, 'opd'); if (r.pay) bill('ตรวจก่อนผ่าตัด', r.pay, 'opd');
    spend(90, () => { p.pre = 1; UI.toast('ตรวจก่อนผ่าตัดผ่าน งดน้ำงดอาหารก่อนผ่าตัด 6 ชั่วโมง', '✅'); });
  }
  function doSurgery(k, emerg, silent, noSim) {
    const h = H(), s = SURG[k], price = s.cost, r = hospPay(price, 'ipd'); let fee = r.pay;
    if (emerg && right() !== 'self' && right() !== 'ins') fee = 0; // UCEP
    const paid = Math.min(S.money, fee); S.money -= paid; if (paid) { try { Bank2.log(`ค่าผ่าตัด ${s.n}`, -paid); } catch (e) { } }
    useIns(emerg && right() === 'ins' ? r.ins : r.ins, 'ipd'); bill(`${s.n} (รพ.${hosp()})`, price, 'ipd', { paid: fee > 0, cashless: r.ins > 0 });
    h.plan = null; h.need = null; h.post = { k, left: s.rec, follow: S.day + 7, seen: 0, start: S.day };
    const days = s.ipd; if (!noSim) { try { if (days > 0) simulate(days * 1440); else tick(240); } catch (e) { console.warn('v31h surg sim', e); } }
    energy(-25); mood(-6); const nm = s.n; msg(hosp(), `🏥 ${nm} เสร็จเรียบร้อย พักฟื้น ${s.rec} วัน มาตัดไหม/ตรวจแผล${RD(h.post.follow)} ${fee ? '· ชำระ ' + baht(paid) : '· ไม่เสียค่าใช้จ่าย (สิทธิรักษา)'}`, true);
    newRx('abx2', 2, 5, { cid: -1 }); newRx('pain', 3, 5, { cid: -1 }); hist(`ผ่าตัด: ${nm}`); note(`ผ่าตัด ${nm}`);
    if (!silent) saveGame(true);
  }
  function admit() {
    const h = H(), p = h.plan; if (!p || p.day > S.day) { UI.toast('ยังไม่ถึงวันนัดผ่าตัด', 'ℹ️'); return; }
    if (!p.pre) { UI.toast('ต้องตรวจก่อนผ่าตัดก่อน', 'ℹ️'); return; } if (!hospOpen('lab')) { UI.toast('ติดต่อห้องผ่าตัดได้ จ-ศ 08:00–16:00', '🕒'); return; }
    const k = p.k; spend(0, () => doSurgery(k, false, true));
  }
  function followup() {
    const h = H(), p = h.post; if (!p || p.seen) return; if (!hospOpen('refill')) { UI.toast('คลินิกศัลยกรรมปิด (จ-ศ 08:00–16:00)', '🕒'); return; }
    const r = hospPay(300, 'opd'); if (!pay(r.pay, 'ตรวจแผล/ตัดไหม')) return; useIns(r.ins, 'opd'); if (r.pay) bill('ตรวจแผล/ตัดไหม', r.pay, 'opd'); spend(40, () => { p.seen = 1; UI.toast('แผลหายดี ตัดไหมเรียบร้อย', '✅'); });
  }

  // ================= daily / hourly hooks =================
  function missedDoses(day) { // doses that were never taken are logged as missed at day end
    for (const r of H().rx) { for (const d of r.today) if (d.st === 0) { d.st = -1; r.m++; H().adh.m++; } }
  }
  function postopDaily() {
    const h = H(), p = h.post; if (!p) return; p.left--;
    const cap = maxEnergy() * clamp(0.55 + 0.45 * (1 - p.left / Math.max(1, SURG[p.k].rec)), 0.4, 1); if (S.energy > cap) S.energy = cap;
    if (!p.seen && S.day > p.follow + 1 && !p.inf && Math.random() < 0.08) { p.inf = 1; startCond('wound', 'ไม่ได้มาตรวจแผลตามนัด'); }
    if (p.left <= 0) { h.post = null; msg('สุขภาพ', '✅ พักฟื้นหลังผ่าตัดครบกำหนด กลับไปทำงานหนักได้แล้ว', true); }
  }
  function apptDaily() {
    const h = H();
    for (const a of h.appt.slice()) {
      if (a.day === S.day) msg(a.h, `📅 วันนี้มีนัดพบ${SPEC[a.sp][0]} ${a.slot === 'am' ? '09:00–12:00' : '13:00–16:00'} น.`, true);
      else if (a.day < S.day) { h.appt = h.appt.filter(x => x.id !== a.id); h.bias++; msg(a.h, `คุณไม่ได้มาตามนัดพบ${SPEC[a.sp][0]} นัดถูกยกเลิก${a.ref ? ' ใบส่งตัวถูกใช้ไปแล้ว' : ''}`, true); h.refer = { exp: 0, from: '' }; }
    }
    if (h.plan && S.day > h.plan.day + 5) { msg(hosp(), `นัดผ่าตัด ${SURG[h.plan.k].n} ถูกยกเลิกเพราะไม่มาตามนัด ต้องนัดใหม่`, true); h.need = { k: h.plan.k, day: S.day, dx: 1 }; h.plan = null; }
  }
  function claimsDaily() {
    const h = H();
    for (const c of h.claims.slice()) if (S.day >= c.due) { h.claims = h.claims.filter(x => x.id !== c.id); const il = insLimit(); if (c.cat === 'ipd') il.ipd += c.amt; else { il.opd += c.amt; il.n++; } gain(c.amt, 'เงินสินไหมประกันสุขภาพ'); msg('บริษัทประกันภัย', `🛡️ อนุมัติเคลมค่ารักษา โอนเงิน ${baht(c.amt)} เข้าบัญชีแล้ว`, true); }
  }
  function hourly() {
    const h = H(), hr = Math.floor(hrOf()); try { reconcileA(); } catch (e) { }
    for (const r of h.rx) for (const d of r.today) {
      if (d.st === 0 && d.h === hr) { const k = r.id + ':' + S.day + ':' + hr; if (!h.msgd[k]) { h.msgd[k] = 1; msg('เตือนกินยา', `${MED[r.med][1]} ถึงเวลากิน ${MED[r.med][0]} แล้ว (เปิดแอป 🩺 สุขภาพ แท็บ ยา)`); } }
      if (d.st === 0 && hr > d.h + 3) { d.st = -1; r.m++; h.adh.m++; }
    }
    if (Object.keys(h.msgd).length > 60) h.msgd = {};
  }
  function daily() {
    const h = H(); if (h.lastDay === S.day) return; h.lastDay = S.day;
    reconcileA(); missedDoses(S.day - 1);
    for (const c of active()) progress(c);
    chronicDaily();
    for (const r of h.rx) { r.today = []; }
    h.rx = h.rx.filter(r => r.left > 0); for (const r of h.rx) planDoses(r);
    onsetDaily(); surgNeedDaily(); postopDaily(); apptDaily(); claimsDaily();
    if (h.refer.exp && h.refer.exp < S.day) h.refer = { exp: 0, from: '' };
    // finished courses disappear after a few days; a skipped antibiotic course can relapse
    syncSick(); reconcileB();
    if (h.mask && !n95n() && (() => { try { return RL.on('pm25'); } catch (e) { return false; } })() && !h.msgd['mask' + S.day]) { h.msgd['mask' + S.day] = 1; msg('สุขภาพ', '😷 ฝุ่น PM2.5 สูง ควรสวมหน้ากาก N95 (ซื้อที่ร้านยา)', true); }
  }

  // ================= UI =================
  const B = (act, label, o = {}) => `<button class="btn ${o.ghost ? 'ghost' : ''}" data-a="h31" data-v="${esc(act)}"${o.dis ? ' disabled' : ''}>${label}</button>`;
  const C = (i, t, p, btns = '') => `<div class="card"><div class="ci">${i}</div><div class="cb"><h4>${t}</h4><p class="dim">${p}</p>${btns ? `<div class="row">${btns}</div>` : ''}</div></div>`;
  const GR = x => `<div class="grid">${x}</div>`, H5 = t => `<h5>${t}</h5>`, LEAD = t => `<p class="lead">${t}</p>`, DIM = t => `<p class="dim">${t}</p>`;
  const SEV = ['', '🟡 เล็กน้อย', '🟠 ปานกลาง', '🔴 รุนแรง'];
  const A = {};
  UI.H.h31 = d => { const [k, ...r] = String(d.v || '').split('|'); const f = A[k]; if (f) { try { f(...r); } catch (e) { if (e && e.spend173) throw e; console.warn('h31', k, e); } } };
  Object.assign(A, { consult, test: doTest, mon: monitor, rest, cert, use: useOTC, buy: buyOTC, nsaid, mask: wearMask, take: takeDose, claim: doClaim,
    book: bookAppt, att: attend, sched, preop, admit, follow: followup, chr: chrVisit, screen });
  A.tab = t => { H().sel = +t; };
  A.cancel = id => { const h = H(); h.appt = h.appt.filter(x => x.id !== +id); UI.toast('ยกเลิกนัดแล้ว', 'ℹ️'); };
  A.refill = id => { const h = H(), r = h.rx.find(x => x.id === +id); if (!r || !r.chr) return; chrVisit(r.chr, 'clinic'); };

  const rightLine = () => { const r = right(); return `สิทธิรักษาที่ใช้: <b>${RN[r] || r}</b>${hasIns() ? ' · มีประกันสุขภาพเอกชน' : ''} · ใบส่งตัว: ${H().refer.exp >= S.day ? `<b>มี</b> (ถึง${RD(H().refer.exp)})` : 'ไม่มี'}`; };
  function condCard(c) {
    const info = COND[c.k], h = H(), seen = c.seen && S.day - c.seen <= 2, ctx = c.seen === S.day;
    const rxs = h.rx.filter(r => r.cid === c.id);
    let t = `${SEV[c.sev]} · เริ่มป่วย ${c.age === 0 ? 'วันนี้' : c.age + ' วันที่แล้ว'} · คาดว่าหายอีก ~${Math.max(1, Math.ceil(c.left))} วัน${c.why ? ' · ' + esc(c.why) : ''}`;
    if (c.seen) t += `<br>พบแพทย์ล่าสุด${RD(c.seen)} (${c.at === 'hosp' ? hosp() : CLINIC.n})${c.tested ? ` · ผลตรวจ: ${c.pos || c.k === 'dengue' ? 'ผลบวก' : 'ผลลบ'}` : ''}`;
    if (c.k === 'dengue' && c.age >= info.crit[0] && c.age <= info.crit[1]) t += `<br><b class="bad">ช่วงวิกฤต (${RD(info.crit[0] + 1)}–${info.crit[1] + 1}) ตรวจเลือดติดตามทุกวัน และห้ามกินแอสไพริน/ไอบูโพรเฟน</b>`;
    if (rxs.length) t += `<br>ยา: ${rxs.map(r => `${MED[r.med][0]} (เหลือ ${r.left})`).join(', ')}`;
    const b = [];
    b.push(B(`rest|${c.id}`, c.fx.rest ? '🛌 พักแล้ววันนี้' : '🛌 นอนพัก 3 ชม.', { ghost: 1, dis: !!c.fx.rest }));
    for (const k of info.help) if (h.inv[k] > 0) b.push(B(`use|${c.id}|${k}`, `${MED[k][1]} ใช้${OTC[k][0].split(' ')[0]} (มี ${h.inv[k]})`, { ghost: 1 }));
    if (c.k === 'dengue') b.push(B(`nsaid|${c.id}`, '⚠️ กินไอบูโพรเฟน', { ghost: 1 }));
    b.push(B(`consult|${c.id}|clinic`, `🏪 คลินิก ${baht(CLINIC.fee)}`, { dis: !clinicOpen() }), B(`consult|${c.id}|hosp`, `🏥 รพ. OPD (${RN[right()]})`, { dis: !hospOpen('opd') }), B(`consult|${c.id}|er`, '🚑 ER 24 ชม.', { dis: false }));
    if (info.test && !c.tested) b.push(B(`test|${c.id}`, `🧪 ${info.test[1]}`, { ghost: 1, dis: !(c.seen && S.day - c.seen <= 1) }));
    if (c.k === 'dengue' && c.tested) b.push(B(`mon|${c.id}`, c.fx.mon ? '🩸 ติดตามแล้ววันนี้' : '🩸 ตรวจเกล็ดเลือดติดตาม', { ghost: 1, dis: !!c.fx.mon }));
    b.push(B(`cert|${c.id}`, '📄 ขอใบรับรองแพทย์', { ghost: 1, dis: !seen }));
    return C(info.i, `${esc(info.n)}`, t, b.join(''));
  }
  const tab0 = () => {
    const h = H(), act = active();
    let s = LEAD(`${S.sick ? (S.sick === 2 ? '🤒 ป่วยหนัก' : '🤒 ไม่สบาย') : '😊 สุขภาพดี'} · พลังงาน ${Math.round(S.energy)}/${maxEnergy()}<br>${rightLine()}`) + DIM('ดูแลตัวเองได้ที่บ้าน ซื้อยาสามัญที่ร้านยา ไปคลินิกเอกชน (จ่ายเอง) หรือโรงพยาบาลตามสิทธิ ถ้าอาการหนักไป ER ได้ทุกเวลา อาการหนักเมื่อไม่ได้รักษา 2 วัน รถพยาบาลจะนำส่งและเสียค่าใช้จ่าย');
    s += H5('อาการและโรคที่เป็นอยู่') + (act.length ? GR(act.map(condCard).join('')) : DIM('ตอนนี้ไม่มีอาการป่วย โรคตามฤดู: หน้าฝนไข้เลือดออก/หวัด หน้าหนาวไข้หวัดใหญ่ หน้าร้อนลมแดด ช่วงฝุ่น PM2.5 หอบหืด — ฉีดวัคซีน ใส่หน้ากาก คว่ำภาชนะขังน้ำ ช่วยป้องกันได้'));
    if (h.need && !h.plan) s += H5('อาการที่ควรตรวจ') + GR(C('⚠️', 'อาการผิดปกติ', NEEDTXT[h.need.k] + (h.need.dx ? ' · แพทย์วินิจฉัยแล้ว' : ' · ไปพบแพทย์เฉพาะทางเพื่อตรวจ (แท็บ นัดหมาย)'), h.need.dx ? B(`sched|${h.need.k}`, `📅 นัดผ่าตัด ${SURG[h.need.k].n}`) : ''));
    s += H5('ร้านยา (08:00–22:00) · ยาสามัญไม่ต้องมีใบสั่งแพทย์ ยาปฏิชีวนะต้องมีใบสั่ง') + GR(Object.entries(OTC).map(([k, o]) => C(MED[k] ? MED[k][1] : '😷', o[0], `${baht(o[1])} · มีในกระเป๋า ${h.inv[k] || 0}`, B(`buy|${k}`, 'ซื้อ'))).join(''));
    s += GR(C('😷', `หน้ากาก N95 ช่วงฝุ่น: ${h.mask ? 'สวมอัตโนมัติ' : 'ไม่สวม'}`, 'ลดโอกาสหอบหืดจาก PM2.5 ใช้ 1 ชิ้น/วันที่ฝุ่นสูง', B('mask', h.mask ? 'เลิกสวม' : 'สวม', { ghost: 1 })));
    if (h.hist.length) s += H5('ประวัติสุขภาพล่าสุด') + h.hist.slice(0, 6).map(x => DIM(`${RD(x.d)}: ${esc(x.t)}`)).join('');
    return s;
  };
  const tab1 = () => {
    const h = H(); let s = LEAD(rightLine()) + DIM('แพทย์เฉพาะทางออกตรวจ จ–ศ (ไม่รวมวันหยุด) ช่วงเช้า 09:00–12:00 / บ่าย 13:00–16:00 · บัตรทอง/ประกันสังคม/ข้าราชการ ต้องมีใบส่งตัวจากแพทย์ที่ตรวจก่อน (ได้เมื่ออาการปานกลางขึ้นไป) ไม่มีใบส่งตัวต้องจ่ายเอง · ไม่มาตามนัดนัดจะถูกยกเลิก');
    s += H5('นัดของฉัน') + (h.appt.length ? GR(h.appt.map(a => C(SPEC[a.sp][1], `${SPEC[a.sp][0]} · ${RD(a.day)} ${a.slot === 'am' ? 'เช้า' : 'บ่าย'}`, `${esc(a.h)} · ${a.ref ? 'มีใบส่งตัว' : 'ไม่มีใบส่งตัว (จ่ายเอง)'}`, B(`att|${a.id}`, a.day === S.day ? '✅ ไปตามนัด' : 'รอถึงวันนัด', { dis: a.day !== S.day }) + B(`cancel|${a.id}`, 'ยกเลิก', { ghost: 1 }))).join('')) : DIM('ยังไม่มีนัด'));
    const days = []; for (let d = S.day + 1; d <= S.day + 12 && days.length < 5; d++) if (wdOf(d) && !holiday(d)) days.push(d);
    s += H5('จองนัดแพทย์เฉพาะทาง') + GR(Object.entries(SPEC).map(([k, o]) => { const f = specFee(k); return C(o[1], o[0], `ค่าพบ: ${f.pay ? baht(f.pay) : 'ฟรี'} (${f.why})`, days.slice(0, 3).map(d => B(`book|${k}|${d}|am`, `${RD(d)} เช้า`, { ghost: 1 })).join('') + B(`book|${k}|${days[0]}|pm`, `${RD(days[0])} บ่าย`, { ghost: 1 })); }).join(''));
    s += H5('ผ่าตัด');
    if (h.plan) { const p = h.plan, sg = SURG[p.k]; s += GR(C(sg.i, `${sg.n} · ${RD(p.day)}`, `ตรวจก่อนผ่าตัด: ${p.pre ? '✅ ผ่านแล้ว' : 'ยังไม่ได้ตรวจ'} · ค่าผ่าตัดโดยประมาณ ${baht(sg.cost)} ${right() === 'self' ? '(จ่ายเอง)' : right() === 'ins' ? '(ประกันจ่ายตรงตามวงเงิน)' : '(ครอบคลุมตามสิทธิ)'} · นอน รพ. ${sg.ipd} วัน · พักฟื้น ${sg.rec} วัน`, B('preop', p.pre ? 'ตรวจแล้ว' : `🧪 ตรวจก่อนผ่าตัด`, { dis: !!p.pre }) + B('admit', '🏥 เข้ารับการผ่าตัด', { dis: p.day > S.day || !p.pre }))); }
    else if (h.need) s += DIM(`มีอาการที่อาจต้องผ่าตัด: ${NEEDTXT[h.need.k]} ${h.need.dx ? '· แพทย์วินิจฉัยแล้ว กดนัดผ่าตัดในแท็บ อาการ' : '· จองพบ' + SPEC[SURG[h.need.k].sp][0]}`);
    else s += DIM('ไม่มีรายการผ่าตัด · ผ่าตัดฉุกเฉิน (ไส้ติ่ง กระดูกหัก) เกิดจากอาการหนัก ใช้สิทธิ UCEP ฟรีที่ รพ.ใดก็ได้');
    if (h.post) { const p = h.post; s += GR(C('🩹', `พักฟื้นหลัง${SURG[p.k].n}`, `เหลือ ${p.left} วัน · พลังงานสูงสุดถูกจำกัดช่วงพักฟื้น · ตัดไหม/ตรวจแผล: ${p.seen ? '✅ แล้ว' : `ภายใน${RD(p.follow + 3)}`}`, B('follow', '🩺 ตรวจแผล/ตัดไหม', { dis: !!p.seen || S.day < p.follow - 1 }))); }
    return s;
  };
  const tab2 = () => {
    const h = H(), now = hrOf(); let s = LEAD('ตารางกินยา: กดกินยาเมื่อถึงเวลา (ล่วงหน้าได้ 1.5 ชม.) · ลืมเกิน 3 ชม. นับว่าขาดยา · กินไม่ครบอาการหายช้า โรคเรื้อรังควบคุมไม่ได้') + DIM(`ความสม่ำเสมอในการกินยาสะสม: ${h.adh.t + h.adh.m ? Math.round(h.adh.t / (h.adh.t + h.adh.m) * 100) + '%' : '-'} (กิน ${h.adh.t} ขาด ${h.adh.m})`);
    const list = h.rx.filter(r => r.today.length || r.left > 0);
    s += H5('ยาที่ต้องกินวันนี้') + (list.some(r => r.today.length) ? GR(list.filter(r => r.today.length).map(r => C(MED[r.med][1], `${esc(MED[r.med][0])} · เหลือ ${r.left} ครั้ง`, r.chr ? `ยาประจำ ${CHR[r.chr].n}` : `${r.cid > 0 && condById(r.cid) ? COND[condById(r.cid).k].n : 'ยาหลังผ่าตัด'}`, r.today.map((d, i) => B(`take|${r.id}|${i}`, d.st === 1 ? `✅ ${hh(d.h)}` : d.st === -1 ? `❌ ${hh(d.h)} ขาด` : `💊 ${hh(d.h)} กินเลย`, { dis: d.st !== 0, ghost: d.st !== 0 })).join(''))).join('')) : DIM('วันนี้ไม่มียาที่ต้องกิน'));
    s += H5('โรคประจำตัว / โรคเรื้อรัง');
    const ks = Object.keys(h.chr).filter(k => h.chr[k].dx);
    s += ks.length ? GR(ks.map(k => { const c = h.chr[k], i = CHR[k], due = c.next && S.day >= c.next; return C(i.i, `${i.n} · การควบคุม ${Math.round(c.ctl)}%`, `${c.ctl >= 65 ? '🟢 ควบคุมดี' : c.ctl >= 40 ? '🟠 พอใช้' : '🔴 ควบคุมไม่ดี เสี่ยง' + i.comp} · ตรวจติดตามทุก 4 สัปดาห์ นัดถัดไป: ${RD(c.next || '-')}${due ? ' <b class="bad">ถึงกำหนดแล้ว</b>' : ''}`, B(`chr|${k}|clinic`, `🏪 คลินิก ${baht(CLINIC.fee)}`, { dis: !clinicOpen() }) + B(`chr|${k}|hosp`, `🏥 รพ. (${RN[right()]})`, { dis: !hospOpen('refill') })); }).join('')) : DIM('ยังไม่มีโรคประจำตัวที่วินิจฉัยแล้ว');
    s += GR(C('📋', 'ตรวจคัดกรองความดัน น้ำตาล ปอด', `โรคเรื้อรังบางอย่างไม่มีอาการ ตรวจพบเร็วควบคุมได้ง่าย · คลินิก ${baht(300)} / รพ. ${right() === 'self' ? baht(500) : 'ฟรีตามสิทธิ'}`, B('screen|clinic', '🏪 คลินิก', { dis: !clinicOpen() }) + B('screen|hosp', '🏥 รพ.', { ghost: 1, dis: !hospOpen('checkup') })));
    return s;
  };
  const tab3 = () => {
    const h = H(), il = insLimit(); let s = LEAD(`${rightLine()}<br>ประกันสุขภาพ: ${hasIns() ? `✅ คุ้มครองถึง${RD(Ins.st().health)} · ใช้ไปปีนี้ ผู้ป่วยนอก ${il.n}/20 ครั้ง ${baht(il.opd)} · ผู้ป่วยใน ${baht(il.ipd)}/100,000` : '❌ ยังไม่มี (ซื้อได้ที่แอปประกัน)'}`) + DIM('เคลมค่ารักษา: ผู้ป่วยนอกชำระเองก่อนแล้วยื่นเคลมภายใน 30 วัน คืน 90% ไม่เกิน 1,500 ฿/ครั้ง ปีละ 20 ครั้ง · ผู้ป่วยในวงเงิน 100,000 ฿/ปี · ที่โรงพยาบาลจ่ายตรง (cashless) ตามวงเงินเมื่อใช้สิทธิประกันเอกชน');
    s += H5('ใบเสร็จค่ารักษาล่าสุด') + (h.bills.length ? GR(h.bills.slice(0, 8).map(b => C(b.cat === 'ipd' ? '🏥' : '🧾', `${esc(b.label)} · ${baht(b.amt)}`, `${RD(b.d)} · ${b.cashless ? 'ประกันจ่ายตรง' : b.claim === 1 ? '✅ ยื่นเคลมแล้ว' : b.claim === -1 ? 'เคลมไม่ได้' : claimable(b) ? 'เคลมได้' : hasIns() ? 'หมดเวลาเคลม/ไม่มียอดชำระเอง' : 'ไม่มีประกัน'}`, claimable(b) ? B(`claim|${b.id}`, '🛡️ ยื่นเคลม') : '')).join('')) : DIM('ยังไม่มีใบเสร็จ'));
    if (h.claims.length) s += H5('เคลมที่รอโอนเงิน') + h.claims.map(c => DIM(`${baht(c.amt)} โอนภายใน${RD(c.due)}`)).join('');
    s += GR(C('📄', 'ใบรับรองแพทย์', `ขอได้จากหน้า อาการ หลังพบแพทย์ภายใน 2 วัน (ใช้เป็นใบลาป่วย) · ที่ขอแล้วทั้งหมด ${h.certs} ใบ · ตรวจใบรับรองในแอป 🏛️ ราชการ`));
    return s;
  };
  const TABS = ['🩺 อาการ & รักษา', '📅 นัดหมาย & ผ่าตัด', '💊 ยา & โรคประจำตัว', '🧾 ค่ารักษา & ประกัน'];
  const render = t => { H().sel = t; return [tab0, tab1, tab2, tab3][t](); };
  const hubOpen = () => UI.open('🩺 สุขภาพ & โรงพยาบาล', TABS, render, { tab: H().sel || 0, wide: true });
  const addApp = (id, i, n, fn) => {
    if (!APPS.some(a => a.id === id)) APPS.splice(Math.min(APPS.length, 13), 0, { id, i, n });
    Phone.apps[id] = () => { setTimeout(() => { Phone.app = null; UI.close(); fn(); }, 0); return ''; };
    if (typeof APP_GROUPS !== 'undefined') { const gr = APP_GROUPS.find(x => /สุขภาพ|บริการ/.test(x[0])) || APP_GROUPS[APP_GROUPS.length - 1]; if (gr && !gr[1].includes(id)) gr[1].unshift(id); }
  };
  addApp('health31', '🩺', 'สุขภาพ & รพ.', hubOpen);

  // ================= wiring into the existing game =================
  { // every old "you got sick" path now creates a named illness
    const _gs = Life2.getSick.bind(Life2);
    Life2.getSick = function (why) {
      _gs(why); try {
        const w = String(why || ''), se = season().id; const k = /ไข้เลือดออก|ยุง/.test(w) ? 'dengue' : /อดอาหาร|หิว|กระหาย|อาหาร/.test(w) ? 'food' : /แดด|ร้อน/.test(w) ? 'heat' : /ฝุ่น/.test(w) ? 'pm25' : /ฝน|เปียก|หนาว/.test(w) ? (Math.random() < 0.35 ? 'flu' : 'cold') : (se === 'cool' ? 'flu' : se === 'rain' ? 'cold' : 'throat');
        if (!active().length) startCond(k, w.slice(0, 40));
      } catch (e) { console.warn('v31h getSick', e); }
    };
  }
  { // before the old daily chain runs, a treated illness must not auto-escalate through Town2's 2-day rule
    const _nd = newDay; newDay = function () {
      try { const act = active(); if (act.length && S.sick && act.every(c => c.fx.rest || c.seenToday || c.tx > 0 || (c.fx.self || 0) > 0 || c.seen === S.day)) S.sickDays = 0; } catch (e) { }
      const r = _nd.apply(this, arguments);
      try { daily(); } catch (e) { console.warn('v31 health daily', e); }
      return r;
    };
  }
  if (window.Smart && Smart.hour) { const _sh = Smart.hour; Smart.hour = function () { const r = _sh.apply(this, arguments); try { hourly(); } catch (e) { console.warn('v31 health hourly', e); } return r; }; }
  window.Health31 = { open: hubOpen, H, A, COND, CHR, SURG, SPEC, MED, startCond, daily, hourly, forceAdmit, doSurgery, active, bill, hospPay, rightLine };
});
