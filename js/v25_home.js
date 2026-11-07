'use strict';
// ---------- v25_home: smart-home hub. Real dependencies: power (grid, battery, UPS), router + internet, Hub tier and slots,
// firmware, failures, permissions, scenes and automation rules, energy effects on the real grid model, upgrade path (5 tiers) ----------
V23.add('home25', () => {
  const S5 = () => {
    const s = S.v25 = S.v25 || {};
    s.homes = s.homes || {}; s.rules = s.rules || []; s.log = s.log || []; s.sel = s.sel || 'farm';
    s.perms = s.perms || { loc: 1, mic: 1, cloud: 0, notif: 1 };
    s.pwd = s.pwd | 0; s.cloudDay = s.cloudDay | 0; s.lastWx = s.lastWx || ''; s.lastOut = s.lastOut | 0;
    return s;
  };
  const latestFw = () => 1 + Math.floor(S.day / 14);
  const H = hid => {
    const s = S5(), h = s.homes[hid] = s.homes[hid] || { tier: 0, up: null, own: {}, brk: {}, fw: latestFw(), scene: '', lights: 1, auto: { ac: 1, lock: 1, ev: 1, irr: 1, geo: 1 } };
    h.auto = h.auto || { ac: 1, lock: 1, ev: 1, irr: 1, geo: 1 };
    if (h.up && S.day >= h.up.day) { h.tier = h.up.n; h.up = null; }
    return h;
  };
  const effTier = h => (h.up && S.day >= h.up.day ? h.up.n : h.tier);
  const SLOTS = [0, 8, 16, 24, 32, 40];
  const MAIN = 'farm';
  const log = (t, hid) => { const s = S5(); s.log.unshift({ d: S.day, h: Math.floor(S.time / 60), t, home: hid || MAIN }); s.log.length = Math.min(s.log.length, 30); };
  const notify = t => { const s = S5(); log(t); if (s.perms.notif && netUp() && !G.simulating) Phone.msg('บ้านอัจฉริยะ', t); };

  // ================= dependencies =================
  const netUp = () => { try { return ISP.speed() > 0; } catch (e) { return false; } };
  const routerOK = () => { try { return Sec.site('home').dev.some(d => DEV[d.k].t === 'router'); } catch (e) { return false; } };
  const backup = () => { let u = false; try { u = V23.IT && V23.IT.has('n_ups'); } catch (e) { } return u || Power.st().soc > 0.8; };
  const hasPower = hid => {
    if (hid === MAIN) { const w = Power.st(), dark = w.out > 0 || w.trip || S.powerOff; return !dark || backup(); }
    try { return Prop23.need(Prop23.home(hid), { e: 1 }) === ''; } catch (e) { return false; }
  };
  const solarOK = () => Power.st().panels + Power.st().farm > 0;

  // ================= device catalog =================
  // k · g group · n · i · p price · d install days · t min hub tier · wifi (needs router+internet) · cloud (cloud features need internet) · need() reason string
  const DV = [
    { k: 'slight', g: 'light', n: 'หลอดไฟอัจฉริยะ RGB ทั้งบ้าน', i: '💡', p: 3200, d: 1, t: 1, desc: 'หรี่/เปลี่ยนสี ตั้งฉาก ไฟกลางคืนกินไฟน้อยลง (LED + ควบคุมได้)' },
    { k: 'sswitch', g: 'light', n: 'สวิตช์ไฟอัจฉริยะ + เซนเซอร์ตรวจคนในห้อง', i: '🎚️', p: 4800, d: 1, t: 2, desc: 'ไฟดับเองเมื่อไม่มีคน ลดโหลดไฟตลอดวัน' },
    { k: 'curtain', g: 'light', n: 'ม่านไฟฟ้าอัตโนมัติ', i: '🪟', p: 8900, d: 2, t: 2, desc: 'ปิดม่านกันแดดช่วงบ่าย แอร์กินไฟน้อยลง' },
    { k: 'spk', g: 'light', n: 'ลำโพงอัจฉริยะมัลติรูม', i: '🔈', p: 5200, d: 1, t: 2, wifi: 1, cloud: 1, desc: 'ฉากดูหนังและเพลงทั่วบ้าน (ต้องมี Wi-Fi และอินเทอร์เน็ต) อารมณ์ดีขึ้นทุกวัน' },
    { k: 'thermo', g: 'climate', n: 'ตัวควบคุมแอร์/เทอร์โมสตัทอัจฉริยะ', i: '🌡️', p: 5500, d: 1, t: 1, need: () => (S.furn.aircon ? '' : 'ต้องมีแอร์ในบ้านก่อน'), desc: 'เปิด-ปิดแอร์ตามอากาศและเวลา แอร์กินไฟน้อยลง 20%' },
    { k: 'slock', g: 'sec', n: 'กลอนประตูดิจิทัล (ลายนิ้วมือ)', i: '🔐', p: 6900, d: 1, t: 1, desc: 'ล็อกเองตอน 22:00 ขโมยเข้าบ้านยากขึ้น' },
    { k: 'vdoor', g: 'sec', n: 'กริ่งประตูวิดีโอ + แจ้งเตือนมือถือ', i: '🔔', p: 4200, d: 1, t: 1, wifi: 1, cloud: 1, desc: 'เห็นคนมาที่ประตูทุกที่ที่มีเน็ต โอกาสถูกขโมยลดลง' },
    { k: 'scam', g: 'sec', n: 'กล้องในบ้าน Wi-Fi ×2 (เชื่อมระบบ CCTV)', i: '📹', p: 3900, d: 1, t: 2, wifi: 1, cloud: 1, desc: 'เสริมระบบกล้องวงจรปิดของบ้าน บันทึกคลาวด์ได้ถ้าอนุญาต' },
    { k: 'siren', g: 'sec', n: 'ไซเรน + เซนเซอร์ประตู/หน้าต่าง', i: '🚨', p: 3500, d: 1, t: 1, desc: 'ตั้งโหมดออกจากบ้านแล้วเปิดเตือนภัยอัตโนมัติ' },
    { k: 'smoke', g: 'safety', n: 'เซนเซอร์ควัน + CO อัจฉริยะ', i: '🧯', p: 2800, d: 1, t: 1, desc: 'ตรวจเจอไฟไหม้ในไร่ แจ้งเตือนทันที (ถ้ามีเน็ตแจ้งถึงมือถือ)' },
    { k: 'sprinkler', g: 'safety', n: 'สปริงเกอร์ดับเพลิงอัตโนมัติ', i: '🚿', p: 22000, d: 3, t: 2, need: () => (H(MAIN).own.smoke ? '' : 'ต้องติดเซนเซอร์ควันก่อน'), desc: 'พ่นน้ำดับไฟในไร่เองเมื่อเซนเซอร์ตรวจเจอ' },
    { k: 'leak', g: 'safety', n: 'เซนเซอร์น้ำรั่ว + แจ้งเตือน', i: '💦', p: 3600, d: 1, t: 1, desc: 'รู้ทันทีเมื่อท่อรั่ว เรียกช่างได้ในครั้งเดียว ไม่เสียน้ำหลายวัน' },
    { k: 'plug', g: 'energy', n: 'ปลั๊กอัจฉริยะวัดไฟ ×6', i: '🔌', p: 2400, d: 1, t: 1, desc: 'ตัดไฟสแตนด์บาย ลดโหลดไฟตลอดวัน' },
    { k: 'emon', g: 'energy', n: 'มิเตอร์วัดพลังงานทั้งบ้าน (CT clamp)', i: '📈', p: 5900, d: 1, t: 2, desc: 'ตัดแอร์ก่อนเบรกเกอร์ตัดเมื่อโหลดใกล้เกินมิเตอร์' },
    { k: 'divert', g: 'energy', n: 'ตัวจัดโหลดตามโซลาร์ (Load diverter)', i: '☀️', p: 14000, d: 2, t: 3, need: () => (solarOK() ? '' : 'ต้องมีแผงโซลาร์ก่อน'), desc: 'ย้ายโหลดไปใช้ช่วงแดดจัด ลดการซื้อไฟ' },
    { k: 'evsmart', g: 'energy', n: 'ชาร์จ EV อัจฉริยะ (ชาร์จช่วงไฟถูก/โซลาร์เหลือ)', i: '🔋', p: 9800, d: 2, t: 3, need: () => (S.furn.evcharger ? '' : 'ต้องมีจุดชาร์จรถที่บ้านก่อน'), desc: 'ชาร์จเฉพาะ 22:00-06:00 หรือช่วงโซลาร์เหลือ' },
    { k: 'irrig', g: 'farm', n: 'ชุดควบคุมรดน้ำแบ่งโซน (06:00 และ 15:00)', i: '🚰', p: 11500, d: 2, t: 2, desc: 'รดน้ำแปลงที่แห้งตามเวลา ใช้น้ำจริงจากระบบประปา' },
    { k: 'soil', g: 'farm', n: 'เซนเซอร์ความชื้นดิน + สถานีอากาศ', i: '🌱', p: 7800, d: 1, t: 2, wifi: 1, desc: 'รดน้ำเฉพาะแปลงที่แห้งและข้ามวันฝนตก ประหยัดน้ำ' },
    { k: 'barn', g: 'farm', n: 'ตัวเติมอาหารสัตว์อัตโนมัติ', i: '🐄', p: 8400, d: 2, t: 2, desc: 'เติมอาหารสัตว์ในรางทุกเช้าจากอาหารในกระเป๋า' },
    { k: 'airq', g: 'light', n: 'เซนเซอร์คุณภาพอากาศ PM2.5', i: '🌫️', p: 3200, d: 1, t: 2, need: () => (S.furn.airpurifier ? '' : 'ต้องมีเครื่องฟอกอากาศก่อน'), desc: 'เปิดเครื่องฟอกอากาศเองเมื่อฝุ่นสูง อารมณ์ดีขึ้นทุกวัน' },
  ];
  const DVK = {}; for (const d of DV) DVK[d.k] = d;
  const GROUPS = { light: '💡 แสง & ความสะดวกสบาย', climate: '❄️ ภูมิอากาศ', sec: '🔐 ความปลอดภัย', safety: '🧯 ภัยพิบัติ', energy: '⚡ พลังงาน', farm: '🌾 ไร่ & สัตว์' };
  const TIERS = [
    { n: 1, nm: 'Smart Hub (Zigbee/Matter)', i: '🎛️', p: 6500, d: 1, desc: 'ศูนย์กลางควบคุม ได้ 8 อุปกรณ์ ฉากพื้นฐาน', req: () => '' },
    { n: 2, nm: 'เครือข่ายเมช Wi-Fi 6E ทั่วบ้าน', i: '📶', p: 18000, d: 2, desc: 'รองรับ 16 อุปกรณ์ อุปกรณ์ Wi-Fi และกล้องเสถียร', req: () => (routerOK() && netUp() ? '' : 'ต้องมีเราเตอร์ติดตั้งแล้วและอินเทอร์เน็ตใช้งานได้ (ศูนย์ไอที)') },
    { n: 3, nm: 'ระบบอัตโนมัติ (กฎ + ฉาก + แดชบอร์ดพลังงาน)', i: '⚙️', p: 35000, d: 3, desc: 'รองรับ 24 อุปกรณ์ สร้างกฎอัตโนมัติได้สูงสุด 8 ข้อ', req: () => (Object.keys(H(S5().sel).own).length >= 5 ? '' : 'ต้องติดอุปกรณ์อย่างน้อย 5 ชิ้นก่อน') },
    { n: 4, nm: 'AI ประจำบ้าน (Edge AI)', i: '🧠', p: 70000, d: 4, desc: 'รองรับ 32 อุปกรณ์ พยากรณ์อากาศล่วงหน้าเพื่อข้ามการรดน้ำ เปิดแอร์ล่วงหน้า', req: () => ((() => { try { return ISP.speed() >= 100; } catch (e) { return false; } })() ? (S.furn.aispeaker ? '' : 'ต้องมีลำโพง AI "น้องสุขใจ" ก่อน') : 'ต้องใช้อินเทอร์เน็ตตั้งแต่ 100 Mbps') },
    { n: 5, nm: 'บ้านพึ่งพาตนเอง (Microgrid)', i: '🔆', p: 150000, d: 5, desc: 'รองรับ 40 อุปกรณ์ จัดลำดับโหลดตอนไฟดับ ลดค่าไฟเพิ่ม', req: () => (solarOK() && Power.st().batt > 0 ? '' : 'ต้องมีแผงโซลาร์และแบตเตอรี่บ้านก่อน') },
  ];

  // ================= device state =================
  const why = (hid, k) => {
    const h = H(hid), D = DVK[k], o = h.own[k];
    if (!o) return 'ยังไม่ได้ติดตั้ง';
    if (S.day < o.day) return `ช่างมาติดตั้ง${RD(o.day)}`;
    const b = h.brk[k]; if (b) return b.fix ? `ช่างซ่อม${RD(b.fix)}` : 'อุปกรณ์เสีย รอเรียกช่าง';
    if (effTier(h) < 1) return 'ต้องมี Smart Hub';
    if (!hasPower(hid)) return 'ไม่มีไฟฟ้า';
    if (D.wifi && !(routerOK() && netUp())) return 'Wi-Fi/อินเทอร์เน็ตใช้ไม่ได้';
    if (D.cloud && !netUp()) return 'ไม่มีอินเทอร์เน็ต (ใช้ได้เฉพาะในบ้าน)';
    return '';
  };
  const on = (hid, k) => { const w = why(hid, k); return w === '' || w.indexOf('ไม่มีอินเทอร์เน็ต') === 0; };
  const cnt = hid => Object.keys(H(hid).own).length;
  const hacked = () => !!S5().hacked;

  // ================= effects on the main house =================
  const redu = h => {
    if (effTier(H(MAIN)) < 1) return 0;
    let r = 0; const night = h >= 18 || h < 6, m = H(MAIN);
    if (on(MAIN, 'slight') && night) r += 0.13;
    if (on(MAIN, 'sswitch')) r += 0.08;
    if (on(MAIN, 'plug')) r += 0.06;
    if (on(MAIN, 'thermo') && S.ac) r += 0.28;
    if (on(MAIN, 'curtain') && S.ac && h >= 10 && h <= 16) r += 0.11;
    if (on(MAIN, 'divert') && Power.sun(h) > 0.3) r += 0.15;
    if (night && m.lights === 0 && (on(MAIN, 'slight') || on(MAIN, 'sswitch'))) r += 0.22;
    if (effTier(m) >= 5) r += 0.05;
    return Math.min(r, 0.6);
  };
  Power.extra.push(h => -redu(h));
  { const _t = Sec.thiefMult.bind(Sec);
    Sec.thiefMult = function () {
      let m = _t();
      if (hacked()) return m;
      if (on(MAIN, 'slock')) m *= 0.85; if (on(MAIN, 'vdoor')) m *= 0.85; if (on(MAIN, 'scam')) m *= S5().perms.cloud ? 0.8 : 0.9; if (on(MAIN, 'siren') && S.sec && S.sec.armed) m *= 0.9;
      return Math.max(0.15, m);
    }; }
  // the energy meter sheds the air-con before the breaker trips
  { const _hs = Power.hourStep.bind(Power);
    Power.hourStep = function (h) {
      try { hour(h); } catch (e) { console.warn('home25 hour', e); }
      if (on(MAIN, 'emon') && S.ac && !Power.st().trip && Power.load(h) > Power.st().amp * 0.92) { S.ac = false; notify(`มิเตอร์วัดพลังงานตัดแอร์ก่อนเบรกเกอร์ตัด (โหลด ${Power.load(h).toFixed(1)} kW)`); }
      return _hs(h);
    }; }
  // fires: smoke sensor alerts, sprinklers put them out
  { const _ig = Emergency.ignite.bind(Emergency);
    Emergency.ignite = function (x, z, why2) {
      const f = _ig(x, z, why2);
      if (f && effTier(H(MAIN)) >= 1) {
        if (on(MAIN, 'smoke')) notify('เซนเซอร์ควันตรวจพบไฟไหม้ในไร่! ' + (on(MAIN, 'sprinkler') ? 'สปริงเกอร์กำลังทำงาน' : 'โทร 199 หรือไปดับไฟ'));
        if (on(MAIN, 'sprinkler') && on(MAIN, 'smoke')) { let n = 0; const iv = setInterval(() => { if (!Emergency.fires.includes(f) || ++n > 8) { clearInterval(iv); return; } Emergency.douse(f, 0.16); }, 2000); }
      }
      return f;
    }; }
  { const _st = Emergency.spawnThief.bind(Emergency);
    Emergency.spawnThief = function (r) {
      if (!hacked() && effTier(H(MAIN)) >= 1 && (on(MAIN, 'vdoor') || on(MAIN, 'scam'))) notify('กล้องตรวจพบคนแปลกหน้าเข้ามาในไร่ตอนกลางคืน ส่งภาพให้แล้ว');
      return _st(r);
    }; }
  // lightning can fry smart devices unless there is surge protection or a UPS
  { const _o = Grid.outageStart.bind(Grid);
    Grid.outageStart = function (hrs, cause) {
      const before = Power.st().out; _o(hrs, cause);
      if (!before && Power.st().out > 0 && /ฟ้า|พายุ/.test(cause || '')) {
        let protectd = backup(); try { protectd = protectd || V23.IT.has('e_surge'); } catch (e) { }
        if (!protectd) for (const hid of Object.keys(S5().homes)) { const h = H(hid); for (const k of Object.keys(h.own)) if (S.day >= h.own[k].day && !h.brk[k] && Math.random() < 0.08) { h.brk[k] = { day: S.day }; notify(`ไฟกระชากจากฟ้าผ่า! "${DVK[k].n}" เสียหาย ต้องเรียกช่างซ่อม`); } }
      }
    }; }

  // ================= automation =================
  const SCENES = {
    away: { n: 'ออกจากบ้าน', i: '🚪', lights: 0, lock: 1, ac: 0, arm: 1, d: 'ปิดไฟและแอร์ ล็อกประตู เปิดเตือนภัย' },
    sleep: { n: 'เข้านอน', i: '🌙', lights: 0, lock: 1, d: 'ปิดไฟ ล็อกประตู' },
    movie: { n: 'ดูหนัง', i: '🎬', lights: 0, mood: 6, d: 'หรี่ไฟ ปิดม่าน อารมณ์ดีขึ้น (วันละครั้ง)' },
    morning: { n: 'ตื่นนอน', i: '☀️', lights: 1, lock: 0, d: 'เปิดไฟ ปลดล็อกประตู เปิดม่าน' },
    home: { n: 'กลับถึงบ้าน', i: '🏠', lights: 1, lock: 0, acHot: 1, d: 'เปิดไฟ ปลดล็อก เปิดแอร์ถ้าอากาศร้อน' },
  };
  const hasLights = () => on(MAIN, 'slight') || on(MAIN, 'sswitch');
  const runScene = (k, quiet) => {
    const sc = SCENES[k], m = H(MAIN); if (!sc) return false;
    const done = [], skip = [];
    if (sc.lights != null) { if (hasLights()) { m.lights = sc.lights; done.push(sc.lights ? 'เปิดไฟ' : 'ปิดไฟ'); } else skip.push('ไฟ (ต้องมีหลอดไฟ/สวิตช์อัจฉริยะ)'); }
    if (sc.lock != null) { if (on(MAIN, 'slock')) { S.locked = !!sc.lock; done.push(sc.lock ? 'ล็อกประตู' : 'ปลดล็อกประตู'); } else skip.push('ประตู (ต้องมีกลอนดิจิทัล)'); }
    if (sc.ac === 0 || (sc.acHot && (season().id === 'hot' || S.weather.type === 'sunny'))) {
      if (on(MAIN, 'thermo') && S.furn.aircon) { const want = sc.ac === 0 ? false : true; if (!(want && (Power.st().trip || S.powerOff))) { S.ac = want; done.push(want ? 'เปิดแอร์' : 'ปิดแอร์'); } } else if (sc.ac === 0) skip.push('แอร์ (ต้องมีตัวควบคุมแอร์)');
    }
    if (sc.arm) { if (on(MAIN, 'siren') && S.sec) { S.sec.armed = 1; done.push('เปิดเตือนภัย'); } }
    if (sc.mood && !S.daily.v25movie && (on(MAIN, 'spk') || S.furn.projector || on(MAIN, 'slight'))) { S.daily.v25movie = 1; S.mood = Math.min(100, (S.mood || 50) + sc.mood); done.push(`อารมณ์ +${sc.mood}`); }
    m.scene = k;
    log(`ฉาก "${sc.n}": ${done.join(', ') || 'ไม่มีอุปกรณ์ที่ทำงานได้'}`);
    if (!quiet && !G.simulating) UI.toast(`${sc.i} ฉาก${sc.n}: ${done.join(', ') || 'ยังไม่มีอุปกรณ์ที่ใช้ได้'}${skip.length ? ' · ข้าม: ' + skip.join(', ') : ''}`, sc.i);
    return done.length > 0;
  };
  const TRIG = {
    time: { n: 'เมื่อถึงเวลา', i: '🕒' }, rain: { n: 'เมื่อฝนเริ่มตก', i: '🌧️' }, hot: { n: 'เมื่อร้อนจัด (11:00-16:00 แดดจัด)', i: '🥵' },
    away: { n: 'เมื่อออกจากบ้าน (ไกลเกิน 90 เมตร)', i: '🚪' }, home: { n: 'เมื่อกลับถึงบ้าน', i: '🏠' }, out: { n: 'เมื่อไฟดับ', i: '🌑' }, leak: { n: 'เมื่อพบน้ำรั่ว', i: '💦' },
  };
  const ACT = {
    light_on: { n: 'เปิดไฟ', i: '💡' }, light_off: { n: 'ปิดไฟ', i: '🌑' }, ac_on: { n: 'เปิดแอร์', i: '❄️' }, ac_off: { n: 'ปิดแอร์', i: '🌡️' }, lock: { n: 'ล็อกประตู', i: '🔒' }, unlock: { n: 'ปลดล็อกประตู', i: '🔓' },
    water: { n: 'รดน้ำแปลงที่แห้ง', i: '💧' }, ev_on: { n: 'เปิดชาร์จ EV', i: '🔌' }, ev_off: { n: 'ปิดชาร์จ EV', i: '⛔' }, music_on: { n: 'เปิดเพลง', i: '🎵' }, music_off: { n: 'ปิดเพลง', i: '🔇' }, notify: { n: 'ส่งแจ้งเตือนมือถือ', i: '📲' },
    'sc:away': { n: 'ฉากออกจากบ้าน', i: '🚪' }, 'sc:sleep': { n: 'ฉากเข้านอน', i: '🌙' }, 'sc:morning': { n: 'ฉากตื่นนอน', i: '☀️' }, 'sc:home': { n: 'ฉากกลับถึงบ้าน', i: '🏠' }, 'sc:movie': { n: 'ฉากดูหนัง', i: '🎬' },
  };
  const waterDry = (all) => {
    const rain = (WEATHER[S.weather.type] || {}).rain > 0.3;
    if (rain && !all) return 0;
    let n = 0; S.plots.forEach(p => { if (p.c && (all || p.w <= 0)) { if (p.w <= 0) n++; p.w = 1; } });
    if (n) { try { Water.use(0.04 * n); } catch (e) { } }
    return n;
  };
  const runAct = a => {
    const m = H(MAIN);
    if (a.indexOf('sc:') === 0) return runScene(a.slice(3), true);
    switch (a) {
      case 'light_on': case 'light_off': if (!hasLights()) return false; m.lights = a === 'light_on' ? 1 : 0; return true;
      case 'ac_on': case 'ac_off': if (!on(MAIN, 'thermo') || !S.furn.aircon) return false; if (a === 'ac_on' && (Power.st().trip || S.powerOff)) return false; S.ac = a === 'ac_on'; return true;
      case 'lock': case 'unlock': if (!on(MAIN, 'slock')) return false; S.locked = a === 'lock'; return true;
      case 'water': if (!on(MAIN, 'irrig') && !S.furn.smartgarden) return false; { const n = waterDry(true); if (n) log(`รดน้ำ ${n} แปลง`); return true; }
      case 'ev_on': case 'ev_off': if (!on(MAIN, 'evsmart') && !S.furn.evcharger) return false; Power.st().evOn = a === 'ev_on' ? 1 : 0; return true;
      case 'music_on': case 'music_off': if (!on(MAIN, 'spk') && !S.furn.aispeaker) return false; S.music = a === 'music_on'; try { Music.setOn(S.music); } catch (e) { } return true;
      case 'notify': if (!netUp()) return false; notify('แจ้งเตือนตามกฎอัตโนมัติ'); return true;
    }
    return false;
  };
  const fire = (trig, hr) => {
    const s = S5(), m = H(MAIN); if (effTier(m) < 3) return;
    for (const r of s.rules) {
      if (!r.on || r.trig !== trig) continue;
      if (trig === 'time' && r.h !== hr) continue;
      const okAct = runAct(r.act); log(`กฎ "${TRIG[trig].n.replace('เมื่อ', '')} → ${ACT[r.act].n}": ${okAct ? 'ทำแล้ว' : 'ทำไม่ได้ (ขาดอุปกรณ์/ไฟ)'}`);
    }
  };
  let awayNow = false;
  const hour = h => {
    const s = S5(), m = H(MAIN);
    if (effTier(m) < 1) return;
    const pw = hasPower(MAIN), wx = S.weather.type;
    // thermostat: air-con follows the weather and the player
    if (pw && on(MAIN, 'thermo') && m.auto.ac && S.furn.aircon && !Power.st().trip && !S.powerOff) {
      const hotSeason = season().id === 'hot', want = !awayNow && ((h >= 11 && h <= 17 && (hotSeason || wx === 'sunny')) || (hotSeason && h >= 20 && h <= 23));
      if (want !== !!S.ac && m.scene !== 'sleep') { S.ac = want; log(want ? 'เทอร์โมสตัทเปิดแอร์ (อากาศร้อน)' : 'เทอร์โมสตัทปิดแอร์'); }
    }
    if (pw && on(MAIN, 'slock') && m.auto.lock) { if (h === 22 && !S.locked) { S.locked = true; log('กลอนดิจิทัลล็อกประตูอัตโนมัติ 22:00'); } if (h === 6 && S.locked) { S.locked = false; log('กลอนดิจิทัลปลดล็อกตอนเช้า'); } }
    if (on(MAIN, 'evsmart') && m.auto.ev && S.furn.evcharger) Power.st().evOn = (h >= 22 || h < 6 || (Power.kwp() > 0 && Power.sun(h) > 0.55)) ? 1 : 0;
    if (pw && on(MAIN, 'irrig') && m.auto.irr && (h === 6 || h === 15)) {
      const soil = on(MAIN, 'soil'), n = waterDry(!soil);
      if (n) log(`ระบบรดน้ำแบ่งโซนรดน้ำ ${n} แปลง${soil ? ' (เฉพาะแปลงที่แห้ง)' : ''}`);
      else if (soil && (WEATHER[wx] || {}).rain > 0.3) log('เซนเซอร์ดินข้ามการรดน้ำเพราะฝนตก');
    }
    // the edge AI looks at tomorrow's weather: no watering when rain is coming
    if (effTier(m) >= 4 && h === 5 && on(MAIN, 'soil') && (WEATHER[S.weather.next] || {}).rain > 0.3) log('Edge AI: พรุ่งนี้ฝนตก ข้ามการรดน้ำ');
    // leak sensor
    const lk = S.v23it && S.v23it.leak;
    if (lk && !lk.found && on(MAIN, 'leak')) { lk.found = 1; notify('เซนเซอร์พบน้ำรั่ว! เรียกช่างซ่อมได้ที่ศูนย์บ้านอัจฉริยะ (800 ฿)'); fire('leak'); }
    if (on(MAIN, 'airq') && S.furn.airpurifier && h === 12) { const w = S.weather.type; if (w === 'fog' || w === 'sunny') log('เซนเซอร์ฝุ่นสั่งเปิดเครื่องฟอกอากาศ'); }
    // triggers
    fire('time', h);
    if (wx !== s.lastWx) { if (wx === 'rain' || wx === 'storm') fire('rain'); s.lastWx = wx; }
    if (h >= 11 && h <= 15 && season().id === 'hot' && wx === 'sunny' && h === 11) fire('hot');
    const out = Power.st().out > 0 || Power.st().trip ? 1 : 0; if (out && !s.lastOut) { fire('out'); if (effTier(m) >= 5 && Power.st().soc > 1 && S.ac) { S.ac = false; log('Microgrid: ตัดแอร์ประหยัดแบตเตอรี่ตอนไฟดับ'); } } s.lastOut = out;
  };
  setInterval(() => {
    try {
      if (!G.started || !G.player || G.simulating) return;
      const m = H(MAIN); if (effTier(m) < 1) return;
      const p = G.player.pos, away = !!G.away || (!G.inside && Math.hypot(p.x - HOUSE_POS.x, p.z - HOUSE_POS.z) > 90);
      if (away !== awayNow) {
        awayNow = away;
        if (S5().perms.loc && m.auto.geo) { if (away) runScene('away', false); else if (m.scene === 'away') runScene('home', false); }
        fire(away ? 'away' : 'home');
      }
    } catch (e) { }
  }, 2500);

  // ================= daily: installers, failures, firmware, security =================
  const day = () => {
    const s = S5();
    for (const hid of Object.keys(s.homes)) {
      const h = H(hid);
      for (const k of Object.keys(h.own)) { const o = h.own[k]; if (!o.msg && S.day >= o.day) { o.msg = 1; Phone.msg('ช่างติดตั้ง', `ติดตั้ง "${DVK[k].n}" เสร็จแล้ว ${hid === MAIN ? '' : '(' + homeName(hid) + ') '}เปิดศูนย์บ้านอัจฉริยะเพื่อใช้งาน`); } }
      for (const k of Object.keys(h.brk)) { const b = h.brk[k]; if (b.fix && S.day >= b.fix) { delete h.brk[k]; Phone.msg('ช่างซ่อม', `ซ่อม "${DVK[k].n}" เรียบร้อยแล้ว`); } }
      if (h.up && S.day >= h.up.day) { const T = TIERS[h.up.n - 1]; h.tier = h.up.n; h.up = null; Phone.msg('ช่างติดตั้ง', `ติดตั้ง "${T.nm}" เสร็จแล้ว รองรับอุปกรณ์ ${SLOTS[h.tier]} ชิ้น`); }
      // random failures: old firmware and no surge protection make them more likely
      const lag = latestFw() - h.fw; let surge = backup(); try { surge = surge || V23.IT.has('e_surge'); } catch (e) { }
      for (const k of Object.keys(h.own)) if (S.day >= h.own[k].day && !h.brk[k] && Math.random() < 0.004 * (lag >= 2 ? 2 : 1) * (surge ? 1 : 2)) { h.brk[k] = { day: S.day }; log(`"${DVK[k].n}" เสีย`, hid); Phone.msg('บ้านอัจฉริยะ', `"${DVK[k].n}" ขัดข้อง ต้องเรียกช่างซ่อม`); }
    }
    const m = H(MAIN), lag = latestFw() - m.fw;
    if (lag === 2 && !m.fwWarn) { m.fwWarn = 1; Phone.msg('บ้านอัจฉริยะ', 'มีเฟิร์มแวร์ใหม่หลายรุ่น อุปกรณ์เสี่ยงขัดข้องและถูกเจาะ รีบอัปเดตในศูนย์บ้านอัจฉริยะ'); }
    // old firmware + weak password: the cameras can get hijacked
    if (!s.hacked && lag >= 2 && !s.pwd && (on(MAIN, 'scam') || on(MAIN, 'vdoor')) && netUp() && Math.random() < 0.02) {
      s.hacked = S.day; S.mood = Math.max(0, (S.mood || 50) - 6); notify('ตรวจพบการเข้าถึงกล้องในบ้านโดยไม่ได้รับอนุญาต! เปลี่ยนรหัสผ่านและอัปเดตเฟิร์มแวร์ที่ศูนย์บ้านอัจฉริยะ');
    }
    // cloud recording subscription, billed weekly
    if (s.perms.cloud && on(MAIN, 'scam') && S.day - s.cloudDay >= 7) {
      if (S.money >= 99) { S.money -= 99; s.cloudDay = S.day; try { Bank2.log('ค่าบริการบันทึกกล้องคลาวด์', -99); } catch (e) { } } else { s.perms.cloud = 0; Phone.msg('บ้านอัจฉริยะ', 'เงินไม่พอจ่ายค่าบริการคลาวด์ ปิดการบันทึกคลาวด์แล้ว'); }
    }
    // morning chores: feed the barn, voice assistant brief
    if (effTier(m) >= 1 && hasPower(MAIN) && on(MAIN, 'barn') && S.animals.length) {
      const need = (typeof Animal40 !== 'undefined' ? Animal40.need() : S.animals.length) - S.trough, n = Math.min(Math.max(0, need), count('feed'));
      if (n > 0) { takeItem('feed', n); S.trough += n; log(`เติมอาหารสัตว์ ${n} หน่วย`); }
    }
    if (on(MAIN, 'spk') && effTier(m) >= 1) S.mood = Math.min(100, (S.mood || 50) + 1);
    if (on(MAIN, 'airq') && S.furn.airpurifier) S.mood = Math.min(100, (S.mood || 50) + 1);
  };
  { const _m = Smart.morning.bind(Smart); Smart.morning = function () { const r = _m(); try { day(); } catch (e) { console.warn('home25 day', e); } return r; }; }

  // ================= voice assistant commands =================
  { const _a = Smart.answer.bind(Smart);
    Smart.answer = function (q) {
      const t = (q || '').trim(), m = H(MAIN);
      const voice = effTier(m) >= 1 && S.furn.aispeaker && S5().perms.mic && hasPower(MAIN);
      const map = [[/โหมด(ออกจากบ้าน|ไม่อยู่)|ออกจากบ้าน/, 'away'], [/โหมด(นอน|เข้านอน)|เข้านอน/, 'sleep'], [/โหมดดูหนัง|ดูหนัง/, 'movie'], [/โหมด(เช้า|ตื่น)|ตื่นนอน/, 'morning'], [/กลับบ้าน|ถึงบ้านแล้ว/, 'home']];
      if (voice) {
        for (const [re, sc] of map) if (re.test(t)) { const okk = runScene(sc, true); this.log = this.log || []; this.log.push({ t }); this.log.push({ ai: 1, t: okk ? `เปิดฉาก${SCENES[sc].n}ให้แล้วค่ะ` : `ฉาก${SCENES[sc].n}ยังไม่มีอุปกรณ์ที่ใช้ได้ค่ะ ติดตั้งในศูนย์บ้านอัจฉริยะ` }); return; }
        let a = null;
        if (/เปิดไฟ/.test(t)) a = runAct('light_on') ? 'เปิดไฟแล้วค่ะ' : 'บ้านยังไม่มีหลอดไฟอัจฉริยะค่ะ';
        else if (/ปิดไฟ/.test(t)) a = runAct('light_off') ? 'ปิดไฟแล้วค่ะ' : 'บ้านยังไม่มีหลอดไฟอัจฉริยะค่ะ';
        else if (/ล็อก(ประตู|บ้าน)/.test(t) && !/ปลด/.test(t)) a = runAct('lock') ? 'ล็อกประตูแล้วค่ะ' : 'ยังไม่มีกลอนประตูดิจิทัลค่ะ';
        else if (/ปลดล็อก/.test(t)) a = runAct('unlock') ? 'ปลดล็อกประตูแล้วค่ะ' : 'ยังไม่มีกลอนประตูดิจิทัลค่ะ';
        else if (/รดน้ำ/.test(t)) a = runAct('water') ? 'สั่งรดน้ำแปลงที่แห้งแล้วค่ะ' : 'ยังไม่มีระบบรดน้ำอัตโนมัติค่ะ';
        else if (/ใช้ไฟ|พลังงาน/.test(t)) { const st = Power.status(); a = `ตอนนี้บ้านใช้ไฟ ${st.use.toFixed(1)} kW โซลาร์ผลิต ${st.prod.toFixed(1)} kW ประหยัดจากอุปกรณ์อัจฉริยะประมาณ ${redu(Math.floor(S.time / 60)).toFixed(2)} kW ค่ะ`; }
        if (a) { this.log = this.log || []; this.log.push({ t }); this.log.push({ ai: 1, t: a }); return; }
      } else if (effTier(m) >= 1 && S.furn.aispeaker && map.some(([re]) => re.test(t)) && !S5().perms.mic) { this.log = this.log || []; this.log.push({ t }); this.log.push({ ai: 1, t: 'ไมโครโฟนถูกปิดในแอปบ้านอัจฉริยะค่ะ เปิดสิทธิ์ก่อนนะคะ' }); return; }
      return _a(q);
    }; }

  // ================= UI =================
  const homeName = hid => (hid === MAIN ? 'บ้านหลัก' : (() => { try { return Prop23.homeName(hid); } catch (e) { return hid; } })());
  const homes = () => [MAIN].concat(Object.keys((Prop23 && Prop23.homePoi) || {}));
  const hub = { tab: 0 };
  const sel = () => { const s = S5(); if (homes().indexOf(s.sel) < 0) s.sel = MAIN; return s.sel; };
  const badge = (g, t) => `<b class="${g ? 'good' : 'bad'}">${t}</b>`;
  const selector = () => { const L = homes(); if (L.length < 2) return ''; return `<div class="row">${L.map(id => `<button class="btn ${id === sel() ? '' : 'ghost'}" data-a="v25" data-v="home" data-h="${esc(id)}">${id === MAIN ? '🏡' : '🏠'} ${esc(homeName(id))}</button>`).join('')}</div>`; };
  const envCards = hid => {
    const pw = hasPower(hid), net = netUp(), rt = routerOK(), h = H(hid), t = effTier(h);
    return `<div class="grid">
      <div class="card"><div class="ci">${pw ? '⚡' : '🌑'}</div><div class="cb"><h4>ไฟฟ้า ${badge(pw, pw ? (hid === MAIN && (Power.status().dark || S.powerOff) ? 'สำรองไฟ' : 'ปกติ') : 'ดับ')}</h4><p class="dim">${hid === MAIN ? `สำรองไฟ: ${backup() ? 'มี (UPS/แบตเตอรี่)' : 'ไม่มี'}` : 'ต้องขอไฟฟ้าที่แผงมิเตอร์หน้าบ้านก่อน'}</p></div></div>
      <div class="card"><div class="ci">📶</div><div class="cb"><h4>เครือข่าย ${badge(net && rt, net && rt ? 'ออนไลน์' : 'ขัดข้อง')}</h4><p class="dim">อินเทอร์เน็ต ${net ? 'ใช้ได้' : 'ใช้ไม่ได้'} · เราเตอร์ ${rt ? 'ติดตั้งแล้ว' : 'ยังไม่มี'}${hid !== MAIN ? ' · ใช้เครือข่ายของบ้านหลัก' : ''}</p></div></div>
      <div class="card"><div class="ci">🎛️</div><div class="cb"><h4>ระดับระบบ ${t ? 'ระดับ ' + t : 'ยังไม่ติดตั้ง'}</h4><p class="dim">${t ? `${TIERS[t - 1].nm} · อุปกรณ์ ${cnt(hid)}/${SLOTS[t]}` : 'ติดตั้ง Smart Hub ที่แท็บ "พัฒนาบ้าน" เพื่อเริ่มใช้งาน'}${h.up ? ` · กำลังอัปเกรด (ช่างมา${RD(h.up.day)})` : ''}</p></div></div>
    </div>`;
  };
  const ctrlRow = () => {
    const m = H(MAIN), t = effTier(m); if (t < 1) return '';
    const b = (a, label, k) => `<button class="btn ghost" data-a="v25" data-v="${a}">${label}</button>`;
    return `<h5>ควบคุมบ้านหลัก</h5><div class="row topics">${b('lights', m.lights ? '💡 ปิดไฟ' : '💡 เปิดไฟ')}${b('ac', S.ac ? '❄️ ปิดแอร์' : '❄️ เปิดแอร์')}${b('lock', S.locked ? '🔓 ปลดล็อก' : '🔒 ล็อกประตู')}${on(MAIN, 'irrig') || S.furn.smartgarden ? b('water', '💧 รดน้ำตอนนี้') : ''}</div>
      <h5>ฉาก</h5><div class="row topics">${Object.keys(SCENES).map(k => `<button class="btn ${m.scene === k ? '' : 'ghost'}" data-a="v25" data-v="scene" data-k="${k}" title="${esc(SCENES[k].d)}">${SCENES[k].i} ${SCENES[k].n}</button>`).join('')}</div>`;
  };
  const overview = () => {
    const hid = sel(), s = S5();
    const logs = s.log.slice(0, 8).map(l => `<li>วัน ${l.d} ${String(l.h).padStart(2, '0')}:00 — ${esc(l.t)}</li>`).join('');
    return `${selector()}${envCards(hid)}${hid === MAIN ? ctrlRow() : '<p class="lead">บ้านหลังนี้ควบคุมได้จากแผงผนังหรือแอปนี้ ผลประหยัดไฟคิดที่มิเตอร์ฟาร์มหลักเท่านั้น (บ้านหลังนี้ไม่มีมิเตอร์แยก)</p>'}
      <h5>เหตุการณ์ล่าสุด</h5>${logs ? `<ul class="lead">${logs}</ul>` : '<p class="dim">ยังไม่มีเหตุการณ์</p>'}`;
  };
  const statusOf = (hid, k) => { const w = why(hid, k); if (w === '') return badge(1, 'ออนไลน์'); if (w.indexOf('ไม่มีอินเทอร์เน็ต') === 0) return badge(0, 'ออฟไลน์ (ใช้ในบ้านได้)'); return `<b class="bad">${esc(w)}</b>`; };
  const devicesTab = () => {
    const hid = sel(), h = H(hid), t = effTier(h);
    let out = selector();
    if (!t && !(h.up)) out += '<p class="lead">⚠️ ต้องติดตั้ง Smart Hub (ระดับ 1) ก่อน จึงจะสั่งซื้ออุปกรณ์ได้ ไปที่แท็บ "พัฒนาบ้าน"</p>';
    for (const g of Object.keys(GROUPS)) {
      out += `<h5>${GROUPS[g]}</h5><div class="grid">` + DV.filter(d => d.g === g).map(d => {
        const o = h.own[d.k], need = (d.need && d.need()) || (t < d.t ? `ต้องมีระบบระดับ ${d.t} ขึ้นไป` : '') || (cnt(hid) >= SLOTS[t] ? `ช่องอุปกรณ์เต็ม (${SLOTS[t]}) อัปเกรดระบบ` : '');
        let btn;
        if (o) btn = (h.brk[d.k] && !h.brk[d.k].fix) ? `<button class="btn" data-a="v25" data-v="fix" data-k="${d.k}" ${S.money < Math.max(600, Math.round(d.p * 0.25)) ? 'disabled' : ''}>เรียกช่างซ่อม ${baht(Math.max(600, Math.round(d.p * 0.25)))}</button>` : '';
        else btn = `<button class="btn" data-a="v25" data-v="buy" data-k="${d.k}" ${need || S.money < d.p ? 'disabled' : ''}>${baht(d.p)} · ช่าง ${d.d} วัน</button>`;
        return `<div class="card"><div class="ci">${d.i}</div><div class="cb"><h4>${esc(d.n)}</h4><p class="dim">${esc(d.desc)}${d.wifi ? ' · ต้อง Wi-Fi' : ''}${d.cloud ? ' · ฟีเจอร์คลาวด์' : ''}</p>${o ? `<p class="lead">${statusOf(hid, d.k)}</p>` : need ? `<p class="dim"><b class="bad">${esc(need)}</b></p>` : ''}${btn}</div></div>`;
      }).join('') + '</div>';
    }
    const old = Object.keys(SMART).filter(k => S.furn[k]);
    if (hid === MAIN && old.length) out += `<h5>อุปกรณ์ที่มีอยู่ในบ้าน</h5><p class="lead">${old.map(k => SMART[k].i + ' ' + esc(SMART[k].n)).join(' · ')}</p>`;
    return out;
  };
  const rulesTab = () => {
    const s = S5(), m = H(MAIN), t = effTier(m);
    let out = `<h5>ฉาก</h5><div class="grid">${Object.keys(SCENES).map(k => `<div class="card"><div class="ci">${SCENES[k].i}</div><div class="cb"><h4>${SCENES[k].n}</h4><p class="dim">${esc(SCENES[k].d)}</p><button class="btn" data-a="v25" data-v="scene" data-k="${k}" ${t < 1 ? 'disabled' : ''}>เปิดฉาก</button></div></div>`).join('')}</div>`;
    if (t < 3) return out + '<p class="lead">🔒 กฎอัตโนมัติเริ่มที่ระบบระดับ 3 (ระบบอัตโนมัติ) ไปที่แท็บ "พัฒนาบ้าน"</p>';
    out += `<h5>กฎอัตโนมัติ (${s.rules.length}/8)</h5>`;
    out += s.rules.length ? `<ul class="lead">${s.rules.map((r, i) => `<li>${r.on ? '🟢' : '⚪'} ${TRIG[r.trig].i} ${TRIG[r.trig].n}${r.trig === 'time' ? ' ' + String(r.h).padStart(2, '0') + ':00' : ''} → ${ACT[r.act].i} ${ACT[r.act].n} <button class="btn ghost" data-a="v25" data-v="rtog" data-i="${i}">${r.on ? 'ปิด' : 'เปิด'}</button> <button class="btn ghost" data-a="v25" data-v="rdel" data-i="${i}">ลบ</button></li>`).join('')}</ul>` : '<p class="dim">ยังไม่มีกฎ สร้างกฎใหม่ด้านล่าง</p>';
    const b = hub.rule = hub.rule || { trig: 'time', h: 22, act: 'light_off' };
    out += `<h5>สร้างกฎใหม่</h5><p class="lead">เมื่อ:</p><div class="row topics">${Object.keys(TRIG).map(k => `<button class="btn ${b.trig === k ? '' : 'ghost'}" data-a="v25" data-v="rt" data-k="${k}">${TRIG[k].i} ${TRIG[k].n}</button>`).join('')}</div>`;
    if (b.trig === 'time') out += `<div class="row"><button class="btn ghost" data-a="v25" data-v="rh" data-k="-1">‹</button><b>${String(b.h).padStart(2, '0')}:00</b><button class="btn ghost" data-a="v25" data-v="rh" data-k="1">›</button></div>`;
    out += `<p class="lead">ให้ทำ:</p><div class="row topics">${Object.keys(ACT).map(k => `<button class="btn ${b.act === k ? '' : 'ghost'}" data-a="v25" data-v="ra" data-k="${k}">${ACT[k].i} ${ACT[k].n}</button>`).join('')}</div>
      <div class="row"><button class="btn" data-a="v25" data-v="radd" ${s.rules.length >= 8 ? 'disabled' : ''}>➕ เพิ่มกฎ</button></div>
      <h5>การทำงานอัตโนมัติของอุปกรณ์</h5><div class="row topics">${[['ac', 'เทอร์โมสตัท'], ['lock', 'ล็อกประตู 22:00'], ['ev', 'ชาร์จ EV'], ['irr', 'รดน้ำ'], ['geo', 'ฉากตามตำแหน่ง']].map(([k, n]) => `<button class="btn ${m.auto[k] ? '' : 'ghost'}" data-a="v25" data-v="auto" data-k="${k}">${m.auto[k] ? '🟢' : '⚪'} ${n}</button>`).join('')}</div>`;
    return out;
  };
  const energyTab = () => {
    const st = Power.status(), s = Power.st(), h = Math.floor(S.time / 60), now = redu(h);
    let avg = 0; for (let i = 0; i < 24; i++) avg += redu(i); avg /= 24;
    const weekKwh = avg * 24 * 7, loads = (typeof LOADS !== 'undefined' ? LOADS : []).map(L => [typeof L[1] === 'string' ? L[1] : L[0], (L[2](h) || 0)]).filter(x => x[1] > 0.005).sort((a, b) => b[1] - a[1]).slice(0, 8);
    return `<div class="grid">
      <div class="card"><div class="ci">🏠</div><div class="cb"><h4>ใช้ไฟ ${st.use.toFixed(2)} kW</h4><p class="dim">มิเตอร์รับได้ ${s.amp} kW · วันนี้ใช้ ${s.today.use.toFixed(1)} kWh · ซื้อ ${s.today.imp.toFixed(1)} kWh</p></div></div>
      <div class="card"><div class="ci">☀️</div><div class="cb"><h4>โซลาร์ผลิต ${st.prod.toFixed(2)} kW</h4><p class="dim">${solarOK() ? `แผง ${s.panels + s.farm} แผง · วันนี้ผลิต ${s.today.prod.toFixed(1)} kWh` : 'ยังไม่มีแผงโซลาร์'}</p></div></div>
      <div class="card"><div class="ci">💰</div><div class="cb"><h4>ประหยัดจากอุปกรณ์อัจฉริยะ ${now.toFixed(2)} kW</h4><p class="dim">เฉลี่ยราว ${weekKwh.toFixed(1)} kWh ต่อสัปดาห์ ≈ ${baht(Math.round(weekKwh * 4.4))} (อัตรา 4.4 ฿/หน่วย) · ค่านี้ลดโหลดในระบบไฟฟ้าจริง</p></div></div></div>
      <h5>โหลดแต่ละรายการตอนนี้</h5>${loads.length ? `<ul class="lead">${loads.map(l => `<li>${esc(String(l[0]))}: ${l[1].toFixed(2)} kW</li>`).join('')}</ul>` : '<p class="dim">ไม่มีข้อมูลโหลดย่อย</p>'}
      <p class="dim">${on(MAIN, 'emon') ? '📈 มิเตอร์วัดพลังงานทำงาน: จะตัดแอร์ก่อนเบรกเกอร์ตัด' : 'ติดตั้งมิเตอร์วัดพลังงานเพื่อให้ระบบตัดแอร์ก่อนเบรกเกอร์ตัด'}</p>`;
  };
  const secTab = () => {
    const s = S5(), m = H(MAIN), lag = latestFw() - m.fw, ss = (() => { try { return Sec.status('home'); } catch (e) { return { cams: 0, rec: 0 }; } })();
    const pm = s.perms;
    const perm = (k, n, d) => `<div class="card"><div class="ci">${pm[k] ? '✅' : '⛔'}</div><div class="cb"><h4>${n}</h4><p class="dim">${d}</p><button class="btn ghost" data-a="v25" data-v="perm" data-k="${k}">${pm[k] ? 'ปิดสิทธิ์' : 'อนุญาต'}</button></div></div>`;
    return `${s.hacked ? `<p class="lead"><b class="bad">⚠️ ตรวจพบการเจาะกล้องเมื่อวัน ${s.hacked}</b> เปลี่ยนรหัสผ่านและอัปเดตเฟิร์มแวร์เพื่อตัดการเข้าถึง</p>` : ''}
    <div class="grid"><div class="card"><div class="ci">🧩</div><div class="cb"><h4>เฟิร์มแวร์ รุ่น ${m.fw} / ล่าสุด ${latestFw()}</h4><p class="dim">${lag <= 0 ? 'อัปเดตแล้ว' : lag >= 2 ? '<b class="bad">ล้าหลังหลายรุ่น เสี่ยงขัดข้องและถูกเจาะ</b>' : 'มีรุ่นใหม่'} · ต้องมีไฟและอินเทอร์เน็ต ใช้เวลา 1 ชั่วโมง</p><button class="btn" data-a="v25" data-v="fw" ${lag <= 0 || effTier(m) < 1 ? 'disabled' : ''}>อัปเดตเฟิร์มแวร์</button></div></div>
      <div class="card"><div class="ci">🔑</div><div class="cb"><h4>รหัสผ่านอุปกรณ์ ${s.pwd ? badge(1, 'เข้มแข็ง') : badge(0, 'ค่าเริ่มต้น')}</h4><p class="dim">เปลี่ยนรหัสผ่านและเปิดยืนยันสองชั้น กันการเจาะกล้อง</p><button class="btn" data-a="v25" data-v="pwd" ${s.pwd && !s.hacked ? 'disabled' : ''}>${s.hacked ? 'เปลี่ยนรหัสและตัดผู้บุกรุก' : 'เปลี่ยนรหัสผ่าน'}</button></div></div>
      <div class="card"><div class="ci">📹</div><div class="cb"><h4>กล้องวงจรปิดของบ้าน</h4><p class="dim">กล้อง ${ss.cams || 0} ตัว · บันทึกอยู่ ${ss.rec || 0} ช่อง · กล้องในบ้านอัจฉริยะ ${on(MAIN, 'scam') ? 'ใช้งานได้' : 'ยังไม่มี'}</p><button class="btn ghost" data-a="v25" data-v="sec">เปิดผังเครือข่ายกล้อง</button></div></div></div>
      <h5>สิทธิ์ของแอป</h5><div class="grid">${perm('loc', 'ตำแหน่ง', 'สลับฉากออกจากบ้าน/กลับบ้านอัตโนมัติ')}${perm('mic', 'ไมโครโฟน', 'ผู้ช่วยเสียง "น้องสุขใจ" สั่งฉากและอุปกรณ์')}${perm('notif', 'การแจ้งเตือน', 'ส่งข่าวจากเซนเซอร์เข้ามือถือ (ต้องมีอินเทอร์เน็ต)')}${perm('cloud', 'บันทึกกล้องบนคลาวด์', 'เสริมกันขโมย ค่าบริการ 99 ฿/สัปดาห์')}</div>`;
  };
  const devTab = () => {
    const hid = sel(), h = H(hid), t = effTier(h);
    return selector() + `<p class="lead">ระดับของบ้านนี้: ${t || 'ยังไม่ติดตั้ง'} · อุปกรณ์ ${cnt(hid)}/${SLOTS[t] || 0}</p><div class="grid">${TIERS.map(T => {
      const done = t >= T.n, pend = h.up && h.up.n === T.n, rq = done || pend ? '' : (T.n !== t + 1 ? (T.n > t + 1 ? `ต้องอัปเกรดระดับ ${T.n - 1} ก่อน` : '') : (T.req() || (hasPower(hid) ? '' : 'ต้องมีไฟฟ้า')));
      return `<div class="card"><div class="ci">${T.i}</div><div class="cb"><h4>ระดับ ${T.n}: ${esc(T.nm)}</h4><p class="dim">${esc(T.desc)} · ช่างติดตั้ง ${T.d} วัน</p>${done ? '<p class="lead">✅ ติดตั้งแล้ว</p>' : pend ? `<p class="lead">🛠️ ช่างมา${RD(h.up.day)}</p>` : `${rq ? `<p class="dim"><b class="bad">${esc(rq)}</b></p>` : ''}<button class="btn" data-a="v25" data-v="tier" data-n="${T.n}" ${rq || h.up || S.money < T.p ? 'disabled' : ''}>${baht(T.p)}</button>`}</div></div>`;
    }).join('')}</div>`;
  };
  const html = t => [overview, devicesTab, rulesTab, energyTab, secTab, devTab][t]();
  const open = () => { UI.open('🏠 ศูนย์บ้านอัจฉริยะ', ['ภาพรวม', 'อุปกรณ์', 'ฉาก & กฎ', 'พลังงาน', 'ความปลอดภัย', 'พัฒนาบ้าน'], t => { hub.tab = t; return html(t); }, { wide: true, tab: hub.tab }); };

  const charge = (p, label) => { S.money -= p; try { Bank2.log(label, -p); } catch (e) { } };
  UI.H.v25 = d => {
    const hid = sel(), h = H(hid), m = H(MAIN);
    switch (d.v) {
      case 'home': S5().sel = d.h; break;
      case 'buy': { const D = DVK[d.k]; if (!D || h.own[d.k] || S.money < D.p) break; const t = effTier(h); if ((D.need && D.need()) || t < D.t || cnt(hid) >= SLOTS[t]) break; charge(D.p, D.n); h.own[d.k] = { day: S.day + D.d }; UI.toast(`สั่งติดตั้ง ${D.n} ช่างมา${RD(S.day + D.d)}`, D.i); Phone.msg('ช่างติดตั้ง', `รับงาน "${D.n}" ${hid === MAIN ? '' : '(' + homeName(hid) + ') '}ช่างจะติดตั้งเสร็จ${RD(S.day + D.d)}`); break; }
      case 'fix': { const D = DVK[d.k], c = Math.max(600, Math.round(D.p * 0.25)); if (!D || !h.brk[d.k] || S.money < c) break; charge(c, 'ค่าช่างซ่อมอุปกรณ์บ้านอัจฉริยะ'); h.brk[d.k].fix = S.day + 1; UI.toast('นัดช่างซ่อมแล้ว มาพรุ่งนี้', '🛠️'); break; }
      case 'tier': { const T = TIERS[+d.n - 1], t = effTier(h); if (!T || T.n !== t + 1 || h.up || S.money < T.p || T.req() || !hasPower(hid)) break; charge(T.p, T.nm); h.up = { n: T.n, day: S.day + T.d }; UI.toast(`สั่งติดตั้ง ${T.nm} ช่างมา${RD(S.day + T.d)}`, T.i); Phone.msg('ช่างติดตั้ง', `รับงาน "${T.nm}" ช่างจะติดตั้งเสร็จ${RD(S.day + T.d)}`); break; }
      case 'scene': if (effTier(m) < 1) { UI.toast('ต้องติดตั้ง Smart Hub ก่อน', '🎛️'); break; } runScene(d.k, false); break;
      case 'lights': if (!hasLights()) { UI.toast('ต้องมีหลอดไฟหรือสวิตช์อัจฉริยะ', '💡'); break; } m.lights = m.lights ? 0 : 1; UI.toast(m.lights ? 'เปิดไฟแล้ว' : 'ปิดไฟแล้ว', '💡'); break;
      case 'ac': if (!S.furn.aircon) { UI.toast('บ้านยังไม่มีแอร์', '❄️'); break; } if (S.powerOff || Power.st().trip) { UI.toast('ไฟดับหรือเบรกเกอร์ตัดอยู่', '🌑'); break; } if (!hasPower(MAIN)) break; S.ac = !S.ac; break;
      case 'lock': if (!on(MAIN, 'slock')) { UI.toast('ใช้ได้ถ้ามีกลอนประตูดิจิทัล หรือกดจากแอปบ้านอัจฉริยะเดิม', '🔐'); break; } S.locked = !S.locked; UI.toast(S.locked ? 'ล็อกประตูแล้ว' : 'ปลดล็อกแล้ว', '🔐'); break;
      case 'water': { if (!hasPower(MAIN)) break; const n = waterDry(false); UI.toast(n ? `รดน้ำ ${n} แปลง` : 'ไม่มีแปลงที่แห้ง', '💧'); break; }
      case 'rt': hub.rule.trig = d.k; break;
      case 'rh': hub.rule.h = (hub.rule.h + (+d.k) + 24) % 24; break;
      case 'ra': hub.rule.act = d.k; break;
      case 'radd': { const s = S5(); if (s.rules.length >= 8) break; s.rules.push({ trig: hub.rule.trig, h: hub.rule.h, act: hub.rule.act, on: 1 }); UI.toast('เพิ่มกฎแล้ว', '⚙️'); break; }
      case 'rtog': { const r = S5().rules[+d.i]; if (r) r.on = r.on ? 0 : 1; break; }
      case 'rdel': S5().rules.splice(+d.i, 1); break;
      case 'auto': m.auto[d.k] = m.auto[d.k] ? 0 : 1; break;
      case 'perm': { const p = S5().perms; p[d.k] = p[d.k] ? 0 : 1; if (d.k === 'cloud' && p.cloud) S5().cloudDay = S.day; break; }
      case 'fw': { if (latestFw() <= h.fw) break; if (!hasPower(hid) || !netUp()) { UI.toast('ต้องมีไฟฟ้าและอินเทอร์เน็ตเพื่ออัปเดต', '📶'); break; } UI.close(); fade(() => { tick(60); h.fw = latestFw(); h.fwWarn = 0; log('อัปเดตเฟิร์มแวร์เสร็จ', hid); UI.toast(`อัปเดตเฟิร์มแวร์เป็นรุ่น ${h.fw} แล้ว`, '🧩'); setTimeout(open, 100); }); break; }
      case 'pwd': { const s = S5(); s.pwd = 1; if (s.hacked) { s.hacked = 0; notify('เปลี่ยนรหัสผ่านและตัดอุปกรณ์แปลกปลอมแล้ว'); } else UI.toast('เปลี่ยนรหัสผ่านและเปิดยืนยันสองชั้นแล้ว', '🔑'); break; }
      case 'sec': UI.close(); setTimeout(() => Sec.ui('home'), 0); break;
    }
  };

  // phone app + link from the old smart-home app
  APPS.splice(Math.min(APPS.length, 4), 0, { id: 'shub', i: '🏠', n: 'ศูนย์บ้านอัจฉริยะ' });
  Phone.apps.shub = () => { setTimeout(() => { Phone.app = null; UI.close(); hub.tab = 0; open(); }, 0); return ''; };
  if (typeof APP_GROUPS !== 'undefined') try { APP_GROUPS[2][1].unshift('shub'); } catch (e) { }
  UI.H.v25open = () => { Phone.app = null; UI.close(); hub.tab = 0; setTimeout(open, 0); };
  { const _h = SmartApp.html.bind(SmartApp); SmartApp.html = function () { return `<div class="row"><button class="btn" data-a="v25open">🏠 เปิดศูนย์บ้านอัจฉริยะ (ติดตั้งอุปกรณ์ ฉาก กฎอัตโนมัติ อัปเกรดระบบ)</button></div>` + _h(); }; }

  // wall panel inside the main house (opens the hub); rebuilt when the first Hub is installed
  const panelOn = () => effTier(H(MAIN)) >= 1;
  { const _sp = Smart.place.bind(Smart);
    Smart.place = function (W, has, placeK, w, d) {
      _sp(W, has, placeK, w, d);
      if (!panelOn()) return;
      const g = new THREE.Group();
      U.mk(g, GEO.box, mc(0x263238, { roughness: 0.3 }), [0, 1.35, 0], [0.34, 0.5, 0.04]);
      U.mk(g, GEO.box, new THREE.MeshBasicMaterial({ color: 0x4dd0e1 }), [0, 1.38, 0.025], [0.28, 0.4, 0.01]);
      placeK('smarthub25', g, W.lay.hub[0], W.lay.hub[1], 0, 0.2, 0.2, { kind: 'act', icon: '🎛️', label: 'แผงควบคุมบ้านอัจฉริยะ', act: () => ({ icon: '🎛️', label: 'เปิดศูนย์บ้านอัจฉริยะ', fn: () => { hub.tab = 0; open(); } }) });
    }; }
  const rebuild = () => { try { if (World.interior) { World.buildInterior(S.up.house, S); World.interior.visible = G.inside; } } catch (e) { console.warn('home25 rebuild', e); } };
  { let was = panelOn();
    setInterval(() => { try { const n = panelOn(); if (n !== was && G.started) { was = n; rebuild(); } } catch (e) { } }, 3000); }
  if (panelOn()) rebuild();

  // new houses: a wall panel in the furniture catalog, and it opens the hub for that house
  if (typeof HF !== 'undefined') {
    HF.shpanel = { n: 'แผงควบคุมบ้านอัจฉริยะ (ติดผนัง)', i: '🎛️', price: 6500, w: 1, d: 1, use: 'smart', e: 1, mk() { const g = new THREE.Group(); U.mk(g, GEO.box, mc(0x263238, { roughness: 0.3 }), [0, 1.3, 0], [0.34, 0.5, 0.05]); U.mk(g, GEO.box, new THREE.MeshBasicMaterial({ color: 0x4dd0e1 }), [0, 1.33, 0.03], [0.28, 0.4, 0.01]); U.mk(g, GEO.box, mc(0x37474f), [0, 0.55, 0], [0.12, 1.1, 0.12]); return g; } };
    const _a = Prop23.actOf.bind(Prop23);
    Prop23.actOf = function (def, h, it, spec) {
      if (spec && spec.use === 'smart') {
        const bad = this.need(h, spec), id = Object.keys(this.V().homes).find(k => this.V().homes[k] === h);
        return { icon: '🎛️', label: 'เปิดศูนย์บ้านอัจฉริยะของบ้านหลังนี้', fn: () => { if (bad) { UI.toast(bad, '⚠️'); return; } if (id) S5().sel = id; hub.tab = 0; open(); } };
      }
      return _a(def, h, it, spec);
    };
  }
  V23.HOME = { open, H, runScene, redu, DV };
});
