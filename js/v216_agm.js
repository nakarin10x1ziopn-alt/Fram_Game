'use strict';
// ---------- v216: shareholder register + interactive board / shareholder meetings ----------
// Before: a meeting was settled with one click and only you (and one partner) voted. Now:
//   1. every company has a REGISTER of shareholders (you, the partner, investors you let in by selling new shares, and after a listing the funds and small investors)
//   2. "enter the meeting room" opens a live meeting in a window: roll call + quorum → shareholders put QUESTIONS to you (a few of them ask 1-3 questions each,
//      drawn at random from a bank of ~60 questions that depends on the business and on the real numbers of the company) → you pick an answer →
//      each shareholder's mood changes (a wrong / untrue answer is noticed against the books) → then the VOTE on every agenda item, counted by shares:
//      ordinary resolution = more than half of the votes cast, special resolution (capital increase, new shareholder) = 3/4.
V23.add('v216_agm', function () {
  if (typeof Equity === 'undefined' || !Equity.core || typeof Company === 'undefined') return;
  const K = Equity.core, E = s => (typeof esc === 'function' ? esc(s) : String(s)), pc = K.pc;
  const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const shuffle = a => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  const NAMES = ['คุณสมศักดิ์ รุ่งเรือง', 'คุณวรวุฒิ ใจดี', 'คุณนภา ศรีสุข', 'คุณประพนธ์ มั่งมี', 'คุณจิราพร แสงทอง', 'คุณธนากร เกษตรสุข', 'คุณอรทัย บุญมา', 'คุณพิชัย วงศ์ไทย', 'คุณสุดารัตน์ ทองดี', 'คุณมานะ อดทน', 'คุณกัลยา รักษา', 'คุณวีระ พานิช', 'คุณปราณี สุขสันต์', 'คุณเอกชัย ใจกว้าง'];
  const FUNDS = ['กองทุนรวมสุขใจเพื่อการลงทุน', 'บริษัทประกันชีวิตสุขภัย จำกัด', 'กองทุนบำเหน็จบำนาญอำเภอสุขใจ', 'สหกรณ์ออมทรัพย์สุขใจ จำกัด', 'กองทุนหมู่บ้านทุ่งทอง'];
  const RETS = ['กลุ่มนักลงทุนรายย่อยสุขใจ', 'สมาคมผู้ถือหุ้นรายย่อยไทย', 'คุณยายบุญเรือน (ผู้ถือหุ้นมาตั้งแต่ต้น)', 'กลุ่มสหายนักลงทุนตลาดเช้า'];
  const KIND = { exec: '🧑‍💼 ผู้บริหาร', partner: '🤝 ผู้ถือหุ้นร่วม', inv: '💼 นักลงทุน', fund: '🏛️ กองทุน/สถาบัน', ret: '👥 ผู้ถือหุ้นรายย่อย', emp: '🧑‍💼 ผู้บริหาร/พนักงาน', vil: '🏡 ผู้ถือหุ้นเดิม (ชาวบ้าน/เพื่อน)', ofc: '🎖️ นายทหาร/ตำรวจ', dir: '👔 กรรมการ', chair: '👑 ประธานกรรมการ' };
  const face = m => (m >= 70 ? '😊' : m >= 50 ? '🙂' : m >= 35 ? '😐' : '😠');
  const baht0 = n => (typeof baht === 'function' ? baht(n) : String(n));

  // ================= the shareholder register of a company =================
  const open = c => c && ['setup', 'open'].includes(c.st);
  const startMood = c => clamp(50 + (c.ytd > 0 ? 8 : -8) + ((c.rep || 50) - 50) / 10 + (c.cash < 0 ? -12 : 0) + rnd(-6, 6), 22, 82);
  function reg(c) {
    if (!Array.isArray(c.reg)) c.reg = [];
    const R = c.reg, mine = c.mine == null ? 1 : c.mine, others = Math.max(0, 1 - mine);
    if (c.partner && !R.some(h => h.k === 'partner')) R.unshift({ n: c.partner, k: 'partner', p: 0, mood: startMood(c) });
    const pubs = R.filter(h => h.k === 'fund' || h.k === 'ret'), rest = R.filter(h => !(h.k === 'fund' || h.k === 'ret'));
    if (c.listed) {
      // after a listing the public float is held by funds and small investors; the others keep their stake
      let fixed = rest.reduce((a, h) => a + h.p, 0); if (fixed > others) { const f = others / (fixed || 1); rest.forEach(h => h.p *= f); fixed = others; }
      const pubT = Math.max(0, others - fixed);
      if (pubT > 0.0005 && !pubs.length) { const w = [0.34, 0.22, 0.16, 0.16, 0.12], names = shuffle(FUNDS).slice(0, 3).concat(shuffle(RETS).slice(0, 2)); names.forEach((n, i) => R.push({ n, k: i < 3 ? 'fund' : 'ret', p: pubT * w[i], mood: startMood(c) })); }
      else if (pubs.length) { const s = pubs.reduce((a, h) => a + h.p, 0) || 1; pubs.forEach(h => h.p = pubT * h.p / s); }
    } else {
      const sum = R.reduce((a, h) => a + h.p, 0);
      if (others <= 0.0005) R.forEach(h => h.p = 0);
      else if (sum <= 0) { const t = R.find(h => h.k === 'partner'); if (t) t.p = others; else R.push({ n: c.partner || 'นักลงทุนอิสระ', k: 'partner', p: others, mood: startMood(c) }); }
      else if (Math.abs(sum - others) > 0.0005) R.forEach(h => h.p *= others / sum);
    }
    return R;
  }
  const valueOf = c => Math.max(c.paid || 0, (c.cash || 0) * 0.5) + Math.max(0, c.ytd || 0) * 4;
  function place(c, X) {
    if (!open(c) || c.listed) { UI.toast('ใช้ได้กับบริษัทที่เปิดดำเนินการและยังไม่เข้าตลาดหลักทรัพย์', '👥'); return; }
    const mine = c.mine == null ? 1 : c.mine; if (mine * (1 - X) < 0.2) { UI.toast('เหลือหุ้นของคุณน้อยกว่า 20% ไม่ได้ (จะเสียการควบคุมบริษัท)', '👥'); return; }
    reg(c); const raise = Math.round(valueOf(c) * X / (1 - X) * 0.9);
    c.reg.forEach(h => h.p *= (1 - X)); c.mine = mine * (1 - X);
    const n = clamp(Math.round(X * 20), 2, 4), invs = window.Inv241 ? Inv241.batch(n) : shuffle(NAMES).slice(0, n).map(nm => ({ n: nm, k: 'inv' }));   // v241: business owners, wealthy investors and senior officers
    invs.forEach(v => c.reg.push({ n: v.n, k: v.k || 'inv', p: X / n, mood: startMood(c) + 6, prof: v.prof || '', serving: !!v.serving, ret: !!v.ret }));
    c.cash += raise; c.paid = (c.paid || 0) + raise; c.cap = Math.max(c.cap || 0, c.paid);
    Phone.msg(c.name, `ออกหุ้นใหม่ ${Math.round(X * 100)}% ให้นักลงทุน ${n} ราย ได้เงินเข้าบริษัท ${baht0(raise)} สัดส่วนของคุณเหลือ ${Math.round(c.mine * 100)}%`, true);
    UI.toast('ขายหุ้นใหม่ให้นักลงทุนแล้ว 👥', '👥');
  }

  // ================= what the company looks like to a shareholder =================
  function factsBase(k) {
    if (k.startsWith('co:')) {
      const c = Company.get(+k.slice(3)); if (!c) return null;
      let ups = !!(c.eq && c.eq.gen); try { ups = ups || Sec.site('co:' + c.id).dev.some(d => DEV[d.k].t === 'ups'); } catch (e) { }
      return { c, k, name: c.name, type: c.type, cash: c.cash || 0, ytd: c.ytd || 0, rep: c.rep == null ? 50 : c.rep, staff: (c.staff || []).length, vat: !!(c.lic && c.lic.vat), branches: (c.br || []).filter(b => b.st === 'open').length, listed: !!c.listed, ups, co: true };
    }
    const e = K.ent(k), month = Math.round(e.base * e.m * e.k * 7);
    return { e, k, name: K.nameOf(k), type: 'shop', cash: e.cash, ytd: month * 12, rep: 55, staff: 6, vat: true, branches: 0, listed: false, ups: true, co: false };
  }
  const facts = k => { const f = factsBase(k); return f && window.Agm216 && Agm216.factsEx ? Agm216.factsEx(f) : f; };
  const GRP = { food: ['cafe', 'food', 'bakery', 'noodle', 'tea', 'catering'], energy: ['solar', 'ev'], trans: ['logistics', 'courier', 'moving'], infra: ['dc', 'host', 'isp', 'cyber'], dev: ['it', 'app', 'appdev', 'game', 'webag', 'data', 'ai', 'fintech', 'edtech'], svc: ['itsupport', 'itmaint', 'repair', 'bpo', 'agency', 'sec', 'smarti', 'iot'], shopx: ['itshop', 'ecom', 'shop'] };
  const grpOf = t => { for (const g in GRP) if (GRP[g].includes(t)) return g; return 'all'; };
  function holders(k) {
    const f = facts(k); if (!f) return null;
    if (f.co) {
      const c = f.c; return { f, me: c.mine == null ? 1 : c.mine, list: reg(c).map(h => ({ n: h.n, k: h.k, p: h.p, ref: h })) };
    }
    const e = f.e; return { f, me: e.me, list: e.h.map(h => { if (h.mood == null) h.mood = clamp(50 + rnd(-10, 14), 25, 80); return { n: h.n, k: 'inv', p: h.pct, ref: h }; }) };
  }

  // ================= the bank of questions =================
  // [label, mood change, truth check (the books must agree, else the shareholder notices), reputation change]
  const Q = [];
  const q = (id, grp, when, text, opts) => Q.push({ id, grp, cond: !!when, when: when || (() => true), text, o: opts });
  const g = 'all';
  q('div', g, null, f => `ปีนี้บริษัทมีกำไรสะสม ${baht0(Math.round(f.ytd))} ผมอยากทราบนโยบายปันผลครับ จะจ่ายปันผลหรือไม่ เท่าไร?`, [
    ['ประกาศนโยบายจ่ายปันผลสม่ำเสมอประมาณ 40–50% ของกำไรสุทธิ', 8, f => f.ytd > 0], ['ขอสะสมกำไรไว้ขยายกิจการก่อน ปีนี้งดปันผล เพื่อผลตอบแทนระยะยาว', -3], ['จะจ่ายปันผลสูงกว่ากำไรเพื่อรักษาความเชื่อมั่น (ใช้เงินสดสำรอง)', 10, f => f.cash > 1500000]]);
  q('loss', g, f => f.ytd < 0, f => `งบปีนี้แสดงผลขาดทุน ${baht0(Math.round(-f.ytd))} สาเหตุคืออะไร และแผนแก้ไขเป็นอย่างไร?`, [
    ['อธิบายสาเหตุชัดเจน ค่าใช้จ่ายช่วงตั้งต้นสูง มีแผนลดต้นทุนและเพิ่มรายได้ภายใน 2 ไตรมาส', 5], ['ยืนยันว่าเป็นเรื่องชั่วคราว ไม่มีปัญหาอะไร', -8], ['ขอให้ที่ประชุมเพิ่มทุนเพื่อรองรับ จะนำไปปรับปรุงกิจการ', -2]]);
  q('good', g, f => f.ytd >= 500000, f => `ผลงานปีนี้ดีมาก (กำไรสะสม ${baht0(Math.round(f.ytd))}) ฝ่ายบริหารจะนำกำไรไปทำอะไรต่อ?`, [
    ['ขยายสาขาหรือกำลังการผลิตตามแผนที่ศึกษาไว้', 6, f => f.cash > 600000], ['ลงทุนระบบและบุคลากรเพื่อความยั่งยืน', 4], ['เก็บเป็นเงินสำรองไว้ก่อน', 1]]);
  q('cashlow', g, f => f.cash < 800000, f => `เงินสดบริษัทเหลือ ${baht0(Math.round(f.cash))} เพียงพอจ่ายเงินเดือนและค่าใช้จ่ายหรือไม่ครับ?`, [
    ['แจ้งตัวเลขตามจริง พร้อมแผนบริหารสภาพคล่องและเร่งเก็บหนี้', 3], ['ตอบว่าเพียงพออย่างน้อย 6 เดือน', 8, f => f.cash >= 1500000], ['ขอให้ผู้ถือหุ้นช่วยเพิ่มทุนฉุกเฉิน', -4]]);
  q('cashhigh', g, f => f.cash >= 3000000, f => `เงินสดบริษัท ${baht0(Math.round(f.cash))} ค่อนข้างมาก ทำไมไม่นำไปลงทุนหรือจ่ายปันผล?`, [
    ['จะนำไปลงทุนขยายกิจการตามแผน 12 เดือน', 5], ['จ่ายปันผลพิเศษจากกำไรสะสม', 6, f => f.ytd > 0], ['เก็บไว้เป็นเงินสำรองเผื่อวิกฤต', 1]]);
  q('audit', g, null, 'ผู้สอบบัญชีให้ความเห็นต่องบการเงินปีนี้อย่างไร มีข้อสังเกตหรือไม่?', [
    ['ได้ความเห็นไม่มีเงื่อนไข ไม่มีข้อสังเกตสำคัญ', 8, f => f.vat], ['มีข้อสังเกตเล็กน้อย ได้แก้ไขแล้ว พร้อมแสดงหลักฐานต่อที่ประชุม', 3], ['ยังไม่ได้ว่าจ้างผู้สอบบัญชีอิสระ ขอเวลา', -8]]);
  q('pay', g, null, 'ค่าตอบแทนผู้บริหารและกรรมการปีนี้สมเหตุสมผลหรือไม่ เมื่อเทียบกับผลงาน?', [
    ['เปิดเผยตัวเลขทั้งหมด และผูกโบนัสกับผลงาน', 6], ['ค่าตอบแทนเป็นความลับของบริษัท', -9], ['ลดค่าตอบแทนผู้บริหารลงช่วงที่กำไรน้อย', 4]]);
  q('rpt', g, null, 'มีรายการค้ากับบริษัทของญาติหรือกรรมการหรือไม่ ราคาเป็นธรรมเทียบตลาดหรือเปล่า?', [
    ['ไม่มี หรือมีเฉพาะรายการที่เทียบราคาตลาดและรายงานต่อที่ประชุมแล้ว', 7], ['มีบ้างแต่ไม่ได้เทียบราคา', -9], ['ขอไม่ตอบในที่ประชุม', -10]]);
  q('expand', g, null, 'ปีหน้ามีแผนขยายสาขาหรือขยายกิจการหรือไม่ ใช้เงินเท่าไร?', [
    ['เปิดสาขาใหม่ 1–2 แห่ง ใช้เงินจากกำไรสะสม', 6, f => f.cash > 1000000], ['ยังไม่ขยาย เน้นเพิ่มประสิทธิภาพสาขาเดิม', 2], ['ขยายใหญ่โดยกู้ธนาคาร', 3, f => f.ytd > 300000]]);
  q('comp', g, null, 'ได้ยินว่ามีคู่แข่งรายใหม่เปิดใกล้เคียง บริษัทมีแผนรับมืออย่างไร?', [
    ['เน้นคุณภาพบริการและโปรโมชั่นสำหรับลูกค้าประจำ', 5, f => f.rep >= 40], ['ลดราคาแข่งทันที แม้กำไรจะลดลง', -2], ['ไม่กังวล ลูกค้าเรากับเราเหนียวแน่นอยู่แล้ว', 1, f => f.rep >= 60]]);
  q('staff', g, null, 'พนักงานมีขวัญกำลังใจอย่างไร มีแผนพัฒนาและสวัสดิการหรือไม่?', [
    ['ประกันสังคม โบนัสประจำปี และอบรมพนักงานต่อเนื่อง', 6, f => f.staff > 0], ['ขอลดสวัสดิการเพื่อลดต้นทุน', -6], ['จะรับพนักงานเพิ่มในปีหน้า', 3, f => f.ytd > 0]]);
  q('power', g, null, 'ถ้าไฟฟ้าดับหรืออินเทอร์เน็ตล่มนานๆ ธุรกิจจะหยุดหรือไม่ มีระบบสำรองหรือเปล่า?', [
    ['มี UPS/เครื่องปั่นไฟสำรองและทดสอบเป็นประจำ', 7, f => f.ups], ['ยังไม่มี แต่จะจัดซื้อภายในปีนี้', 1], ['ยังไม่เคยมีปัญหา จึงยังไม่จำเป็น', -6]]);
  q('tax', g, null, 'บริษัทเสียภาษีและมีใบอนุญาตครบถ้วนหรือไม่ เคยถูกปรับหรือเปล่า?', [
    ['เสียภาษีครบ จด VAT ถูกต้อง ไม่เคยถูกปรับ', 7, f => f.vat], ['กำลังยื่นขอใบอนุญาตที่ขาดอยู่', 1], ['ใช้นักบัญชีช่วยวางแผนภาษีให้ต่ำที่สุดเท่าที่ทำได้', -3]]);
  q('cap', g, null, 'จะมีการเพิ่มทุนอีกหรือไม่ และจะกระทบสัดส่วนหุ้นของผมหรือไม่?', [
    ['ยังไม่มีแผนเพิ่มทุนปีนี้ หากมีจะให้ผู้ถือหุ้นเดิมจองก่อน', 6], ['อาจเพิ่มทุนปีหน้า ผู้ถือหุ้นเดิมมีสิทธิจองก่อนตามสัดส่วน', 3], ['เพิ่มทุนให้นักลงทุนใหม่ได้ตามที่เห็นสมควร', -7]]);
  q('ipo', g, f => !f.listed && f.ytd >= 1000000, 'ผลงานดีขนาดนี้ มีแผนเข้าตลาดหลักทรัพย์หรือไม่?', [
    ['ศึกษาอยู่ ต้องมีกำไรและทุนชำระแล้วตามเกณฑ์ ตลท.', 5], ['ยังไม่มีแผน อยากบริหารเองให้คล่องตัว', 0], ['ภายใน 1 ปีแน่นอน', 6, f => f.ytd >= 3000000]]);
  q('listed', g, f => f.listed, 'ราคาหุ้นผันผวน ฝ่ายบริหารมีแผนสร้างความเชื่อมั่นนักลงทุนอย่างไร?', [
    ['จัดพบนักวิเคราะห์ ประกาศงบตรงเวลา และเปิดเผยข้อมูลสม่ำเสมอ', 6], ['ซื้อหุ้นคืนเมื่อราคาต่ำเกินไป', 4, f => f.cash > 2000000], ['ไม่ให้ความเห็นเรื่องราคาหุ้น', -3]]);
  q('key', g, null, 'ถ้าเจ้าของหรือผู้บริหารหลักไม่สามารถทำงานได้ ใครจะบริหารต่อ?', [
    ['มีผู้จัดการมืออาชีพและแผนสืบทอดงานเป็นลายลักษณ์อักษร', 6, f => f.staff >= 3], ['จะสรรหาผู้บริหารเพิ่มภายในปีนี้', 2], ['เจ้าของยังแข็งแรง ไม่ต้องห่วง', -5]]);
  q('esg', g, null, 'บริษัททำอะไรเพื่อชุมชนและสิ่งแวดล้อมบ้าง?', [
    ['ตั้งงบ CSR ทุกปี ลดขยะและใช้พลังงานสะอาด', 5, f => f.rep >= 40 && f.ytd > 0], ['ร่วมกิจกรรมชุมชนตามโอกาส', 2], ['ธุรกิจต้องทำกำไรก่อน เรื่องอื่นไว้ทีหลัง', -4]]);
  q('info', g, null, 'ขอให้ส่งงบรายไตรมาสให้ผู้ถือหุ้นรายย่อยได้ไหม?', [
    ['ได้ ส่งงบรายไตรมาสและรายงานประจำปีให้ทุกท่าน', 6], ['ส่งปีละครั้งตามที่กฎหมายกำหนด', 0], ['ข้อมูลเป็นความลับทางการค้า', -6]]);
  q('debt', g, f => f.cash < 0, 'บัญชีบริษัทติดลบอยู่ ใครรับผิดชอบ และจะแก้ไขอย่างไร?', [
    ['เจ้าของจะเพิ่มทุนทันทีและงดค่าใช้จ่ายที่ไม่จำเป็น', 4], ['เป็นเรื่องปกติของธุรกิจช่วงต้น', -8], ['เจรจาเจ้าหนี้ขยายเวลาชำระ', 1]]);
  q('branch', g, f => f.branches > 0, f => `บริษัทมี ${f.branches} สาขา สาขาไหนทำกำไร สาขาไหนขาดทุน และมีแผนปิดสาขาที่ไม่คุ้มหรือไม่?`, [
    ['แสดงผลรายสาขาต่อที่ประชุม และมีเกณฑ์ปิดสาขาที่ขาดทุนติดกัน 2 รอบ', 7], ['รวมตัวเลขทุกสาขาไว้ด้วยกัน ไม่แยกรายสาขา', -5], ['จะไม่ปิดสาขาใดเลย เพื่อภาพลักษณ์', -3]]);
  // ---- food and drink ----
  q('f1', 'food', null, 'วัตถุดิบราคาผันผวน แผนบริหารต้นทุนอาหารเป็นอย่างไร?', [['ทำสัญญาซื้อล่วงหน้ากับสหกรณ์เกษตรกร', 6], ['ปรับราคาขายตามต้นทุน', 0], ['ลดปริมาณต่อจานเพื่อรักษากำไร', -6]]);
  q('f2', 'food', null, 'เรื่องความสะอาดและมาตรฐานอาหาร (อย./GMP) เคยมีข้อร้องเรียนไหม?', [['ผ่านการตรวจสุขาภิบาล ไม่เคยมีข้อร้องเรียน', 7, f => f.rep >= 50], ['เคยมีข้อร้องเรียนแต่แก้ไขแล้ว', 1], ['เป็นเรื่องเล็กน้อย ไม่ต้องกังวล', -7]]);
  q('f3', 'food', null, 'ขยะอาหารและของเสียในครัวมีมากไหม?', [['จัดระบบ FIFO ลดของเสีย ส่งเศษอาหารให้ฟาร์ม', 5], ['ยังไม่ได้วัดเป็นตัวเลข', -3], ['ถือเป็นต้นทุนปกติของธุรกิจอาหาร', -2]]);
  q('f4', 'food', null, 'ลูกค้าบ่นว่าราคาแพง จะปรับอย่างไร?', [['เพิ่มเมนูราคาประหยัดและสะสมแต้มลูกค้า', 4], ['คุณภาพคุ้มค่า ไม่ลดราคา', 0, f => f.rep >= 55], ['ขึ้นราคาอีก 10%', -4]]);
  // ---- energy ----
  q('e1', 'energy', null, 'นโยบายค่าไฟและการรับซื้อไฟของรัฐกระทบธุรกิจเรามากแค่ไหน?', [['ติดตามนโยบายและกระจายรายได้ไปงานบำรุงรักษา (O&M)', 5], ['ยังไม่ได้ประเมินผลกระทบ', -5], ['ไม่กระทบเลย', -2]]);
  q('e2', 'energy', null, 'เรื่องความปลอดภัยงานไฟฟ้า มีประกันและรับประกันงานติดตั้งไหม?', [['มีประกันความรับผิดต่อบุคคลภายนอก และรับประกันงาน 5 ปี', 7], ['มีมาตรฐานความปลอดภัยแต่ยังไม่มีประกัน', 1], ['ไม่เคยเกิดอุบัติเหตุ จึงไม่จำเป็น', -4]]);
  q('e3', 'energy', null, 'ราคาแผง เครื่องชาร์จ และอุปกรณ์ผันผวน กระทบกำไรโครงการอย่างไร?', [['ล็อกราคาซัพพลายเออร์ล่วงหน้าและใส่เงื่อนไขปรับราคาในสัญญา', 5], ['ปรับราคางานให้ลูกค้า', 0], ['บริษัทรับความเสี่ยงเอง', -3]]);
  q('e4', 'energy', null, 'ใบอนุญาต กกพ. และ อ.1 ครบถ้วนหรือยัง?', [['ครบถ้วนและต่ออายุตรงเวลา', 6, f => f.vat], ['ใกล้เสร็จแล้ว', 0], ['ยังไม่ครบ แต่เดินงานไปก่อน', -9]]);
  // ---- transport ----
  q('t1', 'trans', null, 'ราคาน้ำมันขึ้น ต้นทุนขนส่งเพิ่มมาก ปรับแผนอย่างไร?', [['ปรับเส้นทาง บำรุงรักษารถ และใส่ค่าน้ำมันผันแปรในสัญญา', 6], ['รับต้นทุนเอง ไม่ปรับราคา', -4], ['เริ่มเปลี่ยนเป็นรถไฟฟ้าบางส่วน', 4, f => f.cash > 1500000]]);
  q('t2', 'trans', null, 'เรื่องอุบัติเหตุและสินค้าเสียหายระหว่างขนส่ง มีประกันไหม?', [['ซื้อประกันสินค้าและประกันรถทุกคัน อบรมคนขับ', 7], ['มีประกันรถ แต่ไม่มีประกันสินค้า', 0], ['ลูกค้าต้องรับความเสี่ยงเอง', -7]]);
  q('t3', 'trans', null, 'รถวิ่งเที่ยวเปล่ามีมากไหม ใช้รถคุ้มค่าหรือเปล่า?', [['จัดตารางเที่ยวกลับและรับงานเสริม', 5], ['ยังไม่ได้วัดตัวเลข', -4], ['ซื้อรถเพิ่มเพื่อรับงานมากขึ้น', -2]]);
  q('t4', 'trans', null, 'คนขับลาออกบ่อยไหม ใบขับขี่ถูกต้องครบหรือเปล่า?', [['ตรวจใบขับขี่ทุกคนและจ่ายค่าเที่ยวตามผลงาน', 5], ['มีลาออกบ้างตามฤดูกาล', 0], ['ไม่ได้ตรวจสอบละเอียด', -8]]);
  // ---- infrastructure (data centre / hosting / ISP / security) ----
  q('i1', 'infra', null, 'ถ้าระบบลูกค้าล่ม บริษัทรับผิดชอบเท่าไร และ SLA ที่ให้ไว้ทำได้จริงไหม?', [['ปรับ SLA ให้ตรงกับความสามารถจริง และมีประกันความรับผิด', 5], ['รับปากความพร้อมใช้งาน 99.99% ไว้ก่อน', 9, f => f.ups && f.cash > 2000000], ['SLA ตรงกับระบบสำรองที่ติดตั้งจริงทุกข้อ', 7, f => f.ups]]);
  q('i2', 'infra', null, 'ภัยไซเบอร์ เคยถูกโจมตีหรือไม่ มีแผนรับมืออย่างไร?', [['มีไฟร์วอลล์ สำรองข้อมูลนอกไซต์ และซ้อมแผนรับมือ', 7, f => f.cash > 500000], ['ยังไม่เคยถูกโจมตี', -3], ['จะจ้างที่ปรึกษาความปลอดภัยปีหน้า', 2]]);
  q('i3', 'infra', null, 'ค่าไฟของระบบเครือข่าย/ห้องเซิร์ฟเวอร์สูง กระทบกำไรแค่ไหน?', [['ปรับระบบทำความเย็นและทำสัญญาไฟอัตราพิเศษ', 5], ['ส่งต่อค่าไฟให้ลูกค้าตามสัญญา', 2], ['ยังไม่มีมาตรการ', -4]]);
  q('i4', 'infra', null, 'พื้นที่แร็คและแบนด์วิดท์ใกล้เต็มหรือยัง จะลงทุนเพิ่มเมื่อไร?', [['ลงทุนเมื่อใช้งานเกิน 70% ตามสัญญาที่ลงนามแล้ว', 6], ['ลงทุนล่วงหน้าเต็มกำลัง', 1, f => f.cash > 3000000], ['รอให้เต็มก่อนค่อยว่ากัน', -4]]);
  // ---- software / digital product ----
  q('d1', 'dev', null, 'โครงการซอฟต์แวร์ส่งมอบล่าช้าบ่อยไหม ลูกค้าเคยปรับหรือเปล่า?', [['ใช้ Agile ส่งงานเป็นรอบและมีบัฟเฟอร์เวลา', 6], ['มีล่าช้าบ้าง เพราะลูกค้าเปลี่ยนความต้องการ', 0], ['ไม่เคยล่าช้าเลย', 6, f => f.rep >= 70]]);
  q('d2', 'dev', null, 'ลิขสิทธิ์ซอฟต์แวร์และข้อมูลลูกค้า (PDPA) เรียบร้อยหรือไม่?', [['ใช้ไลเซนส์ถูกลิขสิทธิ์ทั้งหมดและทำตาม PDPA', 7, f => f.vat], ['กำลังจัดทำนโยบาย PDPA', 1], ['ใช้ซอฟต์แวร์เถื่อนบ้างเพื่อลดต้นทุน', -10]]);
  q('d3', 'dev', null, 'โปรแกรมเมอร์เก่งๆ ถูกซื้อตัว มีแผนรักษาคนอย่างไร?', [['ปรับเงินเดือน หุ้นพนักงาน (ESOP) และโบนัสโครงการ', 6, f => f.cash > 600000], ['ให้ทุนเรียนต่อและสร้างเส้นทางอาชีพ', 3], ['ปล่อยไปตามกลไกตลาด', -4]]);
  q('d4', 'dev', null, 'AI จะมาแทนงานของบริษัทเราไหม?', [['นำ AI มาเป็นเครื่องมือเพิ่มผลผลิตและเสนอบริการใหม่', 6], ['ติดตามอยู่ ยังไม่ลงทุน', 0], ['ไม่กระทบแน่นอน', -4]]);
  // ---- service companies ----
  q('s1', 'svc', null, 'ลูกค้าประจำยกเลิกสัญญาบ่อยไหม คุณภาพบริการเป็นอย่างไร?', [['วัดความพึงพอใจทุกเดือน อัตรายกเลิกต่ำ', 6, f => f.rep >= 50], ['มียกเลิกบ้าง กำลังปรับปรุงเวลาตอบสนอง', 0], ['ลูกค้ายกเลิกเพราะราคา ไม่ใช่คุณภาพ', -3]]);
  q('s2', 'svc', null, 'ค่าแรงเพิ่มทุกปี จะรักษากำไรของงานบริการได้อย่างไร?', [['ใช้ระบบอัตโนมัติและทีมผสมระหว่างพนักงานประจำกับ Freelance', 5], ['ขึ้นราคาค่าบริการ', 0], ['ลดจำนวนพนักงาน', -4]]);
  q('s3', 'svc', null, 'ข้อมูลลูกค้าที่ทีมงานเข้าถึง มีมาตรการรักษาความลับไหม?', [['ทำสัญญา NDA ทุกคนและบันทึกการเข้าถึงข้อมูล', 6], ['มีนโยบายแต่ไม่เคยตรวจสอบ', -3], ['เชื่อใจพนักงานทุกคน', -6]]);
  q('s4', 'svc', null, 'มีแผนสร้างรายได้ประจำ (recurring) เพิ่มจากงานโครงการหรือไม่?', [['เพิ่มสัญญาดูแลรายเดือนให้ลูกค้าโครงการเดิม', 6], ['เน้นหางานโครงการใหม่', 1], ['ยังไม่มีแผน', -4]]);
  // ---- retail / online shops ----
  q('r1', 'shopx', null, 'สินค้าค้างสต็อกมีมากไหม มีความเสี่ยงล้าสมัยหรือเปล่า?', [['ตรวจนับสต็อกรายเดือน ลดราคาของค้างและสั่งตามยอดขาย', 6], ['มีของค้างบ้าง กำลังเคลียร์', 0], ['ไม่ได้ตรวจนับเป็นประจำ', -7]]);
  q('r2', 'shopx', null, 'ลูกค้าหันไปซื้อออนไลน์ ร้านจะปรับตัวอย่างไร?', [['เปิดช่องทางออนไลน์และส่งถึงบ้านภายในวัน', 6], ['เน้นบริการหน้าร้านที่ออนไลน์ให้ไม่ได้', 2], ['รอดูสถานการณ์', -4]]);
  q('r3', 'shopx', null, 'ราคาสินค้าและส่วนลดตั้งอย่างไร กำไรขั้นต้นเท่าไร?', [['เปิดเผยกำไรขั้นต้นและนโยบายส่วนลดต่อที่ประชุม', 5], ['ขึ้นอยู่กับสถานการณ์ตลาด', 0], ['ลดราคาแรงเพื่อแย่งลูกค้า', -3]]);
  q('r4', 'shopx', null, 'สินค้าชำรุดและการคืนสินค้ามีมากไหม ซัพพลายเออร์รับผิดชอบหรือไม่?', [['เจรจาเงื่อนไขคืนสินค้ากับซัพพลายเออร์เป็นลายลักษณ์อักษร', 6], ['บริษัทรับผิดชอบเอง', -2], ['ยังไม่เคยสรุปตัวเลข', -5]]);

  // ================= a live meeting =================
  let SES = null;
  const STANCE_B = { mgr: { dir: .1 }, expand: { dir: .05 }, branch: { dir: .05 }, bonus: { dir: .12 }, closebr: { dir: -.05 } };
  const STANCE = { spec: { ofc: .1, inv: .2, fund: .2, ret: .25, emp: .1 }, div: { ofc: .15, inv: .25, fund: .2, ret: .25 }, cap: { ofc: -.1, inv: -.2, fund: -.15, ret: -.25, emp: .05 }, expand: { ofc: -.05, inv: -.05, emp: .15, fund: .05 }, mgr: { emp: .1, inv: .05, fund: .1 }, agm: { fund: .05 }, newholder: { ofc: -.1, inv: -.15, ret: -.1, fund: -.1 }, holder: { partner: -.1 } };
  const SPECIAL = { cap: 1, newholder: 1, bylaw: 1, ipo: 1 };
  const isInfo = it => !!(K.AG[it.t] && K.AG[it.t].info);
  const nextVi = (SS, from) => { for (let i = from; i < SS.m.items.length; i++) if (!isInfo(SS.m.items[i])) return i; return -1; };
  const toVote = SS => { const i = nextVi(SS, 0); if (i < 0) SS.ph = 'result'; else { SS.ph = 'vote'; SS.vi = i; } };
  const ATT = { ofc: .8, partner: .95, inv: .85, fund: .9, ret: .5, emp: .8, vil: .9, dir: .92, chair: 1 };

  function startSession(m) {
    const board = m.kind === 'board' && window.Agm216 && Agm216.boardH;
    const H = board ? Agm216.boardH(m.key) : holders(m.key); if (!H) { m.status = 'cancel'; m.note = 'ไม่พบกิจการ'; return; }
    const f = H.f, att = H.list.filter(h => Math.random() < (ATT[h.k] || .8)), attP = H.me + att.reduce((a, h) => a + h.p, 0);
    const SS = SES = { log: [], promo: { ok: [], bad: [] }, m, k: m.key, H, f, att, attP, board: !!board, quorum: attP >= (board ? 0.5 : 0.25), ph: 'open', qs: [], qi: 0, ans: null, vi: 0, choice: {}, res: null, asked: 0 };
    if (!SS.quorum) return;
    f.items = m.items.map(i => i.t);
    f.itemAmt = {}; m.items.forEach(i => { f.itemAmt[i.t] = i.v; });
    if (window.Agm216) Agm216.cur = SS;
    try { if (window.Agm216 && Agm216.promiseStart) Agm216.promiseStart(SS); } catch (e) { console.warn('promise', e); }
    // who asks: about 40% of the people in the room (1-4), the bigger and the more worried holders first
    const pool = att.slice(); const nAsk = board ? Math.min(pool.length, 3) : clamp(Math.round(pool.length * 0.5) || (pool.length ? 1 : 0), 0, 5);   // a board: every director (up to 3) asks
    const askers = []; while (askers.length < nAsk && pool.length) { const w = pool.map(h => 0.3 + h.p * 3 + (100 - (h.ref.mood || 50)) / 100); let r = Math.random() * w.reduce((a, b) => a + b, 0), i = 0; for (; i < pool.length - 1 && r > w[i]; i++) r -= w[i]; askers.push(pool.splice(i, 1)[0]); }
    const grp = grpOf(f.type), used = new Set((window.Agm216 && Agm216.recentQ) ? Agm216.recentQ(SS) : []), okW = x => { const w = x.who || (x.grp === 'all' ? 'sh' : 'both'); return w === 'both' || w === (board ? 'bd' : 'sh'); }, elig = () => shuffle(Q.filter(x => !used.has(x.id) && okW(x) && (x.grp === 'all' || x.grp === grp) && x.when(f)));
    for (const a of []) {
      let n = 1 + Math.floor(Math.random() * 3);
      while (n-- > 0 && SS.qs.length < 12) {
        const L = elig(), sp = L.filter(x => x.grp !== 'all'), x = (sp.length && Math.random() < 0.5) ? sp[0] : L[0]; if (!x) break;
        used.add(x.id); SS.qs.push({ q: x, by: a });
      }
    }
    SS.askers = askers;
    buildScript(SS, att, used, okW, grp);
  }
  // a board meeting follows the 8 standard agenda points; every point has an information panel from the real books, the directors' questions on that point and the votes of the items on it
  function buildScript(SS, att, used, okW, grp) {
    const A = window.Agm216, m = SS.m, f = SS.f, B = SS.board, G = B ? A.AGN : A.AGNS, N = Object.keys(G).length;
    const agItem = it => kindAgOf(SS, it.t), BMAP = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 3, 6: 4, 7: 3, 8: 3, 9: 3, 10: 8, 11: 5, 12: 3, 13: 7, 14: 7, 15: 7, 16: 6, 17: 5, 18: 8 };   // board point -> point of the shareholders' meeting (18 board points since v223)
    const agQ = x => x.ag || (B ? (A.QAG && A.QAG[x.id]) || 5 : (A.QAGS && A.QAGS[x.id]) || BMAP[(A.QAG && A.QAG[x.id])] || 8);
    const want = B ? { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1, 10: 0, 11: 1, 12: 1, 13: 1, 14: 1, 15: 1, 16: 1, 17: 1, 18: 1 } : { 1: 0, 2: 0, 3: 2, 4: 1, 5: 2, 6: 1, 7: 1, 8: 3 }, qs = [];
    if (B && f.items && f.items.includes('buyg')) want[8] = 4; if (B && f.items && f.items.includes('stake')) want[10] = 4;   // a big purchase or an investment on the table: the directors question it properly
    // a fuller room asks more (more than 6 people in the room +2 questions, more than 12 +4); the meeting-length setting caps the total
    const LEN = meetingLen(), room = att.length, CAP = { short: 6, normal: room > 12 ? 14 : 12, long: 16, unlimited: 1e9 }[LEN];
    let extra = room > 12 ? 4 : room > 6 ? 2 : 0; const order = B ? [9, 12, 4, 7, 13, 14, 3, 5, 11, 8, 15, 6] : [8, 5, 3, 6, 4, 7];
    for (let i = 0; extra > 0; i++, extra--) want[order[i % order.length]] = (want[order[i % order.length]] || 0) + 1;
    if (LEN === 'long' || LEN === 'unlimited') for (const k of (B ? [3, 5, 7, 9, 12, 14] : [3, 5, 6, 8])) want[k] = (want[k] || 0) + 1;   // a long meeting: one more question on four of the points
    // v234: a meeting "only on the chosen items" asks about those agenda points only; a full meeting (scope 'full' or an old meeting without a scope) covers every point
    if (m.scope === 'items') { const pts = new Set(m.items.map(it => kindAgOf(SS, it.t))); for (const k of Object.keys(want)) want[k] = pts.has(+k) ? Math.max(want[k] || 0, 2) : 0; for (const k of pts) if (want[k] == null) want[k] = 2; }
    const sumW = () => Object.values(want).reduce((a, x) => a + x, 0);
    while (sumW() > CAP) { let best = 0; for (const k of Object.keys(want)) if ((want[k] || 0) >= (want[best] || 0)) best = k; if (!want[best]) break; want[best]--; }
    SS.cap = CAP; SS.len = LEN;
    const ofcAtt = att.filter(h => h.k === 'ofc' || (h.ref && h.ref.ofc)); let ofcAsked = 0;   // v241: a police / military officer in the room asks the questions of his own field (safety, regulation, conflict of interest)
    const dirs = att.slice(); let curN = 0; const maxAsk = LEN === 'unlimited' ? 99 : (B ? 3 : 5), askers = new Set();
    const who = () => { const P = askers.size >= maxAsk ? dirs.filter(h => askers.has(h)) : dirs; if (!P.length) return null; const w = P.map(h => (B ? 0.4 : 0.3 + h.p * 3) * (A.prefer ? A.prefer(curN, h, B) : 1) + (100 - (h.ref.mood || 50)) / 100); let r = Math.random() * w.reduce((a, b) => a + b, 0), i = 0; for (; i < P.length - 1 && r > w[i]; i++) r -= w[i]; askers.add(P[i]); return P[i]; };
    SS.askerFn = n => { curN = n; return who(); };   // used by 'the shareholders ask more on this point'
    if (dirs.length) for (let n = 1; n <= N; n++) {
      curN = n; let cnt = want[n] || 0; const dyn = (A.dynQ ? A.dynQ(n, SS) : []).slice(0, cnt);
      for (const d of dyn) { const h = who(); if (h && qs.length < CAP) { qs.push({ q: d, by: h, ag: n }); cnt--; } }
      if (ofcAtt.length && cnt > 0 && qs.length < CAP && ofcAsked < 2) { const oq = Q.filter(x => x.askBy === 'ofc' && !used.has(x.id) && okW(x) && agQ(x) === n && x.when(f)); if (oq.length) { const x = oq[Math.floor(Math.random() * oq.length)], h = ofcAtt[Math.floor(Math.random() * ofcAtt.length)]; used.add(x.id); qs.push({ q: x, by: h, ag: n }); askers.add(h); cnt--; ofcAsked++; } }
      const pool = shuffle(Q.filter(x => !x.askBy && !used.has(x.id) && okW(x) && (x.grp === 'all' || x.grp === grp) && agQ(x) === n && x.when(f))).sort((x, y) => (y.cond ? 1 : 0) - (x.cond ? 1 : 0) || 0);
      const pickOne = () => { if (!pool.length) return null; let x = pool[0].cond ? pool[0] : null; if (!x) { const spL = pool.filter(y => y.grp !== 'all'); x = (spL.length && Math.random() < 0.5) ? spL[0] : pool[0]; } pool.splice(pool.indexOf(x), 1); return x; };
      while (cnt-- > 0 && qs.length < CAP) { const x = pickOne(); if (!x) break; const h = who(); if (!h) break; used.add(x.id); qs.push({ q: x, by: h, ag: n }); }
      // item 1: the person who asked on this point often asks a second question on it (about half of the points)
      if (qs.some(x => x.ag === n) && pool.length && qs.length < CAP + 1 && Math.random() < 0.5) { const x2 = pickOne(); if (x2) { const src = qs.filter(q => q.ag === n).slice(-1)[0]; used.add(x2.id); qs.push({ q: wrapQ(x2, 'ถามต่อจากเรื่องก่อนหน้า: '), by: src.by, ag: n, follow: 1 }); } }
      SS.spare = SS.spare || {}; SS.spare[n] = pool.slice();
    }
    SS.qs = qs; rebuildScript(SS); SS.si = 0;
  }
  function rebuildScript(SS) {
    const m = SS.m, G = kindAGN(SS), N = Object.keys(G).length, qs = SS.qs; SS.script = [];
    for (let n = 1; n <= N; n++) {
      if (m.scope === 'items' && !qs.some(x => x.ag === n) && !m.items.some(it => kindAgOf(SS, it.t) === n)) continue;   // v234: skip the points nobody asked for
      SS.script.push({ k: 'ag', n });
      qs.forEach((x, qi) => { if (x.ag === n) SS.script.push({ k: 'q', qi, n }); });
      m.items.forEach((it, vi) => { if (!isInfo(it) && kindAgOf(SS, it.t) === n) SS.script.push({ k: 'v', vi, n }); });
    }
  }
  // a question asked again by the same person ("ถามต่อ") or in anger after bad answers
  const wrapQ = (x, prefix) => ({ id: x.id, no: x.no, grp: x.grp, who: x.who, get o() { return x.o; }, text: f => prefix + (typeof x.text === 'function' ? x.text(f) : x.text) });
  // who chairs a board meeting: you (no elected chair), the elected chair if present, else the vice chair if present, else the meeting asks you to chair it.
  // The chair of a board meeting does not vote with the directors: the chair only casts the deciding vote when the directors' votes are tied.
  const chairX = SS => {
    if (!SS.board) return null; if (SS.chairX) return SS.chairX;
    const c = SS.f && SS.f.c, att = SS.att || []; let x = { me: true };
    if (c && c.chair) {
      const h = att.find(q => !q.nv && q.n === c.chair); let v = null; try { v = window.Roles258 && Roles258.viceOf(c); } catch (e) { }
      const vh = !h && v ? att.find(q => !q.nv && q.n === v) : null;
      x = h ? { me: false, h } : vh ? { me: false, h: vh, vice: true } : { me: true, acting: true };
    }
    return (SS.chairX = x);
  };
  const chairName = SS => { const x = chairX(SS); return !x ? '' : x.me ? 'คุณ' : x.h.n; };
  const isTie = r => Math.abs(r.yes - r.no) < 1e-9;
  const mkVote = (SS, it) => {
    const A = K.AG[it.t], ch = chairX(SS), meVotes = !(ch && ch.me), cho = meVotes ? SS.choice[it.i] : undefined;
    const res = { yes: cho === 1 ? SS.H.me : 0, no: cho === 0 ? SS.H.me : 0, abst: meVotes && cho == null ? SS.H.me : 0, votes: [], cy: cho === 1 ? 1 : 0, cn: cho === 0 ? 1 : 0 };
    for (const h of SS.att) {
      if (h.nv) continue;   // executives sit in the meeting and answer, but do not vote
      const mood = h.ref.mood == null ? 50 : h.ref.mood, st = (SS.board ? (((STANCE_B[it.t] || {})[h.k]) || 0) : (((STANCE[it.t] || {})[h.k]) || 0)) + ((window.Agm216 && Agm216.stanceEx) ? Agm216.stanceEx(h, it, SS.board) : 0);
      const pv = clamp(A.yes(it) + (mood - 50) / 100 * 0.9 + st + Math.min(0.24, 0.12 * ((SS.lobby && SS.lobby[h.n]) || 0)), 0.04, 0.96);
      if (ch && ch.h === h) { res.chairPv = pv; continue; }   // the chair does not vote with the directors
      const yes = Math.random() < pv;
      res.votes.push({ n: h.n, k: h.k, p: h.p, y: yes, pv }); if (yes) { res.yes += h.p; res.cy++; } else { res.no += h.p; res.cn++; }
    }
    return res;
  };
  function finish(SS) {
    if (SS.res) return; const m = SS.m, res = [], deferItems = [];
    m.items.forEach((it, i) => {
      if (isInfo(it)) { res.push({ txt: lab(m, it), pass: true, info: true, summary: (window.Agm216 && Agm216.infoEx) ? Agm216.infoEx(m, it, SS.f) : '', yes: 0, no: 0, out: '', abst: 0, votes: [], need: 0 }); return; }
      if (SS.deferSet && SS.deferSet.has(i)) { res.push({ txt: lab(m, it), pass: false, defer: true, yes: 0, no: 0, out: 'เลื่อนไปพิจารณาในการประชุมครั้งถัดไป (7 วัน)', abst: 0, votes: [], need: 0 }); deferItems.push(it); return; }
      const r = (SS.pre && SS.pre[i]) || mkVote(SS, Object.assign({ i }, it)), tot = r.yes + r.no, need = SPECIAL[it.t] && !SS.board ? 0.75 : 0.5;
      let pass = tot > 0 && (SPECIAL[it.t] && !SS.board ? r.yes / tot >= need : r.yes > r.no), chairTxt = '';
      if (SS.board) {   // the directors vote; the chair stays out of it and only decides a tie (a casting vote)
        const ch = chairX(SS), who = ch.me ? 'คุณ' : ch.h.n, role = ch.vice ? 'รองประธาน (ทำหน้าที่ประธาน)' : 'ประธาน';
        if (isTie(r)) {
          const cast = ch.me ? (SS.choice[i] == null ? null : SS.choice[i] === 1) : Math.random() < (r.chairPv == null ? 0.5 : r.chairPv);
          pass = cast === true; if (cast != null) r[cast ? 'yes' : 'no'] += SS.H.me;
          chairTxt = `⚖️ คะแนนกรรมการเสมอกัน ${r.cy} ต่อ ${r.cn} · ${role} (${who}) ${cast == null ? 'ไม่ชี้ขาด เรื่องนี้จึงตกไป' : 'ออกเสียงชี้ขาด: ' + (cast ? 'เห็นด้วย' : 'ไม่เห็นด้วย')}`;
        } else chairTxt = `👑 ${role} (${who}) ไม่ออกเสียง เพราะคะแนนกรรมการไม่เสมอกัน`;
      }
      let out = ''; if (!pass && window.Agm216 && Agm216.failEx) { try { out = Agm216.failEx(m, it) || ''; } catch (e) { console.warn(e); } }
      if (pass) { try { out = ((window.Agm216 && Agm216.applyEx) ? Agm216.applyEx(m, it) : null); if (out == null) out = K.apply(m, it) || ''; } catch (e) { out = 'เกิดข้อผิดพลาด'; console.warn(e); } }
      res.push({ txt: lab(m, it), pass, yes: r.yes, no: r.no, out, abst: r.abst, votes: r.votes, need, bd: SS.board ? 1 : 0, cy: r.cy, cn: r.cn, chairTxt });
    });
    if (deferItems.length) { try { const m2 = K.mk(m.key, deferItems.map(x => Object.assign({}, x)), (window.Agm216 && Agm216.deferDay) ? Agm216.deferDay(m, deferItems) : S.day + 7, 'me'); m2.kind = m.kind; m2.scope = m.scope; } catch (e) { console.warn('defer', e); } }
    SS.res = res; m.status = 'done'; m.done = S.day; try { if (window.Agm216 && Agm216.onDone) Agm216.onDone(m, res, SS); } catch (e) { } m.res = res.map(x => ({ txt: x.txt, pass: x.pass, yes: x.yes, no: x.no, out: x.info ? (x.summary || 'รับทราบ') : x.out }));
    const s = K.st(); s.mins.unshift({ day: S.day, key: m.key, res: m.res }); if (s.mins.length > 30) s.mins.length = 30;
    Phone.msg('เลขานุการบริษัท', `ปิดประชุม ${K.nameOf(m.key)}: ผ่าน ${res.filter(r => r.pass).length}/${res.length} วาระ`, true);
  }
  const reaction = (d, lie) => lie ? '⚠️ คำตอบไม่ตรงกับงบการเงินของบริษัท ผู้ถือหุ้นจับได้ เสียความเชื่อมั่นอย่างมาก' : d >= 8 ? '😊 ผู้ถือหุ้นพอใจมาก ปรบมือ' : d >= 3 ? '🙂 ผู้ถือหุ้นพยักหน้ารับ' : d >= -2 ? '😐 ผู้ถือหุ้นรับฟังเฉยๆ' : d >= -7 ? '😟 ผู้ถือหุ้นไม่ค่อยพอใจกับคำตอบ' : '😠 ผู้ถือหุ้นไม่พอใจมาก เสียงฮือในห้องประชุม';
  const roomMood = SS => { const L = SS.att.map(h => h.ref.mood == null ? 50 : h.ref.mood); return L.length ? L.reduce((a, b) => a + b, 0) / L.length : 60; };

  // ----- screens -----
  // how long a meeting is (the player's choice): short ~6 questions, normal up to 12, long up to 16 (plus one more on four of the points)
  const meetingLen = () => { try { const v = localStorage.getItem('raisukjai_mtglen'); return v === 'short' || v === 'normal' || v === 'long' ? v : 'unlimited'; } catch (e) { return 'unlimited'; } };
  { const _m = UI.menu; if (_m) UI.menu = function () {
    const r = _m.apply(this, arguments);
    try {
      const c = UI.cur, rr = c && c.render;
      if (rr && !c.len216) {
        c.len216 = 1;
        c.render = function () {
          const html = rr.apply(this, arguments), cur = meetingLen();
          return html + `<h5>🗓️ ความยาวการประชุมบอร์ด/ผู้ถือหุ้น</h5><p class="dim" style="margin:2px 4px 6px">จำนวนคำถามต่อการประชุม โหมด "ไม่จำกัด" ผู้ถือหุ้นถามต่อได้เรื่อยๆ ในทุกวาระจนกว่าคุณจะไม่ต้องการ ยิ่งมีคนมาประชุมมาก คำถามยิ่งเพิ่ม (มาเกิน 6 คน +2 ข้อ เกิน 12 คน +4 ข้อ)</p><div class="row" style="flex-wrap:wrap;gap:6px">${[['unlimited', 'ไม่จำกัด (ถามต่อได้เรื่อยๆ)'], ['long', 'ยาว (สูงสุด 16 ข้อ)'], ['normal', 'ปกติ (12 ข้อ ห้องใหญ่ 14)'], ['short', 'สั้น (~6 ข้อ)']].map(([v, n]) => `<button class="btn ${cur === v ? '' : 'ghost'}" data-a="mtglen216" data-v="${v}">${n}</button>`).join('')}</div>`;
        };
        UI.renderBody();
      }
    } catch (e) { console.warn('v216 len', e); }
    return r;
  }; }
  UI.H.mtglen216 = d => { try { localStorage.setItem('raisukjai_mtglen', d.v); } catch (e) { } UI.renderBody(); };
  const amendHtml = it => { const a = K.AG[it.t]; if (!a || !a.opts || a.opts.length < 2) return ''; return `<p class="dim">แก้ข้อเสนอก่อนลงมติ (เปลี่ยนตัวเลือกของเรื่องนี้):</p><div class="row" style="flex-wrap:wrap">${a.opts.map((o, i) => `<button class="btn ${o.v === it.v ? '' : 'ghost'}" data-a="agm216amend" data-i="${i}">${E(o.l)}</button>`).join('')}</div>`; };
  const lobbyHtml = SS => (SS.att.length ? `<h5>🤝 คุยกับผู้เข้าประชุมก่อนเปิดประชุม (เหลือ ${3 - (SS.talks || 0)} ครั้ง)</h5><p class="dim">ขอเสียงสนับสนุนล่วงหน้า คนที่คุณคุยด้วยจะพอใจขึ้นและมีโอกาสเห็นด้วยกับข้อเสนอของคุณมากขึ้นตอนโหวด</p><div class="row" style="flex-wrap:wrap">${SS.att.map(h => `<button class="btn ghost" data-a="agm216lobby" data-n="${E(h.n)}" ${(SS.talks || 0) >= 3 ? 'disabled' : ''}>🗣️ ${E(h.n)}${SS.lobby && SS.lobby[h.n] ? ' ✓' : ''}</button>`).join('')}</div>` : '');
  const kindAGN = SS => { const A = window.Agm216; return SS.board ? A.AGN : A.AGNS; };
  const kindAgOf = (SS, t) => { const A = window.Agm216; return SS.board ? A.agOf(t) : A.agOfS(t); };
  const lab = (m, it) => { if (window.Agm216 && Agm216.labEx) { const x = Agm216.labEx(m, it); if (x) return x; } let t = K.label(m.key, it); if (it.who) t += ' → ' + (it.t === 'branch' ? ((CO_SITES[it.who] || {}).n || it.who) : it.who); if (it.pct) t += ' (' + Math.round(it.pct * 100) + '%)'; return t; };
  const head = SS => `<p class="lead">${K.iconFor(SS.k)} <b>${E(K.nameOf(SS.k))}</b> · ${SS.board ? '👔 ประชุมคณะกรรมการ' : '🏛️ ประชุมผู้ถือหุ้น'} · วันที่ ${RD(S.day)}</p>`;
  const holderTable = SS => `<table class="tbl" style="width:100%"><tr><th>${SS.board ? 'กรรมการ' : 'ผู้ถือหุ้น'}</th><th>ประเภท</th><th>${SS.board ? 'เสียง' : 'สัดส่วน'}</th><th>อารมณ์</th><th>มาประชุม</th></tr>
    <tr><td><b>คุณ</b>${SS.board && !chairX(SS).me ? '' : ' 👑'}</td><td>${SS.board ? (chairX(SS).me ? (chairX(SS).acting ? 'ทำหน้าที่ประธาน (ประธานไม่มา)' : 'ประธานกรรมการ') : 'กรรมการ') : 'เจ้าของ'}</td><td>${SS.board ? (chairX(SS).me ? CAST : '1 เสียง') : pc(SS.H.me)}</td><td>—</td><td>✅</td></tr>
    ${SS.H.list.map(h => { const isCh = SS.board && chairX(SS).h === h; return `<tr><td>${E(h.n)}${isCh ? ' 👑' : ''}</td><td>${isCh ? (chairX(SS).vice ? 'รองประธาน (ทำหน้าที่ประธาน) · ' : 'ประธานกรรมการ · ') : ''}${KIND[h.k] || '💼'}${h.ref.trait && window.Agm216.traitName ? ' · ' + Agm216.traitName(h.ref.trait) : ''}</td><td>${h.nv ? 'ไม่มีสิทธิออกเสียง' : isCh ? CAST : SS.board ? '1 เสียง' : pc(h.p)}</td><td>${face(h.ref.mood == null ? 50 : h.ref.mood)}</td><td>${SS.att.includes(h) ? '✅' : '❌'}</td></tr>`; }).join('')}</table>`;
  const CAST = 'ชี้ขาดเมื่อคะแนนเสมอ';
  const tally = r => `<p class="lead">เห็นด้วย <b>${r.cy}</b> เสียง · ไม่เห็นด้วย <b>${r.cn}</b> เสียง</p><p class="dim">${r.votes.map(v => `${v.y ? '✅' : '❌'} ${E(v.n)}`).join(' · ') || 'ไม่มีกรรมการคนอื่นลงคะแนน'}</p>`;
  const agHtml = (SS, n) => {
    const A = window.Agm216, G = kindAGN(SS), g = G[n], items = SS.m.items.filter(it => !isInfo(it) && kindAgOf(SS, it.t) === n), last = n === Object.keys(G).length;
    const prog = Object.keys(G).map(k => `<span style="opacity:${+k === n ? 1 : .45}">${k}</span>`).join(' · ');
    const panel = SS.board ? (A.boardInfo ? A.boardInfo(n, SS) : '') : (A.agmInfo ? A.agmInfo(n, SS) : '');
    return head(SS) + `<p class="dim">วาระที่ ${n} จาก ${Object.keys(G).length}</p><h5>วาระที่ ${n}: ${E(g.n)}</h5><p class="dim">เพื่อ${E(g.k)}${g.d ? ' · ในเกม: ' + E(g.d) : ''}</p>${panel}
      ${items.length ? `<div class="card"><div class="cb"><h4>🗳️ เรื่องที่ขอมติในวาระนี้</h4><ul class="lead">${items.map(it => `<li>${E(lab(SS.m, it))}</li>`).join('')}</ul></div></div>` : ''}
      <div class="row end"><button class="btn" data-a="agm216step">${last ? 'ปิดการประชุม / สรุปมติ ▶' : 'ดำเนินการต่อ ▶'}</button><button class="btn ghost" data-a="agm216quit">ออกจากห้อง (ประชุมยังไม่ปิด)</button></div>`;
  };
  function screen() {
    const SS = SES; if (!SS) return '<p class="empty">ไม่มีการประชุม</p>';
    const m = SS.m; let ph = SS.ph;
    if (ph === 'script') {
      const st = SS.script[SS.si];
      if (!st) { SS.ph = ph = 'result'; }
      else if (st.k === 'ag') return agHtml(SS, st.n);
      else if (st.k === 'q') { SS.qi = st.qi; ph = 'qa'; } else { SS.vi = st.vi; ph = 'vote'; }
    }
    if (!SS.quorum) return head(SS) + `<h5>❌ ไม่ครบองค์ประชุม</h5><p class="lead">${SS.board ? `กรรมการมาประชุม ${pc(SS.attP)} ของทั้งคณะ น้อยกว่ากึ่งหนึ่ง` : `มีหุ้นอยู่ในห้องประชุม ${pc(SS.attP)} น้อยกว่า 25% ที่กฎหมายกำหนด`} ต้องเลื่อนประชุม</p>${holderTable(SS)}<div class="row end"><button class="btn" data-a="agm216quit">รับทราบ ยกเลิกการประชุม</button></div>`;
    if (SS.ph === 'open') return head(SS) + `<h5>📋 ลงทะเบียนและองค์ประชุม</h5><p class="lead">${SS.board ? `กรรมการมา ${SS.att.length + 1} คน จากทั้งหมด ${SS.H.list.length + 1} คน (ต้องเกินกึ่งหนึ่ง)` : `หุ้นที่อยู่ในห้องประชุม <b>${pc(SS.attP)}</b> (ต้องไม่ต่ำกว่า 25%) · ผู้ถือหุ้นที่มา ${SS.att.length + 1} ราย`} ✅ ครบองค์ประชุม</p>${holderTable(SS)}
      <h5>🗒️ วาระการประชุม</h5>${kindAGN(SS) ? `<ol class="lead">${Object.entries(kindAGN(SS)).map(([k, g]) => `<li>${E(g.n)} <span class="dim">(${E(g.k)})</span></li>`).join('')}</ol><p class="dim">เรื่องที่ขอมติครั้งนี้:</p>` : ''}<ol class="lead">${m.items.map(it => `<li>${E(lab(m, it))}${isInfo(it) ? ' <span class="dim">(เพื่อทราบ)</span>' : ''}${SPECIAL[it.t] && !SS.board ? ' <span class="dim">(มติพิเศษ ต้อง ¾)</span>' : ''}</li>`).join('')}</ol>${m.items.some(isInfo) ? `<div class="card"><div class="cb"><h4>📄 เรื่องแจ้งเพื่อทราบ</h4><ul class="lead">${m.items.filter(isInfo).map(it => `<li>${E(lab(m, it))}: ${E((window.Agm216 && Agm216.infoEx) ? Agm216.infoEx(m, it, SS.f) : '')}</li>`).join('')}</ul></div></div>` : ''}
      <p class="dim">ห้องประชุมนี้มีผู้เข้าร่วม ${SS.att.length + 1} คน · ${SS.cap > 99 ? 'คำถามไม่จำกัดจำนวน (ผู้ถือหุ้นขอถามเพิ่มในแต่ละวาระได้เรื่อยๆ)' : 'จะมีคำถามไม่เกิน ' + SS.cap + ' ข้อ'} (ตั้งความยาวการประชุมได้ในเมนูตั้งค่า)</p><p class="dim">${SS.board ? `ก่อนลงมติ กรรมการจะซักถามเรื่องการบริหารงาน กรรมการลงมติคนละ 1 เสียง ผู้บริหารที่ไม่ได้เป็นกรรมการไม่มีสิทธิออกเสียง ประธาน (${E(chairName(SS))}) ไม่ลงคะแนน เว้นแต่คะแนนเสมอกันจึงออกเสียงชี้ขาด` :'ก่อนลงมติ ผู้ถือหุ้นอาจซักถามฝ่ายบริหาร'} คำตอบของคุณมีผลต่ออารมณ์และการลงคะแนน อย่าตอบเกินความจริง เพราะเทียบกับงบการเงินจริงได้</p>
      ${lobbyHtml(SS)}<div class="row end"><button class="btn" data-a="agm216go">🎙️ เปิดประชุม</button><button class="btn ghost" data-a="agm216quit">ออกจากห้อง (ประชุมยังไม่ปิด)</button></div>`;
    if (ph === 'qa') {
      const x = SS.qs[SS.qi], h = x.by, md = h.ref.mood == null ? 50 : h.ref.mood;
      const txt = typeof x.q.text === 'function' ? x.q.text(SS.f) : x.q.text;
      return head(SS) + `<p class="dim">${SS.script && SS.script[SS.si] ? 'วาระที่ ' + SS.script[SS.si].n + ' ' + kindAGN(SS)[SS.script[SS.si].n].n : 'ซักถาม'} · คำถามที่ ${SS.qi + 1}/${SS.qs.length} · บรรยากาศในห้อง ${face(roomMood(SS))}</p>
        <div class="card"><div class="ci">${face(md)}</div><div class="cb"><h4>${E(h.n)}</h4><p class="dim">${KIND[h.k] || ''}${h.ref.trait && window.Agm216.traitName ? ' · ' + Agm216.traitName(h.ref.trait) : ''} · ${SS.board ? 'กรรมการ' : 'ถือหุ้น ' + pc(h.p)} · อารมณ์ ${md >= 50 ? 'ค่อนข้างพอใจ' : 'ไม่ค่อยพอใจ'}</p><p class="lead">🗣️ “${E(txt)}”</p></div></div>
        ${SS.ans == null ? `<h5>คุณจะตอบว่าอย่างไร?</h5><div style="display:flex;flex-direction:column;gap:8px">${x.q.o.map((o, i) => `<button class="btn ghost" style="text-align:left;white-space:normal" data-a="agm216ans" data-i="${i}">${'ก ข ค ง'.split(' ')[i]}. ${E(o[0])}</button>`).join('')}</div>`
          : `<div class="card"><div class="cb"><p class="lead">คุณตอบ: “${E(x.q.o[SS.ans.i][0])}”</p>${SS.ans.reply ? '<p class="lead">🗣️ ' + E(SS.ans.reply) + '</p>' : ''}<p class="${SS.ans.d >= 0 && !SS.ans.lie ? 'good' : 'bad'}">${reaction(SS.ans.d, SS.ans.lie)} (${E(h.n)} ${SS.ans.d >= 0 ? '+' : ''}${Math.round(SS.ans.d)})</p></div></div><div class="row end"><button class="btn" data-a="agm216next">${SS.qi + 1 < SS.qs.length ? 'คำถามถัดไป ▶' : 'ไปที่การลงมติ ▶'}</button>${SS.len === 'unlimited' && ((SS.spare || {})[x.ag] || []).length ? `<button class="btn ghost" data-a="agm216more">🙋 ผู้ถือหุ้นขอถามเพิ่มในวาระนี้ (เหลือคำถาม ${((SS.spare || {})[x.ag] || []).length} ข้อ)</button>` : ''}</div>`}`;
    }
    if (ph === 'vote') {
      const it = m.items[SS.vi], need = SPECIAL[it.t] ? '¾ ของคะแนนเสียงที่ลงมติ (มติพิเศษ)' : 'มากกว่ากึ่งหนึ่งของคะแนนเสียงที่ลงมติ (มติธรรมดา)', md = roomMood(SS);
      if (SS.board && chairX(SS).me) {   // you chair the meeting: the directors vote first, you only decide a tie
        const ttl = `<h5>🗳️ ลงมติ ${SS.script && SS.script[SS.si] ? 'วาระที่ ' + SS.script[SS.si].n : 'วาระที่ ' + (SS.vi + 1) + '/' + m.items.length}</h5><p class="lead"><b>${E(lab(m, it))}</b></p>`, r = SS.pre && SS.pre[SS.vi];
        if (!r) return head(SS) + ttl + `<p class="dim">เกณฑ์ผ่าน: เสียงข้างมากของกรรมการที่ลงคะแนน (คนละ 1 เสียง) · คุณเป็นประธาน${chairX(SS).acting ? ' (ทำหน้าที่แทนประธานที่ไม่มา)' : ''} จึงไม่ลงคะแนน เว้นแต่คะแนนเสมอกัน · บรรยากาศในห้อง ${face(md)}</p>
          <div class="row"><button class="btn" data-a="agm216call">🗳️ ขอให้กรรมการลงมติ</button></div>
          ${amendHtml(it)}<div class="row"><button class="btn ghost" data-a="agm216defer">⏸️ เลื่อนมติเรื่องนี้ไปพิจารณาในการประชุมครั้งถัดไป (7 วัน)</button></div>`;
        return head(SS) + ttl + `<div class="card"><div class="cb"><h4>ผลการลงคะแนนของกรรมการ</h4>${tally(r)}</div></div>` + (isTie(r)
          ? `<h5>⚖️ คะแนนเสมอกัน ${r.cy} ต่อ ${r.cn} — ประธานต้องออกเสียงชี้ขาด</h5><div class="row"><button class="btn" data-a="agm216vote" data-y="1">✅ ชี้ขาด: เห็นด้วย</button><button class="btn danger" data-a="agm216vote" data-y="0">❌ ชี้ขาด: ไม่เห็นด้วย</button></div>`
          : `<p class="${r.yes > r.no ? 'good' : 'bad'}">${r.yes > r.no ? '✅ มติผ่าน' : '❌ มติไม่ผ่าน'} ด้วยเสียงข้างมาก · ประธานไม่ต้องออกเสียง</p><div class="row end"><button class="btn" data-a="agm216vote" data-y="-">ดำเนินการต่อ ▶</button></div>`);
      }
      return head(SS) + `<h5>🗳️ ลงมติ ${SS.script && SS.script[SS.si] ? 'วาระที่ ' + SS.script[SS.si].n : 'วาระที่ ' + (SS.vi + 1) + '/' + m.items.length}</h5><p class="lead"><b>${E(lab(m, it))}</b></p><p class="dim">เกณฑ์ผ่าน: ${SS.board ? `เสียงข้างมากของกรรมการ (คนละ 1 เสียง) · ${chairX(SS).vice ? 'รองประธาน' : 'ประธาน'} (${E(chairName(SS))}) ไม่ลงคะแนน เว้นแต่คะแนนเสมอจึงชี้ขาด` : need} · ${SS.board ? 'คุณลงคะแนนในฐานะกรรมการ' : 'คุณถือ ' + pc(SS.H.me)} · บรรยากาศในห้อง ${face(md)} ${md >= 60 ? 'ผู้ถือหุ้นส่วนใหญ่พอใจ' : md >= 45 ? 'ผู้ถือหุ้นแบ่งเป็นสองฝ่าย' : 'ผู้ถือหุ้นหลายรายไม่พอใจ'}</p>
        <div class="row"><button class="btn" data-a="agm216vote" data-y="1">✅ เห็นด้วย</button><button class="btn danger" data-a="agm216vote" data-y="0">❌ ไม่เห็นด้วย</button><button class="btn ghost" data-a="agm216vote" data-y="-">➖ งดออกเสียง</button></div>
        ${amendHtml(it)}<div class="row"><button class="btn ghost" data-a="agm216defer">⏸️ เลื่อนมติเรื่องนี้ไปพิจารณาในการประชุมครั้งถัดไป (7 วัน)</button></div>`;
    }
    finish(SS);
    const bar = (y, n) => { const t = y + n || 1; return `<div style="height:10px;background:rgba(255,255,255,.15);border-radius:6px;overflow:hidden;margin:4px 0"><i style="display:block;height:100%;width:${Math.round(y / t * 100)}%;background:var(--leaf,#7ccf5a)"></i></div>`; };
    return head(SS) + `<h5>📜 ผลการลงมติ</h5>` + SS.res.map(r => r.info ? `<div class="card"><div class="cb"><h4>📄 รับทราบ — ${E(r.txt)}</h4><p class="dim">${E(r.summary || '')}</p></div></div>` : `<div class="card"><div class="cb"><h4>${r.defer ? '⏸️ เลื่อนไปนัดหน้า' : r.pass ? '✅ ผ่าน' : '❌ ไม่ผ่าน'} — ${E(r.txt)}</h4>${bar(r.yes, r.no)}<p class="dim">${r.bd ? `กรรมการเห็นด้วย ${r.cy} เสียง · ไม่เห็นด้วย ${r.cn} เสียง${r.abst ? ' · คุณงดออกเสียง' : ''} · เกณฑ์ เสียงข้างมาก` : `เห็นด้วย ${pc(r.yes)} · ไม่เห็นด้วย ${pc(r.no)}${r.abst ? ' · งดออกเสียง ' + pc(r.abst) : ''} · เกณฑ์ ${r.need === .75 ? '¾' : '>½'}`}</p>
      <p class="dim">${r.votes.map(v => `${v.y ? '✅' : '❌'} ${E(v.n)}${r.bd ? '' : ` (${pc(v.p)})`}`).join(' · ') || (r.bd ? 'ไม่มีกรรมการคนอื่นลงคะแนน' : 'มีเพียงคุณลงคะแนน')}</p>${r.chairTxt ? `<p class="dim">${E(r.chairTxt)}</p>` : ''}${r.note ? `<p class="dim">📊 ${E(r.note)}</p>` : ''}${r.out ? `<p class="good">${E(r.out)}</p>` : ''}</div></div>`).join('') +
      `<p class="dim">บันทึกลงรายงานการประชุมแล้ว อารมณ์ผู้ถือหุ้นที่เปลี่ยนไปมีผลกับการประชุมครั้งถัดไป</p><div class="row end"><button class="btn" data-a="agm216quit">ปิดประชุม</button></div>`;
  }
  function begin(id) {
    const m = K.st().mt.find(x => x.id == id); if (!m || m.status !== 'due') return;
    if (m.key.startsWith('co:')) { const c0 = Company.get(+m.key.slice(3)); if (!c0 || !['setup', 'open'].includes(c0.st)) { m.status = 'cancel'; m.note = 'บริษัทเลิกกิจการแล้ว'; try { UI.toast('บริษัทนี้เลิกกิจการแล้ว ยกเลิกการประชุม', '🏛️'); } catch (e) { } return; } }
    if (m.kind === 'agm' && m.key.startsWith('co:') && window.Agm216 && Agm216.agmOK) { const cc = Company.get(+m.key.slice(3)); if (cc && !Agm216.agmOK(cc)) { try { UI.toast('ประชุมสามัญผู้ถือหุ้นจัดได้เฉพาะบริษัทมหาชนจำกัด', '🏛️'); } catch (e) { } return; } }
    if (m.kind === 'board' && m.key.startsWith('co:') && window.Agm216 && Agm216.boardOK) { const cc = Company.get(+m.key.slice(3)); if (cc && !Agm216.boardOK(cc)) { try { UI.toast(Agm216.boardBlockMsg(cc), '👔'); } catch (e) { } return; } }
    startSession(m); if (SES && !SES.quorum) { m.status = 'cancel'; m.note = 'ไม่ครบองค์ประชุม'; m.done = S.day; Phone.msg('เลขานุการบริษัท', `ประชุม ${K.nameOf(m.key)} ไม่ครบองค์ประชุม ต้องนัดใหม่`, true); }
    UI.open(SES && SES.board ? '👔 ห้องประชุมคณะกรรมการ' : '🏛️ ห้องประชุมผู้ถือหุ้น', null, screen, { wide: true });
  }
  Object.assign(UI.H, {
    bdclose: d => { UI.close(); setTimeout(() => begin(d.v), 0); },
    agm216step: () => { const SS = SES; if (SS) SS.si++; },
    agm216amend: d => { const SS = SES; if (!SS || !SS.script) return; const st = SS.script[SS.si]; if (!st || st.k !== 'v') return; const it = SS.m.items[st.vi], a = K.AG[it.t], o = a && a.opts && a.opts[+d.i]; if (o) { it.v = o.v; try { UI.toast('แก้ข้อเสนอกลางประชุม: ' + o.l, '✏️'); } catch (e) { } } },
    agm216more: () => {
      const SS = SES; if (!SS || SS.ans == null) return; const x = SS.qs[SS.qi], sp = (SS.spare || {})[x.ag] || [], q = sp.shift(); if (!q) { UI.toast('ไม่มีคำถามเหลือในวาระนี้แล้ว', '🙋'); return; }
      const by = SS.askerFn ? SS.askerFn(x.ag) : x.by; SS.qs.splice(SS.qi + 1, 0, { q: wrapQ(q, 'ขอถามเพิ่ม: '), by: by || x.by, ag: x.ag, follow: 1 }); rebuildScript(SS); SS.ans = null; SS.si++;
    },
    agm216defer: () => { const SS = SES; if (!SS || !SS.script) return; const st = SS.script[SS.si]; if (!st || st.k !== 'v') return; (SS.deferSet = SS.deferSet || new Set()).add(st.vi); SS.choice[st.vi] = null; SS.si++; },
    agm216lobby: d => { const SS = SES; if (!SS) return; if ((SS.talks || 0) >= 3) { UI.toast('คุยได้ไม่เกิน 3 ครั้งก่อนเปิดประชุม', '🤝'); return; } const h = SS.att.find(x => x.n === d.n); if (!h) return; SS.talks = (SS.talks || 0) + 1; SS.lobby = SS.lobby || {}; SS.lobby[h.n] = (SS.lobby[h.n] || 0) + 1; h.ref.mood = clamp((h.ref.mood == null ? 50 : h.ref.mood) + 5, 5, 98); UI.toast('คุยกับ ' + h.n + ' แล้ว เขาพอใจขึ้น', '🤝'); },
    agm216go: () => { const SS = SES; if (!SS) return; if (SS.script) { SS.ph = 'script'; SS.si = 0; return; } if (SS.qs.length) { SS.ph = 'qa'; SS.qi = 0; SS.ans = null; } else toVote(SS); },
    agm216ans: d => {
      const SS = SES; if (!SS || SS.ans != null) return; const x = SS.qs[SS.qi], o = x.q.o[+d.i], h = x.by;
      const okF = o[2], lie = okF ? !okF(SS.f) : false, dl = lie ? -12 : o[1];
      // the asker feels it fully, everybody else a little
      h.ref.mood = clamp((h.ref.mood == null ? 50 : h.ref.mood) + dl, 5, 98);
      for (const y of SS.att) if (y !== h) y.ref.mood = clamp((y.ref.mood == null ? 50 : y.ref.mood) + dl * 0.3, 5, 98);
      if (SS.f.co && SS.f.c) SS.f.c.rep = clamp((SS.f.c.rep == null ? 50 : SS.f.c.rep) + (lie ? -2 : dl >= 6 ? 1 : 0), 0, 100);
      SS.ans = { i: +d.i, d: dl, lie };
      try { if (window.Agm216 && Agm216.replyEx) Agm216.replyEx(SS, x, o, dl, lie); } catch (e) { console.warn('reply', e); }
      // item 2: after two poor answers in a row the same person asks again (at most twice per meeting)
      SS.streak = (lie || dl <= -6) ? (SS.streak || 0) + 1 : 0;
      if (SS.streak >= 2 && (SS.pressed || 0) < (SS.len === 'unlimited' ? 6 : 2)) { const sp = (SS.spare || {})[x.ag] || [], x3 = sp.shift(); if (x3) { SS.pressed = (SS.pressed || 0) + 1; SS.streak = 0; SS.qs.splice(SS.qi + 1, 0, { q: wrapQ(x3, 'ผู้ถามไม่พอใจกับคำตอบก่อนหน้า จึงถามย้ำ: '), by: h, ag: x.ag, follow: 1 }); rebuildScript(SS); } }
      try { const tx = typeof x.q.text === 'function' ? x.q.text(SS.f) : x.q.text; SS.log.push({ n: h.n, k: h.k, ag: SS.script && SS.script[SS.si] ? SS.script[SS.si].n : 0, id: x.q.id, q: tx, a: o[0], d: dl, lie }); if (o[4] && window.Agm216 && Agm216.promiseAdd) Agm216.promiseAdd(SS, h, o[4]); } catch (e) { console.warn('log', e); }
    },
    agm216next: () => { const SS = SES; if (!SS) return; SS.ans = null; if (SS.script) { SS.si++; return; } if (SS.qi + 1 < SS.qs.length) SS.qi++; else toVote(SS); },
    agm216call: () => { const SS = SES; if (!SS || !SS.board || !chairX(SS).me) return; SS.pre = SS.pre || {}; if (!SS.pre[SS.vi]) SS.pre[SS.vi] = mkVote(SS, Object.assign({ i: SS.vi }, SS.m.items[SS.vi])); },
    agm216vote: d => { const SS = SES; if (!SS) return; SS.choice[SS.vi] = d.y === '1' ? 1 : d.y === '0' ? 0 : null; if (SS.script) { SS.si++; return; } const n = nextVi(SS, SS.vi + 1); if (n >= 0) SS.vi = n; else SS.ph = 'result'; },
    agm216quit: () => { UI.close(); SES = null; },
    agm216place: d => { const c = Company.get(+d.v); if (c) place(c, +d.k); },
  });
  // the meeting list: the button now enters the room, the old inline vote buttons go away
  { const _o = Equity.open.bind(Equity); Equity.open = function (t) { const r = _o(t); try { const c = UI.cur, rr = c && c.render; if (rr && !c.agm216) { c.agm216 = 1; c.render = x => rr(x).replace(/<button[^>]*data-a="bdvote"[^>]*>[^<]*<\/button>/g, '').replace('ปิดประชุมและนับมติ', '🎙️ เข้าห้องประชุม'); UI.renderBody(); } } catch (e) { console.warn('v216 open', e); } return r; }; }

  // ----- the register and the placement in the company window -----
  const regHtml = c => {
    const R = reg(c), mine = c.mine == null ? 1 : c.mine, val = valueOf(c);
    const rows = `<tr><td><b>คุณ</b> 👑</td><td>เจ้าของ</td><td>${pc(mine)}</td><td>—</td></tr>` + R.map(h => `<tr><td>${E(h.n)}${h.prof ? `<br><span class="dim">${E(h.prof)}</span>` : ''}</td><td>${KIND[h.k] || ''}${h.serving ? ' · ประจำการ (ไม่เป็นกรรมการ)' : ''}</td><td>${pc(h.p)}</td><td>${face(h.mood == null ? 50 : h.mood)}</td></tr>`).join('');
    const opts = c.listed ? '<p class="dim">บริษัทจดทะเบียนในตลาดหลักทรัพย์แล้ว ผู้ถือหุ้นส่วนที่เหลือคือกองทุนและรายย่อย</p>' : [0.1, 0.2, 0.3].map(X => { const raise = Math.round(val * X / (1 - X) * 0.9), ok = mine * (1 - X) >= 0.2; return `<button class="btn ghost" data-a="agm216place" data-v="${c.id}" data-k="${X}" ${ok ? '' : 'disabled'}>ขายหุ้นใหม่ ${X * 100}% → เงินเข้าบริษัท ${baht0(raise)}</button>`; }).join('');
    return `<h5>👥 ทะเบียนผู้ถือหุ้น</h5><table class="tbl" style="width:100%"><tr><th>ผู้ถือหุ้น</th><th>ประเภท</th><th>สัดส่วน</th><th>อารมณ์</th></tr>${rows}</table>
      <p class="dim">มูลค่ากิจการประเมิน ${baht0(Math.round(val))} · ผู้ถือหุ้นมากขึ้นคือเงินทุนเข้าบริษัทแต่สัดส่วนและเงินปันผลของคุณลดลง (ห้ามเหลือต่ำกว่า 20%) ผู้ถือหุ้นแต่ละรายมีสิทธิ์โหวดและถามในที่ประชุม</p><div class="row" style="flex-wrap:wrap">${opts}</div>`;
  };
  { const _h = Company.html.bind(Company); Company.html = function (t) {
    let s = _h(t); if (t === 1 || t === 3) return s; const c = Company.get(Company.sel); if (!c || !open(c)) return s;
    const key = '<h5>🗓️ ประชุมบอร์ด / ผู้ถือหุ้น</h5>';
    return s.includes(key) ? s.replace(key, regHtml(c) + key) : s;
  }; }
  window.Agm216 = { Q, reg, holders, facts, rebuild: rebuildScript, place, startSession: m => startSession(m), get session() { return SES; }, grpOf, chairOf: SS => chairX(SS), screen: () => screen(), finishNow: () => { if (SES) finish(SES); return SES && SES.res; } };
});
