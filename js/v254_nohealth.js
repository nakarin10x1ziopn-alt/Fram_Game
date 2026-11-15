'use strict';
// ---------- v254: the health system is gone (only eating and drinking stay) ----------
// No illness of any kind (the player, the children), no doctor / clinic / hospital / health office, no health insurance, no medicines, no health jobs (nurse, pharmacist),
// no medical certificate, no sick leave. Hunger, thirst and energy work as before, and so do the emergency numbers (police, fire).
//  - S.sick / S.sickDays always read 0 and ignore writes, so every old source of illness (weather, hunger, events, old saves) is harmless
//  - the health module and the clinic / hospital screens do nothing; the clinic building, the doctor and every clinic / hospital / health-office point are removed
//  - medicines and first-aid goods leave the shops; the chemists in the cities become shops for personal goods
//  - insurance: the health and sickness policies are gone; documents that asked for a medical certificate no longer do
V23.add('v254_nohealth', function () {
  const safe = f => { try { return f(); } catch (e) { return undefined; } };
  // ----- 1. no illness: S.sick is always 0 -----
  const lock = () => safe(() => {
    if (typeof S === 'undefined' || !S) return;
    for (const k of ['sick', 'sickDays']) { const d = Object.getOwnPropertyDescriptor(S, k); if (!d || !d.get) Object.defineProperty(S, k, { get: () => 0, set() { }, enumerable: false, configurable: true }); }
    const kids = (S.rel && S.rel.kids) || [];
    if (window.Kids31 && Kids31.D) for (const k of kids) safe(() => { const d = Kids31.D(k); if (d && !Object.getOwnPropertyDescriptor(d, 'sick')?.get) Object.defineProperty(d, 'sick', { get: () => null, set() { }, enumerable: false, configurable: true }); });
  });
  lock(); setInterval(lock, 1000);

  // ----- 2. the services do nothing -----
  const off = () => UI.toast('ไม่มีบริการนี้แล้ว', 'ℹ️');
  safe(() => { if (typeof Life2 !== 'undefined') { Life2.getSick = function () { }; Life2.clinicUI = off; } });
  safe(() => { if (window.Health31) for (const k of Object.keys(Health31)) if (typeof Health31[k] === 'function') Health31[k] = k === 'active' ? () => [] : k === 'bill' ? () => 0 : function () { }; });
  safe(() => { if (typeof Civic !== 'undefined') { for (const k of ['sickLeave', 'hospUI', 'hospital', 'clinicUI']) if (typeof Civic[k] === 'function') Civic[k] = k === 'sickLeave' ? function () { } : off; } });
  safe(() => { if (window.Health31 && Health31.H) for (const k of Object.keys(Health31.H)) Health31.H[k] = function () { }; });
  // old state: no conditions, bills or prescriptions are left to run
  const wipe = () => safe(() => { const s = S.v31h || S.health31; if (s) { s.cond = []; s.rx = []; s.appt = []; s.bills = []; s.claims = []; s.plan = null; s.need = null; s.post = null; } if (S.civ && S.civ.bills) S.civ.bills = []; });

  // ----- 3. places: clinic, hospitals and health offices -----
  const PLACE = /โรงพยาบาล|^คลินิก|ศูนย์ความปลอดภัยและสาธารณสุข|สาธารณสุข|ห้องฉุกเฉิน|ร้านขายยา/;
  const removeBuilding = door => safe(() => {   // the smallest building group that the door stands against (the door is a little outside the wall)
    let best = null, ba = 1e9; const B3 = new THREE.Box3();
    for (const g of World.outdoor.children) {
      B3.setFromObject(g); if (B3.isEmpty()) continue; const w = B3.max.x - B3.min.x, d = B3.max.z - B3.min.z, h = B3.max.y - B3.min.y; if (w < 6 || w > 26 || d < 6 || d > 26 || h < 3) continue;
      if (door.x > B3.min.x - 3.5 && door.x < B3.max.x + 3.5 && door.z > B3.min.z - 3.5 && door.z < B3.max.z + 3.5 && w * d < ba) { ba = w * d; best = [g, B3.clone()]; }
    }
    if (!best) return 0; const [g, b] = best; window.__removed254 = { w: b.max.x - b.min.x, d: b.max.z - b.min.z, h: b.max.y - b.min.y, cx: (b.min.x + b.max.x) / 2, cz: (b.min.z + b.max.z) / 2 }; World.outdoor.remove(g);
    for (const arr of Col.map.values()) for (const s of arr.slice()) if (s.x > b.min.x - 0.5 && s.x < b.max.x + 0.5 && s.z > b.min.z - 0.5 && s.z < b.max.z + 0.5 && s.type === 'b') Col.remove(s);
    return 1;
  });
  const purgeWorld = () => safe(() => {
    if (!World.pois) return;
    const clinic = World.pois.find(p => p.label === 'คลินิก' && p.x < 2500);
    if (clinic && !window.__clinicGone254) { window.__clinicGone254 = 1; removeBuilding(clinic); }
    World.pois = World.pois.filter(p => !(p && PLACE.test(p.label || '')));
    if (G.npcs) for (let i = G.npcs.length - 1; i >= 0; i--) if (G.npcs[i] && G.npcs[i].name === 'หมอนิด') { try { World.dyn.remove(G.npcs[i].obj); } catch (e) { } G.npcs.splice(i, 1); }
  });

  // ----- 4. jobs: no nurse, no pharmacist -----
  const jobs = () => safe(() => {
    if (typeof JOBS2 === 'undefined') return;
    for (const k of ['nurse', 'pharmacist']) {
      if (JOBS2[k]) delete JOBS2[k];
      if (World.pois) for (let i = World.pois.length - 1; i >= 0; i--) { const p = World.pois[i]; if (p && p.job === k) { try { if (p.grp && p.grp.parent) p.grp.parent.remove(p.grp); Col.remove(p.col); } catch (e) { } World.pois.splice(i, 1); } }
      const j = Career.st(); if (j && j.k === k) { j.k = null; j.x252 = null; try { Phone.msg('ฝ่ายบุคคล', 'ตำแหน่งงานนี้ถูกยกเลิก (ไม่มีงานด้านสุขภาพแล้ว) ได้รับเงินเดือนงวดสุดท้ายตามปกติ', false); } catch (e) { } }
    }
  });
  // no sick leave
  safe(() => {
    const _l = Career.leave.bind(Career); Career.leave = function (kind, day) { if (kind === 'sick') { UI.toast('ไม่มีการลาป่วยแล้ว', 'ℹ️'); return; } return _l(kind, day); };
    const _h = Career.html.bind(Career); Career.html = function (tab) { return _h(tab).replace(/<button[^>]*data-k="sick"[^>]*>[\s\S]*?<\/button>/g, ''); };
  });

  // ----- 5. goods and shops -----
  const MEDNAME = /ยาแก้|ยาหม่อง|ยาสามัญ|ยาประจำ|ยาลดไข้|ยาดม|ยาธาตุ|ยาน้ำ|ยาเม็ด|ยารักษา|ชุดปฐมพยาบาล|ผ้าพันแผล|พลาสเตอร์|วิตามิน|ฟ้าทะลายโจร|เจลล้างมือ|หน้ากากอนามัย|หน้ากาก N95|ที่วัดไข้|ลูกประคบ|น้ำมันนวด|ฮอร์โมน|แอลกอฮอล์ล้างแผล|ยาฆ่าเชื้อ|ยาบรรเทา|ยาแก้แพ้|ยาแก้ไอ|ยาสมุนไพร|เวชภัณฑ์/;
  const MEDID = /^(medicine|bandage|pills|balm|firstaid|vitamin|v_firstaid|v_liniment|v_hormone|fr_herbal_balm|fr_herb_ball|fr_herb_capsule)$/;
  const nameOf = k => { const [kd, id] = String(k).split(':'); const it = (typeof ITEMS !== 'undefined' && ITEMS[id]) || {}, t = (typeof TOOLS !== 'undefined' && TOOLS[id]) || {}; return { id, n: (it.n || t.n || '') + ' ' + (t.desc || '') }; };
  const isMed = k => { const { id, n } = nameOf(k); return MEDID.test(id) || MEDNAME.test(n); };
  const REN = [[/ร้านยาสุขนคร/, 'ร้านของใช้ส่วนตัวสุขนคร'], [/ร้านยาสวนทอง/, 'ร้านของใช้ส่วนตัวสวนทอง'], [/ร้านชำ & ร้านยา/, 'ร้านชำ & ของใช้ส่วนตัว']];
  const shops = () => safe(() => {
    for (const sid in SHOPS) {
      const sh = SHOPS[sid]; if (!sh) continue;
      for (const [rx, to] of REN) if (rx.test(sh.n || '')) sh.n = sh.n.replace(rx, to);
      if (!Array.isArray(sh.tabs)) continue;
      for (const t of sh.tabs) { t.items = (t.items || []).filter(k => !isMed(k)); t.n = String(t.n).replace(/💊\s*(ยา\s*&\s*สุขภาพ|ยาและสุขภาพ|สุขภาพ|ของใช้ส่วนตัว)/, '🧴 ของใช้ส่วนตัว').replace(/ชาสมุนไพร\/วิตามิน/, 'ชาและของกินเล่น'); }
      sh.tabs = sh.tabs.filter(t => (t.items || []).length > 0);
    }
  });
  safe(() => { const _s = UI.shop; if (typeof _s === 'function') UI.shop = function () { shops(); return _s.apply(this, arguments); }; });

  // ----- 6. insurance, documents, offices -----
  const rules = () => safe(() => {
    if (typeof INS !== 'undefined') for (const k of Object.keys(INS)) if (/health|sick|illness|critical|hospital|accident/i.test(k) || /สุขภาพ|ป่วย|โรคร้ายแรง|โรงพยาบาล/.test(String((INS[k] || {}).n || ''))) delete INS[k];
    if (window.Gov24 && Array.isArray(Gov24.offices)) for (let i = Gov24.offices.length - 1; i >= 0; i--) if (/^(health|hospreg|vacc|med)/.test(Gov24.offices[i].id)) Gov24.offices.splice(i, 1);
    if (window.Gov24 && Gov24.docs && Gov24.docs.vaccard) Gov24.docs.vaccard.life = 0;   // the medical certificate stays (it comes from the driving school now)
    if (typeof SYS !== 'undefined' && SYS.vac) delete SYS.vac;
    if (window.Agency26 && Array.isArray(Agency26.agencies)) {   // blood centre, private clinic and the sickness services of the other offices
      for (let i = Agency26.agencies.length - 1; i >= 0; i--) if (['rc', 'clinic'].includes(Agency26.agencies[i].id)) Agency26.agencies.splice(i, 1);
      const cut = { sso2: ['sick'], oic: ['health'], prof: ['lic_nurse', 'lic_pharm'] };
      for (const a of Agency26.agencies) { const L = cut[a.id]; if (L && Array.isArray(a.sv)) for (let j = a.sv.length - 1; j >= 0; j--) if (L.includes(a.sv[j].k || a.sv[j].id)) a.sv.splice(j, 1); if (a.id === 'prof') a.n = String(a.n).replace(' · พยาบาล · เภสัช', ''); }
    }   // "vaccines & check-ups" life system
  });
  // a medical certificate is no longer asked for: the document check treats it as held
  safe(() => {
    if (window.Gov24) { const _h = Gov24.has; Gov24.has = function (id) { return id === 'vaccard' ? true : _h.apply(this, arguments); }; if (Gov24.need) { const _n = Gov24.need; Gov24.need = function (ids, what) { return _n.call(this, (Array.isArray(ids) ? ids : [ids]).filter(x => x !== 'vaccard'), what); }; } }
    if (typeof JOBS2 !== 'undefined') for (const k of ['busdriver']) if (JOBS2[k] && JOBS2[k].ok) { const _ok = JOBS2[k].ok; JOBS2[k].ok = function () { try { return _ok.apply(this, arguments); } catch (e) { return false; } }; }
  });

  const all = () => { purgeWorld(); jobs(); shops(); rules(); wipe(); lock(); };
  all(); [1500, 4000, 9000].forEach(ms => setTimeout(all, ms));
  let n = 0; const iv = setInterval(() => { try { if (typeof G !== 'undefined' && G && G.started) { clearInterval(iv); setTimeout(all, 1200); setTimeout(all, 5000); } else if (++n > 900) clearInterval(iv); } catch (e) { } }, 700);
  window.NoHealth254 = { all, isMed, purgeWorld, lock, MEDNAME, MEDID };
});
