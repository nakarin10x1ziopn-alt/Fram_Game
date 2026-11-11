'use strict';
// ---------- v206_docrules: real Thai validity of every paper, renewals that extend the date, expiry tracking everywhere ----------
// Game time: 1 year = 84 days, 1 month = 7 days. Validity follows the real rules where they are known (passport 5 y, ID card 8 y renewed
// within 60 days before expiry, driving licence 2 y first then 5 y, hotel licence 5 y, alcohol licence 3 y ...); a few are estimates and say so.
//  - Gov24 / Agency26 / Docs26 / v31 all call DocRules.expFor() when they issue a paper: renewing before expiry continues from the old expiry date
//  - renewal is allowed inside the real window before expiry (or after expiry); a still-valid paper outside the window can not be renewed
//  - company licences now expire and must be renewed; foreign workers have a 2-year work permit; wells need permits; professions need council licences
V23.add('v206_docrules', () => {
  if (typeof Gov24 === 'undefined') return;
  const E = s => (typeof esc === 'function' ? esc(s) : String(s));
  const YD = typeof YEAR_DAYS !== 'undefined' ? YEAR_DAYS : 84, MO = YD / 12;
  const y = n => Math.round(n * YD), m = n => Math.round(n * MO);
  // id: [life in game days, renew window in game days (0 = only after expiry), continues from old expiry?, real rule text, estimate?]
  const R = {
    idcard: [y(8), m(2), 0, 'บัตรอายุ 8 ปี · ทำใหม่ได้ล่วงหน้า 60 วันก่อนหมดอายุ · หมดแล้วไม่เกิน 60 วันไม่เสียค่าปรับ เกินนั้นปรับ 100 ฿'],
    housereg: [0, 0, 0, 'ไม่มีวันหมดอายุ (ย้ายที่อยู่ต้องแจ้งภายใน 15 วัน)'],
    resid: [m(3), 0, 0, 'ใช้ยื่นราชการ/ธนาคารได้ประมาณ 3 เดือน', 1],
    passport: [y(5), m(6), 0, 'เล่มทั่วไป 5 ปี (หรือ 10 ปี ค่าธรรมเนียม 1,500 ฿) · ควรต่อก่อนหมด 6 เดือนเพราะหลายประเทศต้องเหลืออายุ ≥ 6 เดือน'],
    crimrec: [m(3), 0, 0, 'ผู้รับหลักฐานมักรับไม่เกิน 3 เดือนนับจากวันออก', 1],
    taxcert: [m(3), 0, 0, 'ธนาคารมักรับหนังสือรับรองไม่เกิน 3 เดือน', 1],
    bizcert: [m(3), 0, 0, 'หนังสือรับรองบริษัท (DBD) ผู้รับมักรับไม่เกิน 3 เดือน', 1],
    edcert: [0, 0, 0, 'ไม่มีวันหมดอายุ'],
    farmer: [y(1), m(1), 1, 'ทะเบียนเกษตรกรต้องปรับปรุงข้อมูลทุกปี'],
    livereg: [y(3), m(3), 1, 'ใบรับรองฟาร์มปศุสัตว์ ~3 ปี', 1],
    fishreg: [y(1), m(1), 1, 'ใบอนุญาตประมงต่อรายปี'],
    ssoreg: [0, 0, 0, 'ไม่มีวันหมดอายุ (ต้องส่งเงินสมทบรายเดือน)'],
    firecert: [y(1), m(1), 1, 'ตรวจความปลอดภัยอัคคีภัยรายปี'],
    foodsan: [y(2), m(2), 0, 'ใบผ่านอบรมสุขาภิบาลอาหาร ~2 ปี', 1],
    welfare: [y(1), m(1), 0, 'ต้องลงทะเบียนต่อบัตรสวัสดิการทุกปี'],
    sd43: [0, 0, 0, 'ไม่มีวันหมดอายุ'],
    voter: [0, 0, 0, 'ไม่มีวันหมดอายุ'],
    buildhome: [y(1), m(1), 1, 'ใบอนุญาตก่อสร้างต้องเริ่มงานภายใน ~1 ปี', 1],
    buildext: [y(1), m(1), 1, 'ใบอนุญาตดัดแปลง/ต่อเติมอาคาร ~1 ปี', 1],
    medcert: [m(1), 0, 0, 'ใบรับรองแพทย์ใช้ได้ประมาณ 1 เดือนนับจากวันตรวจ', 1],
    visa: [m(3), 0, 0, 'วีซ่าท่องเที่ยวมักอยู่ได้ 30–90 วัน', 1],
    commreg: [0, 0, 0, 'ทะเบียนพาณิชย์ไม่มีวันหมดอายุ (ต้องแจ้งเปลี่ยนแปลง)'],
    deedcopy: [m(3), 0, 0, 'สำเนาโฉนดรับรองใช้ได้ประมาณ 3 เดือน', 1],
    pslicense: [y(5), m(3), 1, 'ใบขับขี่สาธารณะ ~5 ปี', 1],
    alcohol: [y(3), m(3), 1, 'ใบอนุญาตจำหน่ายสุรา ~3 ปี', 1],
    foodprod: [y(5), m(3), 1, 'ใบอนุญาตผลิตอาหาร ~5 ปี (ประมาณ)', 1],
    hotel: [y(5), m(3), 1, 'ใบอนุญาตประกอบธุรกิจโรงแรม 5 ปี'],
    factory: [y(5), m(3), 1, 'ใบอนุญาตประกอบกิจการโรงงาน (รง.4) ~5 ปี (ประมาณ)', 1],
    petreg: [0, 0, 0, 'ทะเบียนสัตว์เลี้ยง/ไมโครชิปไม่มีวันหมดอายุ'],
    compins: [y(1), m(3), 1, 'พ.ร.บ.รถยนต์ 1 ปี ต่อได้ล่วงหน้า'],
    farmaid: [y(1), 0, 0, 'สิทธิเงินช่วยเหลือเกษตรกรต่อรายปี'],
    vaccard: [0, 0, 0, 'ไม่มีวันหมดอายุ'], marriage: [0, 0, 0, 'ไม่มีวันหมดอายุ'], birthcert: [0, 0, 0, 'ไม่มีวันหมดอายุ'],
    famcert: [m(3), 0, 0, 'หนังสือรับรองสถานภาพใช้ได้ประมาณ 3 เดือน', 1],
    sso39: [0, 0, 0, 'ไม่มีวันหมดอายุ (ต้องส่งเงินสมทบรายเดือน)'], baacacct: [0, 0, 0, 'ไม่มีวันหมดอายุ'],
    donorcard: [0, 0, 0, 'ไม่มีวันหมดอายุ'], nodebt: [m(3), 0, 0, 'หนังสือรับรองไม่มีภาระหนี้ใช้ได้ประมาณ 3 เดือน', 1],
    tmark: [y(10), m(3), 1, 'เครื่องหมายการค้า 10 ปี ต่อได้ทุก 10 ปี (ยื่นก่อนหมด 90 วัน)'],
    copyrt: [0, 0, 0, 'ลิขสิทธิ์ไม่ต้องต่ออายุ'], workcert: [0, 0, 0, 'ไม่มีวันหมดอายุ'], employer: [0, 0, 0, 'ไม่มีวันหมดอายุ'],
    pharmlic: [y(1), m(1), 1, 'ใบอนุญาตขายยา ต่อรายปี', 1], franchise: [0, 0, 0, 'ตามสัญญา'],
    gap: [y(3), m(3), 1, 'ใบรับรอง GAP ~3 ปี', 1], animmove: [3, 0, 0, 'ใบเคลื่อนย้ายสัตว์ใช้ได้ไม่กี่วัน'],
    fdanum: [y(5), m(3), 1, 'เลขสารบบอาหาร ~5 ปี (ประมาณ)', 1],
    wellperm: [y(1), 0, 0, 'ใบอนุญาตเจาะบ่อบาดาลใช้ได้ภายในกำหนดงานเจาะ ~1 ปี', 1],
    welluse: [y(5), m(3), 1, 'ใบอนุญาตใช้น้ำบาดาล ~5 ปี', 1],
    lic_eng: [y(5), m(3), 1, 'ใบอนุญาตวิศวกรควบคุม ~5 ปี', 1], lic_teach: [y(5), m(3), 1, 'ใบอนุญาตประกอบวิชาชีพครู 5 ปี'],
    lic_law: [y(2), m(3), 1, 'ใบอนุญาตทนายความ 2 ปี'], lic_nurse: [y(5), m(3), 1, 'ใบอนุญาตพยาบาล 5 ปี'],
    lic_pharm: [y(5), m(3), 1, 'ใบอนุญาตเภสัชกร 5 ปี'], lic_vet: [y(5), m(3), 1, 'ใบอนุญาตสัตวแพทย์ 5 ปี', 1],
  };
  const base = id => String(id).split(':')[0];
  const lifeOf = id => (R[base(id)] || [null])[0];
  const winOf = id => (R[base(id)] || [0, 0])[1] || 0;
  const rec = id => { try { return Gov24.st().docs[id] || null; } catch (e) { return null; } };
  const fmtLife = d => { if (!d) return 'ไม่มีวันหมดอายุ'; const yy = Math.floor(d / YD), r = d - yy * YD, mm = Math.round(r / MO); return (yy ? yy + ' ปี' : '') + (yy && mm ? ' ' : '') + (mm ? mm + ' เดือน' : '') + ` (${d} วันเกม)`; };
  const DocRules = {
    R, lifeOf, winOf, fmtLife,
    // expiry date of a paper that is being issued now; renewing early continues from the old expiry (when the rule says so)
    expFor(id, old) {
      const b = base(id), r = R[b], D = Gov24.docs[b], life = r ? r[0] : (D ? D.life : 0); if (!life) return 0;
      const from = r && r[2] && old && old.exp && old.exp >= S.day ? old.exp : S.day; return from + life;
    },
    canRenew(id) {
      const d = rec(id); if (!d) return true; if (!d.exp) return false; if (S.day > d.exp) return true; return d.exp - S.day <= winOf(id);
    },
    renewText(id) {
      const d = rec(id), w = winOf(id); if (!d || !d.exp) return '';
      return w ? `ต่อได้เมื่อเหลือไม่เกิน ${w} วัน (เริ่ม${RD(d.exp - w)})` : `ต่อได้หลังหมดอายุ (${RD(d.exp)})`;
    },
  };
  window.DocRules = DocRules;

  // ----- apply the real lifetimes to the registry, and fix papers already in the wallet (once) -----
  for (const k of Object.keys(R)) if (Gov24.docs[k]) Gov24.docs[k].life = R[k][0];
  const migrate = () => {
    const x = Gov24.st(); if (x.mig206) return; x.mig206 = 1; x.mig168 = x.mig191 = 1;
    for (const k of Object.keys(x.docs)) {
      const d = x.docs[k]; if (!d || d.temp) continue; const b = base(k); if (!R[b]) continue; const life = R[b][0];
      d.exp = life ? (d.issued != null ? d.issued + life : d.exp) : 0;
    }
  };

  // ----- non-wallet expiries: driving licence rules (first licence 2 y, then 5 y; renewal window 60 days; late-renewal rules) -----
  if (typeof Plan !== 'undefined') {
    Plan.renew = function () {
      if (!(S.licOld || S.license)) return;
      const left = (S.licExp || 0) - S.day, over = S.license ? 0 : S.day - (S.licExp || S.day), WIN = m(2);
      if (S.license && left > WIN) { UI.toast(`ต่อใบขับขี่ล่วงหน้าได้ไม่เกิน 60 วัน (${WIN} วันเกม) ก่อนหมดอายุ — ใบนี้หมด${RD(S.licExp)} (เหลือ ${left} วัน)`, '🪪'); return; }
      if (over > 3 * YD) { UI.toast('ขาดต่อเกิน 3 ปี ต้องอบรมและสอบข้อเขียน-ขับรถใหม่ทั้งหมดที่โรงเรียนสอนขับรถ', '🪪'); return; }
      const fee = over > YD ? 800 : 300, mins = over > YD ? 240 : 60;
      if (S.money < fee) { UI.toast(`เงินไม่พอ ต้องใช้ ${baht(fee)}`, '💸'); return; }
      S.money -= fee; try { Bank2.log('ต่ออายุใบขับขี่', -fee); } catch (e) { }
      UI.close(); fade(() => {
        tick(mins); const from = S.license && S.licExp >= S.day ? S.licExp : S.day;
        S.license = 1; S.licOld = 0; S.licExp = from + 5 * YD; S.licFirst = 0;
        UI.toast('ต่ออายุใบขับขี่แล้ว ใช้ได้อีก 5 ปี (ถึง' + RD(S.licExp) + ')' + (over > YD ? ' · สอบข้อเขียนใหม่ผ่านแล้ว' : ''), '🪪');
        try { Phone.msg('กรมการขนส่งทางบก', `ต่ออายุใบขับขี่เรียบร้อย ใช้ได้ถึง${RD(S.licExp)}`, true); } catch (e) { }
      });
    };
  }

  // ----- company licences: they expire now, and are renewed at the authority -----
  const LIC_LIFE = { nbtc: y(5), erc: y(5), fda: y(5), rong4: y(5), food: y(1), build: y(1), dlt: y(5) };
  const LIC_WIN = m(3);
  const CoLic = window.CoLic205;
  if (CoLic && typeof CO_LIC !== 'undefined') {
    CoLic.body = function (key) {
      const L = CO_LIC[key]; if (!L) return '<p class="empty">ไม่พบใบอนุญาต</p>';
      const cs = Company.list().filter(c => ['setup', 'open'].includes(c.st) && (key === 'vat' || (CO_TYPES[c.type].lic || []).includes(key))), life = LIC_LIFE[key];
      return `<p class="lead">${E(L.n)} · ค่าธรรมเนียม ${baht(L.fee)} · พิจารณา ${L.days} วัน${life ? ` · อายุ ${fmtLife(life)}` : ' · ไม่มีวันหมดอายุ'} (จ่ายจากบัญชีบริษัท)</p>` + (cs.length ? cs.map(c => {
        const have = c.lic[key], wait = c.licApp[key], why = L.need ? L.need(c) : '', ex = (c.licExp || {})[key], left = ex != null ? ex - S.day : null;
        const can = have && life && left != null && left <= LIC_WIN && !wait;
        return `<div class="card"><div class="ci">${CO_TYPES[c.type].i}</div><div class="cb"><h4>${E(c.name)}</h4><p class="dim">เงินในบัญชีบริษัท ${baht(Math.round(c.cash))}${why ? ` · <span class="bad">⚠️ ${E(why)}</span>` : ''}</p>
          <div class="row">${have ? `<span class="good">✅ มีใบอนุญาต${ex != null && life ? ` ถึง${RD(ex)} (อีก ${left} วัน)` : ''}</span>` : ''}${wait ? `<span class="dim">🕓 รอผลถึง${RD(wait)}</span>` : ''}${!have && !wait ? `<button class="btn" data-a="colic" data-v="${c.id}" data-k="${key}">ยื่นขอใบอนุญาต ${baht(L.fee)}</button>` : ''}${can ? `<button class="btn" data-a="colicren" data-v="${c.id}" data-k="${key}">ต่ออายุ ${baht(L.fee)}</button>` : ''}${have && life && left != null && left > LIC_WIN && !wait ? `<span class="dim">ต่ออายุได้เมื่อเหลือไม่เกิน ${LIC_WIN} วัน</span>` : ''}</div></div></div>`;
      }).join('') : '<p class="empty">ยังไม่มีบริษัทที่ต้องใช้ใบอนุญาตนี้ (จดทะเบียนบริษัทที่แอป 🏢 บริษัทของฉัน ก่อน)</p>');
    };
  }
  UI.H.colicren = d => {
    const c = Company.get(d.v), L = CO_LIC[d.k]; if (!c || !L) return; c.licExp = c.licExp || {}; c.renew = c.renew || {};
    const left = (c.licExp[d.k] || 0) - S.day; if (c.lic[d.k] && left > LIC_WIN) { UI.toast(`ต่อใบอนุญาตได้เมื่อเหลือไม่เกิน ${LIC_WIN} วัน (เหลือ ${left} วัน)`, '📄'); return; }
    if (c.cash < L.fee) { UI.toast(`เงินบริษัทไม่พอ (ต้อง ${baht(L.fee)})`, '💸'); return; }
    c.cash -= L.fee; Company.book(c, 0, L.fee); c.licApp[d.k] = S.day + L.days; c.renew[d.k] = 1; UI.toast(`ยื่นต่ออายุ${L.n}แล้ว พิจารณา ${L.days} วัน`, '📄');
  };

  // ----- foreign workers: 2-year work permit, hired by a company with an SSO employer registration -----
  const FW_ROLES = ['worker', 'staff'], FW_FEE = 2900, FW_REN = 1900, NATS = ['เมียนมา', 'ลาว', 'กัมพูชา'], FW_NAMES = ['มะนอ', 'ซอ', 'เมย์', 'จันทร์', 'บุญมี', 'สมพอน', 'วันนา', 'ศรี', 'โซ', 'ติ๊'];
  UI.H.cofw = d => {
    const c = Company.get(d.v); if (!c || !['setup', 'open'].includes(c.st)) return; if (!c.lic.sso) { UI.toast('ต้องขึ้นทะเบียนนายจ้างประกันสังคมก่อนจ้างแรงงานต่างด้าว', '🛂'); return; }
    if (!pay(c, FW_FEE)) return; const nat = U.pick(NATS);
    c.staff.push({ r: d.k, sal: Math.round(ROLES[d.k].sal * 0.95), name: U.pick(FW_NAMES) + ` (${nat})`, fw: 1, nat, wp: S.day + 2 * YD });
    UI.toast(`จ้างแรงงานต่างด้าว (MOU ${nat}) ได้ใบอนุญาตทำงาน 2 ปี ถึง${RD(S.day + 2 * YD)}`, '🛂');
  };
  UI.H.cofwren = d => {
    const c = Company.get(d.v), s = c && c.staff[+d.k]; if (!s || !s.fw) return;
    if (s.wp - S.day > m(3)) { UI.toast(`ต่อใบอนุญาตทำงานได้เมื่อเหลือไม่เกิน 3 เดือน (${m(3)} วันเกม) — ใบนี้หมด${RD(s.wp)}`, '🛂'); return; }
    if (!pay(c, FW_REN)) return; s.wp = Math.max(s.wp, S.day) + 2 * YD; UI.toast(`ต่อใบอนุญาตทำงานของ ${s.name} ถึง${RD(s.wp)}`, '🛂');
  };
  const fwBody = () => {
    const L = []; for (const c of Company.list()) c.staff.forEach((s, i) => { if (s.fw) L.push([c, s, i]); });
    return `<p class="lead">🛂 แรงงานต่างด้าว (MOU เมียนมา ลาว กัมพูชา) ใบอนุญาตทำงานอายุ 2 ปี ต่อได้เมื่อเหลือไม่เกิน 3 เดือน ค่าธรรมเนียม ${baht(FW_REN)} ต่อคน · ปล่อยให้หมดอายุ นายจ้างปรับ ${baht(20000)} ต่อคน และแรงงานถูกส่งกลับ</p>` + (L.length ? L.map(([c, s, i]) => { const left = s.wp - S.day; return `<div class="card"><div class="ci">🛂</div><div class="cb"><h4>${E(s.name)} · ${E(ROLES[s.r].n)}</h4><p class="dim">${E(c.name)} · ใบอนุญาตถึง${RD(s.wp)} (อีก ${left} วัน)</p><div class="row"><button class="btn ${left <= m(3) ? '' : 'ghost'}" data-a="cofwren" data-v="${c.id}" data-k="${i}">ต่ออายุ ${baht(FW_REN)}</button></div></div></div>`; }).join('') : '<p class="empty">ยังไม่มีแรงงานต่างด้าว จ้างได้ที่หน้าบริษัท (ต้องมีทะเบียนนายจ้างประกันสังคม)</p>');
  };
  { const o = Gov24.offices.find(x => x.id === 'labour'); if (o && !o.sv.some(s => s.id === 'fwrenew')) o.sv.push({ id: 'fwrenew', n: 'ต่อใบอนุญาตทำงานแรงงานต่างด้าว (MOU)', i: '🛂', d: 'นายจ้างยื่นต่อให้ลูกจ้างต่างด้าว อายุ 2 ปี · จ่ายจากบัญชีบริษัท', req: ['idcard'], run: () => { UI.close(); setTimeout(() => UI.open('🛂 ใบอนุญาตทำงานแรงงานต่างด้าว', null, fwBody), 0); } }); }
  { const _h = Company.html.bind(Company); Company.html = t => { let s = _h(t); if (t !== 1) { const c = Company.get(Company.sel); if (c && ['setup', 'open'].includes(c.st)) { const fw = c.staff.filter(x => x.fw);
    s = s.replace('<div class="row"><button class="btn danger" data-a="coclose"', `<h5>🛂 แรงงานต่างด้าว (MOU)</h5><p class="dim">ใบอนุญาตทำงาน 2 ปี ค่าจ้างต่ำกว่าเล็กน้อย ${baht(FW_FEE)} ต่อคน · ต้องมีทะเบียนนายจ้างประกันสังคม · ต่ออายุที่สำนักงานจัดหางาน</p><div class="row">${FW_ROLES.map(r => `<button class="btn ghost" data-a="cofw" data-v="${c.id}" data-k="${r}">จ้าง${ROLES[r].n} (ต่างด้าว)</button>`).join('')}</div>${fw.length ? `<p class="dim">${fw.map(x => `${E(x.name)} ใบอนุญาตถึง${RD(x.wp)}`).join(' · ')}</p>` : ''}<div class="row"><button class="btn danger" data-a="coclose"`); } } return s; }; }

  // ----- wells need a drilling permit, and the water needs a use permit -----
  if (typeof Water !== 'undefined' && Water.buy) {
    const _wb = Water.buy.bind(Water);
    Water.buy = function (k) { if (k === 'well' && !Gov24.has('wellperm')) { UI.toast('ต้องมีใบอนุญาตเจาะบ่อบาดาลก่อน — ขอได้ที่ศูนย์ราชการ (สำนักงานทรัพยากรน้ำบาดาล)', '🕳️'); return; } return _wb(k); };
  }

  // ----- professional licences open the jobs that need them -----
  if (window.Career28 && Career28.docs) { for (const [job, doc] of [['nurse', 'lic_nurse'], ['teacher', 'lic_teach'], ['vet', 'lic_vet']]) { const a = Career28.docs[job] || (Career28.docs[job] = []); if (!a.includes(doc)) a.push(doc); } }

  // ----- daily: migration, reminders, company licences, foreign workers, well use -----
  const warn = (key, text, quiet) => { const x = (S.v206 = S.v206 || { w: {} }); if (x.w[key]) return; x.w[key] = 1; try { Phone.msg('แจ้งเตือนเอกสาร', text, quiet); } catch (e) { } };
  const daily = () => {
    migrate();
    // driving licence (not in the wallet): 14 / 3 days before
    if (S.license && S.licExp && S.licExp < S.day + 9000) { const l = S.licExp - S.day; if (l === m(2)) warn('dl' + S.licExp + 'a', `ใบขับขี่จะหมดอายุ${RD(S.licExp)} ต่ออายุได้แล้ว (ล่วงหน้าไม่เกิน 60 วัน) ที่โรงเรียนสอนขับรถ`); if (l === 3) warn('dl' + S.licExp + 'b', 'ใบขับขี่จะหมดอายุในอีก 3 วัน'); }
    for (const c of Company.list()) {
      c.licExp = c.licExp || {}; c.renew = c.renew || {};
      for (const k of Object.keys(c.lic)) {
        const life = LIC_LIFE[k]; if (!life) continue;
        if (c.renew[k] && !c.licApp[k]) { const from = c.licExp[k] >= S.day ? c.licExp[k] : S.day; c.licExp[k] = from + life; delete c.renew[k]; Phone.msg(c.name, `ต่ออายุ${CO_LIC[k].n}แล้ว ใช้ได้ถึง${RD(c.licExp[k])}`, false); }
        else if (c.licExp[k] == null) c.licExp[k] = S.day + life;
        const l = c.licExp[k] - S.day;
        if (l < 0) { delete c.lic[k]; Phone.msg(c.name, `⛔ ${CO_LIC[k].n} หมดอายุ — ธุรกิจต้องหยุดจนกว่าจะขอใหม่ที่ศูนย์ราชการ`, true); continue; }
        for (const t of [m(3), m(1), 0]) if (l === t) warn(`cl${c.id}${k}${c.licExp[k]}${t}`, t ? `${c.name}: ${CO_LIC[k].n} จะหมดอายุในอีก ${t} วัน (${RD(c.licExp[k])}) ต่ออายุที่ศูนย์ราชการ` : `${c.name}: ${CO_LIC[k].n} หมดอายุวันนี้`, !t ? false : true);
      }
      for (let i = c.staff.length - 1; i >= 0; i--) {
        const s = c.staff[i]; if (!s.fw) continue; const l = s.wp - S.day;
        if (l < 0) { c.staff.splice(i, 1); c.cash -= 20000; Company.book(c, 0, 20000); Phone.msg(c.name, `⛔ ${s.name} ใบอนุญาตทำงานหมดอายุ — ถูกส่งกลับและนายจ้างถูกปรับ ${baht(20000)}`, true); continue; }
        for (const t of [m(3), m(1), 3]) if (l === t) warn(`fw${c.id}${s.name}${s.wp}${t}`, `${c.name}: ใบอนุญาตทำงานของ ${s.name} จะหมดอายุในอีก ${t} วัน (${RD(s.wp)}) ต่อที่สำนักงานจัดหางาน`, t > 7);
      }
    }
    // a well without a use permit: 14 days to get it, then a 5,000 baht fine every month
    try { const w = Water.st(); if (w.well && !Gov24.has('welluse')) { if (!w.useBy) { w.useBy = S.day + 14; warn('wu' + S.day, 'บ่อบาดาลของคุณต้องมีใบอนุญาตใช้น้ำบาดาล ขอที่สำนักงานทรัพยากรน้ำบาดาล ภายใน 14 วัน', false); } else if (S.day > w.useBy && S.day - (w.lastFine || -99) >= 28) { w.lastFine = S.day; Gov24.st().fines.push({ what: 'ใช้น้ำบาดาลโดยไม่มีใบอนุญาต', amt: 5000, d: S.day, due: S.day + 15 }); Phone.msg('สำนักงานทรัพยากรน้ำบาดาล', 'ปรับ 5,000 ฿ ใช้น้ำบาดาลโดยไม่มีใบอนุญาต ชำระที่ศาล/ในแอปราชการ', false); } } else if (w.useBy) w.useBy = 0; } catch (e) { }
  };
  { const _d = Company.day.bind(Company); Company.day = () => { _d(); try { daily(); } catch (e) { console.warn('docrules daily', e); } }; }
  // professionals not employed earn from their licence every month (week)
  { const _w = Company.week.bind(Company); Company.week = () => { _w(); try { if (!(Career.st() || {}).k) { let t = 0; for (const [id, amt] of [['lic_eng', 12000], ['lic_law', 9000], ['lic_pharm', 8000]]) if (Gov24.has(id)) t += amt; if (t) { const net = Math.round(t * 0.9); earn(net); try { Bank2.income('รายได้ผู้ประกอบวิชาชีพ (หักภาษี 10%)', net); } catch (e) { } Phone.msg('สภาวิชาชีพ', `รายได้งานตามใบประกอบวิชาชีพเดือนนี้ ${baht(net)}`, true); } } } catch (e) { console.warn('prof income', e); } }; }

  // ----- "document ages" screen: what each paper really lasts, and when yours end -----
  const rows = () => {
    const x = Gov24.st(), L = [];
    for (const k of Object.keys(x.docs)) { const d = x.docs[k], b = base(k), D = Gov24.docs[b]; if (!D) continue; L.push({ n: D.i + ' ' + D.n, d, k }); }
    return L;
  };
  const cls = l => l == null ? '' : l < 0 ? 'bad' : l <= m(1) ? 'bad' : l <= m(3) ? '' : 'good';
  const tabMine = () => {
    const out = [];
    for (const r of rows()) { const l = r.d.exp ? r.d.exp - S.day : null, b = base(r.k); out.push(`<tr><td>${E(r.n)}</td><td>${r.d.exp ? RD(r.d.exp) : '—'}</td><td class="${cls(l)}">${l == null ? 'ไม่หมดอายุ' : l < 0 ? '⛔ หมดอายุแล้ว' : 'อีก ' + l + ' วัน'}</td><td>${r.d.exp ? (DocRules.canRenew(r.k) ? '<span class="good">ต่อได้ตอนนี้</span>' : E(DocRules.renewText(r.k))) : ''}</td></tr>`); }
    if (S.license) out.push(`<tr><td>🪪 ใบอนุญาตขับขี่${S.licFirst ? ' (ใบแรก 2 ปี)' : ''}</td><td>${S.licExp && S.licExp < S.day + 9000 ? RD(S.licExp) : '—'}</td><td class="${cls(S.licExp - S.day)}">${S.licExp && S.licExp < S.day + 9000 ? 'อีก ' + (S.licExp - S.day) + ' วัน' : 'ไม่หมดอายุ'}</td><td>ต่อได้เมื่อเหลือไม่เกิน ${m(2)} วัน</td></tr>`);
    else if (S.licOld) out.push('<tr><td>🪪 ใบอนุญาตขับขี่</td><td>—</td><td class="bad">⛔ หมดอายุแล้ว</td><td>ต่อที่โรงเรียนสอนขับรถ</td></tr>');
    for (const c of S.cars || []) if (c.reg) out.push(`<tr><td>🚗 ภาษีรถ ${E(((typeof CARS !== 'undefined' && CARS[c.type]) || {}).n || c.type)} (${E(c.reg.plate)})</td><td>${RD(c.tax)}</td><td class="${cls(c.tax - S.day)}">${c.tax - S.day < 0 ? '⛔ ขาดต่อ' : 'อีก ' + (c.tax - S.day) + ' วัน'}</td><td>ต่อได้ตลอด (ล่าช้ามีค่าปรับ)</td></tr>`);
    for (const c of Company.list()) {
      for (const k of Object.keys(c.lic)) if (LIC_LIFE[k] && c.licExp && c.licExp[k] != null) out.push(`<tr><td>🏢 ${E(c.name)}: ${E(CO_LIC[k].n)}</td><td>${RD(c.licExp[k])}</td><td class="${cls(c.licExp[k] - S.day)}">อีก ${c.licExp[k] - S.day} วัน</td><td>ต่อได้เมื่อเหลือไม่เกิน ${LIC_WIN} วัน</td></tr>`);
      for (const s of c.staff) if (s.fw) out.push(`<tr><td>🛂 ${E(c.name)}: ใบอนุญาตทำงาน ${E(s.name)}</td><td>${RD(s.wp)}</td><td class="${cls(s.wp - S.day)}">อีก ${s.wp - S.day} วัน</td><td>ต่อได้เมื่อเหลือไม่เกิน ${m(3)} วัน</td></tr>`);
    }
    return `<p class="lead">📆 วันหมดอายุของเอกสารและใบอนุญาตของคุณ (1 ปีเกม = ${YD} วัน · 1 เดือน = ${MO} วัน) · เหลือไม่เกิน 1 เดือนเป็นสีแดง</p>${out.length ? `<table class="tbl"><tr><th>เอกสาร</th><th>หมดอายุ</th><th>เหลือ</th><th>การต่ออายุ</th></tr>${out.join('')}</table>` : '<p class="empty">ยังไม่มีเอกสาร</p>'}`;
  };
  const tabRules = () => `<p class="lead">📚 อายุเอกสารตามระเบียบจริงของไทย (แปลงเป็นเวลาในเกม) · รายการที่มี ≈ คือค่าประมาณจากเกณฑ์ทั่วไป ควรเทียบกับประกาศหน่วยงานล่าสุด</p><table class="tbl"><tr><th>เอกสาร</th><th>อายุ</th><th>กฎจริง</th></tr>${Object.keys(R).filter(k => Gov24.docs[k]).map(k => `<tr><td>${Gov24.docs[k].i} ${E(Gov24.docs[k].n)}</td><td>${fmtLife(R[k][0])}</td><td>${E(R[k][3])}${R[k][4] ? ' ≈' : ''}</td></tr>`).join('')}${[['🪪 ใบอนุญาตขับขี่', '2 ปี (ใบแรก) แล้ว 5 ปี · ต่อล่วงหน้าไม่เกิน 60 วัน · ขาดต่อเกิน 1 ปีสอบข้อเขียนใหม่ · เกิน 3 ปีสอบใหม่ทั้งหมด'], ['🛂 ใบอนุญาตทำงานแรงงาน MOU', '2 ปี ต่อได้เมื่อเหลือไม่เกิน 3 เดือน'], ['🏢 ใบอนุญาตบริษัท', 'โทรคมนาคม/พลังงาน/อาหาร/โรงงาน/ขนส่ง 5 ปี · ก่อสร้าง/ร้านอาหาร 1 ปี ≈']].map(([a, b]) => `<tr><td>${a}</td><td></td><td>${E(b)}</td></tr>`).join('')}</table>`;
  const open = t => UI.open('📆 วันหมดอายุเอกสาร', ['ของฉัน', 'อายุตามกฎจริง'], x => x === 1 ? tabRules() : tabMine(), { wide: true, tab: t || 0 });
  window.DocAge206 = { open, mine: tabMine };
  if (!APPS.some(a => a.id === 'docage')) APPS.push({ id: 'docage', i: '📆', n: 'วันหมดอายุเอกสาร' });
  Phone.apps.docage = () => { setTimeout(() => { Phone.app = null; UI.close(); open(0); }, 0); return ''; };
  if (window.Phone59 && Phone59.CATS) { const c = Phone59.CATS.find(q => q[0] === 'gov'); if (c && !c[3].includes('docage')) c[3].push('docage'); }
});
