'use strict';
// ---------- v39_levels: levels 1 → 50 and everything unlocks by level ----------
// * XP curve for ~45 hours to the top, XP scaled up (x6) and extra XP from jobs, study, business, travel, quests and social life
// * shops (doors), shop items (by their current price tier, so price retunes keep working), phone apps, cities and seeds/animals unlock by level
// * internet subscriptions and basic services (ID card, bank, hospital, school, gov centre ...) are open from level 1
// * window.Lvl39 is defined at load time so other modules (the test-period reset) can read MAX / setLevel before init
const Lvl39 = (() => {
  const MAX = 50, XP_SCALE = 6;
  // gentle curve: +35 XP per level up to level 20, then only +15 per level, so the late levels are not a wall (Lv.1 = 100, Lv.20 = 765, Lv.49 = ~1,200)
  const need1 = l => { l = Math.max(1, l); return Math.round(100 + 35 * Math.min(l - 1, 19) + 15 * Math.max(0, l - 20)); };
  const L = { MAX, XP_SCALE };
  L.xpNeed = need1;
  L.xpFor = l => { let t = 0; for (let i = 1; i < Math.min(l, MAX + 1); i++) t += need1(i); return t; };       // total XP needed to reach level l from level 1
  L.levelFromXp = xp => { let l = 1; while (l < MAX && xp >= need1(l)) { xp -= need1(l); l++; } return { lvl: l, rem: Math.round(xp) }; };
  L.cur = () => (window.S && S.lvl) || 1;
  return L;
})();
window.Lvl39 = Lvl39;
// the old code reads the cap and the curve through these two names
xpNeed = function (l) { return Lvl39.xpNeed(l); };

V23.add('v39_levels', () => {
  const L = Lvl39, MAX = L.MAX;
  const st = () => { const v = S.v39 = S.v39 || {}; const s = v.lv = v.lv || {}; s.base = s.base || null; s.log = s.log || []; return s; };
  const lv = () => S.lvl || 1;

  // ===================== 1) tables =====================
  // price tier → level (current prices are read at run time, so any price retune keeps the ladder consistent)
  const TIERS = [[1500, 1], [6000, 2], [15000, 4], [40000, 7], [100000, 11], [250000, 15], [600000, 20], [1500000, 26], [4000000, 32], [10000000, 38], [30000000, 44]];
  const lvPrice = p => { if (!(p > 0)) return 1; for (const [cap, l] of TIERS) if (p <= cap) return l; return 50; };
  // crops by tier (the old table topped out at level 8)
  const SEED = { carrot: 1, cabbage: 1, chili: 1, tomato: 2, corn: 3, eggplant: 4, strawberry: 5, sunflower: 6, pumpkin: 7, watermelon: 8, pineapple: 9, orange: 10, mango: 12 };
  try { Object.assign(SEED_LVL, SEED); } catch (e) { }
  const ANIMAL = { chicken: 2, sheep: 5, pig: 7, cow: 9 };
  const PET = 3;
  const NET_RE = /(^|_)(router|modem|sim|wifi|wlan|fiber|fibre|isp|mesh|ap|cat5|cat6|lan|coax)(_|$)/i;   // networking basics stay open (the subscriptions themselves are not gated at all)
  // shop doors (SHOPS ids / room kinds)
  const SHOP = {
    farmshop: 1, mart: 1, restaurant: 1, seafood: 2, fest_hot: 1, fest_rain: 1, fest_cool: 1, fest24: 1, online: 1, wkmarket: 4,
    carpenter: 3, florist: 3, citycafe: 4, ranch: 4, hardware: 5, nightmarket: 6, petshop: 6, rare: 8, dealer: 8, mountain: 10, itshop: 9, pcshop: 10, secshop: 11,
    mall: 12, islandbar: 12, dealer2: 12, floating: 14, lux: 14, evcenter: 22, supercar: 30,
  };
  const KIND = { bank: 1, hospital: 1, police: 1, fire: 1, school: 1, gov: 1, own11x9: 1, own9x7: 1, v28wk: 1, v25dept: 1, office: 3, mall: 12, restaurant: 1, shop: 1 };
  // phone apps
  const APP = {
    call: 1, msgs: 1, bank: 1, wx: 1, cam: 1, chat: 1, people: 1, food: 1, taxi: 1, missions: 1, ach: 1, guide: 1, set: 1, map: 1, home: 1, isp: 1, gov24: 1, docs26: 1, cal36: 1, me36: 1, howto: 1, collect: 1, today: 1, cards: 1, board: 1,
    diary: 1, diary31: 1, saga: 1, stories: 1, alert: 1, civhos: 1, civsch: 1, civride: 1, appt39: 1, lvl39: 1, shop: 1, invite: 3, pets: 3, friends: 2, jobs: 2, career: 2, health31: 2,
    grid: 3, water: 3, wreq: 3, agency26: 3, news: 3, news31: 3, disaster31: 4, edu24: 4, life25: 4, loan: 5, ins: 5, usage36: 5, village31: 5, cities: 5, life26: 5, agri: 6, ranch: 6, family: 6, vote: 6, itc: 6, rel24: 6,
    kids31: 8, tax: 8, prop23: 8, cctv: 8, mv37: 8, stock: 8, gps: 8, estate: 10, house36: 10, court31: 10, shub: 10, biz: 12, travel31: 12, farm31: 12, cloud: 12, company: 14, biz31: 16, oracle: 22,
  };
  const CITY = { chiang: 3, city: 4, mount: 6, island: 8, sunflower: 5, riverside: 5, brook: 12, grain: 12, orchard: 12, metro: 20, port: 20, andaman: 20, tech: 20 };
  const cityLv = k => CITY[k] || 5;
  L.tables = { SHOP, KIND, APP, CITY, SEED, ANIMAL, TIERS };

  // ===================== 2) level lookups =====================
  const shopLevel = room => {
    if (!room) return 1;
    const sid = room.shop, kind = String(room.kind || '');
    if (sid && SHOP[sid] != null) return SHOP[sid];
    let m;
    if (sid && (m = /^v23_([a-z0-9]+)_\d+$/.exec(sid))) return cityLv(m[1]);               // city shops: the city itself is the gate
    if ((m = /^v36_([a-z0-9]+)_pc$/.exec(kind))) return Math.max(10, cityLv(m[1]));          // PC shops
    if ((m = /^v28_([a-z0-9]+)_uni$/.exec(kind))) return Math.max(12, cityLv(m[1]));         // universities
    if ((m = /^v25_([a-z0-9]+)_([a-z]+)$/.exec(kind))) return 1;                              // civic offices
    if (KIND[kind] != null) return KIND[kind];
    return 1;
  };
  L.appLevel = id => APP[id] != null ? APP[id] : 1;
  L.cityLevel = cityLv;
  L.shopLevel = shopLevel;
  // level an entry (shop item) needs, from its kind and current price
  const entryLevel = (key, e) => {
    const [k, id] = String(key).split(':');
    if (!e) return 1;
    if (NET_RE.test(id || '') || k === 'isp' || k === 'sim') return 1;
    if (k === 'seed') return SEED_LVL[id] || SEED[id] || 1;
    if (k === 'animal') return ANIMAL[id] || lvPrice(e.price);
    if (k === 'pet') return PET;
    if (k === 'food') return Math.min(lvPrice(e.price), 12);
    return lvPrice(e.price);
  };
  L.itemLevel = entryLevel;
  // generic gate: kind 'shop' | 'app' | 'city' | 'item'
  L.need = (kind, id, extra) => {
    let n = 1;
    if (kind === 'shop') n = typeof id === 'object' ? shopLevel(id) : (SHOP[id] != null ? SHOP[id] : shopLevel({ shop: id, kind: id }));
    else if (kind === 'app') n = L.appLevel(id);
    else if (kind === 'city') n = cityLv(id);
    else if (kind === 'item') n = entryLevel(id, extra || (rawEntry ? rawEntry(id, 'x') : UI.entry(id, 'x')));
    return n > lv() ? n : 0;                  // 0 = open, otherwise the level that is required
  };
  L.isUnlocked = (kind, id, extra) => !L.need(kind, id, extra);
  const lockMsg = (n, what) => { UI.toast(`🔒 ${what ? what + ' · ' : ''}ปลดล็อกที่เลเวล ${n}`, '🔒'); try { Sfx.error(); } catch (e) { } };

  // ===================== 3) XP, levelling and the reset helpers =====================
  const ach = e => { try { return (typeof Events !== 'undefined' ? Events.st() : null) || (S.ev = S.ev || {}); } catch (x) { return S.ev || {}; } };
  const markAch = l => {                      // mark the level achievements silently (no 300 ฿ / XP): they are only paid when reached by playing
    try { const e = ach(); e.ach = e.ach || {}; for (const n of [5, 10, 15, 25, 30, 40, 50]) if (l >= n && !e.ach['lv' + n]) e.ach['lv' + n] = S.day; } catch (x) { }
  };
  L.setLevel = l => {
    l = Math.max(1, Math.min(MAX, Math.round(l))); S.lvl = l; S.xp = 0;
    markAch(l);
    try { UI.hud && UI.hud(); } catch (e) { }
    return l;
  };
  L.grantFloor = l => { if ((S.lvl || 1) < l) L.setLevel(l); return S.lvl; };

  // level-up announcements
  let roadmap = null;
  const buildRoadmap = () => {
    if (roadmap) return roadmap;
    const R = {}; const at = n => (R[n] = R[n] || { shops: [], apps: [], cities: [], items: [] });
    for (const id in SHOP) { if (SHOP[id] > 1 && SHOPS[id] && id !== 'online') at(SHOP[id]).shops.push(SHOPS[id].n); }
    try { for (const a of APPS) { const n = L.appLevel(a.id); if (n > 1) at(n).apps.push(a.i + ' ' + a.n); } } catch (e) { }
    try { for (const c of V25.cityList()) { const n = cityLv(c.key); at(n).cities.push(c.icon + ' ' + c.n); } } catch (e) { }
    const keys = new Set();
    try { for (const sid in SHOPS) for (const t of SHOPS[sid].tabs || []) for (const k of t.items || []) keys.add(k); } catch (e) { }
    for (const [reg, kind] of [[CROPS, 'seed'], [TOOLS, 'tool'], [FOODS, 'food'], [FURN, 'furn'], [CARS, 'car'], [ANIMALS, 'animal']]) { try { for (const k in reg) keys.add(kind + ':' + k); } catch (e) { } }
    try { for (const k in PC_PARTS) keys.add('pc:' + k); } catch (e) { }
    for (const k of keys) {
      let e = null; try { e = (rawEntry || UI.entry.bind(UI))(k, 'online'); } catch (x) { }
      if (!e || !e.name || !(e.price > 0)) continue;
      const n = entryLevel(k, e); if (n > 1) at(n).items.push(String(e.icon || '') + ' ' + e.name);
    }
    return (roadmap = R);
  };
  L.roadmap = buildRoadmap;
  L.unlocksAt = n => buildRoadmap()[n] || { shops: [], apps: [], cities: [], items: [] };
  const announce = from => {
    const to = S.lvl, parts = [];
    for (let n = from + 1; n <= to; n++) {
      const u = L.unlocksAt(n), bits = [];
      if (u.shops.length) bits.push('ร้าน ' + u.shops.slice(0, 3).join(', ') + (u.shops.length > 3 ? ` +${u.shops.length - 3}` : ''));
      if (u.apps.length) bits.push('แอป ' + u.apps.slice(0, 3).join(', ') + (u.apps.length > 3 ? ` +${u.apps.length - 3}` : ''));
      if (u.cities.length) bits.push('เมือง ' + u.cities.join(', '));
      if (u.items.length) bits.push(`สินค้า ${u.items.length} รายการ เช่น ${u.items.slice(0, 3).join(', ')}`);
      if (bits.length) parts.push(`Lv.${n}: ${bits.join(' · ')}`);
    }
    const t = `🎉 เลื่อนเป็นระดับ ${S.lvl}!${parts.length ? ' ปลดล็อก ' + parts.join(' | ') : ''}`;
    UI.toast(t.length > 230 ? t.slice(0, 227) + '…' : t, '🎉');
    try { Phone.msg('ระบบเกม', `เลเวล ${S.lvl}${parts.length ? ' — ' + parts.join(' | ') : ''}`, true); } catch (e) { }
    try { st().log.unshift({ d: S.day, l: S.lvl }); st().log.length = Math.min(st().log.length, 30); } catch (e) { }
  };
  const lvlCheck = () => {
    const from = S.lvl; let up = 0;
    while (S.lvl < MAX && S.xp >= xpNeed(S.lvl)) { S.xp -= xpNeed(S.lvl); S.lvl++; up++; }
    if (S.lvl >= MAX) S.xp = Math.min(S.xp, 0);
    if (up) {
      try { Sfx.goal(); } catch (e) { }
      try { S.energy = Math.min(maxEnergy(), S.energy + 20); } catch (e) { }
      try { FX.burst(G.player.pos.x, G.player.pos.y + 2, G.player.pos.z, 40, new THREE.Color(1, 0.85, 0.25), 4, 5); } catch (e) { }
      roadmap = null; announce(from);
      try { if (Prog.add === myAdd && !G.simulating && typeof Juice !== 'undefined') Juice.party('เลเวลอัป Lv.' + S.lvl); } catch (e) { }   // keeps the level-up party of fun.js when this replaced its wrapper
    }
  };
  const myAdd = Prog.add = function (n) {
    if ((S.lvl || 1) >= MAX) return;
    const k = (S.buff && S.buff.xp && S.buff.xp.day === S.day ? S.buff.xp.k : 1) * (Life2.xpMult ? Life2.xpMult() : 1);
    S.xp = (S.xp || 0) + Math.max(1, Math.round(n * L.XP_SCALE * k));
    lvlCheck();
  };
  L.addRaw = n => { if (S.lvl >= MAX) return; S.xp = (S.xp || 0) + Math.round(n); lvlCheck(); };       // XP that is not scaled again
  // energy: the old formula adds 5 per level (+245 at 50): keep levels 1-20 as they were and add 1 per level after that
  maxEnergy = function () { return 100 + (S.up.house - 1) * 25 + (Math.min(S.lvl || 1, 20) - 1) * 5 + Math.max(0, (S.lvl || 1) - 20) + (S.fit || 0); };
  // extra level achievements
  try { for (const [n, i] of [[25, '🏅'], [30, '🎖️'], [40, '🏆'], [50, '👑']]) if (!ACH.some(a => a[0] === 'lv' + n)) ACH.push(['lv' + n, 'เลเวล ' + n, i, s => s.lvl >= n]); } catch (e) { }

  // ---- extra XP from everything that is not farming: measured as changes in the game's own counters, once per game day ----
  const counters = () => {
    const c = {}; const sv = S.v31d || {};
    try { c.earned = (S.stats && S.stats.earned) || 0; } catch (e) { }
    try { c.jobDays = S.job && S.job.done ? Object.keys(S.job.done).length : 0; } catch (e) { }
    try { c.certs = (S.civic && S.civic.ed && S.civic.ed.certs ? S.civic.ed.certs.length : 0); } catch (e) { }
    try { c.trips = (S.v31t && S.v31t.stats && S.v31t.stats.trips) || 0; } catch (e) { }
    try { c.saga = (S.saga && S.saga.ch) || 0; } catch (e) { }
    try { c.companies = S.co && S.co.list ? S.co.list.length : 0; } catch (e) { }
    try { c.docs = S.gov24 && S.gov24.docs ? Object.keys(S.gov24.docs).length : 0; } catch (e) { }
    try { c.hearts = Object.values(S.friends || {}).reduce((a, b) => a + (+b || 0), 0); } catch (e) { }
    try { c.km = (sv.drive || 0) + (sv.walk || 0) * 0.3; } catch (e) { }
    try { c.degree = (S.edu && S.edu.done ? Object.keys(S.edu.done).length : 0); } catch (e) { }
    try { c.listed = (S.v31b && S.v31b.shops ? S.v31b.shops.length : 0); } catch (e) { }
    try { c.stocks = (S.mkt24 && S.mkt24.rlz) || 0; } catch (e) { }
    return c;
  };
  const W = { earned: 1 / 160, jobDays: 150, certs: 900, trips: 120, saga: 1800, companies: 1200, docs: 80, hearts: 60, km: 14, degree: 1500, listed: 1000, stocks: 1 / 800 };
  const daily = () => {
    const s = st(), now = counters();
    if (!s.base) { s.base = now; return; }
    let xp = 0;
    for (const k in W) { const d = (now[k] || 0) - (s.base[k] || 0); if (d > 0) xp += d * W[k]; }
    s.base = now;
    if (xp >= 1) L.addRaw(Math.min(xp, 6000));
  };
  const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { daily(); } catch (e) { console.warn('v39 levels daily', e); } return r; };

  // ===================== 4) the gates =====================
  let rawEntry = null;
  const lockEntry = (key, e) => {
    if (!e || e.__lv39) return e;
    e.__lv39 = 1;
    if (!(e.price > 0) && !e.buy) return e;
    const n = entryLevel(key, e);
    if (n <= lv()) return e;
    e.lockLv = n; e.icon = '🔒'; const owned = e.block; if (!owned || /ไม่|ต้อง|ล็อก/.test(owned) || true) e.block = `🔒 ต้องการเลเวล ${n}`;
    e.desc = `🔒 ปลดล็อกที่เลเวล ${n} · ` + (e.desc || ''); e.buy = () => lockMsg(n, e.name);
    return e;
  };
  const install = () => {
    // items: every shop list, the online mall, the PC and IT shops all read their entries through UI.entry
    if (UI.entry && !UI.entry.__lv39) {
      rawEntry = UI.entry.bind(UI);
      const w = function (key, shop) { const e = rawEntry(key, shop); return lockEntry(key, e); };
      w.__lv39 = 1; UI.entry = w;
    } else if (UI.entry && !rawEntry) rawEntry = UI.entry.bind(UI);
    // shop windows opened from anywhere
    if (!UI.shop.__lv39) { const _s = UI.shop.bind(UI); const w = function (id) { const n = id === 'online' ? 0 : (SHOP[id] || (/^pcc_/.test(id) ? 10 : 0)); if (n > lv()) return lockMsg(n, SHOPS[id] && SHOPS[id].n); return _s(id); }; w.__lv39 = 1; UI.shop = w; }
    // doors
    if (!Rooms.enter.__lv39) {
      const _e = Rooms.enter.bind(Rooms);
      const w = function (poi) { const n = shopLevel(poi && poi.room); if (n > lv()) return lockMsg(n, poi.room.title); return _e(poi); }; w.__lv39 = 1; Rooms.enter = w;
      const _en = Rooms.entrance.bind(Rooms);
      const we = function (poi) { const r = _en(poi), n = shopLevel(poi && poi.room); if (n > lv()) { r.icon = '🔒'; r.label = `🔒 ${poi.room.title} (ปลดล็อกเลเวล ${n})`; } return r; }; we.__lv39 = 1; Rooms.entrance = we;
    }
    // phone apps
    if (!Phone.open.__lv39) { const _o = Phone.open.bind(Phone); const w = function (app) { const n = app ? L.need('app', app) : 0; if (n) { lockMsg(n, (APPS.find(a => a.id === app) || {}).n); app = null; } return _o(app); }; w.__lv39 = 1; Phone.open = w; }
    if (!UI.H.app.__lv39) { const _a = UI.H.app; const w = function (d) { const n = d && d.v ? L.need('app', d.v) : 0; if (n) { lockMsg(n, (APPS.find(a => a.id === d.v) || {}).n); return; } return _a.apply(this, arguments); }; w.__lv39 = 1; UI.H.app = w; }
    // the older AppLock (life8.js) already greys locked apps: hand it this level table, and add a visible 🔒 level tag
    try { if (typeof AppLock !== 'undefined') { for (const k of Object.keys(APP_LVL)) delete APP_LVL[k]; Object.assign(APP_LVL, APP); AppLock.need = id => L.need('app', id); } } catch (e) { }
    if (!Phone.render.__lv39) {
      const _r = Phone.render.bind(Phone);
      const w = function () {
        let h = _r(); if (Phone.app) return h;
        for (const a of APPS) { const n = L.need('app', a.id); if (!n) continue; h = h.replace(new RegExp('(data-v="' + a.id + '"[^>]*>)(<span>[^]*?</span>)([^<]*)(</button>)'), `$1$2$3 🔒${n}$4`); }
        return h;
      }; w.__lv39 = 1; Phone.render = w;
    }
    // cities (taxi, highway checkpoint, flights and trains all arrive through Town2.go)
    if (!Town2.go.__lv39) { const _g = Town2.go.bind(Town2); const w = function (k, fee) { const n = typeof k === 'string' ? cityLv(k) : 0; if (n > lv()) { let nm = k; try { nm = V25.cityList().find(c => c.key === k).n; } catch (e) { } return lockMsg(n, nm); } return _g(k, fee); }; w.__lv39 = 1; Town2.go = w; }
  };
  setTimeout(install, 0); setTimeout(install, 3000);          // twice: once after every module's init, once more in case late modules re-wrapped

  // ===================== 5) the level screen =====================
  const bar = (v, max) => `<div style="height:10px;border-radius:6px;background:rgba(255,255,255,.12);overflow:hidden"><div style="height:100%;width:${Math.max(0, Math.min(100, v / max * 100))}%;background:linear-gradient(90deg,#ffd34d,#ff9a3c)"></div></div>`;
  const line = (n, u, open) => {
    const bits = [];
    if (u.shops.length) bits.push('🏪 ' + u.shops.join(', '));
    if (u.cities.length) bits.push('🌆 ' + u.cities.join(', '));
    if (u.apps.length) bits.push('📱 ' + u.apps.join(', '));
    if (u.items.length) bits.push(`🛍️ สินค้า ${u.items.length} รายการ: ` + u.items.slice(0, open ? 12 : 4).join(', ') + (u.items.length > (open ? 12 : 4) ? '…' : ''));
    const en = n <= 20 ? '⚡ พลังงานสูงสุด +5' : '⚡ พลังงานสูงสุด +1';
    return `<div class="card"><div class="ci">${n <= lv() ? '✅' : '🔒'}</div><div class="cb"><h4>เลเวล ${n} <small>(ต้องสะสม ${U.fmt(L.xpNeed(n - 1))} XP เพื่อขึ้นเลเวลนี้)</small></h4><p class="dim">${esc((bits.length ? bits.join(' · ') + ' · ' : '') + en)}</p></div></div>`;
  };
  const ui39 = { all: false };
  Phone.apps.lvl39 = function () {
    const l = lv(), need = l >= MAX ? 1 : xpNeed(l), R = buildRoadmap();
    let h = `<h5>🏆 ระดับของคุณ: Lv.${l}${l >= MAX ? ' (สูงสุด)' : ''}</h5>`;
    h += l >= MAX ? '<p class="lead good">ถึงเลเวลสูงสุดแล้ว ปลดล็อกทุกอย่าง</p>' : `${bar(S.xp, need)}<p class="lead">XP ${U.fmt(Math.round(S.xp))} / ${U.fmt(need)} · อีก ${U.fmt(Math.max(0, need - Math.round(S.xp)))} XP ถึงเลเวล ${l + 1}</p>`;
    h += `<p class="dim">ได้ XP จาก ปลูก/รดน้ำ/เก็บเกี่ยว ขายของ ทำอาหาร ตกปลา ทำงานประจำ เรียน ธุรกิจ เดินทาง ขับรถ เควสต์/เนื้อเรื่อง และความสนิทกับคนในหมู่บ้าน · อินเทอร์เน็ตสมัครได้ตั้งแต่เลเวล 1</p>`;
    const E = { shops: [], apps: [], cities: [], items: [] };
    h += '<h5>เลเวลนี้ได้อะไร (Lv.' + l + ')</h5><div class="grid">' + line(l, R[l] || E, true) + '</div>';
    const nxt = []; for (let n = l + 1; n <= MAX && nxt.length < 3; n++) nxt.push(n);
    h += '<h5>เลเวลถัดไปปลดล็อกอะไร</h5><div class="grid">' + (nxt.length ? nxt.map(n => line(n, R[n] || E, true)).join('') : '<p class="empty">ปลดล็อกครบแล้ว</p>') + '</div>';
    h += `<div class="row"><button class="btn ghost" data-a="lvl39all">${ui39.all ? 'ซ่อน' : 'ดู'}รายการทุกเลเวล 2–${MAX}</button></div>`;
    if (ui39.all) { h += '<div class="grid">'; for (let n = 2; n <= MAX; n++) h += line(n, R[n] || E, false); h += '</div>'; }
    return h;
  };
  UI.H.lvl39all = () => { ui39.all = !ui39.all; };
  try { if (!APPS.some(a => a.id === 'lvl39')) APPS.splice(Math.min(2, APPS.length), 0, { id: 'lvl39', i: '🏆', n: 'ระดับ & ปลดล็อก' }); } catch (e) { }

  // ===================== 6) migration =====================
  try {
    if (S.lvl > MAX) S.lvl = MAX;
    if (S.lvl < MAX && S.xp >= xpNeed(S.lvl)) S.xp = xpNeed(S.lvl) - 1;           // saves from the old curve never jump a level on load
    if (S.lvl >= MAX) S.xp = 0;
  } catch (e) { }
  L.audit = () => { const R = buildRoadmap(); const o = {}; for (let n = 2; n <= MAX; n++) if (R[n]) o[n] = { shops: R[n].shops.length, apps: R[n].apps.length, cities: R[n].cities.length, items: R[n].items.length }; return o; };
  L.install = install;
});
