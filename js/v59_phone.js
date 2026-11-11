// v59_phone.js: the phone, tidied
//  1) message folders: every sender / text is sorted by an explicit rule table (the old folders sent technicians, online shops, school staff, the stock exchange
//     and game notices to "friends"). Only real people (villagers, friends, partner, kids) land in the friends folder; everything else has its own folder
//  2) home screen: ~17 category icons instead of ~90 app icons. Tapping a category opens a popup with the apps that belong to it; search still finds every app
V23.add('v59_phone', () => {
  if (typeof Phone === 'undefined' || typeof APPS === 'undefined') return;
  const E = s => (typeof esc === 'function' ? esc(s) : String(s));

  // =====================================================================================================
  // 1. message folders
  // =====================================================================================================
  const F = [
    { id: 'appt', i: '📅', n: 'นัดหมาย' },
    { id: 'bank', i: '🏦', n: 'การเงิน & ธนาคาร' },
    { id: 'util', i: '⚡', n: 'ไฟฟ้า น้ำ อินเทอร์เน็ต' },
    { id: 'safe', i: '🚨', n: 'เตือนภัย & ความปลอดภัย' },
    { id: 'health', i: '🩺', n: 'สุขภาพ' },
    { id: 'edu', i: '🎓', n: 'การศึกษา' },
    { id: 'gov', i: '🏛️', n: 'ราชการ & ชุมชน' },
    { id: 'work', i: '💼', n: 'งาน & ธุรกิจ' },
    { id: 'home', i: '🏠', n: 'บ้าน & ช่าง & ไอที' },
    { id: 'shop', i: '🛵', n: 'สั่งซื้อ & จัดส่ง' },
    { id: 'news', i: '📰', n: 'ข่าว & ปฏิทิน' },
    { id: 'friend', i: '👥', n: 'เพื่อน & ครอบครัว' },
    { id: 'sys', i: '⚙️', n: 'ระบบ & ทั่วไป' },
  ];
  const byId = Object.fromEntries(F.map(c => [c.id, c]));
  // sender rules, first match wins (the sender is the most reliable clue)
  const SENDER = [
    ['sys', /ระบบเกม|ทีมงานเกม|สุขใจบอท|น้องสุขใจ|เบอร์ไม่รู้จัก|^AI$/],
    ['safe', /ตำรวจ|ปภ\.?|เตือนภัย|แจ้งเตือนความปลอดภัย|กล้องวงจรปิด|กล้องจราจร|ดับเพลิง|กู้ภัย|ด่านตรวจ|อุตุนิยม|ศูนย์เตือน/],
    ['health', /โรงพยาบาล|หมอ|สุขภาพ|คลินิก|สาธารณสุข|พยาบาล|แพทย์/],
    ['edu', /โรงเรียน|ครู|วิทยาลัย|มหาวิทยาลัย|คอร์ส|กยศ|การศึกษา|ทะเบียนและวัดผล/],
    ['util', /การไฟฟ้า|ประปา|ไฟฟ้า|มาตรวัดน้ำ|อินเทอร์เน็ต|ไฟเบอร์|บรอดแบนด์|โมบาย|ดาวเทียม|เอ็นเตอร์ไพรส์|ISP|ศูนย์ EV|พลังงาน/],
    ['bank', /ธนาคาร|สินเชื่อ|ประกัน|หุ้น|หลักทรัพย์|ก\.ล\.ต|สลาก|สอบบัญชี|ดอกเบี้ย|เครดิต|AI ตลาด|ข่าวเศรษฐกิจ|ข่าวตลาด/],
    ['shop', /ไรเดอร์|ช้อป|มอลล์|ส่งของ|พัสดุ|จัดส่ง|ขนส่งเฟอร์|ร้านเกษตร|ร้านเฟอร์|ร้าน(?!ของฉัน)|สั่งซื้อ/],
    ['home', /บ้านอัจฉริยะ|^บ้าน$|แจ้งเตือนบ้าน|ศูนย์ไอที|ช่าง|ตู้เย็น|ระบบเครือข่าย|ผู้รับเหมา|เครื่องใช้ไฟฟ้า/],
    ['news', /^ข่าว|สื่อ|ปฏิทิน/],
    ['gov', /^(สำนักงาน|กรม|องค์การ|อบต|อำเภอ|ผู้ใหญ่|คณะกรรมการ|เทศบาล|สมาคม)|ขนส่งทางบก|สรรพากร|เลือกตั้ง|วัด|ศาสนา|ศาล|ชุมชน|อิหม่าม|มัสยิด|โบสถ์/],
    ['work', /ฝ่ายบุคคล|ฟาร์ม|คนงาน|โดรน|เซนเซอร์|ธุรกิจ|ร้านของฉัน|เรนเดอร์|งานออนไลน์|แผนวันนี้|แผงหน้า|สมัครงาน|พนักงาน|คู่สัญญา|บริษัท|บ่อปลา|ไร่|เจ้าของห้องแถว/],
  ];
  // text rules for senders we cannot recognise (employees, applicants, investors, shop owners ...)
  const TEXT = [
    ['appt', /นัด(?:หมาย|ตรวจ|พบ|ช่าง|ไว้|เวลา|ยื่น|รับ|ส่ง|ฟัง|สอบ)|ช่างจะมา|ช่างถึง|ช่างกำลัง|ช่าง(?:มา)?สาย|เวลานัด|ครบกำหนดนัด|คิวตรวจ|ชวนไป|วันนี้ว่างไหม|เตือนนัด|มีนัด|^(?:พรุ่งนี้|อีก 1 ชั่วโมง)\s*:/],
    ['safe', /น้ำท่วม|พายุ|ภัยแล้ง|แผ่นดินไหว|ไฟไหม้|ภัยพิบัติ|ฝุ่น PM|เตือนภัย|ขโมย/],
    ['health', /โรงพยาบาล|ผ่าตัด|ใบรับรองแพทย์|นอนโรงพยาบาล|แพทย์/],
    ['bank', /ถือหุ้น|หุ้น|ธนาคาร|ดอกเบี้ย|เงินฝาก|สินเชื่อ|ผ่อนชำระ|ภาษี/],
    ['util', /ค่าไฟ|ค่าน้ำ|อินเทอร์เน็ต|ไฟดับ|ไฟตก|น้ำไม่ไหล/],
    ['shop', /พัสดุ|สั่งซื้อ|จัดส่ง|ไรเดอร์|ออเดอร์/],
    ['work', /เงินเดือน|รับเข้าทำงาน|สมัครงาน|ทำงาน|สัญญา|ผลผลิต|ลาออก/],
  ];
  const people = () => {
    const s = new Set();
    try { for (const n of G.npcs || []) s.add(n.name); } catch (e) { }
    try { for (const k of Object.keys(S.friends || {})) s.add(k); } catch (e) { }
    try { if (S.rel) { if (S.rel.partner) s.add(S.rel.partner); for (const k of S.rel.kids || []) if (k && k.name) s.add(k.name); } } catch (e) { }
    return s;
  };
  const PERSON = /^(เพื่อน|ครอบครัว|แฟน|ที่รัก)$/;
  const catOf = m => {
    const f = String((m && m.from) || ''), t = String((m && m.text) || '');
    if (/^ช่างติดตั้ง$/.test(f)) return 'appt';                       // the technician's own visit messages are part of the appointment
    if (people().has(f) || PERSON.test(f)) return TEXT[0][1].test(t) ? 'appt' : 'friend';       // a person: friend folder, unless it is an invitation / appointment
    // an appointment text wins over the sender, except for banks, the power / water offices and game notices
    for (const [c, rx] of SENDER) if (rx.test(f)) return TEXT[0][1].test(t) && c !== 'bank' && c !== 'sys' && !/การไฟฟ้า|ประปา/.test(f) ? 'appt' : c;
    for (const [c, rx] of TEXT) if (rx.test(t)) return c;
    return 'sys';
  };
  // the message itself carries the folder, so the old (wrong) one is replaced on every new message and once for the saved inbox
  { const _m = Phone.msg;
    Phone.msg = function (from, text, quiet) {
      const r = _m.apply(this, arguments); const m = (S.msgs || [])[0]; if (m && m.from === from) m.cat = catOf(m); return r;
    }; }
  const resort = () => { for (const m of S.msgs || []) m.cat = catOf(m); };
  resort();
  Phone.msgCat = null;
  const item = x => `<div class="msg"><b>${E(x.from)}</b><small>${RD(x.day)}</small><p>${E(x.text)}</p></div>`;
  Phone.apps.msgs = function () {
    resort(); const all = S.msgs || [];
    if (!Phone.msgCat) {
      const rows = F.map(c => {
        const L = all.filter(m => m.cat === c.id), un = L.filter(m => !m.read).length;
        return `<button class="card" data-a="mcat" data-v="${c.id}" style="width:100%;text-align:left"><div class="ci">${c.i}</div><div class="cb"><h4>${c.n}${L.length ? ` <small class="dim">(${L.length})</small>` : ''}${un ? ` <span class="bad">· ใหม่ ${un}</span>` : ''}</h4><p class="dim">${L.length ? E(L[0].from) + ': ' + E(L[0].text.length > 46 ? L[0].text.slice(0, 46) + '…' : L[0].text) : 'ไม่มีข้อความ'}</p></div></button>`;
      }).join('');
      return `<p class="lead">ข้อความแยกตามประเภท · แตะโฟลเดอร์เพื่อเปิดอ่าน</p><div class="grid">${rows}</div>`;
    }
    const c = byId[Phone.msgCat] || F[0], L = all.filter(m => m.cat === c.id);
    L.forEach(m => { m.read = true; }); Phone.badge();
    return `<div class="row"><button class="btn ghost" data-a="mcat" data-v="">‹ ทุกโฟลเดอร์</button><b>${c.i} ${c.n}</b></div>` + (L.length ? `<div class="msgs">${L.map(item).join('')}</div>` : '<p class="empty">ยังไม่มีข้อความในโฟลเดอร์นี้</p>');
  };
  // the appointments app lists appointment messages (replace the earlier, differently sorted list at its end)
  { const _inv = Phone.apps.invite;
    Phone.apps.invite = function () {
      let h = _inv ? _inv.call(this) : ''; const i = h.indexOf('<h5>📅 รายการนัดหมาย</h5>'); if (i >= 0) h = h.slice(0, i);
      resort(); const L = (S.msgs || []).filter(m => m.cat === 'appt'); L.forEach(m => { m.read = true; }); Phone.badge();
      return h + `<h5>📅 รายการนัดหมาย</h5>` + (L.length ? `<div class="msgs">${L.map(item).join('')}</div>` : '<p class="empty">ยังไม่มีนัดหมาย</p>');
    }; }

  // =====================================================================================================
  // 2. home screen: categories with a popup
  // =====================================================================================================
  const CATS = [
    ['bank', '🏦', 'ธนาคาร & การเงิน', ['mbank49', 'bank', 'loan', 'ins']],
    ['invest', '📈', 'ลงทุน & หุ้น', ['stock', 'oracle', 'fund50']],
    ['estate', '🏘️', 'อสังหา & ทรัพย์สิน', ['estate', 'estate39', 'prop23']],
    ['home', '🏠', 'บ้าน & อุปกรณ์', ['home', 'shub', 'lights56', 'house36', 'mv37']],
    ['util', '⚡', 'ไฟ น้ำ เน็ต', ['grid', 'water', 'wreq', 'isp', 'usage36']],
    ['it', '💻', 'ไอที & กล้อง', ['itc', 'cctv', 'pcstat51']],
    ['farm', '🌾', 'ฟาร์ม & เกษตร', ['agri', 'farm31', 'plots40', 'garden42', 'stand48', 'ranch', 'pets', 'biz']],
    ['work', '💼', 'งาน & ธุรกิจ', ['career', 'jobs', 'company', 'biz31']],
    ['shop', '🛒', 'ช้อป & อาหาร', ['shop', 'food']],
    ['go', '🚗', 'เดินทาง & แผนที่', ['map', 'gps', 'taxi', 'civride', 'travel31', 'cities']],
    ['gov', '🏛️', 'ราชการ & ชุมชน', ['gov24', 'agency26', 'docs26', 'tax', 'vote', 'court31', 'village31', 'rel24']],
    ['health', '🩺', 'สุขภาพ', ['health31', 'civhos']],
    ['edu', '🎓', 'การศึกษา', ['edu24', 'civsch', 'kids31']],
    ['alert', '🚨', 'เตือนภัย', ['alert', 'disaster31']],
    ['social', '👥', 'ติดต่อ & สังคม', ['call', 'msgs', 'chat39', 'chat', 'people', 'friends', 'invite', 'appt39', 'cards', 'board', 'family']],
    ['life', '📅', 'ชีวิตประจำวัน', ['today', 'cal36', 'wx', 'cam', 'news', 'news31', 'diary', 'diary31', 'life25', 'life26', 'missions', 'ach', 'collect', 'saga', 'stories']],
    ['sys', '⚙️', 'ระบบ & ช่วยเหลือ', ['me36', 'lvl39', 'set', 'guide', 'howto', 'cloud']],
  ];
  const catOfApp = {}; for (const c of CATS) for (const id of c[3]) catOfApp[id] = c[0];
  Phone.cat = null;
  UI.H.pcat = d => { Phone.cat = d.v || null; try { Sfx.click(); } catch (e) { } };
  { const _o = Phone.open.bind(Phone); Phone.open = function (app) { Phone.cat = null; return _o(app); }; }

  if (!document.getElementById('pc59css')) {
    const st = document.createElement('style'); st.id = 'pc59css';
    st.textContent = '.pc59bg{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:70}.pc59{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(392px,92vw);max-height:78vh;overflow:auto;background:var(--panel-solid,#183424);border:1px solid var(--line,rgba(255,255,255,.2));border-radius:22px;padding:14px 12px 16px;z-index:71;box-shadow:0 20px 50px rgba(0,0,0,.55)}.pc59 .pc59h{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-size:16px}.pc59 .apps{margin:4px 0 2px}#phRes .apps{margin-top:4px}';
    document.head.appendChild(st);
  }
  let btnOf = {};      // id -> button html of the latest render (keeps the lock tags and badges added by other modules)
  { const _r = Phone.render.bind(Phone);
    Phone.render = function () {
      const h = _r(); if (this.app) return h;
      for (const k in catOfApp) delete catOfApp[k]; for (const c of CATS) for (const id of c[3]) catOfApp[id] = c[0];      // later modules may add or remove apps in a category
      btnOf = {}; const rx = /<button data-a="app" data-v="([^"]+)"[^>]*>[\s\S]*?<\/button>/g; let m;
      while ((m = rx.exec(h))) btnOf[m[1]] = m[0];
      const top = (/<div class="ph-top">[\s\S]*?<\/div>/.exec(h) || [''])[0], sos = (/<div class="ph-sos">[\s\S]*$/.exec(h) || [''])[0];
      const rest = APPS.filter(a => !catOfApp[a.id] && btnOf[a.id]);
      const L = CATS.map(c => ({ id: c[0], i: c[1], n: c[2], ids: c[3].filter(id => btnOf[id]) })); if (rest.length) L.push({ id: 'other', i: '✨', n: 'อื่น ๆ', ids: rest.map(a => a.id) });
      const unread = this.unread();
      const tile = c => `<button data-a="pcat" data-v="${c.id}" data-n="${E(c.n)}"><span>${c.i}${c.id === 'social' && unread ? `<i>${unread}</i>` : ''}</span>${c.n}</button>`;
      let html = top + `<input id="phSearch" placeholder="🔍 ค้นหาแอป..." autocomplete="off" style="width:100%;margin:2px 0 8px" oninput="Phone59.search(this.value)"><div id="phRes"></div><div class="apps" id="phCats">${L.filter(c => c.ids.length).map(c => c.ids.length === 1 ? (c.ids[0] === 'mbank49' ? '' : btnOf[c.ids[0]]) : tile(c)).join('')}</div>` + sos;
      const open = L.find(c => c.id === Phone.cat);
      if (open && open.ids.length) html += `<div class="pc59bg" data-a="pcat" data-v=""></div><div class="pc59"><div class="pc59h"><b>${open.i} ${open.n}</b><button class="btn ghost" data-a="pcat" data-v="">✕ ปิด</button></div><div class="apps">${open.ids.map(id => btnOf[id]).join('')}</div></div>`;
      return html;
    }; }
  // search across every app (name or category name); shows the app buttons themselves
  const search = q => {
    const res = document.getElementById('phRes'), cats = document.getElementById('phCats'); if (!res || !cats) return; q = String(q || '').trim().toLowerCase();
    if (!q) { res.innerHTML = ''; cats.hidden = false; return; }
    const hit = APPS.filter(a => btnOf[a.id] && (a.n.toLowerCase().includes(q) || ((CATS.find(c => c[0] === catOfApp[a.id]) || [])[2] || '').toLowerCase().includes(q)));
    cats.hidden = true; res.innerHTML = hit.length ? `<div class="apps">${hit.map(a => btnOf[a.id]).join('')}</div>` : '<p class="empty">ไม่พบแอปที่ค้นหา</p>';
  };
  window.Phone59 = { search, catOf, F, CATS, resort };
});
