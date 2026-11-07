'use strict';
// ---------- Companies on the map (buildings you can walk into, with staff, racks and chargers that match what you bought),
// B2B contracts you price and build in the network planner, cyber security incidents, and a stock market with
// investor rounds and an IPO for your own company ----------
const CO_SPOTS = {
  office: [{ x: 226, z: -262, rot: -Math.PI / 2 }, { x: 226, z: -238, rot: -Math.PI / 2 }],
  shop: [{ x: -152, z: -392, rot: Math.PI / 2 }, { x: -152, z: -372, rot: Math.PI / 2 }],
  land: [{ x: -136, z: -470, rot: Math.PI / 2 }, { x: -136, z: -500, rot: Math.PI / 2 }],
  factory: [{ x: -72, z: -472, rot: -Math.PI / 2 }, { x: -72, z: -504, rot: -Math.PI / 2 }],
};
for (const L of Object.values(CO_SPOTS)) for (const p of L) FLAT_PADS.push({ x: p.x, z: p.z, r: 14 });
ROOM_KIND.office = { w: 14, d: 11, floor: 0xcfd8dc, wall: 0xf5f5f5, title: 'สำนักงาน' };

const CoMap = {
  g: {},
  spotOf(c) {
    if (!c.site || c.site === 'home') return null;
    const used = Company.list().filter(o => o !== c && o.site === c.site && o.spot != null).map(o => o.spot);
    if (c.spot == null) { const i = CO_SPOTS[c.site].findIndex((_, k) => !used.includes(k)); if (i < 0) return null; c.spot = i; }
    return CO_SPOTS[c.site][c.spot];
  },
  draw(c) {
    if (this.g[c.id]) { World.outdoor.remove(this.g[c.id].g); this.g[c.id].cols.forEach(x => Col.remove(x)); const i = World.pois.indexOf(this.g[c.id].poi); if (i >= 0) World.pois.splice(i, 1); delete this.g[c.id]; }
    if (!['setup', 'open'].includes(c.st)) return;
    const p = this.spotOf(c); if (!p) return;
    const T = CO_TYPES[c.type], g = new THREE.Group(), y = World.groundY(p.x, p.z); g.position.set(p.x, y, p.z); g.rotation.y = p.rot; World.outdoor.add(g);
    const big = c.site === 'factory' || c.site === 'land', o = big ? { w: 16, d: 12, h: 6, flat: true, wall: 0xeceff1, roof: 0x607d8b, glassFront: true } : { w: 10, d: 8, h: c.site === 'office' ? 9 : 5, rows: 2, flat: true, glassFront: true, wall: 0xfafafa, roof: 0x90a4ae };
    const b = World.building(o); g.add(b); World.clearNear(p.x, p.z, 12, true);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(o.w * 0.8, 0.9), new THREE.MeshStandardMaterial({ map: U.signTex(`${T.i} ${c.name}`, { w: 1024, h: 112, bg: c.st === 'open' ? '#1565c0' : '#757575' }) })); sign.position.set(0, o.h + 0.9, o.d / 2 + 0.06); g.add(sign);
    // what the business owns shows outside: chargers under a canopy, generator, rooftop AC units
    if (c.type === 'ev') { const n = (c.eq.evdc || 0) + (c.eq.evac || 0); if (c.eq.canopy) { U.mk(g, GEO.box, mc(0x00897b), [0, 4.2, o.d / 2 + 6], [Math.max(6, n * 3.2), 0.3, 6]); for (const sx of [-1, 1]) U.mk(g, GEO.box, M.trim, [sx * Math.max(3, n * 1.6) * 0.9, 2.1, o.d / 2 + 6], [0.25, 4.2, 0.25]); } for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * 3.2; U.mk(g, GEO.box, mc(i < (c.eq.evdc || 0) ? 0x263238 : 0xeceff1), [x, 1, o.d / 2 + 6], [0.8, 2, 0.5]); U.mk(g, GEO.box, new THREE.MeshBasicMaterial({ color: 0x00e5ff, toneMapped: false }), [x, 1.5, o.d / 2 + 6.26], [0.5, 0.3, 0.02]); } }
    if (c.eq.gen) U.mk(g, GEO.box, mc(0xf9a825), [o.w / 2 + 2, 1.1, 0], [2, 2.2, 4.5]);
    if (c.type === 'dc') for (let i = 0; i < 4; i++) U.mk(g, GEO.box, mc(0xb0bec5), [-o.w / 2 + 2 + i * 3.5, o.h + 0.8, -2], [2.2, 1.2, 1.6]);
    const cols = [Col.box(p.x, p.z, o.w / 2 + 0.3, o.d / 2 + 0.3, p.rot, 'bld')];
    const door = l2w(p.x, p.z, p.rot, 0, o.d / 2 + 1.7);
    const poi = { kind: 'act', x: door.x, z: door.z, r: 2.6, label: c.name, icon: T.i, map: true, act: () => ({ icon: '🚪', label: 'เข้าไปใน ' + c.name, fn: () => Rooms.enter(poi) }) };
    poi.room = { kind: 'office', title: c.name, coId: c.id, staff: { name: c.staff[0] ? c.staff[0].name : 'พนักงานต้อนรับ', avatar: 'toon:jacket' }, service: () => { Company.sel = c.id; Company.open(); } };
    World.pois.push(poi); this.g[c.id] = { g, cols, poi };
  },
  drawAll() { for (const c of Company.st().list) this.draw(c); },
  // inside: desks for every employee, server racks for every installed rack, the boss's desk opens the company screen
  room(def, K) {
    const c = Company.get(def.coId); if (!c) return; const g = Rooms.group, X = RM0.x, Z = RM0.z, W = K.w, D = K.d;
    const desk = mc(0x8d6e63), scr = new THREE.MeshBasicMaterial({ color: 0x4fc3f7, toneMapped: false });
    c.staff.slice(0, 12).forEach((s, i) => {
      const x = -W / 2 + 2 + (i % 4) * 3.2, z = -1.5 + Math.floor(i / 4) * 2.6;
      U.mk(g, GEO.box, desk, [X + x, 0.75, Z + z], [1.6, 0.06, 0.8]); U.mk(g, GEO.box, mc(0x212121), [X + x, 1.05, Z + z - 0.3], [0.6, 0.4, 0.04]); U.mk(g, GEO.box, scr, [X + x, 1.05, Z + z - 0.28], [0.55, 0.35, 0.01]);
      const h = Models.human({ avatar: People.avatarFor(s.name, i) }); h.position.set(X + x, 0, Z + z + 0.6); h.rotation.y = Math.PI; g.add(h); Rooms.staff.push(h);
    });
    const racks = Sec.site('co:' + c.id).dev.filter(d => DEV[d.k].t === 'rack').length;
    for (let i = 0; i < racks; i++) { U.mk(g, GEO.box, mc(0x212121, { roughness: 0.4 }), [X + W / 2 - 1, 1.1, Z - D / 2 + 1.2 + i * 0.9], [0.8, 2.2, 0.7]); for (let k = 0; k < 6; k++) U.mk(g, GEO.box, new THREE.MeshBasicMaterial({ color: k % 2 ? 0x69f0ae : 0x40c4ff, toneMapped: false }), [X + W / 2 - 1.41, 0.4 + k * 0.3, Z - D / 2 + 1.2 + i * 0.9], [0.01, 0.03, 0.3]); }
    U.mk(g, GEO.box, mc(0x5d4037), [X, 0.8, Z - D / 2 + 1.5], [2.6, 0.08, 1.1]);
    Rooms.pois.push({ kind: 'act', x: X, z: Z - D / 2 + 2.8, r: 1.6, label: 'โต๊ะผู้บริหาร', icon: '💼', act: () => ({ icon: '💼', label: `บริหาร ${c.name}`, fn: () => { Company.sel = c.id; Company.open(); } }) });
    World.inPois = Rooms.pois;
  },
};
{ const _b = Rooms.build.bind(Rooms); Rooms.build = (def, K) => { _b(def, K); if (def.kind === 'office') CoMap.room(def, K); }; }

// ===== B2B contracts =====
const JOB_SPECS = {
  sec: [
    { n: 'ร้านสะดวกซื้อ ติดกล้อง 4 ตัว + NVR ดูผ่านมือถือได้', cams: 4, days: 7, remote: 1, price: 38000, len: 3 },
    { n: 'โรงเรียนบ้านสุขใจ ติดกล้อง 8 ตัว บันทึกย้อนหลัง 14 วัน', cams: 8, days: 14, price: 85000, len: 4 },
    { n: 'โรงงานผลไม้อบแห้ง กล้อง 16 ตัว + ระบบกันขโมย', cams: 16, days: 14, alarm: 1, remote: 1, price: 210000, len: 6 },
    { n: 'คลินิกทุ่งทอง WiFi ทั่วอาคาร (AP 3 ตัว) + กล้อง 4 ตัว', cams: 4, aps: 3, days: 7, price: 62000, len: 3 },
  ],
  it: [{ n: 'ระบบจองคิวออนไลน์ให้โรงพยาบาล', price: 180000, len: 6, devs: 2 }, { n: 'แอปสั่งอาหารให้ร้านในเมือง', price: 95000, len: 4, devs: 2 }, { n: 'ระบบบัญชีให้โรงสีข้าว', price: 140000, len: 5, devs: 3 }],
  solar: [{ n: 'โซลาร์บ้านลูกค้า 5 kWp', price: 160000, len: 2, cost: 0.62 }, { n: 'โซลาร์หลังคาโรงงาน 100 kWp', price: 2600000, len: 8, cost: 0.7, eng: 1 }, { n: 'เครื่องชาร์จ EV 22 kW ให้คอนโด 4 จุด', price: 260000, len: 3, cost: 0.55 }],
};
const B2B = {
  offers(c) { const L = JOB_SPECS[c.type]; if (!L) return []; c.offers = c.offers && c.offers.day === S.day ? c.offers : { day: S.day, list: L.slice().sort(() => Math.random() - 0.5).slice(0, 2) }; return c.offers.list; },
  accept(c, i, bid) {
    const J = this.offers(c)[i]; if (!J || (c.jobs || []).length >= 3) { UI.toast('รับงานพร้อมกันได้ไม่เกิน 3 งาน', '📋'); return; }
    // the lower the bid, the more likely you win the tender
    const win = U.clamp(1.25 - bid, 0.1, 0.9) + c.rep / 400; if (Math.random() > win) { UI.toast(`แพ้การประมูล "${J.n}" (คู่แข่งเสนอราคาต่ำกว่า)`, '📉'); c.offers.list.splice(i, 1); return; }
    const job = { id: 'j' + (++Company.st().n), n: J.n, spec: J, price: Math.round(J.price * bid), due: S.day + J.len, start: S.day };
    (c.jobs = c.jobs || []).push(job); c.offers.list.splice(i, 1);
    Phone.msg(c.name, `ชนะการประมูล "${J.n}" มูลค่า ${baht(job.price)} ต้องส่งมอบภายใน${RD(job.due)}${c.type === 'sec' ? ' — ติดตั้งอุปกรณ์ตามสเปกในผังเครือข่ายของไซต์งานลูกค้า แล้วกดส่งมอบ' : ''}`);
  },
  check(c, job) {
    const J = job.spec, out = [];
    if (c.type === 'sec') { const s = Sec.status(job.id); if (s.rec < J.cams) out.push(`กล้องที่บันทึกได้ ${s.rec}/${J.cams}`); if (J.days && s.days < J.days) out.push(`บันทึกย้อนหลัง ${s.days.toFixed(1)}/${J.days} วัน`); if (J.remote && !s.remoteOK) out.push('ลูกค้าดูผ่านมือถือยังไม่ได้'); if (J.alarm && !s.alarm) out.push('ยังไม่มีระบบกันขโมย'); if (J.aps && Sec.site(job.id).dev.filter(d => DEV[d.k].t === 'ap').length < J.aps) out.push(`Access Point ${J.aps} ตัว`); }
    if (c.type === 'it' && c.staff.filter(s => s.r === 'dev').length < J.devs) out.push(`ต้องมีโปรแกรมเมอร์ ${J.devs} คน`);
    if (c.type === 'solar' && J.eng && !c.staff.some(s => s.r === 'eng')) out.push('งานขนาดนี้ต้องมีวิศวกรเซ็นแบบ');
    if (c.type !== 'sec' && S.day < job.start + Math.ceil(J.len * 0.6)) out.push(`งานยังไม่เสร็จ (ต้องใช้อย่างน้อย ${Math.ceil(J.len * 0.6)} วัน)`);
    return out;
  },
  deliver(c, jid) {
    const job = (c.jobs || []).find(j => j.id === jid); if (!job) return; const bad = this.check(c, job);
    if (bad.length) { UI.toast('ลูกค้ายังไม่รับงาน: ' + bad.join(' · '), '📋'); return; }
    const late = Math.max(0, S.day - job.due), fine = Math.round(job.price * Math.min(0.3, late * 0.05)), cost = job.spec.cost ? Math.round(job.price * job.spec.cost) : 0;
    c.cash += job.price - fine - cost; Company.book(c, job.price, fine + cost); c.rep = Math.min(100, c.rep + 4 - late);
    if (c.type === 'sec') { const site = Sec.site(job.id); site.dev = []; }
    c.jobs.splice(c.jobs.indexOf(job), 1); Phone.msg(c.name, `ส่งมอบ "${job.n}" แล้ว รับเงิน ${baht(job.price)}${fine ? ` หักค่าปรับส่งช้า ${baht(fine)}` : ''}${cost ? ` ต้นทุนวัสดุ ${baht(cost)}` : ''}`);
  },
  day() { for (const c of Company.list()) for (const j of c.jobs || []) if (S.day === j.due + 3) { c.rep = Math.max(0, c.rep - 10); Phone.msg(c.name, `ลูกค้าทวงงาน "${j.n}" ช้ากว่ากำหนด 3 วัน ชื่อเสียงบริษัทลดลง`, true); } },
  html(c) {
    if (!JOB_SPECS[c.type] || c.st !== 'open') return '';
    return `<h5>📑 งานประมูลจากลูกค้าวันนี้</h5><div class="grid">${this.offers(c).map((J, i) => `<div class="card"><div class="ci">📑</div><div class="cb"><h4>${esc(J.n)}</h4><p class="dim">ราคากลาง ${baht(J.price)} · ส่งมอบใน ${J.len} วัน</p><div class="row">${[0.85, 0.95, 1.05].map(b => `<button class="btn ghost" data-a="b2bbid" data-v="${c.id}" data-i="${i}" data-k="${b}">เสนอ ${baht(Math.round(J.price * b))}</button>`).join('')}</div></div></div>`).join('') || '<p class="dim">วันนี้ไม่มีงานใหม่</p>'}</div>
      ${(c.jobs || []).length ? `<h5>🛠️ งานที่กำลังทำ</h5>${c.jobs.map(j => { const bad = this.check(c, j); return `<div class="card"><div class="ci">🛠️</div><div class="cb"><h4>${esc(j.n)}</h4><p class="${S.day > j.due ? 'bad' : 'dim'}">${baht(j.price)} · กำหนดส่ง${RD(j.due)}${bad.length ? ' · ยังขาด: ' + esc(bad.join(', ')) : ' · ✅ พร้อมส่งมอบ'}</p><div class="row">${c.type === 'sec' ? `<button class="btn ghost" data-a="b2bsite" data-v="${j.id}">วางระบบที่ไซต์ลูกค้า</button>` : ''}<button class="btn" data-a="b2bdone" data-v="${c.id}" data-k="${j.id}">ส่งมอบงาน</button></div></div></div>`; }).join('')}` : ''}`;
  },
};
// customer sites show up in the network planner while the job runs
{ const _sn = Sec.siteName.bind(Sec); Sec.siteName = id => { if (id.startsWith('j')) { for (const c of Company.list()) { const j = (c.jobs || []).find(x => x.id === id); if (j) return 'ไซต์ลูกค้า: ' + j.n.slice(0, 24); } } return _sn(id); }; }
{ const _hn = Sec.hasNet.bind(Sec); Sec.hasNet = id => id.startsWith('j') ? true : _hn(id); const _up = Sec.upMbps.bind(Sec); Sec.upMbps = id => id.startsWith('j') ? 200 : _up(id); }

// ===== cyber security =====
const Cyber = {
  st(site) { const s = Sec.st(); s.cy = s.cy || {}; return s.cy[site] || (s.cy[site] = { pwd: 0, fw: 0, backup: 0 }); },
  harden(site, k) { const c = this.st(site); if (!useEnergy(4)) return; fade(() => { tick(30); if (k === 'pwd') c.pwd = 1; if (k === 'fw') c.fw = S.day; UI.toast(k === 'pwd' ? 'เปลี่ยนรหัสผ่านค่าเริ่มต้นของเราเตอร์/กล้อง/NVR แล้ว' : 'อัปเดตเฟิร์มแวร์ทุกอุปกรณ์แล้ว ปิดช่องโหว่ล่าสุด', '🔐'); }); },
  risk(site) { const c = this.st(site), L = Sec.site(site).dev; if (!L.some(d => ['router', 'firewall', 'nvr'].includes(DEV[d.k].t))) return 0; let r = 0.05; if (!c.pwd) r += 0.15; if (S.day - (c.fw || -99) > 21) r += 0.07; if (L.some(d => DEV[d.k].t === 'firewall')) r *= 0.3; return r; },
  week() {
    for (const site of ['home'].concat(Company.list().map(c => 'co:' + c.id))) {
      if (Math.random() >= this.risk(site)) continue;
      const L = Sec.site(site).dev, nas = L.some(d => DEV[d.k].t === 'nas' && L.some(h => h.p === d.uid)), c = site.startsWith('co:') ? Company.get(site.slice(3)) : null;
      const kind = c && ['it', 'dc'].includes(c.type) ? 'ransom' : U.pick(['cam', 'ransom']);
      if (kind === 'cam') { this.st(site).pwd = 0; Phone.msg('แจ้งเตือนความปลอดภัย', `มีคนแปลกหน้าเข้าดูกล้องวงจรปิดที่${Sec.siteName(site)} เพราะยังใช้รหัสผ่านค่าเริ่มต้น! เปลี่ยนรหัสผ่านในผังเครือข่ายด่วน`, true); }
      else if (nas) Phone.msg('แจ้งเตือนความปลอดภัย', `มัลแวร์เรียกค่าไถ่เข้ารหัสไฟล์ที่${Sec.siteName(site)} แต่กู้คืนจาก NAS สำรองได้ทั้งหมด ไม่เสียเงินสักบาท`, true);
      else { const loss = c ? Math.round(Math.max(50000, c.cash * 0.08)) : 5000; if (c) { c.cash -= loss; Company.book(c, 0, loss); c.rep = Math.max(0, c.rep - 12); } else S.money = Math.max(0, S.money - loss); Phone.msg('แจ้งเตือนความปลอดภัย', `โดนมัลแวร์เรียกค่าไถ่ที่${Sec.siteName(site)} ไม่มีข้อมูลสำรอง ต้องจ้างกู้ระบบ เสียหาย ${baht(loss)} (ติด NAS สำรองข้อมูลและไฟร์วอลล์เพื่อป้องกัน)`, true); }
    }
    if (Math.random() < 0.35) Phone.msg('ธนาคารสุขใจ (?)', 'บัญชีของท่านถูกระงับ กรุณายืนยันตัวตนที่ลิงก์ bit.ly/suk-jai-bank ภายใน 24 ชม. — ⚠️ นี่คือข้อความหลอกลวง ธนาคารจริงไม่ส่งลิงก์ให้กรอกรหัส', true);
  },
  html(site) { const c = this.st(site), r = this.risk(site); return `<h5>🔐 ความปลอดภัยไซเบอร์</h5><p class="lead">ความเสี่ยงต่อสัปดาห์ ~${Math.round(r * 100)}% · รหัสผ่าน ${c.pwd ? '✅ เปลี่ยนแล้ว' : '❌ ยังเป็นค่าเริ่มต้น'} · เฟิร์มแวร์ ${S.day - (c.fw || -99) <= 21 ? '✅ ล่าสุด' : '❌ เก่า'} · ข้อมูลสำรอง ${Sec.site(site).dev.some(d => DEV[d.k].t === 'nas') ? '✅ มี NAS' : '❌ ไม่มี'}</p><div class="row"><button class="btn ghost" data-a="cyb" data-v="${site}" data-k="pwd">เปลี่ยนรหัสผ่านทุกอุปกรณ์</button><button class="btn ghost" data-a="cyb" data-v="${site}" data-k="fw">อัปเดตเฟิร์มแวร์</button></div>`; },
};
{ const _ui = Sec.ui.bind(Sec); Sec.ui = (site = 'home') => { _ui(site); const r = UI.cur.render; UI.cur.render = t => r(t) + Cyber.html(Sec.cur); UI.renderBody(); }; }

// ===== stock market, investors and IPO =====
const STOCKS = {
  SKJ: { n: 'สุขใจอะโกร (SKJ)', p: 24, sec: 'เกษตร', div: 0.04 }, TTB: { n: 'ทุ่งทองแบงก์ (TTB)', p: 41, sec: 'ธนาคาร', div: 0.05 },
  PPE: { n: 'ภูผาพลังงาน (PPE)', p: 18, sec: 'พลังงาน', div: 0.03 }, EVX: { n: 'อีวีเอ็กซ์มอเตอร์ (EVX)', p: 55, sec: 'ยานยนต์', div: 0 },
  CLD: { n: 'สุขใจคลาวด์ (CLD)', p: 88, sec: 'เทคโนโลยี', div: 0.01 }, MRT: { n: 'สุขใจมาร์ทรีเทล (MRT)', p: 32, sec: 'ค้าปลีก', div: 0.035 },
  FDX: { n: 'ฟู้ดเอ็กซ์ปอร์ต (FDX)', p: 27, sec: 'อาหาร', div: 0.04 }, CON: { n: 'สุขใจก่อสร้าง (CON)', p: 12, sec: 'ก่อสร้าง', div: 0.02 },
};
const Stock = {
  st() { if (!S.stk) { S.stk = { px: {}, hold: {}, cost: {}, hist: {} }; for (const k in STOCKS) { S.stk.px[k] = STOCKS[k].p; S.stk.hist[k] = [STOCKS[k].p]; } } return S.stk; },
  fee(v) { return Math.max(50, Math.round(v * 0.00157 * 1.07)); },
  day() {
    const s = this.st(), mkt = (Math.random() - 0.48) * 0.02, news = Math.random() < 0.3 ? U.pick(Object.keys(STOCKS)) : null;
    for (const k in STOCKS) { let r = mkt + (Math.random() - 0.5) * 0.05; if (k === news) r += (Math.random() < 0.5 ? -1 : 1) * (0.05 + Math.random() * 0.08); s.px[k] = Math.max(0.5, +(s.px[k] * (1 + r)).toFixed(2)); (s.hist[k] = s.hist[k] || []).push(s.px[k]); if (s.hist[k].length > 20) s.hist[k].shift(); }
    if (news) Phone.msg('ข่าวหุ้น', `${STOCKS[news].n} ${s.px[news] > s.hist[news].at(-2) ? 'ประกาศกำไรดีกว่าคาด หุ้นพุ่ง 📈' : 'มีข่าวลบ หุ้นร่วง 📉'}`, false);
    for (const c of Company.list()) if (c.listed) { const pe = c.ytd > 0 ? 12 : 8, fair = Math.max(1, (c.cash + Math.max(0, c.ytd) * pe) / c.shares); c.px = +(U.lerp(c.px, fair, 0.15) * (1 + (Math.random() - 0.5) * 0.06)).toFixed(2); }
  },
  week() { const s = this.st(); let d = 0; for (const k in s.hold) if (s.hold[k] > 0 && STOCKS[k].div) d += s.hold[k] * s.px[k] * STOCKS[k].div / 12; d = Math.round(d * 0.9); if (d > 0) { earn(d); Bank2.income('เงินปันผลหุ้น (หัก 10%)', d); } },
  trade(k, n) {
    const s = this.st(), px = s.px[k], v = Math.round(Math.abs(n) * px), f = this.fee(v);
    if (n > 0) { if (S.money < v + f) { UI.toast('เงินไม่พอ', '💸'); return; } S.money -= v + f; s.hold[k] = (s.hold[k] || 0) + n; s.cost[k] = (s.cost[k] || 0) + v + f; Bank2.log('ซื้อหุ้น ' + k, -(v + f)); }
    else { const q = Math.min(-n, s.hold[k] || 0); if (!q) return; const val = Math.round(q * px), fee = this.fee(val); s.cost[k] = (s.cost[k] || 0) * (1 - q / s.hold[k]); s.hold[k] -= q; earn(val - fee); Bank2.income('ขายหุ้น ' + k, val - fee); }
  },
  html() {
    const s = this.st(), own = Company.list().filter(c => c.listed);
    return `<p class="lead">📈 ตลาดหุ้นสุขใจ · ซื้อขายขั้นต่ำ 100 หุ้น · ค่าคอม 0.157% + VAT (ขั้นต่ำ 50 ฿) · ปันผลเข้าทุกเดือน (หักภาษี 10%)</p><table class="tbl"><tr><th>หุ้น</th><th>ราคา</th><th>เปลี่ยนแปลง</th><th>ถือ</th><th>กำไร/ขาดทุน</th><th></th></tr>${Object.entries(STOCKS).map(([k, X]) => { const h = s.hist[k], ch = h.length > 1 ? (s.px[k] / h.at(-2) - 1) * 100 : 0, held = s.hold[k] || 0, pl = held ? Math.round(held * s.px[k] - s.cost[k]) : 0; return `<tr><td>${X.n}<br><small class="dim">${X.sec} · ปันผล ${Math.round(X.div * 100)}%/ปี</small></td><td>${s.px[k].toFixed(2)}</td><td class="${ch >= 0 ? 'good' : 'bad'}">${ch >= 0 ? '+' : ''}${ch.toFixed(1)}%</td><td>${held}</td><td class="${pl >= 0 ? 'good' : 'bad'}">${held ? baht(pl) : '-'}</td><td><button class="btn ghost" data-a="stk" data-v="${k}" data-k="100">ซื้อ 100</button><button class="btn ghost" data-a="stk" data-v="${k}" data-k="1000">ซื้อ 1,000</button>${held ? `<button class="btn ghost" data-a="stk" data-v="${k}" data-k="-${held}">ขายหมด</button>` : ''}</td></tr>`; }).join('')}</table>
      ${own.map(c => `<p class="lead">🏢 ${esc(c.name)} จดทะเบียนในตลาดแล้ว ราคา ${c.px.toFixed(2)} ฿ · คุณถือ ${Math.round(c.mine * 100)}% · มูลค่าตลาด ${baht(Math.round(c.px * c.shares))}</p>`).join('')}`;
  },
  // raising money: sell a slice of your company to a fund, or list it on the exchange
  vc(c) { if (c.st !== 'open' || c.ytd < 500000) { UI.toast('นักลงทุนต้องการเห็นกำไรสะสมปีนี้อย่างน้อย 500,000 ฿ ก่อน', '🤝'); return; } if ((c.mine ?? 1) <= 0.6) { UI.toast('คุณถือหุ้นเหลือน้อยแล้ว ไม่ควรขายเพิ่ม', '🤝'); return; } const val = Math.max(c.cap, c.ytd * 8), cash = Math.round(val * 0.2); c.mine = (c.mine ?? 1) - 0.2; c.cash += cash; c.paid += cash; Phone.msg(c.name, `กองทุนร่วมลงทุนให้มูลค่ากิจการ ${baht(Math.round(val))} ลงเงิน ${baht(cash)} แลกหุ้น 20%`); },
  ipo(c) {
    const need = [[c.st === 'open', 'บริษัทเปิดดำเนินการ'], [c.paid >= 20e6, `ทุนชำระแล้ว ≥ 20 ล้าน (มี ${baht(c.paid)})`], [c.ytd >= 3e6, `กำไรปีนี้ ≥ 3 ล้าน (มี ${baht(Math.round(c.ytd))})`], [c.lic.vat, 'จด VAT และมีผู้สอบบัญชีรับอนุญาต'], [c.staff.length >= 10, `พนักงาน ≥ 10 คน (มี ${c.staff.length})`]];
    const miss = need.filter(x => !x[0]); if (miss.length) { UI.toast('ยังเข้าตลาดไม่ได้: ' + miss.map(x => x[1]).join(' · '), '🔔'); return; }
    const fee = 1500000; if (c.cash < fee) { UI.toast('ค่าที่ปรึกษาการเงินและค่าธรรมเนียม 1.5 ล้าน', '💸'); return; }
    c.cash -= fee; c.shares = Math.round(c.paid); c.px = Math.max(1, (c.ytd * 15) / c.shares); const raise = Math.round(c.px * c.shares * 0.25); c.cash += raise; c.mine = (c.mine ?? 1) * 0.75; c.listed = 1;
    Life2.note(`${c.name} เข้าจดทะเบียนในตลาดหลักทรัพย์! 🔔`); Phone.msg('ตลาดหลักทรัพย์สุขใจ', `ยินดีด้วย ${c.name} เริ่มซื้อขายวันนี้ ราคา IPO ${c.px.toFixed(2)} ฿ ระดมทุนได้ ${baht(raise)}`, true);
  },
};
APPS.splice(9, 0, { id: 'stock', i: '📈', n: 'หุ้น' });
Phone.apps.stock = () => Stock.html();
{ const _h = Company.html.bind(Company); Company.html = t => { let s = _h(t); if (t !== 1) { const c = Company.get(Company.sel); if (c && ['setup', 'open'].includes(c.st)) s = s.replace('<div class="row"><button class="btn danger" data-a="coclose"', `${B2B.html(c)}<h5>💹 ระดมทุน</h5><div class="row"><button class="btn ghost" data-a="covc" data-v="${c.id}">ขายหุ้น 20% ให้กองทุน</button><button class="btn ghost" data-a="coipo" data-v="${c.id}" ${c.listed ? 'disabled' : ''}>${c.listed ? 'อยู่ในตลาดหุ้นแล้ว' : 'ยื่นเข้าตลาดหลักทรัพย์ (IPO)'}</button><span class="dim">คุณถือหุ้น ${Math.round((c.mine ?? 1) * 100)}%</span></div><div class="row"><button class="btn danger" data-a="coclose"`); } return s; }; }
Object.assign(UI.H, {
  b2bbid: d => B2B.accept(Company.get(d.v), +d.i, +d.k), b2bdone: d => B2B.deliver(Company.get(d.v), d.k), b2bsite: d => { UI.close(); Sec.ui(d.v); },
  cyb: d => { UI.close(); Cyber.harden(d.v, d.k); }, stk: d => Stock.trade(d.v, +d.k), covc: d => Stock.vc(Company.get(d.v)), coipo: d => Stock.ipo(Company.get(d.v)),
});
// company buildings appear when a company is registered or changes
{ const _d = Company.day.bind(Company); Company.day = () => { _d(); B2B.day(); Stock.day(); CoMap.drawAll(); }; const _w = Company.week.bind(Company); Company.week = () => { _w(); Cyber.week(); Stock.week(); }; }
// network planner lists customer sites of running jobs
{ const _l = Company.list.bind(Company); Sec.jobSites = () => _l().flatMap(c => (c.jobs || []).map(j => j.id)); }
