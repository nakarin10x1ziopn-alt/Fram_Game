'use strict';
// ---------- v253: the in-game phone keeps where you were and is easier to tap ----------
//  Before: every redraw of the phone window rebuilt it from scratch, so the left launcher jumped back to the top when you closed a category on the right,
//  jumped to the highlighted tile on every redraw, and in the single-column phone the home list went back to the top after leaving an app.
//  Now: the launcher keeps its scroll position; each view (an app, or a category on the right) remembers its own scroll position and gets it back when you return to it;
//  the highlighted tile is only scrolled into view when it is really out of sight.
//  Touch: no double-tap zoom or tap delay, inputs are 16 px (iOS stops zooming the page when you tap a field), and the buttons keep a finger-sized target.
V23.add('v253_phonefix', function () {
  if (typeof UI === 'undefined' || typeof Phone === 'undefined' || !UI.renderBody) return;
  if (!document.getElementById('pf253')) {
    const st = document.createElement('style'); st.id = 'pf253';
    st.textContent = `
      #modal.phone, #modal.phone * { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
      #modal.phone input, #modal.phone select, #modal.phone textarea { font-size: 16px; }
      #modal.phone .phl-side, #modal.phone .phl-main, #modal.phone .phl-scroll, #modal.phone .pc59 { overscroll-behavior: contain; -webkit-overflow-scrolling: touch; }
      @media (pointer: coarse) {
        #modal.phone .btn { min-height: 44px; }
        #modal.phone .apps button { min-height: 86px; }
        #modal.phone .card[data-a] { min-height: 56px; }
      }`;
    document.head.appendChild(st);
  }
  const isPhone = () => { const m = document.getElementById('modal'); return !!(m && m.classList.contains('phone') && m.classList.contains('show')); };
  let SAVE = {}, prevKey = null, prevMain = null, prevCat = null;
  const _rb = UI.renderBody.bind(UI);
  UI.renderBody = function () {
    if (!isPhone()) { SAVE = {}; prevKey = null; prevMain = null; prevCat = null; return _rb(); }
    const body = document.getElementById('mBody'), side = body.querySelector('.phl-scroll'), main = body.querySelector('.phl-main');
    const sideY = side ? side.scrollTop : null, mainY = main ? main.scrollTop : null, bodyY = body.scrollTop;
    const key = Phone.app || '', mk = (Phone.app || '') + '|' + (Phone.cat || '');
    if (prevKey != null) SAVE['b:' + prevKey] = bodyY;
    if (main && prevMain != null) SAVE['m:' + prevMain] = mainY;
    const r = _rb();
    try {
      const nb = document.getElementById('mBody'), ns = nb.querySelector('.phl-scroll'), nm = nb.querySelector('.phl-main');
      if (ns) {                                                  // two panes: the launcher keeps its place, the right pane remembers each view
        if (sideY != null) ns.scrollTop = sideY;
        if (nm) nm.scrollTop = mk === prevMain ? (mainY || 0) : (SAVE['m:' + mk] || 0);
        const on = ns.querySelector('button.on');                // the open category is only brought into view when it is outside the visible part
        if (on && Phone.cat !== prevCat) { const top = on.offsetTop - ns.offsetTop, bot = top + on.offsetHeight; if (top < ns.scrollTop || bot > ns.scrollTop + ns.clientHeight) ns.scrollTop = Math.max(0, top - ns.clientHeight / 2 + on.offsetHeight / 2); }
      } else if (key !== prevKey) nb.scrollTop = SAVE['b:' + key] || 0;   // one column: home and each app remember their own position
    } catch (e) { console.warn('v253 scroll', e); }
    prevKey = key; prevMain = mk; prevCat = Phone.cat || null;
    return r;
  };
  // the view the phone opened on counts as the first one we know (so leaving it remembers its scroll position)
  { const _o = Phone.open.bind(Phone); Phone.open = function () { const r = _o.apply(this, arguments); SAVE = {}; prevKey = Phone.app || ''; prevMain = (Phone.app || '') + '|' + (Phone.cat || ''); prevCat = Phone.cat || null; return r; }; }
  window.PhoneFix253 = { isPhone, state: () => ({ SAVE, prevKey, prevMain }) };
});
