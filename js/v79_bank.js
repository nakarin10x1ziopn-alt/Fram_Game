// v79_bank.js: the bank and the ATMs closer to real Thai life
//  - savings interest is a real 0.50 % a year (it was 0.08 % a DAY = 34 % a year), accrued daily and paid twice a year at the end of June and December,
//    15 % withholding tax when a year's interest passes 20,000 baht (real rule). Fixed deposit is 90 days at 1.5 % a year (it was 7 days at 0.6 %), and it can be broken early (interest lost)
//  - mutual funds move only on business days, charge a yearly management fee, and selling pays out one or two business days later (T+1 / T+2), not instantly
//  - the branch door is locked outside bank hours (Mon-Fri 08:30-16:30, shut on public holidays); the ATM works around the clock (except in a village-wide blackout)
//  - ATMs stand in the other towns too (before: two in the whole game); the first time a card is used the machine asks you to choose a PIN
V23.add('v79_bank', () => {
  const B = window.Bank49; if (!B || typeof Bank === 'undefined' || typeof Bank2 === 'undefined') return;
  const st = () => { const s = S.v79 = S.v79 || {}; s.accr = s.accr || {}; s.pend = s.pend || []; s.y = s.y || 0; s.ytd = s.ytd || 0; return s; };
  const msg = (t) => { try { Phone.msg('ธนาคารสุขใจ', t, true); } catch (e) { } };
  const toast = (t, i) => { try { UI.toast(t, i || '🏦'); } catch (e) { } };
  const SAV_RATE = 0.005, WHT_FREE = 20000, WHT = 0.15;
  const dateOf = d => { try { return Cal36.date(d); } catch (e) { return null; } };
  const isPayDay = c => c && ((c.m === 5 && c.dom === 30) || (c.m === 11 && c.dom === 31));

  // ---------- savings interest ----------
  BANK.rate = 0; BANK.fixedDays = 90; BANK.fixedRate = 0.015 * 90 / 365;
  { const _d = Bank.day.bind(Bank);
    Bank.day = function () {
      _d();                                                                              // fixed deposits, piggy banks and the log still run
      try {
        const s = st(), b = Bank.st(), c = dateOf(S.day);
        if (c && s.y !== c.y) { s.y = c.y; s.ytd = 0; }
        const accts = [{ k: 'main', get bal() { return b.sav; }, add(v) { b.sav += v; b.earned = (b.earned || 0) + v; } }];
        for (const a of B.V().accts) if (a.type === 'sav') accts.push({ k: a.id, get bal() { return a.bal; }, add(v) { a.bal += v; } });
        for (const a of accts) s.accr[a.k] = (s.accr[a.k] || 0) + Math.max(0, a.bal) * SAV_RATE / 365;
        if (isPayDay(c)) {
          let total = 0, taxed = 0;
          for (const a of accts) { const g = Math.floor(s.accr[a.k] || 0); if (g <= 0) continue; const tax = s.ytd + g > WHT_FREE ? Math.round(g * WHT) : 0; a.add(g - tax); s.accr[a.k] -= g; s.ytd += g; total += g - tax; taxed += tax; }
          if (total > 0 || taxed > 0) { try { Bank2.log('ดอกเบี้ยออมทรัพย์ (ครึ่งปี)', total); Bank2.income('ดอกเบี้ย', total); } catch (e) { } msg(`ดอกเบี้ยเงินฝากออมทรัพย์รอบนี้ ${baht(total + taxed)}${taxed ? ` หักภาษี ณ ที่จ่าย 15% ${baht(taxed)}` : ''} เข้าบัญชีแล้ว ${baht(total)}`); }
        }
      } catch (e) { console.warn('v79 interest', e); }
    }; }
  // phone bank app: say what the rate really is, add a way to break a fixed deposit early
  { const _b = Phone.apps.bank;
    Phone.apps.bank = function () {
      let h = _b.apply(this, arguments);
      try {
        const s = st(), acc = Math.floor(Object.values(s.accr).reduce((a, b) => a + b, 0));
        h = h.replace(/ดอกเบี้ย [\d.]+% ต่อวัน ถอนได้ตลอด · ใช้พักเงินให้งอกเงย/, `ดอกเบี้ย ${(SAV_RATE * 100).toFixed(2)}% ต่อปี จ่ายปีละ 2 ครั้ง (ปลายเดือน มิ.ย. และ ธ.ค.) หักภาษี 15% เมื่อดอกเบี้ยเกิน ${baht(WHT_FREE)}/ปี · สะสมรอจ่าย ${baht(acc)}`);
        let i = 0; h = h.replace(/<p>🔒 ([^<]*)<\/p>/g, (m, t) => `<p>🔒 ${t} <button class="btn ghost" style="padding:2px 8px;font-size:12px" data-a="v79brk" data-v="${i++}">ถอนก่อนกำหนด</button></p>`);
        h = h.replace(/ถอนก่อนครบไม่ได้ แต่ได้ดอกเบี้ยสูงกว่า/, 'ถอนก่อนครบได้ แต่ไม่ได้ดอกเบี้ย');
      } catch (e) { }
      return h;
    }; }
  UI.H.v79brk = d => { const b = Bank.st(), f = b.fixed[+d.v]; if (!f) return; b.fixed.splice(+d.v, 1); b.sav += f.amt; try { Bank2.log('ถอนเงินฝากประจำก่อนกำหนด (ไม่ได้ดอกเบี้ย)', f.amt); } catch (e) { } toast(`ถอนฝากประจำก่อนกำหนด ${baht(f.amt)} เข้าออมทรัพย์ (ไม่ได้ดอกเบี้ย)`, '🏦'); try { UI.renderBody(); } catch (e) { } };

  // ---------- mutual funds ----------
  const FEE = { bond: 0.005, thai: 0.0175, tech: 0.02 };                                  // yearly management fee, taken out of the price day by day
  const LAG = { bond: 1, thai: 2, tech: 2 };                                              // business days until the sale proceeds arrive
  { const _d = Bank2.day.bind(Bank2);
    Bank2.day = function () {
      const b = this.st(), biz = B.isBiz(S.day), keep = b.funds;
      if (!biz) b.funds = {};                                                             // no trading on weekends and public holidays: prices stand still
      try { _d(); } finally { if (!biz) b.funds = keep; }
      if (biz) for (const k in b.funds) if (b.funds[k] > 0 && FEE[k]) b.funds[k] *= 1 - FEE[k] / 252;
      const s = st(), now = [], later = [];
      for (const p of s.pend) (p.due <= S.day && biz ? now : later).push(p);
      if (now.length) { s.pend = later; let t = 0; for (const p of now) { b.sav += p.amt; t += p.amt; } try { this.log('เงินขายกองทุนเข้าบัญชี', t); } catch (e) { } msg(`เงินจากการขายกองทุน ${baht(t)} เข้าบัญชีออมทรัพย์แล้ว`); }
    };
    const _s = Bank2.sell.bind(Bank2);
    Bank2.sell = function (k) {
      const b = this.st(), v = Math.floor(b.funds[k] || 0); if (!v) return;
      b.funds[k] = 0; let due = S.day; for (let i = 0; i < (LAG[k] || 1); i++) due = B.nextBiz(due);
      st().pend.push({ due, amt: v, k }); this.log('ขาย' + FUNDS[k].n + ` (เงินเข้า ${RD(due)})`, 0);
      toast(`ส่งคำสั่งขาย${FUNDS[k].n}แล้ว เงิน ${baht(v)} เข้าบัญชีออมทรัพย์วันทำการที่ ${RD(due)}`, '📈'); try { Sfx.coin(); } catch (e) { }
    }; }

  // ---------- the branch door ----------
  { const _en = Rooms.entrance.bind(Rooms);
    Rooms.entrance = function (poi) {
      const r = _en(poi);
      try { if (poi && poi.room && poi.room.kind === 'bank' && !B.bankOpen()) { r.icon = '🔒'; r.label = `🔒 ${poi.room.title} ปิดอยู่ (จ–ศ 08:30–16:30 ปิดวันหยุดราชการ) · ใช้ตู้ ATM ได้ตลอด 24 ชม.`; r.fn = () => toast('สาขาปิดแล้ว ไปที่ตู้ ATM ข้างสาขาได้ หรือใช้แอปธนาคารบนมือถือ', '🔒'); delete r.info; } } catch (e) { }
      return r;
    }; }

  // ---------- ATMs in every town ----------
  const made = new Set();
  function addAtm(parent, away, x, z, rot, tag) {
    const k = tag + Math.round(x) + ',' + Math.round(z); if (made.has(k)) return; made.add(k);
    const q = { x, z }; for (let i = 0; i < 4; i++) Col.push(q, 0.7); x = q.x; z = q.z;
    const y = away ? 0 : World.groundY(x, z), g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rot;
    U.mk(g, GEO.box, mc(0x00695c, { roughness: 0.5 }), [0, 0.9, 0], [0.8, 1.8, 0.6]); U.mk(g, GEO.box, new THREE.MeshBasicMaterial({ color: 0x80deea }), [0, 1.25, 0.301], [0.5, 0.35, 0.01]); U.mk(g, GEO.box, mc(0xffe082), [0, 1.85, 0], [0.82, 0.12, 0.62]);
    parent.add(g); Col.box(x, z, 0.4, 0.3, rot);
    const p = l2w(x, z, rot, 0, 1.0), poi = { kind: 'act', x: p.x, z: p.z, r: 1.6, label: 'ตู้ ATM', icon: '🏧', map: false };
    poi.act = () => (away && G.away !== away ? null : { icon: '🏧', label: 'ใช้ตู้ ATM (ใส่บัตร + รหัสผ่าน)', fn: () => window.ATM71 && ATM71.open() });
    World.pois.push(poi);
  }
  const faceStreet = (A, x) => { const st = (A.streets || [0]).map(s => A.cx + s); let best = st[0]; for (const s of st) if (Math.abs(s - x) < Math.abs(best - x)) best = s; return best > x ? Math.PI / 2 : -Math.PI / 2; };
  function townAtm(A) {
    if (!A || !A.g || A._atm79) return; A._atm79 = 1;
    const inA = p => p.x >= A.x0 - 5 && p.x <= A.x1 + 5 && p.z >= A.z0 - 5 && p.z <= A.z1 + 5;
    const bank = World.pois.find(p => inA(p) && /^ธนาคารสุขใจ สาขา/.test(p.label || '') && p.kind !== 'door' && !/ตู้/.test(p.label));
    const x = bank ? bank.x : A.spawn.x + 4, z = bank ? bank.z + 3.4 : A.spawn.z - 5;
    addAtm(A.g, A, x, z, faceStreet(A, x), 'T' + (A.key || A.n));
  }
  const all = () => { for (const k in Town2.areas) { const A = Town2.areas[k]; if (A && A.g && A.spawn) townAtm(A); } };
  if (window.V25) V25.ensureHook('*', A => { try { setTimeout(() => townAtm(A), 0); } catch (e) { } });
  { const _go = Town2.go.bind(Town2); Town2.go = function (k, fee) { const r = _go(k, fee); setTimeout(all, 800); setTimeout(all, 3600); return r; }; }
  // the two market towns on the main map
  { const b = World.pois.find(p => /^ธนาคารสุขใจ สาขาทุ่งทอง/.test(p.label || '') && p.kind !== 'door' && !/ตู้/.test(p.label)); if (b) addAtm(World.outdoor, null, b.x, b.z + 3.4, -Math.PI / 2, 'thong');
    const px = -105, pz = -400; addAtm(World.outdoor, null, px + 6.4, pz + 2.2, -Math.PI / 2, 'phupha');
    const m = World.pois.find(p => /^ตลาดริมทะเล/.test(p.label || '')); if (m) addAtm(World.outdoor, null, m.x - 3.5, m.z + 3, Math.PI / 2, 'sea');                   // the seaside town
    const pl = World.pois.find(p => p.label === 'สุขใจพลาซ่า'); if (pl) addAtm(World.outdoor, null, pl.x + 3.2, pl.z + 3.2, -Math.PI / 2, 'plaza'); }          // the shopping plaza
  all();
  window.Bank79 = { st, all };
});
