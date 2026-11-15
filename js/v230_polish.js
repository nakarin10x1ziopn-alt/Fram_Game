'use strict';
// ---------- v230: polish ----------
// 1) "ประชุมทุกวาระ" in the agenda dropdown of the board-meeting form
// 2) fewer health / education / body-condition notifications (a toast and an inbox line are shown once per few days, not every day)
// 3) the message inbox: quiet by default, loud only for real warnings; 300 messages kept; duplicates dropped (the folder / sender / delete screens stay those of v62 and v96)
V23.add('v230_polish', function () {
  const E = s => (typeof esc === 'function' ? esc(s) : String(s));

  // ================= 1. all agenda points =================
  const ALL = ['minb|1|', 'perfb|1|', 'qfin|1|', 'budget|1|', 'riskr|1|', 'cg|1|'];   // the regular agenda: no spending, no side effects
  if (typeof Company !== 'undefined' && Company.html) {
    const _h = Company.html.bind(Company);
    Company.html = function (t) {
      const h = _h(t);
      return typeof h === 'string' ? h.replace(/(<select id="ag217sel_bd\d+"[^>]*>)/, '$1<option value="all|1|">⭐ ประชุมทุกวาระ (วาระปกติทั้งหมด: รายงานเดิม · ผลงาน · งบการเงิน · งบประมาณ · ความเสี่ยง · กำกับดูแล)</option>') : h;
    };
  }
  { const o = UI.H.ag217add; if (o) UI.H.ag217add = function (d) {
    const sel = document.getElementById(`ag217sel_${d.k}${d.v}`);
    if (!sel || sel.value !== 'all|1|') return o.apply(this, arguments);
    // feed every regular item through the normal handler (a hidden stand-in carries each value)
    const real = sel, rid = real.id; real.id = rid + '_real';
    try {
      for (const v of ALL) { const ph = document.createElement('input'); ph.id = rid; ph.value = v; document.body.appendChild(ph); try { o.call(this, Object.assign({}, d, { all: 1 })); } finally { ph.remove(); } }
    } finally { real.id = rid; }
    try { UI.toast('เพิ่มวาระปกติทั้งหมดแล้ว (ครบทุกหัวข้อของการประชุม)', '🗓️'); } catch (e) { }
  }; }

  // ================= 2. health / education / body: throttle =================
  const THR = [   // [name, pattern, minimum days between two of the same kind]
    ['hunger', /หิวมาก|หิวโหย|กระหายน้ำ|ขาดน้ำ|อดอาหาร|พลังงานต่ำ|พลังงานใกล้หมด/, 3],
    ['tired', /เหนื่อยล้า|หมดแรง|ง่วงมาก|อ่อนเพลีย|นอนไม่พอ/, 4],
    ['sick', /ป่วย|อาการ|ไข้|ไอมาก|เป็นไอ|หวัด|ท้องเสีย|อาหารเป็นพิษ|เป็นลม|ฉุกเฉิน|ER|กู้ชีพ|รถพยาบาล|หายดี|โรคเรื้อรัง|ฝุ่น PM|ยา(?:ธรรมดา)?ไม่|หมอ(?!ก)|โรงพยาบาล|สุขภาพ/, 4],
    ['edu', /โรงเรียน|การบ้าน|ค่าเทอม|(?<!ตรวจ|ผู้)สอบ(?!บัญชี)|นักเรียน|ครูประจำชั้น|คอร์สเรียน|การศึกษา|เรียนหนังสือ|ชั้นเรียน|ผลการเรียน/, 7],
  ];
  const stem = t => String(t || '').replace(/[0-9๐-๙.,:%฿]+/g, '#').replace(/\s+/g, ' ').replace(/^ข้อความจาก[^:]*:\s*/, '').slice(0, 26);
  const thrKey = text => { const t = String(text || ''); for (const [n, rx] of THR) if (rx.test(t)) return n + ':' + stem(t); return null; };
  const gap = key => (THR.find(x => key.startsWith(x[0] + ':')) || [0, 0, 3])[2];
  const seen = () => { const o = (S._thr230 = S._thr230 || {}); if (o._d != null && o._d > S.day + 1) { for (const k in o) delete o[k]; } o._d = S.day; return o; };   // a loaded older save resets the table
  const blocked = key => { if (!key) return false; const o = seen(), last = o[key]; if (last != null && S.day - last < gap(key)) return true; o[key] = S.day; return false; };
  const STAT = window.V230 = { shown: 0, dropped: 0, by: {} };
  { const _t = UI.toast; UI.toast = function (m) { try { const k = thrKey(m), n = k ? k.split(':')[0] : 'other'; if (blocked(k)) { STAT.dropped++; STAT.by['x_' + n] = (STAT.by['x_' + n] || 0) + 1; return; } STAT.by[n] = (STAT.by[n] || 0) + 1; } catch (e) { } STAT.shown++; return _t.apply(this, arguments); }; }

  // ================= 3. messages =================
  const F = [
    { id: 'appt', i: '📅', n: 'นัดหมาย' }, { id: 'bank', i: '🏦', n: 'การเงิน & ธนาคาร' }, { id: 'util', i: '⚡', n: 'ไฟฟ้า น้ำ อินเทอร์เน็ต' }, { id: 'safe', i: '🚨', n: 'เตือนภัย & ความปลอดภัย' },
    { id: 'health', i: '🩺', n: 'สุขภาพ' }, { id: 'edu', i: '🎓', n: 'การศึกษา' }, { id: 'gov', i: '🏛️', n: 'ราชการ & ชุมชน' }, { id: 'work', i: '💼', n: 'งาน & ธุรกิจ' },
    { id: 'home', i: '🏠', n: 'บ้าน & ช่าง & ไอที' }, { id: 'shop', i: '🛵', n: 'สั่งซื้อ & จัดส่ง' }, { id: 'news', i: '📰', n: 'ข่าว & ปฏิทิน' }, { id: 'sys', i: '⚙️', n: 'ระบบ & ทั่วไป' },
  ];
  const byId = Object.fromEntries(F.map(c => [c.id, c]));
  const URGENT = /^(⚠️|🚨)|เตือน|ค่าปรับ|ถูกปรับ|ครบกำหนดวันนี้|เกินกำหนด|OTP|ผิดนัด|ยึด|ฉุกเฉิน|ไฟไหม้|น้ำท่วม|พายุ|ขโมย|โจรกรรม|อาการวิกฤต/;
  const LOUD = new Set(['safe', 'appt', 'work', 'shop', 'gov', 'friend']);
  const PAGE = 12, KEEP = 300;
  if (typeof Phone !== 'undefined' && Phone.msg) {
    const _msg = Phone.msg;
    Phone.msg = function (from, text, quiet) {
      const f = String(from || ''), t = String(text || ''), old = (S.msgs || []).slice();
      // the same line twice on the same day is one line; health and education lines repeat at most every few days
      if (old.some(x => x.from === f && x.text === t && x.day === S.day)) return;
      const k = thrKey(t); if (k && old.some(x => x.from === f && stem(x.text) === stem(t) && S.day - x.day < gap(k))) return;
      const r = _msg.call(this, from, text, true);   // the original adds the line and sorts it into a folder (never pops by itself: decided below)
      try {
        const m = (S.msgs || [])[0]; if (m && m.from === f) S.msgs = [m].concat(old).slice(0, KEEP);
        if (m) {
          const loud = URGENT.test(f + ' ' + t) || (!quiet && LOUD.has(m.cat));
          if (loud) UI.toast(`ข้อความจาก${f}: ${t.length > 40 ? t.slice(0, 40) + '…' : t}`, '📱');
        }
      } catch (e) { console.warn('v230 msg', e); }
      return r;
    };
  }
});
