'use strict';
// ---------- Typed conversations: the player writes anything, the villager answers by intent, personality, closeness and mood ----------
const INTENTS = [
  ['greet', /สวัสดี|หวัดดี|ดีจ้า|ดีครับ|ดีค่ะ|^ดี$|hello|hi\b|ทักทาย/i],
  ['weather', /อากาศ|ฝน|ร้อน|หนาว|แดด/],
  ['howru', /สบายดี|เป็นไงบ้าง|เป็นยังไง|โอเคไหม|เหนื่อยไหม/],
  ['name', /ชื่ออะไร|ชื่อ/],
  ['age', /อายุ|กี่ขวบ|กี่ปี/],
  ['job', /ทำงาน|อาชีพ|ทำอะไรอยู่/],
  ['hobby', /งานอดิเรก|ชอบทำอะไร|ว่างๆ|ว่าง ๆ|ชอบเล่น/],
  ['food', /ชอบกิน|ของโปรด|ชอบอะไร|อาหาร|หิว/],
  ['farm', /ผัก|ฟาร์ม|ไร่|ปลูก|ข้าว|สัตว์|วัว|ไก่/],
  ['news', /ข่าว|มีอะไรใหม่|เรื่องอะไร|ซุบซิบ/],
  ['compliment', /สวย|น่ารัก|หล่อ|เก่ง|ใจดี|ยิ้ม|เท่/],
  ['love', /รัก|ชอบเธอ|ชอบคุณ|เป็นแฟน|คิดถึง|แต่งงาน|จีบ/],
  ['invite', /ไปเที่ยว|ไปกิน|เดท|ไปด้วยกัน|ว่างไหม|ไปดู/],
  ['joke', /555|ฮา|ตลก|ขำ|มุก/],
  ['thanks', /ขอบคุณ|ขอบใจ|thank/i],
  ['sorry', /ขอโทษ|โทษที|sorry/i],
  ['insult', /โง่|ควาย|น่าเกลียด|เกลียด|บ้า|ไอ้|เลว|ขี้เหร่|อ้วน/],
  ['bye', /ลาก่อน|บาย|ไปก่อน|แล้วเจอกัน|bye/i],
];
// which intents each personality enjoys (+) or dislikes (-)
const TRAIT_TASTE = {
  kind: { compliment: 1, thanks: 1, howru: 1, farm: 1, insult: -2 },
  shy: { greet: 1, thanks: 1, love: -1, compliment: 0, joke: -1, insult: -2 },
  cheerful: { joke: 2, invite: 1, compliment: 1, news: 1, insult: -2 },
  serious: { farm: 2, news: 1, job: 1, joke: -1, love: -1, insult: -2 },
  romantic: { love: 2, compliment: 2, invite: 1, insult: -3 },
  adventurous: { invite: 2, hobby: 1, weather: 1, farm: 0, insult: -2 },
  playful: { joke: 2, compliment: 1, love: 1, insult: -1 },
  calm: { howru: 1, weather: 1, thanks: 1, love: 0, insult: -2 },
};
const CHAT_LINES = {
  unknown: ['อืม... หมายถึงอะไรเหรอ?', 'ฟังไม่ค่อยเข้าใจ ลองพูดใหม่ได้ไหม', 'ฮะ? ลองเล่าให้ฟังอีกทีสิ'],
  greet: ['สวัสดีจ้า {me}!', 'หวัดดี วันนี้เป็นไงบ้าง', 'อ้าว {me} สวัสดี!'],
  howru: ['สบายดี ขอบใจที่ถามนะ', 'เหนื่อยนิดหน่อย แต่ก็โอเค', 'ดีมากเลย วันนี้อารมณ์ดี'],
  thanks: ['ไม่เป็นไรเลย', 'ยินดีจ้า', 'เรื่องเล็กน้อยน่า'],
  sorry: ['ไม่เป็นไรหรอก', 'อืม ยกโทษให้ก็ได้', 'ครั้งหน้าระวังหน่อยนะ'],
  joke: ['ฮ่า ๆ ๆ ตลกจริง', '555 เธอนี่นะ', 'ขำจนท้องแข็งแล้ว'],
  compliment: ['ปากหวานจัง ขอบใจนะ 😊', 'จริงเหรอ เขินเลย', 'เธอก็ไม่เบานะ'],
  love: ['เอ๊ะ... พูดแบบนี้ใจเต้นเลย', 'อย่าเพิ่งรีบสิ เรายังต้องรู้จักกันอีกเยอะ', 'ฮิ ๆ จริงจังหรือเปล่าเนี่ย'],
  loveYes: ['ฉันก็รู้สึกเหมือนกันนะ ❤️', 'อยู่กับเธอแล้วมีความสุขที่สุด', 'คิดถึงเหมือนกัน รีบมาหาบ่อย ๆ นะ'],
  insult: ['พูดแบบนี้ไม่น่ารักเลยนะ 😠', 'ไม่คุยด้วยแล้ว!', 'เสียใจนะที่พูดแบบนี้'],
  bye: ['ไว้เจอกันใหม่นะ', 'บาย ๆ ดูแลตัวเองด้วย', 'แล้วแวะมาคุยอีกนะ'],
  invite: ['ไปสิ! แต่วันนี้ไม่ค่อยว่าง ไว้นัดผ่านมือถือนะ', 'น่าสนุกดี ไว้หาเวลากัน', 'ถ้าสนิทกันกว่านี้ค่อยไปนะ'],
  inviteYes: ['ไปกันเลย! เลือกที่เดทได้เลยนะ', 'เย้ ไปด้วยกัน!'],
};

const Chat = {
  log: {},
  // how much this villager wants to talk right now (0..100) and why
  willing(n) {
    const p = People.prof(n.name), h = Friends.get(n.name), tr = p.trait, hr = S.time / 60, r = Social.st();
    let w = 45 + h * 6, why = [];
    if (tr === 'shy' && h < 3) { w -= 20; why.push('ขี้อาย ยังไม่สนิท'); }
    if (tr === 'cheerful' || tr === 'playful') { w += 12; why.push('ชอบคุย'); }
    if (tr === 'serious' && hr >= 8 && hr < 17) { w -= 12; why.push('กำลังยุ่งกับงาน'); }
    if (hr >= 22 || hr < 6) { w -= 25; why.push('ง่วงนอนแล้ว'); }
    if (n.doing && n.doing.includes('กินข้าว')) { w -= 10; why.push('กำลังกินข้าว'); }
    if ((S.mood || 60) < 30) { w -= 10; why.push('คุณดูหน้าบึ้ง'); }
    if (S.buff && S.buff.clean === S.day) { w += 8; why.push('คุณแต่งตัวสะอาด'); }
    if (r.partner === n.name) { w += 20; if (Social2.st().sulk) { w -= 60; why.push('งอนอยู่'); } }
    const cnt = (this.today(n).n || 0); if (cnt > 6) { w -= (cnt - 6) * 8; why.push('คุยกันเยอะแล้ววันนี้'); }
    if ((n.annoy || 0) > 0) { w -= n.annoy * 15; why.push('ยังโกรธที่โดนว่า'); }
    w = U.clamp(Math.round(w), 0, 100);
    return { w, why, face: w >= 70 ? '😊 อยากคุยด้วย' : w >= 40 ? '🙂 คุยได้' : w >= 20 ? '😐 ไม่ค่อยอยากคุย' : '😒 ไม่อยากคุยตอนนี้' };
  },
  today(n) { const k = n.name + ':' + S.day; S.chatDay = S.chatDay || {}; return (S.chatDay[k] = S.chatDay[k] || { n: 0, gain: 0 }); },
  html(n) {
    const lg = this.log[n.name] || [], wl = this.willing(n);
    return `<div class="card chatbox"><div class="cb"><p class="dim">${wl.face}${wl.why.length ? ' · ' + wl.why.join(' · ') : ''}</p>
      <div class="chatlog">${lg.slice(-6).map(l => `<p class="${l.me ? 'me' : 'them'}"><b>${l.me ? 'คุณ' : esc(n.name)}:</b> ${esc(l.t)}</p>`).join('') || '<p class="dim">ลองพิมพ์คุยอะไรก็ได้ เช่น “สวัสดี” “ชอบกินอะไร” “วันนี้อากาศดีนะ”</p>'}</div>
      <div class="row"><input id="npcSay" maxlength="80" placeholder="พิมพ์คุยกับ${esc(n.name)}..." style="flex:1"><button class="btn" data-a="npcsay">ส่ง</button></div></div></div>`;
  },
  intent(t) { for (const [k, re] of INTENTS) if (re.test(t)) return k; return 'unknown'; },
  reply(n, text) {
    const p = People.prof(n.name), r = Social.st(), mine = r.partner === n.name, h = Friends.get(n.name), wl = this.willing(n), td = this.today(n);
    const k = this.intent(text), me = S.name || 'เพื่อน';
    let out, taste = (TRAIT_TASTE[p.trait] || {})[k] || 0;
    td.n++;
    if (wl.w < 20 && k !== 'sorry') out = U.pick(['ขอโทษนะ ตอนนี้ไม่อยากคุย', '...', 'ไว้ค่อยคุยกันทีหลังนะ']);
    else switch (k) {
      case 'name': out = `ฉันชื่อ${n.name} ${p.fem ? 'ค่ะ' : 'ครับ'} แล้วเธอชื่อ${me}ใช่ไหม`; break;
      case 'age': out = h >= 2 || p.age < 40 ? `ฉันอายุ ${p.age} ปีแล้ว` : 'ถามอายุผู้ใหญ่ไม่สุภาพนะ 😅'; if (!(h >= 2 || p.age < 40)) taste = -1; break;
      case 'job': out = `ฉันเป็น${p.job}${n.doing ? ' ตอนนี้กำลัง' + n.doing : ''}`; break;
      case 'hobby': out = `ว่าง ๆ ชอบ${Social.profile(n).hobby}`; break;
      case 'food': { const f = favOf(n.name); out = h >= 1 ? `ของโปรดฉันคือ${ITEMS[f] ? ITEMS[f].n : 'ผลไม้สด'}!` : 'ชอบหลายอย่างเลย ไว้สนิทกันกว่านี้จะบอก'; break; }
      case 'weather': { const W = WEATHER[S.weather.type], N = WEATHER[S.weather.next]; out = `วันนี้${W.n} พรุ่งนี้ว่ากันว่าจะ${N.n}`; break; }
      case 'farm': out = U.pick([`ได้ยินว่าฟาร์มเธอมีสัตว์ ${S.animals.length} ตัวแล้วนะ`, `ช่วงนี้${ITEMS[hotCrops()[0]].n}ราคาดีมาก`, 'ฟาร์มเธอสวยขึ้นทุกวันเลย']); break;
      case 'news': out = U.pick(TIPS.concat(SMALLTALK)); break;
      case 'love':
        if (mine) out = U.pick(CHAT_LINES.loveYes), taste = Math.max(taste, 2);
        else if (r.partner) { out = 'เธอมีแฟนแล้วไม่ใช่เหรอ... อย่ามาหลอกกันนะ'; taste = -1; Social2.flirtOther(n.name); }
        else if (!Social.single(n.name)) { out = 'ขอบใจนะ แต่ฉันคิดกับเธอแค่เพื่อนจ้า'; taste = 0; }
        else out = U.pick(CHAT_LINES.love), taste += h >= 6 ? 1 : 0;
        break;
      case 'invite':
        if (mine) { out = U.pick(CHAT_LINES.inviteYes); setTimeout(() => People.dateUI(n), 900); }
        else out = h >= 6 ? 'ได้เลย! ไว้ส่งข้อความนัดกันนะ' : U.pick(CHAT_LINES.invite);
        break;
      case 'insult': n.annoy = (n.annoy || 0) + 1; out = U.pick(CHAT_LINES.insult); break;
      case 'sorry': if (n.annoy) n.annoy = Math.max(0, n.annoy - 1); out = U.pick(CHAT_LINES.sorry); if (mine && Social2.st().sulk) { out = 'ขอโทษอย่างเดียวไม่พอ... เอาของขวัญมาง้อด้วยสิ'; } break;
      default: out = U.pick(CHAT_LINES[k] || CHAT_LINES.unknown).replace('{me}', me);
    }
    // closeness changes: liked topics help, disliked hurt; typed chat can add at most +0.6 per day
    const gain = taste > 0 ? 0.12 * taste : taste < 0 ? 0.2 * taste : k === 'unknown' ? 0 : 0.04;
    if (gain > 0 && td.gain < 0.6 && wl.w >= 20) { const g = Math.min(gain, 0.6 - td.gain); td.gain += g; Friends.add(n.name, g); }
    else if (gain < 0) S.friends[n.name] = Math.max(0, h + gain);
    if (taste >= 2) out += ' 😊'; else if (taste < 0 && k !== 'insult') out += ' 😕';
    Friends.talk(n); n.wave = 1;
    return out;
  },
  send() {
    const n = UI.talkTo, el = $('npcSay'); if (!n || !el) return; const t = el.value.trim(); if (!t) return;
    const lg = this.log[n.name] = this.log[n.name] || [];
    lg.push({ me: 1, t }); lg.push({ t: this.reply(n, t) }); if (lg.length > 30) lg.splice(0, lg.length - 30);
    Sfx.tone(700, 0.06, 'sine', 0.04);
    UI.cur.after = () => { const i = $('npcSay'); if (i) i.focus(); };
  },
};
UI.H.npcsay = () => Chat.send();
SYSTEMS.push(
  { i: '⌨️', n: 'พิมพ์คุยกับชาวบ้าน', what: 'พิมพ์อะไรก็ได้ในหน้าคุย ชาวบ้านจะตอบตามเรื่องที่ถาม นิสัย และอารมณ์', why: 'คุยถูกนิสัยได้หัวใจเพิ่ม (วันละไม่เกิน +0.6) ด่าหรือพูดไม่ถูกใจหัวใจลด' },
  { i: '😊', n: 'ความอยากคุย', what: 'แต่ละคนอยากคุยไม่เท่ากัน ขึ้นกับความสนิท นิสัย เวลา งานที่ทำ และการคุยซ้ำ', why: 'ทำให้ชาวบ้านมีชีวิต ต้องเลือกเวลาและวิธีคุยให้เหมาะ' },
  { i: '🌾', n: 'นาข้าว & โรงงานแปรรูป', what: 'ไถ ดำนา เกี่ยว สีข้าว และแปรรูปน้ำพริก ซอส ข้าวตัง มะม่วงอบ', why: 'สินค้าราคาสูง ใช้ส่งสัญญาและทำอาหาร' },
  { i: '🏡', n: 'เรือนกระจก สวนดอกไม้ บ่อปลา', what: 'ปลูกได้ทุกฤดู ปลูกดอกไม้ และเลี้ยงปลานิลในบ่อ', why: 'รายได้เสริมที่ไม่ขึ้นกับฤดูและฝน' },
  { i: '👷', n: 'คนงาน สัญญา ตลาดนัด', what: 'จ้างคนงานดูแลไร่ รับสัญญาส่งผัก และวางของขายตลาดนัดเสาร์-อาทิตย์ (แอปธุรกิจฟาร์ม)', why: 'ขยายฟาร์มให้ใหญ่โดยไม่ต้องทำเองทุกอย่าง' },
  { i: '🍗', n: 'ความหิว กระหาย อารมณ์ ป่วย', what: 'ต้องกินดื่ม พักผ่อน ถ้าละเลยจะป่วย ไปโรงพยาบาลหรือกินยา', why: 'เพิ่มความสมจริง ดูแลตัวเองแล้วทำงานได้มากขึ้น' },
  { i: '🧾', n: 'ค่าน้ำค่าไฟ & งานพิเศษ', what: 'บิลรายเดือน (ออกวันที่ 1) งานพิเศษวันละ 2 งาน วาดรูป เล่นดนตรีเปิดหมวก', why: 'มีรายจ่ายจริง และมีทางหาเงินอื่นนอกจากฟาร์ม' },
  { i: '🛕', n: 'วัด โรงเรียน โรงพยาบาล', what: 'ทำบุญ งานวัด รับเลี้ยงเด็ก เรียนภาคค่ำ ลูกไปโรงเรียน รักษาโรค', why: 'ชีวิตในหมู่บ้านครบวงจร และได้ความสามารถถาวร' },
  { i: '⛽', n: 'น้ำมัน ซ่อมรถ ใบขับขี่ ใบสั่ง', what: 'รถใช้น้ำมันและเสื่อม ต้องมีใบขับขี่ ขับเร็วในหมู่บ้านโดนปรับ', why: 'การขับรถสมจริงและมีกฎจราจร' },
  { i: '🏝️', n: 'ดอยสุขใจ & เกาะสุขใจ', what: 'เดินทางด้วยแท็กซี่หรือเรือ ชมวิว เก็บสตรอว์เบอร์รี ดำน้ำหาไข่มุก', why: 'สถานที่ท่องเที่ยวพักผ่อน เพิ่มอารมณ์ดี' },
  { i: '🎯', n: 'ภารกิจ ความสำเร็จ อันดับออนไลน์', what: 'ภารกิจรายสัปดาห์ 4 อย่าง ความสำเร็จ 50 รายการ และอันดับเทียบผู้เล่นอื่น', why: 'มีเป้าหมายให้ทำตลอด และแข่งกับเพื่อนได้' },
  { i: '🌊', n: 'น้ำท่วม & ช่วยภัยพิบัติ', what: 'ฤดูฝนมีน้ำท่วม เตรียมกระสอบทรายไว้ หลังน้ำท่วมช่วยชาวบ้านที่ศาลา', why: 'ต้องวางแผนรับมือ และได้ความสนิทกับทั้งหมู่บ้าน' },
  { i: '💾', n: 'เซฟ 3 ช่อง ตั้งปุ่ม จอยเกม สอนเล่น', what: 'เลือกช่องเซฟที่หน้าแรก ตั้งปุ่มเองในตั้งค่า ต่อจอยเกมได้ และมีสอนเล่นทีละขั้น', why: 'เล่นหลายคนในเครื่องเดียว และเล่นง่ายขึ้น' }
);
document.addEventListener('keydown', e => { if (e.target && e.target.id === 'npcSay' && e.key === 'Enter') { e.preventDefault(); Chat.send(); UI.renderBody(); } });
