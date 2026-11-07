'use strict';
// ---------- v26_agency: 10 more government / state-enterprise / private agencies, every one wired to the Gov24 document wallet:
// social-security benefits (สปส.), state pawnshop, BAAC farm bank, insurance commission & claims, Red Cross, legal execution dept,
// intellectual property, 1111 complaint + labour protection, private clinic & vaccines, family registry.
// Reached from the phone app "🏛️ หน่วยงานเพิ่มเติม". Each agency has opening hours (closed on public holidays), services that
// ask for documents (Gov24.has/need), new documents with expiry, fees, waits, fines and real benefits during the player's life.
V23.add('v26_agency', () => {
  const G24 = window.Gov24; if (!G24) return;
  const YD = typeof YEAR_DAYS !== 'undefined' ? YEAR_DAYS : 84;

  // ================= state =================
  const fill = (x, d) => { for (const k in d) { if (x[k] == null) x[k] = d[k]; else if (d[k] && typeof d[k] === 'object' && !Array.isArray(d[k]) && typeof x[k] === 'object') fill(x[k], d[k]); } return x; };
  const DEF = () => ({
    apps: [], n: 0,
    sso: { m: 0, empM: 0, last: 0, lastSick: -99, lastUnemp: -99, lastChild: -99, unempN: 0, kids: {}, pen: 0, penLast: 0, paid: 0 },
    pawn: [], pn: 0, shop: [],
    baac: { debt: 0, deferTo: 0, lastDefer: -999, paid: 0, interest: 0 },
    ins: { claims: [], stormDay: 0, stormPaid: 0 },
    rc: { n: 0, last: -99, vol: 0, donated: 0, perks: {} },
    exec: { plan: 0, last: 0, mediated: -999 },
    ip: { marks: [], copies: [], last: 0, royal: 0 },
    cases: [], cn: 0,
    clinic: { vac: {}, visits: 0, checkup: -999 },
  });
  const st = () => fill(S.v26 = S.v26 || {}, DEF());

  // ================= helpers =================
  const $v = id => { const e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; };
  const dn = id => (G24.docs[id] || {}).n || id;
  const msg = (from, t) => { try { Phone.msg(from, t); } catch (e) { } };
  const yearBE = () => new Date().getFullYear() + 543;
  const age = () => { const b = ((G24.rec('idcard') || {}).data || {}).birth; return b && b.y ? yearBE() - b.y : 25; };
  const queue = () => 8 + ((S.day * 13 + Math.floor(S.time / 30)) % 28);
  const pay = (n, label) => {
    n = Math.max(0, Math.round(n)); if (S.money < n) { UI.toast(`เงินไม่พอ ต้องใช้ ${baht(n)}`, '💸'); return false; }
    if (n) { S.money -= n; try { Bank2.log(label, -n); } catch (e) { } } return true;
  };
  const gain = (n, src) => { n = Math.round(n); if (n <= 0) return; S.money += n; if (S.stats) S.stats.earned += n; try { Bank2.income(src, n); Bank2.log(src, n); } catch (e) { } try { Sfx.coin(); } catch (e) { } };
  const hol = () => !!(window.Cal24 && Cal24.isHoliday && Cal24.isHoliday());
  const hrs = h => `${String(Math.floor(h)).padStart(2, '0')}:${h % 1 ? '30' : '00'}`;
  const rnd = seed => { let h = 2166136261; for (const c of String(seed)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 1000) / 1000; };
  const fmtD = d => RD(d);
  const kids = () => (typeof Social !== 'undefined' ? Social.st().kids || [] : []);

  // ================= new documents (they join the Gov24 wallet; Gov24 shows, expires and warns about them) =================
  const NEWD = {
    medcert: { n: 'ใบรับรองแพทย์', i: '🩺', life: 7, off: 'v26', by: 'clinic' },
    vaccard: { n: 'สมุดบันทึกการรับวัคซีน', i: '💉', life: 0, off: 'v26', by: 'clinic' },
    marriage: { n: 'ทะเบียนสมรส (คร.2)', i: '💍', life: 0, off: 'v26', by: 'family' },
    birthcert: { n: 'สูติบัตรบุตร (ท.ร.3)', i: '👶', life: 0, off: 'v26', by: 'family' },
    famcert: { n: 'หนังสือรับรองสถานภาพครอบครัว', i: '👨‍👩‍👧', life: 28, off: 'v26', by: 'family' },
    sso39: { n: 'ผู้ประกันตนมาตรา 39 (สมัครใจต่อเนื่อง)', i: '🛡️', life: 0, off: 'v26', by: 'sso2' },
    baacacct: { n: 'บัญชีเงินฝากเกษตรกร ธ.ก.ส.', i: '🌾', life: 0, off: 'v26', by: 'baac' },
    donorcard: { n: 'บัตรผู้บริจาคโลหิต สภากาชาดไทย', i: '🩸', life: YD, off: 'v26', by: 'rc' },
    nodebt: { n: 'หนังสือรับรองการไม่มีภาระหนี้/คดี', i: '📋', life: 28, off: 'v26', by: 'exec' },
    tmark: { n: 'ทะเบียนเครื่องหมายการค้า', i: '™️', life: 10 * YD, off: 'v26', by: 'dip' },
    copyrt: { n: 'หนังสือแจ้งข้อมูลลิขสิทธิ์', i: '©️', life: 0, off: 'v26', by: 'dip' },
    workcert: { n: 'หนังสือรับรองการทำงาน', i: '💼', life: 28, off: 'v26', by: 'labour2' },
    employer: { n: 'ทะเบียนนายจ้าง (สปส.1-03)', i: '🏭', life: 0, off: 'v26', by: 'labour2' },
  };
  for (const k in NEWD) G24.docs[k] = NEWD[k];

  const has = id => G24.has(id);
  const docNo = id => `${id.slice(0, 3).toUpperCase()}-${String(S.day).padStart(4, '0')}-${String(++st().n).padStart(3, '0')}`;
  const grant = (id, data, from, label) => {
    const D = G24.docs[id], x = G24.st();
    x.docs[id] = { no: docNo(id), issued: S.day, exp: D.life ? S.day + D.life : 0, data: data || {} };
    try { Life2.note && Life2.note('ได้รับ' + D.n); } catch (e) { }
    UI.toast(`${D.i} ได้รับ${D.n}แล้ว`, '✅');
    msg(from || 'หน่วยงานรัฐ', `${label || 'ออก'}${D.n} เลขที่ ${x.docs[id].no} ${D.life ? `ใช้ได้ถึง${RD(x.docs[id].exp)}` : 'ไม่มีวันหมดอายุ'}`);
    return x.docs[id];
  };
  // the check every service runs: documents of this module point to the agency that issues them, everything else goes to Gov24
  const need = (ids, what) => {
    for (const id of ids) {
      if (has(id)) continue;
      const D = G24.docs[id];
      if (D && D.off === 'v26') {
        const a = AG_BY[D.by], d = G24.rec(id);
        UI.toast(`${what ? what + ': ' : ''}${d && d.exp && S.day > d.exp ? `${D.i} ${D.n} หมดอายุแล้ว (${d.exp}) — ขอใหม่ที่ ` : `${D.i} ต้องมี${D.n} — ขอได้ที่ `}${a ? a.n : 'หน่วยงานที่เกี่ยวข้อง'} (แอป 🏛️ หน่วยงานเพิ่มเติม)`, '🪪');
        try { Sfx.error && Sfx.error(); } catch (e) { } return false;
      }
      if (!G24.need([id], what)) return false;
    }
    return true;
  };

  // an application that takes days
  const apply = o => {
    const x = st();
    if (x.apps.some(a => a.key === o.key && a.st !== 'done')) { UI.toast('มีคำขอเรื่องนี้ค้างอยู่แล้ว ดูที่แท็บ "คำขอ & ภาระ"', '📋'); return false; }
    if (!pay(o.fee || 0, 'ค่าธรรมเนียม ' + dn(o.doc))) return false;
    if (!o.days) { grant(o.doc, o.data, o.from, o.label); if (o.after) o.after(); return true; }
    x.apps.push({ no: docNo('APP'), key: o.key, doc: o.doc, ag: o.ag, from: o.from, st: 'pending', due: S.day + o.days, data: o.data, day: S.day, merge: o.merge });
    UI.toast(`ยื่นคำขอ${dn(o.doc)}แล้ว รอ ${o.days} วัน`, '📋');
    msg(o.from, `รับคำขอ${dn(o.doc)} (ชำระ ${baht(o.fee || 0)}) ตรวจสอบเสร็จ${RD(S.day + o.days)} มารับเอกสารที่เคาน์เตอร์ในเวลาทำการ`);
    return true;
  };
  const pickup = i => {
    const x = st(), a = x.apps[+i]; if (!a || a.st === 'done' || S.day < a.due) return;
    const ag = AG_BY[a.ag]; if (ag && !isOpen(ag)) { UI.toast(`${ag.n} ปิดทำการ มารับในเวลาทำการ`, '🕒'); return; }
    a.st = 'done'; let data = a.data;
    if (a.merge) data = a.merge(data);
    grant(a.doc, data, a.from, 'ออก'); UI.renderBody();
  };

  // ================= opening hours =================
  const isOpen = a => {
    if (window.Hours36) return Hours36.open(a.id);
    const H = a.hrs; if (H.all) return true; if (hol() && !H.holOK) return false;
    const h = S.time / 60, d = (S.day - 1) % 7, w = d < 5 ? H.wd : d === 5 ? H.sat : H.sun;
    return !!w && h >= w[0] && h < w[1];
  };
  const hoursText = a => { if (window.Hours36) return Hours36.text(a.id); const H = a.hrs; if (H.all) return 'เปิด 24 ชม.'; const r = w => w ? `${hrs(w[0])}–${hrs(w[1])}` : 'ปิด'; return `จ-ศ ${r(H.wd)} · ส ${r(H.sat)} · อา ${r(H.sun)}${H.holOK ? '' : ' · ปิดวันหยุดราชการ'}`; };

  // ================= generic agency screens =================
  const sv = (id, n, i, d, o) => Object.assign({ id, n, i, d }, o);
  const AG = [];
  const AG_BY = {};
  const agency = (id, n, s, i, d, hrsO, svs) => { const a = { id, n, s, i, d, hrs: hrsO, sv: svs }; AG.push(a); AG_BY[id] = a; return a; };
  const reqLine = ids => ids.map(id => `${has(id) ? '✅' : '❌'} ${esc(dn(id))}`).join(' · ');
  // run a service: time passes, then it does its thing; return true from fn when it opened a screen of its own
  const go = (a, mins, fn) => {
    UI.close();
    fade(() => { tick(mins + queue()); let own = false; try { own = fn(); } catch (e) { console.warn('v26 service', e); } if (!own) agUI(a.id); });
  };
  const agBody = a => {
    const x = st(), mine = x.apps.filter(p => p.ag === a.id && p.st !== 'done'), open = isOpen(a);
    return `<p class="lead">${open ? '🟢 เปิดให้บริการ' : '🔴 ปิดทำการ'} · ${esc(hoursText(a))}</p><p class="dim">${esc(a.d)}</p>
      ${mine.length ? `<h5>📋 คำขอของคุณ</h5><div class="grid">${mine.map(p => { const ready = S.day >= p.due; return `<div class="card"><div class="ci">${ready ? '📬' : '⏳'}</div><div class="cb"><h4>${esc(dn(p.doc))}</h4><p class="dim">เลขที่ ${esc(p.no)} · ${ready ? 'พร้อมรับแล้ว' : `ตรวจสอบเสร็จ${RD(p.due)}`}</p>${ready ? `<button class="btn" data-a="v26a" data-v="pick|${x.apps.indexOf(p)}">รับเอกสาร</button>` : ''}</div></div>`; }).join('')}</div>` : ''}
      <div class="grid">${a.sv.map(s => {
        const why = s.can ? s.can() : '', stt = s.st ? s.st() : '';
        return `<div class="card"><div class="ci">${s.i}</div><div class="cb"><h4>${esc(s.n)}</h4><p class="dim">${esc(s.d)}</p>${s.req && s.req.length ? `<p class="dim">เอกสารที่ต้องใช้: ${reqLine(s.req)}</p>` : ''}${stt ? `<p class="dim">${stt}</p>` : ''}${why ? `<p class="dim bad">⚠️ ${esc(why)}</p>` : ''}<div class="row"><button class="btn ${open && !why ? '' : 'ghost'}" data-a="v26a" data-v="sv|${a.id}|${s.id}">ใช้บริการ</button></div></div></div>`;
      }).join('')}</div><div class="row"><button class="btn ghost" data-a="v26a" data-v="app">‹ หน่วยงานทั้งหมด</button></div>`;
  };
  const agUI = id => { const a = AG_BY[id]; if (a) UI.open(a.i + ' ' + a.n, null, () => agBody(a)); };
  const A = {};
  A.ag = id => agUI(id);
  A.pick = i => pickup(i);
  A.sv = (aid, sid) => {
    const a = AG_BY[aid], s = a && a.sv.find(x => x.id === sid); if (!s) return;
    if (!isOpen(a)) { UI.toast(`${a.n} ปิดทำการ (${hoursText(a)})`, '🕒'); return; }
    if (!need(s.req || [], s.n)) return;
    const why = s.can ? s.can() : ''; if (why) { UI.toast(why, '⚠️'); return; }
    s.run(a);
  };
  UI.H.v26a = d => { const [k, ...r] = String(d.v || '').split('|'); const f = A[k]; if (f) { try { f(...r); } catch (e) { if (e && e.spend173) throw e; console.warn('v26', k, e); } } };
  const again = () => UI.renderBody();   // refresh the open screen after a small action

  // ================= 1. ประกันสังคม: benefits =================
  const ssoMember = () => {
    const pa = d => !!(d && d.data && d.data.paidUntil >= S.day);
    if (pa(has('ssoreg')) || pa(has('sso39'))) return 'self';
    const C = typeof Career !== 'undefined' && Career.C && Career.C(); return C && !C.gov ? 'emp' : '';
  };
  const SSO_WHY = () => ssoMember() ? '' : 'คุณไม่ได้เป็นผู้ประกันตน (สมัคร ม.40 ที่สำนักงานประกันสังคม หรือทำงานกับนายจ้างเอกชน) หรือค่าสมทบขาดส่ง';
  const kidsUnder = y => kids().filter(k => (window.Kid182 ? Kid182.age(k) < y : S.day - (k.born || 0) < y * YD));
  const SSO = agency('sso2', 'สำนักงานประกันสังคม — สิทธิประโยชน์ (สปส.)', 'ประกันสังคม 7 กรณี', '🛡️', 'สะสมเงินสมทบทุก 28 วันเมื่อเป็นผู้ประกันตน (ม.33 จากนายจ้างเอกชน / ม.39 / ม.40) แล้วใช้สิทธิทดแทนเมื่อเจ็บป่วย ว่างงาน คลอดบุตร เลี้ยงบุตร และชราภาพ',
    { wd: [8.5, 16.5] }, [
    sv('s39', 'สมัครผู้ประกันตนมาตรา 39 (ส่งต่อหลังออกจากงาน)', '🔄', 'ส่งสมทบ 150 ฿ ทุก 28 วัน ต้องเคยส่งเงินสมทบมาแล้ว ≥ 3 งวด และไม่มีนายจ้างอยู่', {
      req: ['idcard'], can: () => { const d = has('sso39'); if (d && d.data.paidUntil >= S.day) return 'เป็นผู้ประกันตนมาตรา 39 อยู่แล้ว'; if (st().sso.m < 3) return `ต้องเคยส่งเงินสมทบอย่างน้อย 3 งวด (มี ${st().sso.m})`; return ssoMember() === 'emp' ? 'ยังมีนายจ้างส่งเงินสมทบให้อยู่ (ม.33)' : ''; },
      st: () => { const d = has('sso39'); if (d && !d.data) d.data = { paidUntil: S.day }; return d ? `สถานะ: ส่งสมทบถึง${RD(d.data.paidUntil)}` : ''; },
      run: a => go(a, 20, () => { if (!pay(150, 'เงินสมทบประกันสังคม ม.39')) return; grant('sso39', { paidUntil: S.day + 28 }, 'สำนักงานประกันสังคม', 'ออก'); }),
    }),
    sv('sick', 'เบิกเงินทดแทนการขาดรายได้ (เจ็บป่วย)', '🤒', 'ต้องมีใบรับรองแพทย์ที่ให้หยุดพัก ส่งสมทบ ≥ 3 งวด เบิกได้ 1 ครั้งต่อ 28 วัน ได้วันละ 300 ฿ ตามวันที่แพทย์ให้พัก', {
      req: ['idcard', 'medcert'], can: () => { const c = has('medcert') || { data: {} }, x = st().sso; return SSO_WHY() || (x.m < 3 ? `ส่งสมทบยังไม่ครบ 3 งวด (มี ${x.m})` : S.day - x.lastSick < 28 ? `เบิกได้อีกครั้ง${RD(x.lastSick + 28)}` : !c.data.rest ? 'ใบรับรองแพทย์ไม่ได้ให้หยุดพักรักษาตัว' : c.data.used ? 'ใบรับรองแพทย์ฉบับนี้ใช้เบิกไปแล้ว' : ''); },
      run: a => go(a, 25, () => { const c = has('medcert'), x = st().sso, amt = 300 * c.data.rest; c.data.used = 1; x.lastSick = S.day; gain(amt, 'ประกันสังคม: ทดแทนขาดรายได้'); msg('สำนักงานประกันสังคม', `อนุมัติเงินทดแทนการขาดรายได้ ${baht(amt)} (${c.data.rest} วัน) โอนเข้าบัญชีแล้ว`); }),
    }),
    sv('unemp', 'เบิกเงินทดแทนกรณีว่างงาน', '📉', 'เคยเป็นลูกจ้างเอกชนส่งสมทบ ≥ 6 งวด ปัจจุบันไม่มีงาน ได้ 1,800 ฿ ต่อ 28 วัน สูงสุด 6 งวด (ต้องรายงานตัวสม่ำเสมอ)', {
      req: ['idcard'], can: () => { const x = st().sso, C = typeof Career !== 'undefined' && Career.C && Career.C(); return x.empM < 6 ? `ต้องเคยส่งสมทบเป็นลูกจ้างเอกชน ≥ 6 งวด (มี ${x.empM})` : C ? 'ยังมีงานทำอยู่ ใช้สิทธิว่างงานไม่ได้' : x.unempN >= 6 ? 'ใช้สิทธิครบ 6 งวดแล้ว (กลับมาทำงานแล้วจะรีเซ็ต)' : S.day - x.lastUnemp < 28 ? `รายงานตัวงวดถัดไป${RD(x.lastUnemp + 28)}` : ''; },
      st: () => `เบิกแล้ว ${st().sso.unempN}/6 งวด`,
      run: a => go(a, 30, () => { const x = st().sso; x.lastUnemp = S.day; x.unempN++; gain(1800, 'ประกันสังคม: ว่างงาน'); msg('สำนักงานประกันสังคม', `จ่ายเงินทดแทนว่างงาน งวดที่ ${x.unempN}/6 จำนวน ${baht(1800)}`); }),
    }),
    sv('birth', 'เบิกค่าคลอดบุตร / รับบุตรบุญธรรม (ครั้งเดียวต่อบุตร)', '👶', 'ต้องมีสูติบัตรบุตร (แจ้งเกิดที่ฝ่ายทะเบียนครอบครัว) ส่งสมทบ ≥ 3 งวด ได้ 6,000 ฿ ต่อบุตร', {
      req: ['idcard', 'housereg', 'birthcert'], can: () => { const c = has('birthcert') || { data: {} }, x = st().sso; if (SSO_WHY()) return SSO_WHY(); if (x.m < 3) return `ส่งสมทบยังไม่ครบ 3 งวด (มี ${x.m})`; return ((c.data.kids || []).filter(k => !x.kids[k.name])).length ? '' : 'ไม่มีบุตรที่ยังไม่ได้เบิก'; },
      run: a => go(a, 25, () => { const c = has('birthcert'), x = st().sso, L = (c.data.kids || []).filter(k => !x.kids[k.name]); L.forEach(k => { x.kids[k.name] = S.day; }); gain(6000 * L.length, 'ประกันสังคม: ค่าคลอดบุตร'); msg('สำนักงานประกันสังคม', `จ่ายค่าคลอดบุตร ${L.map(k => k.name).join(', ')} รวม ${baht(6000 * L.length)}`); }),
    }),
    sv('child', 'เบิกเงินสงเคราะห์บุตร (เด็กอายุ ต่ำกว่า 6 ปี)', '🍼', 'คนละ 800 ฿ ต่อ 28 วัน ต้องมีสูติบัตรบุตร และส่งสมทบอยู่', {
      req: ['idcard', 'birthcert'], can: () => { const x = st().sso, c = has('birthcert') || { data: {} }, n = kidsUnder(6).filter(k => (c.data.kids || []).some(r => r.name === k.name)).length; return SSO_WHY() || (!n ? 'ไม่มีบุตรอายุต่ำกว่า 6 ปีที่แจ้งเกิดแล้ว' : S.day - x.lastChild < 28 ? `เบิกได้อีกครั้ง${RD(x.lastChild + 28)}` : ''); },
      run: a => go(a, 20, () => { const x = st().sso, c = has('birthcert'), n = kidsUnder(6).filter(k => (c.data.kids || []).some(r => r.name === k.name)).length; x.lastChild = S.day; gain(800 * n, 'ประกันสังคม: สงเคราะห์บุตร'); msg('สำนักงานประกันสังคม', `จ่ายเงินสงเคราะห์บุตร ${n} คน รวม ${baht(800 * n)}`); }),
    }),
    sv('pen', 'ขอรับบำนาญชราภาพ (อายุ 55 ปีขึ้นไป)', '👴', 'ส่งสมทบรวม ≥ 12 งวด รับบำนาญ 1,500 ฿ ทุก 28 วัน โอนอัตโนมัติ', {
      req: ['idcard'], can: () => { const x = st().sso; return x.pen ? 'ได้รับบำนาญอยู่แล้ว (โอนทุก 28 วัน)' : age() < 55 ? `ต้องมีอายุ 55 ปีขึ้นไป (ปัจจุบัน ${age()} ปี)` : x.m < 12 ? `ต้องส่งสมทบ ≥ 12 งวด (มี ${x.m})` : ''; },
      run: a => go(a, 30, () => { const x = st().sso; x.pen = 1; x.penLast = S.day; msg('สำนักงานประกันสังคม', 'อนุมัติบำนาญชราภาพ 1,500 ฿ ต่อ 28 วัน เริ่มโอนอัตโนมัติ'); UI.toast('อนุมัติบำนาญชราภาพแล้ว', '👴'); }),
    }),
    sv('view', 'ตรวจสอบสิทธิและเงินสมทบของฉัน', '🔍', 'ดูจำนวนงวดที่ส่งสมทบ ประเภทผู้ประกันตน และสิทธิที่ใช้ไปแล้ว', {
      run: a => { UI.open('สิทธิประกันสังคมของฉัน', null, () => { const x = st().sso, m = ssoMember(); return `<p class="lead">ประเภท: <b>${m === 'emp' ? 'มาตรา 33 (ลูกจ้างเอกชน)' : m === 'self' ? 'มาตรา 39/40 (สมัครใจ)' : 'ไม่ได้เป็นผู้ประกันตน'}</b></p><p class="lead">เงินสมทบสะสม ${x.m} งวด (เป็นลูกจ้าง ${x.empM} งวด) · ว่างงานเบิกแล้ว ${x.unempN}/6 · บำนาญ ${x.pen ? '✅ รับอยู่' : '—'}</p><p class="dim">เบิกเจ็บป่วยล่าสุด ${x.lastSick > 0 ? fmtD(x.lastSick) : '—'} · สงเคราะห์บุตรล่าสุด ${x.lastChild > 0 ? fmtD(x.lastChild) : '—'} · บุตรที่เบิกค่าคลอดแล้ว ${Object.keys(x.kids).length} คน</p><div class="row"><button class="btn ghost" data-a="v26a" data-v="ag|sso2">‹ กลับ</button></div>`; }); return true; },
    }),
  ]);

  // ================= 2. สถานธนานุบาล =================
  const val = id => { const it = ITEMS[id]; return it ? Math.round(it.sell || it.price || 0) : 0; };
  const periods = t => Math.max(1, Math.ceil((S.day - t.day) / 28));
  const interest = t => Math.max(10, Math.round(t.loan * 0.0125 * periods(t)));
  const openTickets = () => st().pawn.filter(t => t.st === 'open');
  const pawnPledgeUI = () => UI.open('จำนำสิ่งของ', null, () => {
    const L = Object.keys(S.inv).filter(k => ITEMS[k] && S.inv[k] > 0 && val(k) >= 40).sort((a, b) => val(b) - val(a)).slice(0, 40);
    return `<p class="lead">ประเมินราคา 60% ของมูลค่า · ดอกเบี้ย 1.25% ต่อ 28 วัน · อายุตั๋ว 84 วัน เลยกำหนด 7 วันทรัพย์จะหลุดจำนำ ตั๋วที่ค้างอยู่ ${openTickets().length} ใบ</p>${L.length ? `<div class="grid">${L.map(k => `<div class="card"><div class="ci">${ITEMS[k].i}</div><div class="cb"><h4>${esc(ITEMS[k].n)} ×${S.inv[k]}</h4><p class="dim">มูลค่าประเมิน ${baht(val(k))} · ให้วงเงิน ${baht(Math.round(val(k) * 0.6))}/ชิ้น</p><div class="row"><button class="btn" data-a="v26a" data-v="pawn1|${k}|1">จำนำ 1 ชิ้น</button>${S.inv[k] > 1 ? `<button class="btn ghost" data-a="v26a" data-v="pawn1|${k}|${S.inv[k]}">จำนำทั้งหมด ${S.inv[k]}</button>` : ''}</div></div></div>`).join('')}</div>` : '<p class="empty">ไม่มีของมูลค่าพอจะรับจำนำในกระเป๋า</p>'}<div class="row"><button class="btn ghost" data-a="v26a" data-v="ag|pawn">‹ กลับ</button></div>`;
  });
  A.pawn1 = (k, n) => {
    n = Math.min(+n || 1, S.inv[k] || 0); if (!n || !ITEMS[k]) return; if (!need(['idcard'], 'จำนำสิ่งของ')) return;
    const x = st(), loan = Math.round(val(k) * 0.6 * n); if (loan < 20) return;
    if (!takeItem(k, n)) return; S.money += loan; try { Bank2.log('จำนำ ' + ITEMS[k].n, loan); } catch (e) { }
    const t = { no: 'พ-' + String(++x.pn).padStart(4, '0'), item: k, qty: n, loan, day: S.day, due: S.day + 84, st: 'open' }; x.pawn.push(t);
    UI.toast(`จำนำ ${ITEMS[k].n}×${n} ได้ ${baht(loan)} · ตั๋วเลขที่ ${t.no} ไถ่ถอนภายใน${RD(t.due)}`, '💍'); try { Sfx.coin(); } catch (e) { } UI.renderBody();
  };
  const pawnTicketsUI = () => UI.open('ตั๋วจำนำของฉัน', null, () => {
    const L = openTickets(), H = st().pawn.filter(t => t.st !== 'open').slice(-6).reverse();
    return `${L.length ? `<div class="grid">${L.map(t => { const late = S.day > t.due; return `<div class="card"><div class="ci">${(ITEMS[t.item] || {}).i || '🎁'}</div><div class="cb"><h4>${esc(t.no)} · ${esc((ITEMS[t.item] || {}).n || t.item)} ×${t.qty}</h4><p class="dim">ยอดจำนำ ${baht(t.loan)} · ดอกเบี้ยถึงวันนี้ ${baht(interest(t))} (${periods(t)} งวด) · ครบกำหนด${RD(t.due)}${late ? ` · <b class="bad">เลยกำหนด! หลุดจำนำ${RD(t.due + 7)}</b>` : ''}</p><div class="row"><button class="btn" data-a="v26a" data-v="redeem|${t.no}">ไถ่ถอน ${baht(t.loan + interest(t))}</button><button class="btn ghost" data-a="v26a" data-v="renew|${t.no}">ต่อดอก ${baht(interest(t))}</button></div></div></div>`; }).join('')}</div>` : '<p class="empty">ไม่มีตั๋วจำนำที่ค้างอยู่</p>'}${H.length ? `<h5>ประวัติล่าสุด</h5>${H.map(t => `<p class="dim">${esc(t.no)} ${esc((ITEMS[t.item] || {}).n || '')} — ${t.st === 'redeemed' ? '✅ ไถ่ถอนแล้ว' : '⛔ หลุดจำนำ'}</p>`).join('')}` : ''}<div class="row"><button class="btn ghost" data-a="v26a" data-v="ag|pawn">‹ กลับ</button></div>`;
  });
  A.redeem = no => { const t = st().pawn.find(p => p.no === no && p.st === 'open'); if (!t) return; const tot = t.loan + interest(t); if (!pay(tot, 'ไถ่ถอนตั๋วจำนำ ' + t.no)) return; t.st = 'redeemed'; addItem(t.item, t.qty); UI.toast(`ไถ่ถอน ${(ITEMS[t.item] || {}).n} คืนมาแล้ว (จ่าย ${baht(tot)})`, '💍'); UI.renderBody(); };
  A.renew = no => { const t = st().pawn.find(p => p.no === no && p.st === 'open'); if (!t) return; const i = interest(t); if (!pay(i, 'ต่อดอกตั๋วจำนำ ' + t.no)) return; t.day = S.day; t.due = S.day + 84; UI.toast(`ต่อดอกแล้ว ครบกำหนดใหม่${RD(t.due)}`, '💍'); UI.renderBody(); };
  const pawnShopUI = () => UI.open('ทรัพย์หลุดจำนำ ขายทอดตลาด', null, () => {
    const L = st().shop;
    return `<p class="lead">ทรัพย์สินที่หลุดจำนำ ขายในราคา 90% ของมูลค่าประเมิน (ลูกค้าทั่วไปซื้อได้)</p>${L.length ? `<div class="grid">${L.map((s, i) => `<div class="card"><div class="ci">${(ITEMS[s.item] || {}).i || '🎁'}</div><div class="cb"><h4>${esc((ITEMS[s.item] || {}).n || s.item)} ×${s.qty}</h4><p class="dim">ตั๋วเดิม ${esc(s.no)}</p><button class="btn" data-a="v26a" data-v="shopbuy|${i}">ซื้อ ${baht(s.price)}</button></div></div>`).join('')}</div>` : '<p class="empty">ยังไม่มีทรัพย์หลุดจำนำ</p>'}<div class="row"><button class="btn ghost" data-a="v26a" data-v="ag|pawn">‹ กลับ</button></div>`;
  });
  A.shopbuy = i => { const x = st(), s = x.shop[+i]; if (!s) return; if (!need(['idcard'], 'ซื้อทรัพย์หลุดจำนำ')) return; if (!pay(s.price, 'ซื้อทรัพย์หลุดจำนำ')) return; addItem(s.item, s.qty); x.shop.splice(+i, 1); UI.toast('ซื้อทรัพย์หลุดจำนำแล้ว', '💍'); UI.renderBody(); };
  agency('pawn', 'สถานธนานุบาล (โรงรับจำนำ) สุขใจ', 'รับจำนำ', '💍', 'สถานธนานุบาลของรัฐ ต้องแสดงบัตรประชาชน ให้วงเงิน 60% ดอกเบี้ย 1.25% ต่อ 28 วัน ของหลุดจำนำเอาไปขายทอดตลาด',
    { wd: [8.5, 17], sat: [8.5, 17], sun: [9, 14] }, [
    sv('pledge', 'จำนำสิ่งของ', '💍', 'เลือกของในกระเป๋ามาจำนำ รับเงินสดทันที ได้ตั๋วจำนำ', { req: ['idcard'], run: a => go(a, 10, () => { pawnPledgeUI(); return true; }) }),
    sv('redeem', 'ไถ่ถอน / ต่อดอก', '🧾', 'จ่ายเงินต้นและดอกเบี้ยเพื่อรับของคืน หรือจ่ายเฉพาะดอกเบี้ยเพื่อต่อตั๋ว', { req: ['idcard'], st: () => `ตั๋วค้าง ${openTickets().length} ใบ`, run: a => go(a, 10, () => { pawnTicketsUI(); return true; }) }),
    sv('shop', 'ซื้อทรัพย์หลุดจำนำ', '🏷️', 'ของที่หลุดจำนำจะขายต่อให้ผู้ซื้อทั่วไปในราคา 90%', { req: ['idcard'], st: () => `ทรัพย์รอขาย ${st().shop.length} รายการ`, run: a => go(a, 10, () => { pawnShopUI(); return true; }) }),
    sv('rules', 'ระเบียบ ดอกเบี้ย และกำหนดหลุดจำนำ', 'ℹ️', 'ตั๋วอายุ 84 วัน เลยกำหนดมีผ่อนผัน 7 วัน ถ้าไม่ไถ่ถอนหรือต่อดอกทรัพย์หลุดจำนำ', { run: () => { UI.toast('อายุตั๋ว 84 วัน · ผ่อนผัน 7 วัน · ดอกเบี้ย 1.25%/28 วัน (ขั้นต่ำ 10 ฿) · ต่อดอกได้ไม่จำกัดครั้ง', '💍'); } }),
  ]);

  // ================= 3. ธ.ก.ส. =================
  const baacLimit = () => 15000 + 12000 * ((S.up.field || 1) + (S.up.soil || 1) + (S.up.barn || 1) - 3) + 1500 * (S.lvl || 1);
  const baacUI = () => UI.open('สินเชื่อเกษตรกร ธ.ก.ส.', null, () => {
    const b = st().baac, room = Math.max(0, baacLimit() - Math.round(b.debt)), opts = [5000, 10000, 20000].filter(v => v <= room);
    return `<p class="lead">วงเงินสูงสุด ${baht(baacLimit())} (ตามระดับแปลง ดิน โรงนา และเลเวล) · ดอกเบี้ย 6.5% ต่อปี คิดทุกวัน · ปัจจุบันเป็นหนี้ ${baht(Math.round(b.debt))}${b.deferTo >= S.day ? ` · พักชำระถึง${RD(b.deferTo)}` : ''}</p>
      <h5>กู้เพิ่ม (วงเงินคงเหลือ ${baht(room)})</h5><div class="row">${opts.map(v => `<button class="btn" data-a="v26a" data-v="baacloan|${v}">กู้ ${baht(v)}</button>`).join('')}${room > 0 ? `<button class="btn ghost" data-a="v26a" data-v="baacloan|${room}">เต็มวงเงิน ${baht(room)}</button>` : '<span class="dim">ใช้เต็มวงเงินแล้ว</span>'}</div>
      <h5>ชำระคืน</h5><div class="row">${[1000, 5000].map(v => `<button class="btn ghost" data-a="v26a" data-v="baacpay|${v}">${baht(v)}</button>`).join('')}<button class="btn" data-a="v26a" data-v="baacpay|all" ${b.debt > 0 ? '' : 'disabled'}>ปิดบัญชี ${baht(Math.round(b.debt))}</button></div>
      <div class="row"><button class="btn ghost" data-a="v26a" data-v="ag|baac">‹ กลับ</button></div>`;
  });
  A.baacloan = n => {
    n = +n; const b = st().baac, room = baacLimit() - Math.round(b.debt); if (!(n > 0) || n > room) { UI.toast('เกินวงเงิน', '⚠️'); return; }
    if (!need(['idcard', 'housereg', 'farmer', 'baacacct'], 'สินเชื่อ ธ.ก.ส.')) return;
    if (G24.st().fines.some(f => !f.paid)) { UI.toast('มีใบสั่ง/ค่าปรับค้างชำระ ธนาคารไม่อนุมัติ — ชำระที่ศาลก่อน', '⚖️'); return; }
    b.debt += n; S.money += n; try { if (window.Flow171) window.Flow171.in(n, 'สินเชื่อ ธ.ก.ส.'); } catch (e) { } try { Bank2.log('กู้ ธ.ก.ส.', n); } catch (e) { } try { Sfx.coin(); } catch (e) { }
    msg('ธ.ก.ส.', `อนุมัติสินเชื่อเกษตรกร ${baht(n)} ดอกเบี้ย 6.5% ต่อปี ยอดหนี้คงเหลือ ${baht(Math.round(b.debt))}`); UI.toast(`กู้ ธ.ก.ส. ${baht(n)} แล้ว`, '🌾'); UI.renderBody();
  };
  A.baacpay = n => { const b = st().baac, amt = n === 'all' ? Math.round(b.debt) : Math.min(+n, Math.round(b.debt)); if (!(amt > 0)) return; if (!pay(amt, 'ชำระหนี้ ธ.ก.ส.')) return; b.debt = Math.max(0, b.debt - amt); b.paid += amt; if (b.debt < 1) b.debt = 0; UI.toast(`ชำระหนี้ ธ.ก.ส. ${baht(amt)} คงเหลือ ${baht(Math.round(b.debt))}`, '🌾'); UI.renderBody(); };
  agency('baac', 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.) สาขาสุขใจ', 'ธ.ก.ส.', '🌾', 'ธนาคารของเกษตรกร ต้องมีทะเบียนเกษตรกร (ทบก.) จึงเปิดบัญชีและกู้ได้ ดอกเบี้ยต่ำ มีพักชำระหนี้เมื่อเจอภัยพิบัติ',
    { wd: [8.5, 15.5] }, [
    sv('open', 'เปิดบัญชีเงินฝากเกษตรกร', '📒', 'ต้องมีบัตรประชาชน ทะเบียนบ้าน และทะเบียนเกษตรกร (ทบก.) ฝากเริ่มต้น 100 ฿', {
      req: ['idcard', 'housereg', 'farmer'], can: () => has('baacacct') ? 'มีบัญชี ธ.ก.ส. แล้ว' : '', st: () => has('baacacct') ? '✅ มีบัญชีแล้ว' : '',
      run: a => go(a, 20, () => { if (!pay(100, 'เปิดบัญชี ธ.ก.ส.')) return; grant('baacacct', { opened: S.day }, 'ธ.ก.ส.', 'เปิด'); }),
    }),
    sv('loan', 'สินเชื่อเกษตรกร (ดอกเบี้ย 6.5% ต่อปี)', '💵', 'ต้องมีบัญชี ธ.ก.ส. ไม่มีใบสั่งค้าง ได้วงเงินตามระดับฟาร์มและเลเวล ใช้เป็นทุนปลูก ซื้อสัตว์ ปรับปรุงดิน', {
      req: ['idcard', 'housereg', 'farmer', 'baacacct'], st: () => `หนี้ปัจจุบัน ${baht(Math.round(st().baac.debt))} / วงเงิน ${baht(baacLimit())}`, run: a => go(a, 25, () => { baacUI(); return true; }),
    }),
    sv('pay', 'ชำระหนี้ / ปิดบัญชีสินเชื่อ', '🧾', 'ชำระคืนเงินต้นพร้อมดอกเบี้ยที่คิดรายวัน', { req: ['idcard'], can: () => st().baac.debt > 0 ? '' : 'ไม่มีหนี้ค้าง', run: a => go(a, 10, () => { baacUI(); return true; }) }),
    sv('defer', 'ขอพักชำระหนี้ 28 วัน (เกษตรกรประสบภัย)', '🌧️', 'ต้องเป็นหนี้อยู่ ได้พักดอกเบี้ย 28 วัน ปีละ 1 ครั้ง (ฟรี) — ต้องมีทะเบียนเกษตรกรที่ยังไม่หมดอายุ', {
      req: ['idcard', 'farmer'], can: () => { const b = st().baac; return b.debt <= 0 ? 'ไม่มีหนี้ให้พักชำระ' : S.day - b.lastDefer < YD ? `ใช้สิทธิได้อีกครั้ง${RD(b.lastDefer + YD)}` : ''; },
      run: a => go(a, 20, () => { const b = st().baac; b.lastDefer = S.day; b.deferTo = S.day + 28; msg('ธ.ก.ส.', `อนุมัติพักชำระหนี้ถึง${RD(b.deferTo)} ไม่คิดดอกเบี้ยช่วงนี้`); UI.toast('อนุมัติพักชำระหนี้ 28 วัน', '🌾'); }),
    }),
  ]);

  // ================= 4. คปภ. + บริษัทประกัน =================
  const POLICIES = () => (typeof INS !== 'undefined' ? Object.keys(INS) : []).filter(k => typeof Ins !== 'undefined' && (Ins.st()[k] || 0) > 0);
  const claimsRecent = () => st().ins.claims.filter(c => c.day > S.day - YD);
  const CAR_PAY = { car1: 6000, car2p: 3000, car3: 1500 };
  const damaged = () => S.cars.filter(c => c.reg && (c.cond == null ? 100 : c.cond) < 85);
  const insCar = () => ['car1', 'car2p', 'car3'].find(k => Ins.has(k));
  agency('oic', 'สำนักงาน คปภ. และบริษัทประกันภัย', 'ประกันภัย', '📑', 'ตรวจกรมธรรม์ เคลมสินไหม และร้องเรียนบริษัทประกัน ต้องมีเอกสารหลักฐานตามเงื่อนไขกรมธรรม์ เคลมได้ไม่เกิน 2 ครั้งต่อปี',
    { wd: [8.5, 16.5] }, [
    sv('list', 'ตรวจกรมธรรม์และสิทธิของฉัน', '🔍', 'ดูกรมธรรม์ที่ยังคุ้มครองอยู่ วันหมดอายุ และประวัติการเคลม', { run: a => { UI.open('กรมธรรม์ของฉัน', null, () => `<div class="grid">${(typeof INS !== 'undefined' ? Object.keys(INS) : []).map(k => `<div class="card"><div class="ci">${INS[k].i}</div><div class="cb"><h4>${esc(INS[k].n)}</h4><p class="dim">${Ins.has(k) ? `<span class="good">✅ คุ้มครองถึง${RD(Ins.st()[k])} (อีก ${Ins.st()[k] - S.day} วัน)</span>` : '<span class="bad">ไม่มีความคุ้มครอง</span>'}</p></div></div>`).join('')}</div><p class="dim">เคลมใน 1 ปีที่ผ่านมา ${claimsRecent().length}/2 ครั้ง</p><div class="row"><button class="btn ghost" data-a="v26a" data-v="ag|oic">‹ กลับ</button></div>`); return true; } }),
    sv('health', 'เคลมประกันสุขภาพ (ใช้ใบรับรองแพทย์)', '🏥', 'ต้องมีประกันสุขภาพที่ยังคุ้มครอง และใบรับรองแพทย์ที่ยังไม่หมดอายุ จ่ายตามจริงไม่เกิน 2,500 ฿ ต่อใบรับรอง', {
      req: ['idcard', 'medcert'], can: () => { const c = has('medcert') || { data: {} }; return !Ins.has('health') ? 'ไม่มีประกันสุขภาพที่คุ้มครองอยู่' : claimsRecent().length >= 2 ? 'เคลมครบ 2 ครั้งต่อปีแล้ว' : c.data.insUsed ? 'ใช้ใบรับรองแพทย์ฉบับนี้เคลมไปแล้ว' : ''; },
      run: a => go(a, 25, () => { const c = has('medcert'), amt = Math.min(2500, c.data.cost ? c.data.cost + 300 : 1200); c.data.insUsed = 1; st().ins.claims.push({ day: S.day, k: 'health', amt }); gain(amt, 'สินไหมประกันสุขภาพ'); msg('บริษัทประกันภัย', `อนุมัติสินไหมประกันสุขภาพ ${baht(amt)}`); }),
    }),
    sv('car', 'เคลมประกันรถยนต์ (ซ่อมรถที่เสียหาย)', '🚗', 'ต้องมีรถที่จดทะเบียนและสภาพต่ำกว่า 85% พร้อมประกันรถที่คุ้มครองอยู่ ค่าเสียหายส่วนแรก 1,000 ฿ ชั้น 1 ซ่อมเต็ม ชั้น 2+/3 จ่ายตามวงเงิน', {
      req: ['idcard'], can: () => !insCar() ? 'ไม่มีประกันรถที่คุ้มครองอยู่' : claimsRecent().length >= 2 ? 'เคลมครบ 2 ครั้งต่อปีแล้ว' : !damaged().length ? 'รถของคุณไม่มีความเสียหาย (สภาพต้องต่ำกว่า 85%)' : '',
      run: a => go(a, 30, () => {
        const k = insCar(), c = damaged().sort((p, q) => (p.cond || 100) - (q.cond || 100))[0], gap = 100 - (c.cond == null ? 100 : c.cond), ded = 1000;
        const cover = k === 'car1' ? 99999 : CAR_PAY[k], cost = Math.round(gap * 120), pay1 = Math.max(0, Math.min(cover, cost) - ded);
        c.cond = k === 'car1' ? 100 : Math.min(100, (c.cond || 0) + Math.round(Math.min(cover, cost) / 120)); st().ins.claims.push({ day: S.day, k, amt: pay1 });
        gain(pay1, 'สินไหมประกันรถยนต์'); msg('บริษัทประกันภัย', `อู่ซ่อม ${(CARS[c.type] || {}).n || 'รถ'} เสร็จแล้ว ค่าซ่อม ${baht(cost)} บริษัทจ่าย ${baht(pay1)} (หักค่าเสียหายส่วนแรก ${baht(ded)})`);
      }),
    }),
    sv('storm', 'เคลมประกันบ้าน (พายุ น้ำท่วม)', '🌪️', 'ประกันบ้านต้องยังคุ้มครอง และต้องมีพายุในรอบ 3 วันที่ผ่านมา (บริษัทส่งผู้สำรวจตรวจสอบ) ได้ 3,000 ฿ ต่อเหตุการณ์', {
      req: ['idcard', 'housereg'], can: () => { const x = st().ins; return !Ins.has('home') ? 'ไม่มีประกันบ้านที่คุ้มครองอยู่' : S.day - x.stormDay > 3 || !x.stormDay ? 'ไม่พบเหตุพายุในรอบ 3 วัน' : x.stormPaid === x.stormDay ? 'เหตุการณ์นี้เคลมไปแล้ว' : claimsRecent().length >= 2 ? 'เคลมครบ 2 ครั้งต่อปีแล้ว' : ''; },
      run: a => go(a, 35, () => { const x = st().ins; x.stormPaid = x.stormDay; x.claims.push({ day: S.day, k: 'home', amt: 3000 }); gain(3000, 'สินไหมประกันบ้าน'); msg('บริษัทประกันภัย', 'ผู้สำรวจตรวจสอบความเสียหายจากพายุแล้ว อนุมัติสินไหม 3,000 ฿'); }),
    }),
    sv('comp', 'ร้องเรียนบริษัทประกันที่ไม่จ่ายสินไหม', '📣', 'ยื่นเรื่องผ่านศูนย์ร้องเรียน 1111 / คปภ. ผลภายใน 3-6 วัน', { req: ['idcard'], can: () => POLICIES().length ? '' : 'ยังไม่เคยทำประกันภัย', run: a => { UI.close(); complaintForm('ins'); } }),
  ]);

  // ================= 5. สภากาชาด =================
  const rcWhy = () => { const x = st().rc; return age() < 17 || age() > 70 ? 'ผู้บริจาคต้องอายุ 17-70 ปี' : S.sick ? 'กำลังป่วย บริจาคโลหิตไม่ได้' : S.energy < 30 ? 'พลังงานต่ำเกินไป (ต้อง ≥ 30)' : (S.hunger || 80) < 30 ? 'หิวเกินไป กินอะไรก่อนบริจาค' : S.day - x.last < 12 ? `บริจาคได้อีกครั้ง${RD(x.last + 12)} (เว้น 12 วัน)` : ''; };
  agency('rc', 'สภากาชาดไทย — ศูนย์บริการโลหิต สุขใจ', 'สภากาชาด', '🩸', 'บริจาคโลหิต อาสาสมัคร และบริจาคช่วยภัยพิบัติ ผู้บริจาคสะสมครบเกณฑ์ได้บัตรและรางวัล',
    { wd: [8, 16], sat: [8, 12], holOK: false }, [
    sv('donate', 'บริจาคโลหิต (ตรวจคัดกรองก่อนบริจาค)', '🩸', 'ต้องมีบัตรประชาชน อายุ 17-70 ปี ไม่ป่วย พลังงาน ≥ 30 เว้น 12 วัน เสีย 20 พลังงาน ได้กำลังใจและแต้มประสบการณ์', {
      req: ['idcard'], can: rcWhy, st: () => `บริจาคแล้ว ${st().rc.n} ครั้ง`,
      run: a => go(a, 40, () => {
        const x = st().rc; x.n++; x.last = S.day; S.energy = Math.max(0, S.energy - 20); S.hunger = Math.max(0, (S.hunger || 80) - 8); S.mood = Math.min(100, (S.mood || 50) + 10); try { Prog.add(12); } catch (e) { }
        UI.toast(`บริจาคโลหิตครั้งที่ ${x.n} ขอบคุณที่ช่วยชีวิตผู้ป่วย 🩸`, '🩸'); msg('สภากาชาดไทย', `ขอบคุณที่บริจาคโลหิตครั้งที่ ${x.n} โลหิตของคุณช่วยผู้ป่วยได้ถึง 3 ราย`);
        if (!has('donorcard') || x.n === 1) grant('donorcard', { n: x.n }, 'สภากาชาดไทย', 'ออก');
        else { const d = G24.rec('donorcard'); if (d) d.data.n = x.n; }
        if (x.n >= 3 && !x.perks.v3) { x.perks.v3 = 1; msg('สภากาชาดไทย', 'ครบ 3 ครั้ง! รับสิทธิ์ส่วนลดค่ารักษา 500 ฿ ที่เคาน์เตอร์สิทธิ์ผู้บริจาค'); }
      }),
    }),
    sv('perk', 'ใช้สิทธิ์ผู้บริจาค (ส่วนลดค่ารักษา / เหรียญเกียรติคุณ)', '🏅', 'ครบ 3 ครั้ง รับคูปองคืนค่ารักษา 500 ฿ · ครบ 10 ครั้ง ได้เหรียญเงิน (+80 XP) · ครบ 24 ครั้ง เหรียญทอง (+200 XP และ 3,000 ฿) ต้องมีบัตรที่ยังไม่หมดอายุ', {
      req: ['idcard', 'donorcard'], can: () => { const x = st().rc; const P = [[3, 'v3c'], [10, 'm10'], [24, 'm24']]; return P.some(([n, k]) => x.n >= n && !x.perks[k]) ? '' : 'ยังไม่มีสิทธิ์ใหม่ให้รับ (ต้องบริจาคให้ครบ 3 / 10 / 24 ครั้ง)'; },
      run: a => go(a, 15, () => { const x = st().rc; let t = ''; if (x.n >= 3 && !x.perks.v3c) { x.perks.v3c = 1; gain(500, 'สภากาชาด: สิทธิ์ผู้บริจาค'); t += 'คืนค่ารักษา 500 ฿ '; } if (x.n >= 10 && !x.perks.m10) { x.perks.m10 = 1; try { Prog.add(80); } catch (e) { } t += '🥈 เหรียญเงิน '; } if (x.n >= 24 && !x.perks.m24) { x.perks.m24 = 1; gain(3000, 'สภากาชาด: เหรียญทอง'); try { Prog.add(200); } catch (e) { } t += '🥇 เหรียญทอง'; } UI.toast(t || 'ไม่มีสิทธิ์ใหม่', '🏅'); }),
    }),
    sv('renew', 'ต่ออายุบัตรผู้บริจาค', '🪪', 'ฟรี ต้องเคยบริจาคโลหิตแล้ว', { req: ['idcard'], can: () => st().rc.n < 1 ? 'ยังไม่เคยบริจาคโลหิต' : '', run: a => go(a, 10, () => { grant('donorcard', { n: st().rc.n }, 'สภากาชาดไทย', 'ต่ออายุ'); }) }),
    sv('give', 'บริจาคเงินช่วยภัยพิบัติ / ผู้ป่วยยากไร้', '❤️', 'บริจาคตามกำลัง ได้ใบเสร็จรับเงินไว้ลดหย่อนภาษี (ยอดสะสมบันทึกไว้) · ได้กำลังใจ', {
      req: ['idcard'], st: () => `บริจาคสะสม ${baht(st().rc.donated)}`,
      run: a => { UI.open('บริจาคเงิน สภากาชาดไทย', null, () => `<p class="lead">เลือกจำนวนเงินที่ต้องการบริจาค (ใบเสร็จใช้ลดหย่อนภาษี 2 เท่า)</p><div class="row">${[100, 500, 1000, 5000].map(v => `<button class="btn ghost" data-a="v26a" data-v="rcgive|${v}">${baht(v)}</button>`).join('')}</div><p class="dim">ยอดสะสมของคุณ ${baht(st().rc.donated)}</p><div class="row"><button class="btn ghost" data-a="v26a" data-v="ag|rc">‹ กลับ</button></div>`); return true; },
    }),
    sv('vol', 'เป็นอาสาสมัครกาชาด (2 ชั่วโมง)', '🤝', 'ช่วยคัดแยกถุงโลหิตและต้อนรับผู้บริจาค เสีย 15 พลังงาน ได้ XP และกำลังใจ', {
      can: () => S.energy < 25 ? 'พลังงานไม่พอ' : '', run: a => go(a, 120, () => { const x = st().rc; x.vol++; S.energy = Math.max(0, S.energy - 15); S.mood = Math.min(100, (S.mood || 50) + 8); try { Prog.add(10); } catch (e) { } UI.toast(`ทำงานอาสาสมัครกาชาดครั้งที่ ${x.vol} 🤝`, '🤝'); }),
    }),
  ]);
  A.rcgive = n => { n = +n; if (!need(['idcard'], 'บริจาคเงิน')) return; if (!pay(n, 'บริจาคสภากาชาดไทย')) return; const x = st().rc; x.donated += n; S.mood = Math.min(100, (S.mood || 50) + 3 + Math.min(10, n / 500)); msg('สภากาชาดไทย', `ขอบคุณสำหรับการบริจาค ${baht(n)} ใบเสร็จเลขที่ RC-${S.day}-${x.donated} ใช้ลดหย่อนภาษีได้`); UI.toast(`บริจาค ${baht(n)} ขอบคุณค่ะ ❤️`, '❤️'); UI.renderBody(); };

  // ================= 6. กรมบังคับคดี =================
  const debtSummary = () => {
    const b = (typeof Bank2 !== 'undefined' && Bank2.st) ? Bank2.st().debt || 0 : 0, f = G24.st().fines.filter(x => !x.paid), bl = G24.st().bills.filter(x => !x.paid);
    return { bank: Math.round(b), baac: Math.round(st().baac.debt), fines: f.length, bills: bl.length, pawn: openTickets().length };
  };
  const clean = d => !d.bank && !d.baac && !d.fines && !d.bills;
  agency('exec', 'กรมบังคับคดี — สำนักงานบังคับคดีจังหวัดสุขใจ', 'บังคับคดี', '⚖️', 'ศูนย์ตรวจสอบสถานะหนี้และคดี ขอหนังสือรับรอง ไกล่เกลี่ยหนี้ และตั้งแผนผ่อนชำระอัตโนมัติ (ไม่ยึดทรัพย์ผู้เล่นในเกม)',
    { wd: [8.5, 16.5] }, [
    sv('check', 'ตรวจสอบสถานะหนี้ / คดี / ค่าปรับของฉัน', '🔍', 'สรุปหนี้ธนาคาร ธ.ก.ส. ใบสั่ง ภาษีค้าง และตั๋วจำนำ', {
      req: ['idcard'], run: a => { UI.open('สถานะหนี้และคดี', null, () => { const d = debtSummary(); return `<div class="grid"><div class="card"><div class="ci">🏦</div><div class="cb"><h4>หนี้ธนาคาร</h4><p class="dim">${d.bank ? baht(d.bank) : 'ไม่มี'}</p></div></div><div class="card"><div class="ci">🌾</div><div class="cb"><h4>หนี้ ธ.ก.ส.</h4><p class="dim">${d.baac ? baht(d.baac) : 'ไม่มี'}</p></div></div><div class="card"><div class="ci">🚔</div><div class="cb"><h4>ใบสั่ง/ค่าปรับค้าง</h4><p class="dim">${d.fines} ใบ</p></div></div><div class="card"><div class="ci">🏘️</div><div class="cb"><h4>ภาษีที่ดินค้าง</h4><p class="dim">${d.bills} ใบ</p></div></div><div class="card"><div class="ci">💍</div><div class="cb"><h4>ตั๋วจำนำ</h4><p class="dim">${d.pawn} ใบ</p></div></div></div><p class="lead">${clean(d) ? '<span class="good">✅ ไม่มีภาระหนี้/คดีค้าง ขอหนังสือรับรองได้</span>' : '<span class="bad">⚠️ ยังมีภาระค้าง ขอหนังสือรับรองไม่ได้จนกว่าจะชำระ</span>'}</p><div class="row"><button class="btn ghost" data-a="v26a" data-v="ag|exec">‹ กลับ</button></div>`; }); return true; },
    }),
    sv('cert', 'ขอหนังสือรับรองการไม่มีภาระหนี้/คดี', '📋', 'ค่าธรรมเนียม 100 ฿ ใช้เวลา 1 วัน อายุ 28 วัน ไม่มีหนี้ธนาคาร/ธ.ก.ส. ใบสั่ง หรือภาษีค้าง', {
      req: ['idcard'], can: () => clean(debtSummary()) ? '' : 'ยังมีหนี้/ใบสั่ง/ภาษีค้างชำระ', st: () => status('nodebt'),
      run: a => go(a, 15, () => { apply({ key: 'nodebt', doc: 'nodebt', ag: 'exec', from: 'กรมบังคับคดี', fee: 100, days: 1, data: { by: S.name || '' } }); }),
    }),
    sv('mediate', 'ขอไกล่เกลี่ยหนี้ธนาคาร (ลดหนี้ 8%)', '🤝', 'หนี้ธนาคารตั้งแต่ 5,000 ฿ ค่าธรรมเนียม 300 ฿ ทำได้ปีละครั้ง เจ้าหนี้ยอมลดเงินต้น 8%', {
      req: ['idcard'], can: () => { const b = Bank2.st(); return (b.debt || 0) < 5000 ? 'ต้องมีหนี้ธนาคารตั้งแต่ 5,000 ฿' : S.day - st().exec.mediated < YD ? `ไกล่เกลี่ยได้อีกครั้ง${RD(st().exec.mediated + YD)}` : ''; },
      run: a => go(a, 45, () => { const b = Bank2.st(), cut = Math.round(b.debt * 0.08); if (!pay(300, 'ค่าธรรมเนียมไกล่เกลี่ยหนี้')) return; b.debt -= cut; st().exec.mediated = S.day; try { Bank2.log('ไกล่เกลี่ยหนี้ ลดเงินต้น', cut); } catch (e) { } msg('กรมบังคับคดี', `ไกล่เกลี่ยสำเร็จ เจ้าหนี้ลดเงินต้น ${baht(cut)} หนี้คงเหลือ ${baht(Math.round(b.debt))}`); UI.toast(`ลดหนี้ ${baht(cut)}`, '🤝'); }),
    }),
    sv('plan', 'ตั้งแผนผ่อนชำระหนี้ธนาคารอัตโนมัติ', '📆', 'หักจากเงินสดทุก 28 วัน ตามจำนวนที่เลือก (ไม่เกินหนี้คงเหลือ) เลือก 0 เพื่อยกเลิก', {
      req: ['idcard'], st: () => st().exec.plan ? `แผนปัจจุบัน ${baht(st().exec.plan)} ทุก 28 วัน` : 'ยังไม่มีแผน',
      run: a => { UI.open('แผนผ่อนชำระ', null, () => `<p class="lead">เลือกยอดผ่อนต่อ 28 วัน (ปัจจุบัน ${st().exec.plan ? baht(st().exec.plan) : 'ไม่มี'})</p><div class="row">${[0, 500, 1000, 2000, 5000].map(v => `<button class="btn ${st().exec.plan === v ? '' : 'ghost'}" data-a="v26a" data-v="plan|${v}">${v ? baht(v) : 'ยกเลิกแผน'}</button>`).join('')}</div><div class="row"><button class="btn ghost" data-a="v26a" data-v="ag|exec">‹ กลับ</button></div>`); return true; },
    }),
  ]);
  A.plan = n => { const x = st().exec; x.plan = +n; x.last = S.day; UI.toast(x.plan ? `ตั้งแผนผ่อน ${baht(x.plan)} ทุก 28 วัน` : 'ยกเลิกแผนผ่อนแล้ว', '📆'); UI.renderBody(); };
  const status = id => { const d = G24.rec(id); if (!d) return ''; return d.exp && S.day > d.exp ? `⛔ ${dn(id)} หมดอายุ (${d.exp})` : `✅ ${dn(id)} ใช้ได้${d.exp ? `ถึง${RD(d.exp)}` : ''}`; };

  // ================= 7. กรมทรัพย์สินทางปัญญา =================
  const EXISTING = ['ไร่สุขใจ', 'สุขใจฟู้ด', 'ทุ่งทอง', 'นกยูงทอง', 'ฟ้าใส', 'ภูผา', 'ดอกบัว', 'เกษตรทอง', 'ตราไก่', 'ปลาทอง'];
  const markTaken = n => { const q = n.toLowerCase().replace(/\s+/g, ''); return EXISTING.some(e => e.replace(/\s+/g, '').toLowerCase() === q) ? 'มีผู้อื่นจดทะเบียนชื่อนี้แล้ว' : st().ip.marks.some(m => m.name.replace(/\s+/g, '').toLowerCase() === q) ? 'คุณจดชื่อนี้ไว้แล้ว' : ''; };
  const hobbyLvl = () => (S.hob ? (S.hob.paint || 0) + (S.hob.music || 0) : 0);
  agency('dip', 'กรมทรัพย์สินทางปัญญา (DIP) — กระทรวงพาณิชย์', 'ทรัพย์สินทางปัญญา', '™️', 'ค้นหา จดเครื่องหมายการค้า และแจ้งลิขสิทธิ์ผลงาน แล้วรับค่าสิทธิ์ (royalty) ทุก 28 วันเมื่อแบรนด์/ผลงานเป็นที่รู้จัก',
    { wd: [8.5, 16.5] }, [
    sv('search', 'ค้นหาชื่อ/เครื่องหมายซ้ำก่อนยื่นจด', '🔍', 'ฟรี ตรวจว่าชื่อแบรนด์ซ้ำกับผู้ที่จดไว้แล้วหรือไม่', { run: a => { UI.open('ค้นหาเครื่องหมายการค้า', null, () => `<p class="lead">พิมพ์ชื่อแบรนด์ที่ต้องการ</p><div class="row"><input id="v26q" maxlength="30" placeholder="เช่น ไร่สุขใจ ออร์แกนิก" style="flex:1"><button class="btn" data-a="v26a" data-v="ipsearch">ค้นหา</button></div><div id="v26res"></div><div class="row"><button class="btn ghost" data-a="v26a" data-v="ag|dip">‹ กลับ</button></div>`); return true; } }),
    sv('tm', 'ยื่นจดทะเบียนเครื่องหมายการค้า (แบรนด์ธุรกิจ)', '™️', 'ต้องมีหนังสือรับรองนิติบุคคล (DBD) ค่าธรรมเนียม 1,000 ฿ ใช้เวลา 4 วัน อายุ 10 ปี (840 วัน) ได้ค่าสิทธิ์ 150 ฿ ต่อแบรนด์ ทุก 28 วัน', {
      req: ['idcard', 'bizcert'], st: () => `แบรนด์ที่จดแล้ว ${st().ip.marks.length} · ${status('tmark')}`,
      run: a => { UI.open('ยื่นจดเครื่องหมายการค้า', null, () => `<p class="lead">ชื่อแบรนด์ (ไทยหรืออังกฤษ 3-30 ตัวอักษร) ค่าธรรมเนียม 1,000 ฿</p><div class="row"><input id="v26b" maxlength="30" placeholder="ชื่อแบรนด์" style="flex:1"><button class="btn" data-a="v26a" data-v="tmsub">ยื่นคำขอ</button></div><div class="row"><button class="btn ghost" data-a="v26a" data-v="ag|dip">‹ กลับ</button></div>`); return true; },
    }),
    sv('copy', 'แจ้งข้อมูลลิขสิทธิ์ผลงาน (ภาพวาด / เพลง)', '©️', 'ต้องมีผลงานจากงานอดิเรก (วาดรูป/ดนตรี) ค่าธรรมเนียม 200 ฿ ได้ค่าสิทธิ์ 80 ฿ ต่อผลงาน ทุก 28 วัน สูงสุด 3 ผลงาน', {
      req: ['idcard'], can: () => hobbyLvl() < 1 ? 'ยังไม่มีผลงานจากงานอดิเรก (ฝึกวาดรูปหรือดนตรีก่อน)' : st().ip.copies.length >= 3 ? 'แจ้งลิขสิทธิ์ครบ 3 ผลงานแล้ว' : '', st: () => `ผลงานที่แจ้งแล้ว ${st().ip.copies.length}/3`,
      run: a => go(a, 25, () => { const x = st().ip, kind = (S.hob.paint || 0) >= (S.hob.music || 0) ? 'ภาพวาด' : 'บทเพลง', title = `${kind} "${(S.name || 'ผู้เล่น').split(/\s+/)[0]} #${x.copies.length + 1}"`; if (!pay(200, 'ค่าธรรมเนียมลิขสิทธิ์')) return; x.copies.push({ t: title, day: S.day }); const d = has('copyrt'); if (d) d.data.works = x.copies.map(c => c.t); else grant('copyrt', { works: x.copies.map(c => c.t) }, 'กรมทรัพย์สินทางปัญญา', 'ออก'); msg('กรมทรัพย์สินทางปัญญา', `รับแจ้งลิขสิทธิ์ ${title} แล้ว เริ่มรับค่าสิทธิ์ทุก 28 วัน`); }),
    }),
    sv('renew', 'ต่ออายุทะเบียนเครื่องหมายการค้า', '🔁', 'ค่าธรรมเนียม 800 ฿ ต่อได้ก่อนหมดอายุหรือหลังหมดอายุไม่เกิน 84 วัน', {
      req: ['idcard'], can: () => { const d = G24.rec('tmark'); return !d ? 'ยังไม่เคยจดเครื่องหมายการค้า' : S.day > d.exp + YD ? 'เกินระยะต่ออายุ ต้องยื่นจดใหม่' : d.exp - S.day > 84 ? `ต่อได้ใกล้หมดอายุ (เหลือ ${d.exp - S.day} วัน)` : ''; },
      run: a => go(a, 20, () => { if (!pay(800, 'ต่ออายุเครื่องหมายการค้า')) return; const d = G24.rec('tmark'); d.exp = Math.max(S.day, d.exp) + 10 * YD; msg('กรมทรัพย์สินทางปัญญา', `ต่ออายุทะเบียนเครื่องหมายการค้าถึง${RD(d.exp)}`); UI.toast('ต่ออายุเครื่องหมายการค้าแล้ว', '™️'); }),
    }),
  ]);
  A.ipsearch = () => { const n = $v('v26q'), el = document.getElementById('v26res'); if (!el) return; if (n.length < 3) { el.innerHTML = '<p class="lead bad">พิมพ์อย่างน้อย 3 ตัวอักษร</p>'; return; } const t = markTaken(n); el.innerHTML = t ? `<p class="lead bad">❌ "${esc(n)}" — ${t}</p>` : `<p class="lead good">✅ "${esc(n)}" ยังว่าง จดทะเบียนได้</p>`; };
  A.tmsub = () => {
    const n = $v('v26b'); if (n.length < 3) { UI.toast('ชื่อแบรนด์ต้องมีอย่างน้อย 3 ตัวอักษร', '⚠️'); return; } const t = markTaken(n); if (t) { UI.toast(`${t}`, '❌'); return; }
    if (!need(['idcard', 'bizcert'], 'จดเครื่องหมายการค้า')) return;
    UI.close(); fade(() => { tick(20 + queue()); apply({ key: 'tmark', doc: 'tmark', ag: 'dip', from: 'กรมทรัพย์สินทางปัญญา', fee: 1000, days: 4, data: { names: [n] }, merge: d => { const old = G24.rec('tmark'), names = ((old && old.data.names) || []).concat([n]); st().ip.marks.push({ name: n, day: S.day }); return { names }; } }); agUI('dip'); });
  };

  // ================= 8. 1111 + คุ้มครองแรงงาน =================
  const TOPICS = {
    road: { n: 'ถนนชำรุด / ไฟสาธารณะดับ', to: 'เทศบาลตำบลสุขใจ', p: 0.85, pay: 0 },
    labour: { n: 'นายจ้างค้างค่าจ้าง / ไม่จ่ายค่าล่วงเวลา', to: 'สำนักงานสวัสดิการและคุ้มครองแรงงาน', p: 0.65, pay: [1200, 2500], need: () => (typeof Career !== 'undefined' && Career.C && Career.C()) ? '' : 'ต้องมีงานประจำจึงร้องเรียนนายจ้างได้' },
    shop: { n: 'ร้านค้าขายของไม่ได้มาตรฐาน', to: 'สำนักงานคุ้มครองผู้บริโภค (สคบ.)', p: 0.7, pay: [300, 900] },
    env: { n: 'มลพิษ / เสียงดังรบกวน', to: 'องค์การบริหารส่วนตำบลสุขใจ', p: 0.7, pay: 0 },
    ins: { n: 'บริษัทประกันไม่จ่ายสินไหม', to: 'สำนักงาน คปภ.', p: 0.6, pay: [800, 2000], need: () => POLICIES().length ? '' : 'ยังไม่เคยทำประกันภัย' },
    svc: { n: 'เจ้าหน้าที่รัฐให้บริการล่าช้า', to: 'ศูนย์ดำรงธรรมจังหวัด', p: 0.8, pay: 0 },
    other: { n: 'เรื่องอื่น ๆ', to: 'ศูนย์ดำรงธรรมจังหวัด', p: 0.5, pay: 0 },
  };
  const complaintForm = pre => UI.open('ยื่นเรื่องร้องเรียน 1111', null, () => `<p class="lead">แนบสำเนาบัตรประชาชน ระบุหัวข้อและรายละเอียดอย่างน้อย 20 ตัวอักษร ผลภายใน 3-6 วัน</p>
    <p class="dim">หัวข้อ</p><select id="v26ct">${Object.entries(TOPICS).map(([k, t]) => `<option value="${k}"${k === pre ? ' selected' : ''}>${esc(t.n)}</option>`).join('')}</select>
    <p class="dim">รายละเอียด</p><textarea id="v26cx" maxlength="200" rows="3" style="width:100%" placeholder="เกิดอะไรขึ้น เมื่อไร ที่ไหน มีหลักฐานอะไรบ้าง"></textarea>
    <div class="row"><button class="btn" data-a="v26a" data-v="csub">ส่งเรื่อง (ฟรี)</button><button class="btn ghost" data-a="v26a" data-v="ag|dd">‹ กลับ</button></div>`);
  A.csub = () => {
    const k = $v('v26ct'), tx = $v('v26cx'), T = TOPICS[k]; if (!T) return;
    if (tx.length < 20) { UI.toast('ใส่รายละเอียดอย่างน้อย 20 ตัวอักษร', '⚠️'); return; }
    const w = T.need ? T.need() : ''; if (w) { UI.toast(w, '⚠️'); return; }
    if (!need(['idcard'], 'ยื่นเรื่องร้องเรียน')) return;
    const x = st(), c = { no: 'CMP-' + String(++x.cn).padStart(4, '0'), k, tx, day: S.day, due: S.day + 3 + Math.floor(rnd('d' + S.day + x.cn) * 4), st: 'open' }; x.cases.push(c);
    UI.toast(`รับเรื่อง ${c.no} แล้ว ส่งต่อ ${T.to} ผลภายใน${RD(c.due)}`, '📣'); msg('ศูนย์ดำรงธรรม 1111', `รับเรื่องร้องเรียน ${c.no} "${T.n}" ส่งต่อ ${T.to} ผลภายใน${RD(c.due)}`); agUI('dd');
  };
  const casesUI = () => UI.open('ติดตามเรื่องร้องเรียน', null, () => { const L = st().cases.slice().reverse(); return `${L.length ? `<div class="grid">${L.map(c => `<div class="card"><div class="ci">${c.st === 'open' ? '⏳' : c.res === 'ok' ? '✅' : c.res === 'fwd' ? '📨' : '❌'}</div><div class="cb"><h4>${esc(c.no)} · ${esc(TOPICS[c.k].n)}</h4><p class="dim">ยื่น${RD(c.day)} · ${c.st === 'open' ? `ผล${RD(c.due)}` : esc(c.msg || '')}</p></div></div>`).join('')}</div>` : '<p class="empty">ยังไม่เคยยื่นเรื่อง</p>'}<div class="row"><button class="btn ghost" data-a="v26a" data-v="ag|dd">‹ กลับ</button></div>`; });
  const myEmployees = () => (typeof Company !== 'undefined' ? Company.list() : []).filter(c => c.staff && c.staff.length);
  agency('dd', 'ศูนย์ดำรงธรรม 1111 และสำนักงานคุ้มครองแรงงาน', 'ร้องเรียน / แรงงาน', '📣', 'รับเรื่องร้องเรียน ติดตามผล ขอหนังสือรับรองการทำงาน และขึ้นทะเบียนนายจ้างเมื่อบริษัทของคุณมีลูกจ้าง',
    { wd: [8.5, 16.5] }, [
    sv('file', 'ยื่นเรื่องร้องเรียน (1111)', '📣', 'เลือกหัวข้อ ส่งเรื่องให้หน่วยงานที่เกี่ยวข้อง ฟรี ต้องใช้สำเนาบัตรประชาชน', { req: ['idcard'], run: a => { UI.close(); complaintForm(); } }),
    sv('track', 'ติดตามสถานะเรื่องร้องเรียน', '🔎', 'ดูผลเรื่องที่ยื่นไว้ (แก้ไขแล้ว / ส่งต่อ / ไม่รับพิจารณา)', { st: () => `เรื่องที่ค้างอยู่ ${st().cases.filter(c => c.st === 'open').length}`, run: a => { casesUI(); return true; } }),
    sv('work', 'ขอหนังสือรับรองการทำงาน', '💼', 'ใช้ยืนยันอาชีพและรายได้ ต้องมีงานประจำ ทำงานมาแล้ว ≥ 1 สัปดาห์ ค่าธรรมเนียม 50 ฿ ออกทันที อายุ 28 วัน', {
      req: ['idcard'], can: () => { const j = S.job, C = typeof Career !== 'undefined' && Career.C && Career.C(); return !C ? 'ต้องมีงานประจำ (สมัครงานที่ศูนย์จัดหางานก่อน)' : (j.weeks || 0) < 1 ? 'ต้องทำงานมาแล้วอย่างน้อย 1 สัปดาห์' : ''; }, st: () => status('workcert'),
      run: a => go(a, 15, () => { const C = Career.C(); apply({ key: 'workcert', doc: 'workcert', ag: 'dd', from: 'สำนักงานคุ้มครองแรงงาน', fee: 50, days: 0, data: { job: C.n, weeks: S.job.weeks || 0, rank: S.job.rank || 0 } }); }),
    }),
    sv('emp', 'ขึ้นทะเบียนนายจ้าง / แจ้งลูกจ้างเข้าประกันสังคม (สปส.1-03)', '🏭', 'ต้องมีบริษัทที่มีลูกจ้างและหนังสือรับรองนิติบุคคล ฟรี ออกทันที หลังจากนี้จะแจ้งการส่งสมทบแทนลูกจ้างทุก 28 วัน', {
      req: ['idcard', 'bizcert'], can: () => has('employer') ? 'ขึ้นทะเบียนนายจ้างแล้ว' : myEmployees().length ? '' : 'ยังไม่มีบริษัทที่มีลูกจ้าง', st: () => status('employer'),
      run: a => go(a, 30, () => { const L = myEmployees(); apply({ key: 'employer', doc: 'employer', ag: 'dd', from: 'สำนักงานประกันสังคม', fee: 0, days: 0, data: { cos: L.map(c => c.name), staff: L.reduce((s, c) => s + c.staff.length, 0) } }); }),
    }),
  ]);

  // ================= 9. คลินิกเวชกรรม & วัคซีน (เอกชน) =================
  const VAC = { flu: ['ไข้หวัดใหญ่', 350, YD, '🤧'], tet: ['บาดทะยัก', 250, 2 * YD, '🩹'], cov: ['โควิด-19', 900, YD, '😷'], hepb: ['ตับอักเสบบี (3 เข็ม)', 1200, 4 * YD, '🧬'], rab: ['พิษสุนัขบ้า', 1800, 2 * YD, '🐕'] };
  const vaxOn = k => { const v = st().clinic.vac[k]; return !!v && v >= S.day; };
  const clinicPay = (fee, label) => {
    if (typeof Ins !== 'undefined' && Ins.has('health') && fee <= 3000) { UI.toast(`ใช้สิทธิ์ประกันสุขภาพ (Cashless) ไม่ต้องจ่ายเงิน — ${label}`, '🏥'); st().clinic.insPaid = (st().clinic.insPaid || 0) + fee; return true; }
    return pay(fee, label);
  };
  const vaxCard = () => { const x = st().clinic; const d = G24.rec('vaccard'); if (d) d.data.vac = Object.assign({}, x.vac); else grant('vaccard', { vac: Object.assign({}, x.vac) }, 'คลินิกเวชกรรม', 'ออก'); };
  agency('clinic', 'คลินิกเวชกรรมและศูนย์วัคซีน สุขใจเฮลท์', 'คลินิกเอกชน', '🩺', 'คลินิกเอกชน ออกใบรับรองแพทย์ ฉีดวัคซีนพร้อมสมุดวัคซีน และตรวจสุขภาพประจำปี รับประกันสุขภาพแบบ Cashless',
    { wd: [9, 20], sat: [9, 17], sun: [9, 12], holOK: true }, [
    sv('cert', 'ตรวจร่างกาย + ขอใบรับรองแพทย์', '🩺', 'ค่าตรวจ 200 ฿ ใช้เวลา 40 นาที อายุ 14 วัน ใช้เบิกประกันสังคม/ประกันสุขภาพหรือสมัครงาน ถ้ากำลังป่วยแพทย์จะให้พักรักษาตัว', {
      req: ['idcard'], st: () => status('medcert'),
      run: a => go(a, 40, () => { if (!clinicPay(200, 'ค่าตรวจและใบรับรองแพทย์')) return; const sick = !!S.sick, rest = S.sick === 2 ? 3 : S.sick ? 2 : 0; st().clinic.visits++; grant('medcert', { sick, rest, cost: 200, diag: sick ? (S.sick === 2 ? 'ป่วยหนัก ควรพักรักษาตัว' : 'ไข้หวัด') : 'ร่างกายแข็งแรงปกติ' }, 'คลินิกเวชกรรม', 'ออก'); }),
    }),
    sv('vax', 'ฉีดวัคซีน (บันทึกลงสมุดวัคซีน)', '💉', 'เลือกวัคซีน 5 ชนิด วัคซีนไข้หวัดใหญ่ช่วยลดโอกาสป่วยจริง', { req: ['idcard'], st: () => `วัคซีนที่ยังคุ้มครอง ${Object.keys(VAC).filter(vaxOn).length}/5`, run: a => { UI.open('ฉีดวัคซีน', null, () => `<p class="lead">ผู้เข้ารับวัคซีนต้องไม่ป่วย${S.sick ? ' <b class="bad">(ตอนนี้คุณป่วย ฉีดไม่ได้)</b>' : ''}</p><div class="grid">${Object.entries(VAC).map(([k, v]) => `<div class="card"><div class="ci">${v[3]}</div><div class="cb"><h4>${v[0]}</h4><p class="dim">${vaxOn(k) ? `<span class="good">✅ คุ้มครองถึง${RD(st().clinic.vac[k])}</span>` : 'ยังไม่ได้รับ/หมดอายุ'} · ค่าฉีด ${baht(v[1])}</p><button class="btn ${vaxOn(k) ? 'ghost' : ''}" data-a="v26a" data-v="vax|${k}">${vaxOn(k) ? 'ฉีดกระตุ้น' : 'ฉีด'}</button></div></div>`).join('')}</div><div class="row"><button class="btn ghost" data-a="v26a" data-v="ag|clinic">‹ กลับ</button></div>`); return true; } }),
    sv('card', 'ขอสำเนาสมุดบันทึกวัคซีน', '📘', 'ฟรี ใช้ประกอบการเดินทางหรือเข้าทำงานบางประเภท', { req: ['idcard'], can: () => Object.keys(st().clinic.vac).length ? '' : 'ยังไม่เคยฉีดวัคซีน', st: () => status('vaccard'), run: a => go(a, 10, () => { vaxCard(); }) }),
    sv('check', 'ตรวจสุขภาพประจำปี (เลือด/ปัสสาวะ/เอกซเรย์)', '🧪', 'ค่าตรวจ 1,200 ฿ ใช้เวลา 90 นาที ปีละครั้ง ได้พลังงาน +20 และกำลังใจ พร้อมคำแนะนำ', {
      req: ['idcard'], can: () => S.day - st().clinic.checkup < YD ? `ตรวจประจำปีได้อีกครั้ง${RD(st().clinic.checkup + YD)}` : '',
      run: a => go(a, 90, () => { if (!clinicPay(1200, 'ตรวจสุขภาพประจำปี')) return; const x = st().clinic; x.checkup = S.day; x.visits++; S.energy = Math.min(maxEnergy(), S.energy + 20); S.mood = Math.min(100, (S.mood || 50) + 6); try { Prog.add(15); } catch (e) { } const tips = ['ผลเลือดปกติ ดื่มน้ำให้พอและออกกำลังกายต่อเนื่อง', 'ไขมันในเลือดเริ่มสูง ลดของทอดและของหวาน', 'ความดันค่อนข้างสูง พักผ่อนให้พอและลดเค็ม', 'สุขภาพโดยรวมดีมาก นอนให้พอต่อไป']; msg('คลินิกเวชกรรม', `ผลตรวจสุขภาพประจำปี: ${tips[Math.floor(rnd('chk' + S.day) * tips.length)]}`); UI.toast('ตรวจสุขภาพประจำปีเสร็จแล้ว', '🧪'); }),
    }),
  ]);
  A.vax = k => {
    const v = VAC[k]; if (!v) return; if (S.sick) { UI.toast('กำลังป่วย ฉีดวัคซีนไม่ได้', '🤒'); return; } if (!need(['idcard'], 'ฉีดวัคซีน')) return;
    if (!clinicPay(v[1], 'วัคซีน' + v[0])) return; const x = st().clinic; x.vac[k] = S.day + v[2]; x.visits++; vaxCard(); S.mood = Math.min(100, (S.mood || 50) + 1);
    UI.toast(`ฉีดวัคซีน${v[0]}แล้ว คุ้มครองถึง${RD(x.vac[k])}`, '💉'); msg('คลินิกเวชกรรม', `บันทึกวัคซีน${v[0]} ลงสมุดวัคซีนแล้ว คุ้มครองถึง${RD(x.vac[k])}`); UI.renderBody();
  };
  if (typeof Life2 !== 'undefined' && Life2.getSick) {
    const _gs = Life2.getSick.bind(Life2);
    Life2.getSick = function (why) { try { if (/ไข้หวัด|หวัด|ไข้|ฝน/.test(String(why)) && vaxOn('flu') && Math.random() < 0.5) { UI.toast('วัคซีนไข้หวัดใหญ่ช่วยให้คุณไม่ป่วยครั้งนี้', '💉'); return; } } catch (e) { } return _gs(why); };
  }

  // ================= 10. ฝ่ายทะเบียนครอบครัว =================
  const regKids = () => ((has('birthcert') || {}).data || {}).kids || [];
  const unreg = () => kids().filter(k => !regKids().some(r => r.name === k.name));
  agency('family', 'งานทะเบียนครอบครัว ที่ว่าการอำเภอสุขใจ', 'สมรส / สูติบัตร', '💍', 'จดทะเบียนสมรส แจ้งเกิด/ขอสูติบัตรบุตร และขอหนังสือรับรองสถานภาพครอบครัว ใช้ประกอบประกันสังคม สวัสดิการ และการลดหย่อนภาษี',
    { wd: [8.5, 16.5] }, [
    sv('wed', 'จดทะเบียนสมรส', '💍', 'ต้องแต่งงานในเกมแล้ว ค่าธรรมเนียม 50 ฿ ออกทันที ต้องมีบัตรประชาชนและทะเบียนบ้าน', {
      req: ['idcard', 'housereg'], can: () => { const r = Social.st(); return has('marriage') ? 'จดทะเบียนสมรสแล้ว' : r.stage !== 'married' ? 'ยังไม่ได้แต่งงาน (ต้องจัดงานแต่งก่อน)' : ''; }, st: () => status('marriage'),
      run: a => go(a, 25, () => { const r = Social.st(); apply({ key: 'marriage', doc: 'marriage', ag: 'family', from: 'ที่ว่าการอำเภอสุขใจ', fee: 50, days: 0, data: { partner: r.partner, day: S.day } }); }),
    }),
    sv('birth', 'แจ้งเกิด / ขอสูติบัตรบุตร (ท.ร.3)', '👶', 'แจ้งภายใน 15 วันหลังเกิด เลยกำหนดปรับ 100 ฿ ต่อคน (บุตรบุญธรรมไม่ถูกปรับ) ต้องมีบัตรประชาชนและทะเบียนบ้าน', {
      req: ['idcard', 'housereg'], can: () => kids().length ? (unreg().length ? '' : 'แจ้งเกิดบุตรครบทุกคนแล้ว') : 'ยังไม่มีบุตร', st: () => `บุตร ${kids().length} คน · แจ้งแล้ว ${regKids().length}`,
      run: a => go(a, 25, () => {
        const L = unreg(); let fine = 0; L.forEach(k => { if (!k.adopted && S.day - (k.born || 0) > 15) fine += 100; });
        if (!pay(fine, 'ค่าปรับแจ้งเกิดเกินกำหนด')) return; const kd = regKids().concat(L.map(k => ({ name: k.name, fem: !!k.fem, born: k.born || 0, adopted: !!k.adopted })));
        const d = has('birthcert'); if (d) { d.data.kids = kd; UI.toast(`ออกสูติบัตรเพิ่ม ${L.map(k => k.name).join(', ')}`, '👶'); } else grant('birthcert', { kids: kd }, 'ที่ว่าการอำเภอสุขใจ', 'ออก');
        msg('ที่ว่าการอำเภอสุขใจ', `แจ้งเกิดบุตร ${L.map(k => k.name).join(', ')} เรียบร้อย${fine ? ` (ค่าปรับแจ้งเกินกำหนด ${baht(fine)})` : ''} ไปเบิกค่าคลอดบุตรที่ประกันสังคมได้`);
      }),
    }),
    sv('fam', 'ขอหนังสือรับรองสถานภาพครอบครัว', '👨‍👩‍👧', 'ต้องมีทะเบียนสมรสหรือสูติบัตรบุตร ค่าธรรมเนียม 30 ฿ ใช้เวลา 1 วัน อายุ 28 วัน', {
      req: ['idcard', 'housereg'], can: () => has('marriage') || has('birthcert') ? '' : 'ต้องมีทะเบียนสมรสหรือสูติบัตรบุตรก่อน', st: () => status('famcert'),
      run: a => go(a, 15, () => { apply({ key: 'famcert', doc: 'famcert', ag: 'family', from: 'ที่ว่าการอำเภอสุขใจ', fee: 30, days: 1, data: { spouse: (has('marriage') || {}).data ? has('marriage').data.partner : '', kids: regKids().length } }); }),
    }),
    sv('tax', 'ตรวจสอบสิทธิลดหย่อนภาษีและสวัสดิการครอบครัว', '🧮', 'ดูสิทธิจากสถานภาพสมรสและบุตร พร้อมเอกสารที่ใช้ยื่น', {
      run: a => { UI.open('สิทธิครอบครัว', null, () => { const m = has('marriage'), k = regKids().length; return `<p class="lead">ลดหย่อนภาษี: คู่สมรส ${m ? '60,000 ฿ ✅' : '— (ต้องมีทะเบียนสมรส)'} · บุตร ${k} คน × 30,000 = ${baht(k * 30000)} ✅ (ต้องมีสูติบัตร)</p><p class="lead">สิทธิประกันสังคม: ค่าคลอดบุตร 6,000 ฿/คน · สงเคราะห์บุตร 800 ฿/คน/28 วัน (ถึงอายุ 6 ปี)</p><p class="dim">เอกสารที่ต้องมี: ${reqLine(['marriage', 'birthcert', 'famcert'])}</p><div class="row"><button class="btn ghost" data-a="v26a" data-v="ag|family">‹ กลับ</button></div>`; }); return true; },
    }),
  ]);

  // ================= days: months of contributions, pensions, interest, tickets, royalties, answers =================
  const daily = () => {
    const x = st();
    // --- social security: one contribution month every 28 days while insured, 39 premium, pension
    const mem = ssoMember();
    if (mem) { if (!x.sso.last) x.sso.last = S.day; if (S.day - x.sso.last >= 28) { x.sso.last = S.day; x.sso.m++; if (mem === 'emp') x.sso.empM++; if (mem === 'emp') x.sso.unempN = 0; } }
    const s39 = G24.rec('sso39'); if (s39 && !s39.data) s39.data = { paidUntil: S.day }; if (s39 && S.day > s39.data.paidUntil && (S.day - s39.issued) % 28 === 0) { if (S.money >= 150) { S.money -= 150; try { Bank2.log('เงินสมทบประกันสังคม ม.39', -150); } catch (e) { } s39.data.paidUntil = S.day + 28; } else if (!s39.data.warned || s39.data.warned < S.day - 27) { s39.data.warned = S.day; msg('สำนักงานประกันสังคม', 'ส่งเงินสมทบ ม.39 ไม่ได้ (เงินไม่พอ 150 ฿) สิทธิขาดส่ง ไปชำระที่สำนักงาน'); } }
    if (x.sso.pen && S.day - x.sso.penLast >= 28) { x.sso.penLast = S.day; gain(1500, 'บำนาญชราภาพ ประกันสังคม'); msg('สำนักงานประกันสังคม', 'โอนบำนาญชราภาพ 1,500 ฿ แล้ว'); }
    // --- pawn: reminder 7 days before, forfeiture 7 days after
    for (const t of x.pawn) {
      if (t.st !== 'open') continue;
      if (t.due - S.day === 7) msg('สถานธนานุบาล', `ตั๋วจำนำ ${t.no} จะครบกำหนดอีก 7 วัน ไถ่ถอนหรือต่อดอกก่อน${RD(t.due + 7)} มิฉะนั้นทรัพย์จะหลุดจำนำ`);
      if (S.day > t.due + 7) { t.st = 'forfeit'; x.shop.push({ no: t.no, item: t.item, qty: t.qty, price: Math.max(20, Math.round(val(t.item) * t.qty * 0.9)) }); msg('สถานธนานุบาล', `ตั๋วจำนำ ${t.no} หลุดจำนำแล้ว ทรัพย์ถูกนำไปขายทอดตลาด`); }
    }
    // --- BAAC interest accrues daily (6.5%/yr) unless the repayment holiday is on
    const b = x.baac; if (b.debt > 0 && b.deferTo < S.day) { const i = b.debt * 0.065 / YD; b.debt = Math.round((b.debt + i) * 100) / 100; b.interest += i; if ((S.day - (b.noted || 0)) >= 28) { b.noted = S.day; msg('ธ.ก.ส.', `ยอดหนี้เกษตรกรปัจจุบัน ${baht(Math.round(b.debt))} (ดอกเบี้ย 6.5% ต่อปี) ชำระได้ที่สาขาหรือขอพักชำระ`); } }
    // --- storm record for the home-insurance claim
    if (S.weather && S.weather.type === 'storm') x.ins.stormDay = S.day;
    // --- execution dept auto instalment
    if (x.exec.plan && S.day - x.exec.last >= 28) { x.exec.last = S.day; const bk = Bank2.st(), p = Math.min(x.exec.plan, Math.round(bk.debt || 0), S.money); if (p > 0) { bk.debt -= p; S.money -= p; try { Bank2.log('ผ่อนชำระหนี้ตามแผนบังคับคดี', -p); } catch (e) { } msg('กรมบังคับคดี', `ตัดบัญชีผ่อนชำระหนี้ตามแผน ${baht(p)}`); } else if ((bk.debt || 0) <= 0) { x.exec.plan = 0; msg('กรมบังคับคดี', 'หนี้ธนาคารชำระครบแล้ว ยกเลิกแผนผ่อนชำระ'); } }
    // --- royalties for trademarks and works
    if (S.day - (x.ip.last || 0) >= 28) {
      x.ip.last = S.day; let r = 0; if (has('tmark')) r += 150 * x.ip.marks.length; r += 80 * x.ip.copies.length;
      if (r > 0) { x.ip.royal += r; gain(r, 'ค่าสิทธิ์ทรัพย์สินทางปัญญา'); msg('กรมทรัพย์สินทางปัญญา', `ค่าสิทธิ์แบรนด์และผลงานรอบนี้ ${baht(r)}`); }
    }
    // --- 1111 answers
    for (const c of x.cases) {
      if (c.st !== 'open' || S.day < c.due) continue; const T = TOPICS[c.k], r = rnd(c.no + c.day); c.st = 'done';
      if (r < T.p * 0.8) { c.res = 'ok'; const pay1 = T.pay ? Math.round(T.pay[0] + rnd(c.no + 'p') * (T.pay[1] - T.pay[0])) : 0; if (pay1) gain(pay1, 'ผลร้องเรียน ' + c.no); c.msg = `ได้รับการแก้ไขแล้ว${pay1 ? ` ได้เงินชดเชย ${baht(pay1)}` : ''}`; }
      else if (r < T.p) { c.res = 'fwd'; c.msg = `ส่งเรื่องต่อไปยัง ${T.to} ให้พิจารณาต่อ (ยังไม่มีผลชดเชย)`; }
      else { c.res = 'no'; c.msg = 'ไม่รับพิจารณา หลักฐานไม่เพียงพอ ยื่นใหม่พร้อมหลักฐานได้'; }
      msg('ศูนย์ดำรงธรรม 1111', `ผลเรื่อง ${c.no} "${T.n}": ${c.msg}`);
    }
    // --- applications ready
    for (const a of x.apps) if (a.st === 'pending' && S.day >= a.due && !a.told) { a.told = 1; msg(a.from, `คำขอ ${dn(a.doc)} (${a.no}) ตรวจเสร็จแล้ว มารับเอกสารที่เคาน์เตอร์ในเวลาทำการ`); }
    // --- employer SSO notice for companies with staff
    if (has('employer') && (S.day % 28) === 0) { const L = myEmployees(); if (L.length) msg('สำนักงานประกันสังคม', `แจ้งเงินสมทบนายจ้างรอบนี้ ลูกจ้าง ${L.reduce((s, c) => s + c.staff.length, 0)} คน (บริษัทหักจากงบดำเนินการแล้ว)`); }
  };
  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { daily(); } catch (e) { console.warn('v26 daily', e); } return r; }; }

  // ================= the phone app =================
  const myDocs = () => Object.keys(NEWD).filter(k => G24.rec(k));
  const appBody = t => {
    const x = st(), open = AG.filter(isOpen).length;
    if (t === 0) return `<p class="lead">🏛️ ${AG.length} หน่วยงานรัฐ/เอกชนที่ต้องใช้เอกสาร · เปิดอยู่ตอนนี้ ${open} แห่ง (กดเข้าไปเพื่อใช้บริการ)</p><div class="grid">${AG.map(a => `<div class="card"><div class="ci">${a.i}</div><div class="cb"><h4>${esc(a.n)}</h4><p class="dim">${esc(a.s)} · ${a.sv.length} บริการ</p><p class="dim">${isOpen(a) ? '🟢 เปิด' : '🔴 ปิด'} · ${esc(hoursText(a))}</p><div class="row"><button class="btn ${isOpen(a) ? '' : 'ghost'}" data-a="v26a" data-v="ag|${a.id}">เข้าใช้บริการ</button></div></div></div>`).join('')}</div>`;
    if (t === 1) { const L = myDocs(); return `<p class="lead">เอกสารจากหน่วยงานกลุ่มนี้ (เอกสารอื่นดูได้ในแอป 🏛️ ราชการ)</p>${L.length ? `<div class="grid">${L.map(k => { const d = G24.rec(k), D = G24.docs[k]; return `<div class="card"><div class="ci">${D.i}</div><div class="cb"><h4>${esc(D.n)}</h4><p class="dim">เลขที่ ${esc(d.no)} · ออก ${fmtD(d.issued)} · ${d.exp ? (S.day > d.exp ? `<span class="bad">⛔ หมดอายุ ${d.exp}</span>` : `<span class="good">✅ ใช้ได้ถึง${RD(d.exp)} (อีก ${d.exp - S.day} วัน)</span>`) : '<span class="good">✅ ไม่มีวันหมดอายุ</span>'}</p></div></div>`; }).join('')}</div>` : '<p class="empty">ยังไม่มีเอกสารจากหน่วยงานกลุ่มนี้</p>'}<h5>เอกสารที่ยังขอได้</h5><p class="dim">${Object.keys(NEWD).filter(k => !G24.rec(k)).map(k => `${NEWD[k].i} ${NEWD[k].n} → ${(AG_BY[NEWD[k].by] || {}).s || ''}`).join(' · ')}</p>`; }
    const P = x.apps.filter(a => a.st !== 'done'), C = x.cases.filter(c => c.st === 'open'), T = openTickets(), d = debtSummary();
    return `<h5>📋 คำขอที่รอรับเอกสาร</h5>${P.length ? `<div class="grid">${P.map(a => `<div class="card"><div class="ci">${S.day >= a.due ? '📬' : '⏳'}</div><div class="cb"><h4>${esc(dn(a.doc))}</h4><p class="dim">${esc(a.no)} · ${S.day >= a.due ? 'พร้อมรับที่ ' + esc((AG_BY[a.ag] || {}).n || '') : `เสร็จ${RD(a.due)}`}</p></div></div>`).join('')}</div>` : '<p class="empty">ไม่มีคำขอค้าง</p>'}
      <h5>💼 สิทธิและภาระของฉัน</h5><p class="lead">🛡️ ประกันสังคม: ${ssoMember() ? 'เป็นผู้ประกันตน' : 'ไม่ได้เป็นผู้ประกันตน'} · สะสม ${x.sso.m} งวด${x.sso.pen ? ' · รับบำนาญ' : ''}</p>
      <p class="lead">🌾 ธ.ก.ส.: หนี้ ${baht(Math.round(x.baac.debt))}${x.baac.deferTo >= S.day ? ` (พักชำระถึง${RD(x.baac.deferTo)})` : ''} · 💍 ตั๋วจำนำ ${T.length} ใบ${T.length ? ` (ใกล้สุด ครบ${RD(Math.min(...T.map(t => t.due)))})` : ''} · 📣 เรื่องร้องเรียนรอผล ${C.length}</p>
      <p class="lead">⚖️ ภาระหนี้/คดี: ${clean(d) ? '<span class="good">ไม่มี</span>' : `<span class="bad">ธนาคาร ${baht(d.bank)} · ใบสั่ง ${d.fines} · ภาษีค้าง ${d.bills}</span>`} · ™️ แบรนด์ ${x.ip.marks.length} · ©️ ผลงาน ${x.ip.copies.length} · 🩸 บริจาคโลหิต ${x.rc.n} ครั้ง · 💉 วัคซีนที่ยังคุ้มครอง ${Object.keys(VAC).filter(vaxOn).length}</p>`;
  };
  const appOpen = () => UI.open('🏛️ หน่วยงานเพิ่มเติม', ['หน่วยงาน', 'เอกสารของฉัน', 'คำขอ & ภาระ'], appBody);
  A.app = () => appOpen();
  if (!APPS.some(a => a.id === 'agency26')) APPS.splice(Math.min(APPS.length, 14), 0, { id: 'agency26', i: '🏛️', n: 'หน่วยงานเพิ่มเติม' });
  Phone.apps.agency26 = () => { setTimeout(() => { Phone.app = null; UI.close(); appOpen(); }, 0); return ''; };
  if (typeof APP_GROUPS !== 'undefined') { const gr = APP_GROUPS.find(x => /บริการ/.test(x[0])) || APP_GROUPS[APP_GROUPS.length - 1]; if (gr && !gr[1].includes('agency26')) gr[1].unshift('agency26'); }

  // ================= also reachable at the district hall: Gov24's directory notes these extras =================
  window.Agency26 = { agencies: AG, open: appOpen, agency: agUI, daily, st, member: ssoMember, isOpen, docs: NEWD, grant, need, debt: debtSummary };
});
