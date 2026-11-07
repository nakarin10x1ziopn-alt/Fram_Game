'use strict';
// ---------- Villager conversations, dating → marriage → children, and villagers who walk in to buy at the farm stand ----------
const SINGLES = [
  { name: 'มะลิ', avatar: 'toon:civil', fem: true, zone: 'village', job: 'ครูอนุบาลในหมู่บ้าน', hobby: 'ปลูกดอกไม้และอ่านนิทาน', dream: 'อยากเปิดห้องสมุดเล็ก ๆ ให้เด็ก ๆ', fav: 'strawberry', look: { skin: 0xf1c9a5, hair: 0x1b120c, long: true, shirt: 0xf6c1d0, skirt: 0xf2f2f2 } },
  { name: 'แก้ว', avatar: 'toon:chic', fem: true, zone: 'seaside', job: 'เจ้าของร้านกาแฟริมหาด', hobby: 'ดำน้ำดูปะการัง', dream: 'อยากมีบ้านริมทะเลกับสวนผลไม้', fav: 'mango', look: { skin: 0xe0a87e, hair: 0x3a2416, pony: true, shirt: 0x4db6ac, skirt: 0x2d2d2d } },
  { name: 'ดาว', avatar: 'toon:skater', fem: true, zone: 'village', job: 'นักวาดภาพประกอบ', hobby: 'วาดรูปทุ่งนายามเย็น', dream: 'อยากจัดนิทรรศการภาพในเมืองใหญ่', fav: 'sunflower', look: { skin: 0xf1c9a5, hair: 0x6b4a2e, bun: true, shirt: 0xffd36b, skirt: 0x4a78b5, glasses: true } },
  { name: 'ต้นข้าว', avatar: 'toon:tee', fem: false, zone: 'village', job: 'สัตวแพทย์ประจำหมู่บ้าน', hobby: 'วิ่งตอนเช้าและเล่นกีตาร์', dream: 'อยากเปิดคลินิกรักษาสัตว์ฟรี', fav: 'milk', look: { skin: 0xc68d63, hair: 0x1b120c, shirt: 0x81c784, pants: 0x34507a } },
  { name: 'ภูผา', avatar: 'toon:casual', fem: false, zone: 'seaside', job: 'ชาวประมงเรือหางยาว', hobby: 'ตกปลาตอนพระจันทร์เต็มดวง', dream: 'อยากต่อเรือลำใหญ่ของตัวเอง', fav: 'fish_nile', look: { skin: 0xa8734f, hair: 0x1b120c, shirt: 0x1e88e5, pants: 0x3e3e3e, hat: 'cap', capColor: 0xf2f2f2 } },
];
const SINGLE_FAV = Object.fromEntries(SINGLES.map(s => [s.name, s.fav]));
const SOCIAL_ITEMS = { bouquet: 'มอบให้คนโสดที่สนิท 8 หัวใจขึ้นไป เพื่อขอคบเป็นแฟน', ring: 'ขอแต่งงานกับแฟนที่สนิทครบ 10 หัวใจ', extinguisher: 'ดับไฟไหม้รอบตัวได้ทันที 1 ครั้ง' };
TOOLS.bouquet = { n: 'ช่อดอกไม้', i: '💐', price: 350, desc: SOCIAL_ITEMS.bouquet };
TOOLS.ring = { n: 'แหวนเพชร', i: '💍', price: 9000, desc: SOCIAL_ITEMS.ring };
ITEMS.bouquet = { n: 'ช่อดอกไม้', i: '💐', cat: 'tool' }; ITEMS.ring = { n: 'แหวนเพชร', i: '💍', cat: 'tool' };
SHOPS.lux.tabs.push({ n: 'ความรัก & ของขวัญ', items: ['tool:bouquet', 'tool:ring'] });
SHOPS.online.tabs[1].items.push('tool:bouquet', 'tool:extinguisher');
SHOPS.farmshop.tabs[1].items.push('tool:extinguisher', 'tool:bouquet');
if (typeof CRAFTS !== 'undefined') CRAFTS.push({ id: 'ring', tab: 2, need: { bar_gold: 2, diamond: 1 } });

const JOBS = ['ชาวนา', 'ช่างซ่อมรถ', 'แม่ค้าขายขนม', 'พนักงานไปรษณีย์', 'ช่างตัดผม', 'คนขับรถสองแถว', 'พยาบาล', 'ช่างไม้', 'นักเรียน', 'ข้าราชการเกษียณ', 'ชาวประมง', 'เจ้าของร้านชำ'];
const HOBBIES = ['ฟังเพลงลูกทุ่ง', 'ทำขนมไทย', 'เลี้ยงปลากัด', 'ปั่นจักรยาน', 'ปลูกกล้วยไม้', 'ดูดาว', 'เล่นหมากรุกไทย', 'ทำอาหาร', 'ถักไหมพรม', 'ร้องคาราโอเกะ'];
const DREAMS = ['อยากไปเที่ยวทะเลภาคใต้', 'อยากให้หมู่บ้านมีโรงพยาบาล', 'อยากมีสวนผักของตัวเอง', 'อยากเห็นลูกหลานเรียนจบ', 'อยากเปิดร้านเล็ก ๆ', 'อยากไปดูหิมะสักครั้ง'];
const SMALLTALK = ['เช้านี้อากาศดีจัง ได้ยินเสียงไก่ขันตั้งแต่ตีห้า', 'เมื่อวานไปตลาดริมทะเลมา ปลาสดมาก', 'ช่วงนี้ผักราคาดีนะ ขยันปลูกไว้', 'หลานฉันชอบมาดูวัวที่ฟาร์มเธอ', 'งานวัดปีนี้น่าจะคึกคัก', 'ถนนเข้าหมู่บ้านซ่อมเสร็จแล้ว ขับรถสบายขึ้นเยอะ', 'ใครปลูกทานตะวันสวยที่สุดในหมู่บ้านนะ', 'กินข้าวหรือยัง? มากินด้วยกันไหม'];
const TIPS = ['รู้ไหม ฝากเงินประจำในแอปธนาคารบนมือถือ 7 วันได้ดอกเบี้ย 5%', 'ถ้าเห็นไฟไหม้ เอาบัวรดน้ำสาด หรือโทร 199 เลยนะ', 'คืนไหนผักสุกเต็มแปลง ระวังขโมย! โทร 191 ตำรวจมาไว', 'ตั้งแผงขายของหน้าฟาร์ม คนในหมู่บ้านจะเดินไปซื้อเอง', 'สัตว์ที่มีความสุข 80% ขึ้นไปให้ผลผลิตสองเท่า', 'แหวนเพชรทำเองได้ที่โต๊ะช่าง ใช้แท่งทองคำกับเพชร', 'ผักนอกฤดูขายได้แพงกว่าปกติ', 'ฝนตกช่วยดับไฟและรดน้ำผักให้ฟรี'];
const FLIRT = ['วันนี้ดูสดใสจังเลยนะ', 'อยู่ใกล้เธอแล้วรู้สึกสบายใจ', 'ผักในไร่ยังไม่หวานเท่ารอยยิ้มเธอเลย', 'ถ้าว่างไปดูพระอาทิตย์ตกที่ท่าเรือด้วยกันไหม'];
const STATUS = { dating: '💕 แฟน', engaged: '💍 คู่หมั้น', married: '💞 คู่ชีวิต' };

const Social = {
  st() { if (!S.rel) S.rel = { partner: null, stage: null, wedding: 0, kids: [], baby: 0, flirt: {} }; return S.rel; },
  status(name) { const r = this.st(); return r.partner === name ? STATUS[r.stage] || '' : ''; },
  single(name) {
    if (Social2.pairOf(name)) return null;
    const s = SINGLES.find(s => s.name === name); if (s) return s;
    const n = G.npcs.find(x => x.name === name); if (!n || n.keeper || n.staff) return null;
    const p = People.prof(name); return p.single && p.age >= 21 ? { name, fem: p.fem, avatar: n.obj.userData.avName, look: {} } : null;
  },
  profile(n) {
    const h = Math.abs(strHash(n.name)), s = this.single(n.name);
    if (s) { if (s.job && s.hobby && s.dream) return s; const pj = typeof People !== 'undefined' && People.prof ? (People.prof(n.name) || {}).job : null; return Object.assign({ job: pj || JOBS[h % JOBS.length], hobby: HOBBIES[(h >> 3) % HOBBIES.length], dream: DREAMS[(h >> 5) % DREAMS.length] }, s); }   // a dating candidate record may lack job/hobby/dream
    return { job: n.keeper ? 'เจ้าของ' + (SHOPS[n.keeper] ? SHOPS[n.keeper].n : 'ร้านในตลาด') : JOBS[h % JOBS.length], hobby: HOBBIES[(h >> 3) % HOBBIES.length], dream: DREAMS[(h >> 5) % DREAMS.length] };
  },
  // villagers that the player can date, spawned like other walkers with their own fixed look
  spawn() {
    const homes = World.homes || [];
    SINGLES.forEach((s, i) => {
      const o = Object.assign({ pants: 0x3e3e3e, longSleeve: false, avatar: s.avatar }, s.look);
      const obj = Models.human(o); World.dyn.add(obj);
      const line = World.npcRoutes[s.zone].lines[i % 2];
      const n = { obj, name: s.name, rot: 0, speed: 0, timer: i, st: 'idle', wave: 0, line, single: true };
      if (line[3]) { n.x = U.lerp(line[1], line[2], 0.3 + i * 0.1); n.z = line[0]; } else { n.x = line[0]; n.z = U.lerp(line[1], line[2], 0.2 + i * 0.15); }
      n.tx = n.x; n.tz = n.z; obj.position.set(n.x, H(n.x, n.z), n.z);
      const list = homes.filter(h => h.zone === s.zone); if (list.length) n.home = list[(i * 3) % list.length];
      G.npcs.push(n);
    });
    const r = this.st();
    if (r.stage === 'married') this.moveIn(r.partner);
    this.family();
  },
  moveIn(name) {
    const n = G.npcs.find(x => x.name === name); if (!n) return;
    n.home = null; n.line = null; n.circ = { x: HOUSE_POS.x + 8, z: HOUSE_POS.z + 10, r: 5 };
    n.x = n.circ.x; n.z = n.circ.z; n.tx = n.x; n.tz = n.z; n.st = 'idle'; n.away = false;
  },

  // ----- conversation -----
  say(n, text) { UI.talkMsg = text; },
  buttons(n) {
    const r = this.st(), s = this.single(n.name), h = Friends.get(n.name), mine = r.partner === n.name;
    const b = [['conv', '💬 ชวนคุย (เลือกคำตอบ)'], ['news', '📰 ถามข่าว'], ['about', '🙂 เรื่องของเขา'], ['tip', '💡 ขอคำแนะนำ'], ['gossip', '🗣️ ถามถึงคนอื่น'], ['small', '☕ คุยเล่น']];
    if (s) {
      if (h >= 4 && !mine) b.push(['flirt', '😊 จีบ']);
      if (mine) b.push(['flirt', '💗 พูดหวาน']);
      if (!r.partner && h >= 8 && count('bouquet')) b.push(['bouquet', '💐 ให้ช่อดอกไม้ ขอเป็นแฟน']);
      if (mine && Social2.st().sulk) b.push(['makeup', '🙏 ง้อแฟน (ใช้ของขวัญ)']);
      if (mine && r.stage !== 'engaged') b.push(['dateui', '🌅 ชวนไปเดท']);
      if (mine && r.stage === 'dating' && h >= 10) b.push(['propose', People.proposeOK(n) ? '💍 ขอแต่งงาน' : `💍 ขอแต่งงาน (ต้องมีแหวน + เดทครบ 3 ครั้ง: ${r.dates || 0}/3)`]);
      if (mine && r.stage === 'engaged' && r.wstyle == null) b.push(['wedui', '💒 เลือกรูปแบบงานแต่ง']);
      if (mine && r.stage === 'married' && !r.baby && r.kids.length < 3 && S.up.house >= 2) b.push(['baby', '👶 คุยเรื่องมีลูก']);
    }
    return `<div class="row topics">${b.map(([k, t]) => `<button class="btn ghost" data-a="${['conv', 'dateui', 'wedui', 'makeup'].includes(k) ? k : 'topic'}" data-v="${k}" ${k === 'propose' && !People.proposeOK(n) ? 'disabled' : ''}>${t}</button>`).join('')}</div>`;
  },
  topic(n, k) {
    const r = this.st(), s = this.single(n.name), p = this.profile(n), h = Friends.get(n.name);
    Friends.talk(n); n.wave = 1.2;
    switch (k) {
      case 'news': {
        const nx = WEATHER[S.weather.next], hot = hotCrops()[0], f = Fest.daysUntil && Fest.daysUntil();
        const pool = [`พยากรณ์บอกว่าพรุ่งนี้${nx.n} ${nx.rain > 0.3 ? 'ไม่ต้องรดน้ำผักแล้ว' : 'อย่าลืมรดน้ำนะ'}`, `ช่วงนี้${ITEMS[hot].n}ราคาดีมาก ขายได้ ${baht(priceOf(hot))}`];
        if (f) pool.push(`อีก ${f} วันจะมีงานเทศกาลที่ลานน้ำพุ ไปด้วยกันนะ`);
        if (S.emerg && S.emerg.caught) pool.push(`ได้ข่าวว่าเธอช่วยตำรวจจับขโมยได้ ${S.emerg.caught} ครั้งแล้ว เก่งมาก!`);
        if (Net.on && Net.others.size) pool.push(`วันนี้มีคนจากต่างถิ่นมาเที่ยว ${Net.others.size} คนแน่ะ`);
        return this.say(n, U.pick(pool));
      }
      case 'about': return this.say(n, h < 1 ? `ฉันเป็น${p.job} ยินดีที่ได้รู้จักนะ` : h < 3 ? `ฉันเป็น${p.job} ว่าง ๆ ชอบ${p.hobby}` : `บอกความลับให้นะ ฉัน${p.dream}`);
      case 'tip': return this.say(n, U.pick(TIPS));
      case 'gossip': {
        const o = U.pick(G.npcs.filter(x => x !== n)); const op = this.profile(o);
        return this.say(n, `${o.name}เหรอ? เป็น${op.job} ชอบ${op.hobby} ${Friends.get(n.name) >= 2 ? `แอบบอกว่าชอบ${ITEMS[favOf(o.name)].n}มากเลยนะ` : ''}`);
      }
      case 'small': return this.say(n, U.pick(SMALLTALK.concat(NPC_LINES)));
      case 'flirt': {
        if (r.flirt[n.name] === S.day) return this.say(n, 'ฮิ ๆ วันนี้พูดหวานไปแล้วนะ พรุ่งนี้ค่อยมาใหม่');
        r.flirt[n.name] = S.day; Friends.add(n.name, 0.35); Sfx.tone(880, 0.2, 'sine', 0.05, 1320);
        return this.say(n, `${U.pick(FLIRT)}… “${h >= 7 ? 'พูดแบบนี้ ใจเต้นแรงเลยนะ 😳' : 'ปากหวานจริงนะเธอ 😊'}”`);
      }
      case 'bouquet':
        takeItem('bouquet'); r.partner = n.name; r.stage = 'dating'; Friends.add(n.name, 1); Prog.add(30);
        Sfx.tone(660, 0.3, 'sine', 0.06, 990); UI.toast(`ตอนนี้คุณกับ${n.name}เป็นแฟนกันแล้ว! 💕`, '💐');
        return this.say(n, `ดอกไม้สวยจัง… ตกลงเป็นแฟนกันนะ ${S.name || ''} 💕`);
      case 'date': {
        if (r.dated === S.day) return this.say(n, 'วันนี้เดทกันไปแล้ว คืนนี้ส่งข้อความหากันนะ');
        if (S.money < 200) return this.say(n, 'ไม่เป็นไร ไว้มีตังค์แล้วค่อยไปกันนะ');
        S.money -= 200; r.dated = S.day;
        const places = ['ดูพระอาทิตย์ตกที่ท่าเรือ', 'กินข้าวที่ร้านป้าแดง', 'เดินเล่นที่ลานน้ำพุ', 'นั่งรถเล่นเลียบชายหาด'];
        const pl = U.pick(places);
        UI.close();
        fade(() => { tick(120); S.energy = Math.min(maxEnergy(), S.energy + 25); Friends.add(n.name, 0.5); UI.toast(`ไปเดทกับ${n.name}: ${pl} ❤️ พลังงาน +25`, '🌅'); });
        return;
      }
      case 'propose':
        if (!People.proposeOK(n)) return;
        takeItem('ring'); setTimeout(() => People.weddingUI(), 900); r.stage = 'engaged'; r.wedding = S.day + 2; Prog.add(60);
        UI.toast(`${n.name}ตอบตกลง! งานแต่งงาน${RD(r.wedding)} ที่ศาลาหมู่บ้าน`, '💍');
        Phone.msg(n.name, `ตื่นเต้นจัง! เจอกันงานแต่ง${RD(r.wedding)} นะ ❤️`, true);
        return this.say(n, 'ตกลงจ้ะ! ฉันอยากใช้ชีวิตที่ฟาร์มกับเธอ 💍😭');
      case 'baby':
        r.baby = S.day + 3; Phone.msg(n.name, 'เรากำลังจะมีเจ้าตัวเล็กแล้วนะ อีก 3 วันเตรียมตั้งชื่อด้วยล่ะ 👶', true);
        return this.say(n, 'อยากมีลูกเหมือนกัน… บ้านเราจะได้ครึกครื้น 👶');
    }
  },
  phoneLine(n) {
    const r = this.st();
    if (r.partner === n.name) return U.pick(['คิดถึงจัง กลับบ้านเร็ว ๆ นะ', 'วันนี้ทำกับข้าวรอแล้วนะ', 'ระวังตัวด้วย ขับรถช้า ๆ']);
    return U.pick(['ฮัลโหล~ มีอะไรเหรอ', 'ว่างเมื่อไหร่แวะมาคุยกันนะ', U.pick(TIPS)]);
  },

  // ----- daily life: wedding day, spouse helping, kids growing -----
  day() {
    const r = this.st();
    if (r.stage === 'engaged' && S.day >= r.wedding) {
      r.stage = 'married'; this.moveIn(r.partner); Life2.note('แต่งงานกับ' + r.partner + ' 💒'); Prog.add(100 + 80 * (r.wstyle || 0)); if (r.wstyle) earn(3000 * r.wstyle);
      setTimeout(() => { UI.toast(`วันนี้เป็นวันแต่งงานของคุณกับ${r.partner}! ชาวบ้านมาร่วมยินดีเต็มหมู่บ้าน 💒`, '💒'); Sfx.tone(523, 0.4, 'sine', 0.06); Sfx.tone(659, 0.4, 'sine', 0.06, null, 0.3); Sfx.tone(784, 0.6, 'sine', 0.06, null, 0.6); }, 1500);
      Phone.msg(r.partner, 'จากนี้ไปเราเป็นครอบครัวเดียวกันแล้วนะ ฉันจะช่วยดูแลฟาร์มทุกเช้า ❤️', true);
    }
    if (r.stage === 'married') {
      const help = [];
      const wet = WEATHER[S.weather.type].rain > 0.3;
      if (!wet) { let n = 0; S.plots.forEach((p, i) => { if (p.c && p.w <= 0 && n < 8) { p.w = 1; n++; } }); if (n) help.push(`รดน้ำผัก ${n} แปลง`); }
      if (S.animals.length && S.trough < (typeof Animal40 !== 'undefined' ? Animal40.need() : S.animals.length)) { S.trough = (typeof Animal40 !== 'undefined' ? Animal40.need() : S.animals.length); help.push('เติมอาหารสัตว์ในราง'); }
      const dish = U.pick(Object.keys(RECIPES)); addItem('dish_' + dish); help.push(`ทำ${RECIPES[dish].n}ไว้ให้`);
      Phone.msg(r.partner, `อรุณสวัสดิ์ ❤️ เช้านี้ฉัน${help.join(' ')} แล้วนะ`, false);
    }
    if (r.baby && S.day >= r.baby) { r.baby = 0; setTimeout(() => this.nameBaby(), 1800); }
    if (r.kids.length) this.family();
  },
  nameBaby() {
    const fem = Math.random() < 0.5;
    this.pendingKid = { name: fem ? 'น้ำหวาน' : 'ข้าวกล้า', fem, born: S.day }; this.st().kids.push(this.pendingKid); this.family();
    UI.open('ยินดีด้วย! เจ้าตัวเล็กเกิดแล้ว 👶', null, () => `<p class="lead">ลูก${fem ? 'สาว' : 'ชาย'}ของคุณกับ${esc(this.st().partner)}เกิดแล้ว ตั้งชื่อให้หน่อยนะ</p>
      <div class="row"><input id="babyName" maxlength="12" placeholder="${fem ? 'น้ำหวาน' : 'ข้าวกล้า'}" style="flex:1"><button class="btn" data-a="babyok" data-v="${fem ? 1 : 0}">ตั้งชื่อ</button></div>`);
  },
  ageOf(k) { return window.Kid182 ? Kid182.d(k) : S.day - k.born; },
  // family members inside the house: spouse, kids in a crib, toddlers and children playing
  family() {
    if (!this.home) { this.home = new THREE.Group(); G.scene.add(this.home); }
    while (this.home.children.length) this.home.remove(this.home.children[0]);
    this.members = [];
    const r = this.st(), room = World.room;
    if (r.stage === 'married') {
      const s = this.single(r.partner); const o = Models.human(Object.assign({ pants: 0x3e3e3e, avatar: (s && s.avatar) || People.avatarFor(r.partner, 0) }, s ? s.look : {}));
      o.position.set(IN.x + room.w / 2 - 2.2, IN.y, IN.z - 0.5); this.home.add(o); this.members.push({ obj: o, x: o.position.x, z: o.position.z, sp: 1.1, t: 0 });
    }
    r.kids.forEach((k, i) => {
      const age = this.ageOf(k);
      if (age < 7) {
        const c = new THREE.Group(); c.position.set(IN.x - room.w / 2 + 2.6 + i * 1.3, IN.y, IN.z + room.d / 2 - 2.6);
        const wood = mc(0xe8d4b0, { roughness: 0.7 });
        U.mk(c, U.box(1.1, 0.08, 0.7, 1), wood, [0, 0.55, 0]);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) U.mk(c, GEO.cylLo, wood, [sx * 0.52, 0.45, sz * 0.32], [0.03, 0.9, 0.03]);
        for (let b = 0; b < 9; b++) for (const sz of [-1, 1]) U.mk(c, GEO.cylLo, wood, [-0.48 + b * 0.12, 0.75, sz * 0.32], [0.015, 0.4, 0.015]);
        U.mk(c, GEO.sph, mc(k.fem ? 0xf6c1d0 : 0xb3d4f2, { roughness: 0.9 }), [0, 0.68, 0.05], [0.18, 0.1, 0.28]);
        U.mk(c, GEO.sph, mc(0xf1c9a5), [0, 0.72, -0.2], 0.09);
        this.home.add(c);
      } else {
        const o = Models.human({ skin: 0xf1c9a5, hair: 0x1b120c, shirt: k.fem ? 0xf48fb1 : 0x64b5f6, pants: 0x34507a, skirt: k.fem ? 0xe57373 : null, pony: k.fem });
        o.scale.setScalar(age < 20 ? 0.48 : age < 45 ? 0.64 : 0.88); o.position.set(IN.x + (i - 1) * 1.5, IN.y, IN.z + 1); this.home.add(o);
        this.members.push({ obj: o, x: o.position.x, z: o.position.z, sp: age < 20 ? 0.8 : 1.6, t: Math.random() * 3, kid: k });
      }
    });
    this.home.visible = G.inside;
  },
  updateFamily(dt) {
    if (!this.home) return;
    this.home.visible = G.inside;
    if (!G.inside) return;
    const room = World.room;
    for (const m of this.members) {
      m.t -= dt;
      if (m.t <= 0) { m.t = 3 + Math.random() * 5; m.tx = IN.x + (Math.random() - 0.5) * (room.w - 3); m.tz = IN.z + (Math.random() - 0.5) * (room.d - 3); }
      const dx = (m.tx ?? m.x) - m.x, dz = (m.tz ?? m.z) - m.z, d = Math.hypot(dx, dz), mv = Math.min(d, m.sp * dt);
      if (d > 0.1) { m.x += dx / d * mv; m.z += dz / d * mv; m.obj.rotation.y = Math.atan2(dx, dz); }
      m.obj.position.set(m.x, IN.y, m.z); Models.animHuman(m.obj, dt, d > 0.1 ? m.sp * 2 : 0, null);
    }
  },
  familyTargets(consider, p) {
    if (!G.inside || !this.members) return;
    for (const m of this.members) { const d = Math.hypot(p.x - m.x, p.z - m.z); if (d < 1.5) consider({ kind: 'ext', act: () => this.memberAct(m) }, d); }
  },
  memberAct(m) {
    const r = this.st();
    if (m.kid && (window.Kid182 ? Kid182.d(m.kid) : S.day - m.kid.born) >= 45) return { icon: '🎓', label: `คุยกับ${m.kid.name} (วัยรุ่น)`, fn: () => Social2.teenUI(m.kid) };
    if (m.kid) return { icon: '🧸', label: `ดูแล${m.kid.name}`, fn: () => People.kidUI(m.kid) }; if (0) return { icon: '🧸', label: `เล่นกับ${m.kid.name}`, fn: () => { if (r.played === S.day + ':' + m.kid.name) { UI.toast(`${m.kid.name}: “เล่นกันอีกพรุ่งนี้นะ!”`, '🧸'); return; } r.played = S.day + ':' + m.kid.name; S.energy = Math.min(maxEnergy(), S.energy + 10); UI.toast(`${m.kid.name}: “${U.pick(['เย้! พ่อแม่มาเล่นด้วย', 'อยากไปดูไก่ที่คอก', 'โตขึ้นจะเป็นชาวไร่เหมือนพ่อแม่'])}” พลังงาน +10`, '🧸'); } };
    const n = G.npcs.find(x => x.name === r.partner);
    return { icon: '💞', label: `คุยกับ${r.partner}`, fn: () => n && UI.talk(n) };
  },

  // ----- farm stand: villagers walk in from the road and buy what is on display -----
  STAND: { x: 5.5, z: -49, rot: -Math.PI / 2 },
  buildStand() {
    const s = this.STAND, g = new THREE.Group(); g.position.set(s.x, H(s.x, s.z), s.z); g.rotation.y = s.rot;
    U.mk(g, U.box(2.6, 0.9, 1.1, 1.2), M.wood, [0, 0.45, 0]);
    for (const a of [-1, 1]) for (const b of [-1, 1]) U.mk(g, GEO.cylLo, M.darkwood, [a * 1.2, 1.25, b * 0.5], [0.06, 2.5, 0.06]);
    const roof = U.mk(g, GEO.box, U.mat(0x4caf50, { map: T.stripes, roughness: 0.9 }), [0, 2.5, 0], [2.9, 0.08, 1.6]); roof.rotation.x = 0.15;
    const sm = new THREE.MeshStandardMaterial({ map: U.signTex('แผงผักสดจากไร่', { w: 384, h: 96, bg: '#7a4a24', fg: '#fff1c9' }), roughness: 0.8 });
    U.mk(g, new THREE.PlaneGeometry(2.2, 0.55), sm, [0, 2.05, 0.52]);
    this.standG = g; this.standGoods = new THREE.Group(); g.add(this.standGoods);
    World.outdoor.add(g); Col.box(s.x, s.z, 1.3, 0.6, s.rot);
    const front = l2w(s.x, s.z, s.rot, 0, 1.6);
    World.pois.push({ kind: 'act', x: front.x, z: front.z, r: 2.2, label: 'แผงขายหน้าฟาร์ม', icon: '🧺', map: true, act: () => ({ icon: '🧺', label: 'จัดของขายที่แผงหน้าฟาร์ม', fn: () => this.standUI() }) });
    this.shopPos = l2w(s.x, s.z, s.rot, 0, 2.1);
    this.drawGoods(); this.visitors = []; this.visitT = 20;
  },
  drawGoods() {
    const g = this.standGoods; while (g.children.length) g.remove(g.children[0]);
    const ids = Object.keys(S.stand || {}).filter(k => S.stand[k] > 0).slice(0, 6);
    ids.forEach((id, i) => { const sp = U.sprite ? U.sprite(ITEMS[id].i, 0.42) : null; if (sp) { sp.position.set(-0.95 + i * 0.38, 1.12, 0.1); g.add(sp); } });
  },
  standUI() {
    S.stand = S.stand || {};
    UI.open('แผงขายหน้าฟาร์ม', null, () => {
      const on = Object.keys(S.stand).filter(k => S.stand[k] > 0), inv = UI.sellables();
      return `<p class="lead">วางของไว้ที่แผง ชาวบ้านจะเดินเข้ามาซื้อเองช่วง 8:00–18:00 ได้ราคาปกติ +10% และไม่ต้องเดินไปส่งขาย ขายแล้ว ${U.fmt(S.standSold || 0)} ชิ้น</p>
        <h5>บนแผงตอนนี้</h5>${on.length ? `<div class="grid">${on.map(id => `<div class="card"><div class="ci">${ITEMS[id].i}</div><div class="cb"><h4>${esc(ITEMS[id].n)} <small>×${S.stand[id]}</small></h4><p>ขาย ${baht(Math.round(priceOf(id) * 1.1))}</p><div class="row"><button class="btn ghost" data-a="unstand" data-id="${id}">เก็บคืน</button></div></div></div>`).join('')}</div>` : '<p class="empty">แผงยังว่าง</p>'}
        <h5>ของในกระเป๋า</h5>${inv.length ? `<div class="grid">${inv.map(id => `<div class="card"><div class="ci">${ITEMS[id].i}</div><div class="cb"><h4>${esc(ITEMS[id].n)} <small>×${count(id)}</small></h4><div class="row"><button class="btn" data-a="stand" data-id="${id}" data-q="1">วาง 1</button><button class="btn ghost" data-a="stand" data-id="${id}" data-q="all">วางหมด</button></div></div></div>`).join('')}</div>` : '<p class="empty">ไม่มีของที่ขายได้</p>'}`;
    });
  },
  updateVisitors(dt) {
    if (!this.standG) return;
    const h = S.time / 60, stock = Object.keys(S.stand || {}).filter(k => S.stand[k] > 0);
    if ((this.visitT -= dt) <= 0) {
      this.visitT = 25 + Math.random() * 35;
      if (stock.length && h >= 8 && h < 18 && this.visitors.length < 2 && !isNightTime()) {
        const R = Math.random, o = Models.human({ skin: [0xf1c9a5, 0xe0a87e, 0xc68d63][(R() * 3) | 0], hair: [0x1b120c, 0x3a2416, 0x9e9e9e][(R() * 3) | 0], shirt: [0x4a90c2, 0xe57373, 0x81c784, 0xffb74d, 0xba68c8][(R() * 5) | 0], pants: 0x34507a, skirt: R() < 0.4 ? 0xc0504d : null, long: R() < 0.3, hat: R() < 0.4 ? 'straw' : null });
        World.dyn.add(o); const v = { obj: o, x: 1.5, z: -64, st: 'in', t: 0, path: [{ x: 1.2, z: -56 }, this.shopPos] }; o.position.set(v.x, H(v.x, v.z), v.z);
        this.visitors.push(v);
      }
    }
    for (const v of this.visitors.slice()) {
      if (v.st === 'buy') {
        v.t += dt; v.obj.rotation.y = this.STAND.rot + Math.PI; Models.animHuman(v.obj, dt, 0, null);
        if (v.t > 3) { this.buy(v); v.st = 'out'; v.path = [{ x: 1.2, z: -56 }, { x: 1.5, z: -66 }]; }
        continue;
      }
      const p = v.path[0]; if (!p) { if (v.st === 'in') { v.st = 'buy'; v.t = 0; } else { World.dyn.remove(v.obj); this.visitors.splice(this.visitors.indexOf(v), 1); } continue; }
      const dx = p.x - v.x, dz = p.z - v.z, d = Math.hypot(dx, dz), mv = Math.min(d, 1.5 * dt);
      if (d < 0.2) { v.path.shift(); continue; }
      v.x += dx / d * mv; v.z += dz / d * mv; v.obj.rotation.y = Math.atan2(dx, dz);
      v.obj.position.set(v.x, H(v.x, v.z), v.z); Models.animHuman(v.obj, dt, 1.5, null);
    }
  },
  buy(v) {
    const stock = Object.keys(S.stand || {}).filter(k => S.stand[k] > 0); if (!stock.length) return;
    const id = U.pick(stock), n = Math.min(S.stand[id], 1 + ((Math.random() * 3) | 0)), pay = Math.round(priceOf(id) * 1.1) * n;
    S.stand[id] -= n; if (!S.stand[id]) delete S.stand[id];
    S.standSold = (S.standSold || 0) + n; S.stats.sold += n; this.drawGoods();
    this.settle(v, id, n, pay);
  },
  // how a sale is paid (v48_stand.js replaces this: the customer chooses cash into the wallet or a bank transfer, and an employee may be on duty)
  settle(v, id, n, pay) {
    earn(pay); Bank2.income('แผงหน้าฟาร์ม', pay);
    const near = !G.inside && Math.hypot(G.player.pos.x - v.x, G.player.pos.z - v.z) < 40;
    if (near) UI.toast(`ชาวบ้านซื้อ ${ITEMS[id].n} ×${n} ที่แผงหน้าฟาร์ม +${baht(pay)}`, '🧺');
    else Phone.msg('แผงหน้าฟาร์ม', `ขาย ${ITEMS[id].n} ×${n} ได้ ${baht(pay)}`, true);
  },
};
UI.H.topic = d => Social.topic(UI.talkTo, d.v);
UI.H.babyok = d => {
  const v = (($('babyName') || {}).value || '').trim().slice(0, 12) || (d.v === '1' ? 'น้ำหวาน' : 'ข้าวกล้า');
  if (Social.pendingKid) { Social.pendingKid.name = v; Social.pendingKid = null; } else Social.st().kids.push({ name: v, fem: d.v === '1', born: S.day }); Life2.note('ลูกของเราเกิดแล้ว ชื่อ' + v + ' 👶'); Social.family(); UI.close(); UI.toast(`ยินดีต้อนรับ${v}สู่ครอบครัว! ดูน้องได้ในบ้าน`, '👶');
};
UI.H.stand = d => { const n = d.q === 'all' ? count(d.id) : 1; if (!takeItem(d.id, n)) return; S.stand[d.id] = (S.stand[d.id] || 0) + n; Social.drawGoods(); };
UI.H.unstand = d => { const n = S.stand[d.id] || 0; if (!n) return; delete S.stand[d.id]; addItem(d.id, n); Social.drawGoods(); };
