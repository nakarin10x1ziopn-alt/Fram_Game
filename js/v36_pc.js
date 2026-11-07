'use strict';
// ---------- v36_pc: the full real-world PC parts catalogue (CPU / board / RAM / GPU / storage / PSU / case / cooling / monitors / peripherals /
// network / laptops / consoles …) with real compatibility checks in the builder, a dedicated PC-building shop in every city (build, parts,
// assembly service with waiting days, repair & upgrade, trade-in, warranty 1–3 years) and the upgraded village PC plaza ----------
V23.add('v36_pc', () => {
  const st = () => { const s = S.v36p = S.v36p || {}; s.jobs = s.jobs || []; s.n = s.n || 0; s.hist = s.hist || []; return s; };
  const YEAR = 84;                                            // 1 game week = 1 month, 12 weeks = 1 year
  const SOCK = { S1700: 'LGA1700', S1851: 'LGA1851', Z5: 'AM5', AM4: 'AM4', sTR5: 'sTR5' };
  const sockN = s => SOCK[s] || s;
  const STD_SOCKS = ['S1700', 'S1851', 'Z5', 'AM4'];
  const log = (t, n) => { try { Bank2.log(t, n); } catch (e) { } };
  const msg = (f, t) => { try { Phone.msg(f, t, true); } catch (e) { } };
  const pay = (n, why) => { if (S.money < n) { UI.toast('เงินไม่พอ ต้องใช้ ' + baht(n), '💸'); return false; } S.money -= n; log(why, -n); return true; };

  // ================================================================= 1. the catalogue =================================================================
  const X5 = (window.CATDATA && CATDATA.g5) || {}, XCPU = X5.cpu || [], XGPU = (X5.gpu || []).slice(0, 35), XLAP = X5.lap || [], XNET = (X5.net || []).slice(0, 64).map(r => [r[0], r[1], r[2]]), XRAM = (window.RAM91 ? RAM91() : []);
  const add = (k, s, n, i, price, o) => { if (PC_PARTS[k]) return; PC_PARTS[k] = Object.assign({ s, n, i, price }, o); ITEMS['pc_' + k] = { n, i, cat: 'part', sell: Math.round(price * 0.55) }; };
  // CPUs: [key, name, socket, TDP, perf, price, cores]
  for (const [k, n, sock, w, perf, price, c] of [
    ['i3_12100f', 'Intel Core i3-12100F', 'S1700', 58, 24, 2290, '4C/8T'], ['i3_14100f', 'Intel Core i3-14100F', 'S1700', 58, 27, 3190, '4C/8T'],
    ['i5_12400f', 'Intel Core i5-12400F', 'S1700', 65, 40, 4190, '6C/12T'], ['i5_13400f', 'Intel Core i5-13400F', 'S1700', 65, 50, 6290, '10C/16T'],
    ['i5_14400f', 'Intel Core i5-14400F', 'S1700', 65, 52, 6590, '10C/16T'], ['i5_14600k', 'Intel Core i5-14600K', 'S1700', 125, 70, 9990, '14C/20T'],
    ['i7_13700k', 'Intel Core i7-13700K', 'S1700', 125, 78, 12900, '16C/24T'], ['i7_14700k', 'Intel Core i7-14700K', 'S1700', 125, 86, 13990, '20C/28T'],
    ['i9_13900k', 'Intel Core i9-13900K', 'S1700', 125, 92, 17900, '24C/32T'], ['i9_14900k', 'Intel Core i9-14900K', 'S1700', 125, 96, 19900, '24C/32T'],
    ['u5_245k', 'Intel Core Ultra 5 245K', 'S1851', 125, 72, 10900, '14C/14T'], ['u7_265k', 'Intel Core Ultra 7 265K', 'S1851', 125, 88, 14900, '20C/20T'],
    ['u9_285k', 'Intel Core Ultra 9 285K', 'S1851', 125, 100, 21900, '24C/24T'],
    ['r3_4100', 'AMD Ryzen 3 4100', 'AM4', 65, 24, 1990, '4C/8T'], ['r5_5500', 'AMD Ryzen 5 5500', 'AM4', 65, 38, 2490, '6C/12T'],
    ['r5_5600', 'AMD Ryzen 5 5600', 'AM4', 65, 44, 3290, '6C/12T'], ['r7_5700x', 'AMD Ryzen 7 5700X', 'AM4', 65, 52, 4990, '8C/16T'],
    ['r7_5700x3d', 'AMD Ryzen 7 5700X3D', 'AM4', 105, 62, 6990, '8C/16T'], ['r7_5800x3d', 'AMD Ryzen 7 5800X3D', 'AM4', 105, 66, 8900, '8C/16T'],
    ['r9_5900x', 'AMD Ryzen 9 5900X', 'AM4', 105, 66, 7990, '12C/24T'],
    ['r5_7500f', 'AMD Ryzen 5 7500F', 'Z5', 65, 56, 4790, '6C/12T'], ['r5_7600', 'AMD Ryzen 5 7600', 'Z5', 65, 58, 6490, '6C/12T'],
    ['r5_7600x', 'AMD Ryzen 5 7600X', 'Z5', 105, 62, 6990, '6C/12T'], ['r7_7700', 'AMD Ryzen 7 7700', 'Z5', 65, 66, 8990, '8C/16T'],
    ['r7_7800x3d', 'AMD Ryzen 7 7800X3D', 'Z5', 120, 90, 13900, '8C/16T'], ['r7_9700x', 'AMD Ryzen 7 9700X', 'Z5', 65, 74, 10900, '8C/16T'],
    ['r7_9800x3d', 'AMD Ryzen 7 9800X3D', 'Z5', 120, 98, 16500, '8C/16T'], ['r9_7900x', 'AMD Ryzen 9 7900X', 'Z5', 170, 82, 12500, '12C/24T'],
    ['r9_9900x', 'AMD Ryzen 9 9900X', 'Z5', 120, 84, 13900, '12C/24T'], ['r9_9950x', 'AMD Ryzen 9 9950X', 'Z5', 170, 100, 21900, '16C/32T'],
    ['r9_9950x3d', 'AMD Ryzen 9 9950X3D', 'Z5', 170, 104, 24900, '16C/32T'],
    ['tr_7960x', 'AMD Ryzen Threadripper 7960X', 'sTR5', 350, 108, 46900, '24C/48T'], ['tr_7970x', 'AMD Ryzen Threadripper 7970X', 'sTR5', 350, 118, 69900, '32C/64T'],
    ['tr_7980x', 'AMD Ryzen Threadripper 7980X', 'sTR5', 350, 130, 169000, '64C/128T'],
  ].concat(XCPU)) add('c_' + k, 'cpu', 'ซีพียู ' + n, '🧠', price, { sock, w, perf, d: `${c} · ซ็อกเก็ต ${sockN(sock)} · TDP ${w}W · ประสิทธิภาพ ${perf}` });
  // motherboards: [key, name, socket, size, ddr, price]
  for (const [k, n, sock, size, ddr, price] of [
    ['h610m', 'H610M', 'S1700', 'mATX', 4, 2490], ['b660m', 'B660M', 'S1700', 'mATX', 4, 3490], ['b760m', 'B760M', 'S1700', 'mATX', 5, 4590], ['b760', 'B760 (ATX)', 'S1700', 'ATX', 4, 4890],
    ['z690', 'Z690', 'S1700', 'ATX', 5, 7900], ['z790', 'Z790', 'S1700', 'ATX', 5, 9900], ['z790i', 'Z790I (Mini-ITX)', 'S1700', 'ITX', 5, 10900],
    ['b860m', 'B860M', 'S1851', 'mATX', 5, 5900], ['z890', 'Z890', 'S1851', 'ATX', 5, 10900], ['z890i', 'Z890I (Mini-ITX)', 'S1851', 'ITX', 5, 12900],
    ['a520m', 'A520M', 'AM4', 'mATX', 4, 1990], ['b450m', 'B450M', 'AM4', 'mATX', 4, 1790], ['b550m', 'B550M', 'AM4', 'mATX', 4, 2990], ['b550', 'B550 (ATX)', 'AM4', 'ATX', 4, 3890],
    ['x570', 'X570', 'AM4', 'ATX', 4, 6500], ['b550i', 'B550I (Mini-ITX)', 'AM4', 'ITX', 4, 4900],
    ['a620m', 'A620M', 'Z5', 'mATX', 5, 2990], ['b650m', 'B650M', 'Z5', 'mATX', 5, 4500], ['b650', 'B650 (ATX)', 'Z5', 'ATX', 5, 5900], ['b650e', 'B650E', 'Z5', 'ATX', 5, 7500],
    ['x670e', 'X670E', 'Z5', 'ATX', 5, 11900], ['x870', 'X870', 'Z5', 'ATX', 5, 10500], ['x870e', 'X870E', 'Z5', 'ATX', 5, 13900], ['b650i', 'B650I (Mini-ITX)', 'Z5', 'ITX', 5, 7900], ['x870ei', 'X870E-I (Mini-ITX)', 'Z5', 'ITX', 5, 14900],
    ['trx50', 'TRX50 (E-ATX)', 'sTR5', 'EATX', 5, 36900], ['wrx90', 'WRX90E (E-ATX)', 'sTR5', 'EATX', 5, 69900],
  ]) add('m_' + k, 'mobo', 'เมนบอร์ด ' + n + ` (${sockN(sock)}, DDR${ddr})`, '🟩', price, { sock, size, ddr, w: 20, d: `ซ็อกเก็ต ${sockN(sock)} · ขนาด ${size} · แรม DDR${ddr}` });
  // memory: [key, GB, ddr, MHz, price]
  for (const [k, gb, ddr, mhz, price, br] of [
    ['d4_8', 8, 4, 3200, 690], ['d4_16', 16, 4, 3200, 1390], ['d4_16b', 16, 4, 3600, 1590], ['d4_32', 32, 4, 3200, 2490], ['d4_32b', 32, 4, 3600, 2790], ['d4_64', 64, 4, 3600, 5490],
    ['d5_16', 16, 5, 5600, 1990], ['d5_32', 32, 5, 5600, 3490], ['d5_32b', 32, 5, 6000, 3990], ['d5_32c', 32, 5, 6400, 4590], ['d5_48', 48, 5, 6000, 5900], ['d5_64', 64, 5, 6000, 7490],
    ['d5_64b', 64, 5, 6400, 8900], ['d5_96', 96, 5, 6400, 12900], ['d5_128', 128, 5, 5600, 14900], ['d5_192', 192, 5, 5600, 24900],
  ].concat(XRAM)) add('r_' + k, 'ram', `แรม ${br ? br + ' ' : ''}DDR${ddr} ${gb}GB ${mhz}MHz`, '📏', price, { ddr, gb, perf: Math.round(({ 8: 2, 16: 3, 32: 6, 48: 8, 64: 9, 96: 11, 128: 12, 192: 13 }[gb] || 3) + (mhz >= 6000 ? 1 : 0)), w: Math.ceil(gb / 16) * 2 + 3, d: `DDR${ddr} · ${gb}GB · ${mhz}MHz` });
  // graphics cards: [key, name, board W, perf, length mm, price]
  for (const [k, n, w, perf, len, price] of [
    ['gtx1650', 'NVIDIA GeForce GTX 1650 4GB', 75, 18, 190, 3990], ['gtx1660s', 'NVIDIA GeForce GTX 1660 Super 6GB', 125, 24, 230, 5500],
    ['r3050', 'NVIDIA GeForce RTX 3050 6GB', 70, 26, 200, 4990], ['r3060', 'NVIDIA GeForce RTX 3060 12GB', 170, 38, 242, 7900], ['r3060ti', 'NVIDIA GeForce RTX 3060 Ti 8GB', 200, 46, 242, 9500],
    ['r3070', 'NVIDIA GeForce RTX 3070 8GB', 220, 52, 270, 11500], ['r3080', 'NVIDIA GeForce RTX 3080 10GB', 320, 64, 285, 14900], ['r3090', 'NVIDIA GeForce RTX 3090 24GB', 350, 74, 313, 28900],
    ['r4060', 'NVIDIA GeForce RTX 4060 8GB', 115, 45, 240, 10900], ['r4060ti', 'NVIDIA GeForce RTX 4060 Ti 16GB', 165, 54, 245, 15500], ['r4070', 'NVIDIA GeForce RTX 4070 12GB', 200, 62, 267, 18900],
    ['r4070s', 'NVIDIA GeForce RTX 4070 Super 12GB', 220, 72, 285, 21900], ['r4070tis', 'NVIDIA GeForce RTX 4070 Ti Super 16GB', 285, 80, 305, 29900], ['r4080s', 'NVIDIA GeForce RTX 4080 Super 16GB', 320, 88, 310, 37900],
    ['r4090', 'NVIDIA GeForce RTX 4090 24GB', 450, 100, 336, 69900],
    ['r5050', 'NVIDIA GeForce RTX 5050 8GB', 130, 40, 230, 8900], ['r5060', 'NVIDIA GeForce RTX 5060 8GB', 145, 50, 242, 11900], ['r5060ti', 'NVIDIA GeForce RTX 5060 Ti 16GB', 180, 58, 250, 17900],
    ['r5070', 'NVIDIA GeForce RTX 5070 12GB', 250, 70, 270, 22900], ['r5070ti', 'NVIDIA GeForce RTX 5070 Ti 16GB', 300, 82, 304, 31900], ['r5080', 'NVIDIA GeForce RTX 5080 16GB', 360, 96, 304, 42900],
    ['r5090', 'NVIDIA GeForce RTX 5090 32GB', 575, 115, 336, 89900],
    ['rx6600', 'AMD Radeon RX 6600 8GB', 132, 36, 245, 6500], ['rx6700xt', 'AMD Radeon RX 6700 XT 12GB', 230, 54, 267, 10900], ['rx6800xt', 'AMD Radeon RX 6800 XT 16GB', 300, 68, 300, 16900],
    ['rx7600', 'AMD Radeon RX 7600 8GB', 165, 42, 204, 8900], ['rx7700xt', 'AMD Radeon RX 7700 XT 12GB', 245, 62, 267, 15900], ['rx7800xt', 'AMD Radeon RX 7800 XT 16GB', 263, 65, 267, 17900],
    ['rx7900gre', 'AMD Radeon RX 7900 GRE 16GB', 260, 72, 276, 19900], ['rx7900xt', 'AMD Radeon RX 7900 XT 20GB', 315, 80, 276, 25900], ['rx7900xtx', 'AMD Radeon RX 7900 XTX 24GB', 355, 88, 287, 34900],
    ['rx9060xt', 'AMD Radeon RX 9060 XT 16GB', 160, 56, 250, 14900], ['rx9070', 'AMD Radeon RX 9070 16GB', 220, 78, 300, 24900], ['rx9070xt', 'AMD Radeon RX 9070 XT 16GB', 304, 88, 320, 27900],
    ['a380', 'Intel Arc A380 6GB', 75, 20, 175, 3990], ['a750', 'Intel Arc A750 8GB', 225, 38, 267, 7900], ['b570', 'Intel Arc B570 10GB', 150, 42, 242, 8500], ['b580', 'Intel Arc B580 12GB', 190, 48, 272, 9900],
    ['ws_a2000', 'NVIDIA RTX A2000 12GB (เวิร์กสเตชัน)', 70, 28, 168, 19900], ['ws_4000ada', 'NVIDIA RTX 4000 Ada 20GB (เวิร์กสเตชัน)', 130, 55, 241, 49900],
    ['ws_5000ada', 'NVIDIA RTX 5000 Ada 32GB (เวิร์กสเตชัน)', 250, 80, 267, 169000], ['ws_6000ada', 'NVIDIA RTX 6000 Ada 48GB (เวิร์กสเตชัน)', 300, 108, 267, 299000],
    ['ws_w7800', 'AMD Radeon Pro W7800 32GB (เวิร์กสเตชัน)', 260, 76, 277, 99000],
  ].concat(XGPU)) add('g_' + k, 'gpu', 'การ์ดจอ ' + n, '🎮', price, { w, perf, len, d: `กินไฟ ${w}W · ยาว ${len}มม. · ประสิทธิภาพ ${perf}` });
  // storage: [key, name, perf, price]
  for (const [k, n, perf, price] of [
    ['s256', 'SSD SATA 256GB', 1, 690], ['s512', 'SSD SATA 512GB', 2, 1200], ['s1t', 'SSD SATA 1TB', 3, 1990], ['s2t', 'SSD SATA 2TB', 4, 3990],
    ['n3_500', 'SSD NVMe Gen3 500GB', 3, 990], ['n3_1t', 'SSD NVMe Gen3 1TB', 4, 1790], ['n3_2t', 'SSD NVMe Gen3 2TB', 5, 3490],
    ['n4_500', 'SSD NVMe Gen4 500GB', 4, 1290], ['n4_1t', 'SSD NVMe Gen4 1TB (ไว)', 5, 2200], ['n4_2t', 'SSD NVMe Gen4 2TB (ไว)', 7, 4200], ['n4_4t', 'SSD NVMe Gen4 4TB', 8, 9500],
    ['n5_1t', 'SSD NVMe Gen5 1TB', 8, 4900], ['n5_2t', 'SSD NVMe Gen5 2TB', 9, 7900], ['n5_4t', 'SSD NVMe Gen5 4TB (เร็วสุด)', 11, 15900],
  ]) add('d_' + k, 'ssd', n, '💾', price, { perf, w: 4, d: n + ' · ประสิทธิภาพ ' + perf });
  for (const [k, n, price] of [['h1t', 'HDD 3.5" 1TB 7200rpm', 1290], ['h2t', 'HDD 3.5" 2TB 7200rpm', 1790], ['h4t', 'HDD 3.5" 4TB 5400rpm', 3190], ['h8t', 'HDD 3.5" 8TB 7200rpm', 6290],
    ['h12t', 'HDD NAS 12TB', 8990], ['h16t', 'HDD NAS 16TB', 11900], ['h20t', 'HDD Enterprise 20TB', 15900], ['h24t', 'HDD Enterprise 24TB', 19900]])
    add('d_' + k, 'hdd', n, '💽', price, { w: 8, d: n + ' · เก็บข้อมูลจำนวนมาก (ไม่บังคับ)' });
  // power supplies: [key, W, rating, price, sfx]
  for (const [k, cap, r, price, sfx] of [['450w', 450, '80+ White', 790], ['600b', 600, '80+ Bronze', 1190], ['650b', 650, '80+ Bronze', 1590], ['650g', 650, '80+ Gold', 2290], ['850g', 850, '80+ Gold', 3990],
    ['850p', 850, '80+ Platinum', 5490], ['1000p', 1000, '80+ Platinum', 7490], ['1200p', 1200, '80+ Platinum', 8900], ['1300t', 1300, '80+ Titanium', 11900], ['sfx750', 750, '80+ Gold SFX', 4500, 1], ['sfx1000', 1000, '80+ Platinum SFX-L', 7900, 1]])
    add('p_' + k, 'psu', `พาวเวอร์ ${cap}W ${r}`, '🔌', price, { cap, sfx: !!sfx, d: `${cap}W · ${r}${sfx ? ' · ขนาด SFX' : ''}` });
  // cases: [key, name, fits, gpuMax, coolH, rads, price, sff]
  for (const [k, n, fit, gpuMax, coolH, rads, price, sff] of [
    ['mini', 'เคส Mini-ITX SFF กะทัดรัด', ['ITX'], 320, 70, [120, 240], 4500, 1], ['mesh_m', 'เคส mATX ตาข่ายระบายอากาศดี', ['mATX', 'ITX'], 330, 160, [120, 240], 1890],
    ['atx_b', 'เคส ATX งบประหยัด', ['ATX', 'mATX', 'ITX'], 330, 160, [120, 240], 1490], ['atx_m', 'เคส ATX ตาข่ายแอร์โฟลว์ พัดลมหน้า 3 ตัว', ['ATX', 'mATX', 'ITX'], 400, 165, [120, 240, 280, 360], 2490],
    ['atx_g', 'เคส ATX กระจก 2 ห้อง โชว์ฮาร์ดแวร์', ['ATX', 'mATX', 'ITX'], 420, 170, [120, 240, 280, 360], 3490], ['mid_p', 'เคส Mid-Tower พรีเมียม อะลูมิเนียม', ['ATX', 'mATX', 'ITX'], 430, 175, [120, 240, 280, 360, 420], 4990],
    ['super', 'เคส Super Tower รองรับ E-ATX', ['EATX', 'ATX', 'mATX', 'ITX'], 460, 190, [120, 240, 280, 360, 420], 9900],
  ]) add('k_' + k, 'case', n, '🗄️', price, { fit, gpuMax, coolH, rads, sff: !!sff, d: `รองรับบอร์ด ${fit.join('/')} · การ์ดจอยาวสุด ${gpuMax}มม. · ซิงก์สูงสุด ${coolH}มม.` });
  // coolers: [key, name, W capacity, price, height, radiator, socket list]
  for (const [k, n, cap, price, h, rad, socks] of [
    ['lp', 'ซิงก์ลมโลว์โปรไฟล์ (รับ 65W)', 65, 790, 47], ['t92', 'ซิงก์ลมทาวเวอร์ 92มม. (รับ 95W)', 95, 350, 128], ['t120', 'ซิงก์ลมทาวเวอร์ 120มม. (รับ 150W)', 150, 890, 155],
    ['dual', 'ซิงก์ลมทาวเวอร์คู่ (รับ 220W)', 220, 1990, 160], ['aio120', 'ชุดน้ำปิด 120mm (รับ 150W)', 150, 1990, 0, 120], ['aio240', 'ชุดน้ำปิด 240mm (รับ 220W)', 220, 2900, 0, 240],
    ['aio280', 'ชุดน้ำปิด 280mm (รับ 260W)', 260, 3900, 0, 280], ['aio360', 'ชุดน้ำปิด 360mm จอ LCD (รับ 300W)', 300, 4900, 0, 360], ['aio420', 'ชุดน้ำปิด 420mm จอ LCD (รับ 340W)', 340, 7900, 0, 420],
    ['tr', 'คูลเลอร์ Threadripper sTR5 (รับ 400W)', 400, 7900, 150, 0, ['sTR5']],
  ]) add('o_' + k, 'cool', 'ชุดระบายความร้อน ' + n, '❄️', price, { cap, h, rad, socks: socks || STD_SOCKS, d: `${rad ? 'ชุดน้ำ ' + rad + 'มม.' : 'ซิงก์ลม สูง ' + h + 'มม.'} · รับความร้อนได้ ${cap}W` });
  for (const [k, n, price, w] of [['f120', 'พัดลมเคส 120มม. (ชุด 1 ตัว)', 190, 3], ['f140', 'พัดลมเคส 140มม. (ชุด 1 ตัว)', 290, 3], ['f3rgb', 'พัดลม RGB 120มม. ชุด 3 ตัว + คอนโทรลเลอร์', 790, 9], ['f360', 'พัดลมเงียบพรีเมียม 140มม. ชุด 3 ตัว', 1690, 9],
    ['paste', 'ซิลิโคนระบายความร้อน (ซีพียู) 4g', 190, 0], ['paste2', 'ซิลิโคนประสิทธิภาพสูง 12.8 W/mK', 390, 0], ['metal', 'ลิควิดเมทัลระบายความร้อน', 690, 0]])
    add('f_' + k, 'fan', n, /paste|metal/.test(k) ? '🧴' : '🌀', price, { w, d: n + ' (ไม่บังคับ ช่วยให้เครื่องเย็นและเงียบ)' });
  // monitors: [key, name, perf, price]
  for (const [k, n, perf, price] of [
    ['m22', 'จอ 22" FHD 75Hz VA', 1, 2290], ['m24', 'จอ 24" FHD 100Hz IPS', 1, 2990], ['m24g', 'จอ 24" FHD 165Hz IPS (เกมมิ่ง)', 1, 4500], ['m27f', 'จอ 27" FHD 144Hz', 1, 4990], ['m27q', 'จอ 27" 2K 180Hz', 2, 8900],
    ['m27u', 'จอ 27" 4K 60Hz IPS (งานกราฟิก)', 2, 9500], ['m27u2', 'จอ 27" 4K 144Hz', 2, 14900], ['m32u', 'จอ 32" 4K IPS', 2, 16900], ['m34uw', 'จอ 34" ULTRAWIDE 165Hz', 2, 13900], ['m49', 'จอ 49" Super Ultrawide 240Hz', 3, 29900],
    ['m24e', 'จอ 24" 360Hz อีสปอร์ต', 2, 14900], ['mportable', 'จอพกพา 15.6" USB-C', 1, 4990], ['m43', 'จอ 43" 4K ทีวีมอนิเตอร์', 2, 14900], ['moled', 'จอ 27" OLED 240Hz', 3, 22900], ['moled32', 'จอ 32" 4K OLED 240Hz', 3, 38900],
  ]) add('v_' + k, 'mon', n, '🖥️', price, { perf, w: 0, d: n });
  // peripherals
  const per = (g, rows, ic) => { for (const [k, n, price] of rows) add('x_' + k, 'per', n, ic, price, { g, d: n }); };
  per('kb', [['kb_mem', 'คีย์บอร์ดเมมเบรนสายยูเอสบี', 390], ['kb_wl', 'คีย์บอร์ดไร้สายสลิม', 890], ['kb_tkl', 'คีย์บอร์ดเมคานิคอล TKL', 1490], ['kb_60', 'คีย์บอร์ดเมคานิคอล 60%', 1890], ['kb_pro', 'คีย์บอร์ดเมคานิคอลไร้สายพรีเมียม', 3990], ['kb_erg', 'คีย์บอร์ดสปลิตเพื่อสุขภาพ', 3500]], '⌨️');
  per('mouse', [['ms_off', 'เมาส์ออฟฟิศสายยูเอสบี', 290], ['ms_g', 'เมาส์เกมมิ่งสาย', 690], ['ms_lw', 'เมาส์เกมมิ่งไร้สายน้ำหนักเบา', 3490], ['ms_erg', 'เมาส์แนวตั้งเพื่อสุขภาพ', 1890], ['ms_tb', 'เมาส์ลูกกลิ้ง Trackball', 2200], ['ms_pad', 'แผ่นรองเมาส์ XL', 390]], '🖱️');
  per('headset', [['hs_st', 'หูฟังครอบหู สเตอริโอ', 790], ['hs_w', 'หูฟังเกมมิ่งไร้สาย 2.4GHz', 2990], ['hs_anc', 'หูฟังบลูทูธตัดเสียงรบกวน ANC', 4990], ['hs_open', 'หูฟังโอเพ่นแบ็ก ออดิโอไฟล์', 5900], ['hs_ear', 'หูฟังอินเอียร์ไร้สาย', 1490]], '🎧');
  per('webcam', [['wc_720', 'เว็บแคม HD 720p', 590], ['wc_1080', 'เว็บแคม Full HD 1080p', 1290], ['wc_4k', 'เว็บแคม 4K', 4200], ['wc_ptz', 'กล้องประชุม PTZ', 12900]], '📷');
  per('mic', [['mic_usb', 'ไมโครโฟนคอนเดนเซอร์ USB', 1990], ['mic_xlr', 'ชุดไมค์ XLR + ออดิโออินเตอร์เฟซ', 5900], ['mic_lav', 'ไมค์หนีบปกไร้สาย', 2500], ['mic_pod', 'ชุดพอดแคสต์ ขาตั้งบูม + ป๊อปฟิลเตอร์', 7900]], '🎙️');
  per('speaker', [['sp_20', 'ลำโพงคอมพิวเตอร์ 2.0', 690], ['sp_21', 'ลำโพง 2.1 พร้อมซับวูฟเฟอร์', 1990], ['sp_51', 'ลำโพงโฮมเธียเตอร์ 5.1', 4500], ['sp_bar', 'ซาวด์บาร์', 3900], ['sp_studio', 'ลำโพงสตูดิโอมอนิเตอร์ (คู่)', 7900], ['sp_bt', 'ลำโพงบลูทูธพกพา', 1490]], '🔊');
  per('ups', [['up_650', 'เครื่องสำรองไฟ UPS 650VA', 1990], ['up_1000', 'เครื่องสำรองไฟ UPS 1000VA', 2990], ['up_2000', 'เครื่องสำรองไฟ UPS 2000VA', 8900], ['up_3000', 'เครื่องสำรองไฟ UPS ออนไลน์ 3000VA', 19900]], '🔋');
  per('net', [['rt_5', 'เราเตอร์ Wi-Fi 5', 790], ['rt_6', 'เราเตอร์ Wi-Fi 6', 1490], ['rt_6e', 'เราเตอร์ Wi-Fi 6E', 3290], ['rt_7', 'เราเตอร์ Wi-Fi 7', 5900], ['rt_mesh', 'ชุด Mesh Wi-Fi 3 จุด', 7900], ['sw_8', 'สวิตช์ Gigabit 8 พอร์ต', 690], ['nic_25', 'การ์ดแลน 2.5G PCIe', 590], ['nic_wifi', 'การ์ด Wi-Fi 6E PCIe', 790], ['nic_10g', 'การ์ดแลน 10G PCIe', 2900]].concat(XNET), '🌐');
  per('addon', [['cap_4k', 'แคปเจอร์การ์ด 4K60 HDMI (ภายนอก)', 5900], ['cap_int', 'แคปเจอร์การ์ดภายใน PCIe', 8900], ['cap_usb', 'แคปเจอร์การ์ด USB 1080p', 1990], ['snd_pci', 'ซาวด์การ์ด PCIe', 2200], ['dac', 'DAC/แอมป์หูฟัง USB', 2990], ['audio_if', 'ออดิโออินเตอร์เฟซ 2 ช่อง', 3900], ['dvd', 'DVD เขียนแผ่นภายนอก USB', 890], ['bluray', 'Blu-ray เขียนแผ่นภายใน', 2990]], '🎛️');
  per('cable', [['hdmi21', 'สาย HDMI 2.1 ยาว 2 เมตร', 390], ['dp14', 'สาย DisplayPort 1.4 ยาว 2 เมตร', 350], ['cat6', 'สายแลน Cat6 10 เมตร', 150], ['hub7', 'ฮับ USB-C 7-in-1', 990], ['tbdock', 'Thunderbolt Dock', 8900], ['surge', 'ปลั๊กรางกันไฟกระชาก 6 ช่อง', 590], ['usbc', 'สาย USB-C ชาร์จเร็ว 100W', 290], ['pcie_riser', 'สาย PCIe Riser (ตั้งการ์ดจอแนวตั้ง)', 1290]], '🔌');
  per('stor', [['ex_1t', 'ฮาร์ดดิสก์พกพา 1TB USB 3.0', 1790], ['ex_4t', 'ฮาร์ดดิสก์พกพา 4TB', 3490], ['ex_ssd1', 'SSD พกพา 1TB USB-C', 2990], ['ex_ssd2', 'SSD พกพา 2TB USB-C', 5490], ['usb_128', 'แฟลชไดรฟ์ 128GB', 390], ['sd_256', 'เมมโมรี่การ์ด microSD 256GB', 690], ['nas2', 'NAS 2 ช่อง (ไม่รวมดิสก์)', 7900], ['nas4', 'NAS 4 ช่อง (ไม่รวมดิสก์)', 16900]], '🗃️');
  per('print', [['pr_ink', 'ปริ้นเตอร์อิงค์เจ็ท 3-in-1 ถังหมึก', 4290], ['pr_laser', 'ปริ้นเตอร์เลเซอร์ขาวดำ', 4990], ['pr_laserc', 'ปริ้นเตอร์เลเซอร์สี Wi-Fi', 9900], ['pr_photo', 'ปริ้นเตอร์โฟโต้พกพา', 3500], ['sc_doc', 'สแกนเนอร์เอกสาร', 5900], ['pr_3d', 'เครื่องพิมพ์ 3 มิติ', 11900], ['pr_lbl', 'เครื่องพิมพ์ฉลาก/ใบเสร็จความร้อน', 1890]], '🖨️');
  per('furn', [['gchair', 'เก้าอี้เกมมิ่งปรับนอนได้', 6900], ['ch_ergo', 'เก้าอี้เพื่อสุขภาพ เออร์โกโนมิก', 9900], ['desk_s', 'โต๊ะคอมพิวเตอร์ไม้ 120ซม.', 2990], ['desk_e', 'โต๊ะปรับระดับไฟฟ้า Standing Desk', 9900], ['desk_g', 'โต๊ะเกมมิ่งมีไฟ RGB', 5900], ['arm', 'ขาตั้งจอ Monitor Arm คู่', 1990], ['light', 'โคมไฟตั้งโต๊ะถนอมสายตา', 890], ['footrest', 'ที่พักเท้า', 590]], '💺');
  per('vr', [['vr_q', 'แว่น VR ไร้สายเล่นเกมในตัว', 15900], ['vr_pc', 'แว่น VR สำหรับพีซี (ต้องมีการ์ดจอแรง)', 22900], ['vr_ctrl', 'จอยควบคุม VR คู่', 3900], ['joy_pad', 'จอยเกมไร้สาย', 1890], ['wheel', 'ชุดพวงมาลัย + เบรก + เกียร์เกมแข่งรถ', 9900], ['flight', 'จอยสติ๊กเครื่องบิน HOTAS', 5900]], '🥽');
  per('console', [['cs_hand', 'เครื่องเล่นเกมพกพา', 15900], ['cs_s', 'เครื่องเล่นเกมคอนโซลรุ่นเล็ก', 9900], ['cs_x', 'เครื่องเล่นเกมคอนโซลรุ่นแรง', 17900], ['cs_xp', 'เครื่องเล่นเกมคอนโซลรุ่นท็อป 8K', 23900], ['cs_hdmi', 'กล่อง Android TV 4K', 1990]], '🎮');
  // laptops and tablets are complete computers: buying one adds it to "my computers" with Windows already installed
  for (const [k, n, price, score, perf, w] of [
    ['office', 'โน้ตบุ๊กออฟฟิศ 14" (i3 / 8GB / SSD 256GB)', 14900, 2600, 1, 45], ['student', 'โน้ตบุ๊กนักเรียน 15.6" (Ryzen 5 / 16GB / SSD 512GB)', 18900, 3400, 1, 60],
    ['ultra', 'อัลตร้าบุ๊ก 14" บางเบา (Core Ultra 7 / 16GB / SSD 1TB)', 32900, 5200, 2, 45], ['game4060', 'โน้ตบุ๊กเกมมิ่ง RTX 4060 (Ryzen 7 / 16GB)', 39900, 6600, 2, 140],
    ['game5070', 'โน้ตบุ๊กเกมมิ่ง RTX 5070 (Core Ultra 9 / 32GB)', 69900, 9200, 3, 200], ['wk', 'โน้ตบุ๊กเวิร์กสเตชัน (Xeon / 64GB / RTX 3000 Ada)', 89900, 10400, 3, 180],
    ['air', 'แล็ปท็อปบางเบา 13" ชิปประหยัดไฟ', 34900, 5600, 2, 30], ['pro', 'แล็ปท็อประดับโปร 16" ชิปแรง', 69900, 9800, 3, 90],
    ['tab', 'แท็บเล็ต 11" + ปากกา', 15900, 1800, 1, 15], ['tabpro', 'แท็บเล็ตระดับโปร 13" + คีย์บอร์ด', 36900, 3600, 2, 20],
  ].concat(XLAP)) add('l_' + k, 'lap', n, /(^|_)tab/.test(k) ? '📱' : '💻', price, { lap: 1, score, perf, w, d: `${n} · คะแนน ~${score} · มี Windows พร้อมใช้ · นับเป็นคอมพิวเตอร์ของคุณ` });
  PC_SLOTS.hdd = 'ฮาร์ดดิสก์ (ไม่บังคับ)'; PC_SLOTS.fan = 'พัดลม/ซิลิโคน (ไม่บังคับ)';
  const REQ = ['cpu', 'mobo', 'ram', 'gpu', 'ssd', 'psu', 'case', 'cool'];

  // ================================================================= 2. compatibility, scores, groups =================================================================
  { const _d = PC.desc.bind(PC); PC.desc = function (P) { if (P.d) return P.d + (P.s === 'lap' ? '' : ' · มีชิ้นส่วนในกระเป๋าแล้วไปประกอบที่โต๊ะประกอบคอม'); try { return _d(P); } catch (e) { return P.n; } }; }
  PC.check = function (sel) {
    const P = k => sel[k] && PC_PARTS[sel[k]], miss = REQ.filter(k => !sel[k]);
    if (miss.length) return 'ยังขาด: ' + miss.map(k => PC_SLOTS[k]).join(', ');
    const c = P('cpu'), m = P('mobo'), r = P('ram'), g = P('gpu'), pu = P('psu'), cs = P('case'), co = P('cool');
    if (c.sock !== m.sock) return `ซีพียูซ็อกเก็ต ${sockN(c.sock)} ใส่บอร์ด ${sockN(m.sock)} ไม่ได้!`;
    if (r.ddr !== m.ddr) return `บอร์ดนี้ใช้แรม DDR${m.ddr} แต่แรมเป็น DDR${r.ddr}`;
    if (!cs.fit.includes(m.size)) return `เคสนี้ใส่บอร์ดขนาด ${m.size} ไม่ได้`;
    if (!(co.socks || STD_SOCKS).includes(c.sock)) return `ชุดระบายความร้อนนี้ไม่รองรับซ็อกเก็ต ${sockN(c.sock)}`;
    if (co.cap < c.w) return `ซีพียูร้อน ${c.w}W แต่ชุดระบายรับได้แค่ ${co.cap}W`;
    if (co.h && cs.coolH && co.h > cs.coolH) return `ซิงก์สูง ${co.h}มม. แต่เคสรับได้แค่ ${cs.coolH}มม.`;
    if (co.rad && cs.rads && !cs.rads.includes(co.rad)) return `เคสนี้ติดหม้อน้ำ ${co.rad}มม. ไม่ได้ (รองรับ ${cs.rads.join('/')}มม.)`;
    if (g.len && cs.gpuMax && g.len > cs.gpuMax) return `การ์ดจอยาว ${g.len}มม. แต่เคสรับได้แค่ ${cs.gpuMax}มม.`;
    if (cs.sff && !pu.sfx) return 'เคส SFF ใส่พาวเวอร์ ATX ไม่ได้ ต้องใช้พาวเวอร์ขนาด SFX';
    const w = PC.watts(Object.values(sel)); if (pu.cap < w * 1.2) return `ไฟไม่พอ! ทั้งเครื่องกิน ~${w}W ควรใช้พาวเวอร์อย่างน้อย ${Math.ceil(w * 1.2 / 50) * 50}W`;
    return '';
  };
  PC.monitor = function () { let best = null; for (const k in PC_PARTS) { const P = PC_PARTS[k]; if (P.s === 'mon' && count('pc_' + k) > 0 && (!best || P.perf > PC_PARTS[best].perf || (P.perf === PC_PARTS[best].perf && P.price > PC_PARTS[best].price))) best = k; } return best; };
  { const _h = PC.has.bind(PC); const alias = { headset: 'headset', gchair: 'furn', ups: 'ups', streamkit: 'webcam' };
    PC.has = function (k) { if (_h(k)) return true; const g = alias[k]; if (!g) return false; if (g === 'webcam') return Object.keys(PC_PARTS).some(x => PC_PARTS[x].g === 'webcam' && count('pc_' + x) > 0) && Object.keys(PC_PARTS).some(x => PC_PARTS[x].g === 'mic' && count('pc_' + x) > 0); return Object.keys(PC_PARTS).some(x => PC_PARTS[x].g === g && count('pc_' + x) > 0 && (g !== 'furn' || /gchair|ch_ergo/.test(x))); }; }

  // ================================================================= 3. shop catalogue by city =================================================================
  const CAT = [
    ['🧠 ซีพียู', ['cpu']], ['🟩 เมนบอร์ด', ['mobo']], ['📏 แรม', ['ram']], ['🎮 การ์ดจอ', ['gpu']], ['💾 SSD / HDD', ['ssd', 'hdd']], ['🔌 พาวเวอร์ / เคส', ['psu', 'case']], ['❄️ ระบายความร้อน / พัดลม', ['cool', 'fan']],
    ['🖥️ จอภาพ', ['mon']], ['⌨️ คีย์บอร์ด / เมาส์ / หูฟัง', ['per:kb', 'per:mouse', 'per:headset']], ['🎙️ เว็บแคม / ไมค์ / ลำโพง', ['per:webcam', 'per:mic', 'per:speaker']],
    ['🌐 เครือข่าย / UPS', ['per:net', 'per:ups']], ['🎛️ การ์ดเสริม / สายเคเบิล', ['per:addon', 'per:cable']], ['🗃️ ที่เก็บข้อมูล / NAS', ['per:stor']], ['🖨️ ปริ้นเตอร์ / สแกนเนอร์', ['per:print']],
    ['💻 โน้ตบุ๊ก / แท็บเล็ต', ['lap']], ['🥽 VR / คอนโซล / เฟอร์นิเจอร์', ['per:vr', 'per:console', 'per:furn']],
  ];
  const inCat = (P, specs) => specs.some(sp => sp.startsWith('per:') ? P.s === 'per' && P.g === sp.slice(4) : P.s === sp);
  const hash = s => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
  const OLD = new Set(Object.keys(PC_PARTS).filter(k => !/^(c|m|r|g|d|p|k|o|f|v|x|l)_/.test(k)));
  const cityFactor = id => 0.96 + (hash('px' + id) % 12) / 100;                           // 0.96 .. 1.07
  const stocked = (id, size, k) => size === 'large' || (hash(id + k) % 100) < (size === 'medium' ? 78 : 56) || /^(c_i3|c_r3|c_r5|m_h610|m_a520|m_a620|r_d4_16|r_d5_16|g_gtx1650|g_r3050|d_s|p_450|p_600|k_atx_b|o_t92|v_m24|x_kb_mem|x_ms_off)/.test(k);
  const tabsFor = (cityId, size) => {
    const tabs = [];
    for (const [n, specs] of CAT) { const items = Object.keys(PC_PARTS).filter(k => !OLD.has(k) && inCat(PC_PARTS[k], specs) && (!cityId || stocked(cityId, size, k))).map(k => (cityId ? 'pcc:' + cityId + '|' + k : 'pc:' + k)); if (items.length) tabs.push({ n, items }); }
    tabs.push({ n: '📦 คอมประกอบสำเร็จ', items: Object.keys(PC_PRESETS).map(k => 'pcset:' + k) });
    return tabs;
  };
  // ready-made builds, re-cut from the real parts
  Object.assign(PC_PRESETS, {
    office: { n: 'คอมทำงาน/เรียนออนไลน์ (i3 + 16GB)', i: '💼', parts: ['c_i3_12100f', 'm_h610m', 'r_d4_16', 'g_gtx1650', 'd_s512', 'p_450w', 'k_mesh_m', 'o_t92'] },
    gamer: { n: 'คอมเกมมิ่ง FHD คุ้มค่า (Ryzen 5 + RTX 4060)', i: '🎮', parts: ['c_r5_7500f', 'm_b650m', 'r_d5_32', 'g_r4060', 'd_n4_1t', 'p_650g', 'k_atx_m', 'o_t120'] },
    stream: { n: 'คอมสตรีมเมอร์ (7800X3D + RTX 4070 Super)', i: '📺', parts: ['c_r7_7800x3d', 'm_x670e', 'r_d5_32b', 'g_r4070s', 'd_n4_2t', 'p_850g', 'k_atx_g', 'o_aio240'] },
    creator: { n: 'คอมครีเอเตอร์ตัดต่อ 4K (Core i7 + RTX 5070)', i: '🎬', parts: ['c_i7_14700k', 'm_z790', 'r_d5_64', 'g_r5070', 'd_n4_2t', 'p_850p', 'k_mid_p', 'o_aio360'] },
    mini: { n: 'คอมจิ๋ว Mini-ITX (Ryzen 7 + RTX 4060 Ti)', i: '🧳', parts: ['c_r7_9700x', 'm_b650i', 'r_d5_32', 'g_r4060ti', 'd_n4_1t', 'p_sfx750', 'k_mini', 'o_aio240'] },
    ai: { n: 'เวิร์กสเตชัน AI ตัวท็อป (9950X3D + RTX 5090)', i: '🤖', parts: ['c_r9_9950x3d', 'm_x870e', 'r_d5_128', 'g_r5090', 'd_n5_4t', 'p_1300t', 'k_super', 'o_aio420'] },
  });
  SHOPS.pcshop.tabs = tabsFor(null);
  SHOPS.pcshop.n = 'คอมพิวเตอร์พลาซ่า ทุ่งทอง (ครบทุกอุปกรณ์)';
  // city shops: same parts, city price factor
  ENTRY_KINDS.pcc = (id, shop) => {
    const [city, part] = id.split('|'), e = ENTRY_KINDS.pc(part, shop), f = cityFactor(city);
    return Object.assign(e, { price: Math.round(e.price * f / 10) * 10 });
  };
  // laptops / tablets are added to "my computers" directly, with Windows installed
  { const _pc = ENTRY_KINDS.pc;
    ENTRY_KINDS.pc = (id, shop) => { const P = PC_PARTS[id]; const e = _pc(id, shop); if (P && P.s === 'lap') { e.own = 0; e.buy = () => { S.pcs = S.pcs || []; S.pcs.push({ name: P.n, parts: [], score: P.score, w: P.w, os: 'win', laptop: 1, warr: S.day + YEAR }); Prog.add(20); try { Life2.note('ซื้อ' + P.n); } catch (er) { } UI.toast('ซื้อ ' + P.n + ' แล้ว เปิดใช้ได้เลย (ประกันศูนย์ 1 ปี) ดูได้ที่แอป 🖥️ ศูนย์ไอที', '💻'); }; } return e; }; }
  // an ordered PC part that is not in my bag but in the delivery queue still counts for nothing; keep legacy stock lists working
  for (const sid of Object.keys(SHOPS)) { const sh = SHOPS[sid]; if (!sh || sid === 'pcshop' || !sh.tabs) continue; }

  // ================================================================= 4. services: assembly, repair & upgrade, trade-in, warranty =================================================================
  const sizeOf = id => { try { const T = V23Kit.TOWNS.find(t => t.key === id); return T ? T.size : 'village'; } catch (e) { return 'village'; } };
  const WAIT = { village: 1, large: 1, medium: 2, small: 3 };
  const value = pc => (pc.parts || []).reduce((s, k) => s + ((PC_PARTS[k] || {}).price || 0), 0) || (pc.laptop ? Math.round(pc.score * 6) : 0);
  const warrOn = pc => pc && pc.warr >= S.day;
  const feeAssemble = parts => Math.min(3500, Math.round(500 + parts.reduce((s, k) => s + PC_PARTS[k].price, 0) * 0.012));
  { const old = PC.build.bind(PC);
    PC.build = function () {
      if (!this.atShop) return old();
      const sel = this.sel, err = this.check(sel); if (err) return;
      const parts = Object.values(sel).filter(Boolean);
      if (parts.some(p => !count('pc_' + p))) { for (const k in sel) if (!count('pc_' + sel[k])) delete sel[k]; UI.toast('ชิ้นส่วนบางชิ้นไม่อยู่ในกระเป๋าแล้ว เลือกใหม่อีกครั้ง', '⚠️'); UI.renderBody(); return; }
      if ((S.pcs || []).length + st().jobs.length >= 6) { UI.toast('มีคอมพิวเตอร์ครบ 6 เครื่อง (รวมที่ร้านกำลังประกอบ) แล้ว', '🖥️'); return; }
      const fee = feeAssemble(parts); if (!pay(fee, 'ค่าประกอบคอมพิวเตอร์ที่ร้าน')) return;
      const city = this.shopCity || 'village', wait = WAIT[sizeOf(city)] || 1;
      for (const p of parts) takeItem('pc_' + p);
      st().jobs.push({ id: ++st().n, parts, ready: S.day + wait, city, name: 'คอมร้านประกอบ #' + st().n, fee });
      this.sel = {}; UI.close();
      UI.toast(`ฝากร้านประกอบแล้ว ค่าบริการ ${baht(fee)} รับเครื่องได้${RD(S.day + wait)} (ประกัน 1 ปีจากร้าน)`, '🔧');
      msg('ร้านประกอบคอมพิวเตอร์', `รับประกอบเครื่องของคุณแล้ว คาดว่าเสร็จ${RD(S.day + wait)} จะแจ้งทางมือถือ`);
    };
  }
  // the PC desk at home keeps its instant self-build; builder at a shop shows the real fee and waiting time
  { const _b = PC.builder.bind(PC);
    PC.builder = function (atShop) {
      if (!atShop) this.shopCity = null; _b(atShop);
      if (atShop && UI.cur && UI.cur.render) { const r = UI.cur.render; UI.cur.render = t => { const parts = Object.values(PC.sel).filter(Boolean), fee = parts.length ? baht(feeAssemble(parts)) : 'ประมาณ 500–3,500 ฿', w = WAIT[sizeOf(PC.shopCity || 'village')] || 1; return r(t).replace(/ให้ร้านประกอบให้ 1,500 ฿/g, 'ฝากร้านประกอบ ค่าบริการ ' + fee).replace('ให้ร้านประกอบ (1,500 ฿)', 'ฝากร้านประกอบ (' + fee + ')').replace(/เสร็จทันที/g, 'รอ ' + w + ' วัน มีประกันร้าน 1 ปี'); }; UI.renderBody(); }
    }; }
  { const _nd = newDay;
    newDay = function () { const r = _nd.apply(this, arguments); try { ready(); } catch (e) { console.warn('v36 pc jobs', e); } return r; }; }
  const ready = () => {
    const s = st(), done = s.jobs.filter(j => j.ready <= S.day); if (!done.length) return;
    for (const j of done) {
      if ((S.pcs || []).length >= 6) { j.ready = S.day + 1; continue; }
      PC.addPC(j.name, j.parts, true); const p = S.pcs[S.pcs.length - 1]; if (p) p.warr = S.day + YEAR;
      s.jobs.splice(s.jobs.indexOf(j), 1);
      msg('ร้านประกอบคอมพิวเตอร์', `${j.name} ประกอบเสร็จแล้ว! ตั้งไว้ที่โต๊ะคอมที่บ้านให้เรียบร้อย (ต้องลง Windows/Linux ที่แอปศูนย์ไอที) · ประกันร้าน 1 ปี`);
    }
  };

  // warranty covers repairs
  { const _fx = UI.H.v23fix; if (_fx) UI.H.v23fix = d => { const pc = (S.pcs || [])[+d.i]; if (pc && pc.broken && warrOn(pc)) { pc.broken = 0; UI.toast('ซ่อมฟรีตามประกัน', '🛡️'); msg('ศูนย์ซ่อมคอมพิวเตอร์', `${pc.name} ซ่อมเสร็จ (อยู่ในประกัน ไม่คิดค่าบริการ)`); return; } return _fx(d); }; }
  { const _cl = UI.H.v23clean; if (_cl) UI.H.v23clean = d => { const pc = (S.pcs || [])[+d.i]; if (pc && pc.infected && warrOn(pc)) { pc.infected = 0; UI.toast('ล้างมัลแวร์ฟรีตามประกัน', '🛡️'); return; } return _cl(d); }; }

  const svc = {
    shop: 'village',
    esc: s => esc(String(s)),
    name() { return this.shop === 'village' ? 'คอมพิวเตอร์พลาซ่า ทุ่งทอง' : ((V23Kit.TOWNS.find(t => t.key === this.shop) || {}).n || this.shop); },
    // ----- assembly counter
    assemble() { PC.shopCity = this.shop; PC.builder(true); },
    jobs() {
      const s = st(), js = s.jobs;
      UI.open('🔧 งานที่ฝากร้านประกอบ', null, () => `<p class="lead">ร้านประกอบเครื่องให้ตามที่เลือก มีค่าบริการ ≈ 500 ฿ + 1.2% ของราคาชิ้นส่วน (สูงสุด 3,500 ฿) · รอ 1–3 วันตามเมือง · ประกันฝีมือ 1 ปี</p>
        ${js.length ? `<div class="grid">${js.map(j => `<div class="card"><div class="ci">🔧</div><div class="cb"><h4>${esc(j.name)}</h4><p class="dim">${j.parts.length} ชิ้น · ค่าบริการ ${baht(j.fee)} · เสร็จ${RD(j.ready)} ${j.ready <= S.day ? '(พร้อมแล้ว! จะส่งเข้าบ้านพรุ่งนี้เช้า)' : `(อีก ${j.ready - S.day} วัน)`}</p></div></div>`).join('')}</div>` : '<p class="empty">ยังไม่มีงานที่ฝากร้านไว้</p>'}`);
    },
    // ----- repair & upgrade
    repair() {
      UI.open('🛠️ ซ่อม / อัปเกรด / ทำความสะอาด', null, () => {
        const pcs = S.pcs || []; if (!pcs.length) return '<p class="empty">ยังไม่มีคอมพิวเตอร์</p>';
        return `<p class="lead">ซ่อมเครื่องเสีย 1,500 ฿ (ฟรีถ้าอยู่ในประกัน) · ล้างมัลแวร์ / ทำความสะอาด 600 ฿ · เปลี่ยนอะไหล่ ค่าแรง 300 ฿ ระบบตรวจความเข้ากันได้ให้</p>
        <div class="grid">${pcs.map((c, i) => `<div class="card"><div class="ci">${c.laptop ? '💻' : '🖥️'}</div><div class="cb"><h4>${esc(c.name)} · คะแนน ${U.fmt(c.score)}</h4><p class="dim">${c.broken ? '⚠️ เครื่องเสีย ' : ''}${c.infected ? '🦠 ติดมัลแวร์ ' : ''}${warrOn(c) ? `🛡️ ประกันถึง${RD(c.warr)}` : 'ไม่มีประกัน'}${c.os === null ? ' · ยังไม่ลงระบบปฏิบัติการ' : ''}</p>
          <div class="row">${c.broken ? `<button class="btn" data-a="v23fix" data-i="${i}">ซ่อม${warrOn(c) ? ' (ฟรี)' : ' 1,500 ฿'}</button>` : ''}${c.infected ? `<button class="btn" data-a="v23clean" data-i="${i}">ล้างเครื่อง</button>` : ''}
          ${!c.laptop && c.parts && c.parts.length ? `<button class="btn ghost" data-a="v36up" data-i="${i}">⬆️ เปลี่ยน/อัปเกรดอะไหล่</button>` : ''}</div></div></div>`).join('')}</div>`;
      }, { wide: true });
    },
    upgrade(i, slot, pick) {
      const pc = (S.pcs || [])[+i]; if (!pc) return;
      UI.open('⬆️ อัปเกรด: ' + pc.name, null, () => {
        const cur = {}; for (const k of pc.parts) cur[PC_PARTS[k].s] = k;
        const slots = Object.keys(PC_SLOTS).filter(s => cur[s] || s === 'hdd' || s === 'fan');
        if (!slot) return `<p class="lead">เลือกส่วนที่จะเปลี่ยน (ใช้ชิ้นส่วนที่มีในกระเป๋า) · ค่าแรง 300 ฿</p><div class="grid">${slots.map(s => `<div class="card"><div class="ci">${cur[s] ? PC_PARTS[cur[s]].i : '⬜'}</div><div class="cb"><h4>${PC_SLOTS[s]}</h4><p class="dim">${cur[s] ? esc(PC_PARTS[cur[s]].n) : 'ยังไม่มี'}</p><button class="btn" data-a="v36upslot" data-i="${i}" data-s="${s}">เลือกอะไหล่ใหม่</button></div></div>`).join('')}</div>`;
        const own = Object.keys(PC_PARTS).filter(k => PC_PARTS[k].s === slot && count('pc_' + k) > 0);
        return `<div class="row"><button class="btn ghost" data-a="v36upslot" data-i="${i}" data-s="">‹ กลับ</button></div><p class="lead">เลือกอะไหล่ ${PC_SLOTS[slot]} จากกระเป๋า ${own.length ? '' : '— ยังไม่มีในกระเป๋า ซื้อจากเคาน์เตอร์ชิ้นส่วนก่อน'}</p>
          <div class="grid">${own.map(k => { const sel = Object.assign({}, cur, { [slot]: k }); const err = PC.check(Object.fromEntries(Object.entries(sel).filter(([a, b]) => b))); return `<div class="card"><div class="ci">${PC_PARTS[k].i}</div><div class="cb"><h4>${esc(PC_PARTS[k].n)}</h4><p class="dim">${err ? '⚠️ ' + esc(err) : '✅ เข้ากันได้'}</p><button class="btn" data-a="v36upgo" data-i="${i}" data-s="${slot}" data-k="${k}" ${err || S.money < 300 ? 'disabled' : ''}>เปลี่ยน (300 ฿)</button></div></div>`; }).join('')}</div>`;
      }, { wide: true });
    },
    doUpgrade(i, slot, k) {
      const pc = (S.pcs || [])[+i]; if (!pc || !count('pc_' + k)) return;
      const cur = {}; for (const p of pc.parts) cur[PC_PARTS[p].s] = p; const old = cur[slot];
      const sel = Object.assign({}, cur, { [slot]: k }); if (PC.check(sel)) return;
      if (!pay(300, 'ค่าแรงอัปเกรดคอมพิวเตอร์')) return;
      takeItem('pc_' + k); if (old) addItem('pc_' + old);
      pc.parts = Object.values(sel); pc.score = PC.score(pc.parts); pc.w = PC.watts(pc.parts);
      UI.toast(`เปลี่ยนเป็น ${PC_PARTS[k].n} แล้ว คะแนนใหม่ ${U.fmt(pc.score)}`, '⬆️'); msg('ร้านคอมพิวเตอร์', `${pc.name} อัปเกรดเสร็จ คะแนน ${U.fmt(pc.score)}`);
    },
    // ----- trade-in
    tradein() {
      UI.open('♻️ เทิร์นอิน รับซื้ออุปกรณ์เก่า', null, () => {
        const parts = Object.keys(PC_PARTS).filter(k => count('pc_' + k) > 0 && PC_PARTS[k].s !== 'lap'), pcs = S.pcs || [];
        return `<p class="lead">ร้านรับซื้อ 68% ของราคาป้าย (ขายทั่วไป 55%) · เครื่องทั้งชุดรับตามอะไหล่ ถ้าเสียหรือเป็นมัลแวร์หักเพิ่ม</p>
          ${pcs.length ? `<h5>เครื่องของฉัน</h5><div class="grid">${pcs.map((c, i) => { const v = Math.round(value(c) * (c.broken ? 0.3 : c.infected ? 0.5 : 0.62)); return `<div class="card"><div class="ci">${c.laptop ? '💻' : '🖥️'}</div><div class="cb"><h4>${esc(c.name)}</h4><p class="dim">ราคารับซื้อ ${baht(v)}</p><button class="btn" data-a="v36sellpc" data-i="${i}">เทิร์นทั้งเครื่อง</button></div></div>`; }).join('')}</div>` : ''}
          <h5>ชิ้นส่วนในกระเป๋า</h5>${parts.length ? `<div class="grid">${parts.map(k => `<div class="card"><div class="ci">${PC_PARTS[k].i}</div><div class="cb"><h4>${esc(PC_PARTS[k].n)} <small>มี ${count('pc_' + k)}</small></h4><p class="dim">รับซื้อ ${baht(Math.round(PC_PARTS[k].price * 0.68))}</p><button class="btn" data-a="v36sellpart" data-k="${k}">ขาย 1 ชิ้น</button></div></div>`).join('')}</div>` : '<p class="empty">ไม่มีชิ้นส่วนในกระเป๋า</p>'}`;
      }, { wide: true });
    },
    // ----- warranty
    warranty() {
      UI.open('🛡️ ประกันคอมพิวเตอร์ 1–3 ปี', null, () => {
        const pcs = S.pcs || [];
        if (!pcs.length) return '<p class="empty">ยังไม่มีคอมพิวเตอร์</p>';
        const price = (c, y) => Math.max(500, Math.round(value(c) * [0, 0.05, 0.085, 0.12][y]));
        return `<p class="lead">ประกันคุ้มครองการซ่อมเครื่องเสียและล้างมัลแวร์ฟรี รวมไฟกระชากจากฟ้าผ่า · ซื้อต่ออายุได้ (1 ปีเกม = 12 สัปดาห์)</p><div class="grid">${pcs.map((c, i) => `<div class="card"><div class="ci">🛡️</div><div class="cb"><h4>${esc(c.name)}</h4><p class="dim">${warrOn(c) ? `ประกันถึง${RD(c.warr)} (อีก ${c.warr - S.day} วัน)` : 'ไม่มีประกัน'} · มูลค่า ${baht(value(c))}</p>
          <div class="row">${[1, 2, 3].map(y => `<button class="btn ghost" data-a="v36warr" data-i="${i}" data-y="${y}" ${S.money < price(c, y) ? 'disabled' : ''}>${y} ปี ${baht(price(c, y))}</button>`).join('')}</div></div></div>`).join('')}</div>`;
      }, { wide: true });
    },
    buyParts(lab) { const sid = this.shop === 'village' ? 'pcshop' : 'pcc_' + this.shop; UI.shop(sid); const i = lab ? SHOPS[sid].tabs.findIndex(t => t.n.startsWith(lab)) : -1; if (i > 0 && UI.cur) { UI.cur.tab = i; UI.renderBody(); } },
    after() {
      UI.open(this.name() + ' — ซ่อม อัปเกรด เทิร์นอิน ประกัน', null, () => `<div class="grid">${[['🛠️', 'ซ่อม / อัปเกรด / ทำความสะอาด', 'repair'], ['♻️', 'เทิร์นอินอุปกรณ์เก่า', 'tradein'], ['🛡️', 'ประกันคอมพิวเตอร์ 1–3 ปี', 'warranty'], ['📋', 'งานที่ฝากร้านประกอบ', 'jobs']]
        .map(([i, t, v]) => `<div class="card"><div class="ci">${i}</div><div class="cb"><h4>${t}</h4><button class="btn" data-a="v36go" data-v="${v}">เปิด</button></div></div>`).join('')}</div>`);
    },
    hub() {
      UI.open(this.name() + ' — ร้านประกอบคอมพิวเตอร์', null, () => `<p class="lead">ร้านประกอบคอมพิวเตอร์ครบวงจร: ขายอะไหล่ ประกอบให้ ซ่อม อัปเกรด เทิร์นอิน และประกัน ${this.shop === 'village' ? '' : '· ราคาและสต็อกต่างกันตามเมือง'}</p>
        <div class="grid">${[['🧩', 'เลือกซื้ออะไหล่ทั้งหมด', 'v36go', 'shop'], ['🔧', 'ฝากร้านประกอบคอม (โต๊ะประกอบ)', 'v36go', 'assemble'], ['📋', 'งานที่ฝากไว้', 'v36go', 'jobs'], ['🛠️', 'ซ่อม / อัปเกรด', 'v36go', 'repair'], ['♻️', 'เทิร์นอิน', 'v36go', 'tradein'], ['🛡️', 'ประกัน 1–3 ปี', 'v36go', 'warranty']]
          .map(([i, t, a, v]) => `<div class="card"><div class="ci">${i}</div><div class="cb"><h4>${t}</h4><button class="btn" data-a="${a}" data-v="${v}">เปิด</button></div></div>`).join('')}</div>`);
    },
  };
  Object.assign(UI.H, {
    v36go: d => { UI.close(); setTimeout(() => svc[d.v](), 0); },
    v36up: d => svc.upgrade(d.i), v36upslot: d => svc.upgrade(d.i, d.s || null), v36upgo: d => { svc.doUpgrade(d.i, d.s, d.k); svc.upgrade(d.i, d.s); },
    v36sellpart: d => { const k = d.k; if (!count('pc_' + k)) return; takeItem('pc_' + k); const v = Math.round(PC_PARTS[k].price * 0.68); earn(v); try { Bank2.income('เทิร์นอินอุปกรณ์คอมพิวเตอร์', v); } catch (e) { } UI.toast(`ขาย ${PC_PARTS[k].n} ได้ ${baht(v)}`, '♻️'); },
    v36sellpc: d => { const c = (S.pcs || [])[+d.i]; if (!c) return; const v = Math.round(value(c) * (c.broken ? 0.3 : c.infected ? 0.5 : 0.62)); earn(v); try { Bank2.income('เทิร์นอินคอมพิวเตอร์', v); } catch (e) { } S.pcs.splice(+d.i, 1); UI.toast(`เทิร์นเครื่องได้ ${baht(v)}`, '♻️'); },
    v36warr: d => { const c = (S.pcs || [])[+d.i], y = +d.y; if (!c || !(y >= 1 && y <= 3)) return; const p = Math.max(500, Math.round(value(c) * [0, 0.05, 0.085, 0.12][y])); if (!pay(p, 'ประกันคอมพิวเตอร์ ' + y + ' ปี')) return; c.warr = Math.max(c.warr || 0, S.day) + y * YEAR; UI.toast(`ซื้อประกัน ${y} ปี คุ้มครองถึง${RD(c.warr)}`, '🛡️'); },
  });
  window.PCShop36 = { svc, tabsFor, CAT, st, YEAR };

  // the village plaza counter opens the full service hub
  { const p = World.pois.find(o => o.label === 'เคาน์เตอร์ประกอบคอม'); if (p) p.act = () => ({ icon: '🔧', label: 'เคาน์เตอร์ประกอบคอม / ซ่อม / ประกัน', fn: () => { svc.shop = 'village'; svc.hub(); } }); }

  // ================================================================= 5. a PC shop in every city =================================================================
  const kit = window.V23Kit;
  if (kit && window.V25) {
    const addLot = T => {
      const P = T._plan; if (!P || T.built || P.lots.some(l => l.v36pc)) return;
      let best = -1; for (let i = P.houses.length - 1; i >= 0; i--) { if (P.houses[i].side === 1 || P.houses.length < 5) { best = i; break; } } if (best < 0) best = P.houses.length - 1; if (best < 0) return;
      const s = P.houses.splice(best, 1)[0], d = 11;
      const lot = { id: P.key + ':civic' + P.lots.length, kind: 'civic', w: Math.min(16, P.sp.step - 1), d, st: s.st, side: s.side, rot: s.rot, fx: s.fx, z: s.z, x: s.fx + s.side * d / 2, taken: false, rows: [s.row], v36pc: 1 };
      P.lots.push(lot); P.foot(lot.x, lot.z, lot.rot, lot.w, lot.d, 'lot-civic');
    };
    for (const T of kit.TOWNS) addLot(T);
    { const lp = window.V25Layout && V25Layout.plan; if (lp) V25Layout.plan = function (T) { const had = !!T._plan, P = lp.call(this, T); if (!had) addLot(T); return P; }; }
    V25.ensureHook('*', (A, info) => {
      if (A._v36pc) return; const T = kit.TOWNS.find(t => t.key === info.id); if (!T) return;
      const lot = V25.freeLots(info.id, 'civic').find(l => l.v36pc); if (!lot) return; A._v36pc = 1;
      const name = `ร้านประกอบคอม ${T.n}`, o = { w: Math.min(lot.w - 1, 14), d: Math.min(lot.d - 1, 9.5), h: 5.2, flat: true, glassFront: true, wall: 0xe3f2fd, roof: 0x0d47a1, sign: name, signStyle: { bg: '#0d47a1' } };
      const p = V25.lotPos(lot, o.d), b = World.building(o); b.position.set(p.x, 0, p.z); b.rotation.y = p.rot; A.g.add(b);
      Col.box(p.x, p.z, o.w / 2 + 0.3, o.d / 2 + 0.3, p.rot, 'bld'); V25.takeLot(info.id, lot.id);
      const door = l2w(p.x, p.z, p.rot, 0, o.d / 2 + 1.7), kind = `v36_${info.id}_pc`, sid = 'pcc_' + info.id;
      SHOPS[sid] = { n: name, tabs: tabsFor(info.id, T.size) };
      const go = fn => () => { svc.shop = info.id; fn(); };
      const items = () => [
        { label: 'ซีพียู / เมนบอร์ด / แรม', icon: '🧠', fn: go(() => svc.buyParts('🧠')) }, { label: 'การ์ดจอ / ที่เก็บข้อมูล', icon: '🎮', fn: go(() => svc.buyParts('🎮')) },
        { label: 'พาวเวอร์ / เคส / ระบายความร้อน', icon: '🗄️', fn: go(() => svc.buyParts('🔌')) }, { label: 'จอ / คีย์บอร์ด / อุปกรณ์ต่อพ่วง', icon: '🖥️', fn: go(() => svc.buyParts('🖥️')) },
        { label: 'โน้ตบุ๊ก / แท็บเล็ต / คอนโซล', icon: '💻', fn: go(() => svc.buyParts('💻')) }, { label: 'คอมประกอบสำเร็จ', icon: '📦', fn: go(() => svc.buyParts('📦')) },
        { label: 'ฝากร้านประกอบ', icon: '🔧', fn: go(() => svc.hub()) }, { label: 'ซ่อม / อัปเกรด / เทิร์นอิน / ประกัน', icon: '🛠️', fn: go(() => svc.after()) },
      ];
      ROOM_KIND[kind] = { w: 24, d: 15, floor: 0xe8e0d0, wall: 0xe3f2fd, title: name };
      World.pois.push({ kind: 'act', x: door.x, z: door.z, r: 2.6, label: name, icon: '🖥️', map: false, room: { kind, title: name, v25: { items, per: 4, bg: '#0d47a1' } }, act: () => G.away === A ? { icon: '🖥️', label: name, fn: () => { } } : null });
    });
  }

  // ================================================================= 6. old saves: nothing to migrate (old keys are kept), just make sure state exists =================================================================
  st();
});
