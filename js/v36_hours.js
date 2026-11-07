'use strict';
// ---------- v36_hours: one place for every government / agency / service opening rule ----------
// Offices open early and close late (weekdays 07:30–18:00, Saturday 08:00–16:00), nobody closes for lunch (staff rotate), the queue stops only
// 30 minutes before closing, and public holidays (only the days Cal24 marks as hol, not every festival) keep a skeleton service at the offices
// people need most, so on any weekday some counters are always open. v24_gov / v26_agency / v28_walkin / civic / v31_* call into this.
(function () {
  const hh = h => `${String(Math.floor(h)).padStart(2, '0')}:${h % 1 ? String(Math.round((h % 1) * 60)).padStart(2, '0') : '00'}`;
  const dayIdx = d => ((d == null ? S.day : d) - 1) % 7;                       // 0 Mon … 4 Fri, 5 Sat, 6 Sun
  const isHol = d => { try { return !!(window.Cal24 && Cal24.isHoliday && Cal24.isHoliday(d == null ? S.day : d)); } catch (e) { return false; } };

  const GOV = { wd: [7.5, 18], sat: [8, 16], sun: null, hol: null };           // default for every state office
  const ESS = { wd: [7.5, 18], sat: [8, 16], sun: [9, 15], hol: [9, 15] };     // civil registry & front-line services never fully shut
  const PROF = {
    // Gov24 offices
    district: ESS, hospreg: { wd: [7.5, 20], sat: [8, 16], sun: [9, 15], hol: [9, 15] }, post: { wd: [7.5, 19], sat: [8, 17], sun: [9, 13], hol: [9, 13] },
    police: { all: 1 }, passport: GOV, dlt: GOV, land: GOV, revenue: GOV, dbd: GOV, sso: GOV, labour: GOV, municipal: GOV, tambon: GOV, fire: { all: 1 },
    agri: GOV, livestock: GOV, fisheries: GOV, health: GOV, edu: GOV, customs: GOV, court: { wd: [8, 18], sat: null, sun: null, hol: null }, election: GOV, welfare: GOV,
    draft: GOV, pwa: { wd: [7.5, 18], sat: [8, 16], sun: null, hol: [9, 13] }, pea: { wd: [7.5, 18], sat: [8, 16], sun: null, hol: [9, 13] },
    // Agency26
    sso2: GOV, oic: GOV, exec: GOV, dip: GOV, baac: { wd: [7.5, 17.5], sat: [8, 16], sun: null, hol: null },
    dd: ESS, family: ESS, family_: ESS,
    pawn: { wd: [8.5, 20], sat: [8.5, 20], sun: [9, 18], hol: [9, 18] },
    rc: { wd: [7.5, 20], sat: [8, 18], sun: [9, 16], hol: [9, 16] },
    clinic: { wd: [8, 21], sat: [8, 20], sun: [9, 18], hol: [9, 18] },
    // walk-in document counters / pick-up window in the one-stop centre
    docs: { wd: [7.5, 18], sat: [8, 16], sun: [9, 15], hol: [9, 15] },
    // v31
    vet: { wd: [8, 19], sat: [8, 19], sun: [9, 16], hol: [9, 16] },
  };
  const profile = id => PROF[id] || GOV;

  // today's [open, close] for a profile id, or null when closed all day
  const win = (id, day) => {
    const P = profile(id); if (P.all) return [0, 24];
    const d = day == null ? S.day : day, i = dayIdx(d);
    if (isHol(d)) return P.hol || (i === 6 ? P.sun : null) || null;     // a public holiday follows the holiday hours on any weekday, Saturday included
    return i < 5 ? P.wd : i === 5 ? P.sat : P.sun;
  };
  const open = (id, t, day) => { const w = win(id, day); if (!w) return false; const h = (t == null ? S.time : t) / 60; return h >= w[0] && h < w[1]; };
  const closeAt = (id, day) => { const w = win(id, day); return w ? w[1] : 0; };
  // the queue closes 30 minutes before the counter does
  const cutoff = (id, day) => { const w = win(id, day); return w ? w[1] - 0.5 : 0; };
  const rng = w => w ? `${hh(w[0])}–${hh(w[1])}` : 'ปิด';
  const text = id => {
    const P = profile(id); if (P.all) return 'เปิด 24 ชม.';
    let s = `จ-ศ ${rng(P.wd)} · ส ${rng(P.sat)} · อา ${rng(P.sun)}`;
    s += P.hol ? ` · วันหยุดราชการ ${rng(P.hol)}` : ' · ปิดวันหยุดราชการ';
    return s;
  };
  const todayText = id => { const w = win(id); return w ? `วันนี้ ${rng(w)}` : 'วันนี้ปิด'; };
  // hospital: 'er' always, office services 07:30–18:00 weekdays and 08:00–16:00 Saturday, OPD also in the evening and on Sunday / holidays
  const hospSlot = (when, h, wd) => {
    if (when === 'er') return 'office';
    const day = S.day, i = dayIdx(day), hol = isHol(day);
    const sat = i === 5 && !hol, office = (wd && h >= 7.5 && h < 18) || (sat && h >= 8 && h < 16);
    if (office) return 'office';
    if (when === 'opd' && ((wd && h >= 18 && h < 21) || ((!wd) && h >= 8 && h < 20))) return 'after';
    return null;
  };
  const hospText = when => when === 'opd' ? 'เปิด จ-ศ 07:30–21:00 · ส-อา/วันหยุด 08:00–20:00' : 'เปิดเฉพาะ จ-ศ 07:30–18:00 · ส 08:00–16:00';
  // are there counters open on this weekday at this time? (used by the self-check below)
  const anyOpen = (t, day) => Object.keys(PROF).some(id => open(id, t, day));

  window.Hours36 = { win, open, closeAt, cutoff, text, todayText, rng, hospSlot, hospText, profile, anyOpen, PROF, hh, isHol };
  if (window.V23 && V23.add) V23.add('v36_hours', () => { });
})();
