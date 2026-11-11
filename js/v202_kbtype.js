'use strict';
// ---------- v202_kbtype: typing on iPad - the window no longer jumps back to the top ----------
// The fields are at the bottom of the window. Every time something redrew the window (and some screens re-focus the field on every redraw)
// the list jumped back to the top while you were scrolling to check what you typed.
// Now: (1) a redraw keeps the scroll position and the field you are typing in (cursor too); focusing never scrolls by itself;
// (2) the window fits exactly into the visible area above the keyboard (visualViewport) and scrolls inside itself;
// (3) the picture-resize / scroll-to-top fixes of v201 wait until you stop typing.
V23.add('v202_kbtype', () => {
  const isText = el => !!el && /^(INPUT|TEXTAREA)$/.test(el.tagName || '') && !/^(checkbox|radio|button|range|submit|color)$/.test(el.type || '');
  const typing = () => isText(document.activeElement) || (document.activeElement && document.activeElement.tagName === 'SELECT');
  window.Typing202 = typing;
  const body = () => document.getElementById('mBody');

  // (1) redraw keeps scroll + focus + cursor
  if (window.UI && UI.renderBody && !UI.renderBody.__k202) {
    const orig = UI.renderBody;
    UI.renderBody = function () {
      const mb = body(), ae = document.activeElement;
      const had = mb && ae && mb.contains(ae) && isText(ae);
      let idx = -1, ss = 0, se = 0, val = '', st = mb ? mb.scrollTop : 0;
      if (had) { idx = [...mb.querySelectorAll('input,textarea')].indexOf(ae); try { ss = ae.selectionStart; se = ae.selectionEnd; } catch (e) { } val = ae.value; }
      const f = HTMLElement.prototype.focus;
      HTMLElement.prototype.focus = function (o) { return f.call(this, Object.assign({}, o, { preventScroll: true })); };
      let r; try { r = orig.apply(this, arguments); } finally { HTMLElement.prototype.focus = f; }
      try {
        if (mb) mb.scrollTop = st;
        if (had) {
          const n = [...mb.querySelectorAll('input,textarea')][idx];
          if (n) {
            if (document.activeElement !== n) n.focus({ preventScroll: true });
            try { if (n.value === val) n.setSelectionRange(ss, se); } catch (e) { }
          }
          mb.scrollTop = st;
        }
      } catch (e) { }
      return r;
    };
    UI.renderBody.__k202 = 1;
  }

  // (2) the window fits above the keyboard
  const root = document.documentElement, vv = window.visualViewport;
  const st = document.createElement('style');
  st.textContent = `
  body.kb202 #modal:not(.side){ top:var(--vvt,0px); bottom:auto; height:var(--vvh,100%); align-items:flex-start; padding-top:8px; padding-bottom:8px; }
  body.kb202 #modal:not(.side) .mbox{ max-height:calc(var(--vvh,100vh) - 16px); }
  body.kb202 #mBody{ overscroll-behavior:contain; padding-bottom:40vh; }`;
  document.head.appendChild(st);
  const apply = () => {
    if (!vv) return;
    const open = innerHeight - vv.height > 120;
    root.style.setProperty('--vvh', vv.height + 'px'); root.style.setProperty('--vvt', vv.offsetTop + 'px');
    document.body.classList.toggle('kb202', open);
  };
  if (vv) { vv.addEventListener('resize', apply); vv.addEventListener('scroll', apply); }
  addEventListener('orientationchange', () => setTimeout(apply, 400));

  // (3) first focus in a field: bring it to the middle once; never re-scroll while typing
  document.addEventListener('focusin', e => {
    const t = e.target, mb = body(); if (!isText(t) || !mb || !mb.contains(t)) return;
    setTimeout(() => { apply(); try { const r = t.getBoundingClientRect(), mr = mb.getBoundingClientRect(); if (r.bottom > mr.bottom - 10 || r.top < mr.top) mb.scrollTop += (r.top + r.height / 2) - (mr.top + mr.height / 2); } catch (e) { } }, 350);
  });
  document.addEventListener('focusout', () => setTimeout(apply, 120));
  apply();
});
