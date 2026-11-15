'use strict';
// ---------- v252: the player's regular job (งานประจำ): working places + new pay and career rules ----------
//  FIX: 12 of the 20 jobs pointed at places in the removed towns (police, nurse, bank, chef, car sales, vet, barista, bus driver, pharmacist, builder, IT support, electrician), so the
//   clock-in machine and the application door did not exist. They now work at the village places that are still there.
//  NEW (same rules the company staff get in v247 / v250, seen from the employee's side):
//   - probation: a new job starts with 119 days at 85% pay and no promotion; 2+ unexcused absences or 2+ warnings = not passed (dismissed), otherwise full pay
//   - yearly review on 1 Jan (A/B/C from lateness, absences and warnings): a raise of 5 / 3 / 0 % that stays, and a bonus of 2 / 1 / 0.5 months of pay (in proportion to the time worked)
//   - provident fund: you choose 0 / 3 / 5 / 8% of the pay; the employer matches up to 5% after probation; it grows 3% a year; you get your own part when the job ends,
//     and the employer's part only after one year of service (not in a gross-misconduct dismissal); civil servants already have the pension (กบข.)
//   - resigning needs 30 days' notice (you can withdraw it); leaving at once costs half a month's pay and the employer's part of the fund and gives no unemployment benefit
//   - unemployment benefit after a resignation too: 45% of the wage (up to 15,000) for 90 days, after 6 months of contributions (dismissal without fault was already covered)
//   - training for the player: English for business 8,000 (+2% pay for good), professional certificate 25,000 (+4% in this job), leadership 40,000 (+3%, from the 2nd rank);
//     each also adds promotion points
V23.add('v252_jobs', function () {
  if (typeof Career === 'undefined' || typeof JOBS2 === 'undefined' || typeof Cal36 === 'undefined') return;
  const E = s => (typeof esc === 'function' ? esc(s) : String(s));
  const B = n => (typeof baht0 === 'function' ? baht0(n) : typeof baht === 'function' ? baht(n) : Math.round(n).toLocaleString('en-US') + ' ฿');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const msg = (t, q) => { try { Phone.msg('ฝ่ายบุคคล', t, !!q); } catch (e) { } };
  const toast = (t, i) => { try { UI.toast(t, i); } catch (e) { } };
  const PROB = 119, PROB_PAY = 0.85;

  // ----- the working places that are still there -----
  const AT = { police: /สถานีตำรวจภูธรสุขใจ/, nurse: /^คลินิก$/, bank: /^ธนาคารสุขใจ$/, chef: /ร้านอาหารป้าแดง/, carsales: /โชว์รูมรถยนต์สุขใจ/, vet: /ร้านสัตว์เลี้ยงลุงมี/, barista: /คาเฟ่ & บาร์ สุขใจ/, busdriver: /ป้ายรถบัสหมู่บ้านสุขใจ/, pharmacist: /^คลินิก$/, builder: /ร้านวัสดุรุ่งเรือง/, itsup: /ไอที & ซีเคียวริตี้ สุขใจ/, electrician: /ศูนย์ EV & พลังงานสะอาด สุขใจ/ };
  for (const k in AT) if (JOBS2[k]) JOBS2[k].at = AT[k];


  // ----- clock-in kiosks for the jobs whose door was created after Career.init ran (the kiosks are made by Career.init, next to the door) -----
  const ensureKiosks = () => {
    try {
      const have = new Set(World.pois.filter(q => q.job).map(q => q.job)), saved = {};
      for (const k of Object.keys(JOBS2)) if (have.has(k) || !World.pois.some(q => q.label && JOBS2[k].at.test(q.label) && q.x < 2500)) { saved[k] = JOBS2[k]; }
      if (Object.keys(saved).length === Object.keys(JOBS2).length) return 0;
      const keep = Object.assign({}, JOBS2); for (const k in saved) delete JOBS2[k];
      try { Career.init(); } finally { for (const k in saved) JOBS2[k] = saved[k]; }
      return Object.keys(JOBS2).length - Object.keys(saved).length;
    } catch (e) { console.warn('v252 kiosks', e); return 0; }
  };
  // a kiosk that stands on another kiosk or on another interaction point is moved to a free spot beside its door
  const tidyKiosks = () => {
    try {
      const K = World.pois.filter(q => q.job && q.grp), others = () => World.pois.filter(q => !q.job && q.label && q.x < 2500);
      const free = (x, z, self) => {
        if (typeof Collide !== 'undefined' && Collide.covered && Collide.covered(x, z)) return false;
        if (K.some(q => q !== self && Math.hypot(q.x - x, q.z - (z + 0.6)) < 1.6)) return false;
        if (others().some(q => Math.hypot(q.x - x, q.z - z) < 1.7)) return false;
        for (let ix = Math.floor((x - 2) / 8); ix <= Math.floor((x + 2) / 8); ix++) for (let iz = Math.floor((z - 2) / 8); iz <= Math.floor((z + 2) / 8); iz++) for (const s of Col.map.get(Col.key(ix, iz)) || []) { if (s === (self && self.col)) continue; if (s.type === 'c') { if (Math.hypot(x - s.x, z - s.z) < s.r + 0.5) return false; } else { const dx = x - s.x, dz = z - s.z, lx = Math.abs(dx * s.c - dz * s.s), lz = Math.abs(dx * s.s + dz * s.c); if (lx < s.hw + 0.5 && lz < s.hd + 0.5) return false; } }
        return !(typeof roadDist === 'function' && roadDist(x, z) < 4.2);
      };
      let moved = 0;
      for (const k of K) {
        const bad = K.some(q => q !== k && Math.hypot(q.x - k.x, q.z - k.z) < 1.4) || others().some(q => Math.hypot(q.x - k.x, q.z - k.z) < 1.2); if (!bad) continue;
        const C = JOBS2[k.job], door = C && World.pois.find(q => q.label && C.at.test(q.label) && q.x < 2500 && !q.job); if (!door) continue;
        let pick = null;
        for (const r of [2.4, 3.2, 4.0, 4.8]) { for (let a = 0; a < 16 && !pick; a++) { const ang = a * Math.PI / 8, x = door.x + Math.cos(ang) * r, z = door.z + Math.sin(ang) * r; if (free(x, z, k)) pick = { x, z }; } if (pick) break; }
        if (!pick) continue;
        k.grp.position.set(pick.x, World.groundY(pick.x, pick.z), pick.z); k.x = pick.x; k.z = pick.z + 0.6; try { Col.remove(k.col); k.col = Col.circle(pick.x, pick.z, 0.25); } catch (e) { } moved++;
      }
      return moved;
    } catch (e) { console.warn('v252 tidy', e); return 0; }
  };
  { let n = 0; const iv = setInterval(() => { try { if (typeof G !== 'undefined' && G.started && World.pois && World.outdoor) { clearInterval(iv); setTimeout(() => { ensureKiosks(); tidyKiosks(); }, 2500); } else if (++n > 900) clearInterval(iv); } catch (e) { } }, 700); }

  const S2 = () => { const s = S.job2 = S.job2 || {}; if (s.eng == null) { s.eng = 0; s.tr = null; } return s; };
  const COURSE = { eng: { n: 'ภาษาอังกฤษธุรกิจ', cost: 8000, days: 14, pts: 6, hint: 'เงินเดือน +2% ถาวร (ติดตัวไปทุกงาน)' }, pro: { n: 'ใบรับรองวิชาชีพสายงานปัจจุบัน', cost: 25000, days: 30, pts: 12, hint: 'เงินเดือน +4% ในงานนี้' }, lead: { n: 'ผู้นำทีมและการบริหารงาน', cost: 40000, days: 21, pts: 10, hint: 'เงินเดือน +3% ในงานนี้ (ต้องเลื่อนตำแหน่งแล้ว 1 ขั้น)' } };
  const X = j => j.x252;
  const initJob = j => {   // first look at a job: an old save counts as having passed probation
    if (!j.k || j.x252) return;
    const old = (j.empDays || 0) > 60 || (j.weeks || 0) > 2 || (j.slips || []).length > 0, st = j.start != null ? j.start : S.day;
    j.x252 = { hire: old ? S.day - 400 : st, prob: old ? 0 : st + PROB, rz: 0, prem: 0, pf: { rate: 0, e: 0, r: 0 }, y: { ok: 0, late: 0, abs: 0 }, notice: 0, ycy: Cal36.date(S.day).y };
    if (!old) msg(`👋 เริ่มงานใหม่: ทดลองงาน ${PROB} วัน เงินเดือน 85% ผ่านโปรแล้วได้เต็ม · ยังไม่มีสิทธิ์เลื่อนตำแหน่งระหว่างโปร`);
  };

  // ----- salary: raise, premium and probation on top of the rank pay -----
  { const _s = Career.salary.bind(Career);
    Career.salary = function () { const b = _s(), j = this.st(), x = j.x252; if (!x || !j.k) return b; return Math.round(b * (1 + clamp(x.rz + x.prem + S2().eng, 0, 0.65)) * (x.prob ? PROB_PAY : 1) / 100) * 100; }; }
  { const _p = Career.promote.bind(Career); Career.promote = function () { const x = this.st().x252; if (x && x.prob) return; return _p(); }; }

  // ----- provident fund and the yearly pay day -----
  const pfPayout = (x, kind) => {
    if (!x || !x.pf) return; const own = Math.round(x.pf.e), er = Math.round(x.pf.r), vest = kind !== 'resignNow' && kind !== 'grave' && S.day - x.hire >= 365, get = own + (vest ? er : 0);
    if (get > 0) { try { earn(get); Bank2.income('กองทุนสำรองเลี้ยงชีพ', get); } catch (e) { S.money += get; } msg(`💼 รับเงินกองทุนสำรองเลี้ยงชีพ ${B(get)} (ส่วนของคุณ ${B(own)}${vest ? ` + ส่วนนายจ้าง ${B(er)}` : er ? ` · ส่วนนายจ้าง ${B(er)} ไม่ได้ เพราะทำงานไม่ถึง 1 ปีหรือออกแบบผิดเงื่อนไข` : ''})`); }
  };
  { const _pd = Career.payday.bind(Career);
    Career.payday = function () {
      const j = this.st(), n0 = j.slips && j.slips[0] ? j.slips[0].day : -1; _pd();
      try {
        const x = j.x252, sl = j.slips && j.slips[0]; if (!x || !j.k || !sl || sl.day !== S.day || sl.day === n0) return;
        if (x.pf.e + x.pf.r > 0) { const g = (x.pf.e + x.pf.r) * 0.0025; x.pf.e += g * (x.pf.e / (x.pf.e + x.pf.r)); x.pf.r += g * (x.pf.r / (x.pf.e + x.pf.r)); }
        if (x.pf.rate > 0 && !this.C().gov) {
          const emp = Math.round(sl.gross * x.pf.rate / 100), mt = x.prob ? 0 : Math.round(sl.gross * Math.min(x.pf.rate, 5) / 100);
          if (S.money >= emp) { S.money -= emp; try { Bank2.log('เงินสมทบกองทุนสำรองเลี้ยงชีพ', -emp); } catch (e) { } x.pf.e += emp; x.pf.r += mt; msg(`💼 สมทบกองทุน ${B(emp)}${mt ? ` + นายจ้างสมทบ ${B(mt)}` : ' (ช่วงทดลองงาน นายจ้างยังไม่สมทบ)'} · สะสม ${B(x.pf.e + x.pf.r)}`, true); }
        }
      } catch (e) { console.warn('v252 payday', e); }
    }; }

  // ----- leaving: notice, immediate exit, unemployment benefit -----
  const gotUnemp = (self, x, sal, kind, emp) => {
    const R = window.Realism183;
    if (!R || !R.X) return; if (kind !== 'resign' || emp < 180) return;
    R.X().un = { until: S.day + 90, next: S.day + 30, wage: Math.round(Math.min(sal, 15000) * 0.9) };
    msg('📋 ลาออกถูกต้องตามขั้นตอนและส่งเงินสมทบครบ 6 เดือน มีสิทธิ์รับเงินทดแทนว่างงานจากประกันสังคม 45% ของค่าจ้าง (สูงสุด 15,000) นาน 90 วัน');
  };
  const _res = Career.resign.bind(Career), _fire = Career.fire.bind(Career);
  const endJob = (self, kind) => {
    const j = self.st(), C = self.C(), x = j.x252, sal = self.salary(); if (!C) return;
    let penalty = 0; if (kind === 'resignNow') { penalty = Math.round(sal * 0.5); S.money = Math.max(0, S.money - penalty); try { Bank2.log('ค่าปรับลาออกทันที', -penalty); } catch (e) { } }
    const gov = !!C.gov, emp0 = j.empDays || 0, r = _res(); if (x) pfPayout(x, kind);
    if (kind === 'resignNow') toast(`ลาออกทันที: ถูกหักเงิน ${B(penalty)} และไม่ได้รับเงินว่างงาน`, '⚠️'); else if (!gov && x) gotUnemp(self, x, sal, 'resign', emp0);
    j.x252 = null; return r;
  };
  Career.resign = function (mode) {
    const j = this.st(); if (!j.k) return _res(); initJob(j); const x = j.x252;
    if (mode === 'final') return endJob(this, 'resign'); if (mode === 'now') return endJob(this, 'resignNow');
    if (x.notice) { toast(`ยื่นใบลาออกไว้แล้ว มีผล ${RD(x.notice)}`, '📝'); return; }
    x.notice = S.day + 30; msg(`📝 รับใบลาออกแล้ว มีผลวันที่ ${RD(x.notice)} (แจ้งล่วงหน้า 30 วัน) ระหว่างนี้ยังต้องมาทำงานตามปกติ ถอนใบลาออกได้ในแอปงานประจำ`); toast('ยื่นใบลาออกล่วงหน้า 30 วันแล้ว', '📝');
  };
  Career.fire = function (why, grave) {
    const j = this.st(), x = j.x252, had = j.k; const r = _fire(why, grave);
    if (had && x) { pfPayout(x, grave ? 'grave' : 'fire'); } j.x252 = null; return r;
  };

  // ----- every day -----
  const evalProb = (j, x) => {
    if (x.y.abs >= 2 || (j.warn || 0) >= 2) { msg('❌ ไม่ผ่านทดลองงาน (ขาดงานหรือถูกเตือนเกินเกณฑ์)'); Career.fire('ไม่ผ่านการทดลองงาน', false); return; }
    x.prob = 0; msg(`✅ ผ่านทดลองงาน! เงินเดือนเต็ม ${B(Career.salary())} และเริ่มมีสิทธิ์เลื่อนตำแหน่ง · นายจ้างเริ่มสมทบกองทุนถ้าคุณเลือกสมทบ`); try { Prog.add(50); } catch (e) { }
  };
  const review = (j, x) => {
    const tenure = S.day - x.hire; if (x.prob || tenure < 150) { x.y = { ok: 0, late: 0, abs: 0 }; return; }
    const g = x.y.abs === 0 && x.y.late <= 1 && (j.warn || 0) === 0 ? 'A' : x.y.abs <= 1 && x.y.late <= 4 ? 'B' : 'C', rz = { A: 0.05, B: 0.03, C: 0 }[g], mo = { A: 2, B: 1, C: 0.5 }[g];
    x.rz = Math.min(0.5, x.rz + rz); const base = Career.salary(), gross = Math.round(base * mo * Math.min(1, tenure / 365) / 100) * 100, net = Math.round(gross * 0.95);
    if (net > 0) { try { earn(net); Bank2.income('โบนัสประจำปี', net); } catch (e) { S.money += net; } }
    msg(`📋 ประเมินผลประจำปี เกรด ${g} · ปรับเงินเดือน +${Math.round(rz * 100)}% · โบนัส ${B(net)} (หักภาษี 5% แล้ว)${g === 'C' ? ' · ตั้งใจขึ้นอีกนิดนะ' : ''}`);
    x.y = { ok: 0, late: 0, abs: 0 };
  };
  const daily = () => {
    const j = Career.st(), s2 = S2(); if (!j) return;
    if (s2.tr && S.day >= s2.tr.end) {   // a course ends
      const c = COURSE[s2.tr.k], k = s2.tr.k; s2.tr = null; const x = j.x252;
      if (k === 'eng') s2.eng = Math.min(0.02, s2.eng + 0.02); else if (x && j.k) { if (k === 'pro') { x.certPro = 1; x.prem += 0.04; } else { x.certLead = 1; x.prem += 0.03; } }
      if (j.k) j.pts = (j.pts || 0) + c.pts; try { Prog.add(60); } catch (e) { }
      msg(`🎓 จบหลักสูตร "${c.n}" · แต้มเลื่อนตำแหน่ง +${c.pts}${k === 'eng' ? ' · เงินเดือน +2% ถาวร' : ''}`);
    }
    if (!j.k) return; initJob(j); const x = j.x252, t = Cal36.date(S.day);
    const y = j.done && j.done[S.day - 1]; if (y && x.ydone !== S.day) { x.ydone = S.day; if (y === 'ok') x.y.ok++; else if (y === 'late') x.y.late++; else if (y === 'absent') x.y.abs++; }
    if (x.prob && S.day >= x.prob) { evalProb(j, x); if (!j.k) return; }
    if (x.notice && S.day >= x.notice) { Career.resign('final'); return; }
    if (t.dom === 1 && t.m === 0 && x.rvDay !== S.day) { x.rvDay = S.day; review(j, x); }
  };
  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { daily(); } catch (e) { console.warn('v252 daily', e); } return r; }; }

  // ----- the page -----
  const section = () => {
    const j = Career.st(), s2 = S2(), x = j.x252, C = Career.C(), un = window.Realism183 && Realism183.X().un;
    let h = '<h5>🎓 ศึกษาต่อและใบรับรอง</h5>';
    if (s2.tr) h += `<p class="lead">กำลังเรียน: <b>${E(COURSE[s2.tr.k].n)}</b> · เหลือ ${Math.max(0, s2.tr.end - S.day)} วัน</p>`;
    h += `<div class="grid">${Object.keys(COURSE).map(k => { const c = COURSE[k], done = k === 'eng' ? s2.eng >= 0.02 : k === 'pro' ? !!(x && x.certPro) : !!(x && x.certLead); const need = k !== 'eng' && !j.k ? 'ต้องมีงานประจำ' : k === 'lead' && j.k && (j.rank || 0) < 1 ? 'ต้องเลื่อนตำแหน่งก่อน' : ''; return `<div class="card"><div class="ci">${k === 'eng' ? '🗣️' : k === 'pro' ? '📜' : '🧭'}</div><div class="cb"><h4>${E(c.n)}</h4><p class="dim">${E(c.hint)} · แต้มเลื่อนตำแหน่ง +${c.pts} · ใช้เวลา ${c.days} วัน</p><div class="row"><button class="btn" data-a="j252" data-v="train|${k}" ${!done && !s2.tr && !need && S.money >= c.cost ? '' : 'disabled'}>${done ? '✅ จบแล้ว' : need || 'เรียน ' + B(c.cost)}</button></div></div></div>`; }).join('')}</div>`;
    if (un) h += `<p class="lead">📋 กำลังรับเงินทดแทนว่างงานถึง ${RD(un.until)}</p>`;
    if (!j.k || !C) return h;
    h += '<h5>💼 เงื่อนไขการจ้างงานของคุณ</h5>';
    if (x) {
      const ten = Math.max(0, S.day - x.hire), tx = x.prob ? `🟡 ทดลองงานอีก ${Math.max(0, x.prob - S.day)} วัน (เงินเดือน 85%)` : '🟢 ผ่านโปรแล้ว';
      h += `<p class="lead">${tx} · อายุงาน ${ten > 365 ? Math.floor(ten / 365) + ' ปี ' : ''}${ten % 365} วัน · ปรับเงินเดือนสะสม +${Math.round(x.rz * 100)}% · ค่าวิชาชีพ +${Math.round((x.prem + s2.eng) * 100)}% · ประเมินและโบนัสประจำปีทุก 1 ม.ค. (นับจากการมาสาย ขาดงาน ใบเตือน)</p>`;
      h += C.gov ? '<p class="dim">ข้าราชการ/เจ้าหน้าที่รัฐใช้บำนาญ กบข. อยู่แล้ว จึงไม่มีกองทุนสำรองเลี้ยงชีพของเอกชน</p>' : `<div class="card"><div class="ci">💼</div><div class="cb"><h4>กองทุนสำรองเลี้ยงชีพ</h4><p class="dim">คุณสมทบ แล้วนายจ้างสมทบให้เท่ากันไม่เกิน 5% (หลังผ่านโปร) · สะสม ${B(x.pf.e + x.pf.r)} (ของคุณ ${B(x.pf.e)} · นายจ้าง ${B(x.pf.r)}) · ได้ส่วนนายจ้างเมื่อทำงานครบ 1 ปี</p><div class="row">${[0, 3, 5, 8].map(v => `<button class="btn ${x.pf.rate === v ? '' : 'ghost'}" data-a="j252" data-v="pf|${v}">${v}%</button>`).join('')}</div></div></div>`;
      h += x.notice ? `<p class="lead">📝 ยื่นใบลาออกไว้ มีผล ${RD(x.notice)}</p><div class="row"><button class="btn" data-a="j252" data-v="cancel">ถอนใบลาออก</button><button class="btn danger" data-a="j252" data-v="now">ลาออกทันที (ถูกหักครึ่งเดือน ไม่ได้ส่วนนายจ้างและเงินว่างงาน)</button></div>` : '<p class="dim">ปุ่ม "ลาออก" ต้องแจ้งล่วงหน้า 30 วัน และยังได้เงินทดแทนว่างงานหลังลาออก · ลาออกทันทีมีค่าปรับครึ่งเดือน</p><div class="row"><button class="btn danger ghost" data-a="j252" data-v="now">ลาออกทันที (ค่าปรับครึ่งเดือน)</button></div>';
    }
    return h;
  };
  { const _h = Career.html.bind(Career);
    Career.html = function (tab) { let h = _h(tab); try { const j = this.st(); if (j.k) initJob(j); if (tab === 0 || !this.C()) h += section(); } catch (e) { console.warn('v252 page', e); } return h; }; }
  UI.H.j252 = d => {
    const [a, x] = String(d.v || '').split('|'), j = Career.st(), s2 = S2(), jx = j.x252;
    if (a === 'train') { const c = COURSE[x]; if (!c || s2.tr || S.money < c.cost) return; if (x !== 'eng' && !j.k) return; if (x === 'lead' && (j.rank || 0) < 1) return; if (x === 'pro' && jx && jx.certPro) return; if (x === 'lead' && jx && jx.certLead) return; if (x === 'eng' && s2.eng >= 0.02) return; S.money -= c.cost; try { Bank2.log('ค่าเรียน ' + c.n, -c.cost); } catch (e) { } s2.tr = { k: x, end: S.day + c.days }; toast(`ลงเรียน ${c.n} (${c.days} วัน)`, '🎓'); return; }
    if (!j.k || !jx) return;
    if (a === 'pf') { jx.pf.rate = +x; toast(`สมทบกองทุน ${x}% ของเงินเดือน`, '💼'); return; }
    if (a === 'cancel') { jx.notice = 0; msg('ถอนใบลาออกแล้ว ยินดีที่ยังอยู่ร่วมกัน'); toast('ถอนใบลาออกแล้ว', '✅'); return; }
    if (a === 'now') UI.confirm('ลาออกทันที?', `จะถูกหักเงินครึ่งเดือน (${B(Career.salary() * 0.5)}) ไม่ได้ส่วนนายจ้างของกองทุน และไม่ได้เงินทดแทนว่างงาน ยืนยันไหม`, 'ลาออกทันที', () => { Career.resign('now'); });
  };
  window.Jobs252 = { tidyKiosks, ensureKiosks, AT, COURSE, initJob, daily, review, evalProb, section, endJob, pfPayout, S2 };
});
