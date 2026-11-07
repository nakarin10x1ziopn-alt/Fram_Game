'use strict';
// ---------- v24_phone: 20+ entries in every item/plan/service list of the phone apps, plus 14 fire-station and 14 police-station services ----------
V23.add('phone24', () => {
  const ph = () => { const s = S.ph24 = S.ph24 || {}; s.ins = s.ins || {}; s.fund = s.fund || []; s.asset = s.asset || {}; s.gig = s.gig || {}; s.pd = s.pd || {}; return s; };
  const log = (t, n) => { try { Bank2.log(t, n); } catch (e) { } };
  const inc = (t, n) => { try { Bank2.income(t, n); } catch (e) { } };
  const take = (n, why) => { if (S.money < n) { UI.toast('เงินไม่พอ ต้องใช้ ' + baht(n), '💸'); return false; } S.money -= n; log(why, -n); return true; };

  // =============== 1. online shop (phone "ช้อปออนไลน์"): every tab 20 real products ===============
  {
    const SH = SHOPS.online, used = new Set(SH.tabs.flatMap(t => t.items)), tabBy = n => SH.tabs.find(t => t.n === n);
    const ok = k => { const [a, id] = k.split(':'); return a === 'tool' ? !!TOOLS[id] : a === 'seed' ? !!CROPS[id] : false; };
    const fill = (tab, pool) => { if (!tab) return; for (const k of pool) { if (tab.items.length >= 20) break; if (used.has(k) || !ok(k)) continue; tab.items.push(k); used.add(k); } };
    const V = p => Object.keys(TOOLS).filter(k => k.startsWith(p)).map(k => 'tool:' + k);
    fill(tabBy('เมล็ดพันธุ์'), [...Object.keys(CROPS).map(c => 'seed:' + c), 'tool:fseed_rose', 'tool:fseed_jasmine', 'tool:fseed_orchid', 'tool:seedling', 'tool:fingerling', 'tool:v_seedmix', 'tool:v_birdseed', 'tool:v_rabbithay', 'tool:v_bonemeal', 'tool:v_humus', 'tool:v_compost', 'tool:v_guano']);
    fill(tabBy('อุปกรณ์'), ['tool:pesticide', 'tool:ladybug', 'tool:sandbag', 'tool:v_wateringcan2', 'tool:v_workgloves', 'tool:v_farmhat', 'tool:v_rainboots', 'tool:v_mulch', 'tool:v_growtonic', 'tool:v_growtonic2', 'tool:v_feedsack', 'tool:v_feedsack2', 'tool:v_troughfill', 'tool:v_fishmeal', 'tool:v_seaweedfert', 'tool:v_rainwater', 'tool:v_hormone', 'tool:v_waterpack', 'tool:v_liniment', 'tool:v_firstaid', 'tool:v_sunscreen', ...V('v_')]);
    fill(tabBy('ไอที'), [...(typeof IT_GOODS !== 'undefined' ? IT_GOODS.map(g => 'tool:' + g[0]) : []), 'tool:v_usbhub', 'tool:v_powerbank', 'tool:v_earbuds', 'tool:v_smartband', 'tool:v_webcam', 'tool:v_keyboardmech', 'tool:v_smartbulb', 'tool:v_ledstrip', 'tool:v_chargecable', 'tool:v_coolpad', 'tool:v_cleankit', 'tool:v_netbook']);
    fill(tabBy('📦 สินค้าออนไลน์เพิ่มเติม'), [...V('v_'), ...Object.keys(TOOLS).map(k => 'tool:' + k)]);
  }

  // =============== 2. taxi: more destinations around the map (real door positions) ===============
  {
    const have = new Set(TAXI_DEST.map(t => t.n));
    const want = ['สถานีตำรวจภูธรสุขใจ', 'สถานีดับเพลิงสุขใจ', 'ธนาคารสุขใจ', 'คลินิก', 'ร้านเกษตรรุ่งเรือง', 'ปั๊มน้ำมัน', 'ศูนย์แข่งขัน', 'โรงจอดรถ', 'ไอทีซิตี้ ทุ่งทอง', 'โรงพยาบาลทุ่งทอง', 'ไอทีสโตร์ ภูผา', 'ศูนย์ EV & พลังงานสะอาด', 'สุขใจมาร์ท ทุ่งทอง', 'โชว์รูมรถยนต์สุขใจ'];
    for (const w of want) {
      const p = World.pois.find(o => o.label === w && o.x != null); if (!p || have.has(w)) continue;
      TAXI_DEST.push({ n: w, x: p.x, z: p.z + (p.z > -400 ? 2.2 : 0), fee: Math.max(40, Math.round(40 + Math.hypot(p.x, p.z + 62) * 0.35)) }); have.add(w);
    }
  }

  // (stock list: the exchange module v24_market.js owns STOCKS / sector / share tables, so listings are added there)

  // =============== 4. commercial farm: 20 buyer contracts ===============
  {
    const buyers = [['ร้านอาหารไทยป้าแดง', 'ผักสด', 18, 1.25, 'gap'], ['โรงเรียนบ้านสุขใจ (อาหารกลางวัน)', 'ผักสด', 25, 1.15, 'gap'], ['โรงพยาบาลทุ่งทอง', 'ผักปลอดภัย', 22, 1.3, 'gap'], ['ตลาดสดทุ่งทอง', 'ผักรวม', 40, 1.2, 'gap'],
      ['ร้านสลัดริมทะเล', 'ผักออร์แกนิก', 12, 1.7, 'organic'], ['รีสอร์ตเขาภูผา', 'ผักออร์แกนิก', 16, 1.75, 'organic'], ['ร้านอาหารเจ', 'ผักปลอดสาร', 15, 1.35, 'gap'], ['คาเฟ่ริมเขา', 'ผลไม้สด', 10, 1.4, 'gap'],
      ['สหกรณ์การเกษตรสุขใจ', 'ผลผลิตรวม', 50, 1.12, 'gap'], ['โรงแรมทุ่งทองการ์เด้น', 'ผักออร์แกนิก', 24, 1.85, 'organic'], ['ซุปเปอร์มาร์เก็ตภูผา', 'ผักสด', 35, 1.28, 'gap'], ['ร้านน้ำผลไม้ปั่น', 'ผลไม้สด', 14, 1.3, 'gap'],
      ['โรงครัวกลางเทศบาล', 'ผักสด', 45, 1.18, 'gap'], ['เชฟเทเบิลฟาร์มทูเทเบิล', 'ผักออร์แกนิก', 10, 2.0, 'organic'], ['บริษัทอาหารแช่แข็ง', 'ผักสด', 70, 1.5, 'gap'], ['ตลาดนัดวันหยุด', 'ผักรวม', 30, 1.22, 'gap'], ['ร้านอาหารสุขภาพ', 'ผักออร์แกนิก', 20, 1.65, 'organic']];
    let n = 4; for (const b of buyers) { const k = 'v24c' + n++; if (!AGRI_CONTRACTS.some(c => c.k === k)) AGRI_CONTRACTS.push({ k, n: `${b[0]}: ${b[1]} ${b[2]} ชิ้น/สัปดาห์`, need: b[2], mult: b[3], cert: b[4] }); }
  }

  // =============== 5. hospital app: 12 more treatments (20 bookable) ===============
  {
    const T = (n, i, q, price, min, d) => ({ n, i, q, price, min, when: 'office', c: { ucs: 0, sso: 0, gov: 0 }, ins: 1, d });
    Object.assign(CV_HOS, {
      ecg: T('ตรวจหัวใจ EKG / วิ่งสายพาน', '🫀', 'H', 1200, 45, 'ตรวจคลื่นไฟฟ้าหัวใจ ช่วยดูแลคนทำงานหนักในไร่'), skin: T('คลินิกผิวหนัง (แพ้แดด/ผื่น)', '🧴', 'S', 700, 30, 'ผื่นแพ้ผักฉุนและแดดจัด รับครีมและยา'),
      ent: T('หู คอ จมูก (ENT)', '👂', 'N', 600, 30, 'คออักเสบ ภูมิแพ้ฝุ่น · ถ้าป่วยเล็กน้อยหายทันที'), ortho: T('กระดูกและข้อ (ออร์โธฯ)', '🦴', 'B', 900, 45, 'ปวดเอว ปวดเข่าจากแบกผลผลิต พลังงาน +25'),
      diet: T('นักกำหนดอาหาร วางแผนมื้ออาหาร', '🥗', 'F', 500, 30, 'ได้แผนอาหาร อิ่มท้องขึ้น อารมณ์ดี'), sleepcl: T('คลินิกนอนหลับ', '😴', 'Z', 800, 50, 'แก้ปัญหานอนไม่หลับ พลังงานกลับมา 80%'),
      thaimed: T('แพทย์แผนไทย นวด ประคบ อบสมุนไพร', '🌿', 'T', 500, 60, 'คลายกล้ามเนื้อ พลังงาน +35 อารมณ์ +8'), acu: T('ฝังเข็ม แพทย์แผนจีน', '📍', 'U', 900, 45, 'บรรเทาปวด พลังงาน +30 · ถ้าป่วยเล็กน้อยจะหาย'),
      vcov: T('วัคซีนโควิด-19 เข็มกระตุ้น', '💉', 'V', 1000, 15, 'ภูมิคุ้มกัน 56 วัน'), vhep: T('วัคซีนไวรัสตับอักเสบบี (3 เข็ม)', '🧬', 'V', 800, 15, 'ภูมิคุ้มกัน 84 วัน'),
      vteta: T('วัคซีนบาดทะยัก (บาดแผลจากงานไร่)', '🩹', 'V', 300, 10, 'ป้องกันบาดทะยัก ภูมิคุ้มกัน 120 วัน'), don: Object.assign(T('บริจาคโลหิต', '🩸', 'D', 0, 30, 'ช่วยชีวิตคนอื่น ได้ของว่างและน้ำหวาน · พลังงาน −10 อารมณ์ +12'), { ins: 0 }),
    });
    const NEW = ['ecg', 'skin', 'ent', 'ortho', 'diet', 'sleepcl', 'thaimed', 'acu', 'vcov', 'vhep', 'vteta', 'don'];
    window.CV24_BOOK = NEW;
    const _eff = Civic.effect.bind(Civic);
    Civic.effect = function (k, r) {
      if (!NEW.includes(k)) return _eff(k, r);
      const mx = maxEnergy(), c = this.st(), mood = n => { S.mood = Math.min(100, (S.mood || 50) + n); }, en = n => { S.energy = Math.min(mx, S.energy + n); };
      const mild = () => { if (S.sick === 1) { S.sick = 0; S.sickDays = 0; return true; } return false; };
      switch (k) {
        case 'ecg': mood(4); return S.chronic ? `หัวใจปกติ ${S.chronic}ควบคุมได้` : 'ผลตรวจหัวใจปกติดี';
        case 'skin': mood(4); en(5); return 'ได้ครีมกันแดดและยาทา ผื่นทุเลา';
        case 'ent': return mild() ? 'ให้ยาคอและจมูก อาการหายแล้ว' : (mood(2), 'ตรวจหูคอจมูกปกติ');
        case 'ortho': en(25); mood(3); return 'ปวดเอวทุเลา พลังงาน +25';
        case 'diet': S.hunger = Math.min(100, (S.hunger == null ? 50 : S.hunger) + 30); mood(4); return 'ได้แผนอาหาร ความอิ่ม +30';
        case 'sleepcl': S.energy = Math.max(S.energy, Math.round(mx * 0.8)); mood(10); return 'พลังงานกลับมา 80% อารมณ์ +10';
        case 'thaimed': en(35); mood(8); return 'คลายกล้ามเนื้อ พลังงาน +35 อารมณ์ +8';
        case 'acu': en(30); mood(6); return mild() ? 'หายป่วยเล็กน้อยและพลังงาน +30' : 'พลังงาน +30';
        case 'vcov': S.vax = Math.max(S.vax || 0, S.day + 56); return 'ภูมิคุ้มกัน 56 วัน';
        case 'vhep': S.vax = Math.max(S.vax || 0, S.day + 84); return 'ภูมิคุ้มกัน 84 วัน';
        case 'vteta': S.vax = Math.max(S.vax || 0, S.day + 120); mood(2); return 'ภูมิคุ้มกัน 120 วัน';
        case 'don': S.energy = Math.max(0, S.energy - 10); mood(12); addItem('v_energybar', 1); if (typeof Prog !== 'undefined') Prog.add(5); return 'ได้รับขนมและน้ำหวาน ขอบคุณที่ช่วยชีวิตผู้อื่น';
      }
      return '';
    };
  }

  // =============== 6. company registration: 12 more business types (same real licence / equipment / staff checks) ===============
  {
    const base = (o, t) => Object.assign({}, o, t);
    const cafe = CO_TYPES.cafe, it = CO_TYPES.it, lg = CO_TYPES.logistics, sec = CO_TYPES.sec;
    const add = (k, t) => { if (!CO_TYPES[k]) CO_TYPES[k] = t; };
    add('bakery', base(cafe, { n: 'ร้านเบเกอรี่และขนมอบ (นิติบุคคล)', i: '🥐', staff: { chef: 1, staff: 1 }, rev: () => 48 * 140, cost: 0.4 }));
    add('noodle', base(cafe, { n: 'ร้านก๋วยเตี๋ยวและอาหารตามสั่ง (นิติบุคคล)', i: '🍜', staff: { chef: 1, staff: 2 }, rev: () => 90 * 65, cost: 0.42 }));
    add('tea', base(cafe, { n: 'ร้านชาไข่มุกและเครื่องดื่ม (นิติบุคคล)', i: '🧋', staff: { staff: 2 }, rev: () => 130 * 48, cost: 0.36, kw: 8 }));
    add('catering', base(cafe, { n: 'บริษัทจัดเลี้ยงและโรงครัวกลาง', i: '🍱', staff: { chef: 2, staff: 2 }, cap: 2e6, rev: () => 36 * 380, cost: 0.45, kw: 25 }));
    add('webag', base(it, { n: 'บริษัทรับทำเว็บไซต์และดิจิทัลเอเจนซี', i: '🌐', rev: c => 2 * 6500 * Math.max(0, c.staff.filter(s => s.r === 'dev').length - 1) + 6500 }));
    add('appdev', base(it, { n: 'สตูดิโอพัฒนาแอปมือถือ', i: '📱', staff: { dev: 3, admin: 1 }, cap: 2e6, rev: c => 3 * 9000 * Math.max(0, c.staff.filter(s => s.r === 'dev').length - 1) + 9000 }));
    add('data', base(it, { n: 'บริษัทวิเคราะห์ข้อมูลและ AI', i: '🧠', staff: { dev: 2, admin: 1 }, mbps: 1000, net: ['router|firewall', 'switch'], cap: 2e6, rev: c => 2 * 11000 * Math.max(0, c.staff.filter(s => s.r === 'dev').length - 1) + 11000 }));
    add('game', base(it, { n: 'สตูดิโอพัฒนาเกม', i: '🎮', staff: { dev: 3, qa: 1 }, cap: 2e6, rev: c => 2 * 8500 * Math.max(0, c.staff.filter(s => s.r === 'dev').length - 1) + 5000 }));
    add('itsupport', base(it, { n: 'บริษัทรับดูแลระบบไอที (IT Outsource)', i: '🛠️', staff: { tech: 2, admin: 1 }, rev: c => 2 * 7000 * Math.max(0, c.staff.filter(s => s.r === 'tech').length - 1) + 6000 }));
    add('smarti', base(sec, { n: 'บริษัทติดตั้งสมาร์ตโฮมและระบบอัตโนมัติ', i: '🏠', rev: c => c.staff.filter(s => s.r === 'installer').length * 9500 }));
    add('courier', base(lg, { n: 'บริษัทพัสดุและเมสเซนเจอร์', i: '📦', staff: { driver: 2, admin: 1 }, rev: c => Math.max(1, c.staff.filter(s => s.r === 'driver').length) * 7800 }));
    add('moving', base(lg, { n: 'บริษัทรับขนย้ายบ้านและสำนักงาน', i: '🚛', rev: c => Math.max(1, c.staff.filter(s => s.r === 'driver').length) * 9200, cost: 0.4 }));
  }

  // =============== 7. generic extension sections for phone apps (insurance, finance, estate, extra jobs) ===============
  const gSt = id => { const p = ph(); return p.ins[id] || 0; };
  const INS24 = [
    ['i_st1', '🌪️', 'ประกันภัยพายุ (พื้นฐาน)', 'วันที่เกิดพายุจ่าย 3,000 ฿', 250, 'storm', 3000], ['i_st2', '🌪️', 'ประกันภัยพายุ (พลัส)', 'วันที่เกิดพายุจ่าย 7,500 ฿', 520, 'storm', 7500],
    ['i_rn1', '🌧️', 'ประกันน้ำท่วม/ฝนตกหนัก', 'วันที่ฝนตกหนักจ่าย 1,200 ฿', 200, 'rain', 1200], ['i_rn2', '🌧️', 'ประกันน้ำท่วม (พลัส)', 'วันที่ฝนตกหนักจ่าย 3,000 ฿', 420, 'rain', 3000],
    ['i_ht1', '☀️', 'ประกันภัยแล้ง/ร้อนจัด', 'วันที่แดดแรงฤดูร้อนจ่าย 1,500 ฿', 300, 'hot', 1500], ['i_fg1', '🌫️', 'ประกันทัศนวิสัยต่ำ (หมอกลง)', 'วันที่หมอกลงจ่าย 800 ฿', 120, 'fog', 800],
    ['i_sk1', '🤒', 'ประกันรายได้รายวันกรณีป่วย', 'จ่ายวันละ 600 ฿ ทุกวันที่ป่วย', 280, 'sick', 600], ['i_sk2', '🏥', 'ประกันโรคร้ายแรง', 'จ่าย 3,500 ฿/วัน เมื่อป่วยหนัก', 520, 'sick2', 3500],
    ['i_th1', '🕵️', 'ประกันโจรกรรมผลผลิต', 'ถูกขโมยผักจ่าย 3,500 ฿', 350, 'theft', 3500], ['i_th2', '🕵️', 'ประกันโจรกรรม (พลัส)', 'ถูกขโมยผักจ่าย 8,000 ฿', 700, 'theft', 8000],
    ['i_fr1', '🔥', 'ประกันอัคคีภัยไร่', 'เกิดไฟไหม้ในไร่จ่าย 4,000 ฿/ครั้ง', 400, 'fire', 4000], ['i_fr2', '🔥', 'ประกันอัคคีภัย (พลัส)', 'เกิดไฟไหม้ในไร่จ่าย 10,000 ฿/ครั้ง', 800, 'fire', 10000],
    ['i_ou1', '⚡', 'ประกันธุรกิจหยุดชะงัก (ไฟดับ)', 'วันที่ไฟดับจ่าย 1,000 ฿', 260, 'outage', 1000], ['i_tk1', '🚦', 'ประกันค่าปรับจราจร', 'ใบสั่งใหม่ คืนเงิน 70% ของค่าปรับ', 180, 'ticket', 0.7],
    ['i_all', '🛡️', 'ประกันครอบคลุมรวมภัย', 'พายุ ฝนตกหนัก ไฟไหม้ โจรกรรม จ่าย 2,500 ฿ ต่อเหตุ', 900, 'all', 2500],
  ].map(a => ({ id: a[0], i: a[1], n: a[2], d: a[3], p: a[4], cover: a[5], pay: a[6] }));
  const FUND24 = [
    ['f_b14', '📜', 'พันธบัตรรัฐบาล 14 วัน', 'ตั๋ว 50,000 ฿ ปลอดความเสี่ยง ผลตอบแทน 1.2%', 50000, 14, 0.012, 0], ['f_b28', '📜', 'พันธบัตรรัฐบาล 28 วัน', 'ตั๋ว 50,000 ฿ ผลตอบแทน 2.8%', 50000, 28, 0.028, 0],
    ['f_m14', '💵', 'กองทุนตลาดเงิน 14 วัน', 'ตั๋ว 20,000 ฿ ผลตอบแทน 0.9% เสี่ยงต่ำ', 20000, 14, 0.009, 0.004], ['f_d56', '🏦', 'เงินฝากประจำพิเศษ 56 วัน', 'ตั๋ว 100,000 ฿ ผลตอบแทน 6%', 100000, 56, 0.06, 0],
    ['f_eq', '📈', 'กองทุนหุ้นไทย 28 วัน', 'ตั๋ว 30,000 ฿ ผลตอบแทนผันผวน −6% ถึง +14%', 30000, 28, 0.04, 0.1], ['f_gold', '🥇', 'กองทุนทองคำ 28 วัน', 'ตั๋ว 30,000 ฿ ผลตอบแทนผันผวน −4% ถึง +10%', 30000, 28, 0.03, 0.07],
    ['f_ev', '🔋', 'กองทุนพลังงานสะอาด 56 วัน', 'ตั๋ว 50,000 ฿ ผลตอบแทนผันผวน −8% ถึง +20%', 50000, 56, 0.06, 0.14], ['f_ret', '🧓', 'กองทุนเกษียณ 112 วัน', 'ตั๋ว 100,000 ฿ ผลตอบแทน 12% ล็อกยาว', 100000, 112, 0.12, 0.02],
  ].map(a => ({ id: a[0], i: a[1], n: a[2], d: a[3], p: a[4], days: a[5], rate: a[6], vol: a[7] }));
  const LOAN24 = [
    ['l_trc', '🚜', 'สินเชื่อซื้อรถแทรกเตอร์', 0.055, 36, 100000, 300000], ['l_edu', '🎓', 'สินเชื่อการศึกษา (ดอกเบี้ยต่ำ)', 0.025, 48, 50000, 150000], ['l_ev', '🔌', 'สินเชื่อรถยนต์ไฟฟ้า EV', 0.04, 60, 200000, 600000],
    ['l_sol', '☀️', 'สินเชื่อโซลาร์เซลล์บ้านและไร่', 0.035, 60, 100000, 300000], ['l_mot', '🏍️', 'สินเชื่อรถจักรยานยนต์', 0.06, 24, 20000, 60000], ['l_ren', '🔨', 'สินเชื่อต่อเติมซ่อมแซมบ้าน', 0.07, 36, 50000, 200000],
    ['l_med', '🏥', 'สินเชื่อค่ารักษาพยาบาล', 0.08, 12, 20000, 80000], ['l_mic', '⚡', 'สินเชื่อไมโครไฟแนนซ์ (วงเงินเล็ก)', 0.24, 6, 5000, 15000], ['l_ref', '♻️', 'สินเชื่อรีไฟแนนซ์', 0.05, 60, 200000, 500000],
    ['l_stu', '🚀', 'สินเชื่อธุรกิจสตาร์ทอัพ', 0.09, 36, 300000, 1000000], ['l_agr', '🌾', 'สินเชื่อเกษตรกร (ปัจจัยการผลิต)', 0.04, 24, 30000, 100000], ['l_trk', '🚛', 'สินเชื่อเช่าซื้อรถบรรทุก', 0.055, 48, 400000, 800000],
  ].map(a => ({ id: a[0], i: a[1], n: a[2], r: a[3], m: a[4], a1: a[5], a2: a[6] }));
  const ASSET24 = [
    ['a_land1', '🏞️', 'ที่ดินเปล่า 1 งาน ริมคลอง', 180000, 0.004], ['a_rub', '🌳', 'สวนยางพารา 3 ไร่', 420000, 0.006], ['a_fruit', '🥭', 'สวนผลไม้ 2 ไร่', 380000, 0.0065], ['a_row2', '🏘️', 'ห้องแถวให้เช่า 2 ห้อง', 650000, 0.007],
    ['a_shop', '🏪', 'ตึกแถว 1 คูหา ทุ่งทอง', 1200000, 0.0075], ['a_room', '🛏️', 'ห้องพักรายวัน 5 ห้อง', 900000, 0.0085], ['a_dorm', '🏢', 'หอพักเล็ก 10 ห้อง', 1600000, 0.008], ['a_wh', '🏭', 'โกดังให้เช่า', 1400000, 0.008],
    ['a_park', '🅿️', 'ลานจอดรถหน้าตลาด', 520000, 0.0075], ['a_mkt', '🛍️', 'ล็อกตลาดนัด 4 ล็อก', 300000, 0.008], ['a_house', '🏠', 'บ้านเช่า 1 หลัง', 800000, 0.0065], ['a_coco', '🥥', 'สวนมะพร้าว 5 ไร่', 560000, 0.0055],
    ['a_pond', '🐟', 'บ่อเลี้ยงปลาให้เช่า', 340000, 0.007], ['a_main', '🛣️', 'ที่ดินติดถนนใหญ่ 2 ไร่', 1900000, 0.006], ['a_cond', '🌆', 'คอนโดให้เช่า 1 ห้อง', 1100000, 0.0075],
  ].map(a => ({ id: a[0], i: a[1], n: a[2], p: a[3], rate: a[4] }));
  const GIG24 = [
    ['g1', '🪴', 'รดน้ำสวนให้เพื่อนบ้าน', 90, 8, 260], ['g2', '🌿', 'ตัดหญ้าที่วัดสุขใจาราม', 120, 12, 380], ['g3', '🚗', 'ล้างรถให้ชาวบ้าน', 60, 6, 200], ['g4', '🧺', 'ช่วยเก็บผักที่ตลาดนัด', 120, 10, 340],
    ['g5', '📱', 'สอนผู้สูงอายุใช้มือถือ', 60, 3, 220], ['g6', '🔧', 'ซ่อมรั้วให้ลุงมี', 90, 12, 420], ['g7', '📦', 'ขนของย้ายบ้าน', 180, 18, 700], ['g8', '👶', 'ดูแลเด็กชั่วคราว', 120, 6, 300],
    ['g9', '🍳', 'ช่วยงานครัวร้านป้าแดง', 120, 8, 360], ['g10', '📋', 'ตรวจนับสต็อกสุขใจมาร์ท', 90, 4, 280], ['g11', '🗑️', 'เก็บขยะริมถนนหมู่บ้าน', 60, 8, 180], ['g12', '📸', 'ถ่ายภาพงานบุญ (ต้องมีมือถือรุ่นโปร)', 150, 5, 650, 'phonepro'],
    ['g13', '🎬', 'ตัดต่อวิดีโอรับจ้าง (ต้องมีโน้ตบุ๊ก)', 150, 5, 700, 'laptop'],
  ].map(a => ({ id: a[0], i: a[1], n: a[2], min: a[3], en: a[4], pay: a[5], need: a[6] }));

  const sec = (title, n, cards) => `<h5>${title} (${n} รายการ)</h5><div class="grid">${cards.join('')}</div>`;
  const card = (e, desc, btn) => `<div class="card"><div class="ci">${e.i}</div><div class="cb"><h4>${esc(e.n)}</h4><p class="dim">${desc}</p><div class="row">${btn}</div></div></div>`;
  const insHtml = () => sec('🛡️ ประกันภัยเพิ่มเติม — จ่ายตามเหตุการณ์จริงในเกม', INS24.length, INS24.map(e => { const u = gSt(e.id), on = u >= S.day; return card(e, `${esc(e.d)} · เบี้ย 7 วัน${on ? ` · คุ้มครองถึง${RD(u)}` : ''}`, `<button class="btn ${on ? 'ghost' : ''}" data-a="v24ins" data-id="${e.id}" ${S.money < e.p ? 'disabled' : ''}>${on ? 'ต่ออายุ' : 'ซื้อ'} ${baht(e.p)}</button>`); }));
  const loanHtml = () => { const cr = Credit.st(); return sec('💳 สินเชื่อเฉพาะทางเพิ่มเติม', LOAN24.length, LOAN24.map(e => { const q = quote24(e, e.a1); return card(e, `ดอกเบี้ย ${(q.r * 100).toFixed(2)}% · ${e.m} งวด · ผ่อน ~${baht(q.pay)} ต่อ ${U.fmt(e.a1)} (วงเงินไม่เกินภาระหนี้ 60% ของรายได้)`, `<button class="btn ghost" data-a="v24loan" data-id="${e.id}" data-v="${e.a1}">กู้ ${U.fmt(e.a1)}</button><button class="btn ghost" data-a="v24loan" data-id="${e.id}" data-v="${e.a2}">กู้ ${U.fmt(e.a2)}</button>`); })) +
    sec('🏦 ฝากและลงทุนกับธนาคาร (ล็อกเงินต้นจนครบกำหนด)', FUND24.length, FUND24.map(e => card(e, `${esc(e.d)} · ครบกำหนด ${e.days} วัน`, `<button class="btn ghost" data-a="v24fund" data-id="${e.id}" ${S.money < e.p ? 'disabled' : ''}>ซื้อ ${baht(e.p)}</button>`))) +
    (ph().fund.length ? `<p class="lead">ที่ถืออยู่: ${ph().fund.map(f => `${esc(f.n)} ${baht(f.amt)} ครบ${RD(f.due)}`).join(' · ')}</p>` : ''); };
  const estHtml = () => sec('🏘️ ซื้อทรัพย์สินปล่อยเช่า — ได้ค่าเช่าทุกวัน ขายคืนได้ 92%', ASSET24.length, ASSET24.map(e => { const own = ph().asset[e.id]; return card(e, `ค่าเช่า ~${baht(Math.round(e.p * e.rate))}/สัปดาห์ ${own ? `· คุณถืออยู่ ${own} แปลง` : ''}`, `<button class="btn ghost" data-a="v24buy" data-id="${e.id}" ${S.money < e.p ? 'disabled' : ''}>ซื้อ ${baht(e.p)}</button>${own ? `<button class="btn ghost" data-a="v24sell" data-id="${e.id}">ขาย ${baht(Math.round(e.p * 0.92))}</button>` : ''}`); }));
  const gigHtml = () => sec('🧰 งานพิเศษเพิ่มเติม (ทำได้วันละ 1 ครั้งต่องาน)', GIG24.length, GIG24.map(e => { const done = ph().gig[e.id] === S.day; const miss = e.need && !Gadgets.has(e.need); return card(e, `ใช้เวลา ${e.min} นาที · พลังงาน −${e.en} · ค่าจ้าง ${baht(e.pay)}${miss ? ' · ยังไม่มีอุปกรณ์ที่ต้องใช้' : ''}`, `<button class="btn ghost" data-a="v24gig" data-id="${e.id}" ${done || miss ? 'disabled' : ''}>${done ? 'ทำแล้ววันนี้' : 'รับงาน'}</button>`); }));

  const quote24 = (e, amt) => { const s = Credit.st(), i = Credit.income(), r = e.r + (s.score < 600 ? 0.03 : s.score > 750 ? -0.01 : 0), n = e.m, pay = Math.round(amt * (r / 12) / (1 - Math.pow(1 + r / 12, -n))); const dsr = (pay + s.loans.reduce((t, l) => t + l.pay, 0)) / Math.max(1, i); return { r, n, pay, dsr, ok: dsr <= 0.6 && s.score >= 520 }; };
  const wrap = (obj, fn, extra) => { const o = obj[fn].bind(obj); obj[fn] = function (...a) { return o(...a) + extra(); }; };
  wrap(Ins, 'html', insHtml); wrap(Credit, 'html', loanHtml); wrap(Estate, 'html', estHtml);
  { const o = Life2.jobsUI.bind(Life2); Life2.jobsUI = function () { o(); const r = UI.cur && UI.cur.render; if (r) UI.cur.render = t => r(t) + gigHtml(); UI.renderBody(); }; }

  Object.assign(UI.H, {
    v24ins: d => { const e = INS24.find(x => x.id === d.id); if (!e || !take(e.p, 'เบี้ยประกัน: ' + e.n)) return; const p = ph(); p.ins[e.id] = Math.max(p.ins[e.id] || 0, S.day) + 7; p.fireSnap = (S.emerg && S.emerg.fires) || 0; UI.toast(`ทำประกัน "${e.n}" คุ้มครองถึง${RD(p.ins[e.id])}`, e.i); },
    v24loan: d => { const e = LOAN24.find(x => x.id === d.id), amt = +d.v; if (!e || !amt) return; const q = quote24(e, amt); if (!q.ok) { UI.toast(`ธนาคารไม่อนุมัติ: ภาระหนี้ต่อรายได้ ${Math.round(q.dsr * 100)}% (เกณฑ์ 60%) หรือเครดิตต่ำ (${Credit.st().score})`, '🏦'); return; }
      Credit.st().loans.push({ kind: 'personal', tag: e.id, left: amt, pay: q.pay, r: q.r, n: q.n, ref: e.n, miss: 0 }); earn(amt); inc('เงินกู้: ' + e.n, amt); log('เงินกู้: ' + e.n, amt); UI.toast(`อนุมัติ ${e.n} ${baht(amt)} ผ่อน ${baht(q.pay)} × ${q.n} เดือน`, e.i); },
    v24fund: d => { const e = FUND24.find(x => x.id === d.id); if (!e || !take(e.p, 'ลงทุน: ' + e.n)) return; ph().fund.push({ id: e.id, n: e.n, amt: e.p, due: S.day + e.days, rate: e.rate, vol: e.vol }); UI.toast(`ซื้อ ${e.n} ครบกำหนด${RD(S.day + e.days)}`, e.i); },
    v24buy: d => { const e = ASSET24.find(x => x.id === d.id); if (!e || !take(e.p, 'ซื้อทรัพย์สิน: ' + e.n)) return; const p = ph(); p.asset[e.id] = (p.asset[e.id] || 0) + 1; UI.toast(`ซื้อ ${e.n} แล้ว ค่าเช่าเข้าทุกวัน`, e.i); },
    v24sell: d => { const e = ASSET24.find(x => x.id === d.id), p = ph(); if (!e || !p.asset[e.id]) return; const v = Math.round(e.p * 0.92); p.asset[e.id]--; if (!p.asset[e.id]) delete p.asset[e.id]; earn(v); inc('ขายทรัพย์สิน', v); log('ขายทรัพย์สิน: ' + e.n, v); UI.toast(`ขาย ${e.n} ได้ ${baht(v)}`, e.i); },
    v24gig: d => {
      const e = GIG24.find(x => x.id === d.id), p = ph(); if (!e || p.gig[e.id] === S.day) return; if (e.need && !Gadgets.has(e.need)) { UI.toast('ยังไม่มีอุปกรณ์ที่ต้องใช้', '⚠️'); return; }
      if (G.driving) { UI.toast('ลงจากรถก่อน', '🚗'); return; } if (!useEnergy(e.en)) return; p.gig[e.id] = S.day; UI.close();
      fade(() => { tick(e.min); earn(e.pay); inc('งานพิเศษ', e.pay); log('ค่าจ้าง: ' + e.n, e.pay); Prog.add(4); UI.toast(`${e.n} เสร็จแล้ว ได้ ${baht(e.pay)}`, e.i); });
    },
  });

  // daily settlement: insurance payouts, matured funds, rent
  {
    const _nd = newDay;
    newDay = function () {
      _nd.apply(this, arguments);
      try {
        const p = ph(), wx = S.weather.type, pay = (e, v, why) => { v = Math.round(v); earn(v); inc('สินไหมประกัน', v); log('สินไหม: ' + e.n, v); Phone.msg('บริษัทประกัน', `${e.n}: ${why} จ่ายสินไหม ${baht(v)}`); };
        const fires = (S.emerg && S.emerg.fires) || 0, newFire = fires > (p.fireSnap == null ? fires : p.fireSnap), theft = S.theftDay >= S.day - 1 && p.theftPaid !== S.theftDay;
        const tk = (typeof Stations2 !== 'undefined' ? Stations2.st().tickets : []), newTk = p.tkN != null && tk.length > p.tkN;
        let out = false; try { out = Power.st().out > 0; } catch (e) { }
        for (const e of INS24) {
          if ((p.ins[e.id] || 0) < S.day) continue;
          if (e.cover === 'storm' && wx === 'storm') pay(e, e.pay, 'พายุเข้าพื้นที่');
          else if (e.cover === 'rain' && (wx === 'rain' || wx === 'storm')) pay(e, e.pay, 'ฝนตกหนัก');
          else if (e.cover === 'hot' && wx === 'sunny' && season().id === 'hot') pay(e, e.pay, 'อากาศร้อนจัด');
          else if (e.cover === 'fog' && wx === 'fog') pay(e, e.pay, 'หมอกลงจัด');
          else if (e.cover === 'sick' && S.sick) pay(e, e.pay, 'เจ็บป่วย');
          else if (e.cover === 'sick2' && S.sick === 2) pay(e, e.pay, 'ป่วยหนัก');
          else if (e.cover === 'theft' && theft) pay(e, e.pay, 'ผลผลิตถูกขโมย');
          else if (e.cover === 'fire' && newFire) pay(e, e.pay, 'เกิดไฟไหม้ในไร่');
          else if (e.cover === 'outage' && out) pay(e, e.pay, 'ไฟฟ้าดับ');
          else if (e.cover === 'ticket' && newTk) { const t = tk[tk.length - 1]; pay(e, (t && t.a || 0) * e.pay, 'ใบสั่งค่าปรับจราจร'); }
          else if (e.cover === 'all' && (wx === 'storm' || wx === 'rain' || newFire || theft)) pay(e, e.pay, 'เหตุภัยที่คุ้มครอง');
        }
        if (theft) p.theftPaid = S.theftDay; p.fireSnap = fires; p.tkN = tk.length;
        for (const f of p.fund.slice()) if (S.day >= f.due) {
          p.fund.splice(p.fund.indexOf(f), 1); const r = f.rate + (f.vol ? (Math.random() * 2 - 1) * f.vol * 1.0 : 0), v = Math.max(0, Math.round(f.amt * (1 + r)));
          S.money += v; log('ครบกำหนด: ' + f.n, v); inc('ผลตอบแทนการลงทุน', Math.max(0, v - f.amt)); Phone.msg('ธนาคารสุขใจ', `${f.n} ครบกำหนด ได้รับ ${baht(v)} (${r >= 0 ? '+' : ''}${(r * 100).toFixed(1)}%)`);
        }
        let rent = 0; for (const e of ASSET24) if (p.asset[e.id]) rent += e.p * e.rate / 7 * p.asset[e.id];
        if (rent >= 1) { rent = Math.round(rent); S.money += rent; inc('ค่าเช่าทรัพย์สิน', rent); log('ค่าเช่ารับรายวัน', rent); }
      } catch (e) { console.warn('phone24 daily', e); }
    };
  }

  // =============== 8. fire station: 14 services ===============
  ITEMS.fireblanket = { n: 'ผ้าห่มดับเพลิง', i: '🧣', cat: 'tool' }; TOOLS.fireblanket = { n: 'ผ้าห่มดับเพลิง', i: '🧣', price: 350, desc: 'คลุมดับไฟกองเล็กได้ทันที 1 ครั้ง' };
  ITEMS.extinguisher_xl = { n: 'ถังดับเพลิงผงเคมี 20 ปอนด์', i: '🧯', cat: 'tool' }; TOOLS.extinguisher_xl = { n: 'ถังดับเพลิงผงเคมี 20 ปอนด์', i: '🧯', price: 1800, desc: 'ดับไฟทุกจุดในรัศมี 14 เมตร 1 ครั้ง' };
  {
    const _fa = Emergency.fireAct.bind(Emergency);
    Emergency.fireAct = function (f) {
      if (count('extinguisher_xl')) return { icon: '🧯', label: 'ฉีดถังดับเพลิงใหญ่ (ดับทั้งรัศมี 14 ม.)', fn: () => { takeItem('extinguisher_xl'); for (const o of Emergency.fires.slice()) if (Math.hypot(o.x - f.x, o.z - f.z) < 14) Emergency.out(o); Sfx.burst(1.4, 1600, 'highpass', 0.2); } };
      if (count('fireblanket')) return { icon: '🧣', label: 'คลุมผ้าห่มดับเพลิง', fn: () => { takeItem('fireblanket'); Emergency.out(f); Sfx.burst(0.5, 700, 'lowpass', 0.12); } };
      return _fa(f);
    };
    const _dz = Emergency.douse.bind(Emergency); Emergency.douse = function (f, amt) { return _dz(f, amt * (ph().hose ? 2 : 1)); };
    const _ig = Emergency.ignite.bind(Emergency);
    Emergency.ignite = function (x, z, why) {
      const p = ph();
      if (why && /ฟ้า/.test(why) && (p.elecOk || 0) >= S.day && Math.random() < 0.6) return;
      if (why && (p.fireCert || 0) >= S.day && Math.random() < 0.15) return;
      return _ig(x, z, why);
    };
  }
  const Gov = () => (typeof window.Gov24 !== 'undefined' ? window.Gov24 : null);
  const docNote = (kind, label, until) => { try { const g = Gov(); if (g && typeof g.addDoc === 'function') g.addDoc(kind, label, until); } catch (e) { } };
  const FIRE24 = [
    ['ext', '🧯', 'ถังดับเพลิงมือถือ', () => `มี ${count('extinguisher')} · ฉีดครั้งเดียวดับไฟรอบตัวหมด`, 600, () => { if (!take(600, 'ถังดับเพลิง')) return; addItem('extinguisher'); Sfx.coin(); }],
    ['xl', '🧯', 'ถังดับเพลิงผงเคมี 20 ปอนด์', () => `มี ${count('extinguisher_xl')} · ดับไฟทุกจุดในรัศมี 14 ม.`, 1800, () => { if (!take(1800, 'ถังดับเพลิงใหญ่')) return; addItem('extinguisher_xl'); Sfx.coin(); }],
    ['blk', '🧣', 'ผ้าห่มดับเพลิง', () => `มี ${count('fireblanket')} · คลุมดับไฟกองเล็ก`, 350, () => { if (!take(350, 'ผ้าห่มดับเพลิง')) return; addItem('fireblanket'); Sfx.coin(); }],
    ['hose', '🚿', 'สายฉีดน้ำแรงดันสูง + หัวฉีด', () => ph().hose ? 'ติดตั้งแล้ว: สาดน้ำดับไฟแรงขึ้น 2 เท่า' : 'สาดน้ำดับไฟแรงขึ้น 2 เท่าถาวร', 2500, () => { const p = ph(); if (p.hose) { UI.toast('ติดตั้งแล้ว', '🚿'); return; } if (!take(2500, 'สายฉีดน้ำแรงดันสูง')) return; p.hose = 1; UI.toast('ติดตั้งสายฉีดน้ำแรงดันสูงแล้ว', '🚿'); }],
    ['train', '🎓', 'อบรมดับเพลิงเบื้องต้น', () => S.fireTrained ? 'ผ่านการอบรมแล้ว' : 'สาดน้ำดับไฟแรงขึ้น 2 เท่า (2 ชม.)', 500, () => UI.H.firetrain()],
    ['cpr', '❤️‍🩹', 'อบรม CPR และปฐมพยาบาล', () => Stations2.st().cpr ? 'ผ่านการอบรมแล้ว' : 'ลดค่าช่วยชีวิตฉุกเฉิน', 700, () => Stations2.cpr()],
    ['insp', '🔍', 'ตรวจความปลอดภัยอัคคีภัยฟาร์ม', () => Stations2.st().fireSafe > S.day ? `ตรวจแล้ว มีผลถึง${RD(Stations2.st().fireSafe)}` : 'ลดโอกาสไฟไหม้ลง 70% เป็นเวลา 14 วัน', 800, () => Stations2.inspect()],
    ['sys', '🚨', 'สัญญาณเตือนไฟ + สปริงเกอร์', () => Stations2.st().fireSys ? 'ติดตั้งแล้ว ไฟในไร่ดับเองช้า ๆ' : 'ไฟในรัศมีไร่ค่อยๆ ดับเอง', 6000, () => Stations2.fireSystem()],
    ['cert', '📜', 'ใบรับรองความปลอดภัยอัคคีภัย (อายุ 90 วัน)', () => (ph().fireCert || 0) >= S.day ? `มีผลถึง${RD(ph().fireCert)}` : 'ต้องผ่านการตรวจฟาร์มก่อน · ลดโอกาสไฟไหม้อีก 15%', 600, () => { const p = ph(); if (!(Stations2.st().fireSafe > S.day)) { UI.toast('ต้องผ่านการตรวจความปลอดภัยฟาร์มก่อน (ยังมีผลอยู่)', '🔍'); return; } if (!take(600, 'ค่าธรรมเนียมใบรับรองอัคคีภัย')) return; p.fireCert = S.day + 90; docNote('fire', 'ใบรับรองความปลอดภัยอัคคีภัย', p.fireCert); UI.toast(`ออกใบรับรองแล้ว มีผลถึง${RD(p.fireCert)}`, '📜'); }],
    ['elec', '⚡', 'ตรวจระบบไฟฟ้าในไร่โดยช่าง (14 วัน)', () => (ph().elecOk || 0) >= S.day ? `มีผลถึง${RD(ph().elecOk)}` : 'ลดไฟไหม้จากฟ้าผ่า 60%', 700, () => { if (!take(700, 'ตรวจระบบไฟฟ้า')) return; ph().elecOk = S.day + 14; UI.toast('ช่างตรวจสายดินและสายล่อฟ้าเสร็จ ลดไฟไหม้จากฟ้าผ่า 14 วัน', '⚡'); }],
    ['stand', '🚒', 'ขอรถดับเพลิงประจำการ 1 วัน', () => 'รถประจำจุดในไร่ ไม่มีไฟไหม้เกิดขึ้นตลอด 24 ชม.', 2000, () => { if (!take(2000, 'รถดับเพลิงประจำการ')) return; S.emerg.calm = Math.max(S.emerg.calm || 0, 1); UI.toast('ขอรถดับเพลิงประจำการแล้ว ปลอดไฟ 24 ชม.', '🚒'); }],
    ['tank', '💧', 'รถน้ำเติมน้ำให้ไร่', () => 'รดน้ำแปลงและเติมน้ำบัวรดน้ำ', 300, () => Stations2.tank()],
    ['shift', '🧑‍🚒', 'อาสาสมัครดับเพลิง (ลงเวร)', () => 'ฝึกดับไฟจำลองในหมู่บ้าน ได้ค่าตอบแทน 400 ฿', 0, () => Stations2.shift()],
    ['tour', '🚒', 'พาลูก ๆ ทัวร์สถานีดับเพลิง', () => 'ลูกมีความสุขขึ้น อารมณ์เรา +10', 100, () => Stations2.tour()],
  ];
  const POLICE24 = [
    ['rep', '📝', 'แจ้งความ / ขอใช้บริการ', () => `คดีของคุณ ${(S.cases || []).filter(c => c.open).length} คดีที่ยังเปิดอยู่`, 0, () => UI.H.reportui()],
    ['lic', '🪪', 'สอบใบขับขี่ / ต่ออายุ', () => S.license ? `ใบขับขี่มีผลถึง${RD(S.licExp || '-')}` : 'ต้องมีใบขับขี่ก่อนขับรถ', 0, () => UI.H.license()],
    ['bounty', '📋', 'กระดานประกาศจับ (รางวัลนำจับ)', () => 'แจ้งเบาะแสผู้ต้องสงสัยรับ 800 ฿', 0, () => Stations2.bountyUI()],
    ['lost', '📦', 'ตู้รับแจ้งของหาย / ส่งคืนของ', () => 'ส่งคืนกระเป๋าสตางค์ที่เก็บได้ รับรางวัลน้ำใจ', 0, () => Stations2.lostUI()],
    ['tsch', '🚦', 'อบรมกฎจราจร (ล้างแต้มใบขับขี่)', () => `แต้มปัจจุบัน ${Stations2.st().points}/5`, 600, () => Stations2.trafficSchool()],
    ['tkt', '🧾', 'ประวัติใบสั่ง / อุทธรณ์ค่าปรับ', () => `ใบสั่งทั้งหมด ${Stations2.st().tickets.length} ใบ`, 0, () => Stations2.ticketsUI()],
    ['cctv', '📹', 'ติดตั้งกล้องวงจรปิดที่ฟาร์ม', () => Stations2.st().cctv ? 'ติดตั้งแล้ว' : 'กล้องจับขโมยได้ 60%', 4000, () => Stations2.cctvUI()],
    ['night', '🔦', 'อาสาเวรยามกลางคืน (20:00–23:00)', () => 'ได้ค่าตอบแทน 350 ฿ ขโมยเข้าไร่ยากขึ้น 2 วัน', 0, () => Stations2.nightWatch()],
    ['debt', '💳', 'ชำระหนี้ค่าปรับค้างจ่าย', () => { const d = (Bank2.st().debt || 0); return d > 0 ? `หนี้ค้างทั้งหมด ${baht(d)} (ค่าปรับและเงินกู้)` : 'ไม่มีหนี้ค้างชำระ'; }, 0, () => { const b = Bank2.st(); const d = b.debt || 0; if (d <= 0) { UI.toast('ไม่มีหนี้ค้างชำระ', '✅'); return; } if (S.money <= 0) { UI.toast('เงินไม่พอ', '💸'); return; } Bank2.repay(d); UI.toast('ชำระหนี้ค้างแล้ว', '💳'); }],
    ['clr', '📜', 'ใบรับรองความประพฤติ (อายุ 180 วัน)', () => (ph().clearance || 0) >= S.day ? `มีผลถึง${RD(ph().clearance)}` : 'ใช้ยื่นสมัครงานและทำธุรกรรม', 100, () => { const p = ph(); if (!take(100, 'ค่าธรรมเนียมใบรับรองความประพฤติ')) return; p.clearance = S.day + 180; docNote('clearance', 'ใบรับรองความประพฤติ', p.clearance); UI.toast(`ออกใบรับรองความประพฤติ มีผลถึง${RD(p.clearance)}`, '📜'); }],
    ['patrol', '🚓', 'ขอสายตรวจเพิ่มรอบไร่ 3 วัน', () => (ph().patrolUntil || 0) >= S.day ? `สายตรวจเพิ่มถึง${RD(ph().patrolUntil)}` : 'ขโมยเข้าไร่ยากขึ้น 30%', 500, () => { const p = ph(); if (!take(500, 'ขอสายตรวจเพิ่ม')) return; p.patrolUntil = S.day + 3; S.emerg.nextThief = Math.max(S.emerg.nextThief || 0, S.day + 1); UI.toast('ตำรวจเพิ่มสายตรวจรอบไร่ 3 วัน', '🚓'); }],
    ['mark', '🏷️', 'จดทะเบียนทรัพย์สินและติดป้ายกันขโมย', () => ph().marked ? 'ติดป้ายแล้ว ขโมยเข้ายากขึ้น 10% ถาวร' : 'ขโมยเข้ายากขึ้น 10% ถาวร', 400, () => { const p = ph(); if (p.marked) { UI.toast('ติดป้ายแล้ว', '🏷️'); return; } if (!take(400, 'จดทะเบียนทรัพย์สิน')) return; p.marked = 1; UI.toast('ติดป้ายและจดทะเบียนทรัพย์สินแล้ว', '🏷️'); }],
    ['review', '🗒️', 'ขอข้อมูลสถิติความปลอดภัยฟาร์ม', () => `ขโมยถูกจับแล้ว ${S.emerg.caught || 0} ครั้ง · ไฟไหม้ ${S.emerg.started || 0} ครั้ง`, 150, () => { if (!take(150, 'ค่าคัดสถิติความปลอดภัย')) return; const m = typeof Sec !== 'undefined' ? Sec.thiefMult() : 1, nt = S.emerg.nextThief || 0; UI.open('สถิติความปลอดภัยฟาร์ม', null, () => `<p class="lead">ข้อมูลจากสถานีตำรวจภูธรสุขใจ ณ ${RD(S.day)}</p><div class="card"><div class="cb"><p>จับขโมยร่วมกับตำรวจ ${S.emerg.caught || 0} ครั้ง · เหตุไฟไหม้ในไร่ ${S.emerg.started || 0} ครั้ง</p><p>ความเสี่ยงขโมยเทียบปกติ ${Math.round(m * 100)}% (ยิ่งต่ำยิ่งปลอดภัย)</p><p>${nt > S.day ? `คาดว่าขโมยจะยังไม่มาก่อน${RD(nt)}` : 'ขโมยอาจมาได้คืนไหนก็ได้ถ้ามีผักสุกในแปลง'}</p></div></div>`); }],
    ['nbh', '🏘️', 'เข้าร่วมกลุ่มชุมชนปลอดภัย (วันละครั้ง)', () => 'พบปะเพื่อนบ้าน ความสนิท +0.3 และขโมยเข้ายากขึ้น 1 วัน', 0, () => { const p = ph(); if (p.nbh === S.day) { UI.toast('เข้าร่วมไปแล้ววันนี้', '🏘️'); return; } p.nbh = S.day; UI.close(); fade(() => { tick(60); S.mood = Math.min(100, (S.mood || 50) + 3); for (const n of U.shuffle ? U.shuffle(G.npcs.filter(o => !o.staff).slice()).slice(0, 3) : G.npcs.filter(o => !o.staff).slice(0, 3)) if (S.friends[n.name] != null) Friends.add(n.name, 0.3); S.emerg.nextThief = Math.max(S.emerg.nextThief || 0, S.day + 1); UI.toast('ร่วมประชุมชุมชนปลอดภัย ได้เพื่อนบ้านช่วยดูแลไร่', '🏘️'); }); }],
  ];
  { const _tm = Sec.thiefMult.bind(Sec); Sec.thiefMult = function () { const p = ph(); return _tm() * ((p.patrolUntil || 0) >= S.day ? 0.7 : 1) * (p.marked ? 0.9 : 1); }; }
  const svcCard = (pre, a, i) => { const price = a[4]; return `<div class="card"><div class="ci">${a[1]}</div><div class="cb"><h4>${esc(a[2])}</h4><p class="dim">${esc(a[3]())}</p><div class="row"><button class="btn ${price ? '' : 'ghost'}" data-a="${pre}" data-i="${i}" ${price && S.money < price ? 'disabled' : ''}>${price ? 'ใช้บริการ ' + baht(price) : 'ใช้บริการ'}</button></div></div></div>`; };
  Object.assign(UI.H, { v24f: d => { const a = FIRE24[+d.i]; if (a) a[5](); }, v24p: d => { const a = POLICE24[+d.i]; if (a) a[5](); } });
  {
    const _su = Emergency.stationUI.bind(Emergency);
    Emergency.stationUI = function (k) {
      if (k !== 'fire' && k !== 'police') return _su(k);
      const L = k === 'fire' ? FIRE24 : POLICE24, pre = k === 'fire' ? 'v24f' : 'v24p';
      UI.open(STATIONS[k].n, null, () => (k === 'police'
        ? `<p class="lead">“สวัสดีครับ ที่นี่สถานีตำรวจภูธรสุขใจ ให้บริการ 24 ชั่วโมง ถ้าเจอคนร้ายโทร <b>191</b>” · จับขโมยร่วมกันแล้ว ${S.emerg.caught || 0} ครั้ง</p>`
        : `<p class="lead">“สวัสดีครับ สถานีดับเพลิงสุขใจพร้อมออกเหตุตลอด 24 ชั่วโมง เห็นไฟไหม้โทร <b>199</b>” · ดับไฟแล้ว ${S.emerg.fires || 0} ครั้ง</p>`) +
        `<h5>${k === 'fire' ? '🚒 บริการและอุปกรณ์ดับเพลิง' : '🚓 บริการสถานีตำรวจ'} (${L.length} รายการ)</h5><div class="grid">${L.map((a, i) => svcCard(pre, a, i)).join('')}</div>`);
    };
  }
  V23.PH24 = { INS24, FUND24, LOAN24, ASSET24, GIG24, FIRE24, POLICE24 };
});
