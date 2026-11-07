'use strict';
// ---------- v36_newgame: a brand-new save starts with NO ID card and NO licence or permit of any kind ----------
// life7 TestMode still gives the test money and levels, but never the papers on a new game (S.v36ng marks one). Everything has to be applied for
// at the counters (Gov24 / Docs26 / Agency26 / driving school) and the gates that already ask for papers keep blocking until they exist.
// This file adds the last gate: a new player cannot drive a car before passing the driving test.
V23.add('v36_newgame', function () {
  S.v36ng = S.v36ng || 0;
  if (G.fresh && !S.v36ng) S.v36ng = 1;
  // a new game must not keep papers that an earlier build (or the test mode) may have put in the wallet
  const strip = () => {
    if (!S.v36ng || S.day > 1 || (S.stats && S.stats.earned > 0)) return;
    if (window.Gov24 && Gov24.st) { const d = Gov24.st().docs; for (const k of Object.keys(d)) if (d[k] && d[k].temp) delete d[k]; }
    if (S.license && !S.v36drove) { S.license = 0; S.lic2 = 0; S.licExp = 0; S.licOld = 0; }
  };
  strip();
  // the ID card is handed over automatically at the start (no application needed); everything else still has to be applied for
  const autoId = () => { try { if (S.v36ng && !S.v36idAuto && window.Gov24 && Gov24.grantId && !Gov24.has('idcard')) { S.v36idAuto = 1; Gov24.grantId(); } else if (S.v36ng && Gov24 && Gov24.has && Gov24.has('idcard')) S.v36idAuto = 1; } catch (e) { console.warn('autoId', e); } };
  setTimeout(autoId, 1500); setTimeout(autoId, 6000);

  const LICENCE_MSG = 'ยังไม่มีใบขับขี่ — ขอใบรับรองแพทย์ที่คลินิก/โรงพยาบาล → สมัครสอบที่โรงเรียนสอนขับรถ ภูผาใหม่ (หรือแอป 🏛️ ราชการ → ขนส่ง) แล้วค่อยขับรถ';
  if (typeof enterCar === 'function') {
    const _ec = enterCar;
    enterCar = function (c) {
      try {
        if (S.v36ng && !S.license && c && !c.school && !(typeof Contests !== 'undefined' && Contests.derby)) {
          UI.toast(LICENCE_MSG, '🪪'); Sfx.error && Sfx.error(); return;
        }
        if (S.license) S.v36drove = 1;
      } catch (e) { }
      return _ec.apply(this, arguments);
    };
  }
  window.NewGame36 = {
    isNew: () => !!S.v36ng,
    // quick self-check used by tests: which papers does this save hold?
    papers: () => ({ idcard: !!(window.Gov24 && Gov24.has('idcard')), housereg: !!(window.Gov24 && Gov24.has('housereg')), driving: !!S.license, truck: !!S.lic2, docs: window.Gov24 ? Object.keys(Gov24.st().docs) : [] }),
  };
});
