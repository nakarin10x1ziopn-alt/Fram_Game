'use strict';
// ---------- v182_realism_a: group A of the realism pass (Thai rules, 2026) ----------
//  The constants that were wrong live in their own files (one-line edits: social security v31_biz / career / company, card interest v168_credit, electricity steps grid.js,
//  online returns v36_shop, land tax reallife + v24_gov, severance career + v31_biz). This module holds what needs new logic:
//   * CarTax182: vehicle tax by engine size and age (10-50 % off from year 6), compulsory insurance, 1 % a month when late, an inspection (ตรอ.) for cars of 7 years or more
//   * PIT year = the calendar year, filed by 31 March of the next year (online until 8 April), late: surcharge 1.5 % a month and a fine of 200 baht even when there is nothing to pay
//   * savings interest: 15 % withholding tax on all of the year's interest once it passes 20,000 baht a year (shown in the 50 ทวิ certificate)
//   * freelance / rendering income paid by clients: 3 % withholding tax, credited when the personal income tax is filed
//   * DDR5 memory: checked, the catalogue price is already above the real 2026 shelf price, so nothing changes
V23.add('v182_realism_a', () => {
  const toast = (t, i) => { try { UI.toast(t, i || '🧾'); } catch (e) { } };
  const calY = () => { try { return Cal36.date().y; } catch (e) { return 2026; } };

  // ---------- vehicle tax ----------
  const TRUCKS = new Set(['oldtruck', 'truckflat', 'deliveryflat', 'garbage', 'shovel']);
  const isWork = c => { const C = CARS[c.type] || {}; return TRUCKS.has(c.type) || /กระบะ|บรรทุก|รถตัก|รถไถ|ขยะ/.test(C.n || ''); };
  const ccOf = c => { const p = (CARS[c.type] || {}).price || 300000; return p < 250000 ? 1000 : p < 450000 ? 1300 : p < 700000 ? 1500 : p < 1000000 ? 1800 : p < 1600000 ? 2000 : p < 2500000 ? 2500 : p < 4000000 ? 3000 : 4000; };
  const baseTax = cc => cc <= 600 ? cc * 0.5 : cc <= 1800 ? 300 + (cc - 600) * 1.5 : 300 + 1800 + (cc - 1800) * 4;
  const ageY = c => (c && c.reg && c.reg.day != null) ? Math.max(0, Math.floor((S.day - c.reg.day) / 365)) : 0;
  const disc = a => a >= 10 ? 0.5 : a >= 9 ? 0.4 : a >= 8 ? 0.3 : a >= 7 ? 0.2 : a >= 6 ? 0.1 : 0;
  const taxOnly = c => { const C = CARS[c.type] || {}; let t = isWork(c) ? ((C.price || 0) > 100000 ? 1600 : 900) : baseTax(ccOf(c)); if (C.ev) t *= 0.2; return Math.round(t * (1 - disc(ageY(c)))); };
  const act = c => (isWork(c) ? 600 : 645);
  const late = c => { if (!c || !c.tax || S.day <= c.tax) return 0; return Math.round(taxOnly(c) * 0.01 * Math.ceil((S.day - c.tax) / 30)); };
  const need = c => ageY(c) >= 7;
  const insp = c => (need(c) ? 200 : 0);
  window.CarTax182 = { amt: c => Math.max(1, taxOnly(c)) + act(c), taxOnly, late, insp, need, ageY, ccOf };

  // ---------- personal income tax: calendar year, filing deadline 31 March ----------
  if (typeof PTax !== 'undefined') {
    PTax.yr = () => calY();
    { const st0 = PTax.st.bind(PTax); PTax.st = function () { const s = st0(); if (s.y < 1000) s.y = calY(); return s; }; }   // old saves counted 84-day years: carry on in the calendar year
    PTax.roll = function () {
      const s = this.st(), y = this.yr(); if (y === s.y) return;
      s.cur.other = Math.max(0, (S.stats.earned - s.earned0) - s.cur.sal - s.cur.rent - s.cur.div);
      const dl = Cal36.dayOf(y, 2, 31); s.last = { y: s.y, ...s.cur, r: this.calc(s.cur), deadline: dl }; s.y = y; s.cur = this.blank(); s.earned0 = S.stats.earned;
      Phone.msg('กรมสรรพากร', `ถึงเวลายื่นแบบ ภ.ง.ด.90 เงินได้ปี ${s.last.y} ยื่นได้ถึง 31 มี.ค. (ออนไลน์ถึง 8 เม.ย.) ที่แอปภาษี ยื่นช้ามีค่าปรับและเงินเพิ่ม 1.5% ต่อเดือน`, true);
    };
    PTax.file = function () {
      const L = this.st().last; if (!L || L.done) return; const r = L.r, lateD = Math.max(0, S.day - (L.deadline + 8)), mo = Math.ceil(lateD / 30);
      const fine = lateD ? 200 + (r.due > 0 ? Math.round(r.due * 0.015 * mo) : 0) : 0, net = r.due + fine;
      if (net > 0 && S.money < net) { UI.toast(`ต้องชำระ ${baht(net)}`, '💸'); return; }
      if (net > 0) { S.money -= net; Bank2.log('ภาษีเงินได้บุคคลธรรมดา', -net); } else if (net < 0) { earn(-net); Bank2.income('คืนภาษี', -net); }
      L.done = 1; UI.toast(net > 0 ? `ยื่นภาษีแล้ว ชำระ ${baht(net)}${fine ? ' (รวมค่าปรับ/เงินเพิ่มยื่นช้า)' : ''}` : net < 0 ? `ยื่นภาษีแล้ว ได้เงินคืน ${baht(-net)}` : 'ยื่นภาษีแล้ว ไม่ต้องชำระเพิ่ม', '🧾');
    };
    { const h0 = PTax.html.bind(PTax); PTax.html = function () { return h0().replace('ปีภาษี = 12 สัปดาห์ในเกม', 'ปีภาษี = ปีปฏิทิน ม.ค.–ธ.ค.').replace('ยื่นแบบหลังจบปีภายใน 7 วัน', 'ยื่นแบบภายใน 31 มี.ค. ของปีถัดไป (ออนไลน์ถึง 8 เม.ย.)'); }; }
  }

  // ---------- savings interest: 15 % withholding tax once the year's interest passes 20,000 baht ----------
  const X = () => { const s = S.v182 = S.v182 || {}; s.int = s.int || {}; return s; };
  if (typeof Bank !== 'undefined' && Bank.day) {
    const _bd = Bank.day.bind(Bank);
    Bank.day = () => {
      const e = Bank.st().earned || 0; _bd(); const g = (Bank.st().earned || 0) - e; if (!(g > 0)) return;
      try {
        const y = calY(), a = X().int, b0 = a[y] || 0, a0 = b0 + g; a[y] = a0;
        const tax = Math.round(a0 > 20000 ? (b0 > 20000 ? g * 0.15 : a0 * 0.15) : 0); if (tax <= 0) return;
        Bank.st().sav -= tax;
        try { const x = window.Bank170 && window.Bank170.X(); if (x) { x.wht = x.wht || {}; x.wht[y] = (x.wht[y] || 0) + tax; x.yr = x.yr || {}; } } catch (er) { }
        try { Bank2.log('หักภาษี ณ ที่จ่าย 15% ดอกเบี้ยเงินฝาก (เกิน 20,000 ฿ ต่อปี)', -tax); } catch (er) { }
      } catch (er) { console.warn('v182 int', er); }
    };
  }

  // ---------- freelance and rendering income: 3 % withholding tax ----------
  if (typeof Bank2 !== 'undefined' && Bank2.income) {
    const i0 = Bank2.income.bind(Bank2);
    Bank2.income = function (src, n) {
      const r = i0(src, n);
      try {
        if (/ฟรีแลนซ์|เรนเดอร์/.test(String(src)) && n > 0) {
          const t = Math.round(n * 0.03); if (t > 0) { const sav = Bank.st().sav; if (sav >= t) Bank.st().sav -= t; else S._c = Math.max(0, S._c - t); if (typeof PTax !== 'undefined') PTax.st().cur.wht += t; try { Bank2.log(`หักภาษี ณ ที่จ่าย 3% ${src}`, -t); } catch (er) { } }
        }
      } catch (er) { console.warn('v182 wht', er); }
      return r;
    };
  }

  // DDR5 memory: checked, no change: the catalogue already prices a 32 GB DDR5 kit at about 20,000 baht (real 2026 shelf price about 13,000), so it is not raised again
  window.Realism182 = { calY };
});
