// v88_ipad.js: iPad layout (made for the iPad 11-inch, A16 / 11th gen: 2360x1640 px panel at 264 ppi = 820x1180 CSS px portrait, 1180x820 landscape, device pixel ratio 2;
//  Safari's address bar and tab bar take roughly 60-90 px of that height, so the page can be as short as about 740 px in landscape and 1050 px in portrait)
//  - tells iPads apart from phones and notebooks (Apple touch device whose short side is 600-1100 px): body.ipad / ipad-land / ipad-port
//  - uses the room a tablet has: the HUD (stats, quests, minimap, dock, action buttons) is enlarged by up to 1.2x so it is comfortable to hit with a finger and fills the screen better,
//    windows and the phone app are wider and taller, the phone uses nearly the full height in portrait
//  - never lets anything run off the screen: after every change it measures each button against the visible area and shrinks the HUD scale if anything would not fit
V23.add('v88_ipad', () => {
  const UI_SEL = ['#hudTL', '#hudTR', '#hudB', '#hudBR', '#prompt', '#joyHint', '#toasts', '#hudToggle', '#dock', '#dailyCard', '#photoBar', '#plcbar'];
  const css = document.createElement('style');
  css.textContent = `
body.ipad :is(${UI_SEL.join(',')}) { zoom: var(--ipz, 1); }
body.ipad #modal { padding: max(14px, env(safe-area-inset-top, 0px)) max(18px, env(safe-area-inset-right, 0px)) max(14px, env(safe-area-inset-bottom, 0px)) max(18px, env(safe-area-inset-left, 0px)); }
body.ipad .mbox { width: min(860px, 100%); max-height: calc(100dvh - 32px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)); font-size: 1.06em; }
body.ipad #modal.wide .mbox { width: min(1080px, 100%); }
body.ipad #modal.side .mbox { width: min(460px, 100%); max-height: calc(100dvh - 24px); }
body.ipad #modal.phone .mbox { width: min(600px, 100%); max-height: calc(100dvh - 32px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)); }
body.ipad-port #modal.phone .mbox { width: min(640px, 100%); }
body.ipad-land #modal.phone .mbox { width: min(520px, 62vw); }
/* v1.1: the left side (status panel top left, daily card) was enlarged by the whole-screen iPad zoom (up to 1.2x); it is brought back to about normal size so it no longer takes over the picture */
body.ipad #hudTL, body.ipad #dailyCard, body.ipad #hudToggle { zoom: var(--ipzl, 1); }
body.ipad .btn, body.ipad button { min-height: 40px; }
body.ipad #modal .mbox .row .btn, body.ipad #modal .mbox .btn { padding-top: 9px; padding-bottom: 9px; }`;
  document.head.appendChild(css);
  const isApple = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) || /[?&](ios|ipad)=1\b/.test(location.search);
  const touch = () => document.body.classList.contains('touch') || matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window || /[?&]ipad=1\b/.test(location.search);
  const HUD_IDS = ['hudTL', 'hudTR', 'hudB', 'hudBR', 'prompt', 'joyHint', 'hudToggle', 'dock', 'dailyCard'];
  let last = '';
  // true when every HUD box sits inside the screen
  const fits = () => {
    const W = innerWidth, H = innerHeight;
    for (const id of HUD_IDS) { const e = document.getElementById(id); if (!e || !e.offsetParent && getComputedStyle(e).position !== 'fixed') continue; const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || getComputedStyle(e).display === 'none') continue; if (r.left < -1 || r.top < -1 || r.right > W + 1 || r.bottom > H + 1) return false; }
    return true;
  };
  const apply = () => {
    const b = document.body, W = innerWidth, H = innerHeight, s = Math.min(W, H), on = isApple() && touch() && s >= 600 && s <= 1100 && Math.max(W, H) >= 800 && !b.classList.contains('ph');
    b.classList.toggle('ipad', on); b.classList.toggle('ipad-land', on && W > H); b.classList.toggle('ipad-port', on && W <= H);
    let z = 1; if (on) { z = Math.max(1, Math.min(1.2, s / 700)); b.style.setProperty('--ipz', z.toFixed(3)); for (let i = 0; i < 6 && z > 1 && !fits(); i++) { z = Math.max(1, z - 0.04); b.style.setProperty('--ipz', z.toFixed(3)); } } else b.style.removeProperty('--ipz');
    if (on) b.style.setProperty('--ipzl', Math.max(0.9, z * 0.82).toFixed(3)); else b.style.removeProperty('--ipzl');
    last = `${on}|${W}x${H}|${z.toFixed(2)}`;
  };
  addEventListener('resize', () => setTimeout(apply, 50)); addEventListener('orientationchange', () => setTimeout(apply, 400)); setInterval(apply, 1500); apply();
  window.Ipad88 = { apply, fits, scale: () => +getComputedStyle(document.body).getPropertyValue('--ipz') || 1, state: () => last };
});
