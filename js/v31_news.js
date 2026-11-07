'use strict';
// ---------- v31_news: news & media. A daily feed (TV bulletins / online / newspaper) written from what really happens in the game — weather, PM2.5 and dengue
// alerts, festivals and holidays, fuel / electricity Ft / minimum wage / policy rate, the stock market (all 20 stocks, sectors, index) — and the economy
// headlines really move prices for a few days. Online newspaper + print subscriptions, rumours the player can verify (or share, and pay for it) and press / ads
// for the player's own companies. State: S.v31n.
//
// MARKET EFFECT (bounded, shown to the player in the paper's outlook): a headline adds a daily drift to the stocks of the sectors it names, only on trading days,
// at most 0.4% per headline per day, 0.6% for a rumour, never more than 1.2% per sector per day in total, for at most 7 days. ----------
V23.add('v31_news', () => {
  const M = window.Mkt24;
  const N = () => {
    const x = S.v31n = S.v31n || {};
    x.feed = x.feed || []; x.eff = x.eff || []; x.rum = x.rum || []; x.base = x.base || null; x.sub = x.sub || { paper: 0, web: 0, auto: 1 };
    x.rep = x.rep == null ? 50 : x.rep; x.ads = x.ads || {}; x.read = x.read || {}; x.n = x.n || 0; x.kd = x.kd || 0; x.keys = x.keys || {}; x.seenN = x.seenN || {};
    x.rid = x.rid || 0; x.lastRum = x.lastRum || 0; x.idx = x.idx || 0; x.coSeen = x.coSeen || {}; x.paid = x.paid || 0; x.hist = x.hist || [];
    return x;
  };
  const safe = (f, d) => { try { const v = f(); return v == null ? d : v; } catch (e) { return d; } };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const hrOf = () => S.time / 60;
  const fmt = n => { try { return U.fmt(Math.round(n)); } catch (e) { return String(Math.round(n)); } };
  const pct = v => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}%`;
  const msg = (from, t, q) => { try { Phone.msg(from, t, q); } catch (e) { } };
  const holiday = d => !!(window.Cal24 && Cal24.isHoliday && Cal24.isHoliday(d));
  const dateTxt = d => safe(() => Cal24.dateText(d), `${RD(d)}`);
  const netOK = () => safe(() => ISP.speed() > 0, false) || safe(() => (S.isp && S.isp.sims && S.isp.sims.length > 0), false);
  const stocks = () => safe(() => Stock.st(), { px: {}, hist: {} });
  const secOf = k => safe(() => STOCKS[k].sec, '');
  const tick05 = p => { const t = p < 2 ? 0.01 : p < 5 ? 0.02 : p < 10 ? 0.05 : p < 25 ? 0.1 : p < 50 ? 0.25 : p < 100 ? 0.5 : p < 200 ? 1 : 2; return Math.max(0.01, +(Math.round(p / t) * t).toFixed(2)); };
  const tradingDay = () => safe(() => M.tradingDay(), false);
  const sectors = () => { const s = new Set(); safe(() => { for (const k in STOCKS) s.add(STOCKS[k].sec); }, 0); return s; };
  const CAT = { weather: ['🌦️', 'อากาศ'], econ: ['📊', 'เศรษฐกิจ'], market: ['📈', 'ตลาดหุ้น'], local: ['🏘️', 'ข่าวชุมชน'], fest: ['🎉', 'เทศกาล'], biz: ['🏢', 'ธุรกิจ'], warn: ['⚠️', 'เตือนภัย'], rumour: ['🗣️', 'ข่าวลือ'], job: ['📋', 'ตลาดแรงงาน'] };

  // ================= the feed =================
  // post({ c: category, h: headline, x: body, imp: 1-3, brk: breaking, k: key (once per day) })
  const post = o => {
    const x = N();
    if (x.kd !== S.day) { x.kd = S.day; x.keys = {}; }
    if (o.k) { if (x.keys[o.k]) return null; x.keys[o.k] = 1; }
    const c = CAT[o.c] ? o.c : 'local';
    const e = { n: ++x.n, d: S.day, t: Math.floor(S.time || 0), c, h: String(o.h).slice(0, 110), x: String(o.x || '').slice(0, 320), imp: o.imp || 1, brk: o.brk ? 1 : 0 };
    x.feed.unshift(e); if (x.feed.length > 220) x.feed.length = 220;
    if (e.brk) msg('ข่าวด่วน', e.h, true);
    return e;
  };

  // ================= market effects =================
  const effects = () => { const x = N(); x.eff = x.eff.filter(e => e.until >= S.day); return x.eff; };
  const addEff = (k, label, sec, days, rumour) => {
    const x = N(), cap = rumour ? 0.006 : 0.004, ok = sectors(), s = {};
    for (const q in sec) if (ok.has(q)) s[q] = clamp(sec[q], -cap, cap);
    if (!Object.keys(s).length) return;
    x.eff = x.eff.filter(e => e.k !== k);
    x.eff.push({ k, label, sec: s, d0: S.day, until: S.day + clamp(days, 1, 7) - 1 });
    if (x.eff.length > 16) x.eff.shift();
  };
  const applyEff = () => {
    if (!tradingDay()) return;
    const eff = effects(); if (!eff.length) return;
    const sum = {}; for (const e of eff) for (const q in e.sec) sum[q] = (sum[q] || 0) + e.sec[q];
    const s = stocks(), up = {};
    for (const q in sum) up[q] = clamp(sum[q], -0.012, 0.012);
    for (const k in s.px) {
      const d = up[secOf(k)]; if (!d) continue;
      const p = tick05(Math.max(0.5, s.px[k] * (1 + d)));
      s.px[k] = p; const h = s.hist[k]; if (h && h.length) h[h.length - 1] = p;
    }
  };
  if (typeof Stock !== 'undefined' && typeof Stock.day === 'function') {
    const _sd = Stock.day.bind(Stock);
    Stock.day = function () { const r = _sd.apply(this, arguments); try { applyEff(); } catch (e) { console.warn('v31 news eff', e); } return r; };
  }

  // ================= daily writer =================
  const WX = { sunny: 'แดดจ้า ท้องฟ้าโปร่ง', partly: 'มีเมฆบางส่วน', cloudy: 'เมฆครึ้ม', rain: 'ฝนตก', storm: 'พายุฝนฟ้าคะนอง', fog: 'หมอกหนา ทัศนวิสัยต่ำ' };
  const baseline = () => ({ fuel: safe(() => RL.st().fuel, 1), ft: safe(() => TARIFF.ft, 0.4), wage: safe(() => RL.st().wage, 1), rate: safe(() => M.st().rate, 2), cpi: safe(() => RL.st().cpi, 1) });
  const gen = () => {
    const x = N(), s = stocks(), first = !x.base, B = x.base || baseline(), now = baseline();
    // ----- weather & alerts
    const wt = safe(() => S.weather.type, 'sunny'), wn = safe(() => S.weather.next, '');
    post({ c: 'weather', h: `สภาพอากาศวันนี้: ${WX[wt] || wt}`, x: wn && WX[wn] ? `กรมอุตุฯ คาดว่าช่วงถัดไปอากาศจะเปลี่ยนเป็น ${WX[wn]}` : '', imp: wt === 'storm' ? 3 : 1, brk: wt === 'storm', k: 'wx' });
    if (wt === 'storm') post({ c: 'warn', h: 'เตือนพายุฝนฟ้าคะนอง ระวังฟ้าผ่าและลมกระโชกแรง', x: 'ปภ. แนะนำให้งดทำงานกลางแจ้ง เก็บของให้มั่นคง และเตรียมไฟสำรอง', imp: 3, brk: 1, k: 'storm' });
    safe(() => {
      const on = k => RL.on(k);
      if (on('pm25')) { const a = on('pm25'); post({ c: 'warn', h: 'ค่าฝุ่น PM2.5 เกินมาตรฐาน กรมควบคุมมลพิษแนะสวมหน้ากาก N95', x: `คาดว่าสถานการณ์ต่อเนื่องถึง${RD(a.until)}`, imp: 2, k: 'pm25' }); if (!x.keys.pm25eff) { x.keys.pm25eff = 1; addEff('pm25', 'ฝุ่น PM2.5', { 'ท่องเที่ยว': -0.003, 'สุขภาพ': 0.002 }, a.until - S.day + 1); } }
      if (on('dengue')) { post({ c: 'warn', h: 'สาธารณสุขเตือนไข้เลือดออกระบาดช่วงฝน ให้คว่ำภาชนะและเทน้ำขัง', imp: 2, k: 'dengue' }); addEff('dengue', 'ไข้เลือดออกระบาด', { 'สุขภาพ': 0.002 }, 4); }
      if (on('flood')) { post({ c: 'warn', h: 'ฝนตกหนัก น้ำรอระบายบนถนนหมู่บ้าน การจราจรติดขัด', imp: 2, k: 'flood' }); addEff('flood', 'น้ำท่วมขังถนน', { 'ขนส่ง': -0.002, 'ก่อสร้าง': 0.001 }, 2); }
      if (on('sale')) { post({ c: 'econ', h: 'วันนี้มหกรรมลดราคาออนไลน์ ลดสูงสุด 30% ทั้งวัน', imp: 2, k: 'sale' }); addEff('sale', 'มหกรรมลดราคา', { 'ค้าปลีก': 0.004 }, 1); }
      if (on('tour')) post({ c: 'local', h: 'รถทัวร์นักท่องเที่ยวแวะชมฟาร์มสุดสัปดาห์นี้', imp: 1, k: 'tour' });
      if (on('viral')) post({ c: 'local', h: 'ไร่ในหมู่บ้านเป็นกระแสในโซเชียลหลังอินฟลูเอนเซอร์รีวิว', imp: 2, k: 'viral' });
      const sc = RL.st().scam; if (sc && sc.day === S.day) post({ c: 'warn', h: 'ตำรวจเตือน แก๊งคอลเซ็นเตอร์ปลอมเป็นเจ้าหน้าที่ แจ้งหนี้ ห้ามโอนเงินให้คนแปลกหน้า โทร 1441', imp: 2, k: 'scam' });
    });
    // ----- festival & holidays
    safe(() => {
      const t = Fest24.today(S.day), tm = Fest24.today(S.day + 1);
      if (t) post({ c: 'fest', h: `วันนี้ ${t.i || ''} ${t.n}`.trim(), x: t.desc || '', imp: 2, k: 'fest' });
      if (tm) post({ c: 'fest', h: `พรุ่งนี้ ${tm.i || ''} ${tm.n}`.trim(), x: (tm.hol ? 'วันหยุดราชการ ธนาคาร ที่ว่าการอำเภอ และตลาดหลักทรัพย์ปิดทำการ · ' : '') + (tm.desc || ''), imp: tm.hol ? 3 : 1, k: 'festtm' });
      if (holiday(S.day)) post({ c: 'econ', h: 'วันนี้วันหยุดราชการ ธนาคารและตลาดหลักทรัพย์ปิดทำการ', imp: 2, k: 'hol' });
    });
    // ----- economy: only after the first run (which just records the baseline)
    if (!first) {
      const df = now.fuel - B.fuel;
      if (Math.abs(df) >= 0.01) {
        const price = 32 * now.fuel, ch = 32 * df;
        post({ c: 'econ', h: `ราคาน้ำมันดีเซลปรับ${ch > 0 ? 'ขึ้น' : 'ลง'} ${Math.abs(ch).toFixed(2)} บาท/ลิตร เป็น ${price.toFixed(2)} บาท`, x: ch > 0 ? 'ต้นทุนขนส่งและค่าเติมน้ำมันรถของคุณสูงขึ้นตามราคา' : 'ค่าเติมน้ำมันรถของคุณถูกลงตามราคา', imp: 2, k: 'fuel' });
        const f = clamp(Math.abs(df) / 0.04, 0.5, 1) * Math.sign(df);
        addEff('fuel', `ราคาน้ำมัน${ch > 0 ? 'ขึ้น' : 'ลง'}`, { 'พลังงาน': 0.004 * f, 'ขนส่ง': -0.003 * f, 'ยานยนต์': -0.002 * f, 'อาหาร': -0.001 * f }, 5);
      }
      if (Math.abs(now.ft - B.ft) >= 0.02) { const up = now.ft > B.ft; post({ c: 'econ', h: `กกพ. ${up ? 'ปรับขึ้น' : 'ปรับลด'}ค่า Ft เป็น ${now.ft.toFixed(4)} บาท/หน่วย`, x: `ค่าไฟของบ้านและบริษัทคุณจะ${up ? 'เพิ่ม' : 'ลด'}ลงตามอัตราใหม่`, imp: 2, k: 'ft' }); addEff('ft', 'ค่า Ft ปรับ', { 'พลังงาน': up ? 0.002 : -0.002 }, 4); }
      if (now.wage > B.wage + 0.001) { const w = Math.round(350 * now.wage); post({ c: 'econ', h: `คณะกรรมการค่าจ้างปรับค่าแรงขั้นต่ำเป็นวันละ ${w} บาท`, x: 'นายจ้างต้องปรับเงินเดือนพนักงานให้ไม่ต่ำกว่าอัตราใหม่ ต้นทุนบริษัทสูงขึ้นเล็กน้อย', imp: 3, brk: 1, k: 'wage' }); addEff('wage', 'ปรับค่าแรงขั้นต่ำ', { 'ค้าปลีก': 0.002, 'อาหาร': 0.001, 'ธนาคาร': -0.001 }, 5); }
      if (Math.abs(now.rate - B.rate) >= 0.01) post({ c: 'econ', h: `ธนาคารแห่งประเทศไทย${now.rate > B.rate ? 'ขึ้น' : 'ลด'}ดอกเบี้ยนโยบายเป็น ${now.rate.toFixed(2)}%`, x: 'ดอกเบี้ยเงินฝากและสินเชื่อจะทยอยปรับตาม · ตลาดหุ้นตอบรับตามกลไกของตลาดอยู่แล้ว', imp: 3, k: 'rate' });
      const dc = now.cpi / B.cpi - 1; if (dc >= 0.003) post({ c: 'econ', h: `เงินเฟ้อสะสมเพิ่ม ${(dc * 100).toFixed(1)}% ราคาสินค้าและบริการสูงขึ้น`, imp: 1, k: 'cpi' });
    }
    x.base = now;
    // ----- the market (trading days) + the exchange's own bulletins
    safe(() => {
      const mn = M.st().news.filter(n => n.d === S.day);
      for (const n of mn) post({ c: 'market', h: n.t, x: n.eff || '', imp: 2, k: 'mn:' + n.t.slice(0, 20) });
    });
    if (tradingDay()) safe(() => {
      const idx = M.indexNow(), last = x.idx || idx; x.idx = idx;
      const ch = last ? idx / last - 1 : 0;
      post({ c: 'market', h: `ดัชนีหุ้นสุขใจปิด ${idx.toFixed(2)} จุด ${ch >= 0 ? 'เพิ่มขึ้น' : 'ลดลง'} ${Math.abs(ch * 100).toFixed(2)}%`, x: `${ch > 0.01 ? 'บรรยากาศการลงทุนดี' : ch < -0.01 ? 'นักลงทุนระมัดระวัง' : 'ตลาดแกว่งตัวในกรอบแคบ'}`, imp: Math.abs(ch) > 0.015 ? 3 : 1, k: 'idx' });
      const mv = [];
      for (const k in s.px) { const h = s.hist[k] || []; if (h.length > 1) mv.push([k, h[h.length - 1] / h[h.length - 2] - 1]); }
      mv.sort((a, b) => b[1] - a[1]);
      if (mv.length) {
        const [bk, bv] = mv[0], [wk, wv] = mv[mv.length - 1];
        if (bv >= 0.025) post({ c: 'market', h: `หุ้น ${safe(() => STOCKS[bk].n, bk)} พุ่ง ${pct(bv)} นำตลาด`, x: `กลุ่ม${secOf(bk)} · ราคาปิด ${s.px[bk]} บาท`, imp: 2, k: 'best' });
        if (wv <= -0.025) post({ c: 'market', h: `หุ้น ${safe(() => STOCKS[wk].n, wk)} ร่วง ${pct(wv)} กดดันตลาด`, x: `กลุ่ม${secOf(wk)} · ราคาปิด ${s.px[wk]} บาท`, imp: 2, k: 'worst' });
        const bySec = {}; for (const [k, v] of mv) { const q = secOf(k); (bySec[q] = bySec[q] || []).push(v); }
        const ss = Object.entries(bySec).map(([q, a]) => [q, a.reduce((t, v) => t + v, 0) / a.length]).sort((a, b) => b[1] - a[1]);
        if (ss.length > 2 && Math.abs(ss[0][1]) >= 0.01) post({ c: 'market', h: `กลุ่ม${ss[0][0]} เด่นสุด ${pct(ss[0][1])} ส่วนกลุ่ม${ss[ss.length - 1][0]} ${pct(ss[ss.length - 1][1])}`, imp: 1, k: 'secs' });
      }
      const mine = safe(() => Object.keys(STOCKS).filter(k => M.holdOf(k) > 0), []);
      for (const k of mine) { const h = s.hist[k] || []; if (h.length > 1) { const v = h[h.length - 1] / h[h.length - 2] - 1; if (Math.abs(v) >= 0.04) post({ c: 'market', h: `หุ้นในพอร์ตคุณ ${k} ${v > 0 ? 'ปรับขึ้น' : 'ปรับลง'} ${pct(v)} วันนี้`, imp: 2, k: 'hold:' + k }); } }
    });
    // ----- jobs & community notes (flavour that follows real game data)
    if (S.day % 3 === 0) safe(() => {
      const ks = Object.keys(JOBS2); const k = ks[(S.day * 7) % ks.length], J = JOBS2[k];
      post({ c: 'job', h: `ตลาดแรงงาน: เปิดรับสมัคร ${J.n} ${J.ranks ? `เงินเดือนเริ่มต้น ${fmt(J.ranks[0][1])} บาท` : ''}`, x: J.req || '', imp: 1, k: 'job' });
    });
    // ----- the player's own companies in the news
    safe(() => {
      for (const c of Company.list()) {
        const st = x.coSeen[c.id] = x.coSeen[c.id] || {};
        if (c.st === 'open' && !st.open) { st.open = 1; post({ c: 'biz', h: `${c.name} เปิดดำเนินการในหมู่บ้าน`, x: 'ผู้ประกอบการรุ่นใหม่เพิ่มการจ้างงานในท้องถิ่น', imp: 2, k: 'co:' + c.id }); x.rep = clamp(x.rep + 3, 0, 100); }
        if (c.listed && !st.ipo) { st.ipo = 1; post({ c: 'biz', h: `${c.name} เข้าจดทะเบียนในตลาดหลักทรัพย์`, imp: 3, brk: 1, k: 'ipo:' + c.id }); x.rep = clamp(x.rep + 5, 0, 100); }
      }
    });
  };

  // ================= rumours =================
  const RUM = [
    { w: 3, f: () => { const k = pick(Object.keys(STOCKS)); return { h: `ลือสนั่น ${STOCKS[k].n} กำลังจะถูกซื้อกิจการ`, x: 'ผู้ใช้โซเชียลแชร์ว่ามีนายทุนใหญ่เจรจาอยู่ ราคาหุ้นอาจพุ่ง', stock: k, sec: STOCKS[k].sec, dir: 1, truth: 0.4, real: 'ประกาศดีลซื้อกิจการ' }; } },
    { w: 3, f: () => { const k = pick(Object.keys(STOCKS)); return { h: `แชร์ว่า ${STOCKS[k].n} พบข้อผิดพลาดทางบัญชี`, x: 'ยังไม่มีการแถลงอย่างเป็นทางการ นักลงทุนบางส่วนเริ่มเทขาย', stock: k, sec: STOCKS[k].sec, dir: -1, truth: 0.35, real: 'บริษัทแจ้งปรับงบการเงินย้อนหลัง' }; } },
    { w: 2, f: () => ({ h: 'แชร์กันว่า ปั๊มน้ำมันจะขึ้นราคาพรุ่งนี้อีก 3 บาท ให้รีบเติม', x: 'ข้อความส่งต่อกันในไลน์กลุ่มโดยไม่ระบุแหล่งที่มา', fuel: 1, truth: 0.4, real: 'ราคาน้ำมันปรับขึ้นจริง' }) },
    { w: 2, f: () => ({ h: 'ลือข้าวสารจะขาดตลาด แห่ซื้อกักตุน', x: 'ร้านค้าบางแห่งเริ่มจำกัดจำนวนต่อคน', sec: 'อาหาร', dir: 1, truth: 0.3, real: 'พาณิชย์จังหวัดยืนยันผลผลิตลดลง' }) },
    { w: 1, f: () => ({ h: 'ข้อความลือ ธนาคารจะระงับบัญชีที่ไม่ได้ใช้งานภายใน 3 วัน', x: 'ให้กดลิงก์ยืนยันตัวตน (ลักษณะเดียวกับหน้าเว็บปลอม)', truth: 0.05, real: '' }) },
  ];
  const newRumour = () => {
    const x = N();
    let cand = RUM.slice();
    const mine = safe(() => Company.list().filter(c => c.st === 'open'), []);
    if (mine.length) cand.push({ w: 2, f: () => { const c = pick(mine); return { h: `ลือ ${c.name} ผิดนัดชำระหนี้ซัปพลายเออร์`, x: 'ข้อความนิรนามในกลุ่มธุรกิจท้องถิ่น ยังไม่มีหลักฐาน', co: c.id, truth: c.cash < 0 ? 1 : 0, real: 'ธนาคารแจ้งหนี้ค้างชำระ' }; } });
    const tot = cand.reduce((t, c) => t + c.w, 0); let r = rnd(0, tot), pickd = cand[0];
    for (const c of cand) { r -= c.w; if (r <= 0) { pickd = c; break; } }
    const o = pickd.f(), id = ++x.rid;
    const ru = Object.assign({ id, d: S.day, res: S.day + 2 + Math.floor(rnd(0, 3)), st: 'new', ver: null, shared: 0, truthB: Math.random() < o.truth }, o);
    x.rum.unshift(ru); if (x.rum.length > 20) x.rum.length = 20;
    post({ c: 'rumour', h: ru.h, x: ru.x + ' (ยังไม่ได้ตรวจสอบ)', imp: 1, k: 'rum:' + id });
    // traders react to a rumour for a day
    if (ru.sec && ru.dir) addEff('rum' + id, 'ข่าวลือ', { [ru.sec]: 0.006 * ru.dir }, 1, true);
  };
  const resolveRumours = () => {
    const x = N();
    for (const r of x.rum) {
      if (r.st === 'done' || S.day < r.res) continue;
      r.st = 'done';
      const truth = r.truthB;
      post({ c: 'rumour', h: truth ? `ยืนยันแล้ว: ${r.real || r.h}` : `ชี้แจง: ข่าวลือ "${r.h.replace(/^(ลือสนั่น|แชร์ว่า|ลือ|แชร์กันว่า|ข้อความลือ)\s*/, '').slice(0, 55)}" ไม่เป็นความจริง`, x: truth ? 'ข่าวที่เคยลือกันเป็นความจริง' : 'ผู้เกี่ยวข้องออกมาปฏิเสธอย่างเป็นทางการ', imp: 2, k: 'res:' + r.id });
      if (truth) {
        if (r.sec && r.dir) addEff('real' + r.id, r.real, { [r.sec]: 0.004 * r.dir }, 3);
        if (r.fuel) safe(() => { const s = RL.st(); s.fuel = clamp(+(s.fuel + 0.08).toFixed(3), 0.8, 1.4); RL.log('⛽ ราคาน้ำมันปรับขึ้นตามที่เป็นข่าว'); });
        if (r.co) safe(() => { const c = Company.get(r.co); if (c) c.rep = Math.max(0, c.rep - 6); });
      } else if (r.co && !r.handled) safe(() => { const c = Company.get(r.co); if (c) { c.rep = Math.max(0, c.rep - 3); msg('ข่าวธุรกิจ', `ข่าวลือเรื่อง ${c.name} กระทบความเชื่อมั่นเล็กน้อย (ชื่อเสียง -3)`, true); } });
      if (r.shared) {
        if (truth) { x.rep = clamp(x.rep + 4, 0, 100); msg('เพื่อน', 'ขอบใจที่บอกข่าวนี้ก่อนใคร ข่าวจริงด้วย!', true); safe(() => { S.mood = Math.min(100, (S.mood || 70) + 3); }); }
        else { const pen = r.ver === false ? 15 : 10; x.rep = clamp(x.rep - pen, 0, 100); safe(() => { S.mood = Math.max(0, (S.mood || 70) - 5); }); msg('เพื่อนบ้าน', r.ver === false ? 'แชร์ข่าวที่รู้ว่าเท็จได้ไง คนเขาเอาไปพูดต่อกันทั้งหมู่บ้านแล้ว' : 'ข่าวนั้นไม่จริงนะ ลบโพสต์ก่อนเถอะ คนเริ่มเข้าใจผิดแล้ว', false); }
      } else if (r.ver === false) { x.rep = clamp(x.rep + 2, 0, 100); }
      x.hist.unshift({ d: S.day, h: r.h, truth, shared: r.shared, ver: r.ver }); if (x.hist.length > 12) x.hist.length = 12;
    }
  };

  // ================= subscriptions =================
  const PLANS = { paper: { n: 'หนังสือพิมพ์ฉบับพิมพ์ ส่งถึงบ้านทุกเช้า', i: '📰', price: 180 }, web: { n: 'ออนไลน์พรีเมียม (ย้อนหลัง 30 วัน + บทวิเคราะห์)', i: '🌐', price: 99 } };
  const subOn = k => N().sub[k] >= S.day;
  const renewSubs = () => {
    const x = N();
    for (const k in PLANS) {
      if (x.sub[k] && x.sub[k] < S.day) {
        if (x.sub.auto && S.money >= PLANS[k].price) { S.money -= PLANS[k].price; safe(() => Bank2.log(`ต่อสมาชิก${PLANS[k].n.split(' ')[0]}`, -PLANS[k].price)); x.sub[k] = S.day + 27; x.paid += PLANS[k].price; msg('ฝ่ายสมาชิก', `ต่ออายุ ${PLANS[k].n.split(' (')[0]} อัตโนมัติ ${PLANS[k].price} ฿`, true); }
        else { x.sub[k] = 0; msg('ฝ่ายสมาชิก', `${PLANS[k].n.split(' (')[0]} หมดอายุ${x.sub.auto ? ' (เงินไม่พอตัดบัญชี)' : ''}`, false); }
      }
    }
  };

  // ================= ads for the player's companies =================
  const ADS = {
    poster: { n: 'ป้ายโฆษณาในหมู่บ้าน', i: '🪧', days: 14, boost: 0.08, roi: 1.4, min: 1500 },
    web: { n: 'โฆษณาออนไลน์', i: '📱', days: 14, boost: 0.12, roi: 1.5, min: 3000 },
    radio: { n: 'โฆษณาทีวี/วิทยุท้องถิ่น', i: '📻', days: 14, boost: 0.18, roi: 1.6, min: 6000 },
    pr: { n: 'ข่าวประชาสัมพันธ์ (Press release)', i: '🗞️', days: 7, boost: 0.06, roi: 2.0, min: 800, rep: 1 },
  };
  const dayRev = c => safe(() => CO_TYPES[c.type].rev(c), 0);
  // priced so that an average campaign returns about 1.4–2× its cost in extra profit (not extra revenue), whatever the company's margin
  const adCost = (c, a) => { const m = 1 - safe(() => CO_TYPES[c.type].cost, 0.5); return Math.max(a.min, Math.round(dayRev(c) * m * a.days * (a.rep ? 0.045 : a.boost) / a.roi / 100) * 100); };
  const runAds = () => {
    const x = N(), mult = 0.7 + x.rep / 100 * 0.6;
    for (const c of safe(() => Company.list(), [])) {
      const ads = x.ads[c.id]; if (!ads) continue;
      const T = safe(() => CO_TYPES[c.type], null); if (!T) continue;
      const earnedToday = c.hist && c.hist[0] && c.hist[0].startsWith(`${RD(S.day)}: รายรับ`);
      for (const k in ads) {
        const a = ADS[k]; if (!a) { delete ads[k]; continue; }
        if (ads[k] < S.day) { delete ads[k]; msg(c.name, `แคมเปญ${a.n}สิ้นสุดแล้ว`, true); continue; }
        if (!earnedToday || c.st !== 'open') continue;
        const b = a.rep ? 0.03 + a.boost * (x.rep / 50) : a.boost * mult;
        const extra = Math.round(dayRev(c) * b * rnd(0.8, 1.2)), cost = Math.round(extra * T.cost);
        if (extra > 0) { c.cash += extra - cost; Company.book(c, extra, cost); (x.adGain = x.adGain || {})[c.id] = (x.adGain[c.id] || 0) + extra - cost; }
      }
      if (!Object.keys(ads).length) delete x.ads[c.id];
    }
  };

  // ================= daily =================
  const daily = () => {
    gen();
    if (S.day - N().lastRum >= 3 && Math.random() < 0.55) { N().lastRum = S.day; newRumour(); }
    resolveRumours(); renewSubs(); runAds();
  };
  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { daily(); } catch (e) { console.warn('v31 news daily', e); } return r; }; }

  // ================= views =================
  const A = {};
  UI.H.v31n = d => { const [k, ...r] = String(d.v || '').split('|'); const f = A[k]; if (f) { try { f(...r); } catch (e) { if (e && e.spend173) throw e; console.warn('v31n', k, e); } } };
  const B = (act, label, o = {}) => `<button class="btn ${o.ghost ? 'ghost' : ''}" data-a="v31n" data-v="${esc(act)}"${o.dis ? ' disabled' : ''}>${label}</button>`;
  const hub = { tab: 0 };
  const row = (e, full = true) => `<div class="card"><div class="ci">${e.brk ? '🚨' : CAT[e.c][0]}</div><div class="cb"><h4>${esc(e.h)}</h4>${full && e.x ? `<p>${esc(e.x)}</p>` : ''}<p class="dim">${esc(dateTxt(e.d))} · ${String(Math.floor(e.t / 60)).padStart(2, '0')}:${String(e.t % 60).padStart(2, '0')} น. · ${CAT[e.c][1]}</p></div></div>`;
  const GR = a => a.length ? `<div class="grid">${a.join('')}</div>` : '<p class="empty">ยังไม่มีข่าว</p>';
  const topToday = (n) => N().feed.filter(e => e.d === S.day).sort((a, b) => (b.brk - a.brk) || (b.imp - a.imp) || (b.n - a.n)).slice(0, n);

  const tabTV = () => {
    const h = hrOf(), x = N(), win = (h >= 6 && h < 8.5) ? 'ข่าวเช้า' : (h >= 12 && h < 13) ? 'ข่าวเที่ยง' : (h >= 18.5 && h < 21) ? 'ข่าวค่ำ' : '';
    const brk = x.feed.filter(e => e.brk && e.d >= S.day - 1).slice(0, 3);
    const key = S.day + (win || ''), done = x.read[key];
    let out = `<p class="lead">📺 โทรทัศน์ · ข่าวเช้า 06:00–08:30 · ข่าวเที่ยง 12:00–13:00 · ข่าวค่ำ 18:30–21:00 · ข่าวด่วนออกอากาศได้ทุกเวลา</p>`;
    if (win) {
      out += `<h5>📡 กำลังออกอากาศ: ${win}</h5>${GR(topToday(5).map(e => row(e)))}`;
      out += `<div class="row">${B('watch', done ? '✅ ดูข่าวรอบนี้แล้ว' : '👀 นั่งดูข่าว (30 นาที)', { dis: done })}</div><p class="dim">ดูข่าวแล้วรู้เท่าทันสถานการณ์ แต่ข่าวร้ายก็ทำให้เครียดได้เล็กน้อย</p>`;
    } else out += `<p class="empty">ตอนนี้ไม่มีรายการข่าว (${String(Math.floor(h)).padStart(2, '0')}:${String(Math.floor((h % 1) * 60)).padStart(2, '0')} น.)</p>`;
    if (brk.length) out += `<h5>🚨 ข่าวด่วน</h5>${GR(brk.map(e => row(e)))}`;
    return out;
  };
  const tabWeb = () => {
    if (!netOK()) return '<p class="lead">🌐 ข่าวออนไลน์</p><p class="empty">ไม่มีสัญญาณอินเทอร์เน็ต · สมัครเน็ตบ้านหรือซิมที่ศูนย์ไอทีก่อน (ฟังข่าวจากทีวีหรืออ่านหนังสือพิมพ์แทนได้)</p>';
    const prem = subOn('web'), x = N(), lim = prem ? 30 : 2;
    const list = x.feed.filter(e => e.d > S.day - lim).sort((a, b) => (b.d - a.d) || (b.n - a.n));
    return `<p class="lead">🌐 ข่าวออนไลน์ · ${prem ? 'สมาชิกพรีเมียม: ย้อนหลัง 30 วัน พร้อมบทวิเคราะห์' : 'ฟรี: ข่าววันนี้และเมื่อวาน (ย้อนหลังและบทวิเคราะห์สำหรับสมาชิก)'}</p>${prem ? outlook() : ''}${GR(list.slice(0, 40).map(e => row(e)))}`;
  };
  const outlook = () => {
    const eff = effects();
    const wn = safe(() => WEATHER[S.weather.next].n, '');
    return `<h5>🔭 มุมมองตลาด & พยากรณ์</h5><div class="card"><div class="ci">🧭</div><div class="cb"><h4>ปัจจัยที่กำลังกระทบตลาดหุ้น</h4>${eff.length ? eff.map(e => `<p>• ${esc(e.label)} (ถึง${RD(e.until)}): ${Object.entries(e.sec).map(([q, v]) => `${esc(q)} ${v >= 0 ? '▲' : '▼'}`).join(' · ')}</p>`).join('') : '<p class="dim">ยังไม่มีปัจจัยพิเศษ ตลาดเคลื่อนไหวตามปกติ</p>'}<p class="dim">แต่ละปัจจัยขยับราคาไม่เกิน 0.4%/วัน (ข่าวลือ 0.6%) รวมไม่เกิน 1.2%/วันต่อกลุ่ม นาน ≤ 7 วัน${wn ? ` · อากาศถัดไปคาดว่า${wn}` : ''}</p></div></div>`;
  };
  const tabPaper = () => {
    const has = subOn('paper'), x = N(), deliv = hrOf() >= 6;
    if (!has) return `<p class="lead">📰 หนังสือพิมพ์</p><p class="dim">พาดหัววันนี้ (อ่านเนื้อข่าวฉบับเต็มและบทวิเคราะห์ได้เมื่อสมัครสมาชิกฉบับพิมพ์)</p>${GR(topToday(4).map(e => row(e, false)))}<div class="row">${B('goSub', '⚙️ ไปหน้าสมาชิก')}</div>`;
    const day = deliv ? S.day : S.day - 1, list = x.feed.filter(e => e.d <= day && e.d > day - 3).sort((a, b) => (b.d - a.d) || (b.imp - a.imp) || (b.n - a.n));
    return `<p class="lead">📰 หนังสือพิมพ์ฉบับพิมพ์ · ส่งถึงบ้านทุกเช้า 06:00 · สมาชิกถึง${RD(x.sub.paper)}${deliv ? '' : ' · (ฉบับวันนี้ยังไม่มาส่ง กำลังอ่านฉบับเมื่อวาน)'}</p>${outlook()}${GR(list.slice(0, 30).map(e => row(e)))}`;
  };
  const rumRow = r => {
    const st = r.st === 'done';
    const v = r.ver === true ? '✅ ตรวจสอบแล้ว: ข่าวจริง' : r.ver === false ? '❌ ตรวจสอบแล้ว: ข่าวเท็จ' : '❔ ยังไม่ได้ตรวจสอบ';
    return `<div class="card"><div class="ci">🗣️</div><div class="cb"><h4>${esc(r.h)}</h4><p>${esc(r.x)}</p><p class="dim">${v}${r.shared ? ' · คุณแชร์ต่อแล้ว' : ''}${st ? ' · ปิดประเด็นแล้ว' : ` · คาดว่าจะมีความชัดเจน${RD(r.res)}`}</p>
      ${!st ? `<div class="row">${B('verify|' + r.id, '🔍 ตรวจสอบ (30 นาที)', { dis: r.ver !== null })}${B('share|' + r.id, '📤 แชร์ต่อ', { ghost: 1, dis: !!r.shared })}${r.co ? B('pr|' + r.id, '🎤 แถลงชี้แจง (1,500 ฿ จากบริษัท)', { ghost: 1, dis: !!r.handled }) : ''}${r.ver === false ? B('report|' + r.id, '🚩 แจ้งลบข่าวเท็จ', { ghost: 1 }) : ''}</div>` : ''}</div></div>`;
  };
  const tabRumour = () => {
    const x = N(), act = x.rum.filter(r => r.st !== 'done'), old = x.hist;
    return `<p class="lead">🔍 ตรวจข่าวลือ · ความน่าเชื่อถือของคุณในสายตาคนในหมู่บ้าน ${Math.round(x.rep)}/100 (แชร์ข่าวเท็จทำให้ลด ตรวจก่อนแชร์ทำให้เพิ่ม ส่งผลต่อพลังโฆษณา)</p>
      <div class="prog"><i style="width:${x.rep}%"></i></div>
      <h5>ข่าวลือที่กำลังแพร่</h5>${GR(act.map(rumRow))}
      ${old.length ? `<h5>ประวัติ</h5>${GR(old.map(h => `<div class="card"><div class="ci">${h.truth ? '✅' : '❌'}</div><div class="cb"><h4>${esc(h.h)}</h4><p class="dim">${esc(dateTxt(h.d))} · ${h.truth ? 'เป็นข่าวจริง' : 'เป็นข่าวเท็จ'}${h.shared ? ' · คุณแชร์' : ''}${h.ver != null ? ' · ตรวจสอบก่อน' : ''}</p></div></div>`))}` : ''}`;
  };
  const tabAds = () => {
    const x = N(), cos = safe(() => Company.list().filter(c => c.st === 'open'), []);
    if (!cos.length) return '<p class="lead">📣 โฆษณา & ประชาสัมพันธ์</p><p class="empty">ต้องมีบริษัทที่เปิดดำเนินการแล้ว (จดทะเบียนที่แอปบริษัท) จึงจะลงโฆษณาได้</p>';
    return `<p class="lead">📣 โฆษณาให้บริษัทของคุณ · จ่ายจากเงินบริษัท · ยอดขายเพิ่มรายวันตามแพ็กเกจ (พลังโฆษณาคูณด้วยความน่าเชื่อถือสื่อของคุณ ×${(0.7 + x.rep / 100 * 0.6).toFixed(2)}) · ได้เฉพาะวันที่บริษัทเปิดทำการ</p>` +
      cos.map(c => {
        const ads = x.ads[c.id] || {};
        return `<h5>🏢 ${esc(c.name)} · เงินบริษัท ${fmt(c.cash)} ฿ · รายรับต่อวันโดยประมาณ ${fmt(dayRev(c))} ฿</h5>` + GR(Object.keys(ADS).map(k => {
          const a = ADS[k], cost = adCost(c, a), on = ads[k] >= S.day;
          return `<div class="card"><div class="ci">${a.i}</div><div class="cb"><h4>${a.n}</h4><p class="dim">${a.days} วัน · ราคา ${fmt(cost)} ฿ · ${a.rep ? 'ผลขึ้นกับความน่าเชื่อถือสื่อของคุณ' : `ยอดขายเพิ่มราว ${Math.round(a.boost * 100)}%`}${on ? ` · กำลังรันถึง${RD(ads[k])}` : ''}</p><div class="row">${B(`ad|${c.id}|${k}`, on ? 'ต่ออายุ' : 'ซื้อแพ็กเกจ', { dis: c.cash < cost })}</div></div></div>`;
        })) + (x.adGain && x.adGain[c.id] ? `<p class="dim">กำไรเพิ่มจากโฆษณาสะสม ${fmt(x.adGain[c.id])} ฿</p>` : '');
      }).join('');
  };
  const tabSub = () => {
    const x = N();
    return `<p class="lead">⚙️ สมาชิก · ตัดบัญชีทุก 28 วัน · ยกเลิกได้ตลอด (ไม่คืนเงินส่วนที่เหลือ)</p><div class="grid">${Object.keys(PLANS).map(k => {
      const p = PLANS[k], on = subOn(k);
      return `<div class="card"><div class="ci">${p.i}</div><div class="cb"><h4>${p.n}</h4><p class="dim">${p.price} ฿ / 28 วัน · ${on ? `สมาชิกถึง${RD(x.sub[k])}` : 'ยังไม่ได้สมัคร'}</p><div class="row">${on ? B('cancel|' + k, 'ยกเลิก', { ghost: 1 }) : B('sub|' + k, 'สมัครสมาชิก', { dis: S.money < p.price })}</div></div></div>`;
    }).join('')}</div>
    <div class="row">${B('auto', x.sub.auto ? '🔁 ต่ออายุอัตโนมัติ: เปิด' : '⏹️ ต่ออายุอัตโนมัติ: ปิด', { ghost: !x.sub.auto })}</div><p class="dim">จ่ายค่าสมาชิกสะสม ${fmt(x.paid)} ฿</p>`;
  };
  const render = t => { hub.tab = t; return [tabTV, tabWeb, tabPaper, tabRumour, tabAds, tabSub][t](); };
  const open = () => UI.open('📰 สื่อ & ข่าว', ['📺 ทีวี', '🌐 ออนไลน์', '📰 หนังสือพิมพ์', '🔍 ตรวจข่าวลือ', '📣 โฆษณา', '⚙️ สมาชิก'], render, { tab: hub.tab, wide: true });

  const spendMin = (m, fn) => { UI.close(); fade(() => { try { tick(m); } catch (e) { } try { fn(); } catch (e) { console.warn('v31n', e); } saveGame(true); setTimeout(open, 600); }); };
  A.goSub = () => { hub.tab = 5; if (UI.cur) UI.cur.tab = 5; UI.renderBody(); };
  A.watch = () => {
    const h = hrOf(), win = (h >= 6 && h < 8.5) ? 'ข่าวเช้า' : (h >= 12 && h < 13) ? 'ข่าวเที่ยง' : (h >= 18.5 && h < 21) ? 'ข่าวค่ำ' : ''; if (!win) return;
    const x = N(), key = S.day + win; if (x.read[key]) return;
    const items = topToday(5), bad = items.filter(e => e.c === 'warn' || e.brk || /ร่วง|ลดลง|เตือน/.test(e.h)).length, good = items.length - bad;
    spendMin(30, () => { x.read[key] = 1; for (const k in x.read) if (!k.startsWith(String(S.day)) && !k.startsWith(String(S.day - 1))) delete x.read[k]; S.mood = clamp((S.mood ?? 70) + (good > bad ? 2 : bad > 2 ? -3 : -1), 0, 100); UI.toast(`ดู${win}จบแล้ว รู้เท่าทันสถานการณ์มากขึ้น`, '📺'); });
  };
  A.sub = k => { const p = PLANS[k], x = N(); if (!p || subOn(k)) return; if (S.money < p.price) { UI.toast('เงินไม่พอ', '💸'); return; } S.money -= p.price; safe(() => Bank2.log(`สมัครสมาชิก${p.n.split(' ')[0]}`, -p.price)); x.sub[k] = S.day + 27; x.paid += p.price; UI.toast(`สมัครสำเร็จ: ${p.n.split(' (')[0]}`, p.i); UI.renderBody(); };
  A.cancel = k => { N().sub[k] = 0; UI.toast('ยกเลิกสมาชิกแล้ว', '🗑️'); UI.renderBody(); };
  A.auto = () => { const x = N(); x.sub.auto = x.sub.auto ? 0 : 1; UI.renderBody(); };
  const R = id => N().rum.find(r => r.id === +id);
  A.verify = id => {
    const r = R(id); if (!r || r.ver !== null || r.st === 'done') return;
    const online = netOK(), ok = online || Math.random() < 0.6;
    spendMin(30, () => {
      if (ok) { r.ver = !!r.truthB; UI.toast(r.truthB ? 'ตรวจสอบแล้ว: ข่าวนี้มีมูลความจริง' : 'ตรวจสอบแล้ว: เป็นข่าวเท็จ อย่าแชร์ต่อ!', r.truthB ? '✅' : '❌'); }
      else UI.toast('โทรสอบถามแล้วยังไม่ได้คำตอบที่ชัดเจน ลองใหม่ภายหลัง', '📞');
    });
  };
  A.share = id => { const r = R(id); if (!r || r.shared || r.st === 'done') return; r.shared = 1; UI.toast(r.ver === false ? 'คุณแชร์ข่าวที่รู้ว่าเป็นเท็จ…' : 'แชร์ต่อแล้ว', '📤'); UI.renderBody(); };
  A.report = id => { const r = R(id); if (!r || r.ver !== false || r.st === 'done') return; const x = N(); r.res = Math.min(r.res, S.day + 1); r.reported = 1; x.rep = clamp(x.rep + 3, 0, 100); UI.toast('แจ้งลบข่าวเท็จแล้ว ความน่าเชื่อถือ +3', '🚩'); UI.renderBody(); };
  A.pr = id => {
    const r = R(id); if (!r || !r.co || r.handled) return; const c = safe(() => Company.get(r.co), null); if (!c) return;
    if (c.cash < 1500) { UI.toast('เงินบริษัทไม่พอ (ต้อง 1,500 ฿)', '💸'); return; }
    c.cash -= 1500; Company.book(c, 0, 1500); r.handled = 1; c.rep = Math.min(100, c.rep + 2); N().rep = clamp(N().rep + 1, 0, 100);
    post({ c: 'biz', h: `${c.name} แถลงข่าวชี้แจงกรณีข่าวลือ`, x: 'ยืนยันว่ากิจการดำเนินตามปกติและชำระหนี้ตรงเวลา', imp: 2 }); UI.toast('แถลงข่าวแล้ว ชื่อเสียงบริษัท +2', '🎤'); UI.renderBody();
  };
  A.ad = (cid, k) => {
    const x = N(), c = safe(() => Company.get(+cid), null), a = ADS[k]; if (!c || !a || c.st !== 'open') return;
    const cost = adCost(c, a); if (c.cash < cost) { UI.toast(`เงินบริษัทไม่พอ (ต้อง ${fmt(cost)} ฿)`, '💸'); return; }
    c.cash -= cost; Company.book(c, 0, cost);
    const ads = x.ads[c.id] = x.ads[c.id] || {}; ads[k] = ads[k] >= S.day ? ads[k] + a.days : S.day + a.days - 1;
    if (a.rep) x.rep = clamp(x.rep + a.rep, 0, 100);
    UI.toast(`ซื้อ${a.n} ให้ ${c.name} แล้ว`, a.i); UI.renderBody();
  };

  // ================= phone app =================
  const addApp = (id, i, n, fn) => {
    if (!APPS.some(a => a.id === id)) APPS.splice(Math.min(APPS.length, 13), 0, { id, i, n });
    Phone.apps[id] = () => { setTimeout(() => { Phone.app = null; UI.close(); fn(); }, 0); return ''; };
    if (typeof APP_GROUPS !== 'undefined') { const gr = APP_GROUPS.find(x => /ชีวิตประจำวัน/.test(x[0])) || APP_GROUPS[0]; if (gr && !gr[1].includes(id)) gr[1].push(id); }
  };
  addApp('news31', '📰', 'สื่อ & ข่าว', open);
  window.News31 = { open, st: N, post, gen: daily, effects, rumour: newRumour, CAT, ADS, PLANS, applyEff };
  try { if (S && S.day && !N().base) { N().base = baseline(); N().idx = safe(() => M.indexNow(), 0); } } catch (e) { }
});
