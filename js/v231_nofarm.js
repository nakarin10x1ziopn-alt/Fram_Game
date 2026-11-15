'use strict';
// ---------- v231: the farm is gone ----------
// No vegetable plots, orchard, seeds, farm tools, produce shops, farm animals, fish pond, fishing or horses any more. The house and everything else stay where they were.
// This module is the clean-up layer: it empties the farm systems that other files still call, takes the farm goods out of every shop and app list, and converts an old save
// (animals, stock, upgrades are paid back in cash once). The files that only held farm code are no longer loaded (see FILES in index.html).
V23.add('v231_nofarm', function () {
  const NF = window.NoFarm231 = {};
  // ---------- 1. the farm systems other files still call: do nothing ----------
  try {
    if (typeof Farm2 !== 'undefined') {
      for (const k of Object.keys(Farm2)) if (typeof Farm2[k] === 'function' && k !== 'st') Farm2[k] = function () { return undefined; };
      Farm2.slowGrowth = () => 1; Farm2.ghHouses = () => []; Farm2.weekend = () => { const d = (S.day - 1) % 7; return d === 5 || d === 6; };
    }
  } catch (e) { console.warn('v231 Farm2', e); }
  try { if (typeof Fish !== 'undefined') { Fish.start = function () { }; Fish.update = function () { }; Fish.press = function () { }; } } catch (e) { }

  // ---------- 2. what counts as a farm good ----------
  const FARM_UP = new Set(['field', 'soil', 'barn', 'feeder', 'orchard', 'can', 'rod']);
  const TOOL_ID = /^(fs_|rn_|fseed_|fl_seed)|^(seedling|fishfeed|fingerling|pesticide|ladybug|soilsensor|compost|feed|fert|sprinkler|sprinkler_pro|saddle|drone|magazine|book_(farm|animal|fish)|v_(waterpack|growtonic2?|feedsack2?|seaweedfert|mulch|workgloves|farmhat|rainboots|seedmix|birdseed|compost|bonemeal|fishmeal|guano|humus|firstaid|sunscreen|farmbook|almanac|rainwater))$/;
  const TEXT = /ปุ๋ย|เมล็ดพันธุ์|ปลูกผัก|เกษตร|ฟาร์ม|รดน้ำต้น|ปศุสัตว์|ตกปลา|คันเบ็ด|เหยื่อตก|ชาวนา|ไก่ไข่|หมูขุน|ฟางอัด|เรือนกระจก|กล้าไม้|โรงเรือน/;
  const nameOf = id => { try { const i = ITEMS[id] || {}, t = (typeof TOOLS !== 'undefined' && TOOLS[id]) || {}; return (i.n || t.n || '') + ' ' + (t.desc || ''); } catch (e) { return ''; } };
  const farmTool = id => TOOL_ID.test(id) || TEXT.test(nameOf(id));
  const farmKey = key => {
    const k = String(key), i = k.indexOf(':'), kd = k.slice(0, i), id = k.slice(i + 1);
    if (kd === 'seed' || kd === 'animal') return true;
    if (kd === 'up') return FARM_UP.has(id);
    if (kd === 'pet') return id === 'horse';
    if (kd === 'furn') return id === 'smartgarden';
    if (kd === 'tool') return farmTool(id);
    return false;
  };
  NF.farmKey = farmKey;
  const farmInv = id => { const b = String(id).split('@')[0]; try { if (/^seed_|^fseed_/.test(b)) return true; if (typeof CROPS !== 'undefined' && CROPS[b]) return true; const it = ITEMS[id] || ITEMS[b] || {}; if (it.cat === 'crop' || it.cat === 'product' || it.cat === 'fish' || it.cat === 'artisan') return true; if (it.cat === 'tool' || it.cat === 'seed') return farmTool(b); } catch (e) { } return farmTool(b); };

  // ---------- 3. shops: no farm goods ----------
  const prune = () => {
    let n = 0;
    try {
      for (const sid in SHOPS) {
        const sh = SHOPS[sid]; if (!sh || !Array.isArray(sh.tabs)) continue;
        for (const t of sh.tabs) { const b = (t.items || []).length; t.items = (t.items || []).filter(k => !farmKey(k)); n += b - t.items.length; }
        sh.tabs = sh.tabs.filter(t => (t.items || []).length > 0);
      }
    } catch (e) { console.warn('v231 prune', e); }
    return n;
  };
  NF.prune = prune; NF.removed = prune();
  { const _shop = UI.shop; if (typeof _shop === 'function') UI.shop = function (id) { prune(); const sh = SHOPS[id]; if (!sh || !sh.tabs || !sh.tabs.length) { try { UI.toast('ร้านนี้ปิดปรับปรุง ไม่มีสินค้าให้ขายตอนนี้', '🏪'); } catch (e) { } return; } return _shop.apply(this, arguments); }; }

  // government: the farm bank (BAAC) counter is gone
  try { if (window.Agency26 && Array.isArray(Agency26.agencies)) for (let i = Agency26.agencies.length - 1; i >= 0; i--) if (Agency26.agencies[i].id === 'baac') Agency26.agencies.splice(i, 1); } catch (e) { }
  // ---------- 4. phone: no farm apps ----------
  try {
    const DEAD = new Set(['biz', 'agri', 'ranch', 'farm31', 'plots40', 'garden42', 'stand48']);
    for (let i = APPS.length - 1; i >= 0; i--) if (DEAD.has(APPS[i].id)) APPS.splice(i, 1);
    if (window.Phone59 && Phone59.CATS) {
      const farm = Phone59.CATS.find(c => c[0] === 'farm'), life = Phone59.CATS.find(c => c[0] === 'life');
      if (farm) { const keep = farm[3].filter(id => !DEAD.has(id)); if (life) for (const id of keep) if (!life[3].includes(id)) life[3].push(id); Phone59.CATS.splice(Phone59.CATS.indexOf(farm), 1); }
      for (const c of Phone59.CATS) c[3] = c[3].filter(id => !DEAD.has(id));
    }
  } catch (e) { console.warn('v231 apps', e); }

  // ---------- 5. an old save: pay the farm back once ----------
  const migrate = () => {
    if (!S || S.nofarm231) return false;
    let cash = 0; const parts = [];
    try {
      for (const id of Object.keys(S.inv || {})) {
        const c = S.inv[id]; if (!(c > 0) || !farmInv(id)) continue;
        const it = ITEMS[id] || ITEMS[String(id).split('@')[0]] || {}, v = it.sell != null ? it.sell : Math.round((it.price || (TOOLS[id] || {}).price || 0) * 0.5);
        cash += (v || 0) * c; delete S.inv[id];
      }
      if (Array.isArray(S.animals) && S.animals.length) { for (const a of S.animals) cash += (ANIMALS[a.type] || {}).price || 0; parts.push(S.animals.length + ' สัตว์'); }
      for (const k of FARM_UP) { const u = UPG[k], lv = S.up && S.up[k]; if (!u || !(lv > (u.start || 0) - 1)) continue; const st = u.start || 0; for (let j = st; j < lv; j++) cash += (u.cost[j] || 0) * 0.8; }
      S.animals = []; S.sprinklers = []; S.trough = 0;
      S.plots = Array.from({ length: 30 }, () => ({ c: null, g: 0, w: 0, f: 0 })); S.trees = Array.from({ length: 6 }, () => ({ c: null, g: 0, w: 0, f: 0 }));
      for (const k of FARM_UP) if (S.up && UPG[k]) S.up[k] = UPG[k].start === 0 ? 0 : UPG[k].start;
      S.can = { water: 0 }; S.fields = undefined; S.stand = undefined;
      if (S.pet && S.pet.type === 'horse') S.pet.type = 'dog';
      if (Array.isArray(S.pets)) { const keep = []; for (const p of S.pets) { if (p && p.type === 'horse') cash += 20000; else keep.push(p); } S.pets = keep; }
      S.riding = false;
      if (S.farm === 'ไร่สุขใจ' || !S.farm) S.farm = 'บ้านสุขใจ';
      cash = Math.round(cash);
      if (cash > 0) { S.money += cash; try { Bank2.log('คืนเงินระบบฟาร์ม (ปิดระบบ)', cash); } catch (e) { } }
      S.nofarm231 = 1;
      if (cash > 0 || parts.length) { try { Phone.msg('ระบบเกม', `ระบบฟาร์มถูกปิดแล้ว ของในกระเป๋า สัตว์ และสิ่งที่อัปเกรดไว้ถูกแปลงเป็นเงินคืน ${typeof baht === 'function' ? baht(cash) : cash + ' ฿'}`, false); } catch (e) { } }
    } catch (e) { console.warn('v231 migrate', e); S.nofarm231 = 1; }
    try { UI.hotbar(); } catch (e) { }
    return true;
  };
  NF.migrate = migrate;
  // ---------- 6. things already built in the world: remove them ----------
  const FARM_POI = /แผงขายหน้าบ้าน|ดื่มน้ำบ่อ|บ่อเลี้ยงปลา|ถังปุ๋ยหมัก|แปลงนา|สวนดอกไม้|โรงงานแปรรูป|แผงตลาดนัดของคุณ|เรือนกระจก|ฟาร์มลอยฟ้า|คอกสัตว์|รางอาหาร/;
  const purge = () => {
    try {
      for (const arr of [G.plots, G.trees, G.spr, G.animals]) { if (!Array.isArray(arr)) continue; for (const o of arr) { try { const g = o.g || o.obj || o; if (g && g.parent) g.parent.remove(g); } catch (e) { } } arr.length = 0; }
      if (World.pois) World.pois = World.pois.filter(o => !(o && (FARM_POI.test(o.label || '') || o.kind === 'trough' || o.kind === 'pond')));
      if (World.orchardGroup) World.orchardGroup.visible = false;
    } catch (e) { console.warn('v231 purge', e); }
  };
  NF.purge = purge;
  let tries = 0; const iv = setInterval(() => { try { if (typeof S !== 'undefined' && S && typeof G !== 'undefined' && G.started) { clearInterval(iv); migrate(); prune(); purge(); setTimeout(purge, 3000); } else if (++tries > 600) clearInterval(iv); } catch (e) { } }, 500);
});
