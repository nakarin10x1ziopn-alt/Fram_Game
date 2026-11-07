'use strict';
// ---------- v25_civic: government offices, big stores and public facilities for the far cities. Every building stands on a free civic/mall lot reserved by
// v25_town.js, has a walk-in room, and its counters open the same Gov24 offices as the district hall (documents, expiry, fees, opening hours).
// Large cities get a full civic centre, medium cities a district centre, small towns a municipal office and a post office. ----------
V23.add('civic25', () => {
  const kit = window.V23Kit; if (!kit || !window.V25) return;
  const st = () => (S.v25 = S.v25 || {});
  const once = k => { const s = st(); s.d = s.d || {}; if (s.d[k] === S.day) return false; s.d[k] = S.day; return true; };
  const GOV = () => window.Gov24;
  const hold = () => !!(window.Cal24 && Cal24.isHoliday && Cal24.isHoliday(S.day));

  // ----- 1. government offices close on public holidays (24-hour offices stay open) -----
  if (GOV() && GOV().offices) for (const off of GOV().offices) {
    if (off.hrs && off.hrs.all) continue;
    const base = off.hrs; let shut = null;
    Object.defineProperty(off, 'hrs', { configurable: true, get() { if (!hold()) return base; return shut || (shut = { wd: [0, 0], sat: [0, 0], sun: [0, 0], hol: 1 }); }, set(v) { /* fixed */ } });
  }

  // ----- 2. public facilities with real services -----
  const museumFacts = [
    'ไทยเป็นผู้ส่งออกข้าวรายใหญ่ของโลกมาหลายสิบปี ข้าวหอมมะลิเป็นสินค้าส่งออกชื่อดัง',
    'พืชตระกูลถั่วช่วยตรึงไนโตรเจนในดิน จึงใช้ปลูกหมุนเวียนเพื่อบำรุงดินได้',
    'พระราชพิธีจรดพระนังคัลแรกนาขวัญเป็นพิธีเริ่มต้นฤดูกาลทำนาของไทย',
    'ผึ้งและแมลงช่วยผสมเกสร ทำให้ผลไม้และผักหลายชนิดติดผล',
    'ฝนตกชุกทำให้ดินแฉะ ควรระวังโรครากเน่าของพืช และระบายน้ำให้ดี',
    'ปุ๋ยหมักจากเศษพืชช่วยคืนอินทรียวัตถุให้ดินและลดต้นทุนปุ๋ยเคมี',
  ];
  const museum = () => {
    if (!once('museum')) { UI.toast('วันนี้เข้าชมพิพิธภัณฑ์ไปแล้ว พรุ่งนี้มีนิทรรศการใหม่', '🏛️'); return; }
    if (S.money < 80) { st().d.museum = 0; UI.toast('ตั๋วเข้าชม 80 ฿ เงินไม่พอ', '💸'); return; }
    S.money -= 80; tick(75); S.mood = Math.min(100, (S.mood || 50) + 8); Prog.add(12);
    UI.toast('ชมนิทรรศการ: ' + museumFacts[S.day % museumFacts.length], '🏛️'); Life2.note('เข้าชมพิพิธภัณฑ์');
  };
  const stadium = () => {
    const d = (S.day - 1) % 7, match = d >= 5 && S.time >= 14 * 60 && S.time < 20 * 60;
    if (match) {
      if (!once('match')) { UI.toast('วันนี้ดูการแข่งขันไปแล้ว', '🏟️'); return; }
      if (S.money < 150) { st().d.match = 0; UI.toast('ตั๋วเข้าชม 150 ฿ เงินไม่พอ', '💸'); return; }
      S.money -= 150; tick(120); S.mood = Math.min(100, (S.mood || 50) + 14); S.energy = Math.max(0, S.energy - 5); Prog.add(8);
      UI.toast('เชียร์ทีมท้องถิ่นสนั่นสนาม! อารมณ์ดีขึ้นมาก', '🏟️'); return;
    }
    if (!once('track')) { UI.toast('วันนี้วิ่งออกกำลังกายที่สนามไปแล้ว', '🏃'); return; }
    if (!useEnergy(10)) { st().d.track = 0; return; }
    tick(45); S.fit = Math.min(30, (S.fit || 0) + 1); S.mood = Math.min(100, (S.mood || 50) + 4);
    UI.toast('วิ่งรอบลู่ 45 นาที ร่างกายแข็งแรงขึ้น (แมตช์แข่งจัดวันเสาร์-อาทิตย์ 14:00–20:00)', '🏃');
  };
  const SEM = [['เกษตรอัจฉริยะและการจัดการน้ำ', 'ใช้ระบบน้ำและสมาร์ตฟาร์มให้คุ้มค่า'], ['ความปลอดภัยไซเบอร์สำหรับธุรกิจ', 'อัปเดตเฟิร์มแวร์ รหัสผ่านและสำรองข้อมูล'], ['บัญชีและภาษีสำหรับผู้ประกอบการ', 'ยื่นภาษีตรงเวลา เก็บใบเสร็จ แยกบัญชีส่วนตัวกับธุรกิจ']];
  const seminar = () => {
    const d = (S.day - 1) % 7; if (d > 4) { UI.toast('ศูนย์ประชุมจัดสัมมนาวันจันทร์–ศุกร์ 09:00–16:00', '🎤'); return; }
    if (S.time < 9 * 60 || S.time >= 16 * 60) { UI.toast('สัมมนาเปิดรอบ 09:00–16:00', '🕒'); return; }
    if (!once('sem')) { UI.toast('วันนี้เข้าร่วมสัมมนาไปแล้ว', '🎤'); return; }
    if (S.money < 1200) { st().d.sem = 0; UI.toast('ค่าลงทะเบียนสัมมนา 1,200 ฿ เงินไม่พอ', '💸'); return; }
    const t = SEM[Math.floor((S.day - 1) / 7) % SEM.length];
    S.money -= 1200; tick(240); Prog.add(30); S.mood = Math.min(100, (S.mood || 50) + 3); st().sem = (st().sem || 0) + 1;
    UI.toast(`เข้าสัมมนา "${t[0]}": ${t[1]} (เข้าร่วมแล้ว ${st().sem} ครั้ง)`, '🎤');
  };
  const library = () => {
    if (!once('lib')) { UI.toast('วันนี้อ่านหนังสือที่ห้องสมุดไปแล้ว', '📚'); return; }
    tick(60); S.mood = Math.min(100, (S.mood || 50) + 4); Prog.add(6); UI.toast('อ่านหนังสือที่ห้องสมุด 1 ชั่วโมง (ฟรี)', '📚');
  };
  const campus = () => {
    if (!window.Edu24 || !Edu24.html) { UI.toast('ระบบการศึกษายังไม่พร้อม', '🎓'); return; }
    Edu24.atCampus = true; UI.open('🎓 มหาวิทยาลัย — ลงทะเบียนเรียนและเข้าห้องเรียน', null, () => Edu24.html(true), { wide: true });
    const c = UI.cur, oc = c && c.onClose; if (c) c.onClose = () => { Edu24.atCampus = false; if (oc) oc(); };
  };
  // intercity bus: 45% of the taxi fare, runs 06:00-20:00, takes longer than a taxi
  const busHTML = () => {
    const here = G.away && G.away.key, open = S.time >= 6 * 60 && S.time < 20 * 60;
    const rows = TAXI_DEST.filter(t => t.away && t.away !== here).map(t => ({ k: t.away, n: t.n, fare: Math.max(40, Math.round(t.fee * 0.45)) }));
    return `<p class="lead">🚌 รถโดยสารระหว่างเมือง เปิดเดินรถ 06:00–20:00 (ตอนนี้ ${open ? 'เปิด' : 'ปิด'}) ค่าโดยสารประมาณ 45% ของแท็กซี่ แต่ใช้เวลานานกว่า</p><div class="grid">
      <div class="card"><div class="ci">🏡</div><div class="cb"><h4>กลับหมู่บ้านสุขใจ</h4><p class="dim">ค่าโดยสาร ${baht(40)}</p><div class="row"><button class="btn" data-a="v25bus" data-v="home" ${open && S.money >= 40 ? '' : 'disabled'}>ซื้อตั๋ว</button></div></div></div>
      ${rows.map(r => `<div class="card"><div class="ci">🚌</div><div class="cb"><h4>${esc(r.n)}</h4><p class="dim">ค่าโดยสาร ${baht(r.fare)}</p><div class="row"><button class="btn" data-a="v25bus" data-v="${r.k}" data-f="${r.fare}" ${open && S.money >= r.fare ? '' : 'disabled'}>ซื้อตั๋ว</button></div></div></div>`).join('')}</div>`;
  };
  UI.H.v25bus = d => {
    if (S.time < 6 * 60 || S.time >= 20 * 60) { UI.toast('รถโดยสารหยุดให้บริการ (เปิด 06:00–20:00)', '🕒'); return; }
    if (d.v === 'home') { if (S.money < 40) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(40), '💸'); return; } S.money -= 40; UI.close(); tick(45); Town2.leaveAway(); return; }
    const f = +d.f; if (S.money < f) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(f), '💸'); return; } tick(45); Town2.go(d.v, f);
  };
  const busUI = () => UI.open('🚌 สถานีขนส่งผู้โดยสาร', null, busHTML);

  const govCounters = ids => (GOV() ? GOV().offices : []).filter(o => ids.includes(o.id)).map(o => ({ label: o.s, icon: o.i, fn: () => GOV().office(o.id) }));
  const safety = [
    { label: 'บริการตำรวจ', icon: '🚓', fn: () => Emergency.stationUI('police') },
    { label: 'บริการดับเพลิง', icon: '🚒', fn: () => Emergency.stationUI('fire') },
    { label: 'คลินิกกลาง', icon: '🏥', fn: () => Life2.clinicUI() },
  ];
  const E = {
    museum: [{ label: 'ซื้อตั๋วชมนิทรรศการ', icon: '🏛️', fn: museum }, { label: 'ห้องสมุดประชาชน', icon: '📚', fn: library }],
    stadium: [{ label: 'สนามกีฬา / ลู่วิ่ง', icon: '🏟️', fn: stadium }],
    conv: [{ label: 'ลงทะเบียนสัมมนา', icon: '🎤', fn: seminar }],
    bus: [{ label: 'ซื้อตั๋วรถระหว่างเมือง', icon: '🚌', fn: busUI }],
    uni: [{ label: 'ลงทะเบียน / ห้องเรียน', icon: '🎓', fn: campus }, { label: 'ห้องสมุดมหาวิทยาลัย', icon: '📚', fn: library }],
  };

  // ----- 3. what each city size gets, in order of free civic lots -----
  const G1 = ['district', 'passport', 'welfare', 'election', 'draft', 'edu', 'labour'];
  const PLAN = {
    large: [
      { k: 'hall', n: 'ศาลากลาง/ที่ว่าการ', ic: '🏛️', wall: 0xfff8e1, roof: 0x1a237e, bg: '#1a237e', off: G1 },
      { k: 'land', n: 'สำนักงานที่ดินและเทศบาล', ic: '🗺️', wall: 0xf1ebdc, roof: 0x33691e, bg: '#33691e', off: ['land', 'municipal', 'tambon', 'pwa', 'pea'] },
      { k: 'dlt', n: 'ขนส่งจังหวัดและศาล', ic: '🚗', wall: 0xeceff1, roof: 0xb71c1c, bg: '#b71c1c', off: ['dlt', 'court'] },
      { k: 'tax', n: 'สรรพากร พัฒนาธุรกิจ ประกันสังคม', ic: '🧾', wall: 0xe3f2fd, roof: 0x0d47a1, bg: '#0d47a1', off: ['revenue', 'dbd', 'sso'] },
      { k: 'safe', n: 'ศูนย์ความปลอดภัยและสาธารณสุข', ic: '🛡️', wall: 0xffffff, roof: 0xc62828, bg: '#c62828', off: ['police', 'fire', 'health', 'hospreg'], ex: safety },
      { k: 'post', n: 'ไปรษณีย์ ศุลกากร เกษตร', ic: '📮', wall: 0xfff3e0, roof: 0xe65100, bg: '#e65100', off: ['post', 'customs', 'agri', 'livestock', 'fisheries'] },
      { k: 'uni', n: 'มหาวิทยาลัย', ic: '🎓', wall: 0xf3e5f5, roof: 0x4a148c, bg: '#4a148c', ex: E.uni },
      { k: 'museum', n: 'พิพิธภัณฑ์และห้องสมุด', ic: '🏛️', wall: 0xefebe9, roof: 0x4e342e, bg: '#4e342e', ex: E.museum },
      { k: 'stadium', n: 'สนามกีฬากลาง', ic: '🏟️', wall: 0xe8f5e9, roof: 0x1b5e20, bg: '#1b5e20', ex: E.stadium },
      { k: 'conv', n: 'ศูนย์ประชุมและสัมมนา', ic: '🎤', wall: 0xe0f7fa, roof: 0x006064, bg: '#006064', ex: E.conv },
      { k: 'bus', n: 'สถานีขนส่ง', ic: '🚌', wall: 0xfffde7, roof: 0xf57f17, bg: '#f57f17', ex: E.bus },
      { k: 'market', n: 'ตลาดกลาง', ic: '🛒', wall: 0xfbe9e7, roof: 0x6d4c41, bg: '#bf360c', shop: ['market', 'ตลาดกลาง'] },
    ],
    medium: [
      { k: 'hall', n: 'ที่ว่าการอำเภอ', ic: '🏛️', wall: 0xfff8e1, roof: 0x1a237e, bg: '#1a237e', off: ['district', 'welfare', 'election', 'draft', 'edu', 'labour', 'post'] },
      { k: 'land', n: 'ศูนย์บริการภาครัฐ ที่ดิน ภาษี ขนส่ง', ic: '🗺️', wall: 0xf1ebdc, roof: 0x33691e, bg: '#33691e', off: ['land', 'municipal', 'tambon', 'revenue', 'dlt', 'pwa', 'pea'] },
      { k: 'agri', n: 'สาธารณสุขและเกษตรอำเภอ', ic: '🌾', wall: 0xf1f8e9, roof: 0x558b2f, bg: '#558b2f', off: ['health', 'agri', 'livestock', 'fisheries', 'hospreg'] },
      { k: 'bus', n: 'สถานีขนส่ง', ic: '🚌', wall: 0xfffde7, roof: 0xf57f17, bg: '#f57f17', ex: E.bus },
    ],
    small: [
      { k: 'tambon', n: 'ที่ทำการ อบต.', ic: '🏛️', wall: 0xfff8e1, roof: 0x1a237e, bg: '#1a237e', off: ['district', 'welfare', 'tambon', 'municipal', 'labour', 'health', 'agri', 'livestock', 'fisheries'] },
      { k: 'post', n: 'ที่ทำการไปรษณีย์', ic: '📮', wall: 0xfff3e0, roof: 0xe65100, bg: '#e65100', off: ['post'] },
    ],
  };
  const MALL = {
    large: { n: 'ห้างสรรพสินค้า', type: 'dept', bg: '#4a148c', wall: 0xf3e5f5, roof: 0x6a1b9a },
    medium: { n: 'ไฮเปอร์มาร์ท', type: 'wholesale', bg: '#1b5e20', wall: 0xe8f5e9, roof: 0x2e7d32 },
  };

  // ----- 4. rooms: counters along the back wall, one staff member per counter -----
  const roomSize = n => { const per = Math.min(Math.max(n, 1), 6), rows = Math.ceil(Math.max(n, 1) / per); return { w: Math.max(16, Math.round(per * 3.4 + 4)), d: Math.max(11, 7 + rows * 4), per, rows }; };
  ROOM_KIND.v25dept = { w: 22, d: 14, floor: 0xeceff1, wall: 0xf3e5f5, title: 'ห้างสรรพสินค้า' };
  const _rb = Rooms.build;
  Rooms.build = function (def, K) {
    _rb.call(this, def, K);
    const g = this.group, X = RM0.x, Z = RM0.z, W = K.w, D = K.d;
    let items = null, sign = '#1a237e';
    if (def.kind === 'v25dept' && SHOPS[def.shop]) {
      const sh = SHOPS[def.shop]; items = sh.tabs.map((t, i) => ({ label: t.n.replace(/^\S+\s/, '').slice(0, 14), icon: t.n.split(' ')[0], fn: () => { UI.shop(def.shop); UI.cur.tab = i; UI.renderBody(); } })); sign = '#4a148c';
    } else if (def.v25) { items = def.v25.items(); sign = def.v25.bg; }
    if (!items) return;
    const looks = ['toon:chic', 'toon:suit', 'Olivia', 'Erika', 'toon:civil', 'toon:jacket', 'Lydia', 'Kate'];
    const per = Math.max(1, Math.min(items.length, def.v25 ? def.v25.per : 6)), rows = Math.ceil(items.length / per);
    items.forEach((it, n) => {
      const r = Math.floor(n / per), c = n % per, inRow = Math.min(per, items.length - r * per);
      const x = inRow === 1 ? 0 : -W / 2 + 2.4 + c * ((W - 4.8) / (inRow - 1)), z = -D / 2 + 2.6 + r * 4.2;
      U.mk(g, GEO.box, mc(0x8d6e63), [X + x, 0.53, Z + z], [2.5, 1.05, 0.7]); this.cols.push(Col.box(X + x, Z + z, 1.25, 0.35, 0));
      U.mk(g, GEO.box, mc(0xeeeeee), [X + x, 1.08, Z + z], [2.6, 0.06, 0.8]);
      const sg = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.55), new THREE.MeshBasicMaterial({ map: U.signTex(it.label, { w: 384, h: 90, bg: sign }) })); sg.position.set(X + x, 2.3, Z + z - 0.45); g.add(sg);
      const o = Models.human({ skin: 0xe0a87e, hair: 0x1b120c, avatar: looks[n % looks.length] }); o.position.set(X + x, 0, Z + z - 0.9); g.add(o); this.staff.push(o);
      this.pois.push({ kind: 'act', x: X + x, z: Z + z + 1.0, r: 1.45, label: it.label, icon: it.icon, act: () => ({ icon: it.icon, label: it.label, fn: it.fn }) });
    });
  };

  // ----- 5. build the buildings when a city is built for the first time -----
  const build = (A, info) => {
    const T = kit.TOWNS.find(t => t.key === info.id); if (!T || A._v25civic) return; A._v25civic = 1;
    const g = A.g, plan = PLAN[T.size] || [], lots = V25.freeLots(info.id, 'civic');
    const frame = (o, lot, depth) => {
      const p = V25.lotPos(lot, depth), b = World.building(o); b.position.set(p.x, 0, p.z); b.rotation.y = p.rot; g.add(b);
      Col.box(p.x, p.z, o.w / 2 + 0.3, o.d / 2 + 0.3, p.rot, 'bld'); V25.takeLot(info.id, lot.id);
      return l2w(p.x, p.z, p.rot, 0, o.d / 2 + 1.7);
    };
    plan.forEach((B, i) => {
      const lot = lots[i]; if (!lot) return;
      const name = `${B.n} ${T.n}`;
      const o = { w: Math.min(lot.w - 1, 14), d: Math.min(lot.d - 1, 9.5), h: 5.4, flat: true, glassFront: true, wall: B.wall, roof: B.roof, sign: name, signStyle: { bg: B.bg } };
      const door = frame(o, lot, o.d);
      const items = () => (B.off ? govCounters(B.off) : []).concat(B.ex || []);
      if (B.shop) {
        const id = `v25_${info.id}_${B.k}`; SHOPS[id] = { n: name, tabs: kit.stockFor(B.shop[0], T.size, id) };
        World.pois.push({ kind: 'shop', id, x: door.x, z: door.z, r: 2.4, label: name, icon: B.ic, map: false });
        return;
      }
      const sz = roomSize(items().length || 1), kind = `v25_${info.id}_${B.k}`;
      ROOM_KIND[kind] = { w: sz.w, d: sz.d, floor: 0xe8e0d0, wall: 0xfdf6e3, title: name };
      World.pois.push({ kind: 'act', x: door.x, z: door.z, r: 2.6, label: name, icon: B.ic, map: false, room: { kind, title: name, v25: { items, per: sz.per, bg: B.bg } }, act: () => G.away === A ? { icon: B.ic, label: name, fn: () => {} } : null });
    });
    // the big store on the mall lot
    const ml = V25.freeLots(info.id, 'mall')[0], M = MALL[T.size];
    if (ml && M) {
      const name = `${M.n} ${T.n}`, o = { w: Math.min(ml.w - 2, 22), d: Math.min(ml.d - 1, 14.5), h: 8, rows: 2, flat: true, glassFront: true, wall: M.wall, roof: M.roof, sign: name, signStyle: { bg: M.bg } };
      const door = frame(o, ml, o.d), id = `v25_${info.id}_mall`;
      SHOPS[id] = { n: name, tabs: kit.stockFor(M.type, T.size, id) }; SHOP_ROOM[id] = 'v25dept';
      World.pois.push({ kind: 'shop', id, x: door.x, z: door.z, r: 2.6, label: name, icon: '🏬', map: false });
    }
  };
  V25.ensureHook('*', build);

  // for the console: V25.civicCheck() lists, per built city, the buildings made and any overlap left
  V25.civicCheck = () => { const out = {}; for (const T of kit.TOWNS) { const A = Town2.areas[T.key]; out[T.key] = A && A._v25civic ? { civic: V25.audit(T.key), free: V25.freeLots(T.key).length } : 'not built'; } return out; };
});
