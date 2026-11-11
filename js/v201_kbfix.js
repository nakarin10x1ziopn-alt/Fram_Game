'use strict';
// ---------- v201_kbfix: the picture stays the size of the screen after the on-screen keyboard (iPad) ----------
// In the bank (open an account, transfers, any form) the keyboard shrinks the window; when it goes away Safari does not always send the "resize" event, so the 3D view stayed squeezed into the top half of the screen
// (the rest dark green, nothing could be done) for 10-15 seconds. Now: the size is checked every 400 ms and whenever a field loses focus, the page is scrolled back to the top and the normal resize runs at once.
V23.add('v201_kbfix', () => {
  const cv = document.getElementById('c'); if (!cv || typeof THREE === 'undefined') return;
  const v2 = new THREE.Vector2();
  const fit = () => {
    try {
      if (window.Typing202 && Typing202()) return; // typing: leave the layout alone
      const r = G.renderer; if (!r) return;
      r.getSize(v2); const w = innerWidth, h = innerHeight;
      if (Math.abs(v2.x - w) > 1 || Math.abs(v2.y - h) > 1 || Math.abs(cv.clientHeight - h) > 2 || Math.abs(cv.clientWidth - w) > 2) dispatchEvent(new Event('resize'));
    } catch (e) { }
  };
  const back = () => { if (window.Typing202 && Typing202()) return; try { if (scrollY || scrollX) scrollTo(0, 0); } catch (e) { } fit(); };
  const later = () => { for (const ms of [60, 300, 800, 1600]) setTimeout(back, ms); };
  document.addEventListener('focusout', e => { const t = e.target; if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName || '')) later(); }, true);
  if (window.visualViewport) { visualViewport.addEventListener('resize', later); visualViewport.addEventListener('scroll', () => setTimeout(fit, 120)); }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) later(); });
  setInterval(fit, 400);
  window.KbFix201 = { fit, back };
});
