'use strict';
// ---------- Bank branch: statement, income summary, loans, investment funds, farm insurance, ATMs ----------
const FUNDS = {
  // daily NAV change (only on business days), roughly the real thing: bond fund ~2.7 %/yr with tiny swings, Thai equity ~7 %/yr with ~0.9 % daily swings, tech ~15 %/yr with ~1.6 % daily swings
  bond: { n: 'กองทุนตราสารหนี้', i: '🛡️', lo: -0.00035, hi: 0.0005, risk: 'ต่ำ' },
  thai: { n: 'กองทุนหุ้นไทย', i: '📈', lo: -0.0154, hi: 0.0158, risk: 'กลาง' },
  tech: { n: 'กองทุนหุ้นเทคโนโลยี', i: '🚀', lo: -0.0273, hi: 0.0281, risk: 'สูง' },
};
const LOAN_RATE = 0.07 / 365,   // 7 % a year, like a farmer loan (it was 0.12 % a day = 44 % a year)
   INS_PRICE = 300, INS_DAYS = 7;

const Bank2 = {
  st() {
    const b = Bank.st();
    b.log = b.log || []; b.debt = b.debt || 0; b.funds = b.funds || {}; b.ins = b.ins || 0; b.inc = b.inc || {};
    return b;
  },
  log(t, amt) { const b = this.st(); b.log.unshift({ d: S.day, t, a: Math.round(amt) }); b.log.length = Math.min(b.log.length, 40); },
  income(src, n) { const b = this.st(); b.inc[src] = (b.inc[src] || 0) + Math.round(n); },
  maxLoan() { return 3000 + (S.lvl || 1) * 2000; },
  borrow(n) { const b = this.st(); n = Math.min(+n, this.maxLoan() - b.debt); if (!(n > 0)) { UI.toast('เกินวงเงินกู้แล้ว', '🏦'); return; } b.debt += n; S.money += n; this.log('กู้เงิน', n); Sfx.coin(); },
  repay(n) { const b = this.st(); n = Math.min(+n, b.debt, S.money); if (!(n > 0)) return; b.debt -= n; S.money -= n; this.log('ชำระหนี้', -n); Sfx.coin(); if (!b.debt) UI.toast('ปลดหนี้หมดแล้ว! 🎉', '🏦'); },
  buy(k, n) { const b = this.st(); n = Math.min(+n, S.money); if (!(n > 0)) return; S.money -= n; b.funds[k] = (b.funds[k] || 0) + n; this.log('ซื้อ' + FUNDS[k].n, -n); Sfx.coin(); },
  sell(k) { const b = this.st(), v = Math.floor(b.funds[k] || 0); if (!v) return; S.money += v; b.funds[k] = 0; this.log('ขาย' + FUNDS[k].n, v); Sfx.coin(); },
  insure() { const b = this.st(); if (S.money < INS_PRICE) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(INS_PRICE), '💸'); return; } S.money -= INS_PRICE; b.ins = Math.max(b.ins, S.day) + INS_DAYS; this.log('ซื้อประกันฟาร์ม', -INS_PRICE); UI.toast(`ประกันฟาร์มคุ้มครองถึง${RD(b.ins)}`, '🛡️'); },
  insured() { return this.st().ins >= S.day; },
  claim(why, value) {
    if (!this.insured() || value <= 0) return;
    const pay = Math.round(value * 0.8); S.money += pay; this.log('สินไหมประกัน: ' + why, pay); this.income('ประกัน', pay);
    Phone.msg('ประกันฟาร์มสุขใจ', `อนุมัติสินไหม "${why}" จ่ายให้ ${baht(pay)} เรียบร้อยแล้ว`);
  },
  day() {
    const b = this.st();
    if (b.debt > 0) { b.frac = (b.frac || 0) + b.debt * LOAN_RATE; const it = Math.floor(b.frac); b.frac -= it;   // fractions of a baht carry over, so a small loan does not pay a full baht every day
    if (it > 0) { b.debt += it; this.log('ดอกเบี้ยเงินกู้', -it); } if (b.debt > this.maxLoan() * 1.2) Phone.msg('ธนาคารสุขใจ', `ยอดหนี้ ${baht(b.debt)} สูงเกินวงเงินแล้ว กรุณาชำระบางส่วนนะครับ`); }
    for (const k in b.funds) if (b.funds[k] > 0) { const F = FUNDS[k], r = F.lo + Math.random() * (F.hi - F.lo); const d = b.funds[k] * r; b.funds[k] += d; b.fundChg = b.fundChg || {}; b.fundChg[k] = r; }
    if (b.ins && b.ins === S.day) Phone.msg('ประกันฟาร์มสุขใจ', 'ประกันฟาร์มจะหมดอายุวันนี้ ต่ออายุได้ที่ธนาคารหรือแอปธนาคาร', true);
  },
  html() {
    const b = this.st(), fundTot = Object.values(b.funds).reduce((s, v) => s + v, 0);
    const inc = Object.entries(b.inc).sort((a, c) => c[1] - a[1]).map(([k, v]) => `${k} ${baht(v)}`).join(' · ') || 'ยังไม่มี';
    return `<h5>📊 ที่มาของรายได้ทั้งหมด</h5><p class="lead">${inc}</p>
      <div class="card"><div class="ci">💳</div><div class="cb"><h4>สินเชื่อเกษตรกร</h4><p class="dim">วงเงิน ${baht(this.maxLoan())} (เพิ่มตามเลเวล) · ดอกเบี้ย ${(LOAN_RATE * 100).toFixed(2)}% ต่อวัน (ราว 10% ต่อปี) · หนี้คงค้าง <b>${baht(b.debt)}</b></p>
        <div class="row"><button class="btn ghost" data-a="loan" data-v="1000">กู้ 1,000</button><button class="btn ghost" data-a="loan" data-v="5000">กู้ 5,000</button><button class="btn" data-a="repay" data-v="1000" ${b.debt ? '' : 'disabled'}>ชำระ 1,000</button><button class="btn" data-a="repay" data-v="all" ${b.debt ? '' : 'disabled'}>ชำระทั้งหมด</button></div></div></div>
      <h5>📈 กองทุนรวม (มูลค่ารวม ${baht(fundTot)})</h5><p class="lead">มูลค่าขึ้นลงทุกวันตามความเสี่ยง เป็นระบบจำลองในเกม</p><div class="grid">${Object.keys(FUNDS).map(k => { const F = FUNDS[k], v = b.funds[k] || 0, c = b.fundChg && b.fundChg[k]; return `<div class="card"><div class="ci">${F.i}</div><div class="cb"><h4>${F.n}</h4><p class="dim">ความเสี่ยง${F.risk} · ถืออยู่ ${baht(v)}${c != null && v ? ` · เมื่อวาน <b class="${c >= 0 ? 'up' : 'down'}">${c >= 0 ? '▲' : '▼'}${(Math.abs(c) * 100).toFixed(1)}%</b>` : ''}</p><div class="row"><button class="btn" data-a="fbuy" data-k="${k}" data-v="1000">ซื้อ 1,000</button><button class="btn ghost" data-a="fsell" data-k="${k}" ${v ? '' : 'disabled'}>ขายทั้งหมด</button></div></div></div>`; }).join('')}</div>
      <div class="card"><div class="ci">🛡️</div><div class="cb"><h4>ประกันฟาร์ม ${this.insured() ? `<small>คุ้มครองถึง${RD(b.ins)}</small>` : ''}</h4><p class="dim">${baht(INS_PRICE)} / ${INS_DAYS} วัน · ไฟไหม้ผักหรือถูกขโมย ได้ชดเชย 1.5 เท่าของมูลค่า</p><div class="row"><button class="btn" data-a="insure" ${S.money < INS_PRICE ? 'disabled' : ''}>${this.insured() ? 'ต่ออายุ' : 'ซื้อประกัน'}</button></div></div></div>
      <h5>🧾 รายการเดินบัญชี</h5>${b.log.length ? `<div class="msgs">${b.log.slice(0, 15).map(l => `<div class="msg"><b>${esc(l.t)}</b><small>${RD(l.d)}</small><p class="${l.a >= 0 ? 'good' : ''}">${l.a >= 0 ? '+' : ''}${baht(l.a)}</p></div>`).join('')}</div>` : '<p class="empty">ยังไม่มีรายการ</p>'}`;
  },
  ui() { UI.open('ธนาคารสุขใจ สาขาหมู่บ้าน', ['บัญชีของฉัน', 'สินเชื่อ ลงทุน ประกัน'], t => t === 0 ? Phone.apps.bank.call(Phone) : this.html(), { wide: true }); },
  build() {
    const x = 19, z = -267, rot = -Math.PI / 2;
    const o = { w: 10, d: 8, h: 4.6, flat: true, wall: 0xfff8e1, roof: 0xd7ccc8, sign: 'ธนาคารสุขใจ', signStyle: { bg: '#00695c', fg: '#ffe082' }, glassFront: true, winS: [-2, 2], ww: 1.4, wh: 1.4, wains: 'stone' };
    const b = World.building(o); b.position.set(x, World.groundY(x, z), z); b.rotation.y = rot; World.outdoor.add(b);
    Col.box(x, z, o.w / 2 + 0.3, o.d / 2 + 0.3, rot, 'bld'); World.clearNear(x, z, 7, true);
    const door = l2w(x, z, rot, 0, o.d / 2 + 1.8);
    World.pois.push({ kind: 'act', x: door.x, z: door.z, r: 2.6, label: 'ธนาคารสุขใจ', icon: '🏦', map: true, act: () => ({ icon: '🏦', label: 'เข้าธนาคาร (เปิดบัญชี ฝาก ถอน โอน ฝากประจำ ตู้นิรภัย กู้ ลงทุน ประกัน)', fn: () => this.ui() }) });
    const atm = (ax, az, r) => {
      const g = new THREE.Group(); g.position.set(ax, World.groundY(ax, az), az); g.rotation.y = r;
      U.mk(g, GEO.box, mc(0x00695c, { roughness: 0.5 }), [0, 0.9, 0], [0.8, 1.8, 0.6]); U.mk(g, GEO.box, new THREE.MeshBasicMaterial({ color: 0x80deea }), [0, 1.25, 0.301], [0.5, 0.35, 0.01]); U.mk(g, GEO.box, mc(0xffe082), [0, 1.85, 0], [0.82, 0.12, 0.62]);
      World.outdoor.add(g); Col.box(ax, az, 0.4, 0.3, r);
      const p = l2w(ax, az, r, 0, 1.0); World.pois.push({ kind: 'act', x: p.x, z: p.z, r: 1.6, label: 'ตู้ ATM', icon: '🏧', act: () => ({ icon: '🏧', label: 'ใช้ตู้ ATM', fn: () => Phone.open('bank') }) });
    };
    atm(14.6, -261.5, -Math.PI / 2); atm(9.8, -66, -Math.PI / 2);
  },
};
UI.H.loan = d => Bank2.borrow(+d.v);
UI.H.repay = d => Bank2.repay(d.v === 'all' ? Bank2.st().debt : +d.v);
UI.H.fbuy = d => Bank2.buy(d.k, +d.v);
UI.H.fsell = d => Bank2.sell(d.k);
UI.H.insure = () => Bank2.insure();
// statement entries for the basic account actions, and income sources
for (const [k, t, sgn] of [['deposit', 'ฝากออมทรัพย์', -1], ['withdraw', 'ถอนเงิน', 1]]) { const f = Bank[k].bind(Bank); Bank[k] = n => { const m = S.money; f(n); if (S.money !== m) Bank2.log(t, S.money - m); }; }
const _bankDay = Bank.day.bind(Bank);
Bank.day = () => { const e = Bank.st().earned || 0; _bankDay(); const g = (Bank.st().earned || 0) - e; if (g > 0) { Bank2.log('ดอกเบี้ยรับ', g); Bank2.income('ดอกเบี้ย', g); } };
