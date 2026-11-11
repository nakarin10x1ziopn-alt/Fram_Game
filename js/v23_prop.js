'use strict';
// ---------- v23_prop: property on the map, enterable (empty) new homes with ordered + installed furniture, 20 more
// roadside lots, farm / barn / house wing expansion and a garage that grows to 6 cars ----------
const P23 = { slots: [], estSlots: [], names: ['ถนนสายหลักไปเมืองริมทะเล', 'ถนนสายทุ่งทอง', 'ถนนสายภูผาใหม่'] };
// --- roadside plots: found from the real road lines at load time so the terrain pads can be levelled before the world is built ---
(() => {
  const segD = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l2)); return Math.hypot(px - ax - dx * t, pz - az - dz * t); };
  const roadD = (x, z) => { let m = 1e9; for (const r of ROADS) for (let i = 0; i < r.pts.length - 1; i++) m = Math.min(m, segD(x, z, r.pts[i][0], r.pts[i][1], r.pts[i + 1][0], r.pts[i + 1][1])); return m; };
  const cand = [];
  const gen = (ri, s0, s1, step) => {
    const pts = ROADS[ri].pts; let acc = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const ax = pts[i][0], az = pts[i][1], bx = pts[i + 1][0], bz = pts[i + 1][1], len = Math.hypot(bx - ax, bz - az), tx = (bx - ax) / len, tz = (bz - az) / len;
      for (let s = Math.ceil(Math.max(s0, acc) / step) * step; s < acc + len && s <= s1; s += step) {
        const px = ax + tx * (s - acc), pz = az + tz * (s - acc);
        for (const sg of [1, -1]) { const nx = -tz * sg, nz = tx * sg; cand.push({ x: Math.round(px + nx * 15), z: Math.round(pz + nz * 15), rot: Math.atan2(-nx, -nz), road: ri === 1 ? 0 : ri === 2 ? 1 : 2 }); }
      }
      acc += len;
    }
  };
  gen(1, 70, 250, 16); gen(2, 15, 160, 16); gen(3, 15, 160, 16); gen(4, 5, 80, 16);
  for (const c of cand) {
    if (P23.slots.length >= 25) break;
    if (roadD(c.x, c.z) < 13 || zoneDist(c.x, c.z) < 12) continue;
    if (FLAT_PADS.some(p => Math.hypot(c.x - p.x, c.z - p.z) < p.r + 10)) continue;
    if (P23.slots.some(p => Math.hypot(c.x - p.x, c.z - p.z) < 16)) continue;
    P23.slots.push(c);
  }
  for (const s of P23.slots) FLAT_PADS.push({ x: s.x, z: s.z, r: 9 });
  P23.slots.slice(0, 20).forEach((s, i) => LOTS.push({ id: 'e' + (i + 1), n: `ที่ดินจัดสรร ${P23.names[s.road]} แปลง ${i + 1}`, x: s.x, z: s.z, rot: s.rot, price: 38000 + ((i * 7919) % 11) * 6500 }));
  P23.estSlots = P23.slots.slice(20, 25);
})();
Object.assign(HOUSE_DESIGNS, {
  tiny: { n: 'บ้านน็อคดาวน์ขนาดเล็ก', i: '🏚️', price: 90000, rent: 300, o: { w: 6, d: 5, h: 3, roofH: 2, wallTex: 'wood', wall: 0xd7b98e, roof: 0x6d4c41, winF: [-1.2, 1.2], winS: [0] } },
  townhome: { n: 'ทาวน์โฮม 2 ชั้น', i: '🏘️', price: 320000, rent: 800, flat: 1, o: { w: 7, d: 9, h: 6.2, rows: 2, flat: true, wall: 0xf5ede0, roof: 0x8d6e63, winF: [-1.8, 1.8], winS: [0] } },
  villa: { n: 'วิลล่าหลังคาจั่ว 3 ห้องนอน', i: '🏡', price: 650000, rent: 1800, o: { w: 12, d: 9, h: 3.6, roofH: 2.8, wall: 0xfff8e1, roof: 0xbf360c, winF: [-3.5, 3.5], winS: [-2, 2], pots: true, flowers: true } },
  mansion: { n: 'คฤหาสน์กระจกสุดหรู', i: '🏰', price: 1200000, rent: 3500, flat: 1, o: { w: 14, d: 10, h: 7, rows: 2, flat: true, glassFront: true, wall: 0xeceff1, roof: 0x37474f, winS: [-3, 3] } },
});
Object.assign(HOUSE_EXT, {
  bedroom2: { n: 'ห้องนอนที่สอง', i: '🛌', price: 55000, desc: 'นอนพักกลางวันได้วันละครั้ง พลังงาน +10' },
  library: { n: 'ห้องสมุดส่วนตัว', i: '📚', price: 42000, desc: 'อ่านหนังสือวันละครั้ง ได้ประสบการณ์ + อารมณ์ดีขึ้น' },
  kitchen2: { n: 'ครัวไทยหลังบ้าน', i: '🍳', price: 52000, desc: 'ทำอาหารจานใหญ่ได้เลยโดยไม่ต้องเข้าบ้านหลัก' },
  cinema: { n: 'ห้องดูหนังโฮมเธียเตอร์', i: '🎬', price: 80000, desc: 'ดูหนังวันละครั้ง อารมณ์ +20' },
  herb: { n: 'เรือนกระจกสวนสมุนไพร', i: '🌿', price: 48000, desc: 'เก็บสมุนไพรสดวันละครั้ง พลังงาน +8' },
  sauna: { n: 'ห้องซาวน่าและสปา', i: '🧖', price: 68000, desc: 'ผ่อนคลายวันละครั้ง อารมณ์ +15 พลังงาน +8' },
});
UPG.barn.cost.push(14000, 26000); UPG.barn.desc.push('เลี้ยงสัตว์ได้ 20 ตัว', 'เลี้ยงสัตว์ได้ 30 ตัว'); BARN_CAP.push(20, 30);
WALLS.push({ n: 'ส้มพีช', c: 0xf7d6bf }, { n: 'ม่วงลาเวนเดอร์', c: 0xdcd0ea }, { n: 'เขียวเสจ', c: 0xc5d6bd }, { n: 'ขาวนวล', c: 0xfaf6ee });
FLOORS.push({ n: 'ไม้โอ๊กอ่อน', c: 0xdcc096, t: 'wood' }, { n: 'ไม้วอลนัท', c: 0x5c3d28, t: 'wood' }, { n: 'กระเบื้องเทา', c: 0xc7c9cc, t: 'tile' }, { n: 'กระเบื้องครีม', c: 0xeadfc8, t: 'tile' });

// --- home furniture catalogue (size in 1 m cells, front faces the camera/door at rotation 0) ---
const hbox = (g, w, h, d, x, y, z, col, o) => U.mk(g, GEO.box, mc(col, o || { roughness: 0.7 }), [x, y, z], [w, h, d]);
const HF = {
  bed1: { n: 'เตียงเดี่ยว 3.5 ฟุต', i: '🛏️', price: 3500, w: 1, d: 2, use: 'sleep', mk() { const g = new THREE.Group(); hbox(g, 0.95, 0.3, 1.95, 0, 0.18, 0, 0x8d6e63); hbox(g, 0.88, 0.2, 1.85, 0, 0.42, 0.02, 0xfafafa); hbox(g, 0.7, 0.1, 0.35, 0, 0.58, -0.7, 0xe3f2fd); hbox(g, 0.9, 0.08, 1.1, 0, 0.55, 0.45, 0x5c8fb8); return g; } },
  bed2: { n: 'เตียงนอนคู่ 6 ฟุต', i: '🛌', price: 8900, w: 2, d: 3, use: 'sleep', mk() { return World.furn.bed(S.up.house || 1); } },
  sofa: { n: 'โซฟาผ้านุ่ม', i: '🛋️', price: 7500, w: 2, d: 1, use: 'sofa', mk() { return World.furn.sofa(); } },
  tv: { n: 'ทีวีจอแบน 55 นิ้ว', i: '📺', price: 9900, w: 1, d: 1, use: 'tv', e: 1, mk() { return World.furn.tv(); } },
  table: { n: 'โต๊ะกินข้าวพร้อมเก้าอี้', i: '🍽️', price: 4800, w: 2, d: 2, use: 'eat', mk() { return World.furn.table(); } },
  fridge: { n: 'ตู้เย็น 2 ประตู', i: '🧊', price: 12900, w: 1, d: 1, use: 'fridge', e: 1, pro: 1, mk() { return World.furn.fridge(); } },
  kitchen: { n: 'ชุดครัวพร้อมเตาแก๊สและอ่างล้างจาน', i: '🍳', price: 18500, w: 3, d: 1, use: 'cook', e: 1, wt: 1, pro: 1, mk() { return World.furn.kitchen(); } },
  desk: { n: 'โต๊ะทำงาน', i: '🪑', price: 3900, w: 2, d: 1, use: 'work', mk() { return World.furn.desk(); } },
  pcdesk: { n: 'โต๊ะคอมพิวเตอร์ + ปลั๊กพ่วง', i: '🖥️', price: 4500, w: 2, d: 1, use: 'pc', e: 1, mk() { return World.furn.desk(); } },
  wardrobe: { n: 'ตู้เสื้อผ้า 2 บาน', i: '🚪', price: 5500, w: 2, d: 1, use: 'look', mk() { return World.furn.wardrobe(); } },
  bookshelf: { n: 'ชั้นหนังสือ', i: '📚', price: 3200, w: 1, d: 1, use: 'read', mk() { return World.furn.bookshelf(); } },
  shower: { n: 'ห้องอาบน้ำ + เครื่องทำน้ำอุ่น', i: '🚿', price: 9500, w: 1, d: 1, use: 'shower', wt: 1, pro: 1, mk() { return World.furn.shower(); } },
  washer: { n: 'เครื่องซักผ้าฝาหน้า', i: '🧺', price: 11900, w: 1, d: 1, use: 'wash', e: 1, wt: 1, pro: 1, mk() { return Home.m.washer(); } },
  fan: { n: 'พัดลมตั้งพื้น', i: '🌀', price: 1290, w: 1, d: 1, use: 'fan', e: 1, mk() { return Home.m.fan(); } },
  console: { n: 'เครื่องเล่นเกม', i: '🎮', price: 12900, w: 1, d: 1, use: 'game', e: 1, mk() { return Home.m.console(); } },
  radio: { n: 'วิทยุ', i: '📻', price: 990, w: 1, d: 1, use: 'radio', e: 1, mk() { return Home.m.radio(); } },
  bike: { n: 'จักรยานออกกำลังกาย', i: '🚴', price: 8900, w: 1, d: 2, use: 'bike', mk() { return Home.m.bike(); } },
  piano: { n: 'เปียโน', i: '🎹', price: 28000, w: 2, d: 1, use: 'piano', mk() { return World.furn.piano(); } },
  aquarium: { n: 'ตู้ปลา', i: '🐠', price: 9900, w: 2, d: 1, mk() { return World.furn.aquarium(); } },
  rug: { n: 'พรมปูพื้น 3x2 ม.', i: '🧵', price: 1800, w: 3, d: 2, floor: 1, mk() { const g = new THREE.Group(); hbox(g, 2.9, 0.02, 1.9, 0, 0.012, 0, 0xb71c1c); hbox(g, 2.5, 0.025, 1.5, 0, 0.016, 0, 0xffe0b2); hbox(g, 2.1, 0.03, 1.1, 0, 0.02, 0, 0x6d4c41); return g; } },
  plant: { n: 'ต้นไม้ในกระถาง', i: '🪴', price: 450, w: 1, d: 1, mk() { return World.furn.plant(); } },
  lamp: { n: 'โคมไฟตั้งพื้น', i: '💡', price: 900, w: 1, d: 1, mk() { return World.furn.lamp(); } },
  painting: { n: 'ภาพวาดตั้งโชว์', i: '🖼️', price: 1200, w: 1, d: 1, mk() { return World.furn.painting(); } },
  chest: { n: 'หีบไม้เก็บของ', i: '🧰', price: 2400, w: 1, d: 1, mk() { return World.furn.chest(); } },
  vase: { n: 'แจกันเซรามิก', i: '🏺', price: 700, w: 1, d: 1, mk() { return World.furn.vase(); } },
  lantern: { n: 'โคมไฟล้านนา', i: '🏮', price: 1800, w: 1, d: 1, mk() { return World.furn.lanternL(); } },
  petbed: { n: 'ที่นอนสัตว์เลี้ยง', i: '🐾', price: 600, w: 1, d: 1, mk() { return World.furn.petbed(); } },
};

const Prop23 = {
  V() { const v = S.v23 = S.v23 || {}; v.homes = v.homes || {}; v.garage = v.garage | 0; v.fx = v.fx | 0; v.xd = v.xd || {}; return v; },
  home(id) { const h = this.V().homes[id] = this.V().homes[id] || { items: [], boxes: {}, orders: [], util: { e: 0, w: 0 }, seen: 0 }; h.util = h.util || { e: 0, w: 0 }; return h; },
  est: {}, estG: {}, homePoi: {},

  // ================= owned property list (map + travel) =================
  homeDoor() { return World.houseDoor || { x: HOUSE_POS.x, z: HOUSE_POS.z + 8 }; },
  list() {
    const L = [], hd = this.homeDoor();
    L.push({ k: 'farm', i: '🏡', n: 'บ้านและฟาร์มของคุณ', d: `ฟาร์ม ${typeof farmPlotCount === 'function' ? farmPlotCount() : (S.plots.length > 30 ? '30+' + (S.plots.length - 30) : 30)} แปลง · บ้านระดับ ${S.up.house}`, x: hd.x, z: hd.z });
    const hb = HomeBuild.st().lots;
    for (const Lt of LOTS) {
      const st = hb[Lt.id]; if (!st) continue; const D = st.design && HOUSE_DESIGNS[st.design], o = D && D.o;
      const dr = o ? l2w(Lt.x, Lt.z, Lt.rot, 0, o.d / 2 + 2.2) : l2w(Lt.x, Lt.z, Lt.rot, 0, 5);
      L.push({ k: 'lot:' + Lt.id, i: D ? D.i : '📜', n: D ? (st.name || D.n) : 'ที่ดินเปล่าของคุณ', d: `${Lt.n}${D ? (st.stage >= 3 ? '' : ' · กำลังก่อสร้าง') : ''}`, x: dr.x, z: dr.z });
    }
    const es = Estate.st().own;
    for (const P of PROPS) { if (!es[P.k]) continue; const e = this.est[P.k]; L.push({ k: 'est:' + P.k, i: P.i, n: P.n, d: 'อสังหาริมทรัพย์ที่ซื้อไว้', x: e ? e.door.x : null, z: e ? e.door.z : null }); }
    for (const F of BIG_FIELDS) if ((S.fields || {})[F.id]) L.push({ k: 'fld:' + F.id, i: '🚜', n: F.n, d: `${F.rai} ไร่`, x: F.x, z: F.z - F.d / 2 - 2 });
    if (S.myshop && S.myshop.until >= S.day) { const d = l2w(MYSHOP.x, MYSHOP.z, MYSHOP.rot, 0, 5.2); L.push({ k: 'shop', i: '🏪', n: 'ร้านของฉันในทุ่งทอง', d: 'เช่าร้านค้า', x: d.x, z: d.z }); }
    for (const c of Company.list()) {
      const T = CO_TYPES[c.type] || { i: '🏢' }, g = CoMap.g[c.id];
      const st = { name: 'จองชื่อแล้ว', named: 'ชื่อผ่านแล้ว', reg: 'จดทะเบียนแล้ว', setup: 'กำลังเตรียมสถานที่', open: 'เปิดดำเนินการ' }[c.st] || c.st;
      const tw = (typeof CO_SITES !== 'undefined' && CO_SITES[c.site] && CO_SITES[c.site].town) || null;
      if (g) L.push({ k: 'co:' + c.id, i: T.i, n: c.name, d: `บริษัท · ${st}${tw ? ' · ' + Town2.areas[tw].n : ''}`, x: g.poi.x, z: g.poi.z, away: tw });
      else if (tw && ['setup', 'open'].includes(c.st) && CoMap.doorOf(c)) { const dr = CoMap.doorOf(c); L.push({ k: 'co:' + c.id, i: T.i, n: c.name, d: `บริษัท · ${st} · ${Town2.areas[tw].n}`, x: dr.x, z: dr.z, away: tw }); }
      else if (c.site === 'home') L.push({ k: 'co:' + c.id, i: T.i, n: c.name, d: `บริษัท · ${st} · ที่ทำการอยู่ที่บ้านของคุณ`, x: hd.x, z: hd.z });
      else L.push({ k: 'co:' + c.id, i: T.i, n: c.name, d: `บริษัท · ${st} · ยังไม่มีสถานที่ตั้ง (เลือกสถานที่ตอนเตรียมสำนักงาน)`, x: null, z: null });
    }
    // v194: a place that still lies inside a removed town cannot be visited (the taxi used to take the fare and the player was thrown back with "เมืองนี้ปิดแล้ว")
    for (const p of L) if (p.x != null && this.closed(p.x, p.z)) { p.x = null; p.z = null; p.d += ' · อยู่ในเมืองที่ปิดแล้ว (ไปไม่ได้)'; }
    return L;
  },
  closed(x, z) { try { return !!(window.FiveTowns99 && FiveTowns99.inRect(x, z, 0)); } catch (e) { return false; } },
  fare(x, z) { const p = G.away ? { x: 0, z: -100 } : G.player.pos; return Math.min(300, 30 + Math.round(Math.hypot(x - p.x, z - p.z) * 0.25)); },
  go(i) {
    const p = this.list()[+i]; if (!p || p.x == null) { UI.toast('ที่นี่ยังไม่มีสถานที่ให้ไป', '📍'); return; }
    if (G.driving) { UI.toast('ลงจากรถก่อนเรียกแท็กซี่', '🚕'); return; }
    const fee = this.fare(p.x, p.z); if (S.money < fee) { UI.toast(`ค่าแท็กซี่ ${baht(fee)} เงินไม่พอ`, '💸'); return; }
    S.money -= fee; Bank2.log('ค่าแท็กซี่ไป ' + p.n, -fee); Phone.app = null; UI.close();
    if (p.away) {   // a company in another town: build the town if it is the first visit, enter it, and arrive at the company door
      try { Town3.ensure(p.away); } catch (e) { }
      const A = Town2.areas[p.away];
      fade(() => { leaveIndoors(); if (G.away && G.away !== A) G.away.g.visible = false; tick(90); G.away = A; A.g.visible = true; G.player.pos.set(p.x, A.y || 0, p.z); G.player.rot = 0; snapCam(); UI.toast(`แท็กซี่ส่งถึง ${p.n} แล้ว (${baht(fee)})`, '🚕'); });
      return;
    }
    fade(() => {
      if (typeof Town2 !== 'undefined' && G.away) Town2.leaveAway(true);
      leaveIndoors(); tick(Math.max(5, Math.round(fee / 4)));
      G.player.pos.set(p.x, World.groundY(p.x, p.z), p.z); G.player.rot = 0; snapCam(); UI.toast(`แท็กซี่ส่งถึง ${p.n} แล้ว (${baht(fee)})`, '🚕');
    });
  },
  listHTML(tab) {
    const L = this.list();
    return L.map((p, i) => `<div class="card"><div class="ci">${p.i}</div><div class="cb"><h4>${esc(p.n)}</h4><p class="dim">${esc(p.d)}</p><div class="row">${p.x == null ? '<button class="btn" disabled>ยังไปไม่ได้</button>' : `<button class="btn" data-a="p23go" data-v="${i}">🚕 ไปที่นี่ (${baht(this.fare(p.x, p.z))})</button>`}</div></div></div>`).join('');
  },
  mapList() { return `<h5>📍 ทรัพย์สินของฉัน (กดเพื่อเรียกแท็กซี่ไป)</h5><div class="grid">${this.listHTML()}</div>`; },
  markers() {
    const cv = document.getElementById('bigmap'), img = World.mapImg; if (!cv || !img) return;
    const g = cv.getContext('2d'), k = cv.width / img.width, toS = (x, z) => [(x - WORLD.minX) / 2 * k, (z - WORLD.minZ) / 2 * k];
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const p of this.list()) {
      if (p.x == null) continue; const [x, y] = toS(p.x, p.z), r = cv.width * 0.016;
      g.lineWidth = 4; g.strokeStyle = '#ffcf3f'; g.fillStyle = 'rgba(255,207,63,.28)'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.stroke();
      g.font = `${Math.round(cv.width * 0.022)}px "Segoe UI Emoji","Apple Color Emoji",sans-serif`; g.fillStyle = '#fff'; g.fillText(p.i, x, y);
      g.font = `600 ${Math.round(cv.width * 0.017)}px Kanit, sans-serif`; g.lineWidth = 5; g.strokeStyle = 'rgba(20,35,25,.9)'; g.fillStyle = '#ffe082';
      g.strokeText(p.n.slice(0, 22), x, y - r - 8); g.fillText(p.n.slice(0, 22), x, y - r - 8);
    }
  },

  // ================= estate buildings (condo / shop / house / dorm / land) =================
  estOpts: {
    condo1: { w: 8, d: 6, h: 9, rows: 3, flat: true, wall: 0xe0e0e0, roof: 0x78909c, glassFront: true },
    shop1: { w: 9, d: 8, h: 9.5, rows: 3, flat: true, wall: 0xffe0b2, roof: 0x8d6e63, awning: 0xffa000 },
    house1: { w: 10, d: 8, h: 6.4, rows: 2, roofH: 2.8, wall: 0xf5f5dc, roof: 0xa1442c, winF: [-3, 3], winS: [-2, 2] },
    dorm: { w: 14, d: 8, h: 9, rows: 3, flat: true, wall: 0xffcc80, roof: 0x6d4c41 },
  },
  drawEst(k) {
    const sl = P23.estSlots[PROPS.findIndex(p => p.k === k)], P = PROPS.find(p => p.k === k); if (!sl || !P) return;
    const old = this.estG[k]; if (old) { World.outdoor.remove(old.g); old.cols.forEach(c => Col.remove(c)); for (const q of old.pois) { const i = World.pois.indexOf(q); if (i >= 0) World.pois.splice(i, 1); } }
    const own = !!Estate.st().own[k], g = new THREE.Group(), y = World.groundY(sl.x, sl.z); g.position.set(sl.x, y, sl.z); g.rotation.y = sl.rot; World.outdoor.add(g);
    const o = this.estOpts[k], cols = [], pois = [];
    const sign = txt => { const m = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.7), new THREE.MeshStandardMaterial({ map: U.signTex(txt, { w: 640, h: 150, bg: own ? '#2e7d32' : '#c62828' }) })); return m; };
    World.clearNear(sl.x, sl.z, 10, true);
    let door;
    if (o) {
      g.add(World.building(o)); const s = sign(own ? 'ของคุณ: ' + P.n.slice(0, 16) : 'ขาย ' + U.fmt(Estate.price(P)) + ' ฿'); s.position.set(0, 1.9, o.d / 2 + 2.4); g.add(s);
      U.mk(g, GEO.box, M.darkwood, [-1.3, 0.95, o.d / 2 + 2.38], [0.1, 1.9, 0.1]); U.mk(g, GEO.box, M.darkwood, [1.3, 0.95, o.d / 2 + 2.38], [0.1, 1.9, 0.1]);
      cols.push(Col.box(sl.x, sl.z, o.w / 2 + 0.4, o.d / 2 + 0.4, sl.rot, 'bld'));
      door = l2w(sl.x, sl.z, sl.rot, 0, o.d / 2 + 1.8);
    } else {
      const s = sign(own ? 'ที่ดินของคุณ 1 ไร่' : 'ขายที่ดิน ' + U.fmt(Estate.price(P)) + ' ฿'); s.position.set(0, 1.9, 3); g.add(s);
      U.mk(g, GEO.box, M.darkwood, [-1.3, 0.95, 2.98], [0.1, 1.9, 0.1]); U.mk(g, GEO.box, M.darkwood, [1.3, 0.95, 2.98], [0.1, 1.9, 0.1]);
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) U.mk(g, GEO.box, mc(own ? 0x43a047 : 0xff7043), [sx * 7, 0.4, sz * 6], [0.14, 0.8, 0.14]);
      door = l2w(sl.x, sl.z, sl.rot, 0, 5);
    }
    this.est[k] = { door, sl };
    const poi = { kind: 'act', x: door.x, z: door.z, r: 3, label: P.n, icon: own ? P.i : '🏷️', map: true, act: () => ({ icon: P.i, label: own ? `${P.n} ของคุณ` : `${P.n} (ขาย ${baht(Estate.price(P))})`, fn: () => this.estUI(k) }) };
    World.pois.push(poi); pois.push(poi);
    if (own && o) this.mkEnter('est:' + k, P.n, P.i, door, o.w, o.d, pois, 1.6);
    this.estG[k] = { g, cols, pois };
  },
  estUI(k) {
    const P = PROPS.find(p => p.k === k), own = !!Estate.st().own[k], pr = Estate.price(P);
    UI.open(P.n, null, () => `<p class="lead">${P.i} ${esc(P.n)} · ราคา ${baht(pr)}${P.rent ? ` · ค่าเช่าโดยประมาณ ${baht(Math.round(P.rent * Estate.st().idx))}/สัปดาห์` : ''}</p>
      <p class="dim">ค่าโอนกรรมสิทธิ์ 2% แบ่งจ่ายคนละครึ่ง ขายก่อน 5 ปีเสียภาษีธุรกิจเฉพาะ 3.3%</p>
      <div class="row">${own ? `<button class="btn ghost" data-a="estsell" data-v="${k}">ขายทรัพย์สิน</button>` : `<button class="btn" data-a="estbuy" data-v="${k}" ${S.money >= pr ? '' : 'disabled'}>ซื้อ ${baht(pr)}</button>`}</div>`);
  },

  // ================= walk-in homes =================
  mkEnter(hid, name, icon, door, w, d, pois, dz) {
    const W = Math.max(6, Math.min(14, Math.round(w))), D = Math.max(5, Math.min(10, Math.round(d))), kind = 'own' + W + 'x' + D;
    ROOM_KIND[kind] = { w: W, d: D, floor: 0xd7ccc8, wall: 0xfaf3e6, title: name };
    const p = { kind: 'act', x: door.x, z: door.z, r: 2.2, label: name, icon, act: () => ({ icon: '🚪', label: 'เข้าไปใน ' + name, fn: () => Rooms.enter(p) }) };
    p.room = { kind, title: name, home: hid, staff: null, service: () => { } };
    World.pois.push(p); pois.push(p); this.homePoi[hid] = p; return p;
  },
  hookHomeBuild() {
    const _draw = HomeBuild.draw.bind(HomeBuild);
    HomeBuild.draw = id => {
      _draw(id);
      const old = this.homeLotPoi && this.homeLotPoi[id]; this.homeLotPoi = this.homeLotPoi || {};
      if (old) { const i = World.pois.indexOf(old); if (i >= 0) World.pois.splice(i, 1); delete this.homeLotPoi[id]; }
      const st = HomeBuild.st().lots[id], Lt = HomeBuild.lot(id); if (!st || !st.design || st.stage < 3) return;
      const D = HOUSE_DESIGNS[st.design], dr = l2w(Lt.x, Lt.z, Lt.rot, 0, D.o.d / 2 + 2.2), tmp = [];
      this.mkEnter('lot:' + id, st.name || D.n, D.i, dr, D.o.w, D.o.d, tmp); this.homeLotPoi[id] = tmp[0];
    };
    for (const L of LOTS) HomeBuild.draw(L.id);
  },
  deliver(h) {
    let n = 0; h.orders = h.orders.filter(o => { if (S.day >= o.day) { h.boxes[o.k] = (h.boxes[o.k] || 0) + 1; n++; return false; } return true; }); return n;
  },
  dayTick() {
    for (const [id, h] of Object.entries(this.V().homes)) {
      const n = this.deliver(h); if (n) Phone.msg('ขนส่งเฟอร์นิเจอร์สุขใจ', `ส่งเฟอร์นิเจอร์ ${n} ชิ้นถึงบ้านแล้ว วางกล่องไว้ในบ้านรอติดตั้ง`);
      if (h.util.e && h.util.e === S.day) Phone.msg('การไฟฟ้า', 'ติดตั้งมิเตอร์ไฟฟ้าเสร็จแล้ว ใช้เครื่องใช้ไฟฟ้าในบ้านได้เลย');
      if (h.util.w && h.util.w === S.day) Phone.msg('การประปา', 'ติดตั้งมาตรน้ำเสร็จแล้ว น้ำประปาไหลแล้ว');
    }
  },
  need(h, spec) {
    if (spec.e) { if (S.powerOff) return 'ไฟถูกตัด ชำระค่าไฟในแอปธนาคารก่อน'; if (!h.util.e || S.day < h.util.e) return 'บ้านหลังนี้ยังไม่มีไฟฟ้า ขอติดตั้งมิเตอร์ที่แผงเบรกเกอร์ใกล้ประตู'; }
    if (spec.wt && (!h.util.w || S.day < h.util.w)) return 'บ้านหลังนี้ยังไม่มีน้ำประปา ขอติดตั้งมาตรน้ำที่แผงมิเตอร์ใกล้ประตู';
    return '';
  },
  daily(key, msg) { if (S.daily[key]) { UI.toast(msg || 'วันนี้ทำไปแล้ว', '⏳'); return false; } S.daily[key] = 1; return true; },
  actOf(def, h, it, spec) {
    if (!spec.use) return null;
    const bad = this.need(h, spec), u = spec.use, mk = (icon, label, fn) => ({ icon, label, fn: () => { if (bad) { UI.toast(bad, '⚠️'); return; } fn(); } });
    const mood = n => { S.mood = Math.min(100, (S.mood || 50) + n); };
    const en = n => { S.energy = Math.min(maxEnergy(), S.energy + n); };
    switch (u) {
      case 'sleep': return mk('🛏️', 'นอนหลับถึงเช้า', () => UI.confirm('นอนหลับถึงเช้า?', 'พลังงานจะเต็ม และเกมจะบันทึกอัตโนมัติ', 'นอนเลย', () => this.sleepHere()));
      case 'sofa': return mk('🛋️', 'นั่งพักบนโซฟา 30 นาที', () => { if ((S.daily.v23sofa || 0) >= 4) { UI.toast('นั่งพักมาหลายรอบแล้ววันนี้', '🛋️'); return; } S.daily.v23sofa = (S.daily.v23sofa || 0) + 1; fade(() => { tick(30); en(5); mood(3); UI.toast('นั่งพักสบาย ๆ พลังงาน +5', '🛋️'); }); });
      case 'tv': return mk('📺', 'ดูทีวี (ข่าว ละคร กีฬา)', () => Home.tv());
      case 'eat': return mk('🍽️', 'นั่งกินข้าวที่โต๊ะ', () => UI.inventory('food'));
      case 'fridge': return mk('🧊', 'เปิดตู้เย็น (กินของ)', () => UI.inventory('food'));
      case 'cook': return mk('🍳', 'ทำอาหาร', () => UI.cook());
      case 'work': return mk('🪑', 'นั่งทำงานที่โต๊ะ (งานพิเศษ)', () => Life2.jobsUI());
      case 'pc': return mk('🖥️', 'ใช้คอมพิวเตอร์', () => { if (typeof PC !== 'undefined' && PC.homeUI) PC.homeUI(); else UI.toast('ยังไม่มีคอมพิวเตอร์ ซื้อชิ้นส่วนที่คอมพิวเตอร์พลาซ่า', '🖥️'); });
      case 'look': return mk('🚪', 'เปิดตู้เสื้อผ้า (แต่งตัว)', () => UI.look(false));
      case 'read': return mk('📚', 'หยิบหนังสือมาอ่าน 30 นาที', () => { if (this.daily('v23read', 'วันนี้อ่านหนังสือไปแล้ว')) fade(() => { tick(30); mood(3); Prog.add(3); UI.toast('ได้ความรู้ใหม่ อารมณ์ดีขึ้น', '📚'); }); });
      case 'shower': return mk('🚿', 'อาบน้ำ', () => fade(() => { tick(15); (S.buff = S.buff || {}).clean = S.day; mood(3); Sfx.water(); UI.toast('อาบน้ำสะอาดสดชื่น', '🚿'); }));
      case 'wash': return mk('🧺', 'ซักผ้า', () => Home.wash());
      case 'fan': return mk('🌀', S.fanOn ? 'ปิดพัดลม' : 'เปิดพัดลม', () => { S.fanOn = !S.fanOn; UI.toast(S.fanOn ? 'เปิดพัดลมแล้ว' : 'ปิดพัดลมแล้ว', '🌀'); });
      case 'game': return mk('🎮', 'เล่นเกม 1 ชั่วโมง', () => Home.game());
      case 'radio': return mk('📻', 'เปิด/ปิดวิทยุ', () => { S.music = S.music === false; Music.setOn(S.music !== false); });
      case 'bike': return mk('🚴', 'ปั่นจักรยานออกกำลังกาย', () => Home.exercise());
      case 'piano': return mk('🎹', 'เล่นเปียโน 30 นาที', () => { if (this.daily('v23piano', 'วันนี้เล่นเปียโนไปแล้ว')) fade(() => { tick(30); mood(10); UI.toast('เสียงเปียโนไพเราะ อารมณ์ +10', '🎹'); }); });
    }
    return null;
  },
  sleepHere() {
    fade(() => {
      let mins = (360 - S.time + 1440) % 1440; if (mins === 0) mins = 1440;
      Emergency.overnight(); simulate(mins);
      const W = WEATHER[S.weather.type]; Object.assign(G.wx, { cloud: W.cloud, rain: W.rain, fog: W.fog, wind: W.wind, storm: W.storm || 0 });
      S.energy = maxEnergy(); G.plots.forEach((_, i) => refreshPlot(i)); G.trees.forEach((_, i) => refreshTree(i)); saveGame(true);
      const m = G.morning || { prod: 0, hungry: 0 };
      UI.toast(`เช้า${RD(S.day)} อากาศ: ${W.n}`, W.i);
      if (m.prod) UI.toast(`สัตว์ให้ผลผลิต ${m.prod} ตัว ไปเก็บที่คอกได้เลย`, '🥚');
      if (m.hungry) UI.toast(`สัตว์หิว ${m.hungry} ตัว อย่าลืมเติมอาหารในราง`, '🌾');
      G.morning = null; this.refresh();
    });
  },
  refresh() { if (G.inRoom && Rooms.cur && Rooms.cur.def.home) Rooms.build(Rooms.cur.def, ROOM_KIND[Rooms.cur.def.kind]); },
  build(def, K) {
    const h = this.home(def.home), g = Rooms.group, X = RM0.x, Z = RM0.z, W = K.w, D = K.d;
    this.deliver(h);
    // placed furniture
    for (const it of h.items) {
      const sp = HF[it.k]; if (!sp) continue;
      const odd = it.r % 2, fw = odd ? sp.d : sp.w, fd = odd ? sp.w : sp.d, cx = -W / 2 + it.x + fw / 2, cz = -D / 2 + it.y + fd / 2, th = it.r * Math.PI / 2;
      const o = sp.mk(); o.position.set(X + cx, 0, Z + cz); o.rotation.y = th; g.add(o);
      if (!sp.floor) Rooms.cols.push(Col.box(X + cx, Z + cz, fw / 2 - 0.08, fd / 2 - 0.08, 0));
      const a = this.actOf(def, h, it, sp);
      if (a) { const p = l2w(X + cx, Z + cz, th, 0, sp.d / 2 + 0.75); Rooms.pois.push({ kind: 'act', x: p.x, z: p.z, r: 1.3, label: a.label, icon: a.icon, act: () => a }); }
    }
    // entrance strip: breaker / meters, delivered boxes, catalogue stand
    const zr = Z + D / 2 - 0.55;
    hbox(g, 0.5, 0.7, 0.18, X - W / 2 + 0.6, 1.5, Z + D / 2 - 0.12, 0x78909c, { roughness: 0.5, metalness: 0.4 });
    hbox(g, 0.14, 0.14, 0.04, X - W / 2 + 0.6, 1.6, Z + D / 2 - 0.2, h.util.e && S.day >= h.util.e ? 0x69f0ae : 0xff5252, { emissive: 0x222222 });
    Rooms.pois.push({ kind: 'act', x: X - W / 2 + 1.5, z: zr, r: 1.5, label: 'แผงเบรกเกอร์ / มิเตอร์ไฟและน้ำ', icon: '⚡', act: () => ({ icon: '⚡', label: 'ขอติดตั้งมิเตอร์ไฟ / ประปา', fn: () => this.utilUI(def.home) }) });
    const nb = Object.values(h.boxes).reduce((a, b) => a + b, 0);
    for (let i = 0; i < Math.min(nb, 6); i++) hbox(g, 0.7, 0.5, 0.7, X - W / 2 + 2.6 + (i % 3) * 0.8, 0.25 + ((i / 3) | 0) * 0.5, zr + 0.1, 0xc8a165);
    Rooms.pois.push({ kind: 'act', x: X - W / 2 + 3.5, z: zr - 0.3, r: 1.6, label: `เฟอร์นิเจอร์ที่ส่งมา (${nb} กล่อง) · ติดตั้ง/จัดห้อง`, icon: '📦', act: () => ({ icon: '📦', label: `จัดห้อง / ติดตั้งเฟอร์นิเจอร์ (${nb} กล่อง)`, fn: () => this.placeUI(def.home) }) });
    hbox(g, 0.5, 1.0, 0.4, X + W / 2 - 0.8, 0.5, zr, 0x6d4c41); hbox(g, 0.4, 0.04, 0.3, X + W / 2 - 0.8, 1.02, zr, 0xffecb3);
    Rooms.pois.push({ kind: 'act', x: X + W / 2 - 1.6, z: zr - 0.3, r: 1.5, label: 'แคตตาล็อกสั่งเฟอร์นิเจอร์ (ส่งถึงบ้าน)', icon: '📒', act: () => ({ icon: '📒', label: 'เปิดแคตตาล็อกสั่งเฟอร์นิเจอร์', fn: () => this.catalogUI(def.home) }) });
    if (!h.seen) { h.seen = 1; setTimeout(() => UI.toast('บ้านใหม่ยังว่างเปล่า สั่งเฟอร์นิเจอร์จากแคตตาล็อก รอจัดส่ง แล้วติดตั้งเอง', '🏠'), 900); }
    World.inPois = Rooms.pois;
  },
  homeName(hid) { const p = this.homePoi[hid]; return p ? p.room.title : 'บ้าน'; },
  utilUI(hid) {
    const h = this.home(hid), st = (v, nm, fee, days) => v ? (S.day >= v ? `<b>✅ ใช้งานได้แล้ว</b>` : `⏳ ช่างติดตั้ง${RD(v)}`) : `<button class="btn" data-a="p23util" data-v="${nm}" ${S.money >= fee ? '' : 'disabled'}>ยื่นคำขอ ${baht(fee)} (ติดตั้งภายใน ${days} วัน)</button>`;
    UI.open('มิเตอร์ไฟฟ้าและประปา · ' + this.homeName(hid), null, () => `<p class="lead">บ้านที่เพิ่งสร้างยังไม่มีมิเตอร์ ต้องยื่นขอใช้ไฟฟ้าและน้ำประปาก่อน เครื่องใช้ไฟฟ้าและเครื่องสุขภัณฑ์ถึงจะใช้งานได้</p>
      <div class="grid"><div class="card"><div class="ci">⚡</div><div class="cb"><h4>ขอใช้ไฟฟ้า (การไฟฟ้า)</h4><p class="dim">ค่าประกันการใช้ไฟ 2,500 ฿ + ค่าติดตั้งมิเตอร์ 1,500 ฿</p><div class="row">${st(h.util.e, 'e', 4000, 1)}</div></div></div>
      <div class="card"><div class="ci">🚰</div><div class="cb"><h4>ขอใช้น้ำประปา (การประปา)</h4><p class="dim">ค่าประกันมาตรน้ำ 1,000 ฿ + ค่าติดตั้ง 800 ฿</p><div class="row">${st(h.util.w, 'w', 1800, 2)}</div></div></div></div>`);
    this.utilHid = hid;
  },
  catalogUI(hid) {
    this.catHid = hid; const h = this.home(hid);
    UI.open('แคตตาล็อกเฟอร์นิเจอร์ · ' + this.homeName(hid), null, () => `<p class="lead">สั่งแล้วส่งถึงบ้านพรุ่งนี้เช้า (ค่าจัดส่ง 100 ฿ ต่อชิ้น) · ของจะมาเป็นกล่องในบ้าน ต้องติดตั้งเองหรือจ้างช่าง · ${h.orders.length ? `กำลังจัดส่ง ${h.orders.length} ชิ้น` : 'ไม่มีของค้างส่ง'}</p>
      <div class="grid">${Object.entries(HF).map(([k, f]) => `<div class="card"><div class="ci">${f.i}</div><div class="cb"><h4>${f.n}</h4><p class="dim">กินที่ ${f.w}×${f.d} ม.${f.e ? ' · ใช้ไฟฟ้า' : ''}${f.wt ? ' · ต้องมีประปา' : ''}${f.pro ? ' · ต้องจ้างช่างติดตั้ง' : ''}</p><div class="row"><button class="btn" data-a="p23order" data-v="${k}" ${S.money >= f.price + 100 ? '' : 'disabled'}>สั่งซื้อ ${baht(f.price + 100)}</button></div></div></div>`).join('')}</div>`);
  },
  // ---- room layout editor: tap a cell to install, tap an installed piece to select it ----
  placeUI(hid) {
    this.plHid = hid; this.pl = { sel: null, r: 0, pick: -1 };
    UI.open('จัดห้อง · ' + this.homeName(hid), null, () => this.placeHTML());
  },
  grid(hid) { const p = this.homePoi[hid], K = ROOM_KIND[p.room.kind]; return { W: K.w, D: K.d }; },
  occ(h, W, D) {
    const m = Array.from({ length: D }, () => Array(W).fill(-1));
    h.items.forEach((it, idx) => { const sp = HF[it.k]; if (sp.floor) return; const odd = it.r % 2, fw = odd ? sp.d : sp.w, fd = odd ? sp.w : sp.d; for (let y = 0; y < fd; y++) for (let x = 0; x < fw; x++) if (m[it.y + y]) m[it.y + y][it.x + x] = idx; });
    return m;
  },
  placeHTML() {
    const hid = this.plHid, h = this.home(hid), { W, D } = this.grid(hid), pl = this.pl, occ = this.occ(h, W, D);
    const boxes = Object.entries(h.boxes).filter(([, n]) => n > 0);
    const sel = pl.sel, SP = sel && HF[sel], cells = [];
    const rugAt = (x, y) => h.items.findIndex(it => HF[it.k].floor && x >= it.x && x < it.x + (it.r % 2 ? HF[it.k].d : HF[it.k].w) && y >= it.y && y < it.y + (it.r % 2 ? HF[it.k].w : HF[it.k].d));
    for (let y = 0; y < D; y++) for (let x = 0; x < W; x++) {
      const o = occ[y][x], door = y === D - 1, it = o >= 0 ? h.items[o] : null, anchor = it && it.x === x && it.y === y;
      const rg = !it && !door ? rugAt(x, y) : -1;
      cells.push(`<button data-a="p23cell" data-x="${x}" data-y="${y}" style="aspect-ratio:1;padding:0;font-size:${W > 11 ? 12 : 15}px;border-radius:4px;border:1px solid ${o === pl.pick ? '#ffcf3f' : 'rgba(0,0,0,.25)'};background:${door ? '#8d6e63' : it ? (o === pl.pick ? '#ffe082' : '#a5d6a7') : rg >= 0 ? '#ffccbc' : '#f5f0e6'};color:#222" ${door ? 'disabled' : ''}>${door ? '' : anchor ? HF[it.k].i : it ? '▪' : ''}</button>`);
    }
    const pickIt = pl.pick >= 0 ? h.items[pl.pick] : null;
    return `<p class="lead">${sel ? `วาง <b>${SP.i} ${SP.n}</b> (${pl.r % 2 ? SP.d : SP.w}×${pl.r % 2 ? SP.w : SP.d} ม.) · แตะช่องมุมซ้ายบนของตำแหน่งที่ต้องการ` : pickIt ? `เลือก ${HF[pickIt.k].i} ${HF[pickIt.k].n}` : 'เลือกกล่องด้านล่างเพื่อวาง หรือแตะเฟอร์นิเจอร์ในผังเพื่อยกเก็บ'}${SP && (SP.pro) ? ` · ต้องจ้างช่างติดตั้ง ${baht(Math.max(300, Math.round(SP.price * 0.08)))}` : ''}</p>
      <div style="display:grid;grid-template-columns:repeat(${W},1fr);gap:2px;max-width:${W * 34}px;margin:6px auto">${cells.join('')}</div><p class="dim" style="text-align:center">▼ ประตูทางเข้า</p>
      <div class="row">${sel ? `<button class="btn ghost" data-a="p23rot">↻ หมุน</button><button class="btn ghost" data-a="p23cancel">ยกเลิกการวาง</button>` : ''}${pickIt ? `<button class="btn ghost" data-a="p23stow">📦 ยกเก็บใส่กล่อง</button><button class="btn ghost" data-a="p23unpick">ยกเลิก</button>` : ''}</div>
      <h5>กล่องที่รอติดตั้ง</h5>${boxes.length ? `<div class="grid">${boxes.map(([k, n]) => `<div class="card"><div class="ci">${HF[k].i}</div><div class="cb"><h4>${HF[k].n} ×${n}</h4><div class="row"><button class="btn ${sel === k ? '' : 'ghost'}" data-a="p23box" data-v="${k}">${sel === k ? 'กำลังเลือกวาง' : 'เลือกวาง'}</button></div></div></div>`).join('')}</div>` : '<p class="empty">ไม่มีกล่องรอติดตั้ง สั่งซื้อจากแคตตาล็อกก่อน</p>'}`;
  },
  fits(h, W, D, k, x, y, r) {
    const sp = HF[k], odd = r % 2, fw = odd ? sp.d : sp.w, fd = odd ? sp.w : sp.d;
    if (x < 0 || y < 0 || x + fw > W || y + fd > D - 1) return false;
    for (const it of h.items) {
      const s2 = HF[it.k]; if (!!s2.floor !== !!sp.floor) continue;
      const o2 = it.r % 2, w2 = o2 ? s2.d : s2.w, d2 = o2 ? s2.w : s2.d;
      if (x < it.x + w2 && x + fw > it.x && y < it.y + d2 && y + fd > it.y) return false;
    }
    return true;
  },
  placeAt(x, y) {
    const h = this.home(this.plHid), { W, D } = this.grid(this.plHid), pl = this.pl;
    if (!pl.sel) { const o = this.occ(h, W, D)[y][x]; let idx = o; if (idx < 0) idx = h.items.findIndex(it => HF[it.k].floor && x >= it.x && x < it.x + (it.r % 2 ? HF[it.k].d : HF[it.k].w) && y >= it.y && y < it.y + (it.r % 2 ? HF[it.k].w : HF[it.k].d)); pl.pick = idx; return; }
    const k = pl.sel, sp = HF[k];
    if (!this.fits(h, W, D, k, x, y, pl.r)) { UI.toast('วางตรงนี้ไม่ได้ (ชนกับของอื่นหรือเกินห้อง/บังประตู)', '⚠️'); return; }
    const fee = sp.pro ? Math.max(300, Math.round(sp.price * 0.08)) : 0;
    if (fee && S.money < fee) { UI.toast(`ต้องจ้างช่างติดตั้ง ${baht(fee)}`, '💸'); return; }
    if (!sp.pro && !useEnergy(2)) return;
    if (fee) { S.money -= fee; Bank2.log('ค่าช่างติดตั้ง ' + sp.n, -fee); }
    h.boxes[k]--; if (h.boxes[k] <= 0) delete h.boxes[k]; h.items.push({ k, x, y, r: pl.r });
    tick(sp.pro ? 60 : 10); Sfx.click(); UI.toast(`${sp.pro ? 'ช่างติดตั้ง' : 'ติดตั้ง'}${sp.n}เรียบร้อย`, sp.i);
    if (!h.boxes[k]) pl.sel = null; this.refresh();
  },
  order(k) {
    const f = HF[k], h = this.home(this.catHid || this.plHid); if (!f) return; const tot = f.price + 100;
    if (S.money < tot) { UI.toast('เงินไม่พอ', '💸'); return; }
    S.money -= tot; Bank2.log('สั่งเฟอร์นิเจอร์ ' + f.n, -tot); h.orders.push({ k, day: S.day + 1 }); Sfx.coin();
    Phone.msg('ร้านเฟอร์นิเจอร์สุขใจ', `รับออเดอร์ ${f.n} ${baht(tot)} แล้ว จัดส่งถึงบ้าน${RD(S.day + 1)}`); UI.toast(`สั่ง${f.n}แล้ว ส่งถึงพรุ่งนี้เช้า`, '📦');
  },
  requestUtil(w) {
    const h = this.home(this.utilHid), fee = w === 'e' ? 4000 : 1800; if (h.util[w] || S.money < fee) return;
    S.money -= fee; Bank2.log(w === 'e' ? 'ค่าประกันและติดตั้งมิเตอร์ไฟฟ้า' : 'ค่าประกันและติดตั้งมาตรน้ำ', -fee); h.util[w] = S.day + (w === 'e' ? 1 : 2);
    Phone.msg(w === 'e' ? 'การไฟฟ้า' : 'การประปา', `รับคำขอแล้ว นัดช่างติดตั้ง${RD(h.util[w])}`); UI.toast('ยื่นคำขอเรียบร้อย', w === 'e' ? '⚡' : '🚰'); this.refresh();
  },

  // ================= garage: up to 6 bays =================
  cap() { return 2 + this.V().garage; },
  gcost: [12000, 18000, 28000, 45000],
  carportX: [-7.8, -2.6, 2.6, 7.8],
  slotPos(i) { return i < 2 ? l2w(GARAGE.x, GARAGE.z, GARAGE.rot, -2.6 + i * 5.2, -0.4) : l2w(GARAGE.x, GARAGE.z, GARAGE.rot, this.carportX[i - 2], GARAGE.d / 2 + 3.6); },
  drawCarport() {
    if (this.cpG) { World.outdoor.remove(this.cpG); this.cpG = null; }
    const n = this.V().garage; if (!n) return;
    const g = new THREE.Group(); g.position.set(GARAGE.x, World.groundY(GARAGE.x, GARAGE.z), GARAGE.z); g.rotation.y = GARAGE.rot; World.outdoor.add(g); this.cpG = g;
    const zc = GARAGE.d / 2 + 3.6, x0 = this.carportX[0] - 2.6, x1 = this.carportX[n - 1] + 2.6, cx = (x0 + x1) / 2, w = x1 - x0;
    hbox(g, w, 0.06, 5.6, cx, 0.03, zc, 0x9e9e9e, { roughness: 0.9 });
    for (let i = 0; i <= n; i++) { hbox(g, 0.12, 3, 0.12, x0 + i * 5.2, 1.5, zc - 2.6, 0x455a64); hbox(g, 0.12, 3, 0.12, x0 + i * 5.2, 1.5, zc + 2.6, 0x455a64); hbox(g, 0.1, 0.01, 4.6, x0 + i * 5.2, 0.07, zc, 0xffffff); }
    const r = hbox(g, w + 0.8, 0.14, 6.2, cx, 3.1, zc, 0x607d8b, { roughness: 0.5, metalness: 0.3 }); r.rotation.x = -0.05;
    for (let i = 0; i < n; i++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.5), new THREE.MeshBasicMaterial({ map: U.signTex('ช่อง ' + (i + 3), { w: 256, h: 128, bg: '#1565c0' }) })); s.position.set(this.carportX[i], 2.6, zc - 2.6); g.add(s); }
  },
  hookGarage() {
    const me = this;
    Garage.slot = i => me.slotPos(i | 0);
    Garage.full = o => { const used = G.cars.filter(c => c !== o && c.d.parked).map(c => c.d.slot); for (let s = 0; s < me.cap(); s++) if (!used.includes(s)) return false; return true; };
    Garage.callHome = function (o) {
      if (G.driving === o) { UI.toast('ลงจากรถก่อนนะ', '🚗'); return; }
      const used = G.cars.filter(c => c !== o && c.d.parked).map(c => c.d.slot); let s = 0; while (used.includes(s) && s < me.cap()) s++;
      if (s >= me.cap()) { UI.toast(`โรงจอดเต็มแล้ว (จอดได้ ${me.cap()} คัน) อัปเกรดเพิ่มช่องจอดได้ที่เมนูโรงจอดรถ`, '🅿️'); return; }
      const p = this.slot(s); Object.assign(o.d, { x: p.x, z: p.z, r: GARAGE.rot + Math.PI, parked: true, slot: s });
      const n = this.rebuild(o); UI.toast(`${CARS[o.d.type].n} มาจอดที่ช่อง ${s + 1} แล้ว`, '🅿️'); Sfx.tone(520, 0.15, 'sine', 0.05); return n;
    };
    const _ui = Garage.ui.bind(Garage);
    Garage.ui = () => {
      _ui(); const c = UI.cur; if (!c) return; const r = c.render;
      c.render = t => r(t).replace('จอดได้ 2 คัน', `จอดได้ ${me.cap()} คัน`) + me.garageHTML(); UI.renderBody();
    };
  },
  garageHTML() {
    const lv = this.V().garage, max = lv >= 4;
    return `<h5>🏗️ ต่อเติมโรงจอดรถ</h5><div class="card"><div class="ci">🅿️</div><div class="cb"><h4>ช่องจอด ${this.cap()}/6 คัน</h4><p class="dim">${max ? 'ขยายครบสูงสุด 6 คันแล้ว' : `ต่อเติมช่องจอดต่อออกด้านข้างอีก 1 ช่อง ขนาดเท่าเดิม (ช่องที่ ${this.cap() + 1}) · ค่าก่อสร้าง ${baht(this.gcost[lv])}`}</p><div class="row"><button class="btn" data-a="gup23" ${max || S.money < this.gcost[lv] ? 'disabled' : ''}>${max ? 'สูงสุดแล้ว' : 'ต่อเติมช่องจอด'}</button></div></div></div>`;
  },
  garageUp() {
    const v = this.V(), c = this.gcost[v.garage]; if (v.garage >= 4 || c == null || S.money < c) return;
    S.money -= c; Bank2.log('ต่อเติมโรงจอดรถ', -c); v.garage++; this.drawCarport(); UI.toast(`ต่อเติมโรงจอดเสร็จ จอดได้ ${this.cap()} คัน`, '🅿️'); Life2.note('ต่อเติมโรงจอดรถเป็น ' + this.cap() + ' ช่อง');
  },

  // ================= farm expansion =================
  fcost: [8000, 14000, 24000],
  extraPlots() { return 6 * this.V().fx; },
  ensurePlots() {
    const want = 30 + this.extraPlots();
    while (S.plots.length < want) S.plots.push({ c: null, g: 0, w: 0, f: 0 });
    while (G.plots.length < S.plots.length) G.plots.push(makePlot(G.plots.length));
    if (S.plots.length > 30) { const c = plotCenter(36); World.clearNear(c.x - 4, c.z - 4, 10, true); }
    refreshField();
  },
  farmUp() {
    const v = this.V(), c = this.fcost[v.fx]; if (v.fx >= 3 || c == null || S.money < c) return;
    if (S.up.field < 4) { UI.toast('ขยายแปลงผักเดิมให้ครบ 30 แปลงก่อน (ร้านเกษตร)', '🟫'); return; }
    S.money -= c; Bank2.log('ขยายพื้นที่ปลูกผัก', -c); v.fx++; this.ensurePlots(); UI.toast(`ขยายไร่เพิ่ม 6 แปลง (รวม ${30 + this.extraPlots()} แปลง) อยู่ด้านใต้แปลงเดิม`, '🟫'); Life2.note('ขยายพื้นที่ปลูกผักเป็น ' + (30 + this.extraPlots()) + ' แปลง');
  },
  // ================= house wing rooms =================
  ext23: {
    bedroom2: { btn: 'นอนพักกลางวัน 2 ชม. (พลังงาน +10)', do() { S.energy = Math.min(maxEnergy(), S.energy + 10); return [120, 'นอนพักกลางวันสบายมาก พลังงาน +10']; } },
    library: { btn: 'อ่านหนังสือ 1 ชม.', do() { S.mood = Math.min(100, (S.mood || 50) + 8); Prog.add(5); return [60, 'อ่านหนังสือเพลิน ได้ความรู้และอารมณ์ดี']; } },
    kitchen2: { btn: 'เข้าครัวทำอาหาร', open: () => UI.cook() },
    cinema: { btn: 'ดูหนัง 2 ชม. (อารมณ์ +20)', do() { S.mood = Math.min(100, (S.mood || 50) + 20); return [120, 'หนังสนุกมาก อารมณ์ +20']; } },
    herb: { btn: 'เก็บสมุนไพรสด (พลังงาน +8)', do() { S.energy = Math.min(maxEnergy(), S.energy + 8); return [30, 'เก็บสมุนไพรกลิ่นหอม พลังงาน +8']; } },
    sauna: { btn: 'อบซาวน่า 1 ชม.', do() { S.mood = Math.min(100, (S.mood || 50) + 15); S.energy = Math.min(maxEnergy(), S.energy + 8); return [60, 'ผ่อนคลายสุด ๆ อารมณ์ +15 พลังงาน +8']; } },
  },
  use23(k) {
    const X = this.ext23[k], xd = this.V().xd; if (!X) return;
    if (X.open) { UI.close(); X.open(); return; }
    if (xd[k] === S.day) { UI.toast('วันนี้ใช้ห้องนี้ไปแล้ว', '⏳'); return; }
    xd[k] = S.day; UI.close(); fade(() => { const [m, t] = X.do(); tick(m); UI.toast(t, HOUSE_EXT[k].i); });
  },

  // ================= property menu =================
  open(tab) {
    UI.open('ทรัพย์สินและก่อสร้าง', ['ทรัพย์สินของฉัน', 'ที่ดินและบ้านจัดสรร', 'ฟาร์มและคอก', 'บ้านและโรงจอดรถ'], t => [() => this.t0(), () => this.t1(), () => this.t2(), () => this.t3()][t](), { tab: tab || 0 });
  },
  t0() { return `<p class="lead">ที่ดิน บ้าน อาคาร และบริษัทที่คุณเป็นเจ้าของ แสดงในแผนที่ด้วยวงสีทอง</p><div class="grid">${this.listHTML()}</div>`; },
  t1() {
    const hb = HomeBuild.st().lots, es = Estate.st();
    return `<p class="lead">ที่ดินจัดสรรริมถนนสายหลัก ซื้อแล้วจ้างสร้างบ้านได้ (3 วัน) บ้านที่สร้างเสร็จเข้าไปข้างในได้ แต่ยังว่างเปล่า ต้องสั่งเฟอร์นิเจอร์มาติดตั้งเอง</p>
      <h5>ที่ดินและบ้านที่สร้างเอง (${LOTS.length} แปลง)</h5><div class="grid">${LOTS.map(L => { const s = hb[L.id]; return `<div class="card"><div class="ci">${s ? (s.design ? HOUSE_DESIGNS[s.design].i : '📜') : '🏗️'}</div><div class="cb"><h4>${esc(L.n)}</h4><p class="dim">${esc(HomeBuild.label(L))}</p><div class="row">${s ? `<button class="btn" data-a="lotui" data-v="${L.id}">จัดการ</button>` : `<button class="btn" data-a="lotbuy" data-v="${L.id}" ${S.money >= L.price ? '' : 'disabled'}>ซื้อ ${baht(L.price)}</button>`}<button class="btn ghost" data-a="p23golot" data-v="${L.id}">🚕 ไปดูแปลง</button></div></div></div>`; }).join('')}</div>
      <h5>ตลาดอสังหาริมทรัพย์</h5><div class="grid">${PROPS.map(P => { const own = es.own[P.k]; return `<div class="card"><div class="ci">${P.i}</div><div class="cb"><h4>${esc(P.n)}</h4><p class="dim">${own ? 'ของคุณ' : 'ราคา ' + baht(Estate.price(P))}</p><div class="row">${own ? `<button class="btn ghost" data-a="estsell" data-v="${P.k}">ขาย</button>` : `<button class="btn" data-a="estbuy" data-v="${P.k}" ${S.money >= Estate.price(P) ? '' : 'disabled'}>ซื้อ</button>`}${this.est[P.k] ? `<button class="btn ghost" data-a="p23goest" data-v="${P.k}">🚕 ไปดู</button>` : ''}</div></div></div>`; }).join('')}</div>`;
  },
  t2() {
    const v = this.V(), lv = v.fx, mx = lv >= 3, c = this.fcost[lv];
    return `<p class="lead">ฟาร์มของคุณมี ${typeof farmPlotCount === 'function' ? farmPlotCount() : S.plots.length} แปลง · คอกสัตว์ระดับ ${S.up.barn} (เลี้ยงได้ ${BARN_CAP[S.up.barn - 1]} ตัว)</p><div class="grid">
      <div class="card"><div class="ci">🟫</div><div class="cb"><h4>ขยายพื้นที่ปลูกผัก (ระดับ ${lv}/3)</h4><p class="dim">${mx ? 'ขยายสูงสุดแล้ว' : S.up.field < 4 ? 'ต้องขยายแปลงผักเดิมเป็น 30 แปลงก่อน (ร้านเกษตร)' : `เพิ่ม 6 แปลงต่อระดับ ที่ดินด้านใต้ของไร่ · ${baht(c)}`}</p><div class="row"><button class="btn" data-a="fx23" ${mx || S.money < c || S.up.field < 4 ? 'disabled' : ''}>ขยายไร่</button></div></div></div>
      <div class="card"><div class="ci">🐄</div><div class="cb"><h4>ขยายโรงเรือนสัตว์ (ระดับ ${S.up.barn}/${BARN_CAP.length})</h4><p class="dim">ถึง ${BARN_CAP.length} ระดับ สูงสุด ${BARN_CAP[BARN_CAP.length - 1]} ตัว · ซื้อได้ที่ร้านช่างไม้</p></div></div>
      <div class="card"><div class="ci">🌳</div><div class="cb"><h4>สวนผลไม้ ${S.up.orchard ? 'เปิดแล้ว' : 'ยังไม่เปิด'}</h4><p class="dim">เปิดสวนผลไม้ที่ร้านช่างไม้ ${S.up.orchard ? '' : '3,000 ฿'}</p></div></div>
      <div class="card"><div class="ci">🚜</div><div class="cb"><h4>ไร่นอกเมือง</h4><p class="dim">ซื้อที่ดินทำไร่ขนาดใหญ่ได้ริมถนน (ดูที่แผนที่ ไอคอน 🚜)</p></div></div></div>`;
  },
  t3() {
    const E = S.ext || {};
    return `<p class="lead">บ้านระดับ ${S.up.house}/3 · ห้องต่อเติม ${Object.keys(E).length}/${Object.keys(HOUSE_EXT).length}</p><div class="grid">
      <div class="card"><div class="ci">🧱</div><div class="cb"><h4>ต่อเติมปีกบ้าน</h4><p class="dim">เพิ่มห้องได้ ${Object.keys(HOUSE_EXT).length} แบบ (ห้องทำงาน ห้องนอนแขก ฟิตเนส ห้องสมุด โฮมเธียเตอร์ ซาวน่า ฯลฯ)</p><div class="row"><button class="btn" data-a="p23ext">เปิดเมนูต่อเติมบ้าน</button></div></div></div>
      <div class="card"><div class="ci">🎨</div><div class="cb"><h4>ตกแต่งภายในบ้าน</h4><p class="dim">เปลี่ยนสีผนัง (${WALLS.length} สี) พื้น (${FLOORS.length} แบบ) ย้ายเฟอร์นิเจอร์ได้ทุกชิ้นเมื่ออยู่ในบ้าน (เมนูแต่งบ้าน)</p></div></div>
      <div class="card"><div class="ci">🅿️</div><div class="cb"><h4>โรงจอดรถ ${this.cap()}/6 คัน</h4><p class="dim">${this.V().garage >= 4 ? 'ขยายครบสูงสุดแล้ว' : `ต่อเติมเพิ่ม 1 ช่อง ${baht(this.gcost[this.V().garage])}`}</p><div class="row"><button class="btn" data-a="gup23" ${this.V().garage >= 4 || S.money < this.gcost[this.V().garage] ? 'disabled' : ''}>ต่อเติมช่องจอด</button></div></div></div></div>`;
  },

  init() {
    this.V();
    // hooks
    Rooms.build = ((_b) => (def, K) => { _b(def, K); if (def.home) this.build(def, K); })(Rooms.build.bind(Rooms));
    const _nd = newDay; newDay = () => { _nd(); this.dayTick(); };
    const _pu = plotUnlocked; plotUnlocked = (i, l) => i < 30 ? _pu(i, l) : (l >= 4 && i < 30 + this.extraPlots());
    this.ensurePlots();
    this.hookGarage(); this.drawCarport();
    this.hookHomeBuild();
    for (const P of PROPS) this.drawEst(P.k);
    { const _b = Estate.buy.bind(Estate), _s = Estate.sell.bind(Estate); Estate.buy = k => { _b(k); this.drawEst(k); }; Estate.sell = k => { _s(k); this.drawEst(k); }; }
    // map overlay
    const _bm = UI.bigMap.bind(UI);
    UI.bigMap = () => {
      _bm(); const c = UI.cur; if (!c) return; const r = c.render, a = c.after;
      c.render = t => r(t) + this.mapList(); c.after = () => { if (a) a(); this.markers(); }; UI.renderBody();
    };
    // phone app + handlers
    APPS.push({ id: 'prop23', i: '🏘️', n: 'ทรัพย์สิน' }); Phone.apps.prop23 = phoneGo(() => this.open(0));
    { const _ub = HouseExt.useBtn.bind(HouseExt); HouseExt.useBtn = k => this.ext23[k] ? `<button class="btn ghost" data-a="ext23" data-v="${k}" ${this.V().xd[k] === S.day ? 'disabled' : ''}>${this.ext23[k].btn}</button>` : _ub(k); }
    Object.assign(UI.H, {
      p23go: d => this.go(d.v),
      p23golot: d => { const L = HomeBuild.lot(d.v), i = this.list().length; this.goXZ(L.x + 0, L.z + 8, L.n); },
      p23goest: d => { const e = this.est[d.v]; if (e) this.goXZ(e.door.x, e.door.z, PROPS.find(p => p.k === d.v).n); },
      p23cell: d => this.placeAt(+d.x, +d.y),
      p23rot: () => { this.pl.r = (this.pl.r + 1) % 4; },
      p23cancel: () => { this.pl.sel = null; },
      p23box: d => { this.pl.sel = this.pl.sel === d.v ? null : d.v; this.pl.pick = -1; },
      p23unpick: () => { this.pl.pick = -1; },
      p23stow: () => { const h = this.home(this.plHid), it = h.items[this.pl.pick]; if (!it) return; h.items.splice(this.pl.pick, 1); h.boxes[it.k] = (h.boxes[it.k] || 0) + 1; this.pl.pick = -1; tick(5); UI.toast('ยกเก็บใส่กล่องแล้ว', '📦'); this.refresh(); },
      p23order: d => this.order(d.v),
      p23util: d => this.requestUtil(d.v),
      gup23: () => this.garageUp(),
      fx23: () => this.farmUp(),
      ext23: d => this.use23(d.v),
      p23ext: () => { UI.close(); HouseExt.ui(); },
    });
  },
  goXZ(x, z, name) {
    if (this.closed(x, z)) { UI.toast(`${name} อยู่ในเมืองที่ปิดแล้ว ไปไม่ได้ (ไม่คิดค่าแท็กซี่)`, '🚧'); return; }
    if (G.driving) { UI.toast('ลงจากรถก่อนเรียกแท็กซี่', '🚕'); return; }
    const fee = this.fare(x, z); if (S.money < fee) { UI.toast(`ค่าแท็กซี่ ${baht(fee)} เงินไม่พอ`, '💸'); return; }
    S.money -= fee; Bank2.log('ค่าแท็กซี่ไป ' + name, -fee); Phone.app = null; UI.close();
    fade(() => { if (G.away) Town2.leaveAway(true); leaveIndoors(); tick(Math.max(5, Math.round(fee / 4))); G.player.pos.set(x, World.groundY(x, z), z); G.player.rot = 0; snapCam(); UI.toast(`แท็กซี่ส่งถึง ${name} แล้ว (${baht(fee)})`, '🚕'); });
  },
};
V23.add('prop', () => Prop23.init());
