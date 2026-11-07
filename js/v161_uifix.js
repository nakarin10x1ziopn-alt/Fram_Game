// v161_uifix.js: phone and window colours that read clearly (found by an automatic audit of every phone app, tab and form)
//  - disabled buttons used to be half-transparent (orange button with faded brown text, contrast 2.4): now a flat grey-green button with light text and a dashed border, still clearly "not available"
//  - placeholder text inside the light cheque / payee fields was cream on cream (invisible): dark placeholder on light fields, brighter placeholder on dark fields
//  - every field in a window is 16 px (smaller text makes iPad Safari zoom the whole page when a field is tapped)
//  - emergency call buttons (white on light pink, contrast 2.0) are a deeper rose
//  - items that are dimmed with an inline opacity (locked achievements, locked apps, unavailable choices) stay at 78 % so their text can still be read
//  - long window titles wrap onto a second line instead of being cut with "…"
//  - the small delete buttons are at least 32 px tall for a finger
//  - small secondary labels never go below 12 px
//  - notebooks (non-touch screens narrower than 1900 px): windows and notifications are shown at their real size instead of the 1920x1080 scale (71 % on a 1366x768 screen made 12 px labels 8.5 px)
V23.add('v161_uifix', () => {
  const css = document.createElement('style');
  css.id = 'uifix161';
  css.textContent = `
/* disabled buttons: legible, flat, dashed */
.btn:disabled:not(#btnPlay), .btn[disabled]:not(#btnPlay) { opacity: 1 !important; filter: none !important; background: #42524a !important; background-image: none !important; color: #e9f0ea !important; -webkit-text-fill-color: #e9f0ea !important; border: 1px dashed rgba(255,255,255,.42) !important; box-shadow: none !important; text-shadow: none !important; cursor: not-allowed; transform: none !important; }
/* placeholders */
input::placeholder, textarea::placeholder { color: rgba(246,242,228,.78) !important; opacity: 1 !important; }
#modal input[style*="background:#fff" i]::placeholder, #modal input[style*="background: #fff" i]::placeholder, #modal textarea[style*="background:#fff" i]::placeholder, input[style*="#fffef7" i]::placeholder, input[style*="#fffdf3" i]::placeholder, input[style*="#fff;" i]::placeholder, textarea[style*="#fffdf3" i]::placeholder, #mBody input[type="number"][style*="background:#fff" i]::placeholder { color: #6b5d36 !important; opacity: 1 !important; }
/* fields: 16 px so iPad Safari never zooms the page */
#modal input, #modal select, #modal textarea, #mBody input, #mBody select, #mBody textarea { font-size: 16px !important; }
/* emergency buttons */
.btn.danger { background: linear-gradient(180deg, #d6245f, #b01450) !important; color: #fff !important; box-shadow: 0 3px 0 #7d0d37, 0 6px 14px rgba(0,0,0,.3) !important; }
/* things dimmed by an inline opacity stay readable */
#mBody [style*="opacity:.4"], #mBody [style*="opacity: .4"], #mBody [style*="opacity:.5"], #mBody [style*="opacity: .5"], #mBody [style*="opacity:0.4"], #mBody [style*="opacity:0.5"] { opacity: .78 !important; }
/* titles wrap */
.mhead h2 { white-space: normal !important; overflow: visible !important; text-overflow: clip !important; overflow-wrap: anywhere; line-height: 1.22; }
/* finger-sized delete buttons */
#mBody button[data-a^="mdel"] { min-height: 32px !important; min-width: 34px !important; padding-top: 4px !important; padding-bottom: 4px !important; }
/* notebooks: windows and notifications keep their real size (the 1920x1080 scale made 14 px buttons 10 px and 12 px labels 8.5 px on a 1366x768 screen); only a window too big for a small screen is scaled down */
body.nb #modal, body.nb #toasts { zoom: var(--nbm, var(--nbz, 1)) !important; }
/* red count badges and calendar counts */
.apps button span i { font-size: 11px !important; background: #c62828 !important; color: #fff !important; }
#mBody .c36 b { font-size: 11px !important; }
#mBody .a39c b, #mBody .a39c i { font-size: 11px !important; }
/* small secondary labels */
#mBody small, #mBody .dim small { font-size: max(12px, .85em); }
`;
  document.head.appendChild(css);
  // window scale for notebooks: 1 when the window (about 940 x 680 px) fits, smaller only on really small screens
  const nbm = () => { try { document.body.style.setProperty('--nbm', Math.max(0.6, Math.min(1, innerWidth / 1000, innerHeight / 760)).toFixed(4)); } catch (e) { } };
  addEventListener('resize', nbm); setInterval(nbm, 1000); nbm();
});
