'use strict';
// ---------- Core game: state, simulation, entities, controls, render loop ----------
const TIME_SCALE = 2; // game minutes per real second (the default 'fast' clock; see TimeMode for slower and real Thai time)
function gameRate() { return typeof TimeMode !== 'undefined' ? TimeMode.rate() : TIME_SCALE; }
const SAVE_KEY = 'raisukjai3d_save_v1', Q_KEY = 'raisukjai3d_quality';
let S = null;
const G = {
  t: 0, started: false, paused: false, sel: 'hand', inside: false, driving: null,
  plots: [], trees: [], spr: [], animals: [], cars: [], npcs: [], traffic: [],
  cam: { yaw: 0.5, pitch: 0.42, dist: 8.5, x: 0, y: 0, z: 0, lastDrag: 0 },
  wx: { cloud: 0.1, rain: 0, fog: 0, wind: 0.2, storm: 0 }, flash: 0, lightT: 5, wet: 0, rainbow: 0, prevRain: 0,
  target: null, tgtT: 0, saveT: 0, hudT: 0,
};

function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function safeSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
function makeQ(lvl, touch) {
  return {
    lvl, touch,
    // medium draws at the screen's own size on ordinary displays (sharp text, far less work); retina keeps 1.5
    pr: lvl === 'low' ? 1 : lvl === 'med' ? (devicePixelRatio >= 2 ? 1.5 : 1.2) : Math.min(devicePixelRatio, 2),
    shadow: lvl === 'low' ? 0 : lvl === 'med' ? 1024 : lvl === 'ultra' ? 4096 : 2048,
    trees: lvl === 'low' ? 0.6 : lvl === 'med' ? 0.7 : 1,
    grass: lvl === 'low' ? 0.3 : lvl === 'med' ? 0.4 : lvl === 'ultra' ? 1.4 : 1,
    aa: lvl !== 'low', rain: lvl === 'low' ? 500 : lvl === 'med' ? 700 : 1600,
  };
}

function newState() {
  return {
    v: 1, money: 600, day: 1, time: 7 * 60, energy: 100,
    inv: { seed_carrot: 8, seed_cabbage: 4, seed_tomato: 2, feed: 4, food_rice: 1 },
    can: { water: 15 },
    up: { house: 1, field: 1, soil: 1, barn: 1, feeder: 0, orchard: 0, can: 1, rod: 0 },
    plots: Array.from({ length: 30 }, () => ({ c: null, g: 0, w: 0, f: 0 })),
    trees: Array.from({ length: 6 }, () => ({ c: null, g: 0, w: 0, f: 0 })),
    sprinklers: [], animals: [], trough: 0, furn: {}, decor: { wall: 0, floor: 0, hide: {}, pos: {} }, cars: [], look: null, name: '', farm: 'ไร่สุขใจ', friends: {}, orders: [], chest: {}, mail: [], daily: { talk: {}, gift: {}, shower: 0, pet: 0 }, pet: null, quest: { i: 0, st: 'avail' }, projects: {}, title: '', found: {}, bookRew: {}, mineMax: 1, machines: [],
    p: { x: HOUSE_POS.x + 3, z: HOUSE_POS.z + 7.5, r: 2.6, inside: false },
    weather: { type: 'sunny', next: 'partly', change: -1 },
    goal: 0, stats: { planted: 0, watered: 0, harvest: 0, sold: 0, bought: 0, fed: 0, products: 0, cooked: 0, sea: 0, earned: 0, fish: 0 },
    tips: {},
  };
}
function loadState() {
  // v209: the copy kept on the laptop server and the copy in this browser: the NEWER one (savedAt) wins, so a save made while the server was unreachable is never replaced by an older server copy
  let raw = (typeof Net !== 'undefined' && Net.remoteSave) || null; const loc = safeGet(saveKey());
  if (raw && loc && loc.length > 100) { try { const rt = (JSON.parse(raw) || {}).savedAt || 0, lt = (JSON.parse(loc) || {}).savedAt || 0; if (lt > rt + 500) { try { safeSet(saveKey() + '_srvold', raw); } catch (e) { } raw = loc; Net.pushLocalNewer = true; } } catch (e) { } }
  raw = raw || loc; if (!raw) return null;
  try {
    const s = JSON.parse(raw), d = newState();
    const out = Object.assign(d, s);
    for (const k of ['up', 'stats', 'decor', 'can', 'weather', 'p', 'tips']) out[k] = Object.assign(newState()[k], s[k] || {});
    out.decor.hide = out.decor.hide || {};
    // v196: a hole (null / undefined) inside a list of things left by an old bug must never stop the game from loading ("undefined is not an object (evaluating 'a.x')")
    for (const k of ['animals', 'cars', 'plots']) if (Array.isArray(out[k])) out[k] = out[k].filter(x => x != null && typeof x === 'object');
    return out;
  } catch (e) { return null; }
}
function saveGame(silent) {
  if (!S || !G.player) return;
  const p = G.player;
  S.p = { x: p.pos.x, z: p.pos.z, r: p.rot, inside: G.inside };
  // far towns are only shown while visiting: save the way back instead of a spot in empty space
  if (G.away && G.away.back) S.p = { x: G.away.back.x, z: G.away.back.z, r: p.rot, inside: false };
  // inside a shop or the barn: save the spot at its door, not a spot in the hidden room
  if (G.inRoom && typeof Rooms !== 'undefined' && Rooms.cur && Rooms.cur.back) S.p = { x: Rooms.cur.back.x, z: Rooms.cur.back.z, r: p.rot, inside: false };
  if (G.driving) { S.p.x = G.driving.d.x + 2; S.p.z = G.driving.d.z; }
  S.savedAt = Date.now();   // the newer copy wins when the same save exists on this device and in the cloud
  const ok = safeSet(saveKey(), JSON.stringify(S)); Net.saveRemote(!silent);
  if (!silent) UI.toast(ok ? 'บันทึกเกมแล้ว' : (Net.on ? 'เซฟใหญ่เกินที่เก็บในเบราว์เซอร์ ส่งลงเครื่องแม่ข่ายแทนแล้ว (ดูป้าย 💻)' : 'บันทึกไม่สำเร็จ (เบราว์เซอร์ไม่อนุญาตพื้นที่เก็บข้อมูล)'), ok || Net.on ? '💾' : '⚠️');
}

// ---------- Inventory / energy ----------
function addItem(id, n = 1) { S.inv[id] = (S.inv[id] || 0) + n; Book.note(id); UI.hotbar(); }
function count(id) { return S.inv[id] || 0; }
function takeItem(id, n = 1) { if (count(id) < n) return false; S.inv[id] -= n; if (S.inv[id] <= 0) delete S.inv[id]; if (G.sel === id && !count(id)) G.sel = 'hand'; UI.hotbar(); return true; }
function maxEnergy() { return 100 + (S.up.house - 1) * 25 + ((S.lvl || 1) - 1) * 5 + (S.fit || 0); }
function useEnergy(n) {
  n = Math.ceil(n * Life2.costMult());
  if (S.energy < n) { UI.toast('หมดแรงแล้ว! กินอาหารหรือกลับไปนอนพัก', '😫'); Sfx.error(); return false; }
  S.energy = Math.max(0, S.energy - n); return true;
}
function eat(id) {
  const it = ITEMS[id]; if (!it || !it.en) return;
  if (S.energy >= maxEnergy() && S.hunger > 90 && !DRINKS.includes(id)) { UI.toast('อิ่มแล้ว พลังงานเต็ม', '😊'); return; }
  if (!takeItem(id)) return;
  S.energy = Math.min(maxEnergy(), S.energy + it.en); Life2.ate(id);
  playAct('eat', 0.9); Sfx.eat(); UI.toast(`กิน${it.n} +${it.en} พลังงาน`, it.i);
}
function earn(n) { S.money += n; S.stats.earned += n; Sfx.coin(); }

// ---------- Simulation ----------
function stageOf(p) { if (!p.c) return -1; const r = p.g / CROPS[p.c].grow; return r >= 1 ? 3 : r <= 0.001 ? 0 : r < 0.35 ? 1 : 2; }
function rollWeather(day = S.day) {
  const W = season(day).w; let t = 0; for (const k in W) t += W[k];
  let r = Math.random() * t; for (const k in W) { if ((r -= W[k]) < 0) return k; } return 'sunny';
}
// ---------- Seasons & market ----------
function seasonIdx(day = S.day) { return Math.floor((day - 1) / SEASON_LEN) % SEASONS.length; }
function season(day = S.day) { return SEASONS[seasonIdx(day)]; }
function inSeason(crop) { return CROP_SEASON[crop] === season().id; }
function strHash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return h; }
// daily price multiplier: crops swing 0.8-1.3x, cheaper in their own season (plenty of supply)
function priceMult(id) {
  const it = ITEMS[id]; if (!it) return 1;
  const b = it.base || id, r = U.hash(S.day * 7 + 3, strHash(b));
  if (it.cat === 'crop') return (0.8 + 0.5 * r) * (inSeason(b) ? 0.85 : 1.15) * (Fest.today() === FESTIVALS.rain ? 1.2 : 1);
  if (it.cat === 'fish' || it.cat === 'product') return 0.9 + 0.25 * r;
  return 1;
}
function priceOf(id, mult = 1) { return Math.max(1, Math.round((ITEMS[id].sell || 0) * priceMult(id) * mult * (S && S.perk && S.perk.cook && id.startsWith('dish_') ? 1.1 : 1))); }
const _tint = { i: -1, c: new THREE.Color() };
function seasonTint() { const i = seasonIdx(); if (i !== _tint.i) { _tint.i = i; _tint.c.copy(U.col(SEASONS[i].tint)); } return _tint.c; }
function tick(m) {
  const prev = S.time; S.time += m;
  if (S.time >= 1440) { S.time -= 1440; S.day++; }
  const cross = t => prev <= S.time ? (prev < t && S.time >= t) : (prev < t || S.time >= t);
  if (cross(360)) newDay();
  if (G.started && !G.simulating && Math.floor(prev / 60) !== Math.floor(S.time / 60)) { Emergency.hourly(); Smart.hour(); }
  if (cross(360) || cross(900)) runSprinklers(true);
  if (S.weather.change >= 0 && cross(S.weather.change)) {
    const old = S.weather.type;
    S.weather.type = old === 'fog' ? 'partly' : (old === 'rain' || old === 'storm') ? U.pick(['partly', 'cloudy', 'sunny']) : U.pick(['cloudy', 'rain', 'partly', 'sunny']);
    S.weather.change = -1;
    if (G.started && !G.inside && S.weather.type !== old) UI.toast('อากาศเปลี่ยน: ' + WEATHER[S.weather.type].n, WEATHER[S.weather.type].i);
  }
  const h = m / 60, rain = WEATHER[S.weather.type].rain > 0.3 && (G.simulating || G.wx.rain > 0.25);
  S.plots.forEach((p, i) => grow(p, h * Farm2.slowGrowth(i), rain));
  Farm2.tick(h, rain); Life2.tick(h);
  Craft.tick(h);
  if (S.up.orchard) for (const p of S.trees) grow(p, h, rain);
}
function grow(p, h, rain) {
  if (rain) p.w = 1;
  if (p.c && p.w <= 0 && p.g < CROPS[p.c].grow) p.dry = (p.dry || 0) + h;
  if (p.c) { const C = CROPS[p.c]; if (p.w > 0 && p.g < C.grow) p.g = Math.min(C.grow, p.g + h * SOIL_MULT[S.up.soil - 1] * (p.f ? 1.5 : 1) * (inSeason(p.c) ? 1.3 : 1) * (S.perk && S.perk.farm ? 1.05 : 1)); }
  p.w = Math.max(0, p.w - h / 12);
}
function simulate(mins) { G.simulating = true; while (mins > 0) { const m = Math.min(10, mins); tick(m); mins -= m; } G.simulating = false; }
function newDay() {
  S.weather.type = S.weather.next || rollWeather(); S.weather.next = S.weather.next2 || rollWeather(S.day + 1); S.weather.next2 = rollWeather(S.day + 2);
  if ((S.day - 1) % SEASON_LEN === 0) G.newSeason = true;
  S.weather.change = S.weather.type === 'fog' ? 10.5 * 60 : Math.random() < 0.35 ? Math.round((9 + Math.random() * 8) * 60) : -1;
  if (S.up.feeder && S.animals.length) {
    const need = S.animals.length - S.trough;
    if (need > 0) { const n = Math.min(need, count('feed')); if (n > 0) { takeItem('feed', n); S.trough += n; } }
  }
  let prod = 0, hungry = 0;
  if (typeof Animal40 !== 'undefined' && Animal40.morning) { const r = Animal40.morning(); prod = r.prod; hungry = r.hungry; }   // v40: per-species feed, juveniles, sickness, waiting product, clear messages
  else for (const a of S.animals) {
    if (S.trough > 0) { S.trough--; a.prod = true; a.happy = Math.min(100, (a.happy ?? 50) + 5); prod++; }
    else { a.happy = Math.max(0, (a.happy ?? 50) - 10); hungry++; }
    a.petted = false;
  }
  G.morning = { prod, hungry };
  resetDaily(); Orders.daily(); Mail.deliver(); Craft.day(); Bank.day(); Social.day(); People.kidsDay(); People.casesDay(); Bank2.day(); Home.wake(); Farm2.day(); Life2.day(); Social2.day(); Town2.day(); Events.day(); Stations2.day(); Pets2.day(); Smart.morning(); Gadgets.morning();
  if (S.perk && S.perk.animal) for (const a of S.animals) a.happy = Math.min(100, (a.happy ?? 50) + 4);
  { const f = Fest.today(), tm = Fest.daysUntil() === 1 ? FESTIVALS[season(S.day + 1).id] : null;
    if (f) setTimeout(() => UI.toast(`วันนี้มี${f.n}ที่ลานน้ำพุในหมู่บ้าน! ${f.desc}`, f.i), 1200);
    else if (tm) setTimeout(() => UI.toast(`พรุ่งนี้มี${tm.n}ที่หมู่บ้าน เตรียมผลผลิตดี ๆ ไปประกวดนะ`, tm.i), 1200); }
  if (World.calTex) World.drawCalendar(S);
}
function runSprinklers(visual) {
  for (const s of G.spr) {
    const r = TOOLS[s.d.pro ? 'sprinkler_pro' : 'sprinkler'].r;
    for (let i = 0; i < 30; i++) {
      if (!plotUnlocked(i, S.up.field)) continue;
      const pc = plotCenter(i); if (Math.hypot(pc.x - s.d.x, pc.z - s.d.z) <= r + 0.01) S.plots[i].w = 1;
    }
    if (visual) s.spray = 10;
  }
}

// ---------- Entities ----------
function makePlot(i) {
  const pc = plotCenter(i), g = new THREE.Group(); g.position.set(pc.x, 0, pc.z); World.dyn.add(g);
  const bed = U.mk(g, gcache('bedGeo', () => {
    const parts = [U.bake(U.box(1.8, 0.16, 1.8, 1.8), new THREE.Matrix4().makeTranslation(0, -0.02, 0))];
    const ridge = new THREE.CylinderGeometry(0.2, 0.2, 1.7, 10, 1, false, 0, Math.PI); ridge.rotateZ(Math.PI / 2);
    const uv = ridge.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 1.7 / 1.8, uv.getY(i) * 0.4);
    for (const z of [-0.55, 0, 0.55]) parts.push(U.bake(ridge, new THREE.Matrix4().makeScale(1, 0.45, 1).setPosition(0, 0.06, z)));
    return U.mergeGeos(parts);
  }), M.soilDry, [0, 0.1, 0]);
  const drop = U.sprite('💧', 0.5); drop.position.y = 1.05; drop.visible = false; g.add(drop);
  const ripe = U.sprite('✨', 0.55, false); ripe.position.y = 1.35; ripe.visible = false; g.add(ripe);
  return { g, bed, drop, ripe, crop: null, key: '', border: null, pop: 1 };
}
function plotBorder(o, lvl) {
  if (o.border) { o.g.remove(o.border); o.border = null; }
  if (lvl < 2) return;
  const geo = gcache('plotBorder', () => {
    const t = new THREE.Group();
    for (const s of [-1, 1]) { U.mk(t, U.box(0.12, 0.3, 2.04, 1), null, [s * 0.96, 0.15, 0]); U.mk(t, U.box(1.8, 0.3, 0.12, 1), null, [0, 0.15, s * 0.96]); }
    t.updateMatrixWorld(true); return U.mergeGeos(t.children.map(c => U.bake(c.geometry, c.matrixWorld)));
  });
  o.border = U.mk(o.g, geo, lvl === 2 ? M.wood : M.stone);
}
function refreshField() {
  G.plots.forEach((o, i) => { plotBorder(o, S.up.soil); o.key = ''; refreshPlot(i); });
  World.orchardGroup.visible = S.up.orchard > 0;
  G.trees.forEach((o, i) => { o.key = ''; refreshTree(i); });
}
function refreshPlot(i) {
  const p = S.plots[i], o = G.plots[i], un = plotUnlocked(i, S.up.field);
  o.g.visible = un; if (!un) return;
  const st = stageOf(p), wet = p.w > 0.02, key = p.c + '|' + st;
  if (key !== o.key) {
    if (o.crop) o.g.remove(o.crop); o.crop = null;
    if (p.c) { o.crop = Models.compact(Models.crop(p.c, st, i + 1)); o.crop.position.y = 0.24; o.g.add(o.crop); if (o.key) o.pop = 0.55; }
    o.key = key;
  }
  o.bed.material = wet ? M.soilWet : M.soilDry;
  o.drop.visible = !!p.c && st < 3 && !wet;
  o.ripe.visible = st === 3;
}
function makeTreeSpot(i) {
  const s = orchardSpot(i), g = new THREE.Group(); g.position.set(s.x, 0, s.z); World.orchardGroup.add(g);
  const drop = U.sprite('💧', 0.6); drop.position.y = 1.6; drop.visible = false; g.add(drop);
  const ripe = U.sprite('✨', 0.7, false); ripe.position.y = 3.6; ripe.visible = false; g.add(ripe);
  return { g, drop, ripe, crop: null, key: '', pop: 1 };
}
function refreshTree(i) {
  const p = S.trees[i], o = G.trees[i], st = stageOf(p), key = p.c + '|' + st;
  if (key !== o.key) {
    if (o.crop) o.g.remove(o.crop); o.crop = null;
    if (p.c) { o.crop = Models.compact(Models.fruitTree(p.c, st, i + 3)); o.g.add(o.crop); if (o.key) o.pop = 0.6; }
    if (o.col) { Col.remove(o.col); o.col = null; }
    if (p.c && st >= 1) o.col = Col.circle(o.g.position.x, o.g.position.z, 0.35);
    o.key = key;
  }
  o.drop.visible = !!p.c && st < 3 && p.w <= 0.02;
  o.ripe.visible = st === 3;
}
function addSprinklerObj(s) {
  const m = Models.sprinkler(s.pro); m.g.position.set(s.x, 0, s.z); World.dyn.add(m.g);
  const o = { d: s, g: m.g, head: m.head, spray: 0 }; G.spr.push(o); return o;
}
function nearestCorner(x, z) {
  const c = Math.round((x - FIELD.x0 + 0.3) / FIELD.step), r = Math.round((z - FIELD.z0 + 0.3) / FIELD.step);
  if (c < 0 || c > 6 || r < 0 || r > 5) return null;
  return { x: FIELD.x0 + c * FIELD.step - 0.3, z: FIELD.z0 + r * FIELD.step - 0.3 };
}
const ANIMAL_Y = { chicken: 0.95, sheep: 1.65, cow: 2.2, pig: 1.45 };
function addAnimalObj(a) {
  if (!a || typeof a !== 'object') return;   // v198: an empty entry in the animal list must not stop the game from loading ("undefined is not an object (evaluating 'a.x')")
  const m = Models.animal(a.type);
  if (a.x == null) { a.x = U.lerp(PEN.x0 + 3, PEN.x1 - 3, Math.random()); a.z = U.lerp(PEN.z0 + 4, PEN.z1 - 3, Math.random()); }
  m.position.set(a.x, 0, a.z); World.dyn.add(m);
  const icon = U.sprite('🥚', 0.65); icon.visible = false; World.dyn.add(icon);
  const o = { d: a, obj: m, icon, tx: a.x, tz: a.z, st: 'idle', timer: Math.random() * 3, rot: Math.random() * TAU, speed: 0, heart: 0, iconKey: '' };
  if (a.type === 'chicken' && G.animals.filter(x => x.chicks).length < 3) o.chicks = [0, 1].map(() => { const c = Models.chick(); World.dyn.add(c); return { obj: c, x: a.x, z: a.z, rot: 0 }; });
  G.animals.push(o); return o;
}
function addCarObj(c) {
  const m = Models.car(c.type, c.tune && c.tune.paint ? PAINTS[c.tune.paint][1] : undefined); Garage.dress(m, c); m.g.position.set(c.x, World.groundY(c.x, c.z), c.z); m.g.rotation.y = c.r; World.dyn.add(m.g);
  const o = Object.assign({ d: c, speed: 0 }, m); o.col = Col.box(c.x, c.z, 1.0, 2.45, c.r);
  G.cars.push(o); return o;
}
function spawnNPCs() {
  const R = U.rng(99);
  const skins = [0xf1c9a5, 0xe0a87e, 0xc68d63, 0xa8734f], shirts = [0x4a90c2, 0xe57373, 0x81c784, 0xffb74d, 0xba68c8, 0xf06292, 0x4db6ac, 0xfff176, 0x90a4ae];
  const pants = [0x34507a, 0x3e3e3e, 0x6d4c41, 0x546e7a, 0x283593], hairs = [0x1b120c, 0x3a2416, 0x6b4a2e, 0x9e9e9e];
  let ni = 0;
  const mk = (extra) => {
    const fem = R() < 0.5;
    const elder = R() < 0.2, long = fem && R() < 0.6;
    const o = Object.assign({
      skin: skins[(R() * 4) | 0], shirt: shirts[(R() * 9) | 0], pants: pants[(R() * 5) | 0], hair: elder ? 0xb8b8b8 : hairs[(R() * 4) | 0],
      long, bun: fem && !long && R() < 0.4, pony: fem && !long && R() < 0.5, beard: !fem && R() < 0.25, glasses: elder || R() < 0.12,
      skirt: fem && R() < 0.55 ? [0xc0504d, 0x4a78b5, 0x6b8e4e, 0x8e44ad, 0xd9a02a, 0x2d2d2d][(R() * 6) | 0] : null,
      hat: R() < 0.25 ? 'cap' : R() < 0.15 ? 'straw' : null, capColor: shirts[(R() * 9) | 0],
    }, extra || {});
    const h = Models.human(Object.assign(o, { avatar: People.avatarFor(NPC_NAMES[ni % NPC_NAMES.length], ni) })); World.dyn.add(h);
    const s = 0.92 + R() * 0.12; h.scale.setScalar(s);
    return { obj: h, name: NPC_NAMES[ni++ % NPC_NAMES.length], rot: R() * TAU, speed: 0, timer: R() * 3, st: 'idle', wave: 0 };
  };
  const add = (n, ex) => { G.npcs.push(Object.assign(n, ex)); };
  for (let i = 0; i < 8; i++) { const l = World.npcRoutes.village.lines[i % 2]; const z = U.lerp(l[1], l[2], R()); add(mk(), { line: l, x: l[0], z, tx: l[0], tz: z }); }
  for (let i = 0; i < 4; i++) { const p = World.npcRoutes.village.plaza, a = R() * TAU; add(mk(), { circ: p, x: p.x + Math.cos(a) * p.r, z: p.z + Math.sin(a) * p.r, tx: 0, tz: 0 }); }
  for (let i = 0; i < 6; i++) { const l = World.npcRoutes.seaside.lines[i % 2]; const x = U.lerp(l[1], l[2], R()); add(mk(), { line: l, x, z: l[0], tx: x, tz: l[0] }); }
  for (const sp of World.npcSpots) {
    const side = l2w(sp.x, sp.z, sp.rot, 1.6, 0.4);
    add(mk({ hat: sp.shop === 'farmshop' ? 'straw' : null, apron: [0xf5f2ea, 0x2f6b3f, 0xa3302a, 0x1f4e8c][ni % 4] }), { fixed: true, x: side.x, z: side.z, rot: sp.rot, tx: side.x, tz: side.z, keeper: sp.shop });
  }
  const homes = World.homes || [];
  G.npcs.forEach((n, i) => {
    n.obj.position.set(n.x, H(n.x, n.z), n.z);
    if (n.fixed) { n.hx = n.x; n.hz = n.z; n.hrot = n.rot; return; }
    const zone = n.x > 200 ? 'seaside' : 'village', list = homes.filter(h => h.zone === zone);
    if (list.length) n.home = list[i % list.length];
  });
}

function setupEntities() {
  const pm = Models.human(lookOpts(S.look || DEFAULT_LOOK));
  G.scene.add(pm);
  const can = Models.can(); can.position.set(0, -0.42, 0.04); can.visible = false; pm.userData.elR.add(can);
  G.player = { obj: pm, pos: new THREE.Vector3(S.p.x, 0, S.p.z), rot: S.p.r, vel: new THREE.Vector3(), speed: 0, act: null, can };
  G.lantern = new THREE.PointLight(0xffc27a, 0, 18, 2); G.scene.add(G.lantern);
  G.headlight = new THREE.SpotLight(0xfff2d0, 0, 70, 0.55, 0.5, 1.2); G.headlight.position.set(0, 1, 2.4); G.headlight.target.position.set(0, 0, 12);
  for (let i = 0; i < 30; i++) G.plots.push(makePlot(i));
  for (let i = 0; i < 6; i++) G.trees.push(makeTreeSpot(i));
  refreshField();
  S.sprinklers.forEach(addSprinklerObj);
  S.animals.forEach(addAnimalObj);
  S.cars.forEach(addCarObj);
  World.buildHouse(S.up.house); World.buildInterior(S.up.house, S);
  spawnNPCs(); spawnTraffic();
  const gh = Models.sprinkler(false); gh.g.traverse(m => { if (m.isMesh) { m.material = new THREE.MeshBasicMaterial({ color: 0x8fd3ff, transparent: true, opacity: 0.5 }); m.castShadow = false; } });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.95, 1, 48), new THREE.MeshBasicMaterial({ color: 0x8fd3ff, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.25;
  G.ghost = new THREE.Group(); G.ghost.add(gh.g, ring); G.ghost.ring = ring; G.ghost.visible = false; World.dyn.add(G.ghost);
  const sel = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.32, 4, 1, Math.PI / 4), new THREE.MeshBasicMaterial({ color: 0xfff3a0, transparent: true, opacity: 0.85, depthWrite: false }));
  sel.rotation.x = -Math.PI / 2; sel.visible = false; G.selRing = sel; World.dyn.add(sel);
  if (S.p.inside) setInside(true, true);
  G.cam.yaw = G.player.rot + Math.PI; snapCam();
}

// ---------- Effects ----------
const FX = {
  n: 1000, i: 0,
  init(scene) {
    const n = this.n; this.pos = new Float32Array(n * 3); this.col = new Float32Array(n * 3); this.vel = new Float32Array(n * 3); this.life = new Float32Array(n); this.grav = new Float32Array(n);
    for (let i = 0; i < n; i++) this.pos[i * 3 + 1] = -9999;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.geo = g;
    this.pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.16, map: T.dot, vertexColors: true, transparent: true, depthWrite: false }));
    this.pts.frustumCulled = false; scene.add(this.pts);
  },
  spawn(x, y, z, vx, vy, vz, life, c, grav = 9.8) {
    const i = this.i; this.i = (i + 1) % this.n;
    this.pos.set([x, y, z], i * 3); this.vel.set([vx, vy, vz], i * 3); this.col.set([c.r, c.g, c.b], i * 3);
    this.life[i] = life; this.grav[i] = grav;
  },
  burst(x, y, z, n, c, spd = 2, grav = 6) { for (let k = 0; k < n; k++) this.spawn(x, y, z, (Math.random() - 0.5) * spd, Math.random() * spd + 1, (Math.random() - 0.5) * spd, 0.6 + Math.random() * 0.4, c, grav); },
  update(dt) {
    const p = this.pos, v = this.vel;
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      if (this.life[i] <= 0) { p[i * 3 + 1] = -9999; continue; }
      v[i * 3 + 1] -= this.grav[i] * dt;
      p[i * 3] += v[i * 3] * dt; p[i * 3 + 1] += v[i * 3 + 1] * dt; p[i * 3 + 2] += v[i * 3 + 2] * dt;
    }
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.color.needsUpdate = true;
  },
};
const DUST_C = new THREE.Color(0.62, 0.52, 0.38), WATER_C = new THREE.Color(0.55, 0.78, 1.0), SPLASH_C = new THREE.Color(0.75, 0.82, 0.9);

function initRain(n) {
  const pos = new Float32Array(n * 6), rel = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) rel.set([(Math.random() - 0.5) * 60, Math.random() * 30 - 12, (Math.random() - 0.5) * 60], i * 3);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xb8c8d8, transparent: true, opacity: 0.5, depthWrite: false }));
  m.frustumCulled = false; G.scene.add(m);
  G.rain = { n, pos, rel, g, m };
}
function updateRain(dt) {
  const R = G.rain, show = G.wx.rain > 0.02 && !G.inside;
  R.m.visible = show; if (!show) return;
  const wind = G.wx.wind * 6, cnt = Math.floor(R.n * Math.min(1, G.wx.rain * 1.1));
  for (let i = 0; i < cnt; i++) {
    let x = R.rel[i * 3], y = R.rel[i * 3 + 1], z = R.rel[i * 3 + 2];
    y -= 24 * dt; x += wind * dt;
    if (y < -12) { y = 16 + Math.random() * 6; x = (Math.random() - 0.5) * 60; z = (Math.random() - 0.5) * 60; }
    R.rel[i * 3] = x; R.rel[i * 3 + 1] = y; R.rel[i * 3 + 2] = z;
    const o = i * 6, P = R.pos; P[o] = x; P[o + 1] = y; P[o + 2] = z; P[o + 3] = x - wind * 0.03; P[o + 4] = y - 0.75; P[o + 5] = z;
  }
  R.g.setDrawRange(0, cnt * 2); R.g.attributes.position.needsUpdate = true;
  // ground splashes around the player
  R.acc = (R.acc || 0) + G.wx.rain * dt * 70;
  const p = G.player.pos;
  while (R.acc >= 1) {
    R.acc--; const x = p.x + (Math.random() - 0.5) * 18, z = p.z + (Math.random() - 0.5) * 18;
    if (Math.hypot(x - G.camera.position.x, z - G.camera.position.z) < 5) continue;
    FX.spawn(x, World.groundY(x, z) + 0.05, z, (Math.random() - 0.5) * 0.7, 1 + Math.random() * 0.8, (Math.random() - 0.5) * 0.7, 0.22, SPLASH_C, 9);
  }
  R.m.position.copy(G.camera.position);
}

// ---------- Weather & sky ----------
const SKYK = [   // hour, sky top, horizon, sun colour, sun power, ambient: warm daylight, a short golden dusk, and by 19:00 a dark night sky
  [0, 0x050a1c, 0x0d1a38, 0x000000, 0, 0.05], [4.8, 0x070e26, 0x15244a, 0x000000, 0, 0.06],
  [5.6, 0x2f3578, 0xe8855a, 0xff9a5a, 0.3, 0.26], [6.5, 0x4f86c8, 0xf4c49a, 0xffc890, 1.3, 0.46],
  [8, 0x4a8fe0, 0xbcdcf2, 0xfff0d8, 2.0, 0.56], [12, 0x3a84e2, 0xc6e2f6, 0xffffff, 2.35, 0.6],
  [16, 0x4688dc, 0xcfe0ee, 0xfff2dc, 2.1, 0.58], [17.4, 0x5578c0, 0xf3b27a, 0xffb070, 1.3, 0.46],
  [18.2, 0x3a3470, 0xe0704a, 0xff7040, 0.35, 0.28], [18.7, 0x141a3e, 0x3a2c58, 0x000000, 0, 0.12],
  [19.2, 0x060b1e, 0x0e1630, 0x000000, 0, 0.05], [24, 0x050a1c, 0x0d1a38, 0x000000, 0, 0.05],
];
const _c = { a: new THREE.Color(), b: new THREE.Color(), top: new THREE.Color(), hor: new THREE.Color(), sun: new THREE.Color(), gray: new THREE.Color(), tmp: new THREE.Color() };
const _v = { sun: new THREE.Vector3(), moon: new THREE.Vector3(), f: new THREE.Vector3() };
function updateWeather(dt) {
  const W = WEATHER[S.weather.type], k = Math.min(1, dt * 0.12);
  for (const key of ['cloud', 'rain', 'fog', 'wind']) G.wx[key] = U.lerp(G.wx[key], W[key], k);
  G.wx.storm = U.lerp(G.wx.storm, W.storm || 0, k);
  G.wet = U.clamp(G.wet + (G.wx.rain > 0.2 ? dt * 0.05 : -dt * 0.01), 0, 1);
  if (G.wx.storm > 0.5 && !G.inside) {
    G.lightT -= dt;
    if (G.lightT <= 0) { G.flash = 1; G.lightT = 4 + Math.random() * 9; Sfx.thunder(0.3 + Math.random() * 1.4); }
  }
  G.flash = Math.max(0, G.flash - dt * 3.5);
  const hr = S.time / 60, day = hr > 6.5 && hr < 18;
  if (G.prevRain > 0.4 && G.wx.rain < 0.15 && day) G.rainbow = 60;
  G.prevRain = G.wx.rain > 0.4 ? G.wx.rain : (G.wx.rain < 0.15 ? 0 : G.prevRain);
  G.rainbow = Math.max(0, G.rainbow - dt);
}
// 29.5-day cycle: 0 = new moon, pi = full moon (day 14 is a full moon)
const moonPhase = () => ((S.day + 1) % 29.5) / 29.5 * TAU;
const moonLit = () => 0.5 - 0.5 * Math.cos(moonPhase());
function updateSky() {
  const hr = S.time / 60; let i = 0; while (i < SKYK.length - 2 && SKYK[i + 1][0] <= hr) i++;
  const a = SKYK[i], b = SKYK[i + 1], t = U.clamp((hr - a[0]) / (b[0] - a[0]), 0, 1);
  _c.top.setHex(a[1]).lerp(_c.b.setHex(b[1]), t); _c.hor.setHex(a[2]).lerp(_c.b.setHex(b[2]), t); _c.sun.setHex(a[3]).lerp(_c.b.setHex(b[3]), t);
  let sunI = U.lerp(a[4], b[4], t), hemiI = U.lerp(a[5], b[5], t);
  const cl = G.wx.cloud, rn = G.wx.rain, fg = G.wx.fog;
  const grayOf = (c, m) => { const l = (c.r * 0.3 + c.g * 0.59 + c.b * 0.11) * m; return _c.gray.setRGB(l, l, l * 1.03); };
  _c.top.lerp(grayOf(_c.top, 1.05), cl * 0.65).multiplyScalar(1 - rn * 0.38);
  _c.hor.lerp(grayOf(_c.hor, 1.0), cl * 0.55).multiplyScalar(1 - rn * 0.3);
  _c.hor.lerp(_c.tmp.setRGB(0.78, 0.8, 0.82).multiplyScalar(U.clamp(hemiI * 1.5, 0.15, 1)), fg * 0.7);
  if (G.flash > 0) { _c.top.lerp(_c.tmp.setRGB(0.85, 0.88, 1), G.flash * 0.6); _c.hor.lerp(_c.tmp.setRGB(0.85, 0.88, 1), G.flash * 0.5); }
  const ang = (hr - 6) / 12 * Math.PI;
  _v.sun.set(Math.cos(ang), Math.sin(ang) * 0.95, 0.38).normalize();
  // the moon sits opposite the sun but stays low enough to be seen over the scenery; it rises at dusk and sets at dawn
  _v.moon.set(-_v.sun.x, 0.1 + Math.max(0, -_v.sun.y) * 0.3, -0.3).normalize();
  const night = 1 - U.smooth(-0.12, 0.12, _v.sun.y);
  const sky = World.sky.material.uniforms;
  sky.top.value.copy(_c.top); sky.hor.value.copy(_c.hor); sky.gnd.value.copy(_c.hor).multiplyScalar(0.75);
  sky.sunCol.value.copy(_c.sun).multiplyScalar(1 - cl * 0.85);
  // god rays only near sunrise/sunset, strongest with broken cloud
  sky.rays.value = (1 - U.smooth(0.05, 0.35, Math.abs(_v.sun.y))) * (_v.sun.y > -0.05 ? 1 : 0) * (0.45 + Math.min(cl, 0.7)) * (1 - rn); sky.time.value = G.t; sky.sunDir.value.copy(_v.sun); sky.moonDir.value.copy(_v.moon); sky.moonPh.value = moonPhase(); sky.night.value = night * (1 - cl * 0.9);
  const fog = G.scene.fog;
  if (G.inside) { fog.color.setRGB(0.16, 0.14, 0.12); fog.near = 40; fog.far = 160; }
  else {
    fog.color.copy(_c.hor);
    let far = U.lerp(1100, 280, Math.max(cl * 0.25, rn * 0.6)); far = U.lerp(far, 75, fg);
    fog.far = far; fog.near = far * 0.08;
  }
  const L = G.sun, focus = G.focus || G.player.pos;
  const useSun = _v.sun.y > 0;
  const dir = useSun ? _v.sun : _v.moon;
  L.position.copy(focus).addScaledVector(dir, 150); L.target.position.copy(focus);
  const dim = (1 - cl * 0.72) * (1 - rn * 0.3);
  if (useSun) { L.color.copy(_c.sun).convertSRGBToLinear(); L.intensity = sunI * dim * (G.inside ? 0.5 : 1); }
  else { L.color.setRGB(0.5, 0.66, 1.0); L.intensity = (0.04 + 0.1 * moonLit()) * night * (1 - cl * 0.7) * (G.inside ? 0.4 : 1); }
  G.hemi.color.copy(_c.top).lerp(_c.tmp.setRGB(1, 1, 1), 0.35).convertSRGBToLinear();
  G.hemiBase = hemiI * (1 - cl * 0.15) * (1 - rn * 0.3);
  // the environment map already supplies sky light outdoors, so the hemisphere light is scaled down there
  G.hemi.intensity = G.hemiBase * (G.scene.environment ? 0.2 : 1) + G.flash * 1.8 + (G.inside ? 0.25 : 0) + (G.inside ? 0 : night * 0.02 * (1 - cl * 0.5));
  const wet = G.wet;
  const tint = seasonTint(); World.terrainMat.color.copy(tint).multiplyScalar(1 - wet * 0.22); for (const m of World.folMats) m.color.copy(tint); World.roadMat.color.setScalar(1 - wet * 0.32);
  World.puddleMat.opacity = U.smooth(0.12, 0.6, wet) * 0.72; World.puddles.visible = World.puddleMat.opacity > 0.01;
  M.glass.emissiveIntensity = night * 0.85;
  M.bulb.emissiveIntensity = 0.1 + night * 2.4;
  World.stars.material.opacity = night * (1 - cl); World.stars.material.uniforms.time.value = G.t; World.stars.material.uniforms.px.value = Math.min(devicePixelRatio || 1, 2);
  World.cloudMat.color.setRGB(1, 1, 1).lerp(_c.tmp.setRGB(0.42, 0.44, 0.48), rn * 0.8 + cl * 0.15).multiplyScalar(U.clamp(hemiI * 1.6, 0.12, 1));
  World.cloudMat.emissive.copy(World.cloudMat.color).multiplyScalar(0.25);
  const nC = Math.floor(World.clouds.length * U.clamp(cl * 1.1 + 0.08, 0, 1));
  World.clouds.forEach((c, k) => { c.visible = k < nC && !G.inside; });
  if (World.inWinMat) World.inWinMat.color.copy(_c.hor).convertSRGBToLinear();
  if (World.inLamp) { World.inLamp.intensity = 0.4 + night * 1.4; World.inGlow.material.opacity = 0.25 + night * 0.6; World.inLight.intensity = 0.9 + night * 0.5; }
  if (World.clockH) { const hr = S.time / 60; World.clockH.rotation.z = -(hr % 12) / 12 * TAU; World.clockM.rotation.z = -(S.time % 60) / 60 * TAU; }
  const wantLantern = G.inMine;   // no light follows the player outdoors at night (only the mine lamp)
  G.lantern.intensity = U.lerp(G.lantern.intensity, G.inMine ? 1.6 : wantLantern ? 1.1 * night : 0, 0.1);
  if (G.inMine) { L.intensity = 0.12; G.hemi.intensity = 0.3; }
  G.lantern.position.set(G.player.pos.x, G.player.pos.y + (G.inMine ? 3.2 : 2.6), G.player.pos.z);
  World.roadMat.roughness = U.lerp(0.85, 0.3, G.wet); World.terrainMat.roughness = U.lerp(0.95, 0.75, G.wet);
  if (World.lighthouse) World.lighthouse.beam.material.opacity = night * 0.18;
  for (const c of G.cars) { const on = night > 0.3 && c === G.driving; c.lightM.emissiveIntensity = on ? 2 : 0.1; c.tailM.emissiveIntensity = on ? 1.5 : 0.2; }
  for (const t of G.traffic) { const on = night > 0.3; t.lightM.emissiveIntensity = on ? 2 : 0.1; t.tailM.emissiveIntensity = on ? 1.5 : 0.2; t.glowM.opacity = on && !G.inside ? 0.8 * night : 0; }
  for (const c of G.cars) c.glowM.opacity = night > 0.3 && c === G.driving ? 0.8 * night : 0;
  const go = G.inside ? 0 : night;
  for (const p of World.glows.lamp) p.material.opacity = go * 0.85;
  for (const p of World.glows.win) p.material.opacity = go * 0.5;
  G.headlight.intensity = G.driving && (night > 0.3 || G.wx.rain > 0.4 || G.wx.fog > 0.5) ? 2.2 : 0;   // lights on at night and in heavy rain or fog, as the law says
  const rbo = Math.min(1, G.rainbow / 5) * Math.min(1, (60 - G.rainbow) / 3) * (1 - night);
  World.rainbow.visible = rbo > 0.01 && !G.inside;
  if (World.rainbow.visible) {
    World.rainbow.material.uniforms.op.value = rbo;
    const cp = G.camera.position; World.rainbow.position.set(cp.x - _v.sun.x * 600, -60, cp.z - _v.sun.z * 600);
    World.rainbow.lookAt(cp.x, -60, cp.z);
  }
  G.night = night;
}

// ---------- Input ----------
const Input = {
  keys: {}, joy: { x: 0, y: 0, id: null, ox: 0, oy: 0 }, ptr: new Map(), sprint: false, pinch: 0,
  init() {
    const cv = G.renderer.domElement;
    addEventListener('keydown', e => {
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      if (e.code === 'Escape') { UI.close(); return; }
      if (UI.isOpen()) return;
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      this.keys[e.code] = true;
      if (!G.started) return;
      const code = KeyMap.tr(e.code);
      if (code === 'KeyE' || code === 'Space') { e.preventDefault(); doAction(); }
      if (code === 'KeyF') toggleCar();
      if (code === 'KeyG') honk();
      if (code === 'KeyR' && Move.k) Move.rotate();
      if (code === 'KeyB') UI.book();
      if (code === 'KeyP') Phone.open();
      if (code === 'KeyI') UI.inventory();
      if (code === 'KeyM') UI.bigMap();
      if (code === 'KeyH' && G.inside) UI.decor();
      if (/^Digit[1-9]$/.test(e.code)) UI.selectSlot(+e.code.slice(5) - 1);
    });
    addEventListener('keyup', e => { this.keys[e.code] = false; const c = typeof KeyMap !== 'undefined' ? KeyMap.tr(e.code) : e.code; if (c === 'KeyE' || c === 'Space' || e.code === 'KeyE' || e.code === 'Space') Fish.holding = false; });
    addEventListener('blur', () => { this.keys = {}; });
    cv.addEventListener('contextmenu', e => e.preventDefault());
    const joyEl = document.getElementById('joy'), knob = document.getElementById('joyKnob');
    addEventListener('pointerdown', () => Sfx.resume(), true);
    cv.addEventListener('pointerdown', e => {
      cv.setPointerCapture && cv.setPointerCapture(e.pointerId);
      if (window.Drag89 && Drag89.down(e)) return;
      if (e.pointerType === 'touch' && e.clientX < innerWidth * 0.45 && e.clientY > innerHeight * 0.3 && this.joy.id === null) {
        this.joy.id = e.pointerId; this.joy.ox = e.clientX; this.joy.oy = e.clientY;
        joyEl.style.left = (e.clientX - 60) + 'px'; joyEl.style.top = (e.clientY - 60) + 'px'; joyEl.classList.add('on');
        knob.style.transform = 'translate(0px,0px)'; return;
      }
      this.ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.ptr.size === 2) { const [a, b] = [...this.ptr.values()]; this.pinch = Math.hypot(a.x - b.x, a.y - b.y); }
    });
    cv.addEventListener('pointermove', e => {
      if (window.Drag89 && Drag89.move(e)) return;
      if (e.pointerId === this.joy.id) {
        let dx = e.clientX - this.joy.ox, dy = e.clientY - this.joy.oy; const l = Math.hypot(dx, dy), m = 55;
        if (l > m) { dx = dx / l * m; dy = dy / l * m; }
        this.joy.x = dx / m; this.joy.y = -dy / m; knob.style.transform = `translate(${dx}px,${dy}px)`; return;
      }
      const p = this.ptr.get(e.pointerId); if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      if (this.ptr.size === 1) {
        const k = e.pointerType === 'touch' ? 0.007 : 0.005;
        G.cam.yaw -= dx * k; G.cam.pitch = U.clamp(G.cam.pitch + dy * k * 0.8, 0.08, 1.35); G.cam.lastDrag = performance.now();
      } else if (this.ptr.size === 2) {
        const [a, b] = [...this.ptr.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (this.pinch) G.cam.dist = U.clamp(G.cam.dist * this.pinch / d, 3.5, 24); this.pinch = d;
      }
    });
    const up = e => {
      if (window.Drag89 && Drag89.up(e)) return;
      if (e.pointerId === this.joy.id) { this.joy.id = null; this.joy.x = 0; this.joy.y = 0; joyEl.classList.remove('on'); }
      this.ptr.delete(e.pointerId); if (this.ptr.size < 2) this.pinch = 0;
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', e => { e.preventDefault(); G.cam.dist = U.clamp(G.cam.dist * (1 + Math.sign(e.deltaY) * 0.1), 3.5, 24); }, { passive: false });
  },
  axis() {
    const k = this.keys; let x = 0, y = 0;
    if (k.KeyW || k.ArrowUp) y += 1; if (k.KeyS || k.ArrowDown) y -= 1;
    if (k.KeyA || k.ArrowLeft) x -= 1; if (k.KeyD || k.ArrowRight) x += 1;
    x += this.joy.x + Pad.x; y += this.joy.y + Pad.y;
    const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
    return { x, y };
  },
  running() { return this.sprint || this.keys.ShiftLeft || this.keys.ShiftRight || Math.hypot(this.joy.x, this.joy.y) > 0.95; },
};

// ---------- Player ----------
function playAct(type, dur, lock = true) { G.player.act = { type, t: 0, dur, lock }; }
function updatePlayer(dt) {
  const P = G.player, a = Input.axis(), mag = Math.min(1, Math.hypot(a.x, a.y));
  const yaw = G.cam.yaw, fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  let mx = fx * a.y + rx * a.x, mz = fz * a.y + rz * a.x; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
  const busy = P.act && P.act.lock;
  // v167: on a laptop / PC (mouse + keyboard, not a touch tablet) walking and running are 25% quicker
  const deskWalk = () => { if (G._desk == null) { let d = false; try { d = !(typeof IOS !== "undefined" && IOS) && matchMedia("(hover: hover) and (pointer: fine)").matches; } catch (e) { } G._desk = d; } return G._desk ? 1.25 : 1; };
  const sp = busy ? 0 : mag * (S.riding ? (Input.running() ? 8 : 4.2) : (Input.running() && !G.inside ? 6.0 : 3.2) * deskWalk()) * (S.perk && S.perk.shoes ? 1.1 : 1) * (S.buff && S.buff.fast === S.day ? 1.1 : 1);   // v127: quicker to play (v119 had 1.7 / 4.0 m/s, which felt too slow): walk 3.2 m/s (~11 km/h, a brisk walk-jog), run 6 m/s (~22 km/h); a horse trots at ~15 km/h and gallops at ~29 km/h
  P.vel.x = U.lerp(P.vel.x, mx * sp, Math.min(1, dt * 10)); P.vel.z = U.lerp(P.vel.z, mz * sp, Math.min(1, dt * 10));
  P.speed = Math.hypot(P.vel.x, P.vel.z);
  if (mag > 0.05 && !busy) P.rot = U.angLerp(P.rot, Math.atan2(mx, mz), Math.min(1, dt * 12));
  P.pos.x += P.vel.x * dt; P.pos.z += P.vel.z * dt;
  if (G.inside) {
    const r = World.room, c = G.inMine ? MINE0 : G.inRoom ? RM0 : IN; Col.push(P.pos, 0.32);
    P.pos.x = U.clamp(P.pos.x, c.x - r.w / 2 + 0.35, c.x + r.w / 2 - 0.35); P.pos.z = U.clamp(P.pos.z, c.z - r.d / 2 + 0.35, c.z + r.d / 2 - 0.35);
    P.pos.y = c.y;
  } else {
    Col.push(P.pos, 0.34);
    for (const t of G.traffic) pushFromCar(P.pos, 0.34, t.x, t.z, t.h);
    for (const n of G.npcs) { if (n.away) continue; const dx = P.pos.x - n.x, dz = P.pos.z - n.z, d = Math.hypot(dx, dz); if (d < 0.6 && d > 0.01) { P.pos.x = n.x + dx / d * 0.6; P.pos.z = n.z + dz / d * 0.6; } }
    if (G.away) { const A = G.away; P.pos.x = U.clamp(P.pos.x, A.x0, A.x1); P.pos.z = U.clamp(P.pos.z, A.z0, A.z1); P.pos.y = A.y; }
    else {
    const onPier = P.pos.x > 414 && Math.abs(P.pos.z + 380) < 1.8;
    P.pos.x = U.clamp(P.pos.x, WORLD.minX + 30, onPier ? 469 : 424); P.pos.z = U.clamp(P.pos.z, WORLD.minZ + 30, WORLD.maxZ - 30);
    if (P.pos.x > 414 && !onPier && World.groundY(P.pos.x, P.pos.z) < -0.35) P.pos.x -= 0.2;
    P.pos.y = World.groundY(P.pos.x, P.pos.z);
    }
  }
  P.obj.position.copy(P.pos); P.obj.rotation.y = P.rot;
  if (P.act) { P.act.t += dt; if (P.act.t >= P.act.dur) P.act = null; }
  Models.animHuman(P.obj, dt, P.speed, P.act);
  const stepN = Math.floor(P.obj.userData.phase / Math.PI);
  if (stepN !== P.stepN && P.speed > 0.6) {
    const onPier = P.pos.x > 414 && Math.abs(P.pos.z + 380) < 2.1;
    const surf = G.inside || onPier ? 'wood' : roadDist(P.pos.x, P.pos.z) < 4.2 || zoneAt(P.pos.x, P.pos.z)?.id === 'village' || zoneAt(P.pos.x, P.pos.z)?.id === 'seaside' ? 'hard' : (P.pos.x > PEN.x0 && P.pos.x < PEN.x1 && P.pos.z > PEN.z0 && P.pos.z < PEN.z1) ? 'dirt' : 'grass';
    Sfx.step(G.wet > 0.5 && surf !== 'wood' ? 'dirt' : surf);
    if (P.speed > 3.2 && !G.inside && surf !== 'wood') for (let k = 0; k < 3; k++) FX.spawn(P.pos.x + (Math.random() - 0.5) * 0.3, P.pos.y + 0.05, P.pos.z + (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.6, 0.4 + Math.random() * 0.4, (Math.random() - 0.5) * 0.6, 0.55, G.wet > 0.5 ? WATER_C : DUST_C, 2);
  }
  P.stepN = stepN;
  // empty hand means nothing in hand: no can, rod or pickaxe
  const bare = G.sel === 'hand' && !(P.act && P.act.lock);
  P.can.visible = !bare && !G.inMine && (G.sel === 'can' || (P.act && P.act.type === 'water'));
  Mine.pick.visible = !!G.inMine && !bare;
  if (Fish.rod && bare && !Fish.st) Fish.rod.visible = false;
  if (P.act && P.act.type === 'water' && P.act.t > 0.2 && P.act.t < 0.85) {
    _v.f.set(0, 0.22, 0.27); P.can.localToWorld(_v.f);
    for (let k = 0; k < 3; k++) FX.spawn(_v.f.x, _v.f.y, _v.f.z, Math.sin(P.rot) * 1.2 + (Math.random() - 0.5) * 0.4, -0.5, Math.cos(P.rot) * 1.2 + (Math.random() - 0.5) * 0.4, 0.7, WATER_C, 9);
  }
}

// ---------- Vehicle ----------
// A car's footprint is two circles along its heading (front and back axle)
function pushFromCar(p, r, cx, cz, h) {
  let hit = false; const sx = Math.sin(h), sz = Math.cos(h);
  for (const k of [1.3, -1.3]) {
    const ox = cx + sx * k, oz = cz + sz * k, dx = p.x - ox, dz = p.z - oz, d = Math.hypot(dx, dz), m = r + 1.05;
    if (d < m && d > 1e-4) { p.x = ox + dx / d * m; p.z = oz + dz / d * m; hit = true; }
  }
  return hit;
}
// Pedestrians step aside from an approaching car; anyone actually touched is pushed clear and the car bumps
function carVsPeople(car, x, z, h, speed, honked) {
  const fx = Math.sin(h), fz = Math.cos(h), dirS = Math.sign(speed) || 1;
  for (const n of G.npcs) {
    if (n.away || !n.obj.visible) continue;
    const dx = n.x - x, dz = n.z - z; if (Math.abs(dx) > 18 || Math.abs(dz) > 18) continue;
    const lz = dx * fx + dz * fz, lx = dx * fz - dz * fx, side = lx >= 0 ? 1 : -1;
    if (Math.abs(lx) < 1.25 && Math.abs(lz) < 2.7) {
      const push = side * 1.6 - lx; n.x += fz * push; n.z -= fx * push;
      if (Math.abs(car.speed) > 3) { Sfx.burst(0.2, 300, 'lowpass', 0.4); n.wave = 1.2; }
      car.speed *= 0.4;
    } else if (!n.dodge && Math.abs(lx) < 2.4 && lz * dirS > 0 && Math.abs(lz) < (honked ? 16 : 4 + Math.abs(speed) * 0.9) && (Math.abs(speed) > 2 || honked)) {
      n.dodge = { x: n.x + fz * side * 3.6, z: n.z - fx * side * 3.6, t: 1.8 };
    }
  }
}
function honk() {
  const c = G.driving; if (!c) return;
  if (c.d.tune && c.d.tune.horn) { Sfx.tone(660, 0.28, 'square', 0.06); Sfx.tone(880, 0.3, 'square', 0.06, null, 0.28); } else Sfx.horn(); carVsPeople(c, c.d.x, c.d.z, c.d.r, Math.max(1, c.speed), true);
}

// ---------- Traffic: AI cars that drive the whole road network on the left lane (Thai traffic) ----------
// Roads form a small graph: at a junction a car carries on onto a connected road; only at a real dead end does it
// slow down and swing round in a wide U-turn, so no car ever pivots on the spot in the middle of a road.
function spawnTraffic() {
  G.traffic = [];
  const routes = World.roadCurves.map(rc => { const sp = rc.sp, step = sp[0].distanceTo(sp[1]); return { sp, step, len: step * (sp.length - 1) }; });
  linkRoutes(routes); G.routes = routes;
  const cols = [0xf2f2f2, 0xa9b0b6, 0x2f5d9e, 0x1d1d1d, 0x8a2b2b, 0x3a7a4a, 0xd9a02a];
  const plan = [[0, 0.25, 1], [0, 0.7, -1], [1, 0.2, 1], [1, 0.55, -1], [1, 0.85, 1]].slice(0, G.Q.lvl === 'low' ? 3 : 5);
  plan.forEach(([ri, f, dir], i) => {
    const type = Assets.has('car:sedan') ? ['sedan', 'van', 'taxi', 'suv', 'delivery'][i] : i === 4 ? 'sports' : i % 2 ? 'pickup' : 'oldtruck';
    const m = Models.car(type, cols[(i * 3) % cols.length]); World.dyn.add(m.g);
    const R = routes[Math.min(ri, routes.length - 1)];
    G.traffic.push(Object.assign(m, { R, s: R.len * f, dir, speed: 0, max: 10 + Math.random() * 4, turn: -1, x: 0, z: 0, h: 0, vh: null, block: 0 }));
  });
  G.traffic.forEach(t => placeTraffic(t, 0));
}
function nearestS(R, x, z) {
  let best = 0, bd = 1e9;
  R.sp.forEach((p, i) => { const d = Math.hypot(p.x - x, p.z - z); if (d < bd) { bd = d; best = i; } });
  return { s: best * R.step, d: bd };
}
// R.ends[0|1]: roads to carry on onto at each end; R.branches: side roads that start part-way along R
function linkRoutes(routes) {
  for (const R of routes) { R.ends = [[], []]; R.branches = []; }
  for (const R of routes) for (const Q of routes) {
    if (Q === R) continue;
    [0, R.len].forEach((sEnd, e) => {
      const p = routeAt(R, sEnd), n = nearestS(Q, p.x, p.z);
      if (n.d > 20) return;
      if (n.s < Q.len - 12) R.ends[e].push({ Q, s: n.s, dir: 1 });
      if (n.s > 12) R.ends[e].push({ Q, s: n.s, dir: -1 });
      // R starts or ends part-way along Q: cars on Q may turn off into R there
      if (n.s > 6 && n.s < Q.len - 6) Q.branches.push({ s: n.s, R, sR: e ? R.len : 0, dirR: e ? -1 : 1 });
    });
  }
}
function routeAt(R, s) {
  const k = U.clamp(s / R.step, 0, R.sp.length - 1.001), i = Math.floor(k), t = k - i, a = R.sp[i], b = R.sp[i + 1];
  const tx = b.x - a.x, tz = b.z - a.z, l = Math.hypot(tx, tz) || 1;
  return { x: a.x + tx * t, z: a.z + tz * t, tx: tx / l, tz: tz / l };
}
function lanePoint(R, s, dir) { const p = routeAt(R, s), dx = p.tx * dir, dz = p.tz * dir; return { x: p.x + dz * 2, z: p.z - dx * 2 }; }
// a cubic Bezier path the car follows until it rejoins a lane (junction turns and dead-end U-turns)
function setPath(t, x1, z1, x2, z2, x3, z3, R, s, dir, slow) {
  const x0 = t.x, z0 = t.z; let len = 0, px = x0, pz = z0;
  for (let i = 1; i <= 12; i++) { const u = i / 12, a = (1 - u) ** 3, b = 3 * u * (1 - u) ** 2, c = 3 * u * u * (1 - u), d = u ** 3; const x = a * x0 + b * x1 + c * x2 + d * x3, z = a * z0 + b * z1 + c * z2 + d * z3; len += Math.hypot(x - px, z - pz); px = x; pz = z; }
  t.xfer = { x0, z0, x1, z1, x2, z2, x3, z3, u: 0, len: Math.max(1, len), R, s, dir, slow };
}
// a turn is only taken if the target lane lies ahead and the bend is no sharper than about 125 degrees
function xferOK(t, R, s, dir) {
  s = U.clamp(s, 1, R.len - 1);
  const p2 = lanePoint(R, s, dir), q = routeAt(R, s), f0x = Math.sin(t.h), f0z = Math.cos(t.h);
  return (p2.x - t.x) * f0x + (p2.z - t.z) * f0z > 3 && f0x * q.tx * dir + f0z * q.tz * dir > -0.55;
}
// Turn onto another road: curve tangent to the current heading and to the target lane
function startXfer(t, R, s, dir) {
  s = U.clamp(s, 1, R.len - 1);
  const p2 = lanePoint(R, s, dir), q = routeAt(R, s);
  const f0x = Math.sin(t.h), f0z = Math.cos(t.h), f2x = q.tx * dir, f2z = q.tz * dir;
  const den = f0x * f2z - f0z * f2x;
  if (Math.abs(den) > 0.05) {
    const k = ((p2.x - t.x) * f2z - (p2.z - t.z) * f2x) / den;
    const cx = t.x + f0x * k, cz = t.z + f0z * k;
    // the bend point must sit before the target on its lane, or the curve would arrive facing backwards
    if (k > 0 && k < 40 && (cx - p2.x) * f2x + (cz - p2.z) * f2z < -0.5) return setPath(t, t.x + (cx - t.x) * 2 / 3, t.z + (cz - t.z) * 2 / 3, p2.x + (cx - p2.x) * 2 / 3, p2.z + (cz - p2.z) * 2 / 3, p2.x, p2.z, R, s, dir);
  }
  // (nearly) parallel lanes: an S-bend tangent to both
  const L = Math.max(2, Math.hypot(p2.x - t.x, p2.z - t.z) / 3);
  setPath(t, t.x + f0x * L, t.z + f0z * L, p2.x - f2x * L, p2.z - f2z * L, p2.x, p2.z, R, s, dir);
}
// Dead end: slow, wide teardrop U-turn that swings out past the road end and comes back in the opposite lane
function startUTurn(t) {
  const p = routeAt(t.R, t.s), fx = p.tx * t.dir, fz = p.tz * t.dir, ox = fz, oz = -fx;
  const x3 = p.x - ox * 2, z3 = p.z - oz * 2, k = 8;
  setPath(t, t.x + fx * k + ox * 1.8, t.z + fz * k + oz * 1.8, x3 + fx * k - ox * 1.8, z3 + fz * k - oz * 1.8, x3, z3, t.R, t.s, -t.dir, true);
}
function placeTraffic(t, dt) {
  const LANE = 2;
  if (t.xfer) {
    const X = t.xfer; X.u = Math.min(1, X.u + dt * Math.max(1, t.speed) / X.len);
    const u = X.u, a = (1 - u) ** 3, b = 3 * u * (1 - u) ** 2, c = 3 * u * u * (1 - u), d = u ** 3;
    t.x = a * X.x0 + b * X.x1 + c * X.x2 + d * X.x3; t.z = a * X.z0 + b * X.z1 + c * X.z2 + d * X.z3;
    const dx = 3 * (1 - u) ** 2 * (X.x1 - X.x0) + 6 * (1 - u) * u * (X.x2 - X.x1) + 3 * u * u * (X.x3 - X.x2);
    const dz = 3 * (1 - u) ** 2 * (X.z1 - X.z0) + 6 * (1 - u) * u * (X.z2 - X.z1) + 3 * u * u * (X.z3 - X.z2);
    if (dx * dx + dz * dz > 1e-6) t.h = Math.atan2(dx, dz);
    if (u >= 1) { t.R = X.R; t.s = X.s; t.dir = X.dir; t.xfer = null; }
  } else {
    const p = routeAt(t.R, t.s), dx = p.tx * t.dir, dz = p.tz * t.dir;
    t.x = p.x + dz * LANE; t.z = p.z - dx * LANE; t.h = Math.atan2(dx, dz);
  }
  // the body turns at a believable rate, so a kink in the path never shows as a spin
  if (t.vh == null || !dt) t.vh = t.h;
  else { const dh = Math.atan2(Math.sin(t.h - t.vh), Math.cos(t.h - t.vh)), m = 2.6 * dt; t.vh += U.clamp(dh, -m, m); }
  const y = World.groundY(t.x, t.z);
  t.g.position.set(t.x, y, t.z); t.g.rotation.set(0, t.vh, 0);
}
function updateTraffic(dt) {
  const cp = G.camera.position, P = G.player.pos;
  for (const t of G.traffic) {
    let want = zoneAt(t.x, t.z) ? Math.min(t.max, 8) : t.max;
    const fx = Math.sin(t.h), fz = Math.cos(t.h), look = 6 + t.speed * 1.3;
    let blocked = false;
    const obst = (x, z, r) => {
      const dx = x - t.x, dz = z - t.z, lz = dx * fx + dz * fz, lx = dx * fz - dz * fx;
      if (lz > 0.6 && lz < look && Math.abs(lx) < 1.3 + r) { want = Math.min(want, Math.max(0, (lz - 4.2) * 0.9)); if (lz < 7) blocked = true; }
    };
    if (G.driving) obst(G.driving.d.x, G.driving.d.z, 1.1); else if (!G.inside) obst(P.x, P.z, 0.4);
    // a car stuck for a while eases through other cars (never through people) so traffic can't deadlock
    t.ghost = Math.max(0, (t.ghost || 0) - dt);
    if (!t.ghost) {
      for (const c of G.cars) if (c !== G.driving) obst(c.d.x, c.d.z, 1.1);
      for (const o of G.traffic) if (o !== t) obst(o.x, o.z, 1.1);
    }
    // two cars on the same spot (after easing through a jam): the later one waits until there is a gap
    for (const o of G.traffic) if (o !== t && G.traffic.indexOf(o) < G.traffic.indexOf(t) && Math.abs(o.x - t.x) + Math.abs(o.z - t.z) < 1.2 && !t.ghost) { want = 0; blocked = true; }
    for (const n of G.npcs) if (!n.away && n.obj.visible && Math.abs(n.x - t.x) + Math.abs(n.z - t.z) < 20) obst(n.x, n.z, 0.4);
    // traffic lights: wait behind the stop line on red, cars already in the junction carry on
    if (G.stopPts && !t.xfer) for (const s of G.stopPts) { if (!s.red(t.h)) continue; const dx = s.x - t.x, dz = s.z - t.z, lz = dx * fx + dz * fz, lx = dx * fz - dz * fx; if (lz > 9.5 && lz < 32 && Math.abs(lx) < 9) want = Math.min(want, Math.max(0, (lz - 10) * 0.8)); }
    const ends = t.R.ends ? t.R.ends[t.dir > 0 ? 1 : 0] : [];
    const rem = t.dir > 0 ? t.R.len - t.s : t.s;
    if (t.xfer) want = Math.min(want, t.xfer.slow ? 3.2 : 7);
    else if (!ends.length) want = Math.min(want, Math.max(3.2, (rem - 8) * 0.7 + 3.2)); // brake for the dead end
    t.speed = want > t.speed ? Math.min(want, t.speed + 4 * dt) : Math.max(want, t.speed - 12 * dt);
    t.block = blocked && t.speed < 0.5 ? t.block + dt : 0;
    t.stuck = t.speed < 0.3 ? (t.stuck || 0) + dt : 0;
    if (t.stuck > 6) { t.stuck = 0; t.ghost = 3; }
    if (t.block > 2.5) { t.block = -5; if (Math.abs(cp.x - t.x) + Math.abs(cp.z - t.z) < 60) Sfx.horn(Math.abs(cp.x - t.x) + Math.abs(cp.z - t.z) > 25); carVsPeople(t, t.x, t.z, t.h, 1, true); }
    if (!t.xfer) {
      const prev = t.s; t.s = U.clamp(t.s + t.dir * t.speed * dt, 0.5, t.R.len - 0.5);
      // side roads: sometimes turn off where one joins (decided 8 m before the junction)
      for (const b of t.R.branches || []) {
        const at = b.s - t.dir * 8;
        if (prev !== t.s && (prev - at) * (t.s - at) <= 0 && Math.random() < 0.35 && xferOK(t, b.R, b.sR + b.dirR * 9, b.dirR)) { startXfer(t, b.R, b.sR + b.dirR * 9, b.dirR); break; }
      }
      const r2 = t.dir > 0 ? t.R.len - t.s : t.s;
      if (!t.xfer && r2 <= 9) {
        // carry on along a connected road; a junction with no road ahead counts as a dead end
        const ok = [];
        for (const l of ends) for (const off of [9, 14, 20]) if (xferOK(t, l.Q, l.s + l.dir * off, l.dir)) { ok.push([l, off]); break; }
        if (ok.length) { const [l, off] = ok[Math.floor(Math.random() * ok.length)]; startXfer(t, l.Q, l.s + l.dir * off, l.dir); }
        else startUTurn(t);
      }
    }
    if (t.speed > 1) carVsPeople(t, t.x, t.z, t.h, t.speed, false);
    placeTraffic(t, dt);
    for (const w of t.wheels) w.rotation.x += t.speed * dt / t.r;
    t.g.visible = !G.inside && Math.abs(cp.x - t.x) + Math.abs(cp.z - t.z) < 320 * G.view;
  }
}

function updateCar(dt) {
  const c = G.driving, d = c.d, spec = Garage.spec(d), a = Input.axis();
  const offroad = roadDist(d.x, d.z) > 5 && !zoneAt(d.x, d.z);
  // a wrecked car (top speed 0) must not divide by zero and turn every position into NaN
  const top = Math.max(0.05, spec.top * (offroad ? spec.off : 1) * Town2.topMult(d));
  const thr = a.y;
  // real cars: a family car needs ~9 s to 100 km/h, brakes at about 1 g, and rolls a long way with the foot off the pedal (drag + ~0.5 m/s2 of rolling resistance)
  if (thr > 0.05) c.speed += c.speed < 0 ? 11 * dt * thr : spec.acc * (spec.acc >= 18 ? 0.85 : 0.55) * dt * thr * Math.max(0, 1 - c.speed / top);
  else if (thr < -0.05) c.speed = c.speed > 0.5 ? Math.max(0, c.speed - 11 * (1 - 0.3 * (G.wet || 0) - 0.15 * (G.wx ? G.wx.rain : 0)) * dt * -thr) : Math.max(-6, c.speed - 3.2 * dt * -thr);
  else { c.speed = c.speed * (1 - Math.min(1, dt * 0.09)) - Math.sign(c.speed) * 0.55 * dt; if (Math.abs(c.speed) < 0.1) c.speed = 0; }
  if (c.speed > top) c.speed = U.lerp(c.speed, top, dt * 2);
  // steering like a real car (bicycle model): yaw rate = speed * tan(wheel angle) / wheelbase, and the tyres can only give ~0.8 g sideways (less on wet or rough ground),
  // so at 100 km/h a car turns slowly (the old rule let it turn at 5.8 g at any speed)
  { const L = 2.7 + (CARS[d.type] && /truck|bus|delivery|van|garbage/.test(CARS[d.type].k || '') ? 1.2 : 0), grip = (1 - 0.35 * (G.wet || 0) - 0.3 * (G.wx ? G.wx.rain * 0.5 : 0)) * (offroad ? 0.75 : 1), kt = spec.turn / 1.9;
    c.sa = (c.sa || 0) + (a.x - (c.sa || 0)) * Math.min(1, dt * 7);                                  // the steering wheel takes a moment to turn
    const av = Math.abs(c.speed), dMax = Math.min(0.55 * kt, Math.atan(8 * grip * kt * L / Math.max(av * av, 0.01)));
    d.r -= c.speed * Math.tan(c.sa * dMax) / L * dt; }
  const ox = d.x, oz = d.z;
  const p = { x: d.x + Math.sin(d.r) * c.speed * dt, z: d.z + Math.cos(d.r) * c.speed * dt };
  const f = { x: p.x + Math.sin(d.r) * 1.4, z: p.z + Math.cos(d.r) * 1.4 }, b = { x: p.x - Math.sin(d.r) * 1.4, z: p.z - Math.cos(d.r) * 1.4 };
  const f0 = { x: f.x, z: f.z }, b0 = { x: b.x, z: b.z };
  let hit = Col.push(f, 1.05); hit = Col.push(b, 1.05) || hit;
  if (hit) {
    p.x += ((f.x - f0.x) + (b.x - b0.x)) / 2; p.z += ((f.z - f0.z) + (b.z - b0.z)) / 2;
    if (Math.abs(c.speed) > 4) { Sfx.burst(0.25, 200, 'lowpass', 0.5); if (G.Q.touch && navigator.vibrate) navigator.vibrate(40); }
    c._hit = Math.abs(c.speed) > 4 ? Math.abs(c.speed) : 0; if (c._hit > 0 && window.Crash80) Crash80.hit(c._hit, 'wall'); c.speed *= -0.06;
  }
  if (G.away) { const A = G.away; p.x = U.clamp(p.x, A.x0 + 2, A.x1 - 2); p.z = U.clamp(p.z, A.z0 + 2, A.z1 - 2); }
  else { p.x = U.clamp(p.x, WORLD.minX + 30, 420); p.z = U.clamp(p.z, WORLD.minZ + 30, WORLD.maxZ - 30); }
  if (World.groundY(p.x, p.z) < -0.3) { p.x = ox; p.z = oz; c.speed = 0; }
  for (const t of G.traffic) {
    const q = { x: p.x, z: p.z };
    // a real crash stops both cars; a gentle nudge from behind must not freeze the traffic car in place
    if (pushFromCar(q, 1.15, t.x, t.z, t.h)) { p.x = q.x; p.z = q.z; if (Math.abs(c.speed) > 4) { Sfx.burst(0.25, 200, 'lowpass', 0.5); t.speed = 0; if (window.Crash80) Crash80.hit(Math.abs(c.speed), 'car'); } c.speed *= -0.06; }
  }
  carVsPeople(c, p.x, p.z, d.r, c.speed, false);
  Town2.drive(c, Math.hypot(p.x - d.x, p.z - d.z), c._hit || 0, dt); c._hit = 0;
  d.x = p.x; d.z = p.z;
  const sx = Math.sin(d.r), cz = Math.cos(d.r);
  const hf = World.groundY(d.x + sx * 1.6, d.z + cz * 1.6), hb = World.groundY(d.x - sx * 1.6, d.z - cz * 1.6);
  const hl = World.groundY(d.x + cz * 0.9, d.z - sx * 0.9), hr = World.groundY(d.x - cz * 0.9, d.z + sx * 0.9);
  const y = (hf + hb + hl + hr) / 4;
  c.g.position.set(d.x, y, d.z);
  c.g.rotation.set(-Math.atan2(hf - hb, 3.2), d.r, Math.atan2(hl - hr, 1.8), 'YXZ');
  for (const w of c.wheels) w.rotation.x += c.speed * dt / c.r;
  if (Math.abs(c.speed) > 5 && (offroad || roadDist(d.x, d.z) > 4.5) && Math.random() < Math.abs(c.speed) * dt * 3) for (const sd of [-1, 1]) {
    const q = l2w(d.x, d.z, d.r, sd * 0.85, -1.6); FX.spawn(q.x, y + 0.2, q.z, (Math.random() - 0.5) * 1.2, 0.8 + Math.random(), (Math.random() - 0.5) * 1.2, 1.1, G.wet > 0.5 ? WATER_C : DUST_C, 1.5);
  }
  for (const s of c.steer) s.rotation.y = U.lerp(s.rotation.y, -a.x * 0.45, Math.min(1, dt * 8));
  G.player.pos.set(d.x, y, d.z);
}
function toggleCar() {
  if (G.driving) return exitCar();
  const t = G.target; if (t && t.kind === 'car') enterCar(t.car);
}
function enterCar(c) {
  if (Fish.st) Fish.end();
  G.driving = c; Col.remove(c.col); c.col = null; G.player.obj.visible = false; c.g.add(G.headlight, G.headlight.target);
  Sfx.door(); UI.buttons();
  if (!S.tips.car) { S.tips.car = 1; UI.toast(G.Q.touch ? 'ใช้จอยซ้าย: ดันขึ้น=เร่ง ลง=ถอย ซ้าย/ขวา=เลี้ยว' : 'W/S เร่ง-ถอย · A/D เลี้ยว · F ลงรถ', '🚗'); }
}
function exitCar() {
  const c = G.driving; if (!c) return;
  if (Math.abs(c.speed) > 2.5) { UI.toast('ชะลอรถให้หยุดก่อนลงนะ', '🛑'); return; }
  c.speed = 0; const d = c.d;
  let spot = null;
  for (const [lx, lz] of [[1.9, 0], [-1.9, 0], [0, -3.6], [0, 3.6], [2.6, 2], [-2.6, -2]]) {
    const p = l2w(d.x, d.z, d.r, lx, lz), q = { x: p.x, z: p.z }; Col.push(q, 0.4);
    if (Math.hypot(q.x - p.x, q.z - p.z) < 0.05 && World.groundY(p.x, p.z) > -0.3) { spot = p; break; }
  }
  if (!spot) spot = l2w(d.x, d.z, d.r, 1.9, 0);
  G.driving = null; c.col = Col.box(d.x, d.z, 1.0, 2.45, d.r);
  G.player.pos.set(spot.x, World.groundY(spot.x, spot.z), spot.z); G.player.obj.visible = true; G.player.rot = d.r;
  c.g.remove(G.headlight, G.headlight.target);
  Sfx.door(); UI.buttons(); saveGame(true);
}

// ---------- Camera ----------
function updateCamera(dt) {
  const c = G.cam, tg = G.driving ? G.driving.g.position : G.player.pos;
  const k = Math.min(1, dt * (G.driving ? 6 : 10));
  c.x = U.lerp(c.x, tg.x, k); c.y = U.lerp(c.y, tg.y, k); c.z = U.lerp(c.z, tg.z, k);
  if (G.driving && performance.now() - c.lastDrag > 1500 && Math.abs(G.driving.speed) > 1) c.yaw = U.angLerp(c.yaw, G.driving.d.r + (G.driving.speed < 0 ? 0 : Math.PI), Math.min(1, dt * 2.2));
  const dist = G.lookCam ? (innerWidth <= 640 ? 4.6 : 3.4) : G.inside ? Math.min(c.dist, 8.5) : G.driving ? Math.max(c.dist, 9.5) : c.dist;
  const pitch = G.lookCam ? 0.02 : G.inside ? Math.max(c.pitch, 0.62) : c.pitch;
  const cp = G.camera.position;
  cp.set(c.x + Math.sin(c.yaw) * Math.cos(pitch) * dist, c.y + Math.sin(pitch) * dist + 1.5, c.z + Math.cos(c.yaw) * Math.cos(pitch) * dist);
  if (!G.inside) {
    const tx = c.x, ty = c.y + 1.3, tz = c.z; let lim = 1;
    for (let t = 0.12; t <= 1; t += 0.05) {
      const x = tx + (cp.x - tx) * t, y = ty + (cp.y - ty) * t, z = tz + (cp.z - tz) * t;
      if (y < 9 && Col.hitBig(x, z)) { lim = Math.max(0.12, t - 0.06); break; }
    }
    c.lim = U.lerp(c.lim || 1, lim, lim < (c.lim || 1) ? 1 : Math.min(1, dt * 3));
    cp.set(tx + (cp.x - tx) * c.lim, ty + (cp.y - ty) * c.lim, tz + (cp.z - tz) * c.lim);
    const gy = World.groundY(cp.x, cp.z) + 0.6; if (cp.y < gy) cp.y = gy;
  }
  if (G.lookCam) {
    // keep the character clear of the creator panel: panel on the right (desktop) or at the bottom (phone)
    const narrow = innerWidth <= 640, rx = Math.cos(c.yaw), rz = -Math.sin(c.yaw), off = narrow ? 0 : 0.85;
    G.camera.lookAt(c.x + rx * off, c.y + (narrow ? 0.35 : 1.0), c.z + rz * off);
  } else G.camera.lookAt(c.x, c.y + 1.3, c.z);
  World.sky.position.copy(cp); World.stars.position.copy(cp);
  G.focusV = G.focusV || new THREE.Vector3();
  G.focus = G.inside ? G.player.pos : G.focusV.set(c.x, c.y, c.z);
}

// ---------- Animals / NPCs / sprinklers ----------
function updateAnimals(dt) {
  const cp = G.camera.position, night = isNightTime();
  for (const A of G.animals) {
    const a = A.d, T_ = ANIMALS[a.type]; A.timer -= dt;
    if (night) {
      // bedtime: chickens roost by the coop, the rest gather under the shade shelter
      if (A.sleepX == null) { A.sleepX = a.type === 'chicken' ? -24 + (Math.random() - 0.5) * 5 : -45 + (Math.random() - 0.5) * 4; A.sleepZ = a.type === 'chicken' ? 16.3 + Math.random() * 1.2 : 37 + (Math.random() - 0.5) * 2.6; }
      const d = Math.hypot(A.sleepX - a.x, A.sleepZ - a.z);
      if (d > 0.4) { A.st = 'walk'; A.tx = A.sleepX; A.tz = A.sleepZ; A.timer = 9; }
      else if (A.st !== 'sleep') { A.st = 'sleep'; A.rot += (Math.random() - 0.5) * 1.5; }
    } else if (A.st === 'sleep') { A.st = 'idle'; A.timer = Math.random() * 3; A.sleepX = null; }
    if (A.st === 'walk') {
      const dx = A.tx - a.x, dz = A.tz - a.z, d = Math.hypot(dx, dz);
      if (d < 0.3 || A.timer <= 0) { A.st = 'idle'; A.timer = 1 + Math.random() * 3; }
      else { A.rot = U.angLerp(A.rot, Math.atan2(dx, dz), Math.min(1, dt * 4)); A.speed = U.lerp(A.speed, T_.speed * (night ? 1.3 : 1), Math.min(1, dt * 3)); }
    } else {
      A.speed = U.lerp(A.speed, 0, Math.min(1, dt * 5));
      if (A.timer <= 0 && A.st !== 'sleep') {
        if (Math.random() < 0.55) { A.st = 'walk'; A.tx = U.clamp(a.x + (Math.random() - 0.5) * 12, PEN.x0 + 1.5, PEN.x1 - 1.5); A.tz = U.clamp(a.z + (Math.random() - 0.5) * 12, PEN.z0 + 2.5, PEN.z1 - 1.5); A.timer = 8; }
        else { A.st = Math.random() < 0.6 ? 'graze' : 'idle'; A.timer = 2 + Math.random() * 4; }
      }
    }
    a.x += Math.sin(A.rot) * A.speed * dt; a.z += Math.cos(A.rot) * A.speed * dt;
    if (!G.driving && !G.inside) {
      const p = G.player.pos, pdx = a.x - p.x, pdz = a.z - p.z, pd = Math.hypot(pdx, pdz), m = T_.r + 0.35;
      if (pd < m && pd > 0.01) { a.x = p.x + pdx / pd * m; a.z = p.z + pdz / pd * m; }
    }
    a.x = U.clamp(a.x, PEN.x0 + 1, PEN.x1 - 1); a.z = U.clamp(a.z, PEN.z0 + 1.6, PEN.z1 - 1);
    A.hop = Math.max(0, (A.hop || 0) - dt);
    const lieY = A.obj.userData.lie ? -A.obj.userData.lie * { chicken: 0.1, cow: 0.45, sheep: 0.3, pig: 0.18 }[a.type] : 0;
    A.obj.position.set(a.x, lieY + (A.hop > 0 ? Math.abs(Math.sin(A.hop * 9)) * 0.22 : 0), a.z); A.obj.rotation.y = A.rot;
    const near = Math.abs(cp.x - a.x) + Math.abs(cp.z - a.z) < 130 * G.view;
    A.obj.visible = near;
    A.heart = Math.max(0, A.heart - dt);
    const mode = A.st === 'sleep' ? 'sleep' : A.heart > 0 ? 'happy' : A.st === 'graze' ? (a.type === 'chicken' ? 'peck' : 'graze') : 'idle';
    if (near) Models.animAnimal(A.obj, dt, A.speed, mode);
    // chicks scurry after their mother
    if (A.chicks) A.chicks.forEach((c, k) => {
      const side = k ? 1 : -1, bx = a.x - Math.sin(A.rot) * (0.45 + k * 0.2) + Math.cos(A.rot) * side * 0.28, bz = a.z - Math.cos(A.rot) * (0.45 + k * 0.2) - Math.sin(A.rot) * side * 0.28;
      const dx = bx - c.x, dz = bz - c.z, d = Math.hypot(dx, dz), sp = d > 0.15 ? Math.min(2.2, d * 3) : 0;
      if (sp > 0) { c.rot = U.angLerp(c.rot, Math.atan2(dx, dz), Math.min(1, dt * 8)); c.x += dx / d * sp * dt; c.z += dz / d * sp * dt; }
      c.obj.position.set(c.x, mode === 'sleep' ? -0.04 : 0, c.z); c.obj.rotation.y = c.rot; c.obj.visible = near;
      if (near) Models.animAnimal(c.obj, dt, sp, sp > 0 ? 'idle' : mode === 'sleep' ? 'sleep' : 'peck');
    });
    const ik = a.prod ? PRODUCTS[T_.prod].i : a.sick ? '🤒' : A.heart > 0 ? '💕' : A.st === 'sleep' ? '💤' : (S.trough <= 0 || a.hungry ? '🌾' : '');
    if (ik !== A.iconKey) { A.iconKey = ik; if (ik) A.icon.material.map = U.emojiTex(ik); A.icon.visible = !!ik; A.icon.material.needsUpdate = true; }
    if (ik) A.icon.position.set(a.x, ANIMAL_Y[a.type] + lieY + Math.sin(G.t * 3 + a.x) * 0.06, a.z);
  }
}
// Route from the villager's sidewalk to their front door. Back-row houses are reached through the gaps
// between front-row buildings, then along a lane behind them, so nobody walks through walls.
const LANES = { left: [-200, -290], right: [-200, -237, -268, -294] };
function homePath(n) {
  const h = n.home, pts = [];
  if (n.circ || (n.x < -12 && n.x > -46 && n.z < -248 && n.z > -282)) pts.push({ x: -14, z: -265 });
  if (h.zone === 'seaside') { const side = h.z < -380 ? -1 : 1; pts.push({ x: h.x, z: -380 + side * 5.8 }); }
  else {
    const sx = h.x < 0 ? -1 : 1;
    if (Math.abs(h.x) > 30) {
      const lanes = LANES[sx < 0 ? 'left' : 'right'], lane = lanes.reduce((a, b) => Math.abs(b - h.z) < Math.abs(a - h.z) ? b : a);
      pts.push({ x: sx * 5.8, z: lane }, { x: sx * 32, z: lane }, { x: sx * 32, z: h.z });
    } else pts.push({ x: sx * 5.8, z: h.z });
  }
  pts.push({ x: h.x, z: h.z });
  return pts;
}
function isNightTime() { return S.time >= 20 * 60 || S.time < 6 * 60; }
function updateNPCs(dt0) {
  const cp = G.camera.position, vis = 110 * G.view, night = isNightTime();
  for (const n of G.npcs) {
    let dt = dt0;
    // daily schedule: walkers head home at 20:00 and come back out at 6:00
    if (n.home) {
      if (night && !n.away && n.st !== 'home') { n.st = 'home'; n.path = homePath(n); n.timer = 120; }
      if (!night && n.away) {
        n.away = false; n.x = n.home.x; n.z = n.home.z; n.st = 'return'; n.timer = 120;
        n.path = homePath(n).reverse().slice(1); if (n.circ) n.path.push({ x: -14, z: -265 }, { x: n.circ.x + n.circ.r, z: n.circ.z });
      }
    }
    const dist = Math.abs(cp.x - n.x) + Math.abs(cp.z - n.z);
    const near = !G.inside && !n.away && dist < vis;
    n.obj.visible = near;
    if (!near) { if (n.st === 'home') n.away = true; if (n.st === 'return') { const l = n.path[n.path.length - 1]; if (l) { n.x = l.x; n.z = l.z; } n.st = 'idle'; } continue; }
    // people far from the camera are updated every other frame with the time added up, so they move at the same speed
    if (dist > 45) { n._acc = (n._acc || 0) + dt; if ((n._odd = !n._odd)) continue; dt = n._acc; n._acc = 0; } else n._acc = 0;
    const sh = G.shadow && dist < 40;
    if (sh !== n.sh) { n.sh = sh; Models.setShadow(n.obj, sh); }
    n.timer -= dt; n.wave = Math.max(0, n.wave - dt);
    let tx = null, tz = null, want = 0;
    if (!n.pace) n.pace = 0.82 + Math.random() * 0.36;
    // someone you are talking to stops, turns to you and only walks on after the conversation closes
    const talking = UI.talkTo === n && UI.isOpen();
    if (talking) { n.dodge = null; n.timer = Math.max(n.timer, 1.5); }
    if (talking) { /* stand still */ }
    else if (n.dodge) {
      n.dodge.t -= dt; tx = n.dodge.x; tz = n.dodge.z; want = 4.2;
      if (n.dodge.t <= 0 || Math.hypot(tx - n.x, tz - n.z) < 0.3) n.dodge = null;
    } else if (n.fixed) {
      if (Math.hypot(n.hx - n.x, n.hz - n.z) > 0.3) { tx = n.hx; tz = n.hz; want = 1.3; }
      else if (n.wave <= 0) n.rot = U.angLerp(n.rot, n.hrot, Math.min(1, dt * 3));
    } else {
      if (n.st === 'idle' && n.timer <= 0) {
        n.st = 'walk'; n.timer = 25;
        if (n.circ) { const a = Math.random() * TAU, r = n.circ.r * (0.7 + Math.random() * 0.5); n.tx = n.circ.x + Math.cos(a) * r; n.tz = n.circ.z + Math.sin(a) * r; }
        else if (Social2.sched(n)) { n.tx = n._sched.x; n.tz = n._sched.z; }
        else if (Fest.on && n.x < 100 && Math.random() < 0.7) { const t = Fest.plazaTarget(); n.tx = t.x; n.tz = t.z; }
        else if (n.line[3]) { n.tx = U.lerp(n.line[1], n.line[2], Math.random()); n.tz = n.line[0] + (Math.random() - 0.5); }
        else { n.tz = U.lerp(n.line[1], n.line[2], Math.random()); n.tx = n.line[0] + (Math.random() - 0.5); }
      }
      if (n.st === 'home' || n.st === 'return') {
        // follow sidewalk waypoints between houses instead of cutting through them
        while (n.path.length && Math.hypot(n.path[0].x - n.x, n.path[0].z - n.z) < 0.5) n.path.shift();
        if (!n.path.length || n.timer <= 0) {
          if (n.st === 'home') { n.away = true; n.obj.visible = false; continue; }
          n.st = 'idle'; n.timer = 1 + Math.random() * 4;
        } else { tx = n.path[0].x; tz = n.path[0].z; want = 1.7; }
      }
      if (n.st === 'walk') {
        const d = Math.hypot(n.tx - n.x, n.tz - n.z);
        if (d < 0.4 || n.timer <= 0) { n.st = 'idle'; n.timer = 2 + Math.random() * 6; }
        else { tx = n.tx; tz = n.tz; want = 1.35 * n.pace; }
      }
    }
    if ((n.wave > 0 && !n.dodge) || talking) want = 0;
    if (tx !== null && want > 0) n.rot = U.angLerp(n.rot, Math.atan2(tx - n.x, tz - n.z), Math.min(1, dt * (n.dodge ? 10 : 5)));
    n.speed = U.lerp(n.speed, want, Math.min(1, dt * (want > n.speed ? 4 : 6)));
    n.x += Math.sin(n.rot) * n.speed * dt; n.z += Math.cos(n.rot) * n.speed * dt;
    // solid world: walls, fences and props push people back; someone stuck against one picks another way
    if (!n.fixed) {
      _np.x = n.x; _np.z = n.z;
      if (Col.push(_np, 0.28)) {
        n.x = _np.x; n.z = _np.z; n.blk = (n.blk || 0) + dt;
        if (n.blk > 1.2) { n.blk = 0; if ((n.st === 'home' || n.st === 'return') && n.path && n.path.length > 1) n.path.shift(); else if (n.st === 'walk') { n.st = 'idle'; n.timer = 0.3; } else n.dodge = { x: n.x + (Math.random() - 0.5) * 3, z: n.z + (Math.random() - 0.5) * 3, t: 1 }; }
      } else n.blk = 0;
    }
    { const fd = Math.hypot(n.x + 28, n.z + 265); if (fd < 3.6 && fd > 0.01) { n.x = -28 + (n.x + 28) / fd * 3.6; n.z = -265 + (n.z + 265) / fd * 3.6; } }
    if ((n.wave > 0 && !n.dodge) || talking) { const p = G.player.pos; n.rot = U.angLerp(n.rot, Math.atan2(p.x - n.x, p.z - n.z), Math.min(1, dt * 6)); }
    n.obj.position.set(n.x, World.groundY(n.x, n.z), n.z); n.obj.rotation.y = n.rot;
    Models.animHuman(n.obj, dt, n.speed, n.wave > 0 ? { type: 'wave', t: 1.5 - n.wave, dur: 1.5 } : null);
  }
  separatePeople(dt0);
}
const _np = { x: 0, z: 0 };
// people never stand inside each other or inside you: push overlapping pairs apart (the one you talk to holds still)
function separatePeople() {
  const L = G.npcs.filter(n => n.obj.visible), P = G.player.pos, me = !G.inside && !G.driving;
  for (let i = 0; i < L.length; i++) {
    const a = L[i];
    for (let j = i + 1; j < L.length; j++) {
      const b = L[j], dx = b.x - a.x, dz = b.z - a.z; if (Math.abs(dx) > 0.7 || Math.abs(dz) > 0.7) continue;
      const d = Math.hypot(dx, dz) || 0.01, o = 0.62 - d; if (o <= 0) continue;
      const ux = d > 0.011 ? dx / d : Math.random() - 0.5, uz = d > 0.011 ? dz / d : Math.random() - 0.5;
      const ka = a.fixed || UI.talkTo === a ? 0 : b.fixed || UI.talkTo === b ? 1 : 0.5, kb = 1 - ka;
      a.x -= ux * o * ka; a.z -= uz * o * ka; b.x += ux * o * kb; b.z += uz * o * kb;
      a.obj.position.x = a.x; a.obj.position.z = a.z; b.obj.position.x = b.x; b.obj.position.z = b.z;
    }
    if (me) {
      const dx = P.x - a.x, dz = P.z - a.z, d = Math.hypot(dx, dz), m = 0.62;
      if (d < m && d > 0.001) { P.x = a.x + dx / d * m; P.z = a.z + dz / d * m; }
    }
  }
}
function updateSprinklers(dt) {
  const cp = G.camera.position;
  for (const s of G.spr) {
    if (s.spray <= 0) continue;
    s.spray -= dt; s.head.rotation.y += dt * 5;
    if (Math.abs(cp.x - s.d.x) + Math.abs(cp.z - s.d.z) > 70 || G.inside) continue;
    const r = TOOLS[s.d.pro ? 'sprinkler_pro' : 'sprinkler'].r;
    for (let k = 0; k < 4; k++) {
      const a = s.head.rotation.y + (k % 2) * Math.PI + (Math.random() - 0.5) * 0.3, v = r * (0.4 + Math.random() * 0.6) / 0.85;
      FX.spawn(s.d.x, 0.68, s.d.z, Math.cos(a) * v, 2.6 + Math.random(), Math.sin(a) * v, 0.85, WATER_C, 9);
    }
  }
  if (World.fountain && !G.inside) {
    const f = World.fountain;
    if (Math.abs(cp.x - f.x) + Math.abs(cp.z - f.z) < 90) for (let k = 0; k < 3; k++) { const a = Math.random() * TAU; FX.spawn(f.x, 2.5, f.z, Math.cos(a) * 0.9, 2.2 + Math.random() * 0.6, Math.sin(a) * 0.9, 1.0, WATER_C, 7); }
  }
}
function updatePlotsAnim(dt) {
  if (G.inside) return;
  for (let i = 0, n = G.plots.length + G.trees.length; i < n; i++) {
    const o = i < G.plots.length ? G.plots[i] : G.trees[i - G.plots.length];
    if (o.crop && o.pop < 1) { o.pop = Math.min(1, o.pop + dt * 2.2); const s = 1 + Math.sin(o.pop * Math.PI) * 0.15 * (1 - o.pop) + (o.pop - 1) * 0.4; o.crop.scale.setScalar(Math.max(0.5, s)); }
    if (o.drop.visible) o.drop.position.y = (o.drop.position.y > 1.5 ? 1.6 : 1.05) + Math.sin(G.t * 3) * 0.05;
  }
}

// ---------- Interaction ----------
function firstSeed(tree) { for (const id in S.inv) if (id.startsWith('seed_') && !!CROPS[id.slice(5)].tree === tree && S.inv[id] > 0) return id.slice(5); return null; }
function findTarget() {
  const P = G.player, p = P.pos;
  if (G.driving) return null;
  let best = null, bd = 1e9;
  const consider = (t, d) => { if (d < bd) { bd = d; best = t; } };
  if (G.inside) {
    for (const poi of World.inPois) { const d = Math.hypot(p.x - poi.x, p.z - poi.z); if (d < poi.r) consider({ kind: 'poi', poi }, d); }
    if (Pet.obj) { const d = Math.hypot(p.x - Pet.x, p.z - Pet.z); if (d < 1.4) consider({ kind: 'pet' }, d + 0.1); }
    Social.familyTargets(consider, p);
    return best;
  }
  const fx = Math.sin(P.rot), fz = Math.cos(P.rot), px = p.x + fx * 1.0, pz = p.z + fz * 1.0;
  if (Math.abs(p.x - 9) < 14 && Math.abs(p.z + 4) < 12) {
    for (let i = 0; i < 30; i++) { if (!plotUnlocked(i, S.up.field)) continue; const c = plotCenter(i), d = Math.hypot(px - c.x, pz - c.z); if (d < 1.25) consider({ kind: 'plot', i }, d - 0.5); }
    const sel = G.sel;
    if (sel === 'sprinkler' || sel === 'sprinkler_pro') {
      const c = nearestCorner(px, pz);
      if (c && Math.hypot(px - c.x, pz - c.z) < 1.7) consider({ kind: 'place', c }, -1);
    } else for (const s of G.spr) { const d = Math.hypot(px - s.d.x, pz - s.d.z); if (d < 0.75) consider({ kind: 'spr', s }, d - 0.4); }
  }
  if (S.up.orchard) for (let i = 0; i < 6; i++) { const c = orchardSpot(i), d = Math.hypot(px - c.x, pz - c.z); if (d < 1.9) consider({ kind: 'tree', i }, d - 0.4); }
  for (const A of G.animals) { const d = Math.hypot(p.x - A.d.x, p.z - A.d.z); if (d < ANIMALS[A.d.type].r + 1.3) consider({ kind: 'animal', A }, d); }
  for (const c of G.cars) { const d = Math.hypot(p.x - c.d.x, p.z - c.d.z); if (d < 3.4) consider({ kind: 'car', car: c }, d + 0.5); }
  for (const poi of World.pois) { if (poi.fest && !Fest.on) continue; const d = Math.hypot(p.x - poi.x, p.z - poi.z); if (d < poi.r) consider({ kind: 'poi', poi }, d); }
  if (Pet.obj && !G.driving) { const d = Math.hypot(p.x - Pet.x, p.z - Pet.z); if (d < 1.6) consider({ kind: 'pet' }, d + 0.2); }
  for (const n of G.npcs) { if (n.away) continue; const d = Math.hypot(p.x - n.x, p.z - n.z); if (d < 2.0) consider({ kind: 'npc', n }, d + 0.3); }
  for (const f of G.targetHooks || []) f(consider, p, px, pz);
  return best;
}
function describe(t) {
  if (!t) {
    if (G.sel.startsWith('seed_') || G.sel === 'can' || G.sel === 'fert') return null;
    return null;
  }
  const sel = G.sel;
  switch (t.kind) {
    case 'ext': return t.act();
    case 'plot': return plotAct(t.i);
    case 'tree': return treeAct(t.i);
    case 'place': {
      const occ = G.spr.some(s => Math.hypot(s.d.x - t.c.x, s.d.z - t.c.z) < 0.5);
      if (occ) return { icon: '⛔', label: 'มีสปริงเกอร์ตรงนี้แล้ว' };
      return { icon: ITEMS[sel].i, label: 'วาง' + ITEMS[sel].n, fn: () => placeSprinkler(t.c, sel === 'sprinkler_pro') };
    }
    case 'spr': return { icon: '🧰', label: 'เก็บสปริงเกอร์', fn: () => pickSprinkler(t.s) };
    case 'animal': {
      const a = t.A.d, T_ = ANIMALS[a.type];
      if (a.prod) return { icon: PRODUCTS[T_.prod].i, label: `เก็บ${PRODUCTS[T_.prod].n}จาก${a.name}`, fn: () => collectAnimal(t.A) };
      if (!a.petted) return { icon: '🤚', label: `ลูบหัว${T_.n} "${a.name}"`, fn: () => petAnimal(t.A) };
      return { icon: '💕', label: `${a.name} ความสุข ${Math.round(a.happy ?? 50)}%`, fn: () => UI.toast(typeof Animal40 !== 'undefined' ? Animal40.stateText(a) : S.trough > 0 ? `${a.name} อิ่มแล้ว พรุ่งนี้เช้าจะมี${PRODUCTS[T_.prod].n}ให้` : 'รางอาหารว่าง! เติมอาหารสัตว์ก่อนนะ', T_.i) };
    }
    case 'car': return { icon: CARS[t.car.d.type].i, label: 'ขึ้นรถ ' + CARS[t.car.d.type].n, fn: () => enterCar(t.car) };
    case 'pet': return { icon: PETS[S.pet.type].i, label: `ลูบหัว${S.pet.name}`, fn: () => Pet.pet() };
    case 'npc': return { icon: '💬', label: t.n.keeper ? `คุยกับ${t.n.name} (คนขายของ)` : 'คุยกับ' + t.n.name, fn: () => talk(t.n) };
    case 'poi': return poiAct(t.poi);
  }
  return null;
}
function plotAct(i) {
  const p = S.plots[i], sel = G.sel, st = stageOf(p);
  if (st === 3) return { icon: CROPS[p.c].i, label: 'เก็บเกี่ยว' + CROPS[p.c].n, fn: () => harvest(i) };
  if (sel.startsWith('seed_') && !p.c) {
    const c = sel.slice(5); if (CROPS[c].tree) return { icon: '🌳', label: 'ต้นกล้าต้องปลูกในสวนผลไม้' };
    return { icon: CROPS[c].i, label: 'ปลูก' + CROPS[c].n, fn: () => plant(i, c) };
  }
  if ((sel === 'fert' || sel === 'compost') && p.c && !p.f) return { icon: '🧪', label: 'ใส่ปุ๋ยเร่งโต', fn: () => fertilize(S.plots[i], i) };
  if ((p.c && p.w < 0.6) || (sel === 'can' && p.w < 0.6)) {
    if (S.can.water <= 0) return { icon: '🪣', label: 'บัวรดน้ำว่าง ไปเติมที่บ่อน้ำ' };
    return { icon: '🚿', label: 'รดน้ำ', fn: () => waterPlot(i) };
  }
  if (!p.c) {
    const c = firstSeed(false);
    if (c) return { icon: CROPS[c].i, label: 'ปลูก' + CROPS[c].n, fn: () => plant(i, c) };
    return { icon: '🌱', label: 'ไม่มีเมล็ดพันธุ์ ซื้อได้ที่ร้านเกษตร' };
  }
  const C = CROPS[p.c], pct = Math.floor(p.g / C.grow * 100);
  return { icon: '⏳', label: `${C.n} โตแล้ว ${pct}%${p.f ? ' 🧪' : ''}`, info: true };
}
function treeAct(i) {
  const p = S.trees[i], sel = G.sel, st = stageOf(p);
  if (st === 3) return { icon: CROPS[p.c].i, label: 'เก็บ' + CROPS[p.c].n, fn: () => harvestTree(i) };
  if (!p.c) {
    const c = sel.startsWith('seed_') && CROPS[sel.slice(5)].tree ? sel.slice(5) : firstSeed(true);
    if (c) return { icon: '🌱', label: 'ปลูกต้น' + CROPS[c].n, fn: () => plantTree(i, c) };
    return { icon: '🌳', label: 'หลุมปลูกไม้ผล ซื้อต้นกล้าที่เมืองริมทะเล' };
  }
  if (sel === 'fert' && !p.f) return { icon: '🧪', label: 'ใส่ปุ๋ยเร่งโต', fn: () => fertilize(p) };
  if (p.w < 0.6) { if (S.can.water <= 0) return { icon: '🪣', label: 'บัวรดน้ำว่าง ไปเติมที่บ่อน้ำ' }; return { icon: '🚿', label: 'รดน้ำต้น' + CROPS[p.c].n, fn: () => waterTree(i) }; }
  return { icon: '⏳', label: `ต้น${CROPS[p.c].n} โต ${Math.floor(p.g / CROPS[p.c].grow * 100)}%`, info: true };
}
function poiAct(poi) {
  switch (poi.kind) {
    case 'act': return poi.room ? Rooms.entrance(poi) : poi.act();
    case 'shop': if (poi.room) return Rooms.entrance(poi); return { icon: poi.icon, label: 'เข้าร้าน ' + poi.label, fn: () => UI.shop(poi.id) };
    case 'market': return { icon: '💰', label: 'ขายของที่ตลาด (+50%)', fn: () => UI.sell(1.5, 'ตลาดริมทะเล') };
    case 'bin': return { icon: '📦', label: 'ส่งขายผลผลิต', fn: () => UI.sell(1, 'กล่องส่งขาย') };
    case 'machine': return Craft.describe(poi.m);
    case 'workbench': return { icon: '🔨', label: 'โต๊ะช่าง', fn: () => UI.craft() };
    case 'mine': return { icon: '⛏️', label: 'เข้าเหมือง', fn: () => UI.mine() };
    case 'rock': return { icon: poi.icon, label: S.up.pick ? 'ขุด' + poi.label : 'ต้องมีจอบขุดแร่', fn: () => Mine.hit(poi.rock) };
    case 'mineup': return { icon: '🪜', label: 'ขึ้นจากเหมือง', fn: () => Mine.leave() };
    case 'minedown': return { icon: '⬇️', label: poi.label, fn: () => Mine.enter(Mine.floor + 1) };
    case 'bus': return { icon: '🚌', label: 'ขึ้นรถสองแถว (20 ฿)', fn: () => UI.bus() };
    case 'vmarket': return { icon: '🧺', label: 'ขายของที่ตลาดนัดชุมชน (+20%)', fn: () => UI.sell(1.2, 'ตลาดนัดชุมชน') };
    case 'fstall': return Fest.today() ? { icon: '🎪', label: 'ซุ้มของใน' + Fest.today().n, fn: () => UI.shop(Fest.today().shop) } : null;
    case 'contest': return { icon: '🏆', label: S.contestDay === S.day ? 'ส่งประกวดไปแล้ววันนี้' : 'ส่งผลผลิตเข้าประกวด', fn: () => UI.contest() };
    case 'fish': if (Fest.on && season().id === 'cool' && count('krathong') && G.night > 0.4) return { icon: '🪷', label: 'ลอยกระทง', fn: () => Fest.floatMine('sea') };
      return { icon: '🎣', label: S.up.rod ? 'ตกปลาทะเล' : 'จุดตกปลา (ต้องมีคันเบ็ด)', fn: () => Fish.start('sea') };
    case 'pond': if (Fest.on && season().id === 'cool' && count('krathong') && G.night > 0.4) return { icon: '🪷', label: 'ลอยกระทง', fn: () => Fest.floatMine('fresh') };
      if (G.sel === 'rod') return { icon: '🎣', label: 'ตกปลาน้ำจืด', fn: () => Fish.start('fresh') };
    // falls through
    case 'well':
      if (S.can.water >= CAN_CAP[S.up.can - 1]) return { icon: '💧', label: 'บัวรดน้ำเต็มแล้ว', info: true };
      return { icon: '💧', label: 'เติมน้ำใส่บัวรดน้ำ', fn: refillCan };
    case 'trough': return { icon: '🌾', label: `เติมอาหารสัตว์ (ในราง ${S.trough})`, fn: fillTrough };
    case 'door': return { icon: '🚪', label: 'เข้าบ้าน', fn: enterHouse };
    case 'exit': return { icon: '🚪', label: 'ออกจากบ้าน', fn: exitHouse };
    case 'bed': return { icon: '🛏️', label: 'นอนหลับถึงเช้า', fn: () => UI.confirm('นอนหลับถึงเช้า?', 'พลังงานจะเต็ม และเกมจะบันทึกอัตโนมัติ', 'นอนเลย', () => sleep(false)) };
    case 'kitchen': return { icon: '🍳', label: 'ทำอาหาร', fn: () => UI.cook() };
    case 'fridge': return { icon: '🧊', label: 'เปิดตู้เย็น (กินของ)', fn: () => UI.inventory('food') };
    case 'tv': return { icon: '📺', label: 'ดูทีวี (ข่าว รายการอาหาร ละคร กีฬา)', fn: () => Home.tv() };
    case 'tv_old': return { icon: '📺', label: 'ดูพยากรณ์และราคาตลาด', fn: () => { const n = WEATHER[S.weather.next]; UI.toast(`พยากรณ์พรุ่งนี้: ${n.n}`, n.i); const h = hotCrops()[0]; UI.toast(`ราคาเด่นวันนี้: ${ITEMS[h].n} ${priceOf(h)} ฿`, '📈'); } };
    case 'board': return { icon: '📋', label: `กระดานรับออเดอร์ (${S.orders.length})`, fn: () => UI.board() };
    case 'wardrobe': return { icon: '👕', label: 'ตู้เสื้อผ้า: แต่งตัว / ตั้งชื่อ', fn: () => UI.look(false) };
    case 'chest': return { icon: '🧰', label: 'หีบเก็บของ', fn: () => UI.chest() };
    case 'shower': return { icon: '🚿', label: S.daily.shower ? 'อาบน้ำแล้ววันนี้' : 'อาบน้ำ (+30 พลังงาน)', fn: takeShower };
    case 'computer': return { icon: '💻', label: 'ช้อปออนไลน์ สั่งได้ทุกอย่าง ส่งถึงบ้าน', fn: () => (window.Mall36 ? Mall36.open() : UI.shop('online')) };
    case 'calendar': return { icon: '📅', label: 'ดูปฏิทิน', fn: () => UI.calendar() };
    case 'piano': return { icon: '🎹', label: 'เล่นเปียโน', fn: () => { Sfx.piano(); playAct('fill', 1.6); } };
  }
  return null;
}
function doAction() {
  if (!G.started || G.paused || UI.isOpen()) return;
  if (G.driving) { const d = G.curAct; if (d && d.fn && G.target && G.target.drive) { d.fn(); Sfx.click(); G.tgtT = 0; } return; }
  if (Fish.st) { Fish.holding = true; Fish.press(); return; }
  if (Move.k) { Move.place(); return; }
  const d = G.curAct;
  if (d && d.fn) { d.fn(); Sfx.click(); G.tgtT = 0; }
  else if (d && d.label) { UI.toast(d.label, d.icon); }
}
function updateTarget() {
  const t = findTarget(); G.target = t;
  const d = describe(t); G.curAct = d;
  UI.action(d);
  const sr = G.selRing;
  if (t && (t.kind === 'plot' || t.kind === 'tree')) { const c = t.kind === 'plot' ? plotCenter(t.i) : orchardSpot(t.i); sr.position.set(c.x, 0.22, c.z); sr.scale.setScalar(t.kind === 'tree' ? 1.2 : 1); sr.visible = true; }
  else sr.visible = false;
  const placing = t && t.kind === 'place';
  G.ghost.visible = !!placing;
  if (placing) { G.ghost.position.set(t.c.x, 0, t.c.z); const r = TOOLS[G.sel].r; G.ghost.ring.scale.setScalar(r); }
}

// actions
function harvest(i) {
  if (!useEnergy(1)) return;
  if (S.f2 && S.f2.pests) delete S.f2.pests[i]; // the next crop on this plot starts free of pests
  const p = S.plots[i], C = CROPS[p.c]; let n = C.yield || 1;
  if (S.up.soil >= 2 && Math.random() < (S.up.soil - 1) * 0.2) n++;
  const q = rollQuality(p); addItem(qid(p.c, q), n); S.stats.harvest += n; Prog.add(3 + C.grow * 0.4);
  UI.toast(`เก็บเกี่ยว ${C.n}${STARS[q]} +${n}`, C.i);
  const pc = plotCenter(i); FX.burst(pc.x, 0.5, pc.z, 16, new THREE.Color(0.5, 0.85, 0.3), 2.5);
  p.dry = 0; if (C.regrow) p.g = C.grow - C.regrow; else { p.c = null; p.g = 0; p.f = 0; }
  playAct('harvest', 0.7); Sfx.pop(); refreshPlot(i);
}
function plant(i, c) {
  if (!count('seed_' + c)) return;
  if (!useEnergy(1)) return;
  takeItem('seed_' + c); const p = S.plots[i]; p.c = c; p.g = 0; p.f = 0; p.dry = 0; S.stats.planted++; Prog.add(1);
  playAct('plant', 0.6); Sfx.plant(); refreshPlot(i);
  const pc = plotCenter(i); FX.burst(pc.x, 0.3, pc.z, 8, new THREE.Color(0.35, 0.22, 0.12), 1.4);
  if (!S.tips.water) { S.tips.water = 1; UI.toast('ปลูกแล้ว! อย่าลืมรดน้ำ ผักจะโตเฉพาะตอนดินชื้น', '💡'); }
}
function waterTargets(i) {
  const lvl = S.up.can, c = i % 6, r = (i / 6) | 0, out = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (lvl === 1 && (dr || dc)) continue;
    if (lvl === 2 && dr) continue;
    const cc = c + dc, rr = r + dr; if (cc < 0 || cc > 5 || rr < 0 || rr > 4) continue;
    const k = rr * 6 + cc; if (plotUnlocked(k, S.up.field)) out.push(k);
  }
  return out;
}
function waterPlot(i) {
  if (!useEnergy(1)) return;
  S.can.water--; for (const k of waterTargets(i)) { S.plots[k].w = 1; refreshPlot(k); }
  S.stats.watered++; Prog.add(1); playAct('water', 1.0); Sfx.water();
}
function waterTree(i) { if (!useEnergy(1)) return; S.can.water--; S.trees[i].w = 1; S.stats.watered++; playAct('water', 1.0); Sfx.water(); refreshTree(i); }
function fertilize(p, i) { if (!takeItem(G.sel === 'compost' && count('compost') ? 'compost' : 'fert')) return; p.f = 1; playAct('plant', 0.6); Sfx.plant(); UI.toast('ใส่ปุ๋ยแล้ว โตเร็วขึ้น 50%', '🧪'); if (i != null) refreshPlot(i); }
function plantTree(i, c) {
  if (!takeItem('seed_' + c)) return; if (!useEnergy(2)) { addItem('seed_' + c); return; }
  const p = S.trees[i]; p.c = c; p.g = 0; p.f = 0; S.stats.planted++; playAct('plant', 0.7); Sfx.plant(); refreshTree(i);
}
function harvestTree(i) {
  if (!useEnergy(1)) return;
  const p = S.trees[i], C = CROPS[p.c], n = C.yield + (Math.random() < 0.3 ? 1 : 0);
  const q = rollQuality(p); addItem(qid(p.c, q), n); S.stats.harvest += n; p.g = C.grow - C.regrow; p.dry = 0; Prog.add(8);
  UI.toast(`เก็บ${C.n}${STARS[q]} +${n}`, C.i); playAct('harvest', 0.7); Sfx.pop(); refreshTree(i);
  const s = orchardSpot(i); FX.burst(s.x, 2, s.z, 18, new THREE.Color(1, 0.7, 0.2), 3);
}
function refillCan() { S.can.water = CAN_CAP[S.up.can - 1]; playAct('fill', 0.8); Sfx.water(); UI.toast('เติมน้ำเต็มบัวแล้ว', '💧'); }
function fillTrough() {
  const cap = BARN_CAP[S.up.barn - 1] * 6, need = Math.max(0, cap - S.trough);   // 6 bags per pen slot: a cow eats 3 bags a day
  if (!need) { UI.toast('รางอาหารเต็มแล้ว', '🌾'); return; }
  const n = Math.min(need, count('feed'));
  if (!n) { UI.toast('ไม่มีอาหารสัตว์ ซื้อได้ที่ร้านเกษตรหรือฟาร์มปศุสัตว์', '🌾'); Sfx.error(); return; }
  takeItem('feed', n); S.trough += n; S.stats.fed++; playAct('fill', 0.8); Sfx.plant();
  UI.toast(`เติมอาหาร ${n} ถุง (ในราง ${S.trough})`, '🌾');
}
function placeSprinkler(c, pro) {
  const id = pro ? 'sprinkler_pro' : 'sprinkler'; if (!takeItem(id)) return;
  const s = { x: c.x, z: c.z, pro: !!pro }; S.sprinklers.push(s); const o = addSprinklerObj(s);
  runSprinklers(false); o.spray = 4; G.plots.forEach((_, i) => refreshPlot(i));
  playAct('plant', 0.6); Sfx.plant(); UI.toast('วางสปริงเกอร์แล้ว จะรดน้ำเองทุก 6:00 และ 15:00', '💦');
}
function pickSprinkler(o) {
  S.sprinklers.splice(S.sprinklers.indexOf(o.d), 1); G.spr.splice(G.spr.indexOf(o), 1); World.dyn.remove(o.g);
  addItem(o.d.pro ? 'sprinkler_pro' : 'sprinkler'); playAct('plant', 0.5); UI.toast('เก็บสปริงเกอร์เข้ากระเป๋า', '🧰');
}
function collectAnimal(A) {
  if (typeof Animal40 !== 'undefined' && Animal40.collect) return Animal40.collect(A);
  const a = A.d, prod = ANIMALS[a.type].prod, n = (a.happy ?? 50) >= 80 ? 2 : 1;
  a.prod = false; addItem(prod, n); S.stats.products += n; Prog.add(6); playAct('collect', 0.6); Sfx.pop();
  UI.toast(`ได้${PRODUCTS[prod].n} +${n}`, PRODUCTS[prod].i); animalSound(a.type);
}
function petAnimal(A) { const a = A.d; a.petted = true; a.happy = Math.min(100, (a.happy ?? 50) + 8); A.heart = 2.5; A.hop = 1.2; playAct('pet', 0.8); animalSound(a.type); UI.toast(`${a.name} มีความสุข ${Math.round(a.happy)}%`, '💕'); }
function animalSound(t) { ({ chicken: () => Sfx.cluck(), cow: () => Sfx.moo(), sheep: () => Sfx.baa(), pig: () => Sfx.oink() })[t](); }
function talk(n) { n.wave = 1.5; Friends.talk(n); UI.talk(n); }

function hotCrops() { return Object.keys(CROPS).filter(k => !CROPS[k].tree).sort((a, b) => priceMult(b) - priceMult(a)).slice(0, 3); }

// ---------- Character look ----------
const DEFAULT_LOOK = { skin: 1, hair: 1, style: 0, shirt: 0, pants: 0, hat: 0, ov: 0 };
function lookOpts(l) {
  const st = LOOK.style[l.style][0], hat = LOOK.hat[l.hat][0];
  return {
    skin: LOOK.skin[l.skin], hair: LOOK.hair[l.hair], shirt: LOOK.shirt[l.shirt], pants: LOOK.pants[l.pants],
    overalls: LOOK.ov[l.ov][0] === 'overalls' ? LOOK.pants[l.pants] : null, long: st === 'long', bun: st === 'bun',
    hat: hat === 'none' ? null : hat, capColor: LOOK.shirt[(l.shirt + 3) % LOOK.shirt.length], shoe: 0x5a3a22, avatar: l.avatar || null,
  };
}
function rebuildPlayer() {
  const old = G.player.obj, nw = Models.human(lookOpts(S.look || DEFAULT_LOOK));
  nw.position.copy(old.position); nw.rotation.copy(old.rotation); nw.visible = old.visible;
  G.scene.remove(old); G.scene.add(nw);
  nw.userData.elR.add(G.player.can); if (Fish.rod) nw.userData.elR.add(Fish.rod); if (Mine.pick) nw.userData.elR.add(Mine.pick);
  G.player.obj = nw; Wear.apply(nw);
}

// ---------- Furniture moving: the piece is carried in front of the player, snapped to a 25 cm grid ----------
const Move = {
  k: null, r: 0, x: 0, z: 0,
  start(k) {
    if (!G.inside) { UI.toast('ย้ายเฟอร์นิเจอร์ได้ตอนอยู่ในบ้าน', '🏠'); return; }
    UI.close(); this.k = k;
    World.buildInterior(S.up.house, S, k); World.interior.visible = true;
    this.r = World.furnObjs[k].obj.rotation.y;
    document.getElementById('moveUI').hidden = false;
    document.getElementById('moveName').textContent = 'กำลังย้าย: ' + furnInfo(k).n;
    UI.buttons();
  },
  update() {
    if (!this.k) return;
    const o = World.furnObjs[this.k]; if (!o) return;
    const P = G.player, r = World.room, snap = v => Math.round(v * 4) / 4;
    const dp = window.Drag89 ? Drag89.pos(P.pos.x + Math.sin(P.rot) * 1.6, P.pos.z + Math.cos(P.rot) * 1.6) : { x: P.pos.x + Math.sin(P.rot) * 1.6, z: P.pos.z + Math.cos(P.rot) * 1.6 };
    this.x = U.clamp(snap(dp.x - IN.x), -r.w / 2 + 0.45, r.w / 2 - 0.45);
    this.z = U.clamp(snap(dp.z - IN.z), -r.d / 2 + 0.45, r.d / 2 - 0.45);
    o.obj.position.set(this.x, 0.03 + Math.sin(G.t * 6) * 0.02, this.z); o.obj.rotation.y = this.r;
  },
  rotate() { this.r = (this.r + Math.PI / 2) % TAU; Sfx.click(); },
  place() { S.decor.pos[this.k] = { x: this.x, z: this.z, r: this.r }; UI.toast('วาง' + furnInfo(this.k).n + 'แล้ว', furnInfo(this.k).i); Sfx.plant(); this.done(); saveGame(true); },
  cancel() { this.done(); },
  done() { this.k = null; document.getElementById('moveUI').hidden = true; World.buildInterior(S.up.house, S); World.interior.visible = G.inside; UI.buttons(); },
};

// ---------- House / sleep ----------
function leaveIndoors() { if (G.inRoom && typeof Rooms !== 'undefined') Rooms.leave(true); if (G.inMine) Mine.leave(true); if (G.inside) setInside(false); }
function fade(fn) {
  const f = document.getElementById('fade'); f.classList.add('on'); G.paused = true;
  // an error inside the callback must never leave the screen black and the game paused
  setTimeout(() => { try { fn(); } catch (e) { console.warn('fade', e); } finally { setTimeout(() => { f.classList.remove('on'); G.paused = false; }, 120); } }, 420);
}
function setInside(v, instant) {
  if (Fish.st) Fish.end();
  if (Move.k && !v) Move.cancel();
  G.inside = v;
  World.outdoor.visible = !v; World.interior.visible = v; World.sky.visible = !v; World.stars.visible = !v;
  G.scene.background = v ? new THREE.Color(0x2a2420) : null;
  if (v) {
    const r = World.room; G.player.pos.set(IN.x, IN.y, IN.z + r.d / 2 - 1.3); G.player.rot = Math.PI;
    G.cam.yaw = 0; G.cam.pitch = 0.8; G.cam.dist = Math.min(G.cam.dist, 8);
  }
  snapCam();
  UI.buttons();
}
function snapCam() { const p = G.player.pos; G.cam.x = p.x; G.cam.y = p.y; G.cam.z = p.z; }
function enterHouse() { Sfx.door(); fade(() => setInside(true)); }
function exitHouse() {
  Sfx.door();
  fade(() => {
    setInside(false); const d = World.houseDoor; G.player.pos.set(d.x, World.groundY(d.x, d.z), d.z); G.player.rot = 0; G.cam.yaw = Math.PI; G.cam.pitch = 0.4; snapCam();
  });
}
function sleep(forced) {
  fade(() => {
    let mins = (360 - S.time + 1440) % 1440; if (mins === 0) mins = 1440;
    Emergency.overnight();
    simulate(mins);
    const W = WEATHER[S.weather.type]; Object.assign(G.wx, { cloud: W.cloud, rain: W.rain, fog: W.fog, wind: W.wind, storm: W.storm || 0 });
    S.energy = forced ? Math.round(maxEnergy() * 0.5) : maxEnergy();
    if (G.inMine) Mine.leave(true);
    Rooms.leave(true); Town2.leaveAway(true);
    if (!G.inside) setInside(true);
    const r = World.room; G.player.pos.set(IN.x - r.w / 2 + 1.25, IN.y, IN.z - r.d / 2 + 3.2); G.player.rot = 0; snapCam();
    G.plots.forEach((_, i) => refreshPlot(i)); G.trees.forEach((_, i) => refreshTree(i));
    saveGame(true);
    const m = G.morning || { prod: 0, hungry: 0 };
    UI.toast(`${forced ? 'เผลอหลับไปเพราะดึกมาก... ' : ''}เช้า${RD(S.day)} อากาศ: ${W.n}`, W.i);
    if (m.prod) UI.toast(`สัตว์ให้ผลผลิต ${m.prod} ตัว ไปเก็บที่คอกได้เลย`, '🥚');
    if (m.hungry) UI.toast(`สัตว์หิว ${m.hungry} ตัว อย่าลืมเติมอาหารในราง`, '🌾');
    if (G.newSeason) { G.newSeason = false; const se = season(); UI.toast(`เข้าสู่${se.n}! ผักตามฤดูโตไวขึ้น: ${Object.keys(CROP_SEASON).filter(k => CROP_SEASON[k] === se.id).map(k => CROPS[k].i).join(' ')}`, se.i); }
    G.morning = null;
  });
}

// ---------- Purchases with world effects ----------
function applyUpgrade(id) {
  if (id === 'house') { World.buildHouse(S.up.house); World.buildInterior(S.up.house, S); if (G.inside && !G.inRoom) setInside(true); S.energy = Math.min(S.energy + 25, maxEnergy()); }
  if (id === 'field' || id === 'soil' || id === 'orchard') refreshField();
  if (id === 'can') S.can.water = CAN_CAP[S.up.can - 1];
}
function buyAnimal(type) {
  const a = { type, name: ANIMAL_NAMES[(S.animals.length * 7 + Math.floor(Math.random() * 16)) % ANIMAL_NAMES.length], happy: 50, prod: false, petted: false };
  S.animals.push(a); addAnimalObj(a);
}
function buyCar(type, where) {
  const spots = where === 'seaside' ? [[298, -377.8, -Math.PI / 2], [312, -377.8, -Math.PI / 2]] : [[2.2, -238, Math.PI], [2.2, -247, Math.PI]];
  const sp = spots[G.cars.length % spots.length];
  const c = { type, x: sp[0], z: sp[1], r: sp[2] }; S.cars.push(c); addCarObj(c); if (typeof Life2 !== 'undefined' && G.started) Life2.note('ซื้อรถใหม่: ' + CARS[type].n + ' 🚗');
}

// ---------- Quality governor: watches FPS and trades sharpness/shadows/view distance for smoothness ----------
const Perf = {
  acc: 0, n: 0, slow: 0, fast: 0, auto: true, told: false, cullT: 0,
  init() { this.auto = safeGet(Q_KEY + '_auto') !== '0'; G.pr = G.Q.pr; G.shadow = G.Q.shadow > 0; G.view = G.Q.lvl === 'low' ? 0.6 : G.Q.lvl === 'med' ? 0.8 : G.Q.lvl === 'ultra' ? 1.35 : 1; if (G.Q.lvl === 'ultra') this.auto = false; },
  frame(dt) {
    this.cullT -= dt;
    if (this.cullT <= 0 && !G.inside) { this.cullT = 0.25; const c = G.camera.position; World.cullUpdate(c.x, c.z, G.view); }
    if (!G.started || G.paused || UI.isOpen() || document.hidden || dt >= 0.05) { this.acc = 0; this.n = 0; return; }
    this.acc += dt; this.n++;
    if (this.acc < 2) return;
    const fps = this.n / this.acc; this.acc = 0; this.n = 0; G.fps = fps;
    if (!this.auto) return;
    if (fps < 50) { this.fast = 0; if (++this.slow >= 2) { this.slow = 0; this.down(); } }
    else if (fps > 58) { this.slow = 0; if (++this.fast >= 8) { this.fast = 0; this.up(); } }
    else { this.slow = 0; this.fast = 0; }
  },
  down() {
    if (Gfx.drop()) { if (!this.told) { this.told = true; UI.toast('ปรับกราฟิกอัตโนมัติให้เล่นลื่นขึ้น', '⚙️'); } return; }
    if (G.pr > 0.76) this.setPr(Math.max(0.75, G.pr - 0.25));
    else if (G.shadow) this.setShadow(false);
    else if (G.view > 0.5) G.view = Math.max(0.5, G.view - 0.15);
    else return;
    if (!this.told) { this.told = true; UI.toast('ปรับกราฟิกอัตโนมัติให้เล่นลื่นขึ้น', '⚙️'); }
  },
  up() {
    const maxView = G.Q.lvl === 'low' ? 0.6 : G.Q.lvl === 'med' ? 0.8 : 1;
    if (G.view < maxView) G.view = Math.min(maxView, G.view + 0.15);
    else if (!G.shadow && G.Q.shadow > 0) this.setShadow(true);
    else if (G.pr < G.Q.pr) this.setPr(Math.min(G.Q.pr, G.pr + 0.25));
  },
  setPr(v) { G.pr = v; G.renderer.setPixelRatio(v); G.renderer.setSize(innerWidth, innerHeight); Gfx.resize(); },
  setShadow(v) {
    G.shadow = v; G.renderer.shadowMap.enabled = v; G.sun.castShadow = v;
    G.scene.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.needsUpdate = true); });
  },
};

// ---------- Sky reflections: re-render the current sky into a PMREM environment every few seconds ----------
const Env = {
  init(r) {
    this.pm = new THREE.PMREMGenerator(r); this.sc = new THREE.Scene(); this.t = 0; this.rt = null;
    this.mat = new THREE.ShaderMaterial({
      uniforms: { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, gnd: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() }, sunCol: { value: new THREE.Color() } },
      side: THREE.BackSide, depthWrite: false,
      vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform vec3 top, hor, gnd, sunCol; uniform vec3 sunDir; varying vec3 vD;
        vec3 lin(vec3 c){ return pow(max(c, vec3(0.0)), vec3(2.2)); }
        void main(){ vec3 d = normalize(vD); float h = d.y;
          vec3 c = mix(lin(hor), lin(top), pow(clamp(h, 0.0, 1.0), 0.5));
          c = mix(c, lin(gnd), 1.0 - smoothstep(-0.12, 0.02, h));
          float sd = max(dot(d, sunDir), 0.0); c += lin(sunCol) * (pow(sd, 60.0) * 4.0 + pow(sd, 6.0) * 0.25);
          gl_FragColor = vec4(c * 0.42, 1.0);
          #include <encodings_fragment>
        }`,
    });
    this.sc.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), this.mat));
  },
  update(dt, force) {
    this.t -= dt; if (!force && this.t > 0) return;
    this.t = G.Q.lvl === 'low' ? 8 : 3;
    const u = World.sky.material.uniforms, m = this.mat.uniforms;
    m.top.value.copy(u.top.value); m.hor.value.copy(u.hor.value); m.sunDir.value.copy(u.sunDir.value); m.sunCol.value.copy(u.sunCol.value);
    m.gnd.value.setRGB(0.42, 0.52, 0.3).multiplyScalar(U.clamp((G.hemiBase || 0.5) * 1.3, 0.05, 1));
    const old = this.rt; this.rt = this.pm.fromScene(this.sc, 0.02); G.scene.environment = this.rt.texture;
    if (old) old.dispose();
  },
};
// ---------- Street-lamp lights: a fixed pool follows the nearest lamp posts (constant light count = no shader recompiles) ----------
function initLamps() {
  G.lamps = []; G.lampT = 0;
  for (let i = 0; i < (G.Q.lvl === 'low' ? 2 : 4); i++) { const l = new THREE.PointLight(0xffc27a, 0, 18, 1.6); l.userData.on = 0; G.scene.add(l); G.lamps.push(l); }
}
function updateLamps(dt) {
  const on = G.night > 0.15 && !G.inside;
  G.lampT -= dt;
  if (on && G.lampT <= 0) {
    G.lampT = 0.4; const f = G.focus || G.player.pos;
    const near = World.lampSpots.map(s => [s, (s.x - f.x) ** 2 + (s.z - f.z) ** 2]).filter(a => a[1] < 2500).sort((a, b) => a[1] - b[1]);
    G.lamps.forEach((l, i) => { const s = near[i]; l.userData.on = s ? 1 : 0; if (s) l.position.set(s[0].x, World.groundY(s[0].x, s[0].z) + 4.1, s[0].z); });
  }
  for (const l of G.lamps) l.intensity = on && l.userData.on ? G.night * 3.2 : 0;
}

// ---------- Main ----------
const _clock = new THREE.Clock();
function loop() {
  requestAnimationFrame(loop);
  // phone battery mode caps the frame rate
  if (G.fpsCap) { const now = performance.now(); if (now - (G._lf || 0) < 1000 / G.fpsCap - 2) return; G._lf = now; }
  const rawDt = _clock.getDelta(), dt = Math.min(rawDt, 0.05); G.t += dt;
  const run = G.started && !G.paused && !UI.isOpen();
  // the game clock, needs and the world keep running while a phone app, shop or any other window is open (unless the player chose to pause)
  const live = G.started && !G.paused && (!UI.isOpen() || !(S && S.v39c && S.v39c.pauseMenu));
  if (live) {
    tick(Math.min(rawDt, 0.5) * gameRate());   // the clock follows real elapsed time even when frames are slow
    if (S.time >= 120 && S.time < 360 && !G.sleeping && !(typeof TimeMode !== 'undefined' && TimeMode.real())) { G.sleeping = true; UI.close(); if (G.driving) { G.driving.speed = 0; exitCar(); } sleep(true); setTimeout(() => G.sleeping = false, 1500); }
  }
  if (run) {
    if (G.driving) updateCar(dt); else updatePlayer(dt);
  } else if (G.player && !G.driving) Models.animHuman(G.player.obj, dt, 0, G.player.act);
  updateWeather(dt); updateCamera(dt); updateSky(); Env.update(dt); updateLamps(dt);
  SWAY.time.value = G.t; SWAY.wind.value = 0.25 + G.wx.wind * 1.1;
  Perf.frame(dt);
  updateAnimals(dt); updateNPCs(dt); if (live) updateTraffic(dt); if (run) { Fish.update(dt); Move.update(); }
  Pad.poll(dt); Life.update(dt); Net.update(dt); Guide.fps(dt); Emergency.update(dt); Contests.update(dt); People.tags(dt); if (G.started) { Food.update(); Life2.updateJob(dt); Town2.update(dt); Events.tick(dt); Rooms.update(dt); DriveSchool.update(dt); Shoppers.update(dt); Smart.update(dt); Plan.update(dt); Plan10.update(dt); CCTV.update(dt); Fest2.update(dt); Ambient.update(dt); Perf4.update(dt); Fun.update(dt); Life6.update(dt); Life7.update(dt); Life8.update(dt); Civic.update(dt); Life9.update(dt); Perf5.update(); Stable.update(); Tutorial.update(dt); } Social.updateFamily(dt); if (G.started) Social.updateVisitors(dt); if (G.started) { Pet.update(dt); Pets2.update(dt); Fest.update(dt); Quest.update(dt); Craft.update(dt); }
  Music.mood = { night: G.night > 0.55, rain: G.wx.rain > 0.3, inside: G.inside }; updateSprinklers(dt); updatePlotsAnim(dt); FX.update(dt); updateRain(dt); World.update(dt, G.t);
  for (const c of World.clouds) { c.position.x += (2 + G.wx.wind * 8) * dt; if (c.position.x > 900) c.position.x = -500; }
  if (G.started) {
    G.tgtT -= dt; if (G.tgtT <= 0) { G.tgtT = 0.12; updateTarget(); G.plots.forEach((_, i) => refreshPlot(i)); if (S.up.orchard) G.trees.forEach((_, i) => refreshTree(i)); }
    G.hudT -= dt; if (G.hudT <= 0) { G.hudT = 0.2; UI.hud(); UI.minimap(); UI.checkGoal(); }
    G.saveT += dt; if (G.saveT > 25 && run) { G.saveT = 0; saveGame(true); }
  }
  const zone = zoneAt(G.player.pos.x, G.player.pos.z);
  Sfx.update(dt, { rain: G.wx.rain, wind: G.wx.wind, outdoor: !G.inside, night: G.night > 0.5, car: !!G.driving, carSpeed: G.driving ? G.driving.speed : 0, sea: !G.inside && G.player.pos.x > 330 ? U.smooth(330, 410, G.player.pos.x) : 0 });
  if (zone && zone.id === 'seaside') S.stats.sea = 1;
  Gfx.render();
}

async function boot() {
  const touch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  // weak phones/tablets start on low; the governor raises quality if FPS allows
  const weak = touch && ((navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 3);
  const ql = safeGet(Q_KEY) || (typeof Stab30 !== 'undefined' && Stab30.pick(touch, weak)) || (weak ? 'low' : touch ? 'med' : 'high');
  G.Q = makeQ(ql, touch); Perf.init();
  document.body.classList.toggle('touch', touch);
  const cv = document.getElementById('c');
  const r = new THREE.WebGLRenderer({ canvas: cv, antialias: G.Q.aa, powerPreference: 'high-performance' });
  r.setPixelRatio(G.Q.pr); r.setSize(innerWidth, innerHeight);
  r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.0;
  r.shadowMap.enabled = G.Q.shadow > 0; r.shadowMap.type = G.Q.lvl === 'med' ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
  G.renderer = r;
  G.scene = new THREE.Scene(); G.scene.fog = new THREE.Fog(0xcfe3f0, 150, 900);
  G.camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 2200);
  addEventListener('resize', () => { r.setSize(innerWidth, innerHeight); G.camera.aspect = innerWidth / innerHeight; G.camera.updateProjectionMatrix(); });
  G.hemi = new THREE.HemisphereLight(0xbfd8ff, 0x5a6a3a, 0.6); G.scene.add(G.hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 2.5); sun.castShadow = G.Q.shadow > 0;
  if (sun.castShadow) {
    sun.shadow.mapSize.set(G.Q.shadow, G.Q.shadow); const sc = sun.shadow.camera;
    sc.left = -42; sc.right = 42; sc.top = 42; sc.bottom = -42; sc.near = 1; sc.far = 400;
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  }
  G.sun = sun; G.scene.add(sun, sun.target);
  const setLoad = m => { document.getElementById('loadMsg').textContent = m; };
  try { await Promise.race([document.fonts.load('600 40px Kanit'), new Promise(r => setTimeout(r, 2500))]); } catch (e) { }
  await AssetPack.load(setLoad); setLoad('กำลังเตรียมพื้นผิวและโมเดล...'); await Assets.load(setLoad); setLoad('กำลังเตรียมชาวบ้าน...'); await Avatars.load();
  setLoad('กำลังเตรียมพื้นผิว...'); await new Promise(r => setTimeout(r, 0));
  T.init(); Assets.applyTextures();
  await World.build(G.scene, G.Q, setLoad);
  setLoad('กำลังเชื่อมต่อเซิร์ฟเวอร์...'); await Net.probe();
  const saved = loadState();
  S = saved || newState(); G.fresh = !saved;
  FX.init(G.scene); initRain(G.Q.rain); Env.init(r); initLamps();
  Prog.init(); if (!S.daily || !S.daily.talk) resetDaily();
  setupEntities(); Fish.init(G.scene); Life.init(G.scene); Pet.spawn(); Fest.init(G.scene); Dev.applyAll(); Mine.init(G.scene); Mine.attachPick(); Craft.init();
  Emergency.init(G.scene); Social.spawn(); Social.buildStand(); Phone.badge();
  Garage.build(); Garage.buildShop(); Contests.init(G.scene); People.staff(); Mall.build(); Bank2.build(); Farm2.init(G.scene); Life2.init(); Social2.init(); Town2.init(); Events.init(); Towns4.init(); Town3.init(); Collide.run(); Pets2.list(); Pets2.init(); Smart.initOutdoor(); Stations2.init(); Rooms.init(); HiTech.init(); PC.init(); Fut.init(); Plan.init(); GridOffice.init(); ISP.init(); Career.init(); Plan10.init(); Sec.init(); Company.init(); SIMs.sync(); CoMap.drawAll(); CCTV.init(); Life3.init(); Fest2.init(); RL.init(); Life5.init(); Perf4.init(); Fun.init(); Life6.init(); Life7.init(); Life8.init(); Civic.init(); Gfx.init(); Stable.init(); Life9.init(); IOSFix.init(); ItemPick.init(); Perf5.init(); V23.init(); Wear.apply(G.player.obj);
  for (const id in S.inv) if (S.inv[id] > 0) { const it = ITEMS[id]; if (it) S.found[it.base || id] = 1; }
  World.setFarmName(S.farm); if (!S.orders.length) Orders.daily();
  const W = WEATHER[S.weather.type]; Object.assign(G.wx, { cloud: W.cloud, rain: W.rain, fog: W.fog, wind: W.wind, storm: W.storm || 0 });
  UI.init(!!saved); Slots.initStart();
  Input.init();
  updateCamera(1); updateSky();
  loop();
}
function startGame(fresh) {
  if (fresh) {
    safeSet(saveKey(), ''); Net.flush(() => location.reload(), null); return;
  }
  Sfx.init(); Sfx.setOn(!S.mute); Music.setOn(S.music !== false);
  G.started = true; document.getElementById('start').classList.add('gone'); Net.start();
  UI.buttons(); UI.hotbar();
  if (!S.look) setTimeout(() => UI.look(true), 300);
  else if (!S.tips.welcome) { S.tips.welcome = 1; setTimeout(() => UI.help(), 400); }
  setTimeout(() => Tutorial.start(false), 1500);
}
// v196: a load failure (usually old and new game files mixed in the browser cache of a phone / iPad) repairs itself: the app cache and the service worker are cleared (the SAVE is never touched) and the page reloads once;
// if it still fails a button does the same. Players no longer have to clear their browsing data (which also deletes the save).
function recoverCache() {
  try { sessionStorage.setItem('raisukjai_recov', String(Date.now())); } catch (e) { }
  const jobs = [];
  try { if (navigator.serviceWorker) jobs.push(navigator.serviceWorker.getRegistrations().then(rs => Promise.all(rs.map(r => r.unregister())))); } catch (e) { }
  try { if (window.caches) jobs.push(caches.keys().then(ks => Promise.all(ks.filter(k => k.indexOf('raisukjai') === 0).map(k => caches.delete(k))))); } catch (e) { }
  return Promise.all(jobs.map(j => j.catch(() => { }))).then(() => location.reload());
}
window.addEventListener('load', () => boot().catch(e => {
  console.error(e);
  const m = document.getElementById('loadMsg'); m.textContent = 'โหลดเกมไม่สำเร็จ: ' + e.message;
  try { window.__bootErr = String(e && e.stack || e).split(String.fromCharCode(10)).slice(0, 4).join(' | ').slice(0, 400); } catch (x) { }
  let last = 0; try { last = +sessionStorage.getItem('raisukjai_recov') || 0; } catch (x) { }
  if (!last || Date.now() - last > 60000) { m.textContent += ' · กำลังซ่อมแอปให้อัตโนมัติ (เซฟไม่หาย)...'; setTimeout(recoverCache, 800); return; }
  const b = document.createElement('button'); b.className = 'btn'; b.textContent = '🔧 ซ่อมแล้วลองใหม่ (เซฟไม่หาย)'; b.style.marginTop = '10px'; b.onclick = () => recoverCache(); m.appendChild(document.createElement('br')); m.appendChild(b);
  if (window.__bootErr) { const d = document.createElement('div'); d.style.cssText = 'font-size:10px;opacity:.6;margin-top:8px;max-width:90vw;word-break:break-all'; d.textContent = window.__bootErr; m.appendChild(d); }
}));
