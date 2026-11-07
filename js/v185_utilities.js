'use strict';
// ---------- v185_utilities: electricity, water and internet are applied for PER PROPERTY (which house, which plot of land) ----------
//  Before: the electricity app only listed built plots, there was no water request for a plot at all, and internet existed for the main house only.
//  Now: a phone app "ไฟ-น้ำ-เน็ต ตามทรัพย์สิน" (category ไฟ น้ำ เน็ต) and a panel inside every plot window list EVERY property you own (main house, bought plots, built houses,
//  properties bought from the market) with its location, and for each one its own:
//   * electricity - bare plot / building site: temporary construction power (1,700 THB, deposit 500 refunded when the permanent meter is installed);
//                   finished house: permanent meter through the existing electricity office (Grid: inspection -> fee -> installation)
//   * water       - bare plot / building site: temporary water (800 THB); finished house: permanent water meter (3,500 THB: survey next day 10:00 -> pay -> install next day 13:00)
//   * internet    - one subscription per finished property (own package, contract, technician / courier, monthly bill on the 1st, suspension after 2 unpaid months)
//  Rules that now apply: a NEW house cannot be listed for long-term rent, run as a homestay or used for a business until it has permanent electricity AND water
//  (houses that were already let out in an older save keep working). Bought houses (condo, shophouse, market purchases) come with the meters transferred to you.
//  A new house started after this update also pays a small contractor surcharge if it was built without temporary power / water. Idle properties pay the minimum meter charges
//  each month, tenants pay their own usage. Nothing in an old save is deleted or reset: the new data lives in S.util and is created on first use.
V23.add('v185_utilities', () => {
  if (typeof Estate39 === 'undefined' || typeof Grid === 'undefined' || typeof HomeBuild === 'undefined' || typeof Phone === 'undefined') return;
  const E = Estate39, esc2 = s => (typeof esc === 'function' ? esc(s) : String(s));
  const toast = (t, i) => { try { UI.toast(t, i || 'ℹ️'); } catch (e) { } };
  const msg = (f, t) => { try { Phone.msg(f, t, true); } catch (e) { } };
  const baht2 = n => (typeof baht === 'function' ? baht(n) : '฿' + Math.round(n).toLocaleString('en-US'));
  const rd = d => { try { return RD(d); } catch (e) { return 'วันที่ ' + d; } };
  const dom = d => { try { return Cal36.date(d).dom; } catch (e) { return 0; } };
  const FEE = { tel: 1200 + 500, twt: 800, wt: 3500, surEl: 2500, surWt: 1200 };
  const NAMES = { el: 'การไฟฟ้าอำเภอสุขใจ', wt: 'การประปาสุขใจ' };

  // ---------- data ----------
  const st = () => { const s = S.util = S.util || { v: 1, p: {}, apps: [], n: 0, nb: {}, gf: 0, log: [] }; s.p = s.p || {}; s.apps = s.apps || []; s.nb = s.nb || {}; s.log = s.log || []; return s; };
  const isLot = I => I && (I.kind === 'hb' || I.kind === 'bld' || I.kind === 'land');
  const pk = id => { const I = E.info(id); return isLot(I) ? 'L:' + I.key : id; };
  const rec = id => { const s = st(), k = pk(id); return s.p[k] = s.p[k] || { tel: 0, twt: 0, wt: 0, net: null }; };
  const addrNumber = () => { const s = st(); s.an = (s.an || 0) + 1; return `${40 + s.an * 3}/${s.an} หมู่ 5 ต.สุขใจ`; };
  const gfOnce = () => {
    const s = st(); if (s.gf) return; s.gf = 1;
    // older saves: houses already let out / run as homestay / shops keep their water, so nothing that worked before stops working
    try { for (const [key, l] of Object.entries((S.hb && S.hb.lots) || {})) { if (!l.design || l.stage < 3) continue; { const rr = rec('hb:' + key); rr.addr = 1; rr.addrNo = rr.addrNo || addrNumber(); } const p = (E.X().props || {})['hb:' + key] || {}; if (l.rent || p.lease || ['rent', 'air', 'biz'].includes(p.st)) { st().p['L:' + key] = Object.assign(rec('hb:' + key), { wt: 1, gf: 1 }); try { Water.st().lots[key] = 1; } catch (e) { } } } } catch (e) { console.warn('v185 gf', e); }
  };
  const cityName = k => { if (!k || k === 'village') return 'หมู่บ้านสุขใจ'; try { const c = V25.cityList().find(x => x.key === k); return c ? c.n : k; } catch (e) { return k; } };
  const where = (id, I) => {
    if (id === 'main') return 'บ้านหลักของคุณ · ไร่สุขใจ';
    if (isLot(I)) { const L = HomeBuild.lot(I.key); let z = ''; try { z = (zoneAt(L.x, L.z) || {}).n || ''; } catch (e) { } return 'ที่ดิน “' + (L ? L.n : I.key) + '”' + (L ? ` · พิกัดบนแผนที่ (${Math.round(L.x)}, ${Math.round(L.z)})` : '') + (z ? ' · โซน' + z : ''); }
    return cityName(I.city) + (I.units > 1 ? ` · ${I.units} ห้อง` : '');
  };
  const zoneId = (id, I) => { try { if (isLot(I)) { const L = HomeBuild.lot(I.key); return (zoneAt(L.x, L.z) || {}).id || 'farm'; } if (id === 'main') return 'farm'; return I.city && I.city !== 'village' ? I.city : 'town'; } catch (e) { return 'farm'; } };

  // ---------- what each property has now ----------
  const pendEl = key => { try { return Grid.st().apps.find(a => a.kind === 'newm' && String(a.lot) === String(key) && a.st !== 'done' && a.st !== 'cancel') || null; } catch (e) { return null; } };
  const pendJob = (k, kind) => st().apps.find(a => a.pk === k && a.kind === kind && a.st !== 'done' && a.st !== 'cancel') || null;
  const finished = I => I.kind === 'hb' || (!isLot(I) && I.type !== 'land');
  function status(id) {
    const I = E.info(id), k = pk(id), r = rec(id), out = { id, I, k, el: 'none', wt: 'none', net: 'none' };
    if (id === 'main') {
      out.el = 'perm'; out.wt = (() => { try { return Water.st().meter ? 'perm' : 'none'; } catch (e) { return 'perm'; } })();
      out.net = (() => { try { return ISP.pkg() ? 'on' : 'none'; } catch (e) { return 'none'; } })(); out.main = 1; return out;
    }
    if (isLot(I)) {
      // meters requested the old way (breaker panel inside the house, v23) still count
      const hh = ((S.v23 && S.v23.homes) || {})['lot:' + I.key], lE = !!(hh && hh.util && hh.util.e && S.day >= hh.util.e), lW = !!(hh && hh.util && hh.util.w && S.day >= hh.util.w);
      out.el = Grid.st().lots[I.key] || lE ? 'perm' : pendEl(I.key) ? 'pend' : r.tel ? 'temp' : pendJob(k, 'tel') ? 'pendtemp' : 'none';
      out.wt = r.wt || lW ? 'perm' : pendJob(k, 'wt') ? 'pend' : r.twt ? 'temp' : pendJob(k, 'twt') ? 'pendtemp' : 'none';
      out.addr = r.addr === 1 ? 1 : r.addr ? 'pend' : 0;
    } else { out.el = I.type === 'land' ? 'none' : 'perm'; out.wt = I.type === 'land' ? 'none' : 'perm'; out.bought = 1; }
    const n = r.net; out.net = !n ? 'none' : n.st === 'appt' ? 'pend' : n.unpaid >= 2 ? 'cut' : 'on';
    return out;
  }
  const TXT = { none: ['❌', 'ยังไม่มี'], pend: ['⏳', 'กำลังดำเนินการ'], pendtemp: ['⏳', 'กำลังติดตั้งแบบชั่วคราว'], temp: ['🚧', 'ชั่วคราว (ไซต์ก่อสร้าง)'], perm: ['✅', 'ใช้งานได้'], on: ['✅', 'ใช้งานได้'], cut: ['⛔', 'ถูกระงับ ค้างชำระ'] };
  const chip = (ic, v) => `${ic}${TXT[v][0]}`;
  const missing = id => {
    const I = E.info(id); if (id === 'main' || !isLot(I)) return []; const s = status(id), m = [];
    if (s.el !== 'perm') m.push('ไฟฟ้า (มิเตอร์ถาวร)'); if (s.wt !== 'perm') m.push('น้ำประปา (มาตรวัดน้ำถาวร)'); return m;
  };

  // ---------- actions ----------
  const pay = (amt, label) => { if (S.money < amt) { toast('เงินสดไม่พอ ต้องใช้ ' + baht2(amt), '💸'); return false; } S.money -= amt; try { Bank2.log(label, -amt); } catch (e) { } return true; };
  const newApp = (kind, id, extra) => { const s = st(), a = Object.assign({ no: (kind === 'wt' ? 'ปป.' : 'ชค.') + (8100 + (++s.n)), kind, id, pk: pk(id), day: S.day, st: 'wait' }, extra); s.apps.push(a); return a; };
  const own = id => E.ids().includes(id);
  const A = {
    // permanent electricity goes through the real electricity office so inspection / fee / installation / meter size all behave exactly as before
    addr(id) {
      if (!own(id)) return; const I = E.info(id), r = rec(id); if (!isLot(I) || I.kind !== 'hb' || r.addr) return;
      try { if (typeof Gov24 !== 'undefined' && !Gov24.need(['idcard'], 'ขอเลขที่บ้าน')) return; } catch (e) { }
      if (!pay(200, 'ค่าธรรมเนียมขอเลขที่บ้าน ' + I.n)) return; r.addr = 'pend'; r.addrDay = S.day + 1;
      toast('ยื่นขอเลขที่บ้าน นายทะเบียนอำเภอออกเลขพรุ่งนี้ 10:00', '🏷️'); msg('ที่ว่าการอำเภอสุขใจ', `รับคำขอเลขที่บ้านและเพิ่มชื่อบ้านในทะเบียนบ้าน ${I.n} ออกเลขที่${rd(r.addrDay)} 10:00 น. (ต้องมีเลขที่บ้านก่อนขอมิเตอร์ไฟ/น้ำถาวร)`);
    },
    ins(id) { if (own(id)) { try { E.A.ins(id); } catch (e) { } } },
    enterhome(id) { try { if (window.Home188) Home188.enter(id); } catch (e) { console.warn('v185 enter', e); } },
    lotwin(id) { const I = E.info(id); if (!isLot(I)) return; UI.close(); setTimeout(() => HomeBuild.ui(I.key), 0); },
    el(id, meter) { if (!own(id)) return; const I = E.info(id); if (!isLot(I) || I.kind !== 'hb') { toast('ขอมิเตอร์ถาวรได้เมื่อสร้างบ้านเสร็จแล้ว (ตอนนี้ขอไฟชั่วคราวสำหรับก่อสร้างได้)', '⚡'); return; } if (rec(id).addr !== 1) { toast('ต้องขอเลขที่บ้านก่อน (ในหน้าจัดการทรัพย์สินนี้)', '🏷️'); return; } if (Grid.st().lots[I.key] || pendEl(I.key)) return; Grid.apply('newm', meter, I.key); },
    elpay(no) { Grid.pay(no); }, elre(no) { Grid.recheck(no); },
    tel(id) { if (!own(id)) return; const I = E.info(id), r = rec(id), k = pk(id); if (!isLot(I) || I.kind === 'hb' || r.tel || pendJob(k, 'tel')) return; if (!pay(FEE.tel, 'ไฟฟ้าชั่วคราวก่อสร้าง ' + I.n)) return; const a = newApp('tel', id, { st: 'install', inst: S.day + 1, fee: FEE.tel }); toast('ยื่นขอไฟฟ้าชั่วคราว ' + a.no + ' ติดตั้งพรุ่งนี้ 13:00', '🚧'); msg(NAMES.el, `รับคำร้อง ${a.no} ไฟฟ้าชั่วคราวสำหรับก่อสร้าง ${I.n} นัดติดตั้ง${rd(a.inst)} 13:00 น. (ค่าธรรมเนียม 1,200 + เงินประกัน 500 คืนเมื่อติดมิเตอร์ถาวร)`); },
    twt(id) { if (!own(id)) return; const I = E.info(id), r = rec(id), k = pk(id); if (!isLot(I) || I.kind === 'hb' || r.twt || pendJob(k, 'twt')) return; if (!pay(FEE.twt, 'น้ำประปาชั่วคราวก่อสร้าง ' + I.n)) return; const a = newApp('twt', id, { st: 'install', inst: S.day + 1, fee: FEE.twt }); toast('ยื่นขอน้ำชั่วคราว ' + a.no + ' ติดตั้งพรุ่งนี้ 13:00', '🚧'); msg(NAMES.wt, `รับคำร้อง ${a.no} น้ำประปาชั่วคราวสำหรับก่อสร้าง ${I.n} นัดติดตั้ง${rd(a.inst)} 13:00 น.`); },
    wt(id) { if (!own(id)) return; const I = E.info(id), r = rec(id), k = pk(id); if (!isLot(I) || I.kind !== 'hb') { toast('ขอมาตรวัดน้ำถาวรได้เมื่อสร้างบ้านเสร็จแล้ว (ตอนนี้ขอน้ำชั่วคราวสำหรับก่อสร้างได้)', '💧'); return; } if (r.wt || pendJob(k, 'wt')) return; if (r.addr !== 1) { toast('ต้องขอเลขที่บ้านก่อน (ในหน้าจัดการทรัพย์สินนี้)', '🏷️'); return; } const a = newApp('wt', id, { st: 'survey', insp: S.day + 1, fee: FEE.wt }); toast('ยื่นคำร้อง ' + a.no + ' ขอใช้น้ำประปา เจ้าหน้าที่สำรวจพรุ่งนี้ 10:00', '🚰'); msg(NAMES.wt, `รับคำร้อง ${a.no} ขอติดตั้งมาตรวัดน้ำ ${I.n} นัดสำรวจ${rd(a.insp)} 10:00 น.`); },
    wtpay(no) { const a = st().apps.find(x => x.no === no); if (!a || a.st !== 'pay') return; if (!pay(a.fee, 'ค่าธรรมเนียมมาตรวัดน้ำ ' + E.info(a.id).n)) return; a.st = 'install'; a.inst = S.day + 1; a.note = 'ชำระแล้ว นัดติดตั้ง' + rd(a.inst); toast(a.note, '🧾'); },
    net(id, k) {
      if (!own(id)) return; const I = E.info(id), s = status(id), P = NET_PKGS[k], r = rec(id); if (!P || id === 'main') return; if (s.net !== 'none') { toast('ทรัพย์นี้มีอินเทอร์เน็ตแล้ว ยกเลิกสัญญาเดิมก่อน', '📶'); return; }
      if (!finished(I)) { toast('ที่ดินเปล่า/ไซต์ก่อสร้างยังติดอินเทอร์เน็ตไม่ได้ ต้องมีบ้านและไฟฟ้าถาวรก่อน', '📶'); return; }
      if (s.el !== 'perm') { toast('ต้องมีไฟฟ้าถาวรก่อน เราเตอร์ถึงจะทำงาน', '⚡'); return; }
      const ISPd = ISPS[P.isp], cost = ISPd.extra && !ISPd.cover(zoneId(id, I)) ? ISPd.extra : 0; if (cost && !pay(cost, 'ค่าลากสายอินเทอร์เน็ต ' + I.n)) return;
      r.net = { pkg: k, st: 'appt', day: S.day + 1, since: 0, until: 0, due: 0, unpaid: 0, down: 0 };
      msg(ISPd.n, `${P.wireless ? 'จัดส่งเราเตอร์' : 'นัดช่างติดตั้ง'} ${P.n} ที่ ${I.n} ${rd(S.day + 1)}${cost ? ` (ค่าลากสาย ${baht2(cost)} จ่ายแล้ว)` : ''}`); toast(`สมัคร ${P.n} ให้ ${I.n} แล้ว ติดตั้งพรุ่งนี้`, '📶');
    },
    netpay(id) { const r = rec(id); if (!r.net || !r.net.due) return; if (!pay(r.net.due, 'ค่าอินเทอร์เน็ตค้างชำระ ' + E.info(id).n)) return; r.net.due = 0; r.net.unpaid = 0; toast('ชำระค่าอินเทอร์เน็ตค้างแล้ว สัญญาณกลับมา', '🧾'); },
    netx(id) {
      const r = rec(id), n = r.net; if (!n) return; const P = NET_PKGS[n.pkg], left = n.until > S.day ? Math.ceil((n.until - S.day) / 30) : 0, fee = left ? Math.min(3000, left * 250) : 0;
      if (fee && !pay(fee, 'ค่าปรับยกเลิกสัญญาเน็ต ' + E.info(id).n)) return; r.net = null; toast(`ยกเลิก ${P ? P.n : 'อินเทอร์เน็ต'} แล้ว${fee ? ' จ่ายค่าปรับ ' + baht2(fee) : ''}`, '📶');
    },
  };

  // ---------- time: installations, monthly bills, tenants ----------
  function hour(h) {
    const s = st(), due = (day, at) => S.day > day || (S.day === day && h >= at);
    for (const a of s.apps) {
      if (a.st === 'done' || a.st === 'cancel') continue; const I = E.info(a.id), key = a.pk.slice(2);
      if (a.kind === 'wt') {
        if (a.st === 'survey' && due(a.insp, 10)) { a.st = 'pay'; a.note = 'สำรวจแล้ว ชำระค่าธรรมเนียม+เงินประกันมาตร ' + baht2(a.fee); msg(NAMES.wt, `คำร้อง ${a.no} (${I.n}) สำรวจแล้ว ติดตั้งได้ กรุณาชำระ ${baht2(a.fee)} ในแอป ไฟ-น้ำ-เน็ต`); }
        else if (a.st === 'install' && due(a.inst, 13)) { a.st = 'done'; a.note = 'ติดตั้งเรียบร้อย'; rec(a.id).wt = 1; try { Water.st().lots[key] = 1; } catch (e) { } msg(NAMES.wt, `ติดตั้งมาตรวัดน้ำ ${I.n} เรียบร้อยแล้ว 💧 (คำร้อง ${a.no})`); try { Life2.note('ติดตั้งน้ำประปา ' + I.n); } catch (e) { } }
      } else if (a.st === 'install' && due(a.inst, 13)) {
        a.st = 'done'; const r = rec(a.id); if (a.kind === 'tel') { r.tel = 1; msg(NAMES.el, `ติดตั้งไฟฟ้าชั่วคราวที่ ${I.n} เรียบร้อยแล้ว 🚧 (คำร้อง ${a.no})`); } else { r.twt = 1; msg(NAMES.wt, `ติดตั้งน้ำชั่วคราวที่ ${I.n} เรียบร้อยแล้ว 🚧 (คำร้อง ${a.no})`); }
      }
    }
    for (const [k, r] of Object.entries(s.p)) if (r.addr === 'pend' && due(r.addrDay, 10)) { r.addr = 1; r.addrNo = addrNumber(); msg('ที่ว่าการอำเภอสุขใจ', `ออกเลขที่บ้านแล้ว: ${r.addrNo} (${nameOfKey(k)}) ขอมิเตอร์ไฟและน้ำถาวรได้แล้ว`); try { if (window.House186) House186.sign(k.slice(2)); } catch (e) { } }
    // internet technician / courier arrives 11:00 the day after ordering (no need to be at the property)
    for (const [k, r] of Object.entries(s.p)) { const n = r.net; if (n && n.st === 'appt' && due(n.day, 11)) { const P = NET_PKGS[n.pkg]; Object.assign(n, { st: 'on', since: S.day, until: P.contract ? S.day + P.contract * 30 : 0 }); const nm = nameOfKey(k); msg(ISPS[P.isp].n, `${P.wireless ? 'ส่งเราเตอร์' : 'ช่างติดตั้ง'} ${P.n} ที่ ${nm} เรียบร้อย ใช้งานได้แล้ว 📶`); try { Life2.note('ติดอินเทอร์เน็ต ' + nm); } catch (e) { } } }
    // temporary power is returned when the permanent meter is in
    for (const [k, r] of Object.entries(s.p)) { if (!k.startsWith('L:')) continue; if (r.tel && !r.telRef && Grid.st().lots[k.slice(2)]) { r.telRef = 1; r.tel = 0; try { earn(500); Bank2.income('คืนเงินประกันไฟฟ้าชั่วคราว', 500); } catch (e) { } msg(NAMES.el, 'คืนเงินประกันไฟฟ้าชั่วคราว 500 บาท (ติดมิเตอร์ถาวรแล้ว)'); } if (r.twt && r.wt) r.twt = 0; }
  }
  const nameOfKey = k => { try { const id = E.ids().find(i => pk(i) === k); return id ? E.info(id).n : k; } catch (e) { return k; } };
  function morning() {
    gfOnce(); hour(0);
    const s = st(), first = dom(S.day) === 1;
    for (const id of E.ids()) {
      if (id === 'main') continue; const r = rec(id), I = E.info(id), p = (E.X().props || {})[id] || {}, S1 = status(id);
      // tenants like internet; they leave if a house they rent loses its water or power
      try { if (p.lease && p.lease.sat != null) { if (r.net && S1.net === 'on') p.lease.sat = Math.min(100, p.lease.sat + 0.15); } } catch (e) { }
      if (!first) continue;
      // monthly internet bill (auto debit); 2 unpaid months = suspended
      if (r.net && r.net.st === 'on') { const P = NET_PKGS[r.net.pkg], amt = Math.round(P.price * 1.07); if (S.money >= amt) { S.money -= amt; try { Bank2.log('ค่าอินเทอร์เน็ต ' + I.n, -amt); } catch (e) { } if (r.net.unpaid) r.net.unpaid = 0; } else { r.net.unpaid++; r.net.due += amt; msg(ISPS[P.isp].n, `ตัดเงินค่าอินเทอร์เน็ต ${I.n} ${baht2(amt)} ไม่สำเร็จ (ค้าง ${r.net.unpaid} รอบ${r.net.unpaid >= 2 ? ' · ระงับสัญญาณแล้ว' : ''}) ชำระได้ในแอป ไฟ-น้ำ-เน็ต`); } }
      // idle properties pay the minimum meter charges; tenants pay their own usage
      if (!p.lease && !p.air && !p.biz && !p.sale && p.st !== 'rent' && I.type !== 'land') { const amt = (S1.el === 'perm' ? 26 : 0) + (S1.wt === 'perm' ? 54 : 0) + (S1.el === 'perm' ? 20 : 0); if (amt > 0 && S.money >= amt) { S.money -= amt; try { Bank2.log('ค่าไฟ/น้ำขั้นต่ำ + ค่าเก็บขยะ ' + I.n, -amt); } catch (e) { } } }
    }
  }
  { const _sm = Smart.morning; Smart.morning = function () { const r = _sm.apply(this, arguments); try { morning(); } catch (e) { console.warn('v185 morning', e); } return r; }; }
  { const _hs = Power.hourStep; Power.hourStep = function (h) { const r = _hs.apply(this, arguments); try { hour(h); } catch (e) { console.warn('v185 hour', e); } return r; }; }

  // new houses: remember the ones started after this update and charge the contractor surcharge if no temporary utilities were set up
  { const _b = HomeBuild.build.bind(HomeBuild); HomeBuild.build = function (id, k) { const had = !!((HomeBuild.st().lots[id] || {}).design); const r = _b(id, k); try { if (!had && (HomeBuild.st().lots[id] || {}).design) st().nb[id] = 1; } catch (e) { } return r; }; }
  { const _d = HomeBuild.day.bind(HomeBuild); HomeBuild.day = function () {
      const lots = HomeBuild.st().lots, before = {}; for (const k in lots) before[k] = lots[k].stage; const r = _d();
      try { for (const k in lots) { const l = lots[k]; if (l.design && l.stage >= 3 && before[k] < 3) { const s = st(), r2 = s.p['L:' + k] || {}, nm = l.name || (HOUSE_DESIGNS[l.design] || {}).n || 'บ้าน';
          if (s.nb[k]) { let sur = 0; const bits = []; if (!r2.tel) { sur += FEE.surEl; bits.push('ค่าเครื่องปั่นไฟไซต์งาน ' + baht2(FEE.surEl)); } if (!r2.twt) { sur += FEE.surWt; bits.push('ค่ารถขนน้ำ ' + baht2(FEE.surWt)); } if (sur && S.money >= sur) { S.money -= sur; try { Bank2.log('ค่าสาธารณูปโภคไซต์ก่อสร้าง ' + nm, -sur); } catch (e) { } msg('ผู้รับเหมาบ้านสุขใจ', `${nm} เสร็จแล้ว · เพราะไม่ได้ขอไฟ/น้ำชั่วคราว ผู้รับเหมาเรียกเก็บ ${bits.join(' + ')} (ครั้งหน้าขอไฟ-น้ำชั่วคราวล่วงหน้าได้ในแอป ไฟ-น้ำ-เน็ต)`); } }
          msg('ไฟ-น้ำ-เน็ต', `${nm} สร้างเสร็จแล้ว ยื่นขอมิเตอร์ไฟและมาตรวัดน้ำถาวรของบ้านหลังนี้ได้ที่แอป “ไฟ-น้ำ-เน็ต ตามทรัพย์สิน” (ต้องมีทั้งสองอย่างก่อนปล่อยเช่า/ทำโฮมสเตย์/เปิดธุรกิจ)`); } } } catch (e) { console.warn('v185 day', e); }
      return r; }; }

  // ---------- gates: no long-term rent / homestay / business without permanent power AND water ----------
  for (const k of ['listRent', 'air.start', 'biz.menu', 'biz.go']) {
    const f = E.A[k]; if (typeof f !== 'function') continue;
    E.A[k] = function (id) { try { const m = missing(id); if (m.length) { toast(`${E.info(id).n} ยังไม่มี ${m.join(' และ ')} ยื่นขอได้ที่แอป ไฟ-น้ำ-เน็ต`, '🚫'); msg('ไฟ-น้ำ-เน็ต', `ยังใช้ ${E.info(id).n} ปล่อยเช่า/ทำโฮมสเตย์/เปิดธุรกิจไม่ได้ — ขาด ${m.join(' และ ')} ยื่นขอแยกตามทรัพย์สินได้ในแอปนี้`); U.sel = id; return; } } catch (e) { } return f.apply(this, arguments); };
  }

  // ---------- UI ----------
  const U = { sel: null };
  const B = (v, label, o = {}) => `<button class="btn ${o.ghost ? 'ghost' : ''}" data-a="u185" data-v="${v}" ${o.dis ? 'disabled' : ''}>${label}</button>`;
  const lotBlock = id => {
    const s = status(id); return `<h5>⚡💧📶 ไฟ-น้ำ-เน็ต ของที่ดินแปลงนี้</h5><p class="dim">ไฟฟ้า ${chip('', s.el)} ${TXT[s.el][1]} · น้ำประปา ${chip('', s.wt)} ${TXT[s.wt][1]} · อินเทอร์เน็ต ${chip('', s.net)} ${TXT[s.net][1]}</p><div class="row">${B('open|' + id, '⚙️ ยื่นขอ / จัดการ ไฟ-น้ำ-เน็ต ของแปลงนี้')}</div>`;
  };
  const NETLIST = ['f100', 'f200', 'f500', 'f1000', 'h5gl', 'h5g', 'r4g', 't300'];
  function card(ic, title, body, btns) { return `<div class="card"><div class="ci">${ic}</div><div class="cb"><h4>${title}</h4><p class="dim">${body}</p><div class="row">${btns || ''}</div></div></div>`; }
  function addrCard(id, s) {
    const I = s.I, r = rec(id);
    if (s.main) return card('🏷️', 'เลขที่บ้าน · บ้านหลัก', 'บ้านหลักมีเลขที่บ้านและทะเบียนบ้านแล้ว (เอกสาร “ทะเบียนบ้าน” ในแอปราชการ)');
    if (s.bought) return card('🏷️', 'เลขที่บ้าน ✅', 'ทรัพย์ที่ซื้อมา มีเลขที่บ้านและทะเบียนบ้านเดิม โอนชื่อเจ้าบ้านให้แล้ว');
    if (!isLot(I)) return '';
    if (I.kind !== 'hb') return card('🏷️', 'เลขที่บ้าน ❌', 'ยังขอไม่ได้ ต้องสร้างบ้านเสร็จก่อน (นายทะเบียนต้องรับรองสิ่งปลูกสร้าง) · ที่ดินเปล่ามีโฉนดอย่างเดียว');
    if (r.addr === 1) return card('🏷️', 'เลขที่บ้าน ✅ ' + esc2(r.addrNo || ''), 'ขึ้นทะเบียนบ้านแล้ว · ป้ายเลขที่บ้านติดที่หน้าบ้านแล้ว ใช้ยื่นขอไฟฟ้า/น้ำประปา/อินเทอร์เน็ต');
    if (r.addr) return card('🏷️', 'เลขที่บ้าน ⏳', 'ยื่นคำขอแล้ว ออกเลข' + rd(r.addrDay) + ' 10:00');
    return card('🏷️', 'เลขที่บ้าน ❌ ยังไม่ได้ขอ', 'บ้านสร้างเสร็จแล้ว ต้องขอเลขที่บ้านและเพิ่มชื่อบ้านในทะเบียนบ้านก่อน ถึงจะขอมิเตอร์ไฟ/น้ำถาวรได้ · ค่าธรรมเนียม 200 ฿ ต้องมีบัตรประชาชน', B('addr|' + id, '🏷️ ขอเลขที่บ้าน 200 ฿', { dis: S.money < 200 }));
  }
  function servCard(id, s) {
    if (s.main) return '';
    const I = s.I, p = (E.X().props || {})[id] || {}; const ok = s.bought || (isLot(I) && I.kind === 'hb');
    if (!ok) return card('🧾', 'บริการอื่น ๆ ของที่ดินแปลงนี้', 'ที่ดินเปล่า: เสียภาษีที่ดิน (เรียกเก็บทุกเมษายนในแอป บิล & ค่าบริการ) · ประกันภัย ค่าเก็บขยะ และเลขที่บ้านเริ่มได้เมื่อสร้างบ้านเสร็จ');
    const ins = p.ins >= S.day ? `คุ้มครองถึง ${rd(p.ins)}` : 'ยังไม่มีประกัน';
    return card('🧾', 'บริการอื่น ๆ ของทรัพย์นี้', `🗑️ ค่าเก็บขยะเทศบาล 20 ฿/เดือน (ตัดอัตโนมัติถ้าปล่อยว่าง ผู้เช่าจ่ายเอง)<br>🛡️ ประกันเจ้าของบ้าน: ${ins}<br>🏛️ ภาษีที่ดินและสิ่งปลูกสร้างประจำปี: เรียกเก็บในแอป บิล & ค่าบริการ`, B('ins|' + id, p.ins >= S.day ? '🛡️ ต่อประกัน' : '🛡️ ซื้อประกัน', { ghost: 1 }) + (isLot(I) ? B('lotwin|' + id, '🏗️ ต่อเติม / ตั้งชื่อ / พักที่บ้าน', { ghost: 1 }) : '') + (s.bought && I.kind === 'mkt' ? B('enterhome|' + id, '🚪 เข้าบ้านหลังนี้', { ghost: 1 }) : ''));
  }
  function elecCard(id, s) {
    const I = s.I; if (s.main) return card('⚡', 'ไฟฟ้า · ใช้มิเตอร์บ้านหลัก', 'มิเตอร์บ้านหลักจัดการที่แอป “การไฟฟ้า” (ขอเพิ่มขนาด/TOU/โซลาร์)', B('go|grid', 'เปิดแอปการไฟฟ้า', { ghost: 1 }));
    if (s.bought) return card('⚡', 'ไฟฟ้า ✅ โอนชื่อผู้ใช้ไฟแล้ว', 'ทรัพย์ที่ซื้อมา การไฟฟ้าโอนชื่อมิเตอร์ให้คุณอัตโนมัติ · ถ้าปล่อยว่าง จ่ายค่าบริการขั้นต่ำรายเดือน ผู้เช่าจ่ายค่าไฟเอง');
    if (s.el === 'perm') { const m = METERS[Grid.st().lots[I.key]]; return card('⚡', 'ไฟฟ้า ✅ มีมิเตอร์ถาวร', `${m ? m.n + ' · รับไฟได้ ~' + m.kw + ' kW' : ''} · ผู้เช่าจ่ายค่าไฟเอง ถ้าว่างจ่ายขั้นต่ำเดือนละ ~26 ฿`); }
    if (s.el === 'pend') { const a = pendEl(I.key), tx = { wait: '🕓 รอตรวจสอบ', pay: '💳 รอชำระ', install: '🔧 รอติดตั้ง', fail: '❌ ไม่ผ่านการตรวจ' }[a.st] || a.st; return card('⚡', `ไฟฟ้า ⏳ คำร้อง ${a.no}`, `${tx} · ${esc2(a.note || '')}`, (a.st === 'pay' ? B('elpay|' + a.no, 'ชำระ ' + baht2(a.fee), { dis: S.money < a.fee }) : '') + (a.st === 'fail' ? B('elre|' + a.no, 'ขอตรวจใหม่ (300 ฿)', { ghost: 1 }) : '')); }
    const tmp = s.el === 'temp' ? '<br>🚧 ตอนนี้มีไฟชั่วคราวสำหรับช่างก่อสร้างแล้ว' : s.el === 'pendtemp' ? '<br>⏳ กำลังติดตั้งไฟชั่วคราว' : '';
    if (I.kind === 'hb' && s.addr !== 1) return card('⚡', 'ไฟฟ้า ❌ ยังไม่มีมิเตอร์ถาวร', 'ต้องมีเลขที่บ้านก่อน (ดูการ์ด “เลขที่บ้าน” ด้านล่าง) การไฟฟ้าถึงจะรับคำขอมิเตอร์ถาวร' + tmp);
    if (I.kind === 'hb') return card('⚡', 'ไฟฟ้า ❌ ยังไม่มีมิเตอร์ถาวร', 'บ้านสร้างเสร็จแล้ว ขอมิเตอร์ของบ้านหลังนี้ (เจ้าหน้าที่ตรวจพรุ่งนี้ 10:00 → ชำระ → ติดตั้งวันถัดไป 13:00)' + tmp, `${B('el|' + id + '|m5', `5(15)A ${baht2(METERS.m5.fee + METERS.m5.dep)}`)}${B('el|' + id + '|m15', `15(45)A ${baht2(METERS.m15.fee + METERS.m15.dep)}`, { ghost: 1 })}`);
    const can = s.el === 'none';
    return card('⚡', 'ไฟฟ้า ' + (s.el === 'temp' ? '🚧 ชั่วคราว' : '❌ ยังไม่มี'), `${I.kind === 'bld' ? 'กำลังก่อสร้าง · ' : 'ที่ดินเปล่า · '}ขอไฟชั่วคราวให้ช่างใช้ตอนสร้างบ้าน ${baht2(FEE.tel)} (ค่าธรรมเนียม 1,200 + ประกัน 500 คืนเมื่อติดมิเตอร์ถาวร) · มิเตอร์ถาวรขอได้หลังบ้านเสร็จ${I.kind === 'land' ? '' : ' (เสร็จ' + rd(((HomeBuild.st().lots[I.key] || {}).start || S.day) + 3) + ')'}` + tmp + (can ? '' : ''), can ? B('tel|' + id, '🚧 ขอไฟชั่วคราว ' + baht2(FEE.tel), { dis: S.money < FEE.tel }) : '');
  }
  function waterCard(id, s) {
    const I = s.I; if (s.main) return card('💧', 'น้ำประปา · ใช้มาตรวัดบ้านหลัก', 'จัดการที่แอป “น้ำประปา” (บาดาล ถังเก็บน้ำ น้ำหยด)', B('go|water', 'เปิดแอปน้ำประปา', { ghost: 1 }));
    if (s.bought) return card('💧', 'น้ำประปา ✅ โอนชื่อผู้ใช้น้ำแล้ว', 'ทรัพย์ที่ซื้อมา การประปาโอนชื่อมาตรวัดให้อัตโนมัติ · ผู้เช่าจ่ายค่าน้ำเอง ถ้าว่างจ่ายขั้นต่ำเดือนละ ~54 ฿');
    if (s.wt === 'perm') return card('💧', 'น้ำประปา ✅ มีมาตรวัดน้ำถาวร', rec(id).gf ? 'ใช้ประปาอยู่ก่อนแล้ว (บ้านที่ปล่อยเช่าอยู่ก่อนอัปเดต)' : 'ผู้เช่าจ่ายค่าน้ำเอง ถ้าว่างจ่ายขั้นต่ำเดือนละ ~54 ฿');
    if (s.wt === 'pend') { const a = pendJob(s.k, 'wt'); const tx = { survey: '🕓 รอสำรวจ ' + rd(a.insp) + ' 10:00', pay: '💳 รอชำระ', install: '🔧 รอติดตั้ง ' + rd(a.inst) + ' 13:00' }[a.st] || a.st; return card('💧', `น้ำประปา ⏳ คำร้อง ${a.no}`, tx + (a.note ? ' · ' + esc2(a.note) : ''), a.st === 'pay' ? B('wtpay|' + a.no, 'ชำระ ' + baht2(a.fee), { dis: S.money < a.fee }) : ''); }
    const tmp = s.wt === 'temp' ? '<br>🚧 ตอนนี้มีน้ำชั่วคราวสำหรับช่างก่อสร้างแล้ว' : s.wt === 'pendtemp' ? '<br>⏳ กำลังติดตั้งน้ำชั่วคราว' : '';
    if (I.kind === 'hb' && s.addr !== 1) return card('💧', 'น้ำประปา ❌ ยังไม่มีมาตรวัด', 'ต้องมีเลขที่บ้านก่อน (ดูการ์ด “เลขที่บ้าน” ด้านล่าง) การประปาถึงจะรับคำขอมาตรวัดถาวร' + tmp);
    if (I.kind === 'hb') return card('💧', 'น้ำประปา ❌ ยังไม่มีมาตรวัด', `บ้านสร้างเสร็จแล้ว ขอมาตรวัดน้ำของบ้านหลังนี้ ${baht2(FEE.wt)} (สำรวจพรุ่งนี้ 10:00 → ชำระ → ติดตั้งวันถัดไป 13:00)` + tmp, B('wt|' + id, '🚰 ยื่นขอใช้น้ำประปา', { dis: false }));
    return card('💧', 'น้ำประปา ' + (s.wt === 'temp' ? '🚧 ชั่วคราว' : '❌ ยังไม่มี'), `${I.kind === 'bld' ? 'กำลังก่อสร้าง · ' : 'ที่ดินเปล่า · '}ขอน้ำชั่วคราวให้ช่างใช้ตอนสร้างบ้าน ${baht2(FEE.twt)} · มาตรวัดถาวรขอได้หลังบ้านเสร็จ` + tmp, s.wt === 'none' ? B('twt|' + id, '🚧 ขอน้ำชั่วคราว ' + baht2(FEE.twt), { dis: S.money < FEE.twt }) : '');
  }
  function netCard(id, s) {
    const I = s.I, r = rec(id);
    if (s.main) { let t = 'ยังไม่มี'; try { const P = ISP.pkg(); if (P) t = P.n; } catch (e) { } return card('📶', 'อินเทอร์เน็ต · สายของบ้านหลัก', t + ' · จัดการที่แอป “อินเทอร์เน็ต”', B('go|isp', 'เปิดแอปอินเทอร์เน็ต', { ghost: 1 })); }
    if (r.net) { const n = r.net, P = NET_PKGS[n.pkg] || {}; const tx = n.st === 'appt' ? `${P.wireless ? '📦 เราเตอร์จะถึง' : '🔧 ช่างจะมาติดตั้ง'}${rd(n.day)} 11:00` : n.unpaid >= 2 ? '⛔ ถูกระงับ ค้างชำระ' : '✅ ใช้งานได้'; return card('📶', `อินเทอร์เน็ต · ${esc2(P.n || n.pkg)}`, `${tx} · ${baht2(P.price || 0)}/เดือน (+VAT) ตัดเงินอัตโนมัติวันที่ 1 · ${n.until ? 'สัญญาถึง' + rd(n.until) : 'ไม่มีสัญญา'}${n.due ? ` · ค้างชำระ ${baht2(n.due)}` : ''}`, (n.due ? B('netpay|' + id, 'ชำระค้าง ' + baht2(n.due), { dis: S.money < n.due }) : '') + B('netx|' + id, 'ยกเลิกบริการ', { ghost: 1 })); }
    if (!finished(I)) return card('📶', 'อินเทอร์เน็ต ❌', 'ยังติดไม่ได้ — ต้องสร้างบ้านเสร็จและมีไฟฟ้าถาวรก่อน');
    if (s.el !== 'perm') return card('📶', 'อินเทอร์เน็ต ❌', 'ต้องมีไฟฟ้าถาวรก่อน เราเตอร์ถึงจะทำงาน');
    const zid = zoneId(id, I);
    const L = NETLIST.filter(k => NET_PKGS[k]).map(k => { const P = NET_PKGS[k], ex = ISPS[P.isp].extra && !ISPS[P.isp].cover(zid) ? ISPS[P.isp].extra : 0; return B('net|' + id + '|' + k, `${P.n.replace(/ \(.*\)/, '')} ${baht2(P.price)}/ด${ex ? ' +ลากสาย ' + baht2(ex) : ''}`, { ghost: 1 }); }).join('');
    return card('📶', 'อินเทอร์เน็ต ❌ ยังไม่ได้สมัคร', 'สมัครแยกของทรัพย์นี้ (ไม่เกี่ยวกับสายบ้านหลัก) ช่างติดตั้งพรุ่งนี้ 11:00 ไม่ต้องไปรอที่ทรัพย์ · ผู้เช่าพอใจมากขึ้นถ้ามีเน็ต', L);
  }
  function overview() {
    const ids = E.ids(); let h = `<p class="lead">ทรัพย์สินของคุณ ${ids.length} รายการ — ไฟฟ้า น้ำประปา อินเทอร์เน็ต แยกตามบ้านแต่ละหลัง/ที่ดินแต่ละแปลง กด “จัดการ” เพื่อดูรายละเอียดและยื่นขอของทรัพย์นั้น</p>`;
    h += '<div class="grid">' + ids.map(id => { const s = status(id), I = s.I; const m = missing(id); return `<div class="card"><div class="ci">${I.i || '🏠'}</div><div class="cb"><h4>${esc2(I.n)}</h4><p class="dim">📍 ${esc2(where(id, I))}<br>${chip('⚡ ไฟ ', s.el)} · ${chip('💧 น้ำ ', s.wt)} · ${chip('📶 เน็ต ', s.net)}${m.length ? `<br><span class="bad">ยังปล่อยเช่า/ทำธุรกิจไม่ได้: ขาด ${m.join(', ')}</span>` : ''}</p><div class="row">${B('open|' + id, '⚙️ จัดการ')}</div></div></div>`; }).join('') + '</div>';
    return h;
  }
  function detail() {
    const ids = E.ids(); if (!U.sel || !ids.includes(U.sel)) U.sel = ids.find(i => i !== 'main') || 'main'; const id = U.sel, s = status(id), I = s.I, m = missing(id);
    const opts = ids.map(i => `<option value="${i}" ${i === id ? 'selected' : ''}>${esc2(E.info(i).n)}</option>`).join('');
    let h = `<div class="row"><select onchange="UI.H.u185({v:'open|'+this.value})" style="flex:1;min-width:0">${opts}</select></div><h5>${I.i || '🏠'} ${esc2(I.n)}</h5><p class="dim">📍 ${esc2(where(id, I))}</p>`;
    if (m.length) h += `<p class="bad">⚠️ ทรัพย์นี้ยังขาด ${m.join(' และ ')} — ต้องมีครบก่อนถึงจะปล่อยเช่า ทำโฮมสเตย์ หรือเปิดธุรกิจได้</p>`;
    else if (!s.main && !s.bought && isLot(I)) h += '<p class="good">✅ มีไฟฟ้าและน้ำประปาถาวรครบ ปล่อยเช่า/ทำโฮมสเตย์/เปิดธุรกิจได้แล้ว</p>';
    return h + '<div class="grid">' + addrCard(id, s) + elecCard(id, s) + waterCard(id, s) + netCard(id, s) + servCard(id, s) + '</div>';
  }
  function jobs() {
    const rows = []; try { for (const a of Grid.st().apps) if (a.kind === 'newm' && a.lot && !String(a.lot).startsWith('co:')) { const id = E.ids().find(i => pk(i) === 'L:' + a.lot); rows.push({ d: a.day, h: `<div class="card"><div class="ci">⚡</div><div class="cb"><h4>${a.no} · ขอมิเตอร์ไฟฟ้า ${esc2(id ? E.info(id).n : a.lot)}</h4><p class="${a.st === 'fail' ? 'bad' : a.st === 'done' ? 'good' : 'dim'}">${{ wait: '🕓 รอตรวจสอบ', pay: '💳 รอชำระ', install: '🔧 รอติดตั้ง', done: '✅ เสร็จสิ้น', fail: '❌ ไม่ผ่าน' }[a.st] || a.st} · ${esc2(a.note || '')}</p><div class="row">${a.st === 'pay' ? B('elpay|' + a.no, 'ชำระ ' + baht2(a.fee), { dis: S.money < a.fee }) : ''}${a.st === 'fail' ? B('elre|' + a.no, 'ขอตรวจใหม่ (300 ฿)', { ghost: 1 }) : ''}</div></div></div>` }); } } catch (e) { }
    for (const a of st().apps) { let nm = a.id; try { nm = E.info(a.id).n; } catch (e) { } const kind = { tel: ['🚧', 'ไฟฟ้าชั่วคราว'], twt: ['🚧', 'น้ำชั่วคราว'], wt: ['💧', 'มาตรวัดน้ำถาวร'] }[a.kind]; const tx = { survey: '🕓 รอสำรวจ ' + rd(a.insp), pay: '💳 รอชำระ', install: '🔧 รอติดตั้ง ' + rd(a.inst), done: '✅ เสร็จสิ้น' }[a.st] || a.st; rows.push({ d: a.day, h: `<div class="card"><div class="ci">${kind[0]}</div><div class="cb"><h4>${a.no} · ${kind[1]} ${esc2(nm)}</h4><p class="${a.st === 'done' ? 'good' : 'dim'}">${tx}${a.note ? ' · ' + esc2(a.note) : ''}</p><div class="row">${a.st === 'pay' ? B('wtpay|' + a.no, 'ชำระ ' + baht2(a.fee), { dis: S.money < a.fee }) : ''}</div></div></div>` }); }
    rows.sort((a, b) => b.d - a.d);
    return `<p class="lead">คำร้องไฟฟ้า/น้ำประปาทั้งหมดของทรัพย์สินแต่ละแห่ง (ระบุว่าเป็นของบ้าน/ที่ดินไหน)</p>` + (rows.length ? '<div class="grid">' + rows.slice(0, 20).map(r => r.h).join('') + '</div>' : '<p class="dim">ยังไม่มีคำร้อง</p>');
  }
  const render = t => { try { gfOnce(); return t === 1 ? detail() : t === 2 ? jobs() : overview(); } catch (e) { console.warn('v185 ui', e); return '<p class="bad">แสดงผลไม่ได้</p>'; } };
  function open(id, tab) { if (id) U.sel = id; Phone.app = null; try { UI.close(); } catch (e) { } UI.open('ไฟ-น้ำ-เน็ต ตามทรัพย์สิน', ['ทรัพย์ทั้งหมด', 'จัดการที่เลือก', 'คำร้อง'], render, { wide: true, tab: tab == null ? (id ? 1 : 0) : tab }); }
  UI.H.u185 = d => {
    const [k, ...r] = String(d.v || '').split('|');
    try {
      if (k === 'open') { U.sel = r[0]; if (UI.cur && UI.cur.title === 'ไฟ-น้ำ-เน็ต ตามทรัพย์สิน') { UI.cur.tab = 1; } else { open(r[0], 1); return; } }
      else if (k === 'go') { UI.close(); setTimeout(() => { try { Phone.apps[r[0]] && Phone.apps[r[0]](); } catch (e) { } }, 0); return; }
      else if (A[k]) A[k](...r);
    } catch (e) { if (e && e.spend173) throw e; console.warn('v185', k, e); }
    try { if (UI.cur && UI.cur.render) UI.renderBody(); } catch (e) { }
  };
  // phone app + category
  if (!APPS.some(a => a.id === 'util185')) APPS.splice(Math.min(APPS.length, 6), 0, { id: 'util185', i: '🏘️', n: 'ไฟ-น้ำ-เน็ต ตามทรัพย์' });
  Phone.apps.util185 = () => { setTimeout(() => { open(null, 0); }, 0); return ''; };
  try { const g = typeof APP_GROUPS !== 'undefined' && APP_GROUPS.find(x => x[1] && x[1].includes('grid')); if (g && !g[1].includes('util185')) g[1].splice(g[1].indexOf('grid'), 0, 'util185'); } catch (e) { }
  const catIt = () => { try { const c = window.Phone59 && Phone59.CATS.find(x => x[0] === 'util'); if (c && !c[3].includes('util185')) c[3].unshift('util185'); } catch (e) { } };
  catIt(); setTimeout(catIt, 1500); setTimeout(catIt, 6000);
  // the plot window gets its own utility panel
  { const _u = HomeBuild.ui.bind(HomeBuild); HomeBuild.ui = function (id) { const r = _u(id); try { const c = UI.cur; if (c && c.render && !c.u185) { c.u185 = 1; const f = c.render, own = () => { const l = HomeBuild.st().lots[id]; return l ? (l.design && l.stage >= 3 ? 'hb:' : l.design ? 'bld:' : 'land:') + id : null; }; c.render = t => { let h = f.call(c, t); const pid = own(); if (pid) h += lotBlock(pid); return h; }; UI.renderBody(); } } catch (e) { console.warn('v185 lotui', e); } return r; }; }
  // the breaker panel inside a walk-in house (v23) used to be a third, separate meter request: it now follows this app, so there is ONE set of meters per house
  try {
    const hidOf = h => { const m = (S.v23 && S.v23.homes) || {}; return Object.keys(m).find(k => m[k] === h) || ''; };
    const _need = Prop23.need.bind(Prop23);
    Prop23.need = function (h, spec) {
      const hid = hidOf(h); if (!hid.startsWith('lot:')) return hid.startsWith('est:') ? (spec.e && S.powerOff ? 'ไฟถูกตัด ชำระค่าไฟในแอปธนาคารก่อน' : '') : _need(h, spec);
      if (spec.e && S.powerOff) return 'ไฟถูกตัด ชำระค่าไฟในแอปธนาคารก่อน'; const s = status('hb:' + hid.slice(4));
      if (spec.e && s.el !== 'perm') return 'บ้านหลังนี้ยังไม่มีมิเตอร์ไฟถาวร ขอได้ที่แอป ไฟ-น้ำ-เน็ต (หรือที่แผงเบรกเกอร์ใกล้ประตู)';
      if (spec.wt && s.wt !== 'perm') return 'บ้านหลังนี้ยังไม่มีมาตรวัดน้ำถาวร ขอได้ที่แอป ไฟ-น้ำ-เน็ต (หรือที่แผงเบรกเกอร์ใกล้ประตู)'; return '';
    };
    const _ui = Prop23.utilUI.bind(Prop23);
    Prop23.utilUI = function (hid) { if (String(hid).startsWith('lot:')) { Prop23.utilHid = hid; try { UI.close(); } catch (e) { } open('hb:' + hid.slice(4), 1); return; } return _ui(hid); };
    Prop23.requestUtil = function () { toast('ยื่นขอมิเตอร์ไฟ/น้ำของบ้านหลังนี้ที่แอป ไฟ-น้ำ-เน็ต ตามทรัพย์สิน', 'ℹ️'); };
  } catch (e) { console.warn('v185 prop23', e); }
  gfOnce();
  window.Util185 = { st, status, missing, A, hour, morning, open, where, pk, FEE };
});
