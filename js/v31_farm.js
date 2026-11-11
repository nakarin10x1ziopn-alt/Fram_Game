'use strict';
// ---------- v31_farm: advanced pets & farm. Breeding with simple genetics and pedigree papers, pet shows and livestock fairs, livestock vaccination /
// disease / outbreak reporting with quarantine, farmer & livestock registration and GAP certification, contract sales and export with the
// papers they need, seasonal price forecast, a warehouse with spoilage and a cold room, and cooperative member benefits.
// Phone app "🌾 ฟาร์มพันธุ์ & ตลาดเกษตร". It reuses S.animals / S.pets / S.inv and the existing Gov24 / Life25 / Life26 data. ----------
V23.add('v31_farm', () => {
  const YD = 84, MO = 28;
  const F = () => {
    const x = S.v31f = S.v31f || {}; const d = { preg: [], ped: {}, wh: { dry: 0, cold: 0 }, store: {}, gap: null, contracts: [], offers: { day: -99, list: [] }, exp: [], shows: { reg: [], res: [], tro: 0, fame: 0 }, out: { start: 0, until: 0, rep: 0, q: 0, fine: 0 }, nid: 0, st: { bred: 0, sold: 0, exp: 0, del: 0, lost: 0 }, elec: 0, mon: -1, spoilDay: 0 };
    for (const k in d) if (x[k] === undefined || x[k] === null) x[k] = d[k]; return x;
  };
  const msg = (from, t) => { try { Phone.msg(from, t); } catch (e) { } };
  const num = n => Math.round(+n) || 0;
  const pay = (n, label) => { n = num(n); if (n > 0 && S.money < n) { UI.toast(`เงินไม่พอ ต้องใช้ ${baht(n)}`, '💸'); return false; } if (n > 0) { S.money -= n; try { Bank2.log(label, -n); } catch (e) { } } return true; };
  const gain = (n, src) => { n = num(n); if (n > 0) { try { earn(n); } catch (e) { S.money += n; } try { Bank2.income(src, n); } catch (e) { } } };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const hrOf = () => S.time / 60;
  const holiday = () => !!(window.Cal24 && typeof Cal24.isHoliday === 'function' && Cal24.isHoliday(S.day));
  const dayIdx = () => (S.day - 1) % 7;
  const hasDoc = id => { try { return !!Gov24.has(id); } catch (e) { return true; } };
  const vetOpen = () => hrOf() >= 9 && hrOf() < 19 && !holiday();
  const govOpen = () => window.Hours36 ? Hours36.open('livestock') : (hrOf() >= 8.5 && hrOf() < 16.5 && dayIdx() < 5 && !holiday());
  const coopOn = () => { try { return !!Life25.L().coop.joined; } catch (e) { return false; } };
  const need = (ids, what) => { try { if (window.Agency26 && Agency26.need) return Agency26.need(ids, what); return Gov24.need(ids, what); } catch (e) { return true; } };
  const barnCap = () => { try { return BARN_CAP[(S.up.barn || 1) - 1] || 4; } catch (e) { return 4; } };
  const nm = pool => pick(pool);

  // ---- two papers only this system issues ----
  const NEWD = {
    gap: { n: 'ใบรับรองแหล่งผลิตพืช GAP', i: '🌿', life: 2 * YD, off: 'v31' },
    animmove: { n: 'ใบอนุญาตเคลื่อนย้ายสัตว์ (ปศุสัตว์อำเภอ)', i: '🚚', life: 7, off: 'v31' },
  };
  try { for (const k in NEWD) if (!Gov24.docs[k]) Gov24.docs[k] = NEWD[k]; } catch (e) { }
  const grantDoc = (id, data) => {
    try { const D = Gov24.docs[id], x = Gov24.st(); x.n = (x.n || 0) + 1; x.docs[id] = { no: `${id.slice(0, 3).toUpperCase()}-${String(S.day).padStart(4, '0')}-${String(x.n).padStart(3, '0')}`, issued: S.day, exp: D.life ? (window.DocRules ? DocRules.expFor(id, x.docs[id]) : S.day + D.life) : 0, data: data || {} }; UI.toast(`${D.i} ได้รับ${D.n}แล้ว`, '✅'); msg('หน่วยงานรัฐ', `ออก${D.n} เลขที่ ${x.docs[id].no} ${D.life ? `ใช้ได้ถึง${RD(x.docs[id].exp)}` : ''}`); } catch (e) { console.warn('v31f grant', e); }
  };

  // ================= animals: genetics-lite =================
  const KIND = {
    chicken: { adult: 4, gest: 3, lit: [3, 6], cool: 7, sex: ['ไก่ตัวเมีย', 'ไก่ตัวผู้'], stud: 'ไก่ตัวผู้ (พ่อพันธุ์)', dam: 'แม่ไก่', young: 'ลูกไก่' },
    pig: { adult: 6, gest: 6, lit: [4, 8], cool: 10, sex: ['แม่หมู', 'พ่อหมู'], stud: 'พ่อพันธุ์หมู', dam: 'แม่พันธุ์หมู', young: 'ลูกหมู' },
    sheep: { adult: 7, gest: 7, lit: [1, 2], cool: 12, sex: ['แม่แกะ', 'พ่อแกะ'], stud: 'พ่อพันธุ์แกะ', dam: 'แม่พันธุ์แกะ', young: 'ลูกแกะ' },
    cow: { adult: 10, gest: 9, lit: [1, 1], cool: 16, sex: ['แม่วัว', 'พ่อวัว'], stud: 'พ่อพันธุ์วัว', dam: 'แม่พันธุ์วัว', young: 'ลูกวัว' },
    dog: { adult: 10, gest: 8, lit: [3, 5], cool: 20, sex: ['สุนัขเพศเมีย', 'สุนัขเพศผู้'], young: 'ลูกสุนัข', pet: 1, base: 1800 },
    cat: { adult: 10, gest: 7, lit: [2, 4], cool: 20, sex: ['แมวเพศเมีย', 'แมวเพศผู้'], young: 'ลูกแมว', pet: 1, base: 1400 },
  };
  const PETN = ['มะลิ', 'ทองหยอด', 'ข้าวปั้น', 'โมจิ', 'ถุงเงิน', 'ส้มจี๊ด', 'น้ำตาล', 'ลูกพีช', 'ขนุน', 'ซาลาเปา', 'ไข่ตุ๋น', 'เจ้าเหมียว', 'หมูแฮม', 'บัวลอย', 'ตะวัน', 'พุดซ้อน'];
  const hash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
  const ensure = a => {                                                       // every animal and pet gets a sex, a birth day and three genes
    if (a.v31) return a; const h = hash((a.name || '') + (a.type || '')), f = F();
    a.v31 = 1; a.fid = ++f.nid; a.sex = (h & 1) ? 'F' : 'M';
    a.g = { prod: 4 + ((h >> 2) % 4), health: 4 + ((h >> 5) % 4), conf: 4 + ((h >> 8) % 4) };
    a.born = S.day - (KIND[a.type] ? KIND[a.type].adult + 4 : 14) - (h % 18); a.vac = 0; a.sick = 0; a.cd = 0; a.pre = 0; a.groom = 0;
    return a;
  };
  const herd = () => (S.animals || []).map(ensure);
  const pets = () => { try { return Pets2.list().map(ensure); } catch (e) { return []; } };
  const idOf = a => a.fid;
  const byFid = id => herd().concat(pets()).find(a => a.fid == id);
  const age = a => S.day - (a.born ?? S.day);
  const adult = a => age(a) >= ((KIND[a.type] || {}).adult || 6);
  const sexN = a => (KIND[a.type] ? KIND[a.type].sex[a.sex === 'F' ? 0 : 1] : a.sex);
  const gtxt = a => `ผลผลิต ${a.g.prod}/10 · สุขภาพ ${a.g.health}/10 · รูปทรง ${a.g.conf}/10`;
  const itemI = a => (ANIMALS[a.type] || (typeof PETS !== 'undefined' && PETS[a.type]) || { i: '🐾' }).i;
  const nameOf = a => (ANIMALS[a.type] || (typeof PETS !== 'undefined' && PETS[a.type]) || { n: a.type }).n;
  const isPet = a => !!KIND[a.type] && KIND[a.type].pet;
  const quarantined = () => F().out.q >= S.day;
  const petVet = a => { try { return Life26.L().vet[a.name] || null; } catch (e) { return null; } };
  const vacOk = a => isPet(a) ? !!(petVet(a) && petVet(a).rab >= S.day) : a.vac >= S.day;
  const ped = a => F().ped[a.fid];
  const worth = a => {                                                       // market value of a breeding / young animal
    const K = KIND[a.type], base = K.pet ? K.base : (ANIMALS[a.type] || { price: 1000 }).price;
    const gq = 0.5 + 0.03 * (a.g.prod + a.g.health + a.g.conf);
    return Math.round(base * gq * (ped(a) ? 1.6 : 1) * (adult(a) ? 1 : 0.5) * (a.sick ? 0.4 : 1) / 10) * 10;
  };
  const removeAnimal = a => {
    const i = S.animals.indexOf(a); if (i >= 0) S.animals.splice(i, 1);
    try { const k = G.animals.findIndex(o => o.d === a); if (k >= 0) { const o = G.animals[k]; if (o.obj && o.obj.parent) o.obj.parent.remove(o.obj); if (o.chicks) for (const c of o.chicks) if (c.obj && c.obj.parent) c.obj.parent.remove(c.obj); G.animals.splice(k, 1); } } catch (e) { }
  };
  const addLivestock = (type, extra) => {
    if (S.animals.length >= barnCap()) return null;
    const a = Object.assign({ type, name: pick(['ป๊อปคอร์น', 'มะลิ', 'ข้าวตู', 'บัวลอย', 'ทองดี', 'ส้มโอ', 'นมเย็น', 'ขนมปัง', 'ลูกชุบ', 'โกโก้', 'มัชฉะ', 'ถั่วแดง', 'ฟักทอง', 'ตะลิงปลิง']) + S.animals.length, happy: 60, prod: false, petted: false }, extra || {});
    S.animals.push(a); ensure(Object.assign(a, extra || {})); try { if (G.started) addAnimalObj(a); } catch (e) { }
    return a;
  };
  const addPet = (type, extra) => {
    const L = Pets2.list(); if (L.length >= 5) return null;
    const p = Object.assign({ name: pick(PETN) + L.length, type, spd: 0, beauty: 0, joy: 70, wins: 0 }, extra || {}); L.push(p); ensure(Object.assign(p, extra || {})); return p;
  };

  // ---- breeding ----
  const canBreed = (m, s) => {
    if (!m || !s || m.type !== s.type || m.sex !== 'F' || s.sex !== 'M') return 'ต้องเป็นแม่พันธุ์กับพ่อพันธุ์ชนิดเดียวกัน';
    if (!adult(m) || !adult(s)) return 'ยังเป็นลูกสัตว์ (โตเต็มวัยก่อน)';
    if (m.sick || s.sick) return 'มีตัวป่วย ผสมพันธุ์ไม่ได้';
    if (m.pre) return `${m.name} ท้องอยู่แล้ว (คลอด${RD(m.pre)})`;
    if (m.cd > S.day) return `${m.name} ยังพักฟื้นหลังคลอด (ถึง${RD(m.cd)})`;
    if (!isPet(m) && quarantined()) return 'ฟาร์มอยู่ในช่วงกักกันโรค';
    return '';
  };
  const related = (m, s) => (m.sire && (m.sire === s.fid || m.sire === s.sire)) || (m.dam && (m.dam === s.dam)) || (s.sire && s.sire === m.fid) || (s.dam && s.dam === m.fid);
  const breed = (mid, sid) => {
    const m = byFid(mid), s = byFid(sid), why = canBreed(m, s); if (why) { UI.toast(why, '🐾'); return; }
    const fee = isPet(m) ? 0 : 0; m.pre = S.day + KIND[m.type].gest; F().preg.push({ id: m.fid, sire: s.fid, due: m.pre, inbred: related(m, s) ? 1 : 0 });
    UI.toast(`${m.name} ตั้งท้อง คาดคลอด${RD(m.pre)}${related(m, s) ? ' ⚠️ สายเลือดชิด ลูกอาจอ่อนแอ' : ''}`, itemI(m));
    msg('ฟาร์ม', `ผสมพันธุ์ ${m.name} × ${s.name} คาดคลอด${RD(m.pre)}${related(m, s) ? ' (เป็นญาติกัน ลูกมีโอกาสอ่อนแอและยีนสุขภาพลดลง)' : ''}`);
  };
  const born = (pr) => {
    const m = byFid(pr.id), s = byFid(pr.sire); if (!m) return;
    const K = KIND[m.type], n = Math.round(rnd(K.lit[0], K.lit[1] + 0.99)); m.pre = 0; m.cd = S.day + K.cool;
    const mg = m.g, sg = s ? s.g : m.g; let ok = 0, sold = 0, lost = 0, kept = [];
    for (let i = 0; i < n; i++) {
      const mut = () => Math.round(rnd(-1.4, 1.4));
      const g = { prod: clamp(Math.round((mg.prod + sg.prod) / 2) + mut(), 1, 10), health: clamp(Math.round((mg.health + sg.health) / 2) + mut() - (pr.inbred ? 1 : 0), 1, 10), conf: clamp(Math.round((mg.conf + sg.conf) / 2) + mut(), 1, 10) };
      if (g.health <= 3 && Math.random() < 0.18 + (pr.inbred ? 0.12 : 0)) { lost++; F().st.lost++; continue; }
      const ex = { sex: Math.random() < 0.5 ? 'F' : 'M', g, born: S.day, sire: pr.sire, dam: m.fid, vac: 0, sick: 0, cd: 0, pre: 0, groom: 0, v31: 1 };
      let a = null;
      if (isPet(m)) a = addPet(m.type, ex); else a = addLivestock(m.type, ex);
      if (a) { a.fid = ++F().nid; ok++; kept.push(a); }
      else { const price = Math.round((K.pet ? K.base : (ANIMALS[m.type] || { price: 800 }).price) * 0.35 * (0.6 + 0.04 * (g.prod + g.health + g.conf)) * (ped(m) ? 1.6 : 1) / 10) * 10; gain(price, `ขาย${K.young} (ที่เลี้ยงไม่พอ)`); sold++; }
    }
    F().st.bred += ok + sold;
    msg('ฟาร์ม', `${m.name} คลอด${K.young} ${n} ตัว: เลี้ยงไว้ ${ok}${sold ? ` · ขายต่อ ${sold} ตัว (${isPet(m) ? 'ที่เลี้ยงสัตว์เต็ม 5 ตัว' : 'คอกเต็ม'})` : ''}${lost ? ` · ตาย ${lost} ตัว (ลูกอ่อนแอ)` : ''}`);
    UI.toast(`${m.name} คลอด${K.young} ${n} ตัว`, itemI(m));
  };

  // ---- vaccination, vet, disease ----
  const vacCost = () => (hasDoc('livereg') && govOpen() ? 0 : 120);
  const vaccinate = a => {
    if (isPet(a)) { UI.toast('สัตว์เลี้ยงฉีดวัคซีนที่คลินิกสัตว์ (แอป 🧭 ชีวิตจริงเพิ่มเติม › สัตวแพทย์)', '💉'); return; }
    const free = hasDoc('livereg') && govOpen();
    if (!free && !vetOpen()) { UI.toast('สัตวแพทย์เปิด 09:00–19:00 (ปศุสัตว์อำเภอเปิดเฉพาะวันทำการ) หยุดวันนักขัตฤกษ์', '🕒'); return; }
    if (!free && !pay(120, `วัคซีนปากและเท้าเปื่อย ${a.name}`)) return;
    a.vac = S.day + MO * 1.5; UI.toast(`${free ? 'ฉีดวัคซีนฟรีตามโครงการปศุสัตว์' : 'ฉีดวัคซีน'} ${a.name} คุ้มครองถึง${RD(a.vac)}`, '💉');
  };
  const treat = a => {
    if (!vetOpen()) { UI.toast('สัตวแพทย์เปิด 09:00–19:00 วันที่ไม่ใช่วันหยุด', '🕒'); return; }
    const sub = F().out.until >= S.day && hasDoc('livereg') ? 0.5 : 1, cost = Math.round(400 * sub);
    if (!pay(cost, `ค่ารักษาสัตว์ ${a.name}`)) return; a.sick = 0; a.happy = Math.min(100, (a.happy ?? 50) + 10); UI.toast(`${a.name}หายป่วยแล้ว${sub < 1 ? ' (รัฐสนับสนุน 50%)' : ''}`, '💚');
    outbreakCheckEnd();
  };
  const groom = a => { if (a.groom === S.day) return; if (!pay(80, `ตัดแต่งขน/อาบน้ำ ${a.name}`)) return; a.groom = S.day; a.happy = Math.min(100, (a.happy ?? 50) + 4); UI.toast(`${a.name}สะอาดเรียบร้อย (คะแนนประกวดวันนี้ +)`, '🛁'); };
  const outbreakCheckEnd = () => { const o = F().out; if (o.until >= S.day && o.rep && !herd().some(a => a.sick) && S.day - o.rep >= 14) { o.until = 0; o.q = 0; msg('ปศุสัตว์อำเภอ', 'ประกาศยกเลิกพื้นที่ควบคุมโรคปากและเท้าเปื่อยในฟาร์มของคุณแล้ว'); } };
  const sellAnimal = a => {
    if (quarantined()) { UI.toast('ฟาร์มอยู่ในช่วงกักกันโรค ขายสัตว์ไม่ได้', '⛔'); return; }
    const v = worth(a);
    const go = () => { if (isPet(a)) { const L = Pets2.list(), i = L.indexOf(a); if (i >= 0) L.splice(i, 1); if (S.pet && S.pet.name === a.name) S.pet = null; } else removeAnimal(a); gain(v, `ขาย${nameOf(a)} ${a.name}`); F().st.sold++; UI.toast(`ขาย ${a.name} ได้ ${baht(v)}`, '💰'); open(); };
    UI.confirm('ขายสัตว์', `ขาย ${a.name} (${gtxt(a)}) ราคา ${baht(v)}${ped(a) ? ' (มีใบเพ็ดดีกรี ราคาดีกว่า)' : ''}?`, 'ขาย', go);
  };
  const buyStock = (type, sex) => {
    const K = KIND[type], base = (ANIMALS[type] || { price: 1000 }).price, price = Math.round(base * 1.7 / 10) * 10;
    if (S.animals.length >= barnCap()) { UI.toast('คอกเต็ม อัปเกรดคอกที่ร้านช่างไม้ก่อน', '🏠'); return; }
    if (!need(['idcard'], 'ซื้อพ่อ/แม่พันธุ์')) return;
    if (!pay(price, `ซื้อ${sex === 'F' ? K.dam : K.stud}`)) return;
    const a = addLivestock(type, { sex, g: { prod: 6 + Math.floor(Math.random() * 3), health: 6 + Math.floor(Math.random() * 3), conf: 6 + Math.floor(Math.random() * 3) }, born: S.day - K.adult - 3, v31: 1 });
    if (a) { a.fid = ++F().nid; a.vac = S.day + MO; UI.toast(`ซื้อ${sex === 'F' ? K.dam : K.stud}คุณภาพดี ${a.name} (ฉีดวัคซีนมาแล้ว)`, ANIMALS[type].i); }
  };
  const certify = a => {
    if (ped(a)) return; const known = a.sire && a.dam, avg = (a.g.prod + a.g.health + a.g.conf) / 3;
    if (!known && avg < 6) { UI.toast('ขึ้นทะเบียนสายพันธุ์แบบพื้นฐานต้องมียีนเฉลี่ย 6 ขึ้นไป หรือมีพ่อแม่พันธุ์ที่บันทึกไว้', '📜'); return; }
    if (!adult(a)) { UI.toast('ออกใบเพ็ดดีกรีเมื่อโตเต็มวัย', '📜'); return; }
    const fee = known ? 600 : 1500; if (!pay(fee, `ใบรับรองสายพันธุ์ (เพ็ดดีกรี) ${a.name}`)) return;
    F().ped[a.fid] = { no: `PED-${String(S.day).padStart(4, '0')}-${String(a.fid).padStart(3, '0')}`, day: S.day, kind: known ? 'สายเลือดที่บันทึกไว้' : 'ผู้ก่อตั้งสายพันธุ์' };
    UI.toast(`ออกใบเพ็ดดีกรี ${a.name} เลขที่ ${F().ped[a.fid].no}`, '📜'); msg('สมาคมพันธุ์สัตว์', `ออกใบรับรองสายพันธุ์ให้ ${a.name} (${known ? 'มีพ่อแม่พันธุ์บันทึก' : 'ผู้ก่อตั้งสายพันธุ์'}) ราคาขายและคะแนนประกวดสูงขึ้น`);
  };

  // ================= shows & fairs =================
  const PET_SHOW = d => d % 14 === 6, LIVE_FAIR = d => d % 28 === 20;
  const nextEv = fn => { for (let d = S.day; d < S.day + 40; d++) if (fn(d)) return d; return S.day; };
  const entryFee = kind => Math.round((kind === 'pet' ? 200 : 400) * (coopOn() ? 0.5 : 1));
  const showElig = (a, kind) => {
    if (a.sick) return 'ป่วยอยู่';
    if (!adult(a)) return 'ยังเป็นลูกสัตว์';
    if (kind === 'pet') { if (!vacOk(a)) return 'ต้องฉีดวัคซีนพิษสุนัขบ้าให้ครบ (คลินิกสัตว์)'; if ((a.joy ?? 60) < 50) return 'สัตว์เหนื่อย/ไม่มีความสุข (ความสุขต้อง ≥ 50)'; }
    else { if (!vacOk(a)) return 'ต้องมีวัคซีนปากและเท้าเปื่อยที่ยังไม่หมดอายุ'; if (quarantined()) return 'ฟาร์มอยู่ในช่วงกักกันโรค'; if (!hasDoc('livereg') && !hasDoc('farmer')) return 'ต้องมีทะเบียนเกษตรกรหรือทะเบียนฟาร์มปศุสัตว์'; }
    return '';
  };
  const regShow = (fid, kind) => {
    const a = byFid(fid), r = F().shows.reg, ev = nextEv(kind === 'pet' ? PET_SHOW : LIVE_FAIR); if (!a) return;
    const why = showElig(a, kind); if (why) { UI.toast(`${a.name}: ${why}`, '🏆'); return; }
    if (r.some(x => x.fid == fid && x.kind === kind && x.day === ev)) { UI.toast('ลงทะเบียนไว้แล้ว', '🏆'); return; }
    if (ev === S.day && hrOf() > 9) { UI.toast('ปิดรับสมัครแล้ว (ปิด 09:00 ของวันงาน)', '🕒'); return; }
    if (!pay(entryFee(kind), `ค่าสมัคร${kind === 'pet' ? 'ประกวดสัตว์เลี้ยง' : 'ประกวดปศุสัตว์'} ${a.name}`)) return;
    r.push({ fid, kind, day: ev }); UI.toast(`สมัคร ${a.name} เข้าประกวด${RD(ev)} แล้ว`, '🏆');
  };
  const runShow = (kind) => {
    const sh = F().shows, ent = sh.reg.filter(e => e.kind === kind && e.day === S.day); sh.reg = sh.reg.filter(e => !(e.kind === kind && e.day <= S.day));
    if (!ent.length) return;
    const prize = kind === 'pet' ? [5000, 2500, 1200] : [8000, 4000, 2000], title = kind === 'pet' ? 'ประกวดสัตว์เลี้ยงประจำสัปดาห์' : 'งานประกวดปศุสัตว์ประจำเดือน';
    const pool = [];
    for (const e of ent) {
      const a = byFid(e.fid); if (!a) continue;
      let sc;
      if (kind === 'pet') { const st = Pets2.stat(a); sc = st.beauty * 4 + st.spd * 2 + a.g.health * 1.5 + (a.groom >= S.day - 1 ? 6 : 0) + (ped(a) ? 8 : 0) + rnd(0, 12) + (a.joy ?? 60) / 10; }
      else sc = a.g.conf * 4 + a.g.prod * 2.2 + a.g.health * 1.6 + (a.happy ?? 50) / 8 + (a.groom >= S.day - 1 ? 6 : 0) + (ped(a) ? 9 : 0) + (adult(a) ? 0 : -20) + rnd(0, 12);
      pool.push({ n: a.name, sc, mine: 1, a });
    }
    const rivals = pick([5, 6, 7]); for (let i = 0; i < rivals; i++) pool.push({ n: `${pick(['ลุงแดง', 'ป้าจันทร์', 'คุณสมศักดิ์', 'ฟาร์มทองดี', 'น้องฝ้าย', 'ฟาร์มภูเขา', 'ร้านเพ็ทลิฟ'])}`, sc: rnd(34, 62) + Math.min(10, sh.fame * 0.4), mine: 0 });
    pool.sort((x, y) => y.sc - x.sc);
    let text = `${title}: `;
    pool.slice(0, 3).forEach((p, i) => { text += `${['🥇', '🥈', '🥉'][i]} ${p.n}${p.mine ? ' (ของคุณ)' : ''}  `; });
    let won = 0, fame = 0;
    pool.forEach((p, i) => { if (!p.mine || i > 2) return; won += prize[i]; fame += [3, 2, 1][i]; if (i === 0) { sh.tro++; try { Contests.st().wins++; } catch (e) { } try { if (p.a.wins !== undefined) p.a.wins++; } catch (e) { } } });
    if (won) { gain(won, title); sh.fame = Math.min(40, sh.fame + fame); try { Prog.add(20 * (1 + (won > 0))); } catch (e) { } text += ` · คุณได้รางวัล ${baht(won)} (ชื่อเสียงฟาร์ม +${fame})`; }
    else text += ' · ครั้งนี้ไม่ได้รางวัล พยายามเข้านะ';
    sh.res.unshift({ day: S.day, kind, t: text }); sh.res.length = 8; msg('ศูนย์แข่งขัน', text);
    for (const e of ent) { const a = byFid(e.fid); if (a && a.joy !== undefined) a.joy = Math.max(0, a.joy - 6); }
  };

  // ================= registrations: GAP, movement permit =================
  const applyGap = () => {
    const f = F(); if (hasDoc('gap')) { UI.toast('มีใบรับรอง GAP ที่ยังไม่หมดอายุ', '🌿'); return; } if (f.gap) { UI.toast(`กำลังตรวจแปลง (ผล${RD(f.gap.res)})`, '🌿'); return; }
    if (!need(['idcard', 'farmer'], 'ขอใบรับรอง GAP')) return;
    const fee = Math.round(1500 * (coopOn() ? 0.5 : 1)); if (!pay(fee, 'ค่าตรวจรับรองแหล่งผลิตพืช GAP')) return;
    f.gap = { day: S.day, res: S.day + 7, fee }; UI.toast(`ยื่นขอ GAP แล้ว เจ้าหน้าที่เกษตรจะตรวจแปลง ผล${RD(f.gap.res)}${coopOn() ? ' (สมาชิกสหกรณ์ลดค่าตรวจ 50%)' : ''}`, '🌿');
    msg('สำนักงานเกษตรอำเภอ', `รับคำขอ GAP แล้ว นัดตรวจแปลงภายใน 7 วัน (ผล${RD(f.gap.res)}) · เกณฑ์: แปลงสะอาด ใช้ปุ๋ย/น้ำเหมาะสม บันทึกการผลิต`);
  };
  const gapResult = () => {
    const f = F(); if (!f.gap || S.day < f.gap.res) return;
    let plots = 0; try { plots = S.plots.filter(p => p && p.crop).length; } catch (e) { }
    const p = 0.8 + Math.min(0.15, plots * 0.01) - (herd().some(a => a.sick) ? 0.25 : 0) - (f.out.until >= S.day ? 0.3 : 0);
    if (Math.random() < p) { grantDoc('gap', { day: S.day }); } else { const back = Math.round(f.gap.fee * 0.5); gain(back, 'คืนค่าตรวจ GAP (ไม่ผ่าน)'); msg('สำนักงานเกษตรอำเภอ', `GAP ไม่ผ่านการตรวจ: ${herd().some(a => a.sick) ? 'พบสัตว์ป่วยในฟาร์ม' : 'ต้องปรับปรุงการจัดการแปลงและบันทึกการผลิต'} คืนค่าตรวจ ${baht(back)} ยื่นใหม่ได้`); }
    f.gap = null;
  };
  const applyMove = () => {
    if (hasDoc('animmove')) { UI.toast('มีใบอนุญาตเคลื่อนย้ายสัตว์อยู่แล้ว (อายุ 7 วัน)', '🚚'); return; }
    if (!need(['idcard', 'livereg'], 'ขอใบอนุญาตเคลื่อนย้ายสัตว์')) return;
    if (quarantined()) { UI.toast('ฟาร์มอยู่ในช่วงกักกันโรค ห้ามเคลื่อนย้ายสัตว์', '⛔'); return; }
    const hs = herd(); if (!hs.length) { UI.toast('ไม่มีสัตว์ในฟาร์ม', '🐄'); return; }
    if (hs.some(a => a.sick)) { UI.toast('มีสัตว์ป่วย ต้องรักษาให้หายก่อนขอใบอนุญาต', '🤒'); return; }
    if (hs.some(a => !vacOk(a))) { UI.toast('สัตว์ทุกตัวต้องมีวัคซีนปากและเท้าเปื่อยที่ยังไม่หมดอายุ', '💉'); return; }
    if (!govOpen()) { UI.toast('ปศุสัตว์อำเภอปิดอยู่ (จ-ศ 07:30–18:00 · ส 08:00–16:00)', '🕒'); return; }
    if (!pay(150, 'ค่าธรรมเนียมใบอนุญาตเคลื่อนย้ายสัตว์')) return; grantDoc('animmove', { n: hs.length });
  };
  const reportOutbreak = () => { const o = F().out; if (o.until < S.day || o.rep) return; o.rep = S.day; o.q = S.day + 14; msg('ปศุสัตว์อำเภอ', 'รับแจ้งโรคระบาดสัตว์ (ปากและเท้าเปื่อย) แล้ว ประกาศกักกันฟาร์ม 14 วัน: ห้ามขายหรือเคลื่อนย้ายสัตว์ ห้ามส่งประกวด · รักษาสัตว์ป่วยได้รับการสนับสนุนค่ายา 50% (ถ้ามีทะเบียนฟาร์ม)'); UI.toast('แจ้งโรคระบาดแล้ว ฟาร์มถูกกักกัน 14 วัน', '🚨'); };
  const dailyDisease = () => {
    const f = F(), hs = herd(), o = f.out; if (!hs.length) return;
    const dens = hs.length / barnCap(), w = S.weather && S.weather.type, wm = w === 'storm' ? 1.8 : w === 'rain' ? 1.4 : 1;
    for (const a of hs) {
      if (a.sick) { a.prod = false; a.happy = Math.max(0, (a.happy ?? 50) - 8); if (S.day - a.sick >= 7) { removeAnimal(a); f.st.lost++; msg('ฟาร์ม', `${a.name}ป่วยหนักไม่ได้รักษา ตายแล้ว 💔 (ต้องรักษาที่สัตวแพทย์ทันที)`); } continue; }
      const p = 0.003 * (0.6 + dens) * (a.vac >= S.day ? 0.2 : 1) * ((11 - a.g.health) / 6) * wm * ((a.happy ?? 50) < 30 ? 2 : 1) * (o.until >= S.day ? 2.5 : 1);
      if (Math.random() < p) { a.sick = S.day; msg('ฟาร์ม', `${a.name}ไม่สบาย ซึม ไม่กินอาหาร ควรพาไปรักษาที่สัตวแพทย์ (09:00–19:00)`); }
    }
    const un = hs.filter(a => a.vac < S.day).length;
    if (o.until < S.day && hs.length >= 3 && un >= 2 && Math.random() < 0.004 * (un / hs.length) * (0.5 + dens)) {
      o.start = S.day; o.until = S.day + 30; o.rep = 0; o.q = 0; const pickN = Math.min(hs.length, 2);
      for (let i = 0; i < pickN; i++) { const a = pick(hs.filter(x => !x.sick)); if (a) a.sick = S.day; }
      msg('ฟาร์ม', '🚨 สัตว์หลายตัวมีอาการเหมือนโรคปากและเท้าเปื่อย! ต้องแจ้งปศุสัตว์อำเภอภายใน 3 วัน (แอป 🌾 › แท็บสัตว์) มิฉะนั้นปรับ และโรคจะลามหนัก');
    }
    if (o.until >= S.day && !o.rep && S.day - o.start >= 3 && !o.fine) { o.fine = 1; if (!pay(20000, 'ค่าปรับไม่แจ้งโรคระบาดสัตว์')) S.money = Math.max(0, S.money); for (const a of hs.filter(x => !x.sick).slice(0, 2)) a.sick = S.day; msg('ปศุสัตว์อำเภอ', 'ปรับ 20,000 ฿ ฐานไม่แจ้งโรคระบาดสัตว์ภายในกำหนด โรคลามเพิ่ม'); }
    if (o.until < S.day && o.fine) o.fine = 0;
    outbreakCheckEnd();
  };

  // ================= market, contracts, export =================
  const CR = Object.keys(CROPS);
  const mult = (id, day) => {                                                // the game's own daily price swing, reproduced for any day (festival bonus ignored)
    const r = U.hash(day * 7 + 3, strHash(id)), sid = season(day).id; const own = CROP_SEASON[id] === sid;
    return (0.8 + 0.5 * r) * (own ? 0.85 : 1.15);
  };
  const baseOf = id => { const b = (ITEMS[id] && ITEMS[id].base) || id; return b; };
  const unitPrice = (b, q, day) => Math.round(CROPS[b].sell * (q === 2 ? 1.5 : q === 1 ? 1.25 : 1) * mult(b, day));
  const BUYERS = [
    { n: 'ไฮเปอร์มาร์ทสุขใจ', prem: [1.1, 1.25], gap: 0.5 }, { n: 'ครัวคุณยายบริการจัดเลี้ยง', prem: [1.15, 1.35], gap: 0 }, { n: 'โรงงานแปรรูปสุขภาพดี', prem: [1.0, 1.2], gap: 0.7 }, { n: 'ตลาดสดเทศบาล', prem: [1.05, 1.15], gap: 0 }, { n: 'ร้านอาหารริมทะเล', prem: [1.2, 1.4], gap: 0.2 }, { n: 'ผู้ส่งออกสยามเฟรช', prem: [1.2, 1.45], gap: 1 },
  ];
  const genOffers = () => {
    const f = F(), L = [];
    for (let i = 0; i < 5; i++) {
      const by = pick(BUYERS), isLive = Math.random() < 0.25, isProd = !isLive && Math.random() < 0.25;
      const o = { id: ++f.nid, by: by.n, day: S.day, due: S.day + Math.round(rnd(9, 22)), got: 0, st: 'offer', gap: Math.random() < by.gap ? 1 : 0, premi: rnd(by.prem[0], by.prem[1]) };
      if (isLive) { const t = pick(['cow', 'pig', 'sheep', 'chicken']); o.kind = 'live'; o.item = t; o.qty = t === 'chicken' ? 6 : t === 'cow' ? 1 + Math.floor(Math.random() * 2) : 2; o.min = Math.round(rnd(5, 7.5)); o.price = Math.round(ANIMALS[t].price * 0.95 * o.premi / 10) * 10; o.gap = 0; }
      else if (isProd) { const t = pick(['egg', 'milk', 'wool']); o.kind = 'prod'; o.item = t; o.qty = t === 'egg' ? 40 : 12; o.q = 0; o.price = Math.round(PRODUCTS[t].sell * o.premi); o.gap = 0; }
      else { const t = pick(CR.filter(c => !CROPS[c].tree || Math.random() < 0.3)); o.kind = 'crop'; o.item = t; o.q = pick([0, 0, 1, 2]); o.qty = pick([15, 20, 30, 40, 60]); o.price = Math.round(CROPS[t].sell * (o.q === 2 ? 1.5 : o.q === 1 ? 1.25 : 1) * o.premi); }
      L.push(o);
    }
    f.offers = { day: S.day, list: L };
  };
  const have = (b, minQ) => { let n = 0; for (const q of [0, 1, 2]) if (q >= minQ) { const k = q ? b + '@' + q : b; n += count(k) + (F().store[k] || 0); } return n; };
  const takeQ = (b, minQ, n) => {                                              // lowest grade that qualifies first; the warehouse before the bag
    let took = 0, bonus = 0;
    for (const q of [0, 1, 2]) { if (q < minQ) continue; const k = q ? b + '@' + q : b; const st = F().store; const fromS = Math.min(n - took, st[k] || 0); if (fromS) { st[k] -= fromS; if (!st[k]) delete st[k]; took += fromS; bonus += fromS * q; } const fromB = Math.min(n - took, count(k)); if (fromB) { takeItem(k, fromB); took += fromB; bonus += fromB * q; } if (took >= n) break; }
    return { took, bonus };
  };
  const accept = id => { const f = F(), o = f.offers.list.find(x => x.id == id); if (!o || o.st !== 'offer') return; if (f.contracts.filter(c => c.st === 'active').length >= 4) { UI.toast('ทำสัญญาได้พร้อมกันสูงสุด 4 ฉบับ', '📑'); return; } if (o.gap && !hasDoc('gap')) { UI.toast('ผู้ซื้อรายนี้ต้องการสินค้าจากแปลงที่ได้ GAP (ขอที่แท็บ 🏆 › ขอ GAP)', '🌿'); return; } if (!need(['idcard'], 'ทำสัญญาซื้อขายผลผลิต')) return; o.st = 'active'; f.contracts.push(o); f.offers.list = f.offers.list.filter(x => x !== o); msg(o.by, `ตกลงทำสัญญาซื้อ ${itemName(o)} ×${o.qty} ราคา ${baht(o.price)}/หน่วย ส่งภายใน${RD(o.due)} (ผิดสัญญาปรับ 15% ของมูลค่าที่ยังไม่ส่ง)`); UI.toast('ทำสัญญาแล้ว', '📑'); };
  const itemName = o => o.kind === 'live' ? `${ANIMALS[o.item].n} (รูปทรง+สุขภาพเฉลี่ย ≥ ${o.min})` : o.kind === 'prod' ? PRODUCTS[o.item].n : `${CROPS[o.item].n}${o.q ? (o.q === 2 ? ' ★★' : ' ★') : ''}`;
  const deliver = (id) => {
    const f = F(), o = f.contracts.find(x => x.id == id); if (!o || o.st !== 'active') return; const left = o.qty - o.got;
    if (o.kind === 'live') {
      if (quarantined()) { UI.toast('ฟาร์มอยู่ในช่วงกักกันโรค ส่งสัตว์ไม่ได้', '⛔'); return; }
      if (!hasDoc('animmove')) { UI.toast('ต้องมีใบอนุญาตเคลื่อนย้ายสัตว์ (ขอที่แท็บ 🏆 หรือปศุสัตว์อำเภอ)', '🚚'); return; }
      const c = herd().filter(a => a.type === o.item && adult(a) && !a.sick && vacOk(a) && (a.g.conf + a.g.health) / 2 >= o.min && !a.pre).sort((x, y) => (x.g.conf + x.g.health) - (y.g.conf + y.g.health)).slice(0, left);
      if (!c.length) { UI.toast(`ไม่มี${ANIMALS[o.item].n}ที่ตรงเกณฑ์ (โตเต็มวัย สุขภาพดี ฉีดวัคซีน คะแนน ≥ ${o.min}/10)`, '🐄'); return; }
      let tot = 0; for (const a of c) { removeAnimal(a); tot += Math.round(o.price * (1 + (ped(a) ? 0.25 : 0))); } o.got += c.length; gain(tot, `ส่งสัตว์ตามสัญญา ${o.by}`); f.st.del += c.length; UI.toast(`ส่งสัตว์ ${c.length} ตัว ได้ ${baht(tot)}`, '🚚');
    } else {
      const b = o.item, minQ = o.q || 0; const k = o.kind === 'prod' ? { took: 0 } : null;
      let took, bonus = 0;
      if (o.kind === 'prod') { const st = f.store; took = Math.min(left, count(b) + (st[b] || 0)); const fb = Math.min(took, count(b)); if (fb) takeItem(b, fb); if (took - fb) { st[b] -= took - fb; if (!st[b]) delete st[b]; } }
      else { const r = takeQ(b, minQ, left); took = r.took; bonus = r.bonus; }
      if (!took) { UI.toast(`ยังไม่มี${itemName(o)}พอที่จะส่ง`, '📦'); return; }
      const cash = Math.round(took * o.price * (1 + (coopOn() ? 0.05 : 0)) * (1 + bonus / Math.max(1, took) * 0.1 * (minQ ? 0 : 1)));
      o.got += took; gain(cash, `ส่งผลผลิตตามสัญญา ${o.by}`); f.st.del += took; UI.toast(`ส่ง ${itemName(o)} ×${took} ได้ ${baht(cash)}${coopOn() ? ' (สหกรณ์ +5%)' : ''}`, '📦');
    }
    if (o.got >= o.qty) { o.st = 'done'; f.shows.fame = Math.min(40, f.shows.fame + 1); msg(o.by, `ได้รับสินค้าครบตามสัญญาแล้ว ขอบคุณครับ! ชื่อเสียงฟาร์ม +1`); }
  };
  const contractsDay = () => {
    const f = F();
    for (const o of f.contracts) if (o.st === 'active' && S.day > o.due) {
      const pen = Math.round((o.qty - o.got) * o.price * 0.15); o.st = 'fail';
      if (pen > 0 && !pay(pen, `ค่าปรับผิดสัญญา ${o.by}`)) S.money = Math.max(0, S.money);
      f.shows.fame = Math.max(0, f.shows.fame - 2); msg(o.by, `เลยกำหนดส่ง ${itemName(o)} (ส่งแล้ว ${o.got}/${o.qty}) ปรับ ${baht(pen)} ชื่อเสียงฟาร์ม −2`);
    }
    f.contracts = f.contracts.filter(o => o.st === 'active' || S.day - o.due < 20);
    f.offers.list = f.offers.list.filter(o => o.st === 'offer');
    if (S.day - f.offers.day >= 7) genOffers();
  };
  const DEST = {
    sg: { n: 'สิงคโปร์', i: '🇸🇬', prem: 0.35, days: 3, minQ: 0, min: 20, fx: 'SGD', base: 26 },
    jp: { n: 'ญี่ปุ่น', i: '🇯🇵', prem: 0.6, days: 5, minQ: 2, min: 20, fx: 'JPY', base: 0.24 },
    cn: { n: 'จีน', i: '🇨🇳', prem: 0.25, days: 4, minQ: 0, min: 40, fx: null },
  };
  const fxIdx = d => { try { if (d.fx) { const v = Life26.L().abr.fx[d.fx]; if (v) return v / d.base; } } catch (e) { } return 1; };
  const PHYTO = 300, freightOf = b => Math.max(5, Math.round(((CROPS[b] || { sell: 40 }).sell) * 0.12));
  const expReq = d => { const o = []; for (const id of ['idcard', 'commreg', 'gap']) if (!hasDoc(id)) o.push((Gov24.docs[id] || { n: id }).n); return o; };
  const ship = (dk, b) => {
    const d = DEST[dk], f = F(), qty = d.min; if (!d || !CROPS[b]) return;
    const miss = expReq(d); if (miss.length) { UI.toast(`ส่งออกต้องมี: ${miss.join(', ')}`, '🌐'); need(['idcard', 'commreg'], 'ส่งออกผลผลิต'); return; }
    if (quarantined()) { UI.toast('ฟาร์มอยู่ในช่วงกักกันโรค ส่งออกไม่ได้', '⛔'); return; }
    if (have(b, d.minQ) < qty) { UI.toast(`ต้องมี ${CROPS[b].n}${d.minQ ? ' ★★' : ''} อย่างน้อย ${qty} หน่วย (รวมคลังเก็บ) · มี ${have(b, d.minQ)}`, '📦'); return; }
    const cost = PHYTO + freightOf(b) * qty; if (!pay(cost, `ค่าใบรับรองสุขอนามัยพืช + ค่าขนส่ง ${d.n}`)) return;
    const r = takeQ(b, d.minQ, qty), cold = f.wh.cold >= 1 && !powerOutNow();
    const unit = r.took ? Math.round(CROPS[b].sell * (1 + r.bonus / r.took * 0.25) * (1 + d.prem + Math.min(0.1, f.shows.fame * 0.0025))) : 0;
    f.exp.push({ id: ++f.nid, dest: dk, b, qty: r.took, unit, send: S.day, arr: S.day + d.days, loss: cold ? 0.015 : rnd(0.04, 0.09) * (d.days / 3), cold, cost });
    UI.toast(`ส่งออก ${CROPS[b].n} ${r.took} หน่วยไป${d.n} ถึง${RD(S.day + d.days)}${cold ? ' (ขนส่งห้องเย็น เสียหายน้อย)' : ''}`, d.i); msg('บริษัทขนส่งสินค้า', `ออกเดินทางไป${d.n} (ใบสุขอนามัยพืชเลขที่ PHY-${f.nid}) ${CROPS[b].i}×${r.took} คาดถึง${RD(S.day + d.days)} ชำระเงินเมื่อลูกค้าตรวจรับ`);
  };
  const exportDay = () => {
    const f = F(); for (const e of f.exp) if (!e.done && S.day >= e.arr) {
      e.done = 1; const d = DEST[e.dest], fx = fxIdx(d), got = Math.round(e.qty * (1 - e.loss) * e.unit * fx);
      gain(got, `ส่งออก ${CROPS[e.b].n} → ${d.n}`); f.st.exp += e.qty; msg('ลูกค้าต่างประเทศ', `${d.i} ตรวจรับ ${CROPS[e.b].n} ${e.qty} หน่วย เสียหาย ${Math.round(e.loss * 100)}% ชำระ ${baht(got)}${fx !== 1 ? ` (อัตราแลกเปลี่ยน ×${fx.toFixed(2)})` : ''}`);
    }
    f.exp = f.exp.filter(e => !e.done || S.day - e.arr < 10);
  };
  const powerOutNow = () => { try { return Power.st().out > 0; } catch (e) { return false; } };

  // ================= warehouse =================
  const WH = { dry: { n: 'ยุ้งฉาง/โกดังเก็บผลผลิต', i: '🏚️', cap: [0, 100, 250, 500, 1000], cost: [0, 8000, 20000, 45000, 90000] }, cold: { n: 'ห้องเย็นเก็บผลผลิต', i: '🧊', cap: [0, 60, 150, 300, 600], cost: [0, 25000, 60000, 120000, 240000], kw: [0, 40, 90, 160, 280] } };
  const RATE = b => (b === 'corn' || b === 'sunflower') ? 0.006 : b === 'pumpkin' ? 0.005 : b === 'pineapple' ? 0.01 : (CROPS[b] && CROPS[b].tree) ? 0.02 : b === 'watermelon' ? 0.02 : b === 'milk' ? 0.08 : b === 'egg' ? 0.025 : b === 'wool' ? 0.001 : b === 'truffle' ? 0.04 : 0.035;
  const FREE = 60;                                                          // a farmer carries 60 of each crop in baskets before it starts to spoil in the bag
  const cap = k => WH[k].cap[F().wh[k]];
  const used = () => Object.values(F().store).reduce((t, n) => t + n, 0);
  const baseKey = k => k.split('@')[0];
  const buildWh = k => { const f = F(), lv = f.wh[k]; if (lv >= 4) return; const c = WH[k].cost[lv + 1]; if (!need(['idcard'], 'ก่อสร้างโกดัง')) return; if (!pay(c, `${lv ? 'ขยาย' : 'สร้าง'}${WH[k].n}`)) return; f.wh[k]++; UI.toast(`${WH[k].n} ระดับ ${f.wh[k]} (ความจุ ${cap(k)} หน่วย)`, WH[k].i); };
  const storeIn = (k, n) => { const f = F(); const room = cap('dry') + cap('cold') - used(); n = n === 'all' ? count(k) : Math.min(+n, count(k)); n = Math.min(n, room); if (n <= 0) { UI.toast(room <= 0 ? 'คลังเต็มหรือยังไม่มีคลัง (สร้างยุ้งฉาง/ห้องเย็นก่อน)' : 'ไม่มีของในกระเป๋า', '📦'); return; } takeItem(k, n); f.store[k] = (f.store[k] || 0) + n; UI.toast(`เก็บเข้าคลัง ${ITEMS[k] ? ITEMS[k].n : k} ×${n}`, '📦'); };
  const storeOut = (k, n) => { const f = F(); n = n === 'all' ? f.store[k] : Math.min(+n, f.store[k] || 0); if (n <= 0) return; f.store[k] -= n; if (!f.store[k]) delete f.store[k]; addItem(k, n); UI.toast(`นำออกจากคลัง ${ITEMS[k] ? ITEMS[k].n : k} ×${n}`, '📦'); };
  const storeSell = (k, n) => { const f = F(); n = n === 'all' ? f.store[k] : Math.min(+n, f.store[k] || 0); if (n <= 0 || !ITEMS[k]) return; const v = priceOf(k) * n; f.store[k] -= n; if (!f.store[k]) delete f.store[k]; gain(v, `ขายผลผลิตจากคลัง ${ITEMS[k].n}`); UI.toast(`ขาย ${ITEMS[k].n} ×${n} ได้ ${baht(v)} (ราคารับซื้อวันนี้)`, '💰'); };
  const spoilDay = () => {
    const f = F(), cold = f.wh.cold >= 1 && !powerOutNow(), lost = [];
    for (const k of Object.keys(f.store)) {
      const b = baseKey(k), inCold = Math.min(1, cap('cold') / Math.max(1, used())), rate = RATE(b) * (cold ? (0.1 * inCold + 0.6 * (1 - inCold)) : (f.wh.cold >= 1 && powerOutNow() ? 0.9 : 0.6));
      const n = f.store[k], dead = Math.floor(n * rate + (Math.random() < (n * rate) % 1 ? 1 : 0)); if (dead > 0) { f.store[k] -= dead; lost.push(`${ITEMS[k] ? ITEMS[k].n : k} ${dead}`); if (f.store[k] <= 0) delete f.store[k]; }
    }
    // the bag: only what is above the basket allowance spoils
    const bag = {}; for (const k of Object.keys(S.inv)) { const it = ITEMS[k]; if (it && (it.cat === 'crop' || (it.cat === 'product' && k !== 'wool'))) { const b = it.base || k; bag[b] = (bag[b] || 0) + S.inv[k]; } }
    for (const b in bag) { const ex = bag[b] - FREE; if (ex <= 0) continue; let dead = Math.floor(ex * RATE(b)); if (dead < 1 && Math.random() < ex * RATE(b)) dead = 1; if (dead <= 0) continue; let left = dead; for (const k of [b, b + '@1', b + '@2']) { const x = Math.min(left, count(k)); if (x) { takeItem(k, x); left -= x; } } lost.push(`${(ITEMS[b] || { n: b }).n} ${dead}(ในกระเป๋า)`); }
    if (lost.length && S.day - f.spoilDay >= 3) { f.spoilDay = S.day; msg('ฟาร์ม', `ผลผลิตเน่าเสียวันนี้: ${lost.slice(0, 5).join(', ')}${bag && Object.values(bag).some(n => n > FREE) ? ' · เก็บเกินตะกร้า 60 หน่วย ควรขายหรือเก็บเข้าโกดัง/ห้องเย็น' : ''}`); }
    // cold room electricity, billed once a month
    f.elec += WH.cold.kw[f.wh.cold] * (coopOn() ? 0.8 : 1) / 1; if (S.day % MO === 0 && f.mon !== Math.floor(S.day / MO)) { f.mon = Math.floor(S.day / MO); if (f.elec > 0) { const c = Math.round(f.elec); if (!pay(c, 'ค่าไฟห้องเย็น')) { f.wh.cold = Math.max(0, f.wh.cold - 1); msg('การไฟฟ้า', `ค่าไฟห้องเย็น ${baht(c)} ค้างชำระ ถูกตัดไฟห้องเย็น (ลดระดับ)`); } f.elec = 0; } }
  };

  // ================= daily =================
  const daily = () => {
    const f = F();
    for (const a of herd()) {
      if (!adult(a)) a.prod = false;   // (v40: no more silent random bonus or loss here: yield by genes/happiness is decided at the morning feed in v40_animals.js)
    }
    pets();
    for (const pr of f.preg.slice()) if (S.day >= pr.due) { try { born(pr); } catch (e) { console.warn('v31f born', e); } f.preg = f.preg.filter(x => x !== pr); }
    try { dailyDisease(); } catch (e) { console.warn('v31f disease', e); }
    try { if (PET_SHOW(S.day)) runShow('pet'); if (LIVE_FAIR(S.day)) runShow('live'); } catch (e) { console.warn('v31f show', e); }
    try { gapResult(); contractsDay(); exportDay(); spoilDay(); } catch (e) { console.warn('v31f daily', e); }
    f.shows.reg = f.shows.reg.filter(r => r.day >= S.day && byFid(r.fid));
    if (f.shows.fame > 0 && S.day % 28 === 0) f.shows.fame = Math.max(0, f.shows.fame - 1);
  };
  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { daily(); } catch (e) { console.warn('v31 farm daily', e); } return r; }; }

  // ================= phone app =================
  const hub = { tab: 0, pick: 0, ex: 'carrot' };
  const B = (act, label, o = {}) => `<button class="btn ${o.ghost ? 'ghost' : ''}" data-a="v31f" data-v="${esc(act)}"${o.dis ? ' disabled' : ''}>${label}</button>`;
  const C = (i, h, p, btns = '') => `<div class="card"><div class="ci">${i}</div><div class="cb"><h4>${h}</h4><p class="dim">${p}</p>${btns ? `<div class="row">${btns}</div>` : ''}</div></div>`;
  const GR = x => `<div class="grid">${x}</div>`;
  const LEAD = t => `<p class="lead">${t}</p>`;
  const DIM = t => `<p class="dim">${t}</p>`;
  const TABS = ['🐄 สัตว์ & พันธุกรรม', '🏆 ประกวด & ใบรับรอง', '🌾 ตลาด & สัญญา', '📦 โกดัง & ห้องเย็น', '🌐 ส่งออก & สหกรณ์'];
  const A = {};
  UI.H.v31f = d => { const [k, ...r] = String(d.v || '').split('|'); const f = A[k]; if (f) { try { f(...r); } catch (e) { if (e && e.spend173) throw e; console.warn('v31f', k, e); } try { if (UI.cur && UI.cur.render) UI.renderBody(); } catch (e) { } } };
  const animalCard = a => {
    const p = isPet(a), pr = ped(a), st = (typeof Animal40 !== 'undefined' && !p) ? Animal40.badge(a) : a.sick ? '🤒 ป่วย' : adult(a) ? '✅ โตเต็มวัย' : `🍼 ลูกสัตว์ (โต${RD(a.born + KIND[a.type].adult)})`;
    const pg = a.pre ? ` · 🤰 คลอด${RD(a.pre)}` : a.cd > S.day ? ` · พักฟื้นถึง${RD(a.cd)}` : '';
    const vac = p ? (vacOk(a) ? 'วัคซีนพิษสุนัขบ้า ✅' : 'วัคซีนพิษสุนัขบ้า ❌') : (a.vac >= S.day ? `วัคซีน ✅ ถึง${RD(Math.round(a.vac))}` : 'วัคซีน ❌ หมดอายุ');
    const btns = (a.sex === 'F' && adult(a) && !a.pre ? B('pick|' + a.fid, hub.pick == a.fid ? '❌ ยกเลิกเลือกคู่' : '💞 เลือกผสมพันธุ์', { ghost: hub.pick == a.fid }) : '') +
      (a.sex === 'M' && hub.pick && byFid(hub.pick) && byFid(hub.pick).type === a.type && !canBreed(byFid(hub.pick), a) ? B('breed|' + hub.pick + '|' + a.fid, `💞 ผสมกับ ${esc(byFid(hub.pick).name)}`) : '') +
      (p ? '' : B('vac|' + a.fid, 'ฉีดวัคซีน', { ghost: 1, dis: a.vac >= S.day })) + (a.sick ? B('treat|' + a.fid, 'รักษา 400') : '') + B('groom|' + a.fid, 'ตัดแต่ง/อาบน้ำ 80', { ghost: 1, dis: a.groom === S.day }) + (pr ? '' : B('cert|' + a.fid, 'ขอใบเพ็ดดีกรี', { ghost: 1 })) + B('sell|' + a.fid, `ขาย ${baht(worth(a))}`, { ghost: 1 });
    return C(itemI(a), `${esc(a.name)} · ${sexN(a)}`, `อายุ ${age(a)} วัน · ${st}${pg}<br>${gtxt(a)}${a.sire ? ' · มีสายเลือด' : ''}<br>${vac}${pr ? ` · 📜 เพ็ดดีกรี ${pr.no}` : ''}`, btns);
  };
  const render = t => {
    hub.tab = t; const f = F();
    if (t === 0) {
      const hs = herd(), ps = pets(), o = f.out, preg = f.preg.map(p => { const m = byFid(p.id); return m ? `${esc(m.name)} (คลอด${RD(p.due)}${p.inbred ? ' ⚠️ สายเลือดชิด' : ''})` : ''; }).filter(Boolean);
      return LEAD('พ่อแม่พันธุ์ส่งยีนให้ลูก (ผลผลิต · สุขภาพ · รูปทรง) · ยีนผลผลิตสูงให้ผลผลิตเพิ่ม · ยีนสุขภาพต่ำป่วยง่าย · ผสมพันธุ์ญาติกันลูกอ่อนแอ') +
        (o.until >= S.day ? `<div class="card"><div class="ci">🚨</div><div class="cb"><h4>โรคปากและเท้าเปื่อยในฟาร์ม</h4><p class="dim">เริ่ม${RD(o.start)} · ${o.rep ? `แจ้งแล้ว กักกันถึง${RD(o.q)}` : 'ยังไม่ได้แจ้งปศุสัตว์อำเภอ! (ต้องแจ้งภายใน 3 วัน มิฉะนั้นปรับ 20,000 ฿)'} · สัตว์ป่วย ${hs.filter(a => a.sick).length} ตัว</p><div class="row">${B('report', 'แจ้งปศุสัตว์อำเภอ', { dis: !!o.rep })}</div></div></div>` : '') +
        (preg.length ? DIM('🤰 ตั้งท้อง: ' + preg.join(' · ')) : '') +
        `<h5>🐄 ปศุสัตว์ในฟาร์ม (${hs.length}/${barnCap()})</h5>` + (hs.length ? GR(hs.map(animalCard).join('')) : DIM('ยังไม่มีสัตว์ ซื้อที่ฟาร์มปศุสัตว์ในหมู่บ้านได้')) +
        `<h5>🐕 สัตว์เลี้ยง (${ps.length}/5)</h5>` + (ps.length ? GR(ps.map(animalCard).join('') ) + `<div class="row">${B('petvet', '🏥 ไปคลินิกสัตว์เลี้ยง (วัคซีน/ทำหมัน/รักษา)', { ghost: 1 })}</div>` : DIM('ยังไม่มีสัตว์เลี้ยง รับเลี้ยงได้ที่ฟาร์มปศุสัตว์')) +
        `<h5>🧬 ซื้อพ่อ/แม่พันธุ์คุณภาพ (ยีนดี ฉีดวัคซีนแล้ว)</h5>` + GR(['cow', 'pig', 'sheep', 'chicken'].map(tp => C(ANIMALS[tp].i, `${KIND[tp].dam} / ${KIND[tp].stud}`, `ราคา ${baht(Math.round(ANIMALS[tp].price * 1.7 / 10) * 10)} · ยีนเฉลี่ย 6–8/10`, B('buy|' + tp + '|F', `ซื้อ${KIND[tp].dam}`, { dis: hs.length >= barnCap() }) + B('buy|' + tp + '|M', `ซื้อ${KIND[tp].stud}`, { ghost: 1, dis: hs.length >= barnCap() }))).join(''));
    }
    if (t === 1) {
      const sh = f.shows, nextP = nextEv(PET_SHOW), nextL = nextEv(LIVE_FAIR), hs = herd(), ps = pets();
      const reg = (list, kind) => list.map(a => { const w = showElig(a, kind), on = sh.reg.some(r => r.fid == a.fid && r.kind === kind && r.day === (kind === 'pet' ? nextP : nextL)); return `<div class="row"><span style="flex:1;font-size:12px">${itemI(a)} ${esc(a.name)} <span class="dim">${w ? '— ' + esc(w) : '— พร้อมประกวด'}</span></span>${B('show|' + a.fid + '|' + kind, on ? '✅ สมัครแล้ว' : `สมัคร ${baht(entryFee(kind))}`, { ghost: on, dis: !!w || on })}</div>`; }).join('');
      const doc = id => { const D = Gov24.docs[id], r = hasDoc(id); return `${D.i} ${D.n}: ${r ? '✅' : '❌'}`; };
      return LEAD(`ชื่อเสียงฟาร์ม ${sh.fame} · ถ้วยรางวัล ${sh.tro} · ประกวดสัตว์เลี้ยงทุก 14 วัน (ครั้งถัดไป${RD(nextP)}) · งานประกวดปศุสัตว์ทุก 28 วัน (ครั้งถัดไป${RD(nextL)}) · ปิดรับสมัคร 09:00 ของวันงาน`) +
        `<h5>🐕 ประกวดสัตว์เลี้ยง · ${RD(nextP)}</h5>` + (ps.length ? reg(ps, 'pet') : DIM('ยังไม่มีสัตว์เลี้ยง')) + `<h5>🐄 งานประกวดปศุสัตว์ · ${RD(nextL)}</h5>` + (hs.length ? reg(hs, 'live') : DIM('ยังไม่มีปศุสัตว์')) +
        (sh.res.length ? `<h5>🏅 ผลการประกวดล่าสุด</h5>` + sh.res.slice(0, 5).map(r => DIM(`${RD(r.day)}: ${esc(r.t)}`)).join('') : '') +
        `<h5>📋 ทะเบียนและใบรับรองของฟาร์ม</h5>` + GR(
          C('🌾', 'ทะเบียนเกษตรกร / ฟาร์มปศุสัตว์', `${doc('farmer')}<br>${doc('livereg')}<br>${doc('farmaid')}`, B('gov', '🏛️ ไปทำที่ศูนย์ราชการ', { ghost: 1 })),
          C('🌿', 'ใบรับรอง GAP (ส่งออก/ขายห้าง)', `${doc('gap')}${f.gap ? ` · กำลังตรวจแปลง ผล${RD(f.gap.res)}` : ''}<br>ค่าตรวจ ${baht(Math.round(1500 * (coopOn() ? 0.5 : 1)))} · ต้องมีทะเบียนเกษตรกร · อายุ 2 ปี`, B('gap', 'ยื่นขอ GAP', { dis: hasDoc('gap') || !!f.gap })),
          C('🚚', 'ใบอนุญาตเคลื่อนย้ายสัตว์', `${doc('animmove')}<br>ต้องมีทะเบียนฟาร์ม · สัตว์ทุกตัวสุขภาพดีและฉีดวัคซีน · ไม่ถูกกักกันโรค · อายุ 7 วัน ค่าธรรมเนียม 150`, B('move', 'ขอใบอนุญาต', { dis: hasDoc('animmove') })),
          C('📜', 'ใบเพ็ดดีกรีสัตว์ของฉัน', Object.keys(f.ped).map(id => { const a = byFid(+id); return a ? `${itemI(a)} ${esc(a.name)} · ${f.ped[id].no}` : ''; }).filter(Boolean).join('<br>') || 'ยังไม่มี · ขอได้ในแท็บสัตว์ (ต้องมีสายเลือดบันทึกไว้ หรือยีนเฉลี่ย ≥ 6)')
        );
    }
    if (t === 2) {
      const L = f.offers.list, act = f.contracts.filter(c => c.st === 'active');
      const ids = CR.filter(c => !CROPS[c].tree).slice(0, 10), days = [0, 3, 7, 14];
      const rows = ids.map(c => { const p = days.map(d => unitPrice(c, 0, S.day + d)), best = p.indexOf(Math.max(...p)); return `<tr><td>${CROPS[c].i} ${CROPS[c].n}</td>${p.map((v, i) => `<td${i === best ? ' style="font-weight:700;color:#7ddc7d"' : ''}>${baht(v)}</td>`).join('')}<td>${CROP_SEASON[c] === season().id ? 'ฤดูของมัน ราคาต่ำ' : 'นอกฤดู ราคาสูง'}</td></tr>`; }).join('');
      return LEAD(`ราคารับซื้อผลผลิตเปลี่ยนทุกวัน: ในฤดูที่ปลูกง่ายราคาต่ำ นอกฤดูราคาสูง (ฤดู${season().n}) · เก็บของรอขายได้ในโกดัง/ห้องเย็น`) +
        `<table class="tbl"><tr><th>ผลผลิต</th><th>วันนี้</th><th>+3 วัน</th><th>+7 วัน</th><th>+14 วัน</th><th>หมายเหตุ</th></tr>${rows}</table>` + DIM('ตัวหนาสีเขียว = วันที่ขายได้ราคาดีที่สุดในกลุ่มนี้ (คาดการณ์ไม่รวมงานเทศกาล)') +
        `<h5>📑 สัญญาที่กำลังดำเนินการ (${act.length}/4)</h5>` + (act.length ? GR(act.map(o => C(o.kind === 'live' ? ANIMALS[o.item].i : o.kind === 'prod' ? PRODUCTS[o.item].i : CROPS[o.item].i, `${esc(o.by)}`, `${itemName(o)} · ส่งแล้ว ${o.got}/${o.qty} · ราคา ${baht(o.price)}/หน่วย${coopOn() && o.kind !== 'live' ? ' (+5% สหกรณ์)' : ''} · ส่งภายใน${RD(o.due)} (อีก ${o.due - S.day} วัน)${o.kind === 'live' ? '<br>ต้องมีใบอนุญาตเคลื่อนย้ายสัตว์' : ''}`, B('del|' + o.id, 'ส่งสินค้า'))).join('')) : DIM('ยังไม่มีสัญญา')) +
        `<h5>🤝 ข้อเสนอซื้อ (รีเฟรชทุก 7 วัน)</h5>` + GR(L.map(o => C(o.kind === 'live' ? ANIMALS[o.item].i : o.kind === 'prod' ? PRODUCTS[o.item].i : CROPS[o.item].i, esc(o.by), `ต้องการ ${itemName(o)} ×${o.qty} ราคา ${baht(o.price)}/หน่วย (ตลาดทั่วไป ${baht(o.kind === 'crop' ? CROPS[o.item].sell : o.kind === 'prod' ? PRODUCTS[o.item].sell : ANIMALS[o.item].price)}) · ส่งภายใน ${o.due - S.day} วัน${o.gap ? ' · ต้องมี GAP 🌿' : ''}`, B('acc|' + o.id, 'รับสัญญา', { dis: o.gap && !hasDoc('gap') }))).join(''));
    }
    if (t === 3) {
      const st = f.store, keys = Object.keys(st);
      const lvlBtn = k => { const lv = f.wh[k]; return lv >= 4 ? DIM('ระดับสูงสุดแล้ว') : B('wh|' + k, `${lv ? 'ขยายเป็นระดับ ' + (lv + 1) : 'สร้าง'} ${baht(WH[k].cost[lv + 1])}`); };
      const bag = Object.keys(S.inv).filter(k => ITEMS[k] && (ITEMS[k].cat === 'crop' || (ITEMS[k].cat === 'product' && k !== 'wool')) && S.inv[k] > 0).slice(0, 14);
      return LEAD(`ผลผลิตในกระเป๋าเก็บได้ ${FREE} หน่วยต่อชนิดโดยไม่เสีย ส่วนที่เกินจะเน่าเสียทุกวัน · ยุ้งฉางชะลอการเสีย ห้องเย็นแทบไม่เสีย (ไฟดับห้องเย็นเสียเร็ว) · ใช้ ${used()}/${cap('dry') + cap('cold')} หน่วย`) +
        GR(C(WH.dry.i, `${WH.dry.n} ระดับ ${f.wh.dry}`, `ความจุ ${cap('dry')} หน่วย · เสียช้ากว่ากระเป๋า 40% · ไม่มีค่าไฟ`, lvlBtn('dry')),
          C(WH.cold.i, `${WH.cold.n} ระดับ ${f.wh.cold}`, `ความจุ ${cap('cold')} หน่วย · ค่าไฟ ${baht(Math.round(WH.cold.kw[f.wh.cold] * (coopOn() ? 0.8 : 1)))}/วัน (เก็บรวมทุก 28 วัน${coopOn() ? ' · สมาชิกสหกรณ์ลด 20%' : ''}) · ใช้ส่งออกสินค้าเสียหายน้อย`, lvlBtn('cold'))) +
        `<h5>ของในคลัง (${keys.length} รายการ)</h5>` + (keys.length ? `<table class="tbl"><tr><th>สินค้า</th><th>จำนวน</th><th>ราคาวันนี้</th><th></th></tr>${keys.map(k => `<tr><td>${ITEMS[k] ? ITEMS[k].i + ' ' + ITEMS[k].n : k}</td><td>${st[k]}</td><td>${baht(priceOf(k))}</td><td>${B('out|' + k + '|10', 'เอาออก 10', { ghost: 1 })}${B('sellst|' + k + '|10', 'ขาย 10', { ghost: 1 })}${B('sellst|' + k + '|all', 'ขายหมด', { ghost: 1 })}</td></tr>`).join('')}</table>` : DIM('คลังว่าง')) +
        `<h5>เก็บเข้าคลังจากกระเป๋า</h5>` + (bag.length ? `<table class="tbl">${bag.map(k => `<tr><td>${ITEMS[k].i} ${ITEMS[k].n}</td><td>${S.inv[k]}</td><td>${S.inv[k] > FREE ? '⚠️ เกินตะกร้า' : ''}</td><td>${B('in|' + k + '|10', 'เก็บ 10', { ghost: 1 })}${B('in|' + k + '|all', 'เก็บหมด', { ghost: 1 })}</td></tr>`).join('')}</table>` : DIM('ไม่มีผลผลิตในกระเป๋า'));
    }
    // export & coop
    const fn = Object.keys(DEST);
    const crops = CR.filter(c => !CROPS[c].tree).filter(c => have(c, 0) > 0).slice(0, 8);
    if (crops.length && !crops.includes(hub.ex)) hub.ex = crops[0];
    let coop = null; try { coop = Life25.L().coop; } catch (e) { }
    return LEAD('ส่งออกผลผลิตต้องมี บัตรประชาชน + ทะเบียนพาณิชย์ + ใบรับรอง GAP · จ่ายค่าใบรับรองสุขอนามัยพืช 300 + ค่าขนส่งราว 12% ของราคาต่อหน่วย · ได้เงินเมื่อลูกค้าตรวจรับ หักของเสียระหว่างทาง · ราคาขึ้นลงตามอัตราแลกเปลี่ยน') +
      `<div class="row">${crops.length ? crops.map(c => B('ex|' + c, `${CROPS[c].i} ${CROPS[c].n} (${have(c, 0)})`, { ghost: hub.ex !== c })).join('') : DIM('ยังไม่มีผลผลิตที่จะส่งออก')}</div>` +
      GR(fn.map(k => { const d = DEST[k], miss = expReq(d); return C(d.i, `ส่งออก${d.n}`, `ขั้นต่ำ ${d.min} หน่วย${d.minQ ? ' เกรด ★★ เท่านั้น' : ''} · ใช้เวลา ${d.days} วัน · ราคา +${Math.round((d.prem + Math.min(0.1, f.shows.fame * 0.0025)) * 100)}% ${d.fx ? `· ค่าเงิน ${d.fx} ×${fxIdx(d).toFixed(2)}` : ''}<br>ค่าใช้จ่ายรอบนี้ ${baht(PHYTO + freightOf(hub.ex) * d.min)}${miss.length ? `<br>ขาด: ${miss.join(', ')}` : ''}`, B('ship|' + k + '|' + hub.ex, `ส่ง ${crops.length ? CROPS[hub.ex].n : ''} ${d.min} หน่วย`, { dis: !crops.length || have(hub.ex, d.minQ) < d.min || miss.length > 0 })); }).join('')) +
      (f.exp.length ? `<h5>🚢 ล็อตที่กำลังส่ง</h5>` + f.exp.slice(-6).map(e => DIM(`${DEST[e.dest].i} ${CROPS[e.b].n} ×${e.qty} · ถึง${RD(e.arr)}${e.done ? ' · ชำระแล้ว' : ''}${e.cold ? ' · ห้องเย็น' : ''}`)).join('') : '') +
      `<h5>🤝 สหกรณ์การเกษตร</h5>` + (coopOn() ? GR(C('✅', 'คุณเป็นสมาชิกสหกรณ์', `หุ้น ${coop.shares} หน่วย · สิทธิที่ได้จากระบบฟาร์ม: ค่าตรวจ GAP ลด 50% · ค่าสมัครประกวดลด 50% · ค่าไฟห้องเย็นลด 20% · ราคาสัญญาขายพืช/ผลิตภัณฑ์ +5%`)) : GR(C('📋', 'ยังไม่ได้เป็นสมาชิกสหกรณ์', 'สมัครได้ที่แอป 🏙️ ชีวิตประจำวัน › สหกรณ์การเกษตร เพื่อรับสิทธิ: ค่าตรวจ GAP ลด 50% · ค่าสมัครประกวดลด 50% · ค่าไฟห้องเย็นลด 20% · ราคาสัญญา +5%', B('coop', 'เปิดแอปสหกรณ์', { ghost: 1 }))));
  };
  A.pick = id => { hub.pick = hub.pick == id ? 0 : +id; };
  A.breed = (m, s) => { breed(+m, +s); hub.pick = 0; };
  A.vac = id => { const a = byFid(id); if (a) vaccinate(a); };
  A.treat = id => { const a = byFid(id); if (a) treat(a); };
  A.groom = id => { const a = byFid(id); if (a) groom(a); };
  A.cert = id => { const a = byFid(id); if (a) certify(a); };
  A.sell = id => { const a = byFid(id); if (a) sellAnimal(a); };
  A.buy = (tp, sx) => buyStock(tp, sx);
  A.report = () => reportOutbreak();
  A.petvet = () => { try { UI.close(); Life26.A['hub.open']('vet'); Life26.open(); } catch (e) { UI.toast('เปิดคลินิกสัตว์ไม่ได้', '🏥'); } };
  A.show = (id, kind) => regShow(+id, kind);
  A.gap = () => applyGap();
  A.move = () => applyMove();
  A.gov = () => { try { UI.close(); Phone.open('gov24'); } catch (e) { } };
  A.acc = id => accept(+id);
  A.del = id => deliver(+id);
  A.wh = k => buildWh(k);
  A.in = (k, n) => storeIn(k, n);
  A.out = (k, n) => storeOut(k, n);
  A.sellst = (k, n) => storeSell(k, n);
  A.ex = c => { hub.ex = c; };
  A.ship = (d, b) => ship(d, b);
  A.coop = () => { try { UI.close(); Phone.open('life25'); } catch (e) { } };

  const open = () => UI.open('🌾 ฟาร์มพันธุ์ & ตลาดเกษตร', TABS, render, { tab: hub.tab, wide: true });
  const addApp = (id, i, n, fn) => {
    if (!APPS.some(a => a.id === id)) APPS.splice(Math.min(APPS.length, 13), 0, { id, i, n });
    Phone.apps[id] = () => { setTimeout(() => { Phone.app = null; UI.close(); fn(); }, 0); return ''; };
    if (typeof APP_GROUPS !== 'undefined') { const gr = APP_GROUPS.find(x => /บริการ/.test(x[0])) || APP_GROUPS[APP_GROUPS.length - 1]; if (gr && !gr[1].includes(id)) gr[1].unshift(id); }
  };
  addApp('farm31', '🌾', 'ฟาร์มพันธุ์ & ตลาดเกษตร', open);
  F(); try { herd(); pets(); } catch (e) { }
  window.Farm31 = { open, st: F, herd, pets, breed, canBreed, daily, vaccinate, treat, regShow, runShow, applyGap, applyMove, accept, deliver, ship, buildWh, storeIn, storeOut, storeSell, spoilDay, certify, genOffers, mult, KIND, DEST, byFid, nextEv, PET_SHOW, LIVE_FAIR, reportOutbreak, worth, buyStock };
});
