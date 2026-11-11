'use strict';
// ---------- v195_cotown: company premises in the far towns are drawn as soon as the town exists ----------
// Far towns (สุขนครมหานคร, สวนทองเมือง, บ้านทุ่งทานตะวัน) are built on the first visit. A company whose premises are in one of them gets its building (and its door) right after the town is built,
// and again every day (CoMap.drawAll). See CO_TOWN_SPOTS in biz2.js and the town sites in CO_SITES (company.js).
V23.add('v195_cotown', () => {
  if (typeof Town3 === 'undefined' || typeof CoMap === 'undefined') return;
  const _e = Town3.ensure;
  if (typeof _e === 'function') Town3.ensure = function (k) { const A = _e.apply(this, arguments); try { if (A && !A.lazy) CoMap.drawAll(); } catch (e) { console.warn('v195 cotown', e); } return A; };
  try { CoMap.drawAll(); } catch (e) { }
});
