'use strict';
// ---------- Farm garage (store & call cars) and the tuning shop (paint, engine, tyres, spoiler, neon, horn) ----------
const GARAGE = { x: -60, z: -46, rot: Math.PI / 2, w: 11, d: 7.5 };
FLAT_PADS.push({ x: GARAGE.x, z: GARAGE.z, r: 11 });
const TUNE_SHOP = { x: -19, z: -244, rot: Math.PI / 2 };
const PAINTS = [['เดิม', null], ['แดงเพลิง', 0xd32f2f], ['ส้มมะนาว', 0xf57c00], ['เหลืองซิ่ง', 0xfbc02d], ['เขียวมรกต', 0x2e7d32], ['ฟ้าทะเล', 0x0288d1], ['น้ำเงินกรม', 0x1a237e], ['ม่วงราตรี', 0x6a1b9a], ['ชมพูหวาน', 0xec407a], ['ดำเงา', 0x212121], ['ขาวมุก', 0xf5f5f5], ['เงินบรอนซ์', 0x9e9e9e]];
const TUNE = {
  engine: { n: 'เครื่องยนต์', i: '⚙️', max: 3, cost: [3000, 7000, 15000], desc: 'ความเร็วสูงสุด +8% และอัตราเร่ง +12% ต่อระดับ' },
  tires: { n: 'ยางและช่วงล่าง', i: '🛞', max: 3, cost: [2000, 4500, 9000], desc: 'เลี้ยวคมขึ้น และวิ่งนอกถนนได้ดีขึ้น' },
  spoiler: { n: 'สปอยเลอร์', i: '🪽', max: 1, cost: [2500], desc: 'แต่งหลังรถ เพิ่มการเกาะถนน' },
  neon: { n: 'ไฟใต้ท้องนีออน', i: '💡', max: 1, cost: [3500], desc: 'ไฟสีใต้ท้องรถ สวยตอนกลางคืน' },
  horn: { n: 'แตรเสียงพิเศษ', i: '📯', max: 1, cost: [800], desc: 'เปลี่ยนเสียงแตรเป็นแตรสองโทน' },
};

const Garage = {
  // tuned driving numbers for one owned car
  spec(d) {
    const C = CARS[d.type], t = d.tune || {}, e = t.engine || 0, ty = t.tires || 0;
    return { top: C.top * (1 + e * 0.08), acc: C.acc * (1 + e * 0.12), turn: 1.9 * (1 + ty * 0.1 + (t.spoiler ? 0.05 : 0)), off: 0.55 + ty * 0.1 };
  },
  // paint, spoiler and neon on a freshly built car model
  dress(m, d) {
    const t = d.tune || {};
    if (t.paint != null) {
      if (m.kenney) m.g.traverse(o => { if (o.isMesh && !/wheel/.test(o.parent && o.parent.name || '')) { o.material = o.material.clone(); o.material.color.setHex(PAINTS[t.paint][1]).convertSRGBToLinear().lerp(new THREE.Color(1, 1, 1), 0.25); } });
    }
    const box = new THREE.Box3().setFromObject(m.g), L = box.max.z - box.min.z, top = box.max.y;
    if (t.spoiler) {
      const blk = U.mat(0x1b1b1b, { roughness: 0.4, metalness: 0.3 });
      U.mk(m.g, GEO.box, blk, [0, top * 0.82, box.min.z + 0.25], [1.6, 0.06, 0.45]);
      for (const s of [-1, 1]) U.mk(m.g, GEO.box, blk, [s * 0.55, top * 0.72, box.min.z + 0.3], [0.06, 0.25, 0.2]);
    }
    if (t.neon) {
      const nm = new THREE.MeshBasicMaterial({ map: T.glow, color: 0x30c8ff, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
      const p = new THREE.Mesh(new THREE.PlaneGeometry(2.6, L + 0.8), nm); p.rotation.x = -Math.PI / 2; p.position.y = 0.06; m.g.add(p); m.neon = nm;
    }
  },
  // rebuild an owned car's model after tuning
  rebuild(o) {
    const i = G.cars.indexOf(o); if (i < 0) return;
    World.dyn.remove(o.g); if (o.col) Col.remove(o.col); G.cars.splice(i, 1);
    const n = addCarObj(o.d); G.cars.splice(G.cars.indexOf(n), 1); G.cars.splice(i, 0, n);
    return n;
  },
  slot(i) { return l2w(GARAGE.x, GARAGE.z, GARAGE.rot, -2.6 + (i % 2) * 5.2, -0.4); },
  full(o) { const used = G.cars.filter(c => c !== o && c.d.parked).map(c => c.d.slot); return [0, 1].every(s => used.includes(s)); },
  callHome(o) {
    if (G.driving === o) { UI.toast('ลงจากรถก่อนนะ', '🚗'); return; }
    const used = G.cars.filter(c => c !== o && c.d.parked).map(c => c.d.slot);
    let s = 0; while (used.includes(s) && s < 3) s++;
    if (s >= 2) { UI.toast('โรงจอดเต็มแล้ว (จอดได้ 2 คัน)', '🅿️'); return; }
    const p = this.slot(s); Object.assign(o.d, { x: p.x, z: p.z, r: GARAGE.rot + Math.PI, parked: true, slot: s });
    const n = this.rebuild(o); UI.toast(`${CARS[o.d.type].n} มาจอดที่โรงจอดในฟาร์มแล้ว`, '🅿️'); Sfx.tone(520, 0.15, 'sine', 0.05);
    return n;
  },
  frontOf(o) {
    const p = l2w(GARAGE.x, GARAGE.z, GARAGE.rot, 0, GARAGE.d / 2 + 4); Object.assign(o.d, { x: p.x, z: p.z, r: GARAGE.rot, parked: false });
    this.rebuild(o); UI.toast('นำรถออกมาจอดหน้าโรงจอดแล้ว', '🚗');
  },
  build() {
    const g = new THREE.Group(), G0 = GARAGE; g.position.set(G0.x, World.groundY(G0.x, G0.z), G0.z); g.rotation.y = G0.rot;
    const wall = texMat('plaster', 0xe9e2d2), roof = texMat('roof', 0x5a6470, { roughness: 0.55, metalness: 0.25 }), conc = texMat('paving', 0xbdb8ae);
    U.mk(g, U.box(G0.w, 0.12, G0.d + 2.5, 2), conc, [0, 0.06, 1]);
    U.mk(g, U.box(G0.w, 3.2, 0.25, 3), wall, [0, 1.6, -G0.d / 2]);
    for (const s of [-1, 1]) U.mk(g, U.box(0.25, 3.2, G0.d, 3), wall, [s * G0.w / 2, 1.6, 0]);
    U.mk(g, U.box(0.25, 3.0, G0.d, 3), wall, [0, 1.5, 0]);
    const r = U.mk(g, U.box(G0.w + 0.8, 0.14, G0.d + 1.2, 2.5), roof, [0, 3.45, 0.2]); r.rotation.x = -0.08;
    U.mk(g, GEO.box, M.trim, [0, 3.2, G0.d / 2 + 0.1], [G0.w + 0.3, 0.3, 0.12]);
    for (const x of [-G0.w / 2, 0, G0.w / 2]) U.mk(g, GEO.box, M.trim, [x, 1.6, G0.d / 2], [0.3, 3.2, 0.3]);
    for (const x of [-2.6, 2.6]) for (const s of [-1, 1]) U.mk(g, GEO.box, mc(0xf2f2f2), [x + s * 1.3, 0.13, 0.5], [0.1, 0.01, 4.5]);
    const shelf = mc(0x6b4a2e); U.mk(g, GEO.box, shelf, [-4.8, 1.0, -G0.d / 2 + 0.5], [0.8, 2, 0.6]);
    for (let i = 0; i < 3; i++) U.mk(g, GEO.cyl, mc([0xc62828, 0x1565c0, 0x2e7d32][i]), [-4.8 + (i - 1) * 0.22, 2.15, -G0.d / 2 + 0.5], [0.09, 0.3, 0.09]);
    const sm = new THREE.MeshStandardMaterial({ map: U.signTex('โรงจอดรถ', { w: 384, h: 96, bg: '#37474f' }), roughness: 0.7 });
    U.mk(g, new THREE.PlaneGeometry(2.6, 0.65), sm, [0, 2.75, G0.d / 2 + 0.2]);
    World.outdoor.add(g);
    // gravel driveway from the farm gate to the garage, set apart from the house
    const drive = new THREE.Mesh(new THREE.PlaneGeometry(4.2, Math.hypot(G0.x + 2, G0.z + 54) + 4), texMat('dirt', 0xb8a080, { roughness: 1 }));
    drive.rotation.x = -Math.PI / 2; drive.rotation.z = Math.atan2(G0.x + 2, G0.z + 54) + Math.PI; drive.position.set((G0.x - 2) / 2 + 2, 0.03, (G0.z - 54) / 2 + 4); drive.receiveShadow = true; World.outdoor.add(drive);
    for (const s of [-1, 1]) { const p = l2w(G0.x, G0.z, G0.rot, s * G0.w / 2, 0); Col.box(p.x, p.z, 0.2, G0.d / 2, G0.rot); }
    { const p = l2w(G0.x, G0.z, G0.rot, 0, -G0.d / 2); Col.box(p.x, p.z, G0.w / 2, 0.2, G0.rot); }
    { const p = l2w(G0.x, G0.z, G0.rot, 0, 0); Col.box(p.x, p.z, 0.15, G0.d / 2, G0.rot); }
    World.clearNear(G0.x, G0.z, 9, true);
    const door = l2w(G0.x, G0.z, G0.rot, -4.8, G0.d / 2 - 1);
    // cars that were parked at the old garage move to the new bays
    setTimeout(() => { for (const o of G.cars.slice()) if (o.d.parked) { const p = this.slot(o.d.slot || 0); Object.assign(o.d, { x: p.x, z: p.z, r: G0.rot + Math.PI }); this.rebuild(o); } }, 0);
    World.pois.push({ kind: 'act', x: door.x, z: door.z, r: 2.4, label: 'โรงจอดรถ', icon: '🅿️', map: true, act: () => ({ icon: '🅿️', label: 'จัดการรถในโรงจอด', fn: () => this.ui() }) });
  },
  ui() {
    UI.open('โรงจอดรถในฟาร์ม', null, () => {
      if (!G.cars.length) return '<p class="empty">ยังไม่มีรถ ซื้อได้ที่โชว์รูมในหมู่บ้านหรือริมหาด</p>';
      return `<p class="lead">จอดได้ 2 คัน · กด "เรียกกลับโรงจอด" แล้วรถจะกลับมาจอดที่นี่ทันที ไม่ว่าจะจอดทิ้งไว้ที่ไหน</p><div class="grid">${G.cars.map((o, i) => {
        const C = CARS[o.d.type], t = o.d.tune || {}, sp = this.spec(o.d);
        return `<div class="card"><div class="ci">${C.i}</div><div class="cb"><h4>${esc(C.n)} ${o.d.parked ? '<small>🅿️ ในโรงจอด</small>' : ''}</h4><p class="dim">${Math.round(sp.top * 3.6)} กม./ชม. · เครื่อง Lv.${t.engine || 0} · ยาง Lv.${t.tires || 0}${t.paint ? ' · สี' + PAINTS[t.paint][0] : ''}</p>
          <div class="row"><button class="btn" data-a="gcall" data-i="${i}">เรียกกลับโรงจอด</button>${o.d.parked ? `<button class="btn ghost" data-a="gout" data-i="${i}">นำออกมาขับ</button>` : ''}</div></div></div>`;
      }).join('')}</div>`;
    });
  },
  // ----- tuning shop -----
  buildShop() {
    const s = TUNE_SHOP, o = { w: 10, d: 8, h: 4.4, flat: true, wall: 0x37474f, roof: 0x263238, sign: 'อู่แต่งรถช่างหนุ่ม', signStyle: { bg: '#ff6f00', fg: '#1b1b1b' }, winF: [], winS: [-1.5, 1.5], ww: 1.4, wh: 1.2, doorX: 3.4, door: 0x455a64 };
    const b = World.building(o); b.position.set(s.x, 0, s.z); b.rotation.y = s.rot; World.outdoor.add(b);
    Col.box(s.x, s.z, o.w / 2 + 0.3, o.d / 2 + 0.3, s.rot, 'bld'); World.clearNear(s.x, s.z, 8, true);
    const f = new THREE.Group(); f.position.copy(b.position); f.rotation.y = s.rot; World.outdoor.add(f);
    const roll = U.mat(0x90a4ae, { map: T.metal, roughness: 0.5, metalness: 0.5 });
    U.mk(f, GEO.box, roll, [-1.2, 2.0, o.d / 2 + 0.06], [5, 3.4, 0.05]);
    U.mk(f, GEO.box, mc(0xff6f00), [0, 0.4 + 4.0, o.d / 2 + 0.04], [o.w + 0.06, 0.3, 0.06]);
    for (let i = 0; i < 4; i++) U.mk(f, GEO.cyl, mc(0x1b1b1b, { roughness: 0.9 }), [4.4, 0.35 + i * 0.32, o.d / 2 + 1.2], [0.42, 0.3, 0.42]);
    U.mk(f, U.box(7, 0.1, 5, 2), texMat('paving', 0x9e9e9e), [-1.2, 0.05, o.d / 2 + 2.5]);
    const door = l2w(s.x, s.z, s.rot, -1.2, o.d / 2 + 2.2);
    World.pois.push({ kind: 'act', x: door.x, z: door.z, r: 3.2, label: 'อู่แต่งรถช่างหนุ่ม', icon: '🔧', map: true, act: () => ({ icon: '🔧', label: G.driving ? 'แต่งรถคันนี้' : 'คุยกับช่าง (ขับรถมาจอดเพื่อแต่ง)', fn: () => this.tuneUI() }) });
    const h = Models.human({ skin: 0xc68d63, hair: 0x1b120c, shirt: 0x455a64, pants: 0x37474f, hat: 'cap', capColor: 0xff6f00, apron: 0x263238, avatar: 'Kyle' });
    const sp = l2w(s.x, s.z, s.rot, 1.8, o.d / 2 + 1.2); h.position.set(sp.x, World.groundY(sp.x, sp.z), sp.z); h.rotation.y = s.rot; World.dyn.add(h);
    G.npcs.push({ obj: h, name: 'ช่างหนุ่ม', rot: s.rot, speed: 0, timer: 0, st: 'idle', wave: 0, fixed: true, x: sp.x, z: sp.z, tx: sp.x, tz: sp.z, hx: sp.x, hz: sp.z, hrot: s.rot });
  },
  tuneUI() {
    const o = G.driving;
    if (!o) { UI.toast('ช่างหนุ่ม: “ขับรถเข้ามาจอดหน้าอู่ แล้วเลือกแต่งได้เลยครับ”', '🔧'); return; }
    UI.open('อู่แต่งรถช่างหนุ่ม · ' + CARS[o.d.type].n, ['สีรถ', 'สมรรถนะ', 'ของแต่ง'], tab => {
      const t = o.d.tune || {}, sp = this.spec(o.d);
      const head = `<p class="lead">ความเร็วสูงสุด ${Math.round(sp.top * 3.6)} กม./ชม. · การเลี้ยว ${Math.round(sp.turn / 1.9 * 100)}% · นอกถนน ${Math.round(sp.off * 100)}% · ⛽ ${Math.round(Town2.carState(o.d).fuel)}% · 🛠️ สภาพ ${Math.round(o.d.cond)}%</p>${Town2.repairCost(o.d) ? `<div class="row"><button class="btn" data-a="repaircar" ${S.money >= Town2.repairCost(o.d) ? '' : 'disabled'}>🛠️ ซ่อมรถ ${baht(Town2.repairCost(o.d))}</button></div>` : ''}`;
      if (tab === 0) return head + `<p class="lead">ทำสีใหม่ ${baht(1500)} ต่อครั้ง</p><div class="sw">${PAINTS.map(([n, c], i) => `<button data-a="tpaint" data-v="${i}" class="${(t.paint || 0) === i ? 'on' : ''}" style="background:${c == null ? 'linear-gradient(135deg,#ccc,#666)' : '#' + c.toString(16).padStart(6, '0')}"><span>${n}</span></button>`).join('')}</div>`;
      const keys = tab === 1 ? ['engine', 'tires'] : ['spoiler', 'neon', 'horn'];
      return head + `<div class="grid">${keys.map(k => {
        const U_ = TUNE[k], lv = t[k] || 0, done = lv >= U_.max, cost = done ? 0 : U_.cost[lv];
        return `<div class="card"><div class="ci">${U_.i}</div><div class="cb"><h4>${U_.n} ${U_.max > 1 ? `<small>Lv.${lv}/${U_.max}</small>` : lv ? '<small>ติดแล้ว</small>' : ''}</h4><p class="dim">${U_.desc}</p><div class="row"><button class="btn" data-a="tbuy" data-k="${k}" ${done || S.money < cost ? 'disabled' : ''}>${done ? 'สูงสุดแล้ว' : 'ติดตั้ง ' + baht(cost)}</button></div></div></div>`;
      }).join('')}</div>`;
    }, { wide: true });
  },
  apply(fn) {
    const o = G.driving; if (!o) return;
    o.d.tune = o.d.tune || {}; fn(o.d.tune);
    // swap the model under the player without leaving the car
    const sp = o.speed; World.dyn.remove(o.g);
    const m = Models.car(o.d.type, PAINTS[o.d.tune.paint || 0][1] ?? undefined); Object.assign(o, m, { d: o.d, speed: sp });
    this.dress(o, o.d); o.g.position.set(o.d.x, World.groundY(o.d.x, o.d.z), o.d.z); o.g.rotation.y = o.d.r; World.dyn.add(o.g); o.g.add(G.headlight, G.headlight.target);
    Sfx.tone(300, 0.3, 'sawtooth', 0.05, 600); Sfx.burst(0.4, 3000, 'highpass', 0.12); Prog.add(5);
  },
};
UI.H.gcall = d => Garage.callHome(G.cars[+d.i]);
UI.H.gout = d => { UI.close(); Garage.frontOf(G.cars[+d.i]); };
UI.H.tpaint = d => { if (S.money < 1500) { UI.toast('เงินไม่พอ', '💸'); return; } S.money -= 1500; Garage.apply(t => { t.paint = +d.v || null; }); UI.toast('ทำสีใหม่เสร็จแล้ว สวยมาก!', '🎨'); };
UI.H.tbuy = d => {
  const o = G.driving, t = (o.d.tune = o.d.tune || {}), k = d.k, U_ = TUNE[k], lv = t[k] || 0; if (lv >= U_.max || S.money < U_.cost[lv]) return;
  S.money -= U_.cost[lv]; Garage.apply(t => { t[k] = lv + 1; }); UI.toast(`ติดตั้ง${U_.n}เรียบร้อย!`, U_.i);
};
