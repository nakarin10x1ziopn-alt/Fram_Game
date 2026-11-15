'use strict';
// ---------- v234: staff severance follows the length of service (Thai labour law) instead of a flat month ----------
// Thresholds are scaled to the game year (84 days): 120 real days ≈ 1/3 game year -> 30 days of pay, 1 year 90, 3 years 180, 6 years 240, 10 years 300, 20 years 400.
// New hires are stamped with their start day; people hired before this update count from the first month close after it.
V23.add('v234_staffpay', () => {
  if (typeof Company === 'undefined' || !UI.H.cofire) return;
  // This replaces the old one-month flat severance (company.js cofire); nothing else defines or wraps cofire.
  const YD = typeof YEAR_DAYS !== 'undefined' ? YEAR_DAYS : 84;
  const stamp = c => { for (const s of (c.staff || [])) if (s.since == null) s.since = S.day; };
  const days = s => { const y = Math.max(0, (S.day - (s.since == null ? S.day : s.since)) / YD); return y >= 20 ? 400 : y >= 10 ? 300 : y >= 6 ? 240 : y >= 3 ? 180 : y >= 1 ? 90 : y >= 1 / 3 ? 30 : 0; };
  Company.staffSev = s => Math.round((s.sal || 0) / 30 * days(s));   // used by the liquidation (coclose) too
  const _w = Company.week; Company.week = function () { try { for (const c of Company.list()) stamp(c); } catch (e) { } return _w.apply(this, arguments); };
  const _h = UI.H.cohire; UI.H.cohire = function (d) { const r = _h.apply(this, arguments); try { stamp(Company.get(d.v)); } catch (e) { } return r; };
  UI.H.cofire = function (d) {
    const c = Company.get(d.v), s = c && c.staff[+d.k]; if (!s) return; if (s.since == null) s.since = S.day;
    const dd = days(s), sev = Math.round(s.sal / 30 * dd);
    if (sev > 0 && c.cash < sev) { UI.toast(`เงินบริษัทไม่พอจ่ายค่าชดเชย ${baht(sev)} (${dd} วัน ตามอายุงาน)`, '💸'); return; }
    if (sev > 0) { c.cash -= sev; try { Company.book(c, 0, sev); } catch (e) { } }
    c.staff.splice(+d.k, 1); UI.toast(sev > 0 ? `เลิกจ้างแล้ว จ่ายค่าชดเชย ${baht(sev)} (${dd} วัน ตามอายุงาน)` : 'เลิกจ้างแล้ว (ทำงานไม่ถึง 1/3 ปีเกม ≈ 120 วันจริง ไม่ต้องจ่ายค่าชดเชย)', '📄');
  };
});
