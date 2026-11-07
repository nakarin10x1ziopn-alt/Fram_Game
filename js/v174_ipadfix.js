'use strict';
// ---------- v174_ipadfix: (the 🗺️ button is removed everywhere) iPad only - smaller notifications, and the notification bell no longer sits on top of the map button ----------
//  * notifications: the iPad whole-screen HUD zoom (up to 1.2x) also blew the toasts up (about 17 px text in a 550 px wide box covering the picture). On iPad they are now 12.5 px,
//    at most 2 lines each, at most 2 at a time, and sit in the free strip between the status panel and the bell (the full text of every message is still in the bell's list)
//  * bell (🔔): it used to be fixed at the very top right corner, on top of the map button of the right-hand column. On iPad it now sits just to the left of the mini map
//    (never over any button) and follows the layout when the iPad is turned or the window changes
V23.add('v174_ipadfix', () => {
  const css = document.createElement('style'); css.id = 'ipadfix174';
  css.textContent = `
/* the 🗺️ button is gone: the mini map (tap it) and the M key open the same big map */
#bMap { display: none !important; }
body.ipad #toasts, body.ipad.ipm174 #toasts { zoom: 1 !important; transform: none !important; left: var(--t174l, 50%) !important; top: var(--t174t, 8px) !important; width: var(--t174w, min(380px, 60vw)) !important; max-width: none !important; align-items: stretch !important; gap: 4px !important; }
body.ipad #toasts .toast, body.ipad.ipm174 #toasts .toast { font-size: 12.5px !important; line-height: 1.3 !important; padding: 5px 10px !important; border-radius: 11px !important; gap: 7px !important; max-width: 100% !important; }
body.ipad #toasts .toast .ti { font-size: 15px !important; }
body.ipad #toasts .toast > span:last-child { overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; word-break: break-word; }
body.ipad #toasts .toast:nth-last-child(n+3), body.ipad.ipm174 #toasts .toast:nth-last-child(n+3) { display: none !important; }
/* a window leaves a free strip at the top for the bell and the notifications, so nothing sits on a window's header */
body.ipad.ipm174 #modal { padding-top: 54px !important; }
body.ipad.ipm174 .mbox, body.ipad.ipm174 #modal.side .mbox, body.ipad.ipm174 #modal.phone .mbox { max-height: calc(100dvh - 72px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) !important; }
body.ipad #tlog95 { width: 36px; height: 36px; font-size: 18px; }
body.ipad #tlogbox95 { width: min(360px, calc(100vw - 24px)); font-size: 13px; }
body.ipad #tlogbox95 p { font-size: 12.5px; }`;
  document.head.appendChild(css);

  const vis = e => !!e && getComputedStyle(e).display !== 'none' && !e.hidden && e.getBoundingClientRect().width > 1;
  const rect = id => { const e = document.getElementById(id); return vis(e) ? e.getBoundingClientRect() : null; };
  let last = '';
  function place() {
    const b = document.body, bell = document.getElementById('tlog95'), box = document.getElementById('tlogbox95'), T = document.getElementById('toasts'); if (!bell || !T) return;
    if (!b.classList.contains('ipad')) {   // not an iPad: everything as before
      if (last) { bell.style.removeProperty('right'); bell.style.removeProperty('top'); bell.style.removeProperty('left'); if (box) { box.style.removeProperty('right'); box.style.removeProperty('top'); } for (const k of ['--t174l', '--t174t', '--t174w']) b.style.removeProperty(k); last = ''; }
      return;
    }
    const W = innerWidth, tr = rect('hudTR'), tl = rect('hudTL'), tg = rect('hudToggle'), mini = rect('mini'), pad = 8;
    const safeT = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sat')) || 0;
    // bell: left of the mini map (hudTR holds the mini map and the button column), top aligned with it
    const modal = b.classList.contains('ipm174'), bw = 36, bellRight = modal ? 8 : (tr ? W - (mini ? mini.left : tr.left) + pad : 12), bellTop = modal ? 8 : (tr ? tr.top : 12);
    bell.style.right = Math.round(bellRight) + 'px'; bell.style.top = Math.round(bellTop) + 'px'; bell.style.left = 'auto';
    if (box) { box.style.right = Math.round(Math.max(8, bellRight - 0)) + 'px'; box.style.top = Math.round(bellTop + bw + 6) + 'px'; }
    // notifications: the strip between the status panel (and its toggle) and the bell
    // the strip for notifications: between the status panel and the bell; the small FPS pill in the middle of the top edge is stepped around (to its right when there is room, otherwise just below it)
    const fp = rect('fps'), base = modal ? 8 : Math.max(tl ? tl.right : 0, tg ? tg.right : 0, 0) + pad, right = W - bellRight - bw - pad;
    let left = base, top = bellTop; if (fp && fp.right + pad > left && fp.left < right) { if (right - (fp.right + pad) >= 240) left = fp.right + pad; else top = Math.max(bellTop, fp.bottom + 4); }
    const avail = Math.max(220, right - left), w = Math.min(400, avail), x = Math.round(left + Math.max(0, (avail - w) / 2));
    b.style.setProperty('--t174l', x + 'px'); b.style.setProperty('--t174w', Math.round(w) + 'px'); b.style.setProperty('--t174t', Math.round(top) + 'px');
    last = x + '|' + w + '|' + bellRight;
  }
  // follow the window (a normal window or a side panel) the moment it opens or closes
  try { const M = document.getElementById('modal'); if (M) new MutationObserver(() => { document.body.classList.toggle('ipm174', M.classList.contains('show')); place(); }).observe(M, { attributes: true, attributeFilter: ['class'] }); } catch (e) { }
  addEventListener('resize', () => setTimeout(place, 80)); addEventListener('orientationchange', () => setTimeout(place, 450)); setInterval(place, 800); setTimeout(place, 300);
  window.Ipad174 = { place };
});
