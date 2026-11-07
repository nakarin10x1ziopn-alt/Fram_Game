'use strict';
// ---------- v25_life: a how-to-play guide for brand-new games only + 20 everyday systems that exist in real life
// (gym, salon, laundry, dentist, pharmacy, car care, cinema, library, post office, savings goals, pension fund, travel,
// market stall, maid, pest control, appliance repair, waste & recycling, loyalty card, farm co-op, village fund) ----------
V23.add('life25', () => {
  const YD = 84;                                     // a game year is 12 weeks of 7 days
  const DEFAULTS = () => ({
    gym: { until: 0, plan: '', d: 0, n: 0, xp: 0, wt: 68, total: 0 },
    salon: { cut: 0, fresh: 0, visits: 0 },
    laundry: { dirty: 2, done: 0 },
    dental: { hp: 100, bd: 0, bn: 0, last: 0, claimY: 0, claimed: 0, pain: 0 },
    rx: { stock: {}, otc: { d: 0, n: 0 }, cur: null, course: null, n: 0 },
    car: {},
    cinema: { tix: [], seen: {}, total: 0 },
    lib: { exp: 0, loans: [], read: {}, fines: 0 },
    post: { list: [], n: 0 },
    goals: { list: [] },
    pen: { units: 0, lots: [], ytd: {}, refunded: {} },
    trip: { log: [], total: 0 },
    stall: { last: 0, total: 0, best: 0, runs: 0 },
    maid: { plan: 0, last: 0, clean: 0 },
    pest: { inf: null, ward: {}, plan: 0, rep: 0 },
    appl: {},
    waste: { kg: 0, arrear: 0, paid: 0, eco: 0, sorted: 0 },
    loyal: { pts: 0, ytd: 0, yr: 0, joined: 0, life: 0 },
    coop: { shares: 0, loan: 0, weekly: 0, buy: 0, yr: 0, joined: 0 },
    vf: { joined: 0, save: 0, loan: 0, weekly: 0, left: 0, late: 0, limit: 20000, paidOff: 0, yr: 0 },
  });
  const L = () => { const x = S.life25 = S.life25 || {}; const d = DEFAULTS(); for (const k in d) if (x[k] === undefined || x[k] === null) x[k] = d[k]; return x; };

  // ================= helpers =================
  const msg = (from, t) => { try { Phone.msg(from, t); } catch (e) { } };
  const pay = (n, label) => {
    n = Math.round(+n) || 0; if (n > 0 && S.money < n) { UI.toast(`เงินไม่พอ ต้องใช้ ${baht(n)}`, '💸'); return false; }
    if (n > 0) { S.money -= n; try { Bank2.log(label, -n); } catch (e) { } } return true;
  };
  const gain = (n, src) => { n = Math.round(+n) || 0; if (n > 0) { earn(n); try { Bank2.income(src, n); } catch (e) { } } };
  const mood = n => { S.mood = Math.max(0, Math.min(100, (S.mood ?? 70) + n)); };
  let dmDay = 0, dmTot = 0;                            // everyday neglect can drag mood down by at most 5 a day in total
  const dm = n => { if (dmDay !== S.day) { dmDay = S.day; dmTot = 0; } const t = Math.min(n, Math.max(0, 5 - dmTot)); dmTot += t; mood(-t); };
  const energy = n => { S.energy = Math.max(0, Math.min(maxEnergy(), S.energy + n)); };
  const hunger = n => { S.hunger = Math.max(0, Math.min(100, (S.hunger ?? 80) + n)); };
  const thirst = n => { S.thirst = Math.max(0, Math.min(100, (S.thirst ?? 80) + n)); };
  const spend = (mins, fn) => { UI.close(); fade(() => { try { tick(mins); } catch (e) { console.warn('life25 tick', e); } try { fn(); } catch (e) { console.warn('life25', e); } saveGame(true); setTimeout(reopen, 650); }); };
  const hrOf = () => S.time / 60;
  const openNow = (a, b) => hrOf() >= a && hrOf() < b;
  const hh = h => `${String(Math.floor(h)).padStart(2, '0')}:${h % 1 ? '30' : '00'}`;
  const dayIdx = () => (S.day - 1) % 7;               // 0 = Monday
  const DAYN = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
  const holiday = () => !!(window.Cal24 && typeof Cal24.isHoliday === 'function' && Cal24.isHoliday(S.day));
  const gov = (ids, what) => !window.Gov24 || Gov24.need(ids, what);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const hashN = (a, b) => { try { return U.hash(a, b); } catch (e) { return (Math.sin(a * 12.9898 + b * 78.233) * 43758.5453) % 1; } };
  const pad = n => String(n).padStart(2, '0');
  const yearIdx = () => Math.floor((S.day - 1) / YD);
  const B = (act, label, o = {}) => `<button class="btn ${o.ghost ? 'ghost' : ''}" data-a="l25" data-v="${esc(act)}"${o.dis ? ' disabled' : ''}>${label}</button>`;
  const C = (i, h, p, btns = '') => `<div class="card"><div class="ci">${i}</div><div class="cb"><h4>${h}</h4><p class="dim">${p}</p>${btns ? `<div class="row">${btns}</div>` : ''}</div></div>`;
  const GR = x => `<div class="grid">${x}</div>`;
  const H5 = t => `<h5>${t}</h5>`;
  const LEAD = t => `<p class="lead">${t}</p>`;
  const DIM = t => `<p class="dim">${t}</p>`;
  const A = {};                                       // action table: data-v="sys.action|arg|arg"
  const SYS = {};                                     // system registry
  const DAILY = [];                                   // per-morning hooks
  UI.H.l25 = d => { const [k, ...r] = String(d.v || '').split('|'); const f = A[k]; if (f) { try { f(...r); } catch (e) { if (e && e.spend173) throw e; console.warn('l25', k, e); } } };

  // ================= A. how to play: only for a brand-new game =================
  const seen = {};
  const T = Tutorial;
  if (!G.fresh) {
    // an existing save never sees the guide or the welcome sheet
    S.tips = S.tips || {}; S.tips.welcome = 1; if (S.tut == null) S.tut = 'done';
  } else {
    const g = S.g25 = S.g25 || { fresh: 1 }; g.fresh = 1;
  }
  { const _open = UI.open;
    UI.open = function (title, ...r) {
      const t = String(title || '');
      if (/แผนที่/.test(t)) seen.map = 1;
      if (/ร้าน|ซูเปอร์|มาร์ท|ตลาด|ช้อป|ศูนย์การค้า|ห้าง|ฟาร์มพาณิชย์/.test(t)) seen.shop = 1;
      if (/ราชการ|บัตรประชาชน|ที่ว่าการ|เคาน์เตอร์/.test(t)) seen.gov = 1;
      if (/แท็กซี่/.test(t)) seen.taxi = 1;
      if (/ชีวิตประจำวัน/.test(t)) seen.life = 1;
      return _open.call(this, title, ...r);
    }; }
  { const _g = Phone.apps && Phone.apps.gov24; if (_g) Phone.apps.gov24 = function () { seen.govapp = 1; return _g.apply(this, arguments); }; }
  const hall = () => (window.Gov24 && Gov24.hall && Gov24.hall()) || { x: -9, z: -129 };
  const near = (p, r) => G.player && Math.hypot(G.player.pos.x - p.x, G.player.pos.z - p.z) < r;
  const binPoi = () => World.pois.find(x => x.kind === 'bin') || { x: 0, z: 0 };
  T.steps = [
    { t: 'ลองเดิน: กด W A S D (มือถือ: จอยซ้ายของจอ) เดินไปรอบๆ ให้ไกลสัก 5 เมตร — กด Shift เพื่อวิ่ง', done: () => T.p0 && near(T.p0, 99) && !near(T.p0, 5) },
    { t: 'หมุนกล้อง: ลากเมาส์ค้างบนจอ (มือถือ: ลากนิ้วด้านขวา) และเลื่อนล้อเมาส์/ถ่างนิ้วเพื่อซูม', done: () => Math.abs(G.cam.yaw - (T.yaw0 || 0)) > 0.5 },
    { t: 'เดินไปที่แปลงผักหน้าบ้าน (ลูกศรสีเขียวลอยอยู่เหนือจุดหมาย)', at: () => plotCenter(0), done: () => near(plotCenter(0), 3) },
    { t: 'เลือกเมล็ดในแถบด้านล่าง (กดเลข 1-9) แล้วกด E หรือปุ่มกลมขวาล่างเพื่อปลูก — ปุ่ม E ที่ขึ้นกลางจอกดได้ด้วยเมาส์/นิ้ว', at: () => plotCenter(0), done: b => S.stats.planted > b.planted },
    { t: 'เลือกบัวรดน้ำ แล้วกด E รดน้ำแปลงที่ปลูก ผักจะโตเฉพาะตอนดินชื้น', at: () => plotCenter(0), done: b => S.stats.watered > b.watered },
    { t: 'เปิดมือถือ (ปุ่ม 📱 มุมขวาบน หรือกด P) — ทุกบริการ ธนาคาร ข้อความ แผนที่ อยู่ในนี้', done: () => T.phoned },
    { t: 'ดูภารกิจรายสัปดาห์ในมือถือ (แอป 🎯 ภารกิจ) ทำภารกิจเพื่อรับเงินและค่าประสบการณ์', done: () => Phone.app === 'missions' },
    { t: 'ไปที่กล่องส่งขายหน้าบ้าน — ผลผลิตที่เก็บเกี่ยวใส่กล่องแล้วกด E เพื่อขายเป็นเงิน (ดูเงินที่มุมซ้ายบน)', at: binPoi, done: () => near(binPoi(), 3) },
    { t: 'เดินตามถนนไปหมู่บ้านแล้วคุยกับชาวบ้านสัก 1 คน (แตะที่ตัวเขาหรือกด E)', at: () => ({ x: -10, z: -230 }), done: () => Object.keys(S.daily.talk || {}).length > 0 },
    { t: 'เปิดแผนที่ (ปุ่ม 🗺️ มุมจอ หรือกด M) ดูตำแหน่งบ้าน ร้านค้า ศูนย์ราชการ และเมืองต่างๆ — กด M อีกครั้งเพื่อปิด', done: () => seen.map },
    { t: 'เปิดร้านค้าในหมู่บ้านสักร้านเพื่อดูสินค้า — ของที่ซื้อจะเก็บในกระเป๋า การ์ดสินค้าบอกว่าเก็บที่ไหน', done: () => seen.shop },
    { t: 'ไปที่ศูนย์ราชการอำเภอสุขใจ (🏛️ บนแผนที่) ทำบัตรประชาชนก่อน — ต้องมีบัตรจึงซื้อรถ ซื้อที่ดิน กู้เงิน หรือจดบริษัทได้ (จะขับรถต้องสอบใบขับขี่เพิ่ม: ใบรับรองแพทย์จากคลินิก + โรงเรียนสอนขับรถ)', at: hall, done: () => seen.gov || (window.Gov24 && Gov24.has('idcard')) },
    { t: 'เปิดแอป 🏛️ ราชการ ในมือถือ ดูเอกสารของคุณและวันหมดอายุ — เอกสารหมดอายุแล้วทำธุรกรรมไม่ได้ ต้องต่ออายุ', done: () => seen.govapp },
    { t: 'เปิดแอป 🚕 แท็กซี่ เลือกเมือง — เมืองใหญ่มีห้าง ร้านค้า และสถานที่ราชการมากกว่าหมู่บ้าน', done: () => seen.taxi },
    { t: 'เปิดแอป 🏙️ ชีวิตประจำวัน ดูบริการแบบชีวิตจริง เช่น ฟิตเนส ห้องสมุด โรงหนัง ออมเงิน แล้วลองเปิดดูสัก 1 ระบบ', done: () => seen.life },
  ];
  { const _s = T.start.bind(T);
    T.start = function (force) {
      const g = S.g25;
      if (!force && !(g && g.fresh)) { S.tut = 'done'; return; }      // only a game that began fresh with this guide in it
      if (S.tut != null && S.tut !== 'done' && S.tut >= T.steps.length) S.tut = 0;
      if (S.tut === 'done' && !force) return;
      T.p0 = G.player ? G.player.pos.clone() : null; T.yaw0 = G.cam.yaw;
      for (const k in seen) delete seen[k];
      return _s(force);
    }; }
  // the guide stays reachable at any time: phone app "วิธีเล่น"
  const HOW = [
    ['🎮 ควบคุม', `<ul><li><b>เดิน</b> W A S D (มือถือ: จอยซ้าย) · <b>วิ่ง</b> Shift</li><li><b>กล้อง</b> ลากเมาส์/ลากนิ้วขวา · ซูมด้วยล้อเมาส์หรือถ่างนิ้ว</li><li><b>ทำสิ่งที่แสดง</b> กด E หรือ Space หรือปุ่มกลมขวาล่าง (ปุ่ม E กลางจอกดได้)</li><li><b>เลือกของ</b> เลข 1-9 · <b>กระเป๋า</b> I · <b>มือถือ</b> P · <b>แผนที่</b> M · <b>ขึ้น/ลงรถ</b> F</li></ul>`],
    ['🌱 ฟาร์ม', `<ul><li>ปลูกผักที่แปลงหน้าบ้าน: เลือกเมล็ด → E ปลูก → เลือกบัวรดน้ำ → E รดน้ำ → รอผักโต → เก็บเกี่ยว</li><li>ผักโตเฉพาะตอนดินชื้น ฝนตกช่วยรดน้ำให้ ฤดูกาลมีผลต่อราคาและการเติบโต</li><li>ซื้อสัตว์ที่ร้านปศุสัตว์ เติมอาหารในรางทุกวัน แล้วเก็บไข่ นม ขนแกะ</li><li>ผลผลิตส่งขายที่กล่องหน้าบ้านหรือที่ตลาด ราคาขึ้นลงทุกวัน</li></ul>`],
    ['💰 เงินและร้านค้า', `<ul><li>เงินอยู่มุมซ้ายบน ทำงานฟาร์มและขายของเพื่อหาเงิน ฝากธนาคารผ่านแอป 🏦 ได้ดอกเบี้ย</li><li>ทุกร้านในหมู่บ้านและเมืองเดินเข้าไปซื้อได้ การ์ดสินค้าบอกว่าของที่ซื้อเก็บที่ไหน</li><li>ซื้อรถ ที่ดิน บ้าน ต้องมีบัตรประชาชน (ดูหัวข้อเอกสาร)</li><li>กินอาหารเพิ่มพลังงานและความหิว ถ้าอดอาหารจะป่วย</li></ul>`],
    ['🪪 เอกสารและราชการ', `<ul><li>ไปศูนย์ราชการอำเภอสุขใจ (จ-ศ 07:30–18:00 · ส 08:00–16:00 · วันหยุดราชการเปิดบางเคาน์เตอร์) ยื่นขอบัตรประชาชนด้วยแบบฟอร์มจริง</li><li>เกมใหม่เริ่มโดยไม่มีบัตรและไม่มีใบอนุญาตใดๆ — ใบขับขี่: ใบรับรองแพทย์จากคลินิก → บัตรประชาชน → สอบที่โรงเรียนสอนขับรถ ภูผาใหม่ ก่อนจะขับรถได้</li><li>เอกสาร 17 ชนิด เช่น ทะเบียนบ้าน หนังสือเดินทาง ใบอนุญาตก่อสร้าง ใบรับรองภาษี ทะเบียนเกษตรกร</li><li>แอป 🏛️ ราชการ ในมือถือแสดงเอกสาร วันหมดอายุ ค่าปรับ และต่ออายุออนไลน์</li><li>เอกสารหมดอายุ = ทำธุรกรรมที่ต้องใช้เอกสารนั้นไม่ได้จนกว่าจะต่ออายุ</li></ul>`],
    ['🏙️ เมืองและแผนที่', `<ul><li>กดแผนที่ (M) ดูตำแหน่งสถานที่ และ "ทรัพย์สินของฉัน" พร้อมปุ่มไปที่นั่น</li><li>เมืองต่างๆ ไปได้ด้วยแอป 🚕 แท็กซี่ หรือขับรถตามทางหลวง เมืองใหญ่มีห้างและสถานที่ราชการ</li><li>ซื้อที่ดิน สร้างบ้าน ตกแต่ง ขยายฟาร์ม จอดรถได้สูงสุด 6 คัน</li></ul>`],
    ['🏠 ระบบชีวิต', `<ul><li>แอป 🏙️ ชีวิตประจำวัน: ฟิตเนส ร้านทำผม ซักรีด ทันตแพทย์ ร้านขายยา ดูแลรถ โรงหนัง ห้องสมุด ไปรษณีย์ ออมเงิน กองทุนบำนาญ เที่ยว แผงตลาดนัด แม่บ้าน กำจัดปลวก ซ่อมเครื่องใช้ไฟฟ้า ขยะรีไซเคิล บัตรสมาชิก สหกรณ์ กองทุนหมู่บ้าน</li><li>แอป 🖥️ ศูนย์ไอที ติดตั้งเน็ต เครือข่าย คอมพิวเตอร์ · แอป 🎓 การศึกษา · 📈 ตลาดหุ้น · 🛐 ศาสนา</li></ul>`],
  ];
  const howOpen = () => UI.open('📖 วิธีเล่น', HOW.map(h => h[0]), t => `${HOW[t][1]}<div class="row end"><button class="btn" data-a="l25" data-v="how.start">▶ เริ่มบทสอนเล่นแบบลงมือทำ</button><button class="btn ghost" data-a="guide" data-v="0">📚 คู่มือระบบทั้งหมด</button></div>`, { wide: true });
  A['how.start'] = () => { UI.close(); Tutorial.start(true); };
  const addApp = (id, i, n, fn, grp) => {
    if (!APPS.some(a => a.id === id)) APPS.splice(Math.min(APPS.length, 13), 0, { id, i, n });
    Phone.apps[id] = () => { setTimeout(() => { Phone.app = null; UI.close(); fn(); }, 0); return ''; };
    if (typeof APP_GROUPS !== 'undefined') { const gr = APP_GROUPS.find(x => /บริการ/.test(x[0])) || APP_GROUPS[APP_GROUPS.length - 1]; if (gr && !gr[1].includes(id)) gr[1].unshift(id); }
  };
  addApp('howto', '📖', 'วิธีเล่น', howOpen);

  // ================= 1. ฟิตเนส (gym membership, workouts, body weight) =================
  const GYM = { day: ['บัตรรายวัน', 150, 0], month: ['สมาชิกรายเดือน', 1100, 6], quarter: ['สมาชิก 3 เดือน', 2800, 20], year: ['สมาชิกรายปี', 9000, 83] };
  const WORK = { cardio: ['🏃', 'คาร์ดิโอ / ลู่วิ่ง', 60, 12, 0.3, 0, 8], weights: ['🏋️', 'เวทเทรนนิ่ง', 60, 15, 0.2, 0, 10], yoga: ['🧘', 'โยคะ', 60, 8, 0.1, 7, 5], swim: ['🏊', 'ว่ายน้ำ', 45, 14, 0.35, 3, 12] };
  const bmi = () => L().gym.wt / (1.7 * 1.7);
  const bmiText = () => { const b = bmi(); return b < 18.5 ? 'น้ำหนักน้อย' : b < 23 ? 'สมส่วน' : b < 25 ? 'น้ำหนักเกินเล็กน้อย' : b < 30 ? 'อ้วน' : 'อ้วนมาก'; };
  const gymOn = () => L().gym.until >= S.day;
  const gymToday = () => L().gym.d === S.day ? L().gym.n : 0;
  SYS.gym = { tab: 0, i: '🏋️', n: 'ฟิตเนส', sum: () => gymOn() ? `สมาชิกถึง${RD(L().gym.until)} · น้ำหนัก ${L().gym.wt.toFixed(1)} กก.` : `ยังไม่เป็นสมาชิก · น้ำหนัก ${L().gym.wt.toFixed(1)} กก.`,
    view() {
      const g = L().gym, op = openNow(6, 22);
      return LEAD(`ฟิตเนสสุขใจ เปิดทุกวัน ${hh(6)}–${hh(22)} น. · น้ำหนัก ${g.wt.toFixed(1)} กก. · BMI ${bmi().toFixed(1)} (${bmiText()}) · ออกกำลังแล้ววันนี้ ${gymToday()}/2 ครั้ง · สะสม ${g.total} ครั้ง · ความฟิตของคุณ ${S.fit || 0}/30`) +
        DIM('ออกกำลังกายสม่ำเสมอเพิ่มพลังงานสูงสุดถาวร (ความฟิต) และลดน้ำหนัก ส่วนกินเยอะ ไม่ขยับ น้ำหนักจะขึ้น น้ำหนักเกินเกณฑ์ลดพลังงานสูงสุดลง สมัครสมาชิกต้องใช้บัตรประชาชน') +
        H5('แพ็กเกจสมาชิก') + GR(Object.entries(GYM).map(([k, p]) => C('🎫', p[0], baht(p[1]) + (p[2] ? ` · ${p[2] + 1} วัน` : ' · ใช้ได้วันนี้'), B('gym.join|' + k, 'สมัคร', { dis: S.money < p[1] }))).join('')) +
        H5('ออกกำลังกาย') + (gymOn() ? GR(Object.entries(WORK).map(([k, w]) => C(w[0], w[1], `${w[2]} นาที · ใช้พลังงาน ${w[3]}${w[5] ? ` · อารมณ์ +${w[5]}` : ''}`, B('gym.work|' + k, 'เริ่ม', { dis: !op || gymToday() >= 2 || S.energy < w[3] }))).join('')) : DIM('ต้องมีสมาชิกที่ยังไม่หมดอายุก่อนจึงเข้าใช้บริการได้'));
    } };
  A['gym.join'] = k => { const p = GYM[k]; if (!p) return; if (k !== 'day' && !gov(['idcard'], 'สมัครสมาชิกฟิตเนส')) return; if (!pay(p[1], 'ฟิตเนส: ' + p[0])) return; const g = L().gym; g.until = Math.max(g.until, S.day) + p[2]; g.plan = k; UI.toast(`สมัคร${p[0]}แล้ว ใช้ได้ถึง${RD(g.until)}`, '🏋️'); };
  A['gym.work'] = k => { const w = WORK[k], g = L().gym; if (!w || !gymOn() || !openNow(6, 22) || gymToday() >= 2 || S.energy < w[3]) return; spend(w[2], () => { S.energy = Math.max(0, S.energy - w[3]); g.d = S.day; g.n = gymToday() + 1; g.total++; g.xp++; g.wt = Math.max(42, g.wt - w[4]); hunger(-w[6]); thirst(-10); mood(w[5]); if (g.xp >= 3) { g.xp = 0; if ((S.fit || 0) < 30) { S.fit = (S.fit || 0) + 1; UI.toast(`ฟิตขึ้น! พลังงานสูงสุดเพิ่มเป็น ${maxEnergy()}`, '💪'); } } UI.toast(`${w[1]} เสร็จแล้ว น้ำหนัก ${g.wt.toFixed(1)} กก.`, w[0]); try { Prog.add(3); } catch (e) { } }); };
  { const _me = maxEnergy; maxEnergy = function () { let m = _me(); const b = bmi(); if (b >= 30) m -= 10; else if (b >= 25) m -= 4; else if (b < 17.5) m -= 5; if (L().dental.pain) m -= 5; return Math.max(40, m); }; }
  DAILY.push(() => { const g = L().gym; if ((S.hunger ?? 80) > 85) g.wt += 0.18; else if ((S.hunger ?? 80) < 30) g.wt -= 0.1; if (g.d !== S.day - 1 || !g.n) g.wt += 0.03; g.wt = Math.max(42, Math.min(130, g.wt)); if (g.until === S.day - 1 && g.plan !== 'day') msg('ฟิตเนสสุขใจ', 'สมาชิกของคุณหมดอายุแล้ว ต่ออายุได้ที่แอปชีวิตประจำวัน'); });

  // ================= 2. ร้านทำผม / ซาลอน =================
  const SALON = { cut1: ['✂️', 'ตัดผมชาย', 150, 30, 5, 1], cut2: ['💇', 'ตัดผมหญิง / ทำทรงใหม่', 350, 60, 8, 1], wash: ['🚿', 'สระไดร์', 120, 30, 4, 0], color: ['🎨', 'ทำสีผม', 900, 120, 12, 1], perm: ['🌀', 'ดัด / ยืดผม', 1800, 180, 15, 1], nail: ['💅', 'ทำเล็บ', 450, 60, 8, 0], shave: ['🪒', 'โกนหนวด / แต่งหนวด', 80, 20, 3, 0], treat: ['🧴', 'ทรีตเมนต์บำรุงผม', 700, 60, 10, 0] };
  const hairDays = () => S.day - L().salon.cut;
  SYS.salon = { tab: 0, i: '💇', n: 'ร้านทำผม', sum: () => { const s = L().salon; return s.fresh >= S.day ? `ดูดีถึง${RD(s.fresh)}` : hairDays() > 21 ? 'ผมยาวแล้ว ควรไปตัด' : 'ผมทรงปกติ'; },
    view() {
      const s = L().salon, op = openNow(9, 20) && !holiday();
      return LEAD(`ร้านสุขใจซาลอน เปิด ${hh(9)}–${hh(20)} น. (หยุดวันหยุดนักขัตฤกษ์) · ตัดผมครั้งล่าสุดเมื่อ ${s.cut ? hairDays() + ' วันก่อน' : 'ไม่เคย'} · มาแล้ว ${s.visits} ครั้ง`) + DIM('หลังทำผมจะดูดี 3 วัน ผู้คนเอ็นดูมากขึ้น (ความสนิทเพิ่มเร็วขึ้น) ถ้าปล่อยผมยาวเกิน 3 สัปดาห์ อารมณ์จะตกเล็กน้อยทุกวัน') +
        GR(Object.entries(SALON).map(([k, v]) => C(v[0], v[1], `${baht(v[2])} · ${v[3]} นาที · อารมณ์ +${v[4]}`, B('salon.do|' + k, 'ใช้บริการ', { dis: !op || S.money < v[2] }))).join(''));
    } };
  A['salon.do'] = k => { const v = SALON[k]; if (!v || !openNow(9, 20) || holiday() || !pay(v[2], 'ร้านทำผม: ' + v[1])) return; spend(v[3], () => { const s = L().salon; if (v[5]) s.cut = S.day; s.fresh = S.day + 3; s.visits++; mood(v[4]); UI.toast(`${v[1]}เรียบร้อย ดูดีไปอีก 3 วัน`, v[0]); }); };
  { const _fa = Friends.add.bind(Friends); Friends.add = function (name, v) { if (v > 0) { if (L().salon.fresh >= S.day) v *= 1.15; if (L().laundry.dirty >= 14) v *= 0.8; } return _fa(name, v); }; }
  DAILY.push(() => { if (hairDays() > 21) dm(1); });

  // ================= 3. ร้านซักรีด / ซักผ้า =================
  const homeWasher = () => { try { return !!S.furn.washer || Object.values((S.v23 && S.v23.homes) || {}).some(h => (h.items || []).some(i => i.k === 'washer')); } catch (e) { return false; } };
  SYS.laundry = { tab: 1, i: '🧺', n: 'ซักผ้า / ซักรีด', sum: () => `ผ้าสกปรก ${L().laundry.dirty} ชุด`,
    view() {
      const l = L().laundry, n = l.dirty, hw = homeWasher(), op = openNow(7, 21);
      return LEAD(`ผ้าที่รอซัก ${n} ชุด (เพิ่มวันละ 1 ชุด) · ซักแล้วทั้งหมด ${l.done} ชุด`) + DIM(n >= 14 ? '⚠️ ผ้าสกปรกมากจนคนรอบข้างรังเกียจ ความสนิทเพิ่มช้าลงและอารมณ์ตกทุกวัน' : n >= 8 ? 'ผ้ากองใหญ่แล้ว อารมณ์เริ่มตกทุกวัน ควรรีบซัก' : 'ซักสม่ำเสมอเพื่อให้ตัวสะอาดและอารมณ์ดี') + GR(
        C('🧺', 'ซักที่บ้าน (เครื่องซักผ้า)', hw ? `ค่าไฟ+ผงซักฟอก ${baht(15)}/รอบ · 60 นาที ซักได้ทีละ 8 ชุด` : 'ต้องมีเครื่องซักผ้าในบ้านก่อน (ซื้อได้ที่ร้านเฟอร์นิเจอร์)', B('laundry.home', 'ซักผ้า', { dis: !hw || !n || S.money < 15 })) +
        C('🏪', 'ร้านสะดวกซัก', `${baht(20)}/ชุด · 90 นาที · เปิด ${hh(7)}–${hh(21)} น.`, B('laundry.shop', `ซักทั้งหมด ${baht(n * 20)}`, { dis: !n || !op || S.money < n * 20 })) +
        C('👔', 'ซัก อบ รีด', `${baht(35)}/ชุด · 90 นาที · ผ้าหอม อารมณ์ +4`, B('laundry.iron', `ซักรีดทั้งหมด ${baht(n * 35)}`, { dis: !n || !op || S.money < n * 35 })));
    } };
  const washed = (n, m2) => { const l = L().laundry; l.dirty = Math.max(0, l.dirty - n); l.done += n; mood(2 + m2); UI.toast(`ซักเสร็จ ${n} ชุด ตัวสะอาดสดชื่น`, '🧺'); };
  A['laundry.home'] = () => { const l = L().laundry; if (!homeWasher() || !l.dirty || !pay(15, 'ค่าไฟและผงซักฟอก')) return; spend(60, () => washed(Math.min(8, l.dirty), 0)); };
  A['laundry.shop'] = () => { const l = L().laundry, n = l.dirty; if (!n || !openNow(7, 21) || !pay(n * 20, 'ร้านสะดวกซัก')) return; spend(90, () => washed(n, 0)); };
  A['laundry.iron'] = () => { const l = L().laundry, n = l.dirty; if (!n || !openNow(7, 21) || !pay(n * 35, 'ร้านซักอบรีด')) return; spend(90, () => washed(n, 2)); };
  DAILY.push(() => { const l = L().laundry, m = L().maid; l.dirty = Math.min(40, l.dirty + 1); if (m.plan && m.last === S.day) l.dirty = 0; if (l.dirty >= 14) dm(2); else if (l.dirty >= 8) dm(1); });

  // ================= 4. ทันตแพทย์ =================
  const DENT = { check: ['🔍', 'ตรวจฟัน + เอ็กซเรย์', 300, 30, 2, 'ตรวจเช็กทุก 6 เดือน (42 วัน) ช่วยจับฟันผุได้ไว'], clean: ['🪥', 'ขูดหินปูน', 800, 45, 25, 'ฟื้นสุขภาพฟัน +25'], fill: ['🦷', 'อุดฟัน', 1200, 45, 30, 'รักษาฟันผุ ฟื้นสุขภาพฟัน +30'], root: ['🩺', 'รักษารากฟัน', 6500, 90, 55, 'หายปวดฟันทันที ฟื้นสุขภาพฟัน +55'], white: ['✨', 'ฟอกสีฟัน', 3500, 60, 0, 'ยิ้มสดใส อารมณ์ +8'] };
  const dentOpen = () => openNow(9, 17) && dayIdx() !== 6 && !holiday();
  SYS.dental = { tab: 0, i: '🦷', n: 'ทันตแพทย์', sum: () => { const d = L().dental; return d.pain ? '🦷 ปวดฟัน! ควรไปหาหมอ' : `สุขภาพฟัน ${Math.round(d.hp)}%`; },
    view() {
      const d = L().dental, op = dentOpen(), brushed = d.bd === S.day ? d.bn : 0;
      return LEAD(`คลินิกทันตกรรมสุขใจ เปิด ${hh(9)}–${hh(17)} น. จ-ส (ปิดอาทิตย์/วันหยุด) · สุขภาพฟัน ${Math.round(d.hp)}% ${d.pain ? '· <b class="bad">ปวดฟัน</b> (พลังงานสูงสุด −5)' : ''} · แปรงฟันวันนี้ ${brushed}/2 ครั้ง`) +
        DIM(`ฟันผุสะสมช้าๆ ทุกวัน (เร็วขึ้นถ้าไม่แปรงฟัน) ต่ำกว่า 40% จะปวดฟัน ประกันสังคมเบิกค่าทำฟันได้ปีละ 900 ฿ ${window.Gov24 && Gov24.has('ssoreg') ? '(คุณมีสิทธิ์ ✅)' : '(ต้องมีทะเบียนประกันสังคมจากศูนย์ราชการ)'}`) +
        GR(C('🪥', 'แปรงฟัน', 'ฟรี วันละ 2 ครั้ง (เช้า/ก่อนนอน) ชะลอฟันผุ', B('dental.brush', 'แปรงฟัน', { dis: brushed >= 2 }))) + H5('บริการทันตกรรม') +
        GR(Object.entries(DENT).map(([k, v]) => C(v[0], v[1], `${baht(v[2])} · ${v[3]} นาที · ${v[5]}`, B('dental.do|' + k, 'รับบริการ', { dis: !op || S.money < v[2] }))).join('')) + DIM(d.last ? `ตรวจครั้งล่าสุด ${S.day - d.last} วันก่อน` : 'ยังไม่เคยตรวจฟัน');
    } };
  A['dental.brush'] = () => { const d = L().dental; if (d.bd !== S.day) { d.bd = S.day; d.bn = 0; } if (d.bn >= 2) return; d.bn++; d.hp = Math.min(100, d.hp + 0.4); UI.toast('แปรงฟันสะอาด ปากสดชื่น', '🪥'); mood(1); };
  A['dental.do'] = k => {
    const v = DENT[k], d = L().dental; if (!v || !dentOpen()) return; if (!gov(['idcard'], 'ทำฟัน')) return; if (!pay(v[2], 'ทันตกรรม: ' + v[1])) return;
    spend(v[3], () => {
      d.hp = Math.min(100, d.hp + v[4]); if (k === 'check') d.last = S.day; if (k === 'root') d.pain = 0; if (k === 'white') mood(8); else mood(3);
      if (d.hp >= 40 && k !== 'check') d.pain = 0;
      const yr = yearIdx(); if (d.claimY !== yr) { d.claimY = yr; d.claimed = 0; }
      if (window.Gov24 && Gov24.has('ssoreg') && k !== 'white' && d.claimed < 900) { const c = Math.min(v[2], 900 - d.claimed); d.claimed += c; gain(c, 'เบิกประกันสังคม (ทันตกรรม)'); UI.toast(`เบิกประกันสังคมค่าทำฟันได้ ${baht(c)}`, '🧾'); }
      UI.toast(`${v[1]}เสร็จแล้ว สุขภาพฟัน ${Math.round(d.hp)}%`, v[0]);
    });
  };
  DAILY.push(() => { const d = L().dental, brushed = d.bd === S.day - 1 ? d.bn : 0; d.hp = Math.max(0, d.hp - (1.1 + (brushed >= 2 ? 0 : brushed ? 0.5 : 1.0))); if (d.hp < 40 && !d.pain) { d.pain = 1; msg('สุขภาพ', 'ปวดฟัน! ฟันผุลึกแล้ว ไปหาทันตแพทย์ที่คลินิกทันตกรรมโดยเร็ว (พลังงานสูงสุดลดลงจนกว่าจะรักษา)'); } if (d.pain) dm(3); else if (d.last && S.day - d.last === 42) msg('คลินิกทันตกรรมสุขใจ', 'ครบ 6 เดือนแล้ว ได้เวลาตรวจฟันประจำปี'); });

  // ================= 5. ร้านขายยา + ใบสั่งแพทย์ =================
  const OTC = {
    para: ['💊', 'พาราเซตามอล 500 มก.', 25, 'ลดไข้ปวดหัว (ไม่ทำให้หายป่วย) กินเกิน 4 เม็ด/วันเป็นพิษต่อตับ', () => { if (S.sick) energy(8); mood(1); }],
    ors: ['🧂', 'เกลือแร่ ORS', 20, 'ชดเชยน้ำและเกลือแร่ ความกระหาย +35', () => { thirst(35); hunger(5); if (S.sick) energy(5); }],
    vitc: ['🍊', 'วิตามินซี 1,000 มก.', 90, 'ภูมิต้านทานดีขึ้น 3 วัน ไม่ป่วยง่ายเวลาตากฝน', () => { S.vax = Math.max(S.vax || 0, S.day + 3); }],
    cough: ['🍯', 'ยาแก้ไอน้ำดำ', 60, 'บรรเทาไอ อารมณ์ +2', () => { mood(2); if (S.sick) energy(4); }],
    balm: ['🧴', 'ยาหม่อง / ยาทาแก้ปวดเมื่อย', 40, 'คลายกล้ามเนื้อ พลังงาน +6', () => energy(6)],
    sun: ['🌞', 'ครีมกันแดด SPF50', 120, 'ผิวไม่ไหม้ อารมณ์ +3 (ใช้ก่อนออกแดด)', () => mood(3)],
    repel: ['🦟', 'โลชั่นกันยุง', 70, 'ลดความเสี่ยงไข้เลือดออกวันนี้', () => { L().pest.rep = S.day; }],
    fak: ['🩹', 'ชุดปฐมพยาบาล', 150, 'ทำแผล ทายาฆ่าเชื้อ พลังงาน +10', () => energy(10)],
  };
  const RXS = { abx: ['💉', 'ยาปฏิชีวนะ (ครบคอร์ส 5 วัน)', 180] };
  const rxNow = () => { const r = L().rx.cur; return r && r.exp >= S.day && !r.filled ? r : null; };
  SYS.pharmacy = { tab: 0, i: '💊', n: 'ร้านขายยา', sum: () => { const r = L().rx; return r.course ? `กินยาแล้ว ${r.course.taken}/5 วัน` : rxNow() ? 'มีใบสั่งยา' : 'ยาสามัญประจำบ้าน'; },
    view() {
      const r = L().rx, op = openNow(8, 21), c = r.course, rx = rxNow(), today = r.otc.d === S.day ? r.otc.n : 0;
      return LEAD(`ร้านยาสุขใจ เปิด ${hh(8)}–${hh(21)} น. · ป่วยอยู่ตอนนี้: ${S.sick ? '<b class="bad">ใช่</b>' : 'ไม่'} · ยาพาราวันนี้ ${today}/4 เม็ด`) +
        DIM('ยาปฏิชีวนะซื้อได้เฉพาะมีใบสั่งแพทย์ ต้องกินทุกวันหลังอาหารให้ครบ 5 วัน ถ้าขาดวันใดวันหนึ่งโรคกลับมาและต้องพบแพทย์ใหม่') +
        H5('พบแพทย์ / ใบสั่งยา') + GR(
          C('🩺', 'ตรวจกับแพทย์ประจำร้านยา', `${baht(350)} · 45 นาที · ต้องมีบัตรประชาชน · ${rx ? `มีใบสั่งยา ${rx.no} (ใช้ได้ถึง${RD(rx.exp)})` : 'ถ้าป่วยจริงจะได้ใบสั่งยา'}`, B('rx.consult', 'พบแพทย์', { dis: !op || S.money < 350 })) +
          C('💉', RXS.abx[1], `${baht(RXS.abx[2])} · ${rx ? 'มีใบสั่งยาใช้ซื้อได้' : 'ต้องมีใบสั่งแพทย์'}`, B('rx.fill', 'รับยา', { dis: !op || !rx || S.money < RXS.abx[2] || !!c })) +
          (c ? C('🍽️', `กินยาปฏิชีวนะ (${RD(c.taken + 1)}/5)`, `กินหลังอาหารวันละครั้ง ต้องไม่หิว (ความหิวอย่างน้อย 35) · ${c.last === S.day ? 'วันนี้กินแล้ว ✅' : 'วันนี้ยังไม่ได้กิน'}`, B('rx.dose', 'กินยา', { dis: c.last === S.day || (S.hunger ?? 80) < 35 })) : '')) +
        H5('ยาสามัญประจำบ้าน') + GR(Object.entries(OTC).map(([k, o]) => { const n = r.stock[k] || 0; return C(o[0], `${o[1]} <small>มี ${n}</small>`, `${baht(o[2])} · ${o[3]}`, B('rx.buy|' + k, 'ซื้อ', { dis: !op || S.money < o[2] }) + B('rx.use|' + k, 'ใช้', { ghost: 1, dis: !n })); }).join(''));
    } };
  A['rx.buy'] = k => { const o = OTC[k]; if (!o || !openNow(8, 21) || !pay(o[2], 'ร้านขายยา: ' + o[1])) return; const r = L().rx; r.stock[k] = (r.stock[k] || 0) + 1; UI.toast(`ซื้อ${o[1]}แล้ว เก็บในตู้ยาที่บ้าน`, o[0]); };
  A['rx.use'] = k => {
    const o = OTC[k], r = L().rx; if (!o || !(r.stock[k] > 0)) return;
    if (k === 'para') { if (r.otc.d !== S.day) { r.otc.d = S.day; r.otc.n = 0; } if (r.otc.n >= 4) { energy(-25); mood(-6); UI.toast('กินพาราเกินขนาด! ตับเริ่มรับไม่ไหว อ่อนเพลียมาก', '⚠️'); r.stock[k]--; return; } r.otc.n++; }
    r.stock[k]--; o[4](); UI.toast(`ใช้${o[1]}แล้ว`, o[0]);
  };
  A['rx.consult'] = () => {
    if (!openNow(8, 21) || !gov(['idcard'], 'พบแพทย์') || !pay(350, 'ค่าตรวจแพทย์')) return;
    spend(45, () => { const r = L().rx; if (S.sick) { r.n++; r.cur = { no: 'RX-' + pad(r.n % 100) + pad(S.day % 100), day: S.day, exp: S.day + 7, filled: 0 }; UI.toast(`แพทย์วินิจฉัยติดเชื้อ จ่ายยาปฏิชีวนะ ใบสั่งยา ${r.cur.no}`, '🩺'); msg('ร้านยาสุขใจ', `ใบสั่งยา ${r.cur.no} ใช้ได้ถึง${RD(r.cur.exp)} กรุณารับยาและกินให้ครบ 5 วัน`); } else UI.toast('แพทย์ตรวจแล้วไม่พบความผิดปกติ แนะนำพักผ่อนและดื่มน้ำ ไม่จ่ายยา', '🩺'); });
  };
  A['rx.fill'] = () => { const rx = rxNow(), r = L().rx; if (!rx || r.course || !openNow(8, 21) || !pay(RXS.abx[2], 'ยาปฏิชีวนะตามใบสั่งแพทย์')) return; rx.filled = 1; r.course = { taken: 0, last: 0, start: S.day }; UI.toast('รับยาปฏิชีวนะ 5 วันแล้ว กินวันละครั้งหลังอาหาร', '💉'); };
  A['rx.dose'] = () => {
    const c = L().rx.course; if (!c || c.last === S.day || (S.hunger ?? 80) < 35) return; c.taken++; c.last = S.day;
    if (c.taken >= 5) { L().rx.course = null; S.sick = 0; S.vax = Math.max(S.vax || 0, S.day + 3); UI.toast('กินยาครบคอร์สแล้ว หายป่วยสนิท!', '💉'); mood(6); } else UI.toast(`กินยาแล้ว ${c.taken}/5 วัน อย่าลืมกินพรุ่งนี้`, '💊');
  };
  DAILY.push(() => { const c = L().rx.course; if (c && c.last < S.day - 1) { L().rx.course = null; S.sick = 1; msg('ร้านยาสุขใจ', 'คุณขาดยาปฏิชีวนะ โรคกลับมาและเชื้อดื้อยา ต้องพบแพทย์เพื่อรับใบสั่งยาใหม่'); } });

  // ================= 6. ศูนย์บริการรถยนต์ (เช็กระยะ เปลี่ยนน้ำมันเครื่อง ล้างรถ) =================
  const CSV = { oil: ['🛢️', 'เปลี่ยนน้ำมันเครื่อง + กรอง', 1200, 28, 45, 1], insp: ['🔧', 'เช็กระยะ ตรวจสภาพ 20 รายการ', 2500, 84, 90, 1], tire: ['🛞', 'เปลี่ยนยาง 4 เส้น', 8000, 168, 120, 1], batt: ['🔋', 'เปลี่ยนแบตเตอรี่', 3200, 168, 45, 1], ac: ['❄️', 'ล้างแอร์ + เติมน้ำยา', 1800, 84, 60, 0], wash: ['🚿', 'ล้างรถ + ดูดฝุ่น', 150, 3, 30, 0], wax: ['✨', 'ขัดเคลือบสี', 1500, 28, 90, 0] };
  const carName = c => (CARS[c.type] && CARS[c.type].n) || 'รถยนต์';
  const carMult = c => Math.max(0.7, Math.min(3, 0.6 + ((CARS[c.type] && CARS[c.type].price) || 9000) / 40000));
  const carRec = i => { const s = L().car; if (!s[i]) { s[i] = {}; for (const k in CSV) s[i][k] = S.day; } return s[i]; };
  const carCrit = i => Object.keys(CSV).filter(k => CSV[k][5] && S.day - carRec(i)[k] > CSV[k][3] * 1.25);
  SYS.car = { tab: 1, i: '🚗', n: 'ดูแลรถ / เช็กระยะ', sum: () => S.cars.length ? (S.cars.some((c, i) => carCrit(i).length) ? '⚠️ มีรถเลยกำหนดเช็กระยะ' : `รถ ${S.cars.length} คัน อยู่ในกำหนด`) : 'ยังไม่มีรถ',
    view() {
      if (!S.cars.length) return LEAD('คุณยังไม่มีรถ ซื้อรถได้ที่โชว์รูม แล้วกลับมาดูแลรักษาตามระยะที่นี่') + DIM('รถต้องเช็กระยะเป็นประจำ ไม่เช่นนั้นเสี่ยงรถเสียกลางทาง');
      const op = openNow(8, 18) && !holiday();
      return LEAD(`ศูนย์บริการรถยนต์ เปิด ${hh(8)}–${hh(18)} น. (หยุดวันหยุดนักขัตฤกษ์) · รถเลยกำหนดเช็กระยะมีโอกาสเสียกลางทาง ต้องลากรถและจ่ายค่าซ่อมแพง`) +
        S.cars.map((c, i) => { const r = carRec(i), m = carMult(c); return H5(`${(CARS[c.type] && CARS[c.type].i) || '🚗'} ${esc(carName(c))} ${c.reg ? '· ทะเบียน ' + esc(c.reg.plate) : ''}`) + GR(Object.entries(CSV).map(([k, v]) => { const age = S.day - r[k], due = age >= v[3], pr = Math.round(v[2] * m / 10) * 10; return C(v[0], v[1], `${baht(pr)} · ${v[4]} นาที · ทุก ${v[3]} วัน · ล่าสุด ${age} วันก่อน${due ? ' · <b class="bad">ถึงกำหนด</b>' : ''}`, B(`car.do|${i}|${k}`, 'ใช้บริการ', { dis: !op || S.money < pr })); }).join('')); }).join('');
    } };
  A['car.do'] = (i, k) => { i = +i; const c = S.cars[i], v = CSV[k]; if (!c || !v || !openNow(8, 18) || holiday()) return; const pr = Math.round(v[2] * carMult(c) / 10) * 10; if (!pay(pr, `ศูนย์บริการรถ: ${v[1]} (${carName(c)})`)) return; spend(v[4], () => { carRec(i)[k] = S.day; UI.toast(`${v[1]} เสร็จแล้ว ${carName(c)} พร้อมใช้งาน`, v[0]); mood(2); }); };
  DAILY.push(() => { S.cars.forEach((c, i) => { const n = carCrit(i).length; if (n && Math.random() < 0.03 * n) { const fee = Math.round(1500 * carMult(c)); const paid = Math.min(S.money, fee); S.money -= paid; try { Bank2.log(`ลากรถและซ่อม ${carName(c)}`, -paid); } catch (e) { } for (const k of carCrit(i)) carRec(i)[k] = S.day; mood(-5); msg('บริการช่วยเหลือรถยนต์', `${carName(c)} เสียกลางทางเพราะไม่ได้เช็กระยะ ลากรถและซ่อมรวม ${baht(paid)} ตอนนี้ตรวจสภาพครบแล้ว`); } }); });

  // ================= 7. โรงภาพยนตร์ =================
  const MOVIES = [['รักนี้ที่ทุ่งทอง', 'โรแมนติก', 108], ['ขบวนการปล้นข้ามเมือง', 'แอ็กชัน', 126], ['บ้านผีสิงหลังโรงนา', 'สยองขวัญ', 98], ['นักสืบแมวส้ม', 'ตลก', 102], ['ปลายฟ้าไกลบ้าน', 'ดราม่า', 118], ['ยานแม่กู้โลก', 'ไซไฟ', 140], ['เจ้าหญิงกับมังกรน้อย', 'การ์ตูน', 92], ['สารคดี: เกษตรกรรุ่นใหม่', 'สารคดี', 85], ['คืนวันสงกรานต์', 'ตลก', 104], ['เส้นทางสายไหม', 'ผจญภัย', 132], ['ฆาตกรรมที่ชายหาด', 'สืบสวน', 115], ['ครอบครัวสุขสันต์', 'ครอบครัว', 100], ['ศึกมวยไทยครั้งสุดท้าย', 'แอ็กชัน', 112], ['เพลงรักริมคลอง', 'ดนตรี', 106]];
  const SHOW = [12, 15, 18.5, 21], SEAT = { n: ['💺', 'ที่นั่งปกติ', 140, 0], p: ['🛋️', 'พรีเมียม (เบาะเอนนอน)', 260, 2], c: ['👫', 'ที่นั่งคู่ (ไปกับเพื่อนสนิท)', 360, 4] };
  const cinemaNow = () => { const wk = Math.floor((S.day - 1) / 7), out = []; for (let i = 0; i < 6; i++) out.push((wk * 3 + i * 2) % MOVIES.length); return [...new Set(out)]; };
  const bestFriend = () => { let best = null, v = 1.99; for (const n of G.npcs) { const f = Friends.get(n.name); if (f > v) { v = f; best = n.name; } } return best; };
  const cin = { seat: 'n', combo: 0 };
  SYS.cinema = { tab: 2, i: '🎬', n: 'โรงภาพยนตร์', sum: () => { const t = L().cinema.tix.filter(x => x.day >= S.day); return t.length ? `มีตั๋ว ${t.length} ใบ` : `ดูมาแล้ว ${L().cinema.total} เรื่อง`; },
    view() {
      const c = L().cinema, now = cinemaNow(), partner = bestFriend();
      return LEAD(`โรงภาพยนตร์สุขใจ ซีนีเพล็กซ์ · รอบฉาย ${SHOW.map(hh).join(' · ')} น. · หนังเปลี่ยนทุกสัปดาห์ · ดูมาแล้ว ${c.total} เรื่อง`) + DIM('ซื้อตั๋วล่วงหน้า แล้วมาถึงโรงก่อนรอบฉายไม่เกิน 20 นาทีจึงเข้าได้ ตั๋วหมดอายุเมื่อพลาดรอบ หนังที่ชอบทำให้อารมณ์ดีมาก ที่นั่งคู่ต้องมีเพื่อนสนิท') +
        `<div class="row">${Object.entries(SEAT).map(([k, s]) => B('cinema.seat|' + k, `${s[0]} ${s[1]} ${baht(s[2])}`, { ghost: cin.seat !== k })).join('')}${B('cinema.combo', `🍿 ชุดป๊อปคอร์น+น้ำ ${baht(150)} ${cin.combo ? '✅' : ''}`, { ghost: !cin.combo })}</div>` +
        (cin.seat === 'c' ? DIM(partner ? `ไปกับ: ${esc(partner)}` : '⚠️ ยังไม่มีเพื่อนสนิทพอ (ต้องความสนิท 2 หัวใจขึ้นไป)') : '') +
        H5('กำลังฉายสัปดาห์นี้') + GR(now.map(mi => { const m = MOVIES[mi]; return C('🎞️', esc(m[0]), `${m[1]} · ${m[2]} นาที${c.seen[mi] ? ' · ดูแล้ว ✅' : ''}`, SHOW.map(t => B(`cinema.buy|${mi}|${t}`, `${hh(t)} น.${hrOf() > t + 0.5 ? ' (พรุ่งนี้)' : ''}`)).join('')); }).join('')) +
        H5('ตั๋วของฉัน') + (c.tix.filter(x => x.day >= S.day).length ? GR(c.tix.map((x, i) => x.day < S.day ? '' : C('🎟️', esc(MOVIES[x.m][0]), `${RD(x.day)} รอบ ${hh(x.t)} น. · ${SEAT[x.seat][1]}${x.combo ? ' · มีชุดป๊อปคอร์น' : ''}`, B('cinema.watch|' + i, 'เข้าชม', { dis: !(x.day === S.day && hrOf() >= x.t - 0.34 && hrOf() <= x.t + 0.5) }))).join('')) : DIM('ยังไม่มีตั๋ว'));
    } };
  A['cinema.seat'] = k => { cin.seat = k; };
  A['cinema.combo'] = () => { cin.combo = cin.combo ? 0 : 1; };
  A['cinema.buy'] = (mi, t) => {
    mi = +mi; t = +t; const c = L().cinema, s = SEAT[cin.seat]; if (!cinemaNow().includes(mi)) return;
    if (cin.seat === 'c' && !bestFriend()) { UI.toast('ที่นั่งคู่ต้องมีเพื่อนสนิทไปด้วย', '👫'); return; }
    const day = hrOf() > t + 0.5 ? S.day + 1 : S.day, price = s[2] + (cin.combo ? 150 : 0); if (!pay(price, `ตั๋วหนัง: ${MOVIES[mi][0]}`)) return;
    c.tix.push({ m: mi, day, t, seat: cin.seat, combo: cin.combo, who: cin.seat === 'c' ? bestFriend() : '' }); UI.toast(`ซื้อตั๋ว ${MOVIES[mi][0]} ${RD(day)} รอบ ${hh(t)} น. แล้ว`, '🎟️');
  };
  A['cinema.watch'] = i => {
    const c = L().cinema, x = c.tix[+i]; if (!x || x.day !== S.day) return; const m = MOVIES[x.m];
    spend(m[2], () => {
      const seenSame = Object.keys(c.seen).filter(k => MOVIES[k][1] === m[1]).length, fresh = !c.seen[x.m];
      let g = fresh ? 12 : 4; g += SEAT[x.seat][3]; if (['ตลก', 'ครอบครัว', 'การ์ตูน', 'ดนตรี'].includes(m[1])) g += 3; if (seenSame >= 2) g += 2; mood(g);
      if (x.combo) { hunger(25); thirst(30); } if (x.who) Friends.add(x.who, 0.4); c.seen[x.m] = S.day; c.total++; c.tix.splice(+i, 1); if (fresh) { try { Prog.add(4); } catch (e) { } }
      UI.toast(`ดู "${m[0]}" จบแล้ว อารมณ์ +${g}${x.who ? ` · ความสนิทกับ${x.who}เพิ่มขึ้น` : ''}`, '🎬');
    });
  };
  DAILY.push(() => { const c = L().cinema; c.tix = c.tix.filter(x => x.day >= S.day); });

  // ================= 8. ห้องสมุดประชาชน (ยืม-คืนหนังสือ) =================
  const BOOKS = [['คู่มือปลูกผักปลอดสารพิษ', 'เกษตร', '🌱'], ['ดินดี น้ำดี ผลผลิตดี', 'เกษตร', '🌾'], ['เลี้ยงไก่ไข่อย่างมืออาชีพ', 'เกษตร', '🐔'], ['ตำราอาหารไทยโบราณ', 'ทำอาหาร', '🍲'], ['ขนมไทยทำง่าย', 'ทำอาหาร', '🍮'], ['บัญชีครัวเรือนเพื่อคนทำไร่', 'การเงิน', '📒'], ['ออมก่อนรวยก่อน', 'การเงิน', '💰'], ['ภาษีและสิทธิ์ที่ควรรู้', 'การเงิน', '🧾'], ['นิยาย: รักข้ามรั้วไร่', 'นิยาย', '💖'], ['นิยาย: ฆาตกรรมในหมู่บ้าน', 'นิยาย', '🔍'], ['นิยาย: ผจญภัยในป่าลึก', 'นิยาย', '🧭'], ['รวมเรื่องสั้นชนบท', 'นิยาย', '📖'], ['สุขภาพดีด้วยตัวเอง', 'สุขภาพ', '🩺'], ['โยคะและการหายใจ', 'สุขภาพ', '🧘'], ['อาหารเพื่อสุขภาพ', 'สุขภาพ', '🥗'], ['ประวัติศาสตร์ชาติไทย', 'ประวัติศาสตร์', '🏯'], ['เมืองเก่าและโบราณสถาน', 'ประวัติศาสตร์', '🏛️'], ['เขียนโปรแกรมเบื้องต้น', 'ไอที', '💻'], ['ระบบเครือข่ายสำหรับมือใหม่', 'ไอที', '🌐'], ['ความปลอดภัยทางไซเบอร์', 'ไอที', '🛡️'], ['นิทานก่อนนอนสำหรับเด็ก', 'เด็ก', '🧸'], ['วิทยาศาสตร์รอบตัว', 'เด็ก', '🔬'], ['ภาษาอังกฤษเพื่อการเดินทาง', 'ภาษา', '✈️'], ['คู่มือทำธุรกิจขนาดเล็ก', 'ธุรกิจ', '💼']];
  const libOn = () => L().lib.exp >= S.day, libOpen = () => dayIdx() !== 0 && !holiday() && openNow(9, 19);
  const BOOKFX = { 'เกษตร': () => { try { Prog.add(25); } catch (e) { } }, 'ทำอาหาร': () => { try { Prog.add(15); } catch (e) { } mood(4); }, 'การเงิน': () => { try { Prog.add(20); } catch (e) { } }, 'นิยาย': () => mood(15), 'สุขภาพ': () => { S.vax = Math.max(S.vax || 0, S.day + 2); mood(4); }, 'ประวัติศาสตร์': () => { try { Prog.add(20); } catch (e) { } }, 'ไอที': () => { try { Prog.add(25); } catch (e) { } }, 'เด็ก': () => mood(8), 'ภาษา': () => { try { Prog.add(20); } catch (e) { } }, 'ธุรกิจ': () => { try { Prog.add(25); } catch (e) { } } };
  SYS.library = { tab: 2, i: '📚', n: 'ห้องสมุดประชาชน', sum: () => libOn() ? `ยืมอยู่ ${L().lib.loans.length}/3 เล่ม · สมาชิกถึง${RD(L().lib.exp)}` : 'ยังไม่เป็นสมาชิก',
    view() {
      const l = L().lib, op = libOpen();
      return LEAD(`ห้องสมุดประชาชนสุขใจ เปิด ${hh(9)}–${hh(19)} น. อังคาร–อาทิตย์ (ปิดวันจันทร์/วันหยุด) · ${libOn() ? `สมาชิกถึง${RD(l.exp)}` : 'ค่าสมาชิกรายปี 100 ฿ ต้องมีบัตรประชาชน'} · ค่าปรับคืนช้าเล่มละ 5 ฿/วัน`) +
        (libOn() ? '' : GR(C('🪪', 'สมัครสมาชิกห้องสมุด', `${baht(100)}/ปี · ยืมได้ 3 เล่ม นานเล่มละ 7 วัน`, B('lib.join', 'สมัคร', { dis: S.money < 100 })))) +
        H5(`หนังสือที่ยืมอยู่ (${l.loans.length}/3)`) + (l.loans.length ? GR(l.loans.map((x, i) => { const b = BOOKS[x.b], late = Math.max(0, S.day - x.due); return C(b[2], esc(b[0]), `${b[1]} · กำหนดคืน${RD(x.due)}${late ? ` · <b class="bad">เกินกำหนด ${late} วัน ค่าปรับ ${baht(late * 5)}</b>` : ''}${l.read[x.b] ? ' · อ่านจบแล้ว' : ''}`, B('lib.read|' + i, 'อ่าน 2 ชม.', { dis: !!l.read[x.b] && false }) + B('lib.ret|' + i, 'คืนหนังสือ', { ghost: 1, dis: !op })); }).join('')) : DIM('ยังไม่ได้ยืมหนังสือ')) +
        H5('หนังสือในห้องสมุด') + GR(BOOKS.map((b, i) => C(b[2], esc(b[0]), `${b[1]} · ${l.read[i] ? 'อ่านแล้ว ✅' : 'ยังไม่เคยอ่าน (อ่านจบครั้งแรกได้รางวัล)'}`, B('lib.borrow|' + i, 'ยืม', { dis: !libOn() || !op || l.loans.length >= 3 || l.loans.some(x => x.b === i) }))).join(''));
    } };
  A['lib.join'] = () => { if (!gov(['idcard'], 'สมัครสมาชิกห้องสมุด') || !pay(100, 'ห้องสมุด: ค่าสมาชิกรายปี')) return; L().lib.exp = S.day + YD; UI.toast('สมัครสมาชิกห้องสมุดแล้ว ยืมหนังสือได้ 3 เล่ม', '📚'); };
  A['lib.borrow'] = i => { i = +i; const l = L().lib; if (!libOn() || !libOpen() || l.loans.length >= 3 || l.loans.some(x => x.b === i)) return; l.loans.push({ b: i, due: S.day + 7 }); UI.toast(`ยืม "${BOOKS[i][0]}" แล้ว คืนภายใน${RD(S.day + 7)}`, BOOKS[i][2]); };
  A['lib.read'] = i => {
    const l = L().lib, x = l.loans[+i]; if (!x) return; const b = BOOKS[x.b];
    spend(120, () => { energy(-5); hunger(-6); if (!l.read[x.b]) { l.read[x.b] = S.day; (BOOKFX[b[1]] || (() => mood(5)))(); UI.toast(`อ่าน "${b[0]}" จบแล้ว ได้ความรู้ใหม่!`, b[2]); } else { mood(3); UI.toast(`อ่าน "${b[0]}" ซ้ำ อารมณ์ดีขึ้นเล็กน้อย`, b[2]); } });
  };
  A['lib.ret'] = i => { const l = L().lib, x = l.loans[+i]; if (!x || !libOpen()) return; const late = Math.max(0, S.day - x.due); if (late && !pay(late * 5, 'ค่าปรับคืนหนังสือช้า')) return; l.loans.splice(+i, 1); UI.toast(late ? `คืนหนังสือแล้ว จ่ายค่าปรับ ${baht(late * 5)}` : 'คืนหนังสือตรงเวลา ขอบคุณค่ะ', '📚'); };
  DAILY.push(() => { const l = L().lib; for (const x of l.loans) if (x.due === S.day + 1) msg('ห้องสมุดประชาชนสุขใจ', `พรุ่งนี้ครบกำหนดคืน "${BOOKS[x.b][0]}" (คืนช้าปรับวันละ 5 บาท)`); });

  // ================= 9. ไปรษณีย์ (ส่งพัสดุ EMS / ลงทะเบียน พร้อมเลขติดตามพัสดุ) =================
  const POSTSV = { reg: ['📮', 'พัสดุลงทะเบียน', 32, 3], ems: ['🚀', 'EMS ด่วนพิเศษ', 60, 1] };
  const post = { item: '', to: '', sv: 'reg', ins: 0 };
  const sendable = () => Object.keys(S.inv).filter(id => ITEMS[id] && S.inv[id] > 0 && ['crop', 'product', 'dish', 'artisan', 'fish'].includes(ITEMS[id].cat)).slice(0, 14);
  const postFee = () => POSTSV[post.sv][2] + 8 + (post.ins ? 30 : 0);
  const trackNo = n => `E${pad(n % 100)}${String(100000 + n * 7919).slice(-6)}${pad(S.day % 100)}TH`;
  const postOpen = () => !holiday() && (dayIdx() < 5 ? openNow(8.5, 16.5) : dayIdx() === 5 && openNow(9, 12));
  SYS.post = { tab: 2, i: '📮', n: 'ไปรษณีย์ / ส่งพัสดุ', sum: () => { const n = L().post.list.filter(p => !p.done).length; return n ? `พัสดุกำลังส่ง ${n} ชิ้น` : 'ส่งของขวัญให้เพื่อนบ้านได้'; },
    view() {
      const p = L().post, items = sendable(), names = [...new Set(G.npcs.map(n => n.name))].slice(0, 12);
      return LEAD(`ที่ทำการไปรษณีย์สุขใจ เปิด จ-ศ ${hh(8.5)}–${hh(16.5)} · ส ${hh(9)}–${hh(12)} น. (ปิดอาทิตย์/วันหยุด) · ส่งของให้ชาวบ้านเป็นของขวัญ ความสนิทเพิ่มตามมูลค่าของ`) +
        H5('1) เลือกของที่จะส่ง') + (items.length ? `<div class="row">${items.map(id => B('post.item|' + id, `${ITEMS[id].i} ${esc(ITEMS[id].n)} ×${S.inv[id]}`, { ghost: post.item !== id })).join('')}</div>` : DIM('ในกระเป๋ายังไม่มีผลผลิตหรืออาหารที่ส่งได้')) +
        H5('2) เลือกผู้รับ') + `<div class="row">${names.map(n => B('post.to|' + n, esc(n), { ghost: post.to !== n })).join('')}</div>` +
        H5('3) บริการ') + `<div class="row">${Object.entries(POSTSV).map(([k, v]) => B('post.sv|' + k, `${v[0]} ${v[1]} ${baht(v[2])} · ${v[3]} วัน`, { ghost: post.sv !== k })).join('')}${B('post.ins', `🛡️ ประกันพัสดุ +${baht(30)} ${post.ins ? '✅' : ''}`, { ghost: !post.ins })}</div>` +
        `<div class="row end">${B('post.send', `ส่งพัสดุ ${baht(postFee())}`, { dis: !postOpen() || !post.item || !post.to || !S.inv[post.item] || S.money < postFee() })}</div>` +
        H5('ติดตามพัสดุ') + (p.list.length ? GR(p.list.slice(0, 8).map(x => { const el = S.day - x.day, st = x.lost ? '❌ สูญหายระหว่างขนส่ง' : x.done ? '✅ นำจ่ายสำเร็จ' : el >= x.eta - 1 ? '🛵 อยู่ระหว่างนำจ่าย' : el >= 1 ? '🚚 อยู่ระหว่างขนส่ง' : '📥 รับฝากแล้ว'; return C('📦', `${x.no}`, `ถึง ${esc(x.to)} · ${ITEMS[x.id] ? ITEMS[x.id].i + ' ' + esc(ITEMS[x.id].n) : ''} · ${POSTSV[x.sv][1]}${x.ins ? ' + ประกัน' : ''}<br>${st}`); }).join('')) : DIM('ยังไม่มีรายการ'));
    } };
  A['post.item'] = id => { post.item = id; }; A['post.to'] = n => { post.to = n; }; A['post.sv'] = k => { post.sv = k; }; A['post.ins'] = () => { post.ins = post.ins ? 0 : 1; };
  A['post.send'] = () => {
    const p = L().post; if (!postOpen() || !post.item || !post.to || !S.inv[post.item] || !pay(postFee(), 'ไปรษณีย์: ส่งพัสดุ')) return;
    takeItem(post.item, 1); p.n++; const sv = POSTSV[post.sv];
    p.list.unshift({ no: trackNo(p.n), to: post.to, id: post.item, sv: post.sv, ins: post.ins, day: S.day, eta: sv[3], done: 0, lost: 0, val: ITEMS[post.item].sell || 40 }); p.list.length = Math.min(p.list.length, 30);
    UI.toast(`ส่งพัสดุให้${post.to}แล้ว เลขพัสดุ ${p.list[0].no}`, '📮'); post.item = '';
  };
  DAILY.push(() => { const p = L().post; for (const x of p.list) { if (x.done || x.lost) continue; if (S.day - x.day >= x.eta) { if (Math.random() < 0.03) { x.lost = 1; if (x.ins) gain(x.val * 2, 'ไปรษณีย์: ค่าชดเชยพัสดุสูญหาย'); msg('ไปรษณีย์ไทย', `พัสดุ ${x.no} สูญหายระหว่างขนส่ง${x.ins ? ` จ่ายค่าชดเชย ${baht(x.val * 2)}` : ' (ไม่ได้ซื้อประกัน)'}`); } else { x.done = 1; Friends.add(x.to, 0.25 + Math.min(0.5, x.val / 400)); msg(x.to, `ได้รับพัสดุ${ITEMS[x.id] ? ' "' + ITEMS[x.id].n + '"' : ''}แล้ว ขอบคุณมากนะ! (พัสดุ ${x.no})`); } } } });

  // ================= 10. ออมเงินตามเป้าหมาย =================
  const PRESETS = [['🚗', 'ซื้อรถคันใหม่', 100000], ['✈️', 'ทริปท่องเที่ยว', 30000], ['🛟', 'เงินฉุกเฉิน (3 เดือน)', 20000], ['🎓', 'ค่าเล่าเรียน', 50000], ['🏡', 'ดาวน์ที่ดิน', 200000], ['💍', 'งานแต่งงาน', 80000]];
  SYS.goals = { tab: 3, i: '🎯', n: 'ออมเงินตามเป้าหมาย', sum: () => { const g = L().goals.list; return g.length ? `${g.length} เป้าหมาย · สะสม ${baht(g.reduce((a, x) => a + x.bal, 0))}` : 'ยังไม่มีเป้าหมาย'; },
    view() {
      const g = L().goals.list;
      return LEAD('กระปุกออมเงินในแอปธนาคาร: ตั้งเป้าหมาย ฝากเข้ากระปุก (เงินจะถูกแยกออกจากกระเป๋าเงิน) ได้ดอกเบี้ย 1.5% ต่อปีและโบนัส 1% เมื่อถึงเป้า') +
        (g.length ? GR(g.map((x, i) => { const pc = Math.min(100, Math.round(x.bal / x.tgt * 100)); return C(x.i, `${esc(x.n)} · ${pc}%`, `เก็บแล้ว ${baht(Math.round(x.bal))} / เป้า ${baht(x.tgt)} · ตัดฝากอัตโนมัติทุกสัปดาห์ ${x.auto ? baht(x.auto) : 'ปิด'}<br><span style="display:block;height:6px;background:rgba(255,255,255,.15);border-radius:3px"><span style="display:block;height:6px;width:${pc}%;background:#7cf0a0;border-radius:3px"></span></span>`, B(`goals.dep|${i}|1000`, 'ฝาก 1,000', { dis: S.money < 1000 }) + B(`goals.dep|${i}|5000`, 'ฝาก 5,000', { dis: S.money < 5000 }) + B(`goals.auto|${i}`, x.auto ? 'ปิดตัดอัตโนมัติ' : 'ตัดอัตโนมัติ 500/สัปดาห์', { ghost: 1 }) + B(`goals.out|${i}`, 'ถอนและปิดเป้าหมาย', { ghost: 1 })); }).join('')) : '') +
        H5('ตั้งเป้าหมายใหม่') + GR(PRESETS.map((p, i) => C(p[0], p[1], `เป้า ${baht(p[2])}`, B('goals.new|' + i, 'ตั้งเป้า', { dis: g.length >= 6 || g.some(x => x.n === p[1]) }))).join(''));
    } };
  A['goals.new'] = i => { const p = PRESETS[+i], g = L().goals.list; if (!p || g.length >= 6 || g.some(x => x.n === p[1])) return; g.push({ i: p[0], n: p[1], tgt: p[2], bal: 0, auto: 0, day: S.day, hit: 0 }); UI.toast(`ตั้งเป้าหมาย "${p[1]}" แล้ว`, p[0]); };
  A['goals.dep'] = (i, n) => { const x = L().goals.list[+i]; n = +n; if (!x || !pay(n, 'ฝากกระปุกออมเงิน: ' + x.n)) return; x.bal += n; chkGoal(x); };
  A['goals.auto'] = i => { const x = L().goals.list[+i]; if (x) x.auto = x.auto ? 0 : 500; };
  A['goals.out'] = i => { const g = L().goals.list, x = g[+i]; if (!x) return; const b = Math.round(x.bal); g.splice(+i, 1); if (b > 0) gain(b, 'ถอนกระปุกออมเงิน (ไม่นับเป็นรายได้)'); UI.toast(`ปิดเป้าหมาย ถอนเงิน ${baht(b)} เข้ากระเป๋า`, '🎯'); };
  const chkGoal = x => { if (!x.hit && x.bal >= x.tgt) { x.hit = 1; const bonus = Math.round(x.tgt * 0.01); x.bal += bonus; msg('ธนาคารสุขใจ', `ยินดีด้วย! คุณออมครบเป้าหมาย "${x.n}" ${baht(x.tgt)} ได้โบนัส ${baht(bonus)}`); UI.toast(`ออมครบเป้า "${x.n}"!`, '🎉'); mood(8); } };
  DAILY.push(() => { for (const x of L().goals.list) { x.bal += x.bal * 0.015 / YD; if (x.auto && (S.day - 1) % 7 === 0 && S.money >= x.auto) { S.money -= x.auto; x.bal += x.auto; try { Bank2.log('ตัดฝากกระปุกอัตโนมัติ: ' + x.n, -x.auto); } catch (e) { } } chkGoal(x); } });

  // ================= 11. กองทุนบำนาญ / ลดหย่อนภาษี (RMF) =================
  const NAVMIN = 1000, LOCK = 420, TAXCAP = 100000;
  const pen = () => { const p = L().pen; if (!p.nav) { p.nav = 10; p.navDay = S.day; } return p; };
  const penValue = () => { const p = pen(); return p.lots.reduce((a, x) => a + x.units, 0) * p.nav; };
  SYS.pension = { tab: 3, i: '👴', n: 'กองทุนบำนาญ (RMF)', sum: () => { const p = pen(); return p.lots.length ? `มูลค่า ${baht(Math.round(penValue()))}` : 'ลดหย่อนภาษีได้ปีละ 100,000 ฿'; },
    view() {
      const p = pen(), yr = yearIdx(), ytd = p.ytd[yr] || 0, val = penValue(), cost = p.lots.reduce((a, x) => a + x.cost, 0);
      return LEAD(`กองทุนรวมเพื่อการเลี้ยงชีพ (RMF) · มูลค่าหน่วยลงทุน (NAV) ${p.nav.toFixed(4)} บาท · มูลค่าพอร์ต ${baht(Math.round(val))} (ต้นทุน ${baht(Math.round(cost))}, กำไร/ขาดทุน ${val - cost >= 0 ? '+' : ''}${baht(Math.round(val - cost))})`) +
        DIM(`ซื้อปีนี้ ${baht(ytd)} จากเพดานลดหย่อน ${baht(TAXCAP)} · สิ้นปีได้คืนภาษี 10% ของยอดซื้อที่ลดหย่อนได้ · ต้องถือแต่ละก้อนอย่างน้อย ${LOCK} วัน (5 ปี) ขายก่อนต้องคืนสิทธิ์ภาษี 10% และเสียค่าธรรมเนียม 1% · ราคาขึ้นลงตามตลาดทุกวัน`) +
        GR([1000, 5000, 20000].map(n => C('🛒', `ซื้อ ${baht(n)}`, `ได้ ${(n / p.nav).toFixed(2)} หน่วย`, B('pen.buy|' + n, 'ซื้อ', { dis: S.money < n }))).join('')) +
        H5('ก้อนที่ถือ') + (p.lots.length ? GR(p.lots.map((x, i) => { const age = S.day - x.day, free = age >= LOCK; return C('📦', `${x.units.toFixed(2)} หน่วย · ซื้อ${RD(x.day)}`, `มูลค่า ${baht(Math.round(x.units * p.nav))} · ${free ? 'ขายได้ไม่มีค่าปรับ' : `ล็อกอีก ${LOCK - age} วัน ขายก่อนเสียค่าปรับ`}`, B('pen.sell|' + i, free ? 'ขาย' : 'ขายก่อนกำหนด', { ghost: !free })); }).join('')) : DIM('ยังไม่มีหน่วยลงทุน'));
    } };
  A['pen.buy'] = n => { n = +n; const p = pen(); if (!gov(['idcard'], 'เปิดบัญชีกองทุน') || !pay(n, 'ซื้อกองทุน RMF')) return; const yr = yearIdx(); p.ytd[yr] = (p.ytd[yr] || 0) + n; p.lots.push({ day: S.day, units: n / p.nav, cost: n, yr }); UI.toast(`ซื้อกองทุน RMF ${baht(n)} แล้ว`, '👴'); };
  A['pen.sell'] = i => {
    const p = pen(), x = p.lots[+i]; if (!x) return; let v = Math.round(x.units * p.nav), note = '';
    if (S.day - x.day < LOCK) { const claw = Math.round(Math.min(x.cost, TAXCAP) * 0.1) * (p.refunded[x.yr] ? 1 : 0), fee = Math.round(v * 0.01); v = Math.max(0, v - claw - fee); note = ` (หักคืนสิทธิ์ภาษี ${baht(claw)} + ค่าธรรมเนียม ${baht(fee)})`; }
    p.lots.splice(+i, 1); gain(v, 'ขายกองทุน RMF'); UI.toast(`ขายกองทุนได้รับ ${baht(v)}${note}`, '👴');
  };
  DAILY.push(() => {
    const p = pen(); p.nav = Math.max(2, p.nav * (1 + (hashN(S.day, 77) - 0.5) * 0.018 + 0.00015)); p.navDay = S.day;
    if ((S.day - 1) % YD === 0 && S.day > 1) { const y = yearIdx() - 1, c = Math.min(p.ytd[y] || 0, TAXCAP); if (c > 0 && !p.refunded[y]) { p.refunded[y] = 1; const r = Math.round(c * 0.1); gain(r, 'คืนภาษีจากการลดหย่อน RMF'); msg('กรมสรรพากร', `ได้รับเงินภาษีคืน ${baht(r)} จากการซื้อกองทุน RMF ปีที่ผ่านมา ${baht(c)}`); } }
  });

  // ================= 12. ท่องเที่ยว (ตั๋วเดินทาง + ที่พัก) =================
  const DEST = [['bkk', 'กรุงเทพมหานคร', '🏙️', 0, 1], ['cnx', 'เชียงใหม่', '🏔️', 0, 2], ['hkt', 'ภูเก็ต', '🏖️', 0, 3], ['usm', 'เกาะสมุย', '🏝️', 0, 3], ['sgp', 'สิงคโปร์', '🦁', 1, 5], ['bali', 'บาหลี', '🌺', 1, 6], ['sel', 'โซล', '🏯', 1, 7], ['tyo', 'โตเกียว', '🗼', 1, 8], ['dxb', 'ดูไบ', '🏜️', 1, 10], ['par', 'ปารีส', '🥐', 1, 14]];
  const HOTELS = [['🛏️', 'โฮสเทล', 600, 8], ['🏨', 'โรงแรม 3 ดาว', 1800, 16], ['🏰', 'รีสอร์ท 5 ดาว', 6500, 28]];
  const trip = { d: 'cnx', n: 2, h: 1, tr: 'bus' };
  const trOpts = dst => dst[3] ? { plane: ['✈️', 'เครื่องบิน', 4500 + dst[4] * 1500, 0] } : { bus: ['🚌', 'รถทัวร์ VIP', dst[4] * 350, Math.ceil(dst[4] / 2)], train: ['🚆', 'รถไฟนอน', dst[4] * 450, Math.ceil(dst[4] / 2)], plane: ['✈️', 'เครื่องบิน', 1800 + dst[4] * 400, 0] };
  const tripCalc = () => { const dst = DEST.find(x => x[0] === trip.d), opts = trOpts(dst); if (!opts[trip.tr]) trip.tr = Object.keys(opts)[0]; const t = opts[trip.tr], hot = HOTELS[trip.h], hm = dst[3] ? 1.5 : 1, days = t[3] * 2 + trip.n + (t[3] ? 0 : 1); return { dst, t, hot, days, total: Math.round(t[2] * 2 + hot[2] * hm * trip.n + 500 * trip.n * (dst[3] ? 1.6 : 1)) }; };
  SYS.travel = { tab: 2, i: '✈️', n: 'ท่องเที่ยว / จองตั๋ว', sum: () => L().trip.log.length ? `เที่ยวมาแล้ว ${L().trip.log.length} ทริป` : 'จองตั๋วและที่พัก',
    view() {
      const c = tripCalc(), tl = L().trip.log, opts = trOpts(c.dst);
      return LEAD('จองทริปท่องเที่ยว: ตั๋วไป-กลับ + ที่พัก + ค่าอาหาร · ต่างประเทศต้องมีหนังสือเดินทาง · ระหว่างเดินทางฟาร์มไม่มีใครดูแล (ผักไม่ได้รดน้ำ สัตว์ไม่ได้กินอาหารถ้าไม่มีรางอัตโนมัติ)') +
        H5('1) เลือกปลายทาง') + `<div class="row">${DEST.map(d => B('trip.d|' + d[0], `${d[2]} ${d[1]}${d[3] ? ' 🛂' : ''}`, { ghost: trip.d !== d[0] })).join('')}</div>` +
        H5('2) การเดินทาง') + `<div class="row">${Object.entries(opts).map(([k, o]) => B('trip.tr|' + k, `${o[0]} ${o[1]} ${baht(o[2])} (${o[3] ? o[3] + ' วัน' : 'ครึ่งวัน'}/เที่ยว)`, { ghost: trip.tr !== k })).join('')}</div>` +
        H5('3) ที่พัก') + `<div class="row">${HOTELS.map((h, i) => B('trip.h|' + i, `${h[0]} ${h[1]} ${baht(Math.round(h[2] * (c.dst[3] ? 1.5 : 1)))}/คืน`, { ghost: trip.h !== i })).join('')}</div>` +
        `<div class="row">พักกี่คืน: ${[1, 2, 3, 4].map(n => B('trip.n|' + n, `${n} คืน`, { ghost: trip.n !== n })).join('')}</div>` +
        `<p class="lead">สรุป: ${c.dst[2]} ${c.dst[1]} · ${c.days} วันรวมเดินทาง · ราคารวม <b>${baht(c.total)}</b></p><div class="row end">${B('trip.go', `🧳 จองและออกเดินทาง ${baht(c.total)}`, { dis: S.money < c.total || c.days > 12 })}</div>` +
        H5('ตราประทับท่องเที่ยว') + (tl.length ? GR(tl.slice(0, 8).map(x => C(x.i, esc(x.n), `${RD(x.d)} · ${x.nights} คืน · ${esc(x.h)}`)).join('')) : DIM('ยังไม่เคยเดินทาง'));
    } };
  A['trip.d'] = k => { trip.d = k; trip.tr = ''; }; A['trip.tr'] = k => { trip.tr = k; }; A['trip.h'] = i => { trip.h = +i; }; A['trip.n'] = n => { trip.n = +n; };
  A['trip.go'] = () => {
    const c = tripCalc(); if (S.money < c.total) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(c.total), '💸'); return; }
    if (!gov(c.dst[3] ? ['idcard', 'passport'] : ['idcard'], 'จองตั๋วเดินทาง')) return;
    const farmRisk = (S.animals.length && !S.up.feeder && c.days > 1) || S.plots.some(p => p.c);
    const go = () => {
      if (!pay(c.total, `ท่องเที่ยว ${c.dst[1]}`)) return;
      UI.close(); fade(() => {
        try { simulate(c.days * 1440 - (c.t[3] ? 0 : 720)); } catch (e) { console.warn('trip', e); }
        S.energy = maxEnergy(); hunger(80 - (S.hunger ?? 80)); thirst(80 - (S.thirst ?? 80)); mood(c.hot[3] + (c.dst[3] ? 12 : 5));
        L().trip.log.unshift({ d: S.day, n: c.dst[1], i: c.dst[2], nights: trip.n, h: c.hot[1] }); L().trip.log.length = Math.min(L().trip.log.length, 20); L().trip.total++;
        for (const n of new Set(G.npcs.map(n => n.name))) Friends.add(n, 0.05);
        try { Prog.add(10 + c.dst[4] * 2); } catch (e) { } msg('สายการเดินทาง', `ยินดีต้อนรับกลับ! ทริป ${c.dst[1]} ${c.days} วัน ขอให้มีความสุข ชาวบ้านได้ของฝากจากคุณ`);
        UI.toast(`กลับจาก${c.dst[1]}แล้ว สดชื่นเต็มที่! อารมณ์ดีมาก`, c.dst[2]); saveGame(true); setTimeout(reopen, 650);
      });
    };
    if (farmRisk) UI.confirm('ออกเดินทาง?', `ฟาร์มจะไม่มีใครดูแลประมาณ ${c.days} วัน (ผักไม่ได้รดน้ำ สัตว์อาจอดอาหารถ้าไม่มีรางอัตโนมัติ) ยืนยันออกเดินทาง?`, 'ไปเลย', go); else go();
  };

  // ================= 13. แผงตลาดนัดเสาร์-อาทิตย์ =================
  const stall = { items: {}, ask: 1.1, corner: 0 };
  const stallItems = () => Object.keys(S.inv).filter(id => ITEMS[id] && S.inv[id] > 0 && ['crop', 'product', 'artisan', 'dish'].includes(ITEMS[id].cat)).slice(0, 14);
  const stallTotal = () => Object.values(stall.items).reduce((a, b) => a + b, 0);
  const stallDay = () => dayIdx() >= 5;
  SYS.stall = { tab: 2, i: '🛍️', n: 'แผงตลาดนัด', sum: () => stallDay() ? 'วันนี้ตลาดนัดเปิด' : 'เปิดเสาร์-อาทิตย์',
    view() {
      const s = L().stall, items = stallItems(), tot = stallTotal(), can = stallDay() && hrOf() >= 4.5 && hrOf() <= 7.5 && !holiday() || (stallDay() && hrOf() >= 4.5 && hrOf() <= 7.5);
      return LEAD(`ตลาดนัดเกษตรกรสุขใจ เปิดเสาร์-อาทิตย์ 06:00–13:00 น. · ต้องมาจัดแผงก่อน 07:30 (เริ่มจัดได้ตั้งแต่ 04:30) · ค่าเช่าแผง 150 ฿ (แผงหัวมุม 350 ฿ คนเดินผ่านมากกว่า) · ขายมาแล้ว ${s.runs} ครั้ง ยอดสะสม ${baht(s.total)} สูงสุด ${baht(s.best)}`) +
        DIM(`ตั้งราคาสูงขายได้น้อยชิ้นแต่กำไรต่อชิ้นมาก ฝนตกคนน้อย ขายอาหารต้องมีใบอนุญาตสุขาภิบาลอาหาร ${window.Gov24 && Gov24.has('foodsan') ? '(คุณมีแล้ว ✅)' : '(ยังไม่มี ❌ ขายได้เฉพาะผักผลไม้และของแปรรูป)'}`) +
        `<div class="row">ราคาตั้ง: ${[[0.9, 'ถูก 90%'], [1.1, 'ตลาด 110%'], [1.3, 'แพง 130%']].map(([v, t]) => B('stall.ask|' + v, t, { ghost: stall.ask !== v })).join('')} ${B('stall.corner', `📍 แผงหัวมุม ${stall.corner ? '✅' : ''}`, { ghost: !stall.corner })}</div>` +
        H5(`ของที่จะขาย (${tot}/40 ชิ้น)`) + (items.length ? GR(items.map(id => { const q = stall.items[id] || 0, hold = S.inv[id]; return C(ITEMS[id].i, `${esc(ITEMS[id].n)} <small>มี ${hold}</small>`, `ราคากลาง ${baht(priceOf(id))} · วางขาย ${q} ชิ้น`, B(`stall.add|${id}|1`, '+1', { dis: q >= hold || tot >= 40 }) + B(`stall.add|${id}|5`, '+5', { dis: q >= hold || tot >= 40 }) + B(`stall.add|${id}|-99`, 'เอาออก', { ghost: 1, dis: !q })); }).join('')) : DIM('ในกระเป๋าไม่มีผลผลิตหรือของแปรรูปให้ขาย')) +
        `<div class="row end">${B('stall.run', `🛍️ จัดแผงและขาย (${baht(stall.corner ? 350 : 150)})`, { dis: !can || !tot || S.money < (stall.corner ? 350 : 150) })}</div>` + (can ? '' : DIM(stallDay() ? 'ตอนนี้นอกช่วงจัดแผง (04:30–07:30)' : 'วันนี้ตลาดนัดไม่เปิด (ต้องเป็นวันเสาร์หรืออาทิตย์)'));
    } };
  A['stall.ask'] = v => { stall.ask = +v; }; A['stall.corner'] = () => { stall.corner = stall.corner ? 0 : 1; };
  A['stall.add'] = (id, n) => { n = +n; const cur = stall.items[id] || 0; const nv = Math.max(0, Math.min(S.inv[id] || 0, cur + n)); if (nv) stall.items[id] = nv; else delete stall.items[id]; };
  A['stall.run'] = () => {
    const fee = stall.corner ? 350 : 150; if (!stallDay() || stallTotal() < 1 || !gov(['idcard'], 'เช่าแผงตลาดนัด')) return;
    const lines = Object.entries(stall.items).filter(([id, q]) => S.inv[id] >= q);
    if (lines.some(([id]) => ITEMS[id].cat === 'dish') && window.Gov24 && !Gov24.has('foodsan')) { UI.toast('ขายอาหารปรุงสุกต้องมีใบอนุญาตสุขาภิบาลอาหาร (ขอที่สาธารณสุขอำเภอ)', '🍲'); return; }
    if (!pay(fee, 'ค่าเช่าแผงตลาดนัด')) return;
    spend(420, () => {
      const rain = (WEATHER[S.weather.type] || {}).rain > 0.3, cust = Math.round((26 + hashN(S.day, 5) * 14) * (rain ? 0.55 : 1) * (stall.corner ? 1.35 : 1));
      const left = {}; lines.forEach(([id, q]) => left[id] = q); const sold = {}; let rev = 0;
      for (let c = 0; c < cust; c++) { const ids = Object.keys(left).filter(k => left[k] > 0); if (!ids.length) break; const id = U.pick(ids), base = priceOf(id), want = 1 + ((Math.random() * 3) | 0), max = base * (0.85 + Math.random() * 0.5); if (stall.ask * base > max * 1.0) continue; const q = Math.min(want, left[id]); left[id] -= q; sold[id] = (sold[id] || 0) + q; rev += Math.round(stall.ask * base) * q; }
      for (const id in sold) takeItem(id, sold[id]);
      const s = L().stall; s.runs++; s.total += rev; s.best = Math.max(s.best, rev); s.last = S.day; gain(rev, 'ขายที่ตลาดนัด');
      S.energy = Math.max(0, S.energy - 25); hunger(-25); thirst(-30); mood(rev > fee ? 5 : -2); stall.items = {};
      const n = Object.values(sold).reduce((a, b) => a + b, 0); UI.toast(`ขายของที่ตลาดนัดได้ ${n} ชิ้น รายรับ ${baht(rev)} (กำไร ${baht(rev - fee)})`, '🛍️'); try { Prog.add(6); } catch (e) { }
    });
  };

  // ================= 14. แม่บ้านรายวัน / รายสัปดาห์ =================
  const MAIDS = { one: ['🧹', 'แม่บ้านมาทำความสะอาด 1 ครั้ง', 350, 'ซักผ้า กวาดถูทั้งบ้าน บ้านสะอาด 3 วัน'], deep: ['🧽', 'ทำความสะอาดใหญ่ (Big Cleaning)', 900, 'ขัดห้องน้ำ ล้างแอร์ เช็ดกระจก บ้านสะอาด 7 วัน กันแมลงได้ดีขึ้น'] };
  const clean = () => (L().maid.clean >= S.day) || S.buff && S.buff.clean === S.day;
  SYS.maid = { tab: 1, i: '🧹', n: 'แม่บ้านทำความสะอาด', sum: () => L().maid.plan ? 'สมาชิกรายสัปดาห์ ✅' : clean() ? 'บ้านสะอาด ✨' : 'บ้านเริ่มสกปรก',
    view() {
      const m = L().maid, op = openNow(7, 18);
      return LEAD(`บริการแม่บ้านสุขใจ เปิด ${hh(7)}–${hh(18)} น. · บ้านตอนนี้ ${clean() ? '✨ สะอาด' : '😐 ธรรมดา'}${m.plan ? ' · แพ็กเกจรายสัปดาห์ใช้งานอยู่' : ''}`) + DIM('บ้านสะอาดให้อารมณ์ดีขึ้นทุกวัน ลดโอกาสเจอปลวก หนู ยุง และเสื้อผ้าที่รอซักจะถูกซักให้ด้วย') +
        GR(Object.entries(MAIDS).map(([k, v]) => C(v[0], v[1], `${baht(v[2])} · ${v[3]}`, B('maid.do|' + k, 'เรียกแม่บ้าน', { dis: !op || S.money < v[2] }))).join('') +
          C('📅', 'แพ็กเกจแม่บ้านรายสัปดาห์', `${baht(1200)}/สัปดาห์ (ถูกกว่า 4 ครั้ง) · มาทุกวันพฤหัสบดี หักเงินอัตโนมัติ · ${m.plan ? 'กำลังใช้งาน' : 'ยังไม่สมัคร'}`, B('maid.plan', m.plan ? 'ยกเลิกแพ็กเกจ' : 'สมัครแพ็กเกจ', { ghost: !!m.plan, dis: !m.plan && S.money < 1200 })));
    } };
  const doClean = days => { const m = L().maid; m.clean = S.day + days; m.last = S.day; L().laundry.dirty = 0; S.buff = S.buff || {}; S.buff.clean = S.day; mood(5); };
  A['maid.do'] = k => { const v = MAIDS[k]; if (!v || !openNow(7, 18) || !pay(v[2], 'แม่บ้าน: ' + v[1])) return; spend(20, () => { doClean(k === 'deep' ? 7 : 3); UI.toast(`${v[1]} เสร็จแล้ว บ้านสะอาดเอี่ยม`, v[0]); }); };
  A['maid.plan'] = () => { const m = L().maid; m.plan = m.plan ? 0 : 1; UI.toast(m.plan ? 'สมัครแพ็กเกจแม่บ้านรายสัปดาห์ (หักทุกวันพฤหัสฯ)' : 'ยกเลิกแพ็กเกจแม่บ้านแล้ว', '🧹'); };
  DAILY.push(() => { const m = L().maid; if (m.plan && dayIdx() === 3) { if (S.money >= 1200) { S.money -= 1200; try { Bank2.log('แพ็กเกจแม่บ้านรายสัปดาห์', -1200); } catch (e) { } doClean(3); msg('บริการแม่บ้านสุขใจ', 'แม่บ้านทำความสะอาดบ้านและซักผ้าให้เรียบร้อยแล้ว (หักค่าบริการ 1,200 ฿)'); } else { m.plan = 0; msg('บริการแม่บ้านสุขใจ', 'ยอดเงินไม่พอ ยกเลิกแพ็กเกจแม่บ้านรายสัปดาห์'); } } if (clean()) mood(1); });

  // ================= 15. กำจัดปลวก หนู ยุง (Pest control) =================
  const PESTN = { termite: ['🐜', 'ปลวก', 'ปลวกกัดกินไม้ในบ้าน ค่าเสียหายสะสมทุกวัน'], rat: ['🐀', 'หนู', 'หนูแทะกินผลผลิตในบ้าน'], mosq: ['🦟', 'ยุง', 'ยุงชุกมาก เสี่ยงไข้เลือดออก'] };
  const PSV = { insp: ['🔍', 'ตรวจบ้านหาแมลง', 500, 0, 'ตรวจว่ามีสัตว์รบกวนหรือไม่'], spray: ['🧴', 'พ่นยากำจัดแมลงทั้งบ้าน', 1200, 28, 'กำจัดทุกชนิด ป้องกันต่อ 28 วัน'], termite: ['🛡️', 'วางระบบป้องกันปลวก (ฉีดดินรอบบ้าน)', 6500, 168, 'กำจัดปลวกและป้องกัน 168 วัน'], fog: ['💨', 'พ่นหมอกควันกำจัดยุง', 600, 14, 'กำจัดยุงและป้องกัน 14 วัน'], bait: ['🪤', 'วางกับดักและเหยื่อกำจัดหนู', 450, 14, 'กำจัดหนูและป้องกัน 14 วัน'] };
  const pestWard = t => (L().pest.ward[t] || 0) >= S.day || (L().pest.plan && L().pest.planUntil >= S.day);
  SYS.pest = { tab: 1, i: '🐜', n: 'กำจัดปลวก / แมลง', sum: () => { const p = L().pest; return p.inf ? `⚠️ พบ${PESTN[p.inf.type][1]}!` : (L().pest.plan && L().pest.planUntil >= S.day) ? 'แพ็กเกจป้องกันใช้งานอยู่' : 'ยังไม่พบปัญหา'; },
    view() {
      const p = L().pest, op = openNow(8, 17) && !holiday(), dmg = p.dmg | 0;
      return LEAD(`บริการกำจัดแมลงสุขใจ เปิด ${hh(8)}–${hh(17)} น. (หยุดวันหยุดนักขัตฤกษ์) · สถานะ: ${p.inf ? `<b class="bad">พบ${PESTN[p.inf.type][0]}${PESTN[p.inf.type][1]} — ${PESTN[p.inf.type][2]}</b>` : 'ยังไม่พบปัญหา'}${dmg ? ` · ความเสียหายค้างซ่อม ${baht(dmg)}` : ''}`) +
        DIM('หน้าฝนยุงเยอะ บ้านไม่สะอาดเสี่ยงหนูและปลวกมากขึ้น แพ็กเกจรายไตรมาสป้องกันทุกชนิดต่อเนื่อง') +
        GR(Object.entries(PSV).map(([k, v]) => C(v[0], v[1], `${baht(v[2])} · ${v[4]}`, B('pest.do|' + k, 'ใช้บริการ', { dis: !op || S.money < v[2] }))).join('') +
          C('📅', 'แพ็กเกจป้องกันรายไตรมาส', `${baht(1000)}/21 วัน หักอัตโนมัติ · ป้องกันทุกชนิด · ${p.plan ? 'ใช้งานถึงวันที่ ' + p.planUntil : 'ยังไม่สมัคร'}`, B('pest.plan', p.plan ? 'ยกเลิก' : 'สมัคร', { ghost: !!p.plan, dis: !p.plan && S.money < 1000 })) +
          (dmg ? C('🔨', 'ซ่อมแซมความเสียหาย', `ค่าซ่อมไม้และผนัง ${baht(dmg)}`, B('pest.fix', 'ซ่อมเลย', { dis: S.money < dmg })) : ''));
    } };
  A['pest.do'] = k => {
    const v = PSV[k], p = L().pest; if (!v || !openNow(8, 17) || holiday() || !pay(v[2], 'กำจัดแมลง: ' + v[1])) return;
    spend(k === 'insp' ? 30 : 60, () => {
      if (k === 'insp') { UI.toast(p.inf ? `พบ${PESTN[p.inf.type][1]}ในบ้าน แนะนำให้กำจัดทันที` : 'ตรวจแล้วไม่พบแมลงรบกวน บ้านปลอดภัย', '🔍'); return; }
      const types = k === 'spray' ? ['termite', 'rat', 'mosq'] : k === 'termite' ? ['termite'] : k === 'fog' ? ['mosq'] : ['rat'];
      for (const t of types) { p.ward[t] = Math.max(p.ward[t] || 0, S.day + v[3]); if (p.inf && p.inf.type === t) p.inf = null; }
      mood(3); UI.toast(`${v[1]}เรียบร้อย ป้องกันได้อีก ${v[3]} วัน`, v[0]);
    });
  };
  A['pest.plan'] = () => { const p = L().pest; if (p.plan) { p.plan = 0; UI.toast('ยกเลิกแพ็กเกจป้องกันแมลงแล้ว', '🐜'); return; } if (!pay(1000, 'แพ็กเกจป้องกันแมลงรายไตรมาส')) return; p.plan = 1; p.planUntil = S.day + 20; if (p.inf) p.inf = null; UI.toast('สมัครแพ็กเกจป้องกันแมลงแล้ว', '🐜'); };
  A['pest.fix'] = () => { const p = L().pest, d = p.dmg | 0; if (d && pay(d, 'ซ่อมแซมบ้านจากปลวก')) { p.dmg = 0; UI.toast('ซ่อมแซมบ้านเรียบร้อย', '🔨'); } };
  DAILY.push(() => {
    const p = L().pest; p.ward = p.ward || {};
    if (p.plan && p.planUntil < S.day) { if (S.money >= 1000) { S.money -= 1000; try { Bank2.log('แพ็กเกจป้องกันแมลงรายไตรมาส', -1000); } catch (e) { } p.planUntil = S.day + 20; msg('บริการกำจัดแมลงสุขใจ', 'ต่ออายุแพ็กเกจป้องกันแมลงอีก 21 วัน (หัก 1,000 ฿)'); } else { p.plan = 0; msg('บริการกำจัดแมลงสุขใจ', 'ยอดเงินไม่พอ ยกเลิกแพ็กเกจป้องกันแมลง'); } }
    const rain = (WEATHER[S.weather.type] || {}).rain > 0.3;
    if (p.inf) {
      const t = p.inf.type; dm(2);
      if (t === 'termite') p.dmg = (p.dmg | 0) + 250;
      if (t === 'rat') { const ids = Object.keys(S.inv).filter(id => ITEMS[id] && S.inv[id] > 0 && ['crop', 'product', 'dish'].includes(ITEMS[id].cat)); if (ids.length) { const id = U.pick(ids); takeItem(id, Math.min(S.inv[id], 1 + ((Math.random() * 2) | 0))); } }
      if (t === 'mosq' && !S.sick && !(S.sickFree > S.day) && p.rep !== S.day && Math.random() < 0.01 && typeof Life2 !== 'undefined' && Life2.getSick) Life2.getSick('ไข้เลือดออกจากยุงลาย');
    } else {
      const risk = 0.02 + (rain ? 0.015 : 0) + (clean() ? -0.012 : 0.01) + (L().waste.kg > 25 ? 0.012 : 0), r = Math.random();
      if (r < risk) { const roll = Math.random(), t = rain ? (roll < 0.5 ? 'mosq' : roll < 0.75 ? 'rat' : 'termite') : (roll < 0.45 ? 'rat' : roll < 0.8 ? 'termite' : 'mosq'); if (!pestWard(t)) { p.inf = { type: t, since: S.day }; msg('บ้านของคุณ', `พบ${PESTN[t][0]}${PESTN[t][1]}ในบ้าน! ${PESTN[t][2]} ติดต่อบริการกำจัดแมลง`); } }
    }
    if ((p.dmg | 0) > 3000) dm(1);
  });

  // ================= 16. ซ่อมเครื่องใช้ไฟฟ้า + ประกัน/รับประกันสินค้า =================
  const APPLK = { fridge: ['🧊', 'ตู้เย็น', 12900], tv: ['📺', 'ทีวี', 9900], washer: ['🧺', 'เครื่องซักผ้า', 11900], fan: ['🌀', 'พัดลม', 1290], console: ['🎮', 'เครื่องเล่นเกม', 12900], radio: ['📻', 'วิทยุ', 990], kitchen: ['🍳', 'ชุดครัวเตาแก๊ส', 24000], shower: ['🚿', 'เครื่องทำน้ำอุ่น', 9500] };
  const applList = () => {
    const out = [{ id: 'main:fridge', k: 'fridge', home: 'บ้านหลัก', price: 8000 }];
    try { if (S.furn.tv) out.push({ id: 'main:tv', k: 'tv', home: 'บ้านหลัก', price: 1500 }); for (const [hid, h] of Object.entries((S.v23 && S.v23.homes) || {})) (h.items || []).forEach((it, i) => { if (APPLK[it.k]) out.push({ id: `${hid}:${it.k}:${i}`, k: it.k, home: hid, price: APPLK[it.k][2] }); }); } catch (e) { }
    return out;
  };
  const applRec = a => { const m = L().appl; if (!m[a.id]) m[a.id] = { since: S.day, broken: 0, fixed: 0 }; return m[a.id]; };
  const repairCost = (a, r) => { const warr = S.day - r.since <= YD; return { call: warr ? 0 : 300, parts: warr ? 0 : Math.round(a.price * 0.12 / 10) * 10, warr }; };
  SYS.appl = { tab: 1, i: '🔧', n: 'ซ่อมเครื่องใช้ไฟฟ้า', sum: () => { const b = applList().filter(a => applRec(a).broken).length; return b ? `⚠️ เสีย ${b} เครื่อง` : `เครื่องใช้ ${applList().length} ชิ้น ปกติ`; },
    view() {
      const list = applList(), op = openNow(8, 18) && !holiday();
      return LEAD(`ร้านซ่อมเครื่องใช้ไฟฟ้าสุขใจ เปิด ${hh(8)}–${hh(18)} น. (หยุดวันหยุดนักขัตฤกษ์) · เครื่องใหม่รับประกัน 1 ปี (${YD} วัน) ซ่อมฟรีภายในประกัน หมดประกันเสียค่าเรียกช่าง 300 ฿ + ค่าอะไหล่ 12% ของราคา`) + DIM('เครื่องเก่าพังง่ายขึ้นทุกวัน ตู้เย็นเสียทำให้อาหารเน่าทุกวัน เครื่องใช้ที่เสียทำให้อารมณ์ตก') +
        GR(list.map(a => { const r = applRec(a), k = APPLK[a.k], c = repairCost(a, r), age = S.day - r.since; return C(k[0], `${k[1]} · ${a.home === 'main' || a.home === 'บ้านหลัก' ? 'บ้านหลัก' : esc(a.home)}`, `อายุ ${age} วัน · ${c.warr ? `ประกันเหลือ ${YD - age} วัน` : 'หมดประกัน'} · ${r.broken ? '<b class="bad">เสีย</b>' : 'ใช้งานปกติ'}`, r.broken ? B('appl.fix|' + a.id, `ซ่อม ${c.warr ? 'ฟรี (ประกัน)' : baht(c.call + c.parts)}`, { dis: !op || S.money < c.call + c.parts }) : ''); }).join(''));
    } };
  A['appl.fix'] = id => { const a = applList().find(x => x.id === id); if (!a) return; const r = applRec(a), c = repairCost(a, r); if (!r.broken || !openNow(8, 18) || holiday() || !pay(c.call + c.parts, `ซ่อม${APPLK[a.k][1]}`)) return; spend(60, () => { r.broken = 0; r.fixed = S.day; UI.toast(`ซ่อม${APPLK[a.k][1]}เรียบร้อย ใช้งานได้ปกติ (รับประกันงานซ่อม 28 วัน)`, '🔧'); }); };
  DAILY.push(() => {
    let broke = 0;
    for (const a of applList()) {
      const r = applRec(a), age = S.day - r.since; if (r.broken) { broke++; if (a.k === 'fridge') for (const id of Object.keys(S.inv)) { const it = ITEMS[id]; if (it && S.inv[id] > 0 && (it.cat === 'dish' || id === 'milk' || id === 'egg')) takeItem(id, Math.max(1, Math.ceil(S.inv[id] * 0.25))); } continue; }
      if (r.fixed && S.day - r.fixed < 28) continue;
      const p = age < YD ? 0.0006 : Math.min(0.02, 0.003 + (age - YD) / 40000);
      if (Math.random() < p) { r.broken = 1; msg('บ้านของคุณ', `${APPLK[a.k][1]}เสีย! ${age <= YD ? 'ยังอยู่ในประกัน ซ่อมฟรี' : 'หมดประกันแล้ว'} ติดต่อร้านซ่อมเครื่องใช้ไฟฟ้า${a.k === 'fridge' ? ' (อาหารในตู้เย็นจะเน่าเสียทุกวัน)' : ''}`); broke++; }
    }
    if (broke) dm(Math.min(4, broke * 2));
  });

  // ================= 17. ค่าเก็บขยะ + คัดแยกขยะรีไซเคิล (ธนาคารขยะ) =================
  const WASTE = { plastic: ['🥤', 'พลาสติก', 0.25, 8], paper: ['📰', 'กระดาษ', 0.2, 4], glass: ['🍾', 'แก้ว', 0.1, 2], metal: ['🥫', 'โลหะ/กระป๋อง', 0.05, 25], organic: ['🍂', 'เศษอาหาร/ใบไม้ (ทำปุ๋ย)', 0.4, 0] };
  SYS.waste = { tab: 1, i: '♻️', n: 'ขยะ & รีไซเคิล', sum: () => `ขยะสะสม ${L().waste.kg.toFixed(1)} กก.${L().waste.arrear ? ' · ค้างค่าขยะ' : ''}`,
    view() {
      const w = L().waste, kg = w.kg, nextC = (7 - ((S.day - 2) % 7)) % 7 || 7, nextF = (7 - ((S.day - 1) % 7)) % 7;
      return LEAD(`ขยะในบ้าน ${kg.toFixed(1)} กก. (เพิ่มวันละราว 0.7 กก.) · รถเก็บขยะมาทุกวันจันทร์ (อีก ${nextC} วัน) · ค่าขยะเทศบาล ${baht(60)}/สัปดาห์ ${w.arrear ? `· <b class="bad">ค้างชำระ ${w.arrear} สัปดาห์ (${baht(w.arrear * 60)})</b>` : ''} · คะแนนรักษ์โลก ${Math.round(w.eco)}`) +
        DIM('ค้างค่าขยะ 2 สัปดาห์รถจะไม่มาเก็บ ขยะล้นบ้านทำให้อารมณ์ตกและแมลงชุม คัดแยกก่อนรถมาเพื่อขายรีไซเคิลและทำปุ๋ย ทุกๆ 50 คะแนนรักษ์โลกเทศบาลให้รางวัล 100 ฿') +
        GR(C('🗂️', 'คัดแยกขยะ', `คัดแยก ${kg.toFixed(1)} กก. เป็น ${Object.values(WASTE).map(v => `${v[0]}${v[1]}`).join(' ')} · ขายรีไซเคิลได้เงินและได้ปุ๋ยหมัก · ใช้เวลา 30 นาที`, B('waste.sort', 'คัดแยกและขาย', { dis: kg < 1 })) +
          (w.arrear ? C('🧾', 'ชำระค่าเก็บขยะค้าง', `${baht(w.arrear * 60)} ณ เทศบาล`, B('waste.pay', 'ชำระ', { dis: S.money < w.arrear * 60 })) : '')) +
        H5('ราคารับซื้อรีไซเคิล') + DIM(Object.values(WASTE).filter(v => v[3]).map(v => `${v[0]} ${v[1]} ${v[3]} ฿/กก.`).join(' · '));
    } };
  A['waste.sort'] = () => {
    const w = L().waste, kg = w.kg; if (kg < 1) return;
    spend(30, () => {
      let cash = 0; for (const k in WASTE) if (WASTE[k][3]) cash += Math.round(kg * WASTE[k][2] * WASTE[k][3]); const org = kg * WASTE.organic[2], fert = Math.floor(org / 3);
      w.kg = 0; w.sorted += kg; const before = Math.floor(w.eco / 50); w.eco += kg; if (cash) gain(cash, 'ขายขยะรีไซเคิล'); if (fert) addItem('fert', fert);
      if (Math.floor(w.eco / 50) > before) { gain(100, 'รางวัลธนาคารขยะเทศบาล'); msg('เทศบาลสุขใจ', 'ขอบคุณที่คัดแยกขยะ! รับรางวัลโครงการธนาคารขยะ 100 ฿'); }
      mood(2); UI.toast(`คัดแยกขยะ ${kg.toFixed(1)} กก. ขายได้ ${baht(cash)}${fert ? ` + ปุ๋ยหมัก ${fert} ถุง` : ''}`, '♻️');
    });
  };
  A['waste.pay'] = () => { const w = L().waste, n = w.arrear * 60; if (n && pay(n, 'ค่าเก็บขยะเทศบาล (ค้างชำระ)')) { w.arrear = 0; UI.toast('ชำระค่าเก็บขยะแล้ว รถเก็บขยะกลับมาให้บริการ', '🧾'); } };
  DAILY.push(() => {
    const w = L().waste; w.kg += 0.7 + (S.stats.cooked > (w.lastCooked || 0) ? 0.3 : 0); w.lastCooked = S.stats.cooked;
    if (dayIdx() === 6) { if (S.money >= 60) { S.money -= 60; try { Bank2.log('ค่าเก็บขยะเทศบาล', -60); } catch (e) { } } else { w.arrear++; msg('เทศบาลสุขใจ', 'ค้างชำระค่าเก็บขยะ กรุณาชำระที่แอปชีวิตประจำวัน'); } }
    if (dayIdx() === 0 && !holiday() && w.arrear < 2) { if (w.kg > 0) { w.kg = 0; msg('เทศบาลสุขใจ', 'รถเก็บขยะมาเก็บขยะหน้าบ้านแล้ว'); } }
    if (w.kg > 25) dm(2);
  });

  // ================= 18. บัตรสมาชิกสะสมแต้ม =================
  const LOYX = /ภาษี|ค่าปรับ|เงินกู้|ชำระหนี้|ดอกเบี้ย|ธรรมเนียม|ประกัน|ฝาก|กระปุก|กองทุน|หุ้น|เช่าแผง|ไปรษณีย์|การไฟฟ้า|ประปา|อินเทอร์เน็ต|แม่บ้านรายสัปดาห์|ตัดฝาก|ลากรถ|ค่าเก็บขยะ|ท่องเที่ยว|สหกรณ์|กองทุนหมู่บ้าน|ค่าเรียน|ค่าเทอม/;
  const tier = () => { const y = L().loyal.ytd; return y >= 50000 ? ['🥇', 'ทอง', 2] : y >= 10000 ? ['🥈', 'เงิน', 1.5] : ['🎫', 'ทั่วไป', 1]; };
  { const _log = Bank2.log.bind(Bank2); Bank2.log = function (t, amt) { try { const l = L().loyal; if (l.joined && amt < 0 && !LOYX.test(String(t))) { const yr = yearIdx(); if (l.yr !== yr) { l.yr = yr; l.ytd = 0; l.pts = 0; } const sp = -amt; l.ytd += sp; const add = sp / 25 * tier()[2]; l.frac = (l.frac || 0) + add; const w = Math.floor(l.frac); if (w) { l.frac -= w; l.pts += w; l.life += w; } } } catch (e) { } return _log(t, amt); }; }
  const REW = { v30: ['💵', 'คูปองเงินสด 30 ฿', 100], v200: ['💴', 'คูปองเงินสด 200 ฿', 500], meal: ['🍱', 'ชุดอาหารกลางวันฟรี (อิ่มและสดชื่น)', 200], cafe: ['☕', 'กาแฟแก้วโปรด (พลังงาน+อารมณ์)', 80] };
  SYS.loyal = { tab: 3, i: '💳', n: 'บัตรสมาชิก & แต้ม', sum: () => L().loyal.joined ? `${tier()[0]} ${tier()[1]} · ${L().loyal.pts} แต้ม` : 'สมัครฟรี',
    view() {
      const l = L().loyal, t = tier();
      if (!l.joined) return LEAD('สมัครบัตรสมาชิกสุขใจพลัส ฟรี: ทุกครั้งที่ซื้อของได้แต้ม (25 ฿ = 1 แต้ม) สะสมแลกคูปองและของรางวัล') + GR(C('💳', 'บัตรสมาชิกสุขใจพลัส', 'ไม่มีค่าสมัคร · ได้ทันที', B('loyal.join', 'สมัครสมาชิก')));
      return LEAD(`${t[0]} สมาชิกระดับ${t[1]} (แต้มคูณ ${t[2]}) · แต้มคงเหลือ <b>${l.pts}</b> · ยอดซื้อปีนี้ ${baht(Math.round(l.ytd))} · แต้มสะสมตลอดชีพ ${l.life}`) + DIM(`ระดับเงินเมื่อซื้อครบ ${baht(10000)}/ปี (แต้ม ×1.5) ระดับทองครบ ${baht(50000)}/ปี (แต้ม ×2) · แต้มหมดอายุสิ้นปีเกม (ปีละ ${YD} วัน) ไม่นับค่าภาษี ค่าปรับ เงินฝากและค่าสาธารณูปโภค`) +
        GR(Object.entries(REW).map(([k, v]) => C(v[0], v[1], `${v[2]} แต้ม`, B('loyal.redeem|' + k, 'แลก', { dis: l.pts < v[2] }))).join(''));
    } };
  A['loyal.join'] = () => { const l = L().loyal; l.joined = S.day; l.yr = yearIdx(); UI.toast('สมัครบัตรสุขใจพลัสแล้ว ซื้อของเริ่มสะสมแต้มได้เลย', '💳'); };
  A['loyal.redeem'] = k => { const v = REW[k], l = L().loyal; if (!v || l.pts < v[2]) return; l.pts -= v[2]; if (k === 'v30') gain(30, 'แลกแต้มสุขใจพลัส'); else if (k === 'v200') gain(200, 'แลกแต้มสุขใจพลัส'); else if (k === 'meal') { hunger(45); thirst(20); energy(15); mood(3); } else { energy(8); mood(4); thirst(20); } UI.toast(`แลก${v[1]}แล้ว`, v[0]); };
  DAILY.push(() => { const l = L().loyal; if (!l.joined) return; if (l.yr !== yearIdx()) { l.yr = yearIdx(); l.ytd = 0; if (l.pts) { msg('สุขใจพลัส', `แต้มสะสมปีที่แล้ว ${l.pts} แต้มหมดอายุแล้ว`); l.pts = 0; } } else if ((S.day - 1) % YD === YD - 7 && l.pts) msg('สุขใจพลัส', `อีก 7 วันแต้ม ${l.pts} แต้มจะหมดอายุ รีบแลกรางวัล`); });

  // ================= 19. สหกรณ์การเกษตร =================
  const COOP = { fert: ['🧪', 'ปุ๋ยเร่งโต 5 ถุง', 'fert', 5, 350], feed: ['🌾', 'อาหารสัตว์ 10 ถุง', 'feed', 10, 420], carrot: ['🥕', 'เมล็ดแครอท 10 ซอง', 'seed_carrot', 10, 90], cabbage: ['🥬', 'เมล็ดกะหล่ำ 10 ซอง', 'seed_cabbage', 10, 100], tomato: ['🍅', 'เมล็ดมะเขือเทศ 10 ซอง', 'seed_tomato', 10, 120], med: ['💊', 'ยาสามัญสำหรับสัตว์เลี้ยง 3 ชุด', 'medicine', 3, 240] };
  const coop = () => L().coop;
  SYS.coop = { tab: 4, i: '🤝', n: 'สหกรณ์การเกษตร', sum: () => coop().joined ? `หุ้น ${coop().shares} หน่วย${coop().loan ? ' · มีหนี้' : ''}` : 'สมัครสมาชิกเกษตรกร',
    view() {
      const c = coop(), cap = c.shares * 5000, agmOk = (S.day - 1) % YD >= 38 && (S.day - 1) % YD <= 44 && c.agm !== yearIdx();
      if (!c.joined) return LEAD('สหกรณ์การเกษตรสุขใจ: สมาชิกซื้อปุ๋ย อาหารสัตว์ เมล็ดพันธุ์ ถูกกว่าตลาด 10% ได้เงินปันผลหุ้นปีละ 4% เงินเฉลี่ยคืนจากยอดซื้อ 3% และกู้เงินดอกเบี้ยต่ำ 4%') + DIM('ต้องมีบัตรประชาชนและทะเบียนเกษตรกร (ขอได้ที่ศูนย์ราชการ) หุ้นละ 1,000 ฿ ถอนคืนได้') + GR(C('🤝', 'สมัครสมาชิก + ซื้อหุ้นแรก', `${baht(1000)} (หุ้น 1 หน่วย)`, B('coop.join', 'สมัคร', { dis: S.money < 1000 })));
      return LEAD(`สมาชิกสหกรณ์ · หุ้น ${c.shares}/10 หน่วย (${baht(c.shares * 1000)}) · ยอดซื้อปีนี้ ${baht(c.buy)} · เงินกู้คงเหลือ ${baht(Math.round(c.loan))}`) + DIM(`วงเงินกู้ = หุ้น × 5,000 ฿ (ตอนนี้ ${baht(cap)}) ดอกเบี้ย 4%/ปี ผ่อน 12 สัปดาห์ หักทุกวันพุธ · ปันผลและเงินเฉลี่ยคืนจ่ายต้นปีเกม`) +
        GR(C('📈', 'ซื้อหุ้นเพิ่ม', `${baht(1000)}/หน่วย ได้ปันผล 4%/ปี`, B('coop.share|1', 'ซื้อ 1 หน่วย', { dis: c.shares >= 10 || S.money < 1000 }) + B('coop.share|-1', 'ขายคืน 1 หน่วย', { ghost: 1, dis: c.shares <= 1 || c.loan > (c.shares - 1) * 5000 })) +
          C('💵', 'กู้เงินสหกรณ์ (ดอกเบี้ยต่ำ)', `สูงสุด ${baht(cap)} · ${c.loan ? 'มีหนี้อยู่ ชำระเดือนละ ' + baht(Math.round(c.weekly)) + '/สัปดาห์' : '12 สัปดาห์ ดอกเบี้ย 4%'}`, c.loan ? B('coop.payoff', `ปิดหนี้ ${baht(Math.round(c.loan))}`, { dis: S.money < c.loan }) : [5000, 10000, 20000, 50000].map(n => B('coop.loan|' + n, baht(n), { dis: n > cap })).join('')) +
          (agmOk ? C('🗳️', 'ประชุมใหญ่สามัญประจำปี', 'เข้าร่วมรับเบี้ยประชุม 200 ฿ + อาหารกลางวัน', B('coop.agm', 'เข้าร่วมประชุม')) : '')) +
        H5('ร้านสหกรณ์ (ลด 10% สำหรับสมาชิก)') + GR(Object.entries(COOP).map(([k, v]) => { const pr = Math.round(v[4] * 0.9); return C(v[0], v[1], `${baht(pr)} (ราคาตลาด ${baht(v[4])})`, B('coop.buy|' + k, 'ซื้อ', { dis: S.money < pr })); }).join(''));
    } };
  A['coop.join'] = () => { const c = coop(); if (!gov(['idcard', 'farmer'], 'สมัครสหกรณ์การเกษตร') || !pay(1000, 'ซื้อหุ้นสหกรณ์การเกษตร')) return; c.joined = S.day; c.shares = 1; UI.toast('ยินดีต้อนรับสมาชิกสหกรณ์การเกษตรสุขใจ', '🤝'); };
  A['coop.share'] = n => { const c = coop(); n = +n; if (n > 0) { if (c.shares >= 10 || !pay(1000, 'ซื้อหุ้นสหกรณ์')) return; c.shares++; } else { if (c.shares <= 1 || c.loan > (c.shares - 1) * 5000) return; c.shares--; gain(1000, 'ขายคืนหุ้นสหกรณ์'); } };
  A['coop.loan'] = n => { const c = coop(); n = +n; if (c.loan || n > c.shares * 5000) return; c.loan = n * 1.04; c.weekly = c.loan / 12; gain(n, 'เงินกู้สหกรณ์การเกษตร'); UI.toast(`กู้เงินสหกรณ์ ${baht(n)} ผ่อนสัปดาห์ละ ${baht(Math.round(c.weekly))} 12 สัปดาห์`, '💵'); };
  A['coop.payoff'] = () => { const c = coop(), n = Math.round(c.loan); if (c.loan && pay(n, 'ปิดหนี้สหกรณ์การเกษตร')) { c.loan = 0; c.weekly = 0; UI.toast('ปิดหนี้สหกรณ์เรียบร้อย', '🤝'); } };
  A['coop.buy'] = k => { const v = COOP[k], c = coop(), pr = Math.round(v[4] * 0.9); if (!v || !pay(pr, `ร้านสหกรณ์: ${v[1]}`)) return; addItem(v[2], v[3]); c.buy += pr; UI.toast(`ซื้อ${v[1]}แล้ว เก็บในกระเป๋า`, v[0]); };
  A['coop.agm'] = () => { const c = coop(); if (c.agm === yearIdx()) return; spend(120, () => { c.agm = yearIdx(); gain(200, 'เบี้ยประชุมสหกรณ์'); hunger(30); mood(4); UI.toast('เข้าร่วมประชุมใหญ่สหกรณ์ รับเบี้ยประชุม 200 ฿', '🗳️'); }); };
  DAILY.push(() => {
    const c = coop(); if (!c.joined) return;
    if ((S.day - 1) % YD === 0 && S.day > 1) { const div = Math.round(c.shares * 1000 * 0.04), reb = Math.round(c.buy * 0.03); c.buy = 0; if (div + reb) { gain(div + reb, 'ปันผลและเงินเฉลี่ยคืนสหกรณ์'); msg('สหกรณ์การเกษตรสุขใจ', `จ่ายปันผลหุ้น ${baht(div)} และเงินเฉลี่ยคืน ${baht(reb)} เข้าบัญชีแล้ว`); } }
    if (c.loan > 0 && dayIdx() === 2) { const due = Math.min(c.loan, c.weekly); if (S.money >= due) { S.money -= due; try { Bank2.log('ผ่อนชำระเงินกู้สหกรณ์', -due); } catch (e) { } c.loan = Math.max(0, c.loan - due); if (c.loan < 1) { c.loan = 0; msg('สหกรณ์การเกษตรสุขใจ', 'ผ่อนชำระครบแล้ว ขอบคุณที่ใช้บริการ'); } } else msg('สหกรณ์การเกษตรสุขใจ', `ผ่อนงวดนี้ ${baht(Math.round(due))} ไม่ได้ เงินในกระเป๋าไม่พอ กรุณาชำระโดยเร็ว`); }
  });

  // ================= 20. กองทุนหมู่บ้าน =================
  const vf = () => L().vf;
  SYS.vf = { tab: 4, i: '🏘️', n: 'กองทุนหมู่บ้าน', sum: () => vf().joined ? (vf().loan ? `มีหนี้ ${baht(Math.round(vf().loan))}` : `ออม ${baht(vf().save)}`) : 'สมัครสมาชิก',
    view() {
      const f = vf();
      if (!f.joined) return LEAD('กองทุนหมู่บ้านและชุมชนเมืองสุขใจ: สมาชิกกู้เงินดอกเบี้ย 6%/ปี ไปลงทุนทำอาชีพ ออมทรัพย์กับกองทุนและรับปันผล 5%') + DIM('ต้องมีบัตรประชาชนและทะเบียนบ้านในหมู่บ้าน ค่าสมาชิก/เงินออมแรกเข้า 100 ฿ วงเงินกู้ครั้งแรก 20,000 ฿ ผ่อนตรงเวลาแล้ววงเงินเพิ่มครั้งละ 10,000 ฿ สูงสุด 60,000 ฿') + GR(C('🏘️', 'สมัครสมาชิกกองทุนหมู่บ้าน', `${baht(100)} เป็นเงินออมแรกเข้า`, B('vf.join', 'สมัคร', { dis: S.money < 100 })));
      const ok = !f.loan && f.late < 3;
      return LEAD(`สมาชิกกองทุนหมู่บ้าน · เงินออม ${baht(f.save)} · วงเงินกู้ ${baht(f.limit)} · ผ่อนตรงเวลามาแล้ว ${f.paidOff} สัญญา${f.late ? ` · <b class="bad">ผ่อนช้า ${f.late} งวด</b>` : ''}`) + DIM('ผ่อน 12 สัปดาห์ หักทุกวันศุกร์ ผ่อนช้าถูกปรับ 1% ของงวด ผ่อนช้าติดกัน 3 งวดกรรมการจะระงับสิทธิ์กู้ จนกว่าจะชำระหมด ปันผลเงินออม 5% ต้นปีเกม') +
        GR(C('💵', f.loan ? 'เงินกู้ที่ค้างอยู่' : 'ขอกู้เงิน', f.loan ? `คงเหลือ ${baht(Math.round(f.loan))} · ผ่อนสัปดาห์ละ ${baht(Math.round(f.weekly))} · เหลือ ${f.left} งวด` : `กู้ได้สูงสุด ${baht(f.limit)} รวมดอกเบี้ย 6% ผ่อน 12 งวด${f.late >= 3 ? ' · ⚠️ ถูกระงับสิทธิ์' : ''}`, f.loan ? B('vf.payoff', `ปิดหนี้ ${baht(Math.round(f.loan))}`, { dis: S.money < f.loan }) : [5000, 10000, 20000, 40000, 60000].filter(n => n <= f.limit).map(n => B('vf.loan|' + n, baht(n), { dis: !ok })).join('')) +
          C('🐷', 'ออมเงินกับกองทุน', 'ฝากเพิ่มรับปันผลปลายปี ถอนเมื่อไหร่ก็ได้ (ต้องเหลือ 100 ฿)', B('vf.dep|500', 'ฝาก 500', { dis: S.money < 500 }) + B('vf.dep|2000', 'ฝาก 2,000', { dis: S.money < 2000 }) + B('vf.out|500', 'ถอน 500', { ghost: 1, dis: f.save < 600 })));
    } };
  A['vf.join'] = () => { const f = vf(); if (!gov(['idcard', 'housereg'], 'สมัครกองทุนหมู่บ้าน') || !pay(100, 'กองทุนหมู่บ้าน: เงินออมแรกเข้า')) return; f.joined = S.day; f.save = 100; UI.toast('สมัครสมาชิกกองทุนหมู่บ้านแล้ว', '🏘️'); };
  A['vf.loan'] = n => { const f = vf(); n = +n; if (f.loan || n > f.limit || f.late >= 3) return; f.loan = n * 1.06; f.weekly = f.loan / 12; f.left = 12; gain(n, 'เงินกู้กองทุนหมู่บ้าน'); UI.toast(`กรรมการอนุมัติเงินกู้ ${baht(n)} ผ่อนสัปดาห์ละ ${baht(Math.round(f.weekly))}`, '💵'); };
  A['vf.payoff'] = () => { const f = vf(), n = Math.round(f.loan); if (f.loan && pay(n, 'ปิดหนี้กองทุนหมู่บ้าน')) { done(f); } };
  const done = f => { f.loan = 0; f.weekly = 0; f.left = 0; f.late = 0; f.paidOff++; f.limit = Math.min(60000, f.limit + 10000); msg('กองทุนหมู่บ้านสุขใจ', `ผ่อนชำระครบแล้ว! วงเงินกู้ครั้งต่อไปเพิ่มเป็น ${baht(f.limit)}`); };
  A['vf.dep'] = n => { const f = vf(); n = +n; if (pay(n, 'ออมเงินกองทุนหมู่บ้าน')) f.save += n; };
  A['vf.out'] = n => { const f = vf(); n = +n; if (f.save - n >= 100) { f.save -= n; gain(n, 'ถอนเงินออมกองทุนหมู่บ้าน'); } };
  DAILY.push(() => {
    const f = vf(); if (!f.joined) return;
    if ((S.day - 1) % YD === 0 && S.day > 1) { const d = Math.round(f.save * 0.05); if (d) { gain(d, 'ปันผลกองทุนหมู่บ้าน'); msg('กองทุนหมู่บ้านสุขใจ', `จ่ายปันผลเงินออม ${baht(d)}`); } }
    if (f.loan > 0 && dayIdx() === 4) { const due = Math.min(f.loan, f.weekly); if (S.money >= due) { S.money -= due; try { Bank2.log('ผ่อนชำระเงินกู้กองทุนหมู่บ้าน', -due); } catch (e) { } f.loan = Math.max(0, f.loan - due); f.left = Math.max(0, f.left - 1); f.late = 0; if (f.loan < 1) done(f); } else { const pen2 = Math.round(due * 0.01); f.loan += pen2; f.late++; msg('กองทุนหมู่บ้านสุขใจ', `ผ่อนงวดนี้ไม่ได้ ถูกปรับ ${baht(pen2)}${f.late >= 3 ? ' และกรรมการระงับสิทธิ์กู้รอบใหม่' : ''}`); } }
  });

  // ================= hub: phone app "ชีวิตประจำวัน" =================
  const TABS = ['🩺 สุขภาพ & ความงาม', '🏠 บ้าน & รถ', '🎬 ไลฟ์สไตล์', '💰 การเงิน', '🌾 เกษตร & ชุมชน'];
  const hub = { tab: 0, sys: '' };
  const render = t => {
    hub.tab = t; if (hub.sys && !SYS[hub.sys]) hub.sys = ''; if (hub.sys && SYS[hub.sys].tab !== t) hub.sys = '';
    if (hub.sys) { const s = SYS[hub.sys]; return `<div class="row">${B('hub.back', '‹ กลับรายการ', { ghost: 1 })}</div><h5>${s.i} ${s.n}</h5>` + s.view(); }
    return LEAD('บริการในชีวิตจริงที่มีในหมู่บ้านและเมือง: เลือกหัวข้อด้านล่าง · กินเวลาในเกมตามจริงและมีเวลาเปิด-ปิด') + GR(Object.entries(SYS).filter(([k, s]) => s.tab === t).map(([k, s]) => C(s.i, s.n, s.sum(), B('hub.open|' + k, 'เปิด'))).join(''));
  };
  A['hub.open'] = k => { hub.sys = k; }; A['hub.back'] = () => { hub.sys = ''; };
  const hubOpen = () => UI.open('🏙️ ชีวิตประจำวัน', TABS, render, { tab: hub.tab, wide: true });
  const reopen = () => hubOpen();
  addApp('life25', '🏙️', 'ชีวิตประจำวัน', hubOpen);

  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); if (G.started || true) for (const f of DAILY) { try { f(); } catch (e) { console.warn('life25 daily', e); } } return r; }; }
  window.Life25 = { open: hubOpen, L, SYS, tutorial: () => Tutorial.start(true) };
});
