// v83_notebook.js: notebook screens use the 1920x1080 layout
//  The HUD, windows and buttons are designed for a 1920x1080 screen. On a notebook (1366x768, 1440x900, 1536x864 ...) the same layout was laid out in real pixels, so it looked
//  bigger and more crowded than on a desktop monitor. Now the interface layer is scaled by min(width/1920, height/1080), so every panel, button and window sits in the same
//  place and proportion as on 1920x1080; the 3D picture still fills the whole window. Phones, tablets and touch screens keep their own layouts.
V23.add('v83_notebook', () => {
  const UI_SEL = ['#hudTL', '#hudTR', '#hudB', '#hudBR', '#prompt', '#joyHint', '#fps', '#toasts', '#modal', '#fishUI', '#moveUI', '#raceHud', '#hudToggle', '#dock', '#haggle', '#dailyCard', '#tut', '#photoBar', '#plcbar', '#guideArrow'];
  const css = document.createElement('style');
  css.textContent = 'body.nb ' + ':is(' + UI_SEL.join(',') + ') { zoom: var(--nbz, 1); }';
  css.textContent += ' body:not(.ph) #toasts { top: calc(34px + env(safe-area-inset-top, 0px)); }';   // notifications start below the FPS pill instead of on top of it
  document.head.appendChild(css);
  const apply = () => {
    const b = document.body, touch = b.classList.contains('touch') || matchMedia('(pointer: coarse)').matches;
    const on = !touch && innerWidth >= 1100 && innerWidth < 1900 && innerHeight > 520;
    const k = on ? Math.max(0.6, Math.min(innerWidth / 1920, innerHeight / 1080)) : 1;
    b.classList.toggle('nb', on && k < 0.999); b.style.setProperty('--nbz', k.toFixed(4));
  };
  addEventListener('resize', apply); setInterval(apply, 1000); apply();
  window.Notebook83 = { apply, scale: () => +getComputedStyle(document.body).getPropertyValue('--nbz') };
});
