'use strict';
// ---------- v250: staff benefits, training and career steps (builds on v247) ----------
// Staff tab > "🏅 สวัสดิการและการพัฒนาพนักงาน".
//  BENEFITS (monthly cost, felt through the staff's morale target which is 70 + the sum below, and through sales):
//    provident fund (company pays 3% of payroll) +4 · group health cover (700 per head) +4 · meal allowance (1,200 per head) +3
//    paid leave 6 days (law) +0 / 10 days +3 (sales -0.4%) / 15 days +5 (sales -0.9%) · working from home 0 days +0 / 1 day +2 / 2 days +4 (sales -0.6%)
//    a benefit sum of 8 or more makes people quit half as often, 12 or more a quarter as often
//  TRAINING: each person has a skill (1-5) and a title (พนักงาน, อาวุโส, หัวหน้าทีม, ผู้จัดการฝ่าย, ผู้อำนวยการฝ่าย)
//    courses: skill course 15,000 / 10 days (+1 skill) · leadership course 40,000 / 14 days (needed from the team-lead step) · certificate 60,000 / 30 days (+1 skill, +8 morale)
//    skill is limited to title step + 2; the team's skill adds 0.4% of sales per average level above 1, and each lead or manager adds 0.3% (up to 1.5%)
//  CAREER: after probation and 180 days a person can be promoted when skill >= title step + 2 (and the leadership course for the lead step and above):
//    new title, +12% pay, +8 morale. Every 1 Jan there is a review (A / B / C) with a message naming the people ready for promotion.
V23.add('v250_people2', function () {
  if (typeof Company === 'undefined' || !Company.list || typeof Cal36 === 'undefined') return;
  const E = s => (typeof esc === 'function' ? esc(s) : String(s));
  const B = n => (typeof baht0 === 'function' ? baht0(n) : typeof baht === 'function' ? baht(n) : Math.round(n).toLocaleString('en-US') + ' ฿');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), R100 = n => Math.round(n / 100) * 100;
  const TITLES = ['พนักงาน', 'พนักงานอาวุโส', 'หัวหน้าทีม', 'ผู้จัดการฝ่าย', 'ผู้อำนวยการฝ่าย'];
  const COURSE = { skill: { n: 'อบรมทักษะวิชาชีพ', cost: 15000, days: 10 }, lead: { n: 'อบรมภาวะผู้นำ', cost: 40000, days: 14 }, cert: { n: 'ใบรับรองวิชาชีพ', cost: 60000, days: 30 } };
  const open = c => c && c.st === 'open';
  const msg = (c, t, q) => { try { Phone.msg(c.name, t, !!q); } catch (e) { } };
  const hist = (c, t) => { try { c.hist.unshift(`${RD(S.day)}: ${t}`); } catch (e) { } };
  const BEN = c => { const b = c.ben = c.ben || {}; if (b.pf == null) { b.pf = 0; b.health = 0; b.meal = 0; b.leave = 6; b.remote = 0; } return b; };
  const staff = c => c.staff || [];
  const sk = s => s.sk || 1, tl = s => s.tl || 0;
  const payroll = c => staff(c).reduce((a, s) => a + (s.sal || 0), 0);
  const bonus = c => { const b = BEN(c); return (b.pf ? 4 : 0) + (b.health ? 4 : 0) + (b.meal ? 3 : 0) + (b.leave >= 15 ? 5 : b.leave >= 10 ? 3 : 0) + (b.remote >= 2 ? 4 : b.remote >= 1 ? 2 : 0); };
  const benCost = c => { const b = BEN(c), n = staff(c).length; return Math.round((b.pf ? payroll(c) * 0.03 : 0) + (b.health ? 700 * n : 0) + (b.meal ? 1200 * n : 0)); };
  const benRev = c => { const b = BEN(c); return -((b.leave >= 15 ? 0.009 : b.leave >= 10 ? 0.004 : 0) + (b.remote >= 2 ? 0.006 : 0)); };
  const skillRev = c => { const L = staff(c); if (!L.length) return 0; const avg = L.reduce((a, s) => a + sk(s), 0) / L.length, heads = L.filter(s => tl(s) >= 2).length; return Math.max(0, avg - 1) * 0.004 + Math.min(0.015, heads * 0.003); };
  const canPromote = (c, s) => { if (s.prob || tl(s) >= 4 || s.tr) return ''; if (S.day - (s.hd == null ? -999 : s.hd) < 180) return 'ทำงานยังไม่ครบ 180 วัน'; if (sk(s) < tl(s) + 2) return `ทักษะต้องถึง ${tl(s) + 2}`; if (tl(s) >= 1 && !s.ld) return 'ต้องผ่านอบรมภาวะผู้นำ'; return 'ok'; };
  window.Hr250 = { target: c => 70 + bonus(c), revPct: c => benRev(c) + skillRev(c), quitMul: c => (bonus(c) >= 12 ? 0.25 : bonus(c) >= 8 ? 0.5 : 1), BEN, bonus, benCost, skillRev, canPromote, TITLES, COURSE };

  const promote = (c, s) => { s.tl = tl(s) + 1; s.sal = R100((s.sal || 0) * 1.12); s.mo = clamp((s.mo == null ? 70 : s.mo) + 8, 0, 100); msg(c, `🎖️ ${s.name} ได้เลื่อนเป็น "${TITLES[s.tl]}" เงินเดือนใหม่ ${B(s.sal)}`); hist(c, `เลื่อนตำแหน่ง ${s.name} เป็น${TITLES[s.tl]}`); };
  const train = (c, s, k) => {
    const C = COURSE[k]; if (!C || s.tr || s.prob || c.cash < C.cost) return false;
    if ((k === 'skill' || k === 'cert') && sk(s) >= Math.min(5, 2 + tl(s))) { UI.toast('ทักษะถึงเพดานของตำแหน่งนี้แล้ว ต้องเลื่อนตำแหน่งก่อน', '⚠️'); return false; }
    if (k === 'lead' && s.ld) { UI.toast('ผ่านอบรมภาวะผู้นำแล้ว', 'ℹ️'); return false; }
    c.cash -= C.cost; try { Company.book(c, 0, C.cost); } catch (e) { } s.tr = { k, end: S.day + C.days };
    hist(c, `ส่ง ${s.name} ${C.n} ${B(C.cost)}`); return true;
  };
  const daily = () => {
    for (const c of Company.list()) {
      if (!open(c)) continue; BEN(c);
      for (const s of staff(c)) if (s.tr && S.day >= s.tr.end) {
        const k = s.tr.k; s.tr = null;
        if (k === 'lead') { s.ld = 1; msg(c, `🎓 ${s.name} จบอบรมภาวะผู้นำ`, true); }
        else { s.sk = Math.min(5, sk(s) + 1); if (k === 'cert') s.mo = clamp((s.mo == null ? 70 : s.mo) + 8, 0, 100); msg(c, `🎓 ${s.name} จบ${COURSE[k].n} ทักษะเพิ่มเป็น ${s.sk}`, true); }
      }
      const t = Cal36.date(S.day);
      if (t.dom === 1 && c.p250M !== S.day) {
        c.p250M = S.day; const cost = benCost(c);
        if (cost > 0) { c.cash -= cost; try { Company.book(c, 0, cost); } catch (e) { } msg(c, `🏅 จ่ายสวัสดิการพนักงานประจำเดือน ${B(cost)}`, true); }
        if (t.m === 0 && staff(c).length) {   // yearly review
          const L = staff(c).filter(s => !s.prob), sc = L.map(s => [s, sk(s) * 8 + (s.mo == null ? 70 : s.mo) / 2 + Math.random() * 20]).sort((a, b) => b[1] - a[1]);
          sc.forEach(([s], i) => { s.perf = i < Math.ceil(sc.length * 0.25) ? 'A' : i < Math.ceil(sc.length * 0.75) ? 'B' : 'C'; });
          const ready = L.filter(s => canPromote(c, s) === 'ok').map(s => s.name);
          if (L.length) msg(c, `📋 ประเมินผลประจำปี: เกรด A ${L.filter(s => s.perf === 'A').length} · B ${L.filter(s => s.perf === 'B').length} · C ${L.filter(s => s.perf === 'C').length}${ready.length ? ` · พร้อมเลื่อนตำแหน่ง: ${ready.slice(0, 4).join(', ')}` : ''}`);
        }
      }
    }
  };
  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { daily(); } catch (e) { console.warn('v250 daily', e); } return r; }; }

  const section = c => {
    const b = BEN(c), L = staff(c), tog = (k, label, cost) => `<button class="btn ${b[k] ? '' : 'ghost'}" data-a="p250" data-v="ben|${k}|${b[k] ? 0 : 1}">${b[k] ? '✅' : '⬜'} ${label}<br><small>${cost}</small></button>`;
    const leaveB = [6, 10, 15].map(v => `<button class="btn ${b.leave === v ? '' : 'ghost'}" data-a="p250" data-v="ben|leave|${v}">${v} วัน</button>`).join(''), remB = [0, 1, 2].map(v => `<button class="btn ${b.remote === v ? '' : 'ghost'}" data-a="p250" data-v="ben|remote|${v}">${v} วัน</button>`).join('');
    const rows = L.slice(0, 14).map((s, i) => {
      const cp = canPromote(c, s), st = s.prob ? 'ทดลองงาน' : s.tr ? `อบรม ${COURSE[s.tr.k].n} (เหลือ ${Math.max(0, s.tr.end - S.day)} วัน)` : cp === 'ok' ? '⭐ พร้อมเลื่อนตำแหน่ง' : cp || 'ตำแหน่งสูงสุด';
      const act = s.prob || s.tr ? '' : `${['skill', 'lead', 'cert'].map(k => `<button class="btn ghost" data-a="p250" data-v="train|${i}|${k}" ${c.cash >= COURSE[k].cost && !(k === 'lead' && s.ld) ? '' : 'disabled'} title="${COURSE[k].n} ${B(COURSE[k].cost)}">${k === 'skill' ? '📘' : k === 'lead' ? '🧭' : '🏅'}</button>`).join('')}${cp === 'ok' ? `<button class="btn" data-a="p250" data-v="promote|${i}">เลื่อนตำแหน่ง</button>` : ''}`;
      return `<tr><td>${E(s.name)}</td><td>${TITLES[tl(s)]}${s.ld ? ' 🧭' : ''}</td><td>${'★'.repeat(sk(s))}${'☆'.repeat(5 - sk(s))}</td><td>${s.perf || '-'}</td><td>${Math.round(s.mo == null ? 70 : s.mo)}</td><td>${E(st)}</td><td>${act}</td></tr>`;
    }).join('');
    return `<h5>🏅 สวัสดิการและการพัฒนาพนักงาน</h5>
      <p class="lead">คะแนนสวัสดิการ <b>+${bonus(c)}</b> ต่อขวัญกำลังใจเป้าหมาย (ปกติ 70) · ค่าใช้จ่ายสวัสดิการ ${B(benCost(c))}/เดือน · ผลต่อยอดขาย ${(100 * (benRev(c) + skillRev(c))).toFixed(1)}% ต่อเดือน (ทักษะและตำแหน่งบวก ลาและทำงานที่บ้านลบเล็กน้อย) · ${bonus(c) >= 8 ? 'พนักงานลาออกน้อยลง' : 'สวัสดิการ 8 คะแนนขึ้นไปช่วยให้คนไม่ลาออก'}</p>
      <div class="cx-grid">
        <div class="cx-card"><h4>💼 สวัสดิการประจำ</h4><div class="cx-actions">${tog('pf', 'กองทุนสำรองเลี้ยงชีพ +4', '3% ของเงินเดือนรวม')}${tog('health', 'ประกันสุขภาพกลุ่ม +4', '700 ฿/คน/เดือน')}${tog('meal', 'ค่าอาหาร +3', '1,200 ฿/คน/เดือน')}</div></div>
        <div class="cx-card"><h4>🏖️ วันลาพักร้อน/ปี</h4><p class="cx-meta">6 วัน (ตามกฎหมาย) · 10 วัน +3 (ยอดขาย −0.4%) · 15 วัน +5 (ยอดขาย −0.9%)</p><div class="cx-actions">${leaveB}</div></div>
        <div class="cx-card"><h4>🏠 ทำงานที่บ้าน/สัปดาห์</h4><p class="cx-meta">1 วัน +2 · 2 วัน +4 (ยอดขาย −0.6%)</p><div class="cx-actions">${remB}</div></div>
      </div>
      <p class="dim">อบรม: 📘 ทักษะ ${B(COURSE.skill.cost)}/10 วัน (+1 ทักษะ) · 🧭 ภาวะผู้นำ ${B(COURSE.lead.cost)}/14 วัน (ต้องมีตั้งแต่ขั้นหัวหน้าทีม) · 🏅 ใบรับรอง ${B(COURSE.cert.cost)}/30 วัน (+1 ทักษะ ขวัญ +8) · เลื่อนตำแหน่งได้เมื่อผ่านโปร ทำงาน 180 วัน และทักษะถึง (ขั้น+2)</p>
      ${L.length ? `<table class="tbl" style="width:100%"><tr><th>ชื่อ</th><th>ตำแหน่ง</th><th>ทักษะ</th><th>เกรด</th><th>ขวัญ</th><th>สถานะ</th><th></th></tr>${rows}</table>${L.length > 14 ? `<p class="dim">แสดง 14 คนแรกจาก ${L.length} คน</p>` : ''}` : '<p class="dim">ยังไม่มีพนักงาน</p>'}`;
  };
  { const _h = Company.html.bind(Company);
    Company.html = function (t) {
      const html = _h(t);
      if (t !== 0) return html;
      try {
        const c = Company.get(Company.sel); if (!c || c.st !== 'open' || Company.tab229 !== 'staff') return html;
        const box = document.createElement('div'); box.innerHTML = html; const body = box.querySelector('.cx-body'); if (!body) return html;
        body.insertAdjacentHTML('beforeend', section(c)); return box.innerHTML;
      } catch (e) { console.warn('v250 page', e); return html; }
    }; }
  UI.H.p250 = d => {
    const [a, x, y] = String(d.v || '').split('|'), c = Company.get(Company.sel); if (!c || c.st !== 'open') return; const b = BEN(c);
    if (a === 'ben') { b[x] = +y; UI.toast('บันทึกนโยบายสวัสดิการแล้ว', '🏅'); return; }
    const s = staff(c)[+x]; if (!s) return;
    if (a === 'train') { if (train(c, s, y)) UI.toast(`ส่ง ${s.name} ${COURSE[y].n}`, '🎓'); return; }
    if (a === 'promote') { if (canPromote(c, s) === 'ok') promote(c, s); }
  };
  window.People250 = { daily, section, promote, train, canPromote };
});
