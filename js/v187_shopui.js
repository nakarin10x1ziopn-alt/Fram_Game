'use strict';
// ---------- v187_shopui: the shop window (iPad / phone / PC) ----------
//  * roomier: wide window, 2-3 columns of item cards on iPad, bigger text and buttons (it was squeezed into one narrow column)
//  * every shop's categories are chips on top ("ทั้งหมด" + each category with its count)
//  * a search box you can really type in: it filters while you type, looks in the name AND the description AND the category of the item, across every category of the shop,
//    and when nothing matches there is a button to search the same words in the online mall (every shop of the game)
//  * each shop window has a "order online from the home computer" button: it opens the online mall already set to THIS shop (and the chosen category)
//  The shop's own list, prices, basket and payment are untouched: the cards are the shop's own cards, only arranged differently.
V23.add('v187_shopui', () => {
  if (typeof UI === 'undefined' || typeof SHOPS === 'undefined') return;
  const E = s => (typeof esc === 'function' ? esc(s) : String(s));
  const S1 = { id: null, q: '', cat: -1, all: [], bar: '' };
  const norm = t => String(t || '').toLowerCase().replace(/\s+/g, ' ').trim();

  const css = document.createElement('style'); css.id = 'v187css';
  css.textContent = `
  #modal.shopwin .mbox { width: min(1100px, 100%) !important; }
  #modal.shopwin #mBody { padding: 6px 16px 20px; }
  #modal.shopwin .grid { grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)); gap: 12px; }
  #modal.shopwin .card { padding: 14px 16px; gap: 14px; border-radius: 18px; }
  #modal.shopwin .card .ci { font-size: 34px; min-width: 52px; height: 52px; }
  #modal.shopwin .card h4 { font-size: 17px; line-height: 1.3; margin: 0 0 4px; }
  #modal.shopwin .card p { font-size: 14px; line-height: 1.5; margin: 0 0 6px; }
  #modal.shopwin .card p.dim { font-size: 13.5px; }
  #modal.shopwin .card .row { gap: 8px; padding-top: 8px; }
  #modal.shopwin .card .btn { min-height: 42px; padding: 8px 14px; font-size: 15px; }
  #modal.shopwin .s187top { position: sticky; top: 0; z-index: 5; background: var(--panel-solid, #183424); padding: 8px 0 6px; margin: 0 -2px; }
  #modal.shopwin .s187top .row { margin-top: 6px; gap: 8px; }
  #modal.shopwin .s187top .btn { min-height: 40px; padding: 7px 14px; font-size: 14.5px; }
  #modal.shopwin #s187q { flex: 1; min-width: 160px; font-size: 16px; padding: 11px 13px; border-radius: 12px; border: 2px solid rgba(255,207,63,.55); background: rgba(0,0,0,.28); color: #fff; }
  #modal.shopwin #s187q::placeholder { color: rgba(255,255,255,.62) !important; }
  #modal.shopwin .c55bar { position: sticky; bottom: 0; }
  @media (max-width: 700px) { #modal.shopwin .grid { grid-template-columns: 1fr; } }`;
  document.head.appendChild(css);

  // any other window removes the roomy shop layout again
  { const _open = UI.open.bind(UI); UI.open = function () { try { const m = document.getElementById('modal'); if (m) m.classList.remove('shopwin'); } catch (e) { } return _open.apply(this, arguments); }; }

  function collect(r0, id) {
    const tabs = SHOPS[id].tabs, out = []; let bar = '';
    tabs.forEach((t, ci) => {
      let h = ''; try { h = r0(ci); } catch (e) { h = ''; }
      const doc = new DOMParser().parseFromString('<div>' + h + '</div>', 'text/html');
      const b = doc.querySelector('.c55bar'); if (b) { bar = b.outerHTML; }
      doc.querySelectorAll('.grid > .card').forEach(el => out.push({ ci, html: el.outerHTML, txt: norm(el.textContent + ' ' + t.n) }));
    });
    return { out, bar };
  }
  const matches = (c, words) => words.every(w => c.txt.includes(w));
  function results() {
    const words = norm(S1.q).split(' ').filter(Boolean);
    const list = S1.all.filter(c => (S1.cat < 0 || c.ci === S1.cat) && matches(c, words));
    const none = !list.length;
    const more = none && S1.q.trim() ? `<div class="row"><button class="btn" data-a="s187mall" data-q="1">💻 ค้นหา “${E(S1.q.trim())}” ในร้านออนไลน์ทุกร้าน (ที่คอมที่บ้าน)</button></div>` : '';
    return `<div class="dim" style="margin:6px 2px">พบ ${list.length} รายการ${S1.q.trim() ? ' สำหรับ “' + E(S1.q.trim()) + '”' : ''}${S1.cat >= 0 ? ' · หมวด ' + E(String(SHOPS[S1.id].tabs[S1.cat].n).replace(/\s*\(\d+\)\s*$/, "")) : ''}</div>` +
      (none ? `<p class="empty">ไม่พบสินค้าที่ตรงกับคำค้น ลองพิมพ์คำอื่น หรือเลือก “ทั้งหมด”</p>${more}` : `<div class="grid">${list.map(c => c.html).join('')}</div>`);
  }
  function hook(id) {
    const c = UI.cur; if (!c || c.s187 || typeof c.render !== 'function' || !SHOPS[id] || !SHOPS[id].tabs || !SHOPS[id].tabs.length) return;
    c.s187 = 1; if (S1.id !== id) { S1.q = ''; S1.cat = -1; } S1.id = id;
    const r0 = c.render; c.tabs = [];
    try { const m = document.getElementById('modal'); m.classList.add('shopwin', 'wide'); } catch (e) { }
    c.render = t => {
      if (window.Cart55 && Cart55.C.view) return r0(c.tab);
      const tabs = SHOPS[id].tabs, col = collect(r0, id); S1.all = col.all = col.out; S1.bar = col.bar;
      const cnt = ci => col.out.filter(x => ci < 0 || x.ci === ci).length;
      const chips = `<div class="row" style="flex-wrap:wrap"><button class="btn ${S1.cat < 0 ? '' : 'ghost'}" data-a="s187cat" data-v="-1">ทั้งหมด (${cnt(-1)})</button>${tabs.map((x, i) => `<button class="btn ${S1.cat === i ? '' : 'ghost'}" data-a="s187cat" data-v="${i}">${E(String(x.n).replace(/\s*\(\d+\)\s*$/, ""))} (${cnt(i)})</button>`).join('')}</div>`;
      return `<div class="s187top"><div class="row"><input id="s187q" type="search" value="${E(S1.q)}" placeholder="🔎 พิมพ์ค้นหาของในร้านนี้ เช่น ข้าว ปุ๋ย โซฟา…" autocomplete="off" autocapitalize="off" spellcheck="false" oninput="UI.H.s187live()" onkeydown="if(event.key==='Enter'){this.blur()}"><button class="btn ghost" data-a="s187clr">✕ ล้าง</button><button class="btn ghost" data-a="s187mall" data-q="0">💻 สั่งออนไลน์ร้านนี้จากคอมที่บ้าน</button></div>${chips}</div><div id="s187res">${results()}</div>${S1.bar}`;
    };
    UI.renderBody();
  }
  { const _shop = UI.shop.bind(UI); UI.shop = function (id) { const r = _shop(id); try { hook(id); } catch (e) { console.warn('v187', e); } return r; }; }
  Object.assign(UI.H, {
    s187live: () => { const el = document.getElementById('s187q'); S1.q = el ? el.value : ''; const r = document.getElementById('s187res'); if (r) r.innerHTML = results(); },
    s187cat: d => { S1.cat = +d.v; try { UI.cur.tab = 0; } catch (e) { } },
    s187clr: () => { S1.q = ''; },
    s187mall: d => { try { if (window.Mall36) Mall36.open(0, { shop: S1.id, cat: S1.cat, q: d && d.q === '1' ? S1.q : '' }); else UI.toast('ร้านออนไลน์ยังเปิดไม่ได้', '💻'); } catch (e) { console.warn('v187 mall', e); } },
  });
  window.ShopUI187 = { S1, results, hook };
});
