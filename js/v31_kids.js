'use strict';
// ---------- v31_kids: children's education on top of Civic's village school (levels, enrolment, bus/lunch/tutor, report cards, scholarships)
// and the Family module (ages, jobs): uniforms, conduct & attendance, homework and parent help, child illness, school calendar & events
// (Cal24 holidays, half-year breaks), clubs, private school, ม.1 entrance exam, ม.ปลาย strand, TCAS university admission (portfolio / quota /
// admission / direct rounds, central exam, scholarships), tuition from the education fund (v26 will & estate), graduation.
// Phone app "🎒 การศึกษาลูก". A child's age follows Civic.yrs (84 game days to adulthood). ----------
V23.add('v31_kids', () => {
  const DEF = () => ({ kd: {}, ev: {}, lastDay: 0, nid: 1, log: [] });
  const K = () => { const x = S.v31k = S.v31k || {}; const d = DEF(); for (const k in d) if (x[k] === undefined || x[k] === null) x[k] = d[k]; return x; };
  const msg = (from, t, q) => { try { Phone.msg(from, t, q); } catch (e) { } };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const hrOf = () => S.time / 60;
  const holiday = (d = S.day) => !!(window.Cal24 && typeof Cal24.isHoliday === 'function' && Cal24.isHoliday(d));
  const wd = (d = S.day) => (d - 1) % 7 < 5;
  const pay = (n, label) => { n = Math.round(+n) || 0; if (n > 0 && S.money < n) { UI.toast(`เงินไม่พอ ต้องใช้ ${baht(n)}`, '💸'); return false; } if (n > 0) { S.money -= n; try { Bank2.log(label, -n); } catch (e) { } } return true; };
  const gain = (n, src) => { n = Math.round(+n) || 0; if (n > 0) { earn(n); try { Bank2.income(src, n); } catch (e) { } } };
  const energy = n => { S.energy = clamp(S.energy + n, 0, maxEnergy()); };
  const mood = n => { S.mood = clamp((S.mood ?? 70) + n, 0, 100); };
  const spend = (mins, fn) => { UI.close(); fade(() => { try { tick(mins); } catch (e) { console.warn('v31k tick', e); } try { fn(); } catch (e) { console.warn('v31k', e); } try { saveGame(true); } catch (e) { } setTimeout(() => hubOpen(), 650); }); };
  const kids = () => { try { return Social.st().kids || []; } catch (e) { return []; } };
  const key = k => k.uid != null ? 'u' + k.uid : 'n' + k.name;
  const byKey = id => kids().find(k => key(k) === id);
  const yrs = k => { try { return Civic.yrs(k); } catch (e) { return Math.max(0, S.day - (+k.born || S.day)) * 22 / 84; } };
  const dd = k => Math.max(0, S.day - (+k.born || S.day));
  const lvl = k => { try { return Civic.level(k); } catch (e) { return null; } };
  const grade = k => { try { return Civic.gradeName(k); } catch (e) { return ''; } };
  const enrolled = k => { try { return Civic.enrolled(k); } catch (e) { return false; } };
  const ee = k => { try { return Civic.kst(k) || {}; } catch (e) { return {}; } };
  const half = () => (S.day - 1) % 42;
  const brk = () => half() >= 35;
  const schoolDay = () => wd() && !holiday() && !brk();
  const LV = { ecd: 'ศูนย์เด็กเล็ก', k: 'อนุบาล', p: 'ประถม', m: 'มัธยมต้น', hs: 'มัธยมปลาย', voc: 'ปวช.' };
  function D(k) {
    const x = K(), id = key(k);
    const def = { unif: 0, club: '', cp: 0, cond: 85, att: 0, abs: 0, hw: 0, hwBad: 0, sick: null, priv: 0, elite: 0, eliteTry: 0, prep: 0, prepDay: -9, strand: '', exam: 0, examReg: 0, rounds: [], conf: '', fac: '', sch: 0, tui: 0, tuiPaid: 0, ut: 0, grad: 0, gpaN: 0, lvl: '', letter: 0, spent: 0, meet: 0, camp: 0, award: 0 };
    const cur = x.kd[id] || (x.kd[id] = {}); for (const q in def) if (cur[q] === undefined) cur[q] = def[q]; return cur;
  }
  const gpax = k => { const g = (ee(k).gpas || []).slice(-6); return g.length ? g.reduce((a, b) => a + b, 0) / g.length : 2.6; };
  const log = t => { const x = K(); x.log.unshift({ d: S.day, t }); if (x.log.length > 12) x.log.length = 12; };

  // ================= data =================
  const CLUB = { music: ['ดนตรี', '🎻'], sport: ['กีฬา', '⚽'], art: ['ศิลปะ', '🎨'], scout: ['ลูกเสือ-เนตรนารี', '⛺'], sci: ['วิทยาศาสตร์', '🔬'] };
  const FAC = { med: ['แพทยศาสตร์', '🩺', 60000, 0.85, 'med', 1], vet: ['สัตวแพทยศาสตร์', '🐄', 40000, 0.78, 'other', 1], nurse: ['พยาบาลศาสตร์', '💉', 28000, 0.70, 'other', 1], engr: ['วิศวกรรมศาสตร์', '⚙️', 30000, 0.68, 'eng', 1], law: ['นิติศาสตร์', '⚖️', 15000, 0.62, 'other', 0], cs: ['วิทยาการคอมพิวเตอร์', '💻', 24000, 0.60, 'other', 1], edu: ['ครุศาสตร์', '📚', 14000, 0.50, 'other', 0], biz: ['บริหารธุรกิจ', '📊', 16000, 0.46, 'other', 0], agri: ['เกษตรศาสตร์', '🌾', 14000, 0.42, 'agri', 1] };
  const RND = { 1: ['รอบ 1 พอร์ตโฟลิโอ', 61, 63, 0.03], 2: ['รอบ 2 โควตา', 63, 66, 0.02], 3: ['รอบ 3 แอดมิชชัน', 65, 68, 0], 4: ['รอบ 4 รับตรงอิสระ', 68, 72, -0.05] };
  const EVN = { teacher: [5, 'ไหว้ครู', '🌸'], sport: [20, 'กีฬาสี', '🏅'], trip: [28, 'ทัศนศึกษา', '🚌'] };

  // ================= scores =================
  const gN = k => clamp(gpax(k) / 4, 0, 1);
  const portf = k => { const d = D(k); return clamp(d.cp / 24 + d.award * 0.12, 0, 1); };
  function scoreFor(k, r) {
    const d = D(k), g = gN(k), c = d.cond / 100, e = d.exam || 0.4, p = portf(k);
    return r === 1 ? 0.5 * p + 0.4 * g + 0.1 * c : r === 2 ? 0.55 * g + 0.25 * c + 0.2 * p : r === 3 ? 0.4 * g + 0.5 * e + 0.1 * p : 0.3 * g + 0.45 * e + 0.15 * p + 0.1 * c;
  }
  function eligible(k, f, r) {
    const d = D(k), F = FAC[f], voc = ee(k).track === 'voc', strand = d.strand || (gpax(k) >= 3 ? 'sci' : 'art');
    if (F[5] && strand !== 'sci') return 'ต้องจบสายวิทย์-คณิต';
    if (voc && ['med', 'vet', 'nurse', 'law'].includes(f)) return 'ผู้จบ ปวช. สมัครคณะนี้ไม่ได้';
    if (r === 2 && gpax(k) < 3.25) return 'โควตาต้องเกรดเฉลี่ย ≥ 3.25';
    if (r === 3 && !d.examReg) return 'ต้องสมัครสอบกลางก่อน';
    return '';
  }

  // ================= child sickness & parent actions =================
  function sickDaily(k, d) {
    if (d.sick && S.day > d.sick.until) { d.sick = null; msg('สุขภาพลูก', `${k.name}หายป่วยแล้ว กลับไปโรงเรียนได้`); }
    if (!d.sick && yrs(k) >= 1) {
      const se = season().id, p = 0.0015 * (se === 'rain' ? 1.8 : se === 'cool' ? 1.5 : 1) * (yrs(k) < 6 ? 1.5 : 1);
      if (Math.random() < p) { const why = pick(['ไข้หวัด', 'เจ็บคอมีไข้', 'ท้องเสีย', 'ไข้หวัดใหญ่']); d.sick = { until: S.day + 2 + Math.floor(Math.random() * 3), why, seen: 0 }; msg('สุขภาพลูก', `🤒 ${k.name} ${why} ต้องหยุดเรียน พาไปคลินิกหรือดูแลที่บ้านได้ในแอป 🎒 การศึกษาลูก`, true); log(`${k.name} ป่วย ${why}`); }
    }
  }
  const pick = a => a[Math.floor(Math.random() * a.length)];
  function doctor(id) {
    const k = byKey(id), d = k && D(k); if (!d || !d.sick || d.sick.seen) return; const hr = hrOf(); if (hr < 9 || hr >= 20) { UI.toast('คลินิกปิด (เปิด 09:00–20:00)', '🕒'); return; }
    if (!pay(450, `พา${k.name}ไปคลินิกเด็ก`)) return; try { if (window.Health31 && Health31.bill) Health31.bill(`คลินิกเด็ก ${k.name}`, 450, 'opd'); } catch (e) { }
    spend(60, () => { d.sick.seen = 1; d.sick.until = Math.max(S.day, d.sick.until - 1); mood(1); UI.toast(`คุณหมอตรวจ${k.name}และให้ยา หายเร็วขึ้น`, '🩺'); });
  }
  function careHome(id) { const k = byKey(id), d = k && D(k); if (!d || !d.sick || d.sick.care === S.day) return; if (!(S.energy >= 10)) { UI.toast('คุณเหนื่อยเกินไป', 'ℹ️'); return; } spend(120, () => { d.sick.care = S.day; energy(-10); k.joy = clamp((k.joy ?? 60) + 6, 0, 100); UI.toast(`ดูแล${k.name}ที่บ้าน ลูกอุ่นใจ`, '🤗'); }); }
  function helpHw(id) { const k = byKey(id), d = k && D(k); if (!d || d.hw <= 0) { UI.toast('ไม่มีการบ้านค้าง', 'ℹ️'); return; } if (S.energy < 8) { UI.toast('พลังงานไม่พอ', 'ℹ️'); return; } spend(45, () => { energy(-8); d.hw = Math.max(0, d.hw - 2); d.hwBad = Math.max(0, d.hwBad - 1); k.joy = clamp((k.joy ?? 60) + 4, 0, 100); k.edu = (k.edu || 0) + 1; UI.toast(`ช่วย${k.name}ทำการบ้าน เหลือ ${d.hw} ชิ้น`, '✏️'); }); }
  function story(id) { const k = byKey(id), d = k && D(k); if (!d || d.storyDay === S.day) { UI.toast('วันนี้อ่านนิทานไปแล้ว', 'ℹ️'); return; } spend(30, () => { d.storyDay = S.day; k.joy = clamp((k.joy ?? 60) + 5, 0, 100); k.skill = Math.min(10, (k.skill || 0) + 0.3); UI.toast(`อ่านนิทานให้${k.name}ฟัง`, '📖'); }); }
  function teacher(id) { const k = byKey(id), d = k && D(k); if (!d || d.cond >= 70 && !d.letter) { UI.toast('ไม่มีเรื่องต้องพบครู', 'ℹ️'); return; } if (!wd() || hrOf() < 9 || hrOf() >= 15) { UI.toast('พบครูได้ จ-ศ 09:00–15:00', '🕒'); return; } spend(60, () => { d.cond = clamp(d.cond + 15, 0, 100); d.letter = 0; UI.toast(`คุยกับครูประจำชั้นเรื่อง${k.name} พฤติกรรมดีขึ้น`, '👩‍🏫'); }); }

  // ================= school life =================
  function buyUniform(id) { const k = byKey(id), d = k && D(k); if (!d) return; if (!pay(1200, `ชุดนักเรียน/พละ/ลูกเสือ ${k.name}`)) return; d.unif += 3; d.spent += 1200; UI.toast(`ซื้อชุดนักเรียน 3 ชุดให้${k.name}`, '👕'); }
  function setClub(id, c) { const k = byKey(id), d = k && D(k); if (!d || !CLUB[c] || yrs(k) < 6) { UI.toast('ชมรมสำหรับชั้น ป.1 ขึ้นไป', 'ℹ️'); return; } if (d.club === c) { d.club = ''; UI.toast('ออกจากชมรมแล้ว', 'ℹ️'); return; } if (!pay(300, `ค่าสมัครชมรม${CLUB[c][0]} ${k.name}`)) return; d.club = c; d.spent += 300; UI.toast(`${k.name}เข้าชมรม${CLUB[c][0]}`, CLUB[c][1]); }
  function schoolType(id, t) {
    const k = byKey(id), d = k && D(k); if (!d) return; const l = lvl(k); if (!l || l === 'done' || l === 'hs?') { UI.toast('ยังไม่อยู่ในวัยเข้าเรียน', 'ℹ️'); return; }
    if (t === 'priv') { if (d.priv) { d.priv = 0; UI.toast(`ย้าย${k.name}กลับโรงเรียนรัฐ`, '🏫'); return; } const fee = { ecd: 4000, k: 6000, p: 12000, m: 15000, hs: 18000, voc: 15000 }[l] || 12000; if (!pay(fee, `ค่าแรกเข้าโรงเรียนเอกชน ${k.name}`)) return; d.priv = 1; d.spent += fee; try { if (!enrolled(k)) Civic.enrol(k.name); } catch (e) { } UI.toast(`${k.name}เรียนโรงเรียนเอกชน (ค่าเทอมทุกเทอม)`, '🏫'); }
  }
  function enrolKid(id) { const k = byKey(id); if (k) try { Civic.enrol(k.name); } catch (e) { console.warn(e); } }
  function strand(id, s) { const k = byKey(id), d = k && D(k); if (!d || lvl(k) !== 'hs') { UI.toast('เลือกสายการเรียนได้เมื่อเรียน ม.ปลาย', 'ℹ️'); return; } d.strand = s; UI.toast(`${k.name}เลือกสาย${s === 'sci' ? 'วิทย์-คณิต (เข้าได้ทุกคณะ)' : 'ศิลป์ (สมัครคณะสายวิทย์ไม่ได้)'}`, '📘'); }
  function evAct(id, ev) {
    const k = byKey(id), d = k && D(k); if (!d) return; const x = K(), ek = `${key(k)}:${ev}:${Math.floor((S.day - 1) / 42)}`; if (x.ev[ek]) return;
    const E = EVN[ev]; if (half() !== E[0]) { UI.toast(`ยังไม่ถึงวัน${E[1]}`, 'ℹ️'); return; }
    const cost = ev === 'teacher' ? 200 : ev === 'trip' ? 350 : 0; if (!pay(cost, `${E[1]} ${k.name}`)) return;
    spend(ev === 'sport' ? 180 : 60, () => { x.ev[ek] = 1; k.joy = clamp((k.joy ?? 60) + (ev === 'sport' ? 8 : 5), 0, 100); d.cond = clamp(d.cond + 2, 0, 100); if (ev === 'trip') k.edu = (k.edu || 0) + 1; if (ev === 'sport') { energy(-10); d.cp += d.club === 'sport' ? 2 : 0.5; } UI.toast(`${E[2]} ${E[1]} ${k.name}: ร่วมกิจกรรมกับลูก`, E[2]); d.spent += cost; });
  }
  function camp(id) { const k = byKey(id), d = k && D(k); if (!d || !brk() || d.camp === Math.floor((S.day - 1) / 42)) { UI.toast('ค่ายปิดเทอมจัดช่วงปิดเทอมเท่านั้น (ครั้งเดียวต่อช่วง)', 'ℹ️'); return; } if (!pay(1500, `ค่ายปิดเทอม ${k.name}`)) return; d.camp = Math.floor((S.day - 1) / 42); d.spent += 1500; k.skill = Math.min(10, (k.skill || 0) + 1); k.joy = clamp((k.joy ?? 60) + 10, 0, 100); d.cp += 3; UI.toast(`${k.name}ไปค่ายปิดเทอม ได้ทักษะและเพื่อนใหม่`, '🏕️'); }

  // ================= entrance exams =================
  function cram(id, what) {
    const k = byKey(id), d = k && D(k); if (!d) return; if (S.day - d.prepDay < 3) { UI.toast('เพิ่งติวไป พักก่อน 3 วัน', 'ℹ️'); return; }
    const fee = what === 'tcas' ? 4000 : 2500; if (!pay(fee, `ค่าเรียนกวดวิชา ${k.name}`)) return; d.spent += fee;
    spend(120, () => { d.prep = Math.min(45, d.prep + 18); d.prepDay = S.day; k.joy = clamp((k.joy ?? 60) - 3, 0, 100); UI.toast(`${k.name}เรียนกวดวิชา คะแนนเตรียมสอบ ${d.prep}/45`, '📚'); });
  }
  function elite(id) {
    const k = byKey(id), d = k && D(k); if (!d || d.eliteTry || lvl(k) !== 'p' || yrs(k) < 11) { UI.toast('สอบเข้า ม.1 ได้ตอน ป.6 (ครั้งเดียว)', 'ℹ️'); return; } if (!pay(200, `ค่าสมัครสอบเข้า ม.1 ${k.name}`)) return;
    spend(150, () => { d.eliteTry = 1; const sc = 0.28 + gN(k) * 0.35 + d.prep * 0.011 + rnd(-0.1, 0.1) + (d.priv ? 0.04 : 0); if (sc >= 0.62) { d.elite = 1; k.joy = clamp((k.joy ?? 60) + 15, 0, 100); msg('โรงเรียนประจำจังหวัด', `🎉 ${k.name}สอบเข้า ม.1 โรงเรียนประจำจังหวัดได้! (คะแนน ${(sc * 100).toFixed(0)})`, true); log(`${k.name}สอบเข้าโรงเรียนดังได้`); UI.toast('สอบเข้าโรงเรียนประจำจังหวัดผ่าน!', '🎉'); } else { k.joy = clamp((k.joy ?? 60) - 8, 0, 100); msg('โรงเรียนประจำจังหวัด', `${k.name}สอบไม่ผ่าน (คะแนน ${(sc * 100).toFixed(0)}) เรียนต่อ ม.1 ที่โรงเรียนใกล้บ้านได้`, true); UI.toast('สอบไม่ผ่าน ให้กำลังใจลูกนะ', '😢'); } });
  }
  function examReg(id) { const k = byKey(id), d = k && D(k); if (!d || d.examReg || dd(k) < 58 || dd(k) > 64) { UI.toast('สมัครสอบกลางได้ช่วงก่อนวันสอบของลูก (ม.6)', 'ℹ️'); return; } if (!pay(600, `ค่าสมัครสอบกลาง (TGAT/A-Level) ${k.name}`)) return; d.examReg = 1; d.spent += 600; UI.toast(`สมัครสอบกลางให้${k.name}แล้ว วันสอบ ${(k.born || 0) + 65}`, '📝'); }
  function apply(id, f, r) {
    const k = byKey(id), d = k && D(k); r = +r; if (!d || !FAC[f] || !RND[r]) return; const R = RND[r], t = dd(k);
    if (d.conf) { UI.toast('ยืนยันสิทธิ์คณะหนึ่งแล้ว สมัครรอบอื่นไม่ได้', 'ℹ️'); return; } if (t < R[1] || t > R[2]) { UI.toast(`${R[0]} เปิดรับ${RD((k.born || 0) + R[1])}–${(k.born || 0) + R[2]}`, '🕒'); return; }
    if (d.rounds.some(x => x.r === r && x.f === f)) { UI.toast('สมัครคณะนี้ในรอบนี้ไปแล้ว', 'ℹ️'); return; } const bad = eligible(k, f, r); if (bad) { UI.toast(bad, '⚠️'); return; }
    const fee = r === 1 ? 300 : r === 2 ? 200 : r === 3 ? 400 : 500; if (!pay(fee, `ค่าสมัคร ${R[0]} ${k.name}`)) return; d.spent += fee;
    d.rounds.push({ r, f, st: 'applied', day: S.day }); UI.toast(`สมัคร ${FAC[f][0]} (${R[0]}) แล้ว ประกาศผลพรุ่งนี้`, '📨');
  }
  function confirmSeat(id, f) { const k = byKey(id), d = k && D(k); if (!d || d.conf) return; const x = d.rounds.find(o => o.f === f && o.st === 'pass'); if (!x) return; d.conf = f; x.st = 'conf'; for (const o of d.rounds) if (o.st === 'applied') o.st = 'void'; UI.toast(`ยืนยันสิทธิ์ ${FAC[f][0]} แล้ว!`, '🎓'); log(`${k.name}ยืนยันสิทธิ์ ${FAC[f][0]}`); }
  function admissionDaily(k, d) {
    const t = dd(k);
    if (t >= 65 && !d.exam && d.examReg) { d.exam = clamp(0.25 + gN(k) * 0.3 + d.prep * 0.011 + rnd(-0.08, 0.08), 0.1, 0.98); msg('สทศ.', `📝 ผลสอบกลางของ${k.name}: ${(d.exam * 100).toFixed(0)} คะแนน`, true); }
    if (t >= 65 && !d.exam && !d.examReg) d.exam = 0.3;
    for (const o of d.rounds) if (o.st === 'applied' && S.day > o.day) {
      const F = FAC[o.f], sc = scoreFor(k, o.r) + rnd(-0.03, 0.03), cut = F[3] - RND[o.r][3]; o.sc = sc;
      if (sc >= cut) { o.st = 'pass'; o.exp = S.day + 3; if (gpax(k) >= 3.6 && sc >= cut + 0.1) o.sch = 1; msg('ระบบ TCAS', `🎉 ${k.name}ผ่านการคัดเลือก ${F[0]} (${RND[o.r][0]}) คะแนน ${(sc * 100).toFixed(0)}${o.sch ? ' + ทุนเรียนดี 50%' : ''} · ยืนยันสิทธิ์ภายใน${RD(o.exp)}`, true); }
      else { o.st = 'fail'; msg('ระบบ TCAS', `${k.name}ไม่ผ่านการคัดเลือก ${F[0]} (${RND[o.r][0]}) คะแนน ${(sc * 100).toFixed(0)}/${(cut * 100).toFixed(0)}`, true); k.joy = clamp((k.joy ?? 60) - 6, 0, 100); }
    }
    for (const o of d.rounds) if (o.st === 'pass' && S.day > o.exp && !d.conf) { o.st = 'lapse'; msg('ระบบ TCAS', `สิทธิ์ ${FAC[o.f][0]} ของ${k.name}หมดอายุ เพราะไม่ได้ยืนยันสิทธิ์`, true); }
  }

  // ================= university =================
  const kidFund = k => { try { const f = Life26.L().fam.kids.find(x => x.uid === k.uid); return f || null; } catch (e) { return null; } };
  function termFee(k, d) { const F = FAC[d.conf]; const o = d.rounds.find(x => x.st === 'conf'); return Math.round(F[2] * (o && o.sch ? 0.5 : 1)); }
  function chargeTuition(k, d) {
    const fee = termFee(k, d), fk = kidFund(k); let left = fee, fromFund = 0;
    if (fk && fk.fund > 0) { fromFund = Math.min(fk.fund, left); fk.fund -= fromFund; left -= fromFund; }
    if (left > 0) { if (S.money >= left) { S.money -= left; try { Bank2.log(`ค่าเทอมมหาวิทยาลัย ${k.name}`, -left); } catch (e) { } left = 0; } }
    d.ut++; d.tuiPaid += fee - left;
    if (left > 0) { d.debt = (d.debt || 0) + left; msg('มหาวิทยาลัย', `${k.name}ค้างค่าเทอม ${baht(left)} เงินไม่พอ สถานะนักศึกษาจะถูกพักถ้าค้างเกิน 5 วัน`, true); }
    else msg('มหาวิทยาลัย', `ชำระค่าเทอมที่ ${d.ut} ของ${k.name} คณะ${FAC[d.conf][0]} ${baht(fee)}${fromFund ? ` (จากกองทุนการศึกษา ${baht(fromFund)})` : ''}`, true);
  }
  function payDebt(id) { const k = byKey(id), d = k && D(k); if (!d || !d.debt || !pay(d.debt, `ชำระค่าเทอมค้าง ${k.name}`)) return; d.tuiPaid += d.debt; d.debt = 0; UI.toast('ชำระค่าเทอมค้างแล้ว', '✅'); }
  function uniDaily(k, d) {
    const t = dd(k); if (!d.conf) { if (t >= 72 && !d.noUni) { d.noUni = 1; msg('ครอบครัว', `${k.name}ยังไม่ได้ที่เรียนมหาวิทยาลัย ปีนี้ช่วยงานที่ไร่ก่อน`, true); log(`${k.name}ไม่ได้เข้ามหาวิทยาลัย`); } return; }
    if (t >= 70 && d.ut < 1) { k.uni = FAC[d.conf][4]; chargeTuition(k, d); log(`${k.name}เข้าเรียนคณะ${FAC[d.conf][0]}`); }
    if (t >= 77 && d.ut < 2) chargeTuition(k, d);
    if (d.debt && S.day - (d.debtDay = d.debtDay || S.day) > 5 && !d.susp) { d.susp = 1; delete k.uni; msg('มหาวิทยาลัย', `${k.name}ถูกพักสถานะนักศึกษาเพราะค้างค่าเทอม`, true); }
    if (t >= 84 && !d.grad) {
      d.grad = 1; const g = gpax(k), hon = g >= 3.6 ? 'เกียรตินิยมอันดับ 1' : g >= 3.25 ? 'เกียรตินิยมอันดับ 2' : 'ปริญญาตรี';
      k.edu = (k.edu || 0) + 3; k.degree = FAC[d.conf][0]; msg('มหาวิทยาลัย', `🎓 ${k.name}สำเร็จการศึกษา คณะ${FAC[d.conf][0]} ${hon} (GPAX ${g.toFixed(2)}) ยินดีด้วย!`, true); log(`${k.name}จบ ${FAC[d.conf][0]} ${hon}`); note(`${k.name}จบปริญญาตรี คณะ${FAC[d.conf][0]}`);
    }
  }
  const note = t => { try { Life2.note(t); } catch (e) { } };
  function fundIn(id, amt) { const k = byKey(id), fk = k && kidFund(k); amt = +amt; if (!fk) { UI.toast('ต้องจดแจ้งเกิดและมีข้อมูลครอบครัวก่อน (แอป ชีวิตจริง/ทะเบียนครอบครัว)', 'ℹ️'); return; } if (!pay(amt, `ฝากกองทุนการศึกษา ${k.name}`)) return; fk.fund = (fk.fund || 0) + amt; UI.toast(`ฝากกองทุนการศึกษา ${k.name} ${baht(amt)} (ยอดรวม ${baht(Math.round(fk.fund))})`, '🏦'); }

  // ================= daily =================
  function daily() {
    const x = K(); if (x.lastDay === S.day) return; x.lastDay = S.day;
    const tDay = (S.day - 1) % 14;
    for (const k of kids()) {
      const l = lvl(k), d = D(k); if (!l) continue;
      if (d.lvl !== l) { if (d.lvl && l !== 'done') { d.unif = 0; msg('โรงเรียน', `${k.name}ขึ้น${LV[l] || ''} ต้องซื้อชุดนักเรียนชุดใหม่`, true); } d.lvl = l; }
      const on = enrolled(k), sd = schoolDay(); sickDaily(k, d);
      if (yrs(k) >= 17 && yrs(k) < 22.5) { try { admissionDaily(k, d); uniDaily(k, d); } catch (e) { console.warn('v31k adm', e); } }
      if (!on || l === 'done' || l === 'hs?') continue;
      // private school fee at the start of every term
      if (tDay === 0 && d.priv) { const fee = { ecd: 2500, k: 4500, p: 8000, m: 10000, hs: 12000, voc: 9000 }[l] || 8000; if (S.money >= fee) { S.money -= fee; d.spent += fee; try { Bank2.log(`ค่าเทอมโรงเรียนเอกชน ${k.name}`, -fee); } catch (e) { } msg('โรงเรียนเอกชน', `ค่าเทอม ${k.name} ${baht(fee)} ชำระแล้ว`); } else { d.priv = 0; msg('โรงเรียนเอกชน', `ชำระค่าเทอมไม่ได้ ${k.name}ถูกย้ายกลับโรงเรียนรัฐ`, true); } }
      if (tDay === 0 && d.unif > 0) d.unif--;
      if (sd) {
        const abs = d.sick && S.day <= d.sick.until; d.att++; if (abs) d.abs++;
        if (!abs) {
          if (d.unif <= 0 && yrs(k) >= 3) { d.cond = clamp(d.cond - 1, 0, 100); if (d.noUniMsg !== Math.floor(S.day / 14)) { d.noUniMsg = Math.floor(S.day / 14); msg('ครูประจำชั้น', `${k.name}ไม่มีชุดนักเรียนที่ครบ ครูตักเตือน (ซื้อได้ในแอป 🎒 การศึกษาลูก)`, true); } } else d.cond = clamp(d.cond + 0.15 + (d.club ? 0.1 : 0), 0, 100);
          if (d.club && wd()) { d.cp += 0.25; k.skill = Math.min(10, (k.skill || 0) + 0.02); }
          if (yrs(k) >= 6 && (S.day - 1) % 7 < 4) { d.hw = Math.min(8, d.hw + 1); if (d.hw > 3) { d.hwBad++; d.cond = clamp(d.cond - 0.5, 0, 100); k.joy = clamp((k.joy ?? 60) - 1, 0, 100); } }
          if (yrs(k) >= 9 && Math.random() < 0.04) { d.cond = clamp(d.cond - 6, 0, 100); if (d.cond < 60 && !d.letter) { d.letter = 1; msg('ครูประจำชั้น', `⚠️ ครูขอพบผู้ปกครองเรื่องพฤติกรรมของ${k.name} (พบครู จ-ศ 09:00–15:00)`, true); } }
        }
      }
      // school events
      for (const ev in EVN) if (half() === EVN[ev][0] && !x.ev[`${key(k)}:${ev}:m${Math.floor((S.day - 1) / 42)}`]) { x.ev[`${key(k)}:${ev}:m${Math.floor((S.day - 1) / 42)}`] = 1; msg('โรงเรียน', `${EVN[ev][2]} วันนี้ ${EVN[ev][1]} ของ${k.name} ร่วมกิจกรรมได้ในแอป 🎒 การศึกษาลูก`, true); }
      if (half() === 35) msg('โรงเรียน', `🏖️ ปิดเทอมแล้ว! ถึง${RD(S.day + 6)} (ส่งลูกไปค่ายปิดเทอมได้)`, true);
      // report card nudge from Civic's new GPA
      const e = ee(k), gp = e.gpas || []; if (gp.length && d.gpaN !== gp.length) {
        const first = d.gpaN === 0 && gp.length > 1 ? false : true; d.gpaN = gp.length;
        let adj = (d.priv ? 0.22 : 0) + (d.elite ? 0.2 : 0) + (d.club ? 0.1 : 0) - (d.hw > 3 ? 0.25 : 0) - (d.att && d.abs / d.att > 0.2 ? 0.25 : 0) + (d.cond >= 90 ? 0.08 : d.cond < 60 ? -0.15 : 0) + (d.prep > 20 ? 0.05 : 0);
        const g = clamp(gp[gp.length - 1] + adj, 1, 4); gp[gp.length - 1] = Math.round(g * 100) / 100; e.gpa = gp[gp.length - 1]; d.att = 0; d.abs = 0;
        msg('โรงเรียน', `สมุดพก${k.name}: เกรด ${e.gpa.toFixed(2)} · ความประพฤติ ${Math.round(d.cond)}/100${d.priv ? ' · เอกชน' : ''}${adj < -0.1 ? ' (ขาดเรียน/การบ้านค้างทำให้เกรดลด)' : adj > 0.15 ? ' (ชมรม/โรงเรียนช่วยให้เกรดดี)' : ''}`);
      }
    }
    if (Object.keys(x.ev).length > 90) { const keep = Object.keys(x.ev).slice(-40); x.ev = Object.fromEntries(keep.map(k => [k, 1])); }
  }

  // ================= UI =================
  const B = (act, label, o = {}) => `<button class="btn ${o.ghost ? 'ghost' : ''}" data-a="k31" data-v="${esc(act)}"${o.dis ? ' disabled' : ''}>${label}</button>`;
  const C = (i, t, p, btns = '') => `<div class="card"><div class="ci">${i}</div><div class="cb"><h4>${t}</h4><p class="dim">${p}</p>${btns ? `<div class="row">${btns}</div>` : ''}</div></div>`;
  const GR = x => `<div class="grid">${x}</div>`, H5 = t => `<h5>${t}</h5>`, LEAD = t => `<p class="lead">${t}</p>`, DIM = t => `<p class="dim">${t}</p>`;
  const A = { doctor, care: careHome, hw: helpHw, story, teacher, uniform: buyUniform, club: setClub, stype: schoolType, enrol: enrolKid, strand, ev: evAct, camp, cram, elite, ereg: examReg, apply, conf: confirmSeat, debt: payDebt, fund: fundIn };
  const sel = { t: 0 };
  UI.H.k31 = d => { const [k, ...r] = String(d.v || '').split('|'); const f = A[k]; if (f) { try { f(...r); } catch (e) { if (e && e.spend173) throw e; console.warn('k31', k, e); } } };
  const stat = (k, d) => `อายุ ${yrs(k).toFixed(1)} ปี · ${enrolled(k) ? `${LV[lvl(k)] || ''} ${grade(k)}` : lvl(k) === 'done' ? 'พ้นวัยเรียนภาคบังคับ' : lvl(k) ? '<b class="bad">ยังไม่ได้มอบตัวเข้าเรียน</b>' : 'ยังเล็กอยู่ที่บ้าน'}`;
  const tab0 = () => {
    const L = kids(); if (!L.length) return LEAD('ยังไม่มีลูก — แต่งงานแล้วมีลูก (ทะเบียนครอบครัว) ลูกจะเข้าศูนย์เด็กเล็ก อนุบาล ประถม มัธยม และมหาวิทยาลัยตามวัย') + DIM('ระบบนี้ต่อยอดจากโรงเรียนบ้านสุขใจ (มอบตัว รถรับส่ง อาหารกลางวัน กวดวิชา ทุนเรียนดี) เพิ่ม: ชุดนักเรียน ความประพฤติ การบ้าน ลูกป่วย ชมรม โรงเรียนเอกชน สอบเข้า ม.1 สอบเข้ามหาวิทยาลัย (TCAS) และค่าเทอมจากกองทุนการศึกษา');
    let s = LEAD(`${brk() ? '🏖️ ปิดเทอม' : holiday() ? '🎌 วันหยุดราชการ' : wd() ? '🏫 วันเรียน' : '😴 เสาร์-อาทิตย์'} · ปฏิทินโรงเรียน: ปิดเทอมสัปดาห์สุดท้ายของทุก 6 สัปดาห์ · สอบปลายภาคทุก 2 สัปดาห์ (ดูเกรดในสมุดพก)`);
    for (const k of L) {
      const d = D(k), e = ee(k), id = key(k), gp = (e.gpas || []).slice(-4).map(g => g.toFixed(2)).join(' → ') || '-', l = lvl(k);
      let t = `${stat(k, d)}<br>ความประพฤติ ${Math.round(d.cond)}/100 · การบ้านค้าง ${d.hw} · ชุดนักเรียน ${d.unif} ชุด · ความสุข ${Math.round(k.joy ?? 60)} · เกรด ${gp}${d.club ? ` · ชมรม${CLUB[d.club][0]}` : ''}${d.priv ? ' · 🏫 เอกชน' : ''}${d.elite ? ' · ⭐ รร.ประจำจังหวัด' : ''}`;
      if (d.sick) t += `<br><b class="bad">🤒 ป่วย (${d.sick.why}) หยุดเรียนถึง${RD(d.sick.until)}</b>`;
      if (d.letter) t += '<br><b class="bad">⚠️ ครูขอพบผู้ปกครอง</b>';
      if (d.debt) t += `<br><b class="bad">ค้างค่าเทอม ${baht(d.debt)}</b>`;
      let b = '';
      if (l && l !== 'done' && l !== 'hs?' && !enrolled(k)) b += B(`enrol|${id}`, '🎒 มอบตัวเข้าเรียน');
      if (l === 'hs?') b += '<span class="dim">เลือก ม.4/ปวช. ในแอปการศึกษา (ไอคอนโรงเรียน)</span>';
      if (d.sick) b += B(`doctor|${id}`, '🩺 พาไปคลินิก ฿450', { dis: !!d.sick.seen }) + B(`care|${id}`, '🤗 ดูแลที่บ้าน', { ghost: 1 });
      b += B(`hw|${id}`, '✏️ ช่วยทำการบ้าน', { ghost: 1, dis: d.hw <= 0 }) + B(`story|${id}`, '📖 อ่านนิทาน', { ghost: 1, dis: yrs(k) > 10 }) + B(`uniform|${id}`, '👕 ซื้อชุดนักเรียน ฿1,200', { ghost: 1 }) + B(`teacher|${id}`, '👩‍🏫 พบครู', { ghost: 1, dis: !(d.letter || d.cond < 70) });
      s += C(k.fem ? '👧' : '👦', esc(k.name), t, b);
    }
    return s;
  };
  const tab1 = () => {
    const L = kids().filter(k => lvl(k) && lvl(k) !== 'done'); if (!L.length) return LEAD('ยังไม่มีลูกในวัยเรียน');
    let s = LEAD('กิจกรรมโรงเรียน ชมรม ตัวเลือกโรงเรียน และค่ายปิดเทอม') + DIM(`วันนี้ (${RD(half() + 1)} ของรอบ 6 สัปดาห์): ไหว้ครู วันที่ 6 · กีฬาสี วันที่ 21 · ทัศนศึกษา วันที่ 29 · ปิดเทอม วันที่ 36–42 · เข้าร่วมกับลูกได้เฉพาะวันนั้น`);
    for (const k of L) {
      const d = D(k), id = key(k), l = lvl(k), x = K();
      const evb = Object.entries(EVN).map(([ev, E]) => B(`ev|${id}|${ev}`, `${E[2]} ${E[1]}${ev === 'teacher' ? ' ฿200' : ev === 'trip' ? ' ฿350' : ''}`, { ghost: 1, dis: half() !== E[0] || !!x.ev[`${id}:${ev}:${Math.floor((S.day - 1) / 42)}`] })).join('');
      s += C('🏫', `${esc(k.name)} · ${LV[l] || ''} ${grade(k)}`, `โรงเรียน: ${d.priv ? 'เอกชน (ค่าเทอมทุก 2 สัปดาห์ เกรดดีขึ้น)' : 'รัฐ (เรียนฟรี 15 ปี)'}${d.elite ? ' · โรงเรียนประจำจังหวัด' : ''} · ชมรม: ${d.club ? CLUB[d.club][0] : 'ยังไม่เข้า'} · แต้มพอร์ตโฟลิโอ ${d.cp.toFixed(1)}`,
        B(`stype|${id}|priv`, d.priv ? 'ย้ายกลับ รร.รัฐ' : '🏫 ย้ายโรงเรียนเอกชน', { ghost: 1 }) + Object.entries(CLUB).map(([c, v]) => B(`club|${id}|${c}`, `${v[1]} ${v[0]}${d.club === c ? ' ✔' : ' ฿300'}`, { ghost: 1, dis: yrs(k) < 6 })).join('') + evb + B(`camp|${id}`, '🏕️ ค่ายปิดเทอม ฿1,500', { ghost: 1, dis: !brk() }));
    }
    return s;
  };
  const tab2 = () => {
    const L = kids().filter(k => yrs(k) >= 10); if (!L.length) return LEAD('เด็กโตขึ้นมาก่อน (อายุ ≥ 10 ปี) จึงมีการสอบเข้าและเลือกสายการเรียน') + DIM('ป.6: สอบเข้า ม.1 โรงเรียนประจำจังหวัด · ม.ปลาย: เลือกสายวิทย์-คณิต/ศิลป์ · ม.6: สอบกลางและยื่น TCAS 4 รอบ (พอร์ตโฟลิโอ โควตา แอดมิชชัน รับตรง) แล้วยืนยันสิทธิ์ ค่าเทอมจ่ายจากกองทุนการศึกษาก่อน');
    let s = LEAD('การสอบเข้าและมหาวิทยาลัย: คะแนนมาจากเกรดเฉลี่ย (GPAX) ความประพฤติ พอร์ตโฟลิโอจากชมรม/กิจกรรม และคะแนนสอบกลาง (กวดวิชาช่วยเพิ่ม)');
    for (const k of L) {
      const d = D(k), id = key(k), l = lvl(k), t = dd(k), g = gpax(k);
      let b = '', info = `GPAX ${g.toFixed(2)} · เตรียมสอบ ${d.prep}/45 · พอร์ต ${(portf(k) * 100).toFixed(0)}%`;
      if (l === 'p' && yrs(k) >= 11) b += B(`elite|${id}`, '📝 สอบเข้า ม.1 รร.ประจำจังหวัด ฿200', { dis: !!d.eliteTry }) + B(`cram|${id}|m1`, '📚 กวดวิชา ฿2,500', { ghost: 1 });
      if (l === 'hs') b += B(`strand|${id}|sci`, `🔬 สายวิทย์-คณิต${d.strand === 'sci' ? ' ✔' : ''}`, { ghost: 1 }) + B(`strand|${id}|art`, `📖 สายศิลป์${d.strand === 'art' ? ' ✔' : ''}`, { ghost: 1 });
      s += C('🎯', `${esc(k.name)} · ${LV[l] || (l === 'done' ? 'พ้นวัยเรียน' : '')} ${grade(k)}`, `${info}${d.elite ? ' · ⭐ รร.ประจำจังหวัด' : ''}${d.strand ? ` · สาย${d.strand === 'sci' ? 'วิทย์' : 'ศิลป์'}` : ''}`, b);
      if (t >= 56 && t < 84) {
        const win = Object.entries(RND).map(([r, R]) => `${R[0]}: ${RD((k.born || 0) + R[1])}–${(k.born || 0) + R[2]}`).join(' · ');
        let tc = DIM(`ปฏิทิน TCAS ของ${esc(k.name)}: สมัครสอบกลางก่อน${RD((k.born || 0) + 64)} (สอบ${RD((k.born || 0) + 65)}) · ${win} · ยืนยันสิทธิ์ภายใน 3 วันหลังประกาศผล`);
        tc += `<div class="row">${B(`ereg|${id}`, d.examReg ? '✅ สมัครสอบกลางแล้ว' : '📝 สมัครสอบกลาง ฿600', { dis: !!d.examReg })}${B(`cram|${id}|tcas`, '📚 กวดวิชา ฿4,000', { ghost: 1 })}</div>`;
        if (d.exam) tc += DIM(`คะแนนสอบกลาง: ${(d.exam * 100).toFixed(0)}`);
        for (const o of d.rounds) tc += DIM(`${RND[o.r][0]} → ${FAC[o.f][0]}: ${{ applied: 'รอประกาศผล', pass: `✅ ผ่าน (${(o.sc * 100).toFixed(0)})`, fail: `❌ ไม่ผ่าน (${(o.sc * 100).toFixed(0)})`, conf: '🎓 ยืนยันสิทธิ์แล้ว', lapse: 'สิทธิ์หมดอายุ', void: 'ยกเลิก' }[o.st]}${o.sch ? ' · ทุน 50%' : ''}`);
        const passes = d.rounds.filter(o => o.st === 'pass' && !d.conf);
        if (passes.length) tc += `<div class="row">${passes.map(o => B(`conf|${id}|${o.f}`, `🎓 ยืนยันสิทธิ์ ${FAC[o.f][0]}`)).join('')}</div>`;
        if (!d.conf) { const rr = Object.keys(RND).find(r => t >= RND[r][1] && t <= RND[r][2]); if (rr) tc += H5(`เปิดรับ: ${RND[rr][0]}`) + `<div class="row">${Object.entries(FAC).map(([f, F]) => B(`apply|${id}|${f}|${rr}`, `${F[1]} ${F[0]} (ตัด ${(Math.max(0, F[3] - RND[rr][3]) * 100).toFixed(0)})`, { ghost: 1, dis: !!eligible(k, f, +rr) })).join('')}</div>`; else tc += DIM('ขณะนี้ไม่มีรอบสมัคร'); }
        if (d.conf) tc += LEAD(`🎓 คณะที่ยืนยัน: ${FAC[d.conf][1]} ${FAC[d.conf][0]} · ค่าเทอม ${baht(termFee(k, d))}/เทอม · จ่ายแล้ว ${d.ut}/2 เทอม${d.grad ? ' · จบการศึกษาแล้ว' : ''}`) + (d.debt ? B(`debt|${id}`, `💸 ชำระค่าเทอมค้าง ${baht(d.debt)}`) : '');
        s += tc;
      }
    }
    return s;
  };
  const tab3 = () => {
    const L = kids(); if (!L.length) return LEAD('ยังไม่มีลูก'); let s = LEAD('กองทุนการศึกษาและค่าใช้จ่ายด้านการศึกษา') + DIM('กองทุนการศึกษาฝากผ่านแอป ชีวิตจริงเพิ่มเติม (พินัยกรรม/มรดก) ดอกเบี้ยสะสม ใช้จ่ายค่าเทอมมหาวิทยาลัยเป็นอันดับแรก');
    for (const k of L) { const d = D(k), fk = kidFund(k), id = key(k); s += C('💰', esc(k.name), `ค่าใช้จ่ายการศึกษาสะสม ${baht(Math.round(d.spent + d.tuiPaid))} · กองทุนการศึกษา: ${fk ? baht(Math.round(fk.fund || 0)) : '— (ต้องแจ้งเกิดก่อน)'}`, [5000, 20000, 50000].map(a => B(`fund|${id}|${a}`, `ฝาก ${baht(a)}`, { ghost: 1, dis: !fk })).join('')); }
    const x = K(); if (x.log.length) s += H5('เหตุการณ์ล่าสุด') + x.log.slice(0, 6).map(e => DIM(`${RD(e.d)}: ${esc(e.t)}`)).join('');
    return s;
  };
  const TABS = ['🎒 ลูก ๆ & โรงเรียน', '🏫 กิจกรรม & ชมรม', '🎓 สอบเข้า & มหาวิทยาลัย', '💰 กองทุน & ค่าใช้จ่าย'];
  const render = t => { sel.t = t; return [tab0, tab1, tab2, tab3][t](); };
  const hubOpen = () => UI.open('🎒 การศึกษาลูก', TABS, render, { tab: sel.t || 0, wide: true });
  const addApp = (id, i, n, fn) => {
    if (!APPS.some(a => a.id === id)) APPS.splice(Math.min(APPS.length, 13), 0, { id, i, n });
    Phone.apps[id] = () => { setTimeout(() => { Phone.app = null; UI.close(); fn(); }, 0); return ''; };
    if (typeof APP_GROUPS !== 'undefined') { const gr = APP_GROUPS.find(x => /ครอบครัว|บริการ/.test(x[0])) || APP_GROUPS[APP_GROUPS.length - 1]; if (gr && !gr[1].includes(id)) gr[1].unshift(id); }
  };
  addApp('kids31', '🎒', 'การศึกษาลูก', hubOpen);

  // ================= wiring =================
  { // the family module charged universities weekly; tuition is now handled here (term by term, from the education fund)
    let inWeek = false;
    if (typeof Family !== 'undefined' && Family.stage && Family.week) {
      const _st = Family.stage.bind(Family), _w = Family.week.bind(Family);
      Family.stage = function (k) { const s = _st(k); return inWeek && s === 'มหาวิทยาลัย' ? 'วัยรุ่น' : s; };
      Family.week = function () { inWeek = true; try { return _w.apply(this, arguments); } finally { inWeek = false; } };
    }
  }
  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { daily(); } catch (e) { console.warn('v31 kids daily', e); } return r; }; }
  window.Kids31 = { open: hubOpen, K, D, A, daily, scoreFor, FAC, RND, kidFund, key, byKey };
});
