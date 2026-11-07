'use strict';
// ---------- v28_walkin: the paperwork becomes a place you walk into. A combined "ศูนย์รวมบริการภาครัฐ" stands in the main district around the
// village square (document counters + the 10 v26 agencies); the four large cities get the same counters inside their existing government
// buildings. Every counter has a queue ticket (wait depends on the hour / weekday), opening hours with public-holiday closure and a clerk
// at the window. Applications that need original papers can no longer be filed from the phone (the phone says where to go and offers a taxi),
// and approved documents are collected at the counter (auto-posted after 30 days, no late fee). ----------
V23.add('v28_walkin', () => {
  if (typeof Gov24 === 'undefined' || typeof Agency26 === 'undefined' || typeof Docs26 === 'undefined' || typeof Rooms === 'undefined' || !window.V25 || !window.V23Kit) return;
  const kit = window.V23Kit;
  const st = () => (S.v28 = S.v28 || {});
  const W = { tickets: {}, cnt: null, force: false };           // runtime only: tickets taken in this visit, the counter you stand at
  const CT = {};                                                // counter id -> counter
  const NAME = 'ศูนย์รวมบริการภาครัฐ';
  const hol = d => !!(window.Cal24 && Cal24.isHoliday && Cal24.isHoliday(d));
  const msg = (from, t) => { try { Phone.msg(from, t); } catch (e) { } };
  const hh = h => `${String(Math.floor(h)).padStart(2, '0')}:${h % 1 ? '30' : '00'}`;
  const rnd = seed => { let h = 2166136261; for (const c of String(seed)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 1000) / 1000; };
  const dayIdx = () => (S.day - 1) % 7;
  const gname = id => (Gov24.docs[id] || {}).n || id;

  // ===================== 1. what needs a counter =====================
  // v26_docs applications that need original papers and a signature in person (the rest stay online: tax refund, trade registration, food permit, scholarship, compulsory insurance)
  const IN_DOC = new Set(['birth', 'marry', 'divorce', 'rename', 'med', 'visa', 'deed', 'ps', 'alc', 'hotel', 'factory', 'pet', 'aid']);
  // applications that take days and are therefore collected at the counter once approved
  const HOLD = new Set(['birth', 'divorce', 'rename', 'visa', 'deed', 'ps', 'alc', 'hotel', 'factory', 'aid']);
  // agency services that need you at the window (the others, e.g. claims, complaints, e-donation, tax view, stay on the phone)
  const IN_SV = new Set(['sso2|s39', 'sso2|pen', 'pawn|pledge', 'pawn|redeem', 'pawn|shop', 'baac|open', 'baac|loan', 'baac|defer', 'rc|donate', 'rc|perk', 'rc|renew', 'rc|vol',
    'exec|cert', 'exec|mediate', 'exec|plan', 'dd|work', 'dd|emp', 'clinic|cert', 'clinic|vax', 'clinic|card', 'clinic|check', 'family|wed', 'family|birth', 'family|fam']);
  const DOC_GROUP = {};                                         // application key -> document counter key
  const DOCS_CT = [
    { k: 'regis', n: 'ทะเบียนราษฎร์และครอบครัว', s: 'ยื่นคำขอทะเบียน', i: '👪', apps: ['birth', 'marry', 'divorce', 'rename'] },
    { k: 'health', n: 'ใบรับรองแพทย์และสัตว์เลี้ยง', s: 'ใบรับรอง/สัตว์', i: '🩺', apps: ['med', 'pet'] },
    { k: 'biz', n: 'ธุรกิจและใบอนุญาตประกอบกิจการ', s: 'ใบอนุญาตธุรกิจ', i: '🏪', apps: ['comm', 'alc', 'food', 'hotel', 'factory'] },
    { k: 'land', n: 'ที่ดิน เกษตร และภาษี', s: 'ที่ดิน/เกษตร/ภาษี', i: '🗺️', apps: ['deed', 'aid', 'taxrefund'] },
    { k: 'travel', n: 'วีซ่า ขนส่ง และ พ.ร.บ.', s: 'วีซ่า/ขนส่ง', i: '🛂', apps: ['visa', 'ps', 'cmpi'] },
    { k: 'edu', n: 'ทุนการศึกษา', s: 'ทุนการศึกษา', i: '🎓', apps: ['schol'] },
  ];
  for (const d of DOCS_CT) for (const k of d.apps) DOC_GROUP[k] = d.k;
  const AG_ORDER = ['family', 'sso2', 'oic', 'exec', 'dip', 'dd', 'rc', 'clinic', 'baac', 'pawn'];

  // ===================== 2. opening hours =====================
  const isOpenH = H => {
    if (!H) H = { wd: [8.5, 16.5], sat: [9, 12] };
    if (H.hol) return false; if (H.all) return true;
    const h = S.time / 60, d = dayIdx(), w = d < 5 ? H.wd : d === 5 ? H.sat : H.sun;
    return !!w && h >= w[0] && h < w[1];
  };
  const todayW = H => { H = H || {}; const d = dayIdx(); return H.all ? [0, 24] : d < 5 ? H.wd : d === 5 ? H.sat : H.sun; };
  const hoursText = H => { H = H || { wd: [8.5, 16.5], sat: [9, 12] }; if (H.hol) return 'ปิดวันหยุดราชการ'; if (H.all) return 'เปิด 24 ชม.'; const r = w => w ? `${hh(w[0])}–${hh(w[1])}` : 'ปิด'; return `จ-ศ ${r(H.wd)} · ส ${r(H.sat)} · อา ${r(H.sun)}`; };
  const DOC_H = { wd: [8.5, 16.5], sat: [9, 12] };
  const holShut = H => (hol() && !(H && H.holOK)) ? { hol: 1 } : H;
  const hid = c => c.ag ? c.ag.id : (c.hid || null);
  const cOpen = c => (window.Hours36 && hid(c)) ? Hours36.open(hid(c)) : c.ag ? Agency26.isOpen(c.ag) : isOpenH(holShut(c.hrs));
  const cHours = c => (window.Hours36 && hid(c)) ? Hours36.text(hid(c)) : c.ag ? (() => { const H = c.ag.hrs; const base = hoursText(H); return H.holOK ? base : base + ' · ปิดวันหยุดราชการ'; })() : hoursText(c.hrs);
  // the queue closes 30 minutes before the counter (staff serve everyone already holding a ticket)
  const closeAt = c => { if (window.Hours36 && hid(c)) return Hours36.cutoff(hid(c)); const w = todayW(c.ag ? c.ag.hrs : c.hrs); return w ? w[1] : 0; };

  // ===================== 3. queue tickets =====================
  const wait = c => {
    const h = S.time / 60, d = dayIdx();
    let ahead = 2 + Math.floor(rnd(`${c.id}|${S.day}|${Math.floor(S.time / 30)}`) * 6);
    if ((h >= 9 && h < 11.5) || (h >= 13 && h < 15)) ahead += 4; else if (h >= 12 && h < 13) ahead -= 1;
    if (d === 0) ahead += 3; if (hol(S.day - 1)) ahead += 4;
    ahead = Math.max(1, ahead);
    const per = 3 + Math.floor(rnd(c.id + 'p') * 3);
    return { ahead, per, mins: Math.round(ahead * per / 5) * 5 || 5 };
  };
  const ticketNo = c => `${'ABCDEFGHJKLMNPRSTUVWXYZ'[Math.floor(rnd(c.id + 'L') * 23)]}${String(10 + Math.floor(rnd(c.id + S.day + S.time) * 89)).padStart(3, '0')}`;
  const here = () => G.inRoom && Rooms.cur && Rooms.cur.def ? Rooms.cur.def.kind : null;
  const inCounter = () => !!(W.cnt && G.inRoom && W.cnt.room === here());
  const ticketHtml = c => {
    const w = wait(c), left = closeAt(c) * 60 - S.time;
    return `<p class="lead">🟢 ${esc(c.n)} · ${esc(cHours(c))}</p>
      <div class="card"><div class="ci">🎫</div><div class="cb"><h4>คิวตอนนี้ รออีก ${w.ahead} คน</h4><p class="dim">คนละ ~${w.per} นาที → รอประมาณ ${w.mins} นาที${S.time / 60 >= 9 && S.time / 60 < 11.5 ? ' (ช่วงเช้าคนเยอะ)' : S.time / 60 >= 13 && S.time / 60 < 15 ? ' (ช่วงบ่ายคนเยอะ)' : ''}${dayIdx() === 0 ? ' · วันจันทร์คนมาก' : ''}${hol(S.day - 1) ? ' · วันทำการแรกหลังวันหยุด' : ''}</p>
      <p class="dim">ปิดรับคิวเมื่อ ${hh(closeAt(c))} (เหลือ ${Math.max(0, Math.floor(left))} นาที)</p>
      <div class="row end"><button class="btn${left < 0 ? ' ghost' : ''}" data-a="w28tk" data-v="${esc(c.id)}">🎫 กดบัตรคิว แล้วรอเรียก</button></div></div></div>`;
  };
  const serve = c => {
    if (!G.inRoom) { UI.toast('เข้าไปที่เคาน์เตอร์ในอาคารก่อน', '🏛️'); return; }
    if (!cOpen(c)) { UI.toast(`${c.s} ปิดทำการ (${cHours(c)})`, '🕒'); return; }
    W.cnt = { id: c.id, room: here() };
    const t = W.tickets[c.id]; if (t && t.day === S.day) { c.open(); return; }
    UI.open('🎫 ' + c.n, null, () => ticketHtml(c));
  };
  UI.H.w28tk = d => {
    const c = CT[d.v]; if (!c) return;
    if (!cOpen(c)) { UI.toast(`${c.s} ปิดทำการ`, '🕒'); return; }
    const w = wait(c), left = closeAt(c) * 60 - S.time;
    if (left < 0) { UI.toast(`ปิดรับบัตรคิวแล้ว (รับถึง ${hh(closeAt(c))}) มาใหม่ในวันทำการถัดไป`, '🕒'); return; }
    if (w.mins > left + 25) w.mins = Math.max(5, Math.floor(left + 25));      // staff speed up near closing so the ticket is always served
    UI.close();
    fade(() => {
      tick(w.mins);
      const no = ticketNo(c); W.tickets[c.id] = { no, day: S.day }; W.cnt = { id: c.id, room: here() };
      UI.toast(`ถึงคิว ${no} แล้ว เชิญที่ช่อง "${c.s}" (รอ ${w.mins} นาที)`, '🎫');
      try { Sfx.coin && Sfx.click && Sfx.click(); } catch (e) { }
      c.open();
    });
  };

  // ===================== 4. counters =====================
  const mkCounter = (id, o) => { if (CT[id]) return CT[id]; o.id = id; return (CT[id] = o); };   // (no Object.assign: it would freeze the live hours getter)
  const docCounter = (def, room) => mkCounter(`${def.k}@${room}`, { n: def.n, s: def.s, i: def.i, hid: 'docs', hrs: DOC_H, open: () => UI.open(`${def.i} ${def.n}`, null, () => docHtml(def)) });
  const rcvCounter = room => mkCounter(`rcv@${room}`, { n: 'รับเอกสาร / ติดตามคำขอ', s: 'รับเอกสาร', i: '📬', hid: 'docs', hrs: DOC_H, open: () => UI.open('📬 รับเอกสาร / ติดตามคำขอ', null, rcvHtml) });
  const agCounter = (id, room) => { const a = Agency26.agencies.find(x => x.id === id); if (!a) return null; return mkCounter(`${id}@${room}`, { n: a.n, s: a.s, i: a.i, ag: a, hrs: a.hrs, open: () => Agency26.agency(id) }); };
  const govCounter = (id, room) => { const off = Gov24.offices.find(o => o.id === id); if (!off) return null; return mkCounter(`g24${id}@${room}`, { n: off.n, s: off.s, i: off.i, hid: id, get hrs() { return off.hrs || DOC_H; }, open: () => origOffice(id) }); };

  const reqLine = ids => ids.map(r => { if (r === 'buildhome:') return `${Object.keys(Gov24.st().docs).some(k => k.startsWith('buildhome:') && Gov24.has(k)) ? '✅' : '❌'} ใบอนุญาตก่อสร้าง`; return `${Gov24.has(r) ? '✅' : '❌'} ${esc(gname(r))}`; }).join(' · ');
  const readyDocs = () => Docs26.st().apps.map((p, i) => [p, i]).filter(([p]) => p.st === 'pending' && S.day >= p.due);
  const appName = k => (Docs26.apps.find(a => a.k === k) || { n: k }).n;
  const docHtml = def => {
    const list = Docs26.apps.filter(a => def.apps.includes(a.k)), st0 = Docs26.st();
    const ready = readyDocs().filter(([p]) => def.apps.includes(p.k));
    let h = `<p class="lead">🪪 ยื่นต่อหน้าเจ้าหน้าที่ ต้องมีเอกสารตัวจริงตามที่ระบุ · ${esc(hoursText(DOC_H))}</p>`;
    if (ready.length) h += `<h5>📬 เอกสารที่พร้อมรับ</h5><div class="grid">${ready.map(([p, i]) => `<div class="card"><div class="ci">📬</div><div class="cb"><h4>${esc(appName(p.k))}</h4><p class="dim">เลขที่ ${esc(p.no)} · อนุมัติแล้ว มารับได้เลย</p><div class="row end"><button class="btn" data-a="w28rcv" data-v="${i}">รับเอกสาร</button></div></div></div>`).join('')}</div>`;
    h += `<div class="grid">${list.map(a => {
      const why = Docs26.problem(a), pend = st0.apps.some(p => p.k === a.k && p.st === 'pending');
      return `<div class="card"><div class="ci">${a.i}</div><div class="cb"><h4>${esc(a.n)}</h4><p class="dim">${esc(a.info)}</p><p class="dim">🏢 ${esc(a.office)} · ${a.fee ? baht(a.fee) : 'ฟรี'} · ${a.days ? a.days + ' วัน' + (HOLD.has(a.k) ? ' · รับที่เคาน์เตอร์' : '') : 'เสร็จทันที'}${IN_DOC.has(a.k) ? '' : ' · ยื่นออนไลน์ได้ที่มือถือด้วย'}</p><p class="dim">ต้องมี: ${reqLine(a.req)}</p>${why && !pend ? `<p class="bad">${esc(why)}</p>` : ''}${a.input ? `<input id="v26in" maxlength="30" placeholder="${esc(a.input)}">` : ''}<div class="row end">${pend ? '<span class="dim">⏳ รอพิจารณา</span>' : `<button class="btn${why ? ' ghost' : ''}" data-a="v26" data-v="submit|${a.k}">ยื่น${a.fee ? ' ' + baht(a.fee) : ''}</button>`}</div></div></div>`;
    }).join('')}</div>`;
    return h;
  };
  const rcvHtml = () => {
    const d = readyDocs(), ag = Agency26.st().apps.map((p, i) => [p, i]).filter(([p]) => p.st === 'pending' && S.day >= p.due), wait2 = Docs26.st().apps.filter(p => p.st === 'pending' && S.day < p.due);
    let h = `<p class="lead">มารับเอกสารที่อนุมัติแล้วได้ที่นี่ · ถ้าไม่มารับภายใน 30 วัน ระบบจะส่งทางไปรษณีย์ให้เอง (ไม่มีค่าปรับ)</p>`;
    h += `<h5>📬 พร้อมรับ</h5>${d.length + ag.length ? `<div class="grid">${d.map(([p, i]) => `<div class="card"><div class="ci">📬</div><div class="cb"><h4>${esc(appName(p.k))}</h4><p class="dim">เลขที่ ${esc(p.no)}</p><div class="row end"><button class="btn" data-a="w28rcv" data-v="${i}">รับเอกสาร</button></div></div></div>`).join('')}${ag.map(([p, i]) => `<div class="card"><div class="ci">📬</div><div class="cb"><h4>${esc(gname(p.doc))}</h4><p class="dim">${esc(p.from || '')} · เลขที่ ${esc(p.no)}</p><div class="row end"><button class="btn" data-a="w28rcva" data-v="${i}">รับเอกสาร</button></div></div></div>`).join('')}</div>` : '<p class="empty">ยังไม่มีเอกสารที่พร้อมรับ</p>'}`;
    h += `<h5>⏳ กำลังพิจารณา</h5>${wait2.length ? wait2.map(p => `<p class="lead">${esc(appName(p.k))} — ผล${RD(p.due)}</p>`).join('') : '<p class="empty">ไม่มี</p>'}`;
    return h;
  };
  // pick up one approved application: only that one is decided today (the others stay on the counter)
  UI.H.w28rcv = d => {
    const x = Docs26.st(), app = x.apps[+d.v]; if (!app || app.st !== 'pending' || S.day < app.due) return;
    const keep = [], pay = x.pay; x.pay = {};
    for (const p of x.apps) if (p !== app && p.st === 'pending' && S.day >= p.due) { keep.push([p, p.due]); p.due = 1e9; }
    try { Docs26.daily(); } catch (e) { console.warn('v28 receive', e); } finally { x.pay = pay; for (const [p, due] of keep) p.due = due; }
    UI.renderBody();
  };
  UI.H.w28rcva = d => { W.force = true; try { UI.H.v26a({ v: 'pick|' + d.v }); } finally { W.force = false; } UI.renderBody(); };

  // ===================== 5. keep the phone honest =====================
  const centreDoor = () => { const c = st().centre; return c ? c.door : null; };
  const feeTo = p => Math.max(40, Math.round(40 + Math.hypot(p.x, p.z + 62) * 0.35));
  const goHtml = (title, what, ctr) => {
    const i = TAXI_DEST.findIndex(t => t.n === NAME), t = TAXI_DEST[i];
    const cities = (V25.cityList ? V25.cityList() : []).filter(c => c.size === 'large' && c.visited);
    return `<p class="lead">${esc(what)} ต้องไปที่เคาน์เตอร์ด้วยตัวเอง (ตรวจเอกสารตัวจริงและเซ็นต่อหน้าเจ้าหน้าที่)</p>
      <div class="card"><div class="ci">🏛️</div><div class="cb"><h4>${NAME}</h4><p class="dim">อยู่ในหมู่บ้านสุขใจ ใกล้ลานน้ำพุ (หา 🏛️ บนแผนที่) · เคาน์เตอร์ "${esc(ctr || title)}" · ต้องกดบัตรคิวก่อนเข้าเคาน์เตอร์</p>
      ${t && !G.inRoom ? `<div class="row end"><button class="btn" data-a="w28go" ${S.money < t.fee ? 'disabled' : ''}>🚕 ไปเลย ${baht(t.fee)}</button></div>` : '<p class="dim">(ออกไปข้างนอกก่อน แล้วเรียกแท็กซี่)</p>'}</div></div>
      ${cities.map(c => `<div class="card"><div class="ci">${c.icon}</div><div class="cb"><h4>ศาลากลางและศูนย์บริการ ${esc(c.n)}</h4><p class="dim">เคาน์เตอร์ชุดเดียวกันมีใน${esc(c.n)} (เมืองใหญ่)</p><div class="row end"><button class="btn ghost" data-a="v25go" data-v="${c.key}" ${S.money < c.fee ? 'disabled' : ''}>🚕 ${baht(c.fee)}</button></div></div></div>`).join('')}`;
  };
  UI.H.w28go = () => { const i = TAXI_DEST.findIndex(t => t.n === NAME); if (i >= 0) UI.H.taxi({ i }); };
  const goThere = (title, what, ctr) => UI.open('🏛️ ต้องไปที่เคาน์เตอร์', null, () => goHtml(title, what, ctr));
  const docCtrName = k => { const d = DOCS_CT.find(x => x.k === DOC_GROUP[k]); return d ? d.s : ''; };
  { const _v = UI.H.v26;
    UI.H.v26 = d => {
      const [k, ...r] = String(d.v || '').split('|');
      if (k === 'submit' && IN_DOC.has(r[0]) && !inCounter()) { goThere(appName(r[0]), `"${appName(r[0])}"`, docCtrName(r[0])); return; }
      return _v(d);
    }; }
  { const _a = UI.H.v26a;
    UI.H.v26a = d => {
      const [k, ...r] = String(d.v || '').split('|');
      if (!W.force && !inCounter() && (k === 'pick' || (k === 'sv' && IN_SV.has(r[0] + '|' + r[1])))) {
        const ag = Agency26.agencies.find(a => a.id === r[0]);
        let nm = 'การรับเอกสาร'; if (k === 'sv' && ag) { const s = ag.sv.find(x => x.id === r[1]); nm = s ? s.n : ag.n; } else if (k === 'pick') { const p = Agency26.st().apps[+r[0]]; nm = p ? `รับ${gname(p.doc)}` : nm; }
        goThere(nm, `"${nm}"`, ag ? ag.s : 'รับเอกสาร'); return;
      }
      return _a(d);
    }; }
  // label the buttons on the phone screens that now need a counter, and say where to go
  const decorate = () => {
    const root = document.getElementById('mBody'); if (!root || inCounter()) return;
    let n = 0;
    for (const b of root.querySelectorAll('button[data-a="v26"],button[data-a="v26a"]')) {
      const [k, ...r] = String(b.dataset.v || '').split('|');
      const need = b.dataset.a === 'v26' ? (k === 'submit' && IN_DOC.has(r[0])) : (k === 'pick' || (k === 'sv' && IN_SV.has(r[0] + '|' + r[1])));
      if (!need) continue; n++; b.textContent = '🏛️ ต้องไปที่เคาน์เตอร์'; b.classList.add('ghost');
    }
    if (n && !root.querySelector('.w28b')) {
      const t = TAXI_DEST.find(x => x.n === NAME);
      root.insertAdjacentHTML('afterbegin', `<div class="card w28b"><div class="ci">🏛️</div><div class="cb"><h4>บางเรื่องต้องไปที่เคาน์เตอร์</h4><p class="dim">ปุ่ม "🏛️ ต้องไปที่เคาน์เตอร์" ต้องใช้เอกสารตัวจริงและเซ็นต่อหน้าเจ้าหน้าที่ ที่ ${NAME} (หรือศาลากลางในเมืองใหญ่) · เรื่องออนไลน์ยื่นจากมือถือได้เลย</p>${t && !G.inRoom ? `<div class="row end"><button class="btn" data-a="w28go">🚕 ไป${NAME} ${baht(t.fee)}</button></div>` : ''}</div></div>`);
    }
  };
  { const _r = UI.renderBody; UI.renderBody = function () { _r.apply(this, arguments); try { decorate(); } catch (e) { } }; }

  // ===================== 6. day processing: collect at the counter, 30-day fallback =====================
  { const _nd = newDay;
    newDay = function () {
      const held = [];
      try { for (const a of Docs26.st().apps) if (a.st === 'pending' && HOLD.has(a.k) && S.day >= a.due && S.day < a.due + 30) { held.push([a, a.due]); a.due = 1e9; } } catch (e) { }
      let r; try { r = _nd.apply(this, arguments); } finally { for (const [a, d] of held) a.due = d; }
      try {
        for (const a of Docs26.st().apps) if (a.st === 'pending' && HOLD.has(a.k) && S.day >= a.due && !a.w28) {
          a.w28 = 1; msg((Docs26.apps.find(x => x.k === a.k) || {}).office || NAME, `"${appName(a.k)}" (${a.no}) อนุมัติแล้ว มารับที่เคาน์เตอร์ "${docCtrName(a.k) || 'รับเอกสาร'}" ที่${NAME} ภายใน 30 วัน (ถ้าไม่มา เราส่งไปรษณีย์ให้ ไม่มีค่าปรับ)`);
        }
        // agency papers sitting at the counter for 30 days are posted out (decided at mid-morning so the office hours do not matter)
        const t0 = S.time, ags = Agency26.st().apps;
        for (let i = 0; i < ags.length; i++) if (ags[i].st === 'pending' && S.day >= ags[i].due + 30) { S.time = 10 * 60; W.force = true; try { UI.H.v26a({ v: 'pick|' + i }); } catch (e) { } finally { W.force = false; S.time = t0; } }
      } catch (e) { console.warn('v28 walkin day', e); }
      return r;
    }; }

  // ===================== 7. the main-district centre =====================
  const centreItems = room => {
    const out = DOCS_CT.map(d => docCounter(d, room));
    out.push(rcvCounter(room));
    for (const id of AG_ORDER) { const c = agCounter(id, room); if (c) out.push(c); }
    return out;
  };
  const toItem = c => ({ label: c.s, icon: c.i, fn: () => serve(c) });
  const roomSize = n => { const per = Math.min(Math.max(n, 1), 6), rows = Math.ceil(Math.max(n, 1) / per); return { w: Math.max(16, Math.round(per * 3.4 + 4)), d: Math.max(11, 7 + rows * 4), per, rows }; };
  const looks = ['toon:chic', 'toon:suit', 'Olivia', 'Erika', 'toon:civil', 'toon:jacket', 'Lydia', 'Kate'];
  ROOM_KIND.v28wk = { w: 24, d: 19, floor: 0xe8e0d0, wall: 0xf4fbf8, title: NAME };
  const _rb = Rooms.build;
  Rooms.build = function (def, K) {
    _rb.call(this, def, K);
    if (!def.v28) return;
    const g = this.group, X = RM0.x, Z = RM0.z, Wd = K.w, D = K.d, items = def.v28.items(), per = 6;
    const zone = (txt, z) => { const sg = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 0.7), new THREE.MeshBasicMaterial({ map: U.signTex(txt, { w: 512, h: 90, bg: '#00695c' }) })); sg.position.set(X - Wd / 2 + 0.16, 2.6, Z + z); sg.rotation.y = Math.PI / 2; g.add(sg); };
    const zs = [-D / 2 + 2.6, -D / 2 + 2.6 + 4.2, -D / 2 + 2.6 + 8.4];
    zone('โซน A · เอกสารและทะเบียน', zs[0]); zone('โซน B · หน่วยงานรัฐและครอบครัว', zs[1]); zone('โซน C · การเงิน สุขภาพ เอกชน', zs[2]);
    const rowOf = n => n < 6 ? 0 : n < 12 ? 1 : 2, colOf = n => n < 6 ? n : n < 12 ? n - 6 : n - 12, inRow = r => r === 0 ? 6 : r === 1 ? 6 : items.length - 12;
    items.forEach((c, n) => {
      const r = rowOf(n), cc = colOf(n), k = inRow(r), x = k === 1 ? 0 : -Wd / 2 + 3 + cc * ((Wd - 6) / (k - 1)), z = zs[r];
      U.mk(g, GEO.box, mc(0x8d6e63), [X + x, 0.53, Z + z], [2.5, 1.05, 0.7]); this.cols.push(Col.box(X + x, Z + z, 1.25, 0.35, 0));
      U.mk(g, GEO.box, mc(0xeeeeee), [X + x, 1.08, Z + z], [2.6, 0.06, 0.8]);
      const sg = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.55), new THREE.MeshBasicMaterial({ map: U.signTex(c.s, { w: 384, h: 90, bg: '#00695c' }) })); sg.position.set(X + x, 2.3, Z + z - 0.45); g.add(sg);
      const o = Models.human({ skin: 0xe0a87e, hair: 0x1b120c, avatar: looks[n % looks.length] }); o.position.set(X + x, 0, Z + z - 0.9); o.visible = cOpen(c); g.add(o); this.staff.push(o);
      this.pois.push({ kind: 'act', x: X + x, z: Z + z + 1.0, r: 1.45, label: c.s, icon: c.i, act: () => ({ icon: c.i, label: c.s, fn: () => serve(c) }) });
    });
    // low glass partitions between the three zones, a waiting area and the ticket kiosk
    for (let r = 0; r < 2; r++) U.mk(g, GEO.box, M.glass, [X, 0.55, Z + (zs[r] + zs[r + 1]) / 2 + 0.6], [Wd - 1, 1.1, 0.05]);
    for (const bx of [-5, 0, 5]) { U.mk(g, GEO.box, mc(0x455a64), [X + bx, 0.28, Z + D / 2 - 3.6], [3.2, 0.5, 0.7]); this.cols.push(Col.box(X + bx, Z + D / 2 - 3.6, 1.6, 0.35, 0)); }
    this.pois.push({ kind: 'act', x: X + Wd / 2 - 2, z: Z + D / 2 - 1.4, r: 1.5, label: 'ตู้กดบัตรคิว / ข้อมูลเคาน์เตอร์', icon: '🎫', act: () => ({ icon: '🎫', label: 'ดูคิวและเวลาทำการทุกเคาน์เตอร์', fn: () => UI.open('🎫 ตู้กดบัตรคิว', null, () => kioskHtml(items)) }) });
    this.pois.push({ kind: 'act', x: X - Wd / 2 + 2, z: Z + D / 2 - 1.4, r: 1.5, label: 'กระเป๋าเอกสารของฉัน', icon: '🪪', act: () => ({ icon: '🪪', label: 'ดูเอกสารที่มี', fn: () => UI.open('กระเป๋าเอกสาร', null, Gov24.wallet) }) });
  };
  const kioskHtml = items => `<p class="lead">เวลาตอนนี้ ${Phone.clock ? Phone.clock() : ''} น. · เปิดอยู่ ${items.filter(cOpen).length}/${items.length} เคาน์เตอร์ · บัตรคิวใช้ได้ตลอดการอยู่ในอาคาร</p><div class="grid">${items.map(c => { const o = cOpen(c), w = wait(c), t = W.tickets[c.id]; return `<div class="card"><div class="ci">${c.i}</div><div class="cb"><h4>${esc(c.s)} ${o ? '🟢' : '🔴'}</h4><p class="dim">${esc(cHours(c))}${o ? ` · รอ ~${w.mins} นาที (${w.ahead} คิว)` : ''}${t && t.day === S.day ? ` · บัตรคิวของคุณ ${esc(t.no)}` : ''}</p></div></div>`; }).join('')}</div>`;

  // entering: the centre is shut when every counter is closed
  { const _en = Rooms.enter;
    Rooms.enter = function (poi) {
      const d = poi && poi.room && poi.room.v28;
      if (d && !d.items().some(cOpen)) { UI.toast(`${NAME}ปิดทำการ (เปิดจ-ศ ${hh(8.5)}–${hh(16.5)} · คลินิกและโรงรับจำนำเปิดนานกว่า)`, '🕒'); return; }
      return _en.call(this, poi);
    };
    const _lv = Rooms.leave;
    Rooms.leave = function (instant) { W.tickets = {}; W.cnt = null; return _lv.call(this, instant); }; }

  let probe = null;
  const CW = 16, CD = 10, x0c = c => !(c && c.v === 2);
  const findSpot = () => {
    const x = st(); if (x.centre && x.centre.v === 2) return x.centre;
    // street-aligned spot first (same building line as the neighbours, nothing on the road); saves from before the fix are moved once
    if (window.Align32) {
      const sp = Align32.find({ w: CW, d: CD, cx: 10, cz: -300, rMax: 160 });
      if (sp) { const dr = l2w(sp.x, sp.z, sp.rot, 0, CD / 2 + 1.7); x.centre = { x: sp.x, z: sp.z, rot: sp.rot, v: 2, door: { x: Math.round(dr.x * 10) / 10, z: Math.round(dr.z * 10) / 10 } }; return x.centre; }
    }
    if (x.centre) return x.centre;
    const h = { x: -14, z: -262 };   // the village fountain square: the middle of the main district
    const o = { w: 20, d: 12 };
    const corners = (px, pz, hw, hd, rot) => [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([a, b]) => l2w(px, pz, rot, a, b));
    const axes = (rot) => [[Math.cos(rot), -Math.sin(rot)], [Math.sin(rot), Math.cos(rot)]];
    const sat = (A, B) => { // true when two oriented boxes overlap
      const pa = corners(A.x, A.z, A.hw, A.hd, A.rot), pb = corners(B.x, B.z, B.hw, B.hd, B.rot);
      for (const ax of axes(A.rot).concat(axes(B.rot))) {
        let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9;
        for (const p of pa) { const v = p.x * ax[0] + p.z * ax[1]; a0 = Math.min(a0, v); a1 = Math.max(a1, v); }
        for (const p of pb) { const v = p.x * ax[0] + p.z * ax[1]; b0 = Math.min(b0, v); b1 = Math.max(b1, v); }
        if (a1 <= b0 || b1 <= a0) return false;
      }
      return true;
    };
    const boxes = []; const seen = new Set();
    for (const arr of Col.map.values()) for (const s of arr) if (s.type === 'b' && !seen.has(s)) { seen.add(s); boxes.push(s); }
    const taken = (px, pz, rot) => {
      const me = { x: px, z: pz, hw: o.w / 2 + 1.2, hd: o.d / 2 + 1.2, rot };
      if (World.pois.some(p => Math.hypot(p.x - px, p.z - pz) < 9)) return 'poi';
      if (typeof LOTS !== 'undefined' && LOTS.some(l => Math.hypot(l.x - px, l.z - pz) < 13)) return 'lot';
      if (typeof P23 !== 'undefined' && P23.slots && P23.slots.some(s => Math.hypot(s.x - px, s.z - pz) < 13)) return 'p23';
      return boxes.some(b => Math.hypot(b.x - px, b.z - pz) < (b.br || 12) + 14 && sat(me, { x: b.x, z: b.z, hw: b.hw, hd: b.hd, rot: b.rot })) ? 'bld' : '';
    };
    probe = (px, pz) => { let best = 0, bd = 1e9; for (let r = 0; r < 4; r++) { const rot = r * Math.PI / 2, dr = l2w(px, pz, rot, 0, 9); const d = roadDist(dr.x, dr.z); if (d < bd) { bd = d; best = rot; } } return { rot: best, why: taken(px, pz, best), rd: roadDist(px, pz) }; };
    // first look around the village square, then wider and with looser road / slope limits
    for (const [r0, r1, d0, d1, slope] of [[28, 110, 9, 17, 0.7], [28, 200, 8, 24, 1.0], [28, 300, 7, 30, 1.4]]) for (let rad = r0; rad <= r1; rad += 4) for (let k = 0; k < 28; k++) {
      const a = (k / 28) * Math.PI * 2 + rad * 0.21, px = h.x + Math.cos(a) * rad, pz = h.z + Math.sin(a) * rad;
      const rd = roadDist(px, pz); if (rd < d0 || rd > d1) continue;
      const gy = World.groundY(px, pz); if (!(gy > 0.3) || [[10, 6], [-10, 6], [10, -6], [-10, -6]].some(([ox, oz]) => Math.abs(World.groundY(px + ox, pz + oz) - gy) > slope)) continue;
      let best = 0, bd = 1e9; for (let r = 0; r < 4; r++) { const rot = r * Math.PI / 2, dr = l2w(px, pz, rot, 0, 9); const d = roadDist(dr.x, dr.z); if (d < bd) { bd = d; best = rot; } }
      if (taken(px, pz, best)) continue;
      const door = l2w(px, pz, best, 0, o.d / 2 + 1.7);
      if (boxes.some(b => sat({ x: door.x, z: door.z, hw: 1.2, hd: 1.2, rot: 0 }, { x: b.x, z: b.z, hw: b.hw, hd: b.hd, rot: b.rot }))) continue;
      x.centre = { x: px, z: pz, rot: best, door: { x: Math.round(door.x * 10) / 10, z: Math.round(door.z * 10) / 10 } }; return x.centre;
    }
    return null;
  };
  const buildCentre = () => {
    const h = findSpot(); if (!h) { console.warn('v28 walkin: no free spot for the service centre'); return; }
    const o = { w: x0c(h) ? 20 : CW, d: x0c(h) ? 12 : CD, h: x0c(h) ? 5.8 : 5.4, flat: true, glassFront: true, wall: 0xf1f8f6, roof: 0x00695c, sign: NAME, signStyle: { bg: '#00695c' } };
    const b = World.building(o); b.position.set(h.x, World.groundY(h.x, h.z), h.z); b.rotation.y = h.rot; World.outdoor.add(b);
    Col.box(h.x, h.z, o.w / 2 + 0.3, o.d / 2 + 0.3, h.rot, 'bld'); World.clearNear(h.x, h.z, 13, true);
    const door = h.door;
    const room = { kind: 'v28wk', title: NAME, v28: { items: () => centreItems('v28wk') } };
    World.pois.push({ kind: 'act', x: door.x, z: door.z, r: 2.6, label: NAME, icon: '🏛️', map: true, room, act: () => ({ icon: '🏛️', label: 'เข้า' + NAME, fn: () => { } }) });
    if (!TAXI_DEST.some(t => t.n === NAME)) TAXI_DEST.push({ n: NAME, x: door.x, z: door.z + 2.2, fee: feeTo(door) });
  };

  // ===================== 8. the large cities: same counters inside the existing government buildings =====================
  const EXTRA = {
    hall: room => DOCS_CT.map(d => docCounter(d, room)).concat([rcvCounter(room)], ['family', 'dd'].map(id => agCounter(id, room))),
    tax: room => ['sso2', 'oic', 'exec', 'dip'].map(id => agCounter(id, room)),
    safe: room => ['rc', 'clinic'].map(id => agCounter(id, room)),
    post: room => ['baac', 'pawn'].map(id => agCounter(id, room)),
  };
  V25.ensureHook('*', (A, info) => {
    const T = kit.TOWNS.find(t => t.key === info.id); if (!T || T.size !== 'large') return;
    for (const k in EXTRA) {
      const kind = `v25_${info.id}_${k}`;
      for (const p of World.pois) {
        const r = p.room; if (!r || r.kind !== kind || !r.v25 || r.w28) continue;
        r.w28 = 1; const base = r.v25.items, ex = EXTRA[k](kind).filter(Boolean).map(toItem);
        r.v25.items = () => base().concat(ex);
        const sz = roomSize(base().length + ex.length); r.v25.per = sz.per; ROOM_KIND[kind].w = sz.w; ROOM_KIND[kind].d = sz.d;
      }
    }
  });

  // existing government counters inside the cities also take a ticket
  const origOffice = Gov24.office;
  Gov24.office = id => {
    const k = here();
    if (k && /^v25_/.test(k)) { const c = govCounter(id, k); if (c) { serve(c); return; } }
    return origOffice(id);
  };

  buildCentre();
  window.Walkin28 = { respot: () => { delete st().centre; return findSpot(); }, probe: (a, b) => probe && probe(a, b), counters: CT, centre: () => st().centre, wait, serve, inCounter, IN_DOC, IN_SV, HOLD, tickets: () => W.tickets, state: W };
});
