'use strict';
// ---------- v210_hours: banks and government offices open EVERY day, 05:00-18:00, no weekends, no holidays ----------
//  - Hours36 (the one place for all government / agency opening rules): every office, the district hall, the walk-in counters, the document pick-up window, the post office, the court, the agencies in the service centre
//    and the hospital registry now share the window 05:00-18:00 on all seven days and on public holidays; the queue takes tickets until the counter closes (not 30 minutes before)
//  - NOT changed: police and fire (24 hours), and the private places in the service centre (clinic, pawn shop, vet) which keep their own longer hours
//  - the bank branch counter is changed in v49_bank.js (bankOpen); the ATM is still 24 hours
V23.add('v210_hours', () => {
  const H = window.Hours36; if (!H || !H.PROF) return;
  const D = [5, 18], KEEP = new Set(['police', 'fire', 'pawn', 'clinic', 'vet']);
  const daily = p => { p.wd = D; p.sat = D; p.sun = D; p.hol = D; };
  for (const id of Object.keys(H.PROF)) if (!KEEP.has(id)) daily(H.profile(id));
  daily(H.profile('__default__'));                 // the default profile used by every id that has no entry of its own (newer agencies)
  const _text = H.text, _cut = H.cutoff;
  H.text = id => { const P = H.profile(id); return (!P.all && P.wd === D) ? 'ทุกวัน 05:00–18:00 · ไม่มีวันหยุด' : _text(id); };
  H.cutoff = (id, day) => { const P = H.profile(id); return (!P.all && P.wd === D) ? D[1] : _cut(id, day); };
  H.todayText = id => { const P = H.profile(id); return (!P.all && P.wd === D) ? 'วันนี้ 05:00–18:00' : (H.win(id) ? `วันนี้ ${H.rng(H.win(id))}` : 'วันนี้ปิด'); };
  window.Hours210 = { D, KEEP: [...KEEP] };
});
