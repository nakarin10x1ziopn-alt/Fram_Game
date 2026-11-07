'use strict';
// ---------- v186_houses: what a house on your own land still needed (buying, extending, decorating) ----------
//  Audit of the whole "buy a plot -> build -> live in it" chain found these gaps, all added here:
//   * buying a plot: ID card + house registration were checked, but no land transfer fee -> 1% buyer's share of the 2% transfer fee, paid when the title is transferred
//   * after the house is built: no house number -> the house-number card lives in the property app (v185); the number plate is now fixed on the front of the house
//   * extending: only solar panels / smart-home kit existed -> five real extensions (kitchen at the back, carport, wooden deck, fence + gate, second floor for the flat-roof house):
//       building permit (kitchen, carport, second floor: 1,500 THB, approved next morning 10:00) -> contractor builds for the stated days -> drawn on the house and
//       listed: raises the asking rent / asking price you set when you list the house and keeps tenants happier. One job per house at a time.
//   * decorating: the walk-in houses had furniture only -> every walk-in house (your plots and bought properties) has a colour chart on the back wall: choose the wall colour (3,500) and
//       the floor (8,000), the room is repainted at once
//   * a house you built can be given a name of your own (shows on the map, the door and the property list)
//  Nothing existing is edited: this file only wraps the plot window, the plot drawing and the room builder, and keeps its own data in S.v186.
V23.add('v186_houses', () => {
  if (typeof HomeBuild === 'undefined' || typeof Rooms === 'undefined' || typeof Util185 === 'undefined' || typeof Estate39 === 'undefined') return;
  const E = Estate39, esc2 = s => (typeof esc === 'function' ? esc(s) : String(s)), baht2 = n => (typeof baht === 'function' ? baht(n) : '฿' + Math.round(n).toLocaleString('en-US'));
  const toast = (t, i) => { try { UI.toast(t, i || 'ℹ️'); } catch (e) { } };
  const msg = (f, t) => { try { Phone.msg(f, t, true); } catch (e) { } };
  const rd = d => { try { return RD(d); } catch (e) { return 'วันที่ ' + d; } };
  const st = () => { const s = S.v186 = S.v186 || { ext: {}, deco: {}, fee: {} }; s.ext = s.ext || {}; s.deco = s.deco || {}; s.fee = s.fee || {}; return s; };
  const sx = key => { const s = st(); return s.ext[key] = s.ext[key] || { done: [], job: null }; };
  const pay = (amt, label) => { if (S.money < amt) { toast('เงินสดไม่พอ ต้องใช้ ' + baht2(amt), '💸'); return false; } S.money -= amt; try { Bank2.log(label, -amt); } catch (e) { } return true; };

  // ---------- extensions ----------
  const EXT = {
    kitchen: { n: 'ต่อเติมครัวหลังบ้าน', i: '🍳', cost: 85000, days: 3, rent: 0.06, permit: 1500, desc: 'ห้องครัวไทยหลังบ้านแยกจากตัวบ้าน ควันไม่เข้าห้องนั่งเล่น' },
    carport: { n: 'โรงจอดรถข้างบ้าน', i: '🚗', cost: 60000, days: 2, rent: 0.04, permit: 1500, desc: 'หลังคาเมทัลชีทกันแดดกันฝนจอดรถได้ 2 คัน' },
    deck: { n: 'ลานไม้หน้าบ้าน', i: '🪵', cost: 48000, days: 2, rent: 0.03, permit: 0, desc: 'ลานไม้เทียมนั่งเล่นหน้าบ้าน' },
    fence: { n: 'รั้วและประตูบ้าน', i: '🚧', cost: 45000, days: 2, rent: 0.03, permit: 0, desc: 'รั้วรอบที่ดินพร้อมประตูรั้ว ผู้เช่ารู้สึกปลอดภัย' },
    floor2: { n: 'ต่อเติมชั้น 2', i: '🏠', cost: 280000, days: 7, rent: 0.25, permit: 1500, only: 'modern', desc: 'ต่อเติมห้องชั้น 2 บนหลังคาแบน (เฉพาะบ้านโมเดิร์นหลังคาแบน)' },
  };
  const lotOK = key => { const l = HomeBuild.st().lots[key]; return !!(l && l.design && l.stage >= 3); };
  const owned = key => { try { return E.ids().includes('hb:' + key); } catch (e) { return false; } };
  const bonus = key => sx(key).done.reduce((t, k) => t + (EXT[k] ? EXT[k].rent : 0), 0);
  const can = (key, k) => { const l = HomeBuild.st().lots[key], X = EXT[k]; if (!l || !X) return 'ไม่มีบ้านหลังนี้'; if (!lotOK(key)) return 'ต้องสร้างบ้านเสร็จก่อน'; if (X.only && l.design !== X.only) return 'ใช้ได้กับ' + (HOUSE_DESIGNS[X.only] || {}).n + 'เท่านั้น'; if (sx(key).done.includes(k)) return 'ทำแล้ว'; if (sx(key).job) return 'มีงานต่อเติมอยู่ (ผู้รับเหมาทำทีละงาน)'; return ''; };
  const A = {
    ext(key, k) {
      const X = EXT[k]; if (!X || !owned(key)) return; const bad = can(key, k); if (bad) { toast(bad, '🏗️'); return; }
      try { if (typeof Gov24 !== 'undefined' && !Gov24.need(['idcard'], 'ขอต่อเติมบ้าน')) return; } catch (e) { }
      const tot = X.cost + X.permit; if (!pay(tot, `ต่อเติม${X.n.replace('ต่อเติม', '')} ${(HomeBuild.st().lots[key] || {}).name || key}`)) return;
      sx(key).job = { k, st: X.permit ? 'permit' : 'build', day: S.day + 1, end: X.permit ? 0 : S.day + 1 + X.days };
      toast(X.permit ? `ยื่นขออนุญาตต่อเติม${X.n.replace('ต่อเติม', '')} เทศบาลอนุมัติพรุ่งนี้ 10:00` : `ผู้รับเหมาเริ่มงาน ${X.n} พรุ่งนี้`, X.i);
      msg('ผู้รับเหมาบ้านสุขใจ', `รับงาน ${X.n} ราคา ${baht2(X.cost)}${X.permit ? ` + ค่าขออนุญาตดัดแปลงอาคาร ${baht2(X.permit)}` : ''} · ${X.permit ? 'เทศบาลอนุมัติ' + rd(S.day + 1) + ' แล้วเริ่มก่อสร้าง ' : 'เริ่มงาน' + rd(S.day + 1) + ' '}ใช้เวลา ${X.days} วัน`);
    },
    ren(key) {
      const l = HomeBuild.st().lots[key]; if (!l || !l.design || !owned(key)) return; let n = null;
      try { n = window.prompt('ตั้งชื่อบ้านหลังนี้ (ไม่เกิน 24 ตัวอักษร)', l.name || (HOUSE_DESIGNS[l.design] || {}).n || ''); } catch (e) { }
      if (n == null) return; n = String(n).trim().slice(0, 24); if (!n) return; l.name = n; try { HomeBuild.draw(key); } catch (e) { } toast('ตั้งชื่อบ้านเป็น “' + n + '” แล้ว', '🏠');
    },
  };

  // jobs move on with the clock (same hooks as the utilities app)
  function hour(h) {
    const due = (day, at) => S.day > day || (S.day === day && h >= at);
    for (const [key, x] of Object.entries(st().ext)) {
      const j = x.job; if (!j) continue; const X = EXT[j.k], nm = (HomeBuild.st().lots[key] || {}).name || key;
      if (!X || !HomeBuild.st().lots[key]) { x.job = null; continue; }
      if (j.st === 'permit' && due(j.day, 10)) { j.st = 'build'; j.end = S.day + X.days; msg('เทศบาลตำบลสุขใจ', `อนุมัติใบอนุญาตดัดแปลงอาคาร: ${X.n} (${nm}) ผู้รับเหมาเริ่มงานวันนี้ เสร็จ${rd(j.end)}`); }
      else if (j.st === 'build' && due(j.end, 13)) {
        x.done.push(j.k); x.job = null; try { HomeBuild.draw(key); } catch (e) { }
        try { const p = (E.X().props || {})['hb:' + key]; if (p && p.lease && p.lease.sat != null) p.lease.sat = Math.min(100, p.lease.sat + 4); p && (p.cond = Math.min(100, (p.cond || 90) + 2)); } catch (e) { }
        msg('ผู้รับเหมาบ้านสุขใจ', `${X.n} ที่ ${nm} เสร็จเรียบร้อยแล้ว ${X.i} (ค่าเช่า/ราคาประกาศขายตอนลงประกาศจะสูงขึ้น ${Math.round(X.rent * 100)}%)`);
      }
    }
  }
  { const _hs = Power.hourStep; Power.hourStep = function (h) { const r = _hs.apply(this, arguments); try { hour(h); } catch (e) { console.warn('v186 hour', e); } return r; }; }
  { const _sm = Smart.morning; Smart.morning = function () { const r = _sm.apply(this, arguments); try { hour(0); } catch (e) { } return r; }; }

  // listing prices follow the extensions
  for (const k of ['listRent', 'sale.start']) {
    const f = E.A[k]; if (typeof f !== 'function') continue;
    E.A[k] = function (id) {
      const p = (E.X().props || {})[id], b0 = p && (k === 'listRent' ? p.ask : p.sale && p.sale.ask); const r = f.apply(this, arguments);
      try { if (id && id.startsWith('hb:')) { const b = bonus(id.slice(3)); if (b > 0) { const q = (E.X().props || {})[id]; if (k === 'listRent' && q && q.st === 'rent' && q.ask !== b0) q.ask = Math.round(q.ask * (1 + b) / 100) * 100; if (k === 'sale.start' && q && q.sale && q.sale.ask !== b0) q.sale.ask = Math.round(q.sale.ask * (1 + b) / 1000) * 1000; } } } catch (e) { }
      return r;
    };
  }

  // ---------- drawing: extensions, number plate, and the 1% transfer fee for a freshly bought plot ----------
  const mk = (g, w, h, d, x, y, z, col, o) => { const m = U.mk(g, GEO.box, mc(col, o || { roughness: 0.8 }), [x, y, z], [w, h, d]); return m; };
  function extras(id) {
    const rec = HomeBuild.g[id], l = HomeBuild.st().lots[id]; if (!rec || !rec.g) return; const D = l && l.design && HOUSE_DESIGNS[l.design]; if (!D || l.stage < 3) return;
    const old = rec.g.getObjectByName('x186'); if (old) rec.g.remove(old);
    const o = D.o, w = o.w, d = o.d, G2 = new THREE.Group(); G2.name = 'x186';
    const r = Util185.st().p['L:' + id], x = sx(id);
    if (r && r.addr === 1 && r.addrNo) { try { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.42), new THREE.MeshBasicMaterial({ map: U.signTex(String(r.addrNo).split(' ')[0], { w: 256, h: 104, bg: '#1565c0', fg: '#ffffff' }) })); m.position.set(w * 0.3, 1.7, d / 2 + 0.09); G2.add(m); } catch (e) { } }
    if (x.done.includes('kitchen')) { mk(G2, w * 0.5, 3.0, 3.0, w * 0.15, 1.5, -d / 2 - 1.5, 0xf0e6d6); mk(G2, w * 0.55, 0.2, 3.3, w * 0.15, 3.1, -d / 2 - 1.5, 0x8d6e63); mk(G2, 1.0, 0.9, 0.06, w * 0.15, 1.7, -d / 2 + 0.02 - 3.02, 0x90caf9, { roughness: 0.2 }); }
    if (x.done.includes('carport')) { const cx = w / 2 + 2.6, cz = d * 0.1; mk(G2, 4.2, 0.05, 6.0, cx, 0.03, cz, 0x9e9e9e); for (const sx2 of [-1.9, 1.9]) for (const sz of [-2.8, 2.8]) mk(G2, 0.16, 2.7, 0.16, cx + sx2, 1.35, cz + sz, 0x546e7a); mk(G2, 4.6, 0.14, 6.4, cx, 2.78, cz, 0x607d8b, { roughness: 0.4, metalness: 0.4 }); }
    if (x.done.includes('deck')) { mk(G2, w * 0.8, 0.22, 2.6, 0, 0.11, d / 2 + 1.6, 0xb08968); for (let i = -2; i <= 2; i++) mk(G2, 0.05, 0.02, 2.6, i * w * 0.18, 0.23, d / 2 + 1.6, 0x8d6e63); }
    if (x.done.includes('fence')) {
      const hx = w / 2 + 6.5, hz = d / 2 + 6.5, col = 0xfafafa, post = 0x78909c, gate = 2.2;
      const seg = (ax, az, bx, bz) => { const L = Math.hypot(bx - ax, bz - az), g = new THREE.Group(); g.position.set((ax + bx) / 2, 0, (az + bz) / 2); g.rotation.y = -Math.atan2(bz - az, bx - ax); mk(g, L, 1.1, 0.1, 0, 0.65, 0, col); mk(g, L, 0.1, 0.14, 0, 1.25, 0, post); G2.add(g); };
      seg(-hx, -hz, hx, -hz); seg(-hx, -hz, -hx, hz); seg(hx, -hz, hx, hz); seg(-hx, hz, -gate, hz); seg(gate, hz, hx, hz);
      for (const [px, pz] of [[-hx, -hz], [hx, -hz], [-hx, hz], [hx, hz], [-gate, hz], [gate, hz]]) mk(G2, 0.22, 1.5, 0.22, px, 0.75, pz, post);
    }
    if (x.done.includes('floor2')) { const h0 = o.h || 3.6; mk(G2, w * 0.78, 3.0, d * 0.78, 0, h0 + 0.4 + 1.5, 0, o.wall || 0xfafafa); mk(G2, w * 0.86, 0.2, d * 0.86, 0, h0 + 0.4 + 3.1, 0, 0x9e9e9e); mk(G2, w * 0.5, 1.2, 0.05, 0, h0 + 0.4 + 1.7, d * 0.39 + 0.03, 0x90caf9, { roughness: 0.2 }); }
    rec.g.add(G2);
  }
  // fee: lots that existed before the game was loaded are known; a plot that shows up afterwards was just bought
  const known = new Set(); let ready = false;
  { let n = 0; const iv = setInterval(() => { try { if (typeof G !== 'undefined' && G.started) { if (++n >= 4) { ready = true; clearInterval(iv); } } } catch (e) { } }, 1000); }
  function transferFee(id) {
    const l = HomeBuild.st().lots[id]; if (!l) return; if (!ready || known.has(id)) { known.add(id); return; } known.add(id);
    const s = st(); if (s.fee[id]) return; s.fee[id] = 1; const L = HomeBuild.lot(id); if (!L || l.design) return;
    const fee = Math.round(L.price * 0.01 / 10) * 10; if (fee > 0 && S.money >= fee) { S.money -= fee; try { Bank2.log('ค่าธรรมเนียมโอนกรรมสิทธิ์ที่ดิน (ส่วนผู้ซื้อ 1%) ' + L.n, -fee); } catch (e) { } msg('สำนักงานที่ดินอำเภอสุขใจ', `โอนกรรมสิทธิ์ ${L.n} เรียบร้อย เก็บค่าธรรมเนียมโอนส่วนผู้ซื้อ 1% = ${baht2(fee)} · ถัดไป: ขอไฟ/น้ำชั่วคราวและเลือกแบบบ้านได้ในแอป ไฟ-น้ำ-เน็ต`); }
  }
  { const _d = HomeBuild.draw.bind(HomeBuild); HomeBuild.draw = function (id) { const r = _d(id); try { transferFee(id); extras(id); } catch (e) { console.warn('v186 draw', e); } return r; }; }
  try { for (const k of Object.keys(HomeBuild.st().lots || {})) known.add(k); } catch (e) { }

  // ---------- plot window: extensions, rename ----------
  const extBlock = key => {
    const l = HomeBuild.st().lots[key]; if (!l || !l.design || l.stage < 3) return ''; const x = sx(key), b = bonus(key);
    const rows = Object.entries(EXT).map(([k, X]) => {
      const bad = can(key, k), j = x.job && x.job.k === k ? x.job : null;
      const state = x.done.includes(k) ? '✅ ต่อเติมแล้ว' : j ? (j.st === 'permit' ? '📄 รอเทศบาลอนุมัติ ' + rd(j.day) : '🔨 กำลังก่อสร้าง เสร็จ' + rd(j.end)) : bad ? `<span class="dim">${esc2(bad)}</span>` : '';
      return `<div class="card"><div class="ci">${X.i}</div><div class="cb"><h4>${X.n} ${baht2(X.cost)}</h4><p class="dim">${X.desc} · ${X.days} วัน${X.permit ? ` · ค่าขออนุญาต ${baht2(X.permit)}` : ''} · ค่าเช่า/ราคาขาย +${Math.round(X.rent * 100)}%</p><div class="row">${state && !(bad === '' && !x.done.includes(k) && !j) ? `<span>${state}</span>` : `<button class="btn ghost" data-a="u186" data-v="ext|${key}|${k}" ${S.money < X.cost + X.permit ? 'disabled' : ''}>ขอต่อเติม</button>`}</div></div></div>`;
    }).join('');
    return `<h5>🏗️ ต่อเติม & ตั้งชื่อบ้าน</h5><p class="dim">ต่อเติมแล้วรวม +${Math.round(b * 100)}% ตอนลงประกาศเช่า/ขาย · ผู้รับเหมาทำทีละงาน · ตกแต่งภายใน: เข้าไปในบ้านแล้วกด E ที่แผ่นเลือกสีผนังหลังห้อง</p><div class="row"><button class="btn ghost" data-a="u186" data-v="ren|${key}">✏️ ตั้งชื่อบ้าน</button></div><div class="grid">${rows}</div>`;
  };
  { const _u = HomeBuild.ui.bind(HomeBuild); HomeBuild.ui = function (id) { const r = _u(id); try { const c = UI.cur; if (c && c.render && !c.u186) { c.u186 = 1; const f = c.render; c.render = t => f.call(c, t) + extBlock(id); UI.renderBody(); } } catch (e) { console.warn('v186 ui', e); } return r; }; }

  // ---------- decoration of walk-in houses ----------
  const WALLS = [['ครีมอบอุ่น', 0xfaf3e6, 0], ['ฟ้าอ่อน', 0xdcecf7, 3500], ['เขียวมิ้นต์', 0xdcf0e4, 3500], ['ชมพูพาสเทล', 0xf8dfe6, 3500], ['เหลืองนวล', 0xfff1c9, 3500], ['เทาอบอุ่น', 0xe3e0da, 3500], ['น้ำเงินกรมท่า', 0x3f4f7a, 4500], ['ส้มอิฐ', 0xd98b6a, 4500]];
  const FLOORS = [['ไม้ธรรมชาติ', 0xd7ccc8, 0], ['ไม้โอ๊กเข้ม', 0x8d6e63, 8000], ['ปาร์เก้ทอง', 0xc9a56b, 8000], ['ไม้วอลนัท', 0x5d4037, 9000], ['หินอ่อนขาว', 0xeceff1, 12000], ['กระเบื้องเทา', 0xb0bec5, 8000]];
  const hex = n => '#' + n.toString(16).padStart(6, '0');
  const homeName = hid => { try { return Prop23.homeName(hid); } catch (e) { return 'บ้าน'; } };
  function decoUI(hid) {
    UI.open('ทาสีผนัง & เปลี่ยนพื้น · ' + homeName(hid), null, () => {
      const d = st().deco[hid] || {}, w = d.w || 0, f = d.f || 0;
      const sw = (kind, L, cur) => L.map((c, i) => `<button class="btn ${i === cur ? '' : 'ghost'}" data-a="u186" data-v="deco|${hid}|${kind}|${i}" style="border-left:14px solid ${hex(c[1])}" ${i === cur ? 'disabled' : ''}>${c[0]}${i === cur ? ' ✓' : c[2] ? ' ' + baht2(c[2]) : ' (ฟรี)'}</button>`).join('');
      return `<p class="lead">ช่างทาสีและช่างปูพื้น เปลี่ยนแล้วห้องเปลี่ยนสีทันที (เฟอร์นิเจอร์ที่ติดตั้งไว้ไม่ต้องย้าย)</p><h5>🎨 สีผนัง</h5><div class="row" style="flex-wrap:wrap">${sw('w', WALLS, w)}</div><h5>🪵 พื้น</h5><div class="row" style="flex-wrap:wrap">${sw('f', FLOORS, f)}</div>`;
    });
  }
  A.deco = (hid, kind, i) => {
    i = +i; const L = kind === 'w' ? WALLS : FLOORS, c = L[i]; if (!c) return; const d = st().deco[hid] = st().deco[hid] || {}; if ((d[kind] || 0) === i) return;
    const fee = c[2]; if (fee && !pay(fee, `${kind === 'w' ? 'ทาสีผนัง' : 'เปลี่ยนพื้น'} ${homeName(hid)}`)) return; d[kind] = i;
    toast(`${kind === 'w' ? 'ทาสีผนัง' : 'เปลี่ยนพื้น'}เป็น${c[0]}แล้ว`, '🎨'); try { Prop23.refresh(); } catch (e) { }
  };
  { const _b = Rooms.build.bind(Rooms);
    Rooms.build = function (def, K) {
      let K2 = K; try { if (def && def.home) { const d = st().deco[def.home]; if (d) K2 = Object.assign({}, K, { wall: WALLS[d.w || 0][1], floor: FLOORS[d.f || 0][1] }); } } catch (e) { }
      const r = _b(def, K2);
      try {
        if (def && def.home) {
          const X = RM0.x, Z = RM0.z, g = Rooms.group, z = Z - K.d / 2 + 0.16;
          const bd = U.mk(g, GEO.box, mc(0xffffff), [X, 1.55, z], [1.9, 1.0, 0.05]); void bd;
          [0xf8dfe6, 0xdcecf7, 0xfff1c9, 0xdcf0e4, 0x3f4f7a].forEach((c, i) => U.mk(g, GEO.box, mc(c), [X - 0.72 + i * 0.36, 1.55, z + 0.04], [0.3, 0.8, 0.03]));
          Rooms.pois.push({ kind: 'act', x: X, z: Z - K.d / 2 + 1.1, r: 1.6, label: 'แผ่นเลือกสีผนัง / พื้นห้อง', icon: '🎨', act: () => ({ icon: '🎨', label: 'เลือกสีผนัง / เปลี่ยนพื้นห้อง', fn: () => decoUI(def.home) }) });
          World.inPois = Rooms.pois;
        }
      } catch (e) { console.warn('v186 deco', e); }
      return r;
    }; }
  UI.H.u186 = d => {
    const [k, ...r] = String(d.v || '').split('|');
    try { if (A[k]) A[k](...r); } catch (e) { if (e && e.spend173) throw e; console.warn('v186', k, e); }
    try { if (UI.cur && UI.cur.render) UI.renderBody(); } catch (e) { }
  };
  window.House186 = { EXT, st, A, bonus, extras, hour, sign: id => { try { HomeBuild.draw(id); } catch (e) { } }, decoUI, WALLS, FLOORS };
});
