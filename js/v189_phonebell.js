'use strict';
// ---------- v189_phonebell: while the in-game phone is open the 🔔 bell and the pop-up toasts are hidden (they only appear on the outer bell once the phone is closed),
// and the phone window is fitted to the screen on laptops and iPads so nothing covers it ----------
V23.add('v189_phonebell', () => {
  const css = document.createElement('style'); css.id = 'phonebell189';
  css.textContent = `
body.phone189 #tlog95, body.phone189 #tlogbox95, body.phone189 #toasts { display: none !important; }
body.phone189 #modal.phone, body.ipad.ipm174.phone189 #modal.phone { padding: 8px !important; align-items: center !important; justify-content: center !important; }
body.phone189 #modal.phone .mbox, body.ipad.ipm174.phone189 #modal.phone .mbox { max-height: calc(100dvh - 16px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) !important; }
@media (min-width: 641px) { body.phone189 #modal.phone .mbox { margin: 0 auto; } }
@media (max-height: 760px) and (min-width: 641px) { body.phone189 #modal.phone .mbox { width: min(400px, 100%) !important; } body.phone189.ipad-land #modal.phone .mbox { width: min(470px, 58vw) !important; } }`;
  document.head.appendChild(css);
  const M = document.getElementById('modal'); if (!M) return;
  const sync = () => document.body.classList.toggle('phone189', M.classList.contains('phone') && M.classList.contains('show'));
  new MutationObserver(sync).observe(M, { attributes: true, attributeFilter: ['class'] });
  sync();
});
