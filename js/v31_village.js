'use strict';
// ---------- v31_village: the village as a running story. Multi-day storylines with decisions and lasting effects:
// kathin / ผ้าป่า fundraising, the monthly village meeting (votes that build real projects), the dry-season water crisis,
// a boundary dispute between two neighbours, the village-headman election (debate, vote on Sunday, pledges), road repair funding,
// stray dogs, and the harvest fair committee. A village reputation meter (0-100) moves crop prices (±10%), neighbours' gifts and gossip.
// Phone app "🏘️ หมู่บ้านของเรา". State in S.v31v. ----------
V23.add('v31_village', () => {
  const V = () => { const x = S.v31v = S.v31v || {}; x.rep = x.rep ?? 50; x.fund = x.fund ?? 80000; x.st = x.st || {}; x.flags = x.flags || {}; x.hist = x.hist || []; x.last = x.last || {}; x.pledge = x.pledge || null; return x; };
  const stt = k => { const s = V().st; return s[k] = s[k] || { ch: 0 }; };
  const msg = (f, t, q) => { try { Phone.msg(f, t, q); } catch (e) { } };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const pay = (n, label) => { n = Math.round(+n) || 0; if (n > 0 && S.money < n) { UI.toast(`เงินไม่พอ ต้องใช้ ${baht(n)}`, '💸'); return false; } if (n > 0) { S.money -= n; try { Bank2.log(label, -n); } catch (e) { } } return true; };
  const gain = (n, src) => { n = Math.round(+n) || 0; if (n > 0) { earn(n); try { Bank2.income(src, n); } catch (e) { } } };
  const mood = n => { S.mood = Math.max(0, Math.min(100, (S.mood ?? 70) + n)); };
  const energy = n => { S.energy = Math.max(0, Math.min(maxEnergy(), S.energy + n)); };
  const cyc = () => ((S.day - 1) % 28) + 1;
  const dayIdx = () => (S.day - 1) % 7;
  const hrNow = () => S.time / 60;
  const inWin = (a, b) => hrNow() >= a && hrNow() < b;
  const dtxt = d => RD(d);
  const vill = () => { try { return G.npcs.filter(n => !n.staff).map(n => n.name); } catch (e) { return []; } };
  const some = (n) => { const v = vill().sort(() => Math.random() - 0.5); return v.slice(0, n); };
  const fr = (names, v) => { for (const n of names) { try { Friends.add(n, v); } catch (e) { } } };
  const eventOn = (k, from, span) => { if (!window.Cal24 || !Cal24.event) return 0; for (let d = from; d <= from + (span || 90); d++) { const e = Cal24.event(d); if (e && e.k === k) return d; } return 0; };
  const hasDoc = ids => !window.Gov24 || Gov24.need(ids, 'ใช้สิทธิ/ยื่นเรื่องของหมู่บ้าน');
  const elect = () => { try { return Elect.st(); } catch (e) { return null; } };
  const log = t => { const v = V(); v.hist.unshift({ d: S.day, t }); v.hist.length = Math.min(v.hist.length, 25); };
  const rep = (d, why) => { const v = V(), b = v.rep; v.rep = clamp(v.rep + d, 0, 100); if (d && why) log(`${d > 0 ? '+' : ''}${Math.round(d * 10) / 10} ชื่อเสียง: ${why}`); return v.rep - b; };
  const repLabel = r => r >= 85 ? 'ผู้ที่ทุกคนเคารพ' : r >= 70 ? 'คนดีของหมู่บ้าน' : r >= 55 ? 'เพื่อนบ้านที่ดี' : r >= 40 ? 'คนธรรมดา' : r >= 25 ? 'ถูกซุบซิบ' : 'คนไม่น่าไว้ใจ';

  const PROJ = { lights: ['💡', 'ติดไฟส่องสว่างถนนทั้งหมู่บ้าน', 60000], road: ['🛣️', 'ซ่อมถนนลาดยาง', 120000], market: ['🧺', 'ตลาดชุมชนประจำสัปดาห์', 50000], park: ['🌳', 'สวนสาธารณะและลานออกกำลังกาย', 70000], water: ['🚰', 'ขยายเขตประปาและแรงดันน้ำ', 100000], wifi: ['📶', 'WiFi สาธารณะในหมู่บ้าน', 30000], temple: ['🛕', 'ปรับปรุงศาลาวัดและลานกิจกรรม', 40000], fest: ['🎪', 'จัดงานรื่นเริงประจำปีของหมู่บ้าน', 30000] };
  const LOCAL = { temple: 1, fest: 1 };
  const built = k => { if (LOCAL[k]) return S.day - (V().flags[k] || -999) < 84; const e = elect(); return !!(e && e.proj && e.proj[k]); };
  const setProj = k => { if (LOCAL[k]) { V().flags[k] = S.day; if (k === 'fest') { mood(10); fr(some(6), 0.3); } else { mood(4); fr(some(3), 0.15); } return; } const e = elect(); if (e) e.proj[k] = S.day; };

  // ================= 1. kathin / harvest fair committees =================
  const FEST = { kathin: { ev: 'kathin', n: 'ทอดกฐินสามัคคี', i: '🧣', goal: 120000, k: 'kathin' }, harvest: { ev: 'okphansa', n: 'งานบุญเกี่ยวข้าวสามัคคีและประกวดผลผลิต', i: '🌾', goal: 60000, k: 'harvest' } };
  function festTick(key) {
    const F = FEST[key], s = stt(key);
    const next = eventOn(F.ev, S.day, 84);
    if (s.ch === 0 || s.ch === 3) { if (next && next - S.day <= 14 && next - S.day >= 1 && s.yr !== Math.floor((next - 1) / 84)) { Object.assign(s, { ch: 1, yr: Math.floor((next - 1) / 84), date: next, goal: F.goal, raised: Math.round(rnd(0.05, 0.15) * F.goal), mine: 0, role: '', walked: -9, att: 0, entry: null }); msg('ผู้ใหญ่บ้าน', `${F.i} หมู่บ้านตั้งคณะกรรมการจัด${F.n} ${dtxt(next)} ตั้งเป้า ${baht(F.goal)} ร่วมเป็นกรรมการหรือบริจาคได้ในแอป "หมู่บ้านของเรา"`, false); log(`เริ่มจัด${F.n}`); } }
    if (s.ch === 1) {
      const mult = (s.role ? 1.15 : 1) * (0.7 + V().rep / 100);
      s.raised += Math.round(rnd(F.goal * 0.008, F.goal * 0.02) * mult);
      if (S.day === s.date - 1 && key === 'kathin') msg('ผู้ใหญ่บ้าน', `พรุ่งนี้งาน${F.n} ยอดบริจาคตอนนี้ ${baht(s.raised)} จากเป้า ${baht(s.goal)}`, true);
      if (S.day >= s.date) s.ch = 2;
    }
    if (s.ch === 2 && S.day > s.date) finishFest(key);
  }
  function finishFest(key) {
    const F = FEST[key], s = stt(key), ok = s.raised >= s.goal;
    if (key === 'harvest' && s.entry && !s.entry.done) { /* entry not judged because the player missed the day */ s.entry.done = 1; }
    rep(ok ? 8 : 3, `${F.n}${ok ? ' สำเร็จตามเป้า' : ' (ไม่ถึงเป้า)'}`);
    if (ok && key === 'kathin') V().flags.temple = S.day;
    if (s.mine >= 20000) { fr(some(5), 0.3); rep(2, 'เป็นเจ้าภาพใหญ่'); }
    msg('ผู้ใหญ่บ้าน', `${F.i} สรุป${F.n}: ได้เงิน ${baht(s.raised)} จากเป้า ${baht(s.goal)} ${ok ? 'สำเร็จ ชาวบ้านชื่นชม' : 'ไม่ถึงเป้า แต่ทุกคนขอบคุณที่ช่วยกัน'}${s.att ? ' · ขอบคุณที่มาร่วมงาน' : ' · เสียดายที่คุณไม่ได้มา'}`, false);
    s.ch = 3;
  }
  const festView = key => {
    const F = FEST[key], s = stt(key);
    if (s.ch === 0) { const n = eventOn(F.ev, S.day, 90); return C(F.i, F.n, n ? `จัดวัน ${dtxt(n)} · คณะกรรมการตั้งขึ้นล่วงหน้า 14 วัน` : 'ยังไม่ถึงฤดูกาล', ''); }
    if (s.ch === 3) return C(F.i, F.n, `ปีนี้จัดเสร็จแล้ว ได้ ${baht(s.raised)} ครั้งหน้าอีกประมาณ 1 ปีเกม`, '');
    const left = s.date - S.day;
    let b = '';
    if (s.ch === 1) {
      b += B('fjoin|' + key, s.role ? `กรรมการ: ${s.role}` : '🙋 เป็นกรรมการ', { dis: !!s.role, ghost: 1 });
      b += [5000, 20000, 50000].map(v => B(`fdon|${key}|${v}`, `บริจาค ${baht(v)}`, { ghost: 1 })).join('');
      b += B('fwalk|' + key, '🚶 เดินรับบริจาค (พลังงาน 15)', { dis: s.walked === S.day, ghost: 1 });
      if (key === 'harvest') b += B('fentry|' + key, s.entry ? `🧺 ส่งประกวดแล้ว` : '🧺 ส่งผลผลิตเข้าประกวด', { dis: !!s.entry, ghost: 1 });
    }
    if (s.ch === 2 || (s.ch === 1 && S.day === s.date)) b += B('fatt|' + key, key === 'kathin' ? '🙏 ไปร่วมทอดกฐิน' : '🌾 ไปร่วมงานเกี่ยวข้าว', { dis: s.att || S.day !== s.date || !inWin(8, 17) });
    return C(F.i, `${F.n}${s.role ? ' · ' + s.role : ''}`, `${s.ch === 2 && S.day === s.date ? 'วันนี้เป็นวันงาน (08:00-17:00)' : 'จัดงาน ' + dtxt(s.date) + ` (อีก ${Math.max(0, left)} วัน)`} · ยอด ${baht(s.raised)} / ${baht(s.goal)} (${Math.round(s.raised / s.goal * 100)}%) · คุณบริจาค ${baht(s.mine)}${s.entry ? ` · ส่งประกวด ${(ITEMS[s.entry.id] || {}).n || s.entry.id}` : ''}`, b);
  };

  // ================= 2. monthly village meeting =================
  function meetTick() {
    const m = stt('meet'), d = cyc(), v = V();
    if (d === 1 && m.cycle !== Math.floor((S.day - 1) / 28)) {
      v.fund += 12000;
      const cand = Object.keys(PROJ).filter(k => !built(k));
      const a = pick(cand), rest = cand.filter(k => k !== a);
      m.cycle = Math.floor((S.day - 1) / 28); m.ag = cand.length ? [a].concat(rest.length ? [pick(rest)] : []) : []; m.voted = ''; m.spoke = ''; m.res = null; m.done = 0;
      if (m.ag.length) msg('ผู้ใหญ่บ้าน', `📢 ประชุมหมู่บ้าน${RD(S.day + 9)} เวลา 18:00-21:00 วาระ: ${m.ag.map(k => PROJ[k][1]).join(' หรือ ')} กองทุนหมู่บ้าน ${baht(v.fund)}`, false);
    }
    if (d === 11 && m.ag && m.ag.length && !m.done) resolveMeet();
    if (m.pend && S.day > m.pendBy) { msg('ผู้ใหญ่บ้าน', `โครงการ ${PROJ[m.pend][1]} ถูกพับ เพราะหางบไม่ครบ`, false); rep(-2, 'โครงการหมู่บ้านล้มเหลว'); m.pend = ''; }
  }
  function resolveMeet() {
    const m = stt('meet'); m.done = 1; if (!m.ag || !m.ag.length) return;
    const e = elect();
    let win;
    if (e && e.office === 'village') win = m.voted || m.ag[0];     // the headman decides
    else {
      const [a, b] = m.ag; if (!b) win = a; else {
        let va = 20 + rnd(-6, 6) + (m.voted === a ? 1 : 0) + (m.spoke === a ? 4 : 0) - (m.voted === b ? 1 : 0) - (m.spoke === b ? 4 : 0);
        win = va >= 20 ? a : b; m.tally = `${Math.round(va)}-${Math.round(40 - va)}`;
      }
    }
    const cost = PROJ[win][2], v = V();
    if (v.fund >= cost) { v.fund -= cost; setProj(win); rep(3, `ประชุมมีมติ ${PROJ[win][1]}`); msg('ผู้ใหญ่บ้าน', `🏘️ ที่ประชุมมีมติ ${PROJ[win][1]}${m.tally ? ' (' + m.tally + ' เสียง)' : ''} ใช้กองทุน ${baht(cost)} ดำเนินการแล้ว`, false); m.res = { win, ok: 1 }; }
    else { m.pend = win; m.pendBy = S.day + 20; m.res = { win, ok: 0 }; msg('ผู้ใหญ่บ้าน', `🏘️ ที่ประชุมมีมติ ${PROJ[win][1]} แต่กองทุนมี ${baht(v.fund)} ขาดอีก ${baht(cost - v.fund)} ภายใน 20 วัน ชาวบ้านบริจาคเพิ่มได้ (รวมถึงคุณ)`, false); }
  }
  const meetView = () => {
    const m = stt('meet'), v = V(), e = elect();
    let h = C('🏛️', 'ประชุมหมู่บ้านประจำเดือน', `ทุกวันที่ 10 ของรอบ 4 สัปดาห์ เวลา 18:00-21:00 · กองทุนหมู่บ้าน ${baht(v.fund)} (เพิ่ม 12,000 ทุกเดือน)${e && e.office === 'village' ? ' · คุณเป็นผู้ใหญ่บ้าน ตัดสินวาระได้เอง' : ''}`, '');
    if (m.pend) h += C(PROJ[m.pend][0], `รอเงินสมทบ: ${PROJ[m.pend][1]}`, `ต้องการ ${baht(PROJ[m.pend][2])} กองทุนมี ${baht(v.fund)} ภายใน${RD(m.pendBy)}`, [5000, 20000, 50000].map(x => B('mtop|' + x, `สมทบ ${baht(x)}`, { ghost: 1 })).join(''));
    if (m.ag && m.ag.length && !m.done) {
      const today = cyc() === 10 && inWin(18, 21);
      h += `<h5>วาระการประชุมรอบนี้</h5><div class="grid">${m.ag.map(k => C(PROJ[k][0], PROJ[k][1], `ใช้เงิน ${baht(PROJ[k][2])} · ${m.voted === k ? '✅ คุณโหวตข้อนี้' : ''}${m.spoke === k ? ' 🎤 คุณอภิปรายสนับสนุน' : ''}`, B('mvote|' + k, e && e.office === 'village' ? 'ตัดสินใจเลือก' : 'โหวต', { dis: !today && !(e && e.office === 'village'), ghost: 1 }) + (e && e.office === 'village' ? '' : B('mspeak|' + k, '🎤 อภิปราย (พลังงาน 10)', { dis: !today || !!m.spoke, ghost: 1 })))).join('')}</div>`;
      h += `<p class="dim">${today ? 'ตอนนี้ห้องประชุมเปิดอยู่ มาโหวตได้' : cyc() < 10 ? 'ยังไม่ถึงวันประชุม (วันที่ 10 ของรอบ)' : 'ประชุมเฉพาะ 18:00-21:00 ของวันที่ 10'}</p>`;
    } else if (m.res) h += `<p class="lead">ผลประชุมรอบนี้: ${PROJ[m.res.win][1]} ${m.res.ok ? '— ดำเนินการแล้ว' : '— รอเงินสมทบ'}${m.tally ? ' · คะแนน ' + m.tally : ''}</p>`;
    return h;
  };

  // ================= 3. dry-season water crisis =================
  function waterTick() {
    const s = stt('water'), v = V(), sea = (() => { try { return season().id; } catch (e) { return ''; } })();
    if (s.ch === 0) { if (sea === 'hot' && !built('water') && !v.flags.well && S.day - (v.last.water ?? -999) >= 84 && Math.random() < 0.2) { Object.assign(s, { ch: 1, day: S.day, wk: 0, tank: 0, pet: 0 }); v.last.water = S.day; msg('ผู้ใหญ่บ้าน', '🚰 ฤดูร้อน น้ำประปาแรงดันตกทั้งหมู่บ้าน ชาวบ้านเดือดร้อน ประชุมหาทางออกในแอป "หมู่บ้านของเรา"', false); log('วิกฤตน้ำแล้ง'); } return; }
    if (s.ch === 1) {
      if ((S.day - s.day) % 7 === 6 && S.day > (s.tank || 0)) { rep(-2, 'น้ำประปาไม่มา หมู่บ้านเดือดร้อน'); fr(some(3), -0.1); }
      if (s.pet && S.day >= s.pet) { s.pet = 0; if (Math.random() < 0.55 + V().rep / 400) { setProj('water'); s.ch = 3; rep(6, 'การประปาขยายเขตตามหนังสือร้องเรียน'); msg('การประปาส่วนภูมิภาค', 'อนุมัติขยายเขตและเพิ่มแรงดันน้ำในหมู่บ้านตามหนังสือร้องเรียน', false); } else { s.failed = 1; msg('การประปาส่วนภูมิภาค', 'ยังไม่อนุมัติ ขอเอกสารเพิ่ม (ยื่นใหม่ไม่ได้ในรอบนี้)', false); } }
      if (sea !== 'hot') { s.ch = 0; rep(-3, 'ผ่านหน้าแล้งโดยไม่แก้น้ำ'); }
    }
  }
  const waterView = () => {
    const s = stt('water'), v = V();
    if (s.ch === 0) return C('🚰', 'ระบบน้ำหมู่บ้าน', v.flags.well ? 'หมู่บ้านมีบ่อบาดาลสาธารณะแล้ว' : built('water') ? 'ขยายเขตประปาแล้ว' : 'ยังไม่มีปัญหา (มักเกิดหน้าแล้ง)', '');
    if (s.ch === 3) return C('🚰', 'ระบบน้ำหมู่บ้าน', 'แก้ปัญหาน้ำแล้ว', '');
    return C('🚰', 'วิกฤตน้ำแล้ง', `เกิด${RD(s.day)} · ประปาแรงดันตก ทุกสัปดาห์ที่ไม่แก้ ชื่อเสียงลดลง · กองทุน ${baht(v.fund)}`,
      B('wwell|30000', 'ร่วมเจาะบ่อบาดาลสาธารณะ สมทบ 30,000', { ghost: 1 }) + B('wwell|60000', 'สมทบ 60,000', { ghost: 1 }) + B('wwell|100000', 'สมทบ 100,000', { ghost: 1 })
      + B('wpet', s.pet ? `📨 ยื่นแล้ว รอผล${RD(s.pet)}` : s.failed ? 'ยื่นหนังสือไม่ได้อีก' : '📨 ยื่นหนังสือร้องเรียนการประปา', { dis: !!s.pet || !!s.failed, ghost: 1 }) + B('wtank', '🛢️ แจกถังน้ำ 20 ใบ (10,000)', { dis: (s.tank || 0) > S.day, ghost: 1 }));
  };

  // ================= 4. boundary dispute between neighbours =================
  function boundTick() {
    const s = stt('bound');
    if (s.ch === 0) { if (S.day - (V().last.bound ?? -999) >= 56 && Math.random() < 0.04) { const p = some(2); if (p.length < 2) return; Object.assign(s, { ch: 1, a: p[0], b: p[1], truth: Math.random() < 0.5 ? 'a' : 'b', day: S.day, clue: '', surveyDue: 0, tried: 0, known: 0 }); V().last.bound = S.day; msg(p[0], `${p[0]} กับ ${p[1]} ทะเลาะกันเรื่องแนวเขตที่ดิน ขอให้คุณช่วยดู`, false); log(`ข้อพิพาทที่ดิน ${p[0]}-${p[1]}`); } return; }
    if (s.ch === 1 && s.surveyDue && S.day >= s.surveyDue) { s.known = 1; s.ch = 2; s.surveyDue = 0; msg('สำนักงานที่ดิน', `ผลรังวัด: แนวเขตที่ถูกต้อง ${s.truth === 'a' ? s.a : s.b} เป็นฝ่ายถูก`, false); }
    if ((s.ch === 1 || s.ch === 2) && S.day > s.day + 14) { fr([s.a, s.b], -0.3); rep(-1, 'ปล่อยข้อพิพาทเพื่อนบ้านเรื้อรัง'); log('ข้อพิพาทที่ดินเรื้อรัง'); s.ch = 0; }
  }
  const boundView = () => {
    const s = stt('bound');
    if (s.ch === 0) return C('🗺️', 'ข้อพิพาทแนวเขตเพื่อนบ้าน', 'ตอนนี้ไม่มีข้อพิพาท', '');
    const right = s.truth === 'a' ? s.a : s.b;
    const b = B('bwalk', '👀 ไปดูแนวเขต (พลังงาน 10)', { dis: s.tried >= 1 || s.ch === 2, ghost: 1 }) + B('bsurvey', s.surveyDue ? `📐 รอผลรังวัด${RD(s.surveyDue)}` : '📐 ขอรังวัด (3,500)', { dis: !!s.surveyDue || s.ch === 2, ghost: 1 })
      + B('bside|a', `เข้าข้าง ${s.a}`, { ghost: 1 }) + B('bside|b', `เข้าข้าง ${s.b}`, { ghost: 1 }) + B('bcomp', '🤝 เสนอแบ่งครึ่ง', { ghost: 1 }) + B('bcourt', '⚖️ แนะนำให้ไปฟ้องศาลกันเอง', { ghost: 1 });
    return C('🗺️', `${s.a} ↔ ${s.b} ทะเลาะเรื่องแนวเขต`, `ตัดสินภายใน${RD(s.day + 14)} · ${s.clue ? 'เบาะแส: ' + s.clue : 'ยังไม่มีเบาะแส'}${s.ch === 2 ? ` · ผลรังวัด: ${right} ถูก` : ''}`, b);
  };

  // ================= 5. village-headman election =================
  const ISSUES = { road: 'ซ่อมถนน', water: 'น้ำประปา', lights: 'ไฟส่องสว่าง', waste: 'ขยะ', dogs: 'สุนัขจรจัด' };
  function electTick() {
    const s = stt('elect'), d = cyc(), cn = Math.floor((S.day - 1) / 28);
    if (d === 15 && s.cn !== cn) { const p = some(2); s.cn = cn; s.A = p[0] || 'ผู้สมัคร ก'; s.B = p[1] || 'ผู้สมัคร ข'; s.sa = pick(Object.keys(ISSUES)); s.sb = pick(Object.keys(ISSUES).filter(k => k !== s.sa)); s.voted = ''; s.debated = -9; s.visited = -9; s.res = null; msg('อำเภอสุขใจ', `🗳️ เลือกตั้งผู้ใหญ่บ้านวันอาทิตย์ที่ ${S.day + 6} (08:00-17:00) ผู้สมัคร: ${s.A} (เน้น${ISSUES[s.sa]}) และ ${s.B} (เน้น${ISSUES[s.sb]}) มีเวทีดีเบตทุกวันก่อนเลือกตั้ง`, false); }
    if (d === 22 && s.cn === cn && !s.res && s.A) {
      const win = Math.random() < 0.5 + (s.voted === 'A' ? 0.03 : s.voted === 'B' ? -0.03 : 0) ? 'A' : 'B', who = win === 'A' ? s.A : s.B, iss = win === 'A' ? s.sa : s.sb;
      s.res = { win, who }; const e = elect();
      if (e && e.office === 'village') { /* player already won through Elect */ s.res.who = 'คุณ'; }
      else { V().pledge = { who, iss, day: S.day, amt: 40000 }; V().fund += 40000; msg('อำเภอสุขใจ', `🗳️ ${who} ได้รับเลือกเป็นผู้ใหญ่บ้าน สัญญาจะดูแลเรื่อง${ISSUES[iss]} งบพัฒนา 40,000 ฿ เข้ากองทุนหมู่บ้าน`, false); }
      if (s.voted && s.voted === win) { rep(2, 'ผู้ที่คุณเลือกได้รับเลือกตั้ง'); fr([who], 0.4); } else if (s.voted) fr([who], -0.1);
    }
  }
  const electView = () => {
    const s = stt('elect'), e = elect(), d = cyc();
    if (!s.A) return C('🗳️', 'เลือกตั้งผู้ใหญ่บ้าน', `เลือกตั้งทุก 4 สัปดาห์ (วันที่ 21 ของรอบ ตรงกับวันอาทิตย์) · ประกาศผู้สมัครวันที่ 15`, '');
    const voteDay = d === 21 && inWin(8, 17), cand = e && e.cand;
    let b = '';
    if (d >= 15 && d <= 20) b += B('edebate', cand ? '🎤 ขึ้นเวทีดีเบต (พลังงาน 10)' : '👂 ไปฟังเวทีดีเบต', { dis: s.debated === S.day, ghost: 1 }) + (cand ? B('evisit', '🏠 เยี่ยมบ้านขอเสียง 5 หลัง', { dis: s.visited === S.day, ghost: 1 }) : '');
    b += B('evote|A', `🗳️ เลือก ${s.A}`, { dis: !voteDay || !!s.voted, ghost: 1 }) + B('evote|B', `🗳️ เลือก ${s.B}`, { dis: !voteDay || !!s.voted, ghost: 1 });
    return C('🗳️', 'เลือกตั้งผู้ใหญ่บ้านรอบนี้', `${s.A} (เน้น${ISSUES[s.sa]}) vs ${s.B} (เน้น${ISSUES[s.sb]}) · ${s.res ? `ผล: ${s.res.who} ได้รับเลือก` : voteDay ? 'วันนี้เปิดหีบ 08:00-17:00' : d < 21 ? 'เลือกตั้งวันที่ 21 ของรอบ (อาทิตย์)' : 'รอประกาศผล'}${s.voted ? ' · คุณลงคะแนนแล้ว' : ''}${cand ? ` · คุณลงสมัคร (คะแนนนิยม +${e.support})` : ''}`, b);
  };

  // ================= 6. road repair funding =================
  function roadTick() {
    const s = stt('road'), v = V();
    if (s.ch === 0) { if (!built('road') && S.day - (v.last.road ?? -999) >= 84 && Math.random() < 0.03) { Object.assign(s, { ch: 1, day: S.day, need: 60000, raised: Math.round(rnd(0, 8000)), pet: 0, failed: 0 }); v.last.road = S.day; msg('อบต.สุขใจ', '🛣️ ถนนในหมู่บ้านเป็นหลุมเป็นบ่อ อบต. ขอให้ชาวบ้านร่วมสมทบ 60,000 ฿ ร่วมบริจาคได้ในแอป', false); log('ระดมทุนซ่อมถนน'); } return; }
    if (s.ch === 1) {
      if (s.pet && S.day >= s.pet) { s.pet = 0; if (Math.random() < 0.4) { s.raised += 25000; msg('อบต.สุขใจ', 'อนุมัติงบสนับสนุน 25,000 ฿ ตามหนังสือร้องเรียน', false); } else { s.failed = 1; msg('อบต.สุขใจ', 'งบประมาณปีนี้หมดแล้ว ไม่สามารถสนับสนุนได้', false); } }
      if (s.raised >= s.need) { s.ch = 2; s.build = S.day + 10; msg('อบต.สุขใจ', '🛣️ ได้เงินครบแล้ว เริ่มก่อสร้างซ่อมถนน ใช้เวลา 10 วัน', false); }
      else if (S.day > s.day + 56) { s.ch = 0; rep(-2, 'ระดมทุนซ่อมถนนไม่สำเร็จ'); msg('อบต.สุขใจ', 'หมดเวลาระดมทุนซ่อมถนน โครงการถูกพับ', false); }
    }
    if (s.ch === 2 && S.day >= s.build) { s.ch = 3; setProj('road'); rep(6, 'ซ่อมถนนหมู่บ้านเสร็จ'); msg('อบต.สุขใจ', '🛣️ ซ่อมถนนเสร็จแล้ว ถนนเรียบขึ้น รถสึกหรอช้าลง', false); }
  }
  const roadView = () => {
    const s = stt('road');
    if (s.ch === 0) return C('🛣️', 'ซ่อมถนนหมู่บ้าน', built('road') ? 'ซ่อมเสร็จแล้ว' : 'ยังไม่มีโครงการ (อบต. จะประกาศเมื่อถนนทรุดโทรม)', '');
    if (s.ch === 3) return C('🛣️', 'ซ่อมถนนหมู่บ้าน', 'ซ่อมเสร็จแล้ว', '');
    if (s.ch === 2) return C('🛣️', 'กำลังก่อสร้างถนน', `เสร็จ${RD(s.build)}`, '');
    return C('🛣️', 'ระดมทุนซ่อมถนน', `ยอด ${baht(s.raised)} / ${baht(s.need)} (${Math.round(s.raised / s.need * 100)}%) · หมดเขต${RD(s.day + 56)}`,
      [5000, 10000, 20000].map(x => B('rdon|' + x, `บริจาค ${baht(x)}`, { ghost: 1 })).join('') + B('rfund', `ใช้กองทุนหมู่บ้าน (${baht(V().fund)})`, { ghost: 1 }) + B('rpet', s.pet ? `รอผล${RD(s.pet)}` : s.failed ? 'ยื่นแล้ว ไม่ผ่าน' : '📨 ขอสนับสนุนจาก อบต.', { dis: !!s.pet || !!s.failed, ghost: 1 }));
  };

  // ================= 7. stray dogs =================
  function dogTick() {
    const s = stt('dog'), v = V();
    if (s.ch === 0) { if (S.day - (v.last.dog ?? -999) >= 70 && S.day > (v.flags.dogSafe || 0) && Math.random() < 0.025) { Object.assign(s, { ch: 1, day: S.day, due: S.day + 10, vol: 0 }); v.last.dog = S.day; msg('ผู้ใหญ่บ้าน', '🐕 สุนัขจรจัดกัดเด็กในหมู่บ้าน ชาวบ้านกลัว ขอให้ช่วยจัดการ', false); log('ปัญหาสุนัขจรจัด'); } return; }
    if (s.ch === 2 && S.day >= s.fin) { s.ch = 3; v.flags.dogSafe = S.day + 84; rep(5, 'ฉีดวัคซีนและทำหมันสุนัขจรจัดทั้งหมู่บ้าน'); msg('ปศุสัตว์อำเภอ', '🐕 ฉีดวัคซีนพิษสุนัขบ้าและทำหมันสุนัขจรจัดเสร็จแล้ว', false); }
    if (s.ch === 1 && S.day > s.due) {
      s.ch = 0; rep(-3, 'ปล่อยสุนัขจรจัดจนเกิดเหตุซ้ำ'); fr(some(3), -0.2);
      if (Math.random() < 0.25) { msg('โรงพยาบาลสุขใจ', '🐕 คุณถูกสุนัขจรจัดกัดขณะเดินผ่าน ต้องฉีดวัคซีนป้องกันพิษสุนัขบ้าและเซรุ่ม ค่าใช้จ่าย 4,500 ฿', false); try { S.money = Math.max(0, S.money - 4500); Bank2.log('วัคซีนพิษสุนัขบ้าหลังถูกกัด', -4500); } catch (e) { } try { if (!S.sick) { S.sick = 1; S.sickDays = 0; } } catch (e) { } }
    }
  }
  const dogView = () => {
    const s = stt('dog');
    if (s.ch === 0 || s.ch === 3) return C('🐕', 'สุนัขจรจัดในหมู่บ้าน', s.ch === 3 ? 'จัดการเสร็จแล้ว' : 'ตอนนี้ไม่มีปัญหา', '');
    if (s.ch === 2) return C('🐕', 'กำลังฉีดวัคซีนและทำหมัน', `เสร็จ${RD(s.fin)}`, '');
    return C('🐕', 'สุนัขจรจัดกัดคน', `ต้องจัดการภายใน${RD(s.due)} ไม่งั้นเกิดเหตุซ้ำ`,
      B('dvax', '💉 วัคซีน+ทำหมันทั้งหมู่บ้าน (12,000)', { ghost: 1 }) + B('dvol', '🤲 อาสาจับสุนัขเข้าศูนย์พักพิง (พลังงาน 20)', { dis: s.vol >= 2, ghost: 1 }));
  };

  // ================= actions =================
  const A = {};
  A.fjoin = key => { const s = stt(key); if (s.ch !== 1 || s.role) return; s.role = pick(['เหรัญญิก', 'ฝ่ายประชาสัมพันธ์', 'ฝ่ายอาหาร', 'ฝ่ายสถานที่']); fr(some(2), 0.2); rep(1, 'เป็นกรรมการจัดงานบุญ'); UI.toast(`เป็นกรรมการฝ่าย${s.role === 'เหรัญญิก' ? 'การเงิน' : s.role.replace('ฝ่าย', '')}`, '🙋'); };
  A.fdon = (key, v) => { v = +v; const s = stt(key); if (s.ch !== 1 || !pay(v, 'บริจาคงานบุญ')) return; s.raised += v; s.mine += v; rep(v / 20000, 'บริจาคงานบุญ'); mood(3); UI.toast(`บริจาค ${baht(v)}`, '🙏'); };
  A.fwalk = key => { const s = stt(key); if (s.ch !== 1 || s.walked === S.day || !useEnergy(15)) return; s.walked = S.day; UI.close(); fade(() => { tick(60); const g = Math.round(rnd(3000, 8000) * (V().rep / 60 + 0.5)); s.raised += g; fr(some(3), 0.2); UI.toast(`เดินรับบริจาคได้ ${baht(g)}`, '🚶'); saveGame(true); setTimeout(open, 650); }); };
  A.fentry = key => {
    const s = stt(key); if (s.ch !== 1 || s.entry) return;
    const ids = Object.keys(S.inv || {}).filter(id => ITEMS[id] && ITEMS[id].cat === 'crop' && (S.inv[id] || 0) > 0).sort((a, b) => priceOf(b) - priceOf(a));
    if (!ids.length) { UI.toast('ไม่มีผลผลิตในกระเป๋าให้ส่งประกวด', '🧺'); return; }
    const id = ids[0]; takeItem(id, 1); s.entry = { id, score: Math.round(priceOf(id) * rnd(0.9, 1.5)) }; UI.toast(`ส่ง ${ITEMS[id].n} เข้าประกวด`, '🧺');
  };
  A.fatt = key => {
    const F = FEST[key], s = stt(key); if (s.att || S.day !== s.date || !inWin(8, 17)) { UI.toast('วันงานคือ ' + dtxt(s.date) + ' 08:00-17:00', F.i); return; }
    UI.close(); fade(() => {
      tick(180); s.att = 1; mood(10); fr(some(5), 0.3);
      if (key === 'kathin') { rep(2, 'ร่วมงานทอดกฐิน'); UI.toast('ร่วมทอดกฐิน ได้บุญและความสบายใจ', '🙏'); }
      else {
        if (s.entry && !s.entry.done) { const rivals = Array.from({ length: 6 }, () => Math.round(rnd(20, 80) * (1 + (S.lvl || 1) * 0.03))); const rank = 1 + rivals.filter(x => x > s.entry.score).length; s.entry.done = 1; s.entry.rank = rank; const prize = [0, 3000, 1500, 800][rank] || 0; if (prize) gain(prize, 'รางวัลประกวดผลผลิต'); rep(rank === 1 ? 4 : rank <= 3 ? 2 : 0.5, 'ประกวดผลผลิต'); UI.toast(rank <= 3 ? `ได้รางวัลที่ ${rank} ${baht(prize)}` : 'ไม่ได้รางวัล แต่สนุกมาก', '🏅'); }
        else UI.toast('ไปร่วมงานเกี่ยวข้าว ได้ชิมของอร่อยและพบเพื่อนบ้าน', '🌾');
        gain(Math.round(rnd(800, 2500)), 'ขายอาหารที่ซุ้มในงาน');
      }
      saveGame(true); setTimeout(open, 650);
    });
  };
  A.mvote = k => { const m = stt('meet'), e = elect(); if (!m.ag || !m.ag.includes(k) || m.done) return; if (e && e.office === 'village') { m.voted = k; resolveMeet(); UI.toast('ตัดสินใจวาระแล้ว', '🏛️'); return; } if (!(cyc() === 10 && inWin(18, 21))) { UI.toast('โหวตได้ 18:00-21:00 ของวันที่ 10', '🏛️'); return; } m.voted = k; UI.toast('ลงมติแล้ว ผลสรุปวันที่ 11', '🗳️'); };
  A.mspeak = k => { const m = stt('meet'); if (m.spoke || !(cyc() === 10 && inWin(18, 21)) || !useEnergy(10)) return; m.spoke = k; mood(2); rep(0.5, 'อภิปรายในที่ประชุม'); UI.toast('อภิปรายสนับสนุน เพื่อนบ้านฟังอยู่', '🎤'); };
  A.mtop = x => { const m = stt('meet'); x = +x; if (!m.pend || !pay(x, 'สมทบกองทุนหมู่บ้าน')) return; const v = V(); v.fund += x; rep(x / 30000, 'สมทบกองทุนหมู่บ้าน'); const cost = PROJ[m.pend][2]; if (v.fund >= cost) { v.fund -= cost; setProj(m.pend); rep(3, `เสร็จ ${PROJ[m.pend][1]}`); msg('ผู้ใหญ่บ้าน', `${PROJ[m.pend][1]} เริ่มดำเนินการแล้ว ขอบคุณที่ช่วยสมทบ`, false); m.pend = ''; } else UI.toast(`สมทบแล้ว ยังขาดอีก ${baht(cost - v.fund)}`, '🏛️'); };
  A.wwell = x => { x = +x; const s = stt('water'), v = V(); if (s.ch !== 1 || !pay(x, 'สมทบบ่อบาดาลสาธารณะ')) return; const total = x + Math.min(v.fund, 150000 - x); if (total >= 150000) { v.fund -= Math.max(0, 150000 - x); v.flags.well = S.day; s.ch = 3; rep(10, 'บ่อบาดาลสาธารณะ'); fr(some(5), 0.3); msg('ผู้ใหญ่บ้าน', '🚰 เจาะบ่อบาดาลสาธารณะเสร็จ ทุกบ้านมีน้ำใช้แม้หน้าแล้ง', false); } else { v.fund += x; rep(1, 'สมทบบ่อบาดาล'); UI.toast(`สมทบแล้ว เงินยังไม่ครบ 150,000 (กองทุนมี ${baht(v.fund)})`, '🚰'); } };
  A.wpet = () => { const s = stt('water'); if (s.ch !== 1 || s.pet || s.failed || !hasDoc(['idcard', 'housereg'])) return; s.pet = S.day + 14; UI.toast('ยื่นหนังสือร้องเรียนแล้ว รอผล 14 วัน', '📨'); };
  A.wtank = () => { const s = stt('water'); if (s.ch !== 1 || !pay(10000, 'แจกถังน้ำชาวบ้าน')) return; s.tank = S.day + 28; rep(2, 'แจกถังน้ำให้ชาวบ้าน'); fr(some(4), 0.15); UI.toast('แจกถังน้ำแล้ว ชาวบ้านบรรเทาทุกข์ 4 สัปดาห์', '🛢️'); };
  A.bwalk = () => { const s = stt('bound'); if (s.ch !== 1 || s.tried || !useEnergy(10)) return; s.tried = 1; UI.close(); fade(() => { tick(60); const right = Math.random() < 0.7 ? s.truth : (s.truth === 'a' ? 'b' : 'a'); s.clue = `ดูร่องรอยหลักเขตแล้ว น่าจะเป็น ${right === 'a' ? s.a : s.b} ที่ถูก (ความมั่นใจ 70%)`; saveGame(true); setTimeout(open, 650); }); };
  A.bsurvey = () => { const s = stt('bound'); if (s.ch !== 1 || s.surveyDue || !hasDoc(['idcard']) || !pay(3500, 'ค่ารังวัดที่ดินช่วยเพื่อนบ้าน')) return; s.surveyDue = S.day + 3; UI.toast('ขอรังวัดแล้ว รอผล 3 วัน', '📐'); };
  A.bside = w => { const s = stt('bound'); if (s.ch < 1) return; const right = w === s.truth; const win = w === 'a' ? s.a : s.b, lose = w === 'a' ? s.b : s.a; if (right) { fr([win], 1); fr([lose], -0.5); rep(3, 'ตัดสินข้อพิพาทที่ดินถูกต้อง'); msg(win, 'ขอบคุณมากที่ช่วยยืนยันความถูกต้อง', false); } else { fr([win], 0.3); fr([lose], -1.2); rep(-2, 'ตัดสินข้อพิพาทที่ดินผิดฝ่าย'); msg(lose, `ผมเป็นฝ่ายถูกแต่คุณกลับเข้าข้าง ${win}…`, false); } log(`ตัดสินข้อพิพาท ${s.a}-${s.b}: ${right ? 'ถูก' : 'ผิด'}`); s.ch = 0; };
  A.bcomp = () => { const s = stt('bound'); if (s.ch < 1) return; const k = (Friends.get(s.a) + Friends.get(s.b)) / 20; if (Math.random() < clamp(0.45 + k, 0.2, 0.85)) { fr([s.a, s.b], 0.5); rep(4, 'ไกล่เกลี่ยเพื่อนบ้านสำเร็จ'); msg('ผู้ใหญ่บ้าน', `${s.a} กับ ${s.b} ตกลงแบ่งแนวเขตคนละครึ่งแล้ว ขอบคุณที่ช่วย`, false); s.ch = 0; log('ไกล่เกลี่ยสำเร็จ'); } else { fr([s.a, s.b], -0.2); UI.toast('ทั้งสองฝ่ายยังไม่ยอมแบ่งครึ่ง', '🤝'); } };
  A.bcourt = () => { const s = stt('bound'); if (s.ch < 1) return; rep(-1, 'ปัดข้อพิพาทไปที่ศาล'); log('ข้อพิพาทไปสู่ศาล'); s.ch = 0; UI.toast('แนะนำให้ไปใช้ศาลแล้ว', '⚖️'); };
  A.edebate = () => {
    const s = stt('elect'), e = elect(), d = cyc(); if (d < 15 || d > 20 || s.debated === S.day || !useEnergy(10)) return; s.debated = S.day;
    UI.close(); fade(() => { tick(90); if (e && e.cand) { const open = ['road', 'water', 'lights'].filter(k => !built(k)); const iss = pick(open.length ? open : Object.keys(ISSUES)); const g = open.includes(iss) ? 6 : 3; e.support += g; UI.toast(`ดีพลอยนโยบาย${ISSUES[iss]} คะแนนนิยม +${g}`, '🎤'); } else { s.heard = 1; UI.toast(`ฟังดีเบต: ${s.A} เน้น${ISSUES[s.sa]} · ${s.B} เน้น${ISSUES[s.sb]}`, '👂'); } saveGame(true); setTimeout(open, 650); });
  };
  A.evisit = () => { const s = stt('elect'), e = elect(); if (!(e && e.cand) || s.visited === S.day || !useEnergy(10)) return; s.visited = S.day; UI.close(); fade(() => { tick(90); e.support += 2; fr(some(5), 0.1); UI.toast('เยี่ยมบ้าน 5 หลัง คะแนนนิยม +2', '🏠'); saveGame(true); setTimeout(open, 650); }); };
  A.evote = w => { const s = stt('elect'); if (!s.A || s.voted || cyc() !== 21 || !inWin(8, 17)) { UI.toast('เปิดหีบวันที่ 21 ของรอบ 08:00-17:00', '🗳️'); return; } if (!hasDoc(['idcard', 'housereg'])) return; s.voted = w; rep(0.5, 'ใช้สิทธิเลือกตั้ง'); mood(3); UI.toast('ลงคะแนนเรียบร้อย นิ้วชุบหมึกแล้ว', '🗳️'); };
  A.rdon = x => { x = +x; const s = stt('road'); if (s.ch !== 1 || !pay(x, 'บริจาคซ่อมถนนหมู่บ้าน')) return; s.raised += x; rep(x / 20000, 'บริจาคซ่อมถนน'); UI.toast(`บริจาค ${baht(x)}`, '🛣️'); };
  A.rfund = () => { const s = stt('road'), v = V(); if (s.ch !== 1) return; const t = Math.min(v.fund, s.need - s.raised); if (t <= 0) return; v.fund -= t; s.raised += t; UI.toast(`ใช้กองทุน ${baht(t)}`, '🛣️'); };
  A.rpet = () => { const s = stt('road'); if (s.ch !== 1 || s.pet || s.failed || !hasDoc(['idcard'])) return; s.pet = S.day + 10; UI.toast('ยื่นขอสนับสนุนจาก อบต. รอผล 10 วัน', '📨'); };
  A.dvax = () => { const s = stt('dog'); if (s.ch !== 1 || !hasDoc(['idcard']) || !pay(12000, 'วัคซีนพิษสุนัขบ้าและทำหมันสุนัขจรจัด')) return; s.ch = 2; s.fin = S.day + 7; UI.toast('ปศุสัตว์อำเภอรับเรื่อง ดำเนินการ 7 วัน', '💉'); };
  A.dvol = () => { const s = stt('dog'); if (s.ch !== 1 || s.vol >= 2 || !useEnergy(20)) return; s.vol++; UI.close(); fade(() => { tick(180); s.due += 5; rep(2, 'อาสาจับสุนัขจรจัด'); fr(some(3), 0.2); UI.toast('จับสุนัขเข้าศูนย์พักพิงได้หลายตัว', '🤲'); saveGame(true); setTimeout(open, 650); }); };

  // ================= reputation: prices, gifts, gossip =================
  function repDaily() {
    const v = V(); v.rep += (50 - v.rep) * 0.01;                      // memories fade slowly toward neutral
    if (v.rep >= 70 && Math.random() < 0.16) { const n = pick(vill().length ? vill() : ['เพื่อนบ้าน']), g = pick(['carrot', 'tomato', 'cabbage', 'egg', 'milk'].filter(id => ITEMS[id])); if (g) { addItem(g, 2); msg(n, `เอา${ITEMS[g].n}มาฝาก 2 ชิ้น ขอบคุณที่ช่วยหมู่บ้านนะ`, true); } fr(some(2), 0.05); }
    if (v.rep < 30 && Math.random() < 0.15) { const n = pick(vill().length ? vill() : ['ชาวบ้าน']); msg(n, `ได้ยินชาวบ้านซุบซิบเรื่องคุณ… ระวังตัวหน่อยนะ`, true); fr([n], -0.1); }
  }
  if (typeof priceMult === 'function') { const _pm = priceMult; priceMult = function (id) { const r = _pm.apply(this, arguments); try { const it = ITEMS[id]; if (it && it.cat === 'crop' && S.v31v) return r * (1 + (S.v31v.rep - 50) / 500); } catch (e) { } return r; }; }
  if (typeof Water !== 'undefined' && Water.pressureOK) { const _pO = Water.pressureOK.bind(Water); Water.pressureOK = function () { return _pO() || !!(S.v31v && S.v31v.flags && S.v31v.flags.well); }; }

  function daily() {
    for (const f of [() => festTick('kathin'), () => festTick('harvest'), meetTick, waterTick, boundTick, electTick, roadTick, dogTick, repDaily]) { try { f(); } catch (e) { console.warn('v31 village daily', e); } }
  }

  // ================= phone app =================
  const hub = { tab: 0 };
  const B = (act, label, o) => `<button class="btn ${o && o.ghost ? 'ghost' : ''}" data-a="v31v" data-v="${esc(act)}"${o && o.dis ? ' disabled' : ''}>${label}</button>`;
  const C = (i, h, p, btns) => `<div class="card"><div class="ci">${i}</div><div class="cb"><h4>${h}</h4><p class="dim">${p}</p>${btns ? `<div class="row">${btns}</div>` : ''}</div></div>`;
  function render(t) {
    hub.tab = t; const v = V();
    if (t === 0) return `<p class="lead">🏘️ เหตุการณ์ในหมู่บ้านดำเนินต่อเนื่องหลายวัน ตัดสินใจแล้วเห็นผลจริง · ชื่อเสียงของคุณ ${Math.round(v.rep)}/100 (${repLabel(v.rep)})</p><div class="grid">${[festView('kathin'), festView('harvest'), waterView(), boundView(), roadView(), dogView()].join('')}</div>`;
    if (t === 1) return `<p class="lead">ประชุมหมู่บ้านและเลือกตั้งผู้ใหญ่บ้าน · เลือกตั้งตรงกับวันอาทิตย์เสมอ · เกี่ยวกับแอป 🗳️ เลือกตั้ง (ลงสมัครผู้ใหญ่บ้านได้ที่นั่น)</p><div class="grid">${meetView()}${electView()}</div>`;
    const lv = [[85, 'ผู้ที่ทุกคนเคารพ'], [70, 'คนดีของหมู่บ้าน'], [55, 'เพื่อนบ้านที่ดี'], [40, 'คนธรรมดา'], [25, 'ถูกซุบซิบ'], [0, 'คนไม่น่าไว้ใจ']];
    return `<p class="lead">⭐ ชื่อเสียงในหมู่บ้าน: <b>${Math.round(v.rep)}/100</b> — ${repLabel(v.rep)} · ราคาขายผลผลิต ${v.rep >= 50 ? '+' : ''}${Math.round((v.rep - 50) / 5 * 10) / 10}% จากชื่อเสียง</p>
      <div class="grid">${C('💰', 'กองทุนหมู่บ้าน', `${baht(v.fund)} (เพิ่ม 12,000/เดือน ใช้ในมติประชุมและโครงการซ่อมถนน)`, '')}${v.pledge ? C('📜', 'คำสัญญาผู้ใหญ่บ้านคนใหม่', `${esc(v.pledge.who)} สัญญาดูแลเรื่อง${ISSUES[v.pledge.iss]} (งบ ${baht(v.pledge.amt)} เข้ากองทุนแล้ว)`, '') : ''}${C('🏛️', 'ผลต่อชีวิต', 'ชื่อเสียง ≥70: เพื่อนบ้านเอาผักผลไม้มาฝาก · ต่ำกว่า 30: ถูกซุบซิบ ความสนิทลด · ผลิตผลขายได้ราคา ±10%', '')}</div>
      <h5>เกณฑ์ระดับ</h5><ul>${lv.map(([n, l]) => `<li>${n}+ ${l}</li>`).join('')}</ul>
      <h5>บันทึกเหตุการณ์</h5>${v.hist.length ? `<ul>${v.hist.slice(0, 15).map(q => `<li>${RD(q.d)}: ${esc(q.t)}</li>`).join('')}</ul>` : '<p class="dim">ยังไม่มีเหตุการณ์</p>'}`;
  }
  UI.H.v31v = d => { const [k, ...r] = String(d.v || '').split('|'); const f = A[k]; if (f) { try { f(...r); } catch (e) { if (e && e.spend173) throw e; console.warn('v31v', k, e); } } try { UI.renderBody(); } catch (e) { } };
  const TABS = ['📖 เรื่องราวหมู่บ้าน', '🗳️ ประชุม & เลือกตั้ง', '⭐ ชื่อเสียง & กองทุน'];
  const open = () => UI.open('🏘️ หมู่บ้านของเรา', TABS, render, { tab: hub.tab, wide: true });
  { const id = 'village31', i = '🏘️', n = 'หมู่บ้านของเรา';
    if (!APPS.some(a => a.id === id)) APPS.splice(Math.min(APPS.length, 13), 0, { id, i, n });
    Phone.apps[id] = () => { setTimeout(() => { Phone.app = null; UI.close(); open(); }, 0); return ''; };
    if (typeof APP_GROUPS !== 'undefined') { const gr = APP_GROUPS.find(x => /บริการ/.test(x[0])) || APP_GROUPS[APP_GROUPS.length - 1]; if (gr && !gr[1].includes(id)) gr[1].unshift(id); } }
  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { daily(); } catch (e) { console.warn('v31 village daily', e); } return r; }; }
  window.Village31 = { open, V, rep, daily, A, stt };
});
