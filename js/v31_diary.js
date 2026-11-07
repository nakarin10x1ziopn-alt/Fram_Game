'use strict';
// ---------- v31_diary: life log & timeline. Every big thing that happens to the player is written down by itself (marriage, children, houses, land, cars,
// jobs, degrees, licences & papers, trips, illnesses, companies, level-ups, achievements, and — when those systems exist — court / disaster / hospital news),
// with yearly statistics (income / expense / net worth / distance walked), a timeline view, an achievements summary and export as PNG / JSON / text.
// State: S.v31d. Entries are found by diffing the game's own state against a remembered snapshot, so an old save is backfilled once and nothing is counted twice. ----------
V23.add('v31_diary', () => {
  const YD = 84;                                              // a game year = 12 weeks (same as v26_life / Cal24)
  const CATS = {
    love: ['❤️', 'ความรัก'], family: ['👶', 'ครอบครัว'], home: ['🏠', 'บ้าน & ที่ดิน'], car: ['🚗', 'รถ'], work: ['💼', 'การงาน'], edu: ['🎓', 'การศึกษา'],
    doc: ['📄', 'เอกสาร'], trip: ['✈️', 'เดินทาง'], health: ['🩺', 'สุขภาพ'], money: ['💰', 'การเงิน'], biz: ['🏢', 'ธุรกิจ'], disaster: ['🌪️', 'ภัยพิบัติ'],
    law: ['⚖️', 'คดีความ'], achv: ['🏆', 'ความสำเร็จ'], level: ['⭐', 'เลเวล'], note: ['📝', 'บันทึกของฉัน'],
  };
  const TRIPN = { sg: 'สิงคโปร์', vn: 'เวียดนาม', jp: 'ญี่ปุ่น', kr: 'เกาหลีใต้', cn: 'จีน', uk: 'อังกฤษ', us: 'สหรัฐอเมริกา', my: 'มาเลเซีย', la: 'ลาว', kh: 'กัมพูชา' };
  const MAXEV = 600;
  const D = () => {
    const x = S.v31d = S.v31d || {};
    x.ev = x.ev || []; x.keys = x.keys || {}; x.snap = x.snap || {}; x.yr = x.yr || {}; x.walk = x.walk || 0; x.drive = x.drive || 0;
    x.born = x.born || S.day; x.n = x.n || 0; x.mil = x.mil || { cash: 0 }; x.drawn = x.drawn || 0;
    return x;
  };
  const yearOf = d => Math.floor(((d == null ? S.day : d) - 1) / YD);
  const yr = (y = yearOf()) => { const t = D().yr; return t[y] = t[y] || { inc: 0, exp: 0, nw: 0, lvl: 0, walk: 0, drive: 0, ev: 0 }; };
  const dateTxt = d => { try { return window.Cal24 ? Cal24.dateText(d) : `${RD(d)}`; } catch (e) { return `${RD(d)}`; } };
  const fmt = n => { try { return U.fmt(Math.round(n)); } catch (e) { return String(Math.round(n)); } };
  const msg = (from, t, q) => { try { Phone.msg(from, t, q); } catch (e) { } };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ================= the log =================
  // add({ c: category, h: headline, x: detail, d: day, k: unique key (the same key is never written twice), i: icon })
  const add = o => {
    const x = D(); o = o || {};
    if (o.k) { if (x.keys[o.k]) return null; x.keys[o.k] = 1; }
    const c = CATS[o.c] ? o.c : 'note', d = o.d || S.day;
    const e = { n: ++x.n, d, t: o.d ? 0 : Math.floor(S.time || 0), c, i: o.i || CATS[c][0], h: String(o.h || '').slice(0, 90), x: String(o.x || '').slice(0, 220), bf: o.bf ? 1 : 0 };
    x.ev.push(e);
    if (x.ev.length > MAXEV) x.ev.splice(0, x.ev.length - MAXEV);
    yr(yearOf(d)).ev++;
    return e;
  };

  // ================= state readers (every one guarded: a missing module just yields nothing) =================
  const safe = (f, dflt) => { try { const v = f(); return v == null ? dflt : v; } catch (e) { return dflt; } };
  const netWorth = () => {
    let w = S.money || 0;
    w += safe(() => { let s = 0; const o = Estate.st().own; for (const k in o) s += o[k].paid || 0; return s; }, 0);
    w += safe(() => { let s = 0; for (const k of Object.keys(STOCKS)) { const q = Mkt24.holdOf(k); if (q) s += q * Mkt24.priceOf(k); } return s; }, 0);
    w += safe(() => Company.list().reduce((t, c) => t + (c.cash || 0), 0), 0);
    w += safe(() => Prop23.V() && Object.keys(Prop23.V().homes || {}).length * 0, 0);
    return Math.round(w);
  };
  const carName = c => safe(() => (CARS[c.type] || {}).n || c.type, 'รถ');

  // one pass over everything we know how to read; bf = first pass on this save (events get the day the thing really happened where known)
  let scanning = false;
  const scan = bf => {
    if (scanning) return; scanning = true;
    try {
      const x = D(), K = x.keys, snap = x.snap, today = S.day;
      const A = (o) => { o.bf = bf; return add(o); };
      // ---- love & family
      safe(() => {
        const r = Social.st();
        if (r.partner && r.stage) {
          const lab = { dating: 'คบเป็นแฟนกับ', engaged: 'หมั้นกับ', married: 'แต่งงานกับ' };
          for (const st of ['dating', 'engaged', 'married']) {
            const rank = { dating: 1, engaged: 2, married: 3 };
            if (rank[st] <= rank[r.stage]) A({ c: 'love', h: `${lab[st]}${r.partner}`, x: st === 'married' ? 'เริ่มต้นชีวิตคู่ที่ฟาร์ม' : '', k: `love:${r.partner}:${st}`, d: bf ? (st === 'married' ? (r.wedding || today) : today) : today });
          }
        }
        if (snap.partner && !r.partner) A({ c: 'love', h: `จบความสัมพันธ์กับ${snap.partner}`, k: `loveend:${snap.partner}:${today}` });
        snap.partner = r.partner || '';
        for (const kid of r.kids || []) A({ c: 'family', h: `ลูกคนใหม่ ${kid.name} ลืมตาดูโลก`, x: kid.fem ? 'เด็กหญิง' : 'เด็กชาย', k: `kid:${kid.uid != null ? kid.uid : kid.name + ':' + (kid.born || 0)}`, d: kid.born || today });
      });
      // ---- land, houses
      safe(() => { const o = Estate.st().own; for (const k in o) { const P = (typeof PROPS !== 'undefined' && PROPS.find(p => p.k === k)) || {}; A({ c: 'home', h: `${o[k].rent ? 'เช่า' : 'ซื้อ'}${P.n || P.name || k}`, x: o[k].paid ? `ราคา ${fmt(o[k].paid)} ฿` : '', k: `est:${k}`, d: o[k].day || today }); } });
      safe(() => { const l = HomeBuild.st().lots; for (const k in l) if (l[k] && (l[k].st === 'done' || l[k].st === 'built' || l[k].done || l[k].level)) A({ c: 'home', h: `สร้างบ้านบนที่ดิน ${k}`, k: `hb:${k}`, d: l[k].day || l[k].doneDay || today }); });
      safe(() => { const h = Prop23.V().homes || {}; for (const k in h) A({ c: 'home', h: `ได้บ้านหลังใหม่ ${h[k].n || h[k].name || k}`, k: `p23:${k}`, d: h[k].day || h[k].bought || today }); });
      // ---- cars
      safe(() => { (S.cars || []).forEach((c, i) => { const id = c.id != null ? c.id : (c.plate || (c.type + ':' + i)); A({ c: 'car', h: `มีรถใหม่: ${carName(c)}`, k: `car:${id}`, d: c.day || c.bought || today }); }); });
      // ---- work
      safe(() => {
        const j = Career.st();
        if (j.k) {
          const C = Career.C();
          A({ c: 'work', h: `เริ่มงาน: ${C.n || C.name || j.k}`, k: `job:${j.k}:${j.since || ''}` });
          if (snap.job === j.k && snap.rank != null && j.rank > snap.rank) A({ c: 'work', h: `เลื่อนตำแหน่งเป็น ${Career.rankName()}`, k: `rank:${j.k}:${j.rank}:${today}` });
          else if (bf) A({ c: 'work', h: `ตำแหน่งปัจจุบัน: ${Career.rankName()}`, k: `rank:${j.k}:${j.rank}` });
        } else if (snap.job) A({ c: 'work', h: 'ออกจากงานเดิม', x: snap.job, k: `quit:${snap.job}:${today}` });
        snap.job = j.k || ''; snap.rank = j.k ? j.rank : null;
      });
      // ---- education
      safe(() => { for (const c of (S.edu24 && S.edu24.certs) || []) A({ c: 'edu', h: `จบการศึกษา: ${c.n || c.name || c.pid || 'วุฒิการศึกษา'}`, x: c.gpa ? `เกรดเฉลี่ย ${(+c.gpa).toFixed ? (+c.gpa).toFixed(2) : c.gpa}` : '', k: `cert:${c.pid || c.n || c.name}:${c.day || c.d || ''}`, d: c.day || c.d || today }); });
      // ---- papers (not the throw-away ones)
      safe(() => {
        const docs = Gov24.st().docs || {};
        for (const id in docs) {
          if (/^(buildhome|tmp)/.test(id)) continue;
          const dd = docs[id], def = Gov24.docs[id.split(':')[0]];
          if (def && dd) A({ c: 'doc', h: `ได้รับเอกสาร: ${def.n}`, k: `doc:${id}:${dd.issued || 0}`, d: dd.issued || today });
        }
      });
      // ---- trips abroad
      safe(() => { for (const t of (S.v26l && S.v26l.abr && S.v26l.abr.trips) || []) A({ c: 'trip', h: `เดินทางไป${TRIPN[t.k] || t.k}`, x: t.cost ? `ค่าใช้จ่าย ${fmt(t.cost)} ฿` : '', k: `trip:${t.k}:${t.day}`, d: t.day || today }); });
      // ---- health
      safe(() => {
        const sk = !!S.sick;
        if (sk && !snap.sick) A({ c: 'health', h: 'ป่วย', x: 'ต้องพักผ่อนและรักษาตัว', k: `sick:${today}:${x.n}` });
        if (!sk && snap.sick) A({ c: 'health', h: 'หายป่วยแล้ว', k: `well:${today}:${x.n}` });
        snap.sick = sk;
      });
      // ---- level
      safe(() => {
        const lv = S.lvl || 1;
        if (snap.lvl != null && lv > snap.lvl) A({ c: 'level', h: `เลเวลอัปเป็น Lv.${lv}`, k: `lvl:${lv}` });
        else if (bf) { snap.lvlBf = lv; }
        snap.lvl = lv;
      });
      // ---- companies
      safe(() => { for (const c of Company.list()) {
        A({ c: 'biz', h: `จดทะเบียนบริษัท ${c.name}`, k: `co:${c.id}:name`, d: c.regDay ? c.regDay : today });
        if (c.st === 'open') A({ c: 'biz', h: `${c.name} เปิดดำเนินการ`, k: `co:${c.id}:open` });
        if (c.listed) A({ c: 'biz', h: `${c.name} เข้าตลาดหลักทรัพย์`, k: `co:${c.id}:ipo` });
      } });
      // ---- achievements the game itself unlocks
      safe(() => { const a = Events.st().ach || {}; for (const id in a) { const t = ACH.find(z => z[0] === id); if (t) A({ c: 'achv', h: `ปลดล็อกความสำเร็จ: ${t[1]}`, i: t[2], k: `ach:${id}`, d: a[id] || today }); } });
      // ---- money milestones (cash). First scan only sets the baseline, so a test-mode bankroll does not flood the log
      safe(() => {
        const steps = [100000, 1000000, 10000000, 100000000, 1000000000], m = x.mil, now = S.money || 0;
        let top = 0; steps.forEach((s, i) => { if (now >= s) top = i + 1; });
        if (bf || m.cash == null) m.cash = Math.max(m.cash || 0, top);
        else if (top > m.cash) { for (let i = m.cash; i < top; i++) A({ c: 'money', h: `เงินสดถึง ${fmt(steps[i])} ฿ เป็นครั้งแรก`, k: `cash:${steps[i]}` }); m.cash = top; }
      });
    } finally { scanning = false; }
  };

  // ================= generic news from other systems (court, disaster, hospital …) via the phone's message feed =================
  const NEWSRX = [
    ['law', /ศาล|คำพิพากษา|ทนาย|ฟ้อง|อัยการ|ตำรวจ.*คดี|คดี/, ['ศาล', 'ทนาย', 'คดี', 'อัยการ', 'ยุติธรรม']],
    ['disaster', /น้ำท่วม|พายุ|ภัยแล้ง|แผ่นดินไหว|ไฟไหม้|ภัยพิบัติ|ฝุ่น PM|ดินถล่ม|ปภ\./, ['ภัยพิบัติ', 'ปภ', 'ป้องกันและบรรเทา', 'ศูนย์เตือนภัย', 'ดับเพลิง', 'อุตุนิยม', 'ควบคุมมลพิษ']],
    ['health', /ผ่าตัด|นอนโรงพยาบาล|ผู้ป่วยใน|แพทย์นัด|ใบรับรองแพทย์|โรงพยาบาล|ห้องฉุกเฉิน|รถพยาบาล|ไข้เลือดออก/, ['โรงพยาบาล', 'คลินิก', 'สาธารณสุข', 'แพทย์', 'สุขภาพ']],
  ];
  const wrapMsg = () => {
    if (typeof Phone === 'undefined' || typeof Phone.msg !== 'function' || Phone.msg._v31d) return;
    const _m = Phone.msg.bind(Phone);
    Phone.msg = function (from, text, quiet) {
      try {
        const f = String(from || ''), t = String(text || '');
        for (const [c, rx, senders] of NEWSRX) {
          if (rx.test(f + ' ' + t) && senders.some(s => f.includes(s))) { add({ c, h: t.replace(/\s+/g, ' ').slice(0, 80), x: f, k: `msg:${c}:${S.day}` }); break; }
        }
      } catch (e) { }
      return _m(from, text, quiet);
    };
    Phone.msg._v31d = 1;
  };

  // ================= money flow (recorded transactions → yearly statistics) =================
  { const _e = earn; earn = function (n) { const r = _e.apply(this, arguments); try { if (n > 0) yr().inc += n; } catch (e) { } return r; }; }
  safe(() => { const _l = Bank2.log.bind(Bank2); Bank2.log = function (t, a) { try { if (a < 0) yr().exp += -a; } catch (e) { } return _l(t, a); }; });

  // ================= distance walked (1 sample per real second, no per-frame work) =================
  setInterval(() => {
    try {
      if (typeof G === 'undefined' || !G.started || document.hidden || !S) return;
      const x = D(), y = yr();
      if (G.driving) { const m = Math.abs(G.driving.speed || 0); x.drive += m; y.drive += m; }
      else if (G.player) { const m = Math.min(8, G.player.speed || 0); x.walk += m; y.walk += m; }
    } catch (e) { }
  }, 1000);

  // ================= daily / on-demand =================
  const refreshYear = () => { const y = yr(); y.nw = netWorth(); y.lvl = S.lvl || 1; };
  let first = true, lastScan = 0;
  const run = () => {
    const x = D();
    if (!x.bf) { scan(true); x.bf = 1; x.bfDay = S.day; }
    else scan(false);
    refreshYear(); lastScan = Date.now(); first = false;
  };
  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { run(); } catch (e) { console.warn('v31 diary', e); } return r; }; }
  { const _s = saveGame; saveGame = function () { try { if (Date.now() - lastScan > 20000) run(); } catch (e) { } return _s.apply(this, arguments); }; }

  // ================= views =================
  const A_ = {};
  UI.H.v31d = d => { const [k, ...r] = String(d.v || '').split('|'); const f = A_[k]; if (f) { try { f(...r); } catch (e) { if (e && e.spend173) throw e; console.warn('v31d', k, e); } } };
  const B = (act, label, o = {}) => `<button class="btn ${o.ghost ? 'ghost' : ''}" data-a="v31d" data-v="${esc(act)}"${o.dis ? ' disabled' : ''}>${label}</button>`;
  const hub = { tab: 0, cat: '', yr: -1, note: '' };
  const evRow = e => `<div class="card"><div class="ci">${e.i}</div><div class="cb"><h4>${esc(e.h)}</h4><p class="dim">${esc(dateTxt(e.d))}${e.t ? ` · ${String(Math.floor(e.t / 60)).padStart(2, '0')}:${String(Math.floor(e.t % 60)).padStart(2, '0')} น.` : ''} · ${CATS[e.c][1]}${e.x ? ' · ' + esc(e.x) : ''}${e.bf ? ' · (บันทึกย้อนหลัง)' : ''}</p></div></div>`;
  const chips = () => `<div class="row">${B('cat|', 'ทั้งหมด', { ghost: hub.cat !== '' })}${Object.keys(CATS).map(k => B('cat|' + k, `${CATS[k][0]} ${CATS[k][1]}`, { ghost: hub.cat !== k })).join('')}</div>`;
  A_.cat = k => { hub.cat = k || ''; UI.renderBody(); };
  A_.yr = v => { hub.yr = +v; UI.renderBody(); };
  A_.note = () => {
    const el = document.getElementById('v31dNote'), t = el ? el.value.trim() : '';
    if (!t) { UI.toast('พิมพ์บันทึกก่อนนะ', '📝'); return; }
    add({ c: 'note', h: t.slice(0, 90), x: '' }); if (el) el.value = ''; UI.toast('บันทึกลงไดอารี่แล้ว', '📖'); UI.renderBody();
  };
  A_.del = n => { const x = D(); const i = x.ev.findIndex(e => e.n === +n && e.c === 'note'); if (i >= 0) { x.ev.splice(i, 1); UI.renderBody(); } };

  const tabDiary = () => {
    const x = D(), today = x.ev.filter(e => e.d === S.day).sort((a, b) => b.n - a.n), recent = x.ev.filter(e => e.d !== S.day).sort((a, b) => b.n - a.n).slice(0, 8);
    return `<p class="lead">📖 ไดอารี่ชีวิต · ${esc(dateTxt(S.day))} · บันทึกให้เองทุกเรื่องสำคัญ ${x.ev.length} รายการ</p>
      <div class="row"><input id="v31dNote" maxlength="90" placeholder="เขียนบันทึกของฉัน..." style="flex:1">${B('note', '＋ บันทึก')}</div>
      <h5>วันนี้</h5>${today.length ? `<div class="grid">${today.map(e => evRow(e) + (e.c === 'note' ? `<div class="row end">${B('del|' + e.n, '🗑️ ลบ', { ghost: 1 })}</div>` : '')).join('')}</div>` : '<p class="dim">วันนี้ยังไม่มีเหตุการณ์สำคัญ</p>'}
      <h5>ล่าสุด</h5>${recent.length ? `<div class="grid">${recent.map(evRow).join('')}</div>` : '<p class="dim">—</p>'}`;
  };
  const tabTimeline = () => {
    const x = D(), evs = x.ev.filter(e => !hub.cat || e.c === hub.cat).sort((a, b) => (b.d - a.d) || (b.n - a.n));
    const ys = [...new Set(evs.map(e => yearOf(e.d)))].sort((a, b) => b - a);
    let out = chips();
    if (!evs.length) return out + '<p class="empty">ยังไม่มีรายการในหมวดนี้</p>';
    for (const y of ys) {
      const list = evs.filter(e => yearOf(e.d) === y);
      out += `<h5>ปีที่ ${y + 1} · พ.ศ. ${2569 + y} (${list.length} เรื่อง)</h5><div class="grid">${list.slice(0, 40).map(evRow).join('')}</div>${list.length > 40 ? `<p class="dim">… และอีก ${list.length - 40} เรื่อง</p>` : ''}`;
    }
    return out;
  };
  const statRows = () => {
    const t = D().yr, ys = Object.keys(t).map(Number).sort((a, b) => b - a);
    return ys.map(y => { const r = t[y], cur = y === yearOf(); return { y, r, cur, nw: cur ? netWorth() : r.nw, lvl: cur ? (S.lvl || 1) : r.lvl }; });
  };
  const tabStats = () => {
    const x = D(), rows = statRows(), st = S.stats || {};
    const totWalk = x.walk, steps = Math.round(totWalk / 0.72);
    return `<p class="lead">📊 สถิติชีวิต · เล่นมาแล้ว ${S.day - 1} วัน (${Math.floor((S.day - 1) / YD)} ปี ${Math.floor(((S.day - 1) % YD) / 7)} สัปดาห์) · ทรัพย์สินสุทธิประมาณ ${fmt(netWorth())} ฿</p>
      <div class="grid">
        <div class="card"><div class="ci">🚶</div><div class="cb"><h4>เดินมาแล้ว ${fmt(steps)} ก้าว</h4><p class="dim">ราว ${(totWalk / 1000).toFixed(2)} กม. · ขับรถ ${(x.drive / 1000).toFixed(1)} กม.</p></div></div>
        <div class="card"><div class="ci">🌾</div><div class="cb"><h4>เก็บเกี่ยว ${fmt(st.harvest || 0)} · ปลูก ${fmt(st.planted || 0)}</h4><p class="dim">ขายของ ${fmt(st.sold || 0)} ครั้ง · ปลา ${fmt(st.fish || 0)} ตัว · ทำอาหาร ${fmt(st.cooked || 0)} จาน</p></div></div>
        <div class="card"><div class="ci">💵</div><div class="cb"><h4>รายได้สะสม ${fmt(st.earned || 0)} ฿</h4><p class="dim">เฉพาะรายได้ที่เข้าผ่านระบบรับเงินของเกม</p></div></div>
      </div>
      <h5>รายปี (ปีละ 12 สัปดาห์ · รายรับ/รายจ่ายนับเฉพาะรายการที่ผ่านระบบธนาคารและการรับเงิน)</h5>
      <table class="tbl"><tr><th>ปี</th><th>รายรับ</th><th>รายจ่าย</th><th>สุทธิ</th><th>ทรัพย์สิน</th><th>Lv</th><th>กม.</th></tr>
      ${rows.map(z => `<tr><td>${z.y + 1}${z.cur ? ' ◀' : ''}</td><td>${fmt(z.r.inc)}</td><td>${fmt(z.r.exp)}</td><td style="color:${z.r.inc - z.r.exp >= 0 ? '#7ed07e' : '#e87878'}">${fmt(z.r.inc - z.r.exp)}</td><td>${fmt(z.nw)}</td><td>${z.lvl}</td><td>${((z.r.walk + z.r.drive) / 1000).toFixed(1)}</td></tr>`).join('') || '<tr><td colspan="7">ยังไม่มีข้อมูล</td></tr>'}</table>`;
  };
  const tabAch = () => {
    const x = D(), have = safe(() => Events.st().ach, {}) || {}, list = safe(() => ACH, []) || [];
    const n = Object.keys(have).length;
    const cnt = {}; for (const e of x.ev) cnt[e.c] = (cnt[e.c] || 0) + 1;
    return `<p class="lead">🏆 ความสำเร็จ ${n}/${list.length} · เหตุการณ์ชีวิตทั้งหมด ${x.ev.length}</p>
      <div class="row">${Object.keys(CATS).filter(k => cnt[k]).map(k => `<span class="chip">${CATS[k][0]} ${CATS[k][1]} ${cnt[k]}</span>`).join('') || '<span class="dim">ยังไม่มีเหตุการณ์</span>'}</div>
      <div class="prog"><i style="width:${list.length ? n / list.length * 100 : 0}%"></i></div>
      <div class="grid">${list.map(([id, nm, ic]) => `<div class="card" style="opacity:${have[id] ? 1 : 0.4}"><div class="ci">${have[id] ? ic : '🔒'}</div><div class="cb"><h4>${esc(nm)}</h4><p class="dim">${have[id] ? 'ได้เมื่อ ' + esc(dateTxt(have[id])) : 'ยังไม่ปลดล็อก'}</p></div></div>`).join('')}</div>`;
  };
  const tabExport = () => `<p class="lead">💾 ส่งออกเรื่องราวชีวิตของคุณ · ไฟล์จะถูกดาวน์โหลดลงเครื่อง</p>
    <div class="grid">
      <div class="card"><div class="ci">🖼️</div><div class="cb"><h4>รูปไทม์ไลน์ (PNG)</h4><p class="dim">สรุปชีวิต สถิติ และเหตุการณ์ล่าสุด 20 เรื่อง เป็นภาพแชร์ได้</p><div class="row">${B('png', 'ดาวน์โหลดรูป')}</div></div></div>
      <div class="card"><div class="ci">🧾</div><div class="cb"><h4>ข้อมูลทั้งหมด (JSON)</h4><p class="dim">เหตุการณ์ สถิติรายปี และสรุปตัวละคร สำหรับเก็บสำรอง</p><div class="row">${B('json', 'ดาวน์โหลด JSON')}</div></div></div>
      <div class="card"><div class="ci">📄</div><div class="cb"><h4>เรื่องเล่าชีวิต (ข้อความ .txt)</h4><p class="dim">เรียงเหตุการณ์ตามปีให้อ่านง่าย</p><div class="row">${B('txt', 'ดาวน์โหลดข้อความ')}</div></div></div>
    </div>`;
  const render = t => {
    hub.tab = t;
    return [tabDiary, tabTimeline, tabStats, tabAch, tabExport][t]();
  };
  const open = () => { try { run(); } catch (e) { console.warn('v31d run', e); } UI.open('📖 ไดอารี่ชีวิต', ['📖 ไดอารี่', '📅 เส้นเวลา', '📊 สถิติ', '🏆 ความสำเร็จ', '💾 ส่งออก'], render, { tab: hub.tab, wide: true }); };

  // ================= export =================
  const save = (name, blob) => {
    try {
      const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click();
      setTimeout(() => { try { document.body.removeChild(a); URL.revokeObjectURL(url); } catch (e) { } }, 1500); return true;
    } catch (e) { UI.toast('ดาวน์โหลดไม่สำเร็จ', '⚠️'); return false; }
  };
  const base = () => `raisukjai-${String(S.name || 'player').replace(/[^\wก-๙-]+/g, '_').slice(0, 20)}-day${S.day}`;
  const summary = () => ({
    game: 'ไร่สุขใจ 3D', exported: new Date().toISOString(), player: S.name || '', farm: S.farm || '', day: S.day, date: dateTxt(S.day), level: S.lvl || 1,
    money: Math.round(S.money || 0), netWorth: netWorth(), steps: Math.round(D().walk / 0.72), walkKm: +(D().walk / 1000).toFixed(2), driveKm: +(D().drive / 1000).toFixed(2),
    stats: S.stats || {}, years: statRows().map(z => ({ year: z.y + 1, income: Math.round(z.r.inc), expense: Math.round(z.r.exp), netWorth: z.nw, level: z.lvl, km: +((z.r.walk + z.r.drive) / 1000).toFixed(1) })),
  });
  A_.json = () => { run(); const x = D(); if (save(base() + '.json', new Blob([JSON.stringify({ summary: summary(), events: x.ev.map(e => ({ day: e.d, date: dateTxt(e.d), category: CATS[e.c][1], title: e.h, detail: e.x })) }, null, 2)], { type: 'application/json' }))) UI.toast('ดาวน์โหลดไฟล์ JSON แล้ว', '💾'); };
  A_.txt = () => {
    run(); const x = D(), s = summary(), L = [`ไดอารี่ชีวิต — ${s.player || 'ผู้เล่น'} (${s.farm || 'ไร่สุขใจ'})`, `${s.date} · ${RD(s.day)} · Lv.${s.level} · ทรัพย์สินสุทธิ ${fmt(s.netWorth)} บาท`, `เดินมาแล้ว ${fmt(s.steps)} ก้าว`, ''];
    const ys = [...new Set(x.ev.map(e => yearOf(e.d)))].sort((a, b) => a - b);
    for (const y of ys) { L.push(`== ปีที่ ${y + 1} (พ.ศ. ${2569 + y}) ==`); for (const e of x.ev.filter(e => yearOf(e.d) === y).sort((a, b) => (a.d - b.d) || (a.n - b.n))) L.push(`${dateTxt(e.d)}  ${e.i} ${e.h}${e.x ? ' — ' + e.x : ''}`); L.push(''); }
    if (save(base() + '.txt', new Blob(['﻿' + L.join('\r\n')], { type: 'text/plain;charset=utf-8' }))) UI.toast('ดาวน์โหลดไฟล์ข้อความแล้ว', '📄');
  };
  A_.png = () => {
    run(); const x = D(), s = summary(), W = 1080, evs = x.ev.slice().sort((a, b) => (b.d - a.d) || (b.n - a.n)).slice(0, 20), H = 420 + evs.length * 64 + 70;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d'); if (!g) { UI.toast('สร้างรูปไม่ได้บนอุปกรณ์นี้', '⚠️'); return; }
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1c3a24'); gr.addColorStop(1, '#0d1a12'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = '#ffd86b'; g.font = 'bold 56px sans-serif'; g.fillText('🌾 ไร่สุขใจ · ไทม์ไลน์ชีวิต', 50, 90);
    g.fillStyle = '#ffffff'; g.font = '34px sans-serif'; g.fillText(`${s.player || 'ผู้เล่น'} · ${s.farm || 'ฟาร์มของฉัน'}`, 50, 145);
    g.fillStyle = '#cfe6cf'; g.font = '28px sans-serif';
    g.fillText(`${s.date} · ${RD(s.day)} · Lv.${s.level}`, 50, 195);
    g.fillText(`ทรัพย์สินสุทธิ ${fmt(s.netWorth)} ฿ · เงินสด ${fmt(s.money)} ฿`, 50, 240);
    g.fillText(`เดิน ${fmt(s.steps)} ก้าว · ขับรถ ${s.driveKm} กม. · เหตุการณ์ ${x.ev.length} เรื่อง`, 50, 285);
    g.fillStyle = '#ffd86b'; g.font = 'bold 32px sans-serif'; g.fillText('เหตุการณ์ล่าสุด', 50, 350);
    g.font = '30px sans-serif'; let yy = 410;
    for (const e of evs) { g.fillStyle = '#9ec99e'; g.font = '22px sans-serif'; g.fillText(dateTxt(e.d), 50, yy - 4); g.fillStyle = '#ffffff'; g.font = '30px sans-serif'; g.fillText(`${e.i} ${e.h}`.slice(0, 48), 50, yy + 28); yy += 64; }
    g.fillStyle = '#6f9a6f'; g.font = '22px sans-serif'; g.fillText('สร้างจากเกม ไร่สุขใจ 3D', 50, H - 28);
    cv.toBlob(b => { if (b && save(base() + '.png', b)) UI.toast('ดาวน์โหลดรูปไทม์ไลน์แล้ว', '🖼️'); }, 'image/png');
  };

  // ================= phone app =================
  const addApp = (id, i, n, fn) => {
    if (!APPS.some(a => a.id === id)) APPS.splice(Math.min(APPS.length, 13), 0, { id, i, n });
    Phone.apps[id] = () => { setTimeout(() => { Phone.app = null; UI.close(); fn(); }, 0); return ''; };
    if (typeof APP_GROUPS !== 'undefined') { const gr = APP_GROUPS.find(x => /ชีวิตประจำวัน/.test(x[0])) || APP_GROUPS[0]; if (gr && !gr[1].includes(id)) gr[1].push(id); }
  };
  addApp('diary31', '📖', 'ไดอารี่ชีวิต', open);
  wrapMsg();
  window.Diary31 = { add, log: (icon, title, text, cat, key) => add({ i: icon, h: title, x: text, c: cat, k: key }), st: D, open, scan: run, netWorth, CATS, yearOf };
  // first pass on this save (backfills the timeline from what already exists)
  try { if (S && S.day) run(); } catch (e) { console.warn('v31 diary init', e); }
});
