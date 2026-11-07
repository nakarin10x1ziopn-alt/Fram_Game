'use strict';
// ---------- v42_garden: flower beds and fruit-tree pits in ONE garden zone, movable, with a plain answer to "what can I plant here?" ----------
// * the 6 flower beds (S.f2.fl, Farm2) and the 6 fruit-tree pits (S.trees) stand together in the orchard area; each can be moved and turned (state: S.v42 = { tr:[{x,z}], fl:[{x,z,r}] })
// * the pits are always visible; pressing one before "เปิดสวนผลไม้" (3,000 ฿) offers to open it right there instead of doing nothing
// * every bed says what it takes: a sign at the zone, the phone app "🌳 สวนผลไม้ & ดอกไม้", and every prompt that used to do nothing now opens that information
// * the greenhouse (vegetables, any season) is only described, it is not moved
V23.add('v42_garden', () => {
  const ZONE = { x: 38, z: -28 };
  const FL_HS = 0.95, TR_R = 1.3;
  const toast = (t, i) => { try { UI.toast(t, i || '🌳'); } catch (e) { } };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const St = () => { const v = S.v42 = S.v42 || {}; v.tr = v.tr || []; v.fl = v.fl || []; return v; };

  // ---------- default layout: pits 3x2 as before, flower beds 3x2 in a row just south of them ----------
  const _baseSpot = orchardSpot;
  const defTr = i => _baseSpot(i);
  const defFl = i => ({ x: 31 + (i % 3) * 3.2, z: -20.5 + ((i / 3) | 0) * 2.8, r: 0 });
  const trPos = i => { const s = St().tr[i]; return s && s.x != null ? { x: s.x, z: s.z } : defTr(i); };
  const flPos = i => { const s = St().fl[i]; return s && s.x != null ? { x: s.x, z: s.z, r: s.r || 0 } : defFl(i); };
  orchardSpot = function (i) { return trPos(i); };

  // ---------- 3D: find the existing bed soil, poi and pit mounds once ----------
  const flSoil = [], flPoi = [], flIcon = [];
  const mounds = [];
  const grab = () => {
    try {
      const g = Farm2.g;
      for (let i = 0; i < 6; i++) {
        const ox = 44 - 2 + (i % 3) * 2, oz = 15 - 1 + ((i / 3) | 0) * 2.2;
        const m = g.children.find(c => c.isMesh && Math.abs(c.position.x - ox) < 0.01 && Math.abs(c.position.z - oz) < 0.01 && Math.abs(c.position.y - 0.12) < 0.01);
        flSoil[i] = m || null;
      }
      let k = 0; for (const p of World.pois) if (p.label === 'สวนดอกไม้' && k < 6) flPoi[k++] = p;
      const og = World.orchardGroup; for (let i = 0; i < 6; i++) mounds[i] = og.children[i];
    } catch (e) { console.warn('v42 grab', e); }
  };
  const groundY = (x, z) => { try { return Math.max(0, World.groundY(x, z)); } catch (e) { return 0; } };
  function applyFl(i) {
    const p = flPos(i), y = groundY(p.x, p.z), s = flSoil[i], pl = Farm2.flPlants[i];
    if (s) { s.position.set(p.x, y + 0.12, p.z); s.rotation.y = p.r; }
    if (pl) { pl.position.set(p.x, y + 0.25, p.z); pl.rotation.y = p.r; }
    const po = flPoi[i]; if (po) { po.x = p.x + Math.sin(p.r) * 1.0; po.z = p.z + Math.cos(p.r) * 1.0; po.r = 1.2; }
    let ic = flIcon[i]; if (!ic) { ic = flIcon[i] = U.sprite('🌸', 0.55, false); Farm2.g.add(ic); }
    ic.position.set(p.x, y + 1.0, p.z); ic.visible = !Farm2.st().fl[i].c;
  }
  function applyTr(i) {
    const p = trPos(i), y = groundY(p.x, p.z), m = mounds[i], o = G.trees[i];
    if (m) m.position.set(p.x, y, p.z);
    if (o) { o.g.position.set(p.x, y, p.z); o.key = ''; try { refreshTree(i); } catch (e) { } }
  }
  const applyAll = () => { for (let i = 0; i < 6; i++) { applyFl(i); applyTr(i); } };
  // the pits show all the time (the zone is visible even before the orchard is opened)
  { const _rf = refreshField; refreshField = function () { const r = _rf.apply(this, arguments); try { World.orchardGroup.visible = true; } catch (e) { } return r; }; }
  // a flower icon above an empty bed follows planting and harvesting
  { const _fr = Farm2.refresh.bind(Farm2); Farm2.refresh = function () { const r = _fr.apply(this, arguments); try { for (let i = 0; i < 6; i++) if (flIcon[i]) flIcon[i].visible = !Farm2.st().fl[i].c; } catch (e) { } return r; }; }

  // ---------- zone sign ----------
  function buildSign() {
    const sx = 29, sz = -23.5, y = groundY(sx, sz);
    const mat = new THREE.MeshStandardMaterial({ map: U.signTex('สวนผลไม้ & ดอกไม้', { bg: '#3f6b2f' }), roughness: 0.8 });
    U.mk(World.outdoor, GEO.cylLo, M.darkwood, [sx, y + 0.8, sz], [0.07, 1.6, 0.07]);
    U.mk(World.outdoor, new THREE.PlaneGeometry(2.0, 0.5), mat, [sx, y + 1.55, sz + 0.06]);
    World.pois.push({ kind: 'act', x: sx, z: sz + 1.0, r: 1.5, label: 'ป้ายสวนผลไม้ & ดอกไม้', icon: '🌳', map: true, act: () => ({ icon: 'ℹ️', label: 'ดูว่าปลูกอะไรได้บ้าง / จัดแปลงสวน', fn: () => info(0) }) });
    try { World.clearNear(ZONE.x, ZONE.z - 4, 14, true); } catch (e) { }
  }

  // ---------- what each place takes ----------
  const treeCrops = () => Object.keys(CROPS).filter(k => CROPS[k].tree);
  const vegCrops = () => Object.keys(CROPS).filter(k => !CROPS[k].tree);
  const hrs = h => h >= 24 ? `${Math.round(h / 24 * 10) / 10} วัน` : `${h} ชม.`;
  const places = () => [
    { i: '🌸', t: 'แปลงดอกไม้ (6 แปลง)', ok: Object.keys(FLOWERS).map(f => `${ITEMS['fseed_' + f].i} ${ITEMS['fseed_' + f].n} (โต ${hrs(FLOWERS[f])})`).join(' · '),
      how: 'ซื้อเมล็ดดอกไม้ที่ร้านดอกไม้บ้านมะลิ หรือร้านเกษตร (แท็บ นาข้าว ประมง ดอกไม้) · ปลูกได้ทุกฤดู ไม่ต้องรดน้ำ · เก็บได้ครั้งละ 3 ดอก · เก็บแล้วแปลงว่างให้ปลูกใหม่' },
    { i: '🌳', t: 'หลุมไม้ผล (6 หลุม)', ok: treeCrops().map(k => `${CROPS[k].i} ${CROPS[k].n} (โต ${hrs(CROPS[k].grow)} · ออกผลซ้ำทุก ${hrs(CROPS[k].regrow)} · ${CROPS[k].yield} ผล)`).join(' · '),
      how: 'ซื้อ “ต้นกล้า…” ที่ร้านเกษตร แท็บ “ต้นกล้าไม้ผล” (มีกล้วย มะละกอ มะม่วง ส้ม ทุเรียน ฯลฯ) · ต้อง “เปิดสวนผลไม้” 3,000 ฿ ก่อน (กดที่หลุมแล้วเปิดได้เลย) · ปลูก: เลือกต้นกล้าในแถบของแล้วเดินไปกดที่หลุมว่าง หรือกด “ปลูกลงหลุมว่าง” ในหน้านี้ · ต้องรดน้ำ · ต้นกล้าปลูกในแปลงผักไม่ได้' },
    { i: '🟫', t: 'แปลงผักกลางแจ้ง', ok: `เมล็ดผักทั้งหมด ${vegCrops().length} ชนิด เช่น ${vegCrops().slice(0, 4).map(k => CROPS[k].i + CROPS[k].n).join(' ')}`,
      how: 'ต้องรดน้ำ โตเร็วขึ้นถ้าตรงฤดู · ไม่ใช่ต้นไม้ผลและไม่ใช่ดอกไม้' },
    { i: '🏡', t: 'เรือนกระจก (6 ช่อง)', ok: 'เมล็ดผักทุกชนิด (ไม่ใช่ต้นไม้ผล)', how: 'โตได้ทุกฤดู ไม่ต้องรดน้ำ' },
  ];
  // saplings in the bag, with a plant button (the old page only said "buy a sapling" and never showed the ones you already had)
  const owned = () => Object.keys(S.inv).filter(id => id.startsWith('seed_') && S.inv[id] > 0 && CROPS[id.slice(5)] && CROPS[id.slice(5)].tree);
  const ownedHTML = () => {
    const L = owned(), free = S.trees.filter(t => !t.c).length;
    if (!L.length) return '<div class="card"><div class="ci">🎒</div><div class="cb"><h4>ต้นกล้าในกระเป๋า: ยังไม่มี</h4><p class="dim">ซื้อต้นกล้าได้ที่ร้านเกษตร แท็บ “ต้นกล้าไม้ผล” (กล้วย มะละกอ มะม่วง ส้ม ทุเรียน ฯลฯ)</p></div></div>';
    return '<div class="card"><div class="ci">🎒</div><div class="cb"><h4>ต้นกล้าในกระเป๋าคุณ</h4><p class="dim">หลุมว่าง ' + free + '/6' + (S.up.orchard ? '' : ' · ต้องเปิดสวนผลไม้ก่อน (กดที่หลุมในสวน)') + '</p>' + L.map(id => '<div class="row"><span>' + ITEMS[id].i + ' ' + esc(ITEMS[id].n) + ' ×' + S.inv[id] + '</span><button class="btn" data-a="g42" data-v="plant|' + id + '">🌱 ปลูกลงหลุมว่าง</button></div>').join('') + '</div></div>';
  };
  const growTxt = () => {
    const f = Farm2.st().fl, t = S.trees;
    const fl = f.map((s, i) => s.c ? `${ITEMS[s.c].i} ${Math.min(100, Math.round(s.g / FLOWERS[s.c] * 100))}%` : '—').join('  ');
    const tr = t.map(p => p.c ? `${CROPS[p.c].i} ${stageOf(p) === 3 ? 'พร้อมเก็บ' : Math.min(100, Math.floor(p.g / CROPS[p.c].grow * 100)) + '%'}` : '—').join('  ');
    return `<p class="dim">แปลงดอกไม้: ${fl}</p><p class="dim">หลุมไม้ผล${S.up.orchard ? '' : ' (ยังไม่เปิดสวนผลไม้)'}: ${tr}</p>`;
  };

  // ---------- placement mode ----------
  const Mode = { on: false, kind: '', i: -1, r: 0, fw: 3, sd: 0, snap: 0.5, ghost: null, key: '', tmr: 0, poiKind: null };
  const PL = () => document.getElementById('pl42');
  function ensureUI() {
    if (PL()) return; const el = document.createElement('div'); el.id = 'pl42'; el.hidden = true;
    el.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:calc(92px + env(safe-area-inset-bottom,0px));z-index:9;width:min(560px,calc(100vw - 20px));background:rgba(18,38,28,.94);border:1px solid rgba(255,255,255,.2);border-radius:14px;padding:10px;color:#fff;font:14px/1.4 sans-serif;touch-action:manipulation';
    el.innerHTML = '<div id="pl42i" style="margin-bottom:8px"></div><div style="display:flex;flex-wrap:wrap;gap:6px"><button class="btn ghost" data-m="r-15" id="pl42r1">⟲ 15°</button><button class="btn ghost" data-m="r+15" id="pl42r2">⟳ 15°</button><button class="btn ghost" data-m="fwd">▲ ไกลออก</button><button class="btn ghost" data-m="back">▼ ใกล้เข้า</button><button class="btn ghost" data-m="left">◀</button><button class="btn ghost" data-m="right">▶</button><button class="btn" data-m="ok">✔ วางที่นี่</button><button class="btn ghost" data-m="no">✖ ยกเลิก</button></div>';
    el.addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (b) act(b.dataset.m); });
    document.body.appendChild(el);
  }
  const unitPos = (k, i) => k === 'fl' ? flPos(i) : trPos(i);
  const others = (k, i) => { const L = []; for (let j = 0; j < 6; j++) { if (!(k === 'fl' && j === i)) L.push({ k: 'fl', ...flPos(j) }); if (!(k === 'tr' && j === i)) L.push({ k: 'tr', ...trPos(j) }); } return L; };
  function why(k, i, x, z, r) {
    const orch = S.up.orchard, own = k === 'fl' ? flPoi[i] : null, ok = own && own.kind; if (own) own.kind = 'info'; S.up.orchard = 0;
    let w = ''; try { w = Plots40.check(x, z, r, -1); } finally { S.up.orchard = orch; if (own) own.kind = ok; }
    if (w === 'ชนต้นไม้ในสวน') w = '';
    if (w) return w;
    const mine = k === 'fl' ? FL_HS : TR_R;
    for (const o of others(k, i)) if (Math.hypot(o.x - x, o.z - z) < mine + (o.k === 'fl' ? FL_HS : TR_R) + 0.15) return 'ทับแปลงอื่นในสวน';
    return '';
  }
  function aim() {
    const P = G.player, fx = Math.sin(P.rot), fz = Math.cos(P.rot), rx = fz, rz = -fx;
    let x = P.pos.x + fx * Mode.fw + rx * Mode.sd, z = P.pos.z + fz * Mode.fw + rz * Mode.sd; if (window.Drag89) { const dp = Drag89.pos(x, z); x = dp.x; z = dp.z; }
    return { x: Math.round(x / Mode.snap) * Mode.snap, z: Math.round(z / Mode.snap) * Mode.snap, r: Mode.r };
  }
  function act(a) {
    if (!Mode.on) return;
    if (a.startsWith('r')) Mode.r = (Mode.r + (+a.slice(1)) * Math.PI / 180 + Math.PI * 2) % (Math.PI * 2);
    else if (a === 'fwd') Mode.fw = clamp(Mode.fw + 0.5, 1, 9); else if (a === 'back') Mode.fw = clamp(Mode.fw - 0.5, 1, 9); if (window.Drag89 && (a === 'fwd' || a === 'back')) Drag89.nudge(a === 'fwd' ? 0.5 : -0.5, 0);
    else if (a === 'left') Mode.sd = clamp(Mode.sd - 0.5, -6, 6); else if (a === 'right') Mode.sd = clamp(Mode.sd + 0.5, -6, 6); if (window.Drag89 && (a === 'left' || a === 'right')) Drag89.nudge(0, a === 'left' ? -0.5 : 0.5);
    else if (a === 'no') { stop(); return; } else if (a === 'ok') { confirm(); return; }
    Mode.key = ''; update();
  }
  function start(k, i) {
    if (G.inside || G.inRoom || G.inMine) { toast('ออกมายืนในฟาร์มก่อนย้ายแปลง', 'ℹ️'); return; }
    if (G.driving) { toast('ลงจากรถก่อน', 'ℹ️'); return; }
    UI.close(); ensureUI(); Object.assign(Mode, { on: true, kind: k, i, key: '', sd: 0, snap: 0.5 });
    const p = unitPos(k, i); Mode.r = p.r || 0; const P = G.player; Mode.fw = clamp(Math.hypot(p.x - P.pos.x, p.z - P.pos.z), 1, 9);
    const rot = k === 'fl'; ['pl42r1', 'pl42r2'].forEach(id => { const b = document.getElementById(id); if (b) b.hidden = !rot; });
    PL().hidden = false; update(); clearInterval(Mode.tmr); Mode.tmr = setInterval(update, 90);
  }
  function stop() { Mode.on = false; clearInterval(Mode.tmr); if (PL()) PL().hidden = true; if (Mode.ghost && Mode.ghost.parent) Mode.ghost.parent.remove(Mode.ghost); Mode.ghost = null; }
  function update() {
    if (!Mode.on) return;
    if (G.inside || G.inRoom || G.driving) { stop(); return; }
    const t = aim(), w = why(Mode.kind, Mode.i, t.x, t.z, t.r), info = document.getElementById('pl42i'); if (!info) return;
    const nm = Mode.kind === 'fl' ? `🌸 แปลงดอกไม้ #${Mode.i + 1}` : `🌳 หลุมไม้ผล #${Mode.i + 1}`;
    info.innerHTML = `<b>${nm}</b> (พืชที่ปลูกอยู่ย้ายไปด้วย)<br>${w ? `<span style="color:#ff8a80">⛔ วางตรงนี้ไม่ได้: ${w}</span>` : '<span style="color:#9be58f">✅ วางได้</span>'}${Mode.kind === 'fl' ? ` · หมุน ${Math.round(t.r * 180 / Math.PI)}°` : ''}<br><span style="opacity:.75">เดินเพื่อเลื่อน · ปุ่มเลื่อนละเอียด · Enter วาง · Esc ยกเลิก</span>`;
    const key = [t.x, t.z, t.r, !!w].join('|'); if (key === Mode.key) return; Mode.key = key;
    if (Mode.ghost && Mode.ghost.parent) Mode.ghost.parent.remove(Mode.ghost);
    const mat = new THREE.MeshBasicMaterial({ color: w ? 0xff5252 : 0x66dd66, transparent: true, opacity: 0.45, depthWrite: false }), g = new THREE.Group();
    const geo = Mode.kind === 'fl' ? new THREE.BoxGeometry(FL_HS * 1.7, 0.12, FL_HS * 1.7) : new THREE.CylinderGeometry(TR_R, TR_R, 0.12, 20);
    const slab = new THREE.Mesh(geo, mat); slab.position.y = 0.14; g.add(slab);
    g.position.set(t.x, groundY(t.x, t.z), t.z); g.rotation.y = t.r; World.outdoor.add(g); Mode.ghost = g;
  }
  function confirm() {
    const t = aim(), w = why(Mode.kind, Mode.i, t.x, t.z, t.r); if (w) { toast('วางตรงนี้ไม่ได้: ' + w, '⚠️'); return; }
    const k = Mode.kind, i = Mode.i; St()[k][i] = { x: t.x, z: t.z, r: k === 'fl' ? t.r : 0 };
    stop(); k === 'fl' ? applyFl(i) : applyTr(i);
    try { World.clearNear(t.x, t.z, 1.6, true); } catch (e) { }
    toast('ย้ายแปลงแล้ว', k === 'fl' ? '🌸' : '🌳'); try { saveGame(true); } catch (e) { }
  }
  document.addEventListener('keydown', e => {
    if (!Mode.on) return;
    if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); confirm(); } else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); stop(); }
    else if (e.key === '[') act('r-15'); else if (e.key === ']') act('r+15');
  }, true);

  // ---------- the information / layout screen ----------
  function info(tab) {
    UI.open('🌳 สวนผลไม้ & ดอกไม้', ['ปลูกอะไรได้บ้าง', 'จัดวางแปลง'], t => {
      if (t === 0) return `<p class="lead">แต่ละแปลงปลูกได้ไม่เหมือนกัน ดูตรงนี้ก่อนซื้อของ</p><div class="grid">${ownedHTML()}${places().map(p => `<div class="card"><div class="ci">${p.i}</div><div class="cb"><h4>${p.t}</h4><p>${esc(p.ok)}</p><p class="dim">${esc(p.how)}</p></div></div>`).join('')}</div>${growTxt()}`;
      const rows = [];
      for (let i = 0; i < 6; i++) { const p = flPos(i), s = Farm2.st().fl[i]; rows.push(`<div class="card"><div class="ci">🌸</div><div class="cb"><h4>แปลงดอกไม้ #${i + 1}</h4><p class="dim">${s.c ? ITEMS[s.c].n + ' ' + Math.min(100, Math.round(s.g / FLOWERS[s.c] * 100)) + '%' : 'ว่าง'} · ตำแหน่ง ${Math.round(p.x)}, ${Math.round(p.z)}</p><div class="row"><button class="btn" data-a="g42" data-v="move|fl|${i}">📍 ย้าย / หมุน</button><button class="btn ghost" data-a="g42" data-v="go|fl|${i}">🚶 ไปที่แปลง</button></div></div></div>`); }
      for (let i = 0; i < 6; i++) { const p = trPos(i), s = S.trees[i]; rows.push(`<div class="card"><div class="ci">🌳</div><div class="cb"><h4>หลุมไม้ผล #${i + 1}</h4><p class="dim">${s.c ? CROPS[s.c].n : 'ว่าง'} · ตำแหน่ง ${Math.round(p.x)}, ${Math.round(p.z)}</p><div class="row"><button class="btn" data-a="g42" data-v="move|tr|${i}">📍 ย้าย</button><button class="btn ghost" data-a="g42" data-v="go|tr|${i}">🚶 ไปที่หลุม</button></div></div></div>`); }
      return `<p class="lead">ย้ายแปลงได้ทุกที่ในที่ดินของคุณ ไม่ทับบ้าน ถนน คอก หรือแปลงอื่น พืชที่ปลูกอยู่จะย้ายไปด้วย</p><div class="row"><button class="btn ghost" data-a="g42" data-v="reset">↩️ จัดเรียงทุกแปลงกลับเข้าโซนสวน</button></div><div class="grid">${rows.join('')}</div>`;
    }, { tab: tab || 0 });
  }
  UI.H.g42 = d => {
    const [a, k, i] = String(d.v || '').split('|');
    if (a === 'move') start(k, +i);
    else if (a === 'go') { const p = unitPos(k, +i); try { UI.close(); G.player.pos.set(p.x, 0, p.z + 2.4); S.p.x = G.player.pos.x; S.p.z = G.player.pos.z; } catch (e) { } }
    else if (a === 'plant') {
      const sid = k, c = String(sid).slice(5);
      if (!CROPS[c] || !CROPS[c].tree || !count(sid)) { toast('ไม่มีต้นกล้านี้ในกระเป๋า', 'ℹ️'); return; }
      if (!S.up.orchard) { toast('ยังไม่ได้เปิดสวนผลไม้ (3,000 ฿) · เดินไปกดที่หลุมในสวนแล้วเปิดได้เลย', '🌳'); return; }
      const idx = S.trees.findIndex(t => !t.c); if (idx < 0) { toast('หลุมเต็มทุกหลุมแล้ว · เก็บเกี่ยวหรือรอให้โตก่อน', '🌳'); return; }
      plantTree(idx, c); if (S.trees[idx].c === c) { toast('ปลูก' + CROPS[c].n + 'ลงหลุม #' + (idx + 1) + ' แล้ว · อย่าลืมรดน้ำ', CROPS[c].i); try { UI.close(); info(0); } catch (e) { } }
    }
    else if (a === 'reset') { S.v42 = { tr: [], fl: [] }; applyAll(); toast('จัดแปลงกลับเข้าโซนสวนแล้ว', '🌳'); }
  };
  if (!APPS.some(a => a.id === 'garden42')) APPS.splice(Math.min(APPS.length, 14), 0, { id: 'garden42', i: '🌳', n: 'สวนผลไม้ & ดอกไม้' });
  Phone.apps.garden42 = () => { setTimeout(() => { Phone.app = null; UI.close(); info(0); }, 0); return ''; };
  try { if (typeof APP_GROUPS !== 'undefined') { const gr = APP_GROUPS.find(x => /ฟาร์ม|ไร่/.test(x[0])) || APP_GROUPS[0]; if (gr && !gr[1].includes('garden42')) gr[1].unshift('garden42'); } } catch (e) { }

  // ---------- pressing a bed must always do something ----------
  { const _s = Farm2.slotAct.bind(Farm2);
    Farm2.slotAct = function (k, i, h) {
      const r = _s(k, i, h); if (k !== 'fl' || !r) return r;
      const s = Farm2.st().fl[i];
      if (!s.c) { if (r.label && /^ต้องมี/.test(r.label)) return { icon: '🌸', label: 'แปลงดอกไม้ว่าง · ต้องมีเมล็ดดอกไม้ (กดดูว่าปลูกอะไรได้)', fn: () => info(0) }; return r; }
      const need = FLOWERS[s.c];
      if (s.g < need) return { icon: '⏳', label: `${ITEMS[s.c].n} โต ${Math.round(s.g / need * 100)}% (กดดูเวลา)`, fn: () => toast(`${ITEMS[s.c].n} ต้องรออีก ${Math.max(1, Math.ceil(need - s.g))} ชั่วโมงในเกมจึงบาน · ไม่ต้องรดน้ำ`, ITEMS[s.c].i) };
      return r;
    };
  }
  { const _t = treeAct;
    treeAct = function (i) {
      const p = S.trees[i];
      if (!S.up.orchard) {
        const sel = G.sel || '', has = !!firstSeed(true) || (sel.startsWith('seed_') && CROPS[sel.slice(5)] && CROPS[sel.slice(5)].tree);
        const cost = UPG.orchard.cost[0];
        return { icon: '🌳', label: `เปิดสวนผลไม้ ${baht(cost)} (หลุมปลูกไม้ผล 6 หลุม)`, fn: () => {
          if (S.money < cost) { toast(`เงินไม่พอ ต้องใช้ ${baht(cost)}`, '💸'); return info(0); }
          UI.confirm('เปิดสวนผลไม้?', `จ่าย ${baht(cost)} เพื่อใช้หลุมปลูกไม้ผล 6 หลุม (มะม่วง ส้ม)${has ? '' : ' · ซื้อต้นกล้าที่ร้านเกษตร แท็บต้นกล้าไม้ผล'}`, `จ่าย ${baht(cost)}`, () => {
            if (S.money < cost) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(cost), '💸'); return; } S.money -= cost; try { Bank2.log('เปิดสวนผลไม้', -cost); } catch (e) { } S.up.orchard = 1; applyUpgrade('orchard'); try { Sfx.coin(); } catch (e) { } toast('เปิดสวนผลไม้แล้ว!', '🌳'); try { saveGame(true); } catch (e) { }
          });
        } };
      }
      const r = _t(i);
      if (r && !r.fn && !r.info) { r.fn = () => info(0); r.label = '🌳 หลุมไม้ผลว่าง · ยังไม่มีต้นกล้าในกระเป๋า ซื้อที่ร้านเกษตร แท็บต้นกล้าไม้ผล (กดดูรายละเอียด)'; }
      else if (r && r.info && !p.c) r.fn = () => info(0);
      return r;
    };
  }
  // pits can be reached before the orchard is opened
  G.targetHooks.push((consider, p, px, pz) => {
    if (S.up.orchard) return;
    for (let i = 0; i < 6; i++) { const c = orchardSpot(i), d = Math.hypot(px - c.x, pz - c.z); if (d < 1.9) consider({ kind: 'tree', i }, d - 0.4); }
  });
  // a fruit-tree seed pressed on an ordinary plot used to say one line and nothing else
  { const _p = plotAct; plotAct = function (i) {
    const r = _p(i);
    if (r && /ต้นกล้าต้องปลูกในสวนผลไม้/.test(r.label || '')) return { icon: '🌳', label: 'ต้นกล้าต้องปลูกในหลุมสวนผลไม้ (กดดู / ไปที่สวน)', fn: () => info(0) };
    return r;
  }; }

  // ---------- boot ----------
  grab(); buildSign(); applyAll();
  try { World.orchardGroup.visible = true; } catch (e) { }
  window.Garden42 = { info, start, flPos, trPos, defFl, defTr, check: why, applyAll, places };
});
