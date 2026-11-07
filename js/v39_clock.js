'use strict';
// ---------- v39: the game clock never stops while a window is open. This file keeps every visible clock live (phone status bar,
// date line) while an app or popup is on screen, and adds the optional "pause the clock while a menu is open" switch (default off) ----------
V23.add('v39_clock', () => {
  const st = () => ((S.v39c = S.v39c || {}), S.v39c);
  // phone status bar: its text is "hh:mm" or "short date · hh:mm" and is only rendered when an app opens, so refresh it by itself
  let lastMin = -1;
  setInterval(() => {
    try {
      if (!S || !G.started || !UI.cur) return;
      const m = Math.floor(S.time);
      if (m === lastMin) return; lastMin = m;
      const top = document.querySelector('#mBody .ph-top span');
      if (top) { const t = Phone.clock(); if (!top.textContent.endsWith(t)) top.textContent = top.textContent.replace(/\d\d:\d\d\s*$/, t); }
      const c = document.querySelector('#mBody [data-live-clock]'); if (c) c.textContent = Phone.clock();
    } catch (e) { }
  }, 250);
  // setting: pause the clock while a menu is open (off by default)
  UI.H.v39pause = () => { st().pauseMenu = st().pauseMenu ? 0 : 1; UI.toast(st().pauseMenu ? 'เวลาจะหยุดเมื่อเปิดเมนู' : 'เวลาเดินต่อเมื่อเปิดเมนู', '🕐'); };
  const _menu = UI.menu.bind(UI);
  UI.menu = () => {
    _menu(); const r = UI.cur && UI.cur.render; if (!r) return;
    UI.cur.render = t => `<div class="card"><div class="ci">⏱️</div><div class="cb"><h4>เวลาตอนเปิดเมนู/แอป: ${st().pauseMenu ? 'หยุดเวลา' : 'เดินต่อเนื่อง'}</h4><p class="dim">ปกติเวลาในเกมเดินต่อเนื่องแม้เปิดมือถือหรือหน้าต่างใดๆ กดเพื่อสลับเป็นหยุดเวลาเมื่อเปิดเมนู</p><div class="row"><button class="btn ${st().pauseMenu ? '' : 'ghost'}" data-a="v39pause">${st().pauseMenu ? 'เปิดให้เวลาเดินต่อเนื่อง' : 'หยุดเวลาเมื่อเปิดเมนู'}</button></div></div></div>` + r(t);
    UI.renderBody();
  };
  window.Clock39 = { rate: () => TimeMode.rate(), paused: () => !!(S && S.v39c && S.v39c.pauseMenu && UI.isOpen()) };
});
