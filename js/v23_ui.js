'use strict';
// ---------- v23_ui: HUD/phone layout without overlaps, back-to-home on every panel, a map that always closes,
// a bigger and steadier "E" action target, and phone messages sorted into one folder per sender kind ----------
V23.add('ui', () => {
  // the old +200 million test grant is retired (js/v39_testperiod.js owns the test-period money now); old saves keep what they already got
  { const t = S.v23 = S.v23 || {}; t.grant200 = 1; }

  const M = () => $('modal');

  // ===== 1. layout & hit-area CSS (loaded last so it wins over the older layers) =====
  const css = document.createElement('style');
  css.textContent = `
/* long unbroken text (emoji runs, ids) and wide tables never push a phone app sideways */
#mBody{overflow-x:hidden;overflow-wrap:anywhere}
#mBody table{display:block;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}
#mBody img,#mBody canvas,#mBody video{max-width:100%}
#mBody .card{min-width:0}#mBody .cb{min-width:0}
#modal.phone .mbox{width:min(420px,100%)}
@media (max-width:640px){#modal.phone{padding:0;align-items:flex-end}#modal.phone .mbox{width:100%;max-height:94vh;border-radius:22px 22px 0 0}
  #modal.phone .apps{grid-template-columns:repeat(4,minmax(0,1fr))}
  #fps{display:none}}
/* header: back + home buttons */
.mhead{flex-wrap:nowrap}
.mhead h2{flex:1 1 auto;min-width:0;white-space:nowrap}
#mWallet{margin-left:0;flex:0 0 auto;font-size:clamp(13px,3.4vw,17px)}
#mBack,#mHome{flex:0 0 auto;min-width:40px;height:38px;border-radius:19px;border:1px solid var(--line);background:rgba(255,255,255,.1);color:var(--ink);font-size:15px;padding:0 12px;white-space:nowrap}
#mHome{width:40px;padding:0;font-size:18px}
#mBack[hidden]{display:none}
#mBack:hover,#mHome:hover{background:rgba(255,207,63,.35)}
.ph-back{position:sticky;top:0;z-index:2}
/* the action target: one big steady pill above the hotbar (desktop), a larger hit area on the round button (touch) */
#prompt{pointer-events:auto!important;cursor:pointer;display:flex;align-items:center;gap:10px;min-height:44px;padding:8px 18px 8px 10px!important;font-size:15px!important;border-radius:26px!important;bottom:calc(112px + env(safe-area-inset-bottom,0px))!important;left:50%;transform:translateX(-50%);z-index:8!important;max-width:min(92vw,520px);white-space:normal!important;line-height:1.25}
#prompt:active{transform:translateX(-50%) scale(.97)}
#prompt kbd{flex:0 0 auto;display:grid;place-items:center;min-width:32px;height:32px;border-radius:8px;background:linear-gradient(180deg,#ffe27a,#f2a516);color:#3a2a05;font:700 16px/1 Kanit,sans-serif;border:0;box-shadow:0 2px 0 rgba(0,0,0,.35)}
#prompt .pl{flex:1 1 auto}
#hudBR{align-items:center!important}
#bAct{position:relative;touch-action:manipulation}
#bAct::before{content:'';position:absolute;inset:-14px;border-radius:50%}
body:not(.touch) #bAct:not(.idle):not(.info)::after{content:'E';position:absolute;top:-4px;right:-4px;width:26px;height:26px;border-radius:7px;background:#fff;color:#3a2a05;font:700 14px/26px Kanit,sans-serif;text-align:center;box-shadow:0 2px 0 rgba(0,0,0,.35)}
`;
  document.head.appendChild(css);

  // ===== 2. modal: header buttons, parent chain, classes reset, and a map that can never get stuck =====
  const head = document.querySelector('.mhead'), title = $('mTitle');
  const back = document.createElement('button'); back.id = 'mBack'; back.type = 'button'; back.hidden = true; back.textContent = '‹ กลับ'; back.setAttribute('aria-label', 'กลับ');
  const home = document.createElement('button'); home.id = 'mHome'; home.type = 'button'; home.textContent = '🏠'; home.title = 'กลับหน้าหลักของเกม'; home.setAttribute('aria-label', 'กลับหน้าหลัก');
  head.insertBefore(back, title); head.insertBefore(home, $('mClose'));
  home.onclick = () => { Sfx.click(); UI.close(); };
  back.onclick = () => {
    Sfx.click();
    const c = UI.cur; if (!c || !c.parent) return;
    const p = c.parent;
    if (typeof p.reopen === 'function') { UI.close(); p.reopen(); return; }
    // restore the panel we came from exactly as it was
    UI.cur = p; M().classList.remove('side'); M().classList.toggle('wide', !!p.wide);
    $('mTitle').textContent = p.title; M().classList.add('show'); document.body.classList.add('modal-open');
    if (p.title === 'มือถือ') M().classList.add('phone'); else M().classList.remove('phone');
    UI.renderBody();
  };
  const syncHead = () => {
    const c = UI.cur;
    back.hidden = !c || !c.parent;
    home.hidden = !c || M().classList.contains('side');
  };

  const _open = UI.open;
  UI.open = function (t, tabs, render, opts) {
    const prev = this.cur;
    // an old panel's look must not leak into the next one (phone width, side drawer)
    M().classList.remove('phone', 'side');
    const r = _open.call(this, t, tabs, render, opts);
    const c = this.cur;
    if (prev && c) {
      if (prev.title === c.title) c.parent = prev.parent;                       // a refresh of the same panel keeps its way back
      else if (!(prev.tabs && prev.tabs.length === 0 && prev.render && prev.title === 'สร้างตัวละครของคุณ')) c.parent = prev;
    } else if (!prev && c && V23UI.lastClosed && performance.now() - V23UI.lastClosed.t < 120 && V23UI.lastClosed.title === 'มือถือ' && t !== 'มือถือ') {
      c.parent = { title: 'มือถือ', reopen: () => Phone.open() };                // phone apps that open their own screen can return to the phone
    }
    syncHead();
    return r;
  };
  const V23UI = { lastClosed: null };
  const _close = UI.close;
  UI.close = function () {
    const c = this.cur;
    if (c) V23UI.lastClosed = { title: c.title, t: performance.now() };
    try { _close.call(this); } finally {
      // whatever happened inside onClose, the overlay is really gone
      M().classList.remove('show', 'side', 'phone');
      if (!this.cur) document.body.classList.remove('modal-open');
      syncHead();
    }
  };
  const _rb = UI.renderBody;
  UI.renderBody = function () { _rb.call(this); syncHead(); };

  // watchdog: the overlay can only be visible while a panel exists
  setInterval(() => {
    if (!UI.cur && (M().classList.contains('show') || document.body.classList.contains('modal-open'))) {
      M().classList.remove('show', 'side', 'phone'); document.body.classList.remove('modal-open');
    }
  }, 400);

  // M / back button toggles the map shut; the map also closes with a tap on its dark backdrop
  const _big = UI.bigMap;
  UI.bigMap = function () {
    if (UI.cur && UI.cur.title === 'แผนที่') { UI.close(); return; }
    _big.call(this);
    window.addEventListener('resize', onResize);
  };
  const onResize = () => { if (UI.cur && UI.cur.title === 'แผนที่' && UI.cur.after) { try { UI.cur.after(); } catch (e) { } } else window.removeEventListener('resize', onResize); };
  addEventListener('keydown', e => {
    if (e.code === 'KeyM' && UI.cur && UI.cur.title === 'แผนที่' && !/INPUT|TEXTAREA/.test((e.target || {}).tagName || '')) { e.preventDefault(); UI.close(); }
  });

  // ===== 3. the "E" target: grace time + a little more reach so the prompt does not flicker out =====
  const key = t => t ? t.kind + ':' + (t.poi ? (t.poi.id || t.poi.n || t.poi.x + ',' + t.poi.z) : t.i != null ? t.i : t.n ? t.n.name : t.car ? t.car.d.type : t.A ? t.A.d.name : t.s ? 's' : '') : '';
  const boosted = new WeakSet();
  const boost = list => { for (const p of list || []) if (!boosted.has(p) && p.r && !p.fest) { boosted.add(p); if (p.r < 3.2) p.r += 0.45; } };
  const _ft = findTarget; let last = null, lastAt = 0, lastKey = '';
  findTarget = function () {
    boost(World.pois); boost(World.inPois);
    const t = _ft(), now = performance.now(), p = G.player && G.player.pos;
    if (t) { if (key(t) !== lastKey) { last = t; lastKey = key(t); } lastAt = now; return t; }
    // just stepped off the edge: keep the same target for a moment while still close enough
    if (last && p && now - lastAt < 350) {
      const o = last.poi || last.n || (last.car && last.car.d) || (last.A && last.A.d);
      const ox = o && (o.x != null ? o.x : null), oz = o && (o.z != null ? o.z : null);
      if (ox != null && Math.hypot(p.x - ox, p.z - oz) < (last.poi ? last.poi.r * 1.35 : 2.6)) return last;
    }
    last = null; lastKey = ''; return null;
  };
  // tap/click the prompt pill = press E
  const pr = $('prompt');
  pr.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); doAction(); });
  const _act = UI.action;
  UI.action = function (d) {
    _act.call(this, d);
    if (d) pr.innerHTML = (d.fn ? '<kbd>E</kbd>' : '<kbd>ℹ</kbd>') + '<span class="pl">' + esc(d.label) + '</span>';
  };

  // ===== 4. phone messages: one folder per kind, appointments only under appointments =====
  const CATS = [
    { id: 'appt', i: '📅', n: 'นัดหมาย', re: /นัดหมาย|นัดตรวจ|นัดพบ|ช่างจะมา|เวลานัด|ครบกำหนดนัด|คิวตรวจ|ชวนไป|วันนี้ว่างไหม/ },
    { id: 'bank', i: '🏦', n: 'การเงิน & ธนาคาร', re: /ธนาคาร|สินเชื่อ|ประกัน|ภาษี|สลาก|หุ้น|เครดิต|ดอกเบี้ย|เงินฝาก/ },
    { id: 'util', i: '⚡', n: 'ไฟฟ้า น้ำ อินเทอร์เน็ต', re: /การไฟฟ้า|ประปา|อินเทอร์เน็ต|เน็ต|สุขใจโมบาย|ค่าน้ำ|ค่าไฟ|ISP|ไฟตก|ไฟดับ|น้ำไม่ไหล/ },
    { id: 'safe', i: '🚨', n: 'ความปลอดภัย & เตือนภัย', re: /ตำรวจ|ปภ|เตือนภัย|ความปลอดภัย|กล้องวงจรปิด|แจ้งเตือน|เตือนแมลง|ดับเพลิง/ },
    { id: 'gov', i: '🏛️', n: 'ราชการ & ชุมชน', re: /อบต|อำเภอ|องค์การ|ผู้ใหญ่บ้าน|เลือกตั้ง|กรม|ขนส่ง|โรงเรียน|วัด|ข่าวหมู่บ้าน|ปฏิทิน|สำนักงาน/ },
    { id: 'health', i: '🩺', n: 'สุขภาพ', re: /สุขภาพ|โรงพยาบาล|หมอ/ },
    { id: 'work', i: '💼', n: 'งาน & ธุรกิจ', re: /ฝ่ายบุคคล|ฟาร์ม|คนงาน|โดรน|เซนเซอร์|ธุรกิจ|ร้านของฉัน|ผู้รับเหมา|เจ้าของห้องแถว|เรนเดอร์|แผนวันนี้|แผงหน้า|บ้านอัจฉริยะ|บ้าน$/ },
    { id: 'shop', i: '🛵', n: 'สั่งซื้อ & จัดส่ง', re: /ไรเดอร์|ช้อป|ส่งของ|พัสดุ|โดรนส่ง/ },
    { id: 'friend', i: '💬', n: 'เพื่อน & ผู้คน', re: /.*/ },
  ];
  const byId = Object.fromEntries(CATS.map(c => [c.id, c]));
  // sender decides first (so a bank never lands in "appointments" because of a word), the text only decides appointments
  const catOf = m => {
    if (m.cat && byId[m.cat]) return m.cat;
    const f = m.from || '';
    if (byId.appt.re.test(m.text || '') && !/ธนาคาร|การไฟฟ้า|ประปา/.test(f)) return 'appt';
    for (const c of CATS) if (c.id !== 'friend' && c.re.test(f)) return c.id;
    return 'friend';
  };
  const _msg = Phone.msg;
  Phone.msg = function (from, text, quiet) {
    _msg.call(this, from, text, quiet);
    const m = (S.msgs || [])[0]; if (m && m.from === from && !m.cat) m.cat = catOf(m);
  };
  Phone.msgCat = null;
  Phone.apps.msgs = function () {
    const all = S.msgs || [];
    if (!Phone.msgCat) {
      const rows = CATS.map(c => {
        const L = all.filter(m => catOf(m) === c.id), un = L.filter(m => !m.read).length;
        return `<button class="card" data-a="mcat" data-v="${c.id}" style="width:100%;text-align:left"><div class="ci">${c.i}</div><div class="cb"><h4>${c.n}${un ? ` <span class="bad">· ใหม่ ${un}</span>` : ''}</h4><p class="dim">${L.length ? esc(L[0].from) + ': ' + esc(L[0].text.length > 46 ? L[0].text.slice(0, 46) + '…' : L[0].text) : 'ไม่มีข้อความ'}</p></div></button>`;
      }).join('');
      return `<p class="lead">ข้อความแยกตามประเภท · แตะโฟลเดอร์เพื่อเปิดอ่าน</p><div class="grid">${rows}</div>`;
    }
    const c = byId[Phone.msgCat] || CATS[0], L = all.filter(m => catOf(m) === c.id);
    L.forEach(m => { m.read = true; }); Phone.badge();
    return `<div class="row"><button class="btn ghost" data-a="mcat" data-v="">‹ ทุกโฟลเดอร์</button><b>${c.i} ${c.n}</b></div>` +
      (L.length ? `<div class="msgs">${L.map(x => `<div class="msg"><b>${esc(x.from)}</b><small>${RD(x.day)}</small><p>${esc(x.text)}</p></div>`).join('')}</div>` : '<p class="empty">ยังไม่มีข้อความในโฟลเดอร์นี้</p>');
  };
  UI.H.mcat = d => { Phone.msgCat = d.v || null; Sfx.click(); };
  // leaving the messages app always returns to the folder list next time
  const _app = UI.H.app; UI.H.app = d => { if (d.v === 'msgs') Phone.msgCat = null; _app(d); };

  // appointment messages also live inside the appointments app, and only there (besides the folder)
  const _inv = Phone.apps.invite;
  Phone.apps.invite = function () {
    const L = (S.msgs || []).filter(m => catOf(m) === 'appt'); L.forEach(m => { m.read = true; }); Phone.badge();
    return (_inv ? _inv.call(this) : '') +
      `<h5>📅 รายการนัดหมาย</h5>` + (L.length ? `<div class="msgs">${L.map(x => `<div class="msg"><b>${esc(x.from)}</b><small>${RD(x.day)}</small><p>${esc(x.text)}</p></div>`).join('')}</div>` : '<p class="empty">ยังไม่มีนัดหมาย</p>');
  };
  // old saves: sort what is already in the inbox once
  for (const m of S.msgs || []) if (!m.cat) m.cat = catOf(m);
});
