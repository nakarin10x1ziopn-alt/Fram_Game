'use strict';
// ---------- v38 audit fixes (core game) ----------
// 1. star-quality produce (ITEMS['carrot@1'], '@2') is copied from the base item once at load (data.js); the v36 price retune changed the base
//    sell price afterwards, so a silver/gold star could sell for 4x the base price (pumpkin ★ 425 vs 90) or for less than the plain item
//    (strawberry ★ 69 vs 120). Re-derive every variant from its base: x1.25 and x1.5, the same rule data.js uses.
// 2. cooked dishes keep a profit over their ingredients after the retune (milk 320 made soup and smoothie sell below cost).
// 3. money and body meters are never allowed to stay NaN/Infinity: any odd handler input is repaired before the next save or day.
V23.add('v38_audit', () => {
  if (window.Audit38) return;
  const syncQuality = () => {
    if (typeof ITEMS === 'undefined') return 0;
    let n = 0;
    for (const id in ITEMS) {
      const it = ITEMS[id];
      if (!it || !it.base || !it.q) continue;
      const b = ITEMS[it.base]; if (!b || !(b.sell > 0)) continue;
      const want = Math.round(b.sell * (it.q === 1 ? 1.25 : 1.5));
      if (it.sell !== want) { it.sell = want; n++; }
    }
    return n;
  };
  const syncRecipes = () => {
    if (typeof RECIPES === 'undefined') return 0;
    let n = 0;
    for (const k in RECIPES) {
      const r = RECIPES[k], need = r.need || {};
      let cost = 0;
      for (const [id, q] of (Array.isArray(need) ? need.map(x => [x, 1]) : Object.entries(need))) {
        const it = ITEMS[id]; cost += ((it && (it.sell != null ? it.sell : it.price)) || 0) * (+q || 1);
      }
      if (cost > 0 && r.sell < cost * 1.4) {
        const to = Math.round(cost * 1.5 / 10) * 10; r.sell = to; n++;
        if (ITEMS['dish_' + k]) ITEMS['dish_' + k].sell = to;
      }
    }
    return n;
  };
  const sane = () => {
    if (typeof S === 'undefined' || !S) return;
    if (!isFinite(S.money)) S.money = window.Audit38.lastMoney || 0;
    else window.Audit38.lastMoney = S.money;
    for (const k of ['hunger', 'thirst', 'mood']) if (S[k] != null && !isFinite(S[k])) S[k] = 50;
    if (S.energy != null && !isFinite(S.energy)) S.energy = 50;
    if (S.bank) { if (!isFinite(S.bank.sav)) S.bank.sav = 0; if (!isFinite(S.bank.debt)) S.bank.debt = 0; }
  };
  // 4. switching to real Thai time re-anchored the calendar to today's date even when the game date was already ahead of it (a fast game runs
  //    months ahead of the real calendar): the date jumped back up to a year and everyone's age dropped by one. The calendar must never go backwards:
  //    keep the later anchor, the game then simply stays ahead of the real date and the clock keeps following the Thai time of day.
  if (typeof TimeMode !== 'undefined' && TimeMode.set) {
    const _set = TimeMode.set.bind(TimeMode);
    TimeMode.set = function (k) {
      const c = S && S.v36 && S.v36.cal, before = c && typeof c.start === 'number' ? c.start : null;
      const r = _set(k);
      const c2 = S && S.v36 && S.v36.cal;
      if (before != null && c2 && typeof c2.start === 'number' && c2.start < before) { c2.start = before; if (UI && UI.hud) try { UI.hud(); } catch (e) { } }
      return r;
    };
  }
  // the anchor is also remembered in the save, so a boot in real-time mode (which re-anchors before this file runs) cannot move the date back either
  const calGuard = () => {
    const c = S && S.v36 && S.v36.cal; if (!c || typeof c.start !== 'number') return;
    const a = S.v38 = S.v38 || {};
    if (typeof a.calMax === 'number' && c.start < a.calMax) c.start = a.calMax; else a.calMax = c.start;
  };
  window.Audit38 = { syncQuality, syncRecipes, sane, calGuard, lastMoney: 0 };
  try { calGuard(); } catch (e) { }
  syncQuality(); syncRecipes();
  if (typeof newDay === 'function') { const _nd = newDay; newDay = function () { sane(); const r = _nd.apply(this, arguments); syncQuality(); sane(); calGuard(); return r; }; }
  if (typeof saveGame === 'function') { const _sg = saveGame; saveGame = function () { sane(); calGuard(); return _sg.apply(this, arguments); }; }
});
