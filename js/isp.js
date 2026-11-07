'use strict';
// ---------- Home internet like real life: fibre (FTTH), 5G home routers and pocket WiFi from three providers,
// packages with real-world prices and contracts, coverage checks, technician appointments, monthly bills
// (1 game week = 1 billing month), speed tests, outages, add-ons — and the speed changes what you earn online ----------
const ISPS = {
  sukjai: { n: 'สุขใจไฟเบอร์', i: '🟢', kind: 'ไฟเบอร์ออปติก FTTH', fault: 0.01, cover: () => true },
  thong: { n: 'ทุ่งทองบรอดแบนด์', i: '🟠', kind: 'ไฟเบอร์ออปติก FTTH', fault: 0.04, cover: zone => zone !== 'farm', extra: 2500 },
  mobile: { n: 'สุขใจโมบาย', i: '🔵', kind: 'เน็ตมือถือ 5G/4G', fault: 0.02, cover: () => true },
};
const NET_PKGS = {
  f500: { isp: 'sukjai', n: 'ไฟเบอร์ 500/500 Mbps', down: 500, up: 500, price: 590, router: 'WiFi 6', contract: 12 },
  f1000: { isp: 'sukjai', n: 'ไฟเบอร์ 1000/1000 Mbps', down: 1000, up: 1000, price: 790, router: 'WiFi 6', contract: 12 },
  f2000: { isp: 'sukjai', n: 'ไฟเบอร์ 2000/1000 Mbps + WiFi 7', down: 2000, up: 1000, price: 1290, router: 'WiFi 7', contract: 24 },
  t300: { isp: 'thong', n: 'ไฟเบอร์ประหยัด 300/300 Mbps', down: 300, up: 300, price: 399, router: 'WiFi 5', contract: 24 },
  t700: { isp: 'thong', n: 'ไฟเบอร์ 700/700 Mbps', down: 700, up: 700, price: 599, router: 'WiFi 6', contract: 24 },
  h5g: { isp: 'mobile', n: '5G Home WiFi ไม่จำกัด (เราเตอร์ซิม)', down: 300, up: 60, price: 699, router: '5G CPE', contract: 12, wireless: 1 },
  pocket: { isp: 'mobile', n: 'พ็อกเก็ตไวไฟ 4G 100GB', down: 60, up: 15, price: 299, router: 'Pocket WiFi มีแบต', contract: 0, wireless: 1, battery: 1 },
};
const NET_ADDONS = { mesh: { n: 'ตัวกระจายสัญญาณ Mesh เพิ่ม 1 จุด', price: 99 }, iptv: { n: 'กล่องทีวีออนไลน์ + ช่องกีฬา', price: 150 }, ip: { n: 'Fixed IP (สำหรับเปิดเซิร์ฟเวอร์/กล้อง)', price: 300 } };
// the old "fibre" gadget becomes a real fibre subscription
delete FUT.fiber; { const t = SHOPS.evcenter.tabs.find(x => x.items.includes('fut:fiber')); if (t) t.items.splice(t.items.indexOf('fut:fiber'), 1); }

const ISP = {
  st() { if (!S.isp) S.isp = { pkg: null, isp: null, since: 0, until: 0, addons: {}, appt: null, due: 0, unpaid: 0, down: 0, cause: '', last: null }; if (S.fut && S.fut.fiber) { delete S.fut.fiber; Object.assign(S.isp, { pkg: 'f1000', isp: 'sukjai', since: S.day, until: S.day + 12 * 7 }); } return S.isp; },
  pkg() { const s = this.st(); return s.pkg ? NET_PKGS[s.pkg] : null; },
  // real speed right now: wireless suffers far from town and in the evening rush; fibre stays near the plan speed
  speed() {
    const s = this.st(), P = this.pkg(); if (!P) return 0;
    if (s.down > 0 || s.unpaid >= 2) return 0;
    const pw = typeof Grid !== 'undefined' ? Grid.st().src : 'grid'; if ((pw === 'none') && !P.battery) return 0;
    const h = Math.floor(S.time / 60), rush = h >= 19 && h < 23, zone = (zoneAt(HOUSE_POS.x, HOUSE_POS.z) || {}).id;
    let k = P.wireless ? (zone === 'farm' ? 0.55 : 0.8) * (rush ? 0.6 : 1) * (S.weather.type === 'storm' ? 0.6 : 1) : (rush ? 0.9 : 0.96);
    if (!P.wireless && s.addons.mesh) k = Math.min(0.99, k + 0.03);
    return Math.round(P.down * k);
  },
  // multiplier for online income: streaming needs upload, online jobs need a stable line
  bonus() { const v = this.speed(); return v <= 0 ? 0 : v < 50 ? 0.7 : v < 300 ? 1 : v < 800 ? 1.15 : 1.3; },
  coverage(isp) { return ISPS[isp].cover('farm'); },
  order(k, slot) {
    const s = this.st(), P = NET_PKGS[k], I = ISPS[P.isp]; if (s.pkg) { UI.toast('มีอินเทอร์เน็ตอยู่แล้ว ยกเลิกสัญญาเดิมก่อน', '📶'); return; }
    const cost = (I.extra && !I.cover('farm') ? I.extra : 0) + (P.contract ? 0 : 0);
    if (S.money < cost) { UI.toast('เงินไม่พอค่าลากสาย', '💸'); return; }
    if (cost) { S.money -= cost; Bank2.log('ค่าลากสายไฟเบอร์เพิ่ม', -cost); }
    if (P.wireless) { this.activate(k); UI.toast(`${P.n} ส่งเราเตอร์ถึงบ้านแล้ว เสียบไฟใช้ได้ทันที`, '📦'); return; }
    s.appt = { k, day: S.day + 1, slot }; UI.close();
    Phone.msg(I.n, `นัดช่างติดตั้ง ${P.n} ${RD(S.day + 1)} ช่วง${slot === 'am' ? 'เช้า 09:00-12:00' : 'บ่าย 13:00-17:00'} กรุณาอยู่ที่บ้าน (ในเขตไร่) ตอนช่างมา`);
  },
  activate(k) { const s = this.st(), P = NET_PKGS[k]; Object.assign(s, { pkg: k, isp: P.isp, since: S.day, until: P.contract ? S.day + P.contract * 7 : 0, appt: null, unpaid: 0 }); Life2.note('ติดอินเทอร์เน็ต ' + P.n + ' 📶'); },
  cancel() {
    const s = this.st(), P = this.pkg(); if (!P) return;
    const left = s.until > S.day ? Math.ceil((s.until - S.day) / 7) : 0, fee = left ? Math.min(3000, left * 250) : 0;
    if (S.money < fee) { UI.toast(`ค่าปรับยกเลิกก่อนครบสัญญา ${baht(fee)}`, '💸'); return; }
    if (fee) { S.money -= fee; Bank2.log('ค่าปรับยกเลิกสัญญาเน็ต', -fee); }
    Object.assign(s, { pkg: null, isp: null, addons: {}, until: 0, unpaid: 0 }); UI.toast(`ยกเลิกอินเทอร์เน็ตแล้ว${fee ? ' จ่ายค่าปรับ ' + baht(fee) : ''} คืนอุปกรณ์เรียบร้อย`, '📶');
  },
  monthly() { const s = this.st(), P = this.pkg(); if (!P) return 0; return P.price + Object.keys(s.addons).reduce((t, k) => t + NET_ADDONS[k].price, 0); },
  hour(h) {
    const s = this.st();
    // technician visit: you need to be at the farm during the slot
    if (s.appt && S.day === s.appt.day) {
      const at = s.appt.slot === 'am' ? 10 : 14, inFarm = (zoneAt(G.player.pos.x, G.player.pos.z) || {}).id === 'farm' || G.inside;
      if (h === at) { if (inFarm) { const P = NET_PKGS[s.appt.k]; this.activate(s.appt.k); Phone.msg(ISPS[P.isp].n, `ช่างติดตั้ง ${P.n} เสร็จแล้ว ทดสอบความเร็วได้ ${this.speed()} Mbps`); if (!G.simulating) UI.toast('ช่างติดตั้งเน็ตเสร็จแล้ว!', '📶'); } else { Phone.msg(ISPS[NET_PKGS[s.appt.k].isp].n, 'ช่างไปถึงแล้วแต่ไม่พบผู้รับบริการ กรุณานัดหมายใหม่ในแอป'); s.appt = null; } }
    }
    if (s.appt && S.day > s.appt.day) s.appt = null;
    if (!s.pkg) return;
    if (s.down > 0) { s.down--; if (!s.down) Phone.msg(ISPS[s.isp].n, 'แก้ไขสัญญาณเรียบร้อย อินเทอร์เน็ตใช้งานได้ตามปกติ', false); }
    else if (Math.random() < ISPS[s.isp].fault / 24 * (S.weather.type === 'storm' ? 4 : 1)) { s.down = 2 + ((Math.random() * 6) | 0); s.cause = NET_PKGS[s.pkg].wireless ? 'เสาสัญญาณขัดข้อง' : U.pick(['สายไฟเบอร์ขาดจากรถชน', 'อุปกรณ์ชุมสายขัดข้อง', 'กระรอกกัดสาย']); Phone.msg(ISPS[s.isp].n, `แจ้งเหตุขัดข้อง: ${s.cause} คาดว่าแก้ไขเสร็จใน ${s.down} ชม.`, false); }
  },
  week() {
    const s = this.st(); if (!s.pkg) return;
    const amt = Math.round(this.monthly() * 1.07);
    if (s.due) s.unpaid++; s.due += amt;
    Phone.msg(ISPS[s.isp].n, `ใบแจ้งค่าบริการรอบนี้ ${baht(amt)} (รวม VAT)${s.unpaid ? ` · ค้างชำระ ${s.unpaid} รอบ${s.unpaid >= 2 ? ' ถูกระงับสัญญาณชั่วคราว' : ''}` : ''}`);
  },
  pay() { const s = this.st(); if (!s.due || S.money < s.due) return; S.money -= s.due; Bank2.log('ค่าอินเทอร์เน็ต', -s.due); s.due = 0; s.unpaid = 0; UI.toast('ชำระค่าอินเทอร์เน็ตแล้ว', '🧾'); },
  test() { const s = this.st(); s.last = { v: this.speed(), up: Math.round(this.speed() * (this.pkg() ? this.pkg().up / this.pkg().down : 0)), ping: this.pkg() ? (this.pkg().wireless ? 28 + ((Math.random() * 25) | 0) : 4 + ((Math.random() * 5) | 0)) : 0, t: Phone.clock() }; },
  html(tab) {
    const s = this.st(), P = this.pkg();
    if (tab === 1) return `<p class="lead">เลือกแพ็กเกจ (ออกบิลวันที่ 1 ของทุกเดือน) · สมัครแพ็กเกจเพิ่มได้ตลอด แพ็กเกจแรกเป็นสายหลัก ที่เหลือเป็นสายเสริมแยกบิล · ไฟเบอร์ต้องนัดช่างติดตั้ง · เน็ต 5G/พ็อกเก็ตไวไฟส่งอุปกรณ์ใช้ได้ทันที</p>${Object.entries(ISPS).map(([ik, I]) => `<h5>${I.i} ${I.n} · ${I.kind}${I.cover('farm') ? '' : ` · ⚠️ พื้นที่ไร่อยู่นอกเขตสาย ต้องลากสายเพิ่ม ${baht(I.extra)}`}</h5><div class="grid">${Object.entries(NET_PKGS).filter(([, X]) => X.isp === ik).map(([k, X]) => `<div class="card"><div class="ci">📶</div><div class="cb"><h4>${X.n}</h4><p class="dim">${baht(X.price)}/เดือน · ${X.down}/${X.up} Mbps · เราเตอร์ ${X.router} · ${X.contract ? `สัญญา ${X.contract} เดือน ติดตั้งฟรี` : 'ไม่มีสัญญา'}${X.wireless ? ' · ความเร็วขึ้นกับสัญญาณ' : ''}</p><div class="row">${X.wireless ? `<button class="btn" data-a="ispbuy" data-v="${k}">${s.pkg ? 'สมัครเพิ่ม (สายเสริม)' : 'สมัคร'}</button>` : `<button class="btn" data-a="ispbuy" data-v="${k}" data-s="am">${s.pkg ? 'สมัครเพิ่ม · ช่างพรุ่งนี้เช้า' : 'นัดช่างพรุ่งนี้เช้า'}</button><button class="btn ghost" data-a="ispbuy" data-v="${k}" data-s="pm">พรุ่งนี้บ่าย</button>`}</div></div></div>`).join('')}</div>`).join('')}`;
    if (!P) return `<p class="lead">ยังไม่ได้ติดอินเทอร์เน็ตบ้าน ${s.appt ? `· นัดช่างติดตั้ง${RD(s.appt.day)} ช่วง${s.appt.slot === 'am' ? 'เช้า' : 'บ่าย'}` : '— ไปที่แท็บ "สมัครแพ็กเกจ"'}</p>`;
    const v = this.speed(), L = s.last;
    return `<div class="grid"><div class="card"><div class="ci">${ISPS[s.isp].i}</div><div class="cb"><h4>${ISPS[s.isp].n}: ${P.n}</h4><p class="dim">${baht(this.monthly())}/เดือน · ${s.until ? `สัญญาถึง${RD(s.until)}` : 'ไม่มีสัญญา'} · ${v ? `ตอนนี้ ~${v} Mbps` : s.down ? `ขัดข้อง: ${s.cause} (อีก ${s.down} ชม.)` : s.unpaid >= 2 ? 'ถูกระงับเพราะค้างชำระ' : 'ไม่มีไฟเลี้ยงเราเตอร์'}</p>
      <div class="row"><button class="btn" data-a="isptest">ทดสอบความเร็ว</button>${s.due ? `<span class="dim">🧾 มีบิลค้าง ${baht(s.due)} · ชำระที่ บิล & ค่าบริการ</span>` : ''}<button class="btn ghost" data-a="ispcancel">ยกเลิกบริการ</button></div>${L ? `<p class="lead">📊 ${L.t} · ดาวน์โหลด ${L.v} Mbps · อัปโหลด ${L.up} Mbps · ปิง ${L.ping} ms</p>` : ''}</div></div></div>
      <h5>บริการเสริม</h5><div class="grid">${Object.entries(NET_ADDONS).map(([k, A]) => `<div class="card"><div class="ci">➕</div><div class="cb"><h4>${A.n}</h4><p class="dim">${baht(A.price)}/เดือน</p><div class="row"><button class="btn ${s.addons[k] ? 'ghost' : ''}" data-a="ispadd" data-v="${k}">${s.addons[k] ? 'ยกเลิก' : 'เพิ่ม'}</button></div></div></div>`).join('')}</div>
      <p class="dim">ผลต่อเกม: ไลฟ์สตรีม งานออนไลน์ และงานเรนเดอร์ AI ได้เงิน ×${this.bonus().toFixed(2)} ตามความเร็วจริง · ไม่มีเน็ตทำงานออนไลน์ไม่ได้</p>`;
  },
  open() { UI.open('อินเทอร์เน็ตบ้าน', ['แพ็กเกจของฉัน', 'สมัครแพ็กเกจ'], t => this.html(t), { wide: true }); },
  init() {
    this.st();
    // online work needs a working line, and pays by speed
    const _sj = Life2.startJob.bind(Life2);
    Life2.startJob = k => { if (k === 'online') { if (!this.speed() && !(count('phonepro'))) { UI.toast('ไม่มีอินเทอร์เน็ตใช้งาน (ติดเน็ตบ้านในแอป "อินเทอร์เน็ต")', '📶'); return; } const J = PT_JOBS.find(j => j.k === k), base = J.basePay ?? (J.basePay = J.pay); J.pay = Math.round(base * (this.bonus() || 0.6)); const r = _sj(k); setTimeout(() => { J.pay = base; }, 3000); return r; } return _sj(k); };
    const _use = PC.use.bind(PC);
    PC.use = v => { if ((v === 'stream' || v === 'ai') && !this.speed()) { UI.toast('อินเทอร์เน็ตใช้ไม่ได้ตอนนี้ ไลฟ์/ส่งงานไม่ได้', '📶'); return; } const m = S.money; _use(v); if (v === 'stream' && S.money > m) { const extra = Math.round((S.money - m) * (this.bonus() - 1)); if (extra) { S.money += extra; UI.toast(`ความเร็วเน็ต ${this.speed()} Mbps ทำให้รายได้ไลฟ์ ${extra > 0 ? '+' : ''}${baht(extra)}`, '📶'); } } if (v === 'ai' && S.pcJob) S.pcJob.pay = Math.round(S.pcJob.pay * this.bonus()); };
    const _bill = Life2.bill.bind(Life2); Life2.bill = () => { _bill(); this.week(); };
  },
};
APPS.splice(5, 0, { id: 'isp', i: '📶', n: 'อินเทอร์เน็ต' });
Phone.apps.isp = () => { setTimeout(() => { Phone.app = null; UI.close(); ISP.open(); }, 0); return ''; };
Object.assign(UI.H, {
  ispbuy: d => ISP.order(d.v, d.s || 'am'), isptest: () => ISP.test(), isppay: () => ISP.pay(), ispcancel: () => ISP.cancel(),
  ispadd: d => { const s = ISP.st(); if (s.addons[d.v]) delete s.addons[d.v]; else s.addons[d.v] = 1; },
});
