'use strict';
// ---------- People: profiles (age, gender, personality), name tags, choice-based conversations, romance stages, stations ----------
NPC_NAMES.push('พี่นุ่น', 'น้าเปี๊ยก', 'พี่บอล', 'น้องแพรว', 'ลุงเสริม', 'พี่กุ้ง', 'น้องเมฆ', 'ป้าศรี', 'พี่ปาล์ม', 'น้องใบเตย', 'ตาสิงห์', 'พี่ฟ้า', 'น้าอ้วน', 'พี่ก้อง', 'ยายบุญ', 'น้องโอ๊ต', 'พี่หญิง', 'ลุงพร', 'พี่แบงค์', 'น้องมิ้นท์');
const TRAITS = {
  kind: { n: 'ใจดี', like: ['polite', 'deep', 'gentle'], dislike: ['tease'] },
  shy: { n: 'ขี้อาย', like: ['polite', 'gentle'], dislike: ['bold', 'tease'] },
  cheerful: { n: 'ร่าเริง', like: ['joke', 'fun'], dislike: ['serious'] },
  serious: { n: 'จริงจัง', like: ['serious', 'deep'], dislike: ['joke', 'tease'] },
  romantic: { n: 'โรแมนติก', like: ['sweet', 'bold', 'gentle'], dislike: ['serious'] },
  adventurous: { n: 'ชอบผจญภัย', like: ['fun', 'bold'], dislike: ['polite'] },
  playful: { n: 'ขี้เล่น', like: ['tease', 'joke'], dislike: ['serious'] },
  calm: { n: 'ใจเย็น', like: ['gentle', 'deep'], dislike: ['bold'] },
};
const FEM_PREFIX = ['ป้า', 'ยาย', 'ครู'], FEM_NAMES = ['มะลิ', 'แก้ว', 'ดาว', 'น้องฝน', 'น้องข้าวหอม', 'น้องแพรว', 'ป้าศรี', 'น้องใบเตย', 'พี่ฟ้า', 'พี่หญิง', 'น้องมิ้นท์', 'พี่นุ่น', 'พี่กุ้ง', 'ป้ามะลิวัลย์', 'น้าชม', 'พี่โอ๋มาร์ท', 'น้าอ้วน'];
// conversation topics: opener, then three replies tagged by tone
const TOPICS = {
  meet: { o: 'สวัสดี ไม่ค่อยเห็นหน้าเลย มาใหม่เหรอ?', c: [['polite', 'สวัสดีครับ/ค่ะ เพิ่งย้ายมาทำฟาร์ม ฝากเนื้อฝากตัวด้วยนะ'], ['joke', 'ใช่ ชาวไร่ที่หน้าตาดีที่สุดในหมู่บ้านไง'], ['fun', 'ใช่ แถวนี้มีที่เที่ยวสนุก ๆ บ้างไหม?']] },
  day: { o: 'วันนี้ทำอะไรมาบ้างล่ะ?', c: [['serious', 'รดน้ำผักทั้งไร่ แล้วคิดเรื่องขยายแปลงอยู่'], ['joke', 'โดนไก่ไล่จิกรอบฟาร์มเลย ฮา ๆ'], ['deep', 'ทำงานไป คิดถึงบ้านเกิดไปน่ะ']] },
  dream: { o: 'ถ้าทำอะไรก็ได้ในชีวิต เธออยากทำอะไร?', c: [['deep', 'อยากให้ฟาร์มเลี้ยงคนทั้งหมู่บ้านได้'], ['fun', 'ขับรถเที่ยวรอบประเทศเลย!'], ['serious', 'เก็บเงินซื้อที่ดินเพิ่ม สร้างอนาคตให้มั่นคง']] },
  hobby: { o: 'ว่าง ๆ เธอชอบทำอะไร?', c: [['gentle', 'ชอบนั่งดูพระอาทิตย์ตกเงียบ ๆ'], ['fun', 'ตกปลา ขับรถ ลุยไปเรื่อย'], ['polite', 'ชอบทำอาหารให้คนที่รู้จักกิน']] },
  flirt: { o: 'มองหน้าฉันทำไม มีอะไรติดเหรอ?', c: [['sweet', 'เปล่า แค่รอยยิ้มเธอสวยดี'], ['tease', 'มีนิดนึง... ความน่ารักไง'], ['gentle', 'ขอโทษนะ เผลอมองเพราะเธอดูมีความสุข']] },
  confess: { o: 'ช่วงนี้เราเจอกันบ่อยนะ... มีอะไรอยากบอกฉันหรือเปล่า?', c: [['bold', 'ฉันชอบเธอ เป็นแฟนกันนะ'], ['gentle', 'อยากรู้จักเธอให้มากกว่านี้ ไปเดทกันไหม'], ['polite', 'ไม่มีอะไร แค่อยากคุยด้วยเฉย ๆ']] },
  couple: { o: 'วันนี้คิดถึงฉันบ้างไหม?', c: [['sweet', 'คิดถึงทั้งวันเลย'], ['joke', 'นิดหน่อย... ล้อเล่นน่า คิดถึงมาก'], ['deep', 'ทุกครั้งที่เห็นดอกไม้ในไร่ก็นึกถึงเธอ']] },
  future: { o: 'เธอว่าอีก 5 ปีเราจะเป็นยังไง?', c: [['deep', 'มีบ้านหลังใหญ่ในไร่ อยู่ด้วยกันทุกวัน'], ['fun', 'เที่ยวรอบโลกด้วยกันแล้วกลับมาทำฟาร์ม'], ['serious', 'เก็บเงินให้พอ แล้วสร้างครอบครัวของเรา']] },
  family: { o: 'ลูก ๆ โตเร็วจังเลยนะ เธอว่าเราเลี้ยงลูกดีไหม?', c: [['gentle', 'ดีที่สุดแล้ว เพราะมีเธอช่วย'], ['joke', 'ดีมาก ยกเว้นตอนแย่งขนมกันน่ะ'], ['deep', 'อยากให้ลูกโตมารักธรรมชาติเหมือนเรา']] },
};
const REACT = {
  good: ['ชอบที่เธอพูดแบบนี้จัง 😊', 'ฮ่า ๆ เธอนี่น่าคุยดีนะ', 'พูดแบบนี้ ใจฟูเลย', 'เข้าใจฉันดีจัง'],
  ok: ['อืม ก็จริงนะ', 'งั้นเหรอ น่าสนใจดี', 'โอเค ๆ'],
  bad: ['เอ่อ... ไม่ค่อยชอบแบบนี้เท่าไหร่', 'พูดแบบนั้นฉันอึดอัดนะ', 'หืม? ไม่ขำเลย'],
};
const DATE_SPOTS = [
  { k: 'meal', n: 'กินข้าวร้านป้าแดง', i: '🍜', cost: 300, love: 1.0, energy: 30 },
  { k: 'sunset', n: 'ดูพระอาทิตย์ตกที่ท่าเรือ', i: '🌅', cost: 0, love: 1.3, energy: 10, when: () => S.time >= 16 * 60 && S.time <= 19 * 60, why: 'ต้องไปช่วง 16:00–19:00' },
  { k: 'picnic', n: 'ปิกนิกในไร่ (ใช้อาหาร 1 จาน)', i: '🧺', cost: 0, love: 1.2, energy: 20, need: () => Object.keys(S.inv).find(k => k.startsWith('dish_') && S.inv[k] > 0), why: 'ต้องมีอาหารทำเอง 1 จาน' },
  { k: 'fest', n: 'เที่ยวงานเทศกาล', i: '🎡', cost: 150, love: 1.6, energy: 15, when: () => Fest.on, why: 'มีเฉพาะวันเทศกาล' },
  { k: 'movie', n: 'ดูหนังที่บ้าน', i: '🎬', cost: 0, love: 0.9, energy: 15, when: () => S.furn.tv, why: 'ต้องมีทีวีในบ้าน' },
  { k: 'drive', n: 'ขับรถเที่ยวเลียบหาด', i: '🚗', cost: 100, love: 1.2, energy: 10, when: () => G.cars.length, why: 'ต้องมีรถ' },
];
const WEDDINGS = [{ n: 'เรียบง่ายในไร่', cost: 0, bonus: 0 }, { n: 'พิธีแต่งงานแบบไทย', cost: 5000, bonus: 1 }, { n: 'งานใหญ่ที่ลานน้ำพุ', cost: 20000, bonus: 2 }];

const People = {
  // stable profile from the name: gender, age, personality, job
  prof(name) {
    if (this._p && this._p[name]) return this._p[name];
    this._p = this._p || {};
    const h = Math.abs(strHash(name)), s = typeof SINGLES !== 'undefined' && SINGLES.find(x => x.name === name);
    let fem = s ? s.fem : FEM_NAMES.includes(name) || FEM_PREFIX.some(p => name.startsWith(p));
    let age = /^ยาย|^ตา/.test(name) ? 66 + h % 14 : /^ป้า|^ลุง/.test(name) ? 48 + h % 12 : /^น้า|^ครู/.test(name) ? 36 + h % 10 : /^น้อง/.test(name) ? 15 + h % 7 : 23 + h % 12;
    if (s) age = 24 + h % 6;
    const tk = Object.keys(TRAITS), trait = s ? (s.trait || tk[h % tk.length]) : tk[(h >> 2) % tk.length];
    let job = typeof Social !== 'undefined' ? Social.profile({ name, keeper: null }).job : '';
    if (age < 19) job = 'นักเรียน'; else if (age >= 60) job = 'ผู้สูงอายุ (เกษียณแล้ว)'; else if (job === 'นักเรียน' || job === 'ข้าราชการเกษียณ') job = 'ชาวนา';
    return (this._p[name] = { fem, age, trait, job, single: !!s || (age >= 21 && age <= 38) });
  },
  avatarFor(name, i) {
    const p = this.prof(name);
    if (p.age < 18) return p.fem ? (i % 2 ? 'Jennifer' : 'toon:skater') : 'toon:tee';
    return p.fem ? ['toon:jacket', 'Erika', 'toon:chic', 'Olivia', 'toon:skater', 'Lydia', 'Kate', 'toon:civil', 'Rose'][i % 9] : ['toon:suit', 'Robert', 'toon:tee', 'Kyle', 'toon:casual'][i % 5];
  },
  card(n) {
    const p = this.prof(n.name), r = Social.st();
    const status = r.partner === n.name ? Social.status(n.name) + (Social2.st().sulk ? ' (งอนอยู่ 😤)' : '') : Social2.pairOf(n.name) ? '' : p.single && p.age >= 21 ? 'โสด' : '';
    const extra = (Stations2.st().bounty && Stations2.st().bounty.day === S.day && !Stations2.st().bounty.done && !n.staff ? '<button class="btn ghost" data-a="accuse">🚨 แจ้งเบาะแสว่าเป็นผู้ต้องสงสัย</button> ' : '') + (Stations2.st().faint === n.name ? (Stations2.st().cpr ? '<button class="btn" data-a="cprhelp">❤️‍🩹 ปฐมพยาบาล CPR</button>' : '<p class="lead">😵 กำลังเป็นลม! ต้องอบรม CPR ที่สถานีดับเพลิงก่อนจึงจะช่วยได้</p>') : '');
    return extra + `<p class="lead">${p.fem ? '♀ หญิง' : '♂ ชาย'} · อายุ ${p.age} ปี · นิสัย<b>${TRAITS[p.trait].n}</b> · ${esc(n.keeper ? 'เจ้าของ' + (SHOPS[n.keeper] ? SHOPS[n.keeper].n : 'ร้าน') : p.job)}${status ? ' · ' + status : ''}${Social2.pairOf(n.name) ? ` · ${Social2.pairOf(n.name).st}กับ${Social2.pairOf(n.name).w}` : ''}${n.doing ? `<br>📍 ตอนนี้: ${n.doing}` : ''}</p>`;
  },
  // name tags over people near the player
  tags(dt) {
    if (!G.started) return;
    this.tagT = (this.tagT || 0) - dt; if (this.tagT > 0) return; this.tagT = 0.3;
    const P = G.player.pos;
    for (const n of G.npcs) {
      const near = !G.inside && !n.away && n.obj.visible && Math.hypot(P.x - n.x, P.z - n.z) < 9;
      if (near && !n.tag) {
        const p = this.prof(n.name), txt = `${n.name} ${p.fem ? '♀' : '♂'}${p.age}`;
        n.tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: U.signTex(txt, { w: 320, h: 72, bg: n.single || (p.single && p.age >= 21) ? '#ad1457' : '#1f5d4a', border: '#0b2a20' }), transparent: true, depthWrite: false, depthTest: false }));
        n.tag.scale.set(1.5, 0.34, 1); n.tag.renderOrder = 5; G.scene.add(n.tag);
      }
      if (n.tag) { n.tag.visible = near; if (near) n.tag.position.set(n.x, (n.obj.position.y || 0) + 2.15 * (n.obj.scale.y || 1), n.z); }
    }
  },
  // ----- conversations with choices -----
  topicFor(n) {
    const p = this.prof(n.name), h = Friends.get(n.name), r = Social.st(), mine = r.partner === n.name;
    if (mine && r.stage === 'married') return U.pick(['family', 'couple', 'future']);
    if (mine) return U.pick(['couple', 'future', 'flirt', 'hobby']);
    if (h < 1.5) return 'meet';
    // only someone who could really date you (not a shopkeeper, not already in a couple)
    if (p.single && p.age >= 21 && !r.partner && h >= 8 && Social.single(n.name)) return 'confess';
    if (p.single && p.age >= 21 && h >= 4) return U.pick(['flirt', 'hobby', 'dream']);
    return U.pick(['day', 'dream', 'hobby']);
  },
  convStart(n) { UI.conv = { n, k: this.topicFor(n), done: null }; },
  convHTML(n) {
    const c = UI.conv; if (!c || c.n !== n) return '';
    const T = TOPICS[c.k];
    if (c.done) return `<div class="card order"><div class="ci">💬</div><div class="cb"><p>“${esc(c.done)}”</p><div class="row"><button class="btn ghost" data-a="cvnext">คุยต่อ</button></div></div></div>`;
    return `<div class="card order"><div class="ci">💬</div><div class="cb"><h4>“${esc(T.o)}”</h4>${T.c.map((o, i) => `<button class="btn ghost choice" data-a="cvc" data-i="${i}">${esc(o[1])}</button>`).join('')}</div></div>`;
  },
  choose(n, i) {
    const c = UI.conv, T = TOPICS[c.k], [tone] = T.c[i], tr = TRAITS[this.prof(n.name).trait], r = Social.st();
    const res = tr.like.includes(tone) ? 'good' : tr.dislike.includes(tone) ? 'bad' : 'ok';
    const key = n.name + ':' + S.day; S.convN = S.convN || {}; const cnt = S.convN[key] || 0; S.convN[key] = cnt + 1;
    const gain = cnt < 3 ? { good: 0.45, ok: 0.12, bad: -0.3 }[res] * (S.buff && S.buff.clean === S.day ? 1.25 : 1) * (S.perk && S.perk.love && res === 'good' ? 1.2 : 1) : 0;
    if (gain > 0) Friends.add(n.name, gain); else if (gain < 0) S.friends[n.name] = Math.max(0, Friends.get(n.name) + gain);
    n.wave = 1.2; Sfx.tone(res === 'good' ? 880 : res === 'bad' ? 260 : 520, 0.15, 'sine', 0.05);
    let line = U.pick(REACT[res]);
    if (res === 'good' && (c.k === 'flirt' || c.k === 'confess')) Social2.flirtOther(n.name);
    if (r.partner === n.name && Social2.st().sulk) { line = 'ยังงอนอยู่นะ... ไม่อยากคุย 😤 (ต้องง้อด้วยของขวัญ)'; c.done = line; return; }
    if (c.k === 'confess' && i < 2) {
      if (res !== 'bad' && Friends.get(n.name) >= 8.5) { r.partner = n.name; r.stage = 'dating'; r.dates = 0; line = i === 0 ? 'จริงเหรอ... ฉันก็ชอบเธอเหมือนกัน เป็นแฟนกันนะ 💕' : 'ไปสิ! ถือว่าเราเริ่มคบกันเลยนะ 💕'; UI.toast(`ตอนนี้คุณกับ${n.name}เป็นแฟนกันแล้ว!`, '💕'); Prog.add(30); }
      else line = 'ขอบคุณนะ... แต่ขอเวลาทำความรู้จักกันอีกหน่อยได้ไหม';
    }
    if (cnt >= 3) line += ' (วันนี้คุยกันเยอะแล้ว พรุ่งนี้ค่อยคุยต่อนะ)';
    c.done = `${line}${gain ? ` ${gain > 0 ? '❤️+' : '💔'}${Math.abs(gain).toFixed(1)}` : ''}`;
  },
  // ----- dates, proposal and wedding -----
  dateUI(n) {
    UI.open('ชวน' + n.name + 'ไปเดท', null, () => `<p class="lead">เดทแล้ว ${Social.st().dates || 0} ครั้ง · เดทครบ 3 ครั้งขึ้นไปและสนิท 10 หัวใจ จึงขอแต่งงานได้</p><div class="grid">${DATE_SPOTS.map(d => {
      const ok = (!d.when || d.when()) && (!d.need || d.need()) && S.money >= d.cost;
      return `<div class="card"><div class="ci">${d.i}</div><div class="cb"><h4>${d.n}</h4><p class="dim">${d.cost ? baht(d.cost) + ' · ' : 'ฟรี · '}ความรัก +${d.love} · พลังงาน +${d.energy}${!ok && d.why ? ' · ' + d.why : ''}</p><div class="row"><button class="btn" data-a="dgo" data-k="${d.k}" ${ok && Social.st().dated !== S.day ? '' : 'disabled'}>${Social.st().dated === S.day ? 'เดทแล้ววันนี้' : 'ไปกันเลย'}</button></div></div></div>`;
    }).join('')}</div>`);
  },
  date(k) {
    const n = UI.talkTo, d = DATE_SPOTS.find(x => x.k === k), r = Social.st(); if (!n || !d || r.dated === S.day) return;
    if (S.money < d.cost || (d.when && !d.when())) return;
    if (d.need) { const it = d.need(); if (!it || !takeItem(it)) return; }
    S.money -= d.cost; r.dated = S.day; r.dates = (r.dates || 0) + 1; UI.close();
    fade(() => { tick(120); S.energy = Math.min(maxEnergy(), S.energy + d.energy); Friends.add(n.name, d.love); UI.toast(`เดทกับ${n.name}: ${d.n} ❤️+${d.love}`, d.i); Sfx.tone(660, 0.3, 'sine', 0.05, 990); });
  },
  proposeOK(n) { const r = Social.st(); return r.partner === n.name && r.stage === 'dating' && Friends.get(n.name) >= 10 && (r.dates || 0) >= 3 && count('ring'); },
  weddingUI() {
    UI.open('เลือกรูปแบบงานแต่งงาน', null, () => `<p class="lead">งานยิ่งใหญ่ ชาวบ้านยิ่งมาร่วมยินดี ได้ค่าประสบการณ์และของขวัญมากขึ้น</p><div class="grid">${WEDDINGS.map((w, i) => `<div class="card"><div class="ci">${['💒', '🪷', '🎆'][i]}</div><div class="cb"><h4>${w.n}</h4><p>${w.cost ? baht(w.cost) : 'ฟรี'}</p><div class="row"><button class="btn" data-a="wpick" data-i="${i}" ${S.money < w.cost ? 'disabled' : ''}>เลือก</button></div></div></div>`).join('')}</div>`);
  },
  // ----- children: grow up, can be fed, played with and taught -----
  kidStage(k) { const a = window.Kid182 ? Kid182.d(k) : S.day - k.born; return a < 7 ? 'ทารก' : a < 20 ? 'เด็กเล็ก' : a < 45 ? 'เด็กโต' : 'วัยรุ่น'; },
  kidUI(k) {
    const st = this.kidStage(k);
    UI.open(`${k.name} (${st} · ${S.day - k.born} วัน)`, null, () => `<p class="lead">ความสุข ${Math.round(k.joy ?? 60)}% · ทักษะฟาร์ม ${k.skill || 0}/5${(k.skill || 0) >= 3 ? ' · ช่วยรดน้ำผักทุกเช้าแล้ว!' : ''}</p>
      <div class="grid">${[['kfeed', '🍼', 'ป้อนข้าว/นม', 'ใช้นมสดหรืออาหาร 1 ชิ้น'], ['kplay', '🧸', 'เล่นด้วยกัน', 'ความสุข +15'], ['kteach', '📚', 'สอนงานฟาร์ม', st === 'ทารก' ? 'โตอีกหน่อยก่อนนะ' : 'ทักษะ +1 (วันละครั้ง)'], ['kstory', '🌙', 'เล่านิทานก่อนนอน', 'พลังงานคุณ +5']].map(([a, i, t, d]) => `<div class="card"><div class="ci">${i}</div><div class="cb"><h4>${t}</h4><p class="dim">${d}</p><div class="row"><button class="btn" data-a="${a}" data-n="${esc(k.name)}">ทำ</button></div></div></div>`).join('')}</div>`);
  },
  kidAct(a, name) {
    const k = Social.st().kids.find(x => x.name === name); if (!k) return;
    k.joy = k.joy ?? 60; const key = a + S.day; k.did = k.did || {};
    if (k.did[key]) { UI.toast(`${k.name}: “ทำแล้ววันนี้ พรุ่งนี้อีกนะ!”`, '🧸'); return; }
    if (a === 'kfeed' && !this._fed) {
      // you choose what the child eats (milk, a dish or a snack), then the normal reward runs with that item
      const L = ['milk'].concat(Object.keys(S.inv).filter(x => x.startsWith('dish_') || x.startsWith('food_'))).filter(x => ITEMS[x] && count(x) > 0);
      if (!L.length) { UI.toast('ไม่มีนมหรืออาหารในกระเป๋า', '🍼'); return; }
      ItemPick.open(`เลือกอาหารให้${k.name}`, L, it => { if (!takeItem(it)) return; k.joy = Math.min(100, k.joy + 20); this._fed = true; try { this.kidAct('kfeed', name); } finally { this._fed = false; } });
      return;
    }
    if (a === 'kplay') k.joy = Math.min(100, k.joy + 15);
    if (a === 'kteach') { if (this.kidStage(k) === 'ทารก') { UI.toast('ยังเล็กเกินไป', '👶'); return; } k.skill = Math.min(5, (k.skill || 0) + 1); }
    if (a === 'kstory') S.energy = Math.min(maxEnergy(), S.energy + 5);
    k.did[key] = 1; Prog.add(4); Sfx.tone(700, 0.15, 'sine', 0.05, 900);
    UI.toast(`${k.name}: “${U.pick(['สนุกจัง!', 'รักพ่อแม่ที่สุด', 'อีกครั้งนะ!', 'โตขึ้นจะเป็นชาวไร่เหมือนกัน'])}”`, '🧸');
  },
  kidsDay() {
    for (const k of Social.st().kids) {
      k.joy = Math.max(0, (k.joy ?? 60) - 8);
      if ((k.skill || 0) >= 3 && this.kidStage(k) === 'เด็กโต') { let n = 0; S.plots.forEach(p => { if (p.c && p.w <= 0 && n < 4) { p.w = 1; n++; } }); if (n) Phone.msg(k.name, `วันนี้หนูช่วยรดน้ำผักให้ ${n} แปลงแล้วนะ!`, true); }
    }
  },
  // ----- police & fire station services, and their staff as NPCs -----
  staff() {
    const add = (obj, name, rot) => { const p = obj.position; G.npcs.push({ obj, name, rot, speed: 0, timer: 0, st: 'idle', wave: 0, fixed: true, x: p.x, z: p.z, tx: p.x, tz: p.z, hx: p.x, hz: p.z, hrot: rot, staff: true }); };
    const c = Emergency.crews; if (c[0]) add(c[0].obj, 'ร.ต.ท.สมชาย', STATIONS.police.rot); if (c[1]) add(c[1].obj, 'หัวหน้าวิชัย', STATIONS.fire.rot);
    Object.assign(this._p || (this._p = {}), { 'ร.ต.ท.สมชาย': { fem: false, age: 41, trait: 'serious', job: 'ร้อยตำรวจโท สถานีตำรวจภูธรสุขใจ', single: false }, 'หัวหน้าวิชัย': { fem: false, age: 47, trait: 'kind', job: 'หัวหน้าสถานีดับเพลิง', single: false }, 'ช่างหนุ่ม': { fem: false, age: 27, trait: 'cheerful', job: 'ช่างแต่งรถ', single: true } });
  },
  reportUI() {
    S.cases = S.cases || [];
    UI.open('แจ้งความ · สถานีตำรวจภูธรสุขใจ', null, () => `<p class="lead">ร.ต.ท.สมชาย: “แจ้งเรื่องอะไรครับ เจ้าหน้าที่จะติดตามและแจ้งผลทางมือถือ”</p>
      <div class="grid">${[['theft', '🕵️', 'ผลผลิตถูกขโมย', 'ถ้าขโมยหนีไปได้ ตำรวจจะสืบหา มีโอกาสได้ของคืน'], ['lost', '👛', 'ของหาย', 'แจ้งของหาย มีคนเก็บได้จะได้รางวัลน้ำใจคืน'], ['noise', '📢', 'เหตุรำคาญ', 'แจ้งเสียงดังหรือคนแปลกหน้า ตำรวจจะเพิ่มสายตรวจ (ขโมยมาน้อยลง 3 วัน)'], ['patrol', '🚔', 'อาสาตำรวจบ้าน', 'เดินตรวจกับตำรวจ 1 ชม. ได้ค่าตอบแทน 250 ฿']].map(([k, i, t, d]) => `<div class="card"><div class="ci">${i}</div><div class="cb"><h4>${t}</h4><p class="dim">${d}</p><div class="row"><button class="btn" data-a="report" data-k="${k}" ${(S.rep || {})[k] === S.day || (k === 'theft' && !(S.theftDay >= S.day - 1)) ? 'disabled' : ''}>แจ้ง</button></div></div></div>`).join('')}</div>
      ${S.cases.length ? `<h5>คดีของคุณ</h5><ul class="lead">${S.cases.slice(-6).reverse().map(c => `<li>${RD(c.day)}: ${esc(c.t)} — ${esc(c.st)}</li>`).join('')}</ul>` : ''}`);
  },
  report(k) {
    S.cases = S.cases || []; S.rep = S.rep || {}; if (S.rep[k] === S.day) return; if (k === 'theft' && !(S.theftDay >= S.day - 1)) { UI.toast('ยังไม่มีเหตุขโมยให้แจ้ง', '🕵️'); return; } S.rep[k] = S.day;
    const t = { theft: 'ผลผลิตถูกขโมย', lost: 'แจ้งของหาย', noise: 'แจ้งเหตุรำคาญ', patrol: 'อาสาตำรวจบ้าน' }[k];
    if (k === 'patrol') { UI.close(); fade(() => { tick(60); earn(250); Prog.add(10); UI.toast('ลาดตระเวนกับตำรวจเสร็จแล้ว ได้ค่าตอบแทน 250 ฿', '🚔'); }); S.cases.push({ day: S.day, t, st: 'เสร็จสิ้น' }); return; }
    if (k === 'noise') { S.emerg.nextThief = Math.max(S.emerg.nextThief || 0, S.day + 3); S.cases.push({ day: S.day, t, st: 'เพิ่มสายตรวจ 3 วัน' }); UI.toast('ตำรวจจะเพิ่มสายตรวจรอบไร่ 3 วัน', '🚓'); return; }
    S.cases.push({ day: S.day, t, st: 'กำลังสืบสวน', k, open: true }); UI.toast('รับแจ้งความแล้ว จะแจ้งผลทางมือถือ', '📝');
  },
  casesDay() {
    for (const c of S.cases || []) if (c.open && S.day > c.day) {
      c.open = false;
      if (Math.random() < (c.k === 'theft' ? 0.15 : 0.08)) { c.st = 'พบของคืนบางส่วน'; Phone.msg('สถานีตำรวจภูธรสุขใจ', `คดี "${c.t}" พบของกลางบางส่วน มารับคืนที่สถานีได้ (ทรัพย์สินที่ยังไม่หมดอายุความ) ไม่มีเงินรางวัลหรือค่าชดเชยจากตำรวจ`); try { Bank2.log('ได้รับของคืนจากคดี', 0); } catch (e) { } }
      else { c.st = 'ปิดคดี ไม่พบเบาะแส'; Phone.msg('สถานีตำรวจภูธรสุขใจ', `คดี "${c.t}" ยังไม่พบเบาะแส ขออภัยครับ`, true); }
    }
  },
  fireTrain() {
    if (S.fireTrained) { UI.toast('คุณผ่านการอบรมแล้ว', '🧯'); return; }
    if (S.money < 500) { UI.toast('ค่าอบรม 500 ฿', '💸'); return; }
    S.money -= 500; S.fireTrained = 1; UI.close(); fade(() => { tick(120); Prog.add(25); UI.toast('ผ่านการอบรมดับเพลิงแล้ว! สาดน้ำดับไฟได้แรงขึ้น 2 เท่า', '🧯'); });
  },
};
UI.H.cvc = d => People.choose(UI.talkTo, +d.i);
UI.H.cvnext = () => People.convStart(UI.talkTo);
UI.H.conv = () => People.convStart(UI.talkTo);
UI.H.dateui = () => People.dateUI(UI.talkTo);
UI.H.dgo = d => People.date(d.k);
UI.H.wpick = d => { const r = Social.st(), w = WEDDINGS[+d.i]; if (S.money < w.cost) { UI.toast('เงินสดไม่พอ ต้องใช้ ' + baht(w.cost), '💸'); return; } S.money -= w.cost; r.wstyle = +d.i; UI.close(); UI.toast(`เลือก${w.n} งานแต่ง${RD(r.wedding)}`, '💒'); };
UI.H.report = d => People.report(d.k);
UI.H.reportui = () => People.reportUI();
UI.H.firetrain = () => People.fireTrain();
for (const k of ['kfeed', 'kplay', 'kteach', 'kstory']) UI.H[k] = d => People.kidAct(k, d.n);
