'use strict';
// ---------- v41_bag: one bag button, a paged 4-per-row bag, a held item you can see on the character, and a chest that is clearly not the bag ----------
// STORAGE SYSTEMS (each has one job):
//   🎒 กระเป๋า  S.inv      what you carry. Four tabs: seeds & gear (held in hand) · farm produce · food & processed goods · bought goods. Every cell shows where it came from
//   🧰 หีบ      S.chest    the house storage: produce sent by farm hands and animals lands here, and you can stash things from the bag. Opened at the chest in the house
//   📦 กล่องส่งขาย        sells and removes the item (the bin by the house, the sea market)
//   🧊 ตู้เย็น            opens the bag on the food tab
//   🚿 ถังน้ำ S.can.water / 🌾 รางอาหารสัตว์ S.trough  are quantities, not items
V23.add('v41_bag', () => {
  const PER = 12;                                  // 4 per row × 3 rows
  const HELD_GEAR = ['fert', 'compost', 'sprinkler', 'sprinkler_pro', 'feed'];
  const GROUPS = [
    { k: 'gear', t: '🌱 เมล็ด & อุปกรณ์', hint: 'ของที่ถือไว้ในมือแล้วใช้กับแปลง: เมล็ด ปุ๋ย บัวรดน้ำ คันเบ็ด · เลือกแล้วกด “ถือ” ตัวละครจะถือของนั้น' },
    { k: 'harvest', t: '🌾 ผลผลิตไร่', hint: 'ของที่ได้จากไร่ สัตว์ การตกปลาและการขุดเหมือง · ขายที่กล่องส่งขายหน้าบ้านหรือตลาดริมทะเล' },
    { k: 'food', t: '🍳 อาหาร', hint: 'อาหารที่ทำเอง อาหารสำเร็จรูปที่ซื้อ และของแปรรูป · กินเพื่อเพิ่มพลังงาน' },
    { k: 'bought', t: '🛍️ ของที่ซื้อ', hint: 'ของใช้ เสื้อผ้า อุปกรณ์และของที่ซื้อมาจากร้านหรือสั่งออนไลน์' },
  ];
  const B = { tab: 0, page: {}, sel: null, last: -1, chest: { tab: 0, f: 'all', page: 0, sel: null } };
  const SRC = { crop: 'เก็บจากไร่', product: 'จากสัตว์', fish: 'ตกได้', mineral: 'ขุดได้', artisan: 'แปรรูป', bar: 'แปรรูป', dish: 'ทำเอง', seed: 'ซื้อมา', tool: 'ซื้อมา', part: 'ซื้อมา' };
  const origin = id => { const it = ITEMS[id]; if (!it) return ''; if (id.startsWith('food_')) return 'ซื้อมา'; return SRC[it.cat] || 'ซื้อมา'; };
  const groupOf = id => {
    const it = ITEMS[id]; if (!it) return 'bought';
    if (it.cat === 'seed' || HELD_GEAR.includes(id)) return 'gear';
    if (['crop', 'product', 'fish', 'mineral'].includes(it.cat)) return 'harvest';
    if (it.cat === 'dish' || it.cat === 'artisan' || it.cat === 'bar') return 'food';
    return 'bought';
  };
  const holdable = id => !!(UI.slots && UI.slots.some(s => s.id === id));
  const sortIds = ids => ids.sort((a, b) => (ITEMS[a].n || '').localeCompare(ITEMS[b].n || '', 'th'));
  const listOf = (src, g) => sortIds(Object.keys(src).filter(id => ITEMS[id] && src[id] > 0 && (!g || groupOf(id) === g)));

  // ===================== CSS =====================
  const css = document.createElement('style');
  css.textContent = `
#bInv{display:none!important}
#hotbar .slot.bagbtn{width:auto;min-width:120px;padding:0 14px 0 10px;gap:8px;display:flex;align-items:center;height:50px}
#hotbar .slot.bagbtn .si{font-size:26px}#hotbar .slot.bagbtn small{font-size:12px;line-height:1.15;text-align:left;color:var(--ink)}
#hotbar .slot.bagbtn small em{display:block;font-style:normal;color:var(--ink-dim);font-size:10.5px}
#hotbar .slot.bagbtn b{position:static;font-size:12px}#hotbar .slot.bagx{display:none;width:26px;min-width:26px;height:50px;padding:0;font-size:18px;font-weight:700;align-items:center;justify-content:center;color:var(--ink-dim)}@media (hover:hover) and (pointer:fine){#hotbar .slot.bagx{display:flex}}#hotbar .slot.bagbtn.mini{min-width:0;width:50px;padding:0;justify-content:center}
.bg41{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:8px 0}
.bc41{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:2px;padding:8px 4px 6px;border-radius:14px;border:2px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:inherit;min-width:0;min-height:92px;cursor:pointer;font:inherit}
.bc41 .i{font-size:30px;line-height:1.1}.bc41 .n{font-size:11px;line-height:1.2;text-align:center;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;word-break:break-word}
.bc41 .q{position:absolute;right:4px;top:3px;font-size:11px;font-weight:600;background:rgba(0,0,0,.45);border-radius:8px;padding:0 5px}
.bc41 .o{font-size:9.5px;color:var(--ink-dim)}
.bc41.on{border-color:var(--sun);background:rgba(255,207,63,.16)}.bc41.held{border-color:#7ccf5a}
.bc41.held::after{content:'ถืออยู่';position:absolute;left:3px;top:3px;font-size:9px;background:#3d8f2a;border-radius:6px;padding:0 4px}
.bc41.empty{visibility:hidden}
.pg41{display:flex;align-items:center;justify-content:center;gap:12px;margin:4px 0 8px}.pg41 span{font-size:13px;color:var(--ink-dim)}
.dt41{display:flex;gap:12px;padding:10px;border-radius:14px;background:rgba(255,255,255,.07);border:1px solid var(--line);margin:6px 0}
.dt41 .ci{font-size:34px}.dt41 h4{margin:0 0 2px}.dt41 .row{margin-top:6px;flex-wrap:wrap}
.ch41{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0}.ch41 button{padding:4px 10px;border-radius:12px;border:1px solid var(--line);background:rgba(255,255,255,.06);color:inherit;font:inherit;font-size:12px}.ch41 button.on{border-color:var(--sun);background:rgba(255,207,63,.18)}
`;
  document.head.appendChild(css);

  // ===================== 2) the item held in the hand =====================
  const iconTex = (() => { const cache = {}; return e => { if (cache[e]) return cache[e]; const c = document.createElement('canvas'); c.width = c.height = 96; const g = c.getContext('2d'); g.font = '64px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e, 48, 54); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return (cache[e] = t); }; })();
  const mat = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, o || {}));
  const makeHeld = id => {
    const g = new THREE.Group(), it = ITEMS[id] || {};
    const face = (w, h, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: iconTex(it.i || '❔'), transparent: true, depthWrite: false })); m.position.z = z; return m; };
    if (id.startsWith('seed_')) {                                 // seed packet: paper envelope with the crop on it
      const tree = it.badge === '🌱';
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.24, 0.03), mat(0xf1e6c8)); g.add(p);
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.172, 0.05, 0.032), mat(tree ? 0x3f8f3a : 0xc9573a)); band.position.y = 0.095; g.add(band);
      g.add(face(0.13, 0.13, 0.017)); const b = face(0.13, 0.13, -0.017); b.rotation.y = Math.PI; g.add(b);
    } else if (id === 'sprinkler' || id === 'sprinkler_pro') {    // a small metal sprinkler head
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.16, 12), mat(id === 'sprinkler' ? 0x7b8a96 : 0xd9a441, { metalness: 0.5, roughness: 0.4 })); g.add(cyl);
      const top = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), mat(0x3d7fb8)); top.position.y = 0.1; g.add(top);
    } else {                                                        // sack (fertiliser, compost, feed ...)
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.26, 0.11), mat(id === 'compost' ? 0x6b4a2b : id === 'feed' ? 0xd8b25a : 0xe8e0cc)); g.add(s);
      const tie = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.09), mat(0x8c6a3a)); tie.position.y = 0.15; g.add(tie);
      g.add(face(0.14, 0.14, 0.057));
    }
    g.userData.heldId = id; g.position.set(0, -0.4, 0.08); g.rotation.set(-0.3, 0, 0);
    return g;
  };
  const Held = {
    obj: null, id: null,
    clear() { if (this.obj && this.obj.parent) this.obj.parent.remove(this.obj); this.obj = null; this.id = null; },
    refresh() {
      try {
        if (!G.player || !G.player.obj) return;
        const sel = G.sel, want = sel && sel !== 'hand' && sel !== 'can' && sel !== 'rod' && ITEMS[sel] && (sel.startsWith('seed_') || HELD_GEAR.includes(sel)) && S.inv[sel] > 0 ? sel : null;
        const elR = G.player.obj.userData.elR;
        if (!want) { if (this.obj) this.clear(); return; }
        if (this.id !== want || !this.obj || this.obj.parent !== elR) { this.clear(); this.obj = makeHeld(want); this.id = want; elR.add(this.obj); }
        this.obj.visible = !G.driving && !G.inMine;
      } catch (e) { }
    },
  };
  {
    const _rb = rebuildPlayer; rebuildPlayer = function () { Held.obj = null; Held.id = null; const r = _rb.apply(this, arguments); Held.refresh(); return r; };
  }

  // ===================== 1) the single bag button =====================
  { const _hb = UI.hotbar.bind(UI);
    UI.hotbar = function () {
      _hb(); if (!S) return;
      const cur = (UI.slots || []).find(s => s.id === G.sel) || { i: '✋', n: 'มือเปล่า' };
      const hb = $('hotbar'); if (!hb) return;
      // v170: the watering can sits beside the bag (its own button: tap to hold it / put it away); on a laptop / PC the bar has a small button that folds it down to two icons
      let fold = false; try { fold = localStorage.getItem('raisukjai_hbfold') === '1'; } catch (e) { }
      const capW = (() => { try { return CAN_CAP[S.up.can - 1]; } catch (e) { return ''; } })(), cw = S.can ? S.can.water : 0, canOn = G.sel === 'can';
      hb.classList.toggle('fold', fold);
      hb.innerHTML = fold
        ? `<button class="slot bagbtn on mini" id="bagBtn" title="กระเป๋า (I) · ถือ: ${esc(cur.n)}"><span class="si">🎒</span></button><button class="slot bagbtn mini ${canOn ? 'on' : ''}" id="canBtn" title="บัวรดน้ำ ${cw}/${capW}"><span class="si">🚿</span></button><button class="slot bagx" id="bagX" title="ขยายแถบ">›</button>`
        : `<button class="slot bagbtn on" id="bagBtn" title="กระเป๋า (I)"><span class="si">🎒</span><small>กระเป๋า<em>ถือ: ${cur.i} ${esc(cur.n)}${cur.c != null && cur.id !== 'can' ? ' ×' + cur.c : ''}</em></small></button><button class="slot bagbtn ${canOn ? 'on' : ''}" id="canBtn" title="บัวรดน้ำ — กดเพื่อถือ / เก็บ"><span class="si">🚿</span><small>บัวรดน้ำ<em>น้ำ ${cw}/${capW}</em></small></button><button class="slot bagx" id="bagX" title="ซ่อนแถบให้เล็กลง">×</button>`;
      $('canBtn').onclick = () => { G.sel = G.sel === 'can' ? 'hand' : 'can'; try { Sfx.click(); } catch (e) { } UI.hotbar(); G.tgtT = 0; };
      $('bagX').onclick = e => { e.stopPropagation(); try { localStorage.setItem('raisukjai_hbfold', fold ? '0' : '1'); } catch (x) { } UI.hotbar(); };
      $('bagBtn').onclick = () => UI.inventory();
      const sn = $('selName'); if (sn) sn.textContent = '';
      Held.refresh();
    };
  }

  // ===================== 3) the bag popup =====================
  const holdName = id => { const s = (UI.slots || []).find(x => x.id === id); return s ? s : (ITEMS[id] ? { i: ITEMS[id].i, n: ITEMS[id].n } : { i: '', n: id }); };
  const detail = (id, src, mode) => {
    const it = ITEMS[id]; if (!it) return '';
    const b = [], n = src[id] || 0;
    if (mode === 'bag') {
      if (it.en) b.push(`<button class="btn" data-a="eat" data-id="${id}">กิน +${it.en}⚡</button>`);
      if (id === 'ladybug') b.push(`<button class="btn" data-a="usegood2" data-id="ladybug">ปล่อยในไร่</button>`);
      if (typeof GOODS !== 'undefined' && GOODS[id] && (GOODS[id].use || GOODS[id].kid)) b.push(`<button class="btn" data-a="usegood" data-id="${id}">ใช้</button>`);
      if (id.startsWith('wear_')) { const w = id.slice(5); b.push(`<button class="btn" data-a="wear" data-id="${w}">${S.wear && S.wear[WEAR[w].slot] === w ? 'ถอดออก' : 'สวมใส่'}</button>`); }
      if (holdable(id)) b.push(`<button class="btn" data-a="bghold" data-id="${id}">${G.sel === id ? '✋ เก็บเข้ากระเป๋า (ถือมือเปล่า)' : '🤚 ถือ'}</button>`);
    } else {
      const a = mode === 'chestBag' ? 'stash' : 'unstash', lb = mode === 'chestBag' ? 'เก็บเข้าหีบ' : 'หยิบเข้ากระเป๋า';
      b.push(`<button class="btn ghost" data-a="${a}" data-id="${id}" data-q="1">${lb} 1</button><button class="btn" data-a="${a}" data-id="${id}" data-q="all">${lb}ทั้งหมด (${n})</button>`);
    }
    let uses = ''; try { uses = Guide.uses(id) || ''; } catch (e) { }
    return `<div class="dt41"><div class="ci">${it.i}</div><div class="cb"><h4>${esc(it.n)} <small>×${n} · ${origin(id)}</small></h4><p class="dim">${esc(uses)}</p><div class="row">${b.join('')}</div></div></div>`;
  };
  const cells = (items, selId, heldFn) => {
    let h = '<div class="bg41">';
    for (const c of items) h += `<button class="bc41 ${selId === c.id ? 'on' : ''} ${heldFn && heldFn(c.id) ? 'held' : ''}" data-a="bgsel" data-id="${c.id}"><span class="i">${c.i}</span><span class="n">${esc(c.n)}</span><span class="q">${c.c != null ? '×' + c.c : ''}</span><span class="o">${c.o || ''}</span></button>`;
    for (let k = items.length; k < PER; k++) h += '<span class="bc41 empty"></span>';
    return h + '</div>';
  };
  const pager = (page, pages, a) => pages > 1 ? `<div class="pg41"><button class="btn ghost" data-a="${a}" data-v="-1" ${page <= 0 ? 'disabled' : ''}>◀</button><span>หน้า ${page + 1} / ${pages}</span><button class="btn ghost" data-a="${a}" data-v="1" ${page >= pages - 1 ? 'disabled' : ''}>▶</button></div>` : '';

  // bag entries of a tab: gear tab starts with what the hand can hold (empty hand, can, rod) that are not items
  const bagEntries = g => {
    const out = [];
    if (g === 'gear') for (const s of UI.slots || []) if (!ITEMS[s.id] || !S.inv[s.id]) out.push({ id: s.id, i: s.i, n: s.n, c: s.c, o: s.id === 'hand' ? '' : 'อุปกรณ์', pseudo: 1 });
    for (const id of listOf(S.inv, g)) out.push({ id, i: ITEMS[id].i, n: ITEMS[id].n, c: S.inv[id], o: origin(id) });
    return out;
  };
  UI.inventory = function (filter) {
    const tab0 = filter === 'food' ? 2 : 0;
    UI.open('🎒 กระเป๋า', GROUPS.map(g => g.t), tab => {
      if (tab !== B.last) { B.last = tab; B.page[tab] = 0; B.sel = null; }
      const g = GROUPS[tab], list = bagEntries(g.k), pages = Math.max(1, Math.ceil(list.length / PER));
      const pg = B.page[tab] = Math.max(0, Math.min(pages - 1, B.page[tab] || 0));
      let h = `<p class="lead dim">${g.hint}</p>`;
      if (g.k === 'gear') h += `<p class="dim">🚿 บัวรดน้ำ ${S.can.water}/${CAN_CAP[S.up.can - 1]} · 🐄 อาหารสัตว์ในราง ${S.trough}</p>`;
      const sel = list.find(c => c.id === B.sel);
      if (sel) h += sel.pseudo ? `<div class="dt41"><div class="ci">${sel.i}</div><div class="cb"><h4>${esc(sel.n)}</h4><p class="dim">อุปกรณ์ประจำตัว ไม่ถูกใช้หมด</p><div class="row"><button class="btn" data-a="bghold" data-id="${sel.id}">${G.sel === sel.id ? 'ถืออยู่แล้ว' : '🤚 ถือ'}</button></div></div></div>` : detail(sel.id, S.inv, 'bag');
      else h += '<p class="dim">แตะที่ของเพื่อดูรายละเอียดและเลือกการใช้งาน</p>';
      if (!list.length) return h + '<p class="empty">ยังไม่มีของในหมวดนี้</p>';
      h += cells(list.slice(pg * PER, pg * PER + PER), B.sel, id => G.sel === id) + pager(pg, pages, 'bgpg');
      h += `<div class="row end"><button class="btn ghost" data-a="bginfo">ℹ️ ที่เก็บของในเกม</button></div>`;
      return h;
    }, { tab: tab0 });
    B.last = -1; B.sel = null; UI.renderBody();
  };
  UI.H.bgsel = d => { B.sel = B.sel === d.id ? null : d.id; };
  UI.H.bgpg = d => { const t = UI.cur ? UI.cur.tab : 0; B.page[t] = (B.page[t] || 0) + (+d.v || 0); B.sel = null; };
  UI.H.bghold = d => {
    const id = d.id; if (G.sel === id && id !== 'hand') G.sel = 'hand'; else G.sel = id;
    const h = holdName(G.sel); Sfx.click(); UI.hotbar(); UI.close(); UI.toast(G.sel === 'hand' ? 'เก็บของแล้ว ตอนนี้มือเปล่า' : `ถือ ${h.n} แล้ว`, h.i || '🤚');
  };
  UI.H.use = d => UI.H.bghold(d);               // the old “ถือใช้” button everywhere does the same
  UI.H.bginfo = () => UI.open('ที่เก็บของในเกม', null, () => `<div class="grid">${[
    ['🎒', 'กระเป๋า', 'ของที่ติดตัว กดปุ่มกระเป๋าเพื่อเปิด มี 4 หมวด: เมล็ด/อุปกรณ์ · ผลผลิตไร่ · อาหาร · ของที่ซื้อ'],
    ['🧰', 'หีบในบ้าน', 'คลังเก็บของ ผลผลิตที่ลูกจ้างเก็บและของจากสัตว์จะมาลงที่หีบ เปิดที่หีบในบ้านเพื่อเก็บ/หยิบของ'],
    ['📦', 'กล่องส่งขาย', 'ขายแล้วของหายจากกระเป๋าทันที (หน้าบ้านหรือตลาดริมทะเล ราคาดีกว่า 50%)'],
    ['🧊', 'ตู้เย็น / โต๊ะอาหาร', 'เปิดกระเป๋าที่หมวดอาหาร เลือกกินเพื่อเพิ่มพลังงาน'],
    ['🚿', 'ถังบัวรดน้ำ & รางอาหารสัตว์', 'เป็นปริมาณ ไม่ใช่ของในกระเป๋า เติมน้ำที่บ่อ/ก๊อก เติมอาหารสัตว์ที่ราง'],
  ].map(r => `<div class="card"><div class="ci">${r[0]}</div><div class="cb"><h4>${r[1]}</h4><p class="dim">${r[2]}</p></div></div>`).join('')}</div><div class="row end"><button class="btn" data-a="bgback">กลับกระเป๋า</button></div>`);
  UI.H.bgback = () => UI.inventory();

  // ===================== 4) the chest: its own screen, never mixed up with the bag =====================
  UI.chest = function () {
    const C = B.chest; C.sel = null; C.page = 0;
    UI.open('🧰 หีบเก็บของ', ['🧰 ของในหีบ', '🎒 ของในกระเป๋า'], tab => {
      if (tab !== C.tab) { C.tab = tab; C.page = 0; C.sel = null; }
      const inChest = tab === 0, src = inChest ? S.chest : S.inv, mode = inChest ? 'chest' : 'chestBag';
      let ids = listOf(src, C.f === 'all' ? null : C.f);
      const total = Object.keys(src).filter(id => ITEMS[id] && src[id] > 0).length;
      let h = `<p class="lead dim">${inChest ? 'หีบเป็นที่เก็บของในบ้าน ผลผลิตที่ลูกจ้างเก็บและของจากสัตว์จะมาลงที่นี่ หยิบเข้ากระเป๋าเมื่ออยากใช้หรือขาย' : 'ของที่ติดตัวคุณ เลือกของที่ยังไม่ใช้เพื่อเก็บเข้าหีบ'}</p>`;
      h += `<div class="ch41">${[['all', 'ทั้งหมด']].concat(GROUPS.map(g => [g.k, g.t])).map(([k, t]) => `<button class="${C.f === k ? 'on' : ''}" data-a="chfilter" data-v="${k}">${t}</button>`).join('')}</div>`;
      if (inChest && total) h += `<div class="row"><button class="btn ghost" data-a="chall">หยิบทุกอย่างในหีบเข้ากระเป๋า</button></div>`;
      const pages = Math.max(1, Math.ceil(ids.length / PER)), pg = C.page = Math.max(0, Math.min(pages - 1, C.page));
      if (!ids.length) return h + `<p class="empty">${inChest ? 'หีบยังว่างอยู่' : 'ไม่มีของในหมวดนี้'}</p>`;
      const sel = C.sel && ids.includes(C.sel) ? C.sel : null;
      h += sel ? detail(sel, src, mode) : '<p class="dim">แตะที่ของเพื่อเลือกเก็บ/หยิบ</p>';
      h += cells(ids.slice(pg * PER, pg * PER + PER).map(id => ({ id, i: ITEMS[id].i, n: ITEMS[id].n, c: src[id], o: origin(id) })), sel) + pager(pg, pages, 'chpg');
      return h;
    });
  };
  UI.H.chfilter = d => { B.chest.f = d.v; B.chest.page = 0; B.chest.sel = null; };
  UI.H.chpg = d => { B.chest.page += +d.v || 0; B.chest.sel = null; };
  UI.H.chall = () => { let n = 0; for (const id of Object.keys(S.chest)) { const q = S.chest[id]; if (q > 0 && ITEMS[id]) { addItem(id, q); n += q; } delete S.chest[id]; } UI.toast(n ? `หยิบของจากหีบเข้ากระเป๋า ${n} ชิ้น` : 'หีบว่างอยู่', '🎒'); };
  // while the chest is open, taps on a cell select it there (bgsel is shared by both screens)
  { const _sel = UI.H.bgsel; UI.H.bgsel = d => { if (UI.cur && /หีบ/.test(UI.cur.title)) { B.chest.sel = B.chest.sel === d.id ? null : d.id; return; } return _sel(d); }; }
  { for (const k of ['stash', 'unstash']) { const o = UI.H[k]; UI.H[k] = d => { o(d); const q = d.q === 'all'; if (!q || true) { const src = k === 'stash' ? S.inv : S.chest; if (!(src[d.id] > 0)) B.chest.sel = null; } }; } }

  // ===================== audit =====================
  window.Bag41 = {
    groupOf, origin, GROUPS,
    audit() {
      const o = { unknown: [], groups: { gear: 0, harvest: 0, food: 0, bought: 0 }, chest: 0, bad: [] };
      for (const [name, src] of [['inv', S.inv], ['chest', S.chest]]) for (const id in src) {
        if (!(src[id] > 0)) { if (src[id] < 0 || !isFinite(src[id])) o.bad.push(name + ':' + id); continue; }
        if (!ITEMS[id]) { o.unknown.push(name + ':' + id); continue; }
        if (name === 'inv') o.groups[groupOf(id)]++; else o.chest++;
      }
      return o;
    },
    held: Held,
  };
  UI.hotbar();
});
