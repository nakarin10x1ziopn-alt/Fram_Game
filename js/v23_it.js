'use strict';
// ---------- v23_it: IT hub + real utility catalogs ----------
// 1. "ศูนย์ไอที" phone app: where to install what you bought (auto-wiring of network/CCTV gear, PC build/OS/antivirus/repair)
// 2. water: usage meter, leak events, request/installation flow embedded in the water app
// 3. 20 working upgrades each for electricity, water, internet and renewable energy (installer visit, effects, billing)
V23.add('it', () => {
  const st = () => (S.v23it = S.v23it || { own: {}, leak: null, log: [], av: 0 });
  const has = k => { const o = st().own[k]; return !!(o && S.day >= o.day); };
  const OWN = (k) => st().own[k];

  // ================= catalogs =================
  // k key · n name · i icon · p price · d install days · t description · effects: use bill cut flat night prodMul farmMul kwp batt f(flag) mo(monthly) · req(): reason string when it cannot be installed
  const needTank = () => (Water.st().tank ? '' : 'ต้องมีถังเก็บน้ำก่อน');
  const needWell = () => (Water.st().well ? '' : 'ต้องมีบ่อบาดาลก่อน');
  const needNet = () => (ISP.pkg() ? '' : 'ต้องสมัครอินเทอร์เน็ตบ้านก่อน');
  const needPanel = () => (Power.st().panels + Power.st().farm > 0 ? '' : 'ต้องมีแผงโซลาร์ก่อน');
  const ITX = {
    elec: [
      { k: 'e_led', n: 'เปลี่ยนหลอดไฟทั้งบ้านเป็น LED', i: '💡', p: 3500, d: 0, t: 'ไฟส่องสว่างกินไฟลดลง 60%', cut: { lights: 0.6 } },
      { k: 'e_inv', n: 'เปลี่ยนแอร์เป็นอินเวอร์เตอร์เบอร์ 5', i: '❄️', p: 18000, d: 1, t: 'แอร์กินไฟลดลง 35%', cut: { aircon: 0.35 } },
      { k: 'e_roof', n: 'ฉนวนกันความร้อนใต้หลังคา', i: '🏠', p: 24000, d: 2, t: 'บ้านเย็นขึ้น แอร์กินไฟลดลง 15%', cut: { aircon: 0.15 } },
      { k: 'e_film', n: 'ฟิล์มกรองแสงติดหน้าต่าง', i: '🪟', p: 6500, d: 1, t: 'ลดความร้อนเข้าบ้าน แอร์กินไฟลดลง 8%', cut: { aircon: 0.08 } },
      { k: 'e_plug', n: 'ปลั๊กสมาร์ทตัดไฟสแตนด์บาย', i: '🔌', p: 1800, d: 0, t: 'ตัดไฟอุปกรณ์สแตนด์บาย/เราเตอร์ลดลง 50% และประหยัดเพิ่มวันละ 0.02 kW', cut: { router: 0.5 }, flat: 0.02 },
      { k: 'e_fridge', n: 'ตู้เย็นอินเวอร์เตอร์เบอร์ 5', i: '🧊', p: 14500, d: 1, t: 'ตู้เย็นกินไฟลดลง 40%', cut: { fridge: 0.4 } },
      { k: 'e_dcfan', n: 'พัดลมเพดานมอเตอร์ DC', i: '🌀', p: 4200, d: 0, t: 'พัดลมกินไฟลดลง 60%', cut: { fan: 0.6 } },
      { k: 'e_solarw', n: 'เครื่องทำน้ำอุ่นพลังงานแสงอาทิตย์', i: '🚿', p: 22000, d: 2, t: 'เครื่องทำน้ำอุ่นกินไฟลดลง 85%', cut: { heater: 0.85 } },
      { k: 'e_induct', n: 'เตาแม่เหล็กไฟฟ้า + หม้อหุงข้าวประหยัดไฟ', i: '🍳', p: 5900, d: 0, t: 'เตา/หม้อหุงข้าวกินไฟลดลง 25%', cut: { cooker: 0.25 } },
      { k: 'e_pump', n: 'ปั๊มน้ำอินเวอร์เตอร์ความถี่แปรผัน', i: '⚙️', p: 8500, d: 1, t: 'ปั๊มน้ำกินไฟลดลง 50%', cut: { pump: 0.5 } },
      { k: 'e_wash', n: 'เครื่องซักผ้าอินเวอร์เตอร์ฝาหน้า', i: '🧺', p: 15900, d: 1, t: 'เครื่องซักผ้ากินไฟลดลง 35%', cut: { washer: 0.35 } },
      { k: 'e_smart', n: 'ติดตั้งสมาร์ทมิเตอร์วัดไฟรายชั่วโมง', i: '📟', p: 3500, d: 1, t: 'เห็นการใช้ไฟชัดเจน ปรับพฤติกรรมได้ ค่าไฟลดลง 2%', bill: 0.02 },
      { k: 'e_timer', n: 'ชุดตั้งเวลาเปิด-ปิดแอร์และไฟอัตโนมัติ', i: '⏲️', p: 2600, d: 0, t: 'แอร์และไฟกินไฟลดลงอย่างละ 10%', cut: { aircon: 0.1, lights: 0.1 } },
      { k: 'e_pir', n: 'ไฟเซนเซอร์จับความเคลื่อนไหวทั่วบ้าน', i: '👁️', p: 2900, d: 0, t: 'ไฟส่องสว่างกินไฟลดลงอีก 25%', cut: { lights: 0.25 } },
      { k: 'e_garden', n: 'โคมไฟโซลาร์เซลล์ในสวนและทางเดิน', i: '🏮', p: 4800, d: 0, t: 'ไม่ใช้ไฟบ้านตอนกลางคืน ประหยัด 0.04 kW', night: 0.04 },
      { k: 'e_mdb', n: 'ตู้ MDB ใหม่แยกวงจรย่อยครบ', i: '🗄️', p: 9500, d: 2, t: 'แยกวงจรแอร์/ปั๊ม/ครัว ค่าไฟลดลง 1% และเสถียรขึ้น', bill: 0.01, f: 'mdb' },
      { k: 'e_rod', n: 'ระบบป้องกันฟ้าผ่า (เสาล่อฟ้า + สายดินสนาม)', i: '⚡', p: 16000, d: 3, t: 'ไฟดับจากฟ้าผ่า/พายุลดลงครึ่งหนึ่ง', f: 'rod' },
      { k: 'e_surge', n: 'เซอร์จโพรเทคเตอร์ป้องกันไฟกระชากทั้งบ้าน', i: '🛡️', p: 7800, d: 1, t: 'ป้องกันคอมพิวเตอร์/อุปกรณ์ไอทีพังจากฟ้าผ่า', f: 'surge' },
      { k: 'e_shed', n: 'ระบบตัดโหลดอัตโนมัติ (Load Shedding)', i: '🧠', p: 11000, d: 1, t: 'ไฟใกล้เกินมิเตอร์ ตัดแอร์ให้เองก่อนเบรกเกอร์ตัดทั้งบ้าน', f: 'shed' },
      { k: 'e_audit', n: 'จ้างวิศวกรตรวจสอบพลังงานทั้งบ้าน (Energy Audit)', i: '📋', p: 6000, d: 2, t: 'ได้คำแนะนำปรับปรุงจุดรั่วไหล ค่าไฟลดลง 3% ถาวร', bill: 0.03 },
    ],
    water: [
      { k: 'w_aer', n: 'ก๊อกน้ำประหยัดน้ำ (Aerator)', i: '🚰', p: 600, d: 0, t: 'ใช้น้ำลดลง 6%', use: 0.06 },
      { k: 'w_shower', n: 'ฝักบัวประหยัดน้ำ', i: '🚿', p: 1200, d: 0, t: 'ใช้น้ำลดลง 5%', use: 0.05 },
      { k: 'w_wc', n: 'ชักโครกประหยัดน้ำ 3/4.5 ลิตร', i: '🚽', p: 5500, d: 1, t: 'ใช้น้ำลดลง 10%', use: 0.1 },
      { k: 'w_wash', n: 'เครื่องซักผ้าฝาหน้าประหยัดน้ำ', i: '🧺', p: 15900, d: 1, t: 'ใช้น้ำลดลง 6%', use: 0.06 },
      { k: 'w_grey', n: 'ระบบรีไซเคิลน้ำเทารดต้นไม้', i: '♻️', p: 18000, d: 3, t: 'ใช้น้ำประปาลดลง 12%', use: 0.12 },
      { k: 'w_valve', n: 'วาล์วตัดน้ำอัตโนมัติเมื่อท่อรั่ว', i: '🔧', p: 3500, d: 1, t: 'ท่อรั่วแล้วตัดน้ำให้เองภายใน 1 วัน', f: 'valve' },
      { k: 'w_dmeter', n: 'มาตรวัดน้ำดิจิทัลแจ้งเตือนน้ำรั่ว', i: '📟', p: 2900, d: 1, t: 'รู้ทันทีที่ท่อรั่ว (ไม่ต้องรอบิลแพง)', f: 'dmeter', req: () => (Water.st().meter ? '' : 'ต้องมีมาตรวัดน้ำประปาก่อน') },
      { k: 'w_pe', n: 'เปลี่ยนท่อ PVC เป็นท่อ PE ทั้งบ้าน', i: '🧵', p: 14000, d: 3, t: 'ท่อทนแรงดัน ไม่รั่วอีก', f: 'pipe' },
      { k: 'w_boost', n: 'ปั๊มบูสเตอร์เพิ่มแรงดันน้ำ', i: '💪', p: 4200, d: 1, t: 'แรงดันน้ำไม่ตกแม้หน้าแล้ง', f: 'booster' },
      { k: 'w_ro', n: 'เครื่องกรองน้ำดื่ม RO', i: '🥤', p: 7900, d: 1, t: 'ดื่มน้ำสะอาด อารมณ์ดีขึ้น +1 ทุกเช้า', f: 'ro' },
      { k: 'w_tank2', n: 'ถังเก็บน้ำเพิ่ม 2,000 ลิตร', i: '🛢️', p: 8500, d: 1, t: 'ความจุถังรวมเพิ่มเป็น 4,000 ลิตร', cap: 2000, req: needTank },
      { k: 'w_tank3', n: 'ถังเก็บน้ำใต้ดิน 5,000 ลิตร', i: '🕳️', p: 21000, d: 4, t: 'ความจุถังเพิ่มอีก 5,000 ลิตร', cap: 5000, req: needTank },
      { k: 'w_float', n: 'ลูกลอยเติมน้ำถังอัตโนมัติ', i: '🛟', p: 1800, d: 0, t: 'ถังเติมจากประปาเต็มทุกเช้า (คิดเป็นค่าน้ำตามมิเตอร์)', f: 'float', req: needTank },
      { k: 'w_gutter', n: 'รางน้ำฝนขยายพื้นที่รับน้ำ', i: '🌧️', p: 5200, d: 1, t: 'วันฝนตกได้น้ำเข้าถังเพิ่ม 600 ลิตร', f: 'gutter', req: needTank },
      { k: 'w_spump', n: 'ปั๊มบาดาลโซลาร์/อินเวอร์เตอร์', i: '☀️', p: 24000, d: 2, t: 'ปั๊มบาดาลกินไฟลดลง 60%', pump: 0.6, req: needWell },
      { k: 'w_pond', n: 'บ่อเก็บน้ำฟาร์ม 50 ลูกบาศก์เมตร', i: '🏞️', p: 45000, d: 5, t: 'ใช้น้ำประปาลดลง 15% (ใช้น้ำบ่อรดผัก/ให้สัตว์)', use: 0.15 },
      { k: 'w_rain', n: 'เซนเซอร์ฝนหยุดสปริงเกลอร์', i: '🌦️', p: 2400, d: 0, t: 'ไม่รดน้ำตอนฝนตก ใช้น้ำลดลง 5%', use: 0.05 },
      { k: 'w_zone', n: 'แยกมาตรวัดน้ำโซนเกษตร', i: '🌾', p: 6500, d: 2, t: 'ได้อัตราน้ำเกษตร ค่าน้ำลดลง 8%', bill: 0.08, req: () => (Water.st().meter ? '' : 'ต้องมีมาตรวัดน้ำประปาก่อน') },
      { k: 'w_irr', n: 'สัญญาซื้อน้ำดิบชลประทาน', i: '📄', p: 4000, d: 3, t: 'ค่าน้ำลดลง 12%', bill: 0.12, req: () => (Water.st().meter ? '' : 'ต้องมีมาตรวัดน้ำประปาก่อน') },
      { k: 'w_audit', n: 'ช่างตรวจระบบประปาประจำปี', i: '📋', p: 1500, d: 1, t: 'โอกาสท่อรั่วลดลงครึ่งหนึ่ง', f: 'wAudit' },
    ],
    net: [
      { k: 'n_wifi7', n: 'เราเตอร์ WiFi 7 อัปเกรด', i: '📡', p: 4900, d: 0, t: 'ความเร็วจริงเพิ่ม 3%', spd: 0.03, req: needNet },
      { k: 'n_mesh', n: 'Mesh WiFi 6 ครอบคลุมทั้งไร่', i: '📶', p: 5990, d: 1, t: 'เน็ตไร้สายในเขตไร่แรงขึ้น +10% และความเร็ว +2%', wl: 0.1, spd: 0.02, req: needNet },
      { k: 'n_cat6', n: 'เดินสาย LAN Cat6 ทั้งบ้าน', i: '🧵', p: 6200, d: 2, t: 'ความเร็วเพิ่ม 2% ไม่ตกในห้องไกลเราเตอร์', spd: 0.02, req: needNet },
      { k: 'n_ups', n: 'UPS สำรองไฟ ONT + เราเตอร์', i: '🔋', p: 2900, d: 0, t: 'ไฟดับเน็ตยังใช้ได้ 4 ชั่วโมงแรก', f: 'upsnet', req: needNet },
      { k: 'n_4g', n: 'เน็ตสำรอง 4G Failover อัตโนมัติ', i: '📲', p: 3990, d: 1, t: 'สายหลักขัดข้องสลับไป 4G ความเร็ว 60 Mbps (199 ฿/เดือน)', f: 'fo4g', mo: 199, req: needNet },
      { k: 'n_ant', n: 'เสาอากาศ 5G ภายนอกบ้าน', i: '📡', p: 6900, d: 1, t: 'เน็ตไร้สายแรงขึ้น +12% (ใช้กับ 5G Home / Pocket WiFi)', wl: 0.12, req: () => (ISP.pkg() && ISP.pkg().wireless ? '' : 'ใช้ได้กับแพ็กเกจเน็ตไร้สายเท่านั้น') },
      { k: 'n_lt', n: 'ตัวป้องกันฟ้าผ่าสายไฟเบอร์/LAN', i: '⚡', p: 2400, d: 0, t: 'เน็ตขัดข้องจากพายุ/อุปกรณ์ลดลง 40%', fm: 0.6, req: needNet },
      { k: 'n_sla', n: 'บริการซ่อมด่วน SLA 4 ชั่วโมง', i: '🧑‍🔧', p: 800, d: 0, t: 'เน็ตล่มแล้วซ่อมเร็วขึ้นเท่าตัว (250 ฿/เดือน)', f: 'sla', mo: 250, req: needNet },
      { k: 'n_vpn', n: 'VPN ธุรกิจ + เครือข่ายส่วนตัว', i: '🔒', p: 1500, d: 0, t: 'รายได้งานออนไลน์/สตรีมเพิ่ม 4% (120 ฿/เดือน)', bon: 0.04, mo: 120, req: needNet },
      { k: 'n_dns', n: 'DNS ปลอดภัยกันมัลแวร์ทั้งบ้าน', i: '🛡️', p: 600, d: 0, t: 'โอกาสคอมติดไวรัสลดลงครึ่งหนึ่ง (60 ฿/เดือน)', f: 'dns', mo: 60, req: needNet },
      { k: 'n_cloud', n: 'คลาวด์สำรองข้อมูล 1 TB', i: '☁️', p: 1000, d: 0, t: 'คอมติดไวรัสแล้วกู้ข้อมูลฟรีไม่เสียค่าช่าง (99 ฿/เดือน)', f: 'cloud', mo: 99, req: needNet },
      { k: 'n_qos', n: 'ตั้งค่า QoS เกมมิ่ง (ปิงต่ำ)', i: '🎮', p: 1200, d: 0, t: 'เล่นเกมที่คอมได้อารมณ์เพิ่มอีก +3 ทุกครั้ง', f: 'qos', req: needNet },
      { k: 'n_up', n: 'แพ็กอัปโหลดบูสต์ 20%', i: '⬆️', p: 900, d: 0, t: 'ไลฟ์สตรีมได้เงินเพิ่ม 8% (150 ฿/เดือน)', f: 'upboost', mo: 150, req: needNet },
      { k: 'n_tv', n: 'กล่องทีวีออนไลน์ + แพ็กช่อง', i: '📺', p: 1900, d: 1, t: 'ดูทีวีผ่อนคลาย อารมณ์ +1 ทุกเช้า (150 ฿/เดือน)', f: 'iptv', mo: 150, req: needNet },
      { k: 'n_ddns', n: 'DDNS + ดูกล้องนอกบ้านผ่านมือถือ', i: '📹', p: 700, d: 0, t: 'ดูกล้องวงจรปิดออนไลน์ได้แม้เน็ตอัปโหลดต่ำ (90 ฿/เดือน)', f: 'ddns', mo: 90, req: needNet },
      { k: 'n_survey', n: 'ช่างสำรวจและจูนจุดสัญญาณ', i: '🧭', p: 1500, d: 1, t: 'ความเร็วเพิ่ม 3%', spd: 0.03, req: needNet },
      { k: 'n_nic', n: 'การ์ดเครือข่าย 2.5G ในคอมพิวเตอร์', i: '🔌', p: 1300, d: 0, t: 'สตรีมได้เงินเพิ่ม 4%', f: 'nic', req: needNet },
      { k: 'n_sat', n: 'จานดาวเทียมอินเทอร์เน็ตสำรอง', i: '🛰️', p: 18000, d: 3, t: 'สายหลักล่ม/พายุ ยังได้ 200 Mbps (1,290 ฿/เดือน)', f: 'sat', mo: 1290, req: needNet },
      { k: 'n_ins', n: 'ประกันอุปกรณ์เครือข่ายและคอมพิวเตอร์', i: '📃', p: 500, d: 0, t: 'อุปกรณ์เสียจากไฟกระชาก ซ่อมฟรี (49 ฿/เดือน)', f: 'insure', mo: 49 },
      { k: 'n_pm', n: 'แพ็กบำรุงรักษาเครือข่ายประจำปี', i: '🧰', p: 1200, d: 1, t: 'เน็ตขัดข้องลดลง 30%', fm: 0.7, req: needNet },
    ],
    energy: [
      { k: 'p_topcon', n: 'อัปเกรดแผงเป็นรุ่น TOPCon ประสิทธิภาพสูง', i: '☀️', p: 38000, d: 3, t: 'แผงทั้งหมดผลิตไฟเพิ่ม 12%', prodMul: 0.12, req: needPanel },
      { k: 'p_track', n: 'ระบบติดตามแสงอาทิตย์ (Solar Tracker) โซลาร์ฟาร์ม', i: '🧭', p: 65000, d: 4, t: 'โซลาร์ฟาร์มภาคพื้นดินผลิตเพิ่ม 18%', farmMul: 0.18, req: () => (Power.st().farm > 0 ? '' : 'ต้องมีโซลาร์ฟาร์มภาคพื้นดินก่อน') },
      { k: 'p_micro', n: 'ไมโครอินเวอร์เตอร์ (ลดผลกระทบเงา)', i: '🔩', p: 22000, d: 2, t: 'ผลิตไฟเพิ่ม 6%', prodMul: 0.06, req: needPanel },
      { k: 'p_clean', n: 'ระบบล้างแผงโซลาร์อัตโนมัติ', i: '🧼', p: 18000, d: 2, t: 'ฝุ่นไม่เกาะแผงอีก (ผลิตไฟเต็มประสิทธิภาพ)', f: 'autoclean', req: needPanel },
      { k: 'p_mon', n: 'ระบบมอนิเตอร์โซลาร์รายแผง', i: '📊', p: 6500, d: 1, t: 'จับจุดเสียเร็ว ผลิตไฟเพิ่ม 2%', prodMul: 0.02, req: needPanel },
      { k: 'p_wind1', n: 'กังหันลมเล็ก 1 kW', i: '🌬️', p: 28000, d: 3, t: 'ผลิตไฟเสริมเทียบเท่า 0.5 kWp', kwp: 0.5 },
      { k: 'p_wind3', n: 'กังหันลม 3 kW เสาสูง', i: '🌬️', p: 72000, d: 5, t: 'ผลิตไฟเสริมเทียบเท่า 1.4 kWp', kwp: 1.4 },
      { k: 'p_fold', n: 'ชุดโซลาร์พับพกพา 400W', i: '🔋', p: 14000, d: 0, t: 'ผลิตไฟเสริมเทียบเท่า 0.35 kWp (ไม่ต้องขอขนานไฟ)', kwp: 0.35 },
      { k: 'p_hydro', n: 'ไมโครไฮโดรลำห้วยท้ายไร่ 0.8 kW', i: '💧', p: 95000, d: 7, t: 'ผลิตไฟตลอด 24 ชม. ลดการใช้ไฟ 0.6 kW', flat: 0.6 },
      { k: 'p_bio', n: 'ถังหมักก๊าซชีวภาพจากมูลสัตว์', i: '♻️', p: 38000, d: 4, t: 'ผลิตไฟจากก๊าซ ลดการใช้ไฟ 0.35 kW (ต้องเลี้ยงสัตว์อย่างน้อย 2 ตัว)', flat: 0.35, req: () => (S.animals.length >= 2 ? '' : 'ต้องมีสัตว์ในไร่อย่างน้อย 2 ตัว') },
      { k: 'p_b5', n: 'โมดูลแบตเตอรี่เสริม +5 kWh', i: '🔋', p: 24000, d: 1, t: 'ความจุแบตเตอรี่บ้านเพิ่ม 5 kWh', batt: 5, req: () => (Power.st().batt > 0 && Power.st().batt <= 25 ? '' : Power.st().batt ? 'ความจุเต็ม 30 kWh แล้ว' : 'ต้องมีแบตเตอรี่บ้านก่อน') },
      { k: 'p_b10', n: 'โมดูลแบตเตอรี่เสริม +10 kWh', i: '🔋', p: 45000, d: 2, t: 'ความจุแบตเตอรี่บ้านเพิ่ม 10 kWh', batt: 10, req: () => (Power.st().batt > 0 && Power.st().batt <= 20 ? '' : Power.st().batt ? 'ความจุไม่พอให้เพิ่มอีก' : 'ต้องมีแบตเตอรี่บ้านก่อน') },
      { k: 'p_ems', n: 'ระบบบริหารพลังงานบ้าน (EMS) ใช้ไฟช่วงถูก', i: '🧠', p: 16000, d: 1, t: 'ค่าไฟลดลง 4%', bill: 0.04 },
      { k: 'p_heat', n: 'ปั๊มความร้อนทำน้ำอุ่น (Heat Pump)', i: '♨️', p: 32000, d: 2, t: 'เครื่องทำน้ำอุ่นกินไฟลดลง 80%', cut: { heater: 0.8 } },
      { k: 'p_ac', n: 'แอร์โซลาร์ไฮบริดต่อ DC ตรง', i: '❄️', p: 42000, d: 2, t: 'แอร์กินไฟลดลง 30%', cut: { aircon: 0.3 } },
      { k: 'p_gen10', n: 'เครื่องปั่นไฟดีเซล 10 kW + น้ำมัน 40 ลิตร', i: '⛽', p: 36000, d: 1, t: 'สำรองไฟตอนไฟดับ (ต้องมีตู้ ATS จากช่างไฟ)', f: 'gen10', req: () => (Grid.st().ats ? '' : 'ต้องมีตู้ ATS จากช่างไฟก่อน') },
      { k: 'p_fence', n: 'ไฟโซลาร์รั้วไร่ + สปอตไลท์เซนเซอร์', i: '🔦', p: 12000, d: 1, t: 'ขโมยเข้าไร่ยากขึ้น 10%', f: 'spot' },
      { k: 'p_eml', n: 'ไฟฉุกเฉินโซลาร์ในบ้านและห้องนอน', i: '🪔', p: 3800, d: 0, t: 'ไฟดับยังมีไฟส่องสว่าง อารมณ์ไม่ตกตอนไฟดับ', f: 'emlight' },
      { k: 'p_dc', n: 'ระบบไฟ DC ตรงจากโซลาร์ (ตู้เย็น/ปั๊ม)', i: '🔌', p: 27000, d: 3, t: 'ตู้เย็นและปั๊มน้ำกินไฟลดลง 20%', cut: { fridge: 0.2, pump: 0.2 }, req: needPanel },
      { k: 'p_ins', n: 'ประกันภัยโซลาร์และแบตเตอรี่', i: '📃', p: 9000, d: 0, t: 'ซ่อมฟรีเมื่อฟ้าผ่า/พายุ (ลดค่าซ่อมไฟกระชาก)', f: 'solarins', req: needPanel },
    ],
  };
  const ALL = {}; for (const m in ITX) for (const it of ITX[m]) { it.m = m; ALL[it.k] = it; }
  const active = m => ITX[m].filter(it => has(it.k));
  const activeAll = () => Object.values(ALL).filter(it => has(it.k));
  const sum = (f) => activeAll().reduce((s, it) => s + (f(it) || 0), 0);
  const cap = () => 2000 + sum(it => it.cap);

  // ----- buy / install -----
  const install = (k, pay) => {
    const it = ALL[k]; if (!it || OWN(k)) return false;
    const r = it.req && it.req(); if (r) { UI.toast(r, '⚠️'); return false; }
    if (pay) { if (S.money < it.p) { UI.toast('เงินไม่พอ', '💸'); return false; } S.money -= it.p; Bank2.log(it.n, -it.p); }
    st().own[k] = { day: S.day + it.d, buy: S.day };
    if (!it.d) apply(it); else Phone.msg('ช่างติดตั้ง', `รับงาน "${it.n}" แล้ว ช่างจะติดตั้งเสร็จ${RD(S.day + it.d)} (${it.d} วัน)`, true);
    UI.toast(it.d ? `ว่าจ้าง${it.n} ช่างมาติดตั้ง${RD(S.day + it.d)}` : `ติดตั้ง${it.n}เรียบร้อย`, it.i);
    Life2.note('ติดตั้ง ' + it.n);
    return true;
  };
  // one-off effects when the installer finishes
  const apply = it => {
    const o = OWN(it.k); if (!o || o.applied) return; o.applied = 1;
    if (it.batt) { const s = Power.st(); s.batt = Math.min(30, s.batt + it.batt); }
    if (it.f === 'gen10') { const E = Grid.st(); E.gen = 1; E.genFuel = Math.min(40, (E.genFuel || 0) + 40); }
    if (it.f === 'autoclean') S.solarDust = 0;
    if (it.d) Phone.msg('ช่างติดตั้ง', `ติดตั้ง "${it.n}" เสร็จเรียบร้อยแล้ว ${it.t}`);
    if (typeof Power.visual === 'function' && (it.kwp || it.prodMul)) { try { Power.visual(); } catch (e) { } }
  };
  const itemHtml = it => {
    const o = OWN(it.k), r = it.req && it.req();
    let btn;
    if (o && S.day >= o.day) btn = '<button class="btn ghost" disabled>ติดตั้งแล้ว ✅</button>';
    else if (o) btn = `<button class="btn ghost" disabled>🛠️ ช่างมา${RD(o.day)}</button>`;
    else btn = `<button class="btn" data-a="v23buy" data-k="${it.k}" ${r || S.money < it.p ? 'disabled' : ''}>${baht(it.p)}${it.d ? ` · ${it.d} วัน` : ' · ติดตั้งทันที'}</button>`;
    return `<div class="card"><div class="ci">${it.i}</div><div class="cb"><h4>${esc(it.n)}</h4><p class="dim">${esc(it.t)}${it.mo && !o ? ` · ค่าบริการ ${baht(it.mo)}/เดือน` : ''}</p>${r && !o ? `<p class="dim bad">⚠️ ${esc(r)}</p>` : ''}<div class="row">${btn}</div></div></div>`;
  };
  const catHtml = (m, head) => `<p class="lead">${head}</p><p class="dim">ติดตั้งแล้ว ${active(m).length}/${ITX[m].length} รายการ · ช่างใช้เวลาตามงานจริง เมื่อเสร็จจะมีข้อความแจ้งในมือถือ</p><div class="grid">${ITX[m].map(itemHtml).join('')}</div>`;
  UI.H.v23buy = d => install(d.k, true);

  // ================= electricity effects =================
  const elecReduce = h => {
    let red = 0, base = 0; for (const L of LOADS) base += L[2](h) || 0;
    for (const it of activeAll()) {
      if (it.cut) for (const key in it.cut) { const L = LOADS.find(l => l[0] === key); if (L) red += it.cut[key] * (L[2](h) || 0); }
      if (it.flat) red += it.flat; if (it.night && (h >= 18 || h < 6)) red += it.night;
    }
    return Math.min(red, base * 0.9);
  };
  Power.extra.push(h => -elecReduce(h));
  { const _b = Grid.bill.bind(Grid); Grid.bill = function (...a) { const r = _b(...a), pct = Math.min(0.2, sum(it => it.m !== 'water' ? it.bill : 0)); if (pct) { const save = Math.round(r.total * pct); r.total -= save; r.saved = save; } return r; }; }
  { const _k = Power.kwp.bind(Power); Power.kwp = function () { const s = this.st(), pm = sum(it => it.prodMul), fm = sum(it => it.farmMul); return _k() * (1 + pm) + s.farm * 0.55 * fm + sum(it => it.kwp); }; }
  { const _l = Power.load.bind(Power); Power.load = function (h) { const kw = _l(h); if (has('e_shed') && S.ac && kw > this.st().amp * 0.92 && !G.simulating) { S.ac = false; UI.toast('ระบบตัดโหลดอัตโนมัติ: ไฟใกล้เกินมิเตอร์ ตัดแอร์ให้เพื่อไม่ให้เบรกเกอร์ตัด', '🧠'); return _l(h); } return kw; }; }
  // storm damage to the house: lightning rods halve the outages, surge protection / UPS save the computers
  { const _o = Grid.outageStart.bind(Grid);
    Grid.outageStart = function (hrs, cause) {
      const bolt = /ฟ้า|พายุ/.test(cause || '');
      if (bolt && has('e_rod') && Math.random() < 0.5) return;
      const was = Power.st().out; _o(hrs, cause);
      if (bolt && !was && Power.st().out > 0 && (S.pcs || []).length && !has('e_surge') && !count('pc_ups') && !(PC.has && PC.has('ups')) && Math.random() < 0.12) {
        const pc = U.pick(S.pcs); pc.broken = 1; Phone.msg('ศูนย์ไอที', `ไฟกระชากจากฟ้าผ่า! พาวเวอร์ซัพพลายของ "${pc.name}" พัง ต้องซ่อมก่อนใช้งาน (ซื้อเซอร์จโพรเทคเตอร์หรือ UPS ป้องกันได้)`);
      }
    }; }
  { const _t = Sec.thiefMult.bind(Sec); Sec.thiefMult = () => _t() * (has('p_fence') ? 0.9 : 1); }

  // ================= water: usage meter, leaks, cost =================
  const W = Water;
  { const _u = W.use.bind(W);
    W.use = function (m3) {
      const w = this.st(), f = 1 - Math.min(0.55, sum(it => it.use)), before = Power.st().today.use; _u(m3 * f);
      if (w.well && has('w_spump')) Power.st().today.use = before + (Power.st().today.use - before) * 0.4;
    }; }
  { const _p = W.pressureOK.bind(W); W.pressureOK = function () { return _p() || has('w_boost'); }; }
  { const _b = W.bill.bind(W); W.bill = function (m3) { const pct = Math.min(0.3, sum(it => it.bill && it.m === 'water' ? it.bill : 0)); return Math.round(_b(m3) * (1 - pct)); }; }
  { const _d = W.day.bind(W);
    W.day = function () {
      const w = this.st(), s = st(), wk0 = w.wk, pre = w.lvl, rain = WEATHER[S.weather.type].rain > 0.3;
      _d();
      const c = cap(); if (w.tank && c > 2000) w.lvl = Math.max(w.lvl, Math.min(c, pre + (rain && w.rain ? 900 : 0)));
      if (w.tank && rain && has('w_gutter')) w.lvl = Math.min(c, w.lvl + 600);
      if (w.tank && has('w_float') && w.lvl < c) { const add = c - w.lvl; w.lvl = c; w.wk += add / 1000; }
      // leaks: an old pipe splits now and then; digital meter / auto valve / PE pipe change how it plays out
      if (!s.leak && w.meter && !has('w_pe') && Math.random() < (has('w_audit') ? 0.012 : 0.025)) {
        s.leak = { start: S.day, found: 0 };
        if (has('w_valve')) { s.leak = null; Phone.msg('การประปาสุขใจ', 'ท่อน้ำรั่ว แต่วาล์วตัดน้ำอัตโนมัติทำงานแล้ว ไม่เสียน้ำเพิ่ม เรียกช่างซ่อมท่อได้', true); }
        else if (has('w_dmeter')) { s.leak.found = 1; Phone.msg('มาตรวัดน้ำดิจิทัล', 'แจ้งเตือน! น้ำไหลต่อเนื่องผิดปกติ สงสัยท่อรั่ว ไปที่แอปการประปาเพื่อเรียกช่างซ่อม'); }
      }
      if (s.leak) { this.use(2.5); w.wk += 0; if (!s.leak.found && S.day - s.leak.start >= 3) { s.leak.found = 1; Phone.msg('การประปาสุขใจ', 'ใช้น้ำสูงผิดปกติหลายวัน สงสัยท่อรั่ว ตรวจและซ่อมได้ในแอปการประปา'); } }
      // log: m3 used today from the meter
      s.log.unshift({ day: S.day, m3: +Math.max(0, w.wk - wk0).toFixed(2) }); s.log.length = Math.min(s.log.length, 7);
      if (has('w_ro')) S.mood = Math.min(100, (S.mood || 50) + 1);
      if (has('n_tv')) S.mood = Math.min(100, (S.mood || 50) + 1);
      if (has('p_clean')) S.solarDust = 0;
      for (const it of activeAll()) if (!OWN(it.k).applied) apply(it);
      // PCs catch malware now and then; DNS filtering and antivirus keep it away
      for (const pc of S.pcs || []) if (!pc.infected && pc.os && ISP.pkg() && Math.random() < 0.04 * (s.av ? 0.25 : 1) * (has('n_dns') ? 0.5 : 1)) { pc.infected = 1; Phone.msg('ศูนย์ไอที', `"${pc.name}" ติดมัลแวร์ ใช้งานไม่ได้จนกว่าจะล้างเครื่อง (ติดตั้งแอนติไวรัสและ DNS ปลอดภัยช่วยป้องกัน)`); }
    }; }
  const leakFix = () => { const s = st(); if (!s.leak || S.money < 800) return; S.money -= 800; Bank2.log('ค่าช่างซ่อมท่อประปารั่ว', -800); s.leak = null; UI.toast('ช่างประปาซ่อมท่อรั่วเรียบร้อย', '🔧'); };
  UI.H.v23leak = () => leakFix();
  { const _h = W.html.bind(W);
    W.html = function () {
      const w = this.st(), s = st(), wk = w.wk, est = w.meter ? W.bill(wk) : 0, tank = w.tank ? `${Math.round(w.lvl)}/${cap().toLocaleString()} ลิตร` : '-';
      const dash = `<h5>📊 มาตรวัดน้ำของฉัน</h5><div class="grid"><div class="card"><div class="ci">💧</div><div class="cb"><h4>${w.meter ? 'มิเตอร์ใช้งานได้' : 'ยังไม่มีมาตรวัดน้ำ'}</h4><p class="dim">ใช้สัปดาห์นี้ ${wk.toFixed(1)} ลบ.ม. · ค่าน้ำสะสมรอบบิลเดือนนี้ ~${baht(est + ((window.Bills84 && window.Bills84.st().acc.water) || 0))} · ถังเก็บน้ำ ${tank}</p>${s.log.length ? `<p class="dim">ย้อนหลัง: ${s.log.map(l => `วัน ${l.day}: ${l.m3.toFixed(2)} ลบ.ม.`).join(' · ')}</p>` : ''}</div></div>
        ${s.leak ? `<div class="card"><div class="ci">💦</div><div class="cb"><h4 class="bad">ท่อน้ำรั่ว!</h4><p class="dim">${s.leak.found ? 'น้ำไหลทิ้งวันละ ~2.5 ลบ.ม. เรียกช่างซ่อมเพื่อหยุดเสียน้ำ' : 'ยังตรวจไม่พบ แต่มาตรวัดหมุนผิดปกติ'}</p><div class="row"><button class="btn" data-a="v23leak" ${S.money < 800 ? 'disabled' : ''}>เรียกช่างซ่อมท่อ ${baht(800)}</button></div></div></div>` : ''}</div>`;
      return _h() + dash + `<h5>📝 ขอใช้น้ำประปา / ติดตั้งมาตรวัด</h5>` + WaterReq.app() + `<h5>🔧 อัปเกรดระบบน้ำ (20 รายการ)</h5>` + catHtml('water', 'ติดตั้งอุปกรณ์ประหยัดน้ำ ป้องกันท่อรั่ว เพิ่มถังเก็บน้ำ');
    }; }

  // ================= electricity & internet apps get an upgrades tab =================
  { const o = GridApp.open.bind(GridApp), h = GridApp.html.bind(GridApp);
    GridApp.open = function () { UI.open('การไฟฟ้าอำเภอสุขใจ', ['ภาพรวม & คำร้อง', 'ยื่นคำร้องใหม่', 'จ้างช่างไฟ', 'มิเตอร์ไฟ', '🔧 อัปเกรดประหยัดไฟ'], t => this.html(t), { wide: true }); };
    GridApp.html = function (t) { return t === 4 ? catHtml('elec', 'ติดตั้งอุปกรณ์ประหยัดไฟและป้องกันความเสียหาย — มีผลกับค่าไฟจริงทุกสัปดาห์') : h(t); }; }
  // ================= internet =================
  { const _s = ISP.speed.bind(ISP);
    ISP.speed = function () {
      const s = this.st(), P = this.pkg(); if (!P) return 0;
      if (s.unpaid >= 2) return 0;
      let v = _s(); const dark = typeof Grid !== 'undefined' && Grid.st().src === 'none';
      if (!v) {
        if (s.down > 0 && !dark) { if (has('n_sat')) return 200; if (has('n_4g')) return 60; return 0; }
        if (dark && has('n_ups') && Grid.st().darkH <= 4 && !s.down) return Math.round(P.down * 0.9);
        return 0;
      }
      const zone = (zoneAt(HOUSE_POS.x, HOUSE_POS.z) || {}).id;
      return Math.round(v * (1 + sum(it => it.spd) + (P.wireless ? sum(it => it.wl) * (zone === 'farm' ? 1 : 0.5) : 0)));
    }; }
  { const _h = ISP.hour.bind(ISP);
    ISP.hour = function (h) {
      const mult = Math.max(0.2, 1 - sum(it => it.fm ? 1 - it.fm : 0)), sv = {}; for (const k in ISPS) { sv[k] = ISPS[k].fault; ISPS[k].fault *= mult; }
      try { _h(h); } finally { for (const k in ISPS) ISPS[k].fault = sv[k]; }
      const s = this.st(); if (s.down > 1 && has('n_sla')) s.down--;
    }; }
  { const _b = ISP.bonus.bind(ISP); ISP.bonus = function () { const b = _b(); return b ? b * (1 + sum(it => it.bon)) : 0; }; }
  { const _m = ISP.monthly.bind(ISP); ISP.monthly = function () { const m = _m(); return m ? m + sum(it => it.mo) : 0; }; }
  { const _u = Sec.upMbps.bind(Sec); Sec.upMbps = function (site) { const v = _u(site); return site === 'home' && v && has('n_ddns') ? v + 20 : v; }; }
  { const _o = ISP.open.bind(ISP), _h = ISP.html.bind(ISP);
    ISP.open = function () { UI.open('อินเทอร์เน็ตบ้าน', ['แพ็กเกจของฉัน', 'สมัครแพ็กเกจ', '🔧 บริการเสริม (20)'], t => this.html(t), { wide: true }); };
    ISP.html = function (t) { return t === 2 ? catHtml('net', 'อุปกรณ์และบริการเสริมอินเทอร์เน็ต — มีผลกับความเร็ว ความเสถียร และรายได้ออนไลน์จริง') : _h(t); }; }

  // ================= renewable energy shop tab (EV & clean energy centre) =================
  ENTRY_KINDS.v23e = id => { const it = ALL[id], o = OWN(id); return { icon: it.i, name: it.n, desc: it.t + (it.d ? ` · ช่างติดตั้ง ${it.d} วัน` : ''), price: it.p, block: o ? 'ติดตั้งแล้ว' : (it.req && it.req()) || '', buy: () => { if (!install(id, false)) { S.money += it.p; } } }; };
  if (SHOPS.evcenter) SHOPS.evcenter.tabs.push({ n: '🔧 ระบบพลังงานเสริม (20)', items: ITX.energy.map(it => 'v23e:' + it.k) });

  // ================= IT hub =================
  const ORDER = ['router', 'firewall', 'switch', 'rack', 'ups', 'nas', 'nvr', 'dvr', 'server', 'ap', 'cam', 'hdd', 'alarm', 'sensor', 'access', 'lock', 'fire', 'pac'];
  const bagSec = () => Object.keys(DEV).filter(k => count('sec_' + k) > 0 && !['cat6', 'coax'].includes(k));
  const autoInstall = (site, only) => {
    if (count('sec_cat6') || count('sec_coax')) Sec.unbox();
    const done = [], fails = {}; let progress = true, guard = 0;
    while (progress && guard++ < 120) {
      progress = false;
      const keys = bagSec().filter(k => !only || k === only).sort((a, b) => ORDER.indexOf(DEV[a].t) - ORDER.indexOf(DEV[b].t));
      for (const k of keys) {
        const rt = ['router', 'firewall'].includes(DEV[k].t);
        let ok = false, last = rt ? 'ต้องสมัครอินเทอร์เน็ตบ้านและรอช่างติดตั้งสายก่อน (แอปอินเทอร์เน็ต) เราเตอร์ถึงจะมีสัญญาณเข้า' : 'ยังไม่มีอุปกรณ์แม่ที่รองรับ (เช่น เราเตอร์/สวิตช์/NVR) หรือพอร์ตเต็ม';
        for (const p of Sec.parents(site, DEV[k])) { const e = Sec.install(site, k, p.uid); if (!e) { ok = true; break; } last = e; }
        if (ok) { progress = true; done.push(k); delete fails[k]; break; } else fails[k] = last;
      }
    }
    return { done, fails };
  };
  const hub = { tab: 0, site: 'home' };
  const gadgets = () => (typeof IT_GOODS !== 'undefined' ? IT_GOODS.filter(g => g[5] !== 'furn' && count(g[0]) > 0) : []);
  const atHome = () => G.inside || Math.hypot(G.player.pos.x - HOUSE_POS.x, G.player.pos.z - HOUSE_POS.z) < 40;
  const step = (ok, t, hint) => `<div class="lead">${ok ? '✅' : '⬜'} ${t}${ok ? '' : ` <span class="dim">— ${hint}</span>`}</div>`;
  const hubHtml = tab => {
    const site = hub.site, S2 = Sec.status(site), pcs = S.pcs || [], net = ISP.pkg(), spd = ISP.speed(), dev = Sec.site(site).dev;
    if (tab === 0) {
      const p = Power.status(), mon = pcs.length ? PC.monitor() : null;
      return `<p class="lead">ศูนย์รวมระบบไอทีของบ้าน: ไฟฟ้า → อินเทอร์เน็ต → เครือข่าย/กล้อง → คอมพิวเตอร์ ทุกอย่างต่อกันและพึ่งพากันแบบจริง (ไม่มีไฟ = ไม่มีเน็ต = ไม่มีคอม)</p>
      <div class="grid"><div class="card"><div class="ci">⚡</div><div class="cb"><h4>ไฟฟ้า ${p.dark ? '<span class="bad">ดับ</span>' : '<span class="good">ปกติ</span>'}</h4><p class="dim">ใช้อยู่ ${p.use.toFixed(2)} kW · ${METERS[Grid.st().meter].n}</p><div class="row"><button class="btn ghost" data-a="v23go" data-v="grid">การไฟฟ้า</button></div></div></div>
      <div class="card"><div class="ci">📶</div><div class="cb"><h4>อินเทอร์เน็ต ${spd ? `<span class="good">${spd} Mbps</span>` : '<span class="bad">ใช้ไม่ได้</span>'}</h4><p class="dim">${net ? esc(net.n) : 'ยังไม่ได้สมัครแพ็กเกจ'}</p><div class="row"><button class="btn ghost" data-a="v23go" data-v="isp">${net ? 'จัดการเน็ต' : 'สมัครเน็ต'}</button></div></div></div>
      <div class="card"><div class="ci">📷</div><div class="cb"><h4>เครือข่าย/กล้อง ${S2.on ? '' : '(ไม่มีไฟ)'}</h4><p class="dim">อุปกรณ์ติดตั้งแล้ว ${dev.length} ชิ้น · กล้องออนไลน์ ${S2.onCnt}/${S2.cams} · บันทึก ${S2.rec}</p><div class="row"><button class="btn ghost" data-a="v23go" data-v="sec">ผังเครือข่าย</button></div></div></div>
      <div class="card"><div class="ci">🖥️</div><div class="cb"><h4>คอมพิวเตอร์ ${pcs.length} เครื่อง</h4><p class="dim">${pcs.length ? pcs.map(c => esc(c.name) + (c.broken ? ' (เสีย)' : c.infected ? ' (ติดไวรัส)' : c.os === null ? ' (ยังไม่ลง OS)' : '')).join(' · ') : 'ยังไม่มี'} ${mon ? '· จอ ✅' : pcs.length ? '· ⚠️ ยังไม่มีจอ' : ''}</p><div class="row"><button class="btn ghost" data-a="v23tab" data-v="2">จัดการคอม</button></div></div></div></div>
      <h5>เช็กลิสต์วางระบบไอทีให้ใช้งานได้จริง</h5>
      ${step(!p.dark, 'มีไฟฟ้าใช้', 'ดูแอปการไฟฟ้า/ชำระบิล')}${step(!!net, 'สมัครอินเทอร์เน็ตบ้าน', 'แอปอินเทอร์เน็ต เลือกแพ็กเกจ ไฟเบอร์ต้องนัดช่างติดตั้ง')}
      ${step(dev.some(d => DEV[d.k].t === 'router'), 'ติดตั้งเราเตอร์ต่อกับสายเน็ต', 'ซื้อที่ไอทีซีเคียวริตี้ แล้วกดติดตั้งอัตโนมัติ (แท็บติดตั้งอุปกรณ์)')}
      ${step(dev.some(d => DEV[d.k].t === 'switch'), 'ติดตั้งสวิตช์ (PoE สำหรับกล้อง/AP)', 'ซื้อสวิตช์ PoE')}${step(S2.cams > 0 && S2.rec > 0, 'กล้องวงจรปิดและเครื่องบันทึกพร้อม HDD', 'ต้องมีกล้อง + NVR + HDD')}
      ${step(pcs.some(c => c.os !== null && !c.broken && !c.infected) && !!mon, 'คอมพิวเตอร์ลงระบบปฏิบัติการ มีจอ พร้อมใช้งาน', 'ประกอบคอม ลง OS และซื้อจอ')}`;
    }
    if (tab === 1) {
      const sites = ['home'].concat(typeof Company !== 'undefined' ? Company.list().map(c => 'co:' + c.id) : []), bag = bagSec(), g = gadgets();
      return `<div class="row">${sites.map(s => `<button class="btn ${s === site ? '' : 'ghost'}" data-a="v23site" data-v="${s}">${esc(Sec.siteName(s))}</button>`).join('')}</div>
      <p class="lead">สถานที่ติดตั้ง: ${esc(Sec.siteName(site))} · สาย LAN เหลือ ${Sec.st().cable} จุด · สายกล้องอนาล็อก ${Sec.st().coax} จุด ${count('sec_cat6') || count('sec_coax') ? '<button class="btn ghost" data-a="secunbox">แกะกล่องสาย</button>' : ''}</p>
      ${bag.length ? `<div class="row"><button class="btn" data-a="v23auto">🔌 ติดตั้งอุปกรณ์ทั้งหมดอัตโนมัติ (เดินสาย ต่อพอร์ต ตรวจ PoE ให้)</button></div><div class="grid">${bag.map(k => `<div class="card"><div class="ci">${DEV[k].i}</div><div class="cb"><h4>${esc(DEV[k].n)} ×${count('sec_' + k)}</h4><p class="dim">${esc(Sec.spec(DEV[k]))}</p><div class="row"><button class="btn ghost" data-a="v23one" data-k="${k}">ติดตั้งชิ้นนี้</button></div></div></div>`).join('')}</div>` : '<p class="dim">ไม่มีอุปกรณ์เครือข่าย/กล้องในกระเป๋า ซื้อได้ที่ร้านไอทีซีเคียวริตี้ ทุ่งทอง</p>'}
      ${hub.msg ? `<p class="lead">${hub.msg}</p>` : ''}
      <h5>ผังที่ติดตั้งแล้ว</h5>${dev.length ? dev.map(d => `<div class="lead">${S2.isOn(d) ? '🟢' : '🔴'} ${DEV[d.k].i} ${esc(DEV[d.k].n)}</div>`).join('') : '<p class="dim">ยังไม่มี</p>'}
      <div class="row"><button class="btn ghost" data-a="v23go" data-v="sec">เปิดผังเครือข่ายเต็ม (ถอด/ย้ายกล้อง)</button></div>
      ${g.length ? `<h5>แกดเจ็ตในกระเป๋า</h5><div class="grid">${g.map(x => `<div class="card"><div class="ci">${x[2]}</div><div class="cb"><h4>${esc(x[1])}</h4><p class="dim">${esc(x[4])}</p><div class="row"><button class="btn" data-a="usegood" data-id="${x[0]}">ติดตั้ง/ใช้งาน</button></div></div></div>`).join('')}</div>` : ''}`;
    }
    if (tab === 2) {
      const parts = Object.keys(PC_PARTS).filter(k => count('pc_' + k) > 0);
      return `<p class="lead">ประกอบคอม → ลงระบบปฏิบัติการ → ลงแอนติไวรัส → ต่อไฟ/เน็ต/จอ จึงใช้งานได้ (ต้องอยู่ที่บ้านถึงจะเปิดเครื่องใช้)</p>
      <div class="row"><button class="btn" data-a="pcbuilder">🔧 ประกอบคอม / ตรวจความเข้ากันได้</button><button class="btn ghost" data-a="v23av" ${st().av || S.money < 990 ? 'disabled' : ''}>${st().av ? '🛡️ มีแอนติไวรัสแล้ว' : '🛡️ ซื้อแอนติไวรัส 990 ฿/ปี'}</button></div>
      ${pcs.length ? pcs.map((c, i) => `<div class="card"><div class="ci">🖥️</div><div class="cb"><h4>${esc(c.name)} · คะแนน ${U.fmt(c.score)}</h4><p class="dim">กินไฟ ${c.w}W · ${window.PC39 ? PC39.badge(c) : ''}${c.broken ? '<b class="bad">พาวเวอร์ซัพพลายเสีย</b>' : c.infected ? '<b class="bad">ติดมัลแวร์</b>' : c.os === null ? 'ยังไม่ได้ลงระบบปฏิบัติการ' : `ระบบ ${c.os === 'linux' ? 'Linux (ฟรี)' : c.os === 'win' ? 'Windows 11' : 'พร้อมใช้งาน'}`}</p><div class="row">
        ${window.PC39 && !c.broken ? PC39.btns(c) : ''}${c.broken ? `<button class="btn" data-a="v23fix" data-i="${i}" ${S.money < 1500 ? 'disabled' : ''}>ซ่อม ${baht(1500)}</button>` : c.infected ? `<button class="btn" data-a="v23clean" data-i="${i}">${st().av || has('n_cloud') ? 'สแกน/กู้เครื่องฟรี' : 'จ้างช่างล้างเครื่อง ' + baht(600)}</button>` : c.os === null ? `<button class="btn" data-a="v23os" data-i="${i}" data-v="win" ${S.money < 3790 ? 'disabled' : ''}>ลง Windows 11 ${baht(3790)}</button><button class="btn ghost" data-a="v23os" data-i="${i}" data-v="linux">ลง Linux ฟรี</button>` : '<button class="btn" data-a="v23use">ใช้งานเครื่องนี้ (เล่นเกม/สตรีม/เรนเดอร์)</button>'}</div></div></div>`).join('') : '<p class="dim">ยังไม่มีคอมที่ประกอบแล้ว</p>'}
      ${parts.length ? `<h5>ชิ้นส่วนในกระเป๋า</h5><p class="lead">${parts.map(k => `${PC_PARTS[k].i} ${esc(PC_PARTS[k].n)} ×${count('pc_' + k)}`).join(' · ')}</p>` : ''}`;
    }
    return `<div class="grid">
      ${[['⚡', 'การไฟฟ้า', 'ยื่นคำร้อง มิเตอร์ บิล อัปเกรดประหยัดไฟ', 'grid'], ['💧', 'การประปา & ขอใช้น้ำ', 'ขอมาตรวัด ดูการใช้น้ำ ซ่อมท่อรั่ว', 'water'], ['📶', 'อินเทอร์เน็ตบ้าน', 'แพ็กเกจ ทดสอบความเร็ว บริการเสริม', 'isp'], ['📷', 'ผังเครือข่าย & กล้อง', 'ต่อสาย ดูสถานะ ย้ายกล้อง', 'sec'], ['☀️', 'ร้านพลังงาน', 'วิธีซื้อโซลาร์/แบตเตอรี่เสริม', 'ev']].map(([i, n, d, v]) => `<div class="card"><div class="ci">${i}</div><div class="cb"><h4>${n}</h4><p class="dim">${d}</p><div class="row"><button class="btn ghost" data-a="v23go" data-v="${v}">เปิด</button></div></div></div>`).join('')}</div>`;
  };
  const hubOpen = () => { UI.open('🖥️ ศูนย์ไอที & สาธารณูปโภค', ['ภาพรวม', 'ติดตั้งอุปกรณ์', 'คอมพิวเตอร์', 'บริการ'], t => hubHtml(t), { wide: true, tab: hub.tab }); };
  const goto = v => {
    if (v === 'ev') { UI.toast('ซื้อโซลาร์/แบตเตอรี่/ระบบเสริมได้ที่ศูนย์ EV & พลังงานสะอาดภูผา (แท็บระบบพลังงานเสริม)', '☀️'); return; }
    UI.close(); setTimeout(() => {
      if (v === 'grid') GridApp.open(); else if (v === 'isp') ISP.open(); else if (v === 'sec') Sec.ui(hub.site);
      else if (v === 'water') { Phone.open('water'); }
    }, 0);
  };
  Object.assign(UI.H, {
    v23tab: d => { hub.tab = +d.v; UI.cur.tab = +d.v; }, v23site: d => { hub.site = d.v; Sec.cur = d.v; },
    v23auto: () => { const r = autoInstall(hub.site), f = Object.entries(r.fails); hub.msg = r.done.length ? `ติดตั้งสำเร็จ ${r.done.length} ชิ้น` + (f.length ? ` · ที่ยังติดตั้งไม่ได้: ${f.map(([k, e]) => esc(DEV[k].n) + ' — ' + esc(e)).join(' | ')}` : '') : (f.length ? 'ติดตั้งไม่ได้: ' + f.map(([k, e]) => esc(DEV[k].n) + ' — ' + esc(e)).join(' | ') : 'ไม่มีอะไรให้ติดตั้ง'); UI.toast(r.done.length ? `ติดตั้งอุปกรณ์ ${r.done.length} ชิ้นแล้ว` : 'ติดตั้งไม่ได้ ดูเหตุผลในหน้าจอ', r.done.length ? '🔌' : '⚠️'); },
    v23one: d => { const r = autoInstall(hub.site, d.k); hub.msg = r.done.length ? '' : esc(DEV[d.k].n) + ' — ' + esc(r.fails[d.k] || ''); UI.toast(r.done.length ? `ติดตั้ง${DEV[d.k].n}แล้ว` : (r.fails[d.k] || 'ติดตั้งไม่ได้'), r.done.length ? '🔌' : '⚠️'); },
    v23go: d => goto(d.v),
    v23av: () => { if (st().av || S.money < 990) return; S.money -= 990; Bank2.log('แอนติไวรัส', -990); st().av = S.day; UI.toast('ติดตั้งแอนติไวรัสแล้ว', '🛡️'); },
    v23fix: d => { const pc = (S.pcs || [])[+d.i]; if (!pc || S.money < 1500) return; const free = has('n_ins'); if (!free) { S.money -= 1500; Bank2.log('ซ่อมคอมพิวเตอร์', -1500); } pc.broken = 0; UI.toast(free ? 'ประกันอุปกรณ์ซ่อมให้ฟรี' : 'ช่างเปลี่ยนพาวเวอร์ซัพพลายแล้ว', '🔧'); },
    v23clean: d => { const pc = (S.pcs || [])[+d.i]; if (!pc) return; const free = st().av || has('n_cloud'); if (!free) { if (S.money < 600) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(600), '💸'); return; } S.money -= 600; Bank2.log('ล้างมัลแวร์คอมพิวเตอร์', -600); } pc.infected = 0; UI.toast('ล้างมัลแวร์เรียบร้อย', '🧼'); },
    v23os: d => { const pc = (S.pcs || [])[+d.i]; if (!pc || pc.os !== null) return; if (d.v === 'win') { if (S.money < 3790) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(3790), '💸'); return; } S.money -= 3790; Bank2.log('ลิขสิทธิ์ Windows 11', -3790); } UI.close(); fade(() => { tick(60); pc.os = d.v; UI.toast(`ติดตั้ง${d.v === 'win' ? ' Windows 11' : ' Linux'} และไดรเวอร์เรียบร้อย คอมพร้อมใช้งาน`, '💿'); }); },
    v23use: () => { UI.close(); PC.homeUI(); },
  });

  // ----- PCs: need OS, power, a home, a healthy machine -----
  { const _a = PC.addPC.bind(PC); PC.addPC = function (...a) { _a(...a); const p = S.pcs[S.pcs.length - 1]; if (p) p.os = null; }; }
  { const _u = PC.use.bind(PC);
    PC.use = function (v) {
      const pc = this.best();
      if (pc) {
        const why = pc.broken ? 'พาวเวอร์ซัพพลายเสีย ซ่อมในศูนย์ไอที' : pc.infected ? 'เครื่องติดมัลแวร์ ล้างเครื่องในศูนย์ไอที' : pc.os === null ? 'ยังไม่ได้ลงระบบปฏิบัติการ (ศูนย์ไอที แท็บคอมพิวเตอร์)' : !atHome() ? 'ต้องอยู่ที่บ้านถึงจะเปิดคอมได้' : (Power.st().trip || Grid.st().src === 'none') && !count('pc_ups') ? 'ไม่มีไฟฟ้า เปิดเครื่องไม่ได้ (UPS ช่วยได้)' : '';
        if (why) { UI.toast(why, '🖥️'); return; }
      }
      const m = S.money; _u(v);
      if (v === 'game' && has('n_qos')) S.mood = Math.min(100, (S.mood || 50) + 3);
      if (v === 'stream' && S.money > m && (has('n_up') || has('n_nic'))) { const extra = Math.round((S.money - m) * ((has('n_up') ? 0.08 : 0) + (has('n_nic') ? 0.04 : 0))); if (extra) { S.money += extra; Bank2.income('โบนัสสตรีมจากอัปโหลดบูสต์', extra); } }
    }; }
  // monitor / UPS in the bag still count; the PC list in the builder keeps working for old saves (os undefined = already installed)

  // ----- where to find things -----
  for (const kind of ['sec', 'pc']) { const o = ENTRY_KINDS[kind]; ENTRY_KINDS[kind] = (id, shop) => { const e = o(id, shop), b = e.buy; if (b) e.buy = function (q) { const r = b.call(this, q); UI.toast('เก็บในกระเป๋าแล้ว ติดตั้ง/ใช้งานได้ที่แอป 🖥️ ศูนย์ไอที ในมือถือ', '🧰'); return r; }; return e; }; }
  APPS.splice(Math.min(APPS.length, 12), 0, { id: 'itc', i: '🖥️', n: 'ศูนย์ไอที' });
  Phone.apps.itc = () => { setTimeout(() => { Phone.app = null; UI.close(); hub.tab = 0; hubOpen(); }, 0); return ''; };
  if (typeof APP_GROUPS !== 'undefined') APP_GROUPS[2][1].unshift('itc');
  // secshop network technician opens the same hub
  { const p = World.pois.find(x => x.label === 'ช่างวางระบบเครือข่าย'); if (p) p.act = () => ({ icon: '🧑‍🔧', label: 'ศูนย์ไอที: ติดตั้งอุปกรณ์อัตโนมัติ', fn: () => { hub.tab = 1; hubOpen(); } }); }
  V23.IT = { open: hubOpen, autoInstall, ITX, has };
});
