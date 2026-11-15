'use strict';
// ---------- v241_investors: outside investors ask to buy into your company ----------
// The villagers and friends are no longer the people you invite as shareholders (they rarely have the money). The people who come to you now are
//   - business owners (mill, hotel, transport, construction, clinic, wholesale, factory ...)   cls 'biz'   kind 'inv'
//   - wealthy private investors (heirs, angel investors, retired executives, doctors, lawyers)  cls 'rich'  kind 'inv'
//   - senior police and military officers (colonel / general ranks)                            cls 'officer' kind 'ofc'
// A serving officer may hold shares but cannot sit on the board or manage a company (civil-service rules); a retired officer can be a director.
// The offers arrive by themselves (v50 inbound offers) and are accepted in the "ผู้ถือหุ้น & นักลงทุน" tab; this file makes the people and puts them in the shareholder register used by the board.
V23.add('v241_investors', () => {
  const R = () => Math.random(), pick = a => a[Math.floor(R() * a.length)], clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const FIRST = ['สมชาย', 'วิชัย', 'ประสิทธิ์', 'ชัยวัฒน์', 'อนุชา', 'ธนากร', 'พิชัย', 'วีระ', 'สุรชัย', 'ปรีชา', 'กิตติ', 'เอกชัย', 'สมศักดิ์', 'ณัฐพงษ์', 'วรวุฒิ', 'ภานุ', 'สุรเชษฐ์', 'ธีรพงษ์', 'อภิชาติ', 'มานะ',
    'สุดารัตน์', 'วรรณา', 'นภา', 'จิราพร', 'อรทัย', 'กัลยา', 'ปราณี', 'พิมพ์ชนก', 'ศิริพร', 'ชุติมา', 'รัตนา', 'สุภาพร', 'นริศรา', 'ปวีณา'];
  const LAST = ['รุ่งเรือง', 'ศรีสุข', 'มั่งมี', 'แสงทอง', 'วงศ์ไทย', 'เกษตรสุข', 'บุญมา', 'ทองดี', 'พานิช', 'รักษา', 'สุขสันต์', 'ใจกว้าง', 'เจริญผล', 'ธนาวัฒน์', 'วัฒนากุล', 'พิพัฒน์กุล', 'ตั้งสกุล', 'อัศวเดช', 'ภูมิรัตน์', 'ชัยมงคล'];
  // [what they do, least money they can put in, most money they can put in]
  const BIZ = [['เจ้าของโรงสีข้าวและโกดังสินค้า', 4e6, 25e6], ['เจ้าของกลุ่มร้านวัสดุก่อสร้าง', 5e6, 30e6], ['เจ้าของโรงแรมและรีสอร์ต', 8e6, 60e6], ['เจ้าของบริษัทขนส่งสินค้า', 6e6, 40e6], ['เจ้าของโชว์รูมรถยนต์', 8e6, 50e6],
    ['เจ้าของโรงงานแปรรูปอาหาร', 10e6, 80e6], ['เจ้าของห้างค้าส่ง', 8e6, 60e6], ['เจ้าของสวนผลไม้ส่งออก', 4e6, 30e6], ['ผู้รับเหมาก่อสร้างรายใหญ่', 6e6, 45e6], ['เจ้าของคลินิกและโรงพยาบาลเอกชน', 8e6, 70e6],
    ['เจ้าของธุรกิจนำเข้า-ส่งออก', 6e6, 50e6], ['เจ้าของบริษัทซอฟต์แวร์', 5e6, 40e6], ['เจ้าของสถานีบริการน้ำมัน', 6e6, 35e6], ['เจ้าของฟาร์มปศุสัตว์ขนาดใหญ่', 5e6, 35e6]];
  const RICH = [['นักลงทุนส่วนบุคคล (แองเจิลอินเวสเตอร์)', 5e6, 60e6], ['ทายาทตระกูลธุรกิจ', 10e6, 150e6], ['อดีตผู้บริหารระดับสูงที่เกษียณแล้ว', 5e6, 40e6], ['เจ้าของที่ดินให้เช่า', 8e6, 80e6], ['แพทย์ผู้เชี่ยวชาญ', 4e6, 30e6],
    ['ทนายความชื่อดัง', 4e6, 30e6], ['วิศวกรที่ปรึกษาโครงการใหญ่', 4e6, 25e6], ['นักธุรกิจที่ขายกิจการแล้วมองหาลงทุนใหม่', 10e6, 120e6], ['ผู้ก่อตั้งสตาร์ตอัปที่ขายกิจการสำเร็จ', 8e6, 90e6]];
  const RANKS = [['พ.ต.อ.', 'ตำรวจ', 2e6, 8e6], ['พล.ต.ต.', 'ตำรวจ', 3e6, 15e6], ['พล.ต.ท.', 'ตำรวจ', 5e6, 25e6], ['พ.อ.', 'ทหารบก', 2e6, 8e6], ['พล.ต.', 'ทหารบก', 3e6, 15e6], ['พล.ท.', 'ทหารบก', 5e6, 25e6],
    ['น.อ.', 'ทหารเรือ', 2e6, 8e6], ['พล.ร.ต.', 'ทหารเรือ', 3e6, 15e6], ['พล.อ.ต.', 'ทหารอากาศ', 3e6, 15e6], ['พล.อ.ท.', 'ทหารอากาศ', 5e6, 25e6]];
  const MIN_TICKET = { biz: 5e5, rich: 1e6, officer: 3e5 };     // the smallest cheque this kind of person bothers to write
  const between = (lo, hi) => Math.round((lo + (hi - lo) * Math.pow(R(), 1.6)) / 1e5) * 1e5;
  const fullName = () => pick(FIRST) + ' ' + pick(LAST);

  // one person of the given class
  function make(cls) {
    if (cls === 'officer') {
      const r = pick(RANKS), serving = R() < 0.55;
      return { n: `${r[0]} ${fullName()}`, k: 'ofc', cls, prof: `${r[0]} · ${r[1]} · ${serving ? 'ประจำการ' : 'เกษียณราชการ'}`, serving, ret: !serving, wealth: between(r[2], r[3]) };
    }
    const p = pick(cls === 'rich' ? RICH : BIZ);
    return { n: `${cls === 'biz' && R() < 0.5 ? 'เถ้าแก่' : 'คุณ'} ${fullName()}`, k: 'inv', cls, prof: p[0], serving: false, ret: false, wealth: between(p[1], p[2]) };
  }
  const price = (V, pct) => Math.round(V * pct / (1 - pct) * 0.9);

  // a person who might ask to join a company worth V of which the owner holds `mine`: a class is drawn, then a stake they can afford (and bother with) is found
  // opts (a pitch by the owner): { cls } only that kind of person, { pct } at most that stake (the biggest one they can afford)
  function pickInvestor(V, mine, opts) {
    for (let t = 0; t < (opts && opts.cls ? 14 : 6); t++) {
      const r = R(), cls = (opts && opts.cls) || (r < 0.45 ? 'biz' : r < 0.75 ? 'rich' : 'officer'), p = make(cls);
      const ok = [0.05, 0.1, 0.15, 0.2, 0.25].filter(x => (!opts || !opts.pct || x <= opts.pct + 1e-9) && (mine == null ? 1 : mine) - x >= 0.1 && price(V, x) >= MIN_TICKET[cls] && price(V, x) <= p.wealth * 0.5);
      if (!ok.length) continue;
      p.pct = opts && opts.pct ? Math.max(...ok) : pick(ok); p.ticket = price(V, p.pct); return p;
    }
    return null;
  }
  // how many retired officers hold a real stake: they open the doors of public bodies (contract offers, v207); a serving officer does not (that would be a conflict of interest)
  const govNetwork = c => ((c && c.reg) || []).filter(h => h.k === 'ofc' && !h.serving && h.p >= 0.02).length;
  // n people for a share placement (the company sells new shares to investors it finds itself)
  function batch(n) { const L = [], seen = new Set(); while (L.length < n) { const p = make(R() < 0.5 ? 'biz' : R() < 0.55 ? 'rich' : 'officer'); if (!seen.has(p.n)) { seen.add(p.n); L.push(p); } } return L; }
  // people who could be asked to sit on the board: stable for a company (seeded), never a serving officer
  function dirPool(c) {
    let s = ((c && c.id) || 1) * 7919 + 13; const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }, pk = a => a[Math.floor(rnd() * a.length)];
    const PROF = ['อดีตผู้บริหารบริษัทมหาชน', 'อาจารย์มหาวิทยาลัย (ด้านธุรกิจ)', 'ผู้สอบบัญชีที่เกษียณแล้ว', 'อดีตผู้พิพากษา/อัยการ', 'อดีตผู้บริหารธนาคาร', 'ที่ปรึกษาด้านบรรษัทภิบาล'];
    const L = [];
    for (let i = 0; i < 4; i++) L.push({ n: `ดร. ${pk(FIRST)} ${pk(LAST)}`, prof: pk(PROF), lv: 3 });
    for (let i = 0; i < 2; i++) { const r = pk(RANKS); L.push({ n: `${r[0]} ${pk(FIRST)} ${pk(LAST)} (เกษียณ)`, prof: `${r[0]} · ${r[1]} · เกษียณราชการ`, lv: 3 }); }
    return L;
  }

  // the offer is accepted in v50: the register used by the board (c.reg) gets the same person, with the same share
  const before = c => { try { if (window.Agm216 && Agm216.reg) Agm216.reg(c); } catch (e) { } };
  const GOOD = { biz: 2, rich: 1, officer: 3 };
  function after(c, o) {
    try {
      const A = window.Agm216; if (!A || !A.reg) return; if (!Array.isArray(c.reg)) c.reg = [];
      if (o.mode === 'new') c.reg.forEach(h => { h.p *= (1 - o.pct); });
      const ex = c.reg.find(h => h.n === o.who);
      if (ex) { ex.p += o.pct; if (o.prof) ex.prof = o.prof; } else c.reg.push({ n: o.who, k: o.kind === 'online' ? 'inv' : (o.kind === 'npc' ? 'vil' : o.kind), p: o.pct, mood: 70, prof: o.prof || '', serving: !!o.serving, ret: !!o.ret });
      A.reg(c);
      const g = o.cls ? (o.cls === 'officer' && o.serving ? 2 : GOOD[o.cls] || 0) : 0; if (g) c.rep = clamp((c.rep == null ? 50 : c.rep) + g, 0, 100);
      if (o.serving) { try { Phone.msg(o.who, `ผมเป็นข้าราชการประจำ ขอถือหุ้นเป็นผู้ลงทุนเท่านั้น ไม่เป็นกรรมการหรือเข้าบริหารตามระเบียบนะครับ ขอบคุณที่รับเป็นผู้ถือหุ้นของ ${c.name}`, true); } catch (e) { } }
    } catch (e) { console.warn('v241 after', e); }
  }
  // ----- the questions of a police / military officer in the room (asked by an officer shareholder or director, v216 buildScript) -----
  const A = window.Agm216;
  if (A && A.Q) {
    const hasSec = f => { try { const c = f.c; return (c.staff || []).some(s => s.r === 'guard') || Sec.site('co:' + c.id).dev.some(d => DEV[d.k].t === 'cam'); } catch (e) { return false; } };
    const noFine = f => { const c = f.c || {}; return (c.fineA || -9999) < S.day - 90 && (c.fineB || -9999) < S.day - 90; };
    const licOk = f => { try { return Company.checks(f.c).every(x => x[0]); } catch (e) { return !!f.vat; } };
    const mk = (id, bAg, sAg, text, opts) => { if (A.Q.some(x => x.id === id)) return; A.Q.push({ id, grp: 'all', cond: true, when: () => true, who: 'both', askBy: 'ofc', text, o: opts, get ag() { const SS = A.cur; return SS && SS.board ? bAg : sAg; } }); };
    // [answer, mood, truth check (the books must agree), reputation]
    mk('ofc_safety', 13, 7, 'ผมเคยดูแลงานความมั่นคงมาก่อน จึงห่วงเรื่องความปลอดภัยของทรัพย์สิน พนักงาน และข้อมูลของบริษัท ตอนนี้มี รปภ. กล้องวงจรปิด และการควบคุมการเข้าออกอย่างไร เคยมีเหตุหรือไม่?', [
      ['มี รปภ. หรือกล้องวงจรปิดครอบคลุมจุดสำคัญ ควบคุมการเข้าออก และซ้อมแผนเหตุฉุกเฉินทุกปี', 8, hasSec, 1], ['มีบางส่วนแล้ว กำลังเพิ่มตามงบประมาณ แต่ยังไม่ครบทุกจุด', 2], ['ยังไม่มีระบบเฉพาะ เพราะที่ผ่านมาไม่เคยมีเหตุ', -7]]);
    mk('ofc_comply', 14, 7, 'บริษัทมีใบอนุญาตครบถ้วนและปฏิบัติตามกฎหมายทุกข้อหรือไม่ เคยถูกตรวจหรือถูกปรับหรือเปล่า? ผมต้องรักษาชื่อเสียงของตัวเองในฐานะผู้ถือหุ้นด้วย', [
      ['ใบอนุญาตครบและต่ออายุตรงเวลา ไม่เคยถูกปรับ และมีผู้รับผิดชอบรายงานต่อบอร์ดทุกไตรมาส', 8, f => noFine(f) && licOk(f), 1], ['บางใบกำลังต่ออายุ มีกำหนดเสร็จชัดเจนและไม่ได้ฝ่าฝืนระหว่างรอ', 2], ['เรื่องเล็กน้อย ไม่ต้องกังวล เจ้าหน้าที่ก็รู้จักกันอยู่', -10, null, -1]]);
    mk('ofc_conflict', 16, 6, 'ผมเคยรับราชการ จึงขอย้ำเรื่องผลประโยชน์ทับซ้อน บริษัทมีนโยบายห้ามให้ของขวัญหรือสินบนเจ้าหน้าที่รัฐ ในการขอใบอนุญาตหรือรับงานหน่วยงานรัฐหรือไม่?', [
      ['มีนโยบายต่อต้านการให้สินบนเป็นลายลักษณ์อักษร ผ่านมติบอร์ด มีช่องทางแจ้งเบาะแส และตรวจสอบโดยกรรมการอิสระ', 9, f => !!(f.c && (f.c.cg || f.c.cgDay)), 1], ['ยึดตามกฎหมายอยู่แล้ว แต่ยังไม่ได้เขียนเป็นนโยบาย จะทำภายในไตรมาสนี้', 1], ['งานราชการก็ต้องมีค่าน้ำร้อนน้ำชาบ้างตามธรรมเนียม', -13, null, -3]]);
    mk('ofc_gov', 8, 3, 'บริษัทมีแผนรับงานกับหน่วยงานรัฐหรือหน่วยงานความมั่นคงหรือไม่ ถ้ามี จะเตรียมคุณสมบัติและหลักประกันตามระเบียบอย่างไร? ผมแนะนำช่องทางที่ถูกต้องให้ได้ แต่ไม่ฝากงานให้', [
      ['เตรียมใบอนุญาต ผลงาน เอกสารภาษี และหลักประกันสัญญาตามระเบียบ แล้วยื่นผ่านช่องทางจัดซื้อจัดจ้างตามปกติ', 7, f => !!f.vat, 1], ['สนใจแต่ยังไม่พร้อม ขอเวลาเตรียมเอกสารให้ครบก่อน', 1], ['ขอให้ท่านช่วยฝากเรื่องกับผู้ใหญ่ จะได้ได้งานเร็วขึ้น', -13, null, -3]]);
    mk('ofc_crisis', 13, 7, 'ถ้าเกิดเหตุฉุกเฉิน เช่น ไฟไหม้ น้ำท่วม หรือภัยคุกคาม บริษัทมีแผนอพยพ แผนต่อเนื่องธุรกิจ และเบอร์ประสานหน่วยงาน (191 / 199 / 1669) หรือไม่?', [
      ['มีแผนฉุกเฉินและซ้อมอพยพประจำปี มีประกันทรัพย์สิน และเครื่องสำรองไฟ พร้อมเบอร์ประสานงานติดไว้ทุกจุด', 7, f => !!(f.c && f.c.insured) && !!f.ups, 1], ['มีแผนบางส่วน กำลังจัดทำให้ครบและซ้อมภายในปีนี้', 2], ['ยังไม่มี ถ้าเกิดเหตุค่อยโทรแจ้ง 191 / 199 ทีหลัง', -8]]);
  }
  window.Inv241 = { govNetwork, make, pick: pickInvestor, batch, dirPool, before, after, price, MIN_TICKET, RANKS, BIZ, RICH };
});
