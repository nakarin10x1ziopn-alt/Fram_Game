'use strict';
// ---------- v200_bellplace: on a laptop / desktop the notification bell sat in the very top right corner, ON TOP of the first round button of the right-hand column (the phone 📱 button): the phone
// could not be seen or pressed. The bell now sits just to the left of the mini map (like on the iPad, v174), never over any button; the tutorial card steps away from the daily-task card ----------
V23.add('v200_bellplace', () => {
  const css = document.createElement('style'); css.id = 'bellplace200';
  css.textContent = `body.dev-computer.dly200 #tut { left: var(--tut200l, 50%) !important; transform: none !important; max-width: min(460px, calc(100vw - var(--tut200l, 50%) - 12px)) !important; }`;
  document.head.appendChild(css);
  const vis = e => !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 8;
  const R = id => { const e = document.getElementById(id); return vis(e) ? e.getBoundingClientRect() : null; };
  let was = false;
  function place() {
    const b = document.body, bell = document.getElementById('tlog95'), box = document.getElementById('tlogbox95'); if (!bell) return;
    const desk = b.classList.contains('dev-computer') && !b.classList.contains('ipad') && !b.classList.contains('ph');
    const clear = () => { if (!was) return; for (const e of [bell, box]) if (e) { e.style.removeProperty('right'); e.style.removeProperty('top'); } was = false; };
    if (!desk || b.classList.contains('modal-open')) { clear(); }
    else {
      const ref = R('mini') || R('hudTR');
      if (!ref) clear();
      else {
        const right = Math.round(innerWidth - ref.left + 8), top = Math.round(Math.max(8, ref.top));
        bell.style.right = right + 'px'; bell.style.top = top + 'px'; if (box) { box.style.right = right + 'px'; box.style.top = (top + 46) + 'px'; } was = true;
      }
    }
    // the tutorial card is centred at the bottom: when the daily-task card (bottom left) would be under it, start it to the right of that card
    const t = R('tut'), d = R('dailyCard');
    if (desk && t && d) {
      const w = t.width, centred = (innerWidth - w) / 2;
      if (centred < d.right + 10 && d.top < t.bottom) { b.classList.add('dly200'); b.style.setProperty('--tut200l', Math.round(d.right + 10) + 'px'); } else { b.classList.remove('dly200'); }
    } else b.classList.remove('dly200');
  }
  addEventListener('resize', () => setTimeout(place, 80)); setInterval(place, 600); setTimeout(place, 300);
  window.BellPlace200 = { place };
});
