'use strict';
// ---------- Set E: weekly missions, achievements, online leaderboard, mine treasure, flood season, disaster relief ----------
const MISSIONS = [
  { k: 'harvest', n: 'เก็บเกี่ยวผลผลิต', i: '🧺', goal: () => 25 + S.lvl * 3, reward: 1200 },
  { k: 'sold', n: 'ขายของ', i: '💰', goal: () => 40 + S.lvl * 5, reward: 1200 },
  { k: 'fish', n: 'ตกปลา', i: '🎣', goal: () => 6, reward: 900 },
  { k: 'cooked', n: 'ทำอาหาร', i: '🍳', goal: () => 4, reward: 900 },
  { k: 'earned', n: 'หารายได้ (บาท)', i: '📈', goal: () => 4000 + S.lvl * 800, reward: 1500 },
  { k: 'planted', n: 'ปลูกผัก', i: '🌱', goal: () => 20, reward: 800 },
];
// 50 achievements: [id, name, icon, test]
const ACH = [
  ['h10', 'มือใหม่หัดเก็บ', '🌱', s => s.stats.harvest >= 10], ['h100', 'ชาวไร่ขยัน', '🧺', s => s.stats.harvest >= 100], ['h500', 'เซียนเก็บเกี่ยว', '🏅', s => s.stats.harvest >= 500], ['h2000', 'ราชาแห่งไร่', '👑', s => s.stats.harvest >= 2000],
  ['s50', 'พ่อค้าแม่ค้า', '💵', s => s.stats.sold >= 50], ['s500', 'นักขายมือทอง', '💰', s => s.stats.sold >= 500], ['e10k', 'หมื่นแรก', '🪙', s => s.stats.earned >= 10000], ['e100k', 'เศรษฐีบ้านนา', '💎', s => s.stats.earned >= 100000], ['e1m', 'เศรษฐีล้านบาท', '🏦', s => s.stats.earned >= 1000000],
  ['lv5', 'เลเวล 5', '⭐', s => s.lvl >= 5], ['lv10', 'เลเวล 10', '🌟', s => s.lvl >= 10], ['lv15', 'เลเวล 15', '✨', s => s.lvl >= 15],
  ['f1', 'ปลาตัวแรก', '🐟', s => (s.stats.fish || 0) >= 1], ['f50', 'นักตกปลา', '🎣', s => (s.stats.fish || 0) >= 50], ['f200', 'เทพเบ็ดทอง', '🐋', s => (s.stats.fish || 0) >= 200],
  ['c10', 'แม่ครัวหัวป่าก์', '🍳', s => (s.stats.cooked || 0) >= 10], ['c100', 'เชฟประจำบ้าน', '👩‍🍳', s => (s.stats.cooked || 0) >= 100],
  ['a1', 'สัตว์ตัวแรก', '🐔', s => s.animals.length >= 1], ['a8', 'ฟาร์มปศุสัตว์', '🐄', s => s.animals.length >= 8], ['pet', 'เพื่อนซี้สี่ขา', '🐕', s => !!s.pet],
  ['car1', 'มีรถคันแรก', '🚗', s => s.cars.length >= 1], ['car3', 'นักสะสมรถ', '🏎️', s => s.cars.length >= 3], ['lic', 'ผู้ขับขี่มีใบอนุญาต', '🪪', s => !!s.license], ['tune', 'สายซิ่ง', '🔧', s => s.cars.some(c => c.tune && c.tune.engine >= 3)],
  ['house2', 'บ้านหลังใหม่', '🏠', s => s.up.house >= 2], ['house3', 'คฤหาสน์ในไร่', '🏡', s => s.up.house >= 3], ['furn5', 'นักแต่งบ้าน', '🛋️', s => Object.keys(s.furn).length >= 5], ['furn12', 'บ้านในฝัน', '🏰', s => Object.keys(s.furn).length >= 12],
  ['friend', 'มีเพื่อนสนิท', '🤝', s => Object.values(s.friends).some(v => v >= 6)], ['popular', 'คนดังประจำหมู่บ้าน', '🎉', s => Object.values(s.friends).filter(v => v >= 5).length >= 8],
  ['date', 'รักแรกพบ', '💕', s => s.rel && !!s.rel.partner], ['wed', 'วิวาห์หวาน', '💒', s => s.rel && s.rel.stage === 'married'], ['kid', 'พ่อแม่มือใหม่', '👶', s => s.rel && s.rel.kids.length >= 1], ['kid3', 'ครอบครัวใหญ่', '👨‍👩‍👧‍👦', s => s.rel && s.rel.kids.length >= 3],
  ['race', 'นักแข่งดาวรุ่ง', '🏁', s => s.contest && s.contest.best.race && s.contest.best.race < 30], ['win3', 'แชมป์ 3 สมัย', '🏆', s => s.contest && s.contest.wins >= 3],
  ['mine10', 'นักขุดชั้นลึก', '⛏️', s => (s.mineMax || 0) >= 10], ['dia', 'เพชรเม็ดงาม', '💎', s => !!s.found.diamond],
  ['rice', 'ข้าวหอมมะลิของเรา', '🌾', s => !!s.found.rice], ['fact', 'เจ้าของโรงงาน', '🏭', s => !!(s.found.chili_paste || s.found.tomato_sauce || s.found.rice_cracker)], ['hands', 'นายจ้างใจดี', '👷', s => s.f2 && s.f2.hands >= 2],
  ['bank', 'นักออม', '🐷', s => s.bank && s.bank.sav >= 20000], ['fund', 'นักลงทุน', '📈', s => s.bank && Object.values(s.bank.funds || {}).some(v => v >= 5000)], ['debt', 'ปลอดหนี้', '✅', s => s.bank && s.bank.log && s.bank.log.some(l => l.t === 'ชำระหนี้') && !s.bank.debt],
  ['caught', 'มือปราบขโมย', '🚓', s => s.emerg && s.emerg.caught >= 1], ['fire', 'วีรบุรุษดับเพลิง', '🚒', s => s.emerg && s.emerg.fires >= 3],
  ['merit', 'สายบุญ', '🙏', s => s.s2 && s.s2.merit >= 5000], ['travel', 'นักเดินทาง', '🧳', s => (s.diary || []).some(d => d.t.includes('ดอยสุขใจ')) && (s.diary || []).some(d => d.t.includes('เกาะสุขใจ'))],
  ['art', 'ศิลปินบ้านทุ่ง', '🎨', s => s.hob && s.hob.paint >= 10], ['music', 'นักดนตรีเปิดหมวก', '🎸', s => s.hob && s.hob.music >= 10],
];
const BOARD_LABEL = { earned: 'รายได้รวมสูงสุด', lvl: 'เลเวลสูงสุด', ach: 'ความสำเร็จมากที่สุด', race: 'เวลาแข่งรถดีที่สุด' };
GOODS.sandbag = { n: 'กระสอบทรายกันน้ำ', i: '🧱', price: 60, desc: 'วางที่หน้าฟาร์ม 10 กระสอบ กันน้ำท่วมแปลงผักได้ทั้งฤดู' };
ITEMS.sandbag = { n: 'กระสอบทรายกันน้ำ', i: '🧱', cat: 'tool' }; TOOLS.sandbag = { n: GOODS.sandbag.n, i: '🧱', price: 60, desc: GOODS.sandbag.desc };
SHOPS.farmshop.tabs[1].items.push('tool:sandbag');

const Events = {
  st() { if (!S.ev) S.ev = { week: 0, base: {}, claimed: {}, ach: {}, flood: 0, bags: 0, relief: 0 }; return S.ev; },
  init() {
    this.st(); this.newWeek(true);
    World.pois.push({ kind: 'act', x: 3, z: -55, r: 2.2, label: 'แนวกระสอบทราย', icon: '🧱', act: () => ({ icon: '🧱', label: this.st().bags >= 10 ? `กระสอบทรายพร้อมกันน้ำ (${this.st().bags})` : `วางกระสอบทราย (มี ${count('sandbag')} ต้องใช้ 10)`, fn: () => this.placeBags() }) });
    World.pois.push({ kind: 'act', x: -25.5, z: -241, r: 2.4, label: 'ศาลากลางหมู่บ้าน', icon: '🛖', act: () => ({ icon: '🛖', label: (this.st().relief >= S.day) ? 'จุดรับบริจาค/ช่วยผู้ประสบภัย' : 'ศาลากลางหมู่บ้าน (นั่งพัก)', fn: () => (this.st().relief >= S.day) ? this.reliefUI() : UI.toast('นั่งพักใต้ศาลา ลมเย็นสบาย', '🛖') }) });
    this.bagG = new THREE.Group(); World.outdoor.add(this.bagG); this.drawBags();
    // treasure chests on mine floors
    const build = Mine.build.bind(Mine);
    Mine.build = n => { build(n); this.treasure(n); };
    this.achT = 0;
  },
  // ----- weekly missions -----
  weekNo() { return Math.floor((S.day - 1) / 7); },
  newWeek(keep) {
    const e = this.st(), w = this.weekNo();
    if (keep && e.week === w && e.list) return;
    e.week = w; e.claimed = {}; e.base = Object.assign({}, S.stats);
    e.list = MISSIONS.slice().sort(() => Math.random() - 0.5).slice(0, 4).map(m => ({ k: m.k, goal: m.goal() }));
  },
  prog(m) { return Math.max(0, (S.stats[m.k] || 0) - (this.st().base[m.k] || 0)); },
  missionsHTML() {
    const e = this.st();
    return `<p class="lead">ภารกิจสัปดาห์ที่ ${e.week + 1} · รีเซ็ตทุก 7 วัน (อีก ${7 - ((S.day - 1) % 7)} วัน)</p><div class="grid">${e.list.map((m, i) => { const M_ = MISSIONS.find(x => x.k === m.k), p = Math.min(m.goal, this.prog(m)); return `<div class="card"><div class="ci">${M_.i}</div><div class="cb"><h4>${M_.n} ${U.fmt(p)}/${U.fmt(m.goal)}</h4><div class="prog"><i style="width:${p / m.goal * 100}%"></i></div><div class="row"><button class="btn" data-a="mclaim" data-i="${i}" ${p >= m.goal && !e.claimed[i] ? '' : 'disabled'}>${e.claimed[i] ? 'รับแล้ว' : 'รับรางวัล ' + baht(M_.reward)}</button></div></div></div>`; }).join('')}</div>`;
  },
  claim(i) { const e = this.st(), m = e.list[i], M_ = MISSIONS.find(x => x.k === m.k); if (e.claimed[i] || this.prog(m) < m.goal) return; e.claimed[i] = 1; earn(M_.reward); Bank2.income('ภารกิจรายสัปดาห์', M_.reward); Prog.add(50); UI.toast(`ภารกิจสำเร็จ! +${baht(M_.reward)}`, '🎯'); },
  // ----- achievements -----
  checkAch() {
    const e = this.st();
    for (const [id, n, i, t] of ACH) if (!e.ach[id]) { let ok = false; try { ok = t(S); } catch (x) { } if (ok) { e.ach[id] = S.day; earn(300); Prog.add(25); UI.toast(`ปลดล็อกความสำเร็จ: ${n} (+300 ฿)`, i); Life2.note('ปลดล็อกความสำเร็จ "' + n + '"'); Sfx.goal && Sfx.goal(); } }
  },
  achHTML() { const e = this.st(), n = Object.keys(e.ach).length; return `<p class="lead">ปลดล็อกแล้ว ${n}/${ACH.length} · ทุกอันได้ 300 ฿</p><div class="prog"><i style="width:${n / ACH.length * 100}%"></i></div><div class="grid">${ACH.map(([id, nm, i]) => `<div class="card" style="${e.ach[id] ? '' : 'opacity:.45'}"><div class="ci">${e.ach[id] ? i : '🔒'}</div><div class="cb"><h4>${nm}</h4><p class="dim">${e.ach[id] ? 'ได้เมื่อวันที่ ' + e.ach[id] : 'ยังไม่ปลดล็อก'}</p></div></div>`).join('')}</div>`; },
  // ----- online leaderboard (server.py) -----
  pushScore() {
    if (!Net.on) return;
    Net.api('board', { id: Net.id(), name: S.name || 'ชาวไร่', earned: S.stats.earned, lvl: S.lvl, ach: Object.keys(this.st().ach).length, race: S.contest && S.contest.best.race || 0 }).then(b => { this.board = b; }).catch(() => {});
  },
  boardView() {
    if (!Net.on) return '<p class="empty">ต้องเปิดเกมผ่านเซิร์ฟเวอร์ (start-server.bat) เพื่อดูอันดับออนไลน์</p>';
    const b = this.board; if (!b) { this.pushScore(); return '<p class="lead">กำลังโหลดอันดับ... เปิดหน้านี้ใหม่อีกครั้ง</p>'; }
    return Object.keys(BOARD_LABEL).map(k => `<h5>🏆 ${BOARD_LABEL[k]}</h5><ol class="lead">${(b[k] || []).map(r => `<li>${esc(r.name)} — ${k === 'race' ? (+r.v).toFixed(2) + ' วิ' : U.fmt(r.v)}${r.id === Net.id() ? ' (คุณ)' : ''}</li>`).join('') || '<li>ยังไม่มีข้อมูล</li>'}</ol>`).join('');
  },
  // ----- mine treasure -----
  treasure(n) {
    const R = U.rng(n * 31 + S.day * 7); if (R() > 0.3 + n * 0.02) return;
    S.treasure = S.treasure || {}; if (S.treasure[n] === S.day) return;
    const x = (R() - 0.5) * 16, z = (R() - 0.5) * 16, g = new THREE.Group(); g.position.set(x, 0, z); Mine.group.add(g);
    U.mk(g, GEO.box, mc(0x6d4c41), [0, 0.3, 0], [0.9, 0.6, 0.6]); U.mk(g, GEO.box, mc(0xe0b13a, { metalness: 0.6, roughness: 0.3 }), [0, 0.62, 0], [0.95, 0.08, 0.65]);
    const poi = { kind: 'act', x: MINE0.x + x, z: MINE0.z + z, r: 1.4, label: 'หีบสมบัติ', icon: '🎁' };
    poi.act = () => ({ icon: '🎁', label: 'เปิดหีบสมบัติ', fn: () => {
      (S.treasure = S.treasure || {})[n] = S.day; Mine.group.remove(g); Mine.pois.splice(Mine.pois.indexOf(poi), 1); World.inPois = Mine.pois;
      const r = Math.random(), cash = 200 + n * 120; earn(cash);
      const gem = r < 0.15 ? 'diamond' : r < 0.4 ? 'ruby' : r < 0.7 ? 'amethyst' : 'gold'; addItem(gem);
      UI.toast(`เจอสมบัติ! ได้ ${baht(cash)} และ${ITEMS[gem].n}`, '🎁'); S.treasures = (S.treasures || 0) + 1; Sfx.coin();
    } });
    Mine.pois.push(poi); World.inPois = Mine.pois;
  },
  // ----- floods & relief -----
  placeBags() { const need = 10 - this.st().bags; if (need <= 0) return; const n = Math.min(need, count('sandbag')); if (!n || !takeItem('sandbag', n)) { UI.toast('ซื้อกระสอบทรายที่ร้านเกษตร', '🧱'); return; } this.st().bags += n; playAct('plant', 1); this.drawBags(); UI.toast(this.st().bags >= 10 ? 'วางกระสอบทรายครบแล้ว พร้อมรับน้ำ!' : `วางแล้ว ${this.st().bags}/10`, '🧱'); },
  drawBags() { const g = this.bagG; while (g.children.length) g.remove(g.children[0]); const m = mc(0xbca27a, { roughness: 1 }); for (let i = 0; i < this.st().bags; i++) U.mk(g, GEO.sph, m, [-4.5 + i, 0.18, -56.5], [0.55, 0.22, 0.32]); },
  day() {
    const e = this.st();
    if (this.weekNo() !== e.week) this.newWeek();
    // floods only in the rainy season, announced a day ahead
    if (e.flood === S.day) {
      if (e.bags >= 10) { UI.toast('น้ำท่วมทั้งหมู่บ้าน แต่กระสอบทรายกันแปลงผักไว้ได้!', '🧱'); Life2.note('รอดน้ำท่วมเพราะเตรียมกระสอบทราย'); }
      else { let lost = 0; S.plots.forEach((p, i) => { if (p.c && Math.random() < 0.35) { Bank2.claim('น้ำท่วมแปลงผัก', CROPS[p.c].sell * 2); p.c = null; p.g = 0; p.f = 0; lost++; } }); for (const a of S.animals) a.happy = Math.max(0, (a.happy ?? 50) - 20); G.plots.forEach((_, i) => refreshPlot(i)); Phone.msg('เตือนภัย', `น้ำท่วมไร่! ผักเสียหาย ${lost} แปลง สัตว์เครียด เตรียมกระสอบทรายครั้งหน้านะ`); Life2.note('น้ำท่วมไร่ ผักเสียหาย ' + lost + ' แปลง'); }
      e.relief = S.day + 2; Phone.msg('ผู้ใหญ่บ้าน', 'หมู่บ้านโดนน้ำท่วม ใครมีอาหารหรือเงินช่วยบริจาคได้ที่ศาลากลางหมู่บ้าน หรือมาช่วยซ่อมบ้านกันนะ', true);
    }
    if (season().id === 'rain' && e.flood < S.day && Math.random() < 0.18) { e.flood = S.day + 1; Phone.msg('กรมอุตุนิยมวิทยา', 'พรุ่งนี้ฝนตกหนักมาก มีโอกาสน้ำท่วม! วางกระสอบทรายหน้าฟาร์มให้ครบ 10 กระสอบ'); }
    if (season().id !== 'rain' && e.bags) { e.bags = 0; this.drawBags(); }
    this.pushScore();
  },
  reliefUI() {
    const e = this.st(); if (!(e.relief >= S.day)) { UI.toast('ตอนนี้หมู่บ้านไม่มีเหตุภัยพิบัติ', '🛖'); return; }
    UI.open('ช่วยเหลือผู้ประสบภัย', null, () => `<p class="lead">ผู้ใหญ่บ้าน: “ขอบคุณที่มาช่วยนะ ทุกความช่วยเหลือมีค่ามาก”</p><div class="grid">
      <div class="card"><div class="ci">🍱</div><div class="cb"><h4>บริจาคอาหาร 5 ชิ้น</h4><p class="dim">ความสนิทกับชาวบ้านทุกคน +0.3</p><div class="row"><button class="btn" data-a="relief" data-v="food">บริจาค</button></div></div></div>
      <div class="card"><div class="ci">💵</div><div class="cb"><h4>บริจาคเงิน 2,000 ฿</h4><p class="dim">ความสนิทกับชาวบ้านทุกคน +0.3 · อารมณ์ +15</p><div class="row"><button class="btn" data-a="relief" data-v="money" ${S.money >= 2000 ? '' : 'disabled'}>บริจาค</button></div></div></div>
      <div class="card"><div class="ci">🔨</div><div class="cb"><h4>ช่วยซ่อมบ้าน 3 ชม.</h4><p class="dim">พลังงาน 25 · ความสนิท +0.5 · ค่าประสบการณ์ +60</p><div class="row"><button class="btn" data-a="relief" data-v="work">ไปช่วย</button></div></div></div></div>`);
  },
  relief(v) {
    if (S.reliefDone === S.day) { UI.toast('ช่วยไปแล้ววันนี้ ขอบคุณมาก', '🙏'); return; }
    if (v === 'food') { const ids = Object.keys(S.inv).filter(k => (ITEMS[k].cat === 'crop' || ITEMS[k].cat === 'dish') && S.inv[k] > 0); if (ids.reduce((t, k) => t + count(k), 0) < 5) { UI.toast('อาหารไม่พอ 5 ชิ้น', '🍱'); return; } let n = 5; for (const k of ids) while (n > 0 && count(k)) { takeItem(k); n--; } }
    if (v === 'money') { if (S.money < 2000) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(2000), '💸'); return; } S.money -= 2000; S.mood = Math.min(100, (S.mood || 50) + 15); }
    if (v === 'work') { if (!useEnergy(25)) return; UI.close(); fade(() => tick(180)); Prog.add(60); }
    S.reliefDone = S.day; for (const n of G.npcs) if (!n.staff && S.friends[n.name] != null) Friends.add(n.name, v === 'work' ? 0.5 : 0.3);
    UI.toast('ชาวบ้านซาบซึ้งในน้ำใจของคุณมาก!', '🙏'); Life2.note('ช่วยเหลือผู้ประสบภัยน้ำท่วม');
  },
  tick(dt) { if ((this.achT -= dt) > 0) return; this.achT = 3; this.checkAch(); },
};
UI.H.mclaim = d => Events.claim(+d.i);
UI.H.relief = d => Events.relief(d.v);
