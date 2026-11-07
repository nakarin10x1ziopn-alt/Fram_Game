'use strict';
// ---------- v180_orchardfix: bananas and papaya are fruit TREES (they go in the orchard pits); smaller guide pop-ups on iPad ----------
//  * the banana (3 kinds) and papaya were sold as ordinary "fruit plants" for the vegetable plots, but a banana / papaya is a tree: pressing a pit with one in the bag only showed a guide that did not list it.
//    They are now pit trees (like mango): sold in the "ต้นกล้าไม้ผล" tab as "ต้นกล้า...", planted in the orchard pits, harvested 3 at a time again and again.
//    Plants already growing in a vegetable plot keep growing and can be harvested there as before.
//  * the garden guide lists the saplings in the bag with a "plant into an empty pit" button
//  * iPad only: the tutorial hint, the action prompt and the guide windows were too big (the whole-screen iPad zoom made them up to 1.2x); they are smaller now. Other devices are unchanged.
V23.add('v180_orchardfix', () => {
  if (typeof CROPS === 'undefined' || typeof ITEMS === 'undefined') return;
  const PIT = { banana: 0.9, namwabanana: 0.9, eggbanana: 0.9, papaya: 0.8 };
  for (const id in PIT) {
    const c = CROPS[id]; if (!c) continue;
    Object.assign(c, { tree: true, pit: 1, grp: 'tree', shape: 'palm', size: PIT[id], fpos: 'crown', yield: 3 }); if (!c.regrow) c.regrow = 8;
    if (ITEMS['seed_' + id]) { ITEMS['seed_' + id].n = 'ต้นกล้า' + c.n; ITEMS['seed_' + id].badge = '🌱'; }
  }
  // plants of these kinds that already stand in a vegetable plot keep their field model
  if (typeof Models !== 'undefined') { const _c = Models.cropOne; Models.cropOne = function (type, stage, seed = 1) { const c = CROPS[type]; if (c && c.pit && c.look && window.Crops2) return Crops2.plant(type, stage, seed); return _c.apply(this, arguments); }; }
  // shops: the four seed items move from the "ผลไม้" tab to the "ต้นกล้าไม้ผล" tab
  const SK = Object.keys(PIT).map(k => 'seed:' + k);
  const move = () => {
    if (typeof SHOPS === 'undefined') return;
    for (const sid in SHOPS) {
      const tabs = SHOPS[sid].tabs || [], dst = tabs.find(t => /ต้นกล้าไม้ผล/.test(t.n || '')); if (!dst) continue;
      for (const t of tabs) {
        if (t === dst || !/ผลไม้|ผัก/.test(t.n || '')) continue;
        const had = t.items.filter(k => SK.includes(k)); if (!had.length) continue;
        t.items = t.items.filter(k => !SK.includes(k));
        for (const k of had) if (!dst.items.includes(k)) dst.items.push(k);
        for (const x of [t, dst]) if (/\(\d+\)/.test(x.n)) x.n = x.n.replace(/\(\d+\)/, '(' + x.items.length + ')');
      }
      // a shop with no fruit tab but a tree tab still gets them once
      for (const k of SK) if (dst && !dst.items.includes(k) && tabs.some(t => t !== dst && t.items.includes(k))) { for (const t of tabs) t.items = t.items.filter(x => x !== k); dst.items.push(k); }
    }
  };
  move(); setTimeout(move, 3000); setTimeout(move, 12000);
  { const _s = UI.shop.bind(UI); UI.shop = function (id) { try { move(); } catch (e) { } return _s(id); }; }

  // ---------- iPad only: smaller tutorial hint, action prompt and guide windows ----------
  const css = document.createElement('style'); css.id = 'orchardfix180';
  css.textContent = `
body.ipad #tut { zoom: 1 !important; font-size: 12.5px !important; line-height: 1.35 !important; padding: 6px 10px !important; gap: 8px !important; border-radius: 11px !important; max-width: min(430px, 58vw) !important; bottom: calc(118px + env(safe-area-inset-bottom, 0px)) !important; }
body.ipad #tut .btn { min-height: 28px !important; padding: 3px 10px !important; font-size: 12px !important; }
body.ipad #prompt { zoom: 1 !important; font-size: 12.5px !important; padding: 5px 11px !important; max-width: min(480px, 64vw) !important; white-space: normal !important; text-align: center; line-height: 1.3; }
body.ipad .mbox { font-size: 0.93em !important; width: min(680px, 100%) !important; }
body.ipad #modal.wide .mbox { width: min(880px, 100%) !important; }
body.ipad #modal.side .mbox { width: min(400px, 100%) !important; }
body.ipad #modal.phone .mbox { width: min(540px, 100%) !important; }
body.ipad-land #modal.phone .mbox { width: min(470px, 58vw) !important; }
body.ipad .mbox h3, body.ipad .mbox .mh h3 { font-size: 1.05em !important; }
body.ipad .mbox .lead { font-size: 0.95em !important; }
body.ipad #modal .mbox .btn { font-size: 0.92em !important; }`;
  document.head.appendChild(css);
  window.OrchardFix180 = { PIT, move };
});
