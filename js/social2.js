'use strict';
// ---------- Set C: daily schedules, NPC couples, jealousy & making up, friend outings, temple (merit, ordination, fair), cards, teens with careers, adoption ----------
const TEMPLE = { x: -32, z: -325 };
const CAREERS = { farmer: { n: 'ชาวไร่', i: '🧑‍🌾' }, chef: { n: 'เชฟ', i: '👩‍🍳' }, doctor: { n: 'หมอ', i: '🧑‍⚕️' }, artist: { n: 'ศิลปิน', i: '🧑‍🎨' } };
GOODS.card = { n: 'การ์ดอวยพร', i: '💌', price: 40, desc: 'ส่งให้ชาวบ้านผ่านแอปจดหมายในมือถือ หัวใจ +0.5 (วันเกิด ×3)' };
ITEMS.card = { n: 'การ์ดอวยพร', i: '💌', cat: 'tool' }; TOOLS.card = { n: 'การ์ดอวยพร', i: '💌', price: 40, desc: GOODS.card.desc };
SHOPS.mall.tabs.find(t => t.n.includes('ของขวัญ')).items.push('tool:card'); SHOPS.mart.tabs[1].items.push('tool:card');

const Social2 = {
  st() { if (!S.s2) S.s2 = { couples: {}, jealous: 0, sulk: 0, invite: null, merit: 0, cards: {} }; return S.s2; },
  init() {
    this.st();
    // temple: ordination hall with layered roof, chedi, bell
    const g = new THREE.Group(), x = TEMPLE.x, z = TEMPLE.z; g.position.set(x, 0, z); g.rotation.y = Math.PI / 2; World.outdoor.add(g);
    const white = mc(0xfaf6ee), red = mc(0xb71c1c, { roughness: 0.55 }), gold = mc(0xe0b13a, { roughness: 0.3, metalness: 0.6 }), green = mc(0x2e7d32, { roughness: 0.55 });
    U.mk(g, U.box(16, 0.8, 11, 2), M.stone, [0, 0.4, 0]);
    U.mk(g, U.box(12, 4.2, 7, 3), texMat('plaster', 0xfaf6ee), [0, 2.9, 0]);
    for (const s of [-1, 1]) for (let i = -2; i <= 2; i++) U.mk(g, GEO.cyl, white, [i * 2.8, 2.9, s * 4.1], [0.25, 4.2, 0.25]);
    const tier = (w, d, y, h, m) => { for (const s of [1, -1]) { const r = U.mk(g, U.box(w, 0.18, Math.hypot(d / 2, h) + 0.3, 2), m, [0, y + h / 2, s * d / 4]); r.rotation.x = s * Math.atan2(h, d / 2); } };
    tier(15, 10, 5.0, 2.2, red); tier(12, 7, 6.6, 2.4, green); tier(9, 4.5, 8.3, 2.0, red);
    U.mk(g, GEO.box, gold, [0, 10.4, 0], [9.2, 0.2, 0.2]);
    for (const s of [-1, 1]) U.mk(g, GEO.cone, gold, [s * 4.6, 11, 0], [0.12, 1.2, 0.12], [0, 0, -s * 0.4]);
    U.mk(g, GEO.box, mc(0x6d4c41), [0, 2.2, 3.52], [1.8, 2.8, 0.1]);
    U.mk(g, GEO.box, gold, [0, 3.85, 3.55], [2.4, 0.2, 0.08]);
    // chedi behind
    U.mk(g, lathe('chedi', [[0, 0], [2.4, 0], [2.4, 0.6], [1.8, 0.8], [1.9, 2.2], [1.2, 3.4], [0.5, 4.4], [0.25, 6.2], [0, 7.6]], 18), white, [0, 0, -9]);
    U.mk(g, GEO.cone, gold, [0, 8.0, -9], [0.25, 1.2, 0.25]);
    Col.box(x, z, 8, 5.6, Math.PI / 2, 'bld'); Col.circle(x - 9, z, 2.6); World.clearNear(x, z, 14, true);
    World.pois.push({ kind: 'act', x: x + 7.5, z, r: 3, label: 'วัดสุขใจาราม', icon: '🛕', map: true, act: () => ({ icon: '🛕', label: 'เข้าวัด (ทำบุญ งานวัด รับเลี้ยงเด็ก)', fn: () => this.templeUI() }) });
    const monk = Models.human({ skin: 0xc68d63, hair: 0x1b120c, shirt: 0xef6c00, pants: 0xef6c00, longSleeve: true, bald: true }); const mp = { x: x + 6.2, z: z + 2 }; monk.position.set(mp.x, 0, mp.z); monk.rotation.y = Math.PI / 2; World.dyn.add(monk);
    G.npcs.push({ obj: monk, name: 'หลวงพ่อสมปอง', rot: Math.PI / 2, speed: 0, timer: 0, st: 'idle', wave: 0, fixed: true, x: mp.x, z: mp.z, tx: mp.x, tz: mp.z, hx: mp.x, hz: mp.z, hrot: Math.PI / 2, staff: true });
    (People._p || (People._p = {}))['หลวงพ่อสมปอง'] = { fem: false, age: 72, trait: 'calm', job: 'เจ้าอาวาสวัดสุขใจาราม', single: false };
  },
  fairDay() { return Life2.dayInYear() === 14; },
  // ----- schedules: lunch at the restaurant, working hours near shops, evening at the plaza -----
  sched(n) {
    if (n.townRes || n.x > 100 || n.single && Social.st().partner === n.name && Social.st().stage === 'married') return false;
    const h = S.time / 60, r = Math.random();
    let t = null;
    if (h >= 11.5 && h < 13 && r < 0.6) { t = { x: 12.5 + Math.random() * 2, z: -249 - Math.random() * 6 }; n.doing = 'กินข้าวกลางวันที่ร้านป้าแดง'; }
    else if (h >= 17 && h < 19.5 && r < 0.5) { const a = Math.random() * TAU; t = { x: -28 + Math.cos(a) * 9, z: -265 + Math.sin(a) * 9 }; n.doing = 'เดินเล่นตอนเย็นที่ลานน้ำพุ'; }
    else if (this.fairDay() && h >= 16 && r < 0.6) { t = { x: TEMPLE.x + 10 + Math.random() * 4, z: TEMPLE.z - 4 + Math.random() * 8 }; n.doing = 'เที่ยวงานวัด'; }
    else if (h >= 8 && h < 11.5 && r < 0.3) { n.doing = 'ไปทำงาน (' + People.prof(n.name).job + ')'; return false; }
    else n.doing = h < 8 ? 'ออกมาเดินตอนเช้า' : 'เดินเล่นในหมู่บ้าน';
    if (t) n._sched = t;
    return !!t;
  },
  // ----- couples among villagers -----
  pairOf(name) { const c = this.st().couples; return c[name] || null; },
  dayCouples() {
    const st = this.st(), r = Social.st();
    const free = G.npcs.filter(n => !n.keeper && !n.staff && !n.single && n.name !== r.partner && !st.couples[n.name] && (() => { const p = People.prof(n.name); return p.single && p.age >= 21; })());
    if (free.length >= 4 && Math.random() < 0.08) {
      const a = U.pick(free), b = U.pick(free.filter(n => People.prof(n.name).fem !== People.prof(a.name).fem && n !== a));
      if (b) { st.couples[a.name] = { w: b.name, st: 'คบกัน', d: S.day }; st.couples[b.name] = { w: a.name, st: 'คบกัน', d: S.day }; Phone.msg('ข่าวซุบซิบหมู่บ้าน', `${a.name}กับ${b.name}เริ่มคบกันแล้ว! 💕`, true); }
    }
    for (const k in st.couples) { const c = st.couples[k]; if (c.st === 'คบกัน' && S.day - c.d >= 10 && Math.random() < 0.15 && k < c.w) { c.st = st.couples[c.w].st = 'แต่งงานแล้ว'; Phone.msg('ข่าวหมู่บ้าน', `${k}กับ${c.w}แต่งงานกันแล้ว! ชาวบ้านไปร่วมงานกันเต็มเลย 💒`); Life2.note(`ไปงานแต่งของ${k}กับ${c.w}`); } }
  },
  // ----- jealousy -----
  flirtOther(name) {
    const r = Social.st(); if (!r.partner || r.partner === name || r.stage === null) return;
    const st = this.st(); st.jealous += 1;
    if (st.jealous >= 3 && !st.sulk) { st.sulk = 1; st.jealous = 0; S.friends[r.partner] = Math.max(0, Friends.get(r.partner) - 1); Phone.msg(r.partner, 'เห็นนะว่าไปหวานกับคนอื่น... งอนแล้ว 😤 ไม่คุยด้วยแล้ว!'); Life2.note(`ทะเลาะกับ${r.partner}เพราะความหึง`); }
  },
  makeUp(n) {
    const st = this.st(); if (!st.sulk) return;
    const gift = ['perfume', 'chocolate', 'bouquet', 'teddy'].find(k => count(k));
    if (gift) { takeItem(gift); st.sulk = 0; Friends.add(n.name, 1); UI.talkMsg = `(รับ${ITEMS[gift].n}) ...ก็ได้ ยกโทษให้ แต่ห้ามทำอีกนะ 💕`; Life2.note(`ง้อ${n.name}สำเร็จ`); Sfx.tone(660, 0.3, 'sine', 0.05, 990); }
    else UI.talkMsg = 'ขอโทษเฉย ๆ ไม่พอหรอก... (ลองหาของขวัญมาง้อ เช่น ดอกไม้ ช็อกโกแลต น้ำหอม)';
  },
  // ----- friend invitations -----
  dayInvite() {
    const st = this.st(); if (st.invite && st.invite.day < S.day) st.invite = null;
    if (st.invite || Math.random() > 0.08) return;
    const fr = G.npcs.filter(n => !n.staff && Friends.get(n.name) >= 6 && n.name !== Social.st().partner); if (!fr.length) return;
    const n = U.pick(fr), k = U.pick([['ตกปลาที่ท่าเรือ', '🎣'], ['กินหมูกระทะ', '🥓'], ['ร้องคาราโอเกะ', '🎤'], ['ขี่จักรยานชมทุ่ง', '🚲']]);
    st.invite = { name: n.name, what: k[0], i: k[1], day: S.day };
    Phone.msg(n.name, `วันนี้ว่างไหม ไป${k[0]}ด้วยกัน! ${k[1]} (ตอบรับได้ในแอปนัดหมาย)`);
  },
  inviteHTML() {
    const iv = this.st().invite;
    return iv ? `<div class="card"><div class="ci">${iv.i}</div><div class="cb"><h4>${esc(iv.name)} ชวนไป${iv.what}</h4><p class="dim">ใช้เวลา 2 ชม. อารมณ์ +20 ความสนิท +0.7</p><div class="row"><button class="btn" data-a="invgo">ไปด้วย</button><button class="btn ghost" data-a="invno">ไม่ว่าง</button></div></div></div>` : '<p class="empty">ยังไม่มีใครชวนไปไหนวันนี้ (เพื่อนสนิท 6 หัวใจขึ้นไปจะชวนเอง)</p>';
  },
  // ----- temple -----
  templeUI() {
    UI.open('วัดสุขใจาราม', null, () => {
      const st = this.st(), kids = Social.st().kids;
      return `<p class="lead">หลวงพ่อสมปอง: “เจริญพร ทำบุญแล้วใจสบาย ${this.fairDay() ? 'วันนี้มีงานวัดด้วยนะโยม' : `งานวัดประจำปีจัดวันที่ 14 ของปี (อีก ${(14 - Life2.dayInYear() + 21) % 21} วัน)`}”</p><div class="grid">
        <div class="card"><div class="ci">🙏</div><div class="cb"><h4>ทำบุญใส่ตู้</h4><p class="dim">ทำบุญสะสม ${baht(st.merit)} · อารมณ์ +15 · ทำบุญครบ 5,000 ฿ ได้พระเครื่องนำโชค (ตกปลาเจอปลาหายากบ่อยขึ้น)</p><div class="row"><button class="btn" data-a="merit" data-v="100">100 ฿</button><button class="btn" data-a="merit" data-v="500">500 ฿</button></div></div></div>
        <div class="card"><div class="ci">🎡</div><div class="cb"><h4>งานวัด: โยนห่วง</h4><p class="dim">${this.fairDay() ? 'ครั้งละ 20 ฿ ลุ้นตุ๊กตา ของกิน หรือเงินรางวัล' : 'เปิดเฉพาะวันงานวัด'}</p><div class="row"><button class="btn" data-a="ringtoss" ${this.fairDay() && S.money >= 20 ? '' : 'disabled'}>โยนห่วง</button></div></div></div>
        <div class="card"><div class="ci">🧡</div><div class="cb"><h4>งานบวช</h4><p class="dim">ร่วมงานบวชลูกหลานชาวบ้าน (วันละครั้ง) อารมณ์ +20 ความสนิทกับชาวบ้านทุกคน +0.2</p><div class="row"><button class="btn" data-a="ordain" ${st.ordain === S.day ? 'disabled' : ''}>ร่วมงาน 2 ชม.</button></div></div></div>
        <div class="card"><div class="ci">👶</div><div class="cb"><h4>รับเลี้ยงเด็กกำพร้า</h4><p class="dim">ต้องมีบ้านระดับ 2 ขึ้นไป ลูกยังไม่ครบ 3 คน · ค่าดำเนินการ 2,000 ฿ (ไม่ต้องแต่งงานก็รับได้)</p><div class="row"><button class="btn" data-a="adopt" ${S.up.house >= 2 && kids.length < 3 && S.money >= 2000 ? '' : 'disabled'}>รับเลี้ยง</button></div></div></div></div>`;
    }, { wide: true });
  },
  merit(v) { const st = this.st(); if (S.money < v) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(v), '💸'); return; } S.money -= v; st.merit += v; S.mood = Math.min(100, (S.mood || 50) + 15); Sfx.tone(392, 0.8, 'sine', 0.05); if (st.merit >= 5000 && !S.amulet) { S.amulet = 1; UI.toast('หลวงพ่อมอบพระเครื่องนำโชค! ตกปลาเจอปลาหายากบ่อยขึ้น', '📿'); Life2.note('ได้รับพระเครื่องนำโชคจากหลวงพ่อ'); } else UI.toast('อนุโมทนาบุญ สาธุ 🙏', '🛕'); },
  ringToss() { if (S.money < 20) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(20), '💸'); return; } S.money -= 20; const r = Math.random(); if (r < 0.1) { earn(300); UI.toast('โยนลงขวดใหญ่! ได้เงิน 300 ฿', '🎉'); } else if (r < 0.3) { addItem('teddy'); UI.toast('ได้ตุ๊กตาหมี!', '🧸'); } else if (r < 0.55) { addItem('food_ice'); UI.toast('ได้ลอดช่อง!', '🍧'); } else UI.toast('พลาดไปนิดเดียว ลองอีกครั้ง!', '💨'); },
  ordain() { const st = this.st(); st.ordain = S.day; UI.close(); fade(() => { tick(120); S.mood = Math.min(100, (S.mood || 50) + 20); for (const n of G.npcs) if (!n.staff && S.friends[n.name] != null) Friends.add(n.name, 0.2); UI.toast('ร่วมแห่นาคและงานบวช ชาวบ้านประทับใจ!', '🧡'); Life2.note('ไปร่วมงานบวชที่วัด'); }); },
  adopt() { if (S.money < 2000) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(2000), '💸'); return; } S.money -= 2000; UI.close(); const fem = Math.random() < 0.5; Social.pendingKid = { name: fem ? 'น้องฟ้าใส' : 'น้องภูมิ', fem, born: S.day - 25, adopted: 1 }; Social.st().kids.push(Social.pendingKid); Social.family(); UI.open('รับเลี้ยงเด็ก', null, () => `<p class="lead">เด็ก${fem ? 'ผู้หญิง' : 'ผู้ชาย'}อายุ 5 ขวบรออยู่ ตั้งชื่อให้น้องหน่อยนะ</p><div class="row"><input id="babyName" maxlength="12" placeholder="${fem ? 'น้องฟ้าใส' : 'น้องภูมิ'}" style="flex:1"><button class="btn" data-a="adoptok" data-v="${fem ? 1 : 0}">รับเป็นลูก</button></div>`); },
  // ----- cards by phone -----
  cardHTML() {
    const ppl = G.npcs.filter(n => S.friends[n.name] != null && !n.staff);
    return `<p class="lead">มีการ์ด ${count('card')} ใบ (ซื้อที่สุขใจมาร์ทหรือห้าง) · ส่งให้คนละ 1 ใบต่อวัน</p><div class="grid">${ppl.map(n => `<div class="card"><div class="ci">💌</div><div class="cb"><h4>${esc(n.name)}${Life2.bdays && Life2.bdays.includes(n.name) ? ' 🎂' : ''}</h4><div class="row"><button class="btn" data-a="sendcard" data-n="${esc(n.name)}" ${count('card') && this.st().cards[n.name] !== S.day ? '' : 'disabled'}>ส่งการ์ด</button></div></div></div>`).join('') || '<p class="empty">ยังไม่รู้จักใคร</p>'}</div>`;
  },
  sendCard(name) { if (!takeItem('card')) return; this.st().cards[name] = S.day; Friends.add(name, 0.5 * (Life2.bdays && Life2.bdays.includes(name) ? 3 : 1)); Phone.msg(name, U.pick(['ได้การ์ดแล้ว น่ารักจัง ขอบคุณนะ!', 'ขอบคุณสำหรับการ์ดนะ ดีใจมากเลย 😊', 'การ์ดสวยมาก จะเก็บไว้อย่างดีเลย']), false); },
  // ----- teens -----
  teenUI(k) {
    UI.open(`${k.name} · วัยรุ่น`, null, () => `<p class="lead">${k.career ? `อาชีพ: ${CAREERS[k.career].i} ${CAREERS[k.career].n} — ช่วยครอบครัวทุกวันแล้ว` : 'โตเป็นวัยรุ่นแล้ว! เลือกเส้นทางอาชีพให้ลูก (เลือกได้ครั้งเดียว)'}</p>${k.career ? '' : `<div class="grid">${Object.entries(CAREERS).map(([c, C]) => `<div class="card"><div class="ci">${C.i}</div><div class="cb"><h4>${C.n}</h4><p class="dim">${{ farmer: 'รดน้ำ 6 แปลงและเก็บผักสุกทุกเช้า', chef: 'ทำอาหาร 1 จานให้ทุกวัน', doctor: 'ดูแลครอบครัว ไม่ป่วยง่าย', artist: 'วาดภาพขายได้ทุกวัน' }[c]}</p><div class="row"><button class="btn" data-a="career" data-n="${esc(k.name)}" data-v="${c}">เลือก</button></div></div></div>`).join('')}</div>`}`);
  },
  dayTeens() {
    for (const k of Social.st().kids) {
      if ((window.Kid182 ? Kid182.d(k) : S.day - k.born) < 45 || !k.career) continue;
      if (k.career === 'farmer') { let n = 0; S.plots.forEach(p => { if (p.c && p.w <= 0 && n < 6) { p.w = 1; n++; } if (stageOf(p) === 3 && n < 9) { const C = CROPS[p.c]; S.chest[p.c] = (S.chest[p.c] || 0) + (C.yield || 1); if (C.regrow) p.g = C.grow - C.regrow; else { p.c = null; p.g = 0; p.f = 0; } n++; } }); }
      if (k.career === 'chef') addItem('dish_' + U.pick(Object.keys(RECIPES)));
      if (k.career === 'doctor') S.sick = 0;
      if (k.career === 'artist') addItem('art');
    }
  },
  day() { this.dayCouples(); this.dayInvite(); this.dayTeens(); if (this.fairDay()) Phone.msg('วัดสุขใจาราม', 'วันนี้งานวัดประจำปี! มีโยนห่วง ของกิน ชิงช้าสวรรค์ เริ่มบ่ายสี่โมง', true); },
};
UI.H.merit = d => Social2.merit(+d.v);
UI.H.ringtoss = () => Social2.ringToss();
UI.H.ordain = () => Social2.ordain();
UI.H.adopt = () => Social2.adopt();
UI.H.adoptok = d => { const v = (($('babyName') || {}).value || '').trim().slice(0, 12) || (d.v === '1' ? 'น้องฟ้าใส' : 'น้องภูมิ'); if (Social.pendingKid) { Social.pendingKid.name = v; Social.pendingKid = null; } else Social.st().kids.push({ name: v, fem: d.v === '1', born: S.day - 25, adopted: 1 }); Social.family(); UI.close(); UI.toast(`ยินดีต้อนรับ${v}เข้าสู่ครอบครัว!`, '👶'); Life2.note(`รับ${v}มาเป็นลูกบุญธรรม`); };
UI.H.sendcard = d => Social2.sendCard(d.n);
UI.H.invgo = () => { const iv = Social2.st().invite; if (!iv) return; Social2.st().invite = null; UI.close(); fade(() => { tick(120); S.mood = Math.min(100, (S.mood || 50) + 20); Friends.add(iv.name, 0.7); UI.toast(`ไป${iv.what}กับ${iv.name} สนุกมาก!`, iv.i); Life2.note(`ไป${iv.what}กับ${iv.name}`); }); };
UI.H.invno = () => { const iv = Social2.st().invite; if (iv) Phone.msg(iv.name, 'ไม่เป็นไร ไว้คราวหน้านะ', true); Social2.st().invite = null; };
UI.H.career = d => { const k = Social.st().kids.find(x => x.name === d.n); if (k && !k.career) { k.career = d.v; UI.toast(`${k.name}ตัดสินใจเป็น${CAREERS[d.v].n}!`, CAREERS[d.v].i); Life2.note(`${k.name}เลือกอาชีพ${CAREERS[d.v].n}`); } };
UI.H.makeup = () => Social2.makeUp(UI.talkTo);
