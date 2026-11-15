'use strict';
// ---------- v240_phoneland: the in-game phone in LANDSCAPE on iPads and notebooks ----------
// On a wide screen (landscape, at least 900 px wide, not a phone) the phone becomes a two-pane window instead of a narrow portrait sheet:
//   left  = the launcher (clock, search, category tiles, emergency numbers) that stays visible
//   right = what you opened: a welcome page with shortcuts, the apps of a category, or the app itself
// Phones and iPads held upright keep the old single-column layout. Nothing else changes: the same handlers (data-a="app" / "pcat"), the same app pages.
V23.add('v240_phoneland', () => {
  if (typeof Phone === 'undefined' || !Phone.render || typeof APPS === 'undefined') return;
  const E = s => (typeof esc === 'function' ? esc(s) : String(s));
  const P = { force: null };
  const landscape = () => P.force != null ? !!P.force : (innerWidth >= 900 && innerWidth > innerHeight && !document.body.classList.contains('ph'));
  const parse = h => new DOMParser().parseFromString('<body>' + h + '</body>', 'text/html').body;

  if (!document.getElementById('phl-style')) {
    const st = document.createElement('style'); st.id = 'phl-style';
    st.textContent = `
      html body #modal.phone.phl .mbox, html body.phone189 #modal.phone.phl .mbox, html body.ipad.ipm174 #modal.phone.phl .mbox, html body.phone189.ipad-land #modal.phone.phl .mbox { width: min(1120px, calc(96vw / var(--phlz, 1))) !important; height: min(calc((100dvh - 24px) / var(--phlz, 1)), 780px) !important; max-height: none !important; }   /* the game's UI scale (zoom) also multiplies the box, so it is divided out */
      #modal.phone.phl #mBody { flex: 1 1 auto; min-height: 0; display: flex; padding: 8px 18px 18px; overflow: hidden; }
      .phl { display: grid; grid-template-columns: minmax(300px, 370px) minmax(0, 1fr); gap: 18px; width: 100%; height: 100%; min-height: 0; }
      .phl-side, .phl-main { min-height: 0; overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; border-radius: 18px; border: 1px solid var(--line); }
      .phl-side { background: rgba(255,255,255,.05); padding: 12px 12px 12px; display: flex; flex-direction: column; overflow: hidden; }
      .phl-sidehead { flex: 0 0 auto; }
      .phl-scroll { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; padding-right: 2px; }
      .phl-sosbar { flex: 0 0 auto; border-top: 1px solid var(--line); margin-top: 8px; padding-top: 10px; }
      .phl-sosbar .ph-sos { margin-top: 0; }
      .phl-main { background: rgba(0,0,0,.18); padding: 16px 18px 20px; }
      .phl .ph-top { font-size: 14px; color: var(--ink); margin-bottom: 10px; }
      .phl .dim, .phl .lead { color: rgba(244,247,238,.88); font-size: 14px; line-height: 1.5; }
      .phl .btn { font-size: 14.5px; }
      .phl h5 { font-size: 16px; margin: 16px 0 8px; }
      .phl-side #phSearch { font-size: 15px; padding: 10px 12px; width: 100%; box-sizing: border-box; }
      .phl-side .apps { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px 8px; margin: 10px 0 12px; }
      .phl-main .apps { grid-template-columns: repeat(auto-fill, minmax(124px, 1fr)); gap: 18px 10px; margin: 8px 0 12px; }
      .phl .apps button { font-size: 14px; line-height: 1.3; color: var(--ink); padding: 8px 4px; border-radius: 14px; word-break: break-word; border: 1px solid transparent; }
      .phl .apps button span { width: 58px; height: 58px; font-size: 30px; border-radius: 18px; }
      .phl .apps button:hover { background: rgba(255,255,255,.07); }
      .phl-side .apps button.on { background: rgba(255,207,63,.16); border-color: rgba(255,207,63,.6); }
      .phl-side .ph-sos { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 10px; }
      .phl-side .ph-sos .btn { width: 100%; padding: 10px 4px; }
      .phl-head { display: flex; align-items: center; gap: 12px; margin: 0 0 14px; padding-bottom: 10px; border-bottom: 1px solid var(--line); font-family: var(--font-display); font-size: 19px; line-height: 1.3; }
      .phl-head b { font-weight: 600; min-width: 0; }
      .phl-head .btn { flex: 0 0 auto; }
      .phl-hello .phl-clock { font-family: var(--font-display); font-size: 44px; line-height: 1.1; color: var(--sun); font-variant-numeric: tabular-nums; }
      .phl-hello .phl-date { font-size: 16px; margin: 4px 0 14px; color: var(--ink); }
      .phl-hello .phl-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
      .phl-hello .phl-chip { padding: 6px 12px; border-radius: 999px; background: rgba(255,255,255,.1); font-size: 14px; }
      .phl .msgs, .phl .grid { max-width: 100%; }`;
    document.head.appendChild(st);
  }

  const modal = () => document.getElementById('modal');
  const mark = on => {
    const m = modal(); if (!m) return; m.classList.toggle('phl', !!on && m.classList.contains('phone'));
    try { const mb = m.querySelector('.mbox'), z = mb ? parseFloat(getComputedStyle(mb).zoom) : 1; m.style.setProperty('--phlz', z > 0 && z < 3 ? String(z) : '1'); } catch (e) { }
  };

  const QUICK = ['msgs', 'today', 'map', 'call', 'mbank49', 'company', 'career', 'shop'];
  const hello = () => {
    const unread = Phone.unread ? Phone.unread() : 0, byId = Object.fromEntries(APPS.map(a => [a.id, a]));
    const w = (typeof WEATHER !== 'undefined' && WEATHER[S.weather.type]) ? WEATHER[S.weather.type].i : '';
    const tiles = QUICK.filter(id => byId[id]).map(id => `<button data-a="app" data-v="${id}"><span>${byId[id].i}${id === 'msgs' && unread ? `<i>${unread}</i>` : ''}</span>${E(byId[id].n)}</button>`).join('');
    return `<div class="phl-hello"><div class="phl-clock">${Phone.clock()}</div><div class="phl-date">${typeof RD === 'function' ? RD(S.day) : ''} ${w}</div>
      <div class="phl-chips"><span class="phl-chip">💰 ${typeof baht === 'function' ? baht(S.money) : S.money}</span><span class="phl-chip">✉️ ข้อความใหม่ ${unread}</span></div>
      <h5>ทางลัด</h5><div class="apps">${tiles}</div>
      <p class="dim">เลือกหมวดหมู่ทางซ้ายเพื่อเปิดแอป หรือพิมพ์ค้นหาชื่อแอปในช่องค้นหา</p></div>`;
  };

  const _r = Phone.render.bind(Phone);
  Phone.render = function () {
    if (!landscape()) { mark(false); return _r(); }
    mark(true);
    const app = this.app, cat = this.cat;
    let home = '', appHtml = '', catHtml = '', catTitle = '';
    try {
      this.app = null; this.cat = null; home = _r();
      if (app) { this.app = app; appHtml = _r(); }
      else if (cat) { this.cat = cat; const pop = parse(_r()).querySelector('.pc59'); if (pop) { catTitle = (pop.querySelector('.pc59h b') || {}).textContent || ''; const ap = pop.querySelector('.apps'); catHtml = ap ? ap.innerHTML : ''; } }
    } finally { this.app = app; this.cat = cat; }
    // other modules put a few single-app tiles (e.g. the bank) in a separate row: they join the category grid so the launcher is one even grid
    try {
      const d = parse(home), grids = [...d.querySelectorAll('.apps')], main = d.querySelector('#phCats') || grids[grids.length - 1];
      if (main && grids.length > 1) { const first = main.firstChild; for (const g of grids) if (g !== main) { while (g.firstChild) main.insertBefore(g.firstChild, first); g.remove(); } }
      // clock + search stay at the top and the emergency numbers at the bottom; only the tiles scroll
      const top = d.querySelector('.ph-top'), search = d.querySelector('#phSearch'), res = d.querySelector('#phRes'), sos = d.querySelector('.ph-sos');
      if (main && top && search) home = `<div class="phl-sidehead">${top.outerHTML}${search.outerHTML}</div><div class="phl-scroll">${res ? res.outerHTML : ''}${main.outerHTML}</div>${sos ? `<div class="phl-sosbar">${sos.outerHTML}</div>` : ''}`;
    } catch (e) { }
    // the tile of the category (or app) that is open is highlighted
    let openCat = cat;
    if (app && window.Phone59 && Phone59.CATS) { const c = Phone59.CATS.find(x => x[3].includes(app)); if (c) openCat = c[0]; }
    if (openCat) home = home.replace(`data-a="pcat" data-v="${openCat}"`, `data-a="pcat" data-v="${openCat}" class="on"`);
    let right;
    if (app) {
      const a = APPS.find(x => x.id === app) || {};
      const body = appHtml.replace(/^\s*<div class="ph-top">[\s\S]*?<\/div>/, '').replace(/<button class="btn ghost ph-back"[^>]*>[\s\S]*?<\/button>/, '');
      right = `<div class="phl-head"><button class="btn ghost" data-a="app" data-v="">‹ กลับ</button>${a.n ? `<b>${a.i || ''} ${E(a.n)}</b>` : ''}</div>${body}`;
    } else if (cat && catHtml) right = `<div class="phl-head"><b>${E(catTitle)}</b><button class="btn ghost" data-a="pcat" data-v="">✕ ปิด</button></div><div class="apps">${catHtml}</div>`;
    else right = hello();
    return `<div class="phl"><aside class="phl-side">${home}</aside><section class="phl-main">${right}</section></div>`;
  };

  // v242: choosing a category on the left while an app is open shows that category on the right straight away (no need to press back first)
  { const _pc = UI.H.pcat; UI.H.pcat = function (d) { if (landscape() && d && d.v) { Phone.app = null; Phone.msgCat = null; } return _pc.apply(this, arguments); }; }
  // the window class follows the screen (also when an iPad is turned while the phone is open)
  { const _o = Phone.open.bind(Phone); Phone.open = function () {
    const r = _o.apply(this, arguments); mark(landscape());
    try { const oc = UI.cur && UI.cur.onClose; if (UI.cur) UI.cur.onClose = function () { try { const m = modal(); if (m) { m.classList.remove('phl'); m.style.removeProperty('--phlz'); } } catch (e) { } return oc && oc.apply(this, arguments); }; } catch (e) { }
    return r; }; }
  let was = landscape();
  const sync = () => { const l = landscape(), m = modal(); if (!m || !m.classList.contains('phone')) { was = l; return; } mark(l); if (l !== was) { was = l; try { UI.renderBody(); } catch (e) { } } };
  addEventListener('resize', () => setTimeout(sync, 80)); addEventListener('orientationchange', () => setTimeout(sync, 400));
  window.PhoneLand240 = P; P.landscape = landscape;
});
