'use strict';
// ---------- v43_cal: every date the player reads is a real calendar date (weekday, day, month, Buddhist year), never a game-day counter like "วันที่ 40" ----------
// RD(n) turns a game day number into "วันศุกร์ที่ 15 พ.ย. 2569" through Cal36 (v36_calendar.js). The old texts "วันที่ ${gameDay}" all call it now.
function RD(n) {
  n = +n;
  try {
    if (isFinite(n) && n > 0 && typeof Cal36 !== 'undefined' && S) { const t = Cal36.date(n); return `วัน${Cal36.DAYN[t.dow].slice(3)}ที่ ${t.dom} ${Cal36.MONS[t.m]} ${t.be}`; }
  } catch (e) { }
  return 'วันที่ ' + (isFinite(n) && n > 0 ? n : '-');
}
