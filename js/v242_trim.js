'use strict';
// ---------- v242: fewer daily messages ----------
// No "village news" lines and no messages from villagers / friends / family any more (the friends & family folder is gone).
// Appointment texts from a person still come through, because they carry a time and a place the player needs.
V23.add('v242_trim', function () {
  if (typeof Phone === 'undefined' || !Phone.msg) return;
  const NEWS = /^ข่าว(หมู่บ้าน|ซุบซิบ)/;
  const PERSON = /^(เพื่อน|ครอบครัว|แฟน|ที่รัก)$/;
  const APPT = /นัด(?:หมาย|ตรวจ|พบ|ช่าง|ไว้|เวลา|ยื่น|รับ|ส่ง|ฟัง|สอบ)|เวลานัด|ครบกำหนดนัด|เตือนนัด|มีนัด|ชวนไป|วันนี้ว่างไหม/;
  const people = () => {
    const s = new Set();
    try { for (const n of G.npcs || []) s.add(n.name); } catch (e) { }
    try { for (const k of Object.keys(S.friends || {})) s.add(k); } catch (e) { }
    try { if (S.rel) { if (S.rel.partner) s.add(S.rel.partner); for (const k of S.rel.kids || []) if (k && k.name) s.add(k.name); } } catch (e) { }
    return s;
  };
  // v253: no health in the phone: no health apps or category, no messages from hospitals / clinics / doctors (the education folder stays)
  const HEALTH = /โรงพยาบาล|คลินิก|^หมอ|หมอสุขใจ|แพทย์|พยาบาล|สาธารณสุข|เอราวัณ|วัคซีน|สุขภาพ/;
  const noHealth = () => {
    try { for (let i = APPS.length - 1; i >= 0; i--) if (['health31', 'civhos'].includes(APPS[i].id)) APPS.splice(i, 1); } catch (e) { }
    try { if (window.Phone59 && Phone59.CATS) { const k = Phone59.CATS.findIndex(c => c[0] === 'health'); if (k >= 0) Phone59.CATS.splice(k, 1); for (const c of Phone59.CATS) c[3] = c[3].filter(id => id !== 'health31' && id !== 'civhos'); } } catch (e) { }
  };
  noHealth(); setTimeout(noHealth, 2500); setTimeout(noHealth, 8000);
  const _m = Phone.msg;
  Phone.msg = function (from, text) {
    const f = String(from || ''), t = String(text || '');
    if (NEWS.test(f)) return;
    if (HEALTH.test(f)) return;
    if ((PERSON.test(f) || people().has(f)) && !APPT.test(t)) return;
    return _m.apply(this, arguments);
  };
  // messages of that kind already in an old save are cleared once
  const clean = () => {
    try {
      if (!S) return;
      if (!S.trim242) { const ppl = people(); S.msgs = (S.msgs || []).filter(m => !(NEWS.test(String(m.from)) || ((PERSON.test(String(m.from)) || ppl.has(m.from)) && !APPT.test(String(m.text))))); S.trim242 = 1; }
      if (!S.trim253) { S.trim253 = 1; S.msgs = (S.msgs || []).filter(m => !HEALTH.test(String(m.from))); }
      try { Phone.badge(); } catch (e) { }
    } catch (e) { }
  };
  window.Trim242 = { clean };
  let tries = 0; const iv = setInterval(() => { try { if (typeof S !== 'undefined' && S && typeof G !== 'undefined' && G.started) { clearInterval(iv); clean(); } else if (++tries > 600) clearInterval(iv); } catch (e) { } }, 700);
});
