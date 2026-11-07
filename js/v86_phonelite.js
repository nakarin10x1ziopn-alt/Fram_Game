// v86_phonelite.js: the in-game phone app is a flat screen: no 3D look-and-feel effects there
//  - no blur of the world behind it, no shadows, glows, animations or transitions on the phone screen, plain dark backdrop
//  - while the phone is open the 3D world behind it is drawn plain (no bloom/colour-grade pass) and about 30 times a second (about 15 on a slow device), because it is hidden behind the dark backdrop;
//    the phone itself stays perfectly smooth and the game goes back to full quality the moment it closes
//  everything outside the phone app is untouched
V23.add('v86_phonelite', () => {
  const css = document.createElement('style');
  css.textContent = `
#modal.phone { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; background: rgba(5, 12, 9, .82) !important; transition: none !important; }
#modal.phone .mbox, #modal.phone .mbox *, #modal.phone .pc59, #modal.phone .pc59bg { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; animation: none !important; transition: none !important; box-shadow: none !important; text-shadow: none !important; filter: none !important; }
#modal.phone .mbox { transform: none !important; }
#modal.phone .apps button span { box-shadow: none !important; background-image: none !important; }`;
  document.head.appendChild(css);
  const open = () => { const m = document.getElementById('modal'); return !!(m && m.classList.contains('show') && m.classList.contains('phone')); };
  if (typeof Gfx !== 'undefined' && Gfx.render) {
    const _r = Gfx.render.bind(Gfx); let last = 0, cost = 0, gap = 33;
    Gfx.render = function () {
      if (!open()) return _r();
      const now = performance.now(); if (now - last < gap) return; last = now;
      const on = this.on; this.on = false; try { return _r(); } finally { this.on = on; cost = cost * 0.8 + (performance.now() - now) * 0.2; gap = cost > 24 ? 66 : 33; }   // v169: the world behind the phone is still seen through the backdrop, so draw it ~30 times a second (NPCs moved in 5-fps jumps before); only a slow device falls back to ~15
    };
  }
  window.PhoneLite86 = { open };
});
