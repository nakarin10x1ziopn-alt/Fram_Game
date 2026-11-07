'use strict';
// ---------- Computer plaza in ทุ่งทอง: 45 parts and peripherals, build a PC yourself (socket / RAM / case / PSU / cooling checks)
// or let the shop assemble it; the PC at home plays games, streams, renders AI jobs for money and draws real power ----------
const PC_SLOTS = { cpu: 'ซีพียู', mobo: 'เมนบอร์ด', ram: 'แรม', gpu: 'การ์ดจอ', ssd: 'SSD', psu: 'พาวเวอร์ซัพพลาย', case: 'เคส', cool: 'ชุดระบายความร้อน' };
const PC_PARTS = {
  // CPUs: socket, watts, performance
  cpu_a3: { s: 'cpu', n: 'ซีพียู ArkCore i3 4 คอร์', i: '🧠', price: 4500, sock: 'S1700', w: 60, perf: 30 },
  cpu_a5: { s: 'cpu', n: 'ซีพียู ArkCore i5 14 คอร์', i: '🧠', price: 9900, sock: 'S1700', w: 125, perf: 62 },
  cpu_a9: { s: 'cpu', n: 'ซีพียู ArkCore i9 24 คอร์', i: '🧠', price: 21900, sock: 'S1700', w: 250, perf: 95 },
  cpu_z5: { s: 'cpu', n: 'ซีพียู Zentra 5 6 คอร์', i: '🧠', price: 7500, sock: 'Z5', w: 65, perf: 55 },
  cpu_z7: { s: 'cpu', n: 'ซีพียู Zentra 7 X3D 8 คอร์ (เกมแรงสุด)', i: '🧠', price: 17900, sock: 'Z5', w: 120, perf: 88 },
  cpu_z9: { s: 'cpu', n: 'ซีพียู Zentra 9 16 คอร์', i: '🧠', price: 24900, sock: 'Z5', w: 170, perf: 100 },
  // motherboards: socket, size, memory type
  mb_a1: { s: 'mobo', n: 'เมนบอร์ด ArkCore H610M (mATX, DDR4)', i: '🟩', price: 2900, sock: 'S1700', size: 'mATX', ddr: 4, w: 15 },
  mb_a2: { s: 'mobo', n: 'เมนบอร์ด ArkCore Z790 (ATX, DDR5)', i: '🟩', price: 8900, sock: 'S1700', size: 'ATX', ddr: 5, w: 25 },
  mb_z1: { s: 'mobo', n: 'เมนบอร์ด Zentra B650M (mATX, DDR5)', i: '🟩', price: 4500, sock: 'Z5', size: 'mATX', ddr: 5, w: 15 },
  mb_z2: { s: 'mobo', n: 'เมนบอร์ด Zentra X870E (ATX, DDR5)', i: '🟩', price: 12900, sock: 'Z5', size: 'ATX', ddr: 5, w: 25 },
  mb_z3: { s: 'mobo', n: 'เมนบอร์ด Zentra B650I (Mini-ITX, DDR5)', i: '🟩', price: 7900, sock: 'Z5', size: 'ITX', ddr: 5, w: 12 },
  // memory
  ram_4_16: { s: 'ram', n: 'แรม DDR4 16GB (8x2)', i: '📏', price: 1500, ddr: 4, perf: 4, w: 5 },
  ram_5_32: { s: 'ram', n: 'แรม DDR5 32GB (16x2) RGB', i: '📏', price: 3900, ddr: 5, perf: 8, w: 8 },
  ram_5_64: { s: 'ram', n: 'แรม DDR5 64GB (32x2)', i: '📏', price: 7900, ddr: 5, perf: 10, w: 10 },
  ram_5_128: { s: 'ram', n: 'แรม DDR5 128GB (สาย AI/เรนเดอร์)', i: '📏', price: 15900, ddr: 5, perf: 12, w: 14 },
  // graphics cards
  gpu_1: { s: 'gpu', n: 'การ์ดจอ VertexRT 3050 8GB', i: '🎮', price: 7900, w: 130, perf: 30 },
  gpu_2: { s: 'gpu', n: 'การ์ดจอ VertexRT 4060 8GB', i: '🎮', price: 10900, w: 115, perf: 45 },
  gpu_3: { s: 'gpu', n: 'การ์ดจอ Radix 7800 XT 16GB', i: '🎮', price: 17900, w: 263, perf: 65 },
  gpu_4: { s: 'gpu', n: 'การ์ดจอ VertexRT 4070 Super 12GB', i: '🎮', price: 21900, w: 220, perf: 72 },
  gpu_5: { s: 'gpu', n: 'การ์ดจอ VertexRT 4080 Super 16GB', i: '🎮', price: 37900, w: 320, perf: 88 },
  gpu_6: { s: 'gpu', n: 'การ์ดจอ VertexRT 4090 24GB (ตัวท็อป AI)', i: '🎮', price: 69900, w: 450, perf: 100 },
  // storage
  ssd_05: { s: 'ssd', n: 'SSD 512GB SATA', i: '💾', price: 1200, perf: 2, w: 3 },
  ssd_1: { s: 'ssd', n: 'SSD NVMe Gen4 1TB', i: '💾', price: 2400, perf: 5, w: 5 },
  ssd_2: { s: 'ssd', n: 'SSD NVMe Gen4 2TB', i: '💾', price: 4500, perf: 7, w: 6 },
  ssd_4: { s: 'ssd', n: 'SSD NVMe Gen5 4TB', i: '💾', price: 9900, perf: 10, w: 8 },
  // power supplies
  psu_550: { s: 'psu', n: 'พาวเวอร์ 550W 80+ Bronze', i: '🔌', price: 1500, cap: 550 },
  psu_750: { s: 'psu', n: 'พาวเวอร์ 750W 80+ Gold', i: '🔌', price: 3200, cap: 750 },
  psu_1000: { s: 'psu', n: 'พาวเวอร์ 1000W 80+ Gold ATX3.1', i: '🔌', price: 4900, cap: 1000 },
  psu_1600: { s: 'psu', n: 'พาวเวอร์ 1600W 80+ Titanium', i: '🔌', price: 12900, cap: 1600 },
  // cases
  case_m: { s: 'case', n: 'เคส mATX ทาวเวอร์เล็ก', i: '🗄️', price: 1290, fit: ['mATX', 'ITX'] },
  case_atx: { s: 'case', n: 'เคส ATX กระจกนิรภัย พัดลม RGB', i: '🗄️', price: 2490, fit: ['ATX', 'mATX', 'ITX'] },
  case_itx: { s: 'case', n: 'เคส Mini-ITX จิ๋วแต่แจ๋ว', i: '🗄️', price: 2990, fit: ['ITX'] },
  case_full: { s: 'case', n: 'เคส Full Tower ตู้ปลาโชว์การ์ดจอ', i: '🗄️', price: 5900, fit: ['ATX', 'mATX', 'ITX'] },
  // cooling (watts the cooler can take away)
  cool_air: { s: 'cool', n: 'ซิงก์ลมทาวเวอร์ (รับ 150W)', i: '❄️', price: 890, cap: 150 },
  cool_240: { s: 'cool', n: 'ชุดน้ำปิด 240mm (รับ 220W)', i: '❄️', price: 2900, cap: 220 },
  cool_360: { s: 'cool', n: 'ชุดน้ำปิด 360mm จอ LCD (รับ 300W)', i: '❄️', price: 4900, cap: 300 },
  // peripherals
  mon_24: { s: 'mon', n: 'จอ 24" 165Hz', i: '🖥️', price: 4500, perf: 1 },
  mon_27: { s: 'mon', n: 'จอ 27" 2K 180Hz', i: '🖥️', price: 8900, perf: 2 },
  mon_oled: { s: 'mon', n: 'จอ 27" OLED 240Hz', i: '🖥️', price: 22900, perf: 3 },
  kb: { s: 'per', n: 'คีย์บอร์ดเมคานิคอล RGB', i: '⌨️', price: 1890 },
  mouse: { s: 'per', n: 'เมาส์เกมมิ่งไร้สาย', i: '🖱️', price: 1290 },
  headset: { s: 'per', n: 'หูฟังเกมมิ่ง 7.1', i: '🎧', price: 1990 },
  streamkit: { s: 'per', n: 'ชุดสตรีม เว็บแคม 4K + ไมค์', i: '🎙️', price: 4900 },
  gchair: { s: 'per', n: 'เก้าอี้เกมมิ่งปรับนอนได้', i: '💺', price: 6900 },
  ups: { s: 'per', n: 'เครื่องสำรองไฟ UPS 1500VA', i: '🔋', price: 3500 },
};
for (const k in PC_PARTS) ITEMS['pc_' + k] = { n: PC_PARTS[k].n, i: PC_PARTS[k].i, cat: 'part', sell: Math.round(PC_PARTS[k].price * 0.55) };
// ready-made builds the shop picks and assembles
const PC_PRESETS = {
  office: { n: 'คอมทำงาน/เรียนออนไลน์', i: '💼', parts: ['cpu_a3', 'mb_a1', 'ram_4_16', 'gpu_1', 'ssd_05', 'psu_550', 'case_m', 'cool_air'] },
  gamer: { n: 'คอมเกมมิ่งคุ้มค่า', i: '🎮', parts: ['cpu_z5', 'mb_z1', 'ram_5_32', 'gpu_2', 'ssd_1', 'psu_750', 'case_atx', 'cool_air'] },
  stream: { n: 'คอมสตรีมเมอร์', i: '📺', parts: ['cpu_z7', 'mb_z2', 'ram_5_32', 'gpu_4', 'ssd_2', 'psu_1000', 'case_atx', 'cool_240'] },
  ai: { n: 'เวิร์กสเตชัน AI ตัวท็อป', i: '🤖', parts: ['cpu_z9', 'mb_z2', 'ram_5_128', 'gpu_6', 'ssd_4', 'psu_1600', 'case_full', 'cool_360'] },
};
const presetPrice = k => Math.round(PC_PRESETS[k].parts.reduce((s, p) => s + PC_PARTS[p].price, 0) * 0.97 + 1500);
SHOPS.pcshop = {
  n: 'คอมพิวเตอร์พลาซ่า ทุ่งทอง', tabs: [
    { n: '🧠 ซีพียู/บอร์ด', items: Object.keys(PC_PARTS).filter(k => ['cpu', 'mobo'].includes(PC_PARTS[k].s)).map(k => 'pc:' + k) },
    { n: '🎮 การ์ดจอ/แรม', items: Object.keys(PC_PARTS).filter(k => ['gpu', 'ram'].includes(PC_PARTS[k].s)).map(k => 'pc:' + k) },
    { n: '💾 SSD/พาวเวอร์/เคส/ระบายความร้อน', items: Object.keys(PC_PARTS).filter(k => ['ssd', 'psu', 'case', 'cool'].includes(PC_PARTS[k].s)).map(k => 'pc:' + k) },
    { n: '🖥️ จอ & อุปกรณ์', items: Object.keys(PC_PARTS).filter(k => ['mon', 'per'].includes(PC_PARTS[k].s)).map(k => 'pc:' + k) },
    { n: '📦 คอมประกอบสำเร็จ', items: Object.keys(PC_PRESETS).map(k => 'pcset:' + k) },
  ],
};
ENTRY_KINDS.pc = id => { const P = PC_PARTS[id]; return { icon: P.i, name: P.n, desc: PC.desc(P), price: P.price, multi: false, own: count('pc_' + id), buy: () => addItem('pc_' + id, 1) }; };
ENTRY_KINDS.pcset = id => { const P = PC_PRESETS[id]; return { icon: P.i, name: P.n + ' (ร้านประกอบให้)', desc: P.parts.map(p => PC_PARTS[p].n).join(' · ') + ` · คะแนน ~${PC.score(P.parts)}`, price: presetPrice(id), block: (S.pcs || []).length >= 4 ? 'มีคอมครบ 4 เครื่องแล้ว' : '', buy: () => PC.addPC(P.n, P.parts.slice(), true) }; };
FURN.pcdesk = { n: 'โต๊ะคอมพิวเตอร์ประกอบเอง', i: '🖥️', price: 2500 }; MOVABLE.push('pcdesk');

const PC = {
  sel: {},
  desc(P) {
    const D = { cpu: () => `ซ็อกเก็ต ${P.sock} · ${P.w}W · ประสิทธิภาพ ${P.perf}`, mobo: () => `ซ็อกเก็ต ${P.sock} · ขนาด ${P.size} · ใช้แรม DDR${P.ddr}`, ram: () => `DDR${P.ddr}`, gpu: () => `${P.w}W · ประสิทธิภาพ ${P.perf}`, ssd: () => 'ยิ่งเร็วโหลดงานยิ่งไว', psu: () => `จ่ายไฟได้ ${P.cap}W`, case: () => `ใส่บอร์ด ${P.fit.join('/')}`, cool: () => `ระบายความร้อน CPU ได้ ${P.cap}W`, mon: () => 'จำเป็นสำหรับเล่นเกม/สตรีม จอดียิ่งได้ผู้ชมมาก', per: () => P.price > 4000 ? 'ช่วยให้สตรีม/ทำงานได้ผลดีขึ้น' : 'อุปกรณ์เสริมเกมเมอร์' };
    const t = D[P.s]();
    return t + ' · มีชิ้นส่วนในกระเป๋าแล้วไปประกอบที่โต๊ะประกอบคอม';
  },
  watts(parts) { return parts.reduce((s, p) => s + (PC_PARTS[p].w || 0), 0) + 40; },
  score(parts) { const g = s => { const k = parts.find(p => PC_PARTS[p].s === s); return k ? PC_PARTS[k].perf || 0 : 0; }; return Math.round((g('cpu') * 0.42 + g('gpu') * 0.48 + g('ram') * 0.6 + g('ssd') * 0.4) * 100); },
  check(sel) {
    const P = k => sel[k] && PC_PARTS[sel[k]], miss = Object.keys(PC_SLOTS).filter(k => !sel[k]);
    if (miss.length) return 'ยังขาด: ' + miss.map(k => PC_SLOTS[k]).join(', ');
    if (P('cpu').sock !== P('mobo').sock) return `ซีพียูซ็อกเก็ต ${P('cpu').sock} ใส่บอร์ด ${P('mobo').sock} ไม่ได้!`;
    if (P('ram').ddr !== P('mobo').ddr) return `บอร์ดนี้ใช้แรม DDR${P('mobo').ddr} แต่แรมเป็น DDR${P('ram').ddr}`;
    if (!P('case').fit.includes(P('mobo').size)) return `เคสนี้ใส่บอร์ดขนาด ${P('mobo').size} ไม่ได้`;
    if (P('cool').cap < P('cpu').w) return `ซีพียูร้อน ${P('cpu').w}W แต่ชุดระบายรับได้แค่ ${P('cool').cap}W`;
    const w = this.watts(Object.values(sel)); if (P('psu').cap < w * 1.2) return `ไฟไม่พอ! ทั้งเครื่องกิน ~${w}W ควรใช้พาวเวอร์อย่างน้อย ${Math.ceil(w * 1.2 / 50) * 50}W`;
    return '';
  },
  // ----- building station (shop counter or the desk at home) -----
  builder(atShop) {
    this.atShop = atShop;
    UI.open('โต๊ะประกอบคอมพิวเตอร์', null, () => {
      for (const k in this.sel) if (!count('pc_' + this.sel[k])) delete this.sel[k];
      const sel = this.sel, err = this.check(sel), parts = Object.values(sel).filter(Boolean);
      return `<p class="lead">เลือกชิ้นส่วนที่มีในกระเป๋าทีละช่อง ระบบจะตรวจความเข้ากันได้ให้ · ${atShop ? 'ให้ร้านประกอบให้ 1,500 ฿ (เสร็จทันที รับประกัน)' : 'ประกอบเองฟรี ใช้เวลา 2 ชม.'}</p>
        <div class="grid">${Object.entries(PC_SLOTS).map(([s, n]) => { const own = Object.keys(PC_PARTS).filter(k => PC_PARTS[k].s === s && count('pc_' + k) > 0); return `<div class="card"><div class="ci">${sel[s] ? PC_PARTS[sel[s]].i : '⬜'}</div><div class="cb"><h4>${n}</h4><p class="dim">${sel[s] ? esc(PC_PARTS[sel[s]].n) : 'ยังไม่ได้เลือก'}</p><div class="row">${own.length ? own.map(k => `<button class="btn ${sel[s] === k ? '' : 'ghost'}" data-a="pcsel" data-s="${s}" data-v="${k}">${esc(PC_PARTS[k].n.replace(/^(ซีพียู|เมนบอร์ด|แรม|การ์ดจอ|พาวเวอร์|เคส) /, ''))}</button>`).join('') : '<span class="dim">ไม่มีในกระเป๋า (ซื้อที่คอมพิวเตอร์พลาซ่า)</span>'}</div></div></div>`; }).join('')}</div>
        <p class="lead">${parts.length ? `กินไฟรวม ~${this.watts(parts)}W · คะแนนคาดการณ์ ${this.score(parts)}` : ''} ${err ? `<b class="bad">⚠️ ${err}</b>` : '<b class="good">✅ ทุกชิ้นเข้ากันได้ พร้อมประกอบ!</b>'}</p>
        <div class="row"><button class="btn" data-a="pcbuild" ${err || (atShop && S.money < 1500) ? 'disabled' : ''}>${atShop ? 'ให้ร้านประกอบ (1,500 ฿)' : '🔧 ประกอบเอง'}</button><button class="btn ghost" data-a="pcclear">ล้างการเลือก</button></div>
        ${(S.pcs || []).length ? `<h5>คอมของฉัน</h5><ul class="lead">${S.pcs.map((p, i) => `<li>${esc(p.name)} · คะแนน ${p.score} <button class="btn ghost" data-a="pctear" data-i="${i}">ถอดชิ้นส่วนคืน</button></li>`).join('')}</ul>` : ''}`;
    }, { wide: true });
  },
  build() {
    const sel = this.sel, err = this.check(sel); if (err) return;
    const parts = Object.values(sel);
    if (parts.some(p => !count('pc_' + p))) { for (const k in sel) if (!count('pc_' + sel[k])) delete sel[k]; UI.toast('ชิ้นส่วนบางชิ้นไม่อยู่ในกระเป๋าแล้ว เลือกใหม่อีกครั้ง', '⚠️'); UI.renderBody(); return; } if ((S.pcs || []).length >= 4) { UI.toast('มีคอมครบ 4 เครื่องแล้ว', '🖥️'); return; }
    if (this.atShop) { if (S.money < 1500) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(1500), '💸'); return; } S.money -= 1500; }
    for (const p of parts) takeItem('pc_' + p);
    this.sel = {}; UI.close();
    const self = !this.atShop;
    fade(() => {
      tick(self ? 120 : 30); if (self) useEnergy(5);
      // a first self-build sometimes needs a second try (forgot the CPU power cable) but never breaks parts
      if (self && !S.pcSkill && Math.random() < 0.35) { S.pcSkill = 1; for (const p of parts) addItem('pc_' + p); UI.toast('เปิดไม่ติด! ลืมเสียบสายไฟ CPU 8 พิน ลองประกอบใหม่อีกครั้งนะ (ประสบการณ์ +1)', '😅'); return; }
      S.pcSkill = (S.pcSkill || 0) + 1;
      this.addPC(self ? 'คอมประกอบเองเครื่องที่ ' + ((S.pcs || []).length + 1) : 'คอมร้านประกอบ', parts, !self);
    });
  },
  addPC(name, parts, shop) {
    S.pcs = S.pcs || []; const sc = this.score(parts);
    S.pcs.push({ name, parts, score: sc, w: this.watts(parts) });
    if (!S.furn.pcdesk) { S.furn.pcdesk = 1; World.buildInterior(S.up.house, S); World.interior.visible = G.inside; }
    Prog.add(30); Life2.note(`${shop ? 'ซื้อ' : 'ประกอบ'}คอมพิวเตอร์ คะแนน ${sc}`);
    UI.toast(`เปิดติดแล้ว! คะแนนทดสอบ ${U.fmt(sc)} ${sc > 8000 ? '(แรงระดับท็อป)' : sc > 5000 ? '(เล่นเกมลื่น)' : '(ทำงานทั่วไป)'} โต๊ะคอมอยู่ในบ้าน`, '🖥️');
  },
  tear(i) { const p = (S.pcs || [])[+i]; if (!p) return; for (const k of p.parts) addItem('pc_' + k); S.pcs.splice(+i, 1); UI.toast('ถอดชิ้นส่วนเก็บเข้ากระเป๋าแล้ว อัปเกรดแล้วประกอบใหม่ได้', '🔧'); },
  best() { return (S.pcs || []).reduce((a, b) => (!a || b.score > a.score ? b : a), null); },
  has(k) { return count('pc_' + k) > 0; },
  monitor() { return ['mon_oled', 'mon_27', 'mon_24'].find(k => this.has(k)); },
  // ----- using the PC at home -----
  homeUI() {
    const pc = this.best();
    if (!pc) { this.builder(false); return; }
    UI.open('คอมพิวเตอร์ที่บ้าน', null, () => {
      const mon = this.monitor(), fans = S.fans || 0, busy = S.pcJob && S.pcJob.until > S.day * 1440 + S.time;
      return `<p class="lead">🖥️ ${esc(pc.name)} · คะแนน ${U.fmt(pc.score)} · กินไฟ ${pc.w}W${mon ? ' · ' + PC_PARTS[mon].n : ' · ⚠️ ยังไม่มีจอ'} · ผู้ติดตามช่อง ${U.fmt(fans)} คน</p>
        <div class="grid">
        <div class="card"><div class="ci">🎮</div><div class="cb"><h4>เล่นเกม 1 ชม.</h4><p class="dim">อารมณ์ +${10 + Math.round(pc.score / 1000)} (ยิ่งคอมแรงยิ่งสนุก)</p><div class="row"><button class="btn" data-a="pcuse" data-v="game" ${mon && !S.powerOff ? '' : 'disabled'}>เล่น</button></div></div></div>
        <div class="card"><div class="ci">📺</div><div class="cb"><h4>ไลฟ์สตรีมเกม 2 ชม.</h4><p class="dim">ต้องมีชุดสตรีม · รายได้ตามผู้ติดตามและสเปก</p><div class="row"><button class="btn" data-a="pcuse" data-v="stream" ${mon && this.has('streamkit') && !S.powerOff && S.streamDay !== S.day ? '' : 'disabled'}>เริ่มไลฟ์</button></div></div></div>
        <div class="card"><div class="ci">🤖</div><div class="cb"><h4>รับงานเรนเดอร์/เทรน AI</h4><p class="dim">เครื่องทำงานเอง 8 ชม. ได้เงินตามการ์ดจอ กินไฟเต็มที่ ${busy ? '· กำลังทำงานอยู่' : ''}</p><div class="row"><button class="btn" data-a="pcuse" data-v="ai" ${busy || S.powerOff ? 'disabled' : ''}>ส่งงานเข้าเครื่อง</button></div></div></div>
        <div class="card"><div class="ci">🔧</div><div class="cb"><h4>อัปเกรด/ประกอบเครื่องใหม่</h4><p class="dim">ถอดชิ้นส่วนแล้วเปลี่ยนเป็นตัวแรงขึ้น</p><div class="row"><button class="btn ghost" data-a="pcbuilder">เปิดโต๊ะประกอบ</button></div></div></div></div>`;
    });
  },
  use(v) {
    const pc = this.best(); if (!pc) return;
    if (v === 'game') { UI.close(); fade(() => { tick(60); S.mood = Math.min(100, (S.mood || 50) + 10 + Math.round(pc.score / 1000)); UI.toast(`เล่นเกม${U.pick(['แข่งรถ', 'ยิงปืน', 'ทำฟาร์ม', 'ผจญภัย'])}มันส์มาก! ลื่นไหล ${Math.min(240, Math.round(pc.score / 40))} FPS`, '🎮'); }); }
    if (v === 'stream') {
      if (S.streamDay === S.day) return; S.streamDay = S.day; UI.close();
      fade(() => {
        tick(120); useEnergy(8);
        const mon = PC_PARTS[this.monitor()].perf, gain = Math.round((pc.score / 200 + mon * 6 + (this.has('gchair') ? 5 : 0) + (this.has('headset') ? 3 : 0)) * (0.7 + Math.random() * 0.6));
        S.fans = (S.fans || 0) + gain; const pay = Math.round(80 + S.fans * 1.6 + pc.score / 40 * (typeof Fut !== 'undefined' && Fut.has('fiber') ? 1.3 : 1));
        earn(pay); Bank2.income('ไลฟ์สตรีม', pay); S.mood = Math.min(100, (S.mood || 50) + 6); Prog.add(15);
        UI.toast(`ไลฟ์จบ! ผู้ติดตามใหม่ +${gain} (รวม ${U.fmt(S.fans)}) ได้เงินโดเนท/โฆษณา ${baht(pay)}`, '📺');
      });
    }
    if (v === 'ai') { S.pcJob = { until: S.day * 1440 + S.time + 480, pay: Math.round(pc.score / 10 * (0.8 + Math.random() * 0.4)), w: pc.w }; UI.toast(`ส่งงานแล้ว เครื่องจะทำงาน 8 ชม. ค่าจ้างประมาณ ${baht(S.pcJob.pay)}`, '🤖'); }
  },
  // AI/render job finishes in the background; it draws power from the house grid while it runs
  load() { const j = S.pcJob; return j && j.until > S.day * 1440 + S.time ? j.w / 1000 : 0; },
  hourCheck() {
    const j = S.pcJob; if (!j || j.until > S.day * 1440 + S.time) return;
    if (window.PCAcc176 ? (PCAcc176.dark() && !PCAcc176.jobOk()) : (Power.st().trip || (S.powerOff && !this.has('ups')))) { S.pcJob = null; Phone.msg('งานเรนเดอร์ AI', 'ไฟดับระหว่างทำงาน งานเสียหาย (ซื้อ UPS กันไฟดับได้)', true); return; }
    S.pcJob = null; earn(j.pay); Bank2.income('งานเรนเดอร์ AI', j.pay); Phone.msg('งานเรนเดอร์ AI', `งานเสร็จแล้ว ลูกค้าโอนเงิน ${baht(j.pay)}`, false);
  },
  day() { this.hourCheck(); if (S.fans > 50) { const ad = Math.round(S.fans * 0.15); earn(ad); Bank2.income('รายได้โฆษณาช่อง', ad); } },
  // the desk inside the house
  place(W, has, placeK, w, d) {
    if (!has('pcdesk')) return;
    const g = new THREE.Group(), wood = mc(0x37474f, { roughness: 0.5 });
    U.mk(g, GEO.box, wood, [0, 0.74, 0], [1.4, 0.05, 0.7]); for (const sx of [-1, 1]) U.mk(g, GEO.box, wood, [sx * 0.66, 0.37, 0], [0.05, 0.74, 0.65]);
    U.mk(g, GEO.box, mc(0x111111), [0, 1.1, -0.22], [0.75, 0.42, 0.04]); U.mk(g, GEO.box, new THREE.MeshBasicMaterial({ color: 0x4fc3f7, toneMapped: false }), [0, 1.1, -0.195], [0.7, 0.37, 0.01]);
    U.mk(g, GEO.box, mc(0x212121), [0.55, 0.98, -0.1], [0.22, 0.45, 0.45]); U.mk(g, GEO.box, new THREE.MeshBasicMaterial({ color: 0xe040fb, toneMapped: false }), [0.43, 0.98, -0.1], [0.01, 0.4, 0.4]);
    placeK('pcdesk', g, w / 2 - 0.45, 0, -Math.PI / 2, 0.4, 0.75, { kind: 'act', icon: '🖥️', label: 'ใช้คอมพิวเตอร์ประกอบเอง', act: () => ({ icon: '🖥️', label: 'ใช้คอมพิวเตอร์ประกอบเอง', fn: () => this.homeUI() }) });
  },
  init() {
    // Computer plaza at the north end of ทุ่งทอง's street, plus the assembly counter
    const cx = 170, cz = -268, x = cx - 11, z = cz + 32, rot = Math.PI / 2;
    const o = { w: 9, d: 8, h: 6, rows: 2, roofH: 2.2, wall: 0xe3f2fd, roof: 0x0d47a1, sign: 'คอมพิวเตอร์พลาซ่า', signStyle: { bg: '#0d47a1' }, awning: 0x42a5f5, glassFront: true };
    const b = World.building(o); b.position.set(x, World.groundY(x, z), z); b.rotation.y = rot; World.outdoor.add(b); Col.box(x, z, o.w / 2 + 0.3, o.d / 2 + 0.3, rot, 'bld'); World.clearNear(x, z, 7, true);
    const door = l2w(x, z, rot, 0, o.d / 2 + 1.7);
    World.pois.push({ kind: 'shop', id: 'pcshop', x: door.x, z: door.z - 1.2, r: 2.2, label: 'คอมพิวเตอร์พลาซ่า', icon: '🖥️', map: true });
    World.pois.push({ kind: 'act', x: door.x, z: door.z + 1.3, r: 2.0, label: 'เคาน์เตอร์ประกอบคอม', icon: '🔧', act: () => ({ icon: '🔧', label: 'เคาน์เตอร์ประกอบคอม / ตรวจสเปก', fn: () => this.builder(true) }) });
    Power.extra.push(() => this.load());
  },
};
Object.assign(UI.H, {
  pcsel: d => { PC.sel[d.s] = PC.sel[d.s] === d.v ? null : d.v; if (!PC.sel[d.s]) delete PC.sel[d.s]; },
  pcclear: () => { PC.sel = {}; }, pcbuild: () => PC.build(), pctear: d => PC.tear(d.i),
  pcuse: d => PC.use(d.v), pcbuilder: () => { UI.close(); PC.builder(false); },
});
// furniture from this module and the future-tech module goes into the house with the smart-home devices
{ const _sp = Smart.place.bind(Smart); Smart.place = (W, has, placeK, w, d) => { _sp(W, has, placeK, w, d); PC.place(W, has, placeK, w, d); if (typeof Fut !== 'undefined') Fut.place(W, has, placeK, w, d); }; }
