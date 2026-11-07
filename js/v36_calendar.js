'use strict';
// ---------- v36_calendar: a real-life calendar on top of the game day counter ----------
// S.day still counts days (day 1 is a Monday, 7-day weeks, so every opening-hours rule keeps working) but each game day is now a real
// calendar day: weekday name, date, Thai month, Buddhist-era year, correct month lengths and leap years. The festival calendar (v24_fest /
// fest2) is re-mapped onto the real dates, the HUD and phone show the date, a month grid app shows holidays and birthdays, and the
// player/NPC ages come from real birth dates (see v36_people.js).
V23.add('v36_calendar', () => {
  const DAYN = ['วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์', 'วันอาทิตย์'];
  const DAYS = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'];
  const MON = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  const MONS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const DIM0 = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const st = () => (S.v36 = S.v36 || {});
  const pad = n => String(n).padStart(2, '0');
  const thaiToday = () => Math.floor((Date.now() + 7 * 3600000) / 86400000);   // epoch day of today's Thai calendar date
  const leap = y => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const daysIn = (y, m) => m === 1 ? (leap(y) ? 29 : 28) : DIM0[m];

  // day 1 is the Monday of the current Thai week for a new game; an old save is placed so that its day lands in this week
  function start() {
    const s = st();
    if (!s.cal || typeof s.cal.start !== 'number') {
      // a NEW game starts on 1 January (1 Jan 2027 = 1 Jan พ.ศ. 2570 is really a Friday, but the game calls day 1 a Monday (cal.sh shifts the weekday names), so day 1 is still a Monday and every weekday / opening-hours rule keeps working);
      // an old save without a calendar is placed so that its day lands in the current Thai week, as before
      const fresh = S.day <= 1 || (typeof G !== 'undefined' && G.fresh);
      if (fresh) { const st0 = Math.floor(Date.UTC(2027, 0, 1) / 86400000) - (S.day - 1), real0 = (((st0 + S.day - 1 + 3) % 7) + 7) % 7; s.cal = { start: st0, ny: 1, sh: (7 - real0) % 7 }; }
      else { const t = thaiToday(), mon = t - (t + 3) % 7; s.cal = { start: mon - 7 * Math.floor((S.day - 1) / 7) }; }
    }
    return s.cal.start;
  }
  const epoch = (d = S.day) => start() + d - 1;
  // weekday of an epoch day (0 = Monday); a new game's day 1 is always a Monday, so the names are shifted by cal.sh (0 for old saves)
  const dowOf = ed => { const c = st().cal; return (((ed + 3 + (c && c.sh || 0)) % 7) + 7) % 7; };
  function date(d = S.day) {
    const ed = epoch(d), t = new Date(ed * 86400000);
    const y = t.getUTCFullYear(), m = t.getUTCMonth(), dom = t.getUTCDate(), dow = dowOf(ed);
    return { y, m, dom, dow, be: y + 543, ed };
  }
  const full = (d = S.day) => { const t = date(d); return `${DAYN[t.dow]}ที่ ${t.dom} ${MON[t.m]} พ.ศ. ${t.be}`; };
  const short = (d = S.day) => { const t = date(d); return `${DAYS[t.dow]} ${t.dom} ${MONS[t.m]} ${String(t.be).slice(2)}`; };
  const dm = (d = S.day) => { const t = date(d); return `${t.dom} ${MONS[t.m]} ${t.be}`; };
  const hhmm = () => `${pad(Math.floor(S.time / 60) % 24)}:${pad(Math.floor(S.time % 60))}`;
  // the game day (S.day offset) of a calendar date
  const dayOf = (y, m, dom) => S.day + (Math.floor(Date.UTC(y, m, dom) / 86400000) - epoch(S.day));

  // age in whole years on a date, from a Gregorian birth date
  const ageAt = (b, t) => { let a = t.y - b.y; if (t.m < b.m || (t.m === b.m && t.dom < b.d)) a--; return Math.max(0, a); };
  const ageMonths = (b, t) => { let mo = (t.y - b.y) * 12 + (t.m - b.m); if (t.dom < b.d) mo--; return Math.max(0, mo); };

  // ----- festival calendar mapped onto real dates -----
  // solar-fixed days are exact; lunar ones use their 2026 dates; the rest keep their old place in the month
  const EX = {
    newyear: [0, 1], kids: [0, 10], cny: [1, 17], valentine: [1, 14], makha: [2, 3], songkran: [3, 13], labour: [4, 1], visakha: [4, 31],
    mother: [7, 12], halloween: [9, 31], loy: [10, 24], father: [11, 5], xmas: [11, 25], countdown: [11, 31],
    ramadan: [1, 18], eidfitr: [2, 20], qingming: [3, 5], easter: [3, 5], coronation: [4, 4], plough: [4, 11], eidadha: [4, 27],
    asanha: [6, 29], khaophansa: [6, 30], midautumn: [8, 25], vegfest: [9, 11], rama9: [9, 13], piya: [9, 23], okphansa: [9, 26],
    kathin: [9, 27], diwali: [10, 8], constitution: [11, 10], xmaseve: [11, 24],
  };
  // ----- v182: the moving (lunar) holidays are computed for every year; fixed ones stay -----
  // full moon (Meeus, main terms) -> Thai calendar date. Makha Bucha = the full moon of the 3rd lunar month, then Visakha +3 lunations, Asanha +2, Ok Phansa +3 (this chain matches 2023-2027)
  const fullMoon = k => {
    const r = Math.PI / 180, T = k / 1236.85, E = 1 - 0.002516 * T, M = (2.5534 + 29.1053567 * k) * r, Mp = (201.5643 + 385.81693528 * k) * r, F = (160.7108 + 390.67050284 * k) * r, Om = (124.7746 - 1.56375588 * k) * r;
    let jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T * T;
    jde += -0.40614 * Math.sin(Mp) + 0.17302 * E * Math.sin(M) + 0.01614 * Math.sin(2 * Mp) + 0.01043 * Math.sin(2 * F) + 0.00734 * E * Math.sin(Mp - M) - 0.00515 * E * Math.sin(Mp + M) + 0.00209 * E * E * Math.sin(2 * M) - 0.00111 * Math.sin(Mp - 2 * F) - 0.00057 * Math.sin(Mp + 2 * F) + 0.00056 * E * Math.sin(2 * Mp + M) - 0.00042 * Math.sin(3 * Mp) + 0.00042 * E * Math.sin(M + 2 * F) + 0.00038 * E * Math.sin(M - 2 * F) - 0.00024 * E * Math.sin(2 * Mp - M) - 0.00017 * Math.sin(Om);
    const ms = (jde - 2440587.5) * 86400000 + 7 * 3600000, t = new Date(ms);     // Thai local time (UTC+7)
    return { y: t.getUTCFullYear(), m: t.getUTCMonth(), dom: t.getUTCDate(), ms };
  };
  const moonList = y => { const ks = Math.floor((y - 2000) * 12.3685) - 2; return Array.from({ length: 30 }, (_, n) => fullMoon(ks + n + 0.5)); };
  const addDays = (d, n) => { const t = new Date(Date.UTC(d.y, d.m, d.dom) + n * 86400000); return { y: t.getUTCFullYear(), m: t.getUTCMonth(), dom: t.getUTCDate() }; };
  const CONFIRMED = { 2026: { makha: [2, 3], visakha: [4, 31], asanha: [6, 29], khaophansa: [6, 30], okphansa: [9, 26], loy: [10, 24] }, 2027: { makha: [1, 21], visakha: [4, 20], asanha: [6, 18], khaophansa: [6, 19], okphansa: [9, 15], loy: [10, 14] } };
  const CNY = { 2024: [1, 10], 2025: [0, 29], 2026: [1, 17], 2027: [1, 6], 2028: [0, 26], 2029: [1, 13], 2030: [1, 3], 2031: [0, 23], 2032: [1, 11] };
  const lunarFor = y => {
    if (CONFIRMED[y]) return CONFIRMED[y];
    const mo = moonList(y), pick = mo.find(q => q.y === y && ((q.m === 1 && q.dom >= 7) || (q.m === 2 && q.dom <= 8))); if (!pick) return {};
    const i = mo.indexOf(pick), dd = q => (q ? [q.m, q.dom] : null), as = mo[i + 5], kp = as ? addDays(as, 1) : null;   // 2028 and later are astronomical estimates (can be a day off)
    return { makha: dd(pick), visakha: dd(mo[i + 3]), asanha: dd(as), khaophansa: kp ? [kp.m, kp.dom] : null, okphansa: dd(mo[i + 8]), loy: dd(mo[i + 9]) };
  };
  // Islamic holidays move about 11 days earlier every year (approximation from the 2026 dates)
  const islamic = y => { const sh = (y - 2026) * 354.37, f = (m, dom) => { const t = addDays({ y: 2026, m, dom }, Math.round(sh)); return [t.m, t.dom, t.y]; }; return { ramadan: f(1, 18), eidfitr: f(2, 20), eidadha: f(4, 27) }; };
  const evMaps = {}; let evN = -1;
  function buildEv(y) {
    if (typeof CAL === 'undefined') return null;
    const mp = new Map(), used = new Set(), ex = Object.assign({}, EX), lu = lunarFor(y);
    for (const k of Object.keys(lu)) if (lu[k]) ex[k] = lu[k];
    if (CNY[y]) ex.cny = CNY[y];
    const is = islamic(y); for (const k of Object.keys(is)) if (y !== 2026 && is[k][2] === y) ex[k] = [is[k][0], is[k][1]];
    const put = (m, dom, e) => { let dd = dom; while (used.has(m + '-' + dd) && dd < daysIn(y, m)) dd++; used.add(m + '-' + dd); mp.set(m + '-' + dd, e); };
    for (const e of CAL) if (ex[e.k]) put(ex[e.k][0], ex[e.k][1], e);
    for (const e of CAL) if (!ex[e.k]) put(e.w, Math.max(1, Math.round((e.d - 0.5) / 7 * DIM0[e.w])), e);
    return mp;
  }
  function rawEvent(d) {
    if (typeof CAL === 'undefined') return null; if (evN !== CAL.length) { for (const k in evMaps) delete evMaps[k]; evN = CAL.length; }
    const t = date(d); const mp = evMaps[t.y] || (evMaps[t.y] = buildEv(t.y)); if (!mp) return null;
    return mp.get(t.m + '-' + t.dom) || EXTRA[t.m + '-' + t.dom] || null;
  }
  // an official holiday on a Saturday or Sunday is taken on the next working day (Monday)
  function event(d = S.day) {
    const e = rawEvent(d); if (e) return e;
    const t = date(d); if (t.dow === 0) { for (const b of [1, 2]) { const p = rawEvent(d - b); if (p && p.hol && p.rel !== 'labourOnly' && p.k !== 'labour') return Object.assign({}, p, { k: 'sub_' + p.k, n: 'วันหยุดชดเชย' + p.n, hol: 1, sub: 1 }); } }
    return null;
  }
  // public holidays the festival table does not have: the rest of Songkran, Chakri Day and the King's birthday
  const EXTRA = {};
  for (const [m, dom, k, n, i, fx, desc] of [
    [3, 14, 'songkran2', 'วันสงกรานต์ (วันที่ 2)', '💦', 'water', 'วันหยุดราชการ เล่นน้ำ รดน้ำดำหัวผู้ใหญ่'],
    [3, 15, 'songkran3', 'วันสงกรานต์ (วันที่ 3)', '💦', 'water', 'วันหยุดราชการ เล่นน้ำ รดน้ำดำหัวผู้ใหญ่'],
    [3, 6, 'chakri', 'วันจักรี', '👑', 'confetti', 'วันหยุดราชการ วางพวงมาลาถวายสักการะ'],
    [6, 28, 'kingbday', 'วันเฉลิมพระชนมพรรษา พระบาทสมเด็จพระวชิรเกล้าเจ้าอยู่หัว', '👑', 'confetti', 'วันหยุดราชการ'],
  ]) EXTRA[m + '-' + dom] = { k, n, i, fx, rel: 'buddhist', hol: 1, desc };
  // position inside the 84-slot festival year (12 months x 7 slots), used for the long ritual periods
  function yd(d = S.day) { const t = date(d); return t.m * 7 + Math.min(6, Math.floor((t.dom - 1) / daysIn(t.y, t.m) * 7)); }

  window.Cal36 = { dowOf, date, full, short, dm, hhmm, epoch, dayOf, ageAt, ageMonths, event, yd, month: d => date(d).m, daysIn, start, thaiToday, DAYN, DAYS, MON, MONS, leap };
  start();

  // ===== HUD: a full date line above the clock row =====
  { const css = document.createElement('style');
    css.textContent = '#calFull{font-size:12px;font-weight:600;color:var(--ink);opacity:.95;line-height:1.25;margin-bottom:-2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}@media(max-width:640px){#calFull{font-size:11px}}';
    document.head.appendChild(css);
    const meta = document.querySelector('#stats .meta');
    if (meta && !document.getElementById('calFull')) { const el = document.createElement('div'); el.id = 'calFull'; el.title = 'วัน เดือน ปี (พ.ศ.)'; meta.parentNode.insertBefore(el, meta); }
  }
  let hudKey = '';
  const _hud = UI.hud.bind(UI);
  UI.hud = function () {
    _hud();
    if (!S) return;
    const el = document.getElementById('calFull'), k = S.day + ':' + (typeof TimeMode !== 'undefined' ? TimeMode.cur : '');
    if (el && k !== hudKey) { hudKey = k; el.textContent = '📅 ' + full(); }
    const dEl = document.getElementById('day'); if (dEl) { dEl.textContent = 'วันที่ ' + date().dom; dEl.title = full(); }
  };

  // ===== phone: date in the status bar, real dates on message stamps =====
  { const _r = Phone.render.bind(Phone);
    Phone.render = function () {
      let h = _r();
      h = h.replace(/<div class="ph-top"><span>(\d\d:\d\d)<\/span>/, (m, t) => `<div class="ph-top"><span>${short()} · ${t}</span>`);
      h = h.replace(/<small>วันที่ (\d+)<\/small>/g, (m, d) => `<small>${short(+d)}</small>`);
      return h;
    };
  }
  // the old season calendar keeps its content, with the real date on top
  { const _c = UI.calendar.bind(UI);
    UI.calendar = function () {
      _c(); const r = UI.cur && UI.cur.render; if (!r) return;
      UI.cur.render = t => `<p class="lead">📅 <b>${full()}</b> · เวลา ${hhmm()} น.<br><small class="dim">เกม${RD(S.day)} · ${Cal36.ageLine ? Cal36.ageLine() : ''}</small></p><div class="row"><button class="btn ghost" data-a="app" data-v="cal36">🗓️ ดูปฏิทินรายเดือน</button></div>` + r(t);
      UI.renderBody();
    };
  }

  // ===== month grid app =====
  let off = 0;
  const birthday = () => (window.Ppl36 && Ppl36.myDob) ? Ppl36.myDob() : null;
  const monthHtml = o => {
    const cur = date(); let y = cur.y, m = cur.m + o; y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
    const first = Math.floor(Date.UTC(y, m, 1) / 86400000), dim = daysIn(y, m), dow1 = dowOf(first), bd = birthday();
    let cells = ''; for (let i = 0; i < dow1; i++) cells += '<i></i>';
    const evs = [];
    for (let dom = 1; dom <= dim; dom++) {
      const ed = first + dom - 1, gd = S.day + (ed - cur.ed), e = Cal24 && Cal24.event ? Cal24.event(gd) : null, dow = dowOf(ed), today = ed === cur.ed;
      const bday = bd && bd.m === m && (bd.d === dom || (bd.m === 1 && bd.d === 29 && !leap(y) && dom === 28));
      if (e) evs.push({ dom, e }); if (bday) evs.push({ dom, e: { i: '🎂', n: 'วันเกิดของคุณ' } });
      cells += `<b class="c36 ${today ? 'now' : ''} ${dow >= 5 ? 'we' : ''} ${e && e.hol ? 'ho' : ''}" title="${e ? esc(e.n) : ''}"><span>${dom}</span><em>${e ? e.i : ''}${bday ? '🎂' : ''}</em></b>`;
    }
    const style = `<style>.cal36{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center}.cal36 .h{font-size:12px;opacity:.8;padding:2px 0}.c36{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:42px;border-radius:8px;background:rgba(255,255,255,.07);font-weight:500}.c36.we span{color:#ff9e9e}.c36.ho{background:rgba(255,193,7,.18)}.c36.now{outline:2px solid #ffd54f;background:rgba(255,213,79,.25)}.c36 em{font-style:normal;font-size:13px;line-height:1;height:14px}</style>`;
    return style + `<div class="row" style="justify-content:space-between;align-items:center"><button class="btn ghost" data-a="v36cal" data-v="prev">‹</button><b>${MON[m]} พ.ศ. ${y + 543}</b><button class="btn ghost" data-a="v36cal" data-v="next">›</button></div>
      <div class="cal36" style="margin-top:6px">${DAYS.map(d => `<div class="h">${d}</div>`).join('')}${cells}</div>
      ${o ? '<div class="row end"><button class="btn ghost" data-a="v36cal" data-v="today">กลับมาเดือนนี้</button></div>' : ''}
      <h5>วันสำคัญเดือนนี้</h5>${evs.length ? `<div class="grid">${evs.map(({ dom, e }) => `<div class="card"><div class="ci">${e.i}</div><div class="cb"><h4>${esc(e.n)}</h4><p class="dim">${dom} ${MONS[m]} · ${DAYS[(((first + dom - 1 + 3) % 7) + 7) % 7]}${e.hol ? ' · วันหยุดราชการ 🏛️' : ''}</p></div></div>`).join('')}</div>` : '<p class="empty">เดือนนี้ไม่มีวันสำคัญ</p>'}`;
  };
  const calApp = function () {
    const t = date();
    return `<div class="card"><div class="ci">📅</div><div class="cb"><h4>${full()}</h4><p class="dim">เวลา ${hhmm()} น. · เกม${RD(S.day)} · เดือนที่ ${t.m + 1} ของปี ${t.be}</p></div></div>` + monthHtml(off);
  };
  UI.H.v36cal = d => { off = d.v === 'today' ? 0 : off + (d.v === 'prev' ? -1 : 1); };
  Phone.apps.cal36 = calApp;
  if (!APPS.some(a => a.id === 'cal36')) APPS.splice(Math.min(APPS.length, 3), 0, { id: 'cal36', i: '📅', n: 'ปฏิทิน' });

  // ===== festival calendar on real dates (edited hooks in v24_fest.js read Cal36; the older fest2 helpers are rewired here) =====
  if (window.Cal24) Cal24.dateText = d => dm(d);
  if (typeof Fest2 !== 'undefined') {
    Fest2.today = () => event(S.day);
    Fest2.next = () => { for (let k = 1; k <= 400; k++) { const e = event(S.day + k); if (e) return { e, in: k }; } return null; };
  }

  // ===== month / year rollover =====
  { const _nd = newDay;
    newDay = function () {
      const r = _nd.apply(this, arguments);
      try {
        const t = date(), s = st();
        if (t.dom === 1 && s.lastMon !== t.y * 12 + t.m) {
          s.lastMon = t.y * 12 + t.m;
          {
            const ny = t.m === 0;
            UI.toast(ny ? `🎆 สวัสดีปีใหม่ พ.ศ. ${t.be}` : `เข้าสู่เดือน${MON[t.m]} พ.ศ. ${t.be}`, '📅');
            Phone.msg('ปฏิทิน', ny ? `ขึ้นปีใหม่ พ.ศ. ${t.be} แล้ว` : `วันนี้เป็นวันที่ 1 ${MON[t.m]} เข้าสู่เดือน${MON[t.m]} (${daysIn(t.y, t.m)} วัน) ตรวจบิลและกำหนดชำระรายเดือนด้วยนะ`);
          }
        }
        if (window.Ppl36) Ppl36.day(t);
      } catch (e) { console.warn('v36 cal day', e); }
      return r;
    };
  }

  // ===== real Thai time mode: show the true date =====
  // the game weekday is tied to S.day, so to show today's real date the game skips forward (never back) to the matching weekday
  function alignReal() {
    if (typeof TimeMode === 'undefined' || !TimeMode.real || !TimeMode.real() || !S) return;
    const tdy = thaiToday(), s = st();
    if (epoch(S.day) === tdy) return;
    const k = ((((tdy + 3) % 7) - ((S.day - 1) % 7)) + 7) % 7;
    if (k) {
      const keep = G.simulating; G.simulating = true;
      try { simulate(k * 1440); } catch (e) { console.warn('v36 align', e); } finally { G.simulating = keep; }
      if (typeof S.realOff === 'number') S.realOff += k * 1440;
      UI.toast(`โหมดเวลาจริง: ข้ามไปวัน${DAYN[(tdy + 3) % 7].slice(3)}ให้ตรงปฏิทินจริง`, '🕐');
    }
    s.cal.start = tdy - (S.day - 1);
    hudKey = '';
  }
  if (typeof TimeMode !== 'undefined') {
    const _set = TimeMode.set.bind(TimeMode);
    TimeMode.set = function (k) { _set(k); try { alignReal(); } catch (e) { console.warn('v36 real', e); } };
    try { alignReal(); } catch (e) { console.warn('v36 real', e); }
  }
});
