'use strict';
// ---------- v24_gov: Thai government services. A walk-in district service centre (ศูนย์ราชการ) with 26 counters, a national ID
// card applied for with a real form, licences and permits with requirements / fees / expiry, and one document wallet
// (Gov24.need) that banking, property, cars, companies, jobs, internet and elections all ask before they let you transact ----------
V23.add('gov24', () => {
  const YD = typeof YEAR_DAYS !== 'undefined' ? YEAR_DAYS : 84;
  const DAY0 = 'วันที่ ';
  const st = () => { const x = S.gov24 = S.gov24 || {}; x.docs = x.docs || {}; x.apps = x.apps || []; x.fines = x.fines || []; x.bills = x.bills || []; x.warn = x.warn || {}; x.n = x.n || 0; return x; };
  const $v = id => { const e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  const yearBE = () => window.Cal36 ? Cal36.date().be : new Date().getFullYear() + 543;   // the in-game calendar year (v36), real year as a fallback
  const MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  const sel = (id, opts, cur) => `<select id="${id}">${opts.map(o => { const [v, t] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}"${String(v) === String(cur) ? ' selected' : ''}>${esc(t)}</option>`; }).join('')}</select>`;
  const inp = (id, ph, val, max = 40) => `<input id="${id}" maxlength="${max}" placeholder="${esc(ph)}" value="${esc(val || '')}">`;
  const fmtNo = n => String(n).replace(/^(\d)(\d{4})(\d{5})(\d{2})(\d)$/, '$1-$2-$3-$4-$5');

  // ================= documents =================
  // life: days it stays valid (0 = no expiry); off: where it is issued
  const DOCS = {
    idcard: { n: 'บัตรประจำตัวประชาชน', i: '🪪', life: 8 * YD, off: 'district' },
    housereg: { n: 'ทะเบียนบ้าน (ท.ร.14)', i: '🏠', life: 0, off: 'district' },
    resid: { n: 'หนังสือรับรองถิ่นที่อยู่', i: '📄', life: YD, off: 'district' },
    passport: { n: 'หนังสือเดินทาง', i: '📕', life: 5 * YD, off: 'passport' },
    crimrec: { n: 'ใบรับรองความประพฤติ (ประวัติอาชญากรรม)', i: '📃', life: YD, off: 'police' },
    taxcert: { n: 'หนังสือรับรองรายได้/การเสียภาษี', i: '🧾', life: YD, off: 'revenue' },
    bizcert: { n: 'หนังสือรับรองนิติบุคคล (DBD)', i: '🏢', life: 2 * YD, off: 'dbd' },
    edcert: { n: 'ใบรับรองวุฒิการศึกษา', i: '🎓', life: 0, off: 'edu' },
    farmer: { n: 'ทะเบียนเกษตรกร (ทบก.)', i: '🌾', life: YD, off: 'agri' },
    livereg: { n: 'ทะเบียนฟาร์มปศุสัตว์', i: '🐄', life: YD, off: 'livestock' },
    fishreg: { n: 'ทะเบียนผู้ประกอบการประมง', i: '🐟', life: YD, off: 'fisheries' },
    ssoreg: { n: 'ผู้ประกันตนมาตรา 40 (ประกันสังคม)', i: '🛡️', life: 0, off: 'sso' },
    firecert: { n: 'ใบรับรองตรวจความปลอดภัยอัคคีภัย', i: '🧯', life: YD, off: 'fire' },
    foodsan: { n: 'ใบรับรองผู้สัมผัสอาหาร (สุขาภิบาลอาหาร)', i: '🥘', life: YD, off: 'health' },
    welfare: { n: 'บัตรสวัสดิการแห่งรัฐ', i: '💳', life: YD, off: 'welfare' },
    sd43: { n: 'หลักฐานการผ่านการเกณฑ์ทหาร (สด.43)', i: '🎖️', life: 0, off: 'draft' },
    voter: { n: 'ทะเบียนผู้มีสิทธิเลือกตั้ง', i: '🗳️', life: 0, off: 'election' },
    buildhome: { n: 'ใบอนุญาตก่อสร้างอาคาร (อ.1)', i: '🏗️', life: YD, off: 'municipal' },
  };
  const docName = id => { const b = id.split(':')[0], D = DOCS[b]; if (!D) return id; if (id.includes(':')) { const L = typeof LOTS !== 'undefined' && LOTS.find(l => l.id === id.split(':')[1]); return D.n + (L ? ` (${L.n})` : ''); } return D.n; };
  const rec = id => st().docs[id] || null;
  const live = d => !!d && (!d.exp || S.day <= d.exp);
  const has = id => {
    if (id === 'driving') return S.license ? { no: 'DL', issued: 0, exp: S.licExp || 0 } : null;
    const d = rec(id); return live(d) ? d : null;
  };
  const OFF_BY_ID = {}; // filled below
  const hallWhere = () => 'ศูนย์ราชการอำเภอสุขใจ (หาตึก 🏛️ บนแผนที่)';
  const whyMissing = id => {
    const b = id.split(':')[0], D = DOCS[b], o = OFF_BY_ID[D ? D.off : ''], d = rec(id);
    // papers issued by the agencies of v26 (clinic, SSO section 39, BAAC, Red Cross ...) are not at the district hall
    let ag = null; try { const A = window.Agency26 && Agency26.agencies; if (D && D.by && Array.isArray(A)) ag = A.find(x => x.id === D.by) || null; } catch (e) { }
    const where = ag ? `"${ag.n}" · แอป 🏛️ หน่วยงานเพิ่มเติม หรือเคาน์เตอร์ในศูนย์บริการภาครัฐ` : o ? `"${o.n}" · ${hallWhere()}` : hallWhere();
    if (d && !live(d)) return `${D.i} ${docName(id)} หมดอายุเมื่อ${RD(d.exp)} จึงทำธุรกรรมไม่ได้ — ต่ออายุที่ ${where}`;
    if (d && d.temp) return `${D.i} ${docName(id)} ชั่วคราวหมดอายุแล้ว — ทำของจริงที่ ${where}`;
    return `${D ? D.i : '📄'} ต้องมี${docName(id)} — ขอได้ที่ ${where}`;
  };
  // the single check every transaction asks. ids: documents that must all be valid; alt: id -> a document that may stand in (e.g. passport for ID card)
  const need = (ids, what, alt) => {
    for (const id of ids) {
      if (has(id)) continue;
      if (alt && alt[id] && has(alt[id])) continue;
      if (id === 'idcard' && has('passport') && what && /สินเชื่อ|หุ้น|ลงทุน|ซิม/.test(what)) continue; // banks and operators accept a passport instead
      UI.toast(`${what ? what + ': ' : ''}${whyMissing(id)}`, '🪪'); Sfx.error && Sfx.error(); return false;
    }
    return true;
  };

  // ================= helpers =================
  const money = n => { n = Math.round(+n); return Number.isFinite(n) && n > 0 ? n : 0; };
  const pay = (n, label) => {
    n = money(n); if (S.money < n) { UI.toast(`เงินไม่พอ ต้องใช้ ${baht(n)}`, '💸'); return false; }
    if (n) { S.money -= n; Bank2.log(label, -n); } return true;
  };
  const msg = (from, t) => { try { Phone.msg(from, t); } catch (e) { } };
  const hrs = h => `${String(Math.floor(h)).padStart(2, '0')}:${h % 1 ? '30' : '00'}`;
  const dayIdx = () => (S.day - 1) % 7;
  const isOpen = off => {
    if (window.Hours36) return Hours36.open(off.id);
    const H = off.hrs || { wd: [8.5, 16.5] }, h = S.time / 60, d = dayIdx(), W = (a) => a && h >= a[0] && h < a[1];
    if (H.all) return true;
    if (d < 5) return W(H.wd);
    if (d === 5) return W(H.sat);
    return W(H.sun);
  };
  const hoursText = off => { if (window.Hours36) return Hours36.text(off.id); const H = off.hrs || { wd: [8.5, 16.5] }; if (H.hol) return 'วันหยุดราชการ'; if (H.all) return 'เปิด 24 ชม.'; return `จ-ศ ${hrs(H.wd[0])}–${hrs(H.wd[1])}` + (H.sat ? ` · ส ${hrs(H.sat[0])}–${hrs(H.sat[1])}` : ' · ปิดเสาร์-อาทิตย์'); };
  const daysLeft = d => d.exp ? d.exp - S.day : null;
  const status = (id, d) => {
    d = d || rec(id); if (!d) return '<span class="bad">ยังไม่มี</span>';
    if (d.exp && S.day > d.exp) return `<span class="bad">⛔ หมดอายุ (${d.exp})</span>`;
    return `<span class="good">✅ ใช้ได้${d.exp ? `ถึง${RD(d.exp)} (อีก ${d.exp - S.day} วัน)` : ' ไม่มีวันหมดอายุ'}</span>${d.temp ? ' · ชั่วคราว' : ''}`;
  };

  // Thai 13-digit ID number with the real check digit
  const mkIdNo = () => {
    const rnd = (S.day * 7919 + 13) % 9973, a = [1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0];
    const body = `${1}${'1101'}${String(10000 + (rnd * 37 + (S.stats ? S.stats.earned | 0 : 0)) % 90000)}${String(10 + rnd % 89)}`.slice(0, 12).split('').map(Number);
    let sum = 0; for (let i = 0; i < 12; i++) sum += body[i] * (13 - i);
    return body.join('') + ((11 - sum % 11) % 10);
  };
  const plate = (i = S.cars.length) => { const L = ['กก', 'กข', 'ขก', 'คง', 'จฉ', 'ชซ', '1กก', '2ขข', '3คค']; return `${L[(S.day + i * 3) % L.length]} ${1000 + (S.day * 131 + i * 977) % 9000}`; };
  const docNo = (id, extra) => { const x = st(); x.n++; return `${id.slice(0, 3).toUpperCase()}-${String(S.day).padStart(4, '0')}-${String(x.n).padStart(3, '0')}${extra || ''}`; };

  const grant = (id, data, offName, label) => {
    const b = id.split(':')[0], D = DOCS[b], x = st();
    const d = { no: id === 'idcard' ? (data && data.no13) || mkIdNo() : docNo(b), issued: S.day, exp: D && D.life ? S.day + D.life : 0, data: data || {} };
    x.docs[id] = d; Life2.note && Life2.note('ได้รับ' + docName(id));
    UI.toast(`${D ? D.i : '📄'} ได้รับ${docName(id)} แล้ว`, '✅');
    msg(offName || 'ศูนย์ราชการอำเภอสุขใจ', `${label || 'ออก'}${docName(id)} เลขที่ ${id === 'idcard' ? fmtNo(d.no) : d.no} ${d.exp ? `ใช้ได้ถึง${RD(d.exp)}` : 'ไม่มีวันหมดอายุ'}`);
    return d;
  };
  // an application: pay, wait the processing days, then pick it up at the counter
  const apply = (o) => {
    const x = st();
    if (x.apps.some(a => a.key === (o.key || o.doc) && a.st !== 'done')) { UI.toast('มีคำขอเรื่องนี้ค้างอยู่แล้ว ดูสถานะในแอปราชการ', '📋'); return false; }
    if (!pay(o.fee || 0, 'ค่าธรรมเนียม ' + docName(o.doc))) return false;
    if (!o.days) { grant(o.key || o.doc, o.data, o.offName, o.label); return true; }
    x.apps.push({ no: docNo('APP'), doc: o.doc, key: o.key || o.doc, off: o.off, offName: o.offName, st: 'pending', due: S.day + o.days, data: o.data, fee: o.fee || 0, day: S.day });
    UI.toast(`ยื่นคำขอ${docName(o.doc)}แล้ว รอ ${o.days} วัน`, '📋');
    msg(o.offName || 'ศูนย์ราชการ', `รับคำขอ${docName(o.doc)} (ชำระ ${baht(o.fee || 0)}) ตรวจสอบเสร็จ${RD(S.day + o.days)} มารับเอกสารที่เคาน์เตอร์ในเวลาราชการ`);
    return true;
  };
  const spend = (mins, fn) => { UI.close(); fade(() => { tick(mins); fn(); }); };
  const queue = () => 8 + ((S.day * 13 + Math.floor(S.time / 30)) % 28);

  // ================= forms =================
  const formHead = (t, d) => `<p class="lead">${t}</p><p class="dim">${d || ''}</p>`;
  const TAMBON = ['สุขใจ', 'ทุ่งทอง', 'ภูผาใหม่', 'ริมทะเล'];
  const RELIG = ['พุทธ', 'อิสลาม', 'คริสต์', 'ฮินดู', 'ซิกข์', 'อื่น ๆ', 'ไม่ระบุ'];
  let draft = null;
  const idForm = mode => {
    const old = rec('idcard'), o = old && old.data && old.data.th ? old.data : null;
    const nm = (S.name || '').split(/\s+/);
    const th = o ? o.th : { pre: 'นาย', first: nm[0] || '', last: nm[1] || '' }, en = o ? o.en : { first: '', last: '' };
    const b = o ? o.birth : { d: 1, m: 1, y: yearBE() - 25 }, ad = o ? o.addr : { no: '99/1', moo: 5, tam: 'สุขใจ' };
    const ys = []; for (let y = yearBE() - 15; y >= yearBE() - 80; y--) ys.push(y);
    return `${formHead(mode === 'new' ? 'คำขอมีบัตรประจำตัวประชาชน (ท.ร.14/บ.ช.1) — กรอกข้อมูลตามจริงให้ตรงกับเอกสาร' : mode === 'lost' ? 'แจ้งบัตรหาย/ขอทำบัตรใหม่ (ค่าธรรมเนียม 100 ฿)' : 'ขอต่ออายุ/เปลี่ยนบัตรประจำตัวประชาชน', 'ชื่อ-สกุลต้องเป็นอักษรไทย ชื่อภาษาอังกฤษเป็นตัวอักษร A-Z อายุต้องไม่ต่ำกว่า 15 ปี ถ่ายรูปที่เคาน์เตอร์ ใช้เวลา ~30 นาที')}
    <div class="grid"><div class="card"><div class="cb"><h4>ข้อมูลส่วนตัว</h4>
      <p class="dim">คำนำหน้า</p>${sel('gfPre', ['นาย', 'นาง', 'นางสาว', 'เด็กชาย', 'เด็กหญิง'], th.pre)}
      <p class="dim">ชื่อ (ไทย)</p>${inp('gfFirst', 'เช่น สมชาย', th.first, 30)}
      <p class="dim">นามสกุล (ไทย)</p>${inp('gfLast', 'เช่น ใจดี', th.last, 30)}
      <p class="dim">First name (English)</p>${inp('gfEF', 'e.g. Somchai', en.first, 30)}
      <p class="dim">Last name (English)</p>${inp('gfEL', 'e.g. Jaidee', en.last, 30)}
      <p class="dim">เพศ</p>${sel('gfSex', ['ชาย', 'หญิง'], o ? o.sex : 'ชาย')}
      <p class="dim">หมู่โลหิต</p>${sel('gfBlood', ['A', 'B', 'AB', 'O'], o ? o.blood : 'O')}
      <p class="dim">ศาสนา</p>${sel('gfRel', RELIG, o ? o.rel : 'พุทธ')}</div></div>
    <div class="card"><div class="cb"><h4>วัน เดือน ปีเกิด (พ.ศ.)</h4>
      ${sel('gfD', Array.from({ length: 31 }, (_, i) => i + 1), b.d)} ${sel('gfM', MONTHS.map((t, i) => [i + 1, t]), b.m)} ${sel('gfY', ys, b.y)}
      <h4 style="margin-top:10px">ที่อยู่ตามทะเบียนบ้าน</h4>
      <p class="dim">บ้านเลขที่</p>${inp('gfNo', 'เช่น 99/1', ad.no, 10)}
      <p class="dim">หมู่ที่</p>${sel('gfMoo', Array.from({ length: 12 }, (_, i) => i + 1), ad.moo)}
      <p class="dim">ตำบล</p>${sel('gfTam', TAMBON, ad.tam)}
      <p class="dim">อำเภอ / จังหวัด</p><p class="lead">อำเภอสุขใจ · จังหวัดสุขใจ</p>
      <label class="lead"><input type="checkbox" id="gfPhoto"> ถ่ายรูปหน้าตรงที่เคาน์เตอร์ และพิมพ์ลายนิ้วมือ</label><br>
      <label class="lead"><input type="checkbox" id="gfOk"> ข้าพเจ้ารับรองว่าข้อมูลถูกต้องตามความจริง</label></div></div></div>
    <div class="row"><button class="btn" data-a="g24idsub" data-v="${mode}">ยื่นคำขอ${mode === 'lost' ? ' (100 ฿)' : ''}</button></div>`;
  };
  const daysIn = (m, y) => new Date(y - 543, m, 0).getDate();
  const idSubmit = mode => {
    const th = { pre: $v('gfPre'), first: $v('gfFirst'), last: $v('gfLast') }, en = { first: $v('gfEF'), last: $v('gfEL') };
    const birth = { d: +$v('gfD'), m: +$v('gfM'), y: +$v('gfY') }, addr = { no: $v('gfNo'), moo: +$v('gfMoo'), tam: $v('gfTam') };
    if (!/^[ก-๙]{2,30}$/.test(th.first)) { UI.toast('ชื่อต้องเป็นอักษรไทย 2-30 ตัว (ไม่มีเว้นวรรคหรือตัวเลข)', '⚠️'); return; }
    if (!/^[ก-๙]{2,30}$/.test(th.last)) { UI.toast('นามสกุลต้องเป็นอักษรไทย 2-30 ตัว', '⚠️'); return; }
    if (!/^[A-Za-z]{2,30}$/.test(en.first) || !/^[A-Za-z]{2,30}$/.test(en.last)) { UI.toast('ชื่อ-สกุลภาษาอังกฤษต้องเป็น A-Z 2-30 ตัว', '⚠️'); return; }
    if (birth.d > daysIn(birth.m, birth.y)) { UI.toast(`เดือน${MONTHS[birth.m - 1]} ปี ${birth.y} ไม่มีวันที่ ${birth.d}`, '⚠️'); return; }
    if (yearBE() - birth.y < 15) { UI.toast('ผู้ที่อายุต่ำกว่า 15 ปีทำบัตรประชาชนไม่ได้', '⚠️'); return; }
    if (!/^\d{1,4}(\/\d{1,3})?$/.test(addr.no)) { UI.toast('บ้านเลขที่ไม่ถูกต้อง (เช่น 99 หรือ 99/1)', '⚠️'); return; }
    if (!document.getElementById('gfPhoto').checked || !document.getElementById('gfOk').checked) { UI.toast('ต้องถ่ายรูปและรับรองความถูกต้องก่อนยื่นคำขอ', '⚠️'); return; }
    const data = { th, en, birth, addr, sex: $v('gfSex'), blood: $v('gfBlood'), rel: $v('gfRel'), no13: (rec('idcard') && !rec('idcard').temp && rec('idcard').no) || mkIdNo() };
    const fee = mode === 'lost' ? 100 : 0;
    if (!pay(fee, 'ค่าธรรมเนียมทำบัตรประชาชนใหม่')) return;
    spend(30 + queue(), () => { grant('idcard', data, 'ที่ว่าการอำเภอสุขใจ', mode === 'new' ? 'ออก' : 'ออกใหม่'); const a = rec('idcard'); if (a) delete a.temp; UI.open('บัตรประจำตัวประชาชน', null, () => cardHtml('idcard')); });
  };
  const hrForm = () => { const a = (rec('idcard') || {}).data || {}, ad = a.addr || { no: '99/1', moo: 5, tam: 'สุขใจ' }; return `${formHead('คำขอลงทะเบียนบ้าน / ย้ายเข้าที่อยู่ใหม่ (ท.ร.14)', 'ต้องมีบัตรประชาชนที่ยังไม่หมดอายุ ใช้เป็นเอกสารยืนยันที่อยู่ในการซื้ออสังหา ขอสินเชื่อ และติดตั้งอินเทอร์เน็ต')}
    <div class="card"><div class="cb"><p class="dim">บ้านเลขที่</p>${inp('gfHNo', 'เช่น 99/1', ad.no, 10)}<p class="dim">หมู่ที่ ${ad.moo || 5} ตำบล${ad.tam || 'สุขใจ'} อำเภอสุขใจ จังหวัดสุขใจ</p>
    <p class="dim">สถานะในบ้าน</p>${sel('gfHT', ['เจ้าบ้าน', 'ผู้อาศัย'], 'เจ้าบ้าน')}
    <p class="dim">ชื่อบ้าน / สถานที่ (ถ้ามี)</p>${inp('gfHN', 'เช่น ไร่สุขใจ', S.farm || '', 30)}</div></div>
    <div class="row"><button class="btn" data-a="g24hrsub">ยื่นคำขอ (ฟรี)</button></div>`; };
  const hrSubmit = () => {
    const no = $v('gfHNo'); if (!/^\d{1,4}(\/\d{1,3})?$/.test(no)) { UI.toast('บ้านเลขที่ไม่ถูกต้อง', '⚠️'); return; }
    const a = (rec('idcard') || {}).data || {}; if (a.addr && a.addr.no !== no) { UI.toast(`บ้านเลขที่ไม่ตรงกับบัตรประชาชน (${a.addr.no}) ไปแก้ที่อยู่ในบัตรก่อน`, '⚠️'); return; }
    const data = { no, type: $v('gfHT'), name: $v('gfHN'), tam: a.addr ? a.addr.tam : 'สุขใจ' };
    spend(15 + queue(), () => apply({ doc: 'housereg', off: 'district', offName: 'ที่ว่าการอำเภอสุขใจ', fee: 0, days: 0, data }));
  };
  const ppForm = () => { const a = (rec('idcard') || {}).data || {}, e = a.en || {}; return `${formHead('คำขอหนังสือเดินทางเล่มใหม่ (อายุ 5 ปี ค่าธรรมเนียม 1,000 ฿)', 'ต้องมีบัตรประชาชนที่ยังไม่หมดอายุ ตรวจประวัติและพิมพ์ลายนิ้วมือ ใช้เวลา 3 วัน แล้วมารับที่เคาน์เตอร์')}
    <div class="card"><div class="cb"><p class="dim">ชื่อ-สกุลภาษาอังกฤษ (ตามบัตรประชาชน)</p><p class="lead">${esc((e.first || '') + ' ' + (e.last || ''))}</p>
    <p class="dim">สถานที่เกิด</p>${sel('gfPB', ['อ.สุขใจ จ.สุขใจ', 'อ.ทุ่งทอง', 'อ.ภูผาใหม่', 'อื่น ๆ'], 'อ.สุขใจ จ.สุขใจ')}
    <p class="dim">บุคคลติดต่อฉุกเฉิน</p>${inp('gfEm', 'ชื่อ-นามสกุล', '', 40)}
    <label class="lead"><input type="checkbox" id="gfPpOk"> รับรองว่าข้อมูลถูกต้อง และถ่ายรูปพร้อมสแกนลายนิ้วมือ</label></div></div>
    <div class="row"><button class="btn" data-a="g24ppsub">ยื่นคำขอ 1,000 ฿</button></div>`; };
  const ppSubmit = () => {
    if (!$v('gfEm') || $v('gfEm').length < 4) { UI.toast('กรอกชื่อผู้ติดต่อฉุกเฉิน', '⚠️'); return; }
    if (!document.getElementById('gfPpOk').checked) { UI.toast('ต้องรับรองความถูกต้องและสแกนลายนิ้วมือ', '⚠️'); return; }
    if (S.money < 1000) { UI.toast('เงินไม่พอ ต้องใช้ 1,000 ฿', '💸'); return; }
    const data = { pb: $v('gfPB'), em: $v('gfEm'), name: ((rec('idcard') || {}).data || {}).en };
    spend(25 + queue(), () => apply({ doc: 'passport', off: 'passport', offName: 'ที่ทำการหนังสือเดินทาง', fee: 1000, days: 3, data }));
  };
  UI.H.g24idsub = d => idSubmit(d.v); UI.H.g24hrsub = () => hrSubmit(); UI.H.g24ppsub = () => ppSubmit();

  // ================= the ID card picture =================
  const cardHtml = id => {
    const d = rec(id), a = d && d.data || {}, th = a.th || {}, en = a.en || {}, b = a.birth || {}, ad = a.addr || {};
    if (!d) return '<p class="empty">ยังไม่มีบัตร</p>';
    if (id === 'idcard') {
      const age = b.y ? yearBE() - b.y : '-';
      return `<div class="g24card"><div class="g24h">บัตรประจำตัวประชาชน <b>Thai National ID Card</b>${d.temp ? ' · ชั่วคราว' : ''}</div>
        <div class="g24no">${fmtNo(d.no)}</div>
        <div class="g24b"><div><p>ชื่อตัวและชื่อสกุล</p><b>${esc((th.pre || '') + (th.first || S.name || '') + ' ' + (th.last || ''))}</b><p>Name</p><b>${esc((en.first || '') + ' ' + (en.last || ''))}</b>
          <p>เกิดวันที่</p><b>${b.d ? `${b.d} ${MONTHS[b.m - 1]} ${b.y} (อายุ ${age} ปี)` : '—'}</b><p>ศาสนา / หมู่โลหิต</p><b>${esc(a.rel || '-')} · ${esc(a.blood || '-')}</b>
          <p>ที่อยู่</p><b>${ad.no ? `${esc(ad.no)} หมู่ ${ad.moo} ต.${esc(ad.tam)} อ.สุขใจ จ.สุขใจ` : '—'}</b></div><div class="g24ph">🧑</div></div>
        <div class="g24f">วันออกบัตร ${RD(d.issued)} · วันหมดอายุ ${RD(d.exp)} · ${status(id, d)}</div></div>`;
    }
    return `<div class="g24card sm"><div class="g24h">${DOCS[id.split(':')[0]].i} ${esc(docName(id))}</div><div class="g24f">เลขที่ ${esc(d.no)} · ออก ${RD(d.issued)} · ${status(id, d)}</div></div>`;
  };
  const css = document.createElement('style');
  css.textContent = `.g24card{background:linear-gradient(135deg,#e3f2fd,#bbdefb 60%,#90caf9);color:#0d2a4a;border-radius:14px;padding:12px 14px;margin:8px 0;box-shadow:0 2px 10px rgba(0,0,0,.25);text-shadow:none;max-width:460px}
.g24card .g24h{font-size:13px;font-weight:700;border-bottom:1px solid rgba(13,42,74,.25);padding-bottom:4px}.g24card .g24no{font:700 20px/1.6 monospace;letter-spacing:1px;margin:4px 0}
.g24card .g24b{display:flex;gap:10px;justify-content:space-between}.g24card .g24b p{margin:4px 0 0;font-size:12px;opacity:.9}.g24card .g24b b{font-size:13px;display:block}
.g24card .g24ph{font-size:46px;background:#fff8;border-radius:8px;width:68px;height:84px;display:flex;align-items:center;justify-content:center;flex:none}.g24card .g24f{font-size:12px;margin-top:6px;border-top:1px solid rgba(13,42,74,.25);padding-top:4px}
.g24card.sm{background:linear-gradient(135deg,#f5f5f5,#e0e0e0)}.g24card .good{color:#104a14}.g24card .bad{color:#b71c1c}`;
  document.head.appendChild(css);

  // ================= offices & services =================
  const carList = () => S.cars.map((c, i) => ({ c, i, n: (CARS[c.type] || {}).n || c.type }));
  const carTaxAmt = c => (window.CarTax182 ? CarTax182.amt(c) : Math.max(300, Math.round(((CARS[c.type] || {}).price || 100000) * 0.006)) + 645);
  const carState = c => { const r = c.reg, t = c.tax || 0; return !r ? 'unreg' : S.day > t ? 'late' : 'ok'; };
  const finesDue = () => st().fines.filter(f => !f.paid);
  const unpaidBills = () => st().bills.filter(b => !b.paid);
  const age = () => { const b = ((rec('idcard') || {}).data || {}).birth; return b && b.y ? yearBE() - b.y : 0; };
  const lotsOwned = () => { const hb = typeof HomeBuild !== 'undefined' ? HomeBuild.st().lots : {}; return (typeof LOTS !== 'undefined' ? LOTS : []).filter(L => hb[L.id]); };
  const sx = (id, n, i, d, o) => Object.assign({ id, n, i, d }, o);
  const office = (id, n, s, i, sv, o) => Object.assign({ id, n, s, i, sv }, o);

  const OFFICES = [
    office('district', 'ฝ่ายทะเบียนราษฎร ที่ว่าการอำเภอสุขใจ', 'ทะเบียนราษฎร', '🏛️', [
      sx('idcard', 'บัตรประจำตัวประชาชน (ทำใหม่ / ต่ออายุ / บัตรหาย)', '🪪', 'กรอกแบบฟอร์มจริง ถ่ายรูป สแกนลายนิ้วมือ บัตรอายุ 8 ปี', { run: () => { const d = rec('idcard'); const mode = !d ? 'new' : d.temp ? 'renew' : live(d) ? 'lost' : 'renew'; UI.open('คำขอบัตรประจำตัวประชาชน', null, () => (d && !d.temp && live(d) ? '<p class="dim">บัตรของคุณยังไม่หมดอายุ — ขอทำใหม่คิดค่าธรรมเนียม 100 ฿ (กรณีบัตรหาย/ชำรุด)</p>' : '') + idForm(mode)); }, st: () => status('idcard') }),
      sx('housereg', 'ทะเบียนบ้าน / ย้ายที่อยู่ (ท.ร.14)', '🏠', 'ต้องมีบัตรประชาชน ฟรี ออกทันที', { req: ['idcard'], run: () => UI.open('ท.ร.14', null, hrForm), st: () => status('housereg') }),
      sx('resid', 'หนังสือรับรองถิ่นที่อยู่', '📄', 'ใช้ประกอบการสมัครงาน/เปิดบัญชี 20 ฿ อายุ 1 ปีเกม (84 วัน)', { req: ['idcard', 'housereg'], run: () => spend(10 + queue(), () => apply({ doc: 'resid', off: 'district', offName: 'ที่ว่าการอำเภอสุขใจ', fee: 20, days: 0 })), st: () => status('resid') }),
    ]),
    office('land', 'สำนักงานที่ดินอำเภอสุขใจ', 'ที่ดิน', '🗺️', [
      sx('deeds', 'ตรวจสอบโฉนด/ทรัพย์สินที่ถือครอง', '📜', 'รายการทรัพย์สินที่โอนกรรมสิทธิ์แล้ว ภาระภาษี', { run: () => UI.open('ทะเบียนโฉนด', null, () => { const own = Estate.st().own, L = lotsOwned(); const rows = Object.keys(own).map(k => { const P = PROPS.find(p => p.k === k); return `<div class="card"><div class="ci">${P.i}</div><div class="cb"><h4>${esc(P.n)}</h4><p class="dim">โอนเมื่อ${RD(own[k].day)} · ราคาที่ซื้อ ${baht(own[k].paid)}</p></div></div>`; }).concat(L.map(l => `<div class="card"><div class="ci">🏗️</div><div class="cb"><h4>${esc(l.n)}</h4><p class="dim">โฉนดที่ดินของคุณ</p></div></div>`)); return rows.length ? `<div class="grid">${rows.join('')}</div>` : '<p class="empty">ยังไม่มีที่ดินหรืออสังหาริมทรัพย์ในชื่อคุณ</p>'; }) }),
      sx('landnote', 'ข้อกำหนดการซื้อ-ขายที่ดิน', 'ℹ️', 'ผู้ซื้อต้องมีบัตรประชาชนและทะเบียนบ้านที่ยังไม่หมดอายุ ขายต้องไม่ค้างภาษีที่ดิน', { run: () => UI.toast('ซื้อที่ดิน: บัตรประชาชน + ทะเบียนบ้าน · ขาย: ชำระภาษีที่ดินและสิ่งปลูกสร้างให้ครบ', 'ℹ️') }),
    ]),
    office('dlt', 'กรมการขนส่งทางบก (ขนส่งจังหวัดสุขใจ)', 'ใบขับขี่ & ทะเบียนรถ', '🚦', [
      sx('driving', 'ใบอนุญาตขับขี่ (สอบ / ต่ออายุ)', '🪪', 'ต้องมีบัตรประชาชน สอบทฤษฎี-ปฏิบัติที่โรงเรียนสอนขับรถ', { req: ['idcard'], run: () => { UI.close(); DriveSchool.ui(); }, st: () => S.license ? `<span class="good">✅ มีใบขับขี่${S.licExp ? ` ถึง${RD(S.licExp)}` : ''}</span>` : S.licOld ? '<span class="bad">⛔ หมดอายุ ต่ออายุที่โรงเรียนสอนขับรถ</span>' : '<span class="bad">ยังไม่มี</span>' }),
      sx('vehicles', 'จดทะเบียนรถ / ต่อภาษีรถประจำปี + พ.ร.บ.', '🚗', 'ป้ายทะเบียน 500 ฿ · ภาษีรถ + พ.ร.บ. ต่อปี · ใบสั่งต้องจ่ายก่อน', { req: ['idcard'], run: () => vehicleUI() }),
    ]),
    office('revenue', 'สำนักงานสรรพากรพื้นที่สุขใจ', 'ภาษี', '🧾', [
      sx('tin', 'เลขประจำตัวผู้เสียภาษี (TIN)', '🔢', 'เลขเดียวกับเลขบัตรประชาชน 13 หลัก', { req: ['idcard'], run: () => UI.toast(`เลขประจำตัวผู้เสียภาษีของคุณ ${fmtNo(rec('idcard').no)}`, '🔢') }),
      sx('taxfile', 'ยื่นแบบภาษีเงินได้บุคคลธรรมดา (ภ.ง.ด.90)', '📝', 'ยื่น/ชำระภาษีประจำปี', { req: ['idcard'], run: () => { UI.close(); Phone.open('tax'); } }),
      sx('taxcert', 'หนังสือรับรองรายได้/การเสียภาษี', '🧾', 'ใช้ขอสินเชื่อ ≥ 30,000 ฿ ค่าธรรมเนียม 100 ฿ อายุ 1 ปีเกม (84 วัน)', { req: ['idcard'], run: () => spend(15 + queue(), () => apply({ doc: 'taxcert', off: 'revenue', offName: 'สรรพากรพื้นที่สุขใจ', fee: 100, days: 0 })), st: () => status('taxcert') }),
    ]),
    office('dbd', 'สำนักงานพัฒนาธุรกิจการค้าจังหวัดสุขใจ (DBD)', 'จดทะเบียนธุรกิจ', '🏢', [
      sx('reg', 'จองชื่อ/จดทะเบียนบริษัท จำกัด', '🏢', 'ช่วงทดสอบ (ถึง 30 พ.ย. 2569) จดคนเดียวได้ทุกประเภท · หลังจากนั้นธุรกิจใหญ่ (ทุน ≥ 2 ล้าน) ต้องมีผู้ถือหุ้น 2 คนขึ้นไป · กำหนดมูลค่าหุ้น กรรมการ ผู้สอบบัญชี ค่าธรรมเนียมตามทุน', { req: ['idcard'], run: () => { UI.close(); Phone.open('company'); } }),
      sx('bizcert', 'หนังสือรับรองนิติบุคคล', '📑', 'ต้องมีบริษัทที่จดทะเบียนแล้ว 200 ฿ อายุ 2 ปีเกม (168 วัน)', { req: ['idcard'], can: () => (typeof Company !== 'undefined' && Company.list().some(c => !['name', 'named', 'reg'].includes(c.st))) ? '' : 'ยังไม่มีบริษัทที่จดทะเบียนเสร็จสมบูรณ์', run: () => spend(15 + queue(), () => apply({ doc: 'bizcert', off: 'dbd', offName: 'สำนักงานพัฒนาธุรกิจการค้า', fee: 200, days: 0 })), st: () => status('bizcert') }),
    ]),
    office('sso', 'สำนักงานประกันสังคมจังหวัดสุขใจ', 'ประกันสังคม', '🛡️', [
      sx('ssoreg', 'สมัครผู้ประกันตนมาตรา 40 (อาชีพอิสระ/เกษตรกร)', '🛡️', 'ส่งเงินสมทบ 70 ฿ ทุก 28 วัน ได้สิทธิประกันสังคมเมื่อไม่มีนายจ้าง', { req: ['idcard'], run: () => spend(20 + queue(), () => apply({ doc: 'ssoreg', off: 'sso', offName: 'สำนักงานประกันสังคม', fee: 70, days: 0, data: { paidUntil: S.day + 28 } })), st: () => { const d = rec('ssoreg'); if (d && !d.data) d.data = { paidUntil: S.day }; return d ? `<span class="${d.data.paidUntil >= S.day ? 'good' : 'bad'}">${d.data.paidUntil >= S.day ? '✅' : '⛔'} ส่งเงินสมทบถึง${RD(d.data.paidUntil)}</span>` : status('ssoreg'); } }),
    ]),
    office('labour', 'สำนักงานจัดหางานจังหวัดสุขใจ', 'แรงงาน', '👷', [
      sx('jobs', 'ศูนย์จัดหางาน — ตำแหน่งงานว่าง/สมัครงาน', '💼', 'สมัครงานต้องมีบัตรประชาชน งานราชการต้องมีใบรับรองความประพฤติ (ชายต้องมี สด.43)', { req: ['idcard'], run: () => { UI.close(); Phone.open('career'); } }),
    ]),
    office('passport', 'ที่ทำการหนังสือเดินทาง / ตรวจคนเข้าเมือง', 'หนังสือเดินทาง', '📕', [
      sx('passport', 'ทำหนังสือเดินทาง (อายุ 5 ปี) 1,000 ฿', '📕', 'ต้องมีบัตรประชาชน ใช้เวลา 3 วัน ใช้แทนบัตรประชาชนในธุรกรรมธนาคาร', { req: ['idcard'], run: () => UI.open('คำขอหนังสือเดินทาง', null, ppForm), st: () => status('passport') }),
    ], { hrs: { wd: [8.5, 16.5], sat: [9, 12] } }),
    office('municipal', 'เทศบาลตำบลสุขใจ (กองช่าง)', 'ใบอนุญาตก่อสร้าง', '🏗️', [
      sx('build', 'ขออนุญาตก่อสร้างอาคาร (อ.1) สำหรับที่ดินของคุณ', '🏗️', 'ค่าธรรมเนียม 1,500 ฿ ตรวจแบบ 2 วัน ต้องมีบัตรประชาชน + ทะเบียนบ้าน และที่ดินของคุณ', { req: ['idcard', 'housereg'], run: () => UI.open('ขออนุญาตก่อสร้าง', null, () => { const L = lotsOwned(); return L.length ? `<p class="lead">เลือกที่ดินที่จะก่อสร้างบ้าน</p><div class="grid">${L.map(l => { const k = 'buildhome:' + l.id, d = rec(k), app = st().apps.find(a => a.key === k && a.st !== 'done'); return `<div class="card"><div class="ci">🏗️</div><div class="cb"><h4>${esc(l.n)}</h4><p class="dim">${d ? status(k, d) : app ? `⏳ กำลังตรวจแบบ (เสร็จ${RD(app.due)})` : 'ยังไม่มีใบอนุญาต'}</p>${!d && !app ? `<button class="btn" data-a="g24bld" data-v="${l.id}">ยื่นคำขอ ${baht(1500)}</button>` : ''}</div></div>`; }).join('')}</div>` : '<p class="empty">ยังไม่มีที่ดินที่ซื้อไว้ (ซื้อที่ดินจากข้างถนนหรือแอปทรัพย์สิน)</p>'; }) }),
    ]),
    office('tambon', 'องค์การบริหารส่วนตำบลสุขใจ (งานจัดเก็บรายได้)', 'ภาษีที่ดินและสิ่งปลูกสร้าง', '🏘️', [
      sx('landtax', 'ชำระภาษีที่ดินและสิ่งปลูกสร้าง', '🏘️', 'ออกใบแจ้งต้นปีภาษี ชำระภายใน 28 วัน เกินกำหนดปรับ 20%', { req: ['idcard'], run: () => landTaxUI(), st: () => unpaidBills().length ? `<span class="bad">ค้างชำระ ${unpaidBills().length} ใบ</span>` : '<span class="good">ไม่มีภาษีค้าง</span>' }),
    ]),
    office('police', 'กองทะเบียนประวัติอาชญากร (สถานีตำรวจสุขใจ)', 'ตำรวจ', '👮', [
      sx('crimrec', 'ใบรับรองความประพฤติ (ประวัติอาชญากรรม)', '📃', 'ใช้สมัครงานราชการ/สมัครเลือกตั้ง 100 ฿ อายุ 1 ปีเกม (84 วัน) (ต้องไม่มีใบสั่งค้าง)', { req: ['idcard'], can: () => finesDue().length ? 'มีใบสั่งค้างชำระ ไปชำระที่ศาลหรือสถานีตำรวจก่อน' : '', run: () => spend(15 + queue(), () => apply({ doc: 'crimrec', off: 'police', offName: 'สถานีตำรวจภูธรสุขใจ', fee: 100, days: 0 })), st: () => status('crimrec') }),
      sx('fines', 'ชำระค่าปรับตามใบสั่งจราจร', '🚔', 'ชำระภายใน 15 วัน เกินกำหนดค่าปรับเพิ่มเป็น 2 เท่า', { run: () => fineUI(), st: () => finesDue().length ? `<span class="bad">ค้าง ${finesDue().length} ใบ</span>` : '<span class="good">ไม่มีใบสั่งค้าง</span>' }),
    ], { hrs: { all: 1 } }),
    office('fire', 'สำนักงานป้องกันและบรรเทาสาธารณภัยจังหวัด', 'อัคคีภัย', '🧯', [
      sx('firecert', 'ใบรับรองตรวจความปลอดภัยอัคคีภัย (บ้าน/ไร่)', '🧯', 'ตรวจ 1 วัน ค่าธรรมเนียม 500 ฿ ลดเบี้ยประกันบ้าน 15%', { req: ['idcard'], run: () => spend(30 + queue(), () => apply({ doc: 'firecert', off: 'fire', offName: 'สำนักงานป้องกันและบรรเทาสาธารณภัย', fee: 500, days: 1 })), st: () => status('firecert') }),
    ]),
    office('agri', 'สำนักงานเกษตรอำเภอสุขใจ', 'เกษตรกร', '🌾', [
      sx('farmer', 'ขึ้นทะเบียนเกษตรกร (ทบก.)', '🌾', 'ฟรี ต่อทะเบียนทุกปี ได้เงินช่วยเหลือเกษตรกรทุกฤดู', { req: ['idcard', 'housereg'], run: () => spend(20 + queue(), () => apply({ doc: 'farmer', off: 'agri', offName: 'สำนักงานเกษตรอำเภอ', fee: 0, days: 0, data: { farm: S.farm || '' } })), st: () => status('farmer') }),
      sx('subsidy', 'ขอรับเงินช่วยเหลือเกษตรกรประจำฤดู', '💰', 'ฤดูละครั้ง = 1,500 ฿ × ระดับที่นา (ต้องขึ้นทะเบียนเกษตรกร)', { req: ['farmer'], can: () => st().subs === seasonKey() ? 'ฤดูนี้รับเงินช่วยเหลือไปแล้ว' : '', run: () => { const n = 1500 * (S.up.field || 1); st().subs = seasonKey(); earn(n); Bank2.income('เงินช่วยเหลือเกษตรกร', n); UI.toast(`รับเงินช่วยเหลือเกษตรกร ${baht(n)}`, '💰'); }, st: () => st().subs === seasonKey() ? '<span class="dim">รับแล้วในฤดูนี้</span>' : '<span class="good">รับได้</span>' }),
    ]),
    office('livestock', 'สำนักงานปศุสัตว์อำเภอสุขใจ', 'ปศุสัตว์', '🐄', [
      sx('livereg', 'ขึ้นทะเบียนฟาร์มปศุสัตว์', '🐄', 'จำเป็นเมื่อเลี้ยงสัตว์เกิน 5 ตัว ค่าธรรมเนียม 200 ฿ ต่อทุกปี', { req: ['idcard', 'housereg'], run: () => spend(20 + queue(), () => apply({ doc: 'livereg', off: 'livestock', offName: 'สำนักงานปศุสัตว์อำเภอ', fee: 200, days: 0 })), st: () => status('livereg') }),
    ]),
    office('fisheries', 'สำนักงานประมงอำเภอสุขใจ', 'ประมง', '🐟', [
      sx('fishreg', 'ขึ้นทะเบียนผู้ประกอบการประมง', '🐟', '300 ฿ ต่อปี ขายปลาได้ราคา +5% ผ่านตลาดกลาง', { req: ['idcard'], run: () => spend(20 + queue(), () => apply({ doc: 'fishreg', off: 'fisheries', offName: 'สำนักงานประมงอำเภอ', fee: 300, days: 0 })), st: () => status('fishreg') }),
    ]),
    office('health', 'สำนักงานสาธารณสุขอำเภอสุขใจ', 'สุขาภิบาล', '🥘', [
      sx('foodsan', 'อบรมและขอใบรับรองผู้สัมผัสอาหาร', '🥘', 'อบรม 2 ชม. 200 ฿ อายุ 2 ปี ใช้ขอใบอนุญาตจำหน่ายอาหาร', { req: ['idcard'], run: () => spend(120, () => apply({ doc: 'foodsan', off: 'health', offName: 'สำนักงานสาธารณสุขอำเภอ', fee: 200, days: 0 })), st: () => status('foodsan') }),
    ]),
    office('hospreg', 'งานเวชระเบียน โรงพยาบาลสุขใจ', 'เวชระเบียน', '🏥', [
      sx('hosp', 'ลงทะเบียนผู้ป่วย/ใบรับรองแพทย์/สิทธิรักษา', '🏥', 'ใช้บัตรประชาชนยืนยันสิทธิ ใบรับรองแพทย์ 100 ฿', { req: ['idcard'], run: () => { UI.close(); Phone.open('civhos'); } }),
    ]),
    office('edu', 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษาสุขใจ', 'การศึกษา', '🎓', [
      sx('edcert', 'ขอใบรับรองวุฒิการศึกษา/ใบแสดงผลการเรียน', '🎓', 'ต้องมีวุฒิ (กศน./ปวช. ฯลฯ) 50 ฿ ออกทันที ไม่มีวันหมดอายุ', { req: ['idcard'], can: () => ((typeof Civic !== 'undefined' && Civic.st().ed.certs) || []).length ? '' : 'ยังไม่มีวุฒิการศึกษาที่จบในระบบ ไปเรียนที่ตำบลก่อน', run: () => spend(10 + queue(), () => apply({ doc: 'edcert', off: 'edu', offName: 'สำนักงานเขตพื้นที่การศึกษา', fee: 50, days: 0, data: { certs: Civic.st().ed.certs.slice() } })), st: () => status('edcert') }),
    ]),
    office('customs', 'ด่านศุลกากรสุขใจ', 'ศุลกากร', '🛃', [
      sx('duty', 'คำนวณอากรและภาษีนำเข้า', '🛃', 'อากรขาเข้า 10% + VAT 7% ของมูลค่า CIF', { run: () => UI.open('คำนวณอากรนำเข้า', null, () => `<p class="lead">ป้อนมูลค่าสินค้า (บาท)</p>${inp('gfCif', 'เช่น 50000', '', 9)}<div class="row"><button class="btn" data-a="g24duty">คำนวณ</button></div><div id="gfDuty"></div>`) }),
    ]),
    office('post', 'ที่ทำการไปรษณีย์สุขใจ', 'ไปรษณีย์', '📮', [
      sx('parcel', 'ฝากส่งพัสดุเป็นของขวัญให้ชาวบ้าน (EMS)', '📦', 'เลือกของในกระเป๋า ค่าส่ง 40 ฿ เพิ่มมิตรภาพ', { run: () => UI.open('ส่งพัสดุ EMS', null, () => { const items = Object.keys(S.inv).filter(k => ITEMS[k] && S.inv[k] > 0).slice(0, 40), ppl = G.npcs.filter(n => !n.staff && n.name).slice(0, 12); return items.length && ppl.length ? `<p class="lead">ผู้รับ</p>${sel('gfTo', ppl.map(n => n.name))}<p class="lead">สิ่งของ</p>${sel('gfItem', items.map(k => [k, `${ITEMS[k].i} ${ITEMS[k].n} (มี ${S.inv[k]})`]))}<div class="row"><button class="btn" data-a="g24post">ส่ง 40 ฿</button></div>` : '<p class="empty">ไม่มีของในกระเป๋า</p>'; }) }),
    ], { hrs: { wd: [8, 17], sat: [8, 12] } }),
    office('court', 'ศาลจังหวัดสุขใจ (งานคดีจราจร/ค่าปรับ)', 'ศาล', '⚖️', [
      sx('fines', 'ชำระค่าปรับ / ตรวจสอบหมายเรียก', '⚖️', 'ใบสั่งจราจรค้างชำระต้องจ่ายก่อนต่อภาษีรถ', { run: () => fineUI(), st: () => finesDue().length ? `<span class="bad">ค้าง ${finesDue().length} ใบ</span>` : '<span class="good">ไม่มีใบสั่งค้าง</span>' }),
    ]),
    office('election', 'สำนักงานการเลือกตั้งจังหวัดสุขใจ (กกต.)', 'การเลือกตั้ง', '🗳️', [
      sx('voter', 'ขึ้นทะเบียนผู้มีสิทธิเลือกตั้ง', '🗳️', 'อายุ 18 ปีขึ้นไป ต้องมีบัตรประชาชน + ทะเบียนบ้าน ฟรี', { req: ['idcard', 'housereg'], can: () => age() >= 18 ? '' : 'ต้องมีอายุ 18 ปีขึ้นไป', run: () => spend(15 + queue(), () => apply({ doc: 'voter', off: 'election', offName: 'สำนักงานการเลือกตั้งจังหวัด', fee: 0, days: 0 })), st: () => status('voter') }),
      sx('cand', 'สมัครรับเลือกตั้ง', '🎤', 'ต้องมีสิทธิเลือกตั้ง + ใบรับรองความประพฤติ', { req: ['voter', 'crimrec'], run: () => { UI.close(); Phone.open('vote'); } }),
    ]),
    office('welfare', 'สำนักงานพัฒนาสังคมและความมั่นคงของมนุษย์จังหวัด (พม.)', 'สวัสดิการ', '💳', [
      sx('welfare', 'ลงทะเบียนบัตรสวัสดิการแห่งรัฐ', '💳', 'สำหรับผู้มีเงินสดน้อยกว่า 50,000 ฿ รับ 300 ฿ ทุก 28 วัน ต่อบัตรทุกปี', { req: ['idcard', 'housereg'], can: () => S.money >= 50000 ? 'รายได้/ทรัพย์สินเกินเกณฑ์ (เงินสดต้องน้อยกว่า 50,000 ฿)' : '', run: () => spend(25 + queue(), () => apply({ doc: 'welfare', off: 'welfare', offName: 'สำนักงานพัฒนาสังคมและความมั่นคงของมนุษย์', fee: 0, days: 0, data: { next: S.day + 28 } })), st: () => status('welfare') }),
    ]),
    office('draft', 'สำนักงานสัสดีอำเภอสุขใจ', 'เกณฑ์ทหาร', '🎖️', [
      sx('sd43', 'ตรวจเลือกทหารกองเกิน (จับใบดำ-ใบแดง)', '🎖️', 'ชายอายุ 21 ปีขึ้นไป ใบดำ = ผ่าน · ใบแดง = ต้องเข้ารับราชการทหาร 2 วัน', { req: ['idcard'], can: () => { const a = (rec('idcard') || {}).data; return a && a.sex === 'หญิง' ? 'ผู้หญิงไม่ต้องเข้ารับการเกณฑ์ทหาร' : age() < 21 ? 'ต้องมีอายุ 21 ปีขึ้นไป' : ''; }, run: () => UI.open('ตรวจเลือกทหารกองเกิน', null, () => `<p class="lead">ถึงเวลาจับสลากใบดำ-ใบแดง (ผู้สมัครใจเข้ารับราชการ ได้รับยกเว้นการจับสลาก)</p><div class="row"><button class="btn" data-a="g24draft">จับสลาก</button><button class="btn ghost" data-a="g24vol">สมัครใจเข้ารับราชการ 2 วัน</button></div>`), st: () => status('sd43') }),
    ]),
    office('pwa', 'การประปาส่วนภูมิภาคสาขาสุขใจ', 'ประปา', '💧', [
      sx('water', 'ขอใช้น้ำประปา / ติดตั้งมาตรวัดน้ำ / จ่ายบิล', '💧', 'ยื่นคำร้อง สำรวจ ชำระเงิน ติดตั้ง ใช้ในแอปการประปา', { req: ['idcard', 'housereg'], run: () => { UI.close(); Phone.open('water'); } }),
    ]),
    office('pea', 'การไฟฟ้าส่วนภูมิภาคอำเภอสุขใจ', 'ไฟฟ้า', '⚡', [
      sx('grid', 'ขอใช้ไฟฟ้า / ย้ายมิเตอร์ / ชำระบิล', '⚡', 'ยื่นคำร้อง ชำระบิล จ้างช่างไฟ', { req: ['idcard', 'housereg'], run: () => { UI.close(); GridApp.open(); } }),
    ]),
  ];
  OFFICES.forEach(o => { OFF_BY_ID[o.id] = o; });
  const seasonKey = () => `${Math.floor((S.day - 1) / (typeof SEASON_LEN !== 'undefined' ? SEASON_LEN : 21))}`;

  // ----- special screens -----
  const vehicleUI = () => UI.open('ทะเบียนรถและภาษีรถ', null, () => {
    const L = carList(), due = finesDue();
    if (!L.length) return '<p class="empty">ยังไม่มีรถยนต์ในชื่อคุณ</p>';
    return `${due.length ? `<p class="lead bad">⚠️ มีใบสั่งค้างชำระ ${due.length} ใบ ต้องชำระก่อนต่อภาษี</p>` : ''}<div class="grid">${L.map(({ c, i, n }) => { const s = carState(c), amt = carTaxAmt(c), late = s === 'late' ? (window.CarTax182 ? CarTax182.late(c) : Math.round(amt * 0.2)) : 0;
      return `<div class="card"><div class="ci">🚗</div><div class="cb"><h4>${esc(n)}</h4><p class="dim">${c.reg ? `ป้ายทะเบียน ${esc(c.reg.plate)} · ภาษีถึง${RD(c.tax)}` : '<span class="bad">ยังไม่จดทะเบียน (ขับบนถนนไม่ได้)</span>'}</p>
        ${s === 'unreg' ? `<button class="btn" data-a="g24vreg" data-v="${i}">จดทะเบียน + ภาษีปีแรก ${baht(500 + amt)}</button>` : `<button class="btn ${s === 'ok' && c.tax - S.day > 14 ? 'ghost' : ''}" data-a="g24vtax" data-v="${i}">ต่อภาษี + พ.ร.บ. 1 ปี ${baht(amt + late)}${late ? ' (รวมค่าปรับล่าช้า)' : ''}</button>`}</div></div>`; }).join('')}</div>`;
  });
  const vreg = i => { const c = S.cars[+i]; if (!c || c.reg || finesDue().length) { if (finesDue().length) UI.toast('ชำระใบสั่งค้างก่อน', '⚖️'); return; } const amt = 500 + carTaxAmt(c); if (!pay(amt, 'จดทะเบียนรถ + ภาษี')) return; c.reg = { plate: plate(+i), day: S.day }; c.tax = S.day + YD; UI.toast(`จดทะเบียนสำเร็จ ป้าย ${c.reg.plate}`, '🚗'); msg('กรมการขนส่งทางบก', `จดทะเบียนรถ ${(CARS[c.type] || {}).n} ป้าย ${c.reg.plate} ภาษีถึง${RD(c.tax)}`); UI.renderBody(); };
  const vtax = i => { const c = S.cars[+i]; if (!c || !c.reg) return; if (finesDue().length) { UI.toast('มีใบสั่งค้างชำระ ชำระที่ศาลก่อนต่อภาษี', '⚖️'); return; } const late = S.day > c.tax ? (window.CarTax182 ? CarTax182.late(c) : Math.round(carTaxAmt(c) * 0.2)) : 0, insp = window.CarTax182 ? CarTax182.insp(c) : 0, amt = carTaxAmt(c) + late + insp; if (!pay(amt, 'ภาษีรถ + พ.ร.บ.' + (insp ? ' + ตรวจสภาพรถ (ตรอ.)' : ''))) return; c.tax = Math.max(c.tax, S.day) + YD; UI.toast(`ต่อภาษีรถถึง${RD(c.tax)}`, '🚗'); UI.renderBody(); };
  UI.H.g24vreg = d => vreg(d.v); UI.H.g24vtax = d => vtax(d.v);
  const fineUI = () => UI.open('ใบสั่ง / ค่าปรับ', null, () => { const f = finesDue(); return f.length ? `<div class="grid">${f.map((x, i) => `<div class="card"><div class="ci">🚔</div><div class="cb"><h4>${esc(x.what)}</h4><p class="dim">ออก${RD(x.d)} · ครบกำหนด${RD(x.due)}${S.day > x.due ? ' <b class="bad">(เกินกำหนด ปรับ 2 เท่า)</b>' : ''}</p><button class="btn" data-a="g24fine" data-v="${st().fines.indexOf(x)}">ชำระ ${baht(x.amt)}</button></div></div>`).join('')}</div>` : '<p class="empty">ไม่มีใบสั่งค้างชำระ</p>'; });
  UI.H.g24fine = d => { const f = st().fines[+d.v]; if (!f || f.paid) return; if (!pay(f.amt, 'ชำระค่าปรับ: ' + f.what)) return; f.paid = S.day; UI.toast('ชำระค่าปรับแล้ว', '⚖️'); UI.renderBody(); };
  const landTaxUI = () => UI.open('ภาษีที่ดินและสิ่งปลูกสร้าง', null, () => { const b = unpaidBills(); return b.length ? `<div class="grid">${b.map(x => `<div class="card"><div class="ci">🏘️</div><div class="cb"><h4>${esc(x.what)}</h4><p class="dim">ปีภาษีที่ ${x.y + 1} · ครบกำหนด${RD(x.due)}${x.late ? ' <b class="bad">(รวมค่าปรับ 20%)</b>' : ''}</p><button class="btn" data-a="g24bill" data-v="${st().bills.indexOf(x)}">ชำระ ${baht(x.amt)}</button></div></div>`).join('')}</div>` : '<p class="empty">ไม่มีภาษีค้างชำระ</p>'; });
  UI.H.g24bill = d => { const b = st().bills[+d.v]; if (!b || b.paid) return; if (!pay(b.amt, 'ภาษีที่ดินและสิ่งปลูกสร้าง')) return; b.paid = S.day; UI.toast('ชำระภาษีที่ดินแล้ว', '🏘️'); UI.renderBody(); };
  UI.H.g24bld = d => { const k = 'buildhome:' + d.v; spend(30 + queue(), () => apply({ doc: 'buildhome', key: k, off: 'municipal', offName: 'เทศบาลตำบลสุขใจ', fee: 1500, days: 2, data: { lot: d.v } })); };
  UI.H.g24duty = () => { const v = +$v('gfCif'); if (!(v > 0)) { UI.toast('ใส่มูลค่าสินค้า', '⚠️'); return; } const duty = Math.round(v * 0.1), vat = Math.round((v + duty) * 0.07); document.getElementById('gfDuty').innerHTML = `<p class="lead">อากรขาเข้า 10% = ${baht(duty)}<br>VAT 7% = ${baht(vat)}<br><b>รวมภาษีนำเข้า ${baht(duty + vat)}</b> (ต้นทุนรวม ${baht(v + duty + vat)})</p>`; };
  UI.H.g24post = () => { const to = $v('gfTo'), it = $v('gfItem'); if (!to || !S.inv[it]) return; if (!pay(40, 'ค่าส่ง EMS')) return; takeItem(it, 1); try { Friends.add(to, 0.3); } catch (e) { } UI.toast(`ส่ง${ITEMS[it].n}ให้${to}แล้ว มิตรภาพเพิ่มขึ้น`, '📦'); UI.renderBody(); };
  UI.H.g24draft = () => { const red = Math.random() < 0.4; if (!red) { UI.close(); apply({ doc: 'sd43', off: 'draft', offName: 'สำนักงานสัสดีอำเภอ', fee: 0, days: 0, data: { card: 'ใบดำ' } }); UI.toast('จับได้ใบดำ ผ่านการเกณฑ์ทหาร', '⚫'); } else UI.open('จับได้ใบแดง', null, () => `<p class="lead bad">🔴 จับได้ใบแดง — ต้องเข้ารับราชการทหาร 2 วัน (ไร่และบ้านจะไม่มีคนดูแล)</p><div class="row"><button class="btn" data-a="g24serve">รับทราบ เข้ารับราชการ</button></div>`); };
  UI.H.g24vol = () => serve('สมัครใจ');
  UI.H.g24serve = () => serve('ใบแดง');
  const serve = how => { UI.close(); fade(() => { tick(60 * 24 * 2); S.energy = Math.max(30, S.energy); apply({ doc: 'sd43', off: 'draft', offName: 'สำนักงานสัสดีอำเภอ', fee: 0, days: 0, data: { card: how } }); UI.toast('ปลดประจำการแล้ว ได้รับหลักฐาน สด.43', '🎖️'); }); };

  // ================= office / hall UI =================
  const reqLine = ids => ids.map(id => `${has(id) ? '✅' : '❌'} ${esc(docName(id))}`).join(' · ');
  const officeBody = off => {
    const open = isOpen(off), mine = st().apps.filter(a => a.off === off.id && a.st !== 'done');
    return `<p class="lead">${open ? '🟢 เปิดให้บริการ' : '🔴 ปิดทำการ'} · ${hoursText(off)}</p>
      ${mine.length ? `<h5>📋 คำขอของคุณที่ค้างอยู่</h5><div class="grid">${mine.map(a => { const ready = S.day >= a.due; return `<div class="card"><div class="ci">${ready ? '📬' : '⏳'}</div><div class="cb"><h4>${esc(docName(a.key))}</h4><p class="dim">เลขที่คำขอ ${esc(a.no)} · ${ready ? 'เอกสารพร้อมรับ' : `เสร็จ${RD(a.due)}`}</p>${ready ? `<button class="btn" data-a="g24pick" data-v="${st().apps.indexOf(a)}" ${open ? '' : 'disabled'}>รับเอกสาร</button>` : ''}</div></div>`; }).join('')}</div>` : ''}
      <div class="grid">${off.sv.map(s => { const miss = (s.req || []).filter(id => !has(id)), why = s.can ? s.can() : '', blocked = !open || miss.length || why; return `<div class="card"><div class="ci">${s.i}</div><div class="cb"><h4>${esc(s.n)}</h4><p class="dim">${esc(s.d)}</p>${s.req ? `<p class="dim">ต้องมี: ${reqLine(s.req)}</p>` : ''}${s.st ? `<p class="dim">สถานะ: ${s.st()}</p>` : ''}${why ? `<p class="dim bad">${esc(why)}</p>` : ''}<button class="btn" data-a="g24sv" data-v="${off.id}" data-k="${s.id}">${!open ? 'ปิดทำการ' : miss.length ? 'เอกสารไม่ครบ' : 'ดำเนินการ'}</button></div></div>`; }).join('')}</div>`;
  };
  const officeUI = id => { const off = OFF_BY_ID[id]; if (!off) return; UI.open(off.n, null, () => officeBody(off)); };
  UI.H.g24sv = d => {
    const off = OFF_BY_ID[d.v], s = off && off.sv.find(x => x.id === d.k); if (!s) return;
    if (!isOpen(off)) { UI.toast(`${off.n} ปิดทำการ (${hoursText(off)})`, '🕒'); return; }
    const miss = (s.req || []).find(id => !has(id)); if (miss) { UI.toast(whyMissing(miss), '🪪'); return; }
    const why = s.can ? s.can() : ''; if (why) { UI.toast(why, '⚠️'); return; }
    s.run();
  };
  UI.H.g24pick = d => { const a = st().apps[+d.v]; if (!a || a.st === 'done' || S.day < a.due) return; const off = OFF_BY_ID[a.off]; if (off && !isOpen(off)) { UI.toast('ปิดทำการ มารับในเวลาราชการ', '🕒'); return; } a.st = 'done'; grant(a.key, a.data, a.offName, 'รับ'); UI.renderBody(); };
  UI.H.g24off = d => officeUI(d.v);

  // ================= phone app =================
  const walletHtml = () => {
    const x = st(), ids = Object.keys(DOCS).filter(k => k !== 'buildhome'), keys = ['idcard'].concat(ids.filter(k => k !== 'idcard' && x.docs[k]), Object.keys(x.docs).filter(k => k.startsWith('buildhome:')));
    let h = rec('idcard') ? cardHtml('idcard') : `<p class="lead bad">🪪 คุณยังไม่มีบัตรประจำตัวประชาชน — ไปทำที่ ${hallWhere()} (ฝ่ายทะเบียนราษฎร) ก่อน จึงจะซื้อรถ ซื้อที่ ขอสินเชื่อ จดบริษัท และสมัครอินเทอร์เน็ตได้</p>`;
    const cars = carList();
    h += `<h5>เอกสารอื่น ๆ</h5><div class="grid">${keys.filter(k => k !== 'idcard').map(k => `<div class="card"><div class="ci">${DOCS[k.split(':')[0]].i}</div><div class="cb"><h4>${esc(docName(k))}</h4><p class="dim">เลขที่ ${esc(x.docs[k].no)} · ${status(k)}</p></div></div>`).join('')}
      <div class="card"><div class="ci">🪪</div><div class="cb"><h4>ใบอนุญาตขับขี่</h4><p class="dim">${S.license ? `<span class="good">✅ ใช้ได้${S.licExp ? ` ถึง${RD(S.licExp)}` : ''}</span>${S.lic2 ? ' · รถบรรทุก ประเภท 2' : ''}` : '<span class="bad">ไม่มี/หมดอายุ</span>'}</p></div></div>
      ${cars.map(({ c, n }) => `<div class="card"><div class="ci">🚗</div><div class="cb"><h4>ทะเบียนรถ ${esc(n)}</h4><p class="dim">${c.reg ? `ป้าย ${esc(c.reg.plate)} · ภาษีถึง${RD(c.tax)} ${S.day > c.tax ? '<b class="bad">ขาดต่อ</b>' : '<span class="good">✅</span>'}` : '<span class="bad">ยังไม่จดทะเบียน</span>'}</p></div></div>`).join('')}</div>`;
    return h;
  };
  const appsHtml = () => {
    const x = st(), P = x.apps.filter(a => a.st !== 'done'), F = finesDue(), B = unpaidBills();
    return `<h5>📋 คำขอที่กำลังดำเนินการ</h5>${P.length ? `<div class="grid">${P.map(a => `<div class="card"><div class="ci">${S.day >= a.due ? '📬' : '⏳'}</div><div class="cb"><h4>${esc(docName(a.key))}</h4><p class="dim">${esc(a.no)} · ${S.day >= a.due ? 'พร้อมรับที่ ' + esc((OFF_BY_ID[a.off] || {}).n || '') : 'เสร็จ' + RD(a.due)}</p></div></div>`).join('')}</div>` : '<p class="empty">ไม่มีคำขอค้าง</p>'}
      <h5>🚔 ใบสั่ง / ค่าปรับ</h5>${F.length ? F.map(f => `<p class="lead bad">${esc(f.what)} ${baht(f.amt)} (ครบกำหนด${RD(f.due)})</p>`).join('') : '<p class="empty">ไม่มีใบสั่งค้าง</p>'}
      <h5>🏘️ ภาษีที่ดิน</h5>${B.length ? B.map(f => `<p class="lead bad">${esc(f.what)} ${baht(f.amt)} (ครบกำหนด${RD(f.due)})</p>`).join('') : '<p class="empty">ไม่มีภาษีค้าง</p>'}`;
  };
  const dirHtml = () => `<p class="lead">🏛️ ${hallWhere()} — ${OFFICES.length} หน่วยงานในอาคารเดียว (เดินเข้าไปที่เคาน์เตอร์แต่ละแห่ง) เวลาทำการ: จ-ศ 07:30–18:00 · ส 08:00–16:00 · วันหยุดราชการเปิดบางเคาน์เตอร์ 09:00–15:00</p><div class="grid">${OFFICES.map(o => `<div class="card"><div class="ci">${o.i}</div><div class="cb"><h4>${esc(o.n)}</h4><p class="dim">${esc(o.sv.map(s => s.n).join(' · '))}</p><p class="dim">${isOpen(o) ? '🟢' : '🔴'} ${hoursText(o)}</p></div></div>`).join('')}</div>`;
  const onlineHtml = () => {
    const L = carList().filter(({ c }) => c.reg), F = finesDue(), B = unpaidBills();
    return `<p class="lead">บริการออนไลน์ (ตลอด 24 ชม. ต้องมีบัตรประชาชนที่ไม่หมดอายุ)</p>
      <h5>🚗 ต่อภาษีรถออนไลน์</h5>${L.length ? L.map(({ c, i, n }) => `<div class="row"><span class="lead">${esc(n)} · ${esc(c.reg.plate)} (ถึง${RD(c.tax)})</span><button class="btn ghost" data-a="g24vtax" data-v="${i}">ต่อ ${baht(carTaxAmt(c))}</button></div>`).join('') : '<p class="empty">ไม่มีรถที่จดทะเบียนแล้ว</p>'}
      <h5>🚔 ชำระค่าปรับ</h5>${F.length ? F.map(f => `<div class="row"><span class="lead">${esc(f.what)}</span><button class="btn ghost" data-a="g24fine" data-v="${st().fines.indexOf(f)}">${baht(f.amt)}</button></div>`).join('') : '<p class="empty">ไม่มี</p>'}
      <h5>🏘️ ภาษีที่ดิน</h5>${B.length ? B.map(f => `<div class="row"><span class="lead">${esc(f.what)}</span><button class="btn ghost" data-a="g24bill" data-v="${st().bills.indexOf(f)}">${baht(f.amt)}</button></div>`).join('') : '<p class="empty">ไม่มี</p>'}`;
  };
  const appOpen = () => UI.open('🏛️ ราชการ (e-Service)', ['กระเป๋าเอกสาร', 'คำขอ & ใบสั่ง', 'หน่วยงาน', 'ออนไลน์'], t => t === 0 ? walletHtml() : t === 1 ? appsHtml() : t === 2 ? dirHtml() : (has('idcard') ? onlineHtml() : `<p class="lead bad">${whyMissing('idcard')}</p>`));
  APPS.push({ id: 'gov24', i: '🏛️', n: 'ราชการ' });
  Phone.apps.gov24 = () => { setTimeout(() => { Phone.app = null; UI.close(); appOpen(); }, 0); return ''; };
  if (typeof APP_GROUPS !== 'undefined') { const gr = APP_GROUPS.find(x => /บริการ/.test(x[0])) || APP_GROUPS[APP_GROUPS.length - 1]; if (gr) gr[1].unshift('gov24'); }

  // ================= the service centre building =================
  ROOM_KIND.gov = { w: 32, d: 20, floor: 0xe8e0d0, wall: 0xfdf6e3, title: 'ศูนย์ราชการอำเภอสุขใจ' };
  const _rb = Rooms.build;
  Rooms.build = function (def, K) {
    _rb.call(this, def, K);
    if (def.kind !== 'gov') return;
    const g = this.group, X = RM0.x, Z = RM0.z, W = K.w, D = K.d, per = [9, 9, 8], zs = [-D / 2 + 2.6, -1.4, 4.6];
    const looks = ['toon:chic', 'toon:suit', 'Olivia', 'Erika', 'toon:civil', 'toon:jacket', 'Lydia', 'Kate'];
    let n = 0;
    for (let r = 0; r < 3; r++) for (let c = 0; c < per[r]; c++, n++) {
      const off = OFFICES[n]; if (!off) continue;
      const x = -W / 2 + 2.2 + c * ((W - 4.4) / (per[r] - 1)), z = zs[r];
      U.mk(g, GEO.box, mc(0x8d6e63), [X + x, 0.53, Z + z], [2.5, 1.05, 0.7]); this.cols.push(Col.box(X + x, Z + z, 1.25, 0.35, 0));
      U.mk(g, GEO.box, mc(0xeeeeee), [X + x, 1.08, Z + z], [2.6, 0.06, 0.8]);
      const sg = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.55), new THREE.MeshBasicMaterial({ map: U.signTex(off.s, { w: 384, h: 90, bg: '#1a237e' }) })); sg.position.set(X + x, 2.3, Z + z - 0.45); g.add(sg);
      const o = Models.human(Object.assign({ skin: 0xe0a87e, hair: 0x1b120c }, { avatar: looks[n % looks.length] })); o.position.set(X + x, 0, Z + z - 0.9); g.add(o); this.staff.push(o);
      this.pois.push({ kind: 'act', x: X + x, z: Z + z + 1.0, r: 1.45, label: off.s, icon: off.i, act: () => ({ icon: off.i, label: `${off.n}`, fn: () => officeUI(off.id) }) });
    }
    this.pois.push({ kind: 'act', x: X + W / 2 - 2, z: Z + D / 2 - 1.2, r: 1.4, label: 'ตู้กดบัตรคิว / ข้อมูลหน่วยงาน', icon: '🎫', act: () => ({ icon: '🎫', label: 'ดูหน่วยงานและเวลาทำการ', fn: () => UI.open('ศูนย์ราชการอำเภอสุขใจ', null, dirHtml) }) });
    this.pois.push({ kind: 'act', x: X - W / 2 + 2, z: Z + D / 2 - 1.2, r: 1.4, label: 'กระเป๋าเอกสารของฉัน', icon: '🪪', act: () => ({ icon: '🪪', label: 'ดูเอกสารที่มี', fn: () => UI.open('กระเป๋าเอกสาร', null, walletHtml) }) });
  };

  // ---- street alignment: public buildings sit on the same building line as their neighbours (shared with v28_walkin) ----
  const AL = window.Align32 = {
    boxes() { const seen = new Set(), out = []; for (const arr of Col.map.values()) for (const b of arr) if (b.type === 'b' && !seen.has(b)) { seen.add(b); out.push(b); } return out; },
    corners: (px, pz, hw, hd, rot) => [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([a, b]) => l2w(px, pz, rot, a, b)),
    sat(A, B) {
      const cs = (R) => AL.corners(R.x, R.z, R.hw, R.hd, R.rot), pa = cs(A), pb = cs(B), axes = r => [[Math.cos(r), -Math.sin(r)], [Math.sin(r), Math.cos(r)]];
      for (const ax of axes(A.rot).concat(axes(B.rot))) {
        let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9;
        for (const q of pa) { const v = q.x * ax[0] + q.z * ax[1]; a0 = Math.min(a0, v); a1 = Math.max(a1, v); }
        for (const q of pb) { const v = q.x * ax[0] + q.z * ax[1]; b0 = Math.min(b0, v); b1 = Math.max(b1, v); }
        if (a1 <= b0 || b1 <= a0) return false;
      }
      return true;
    },
    // road distance (from the road edge) of the face a box turns to the road, and which way that is
    front(b) {
      let best = null; for (let r = 0; r < 4; r++) { const rot = b.rot + r * Math.PI / 2, f = r % 2 ? b.hw : b.hd, q = l2w(b.x, b.z, rot, 0, f + 0.6), d = roadDist(q.x, q.z); if (!best || d < best.d) best = { d, rot }; }
      return best;
    },
    // the building line of the neighbours around a point (median front distance), or the village default
    line(px, pz, boxes, skip) {
      const ds = boxes.filter(b => b !== skip && Math.hypot(b.x - px, b.z - pz) < 45 && b.hw * 2 > 8 && b.hd * 2 > 6).map(b => AL.front(b).d).filter(d => d > 6 && d < 20).sort((a, b) => a - b);
      return ds.length >= 2 ? ds[ds.length >> 1] : 11;
    },
    check(px, pz, rot, w, d, boxes, o) {
      const gy = World.groundY(px, pz); if (!(gy > -0.2)) return 'ground';
      for (const [ox, oz] of [[w / 2, d / 2], [-w / 2, d / 2], [w / 2, -d / 2], [-w / 2, -d / 2]]) { const c = l2w(px, pz, rot, ox, oz); if (Math.abs(World.groundY(c.x, c.z) - gy) > 0.8) return 'slope'; if (roadDist(c.x, c.z) < 6.5) return 'road'; }
      const fq = l2w(px, pz, rot, 0, d / 2 + 0.6), fr = roadDist(fq.x, fq.z), ahead = l2w(px, pz, rot, 0, d / 2 + 7);
      const tgt = o.target != null ? o.target : AL.line(px, pz, boxes, null);
      if (Math.abs(fr - tgt) > 1.5 || roadDist(ahead.x, ahead.z) > fr - 2) return 'line';
      const me = { x: px, z: pz, hw: w / 2 + 1.4, hd: d / 2 + 1.4, rot };
      if (boxes.some(b => Math.hypot(b.x - px, b.z - pz) < (b.br || 15) + 16 && !(o.skip && o.skip(b)) && AL.sat(me, { x: b.x, z: b.z, hw: b.hw, hd: b.hd, rot: b.rot }))) return 'bld';
      const door = l2w(px, pz, rot, 0, d / 2 + 1.7);
      if (boxes.some(b => !(o.skip && o.skip(b)) && AL.sat({ x: door.x, z: door.z, hw: 1.2, hd: 1.2, rot: 0 }, { x: b.x, z: b.z, hw: b.hw, hd: b.hd, rot: b.rot }))) return 'door';
      const inRect = (q) => { const dx = q.x - px, dz = q.z - pz, c = Math.cos(rot), sn = Math.sin(rot), lx = dx * c - dz * sn, lz = dx * sn + dz * c; return Math.abs(lx) < w / 2 + 1.5 && Math.abs(lz) < d / 2 + 1.5; };
      if (World.pois.some(inRect)) return 'poi';
      if (typeof LOTS !== 'undefined' && LOTS.some(l => Math.hypot(l.x - px, l.z - pz) < 13)) return 'lot';
      if (typeof P23 !== 'undefined' && P23.slots && P23.slots.some(q => Math.hypot(q.x - px, q.z - pz) < 13)) return 'p23';
      if (typeof Collide !== 'undefined' && Collide.covered && Collide.covered(px, pz)) return 'covered';
      return '';
    },
    // first the listed spots, then rings around the preferred centre; the door always faces the nearest road
    find(o) {
      const boxes = AL.boxes(), w = o.w, d = o.d, tryAt = (px, pz, rot) => !AL.check(px, pz, rot, w, d, boxes, o);
      for (const [px, pz, rot] of o.fixed || []) if (tryAt(px, pz, rot)) return { x: px, z: pz, rot };
      for (let rad = 0; rad <= (o.rMax || 110); rad += 3) for (let k = 0; k < (rad ? 24 : 1); k++) {
        const a = (k / 24) * Math.PI * 2 + rad * 0.17, px = (o.cx || 0) + Math.cos(a) * rad, pz = (o.cz || -235) + Math.sin(a) * rad;
        let best = null; for (let r = 0; r < 4; r++) { const rot = r * Math.PI / 2, f = l2w(px, pz, rot, 0, d / 2 + 0.6), dd = roadDist(f.x, f.z); if (!best || dd < best.d) best = { d: dd, rot }; }
        if (tryAt(px, pz, best.rot)) return { x: px, z: pz, rot: best.rot };
      }
      return null;
    },
  };
  const HALL = { w: 15, d: 10, h: 5 };
  const findSpot = () => {
    const x = st();
    if (x.hall && x.hall.v === 2) return x.hall;
    // saves from before the alignment fix have the hall pushed into the roadside: put it on the street line (a spot that is still fine is kept)
    const old = x.hall && !x.hall.v ? x.hall : null;
    const sp = AL.find({ w: HALL.w, d: HALL.d, cx: 0, cz: -235, rMax: 130, fixed: [[19.7, -236, -Math.PI / 2], [-19.7, -200, Math.PI / 2]], skip: b => old && Math.hypot(b.x - old.x, b.z - old.z) < 1 }) || { x: 19.7, z: -236, rot: -Math.PI / 2 };
    x.hall = { x: sp.x, z: sp.z, rot: sp.rot, v: 2 }; return x.hall;
  };
  const buildHall = () => {
    const h = findSpot(), o = { w: HALL.w, d: HALL.d, h: HALL.h, flat: true, glassFront: true, wall: 0xfff8e1, roof: 0x1a237e, sign: 'ศูนย์ราชการอำเภอสุขใจ', signStyle: { bg: '#1a237e' } };
    // the old building of a pre-fix save was built at its saved place before this spot was chosen: it is not built any more, only its collision box is gone with the session
    const b = World.building(o); b.position.set(h.x, World.groundY(h.x, h.z), h.z); b.rotation.y = h.rot; World.outdoor.add(b); Col.box(h.x, h.z, o.w / 2 + 0.3, o.d / 2 + 0.3, h.rot, 'bld'); World.clearNear(h.x, h.z, 12, true);
    const door = l2w(h.x, h.z, h.rot, 0, o.d / 2 + 1.7);
    World.pois.push({ kind: 'act', x: door.x, z: door.z, r: 2.6, label: 'ศูนย์ราชการอำเภอสุขใจ', icon: '🏛️', map: true, room: { kind: 'gov', title: 'ศูนย์ราชการอำเภอสุขใจ' }, act: () => ({ icon: '🏛️', label: 'เข้าศูนย์ราชการ', fn: () => UI.open('ศูนย์ราชการอำเภอสุขใจ', null, dirHtml) }) });
    st().hallDoor = { x: Math.round(door.x), z: Math.round(door.z) };
  };

  // ================= gates: every transaction asks the wallet =================
  const gate = (obj, fn, check) => { const o = obj && obj[fn]; if (typeof o !== 'function') return; obj[fn] = function (...a) { if (!check.apply(this, a)) return; return o.apply(this, a); }; };
  gate(Estate, 'buy', () => need(['idcard', 'housereg'], 'ซื้ออสังหาริมทรัพย์'));
  gate(Estate, 'sell', () => { const b = unpaidBills(); if (b.length) { UI.toast(`ขายไม่ได้: ค้างภาษีที่ดินและสิ่งปลูกสร้าง ${b.length} ใบ — ชำระที่ อบต.สุขใจ`, '🏘️'); return false; } return need(['idcard'], 'ขายอสังหาริมทรัพย์'); });
  gate(HomeBuild, 'buy', () => need(['idcard', 'housereg'], 'ซื้อที่ดิน'));
  gate(HomeBuild, 'build', id => need(['idcard', 'buildhome:' + id], 'เริ่มก่อสร้างบ้าน'));
  gate(Company, 'register', () => need(['idcard'], 'จดทะเบียนบริษัท'));
  gate(Bank2, 'borrow', n => need(['idcard'].concat(n >= 10000 ? ['housereg'] : [], n >= 30000 ? ['taxcert'] : []), 'ขอสินเชื่อ ' + baht(n)));
  gate(ISP, 'order', () => need(['idcard', 'housereg'], 'สมัครอินเทอร์เน็ต'));
  gate(SIMs, 'add', () => need(['idcard'], 'ลงทะเบียนซิม'));
  gate(Career, 'apply', k => { const C = JOBS2[k], a = (rec('idcard') || {}).data || {}; return need(['idcard'].concat(C && C.gov ? ['crimrec'] : [], C && C.gov && a.sex === 'ชาย' && age() >= 21 ? ['sd43'] : []), 'สมัครงาน'); });
  gate(Elect, 'register', () => need(['idcard', 'voter', 'crimrec'], 'สมัครรับเลือกตั้ง'));
  gate(DriveSchool, 'klass', () => need(['idcard'], 'สอบใบขับขี่'));
  if (typeof buyCar === 'function') { const _bc = buyCar; buyCar = function (type, where) { if (!need(['idcard'], 'ซื้อรถ')) return; _bc(type, where); const c = S.cars[S.cars.length - 1]; if (c && !c.reg) { c.reg = null; c.tax = 0; c.bought = S.day; msg('กรมการขนส่งทางบก', `ซื้อรถ ${(CARS[type] || {}).n} แล้ว ต้องจดทะเบียนที่ขนส่งจังหวัดภายใน 7 วัน (ป้ายทะเบียน 500 ฿ + ภาษีปีแรก) ถ้าไม่จดจะขับบนถนนไม่ได้`); } }; }
  if (typeof buyAnimal === 'function') { const _ba = buyAnimal; buyAnimal = function (type) { if (S.animals.length >= 5 && !need(['livereg'], `เลี้ยงสัตว์เกิน 5 ตัว (มี ${S.animals.length})`)) return; return _ba(type); }; }
  if (typeof priceMult === 'function') { const _pm = priceMult; priceMult = function (id) { const r = _pm(id), it = ITEMS[id]; return it && it.cat === 'fish' && has('fishreg') ? r * 1.05 : r; }; }
  { const _ib = Ins.buy.bind(Ins); Ins.buy = function (k) { if (k === 'home' && has('firecert') && INS.home) { const p = INS.home.price; INS.home.price = Math.round(p * 0.85); try { return _ib(k); } finally { INS.home.price = p; } } return _ib(k); }; }
  { const _r = Ins.rights.bind(Ins); Ins.rights = function () { const r = _r(); const d = rec('ssoreg'); return r === 'ucs' && d && live(d) && d.data && d.data.paidUntil >= S.day ? 'sso' : r; }; }

  // ================= days: processing, expiry notices, fines, taxes =================
  const daily = () => {
    const x = st();
    if (!x.mig168) { x.mig168 = 1; for (const k of Object.keys(x.docs)) { const d = x.docs[k], D = DOCS[k.split(':')[0]]; if (d && d.exp && !d.temp && d.issued != null && D && D.life && d.issued + D.life > d.exp) d.exp = d.issued + D.life; } }
    if (!x.mig191) { x.mig191 = 1; for (const k of Object.keys(x.docs)) { const d = x.docs[k], D = DOCS[k.split(':')[0]]; if (d && d.exp && !d.temp && d.issued != null && D && D.life && d.issued + D.life > d.exp) d.exp = d.issued + D.life; else if (d && d.temp && d.exp - d.issued < 42) d.exp = d.issued + 42; } if (S.license && S.licExp && S.licExp < S.day + 9000) S.licExp = Math.max(S.licExp, S.day + 5 * YD); }
    for (const a of x.apps) if (a.st === 'pending' && S.day >= a.due && !a.told) { a.told = 1; msg((OFF_BY_ID[a.off] || {}).n || 'ศูนย์ราชการ', `คำขอ ${docName(a.key)} (${a.no}) ตรวจเสร็จแล้ว มารับเอกสารที่เคาน์เตอร์ในเวลาราชการ`); }
    // expiry notices 7 days ahead and on the day
    for (const k of Object.keys(x.docs)) { const d = x.docs[k]; if (!d.exp) continue; const left = d.exp - S.day; for (const t of [30, 7, 0]) if (left === t && !x.warn[k + d.exp + t]) { x.warn[k + d.exp + t] = 1; msg((OFF_BY_ID[DOCS[k.split(':')[0]].off] || {}).n || 'ศูนย์ราชการ', t ? `${docName(k)} จะหมดอายุในอีก ${t} วัน ต่ออายุได้ที่ ${hallWhere()}` : `${docName(k)} หมดอายุวันนี้ หลังจากนี้ใช้ทำธุรกรรมไม่ได้`); } }
    // vehicles: tax reminders + 7-day registration deadline
    for (const c of S.cars) { if (c.reg && c.tax - S.day === 7) msg('กรมการขนส่งทางบก', `ภาษีรถ ${(CARS[c.type] || {}).n} จะหมดอายุในอีก 7 วัน ต่อออนไลน์ได้ในแอปราชการ`); if (!c.reg && c.bought && S.day - c.bought === 7) msg('กรมการขนส่งทางบก', `รถ ${(CARS[c.type] || {}).n} ยังไม่ได้จดทะเบียน ขับบนถนนอาจถูกปรับ`); }
    // overdue fines double once
    for (const f of x.fines) if (!f.paid && !f.dbl && S.day > f.due) { f.dbl = 1; f.amt *= 2; msg('ศาลจังหวัดสุขใจ', `ใบสั่ง "${f.what}" เกินกำหนด ค่าปรับเพิ่มเป็น ${baht(f.amt)}`); }
    // land tax bills at the start of each tax year
    { const dt = Cal36.date(); if (dt.m === 3 && dt.dom >= 1 && x.billY !== dt.y) {
      x.billY = dt.y;
      const add = (what, amt) => { amt = Math.round(amt); if (amt < 20) return; x.bills.push({ what, amt, y: x.billY, due: Cal36.dayOf(dt.y, 3, 30) }); };
      if (S.est) for (const k of Object.keys(S.est.own || {})) { const P = PROPS.find(p => p.k === k); if (P) add('ภาษีที่ดินและสิ่งปลูกสร้าง: ' + P.n, Estate.price(P) * (k === 'land1' ? 0.003 : 0.0005)); }   // vacant land 0.3 %, other homes 0.02-0.1 %
      { const hb = HomeBuild.st().lots || {}; let mainDone = false; for (const L of lotsOwned()) { const built = !!(hb[L.id] && hb[L.id].design); if (built && !mainDone) { mainDone = true; continue; }   /* the home you live in: exempt */ add('ภาษีที่ดิน: ' + L.n, L.price * (built ? 0.0002 : 0.003)); } }
      if (x.bills.some(b => !b.paid && b.y === x.billY)) msg('อบต.สุขใจ', 'ใบแจ้งภาษีที่ดินและสิ่งปลูกสร้างประจำปีออกแล้ว ชำระภายในสิ้นเดือนเมษายน ดูในแอปราชการ (ที่ดินเกษตรและบ้านหลังหลักได้รับยกเว้น)');
    } }
    for (const b of x.bills) if (!b.paid && !b.late && S.day > b.due) { b.late = 1; b.amt = Math.round(b.amt * 1.4); msg('อบต.สุขใจ', `${b.what} เกินกำหนด เสียเงินเพิ่ม 40% เป็น ${baht(b.amt)}`); }
    // monthly: social security premium and welfare card
    const so = x.docs.ssoreg; if (so && !so.data) so.data = { paidUntil: S.day + 28 }; if (so && S.day > so.data.paidUntil && (S.day - so.issued) % 28 === 0 && !window.Bills84) { if (S.money >= 70) { S.money -= 70; Bank2.log('เงินสมทบประกันสังคม ม.40', -70); so.data.paidUntil = S.day + 28; } else msg('สำนักงานประกันสังคม', 'ขาดส่งเงินสมทบ ม.40 สิทธิประกันสังคมถูกระงับ'); }
    if (so && window.Bills84 && so.data && S.day === so.data.paidUntil + 8) msg('สำนักงานประกันสังคม', 'ขาดส่งเงินสมทบ ม.40 เกิน 7 วัน สิทธิประกันสังคมถูกระงับ ชำระที่แอปธนาคาร › บิล');
    const wf = x.docs.welfare; if (wf && live(wf) && S.day >= wf.data.next) { wf.data.next = S.day + 28; if (S.money < 100000) { earn(300); Bank2.income('บัตรสวัสดิการแห่งรัฐ', 300); msg('พม.', 'โอนเงินบัตรสวัสดิการแห่งรัฐ 300 ฿ เข้าบัญชีแล้ว'); } }
    // temporary papers for old saves
    for (const id of ['idcard', 'housereg']) { const d = x.docs[id]; if (d && d.temp && d.exp - S.day === 3) msg('ที่ว่าการอำเภอสุขใจ', `${docName(id)}ชั่วคราวจะหมดอายุในอีก 3 วัน ไปทำของจริงที่ศูนย์ราชการ`); }
  };
  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { daily(); } catch (e) { console.warn('gov24 daily', e); } return r; }; }
  // police checkpoints: driving an unregistered or untaxed car on the road
  { const _h = Emergency.hourly.bind(Emergency);
    Emergency.hourly = function () {
      _h();
      try {
        const o = G.driving, c = o && o.d; if (!c || G.away || !Number.isFinite(c.x)) return;
        const s = c.reg ? (S.day > c.tax ? 'late' : 'ok') : 'unreg'; const x = st();
        if (s === 'ok' || x.ckDay === S.day || Math.random() > 0.18) return;
        x.ckDay = S.day; const what = s === 'unreg' ? 'ขับรถที่ไม่ได้จดทะเบียน' : 'ขับรถที่ภาษี/พ.ร.บ.ขาดต่อ';
        x.fines.push({ what, amt: s === 'unreg' ? 1500 : 800, d: S.day, due: S.day + 15 });
        UI.toast(`ด่านตรวจ: ${what} ถูกออกใบสั่ง ${baht(s === 'unreg' ? 1500 : 800)} ชำระภายใน 15 วัน`, '🚔');
        msg('สถานีตำรวจภูธรสุขใจ', `ใบสั่ง: ${what} ปรับ ${baht(s === 'unreg' ? 1500 : 800)} ชำระที่ศาลจังหวัดหรือแอปราชการภายใน 15 วัน`);
      } catch (e) { }
    }; }

  // ================= first run: new players apply for real papers, old saves get a short grace =================
  const x0 = st();
  if (!x0.init) {
    x0.init = 1;
    const legacy = S.day >= 3 || S.cars.length > 0 || (S.est && Object.keys(S.est.own || {}).length > 0) || (S.hb && Object.keys(S.hb.lots || {}).length > 0) || ((S.stats && S.stats.earned) || 0) > 3000 || (S.isp && S.isp.pkg);
    if (legacy) {
      const nm = (S.name || 'ผู้เล่น').split(/\s+/);
      x0.docs.idcard = { no: mkIdNo(), issued: S.day, exp: S.day + 42, temp: 1, data: { th: { pre: 'นาย', first: nm[0] || 'ผู้เล่น', last: nm[1] || '' }, en: { first: '', last: '' }, birth: { d: 1, m: 1, y: yearBE() - 25 }, addr: { no: '99/1', moo: 5, tam: 'สุขใจ' }, sex: 'ชาย', blood: 'O', rel: 'พุทธ' } };
      x0.docs.housereg = { no: docNo('HOU'), issued: S.day, exp: S.day + 42, temp: 1, data: { no: '99/1', type: 'เจ้าบ้าน', name: S.farm || '' } };
      S.cars.forEach((c, i) => { if (!c.reg) { c.reg = { plate: plate(i), day: S.day }; c.tax = S.day + YD; } });
      if (S.animals.length >= 6) x0.docs.livereg = { no: docNo('LIV'), issued: S.day, exp: S.day + YD, data: {} };
      for (const L of lotsOwned()) x0.docs['buildhome:' + L.id] = { no: docNo('BLD'), issued: S.day, exp: 0, data: { lot: L.id } };
      setTimeout(() => msg('ที่ว่าการอำเภอสุขใจ', `ระบบเอกสารราชการเริ่มใช้แล้ว: เราออกบัตรประชาชน/ทะเบียนบ้านชั่วคราวให้ใช้ได้ 14 วัน (ถึง${RD(S.day + 14)}) กรุณามากรอกข้อมูลทำบัตรจริงที่ ${hallWhere()}`), 2500);
    } else setTimeout(() => msg('ที่ว่าการอำเภอสุขใจ', `ยินดีต้อนรับ! ก่อนซื้อรถ ซื้อที่ดิน ขอสินเชื่อ จดบริษัท หรือสมัครอินเทอร์เน็ต ต้องมีบัตรประชาชนก่อน ไปทำที่ ${hallWhere()} (จ-ศ 07:30–18:00 · ส 08:00–16:00)`), 2500);
  }
  buildHall();
  window.Gov24 = { grantId: () => { const nm = (S.name || 'ชาวไร่').split(/s+/); return grant('idcard', { th: { pre: 'นาย', first: nm[0] || 'ชาวไร่', last: nm[1] || 'สุขใจ' }, en: { first: 'Farmer', last: 'Sukjai' }, birth: { d: 1, m: 1, y: yearBE() - 25 }, addr: { no: '99/1', moo: 5, tam: 'สุขใจ' }, sex: 'ชาย', blood: 'O', rel: 'พุทธ' }, 'ที่ว่าการอำเภอสุขใจ', 'ออก'); }, daily, has, need, docs: DOCS, rec, st, office: officeUI, wallet: walletHtml, hall: () => st().hall, offices: OFFICES };
});
