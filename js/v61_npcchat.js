'use strict';
// v61_npcchat.js: NPC chat, second pass (on top of the v39 engine)
//  1) a bigger, easier-to-read chat window: large bubbles, who is talking, typing dots, "read" marks, always scrolled to the newest line
//  2) a big pool of tap-to-say choices in 8 topic tabs (about 170 lines) plus a "suggested" tab that follows the conversation and never repeats itself
//  3) more life-like talk: replies arrive as one or two short bubbles, the NPC greets you first, asks something if you go quiet,
//     remembers what you told it, and answers a message it does not understand with a reaction instead of a canned "I don't get it"
V23.add('v61_npcchat', () => {
  const C = window.Chat39; if (!C || !C.respond || typeof Chat === 'undefined') return;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const safe = (f, d) => { try { const v = f(); return v == null ? d : v; } catch (e) { return d; } };
  const $ = id => document.getElementById(id);
  const short = name => String(name).replace(/\s*[(（].*$/, '');
  const pick = a => a[Math.floor(Math.random() * a.length)];

  // a few more things people say that the v39 engine had no answer for (the tap-to-say lines use them)
  { const D = window.Chat39NLU && window.Chat39NLU.D;
    if (D) {
      D('spicy_q', 'food', ['กินเผ็ด|ชอบเผ็ด|เผ็ดได้ไหม|เผ็ดมาก|พริก'], x => ['กินเผ็ดได้นะ{e} แต่ไม่ไหวถ้าเผ็ดมากเกิน', 'ชอบเผ็ดกลาง ๆ{e} เผ็ดมากน้ำตาไหลเลย 555', 'ได้นิดหน่อย{e} ส้มตำต้องใส่พริกสองเม็ดพอ'], { ask: 'food' });
      D('work_tip', 'job', ['มีงานแนะนำ|งานอะไรดี|มีงานให้ทำ|งานไหนดี|อยากได้งาน|มีงานไหม'], x => ['ลองเปิดแอปงานในมือถือดูนะ{e} มีทั้งงานประจำและงานพิเศษ แต่บางงานต้องมีเอกสารด้วย', 'ดูกระดานหางานพิเศษที่ตลาดก็ได้{e} หรือจะสมัครงานประจำที่เครื่องสแกนหน้าที่ทำงานเลยก็ได้'], { ask: 'job' });
      D('income_ok', 'job', ['รายได้พอ|เงินพอใช้|พอใช้ไหม|พอกินพอใช้|เงินพอไหม|รายได้เพียงพอ'], x => ['พอกินพอใช้{e} ไม่ลำบากมาก แต่ก็ไม่เหลือเก็บเยอะ', 'ก็พอไหวนะ{e} ต้องประหยัดหน่อย', 'ช่วงนี้โอเคอยู่{e} มีเก็บบ้างนิดหน่อย'], { ask: 'money' });
      D('be_friend', 'love', ['เป็นเพื่อนกัน|ขอเป็นเพื่อน|เป็นเพื่อนนะ|เพื่อนกันนะ|คบเป็นเพื่อน|มาเป็นเพื่อน'], x => x.L >= 3 ? ['เราก็เป็นเพื่อนกันอยู่แล้วนี่นา{e} 😊', 'แน่นอน{e} เพื่อนกันตลอดไปเลย'] : ['ได้สิ{e} ยินดีเลย 😊 ค่อย ๆ รู้จักกันนะ', 'ดีเลย{e} จะได้มีเพื่อนคุยเพิ่ม'], { hearts: 0.05 });
    } }

  // ===================== 2) the choices: [text, closeness needed (0-8), tab] =====================
  const TABS = [['rec', '✨', 'แนะนำ'], ['hi', '💬', 'ทักทาย'], ['food', '🍜', 'กิน'], ['farm', '🌾', 'งาน/เงิน'], ['town', '🏘️', 'หมู่บ้าน'], ['fun', '🎭', 'สนุก'], ['about', '👤', 'ถามเขา'], ['close', '💕', 'สนิทกัน']];
  const POOL = [
    // --- hi: greetings and how are you ---
    ['สวัสดี', 0, 'hi'], ['สวัสดีตอนเช้า', 0, 'hi'], ['ทำอะไรอยู่', 0, 'hi'], ['วันนี้เป็นไงบ้าง', 0, 'hi'], ['สบายดีไหม', 0, 'hi'], ['เหนื่อยไหม', 0, 'hi'],
    ['ช่วงนี้เป็นยังไงบ้าง', 0, 'hi'], ['วันนี้มีแผนอะไรไหม', 0, 'hi'], ['พรุ่งนี้มีแผนอะไรไหม', 0, 'hi'], ['ง่วงไหม', 0, 'hi'], ['ว่างไหม', 0, 'hi'],
    ['ไปไหนมา', 0, 'hi'], ['กำลังจะไปไหน', 0, 'hi'], ['เจอกันอีกแล้วนะ', 0, 'hi'], ['ไปก่อนนะ', 0, 'hi'], ['เจอกันพรุ่งนี้นะ', 0, 'hi'], ['ฝันดีนะ', 0, 'hi'], ['ฉันเหนื่อยจัง', 0, 'hi'], ['ฉันเบื่อจัง', 0, 'hi'],
    ['ฉันหิวแล้ว', 0, 'hi'], ['ฉันมีความสุขจัง', 0, 'hi'],
    // --- food ---
    ['กินข้าวหรือยัง', 0, 'food'], ['วันนี้กินอะไรดี', 0, 'food'], ['ชอบกินอะไร', 0, 'food'], ['เมนูโปรดคืออะไร', 0, 'food'], ['ชอบกินอะไรเป็นพิเศษ', 0, 'food'], ['ชอบดื่มอะไร', 0, 'food'], ['ชอบกาแฟไหม', 0, 'food'],
    ['ทำอาหารเป็นไหม', 0, 'food'], ['ส้มตำอร่อยไหม', 0, 'food'], ['กินเผ็ดได้ไหม', 0, 'food'], ['ชอบทุเรียนไหม', 0, 'food'], ['กินอะไรเป็นมื้อเช้า', 0, 'food'],
    ['ร้านไหนอร่อย', 0, 'food'], ['ไปกินข้าวกัน', 3, 'food'], ['เลี้ยงข้าวหน่อยสิ', 3, 'food'], ['แบ่งกันกินนะ', 2, 'food'],
    // --- farm / work / money ---
    ['ช่วงนี้ปลูกอะไรดี', 0, 'farm'], ['ผักอะไรขายดีตอนนี้', 0, 'farm'], ['เลี้ยงสัตว์ยากไหม', 0, 'farm'], ['ตกปลาที่ไหนดี', 0, 'farm'], ['ขุดเหมืองเป็นไหม', 0, 'farm'], ['ปลูกผักยากไหม', 0, 'farm'],
    ['งานนี้เหนื่อยไหม', 0, 'farm'], ['มีงานแนะนำไหม', 0, 'farm'], ['รายได้พอใช้ไหม', 0, 'farm'], ['เก็บเงินยังไงดี', 0, 'farm'], ['เศรษฐกิจดีไหม', 0, 'farm'], ['หุ้นขึ้นไหม', 0, 'farm'],
    ['ซื้อรถดีไหม', 0, 'farm'], ['ต้องเสียภาษีไหม', 0, 'farm'], ['ช่วยแนะนำหน่อย', 0, 'farm'], ['ขอคำปรึกษาหน่อย', 0, 'farm'], ['ช่วยหน่อยได้ไหม', 2, 'farm'], ['ขอยืมเงินหน่อย', 7, 'farm'],
    // --- town / news / weather ---
    ['มีข่าวอะไรไหม', 0, 'town'], ['ในหมู่บ้านมีอะไรใหม่ไหม', 0, 'town'], ['เล่าเรื่องให้ฟังหน่อย', 0, 'town'], ['อากาศเป็นไงบ้าง', 0, 'town'], ['พรุ่งนี้ฝนตกไหม', 0, 'town'], ['วันนี้วันอะไร', 0, 'town'], ['ตอนนี้กี่โมงแล้ว', 0, 'town'],
    ['วันนี้วันหยุดไหม', 0, 'town'], ['ฤดูโปรดคือฤดูอะไร', 0, 'town'], ['ไปโรงพยาบาลยังไง', 0, 'town'], ['ตลาดอยู่ที่ไหน', 0, 'town'], ['ธนาคารอยู่ที่ไหน', 0, 'town'], ['ไปวัดยังไง', 0, 'town'], ['ไปเมืองไกลยังไง', 0, 'town'],
    ['ในหมู่บ้านใครใจดีที่สุด', 0, 'town'], ['หมู่บ้านนี้น่าอยู่ไหม', 0, 'town'], ['ฝนตกหนักเนอะ', 0, 'town'],
    // --- fun ---
    ['เล่ามุกตลกหน่อย', 0, 'fun'], ['ทายปัญหาหน่อย', 0, 'fun'], ['ชอบฟังเพลงอะไร', 0, 'fun'], ['ชอบดูหนังแนวไหน', 0, 'fun'], ['ชอบสัตว์อะไร', 0, 'fun'], ['ชอบสีอะไร', 0, 'fun'], ['เล่นกีฬาอะไรบ้าง', 0, 'fun'],
    ['ว่าง ๆ ชอบทำอะไร', 0, 'fun'], ['มีความฝันไหม', 0, 'fun'], ['กลัวอะไรที่สุด', 0, 'fun'], ['ไม่ชอบอะไร', 0, 'fun'], ['มีความลับอะไรไหม', 1, 'fun'], ['ดูดวงให้หน่อย', 0, 'fun'], ['ขอบคุณนะ', 0, 'fun'], ['ขอโทษนะ', 0, 'fun'],
    ['สู้ ๆ นะ', 0, 'fun'], ['เก่งจังเลย', 0, 'fun'], ['555 ตลกมาก', 0, 'fun'], ['ว้าว', 0, 'fun'],
    // --- about them ---
    ['ชื่ออะไรเหรอ', 0, 'about'], ['อายุเท่าไหร่', 0, 'about'], ['ทำงานอะไร', 0, 'about'], ['บ้านอยู่ที่ไหน', 0, 'about'], ['เกิดวันไหน', 0, 'about'], ['ราศีอะไร', 0, 'about'], ['มีพี่น้องไหม', 0, 'about'], ['มีลูกไหม', 0, 'about'],
    ['เลี้ยงสัตว์ไหม', 0, 'about'], ['เรียนจบอะไร', 0, 'about'], ['พูดภาษาอะไรได้บ้าง', 0, 'about'], ['สูงเท่าไหร่', 0, 'about'], ['เป็นคนที่ไหน', 0, 'about'], ['ฉันชื่อสมใจนะ', 0, 'about'], ['ฉันเป็นชาวไร่', 0, 'about'],
    ['ฉันชอบกินส้มตำ', 0, 'about'], ['ฉันชอบปลูกผัก', 0, 'about'], ['ฉันอายุ 25', 0, 'about'],
    // --- close ---
    ['มีแฟนหรือยัง', 2, 'close'], ['ชอบคนแบบไหน', 2, 'close'], ['ชมว่าวันนี้น่ารักจัง', 3, 'close'], ['อยากรู้จักให้มากกว่านี้', 2, 'close'], ['เป็นเพื่อนกันนะ', 1, 'close'], ['ไปเดินเล่นกัน', 4, 'close'], ['ไปดูหนังกัน', 5, 'close'],
    ['ไปเที่ยวกัน', 6, 'close'], ['ไปบ้านฉันไหม', 5, 'close'], ['คิดถึงนะ', 4, 'close'], ['ชอบฉันไหม', 5, 'close'], ['ไปเดทกันนะ', 6, 'close'], ['ขอกอดหน่อย', 7, 'close'], ['เป็นแฟนกันนะ', 7, 'close'], ['แต่งงานกันไหม', 9, 'close'],
  ];
  // after talking about X, the natural next things to say
  const FOLLOW = {
    greet: ['วันนี้เป็นไงบ้าง', 'ทำอะไรอยู่', 'กินข้าวหรือยัง'], howru: ['ช่วงนี้เป็นยังไงบ้าง', 'วันนี้มีแผนอะไรไหม', 'เหนื่อยไหม'], doing: ['งานนี้เหนื่อยไหม', 'ว่าง ๆ ชอบทำอะไร', 'ไปกินข้าวกัน'],
    eaten: ['วันนี้กินอะไรดี', 'ชอบกินอะไร', 'ร้านไหนอร่อย'], fav_food: ['ทำอาหารเป็นไหม', 'ร้านไหนอร่อย', 'ไปกินข้าวกัน', 'กินเผ็ดได้ไหม'], food: ['ชอบกินอะไร', 'ชอบดื่มอะไร', 'ร้านไหนอร่อย'], what_eat: ['ไปกินข้าวกัน', 'ทำอาหารเป็นไหม'],
    weather: ['พรุ่งนี้ฝนตกไหม', 'ฤดูโปรดคือฤดูอะไร', 'วันนี้มีแผนอะไรไหม'], news_q: ['ในหมู่บ้านใครใจดีที่สุด', 'เล่าเรื่องให้ฟังหน่อย', 'เศรษฐกิจดีไหม'], job_q: ['งานนี้เหนื่อยไหม', 'รายได้พอใช้ไหม', 'มีงานแนะนำไหม'],
    hobby_q: ['ชอบฟังเพลงอะไร', 'เล่นกีฬาอะไรบ้าง', 'มีความฝันไหม'], dream_q: ['กลัวอะไรที่สุด', 'ไม่ชอบอะไร', 'สู้ ๆ นะ'], name_q: ['อายุเท่าไหร่', 'ทำงานอะไร', 'บ้านอยู่ที่ไหน'], age_q: ['เกิดวันไหน', 'ราศีอะไร', 'มีพี่น้องไหม'],
    relstatus: ['ชอบคนแบบไหน', 'ชอบฉันไหม', 'เป็นเพื่อนกันนะ'], joke_req: ['555 ตลกมาก', 'ทายปัญหาหน่อย', 'เล่ามุกตลกหน่อย'], riddle_req: ['ไม่รู้ บอกเลย', 'เล่ามุกตลกหน่อย'], crops_q: ['ผักอะไรขายดีตอนนี้', 'เก็บเงินยังไงดี', 'ตลาดอยู่ที่ไหน'],
    money_talk: ['เก็บเงินยังไงดี', 'หุ้นขึ้นไหม', 'ต้องเสียภาษีไหม'], thanks: ['ไม่เป็นไรนะ', 'ไปกินข้าวกัน', 'เล่ามุกตลกหน่อย'], compliment_look: ['ชอบฉันไหม', 'ไปเดินเล่นกัน', 'คิดถึงนะ'], miss_you: ['ไปเที่ยวกัน', 'ไปเดทกันนะ', 'ไปกินข้าวกัน'],
  };
  const TIMEQ = { morning: ['สวัสดีตอนเช้า', 'วันนี้มีแผนอะไรไหม', 'กินอะไรเป็นมื้อเช้า'], noon: ['กินข้าวหรือยัง', 'วันนี้กินอะไรดี'], afternoon: ['ง่วงไหม', 'วันนี้เป็นไงบ้าง', 'อากาศเป็นไงบ้าง'], evening: ['วันนี้เหนื่อยไหม', 'เย็นนี้กินอะไรดี', 'พรุ่งนี้ทำอะไร'], night: ['ง่วงไหม', 'ฝันดีนะ', 'ไปก่อนนะ'] };
  // what to tap when they ask you something back
  const ANS = {
    day: ['วันนี้ทำฟาร์มมา', 'ไปตลาดมา', 'อยู่บ้านพักผ่อน'], food: ['ฉันชอบกินส้มตำ', 'ฉันชอบข้าวมันไก่', 'ฉันกินได้ทุกอย่าง'], farm: ['ฟาร์มไปได้สวยเลย', 'ช่วงนี้เหนื่อยหน่อย', 'กำลังปลูกผักอยู่'],
    hobby: ['ฉันชอบปลูกผัก', 'ฉันชอบตกปลา', 'ฉันชอบนอนพักผ่อน'], dream: ['อยากมีฟาร์มใหญ่ ๆ', 'อยากมีครอบครัวอบอุ่น', 'ยังไม่รู้เลย'], weather: ['ชอบอากาศแบบนี้', 'ร้อนไปหน่อย', 'ชอบหน้าฝนมากกว่า'],
    like: ['ชอบมากเลย', 'ก็ธรรมดา ๆ'], job: ['ทำฟาร์มอยู่', 'ยังหางานอยู่', 'ทำหลายอย่างเลย'], howru: ['สบายดี', 'เหนื่อยนิดหน่อย', 'ดีมากเลย'], eaten: ['กินแล้ว', 'ยังเลย', 'กำลังจะกิน'],
    doing: ['ทำฟาร์มอยู่', 'เดินเล่นอยู่', 'ว่างอยู่เลย'], age: ['ฉันอายุ 25', 'ไม่บอกหรอก'], name: ['ฉันชื่อสมใจ'], story: ['มีสิ เคยตกปลาได้ตัวใหญ่มาก', 'ไม่มีเลย'], plans: ['ยังไม่มีเลย', 'จะไปตลาด'], going: ['ไปตลาด', 'กลับบ้าน'], money: ['เก็บเงินในธนาคาร', 'ฉันก็พยายามประหยัด'], relstatus: ['ฉันยังโสดอยู่', 'ฉันมีแฟนแล้ว'], food_: [],
  };
  // natural replies to the canned answers above (the engine would only echo them back)
  const ANSR = {
    'วันนี้ทำฟาร์มมา': ['ขยันจังเลย{e} ผักโตดีไหม', 'ทำฟาร์มทั้งวันเลยเหรอ{e} เหนื่อยแย่ พักบ้างนะ'], 'ไปตลาดมา': ['ได้ของดี ๆ มาบ้างไหม{e}', 'ตลาดช่วงนี้คนเยอะไหม{e} ไว้ไปด้วยกันนะ'], 'อยู่บ้านพักผ่อน': ['ดีเลย{e} บางวันก็ต้องพักบ้าง', 'สบายจังเลย{e} อิจฉานะเนี่ย'],
    'ฉันชอบกินส้มตำ': ['ส้มตำเหรอ{e} เผ็ดแค่ไหนล่ะ ชอบใส่ปูหรือเปล่า', 'ถูกใจเลย{e} ส้มตำนี่ของดีจริง ๆ'], 'ฉันชอบข้าวมันไก่': ['ข้าวมันไก่ก็อร่อยนะ{e} ชอบน้ำจิ้มเผ็ด ๆ ไหม', 'เมนูนี้ไม่มีเบื่อเลย{e} กินได้ทุกมื้อ'], 'ฉันกินได้ทุกอย่าง': ['ดีจังเลย{e} กินง่ายแบบนี้ไม่ต้องกลัวหิว', 'งั้นไว้ไปกินข้าวด้วยกันนะ{e} ไม่ต้องเลือกร้านยาก'],
    'ฟาร์มไปได้สวยเลย': ['เก่งจัง{e} ขยันแบบนี้ต้องรวยแน่', 'ดีใจด้วยนะ{e} ขอเคล็ดลับบ้างสิ'], 'ช่วงนี้เหนื่อยหน่อย': ['สู้ ๆ นะ{e} อย่าลืมพักผ่อนและกินข้าวให้ตรงเวลา', 'เข้าใจเลย{e} งานไร่มันหนัก พักสักหน่อยก็ได้นะ'], 'กำลังปลูกผักอยู่': ['ผักอะไรเหรอ{e} ช่วงนี้ราคาดีนะ', 'ดีเลย{e} ผักสดจากไร่อร่อยที่สุด'],
    'ฉันชอบปลูกผัก': ['เหมาะกับคนใจเย็นเลย{e} ได้เห็นผักโตทุกวันก็มีความสุข', 'ปลูกผักนี่ดีนะ{e} ได้ทั้งของกินและสบายใจ'], 'ฉันชอบตกปลา': ['ตกปลาต้องใจเย็นนะ{e} ไว้ไปตกด้วยกันไหม', 'ชอบเหมือนกัน{e} ที่ริมทะเลปลาเยอะนะ'], 'ฉันชอบนอนพักผ่อน': ['555 ใครจะไม่ชอบล่ะ{e}', 'ดีนะ{e} ร่างกายต้องการพักบ้าง'],
    'อยากมีฟาร์มใหญ่ ๆ': ['ความฝันดีเลย{e} ค่อย ๆ ขยับขยายไปนะ สู้ ๆ', 'อยากเห็นฟาร์มใหญ่ ๆ แล้วเหมือนกัน{e} เอาใจช่วยนะ'], 'อยากมีครอบครัวอบอุ่น': ['ความฝันน่ารักจัง{e} สักวันต้องได้แน่', 'ดีนะ{e} ครอบครัวคือสิ่งสำคัญที่สุด'], 'ยังไม่รู้เลย': ['ไม่เป็นไร{e} ค่อย ๆ คิดไปก็ได้', 'ไม่ต้องรีบรู้หรอก{e} ใช้ชีวิตไปก่อน'],
    'ชอบอากาศแบบนี้': ['เหมือนกันเลย{e} อากาศแบบนี้ทำงานสบาย', 'ใช่ไหมล่ะ{e} เดินเล่นก็สบายด้วย'], 'ร้อนไปหน่อย': ['ใช่เลย{e} ดื่มน้ำเยอะ ๆ นะ', 'จริง{e} หาที่ร่มพักบ้างนะ'], 'ชอบหน้าฝนมากกว่า': ['หน้าฝนก็ดีนะ{e} ผักงามด้วย แต่ถนนเฉอะแฉะ', 'เหมือนกัน{e} ฟังเสียงฝนแล้วหลับสบาย'],
    'ชอบมากเลย': ['ดีจังเลย{e} ชอบอะไรแล้วมีความสุขก็ดีแล้ว'], 'ก็ธรรมดา ๆ': ['อืม ไม่ได้ชอบมากเหรอ{e} ไม่เป็นไรหรอก'],
    'ทำฟาร์มอยู่': ['เก๋จัง{e} งานฟาร์มเหนื่อยแต่ภูมิใจเนอะ', 'ชีวิตชาวไร่เนอะ{e} ตื่นเช้าหน่อยแต่สบายใจ'], 'ยังหางานอยู่': ['ลองดูแอปงานในมือถือนะ{e} หรือสมัครงานประจำที่เครื่องสแกนหน้าที่ทำงานก็ได้'], 'ทำหลายอย่างเลย': ['ขยันจัง{e} ทำหลายอย่างก็ได้เรียนรู้เยอะ'],
    'สบายดี': ['ดีใจจัง{e} สบายดีก็ดีแล้ว', 'ดีแล้ว{e} เราก็สบายดีเหมือนกัน'], 'เหนื่อยนิดหน่อย': ['พักบ้างนะ{e} กินข้าวหรือยัง', 'สู้ ๆ นะ{e} เดี๋ยวก็ดีขึ้น'], 'ดีมากเลย': ['ดีใจด้วยนะ{e} มีอะไรดี ๆ เหรอ', 'เห็นแล้วพลอยสดใสไปด้วยเลย{e}'],
    'กินแล้ว': ['ดีแล้ว{e} จะได้มีแรง', 'อิ่มก็ดีแล้ว{e}'], 'ยังเลย': ['ไปกินข้าวสิ{e} ท้องว่างไม่ดีนะ', 'รีบไปกินนะ{e} เดี๋ยวหิวแย่'], 'กำลังจะกิน': ['งั้นไปกินเลย{e} กินให้อร่อยนะ', 'ดีเลย{e} ทานให้อร่อยนะ'],
    'เดินเล่นอยู่': ['สบายจัง{e} อากาศแบบนี้เหมาะเดินเล่น'], 'ว่างอยู่เลย': ['งั้นคุยกันเพลิน ๆ ก็ได้{e}'], 'ไม่บอกหรอก': ['โอเค ไม่บอกก็ได้{e} ความลับเนอะ 555'],
    'มีสิ เคยตกปลาได้ตัวใหญ่มาก': ['โห ตัวใหญ่แค่ไหนเหรอ{e} เล่าต่อสิ น่าสนุกจัง'], 'ไม่มีเลย': ['ไม่เป็นไร{e} ไว้ค่อยมีเรื่องเล่าก็ได้'], 'ยังไม่มีเลย': ['ไม่เป็นไร{e} บางวันก็ปล่อยตามสบายบ้าง'], 'จะไปตลาด': ['ไปตลาดเหรอ{e} ฝากซื้อของสดหน่อยไหม 555'],
    'ไปตลาด': ['ไปดี ๆ นะ{e} ซื้อของสดมาเยอะ ๆ'], 'กลับบ้าน': ['ไปดี ๆ นะ{e} พักผ่อนเยอะ ๆ'], 'เก็บเงินในธนาคาร': ['ดีเลย{e} ปลอดภัยด้วย ได้ดอกเบี้ยอีก'], 'ฉันก็พยายามประหยัด': ['ดีมากเลย{e} ค่อย ๆ เก็บไป'],
    'ฉันยังโสดอยู่': ['งั้นเหรอ{e} ค่อย ๆ หาคนที่ใช่ไปนะ'], 'ฉันมีแฟนแล้ว': ['ดีใจด้วยนะ{e} ดูแลกันดี ๆ นะ'],
  };
  const used = {};           // name -> recently used choices (not saved)
  const curTab = {};         // mode -> tab id
  let draft = '';
  const levelOf = n => { const r = safe(() => Social.st(), {}); return r.partner === n.name ? 9 : Friends.get(n.name); };
  const timeOf = () => { const hr = Math.floor(S.time / 60) % 24; return hr >= 5 && hr < 11 ? 'morning' : hr < 14 ? 'noon' : hr < 18 ? 'afternoon' : hr < 22 ? 'evening' : 'night'; };
  const okChip = (t, L) => { const c = POOL.find(p => p[0] === t); return !c || c[1] <= L; };
  function recommend(n) {
    const m = C.mem(n.name), L = levelOf(n), u = used[n.name] || (used[n.name] = []), out = [];
    const add = t => { if (t && !out.includes(t) && okChip(t, L) && (!u.includes(t) || out.length >= 6)) out.push(t); };
    if (m.pend) { const k = m.pend.k; if (['eatInvite', 'inviteWhat', 'breakup', 'comfort', 'helpAsk'].includes(k)) { add('ได้เลย'); add('ไว้ก่อนนะ'); } else if (k === 'askYou') { for (const t of (ANS[m.pend.id] || [])) add(t); add('แล้วเธอล่ะ'); add('ไม่รู้สิ'); } else if (k === 'riddle') add('ไม่รู้ บอกเลย'); }
    const last = m.last && m.last.id, topic = m.topic;
    for (const k of [last, topic]) for (const t of (FOLLOW[k] || [])) add(t);
    if (!out.length || (m.t || 0) < 2) for (const t of TIMEQ[timeOf()]) add(t);
    const rest = POOL.filter(p => p[1] <= L && !u.includes(p[0]) && !out.includes(p[0])), seed = (m.t || 0) * 7 + (S.day || 0);
    for (let i = 0; i < rest.length && out.length < 6; i++) add(rest[(seed + i * 13) % rest.length][0]);
    return out.slice(0, 6);
  }
  const chipsOf = (n, tab) => {
    if (tab === 'rec') return recommend(n);
    const L = levelOf(n), u = used[n.name] || [];
    return POOL.filter(p => p[2] === tab).map(p => ({ t: p[0], lock: p[1] > L, need: p[1], used: u.includes(p[0]) }));
  };
  // keeps the old API for anything else that asks for "the chips"
  C.chipsFor = n => recommend(n);

  // ===================== 1) the window =====================
  const avatar = n => { const P = safe(() => People.prof(n.name), { fem: true, age: 30 }); return P.age >= 60 ? (P.fem ? '👵' : '👴') : P.age < 16 ? (P.fem ? '👧' : '👦') : P.fem ? '👩' : '👨'; };
  C.panel = function (n, mode) {
    const phone = mode === 'phone', tab = curTab[mode] || 'rec', L = levelOf(n);
    const wl = safe(() => Chat.willing(n), { face: '', why: [] });
    const log = C.bubbles(n) || '<p class="empty39">ยังไม่ได้คุยกันเลย ลองกดข้อความด้านล่าง หรือพิมพ์ทักทายดูสิ</p>';
    const tabs = TABS.map(([id, ic, tx]) => `<button class="tab61 ${tab === id ? 'on' : ''}" data-a="v61tab" data-v="${id}" data-m="${mode}">${ic} ${tx}</button>`).join('');
    const chips = tab === 'rec'
      ? recommend(n).map(t => ({ t }))
      : chipsOf(n, tab);
    const act = phone ? 'v39pchip' : 'v39chip';
    const chipHtml = chips.map(c => c.lock ? `<button class="btn ghost lock61" disabled title="สนิทกันกว่านี้ก่อน">🔒 ${esc(c.t)}</button>` : `<button class="btn ghost ${c.used ? 'used61' : ''}" data-a="${act}" data-v="${esc(c.t)}">${esc(c.t)}</button>`).join('');
    const sendA = phone ? 'v39psend' : 'npcsay', inId = phone ? 'v39pin' : 'npcSay';
    return `<div class="card chatbox chat39 chat61"><div class="cb">
      <div class="head61"><span class="av61">${avatar(n)}</span><div><b>${esc(short(n.name))}</b><small>${wl.face || ''}${wl.why && wl.why.length ? ' ' + esc(wl.why.join(' · ')) : ''}${n.doing ? ' · ' + esc(n.doing) : ''}</small></div></div>
      <div class="log39" id="log39">${log}</div>
      <div class="tabs61">${tabs}</div>
      <div class="chips39 ${tab === 'rec' ? '' : 'many61'}">${chipHtml}</div>
      <div class="row"><input id="${inId}" maxlength="120" placeholder="พิมพ์คุยกับ${esc(short(n.name))}..." value="${esc(draft)}" style="flex:1" autocomplete="off"><button class="btn" data-a="${sendA}">ส่ง</button></div></div></div>`;
  };
  const down = () => { const lg = $('log39'); if (!lg) return; lg.scrollTop = lg.scrollHeight; const c = lg.closest('.chat61'); if (c && c.scrollIntoView) c.scrollIntoView({ block: 'nearest' }); };
  UI.H.v61tab = d => {
    const i = $('npcSay') || $('v39pin'); draft = i ? i.value : ''; curTab[d.m || 'talk'] = d.v;
    if (UI.cur) UI.cur.after = () => { down(); draft = ''; };
  };
  // remember what was tapped so "suggested" moves on to fresh things, and keep the log scrolled to the newest line
  for (const [name, mode] of [['v39chip', 'talk'], ['v39pchip', 'phone']]) {
    const f = UI.H[name]; if (!f) continue;
    UI.H[name] = d => { const n = mode === 'phone' ? curThread() : UI.talkTo; if (n) { const u = used[n.name] || (used[n.name] = []); if (!u.includes(d.v)) u.push(d.v); if (u.length > 60) u.shift(); } return f(d); };
  }
  function curThread() { const nm = safe(() => (document.querySelector('.ph39 h5') || {}).textContent, ''); return nm ? G.npcs.find(q => nm.indexOf(short(q.name)) === 0) || { name: nm.split(' ')[0] } : null; }
  // every re-render of the chat ends at the newest message
  const _rb = UI.renderBody.bind(UI);
  UI.renderBody = function () { const r = _rb.apply(this, arguments); down(); return r; };

  if (typeof People !== 'undefined' && People.convHTML) { const _cv = People.convHTML.bind(People); People.convHTML = n => { const h = _cv(n); return h ? h.replace('class="card order"', 'class="card order conv61"') : h; }; }
  const css = document.createElement('style');
  css.textContent = `.chat61 .head61{display:flex;align-items:center;gap:10px;margin-bottom:6px}.chat61 .av61{font-size:34px;line-height:1}.chat61 .head61 b{font-size:17px;display:block}.chat61 .head61 small{display:block;font-size:12px;opacity:.75;line-height:1.3}
.chat61 .log39{height:clamp(170px,27vh,340px);max-height:none;gap:8px;padding:8px 6px;background:rgba(0,0,0,.16);border-radius:12px;scroll-behavior:smooth}
.chat61 .b39{max-width:88%;padding:9px 13px;font-size:17px;line-height:1.45;border-radius:18px}.chat61 .b39 small{font-size:11px;margin-top:3px}
.chat61 .b39.them{background:rgba(255,255,255,.2);border-bottom-left-radius:5px}.chat61 .b39.me{background:rgba(255,193,7,.34);border-bottom-right-radius:5px}
.chat61 .b39.typing i{font-style:normal;font-size:9px;margin-left:2px;animation:t61 1s infinite both}.chat61 .b39.typing i:nth-child(2){animation-delay:.2s}.chat61 .b39.typing i:nth-child(3){animation-delay:.4s}
@keyframes t61{0%,80%,100%{opacity:.2}40%{opacity:1}}
.chat61 .empty39{margin:auto;text-align:center;opacity:.7;font-size:15px;padding:0 14px}
.chat61 .tabs61{display:flex;gap:5px;overflow-x:auto;padding:6px 0 2px;-webkit-overflow-scrolling:touch}.chat61 .tab61{flex:0 0 auto;font:inherit;font-size:13px;padding:6px 11px;border-radius:15px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.07);color:inherit;cursor:pointer}.chat61 .tab61.on{background:rgba(255,193,7,.3);border-color:rgba(255,193,7,.7);font-weight:700}
.chat61 .chips39{gap:7px;margin:6px 0}.chat61 .chips39 button{font-size:14px;padding:7px 11px;border-radius:16px}.chat61 .chips39.many61{max-height:100px;overflow-y:auto;padding-right:2px}.chat61 .used61{opacity:.55}.chat61 .lock61{opacity:.4}
.chat61 input{font-size:16px;padding:9px 12px}
#modal .lead.say{font-size:17px;line-height:1.55;padding:13px 15px;background:rgba(255,255,255,.14);border-left:4px solid #ffc107;border-radius:14px;color:var(--ink)}
#modal .conv61 .cb h4,#modal .conv61 .cb p{font-size:17px;line-height:1.5}#modal .conv61 .choice{font-size:15px;padding:10px 13px;margin:3px 0}`;
  document.head.appendChild(css);

  // ===================== 3) life-like talk =====================
  // a long reply is sent as two short bubbles, like someone typing on a phone
  C.split = function (t) {
    t = String(t || ''); if (t.length < 46) return [t];
    const mid = t.length / 2; let best = -1, bd = 1e9;
    const re = /(?:(?:ครับ|ค่ะ|คะ|นะ|จ้ะ|จ้า|เลย|สิ|ล่ะ|เหรอ|ไหม|555|[!?]|[😀-🙏🥰🥹🤣🥲🫶])+)\s+(?=\S)/gu; let m;
    while ((m = re.exec(t))) { const at = m.index + m[0].length; const d = Math.abs(at - mid); if (at >= 14 && t.length - at >= 10 && d < bd) { bd = d; best = at; } }
    if (best < 0) return [t];
    const a = t.slice(0, best).trim(), b = t.slice(best).trim(); return a && b ? [a, b] : [t];
  };
  const STARTERS = [
    ['day', 'วันนี้เธอทำอะไรมาบ้างล่ะ'], ['food', 'ว่าแต่เธอชอบกินอะไรเป็นพิเศษเหรอ'], ['farm', 'ช่วงนี้ฟาร์มเธอเป็นยังไงบ้าง'], ['hobby', 'ว่าง ๆ เธอชอบทำอะไรเหรอ'], ['dream', 'เธอมีความฝันอะไรไหม'], ['weather', 'เธอชอบอากาศแบบนี้ไหม'],
  ];
  const OPEN = {
    morning: ['อรุณสวัสดิ์ ตื่นเช้าจังเลยนะ', 'อรุณสวัสดิ์ วันนี้อากาศดีเนอะ', 'เช้านี้เจอกันพอดีเลย'],
    noon: ['เที่ยงแล้ว กินข้าวหรือยัง', 'อ้าว มาพอดีเลย กำลังคิดว่าจะกินอะไรดี'],
    afternoon: ['สวัสดี บ่ายนี้ง่วงจังเลยนะ', 'อ้าว มาแล้วเหรอ ว่างอยู่พอดี'],
    evening: ['สวัสดี เย็นแล้ว วันนี้เหนื่อยไหม', 'อ้าว เจอกันอีกแล้ว ใกล้ค่ำแล้วนะ'],
    night: ['ดึกแล้วนะ ยังไม่นอนอีกเหรอ', 'ค่ำแล้ว มีอะไรหรือเปล่า'],
  };
  const OPEN_NEW = ['สวัสดี มีอะไรให้ช่วยไหม', 'สวัสดี เพิ่งเคยเห็นหน้าเลยนะ', 'สวัสดี ยินดีที่ได้รู้จัก'];
  const opened = {};
  const _talk = UI.talk.bind(UI);
  UI.talk = function (n) {
    try {
      if (n && !n.pseudo && opened[n.name] !== S.day + ':' + timeOf()) {
        const lg = C.logs()[n.name] = C.logs()[n.name] || [];
        const m = C.mem(n.name), x = C.ctxOf(n, m, {}), e = x.tok.e();
        const L = levelOf(n); let t = L < 1 && !n.keeper ? pick(OPEN_NEW) : n.keeper ? pick(['ยินดีต้อนรับ เชิญดูของได้เลย', 'มาแล้วเหรอ วันนี้มีของสดใหม่นะ']) : pick(OPEN[timeOf()]);
        if (L >= 4 && !n.keeper && Math.random() < 0.5) t = t.replace(/^สวัสดี\s*/, '');
        lg.push({ t: t + (/(?:ครับ|ค่ะ|นะ|เลย|ไหม|เหรอ)$/.test(t) ? '' : e), ts: safe(() => Cal36.hhmm(), '') }); if (lg.length > 40) lg.shift();
        opened[n.name] = S.day + ':' + timeOf(); stamps[n.name] = Date.now(); nudged[n.name] = 0;
      }
    } catch (e) { console.warn('v61 opener', e); }
    return _talk(n);
  };
  // when you go quiet, they ask something (at most twice)
  const stamps = {}, nudged = {};
  const _say = C.say.bind(C);
  C.say = function (n, text, opt) { stamps[n.name] = Date.now(); nudged[n.name] = 0; return _say(n, text, opt); };
  setInterval(() => {
    try {
      if (!UI.isOpen() || !UI.talkTo || C.typing[UI.talkTo.name]) return;
      const n = UI.talkTo, t0 = stamps[n.name]; if (!t0 || (nudged[n.name] || 0) >= 2 || Date.now() - t0 < 32000 + (nudged[n.name] || 0) * 20000) return;
      const lg = C.logs()[n.name]; if (!lg || !lg.length || lg[lg.length - 1].me) return;
      const m = C.mem(n.name); if (m.pend && m.pend.k && m.pend.k !== 'askYou') return;
      const x = C.ctxOf(n, m, {}), s = pick(STARTERS); nudged[n.name] = (nudged[n.name] || 0) + 1;
      const t = pick(['อืม...', 'เอ้อ ว่าแต่', 'เออ จริงสิ']) + ' ' + s[1].replace('เธอ', x.tok.you) + x.tok.e();
      lg.push({ t, ts: safe(() => Cal36.hhmm(), '') }); m.pend = { k: 'askYou', id: s[0], d: S.day }; stamps[n.name] = Date.now();
      try { safe(() => Sfx.tone(520, 0.05, 'sine', 0.04), 0); } catch (e) { }
      UI.renderBody();
    } catch (e) { }
  }, 4000);

  // remember, react, call back
  const REACT = ['{w}เหรอ{e} เล่าเพิ่มหน่อยสิ', 'อ๋อ {w}นี่เอง{e}', '{w}... ฟังดูน่าสนใจนะ{e}', 'เข้าใจเลย{e} {w}เนอะ', 'จริงด้วย{e} {w}ก็แบบนั้นแหละ', 'อืม {w}เหรอ{e} แล้วยังไงต่อ{q}', 'ว้าว {w}เลยเหรอ{e}', 'โอ้โห {w}เหรอ{e} ไม่เคยรู้เลย'];
  const NEUTRAL = ['อ้าว จริงเหรอ{e} แล้วยังไงต่อ{q}', 'โอ้โห เรื่องนั้นเหรอ{e} เล่าต่อสิ', 'เข้าใจเลย{e} เจอแบบนั้นก็เหนื่อยเนอะ', 'ฟังแล้วน่าสนใจนะ{e} แล้วตอนนั้นทำยังไง{q}', 'อืม... เข้าใจแล้ว{e} ขอบคุณที่เล่าให้ฟังนะ'];
  const _resp = C.respond.bind(C);
  C.respond = function (n, text, opt) {
    const askId = (() => { const m0 = C.mem(n.name); return m0.pend && m0.pend.k === 'askYou' && m0.pend.d === S.day ? m0.pend.id : null; })(), wasAsk = !!askId;
    const res = _resp(n, text, opt); if (!res || !res.text) return res;
    try {
      const m = C.mem(n.name), x = C.ctxOf(n, m, opt || {}), nt = C.norm(text), e = x.tok.e(), q = x.tok.q();
      // 0) they are answering a question we just asked: reply to the answer itself
      const tx = String(text).trim();
      if (wasAsk && ANSR[tx] && !res.act) { res.text = pick(ANSR[tx]).replace(/\{e\}/g, e).replace(/นะค่ะ/g, 'นะคะ').replace(/(นะ|ครับ|ค่ะ|คะ|จ้ะ|จ้า)+/g, '$1').replace(/\s{2,}/g, ' '); res.fb = false; m.lastReply = res.text; m.pend = null; return res; }
      // a long story told in answer to a question: react to it, do not echo the whole sentence back
      if (wasAsk && !res.fb && m.mirror === askId && nt.c.length > 14 && !res.act) { res.text = pick(NEUTRAL).replace(/\{e\}/g, e).replace(/\{q\}/g, q).replace(/\s{2,}/g, ' '); m.lastReply = res.text; return res; }
      // 1) a message it cannot place: react to what was said instead of "I don't get it"
      if (res.fb && !nt.q && nt.c.length >= 3 && Math.random() < 0.7) {
        const w = nt.c.replace(/^(ฉัน|ผม|หนู|เรา)/, '').slice(0, 18).trim();
        if (w.length >= 2) { res.text = pick(REACT).replace(/\{w\}/g, w).replace(/\{e\}/g, e).replace(/\{q\}/g, q).replace(/\s{2,}/g, ' '); m.lastReply = res.text; }
      }
      // 2) every so often, bring back something you told them before
      else if (!res.fb && !res.pend && !res.act && x.willing.w >= 40 && !(m.annoy > 0 || (n.annoy || 0) > 0) && (m.t || 0) >= 4 && (m.cb61 == null || m.t - m.cb61 >= 7) && Math.random() < 0.22) {
        const lk = m.facts && m.facts.likes && m.facts.likes[m.facts.likes.length - 1], jb = m.facts && m.facts.job;
        const line = lk ? `จริงสิ วันก่อน${x.tok.you}บอกว่าชอบ${lk} ช่วงนี้ได้ทำบ้างไหม${q}` : jb ? `ว่าแต่งาน${jb}ของ${x.tok.you} ช่วงนี้เป็นไงบ้าง${q}` : '';
        if (line && !/(ไหม|เหรอ|ล่ะ|\?)(?:คะ|ครับ|ค่ะ|นะ)?$/.test(res.text)) { res.text += ' ' + line; m.cb61 = m.t; m.pend = { k: 'askYou', id: lk ? 'like' : 'job', d: S.day }; m.lastReply = res.text; }
      }
    } catch (e) { console.warn('v61 respond', e); }
    return res;
  };

  window.Chat61 = { ANS, POOL, TABS, FOLLOW, recommend, chipsOf };
});
