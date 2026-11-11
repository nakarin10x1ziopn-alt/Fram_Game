'use strict';
// ---------- Security & network shop (40 items) and a realistic connection system: every device is installed at a site
// (your home or a company site) and plugged into a parent — internet → firewall/router → switch → cameras / APs / NVR —
// with real limits: LAN ports, PoE ports and PoE power budget, Wi-Fi clients, NVR channels and HDD bays, cable runs,
// recording days from HDD size and camera bitrate, remote viewing over the upload speed, and UPS backup in a power cut ----------
const DEV = {
  // network
  rt_home: { c: 'net', t: 'router', n: 'เราเตอร์ WiFi 6 สำหรับบ้าน', i: '📡', price: 2490, lan: 4, wifi: 32, thr: 1000, w: 12 },
  rt_biz: { c: 'net', t: 'router', n: 'เราเตอร์ธุรกิจ Dual-WAN + VPN', i: '📡', price: 8900, lan: 5, wifi: 0, thr: 2500, w: 18 },
  r4g: { c: 'net', t: 'router', n: 'เราเตอร์ 4G/5G ใส่ซิม (ไม่ต้องมีเน็ตบ้าน)', i: '📶', price: 3990, lan: 4, wifi: 32, thr: 300, w: 10, sim: 1 },
  fw: { c: 'net', t: 'firewall', n: 'ไฟร์วอลล์องค์กร NGFW 10G', i: '🛡️', price: 45000, lan: 8, thr: 10000, w: 45 },
  sw8: { c: 'net', t: 'switch', n: 'สวิตช์ Gigabit 8 พอร์ต', i: '🔀', price: 690, lan: 8, poe: 0, up: 1, w: 5 },
  sw8p: { c: 'net', t: 'switch', n: 'สวิตช์ PoE 8 พอร์ต (งบไฟ 120W)', i: '🔀', price: 2990, lan: 8, poe: 8, budget: 120, up: 1, w: 10 },
  sw16p: { c: 'net', t: 'switch', n: 'สวิตช์ PoE 16 พอร์ต (งบไฟ 250W)', i: '🔀', price: 7900, lan: 16, poe: 16, budget: 250, up: 1, w: 18 },
  sw24p: { c: 'net', t: 'switch', n: 'สวิตช์ PoE+ 24 พอร์ต Managed อัปลิงก์ 10G (370W)', i: '🔀', price: 18900, lan: 24, poe: 24, budget: 370, up: 10, w: 30 },
  sw10g: { c: 'net', t: 'switch', n: 'สวิตช์ Core 10G 24 พอร์ต', i: '🔀', price: 39000, lan: 24, poe: 0, up: 10, w: 60 },
  // v202: more switches for small, medium and large businesses (ports / PoE budget / uplink Gbps / watts)
  sw5: { c: 'net', t: 'switch', n: 'สวิตช์ Gigabit 5 พอร์ต ตั้งโต๊ะ (ร้านเล็ก/มุมเคาน์เตอร์)', i: '🔀', price: 430, lan: 5, poe: 0, up: 1, w: 3 },
  sw5p: { c: 'net', t: 'switch', n: 'สวิตช์ PoE 5 พอร์ต (งบไฟ 65W) กล้อง 2-4 ตัว', i: '🔀', price: 1890, lan: 5, poe: 4, budget: 65, up: 1, w: 8 },
  sw16: { c: 'net', t: 'switch', n: 'สวิตช์ Gigabit 16 พอร์ต ตั้งโต๊ะ/ติดผนัง', i: '🔀', price: 2190, lan: 16, poe: 0, up: 1, w: 9 },
  sw8pm: { c: 'net', t: 'switch', n: 'สวิตช์ PoE+ 8 พอร์ต Smart (งบไฟ 150W) ร้านขนาดเล็ก', i: '🔀', price: 5290, lan: 8, poe: 8, budget: 150, up: 1, w: 12 },
  sw24: { c: 'net', t: 'switch', n: 'สวิตช์ Gigabit 24 พอร์ต ติดแร็ค (สำนักงานขนาดกลาง)', i: '🔀', price: 2890, lan: 24, poe: 0, up: 1, w: 15 },
  sw48: { c: 'net', t: 'switch', n: 'สวิตช์ Gigabit 48 พอร์ต ติดแร็ค', i: '🔀', price: 6900, lan: 48, poe: 0, up: 10, w: 28 },
  sw24pb: { c: 'net', t: 'switch', n: 'สวิตช์ PoE+ 24 พอร์ต Smart (งบไฟ 250W)', i: '🔀', price: 11900, lan: 24, poe: 24, budget: 250, up: 1, w: 22 },
  sw24pm: { c: 'net', t: 'switch', n: 'สวิตช์ PoE+ 24 พอร์ต Managed L2+ (งบไฟ 400W) อัปลิงก์ 10G SFP+', i: '🔀', price: 24900, lan: 24, poe: 24, budget: 400, up: 10, w: 34 },
  swout: { c: 'net', t: 'switch', n: 'สวิตช์ PoE กลางแจ้งกันน้ำ IP67 4 พอร์ต (งบไฟ 120W) ติดเสา/ตู้', i: '🔀', price: 6900, lan: 4, poe: 4, budget: 120, up: 1, w: 8 },
  swind: { c: 'net', t: 'switch', n: 'สวิตช์อุตสาหกรรม DIN-rail PoE+ 8 พอร์ต (งบไฟ 240W) โรงงาน/โกดัง', i: '🔀', price: 14900, lan: 8, poe: 8, budget: 240, up: 1, w: 15 },
  sw48p: { c: 'net', t: 'switch', n: 'สวิตช์ PoE+ 48 พอร์ต Managed L3 (งบไฟ 740W) อัปลิงก์ 10G', i: '🔀', price: 39900, lan: 48, poe: 48, budget: 740, up: 10, w: 55 },
  sw48pp: { c: 'net', t: 'switch', n: 'สวิตช์ PoE++ 48 พอร์ต Core (งบไฟ 1,440W) อัปลิงก์ 25G', i: '🔀', price: 125700, lan: 48, poe: 48, budget: 1440, up: 25, w: 95 },
  sw10g48: { c: 'net', t: 'switch', n: 'สวิตช์ Core/Aggregation 10G 48 พอร์ต SFP+ L3', i: '🔀', price: 98000, lan: 48, poe: 0, up: 40, w: 120 },
  sw40g: { c: 'net', t: 'switch', n: 'สวิตช์ Spine 40G 32 พอร์ต QSFP+ (ห้องเซิร์ฟเวอร์องค์กรใหญ่)', i: '🔀', price: 290000, lan: 32, poe: 0, up: 100, w: 250 },
  sw100g: { c: 'net', t: 'switch', n: 'สวิตช์ Spine/Leaf 100G 32 พอร์ต QSFP28 (ดาต้าเซ็นเตอร์)', i: '🔀', price: 780000, lan: 32, poe: 0, up: 400, w: 420 },
  sw400g: { c: 'net', t: 'switch', n: 'สวิตช์ 400G 32 พอร์ต (ผู้ให้บริการ / คลัสเตอร์ AI)', i: '🔀', price: 2400000, lan: 32, poe: 0, up: 1600, w: 900 },
  ap: { c: 'net', t: 'ap', n: 'Access Point WiFi 6 ติดเพดาน (ใช้ไฟ PoE)', i: '📶', price: 3290, wifi: 64, poeIn: 12 },
  mesh: { c: 'net', t: 'ap', n: 'ชุด Mesh WiFi 6 (3 ตัว เสียบปลั๊ก)', i: '📶', price: 5990, wifi: 48, w: 15 },
  cat6: { c: 'net', t: 'cable', n: 'สาย LAN Cat6 กล่อง 305 ม. (เดินได้ 15 จุด)', i: '🧵', price: 3200, runs: 15 },
  coax: { c: 'net', t: 'coax', n: 'สาย RG6+ไฟ 100 ม. (กล้องอนาล็อก 5 จุด)', i: '🧵', price: 990, runs: 5 },
  rack9: { c: 'net', t: 'rack', n: 'ตู้แร็คติดผนัง 9U', i: '🗄️', price: 3500, u: 9 },
  rack42: { c: 'net', t: 'rack', n: 'ตู้แร็ค 42U', i: '🗄️', price: 18000, u: 42 },
  ups1: { c: 'net', t: 'ups', n: 'UPS 1.5kVA สำรองไฟอุปกรณ์เครือข่าย', i: '🔋', price: 4500, va: 1500 },
  ups10: { c: 'net', t: 'ups', n: 'UPS Online 10kVA (ห้องเซิร์ฟเวอร์)', i: '🔋', price: 85000, va: 10000 },
  nas: { c: 'net', t: 'nas', n: 'NAS 4 ช่องสำรองข้อมูล', i: '💽', price: 15900, bays: 4, w: 30 },
  server: { c: 'net', t: 'server', n: 'เซิร์ฟเวอร์ 2U Xeon 64 คอร์ (ต้องมีตู้แร็ค)', i: '🖥️', price: 120000, w: 450 },
  // cameras & recorders
  cam_b2: { c: 'cam', t: 'cam', n: 'กล้อง IP Bullet 2MP (PoE)', i: '📷', price: 1390, ip: 1, poeIn: 5, br: 3 },
  cam_d4: { c: 'cam', t: 'cam', n: 'กล้อง IP Dome 4MP อินฟราเรด (PoE)', i: '📷', price: 2290, ip: 1, poeIn: 6, br: 6 },
  cam_8k: { c: 'cam', t: 'cam', n: 'กล้อง IP 4K 8MP ภาพสีกลางคืน (PoE)', i: '📷', price: 4590, ip: 1, poeIn: 8, br: 12 },
  cam_ptz: { c: 'cam', t: 'cam', n: 'กล้อง PTZ หมุน/ซูม 25 เท่า (PoE+)', i: '🎥', price: 15900, ip: 1, poeIn: 25, br: 8 },
  cam_wifi: { c: 'cam', t: 'cam', n: 'กล้อง WiFi ในบ้าน บันทึกคลาวด์', i: '📷', price: 990, wifiC: 1, br: 2, w: 5, cloud: 1 },
  cam_4g: { c: 'cam', t: 'cam', n: 'กล้องโซลาร์ 4G ใส่ซิม (ไม่ต้องเดินสาย)', i: '📷', price: 4990, solo: 1, br: 2, cloud: 1, sim: 1 },
  cam_ahd: { c: 'cam', t: 'cam', n: 'กล้องอนาล็อก AHD 2MP (ต่อ DVR ด้วยสายนำสัญญาณ)', i: '📷', price: 690, analog: 1, br: 2, w: 4 },
  nvr8: { c: 'cam', t: 'nvr', n: 'เครื่องบันทึก NVR 8 ช่อง', i: '📼', price: 3990, ch: 8, bays: 1, w: 10 },
  nvr8p: { c: 'cam', t: 'nvr', n: 'NVR 8 ช่อง มีพอร์ต PoE ในตัว (80W)', i: '📼', price: 6990, ch: 8, bays: 2, lan: 8, poe: 8, budget: 80, w: 15 },
  nvr32: { c: 'cam', t: 'nvr', n: 'NVR 32 ช่อง 4K', i: '📼', price: 18900, ch: 32, bays: 4, w: 25 },
  dvr8: { c: 'cam', t: 'dvr', n: 'เครื่องบันทึก DVR 8 ช่อง (กล้องอนาล็อก)', i: '📼', price: 2490, ch: 8, bays: 1, w: 10 },
  hdd2: { c: 'cam', t: 'hdd', n: 'ฮาร์ดดิสก์กล้องวงจรปิด 2TB', i: '💾', price: 2190, tb: 2 },
  hdd4: { c: 'cam', t: 'hdd', n: 'ฮาร์ดดิสก์กล้องวงจรปิด 4TB', i: '💾', price: 3490, tb: 4 },
  hdd8: { c: 'cam', t: 'hdd', n: 'ฮาร์ดดิสก์กล้องวงจรปิด 8TB', i: '💾', price: 6990, tb: 8 },
  // security
  alarm: { c: 'sec', t: 'alarm', n: 'แผงควบคุมสัญญาณกันขโมยไร้สาย (WiFi)', i: '🚨', price: 4990, wifiC: 1, w: 3, zones: 32 },
  pir: { c: 'sec', t: 'sensor', n: 'เซนเซอร์จับความเคลื่อนไหว PIR', i: '👁️', price: 590 },
  doorS: { c: 'sec', t: 'sensor', n: 'เซนเซอร์ประตู/หน้าต่าง', i: '🚪', price: 390 },
  siren: { c: 'sec', t: 'sensor', n: 'ไซเรนกันขโมย 120 dB', i: '📢', price: 690 },
  smoke: { c: 'sec', t: 'sensor', n: 'เครื่องตรวจจับควันไฟ', i: '💨', price: 790 },
  access: { c: 'sec', t: 'access', n: 'เครื่องสแกนนิ้ว/บัตรควบคุมประตู (PoE)', i: '🖐️', price: 5990, ip: 1, poeIn: 6 },
  dlock: { c: 'sec', t: 'lock', n: 'ดิจิทัลล็อก WiFi ประตูหน้าบ้าน', i: '🔐', price: 6990, wifiC: 1 },
  fm200: { c: 'sec', t: 'fire', n: 'ระบบดับเพลิงอัตโนมัติ FM-200 ห้องเซิร์ฟเวอร์', i: '🧯', price: 250000 },
  pac: { c: 'sec', t: 'pac', n: 'แอร์ห้องเซิร์ฟเวอร์ Precision AC 10kW', i: '❄️', price: 180000, w: 4000 },
};
for (const k in DEV) ITEMS['sec_' + k] = { n: DEV[k].n, i: DEV[k].i, cat: 'part', sell: Math.round(DEV[k].price * 0.5) };
SHOPS.secshop = { n: 'ไอทีซีเคียวริตี้ ทุ่งทอง', tabs: [
  { n: '📡 เราเตอร์ WiFi สาย ตู้แร็ค UPS', items: Object.keys(DEV).filter(k => DEV[k].c === 'net' && DEV[k].t !== 'switch').map(k => 'sec:' + k) },
  { n: '🔀 สวิตช์ (เล็ก · กลาง · ใหญ่)', items: Object.keys(DEV).filter(k => DEV[k].t === 'switch').sort((a, b) => DEV[a].price - DEV[b].price).map(k => 'sec:' + k) },
  { n: '📷 กล้องวงจรปิด เครื่องบันทึก', items: Object.keys(DEV).filter(k => DEV[k].c === 'cam').map(k => 'sec:' + k) },
  { n: '🚨 ระบบความปลอดภัย', items: Object.keys(DEV).filter(k => DEV[k].c === 'sec').map(k => 'sec:' + k) },
] };
ENTRY_KINDS.sec = id => { const D = DEV[id]; return { icon: D.i, name: D.n, desc: Sec.spec(D), price: D.price, multi: ['cat6', 'coax', 'pir', 'doorS', 'cam_b2', 'cam_d4', 'hdd4'].includes(id), own: count('sec_' + id), buy: q => addItem('sec_' + id, q || 1) }; };

const Sec = {
  spec(D) {
    const p = [];
    if (D.lan) p.push(`${D.lan} พอร์ต LAN`); if (D.poe) p.push(`PoE ${D.poe} พอร์ต งบไฟ ${D.budget}W`); if (D.up) p.push(`อัปลิงก์ ${D.up}G`); if (D.wifi) p.push(`WiFi รองรับ ${D.wifi} เครื่อง`); if (D.thr) p.push(`รับส่งข้อมูล ${D.thr} Mbps`);
    if (D.poeIn) p.push(`ใช้ไฟ PoE ${D.poeIn}W`); if (D.br) p.push(`บิตเรต ${D.br} Mbps`); if (D.ch) p.push(`${D.ch} ช่องกล้อง ใส่ HDD ${D.bays} ลูก`); if (D.tb) p.push(`${D.tb}TB`); if (D.runs) p.push(`เดินสาย ${D.runs} จุด`); if (D.va) p.push(`${D.va}VA`); if (D.w) p.push(`กินไฟ ${D.w}W`);
    if (D.wifiC) p.push('เชื่อม WiFi'); if (D.sim) p.push('ต้องมีซิมเน็ต'); if (D.analog) p.push('ต่อกับ DVR'); if (D.t === 'sensor') p.push('จับคู่กับแผงกันขโมย');
    return p.join(' · ');
  },
  st() { if (!S.sec) S.sec = { sites: { home: { dev: [] } }, n: 0, cable: 0, coax: 0, armed: 0, sims: {} }; return S.sec; },
  site(id) { const s = this.st(); return s.sites[id] || (s.sites[id] = { dev: [] }); },
  siteName(id) { if (id === 'home') return 'บ้านของคุณ'; const c = typeof Company !== 'undefined' && Company.get(id.slice(3)); return c ? `${c.name} (${c.site ? CO_SITES[c.site].n : 'ยังไม่มีที่ตั้ง'})` : id; },
  hasNet(site) { if (site === 'home') return !!(S.isp && S.isp.pkg); const c = typeof Company !== 'undefined' && Company.get(site.slice(3)); return !!(c && c.net); },
  // what can be plugged into what
  parents(site, D) {
    const L = this.site(site).dev, out = [];
    const used = p => L.filter(d => d.p === p.uid && !(DEV[d.k].wifiC || DEV[d.k].t === 'sensor' || DEV[d.k].t === 'hdd')).length;
    const wused = p => L.filter(d => d.p === p.uid && DEV[d.k].wifiC).length;
    if (D.t === 'router' || D.t === 'firewall') { if (D.sim || this.hasNet(site)) out.push({ uid: 'isp', n: D.sim ? 'ซิมเน็ตมือถือ' : 'อินเทอร์เน็ต (ONT ของผู้ให้บริการ)' }); for (const p of L) if (DEV[p.k].t === 'firewall' && D.t === 'router' && used(p) < DEV[p.k].lan) out.push(p); return out; }
    if (D.solo) return [{ uid: 'solo', n: 'ทำงานเดี่ยวผ่านซิม 4G' }];
    if (D.t === 'hdd') return L.filter(p => (DEV[p.k].t === 'nvr' || DEV[p.k].t === 'dvr' || DEV[p.k].t === 'nas') && L.filter(d => d.p === p.uid && DEV[d.k].t === 'hdd').length < DEV[p.k].bays);
    if (D.t === 'sensor') return L.filter(p => DEV[p.k].t === 'alarm' && L.filter(d => d.p === p.uid).length < DEV[p.k].zones);
    if (D.analog) return L.filter(p => DEV[p.k].t === 'dvr' && L.filter(d => d.p === p.uid && DEV[d.k].analog).length < DEV[p.k].ch);
    if (D.wifiC) return L.filter(p => (DEV[p.k].wifi || 0) > wused(p));
    if (['rack', 'ups', 'fire', 'pac'].includes(D.t)) return [{ uid: 'site', n: 'ติดตั้งในสถานที่' }];
    if (D.t === 'server' && !L.some(d => DEV[d.k].t === 'rack' && DEV[d.k].u >= 42)) return [];
    // wired LAN devices: routers, firewalls, switches and PoE NVRs with a free port
    return L.filter(p => { const P = DEV[p.k]; if (!P.lan || used(p) >= P.lan) return false; if (P.t === 'nvr' && !D.ip) return false; return true; });
  },
  poeLeft(site, p) { const P = DEV[p.k]; if (!P.poe) return 0; const kids = this.site(site).dev.filter(d => d.p === p.uid && DEV[d.k].poeIn); return kids.length >= P.poe ? 0 : P.budget - kids.reduce((s, d) => s + DEV[d.k].poeIn, 0); },
  install(site, k, parent) {
    const D = DEV[k], L = this.site(site).dev, st = this.st();
    if (!count('sec_' + k)) return 'ไม่มีอุปกรณ์นี้ในกระเป๋า';
    const P = parent === 'isp' || parent === 'solo' || parent === 'site' ? null : L.find(d => d.uid === parent);
    if (!this.parents(site, D).some(p => p.uid === parent)) return 'เสียบกับอุปกรณ์นี้ไม่ได้ (พอร์ตเต็มหรือไม่รองรับ)';
    const wired = P && !D.wifiC && D.t !== 'sensor' && D.t !== 'hdd';
    if (D.poeIn && wired && this.poeLeft(site, P) < D.poeIn) return `${DEV[P.k].n} ไม่มีพอร์ต PoE หรืองบไฟ PoE ไม่พอ (เหลือ ${this.poeLeft(site, P)}W ต้องใช้ ${D.poeIn}W) — ใช้สวิตช์ PoE`;
    if (D.sim && !(st.sims[site] > L.filter(d => DEV[d.k].sim).length)) return 'ต้องมีซิมเน็ตสำหรับอุปกรณ์นี้ (สมัครแพ็กเกจซิมในแอปอินเทอร์เน็ต)';
    if (wired) { if (D.analog) { if (st.coax <= 0) return 'สายนำสัญญาณ RG6 หมด ซื้อเพิ่มที่ร้าน'; st.coax--; } else { if (st.cable <= 0) return 'สาย LAN หมด (ซื้อสาย Cat6 แล้วแกะกล่องในหน้าผังเครือข่าย)'; st.cable--; } }
    takeItem('sec_' + k); L.push({ uid: 'd' + (++st.n), k, p: parent });
    return '';
  },
  remove(site, uid) {
    const L = this.site(site).dev, d = L.find(x => x.uid === uid); if (!d) return;
    if (L.some(x => x.p === uid)) { UI.toast('ถอดอุปกรณ์ที่ต่ออยู่ใต้ตัวนี้ออกก่อน', '🔌'); return; }
    L.splice(L.indexOf(d), 1); addItem('sec_' + d.k);
  },
  unbox() { const st = this.st(); let n = 0; while (count('sec_cat6')) { takeItem('sec_cat6'); st.cable += 15; n++; } while (count('sec_coax')) { takeItem('sec_coax'); st.coax += 5; n++; } if (n) UI.toast('แกะกล่องสายแล้ว พร้อมเดินสาย', '🧵'); },
  // ----- live status of a site -----
  powered(site) {
    const L = this.site(site).dev, ups = L.filter(d => DEV[d.k].t === 'ups').reduce((s, d) => s + DEV[d.k].va, 0), w = this.watts(site);
    const gridOn = site === 'home' ? !(typeof Grid !== 'undefined' && Grid.st().src === 'none') : !(typeof Company !== 'undefined' && Company.dark(site.slice(3)));
    return gridOn || ups >= w * 1.25;
  },
  watts(site) { return this.site(site).dev.reduce((s, d) => s + (DEV[d.k].w || DEV[d.k].poeIn || 0), 0); },
  upMbps(site) { if (site === 'home') { if (typeof ISP === 'undefined' || !ISP.pkg()) return 0; return Math.round(ISP.speed() * ISP.pkg().up / ISP.pkg().down); } const c = Company.get(site.slice(3)); return c && c.net && BIZ_NET[c.net] ? BIZ_NET[c.net].up : 0; },
  status(site) {
    const L = this.site(site).dev, on = this.powered(site), tree = {};
    for (const d of L) (tree[d.p] = tree[d.p] || []).push(d);
    // a device is online when every link up to the internet / recorder is installed and the site has power
    const online = d => { if (!on) return false; if (d.p === 'isp' || d.p === 'site' || d.p === 'solo') return true; const p = L.find(x => x.uid === d.p); return !!p && online(p); };
    const cams = L.filter(d => DEV[d.k].t === 'cam'), recs = L.filter(d => DEV[d.k].t === 'nvr' || DEV[d.k].t === 'dvr');
    const rec = []; let br = 0, tb = 0;
    for (const r of recs) { const hdd = L.filter(d => d.p === r.uid && DEV[d.k].t === 'hdd'), t = hdd.reduce((s, d) => s + DEV[d.k].tb, 0); const mine = cams.filter(c => online(c) && (DEV[c.k].analog ? c.p === r.uid : DEV[r.k].t === 'nvr' && !DEV[c.k].cloud)).slice(0, DEV[r.k].ch); if (t > 0 && online(r)) { rec.push(...mine.filter(c => !rec.includes(c))); br += mine.reduce((s, c) => s + DEV[c.k].br, 0); tb += t; } }
    const cloud = cams.filter(c => DEV[c.k].cloud && online(c));
    const days = br ? (tb * 1e6) / (br * 10800) : 0, up = this.upMbps(site), remote = cams.filter(c => online(c) && (rec.includes(c) || cloud.includes(c)));
    const alarm = L.find(d => DEV[d.k].t === 'alarm' && online(d)), sensors = alarm ? L.filter(d => d.p === alarm.uid).length : 0;
    return { on, cams: cams.length, onCnt: cams.filter(online).length, rec: rec.length + cloud.length, days, up, remoteOK: up >= remote.length * 1.5 && remote.length > 0, alarm: !!alarm, sensors, smoke: L.some(d => d.k === 'smoke'), isOn: online };
  },
  // ----- network map UI -----
  ui(site = 'home') {
    this.cur = site;
    UI.open('ผังเครือข่าย & กล้องวงจรปิด', null, () => {
      const st = this.st(), L = this.site(site).dev, S2 = this.status(site);
      const node = (d, depth) => { const D = DEV[d.k], kids = L.filter(x => x.p === d.uid); return `<div style="margin-left:${depth * 18}px" class="lead">${S2.isOn(d) ? '🟢' : '🔴'} ${D.i} ${esc(D.n)}${D.poe ? ` · PoE เหลือ ${this.poeLeft(site, d)}W` : ''} <button class="btn ghost" data-a="secrm" data-v="${d.uid}">ถอด</button></div>${kids.map(k => node(k, depth + 1)).join('')}`; };
      const roots = L.filter(d => ['isp', 'site', 'solo'].includes(d.p));
      const inv = Object.keys(DEV).filter(k => count('sec_' + k) > 0 && !['cat6', 'coax'].includes(k));
      const sites = ['home'].concat(typeof Company !== 'undefined' ? Company.list().map(c => 'co:' + c.id) : []);
      return `<div class="row">${sites.map(s => `<button class="btn ${s === site ? '' : 'ghost'}" data-a="secsite" data-v="${s}">${esc(this.siteName(s))}</button>`).join('')}</div>
        <p class="lead">${S2.on ? '⚡ มีไฟ' : '🌑 ไม่มีไฟ (ต่อ UPS ให้พอ)'} · อินเทอร์เน็ต ${this.hasNet(site) ? '✅' : '❌'} · สาย LAN เหลือ ${st.cable} จุด · สายกล้องอนาล็อก ${st.coax} จุด${count('sec_cat6') || count('sec_coax') ? ' <button class="btn ghost" data-a="secunbox">แกะกล่องสาย</button>' : ''} · กินไฟ ${this.watts(site)}W</p>
        <p class="lead">📷 กล้อง ${S2.onCnt}/${S2.cams} ออนไลน์ · บันทึกอยู่ ${S2.rec} ตัว${S2.days ? ` · เก็บย้อนหลังได้ ~${S2.days.toFixed(1)} วัน` : ''} · ดูออนไลน์ ${S2.remoteOK ? `ได้ (อัปโหลด ${S2.up} Mbps)` : 'ไม่ได้'} · กันขโมย ${S2.alarm ? `✅ เซนเซอร์ ${S2.sensors}` : '❌'}</p>
        <h5>ผังการเชื่อมต่อ</h5>${roots.length ? roots.map(r => node(r, 0)).join('') : '<p class="dim">ยังไม่มีอุปกรณ์ เริ่มจากเราเตอร์ต่ออินเทอร์เน็ต แล้วต่อสวิตช์ PoE → กล้อง/AP/NVR</p>'}
        <h5>ติดตั้งอุปกรณ์จากกระเป๋า</h5>${inv.length ? `<div class="grid">${inv.map(k => { const ps = this.parents(site, DEV[k]); return `<div class="card"><div class="ci">${DEV[k].i}</div><div class="cb"><h4>${esc(DEV[k].n)} ×${count('sec_' + k)}</h4><p class="dim">${Sec.spec(DEV[k])}</p><div class="row">${ps.length ? ps.slice(0, 6).map(p => `<button class="btn ghost" data-a="secin" data-k="${k}" data-v="${p.uid}">ต่อกับ ${esc(p.n || DEV[p.k].n)}${p.uid.startsWith('d') ? ' #' + p.uid.slice(1) : ''}</button>`).join('') : '<span class="dim">ยังไม่มีจุดให้ต่อ (ต้องมีอุปกรณ์ต้นทางที่ว่าง)</span>'}</div></div></div>`; }).join('')}</div>` : '<p class="dim">ไม่มีอุปกรณ์ในกระเป๋า ซื้อได้ที่ไอทีซีเคียวริตี้ ทุ่งทอง</p>'}`;
    }, { wide: true });
  },
  // ----- effects -----
  thiefMult() { const s = this.status('home'); return Math.max(0.3, 1 - Math.min(0.45, s.rec * 0.07) - (s.alarm && S.sec.armed && s.sensors ? 0.25 : 0)); },
  evidence(stolen) {
    const s = this.status('home'); if (!s.rec) return;
    const v = Object.keys(stolen).reduce((t, k) => t + (CROPS[k] ? CROPS[k].sell * stolen[k] : 0), 0);
    this.st().case = { day: S.day + 1, v };
    Phone.msg('สถานีตำรวจภูธรสุขใจ', `ได้รับภาพจากกล้องวงจรปิดของคุณแล้ว เห็นหน้าคนร้ายชัดเจน กำลังติดตามตัวครับ`);
  },
  morning() {
    const c = this.st().case; if (c && S.day >= c.day) { this.st().case = null; if (Math.random() < 0.85) { earn(c.v); Bank2.income('ได้ของคืนจากภาพกล้องวงจรปิด', c.v); Phone.msg('สถานีตำรวจภูธรสุขใจ', `จับคนร้ายได้จากภาพกล้องวงจรปิด ชดใช้ค่าเสียหาย ${baht(c.v)} แล้วครับ`); } }
  },
  init() {
    this.st();
    // roadside on ทุ่งทอง's main street (west row, facing the road) so it is seen from the street, not hidden behind the shophouses
    const x = 157.5, z = -306, rot = Math.PI / 2, o = { w: 11, d: 8, h: 4.8, flat: true, glassFront: true, wall: 0x263238, roof: 0x37474f, sign: 'ไอทีซีเคียวริตี้', signStyle: { bg: '#d32f2f' } };
    const b = World.building(o); b.position.set(x, World.groundY(x, z), z); b.rotation.y = rot; World.outdoor.add(b); Col.box(x, z, o.w / 2 + 0.3, o.d / 2 + 0.3, rot, 'bld'); World.clearNear(x, z, 8, true);
    const door = l2w(x, z, rot, 0, o.d / 2 + 1.7);
    // roadside pylon sign, camera domes over the glass front and a paved forecourt with a lit display
    const f = new THREE.Group(); f.position.set(x, World.groundY(x, z), z); f.rotation.y = rot; World.outdoor.add(f);
    U.mk(f, U.box(10, 0.1, 3.4, 2), texMat('paving', 0xcfd8dc), [0, 0.05, o.d / 2 + 1.7]);
    const px = l2w(x, z, rot, -6.6, o.d / 2 + 2.6), pg = World.groundY(px.x, px.z);
    U.mk(World.outdoor, GEO.cyl, M.metal, [px.x, pg + 3, px.z], [0.25, 6, 0.25]); Col.circle(px.x, px.z, 0.35);
    const ps = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.7), new THREE.MeshStandardMaterial({ map: U.signTex('📷 ไอทีซีเคียวริตี้', { w: 512, h: 256, bg: '#d32f2f', fg: '#ffffff' }), emissive: 0x551111, side: THREE.DoubleSide })); ps.position.set(px.x, pg + 6.3, px.z); ps.rotation.y = rot; World.outdoor.add(ps);
    for (const s of [-3.6, 0, 3.6]) U.mk(f, GEO.sph, new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.3 }), [s, o.h - 0.25, o.d / 2 + 0.35], [0.22, 0.22, 0.22]);
    World.pois.push({ kind: 'shop', id: 'secshop', x: door.x, z: door.z + 1.2, r: 2.2, label: 'ไอทีซีเคียวริตี้ (กล้อง เครือข่าย ระบบความปลอดภัย)', icon: '📷', map: true });
    World.pois.push({ kind: 'act', x: door.x, z: door.z - 1.4, r: 2, label: 'ช่างวางระบบเครือข่าย', icon: '🧑‍🔧', act: () => ({ icon: '🧑‍🔧', label: 'ผังเครือข่าย & ติดตั้งอุปกรณ์', fn: () => this.ui('home') }) });
    // devices draw power at home; thieves avoid a recorded, alarmed farm; footage helps the police
    Power.extra.push(() => this.watts('home') / 1000);
    APPS.splice(7, 0, { id: 'cctv', i: '📹', n: 'กล้อง & เครือข่าย' });
    Phone.apps.cctv = () => { const s = this.status('home'); setTimeout(() => { if (Phone.app === 'cctv') { Phone.app = null; UI.close(); this.ui('home'); } }, 1200); return `<p class="lead">📹 กล้องบ้าน: ${s.onCnt}/${s.cams} ออนไลน์ · บันทึก ${s.rec} · ${s.remoteOK ? '🟢 ดูออนไลน์ได้' : '🔴 ดูออนไลน์ไม่ได้'} · กันขโมย ${s.alarm ? (S.sec.armed ? '🔒 เปิดระบบ' : '🔓 ปิดระบบ') : 'ไม่มี'}</p><div class="row"><button class="btn" data-a="secarm">${S.sec.armed ? 'ปิดระบบกันขโมย' : 'เปิดระบบกันขโมย'}</button></div>`; };
  },
};
Object.assign(UI.H, {
  secin: d => { const e = Sec.install(Sec.cur, d.k, d.v); UI.toast(e || 'ติดตั้งและเชื่อมต่อเรียบร้อย', e ? '⚠️' : '🔌'); },
  secrm: d => Sec.remove(Sec.cur, d.v), secunbox: () => Sec.unbox(), secsite: d => { Sec.cur = d.v; UI.close(); Sec.ui(d.v); },
  secarm: () => { const s = Sec.status('home'); if (!s.alarm) { UI.toast('ยังไม่มีแผงกันขโมยที่ออนไลน์', '🚨'); return; } S.sec.armed = S.sec.armed ? 0 : 1; UI.toast(S.sec.armed ? 'เปิดระบบกันขโมยแล้ว' : 'ปิดระบบกันขโมย', '🚨'); },
});
