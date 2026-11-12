'use strict';
// ---------- v199_cofunds: company money goes in by transfer / cheque / cashier's cheque only ----------
// Registering a company (paid-up capital + fees + advance rent) and putting more capital into it can no longer be paid in cash or by card: the payment window offers only the transfer, the personal cheque, the
// cashier's cheque and the counter transfer (see o.only / Pay49.only in v49_bank.js; a transfer by the app is limited to 100,000 a time by the bank rules, so the big amounts go by cheque or at the bank).
V23.add('v199_cofunds', () => {
  const P = window.Pay49; if (!P || typeof UI === 'undefined') return;
  const ONLY = ['app', 'pp', 'cheque', 'cashier', 'draw'];
  // v207: the payment window names what is being paid (not the "cash is not enough" message) and offers the savings account (business transfer) as well as the cheques
  const LAB = { coreg: { label: 'จดทะเบียนบริษัท: ค่าหุ้น 25% + ค่าธรรมเนียม + ค่าเช่า/มัดจำ 3 เดือน', payee: 'สำนักงานพัฒนาธุรกิจการค้า / เจ้าของสถานที่' }, coinject: { label: 'เพิ่มทุนเข้าบัญชีบริษัท', payee: 'บัญชีบริษัท' }, coinjectx: { label: 'เพิ่มทุนเข้าบัญชีบริษัท', payee: 'บัญชีบริษัท' } };
  const B = window.Bank49; if (B && B.ask && !B.ask.__v207) { const _ask = B.ask; B.ask = function (o) { if (P.coLabel) o = Object.assign({}, o, P.coLabel); return _ask.call(B, o); }; B.ask.__v207 = 1; }
  for (const k of ['coinject', 'coreg']) {
    const h = UI.H[k]; if (typeof h !== 'function') continue;
    UI.H[k] = function () { P.only = ONLY; P.coLabel = LAB[k]; setTimeout(() => { if (P.only === ONLY) P.only = null; if (P.coLabel === LAB[k]) P.coLabel = null; }, 0); return h.apply(this, arguments); };
  }
});
