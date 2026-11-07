'use strict';
// ---------- v181_govfin: refunds, automatic debits, government bills and money lent by friends are connected to the bank ----------
//  Audit of the money paths that did not go through the new bank (see the list below); this file holds the shared helper, the other fixes are one-line changes in the files that own the code:
//   * REFUNDS (online order returned / not delivered, field plots over the limit, greenhouse cancelled, animals not all bought): the money goes back the way it was paid
//     (credit card -> the card balance, cash -> wallet, bank / debit / transfer -> the savings account) and shows in the statement. Before, it always went to the wallet.
//   * AUTOMATIC DEBITS (mortgage instalment, refuse fee, vet bill, burst pipe ...) are taken from the savings account first like a bank auto-debit (before: wallet cash first)  [v49_bank.js]
//   * LAND TAX: a second land tax was taken silently from the money; it is now a bill of the tax office in the bills menu (due in 28 days, 20% late fee, pay by any method)  [reallife.js]
//   * money lent by a friend arrives as a bank transfer; selling surplus power back to the grid and other transfers are listed as bank income  [v39_chat.js, v171_cards.js]
V23.add('v181_govfin', () => {
  if (typeof Bank === 'undefined' || typeof S === 'undefined') return;
  const B = () => window.Bank49;
  const slipFor = n => {
    try { const L = (B().V().slips) || []; for (const s of L) { if (S.day - s.d > 60) break; if (s.dir === 'in' || s.k === 'in' || s.neutral || s.k === 'atm') continue; if (s.amt >= n - 1) return s; } } catch (e) { }
    return null;
  };
  const give = (n, label) => {
    n = Math.round(+n || 0); if (!(n > 0)) return 0;
    const s = slipFor(n), from = s ? String(s.from || '') : '';
    try {
      if (/บัตรเครดิต/.test(from) && window.Card168 && Card168.refund) { Card168.refund(n); try { Bank2.log(label + ' (คืนเข้าบัตรเครดิต)', n); } catch (e) { } return n; }
      if (/เงินสด/.test(from) && !/ออมทรัพย์|กระแส/.test(from)) { S._c += n; try { Bank2.log(label + ' (คืนเงินสด)', n); } catch (e) { } return n; }
      Bank.st().sav += n; try { B().tx('รับเงินคืน: ' + label, n, 'main'); } catch (e) { } try { Bank2.log('รับเงินคืนเข้าบัญชี: ' + label, n); } catch (e) { }
    } catch (e) { S._c += n; }
    return n;
  };
  window.Refund181 = { give, slipFor };
});
