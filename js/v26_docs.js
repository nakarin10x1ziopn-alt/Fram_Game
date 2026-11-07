'use strict';
// ---------- v26_docs: the paperwork people really file in Thailand that v24_gov did not cover. 18 applications (birth certificate,
// marriage, divorce, name change, medical certificate, visa, trade registration, tax refund, title-deed copy, public-driver licence,
// alcohol / food-production / hotel / factory licences, pet registration, scholarship, farmer aid, compulsory car insurance), each with
// required papers, a fee, processing days and a re-check on the decision day. Documents go into the same Gov24 wallet ----------
V23.add('v26_docs', () => {
  if (typeof Gov24 === 'undefined' || typeof Phone === 'undefined') return;
  const YD = typeof YEAR_DAYS !== 'undefined' ? YEAR_DAYS : 84;
  const gst = () => Gov24.st();
  const st = () => { const x = S.v26d = S.v26d || {}; x.apps = x.apps || []; x.done = x.done || {}; x.n = x.n || 0; x.pay = x.pay || {}; x.flags = x.flags || {}; return x; };
  const has = id => Gov24.has(id);
  const msg = (from, t) => { try { Phone.msg(from, t); } catch (e) { } };
  const D = Gov24.docs;

  // ---- new document types, same shape as Gov24's registry (n, i, life, off) ----
  const NEWDOCS = {
    birthcert: { n: 'สูติบัตร (ใบเกิดบุตร)', i: '👶', life: 0, off: 'district' },
    marriage: { n: 'ทะเบียนสมรส (คู่สมรส)', i: '💍', life: 0, off: 'district' },
    medcert: { n: 'ใบรับรองแพทย์', i: '🩺', life: 7, off: 'health' },
    visa: { n: 'วีซ่าท่องเที่ยว', i: '🛂', life: YD, off: 'passport' },
    commreg: { n: 'ทะเบียนพาณิชย์', i: '🛒', life: 0, off: 'dbd' },
    deedcopy: { n: 'สำเนาโฉนดที่ดิน (รับรอง)', i: '📜', life: 28, off: 'land' },
    pslicense: { n: 'ใบอนุญาตขับรถสาธารณะ (ท.1)', i: '🚕', life: 5 * YD, off: 'dlt' },
    alcohol: { n: 'ใบอนุญาตจำหน่ายสุรา', i: '🍶', life: 3 * YD, off: 'revenue' },
    foodprod: { n: 'ใบอนุญาตผลิตอาหาร (อย.)', i: '🥫', life: 2 * YD, off: 'health' },
    hotel: { n: 'ใบอนุญาตประกอบกิจการที่พัก', i: '🏨', life: 5 * YD, off: 'municipal' },
    factory: { n: 'ใบอนุญาตตั้งโรงงาน (รง.4)', i: '🏭', life: 5 * YD, off: 'municipal' },
    petreg: { n: 'ทะเบียนสัตว์เลี้ยง (ไมโครชิป)', i: '🐕', life: 0, off: 'livestock' },
    compins: { n: 'พ.ร.บ.รถยนต์ (ประกันภาคบังคับ)', i: '🚘', life: YD, off: 'dlt' },
    farmaid: { n: 'สิทธิเงินช่วยเหลือเกษตรกร', i: '🌾', life: YD, off: 'agri' },
  };
  for (const k in NEWDOCS) if (!D[k]) D[k] = NEWDOCS[k];
  const docN = k => k === 'driving' ? 'ใบอนุญาตขับขี่' : (D[k] || {}).n || k;
  const docI = k => k === 'driving' ? '🪪' : (D[k] || {}).i || '📄';

  const rel = () => (S.rel || {});
  const kids = () => rel().kids || [];
  const owns = () => { let n = 0; try { n += Object.keys((S.est && S.est.own) || {}).length; } catch (e) { } try { n += Object.keys((S.hb && S.hb.lots) || {}).length; } catch (e) { } return n; };
  const hasPet = () => !!S.pet || (S.pets && S.pets.length > 0);
  const regCar = () => (S.cars || []).some(c => c.reg);
  const bal = () => S.money + (typeof Bank2 !== 'undefined' && Bank2.st ? ((Bank2.st() || {}).saving || 0) : 0);
  const yearOk = k => { const t = st().done[k]; return !t || S.day - t >= YD; };
  const $v = id => { const e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };

  // ================= the applications =================
  // k: id · doc: wallet document granted (null = a benefit / change, no paper) · req: documents that must be live · fee · days (0 = same day)
  // office: shown as the issuing agency · where: how to reach it · pre(): extra condition → null or the reason · eff(app): what happens on approval
  const APPS26 = [
    { k: 'birth', n: 'แจ้งเกิด / ขอสูติบัตรบุตร', i: '👶', doc: 'birthcert', req: ['idcard', 'housereg'], fee: 0, days: 1, office: 'ที่ว่าการอำเภอ (ทะเบียนราษฎร)', info: 'แจ้งเกิดภายใน 15 วัน นับแต่คลอด ต้องมีบุตรในครอบครัว',
      pre: () => kids().length ? null : 'ยังไม่มีบุตร (บุตรเกิดจากระบบครอบครัวก่อน)', eff: () => { const d = gst().docs.birthcert; if (d) d.data = { kids: kids().map(k => k.name) }; } },
    { k: 'marry', n: 'จดทะเบียนสมรส', i: '💍', doc: 'marriage', req: ['idcard', 'housereg'], fee: 50, days: 0, office: 'ที่ว่าการอำเภอ (ทะเบียนราษฎร)', info: 'ต้องมีคู่หมั้น/คู่สมรสในเกม ทั้งสองฝ่ายบรรลุนิติภาวะ ค่าธรรมเนียม 50 ฿',
      pre: () => rel().partner ? (has('marriage') ? 'จดทะเบียนสมรสไว้แล้ว' : null) : 'ยังไม่มีคู่รัก/คู่หมั้น', eff: () => { const d = gst().docs.marriage; if (d) d.data = { spouse: rel().partner }; S.mood = Math.min(100, (S.mood || 50) + 8); } },
    { k: 'divorce', n: 'จดทะเบียนหย่า', i: '📑', doc: null, req: ['idcard', 'marriage'], fee: 50, days: 3, office: 'ที่ว่าการอำเภอ (ทะเบียนราษฎร)', info: 'ต้องมีทะเบียนสมรส หย่าโดยความยินยอม ใช้เวลาตรวจสอบ 3 วัน', pre: () => null,
      eff: () => { delete gst().docs.marriage; S.mood = Math.max(0, (S.mood || 50) - 15); msg('ที่ว่าการอำเภอสุขใจ', 'จดทะเบียนหย่าเรียบร้อย ทะเบียนสมรสถูกยกเลิก'); } },
    { k: 'rename', n: 'เปลี่ยนชื่อ-สกุล', i: '✍️', doc: null, req: ['idcard', 'housereg'], fee: 500, days: 5, office: 'ที่ว่าการอำเภอ (ทะเบียนราษฎร)', info: 'พิมพ์ชื่อใหม่ (ไทย) ในช่องก่อนกดยื่น ชื่อต้อง 2-30 ตัวอักษร ไม่ซ้ำชื่อเดิม', input: 'ชื่อใหม่ (ไทย) เช่น สมศักดิ์',
      pre: () => null, check: a => { const n = (a.data || {}).name || ''; return n.length >= 2 && n.length <= 30 ? null : 'ชื่อใหม่ไม่ถูกต้อง'; },
      eff: a => { const nm = a.data.name, id = gst().docs.idcard; if (id && id.data && id.data.th) id.data.th.first = nm; const p = (S.name || '').split(/\s+/); S.name = nm + (p[1] ? ' ' + p.slice(1).join(' ') : ''); msg('ที่ว่าการอำเภอสุขใจ', `เปลี่ยนชื่อเป็น "${nm}" แล้ว บัตรประชาชนอัปเดตข้อมูลให้`); } },
    { k: 'med', n: 'ขอใบรับรองแพทย์', i: '🩺', doc: 'medcert', req: ['idcard'], fee: 200, days: 0, office: 'คลินิก / โรงพยาบาล', info: 'ใช้สมัครงานรัฐ สอบใบขับขี่ ซื้อประกันชีวิต/สุขภาพ ตรวจร่างกาย ~30 นาที มีอายุ 28 วัน',
      pre: () => null, eff: () => { tick(30); } },
    { k: 'visa', n: 'ขอวีซ่า (เดินทางต่างประเทศ)', i: '🛂', doc: 'visa', req: ['idcard', 'passport', 'medcert'], fee: 2000, days: 5, office: 'สถานทูต / ศูนย์รับยื่นวีซ่า', info: 'ต้องมีพาสปอร์ต ใบรับรองแพทย์ และเงินสด+เงินฝาก ≥ 30,000 ฿ เป็นหลักฐานทางการเงิน',
      pre: () => bal() >= 30000 ? null : 'หลักฐานการเงินไม่พอ (ต้องมี ≥ 30,000 ฿)', check: () => bal() >= 30000 ? null : 'หลักฐานการเงินไม่ผ่าน' },
    { k: 'comm', n: 'จดทะเบียนพาณิชย์ (ร้านค้า/ขายออนไลน์)', i: '🛒', doc: 'commreg', req: ['idcard', 'housereg'], fee: 50, days: 1, office: 'กรมพัฒนาธุรกิจการค้า (DBD)', info: 'จดภายใน 30 วันหลังเริ่มค้าขาย ค่าธรรมเนียม 50 ฿ ปลดล็อกใบอนุญาตจำหน่ายสุราและผลิตอาหาร', pre: () => null },
    { k: 'taxrefund', n: 'ขอคืนภาษีเงินได้บุคคลธรรมดา', i: '💸', doc: null, req: ['idcard', 'taxcert'], fee: 0, days: 10, office: 'สรรพากรพื้นที่', info: 'ขอได้ปีละครั้ง ต้องมีหนังสือรับรองรายได้/การเสียภาษี ได้คืน ~1.5% ของรายได้สะสม (สูงสุด 15,000 ฿) และมีสิทธิประกันสังคม/เกษตรกรเป็นเอกสารประกอบ',
      pre: () => yearOk('taxrefund') ? ((has('ssoreg') || has('farmer')) ? null : 'ต้องมีใบประกันสังคมหรือทะเบียนเกษตรกรเป็นหลักฐานลดหย่อน') : 'ขอได้ปีละครั้ง', check: () => (has('ssoreg') || has('farmer')) ? null : 'หลักฐานลดหย่อนหมดอายุ',
      eff: () => { const amt = Math.min(15000, Math.max(300, Math.round(((S.stats && S.stats.earned) || 0) * 0.015))); earn(amt); try { Bank2.income('คืนภาษีเงินได้', amt); } catch (e) { } st().done.taxrefund = S.day; msg('สรรพากรพื้นที่สุขใจ', `โอนเงินคืนภาษี ${baht(amt)} เข้าบัญชีแล้ว`); } },
    { k: 'deed', n: 'ขอสำเนาโฉนดที่ดิน (รับรอง)', i: '📜', doc: 'deedcopy', req: ['idcard', 'housereg'], fee: 100, days: 1, office: 'สำนักงานที่ดิน', info: 'ต้องเป็นเจ้าของที่ดินหรืออสังหาริมทรัพย์ในเกม ใช้ประกอบการกู้ยืมวงเงินสูงและทำนิติกรรม',
      pre: () => owns() ? null : 'ไม่มีที่ดิน/อสังหาฯ ในชื่อคุณ', check: () => owns() ? null : 'ไม่พบกรรมสิทธิ์ในชื่อผู้ยื่น' },
    { k: 'ps', n: 'ใบอนุญาตขับรถสาธารณะ (ท.1)', i: '🚕', doc: 'pslicense', req: ['idcard', 'driving', 'crimrec', 'medcert'], fee: 300, days: 2, office: 'ขนส่งจังหวัด', info: 'ต้องมีใบขับขี่ ใบรับรองความประพฤติ และใบรับรองแพทย์ — ใช้วิ่งแท็กซี่รับจ้างได้ (ในแอปนี้)', pre: () => null },
    { k: 'alc', n: 'ขอใบอนุญาตจำหน่ายสุรา', i: '🍶', doc: 'alcohol', req: ['idcard', 'commreg', 'taxcert'], fee: 1000, days: 7, office: 'สรรพสามิตพื้นที่', info: 'ต้องจดทะเบียนพาณิชย์ มีหนังสือรับรองภาษี ค่าธรรมเนียม 1,000 ฿ ได้กำไรจากการขายราว 2,200 ฿ ทุก 28 วัน', pre: () => null, pay: { every: 28, amt: 2200, what: 'กำไรจำหน่ายสุรา' } },
    { k: 'food', n: 'ขออนุญาตผลิตอาหาร (อย.)', i: '🥫', doc: 'foodprod', req: ['idcard', 'commreg', 'foodsan', 'farmer'], fee: 1500, days: 10, office: 'สาธารณสุขจังหวัด (อย.)', info: 'ต้องมีทะเบียนเกษตรกร ใบสุขาภิบาลอาหาร ทะเบียนพาณิชย์ — ได้กำไรสินค้าแปรรูป OTOP ราว 1,800 ฿ ทุก 28 วัน', pre: () => null, pay: { every: 28, amt: 1800, what: 'กำไรสินค้าแปรรูป OTOP' } },
    { k: 'hotel', n: 'ขออนุญาตประกอบกิจการที่พัก/โฮมสเตย์', i: '🏨', doc: 'hotel', req: ['idcard', 'housereg', 'firecert', 'commreg'], fee: 3000, days: 12, office: 'เทศบาล + ที่ว่าการอำเภอ', info: 'ต้องผ่านตรวจอัคคีภัยและจดทะเบียนพาณิชย์ ได้รายได้ที่พักราว 3,000 ฿ ทุก 28 วัน', pre: () => (S.up && S.up.house >= 2) ? null : 'บ้านต้องอัปเกรดอย่างน้อยระดับ 2 จึงรับแขกได้', pay: { every: 28, amt: 3000, what: 'รายได้ที่พัก/โฮมสเตย์' } },
    { k: 'factory', n: 'ขอตั้งโรงงาน (รง.4)', i: '🏭', doc: 'factory', req: ['idcard', 'bizcert', 'firecert', 'buildhome:'], fee: 10000, days: 20, office: 'กรมโรงงานอุตสาหกรรม', info: 'ต้องมีบริษัทจดทะเบียน (DBD) ตรวจอัคคีภัย และใบอนุญาตก่อสร้างอย่างน้อย 1 แปลง ได้กำไรโรงงานราว 6,500 ฿ ทุก 28 วัน', pre: () => Object.keys(gst().docs).some(k => k.startsWith('buildhome:') && has(k)) ? null : 'ต้องมีใบอนุญาตก่อสร้าง (อ.1) อย่างน้อย 1 แปลง', pay: { every: 28, amt: 6500, what: 'กำไรโรงงาน' } },
    { k: 'pet', n: 'ขึ้นทะเบียนสัตว์เลี้ยง (ฝังไมโครชิป)', i: '🐕', doc: 'petreg', req: ['idcard', 'housereg'], fee: 300, days: 0, office: 'ปศุสัตว์อำเภอ', info: 'ต้องมีสุนัขหรือแมวที่เลี้ยงอยู่ ฉีดวัคซีนพิษสุนัขบ้าและฝังชิป', pre: () => hasPet() ? null : 'ยังไม่มีสัตว์เลี้ยง (รับเลี้ยงที่ฟาร์มปศุสัตว์)', eff: () => { try { if (S.pet) S.pet.vacc = S.day; } catch (e) { } } },
    { k: 'schol', n: 'สมัครทุนการศึกษารัฐบาล', i: '🎓', doc: null, req: ['idcard', 'edcert'], fee: 0, days: 14, office: 'สำนักงานเขตพื้นที่การศึกษา', info: 'ต้องมีใบรับรองวุฒิ และบัตรสวัสดิการหรือหนังสือรับรองรายได้ ปีละครั้ง ได้ทุน 12,000 ฿',
      pre: () => yearOk('schol') ? ((has('welfare') || has('taxcert')) ? null : 'ต้องมีบัตรสวัสดิการหรือหนังสือรับรองรายได้') : 'ขอทุนได้ปีละครั้ง', check: () => (has('welfare') || has('taxcert')) ? null : 'หลักฐานรายได้หมดอายุ',
      eff: () => { earn(12000); try { Bank2.income('ทุนการศึกษารัฐบาล', 12000); } catch (e) { } st().done.schol = S.day; msg('สพฐ. สุขใจ', 'ทุนการศึกษา 12,000 ฿ โอนเข้าบัญชีแล้ว'); } },
    { k: 'aid', n: 'ขอรับเงินช่วยเหลือเกษตรกร', i: '🌾', doc: 'farmaid', req: ['idcard', 'housereg', 'farmer'], fee: 0, days: 7, office: 'เกษตรอำเภอ (ธ.ก.ส.)', info: 'ต้องขึ้นทะเบียนเกษตรกร (ทบก.) ที่ยังไม่หมดอายุ ได้เงินช่วยเหลือ 1,500 ฿ ทุก 28 วันตลอดอายุสิทธิ', pre: () => null, pay: { every: 28, amt: 1500, what: 'เงินช่วยเหลือเกษตรกร', need: 'farmer' } },
    { k: 'cmpi', n: 'ทำ พ.ร.บ.รถยนต์ + ตรวจสภาพรถ', i: '🚘', doc: 'compins', req: ['idcard'], fee: 645, days: 0, office: 'บริษัทประกันภัย / ขนส่ง', info: 'บังคับตามกฎหมายสำหรับรถที่จดทะเบียนแล้ว ไม่มีจะถูกออกใบสั่งที่ด่านตรวจ 600 ฿', pre: () => regCar() ? null : 'ไม่มีรถที่จดทะเบียน', eff: () => { tick(20); } },
  ];
  const BY = {}; APPS26.forEach(a => BY[a.k] = a);

  // ---- checks ----
  const missing = (a) => {
    const out = [];
    for (const r of a.req) {
      if (r === 'buildhome:') continue;
      if (!has(r)) { const d = gst().docs[r]; out.push(d && d.exp && S.day > d.exp ? `${docI(r)} ${docN(r)} (หมดอายุ)` : `${docI(r)} ${docN(r)}`); }
    }
    return out;
  };
  const whereFor = r => { const off = Gov24.offices.find(o => o.id === (D[r] || {}).off); return off ? off.n : 'ศูนย์ราชการอำเภอสุขใจ'; };
  const problem = a => {
    const m = missing(a); if (m.length) return 'ขาดเอกสาร: ' + m.join(', ');
    const p = a.pre && a.pre(); if (p) return p;
    if (a.doc && has(a.doc) && !/^(pet|comm)$/.test(a.k)) return `มี${docN(a.doc)}ที่ยังไม่หมดอายุอยู่แล้ว`;
    if (a.doc && has(a.doc)) return `มี${docN(a.doc)}อยู่แล้ว`;
    if (st().apps.some(x => x.k === a.k && x.st === 'pending')) return 'มีคำขอเรื่องนี้ค้างอยู่';
    if (S.money < a.fee) return `เงินไม่พอค่าธรรมเนียม ${baht(a.fee)}`;
    return null;
  };

  // ---- submit / decide ----
  const grantDoc = a => {
    const D0 = D[a.doc], x = gst();
    x.n = (x.n || 0) + 1;
    x.docs[a.doc] = { no: `${a.doc.slice(0, 3).toUpperCase()}-${String(S.day).padStart(4, '0')}-${String(x.n).padStart(3, '0')}`, issued: S.day, exp: D0.life ? S.day + D0.life : 0, data: {} };
    if (a.pay) st().pay[a.doc] = S.day;
  };
  const finish = a => {
    const T = BY[a.k];
    if (T.doc) grantDoc(T);
    try { T.eff && T.eff(a); } catch (e) { console.warn('v26d eff', e); }
    a.st = 'done'; a.fin = S.day;
    UI.toast(`${T.i} ${T.doc ? `ได้รับ${docN(T.doc)}แล้ว` : `${T.n} สำเร็จ`}`, '✅');
    msg(T.office, `${T.n}: อนุมัติแล้ว${T.doc ? ` ออก${docN(T.doc)} ดูในแอปราชการ > กระเป๋าเอกสาร` : ''}`);
    try { Life2.note && Life2.note(T.n + ' สำเร็จ'); } catch (e) { }
  };
  const submit = k => {
    const a = BY[k]; if (!a) return;
    const why = problem(a); if (why) { UI.toast(`${a.n}: ${why}`, '📄'); try { Sfx.error && Sfx.error(); } catch (e) { } return; }
    let data = {};
    if (a.input) { const v = $v('v26in'); if (!v) { UI.toast('พิมพ์ชื่อใหม่ในช่องก่อนยื่น', '✍️'); return; } if (v === (S.name || '').split(/\s+/)[0]) { UI.toast('ชื่อใหม่ซ้ำชื่อเดิม', '✍️'); return; } data = { name: v }; }
    if (a.fee) { S.money -= a.fee; try { Bank2.log('ค่าธรรมเนียม ' + a.n, -a.fee); } catch (e) { } }
    const x = st(); x.n++;
    const app = { no: `V26-${String(S.day).padStart(4, '0')}-${String(x.n).padStart(3, '0')}`, k, st: 'pending', day: S.day, due: S.day + (a.days || 0), fee: a.fee, data };
    x.apps.push(app);
    if (!a.days) { const bad = a.check && a.check(app); if (bad) reject(app, bad); else finish(app); }
    else { UI.toast(`ยื่น${a.n}แล้ว รอ ${a.days} วัน`, '📋'); msg(a.office, `รับคำขอ "${a.n}" เลขที่ ${app.no} ชำระ ${baht(a.fee)} ผลการพิจารณา${RD(app.due)}`); }
    UI.renderBody && UI.renderBody();
  };
  const reject = (app, why) => {
    const T = BY[app.k], back = Math.round(app.fee * 0.7);
    app.st = 'rejected'; app.why = why; app.fin = S.day;
    if (back) { S.money += back; try { Bank2.income('คืนค่าธรรมเนียม ' + T.n, back); } catch (e) { } }
    UI.toast(`${T.i} ${T.n}: ไม่ผ่าน — ${why}`, '⛔');
    msg(T.office, `คำขอ "${T.n}" (${app.no}) ไม่ได้รับอนุมัติ: ${why}${back ? ` · คืนค่าธรรมเนียม ${baht(back)} (หัก 30%)` : ''}`);
  };
  // decision day: the papers are checked again, so a document that expired in the meantime means a rejection
  const decide = () => {
    for (const app of st().apps) {
      if (app.st !== 'pending' || S.day < app.due) continue;
      const T = BY[app.k]; if (!T) { app.st = 'rejected'; continue; }
      const m = missing(T); const bad = m.length ? 'เอกสารประกอบหมดอายุ/ไม่ครบ: ' + m.join(', ') : (T.check && T.check(app));
      if (bad) reject(app, bad); else finish(app);
    }
  };

  // ---- passive licence income / compulsory insurance checkpoints ----
  const daily = () => {
    const x = st();
    decide();
    for (const k in x.pay) {
      const T = APPS26.find(a => a.doc === k); if (!T || !T.pay) continue;
      if (!has(k) || (T.pay.need && !has(T.pay.need))) continue;
      if ((S.day - x.pay[k]) % T.pay.every !== 0 || S.day === x.pay[k]) continue;
      earn(T.pay.amt); try { Bank2.income(T.pay.what, T.pay.amt); } catch (e) { }
      msg(T.office, `${T.pay.what}: ได้รับ ${baht(T.pay.amt)} (${docN(k)} ยังไม่หมดอายุ)`);
    }
    // existing cars at the start of this system get a short grace compulsory-insurance paper
    if (!x.cmpiInit) { x.cmpiInit = 1; if (regCar() && !gst().docs.compins) gst().docs.compins = { no: 'CMP-' + S.day, issued: S.day, exp: S.day + 14, data: { temp: 1 } }; }
    const d = gst().docs.compins; if (d && d.exp && d.exp - S.day === 5 && !x['w' + d.exp]) { x['w' + d.exp] = 1; msg('กรมการขนส่งทางบก', 'พ.ร.บ.รถยนต์จะหมดอายุใน 5 วัน ต่อได้ในแอป "📄 ยื่นเอกสาร"'); }
  };
  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { daily(); } catch (e) { console.warn('v26d daily', e); } return r; }; }
  if (typeof Emergency !== 'undefined' && Emergency.hourly) {
    const _h = Emergency.hourly.bind(Emergency);
    Emergency.hourly = function () {
      _h();
      try {
        const o = G.driving, c = o && o.d; if (!c || G.away || !c.reg || has('compins') || st().ckDay === S.day || Math.random() > 0.15) return;
        st().ckDay = S.day; const g = gst(); g.fines.push({ what: 'ขับรถไม่มี พ.ร.บ.', amt: 600, d: S.day, due: S.day + 15 });
        UI.toast('ด่านตรวจ: ไม่มี พ.ร.บ.รถยนต์ ถูกออกใบสั่ง 600 ฿', '🚔'); msg('สถานีตำรวจภูธรสุขใจ', 'ใบสั่ง: ขับรถไม่มี พ.ร.บ. ปรับ 600 ฿ ชำระในแอปราชการ > ออนไลน์');
      } catch (e) { }
    };
  }

  // ---- gates in the real actions (wrap-and-extend, same pattern as Gov24) ----
  const gate = (obj, fn, check) => { const o = obj && obj[fn]; if (typeof o !== 'function') return; obj[fn] = function (...a) { if (!check.apply(this, a)) return; return o.apply(this, a); }; };
  try { gate(Career, 'apply', k => { const C = typeof JOBS2 !== 'undefined' && JOBS2[k]; return !(C && (C.gov || /nurse|police|firefighter|vet/.test(k))) || Gov24.need(['medcert'], 'สมัครงานราชการ/สาธารณสุข'); }); } catch (e) { }
  try { gate(DriveSchool, 'klass', () => Gov24.need(['medcert'], 'สอบใบขับขี่')); } catch (e) { }
  try { gate(Ins, 'buy', k => !/^(health|life)/.test(k) || Gov24.need(['medcert'], 'ทำประกันสุขภาพ')); } catch (e) { }
  try { gate(Bank2, 'borrow', n => !(n >= 100000 && owns()) || Gov24.need(['deedcopy'], 'ขอสินเชื่อวงเงิน ' + baht(n) + ' (ใช้หลักประกัน)')); } catch (e) { }

  // ================= phone app "📄 ยื่นเอกสาร" =================
  const ST = { pending: '<span class="dim">⏳ รอพิจารณา</span>', done: '<span class="good">✅ อนุมัติ</span>', rejected: '<span class="bad">⛔ ไม่ผ่าน</span>' };
  const chk = a => a.req.filter(r => r !== 'buildhome:').map(r => `<span class="${has(r) ? 'good' : 'bad'}">${has(r) ? '✅' : '❌'} ${docI(r)} ${esc(docN(r))}</span>`).join(' · ') + (a.req.includes('buildhome:') ? ` · <span class="${Object.keys(gst().docs).some(k => k.startsWith('buildhome:') && has(k)) ? 'good' : 'bad'}">🏗️ ใบอนุญาตก่อสร้าง</span>` : '');
  const listHtml = () => {
    const x = st();
    return `<p class="lead">ยื่นเอกสารออนไลน์ได้ทุกเวลา · ระบบจะตรวจเอกสารประกอบอีกครั้งในวันตัดสิน ถ้าเอกสารหมดอายุจะไม่ผ่านและคืนค่าธรรมเนียม 70% · เอกสารที่ได้ดูใน 🏛️ ราชการ > กระเป๋าเอกสาร</p><div class="grid">${APPS26.map(a => {
      const why = problem(a), pend = x.apps.some(p => p.k === a.k && p.st === 'pending');
      return `<div class="card"><div class="ci">${a.i}</div><div class="cb"><h4>${esc(a.n)}</h4><p class="dim">${esc(a.info)}</p><p class="dim">🏢 ${esc(a.office)} · ${a.fee ? baht(a.fee) : 'ฟรี'} · ${a.days ? a.days + ' วัน' : 'เสร็จทันที'}</p><p class="dim">ต้องมี: ${chk(a)}</p>${a.doc && has(a.doc) ? `<p class="good">✅ มี${esc(docN(a.doc))}แล้ว</p>` : ''}${why && !pend ? `<p class="bad">${esc(why)}</p>` : ''}${a.input ? `<input id="v26in" maxlength="30" placeholder="${esc(a.input)}">` : ''}<div class="row end">${pend ? ST.pending : `<button class="btn${why ? ' ghost' : ''}" data-a="v26" data-v="submit|${a.k}">ยื่น${a.fee ? ' ' + baht(a.fee) : ''}</button>`}</div></div></div>`;
    }).join('')}</div>`;
  };
  const guideHtml = () => `<p class="lead">เช็กลิสต์: ต้องมีเอกสารอะไร ไปขอที่ไหน</p><div class="grid">${Object.keys(D).filter(k => k !== 'buildhome').map(k => `<div class="card"><div class="ci">${docI(k)}</div><div class="cb"><h4>${esc(docN(k))}</h4><p class="dim">ขอที่ ${esc(whereFor(k))} · ${D[k].life ? `อายุ ${D[k].life} วัน` : 'ไม่มีวันหมดอายุ'}</p><p>${has(k) ? '<span class="good">✅ มีแล้ว</span>' : '<span class="bad">❌ ยังไม่มี</span>'}</p></div></div>`).join('')}</div>`;
  const statusHtml = () => {
    const l = st().apps.slice().reverse();
    return l.length ? `<div class="grid">${l.map(p => { const a = BY[p.k] || {}; return `<div class="card"><div class="ci">${a.i || '📄'}</div><div class="cb"><h4>${esc(a.n || p.k)}</h4><p class="dim">เลขที่ ${p.no} · ยื่น${RD(p.day)}${p.st === 'pending' ? ` · ผล${RD(p.due)}` : ` · ผล ${p.fin}`}</p><p>${ST[p.st]}${p.why ? ' · ' + esc(p.why) : ''}</p></div></div>`; }).join('')}</div>` : '<p class="empty">ยังไม่เคยยื่นคำขอ</p>';
  };
  const benefits = () => {
    const x = st(), lic = has('pslicense'), v = has('visa');
    return `<p class="lead">สิทธิที่ได้จากเอกสาร</p>
      <div class="card"><div class="ci">🚕</div><div class="cb"><h4>วิ่งแท็กซี่รับจ้าง 4 ชม.</h4><p class="dim">ต้องมีใบอนุญาตขับรถสาธารณะ (ท.1) และ พ.ร.บ.รถยนต์ ได้ ~800-1,200 ฿ ค่าน้ำมัน 150 ฿ เหนื่อย -25 พลังงาน</p><div class="row end"><button class="btn${lic && has('compins') && regCar() ? '' : ' ghost'}" data-a="v26" data-v="taxi">ออกวิ่ง</button></div></div></div>
      <div class="card"><div class="ci">✈️</div><div class="cb"><h4>ทริปต่างประเทศ 3 วัน</h4><p class="dim">ต้องมีพาสปอร์ตและวีซ่าที่ยังไม่หมดอายุ ราคา 15,000 ฿ พลังงานเต็ม อารมณ์ +30</p><div class="row end"><button class="btn${v ? '' : ' ghost'}" data-a="v26" data-v="trip">เดินทาง</button></div></div></div>
      <div class="card"><div class="ci">💰</div><div class="cb"><h4>รายได้จากใบอนุญาตที่ถืออยู่</h4><p class="dim">${APPS26.filter(a => a.pay).map(a => `${a.i} ${esc(a.pay.what)} ${baht(a.pay.amt)}/28 วัน — ${has(a.doc) && (!a.pay.need || has(a.pay.need)) ? '<span class="good">ได้รับอยู่</span>' : '<span class="bad">ยังไม่มีสิทธิ</span>'}`).join('<br>')}</p></div></div>`;
  };
  const open = () => UI.open('📄 ยื่นเอกสาร', ['ยื่นคำขอ', 'สถานะคำขอ', 'เช็กลิสต์เอกสาร', 'สิทธิที่ได้'], t => t === 0 ? listHtml() : t === 1 ? statusHtml() : t === 2 ? guideHtml() : benefits());
  const A = {
    submit: k => submit(k),
    taxi: () => {
      if (!has('pslicense')) return UI.toast(`ต้องมี${docN('pslicense')}`, '🚕');
      if (!regCar()) return UI.toast('ต้องมีรถที่จดทะเบียนแล้ว', '🚗');
      if (!Gov24.need(['compins'], 'วิ่งแท็กซี่')) return;
      if ((S.energy || 0) < 25) return UI.toast('เหนื่อยเกินไป ต้องมีพลังงาน ≥ 25', '😮‍💨');
      if (S.money < 150) return UI.toast('เงินไม่พอค่าน้ำมัน', '⛽');
      const pay = 800 + Math.floor(Math.random() * 400);
      UI.close(); fade(() => { tick(240); S.money -= 150; S.energy = Math.max(0, S.energy - 25); earn(pay); try { Bank2.income('รายได้แท็กซี่', pay); } catch (e) { } UI.toast(`วิ่งแท็กซี่ 4 ชม. ได้ ${baht(pay)} (หักน้ำมัน 150 ฿)`, '🚕'); });
    },
    trip: () => {
      if (!has('passport') || !has('visa')) return UI.toast('ต้องมีพาสปอร์ตและวีซ่าที่ยังไม่หมดอายุ', '🛂');
      if (S.money < 15000) return UI.toast('เงินไม่พอ ต้องใช้ 15,000 ฿', '💸');
      UI.close(); fade(() => { S.money -= 15000; try { Bank2.log('ทริปต่างประเทศ', -15000); } catch (e) { } tick(600); S.energy = typeof maxEnergy === 'function' ? maxEnergy() : S.energy; S.mood = Math.min(100, (S.mood || 50) + 30); UI.toast('กลับจากทริปต่างประเทศ สดชื่นเต็มที่!', '✈️'); });
    },
  };
  UI.H.v26 = d => { const [k, ...r] = String(d.v || '').split('|'); const f = A[k]; if (f) { try { f(...r); } catch (e) { if (e && e.spend173) throw e; console.warn('v26', k, e); } } };
  if (!APPS.some(a => a.id === 'docs26')) APPS.splice(Math.min(APPS.length, 13), 0, { id: 'docs26', i: '📄', n: 'ยื่นเอกสาร' });
  Phone.apps.docs26 = () => { setTimeout(() => { Phone.app = null; UI.close(); open(); }, 0); return ''; };
  if (typeof APP_GROUPS !== 'undefined') { const gr = APP_GROUPS.find(x => /บริการ/.test(x[0])) || APP_GROUPS[APP_GROUPS.length - 1]; if (gr && !gr[1].includes('docs26')) gr[1].unshift('docs26'); }

  // the first time: tell old and new players where the new paperwork lives
  const s0 = st(); if (!s0.init) { s0.init = 1; setTimeout(() => msg('ศูนย์ราชการอำเภอสุขใจ', 'เปิดบริการยื่นเอกสารเพิ่ม 18 เรื่อง (สมรส สูติบัตร วีซ่า ใบอนุญาตประกอบธุรกิจ ฯลฯ) ที่แอป "📄 ยื่นเอกสาร"'), 3000); }
  window.Docs26 = { apps: APPS26, submit, problem, daily, open, st };
});
