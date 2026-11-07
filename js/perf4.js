'use strict';
// ---------- Quality pass: a repeatable graphics benchmark, merging static scenery inside every world group,
// fewer shadow casters, freeing GPU memory when things are rebuilt, a smoother adaptive-resolution governor that
// remembers each device, nicer light (rim light, warmer low sun, brighter nights, gentle auto-exposure),
// safer saves (backup copy, pruning), a grouped & searchable phone, and an automated long-run test ----------

// ===== 1. benchmark: same camera path every time =====
const BENCH_PATH = [{ x: 6, z: -8, n: 'ไร่' }, { x: -20, z: -48, n: 'หน้าบ้าน' }, { x: 0, z: -200, n: 'หมู่บ้าน' }, { x: -28, z: -262, n: 'ลานน้ำพุ' }, { x: 170, z: -275, n: 'ทุ่งทอง' }, { x: -105, z: -405, n: 'ภูผาใหม่' }, { x: 350, z: -385, n: 'ริมทะเล' }];
const Bench2 = {
  run() {
    if (this.st) return; UI.close(); this.saved = { pos: G.player.pos.clone(), time: S.time, auto: Perf.auto, cam: { ...G.cam } };
    Perf.auto = false; G.paused = true; this.st = { i: 0, t: 0, frames: [], seg: [], night: false };
    UI.toast('กำลังวัดผลกราฟิก ~35 วินาที อย่าเพิ่งกดอะไร', '⏱️');
  },
  frame(dt) {
    const b = this.st; if (!b) return; b.t += dt; const P = BENCH_PATH[b.i], seg = 4.5;
    if (!b.frames[b.i]) { b.frames[b.i] = []; if (b.i === BENCH_PATH.length - 1 && !b.night) {} }
    b.frames[b.i].push(dt * 1000);
    const a = b.t / seg * Math.PI * 2; G.player.pos.set(P.x, World.groundY(P.x, P.z), P.z); G.cam.yaw = a * 0.5; G.cam.pitch = 0.35; G.cam.dist = 16; G.cam.lastDrag = performance.now(); G.focus = G.player.pos;
    if (b.t >= seg) { b.t = 0; b.i++; if (b.i === BENCH_PATH.length && !b.night) { b.night = true; b.i = 0; S.time = 21 * 60; b.dayFrames = b.frames; b.frames = []; } else if (b.i >= BENCH_PATH.length) this.finish(); }
  },
  finish() {
    const b = this.st; this.st = null; const sv = this.saved; G.player.pos.copy(sv.pos); S.time = sv.time; Perf.auto = sv.auto; Object.assign(G.cam, sv.cam); G.paused = false;
    const all = b.dayFrames.flat().concat(b.frames.flat()).sort((x, y) => x - y), avg = all.reduce((s, x) => s + x, 0) / all.length, low1 = all[Math.floor(all.length * 0.99)] || avg;
    const hitch = all.filter(x => x > 50).length, perPlace = BENCH_PATH.map((P, i) => { const f = b.dayFrames[i] || []; return `${P.n} ${Math.round(1000 / (f.reduce((s, x) => s + x, 0) / Math.max(1, f.length)))}`; });
    const ms = Perf3.measure(), info = { render: { calls: ms.calls, triangles: ms.tris }, memory: G.renderer.info.memory }, mem = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null;
    const rep = { fps: Math.round(1000 / avg), low1: Math.round(1000 / low1), hitch, places: perPlace, calls: info.render.calls, tris: info.render.triangles, geo: info.memory.geometries, tex: info.memory.textures, mem, q: G.Q.lvl, pr: G.pr, w: innerWidth, h: innerHeight, gpu: this.gpu() };
    this.last = rep; safeSet('raisukjai3d_bench', JSON.stringify(rep));
    const txt = `ไร่สุขใจ 3D ผลวัด: ${rep.fps} FPS เฉลี่ย · ช่วงช้าสุด 1% ${rep.low1} FPS · กระตุก ${hitch} ครั้ง · ${perPlace.join(' / ')} · วาด ${rep.calls} ครั้ง/เฟรม · ${U.fmt(rep.tris)} สามเหลี่ยม · หน่วยความจำ ${mem || '-'} MB · กราฟิก ${rep.q} ×${rep.pr} · ${rep.w}x${rep.h} · ${rep.gpu}`;
    UI.open('ผลวัดกราฟิก', null, () => `<p class="lead">⏱️ เฉลี่ย <b>${rep.fps} FPS</b> · ช่วงช้าสุด 1% <b>${rep.low1} FPS</b> · กระตุก (>50ms) ${hitch} ครั้ง</p><p class="lead">${perPlace.join(' · ')}</p><p class="dim">วาด ${rep.calls} ครั้ง/เฟรม · ${U.fmt(rep.tris)} สามเหลี่ยม · geometry ${rep.geo} · texture ${rep.tex}${mem ? ` · RAM ${mem} MB` : ''} · การ์ดจอ ${esc(rep.gpu)}</p><textarea id="benchTxt" style="width:100%;height:90px" readonly>${esc(txt)}</textarea><div class="row"><button class="btn" data-a="benchcopy">คัดลอกผลไปส่งให้ผู้พัฒนา</button></div>`);
  },
  gpu() { try { const gl = G.renderer.getContext(), e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL).replace(/ANGLE \(|\)$/g, '').slice(0, 60) : 'unknown'; } catch (x) { return 'unknown'; } },
};
UI.H.benchcopy = () => { const t = $('benchTxt'); if (!t) return; t.select(); try { navigator.clipboard.writeText(t.value); UI.toast('คัดลอกแล้ว วางในแชทได้เลย', '📋'); } catch (e) { document.execCommand && document.execCommand('copy'); } };
UI.H.bench2 = () => Bench2.run();

// ===== 2. merge static scenery inside each world group (the group itself stays, so visibility toggles keep working) =====
const Merge = {
  shared() { const s = new Set(Object.values(GEO)); for (const k in _gc) if (_gc[k] && _gc[k].isBufferGeometry) s.add(_gc[k]); return s; },
  // objects other modules hold on to must keep their own meshes
  protectedSet() {
    const P = new Set(), add = o => { if (o && o.isObject3D) P.add(o); };
    const scan = (obj, depth) => { if (!obj || depth > 2 || typeof obj !== 'object') return; for (const k of Object.keys(obj)) { let v; try { v = obj[k]; } catch (e) { continue; } if (!v || typeof v !== 'object') continue; if (v.isObject3D) add(v); else if (Array.isArray(v)) { for (const x of v.slice(0, 400)) { if (x && x.isObject3D) add(x); else if (x && typeof x === 'object' && depth < 2) for (const y of Object.values(x)) if (y && y.isObject3D) add(y); } } else if (depth < 2 && !(v instanceof Map)) scan(v, depth + 1); } };
    for (const name of ['World', 'Plan', 'Fut', 'Power', 'HomeBuild', 'HouseExt', 'CCTV', 'CoMap', 'Fields', 'EV', 'Sec', 'Fest2', 'Fest', 'Emergency', 'Garage', 'Contests', 'Life2', 'Town2', 'Towns4', 'Farm2', 'Social', 'Smart', 'Mine', 'Rooms', 'Shoppers', 'Pets2', 'Events', 'Stations2', 'GridOffice', 'Grid', 'PC', 'Plan10', 'Fish', 'Craft', 'People', 'Social2', 'Mall', 'Bank2', 'Gfx']) { let o; try { o = eval(name); } catch (e) { continue; } scan(o, 0); }
    for (const c of World.cull || []) add(c.o);
    return P;
  },
  run() {
    const P = this.protectedSet(), shared = this.shared(); let groups = 0, removed = 0, added = 0;
    const tryGroup = g => {
      if (P.has(g) || g.userData.merged2 || g.userData.noMerge) return;
      // skip anything with protected or animated descendants
      let bad = false, meshes = []; g.traverse(o => { if (o !== g && P.has(o)) bad = true; if (o.isSkinnedMesh || o.isInstancedMesh || o.isPoints || o.isSprite || o.isLine || o.isLight) bad = true; if (o.isMesh && o !== g) meshes.push(o); });
      if (bad || meshes.length < 3) return false;
      g.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(g.matrixWorld).invert(), buckets = new Map();
      try {
        for (const o of meshes) { if (!o.geometry || !o.geometry.attributes.position || !o.geometry.attributes.normal) return false; const k = o.material.uuid + (o.castShadow ? 's' : '') + (o.geometry.index ? 'i' : 'n') + (o.geometry.attributes.uv ? 'u' : ''); if (!buckets.has(k)) buckets.set(k, { mat: o.material, sh: o.castShadow, geos: [] }); buckets.get(k).geos.push(U.bake(o.geometry, new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld))); }
        const out = []; for (const b of buckets.values()) { const m = new THREE.Mesh(U.mergeGeos(b.geos), b.mat); m.castShadow = b.sh; m.receiveShadow = true; m.matrixAutoUpdate = false; out.push(m); b.geos.forEach(x => x.dispose()); }
        for (const o of meshes) { if (o.parent) o.parent.remove(o); if (!shared.has(o.geometry)) o.geometry.dispose(); }
        // empty sub-groups left behind are removed too
        for (const m of out) g.add(m); g.userData.merged2 = 1; groups++; removed += meshes.length; added += out.length; return true;
      } catch (e) { return false; }
    };
    // try each top-level group; if it can't be merged as a whole, try its children one level down
    for (const top of World.outdoor.children.slice()) { if (top === World.dyn || top === World.interior) continue; if (tryGroup(top) === false) for (const c of top.children.slice()) if (c.isGroup || c.type === 'Object3D') tryGroup(c); }
    this.info = { groups, removed, added };
  },
};

// ===== 3. fewer shadow casters: tiny props and things far outside the shadow box don't cast =====
const Shadows = {
  run() { let off = 0; G.scene.traverse(o => { if (!o.isMesh || !o.castShadow || o.isSkinnedMesh) return; const g = o.geometry; if (!g.boundingSphere) g.computeBoundingSphere(); const s = o.getWorldScale(new THREE.Vector3()), r = g.boundingSphere.radius * Math.max(s.x, s.y, s.z); if (r < 0.35) { o.castShadow = false; off++; } }); this.off = off; },
};

// ===== 4. free GPU memory when groups are thrown away =====
const Free = {
  shared: null,
  tree(o) {
    if (!o) return; if (!this.shared) this.shared = Merge.shared();
    o.traverse(c => {
      if (c.geometry && !this.shared.has(c.geometry) && !c.isSkinnedMesh && !(c.userData && c.userData.keepGeo)) c.geometry.dispose();
      // sign and label textures are drawn on their own canvas for each object, so they go with it (a texture still in use elsewhere is simply uploaded again)
      const ms = c.material ? (Array.isArray(c.material) ? c.material : [c.material]) : [];
      for (const m of ms) if (m.map && m.map.image instanceof HTMLCanvasElement && !(m.map.userData && m.map.userData.keep)) m.map.dispose();
    });
  },
  init() {
    const out = World.outdoor, _rm = out.remove.bind(out);
    // only groups other modules rebuild (power, CCTV, houses, fields, companies, festivals, mine floors) are destroyed for good
    out.remove = (...objs) => { _rm(...objs); for (const o of objs) if (o && o.userData && !o.userData.keep && !o.parent) setTimeout(() => { if (!o.parent) this.tree(o); }, 0); return out; };
    // temporary moving things (shoppers, customers, patrols, emergency vehicles) are freed too once they have gone for a second
    for (const grp of [World.dyn, G.scene]) { const _r = grp.remove.bind(grp); grp.remove = (...objs) => { _r(...objs); for (const o of objs) if (o && o.userData && !o.userData.keep && !o.isLight && !o.isCamera) setTimeout(() => { if (!o.parent) this.tree(o); }, 1000); return grp; }; }
    const _mb = Mine.build.bind(Mine); Mine.build = n => { for (const c of Mine.group.children) this.tree(c); return _mb(n); };
  },
};

// ===== 5. adaptive resolution that moves in small steps and remembers the device =====
{
  Perf.down = function () {
    if (Gfx.drop()) return;
    if (G.pr > 0.62) { this.setPr(Math.max(0.6, +(G.pr - 0.1).toFixed(2))); safeSet('raisukjai3d_pr', String(G.pr)); if (!this.told) { this.told = true; UI.toast('ปรับความละเอียดอัตโนมัติให้ลื่นขึ้น', '⚙️'); } return; }
    if (G.shadow) { this.setShadow(false); return; }
    if (G.view > 0.5) G.view = Math.max(0.5, G.view - 0.1);
  };
  Perf.up = function () { const maxView = G.Q.lvl === 'low' ? 0.6 : G.Q.lvl === 'med' ? 0.8 : G.Q.lvl === 'ultra' ? 1.35 : 1; if (G.view < maxView) G.view = Math.min(maxView, G.view + 0.1); else if (!G.shadow && G.Q.shadow > 0) this.setShadow(true); else if (G.pr < G.Q.pr) { this.setPr(Math.min(G.Q.pr, +(G.pr + 0.05).toFixed(2))); safeSet('raisukjai3d_pr', String(G.pr)); } };
}

// ===== 6. light & colour =====
const Look = {
  init() {
    // rim light from behind the camera side gives characters and buildings a soft edge
    this.rim = new THREE.DirectionalLight(0xbfd8ff, 0.0); G.scene.add(this.rim, this.rim.target);
    this.exp = G.renderer.toneMappingExposure;
  },
  update(dt) {
    if (!this.rim) return; const c = G.camera.position, f = G.focus || G.player.pos, night = G.night || 0;
    this.rim.position.set(f.x - (c.x - f.x), f.y + 6, f.z - (c.z - f.z)); this.rim.target.position.copy(f);
    this.rim.intensity = G.inside ? 0.15 : 0.35 * (1 - night * 0.85);   // no extra rim light on the player at night
    // nights stay readable: lift the hemisphere and nudge exposure up gently
    if (!G.inside && !G.inMine) G.hemi.intensity = Math.max(G.hemi.intensity, 0.16 * (1 - night) + 0.015);
    const want = (G.Q.lvl === 'ultra' ? 1.05 : (window.EXP141 || 1)) * (1 + night * 0.04) * (G.wx.storm ? 1.05 : 1);
    G.renderer.toneMappingExposure += (want - G.renderer.toneMappingExposure) * Math.min(1, dt * 0.8);
    // warmer, stronger sun colour when it is low (golden hour)
    const sy = G.sun.position.y - (G.focus || G.player.pos).y; if (sy > 0 && sy < 60 && !G.inside) G.sun.color.lerp(_lookWarm, 0.04); else if (sy >= 60) G.sun.color.lerp(_lookWhite, 0.04);
  },
};
const _lookWarm = new THREE.Color(1, 0.82, 0.62), _lookWhite = new THREE.Color(1, 0.98, 0.94);

// ===== 7. saves: keep the previous good copy, prune ever-growing records =====
{
  const _save = saveGame;
  // the backup copy is refreshed at most every 5 minutes, so it never doubles the storage written by every autosave
  let bakT = 0;
  saveGame = function (silent) { try { const k = saveKey(), cur = safeGet(k), now = Date.now(); if (cur && cur.length > 100 && now - bakT > 300000) { bakT = now; safeSet(k + '_bak', cur); } } catch (e) { } return _save(silent); };
  const _load = loadState;
  // only a damaged save falls back to the backup; an empty one is a deliberate new game
  loadState = function () { const s = _load(); if (s) return s; try { if (!safeGet(saveKey())) { safeSet(saveKey() + '_bak', ''); return null; } const raw = safeGet(saveKey() + '_bak'); if (raw) { UI.toast && setTimeout(() => UI.toast('เซฟหลักเสีย กู้คืนจากชุดสำรองล่าสุดแล้ว', '🛟'), 3000); safeSet(saveKey(), raw); return _load(); } } catch (e) { } return null; };
}
const Prune = {
  day() {
    for (const k of ['convN', 'chatDay']) if (S[k] && typeof S[k] === 'object' && Object.keys(S[k]).length > 150) S[k] = {};
    if (S.cal) for (const k of Object.keys(S.cal)) { const d = +(k.match(/\d+$/) || [0])[0]; if (d < S.day - 2) delete S.cal[k]; }
    for (const kid of (S.rel && S.rel.kids) || []) if (kid.did && Object.keys(kid.did).length > 20) kid.did = {};
    if (S.msgs && S.msgs.length > 80) S.msgs = S.msgs.slice(-80);
    if (S.diary && S.diary.length > 200) S.diary = S.diary.slice(-200);
  },
};

// ===== 8. phone: apps in groups with search =====
const APP_GROUPS = [
  ['📞 ติดต่อ & สังคม', ['call', 'msgs', 'people', 'chat', 'friends', 'invite', 'cards', 'board']],
  ['📋 ชีวิตประจำวัน', ['today', 'news', 'gps', 'map', 'wx', 'cam', 'diary', 'family', 'missions', 'ach', 'collect']],
  ['🏠 บ้าน & พลังงาน', ['home', 'grid', 'water', 'isp', 'cctv']],
  ['💰 การเงิน', ['bank', 'loan', 'stock', 'tax', 'estate', 'ins', 'oracle']],
  ['💼 งาน & ธุรกิจ', ['career', 'jobs', 'company', 'biz', 'agri', 'shop', 'food']],
  ['🚨 บริการ & ข้อมูล', ['taxi', 'alert', 'vote', 'pets', 'cloud', 'guide', 'set']],
];
{
  const _r = Phone.render.bind(Phone);
  Phone.render = function () {
    if (this.app) return _r();
    const top = `<div class="ph-top"><span>${this.clock()}</span><span>${WEATHER[S.weather.type].i} 📶 🔋</span></div>`, byId = Object.fromEntries(APPS.map(a => [a.id, a])), used = new Set();
    const btn = a => `<button data-a="app" data-v="${a.id}" data-n="${esc(a.n)}"><span>${a.i}${a.id === 'msgs' && this.unread() ? `<i>${this.unread()}</i>` : ''}</span>${a.n}</button>`;
    let html = top + `<input id="phSearch" placeholder="🔍 ค้นหาแอป..." style="width:100%;margin:2px 0 8px" oninput="for(const b of document.querySelectorAll('.apps button'))b.hidden=!b.dataset.n.includes(this.value);for(const h of document.querySelectorAll('.apgrp'))h.hidden=!!this.value">`;
    for (const [title, ids] of APP_GROUPS) { const L = ids.filter(id => byId[id]); if (!L.length) continue; L.forEach(id => used.add(id)); html += `<h5 class="apgrp">${title}</h5><div class="apps">${L.map(id => btn(byId[id])).join('')}</div>`; }
    const rest = APPS.filter(a => !used.has(a.id)); if (rest.length) html += `<h5 class="apgrp">✨ อื่น ๆ</h5><div class="apps">${rest.map(btn).join('')}</div>`;
    return html + `<div class="ph-sos"><button class="btn danger" data-a="dial" data-v="191">🚓 191</button><button class="btn danger" data-a="dial" data-v="199">🚒 199</button><button class="btn danger" data-a="dial" data-v="1669">🚑 1669</button></div>`;
  };
}

// ===== 9. automated long run: plays N days and checks the state stays sane =====
const QA = {
  run(days = 100) {
    const issues = [], t0 = performance.now(), m0 = S.money; let err = null;
    try { for (let d = 0; d < days; d++) { simulate(1440); for (let h = 6; h < 24; h += 3) { S.time = h * 60; Smart.hour(); } if (!Number.isFinite(S.money)) issues.push(`${RD(S.day)}: เงินเป็น NaN`); if (S.money < 0) issues.push(`${RD(S.day)}: เงินติดลบ ${S.money}`); for (const k in S.inv) if (!(S.inv[k] >= 0) || !Number.isFinite(S.inv[k])) issues.push(`${RD(S.day)}: ของ ${k} = ${S.inv[k]}`); } } catch (e) { err = e.message + ' ' + (e.stack || '').split('\n')[1]; }
    const size = JSON.stringify(S).length;
    return { days, ms: Math.round(performance.now() - t0), err, issues: issues.slice(0, 10), moneyChange: Math.round(S.money - m0), saveKB: Math.round(size / 1024) };
  },
};

const Perf4 = {
  init() {
    Look.init(); Free.init();
    // after everything is built: merge, trim shadows, measure the difference
    setTimeout(() => { const b = Perf3.measure(); Merge.run(); Shadows.run(); const a = Perf3.measure(); this.info = { before: b, after: a, merge: Merge.info, shadowsOff: Shadows.off }; console.info('perf4', JSON.stringify(this.info)); }, 6000);
    const _menu = UI.menu.bind(UI); UI.menu = () => { _menu(); const r = UI.cur.render; UI.cur.render = t => r(t).replace('<button class="btn danger" data-a="newgame">', `<button class="btn ghost" data-a="bench2">⏱️ วัดผลกราฟิกแบบละเอียด (35 วินาที ส่งผลให้ผู้พัฒนาได้)</button><button class="btn danger" data-a="newgame">`); UI.renderBody(); };
    const saved = +safeGet('raisukjai3d_pr'); if (saved && saved < G.pr && saved >= 0.6) Perf.setPr(saved);
  },
  update(dt) { Look.update(dt); Bench2.frame(dt); },
};
