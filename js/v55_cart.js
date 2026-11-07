// v55_cart.js: every shop has a basket. Tick as many things as you like (and how many of each), then pay once: one payment method, one cheque or
// transfer for the whole basket, exactly like checking out in real life. "Buy now" for a single item is still there.
V23.add('v55_cart', () => {
  const C = { shop: null, items: {}, view: false, running: false, until: 0 };
  const E = s => (typeof esc === 'function' ? esc(s) : String(s));
  const _toast = UI.toast.bind(UI);
  // while a basket is being delivered, the per-item "bought X" / "stored at" messages are replaced by one summary
  UI.toast = function (t, i) { if (C.running || (performance.now() < C.until && /^(เก็บที่|พัสดุจะมา)/.test(String(t)))) return; return _toast(t, i); };

  const mult = shop => (shop === 'online' ? 1.1 : (typeof shopDiscount === 'function' ? shopDiscount(shop) : 1));
  const isTake = k => k.startsWith('take:');
  // one line of the basket: price, name, whether more than one makes sense
  function info(k) {
    if (k.startsWith('dine:')) { const id = k.slice(5), F = FOODS[id]; return F ? { name: F.n + ' (ทานที่ร้าน)', icon: F.i, unit: F.price, stack: true, dine: id } : null; }
    if (isTake(k)) { const id = k.slice(5), F = FOODS[id]; return F ? { name: F.n, icon: F.i, unit: F.price + 10, stack: true, take: id } : null; }
    let e; try { e = UI.entry(k, C.shop); } catch (x) { return null; } if (!e || !e.name) return null;
    return { name: e.name, icon: e.icon, unit: e.price, stack: !!(e.multi || typeof e.own === 'number'), block: e.block, shop: true, e };
  }
  const lineCost = (k, q) => { const x = info(k); if (!x) return 0; return (x.take || x.dine) ? x.unit * q : Math.round(x.unit * q * mult(C.shop)); };
  const lines = () => Object.keys(C.items).map(k => ({ k, q: C.items[k], x: info(k) })).filter(l => l.x && !l.x.block && l.q > 0);
  const totals = () => { let n = 0, t = 0; const L = lines(); for (const l of L) { n += l.q; t += lineCost(l.k, l.q); } return { n, t, m: L.length }; };

  // ----- decorate the shop window -----
  const baht0 = n => (typeof baht === 'function' ? baht(n) : '฿' + n);
  const ctl = (k, stack) => {
    const q = C.items[k] || 0;
    return q ? `<span class="c55q"><button class="btn ghost" data-a="c55dec" data-k="${E(k)}">−</button><b style="min-width:26px;text-align:center;display:inline-block">${q}</b><button class="btn" data-a="c55inc" data-k="${E(k)}" ${stack ? '' : 'disabled'}>＋</button></span>`
      : `<button class="btn" data-a="c55inc" data-k="${E(k)}">🛒 ใส่ตะกร้า</button>`;
  };
  function bar() {
    const T = totals(); if (!T.n) return '';
    return `<div class="c55bar" style="position:sticky;bottom:0;margin:10px -4px -4px;padding:10px 12px;background:var(--panel-solid,#183424);border-top:2px solid var(--sun,#ffcf3f);border-radius:14px 14px 0 0;z-index:3">
      <div style="font-weight:600">🛒 ${T.m} รายการ · ${T.n} ชิ้น · รวม <span style="color:var(--sun,#ffcf3f)">${baht0(T.t)}</span></div>
      <div class="row" style="margin:6px 0 0"><button class="btn ghost" data-a="c55view">ดูตะกร้า</button><button class="btn ghost" data-a="c55clear">ล้าง</button><button class="btn" data-a="c55pay">💳 ชำระเงินทั้งหมด</button></div></div>`;
  }
  function viewHtml() {
    const L = lines(), T = totals();
    if (!L.length) { C.view = false; return ''; }
    return `<p class="lead">🛒 ตะกร้าของ ${E(((typeof SHOPS !== 'undefined' && SHOPS[C.shop]) || {}).n || 'ร้านค้า')}</p><div class="grid">${L.map(l => `<div class="card"><div class="ci">${l.x.icon}</div><div class="cb"><h4>${E(l.x.name)}</h4><p class="dim">${baht0((l.x.take || l.x.dine) ? l.x.unit : Math.round(l.x.unit * mult(C.shop)))}${l.x.take ? ' (รวมค่ากล่อง)' : ''} × ${l.q} = <b>${baht0(lineCost(l.k, l.q))}</b></p><div class="row">${ctl(l.k, l.x.stack)}<button class="btn ghost" data-a="c55del" data-k="${E(l.k)}">นำออก</button></div></div></div>`).join('')}</div>
      <p class="lead">รวมทั้งหมด <b>${baht0(T.t)}</b> (${T.n} ชิ้น)${C.shop === 'online' ? ' · ร้านออนไลน์บวกค่าส่ง 10%' : ''}</p>
      <div class="row end"><button class="btn ghost" data-a="c55back">← เลือกสินค้าเพิ่ม</button><button class="btn" data-a="c55pay">💳 ชำระเงินทั้งหมด</button></div>`;
  }
  function decorate(html) {
    if (C.view) { const v = viewHtml(); if (v) return v; }
    let h = html;
    // normal shops: the "buy" button of every card gets a basket button next to it
    h = h.replace(/<button class="btn" data-a="buy" data-k="([^"]+)" data-q="1"\s*(disabled)?\s*>([^<]*)<\/button>/g, (m, k, dis, label) => {
      const x = info(k); return ctl(k, x ? x.stack : false) + `<button class="btn ghost" data-a="buy" data-k="${k}" data-q="1">ซื้อเลย ${label}</button>`;
    });
    // restaurants: take-away dishes can be put in the basket too
    h = h.replace(/(<button class="btn ghost" data-a="takeaway" data-id="([^"]+)">)/g, (m, b, id) => ctl('take:' + id, true) + b);
    // eat in: several dishes on one bill
    h = h.replace(/(<button class="btn[^"]*" data-a="(?:v23dine|dine)" data-id="([^"]+)"[^>]*>)/g, (m, b, id) => ctl('dine:' + id, true) + b);
    return h + bar();
  }
  function hook() {
    const c = UI.cur; if (!c || c._c55 || typeof c.render !== 'function') return; c._c55 = 1;
    const r0 = c.render; c.render = t => decorate(r0(t)); UI.renderBody();
  }
  { const _shop = UI.shop.bind(UI); UI.shop = function (id) { C.shop = id; C.items = {}; C.view = false; const r = _shop(id); hook(); return r; }; }
  if (typeof Food !== 'undefined' && Food.open) { const _fo = Food.open.bind(Food); Food.open = function (shop) { if (C.shop !== shop) { C.items = {}; C.view = false; } C.shop = shop; const r = _fo(shop); hook(); return r; }; }

  // ----- basket actions -----
  const inc = k => { const x = info(k); if (!x) return; const q = C.items[k] || 0; if (q && !x.stack) { _toast('สินค้านี้ซื้อได้ชิ้นเดียว', 'ℹ️'); return; } if (x.block) { _toast(x.block, 'ℹ️'); return; } C.items[k] = Math.min(99, q + 1); };
  Object.assign(UI.H, {
    c55inc: d => inc(d.k),
    c55dec: d => { const q = (C.items[d.k] || 0) - 1; if (q > 0) C.items[d.k] = q; else delete C.items[d.k]; },
    c55del: d => { delete C.items[d.k]; },
    c55clear: () => { C.items = {}; C.view = false; },
    c55view: () => { C.view = true; },
    c55back: () => { C.view = false; },
    c55pay: () => checkout(),
  });

  // ----- one payment for everything -----
  function deliver(L) {
    let paid = 0, got = 0; const sh = C.shop, dineL = [];
    for (const l of L) {
      const m0 = S.money;
      if (l.x.dine) { const F = FOODS[l.x.dine], tot = F.price * l.q; if (S.money < tot) continue; S.money -= tot; dineL.push([F, l.q]); paid += tot; got++; continue; }
      if (l.x.take) { for (let i = 0; i < l.q; i++) Food.takeaway(l.x.take); }
      else { UI.shopId = sh; UI.H.buy({ k: l.k, q: l.q }); }
      const spent = m0 - S.money; if (spent > 0) { paid += spent; got++; }
    }
    if (dineL.length) { const n = dineL.reduce((a, d) => a + d[1], 0), en = dineL.reduce((a, d) => a + Math.round(d[0].en * 1.2) * d[1], 0); UI.close(); fade(() => { tick(Math.min(180, 30 * n)); S.energy = Math.min(maxEnergy(), S.energy + en); Prog.add(3 * n); Sfx.coin(); _toast(`นั่งทานอาหาร ${n} จาน อิ่มอร่อย! พลังงาน +${en}`, '🍽️'); }); }
    return { paid, got };
  }
  function checkout() {
    const L = lines(), T = totals(); if (!L.length) return;
    const shopName = ((typeof SHOPS !== 'undefined' && SHOPS[C.shop]) || {}).n || 'ร้านค้า', label = `ตะกร้า ${shopName} (${T.n} ชิ้น)`;
    let res = null;
    const run = () => {
      C.running = true; try { res = deliver(L); } finally { C.running = false; C.until = performance.now() + 900; }
      if (res.got) { const left = L.length - res.got; _toast(`ซื้อ ${res.got} รายการ รวม ${baht0(res.paid)} เรียบร้อย${left ? ` · ซื้อไม่ได้ ${left} รายการ (เงินไม่พอ)` : ''}`, '🛍️'); Object.keys(C.items).forEach(k => { delete C.items[k]; }); C.view = false; try { UI.hotbar(); } catch (e) { } }
      else _toast('ซื้อไม่สำเร็จ เงินไม่พอ', '💸');
    };
    const B = window.Bank49, P = window.Pay49;
    if (B && B.ask && P) {
      if (T.t <= 300 && !B.V().ask && S._c >= T.t) { P.busy = true; try { run(); } finally { P.busy = false; } }
      else B.ask({ amount: T.t, label, payee: shopName, fn: run });
    } else if (S.money < T.t) _toast('เงินไม่พอ', '💸'); else run();
  }
  window.Cart55 = { C, totals, lines, checkout };
});
