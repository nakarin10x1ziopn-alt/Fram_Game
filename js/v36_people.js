'use strict';
// ---------- v36_people: ages from real birth dates and a detailed profile for the player and every NPC ----------
// Birth dates are stored (S.v36.p[name]) the first time a person is seen, derived from the age the older code already gave them, so
// everyone keeps the same birthday and gets one year older on it by the real calendar. The talk card, the people app and a
// "โปรไฟล์ของฉัน" app show name, age, gender, relationship status, job, where they live, personality, hobby and friendship.
V23.add('v36_people', () => {
  const st = () => { const s = (S.v36 = S.v36 || {}); s.p = s.p || {}; return s; };
  const C = () => window.Cal36;
  const hh = n => Math.abs(strHash(String(n)));
  const roleOfName = name => { try { for (const k in Npc27.ROLES) if ((Npc27.ROLES[k].names || []).includes(name)) return k; } catch (e) { } return null; };

  // ----- birth dates -----
  function dobOf(name) {
    const s = st(); let b = s.p[name]; if (b) return b;
    const p = People.prof(name), h = hh(name), t = C().date(S.day);
    let age = p.age;
    const rk = roleOfName(name);
    if (rk) { const r = Npc27.ROLES[rk].age; if (r) age = r[0] + h % (r[1] - r[0] + 1); }
    const m = h % 12, d = 1 + (h >> 4) % 28, upcoming = m > t.m || (m === t.m && d > t.dom);
    b = s.p[name] = { y: t.y - age - (upcoming ? 1 : 0), m, d };
    return b;
  }
  const ageOf = name => C().ageAt(dobOf(name), C().date());
  // existing code reads People.prof(name).age: keep it, but make it follow the calendar
  { const _prof = People.prof.bind(People);
    People.prof = function (name) {
      const p = _prof(name);
      if (p._v36 !== S.day) {
        try { const b = dobOf(name); p.age = C().ageAt(b, C().date()); if (p.age >= 60 && !/เกษียณ/.test(p.job)) p.job = 'ผู้สูงอายุ (เกษียณแล้ว)'; else if (p.age >= 19 && p.job === 'นักเรียน') p.job = 'ชาวนา'; p._v36 = S.day; } catch (e) { }
      }
      return p;
    };
  }
  // the old birthday event follows the real date of birth instead of a 21-day year
  if (typeof Life2 !== 'undefined') {
    const isBd = b => { const t = C().date(); return t.m === b.m && (t.dom === b.d || (b.m === 1 && b.d === 29 && !C().leap(t.y) && t.dom === 28)); };
    Life2.bdayOf = function (name) { return isBd(dobOf(name)) ? this.dayInYear() : -1; };
    const _d = Life2.day.bind(Life2);
    Life2.day = function () { S.bday = isBd(myDob()) ? this.dayInYear() : -1; return _d(); };
  }

  // ----- the player -----
  function myDob() {
    const o = ((window.Gov24 && Gov24.rec && Gov24.rec('idcard')) || {}).data;
    if (o && o.birth && o.birth.y) return { y: o.birth.y - 543, m: (o.birth.m || 1) - 1, d: o.birth.d || 1 };
    const s = st(); if (!s.born) s.born = { y: C().date(1).y - 25, m: 0, d: 1 };
    return s.born;
  }
  const myAge = () => C().ageAt(myDob(), C().date());
  const ageText = (b, t = C().date()) => { const mo = C().ageMonths(b, t); return `${Math.floor(mo / 12)} ปี${mo % 12 ? ' ' + (mo % 12) + ' เดือน' : ''}`; };
  const dobText = b => `${b.d} ${C().MON[b.m]} พ.ศ. ${b.y + 543}`;
  const daysToBd = b => { const t = C().date(); let y = t.y; const dom = b.m === 1 && b.d === 29 && !C().leap(y) ? 28 : b.d; let tgt = Math.floor(Date.UTC(y, b.m, dom) / 86400000); if (tgt < t.ed) { y++; const dom2 = b.m === 1 && b.d === 29 && !C().leap(y) ? 28 : b.d; tgt = Math.floor(Date.UTC(y, b.m, dom2) / 86400000); } return tgt - t.ed; };
  C().ageLine = () => `อายุ ${myAge()} ปี`;

  // ----- relationship status and home -----
  const STATUSES = { dating: 'มีแฟน', engaged: 'หมั้นแล้ว', married: 'แต่งงานแล้ว' };
  function statusOf(name, p) {
    const r = Social.st();
    if (r.partner === name) return { t: `${STATUSES[r.stage] || 'มีแฟน'} (กับคุณ)`, i: r.stage === 'married' ? '💞' : r.stage === 'engaged' ? '💍' : '💕' };
    const c = typeof Social2 !== 'undefined' && Social2.pairOf ? Social2.pairOf(name) : null;
    if (c) return { t: `มีคู่ (กับ${typeof c === 'string' ? c : 'ชาวบ้านอีกคน'})`, i: '💑' };
    const h = hh(name + 's'), a = p.age;
    if (a < 18) return { t: 'โสด (ยังเป็นเด็ก/นักเรียน)', i: '🧒' };
    if ((typeof Social.single === 'function' && Social.single(name)) || (typeof SINGLES !== 'undefined' && SINGLES.some(x => x.name === name))) return { t: 'โสด (สนใจหาคู่)', i: '💗' };
    if (a >= 60) return h % 100 < 55 ? { t: 'แต่งงานแล้ว (อยู่กับคู่ชีวิต)', i: '👵' } : h % 100 < 90 ? { t: 'หม้าย', i: '🕊️' } : { t: 'โสด', i: '🙂' };
    if (a < 24) return h % 100 < 85 ? { t: 'โสด', i: '🙂' } : { t: 'มีแฟน', i: '💕' };
    const x = h % 100; return x < 58 ? { t: 'แต่งงานแล้ว', i: '💍' } : x < 68 ? { t: 'หย่าร้าง', i: '🙂' } : x < 76 ? { t: 'มีแฟน', i: '💕' } : { t: 'โสด', i: '🙂' };
  }
  const cityName = () => (G.away && (G.away.n || G.away.key)) || null;
  function homeOf(name, n) {
    const h = hh(name), city = cityName();
    if (n && (n.npc27 || n.townRes)) return { t: city ? `อาศัยอยู่ใน${city}` : 'อาศัยอยู่ในตัวเมือง (ถนนสายหลักหมู่บ้านสุขใจ)', where: city || 'ตัวเมืองสุขใจ' };
    if (n && n.staff && city) return { t: `ทำงานและอาศัยอยู่ใน${city}`, where: city };
    if (n && n.keeper) return { t: `อยู่ที่ร้านของตัวเอง ต.สุขใจ อ.สุขใจ`, where: 'หมู่บ้านสุขใจ' };
    return { t: `บ้านเลขที่ ${1 + h % 140} หมู่ ${1 + (h >> 3) % 7} ต.สุขใจ อ.สุขใจ`, where: 'หมู่บ้านสุขใจ' };
  }
  function info(name, n) {
    const p = People.prof(name), b = dobOf(name), rk = (n && n.role) || roleOfName(name);
    let sp = {}; try { sp = Social.profile({ name, keeper: n && n.keeper }) || {}; } catch (e) { }
    const home = homeOf(name, n), stt = statusOf(name, p), tr = (typeof TRAITS !== 'undefined' && TRAITS[p.trait]) ? TRAITS[p.trait].n : '';
    let job = n && n.keeper ? 'เจ้าของ' + (SHOPS[n.keeper] ? SHOPS[n.keeper].n : 'ร้าน') : p.job;
    if (rk && Npc27.ROLES[rk]) job = Npc27.ROLES[rk].job;
    return { name, fem: p.fem, age: p.age, ageText: ageText(b), dob: dobText(b), dobd: b, status: stt, job, home, trait: tr, hobby: sp.hobby, dream: sp.dream, hearts: Friends.get(name), role: rk, bdIn: daysToBd(b) };
  }
  const css = document.createElement('style');
  css.textContent = '.prof36{width:100%;border-collapse:collapse;font-size:13px;margin:6px 0}.prof36 td{padding:4px 6px;border-bottom:1px solid rgba(255,255,255,.1);vertical-align:top}.prof36 td:first-child{opacity:.75;white-space:nowrap;width:34%}';
  document.head.appendChild(css);
  const row = (k, v) => v == null || v === '' ? '' : `<tr><td>${k}</td><td>${v}</td></tr>`;
  const hearts = h => '❤️'.repeat(Math.floor(h)) + (h % 1 >= 0.5 ? '🤍' : '') + (h < 1 ? '—' : '') + ` <small>(${h.toFixed(1)}/10)</small>`;
  function profileHtml(i) {
    return `<table class="prof36">${row('ชื่อ', esc(i.name))}${row('อายุ', `${i.age} ปี <small class="dim">(${i.ageText})</small>`)}${row('วันเกิด', `${i.dob} <small class="dim">(อีก ${i.bdIn} วัน)</small>`)}${row('เพศ', i.fem ? '♀ หญิง' : '♂ ชาย')}${row('สถานะ', `${i.status.i} ${esc(i.status.t)}`)}${row('อาชีพ', esc(i.job || ''))}${row('ที่อยู่', esc(i.home.t))}${row('นิสัย', esc(i.trait))}${row('งานอดิเรก', esc(i.hobby || ''))}${row('ความฝัน', esc(i.dream || ''))}${row('ความสนิท', hearts(i.hearts))}</table>`;
  }
  let open36 = null;
  UI.H.v36prof = d => { open36 = open36 === d.v ? null : d.v; };

  // talk card
  { const _card = People.card.bind(People);
    People.card = function (n) {
      let h = _card(n);
      try { const open = open36 === n.name; h += `<div class="row"><button class="btn ghost" data-a="v36prof" data-v="${esc(n.name)}">🪪 ${open ? 'ซ่อน' : 'ดู'}ข้อมูลส่วนตัว</button></div>` + (open ? profileHtml(info(n.name, n)) : ''); } catch (e) { console.warn('v36 card', e); }
      return h;
    };
  }
  // people app
  Phone.apps.people = function () {
    const ppl = G.npcs.filter(n => S.friends[n.name] != null || n.single);
    return `<p class="lead">ความสนิทกับชาวบ้าน · คุยทุกวัน +¼ ให้ของขวัญ +1 ของโปรด +2 · กด 🪪 ดูข้อมูลส่วนตัว</p>` + (ppl.length ? `<div class="grid">${ppl.map(n => {
      const i = info(n.name, n), open = open36 === n.name;
      return `<div class="card"><div class="ci">${n.single ? '💗' : n.keeper ? '🏪' : '🙂'}</div><div class="cb"><h4>${esc(n.name)} <small>${i.fem ? '♀' : '♂'} ${i.age} ปี</small></h4><p class="dim">${i.status.i} ${esc(i.status.t)} · ${esc(i.job || '')}</p><p>${hearts(i.hearts)}</p><div class="row"><button class="btn ghost" data-a="v36prof" data-v="${esc(n.name)}">🪪 ${open ? 'ซ่อน' : 'ข้อมูลส่วนตัว'}</button></div>${open ? profileHtml(i) : ''}</div></div>`;
    }).join('')}</div>` : '<p class="empty">ยังไม่มีเพื่อน ลองทักทายชาวบ้านดู</p>');
  };

  // ----- "โปรไฟล์ของฉัน" -----
  function meHtml() {
    const doc = ((window.Gov24 && Gov24.rec && Gov24.rec('idcard')) || {}), d = doc.data || {}, b = myDob(), r = Social.st(), t = C().date();
    const kids = (r.kids || []).length, ed = (S.civic && S.civic.ed && S.civic.ed.lv) || '';
    const EDN = { m3: 'มัธยมศึกษาตอนต้น (ม.3)', m6: 'มัธยมศึกษาตอนปลาย (ม.6)', vc: 'ปวช.', dip: 'ปวส.', bach: 'ปริญญาตรี', mast: 'ปริญญาโท', phd: 'ปริญญาเอก' };
    let job = 'เจ้าของไร่'; try { if (S.job && S.job.k && window.Career && Career.C) { const c = Career.C(); job = (c && c.n) || job; } } catch (e) { }
    const fname = d.th ? `${d.th.pre || ''}${d.th.first || ''} ${d.th.last || ''}`.trim() : '';
    const status = r.partner ? `${STATUSES[r.stage] || 'มีแฟน'} กับ ${esc(r.partner)}${kids ? ` · มีลูก ${kids} คน` : ''}` : (window.Fam28 && Fam28.state && Fam28.state().mar ? 'จดทะเบียนสมรสแล้ว' : (S.v26l && S.v26l.fam && S.v26l.fam.div ? 'หย่าร้าง (โสด)' : 'โสด'));
    const where = G.away ? (G.away.n || 'เมืองไกล') : G.inside ? 'ในบ้านของคุณ' : 'หมู่บ้านสุขใจ';
    const home = d.addr ? `บ้านเลขที่ ${d.addr.no} หมู่ ${d.addr.moo} ต.${d.addr.tam} อ.สุขใจ` : 'ยังไม่ได้ทำบัตรประชาชน / ทะเบียนบ้าน';
    return `<div class="card"><div class="ci">🪪</div><div class="cb"><h4>${esc(S.name || 'ชาวไร่')} <small>${myAge()} ปี</small></h4><p class="dim">${esc(S.farm || 'ไร่สุขใจ')} · เลเวล ${S.lvl || 1}</p></div></div>
      <table class="prof36">${row('ชื่อในบัตร', esc(fname) || '<span class="dim">ยังไม่มีบัตรประชาชน</span>')}${row('อายุ', `${myAge()} ปี <small class="dim">(${ageText(b)})</small>`)}${row('วันเกิด', `${dobText(b)} <small class="dim">(อีก ${daysToBd(b)} วัน)</small>`)}${row('เพศ', d.sex ? (d.sex === 'หญิง' ? '♀ หญิง' : '♂ ' + esc(d.sex)) : '')}${row('สถานะ', status)}${row('อาชีพ', esc(job))}${row('การศึกษา', esc(EDN[ed] || ed))}${row('ศาสนา', esc(d.rel || ''))}${row('หมู่เลือด', esc(d.blood || ''))}${row('ที่อยู่ตามบัตร', esc(home))}${row('ตอนนี้อยู่ที่', esc(where))}${row('วันนี้', C().full() + ' · ' + C().hhmm() + ' น.')}${row('เล่นมาแล้ว', `${S.day} วัน (เริ่มเมื่อ ${C().dm(1)})`)}</table>`;
  }
  Phone.apps.me36 = meHtml;
  if (!APPS.some(a => a.id === 'me36')) APPS.splice(Math.min(APPS.length, 4), 0, { id: 'me36', i: '🪪', n: 'โปรไฟล์ของฉัน' });

  // ----- birthday -----
  function day(t) {
    const s = st(), b = myDob();
    if (t.m === b.m && (t.dom === b.d || (b.m === 1 && b.d === 29 && !C().leap(t.y) && t.dom === 28)) && s.bdYear !== t.y) {
      s.bdYear = t.y; const a = C().ageAt(b, t);
      if (a > 0) { UI.toast(`🎂 สุขสันต์วันเกิด! วันนี้คุณอายุครบ ${a} ปี`, '🎂'); Phone.msg('ปฏิทิน', `สุขสันต์วันเกิดครบ ${a} ปี (${C().dm()}) ขอให้มีความสุขมากๆ`); }
      try { if (window.Diary31 && Diary31.log) Diary31.log('🎂', `วันเกิดครบ ${a} ปี`, '', 'life', 'bd:' + t.y); } catch (e) { }
    }
  }
  window.Ppl36 = { info, profileHtml, ageOf, myAge, myDob, dobOf, day };
});
