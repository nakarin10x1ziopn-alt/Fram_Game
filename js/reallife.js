'use strict';
// ---------- Everyday life in Thailand today: 16 events that come and go — PM2.5 haze, fuel price changes, call-centre scams,
// dengue season, drink-driving checkpoints, fake COD parcels, electricity Ft changes, 11.11 sales, stray dogs, flooded roads,
// the government lottery (1st and 16th), minimum-wage rises, farm tourists, an influencer review, inflation and land tax ----------
const RL = {
  st() { if (!S.rl) S.rl = { fuel: 1, cpi: 1, active: {}, log: [], lot: [], wage: 1 }; return S.rl; },
  on(k) { const a = this.st().active[k]; return a && a.until >= S.day ? a : null; },
  start(k, days, msg, icon, extra) { this.st().active[k] = Object.assign({ until: S.day + days - 1 }, extra || {}); this.log(icon + ' ' + msg); Phone.msg('ข่าว & เหตุการณ์', msg, true); },
  log(t) { const L = this.st().log; L.unshift(`${RD(S.day)}: ${t}`); L.length = Math.min(L.length, 20); },
  // ----- the daily roll -----
  day() {
    const s = this.st(), se = season().id, dIdx = (S.day - 1) % 7, r = () => Math.random();
    for (const k in s.active) if (s.active[k].until < S.day) delete s.active[k];
    if (!this.on('pm25') && se !== 'rain' && r() < 0.18) this.start('pm25', 2 + (r() * 3 | 0), `ค่าฝุ่น PM2.5 เกินมาตรฐาน (${110 + (r() * 90 | 0)} มคก./ลบ.ม.) ทำงานกลางแจ้งเหนื่อยขึ้น ควรใส่หน้ากาก N95 หรือเปิดเครื่องฟอกอากาศ`, '😷');
    if (dIdx === 0) { const ch = Math.round((r() - 0.45) * 8) / 100; s.fuel = U.clamp(s.fuel + ch, 0.8, 1.4); if (ch) this.log(`⛽ ราคาน้ำมัน${ch > 0 ? 'ขึ้น' : 'ลง'} ${Math.abs(ch * 100)}% (ตอนนี้ ×${s.fuel.toFixed(2)})`); }
    if (r() < 0.06) this.scam();
    if (se === 'rain' && !this.on('dengue') && r() < 0.15) this.start('dengue', 4, 'สาธารณสุขเตือนไข้เลือดออกระบาด คว่ำภาชนะ เทน้ำขัง กำจัดลูกน้ำยุงลาย', '🦟');
    if (r() < 0.05 && !this.on('cod')) this.start('cod', 1, 'มีพัสดุเก็บเงินปลายทาง 790 ฿ มาส่ง แต่คุณจำไม่ได้ว่าสั่งอะไร...', '📦');
    if (dIdx === 2 && r() < 0.15) { const d = Math.round((r() - 0.4) * 10) / 100; TARIFF.ft = U.clamp(+(TARIFF.ft + d).toFixed(4), 0.2, 0.9); this.log(`⚡ กกพ. ปรับค่า Ft เป็น ${TARIFF.ft} บาท/หน่วย`); Phone.msg('การไฟฟ้า', `ประกาศปรับค่าไฟฟ้าผันแปร (Ft) เป็น ${TARIFF.ft} บาท/หน่วย มีผลรอบบิลถัดไป`, false); }
    const yd = (S.day - 1) % 84; if (yd === 76 || yd === 83) this.start('sale', 1, `${yd === 76 ? '11.11' : '12.12'} มหกรรมลดราคา ช้อปออนไลน์ลด 30% วันนี้วันเดียว!`, '🛍️');
    if (S.animals.length && r() < 0.05 && !this.on('dog')) this.start('dog', 1, 'หมาจรหลงเข้ามาในไร่ ไล่กวดไก่จนตื่นตกใจ', '🐕');
    if (WEATHER[S.weather.type].rain > 0.5 && r() < 0.35) this.start('flood', 1, 'ฝนตกหนัก น้ำรอระบายบนถนนหมู่บ้าน รถวิ่งได้ช้า ระวังเครื่องดับ', '🌊');
    if (dIdx === 0 || dIdx === 3) this.lotteryDraw();
    if (yd % 21 === 20 && r() < 0.5) { s.wage = +(s.wage * 1.04).toFixed(3); for (const c of Company.list()) for (const st of c.staff) st.sal = Math.round(st.sal * 1.04); this.log('💼 คณะกรรมการค่าจ้างประกาศปรับค่าแรงขั้นต่ำ +4% เงินเดือนพนักงานบริษัทปรับขึ้นตาม'); Phone.msg('ข่าวเศรษฐกิจ', 'ปรับค่าแรงขั้นต่ำขึ้น 4% บริษัทต้องปรับเงินเดือนพนักงานตาม', true); }
    if ((dIdx === 5 || dIdx === 6) && r() < 0.3 && S.farm) { const n = 8 + (r() * 25 | 0), fee = n * 80; earn(fee); Bank2.income('รายได้เกษตรท่องเที่ยว', fee); this.start('tour', 1, `รถทัวร์นักท่องเที่ยว ${n} คนแวะชม${S.farm} จ่ายค่าเข้าชม ${baht(fee)} วันนี้ของที่แผงหน้าไร่ขายได้แพงขึ้น 50%`, '🚌'); }
    if (r() < 0.02 && !this.on('viral')) { this.start('viral', 3, `อินฟลูเอนเซอร์รีวิว${S.farm || 'ไร่ของคุณ'}จนเป็นไวรัล! 3 วันนี้คนแห่มาซื้อของ ขายได้ +30%`, '📱'); }
    if (dIdx === 0) { s.cpi = +(s.cpi * (1 + 0.002 + r() * 0.004)).toFixed(4); }
    if (yd === 40) this.landTax();
  },
  // ----- choices -----
  scam() { this.st().scam = { day: S.day, amt: 5000 + (Math.random() * 45000 | 0) }; Phone.msg('เบอร์ไม่รู้จัก 02-xxx-xxxx', 'เจ้าหน้าที่ DSI แจ้งว่าบัญชีของคุณพัวพันการฟอกเงิน ต้องโอนเงินมาตรวจสอบด่วน ไม่งั้นจะถูกจับ!', true); },
  act(k) {
    const s = this.st();
    if (k === 'scamPay') { const a = s.scam; if (!a) return; S.money = Math.max(0, S.money - a.amt); s.scam = null; this.log(`🚨 โดนแก๊งคอลเซ็นเตอร์หลอก เสียเงิน ${baht(a.amt)}`); UI.toast(`โดนหลอกแล้ว! เสีย ${baht(a.amt)} — หน่วยงานจริงไม่ให้โอนเงินทางโทรศัพท์`, '😭'); }
    if (k === 'scamReport') { if (!s.scam) return; s.scam = null; earn(500); this.log('🛡️ วางสายแล้วแจ้ง 1441 ช่วยตำรวจปิดบัญชีม้าได้'); UI.toast('วางสายแล้วแจ้งสายด่วน 1441 ตำรวจปิดบัญชีม้าได้ ได้รางวัลนำจับ 500 ฿', '🛡️'); }
    if (k === 'codPay') { if (!this.on('cod')) return; S.money = Math.max(0, S.money - 790); delete s.active.cod; UI.toast('แกะกล่องเจอแต่ถุงทราย... โดนมิจฉาชีพส่งของไม่ได้สั่ง', '📦'); }
    if (k === 'codRefuse') { if (!this.on('cod')) return; delete s.active.cod; UI.toast('ปฏิเสธรับพัสดุที่ไม่ได้สั่ง ถูกต้องแล้ว', '👍'); }
    if (k === 'dengue') { if (!this.on('dengue') || s.dengueDone === S.day || !useEnergy(8)) return; s.dengueDone = S.day; s.dengueSafe = S.day + 7; UI.toast('คว่ำภาชนะ เทน้ำขังรอบบ้าน ปลอดยุงลาย 7 วัน', '🦟'); }
    if (k === 'mask') { if (S.money < 350) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(350), '💸'); return; } S.money -= 350; addItem('n95', 5); UI.toast('ซื้อหน้ากาก N95 5 ชิ้น', '😷'); }
    if (k === 'dogAdopt') { if (!this.on('dog')) return; delete s.active.dog; const L = Pets2.list(); if (L.length >= 5) { UI.toast('มีสัตว์เลี้ยงครบ 5 ตัวแล้ว', '🐕'); return; } L.push({ type: 'dog', name: 'จ๊อด (หมาจร)', spd: 1, beauty: 0, joy: 70, wins: 0 }); UI.toast('รับหมาจรมาเลี้ยงแล้ว ฉีดวัคซีนเรียบร้อย', '🐕'); }
    if (k === 'dogCall') { if (!this.on('dog')) return; delete s.active.dog; UI.toast('ปศุสัตว์อำเภอมารับไปทำหมันและหาบ้านใหม่', '🚐'); }
    if (k === 'lot') { if (S.money < 80 || s.lot.length >= 10) return; S.money -= 80; s.lot.push(String(Math.random() * 1e6 | 0).padStart(6, '0')); UI.toast('ซื้อลอตเตอรี่ 80 ฿ (ราคาควบคุม)', '🎫'); }
  },
  // the government lottery: real prize ladder and odds (first prize 6 million)
  lotteryDraw() {
    const s = this.st();
    const win = String(Math.random() * 1e6 | 0).padStart(6, '0'), l2 = String(Math.random() * 100 | 0).padStart(2, '0'), f3 = String(Math.random() * 1000 | 0).padStart(3, '0');
    let total = 0; const res = [];
    for (const t of s.lot) { let p = 0; if (t === win) p = 6000000; else if (t.slice(-3) === f3) p = 4000; else if (t.slice(-2) === l2) p = 2000; if (p) { total += p; res.push(`${t} ถูก ${baht(p)}`); } }
    s.lastDraw = { day: S.day, win, l2, f3, held: s.lot.slice(), res, total };
    if (!s.lot.length) return;
    Phone.msg('สลากกินแบ่งรัฐบาล', `ผลรางวัลที่ 1: ${win} · เลขท้าย 3 ตัว: ${f3} · เลขท้าย 2 ตัว: ${l2} — ${res.length ? 'ยินดีด้วย! ' + res.join(', ') : 'สลากของคุณไม่ถูกรางวัล'}`, true);
    if (total) { earn(total); Bank2.income('ถูกลอตเตอรี่', total); this.log(`🎫 ถูกลอตเตอรี่ ${baht(total)}`); } s.lot = [];
  },
  landTax() {
    return;   // v182: land tax is billed once a year by the tax office (v24_gov): farmland and the main home are exempt
    const lots = Object.keys((S.hb || {}).lots || {}).length, fields = Object.keys(S.fields || {}).length, val = 600000 + lots * 300000 + fields * 120000;
    const tax = Math.round(val * 0.0003 + lots * 300000 * 0.003 * (lots > 0 ? 1 : 0)); if (!tax) return;
    if (S.gov24 && S.gov24.bills) { S.gov24.bills.push({ what: 'ภาษีที่ดินและสิ่งปลูกสร้าง: ที่ดินเกษตรและที่ปลูกสร้างบนที่ดินที่สร้างเอง', amt: Math.max(100, tax), y: S.gov24.billY != null ? S.gov24.billY : Math.floor((S.day - 1) / 336), due: S.day + 28 }); Phone.msg('อบต.สุขใจ', `ใบแจ้งภาษีที่ดินและสิ่งปลูกสร้าง ${baht(tax)} ออกแล้ว ชำระภายใน 28 วัน ที่แอปธนาคาร › บิล`, true); return; }   // v181: a bill, not a silent deduction
    S.money = Math.max(0, S.money - tax); Bank2.log('ภาษีที่ดินและสิ่งปลูกสร้าง', -tax); Phone.msg('องค์การบริหารส่วนตำบล', `ภาษีที่ดินและสิ่งปลูกสร้างประจำปี ${baht(tax)} (บ้านอยู่อาศัยหลังหลักได้ยกเว้น บ้านให้เช่าและที่ดินเกษตรคิดตามอัตรา)`, true); this.log(`🏛️ จ่ายภาษีที่ดินและสิ่งปลูกสร้าง ${baht(tax)}`);
  },
  html() {
    const s = this.st(), A = Object.entries(s.active);
    return `<p class="lead">📰 ข่าวและเหตุการณ์รอบตัว · ราคาน้ำมัน ×${s.fuel.toFixed(2)} · ดัชนีราคาสินค้า ×${s.cpi.toFixed(3)} · ค่า Ft ${TARIFF.ft}</p>
      ${s.scam ? `<div class="card"><div class="ci">📞</div><div class="cb"><h4>สายจาก "เจ้าหน้าที่ DSI" ให้โอน ${baht(s.scam.amt)}</h4><div class="row"><button class="btn danger" data-a="rl" data-v="scamPay">โอนเงินตามที่บอก</button><button class="btn" data-a="rl" data-v="scamReport">วางสายแล้วแจ้ง 1441</button></div></div></div>` : ''}
      ${this.on('cod') ? `<div class="card"><div class="ci">📦</div><div class="cb"><h4>พัสดุเก็บเงินปลายทาง 790 ฿ ที่ไม่ได้สั่ง</h4><div class="row"><button class="btn ghost" data-a="rl" data-v="codPay">จ่ายเงินรับของ</button><button class="btn" data-a="rl" data-v="codRefuse">ปฏิเสธการรับ</button></div></div></div>` : ''}
      ${this.on('dengue') ? `<div class="card"><div class="ci">🦟</div><div class="cb"><h4>ไข้เลือดออกระบาด</h4><div class="row"><button class="btn" data-a="rl" data-v="dengue">คว่ำภาชนะ เทน้ำขัง (พลังงาน 8)</button></div></div></div>` : ''}
      ${this.on('pm25') ? `<div class="card"><div class="ci">😷</div><div class="cb"><h4>ฝุ่น PM2.5 สูง (หน้ากาก N95 มี ${count('n95')} ชิ้น)</h4><div class="row"><button class="btn" data-a="rl" data-v="mask">ซื้อ N95 5 ชิ้น 350 ฿</button></div></div></div>` : ''}
      ${this.on('dog') ? `<div class="card"><div class="ci">🐕</div><div class="cb"><h4>หมาจรเข้าไร่</h4><div class="row"><button class="btn" data-a="rl" data-v="dogAdopt">รับมาเลี้ยง</button><button class="btn ghost" data-a="rl" data-v="dogCall">แจ้งปศุสัตว์อำเภอ</button></div></div></div>` : ''}
      <div class="card"><div class="ci">🎫</div><div class="cb"><h4>สลากกินแบ่งรัฐบาล (ออกวันที่ 1 และ 16 = วันแรกและวันที่ 4 ของสัปดาห์)</h4><p class="dim">ใบละ 80 ฿ · ถือ ${s.lot.length}/10 ใบ ${s.lot.join(' ')}</p><div class="row"><button class="btn" data-a="rl" data-v="lot">ซื้อ 1 ใบ</button></div></div></div>
      ${A.length ? `<h5>กำลังเกิดขึ้น</h5><p class="dim">${A.map(([k, a]) => `${k} ถึง${RD(a.until)}`).join(' · ')}</p>` : ''}
      <h5>บันทึกเหตุการณ์</h5><p class="dim">${s.log.map(esc).join('<br>') || 'ยังไม่มี'}</p>${typeof Fest2 !== 'undefined' ? '<h5>ปฏิทินกิจกรรมหมู่บ้าน</h5>' + Fest2.calHTML() : ''}`;
  },
  init() {
    this.st(); ITEMS.n95 = { n: 'หน้ากาก N95', i: '😷', cat: 'tool' };
    APPS.splice(2, 0, { id: 'news', i: '📰', n: 'ข่าว & เหตุการณ์' }); Phone.apps.news = () => this.html();
    // effects wired into existing systems
    const _cm = Life2.costMult.bind(Life2); Life2.costMult = () => _cm() * (this.on('pm25') && !G.inside && !count('n95') && !(S.furn.airpurifier && G.inside) ? 1.12 : 1);
    const _ref = Town2.refuelNear.bind(Town2); Town2.refuelNear = function () { const m = S.money; const r = _ref(); const spent = m - S.money; if (spent > 0) { const extra = Math.round(spent * (RL.st().fuel - 1)); S.money -= extra; if (extra) UI.toast(`ราคาน้ำมันวันนี้ ×${RL.st().fuel.toFixed(2)} (${extra > 0 ? '+' : ''}${baht(extra)})`, '⛽'); } return r; };
    const _sd = shopDiscount; shopDiscount = id => _sd(id) * RL.st().cpi * (this.on('sale') && id === 'online' ? 0.7 : 1);
    const _top = Town2.topMult.bind(Town2); Town2.topMult = d => _top(d) * (this.on('flood') && Math.abs((G.driving || { d }).d.x) < 12 ? 0.6 : 1);
    if (typeof Social !== 'undefined' && Social.buy) { const _sb = Social.buy.bind(Social); Social.buy = (...a) => { const m = S.money; const r = _sb(...a); const got = S.money - m; if (got > 0) { const k = (this.on('tour') ? 0.5 : 0) + (this.on('viral') ? 0.3 : 0); if (k) earn(Math.round(got * k)); } return r; }; }
    // dengue: higher chance of getting sick unless you cleaned up
    const _ld = Life2.day.bind(Life2); Life2.day = () => { _ld(); if (this.on('dengue') && !(this.st().dengueSafe >= S.day) && Math.random() < 0.003 && !S.sick && !(S.sickFree > S.day)) { if (Life2.getSick) Life2.getSick('ไข้เลือดออกจากยุงลาย'); S.sick = 2; Phone.msg('สุขภาพ', 'ไข้สูง ปวดเมื่อยตามตัว อาจเป็นไข้เลือดออก ต้องไปโรงพยาบาล', true); } if (this.on('pm25') && count('n95') && !G.inside) takeItem('n95'); };
    // drink-driving / document checkpoints during festivals at night
    setInterval(() => { if (!G.started || !G.driving || G.night < 0.5 || G.away || UI.isOpen()) return; const e = typeof Fest2 !== 'undefined' && Fest2.cur; if (!(e || Fest.on) || Math.random() > 0.08) return; if (!S.license) { Plan.ticket('ด่านตรวจช่วงเทศกาล: ขับรถไม่มีใบขับขี่/ใบขับขี่หมดอายุ', 1000); } else UI.toast('ผ่านด่านตรวจแอลกอฮอล์ช่วงเทศกาล เป่าได้ 0 มก.% ขับขี่ปลอดภัย', '👮'); }, 20000);
  },
};
UI.H.rl = d => RL.act(d.v);
