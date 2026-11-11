'use strict';
// ---------- v204_itbiz: many more IT companies you can register (no limit on how many companies you open) ----------
V23.add('v204_itbiz', () => {
  if (typeof CO_TYPES === 'undefined' || typeof ROLES === 'undefined') return;
  Object.assign(ROLES, {
    designer: { n: 'นักออกแบบ UI/กราฟิก', sal: 28000 }, sysadmin: { n: 'ผู้ดูแลระบบ (SysAdmin)', sal: 32000 }, sect: { n: 'วิศวกรความปลอดภัยไซเบอร์', sal: 45000 },
    analyst: { n: 'นักวิเคราะห์ข้อมูล/AI', sal: 42000 }, sales: { n: 'พนักงานขาย', sal: 16000 }, support: { n: 'เจ้าหน้าที่ซัพพอร์ต', sal: 14000 },
    teacher: { n: 'ผู้สอน/ผู้สร้างคอนเทนต์', sal: 20000 }, agent: { n: 'เจ้าหน้าที่คอลเซ็นเตอร์', sal: 12000 },
  });
  Object.assign(CO_EQ, {
    srv: { n: 'เซิร์ฟเวอร์โฮสติ้ง/คลาวด์ 1 เครื่อง (ต่อเครื่อง)', price: 250000, w: 450, multi: 1 },
    olt: { n: 'อุปกรณ์ OLT/ไฟเบอร์ประจำชุมชน (ต่อชุด)', price: 1200000, w: 600, multi: 1 },
    gpu: { n: 'เซิร์ฟเวอร์ GPU สำหรับ AI (ต่อเครื่อง)', price: 1500000, w: 3000, multi: 1 },
    itstock: { n: 'สต็อกสินค้าไอที (คอม โน้ตบุ๊ก อุปกรณ์เครือข่าย)', price: 400000, w: 300, multi: 1 },
    iotkit: { n: 'ชุดเซนเซอร์ IoT + เกตเวย์ สำหรับฟาร์มอัจฉริยะ (ต่อชุด)', price: 120000, w: 100, multi: 1 },
    bench: { n: 'โต๊ะซ่อม + เครื่องมือซ่อมบอร์ด/จอ', price: 120000, w: 400 },
  });
  Object.assign(CO_LIC, {
    bot: { n: 'ใบอนุญาตผู้ให้บริการชำระเงินทางอิเล็กทรอนิกส์ (ธนาคารแห่งประเทศไทย)', fee: 100000, days: 5 },
    ecom: { n: 'จดทะเบียนพาณิชย์อิเล็กทรอนิกส์ (DBD) + มาตรฐาน PDPA', fee: 3000, days: 1 },
  });
  const NET = ['router|firewall', 'switch'];
  const dev = c => c.staff.filter(s => s.r === 'dev').length, cnt = (c, r) => c.staff.filter(s => s.r === r).length;
  const T = {
    host: { n: 'เว็บโฮสติ้ง & คลาวด์ VPS', i: '☁️', cap: 2e6, staff: { sysadmin: 2, support: 1 }, kw: 20, mbps: 1000, lic: ['ecom'], eq: { srv: 2 }, net: ['firewall', 'switch', 'rack', 'ups'], rev: c => (c.eq.srv || 0) * 4200 + cnt(c, 'support') * 800, cost: 0.2 },
    isp: { n: 'ผู้ให้บริการอินเทอร์เน็ตท้องถิ่น (ISP ไฟเบอร์)', i: '📡', cap: 5e6, staff: { tech: 2, sysadmin: 1, admin: 1 }, kw: 40, mbps: 5000, lic: ['nbtc'], eq: { olt: 1 }, net: ['firewall', 'switch', 'rack', 'ups'], rev: c => (c.eq.olt || 0) * 12500 + 3000, cost: 0.35 },
    app: { n: 'บริษัทพัฒนาแอปมือถือ', i: '📱', cap: 1e6, staff: { dev: 2, designer: 1 }, kw: 5, mbps: 500, lic: [], eq: { ws: 3 }, net: NET, rev: c => dev(c) * 7800 + cnt(c, 'designer') * 4000, cost: 0.12 },
    game: { n: 'สตูดิโอพัฒนาเกม', i: '🎮', cap: 2e6, staff: { dev: 3, designer: 2, qa: 1 }, kw: 8, mbps: 500, lic: [], eq: { ws: 6 }, net: NET, rev: c => (dev(c) * 8800 + cnt(c, 'designer') * 6000) * (Math.random() < 0.08 ? 3.5 : 0.9), cost: 0.15 },
    ai: { n: 'AI & วิเคราะห์ข้อมูล (Data Analytics)', i: '🧠', cap: 3e6, staff: { analyst: 2, dev: 1 }, kw: 25, mbps: 1000, lic: [], eq: { gpu: 1, ws: 3 }, net: ['firewall', 'switch'], rev: c => (c.eq.gpu || 0) * 14500 + cnt(c, 'analyst') * 3000, cost: 0.25 },
    cyber: { n: 'ที่ปรึกษาความมั่นคงปลอดภัยไซเบอร์', i: '🛡️', cap: 1e6, staff: { sect: 2, admin: 1 }, kw: 5, mbps: 500, lic: [], eq: { ws: 3 }, net: ['firewall', 'switch'], rev: c => cnt(c, 'sect') * 12500, cost: 0.3 },
    itshop: { n: 'ร้านคอมพิวเตอร์ & อุปกรณ์ไอที (ค้าปลีก)', i: '🖥️', cap: 1e6, staff: { sales: 2, tech: 1 }, kw: 8, mbps: 100, lic: ['ecom'], eq: { itstock: 1 }, net: ['router|firewall', 'cam'], rev: c => 4000 + (c.eq.itstock || 0) * 9500, cost: 0.72 },
    itmaint: { n: 'รับดูแลระบบไอที (MA) & Helpdesk', i: '🧰', cap: 1e6, staff: { tech: 2, support: 1 }, kw: 5, mbps: 100, lic: [], eq: { tools: 1 }, net: ['router|firewall'], car: ['pickup', 'van', 'oldtruck', 'ev_pickup', 'ev_van'], rev: c => cnt(c, 'tech') * 5500, cost: 0.4 },
    ecom: { n: 'แพลตฟอร์มอีคอมเมิร์ซ', i: '🛍️', cap: 3e6, staff: { dev: 2, support: 2, admin: 1 }, kw: 10, mbps: 1000, lic: ['ecom'], eq: { ws: 5 }, net: ['firewall', 'switch'], rev: c => dev(c) * 5200 + cnt(c, 'support') * 3600 + 4000, cost: 0.3 },
    fintech: { n: 'ฟินเทค & ระบบชำระเงิน', i: '💳', cap: 5e6, staff: { dev: 3, sect: 1, admin: 1 }, kw: 15, mbps: 1000, lic: ['bot', 'ecom'], eq: { ws: 5 }, net: ['firewall', 'switch', 'rack'], rev: c => dev(c) * 9000 + cnt(c, 'sect') * 7000 + 6000, cost: 0.25 },
    edtech: { n: 'คอร์สออนไลน์ & EdTech', i: '🎓', cap: 1e6, staff: { teacher: 2, designer: 1 }, kw: 5, mbps: 500, lic: ['ecom'], eq: { ws: 3 }, net: NET, rev: c => cnt(c, 'teacher') * 4800 + cnt(c, 'designer') * 1500 + 1500, cost: 0.2 },
    iot: { n: 'Smart Farm & IoT', i: '🌡️', cap: 2e6, staff: { dev: 1, eng: 1, installer: 1 }, kw: 6, mbps: 100, lic: [], eq: { tools: 1, iotkit: 2 }, net: ['router|firewall'], car: ['pickup', 'van', 'ev_pickup'], rev: c => (c.eq.iotkit || 0) * 4200 + dev(c) * 2500, cost: 0.4 },
    repair: { n: 'ศูนย์ซ่อมโน้ตบุ๊ก & มือถือ', i: '🔧', cap: 1e6, staff: { tech: 2, sales: 1 }, kw: 6, mbps: 100, lic: [], eq: { bench: 1 }, net: ['router|firewall', 'cam'], rev: c => cnt(c, 'tech') * 3800 + 1500, cost: 0.5 },
    bpo: { n: 'คอลเซ็นเตอร์ & BPO', i: '🎧', cap: 2e6, staff: { agent: 6, admin: 1 }, kw: 12, mbps: 500, lic: [], eq: { ws: 6 }, net: NET, rev: c => cnt(c, 'agent') * 1800, cost: 0.55 },
    agency: { n: 'เอเจนซี่การตลาดดิจิทัล', i: '📣', cap: 1e6, staff: { designer: 2, sales: 1 }, kw: 5, mbps: 500, lic: [], eq: { ws: 3 }, net: NET, rev: c => cnt(c, 'designer') * 4500 + cnt(c, 'sales') * 3500, cost: 0.3 },
  };
  Object.assign(CO_TYPES, T);
  // where each can be set up (homes and offices: office-style work; shop units: retail/service; plots and factories: hosting / ISP / IoT)
  const OFFICE = ['app', 'game', 'ai', 'cyber', 'itmaint', 'ecom', 'fintech', 'edtech', 'bpo', 'agency', 'host', 'iot'], SHOPK = ['itshop', 'repair', 'itmaint', 'agency', 'edtech', 'bpo'], BIG = ['host', 'isp', 'iot', 'ai', 'bpo'];
  const add = (k, L) => { for (const x of L) if (!CO_SITES[k].kinds.includes(x)) CO_SITES[k].kinds.push(x); };
  for (const k of Object.keys(CO_SITES)) {
    if (k === 'home') add(k, ['app', 'game', 'ai', 'cyber', 'ecom', 'edtech', 'agency']);
    else if (/^office/.test(k)) add(k, OFFICE.concat(['isp']));
    else if (/^shop/.test(k)) add(k, SHOPK);
    else add(k, BIG);
  }
  // opening companies is not limited, and a co-shareholder is always available (an independent investor when no friend is close enough)
  if (!Company.partners.__v204) { const _p = Company.partners.bind(Company); Company.partners = () => { const L = _p(); if (!L.includes('นักลงทุนอิสระ')) L.push('นักลงทุนอิสระ'); return L; }; Company.partners.__v204 = 1; }
});
