'use strict';
// ---------- v199_cofunds: company money goes in by transfer / cheque / cashier's cheque only ----------
// Registering a company (paid-up capital + fees + advance rent) and putting more capital into it can no longer be paid in cash or by card: the payment window offers only the transfer, the personal cheque, the
// cashier's cheque and the counter transfer (see o.only / Pay49.only in v49_bank.js; a transfer by the app is limited to 100,000 a time by the bank rules, so the big amounts go by cheque or at the bank).
V23.add('v199_cofunds', () => {
  const P = window.Pay49; if (!P || typeof UI === 'undefined') return;
  const ONLY = ['app', 'pp', 'cheque', 'cashier', 'draw'];
  for (const k of ['coinject', 'coinjectx', 'coreg']) {
    const h = UI.H[k]; if (typeof h !== 'function') continue;
    UI.H[k] = function () { P.only = ONLY; setTimeout(() => { if (P.only === ONLY) P.only = null; }, 0); return h.apply(this, arguments); };
  }
});
