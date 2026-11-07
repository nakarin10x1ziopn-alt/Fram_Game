'use strict';
// ---------- v37 move: every camera and every piece of IT / technology gear can be taken down and put somewhere else.
// Placement works like the furniture mover (carry it in front of you, snap, rotate, pick the mount height) outdoors anywhere on the farm and indoors on any floor of the main house;
// wired gear is checked against its hub with a real cable run (stock cable is reused, a longer run needs a technician with a priced quote and 1-3 days of work),
// wireless gear against radio range, mains gear against a power point. Cameras re-aim from the new spot; everything dependent re-reads its position. ----------
V23.add('v37_move', () => {
  if (typeof Sec === 'undefined' || typeof DEV === 'undefined') return;
  const st = () => { const s = (S.v37 = S.v37 || {}); s.pos = s.pos || {}; s.pend = s.pend || []; s.stock = s.stock || {}; s.log = (s.log || []).filter(Boolean); s.n = s.n || 0; s.ui = s.ui || { tab: 0 }; return s; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const abs = () => S.day * 1440 + S.time;
  const baht = n => '฿' + Math.round(n).toLocaleString('en-US');
  const HP = () => (typeof HOUSE_POS !== 'undefined' ? HOUSE_POS : { x: -20, z: -32 });
  const TAU2 = Math.PI * 2;

  // =====================================================================================================
  // 1. the registry: everything that can be moved
  // =====================================================================================================
  const CLS = {   // how each kind of gear mounts, and what it needs
    cam: { mounts: ['pole', 'wall', 'eave', 'ceil'] }, ap: { mounts: ['ceil', 'wall', 'pole'] }, net: { mounts: ['shelf', 'floor', 'wall'] }, rack: { mounts: ['floor'] },
    ups: { mounts: ['floor', 'shelf'] }, box: { mounts: ['shelf', 'floor', 'wall'] }, sensor: { mounts: ['wall', 'ceil', 'pole'] }, door: { mounts: ['wall'] }, big: { mounts: ['floor'] },
    pc: { mounts: ['floor', 'desk'] }, smart: { mounts: ['wall', 'shelf', 'ceil', 'floor'] }, power: { mounts: ['wall'] },
  };
  const MT = {
    pole: { n: 'ติดเสา', y: 4.5, out: 1 }, wall: { n: 'ติดผนัง', y: 2.2 }, eave: { n: 'ใต้ชายคา', y: 2.6, out: 1 }, ceil: { n: 'ติดเพดาน', y: 2.9, in: 1 },
    shelf: { n: 'วางบนชั้น/โต๊ะ', y: 0.9 }, floor: { n: 'วางพื้น', y: 0 }, desk: { n: 'วางบนโต๊ะ', y: 0.8 },
  };
  const clsOf = D => D.t === 'cam' ? 'cam' : D.t === 'ap' ? 'ap' : D.t === 'rack' ? 'rack' : D.t === 'ups' ? 'ups' : (D.t === 'server' || D.t === 'pac' || D.t === 'fire') ? 'big' : ['router', 'switch', 'firewall', 'nas', 'nvr', 'dvr', 'alarm'].includes(D.t) ? 'net' : D.t === 'sensor' ? 'sensor' : (D.t === 'access' || D.t === 'lock') ? 'door' : 'box';
  const sitesOf = () => Object.keys(Sec.st().sites || { home: 1 });
  const keyOf = (site, uid) => (site === 'home' ? 'h:' : site + ':') + uid;
  const pcUid = pc => pc.uid37 || (pc.uid37 = 'pc' + (++st().n));
  const SMART_DEV = (() => { try { return null; } catch (e) { return null; } })();
  const smartNames = () => window.Home25 && Home25.DVK || null;
  const POWER = { inv: { n: 'อินเวอร์เตอร์โซลาร์ + แบตเตอรี่', i: '☀️', has: () => { try { const s = Power.st(); return s.panels + s.farm > 0; } catch (e) { return false; } }, wire: 1 }, mdb: { n: 'ตู้เมนเบรกเกอร์ (MDB)', i: '⚡', has: () => !!(V23.IT && V23.IT.has('e_mdb')), wire: 1 }, sg: { n: 'เครื่องกันไฟกระชาก', i: '🛡️', has: () => !!(V23.IT && V23.IT.has('e_surge')) } };
  const TECH_FURN = /ทีวี|หุ่นยนต์|กริ่ง|ชาร์จ|ฟอก|แอร์|คอม|ลำโพง|เซนเซอร์|กล้อง|เราเตอร์|สมาร์ท/;

  function list() {
    const out = [], s = st();
    for (const site of sitesOf()) for (const d of Sec.site(site).dev) {
      const D = DEV[d.k]; if (!D || D.t === 'hdd') continue;
      out.push({ key: keyOf(site, d.uid), kind: 'sec', site, uid: d.uid, d, D, n: D.n, i: D.i, cls: clsOf(D), cam: D.t === 'cam', wired: !D.wifiC && !D.solo && !['sensor', 'hdd'].includes(D.t) && !['isp', 'site', 'solo'].includes(d.p) && !!d.p, wifi: !!D.wifiC, solo: !!D.solo, watts: D.w || 0, analog: !!D.analog });
    }
    (S.pcs || []).forEach((pc, i) => out.push({ key: 'pc:' + pcUid(pc), kind: 'pc', site: 'home', pc, idx: i, n: pc.name || 'คอมพิวเตอร์', i: /โน้ตบุ๊ก|laptop|แท็บเล็ต/i.test(pc.name || '') ? '💻' : '🖥️', cls: 'pc', cam: false, wired: false, wifi: true, watts: 120, indoorOnly: 1 }));
    try { const hs = (S.v25 && S.v25.homes) || {}, DK = {}; for (const dd of ((V23.HOME && V23.HOME.DV) || [])) DK[dd.k] = dd; for (const hid of Object.keys(hs)) for (const k of Object.keys(hs[hid].own || {})) { const nm = DK[k] || { n: k, i: '🏠' }; out.push({ key: `v25:${hid}:${k}`, kind: 'v25', site: 'home', hid, k, n: nm.n, i: nm.i, cls: 'smart', cam: false, wired: false, wifi: !!nm.wifi, watts: 5 }); } } catch (e) { }
    for (const id of Object.keys(POWER)) if (POWER[id].has()) out.push({ key: 'power:' + id, kind: 'power', site: 'home', id, n: POWER[id].n, i: POWER[id].i, cls: 'power', cam: false, wired: true, wifi: false, watts: 0, indoorOnly: 1, heavy: 1 });
    try { for (const k of Object.keys(S.furn || {})) { const fi = furnInfo(k); if (S.furn[k] && TECH_FURN.test(fi.n)) out.push({ key: 'furn:' + k, kind: 'furn', site: 'home', k, n: fi.n, i: fi.i, cls: 'smart', cam: false, wired: false, wifi: false, watts: 60, indoorOnly: 1 }); } } catch (e) { }
    for (const k of Object.keys(s.stock)) { const r = s.stock[k]; out.push({ key: k, kind: 'stock', site: 'home', n: r.n, i: r.i, cls: r.cls || 'smart', stock: r, cam: false, wired: false, wifi: false, watts: 0 }); }
    return out;
  }
  const recOf = key => list().find(r => r.key === key);

  // =====================================================================================================
  // 2. positions: stored placement, world coordinates, distances and the cable quote
  // =====================================================================================================
  const ZONES = [['srv', 'ห้องเซิร์ฟเวอร์ / ตู้เครือข่าย', 0], ['office', 'ห้องทำงาน', 12], ['lobby', 'ล็อบบี้ / ประตูทางเข้า', 22], ['store', 'โกดัง / ห้องเก็บของ', 35], ['roof', 'ดาดฟ้า / หลังคา', 30], ['yard', 'ลานจอดรถ / รอบอาคาร', 48]];
  function posOf(rec) {
    const p = st().pos[rec.key]; if (p) return p;
    if (rec.kind === 'sec' && rec.d.spot && rec.d.spot !== 'house' && typeof MOUNTS !== 'undefined' && MOUNTS[rec.d.spot]) { const M = MOUNTS[rec.d.spot]; return { w: 'out', x: M.x, z: M.z, y: M.y, r: Math.atan2(M.lx - M.x, M.lz - M.z), mt: 'pole', legacy: 1, label: M.n }; }
    return null;
  }
  function worldOf(p) {
    if (!p) return { x: HP().x + 1.4, z: HP().z + 4, y: 1.2 };
    if (p.w === 'out') return { x: p.x, z: p.z, y: p.y || 0 };
    if (p.w === 'in') return { x: HP().x + p.x, z: HP().z + p.z, y: (p.f || 0) * 3.2 + (p.y || 0) };
    if (p.w === 'zone') { const z = ZONES.find(q => q[0] === p.zone) || ZONES[0]; return { x: z[2], z: 0, y: p.zone === 'roof' ? 9 : 0 }; }
    return { x: HP().x, z: HP().z, y: 0 };
  }
  const runLen = (a, b) => Math.hypot(a.x - b.x, a.z - b.z) * 1.3 + Math.abs(a.y - b.y) * 1.15 + 4;
  const sameSite = (r1, r2) => r1.site === r2.site;
  const hubRec = rec => { if (rec.kind !== 'sec') return null; const d = rec.d; if (['isp', 'site', 'solo'].includes(d.p) || !d.p) return null; return list().find(r => r.kind === 'sec' && r.site === rec.site && r.uid === d.p) || null; };
  const childRecs = rec => rec.kind === 'sec' ? list().filter(r => r.kind === 'sec' && r.site === rec.site && r.d.p === rec.uid) : [];
  const RATE = { cat6In: 45, cat6Out: 140, coaxIn: 40, coaxOut: 110, labDay: 1500, visit: 800, boxOut: 1200, extSw: 3990, outlet: 3500, pwrM: 70, wifiExt: 2400, perRun: 20 };
  const isOutPos = p => p && (p.w === 'out' || (p.w === 'zone' && (p.zone === 'yard' || p.zone === 'roof')));

  // quote moving rec to newPos: lengths, stock reuse, technician cost and days
  function quote(rec, np) {
    const q = { err: '', warn: [], items: [], cost: 0, days: 0, free: true, stockUse: 0, len: 0, L0: 0, runs: [] };
    const here = worldOf(np), cur = posOf(rec), out = isOutPos(np), s = st();
    if (np.w !== 'zone' && Math.hypot(here.x - HP().x, here.z - HP().z) > (rec.solo ? 600 : 400) && np.w === 'out') { q.err = 'ไกลเกินระยะที่ช่างวางระบบรับงาน (เกิน 400 ม. จากบ้าน)'; return q; }
    if (np.w === 'out' && typeof World !== 'undefined' && World.groundY(np.x, np.z) < -0.3) { q.err = 'จุดนี้เป็นน้ำ/ที่ลุ่ม ติดตั้งไม่ได้'; return q; }
    if (rec.indoorOnly && np.w !== 'in') { q.err = 'อุปกรณ์ชนิดนี้ต้องอยู่ในอาคาร'; return q; }
    const wiredHere = rec.wired, hub = hubRec(rec);
    let extra = 0, total = 0, outletDone = false;
    const outlet = txt => { if (outletDone) return; outletDone = true; q.items.push([txt, RATE.outlet]); };
    const consider = (r, pos, hubPos, tag) => {
      const L1 = runLen(worldOf(pos), hubPos), old = (st().pos[r.key] && st().pos[r.key].run) || (posOf(r) ? runLen(worldOf(posOf(r)), hubPos) : 12);
      q.runs.push({ n: r.n, len: Math.round(L1), tag }); return { L1, old };
    };
    const stockRuns = rec.analog ? S.sec.coax : S.sec.cable;
    if (wiredHere && hub) {
      const hp = worldOf(posOf(hub)), { L1, old } = consider(rec, np, hp, 'สายจาก' + hub.n);
      q.len = Math.round(L1); q.L0 = Math.round(old);
      const canReuse = old + 6 + stockRuns * RATE.perRun;
      if (L1 > 100 && !rec.analog) { q.items.push(['สวิตช์/PoE extender กลางทาง (สาย LAN เกิน 100 ม.)', RATE.extSw]); if (out) outlet('จุดไฟฟ้า/กล่องกันน้ำสำหรับ extender'); q.warn.push(`สาย LAN ยาว ${q.len} ม. เกินมาตรฐาน 100 ม. ต้องมีตัวขยายสัญญาณคั่นกลาง`); }
      if (rec.analog && L1 > 300) { q.err = `สายนำสัญญาณยาว ${q.len} ม. เกิน 300 ม. (สัญญาณอนาล็อกอ่อนเกินไป)`; return q; }
      if (L1 > canReuse) { extra += L1 - canReuse; q.free = false; }
      else q.stockUse = Math.max(0, Math.ceil((L1 - old - 6) / RATE.perRun));
      total = L1;
    } else if (rec.wired && !hub && rec.kind === 'power') {
      const L1 = runLen(here, { x: HP().x + 1.4, z: HP().z + 4, y: 1.2 }); q.len = Math.round(L1); q.L0 = (cur && cur.run) || 8;
      if (L1 > q.L0 + 6) { extra += L1 - q.L0 - 6; q.free = false; q.items.push(['ช่างไฟฟ้าตรวจและเข้าสายใหม่ตามมาตรฐาน', 1800]); }
    }
    // children of a hub: their runs follow the hub
    for (const c of childRecs(rec)) {
      if (!c.wired) continue; const cp = worldOf(posOf(c)), L1 = runLen(cp, here), old = (st().pos[c.key] && st().pos[c.key].run) || runLen(cp, worldOf(cur));
      q.runs.push({ n: c.n, len: Math.round(L1), tag: 'สายของ' + c.n }); if (L1 > old + 6) { extra += L1 - old - 6; q.free = false; }
    }
    // wireless: radio range from the access point / router
    if (rec.wifi && hub) {
      const hp = worldOf(posOf(hub)), dist = Math.hypot(here.x - hp.x, here.z - hp.z) + Math.abs(here.y - hp.y);
      const range = hub.D && hub.D.t === 'ap' ? 45 : 30;
      if (dist > range) { q.items.push([`ตัวขยายสัญญาณ WiFi ไปยังจุดใหม่ (ห่างจาก ${hub.n} ${Math.round(dist)} ม.)`, RATE.wifiExt]); if (out) outlet('จุดไฟฟ้ากันน้ำสำหรับตัวขยาย'); q.warn.push('สัญญาณ WiFi ไม่ถึง ต้องมีตัวขยายสัญญาณ'); }
    }
    if (rec.D && rec.D.t === 'sensor' && hub) { const hp = worldOf(posOf(hub)); const dist = Math.hypot(here.x - hp.x, here.z - hp.z); if (dist > 60) { q.err = `ไกลจากแผงกันขโมยเกิน 60 ม. (${Math.round(dist)} ม.) สัญญาณวิทยุไม่ถึง`; return q; } }
    if (rec.solo && np.w !== 'out') q.warn.push('กล้องโซลาร์ต้องรับแดดและสัญญาณ 4G ควรติดกลางแจ้ง');
    // mains power point: gear that needs a plug and is not PoE/battery
    const needsMains = rec.watts > 0 && !rec.solo && !(rec.D && rec.D.poeIn) && rec.kind !== 'pc' && rec.kind !== 'v25' && rec.kind !== 'furn';
    if (needsMains && out && !(cur && isOutPos(cur))) { outlet('จุดไฟฟ้ากลางแจ้ง (ปลั๊กกันน้ำ + เบรกเกอร์ย่อย)'); const lp = Math.max(0, Math.hypot(here.x - HP().x, here.z - HP().z) * 1.2); if (lp > 8) q.items.push([`สายไฟ ${Math.round(lp)} ม. ร้อยท่อ`, lp * RATE.pwrM]); }
    if (extra > 0.5) {
      const m = Math.ceil(extra), r = rec.analog ? (out ? RATE.coaxOut : RATE.coaxIn) : (out ? RATE.cat6Out : RATE.cat6In);
      q.short = m; q.items.push([`${rec.analog ? 'สายนำสัญญาณ RG6+ไฟ' : rec.kind === 'power' ? 'สายไฟ' : 'สาย Cat6'}${out ? ' ร้อยท่อ/ฝังดิน' : ''} เพิ่ม ${m} ม. (ที่ ${r} ฿/ม.)`, m * r]);
      if (out && wiredHere) q.items.push(['กล่องพักสาย/ท่อกันน้ำที่ปลายทาง', RATE.boxOut]);
    }
    q.free = q.items.length === 0 && !(extra > 0.5);
    if (!q.free) {
      q.days = clamp(Math.ceil((extra / 60) + (q.items.length > 2 ? 0.8 : 0.3)), 1, 3);
      q.items.unshift([`ค่าเดินทางและเปิดงานช่าง`, RATE.visit]); q.items.push([`ค่าแรงช่าง ${q.days} วัน`, RATE.labDay * q.days]);
    }
    q.cost = Math.round(q.items.reduce((a, b) => a + b[1], 0));
    return q;
  }
  const quoteTxt = q => q.err ? `❌ ${q.err}` : q.free ? `✅ ย้ายเองได้ ฟรี${q.len ? ` · สายยาว ~${q.len} ม.${q.stockUse ? ` (ใช้สายในสต็อก ${q.stockUse} จุด)` : ' (ใช้สายเดิม)'}` : ''}${q.warn.length ? ' · ⚠️ ' + q.warn.join(' / ') : ''}` : `👷 ต้องจ้างช่าง ${baht(q.cost)} · ${q.days} วัน${q.short ? ` · สายขาดอีก ~${q.short} ม.` : ''}${q.warn.length ? ' · ⚠️ ' + q.warn.join(' / ') : ''}`;

  // =====================================================================================================
  // 3. applying a move, removing, pending technician work
  // =====================================================================================================
  const nearName = (x, z) => { if (typeof MOUNTS === 'undefined') return ''; let b = null, bd = 1e9; for (const k in MOUNTS) { const M = MOUNTS[k], dd = Math.hypot(M.x - x, M.z - z); if (dd < bd) { bd = dd; b = M.n; } } return bd < 40 ? 'ใกล้' + b : ''; };
  const labelOf = np => np.w === 'out' ? `กลางแจ้ง (${Math.round(np.x)}, ${Math.round(np.z)}) ${nearName(np.x, np.z)}`.trim() : np.w === 'in' ? `ในบ้านชั้น ${(np.f || 0) + 1} (${np.x.toFixed(1)}, ${np.z.toFixed(1)})` : (ZONES.find(z => z[0] === np.zone) || ZONES[0])[1];
  const isMoving = d => st().pend.some(p => p.uid === d.uid);
  function logGap(rec, mins, why) { try { if (rec.cam && window.Cam36) { const g = Cam36.state().gaps; g.unshift({ u: rec.uid, a: abs(), b: abs() + mins, why }); if (g.length > 80) g.length = 80; } } catch (e) { } }
  function commit(rec, np, q) {
    const s = st(); np.label = labelOf(np); np.run = q.len || (s.pos[rec.key] && s.pos[rec.key].run) || 0; np.at = S.day;
    if (rec.kind === 'sec') {
      if (rec.D.analog) S.sec.coax = Math.max(0, S.sec.coax - q.stockUse); else S.sec.cable = Math.max(0, S.sec.cable - q.stockUse);
      rec.d.spot = 'house'; delete rec.d.pt;
    }
    s.pos[rec.key] = np;
    if (rec.cam && window.Cam36) { try { const P = Cam36.state().pose; const p = P[rec.uid] || (P[rec.uid] = { mt: 'corner', lens: 'std', zone: '', yo: 0, po: 0, zoom: 1 }); p.mt = np.mt === 'pole' ? 'pole' : np.mt === 'ceil' ? 'ceil' : np.mt === 'eave' ? 'eave' : 'corner'; p.zone = ''; p.yo = 0; p.po = 0; } catch (e) { } }
    for (const c of childRecs(rec)) { const cp = st().pos[c.key]; if (cp && c.wired) cp.run = Math.round(runLen(worldOf(cp), worldOf(np))); }
    s.log.unshift({ d: S.day, t: `ย้าย ${rec.n} → ${np.label}` }); if (s.log.length > 30) s.log.length = 30;
    try { if (window.Diary31) Diary31.log('📍', `ย้ายอุปกรณ์: ${rec.n}`, np.label, 'home', 'mv:' + rec.key + ':' + S.day); } catch (e) { }
    syncAll();
  }
  function doMove(key, np, how) {
    const rec = recOf(key); if (!rec) return;
    if (st().pend.some(p => p.key === key)) { UI.toast('มีงานช่างย้ายอุปกรณ์นี้ค้างอยู่ รอให้เสร็จก่อน', '👷'); return; }
    const q = quote(rec, np); if (q.err) { UI.toast(q.err, '⚠️'); return; }
    const s = st();
    if (q.free) {
      commit(rec, np, q); logGap(rec, 20, 'ย้ายตำแหน่งอุปกรณ์'); try { tick(20); } catch (e) { }
      UI.toast(`ย้าย ${rec.n} ไปที่ ${np.label} แล้ว`, '📍');
      if (rec.cam && typeof CCTV !== 'undefined' && CCTV.angleUI) { const d = rec.d; d.fresh = 1; setTimeout(() => { try { CCTV.angleUI(d.uid); } catch (e) { } }, 250); }
      return;
    }
    if (S.money < q.cost) { UI.toast(`เงินไม่พอจ้างช่าง ${baht(q.cost)}`, '💸'); return; }
    S.money -= q.cost; try { Bank2.log(`ค่าช่างย้าย/เดินสาย ${rec.n}`, -q.cost); } catch (e) { }
    s.pend.push({ key, uid: rec.uid || key, to: np, q: { len: q.len, stockUse: 0, items: q.items.length }, done: S.day + q.days, cost: q.cost });
    try { Phone.msg('ช่างวางระบบ', `รับงานย้าย "${rec.n}" ไป ${labelOf(np)} แล้ว ใช้เวลา ${q.days} วัน ค่าใช้จ่าย ${baht(q.cost)} (อุปกรณ์จะออฟไลน์ระหว่างงาน)`, false); } catch (e) { }
    UI.toast(`จ้างช่างแล้ว ${baht(q.cost)} · เสร็จใน ${q.days} วัน`, '👷');
  }
  function finishDue() {
    const s = st(); let ch = 0;
    for (const p of s.pend.slice()) {
      if (S.day < p.done) continue; const rec = recOf(p.key); s.pend.splice(s.pend.indexOf(p), 1);
      if (!rec) continue; const q = quote(rec, p.to); q.stockUse = 0; commit(rec, p.to, { len: q.len || p.q.len, stockUse: 0 }); ch++;
      try { Phone.msg('ช่างวางระบบ', `ย้าย "${rec.n}" ไป ${labelOf(p.to)} เสร็จแล้ว ทดสอบสัญญาณปกติ`, false); } catch (e) { }
      logGap(rec, 0, '');
    }
    if (ch) syncAll();
  }
  // take a device down: back to the bag (or the stored list), small labour fee for wired mounted gear
  function takeDown(key) {
    const rec = recOf(key); if (!rec) return; const s = st();
    if (rec.kind === 'sec') {
      const L = Sec.site(rec.site).dev;
      if (L.some(x => x.p === rec.uid)) { UI.toast('ถอดอุปกรณ์ที่ต่ออยู่ใต้ตัวนี้ออกก่อน (หรือย้ายไปพร้อมกัน)', '🔌'); return; }
      const fee = rec.wired ? (rec.cls === 'rack' || rec.cls === 'big' || rec.cls === 'ups' ? 300 : 120) : 0;
      if (S.money < fee) { UI.toast(`เงินไม่พอค่าช่างถอด ${baht(fee)}`, '💸'); return; }
      if (fee) { S.money -= fee; try { Bank2.log(`ค่าช่างถอด ${rec.n}`, -fee); } catch (e) { } }
      const wired = rec.wired; Sec.remove(rec.site, rec.uid);
      if (wired) { if (rec.analog) S.sec.coax += 1; else S.sec.cable += 1; }     // the cable run comes back with it
      delete s.pos[key]; s.pend = s.pend.filter(p => p.key !== key);
      UI.toast(`ถอด ${rec.n} เก็บเข้ากระเป๋าแล้ว${fee ? ` (ค่าช่าง ${baht(fee)})` : ''}`, '📦'); syncAll(); return;
    }
    if (rec.kind === 'v25') { const h = S.v25.homes[rec.hid]; const own = h.own[rec.k]; if (!own) return; s.stock['stock:v25:' + rec.hid + ':' + rec.k] = { n: rec.n, i: rec.i, cls: 'smart', v25: { hid: rec.hid, k: rec.k, own } }; delete h.own[rec.k]; delete s.pos[key]; UI.toast(`ถอด ${rec.n} เก็บไว้ในคลังแล้ว ติดตั้งกลับได้ฟรี`, '📦'); syncAll(); return; }
    if (rec.kind === 'pc') { const i = S.pcs.indexOf(rec.pc); if (i < 0) return; S.pcs.splice(i, 1); s.stock['stock:pc:' + rec.pc.uid37] = { n: rec.n, i: rec.i, cls: 'pc', pc: rec.pc }; delete s.pos[key]; UI.toast(`เก็บ ${rec.n} ไว้ในคลังแล้ว`, '📦'); syncAll(); return; }
    UI.toast('อุปกรณ์ชนิดนี้ถอดออกไม่ได้ (ย้ายตำแหน่งได้อย่างเดียว)', 'ℹ️');
  }
  function restore(key, np) {
    const s = st(), r = s.stock[key]; if (!r) return;
    if (r.v25) { const h = S.v25.homes[r.v25.hid]; if (!h) return; h.own[r.v25.k] = r.v25.own; delete s.stock[key]; s.pos[`v25:${r.v25.hid}:${r.v25.k}`] = Object.assign({}, np, { label: labelOf(np), at: S.day }); }
    else if (r.pc) { S.pcs.push(r.pc); delete s.stock[key]; s.pos['pc:' + r.pc.uid37] = Object.assign({}, np, { label: labelOf(np), at: S.day }); }
    UI.toast(`ติดตั้ง ${r.n} กลับแล้ว`, '🔧'); syncAll();
  }

  // =====================================================================================================
  // 4. 3D models: every placed device gets a model where it stands (outdoors, main house ground floor, upper floors)
  // =====================================================================================================
  const wht = mc(0xeceff1, { roughness: 0.4 }), blk = mc(0x25292d, { roughness: 0.5 }), gry = mc(0x4a5157, { roughness: 0.5 }), met = mc(0x90a4ae, { metalness: 0.5, roughness: 0.4 });
  const bx = (p, w, h, d, m, x, y, z) => U.mk(p, GEO.box, m, [x, y, z], [w, h, d]);
  const dot = (p, c, x, y, z, r = 0.012) => U.mk(p, GEO.sphLo, new THREE.MeshBasicMaterial({ color: c }), [x, y, z], r);
  function model(rec) {
    const g = new THREE.Group(), D = rec.D || {}, t = D.t;
    if (rec.kind === 'sec') {
      if (t === 'cam' && window.Cam47) return Cam47.model(rec.d);
      if (t === 'cam') {
        bx(g, 0.07, 0.07, 0.06, wht, 0, 0, 0); const c = new THREE.Group(); c.position.set(0, -0.06, 0.1); g.add(c);
        if ((D.poeIn || 0) >= 25) { U.mk(c, GEO.sph, mc(0xcfd8dc, { roughness: 0.3 }), [0, 0, 0], 0.12); U.mk(c, GEO.sph, mc(0x101214, { roughness: 0.1 }), [0, -0.02, 0.08], 0.05); }
        else if (D.wifiC || /d4/.test(rec.d.k)) { U.mk(c, GEO.sph, wht, [0, 0, 0], 0.085); U.mk(c, GEO.sph, mc(0x101214, { roughness: 0.1 }), [0, -0.01, 0.05], 0.04); }
        else if (D.solo) { bx(c, 0.09, 0.09, 0.2, wht, 0, 0, 0.04); const pn = bx(g, 0.2, 0.012, 0.14, mc(0x1a237e, { metalness: 0.4 }), 0, 0.09, 0.0); pn.rotation.x = -0.4; }
        else { bx(c, 0.075, 0.075, 0.22, wht, 0, 0, 0.04); U.mk(c, GEO.cyl, mc(0x101214, { roughness: 0.1 }), [0, 0, 0.16], [0.03, 0.012, 0.03], [Math.PI / 2, 0, 0]); }
        dot(c, 0xff1744, 0.045, 0.05, 0.1, 0.007); return g;
      }
      if (t === 'ap') { U.mk(g, GEO.cyl, wht, [0, 0, 0], [0.17, 0.03, 0.17]); dot(g, 0x4cff6a, 0, -0.02, 0, 0.016); return g; }
      if (t === 'rack') { const H = D.u > 20 ? 1.9 : 0.7; for (const sx of [-0.25, 0.25]) bx(g, 0.03, H, 0.34, blk, sx, H / 2, 0); bx(g, 0.5, 0.03, 0.34, blk, 0, H, 0); bx(g, 0.5, 0.04, 0.34, blk, 0, 0.02, 0); bx(g, 0.46, H, 0.02, mc(0x2d3238), 0, H / 2, -0.17); return g; }
      if (t === 'ups') { const h = D.va >= 5000 ? 0.46 : 0.24; bx(g, 0.44, h, 0.3, blk, 0, h / 2, 0); bx(g, 0.18, 0.07, 0.01, new THREE.MeshBasicMaterial({ color: 0x69f0ae }), -0.1, h * 0.7, 0.156); dot(g, 0xffc107, 0.16, h * 0.7, 0.158); return g; }
      if (t === 'server') { bx(g, 0.44, 0.09, 0.3, mc(0x1c1f22), 0, 0.045, 0); bx(g, 0.34, 0.05, 0.01, gry, -0.04, 0.045, 0.156); for (let i = 0; i < 4; i++) dot(g, i % 2 ? 0x4cff6a : 0x40c4ff, 0.14, 0.02 + i * 0.015, 0.16, 0.005); return g; }
      if (t === 'nas') { bx(g, 0.2, 0.2, 0.27, mc(0x2d3238), 0, 0.1, 0); for (let i = 0; i < 4; i++) { bx(g, 0.035, 0.16, 0.01, gry, -0.07 + i * 0.047, 0.1, 0.14); dot(g, 0x40c4ff, -0.07 + i * 0.047, 0.02, 0.145, 0.004); } return g; }
      if (t === 'nvr' || t === 'dvr') { bx(g, 0.38, 0.06, 0.26, mc(0x20252a), 0, 0.03, 0); bx(g, 0.2, 0.025, 0.01, gry, -0.06, 0.03, 0.135); dot(g, 0xff5252, 0.12, 0.03, 0.137, 0.006); return g; }
      if (t === 'switch' || t === 'firewall') { bx(g, 0.44, 0.045, 0.2, mc(t === 'firewall' ? 0x3b1f14 : 0x37474f), 0, 0.023, 0); for (let i = 0; i < 8; i++) dot(g, D.poe ? 0xffb300 : 0x4cff6a, -0.18 + i * 0.05, 0.03, 0.105, 0.004); return g; }
      if (t === 'router') { bx(g, 0.28, 0.04, 0.17, rec.d.k === 'rt_biz' ? mc(0x263238) : wht, 0, 0.02, 0); for (const sx of [-1, 0, 1]) { const a = U.mk(g, GEO.cylLo, wht, [sx * 0.1, 0.15, -0.04], [0.007, 0.22, 0.007]); a.rotation.z = -sx * 0.12; } for (let i = 0; i < 3; i++) dot(g, 0x4cff6a, -0.06 + i * 0.03, 0.02, 0.088, 0.005); return g; }
      if (t === 'alarm') { bx(g, 0.13, 0.19, 0.03, blk, 0, 0, 0); bx(g, 0.09, 0.04, 0.005, new THREE.MeshBasicMaterial({ color: 0x40c4ff }), 0, 0.055, 0.018); for (let i = 0; i < 6; i++) bx(g, 0.025, 0.02, 0.005, gry, -0.03 + (i % 3) * 0.03, -0.01 - (i >> 1) * 0.03, 0.018); return g; }
      if (t === 'sensor') { if (rec.d.k === 'siren') { bx(g, 0.18, 0.12, 0.08, mc(0xd32f2f), 0, 0, 0); U.mk(g, GEO.cone, blk, [0, 0, 0.1], [0.07, 0.1, 0.07], [Math.PI / 2, 0, 0]); } else if (rec.d.k === 'smoke') { U.mk(g, GEO.cyl, wht, [0, 0, 0], [0.1, 0.03, 0.1]); dot(g, 0xff1744, 0, -0.018, 0, 0.01); } else { bx(g, 0.07, 0.09, 0.04, wht, 0, 0, 0); U.mk(g, GEO.sph, mc(0xfafafa, { roughness: 0.2 }), [0, 0, 0.03], [0.03, 0.035, 0.015]); dot(g, 0xff1744, 0, -0.035, 0.022, 0.004); } return g; }
      if (t === 'access') { bx(g, 0.1, 0.16, 0.03, blk, 0, 0, 0); dot(g, 0x40c4ff, 0, 0.04, 0.018, 0.008); bx(g, 0.05, 0.05, 0.005, gry, 0, -0.03, 0.018); return g; }
      if (t === 'lock') { bx(g, 0.07, 0.22, 0.05, blk, 0, 0, 0); bx(g, 0.04, 0.05, 0.006, new THREE.MeshBasicMaterial({ color: 0x40c4ff }), 0, 0.05, 0.028); return g; }
      if (t === 'fire') { U.mk(g, GEO.cyl, mc(0xd32f2f, { roughness: 0.4 }), [0, 0.3, 0], [0.075, 0.6, 0.075]); U.mk(g, GEO.cyl, blk, [0, 0.64, 0], [0.03, 0.06, 0.03]); return g; }
      if (t === 'pac') { bx(g, 0.9, 0.28, 0.2, wht, 0, 0, 0); bx(g, 0.8, 0.03, 0.01, met, 0, -0.06, 0.105); return g; }
      bx(g, 0.2, 0.12, 0.2, wht, 0, 0.06, 0); return g;
    }
    if (rec.kind === 'pc') {
      if (rec.i === '💻') { bx(g, 0.34, 0.02, 0.24, mc(0x37474f), 0, 0.01, 0); const sc = bx(g, 0.34, 0.22, 0.012, blk, 0, 0.12, -0.12); sc.rotation.x = -0.25; bx(g, 0.3, 0.17, 0.004, new THREE.MeshBasicMaterial({ color: 0x1a2a3a }), 0, 0.125, -0.113).rotation.x = -0.25; return g; }
      const hi = (rec.pc.score || 0) >= 600; bx(g, 0.2, 0.43, 0.4, mc(hi ? 0x15181b : 0x263238, { roughness: 0.45 }), 0, 0.215, 0); dot(g, 0x4cff6a, 0.1, 0.38, 0.14, 0.01); return g;
    }
    if (rec.kind === 'power') {
      if (rec.id === 'inv') { bx(g, 0.44, 0.5, 0.12, wht, 0, 0, 0); bx(g, 0.2, 0.08, 0.005, new THREE.MeshBasicMaterial({ color: 0x69f0ae }), -0.08, 0.12, 0.062); dot(g, 0x4cff6a, 0.12, 0.12, 0.062, 0.01); bx(g, 0.46, 0.6, 0.16, mc(0x263238), 0, -0.58, 0.02); return g; }
      if (rec.id === 'mdb') { bx(g, 0.38, 0.5, 0.1, mc(0x78909c, { roughness: 0.5, metalness: 0.4 }), 0, 0, 0); bx(g, 0.32, 0.4, 0.01, mc(0x546e7a), 0, 0, 0.055); return g; }
      bx(g, 0.3, 0.06, 0.06, wht, 0, 0, 0); dot(g, 0x4cff6a, 0.1, 0, 0.032, 0.008); return g;
    }
    // smart-home gear / furniture-type tech / stored: a clean placeholder with its icon
    bx(g, 0.2, 0.2, 0.06, mc(0xeceff1, { roughness: 0.3 }), 0, 0, 0); const sm = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.16), new THREE.MeshBasicMaterial({ map: U.signTex(rec.i || '🏠', { w: 128, h: 128, bg: '#37474f', fg: '#ffffff' }) })); sm.position.set(0, 0, 0.032); g.add(sm); dot(g, 0x4cff6a, 0.085, 0.085, 0.034, 0.008);
    return g;
  }
  const FLOORISH = rec => rec.kind === 'sec' ? ['rack', 'ups', 'server', 'nas', 'nvr', 'dvr', 'switch', 'firewall', 'router', 'fire', 'pac'].includes(rec.D.t) : rec.kind === 'pc';
  // put the model of one placed device into `parent`, in the frame of that parent (`ox`,`oz` are the frame origin)
  function addTo(parent, rec, p, ox, oz, pole) {
    const m = model(rec), y = p.y || 0, floorBased = FLOORISH(rec) && y < 0.05 || (rec.kind === 'sec' && rec.D.t === 'rack');
    m.position.set(ox + p.x, floorBased ? 0 : y + (rec.kind === 'sec' && ['switch', 'firewall', 'router', 'nas', 'nvr', 'dvr', 'ups', 'server'].includes(rec.D.t) ? 0 : 0), oz + p.z);
    m.rotation.y = p.r || 0; parent.add(m);
    if (rec.kind === 'sec' && rec.cam && rec.d && window.Cam47) { try { Cam47.aim(m, CCTV.pose(rec.d)); } catch (e) { } }   // the housing faces exactly what the picture shows
    if (pole && p.w === 'out' && y > 0.8) { const h = y; U.mk(parent, GEO.cyl, mc(0x9e9e9e, { metalness: 0.5 }), [ox + p.x - Math.sin(p.r || 0) * 0.08, (p.gy || 0) + h / 2, oz + p.z - Math.cos(p.r || 0) * 0.08], [0.07, h, 0.07]); }
    return m;
  }
  const grp = { out: null, in0: null, inN: null };
  function rebuildOutdoor() {
    try {
      if (grp.out && grp.out.parent) grp.out.parent.remove(grp.out); const g = new THREE.Group(); g.name = 'v37out'; World.outdoor.add(g); grp.out = g;
      for (const r of list()) { const p = st().pos[r.key]; if (!p || p.w !== 'out') continue; const gy = World.groundY(p.x, p.z); const m = addTo(g, r, Object.assign({}, p, { gy }), 0, 0, true); m.position.y += gy; }
    } catch (e) { console.warn('v37 outdoor models', e); }
  }
  // a shelf/desk device keeps resting on whatever is under it today (furniture can be moved later): top of that furniture, else the floor
  function fixY(p) { if (p.mt !== 'shelf' && p.mt !== 'desk') return p; const s = supportAt(p.x, p.z); return Object.assign({}, p, { y: s ? s.top : 0 }); }
  function rebuildInterior0() {
    try {
      if (grp.in0 && grp.in0.parent) grp.in0.parent.remove(grp.in0); grp.in0 = null; if (!World.interior) return;
      const g = new THREE.Group(); g.name = 'v37in0'; World.interior.add(g); grp.in0 = g;
      for (const r of list()) { const p = st().pos[r.key]; if (p && p.w === 'in' && (p.f || 0) === 0) addTo(g, r, fixY(p), 0, 0, false); }
    } catch (e) { console.warn('v37 interior models', e); }
  }
  function floorNow() { if (G.inRoom && Rooms.cur && Rooms.cur.def && typeof Rooms.cur.def.home === 'string') { const m = /^main:f(\d+)/.exec(Rooms.cur.def.home); if (m) return +m[1]; } return -1; }
  function rebuildUpper() {
    try {
      if (grp.inN && grp.inN.parent) grp.inN.parent.remove(grp.inN); grp.inN = null; const f = floorNow(); if (f < 1 || !Rooms.group) return;
      const g = new THREE.Group(); g.name = 'v37inN'; Rooms.group.add(g); grp.inN = g;
      for (const r of list()) { const p = st().pos[r.key]; if (p && p.w === 'in' && (p.f || 0) === f) addTo(g, r, p, RM0.x, RM0.z, false); }
    } catch (e) { console.warn('v37 upper models', e); }
  }
  function syncAll() {
    rebuildOutdoor(); rebuildInterior0(); rebuildUpper();
    try { if (typeof CCTV !== 'undefined' && CCTV.draw) CCTV.draw(); } catch (e) { }
    try { if (window.Infra28 && Infra28.rebuild) Infra28.rebuild(); } catch (e) { }
  }
  { const _sp = Smart.place.bind(Smart); Smart.place = function (W, has, placeK, w, d) { _sp(W, has, placeK, w, d); try { rebuildInterior0(); } catch (e) { } }; }
  { const _rb = Rooms.build.bind(Rooms); Rooms.build = function (def, K) { const r = _rb(def, K); try { rebuildUpper(); } catch (e) { } return r; }; }

  // =====================================================================================================
  // 5. dependants read the new position: camera spot, rendering, status while a technician is working
  // =====================================================================================================
  if (typeof CCTV !== 'undefined') {
    const _spot = CCTV.spotOf.bind(CCTV);
    CCTV.spotOf = function (d) {
      const p = st().pos[keyOf('home', d.uid)];
      if (p && DEV[d.k] && DEV[d.k].t === 'cam') {
        const r = p.r || 0;
        if (p.w === 'out') return { mv: 1, n: p.label || 'จุดที่เลือกเอง', x: p.x, z: p.z, y: p.y || 3.2, lx: p.x + Math.sin(r) * 14, lz: p.z + Math.cos(r) * 14 };
        if (p.w === 'in') { const o = (p.f || 0) === 0 ? IN : RM0; return { mv: 1, n: p.label || 'ในบ้าน', x: o.x + p.x, z: o.z + p.z, y: p.y || 2.5, lx: o.x + p.x + Math.sin(r) * 6, lz: o.z + p.z + Math.cos(r) * 6, inside: p.f || 0 }; }
      }
      return _spot(d);
    };
    const _shot = CCTV.shot.bind(CCTV);
    CCTV.shot = function (d, w, h) {
      const M = this.spotOf(d), inside = M && typeof M.inside === 'number';
      if (!inside) return _shot(d, w, h);
      if (M.inside > 0) { const img = new ImageData(w || 480, h || 270); for (let i = 0; i < img.data.length; i += 4) { img.data[i] = img.data[i + 1] = img.data[i + 2] = 22; img.data[i + 3] = 255; } return img; }
      const iv = World.interior && World.interior.visible, ov = World.outdoor.visible; if (World.interior) World.interior.visible = true; World.outdoor.visible = false;
      // the interior block sits far below the terrain: let the ground there read as 0 so the lens is at the real mounting height
      const gy = World.groundY; World.groundY = function (x, z) { return Math.abs(x - IN.x) < 60 && Math.abs(z - IN.z) < 60 ? 0 : gy.call(World, x, z); };
      try { return _shot(d, w, h); } finally { World.groundY = gy; if (World.interior) World.interior.visible = iv; World.outdoor.visible = ov; }
    };
    const _upd = CCTV.update.bind(CCTV);
    CCTV.update = function (dt) { try { const d = this.vd; if (d && UI.isOpen()) { const M = this.spotOf(d); if (M && M.inside > 0) { const c = document.getElementById('cctvC'); if (c) { const g2 = c.getContext('2d'), W = c.width, H = c.height; g2.fillStyle = '#10151a'; g2.fillRect(0, 0, W, H); g2.fillStyle = '#fff'; g2.font = `${W / 30 | 0}px sans-serif`; g2.textAlign = 'center'; g2.fillText(`กล้องภายในบ้านชั้น ${M.inside + 1}`, W / 2, H * 0.46); g2.font = `${W / 37 | 0}px sans-serif`; g2.fillStyle = '#aaa'; g2.fillText('ดูภาพสดของชั้นบนได้เมื่ออยู่ในชั้นนั้น (บันทึกภาพทำงานปกติ)', W / 2, H * 0.55); g2.textAlign = 'left'; } return; } } } catch (e) { } return _upd(dt); };
  }
  const _stat = Sec.status.bind(Sec);
  Sec.status = function (site) {
    const o = _stat(site); if (!st().pend.length) return o;
    const L = Sec.site(site).dev, base = o.isOn;
    const moving = d => { let c = d, n = 0; while (c && n++ < 8) { if (st().pend.some(p => p.key === keyOf(site, c.uid))) return true; if (['isp', 'site', 'solo'].includes(c.p)) return false; c = L.find(x => x.uid === c.p); } return false; };
    const lost = L.filter(x => DEV[x.k].t === 'cam' && moving(x) && base(x)).length;
    return Object.assign({}, o, { isOn: d => !moving(d) && base(d), onCnt: Math.max(0, o.onCnt - lost), rec: Math.max(0, o.rec - lost), why: d => moving(d) ? 'กำลังย้ายอุปกรณ์ (ช่างอยู่ระหว่างเดินสาย)' : (o.why ? o.why(d) : '') });
  };
  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { finishDue(); } catch (e) { console.warn('v37 finish', e); } return r; }; }
  { const _rm = Sec.remove.bind(Sec); Sec.remove = function (site, uid) { const before = Sec.site(site).dev.length; _rm(site, uid); if (Sec.site(site).dev.length < before) { delete st().pos[keyOf(site, uid)]; st().pend = st().pend.filter(p => p.key !== keyOf(site, uid)); try { syncAll(); } catch (e) { } } }; }

  // =====================================================================================================
  // 6. placement mode: carry the device in front of you, snap, rotate, choose the mount
  // =====================================================================================================
  // what a "shelf / desk" mount really rests on: the top of the furniture under the spot (table, counter, chest, nightstand, piano ...). No furniture there = it stands on the floor,
  // so nothing hangs in mid air. x, z are inside the ground floor (centre = 0).
  const NOT_TOP = ['bed', 'sofa', 'rug', 'petbed', 'wardrobe', 'fridge', 'smartfridge', 'bookshelf', 'tv', 'plant', 'lamp', 'painting', 'elephant', 'lanternL', 'aquarium', 'projector', 'aircon', 'fan', 'radio', 'smartmirror', 'cooler', 'airpurifier', 'massagechair', 'smarthub25', 'washer', 'bike', 'piano', 'kitchen'];
  function supportAt(x, z) {
    let best = null; if (!World.interior || !World.furnObjs) return null;
    const tryBox = (nm, x0, x1, z0, z1, top) => { if (top < 0.3 || top > 1.4) return; if (x >= x0 - 0.04 && x <= x1 + 0.04 && z >= z0 - 0.04 && z <= z1 + 0.04 && (!best || top > best.top)) best = { top: +top.toFixed(2), n: nm }; };
    try {
      World.interior.updateMatrixWorld(true);
      for (const k of Object.keys(World.furnObjs)) {
        if (NOT_TOP.includes(k)) continue; const o = World.furnObjs[k].obj; if (!o || !o.parent) continue;
        // the surface = the highest wide flat part (table top, counter, chest lid); small things standing on it do not count
        const ob = new THREE.Box3().setFromObject(o); if (!isFinite(ob.max.y)) continue; let top = -1, tb = null;
        o.traverse(m => { if (!m.isMesh) return; const mb = new THREE.Box3().setFromObject(m), dx = mb.max.x - mb.min.x, dz = mb.max.z - mb.min.z; if (dx * dz >= 0.18 && dx >= 0.4 && dz >= 0.3 && mb.max.y > top && mb.max.y <= 1.4) { top = mb.max.y; tb = mb; } });
        if (tb) tryBox(k, tb.min.x - IN.x, tb.max.x - IN.x, tb.min.z - IN.z, tb.max.z - IN.z, top);
      }
      const r = World.room, nx = -r.w / 2 + 2.55, nz = -r.d / 2 + 0.4; tryBox('nightstand', nx - 0.3, nx + 0.3, nz - 0.25, nz + 0.25, 0.6); const K = World.lay && World.lay.kitchen; if (K) tryBox('kitchen', K[0] - 1.6, K[0] + 1.6, K[1] - 0.4, K[1] + 0.4, 0.9);
    } catch (e) { }
    return best;
  }
  const NAMES = { table: 'โต๊ะ', desk: 'โต๊ะคอม', kitchen: 'เคาน์เตอร์ครัว', chest: 'หีบ', piano: 'เปียโน', nightstand: 'ตู้ข้างเตียง', console: 'เครื่องเกม', trophy: 'ชั้นโชว์', trophy2: 'ชั้นโชว์', flowers: 'แจกัน' };
  const Mode = { on: false, rec: null, r: 0, mi: 0, dy: 0, np: null, q: null, ghost: null, gkey: '', tmr: 0 };
  function ctx() {
    if (G.inRoom && Rooms.cur && Rooms.cur.def && typeof Rooms.cur.def.home === 'string') { const m = /^main:f(\d+)/.exec(Rooms.cur.def.home); if (m) return { w: 'in', f: +m[1], o: RM0, dims: World.room || { w: 10, d: 8 } }; return null; }
    if (G.inside && !G.inRoom && !G.inMine) return { w: 'in', f: 0, o: IN, dims: World.room || { w: 10.5, d: 8 } };
    if (!G.inside && !G.inRoom && !G.inMine) return { w: 'out' };
    return null;
  }
  const mountsFor = (rec, c) => (CLS[rec.cls] || CLS.box).mounts.filter(m => c.w === 'out' ? !MT[m].in && !(rec.indoorOnly) : !MT[m].out);
  function target() {
    const c = ctx(); if (!c || !Mode.rec) return null; const P = G.player, rec = Mode.rec;
    const ms = mountsFor(rec, c); if (!ms.length) return { c, none: 1 };
    const mt = ms[Mode.mi % ms.length], dist = c.w === 'out' ? 3 : 1.4, snap = c.w === 'out' ? 0.5 : 0.25;
    const dp = window.Drag89 ? Drag89.pos(P.pos.x + Math.sin(P.rot) * dist, P.pos.z + Math.cos(P.rot) * dist) : { x: P.pos.x + Math.sin(P.rot) * dist, z: P.pos.z + Math.cos(P.rot) * dist };
    let x = dp.x - (c.w === 'out' ? 0 : c.o.x), z = dp.z - (c.w === 'out' ? 0 : c.o.z), r = Mode.r, y = MT[mt].y + Mode.dy;
    x = Math.round(x / snap) * snap; z = Math.round(z / snap) * snap;
    if (c.w === 'in') {
      const hw = c.dims.w / 2, hd = c.dims.d / 2; x = clamp(x, -hw + 0.12, hw - 0.12); z = clamp(z, -hd + 0.12, hd - 0.12);
      // wall mounts always go to the nearest wall (they used to float in the middle of the room when you were more than 1.3 m away)
      if (mt === 'wall') { const dl = [[hw - Math.abs(x), 'x', Math.sign(x) || 1], [hd - Math.abs(z), 'z', Math.sign(z) || 1]].sort((a, b) => a[0] - b[0])[0]; if (dl[1] === 'x') { x = dl[2] * (hw - 0.07); r = dl[2] > 0 ? -Math.PI / 2 : Math.PI / 2; } else { z = dl[2] * (hd - 0.07); r = dl[2] > 0 ? Math.PI : 0; } }
    }
    let sup = null, note = '';
    if (c.w === 'in') {
      if (mt === 'ceil') y = 3.1 + Math.min(0, Mode.dy);
      else if (mt === 'shelf' || mt === 'desk') {
        sup = c.f === 0 ? supportAt(x, z) : null;
        if (sup) { y = sup.top + Math.max(0, Mode.dy); note = 'วางบน' + (NAMES[sup.n] || 'เฟอร์นิเจอร์'); } else { y = Math.max(0, Mode.dy); note = 'ตรงนี้ไม่มีโต๊ะ/ตู้ → วางบนพื้น'; }
      } else if (mt === 'floor') y = 0;
    }
    y = clamp(y, 0, c.w === 'in' ? 3.1 : 9);
    const np = { w: c.w, x, z, y, r, mt }; if (c.w === 'in') { np.f = c.f; if (sup) np.sup = sup.n; }
    return { c, np, mt, note };
  }
  const MV = () => document.getElementById('mv37');
  function ensureUI() {
    if (MV()) return; const el = document.createElement('div'); el.id = 'mv37'; el.hidden = true;
    el.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:calc(92px + env(safe-area-inset-bottom,0px));z-index:9;width:min(600px,calc(100vw - 20px));background:rgba(18,38,28,.94);border:1px solid rgba(255,255,255,.2);border-radius:14px;padding:10px;color:#fff;font:14px/1.4 sans-serif;touch-action:manipulation';
    el.innerHTML = '<div id="mv37i" style="margin-bottom:8px"></div><div style="display:flex;flex-wrap:wrap;gap:6px"><button class="btn ghost" data-m="rl">⟲ หมุนซ้าย</button><button class="btn ghost" data-m="rr">⟳ หมุนขวา</button><button class="btn ghost" data-m="mt">🔩 วิธีติดตั้ง</button><button class="btn ghost" data-m="up">⬆ สูงขึ้น</button><button class="btn ghost" data-m="dn">⬇ ต่ำลง</button><button class="btn" data-m="ok">✔ วางที่นี่</button><button class="btn ghost" data-m="no">✖ ยกเลิก</button></div>';
    el.addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (!b) return; modeAct(b.dataset.m); }); document.body.appendChild(el);
  }
  function modeAct(a) {
    if (!Mode.on) return;
    if (a === 'rl') Mode.r = (Mode.r - Math.PI / 4 + TAU2) % TAU2; else if (a === 'rr') Mode.r = (Mode.r + Math.PI / 4) % TAU2;
    else if (a === 'mt') { Mode.mi++; Mode.dy = 0; } else if (a === 'up') Mode.dy = clamp(Mode.dy + 0.25, -3, 4); else if (a === 'dn') Mode.dy = clamp(Mode.dy - 0.25, -3, 4);
    else if (a === 'no') stopMode(); else if (a === 'ok') { const t = target(); if (!t || !t.np) { UI.toast('จุดนี้วางไม่ได้', '⚠️'); return; } confirmPlace(Mode.rec, t.np); }
    Mode.gkey = ''; update();
  }
  function startMode(key) {
    const rec = recOf(key); if (!rec) return; if (rec.kind === 'furn') { furnMove(rec); return; }
    if (st().pend.some(p => p.key === key)) { UI.toast('มีงานช่างย้ายอุปกรณ์นี้ค้างอยู่ รอให้เสร็จก่อน', '👷'); return; }
    const c = ctx(); if (!c) { UI.toast('ออกมายืนในบริเวณฟาร์มหรือเข้าไปในบ้านก่อน แล้วค่อยย้ายอุปกรณ์', 'ℹ️'); return; }
    if (rec.indoorOnly && c.w !== 'in') { UI.toast(`${rec.n} ต้องวางในอาคาร ให้เดินเข้าบ้านก่อน`, '🏠'); return; }
    UI.close(); ensureUI(); Mode.on = true; Mode.rec = rec; Mode.r = 0; Mode.mi = 0; Mode.dy = 0; Mode.gkey = '';
    const p = posOf(rec); if (p && p.mt) { const ms = mountsFor(rec, c), i = ms.indexOf(p.mt); if (i >= 0) Mode.mi = i; }
    MV().hidden = false; update(); clearInterval(Mode.tmr); Mode.tmr = setInterval(update, 90);
  }
  function stopMode() { Mode.on = false; Mode.rec = null; clearInterval(Mode.tmr); if (MV()) MV().hidden = true; if (Mode.ghost && Mode.ghost.parent) Mode.ghost.parent.remove(Mode.ghost); Mode.ghost = null; }
  function update() {
    if (!Mode.on) return; const t = target(), info = document.getElementById('mv37i'); if (!info) return;
    if (!t || !t.np) { info.innerHTML = `<b>${esc(Mode.rec.n)}</b><br>ที่นี่ใช้ติดตั้งไม่ได้ (เดินไปที่บ้านหรือในฟาร์ม)`; return; }
    const np = t.np, q = quote(Mode.rec, np); Mode.np = np; Mode.q = q;
    info.innerHTML = `<b>${Mode.rec.i} ${esc(Mode.rec.n)}</b> · ${MT[t.mt].n} สูง ${np.y.toFixed(2)} ม. ${np.w === 'in' ? `· ชั้น ${np.f + 1}` : '· กลางแจ้ง'}${t.note ? ` · <b>${esc(t.note)}</b>` : ''}<br>${esc(quoteTxt(q))}<br><span style="opacity:.75">เดินเพื่อเลื่อนตำแหน่ง · หมุนตัวเพื่อเปลี่ยนทิศ</span>`;
    const k = [np.w, np.f, np.x, np.z, np.y, np.r, t.mt].join('|'); if (k === Mode.gkey) return; Mode.gkey = k;
    if (Mode.ghost && Mode.ghost.parent) Mode.ghost.parent.remove(Mode.ghost);
    const m = model(Mode.rec); m.traverse(o => { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = q.err ? 0.25 : 0.6; if (o.material.color && q.err) o.material.color.setHex(0xff5252); } });
    let host, ox = 0, oz = 0, gy = 0;
    if (np.w === 'out') { host = World.outdoor; gy = World.groundY(np.x, np.z); } else if (np.f === 0) { host = World.interior; } else { host = Rooms.group; ox = RM0.x; oz = RM0.z; }
    if (!host) return; m.position.set(ox + np.x, gy + (FLOORISH(Mode.rec) && np.y < 0.05 ? 0 : np.y), oz + np.z); m.rotation.y = np.r; host.add(m); Mode.ghost = m;
  }
  function confirmPlace(rec, np) {
    const q = quote(rec, np); if (q.err) { UI.toast(q.err, '⚠️'); return; }
    if (q.free) { stopMode(); doMove(rec.key, np, 'self'); return; }
    stopMode();
    UI.open('ยืนยันงานย้าย/เดินสาย', null, () => `<p class="lead">${rec.i} ${esc(rec.n)} → ${esc(labelOf(np))}</p>
      <p class="dim">${q.runs.map(r => `${esc(r.tag)} ~${r.len} ม.`).join(' · ')}</p>
      <div class="grid">${q.items.map(it => `<div class="card"><div class="cb"><h4>${esc(it[0])}</h4><p class="dim">${baht(it[1])}</p></div></div>`).join('')}</div>
      <p class="lead"><b>รวม ${baht(q.cost)}</b> · ใช้เวลา ${q.days} วัน (ระหว่างงานอุปกรณ์จะออฟไลน์) ${q.warn.length ? '<br>⚠️ ' + esc(q.warn.join(' / ')) : ''}</p>
      <div class="row end"><button class="btn ghost" data-a="close">ยกเลิก</button><button class="btn" data-a="mv37pay" data-v="${esc(rec.key)}">จ้างช่าง ${baht(q.cost)}</button></div>`, { wide: true });
    pending = { key: rec.key, np };
  }
  let pending = null;
  function furnMove(rec) { if (!G.inside) { UI.toast('ย้ายได้ตอนอยู่ในบ้าน (โหมดจัดบ้านแบบเดิม)', '🏠'); return; } try { Move.start(rec.k); } catch (e) { UI.toast('เปิดโหมดจัดบ้านไม่ได้', '⚠️'); } }

  // preset spots (no walking): the 8 named farm mounts and the house cabinet
  const PRESETS = () => { const o = []; if (typeof MOUNTS !== 'undefined') for (const k of Object.keys(MOUNTS)) { const M = MOUNTS[k]; o.push({ k, n: M.n, np: { w: 'out', x: M.x, z: M.z, y: 4.5, r: Math.atan2(M.lx - M.x, M.lz - M.z), mt: 'pole' } }); } return o; };

  // =====================================================================================================
  // 7. the phone app and the buttons on the other planners
  // =====================================================================================================
  const TABS = ['ทั้งหมด', 'กล้อง', 'เครือข่าย & ไอที', 'คอม & บ้านอัจฉริยะ', 'ไฟฟ้า', 'คลังที่ถอดไว้', 'งานช่าง'];
  const filt = (rec, t) => t === 0 ? rec.kind !== 'stock' : t === 1 ? rec.cam : t === 2 ? rec.kind === 'sec' && !rec.cam : t === 3 ? ['pc', 'v25', 'furn'].includes(rec.kind) : t === 4 ? rec.kind === 'power' : t === 5 ? rec.kind === 'stock' : false;
  function whereOf(rec) { const p = posOf(rec); return p ? (p.label || labelOf(p)) : (rec.kind === 'sec' ? 'ตำแหน่งเดิม (ตู้เครือข่าย/ในบ้าน)' : rec.kind === 'furn' ? 'ในบ้าน (โหมดจัดบ้าน)' : 'ตำแหน่งเดิม'); }
  function cardHtml(rec) {
    const on = rec.kind === 'sec' && rec.site === 'home' ? (() => { try { return Sec.status('home').isOn(rec.d); } catch (e) { return true; } })() : true, mv = rec.kind === 'sec' && isMoving(rec.d);
    const btn = [];
    if (rec.kind === 'stock') btn.push(`<button class="btn" data-a="mv37re" data-v="${esc(rec.key)}">🔧 ติดตั้งกลับ…</button>`);
    else { btn.push(`<button class="btn" data-a="mv37go" data-v="${esc(rec.key)}">📍 ย้าย</button>`); if (rec.kind !== 'power' && rec.kind !== 'furn') btn.push(`<button class="btn ghost" data-a="mv37sp" data-v="${esc(rec.key)}">🗺️ เลือกจุดสำเร็จรูป</button>`); if (rec.kind === 'sec' || rec.kind === 'v25' || rec.kind === 'pc') btn.push(`<button class="btn ghost" data-a="mv37rm" data-v="${esc(rec.key)}">↩ ถอดออก</button>`); if (rec.cam && rec.site === 'home') btn.push(`<button class="btn ghost" data-a="mv37cam" data-v="${rec.uid}">🎯 มุมกล้อง</button>`); }
    return `<div class="card"><div class="ci">${rec.i}</div><div class="cb"><h4>${on ? '🟢' : '🔴'} ${esc(rec.n)}${rec.site !== 'home' && rec.site ? ' · ' + esc(Sec.siteName(rec.site)) : ''}</h4><p class="dim">📍 ${esc(whereOf(rec))}${mv ? ' · 👷 กำลังย้าย' : ''}</p><div class="row">${btn.join('')}</div></div></div>`;
  }
  function render(t) {
    const s = st();
    if (t === 6) return `<p class="lead">งานช่างที่ค้างอยู่ ${s.pend.length} งาน</p>${s.pend.length ? `<div class="grid">${s.pend.map(p => { const r = recOf(p.key); return `<div class="card"><div class="ci">👷</div><div class="cb"><h4>${esc(r ? r.n : p.key)}</h4><p class="dim">ไป ${esc(labelOf(p.to))} · เสร็จ${RD(p.done)} (อีก ${Math.max(0, p.done - S.day)} วัน) · จ่ายแล้ว ${baht(p.cost)}</p></div></div>`; }).join('')}</div>` : '<p class="empty">ไม่มีงานย้ายค้าง</p>'}<h5>ประวัติการย้าย</h5>${s.log.length ? `<ul class="lead">${s.log.map(l => `<li>${RD(l.d)} · ${esc(l.t)}</li>`).join('')}</ul>` : '<p class="dim">ยังไม่เคยย้าย</p>'}`;
    const L = list().filter(r => filt(r, t));
    return `<p class="lead">เลือกอุปกรณ์ → "ย้าย" แล้วเดินไปยังจุดที่ต้องการ (วางกลางแจ้งได้ทุกจุดในฟาร์ม หรือในบ้านทุกชั้น) · สายที่ไม่ถึงจ้างช่างเดินเพิ่มได้ · สายสต็อก LAN ${S.sec.cable} จุด / อนาล็อก ${S.sec.coax} จุด</p>${L.length ? `<div class="grid">${L.map(cardHtml).join('')}</div>` : '<p class="empty">ไม่มีอุปกรณ์ในหมวดนี้</p>'}`;
  }
  function openApp(tab, filter) { const s = st(); s.ui.tab = tab || 0; UI.open('📍 ย้ายอุปกรณ์ไอที & กล้อง', TABS, t => render(t), { wide: true, tab: tab || 0 }); }
  Object.assign(UI.H, {
    mv37go: d => startMode(d.v),
    mv37rm: d => UI.confirm('ถอดอุปกรณ์ออก?', 'เก็บเข้ากระเป๋า/คลังโดยไม่เสียของ (ถ้าเป็นอุปกรณ์เดินสาย มีค่าช่างถอดเล็กน้อย)', 'ถอดออก', () => { takeDown(d.v); }),
    mv37cam: d => { UI.close(); try { CCTV.angleUI(d.v); } catch (e) { } },
    mv37pay: d => { UI.close(); if (pending && pending.key === d.v) { doMove(pending.key, pending.np, 'tech'); pending = null; } },
    mv37sp: d => { const rec = recOf(d.v); if (!rec) return; const pr = PRESETS(); UI.open('เลือกจุดติดตั้งสำเร็จรูป', null, () => `<p class="lead">${rec.i} ${esc(rec.n)}</p><div class="grid">${pr.map(p => { const q = quote(rec, p.np); return `<div class="card"><div class="cb"><h4>${esc(p.n)}</h4><p class="dim">${esc(quoteTxt(q))}</p><div class="row"><button class="btn ${q.err ? 'ghost' : ''}" data-a="mv37pick" data-v="${esc(d.v)}" data-k="${p.k}" ${q.err ? 'disabled' : ''}>เลือกจุดนี้</button></div></div></div>`; }).join('')}</div>${rec.kind === 'sec' && rec.site !== 'home' ? '' : ''}`, { wide: true }); },
    mv37pick: d => { const rec = recOf(d.v), p = PRESETS().find(x => x.k === d.k); if (rec && p) { UI.close(); confirmPlace(rec, p.np); } },
    mv37re: d => { const r = st().stock[d.v]; if (!r) return; if (!ctx() || ctx().w !== 'in') { UI.toast('ติดตั้งอุปกรณ์ที่ถอดไว้ในบ้าน — เดินเข้าบ้านแล้วเลือกใหม่', '🏠'); return; } UI.close(); const rec = { key: d.v, kind: 'stock', n: r.n, i: r.i, cls: r.cls || 'smart', cam: false, wired: false, wifi: false, watts: 0, indoorOnly: 1, restoreKey: d.v }; Mode.restore = d.v; startModeRec(rec); },
    mv37tab: d => { },
  });
  function startModeRec(rec) { const c = ctx(); if (!c) return; ensureUI(); Mode.on = true; Mode.rec = rec; Mode.r = 0; Mode.mi = 0; Mode.dy = 0; Mode.gkey = ''; MV().hidden = false; update(); clearInterval(Mode.tmr); Mode.tmr = setInterval(update, 90); }
  const _confirm0 = confirmPlace;
  confirmPlace = function (rec, np) { if (rec.kind === 'stock') { stopMode(); restore(rec.key, np); return; } return _confirm0(rec, np); };
  // buttons injected into the security planner cards, the IT centre and the smart-home centre
  { const _ui = Sec.ui.bind(Sec); Sec.ui = function (site = 'home') { _ui(site); const r = UI.cur && UI.cur.render; if (!r) return; UI.cur.render = t => r(t).replace(/data-a="secrm" data-v="(d\d+)">ถอด<\/button>/g, (m, uid) => m + ` <button class="btn ghost" data-a="mv37go" data-v="${keyOf(site, uid)}">📍 ย้ายอุปกรณ์</button>`) + `<div class="row"><button class="btn" data-a="mv37app">📍 ย้ายอุปกรณ์ทั้งหมด (กล้อง/ไอที/บ้านอัจฉริยะ)</button></div>`; UI.renderBody(); }; }
  UI.H.mv37app = () => { UI.close(); openApp(0); };
  const augment = (appId, tab) => { const f = Phone.apps[appId]; if (!f) return; Phone.apps[appId] = function () { const r = f.apply(this, arguments); setTimeout(() => { try { const c = UI.cur; if (c && c.render && !c._mv37) { c._mv37 = 1; const rr = c.render; c.render = t => rr(t) + `<div class="row"><button class="btn ghost" data-a="mv37app">📍 ย้ายอุปกรณ์</button></div>`; UI.renderBody(); } } catch (e) { } }, 60); return r; }; };
  augment('itc'); augment('shub'); augment('cctv');
  // the app icon
  if (!APPS.some(a => a.id === 'mv37')) APPS.splice(Math.min(APPS.length, 14), 0, { id: 'mv37', i: '📍', n: 'ย้ายอุปกรณ์' });
  Phone.apps.mv37 = () => { setTimeout(() => { Phone.app = null; UI.close(); openApp(0); }, 0); return ''; };
  if (typeof APP_GROUPS !== 'undefined') { const gr = APP_GROUPS.find(x => /บ้าน|สาธารณูปโภค|ไอที/.test(x[0])) || APP_GROUPS[APP_GROUPS.length - 1]; if (gr && !gr[1].includes('mv37')) gr[1].unshift('mv37'); }

  // old saves: nothing moves by itself; build models for anything already placed
  st(); setTimeout(() => { try { syncAll(); } catch (e) { } }, 600);
  window.Move37 = {
    st, list, quote, doMove, takeDown, startMode, stopMode, openApp, syncAll, labelOf, posOf, worldOf, runLen, ctx, target, finishDue,
    moved(d) { return !!(d && st().pos[keyOf('home', d.uid)]); },
    movedPC(pc) { return !!(pc && pc.uid37 && st().pos['pc:' + pc.uid37]); },
    movedId(id) { return !!st().pos['power:' + id]; },
  };
});
