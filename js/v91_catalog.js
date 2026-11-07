// v91_catalog.js: 40 more products in every shop (catalogues in cat_g1..g4.js) and 70-80 per category in the computer plaza (cat_g5.js, cat_ram.js, patched into v36_pc.js)
//  - food and drink shops get new dishes (energy), the two restaurants get new menu pages, home-decor shops get new display pieces, every other shop gets goods with small real effects
//    (restore energy / thirst / mood, a little XP, cheer up a pet or a child, a gift that raises friendship with villagers)
//  - everything is a normal shop entry, so the basket (tick many things, pay once, choose how to pay: cash / bank-app transfer / card as set up in the banking update) works for all of it
V23.add('v91_catalog', () => {
  const D = window.CATDATA; if (!D) return;
  const FOOD_SHOPS = new Set(['mart', 'citycafe', 'nightmarket', 'floating', 'islandbar', 'fest_hot', 'fest_cool']);
  const MENU_SHOPS = new Set(['restaurant', 'seafood']);
  const DECOR_SHOPS = new Set(['lux', 'carpenter']);
  const parseFx = s => { const o = {}; for (const p of String(s || '').split(',')) { const [k, v] = p.split(':'); if (k) o[k.trim()] = v === undefined ? 1 : +v; } return o; };
  const NAME = { food: '🆕 เมนูใหม่', menu: '🆕 เมนูใหม่', decor: '🆕 ของตกแต่งใหม่', goods: '🆕 สินค้าใหม่' };
  const CHUNK = 20, counts = {};
  const taken = id => !!(GOODS[id] || TOOLS[id] || FOODS[id] || FURN[id] || ITEMS[id] || ITEMS['food_' + id]);
  const useOf = fx => (fx.en || fx.th || fx.mood || fx.xp || fx.cure || fx.pet) ? () => {
    if (fx.en) S.energy = Math.min(maxEnergy(), S.energy + fx.en);
    if (fx.th) S.thirst = Math.min(100, (S.thirst || 50) + fx.th);
    if (fx.mood) S.mood = Math.min(100, (S.mood || 50) + fx.mood);
    if (fx.xp) Prog.add(fx.xp);
    if (fx.cure && S.sick === 1) S.sick = 0;
    if (fx.pet && typeof Pets2 !== 'undefined' && Pets2.cur()) Pets2.cur().joy = Math.min(100, (Pets2.cur().joy ?? 60) + fx.pet);
  } : null;
  for (const grp of Object.keys(D)) {
    if (grp === 'g5') continue;                                         // the computer parts are patched into v36_pc.js
    const G_ = D[grp]; if (!G_ || typeof G_ !== 'object') continue;
    for (const shop of Object.keys(G_)) {
      const S0 = SHOPS[shop]; if (!S0) continue;
      const kind = MENU_SHOPS.has(shop) ? 'menu' : FOOD_SHOPS.has(shop) ? 'food' : DECOR_SHOPS.has(shop) ? 'decor' : 'goods';
      const rows = (G_[shop] || []).filter(r => Array.isArray(r) && r.length >= 5 && !taken(r[0]));
      const keys = [];
      for (const r of rows) {
        const [id, n, i, price, desc, fxs] = r, fx = parseFx(fxs), p = Math.max(1, Math.round(+price) || 1);
        if (kind === 'food' || kind === 'menu') { const en = fx.en || 20; FOODS[id] = { n, i, price: p, en }; ITEMS['food_' + id] = { n, i, en, cat: 'dish' }; keys.push('food:' + id); if (kind === 'menu') r._m = [id, n, i, p, en]; }
        else if (kind === 'decor') { FURN[id] = { n, i, price: p, decor: 1 }; try { MOVABLE.push(id); } catch (e) { } keys.push('furn:' + id); }
        else { GOODS[id] = { n, i, price: p, desc, gift: fx.gift, kid: fx.kid, use: useOf(fx) }; ITEMS[id] = { n, i, cat: 'tool' }; TOOLS[id] = { n, i, price: p, desc }; keys.push('tool:' + id); }
      }
      if (!keys.length) continue;
      if (kind === 'menu') {
        for (let k = 0, c = 1; k < rows.length; k += CHUNK, c++) MENU[shop].push([`${NAME.menu} ${c}/${Math.ceil(rows.length / CHUNK)}`, rows.slice(k, k + CHUNK).map(r => r._m)]);
      } else {
        const nT = Math.ceil(keys.length / CHUNK);
        for (let k = 0; k < keys.length; k += CHUNK) S0.tabs.push({ n: `${NAME[kind]} ${k / CHUNK + 1}/${nT}`, items: keys.slice(k, k + CHUNK) });
      }
      counts[shop] = keys.length;
    }
  }
  window.Cat91 = { counts, total: () => Object.values(counts).reduce((a, b) => a + b, 0) };
});
