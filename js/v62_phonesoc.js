// v62_phonesoc.js: phone "ติดต่อ & สังคม", tidied
//  1) ข้อความ: 8 clear folders -> a list of people / senders -> that sender's own messages. Nothing is mixed: a message sits in the folder of its sender only.
//     Appointment messages are not shown here; they live in the appointments app, under the same sender's kind of appointment.
//  2) นัดหมาย: one appointments app (the separate "นัดหมายทั้งหมด" is gone). Opening it shows a popup with 7 categories; each category lists its own
//     appointments, friend invitations and the appointment messages that belong to it.
//  3) the "อันดับออนไลน์" app is removed.
V23.add('v62_phonesoc', () => {
  if (typeof Phone === 'undefined' || typeof APPS === 'undefined' || !window.Phone59) return;
  const E = s => (typeof esc === 'function' ? esc(s) : String(s));
  const people = () => {
    const s = new Set();
    try { for (const n of G.npcs || []) s.add(n.name); } catch (e) { }
    try { for (const k of Object.keys(S.friends || {})) s.add(k); } catch (e) { }
    try { if (S.rel) { if (S.rel.partner) s.add(S.rel.partner); for (const k of S.rel.kids || []) if (k && k.name) s.add(k.name); } } catch (e) { }
    return s;
  };
  const hm = m => { m = Math.floor(m) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  const dshort = d => { try { return Cal36.short(d); } catch (e) { return 'วันที่ ' + d; } };

  // ---- 3) remove the online ranking app and the second appointments app from the phone ----
  for (const id of ['board', 'appt39']) { const i = APPS.findIndex(a => a.id === id); if (i >= 0) APPS.splice(i, 1); }
  { const soc = Phone59.CATS.find(c => c[0] === 'social'); if (soc) soc[3] = soc[3].filter(id => id !== 'board' && id !== 'appt39'); }

  // =====================================================================================================
  // 1. messages
  // =====================================================================================================
  const MF = [['people', '👥', 'เพื่อน & ครอบครัว'], ['money', '🏦', 'การเงิน & ธนาคาร'], ['gov', '🏛️', 'ราชการ & สาธารณูปโภค'], ['care', '🩺', 'สุขภาพ & การศึกษา'], ['work', '💼', 'งาน & ธุรกิจ'], ['shop', '🛒', 'ช้อป & บ้าน'], ['news', '📰', 'ข่าว & เตือนภัย'], ['sys', '⚙️', 'ระบบ & ทั่วไป']];
  const MAP = { friend: 'people', bank: 'money', gov: 'gov', util: 'gov', health: 'care', edu: 'care', work: 'work', shop: 'shop', home: 'shop', news: 'news', safe: 'news', sys: 'sys' };
  const folderOf = m => MAP[m.cat] || 'sys';
  const prev = t => { t = String(t || ''); return t.length > 42 ? t.slice(0, 42) + '…' : t; };
  const msgsNoAppt = () => { Phone59.resort(); return (S.msgs || []).filter(m => m.cat !== 'appt'); };
  Phone.msgCat = null; Phone.msgFrom = null;
  UI.H.mcat = d => { Phone.msgCat = d.v || null; Phone.msgFrom = null; };
  UI.H.mfrom = d => { Phone.msgFrom = d.v || null; };
  UI.H.mreadall = () => { for (const m of S.msgs || []) m.read = true; try { Phone.badge(); } catch (e) { } };
  const bubble = m => `<div class="m62"><small>${RD(m.day)}</small><p>${E(m.text)}</p></div>`;
  Phone.apps.msgs = function () {
    const all = msgsNoAppt(), ppl = people();
    if (!Phone.msgCat) {
      const tiles = MF.map(([id, ic, nm]) => {
        const L = all.filter(m => folderOf(m) === id), un = L.filter(m => !m.read).length, senders = new Set(L.map(m => m.from)).size;
        return `<button class="card" data-a="mcat" data-v="${id}" style="width:100%;text-align:left"><div class="ci">${ic}</div><div class="cb"><h4>${nm}${un ? ` <span class="bad">· ใหม่ ${un}</span>` : ''}</h4><p class="dim">${L.length ? `${senders} ผู้ส่ง · ${L.length} ข้อความ` : 'ยังไม่มีข้อความ'}</p></div></button>`;
      }).join('');
      return `<div class="row"><button class="btn ghost" data-a="mreadall">✓ อ่านทั้งหมด</button></div><p class="lead">แตะโฟลเดอร์ → เลือกผู้ส่ง → อ่านข้อความของผู้ส่งนั้น · ข้อความนัดหมายอยู่ในแอป 📅 นัดหมาย</p><div class="grid">${tiles}</div>`;
    }
    const f = MF.find(x => x[0] === Phone.msgCat) || MF[0], L = all.filter(m => folderOf(m) === f[0]);
    if (!Phone.msgFrom) {
      const seen = new Map(); for (const m of L) { const g = seen.get(m.from) || { from: m.from, last: m, n: 0, un: 0 }; g.n++; if (!m.read) g.un++; seen.set(m.from, g); }
      const rows = [...seen.values()].map(g => `<button class="card" data-a="mfrom" data-v="${E(g.from)}" style="width:100%;text-align:left"><div class="ci">${ppl.has(g.from) ? '🙂' : f[1]}</div><div class="cb"><h4>${E(g.from)}${g.un ? ` <span class="bad">· ใหม่ ${g.un}</span>` : ''} <small class="dim">(${g.n})</small></h4><p class="dim">${RD(g.last.day)} · ${E(prev(g.last.text))}</p></div></button>`).join('');
      return `<div class="row"><button class="btn ghost" data-a="mcat" data-v="">‹ โฟลเดอร์</button><b>${f[1]} ${f[2]}</b></div>` + (rows ? `<div class="grid">${rows}</div>` : '<p class="empty">ยังไม่มีข้อความในโฟลเดอร์นี้</p>');
    }
    const T = L.filter(m => m.from === Phone.msgFrom); T.forEach(m => { m.read = true; }); try { Phone.badge(); } catch (e) { }
    return `<div class="row"><button class="btn ghost" data-a="mfrom" data-v="">‹ ${f[2]}</button><b>${ppl.has(Phone.msgFrom) ? '🙂' : f[1]} ${E(Phone.msgFrom)}</b></div>` + (T.length ? `<div class="th62">${T.slice().reverse().map(bubble).join('')}</div>` : '<p class="empty">ไม่มีข้อความ</p>');
  };

  // =====================================================================================================
  // 2. appointments: one app, a popup with 7 categories
  // =====================================================================================================
  const AC = [['tech', '🔧', 'ช่าง & ติดตั้ง'], ['med', '🩺', 'สุขภาพ & หมอ'], ['gov', '🏛️', 'ราชการ & การเงิน'], ['trip', '📦', 'พัสดุ & เดินทาง'], ['soc', '👥', 'เพื่อน & ครอบครัว'], ['work', '💼', 'งาน & นัดของฉัน'], ['fest', '🎉', 'เทศกาล & วันสำคัญ']];
  const EC = { tech: 'tech', med: 'med', gov: 'gov', court: 'gov', money: 'gov', ship: 'trip', trip: 'trip', love: 'soc', school: 'soc', biz: 'work', me: 'work', fest: 'fest' };
  const AM = [
    ['tech', /ช่าง|ติดตั้ง|ศูนย์ไอที|ISP|อินเทอร์เน็ต|ไฟเบอร์|มิเตอร์|การไฟฟ้า|ประปา|ผู้รับเหมา|เครือข่าย|สัญญาณ|ซ่อม/],
    ['med', /หมอ|โรงพยาบาล|คลินิก|แพทย์|พยาบาล|ตรวจสุขภาพ|ผ่าตัด|วัคซีน|สุขภาพ|ยา/],
    ['trip', /พัสดุ|ไรเดอร์|ส่งของ|จัดส่ง|ตั๋ว|เดินทาง|รถไฟ|เครื่องบิน|ท่าเรือ|ขนส่งเฟอร์/],
    ['gov', /ธนาคาร|ราชการ|อำเภอ|สรรพากร|ศาล|ขนส่งทางบก|เทศบาล|บิล|ค่าน้ำ|ค่าไฟ|ประกัน|ภาษี|เอกสาร|ใบอนุญาต|กรม|สำนักงาน|ผู้ใหญ่บ้าน|ที่ดิน|หุ้น/],
    ['soc', /ชวนไป|วันนี้ว่างไหม|แต่งงาน|เดท|ลูก|ครู|โรงเรียน|เพื่อน|แฟน/],
    ['fest', /เทศกาล|งานวัด|งานบุญ|วันหยุด|สงกรานต์|ลอยกระทง/],
  ];
  const mcatOf = m => {
    const f = String(m.from || ''), t = String(m.text || '');
    if (people().has(f) || /^(เพื่อน|ครอบครัว|แฟน|ที่รัก)$/.test(f)) return 'soc';
    for (const [c, rx] of AM) if (rx.test(f)) return c;
    for (const [c, rx] of AM) if (rx.test(t)) return c;
    return 'work';
  };
  Phone.apptPop = true; Phone.apptCat = null;
  UI.H.apcat = d => { Phone.apptCat = d.v || null; Phone.apptPop = true; };
  UI.H.appop = d => { Phone.apptPop = !!d.v; if (!d.v) Phone.apptCat = null; };
  { const _o = Phone.open.bind(Phone); Phone.open = function (app) { if (app === 'invite' || app === 'appt39') { Phone.apptPop = true; Phone.apptCat = null; app = 'invite'; } else if (app === 'msgs') { Phone.msgCat = null; Phone.msgFrom = null; } return _o(app); }; }
  const evs = () => { try { return Appt39.list(S.day, S.day + 90); } catch (e) { return []; } };
  const mine = c => evs().filter(e => (EC[e.c] || 'work') === c && (c === 'fest' || e.d >= S.day));
  const amsgs = () => { Phone59.resort(); return (S.msgs || []).filter(m => m.cat === 'appt'); };
  const evCard = e => {
    const T = Appt39.TYPES[e.c] || Appt39.TYPES.me, tm = e.t == null ? 'ทั้งวัน' : (e.t2 != null && e.t2 !== e.t ? `${hm(e.t)}–${hm(e.t2)}` : hm(e.t));
    let act = '';
    if (e.job) act = `<div class="row"><button class="btn ghost" data-a="a39pick" data-v="${e.job}">เปลี่ยนวัน/ช่วงเวลา</button><button class="btn ghost" data-a="a39cancel2" data-v="${e.job}">ยกเลิก</button></div>`;
    else if (e.note) act = `<div class="row"><button class="btn ghost" data-a="a39delnote" data-v="${e.note}">ลบ</button></div>`;
    else if (e.app) act = `<div class="row"><button class="btn ghost" data-a="a39open" data-v="${e.app}">เปิดแอป</button></div>`;
    return `<div class="card"><div class="ci" style="background:${T[1]}22">${e.i}</div><div class="cb"><h4>${E(e.n)}</h4><p class="dim">${E(dshort(e.d))}${e.d === S.day ? ' (วันนี้)' : ''} · ${tm}${e.x ? ' · ' + E(e.x) : ''}</p>${act}</div></div>`;
  };
  const noteForm = () => `<h5>📝 เพิ่มนัดของฉัน</h5><div class="card"><div class="ci">📝</div><div class="cb"><p class="dim">ชื่อนัด</p><input id="a39n" maxlength="40" placeholder="เช่น ไปตลาดริมทะเล" style="width:100%"><p class="dim">อีกกี่วันจากวันนี้ (0 = วันนี้)</p><input id="a39d" type="number" min="0" max="365" value="1" style="width:100%"><p class="dim">เวลา (เช่น 14:30 หรือเว้นว่าง)</p><input id="a39t" placeholder="HH:MM" style="width:100%"><div class="row end"><button class="btn" data-a="a39add">บันทึกนัด</button></div></div></div>`;
  const catHtml = id => {
    const c = AC.find(x => x[0] === id) || AC[0], L = mine(id).slice(0, id === 'fest' ? 12 : 30), M = amsgs().filter(m => mcatOf(m) === id); M.forEach(m => { m.read = true; }); try { Phone.badge(); } catch (e) { }
    let h = `<div class="pc59h"><button class="btn ghost" data-a="apcat" data-v="">‹ หมวด</button><b>${c[1]} ${c[2]}</b><button class="btn ghost" data-a="appop" data-v="">✕</button></div>`;
    if (id === 'soc') { try { const iv = Social2.st().invite; if (iv) h += `<h5>💌 คำเชิญจากเพื่อน</h5>` + Social2.inviteHTML(); } catch (e) { } }
    h += `<h5>นัดหมาย${id === 'fest' ? 'ที่จะถึง' : ''} (${L.length})</h5>` + (L.length ? L.map(evCard).join('') : '<p class="empty">ไม่มีนัดหมายในหมวดนี้</p>');
    if (M.length) {
      h += `<h5>✉️ ข้อความนัดหมาย (${M.length})</h5>`; const by = new Map(); for (const m of M) { (by.get(m.from) || by.set(m.from, []).get(m.from)).push(m); }
      for (const [from, arr] of by) h += `<div class="card" style="grid-template-columns:1fr"><div class="cb"><h4>${E(from)} <small class="dim">(${arr.length})</small></h4>${arr.slice(0, 4).map(bubble).join('')}</div></div>`;
    }
    if (id === 'work') h += noteForm();
    return h;
  };
  Phone.apps.invite = function () {
    const all = evs(), nxt = all.filter(e => e.c !== 'fest' && e.d >= S.day).slice(0, 4), un = amsgs().filter(m => !m.read).length;
    let h = `<p class="lead">📅 นัดหมายทั้งหมดของคุณอยู่ที่นี่ แยกเป็น ${AC.length} หมวด</p><div class="row"><button class="btn" data-a="appop" data-v="1">📂 เลือกหมวดนัดหมาย${un ? ` (ใหม่ ${un})` : ''}</button></div><h5>⏭️ ถัดไป</h5>${nxt.length ? nxt.map(evCard).join('') : '<p class="empty">ยังไม่มีนัดหมายที่จะถึง</p>'}`;
    if (Phone.apptPop) {
      const tiles = AC.map(([id, ic, nm]) => { const n = mine(id).length, u = amsgs().filter(m => !m.read && mcatOf(m) === id).length; return `<button data-a="apcat" data-v="${id}" style="padding:12px 6px"><span style="font-size:26px;display:block">${ic}${u ? `<i style="font-style:normal;font-size:11px;background:#e53935;color:#fff;border-radius:9px;padding:0 5px;margin-left:2px">${u}</i>` : ''}</span><b style="font-weight:500;font-size:13.5px">${nm}</b><small class="dim" style="display:block">${n ? n + ' นัด' : 'ว่าง'}</small></button>`; }).join('');
      h += `<div class="pc59bg" data-a="appop" data-v=""></div><div class="pc59">` + (Phone.apptCat ? catHtml(Phone.apptCat) : `<div class="pc59h"><b>📅 นัดหมาย</b><button class="btn ghost" data-a="appop" data-v="">✕ ปิด</button></div><div class="apps">${tiles}</div>`) + `</div>`;
    }
    return h;
  };
  Phone.apps.appt39 = Phone.apps.invite;

  if (!document.getElementById('ph62css')) {
    const st = document.createElement('style'); st.id = 'ph62css';
    st.textContent = '.th62{display:flex;flex-direction:column;gap:8px;margin-top:8px}.m62{background:rgba(255,255,255,.1);border-radius:14px;border-top-left-radius:4px;padding:8px 12px;max-width:94%}.m62 small{display:block;opacity:.65;font-size:11px}.m62 p{margin:2px 0 0;font-size:14.5px;line-height:1.45;color:inherit}.pc59 .card .m62{background:rgba(255,255,255,.07);margin-top:4px}';
    document.head.appendChild(st);
  }
});
