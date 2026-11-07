'use strict';
// ---------- W1: every shop and restaurant in the village and the 9 cities opens with E, and eating really fills hunger ----------
// 1. Food counters of the new cities (thai/sushi/cafe/bakery/seafood/grill/sweets/juice) were built as 'restaurant' rooms but had no
//    entry in MENU, so Food.open threw on E. They now get a menu built from their shop stock (dine-in / takeaway like the old restaurants).
// 2. Every food a shop sells can be eaten on the spot ("ทานที่ร้าน"), not only at cafés and stalls.
// 3. Eating from the bag, dining in and drinks all report the change of hunger / thirst in the toast.
V23.add('v36_shopfix', () => {
  const foodRows = (shopId) => {
    const sh = SHOPS[shopId]; if (!sh) return null;
    const cats = [];
    for (const t of sh.tabs || []) {
      const rows = [];
      for (const key of t.items) {
        if (!key.startsWith('food:')) continue;
        const id = key.slice(5), F = FOODS[id]; if (!F) continue;
        let price = F.price; try { const e = UI.entry(key, shopId); if (e && e.price) price = e.price; } catch (e) { }
        rows.push([id, F.n, F.i, price, F.en]);
      }
      if (rows.length) cats.push([t.n, rows]);
    }
    return cats.length ? cats : null;
  };
  // MENU[shop] is built the first time a counter or the shop list asks for it
  const ensureMenu = (shopId) => { if (!MENU[shopId] && SHOPS[shopId]) { const m = foodRows(shopId); if (m) MENU[shopId] = m; } return MENU[shopId]; };
  const _open = Food.open.bind(Food);
  Food.open = function (shop) {
    if (!MENU[shop]) ensureMenu(shop);
    if (MENU[shop]) return _open(shop);
    if (SHOPS[shop]) return UI.shop(shop);       // a counter with no food on it: show the plain shop list instead of failing
  };
  // eat-in button on every food card of the shop list (cafés, stalls, convenience stores, market stands, the mall food court)
  const addDine = () => {
    const body = document.getElementById('mBody'); if (!body || !UI.shopId) return;
    body.querySelectorAll('button[data-a="buy"][data-k^="food:"]').forEach(b => {
      const row = b.parentNode; if (!row || row.querySelector('[data-a="v23dine"]')) return;
      const id = b.dataset.k.slice(5); if (!FOODS[id]) return;
      const nb = document.createElement('button'); nb.className = 'btn ghost'; nb.dataset.a = 'v23dine'; nb.dataset.id = id; nb.textContent = 'ทานที่ร้าน';
      if (b.disabled) nb.disabled = true; row.appendChild(nb);
    });
  };
  const _rb = UI.renderBody.bind(UI);
  UI.renderBody = function () { const r = _rb(); try { addDine(); } catch (e) { } return r; };
  // the toast of every meal shows what it did to hunger and thirst
  const fmt = (h0, t0) => `${S.hunger - h0 >= 0.5 ? `ความหิว +${Math.round(S.hunger - h0)}` : ''}${S.thirst - t0 >= 0.5 ? `${S.hunger - h0 >= 0.5 ? ' · ' : ''}ความกระหาย +${Math.round(S.thirst - t0)}` : ''}`;
  const _eat = eat;
  eat = function (id) {
    const h0 = S.hunger, t0 = S.thirst, m0 = S.inv[id] || 0;
    const r = _eat.apply(this, arguments);
    if ((S.inv[id] || 0) < m0) { const x = fmt(h0, t0); if (x) setTimeout(() => UI.toast(x, '🍽️'), 700); }
    return r;
  };
  // regression: eat at every food seller (restaurant menus, cafés, stalls, convenience stores, market stands) and assert that hunger went up
  // Shop36.regress() -> Promise<{shops, tested, bad:[...]}>   (run in a started game; shops of unvisited cities do not exist yet)
  const regress = async (limit = 999) => {
    const wait = ms => new Promise(r => setTimeout(r, ms)), out = { shops: 0, tested: 0, bad: [] };
    const ids = Object.keys(SHOPS).filter(id => MENU[id] || (SHOPS[id].tabs || []).some(t => t.items.some(k => k.startsWith('food:')))).slice(0, limit);
    for (const id of ids) {
      out.shops++; S.money = 1e7;
      if (MENU[id] || ensureMenu(id)) Food.open(id); else UI.shop(id);
      await wait(60);
      const btns = [...document.querySelectorAll('#mBody [data-a="dine"],#mBody [data-a="v23dine"]')];
      if (!btns.length) { out.bad.push(`${id}: no eat-in button`); UI.close(); continue; }
      for (const b of [btns[0], btns[btns.length - 1]]) {
        S.hunger = 15; S.thirst = 15; S.energy = 10; const fid = b.dataset.id, h0 = S.hunger, t0 = S.thirst;
        UI.H[b.dataset.a]({ id: fid }); await wait(1600);
        if (S.hunger <= h0 + 0.5) out.bad.push(`${id} ${fid}: hunger ${h0} -> ${S.hunger}`);
        if (DRINKS.includes('food_' + fid) && S.thirst <= t0 + 0.5) out.bad.push(`${id} ${fid}: thirst unchanged`);
        out.tested++; UI.close(); await wait(150);
      }
    }
    for (const id of Object.keys(ITEMS).filter(k => ITEMS[k].en)) {
      S.inv = {}; S.inv[id] = 1; S.hunger = 15; S.thirst = 15; S.energy = 10; eat(id);
      if (S.hunger <= 15.5) out.bad.push(`bag ${id}: hunger unchanged`);
    }
    return out;
  };
  window.Shop36 = { ensureMenu, foodRows, regress };
});
