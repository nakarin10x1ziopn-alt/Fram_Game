'use strict';
// ---------- v235_monthly: every recurring money event happens once a MONTH on the real calendar (it used to be every 7 game days) ----------
// PAY DAY = the last day of the month. If that day is a Saturday, it moves 3 days earlier (Wednesday).
// Follows this rule: salaries and the pay slips, the company's monthly close (payroll, social security, rent, power, internet, VAT, dividends, branches and contracts),
// the utility metering (electricity and water, pro-rated to the days since the last close), elected posts' allowances, school extras, the automatic savings transfer,
// loan instalments (cooperative, village fund, bank), the maid package, the garbage fee and the cloud camera subscription.
// Bills already issued on the 1st of the month (v84_bills) are unchanged.
const MonthCal = (() => {
  // the game day that falls on a real calendar date (1 = the first day of a new game)
  const dayNum = (y, m, dom) => Math.floor(Date.UTC(y, m, dom) / 86400000) - Cal36.start() + 1;
  // the game day of this month's pay day
  const payDayNum = (y, m) => {
    const dim = Cal36.daysIn(y, m), last = dayNum(y, m, dim);
    return Cal36.dowOf(Cal36.epoch(last)) === 5 ? last - 3 : last;   // dowOf: 5 = Saturday (the game's own weekday names)
  };
  const isPayDay = d => { const t = Cal36.date(d); return d === payDayNum(t.y, t.m); };
  // the number of days since the previous close (a close never counts past the 1st of the month), recorded as the new close
  // a second call on the same day returns 0 (already billed), so repeated calls cannot charge twice
  const take = d => {
    if (S.mcLast === d) return 0;
    const t = Cal36.date(d), first = dayNum(t.y, t.m, 1) - 1, prev = Math.max(S.mcLast == null ? -1e9 : S.mcLast, first);
    S.mcLast = d; return Math.max(1, d - prev);
  };
  return { dayNum, payDayNum, isPayDay, take };
})();
window.MonthCal = MonthCal;
