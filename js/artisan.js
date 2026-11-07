'use strict';
// ---------- Workbench crafting (ore → bars → machines & sprinklers) and artisan machines on the farm ----------
const ARTISAN = {
  jam:    { n: 'แยมผลไม้', i: '🫙', sell: 300, en: 25 },
  pickle: { n: 'ผักดอง', i: '🥒', sell: 200, en: 15 },
  cheese: { n: 'ชีสสด', i: '🧀', sell: 420, en: 30 },
  cloth:  { n: 'ผ้าทอมือ', i: '🧶', sell: 560 },
  juice:  { n: 'น้ำผลไม้หมัก', i: '🧃', sell: 380, en: 35 },
  honey:  { n: 'น้ำผึ้งป่า', i: '🍯', sell: 250, en: 20 },
};
const BARS = { bar_copper: { n: 'แท่งทองแดง', i: '🥉', sell: 120 }, bar_iron: { n: 'แท่งเหล็ก', i: '🔩', sell: 230 }, bar_gold: { n: 'แท่งทองคำ', i: '🥇', sell: 520 } };
for (const id in ARTISAN) ITEMS[id] = Object.assign({ cat: 'artisan' }, ARTISAN[id]);
for (const id in BARS) ITEMS[id] = Object.assign({ cat: 'bar' }, BARS[id]);
const FRUIT = ['strawberry', 'watermelon', 'pineapple', 'mango', 'orange', 'tomato'];
const VEG = ['carrot', 'cabbage', 'chili', 'eggplant', 'corn', 'pumpkin'];
// the new crops (crops2.js) can be made into jam / juice / pickles too
for (const k in CROPS) { const g = CROPS[k].grp; if (g === 'fruit' || g === 'tree') { if (!FRUIT.includes(k)) FRUIT.push(k); } else if (g === 'veg' && !VEG.includes(k)) VEG.push(k); }
const MACHINES = {
  preserves: { n: 'หม้อเคี่ยวแยม', i: '🫙', cost: { bar_copper: 2, stone: 10 }, h: 8, desc: 'ผลไม้ → แยม · ผัก → ผักดอง',
    input: () => FRUIT.find(k => countBase(k)) ? [FRUIT.find(k => countBase(k)), 'jam'] : VEG.find(k => countBase(k)) ? [VEG.find(k => countBase(k)), 'pickle'] : null },
  cheese: { n: 'เครื่องอัดชีส', i: '🧀', cost: { bar_iron: 2, bar_copper: 1 }, h: 6, desc: 'นมสด → ชีส', input: () => countBase('milk') ? ['milk', 'cheese'] : null },
  loom: { n: 'กี่ทอผ้า', i: '🧶', cost: { bar_iron: 2, stone: 12 }, h: 10, desc: 'ขนแกะ → ผ้าทอมือ', input: () => countBase('wool') ? ['wool', 'cloth'] : null },
  keg: { n: 'ถังหมักน้ำผลไม้', i: '🧃', cost: { bar_gold: 1, bar_iron: 2 }, h: 12, desc: 'ผลไม้ → น้ำผลไม้หมัก', input: () => { const f = FRUIT.find(k => countBase(k)); return f ? [f, 'juice'] : null; } },
  hive: { n: 'รังผึ้ง', i: '🐝', cost: { stone: 6, bar_copper: 1 }, h: 0, desc: 'ให้น้ำผึ้งทุก 2 วันเอง ปลูกทานตะวันได้น้ำผึ้งเพิ่ม', input: () => null },
};
const CRAFTS = [
  { id: 'bar_copper', tab: 0, need: { copper: 3 } }, { id: 'bar_iron', tab: 0, need: { iron: 3 } }, { id: 'bar_gold', tab: 0, need: { gold: 3 } },
  { id: 'sprinkler', tab: 2, need: { bar_copper: 1, bar_iron: 1 } }, { id: 'sprinkler_pro', tab: 2, need: { bar_gold: 1, bar_iron: 2 } }, { id: 'fert', tab: 2, need: { stone: 2, copper: 1 }, q: 3 },
];
const MSLOTS = [[-28, -41], [-24, -41], [-20, -41], [-16, -41], [-12, -42], [-28, -46], [-24, -46], [-20, -46]];

const Craft = {
  objs: [],
  canPay(need) { return Object.keys(need).every(k => countBase(k) >= need[k]); },
  pay(need) { for (const k in need) takeBase(k, need[k]); },
  make(c) {
    if (!this.canPay(c.need)) return;
    this.pay(c.need); addItem(c.id, c.q || 1); Prog.add(6); Sfx.tone(700, 0.08, 'square', 0.05); Sfx.burst(0.15, 2000, 'bandpass', 0.15);
    UI.toast(`สร้าง ${ITEMS[c.id].n}${c.q ? ' ×' + c.q : ''} แล้ว`, ITEMS[c.id].i);
  },
  build(type) {
    const M_ = MACHINES[type]; if (!this.canPay(M_.cost)) return;
    const slot = MSLOTS.findIndex((_, i) => !S.machines.some(m => m.slot === i));
    if (slot < 0) { UI.toast('ลานเครื่องจักรหลังบ้านเต็มแล้ว', '⚙️'); return; }
    this.pay(M_.cost);
    const m = { type, slot, inp: null, out: null, t: 0, days: 0 }; S.machines.push(m); this.spawn(m);
    Prog.add(30); Sfx.goal(); UI.toast(`ติดตั้ง${M_.n}ที่ลานหลังบ้านแล้ว`, M_.i); saveGame(true);
  },
  // ---- machine models ----
  model(type) {
    const g = new THREE.Group(), wd = texMat('wood', 0x8a5a34, { roughness: 0.7 }), metal = mc(0x8a9097, { metalness: 0.5, roughness: 0.35 });
    U.mk(g, U.box(1.4, 0.1, 1.4, 1.5), M.stone, [0, 0.05, 0]);
    if (type === 'preserves') {
      U.mk(g, GEO.cyl, mc(0x3a3a3a, { metalness: 0.4, roughness: 0.4 }), [0, 0.55, 0], [0.45, 0.6, 0.45]);
      U.mk(g, GEO.cyl, mc(0xb83a2a, { roughness: 0.4 }), [0, 0.88, 0], [0.4, 0.06, 0.4]);
      for (let i = 0; i < 3; i++) U.mk(g, lathe('jar', [[0, 0], [0.09, 0], [0.1, 0.18], [0.07, 0.22], [0, 0.22]], 10), mc([0xe3262f, 0xf2b233, 0x6cb33f][i], { roughness: 0.2 }), [-0.45 + i * 0.3, 0.1, 0.55]);
    } else if (type === 'cheese') {
      for (const s of [-0.45, 0.45]) U.mk(g, GEO.box, wd, [s, 0.75, 0], [0.12, 1.4, 0.3]);
      U.mk(g, GEO.box, wd, [0, 1.45, 0], [1.05, 0.14, 0.3]);
      U.mk(g, GEO.cylLo, metal, [0, 1.1, 0], [0.05, 0.7, 0.05]);
      U.mk(g, GEO.cyl, mc(0xf2d06b, { roughness: 0.6 }), [0, 0.35, 0], [0.32, 0.4, 0.32]);
    } else if (type === 'loom') {
      for (const s of [-0.55, 0.55]) for (const z of [-0.35, 0.35]) U.mk(g, GEO.box, wd, [s, 0.7, z], [0.08, 1.3, 0.08]);
      U.mk(g, GEO.box, wd, [0, 1.3, 0], [1.2, 0.08, 0.8]);
      for (let i = 0; i < 10; i++) U.mk(g, GEO.cylLo, mc(0xf3eee2), [-0.45 + i * 0.1, 0.8, 0], [0.01, 0.95, 0.01]);
      U.mk(g, GEO.box, mc(0xc0504d, { roughness: 0.9 }), [0, 0.45, 0.1], [0.95, 0.25, 0.05]);
    } else if (type === 'keg') {
      U.mk(g, lathe('keg', [[0, 0], [0.38, 0], [0.48, 0.45], [0.38, 0.9], [0, 0.9]], 16), wd, [0, 0.1, 0], 1, [0, 0, 0]);
      for (const y of [0.25, 0.85]) U.mk(g, gcache('kegRing', () => new THREE.TorusGeometry(0.44, 0.02, 6, 20)), metal, [0, y, 0], 1, [Math.PI / 2, 0, 0]);
      U.mk(g, GEO.cylLo, metal, [0, 0.4, 0.5], [0.03, 0.12, 0.03], [Math.PI / 2, 0, 0]);
    } else {
      for (let i = 0; i < 3; i++) U.mk(g, U.box(0.75, 0.3, 0.6, 1), mc([0xf5f2ea, 0xf2e6c9, 0xf5f2ea][i], { roughness: 0.8 }), [0, 0.3 + i * 0.32, 0]);
      U.mk(g, U.box(0.9, 0.08, 0.75, 1), texMat('roof', 0x8c3b2a), [0, 1.3, 0]);
      U.mk(g, GEO.box, mc(0x2b2b2b), [0, 0.2, 0.31], [0.2, 0.04, 0.01]);
    }
    return Models.compact(shadowAll(g));
  },
  spawn(m) {
    const [x, z] = MSLOTS[m.slot], g = this.model(m.type); g.position.set(x, 0, z); World.dyn.add(g);
    const sp = U.sprite('⏳', 0.6); sp.position.set(x, 1.9, z); sp.visible = false; World.dyn.add(sp);
    const col = Col.box(x, z, 0.6, 0.6);
    const poi = { kind: 'machine', m, x, z: z + 1.3, r: 1.5, label: MACHINES[m.type].n, icon: MACHINES[m.type].i };
    World.pois.push(poi); this.objs.push({ m, g, sp, col, poi, key: '' });
  },
  init() {
    S.machines.forEach(m => this.spawn(m));
    // workbench: its own little workshop corner, well away from the farmhouse so the house can grow without touching it (a roof on posts, a gravel pad, an anvil, logs and a barrel)
    const WB = { x: -14, z: -42 }, g = new THREE.Group(), wd = texMat('wood', 0x9a6a42, { roughness: 0.6 }); g.position.set(WB.x, 0, WB.z); World.dyn.add(g);
    U.mk(g, GEO.box, texMat('paving', 0xb7ada0), [0, 0.04, 0.4], [5.0, 0.08, 3.6]);
    U.mk(g, GEO.box, wd, [0, 0.85, 0], [2.0, 0.1, 0.9]);
    for (const a of [-0.9, 0.9]) for (const b of [-0.38, 0.38]) U.mk(g, GEO.box, wd, [a, 0.42, b], [0.1, 0.84, 0.1]);
    U.mk(g, GEO.box, mc(0x4a4f55, { metalness: 0.5, roughness: 0.4 }), [-0.5, 1.0, 0], [0.5, 0.2, 0.25]);
    U.mk(g, GEO.cyl, mc(0x3a3a3a, { metalness: 0.4 }), [0.5, 0.95, 0.1], [0.2, 0.1, 0.2]);
    U.mk(g, GEO.box, wd, [0, 1.5, -0.42], [2.0, 1.2, 0.06]);
    for (let i = 0; i < 4; i++) U.mk(g, GEO.box, mc(0x8a9097, { metalness: 0.5 }), [-0.7 + i * 0.45, 1.5, -0.37], [0.06, 0.5, 0.04]);
    // roof on four posts
    const rm = texMat('roof', 0x7a4a2e);
    for (const a of [-1.9, 1.9]) for (const b of [-0.9, 1.7]) U.mk(g, GEO.cylLo, M.darkwood, [a, 1.3, b], [0.07, 2.6, 0.07]);
    const rf = U.mk(g, U.box(4.6, 0.12, 3.4, 2.5), rm, [0, 2.7, 0.4]); rf.rotation.x = -0.12;
    // anvil, logs and a barrel
    U.mk(g, GEO.box, mc(0x2f3338, { metalness: 0.6, roughness: 0.4 }), [1.8, 0.28, 0.9], [0.5, 0.18, 0.3]); U.mk(g, GEO.box, mc(0x2f3338, { metalness: 0.6, roughness: 0.4 }), [1.8, 0.45, 0.9], [0.8, 0.14, 0.3]); U.mk(g, GEO.cylLo, wd, [1.8, 0.1, 0.9], [0.3, 0.2, 0.3]);
    for (const [x, y] of [[-1.7, 0.2], [-1.4, 0.2], [-1.55, 0.5]]) U.mk(g, GEO.cyl, mc(0x7a5638, { roughness: 1 }), [x, y, 1.3], [0.16, 0.9, 0.16], [0, 0, Math.PI / 2]);
    U.mk(g, GEO.cyl, mc(0x6d4c41), [-1.8, 0.45, -0.7], [0.38, 0.9, 0.38]);
    Col.box(WB.x, WB.z, 1.05, 0.5); Col.box(WB.x + 1.8, WB.z + 0.9, 0.45, 0.25); Col.box(WB.x - 1.55, WB.z + 1.3, 0.35, 0.6); Col.circle(WB.x - 1.8, WB.z - 0.7, 0.4);
    World.pois.push({ kind: 'workbench', x: WB.x, z: WB.z + 1.4, r: 1.8, label: 'โต๊ะช่าง (หลอมแร่ · สร้างเครื่องจักร)', icon: '🔨', map: true });
  },
  // ---- simulation ----
  tick(h) { for (const m of S.machines) if (m.inp && !m.ready) { m.t -= h; if (m.t <= 0) m.ready = true; } },
  day() {
    const extra = S.plots.some(p => p.c === 'sunflower') ? 1 : 0;
    for (const m of S.machines) if (m.type === 'hive' && !m.ready) { m.days = (m.days || 0) + 1; if (m.days >= 2) { m.ready = true; m.out = 'honey'; m.n = 1 + extra; m.days = 0; } }
  },
  act(m) {
    const M_ = MACHINES[m.type];
    if (m.ready) {
      const out = m.out, n = m.n || 1; addItem(out, n); m.ready = false; m.inp = null; m.out = null; m.n = 0;
      Prog.add(12); Sfx.pop(); UI.toast(`เก็บ${ARTISAN[out].n} +${n}`, ARTISAN[out].i);
      return;
    }
    if (m.inp) { UI.toast(`${M_.n}กำลังทำงาน เหลืออีก ${Math.ceil(m.t)} ชม.`, '⏳'); return; }
    const io = M_.input(); if (!io) { UI.toast(`${M_.n}: ${M_.desc} (ยังไม่มีวัตถุดิบ)`, M_.i); return; }
    takeBase(io[0], 1); m.inp = io[0]; m.out = io[1]; m.t = M_.h; m.ready = false;
    playAct('plant', 0.6); Sfx.plant(); UI.toast(`ใส่${ITEMS[io[0]].n}แล้ว ได้${ARTISAN[io[1]].n}ใน ${M_.h} ชม.`, M_.i);
  },
  describe(m) {
    const M_ = MACHINES[m.type];
    if (m.ready) return { icon: ARTISAN[m.out].i, label: `เก็บ${ARTISAN[m.out].n}`, fn: () => this.act(m) };
    if (m.inp) return { icon: '⏳', label: `${M_.n}: อีก ${Math.ceil(m.t)} ชม.`, info: true };
    const io = M_.input();
    if (m.type === 'hive') return { icon: '🐝', label: `รังผึ้ง: น้ำผึ้งพร้อมใน ${2 - (m.days || 0)} วัน`, info: true };
    return io ? { icon: ITEMS[io[0]].i, label: `ใส่${ITEMS[io[0]].n} ทำ${ARTISAN[io[1]].n}`, fn: () => this.act(m) } : { icon: M_.i, label: `${M_.n}: ${M_.desc}`, info: true };
  },
  update(dt) {
    for (const o of this.objs) {
      const m = o.m, key = m.ready ? ARTISAN[m.out].i : m.inp ? '⏳' : '';
      if (key !== o.key) { o.key = key; o.sp.visible = !!key; if (key) { o.sp.material.map = U.emojiTex(key); o.sp.material.needsUpdate = true; } }
      if (key) o.sp.position.y = 1.9 + Math.sin(G.t * 3 + m.slot) * 0.06;
      if (m.type === 'hive' && !G.inside && G.night < 0.4 && Math.random() < dt * 4) {
        const [x, z] = MSLOTS[m.slot]; FX.spawn(x + (Math.random() - 0.5) * 0.6, 1.0 + Math.random() * 0.4, z + 0.4, (Math.random() - 0.5) * 0.8, 0.2, (Math.random() - 0.5) * 0.8, 1.2, BEE_C, 0);
      }
    }
  },
};
const BEE_C = new THREE.Color(0.95, 0.75, 0.1);
