'use strict';
// ---------- Choose what you use: every planting spot (plots, orchard, greenhouse, flower garden) and other "use an item"
// actions plant/use exactly what you hold or pick, never "the first thing in the bag" ----------
const ItemPick = {
  // ids: item ids to offer; cb(id) runs with the one the player tapped
  open(title, ids, cb, sub) {
    if (!ids.length) return;
    if (ids.length === 1) return cb(ids[0]);
    this.cb = cb;
    UI.open(title, null, () => `${sub ? `<p class="dim">${sub}</p>` : ''}<div class="grid">${ids.map(id => `<div class="card"><div class="ci">${ITEMS[id].i}</div><div class="cb"><h4>${esc(ITEMS[id].n)} <small>×${count(id)}</small></h4><div class="row"><button class="btn" data-a="ipick" data-id="${id}">เลือก</button></div></div></div>`).join('')}</div>`);
  },
  seeds(tree) { return Object.keys(S.inv).filter(id => id.startsWith('seed_') && S.inv[id] > 0 && CROPS[id.slice(5)] && !!CROPS[id.slice(5)].tree === tree).sort((a, b) => CROPS[a.slice(5)].seed - CROPS[b.slice(5)].seed); },
  init() {
    UI.H.ipick = d => { const cb = this.cb; this.cb = null; UI.close(); if (cb && count(d.id) > 0) cb(d.id); };
    // a picked seed also becomes the item in your hand, so the next plot plants the same thing
    const hold = id => { if (ITEMS[id] && UI.slots && UI.slots.some(s => s.id === id)) { G.sel = id; UI.hotbar(); } };

    // field plots
    const _plot = plotAct;
    plotAct = function (i) {
      const p = S.plots[i], r = _plot(i);
      if (p.c || G.sel.startsWith('seed_')) return r;
      const L = ItemPick.seeds(false); if (L.length < 2) return r;
      return { icon: '🌱', label: 'ปลูก... (เลือกเมล็ดพันธุ์)', fn: () => ItemPick.open('เลือกเมล็ดที่จะปลูก', L, id => { hold(id); plant(i, id.slice(5)); }, 'เคล็ดลับ: เลือกเมล็ดจากแถบเครื่องมือด้านล่างไว้ก่อน จะปลูกได้ทันที') };
    };
    // orchard pits
    const _tree = treeAct;
    treeAct = function (i) {
      const p = S.trees[i], r = _tree(i);
      if (p.c || (G.sel.startsWith('seed_') && CROPS[G.sel.slice(5)] && CROPS[G.sel.slice(5)].tree)) return r;
      const L = ItemPick.seeds(true); if (L.length < 2) return r;
      return { icon: '🌱', label: 'ปลูกไม้ผล... (เลือกต้นกล้า)', fn: () => ItemPick.open('เลือกต้นกล้าที่จะปลูก', L, id => { hold(id); plantTree(i, id.slice(5)); }) };
    };
    // greenhouse and flower garden
    const _slot = Farm2.slotAct.bind(Farm2);
    Farm2.slotAct = (k, i, h) => {
      const arr = () => k === 'gh' ? Farm2.ghHouses()[h || 0].s : Farm2.st()[k];   // h = which greenhouse
      const s = arr()[i]; if (s.c) return _slot(k, i, h);
      const put = id => { const f = arr()[i]; if (f.c || !takeItem(id)) return; f.c = k === 'gh' ? id.slice(5) : id.slice(6); f.g = 0; playAct('plant', 1); Farm2.refresh(); };
      if (k === 'gh') {
        const held = G.sel.startsWith('seed_') && CROPS[G.sel.slice(5)] && !CROPS[G.sel.slice(5)].tree ? G.sel : null;
        const L = held ? [held] : ItemPick.seeds(false);
        if (!L.length) return _slot(k, i, h);
        return { icon: '🌱', label: held ? `ปลูก${ITEMS[held].n} (โตได้ทุกฤดู ไม่ต้องรดน้ำ)` : L.length > 1 ? 'ปลูกในโรงเรือน... (เลือกเมล็ด)' : `ปลูก${ITEMS[L[0]].n} (โตได้ทุกฤดู ไม่ต้องรดน้ำ)`, fn: () => ItemPick.open('เลือกเมล็ดปลูกในโรงเรือน', L, put) };
      }
      const L = Object.keys(FLOWERS).map(f => 'fseed_' + f).filter(id => count(id) > 0);
      if (!L.length) return _slot(k, i);
      return { icon: '🌸', label: L.length > 1 ? 'ปลูกดอกไม้... (เลือกพันธุ์)' : `ปลูก${ITEMS[L[0]].n}`, fn: () => ItemPick.open('เลือกดอกไม้ที่จะปลูก', L, put) };
    };
    // offering crops to another player through the co-op
    const _sell = Coop.sell.bind(Coop);
    Coop.sell = id => {
      const L = Object.keys(S.inv).filter(k => ITEMS[k] && ITEMS[k].cat === 'crop' && S.inv[k] >= 5);
      if (L.length < 2) return _sell(id);
      ItemPick.open('เลือกผลผลิตที่จะเสนอขาย (ครั้งละ 5 ชิ้น)', L, it => {
        // the original offers the first crop with 5+; temporarily present only the chosen one
        const keep = {}; for (const k of L) if (k !== it) { keep[k] = S.inv[k]; S.inv[k] = 0; }
        try { _sell(id); } finally { for (const k in keep) S.inv[k] = keep[k]; UI.hotbar(); }
      });
    };
  },
};
