'use strict';
// ---------- v175_apphubs: fewer phone apps - duplicates cut, related apps folded into one app with tabs ----------
//  Found by checking every app on the phone:
//   * "บ้านอัจฉริยะ" only opened the smart-home hub (and repeated its energy figures)  -> cut, the hub stays
//   * "ขอใช้น้ำประปา" was a copy of the request section that the water app already has -> cut, the water app stays
//   * pairs and groups of apps about the same thing are now ONE app whose tabs are the old apps' own screens (nothing is rewritten, so every button, save and deep link keeps working):
//       คู่มือ = วิธีเล่น + คู่มือระบบ · ปฏิทิน = ปฏิทิน + นัดหมาย · ภารกิจ & ความสำเร็จ = ภารกิจ + ความสำเร็จ + ระดับ + เรื่องราวหมู่บ้าน + สมุดความทรงจำ
//       การศึกษา = การศึกษา + การศึกษา(ลูก & ทุน) + การศึกษาลูก · สุขภาพ = สุขภาพ & รพ. + หมอสุขใจ · เดินทาง = ไรด์ + แท็กซี่ + ข้ามเมือง + เมืองต่างๆ
//       อสังหา = อสังหาของฉัน + ทรัพย์สิน/ก่อสร้าง + ตลาดอสังหา · ออนไลน์ = เพื่อนออนไลน์ + แชทออนไลน์ + เซฟออนไลน์ · ราชการ = ราชการ + ยื่นเอกสาร + หน่วยงานเพิ่มเติม
V23.add('v175_apphubs', () => {
  if (typeof Phone === 'undefined' || typeof UI === 'undefined' || typeof APPS === 'undefined') return;
  const HUBS = [
    { host: 'guide', t: 'คู่มือ & วิธีเล่น', i: '📚', src: [['howto', '📖 วิธีเล่น'], ['guide', '📚 ระบบทั้งหมด']] },
    { host: 'cal36', t: 'ปฏิทิน & นัดหมาย', i: '📅', src: [['cal36', '📅 ปฏิทิน'], ['invite', '🗒️ นัดหมาย']] },
    { host: 'missions', t: 'ภารกิจ & ความสำเร็จ', i: '🏆', src: [['missions', '🎯 ภารกิจ'], ['ach', '🏅 ความสำเร็จ'], ['lvl39', '🏆 ระดับ'], ['saga', '📜 เรื่องราวหมู่บ้าน'], ['stories', '📖 สมุดความทรงจำ']] },
    { host: 'edu24', t: 'การศึกษา', i: '🎓', src: [['edu24', '🎓 เรียนของฉัน'], ['civsch', '🎒 ลูก & ทุน'], ['kids31', '🧒 ลูกๆ']] },
    { host: 'health31', t: 'สุขภาพ', i: '🩺', src: [['health31', '🩺 โรงพยาบาล'], ['civhos', '📱 หมอออนไลน์']] },
    { host: 'civride', t: 'เดินทาง', i: '🚗', src: [['civride', '🚗 เรียกรถ'], ['taxi', '🚕 แท็กซี่เหมา'], ['travel31', '🚆 ข้ามเมือง'], ['cities', '🌆 เมืองไกล']] },
    { host: 'estate39', t: 'อสังหา & ทรัพย์สิน', i: '🏘️', src: [['estate39', '🏠 ของฉัน'], ['prop23', '🏗️ ที่ดิน/ก่อสร้าง'], ['estate', '🏢 ตลาดอสังหา']] },
    { host: 'friends', t: 'ออนไลน์', i: '🌐', src: [['friends', '👥 เพื่อน'], ['chat', '💬 แชท'], ['cloud', '☁️ เซฟ']] },
    { host: 'gov24', t: 'ราชการ', i: '🏛️', src: [['gov24', '🏛️ ราชการ'], ['docs26', '📄 ยื่นเอกสาร'], ['agency26', '🏢 หน่วยงาน']] },
  ];
  const CUT = { home: 'shub', wreq: 'water' };
  const ORIG = {}, done = {};
  const swallow = fn => {   // run an old app without letting it open its own window; hand back what it would have shown
    const cap = { html: '', title: '', tabs: [], render: null };
    const _st = window.setTimeout, _open = UI.open, _close = UI.close, q = [];
    window.setTimeout = function (f) { q.push(f); return 0; };
    UI.open = function (title, tabs, render) { cap.title = title; cap.tabs = Array.isArray(tabs) ? tabs.slice() : []; cap.render = render; };
    UI.close = function () { };
    try { const h = fn.call(Phone); if (typeof h === 'string') cap.html = h; for (const f of q) { try { f(); } catch (e) { } } }
    finally { window.setTimeout = _st; UI.open = _open; UI.close = _close; }
    return cap;
  };
  const html = id => { try { const f = ORIG[id]; return f ? String(f.call(Phone) || '') : ''; } catch (e) { console.warn('v175 ' + id, e); return '<p class="empty">เปิดหน้านี้ไม่ได้</p>'; } };

  function openHub(h, startId) {
    const parts = []; let n = 0;
    for (const [id, label] of h.src) {
      if (!ORIG[id]) continue; let cap = swallow(ORIG[id]); const win = !cap.html && typeof cap.render === 'function';
      const names = win ? (cap.tabs.length ? cap.tabs.map(x => label + (cap.tabs.length > 1 ? ' · ' + x : '')) : [label]) : [label];
      parts.push({ id, win, cap, off: n, names }); n += names.length;
    }
    if (!parts.length) return;
    const tabs = parts.reduce((a, p) => a.concat(p.names), []);
    const render = t => {
      const p = parts.slice().reverse().find(q => t >= q.off) || parts[0], sub = t - p.off;
      try { return p.win ? String(p.cap.render(sub) || '') : html(p.id); } catch (e) { console.warn('v175 render ' + p.id, e); return '<p class="empty">เปิดหน้านี้ไม่ได้</p>'; }
    };
    const sp = parts.find(q => q.id === startId), start = sp ? sp.off : 0;
    UI.open(h.i + ' ' + h.t, tabs, render, { wide: true, tab: start });
    try { if (UI.cur && start) { UI.cur.tab = start; UI.renderBody(); } } catch (e) { }
  }

  function install() {
    for (const h of HUBS) {
      if (done[h.host] || !h.src.every(([id]) => typeof Phone.apps[id] === 'function')) continue; done[h.host] = 1;
      for (const [id] of h.src) ORIG[id] = Phone.apps[id];
      for (const [id] of h.src) Phone.apps[id] = () => { setTimeout(() => { Phone.app = null; try { UI.close(); } catch (e) { } openHub(h, id); }, 0); return ''; };
    }
    for (const id of Object.keys(CUT)) if (!done['cut_' + id] && typeof Phone.apps[id] === 'function' && typeof Phone.apps[CUT[id]] === 'function') { done['cut_' + id] = 1; const to = CUT[id]; Phone.apps[id] = (...a) => Phone.apps[to].apply(Phone, a); }
  }
  { const _r = Phone.render.bind(Phone);
    Phone.render = function () {
      try { install(); } catch (e) { console.warn('v175 install', e); }
      const gone = new Set(Object.keys(CUT)); for (const h of HUBS) if (done[h.host]) for (const [id] of h.src) if (id !== h.host) gone.add(id);
      for (const id of gone) { const i = APPS.findIndex(a => a.id === id); if (i >= 0) APPS.splice(i, 1); }
      for (const h of HUBS) if (done[h.host]) { const a = APPS.find(x => x.id === h.host); if (a) { a.i = h.i; a.n = h.t; } }
      return _r();
    }; }
  window.AppHubs175 = { HUBS, CUT, openHub, swallow };
});
