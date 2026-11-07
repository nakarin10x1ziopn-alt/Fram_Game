'use strict';
// ---------- v24_fest: religious festivals and public holidays on the village calendar (1 game week = 1 month, 12 weeks = 1 year).
// Adds the festivals of Buddhism, Islam, Christianity, Chinese and Hindu traditions, the holidays that close banks and government
// offices, fasting / Buddhist Lent / vegetarian / Kathin periods, worship places, an offering shop and the "ศาสนา & วันสำคัญ" phone app ----------
V23.add('fest24', () => {
  const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const MONTHS_FULL = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  const DIM = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const REL = {
    buddhist: { n: 'ศาสนาพุทธ', i: '☸️' }, muslim: { n: 'ศาสนาอิสลาม', i: '☪️' }, christian: { n: 'ศาสนาคริสต์', i: '✝️' },
    hindu: { n: 'ศาสนาฮินดู / ซิกข์', i: '🕉️' }, chinese: { n: 'ความเชื่อแบบจีน (มหายาน เต๋า ขงจื๊อ)', i: '🏮' }, none: { n: 'ไม่นับถือศาสนา', i: '🧘' },
  };
  const st = () => {
    const s = S.f24 = S.f24 || {};
    s.rel = s.rel || 'buddhist'; s.done = s.done || {}; s.pts = s.pts || {};
    s.lent = s.lent || { pledge: 0, days: 0, last: 0 }; s.fast = s.fast || { pledge: 0, days: 0, brokeDay: 0, last: 0 };
    s.veg = s.veg || { days: {}, paid: 0 }; s.kathin = s.kathin || 0; s.alms = s.alms || 0;
    return s;
  };
  const normRel = g => {
    if (!g) return null; if (REL[g]) return g; g = String(g);
    if (/พุทธ/.test(g)) return 'buddhist'; if (/อิสลาม|มุสลิม/.test(g)) return 'muslim'; if (/คริสต์|คริสเตียน/.test(g)) return 'christian';
    if (/ฮินดู|ซิกข์|พราหมณ์/.test(g)) return 'hindu'; if (/จีน|เต๋า|ขงจื๊อ|มหายาน/.test(g)) return 'chinese'; if (/ไม่มี|ไม่นับถือ|ไม่ระบุ/.test(g)) return 'none';
    return null;
  };
  // the ID-card form (workstream G) is the source of truth when it exists
  const myRel = () => {
    let g = window.Gov24 && Gov24.religion; if (typeof g === 'function') { try { g = g(); } catch (e) { g = null; } }
    return normRel(g) || st().rel;
  };

  // ===== calendar maths: the game year has 84 days, week w (0-11) is month w, day 1-7 inside it (1-5 weekdays, 6-7 weekend) =====
  const yd = d => window.Cal36 ? Cal36.yd(d) : (d - 1) % 84, wk = d => Math.floor(yd(d) / 7), dm = d => (d - 1) % 7 + 1, pos = (w, d) => w * 7 + d - 1, Y = () => Math.floor((S.day - 1) / 84);
  const inRange = (d, a, b) => { const p = yd(d); return a <= b ? p >= a && p <= b : p >= a || p <= b; };
  const PERIODS = {
    ramadan: { n: 'เดือนรอมฎอน (ถือศีลอด)', i: '🌙', a: pos(1, 6), b: pos(2, 3), rel: 'muslim' },
    lent: { n: 'เข้าพรรษา (จำพรรษา 3 เดือน)', i: '🕯️', a: pos(6, 7), b: pos(9, 6), rel: 'buddhist' },
    veg: { n: 'เทศกาลกินเจ / นวราตรี', i: '🥬', a: pos(9, 2), b: pos(9, 3), rel: 'chinese' },
    kathin: { n: 'เทศกาลทอดกฐิน', i: '🧣', a: pos(9, 7), b: pos(10, 5), rel: 'buddhist' },
  };
  const periodsOn = (d = S.day) => Object.keys(PERIODS).filter(k => inRange(d, PERIODS[k].a, PERIODS[k].b));
  const inP = (k, d = S.day) => inRange(d, PERIODS[k].a, PERIODS[k].b);

  // ===== extra calendar days (the older ones in fest2.js stay as they are) =====
  const NEW = [
    { w: 1, d: 6, k: 'ramadan', n: 'ต้นเดือนรอมฎอน', i: '🌙', fx: 'candles', rel: 'muslim', desc: 'มุสลิมเริ่มถือศีลอดตั้งแต่รุ่งอรุณจนตะวันตก ดินละศีลอดด้วยอินทผลัมที่มัสยิดตอนค่ำ (ประมาณตลอดสัปดาห์นี้ถึงต้นเดือนมีนาคม)' },
    { w: 2, d: 5, k: 'eidfitr', n: 'วันอีดิ้ลฟิตริ', i: '🕌', fx: 'confetti', rel: 'muslim', desc: 'วันตรุษหลังสิ้นรอมฎอน ละหมาดอีด ขอพรและแจกซองอีดีให้เด็ก ๆ' },
    { w: 3, d: 1, k: 'qingming', n: 'เช็งเม้ง', i: '🪦', fx: 'candles', rel: 'chinese', desc: 'ไหว้บรรพบุรุษที่สุสาน ถวายอาหาร ธูป และกระดาษเงินกระดาษทอง' },
    { w: 3, d: 2, k: 'easter', n: 'วันอีสเตอร์ · วันจักรี', i: '🥚', fx: 'confetti', rel: 'christian', hol: 1, desc: 'คริสต์ชนฉลองการฟื้นคืนพระชนม์ ร่วมพิธีที่โบสถ์ แจกไข่อีสเตอร์ · วันหยุดวันจักรี (6 เม.ย.) ราชการปิด' },
    { w: 4, d: 2, k: 'coronation', n: 'วันฉัตรมงคล', i: '👑', fx: 'confetti', rel: 'buddhist', hol: 1, desc: 'วันหยุดราชการ ชาวบ้านร่วมพิธีถวายความเคารพ' },
    { w: 4, d: 3, k: 'plough', n: 'วันพืชมงคล (แรกนาขวัญ)', i: '🌾', fx: 'confetti', rel: 'buddhist', hol: 1, desc: 'พิธีแรกนาขวัญเปิดฤดูทำนา เกษตรกรขอพรให้พืชผลงอกงาม' },
    { w: 4, d: 5, k: 'eidadha', n: 'วันอีดิ้ลอัฎฮา', i: '🐑', fx: 'confetti', rel: 'muslim', desc: 'ละหมาดอีดและพิธีกุรบาน แบ่งเนื้อให้คนยากไร้ ญาติ และเพื่อนบ้าน' },
    { w: 6, d: 6, k: 'asanha', n: 'วันอาสาฬหบูชา', i: '🪷', fx: 'candles', rel: 'buddhist', hol: 1, desc: 'วันแสดงปฐมเทศนา เวียนเทียนที่วัด · วันห้ามขายสุรา · วันหยุดราชการ' },
    { w: 6, d: 7, k: 'khaophansa', n: 'วันเข้าพรรษา', i: '🕯️', fx: 'candles', rel: 'buddhist', hol: 1, desc: 'ถวายเทียนพรรษา ผ้าอาบน้ำฝน พระสงฆ์จำพรรษา 3 เดือน · ตั้งปณิธานงดอบายมุข · วันห้ามขายสุรา · วันหยุดราชการ' },
    { w: 8, d: 6, k: 'midautumn', n: 'ไหว้พระจันทร์', i: '🥮', fx: 'lanterns', rel: 'chinese', desc: 'ไหว้พระจันทร์ด้วยขนมไหว้พระจันทร์และผลไม้ ชมจันทร์เต็มดวงกับครอบครัว' },
    { w: 9, d: 2, k: 'vegfest', n: 'เทศกาลกินเจ · นวราตรี', i: '🥬', fx: 'water', rel: 'chinese', desc: 'ถือศีลกินเจ 9 วัน (ธงเหลืองทั่วเมือง) · ฮินดูฉลองนวราตรีบูชาเทวี' },
    { w: 9, d: 4, k: 'rama9', n: 'วันนวมินทรมหาราช', i: '🕯️', fx: 'candles', rel: 'buddhist', hol: 1, desc: 'วันหยุดราชการ ถวายความอาลัย วางพวงมาลา ทำความดีเพื่อพ่อหลวง' },
    { w: 9, d: 5, k: 'piya', n: 'วันปิยมหาราช', i: '🌹', fx: 'confetti', rel: 'buddhist', hol: 1, desc: 'วันหยุดราชการ วางพวงมาลาถวายสักการะพระบรมรูปรัชกาลที่ 5' },
    { w: 9, d: 6, k: 'okphansa', n: 'วันออกพรรษา', i: '🏮', fx: 'candles', rel: 'buddhist', desc: 'ปวารณาออกพรรษา ตักบาตรเทโว สิ้นสุดการจำพรรษา' },
    { w: 10, d: 1, k: 'kathin', n: 'วันทอดกฐิน', i: '🧣', fx: 'confetti', rel: 'buddhist', desc: 'ถวายผ้ากฐินที่วัด ทอดได้ปีละครั้งภายใน 1 เดือนหลังออกพรรษา' },
    { w: 10, d: 2, k: 'diwali', n: 'ดิวาลี (เทศกาลแห่งแสงสว่าง)', i: '🪔', fx: 'lanterns', rel: 'hindu', desc: 'จุดตะเกียงดิยา โรยรังโกลีหน้าบ้าน แบ่งปันขนมหวาน' },
    { w: 11, d: 2, k: 'constitution', n: 'วันรัฐธรรมนูญ', i: '📜', fx: 'confetti', rel: 'buddhist', hol: 1, desc: 'วันหยุดราชการ' },
    { w: 11, d: 6, k: 'xmaseve', n: 'คืนคริสต์มาสอีฟ', i: '⛪', fx: 'confetti', rel: 'christian', desc: 'ร้องเพลงคริสต์มาสและร่วมพิธีมิสซาเที่ยงคืนที่โบสถ์' },
  ];
  for (const e of NEW) if (!CAL.some(x => x.w === e.w && x.d === e.d)) CAL.push(e);
  // which existing days are public holidays / which religion each belongs to
  for (const k of ['newyear', 'makha', 'songkran', 'labour', 'visakha', 'mother', 'father', 'countdown']) { const e = CAL.find(x => x.k === k); if (e) e.hol = 1; }
  for (const [k, r] of [['makha', 'buddhist'], ['visakha', 'buddhist'], ['songkran', 'buddhist'], ['cny', 'chinese'], ['xmas', 'christian'], ['loy', 'buddhist'], ['newyear', 'buddhist']]) { const e = CAL.find(x => x.k === k); if (e && !e.rel) e.rel = r; }
  const dayEvent = (d = S.day) => window.Cal36 ? Cal36.event(d) : CAL.find(e => e.w === wk(d) && e.d === dm(d)) || null;   // real dates when the v36 calendar is loaded
  const isHoliday = (d = S.day) => { const e = dayEvent(d); return !!(e && e.hol); };
  const BAN_KEYS = ['makha', 'visakha', 'asanha', 'khaophansa'];
  const alcoholBan = (d = S.day) => { const e = dayEvent(d); return !!(e && BAN_KEYS.includes(e.k)); };
  window.Cal24 = { isHoliday, alcoholBan, event: dayEvent, periods: periodsOn, dateText: d => `ประมาณ ${Math.max(1, Math.round((dm(d) - 0.5) / 7 * DIM[wk(d)]))} ${MONTHS[wk(d)]} พ.ศ. ${2569 + Math.floor((d - 1) / 84)}`, holidayName: d => { const e = dayEvent(d); return e && e.hol ? e.n : ''; } };

  // ===== offering goods =====
  // [id, name, icon, price, description, religion, fx]
  const GOODS24 = [
    ['alms', 'ชุดใส่บาตร ข้าวสารอาหารแห้ง', '🍚', 120, 'ใส่บาตรพระตอนเช้า (05:30-08:30) หน้าวัด', 'buddhist'],
    ['sangkha', 'ชุดสังฆทาน', '🎁', 450, 'ถวายพระที่วัด ได้บุญมาก', 'buddhist'],
    ['flowers', 'ชุดดอกไม้ ธูป เทียน', '💐', 60, 'ไหว้พระและเวียนเทียน', 'buddhist'],
    ['lentcandle', 'เทียนพรรษา', '🕯️', 350, 'ถวายวันเข้าพรรษา', 'buddhist'],
    ['robe', 'ผ้าไตรจีวร', '🧡', 1200, 'ถวายพระ / ใช้ในพิธีบวช', 'buddhist'],
    ['kathincloth', 'ผ้ากฐิน พร้อมบริวารกฐิน', '🧣', 3500, 'ทอดกฐินที่วัดภายใน 1 เดือนหลังออกพรรษา', 'buddhist'],
    ['fishrelease', 'ปลาเล็กปล่อยทำบุญ', '🐟', 150, 'ปล่อยปลาทำบุญวันสงกรานต์', 'buddhist'],
    ['goldleaf', 'ทองคำเปลวปิดพระ', '✨', 80, 'ปิดทององค์พระ', 'buddhist'],
    ['lantern', 'โคมลอยยี่เป็ง', '🏮', 120, 'ปล่อยโคมวันลอยกระทง', 'buddhist'],
    ['sandpack', 'ทรายและธงก่อเจดีย์ทราย', '⛱️', 100, 'ก่อเจดีย์ทรายถวายวัดวันสงกรานต์', 'buddhist'],
    ['holywater', 'น้ำอบไทยสรงน้ำพระ', '🪷', 90, 'สรงน้ำพระและรดน้ำดำหัวผู้ใหญ่', 'buddhist'],
    ['watergun', 'ปืนฉีดน้ำสงกรานต์', '🔫', 90, 'สนุกสาดน้ำ ใช้ร่วมกิจกรรมสงกรานต์ได้', 'buddhist', { mood: 4 }],
    ['floralshirt', 'เสื้อลายดอกสงกรานต์', '👕', 250, 'ใส่ไปเล่นน้ำ', 'buddhist', { mood: 6 }],
    ['powder', 'แป้งดินสอพองผสมน้ำ', '🤍', 40, 'ทาแก้มวันสงกรานต์', 'buddhist', { mood: 3 }],
    ['dates', 'อินทผลัมหวาน', '🌴', 80, 'ละศีลอดด้วยอินทผลัม', 'muslim', { en: 15, hunger: 25 }],
    ['prayerrug', 'ผ้าปูละหมาด', '🧶', 450, 'ใช้ละหมาดที่มัสยิดและที่บ้าน', 'muslim'],
    ['quran', 'อัลกุรอาน แปลไทย', '📖', 600, 'อ่านและศึกษา', 'muslim', { xp: 40 }],
    ['eidgift', 'ซองอีดีและของขวัญวันอีด', '💌', 200, 'มอบเด็ก ๆ ในวันอีด', 'muslim'],
    ['sheepshare', 'ส่วนร่วมกุรบาน (แกะ)', '🐑', 3500, 'ร่วมพิธีกุรบานวันอีดิ้ลอัฎฮา', 'muslim'],
    ['xmastree', 'ต้นคริสต์มาสตั้งโต๊ะ', '🎄', 1200, 'ตกแต่งบ้านช่วงคริสต์มาส', 'christian', { mood: 8 }],
    ['advent', 'เทียนอาเวนต์', '🕯️', 150, 'จุดเทียนในพิธีที่โบสถ์', 'christian'],
    ['easteregg', 'ไข่อีสเตอร์ช็อกโกแลต', '🥚', 60, 'ของหวานวันอีสเตอร์', 'christian', { mood: 5, hunger: 8 }],
    ['bible', 'พระคัมภีร์ไบเบิล', '📘', 500, 'อ่านและศึกษา', 'christian', { xp: 40 }],
    ['cnyset', 'ชุดไหว้ตรุษจีน', '🧧', 700, 'ไหว้เจ้า บรรพบุรุษ และเทพเจ้า', 'chinese'],
    ['angpao', 'อั่งเปา (ซองแดง)', '🧧', 100, 'แจกให้เด็กและผู้ใหญ่ในหมู่บ้าน', 'chinese'],
    ['joss', 'ธูป กระดาษเงินกระดาษทอง', '🪔', 90, 'เผาไหว้บรรพบุรุษเช็งเม้ง', 'chinese'],
    ['qingmingset', 'ชุดไหว้เช็งเม้ง', '🍊', 600, 'อาหารและผลไม้ไหว้ที่สุสาน', 'chinese'],
    ['mooncake', 'ขนมไหว้พระจันทร์', '🥮', 150, 'ไหว้พระจันทร์หรือกินเอง', 'chinese', { en: 20, hunger: 15, mood: 4 }],
    ['kanomkeng', 'ขนมเข่งและขนมเทียน', '🍡', 80, 'ขนมมงคลวันตรุษจีน', 'chinese', { en: 10, hunger: 12 }],
    ['diya', 'ตะเกียงดิยา', '🪔', 70, 'จุดวันดิวาลีและนวราตรี', 'hindu'],
    ['marigold', 'พวงมาลัยดาวเรือง', '🌼', 50, 'ถวายเทพเจ้า', 'hindu'],
    ['indiansweet', 'ขนมหวานอินเดีย', '🍬', 90, 'ลาดู / กุหลาบจามุน', 'hindu', { en: 12, hunger: 15, mood: 5 }],
    ['rangoli', 'ผงสีรังโกลี', '🎨', 60, 'วาดลวดลายหน้าบ้านวันดิวาลี', 'hindu'],
    ['vegset', 'ชุดอาหารเจ', '🥗', 80, 'ข้าว ผัดผัก เต้าหู้ ไม่มีเนื้อสัตว์', 'chinese', { en: 25, hunger: 40, mood: 4 }],
    ['yellowflag', 'ธงเหลืองเทศกาลกินเจ', '🚩', 30, 'ปักหน้าบ้านและหน้าร้าน', 'chinese', { mood: 2 }],
  ];
  const G24 = {};
  for (const [id, n, i, price, desc, rel, fx] of GOODS24) {
    const key = 'f24_' + id; G24[key] = { id: key, n, i, price, desc, rel, fx: fx || null };
    if (!ITEMS[key]) { ITEMS[key] = { n, i, cat: 'tool', sell: Math.round(price * 0.3) }; TOOLS[key] = { n, i, price, desc }; }
    if (typeof GOODS !== 'undefined' && !GOODS[key]) GOODS[key] = { n, i, price, desc, gift: 0, use: () => { } };
  }
  const TAB_ORDER = [['buddhist', '☸️ ทำบุญ & สงกรานต์'], ['muslim', '☪️ อิสลาม'], ['christian', '✝️ คริสต์'], ['chinese', '🏮 จีน & เจ'], ['hindu', '🕉️ ฮินดู']];
  SHOPS.fest24 = { n: 'ร้านของไหว้หน้าวัด', id: 'fest24', tabs: TAB_ORDER.map(([r, tn]) => ({ n: tn, items: GOODS24.filter(g => g[5] === r).map(g => 'f24:' + g[0]) })).filter(t => t.items.length) };
  // vegetarian food belongs with the Chinese tab but is also sold to everyone; the shop also lists its own kind by religion
  ENTRY_KINDS.f24 = id => { const g = G24['f24_' + id]; return { icon: g.i, name: g.n, desc: g.desc + (g.fx ? '' : ' · ใช้ในกิจกรรมเทศกาล'), price: g.price, own: count(g.id) || 0, block: '', buy: () => addItem(g.id, 1) }; };
  // using a held item: food and small gifts act directly, the others hint where they are used
  { const _ug = UI.H.usegood;
    UI.H.usegood = d => {
      const g = G24[d.id]; if (!g) return _ug(d);
      if (!count(d.id)) return;
      if (!g.fx) { UI.toast(`${g.n}: ${g.desc} (ใช้ตอนร่วมกิจกรรมที่ศาสนสถานหรือวันเทศกาล)`, g.i); return; }
      const fx = g.fx, m = [];
      if (fx.en) { S.energy = Math.min(maxEnergy(), S.energy + fx.en); m.push(`พลังงาน +${fx.en}`); }
      if (fx.hunger) { S.hunger = Math.min(100, (S.hunger ?? 50) + fx.hunger); m.push(`ความหิว +${fx.hunger}`); }
      if (fx.mood) { S.mood = Math.min(100, (S.mood ?? 50) + fx.mood); m.push(`อารมณ์ +${fx.mood}`); }
      if (fx.xp) { Prog.add(fx.xp); m.push(`ประสบการณ์ +${fx.xp}`); }
      if (g.id === 'f24_dates' || g.id === 'f24_vegset') { if (fasting() && g.id === 'f24_dates') { /* breaking fast at dusk is allowed */ } }
      takeItem(d.id); UI.toast(`ใช้${g.n} — ${m.join(' · ')}`, g.i); saveGame(true);
    }; }

  // ===== helpers for activities =====
  const f = st;
  const rm = rel => (rel === myRel() || rel === 'all') ? 1 : 0.5;     // guests at another faith's ceremony earn half
  const hh = () => S.time / 60;
  const once = key => { const s = f(); const k = key + ':' + S.day; if (s.done[k]) return false; s.done[k] = 1; const ks = Object.keys(s.done); if (ks.length > 120) for (const x of ks.slice(0, 40)) delete s.done[x]; return true; };
  const done = key => !!f().done[key + ':' + S.day];
  const friendsUp = v => { for (const n of G.npcs) if (!n.staff && S.friends && S.friends[n.name] != null) Friends.add(n.name, v); };
  const merit = n => { const s2 = Social2.st(); s2.merit = (s2.merit || 0) + n; };
  const addPts = (rel, n) => { const s = f(); s.pts[rel] = (s.pts[rel] || 0) + n; };
  // pay with the offering you hold, else buy it on the spot at the stall price
  const offer = (item, why) => {
    if (!item) return true; const g = G24[item];
    if (count(item) > 0) { takeItem(item); return true; }
    if (S.money < g.price) { UI.toast(`ต้องมี${g.n} (ซื้อที่ร้านของไหว้หน้าวัด ${baht(g.price)})`, g.i); return false; }
    S.money -= g.price; Bank2.log(g.n + (why ? ' (' + why + ')' : ''), -g.price); return true;
  };
  const apply = (a, rel) => {
    const k = rm(rel), m = [];
    if (a.mood) { const v = Math.round(a.mood * k); S.mood = Math.min(100, (S.mood || 50) + v); m.push(`อารมณ์ +${v}`); }
    if (a.merit) { const v = Math.round(a.merit * k); merit(v); m.push(`บุญสะสม +${v}`); }
    if (a.pts) { const v = Math.round(a.pts * k); addPts(rel, v); m.push(`ความศรัทธา +${v}`); }
    if (a.xp) { Prog.add(a.xp); m.push(`ประสบการณ์ +${a.xp}`); }
    if (a.luck) { (S.buff = S.buff || {}).luck = S.day + a.luck; m.push(`โชคดี ${a.luck} วัน`); }
    if (a.friends) { friendsUp(a.friends * k); m.push('ชาวบ้านชื่นชม'); }
    if (a.hunger) { S.hunger = Math.min(100, (S.hunger ?? 50) + a.hunger); m.push(`ความหิว +${a.hunger}`); }
    if (a.en) { S.energy = Math.min(maxEnergy(), S.energy + a.en); }
    if (a.gain) { earn(a.gain); Bank2.income && Bank2.income(a.why || 'ของขวัญเทศกาล', a.gain); m.push(`ได้รับ ${baht(a.gain)}`); }
    if (a.grow) { const pl = S.plots.filter(p => p.c); pl.forEach(p => { p.w = 1; const C = CROPS[p.c]; if (C) p.g = Math.min(C.grow, p.g + a.grow); }); m.push(pl.length ? `พืช ${pl.length} แปลงได้น้ำและโตเพิ่ม ${a.grow} ชม.` : 'ยังไม่มีพืชในแปลงให้โตเพิ่ม'); }
    return m;
  };
  // an activity: id, label, rel, item (offering used), cash (extra baht), energy, minutes (time passes), fx, text, cond (reason string when not possible)
  const run = a => {
    if (a.cond) { const why = a.cond(); if (why) { UI.toast(why, a.i || '🙏'); return; } }
    if (done(a.id)) { UI.toast('ทำกิจกรรมนี้ไปแล้ววันนี้', '🙏'); return; }
    if (a.energy && S.energy < a.energy) { UI.toast('พลังงานไม่พอ', '😫'); return; }
    if (a.cash && S.money < a.cash) { UI.toast(`เงินไม่พอ ต้องใช้ ${baht(a.cash)}`, '💸'); return; }
    if (!offer(a.item, a.t)) return;
    if (a.cash) { S.money -= a.cash; Bank2.log(a.t, -a.cash); }
    once(a.id); if (a.energy) useEnergy(a.energy);
    const go = () => { const m = apply(a.fx || {}, a.rel); if (a.after) a.after(); UI.toast(`${a.text || a.t} — ${m.join(' · ')}`, a.i || '🙏'); saveGame(true); };
    if (a.minutes) fade(() => { tick(a.minutes); go(); }); else go();
  };
  UI.H.f24act = d => { const a = ACT[d.id]; if (!a) return; UI.close(); run(a); };
  const ACT = {};
  const A = (id, t, rel, o) => { const a = Object.assign({ id, t, rel }, o); ACT[id] = a; return a; };

  // ----- the activity catalogue by calendar event -----
  const EX = {
    newyear: [A('ny_pray', 'สวดมนต์ข้ามปีและขอพรปีใหม่', 'buddhist', { item: 'f24_flowers', minutes: 45, fx: { mood: 10, merit: 150, pts: 15 }, i: '🙏' })],
    cny: [A('cny_pray', 'ไหว้เจ้าและบรรพบุรุษด้วยชุดไหว้ตรุษจีน', 'chinese', { item: 'f24_cnyset', fx: { mood: 12, luck: 3, pts: 20 }, i: '🧧' }),
      A('cny_angpao', 'แจกอั่งเปาให้เด็ก ๆ (5 ซอง)', 'chinese', { cash: 500, fx: { mood: 10, friends: 0.4, pts: 10 }, i: '🧧' })],
    makha: [A('mk_alms', 'ตักบาตรและฟังเทศน์วันมาฆบูชา', 'buddhist', { item: 'f24_sangkha', minutes: 60, fx: { mood: 14, merit: 700, pts: 30, xp: 20 }, i: '🪷' })],
    ramadan: [A('rm_pledge', 'ตั้งใจถือศีลอดตลอดเดือนรอมฎอน', 'muslim', { after: () => { const s = f().fast; s.pledge = 1; s.days = 0; s.last = Y(); }, fx: { mood: 6, pts: 20 }, i: '🌙', text: 'ตั้งใจถือศีลอด งดอาหารและน้ำตั้งแต่ 05:00 ถึง 18:30' }),
      A('rm_iftar', 'ละศีลอดที่มัสยิดด้วยอินทผลัม (หลัง 18:30)', 'muslim', { item: 'f24_dates', cond: () => hh() < 18.5 || hh() > 21 ? 'ละศีลอดได้ช่วง 18:30-21:00' : '', fx: { en: 25, hunger: 40, mood: 10, pts: 25 }, i: '🌙', text: 'ละศีลอดร่วมกับชุมชน' })],
    eidfitr: [A('ef_pray', 'ละหมาดอีดที่มัสยิด', 'muslim', { item: 'f24_prayerrug', minutes: 60, fx: { mood: 18, pts: 40, friends: 0.3 }, i: '🕌' }),
      A('ef_gift', 'มอบซองอีดีให้เด็ก ๆ', 'muslim', { item: 'f24_eidgift', fx: { mood: 10, friends: 0.5, pts: 15 }, i: '💌' })],
    qingming: [A('qm_grave', 'ไหว้บรรพบุรุษที่สุสาน (เช็งเม้ง)', 'chinese', { item: 'f24_qingmingset', minutes: 90, energy: 8, fx: { mood: 12, luck: 2, pts: 30 }, i: '🪦' }),
      A('qm_joss', 'เผากระดาษเงินกระดาษทอง', 'chinese', { item: 'f24_joss', fx: { mood: 5, pts: 10 }, i: '🪔' })],
    easter: [A('es_mass', 'ร่วมพิธีวันอีสเตอร์ที่โบสถ์', 'christian', { item: 'f24_advent', minutes: 90, fx: { mood: 16, pts: 35 }, i: '⛪' }),
      A('es_egg', 'แจกไข่อีสเตอร์ให้เด็ก ๆ', 'christian', { item: 'f24_easteregg', fx: { mood: 8, friends: 0.3, pts: 10 }, i: '🥚' })],
    songkran: [A('sk_water', 'สรงน้ำพระและรดน้ำดำหัวผู้ใหญ่', 'buddhist', { item: 'f24_holywater', minutes: 60, fx: { mood: 12, merit: 300, pts: 20, friends: 0.5 }, i: '🪷' }),
      A('sk_sand', 'ก่อเจดีย์ทรายถวายวัด', 'buddhist', { item: 'f24_sandpack', energy: 10, minutes: 60, fx: { mood: 10, merit: 400, pts: 20 }, i: '⛱️' }),
      A('sk_fish', 'ปล่อยปลาทำบุญ', 'buddhist', { item: 'f24_fishrelease', fx: { mood: 8, merit: 250, pts: 15 }, i: '🐟' }),
      A('sk_play', 'เล่นสาดน้ำกับชาวบ้าน', 'buddhist', { item: 'f24_watergun', energy: 6, fx: { mood: 14, friends: 0.3 }, i: '💦' })],
    coronation: [A('cn_bow', 'ร่วมพิธีถวายความเคารพ', 'buddhist', { fx: { mood: 6, pts: 5, friends: 0.1 }, i: '👑' })],
    plough: [A('pl_rite', 'ร่วมพิธีแรกนาขวัญและขอพรให้ผลผลิตงอกงาม', 'buddhist', { cash: 100, minutes: 60, fx: { mood: 10, merit: 150, pts: 10, grow: 8 }, i: '🌾', text: 'ได้ข้าวพันธุ์มงคลมาปลูก' })],
    visakha: [A('vs_pray', 'ถวายดอกไม้ธูปเทียนและเวียนเทียน', 'buddhist', { item: 'f24_flowers', minutes: 90, fx: { mood: 16, merit: 800, pts: 35 }, i: '🪔' })],
    eidadha: [A('ea_pray', 'ละหมาดอีดอัฎฮา', 'muslim', { item: 'f24_prayerrug', minutes: 60, fx: { mood: 12, pts: 30 }, i: '🕌' }),
      A('ea_qurban', 'ร่วมกุรบานและแบ่งเนื้อให้ผู้ยากไร้', 'muslim', { item: 'f24_sheepshare', fx: { mood: 18, pts: 60, friends: 0.8 }, i: '🐑' })],
    asanha: [A('as_pray', 'ถวายสังฆทานและเวียนเทียนอาสาฬหบูชา', 'buddhist', { item: 'f24_sangkha', minutes: 90, fx: { mood: 16, merit: 800, pts: 35 }, i: '🪷' })],
    khaophansa: [A('kp_candle', 'ถวายเทียนพรรษาและผ้าอาบน้ำฝน', 'buddhist', { item: 'f24_lentcandle', fx: { mood: 14, merit: 600, pts: 30 }, i: '🕯️' }),
      A('kp_pledge', 'ตั้งปณิธานเข้าพรรษา (ตักบาตรเช้าให้ได้อย่างน้อย 8 ครั้ง)', 'buddhist', { after: () => { const l = f().lent; l.pledge = 1; l.days = 0; l.last = 0; }, fx: { mood: 8, pts: 15 }, i: '🕯️', text: 'ตั้งปณิธานจำพรรษา' }),
      A('kp_ordain', 'ร่วมงานบวชนาคเข้าพรรษา', 'buddhist', { item: 'f24_robe', after: () => { try { Social2.ordain(); } catch (e) { } }, fx: { merit: 1200, pts: 40 }, i: '🧡', text: 'ร่วมแห่นาค ถวายไตรจีวรให้พระใหม่' })],
    midautumn: [A('ma_moon', 'ไหว้พระจันทร์และชมจันทร์กับครอบครัว', 'chinese', { item: 'f24_mooncake', minutes: 60, fx: { mood: 14, luck: 2, pts: 20 }, i: '🥮' })],
    vegfest: [A('vf_meal', 'กินเจที่ซุ้มอาหารเจ', 'chinese', { item: 'f24_vegset', after: () => { const v = f().veg; v.days[Y() + ':' + S.day] = 1; }, fx: { en: 25, hunger: 40, mood: 4, merit: 100, pts: 10 }, i: '🥬', text: 'ถือศีลกินเจ ร่างกายสดชื่น' }),
      A('vf_flag', 'ปักธงเหลืองหน้าบ้านและร่วมขบวนแห่', 'chinese', { item: 'f24_yellowflag', fx: { mood: 8, pts: 12, friends: 0.2 }, i: '🚩' })],
    rama9: [A('r9_wreath', 'วางพวงมาลาถวายความอาลัย', 'buddhist', { item: 'f24_flowers', fx: { mood: 6, merit: 200, pts: 10, friends: 0.2 }, i: '🕯️' })],
    piya: [A('py_wreath', 'วางพวงมาลาถวายสักการะรัชกาลที่ 5', 'buddhist', { item: 'f24_flowers', fx: { mood: 6, merit: 150, pts: 8 }, i: '🌹' })],
    okphansa: [A('op_tevo', 'ตักบาตรเทโวและฟังธรรมออกพรรษา', 'buddhist', { item: 'f24_alms', minutes: 60, fx: { mood: 14, merit: 700, pts: 30 }, i: '🏮' })],
    kathin: [A('kt_small', 'ทอดกฐินสามัคคีร่วมกับชาวบ้าน', 'buddhist', { cash: 1000, cond: () => f().kathin === Y() + 1 ? 'ปีนี้ทอดกฐินแล้ว' : '', after: () => { f().kathin = Y() + 1; }, fx: { mood: 16, merit: 1000, pts: 40, friends: 0.5 }, i: '🧣' }),
      A('kt_big', 'ทอดกฐินด้วยผ้ากฐินพร้อมบริวาร', 'buddhist', { item: 'f24_kathincloth', cond: () => f().kathin === Y() + 1 ? 'ปีนี้ทอดกฐินแล้ว' : '', after: () => { f().kathin = Y() + 1; }, minutes: 120, fx: { mood: 25, merit: 4000, pts: 100, friends: 1, luck: 7 }, i: '🧣', text: 'ทอดกฐินเป็นประธาน หลวงพ่อให้ศีลให้พร' })],
    diwali: [A('dw_diya', 'จุดตะเกียงดิยาและโรยรังโกลี', 'hindu', { item: 'f24_diya', fx: { mood: 14, luck: 2, pts: 25 }, i: '🪔' }),
      A('dw_sweet', 'แบ่งขนมหวานให้เพื่อนบ้าน', 'hindu', { item: 'f24_indiansweet', fx: { mood: 8, friends: 0.4, pts: 12 }, i: '🍬' })],
    loy: [A('ly_lantern', 'ปล่อยโคมยี่เป็ง', 'buddhist', { item: 'f24_lantern', fx: { mood: 12, luck: 2, merit: 150, pts: 15 }, i: '🏮' })],
    constitution: [A('cs_flag', 'ร่วมพิธีวันรัฐธรรมนูญที่ศาลากลาง', 'buddhist', { fx: { mood: 4, friends: 0.1 }, i: '📜' })],
    xmaseve: [A('xe_mass', 'ร่วมพิธีมิสซาคืนคริสต์มาสอีฟ', 'christian', { item: 'f24_advent', minutes: 90, fx: { mood: 18, pts: 40 }, i: '⛪' })],
    xmas: [A('xm_mass', 'ร่วมพิธีวันคริสต์มาสที่โบสถ์', 'christian', { item: 'f24_bible', minutes: 60, fx: { mood: 14, pts: 30 }, i: '🎄' })],
    father: [A('fa_merit', 'ทำบุญตักบาตรถวายพ่อหลวง', 'buddhist', { item: 'f24_alms', fx: { mood: 8, merit: 300, pts: 15 }, i: '💛' })],
    mother: [A('mo_merit', 'ทำบุญอุทิศให้แม่', 'buddhist', { item: 'f24_flowers', fx: { mood: 8, merit: 200, pts: 10 }, i: '🌼' })],
  };
  // add the faith activities to the plaza menu of each festival
  { const _acts = Fest2.acts;
    Fest2.acts = function (e) {
      const base = _acts.call(this, e) || [];
      const extra = (EX[e.k] || []).map(a => [`${a.i || '🙏'} ${a.t}${a.item ? ` (ใช้${G24[a.item].n})` : a.cash ? ` (${baht(a.cash)})` : ''}`, () => run(a)]);
      return base.concat(extra);
    };
  }

  // ===== holidays: banks and government offices close, government jobs rest =====
  { const _wd = Civic.weekday.bind(Civic); Civic.weekday = function (d = S.day) { return _wd(d) && !isHoliday(d); }; }
  if (typeof Career !== 'undefined' && Career.shift) { const _sh = Career.shift.bind(Career); Career.shift = function (d = S.day) { const C = this.C && this.C(); if (C && C.gov && isHoliday(d)) return null; return _sh(d); }; }
  if (typeof Bank2 !== 'undefined' && Bank2.ui) {
    const _bu = Bank2.ui.bind(Bank2);
    Bank2.ui = function (...a) { if (isHoliday()) { const e = dayEvent(); UI.toast(`ธนาคารปิดทำการ (${e.n} · วันหยุดราชการ) ใช้ตู้ ATM หรือแอปธนาคารบนมือถือได้`, '🏦'); return; } return _bu.apply(this, a); };
  }
  // the beach bar sells alcohol: closed on the holy days when alcohol sales are banned
  { const _shop = UI.shop.bind(UI); UI.shop = function (id) { if (id === 'islandbar' && alcoholBan()) { const e = dayEvent(); UI.toast(`บาร์ปิดทำการ (${e.n} · ห้ามขายสุรา) กลับมาเปิดวันพรุ่งนี้`, '🍹'); return; } return _shop(id); }; }

  // ===== fasting (Ramadan): 05:00-18:30 =====
  const fasting = () => { const s = f().fast; return s.pledge && inP('ramadan') && hh() >= 5 && hh() < 18.5; };
  { const _eat = eat;
    eat = function (id) {
      const before = S.energy; const it = ITEMS[id];
      if (fasting() && it && it.en && f().fast.brokeDay !== S.day) { f().fast.brokeDay = S.day; S.mood = Math.max(0, (S.mood || 50) - 8); UI.toast('ผิดศีลอด: กินระหว่างถือศีลอด (อารมณ์ −8) วันนี้ไม่นับเป็นวันถือศีลอด', '🌙'); }
      return _eat(id);
    };
  }
  if (typeof Food !== 'undefined' && Food.dine) { const _d = Food.dine.bind(Food); Food.dine = function (...a) { if (fasting() && f().fast.brokeDay !== S.day) { f().fast.brokeDay = S.day; S.mood = Math.max(0, (S.mood || 50) - 8); UI.toast('ผิดศีลอด: ทานอาหารระหว่างถือศีลอด (อารมณ์ −8)', '🌙'); } return _d(...a); }; }

  // ===== alms round: every morning in front of the temple =====
  const almsTime = () => hh() >= 5.5 && hh() < 8.5;
  const doAlms = () => {
    if (!almsTime()) { UI.toast('พระสงฆ์บิณฑบาตช่วง 05:30-08:30 มาใหม่ตอนเช้า', '🧡'); return; }
    if (done('alms')) { UI.toast('ตักบาตรวันนี้แล้ว', '🧡'); return; }
    if (!offer('f24_alms', 'ตักบาตร')) return;
    once('alms'); const s = f(); s.alms++;
    S.mood = Math.min(100, (S.mood || 50) + 8); merit(inP('lent') ? 300 : 150); addPts('buddhist', 10);
    if (s.lent.pledge && inP('lent')) { s.lent.days++; s.lent.last = S.day; }
    playAct && playAct('plant', 0.7); Sfx.tone(392, 0.6, 'sine', 0.05);
    UI.toast(`ใส่บาตรพระสงฆ์ อิ่มบุญ${inP('lent') ? ' (ช่วงเข้าพรรษา บุญ ×2)' : ''}${s.lent.pledge && inP('lent') ? ` · จำพรรษาตักบาตรแล้ว ${s.lent.days} ครั้ง` : ''}`, '🧡'); saveGame(true);
  };

  // ===== daily hook =====
  const day = () => {
    const s = f(), e = dayEvent();
    // yesterday's fasting counts if it was not broken
    if (s.fast.pledge && s.fast.last === Y() && inP('ramadan', S.day - 1) && s.fast.brokeDay !== S.day - 1 && !G.simulating) {
      s.fast.days++; S.mood = Math.min(100, (S.mood || 50) + 4); addPts('muslim', 10);
    }
    if (s.fast.pledge && !inP('ramadan')) {
      const dn = s.fast.days; s.fast.pledge = 0;
      if (dn >= 4) { S.mood = Math.min(100, (S.mood || 50) + 15); addPts('muslim', 60); Phone.msg('อิหม่ามประจำมัสยิด', `ขอแสดงความยินดี คุณถือศีลอดครบ ${dn} วันตลอดเดือนรอมฎอน ขอให้อัลลอฮ์ทรงตอบรับ`); }
      else Phone.msg('อิหม่ามประจำมัสยิด', `เดือนรอมฎอนจบแล้ว คุณถือศีลอดได้ ${dn} วัน ปีหน้าตั้งใจใหม่นะ`);
    }
    if (s.lent.pledge && !inP('lent')) {
      const dn = s.lent.days; s.lent.pledge = 0;
      if (dn >= 8) { merit(3000); addPts('buddhist', 120); S.mood = Math.min(100, (S.mood || 50) + 20); (S.buff = S.buff || {}).luck = S.day + 5; Phone.msg('หลวงพ่อสมปอง', `โยมตักบาตรครบ ${dn} ครั้งตลอดพรรษา อนุโมทนา บุญสะสม +3,000 โชคดี 5 วัน`); }
      else Phone.msg('หลวงพ่อสมปอง', `ออกพรรษาแล้ว โยมตักบาตรได้ ${dn} ครั้ง ไม่เป็นไร ปีหน้าตั้งใจใหม่นะโยม`);
    }
    // the faithful feel it: a long record of devotion lifts the mood slightly every morning
    if ((s.pts[myRel()] || 0) >= 1000) S.mood = Math.min(100, (S.mood || 50) + 2);
    if (!G.simulating) {
      if (isHoliday()) Phone.msg('ข่าวหมู่บ้าน', `วันนี้ ${e.i} ${e.n} เป็นวันหยุดราชการ ธนาคารสาขาและส่วนราชการปิดทำการ${alcoholBan() ? ' · ห้ามขายสุรา' : ''}`, true);
      const ps = periodsOn(); for (const k of ps) { const P = PERIODS[k]; if (inRange(S.day - 1, P.a, P.b) === false) Phone.msg('ข่าวหมู่บ้าน', `เริ่ม${P.n} ${P.i}`, true); }
      if (e && e.rel && myRel() !== 'none' && e.rel === myRel()) Phone.msg('ศาสนา & วันสำคัญ', `วันนี้ ${e.i} ${e.n} — ดูกิจกรรมได้ที่แอป 🛐 หรือที่ลานน้ำพุ/ศาสนสถาน`, true);
    }
    drawDecor();
  };
  { const _d = Fest2.day; Fest2.day = function () { _d.apply(this, arguments); try { day(); } catch (e) { console.warn('fest24 day', e); } }; }

  // ===== places of worship and the offering stall =====
  const TEMPLE = World.pois.find(p => p.label === 'วัดสุขใจาราม');
  const TP = TEMPLE ? { x: TEMPLE.x - 7.5, z: TEMPLE.z } : { x: -31.5, z: -325 };
  const SITES = [
    { id: 'mosque', rel: 'muslim', n: 'มัสยิดนูรุลอิสลาม', i: '🕌', x: TP.x - 38, z: TP.z, col: 0xf5f5f5, kind: 'dome', svc: { d: 5, h0: 12.5, h1: 13.5, n: 'ละหมาดวันศุกร์ (ญุมุอะฮ์)' }, daily: 'ละหมาดและขอพร', donate: 'บริจาคซะกาต / ซอดะเกาะฮ์' },
    { id: 'church', rel: 'christian', n: 'โบสถ์คริสต์เมตตาธรรม', i: '⛪', x: TP.x - 58, z: TP.z, col: 0xfff3e0, kind: 'church', svc: { d: 7, h0: 9, h1: 11, n: 'นมัสการวันอาทิตย์' }, daily: 'อธิษฐานในโบสถ์', donate: 'ถวายทรัพย์ถวายแด่พระเจ้า' },
    { id: 'shrine', rel: 'chinese', n: 'ศาลเจ้าแม่กวนอิมสุขใจ', i: '🏮', x: TP.x - 78, z: TP.z, col: 0xc62828, kind: 'pagoda', svc: { d: 1, h0: 8, h1: 11, n: 'ไหว้เจ้าวันแรกของเดือน' }, daily: 'จุดธูปไหว้เจ้า', donate: 'ทำบุญบำรุงศาลเจ้า' },
    { id: 'hindu', rel: 'hindu', n: 'เทวสถานพระพิฆเนศ', i: '🕉️', x: TP.x - 98, z: TP.z, col: 0xff8f00, kind: 'hindu', svc: { d: 2, h0: 17, h1: 19, n: 'พิธีอารตีเย็นวันอังคาร' }, daily: 'ถวายดอกไม้และสวดบูชา', donate: 'ทำบุญบำรุงเทวสถาน' },
  ];
  const buildSite = S0 => {
    const g = new THREE.Group(); g.position.set(S0.x, World.groundY(S0.x, S0.z), S0.z); g.rotation.y = -Math.PI / 2; World.outdoor.add(g);
    const wall = mc(S0.col, { roughness: 0.85 }), roof = mc(S0.kind === 'dome' ? 0x2e7d32 : S0.kind === 'church' ? 0x5d4037 : S0.kind === 'pagoda' ? 0x6d1b1b : 0xd84315, { roughness: 0.7 }), gold = mc(0xd9b44a, { metalness: 0.6, roughness: 0.3 });
    U.mk(g, GEO.box, wall, [0, 2.2, 0], [7, 4.4, 6]);
    if (S0.kind === 'dome') {
      U.mk(g, GEO.sph, mc(0x43a047, { roughness: 0.5 }), [0, 4.6, 0], [3.2, 2.4, 3.2]); U.mk(g, GEO.cone, gold, [0, 7.1, 0], [0.18, 1.2, 0.18]);
      for (const s of [-1, 1]) { U.mk(g, GEO.cylLo, wall, [s * 4, 4.2, 3], [0.55, 8.4, 0.55]); U.mk(g, GEO.cone, roof, [s * 4, 8.8, 3], [0.7, 1.2, 0.7]); }
    } else if (S0.kind === 'church') {
      const r = U.mk(g, GEO.cone, roof, [0, 5.6, 0], [5.6, 2.4, 4.6]); r.rotation.y = Math.PI / 4;
      U.mk(g, GEO.box, wall, [0, 6.2, 3.4], [1.8, 4, 1.8]); U.mk(g, GEO.cone, roof, [0, 9, 3.4], [1.6, 1.8, 1.6]); U.mk(g, GEO.box, gold, [0, 10.4, 3.4], [0.15, 1.1, 0.15]); U.mk(g, GEO.box, gold, [0, 10.6, 3.4], [0.7, 0.15, 0.15]);
    } else if (S0.kind === 'pagoda') {
      for (let k = 0; k < 3; k++) { const rr = U.mk(g, GEO.cone, roof, [0, 4.7 + k * 1.6, 0], [5.4 - k * 1.3, 1.1, 5 - k * 1.2]); rr.rotation.y = Math.PI / 4; }
      U.mk(g, GEO.sph, gold, [0, 9.8, 0], 0.4); for (const s of [-1, 1]) U.mk(g, GEO.cylLo, mc(0xb71c1c), [s * 2.6, 1.8, 3.3], [0.3, 3.6, 0.3]);
    } else {
      for (let k = 0; k < 4; k++) U.mk(g, GEO.cone, mc(k % 2 ? 0xff8f00 : 0xd84315), [0, 5 + k * 1.4, 0], [4.8 - k * 1.1, 1.5, 4.8 - k * 1.1]);
      U.mk(g, GEO.sph, gold, [0, 10.8, 0], 0.4);
    }
    const sm = new THREE.MeshStandardMaterial({ map: U.signTex(S0.n, { bg: '#37474f' }), roughness: 0.7 });
    U.mk(g, new THREE.PlaneGeometry(4.6, 0.7), sm, [0, 3.7, 3.04]);
    Col.box(S0.x, S0.z, 3.6, 3.1, -Math.PI / 2, 'bld'); World.clearNear && World.clearNear(S0.x, S0.z, 9, true);
    return g;
  };
  const siteUI = S0 => {
    const k = S0.rel; const svcNow = (() => { const d = dm(S.day), h = hh(); return d === S0.svc.d && h >= S0.svc.h0 && h < S0.svc.h1; })();
    UI.open(S0.n, null, () => {
      const same = myRel() === k, pts = f().pts[k] || 0;
      const buttons = [
        `<button class="btn" data-a="f24site" data-v="${S0.id}" data-k="pray">${S0.i} ${S0.daily} (ฟรี · วันละครั้ง)</button>`,
        `<button class="btn" data-a="f24site" data-v="${S0.id}" data-k="donate" ${S.money < 100 ? 'disabled' : ''}>🪙 ${S0.donate} 100 ฿</button>`,
        `<button class="btn ${svcNow ? '' : 'ghost'}" data-a="f24site" data-v="${S0.id}" data-k="svc">${svcNow ? '🛐' : '🔒'} ${S0.svc.n} (${MON_DAY[S0.svc.d]} ${String(S0.svc.h0).replace('.5', ':30').padStart(2, '0')}${S0.svc.h0 % 1 ? '' : ':00'}-${Math.floor(S0.svc.h1)}:${S0.svc.h1 % 1 ? '30' : '00'} น.)</button>`,
      ].join('');
      return `<p class="lead">${S0.i} ${esc(REL[k].n)} · ${same ? 'ศาสนาของคุณ' : 'ศาสนสถานของศาสนาอื่น ยินดีต้อนรับผู้มาเยือนทุกท่าน (ได้ผลครึ่งหนึ่ง)'} · ความศรัทธาสะสม ${pts}</p>
        <p class="dim">เข้าร่วมพิธีวันสำคัญทางศาสนาได้ที่ลานน้ำพุหมู่บ้านและที่แอป 🛐 ศาสนา & วันสำคัญ</p><div class="menu">${buttons}</div>`;
    });
  };
  const MON_DAY = ['', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์', 'วันอาทิตย์'];
  UI.H.f24site = d => {
    const S0 = SITES.find(x => x.id === d.v); if (!S0) return; const rel = S0.rel;
    if (d.k === 'pray') { if (!once('pray_' + S0.id)) { UI.toast('วันนี้อธิษฐานไปแล้ว', S0.i); return; } UI.close(); fade(() => { tick(20); const m = apply({ mood: 6, pts: 8, merit: rel === 'buddhist' ? 80 : 0 }, rel); UI.toast(`${S0.daily} — ${m.join(' · ')}`, S0.i); }); }
    else if (d.k === 'donate') { if (S.money < 100) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(100), '💸'); return; } S.money -= 100; Bank2.log(S0.donate, -100); const m = apply({ mood: 5, pts: 12, friends: 0.05 }, rel); UI.toast(`${S0.donate} 100 ฿ — ${m.join(' · ')}`, S0.i); UI.renderBody && UI.renderBody(); }
    else if (d.k === 'svc') {
      const d0 = dm(S.day), h = hh();
      if (!(d0 === S0.svc.d && h >= S0.svc.h0 && h < S0.svc.h1)) { UI.toast(`พิธีนี้จัด ${MON_DAY[S0.svc.d]} ช่วงเวลาที่กำหนด`, S0.i); return; }
      if (!once('svc_' + S0.id)) { UI.toast('ร่วมพิธีวันนี้ไปแล้ว', S0.i); return; }
      UI.close(); fade(() => { tick(60); const m = apply({ mood: 14, pts: 25, friends: 0.2 }, rel); UI.toast(`ร่วม${S0.svc.n} — ${m.join(' · ')}`, S0.i); });
    }
  };
  const decorGroups = [];
  const drawDecor = () => {
    while (decorGroups.length) { const g = decorGroups.pop(); World.outdoor.remove(g); }
    const e = dayEvent(), ps = periodsOn(), keys = new Set((e ? [e.k] : []).concat(ps));
    const glow = c => new THREE.MeshBasicMaterial({ color: c, toneMapped: false });
    const strings = (cx, cz, w, col, n = 12, y = 4.4) => { const g = new THREE.Group(); g.position.set(cx, World.groundY(cx, cz), cz); World.outdoor.add(g); decorGroups.push(g); for (let i = 0; i < n; i++) U.mk(g, GEO.sph, glow(col[i % col.length]), [(i / (n - 1) - 0.5) * w, y - Math.sin(i / (n - 1) * Math.PI) * 0.5, 0], [0.2, 0.26, 0.2]); return g; };
    const holy = ['makha', 'visakha', 'asanha', 'khaophansa', 'okphansa', 'kathin', 'lent', 'loy', 'songkran'].some(k => keys.has(k));
    if (holy) { strings(TP.x + 5, TP.z + 5.5, 16, [0xffb300, 0xff6f00, 0xffe082]); const g = strings(TP.x + 5, TP.z - 5.5, 16, [0xffb300, 0xff6f00, 0xffe082]); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; U.mk(g, GEO.cylLo, mc(0xfff8e1), [Math.cos(a) * 5, 0.25 - 0, 5.5 + Math.sin(a) * 2.5], [0.05, 0.5, 0.05]); U.mk(g, GEO.sph, glow(0xffb300), [Math.cos(a) * 5, 0.56, 5.5 + Math.sin(a) * 2.5], [0.05, 0.09, 0.05]); } }
    const at = id => SITES.find(s => s.id === id);
    if (keys.has('ramadan') || keys.has('eidfitr') || keys.has('eidadha')) { const s = at('mosque'); strings(s.x, s.z + 4.2, 8, [0x69f0ae, 0xffffff, 0x00c853]); }
    if (keys.has('xmaseve') || keys.has('xmas') || keys.has('easter')) { const s = at('church'); strings(s.x, s.z + 4.2, 8, [0xff1744, 0x00e676, 0xffffff]); }
    if (keys.has('cny') || keys.has('qingming') || keys.has('midautumn') || keys.has('vegfest') || keys.has('veg')) { const s = at('shrine'); strings(s.x, s.z + 4.2, 8, keys.has('veg') || keys.has('vegfest') ? [0xffeb3b, 0xffd600] : [0xff1744, 0xffd600]); }
    if (keys.has('diwali')) { const s = at('hindu'); strings(s.x, s.z + 4.2, 8, [0xff9100, 0xffd740, 0xff4081]); for (let i = 0; i < 8; i++) { const g = decorGroups[decorGroups.length - 1]; U.mk(g, GEO.sph, glow(0xffb74d), [(i - 3.5) * 0.9, 0.2, 1.6], [0.14, 0.08, 0.14]); } }
  };
  UI.H.f24alms = () => doAlms();

  // ===== phone app =====
  const NEXT_N = 14;
  const upcoming = () => { const out = []; for (let k = 0; k <= 84 && out.length < NEXT_N; k++) { const d = S.day + k, e = dayEvent(d); if (e) out.push({ e, in: k, d }); } return out; };
  const relTag = r => r && REL[r] ? `<small class="dim">${REL[r].i}</small>` : '';
  const appHTML = t => {
    const s = f(), e = dayEvent(), ps = periodsOn(), me = myRel();
    if (t === 0) {
      const act = e ? (EX[e.k] || []) : [];
      const fastCard = inP('ramadan') ? `<div class="card"><div class="ci">🌙</div><div class="cb"><h4>รอมฎอน ${s.fast.pledge ? `ถือศีลอดอยู่ · ครบ ${s.fast.days} วัน` : 'ยังไม่ได้ตั้งใจถือศีลอด'}</h4><p class="dim">งดอาหารและน้ำ 05:00-18:30 · ละศีลอดที่มัสยิดหลัง 18:30 ได้พลังงานและบุญ ${fasting() ? '<b class="bad"> · กำลังถือศีลอด</b>' : ''}</p></div></div>` : '';
      const lentCard = inP('lent') ? `<div class="card"><div class="ci">🕯️</div><div class="cb"><h4>เข้าพรรษา ${s.lent.pledge ? `ปณิธาน: ตักบาตร ${s.lent.days}/8 ครั้ง` : 'ยังไม่ได้ตั้งปณิธาน'}</h4><p class="dim">ตักบาตรเช้า 05:30-08:30 หน้าวัด ได้บุญ ×2 · ครบ 8 ครั้งตลอดพรรษาได้บุญ 3,000 และโชคดี 5 วัน</p></div></div>` : '';
      const vegCard = inP('veg') ? `<div class="card"><div class="ci">🥬</div><div class="cb"><h4>เทศกาลกินเจ</h4><p class="dim">กินเจที่ซุ้มอาหารเจกลางลานน้ำพุหรือใช้ชุดอาหารเจ · วันนี้ ${Object.keys(s.veg.days).filter(x => x.startsWith(Y() + ':')).length} วันที่กินเจ</p></div></div>` : '';
      const kathinCard = inP('kathin') && s.kathin !== Y() + 1 ? `<div class="card"><div class="ci">🧣</div><div class="cb"><h4>ทอดกฐิน</h4><p class="dim">ทอดกฐินได้ปีละครั้ง ภายใน 1 เดือนหลังออกพรรษา ที่ลานน้ำพุในวันทอดกฐิน หรือซื้อผ้ากฐินที่ร้านของไหว้</p></div></div>` : '';
      return `<p class="lead">📅 ${Cal24.dateText(S.day)} · ${MONTHS_FULL[wk(S.day)]}</p>
        <div class="grid"><div class="card"><div class="ci">${e ? e.i : '📅'}</div><div class="cb"><h4>${e ? esc(e.n) : 'วันนี้ไม่มีวันสำคัญ'}</h4><p class="dim">${e ? esc(e.desc) : 'ดูวันสำคัญถัดไปในแท็บปฏิทิน'}</p>
          <p>${isHoliday() ? '<b class="bad">วันหยุดราชการ</b> · ธนาคารสาขาและส่วนราชการปิด · ' : ''}${alcoholBan() ? '<b class="bad">ห้ามขายสุรา</b> · ' : ''}${e && e.rel ? `${REL[e.rel].i} ${REL[e.rel].n}` : ''}</p></div></div>
        ${fastCard}${lentCard}${vegCard}${kathinCard}</div>
        ${ps.length ? `<p class="lead">ช่วงพิธีที่กำลังมี: ${ps.map(k => PERIODS[k].i + ' ' + PERIODS[k].n).join(' · ')}</p>` : ''}
        ${act.length ? `<h5>🙏 กิจกรรมวันนี้ (ต้องอยู่ที่ศาสนสถานหรือลานน้ำพุเพื่อความเหมาะสม แต่ทำจากแอปได้)</h5><div class="menu">${act.map(a => `<button class="btn" data-a="f24act" data-id="${a.id}">${a.i || '🙏'} ${esc(a.t)}${a.item ? ` · ${esc(G24[a.item].n)} (มี ${count(a.item)})` : a.cash ? ` · ${baht(a.cash)}` : ''}</button>`).join('')}</div>` : ''}
        <h5>🧡 ตักบาตรเช้า</h5><div class="row"><button class="btn" data-a="f24alms">ตักบาตรตอนนี้ ${almsTime() ? '' : '(พระบิณฑบาต 05:30-08:30)'} · ${baht(G24.f24_alms.price)}</button></div>
        <h5>ปณิธาน</h5><div class="menu"><button class="btn ${inP('ramadan') ? '' : 'ghost'}" data-a="f24pledge" data-v="fast" ${inP('ramadan') ? '' : 'disabled'}>🌙 ตั้งใจถือศีลอดรอมฎอน</button>
        <button class="btn ${inP('lent') ? '' : 'ghost'}" data-a="f24pledge" data-v="lent" ${inP('lent') ? '' : 'disabled'}>🕯️ ตั้งปณิธานจำพรรษา (ตักบาตร 8 ครั้ง)</button></div>`;
    }
    if (t === 1) {
      return `<p class="lead">ปฏิทินวันสำคัญ 1 ปีของหมู่บ้าน (1 สัปดาห์ในเกม = 1 เดือน) · วันที่ประมาณตามปฏิทินจริง</p>
        <div class="grid">${upcoming().map(({ e, in: n, d }) => `<div class="card"><div class="ci">${e.i}</div><div class="cb"><h4>${esc(e.n)} ${relTag(e.rel)}</h4><p class="dim">${Cal24.dateText(d)} · ${n === 0 ? 'วันนี้' : `อีก ${n} วัน`}${e.hol ? ' · <b>วันหยุดราชการ</b>' : ''}</p><p class="dim">${esc(e.desc)}</p></div></div>`).join('')}</div>
        <h5>ช่วงพิธีตลอดปี</h5><div class="grid">${Object.keys(PERIODS).map(k => { const P = PERIODS[k]; return `<div class="card"><div class="ci">${P.i}</div><div class="cb"><h4>${esc(P.n)} ${inP(k) ? '<span class="good">กำลังมี</span>' : ''}</h4><p class="dim">${MONTHS[wk(P.a + 1)]} ${RD(P.a % 7 + 1)} → ${MONTHS[Math.floor(P.b / 7)]} ${RD(P.b % 7 + 1)}</p></div></div>`; }).join('')}</div>`;
    }
    if (t === 2) {
      const gv = window.Gov24 && Gov24.religion ? normRel(typeof Gov24.religion === 'function' ? Gov24.religion() : Gov24.religion) : null;
      return `<p class="lead">ศาสนาของคุณ: ${REL[me].i} <b>${REL[me].n}</b>${gv ? ' (ตามบัตรประชาชน)' : ''}</p>
        ${gv ? '<p class="dim">เปลี่ยนศาสนาได้ที่สำนักงานเขต/อำเภอเมื่อแก้ไขบัตรประชาชน</p>' : `<div class="menu">${Object.keys(REL).map(k => `<button class="btn ${k === me ? '' : 'ghost'}" data-a="f24rel" data-v="${k}">${REL[k].i} ${REL[k].n}</button>`).join('')}</div>`}
        <h5>ความศรัทธาสะสม</h5><p class="lead">${Object.keys(REL).filter(k => k !== 'none').map(k => `${REL[k].i} ${s.pts[k] || 0}`).join(' · ')} · บุญสะสม (พุทธ) ${baht(Social2.st().merit || 0)} · ตักบาตรแล้ว ${s.alms} ครั้ง</p>
        <p class="dim">ความศรัทธาตั้งแต่ 1,000 ขึ้นไปทำให้อารมณ์ดีขึ้นทุกเช้า · เข้าร่วมพิธีของศาสนาอื่นได้ผลครึ่งหนึ่ง</p>
        <h5>ศาสนสถานในหมู่บ้าน</h5><div class="grid">${[{ n: 'วัดสุขใจาราม', i: '🛕', r: 'buddhist', d: 'ถนนสายวัด · ตักบาตร ทำบุญ งานบวช' }].concat(SITES.map(x => ({ n: x.n, i: x.i, r: x.rel, d: `พิธีประจำสัปดาห์: ${x.svc.n}` }))).map(x => `<div class="card"><div class="ci">${x.i}</div><div class="cb"><h4>${esc(x.n)}</h4><p class="dim">${esc(x.d)}</p></div></div>`).join('')}</div>`;
    }
    return `<p class="lead">ร้านของไหว้หน้าวัดขายของสำหรับทุกศาสนา ${GOODS24.length} รายการ ใช้ในกิจกรรมวันสำคัญ ซื้อผ่านมือถือหรือไปที่ร้านหน้าวัด</p>
      <div class="row"><button class="btn" data-a="f24shop">🛒 เปิดร้านของไหว้</button></div>
      <h5>ของในกระเป๋า</h5>${Object.keys(G24).filter(k => count(k) > 0).length ? `<div class="grid">${Object.keys(G24).filter(k => count(k) > 0).map(k => `<div class="card"><div class="ci">${G24[k].i}</div><div class="cb"><h4>${esc(G24[k].n)} ×${count(k)}</h4><p class="dim">${esc(G24[k].desc)}</p></div></div>`).join('')}</div>` : '<p class="dim">ยังไม่มีของไหว้ในกระเป๋า</p>'}`;
  };
  UI.H.f24shop = () => { UI.close(); setTimeout(() => UI.shop('fest24'), 0); };
  UI.H.f24rel = d => { if (REL[d.v]) { f().rel = d.v; UI.toast(`ศาสนาของคุณ: ${REL[d.v].n}`, REL[d.v].i); UI.renderBody && UI.renderBody(); } };
  UI.H.f24pledge = d => {
    const s = f();
    if (d.v === 'fast') { if (!inP('ramadan')) return; s.fast.pledge = 1; s.fast.last = Y(); if (!s.fast.days || s.fast.last !== Y()) s.fast.days = 0; UI.toast('ตั้งใจถือศีลอด งดอาหารและน้ำ 05:00-18:30', '🌙'); }
    if (d.v === 'lent') { if (!inP('lent')) return; s.lent.pledge = 1; UI.toast('ตั้งปณิธานจำพรรษา ตักบาตรให้ได้ 8 ครั้งก่อนออกพรรษา', '🕯️'); }
    UI.renderBody && UI.renderBody();
  };
  const appOpen = () => UI.open('🛐 ศาสนา & วันสำคัญ', ['วันนี้', 'ปฏิทิน', 'ศาสนาของฉัน', 'ร้านของไหว้'], appHTML);
  APPS.splice(Math.min(APPS.length, 13), 0, { id: 'rel24', i: '🛐', n: 'ศาสนา & วันสำคัญ' });
  Phone.apps.rel24 = () => { setTimeout(() => { Phone.app = null; UI.close(); appOpen(); }, 0); return ''; };
  if (typeof APP_GROUPS !== 'undefined') APP_GROUPS[1][1].push('rel24');

  // ===== world: places of worship, alms stand, offering stall, vegetarian stand =====
  const stall = (x, z, label, col) => {
    const g = new THREE.Group(); g.position.set(x, World.groundY(x, z), z); World.outdoor.add(g);
    U.mk(g, U.box(3, 0.95, 1.1, 1.2), M.wood, [0, 0.47, 0]);
    for (const a of [-1, 1]) for (const c of [-1, 1]) U.mk(g, GEO.cylLo, M.darkwood, [a * 1.4, 1.35, c * 0.5], [0.06, 2.7, 0.06]);
    const can = U.mk(g, GEO.box, U.mat(col, { map: T.stripes, roughness: 0.9 }), [0, 2.75, 0.1], [3.4, 0.08, 1.7]); can.rotation.x = 0.16;
    const sm = new THREE.MeshStandardMaterial({ map: U.signTex(label, { bg: '#7a2a1a' }), roughness: 0.7 }); U.mk(g, new THREE.PlaneGeometry(2.6, 0.55), sm, [0, 2.25, 0.62]);
    Col.box(x, z, 1.6, 0.7, 0, 'bld'); return g;
  };
  try {
    World.clearNear && World.clearNear(TP.x + 2, TP.z + 12, 8, true);
    stall(TP.x + 8, TP.z + 12.5, 'ร้านของไหว้', 0xef6c00);
    World.pois.push({ kind: 'shop', id: 'fest24', x: TP.x + 8, z: TP.z + 10.8, r: 2.6, label: 'ร้านของไหว้หน้าวัด', icon: '🪷', map: true });
    World.pois.push({ kind: 'act', x: TP.x + 13, z: TP.z + 10.8, r: 2.6, label: 'ตักบาตร', icon: '🧡', map: true, act: () => almsTime() ? { icon: '🧡', label: `ใส่บาตรพระสงฆ์ (${baht(G24.f24_alms.price)} หรือชุดใส่บาตรที่มี)`, fn: doAlms } : null });
    for (const S0 of SITES) {
      buildSite(S0);
      World.pois.push({ kind: 'act', x: S0.x + 5.2, z: S0.z, r: 3, label: S0.n, icon: S0.i, map: true, act: () => ({ icon: S0.i, label: `เข้า${S0.n}`, fn: () => siteUI(S0) }) });
    }
    // the vegetarian stand appears on the plaza during the festival
    const veg = stall(PLAZA.x + 14, PLAZA.z + 4, 'ซุ้มอาหารเจ', 0xfdd835); veg.visible = false;
    World.pois.push({ kind: 'act', x: PLAZA.x + 14, z: PLAZA.z + 2.3, r: 2.6, label: 'ซุ้มอาหารเจ', icon: '🥬', map: false, act: () => inP('veg') ? { icon: '🥬', label: `กินเจ (ชุดอาหารเจ ${baht(G24.f24_vegset.price)})`, fn: () => run(ACT.vf_meal) } : null });
    const _fd = Fest2.day; const vis = () => { veg.visible = inP('veg'); }; Fest2.day = function () { _fd.apply(this, arguments); vis(); }; vis();
  } catch (e) { console.warn('fest24 world', e); }
  drawDecor();
  window.Fest24 = { rel: myRel, run, ACT, EX, periods: periodsOn, G24, SITES, today: dayEvent, isHoliday, alcoholBan };
});
