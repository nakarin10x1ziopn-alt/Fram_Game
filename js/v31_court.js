'use strict';
// ---------- v31_court: law & courts. Civil / small-claims cases that start from real states in the game (loan arrears, unpaid bills and
// fines, a company that cannot pay its staff, a boundary dispute) or that the player files (consumer, contract, land, labour).
// Real procedure: summons -> answer -> court mediation -> hearing on a court working day -> judgment -> appeal (30 days) ->
// payment / enforcement. Lawyers (legal aid, ordinary, senior), evidence from the document wallet, witnesses (close friends).
// Phone app "⚖️ ศาล & คดีความ". State in S.v31c. ----------
V23.add('v31_court', () => {
  const YD = 84;                                       // a game year = 12 weeks
  const X = () => { const x = S.v31c = S.v31c || {}; x.cases = x.cases || []; x.hist = x.hist || []; x.n = x.n || 0; x.won = x.won || 0; x.lost = x.lost || 0; x.last = x.last || {}; x.spent = x.spent || 0; x.since = x.since || {}; return x; };
  const msg = (f, t, q) => { try { Phone.msg(f, t, q); } catch (e) { } };
  const hol = d => !!(window.Cal24 && Cal24.isHoliday && Cal24.isHoliday(d));
  const courtDay = d => ((d - 1) % 7) < 5 && !hol(d);
  const nextCourt = d => { d = Math.max(d, S.day + 1); for (let i = 0; i < 20 && !courtDay(d); i++) d++; return d; };
  const dtxt = d => RD(d);
  const pay = (n, label) => { n = Math.round(+n) || 0; if (n > 0 && S.money < n) { UI.toast(`เงินไม่พอ ต้องใช้ ${baht(n)}`, '💸'); return false; } if (n > 0) { S.money -= n; X().spent += n; try { Bank2.log(label, -n); } catch (e) { } } return true; };
  const gain = (n, src) => { n = Math.round(+n) || 0; if (n > 0) { earn(n); try { Bank2.income(src, n); } catch (e) { } } };
  const mood = n => { S.mood = Math.max(0, Math.min(100, (S.mood ?? 70) + n)); };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const has = id => !window.Gov24 || !!Gov24.has(id);
  const villagers = () => { try { return G.npcs.filter(n => !n.staff).map(n => n.name); } catch (e) { return []; } };
  const village = (d, why) => { try { if (window.Village31) Village31.rep(d, why); } catch (e) { } };
  const friendsAt = n => Object.keys(S.friends || {}).filter(k => Friends.get(k) >= n).sort((a, b) => Friends.get(b) - Friends.get(a));

  const T = {
    debt: { n: 'คดีผิดสัญญากู้ยืมเงิน', i: '🏦', base: 0.78 },
    bill: { n: 'คดีค่าสาธารณูปโภคค้างชำระ', i: '💡', base: 0.8 },
    fine: { n: 'คดีจราจร (ค่าปรับค้างชำระ)', i: '🚔', base: 0.65 },
    labour: { n: 'คดีแรงงาน (ค่าจ้างค้างจ่าย)', i: '👷', base: 0.65 },
    land: { n: 'คดีที่ดิน (รุกล้ำแนวเขต)', i: '🗺️', base: 0.5 },
    consumer: { n: 'คดีผู้บริโภค', i: '🛒', base: 0.55, free: 1 },
    contract: { n: 'คดีผิดสัญญา', i: '📑', base: 0.5 },
  };
  const LAW = [
    { n: 'ว่าความเอง', fee: 0, b: -0.04, d: 'ไม่มีค่าใช้จ่าย แต่เสียเปรียบเรื่องขั้นตอน' },
    { n: 'ทนายอาสา (ความช่วยเหลือทางกฎหมาย)', fee: 0, b: 0.05, d: 'ฟรี สำหรับผู้มีเงินไม่เกิน 50,000 ฿' },
    { n: 'ทนายความทั่วไป', fee: 15000, b: 0.11, d: 'ค่าจ้างเริ่มต้น 15,000 ฿ เพิ่มตามทุนทรัพย์' },
    { n: 'ทนายความอาวุโส/สำนักงานกฎหมาย', fee: 60000, b: 0.2, d: 'ค่าจ้างเริ่มต้น 60,000 ฿ เพิ่มตามทุนทรัพย์' },
  ];
  const lawFee = (c, tier) => tier < 2 ? 0 : Math.round(LAW[tier].fee * (1 + c.claim / 500000));
  const courtFee = c => T[c.t].free || c.role !== 'plaintiff' ? 0 : clamp(Math.round(c.claim * 0.02), 200, 200000);

  // ---------- evidence ----------
  function evItems(c) {
    const L = [], add = (k, n, w, have, note) => L.push({ k, n, w, have: !!have, note: note || '' });
    const ex = X();
    add('idcard', 'บัตรประชาชน', 0.02, has('idcard'));
    const logHas = re => { try { return (Bank2.st().log || []).some(l => re.test(l.t || '')); } catch (e) { return false; } };
    if (c.t === 'debt') add('rcpt', 'ใบเสร็จการชำระหนี้ครั้งก่อน', 0.07, logHas(/ชำระหนี้/));
    if (c.t === 'bill') add('rcpt', 'ใบเสร็จค่าไฟ/ค่าน้ำที่เคยชำระ', 0.06, logHas(/ค่าไฟ|ค่าน้ำ|ค่าสาธารณูปโภค/));
    if (c.t === 'fine') add('rcpt', 'ใบสั่ง + ภาพถ่ายที่เกิดเหตุ', 0.05, true);
    if (c.t === 'labour') { add('workcert', 'หนังสือรับรองการทำงาน', 0.1, has('workcert')); add('sso', 'ประวัติส่งเงินประกันสังคม', 0.06, has('ssoreg') || has('sso39')); add('payslip', 'สลิปเงินเดือน/บัญชีเงินเดือน', 0.05, S.job && S.job.k); }
    if (c.t === 'land') { add('deedcopy', 'สำเนาโฉนดที่ดิน (รับรอง)', 0.12, has('deedcopy')); add('housereg', 'ทะเบียนบ้าน', 0.04, has('housereg')); add('survey', 'ผลรังวัดที่ดิน (สำนักงานที่ดิน)', 0.1, ex.survey && ex.survey[c.id], 'ซื้อได้ในแท็บข้อมูล'); }
    if (c.t === 'consumer' || c.t === 'contract') { add('copy', 'สำเนาเอกสาร/ใบเสร็จรับรองสำเนาถูกต้อง', 0.04, ex.copy && ex.copy[c.id], 'ซื้อได้ในแท็บข้อมูล'); add('chat', 'ข้อความแชต/หลักฐานการสั่งซื้อ', 0.04, true); }
    const wit = friendsAt(4).slice(0, 2); wit.forEach((n, i) => add('w' + i, `พยานบุคคล: ${n}`, 0.05, true, 'เพื่อนสนิท 4 หัวใจขึ้นไป'));
    return L;
  }
  const evScore = c => { let s = 0; for (const e of evItems(c)) if (e.have && (c.ev || {})[e.k] !== false) s += e.w; return Math.min(0.22, s); };

  // ---------- creating cases ----------
  function openCase(o) {
    const x = X(), c = Object.assign({ id: ++x.n, filed: S.day, st: 'notice', law: 0, ev: {}, log: [], claim: 0, merit: clamp(T[o.t].base + rnd(-0.2, 0.2), 0.05, 0.95) }, o);
    x.cases.push(c); return c;
  }
  const active = () => X().cases;
  const logc = (c, t) => { c.log.push(`${dtxt(S.day)}: ${t}`); if (c.log.length > 14) c.log.shift(); };
  function sued(o) {
    if (active().length >= 5) return null;
    const c = openCase(Object.assign({ role: 'defendant', st: 'notice' }, o)); c.due = S.day + 15;
    logc(c, `ได้รับหมายเรียก — ต้องยื่นคำให้การภายใน 15 วัน (ถึง${RD(c.due)})`);
    msg('ศาลจังหวัดสุขใจ', `⚖️ หมายเรียกคดี ${T[c.t].n}: ${c.opp} ฟ้องเรียก ${baht(c.claim)} ตอบคำให้การภายใน${RD(c.due)} เปิดแอป "ศาล & คดีความ"`, false);
    try { UI.toast('ได้รับหมายเรียกจากศาล', '⚖️'); } catch (e) { }
    village(-2, 'ถูกฟ้องคดี');
    return c;
  }
  function file(t, opp, claim, extra) {
    if (active().length >= 5) { UI.toast('มีคดีค้างพร้อมกันได้ไม่เกิน 5 คดี', '⚖️'); return null; }
    if (!(window.Gov24 ? Gov24.need(['idcard'], 'ยื่นฟ้องคดี') : true)) return null;
    if (t === 'land' && !Gov24.need(['deedcopy'], 'ยื่นฟ้องคดีที่ดิน (ต้องมีสำเนาโฉนด)')) return null;
    const c = openCase(Object.assign({ t, role: 'plaintiff', opp, claim, st: 'mediation' }, extra || {}));
    const fee = courtFee(c); if (fee && S.money < fee) { UI.toast(`ค่าขึ้นศาล ${baht(fee)} (2% ของทุนทรัพย์) เงินไม่พอ`, '💸'); X().cases.pop(); X().n--; return null; }
    if (fee) pay(fee, 'ค่าขึ้นศาล'); c.fee = fee;
    c.due = nextCourt(S.day + 7); c.offer = Math.round(claim * rnd(0.55, 0.8));
    logc(c, `ยื่นฟ้อง ${T[t].n} เรียก ${baht(claim)}${fee ? ` · ค่าขึ้นศาล ${baht(fee)}` : ' · ไม่เสียค่าขึ้นศาล'} · นัดไกล่เกลี่ย${RD(c.due)}`);
    msg('ศาลจังหวัดสุขใจ', `รับฟ้องคดี ${T[t].n} ของคุณแล้ว นัดไกล่เกลี่ย ${dtxt(c.due)}`, false);
    return c;
  }

  // ---------- state transitions ----------
  function toHearing(c) {
    c.st = 'hearing'; c.hear = nextCourt(S.day + 14);
    logc(c, `ไกล่เกลี่ยไม่สำเร็จ ศาลนัดสืบพยาน ${dtxt(c.hear)} เวลา 09:00 น.`);
    msg('ศาลจังหวัดสุขใจ', `นัดสืบพยานคดี #${c.id} ${dtxt(c.hear)} 09:00 น. ผู้ว่าความเองต้องไปศาลวันนั้น (เวลาราชการ 08:30-16:00)`, false);
  }
  function close(c, how, outcome) {
    c.st = 'closed'; c.how = how; c.closed = S.day; c.outcome = outcome || '';
    const x = X(); x.cases = x.cases.filter(q => q !== c); x.hist.unshift({ id: c.id, t: c.t, role: c.role, opp: c.opp, claim: c.claim, how, outcome: c.outcome, day: S.day, title: c.title || '' }); x.hist.length = Math.min(30, x.hist.length);
  }
  function decide(c, appeal) {
    const s = c.role === 'plaintiff' ? c.merit : 1 - c.merit;
    let p = clamp(0.12 + s * 0.62 + evScore(c) + LAW[c.law].b * (appeal ? 0.5 : 1), 0.05, 0.95);
    if (appeal && c.v && c.v.won !== (s > 0.5)) p = clamp(p + 0.25, 0.05, 0.95);   // a verdict against the merits has a better chance on appeal
    const won = Math.random() < p, pct = won ? clamp(rnd(0.7, 1), 0.7, 1) : 0;
    const interest = c.role === 'defendant' && !won ? Math.round(c.claim * 0.05 * ((S.day - c.filed) / YD)) : 0;
    c.v = { won, pct, interest, p: Math.round(p * 100), day: S.day };
    const X_ = X(); won ? X_.won++ : X_.lost++;
    if (c.role === 'defendant') {
      if (won) { logc(c, 'ศาลยกฟ้อง คุณไม่ต้องชำระ'); msg('ศาลจังหวัดสุขใจ', `คดี #${c.id}: ศาลพิพากษายกฟ้อง 🎉`, false); village(1, 'ชนะคดี'); closeFine(c, true); close(c, 'ชนะ', 'ศาลยกฟ้อง'); return; }
      c.owed = Math.round(c.claim + interest + 3000); c.payBy = S.day + 30; c.st = 'verdict'; c.appealBy = S.day + 30;
      logc(c, `ศาลพิพากษาให้ชำระ ${baht(c.owed)} (ต้นเงิน ${baht(c.claim)} + ดอกเบี้ย ${baht(interest)} + ค่าฤชาธรรมเนียม 3,000) ภายใน 30 วัน`);
      msg('ศาลจังหวัดสุขใจ', `คดี #${c.id}: พิพากษาให้ชำระ ${baht(c.owed)} ภายใน${RD(c.payBy)} อุทธรณ์ได้ภายใน 30 วัน`, false);
      mood(-4);
    } else {
      if (!won) { logc(c, 'ศาลยกฟ้อง ค่าขึ้นศาลไม่ได้คืน'); msg('ศาลจังหวัดสุขใจ', `คดี #${c.id}: ศาลยกฟ้อง ค่าขึ้นศาลไม่ได้คืน`, false); c.st = 'verdict'; c.appealBy = S.day + 30; c.owed = 0; mood(-3); return; }
      c.award = Math.round(c.claim * pct) + (c.fee || 0); c.st = 'collect'; c.collectOn = S.day + Math.round(rnd(7, 14)); c.appealBy = 0;
      logc(c, `ศาลพิพากษาให้ชนะ ได้รับ ${baht(c.award)} (รวมค่าขึ้นศาลคืน) คาดว่าจะได้รับเงิน${RD(c.collectOn)}`);
      msg('ศาลจังหวัดสุขใจ', `คดี #${c.id}: คุณชนะคดี! ศาลสั่งให้ ${c.opp} ชำระ ${baht(c.award)}`, false); village(1, 'ชนะคดี'); mood(5);
    }
  }
  function closeFine(c, cancel) {
    if (c.t !== 'fine') return;
    try { const f = Gov24.st().fines.find(q => q.d === c.fineD && q.what === c.title); if (f && !f.paid) f.paid = cancel ? 'court' : S.day; } catch (e) { }
  }
  function enforceOn(c) {
    // seize the bank balance first, the rest becomes a bank debt (the same flow that blocks loans and the no-debt certificate)
    const take = Math.min(S.money, c.owed); if (take > 0) { S.money -= take; try { Bank2.log('อายัดเงินตามคำพิพากษา คดี #' + c.id, -take); } catch (e) { } }
    const rest = c.owed - take; if (rest > 0) { try { Bank2.st().debt += rest; Bank2.log('หนี้ตามคำพิพากษา คดี #' + c.id, 0); } catch (e) { } }
    closeFine(c, false);
    msg('กรมบังคับคดี', `บังคับคดี #${c.id}: อายัดเงิน ${baht(take)}${rest > 0 ? ` ส่วนที่เหลือ ${baht(rest)} ตั้งเป็นหนี้ธนาคาร` : ''}`, false);
    village(-3, 'ไม่ชำระตามคำพิพากษา'); mood(-6); close(c, 'แพ้', `ถูกบังคับคดี ${baht(c.owed)}`);
  }

  function daily() {
    const x = X(), d = S.day;
    for (const c of x.cases.slice()) {
      try {
        if (c.st === 'notice' && d > c.due) { c.law = c.law; c.v = { won: false, pct: 1, interest: 0, p: 0, day: d }; c.owed = Math.round(c.claim + c.claim * 0.05 * ((d - c.filed) / YD) + 3000); c.st = 'verdict'; c.payBy = d + 30; c.appealBy = d + 30; x.lost++; logc(c, `ไม่ยื่นคำให้การ ศาลพิพากษาให้แพ้โดยขาดนัด ต้องชำระ ${baht(c.owed)}`); msg('ศาลจังหวัดสุขใจ', `คดี #${c.id}: ขาดนัดยื่นคำให้การ ศาลพิพากษาให้ชำระ ${baht(c.owed)} ภายใน${RD(c.payBy)}`, false); village(-2, 'แพ้คดีโดยขาดนัด'); }
        else if (c.st === 'mediation' && d > c.due) { toHearing(c); }
        else if (c.st === 'hearing') {
          if (d === c.hear - 3) msg('ศาลจังหวัดสุขใจ', `เตือน: อีก 3 วันมีนัดสืบพยานคดี #${c.id} (${dtxt(c.hear)})`, true);
          if (d === c.hear) msg('ศาลจังหวัดสุขใจ', `วันนี้มีนัดสืบพยานคดี #${c.id} เวลา 09:00 น. ไปศาลก่อน 16:00 น.`, false);
          if (d > c.hear) {
            if (c.role === 'defendant') { c.v = { won: false, pct: 1, interest: 0, p: 0, day: d }; c.owed = Math.round(c.claim + 3000); c.st = 'verdict'; c.payBy = d + 30; c.appealBy = d + 30; x.lost++; logc(c, 'ขาดนัดพิจารณา ศาลพิพากษาให้แพ้โดยขาดนัด'); msg('ศาลจังหวัดสุขใจ', `คดี #${c.id}: ขาดนัดพิจารณา ศาลพิพากษาให้ชำระ ${baht(c.owed)} ภายใน${RD(c.payBy)}`, false); village(-2, 'ขาดนัดศาล'); }
            else { logc(c, 'ขาดนัดพิจารณา ศาลจำหน่ายคดี'); msg('ศาลจังหวัดสุขใจ', `คดี #${c.id}: ศาลจำหน่ายคดีเพราะคุณไม่ไปศาล ค่าขึ้นศาลไม่ได้คืน`, false); x.lost++; close(c, 'แพ้', 'ขาดนัด ศาลจำหน่ายคดี'); }
          }
        }
        else if (c.st === 'judgment' && d >= c.vday) decide(c, false);
        else if (c.st === 'appeal' && d >= c.ahear) { const r = c.v; decide(c, true); if (c.role === 'defendant' && c.v.won) { /* decide() already closed it */ } if (r && c.st === 'verdict') { c.appealBy = 0; if (c.role === 'defendant') c.payBy = S.day + 30; } }
        else if (c.st === 'verdict') {
          if (c.role === 'defendant' && c.owed > 0 && d > c.payBy) enforceOn(c);
          else if (c.role === 'defendant' && c.owed > 0 && d === c.payBy - 5) msg('ศาลจังหวัดสุขใจ', `เตือน: ครบกำหนดชำระตามคำพิพากษาคดี #${c.id} ในอีก 5 วัน (${baht(c.owed)}) ไม่ชำระจะถูกบังคับคดี`, true);
          else if (c.role === 'plaintiff' && d > c.appealBy) close(c, 'แพ้', 'ศาลยกฟ้อง');
        }
        else if (c.st === 'collect' && d >= c.collectOn) {
          const prob = c.scam ? 0.3 : c.enforced ? 0.9 : 0.75;
          if (Math.random() < prob) { gain(c.award, 'ชนะคดี ' + (c.title || T[c.t].n)); msg('ศาลจังหวัดสุขใจ', `ได้รับเงินตามคำพิพากษาคดี #${c.id} จำนวน ${baht(c.award)}`, false); close(c, 'ชนะ', `ได้รับ ${baht(c.award)}`); }
          else if (!c.enforced) { c.st = 'collectfail'; msg('กรมบังคับคดี', `คดี #${c.id}: ${c.opp} ไม่ชำระ ต้องยื่นบังคับคดี (ค่าธรรมเนียม 1% ${baht(Math.round(c.award * 0.01))}) ในแอป`, false); }
          else { close(c, 'ชนะ', 'บังคับคดีไม่ได้ผล (ไม่พบทรัพย์สิน)'); msg('กรมบังคับคดี', `คดี #${c.id}: ตรวจไม่พบทรัพย์สินของ ${c.opp} ที่จะบังคับได้`, false); }
        }
      } catch (e) { console.warn('v31 court daily', c && c.id, e); }
    }
    if (d % 3 === 0) triggers();
  }

  // ---------- triggers: real states in the game that lead to a lawsuit ----------
  function triggers() {
    const x = X(), d = S.day, L = x.last, open = t => x.cases.some(c => c.t === t);
    const ready = (k, gap) => d - (L[k] ?? -999) >= gap;
    try {   // loan well beyond the limit for a month: the bank sues
      const b = Bank2.st(), lim = Bank2.maxLoan() * 1.2;
      if (b.debt > lim) { x.since.debt = x.since.debt ?? d; if (d - x.since.debt >= 28 && ready('debt', 56) && !open('debt')) { L.debt = d; sued({ t: 'debt', opp: 'ธนาคารสุขใจ', claim: Math.round(b.debt), title: 'ผิดนัดชำระเงินกู้' }); x.since.debt = null; } } else x.since.debt = null;
    } catch (e) { }
    try {   // utilities unpaid for 4 weeks past the due date
      const bills = Gov24.st().bills.filter(q => !q.paid && d > q.due + 28);
      if (bills.length && ready('bill', 56) && !open('bill')) { L.bill = d; const sum = bills.reduce((s, q) => s + q.amt, 0); sued({ t: 'bill', opp: 'การไฟฟ้า/การประปาส่วนภูมิภาค', claim: Math.round(sum * 1.1), title: 'ค่าสาธารณูปโภคค้างชำระ', billRefs: bills.map(q => q.what) }); }
    } catch (e) { }
    try {   // a traffic fine left unpaid for 45 days past the due date goes to court
      const f = Gov24.st().fines.find(q => !q.paid && d > q.due + 45);
      if (f && ready('fine', 28) && !open('fine')) { L.fine = d; sued({ t: 'fine', opp: 'พนักงานอัยการ (คดีจราจร)', claim: f.amt, title: f.what, fineD: f.d }); }
    } catch (e) { }
    try {   // the company cannot pay its staff for 3 weeks
      const co = Company.list().find(c => (c.debtWeeks || 0) >= 3 && c.staff.length);
      if (co && ready('labour', 84) && !open('labour')) { L.labour = d; const sum = co.staff.reduce((s, q) => s + q.sal, 0); sued({ t: 'labour', opp: `พนักงานบริษัท ${co.name}`, claim: sum, title: 'ค่าจ้างค้างจ่าย', co: co.id }); }
    } catch (e) { }
    try {   // a neighbour says your fence is on his land
      let owns = 0; try { owns = Object.keys(Estate.st().own).length + Object.values((S.hb || {}).lots || {}).filter(l => l && l.stage >= 3).length; } catch (e) { }
      if (owns && ready('land', 84) && !open('land') && Math.random() < 0.06) { const v = villagers(); if (v.length) { L.land = d; sued({ t: 'land', opp: pick(v), claim: Math.round(rnd(40000, 120000) / 1000) * 1000, title: 'ถูกกล่าวหาว่ารุกล้ำแนวเขต' }); } }
    } catch (e) { }
  }

  // ---------- phone app ----------
  const hub = { tab: 0, cur: 0 };
  const B = (act, label, o) => `<button class="btn ${o && o.ghost ? 'ghost' : ''}" data-a="v31c" data-v="${esc(act)}"${o && o.dis ? ' disabled' : ''}>${label}</button>`;
  const C = (i, h, p, btns) => `<div class="card"><div class="ci">${i}</div><div class="cb"><h4>${h}</h4><p class="dim">${p}</p>${btns ? `<div class="row">${btns}</div>` : ''}</div></div>`;
  const STN = { notice: 'รอยื่นคำให้การ', mediation: 'รอไกล่เกลี่ย', hearing: 'รอนัดสืบพยาน', judgment: 'รอฟังคำพิพากษา', verdict: 'มีคำพิพากษาแล้ว', appeal: 'อยู่ระหว่างอุทธรณ์', collect: 'รอรับเงินตามคำพิพากษา', collectfail: 'ต้องยื่นบังคับคดี' };
  const caseCard = c => `<div class="card"><div class="ci">${T[c.t].i}</div><div class="cb"><h4>#${c.id} ${T[c.t].n}${c.title ? ' · ' + esc(c.title) : ''}</h4><p class="dim">${c.role === 'plaintiff' ? 'คุณเป็นโจทก์' : 'คุณเป็นจำเลย'} · ${esc(c.opp)} · ทุนทรัพย์ ${baht(c.claim)} · <b>${STN[c.st]}</b>${c.st === 'hearing' ? ` ${dtxt(c.hear)}` : ''}${c.st === 'mediation' || c.st === 'notice' ? ` ภายใน ${dtxt(c.due)}` : ''}${c.st === 'judgment' ? ` ${dtxt(c.vday)}` : ''}</p><div class="row">${B('view|' + c.id, 'เปิดคดี')}</div></div></div>`;
  function caseView(c) {
    const ev = evItems(c), sc = Math.round(evScore(c) * 100);
    let h = `<div class="row">${B('back', '‹ กลับ', { ghost: 1 })}</div><h5>${T[c.t].i} คดี #${c.id} ${T[c.t].n}</h5><p class="lead">${c.role === 'plaintiff' ? 'โจทก์ (คุณ)' : 'จำเลย (คุณ)'} ↔ ${esc(c.opp)} · ทุนทรัพย์ ${baht(c.claim)} · สถานะ: ${STN[c.st]}</p>`;
    h += `<p class="dim">ทนายความ: ${LAW[c.law].n} · น้ำหนักหลักฐานที่นำเสนอ +${sc}%</p>`;
    const st = c.st, btns = [];
    if (st === 'notice') btns.push(B('answer|' + c.id, '📝 ยื่นคำให้การ (ปฏิเสธ/ต่อสู้คดี)'), B('plead|' + c.id, `🤝 ยอมรับ ชำระ ${baht(c.claim)} ทันที`, { ghost: 1 }));
    if (st === 'mediation') btns.push(B('settle|' + c.id, c.role === 'plaintiff' ? `🤝 รับข้อเสนอไกล่เกลี่ย ${baht(c.offer)}` : `🤝 ตกลงไกล่เกลี่ย ชำระ ${baht(Math.round(c.claim * 0.65))}`), B('nosettle|' + c.id, '⚖️ ไม่ตกลง ขอสืบพยาน', { ghost: 1 }));
    if (st === 'hearing') btns.push(B('attend|' + c.id, `🚕 ไปศาลวันนัด (${baht(139)} + เสียเวลา 4 ชม.)`, { dis: S.day !== c.hear }));
    if (st === 'verdict' && c.role === 'defendant' && c.owed > 0) btns.push(B('payv|' + c.id, `💳 ชำระตามคำพิพากษา ${baht(c.owed)}`), B('inst|' + c.id, '📆 ขอผ่อนชำระ 3 งวด (+5%)', { ghost: 1 }));
    if (st === 'verdict' && !c.appealed && S.day <= c.appealBy) btns.push(B('appeal|' + c.id, `📣 อุทธรณ์ (ค่าธรรมเนียม ${baht(Math.max(1000, Math.round(c.claim * 0.02)))}${c.law >= 2 ? ' + ค่าทนายเพิ่ม 50%' : ''})`, { ghost: 1 }));
    if (st === 'verdict' && c.role === 'plaintiff') btns.push(B('closev|' + c.id, 'รับทราบ ปิดคดี', { ghost: 1 }));
    if (st === 'collectfail') btns.push(B('enf|' + c.id, `🏛️ ยื่นบังคับคดี (${baht(Math.round(c.award * 0.01))})`));
    if (btns.length) h += `<div class="row">${btns.join('')}</div>`;
    if (['notice', 'mediation', 'hearing', 'judgment'].includes(st)) {
      h += `<h5>ทนายความ</h5><div class="grid">${LAW.map((l, i) => C(i === c.law ? '✅' : '👔', l.n, `${l.d} · ค่าจ้าง ${i < 2 ? 'ไม่มี' : baht(lawFee(c, i))}`, B('hire|' + c.id + '|' + i, i === c.law ? 'ใช้อยู่' : 'ใช้บริการ', { dis: i === c.law || (i === 1 && S.money > 50000) }))).join('')}</div>`;
      h += `<h5>หลักฐานที่จะนำเสนอ</h5><div class="grid">${ev.map(e => C(e.have ? ((c.ev || {})[e.k] === false ? '⬜' : '☑️') : '❌', e.n, `${e.have ? 'มีอยู่' : 'ยังไม่มี ' + e.note} · น้ำหนัก +${Math.round(e.w * 100)}%`, e.have ? B('tog|' + c.id + '|' + e.k, 'เลือก/ไม่เลือก', { ghost: 1 }) : '')).join('')}</div>`;
    }
    h += `<h5>บันทึกคดี</h5><ul>${c.log.map(l => `<li>${esc(l)}</li>`).join('')}</ul>`;
    return h;
  }
  function render(t) {
    hub.tab = t; const x = X();
    if (hub.cur) { const c = x.cases.find(q => q.id === hub.cur); if (c) return caseView(c); hub.cur = 0; }
    if (t === 0) {
      let h = `<p class="lead">⚖️ ศาลจังหวัดสุขใจ เปิดทำการ จันทร์-ศุกร์ 08:00-18:00 (ปิดเสาร์-อาทิตย์และวันหยุดราชการ) · คดีที่คุณถูกฟ้องจะเกิดจากสถานะจริงในเกม เช่น เป็นหนี้เกินวงเงิน ค้างค่าสาธารณูปโภค ค้างค่าปรับ บริษัทจ่ายเงินเดือนไม่ได้ หรือข้อพิพาทที่ดิน</p>`;
      h += x.cases.length ? `<div class="grid">${x.cases.map(caseCard).join('')}</div>` : `<p class="empty">ตอนนี้ไม่มีคดีความ</p>`;
      h += `<h5>คดีที่ผ่านมา (ชนะ ${x.won} · แพ้ ${x.lost})</h5>${x.hist.length ? `<ul>${x.hist.slice(0, 10).map(q => `<li>#${q.id} ${T[q.t].i} ${T[q.t].n} · ${q.role === 'plaintiff' ? 'โจทก์' : 'จำเลย'} · ${baht(q.claim)} · <b>${q.how}</b> ${esc(q.outcome)} (${RD(q.day)})</li>`).join('')}</ul>` : '<p class="dim">ยังไม่มีประวัติ</p>'}`;
      return h;
    }
    if (t === 1) {
      const emp = S.job && S.job.k, owns = (() => { try { return Object.keys(Estate.st().own).length + Object.values((S.hb || {}).lots || {}).filter(l => l && l.stage >= 3).length; } catch (e) { return 0; } })();
      const sal = emp ? (() => { try { return Career.salary(); } catch (e) { return 12000; } })() : 0, lost = ((S.v26l || {}).pp || {}).lost || 0;
      let h = `<p class="lead">ยื่นฟ้องเป็นโจทก์ · ต้องมีบัตรประชาชน · ค่าขึ้นศาล 2% ของทุนทรัพย์ (ขั้นต่ำ 200 ฿ สูงสุด 200,000 ฿) · คดีผู้บริโภคไม่เสียค่าขึ้นศาล · ศาลจะนัดไกล่เกลี่ยก่อนเสมอ</p><div class="grid">`;
      h += C('🛒', 'ฟ้องร้านค้า/ผู้ขายออนไลน์ (ผู้บริโภค)', 'สินค้าไม่ตรงปก/ไม่ส่งของ ไม่เสียค่าขึ้นศาล', [3000, 10000, 30000].map(v => B('fc|consumer|' + v, baht(v), { ghost: 1 })).join(''));
      if (lost > 0) h += C('📵', 'ฟ้องมิจฉาชีพที่หลอกโอนเงิน', `ความเสียหายที่ผ่านมา ${baht(lost)} · โอกาสได้เงินคืนต่ำ (ไม่รู้ตัวตน/ทรัพย์สิน)`, B('fc|scam|' + lost, 'ยื่นฟ้อง', { ghost: 1 }));
      h += C('📑', 'ฟ้องผิดสัญญา (เพื่อนบ้าน/คู่ค้า)', 'ผิดสัญญาซื้อขายหรือค้างชำระ', [10000, 50000, 150000].map(v => B('fc|contract|' + v, baht(v), { ghost: 1 })).join(''));
      h += C('🗺️', 'ฟ้องเพื่อนบ้านรุกล้ำที่ดิน', owns ? 'ต้องมีสำเนาโฉนดที่ดิน (รับรอง) · ซื้อผลรังวัดช่วยได้มาก' : 'ต้องมีที่ดิน/บ้านของตัวเองก่อน', owns ? [30000, 80000].map(v => B('fc|land|' + v, baht(v), { ghost: 1 })).join('') : '');
      h += C('👷', 'ฟ้องนายจ้างค้างจ่ายค่าจ้าง', emp ? `ลูกจ้าง ${esc(S.job.n || S.job.k)} · เรียกค่าจ้างค้างจ่าย` : 'ต้องมีงานประจำก่อน', emp ? [1, 2].map(m => B('fc|labour|' + sal * m, `${m} เดือน ${baht(sal * m)}`, { ghost: 1 })).join('') : '');
      return h + '</div>';
    }
    return `<p class="lead">ข้อมูลและบริการประกอบการดำเนินคดี</p><div class="grid">`
      + C('🖨️', 'รับรองสำเนาเอกสาร', 'ค่ารับรองสำเนาถูกต้อง 100 ฿ ต่อคดี เพิ่มน้ำหนักหลักฐานคดีผู้บริโภค/ผิดสัญญา +4%', x.cases.filter(c => ['consumer', 'contract'].includes(c.t) && !(x.copy || {})[c.id]).map(c => B('copy|' + c.id, `คดี #${c.id}`, { ghost: 1 })).join('') || '<span class="dim">ไม่มีคดีที่ต้องใช้</span>')
      + C('📐', 'ขอรังวัดที่ดิน (สำนักงานที่ดิน)', 'ค่ารังวัด 3,500 ฿ ต้องมีบัตรประชาชน เพิ่มน้ำหนักหลักฐานคดีที่ดิน +10%', x.cases.filter(c => c.t === 'land' && !(x.survey || {})[c.id]).map(c => B('survey|' + c.id, `คดี #${c.id}`, { ghost: 1 })).join('') || '<span class="dim">ไม่มีคดีที่ดิน</span>')
      + C('🧾', 'สถิติ', `ค่าใช้จ่ายทางคดีสะสม ${baht(x.spent)} · ชนะ ${x.won} · แพ้ ${x.lost}`, '')
      + `</div><h5>ขั้นตอนศาล</h5><ul><li>หมายเรียก → ยื่นคำให้การภายใน 15 วัน (ไม่ยื่น = แพ้โดยขาดนัด)</li><li>ไกล่เกลี่ยก่อนสืบพยาน ตกลงได้เร็วกว่าและถูกกว่า</li><li>นัดสืบพยานวันทำการ ต้องไปศาลเอง ขาดนัด = แพ้/ถูกจำหน่ายคดี</li><li>คำพิพากษา → อุทธรณ์ได้ภายใน 30 วัน (ครั้งเดียว) → ชำระภายใน 30 วัน ไม่ชำระ = อายัดเงินและตั้งเป็นหนี้</li><li>ชนะคดีแล้วลูกหนี้อาจไม่จ่าย ต้องยื่นบังคับคดี</li></ul>`;
  }
  const A = {};
  const byId = id => X().cases.find(c => c.id === +id);
  const reopen = () => { try { UI.renderBody(); } catch (e) { } };
  A.view = id => { hub.cur = +id; }; A.back = () => { hub.cur = 0; };
  A.answer = id => { const c = byId(id); if (!c || c.st !== 'notice') return; c.st = 'mediation'; c.due = nextCourt(S.day + 7); c.offer = Math.round(c.claim * 0.65); logc(c, `ยื่นคำให้การปฏิเสธ ศาลนัดไกล่เกลี่ย ${dtxt(c.due)}`); UI.toast('ยื่นคำให้การแล้ว', '📝'); };
  A.plead = id => { const c = byId(id); if (!c || c.st !== 'notice') return; const amt = c.t === 'fine' ? c.claim + 200 : c.claim; if (!pay(amt, 'ชำระตามฟ้อง คดี #' + c.id)) return; closeFine(c, false); village(0, ''); logc(c, `ยอมรับและชำระ ${baht(amt)}`); close(c, 'ยอมความ', `ชำระ ${baht(amt)}`); UI.toast('ชำระและปิดคดีแล้ว', '🤝'); };
  A.settle = id => { const c = byId(id); if (!c || c.st !== 'mediation') return; if (c.role === 'plaintiff') { gain(c.offer, 'ไกล่เกลี่ยคดี #' + c.id); logc(c, `ไกล่เกลี่ยสำเร็จ ได้รับ ${baht(c.offer)}`); close(c, 'ยอมความ', `ได้รับ ${baht(c.offer)}`); UI.toast(`ไกล่เกลี่ยสำเร็จ ได้รับ ${baht(c.offer)}`, '🤝'); } else { const amt = Math.round(c.claim * 0.65); if (!pay(amt, 'ไกล่เกลี่ยคดี #' + c.id)) return; closeFine(c, false); logc(c, `ไกล่เกลี่ยสำเร็จ ชำระ ${baht(amt)}`); close(c, 'ยอมความ', `ชำระ ${baht(amt)}`); UI.toast('ไกล่เกลี่ยสำเร็จ', '🤝'); } };
  A.nosettle = id => { const c = byId(id); if (!c || c.st !== 'mediation') return; toHearing(c); };
  A.hire = (id, i) => { const c = byId(id); i = +i; if (!c || !LAW[i] || i === c.law) return; if (i === 1 && S.money > 50000) { UI.toast('ทนายอาสาสำหรับผู้มีเงินไม่เกิน 50,000 ฿', '⚖️'); return; } const f = lawFee(c, i); if (!pay(f, 'ค่าทนายความ คดี #' + c.id)) return; c.law = i; logc(c, `ใช้บริการ ${LAW[i].n}${f ? ' ค่าจ้าง ' + baht(f) : ''}`); };
  A.tog = (id, k) => { const c = byId(id); if (!c) return; c.ev = c.ev || {}; c.ev[k] = c.ev[k] === false ? true : false; };
  A.attend = id => {
    const c = byId(id); if (!c || c.st !== 'hearing') return;
    if (S.day !== c.hear) { UI.toast('ยังไม่ถึงวันนัด', '⚖️'); return; }
    if (window.Hours36 ? !Hours36.open('court') : (S.time < 8.5 * 60 || S.time > 16 * 60)) { UI.toast('ศาลเปิด 08:00-18:00 น. ในวันนัด', '⚖️'); return; }
    if (!pay(139, 'ค่าแท็กซี่ไปศาล')) return;
    UI.close(); fade(() => { try { tick(240); } catch (e) { } c.st = 'judgment'; c.vday = nextCourt(S.day + 7); logc(c, `ไปศาลสืบพยาน นำเสนอหลักฐาน +${Math.round(evScore(c) * 100)}% ศาลนัดฟังคำพิพากษา ${dtxt(c.vday)}`); msg('ศาลจังหวัดสุขใจ', `คดี #${c.id}: เสร็จการสืบพยาน นัดฟังคำพิพากษา ${dtxt(c.vday)}`, false); mood(-2); saveGame(true); setTimeout(() => open(), 650); });
  };
  A.payv = id => { const c = byId(id); if (!c || c.st !== 'verdict' || !(c.owed > 0)) return; if (!pay(c.owed, 'ชำระตามคำพิพากษา คดี #' + c.id)) return; closeFine(c, false); logc(c, `ชำระตามคำพิพากษา ${baht(c.owed)}`); close(c, 'แพ้', `ชำระ ${baht(c.owed)}`); UI.toast('ชำระตามคำพิพากษาแล้ว', '💳'); hub.cur = 0; };
  A.inst = id => { const c = byId(id); if (!c || c.st !== 'verdict' || !(c.owed > 0) || c.instal) return; const part = Math.round(c.owed * 1.05 / 3); if (!pay(part, 'ผ่อนชำระตามคำพิพากษา งวด 1')) return; c.instal = 1; c.owed = part * 2; c.payBy = S.day + 56; logc(c, `ขอผ่อน 3 งวด ชำระงวดแรก ${baht(part)} เหลือ ${baht(c.owed)} ภายใน${RD(c.payBy)}`); UI.toast('ผ่อนชำระงวดแรกแล้ว', '📆'); };
  A.appeal = id => { const c = byId(id); if (!c || c.st !== 'verdict' || c.appealed || S.day > c.appealBy) return; const f = Math.max(1000, Math.round(c.claim * 0.02)) + (c.law >= 2 ? Math.round(lawFee(c, c.law) * 0.5) : 0); if (!pay(f, 'ค่าธรรมเนียมอุทธรณ์ คดี #' + c.id)) return; c.appealed = 1; c.st = 'appeal'; c.ahear = nextCourt(S.day + 21); logc(c, `ยื่นอุทธรณ์ ศาลอุทธรณ์พิจารณา ${dtxt(c.ahear)}`); UI.toast('ยื่นอุทธรณ์แล้ว', '📣'); };
  A.closev = id => { const c = byId(id); if (c) close(c, 'แพ้', 'ศาลยกฟ้อง'); hub.cur = 0; };
  A.enf = id => { const c = byId(id); if (!c || c.st !== 'collectfail') return; if (!pay(Math.round(c.award * 0.01), 'ค่าธรรมเนียมบังคับคดี')) return; c.enforced = 1; c.st = 'collect'; c.collectOn = S.day + 14; logc(c, 'ยื่นบังคับคดี คาดว่าจะได้รับเงินภายใน 14 วัน'); UI.toast('ยื่นบังคับคดีแล้ว', '🏛️'); };
  A.copy = id => { const c = byId(id); if (!c || !pay(100, 'รับรองสำเนาเอกสาร')) return; const x = X(); (x.copy = x.copy || {})[c.id] = 1; UI.toast('รับรองสำเนาแล้ว', '🖨️'); };
  A.survey = id => { const c = byId(id); if (!c) return; if (window.Gov24 && !Gov24.need(['idcard'], 'ขอรังวัดที่ดิน')) return; if (!pay(3500, 'ค่ารังวัดที่ดิน')) return; const x = X(); (x.survey = x.survey || {})[c.id] = 1; c.merit = clamp(c.role === 'plaintiff' ? c.merit + 0.08 : c.merit - 0.08, 0.05, 0.95); UI.toast('ได้ผลรังวัดแล้ว', '📐'); };
  A.fc = (t, v) => {
    v = +v; let c = null;
    if (t === 'consumer') c = file('consumer', pick(['ร้านค้าออนไลน์ "ของถูกดี"', 'ร้านขายเฟอร์นิเจอร์ริมทาง', 'ผู้ขายรถมือสองในตลาดนัด']), v, { title: 'สินค้าไม่ตรงปก/ไม่ส่งสินค้า' });
    else if (t === 'scam') { c = file('consumer', 'ผู้ไม่ทราบชื่อ (แก๊งมิจฉาชีพ)', v, { title: 'ถูกหลอกโอนเงิน', scam: 1 }); if (c) c.merit = 0.7; }
    else if (t === 'contract') { const n = villagers(); c = file('contract', n.length ? pick(n) : 'คู่ค้า', v, { title: 'ผิดสัญญาซื้อขาย' }); }
    else if (t === 'land') { const n = villagers(); c = file('land', n.length ? pick(n) : 'เพื่อนบ้าน', v, { title: 'เพื่อนบ้านรุกล้ำแนวเขต' }); }
    else if (t === 'labour') c = file('labour', S.job && (S.job.n || S.job.k) ? `นายจ้าง (${S.job.n || S.job.k})` : 'นายจ้าง', v, { title: 'ค่าจ้างค้างจ่าย' });
    if (c) { hub.cur = c.id; hub.tab = 0; UI.toast(`ยื่นฟ้องคดี #${c.id} แล้ว`, '⚖️'); }
  };
  UI.H.v31c = d => { const [k, ...r] = String(d.v || '').split('|'); const f = A[k]; if (f) { try { f(...r); } catch (e) { if (e && e.spend173) throw e; console.warn('v31c', k, e); } } reopen(); };
  const TABS = ['⚖️ คดีของฉัน', '📝 ยื่นฟ้อง', '📚 ข้อมูล & บริการ'];
  const open = () => UI.open('⚖️ ศาล & คดีความ', TABS, render, { tab: hub.tab, wide: true });
  { const id = 'court31', i = '⚖️', n = 'ศาล & คดีความ';
    if (!APPS.some(a => a.id === id)) APPS.splice(Math.min(APPS.length, 13), 0, { id, i, n });
    Phone.apps[id] = () => { setTimeout(() => { Phone.app = null; UI.close(); open(); }, 0); return ''; };
    if (typeof APP_GROUPS !== 'undefined') { const gr = APP_GROUPS.find(x => /บริการ/.test(x[0])) || APP_GROUPS[APP_GROUPS.length - 1]; if (gr && !gr[1].includes(id)) gr[1].unshift(id); } }
  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { daily(); } catch (e) { console.warn('v31 court daily', e); } return r; }; }
  window.Court31 = { open, X, sued, file, active, T, LAW, evScore, daily, A };
});
