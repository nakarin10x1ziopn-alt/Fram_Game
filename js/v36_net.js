'use strict';
// ---------- v36 internet: 20 more packages (fibre, 5G home, satellite, business, gaming, prepaid) and MORE THAN ONE line at a time.
// The first line is the home line from isp.js; extra lines have their own contract, technician, bill and faults.
// Lines are summed ("รวมความเร็ว") or kept as a standby ("สำรอง"): when the main line is cut or suspended the standby takes over. ----------
V23.add('v36_net', () => {
  const N36 = {
    lines() { const s = this.st(); return s.lines; },
    st() { if (!S.v36n) S.v36n = { lines: [], n: 0, log: [], failedAt: 0 }; const s = S.v36n; if (!s.lines) s.lines = []; return s; },
  };
  const baht0 = n => '฿' + Math.round(n).toLocaleString('en-US');
  // ----- providers and packages (typical Thai 2026 street prices per month, VAT excluded) -----
  Object.assign(ISPS, {
    nova: { n: 'โนวาไฟเบอร์', i: '🟣', kind: 'ไฟเบอร์ออปติก FTTH เจเนอเรชันใหม่', fault: 0.015, cover: () => true },
    sky: { n: 'สกายลิงก์ ดาวเทียม LEO', i: '🛰️', kind: 'ดาวเทียมวงโคจรต่ำ (จานรับสัญญาณ)', fault: 0.03, cover: () => true },
    biz: { n: 'สุขใจเอ็นเตอร์ไพรส์', i: '🏢', kind: 'วงจรธุรกิจ SLA + IP คงที่', fault: 0.004, cover: zone => zone !== 'farm', extra: 8000 },
  });
  const PK = {
    f100: { isp: 'sukjai', n: 'ไฟเบอร์ประหยัด 100/100 Mbps', down: 100, up: 100, price: 299, router: 'WiFi 5', contract: 12 },
    f200: { isp: 'sukjai', n: 'ไฟเบอร์ 200/200 Mbps', down: 200, up: 200, price: 349, router: 'WiFi 5', contract: 12 },
    n1g: { isp: 'nova', n: 'โนวา 1 Gbps สมมาตร', down: 1000, up: 1000, price: 699, router: 'WiFi 6', contract: 12 },
    n2g: { isp: 'nova', n: 'โนวา 2 Gbps + WiFi 7', down: 2000, up: 2000, price: 999, router: 'WiFi 7', contract: 24 },
    n5g: { isp: 'nova', n: 'โนวา 5 Gbps สายเทพ (เราเตอร์ 10G)', down: 5000, up: 5000, price: 2490, router: 'WiFi 7 + 10G', contract: 24 },
    ngame: { isp: 'nova', n: 'โนวา เกมมิ่ง 1 Gbps ปิงต่ำ', down: 1000, up: 1000, price: 899, router: 'WiFi 6E เกมมิ่ง', contract: 12, ping: 3 },
    nfam: { isp: 'nova', n: 'โนวา ครอบครัว 500/500 + กล่องทีวี', down: 500, up: 500, price: 649, router: 'WiFi 6 + Mesh 2 จุด', contract: 12, iptv: 1 },
    t100: { isp: 'thong', n: 'ทุ่งทอง ประหยัด 100/100 Mbps', down: 100, up: 100, price: 249, router: 'WiFi 5', contract: 24 },
    t1g: { isp: 'thong', n: 'ทุ่งทอง 1 Gbps', down: 1000, up: 1000, price: 899, router: 'WiFi 6', contract: 24 },
    h5gl: { isp: 'mobile', n: '5G Home Lite 100/20 Mbps (200GB)', down: 100, up: 20, price: 399, router: '5G CPE', contract: 12, wireless: 1, cap: 200 },
    h5gp: { isp: 'mobile', n: '5G Home Pro 600/100 Mbps ไม่จำกัด', down: 600, up: 100, price: 999, router: '5G CPE WiFi 6', contract: 12, wireless: 1 },
    r4g: { isp: 'mobile', n: '4G เราเตอร์ซิม 60/20 Mbps (150GB)', down: 60, up: 20, price: 399, router: '4G CPE', contract: 0, wireless: 1, cap: 150 },
    pocket2: { isp: 'mobile', n: 'พ็อกเก็ตไวไฟ 5G 200GB มีแบต', down: 150, up: 30, price: 449, router: 'Pocket WiFi 5G มีแบต', contract: 0, wireless: 1, battery: 1, cap: 200 },
    pre30: { isp: 'mobile', n: 'เติมเงิน 5G Home 30 วัน (50GB)', down: 100, up: 20, price: 299, router: '5G CPE', contract: 0, wireless: 1, cap: 50, prepaid: 1 },
    satl: { isp: 'sky', n: 'ดาวเทียม Lite 100/10 Mbps', down: 100, up: 10, price: 1490, router: 'จาน + เราเตอร์ WiFi', contract: 0, sat: 1, setup: 12900 },
    sats: { isp: 'sky', n: 'ดาวเทียม Standard 200/20 Mbps', down: 200, up: 20, price: 1990, router: 'จาน + เราเตอร์ WiFi 6', contract: 0, sat: 1, setup: 14900 },
    satp: { isp: 'sky', n: 'ดาวเทียม Priority 350/40 Mbps', down: 350, up: 40, price: 3990, router: 'จานแบน + เราเตอร์ WiFi 6', contract: 0, sat: 1, setup: 14900 },
    bsoho: { isp: 'biz', n: 'วงจรธุรกิจ SOHO 50/50 Mbps + IP คงที่ 1 ตัว (ร้านเล็ก)', down: 50, up: 50, price: 1900, router: 'เราเตอร์ธุรกิจ', contract: 12, biz: 1 },
    bwl: { isp: 'biz', n: 'เน็ต 5G/4G ธุรกิจสายสำรอง 200/50 Mbps (150GB)', down: 200, up: 50, price: 1990, router: '5G CPE ธุรกิจ', contract: 12, biz: 1, wireless: 1, cap: 150 },
    b100: { isp: 'biz', n: 'วงจรธุรกิจ 100/100 Mbps SLA 4 ชม. + IP คงที่', down: 100, up: 100, price: 4500, router: 'เราเตอร์ธุรกิจ', contract: 12, biz: 1 },
    b300: { isp: 'biz', n: 'วงจรธุรกิจ SME 300/300 Mbps SLA 8 ชม. + IP คงที่ 2 ตัว', down: 300, up: 300, price: 5900, router: 'เราเตอร์ธุรกิจ', contract: 12, biz: 1 },
    b500: { isp: 'biz', n: 'วงจรธุรกิจ 500/500 Mbps SLA 4 ชม. + IP คงที่ 4 ตัว', down: 500, up: 500, price: 8900, router: 'เราเตอร์ธุรกิจ + สวิตช์', contract: 12, biz: 1 },
    b1g: { isp: 'biz', n: 'วงจรธุรกิจ 1 Gbps SLA + IP คงที่ 5 ตัว', down: 1000, up: 1000, price: 14900, router: 'เราเตอร์ธุรกิจ + สวิตช์', contract: 24, biz: 1 },
    b2g: { isp: 'biz', n: 'วงจรธุรกิจ 2 Gbps SLA 99.9% + IP คงที่ 8 ตัว', down: 2000, up: 2000, price: 29000, router: 'เราเตอร์ธุรกิจ 10G + สวิตช์', contract: 24, biz: 1 },
    b5g: { isp: 'biz', n: 'วงจรธุรกิจ 5 Gbps เฉพาะ SLA 99.95%', down: 5000, up: 5000, price: 42000, router: 'เราเตอร์ Carrier 10G', contract: 24, biz: 1 },
    b10g: { isp: 'biz', n: 'วงจรธุรกิจ 10 Gbps เฉพาะ (Dedicated)', down: 10000, up: 10000, price: 59000, router: 'เราเตอร์ Carrier 10G', contract: 36, biz: 1 },
    b20g: { isp: 'biz', n: 'วงจรธุรกิจ 20 Gbps เฉพาะ 2 เส้นทางสำรอง', down: 20000, up: 20000, price: 118000, router: 'เราเตอร์ Carrier 100G', contract: 36, biz: 1 },
  };
  for (const k in PK) NET_PKGS[k] = PK[k];

  // ----- speed of a single extra line -----
  const wx = () => (S.weather && S.weather.type) || 'sunny';
  const gridDark = () => { try { return Grid.st().src === 'none'; } catch (e) { return false; } };
  // modem / router / dish on a UPS keep the line alive while the UPS lasts
  const upsCarry = () => gridDark() && safe2(() => Sec.site('home').dev.some(d => DEV[d.k].t === 'ups') && Sec.powered('home'), false);
  const safe2 = (f, d) => { try { return f(); } catch (e) { return d; } };
  function lineSpeed(L) {
    const P = NET_PKGS[L.pkg]; if (!P || L.appt) return 0;
    if (L.down > 0 || L.unpaid >= 2) return 0;
    if (gridDark() && !P.battery && !upsCarry()) return 0;
    const h = Math.floor(S.time / 60), rush = h >= 19 && h < 23, zone = (zoneAt(HOUSE_POS.x, HOUSE_POS.z) || {}).id;
    let k = P.sat ? { sunny: 0.92, partly: 0.9, cloudy: 0.85, fog: 0.85, rain: 0.6, storm: 0.3 }[wx()] ?? 0.85
      : P.wireless ? (zone === 'farm' ? 0.55 : 0.8) * (rush ? 0.6 : 1) * (wx() === 'storm' ? 0.6 : 1) : (rush ? 0.9 : 0.96);
    if (P.cap && L.usedGB > P.cap) k = Math.min(k, 8 / P.down);          // over the data cap: throttled to 8 Mbps
    return Math.round(P.down * k);
  }
  // main line (isp.js + v23_it) keeps its own rules; satellite as the main line feels the weather too
  const prevSpeed = ISP.speed.bind(ISP);
  function mainSpeed() {
    let v = prevSpeed(); const P = ISP.pkg(), m = ISP.st();
    if (!v && P && m.down <= 0 && m.unpaid < 2 && upsCarry()) v = Math.round(P.down * (P.wireless ? 0.5 : 0.96));
    if (!P || !v) return v;
    if (P.sat) v = Math.round(v * ({ rain: 0.65, storm: 0.3, cloudy: 0.92, fog: 0.9 }[wx()] ?? 1));
    return v;
  }
  function parts() {
    const out = [{ id: 'main', main: 1, v: mainSpeed(), P: ISP.pkg(), mode: 'main' }];
    for (const L of N36.lines()) out.push({ id: L.id, v: lineSpeed(L), P: NET_PKGS[L.pkg], mode: L.mode || 'sum', L });
    return out;
  }
  // sum the lines that are in "sum" mode; a standby line only carries traffic when nothing else is up
  function total() {
    const ps = parts(); let act = ps.filter(p => p.mode !== 'standby').reduce((s, p) => s + p.v, 0);
    if (act > 0) return { v: act, via: ps.filter(p => p.mode !== 'standby' && p.v > 0).map(p => p.id), failover: false, ps };
    const sb = ps.filter(p => p.mode === 'standby' && p.v > 0).sort((a, b) => b.v - a.v)[0];
    return sb ? { v: sb.v, via: [sb.id], failover: true, ps } : { v: 0, via: [], failover: false, ps };
  }
  ISP.speed = function () { return total().v; };
  ISP.lineInfo = function () { return total(); };
  ISP.lines = function () { return parts(); };
  // total upload follows the real mix of lines, not just the main plan's ratio
  const _up = Sec.upMbps.bind(Sec);
  Sec.upMbps = function (site) {
    if (site !== 'home') return _up(site);
    const t = total(); if (!t.v) return 0;
    return Math.round(t.ps.filter(p => t.via.includes(p.id)).reduce((s, p) => s + (p.P ? p.v * p.P.up / p.P.down : 0), 0));
  };
  const _hn = Sec.hasNet.bind(Sec); Sec.hasNet = function (site) { return _hn(site); };

  // ----- ordering -----
  function order(k, slot) {
    const s = N36.st(), P = NET_PKGS[k], I = ISPS[P.isp];
    if (!ISP.pkg()) { UI.toast('สมัครอินเทอร์เน็ตหลักของบ้านก่อน (แท็บ "สมัครแพ็กเกจ") แล้วค่อยเพิ่มสายเสริม', '📶'); return; }
    if (s.lines.length >= 10) { UI.toast('มีสายเสริมได้ไม่เกิน 10 สาย', '📶'); return; }
    if (typeof Gov24 !== 'undefined' && Gov24.need && !Gov24.need(['idcard'], 'สมัครอินเทอร์เน็ต')) return;
    const cost = (P.setup || 0) + (I.extra && !I.cover('farm') ? I.extra : 0);
    if (S.money < cost) { UI.toast(`เงินไม่พอค่าติดตั้ง ${baht0(cost)}`, '💸'); return; }
    if (cost) { S.money -= cost; Bank2.log(`ค่าติดตั้งสายเน็ตเสริม ${P.n}`, -cost); }
    const L = { id: 'L' + (++s.n), pkg: k, since: S.day, until: P.contract ? S.day + P.contract * 7 : 0, due: 0, unpaid: 0, down: 0, cause: '', mode: s.lines.some(l => (l.mode || 'sum') === 'standby') || !s.lines.length ? 'standby' : 'sum', usedGB: 0, appt: null };
    if (P.wireless || P.sat) { L.appt = null; UI.toast(`${P.n} ส่งอุปกรณ์ถึงบ้านแล้ว ติดตั้งเสร็จ ใช้งานได้ทันที`, '📦'); }
    else { L.appt = { day: S.day + 1, slot: slot === 'pm' ? 'pm' : 'am' }; Phone.msg(I.n, `นัดช่างลากสายเสริม ${P.n} ${RD(S.day + 1)} ช่วง${slot === 'pm' ? 'บ่าย' : 'เช้า'} กรุณาอยู่ที่บ้าน`, false); }
    s.lines.push(L); s.log.unshift(`${RD(S.day)}: สมัคร ${P.n}`); s.log.length = Math.min(s.log.length, 12);
    try { Life2.note('สมัครสายอินเทอร์เน็ตเสริม ' + P.n); } catch (e) { }
  }
  function cancelLine(id) {
    const s = N36.st(), L = s.lines.find(l => l.id === id); if (!L) return; const P = NET_PKGS[L.pkg];
    const left = L.until > S.day ? Math.ceil((L.until - S.day) / 7) : 0, fee = left ? Math.min(P.biz ? 12000 : 3000, left * (P.biz ? 900 : 250)) : 0;
    if (S.money < fee) { UI.toast(`ค่าปรับยกเลิกก่อนครบสัญญา ${baht0(fee)}`, '💸'); return; }
    if (fee) { S.money -= fee; Bank2.log('ค่าปรับยกเลิกสายเน็ตเสริม', -fee); }
    s.lines.splice(s.lines.indexOf(L), 1); UI.toast(`ยกเลิก ${P.n} แล้ว${fee ? ' จ่ายค่าปรับ ' + baht0(fee) : ''}`, '📶');
  }
  function payLine(id) { const L = N36.st().lines.find(l => l.id === id); if (!L || !L.due || S.money < L.due) return; S.money -= L.due; Bank2.log('ค่าอินเทอร์เน็ตสายเสริม', -L.due); L.due = 0; L.unpaid = 0; UI.toast('ชำระค่าสายเสริมแล้ว', '📶'); }
  // when the main line is cancelled the first extra line takes its place
  const _cancel = ISP.cancel.bind(ISP);
  ISP.cancel = function () {
    _cancel(); const s = N36.st(); if (ISP.pkg() || !s.lines.length) return;
    const L = s.lines.shift(), P = NET_PKGS[L.pkg], m = ISP.st();
    Object.assign(m, { pkg: L.pkg, isp: P.isp, since: L.since, until: L.until, appt: null, unpaid: L.unpaid, due: L.due, down: L.down, addons: {} });
    UI.toast(`สายเสริม ${P.n} ขึ้นเป็นสายหลักแทน`, '📶');
  };
  const _order = ISP.order.bind(ISP);
  ISP.order = function (k, slot) {
    const P = NET_PKGS[k];
    if (P && P.setup && !ISP.st().pkg) { if (S.money < P.setup) { UI.toast(`เงินไม่พอค่าติดตั้งจาน ${baht0(P.setup)}`, '💸'); return; } S.money -= P.setup; Bank2.log(`ค่าติดตั้ง ${P.n}`, -P.setup); }
    _order(k, slot);
  };

  // ----- hourly: technician visits, faults, data caps, failover notice -----
  const _hour = ISP.hour.bind(ISP);
  ISP.hour = function (h) {
    _hour(h);
    const s = N36.st(); const before = s.fo || 0;
    for (const L of s.lines) {
      const P = NET_PKGS[L.pkg], I = ISPS[P.isp];
      if (L.appt && S.day === L.appt.day) {
        const at = L.appt.slot === 'am' ? 10 : 14, inFarm = (zoneAt(G.player.pos.x, G.player.pos.z) || {}).id === 'farm' || G.inside;
        if (h === at && inFarm) { L.appt = null; Phone.msg(I.n, `ช่างลากสายเสริม ${P.n} เสร็จแล้ว`, false); }
        else if (h > at + 2 && !inFarm) { L.appt = { day: S.day + 1, slot: L.appt.slot }; Phone.msg(I.n, 'ช่างมาแล้วแต่ไม่มีคนอยู่บ้าน เลื่อนเป็นพรุ่งนี้', false); }
      }
      if (L.appt) continue;
      if (L.down > 0) { L.down--; if (!L.down) Phone.msg(I.n, `สายเสริม ${P.n} กลับมาใช้งานได้แล้ว`, false); }
      else if (Math.random() < I.fault / 24 * (wx() === 'storm' ? 4 : wx() === 'rain' && P.sat ? 3 : 1)) { L.down = 2 + ((Math.random() * 6) | 0); L.cause = P.sat ? 'จานรับสัญญาณถูกบังจากเมฆฝน' : P.wireless ? 'เสาสัญญาณขัดข้อง' : 'สายไฟเบอร์ขาด'; Phone.msg(I.n, `สายเสริม ${P.n} ขัดข้อง: ${L.cause}`, false); }
      if (P.cap && lineSpeed(L) > 0) L.usedGB = (L.usedGB || 0) + (h >= 18 && h < 24 ? 0.9 : 0.15);
    }
    // main line down while a standby is up → tell the player once
    const t = total(), mainDown = !!(ISP.pkg() && !t.ps[0].v);
    if (t.failover && mainDown && !s.fo) { s.fo = 1; s.failedAt = S.day; Phone.msg('ระบบเครือข่ายบ้าน', `สายหลักใช้ไม่ได้ ระบบสลับไปสายสำรองอัตโนมัติ (${t.v} Mbps)`, false); }
    if (!mainDown && s.fo) { s.fo = 0; Phone.msg('ระบบเครือข่ายบ้าน', 'สายหลักกลับมาแล้ว ใช้งานผ่านสายหลักตามปกติ', false); }
  };
  // a fresh billing month: separate bills for every extra line
  const _bill = Life2.bill.bind(Life2);
  Life2.bill = function () {
    _bill();
    for (const L of N36.st().lines) {
      if (L.appt) continue; const P = NET_PKGS[L.pkg], I = ISPS[P.isp], amt = Math.round(P.price * 1.07);
      if (L.due) L.unpaid++; L.due += amt; if (P.cap) L.usedGB = 0;
      Phone.msg(I.n, `ใบแจ้งค่าบริการสายเสริม ${P.n} ${baht0(amt)} (รวม VAT)${L.unpaid ? ` · ค้างชำระ ${L.unpaid} รอบ${L.unpaid >= 2 ? ' ถูกระงับสัญญาณ' : ''}` : ''}`, false);
    }
  };

  // ----- UI: extra tab inside the internet app -----
  function modeLabel(m) { return m === 'standby' ? '🛟 สายสำรอง (ใช้เมื่อสายอื่นล่ม)' : '➕ รวมความเร็ว (ใช้พร้อมกัน)'; }
  function linesHtml() {
    const s = N36.st(), t = total();
    const P0 = ISP.pkg();
    if (!P0) return '<p class="lead">ยังไม่มีสายหลัก — สมัครแพ็กเกจในแท็บ "สมัครแพ็กเกจ" ก่อน แล้วค่อยเพิ่มสายเสริมได้ที่นี่</p>';
    const row = (name, p, extra) => `<div class="card"><div class="ci">${ISPS[p.P.isp].i}</div><div class="cb"><h4>${name}: ${esc(p.P.n)}</h4><p class="dim">${p.v ? `🟢 ${p.v} Mbps` : '🔴 ใช้ไม่ได้'}${t.via.includes(p.id) ? ' · กำลังใช้งาน' : ''} · ${baht0(p.P.price)}/เดือน</p>${extra || ''}</div></div>`;
    const ps = t.ps;
    const mainRow = row('สายหลัก', ps[0], '');
    const rows = ps.slice(1).map(p => {
      const L = p.L; const extra = `<p class="dim">${modeLabel(L.mode || 'sum')}${L.appt ? ` · รอช่าง${RD(L.appt.day)}` : ''}${L.down ? ` · ขัดข้อง: ${esc(L.cause)}` : ''}${L.unpaid >= 2 ? ' · ถูกระงับ (ค้างชำระ)' : ''}${p.P.cap ? ` · ใช้ข้อมูล ${Math.round(L.usedGB || 0)}/${p.P.cap}GB` : ''}${L.until ? ` · สัญญาถึง${RD(L.until)}` : ''}</p><div class="row"><button class="btn ghost" data-a="v36nmode" data-v="${L.id}">สลับโหมด</button>${L.due ? `<span class="dim">🧾 บิลค้าง ${baht0(L.due)} · ชำระที่ บิล & ค่าบริการ</span>` : ''}<button class="btn ghost danger" data-a="v36ncancel" data-v="${L.id}">ยกเลิกสาย</button></div>`;
      return row('สายเสริม ' + L.id, p, extra);
    }).join('');
    const catalog = Object.entries(NET_PKGS).map(([k, P]) => `<div class="card"><div class="ci">${ISPS[P.isp].i}</div><div class="cb"><h4>${esc(P.n)}</h4><p class="dim">${ISPS[P.isp].n} · ${P.down}/${P.up} Mbps · ${baht0(P.price)}/เดือน${P.setup ? ` · ติดตั้ง ${baht0(P.setup)}` : ''}${P.cap ? ` · เพดานข้อมูล ${P.cap}GB` : ''}${P.contract ? ` · สัญญา ${P.contract} เดือน` : ' · ไม่มีสัญญา'}</p><div class="row"><button class="btn" data-a="v36nbuy" data-v="${k}">➕ เพิ่มเป็นสายเสริม</button></div></div></div>`).join('');
    return `<p class="lead">รวมความเร็วตอนนี้ <b>${t.v} Mbps</b> ผ่าน ${t.via.length} สาย${t.failover ? ' · ⚠️ ใช้สายสำรองอยู่' : ''} · เสริมได้สูงสุด 10 สาย แต่ละสายมีบิลและสัญญาแยกกัน</p><div class="grid">${mainRow}${rows}</div><h5>เพิ่มสายเสริม (${Object.keys(NET_PKGS).length} แพ็กเกจ)</h5><div class="grid">${catalog}</div>`;
  }
  ISP.linesHtml = linesHtml;
  ISP.open = function () { UI.open('อินเทอร์เน็ตบ้าน', ['แพ็กเกจของฉัน', 'สมัครแพ็กเกจ', 'สายเสริม / สำรอง'], t => t === 2 ? linesHtml() : ISP.html(t), { wide: true }); };
  Object.assign(UI.H, {
    v36nbuy: d => order(d.v, d.s), v36npay: d => payLine(d.v), v36ncancel: d => cancelLine(d.v),
    v36nmode: d => { const L = N36.st().lines.find(l => l.id === d.v); if (L) L.mode = (L.mode || 'sum') === 'sum' ? 'standby' : 'sum'; },
  });
  window.Net36 = N36; N36.order = order; N36.total = total; N36.lineSpeed = lineSpeed;
  N36.st();
});
