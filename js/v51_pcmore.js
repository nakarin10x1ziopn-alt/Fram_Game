'use strict';
// ---------- v51_pcmore: more for the computer: live status, power and internet statistics, four new things to do ----------
// * Status: every power button has a coloured status pill (ปิดอยู่ / กำลังเปิด / เปิดอยู่ / สลีป), refreshed live with the boot countdown; the desk prompt shows it too; a toast says when boot finishes.
// * Electricity: kWh per computer per hour / day; the stats app shows it live and summed over 7 days, 14 days and a month (30 days) with the baht cost and a breakdown per machine.
// * Internet: every activity has a realistic data rate (online game 0.1 GB/h, 1080p video 1.5 GB/h, 4K video 7 GB/h, live stream upload 2.7 GB/h, AI/render 0.6 GB/h + a dataset download, online shopping 0.25 GB/h ...).
//   Hour by hour the computer's activity windows are turned into GB (only while the line is up and the machine awake); game updates and dataset downloads add big one-off downloads.
// * New things to do at the desk: 💼 freelance work, 🎓 online course, 🎬 movies & series, 🎥 video editing for your channel.
// State: S.v51 = { d:{day:{e:{uid:kWh}, g:{act:GB}, gp:{uid:GB}, h:[24], net}}, w:[activity windows], n:{counters} }
V23.add('v51_pcmore', () => {
  if (typeof PC === 'undefined' || !window.PC39) return;
  const R = Math.random, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), fx = (n, k = 1) => (+n || 0).toLocaleString('en-US', { maximumFractionDigits: k, minimumFractionDigits: 0 });
  const St = () => { const v = S.v51 = S.v51 || {}; v.d = v.d || {}; v.w = v.w || []; v.n = v.n || {}; return v; };
  const day = d => { const s = St(); return s.d[d] || (s.d[d] = { e: {}, g: {}, gp: {}, h: Array(24).fill(0), net: 0 }); };
  const nowM = () => S.day * 1440 + S.time;
  const toast = (t, i) => { try { UI.toast(t, i || '🖥️'); } catch (e) { } };
  const netUp = () => { try { return ISP.speed() > 0; } catch (e) { return false; } };
  const KWH_BAHT = 4.3;
  const RATE = { game: 0.1, stream: 2.7, ai: 0.6, shop: 0.25, video: 1.5, video4k: 7, work: 0.35, course: 0.8, edit: 3, idle: 0.03 };
  const ACT = { game: ['🎮', 'เล่นเกมออนไลน์'], stream: ['📺', 'ไลฟ์สตรีม (อัปโหลด)'], ai: ['🤖', 'รัน AI / เรนเดอร์'], shop: ['🛒', 'ช้อปปิ้งออนไลน์'], video: ['🎬', 'ดูหนัง/ซีรีส์ 1080p'], video4k: ['🎬', 'ดูหนัง/ซีรีส์ 4K'], work: ['💼', 'ทำงานฟรีแลนซ์'], course: ['🎓', 'เรียนออนไลน์'], edit: ['🎥', 'ตัดต่อ/อัปโหลดวิดีโอ'], idle: ['💤', 'เปิดทิ้งไว้ (อัปเดต/พื้นหลัง)'], dl: ['⬇️', 'ดาวน์โหลดไฟล์ใหญ่ (อัปเดตเกม/ชุดข้อมูล)'] };
  const machine = () => PC39.best() || PC39.mains()[0];
  const addWin = (uid, k, mins) => { const s = nowM(); St().w.push({ u: uid, k, s, e: s + mins }); };
  const oneShot = (uid, k, gb) => { if (!netUp()) return; const D = day(S.day); D.g[k] = (D.g[k] || 0) + gb; D.gp[uid] = (D.gp[uid] || 0) + gb; D.net += gb; };

  // ---------- hourly bookkeeping ----------
  const _hs = Power.hourStep.bind(Power);
  Power.hourStep = function (h) {
    const r0 = _hs(h);
    try {
      const s = St(), now = nowM(), lh = Power.st().lastH, a = (lh != null ? lh : S.day * 24 + h) * 60, b = a + 60, dd = Math.floor(a / 1440), D = day(dd), up = netUp();   // the hour being processed (Power.sync can catch up several hours at once)
      for (const m of PC39.all()) {
        const k = PC39.kw(m); if (k > 0) { D.e[m.uid] = (D.e[m.uid] || 0) + k; D.h[((h % 24) + 24) % 24] += k; }
        const st = PC39.state(m); if (!up || (st !== 'on' && st !== 'boot')) continue;
        let used = 0;
        for (const w of s.w) if (w.u === m.uid) { const ov = clamp(Math.min(w.e, b) - Math.max(w.s, a), 0, 60); if (ov > 0) { used += ov; const gb = RATE[w.k] * ov / 60; D.g[w.k] = (D.g[w.k] || 0) + gb; D.gp[m.uid] = (D.gp[m.uid] || 0) + gb; D.net += gb; } }
        const idle = RATE.idle * Math.max(0, 60 - Math.min(60, used)) / 60; D.g.idle = (D.g.idle || 0) + idle; D.gp[m.uid] = (D.gp[m.uid] || 0) + idle; D.net += idle;
      }
      s.w = s.w.filter(w => w.e > now - 180);
      const keys = Object.keys(s.d).map(Number).sort((x, y) => x - y); while (keys.length > 62) delete s.d[keys.shift()];
    } catch (e) { if (!Power._w51) { Power._w51 = 1; console.warn('v51 hour', e); } }
    return r0;
  };
  // the old activities and the shop register what the computer is doing
  { const _use = PC.use.bind(PC); PC.use = function (v) {
    const m = PC39.best(); const before = nowM();
    if (m && PC39.usable()) {
      if (v === 'game') { addWin(m.uid, 'game', 60); if (R() < 0.12) { const gb = Math.round(15 + R() * 25); oneShot(m.uid, 'dl', gb); toast(`ดาวน์โหลดอัปเดตเกม ${gb} GB`, '⬇️'); } }
      else if (v === 'stream') addWin(m.uid, 'stream', 120);
      else if (v === 'ai') { addWin(m.uid, 'ai', 480); oneShot(m.uid, 'dl', 8); toast('ดาวน์โหลดชุดข้อมูล/โมเดลสำหรับงาน 8 GB', '⬇️'); }
    }
    return _use(v);
  }; }
  const shopMark = () => { try { const m = machine(); if (m && PC39.state(m) === 'on') addWin(m.uid, 'shop', 15); } catch (e) { } };
  try { const _s = UI.shop.bind(UI); UI.shop = function (id) { if (id === 'online') shopMark(); return _s.apply(this, arguments); }; } catch (e) { }
  try { if (window.Mall36) { const _o = Mall36.open; Mall36.open = function () { shopMark(); return _o.apply(this, arguments); }; } } catch (e) { }

  // ---------- four new things to do ----------
  const need = (min, energy) => {
    const m = PC39.best(); if (!m || !PC39.usable()) { toast('คอมปิดอยู่ ต้องเปิดเครื่องก่อน', '🖥️'); return null; }
    if (!netUp()) { toast('ไม่มีอินเทอร์เน็ต ทำงานนี้ไม่ได้ (สมัครเน็ตที่แอปอินเทอร์เน็ต)', '📶'); return null; }
    if (S.energy < energy) { toast('พลังงานไม่พอ พักก่อน', '😴'); return null; }
    return m;
  };
  const mon4k = () => { try { return PC.monitor() === 'mon_oled' || PC.monitor() === 'mon_27'; } catch (e) { return false; } };
  const ACTS = {
    work: { i: '💼', n: 'ฟรีแลนซ์ออนไลน์ 4 ชม.', d: () => `ออกแบบ/พิมพ์งาน/ถอดเสียง ได้เงินตามสเปกเครื่อง ~${baht(Math.round(500 + (PC.best() || { score: 0 }).score / 20))} · วันละ 1 ครั้ง · เน็ต ~${RATE.work} GB/ชม.`, ok: () => St().n.work !== S.day,
      run(m) { const pc = m.ref || { score: 0 }, mins = 240; if (!need(mins, 12)) return; addWin(m.uid, 'work', mins); PC39.mark(m.uid, mins); UI.close(); fade(() => { tick(mins); useEnergy(12); const pay = Math.round((500 + pc.score / 20 + (S.pcSkill || 0) * 20) * (0.8 + R() * 0.4)); earn(pay); try { Bank2.income('งานฟรีแลนซ์ออนไลน์', pay); } catch (e) { } St().n.work = S.day; S.mood = Math.max(0, (S.mood || 50) - 2); Prog.add(12); toast(`ส่งงานฟรีแลนซ์เสร็จ ลูกค้าโอนเงิน ${baht(pay)}`, '💼'); }); } },
    course: { i: '🎓', n: 'เรียนคอร์สออนไลน์ 2 ชม.', d: () => `ได้ประสบการณ์ครบ 5 ครั้งรับใบรับรองคอร์ส (ตอนนี้ ${St().n.course || 0}) · วันละ 2 ครั้ง · เน็ต ~${RATE.course} GB/ชม.`, ok: () => (St().n.courseDay === S.day ? St().n.courseN || 0 : 0) < 2,
      run(m) { const mins = 120; if (!need(mins, 6)) return; addWin(m.uid, 'course', mins); PC39.mark(m.uid, mins); UI.close(); fade(() => { tick(mins); useEnergy(6); const s = St(); if (s.n.courseDay !== S.day) { s.n.courseDay = S.day; s.n.courseN = 0; } s.n.courseN++; s.n.course = (s.n.course || 0) + 1; Prog.add(25); S.mood = Math.min(100, (S.mood || 50) + 3); toast(`เรียนจบบทเรียน (ครั้งที่ ${s.n.course})`, '🎓'); if (s.n.course % 5 === 0) { Prog.add(150); try { Phone.msg('คอร์สออนไลน์', `ยินดีด้วย! จบคอร์สครบ ${s.n.course / 5} ชุด ได้ใบรับรองและประสบการณ์เพิ่ม`); } catch (e) { } } }); } },
    video: { i: '🎬', n: 'ดูหนัง/ซีรีส์ 2 ชม.', d: () => `อารมณ์ +12 พลังงาน +4 · เน็ต ${mon4k() ? RATE.video4k + ' GB/ชม. (4K)' : RATE.video + ' GB/ชม. (1080p)'}`, ok: () => true,
      run(m) { const mins = 120; if (!need(mins, 0)) return; const k = mon4k() ? 'video4k' : 'video'; addWin(m.uid, k, mins); PC39.mark(m.uid, mins * 0.5); UI.close(); fade(() => { tick(mins); S.mood = Math.min(100, (S.mood || 50) + 12 + (mon4k() ? 4 : 0)); S.energy = Math.min(maxEnergy(), S.energy + 4); toast(`ดู${U.pick(['ซีรีส์', 'หนัง', 'สารคดี'])}จบแล้ว อารมณ์ดีขึ้น (ใช้เน็ต ~${fx(RATE[k] * 2)} GB)`, '🎬'); }); } },
    edit: { i: '🎥', n: 'ตัดต่อวิดีโอลงช่อง 3 ชม.', d: () => `ต้องคะแนนเครื่อง ≥ 1,500 · ผู้ติดตามเพิ่ม + รายได้จากยอดวิว · วันละ 1 ครั้ง · อัปโหลด ~${RATE.edit} GB/ชม.`, ok: () => St().n.edit !== S.day && (PC.best() || { score: 0 }).score >= 1500,
      run(m) { const pc = m.ref || { score: 0 }, mins = 180; if (!need(mins, 10)) return; addWin(m.uid, 'edit', mins); PC39.mark(m.uid, mins); UI.close(); fade(() => { tick(mins); useEnergy(10); const gain = Math.round((20 + pc.score / 400) * (0.7 + R() * 0.6)); S.fans = (S.fans || 0) + gain; const pay = Math.round(gain * 6 + pc.score / 60); earn(pay); try { Bank2.income('รายได้คลิปวิดีโอ', pay); } catch (e) { } St().n.edit = S.day; Prog.add(15); S.mood = Math.min(100, (S.mood || 50) + 4); toast(`ลงคลิปแล้ว ผู้ติดตามใหม่ +${gain} ได้รายได้ ${baht(pay)}`, '🎥'); }); } },
  };
  UI.H.v51 = d => { const [a, x] = String(d.v || '').split('|'); if (a === 'act') { const A = ACTS[x], m = PC39.best(); if (A && m) A.run(m); } else if (a === 'stats') openStats(x === 'x' ? 'live' : +x || 'live'); else if (a === 'back') { UI.close(); try { PC.homeUI(); } catch (e) { } } };
  const extra = () => {
    const m = PC39.best(), on = m && PC39.usable(), net = netUp();
    return `<h5>ทำอะไรได้อีกบนคอมเครื่องนี้</h5><p class="dim">${m ? PC39.pill(m) : ''} ${on ? '' : '· เปิดเครื่องก่อนจึงจะใช้งานได้'}${net ? '' : ' · ⚠️ ไม่มีอินเทอร์เน็ต'}</p>
      <div class="grid">${Object.entries(ACTS).filter(([k, A]) => !(A.hide && A.hide())).map(([k, A]) => `<div class="card"><div class="ci">${A.i}</div><div class="cb"><h4>${A.n}</h4><p class="dim">${A.d()}</p><div class="row"><button class="btn" data-a="v51" data-v="act|${k}" ${on && net && A.ok() ? '' : 'disabled'}>ทำเลย</button></div></div></div>`).join('')}
      <div class="card"><div class="ci">📊</div><div class="cb"><h4>สถิติการใช้ไฟและเน็ต</h4><p class="dim">เรียลไทม์ และสรุป 7 วัน / 14 วัน / 1 เดือน</p><div class="row"><button class="btn ghost" data-a="v51" data-v="stats|x">เปิดสถิติ</button></div></div></div></div>`;
  };
  { const _hu = PC.homeUI.bind(PC); PC.homeUI = function () { const r = _hu.apply(this, arguments); try { const c = UI.cur; if (c && c.title === 'คอมพิวเตอร์ที่บ้าน' && !c._v51) { c._v51 = 1; const rr = c.render; c.render = t => rr(t) + extra(); UI.renderBody(); } } catch (e) { } return r; }; }

  // ---------- statistics ----------
  const barOf = (v, max) => `<div style="height:8px;border-radius:5px;background:rgba(255,255,255,.12);overflow:hidden;flex:1"><div style="height:100%;width:${max > 0 ? clamp(v / max * 100, 0, 100) : 0}%;background:linear-gradient(90deg,#4aa3ff,#7ccf5a)"></div></div>`;
  const nameOf = uid => { const m = PC39.all().find(x => x.uid === uid); return m ? m.name : uid; };
  function liveHtml() {
    const D = day(S.day), ms = PC39.mains(), t = PC39.totalKw(), now = nowM(), s = St();
    const cur = {}; for (const w of s.w) if (now >= w.s && now < w.e) cur[w.k] = (cur[w.k] || 0) + 1;
    const on = ms.filter(m => PC39.state(m) === 'on' || PC39.state(m) === 'boot').length, nowGB = netUp() ? Object.keys(cur).reduce((a, k) => a + RATE[k], 0) + (on && !Object.keys(cur).length ? RATE.idle : 0) : 0;
    const today = Object.values(D.e).reduce((a, b) => a + b, 0);
    return `<div class="grid"><div class="card"><div class="ci">⚡</div><div class="cb"><h4>ไฟฟ้าเรียลไทม์</h4><p><b>${fx(t * 1000, 0)} W</b> ตอนนี้ (${on} เครื่องเปิดอยู่) · ≈ ${fx(t * KWH_BAHT, 2)} ฿/ชม.</p><p class="dim">วันนี้ ${fx(today, 2)} kWh ≈ ${baht(Math.round(today * KWH_BAHT))}</p></div></div>
      <div class="card"><div class="ci">🌐</div><div class="cb"><h4>อินเทอร์เน็ตเรียลไทม์</h4><p><b>${fx(nowGB, 2)} GB/ชม.</b> ตอนนี้ ${netUp() ? '' : '(ไม่มีเน็ต)'}</p><p class="dim">กำลังทำ: ${Object.keys(cur).map(k => (ACT[k] || ['', k])[0] + ' ' + (ACT[k] || ['', k])[1]).join(', ') || (on ? 'เปิดทิ้งไว้' : 'ไม่ได้ใช้')} · วันนี้ใช้ ${fx(D.net, 2)} GB</p></div></div></div>
      <h5>แต่ละเครื่อง (วันนี้)</h5><div class="grid">${PC39.all().map(m => `<div class="card"><div class="ci">${m.laptop ? '💻' : '🖥️'}</div><div class="cb"><h4>${esc(m.name)}</h4><p>${PC39.pill(m)}</p><p class="dim">ใช้ไฟ ${fx(D.e[m.uid] || 0, 2)} kWh · เน็ต ${fx(D.gp[m.uid] || 0, 2)} GB</p></div></div>`).join('')}</div>
      <h5>เน็ตวันนี้แยกตามกิจกรรม</h5>${actRows(D.g)}
      <h5>ไฟรายชั่วโมงวันนี้ (kWh)</h5><div style="display:flex;gap:2px;align-items:flex-end;height:70px">${D.h.map((v, i) => `<div title="${i}:00 ${fx(v, 2)} kWh" style="flex:1;background:${i === Math.floor(S.time / 60) ? '#ffd34d' : '#4aa3ff'};height:${Math.max(2, v / Math.max(0.01, ...D.h) * 66)}px;border-radius:2px"></div>`).join('')}</div>
      <h5>ใช้เน็ตจริงๆ เท่าไร (ตัวอย่างต่อ 1 ชั่วโมง)</h5><table class="prof36">${['game', 'video', 'video4k', 'stream', 'ai', 'shop', 'work', 'course', 'edit', 'idle'].map(k => `<tr><td>${ACT[k][0]} ${ACT[k][1]}</td><td>${RATE[k]} GB</td></tr>`).join('')}<tr><td>⬇️ อัปเดตเกม / ชุดข้อมูล AI</td><td>15–40 GB / 8 GB ต่อครั้ง</td></tr></table>`;
  }
  function actRows(g) { const tot = Object.values(g).reduce((a, b) => a + b, 0), mx = Math.max(0.001, ...Object.values(g)); const rows = Object.entries(g).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div style="display:flex;gap:8px;align-items:center;margin:4px 0"><span style="width:200px">${(ACT[k] || ['', k])[0]} ${(ACT[k] || ['', k])[1]}</span>${barOf(v, mx)}<b style="width:78px;text-align:right">${fx(v, 2)} GB</b></div>`).join(''); return rows ? rows + `<p class="dim">รวม ${fx(tot, 2)} GB</p>` : '<p class="empty">ยังไม่มีการใช้งาน</p>'; }
  function rangeHtml(n) {
    const s = St(), days = []; for (let d = S.day - n + 1; d <= S.day; d++) days.push(d);
    let kwh = 0, gb = 0, peak = { d: 0, v: 0 }; const per = {}, perG = {}, g = {}, perDay = [];
    for (const d of days) { const x = s.d[d]; let e = 0; if (x) { for (const u in x.e) { e += x.e[u]; per[u] = (per[u] || 0) + x.e[u]; } for (const k in x.g) g[k] = (g[k] || 0) + x.g[k]; for (const u in x.gp) perG[u] = (perG[u] || 0) + x.gp[u]; gb += x.net || 0; } perDay.push([d, e]); kwh += e; if (e > peak.v) peak = { d, v: e }; }
    const mx = Math.max(0.01, ...perDay.map(x => x[1]));
    return `<div class="grid"><div class="card"><div class="ci">⚡</div><div class="cb"><h4>ไฟฟ้า ${n} วัน</h4><p><b>${fx(kwh, 1)} kWh</b> ≈ ${baht(Math.round(kwh * KWH_BAHT))}</p><p class="dim">เฉลี่ย ${fx(kwh / n, 2)} kWh/วัน · สูงสุด ${peak.v ? RD(peak.d) + ' ' + fx(peak.v, 2) + ' kWh' : '-'}</p></div></div>
      <div class="card"><div class="ci">🌐</div><div class="cb"><h4>อินเทอร์เน็ต ${n} วัน</h4><p><b>${fx(gb, 1)} GB</b></p><p class="dim">เฉลี่ย ${fx(gb / n, 2)} GB/วัน</p></div></div></div>
      <h5>ไฟรายวัน (kWh)</h5><div style="display:flex;gap:2px;align-items:flex-end;height:80px">${perDay.map(([d, v]) => `<div title="${RD(d)} ${fx(v, 2)} kWh" style="flex:1;background:${d === S.day ? '#ffd34d' : '#4aa3ff'};height:${Math.max(2, v / mx * 76)}px;border-radius:2px"></div>`).join('')}</div>
      <h5>แยกตามเครื่อง</h5><div class="grid">${PC39.all().map(m => `<div class="card"><div class="cb"><h4>${esc(m.name)}</h4><p class="dim">ไฟ ${fx(per[m.uid] || 0, 1)} kWh (${baht(Math.round((per[m.uid] || 0) * KWH_BAHT))}) · เน็ต ${fx(perG[m.uid] || 0, 1)} GB</p></div></div>`).join('')}</div>
      <h5>เน็ตแยกตามกิจกรรม</h5>${actRows(g)}`;
  }
  const SV = { tab: 0 };
  function openStats(tab) {
    SV.tab = tab === 'live' ? 0 : tab === 7 ? 1 : tab === 14 ? 2 : tab === 30 ? 3 : (typeof tab === 'number' ? tab : 0);
    UI.open('📊 สถิติคอมพิวเตอร์: ไฟฟ้า & อินเทอร์เน็ต', ['เรียลไทม์', '7 วัน', '14 วัน', '1 เดือน'], t => { SV.tab = t; return t === 0 ? liveHtml() : rangeHtml([0, 7, 14, 30][t]); }, { tab: SV.tab, wide: true });
  }
  if (!APPS.some(a => a.id === 'pcstat51')) APPS.splice(Math.min(APPS.length, 12), 0, { id: 'pcstat51', i: '📊', n: 'สถิติคอมพิวเตอร์' });
  Phone.apps.pcstat51 = () => { setTimeout(() => { Phone.app = null; UI.close(); openStats('live'); }, 0); return ''; };
  try { if (typeof APP_GROUPS !== 'undefined') { const g = APP_GROUPS.find(x => /ไอที|บ้าน|สาธารณูปโภค/.test(x[0])) || APP_GROUPS[APP_GROUPS.length - 1]; if (g && !g[1].includes('pcstat51')) g[1].unshift('pcstat51'); } } catch (e) { }

  // ---------- live refresh + status messages ----------
  const prev = {};
  setInterval(() => {
    try {
      if (!G.started) return;
      for (const m of PC39.all()) { const s = PC39.state(m); if (prev[m.uid] === 'boot' && s === 'on') toast(`${m.name} · สถานะ: 🟢 เปิดอยู่ พร้อมใช้งานแล้ว`, '🟢'); prev[m.uid] = s; }
      if (!UI.cur) return; const b = document.getElementById('mBody'); if (!b) return;
      if (b.querySelector('[data-a="pc39"]') || (UI.cur.title || '').startsWith('📊 สถิติคอมพิวเตอร์') && SV.tab === 0) { if (!document.activeElement || document.activeElement.tagName !== 'INPUT') UI.renderBody(); }
    } catch (e) { }
  }, 1500);
  // the desk prompt says whether the machine is on
  { const EM = { off: '⚫ ปิดอยู่', boot: '🟡 กำลังเปิด', on: '🟢 เปิดอยู่', sleep: '🌙 สลีป' }; const _pa = poiAct; poiAct = function (poi) {
    const r = _pa.apply(this, arguments);
    try { if (r && r.label && (poi.kind === 'computer' || /คอมพิวเตอร์/.test(poi.label || ''))) { const m = poi.kind === 'computer' ? PC39.mains()[0] : (PC39.best() || PC39.mains()[0]); r.label = `[${EM[PC39.state(m)]}] ` + r.label; } } catch (e) { }
    return r;
  }; }
  window.PC51 = { St, day, RATE, ACT, ACTS, openStats, liveHtml, rangeHtml, addWin, oneShot };
});
