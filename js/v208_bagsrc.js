'use strict';
// ---------- v208_bagsrc: the bag remembers where each piece came from (own plot / bought in a shop / ordered online) ----------
//  S.inv stays the one total per item (all old code keeps working); S.isrc[id] = { f, s, o } splits that total by origin:
//    f = collected on the farm (plots, animals, fishing, mining, home cooking)   s = bought in a shop   o = ordered online / delivered
//  addItem / takeItem are wrapped so every new item lands in the right pile; if some old code changes S.inv directly the split is repaired lazily (split()).
V23.add('v208_bagsrc', () => {
  if (typeof addItem !== 'function' || typeof takeItem !== 'function' || typeof ITEMS === 'undefined') return;
  const FARM_CATS = ['crop', 'product', 'fish', 'mineral', 'dish', 'artisan', 'bar'];
  const def = id => { const it = ITEMS[id]; if (!it || /^(food_|seed_|fseed_)/.test(id)) return 's'; return FARM_CATS.includes(it.cat) ? 'f' : 's'; };
  const ALL = ['f', 's', 'o'];
  const store = () => (S.isrc = S.isrc || {});
  // repair the split of one item so that f+s+o equals the real count (surplus is removed from the least likely origin first, a shortfall is added to the default origin)
  function split(id) {
    const total = Math.max(0, S.inv[id] || 0), st = store(), r = st[id] = st[id] || { f: 0, s: 0, o: 0 }, d = def(id);
    for (const k of ALL) if (!(r[k] > 0)) r[k] = 0;
    let sum = r.f + r.s + r.o;
    if (sum < total) r[d] += total - sum;
    else if (sum > total) { let ex = sum - total; for (const k of ALL.filter(x => x !== d).concat(d)) { const t = Math.min(r[k], ex); r[k] -= t; ex -= t; if (!ex) break; } }
    return r;
  }
  const ctx = () => (G.acq === 'o' || G.acq === 's' || G.acq === 'f') ? G.acq : null;
  const _add = addItem;
  const wAdd = function (id, n = 1) {
    let r0 = null, c0 = 0; try { if (ITEMS[id]) { r0 = split(id); c0 = S.inv[id] || 0; } } catch (e) { }
    const res = _add.apply(this, arguments);
    try { if (r0) { const dl = (S.inv[id] || 0) - c0; if (dl > 0) r0[ctx() || def(id)] += dl; } } catch (e) { }
    return res;
  };
  const _take = takeItem;
  const wTake = function (id, n = 1) {
    let r0 = null; try { if (ITEMS[id] && (S.inv[id] || 0) >= n) r0 = split(id); } catch (e) { }
    const c0 = S.inv[id] || 0, res = _take.apply(this, arguments);
    try { if (r0 && res) { let ex = c0 - (S.inv[id] || 0); const d = def(id); for (const k of [d].concat(ALL.filter(x => x !== d))) { const t = Math.min(r0[k], ex); r0[k] -= t; ex -= t; if (!ex) break; } if (!(S.inv[id] > 0)) delete S.isrc[id]; } } catch (e) { }
    return res;
  };
  addItem = wAdd; window.addItem = wAdd; takeItem = wTake; window.takeItem = wTake;
  // run fn with every item that arrives marked as coming from `k`
  const within = (k, fn) => { const p = G.acq; G.acq = k; try { return fn(); } finally { G.acq = p; } };
  // every purchase at a shop counter (the shared buy handler): the online shop counts as online
  { const _b = UI.H.buy; UI.H.buy = function (d) { const k = UI.shopId === 'online' ? 'o' : 's'; return within(k, () => _b.apply(this, arguments)); }; }
  // food delivered by the rider and parcels are online; the shop module marks its own deliveries through Bag208.within
  window.Bag208 = {
    split, within, def,
    of(k) { return Object.keys(S.inv).filter(id => ITEMS[id] && S.inv[id] > 0 && split(id)[k] > 0).map(id => ({ id, c: split(id)[k] })); },
    audit() { const bad = []; for (const id in S.inv) if (ITEMS[id] && S.inv[id] > 0) { const r = split(id); if (r.f + r.s + r.o !== S.inv[id]) bad.push(id); } return bad; },
  };
});
