'use strict';
// ---------- v207_contracts: customers send offers that fit what the company really does, and the deal is a signed contract ----------
// Every company type now has its own kind of customer work, like real life:
//   🔁 service contracts (retainers): a data centre rents racks for 6-24 months, an ISP serves an apartment block, IT support looks after a school every month ...
//      the customer pays every month, expects the service level (SLA) all the time, fines a company that fails and cancels after 3 bad months
//   📦 projects: software, installs, orders with a deadline, delivered and paid at the end (30% advance)
// Offers change every day, come from many different customers, can be negotiated, and are signed with the same signature as a cheque.
V23.add('v207_contracts', () => {
  if (typeof Company === 'undefined' || typeof CO_TYPES === 'undefined') return;
  const E = s => (typeof esc === 'function' ? esc(s) : String(s));
  const YD = typeof YEAR_DAYS !== 'undefined' ? YEAR_DAYS : 84, MO = YD / 12;     // a month = 7 game days = one company "month close"
  const rnd = (a, b) => a + Math.random() * (b - a), ri = (a, b) => Math.round(rnd(a, b)), pick = a => a[Math.floor(Math.random() * a.length)];
  const R5 = (n, s = 1000) => Math.round(n / s) * s;

  // ----- new network gear: bigger firewalls and carrier routers (links of 10 Gbps and more need devices that can carry them) -----
  Object.assign(DEV, {
    fw40: { c: 'net', t: 'firewall', n: 'ไฟร์วอลล์ NGFW 40G (ดาต้าเซ็นเตอร์ขนาดกลาง)', i: '🛡️', price: 480000, lan: 16, thr: 40000, w: 180 },
    fw100: { c: 'net', t: 'firewall', n: 'ไฟร์วอลล์ NGFW 100G (ดาต้าเซ็นเตอร์/ISP)', i: '🛡️', price: 1950000, lan: 16, thr: 100000, w: 450 },
    rtc100: { c: 'net', t: 'router', n: 'เราเตอร์ Core/Edge 100G BGP Full Table', i: '📡', price: 2800000, lan: 16, wifi: 0, thr: 100000, w: 600 },
    rtc400: { c: 'net', t: 'router', n: 'เราเตอร์ Carrier-grade 400G (ผู้ให้บริการ)', i: '📡', price: 9500000, lan: 32, wifi: 0, thr: 400000, w: 1500 },
    rtc1t: { c: 'net', t: 'router', n: 'เราเตอร์ Terabit 1.2T (Tier-1 / IX)', i: '📡', price: 28000000, lan: 64, wifi: 0, thr: 1200000, w: 3800 },
  });
  for (const k of ['fw40', 'fw100', 'rtc100', 'rtc400', 'rtc1t']) { ITEMS['sec_' + k] = { n: DEV[k].n, i: DEV[k].i, cat: 'part', sell: Math.round(DEV[k].price * 0.5) }; try { const t = SHOPS.secshop.tabs[0]; if (t && !t.items.includes('sec:' + k)) t.items.push('sec:' + k); } catch (e) { } }

  // ----- customers -----
  const CU = {
    med: ['โรงพยาบาลสุขใจ', 'คลินิกทุ่งทอง', 'ร้านยาใกล้บ้าน', 'ศูนย์สัตว์เลี้ยงภูผา', 'คลินิกทันตกรรมยิ้มสวย', 'โรงพยาบาลส่งเสริมสุขภาพตำบล'],
    edu: ['โรงเรียนบ้านสุขใจ', 'วิทยาลัยชุมชนสุขใจ', 'โรงเรียนอนุบาลสุขใจ', 'โรงเรียนเทศบาลทุ่งทอง', 'ศูนย์ฝึกอาชีพชุมชน', 'โรงเรียนกวดวิชาเก่งคิด'],
    gov: ['เทศบาลตำบลสุขใจ', 'อบต.ภูผาใหม่', 'ที่ว่าการอำเภอสุขใจ', 'สำนักงานเกษตรอำเภอ', 'สถานีตำรวจทุ่งทอง', 'การประปาส่วนภูมิภาคสาขาสุขใจ'],
    fin: ['สหกรณ์การเกษตรสุขใจ', 'ธนาคารสุขใจ สาขาทุ่งทอง', 'กองทุนหมู่บ้านสุขใจ', 'บริษัทประกันภัยสุขใจ', 'ร้านทองเยาวราชทุ่งทอง'],
    shop: ['สุขใจมาร์ท', 'ไฮเปอร์มาร์ทสุขใจ', 'สุขใจพลาซ่า', 'ร้านเกษตรรุ่งเรือง', 'ร้านดอกไม้บ้านมะลิ', 'ร้านเฟอร์นิเจอร์ช่างไม้', 'โชว์รูมรถยนต์สุขใจ', 'ตลาดนัดริมทะเล', 'ร้านเสื้อผ้าแฟชั่นภูผา'],
    hotel: ['โรงแรมสุขใจรีสอร์ต', 'โฮมสเตย์ริมทะเล', 'รีสอร์ตทุ่งทานตะวัน', 'ที่พักสวนทองเมือง', 'ลานกางเต็นท์ภูผา'],
    fac: ['โรงสีข้าวสุขใจ', 'โรงงานผลไม้อบแห้ง', 'โรงน้ำแข็งทุ่งทอง', 'โรงงานน้ำตาลภูผา', 'โกดังสินค้าสุขใจ', 'โรงงานอาหารแช่แข็งริมทะเล'],
    farm: ['ฟาร์มลุงมี', 'ไร่สุขใจอะโกร', 'ฟาร์มไก่ไข่ภูผา', 'สวนผลไม้ทองสุข', 'ฟาร์มปลาริมคลอง', 'กลุ่มวิสาหกิจชุมชนเกษตรอินทรีย์'],
    food: ['ร้านอาหารป้าแดง', 'ร้านอาหารจีนเจ๊กิม', 'ร้านก๋วยเตี๋ยวลุงสมชาย', 'ครัวคุณยาย', 'ร้านซีฟู้ดริมทะเล', 'คาเฟ่ในสวน', 'ศูนย์อาหารตลาดเช้า'],
    log: ['บริษัทค้าส่งสุขใจ', 'ร้านค้าออนไลน์น้องใหม่', 'ผู้ค้าปลีกตลาดกลาง', 'บริษัทวัสดุก่อสร้างภูผา', 'โรงงานเฟอร์นิเจอร์ไม้'],
    tech: ['สตาร์ทอัพสุขใจเทค', 'บริษัทซอฟต์แวร์ภูผา', 'ร้านเกมและอีสปอร์ตทุ่งทอง', 'ผู้ให้บริการอินเทอร์เน็ตท้องถิ่น', 'สำนักพิมพ์สุขใจ', 'สถานีวิทยุชุมชน', 'บริษัทโฆษณาสวนทอง'],
    res: ['หมู่บ้านจัดสรรสุขใจวิลล่า', 'คอนโดสุขใจเพลส', 'อพาร์ตเมนต์ริมคลอง', 'หอพักนักศึกษาทุ่งทอง', 'ชุมชนหมู่บ้านทุ่งทานตะวัน'],
  };
  const CUSTOMER = sec => { const L = []; for (const k of String(sec).split('|')) L.push(...(CU[k] || [])); return pick(L.length ? L : CU.shop); };

  // ----- offer templates: [title, customer sectors, kind, [min,max] term(months)/length(days), [min,max] fee(monthly)/price, requirements, options] -----
  // requirement words: rack:N bw:N(Mbps) srv:N gpu:N olt:N iotkit:N stock:N staff:role:N dev:N lic:key gen ups fire cam car:N kitchen evdc:N sla via options
  const RET = 'ret', PRJ = 'prj';
  const F = {
    dc: [
      ['รับฝากเซิร์ฟเวอร์ 1 ตู้แร็ค 42U (Colocation)', 'tech|shop|fac|fin', RET, [6, 24], [28000, 38000], ['rack:1', 'bw:200', 'ups'], { sla: 99.9, cost: 0.38 }],
      ['รับฝากเซิร์ฟเวอร์ 2 ตู้แร็คติดกัน พร้อมคอนเน็กชันเน็ตสำรอง', 'tech|fin|shop', RET, [12, 36], [62000, 82000], ['rack:2', 'bw:500', 'ups'], { sla: 99.95, cost: 0.4 }],
      ['ห้องเช่าเฉพาะ (Private Cage) 4 ตู้ ระบบกันไฟและดับเพลิง', 'fin|med|gov', RET, [12, 36], [125000, 165000], ['rack:4', 'bw:1000', 'gen', 'ups', 'fire'], { sla: 99.99, cost: 0.42 }],
      ['ที่เก็บข้อมูลสำรอง (Off-site Backup) 50 TB', 'shop|fac|med|edu', RET, [6, 24], [14000, 21000], ['rack:1', 'bw:100'], { sla: 99.5, cost: 0.3 }],
      ['DR Site สำรองระบบให้สถาบันการเงิน (พร้อมใช้ 24 ชม.)', 'fin', RET, [12, 36], [70000, 98000], ['rack:2', 'bw:300', 'gen', 'ups', 'fire'], { sla: 99.99, cost: 0.4, note: 'ต้องพร้อมรับระบบทันทีเมื่อระบบหลักล่ม' }],
      ['โฮสต์ระบบเวชระเบียนและภาพถ่ายรังสี (PACS) ให้โรงพยาบาล', 'med', RET, [12, 36], [88000, 120000], ['rack:2', 'bw:300', 'gen', 'ups', 'fire', 'staff:eng:1'], { sla: 99.99, cost: 0.42, note: 'ข้อมูลผู้ป่วยต้องปลอดภัยตาม PDPA' }],
      ['ฝากระบบบัญชีและ ERP ให้โรงงาน', 'fac|shop', RET, [6, 18], [24000, 36000], ['rack:1', 'bw:100', 'ups'], { sla: 99.9, cost: 0.36 }],
      ['ฝากเว็บไซต์และอีเมลองค์กรให้หน่วยงานรัฐ', 'gov|edu', RET, [12, 24], [22000, 33000], ['rack:1', 'bw:150', 'ups'], { sla: 99.9, cost: 0.35 }],
      ['เก็บภาพกล้องวงจรปิดบนคลาวด์ (200 กล้อง ย้อนหลัง 30 วัน)', 'shop|gov|res', RET, [6, 24], [32000, 46000], ['rack:1', 'bw:400', 'ups'], { sla: 99.5, cost: 0.4 }],
      ['เซิร์ฟเวอร์เกมออนไลน์ ความหน่วงต่ำ', 'tech', RET, [6, 18], [45000, 64000], ['rack:1', 'bw:1000', 'ups'], { sla: 99.9, cost: 0.4 }],
      ['วางอุปกรณ์เครือข่ายเชื่อมต่อตรง (Cross-connect / Peering)', 'tech', RET, [12, 36], [36000, 58000], ['rack:1', 'bw:1000', 'ups'], { sla: 99.95, cost: 0.3 }],
      ['ศูนย์ข้อมูลระบบจัดซื้อจัดจ้างภาครัฐ (ต้องมีใบอนุญาต กสทช.)', 'gov', RET, [12, 36], [95000, 135000], ['rack:2', 'bw:500', 'gen', 'ups', 'fire', 'lic:nbtc'], { sla: 99.99, cost: 0.42 }],
    ],
    host: [
      ['เว็บโฮสติ้งแพ็กเกจองค์กร 50 เว็บไซต์ (ให้บริษัทรีเซลเลอร์)', 'tech|shop', RET, [6, 18], [18000, 28000], ['srv:1', 'bw:100', 'staff:support:1'], { sla: 99.9, cost: 0.4 }],
      ['WordPress จัดการให้ (Managed) สำหรับโรงแรมและร้านค้า 30 เว็บ', 'hotel|shop', RET, [6, 18], [24000, 36000], ['srv:1', 'bw:100', 'staff:support:1'], { sla: 99.9, cost: 0.42 }],
      ['VPS รีเซลเลอร์ 20 เครื่อง', 'tech', RET, [6, 24], [32000, 48000], ['srv:2', 'bw:200', 'staff:sysadmin:1'], { sla: 99.9, cost: 0.4 }],
      ['โฮสต์ร้านค้าออนไลน์ของผู้ขายในตลาดกลาง', 'log|shop', RET, [6, 18], [20000, 32000], ['srv:1', 'bw:200', 'staff:support:1'], { sla: 99.5, cost: 0.38 }],
      ['อีเมลและโดเมนให้โรงเรียน 800 บัญชี', 'edu', RET, [12, 24], [16000, 24000], ['srv:1', 'bw:50', 'staff:support:1'], { sla: 99.5, cost: 0.35 }],
      ['ระบบสตรีมมิ่งวิดีโอการสอน', 'edu|tech', RET, [6, 18], [38000, 56000], ['srv:2', 'bw:500', 'staff:sysadmin:1'], { sla: 99.9, cost: 0.45 }],
      ['ฝากแอปจองคิวและแอปสั่งอาหารของร้านในเมือง', 'food|shop|med', RET, [6, 24], [26000, 40000], ['srv:1', 'bw:100', 'staff:sysadmin:1'], { sla: 99.9, cost: 0.4 }],
      ['โฮสต์ระบบ ERP แบบ SaaS ให้ฟาร์ม 12 แห่ง', 'farm', RET, [12, 24], [30000, 45000], ['srv:2', 'bw:100', 'staff:sysadmin:1'], { sla: 99.9, cost: 0.42 }],
      ['ย้ายเว็บไซต์เก่า 40 เว็บมาโฮสต์ใหม่ (โครงการย้ายระบบ)', 'tech|shop', PRJ, [5, 12], [90000, 160000], ['srv:1', 'staff:sysadmin:1'], { cost: 0.3 }],
    ],
    isp: [
      ['เช่าสายสัญญาณเฉพาะ (Leased Line) 1 Gbps ให้ธุรกิจ', 'shop|fac|fin', RET, [12, 36], [15000, 25000], ['bw:1000', 'olt:1', 'staff:tech:1'], { sla: 99.9, cost: 0.45 }],
      ['อินเทอร์เน็ตไฟเบอร์ทั้งอพาร์ตเมนต์ 120 ห้อง', 'res', RET, [12, 36], [36000, 56000], ['bw:1200', 'olt:1', 'staff:tech:2'], { sla: 99.5, cost: 0.5 }],
      ['เครือข่ายโรงเรียน (WAN) 6 อาคาร + Wi-Fi ทั้งโรงเรียน', 'edu', RET, [12, 36], [28000, 42000], ['bw:600', 'olt:1', 'staff:tech:2'], { sla: 99.5, cost: 0.48 }],
      ['Wi-Fi สาธารณะเทศบาล 40 จุด', 'gov', RET, [12, 36], [42000, 64000], ['bw:800', 'olt:1', 'staff:tech:2'], { sla: 99.5, cost: 0.5 }],
      ['Wi-Fi โรงแรมและรีสอร์ตทั้งโครงการ', 'hotel', RET, [12, 24], [22000, 34000], ['bw:400', 'olt:1', 'staff:tech:1'], { sla: 99.5, cost: 0.45 }],
      ['เน็ตหมู่บ้านทั้งหมู่ (FTTH 200 หลังคาเรือน)', 'res', RET, [24, 60], [62000, 92000], ['bw:2000', 'olt:2', 'staff:tech:2'], { sla: 99, cost: 0.52 }],
      ['วงจรเชื่อมสาขาสหกรณ์ 5 สาขา', 'fin', RET, [12, 36], [34000, 52000], ['bw:500', 'olt:1', 'staff:tech:1'], { sla: 99.9, cost: 0.45 }],
      ['เน็ตโรงงานและโกดัง พร้อมสายสำรอง', 'fac', RET, [12, 36], [26000, 40000], ['bw:800', 'olt:1', 'staff:tech:1'], { sla: 99.9, cost: 0.46 }],
      ['วางเครือข่ายใหม่ให้ชุมชนหมู่บ้านทุ่งทานตะวัน (โครงการเดินสายไฟเบอร์)', 'res|gov', PRJ, [10, 24], [380000, 720000], ['olt:1', 'staff:tech:2'], { cost: 0.55 }],
    ],
    dev: [
      ['ระบบจองคิวออนไลน์ให้โรงพยาบาล', 'med', PRJ, [8, 18], [150000, 260000], ['dev:2'], { cost: 0.18 }],
      ['แอปสั่งอาหารให้ร้านในเมือง', 'food|shop', PRJ, [6, 14], [80000, 140000], ['dev:2'], { cost: 0.18 }],
      ['ระบบบัญชีและสต็อกให้โรงสีข้าว', 'fac', PRJ, [8, 16], [120000, 190000], ['dev:3'], { cost: 0.18 }],
      ['ระบบเรียนออนไลน์ (LMS) ให้โรงเรียน', 'edu', PRJ, [10, 20], [140000, 240000], ['dev:3'], { cost: 0.18 }],
      ['ตลาดซื้อขายผลผลิตเกษตรออนไลน์', 'farm|gov', PRJ, [12, 24], [220000, 380000], ['dev:3'], { cost: 0.2 }],
      ['แอปราคากลางพืชผลสำหรับเกษตรกร', 'gov|farm', PRJ, [6, 12], [90000, 150000], ['dev:2'], { cost: 0.18 }],
      ['ระบบสมาชิกและสะสมแต้มให้ห้างสรรพสินค้า', 'shop', PRJ, [8, 16], [130000, 210000], ['dev:2'], { cost: 0.18 }],
      ['เว็บไซต์ใหม่ + ระบบจองห้องพักให้โรงแรม', 'hotel', PRJ, [6, 12], [70000, 120000], ['dev:1', 'staff:designer:1'], { cost: 0.2 }],
      ['ระบบเก็บค่าน้ำค่าไฟและแจ้งซ่อมให้คอนโด', 'res', PRJ, [8, 16], [110000, 180000], ['dev:2'], { cost: 0.18 }],
      ['ระบบรับชำระเงินและ POS ให้ร้านอาหาร 15 สาขา', 'food|shop', PRJ, [8, 18], [160000, 270000], ['dev:3'], { cost: 0.2 }],
      ['ดูแลและพัฒนาต่อระบบ (Software Maintenance) รายเดือน', 'med|fac|shop|gov', RET, [6, 24], [24000, 46000], ['dev:2'], { sla: 99, cost: 0.4 }],
      ['ทีมโปรแกรมเมอร์ประจำโครงการ (Outsource Dev) 2 คน', 'tech|fin', RET, [6, 18], [78000, 110000], ['dev:2'], { sla: 99, cost: 0.55 }],
    ],
    game: [
      ['พัฒนาเกมมือถือแนวฟาร์มให้ผู้จัดจำหน่าย', 'tech|media', PRJ, [20, 40], [380000, 720000], ['dev:3', 'staff:designer:2'], { cost: 0.25 }],
      ['เกมการศึกษาสำหรับเด็กประถมให้โรงเรียน', 'edu', PRJ, [14, 28], [200000, 360000], ['dev:2', 'staff:designer:1'], { cost: 0.22 }],
      ['เกมโฆษณา (Advergame) แคมเปญให้ห้างสรรพสินค้า', 'shop', PRJ, [10, 20], [150000, 260000], ['dev:2', 'staff:designer:1'], { cost: 0.22 }],
      ['ทำภาพและตัวละคร (Art Outsource) ให้สตูดิโออื่น', 'tech', PRJ, [8, 18], [120000, 210000], ['staff:designer:2'], { cost: 0.2 }],
      ['ดูแลเซิร์ฟเวอร์และอัปเดตเกมรายเดือน (Live Ops)', 'tech', RET, [6, 18], [60000, 96000], ['dev:2', 'staff:qa:1'], { sla: 99, cost: 0.5 }],
    ],
    web: [
      ['เว็บไซต์องค์กรให้โรงงาน', 'fac', PRJ, [5, 10], [45000, 90000], ['dev:1', 'staff:designer:1'], { cost: 0.2 }],
      ['ร้านค้าออนไลน์ให้ร้านเกษตร', 'shop|farm', PRJ, [6, 12], [60000, 110000], ['dev:1'], { cost: 0.2 }],
      ['ดูแลเว็บไซต์และโซเชียลรายเดือน', 'shop|hotel|food', RET, [6, 18], [14000, 26000], ['dev:1'], { sla: 98, cost: 0.4 }],
      ['ทำเว็บและระบบจองให้ร้านอาหาร', 'food', PRJ, [4, 8], [38000, 70000], ['dev:1'], { cost: 0.2 }],
    ],
    data: [
      ['พยากรณ์ยอดขายและสต็อกให้มาร์ท (Demand Forecast)', 'shop', PRJ, [12, 24], [240000, 420000], ['dev:1', 'staff:analyst:1'], { cost: 0.2 }],
      ['โมเดลตรวจโรคพืชจากภาพถ่ายให้เกษตรกร', 'farm|gov', PRJ, [16, 30], [320000, 560000], ['staff:analyst:2'], { cost: 0.22 }],
      ['แดชบอร์ดผู้บริหารให้โรงพยาบาล', 'med', PRJ, [8, 16], [140000, 240000], ['staff:analyst:1'], { cost: 0.2 }],
      ['แชตบอตตอบลูกค้าให้ธนาคาร/สหกรณ์', 'fin', PRJ, [10, 20], [200000, 340000], ['dev:1', 'staff:analyst:1'], { cost: 0.2 }],
      ['วิเคราะห์ข้อมูลรายเดือน (Data Retainer)', 'shop|fin|fac', RET, [6, 18], [48000, 82000], ['staff:analyst:1'], { sla: 99, cost: 0.5 }],
      ['เช่าเครื่อง GPU ฝึกโมเดล (AI Compute)', 'tech', RET, [3, 12], [90000, 150000], ['gpu:1', 'bw:500'], { sla: 99.5, cost: 0.35 }],
    ],
    sup: [
      ['ดูแลระบบไอทีโรงเรียนรายเดือน (MA)', 'edu', RET, [6, 24], [14000, 24000], ['staff:tech:1'], { sla: 98, cost: 0.55 }],
      ['ดูแลระบบไอทีโรงพยาบาล 24 ชม.', 'med', RET, [12, 24], [48000, 78000], ['staff:tech:2'], { sla: 99.5, cost: 0.6 }],
      ['ดูแลคอมพิวเตอร์ 40 เครื่องของสำนักงานเทศบาล', 'gov', RET, [12, 24], [20000, 34000], ['staff:tech:1'], { sla: 98, cost: 0.55 }],
      ['ดูแลระบบ POS และเครือข่ายร้านค้า 8 สาขา', 'shop|food', RET, [6, 24], [22000, 38000], ['staff:tech:1'], { sla: 98, cost: 0.55 }],
      ['ดูแลเครือข่ายโรงแรมและห้องพัก', 'hotel', RET, [6, 18], [16000, 28000], ['staff:tech:1'], { sla: 98, cost: 0.55 }],
      ['ติดตั้งคอมพิวเตอร์ใหม่ 30 เครื่อง + เครือข่ายให้สำนักงาน', 'fin|gov|fac', PRJ, [4, 9], [110000, 200000], ['staff:tech:2'], { cost: 0.55 }],
      ['ย้ายสำนักงานและเดินระบบเครือข่ายใหม่', 'shop|fac|fin', PRJ, [3, 8], [60000, 120000], ['staff:tech:2'], { cost: 0.5 }],
    ],
    cyber: [
      ['ทดสอบเจาะระบบ (Penetration Test) ให้ธนาคาร/สหกรณ์', 'fin', PRJ, [6, 12], [160000, 280000], ['staff:sect:2'], { cost: 0.3 }],
      ['ตรวจประเมินความพร้อม PDPA ให้โรงพยาบาล', 'med', PRJ, [8, 16], [120000, 210000], ['staff:sect:1'], { cost: 0.3 }],
      ['เฝ้าระวังภัยไซเบอร์ 24 ชม. (SOC Retainer)', 'fin|med|fac', RET, [6, 24], [68000, 110000], ['staff:sect:2'], { sla: 99.5, cost: 0.55 }],
      ['อบรมพนักงานรู้ทันฟิชชิ่งให้บริษัทและโรงเรียน', 'edu|shop|gov', PRJ, [3, 6], [38000, 72000], ['staff:sect:1'], { cost: 0.25 }],
      ['ติดตั้งและดูแลไฟร์วอลล์ให้ร้านค้า', 'shop|fac', RET, [6, 18], [18000, 30000], ['staff:sect:1'], { sla: 99, cost: 0.5 }],
    ],
    shop: [
      ['ขายโน้ตบุ๊ก 20 เครื่องให้โรงเรียน', 'edu', PRJ, [3, 7], [360000, 520000], ['stock:20'], { cost: 0.8 }],
      ['ขายคอมพิวเตอร์ตั้งโต๊ะ 30 เครื่องให้สำนักงานเทศบาล', 'gov', PRJ, [4, 9], [540000, 780000], ['stock:30'], { cost: 0.82 }],
      ['ขายเครื่อง POS + เครื่องพิมพ์ใบเสร็จ 12 ชุดให้ร้านค้า', 'shop|food', PRJ, [3, 6], [240000, 360000], ['stock:12'], { cost: 0.78 }],
      ['ขายกล้องวงจรปิดและเครื่องบันทึกให้โรงงาน 40 ชุด', 'fac', PRJ, [4, 8], [300000, 460000], ['stock:40'], { cost: 0.8 }],
      ['ขายเครื่องพิมพ์และหมึก ส่งประจำรายเดือน', 'edu|gov|med', RET, [6, 18], [18000, 32000], ['stock:10'], { sla: 98, cost: 0.75 }],
    ],
    ecom: [
      ['เปิดร้านบนแพลตฟอร์มให้ผู้ขายรายย่อย 300 ร้าน (ค่าสมาชิกรายเดือน)', 'log|farm|shop', RET, [6, 24], [42000, 70000], ['dev:2', 'staff:support:2'], { sla: 99, cost: 0.45 }],
      ['ระบบชำระเงินและส่งของให้ร้านค้าตลาดนัด', 'shop|log', PRJ, [10, 20], [180000, 300000], ['dev:2'], { cost: 0.25 }],
      ['แคมเปญลดราคา 11.11 ร่วมกับแบรนด์ในเมือง', 'shop', PRJ, [5, 10], [120000, 220000], ['dev:1', 'staff:support:2'], { cost: 0.3 }],
    ],
    fin: [
      ['รับชำระเงินให้ร้านค้า 200 ร้าน (ส่วนแบ่งค่าธรรมเนียมรายเดือน)', 'shop|food', RET, [12, 36], [68000, 110000], ['dev:3', 'staff:sect:1'], { sla: 99.9, cost: 0.4 }],
      ['ระบบโอนเงินและกระเป๋าเงินให้สหกรณ์', 'fin', PRJ, [16, 32], [420000, 720000], ['dev:3', 'staff:sect:1'], { cost: 0.3 }],
      ['ระบบเก็บค่าเทอมออนไลน์ให้โรงเรียน', 'edu', PRJ, [10, 20], [180000, 300000], ['dev:2', 'staff:sect:1'], { cost: 0.25 }],
    ],
    edtech: [
      ['คอร์สออนไลน์ฝึกอบรมพนักงานให้บริษัท', 'shop|fac|fin', PRJ, [8, 18], [80000, 150000], ['staff:teacher:2'], { cost: 0.3 }],
      ['ติวเตอร์ออนไลน์รายเดือนให้โรงเรียนกวดวิชา', 'edu', RET, [6, 18], [28000, 46000], ['staff:teacher:2'], { sla: 98, cost: 0.55 }],
      ['ผลิตสื่อการสอนวิดีโอให้ศูนย์ฝึกอาชีพ', 'edu|gov', PRJ, [8, 16], [70000, 130000], ['staff:teacher:1', 'staff:designer:1'], { cost: 0.3 }],
    ],
    iot: [
      ['ติดเซนเซอร์ฟาร์มอัจฉริยะ 40 จุด + แดชบอร์ด', 'farm', PRJ, [8, 16], [160000, 280000], ['iotkit:2', 'staff:eng:1'], { cost: 0.5 }],
      ['เฝ้าระวังน้ำและดินรายเดือน (IoT Monitoring)', 'farm|gov', RET, [6, 24], [22000, 38000], ['iotkit:2', 'dev:1'], { sla: 99, cost: 0.45 }],
      ['ระบบควบคุมโรงเรือนไก่ไข่อัตโนมัติ', 'farm', PRJ, [8, 14], [120000, 210000], ['iotkit:1', 'staff:installer:1'], { cost: 0.5 }],
    ],
    bpo: [
      ['คอลเซ็นเตอร์รับสายลูกค้า 10 ที่นั่งให้ห้างสรรพสินค้า', 'shop', RET, [6, 24], [48000, 78000], ['staff:agent:5'], { sla: 98, cost: 0.65 }],
      ['ศูนย์ติดตามพัสดุและแจ้งเตือนลูกค้า', 'log', RET, [6, 18], [36000, 58000], ['staff:agent:4'], { sla: 98, cost: 0.65 }],
      ['คีย์ข้อมูลเอกสาร 50,000 หน้าให้เทศบาล (โครงการ)', 'gov', PRJ, [8, 16], [90000, 160000], ['staff:agent:4'], { cost: 0.6 }],
    ],
    agency: [
      ['ดูแลโซเชียลและโฆษณาออนไลน์ให้ร้านค้ารายเดือน', 'shop|food|hotel', RET, [6, 18], [18000, 34000], ['staff:designer:1'], { sla: 98, cost: 0.5 }],
      ['แคมเปญเปิดตัวสินค้าใหม่ให้โรงงาน', 'fac', PRJ, [8, 16], [120000, 220000], ['staff:designer:2', 'staff:sales:1'], { cost: 0.45 }],
      ['ถ่ายภาพและทำวิดีโอโปรโมตให้โรงแรม', 'hotel', PRJ, [4, 9], [60000, 110000], ['staff:designer:1'], { cost: 0.4 }],
    ],
    solar: [
      ['โซลาร์บ้านลูกค้า 5 kWp', 'res|shop', PRJ, [2, 4], [140000, 190000], ['staff:installer:1'], { cost: 0.62 }],
      ['โซลาร์หลังคาโรงงาน 100 kWp', 'fac', PRJ, [8, 14], [2200000, 3000000], ['staff:eng:1', 'staff:installer:3'], { cost: 0.7 }],
      ['เครื่องชาร์จ EV 22 kW ให้คอนโด 4 จุด', 'res', PRJ, [3, 6], [220000, 310000], ['staff:installer:2'], { cost: 0.55 }],
      ['โซลาร์ปั๊มน้ำให้ไร่และฟาร์ม', 'farm', PRJ, [3, 7], [160000, 260000], ['staff:installer:2'], { cost: 0.6 }],
      ['ดูแลและล้างแผงโซลาร์รายเดือน (O&M)', 'fac|hotel|res', RET, [12, 36], [16000, 30000], ['staff:installer:1'], { sla: 98, cost: 0.55 }],
    ],
    smarti: [
      ['ติดตั้งสมาร์ตโฮมให้บ้านจัดสรร 10 หลัง', 'res', PRJ, [8, 16], [240000, 420000], ['staff:installer:2'], { cost: 0.55 }],
      ['ระบบควบคุมแอร์และไฟอัตโนมัติให้โรงแรม', 'hotel', PRJ, [8, 16], [200000, 340000], ['staff:installer:2'], { cost: 0.5 }],
      ['ดูแลระบบสมาร์ตโฮมรายเดือน', 'res|hotel', RET, [6, 24], [14000, 26000], ['staff:installer:1'], { sla: 98, cost: 0.55 }],
    ],
    ev: [
      ['สัญญาชาร์จรถตู้แท็กซี่ 15 คัน (ส่วนลดตามปริมาณ)', 'log', RET, [6, 24], [42000, 68000], ['evdc:1'], { sla: 99, cost: 0.7 }],
      ['สัญญาชาร์จรถขนส่งโรงงาน 8 คัน เวลากลางคืน', 'fac', RET, [6, 24], [34000, 56000], ['evdc:1'], { sla: 99, cost: 0.7 }],
      ['สัญญาจอดชาร์จรายเดือนให้โรงแรม', 'hotel', RET, [6, 18], [18000, 30000], ['evdc:1'], { sla: 98, cost: 0.65 }],
    ],
    log: [
      ['สายส่งสินค้าประจำให้ค้าส่งในตลาด (สัปดาห์ละ 5 เที่ยว)', 'log|shop', RET, [6, 18], [36000, 58000], ['car:1', 'staff:driver:1'], { sla: 98, cost: 0.62 }],
      ['ส่งวัตถุดิบเข้าโรงงานรายวัน', 'fac', RET, [6, 24], [52000, 84000], ['car:2', 'staff:driver:2'], { sla: 98, cost: 0.62 }],
      ['ขนส่งผลผลิตเกษตรไปตลาดกลาง (ตู้เย็น)', 'farm', RET, [3, 12], [30000, 52000], ['car:1', 'staff:driver:1'], { sla: 98, cost: 0.6 }],
      ['ส่งพัสดุให้ร้านค้าออนไลน์ 300 ชิ้นต่อวัน', 'log', RET, [6, 18], [46000, 76000], ['car:2', 'staff:driver:2'], { sla: 98, cost: 0.62 }],
      ['ขนย้ายสินค้าก่อสร้างโครงการหมู่บ้านใหม่', 'res|fac', PRJ, [4, 9], [90000, 170000], ['car:2', 'staff:driver:2'], { cost: 0.6 }],
      ['ขนย้ายบ้านและสำนักงาน', 'res|shop', PRJ, [1, 3], [14000, 36000], ['car:1', 'staff:driver:1'], { cost: 0.55 }],
    ],
    food: [
      ['ส่งผลไม้อบแห้งให้ห้างสรรพสินค้า 400 กก. ต่อเดือน', 'shop', RET, [6, 18], [64000, 98000], ['staff:qa:1', 'lic:fda'], { sla: 98, cost: 0.62 }],
      ['รับแปรรูปผลผลิตของสหกรณ์เกษตรกร', 'farm|fin', RET, [6, 18], [54000, 86000], ['staff:qa:1', 'lic:fda'], { sla: 98, cost: 0.6 }],
      ['ผลิตอาหารแช่แข็งส่งโรงเรียนและโรงพยาบาล', 'edu|med', RET, [6, 24], [58000, 92000], ['staff:qa:1', 'lic:fda'], { sla: 98, cost: 0.62 }],
      ['ผลิตสินค้า OEM ติดแบรนด์ร้านค้า (ล็อตแรก)', 'shop', PRJ, [10, 20], [260000, 430000], ['staff:qa:1', 'lic:fda'], { cost: 0.6 }],
    ],
    cater: [
      ['จัดเลี้ยงอาหารกลางวันพนักงานโรงงาน 150 คนต่อวัน', 'fac', RET, [6, 24], [58000, 92000], ['kitchen', 'staff:chef:1'], { sla: 98, cost: 0.62 }],
      ['อาหารกลางวันโรงเรียน 300 คน', 'edu', RET, [6, 24], [52000, 84000], ['kitchen', 'staff:chef:1'], { sla: 98, cost: 0.64 }],
      ['จัดเลี้ยงงานแต่งงานและงานบุญ', 'res|hotel', PRJ, [1, 3], [28000, 85000], ['kitchen', 'staff:chef:1'], { cost: 0.6 }],
      ['อาหารกล่องประชุมสัมมนาให้เทศบาล', 'gov', PRJ, [1, 3], [18000, 45000], ['kitchen'], { cost: 0.6 }],
    ],
    cafe: [
      ['กาแฟและเบเกอรี่ประจำสำนักงาน (ส่งทุกเช้า)', 'fin|gov|tech', RET, [3, 12], [14000, 26000], ['kitchen'], { sla: 97, cost: 0.55 }],
      ['เครื่องดื่มและขนมให้งานประชุมโรงแรม', 'hotel', PRJ, [1, 3], [14000, 36000], ['kitchen'], { cost: 0.55 }],
    ],
    bake: [
      ['ส่งขนมปังและเค้กให้โรงแรมทุกเช้า', 'hotel|shop', RET, [3, 12], [16000, 30000], ['kitchen'], { sla: 97, cost: 0.55 }],
      ['เค้กวันเกิดและกล่องขนมงานบริษัท', 'fin|fac', PRJ, [1, 2], [12000, 30000], ['kitchen'], { cost: 0.5 }],
    ],
    noodle: [
      ['ส่งอาหารตามสั่งให้โรงงาน 80 คนต่อวัน', 'fac', RET, [3, 12], [28000, 46000], ['kitchen'], { sla: 97, cost: 0.6 }],
      ['อาหารเลี้ยงงานกีฬาสีโรงเรียน', 'edu', PRJ, [1, 2], [9000, 22000], ['kitchen'], { cost: 0.55 }],
    ],
    tea: [
      ['เครื่องดื่มบูธงานตลาดนัดและเทศกาล', 'shop|gov', PRJ, [1, 3], [12000, 30000], [], { cost: 0.5 }],
      ['ส่งชานมไข่มุกประจำให้ร้านเกมและหอพัก', 'tech|res', RET, [3, 12], [12000, 22000], [], { sla: 97, cost: 0.5 }],
    ],
    repair: [
      ['ซ่อมคอมพิวเตอร์และมือถือพนักงานบริษัท (สัญญารายเดือน)', 'fin|fac|gov', RET, [6, 18], [14000, 26000], ['staff:tech:1'], { sla: 98, cost: 0.5 }],
      ['ซ่อมเครื่อง POS และเครื่องพิมพ์ให้ร้านค้า', 'shop|food', RET, [6, 18], [12000, 22000], ['staff:tech:1'], { sla: 98, cost: 0.5 }],
    ],
  };
  // which families each company type draws offers from
  const FAMILY = { dc: ['dc'], host: ['host'], isp: ['isp'], it: ['dev', 'web', 'data'], app: ['dev', 'game'], appdev: ['dev'], webag: ['web', 'dev'], game: ['game'], data: ['data'], ai: ['data'], cyber: ['cyber'], itsupport: ['sup'], itmaint: ['sup'], itshop: ['shop'], ecom: ['ecom', 'web'], fintech: ['fin', 'dev'], edtech: ['edtech'], iot: ['iot'], bpo: ['bpo'], agency: ['agency', 'web'], solar: ['solar'], smarti: ['smarti'], ev: ['ev'], logistics: ['log'], courier: ['log'], moving: ['log'], food: ['food'], catering: ['cater'], cafe: ['cafe'], bakery: ['bake'], noodle: ['noodle'], tea: ['tea'], repair: ['repair'] };
  // how much of the old "walk-in" daily income stays (the rest now comes from signed contracts)
  const BASE = { dc: 0.35, host: 0.4, isp: 0.5, it: 0.4, app: 0.35, appdev: 0.35, game: 0.5, webag: 0.4, data: 0.4, ai: 0.4, cyber: 0.35, itsupport: 0.4, itmaint: 0.4, itshop: 0.8, ecom: 0.6, fintech: 0.5, edtech: 0.6, iot: 0.5, bpo: 0.4, agency: 0.4, solar: 0.5, smarti: 0.5, logistics: 0.5, courier: 0.6, moving: 0.6, food: 0.7, catering: 0.6 };
  for (const k in BASE) { const T = CO_TYPES[k]; if (T && !T.__v207) { const r0 = T.rev; T.rev = c => Math.round(r0(c) * BASE[k]); T.__v207 = 1; } }

  // ----- requirements -----
  const ROLE_N = r => (typeof ROLES !== 'undefined' && ROLES[r] ? ROLES[r].n : r);
  const parse = s => { const p = s.split(':'); if (p[0] === 'staff') return { k: 'staff', r: p[1], n: +p[2] || 1 }; if (['gen', 'ups', 'fire', 'cam', 'kitchen'].includes(p[0])) return { k: p[0], n: 1 }; if (p[0] === 'lic') return { k: 'lic', r: p[1], n: 1 }; return { k: p[0], n: +p[1] || 1 }; };
  const siteDev = c => { try { return Sec.site('co:' + c.id).dev; } catch (e) { return []; } };
  const racksOf = c => siteDev(c).filter(d => DEV[d.k].t === 'rack' && (DEV[d.k].u || 0) >= 42).length;
  const heavy = c => { try { return G.cars.filter(o => (typeof HEAVY !== 'undefined' && HEAVY.includes(o.d.type)) || ['truckflat', 'pickup', 'van', 'deliveryflat', 'oldtruck', 'ev_pickup', 'ev_van'].includes(o.d.type)).length; } catch (e) { return 0; } };
  const st = c => { const x = c.ct = c.ct || { offers: { day: -99, list: [] }, active: [], done: [], seq: 0 }; return x; };
  // what the running contracts have already reserved (exclusive resources)
  const reserved = (c, skip) => { const u = { rack: 0, bw: 0, srv: 0, gpu: 0, olt: 0, iotkit: 0, stock: 0, evdc: 0 }; for (const d of st(c).active) if (d !== skip && d.kind === RET) for (const r of d.reqs) if (u[r.k] != null) u[r.k] += r.n; return u; };
  const have = (c, r) => {
    switch (r.k) {
      case 'rack': return racksOf(c); case 'srv': return c.eq.srv || 0; case 'gpu': return c.eq.gpu || 0; case 'olt': return c.eq.olt || 0; case 'iotkit': return c.eq.iotkit || 0; case 'evdc': return (c.eq.evdc || 0) + (c.eq.evac || 0);
      case 'bw': return c.net && BIZ_NET[c.net] && !c.netWait ? BIZ_NET[c.net].down : (c.net && BIZ_NET[c.net] ? BIZ_NET[c.net].down : 0);
      case 'stock': return (c.eq.itstock || 0) * 40 - (c.sold || 0);
      case 'staff': return c.staff.filter(s => s.r === r.r).length + (r.r === 'eng' && window.Gov24 && Gov24.has('lic_eng') ? 1 : 0);
      case 'dev': return c.staff.filter(s => s.r === 'dev').length;
      case 'lic': return c.lic[r.r] ? 1 : 0; case 'gen': return c.eq.gen || 0; case 'kitchen': return c.eq.kitchen || 0;
      case 'ups': return siteDev(c).filter(d => DEV[d.k].t === 'ups').length; case 'fire': return siteDev(c).filter(d => DEV[d.k].t === 'fire').length; case 'cam': return siteDev(c).filter(d => DEV[d.k].t === 'cam').length;
      case 'car': return heavy(c);
    }
    return 0;
  };
  const LBL = { rack: 'ตู้แร็คเต็ม 42U ว่าง', bw: 'แบนด์วิดท์อินเทอร์เน็ตว่าง (Mbps)', srv: 'เซิร์ฟเวอร์ว่าง', gpu: 'เซิร์ฟเวอร์ GPU ว่าง', olt: 'ชุดอุปกรณ์ไฟเบอร์ (OLT) ว่าง', iotkit: 'ชุดเซนเซอร์ IoT ว่าง', stock: 'สต็อกสินค้าพร้อมขาย (ชิ้น)', evdc: 'เครื่องชาร์จ EV', dev: 'โปรแกรมเมอร์', gen: 'เครื่องกำเนิดไฟฟ้าสำรอง', ups: 'UPS สำรองไฟ', fire: 'ระบบดับเพลิง FM-200', cam: 'กล้องวงจรปิด', kitchen: 'ครัวมาตรฐาน', car: 'รถบรรทุก/กระบะ' };
  const reqLine = (c, r, skip) => {
    const res = reserved(c, skip), h = have(c, r), free = h - (res[r.k] || 0); let need = r.n, ok, txt;
    if (r.k === 'staff') { ok = h >= need; txt = `${ROLE_N(r.r)} ${h}/${need} คน`; }
    else if (r.k === 'lic') { ok = !!h; txt = (typeof CO_LIC !== 'undefined' && CO_LIC[r.r] ? CO_LIC[r.r].n : r.r); }
    else if (['gen', 'ups', 'fire', 'cam', 'kitchen'].includes(r.k)) { ok = h >= 1; txt = LBL[r.k]; }
    else if (r.k === 'dev') { ok = h >= need; txt = `${LBL.dev} ${h}/${need} คน`; }
    else if (r.k === 'car') { ok = h >= need; txt = `${LBL.car} ${h}/${need} คัน`; }
    else { ok = free >= need; txt = `${LBL[r.k] || r.k} ${Math.max(0, free)}/${need}`; }
    return [ok, txt];
  };
  const reqAll = (c, reqs, skip) => reqs.map(r => reqLine(c, r, skip));

  // ----- offers -----
  const mkOffer = (c, t) => {
    const [title, sec, kind, [a, b], [f1, f2], req, o] = t; const prem = 0.9 + (c.rep || 30) / 500 + rnd(-0.05, 0.1);
    const x = st(c); const off = { id: ++x.seq, title, cust: CUSTOMER(sec), kind, reqs: req.map(parse), sla: (o && o.sla) || 0, cost: (o && o.cost) || 0.5, note: (o && o.note) || '', exp: S.day + ri(4, 8), fam: null };
    const v = R5(rnd(f1, f2) * prem, f2 > 100000 ? 5000 : 1000);
    if (kind === RET) { off.term = ri(a, b); off.fee = v; off.dep = 1; off.value = v * off.term; }
    else { off.len = ri(a, b); off.price = v; off.adv = 0.3; off.value = v; }
    return off;
  };
  const pool = c => { const L = []; for (const f of FAMILY[c.type] || []) for (const t of F[f] || []) L.push(t); return L; };
  const refresh = c => {
    const x = st(c); x.offers.list = x.offers.list.filter(o => o.exp >= S.day);
    if (x.offers.day === S.day) return x.offers.list; x.offers.day = S.day;
    const P = pool(c); if (!P.length) return x.offers.list;
    const want = Math.min(8, 4 + Math.floor((c.rep || 30) / 30)); let guard = 0;
    while (x.offers.list.length < want && guard++ < 40) { const t = pick(P), same = x.offers.list.filter(o => o.title === t[0]).length; if (same >= 1 && P.length > 3) continue; x.offers.list.push(mkOffer(c, t)); }
    return x.offers.list;
  };

  // ----- signing / accepting -----
  const doc = (c, o) => {
    const T = [['ผู้รับจ้าง', c.name]];
    if (o.kind === RET) T.push(['ประเภท', 'สัญญาให้บริการรายเดือน'], ['ระยะเวลา', `${o.term} เดือน (${RD(S.day)} – ${RD(S.day + Math.round(o.term * MO))})`], ['ค่าบริการ', `${baht(o.fee)} ต่อเดือน (ชำระล่วงหน้างวดแรก)`], ['ระดับบริการ (SLA)', o.sla ? o.sla + '% ต่อเดือน' : 'ตามที่ตกลง'], ['ผิดสัญญา', 'ผิด SLA 1 เดือน ลดค่าบริการ · ติดกัน 3 เดือนลูกค้ายกเลิกและปรับ 2 เดือน'], ['เลิกสัญญาก่อนกำหนด', `ผู้รับจ้างเป็นฝ่ายเลิก ชำระค่าปรับ 2 เดือน (${baht(o.fee * 2)})`]);
    else T.push(['ประเภท', 'สัญญาจ้างทำงานโครงการ'], ['กำหนดส่งมอบ', `${o.len} วัน (ภายใน${RD(S.day + o.len)})`], ['ค่าจ้าง', `${baht(o.price)} (มัดจำ 30% ${baht(Math.round(o.price * 0.3))} เมื่อลงนาม)`], ['ส่งช้า', 'ปรับ 5% ต่อวัน สูงสุด 30% · เกิน 7 วัน ลูกค้ายกเลิก']);
    return T;
  };
  const activate = (c, o) => {
    const x = st(c), d = Object.assign({}, o, { no: 'CT-' + String(S.day).padStart(4, '0') + '-' + String(o.id).padStart(3, '0'), start: S.day, bad: 0, streak: 0, wk: 0, paid: 0 });
    if (o.kind === RET) { d.end = S.day + Math.round(o.term * MO); d.prepaid = 1; c.cash += o.fee; Company.book(c, o.fee, Math.round(o.fee * o.cost)); c.cash -= Math.round(o.fee * o.cost); d.paid = o.fee; }
    else { d.due = S.day + o.len; const adv = Math.round(o.price * 0.3); c.cash += adv; Company.book(c, adv, 0); d.paid = adv; }
    x.active.push(d); x.offers.list = x.offers.list.filter(q => q.id !== o.id);
    Phone.msg(c.name, `ลงนามสัญญา ${d.no} กับ ${o.cust}: ${o.title} ${o.kind === RET ? `${o.term} เดือน ค่าบริการ ${baht(o.fee)}/เดือน รับงวดแรกล่วงหน้าแล้ว` : `ส่งมอบภายใน${RD(d.due)} มัดจำ ${baht(d.paid)}`}`);
    UI.toast(`✍️ ลงนามสัญญากับ ${o.cust} แล้ว`, '📑');
  };
  const sign = (c, o) => {
    const bad = reqAll(c, o.reqs).filter(r => !r[0]);
    if (bad.length) { UI.toast('ยังรับสัญญานี้ไม่ได้: ' + bad.map(r => r[1]).join(' · '), '📑'); return; }
    if (c.st !== 'open') { UI.toast('บริษัทต้องเปิดดำเนินการก่อนจึงรับสัญญาได้', '📑'); return; }
    if (st(c).active.length >= 10) { UI.toast('รับสัญญาพร้อมกันได้ไม่เกิน 10 ฉบับ', '📑'); return; }
    const back = () => { try { if (window.Slip49 && Slip49.back) Slip49.back(); } catch (e) { } };
    if (window.Slip49 && Slip49.sign) Slip49.sign({ kind: 'contract', no: 'CT-' + o.id, title: o.title, payee: o.cust, amt: o.value, date: S.day, memo: o.title, t: S.time, terms: doc(c, o) }, () => { back(); activate(c, o); try { UI.renderBody(); } catch (e) { } }, () => back());
    else activate(c, o);
  };
  UI.H.ctsign = d => { const c = Company.get(d.v), o = c && st(c).offers.list.find(q => q.id == d.i); if (o) sign(c, o); };
  UI.H.ctneg = d => {
    const c = Company.get(d.v), x = c && st(c), o = x && x.offers.list.find(q => q.id == d.i); if (!o || o.neg) return; o.neg = 1;
    if (Math.random() < 0.35 + (c.rep || 30) / 250) { if (o.kind === RET) { o.fee = R5(o.fee * 1.1); o.value = o.fee * o.term; } else { o.price = R5(o.price * 1.1); o.value = o.price; } UI.toast(`${o.cust} ตกลงขึ้นราคา 10%`, '🤝'); }
    else { x.offers.list = x.offers.list.filter(q => q !== o); Phone.msg(o.cust, `ขอบคุณที่เสนอราคา แต่ขอยกเลิกข้อเสนอ "${o.title}" เนื่องจากราคาสูงเกินงบ`); UI.toast(`${o.cust} ถอนข้อเสนอ (ต่อรองไม่สำเร็จ)`, '📉'); }
  };
  UI.H.ctend = d => {
    const c = Company.get(d.v), x = c && st(c), k = x && x.active.find(q => q.id == d.i); if (!k) return;
    const pen = k.kind === RET ? k.fee * 2 : Math.round(k.price * 0.15);
    if (c.cash < pen) { UI.toast(`เงินบริษัทไม่พอจ่ายค่าปรับเลิกสัญญา ${baht(pen)}`, '💸'); return; }
    c.cash -= pen; Company.book(c, 0, pen); c.rep = Math.max(0, c.rep - 8); x.active = x.active.filter(q => q !== k); x.done.unshift(`${RD(S.day)} เลิกสัญญา ${k.cust} · ${k.title} (ปรับ ${baht(pen)})`); x.done.length = Math.min(8, x.done.length);
    Phone.msg(k.cust, `ได้รับแจ้งเลิกสัญญา ${k.no} ก่อนกำหนด คิดค่าปรับ ${baht(pen)}`); UI.toast(`เลิกสัญญาแล้ว จ่ายค่าปรับ ${baht(pen)}`, '📑');
  };
  UI.H.ctdone = d => {
    const c = Company.get(d.v), x = c && st(c), k = x && x.active.find(q => q.id == d.i); if (!k || k.kind !== PRJ) return;
    const bad = reqAll(c, k.reqs, k).filter(r => !r[0]).map(r => r[1]); if (S.day < k.start + Math.ceil(k.len * 0.6)) bad.push(`งานยังไม่เสร็จ (ต้องใช้อย่างน้อย ${Math.ceil(k.len * 0.6)} วัน)`);
    if (bad.length) { UI.toast('ลูกค้ายังไม่รับงาน: ' + bad.join(' · '), '📑'); return; }
    const late = Math.max(0, S.day - k.due), fine = Math.round(k.price * Math.min(0.3, late * 0.05)), rest = k.price - k.paid, cost = Math.round(k.price * k.cost);
    const stk = k.reqs.find(r => r.k === 'stock'); if (stk) c.sold = (c.sold || 0) + stk.n;
    c.cash += rest - fine - cost; Company.book(c, rest, fine + cost); c.rep = Math.min(100, c.rep + 4 - late); x.active = x.active.filter(q => q !== k);
    x.done.unshift(`${RD(S.day)} ส่งมอบ ${k.cust} · ${k.title} รับ ${baht(k.price - fine)}`); x.done.length = Math.min(8, x.done.length);
    Phone.msg(c.name, `ส่งมอบ "${k.title}" ให้ ${k.cust} รับเงินส่วนที่เหลือ ${baht(rest)}${fine ? ` หักค่าปรับส่งช้า ${baht(fine)}` : ''} ต้นทุน ${baht(cost)}`);
  };

  // ----- days and months -----
  const opsFail = (c, k) => { const f = []; if (c.st !== 'open') f.push('บริษัทไม่ได้เปิดดำเนินการ'); try { if (Company.dark(c.id)) f.push('ไฟดับ ไม่มีไฟสำรอง'); } catch (e) { } try { const ck = Company.checks(c).filter(x => !x[0]); if (ck.length) f.push('บริษัทหยุดดำเนินการ: ' + ck[0][1]); } catch (e) { } for (const [ok, t] of reqAll(c, k.reqs, k)) if (!ok) f.push(t); return f; };
  const day = () => {
    for (const c of Company.list()) {
      if (!['setup', 'open'].includes(c.st)) continue; const x = st(c);
      for (const k of x.active.slice()) {
        if (k.kind === RET) {
          if (opsFail(c, k).length) k.bad = Math.min(7, k.bad + 1);
          if (S.day >= k.end) { x.active = x.active.filter(q => q !== k); c.rep = Math.min(100, c.rep + 3); x.done.unshift(`${RD(S.day)} สัญญา ${k.cust} ครบกำหนด · ${k.title}`); x.done.length = Math.min(8, x.done.length); Phone.msg(k.cust, `สัญญา ${k.no} ครบ ${k.term} เดือนแล้ว ขอบคุณที่ให้บริการ ต้องการต่อสัญญาไหม ดูข้อเสนอต่อสัญญาในหน้าบริษัท`); const o = Object.assign({}, k, { id: ++x.seq, exp: S.day + 10, renew: 1, fee: R5(k.fee * 1.05), neg: 0 }); o.value = o.fee * o.term; delete o.start; delete o.end; x.offers.list.unshift(o); }
        } else if (S.day > k.due + 7) { x.active = x.active.filter(q => q !== k); const back = k.paid, pen = Math.round(k.price * 0.1); c.cash -= back + pen; Company.book(c, 0, back + pen); c.rep = Math.max(0, c.rep - 12); x.done.unshift(`${RD(S.day)} ลูกค้ายกเลิก ${k.cust} · ${k.title} (ส่งช้าเกิน 7 วัน)`); x.done.length = Math.min(8, x.done.length); Phone.msg(k.cust, `ยกเลิกสัญญา ${k.no} เพราะส่งงานช้าเกิน 7 วัน เรียกคืนเงินมัดจำและค่าปรับรวม ${baht(back + pen)}`, false); }
        else if (S.day === k.due + 1) Phone.msg(k.cust, `งาน "${k.title}" เลยกำหนดส่งแล้ว ค่าปรับ 5% ต่อวัน`, true);
      }
      if (c.st === 'open') refresh(c);
    }
  };
  const week = () => {
    for (const c of Company.list()) {
      if (c.st !== 'open') continue; const x = st(c);
      for (const k of x.active.slice()) {
        if (k.kind !== RET) continue;
        k.wk++; let pay = k.fee, why = '';
        if (k.bad === 0) { k.streak = 0; c.rep = Math.min(100, c.rep + 1); } else { k.streak++; pay = Math.round(k.fee * (k.bad <= 1 ? 0.85 : 0.5)); c.rep = Math.max(0, c.rep - 3); why = ` · ผิด SLA ${k.bad} วันในเดือนนี้ ถูกลดค่าบริการเหลือ ${baht(pay)}`; }
        const cost = Math.round(k.fee * k.cost);
        if (k.prepaid) { k.prepaid = 0; pay = 0; why = why ? why : ' · (งวดแรกชำระล่วงหน้าแล้ว)'; }
        c.cash += pay - cost; Company.book(c, pay, cost); k.paid += pay;
        Phone.msg(k.cust, `เดือนที่ ${k.wk}/${k.term} ของสัญญา ${k.no}: ${pay ? 'ชำระ ' + baht(pay) : 'ไม่มีงวดชำระ'}${why}`, true);
        k.bad = 0;
        if (k.streak >= 3) { const pen = k.fee * 2; c.cash -= pen; Company.book(c, 0, pen); c.rep = Math.max(0, c.rep - 15); x.active = x.active.filter(q => q !== k); x.done.unshift(`${RD(S.day)} ลูกค้ายกเลิก ${k.cust} · ${k.title} (ผิด SLA 3 เดือนติด ปรับ ${baht(pen)})`); x.done.length = Math.min(8, x.done.length); Phone.msg(k.cust, `ยกเลิกสัญญา ${k.no} เพราะผิดระดับบริการ 3 เดือนติดต่อกัน เรียกค่าปรับ ${baht(pen)}`, false); }
      }
    }
  };
  { const _d = Company.day.bind(Company); Company.day = () => { _d(); try { day(); } catch (e) { console.warn('contracts day', e); } }; const _w = Company.week.bind(Company); Company.week = () => { _w(); try { week(); } catch (e) { console.warn('contracts week', e); } }; }

  // ----- more customers for the security-install business (site based, old tender screen) -----
  try {
    JOB_SPECS.sec.push(
      { n: 'ร้านทองเยาวราชทุ่งทอง ติดกล้อง 8 ตัว + ระบบกันขโมย', cams: 8, days: 14, alarm: 1, remote: 1, price: 150000, len: 5 }, { n: 'ตลาดนัดริมทะเล กล้อง 12 ตัว ครอบคลุมทางเข้า-ออก', cams: 12, days: 14, remote: 1, price: 175000, len: 6 },
      { n: 'อพาร์ตเมนต์ริมคลอง กล้อง 10 ตัว + Wi-Fi ส่วนกลาง', cams: 10, aps: 2, days: 14, price: 160000, len: 5 }, { n: 'โรงเรียนอนุบาลสุขใจ กล้อง 6 ตัว ดูผ่านมือถือผู้ปกครอง', cams: 6, days: 14, remote: 1, price: 98000, len: 4 },
      { n: 'ร้านยาใกล้บ้าน กล้อง 3 ตัว + NVR', cams: 3, days: 7, remote: 1, price: 32000, len: 3 }, { n: 'โรงแรมสุขใจรีสอร์ต กล้อง 20 ตัว + Wi-Fi ห้องพัก', cams: 20, aps: 6, days: 21, remote: 1, price: 320000, len: 9 },
      { n: 'โกดังสินค้าสุขใจ กล้อง 14 ตัว + ระบบกันขโมย', cams: 14, days: 14, alarm: 1, price: 190000, len: 6 }, { n: 'ปั๊มน้ำมันสุขใจ กล้อง 9 ตัว บันทึกย้อนหลัง 30 วัน', cams: 9, days: 30, remote: 1, price: 140000, len: 5 },
      { n: 'ที่ว่าการอำเภอ กล้อง 18 ตัว + ห้องควบคุม', cams: 18, days: 30, remote: 1, price: 260000, len: 8 }, { n: 'บ้านจัดสรรสุขใจวิลล่า กล้องทางเข้าหมู่บ้าน 6 จุด', cams: 6, days: 14, remote: 1, price: 120000, len: 5 });
    const _of = B2B.offers.bind(B2B); B2B.offers = function (c) { const L = JOB_SPECS[c.type]; if (!L) return []; c.offers = c.offers && c.offers.day === S.day ? c.offers : { day: S.day, list: L.slice().sort(() => Math.random() - 0.5).slice(0, 4) }; return c.offers.list; };
    // the old tender screen stays for security installers (and for jobs already running); every other type uses contracts
    const _bh = B2B.html.bind(B2B); B2B.html = c => (c.type === 'sec' || (c.jobs && c.jobs.length)) ? _bh(c) : '';
  } catch (e) { console.warn('v207 sec', e); }

  // ----- the company screen: contracts -----
  const kindTag = o => o.kind === RET ? `🔁 สัญญารายเดือน ${o.term} เดือน` : `📦 งานโครงการ ${o.len} วัน`;
  const html = c => {
    if (!FAMILY[c.type] || c.st !== 'open') return c.st === 'setup' && FAMILY[c.type] ? '<h5>📑 สัญญากับลูกค้า</h5><p class="dim">เมื่อบริษัทเปิดดำเนินการ ลูกค้าจะส่งข้อเสนอสัญญามาให้ทุกวัน</p>' : '';
    const x = st(c), offers = refresh(c), res = reserved(c);
    const act = x.active.map(k => {
      const f = opsFail(c, k), left = k.kind === RET ? k.end - S.day : k.due - S.day;
      return `<div class="card"><div class="ci">${k.kind === RET ? '🔁' : '📦'}</div><div class="cb"><h4>${E(k.title)}</h4><p class="dim">${E(k.cust)} · ${E(k.no)} · ${k.kind === RET ? `${baht(k.fee)}/เดือน · เหลือ ${Math.max(0, Math.ceil(left / MO))} เดือน (ถึง${RD(k.end)}) · SLA ${k.sla}%` : `${baht(k.price)} · กำหนดส่ง${RD(k.due)}${left < 0 ? ' (เกินกำหนด)' : ` (อีก ${left} วัน)`}`}</p>
        <p class="${f.length ? 'bad' : 'good'}">${f.length ? '⚠️ ขณะนี้ผิดเงื่อนไข: ' + E(f.join(' · ')) : '✅ ให้บริการตามสัญญา'}${k.kind === RET && (k.streak || k.bad) ? ` · เดือนที่ผิด SLA ติดกัน ${k.streak}/3 (สัปดาห์นี้ ${k.bad} วัน)` : ''}</p>
        <div class="row">${k.kind === PRJ ? `<button class="btn" data-a="ctdone" data-v="${c.id}" data-i="${k.id}">ส่งมอบงาน</button>` : ''}<button class="btn ghost" data-a="ctend" data-v="${c.id}" data-i="${k.id}">เลิกสัญญา (ปรับ ${k.kind === RET ? '2 เดือน' : '15%'})</button></div></div></div>`;
    }).join('');
    const offs = offers.map(o => {
      const rq = reqAll(c, o.reqs), ok = rq.every(r => r[0]);
      return `<div class="card"><div class="ci">${o.renew ? '🔄' : o.kind === RET ? '🔁' : '📦'}</div><div class="cb"><h4>${E(o.title)}</h4><p class="dim">${E(o.cust)} · ${kindTag(o)}${o.renew ? ' · ต่อสัญญา' : ''}</p>
        <p class="lead">${o.kind === RET ? `${baht(o.fee)}/เดือน รวม ${baht(o.value)} · ชำระงวดแรกล่วงหน้า${o.sla ? ` · SLA ${o.sla}%` : ''}` : `${baht(o.price)} · มัดจำ 30% ${baht(Math.round(o.price * 0.3))}`}</p>${o.note ? `<p class="dim">${E(o.note)}</p>` : ''}
        <ul class="dim" style="margin:2px 0 4px 16px">${rq.map(r => `<li>${r[0] ? '✅' : '❌'} ${E(r[1])}</li>`).join('')}</ul><p class="dim">ข้อเสนอหมดอายุ${RD(o.exp)}</p>
        <div class="row"><button class="btn ${ok ? '' : 'ghost'}" data-a="ctsign" data-v="${c.id}" data-i="${o.id}">✍️ ดูสัญญาและลงนาม</button>${o.neg ? '' : `<button class="btn ghost" data-a="ctneg" data-v="${c.id}" data-i="${o.id}">🤝 ต่อรอง +10%</button>`}</div></div></div>`;
    }).join('');
    return `<h5>📑 สัญญากับลูกค้า (${x.active.length} ฉบับที่ใช้งานอยู่)</h5>${act || '<p class="dim">ยังไม่มีสัญญาที่ใช้งาน เลือกข้อเสนอด้านล่างแล้วลงนาม</p>'}
      <h5>📨 ข้อเสนอจากลูกค้า (เปลี่ยนทุกวัน)</h5><div class="grid">${offs || '<p class="dim">วันนี้ยังไม่มีข้อเสนอใหม่</p>'}</div>
      ${x.done.length ? `<h5>🗂️ ประวัติสัญญา</h5><p class="dim">${x.done.map(E).join('<br>')}</p>` : ''}`;
  };
  { const _h = Company.html.bind(Company); Company.html = t => { let s = _h(t); if (t !== 1) { const c = Company.get(Company.sel); if (c && ['setup', 'open'].includes(c.st) && FAMILY[c.type]) { const h = html(c); const m = '<h5>🗓️ ประชุมบอร์ด / ผู้ถือหุ้น</h5>'; s = s.includes(m) ? s.replace(m, h + m) : s.replace('<div class="row"><button class="btn danger" data-a="coclose"', h + '<div class="row"><button class="btn danger" data-a="coclose"'); } } return s; }; }
  window.Contracts207 = { F, FAMILY, offers: refresh, st, reqAll, html };
});
