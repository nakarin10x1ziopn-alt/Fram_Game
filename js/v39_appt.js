'use strict';
// ---------- v39_appt: technician appointments on a time window + ONE appointment calendar ----------
// Every installation / technician visit in the game (internet, extra lines, electricity meter & phase, water meter & well, IT upgrades, smart-home hub,
// moving wired gear) is now a booked job: the customer picks one of the next 1-2 WORKING days and a time window (09-12, 13-16, 16-19). The technician arrives
// inside that window (phone message 30 min before and on arrival), works for a realistic time, and the service works the moment he is done.
// Once or twice a month (deterministic per calendar month) a technician is late; for installations only the provider then pays the customer
// 2x the service price. The calendar app lists every dated thing in the game (appointments, tickets, hearings, deliveries, bills, festivals, notes...).
V23.add('v39_appt', () => {
  const FAR = 1e9;                                          // old day-based timers are parked here while a booked job owns the visit
  const pad = n => String(n).padStart(2, '0');
  const hm = m => `${pad(Math.floor(m / 60) % 24)}:${pad(Math.floor(m % 60))}`;
  const baht0 = n => '฿' + Math.round(n).toLocaleString('en-US');
  const E = s => (typeof esc === 'function' ? esc(s) : String(s));
  const st = () => {
    const s = (S.v39 = S.v39 || {});
    s.jobs = s.jobs || []; s.n = s.n || 0; s.seq = s.seq || {}; s.notes = s.notes || []; s.rem = s.rem || {}; s.stats = s.stats || { done: 0, late: 0, paid: 0 };
    return s;
  };
  const hash = str => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const dayShort = d => (window.Cal36 ? Cal36.short(d) : 'วันที่ ' + d);
  const dayFull = d => (window.Cal36 ? Cal36.full(d) : 'วันที่ ' + d);
  const msg = (from, text, quiet) => { try { Phone.msg(from, text, quiet === undefined ? false : quiet); } catch (e) { } };
  const toast = (t, i) => { try { if (!G.simulating) UI.toast(t, i); } catch (e) { } };

  // ===== working days & windows =====
  const WIN = { am: { n: 'ช่วงเช้า', w: [9, 12] }, pm: { n: 'ช่วงบ่าย', w: [13, 16] }, ev: { n: 'ช่วงเย็น', w: [16, 19] } };
  const workday = d => { const i = (((d - 1) % 7) + 7) % 7; let hol = false; try { hol = window.Cal24 && Cal24.isHoliday(d); } catch (e) { } return i <= 5 && !hol; };   // Mon-Sat, not a public holiday
  const avail = () => { const out = []; for (let d = S.day + 1; out.length < 2 && d < S.day + 14; d++) if (workday(d)) out.push(d); return out; };
  const nextWork = d => { let x = d; while (!workday(x) && x < d + 14) x++; return x; };
  const monthKey = d => { try { const t = Cal36.date(d); return t.y * 12 + t.m; } catch (e) { return Math.floor(d / 30); } };

  // ===== booking =====
  // o: { ad (adapter), ref, kind, title, from, price, dur:[min,max], day, win }
  function book(o) {
    const s = st(), id = 'J' + (++s.n);
    const day = o.day && workday(o.day) && o.day > S.day ? o.day : avail()[0], win = WIN[o.win] ? o.win : 'am';
    const dur = Array.isArray(o.dur) ? Math.round(o.dur[0] + (o.dur[1] - o.dur[0]) * rng(hash(id + o.title))()) : (o.dur || 90);
    const j = { id, ad: o.ad || '', ref: o.ref || {}, kind: o.kind || 'install', title: o.title || 'งานติดตั้ง', from: o.from || 'ช่างติดตั้ง', price: Math.max(0, Math.round(o.price || 0)), dur, day, win, st: 'booked', made: S.day, fresh: 1, late: 0 };
    planLate(j); setArrive(j);
    s.jobs.push(j);
    msg(j.from, `นัดช่าง: ${j.title} ${dayShort(j.day)} ${WIN[j.win].n} ${hm(WIN[j.win].w[0] * 60)}–${hm(WIN[j.win].w[1] * 60)} น. ช่างจะมาตามช่วงเวลานี้ ติดตั้งเสร็จแล้วใช้งานได้ทันที (เปลี่ยนช่วงเวลาได้ที่แอปนัดหมาย)`);
    return j;
  }
  // 1-2 technicians per month (deterministic per calendar month, among the first jobs of that month) arrive late
  function planLate(j) {
    const s = st(), mk = monthKey(j.day), seq = (s.seq[mk] = (s.seq[mk] || 0) + 1), h = hash('late' + mk);
    const set = [1 + h % 3]; if (((h >>> 7) % 2) === 0) set.push(1 + ((h >>> 13) % 3));
    j.seq = seq; j.late = set.includes(seq) ? 1 : 0;
    if (j.late) { const r = rng(hash(j.id + 'l' + mk)); j.lateMin = 60 + Math.floor(r() * 121); j.lateNext = r() < 0.2 ? 1 : 0; }
  }
  function setArrive(j) {
    const w = WIN[j.win].w, r = rng(hash(j.id + j.day + j.win));
    let a;
    if (j.late && j.lateNext) a = nextWork(j.day + 1) * 1440 + 9 * 60 + Math.floor(r() * 180);
    else if (j.late) a = j.day * 1440 + w[1] * 60 + j.lateMin;
    else a = j.day * 1440 + w[0] * 60 + 10 + Math.floor(r() * (w[1] * 60 - w[0] * 60 - 40));
    j.arrive = a;
  }
  const active = j => j.st === 'booked' || j.st === 'enroute' || j.st === 'working';

  // ===== the technician's day =====
  function procJobs() {
    const s = st(); if (!s.jobs.length) return;
    const abs = S.day * 1440 + S.time;
    for (const j of s.jobs) {
      if (!active(j)) continue;
      if (j.st === 'booked' && abs >= j.arrive - 30) {
        j.st = 'enroute';
        msg(j.from, `ช่างกำลังเดินทางมา: ${j.title} คาดว่าถึงประมาณ ${hm(j.arrive % 1440)} น.`); toast('ช่างกำลังเดินทางมา 🚐', '🔧');
      }
      if (j.st === 'enroute' && abs >= j.arrive) {
        j.st = 'working'; j.came = j.arrive;
        const lateBy = j.arrive - (j.day * 1440 + WIN[j.win].w[1] * 60);
        msg(j.from, `ช่างถึงแล้ว เริ่มงาน: ${j.title} ใช้เวลาประมาณ ${j.dur} นาที`); toast('ช่างถึงแล้ว กำลังติดตั้ง 🔧', '🔧');
        if (lateBy > 0) {
          const pay = Math.max(1000, 2 * j.price);
          j.paid = pay; S.money += pay; try { Bank2.log('ช่างมาช้า ค่าชดเชยจากผู้ให้บริการ', pay); } catch (e) { }
          const s2 = st(); s2.stats.late++; s2.stats.paid += pay;
          msg(j.from, `ขออภัย ช่างมาช้ากว่าช่วงเวลานัด (${j.lateNext ? 'ช่างเลื่อนมาวันถัดไป' : 'สาย ' + Math.round(lateBy / 60 * 10) / 10 + ' ชม.'}) ชดเชย ${baht0(pay)} (2 เท่าของค่าบริการ ${baht0(Math.max(500, j.price))}) โอนเข้าบัญชีแล้ว`);
          toast(`ช่างมาช้า ได้รับค่าชดเชย ${baht0(pay)}`, '💸');
        }
      }
      if (j.st === 'working' && abs >= j.arrive + j.dur) finish(j);
    }
    if (s.jobs.length > 60) s.jobs = s.jobs.filter(j => active(j) || S.day - (j.day || 0) < 40);
  }
  function finish(j) {
    j.st = 'done'; const A = ADAPT[j.ad];
    try { if (A && A.done) A.done(j); } catch (e) { console.warn('v39 done', j.ad, e); }
    st().stats.done++;
    msg(j.from, `ช่างติดตั้ง ${j.title} เสร็จเรียบร้อยแล้ว ทดสอบใช้งานได้ทันที`);
    toast(`${j.title} เสร็จแล้ว ✅`, '🔧');
  }
  function cancel(id) {
    const j = st().jobs.find(x => x.id === id); if (!j || !active(j) || j.st === 'working') return;
    j.st = 'cancel'; const A = ADAPT[j.ad]; try { if (A && A.cancel) A.cancel(j); } catch (e) { }
    msg(j.from, `ยกเลิกนัด ${j.title} แล้ว (ระบบจะนัดใหม่ให้ตอนที่คุณกดขอบริการอีกครั้ง)`);
  }
  function resched(id, day, win) {
    const j = st().jobs.find(x => x.id === id); if (!j || (j.st !== 'booked' && j.st !== 'enroute')) return;
    if (!avail().includes(+day) || !WIN[win]) return;
    j.day = +day; j.win = win; j.st = 'booked'; j.fresh = 0; setArrive(j);
    msg(j.from, `เปลี่ยนนัด: ${j.title} เป็น ${dayShort(j.day)} ${WIN[win].n} ${hm(WIN[win].w[0] * 60)}–${hm(WIN[win].w[1] * 60)} น.`);
  }

  // ===== adapters: take over the old multi-day timers of every installation flow =====
  const ADAPT = {};
  const jobOf = (ad, test) => st().jobs.find(j => j.ad === ad && active(j) && test(j.ref));
  const need = (ad, ref, test) => !jobOf(ad, test || (r => JSON.stringify(r) === JSON.stringify(ref)));
  function mk(ad, ref, o) { return book(Object.assign({ ad, ref }, o)); }

  // -- main internet line (isp.js)
  ADAPT.isp = {
    scan() {
      const s = ISP.st(), a = s.appt; if (!a || a.v39 || typeof NET_PKGS === 'undefined') return;
      const P = NET_PKGS[a.k]; if (!P) return;
      const j = mk('isp', { k: a.k }, { title: `ติดตั้งอินเทอร์เน็ต ${P.n}`, from: ISPS[P.isp].n, price: P.price, dur: [90, 150], win: a.slot === 'pm' ? 'pm' : 'am', day: a.day });
      a.v39 = j.id; a.day = j.day;
    },
    done(j) { const s = ISP.st(); if (s.appt && s.appt.v39 === j.id) s.appt = null; if (!s.pkg) { ISP.activate(j.ref.k); msg(ISPS[NET_PKGS[j.ref.k].isp].n, `ทดสอบความเร็วได้ ${ISP.speed()} Mbps`); } },
    cancel(j) { const s = ISP.st(); if (s.appt && s.appt.v39 === j.id) s.appt = null; },
    alive(j) { const a = ISP.st().appt; return !!(a && a.v39 === j.id); },
  };
  // -- extra internet lines (v36_net.js)
  ADAPT.line = {
    scan() {
      if (!window.Net36) return;
      for (const L of Net36.st().lines || []) { const a = L.appt; if (!a || a.v39) continue; const P = NET_PKGS[L.pkg]; if (!P) continue;
        const j = mk('line', { id: L.id }, { title: `ลากสายอินเทอร์เน็ตเสริม ${P.n}`, from: ISPS[P.isp].n, price: P.price, dur: [60, 120], win: a.slot === 'pm' ? 'pm' : 'am', day: a.day }); a.v39 = j.id; a.day = j.day; }
    },
    done(j) { const L = (Net36.st().lines || []).find(l => l.id === j.ref.id); if (L) L.appt = null; },
    cancel(j) { const L = (Net36.st().lines || []).find(l => l.id === j.ref.id); if (L) L.appt = null; },
    alive(j) { const L = (Net36.st().lines || []).find(l => l.id === j.ref.id); return !!(L && L.appt && L.appt.v39 === j.id); },
  };
  // -- electricity meter / phase / TOU / solar (grid.js): the technician visit of an approved request
  ADAPT.grid = {
    scan() {
      for (const a of Grid.st().apps || []) {
        if (a.st !== 'install' || a.job39) continue;
        const nm = (typeof APP_KIND !== 'undefined' && APP_KIND[a.kind]) ? APP_KIND[a.kind].n : 'งานการไฟฟ้า';
        const j = mk('grid', { no: a.no }, { title: `${nm} (คำร้อง ${a.no})`, from: 'การไฟฟ้าอำเภอสุขใจ', price: a.fee || 1500, dur: [60, 120], win: 'am', day: a.inst });
        a.job39 = j.id; a.inst = FAR; a.note = `นัดช่าง ${dayShort(j.day)} ${WIN[j.win].n}`;
      }
    },
    done(j) {
      const a = (Grid.st().apps || []).find(x => x.no === j.ref.no); if (!a) return;
      a.job39 = null; a.inst = S.day - 1;
      const E0 = Grid.st(), others = E0.apps.filter(x => x !== a), saved = others.map(x => x.st);
      others.forEach(x => { x.st = 'v39hold:' + x.st; });
      try { _gridHour(13); } finally { others.forEach((x, i) => { x.st = saved[i]; }); }
    },
    cancel(j) { const a = (Grid.st().apps || []).find(x => x.no === j.ref.no); if (a) { a.job39 = null; a.inst = S.day + 1; } },
    alive(j) { const a = (Grid.st().apps || []).find(x => x.no === j.ref.no); return !!(a && a.job39 === j.id); },
  };
  let _gridHour = () => { };
  // -- water: meter and drilled well (life3.js)
  ADAPT.water = {
    scan() {
      const w = Water.st();
      if (w.meterDay && w.meterDay < FAR / 2 && need('water', { k: 'meter' })) { const j = mk('water', { k: 'meter' }, { title: 'ติดตั้งมาตรวัดน้ำประปา', from: 'การประปาส่วนภูมิภาค', price: 3500, dur: [45, 90], win: 'am', day: w.meterDay }); w.meterDay = FAR; w.v39m = j.id; }
      if (w.wellDay && w.wellDay < FAR / 2 && need('water', { k: 'well' })) { const j = mk('water', { k: 'well' }, { title: 'เจาะบ่อบาดาล 60 ม.', from: 'ช่างเจาะบาดาล', price: 52000, dur: [150, 180], win: 'am', day: w.wellDay }); w.wellDay = FAR; w.v39w = j.id; }
    },
    done(j) {
      const w = Water.st();
      if (j.ref.k === 'meter') { w.meter = true; w.meterDay = 0; msg('การประปาสุขใจ', 'ติดตั้งมาตรวัดน้ำเรียบร้อย เปิดใช้น้ำได้แล้ว บิลค่าน้ำมาทุกสัปดาห์', false); }
      else { w.well = 1; w.wellDay = 0; msg('ช่างเจาะบาดาล', 'เจาะบ่อบาดาลเสร็จแล้ว น้ำใส ปริมาณ 2 ลบ.ม./ชม.', false); }
    },
    cancel(j) { const w = Water.st(); if (j.ref.k === 'meter') w.meterDay = 0; else w.wellDay = 0; },
    alive(j) { const w = Water.st(); return j.ref.k === 'meter' ? w.meterDay === FAR : w.wellDay === FAR; },
  };
  // -- IT / electricity / water / energy upgrades (v23_it.js)
  const ITITEMS = () => { const o = {}; try { const X = V23.IT.ITX; for (const m of Object.keys(X)) for (const it of X[m]) o[it.k] = it; } catch (e) { } return o; };
  ADAPT.itx = {
    scan() {
      const own = (S.v23it && S.v23it.own) || {}, all = ITITEMS();
      for (const k of Object.keys(own)) {
        const o = own[k]; if (!o || o.job39 || o.applied || !(o.day > S.day) || o.day >= FAR / 2) continue;
        const it = all[k]; const j = mk('itx', { k }, { title: `ติดตั้ง ${it ? it.n : k}`, from: 'ช่างติดตั้ง', price: it ? it.p : 5000, dur: [60, Math.min(180, 60 + Math.round((it ? it.p : 5000) / 400))], win: 'am', day: o.day });
        o.job39 = j.id; o.day = FAR;
      }
    },
    done(j) { const o = ((S.v23it || {}).own || {})[j.ref.k]; if (o) { o.day = S.day; o.job39 = null; } },
    cancel(j) { const o = ((S.v23it || {}).own || {})[j.ref.k]; if (o) { o.day = S.day; o.job39 = null; } },
    alive(j) { const o = ((S.v23it || {}).own || {})[j.ref.k]; return !!(o && o.job39 === j.id); },
  };
  // -- smart-home hub tiers and devices (v25_home.js)
  const TIERP = [6500, 18000, 35000, 70000, 150000];
  ADAPT.home = {
    scan() {
      const s = S.v25; if (!s || !s.homes) return;
      for (const hid of Object.keys(s.homes)) {
        const h = s.homes[hid];
        if (h.up && !h.up.job39 && h.up.day > S.day && h.up.day < FAR / 2) {
          const j = mk('home', { hid, up: h.up.n }, { title: `ติดตั้งระบบบ้านอัจฉริยะระดับ ${h.up.n}`, from: 'ช่างติดตั้ง', price: TIERP[h.up.n - 1] || 6500, dur: [60, 150], win: 'am', day: h.up.day }); h.up.job39 = j.id; h.up.day = FAR;
        }
        for (const k of Object.keys(h.own || {})) {
          const o = h.own[k]; if (!o || o.job39 || o.msg || !(o.day > S.day) || o.day >= FAR / 2) continue;
          let dv = null; try { dv = (V23.HOME.DV || []).find(x => x.k === k); } catch (e) { }
          const j = mk('home', { hid, dev: k }, { title: `ติดตั้ง ${dv ? dv.n : 'อุปกรณ์บ้านอัจฉริยะ'}`, from: 'ช่างติดตั้ง', price: dv ? dv.p : 2000, dur: [30, 90], win: 'am', day: o.day }); o.job39 = j.id; o.day = FAR;
        }
      }
    },
    done(j) {
      const h = ((S.v25 || {}).homes || {})[j.ref.hid]; if (!h) return;
      if (j.ref.up) { if (h.up && h.up.job39 === j.id) h.up.day = S.day; } else { const o = (h.own || {})[j.ref.dev]; if (o) { o.day = S.day; o.job39 = null; } }
    },
    cancel(j) { const h = ((S.v25 || {}).homes || {})[j.ref.hid]; if (!h) return; if (j.ref.up) { if (h.up) h.up.day = S.day; } else { const o = (h.own || {})[j.ref.dev]; if (o) o.day = S.day; } },
    alive(j) { const h = ((S.v25 || {}).homes || {})[j.ref.hid]; if (!h) return false; return j.ref.up ? !!(h.up && h.up.job39 === j.id) : !!((h.own || {})[j.ref.dev] && h.own[j.ref.dev].job39 === j.id); },
  };
  // -- moving wired gear / running cable (v37_move.js)
  ADAPT.move = {
    scan() {
      if (!window.Move37) return;
      for (const p of Move37.st().pend || []) {
        if (p.job39 || !(p.done > S.day) || p.done >= FAR / 2) continue;
        let nm = 'อุปกรณ์'; try { const r = Move37.list().find(x => x.key === p.key); if (r) nm = r.n; } catch (e) { }
        const j = mk('move', { key: p.key }, { title: `ย้าย/เดินสาย ${nm}`, from: 'ช่างวางระบบ', price: p.cost || 1500, dur: [60, 180], win: 'am', day: p.done });
        p.job39 = j.id; p.done = FAR;
      }
    },
    done(j) { const p = (Move37.st().pend || []).find(x => x.key === j.ref.key); if (p) { p.done = S.day; p.job39 = null; try { Move37.finishDue(); } catch (e) { console.warn(e); } } },
    cancel(j) { const p = (Move37.st().pend || []).find(x => x.key === j.ref.key); if (p) p.done = S.day; },
    alive(j) { const p = (Move37.st().pend || []).find(x => x.key === j.ref.key); return !!(p && p.job39 === j.id); },
  };

  function scanAll() {
    for (const k of Object.keys(ADAPT)) { try { ADAPT[k].scan(); } catch (e) { if (!scanAll._w) { scanAll._w = 1; console.warn('v39 scan', k, e); } } }
    // jobs whose owner state vanished (cancelled contract, deleted gear, old save edits) are cancelled quietly
    for (const j of st().jobs) { if (!active(j) || j.st === 'working') continue; const A = ADAPT[j.ad]; try { if (A && A.alive && !A.alive(j)) j.st = 'cancel'; } catch (e) { } }
    const fresh = st().jobs.filter(j => j.fresh && active(j));
    return fresh;
  }

  // ===== window picker =====
  let pickId = null;
  function pick(id) {
    const j = st().jobs.find(x => x.id === id); if (!j || (j.st !== 'booked' && j.st !== 'enroute')) return;
    pickId = id; j.fresh = 0; UI.open('เลือกวันและช่วงเวลาที่ช่างมา', null, pickHtml);
  }
  const pickHtml = () => {
    const j = st().jobs.find(x => x.id === pickId); if (!j) return '<p class="empty">ไม่พบนัดหมาย</p>';
    const days = avail();
    return `<p class="lead">🔧 ${E(j.title)}<br><small class="dim">${E(j.from)} · ค่าบริการ ${baht0(j.price)} · ช่างใช้เวลาประมาณ ${j.dur} นาที เสร็จแล้วใช้งานได้ทันที</small></p>
      <p class="lead">นัดปัจจุบัน: <b>${dayShort(j.day)} ${WIN[j.win].n} ${hm(WIN[j.win].w[0] * 60)}–${hm(WIN[j.win].w[1] * 60)} น.</b></p>
      ${days.map(d => `<h5>${dayFull(d)}</h5><div class="row">${Object.keys(WIN).map(w => `<button class="btn ${j.day === d && j.win === w ? '' : 'ghost'}" data-a="a39win" data-d="${d}" data-w="${w}">${WIN[w].n} ${hm(WIN[w].w[0] * 60)}–${hm(WIN[w].w[1] * 60)}</button>`).join('')}</div>`).join('')}
      <p class="dim">ช่างจะมาถึงภายในช่วงเวลาที่เลือก นัดได้ภายใน 1–2 วันทำการ (จันทร์–เสาร์ ไม่ใช่วันหยุดราชการ)</p>
      <div class="row end"><button class="btn ghost" data-a="a39cancel" data-v="${j.id}">ยกเลิกนัดนี้</button><button class="btn" data-a="close">ตกลง</button></div>`;
  };
  UI.H.a39win = d => { if (pickId) { resched(pickId, d.d, d.w); try { UI.renderBody(); } catch (e) { } } };
  UI.H.a39cancel = d => { cancel(d.v); UI.close(); };
  UI.H.a39pick = d => pick(d.v);
  // after a booking made from a screen: open the picker for the new job
  function afterAction() { const f = scanAll(); if (f.length && !G.simulating) setTimeout(() => pick(f[0].id), 150); }

  // wrap the UI actions that create a technician visit so the customer picks the window right away
  const wrapAct = (obj, name) => { try { const o = obj[name]; if (typeof o !== 'function') return; obj[name] = function () { const r = o.apply(this, arguments); try { afterAction(); } catch (e) { console.warn('v39 act', name, e); } return r; }; } catch (e) { } };
  wrapAct(ISP, 'order'); wrapAct(Grid, 'pay'); wrapAct(Water, 'buy'); wrapAct(Grid, 'apply');
  if (window.Net36) wrapAct(Net36, 'order');
  if (window.Move37) wrapAct(Move37, 'doMove');
  for (const h of ['v23buy', 'v25home', 'h25', 'home25']) if (UI.H[h]) wrapAct(UI.H, h);
  // handlers of the smart-home centre use data-a names of its own: wrap every handler whose name looks like it
  for (const k of Object.keys(UI.H)) if (/^(h25|v25h|v25d|home25)/.test(k) && !UI.H[k]._a39) { wrapAct(UI.H, k); UI.H[k]._a39 = 1; }
  // grid hourly work: keep the original for the technician's completion; installations parked at FAR never fire by themselves
  if (typeof Grid.appsHour === 'function') _gridHour = Grid.appsHour.bind(Grid);
  // ISP technician logic of the old visits must not fire for v39-owned appointments
  { const _h = ISP.hour.bind(ISP);
    ISP.hour = function (h) {
      const s = this.st(), a = s.appt, own = a && a.v39; const masked = [];
      if (own) s.appt = null;
      try { for (const L of ((window.Net36 && Net36.st().lines) || [])) if (L.appt && L.appt.v39) { masked.push([L, L.appt]); L.appt = null; } } catch (e) { }
      try { _h(h); } finally { if (own && !s.appt) s.appt = a; for (const [L, ap] of masked) if (!L.appt) L.appt = ap; }
    };
  }

  // ===== clock: scan + process on every game tick (cheap) =====
  { const _t = tick; let lastScan = -1;
    tick = function (m) {
      const k = S.day * 144 + Math.floor(S.time / 10);
      if (k !== lastScan) { lastScan = k; try { scanAll(); } catch (e) { } }
      _t.apply(this, arguments);
      try { procJobs(); } catch (e) { console.warn('v39 proc', e); }
      try { remind(); } catch (e) { }
    };
  }

  // ===================== the calendar registry =====================
  const TYPES = { tech: ['🔧', '#f59e0b', 'ช่าง/ติดตั้ง'], med: ['🩺', '#ef4444', 'แพทย์/สุขภาพ'], gov: ['🏛️', '#3b82f6', 'ราชการ/เอกสาร'], court: ['⚖️', '#8b5cf6', 'ศาล'], trip: ['🚆', '#14b8a6', 'เดินทาง'], ship: ['📦', '#a16207', 'พัสดุ/ส่งของ'], money: ['💰', '#22c55e', 'การเงิน/บิล'], school: ['🎒', '#ec4899', 'เรียน/ลูก'], fest: ['🎉', '#f97316', 'วันสำคัญ'], me: ['📝', '#94a3b8', 'นัดของฉัน'], love: ['💕', '#f43f5e', 'ความรัก/ครอบครัว'], biz: ['🏪', '#0ea5e9', 'ธุรกิจ'] };
  const SRC = [];
  const reg = (name, fn) => SRC.push({ name, fn });
  const ev = (c, d, t, t2, i, n, x, app, key) => ({ c, d, t: t == null ? null : t, t2: t2 == null ? null : t2, i: i || TYPES[c][0], n, x: x || '', app: app || '', key: key || (c + ':' + d + ':' + n) });

  reg('jobs', (a, b, out) => { for (const j of st().jobs) { if (!active(j)) continue; const d = j.st === 'booked' || j.late === 0 ? j.day : Math.floor(j.arrive / 1440); if (d < a || d > b) continue;
    const w = WIN[j.win].w, eta = j.arrive % 1440, status = j.st === 'booked' ? `ช่วง ${hm(w[0] * 60)}–${hm(w[1] * 60)} น.` : j.st === 'enroute' ? `ช่างกำลังมา ถึงประมาณ ${hm(eta)} น.` : `ช่างกำลังติดตั้ง จะเสร็จประมาณ ${hm((j.arrive + j.dur) % 1440)} น.`;
    const e = ev('tech', d, w[0] * 60, w[1] * 60, '🔧', j.title, `${j.from} · ${status}${j.late ? '' : ''}`, 'appt39', 'job:' + j.id); e.job = j.id; out.push(e); } });
  reg('civic', (a, b, out) => { try { const c = (S.civic || {}).appt || []; for (const x of c) if (x.day >= a && x.day <= b) { const X = typeof CV_HOS !== 'undefined' ? CV_HOS[x.k] : null; out.push(ev('med', x.day, 8 * 60, 12 * 60, X ? X.i : '🩺', `นัด${X ? X.n : 'โรงพยาบาล'}`, `${x.h || 'โรงพยาบาลสุขใจ'} · ช่วงเช้า`, 'civhos')); } } catch (e) { } });
  reg('health', (a, b, out) => { try { if (!window.Health31) return; for (const x of Health31.H().appt || []) if (x.day >= a && x.day <= b) { const sp = Health31.SPEC[x.sp] || [x.sp, '🩺']; out.push(ev('med', x.day, x.slot === 'am' ? 9 * 60 : 13 * 60, x.slot === 'am' ? 12 * 60 : 16 * 60, sp[1], `นัดพบ${sp[0]}`, `${x.h || 'โรงพยาบาล'} · ${x.slot === 'am' ? 'ช่วงเช้า' : 'ช่วงบ่าย'}`, 'health31', 'hl' + x.id)); } } catch (e) { } });
  reg('court', (a, b, out) => { try { if (!window.Court31) return; for (const c of Court31.X().cases || []) { let d = 0, w = ''; if (c.st === 'hearing') { d = c.hear; w = 'นัดสืบพยาน'; } else if (c.st === 'notice') { d = c.due; w = 'ครบกำหนดยื่นคำให้การ'; } else if (c.st === 'mediation') { d = c.due; w = 'นัดไกล่เกลี่ย'; } if (d >= a && d <= b) out.push(ev('court', d, 9 * 60, 12 * 60, '⚖️', `${w} · คดี #${c.id}`, `${(Court31.T[c.t] || {}).n || ''}${c.opp ? ' · ' + c.opp : ''}`, 'court31', 'cs' + c.id + w)); } } catch (e) { } });
  reg('travel', (a, b, out) => { try { if (!window.Travel31) return; const nd = {}; try { for (const n of Travel31.nodes()) nd[n.key] = n.n; } catch (e) { } for (const t of Travel31.st().tix || []) if (t.st === 'booked' && t.day >= a && t.day <= b) out.push(ev('trip', t.day, t.depMin, (t.depMin || 0) + (t.dur || 0), '🚆', `เดินทาง ${nd[t.from] || t.from} → ${nd[t.to] || t.to}`, `ออก ${hm(t.depMin || 0)} น. · ตั๋ว ${t.pnr || ''}`, 'travel31', 'tx' + t.id)); } catch (e) { } });
  reg('docs', (a, b, out) => { try { if (window.Docs26) for (const p of Docs26.st().apps || []) if (p.st === 'pending' && p.due >= a && p.due <= b) { const A = (Docs26.apps || []).find(z => z.k === p.k); out.push(ev('gov', p.due, 8 * 60, 18 * 60, '📄', `รับผลคำขอ${A ? ' ' + A.n : ''}`, `เลขที่ ${p.no}`, 'docs26', 'dc' + p.no)); }
    if (typeof Gov24 !== 'undefined') for (const p of Gov24.st().apps || []) if (p.st === 'pending' && p.due >= a && p.due <= b) { const D = Gov24.docs[p.doc] || {}; out.push(ev('gov', p.due, 8 * 60, 18 * 60, '🏛️', `รับเอกสาร ${D.n || p.doc}`, p.offName || '', 'gov24', 'gv' + p.no)); }
    if (window.Agency26) for (const p of Agency26.st().apps || []) if (p.st === 'pending' && p.due >= a && p.due <= b) out.push(ev('gov', p.due, 8 * 60, 18 * 60, '🏛️', `รับผลคำขอ ${p.n || p.k || 'หน่วยงาน'}`, '', 'agency26', 'ag' + (p.no || p.k) + p.due)); } catch (e) { } });
  reg('docexp', (a, b, out) => { try { if (typeof Gov24 === 'undefined') return; const docs = (S.gov24 || {}).docs || {}; for (const k of Object.keys(docs)) { const d = docs[k]; if (d && d.exp && d.exp >= a && d.exp <= b && d.exp - S.day <= 60) out.push(ev('gov', d.exp, null, null, '⏰', `เอกสารหมดอายุ: ${(Gov24.docs[k] || {}).n || k}`, d.temp ? 'บัตรชั่วคราว — ไปทำบัตรจริงที่ศูนย์ราชการ' : 'ต่ออายุก่อนวันนี้', 'gov24', 'ex' + k)); } } catch (e) { } });
  reg('grid', (a, b, out) => { try { for (const x of Grid.st().apps || []) if (x.st === 'wait' && x.insp >= a && x.insp <= b) out.push(ev('tech', x.insp, 10 * 60, 12 * 60, '🔎', `ตรวจหน้างานคำร้อง ${x.no}`, 'การไฟฟ้าอำเภอสุขใจ', 'grid', 'in' + x.no)); } catch (e) { } });
  reg('orders', (a, b, out) => { try { if (window.Mall36) for (const o of Mall36.st().orders || []) if (o.status === 'new') { const d = Math.floor(o.due / 1440); if (d >= a && d <= b) out.push(ev('ship', d, o.due % 1440, null, '📦', `พัสดุออนไลน์ #${o.id}`, `${o.items.length} รายการ · ${baht0(o.total)}`, 'mall36', 'od' + o.id)); }
    if (window.PCShop36) for (const j of PCShop36.st().jobs || []) if (j.ready >= a && j.ready <= b) out.push(ev('ship', j.ready, 9 * 60, 18 * 60, '🖥️', `รับคอมที่ประกอบ: ${j.name}`, 'ร้านประกอบคอมพิวเตอร์', '', 'pc' + j.name + j.ready)); } catch (e) { } });
  reg('bills', (a, b, out) => { try { const bl = S.billDue; if (bl && bl.day >= a && bl.day <= b) out.push(ev('money', bl.day, null, null, '🧾', 'ครบกำหนดชำระค่าน้ำค่าไฟ', `ไฟ ${baht0(bl.elec)} · น้ำ ${baht0(bl.water)}`, 'grid', 'bill' + bl.day));
    const ins = S.ins || {}; for (const k of Object.keys(ins)) if (typeof ins[k] === 'number' && ins[k] >= a && ins[k] <= b && ins[k] - S.day <= 30) out.push(ev('money', ins[k], null, null, '🛡️', `ประกัน (${k}) หมดอายุ`, 'ต่อได้ที่แอปธนาคาร', 'bank', 'ins' + k)); } catch (e) { } });
  reg('house', (a, b, out) => { try { const x = S.v36h; if (!x) return; if (x.permit && x.permit.due >= a && x.permit.due <= b) out.push(ev('gov', x.permit.due, null, null, '📄', 'ใบอนุญาตต่อเติมบ้านออก', '', 'house36', 'hp' + x.permit.due)); if (x.proj && x.proj.done >= a && x.proj.done <= b) out.push(ev('biz', x.proj.done, null, null, '🏗️', 'ส่งมอบงานต่อเติมบ้าน', '', 'house36', 'hj' + x.proj.done)); } catch (e) { } });
  reg('love', (a, b, out) => { try { const r = S.rel || {}; if (r.wedding && r.wedding >= a && r.wedding <= b && r.stage === 'engaged') out.push(ev('love', r.wedding, 10 * 60, null, '💍', 'งานแต่งงาน', r.partner || '', 'people', 'wd' + r.wedding)); } catch (e) { } });
  reg('fest', (a, b, out) => { try { if (!window.Cal36) return; for (let d = a; d <= b && d <= a + 62; d++) { const e = Cal36.event(d); if (e) out.push(ev('fest', d, null, null, e.i || '🎉', e.n, e.hol ? 'วันหยุดราชการ' : 'วันสำคัญ', '', 'fs' + d)); } } catch (e) { } });
  reg('birth', (a, b, out) => { try { if (!window.Ppl36 || !Ppl36.myDob || !window.Cal36) return; const bd = Ppl36.myDob(); if (!bd) return; for (let d = Math.max(a, S.day); d <= b && d <= a + 400; d++) { const t = Cal36.date(d); if (t.m === bd.m && t.dom === bd.d) out.push(ev('love', d, null, null, '🎂', 'วันเกิดของคุณ', '', '', 'bd' + d)); } } catch (e) { } });
  reg('notes', (a, b, out) => { for (const n of st().notes) if (n.d >= a && n.d <= b) { const e = ev('me', n.d, n.t, null, '📝', n.n, n.x || '', 'appt39', 'nt' + n.id); e.note = n.id; out.push(e); } });
  reg('kids', (a, b, out) => { try { if (!window.Kids31) return; const K = Kids31.K(); const evs = K.events || K.cal || []; for (const x of evs) if (x.day >= a && x.day <= b) out.push(ev('school', x.day, null, null, x.i || '🎒', x.n || x.t || 'กิจกรรมโรงเรียน', x.x || '', 'kids31', 'kd' + (x.id || x.day))); } catch (e) { } });
  reg('farm', (a, b, out) => { try { if (!window.Farm31) return; for (const c of Farm31.st().contracts || []) if (c.due >= a && c.due <= b) out.push(ev('biz', c.due, null, null, '🌾', `ส่งมอบตามสัญญา ${c.n || c.crop || c.k || ''}`, '', 'farm31', 'fc' + (c.id || c.due))); } catch (e) { } });

  function list(a, b) {
    const out = []; for (const s of SRC) { try { s.fn(a, b, out); } catch (e) { } }
    out.sort((x, y) => x.d - y.d || (x.t == null ? -1 : x.t) - (y.t == null ? -1 : y.t));
    return out;
  }

  // ===== reminders: the evening before and one hour before =====
  function remind() {
    if (G.simulating || !G.started) return;
    const s = st(), now = S.day * 1440 + S.time, k = S.day * 6 + Math.floor(S.time / 240);
    if (remind._k === k) return; remind._k = k;
    const L = list(S.day, S.day + 1);
    for (const e of L) {
      if (e.c === 'fest' || e.c === 'tech' && e.job) continue;
      const kt = 'T' + e.key + e.d;
      if (e.d === S.day + 1 && S.time >= 17 * 60 && !s.rem['D' + kt]) { s.rem['D' + kt] = 1; msg('ปฏิทิน', `พรุ่งนี้: ${e.n}${e.t != null ? ' เวลา ' + hm(e.t) + ' น.' : ''}`, true); }
    }
    if (Object.keys(s.rem).length > 400) s.rem = {};
  }
  // one hour before a timed item (checked every 10 game minutes through the tick wrapper)
  function remindHour() {
    if (G.simulating || !G.started) return; const s = st();
    for (const e of list(S.day, S.day)) { if (e.t == null || e.c === 'fest' || (e.job)) continue; const kt = 'H' + e.key + e.d; if (!s.rem[kt] && S.time >= e.t - 60 && S.time < e.t) { s.rem[kt] = 1; msg('ปฏิทิน', `อีก 1 ชั่วโมง: ${e.n} เวลา ${hm(e.t)} น.`, true); toast(`อีก 1 ชม.: ${e.n}`, '⏰'); } }
  }
  { const _t2 = tick; let last = -1; tick = function () { const r = _t2.apply(this, arguments); const k = S.day * 144 + Math.floor(S.time / 10); if (k !== last) { last = k; try { remindHour(); } catch (e) { } } return r; }; }

  // ===================== phone UI =====================
  const view = { off: 0, sel: null, tab: 0, f: '' };
  const itemCard = e => {
    const T = TYPES[e.c] || TYPES.me, tm = e.t == null ? 'ทั้งวัน' : (e.t2 != null && e.t2 !== e.t ? `${hm(e.t)}–${hm(e.t2)}` : hm(e.t));
    let extra = '';
    if (e.job) { const j = st().jobs.find(x => x.id === e.job); if (j) { const abs = S.day * 1440 + S.time, left = j.arrive - abs;
      extra = `<p class="dim">${j.st === 'booked' ? `ช่างจะถึงภายใน ${left > 0 ? (left >= 1440 ? Math.floor(left / 1440) + ' วัน ' : '') + (Math.floor((left % 1440) / 60)) + ' ชม. ' + (left % 60) + ' นาที' : 'ไม่นาน'}` : j.st === 'enroute' ? '🚐 ช่างกำลังเดินทางมา' : '🔧 ช่างกำลังติดตั้ง'}</p>`
        + (j.st === 'booked' || j.st === 'enroute' ? `<div class="row"><button class="btn ghost" data-a="a39pick" data-v="${j.id}">เปลี่ยนวัน/ช่วงเวลา</button><button class="btn ghost" data-a="a39cancel2" data-v="${j.id}">ยกเลิก</button></div>` : ''); } }
    if (e.note) extra = `<div class="row"><button class="btn ghost" data-a="a39delnote" data-v="${e.note}">ลบ</button></div>`;
    const open = e.app && !e.job ? `<button class="btn ghost" data-a="a39open" data-v="${e.app}">เปิดแอป</button>` : '';
    return `<div class="card"><div class="ci" style="background:${T[1]}22">${e.i}</div><div class="cb"><h4>${E(e.n)}</h4><p class="dim">${E(dayShort(e.d))} · ${tm}${e.x ? ' · ' + E(e.x) : ''}</p>${extra}${open ? `<div class="row">${open}</div>` : ''}</div></div>`;
  };
  UI.H.a39open = d => { try { UI.H.app({ v: d.v }); } catch (e) { } };
  UI.H.a39cancel2 = d => UI.confirm('ยกเลิกนัดช่าง?', 'ถ้ายกเลิก ต้องกดขอบริการใหม่อีกครั้ง (ค่าบริการที่จ่ายไปแล้วไม่ถูกคืนในเกมนี้)', 'ยกเลิกนัด', () => cancel(d.v));
  UI.H.a39delnote = d => { const s = st(); s.notes = s.notes.filter(n => n.id !== +d.v); };
  UI.H.a39cal = d => { if (d.v === 'prev') view.off--; else if (d.v === 'next') view.off++; else if (d.v === 'today') { view.off = 0; view.sel = S.day; } };
  UI.H.a39sel = d => { view.sel = +d.v; };
  UI.H.a39tab = d => { view.tab = +d.v; };
  UI.H.a39add = () => {
    const g = id => (document.getElementById(id) || {}).value, n = (g('a39n') || '').trim(), off = Math.max(0, Math.min(365, parseInt(g('a39d'), 10) || 0)), tm = (g('a39t') || '').trim();
    if (!n) { UI.toast('พิมพ์ชื่อนัดก่อน', 'ℹ️'); return; }
    let t = null; const m = tm.match(/^(\d{1,2}):(\d{2})$/); if (m) t = Math.min(23, +m[1]) * 60 + Math.min(59, +m[2]);
    const s = st(); s.notes.push({ id: ++s.n, d: S.day + off, t, n: n.slice(0, 40), x: '' }); view.sel = S.day + off; UI.toast('บันทึกนัดของฉันแล้ว', '📝');
  };

  const monthHtml = () => {
    if (!window.Cal36) return '';
    const cur = Cal36.date(); let y = cur.y, m = cur.m + view.off; y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
    const first = Math.floor(Date.UTC(y, m, 1) / 86400000), dim = Cal36.daysIn(y, m), dow1 = (((first + 3) % 7) + 7) % 7;
    const a = Cal36.dayOf(y, m, 1), b = Cal36.dayOf(y, m, dim), L = list(a, b), by = {};
    for (const e of L) (by[e.d] = by[e.d] || []).push(e);
    let cells = ''; for (let i = 0; i < dow1; i++) cells += '<i></i>';
    for (let dom = 1; dom <= dim; dom++) {
      const gd = Cal36.dayOf(y, m, dom), es = by[gd] || [], dowi = (dow1 + dom - 1) % 7, sel = view.sel === gd, hol = es.some(e => e.c === 'fest' && /หยุด/.test(e.x));
      const dots = [...new Set(es.map(e => e.c))].slice(0, 4).map(c => `<u style="background:${(TYPES[c] || TYPES.me)[1]}"></u>`).join('');
      cells += `<button class="a39c ${gd === S.day ? 'now' : ''} ${sel ? 'sel' : ''} ${dowi >= 5 ? 'we' : ''} ${hol ? 'ho' : ''}" data-a="a39sel" data-v="${gd}"><span>${dom}</span><em>${dots}</em>${es.length > 1 ? `<b>${es.length}</b>` : ''}</button>`;
    }
    const css = `<style>.a39g{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;text-align:center}.a39g .h{font-size:11px;opacity:.7}.a39c{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;min-height:44px;padding:3px 0;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:inherit;font:inherit;cursor:pointer}.a39c span{font-size:13px}.a39c em{display:flex;gap:2px;min-height:6px;margin-top:3px}.a39c u{display:block;width:6px;height:6px;border-radius:50%}.a39c b{position:absolute;top:1px;right:3px;font-size:9px;opacity:.8}.a39c.now{border-color:#ffd35c;box-shadow:0 0 0 1px #ffd35c inset}.a39c.sel{background:rgba(255,211,92,.2)}.a39c.we span{color:#ff9aa8}.a39c.ho{background:rgba(255,120,120,.18)}.a39leg{display:flex;flex-wrap:wrap;gap:6px 10px;font-size:11px;margin:6px 0}.a39leg i{font-style:normal}.a39leg u{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:3px}</style>`;
    const sel = view.sel == null ? S.day : view.sel, dayL = list(sel, sel).filter(e => e.d === sel);
    return css + `<div class="row" style="justify-content:space-between;align-items:center"><button class="btn ghost" data-a="a39cal" data-v="prev">‹</button><b>${Cal36.MON[m]} พ.ศ. ${y + 543}</b><button class="btn ghost" data-a="a39cal" data-v="next">›</button></div>
      <div class="a39g" style="margin-top:6px">${Cal36.DAYS.map(d => `<div class="h">${d}</div>`).join('')}${cells}</div>
      <div class="a39leg">${Object.keys(TYPES).map(c => `<i><u style="background:${TYPES[c][1]}"></u>${TYPES[c][2]}</i>`).join('')}</div>
      ${view.off ? '<div class="row end"><button class="btn ghost" data-a="a39cal" data-v="today">กลับเดือนนี้</button></div>' : ''}
      <h5>${E(dayFull(sel))}${sel === S.day ? ' (วันนี้)' : ''}</h5>${dayL.length ? `<div class="grid">${dayL.map(itemCard).join('')}</div>` : '<p class="empty">ไม่มีนัดหมายในวันนี้</p>'}`;
  };
  const nextHtml = () => {
    const L = list(S.day, S.day + 90).filter(e => e.c !== 'fest' && e.c !== 'love' || e.c === 'love' && e.i !== '🎂').slice(0, 14).filter(e => e.d > S.day || e.t == null || e.t >= S.time - 30 || e.job);
    const act = st().jobs.filter(j => active(j));
    return `<h5>🔧 งานช่างที่นัดไว้ (${act.length})</h5>${act.length ? `<div class="grid">${list(S.day, S.day + 30).filter(e => e.job).map(itemCard).join('')}</div>` : '<p class="empty">ไม่มีนัดช่าง</p>'}
      <h5>📅 นัดหมายถัดไป</h5>${L.length ? `<div class="grid">${L.filter(e => !e.job).slice(0, 10).map(itemCard).join('')}</div>` : '<p class="empty">ยังไม่มีนัดหมายที่จะถึง</p>'}`;
  };
  const addHtml = () => `<h5>📝 เพิ่มนัดของฉัน</h5><div class="card"><div class="ci">📝</div><div class="cb"><p class="dim">ชื่อนัด</p><input id="a39n" maxlength="40" placeholder="เช่น ไปตลาดริมทะเล" style="width:100%"><p class="dim">อีกกี่วันจากวันนี้ (0 = วันนี้)</p><input id="a39d" type="number" min="0" max="365" value="1" style="width:100%"><p class="dim">เวลา (เช่น 14:30 หรือเว้นว่าง)</p><input id="a39t" placeholder="HH:MM" style="width:100%"><div class="row end"><button class="btn" data-a="a39add">บันทึกนัด</button></div></div></div>
    ${st().notes.length ? `<h5>นัดของฉันทั้งหมด</h5><div class="grid">${st().notes.slice().sort((x, y) => x.d - y.d).map(n => { const e = ev('me', n.d, n.t, null, '📝', n.n, '', 'appt39', 'nt' + n.id); e.note = n.id; return itemCard(e); }).join('')}</div>` : ''}`;
  const TABN = ['📅 ปฏิทิน', '⏭️ ถัดไป & ช่าง', '📝 เพิ่มนัด'];
  const app = () => {
    const f = st().jobs.filter(j => j.fresh && active(j)); const tabs = `<div class="row">${TABN.map((n, i) => `<button class="btn ${view.tab === i ? '' : 'ghost'}" data-a="a39tab" data-v="${i}">${n}</button>`).join('')}</div>`;
    return tabs + (view.tab === 0 ? monthHtml() : view.tab === 1 ? nextHtml() : addHtml());
  };
  Phone.apps.cal36 = app;                                   // the calendar app is the appointment calendar now
  Phone.apps.appt39 = function () { view.tab = 1; return app(); };
  if (typeof APPS !== 'undefined' && !APPS.some(a => a.id === 'appt39')) APPS.splice(Math.min(APPS.length, 4), 0, { id: 'appt39', i: '🗓️', n: 'นัดหมายทั้งหมด' });
  // the old 'นัดหมาย' (invites) app keeps its own list and gets the unified one on top
  { const _inv = Phone.apps.invite;
    if (_inv) Phone.apps.invite = function () { return `<div class="row"><button class="btn" data-a="a39open" data-v="appt39">🗓️ เปิดปฏิทินนัดหมายทั้งหมด</button></div>` + nextHtml() + _inv.call(this); };
  }
  // phone home: next appointment shortcut line is shown by the calendar tab; badge when a technician is coming today
  window.Appt39 = { st, book, pick, cancel, resched, list, reg, scanAll, workday, avail, WIN, TYPES, active, procJobs, ADAPT, forceLate: id => { const j = st().jobs.find(x => x.id === id); if (j) { j.late = 1; j.lateMin = 90; j.lateNext = 0; setArrive(j); } return j; } };
  // old saves: pick up pending technician timers right away
  try { scanAll(); } catch (e) { }
});
