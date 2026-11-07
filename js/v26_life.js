'use strict';
// ---------- v26_life: 12 more everyday systems that exist in real life, each tied to the document system where one is needed:
// family registry (marriage / birth / divorce), vaccines & annual check-up, vet for pets, village juristic-person fees,
// land & building tax, will & estate, volunteering / blood / e-Donation, home repairs & permit, PromptPay & scams,
// monthly budget, online marketplace, passport / visa / trips abroad / currency exchange.  Phone app "🧭 ชีวิตจริงเพิ่มเติม" ----------
V23.add('v26_life', () => {
  const YD = 84, MO = 28;                              // a game year = 12 weeks, a "month" = 4 weeks
  const DEF = () => ({
    fam: { spouse: '', wed: 0, div: 0, kids: [], lastBirth: -99, copies: 0 },
    vac: { shot: {}, chk: -999, chkYr: -1, finds: [], rx: 0, lastDay: 0, claimed: 0 },
    vet: {},
    hoa: { due: 0, m: -1, late: 0, mult: 1, rep: [], club: 0, voted: -1, paidTotal: 0 },
    ltax: { yr: -1, due: 0, base: 0, issued: 0, inst: 0, appeal: 0, paid: 0, sur: 0 },
    will: { made: 0, w: [], split: '', exec: '', copies: 0, bonus: 0 },
    vol: { hrs: 0, blood: [], don: 0, donYr: -1, rec: [], cert: 0 },
    house: { c: { plumb: 100, roof: 100, paint: 100, wire: 100 }, seen: null, seenDay: 0, plan: 0, permit: 0, ready: 0, reno: 0 },
    pp: { reg: 0, sent: 0, day: 0, today: 0, scam: null, aware: 0, lost: 0, saved: 0, last: 0 },
    bud: { m: -1, inc: 0, sp: 0, cat: {}, lim: {}, hist: [], goal: 20, streak: 0, alert: 1, warned: {} },
    mk: { list: [], rating: 4.5, sales: 0, offers: [], buys: [], earn: 0, day: -1 },
    abr: { visa: {}, trips: [], ins: 0, souv: 0, fx: { USD: 35, JPY: 0.24, SGD: 26 }, hold: { USD: 0, JPY: 0, SGD: 0 }, away: 0 },
  });
  const L = () => { const x = S.v26l = S.v26l || {}; const d = DEF(); for (const k in d) if (x[k] === undefined || x[k] === null) x[k] = d[k]; return x; };

  // ================= helpers =================
  const msg = (from, t, q) => { try { Phone.msg(from, t, q); } catch (e) { } };
  const pay = (n, label) => { n = Math.round(+n) || 0; if (n > 0 && S.money < n) { UI.toast(`เงินไม่พอ ต้องใช้ ${baht(n)}`, '💸'); return false; } if (n > 0) { S.money -= n; try { Bank2.log(label, -n); } catch (e) { } } return true; };
  const gain = (n, src) => { n = Math.round(+n) || 0; if (n > 0) { earn(n); try { Bank2.income(src, n); } catch (e) { } } };
  const mood = n => { S.mood = Math.max(0, Math.min(100, (S.mood ?? 70) + n)); };
  const energy = n => { S.energy = Math.max(0, Math.min(maxEnergy(), S.energy + n)); };
  const hunger = n => { S.hunger = Math.max(0, Math.min(100, (S.hunger ?? 80) + n)); };
  const thirst = n => { S.thirst = Math.max(0, Math.min(100, (S.thirst ?? 80) + n)); };
  const hrOf = () => S.time / 60;
  const openNow = (a, b) => hrOf() >= a && hrOf() < b;
  const hh = h => `${String(Math.floor(h)).padStart(2, '0')}:${h % 1 ? '30' : '00'}`;
  const dayIdx = () => (S.day - 1) % 7;
  const holiday = () => !!(window.Cal24 && typeof Cal24.isHoliday === 'function' && Cal24.isHoliday(S.day));
  const govOpen = () => hrOf() >= 8.5 && hrOf() < 16.5 && dayIdx() < 5 && !holiday();
  const gov = (ids, what) => !window.Gov24 || Gov24.need(ids, what);
  const has = id => !window.Gov24 || !!Gov24.has(id);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const yearIdx = () => Math.floor((S.day - 1) / YD);
  const monthIdx = () => Math.floor((S.day - 1) / MO);
  const sick = lvl => { if (!S.sick && !(S.sickFree > S.day)) { S.sickFree = S.day + 10; S.sick = lvl || 1; S.sickDays = 0; return true; } return false; };
  const spend = (mins, fn) => { UI.close(); fade(() => { try { tick(mins); } catch (e) { console.warn('v26 tick', e); } try { fn(); } catch (e) { console.warn('v26', e); } saveGame(true); setTimeout(() => hubOpen(), 650); }); };
  const B = (act, label, o = {}) => `<button class="btn ${o.ghost ? 'ghost' : ''}" data-a="l26" data-v="${esc(act)}"${o.dis ? ' disabled' : ''}>${label}</button>`;
  const C = (i, h, p, btns = '') => `<div class="card"><div class="ci">${i}</div><div class="cb"><h4>${h}</h4><p class="dim">${p}</p>${btns ? `<div class="row">${btns}</div>` : ''}</div></div>`;
  const GR = x => `<div class="grid">${x}</div>`;
  const H5 = t => `<h5>${t}</h5>`;
  const LEAD = t => `<p class="lead">${t}</p>`;
  const DIM = t => `<p class="dim">${t}</p>`;
  const A = {}, SYS = {}, DAILY = [];
  UI.H.l26 = d => { const [k, ...r] = String(d.v || '').split('|'); const f = A[k]; if (f) { try { f(...r); } catch (e) { if (e && e.spend173) throw e; console.warn('l26', k, e); } } };
  const friendsAt = n => Object.keys(S.friends || {}).filter(k => Friends.get(k) >= n).sort((a, b) => Friends.get(b) - Friends.get(a));
  const propsOwned = () => { let n = 0, v = 0; try { const o = Estate.st().own; for (const k in o) { n++; v += o[k].paid || 0; } } catch (e) { } try { const l = HomeBuild.st().lots; for (const k in l) if (l[k] && l[k].stage >= 3) { n++; v += 1500000; } } catch (e) { } return { n, v }; };
  const homes = () => 1 + Math.max(0, propsOwned().n > 0 ? Math.min(3, propsOwned().n) : 0);
  const needLead = (arr) => arr.map(x => (window.Gov24 && Gov24.docs[x.split(':')[0]] ? Gov24.docs[x.split(':')[0]].n : x)).join(' + ');

  // ================= 1. ทะเบียนครอบครัว: สมรส / หย่า / แจ้งเกิด =================
  const KIDN = ['น้องมะลิ', 'น้องข้าวฟ่าง', 'น้องภูผา', 'น้องใบบัว', 'น้องตะวัน', 'น้องฟ้าใส', 'น้องกันต์', 'น้องพิม'];
  SYS.fam = { tab: 0, i: '👨‍👩‍👧', n: 'ทะเบียนครอบครัว', sum: () => { const f = L().fam; return f.spouse ? `สมรสกับ ${f.spouse} · บุตร ${f.kids.length}` : f.div ? 'หย่าแล้ว' : 'โสด'; },
    view() {
      const f = L().fam, op = govOpen();
      let h = LEAD(`ที่ว่าการอำเภอ จันทร์–ศุกร์ ${hh(8.5)}–${hh(16.5)} น. · สถานะ: ${f.spouse ? `สมรสกับ <b>${esc(f.spouse)}</b> (${RD(f.wed)})` : f.div ? 'หย่าแล้ว' : 'โสด'} · บุตร ${f.kids.length} คน`) +
        DIM(`การสมรสต้องใช้ ${needLead(['idcard', 'housereg'])} ค่าธรรมเนียมจดทะเบียน 100 ฿ · คู่สมรสช่วยค่าครัวเรือนเดือนละ 900 ฿ แต่มีค่าเลี้ยงดูบุตรคนละ 1,200 ฿/เดือน · เบิกค่าคลอดประกันสังคมได้ 15,000 ฿ ถ้ามีทะเบียนผู้ประกันตน`);
      if (!f.spouse) {
        const el = friendsAt(8).filter(n => n !== f.last);
        h += H5('จดทะเบียนสมรส (ต้องสนิท ≥ 8 หัวใจ)') + (el.length ? GR(el.slice(0, 6).map(n => C('💍', esc(n), `ความสนิท ${Friends.get(n).toFixed(1)}/10`, B('fam.wed|' + n, 'จดทะเบียนสมรส', { dis: !op || S.money < 100 }))).join('')) : DIM('ยังไม่มีใครสนิทพอ ไปคุยและให้ของขวัญชาวบ้านก่อน'));
      } else {
        h += GR(C('💍', `ทะเบียนสมรส · ${esc(f.spouse)}`, `จดเมื่อ${RD(f.wed)}`, B('fam.copy|wed', 'ขอสำเนา (20 ฿)', { dis: !op || S.money < 20 }) + B('fam.div', 'จดทะเบียนหย่า (20 ฿)', { ghost: 1, dis: !op || S.money < 20 })));
      }
      const can = f.spouse && f.kids.length < 3 && S.day - f.lastBirth >= 300 && !f.preg;
      h += H5('บุตร / แจ้งเกิด') + GR((f.preg ? C('🤰', 'ตั้งครรภ์ · กำหนดคลอด ' + RD(f.preg.due), `ฝากครรภ์แล้ว ${f.preg.anc} ครั้ง · ไปตรวจตามนัดทุกเดือน (ฟรีตามสิทธิ์ประกันสังคม/บัตรทอง) · ค่าคลอด ${baht(25000)}${has('ssoreg') ? ' (เบิกประกันสังคม 15,000 ฿ + ลาคลอด 98 วัน)' : ' (ไม่มีสิทธิ์ประกันสังคม)'}`, B('fam.anc', 'ไปฝากครรภ์ตามนัด', { dis: !f.preg.next || S.day < f.preg.next })) : can ? C('👶', 'ตั้งครรภ์ / วางแผนมีบุตร', `ใช้เวลาตั้งครรภ์ประมาณ 9 เดือน (270 วัน) ฝากครรภ์ที่โรงพยาบาลทุกเดือน แล้วคลอดเมื่อครบกำหนด · ค่าคลอด ${baht(25000)}${has('ssoreg') ? ` (เบิกประกันสังคม 15,000 ฿)` : ' (ไม่มีสิทธิ์ประกันสังคม)'}`, B('fam.birth', 'เริ่มฝากครรภ์', { dis: false })) : C('👶', 'บุตร', f.spouse ? (f.kids.length >= 3 ? 'ครบ 3 คนแล้ว' : `คลอดคนต่อไปได้ในอีก ${Math.max(0, f.lastBirth + MO - S.day)} วัน`) : 'ต้องสมรสก่อน')) +
        f.kids.map((k, i) => C('🧒', esc(k.name), `อายุ ${Math.floor((S.day - k.day) / 7)} สัปดาห์ · ${k.reg ? 'แจ้งเกิดแล้ว (สูติบัตร)' : '<b class="bad">ยังไม่ได้แจ้งเกิด</b>'}`, k.reg ? B('fam.copy|birth|' + i, 'ขอสำเนาสูติบัตร (20 ฿)', { dis: !op || S.money < 20 }) : B('fam.reg|' + i, 'แจ้งเกิด (ฟรี)', { dis: !op }))).join(''));
      return h;
    } };
  A['fam.wed'] = n => { const f = L().fam; if (f.spouse || Friends.get(n) < 8 || !govOpen() || !gov(['idcard', 'housereg'], 'จดทะเบียนสมรส') || !pay(100, 'ค่าธรรมเนียมจดทะเบียนสมรส')) return; spend(60, () => { f.spouse = n; f.wed = S.day; f.div = 0; mood(15); Friends.add(n, 1); msg('ที่ว่าการอำเภอสุขใจ', `จดทะเบียนสมรสกับ ${n} เรียบร้อย ขอให้มีความสุข`); UI.toast(`จดทะเบียนสมรสกับ ${n} แล้ว`, '💍'); }); };
  A['fam.div'] = () => { const f = L().fam; if (!f.spouse || !govOpen() || !gov(['idcard'], 'จดทะเบียนหย่า') || !pay(20, 'ค่าธรรมเนียมจดทะเบียนหย่า')) return; spend(60, () => { const share = Math.min(30000, Math.round(S.money * 0.2)); S.money -= share; try { Bank2.log('แบ่งสินสมรสหลังหย่า', -share); } catch (e) { } const n = f.spouse; f.last = n; f.spouse = ''; f.div = S.day; try { S.friends[n] = Math.max(0, Friends.get(n) - 4); } catch (e) { } mood(-12); msg('ที่ว่าการอำเภอสุขใจ', `จดทะเบียนหย่ากับ ${n} แล้ว แบ่งสินสมรส ${baht(share)}`); UI.toast(`หย่าแล้ว แบ่งสินสมรส ${baht(share)}`, '💔'); }); };
  A['fam.anc'] = () => { const f = L().fam; if (!f.preg || S.day < f.preg.next) return; f.preg.anc++; f.preg.next = S.day + 30; mood(2); UI.toast(`ฝากครรภ์ครั้งที่ ${f.preg.anc} แล้ว แพทย์บอกว่าแข็งแรงดี`, '🤰'); };
  A['fam.birth'] = () => { const f = L().fam; if (!f.spouse || f.kids.length >= 3 || S.day - f.lastBirth < 300 || f.preg) return; f.preg = { start: S.day, due: S.day + 270, anc: 0, next: S.day }; msg('โรงพยาบาลสุขใจ', `ยินดีด้วย! ตรวจพบการตั้งครรภ์ กำหนดคลอดประมาณ ${RD(f.preg.due)} ไปฝากครรภ์ที่โรงพยาบาลทุกเดือน (ฟรีตามสิทธิ์) เตรียมค่าคลอด ${baht(25000)}${has('ssoreg') ? ' เบิกประกันสังคมได้ 15,000 ฿ และลาคลอดได้ 98 วัน' : ''}`); UI.toast('เริ่มฝากครรภ์แล้ว ครบกำหนดคลอดใน 9 เดือน', '🤰'); };
  A['fam.deliver'] = () => { const f = L().fam; if (!f.preg || !f.spouse || !pay(25000, 'ค่าคลอดบุตร')) return false; f.preg = null; spend(240, () => { if (has('ssoreg')) gain(15000, 'ประกันสังคม: เงินสงเคราะห์ค่าคลอดบุตร'); f.kids.push({ name: KIDN[f.kids.length * 3 % KIDN.length], day: S.day, reg: 0, fund: 0 }); f.lastBirth = S.day; mood(18); msg('โรงพยาบาลสุขใจ', 'ยินดีด้วย! คุณคลอดบุตรแล้ว อย่าลืมแจ้งเกิดที่ที่ว่าการอำเภอภายใน 15 วัน'); UI.toast('มีสมาชิกใหม่ในครอบครัว 👶', '👶'); }); };
  A['fam.reg'] = i => { const f = L().fam, k = f.kids[+i]; if (!k || k.reg || !govOpen()) return; spend(40, () => { const late = S.day - k.day > 15 ? 50 : 0; if (late) { S.money = Math.max(0, S.money - late); try { Bank2.log('ค่าปรับแจ้งเกิดเกินกำหนด', -late); } catch (e) { } } k.reg = S.day; mood(3); UI.toast(`แจ้งเกิด${k.name}แล้ว${late ? ` (ปรับ ${baht(late)} เพราะเกิน 15 วัน)` : ''}`, '📄'); }); };
  A['fam.copy'] = (w, i) => { if (!govOpen() || !pay(20, 'ค่าสำเนาเอกสารทะเบียนราษฎร')) return; L().fam.copies++; UI.toast('ได้รับสำเนาที่รับรองแล้ว เก็บไว้ในแฟ้มเอกสาร', '📄'); };
  DAILY.push(() => {
    const f = L().fam; if (f.spouse) { mood(1); Friends.add(f.spouse, 0.01); }
    if (f.preg) { const p = f.preg; if (!f.spouse) f.preg = null; else { for (const d of [30, 90, 150, 210, 250]) if (S.day - p.start === d) msg('โรงพยาบาลสุขใจ', `นัดฝากครรภ์ (อายุครรภ์ ${Math.round(d / 30)} เดือน) ไปตรวจที่โรงพยาบาล กด "ไปฝากครรภ์ตามนัด" ที่แฟ้มครอบครัว`); if (S.day >= p.due) { if (!A['fam.deliver']()) { if (!p.warned || S.day - p.warned >= 3) { p.warned = S.day; msg('โรงพยาบาลสุขใจ', `ครบกำหนดคลอดแล้ว แต่เตรียมค่าคลอด ${baht(25000)} ไม่พอ รีบหาเงินแล้วมาที่โรงพยาบาล`); } } } } }
    for (const k of f.kids) if (!k.reg && S.day - k.day === 14) msg('ที่ว่าการอำเภอสุขใจ', `ใกล้ครบกำหนดแจ้งเกิด ${k.name} (15 วัน) รีบไปที่ว่าการอำเภอ`);
    if ((S.day - 1) % MO === 0) {
      if (f.spouse) gain(900, 'ค่าครัวเรือนจากคู่สมรส');
      if (f.kids.length) { const c = f.kids.length * 1200; S.money = Math.max(0, S.money - c); try { Bank2.log('ค่าเลี้ยงดูบุตร (อาหาร ค่าเรียน)', -c); } catch (e) { } if (has('ssoreg')) gain(f.kids.length * 800, 'ประกันสังคม: เงินสงเคราะห์บุตร'); msg('ครอบครัว', `ค่าใช้จ่ายบุตรเดือนนี้ ${baht(c)}`, true); }
    }
    for (const k of f.kids) if (k.fund) k.fund *= 1 + 0.03 / YD;
  });

  // ================= 2. วัคซีน + ตรวจสุขภาพประจำปี =================
  const VAC = { flu: ['🤧', 'ไข้หวัดใหญ่', 350, YD, 0.014], covid: ['🦠', 'โควิด-19', 600, YD, 0.008], tet: ['🩹', 'บาดทะยัก', 200, 3 * YD, 0.006], hepa: ['🍽️', 'ตับอักเสบเอ', 700, 2 * YD, 0.005] };
  const vacOk = k => (L().vac.shot[k] || 0) >= S.day;
  const FIND = { bp: ['🩸', 'ความดันโลหิตสูง'], dm: ['🍬', 'น้ำตาลในเลือดสูง'], chol: ['🥓', 'ไขมันในเลือดสูง'], ok: ['✅', 'ผลปกติ'] };
  SYS.vac = { tab: 0, i: '💉', n: 'วัคซีน & ตรวจสุขภาพ', sum: () => { const v = L().vac; return `วัคซีนที่ยังคุ้มครอง ${Object.keys(VAC).filter(vacOk).length}/4 · ${v.finds.length ? 'มีความเสี่ยง ' + v.finds.length : 'ตรวจล่าสุด ' + (v.chk > 0 ? S.day - v.chk + ' วันก่อน' : 'ไม่เคย')}`; },
    view() {
      const v = L().vac, op = openNow(8, 20) && !holiday(), sso = has('ssoreg') && v.claimed !== yearIdx();
      const chkCost = sso ? 300 : 1200;
      return LEAD(`คลินิกสุขใจ เปิดทุกวัน ${hh(8)}–${hh(20)} น. (หยุดวันนักขัตฤกษ์) · ตรวจสุขภาพประจำปีล่าสุด ${v.chk > 0 ? S.day - v.chk + ' วันก่อน' : 'ยังไม่เคย'}`) +
        DIM('วัคซีนลดโอกาสป่วยจากโรคนั้น 90% และหมดอายุตามรอบ · ตรวจสุขภาพเจอความเสี่ยง (ความดัน น้ำตาล ไขมัน) ต้องรับยาประจำเดือนไม่งั้นมีโอกาสป่วยทุกวัน · ผู้ประกันตนเบิกค่าตรวจได้ปีละครั้ง') +
        H5('วัคซีน') + GR(Object.entries(VAC).map(([k, x]) => C(x[0], x[1], `${baht(x[2])} · คุ้มครอง ${x[3]} วัน · ${vacOk(k) ? `✅ ถึง${RD(v.shot[k])}` : '❌ ยังไม่ได้ฉีด/หมดอายุ'}`, B('vac.shot|' + k, 'ฉีดวัคซีน', { dis: !op || S.money < x[2] }))).join('')) +
        H5('ตรวจสุขภาพ') + GR(C('🩺', 'ตรวจสุขภาพประจำปี', `${baht(chkCost)}${sso ? ' (ใช้สิทธิ์ประกันสังคมปีนี้)' : ''} · เจาะเลือด วัดความดัน 45 นาที`, B('vac.check', 'ตรวจ', { dis: !op || S.money < chkCost })) +
          (v.finds.length ? C('💊', 'รับยาประจำเดือน', `ความเสี่ยงที่พบ: ${v.finds.map(k => FIND[k][1]).join(', ')} · ยา ${baht(350 * v.finds.length)}/4 สัปดาห์ · ${v.rx >= S.day ? `✅ มียาถึง${RD(v.rx)}` : '<b class="bad">ไม่ได้กินยา</b>'}`, B('vac.rx', 'รับยา', { dis: !op || S.money < 350 * v.finds.length }) + B('vac.life', 'ปรับพฤติกรรม (ออกกำลัง/คุมอาหาร)', { ghost: 1 })) : ''));
    } };
  A['vac.shot'] = k => { const x = VAC[k]; if (!x || !openNow(8, 20) || holiday() || !pay(x[2], 'ค่าวัคซีน' + x[1])) return; spend(20, () => { L().vac.shot[k] = S.day + x[3]; mood(1); UI.toast(`ฉีดวัคซีน${x[1]}แล้ว คุ้มครองถึง${RD(S.day + x[3])}`, x[0]); }); };
  A['vac.check'] = () => { const v = L().vac, sso = has('ssoreg') && v.claimed !== yearIdx(); if (!openNow(8, 20) || holiday() || !pay(sso ? 300 : 1200, 'ค่าตรวจสุขภาพประจำปี')) return; spend(45, () => {
    if (sso) v.claimed = yearIdx(); v.chk = S.day; let bmi = 22; try { bmi = S.life25.gym.wt / 2.89; } catch (e) { }
    const risk = Math.max(0.1, (bmi - 20) * 0.08), f = []; if (Math.random() < risk) f.push('bp'); if (Math.random() < risk * 0.8) f.push('dm'); if (Math.random() < risk) f.push('chol'); v.finds = f; v.rx = 0;
    msg('คลินิกสุขใจ', f.length ? `ผลตรวจ: พบ ${f.map(k => FIND[k][1]).join(', ')} หมอแนะนำให้รับยาและคุมอาหาร` : 'ผลตรวจสุขภาพปกติดี ขอให้รักษาสุขภาพต่อไป'); mood(f.length ? -2 : 3); UI.toast(f.length ? 'พบความเสี่ยงสุขภาพ ดูรายละเอียดที่ข้อความ' : 'ผลตรวจปกติ', '🩺'); }); };
  A['vac.rx'] = () => { const v = L().vac; if (!v.finds.length || !openNow(8, 20) || holiday() || !pay(350 * v.finds.length, 'ค่ายาประจำ')) return; spend(25, () => { v.rx = S.day + MO; UI.toast(`รับยาครบ ใช้ได้ถึง${RD(v.rx)}`, '💊'); }); };
  A['vac.life'] = () => { const v = L().vac; if (v.life === S.day) { UI.toast('วันนี้ปรับพฤติกรรมไปแล้ว', 'ℹ️'); return; } v.life = S.day; v.lifeN = (v.lifeN || 0) + 1; hunger(-5); energy(-8); mood(2); if (v.lifeN >= 12 && v.finds.length) { v.finds.pop(); v.lifeN = 0; msg('คลินิกสุขใจ', 'ปรับพฤติกรรมต่อเนื่องจนดีขึ้น ความเสี่ยงหนึ่งอย่างหายแล้ว'); } UI.toast(`ออกกำลัง/คุมอาหารวันนี้ (${v.lifeN || 0}/12)`, '🥗'); };
  DAILY.push(() => {
    const v = L().vac; if (S.sick) return;
    for (const k in VAC) { const x = VAC[k]; if (Math.random() < x[4] * 0.05 * (vacOk(k) ? 0.1 : 1) * (k === 'tet' ? 0.6 : 1)) { if (sick(1)) { msg('ร่างกายของคุณ', `ไม่สบาย: ติดเชื้อ${x[1]}${vacOk(k) ? ' (อาการเบา เพราะฉีดวัคซีนแล้ว)' : ' (ยังไม่ได้ฉีดวัคซีน)'} · ไปคลินิกหรือโรงพยาบาลได้`); return; } } }
    if (v.finds.length && v.rx < S.day && Math.random() < 0.001 * v.finds.length) { sick(1); msg('ร่างกายของคุณ', `ความเสี่ยง${FIND[v.finds[0]][1]}กำเริบ เพราะไม่ได้กินยา`); }
  });

  // ================= 3. สัตวแพทย์ & วัคซีนสัตว์เลี้ยง =================
  const petsL = () => { try { return Pets2.list(); } catch (e) { return S.pets || []; } };
  const vr = n => { const x = L().vet; return x[n] = x[n] || { rab: 0, worm: 0, neut: 0, sick: 0, sd: 0 }; };
  SYS.vet = { tab: 0, i: '🐾', n: 'สัตวแพทย์สัตว์เลี้ยง', sum: () => { const p = petsL(); return p.length ? `สัตว์เลี้ยง ${p.length} ตัว${p.some(x => vr(x.name).sick) ? ' · มีตัวป่วย' : ''}` : 'ยังไม่มีสัตว์เลี้ยง'; },
    view() {
      const ps = petsL(), op = openNow(9, 19) && !holiday();
      if (!ps.length) return LEAD('โรงพยาบาลสัตว์สุขใจ เปิด 09:00–19:00 น.') + DIM('ยังไม่มีสัตว์เลี้ยง รับเลี้ยงได้ที่ฟาร์มปศุสัตว์หรือศูนย์สัตว์เลี้ยงภูผา');
      return LEAD(`โรงพยาบาลสัตว์สุขใจ เปิด ${hh(9)}–${hh(19)} น. (หยุดวันนักขัตฤกษ์)`) + DIM('วัคซีนพิษสุนัขบ้า ปีละครั้ง (84 วัน) · ถ่ายพยาธิทุก 4 สัปดาห์ · สัตว์ที่ไม่ได้ฉีดวัคซีนหรือไม่ถ่ายพยาธิมีโอกาสป่วย ถ้าป่วยเกิน 5 วันไม่ได้รักษาความสุขของสัตว์จะลดลงมาก') +
        GR(ps.map(p => { const r = vr(p.name), t = (typeof PETS !== 'undefined' && PETS[p.type]) || { i: '🐾', n: p.type };
          return C(t.i, esc(p.name), `วัคซีนพิษสุนัขบ้า: ${r.rab >= S.day ? '✅ ถึง ' + r.rab : '❌ หมดอายุ'} · ถ่ายพยาธิ: ${r.worm >= S.day ? '✅ ถึง ' + r.worm : '❌ ครบกำหนด'} · ทำหมัน: ${r.neut ? 'แล้ว' : 'ยัง'}${r.sick ? ' · <b class="bad">🤒 ป่วย</b>' : ''}`,
            B('vet.rab|' + esc(p.name), 'ฉีดพิษสุนัขบ้า 300', { dis: !op || S.money < 300 }) + B('vet.worm|' + esc(p.name), 'ถ่ายพยาธิ 120', { dis: !op || S.money < 120 }) + B('vet.neut|' + esc(p.name), 'ทำหมัน 1,800', { ghost: 1, dis: !op || r.neut || S.money < 1800 }) + (r.sick ? B('vet.cure|' + esc(p.name), 'รักษา 900', { dis: !op || S.money < 900 }) : B('vet.chk|' + esc(p.name), 'ตรวจสุขภาพ 250', { ghost: 1, dis: !op || S.money < 250 }))); }).join(''));
    } };
  const vetDo = (n, cost, label, fn) => { if (!openNow(9, 19) || holiday() || !pay(cost, label)) return; spend(30, () => { fn(vr(n)); const p = petsL().find(x => x.name === n); if (p) p.joy = Math.min(100, (p.joy ?? 60) + 3); }); };
  A['vet.rab'] = n => vetDo(n, 300, 'วัคซีนสัตว์เลี้ยง', r => { r.rab = S.day + YD; UI.toast(`ฉีดวัคซีนพิษสุนัขบ้าให้ ${n} แล้ว`, '💉'); });
  A['vet.worm'] = n => vetDo(n, 120, 'ยาถ่ายพยาธิ', r => { r.worm = S.day + MO; UI.toast(`ถ่ายพยาธิให้ ${n} แล้ว`, '💊'); });
  A['vet.neut'] = n => vetDo(n, 1800, 'ทำหมัน', r => { r.neut = 1; UI.toast(`ทำหมัน ${n} เรียบร้อย พักฟื้นไม่กี่วัน`, '🏥'); });
  A['vet.cure'] = n => vetDo(n, 900, 'ค่ารักษาสัตว์เลี้ยง', r => { r.sick = 0; r.sd = 0; UI.toast(`${n}หายป่วยแล้ว`, '💚'); });
  A['vet.chk'] = n => vetDo(n, 250, 'ตรวจสุขภาพสัตว์เลี้ยง', r => { UI.toast(`${n}สุขภาพดี หมอแนะนำให้ฉีดวัคซีนและถ่ายพยาธิตามรอบ`, '🩺'); });
  DAILY.push(() => { for (const p of petsL()) { const r = vr(p.name); if (r.sick) { r.sd++; p.joy = Math.max(0, (p.joy ?? 60) - (r.sd > 5 ? 6 : 2)); if (r.sd === 5) msg('ศูนย์สัตว์เลี้ยง', `${p.name}ป่วยมา 5 วันแล้ว รีบพาไปโรงพยาบาลสัตว์`); continue; } const k = (r.rab < S.day ? 0.012 : 0) + (r.worm < S.day ? 0.02 : 0); if (k && Math.random() < k) { r.sick = 1; r.sd = 0; msg('ศูนย์สัตว์เลี้ยง', `${p.name}ไม่สบาย (${r.rab < S.day ? 'ไม่ได้ฉีดวัคซีน' : 'ไม่ได้ถ่ายพยาธิ'}) พาไปหาหมอ`); } } });

  // ================= 4. พินัยกรรม & มรดก =================
  const SPL = { fam: 'ครอบครัว 100%', mix: 'ครอบครัว 70% · การกุศล 30%', pets: 'ครอบครัว 80% · สัตว์เลี้ยง 20%', vill: 'ครอบครัว 60% · กองทุนหมู่บ้าน 40%' };
  SYS.will = { tab: 0, i: '✍️', n: 'พินัยกรรม & มรดก', sum: () => L().will.made ? `ทำไว้แล้ว (${RD(L().will.made)})` : 'ยังไม่ได้ทำ',
    view() {
      const w = L().will, op = govOpen(), f = L().fam, wit = friendsAt(3);
      return LEAD(`ที่ว่าการอำเภอ จันทร์–ศุกร์ ${hh(8.5)}–${hh(16.5)} น. · พินัยกรรม: ${w.made ? `<b>ทำแล้ว</b> ${RD(w.made)} · ${SPL[w.split]} · พยาน ${w.w.map(esc).join(', ')}` : 'ยังไม่มี'}`) +
        DIM(`พินัยกรรมแบบเอกสารฝ่ายเมือง ต้องใช้ ${needLead(['idcard'])} พยาน 2 คน (ต้องสนิท ≥ 3 หัวใจ) ค่าธรรมเนียม 200 ฿ · ถ้าไม่มีพินัยกรรม ทรัพย์สินแบ่งตามกฎหมาย ลูกหลานต้องไปยื่นศาลเอง · ยกทรัพย์สินให้ลูกล่วงหน้า (ไม่เสียภาษี) เข้ากองทุนการศึกษาบุตร ดอกเบี้ย 3%/ปี`) +
        (propsOwned().v + S.money > 1000000 && !w.made ? '<p class="dim"><b class="bad">⚠️ คุณมีทรัพย์สินเกินล้านบาทแล้วแต่ยังไม่ทำพินัยกรรม</b></p>' : '') +
        H5('ทำ / แก้พินัยกรรม') + (wit.length >= 2 ? GR(Object.entries(SPL).map(([k, t]) => C('📜', t, `พยาน: ${esc(wit[0])}, ${esc(wit[1])}`, B('will.make|' + k, w.made ? 'แก้ไข (200 ฿)' : 'ทำพินัยกรรม (200 ฿)', { dis: !op || S.money < 200 }))).join('')) : DIM('ต้องมีเพื่อนสนิทอย่างน้อย 2 คนเป็นพยาน')) +
        GR((w.made ? C('📄', 'สำเนาพินัยกรรม / ยกเลิก', 'ขอสำเนา 20 ฿ หรือเพิกถอนพินัยกรรม', B('will.copy', 'ขอสำเนา', { dis: !op || S.money < 20 }) + B('will.revoke', 'เพิกถอน', { ghost: 1, dis: !op })) : '') +
          (f.kids.length ? C('🎓', 'ยกทรัพย์ให้บุตรล่วงหน้า (กองทุนการศึกษา)', `ยอดกองทุนรวม ${baht(Math.round(f.kids.reduce((a, k) => a + (k.fund || 0), 0)))}`, B('will.gift|5000', 'ให้ 5,000', { dis: S.money < 5000 }) + B('will.gift|20000', 'ให้ 20,000', { dis: S.money < 20000 }) + B('will.out', 'ถอนไปจ่ายค่าเรียน', { ghost: 1 })) : ''));
    } };
  A['will.make'] = k => { const w = L().will, wit = friendsAt(3); if (!SPL[k] || wit.length < 2 || !govOpen() || !gov(['idcard'], 'ทำพินัยกรรม') || !pay(200, 'ค่าธรรมเนียมพินัยกรรม')) return; spend(90, () => { const first = !w.made; w.made = S.day; w.w = wit.slice(0, 2); w.split = k; if (first) { mood(5); Friends.add(wit[0], 0.3); Friends.add(wit[1], 0.3); } msg('ที่ว่าการอำเภอสุขใจ', `ทำพินัยกรรมเรียบร้อย (${SPL[k]}) เก็บต้นฉบับไว้ที่ว่าการอำเภอ`); UI.toast('ทำพินัยกรรมแล้ว สบายใจ', '✍️'); }); };
  A['will.copy'] = () => { if (!govOpen() || !pay(20, 'ค่าสำเนาพินัยกรรม')) return; L().will.copies++; UI.toast('ได้สำเนาพินัยกรรมที่รับรองแล้ว', '📄'); };
  A['will.revoke'] = () => { const w = L().will; if (!w.made || !govOpen()) return; spend(40, () => { w.made = 0; w.w = []; w.split = ''; UI.toast('เพิกถอนพินัยกรรมแล้ว', '🗑️'); }); };
  A['will.gift'] = n => { const f = L().fam; n = +n; if (!f.kids.length || !pay(n, 'ยกเงินให้บุตร (กองทุนการศึกษา)')) return; const per = n / f.kids.length; for (const k of f.kids) k.fund = (k.fund || 0) + per; mood(2); UI.toast(`ฝากกองทุนการศึกษาบุตร ${baht(n)}`, '🎓'); };
  A['will.out'] = () => { const f = L().fam, t = Math.round(f.kids.reduce((a, k) => a + (k.fund || 0), 0)); if (!t) return; for (const k of f.kids) k.fund = 0; gain(t, 'ถอนกองทุนการศึกษาบุตร'); UI.toast(`ถอน ${baht(t)} ไปจ่ายค่าเล่าเรียน`, '🎓'); };

  // ================= 5. นิติบุคคลหมู่บ้าน & ค่าส่วนกลาง =================
  const FEE = () => Math.round(450 * homes() * L().hoa.mult);
  const HREP = { lamp: ['💡', 'ไฟส่องทางดับ', 3], road: ['🛣️', 'ถนนในหมู่บ้านเป็นหลุม', 5], tree: ['🌳', 'ต้นไม้ล้มขวางทาง', 2] };
  SYS.hoa = { tab: 1, i: '🏘️', n: 'นิติบุคคลหมู่บ้าน', sum: () => { const h = L().hoa; return h.due > 0 ? `ค้างค่าส่วนกลาง ${baht(Math.round(h.due))}` : 'ชำระครบ'; },
    view() {
      const h = L().hoa, inYr = (S.day - 1) % YD, meet = inYr >= YD - 14 && h.voted !== yearIdx();
      return LEAD(`นิติบุคคลหมู่บ้านจัดสรรสุขใจวิลล่า · ค่าส่วนกลางรอบ 4 สัปดาห์ <b>${baht(FEE())}</b> (${homes()} หลัง) · ค้างชำระ <b>${baht(Math.round(h.due))}</b>${h.late ? ` · <b class="bad">ค้าง ${h.late} งวด</b>` : ''}`) + DIM('ค้างเกิน 1 งวดโดนค่าปรับ 2% ต่องวด ค้างเกิน 3 งวดถูกระงับสิทธิ์ใช้สโมสร/สระ และถูกติดประกาศรายชื่อ (อารมณ์ตกทุกวัน) · เปิดประชุมใหญ่ทุกปลายปีเกม ลงมติค่าส่วนกลาง') +
        GR(C('🧾', 'ชำระค่าส่วนกลาง', h.due > 0 ? `ยอดค้าง ${baht(Math.round(h.due))}` : 'ไม่มียอดค้าง', B('hoa.pay', `ชำระ ${baht(Math.round(h.due))}`, { dis: h.due <= 0 || S.money < h.due })) +
          C('🏊', 'สโมสร / สระว่ายน้ำส่วนกลาง', h.late >= 3 ? '🚫 ถูกระงับสิทธิ์' : h.club === S.day ? 'วันนี้ใช้แล้ว' : 'เปิด 07:00–20:00 น. ใช้ได้วันละครั้ง ฟรีสำหรับผู้ไม่ค้างชำระ', B('hoa.club', 'ใช้สระ 60 นาที', { dis: h.late >= 3 || h.club === S.day || !openNow(7, 20) })) +
          (meet ? C('🗳️', 'ประชุมใหญ่สามัญ ลงมติค่าส่วนกลางปีหน้า', 'เข้าร่วมแล้วได้พบเพื่อนบ้าน', B('hoa.vote|0.9', 'ลด 10% (บริการน้อยลง)') + B('hoa.vote|1', 'คงเดิม', { ghost: 1 }) + B('hoa.vote|1.1', 'เพิ่ม 10% (ปรับปรุงสโมสร)', { ghost: 1 })) : '')) +
        H5('แจ้งซ่อมส่วนกลาง') + GR(Object.entries(HREP).map(([k, x]) => { const o = h.rep.find(r => r.k === k); return C(x[0], x[1], o ? `แจ้งแล้ว ช่างมาซ่อมภายใน ${Math.max(0, o.done - S.day)} วัน` : `แจ้งเรื่อง · ซ่อมภายใน ${x[2]} วัน`, B('hoa.rep|' + k, o ? 'แจ้งแล้ว' : 'แจ้งซ่อม', { dis: !!o })); }).join(''));
    } };
  A['hoa.pay'] = () => { const h = L().hoa, n = Math.round(h.due); if (n <= 0 || !pay(n, 'ค่าส่วนกลางหมู่บ้าน')) return; h.paidTotal += n; h.due = 0; h.late = 0; UI.toast('ชำระค่าส่วนกลางแล้ว ได้รับใบเสร็จ', '🧾'); };
  A['hoa.club'] = () => { const h = L().hoa; if (h.late >= 3 || h.club === S.day || !openNow(7, 20)) return; spend(60, () => { h.club = S.day; energy(10); mood(5); thirst(-8); UI.toast('ว่ายน้ำที่สโมสร สดชื่น', '🏊'); }); };
  A['hoa.vote'] = m => { const h = L().hoa; m = +m; if (![0.9, 1, 1.1].includes(m) || h.voted === yearIdx()) return; spend(90, () => { h.voted = yearIdx(); h.mult = m; const v = friendsAt(0); if (v.length) Friends.add(pick(v), 0.3); mood(2); msg('นิติบุคคลหมู่บ้าน', `มติที่ประชุม: ค่าส่วนกลางปีหน้า ${m === 1 ? 'คงเดิม' : m < 1 ? 'ลด 10%' : 'เพิ่ม 10%'}`); }); };
  A['hoa.rep'] = k => { const h = L().hoa; if (!HREP[k] || h.rep.find(r => r.k === k)) return; h.rep.push({ k, done: S.day + HREP[k][2] + (h.late >= 2 ? 3 : 0) }); UI.toast('แจ้งซ่อมกับนิติบุคคลแล้ว', '📝'); };
  DAILY.push(() => {
    const h = L().hoa;
    if (h.m !== monthIdx()) { h.m = monthIdx(); if (S.day > 1) { if (h.due > 0) { h.late++; h.due += Math.round(h.due * 0.02); } h.due += FEE(); msg('นิติบุคคลหมู่บ้าน', `ใบแจ้งหนี้ค่าส่วนกลาง ${baht(FEE())} ยอดค้างรวม ${baht(Math.round(h.due))}${h.late ? ` (ค้าง ${h.late} งวด มีค่าปรับ)` : ''}`, true); } }
    for (const r of h.rep.slice()) if (S.day >= r.done) { h.rep.splice(h.rep.indexOf(r), 1); mood(2); msg('นิติบุคคลหมู่บ้าน', `ซ่อม${HREP[r.k][1]}เรียบร้อยแล้ว`, true); }
    if (h.late >= 3 && S.day % 4 === 0) mood(-1);
  });

  // ================= 6. ภาษีที่ดินและสิ่งปลูกสร้าง =================
  const assess = () => { const p = propsOwned(); return p.n ? Math.round(p.v * 0.0003 + p.n * 400) : 0; };
  SYS.ltax = { tab: 1, i: '🏞️', n: 'ภาษีที่ดินและสิ่งปลูกสร้าง', sum: () => { const t = L().ltax; return t.due > 0 ? `ค้างชำระ ${baht(Math.round(t.due))}` : assess() ? `ประเมินปีละ ${baht(assess())}` : 'ไม่มีทรัพย์สิน'; },
    view() {
      const t = L().ltax, op = govOpen(), a = assess(), p = propsOwned(), dl = t.issued + MO;
      return LEAD(`ทรัพย์สินที่ต้องเสียภาษี ${p.n} แห่ง · ราคาประเมินรวม ${baht(p.v)} · ภาษีประจำปี ≈ <b>${baht(a)}</b> · ${t.due > 0 ? `ค้างชำระ <b class="bad">${baht(Math.round(t.due))}</b> (ครบกำหนด ${dl})` : 'ชำระครบแล้ว'}`) +
        DIM(`ใบแจ้งภาษีออกต้นปีเกม ชำระภายใน 4 สัปดาห์ ไม่เสียค่าปรับ เกินกำหนดเสียเงินเพิ่ม 1% ต่อ 4 สัปดาห์ · ผ่อนได้ 3 งวด · ยื่นอุทธรณ์ค่าประเมินได้ปีละครั้ง (ต้องใช้ ${needLead(['idcard', 'housereg'])}) · บ้านที่อยู่อาศัยหลักไม่นับ`) +
        GR(C('🧾', 'ชำระภาษี', t.due > 0 ? `ยอด ${baht(Math.round(t.due))}` : 'ไม่มียอดค้าง', B('ltax.pay', 'ชำระเต็มจำนวน', { dis: t.due <= 0 || !op || S.money < t.due }) + B('ltax.inst', 'ผ่อน 3 งวด (จ่ายงวดแรก)', { ghost: 1, dis: t.due <= 0 || t.inst > 0 || !op || S.money < t.due / 3 })) +
          C('📑', 'อุทธรณ์ค่าประเมิน', t.appeal === yearIdx() ? 'ปีนี้ยื่นไปแล้ว' : 'ยื่นคำร้องขอประเมินใหม่ (ฟรี) · ลุ้นลด 20% ไม่แน่เสมอไป', B('ltax.appeal', 'ยื่นอุทธรณ์', { dis: t.due <= 0 || t.appeal === yearIdx() || !op })) +
          C('📋', 'ตรวจสอบรายการทรัพย์สิน', 'ดูรายการที่ขึ้นทะเบียนในโฉนด', B('ltax.view', 'ตรวจสอบ')));
    } };
  A['ltax.pay'] = () => { const t = L().ltax, n = Math.round(t.due); if (n <= 0 || !govOpen() || !gov(['idcard'], 'ชำระภาษีที่ดิน') || !pay(n, 'ภาษีที่ดินและสิ่งปลูกสร้าง')) return; spend(40, () => { t.paid += n; t.due = 0; t.inst = 0; UI.toast('ชำระภาษีที่ดินเรียบร้อย ได้รับใบเสร็จ', '🧾'); }); };
  A['ltax.inst'] = () => { const t = L().ltax, n = Math.round(t.due / 3); if (t.due <= 0 || t.inst || !govOpen() || !gov(['idcard'], 'ผ่อนภาษีที่ดิน') || !pay(n, 'ภาษีที่ดิน งวดที่ 1/3')) return; spend(40, () => { t.due -= n; t.inst = 2; t.next = S.day + MO; UI.toast(`ผ่อนภาษี งวดต่อไป${RD(t.next)} งวดละ ${baht(n)}`, '🧾'); }); };
  A['ltax.appeal'] = () => { const t = L().ltax; if (t.due <= 0 || t.appeal === yearIdx() || !govOpen() || !gov(['idcard', 'housereg'], 'อุทธรณ์ค่าประเมินภาษี')) return; spend(60, () => { t.appeal = yearIdx(); if (Math.random() < 0.45) { const cut = Math.round(t.due * 0.2); t.due -= cut; UI.toast(`คณะกรรมการลดค่าประเมิน ${baht(cut)}`, '✅'); } else UI.toast('คณะกรรมการยืนยันค่าประเมินเดิม', '📑'); }); };
  A['ltax.view'] = () => { const p = propsOwned(); UI.toast(`ทรัพย์สิน ${p.n} แห่ง ราคาประเมิน ${baht(p.v)} ภาษีประมาณ ${baht(assess())}/ปี`, '🏞️'); };
  DAILY.push(() => {
    const t = L().ltax;
    if (t.yr !== yearIdx()) { t.yr = yearIdx(); if (S.day > 1) { const a = assess(); if (a > 0) { t.due += a; t.issued = S.day; t.appeal = -1; msg('สำนักงานที่ดิน', `ใบแจ้งภาษีที่ดินและสิ่งปลูกสร้าง ${baht(a)} ชำระภายใน 4 สัปดาห์ (${RD(S.day + MO)}) ไม่เสียค่าปรับ`); } } }
    if (t.inst > 0 && S.day >= t.next) { const per = Math.round(t.due / t.inst); if (S.money >= per) { S.money -= per; try { Bank2.log(`ภาษีที่ดิน งวดผ่อน`, -per); } catch (e) { } t.due -= per; t.inst--; t.next = S.day + MO; if (t.inst <= 0) { t.due = Math.max(0, t.due); } } else { t.due += Math.round(per * 0.01); msg('สำนักงานที่ดิน', `งวดผ่อนภาษี ${baht(per)} ชำระไม่ได้ เงินไม่พอ ถูกเงินเพิ่ม`); t.next = S.day + 7; } }
    if (t.due > 0 && !t.inst && S.day > t.issued + MO && (S.day - t.issued) % MO === 0) { const s = Math.round(t.due * 0.01); t.due += s; t.sur += s; msg('สำนักงานที่ดิน', `ภาษีที่ดินค้างชำระ เงินเพิ่ม ${baht(s)} ยอดค้าง ${baht(Math.round(t.due))}`, true); }
  });

  // ================= 7. จิตอาสา / บริจาคเลือด / e-Donation =================
  const VOLS = { river: ['🧹', 'เก็บขยะริมแม่น้ำ', 120], kids: ['📚', 'อ่านหนังสือให้เด็กที่ห้องสมุด', 120], elder: ['👵', 'ช่วยดูแลผู้สูงอายุ', 150] };
  const DON = { temple: ['🛕', 'วัดและศาสนสถาน'], hosp: ['🏥', 'โรงพยาบาลสุขใจ (e-Donation)'], school: ['🏫', 'โรงเรียนบ้านสุขใจ (e-Donation)'], flood: ['🌊', 'กองทุนผู้ประสบอุทกภัย'] };
  SYS.vol = { tab: 1, i: '🙋', n: 'จิตอาสา & บริจาค', sum: () => `จิตอาสา ${L().vol.hrs} ชม. · บริจาคเลือด ${L().vol.blood.length} ครั้ง`,
    view() {
      const v = L().vol, last = v.blood.length ? v.blood[v.blood.length - 1] : -999, wait = Math.max(0, last + 21 - S.day);
      return LEAD(`จิตอาสา ${v.hrs}/50 ชั่วโมง${v.cert ? ' · 🏅 ได้รับเกียรติบัตรแล้ว' : ''} · บริจาคเลือด ${v.blood.length} ครั้ง · ยอดบริจาคปีนี้ ${baht(v.donYr === yearIdx() ? v.don : 0)}`) +
        DIM('บริจาคเลือดห่างกันอย่างน้อย 3 สัปดาห์ (21 วัน) ต้องพักผ่อนพอ พลังงานเหลือ ≥ 25 และกินข้าวแล้ว · ครบ 3 ครั้งตรวจเลือดฟรี · e-Donation ต้องใช้บัตรประชาชน ได้ใบเสร็จนำไปลดหย่อนภาษี 2 เท่า (คืนเงินปลายปี ≈ 20% ของยอดบริจาค)') +
        H5('บริจาคเลือด') + GR(C('🩸', 'ศูนย์บริการโลหิต', wait ? `บริจาคได้อีกครั้งในอีก ${wait} วัน` : 'เปิด 08:30–16:00 น. ทุกวัน ใช้เวลา 40 นาที', B('vol.blood', 'บริจาคเลือด', { dis: wait > 0 || !openNow(8.5, 16) || S.energy < 25 || (S.hunger ?? 80) < 30 }))) +
        H5('งานจิตอาสา (ไม่ได้ค่าจ้าง)') + GR(Object.entries(VOLS).map(([k, x]) => C(x[0], x[1], `${x[2]} นาที · เสียพลังงาน 15 · ได้ความสุขและความสนิทกับชาวบ้าน`, B('vol.do|' + k, 'ไปช่วย', { dis: S.energy < 15 || !openNow(7, 17) }))).join('')) +
        H5('บริจาคเงิน') + GR(Object.entries(DON).map(([k, x]) => C(x[0], x[1], k === 'temple' || k === 'flood' ? 'ไม่มีใบเสร็จลดหย่อน' : 'ออกใบเสร็จ e-Donation ลดหย่อนภาษีได้', [500, 2000, 10000].map(n => B(`vol.don|${k}|${n}`, baht(n), { dis: S.money < n })).join(''))).join(''));
    } };
  A['vol.blood'] = () => { const v = L().vol, last = v.blood.length ? v.blood[v.blood.length - 1] : -999; if (S.day - last < 21 || !openNow(8.5, 16) || S.energy < 25 || (S.hunger ?? 80) < 30) return; spend(40, () => { v.blood.push(S.day); energy(-12); thirst(-10); hunger(8); mood(6); v.hrs += 1; let m = 'ขอบคุณที่บริจาคเลือด ช่วยชีวิตได้ถึง 3 คน'; if (v.blood.length % 3 === 0) { m += ' ครบ 3 ครั้ง ตรวจเลือดฟรี'; L().vac.chk = S.day; } UI.toast(m, '🩸'); }); };
  A['vol.do'] = k => { const x = VOLS[k], v = L().vol; if (!x || S.energy < 15 || !openNow(7, 17)) return; spend(x[2], () => { energy(-15); hunger(-8); mood(6); v.hrs += x[2] / 60; const f = friendsAt(0); if (f.length) Friends.add(pick(f), 0.4); try { Prog.add(4); } catch (e) { } if (!v.cert && v.hrs >= 50) { v.cert = S.day; mood(10); msg('ศูนย์อาสาสมัครสุขใจ', 'ครบ 50 ชั่วโมงจิตอาสา! ได้รับเกียรติบัตรอาสาสมัครดีเด่น'); } UI.toast(`${x[1]} เสร็จแล้ว (รวม ${v.hrs.toFixed(1)} ชม.)`, x[0]); }); };
  A['vol.don'] = (k, n) => { const v = L().vol; n = +n; if (!DON[k] || !pay(n, 'บริจาค: ' + DON[k][1])) return; if (v.donYr !== yearIdx()) { v.donYr = yearIdx(); v.don = 0; v.eli = 0; } v.don += n; const rec = (k === 'hosp' || k === 'school') && has('idcard'); if (rec) { v.eli = (v.eli || 0) + n; v.rec.push({ day: S.day, n, to: DON[k][1] }); } mood(n >= 10000 ? 8 : 3); UI.toast(`บริจาค ${baht(n)} ให้${DON[k][1]}${rec ? ' · ออกใบเสร็จ e-Donation แล้ว' : ''}`, DON[k][0]); };
  DAILY.push(() => { const v = L().vol; if (v.donYr !== -1 && v.donYr !== yearIdx() && v.eli > 0) { const r = Math.round(v.eli * 2 * 0.1); gain(r, 'ภาษีคืน: ลดหย่อนเงินบริจาค e-Donation'); msg('สรรพากร', `ลดหย่อนบริจาค e-Donation ${baht(v.eli)} คืนภาษี ${baht(r)}`); v.eli = 0; v.don = 0; v.donYr = yearIdx(); } });

  // ================= 8. ช่างประจำบ้าน & ซ่อมบำรุงบ้าน =================
  const HC = { plumb: ['🚰', 'ท่อน้ำและสุขภัณฑ์', 700], roof: ['🏠', 'หลังคาและรางน้ำ', 2200], paint: ['🎨', 'สีและผนัง', 1500], wire: ['🔌', 'ระบบไฟฟ้า', 1800] };
  const worst = () => Math.min(...Object.values(L().house.c));
  SYS.house = { tab: 1, i: '🔧', n: 'ซ่อมบ้าน & ช่างประจำ', sum: () => `สภาพบ้านแย่สุด ${Math.round(worst())}%${L().house.plan >= S.day ? ' · มีช่างประจำ' : ''}`,
    view() {
      const h = L().house, op = openNow(8, 17) && !holiday(), cut = h.plan >= S.day ? 0.5 : 1, ready = h.ready && S.day >= h.ready;
      return LEAD(`ร้านช่างสุขใจ เปิด ${hh(8)}–${hh(17)} น. · ${h.plan >= S.day ? `✅ สมาชิกช่างประจำถึง ${h.plan} (ซ่อมลด 50%)` : 'ยังไม่ได้เป็นสมาชิกช่างประจำ'}`) +
        DIM(`ตรวจสภาพบ้าน 400 ฿ จึงรู้ค่าจริง (ปกติเห็นแค่ค่าเก่า) · บ้านเสื่อมทุกวัน ต่ำกว่า 35% เริ่มมีเหตุ: ท่อรั่ว หลังคารั่วตอนฝนตก ไฟตก · ปรับปรุงใหญ่ต้องขอใบอนุญาตดัดแปลงอาคารก่อน (${needLead(['idcard', 'housereg'])}) รอ 14 วัน`) +
        GR(Object.entries(HC).map(([k, x]) => { const c = Math.round(h.c[k]), seen = h.seen ? Math.round(h.seen[k]) : null, cost = Math.max(300, Math.round(x[2] * (100 - c) / 60 * cut)); return C(x[0], x[1], `ค่าเก่าที่ตรวจ ${seen == null ? 'ยังไม่เคยตรวจ' : seen + '% (' + (S.day - h.seenDay) + ' วันก่อน)'}${h.seen ? ` · <b>ค่าจริง ${c}%</b>` : ''}`, B('house.fix|' + k, `ซ่อม ${baht(cost)}`, { dis: !op || c > 90 || S.money < cost })); }).join('')) +
        GR(C('🔍', 'ตรวจสภาพบ้านโดยช่างผู้เชี่ยวชาญ', '400 ฿ · 45 นาที · ได้ค่าจริงทุกส่วน', B('house.insp', 'ตรวจ', { dis: !op || S.money < 400 })) +
          C('🧰', 'สมาชิกช่างประจำ', '600 ฿/4 สัปดาห์ · ส่วนลดค่าซ่อม 50% และช่างมาบำรุงให้ +8 ทุกส่วนเดือนละครั้ง', B('house.plan', 'สมัคร/ต่ออายุ', { dis: S.money < 600 })) +
          C('🏗️', 'ปรับปรุงบ้านครั้งใหญ่', h.permit ? (ready ? '✅ ใบอนุญาตผ่านแล้ว ปรับปรุงใหญ่ 18,000 ฿ ทุกส่วน 100% อารมณ์ +10' : `⏳ ใบอนุญาตอยู่ระหว่างพิจารณา (${RD(h.ready)})`) : 'ต้องมีใบอนุญาตดัดแปลงอาคาร (300 ฿ รอ 14 วัน)', (h.permit ? B('house.reno', 'เริ่มปรับปรุง', { dis: !ready || !op || S.money < 18000 }) : B('house.permit', 'ขอใบอนุญาต 300 ฿', { dis: !govOpen() || S.money < 300 }))));
    } };
  A['house.fix'] = k => { const h = L().house, x = HC[k]; if (!x || !openNow(8, 17) || holiday()) return; const c = h.c[k], cost = Math.max(300, Math.round(x[2] * (100 - c) / 60 * (h.plan >= S.day ? 0.5 : 1))); if (c > 90 || !pay(cost, `ซ่อมบ้าน: ${x[1]}`)) return; spend(120, () => { h.c[k] = 100; if (h.seen) h.seen[k] = 100; mood(2); UI.toast(`ซ่อม${x[1]}เรียบร้อย สภาพ 100%`, x[0]); }); };
  A['house.insp'] = () => { const h = L().house; if (!openNow(8, 17) || holiday() || !pay(400, 'ค่าตรวจสภาพบ้าน')) return; spend(45, () => { h.seen = Object.assign({}, h.c); h.seenDay = S.day; UI.toast('ตรวจสภาพบ้านแล้ว ดูค่าจริงในรายการ', '🔍'); }); };
  A['house.plan'] = () => { const h = L().house; if (!pay(600, 'สมาชิกช่างประจำบ้าน')) return; h.plan = Math.max(h.plan, S.day) + MO; UI.toast(`เป็นสมาชิกช่างประจำถึง${RD(h.plan)}`, '🧰'); };
  A['house.permit'] = () => { const h = L().house; if (h.permit || !govOpen() || !gov(['idcard', 'housereg'], 'ขอใบอนุญาตดัดแปลงอาคาร') || !pay(300, 'ค่าธรรมเนียมใบอนุญาตดัดแปลงอาคาร')) return; spend(50, () => { h.permit = S.day; h.ready = S.day + 14; msg('เทศบาลสุขใจ', `รับเรื่องขออนุญาตดัดแปลงอาคารแล้ว ผลภายใน${RD(h.ready)}`); UI.toast(`ยื่นขอใบอนุญาตแล้ว ผล${RD(h.ready)}`, '📝'); }); };
  A['house.reno'] = () => { const h = L().house; if (!h.permit || S.day < h.ready || !openNow(8, 17) || holiday() || !pay(18000, 'ปรับปรุงบ้านครั้งใหญ่')) return; spend(480, () => { for (const k in h.c) h.c[k] = 100; h.permit = 0; h.ready = 0; h.reno++; h.seen = null; mood(10); UI.toast('ปรับปรุงบ้านใหม่หมด สภาพทุกส่วน 100%', '🏗️'); }); };
  DAILY.push(() => {
    const h = L().house, hr = homes() - 1 + 1;
    for (const k in h.c) h.c[k] = Math.max(0, h.c[k] - rnd(0.2, 0.7) * (k === 'roof' && S.weather && /rain|storm/.test(S.weather.type) ? 2 : 1));
    if (h.plan >= S.day && (S.day - 1) % MO === 0) { for (const k in h.c) h.c[k] = Math.min(100, h.c[k] + 8); }
    if (h.c.plumb < 35 && Math.random() < 0.05) { mood(-3); S.money = Math.max(0, S.money - 150); msg('บ้านของคุณ', 'ท่อน้ำรั่ว เสียค่าน้ำเพิ่ม 150 ฿ เรียกช่างซ่อมท่อ', true); }
    if (h.c.roof < 35 && S.weather && /rain|storm/.test(S.weather.type) && Math.random() < 0.3) { const d = Math.round(rnd(400, 1200)); S.money = Math.max(0, S.money - d); mood(-3); msg('บ้านของคุณ', `หลังคารั่วตอนฝนตก ของเสียหาย ${baht(d)} ควรซ่อมหลังคา`, true); }
    if (h.c.wire < 30 && Math.random() < 0.03) { mood(-3); energy(-6); msg('บ้านของคุณ', 'ไฟตก เครื่องใช้ไฟฟ้าดับ ควรให้ช่างตรวจระบบไฟ', true); }
    if (h.c.paint < 25 && S.day % 5 === 0) mood(-1);
  });

  // ================= 9. พร้อมเพย์ & มิจฉาชีพออนไลน์ =================
  const SCAMS = [['📦', 'พัสดุตกค้าง', 'มีพัสดุตกค้างที่ศูนย์คัดแยก กดลิงก์เพื่อชำระค่าธรรมเนียม 39 บาท'], ['💸', 'เงินกู้ด่วน', 'อนุมัติเงินกู้ 50,000 บาท ไม่เช็กเครดิต โอนค่ามัดจำก่อน 2,000 บาท'], ['👮', 'แก๊งคอลเซ็นเตอร์', 'เจ้าหน้าที่กรมสรรพากร: คุณมีพัสดุผิดกฎหมาย ให้โอนเงินเข้าบัญชีกลางเพื่อตรวจสอบ'], ['🎁', 'ลุ้นรางวัล', 'ยินดีด้วย! ถูกรางวัลใหญ่ กรอกข้อมูลบัตรและรหัส OTP เพื่อรับสิทธิ์']];
  SYS.pp = { tab: 2, i: '📱', n: 'พร้อมเพย์ & มิจฉาชีพ', sum: () => { const p = L().pp; return p.scam ? '⚠️ มีข้อความต้องสงสัย' : p.reg ? 'ลงทะเบียนแล้ว' : 'ยังไม่ลงทะเบียน'; },
    view() {
      const p = L().pp, lim = 50000, left = lim - (p.day === S.day ? p.today : 0), fr = friendsAt(1).slice(0, 4);
      let h = LEAD(`บัญชีพร้อมเพย์ผูกกับเลขบัตรประชาชน · โอนได้วันละ ${baht(lim)} (วันนี้เหลือ ${baht(left)}) · ถูกหลอกไปแล้ว ${baht(p.lost)} · กู้คืนได้ ${baht(p.saved)} · ความรู้เท่าทันภัยออนไลน์ ${p.aware}`) +
        DIM(`ลงทะเบียนต้องใช้ ${needLead(['idcard'])} ฟรี · โอนไม่เกิน 5,000 ฟรี เกินนั้นค่าธรรมเนียม 10 ฿ · ถ้าโดนหลอก รีบแจ้ง 1441 ภายในวันเดียวกันอายัดบัญชีคืนเงินได้ราว 55% · รู้ทันมากขึ้น ถูกหลอกน้อยลง`);
      if (p.scam) { const s = p.scam; h += H5('⚠️ ข้อความ/สายที่ไม่ได้ขอ') + GR(C(SCAMS[s.k][0], `${SCAMS[s.k][1]} (ผู้ส่งไม่ทราบชื่อ)`, esc(SCAMS[s.k][2]), B('pp.block', 'บล็อกและลบ') + B('pp.report', 'แจ้งตำรวจ 1441 / ตรวจสอบกับธนาคาร', { ghost: 1 }) + B('pp.click', 'กดลิงก์ / โอนตามที่บอก', { ghost: 1 }))); }
      else if (p.last && !p.scam && p.lastLoss && p.lastLoss.day === S.day && !p.lastLoss.rec) h += H5('เพิ่งถูกหลอก') + GR(C('🚨', 'อายัดบัญชี', `โอนไปแล้ว ${baht(p.lastLoss.n)} แจ้ง 1441 ภายในวันนี้ได้คืนราว 55%`, B('pp.freeze', 'แจ้งอายัดบัญชี')));
      h += H5('พร้อมเพย์') + (p.reg ? GR((fr.length ? fr.map(n => C('👤', esc(n), `โอนเงินให้ ${esc(n)} (ความสนิท ${Friends.get(n).toFixed(1)})`, [500, 2000, 5000].map(m => B(`pp.send|${esc(n)}|${m}`, baht(m), { dis: S.money < m || left < m })).join(''))).join('') : '') + C('📲', 'ตรวจสอบสลิปโอนเงิน', 'ฝึกตรวจสอบสลิปก่อนส่งของ เพิ่มความรู้เท่าทัน', B('pp.learn', 'อ่านเคล็ดลับ'))) : GR(C('📱', 'ลงทะเบียนพร้อมเพย์', 'ผูกบัญชีกับบัตรประชาชน', B('pp.reg', 'ลงทะเบียน'))));
      return h;
    } };
  A['pp.reg'] = () => { const p = L().pp; if (!gov(['idcard'], 'ลงทะเบียนพร้อมเพย์')) return; p.reg = S.day; UI.toast('ลงทะเบียนพร้อมเพย์แล้ว', '📱'); };
  A['pp.send'] = (n, m) => { const p = L().pp; m = +m; if (!p.reg || !n) return; if (p.day !== S.day) { p.day = S.day; p.today = 0; } if (p.today + m > 50000) { UI.toast('เกินวงเงินโอนต่อวัน', '⛔'); return; } const fee = m > 5000 ? 10 : 0; if (!pay(m + fee, `โอนพร้อมเพย์ให้ ${n}`)) return; p.today += m; p.sent += m; try { Friends.add(n, m / 4000); } catch (e) { } mood(2); msg(n, `ได้รับเงิน ${baht(m)} ขอบคุณมากนะ!`, true); UI.toast(`โอน ${baht(m)} ให้ ${n} แล้ว`, '📲'); };
  A['pp.block'] = () => { const p = L().pp; p.scam = null; UI.toast('บล็อกผู้ส่งแล้ว', '🚫'); };
  A['pp.report'] = () => { const p = L().pp; p.scam = null; p.aware += 2; UI.toast('แจ้งเบาะแสแล้ว ความรู้เท่าทันภัยออนไลน์เพิ่มขึ้น', '👮'); };
  A['pp.learn'] = () => { const p = L().pp; if (p.learned === S.day) return; p.learned = S.day; p.aware += 1; UI.toast('ตรวจสลิปจริงเสมอ ห้ามกดลิงก์ในข้อความไม่รู้จัก ธนาคารไม่โทรขอ OTP', '📚'); };
  A['pp.click'] = () => { const p = L().pp, s = p.scam; if (!s) return; const n = Math.max(0, Math.min(S.money, 15000, Math.round(Math.max(1000, S.money * 0.08)))); p.scam = null; p.lost += n; if (n) { S.money -= n; try { Bank2.log('ถูกมิจฉาชีพหลอกโอนเงิน', -n); } catch (e) { } } p.lastLoss = { day: S.day, n, rec: 0 }; p.aware = Math.max(0, p.aware - 1); mood(-10); UI.toast(`ถูกหลอกเสียเงิน ${baht(n)} รีบแจ้งอายัดบัญชีวันนี้`, '🚨'); };
  A['pp.freeze'] = () => { const p = L().pp, l = p.lastLoss; if (!l || l.rec || l.day !== S.day) return; l.rec = 1; const b = Math.round(l.n * 0.55); gain(b, 'ธนาคารอายัดบัญชีคืนเงินจากมิจฉาชีพ'); p.saved += b; p.aware += 3; mood(4); UI.toast(`อายัดสำเร็จ คืนเงิน ${baht(b)}`, '✅'); };
  DAILY.push(() => { const p = L().pp; if (p.scam && S.day - p.scam.day >= 2) p.scam = null; if (p.reg && !p.scam && Math.random() < 0.14 / (1 + p.aware * 0.15)) { const k = Math.floor(Math.random() * SCAMS.length); p.scam = { k, day: S.day }; msg('📩 เบอร์ไม่รู้จัก', SCAMS[k][2]); } });

  // ================= 10. งบประมาณรายเดือน =================
  const CATS = { tax: ['🏛️', 'ภาษี/ราชการ', /ภาษี|ค่าปรับ|ธรรมเนียม|ใบอนุญาต|ราชการ|อากร/], util: ['💡', 'สาธารณูปโภค', /ไฟ|ประปา|อินเทอร์เน็ต|ค่าน้ำ|ขยะ|ส่วนกลาง|เน็ต/], health: ['🩺', 'สุขภาพ', /ฟัน|ยา|หมอ|โรงพยาบาล|ตรวจ|วัคซีน|ประกัน|สัตว์|ฟิตเนส|รักษา/], food: ['🍜', 'อาหาร', /อาหาร|ร้าน|กาแฟ|ข้าว|ขนม|ตลาด|เดลิเวอรี|ซูเปอร์|ชา|น้ำ/], car: ['🚗', 'รถ/เดินทาง', /รถ|น้ำมัน|ทะเบียน|แท็กซี่|ตั๋ว|ซ่อม/], fun: ['🎬', 'ความบันเทิง/ท่องเที่ยว', /หนัง|เที่ยว|คอนเสิร์ต|ทำผม|บริจาค|ศาสนา|ของขวัญ|สวนสนุก/], other: ['🧾', 'อื่นๆ', /./] };
  const catOf = t => { t = String(t); for (const k in CATS) if (CATS[k][2].test(t)) return k; return 'other'; };
  { const _l = Bank2.log.bind(Bank2); Bank2.log = function (t, amt) { try { if (amt < 0 && typeof S.v26l === 'object') { const b = L().bud; b.sp += -amt; const c = catOf(t); b.cat[c] = (b.cat[c] || 0) + -amt; const lim = b.lim[c]; if (b.alert && lim && b.cat[c] > lim && !b.warned[c]) { b.warned[c] = 1; msg('ผู้ช่วยการเงิน', `งบหมวด${CATS[c][1]}เกินแล้ว (${baht(Math.round(b.cat[c]))} / ${baht(lim)})`); } } } catch (e) { } return _l(t, amt); };
    if (typeof Bank2.income === 'function') { const _i = Bank2.income.bind(Bank2); Bank2.income = function (s, n) { try { L().bud.inc += +n || 0; } catch (e) { } return _i(s, n); }; } }
  SYS.bud = { tab: 2, i: '📊', n: 'งบประมาณรายเดือน', sum: () => { const b = L().bud; return `เดือนนี้ใช้ ${baht(Math.round(b.sp))} · รายรับ ${baht(Math.round(b.inc))}`; },
    view() {
      const b = L().bud, rate = b.inc > 0 ? Math.round((1 - b.sp / b.inc) * 100) : 0, left = MO - ((S.day - 1) % MO);
      return LEAD(`รอบเดือนนี้เหลือ ${left} วัน · รายรับ ${baht(Math.round(b.inc))} · รายจ่าย ${baht(Math.round(b.sp))} · อัตราออม <b>${rate}%</b> (เป้า ${b.goal}%) · ผ่านเกณฑ์ต่อเนื่อง ${b.streak} เดือน`) +
        DIM('ระบบบันทึกทุกรายการที่หักเงิน แยกหมวดอัตโนมัติ ตั้งงบรายหมวดแล้วเกินจะเตือน ปิดงบสิ้นเดือนผ่านเกณฑ์ (ออมได้ตามเป้า + ไม่เกินงบ) ได้ความสบายใจและสถิติต่อเนื่อง') +
        GR(Object.entries(CATS).map(([k, x]) => { const s = Math.round(b.cat[k] || 0), l = b.lim[k] || 0, over = l && s > l; return C(x[0], `${x[1]}${over ? ' ⚠️' : ''}`, `ใช้ ${baht(s)} ${l ? `/ งบ ${baht(l)}${over ? ' <b class="bad">เกิน</b>' : ''}` : '(ยังไม่ตั้งงบ)'}`, B(`bud.lim|${k}|500`, 'งบ +500', { ghost: 1 }) + B(`bud.lim|${k}|-500`, '−500', { ghost: 1 }) + B(`bud.lim|${k}|0`, 'ไม่จำกัด', { ghost: 1, dis: !l })); }).join('')) +
        GR(C('🎯', 'เป้าหมายอัตราออม', `ตอนนี้ ${b.goal}% ของรายรับ`, B('bud.goal|5', '+5%', { ghost: 1 }) + B('bud.goal|-5', '−5%', { ghost: 1 })) + C('🔔', 'การแจ้งเตือนงบ', b.alert ? 'เปิดอยู่' : 'ปิดอยู่', B('bud.alert', b.alert ? 'ปิด' : 'เปิด', { ghost: 1 })) +
          C('📈', 'ประวัติ 3 เดือนล่าสุด', b.hist.length ? b.hist.slice(0, 3).map(x => `เดือน ${x.m}: รับ ${baht(Math.round(x.inc))} จ่าย ${baht(Math.round(x.sp))} ออม ${x.rate}% ${x.ok ? '✅' : '❌'}`).join('<br>') : 'ยังไม่มีข้อมูล', ''));
    } };
  A['bud.lim'] = (k, d) => { const b = L().bud; if (!CATS[k]) return; d = +d; b.lim[k] = d === 0 ? 0 : Math.max(0, (b.lim[k] || 0) + d); };
  A['bud.goal'] = d => { const b = L().bud; b.goal = Math.max(0, Math.min(80, b.goal + +d)); };
  A['bud.alert'] = () => { const b = L().bud; b.alert = b.alert ? 0 : 1; };
  DAILY.push(() => {
    const b = L().bud; if (b.m === -1) { b.m = monthIdx(); return; }
    if (b.m !== monthIdx()) { const rate = b.inc > 0 ? Math.round((1 - b.sp / b.inc) * 100) : 0, over = Object.keys(b.lim).some(k => b.lim[k] && (b.cat[k] || 0) > b.lim[k]), ok = rate >= b.goal && !over && b.inc > 0;
      b.hist.unshift({ m: b.m + 1, inc: b.inc, sp: b.sp, rate, ok }); b.hist.length = Math.min(b.hist.length, 6);
      if (ok) { b.streak++; mood(5); msg('ผู้ช่วยการเงิน', `ปิดงบเดือนนี้ผ่านเกณฑ์! ออม ${rate}% ผ่านต่อเนื่อง ${b.streak} เดือน${b.streak % 3 === 0 ? ' ได้ความสบายใจเพิ่มพิเศษ' : ''}`); if (b.streak % 3 === 0) mood(5); }
      else { b.streak = 0; msg('ผู้ช่วยการเงิน', `ปิดงบเดือนนี้ ออมได้ ${rate}% ${over ? 'และมีหมวดเกินงบ' : 'ต่ำกว่าเป้า'} ลองปรับค่าใช้จ่ายเดือนหน้า`); }
      b.m = monthIdx(); b.inc = 0; b.sp = 0; b.cat = {}; b.warned = {}; }
  });

  // ================= 11. ตลาดออนไลน์ (ซื้อ-ขายของมือสอง) =================
  const SEL = ['คุณสมชาย', 'พี่นก', 'น้องบีม', 'ป้าแดง', 'ลุงหมี', 'คุณฟ้า'];
  const sellables = () => Object.keys(S.inv || {}).filter(id => S.inv[id] > 0 && ITEMS[id] && ITEMS[id].sell > 0).sort((a, b) => ITEMS[b].sell - ITEMS[a].sell).slice(0, 10);
  SYS.mk = { tab: 2, i: '🛍️', n: 'ตลาดออนไลน์', sum: () => { const m = L().mk; return `ประกาศขาย ${m.list.filter(x => x.st === 'on').length} · เรตติ้ง ${m.rating.toFixed(1)}★`; },
    view() {
      const m = L().mk;
      return LEAD(`ร้านของคุณบนตลาดออนไลน์สุขใจมาร์เก็ต · เรตติ้ง <b>${m.rating.toFixed(1)}★</b> · ขายแล้ว ${m.sales} ชิ้น · รายได้สะสม ${baht(m.earn)}`) +
        DIM('ตั้งราคาสูงกว่าตลาดขายยาก ต่ำกว่าขายไว · แพลตฟอร์มหักค่าธรรมเนียม 5% + ส่งพัสดุ 30 ฿ ต้องส่งภายใน 2 วันไม่งั้นยกเลิกและเรตติ้งตก เงินเข้า 2 วันหลังส่ง · มีโอกาส 5% ผู้ซื้อขอคืนสินค้า · ซื้อของมือสองถูกกว่าแต่เจอผู้ขายหลอกได้ ดูเรตติ้งผู้ขายก่อนซื้อ') +
        H5('สินค้าของคุณ') + (m.list.length ? GR(m.list.slice(-8).reverse().map((x, i0) => { const i = m.list.indexOf(x); return C(x.i, `${esc(x.n)} ${baht(x.price)}`, x.st === 'on' ? `ลงขายมา ${S.day - x.day} วัน` : x.st === 'ship' ? `ขายแล้ว! ผู้ซื้อ ${esc(x.buyer)} · ส่งภายใน${RD(x.dl)}` : x.st === 'pay' ? `ส่งแล้ว รอเงินเข้า${RD(x.payDay)}` : x.st === 'done' ? '✅ เสร็จสิ้น' : x.st === 'ret' ? '↩️ ผู้ซื้อคืนสินค้า' : '❌ ยกเลิก', x.st === 'on' ? B('mk.del|' + i, 'ถอดประกาศ', { ghost: 1 }) : x.st === 'ship' ? B('mk.ship|' + i, 'ส่งพัสดุ 30 ฿ (30 นาที)', { dis: S.money < 30 }) : ''); }).join('')) : DIM('ยังไม่มีประกาศขาย')) +
        H5('ลงขายจากคลังของคุณ') + (sellables().length ? GR(sellables().map(id => C(ITEMS[id].i, `${ITEMS[id].n} ×${S.inv[id]}`, `ราคาตลาด ${baht(ITEMS[id].sell)}`, [0.9, 1.15, 1.4].map(r => B(`mk.list|${id}|${r}`, baht(Math.round(ITEMS[id].sell * r)), { ghost: r !== 1.15 })).join(''))).join('')) : DIM('ไม่มีของขายได้ในกระเป๋า')) +
        H5('ซื้อของมือสองวันนี้') + (m.offers.length ? GR(m.offers.map((o, i) => C(ITEMS[o.id].i, `${ITEMS[o.id].n} ${baht(o.price)}`, `ผู้ขาย ${esc(o.seller)} · เรตติ้ง ${o.rate.toFixed(1)}★ · ราคาตลาด ${baht(ITEMS[o.id].sell)}`, B('mk.buy|' + i, 'ซื้อ (ส่งภายใน 2 วัน)', { dis: S.money < o.price }))).join('')) : DIM('ตอนนี้ไม่มีรายการ พรุ่งนี้มาดูใหม่'));
    } };
  A['mk.list'] = (id, r) => { const m = L().mk; r = +r; if (!ITEMS[id] || !(S.inv[id] > 0)) return; if (m.list.filter(x => x.st === 'on').length >= 8) { UI.toast('ลงประกาศได้พร้อมกันสูงสุด 8 รายการ', 'ℹ️'); return; } S.inv[id]--; if (S.inv[id] <= 0) delete S.inv[id]; try { UI.hotbar(); } catch (e) { } m.list.push({ id, n: ITEMS[id].n, i: ITEMS[id].i, price: Math.round(ITEMS[id].sell * r), base: ITEMS[id].sell, day: S.day, st: 'on' }); UI.toast(`ลงขาย${ITEMS[id].n}แล้ว`, '🛍️'); };
  A['mk.del'] = i => { const m = L().mk, x = m.list[+i]; if (!x || x.st !== 'on') return; x.st = 'x'; addItem(x.id, 1); UI.toast('ถอดประกาศ นำของกลับกระเป๋า', '↩️'); };
  A['mk.ship'] = i => { const m = L().mk, x = m.list[+i]; if (!x || x.st !== 'ship' || !pay(30, 'ค่าส่งพัสดุขายออนไลน์')) return; spend(30, () => { x.st = 'pay'; x.payDay = S.day + 2; UI.toast('ส่งพัสดุแล้ว เงินเข้าใน 2 วัน', '📦'); }); };
  A['mk.buy'] = i => { const m = L().mk, o = m.offers[+i]; if (!o || !pay(o.price, `ซื้อของมือสอง: ${ITEMS[o.id].n}`)) return; m.offers.splice(+i, 1); m.buys.push({ id: o.id, fake: o.fake, arr: S.day + 2, seller: o.seller }); UI.toast('ชำระแล้ว รอพัสดุภายใน 2 วัน', '🛒'); };
  DAILY.push(() => {
    const m = L().mk;
    for (const x of m.list) {
      if (x.st === 'on') { const r = x.price / Math.max(1, x.base), p = Math.max(0.03, Math.min(0.7, 0.45 - (r - 1) * 0.9 + (m.rating - 4) * 0.08)); if (Math.random() < p) { x.st = 'ship'; x.buyer = pick(SEL); x.dl = S.day + 2; msg('สุขใจมาร์เก็ต', `${x.buyer}สั่งซื้อ ${x.n} ${baht(x.price)} ส่งภายใน${RD(x.dl)}`); } else if (S.day - x.day > 14) { x.st = 'x'; addItem(x.id, 1); msg('สุขใจมาร์เก็ต', `ประกาศ ${x.n} หมดอายุ คืนของเข้ากระเป๋า`, true); } }
      else if (x.st === 'ship' && S.day > x.dl) { x.st = 'x'; addItem(x.id, 1); m.rating = Math.max(1, m.rating - 0.3); msg('สุขใจมาร์เก็ต', `ไม่ได้ส่ง ${x.n} ตามกำหนด คำสั่งซื้อถูกยกเลิก เรตติ้งลดลง`); }
      else if (x.st === 'pay' && S.day >= x.payDay) { if (Math.random() < 0.05) { x.st = 'ret'; addItem(x.id, 1); m.rating = Math.max(1, m.rating - 0.4); msg('สุขใจมาร์เก็ต', `${x.buyer}ขอคืน ${x.n} ได้รับของคืน เรตติ้งลดลง`); } else { x.st = 'done'; const n = Math.round(x.price * 0.95); gain(n, 'ขายของออนไลน์'); m.sales++; m.earn += n; m.rating = Math.min(5, m.rating + 0.06); msg('สุขใจมาร์เก็ต', `เงินค่า ${x.n} ${baht(n)} (หักค่าธรรมเนียม 5%) เข้าบัญชีแล้ว`, true); } }
    }
    if (m.list.length > 30) m.list = m.list.filter(x => x.st === 'on' || x.st === 'ship' || x.st === 'pay').concat(m.list.filter(x => x.st !== 'on' && x.st !== 'ship' && x.st !== 'pay').slice(-10));
    for (const b of m.buys.slice()) if (S.day >= b.arr) { m.buys.splice(m.buys.indexOf(b), 1); if (b.fake) msg('สุขใจมาร์เก็ต', `ผู้ขาย ${b.seller} ปิดร้านหายตัว ไม่ได้ของ (ถูกหลอก)`); else { addItem(b.id, 1); msg('สุขใจมาร์เก็ต', `ได้รับ ${ITEMS[b.id].n} จากผู้ขายมือสองแล้ว`, true); } }
    if (m.day !== S.day) { m.day = S.day; m.offers = []; const pool = Object.keys(ITEMS).filter(id => ITEMS[id].sell > 30 && /^(product|dish|crop)$/.test(ITEMS[id].cat || '') && !/_[0-9]$/.test(id)); for (let n = 0; n < 4 && pool.length; n++) { const id = pick(pool), fake = Math.random() < 0.15; m.offers.push({ id, price: Math.round(ITEMS[id].sell * rnd(0.55, 0.8)), seller: pick(SEL), fake, rate: fake ? rnd(1.2, 3.1) : rnd(3.8, 5) }); } }
  });

  // ================= 12. หนังสือเดินทาง / วีซ่า / เที่ยวต่างประเทศ / แลกเงิน =================
  const DEST = { sg: ['🇸🇬', 'สิงคโปร์', 'free', 0, 0, 14000, 'SGD', 8], vn: ['🇻🇳', 'เวียดนาม', 'free', 0, 0, 9000, 'USD', 6], jp: ['🇯🇵', 'ญี่ปุ่น', 'free', 0, 0, 24000, 'JPY', 12], kr: ['🇰🇷', 'เกาหลีใต้', 'eta', 300, 3, 21000, 'USD', 10], gb: ['🇬🇧', 'สหราชอาณาจักร', 'visa', 3500, 7, 52000, 'USD', 14], us: ['🇺🇸', 'สหรัฐอเมริกา', 'visa', 6000, 10, 68000, 'USD', 16] };
  const ppOk = () => { const d = window.Gov24 && Gov24.has('passport'); return !window.Gov24 ? true : !!d && (!d.exp || d.exp - S.day >= MO * 2); };
  const visaOk = k => { const v = L().abr.visa[k]; return DEST[k][2] === 'free' || (v && v.st === 'ok' && v.exp >= S.day); };
  SYS.abr = { tab: 2, i: '✈️', n: 'เที่ยวต่างประเทศ & วีซ่า', sum: () => `ทริปที่ผ่านมา ${L().abr.trips.length} ครั้ง${ppOk() ? '' : ' · ต้องทำ/ต่อพาสปอร์ต'}`,
    view() {
      const a = L().abr, op = openNow(8, 20);
      return LEAD(`หนังสือเดินทาง: ${ppOk() ? '✅ ใช้ได้ (เหลือ ≥ 6 เดือนเกม)' : '<b class="bad">❌ ไม่มี/ใกล้หมดอายุ (ต้องเหลืออย่างน้อย 8 สัปดาห์)</b> ขอที่ศูนย์ราชการ'} · ${a.ins >= S.day ? '🛡️ มีประกันเดินทาง' : 'ไม่มีประกันเดินทาง'} · ของฝากในมือ ${a.souv} ชิ้น`) +
        DIM(`สิงคโปร์ เวียดนาม ญี่ปุ่น: ไม่ต้องขอวีซ่า · เกาหลี: ขออนุมัติ K-ETA 3 วัน · อังกฤษ/สหรัฐฯ: ต้องขอวีซ่า (ใช้ ${needLead(['taxcert'])} + เงินในบัญชี ≥ 60,000 ฿) อนุมัติ ~85% ถ้าไม่ผ่านเสียค่าธรรมเนียม · ทริป 1 วันเกม (ล่องรอยได้ลมหายใจ) · เจ็บป่วยต่างประเทศ ถ้าไม่มีประกัน เสีย 3,500–8,000 ฿`) +
        H5('ปลายทาง') + GR(Object.entries(DEST).map(([k, d]) => { const v = a.visa[k], ok = visaOk(k), hold = a.hold[d[6]] * a.fx[d[6]], disc = hold >= d[5] * 0.4; return C(d[0], d[1], `ค่าเดินทางประมาณ ${baht(d[5])}${disc ? ' (ใช้เงินสกุลท้องถิ่นลด 8%)' : ''} · วีซ่า: ${d[2] === 'free' ? 'ไม่ต้อง' : d[2] === 'eta' ? 'K-ETA' : 'วีซ่าท่องเที่ยว'} ${d[2] !== 'free' ? (v ? (v.st === 'wait' ? `⏳ รอผลถึง${RD(v.res)}` : v.st === 'ok' ? (v.exp >= S.day ? `✅ ถึง${RD(v.exp)}` : '❌ หมดอายุ') : '❌ ไม่ผ่าน') : '(ยังไม่ขอ)') : ''}`,
          (d[2] !== 'free' && (!v || v.st === 'no' || (v.st === 'ok' && v.exp < S.day)) ? B('abr.visa|' + k, `ขอวีซ่า ${baht(d[3])}`, { dis: !ppOk() || S.money < d[3] }) : '') + B('abr.go|' + k, 'ไปเที่ยว', { dis: !ppOk() || !ok || S.money < d[5] * (disc ? 0.92 : 1.03) || !op })); }).join('')) +
        GR(C('🛡️', 'ประกันเดินทางต่างประเทศ', '400 ฿ ใช้ได้ 4 สัปดาห์ ครอบคลุมรักษาพยาบาล', B('abr.ins', 'ซื้อ', { dis: S.money < 400 })) +
          C('🎁', 'ของฝาก', `มี ${a.souv} ชิ้น · ให้เพื่อนเพิ่มความสนิท`, friendsAt(1).slice(0, 3).map(n => B('abr.gift|' + esc(n), `ให้ ${esc(n)}`, { ghost: 1, dis: a.souv < 1 })).join(''))) +
        H5('แลกเงินตราต่างประเทศ (ค่าเงินขึ้นลงทุกวัน สเปรด 1%)') + GR(Object.entries(a.fx).map(([c, r]) => C('💱', `${c} = ${r.toFixed(c === 'JPY' ? 3 : 2)} ฿`, `ถืออยู่ ${a.hold[c].toFixed(c === 'JPY' ? 0 : 1)} ${c} (≈ ${baht(Math.round(a.hold[c] * r))})`, B(`abr.fx|${c}|buy`, 'ซื้อ 5,000 ฿', { dis: S.money < 5000 }) + B(`abr.fx|${c}|sell`, 'ขายทั้งหมด', { ghost: 1, dis: a.hold[c] <= 0 }))).join(''));
    } };
  A['abr.visa'] = k => { const d = DEST[k], a = L().abr; if (!d || d[2] === 'free' || !ppOk() || !gov(['passport'], 'ขอวีซ่า')) return; if (d[2] === 'visa' && !gov(['taxcert'], 'ยื่นขอวีซ่า (หลักฐานการเงิน)')) return; if (!pay(d[3], `ค่าธรรมเนียมวีซ่า${d[1]}`)) return; a.visa[k] = { st: 'wait', res: S.day + d[4], money: S.money, exp: 0 }; UI.toast(`ยื่นขอวีซ่า${d[1]}แล้ว รอผลภายใน${RD(S.day + d[4])}`, '🛂'); };
  A['abr.go'] = k => { const d = DEST[k], a = L().abr; if (!d || !ppOk() || !visaOk(k) || !openNow(8, 20)) return; const fx = d[6], hold = a.hold[fx] * a.fx[fx], disc = hold >= d[5] * 0.4, cost = Math.round(d[5] * (disc ? 0.92 : 1.03)); if (!pay(cost, `เที่ยวต่างประเทศ: ${d[1]}`)) return; if (disc) a.hold[fx] = Math.max(0, a.hold[fx] - d[5] * 0.4 / a.fx[fx]);
    spend(600, () => { energy(-20); hunger(-20); mood(d[7] + 6); const sv = 1 + Math.floor(Math.random() * 3); a.souv += sv; let note = ''; if (Math.random() < 0.08) { const bill = Math.round(rnd(3500, 8000)); if (a.ins >= S.day) note = ' · เจ็บป่วยระหว่างเที่ยว ประกันเดินทางจ่ายให้ทั้งหมด'; else { S.money = Math.max(0, S.money - bill); try { Bank2.log('ค่ารักษาพยาบาลต่างประเทศ', -bill); } catch (e) { } note = ` · เจ็บป่วยระหว่างเที่ยว เสียค่ารักษา ${baht(bill)} (ไม่มีประกัน)`; } mood(-4); } a.trips.push({ k, day: S.day, cost }); try { Prog.add(8); } catch (e) { } msg('ทริปต่างประเทศ', `กลับจาก${d[1]}แล้ว ได้ของฝาก ${sv} ชิ้น${note}`); UI.toast(`เที่ยว${d[1]}เสร็จ มีความสุขมาก`, d[0]); }); };
  A['abr.ins'] = () => { const a = L().abr; if (!pay(400, 'ประกันเดินทางต่างประเทศ')) return; a.ins = Math.max(a.ins, S.day) + MO; UI.toast(`ประกันเดินทางคุ้มครองถึง${RD(a.ins)}`, '🛡️'); };
  A['abr.gift'] = n => { const a = L().abr; if (a.souv < 1 || !n) return; a.souv--; Friends.add(n, 0.8); mood(2); UI.toast(`ให้ของฝากแก่ ${n} สนิทกันมากขึ้น`, '🎁'); };
  A['abr.fx'] = (c, side) => { const a = L().abr; if (!(c in a.fx)) return; if (side === 'buy') { if (!pay(5000, `แลกเงิน ${c}`)) return; a.hold[c] += 5000 / (a.fx[c] * 1.01); UI.toast(`แลกเงินได้ ${c}`, '💱'); } else if (a.hold[c] > 0) { const n = Math.round(a.hold[c] * a.fx[c] * 0.99); a.hold[c] = 0; gain(n, `ขายเงิน ${c}`); UI.toast(`ขายเงิน ${c} ได้ ${baht(n)}`, '💱'); } };
  DAILY.push(() => {
    const a = L().abr, base = { USD: 35, JPY: 0.24, SGD: 26 };
    for (const c in a.fx) a.fx[c] = Math.max(base[c] * 0.85, Math.min(base[c] * 1.15, a.fx[c] * (1 + rnd(-0.012, 0.012))));
    for (const k in a.visa) { const v = a.visa[k]; if (v.st === 'wait' && S.day >= v.res) { const d = DEST[k], docs = d[2] === 'eta' ? true : (v.money >= 60000 && has('taxcert')), okp = docs && Math.random() < (d[2] === 'eta' ? 0.97 : 0.9); v.st = okp ? 'ok' : 'no'; v.exp = S.day + YD; msg('สถานทูต/ระบบวีซ่า', okp ? `วีซ่า${d[1]}อนุมัติแล้ว ใช้ได้ถึง${RD(v.exp)}` : `วีซ่า${d[1]}ไม่ผ่านการพิจารณา${docs ? '' : ' (หลักฐานการเงินไม่เพียงพอ)'} ค่าธรรมเนียมไม่คืน`); } }
  });

  // ================= hub: phone app =================
  const TABS = ['👨‍👩‍👧 ครอบครัว & สุขภาพ', '🏠 บ้าน & ชุมชน', '💰 การเงิน & โลกออนไลน์'];
  const hub = { tab: 0, sys: '' };
  const render = t => {
    hub.tab = t; if (hub.sys && (!SYS[hub.sys] || SYS[hub.sys].tab !== t)) hub.sys = '';
    if (hub.sys) { const s = SYS[hub.sys]; return `<div class="row">${B('hub.back', '‹ กลับรายการ', { ghost: 1 })}</div><h5>${s.i} ${s.n}</h5>` + s.view(); }
    return LEAD('บริการและขั้นตอนทางเอกสารในชีวิตจริง: เลือกหัวข้อ · ที่ต้องใช้เอกสารจะขอบัตร/ทะเบียนจากศูนย์ราชการ (แอป 🏛️ ราชการ)') + GR(Object.entries(SYS).filter(([k, s]) => s.tab === t).map(([k, s]) => { let sm = ''; try { sm = s.sum(); } catch (e) { } return C(s.i, s.n, sm, B('hub.open|' + k, 'เปิด')); }).join(''));
  };
  A['hub.open'] = k => { hub.sys = k; }; A['hub.back'] = () => { hub.sys = ''; };
  const hubOpen = () => UI.open('🧭 ชีวิตจริงเพิ่มเติม', TABS, render, { tab: hub.tab, wide: true });
  const addApp = (id, i, n, fn) => {
    if (!APPS.some(a => a.id === id)) APPS.splice(Math.min(APPS.length, 13), 0, { id, i, n });
    Phone.apps[id] = () => { setTimeout(() => { Phone.app = null; UI.close(); fn(); }, 0); return ''; };
    if (typeof APP_GROUPS !== 'undefined') { const gr = APP_GROUPS.find(x => /บริการ/.test(x[0])) || APP_GROUPS[APP_GROUPS.length - 1]; if (gr && !gr[1].includes(id)) gr[1].unshift(id); }
  };
  addApp('life26', '🧭', 'ชีวิตจริงเพิ่มเติม', hubOpen);
  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); for (const f of DAILY) { try { f(); } catch (e) { console.warn('v26 daily', e); } } return r; }; }
  window.Life26 = { open: hubOpen, L, SYS, A, DAILY };
});
