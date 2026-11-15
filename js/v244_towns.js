'use strict';
// ---------- v244: transport and offices follow the places that are really left ----------
// Left in the game: the village and 3 far cities (สุขนครมหานคร large, สวนทองเมือง medium, บ้านทุ่งทานตะวัน small).
//  - songthaew: only the village route (the routes to the removed towns are gone)
//  - intercity bus / van: timetables to the 3 cities (they used to list the removed cities, so nothing could be booked)
//  - e-bus: the text says what it really connects
//  - the farm offices (agriculture, livestock, fisheries, farm-standards centre) are gone together with the farm
V23.add('v244_towns', function () {
  // ----- songthaew -----
  try { if (typeof CV_SONG !== 'undefined') for (let i = CV_SONG.length - 1; i >= 0; i--) if (/ทุ่งทอง|ภูผา|ริมทะเล/.test(CV_SONG[i].n + CV_SONG[i].stops.map(s => s.n).join(''))) CV_SONG.splice(i, 1); } catch (e) { console.warn('v244 song', e); }
  // ----- intercity bus / van -----
  try {
    if (typeof CV_INTER !== 'undefined') {
      CV_INTER.length = 0;
      CV_INTER.push(
        { k: 'metro', n: 'สุขนครมหานคร (เมืองใหญ่)', i: '🌆', o: [{ n: 'รถตู้ปรับอากาศ', i: '🚐', fee: 350, dur: 150, every: [6, 19] }, { n: 'รถทัวร์ VIP 24 ที่นั่ง', i: '🛋️', fee: 520, dur: 120, at: [8, 12, 16, 20] }] },
        { k: 'orchard', n: 'สวนทองเมือง (เมืองกลาง)', i: '🍊', o: [{ n: 'รถตู้ปรับอากาศ', i: '🚐', fee: 180, dur: 90, every: [6, 19] }, { n: 'รถทัวร์ ป.2', i: '🚌', fee: 140, dur: 100, at: [7, 11, 15, 19] }] },
        { k: 'sunflower', n: 'บ้านทุ่งทานตะวัน (เมืองเล็ก)', i: '🌻', o: [{ n: 'รถตู้ปรับอากาศ', i: '🚐', fee: 110, dur: 60, every: [6, 18] }] },
      );
    }
  } catch (e) { console.warn('v244 inter', e); }
  // ----- e-bus text -----
  try {
    if (typeof Civic !== 'undefined' && Civic.ebusHTML) { const _e = Civic.ebusHTML.bind(Civic); Civic.ebusHTML = function (h) { return _e(h).replace('รถบัสไฟฟ้าระหว่างเมือง วิ่งทุก 30 นาที', 'รถบัสไฟฟ้าระหว่างหน้าบ้านกับหมู่บ้าน วิ่งทุก 30 นาที (ไปเมืองไกลใช้รถตู้/รถทัวร์หรือแท็กซี่)'); }; }
  } catch (e) { }
  // ----- farm offices -----
  const DEAD_OFF = new Set(['agri', 'livestock', 'fisheries']);
  const prune = () => {
    try { if (window.Gov24 && Array.isArray(Gov24.offices)) for (let i = Gov24.offices.length - 1; i >= 0; i--) if (DEAD_OFF.has(Gov24.offices[i].id)) Gov24.offices.splice(i, 1); } catch (e) { }
    try { if (window.Agency26 && Array.isArray(Agency26.agencies)) for (let i = Agency26.agencies.length - 1; i >= 0; i--) if (Agency26.agencies[i].id === 'dopa2') Agency26.agencies.splice(i, 1); } catch (e) { }
  };
  // the farmer registration is gone: no office issues or renews it, and an old one is taken out of the wallet once
  const farmerDoc = () => { try { if (S && S.gov24 && S.gov24.docs && S.gov24.docs.farmer) delete S.gov24.docs.farmer; } catch (e) { } };
  let ft = 0; const fiv = setInterval(() => { try { if (typeof S !== 'undefined' && S && typeof G !== 'undefined' && G.started) { clearInterval(fiv); farmerDoc(); } else if (++ft > 600) clearInterval(fiv); } catch (e) { } }, 700);
  farmerDoc();
  try { if (typeof SYS !== 'undefined' && SYS.coop) delete SYS.coop; } catch (e) { }   // the agricultural cooperative
  prune(); setTimeout(prune, 3000); window.Towns244 = { prune };
});
