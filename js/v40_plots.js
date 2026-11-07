'use strict';
// ---------- v40_plots: buy extra vegetable plots (kit of 1 or pack of 6, at most 20 extra) and place / rotate / move them freely ----------
// Extra plots live in S.plots (index 48 and up, after 18 reserved slots for the carpenter's own extension) as {extra:1, off, x, z, r, c, g, w, f}, so
// every system that walks S.plots (growth, rain, pests, flood, sprinklers by position, farm bot, workers, smart-home watering, contracts) keeps working.
// A plot with off:1 is in the storage ("คลังแปลง") and is hidden until placed. State: S.v40 = { v:1 } plus the flags on the plot objects.
V23.add('v40_plots', () => {
  const MAX = 20, BASE = 48, KIT = 750, PACK = 4500, HS = 0.9, MARGIN = 0.12;
  const X = () => (S.v40 = S.v40 || { v: 1 });
  const extras = () => { const L = []; (S.plots || []).forEach((p, i) => { if (p && p.extra) L.push(i); }); return L; };
  const placed = () => extras().filter(i => !S.plots[i].off);
  const stored = () => extras().filter(i => S.plots[i].off);
  // the 20-plot cap counts the usable ORIGINAL plots (field level 6/12/18/30 + the carpenter's extension when unlocked) plus the extras the player owns
  const orig = () => { let n = 0; (S.plots || []).forEach((p, i) => { if (p && !p.extra && plotUnlocked(i, S.up.field)) n++; }); return n; };
  const total = () => orig() + extras().length;
  const left = () => Math.max(0, MAX - total());
  const brk = () => `แปลงเดิม ${orig()} + แปลงเพิ่ม ${extras().length}`;
  const capMsg = () => `แปลงรวมถึง ${MAX} แล้ว (${brk()})`;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const toast = (t, i) => { try { UI.toast(t, i || '🟫'); } catch (e) { } };
  const isCarp = i => { const p = S.plots[i]; return !!p && !p.extra && i >= 30; };      // the carpenter's own extension plots (indices 30..47)

  // number shown for the farm size: the 30 ordinary plots + the carpenter's extension (the 18 reserved slots are not counted)
  window.farmPlotCount = () => { let n = 30; try { n += Prop23.extraPlots(); } catch (e) { } const e = placed().length; return e ? `${n} (+${e} เพิ่ม)` : String(n); };

  // ---------- position / rotation of the 3D group ----------
  function applyVisual(i) {
    const p = S.plots[i], o = G.plots[i]; if (!p || !o) return;
    if (!p.extra) return;
    const y = (typeof World.groundY === 'function') ? Math.max(0, World.groundY(p.x || 0, p.z || 0)) : 0;
    o.g.position.set(p.x || 0, y, p.z || 0); o.g.rotation.y = p.r || 0;
  }
  function ensureG() {
    while (G.plots.length < S.plots.length) G.plots.push(makePlot(G.plots.length));
    extras().forEach(applyVisual);
    try { refreshField(); } catch (e) { }
  }
  function ensureBase() {
    while (S.plots.length < BASE) S.plots.push({ c: null, g: 0, w: 0, f: 0, filler: 1 });
  }
  function addSlots(n) {
    n = Math.min(n | 0, left()); if (n <= 0) return 0;
    ensureBase();
    for (let k = 0; k < n; k++) S.plots.push({ c: null, g: 0, w: 0, f: 0, extra: 1, off: 1, x: 0, z: 0, r: 0 });
    ensureG(); return n;
  }

  // ---------- hooks into the plot code ----------
  { const _pc = plotCenter; plotCenter = function (i) { const p = S && S.plots && S.plots[i]; if (p && p.extra && p.x != null) return { x: p.x, z: p.z }; return _pc(i); }; }
  { const _pu = plotUnlocked; plotUnlocked = function (i, l) { const p = S && S.plots && S.plots[i]; if (p && p.extra) return !p.off; if (p && p.filler && !(i < 30 + ((typeof Prop23 !== 'undefined' && Prop23.extraPlots) ? Prop23.extraPlots() : 0))) return false; return _pu(i, l); }; }
  // water the neighbours of a plot: the old code only knows the 6x5 grid, so plots 30+ (carpenter's too) were never reached
  { const _wt = waterTargets; waterTargets = function (i) {
    const p = S.plots[i];
    if (!(p && (p.extra || i >= 30))) return _wt(i);
    const out = [i], lvl = S.up.can, R = lvl >= 3 ? 3.2 : lvl === 2 ? 2.7 : 0; if (!R) return out;
    const c = plotCenter(i);
    S.plots.forEach((q, k) => { if (k === i || !q || !(q.extra || k >= 30) || !plotUnlocked(k, S.up.field)) return; const d = plotCenter(k); if (Math.hypot(d.x - c.x, d.z - c.z) < R) out.push(k); });
    return out;
  }; }
  // sprinklers also reach extra plots (the old loop only looks at the first 30)
  { const _rs = runSprinklers; runSprinklers = function (visual) {
    const r = _rs.apply(this, arguments);
    try {
      if (typeof Water !== 'undefined' && Water.pressureOK && !Water.pressureOK()) return r;
      for (const s of G.spr) { const R = TOOLS[s.d.pro ? 'sprinkler_pro' : 'sprinkler'].r; S.plots.forEach((p, i) => { if (i < 30 || !p || !plotUnlocked(i, S.up.field)) return; const c = plotCenter(i); if (Math.hypot(c.x - s.d.x, c.z - s.d.z) <= R + 0.01) p.w = 1; }); }
    } catch (e) { }
    return r;
  }; }
  // the walk-up target: the old code only offers plots 0..29 near the original field
  { const _ft = findTarget; findTarget = function () {
    const t = _ft.apply(this, arguments); if (G.driving || G.inside || !G.player) return t;
    const P = G.player, px = P.pos.x + Math.sin(P.rot) * 1.0, pz = P.pos.z + Math.cos(P.rot) * 1.0;
    let bi = -1, bd = 1e9;
    for (let i = 30; i < S.plots.length; i++) {
      const p = S.plots[i]; if (!p || p.filler && !(i < 30 + (Prop23.extraPlots ? Prop23.extraPlots() : 0))) continue;
      if (p.extra ? p.off : !plotUnlocked(i, S.up.field)) continue;
      const c = plotCenter(i), d = Math.hypot(px - c.x, pz - c.z); if (d < 1.25 && d < bd) { bd = d; bi = i; }
    }
    if (bi < 0) return t;
    if (!t) return { kind: 'plot', i: bi };
    if (t.kind === 'plot') { const c = plotCenter(t.i), d = Math.hypot(px - c.x, pz - c.z); return bd < d ? { kind: 'plot', i: bi } : t; }
    return t;
  }; }

  // ---------- buying: kits are intercepted when they would enter the bag ----------
  TOOLS.plot_kit = { n: 'ชุดแปลงผัก (1 แปลง)', i: '🟫', price: KIT, desc: 'แปลงดินพร้อมขอบ วางตรงไหนก็ได้ในที่ดินของคุณ หมุนและย้ายได้ทุกเมื่อ (แปลงทั้งหมดรวมแปลงเดิมไม่เกิน 20 แปลง)' };
  TOOLS.plot_pack6 = { n: 'ชุดแปลงผัก 6 แปลง', i: '🟫', price: PACK, desc: 'แพ็ก 6 แปลง ถูกกว่าซื้อทีละแปลงเล็กน้อย หมุนและย้ายได้ทุกเมื่อ' };
  { const _add = addItem; addItem = function (id, n = 1) {
    if (id !== 'plot_kit' && id !== 'plot_pack6') return _add.apply(this, arguments);
    const unit = id === 'plot_pack6' ? 6 : 1, want = unit * n, got = addSlots(want), over = want - got;
    if (over > 0) { const refund = Math.round(over * (id === 'plot_pack6' ? PACK / 6 : KIT)); if (window.Refund181) Refund181.give(refund, 'คืนเงินแปลงที่เกินสิทธิ์'); else S.money += refund; toast(`${capMsg()} คืนเงิน ${baht(refund)}`, '💸'); }
    if (got > 0) { toast(`ได้แปลงผัก ${got} แปลง อยู่ใน "คลังแปลง" เปิดแอป 🟫 จัดการแปลง เพื่อวาง`, '🟫'); try { Phone.msg('ร้านเกษตร', `ได้รับชุดแปลงผัก ${got} แปลงแล้ว (แปลงเพิ่ม ${extras().length}/${MAX}) เปิดแอป "จัดการแปลง" แล้วกด "วาง" เพื่อเลือกตำแหน่ง`); } catch (e) { } }
  }; }
  { const _e = UI.entry; UI.entry = function (key, shop) {
    const e = _e.apply(this, arguments);
    if (e && (key === 'tool:plot_kit' || key === 'tool:plot_pack6')) {
      const l = left(); e.multi = false; e.desc = `${e.desc} · แปลงทั้งหมด ${total()}/${MAX} (${brk()})`;
      if (S.lvl < 2) e.block = 'ปลดล็อกที่เลเวล 2';
      else if (l <= 0) e.block = capMsg();
      else if (key === 'tool:plot_pack6' && l < 6) e.block = `เหลือโควตา ${l} แปลง ซื้อทีละแปลง`;
    }
    return e;
  }; }
  for (const [sid, ti] of [['farmshop', 1], ['carpenter', 0]]) { try { const L = SHOPS[sid].tabs[ti].items; for (const k of ['tool:plot_kit', 'tool:plot_pack6']) if (!L.includes(k)) L.push(k); } catch (e) { } }

  // ---------- validity of a spot ----------
  const cornersOf = (x, z, r, h) => [[-h, -h], [h, -h], [h, h], [-h, h]].map(([a, b]) => { const c = Math.cos(r), s = Math.sin(r); return [x + a * c + b * s, z - a * s + b * c]; });
  function sat(A, B) {
    for (const Q of [A, B]) for (let i = 0; i < 4; i++) {
      const a = Q[i], b = Q[(i + 1) % 4], nx = -(b[1] - a[1]), nz = b[0] - a[0], len = Math.hypot(nx, nz) || 1, ax = nx / len, az = nz / len;
      let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9;
      for (const p of A) { const d = p[0] * ax + p[1] * az; a0 = Math.min(a0, d); a1 = Math.max(a1, d); }
      for (const p of B) { const d = p[0] * ax + p[1] * az; b0 = Math.min(b0, d); b1 = Math.max(b1, d); }
      if (a1 < b0 || b1 < a0) return false;
    }
    return true;
  }
  function inLand(x, z) {
    if (Math.abs(x) <= 78 && z >= -64 && z <= 66) return true;
    try { const lots = (S.hb && S.hb.lots) || {}; for (const k in lots) { const L = HomeBuild.lot(k); if (L && Math.hypot(x - L.x, z - L.z) < 16) return true; } } catch (e) { }
    return false;
  }
  function check(x, z, r, self) {
    if (!inLand(x, z)) return 'อยู่นอกที่ดินของคุณ';
    if (x > PEN.x0 - 1.2 && x < PEN.x1 + 1.2 && z > PEN.z0 - 1.2 && z < PEN.z1 + 1.2) return 'ทับคอกสัตว์';
    const pts = [[x, z]].concat(cornersOf(x, z, r, HS));
    for (const [px, pz] of pts) { if (World.groundY(px, pz) < -0.25) return 'ติดน้ำหรือที่ลุ่ม'; if (roadDist(px, pz) < 4.8) return 'ติดถนน'; }
    const probe = pts.concat(cornersOf(x, z, r, HS * 0.2).slice(0, 0)); for (const [a, b] of [[-HS, 0], [HS, 0], [0, -HS], [0, HS]]) { const c = Math.cos(r), s = Math.sin(r); probe.push([x + a * c + b * s, z - a * s + b * c]); }
    try { for (const [px, pz] of probe) if (Collide.covered(px, pz)) return 'ชนสิ่งของหรือสิ่งปลูกสร้าง'; } catch (e) { }
    try { if (World.pois.some(p => p.kind !== 'info' && Math.hypot(p.x - x, p.z - z) < 1.7)) return 'บังจุดโต้ตอบ'; } catch (e) { }
    const me = cornersOf(x, z, r, HS + MARGIN);
    for (let i = 0; i < S.plots.length; i++) {
      const p = S.plots[i]; if (!p || i === self) continue;
      if (p.extra ? p.off : !plotUnlocked(i, S.up.field)) continue;
      const c = plotCenter(i); if (Math.hypot(c.x - x, c.z - z) > 3) continue;
      if (sat(me, cornersOf(c.x, c.z, p.extra ? (p.r || 0) : 0, HS))) return 'ทับแปลงอื่น';
    }
    try { if (S.up.orchard) for (let i = 0; i < S.trees.length; i++) { const o = orchardSpot(i); if (Math.hypot(o.x - x, o.z - z) < 2.2) return 'ชนต้นไม้ในสวน'; } } catch (e) { }
    return '';
  }

  // ---------- placement mode ----------
  const Mode = { on: false, idx: -1, r: 0, fw: 2.8, sd: 0, snap: 0.5, ghost: null, key: '', tmr: 0, orig: null };
  const PL = () => document.getElementById('pl40');
  function ensureUI() {
    if (PL()) return; const el = document.createElement('div'); el.id = 'pl40'; el.hidden = true;
    el.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:calc(92px + env(safe-area-inset-bottom,0px));z-index:9;width:min(560px,calc(100vw - 20px));background:rgba(18,38,28,.94);border:1px solid rgba(255,255,255,.2);border-radius:14px;padding:10px;color:#fff;font:14px/1.4 sans-serif;touch-action:manipulation';
    el.innerHTML = '<div id="pl40i" style="margin-bottom:8px"></div><div style="display:flex;flex-wrap:wrap;gap:6px"><button class="btn ghost" data-m="r-15">⟲ 15°</button><button class="btn ghost" data-m="r+15">⟳ 15°</button><button class="btn ghost" data-m="r-90">⟲ 90°</button><button class="btn ghost" data-m="r+90">⟳ 90°</button><button class="btn ghost" data-m="fwd">▲ ไกลออก</button><button class="btn ghost" data-m="back">▼ ใกล้เข้า</button><button class="btn ghost" data-m="left">◀</button><button class="btn ghost" data-m="right">▶</button><button class="btn ghost" data-m="snap">📐 <span id="pl40s"></span></button><button class="btn" data-m="ok">✔ วางที่นี่</button><button class="btn ghost" data-m="no">✖ ยกเลิก</button></div>';
    el.addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (b) act(b.dataset.m); });
    document.body.appendChild(el);
  }
  function aim() {
    const P = G.player, fx = Math.sin(P.rot), fz = Math.cos(P.rot), rx = fz, rz = -fx;
    let x = P.pos.x + fx * Mode.fw + rx * Mode.sd, z = P.pos.z + fz * Mode.fw + rz * Mode.sd; if (window.Drag89) { const dp = Drag89.pos(x, z); x = dp.x; z = dp.z; }
    x = Math.round(x / Mode.snap) * Mode.snap; z = Math.round(z / Mode.snap) * Mode.snap;
    return { x, z, r: Mode.r };
  }
  function act(a) {
    if (!Mode.on) return;
    if (a.startsWith('r')) Mode.r = (Mode.r + (+a.slice(1)) * Math.PI / 180 + Math.PI * 2) % (Math.PI * 2);
    else if (a === 'fwd') Mode.fw = clamp(Mode.fw + 0.5, 1, 9); else if (a === 'back') Mode.fw = clamp(Mode.fw - 0.5, 1, 9); if (window.Drag89 && (a === 'fwd' || a === 'back')) Drag89.nudge(a === 'fwd' ? 0.5 : -0.5, 0);
    else if (a === 'left') Mode.sd = clamp(Mode.sd - 0.5, -6, 6); else if (a === 'right') Mode.sd = clamp(Mode.sd + 0.5, -6, 6); if (window.Drag89 && (a === 'left' || a === 'right')) Drag89.nudge(0, a === 'left' ? -0.5 : 0.5);
    else if (a === 'snap') Mode.snap = Mode.snap === 0.5 ? 0.1 : 0.5;
    else if (a === 'no') { stopMode(); return; }
    else if (a === 'ok') { confirm(); return; }
    Mode.key = ''; update();
  }
  function startMode(idx) {
    const p = S.plots[idx]; if (!p || !p.extra) return;
    if (G.inside || G.inRoom || G.inMine) { toast('ออกมายืนในฟาร์มก่อนวางแปลง', 'ℹ️'); return; }
    if (G.driving) { toast('ลงจากรถก่อน', 'ℹ️'); return; }
    UI.close(); ensureUI(); Mode.on = true; Mode.idx = idx; Mode.r = p.r || 0; Mode.fw = 2.8; Mode.sd = 0; Mode.snap = 0.5; Mode.key = '';
    Mode.orig = p.off ? null : { x: p.x, z: p.z, r: p.r };
    if (!p.off) { const P = G.player; const dx = p.x - P.pos.x, dz = p.z - P.pos.z; Mode.fw = clamp(Math.hypot(dx, dz), 1, 9); }
    PL().hidden = false; update(); clearInterval(Mode.tmr); Mode.tmr = setInterval(update, 90);
  }
  function stopMode() { Mode.on = false; Mode.idx = -1; clearInterval(Mode.tmr); if (PL()) PL().hidden = true; if (Mode.ghost && Mode.ghost.parent) Mode.ghost.parent.remove(Mode.ghost); Mode.ghost = null; }
  function update() {
    if (!Mode.on) return;
    if (G.inside || G.inRoom || G.driving) { stopMode(); return; }
    const t = aim(), why = check(t.x, t.z, t.r, Mode.idx), info = document.getElementById('pl40i'), sn = document.getElementById('pl40s'); if (!info) return;
    if (sn) sn.textContent = Mode.snap === 0.5 ? 'ปรับหยาบ 0.5 ม.' : 'ปรับละเอียด 0.1 ม.';
    const p = S.plots[Mode.idx], name = `แปลงเพิ่ม #${extras().indexOf(Mode.idx) + 1}`;
    info.innerHTML = `<b>🟫 ${name}</b>${p.c ? ` · ปลูก${esc(CROPS[p.c] ? CROPS[p.c].n : '')}อยู่ (ย้ายแล้วพืชไปด้วย)` : ''}<br>${why ? `<span style="color:#ff8a80">⛔ วางตรงนี้ไม่ได้: ${why}</span>` : '<span style="color:#9be58f">✅ วางได้</span>'} · หมุน ${Math.round(t.r * 180 / Math.PI)}°<br><span style="opacity:.75">เดินเพื่อเลื่อน · ปุ่มหมุนและเลื่อนละเอียด · [ ] หมุน · Enter วาง · Esc ยกเลิก</span>`;
    const k = [t.x, t.z, t.r, !!why].join('|'); if (k === Mode.key) return; Mode.key = k;
    if (Mode.ghost && Mode.ghost.parent) Mode.ghost.parent.remove(Mode.ghost);
    const g = new THREE.Group(), col = why ? 0xff5252 : 0x66dd66, mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.45, depthWrite: false });
    const slab = new THREE.Mesh(new THREE.BoxGeometry(HS * 2, 0.12, HS * 2), mat); slab.position.y = 0.14; g.add(slab);
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(HS * 2, 0.12, HS * 2)), new THREE.LineBasicMaterial({ color: 0xffffff })); edge.position.y = 0.14; g.add(edge);
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.34, 3), new THREE.MeshBasicMaterial({ color: 0xffffff })); arrow.position.set(0, 0.32, HS - 0.25); arrow.rotation.x = Math.PI / 2; g.add(arrow);
    g.position.set(t.x, Math.max(0, World.groundY(t.x, t.z)), t.z); g.rotation.y = t.r; World.outdoor.add(g); Mode.ghost = g;
  }
  function confirm() {
    const t = aim(), why = check(t.x, t.z, t.r, Mode.idx); if (why) { toast('วางตรงนี้ไม่ได้: ' + why, '⚠️'); return; }
    const p = S.plots[Mode.idx], was = !p.off; p.x = t.x; p.z = t.z; p.r = t.r; p.off = 0;
    try { World.clearNear(t.x, t.z, 1.6, true); } catch (e) { }
    const idx = Mode.idx; stopMode(); ensureG(); applyVisual(idx); try { refreshPlot(idx); } catch (e) { }
    toast(was ? 'ย้ายแปลงแล้ว' : 'วางแปลงแล้ว', '🟫'); try { saveGame(true); } catch (e) { }
  }
  document.addEventListener('keydown', e => {
    if (!Mode.on) return;
    if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); confirm(); } else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); stopMode(); }
    else if (e.key === '[') act('r-15'); else if (e.key === ']') act('r+15');
  }, true);

  // ---------- store back / buy from the app ----------
  function toStorage(idx) {
    const p = S.plots[idx]; if (!p || !p.extra || p.off) return;
    const go = () => { p.c = null; p.g = 0; p.w = 0; p.f = 0; p.dry = 0; p.off = 1; try { const o = G.plots[idx]; o.key = ''; } catch (e) { } try { refreshPlot(idx); } catch (e) { } toast('เก็บแปลงเข้าคลังแล้ว', '📦'); };
    if (p.c) UI.confirm('เก็บแปลงที่มีพืชอยู่?', `พืช${CROPS[p.c] ? CROPS[p.c].n : ''}ในแปลงนี้จะหายไป (เก็บเกี่ยวก่อนจะดีกว่า)`, 'เก็บเข้าคลัง', () => { go(); UI.renderBody && UI.renderBody(); }); else go();
  }
  function buy(n) {
    const l = left(); if (l <= 0) { toast(capMsg(), '🟫'); return; }
    if (S.lvl < 2) { toast('ปลดล็อกที่เลเวล 2', '🔒'); return; }
    n = Math.min(n, l); const cost = n === 6 ? PACK : n * KIT;
    if (S.money < cost) { toast('เงินไม่พอ', '💸'); return; }
    S.money -= cost; try { Bank2.log(`ซื้อชุดแปลงผัก ${n} แปลง`, -cost); } catch (e) { }
    addSlots(n); try { Sfx.coin(); } catch (e) { } toast(`ซื้อแปลงผัก ${n} แปลง (แปลงทั้งหมด ${total()}/${MAX})`, '🟫'); try { saveGame(true); } catch (e) { }
  }

  // ---------- phone app ----------
  const TABS = ['แปลงของฉัน', 'ซื้อแปลง'];
  const stateTxt = i => { const p = S.plots[i], st = stageOf(p); const names = ['เพิ่งปลูก', 'งอก', 'โต', 'พร้อมเก็บเกี่ยว']; return p.c ? `${CROPS[p.c] ? CROPS[p.c].i + ' ' + CROPS[p.c].n : p.c} · ${st >= 0 ? names[st] : ''} · ${p.w > 0.02 ? '💧 ชื้น' : '🌵 แห้ง'}${p.f ? ' · 🧪' : ''}` : 'ว่าง'; };
  function render(t) {
    const L = extras();
    if (t === 0) {
      const ps = placed().length, ss = stored().length;
      return `<p class="lead">แปลงทั้งหมด ${total()}/${MAX} (${brk()}) · วางแล้ว ${ps} · ในคลัง ${ss}</p>` + (L.length ? `<div class="grid">${L.map((i, n) => {
        const p = S.plots[i];
        const btn = p.off ? `<button class="btn" data-a="v40" data-v="place|${i}">📍 วางแปลง</button>` : `<button class="btn" data-a="v40" data-v="place|${i}">📍 ย้าย / หมุน</button><button class="btn ghost" data-a="v40" data-v="store|${i}">📦 เก็บเข้าคลัง</button><button class="btn ghost" data-a="v40" data-v="go|${i}">🚶 ไปที่แปลง</button>`;
        return `<div class="card"><div class="ci">${p.off ? '📦' : '🟫'}</div><div class="cb"><h4>แปลงเพิ่ม #${n + 1}${p.off ? ' (ในคลัง)' : ''}</h4><p class="dim">${p.off ? 'ยังไม่ได้วาง' : `${esc(stateTxt(i))} · หมุน ${Math.round((p.r || 0) * 180 / Math.PI)}° · ตำแหน่ง ${Math.round(p.x)}, ${Math.round(p.z)}`}</p><div class="row">${btn}</div></div></div>`;
      }).join('')}</div>` : '<p class="dim">ยังไม่มีแปลงเพิ่ม ซื้อได้ที่แท็บ "ซื้อแปลง" ร้านเกษตรรุ่งเรือง หรือช่างไม้ และจากคอมพิวเตอร์ที่บ้าน</p>');
    }
    const l = left(), lock = S.lvl < 2 ? 'ปลดล็อกที่เลเวล 2' : '';
    const b = (cond, label, v) => `<button class="btn" data-a="v40" data-v="${v}" ${cond ? 'disabled' : ''}>${label}</button>`;
    return `<p class="lead">แปลงทั้งหมด ${total()}/${MAX} (${brk()}) · ซื้อได้อีก ${l} แปลง · เงิน ${baht(S.money)}</p>${l <= 0 ? `<p class="bad">${capMsg()}</p>` : ''}<div class="grid">
      <div class="card"><div class="ci">🟫</div><div class="cb"><h4>ชุดแปลงผัก 1 แปลง</h4><p class="dim">แปลงดินพร้อมขอบ ขนาดเท่าแปลงเดิม วางและหมุนได้อิสระ</p><div class="row">${b(l < 1 || S.money < KIT || lock, lock || (l < 1 ? 'ครบแล้ว' : baht(KIT)), 'buy|1')}</div></div></div>
      <div class="card"><div class="ci">📦</div><div class="cb"><h4>แพ็ก 6 แปลง</h4><p class="dim">${baht(PACK)} (ถูกกว่าซื้อทีละแปลง ${baht(KIT * 6 - PACK)})</p><div class="row">${b(l < 6 || S.money < PACK || lock, lock || (l < 6 ? `เหลือ ${l} แปลง` : baht(PACK)), 'buy|6')}</div></div></div>
      ${l > 0 && l < 6 ? `<div class="card"><div class="ci">🧮</div><div class="cb"><h4>ซื้อให้ครบ ${MAX} แปลงรวม</h4><p class="dim">อีก ${l} แปลง ราคาแปลงละ ${baht(KIT)}</p><div class="row">${b(S.money < KIT * l || lock, baht(KIT * l), 'buyall|' + l)}</div></div></div>` : ''}
    </div><p class="dim">ซื้อแล้วแปลงไปอยู่ใน "คลังแปลง" กด "วางแปลง" ที่แท็บแรก เดินเพื่อเลือกตำแหน่ง หมุนได้ละเอียด 15° วางได้เฉพาะในที่ดินของคุณและไม่ทับบ้าน ถนน คอก หรือแปลงอื่น</p>`;
  }
  const hub = { tab: 0 };
  const openApp = () => UI.open('🟫 จัดการแปลงผัก', TABS, t => { hub.tab = t; return render(t); }, { tab: hub.tab });
  if (!APPS.some(a => a.id === 'plots40')) APPS.splice(Math.min(APPS.length, 13), 0, { id: 'plots40', i: '🟫', n: 'จัดการแปลง' });
  Phone.apps.plots40 = () => { setTimeout(() => { Phone.app = null; UI.close(); openApp(); }, 0); return ''; };
  try { if (typeof APP_GROUPS !== 'undefined') { const gr = APP_GROUPS.find(x => /ฟาร์ม|ไร่/.test(x[0])) || APP_GROUPS[0]; if (gr && !gr[1].includes('plots40')) gr[1].unshift('plots40'); } } catch (e) { }
  UI.H.v40 = d => {
    const [k, a] = String(d.v || '').split('|');
    if (k === 'buy') buy(+a); else if (k === 'buyall') buy(+a);
    else if (k === 'place') startMode(+a); else if (k === 'store') toStorage(+a);
    else if (k === 'go') { const p = S.plots[+a]; if (p && p.extra && !p.off) { try { UI.close(); G.player.pos.set(p.x, 0, p.z + 2.2); S.p.x = G.player.pos.x; S.p.z = G.player.pos.z; } catch (e) { } } }
  };

  // ---------- big map markers ----------
  { const _bm = UI.bigMap.bind(UI); UI.bigMap = function () {
    _bm(); const c = UI.cur; if (!c) return; const a = c.after;
    c.after = () => { if (a) a(); try { const cv = document.getElementById('bigmap'), img = World.mapImg; if (!cv || !img) return; const g = cv.getContext('2d'), k = cv.width / img.width; g.fillStyle = '#8a5a34'; g.strokeStyle = '#fff3d6'; g.lineWidth = 1.5; for (const i of placed()) { const p = S.plots[i], x = (p.x - WORLD.minX) / 2 * k, y = (p.z - WORLD.minZ) / 2 * k, s = cv.width * 0.006; g.fillRect(x - s, y - s, s * 2, s * 2); g.strokeRect(x - s, y - s, s * 2, s * 2); } } catch (e) { } };
    UI.renderBody();
  }; }

  // ---------- boot / new day ----------
  ensureG();
  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { ensureG(); } catch (e) { } return r; }; }
  window.Plots40 = { orig, total, extras, placed, stored, left, buy, addSlots, check, start: startMode, store: toStorage, state: () => ({ n: extras().length, placed: placed().length, stored: stored().length }), MAX };
});
