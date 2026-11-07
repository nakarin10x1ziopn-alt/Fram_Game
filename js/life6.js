'use strict';
// ---------- Life 6: seasons you can see, livelier farm animals, villager stories, the village story with cutscenes,
// the Saturday evening market with haggling, and free home decorating ----------

// ===== 2. seasons you can see =====
// linear colour multipliers for the terrain and the foliage materials; a new season fades in over its first two days
const SEASON_LOOK = {
  hot: { ground: [1.2, 1.0, 0.62], fol: [[1.25, 1.05, 0.55], [1.15, 1.02, 0.6], [1.3, 1.0, 0.5]] },
  rain: { ground: [0.74, 0.95, 0.66], fol: [[0.72, 1.02, 0.66], [0.68, 0.98, 0.62], [0.78, 1.04, 0.68]] },
  cool: { ground: [1.0, 0.92, 0.7], fol: [[1.9, 1.0, 0.32], [1.05, 1.0, 0.6], [2.2, 0.75, 0.28]] },
};
const Seasons2 = {
  a: [0, 0, 0], tmp: new THREE.Color(),
  look(kind, i) {
    const si = seasonIdx(), d = (S.day - 1) % SEASON_LEN, t = S.day > SEASON_LEN ? U.clamp((d + S.time / 1440) / 2, 0, 1) : 1;
    const pick = id => kind === 'ground' ? SEASON_LOOK[id].ground : SEASON_LOOK[id].fol[i % 3];
    const p = pick(SEASONS[(si + SEASONS.length - 1) % SEASONS.length].id), c = pick(SEASONS[si].id);
    for (let k = 0; k < 3; k++) this.a[k] = U.lerp(p[k], c[k], t);
    return this.a;
  },
  update() {
    const wet = G.wet || 0, g = this.look('ground', 0);
    World.terrainMat.color.setRGB(g[0], g[1], g[2]).multiplyScalar(1 - wet * 0.22);
    World.folMats.forEach((m, i) => { const f = this.look('fol', i); m.color.setRGB(f[0], f[1], f[2]); });
    if (G.inside) return;
    // morning mist: thick in the rainy season, light in the cool season
    const se = season().id, h = S.time / 60, fog = G.scene.fog;
    const k = (se === 'rain' ? 1 : se === 'cool' ? 0.55 : 0) * U.smooth(4.6, 6, h) * (1 - U.smooth(8, 9.6, h));
    if (k > 0.01) { fog.far = Math.min(fog.far, U.lerp(fog.far, se === 'rain' ? 90 : 170, k)); fog.near = Math.min(fog.near, U.lerp(fog.near, 4, k)); fog.color.lerp(this.tmp.setRGB(0.83, 0.87, 0.9), k * 0.55); }
  },
};

// ===== 7. farm animals: babies, moods you can see, they come running when you carry feed =====
const MOOD_H = { chicken: 0.95, sheep: 1.55, cow: 2.15, pig: 1.3 };
const Ranch2 = {
  grown: a => !a.baby || S.day - a.baby >= 7,
  update() {
    const p = G.player.pos, feed = G.sel === 'feed' && !G.driving && !G.inside;
    for (const A of G.animals) {
      const a = A.d, s = a.baby ? U.lerp(0.5, 1, U.clamp((S.day - a.baby) / 7, 0, 1)) : 1;
      if (Math.abs(A.obj.scale.x - s) > 0.001) A.obj.scale.setScalar(s);
      const d = Math.hypot(a.x - p.x, a.z - p.z);
      if (feed && d < 9 && d > 1.6 && A.st !== 'sleep') { A.st = 'walk'; A.tx = p.x; A.tz = p.z; A.timer = 1.5; }
      // a mood face over each animal when you are close and nothing more urgent is shown
      const face = !G.inside && d < 7 && !A.iconKey ? (a.happy >= 80 ? '😍' : a.happy >= 50 ? '🙂' : '😟') : '';
      if (face !== A.face) {
        if (A.moodS) { World.dyn.remove(A.moodS); A.moodS.material.dispose(); A.moodS = null; }
        A.face = face; if (face) { A.moodS = U.sprite(face, 0.42); World.dyn.add(A.moodS); }
      }
      if (A.moodS) A.moodS.position.set(a.x, (MOOD_H[a.type] || 1.4) * s + 0.25, a.z);
    }
  },
  day() {
    for (const a of S.animals) if (!this.grown(a)) a.prod = false;
    if (S.day % 7 !== 3) return;
    const cap = BARN_CAP[(S.up.barn || 1) - 1] || 0;
    for (const type of Object.keys(ANIMALS)) {
      if (S.animals.length >= cap) break;
      const pair = S.animals.filter(a => a.type === type && this.grown(a) && (a.happy ?? 50) >= 75);
      if (pair.length < 2 || Math.random() > 0.5) continue;
      const b = { type, name: ANIMAL_NAMES[(S.animals.length * 5 + S.day) % ANIMAL_NAMES.length], happy: 70, prod: false, petted: false, baby: S.day };
      S.animals.push(b); addAnimalObj(b);
      Phone.msg('ฟาร์มของคุณ', `ข่าวดี! ${pair[0].name}กับ${pair[1].name}มีลูก${ANIMALS[type].n}ตัวใหม่ชื่อ “${b.name}” โตเต็มที่ใน 7 วัน`);
    }
  },
  app() {
    if (!S.animals.length) return '<p class="empty">ยังไม่มีสัตว์ ซื้อได้ที่ฟาร์มปศุสัตว์ป้าศรี</p>';
    const cap = BARN_CAP[(S.up.barn || 1) - 1] || 0;
    return `<p class="lead">สัตว์ ${S.animals.length}/${cap} ตัว · ให้อาหารและลูบหัวทุกวัน สัตว์ชนิดเดียวกันที่มีความสุข 75+ สองตัว มีโอกาสได้ลูกทุกสัปดาห์ · ถือ 🌾 อาหารสัตว์แล้วสัตว์จะวิ่งมาหา</p>` +
      S.animals.map(a => { const h = Math.round(a.happy ?? 50), kid = !this.grown(a); return `<div class="card"><div class="ci">${ANIMALS[a.type].i || '🐾'}</div><div class="cb"><h4>${esc(a.name)} <small>${ANIMALS[a.type].n}${kid ? ` · ลูกอ่อน (โตในอีก ${7 - (S.day - a.baby)} วัน)` : ''}</small></h4><p class="dim">ความสุข ${h}/100 ${h >= 80 ? '😍' : h >= 50 ? '🙂' : '😟'}${a.prod ? ' · มีผลผลิตรอเก็บ' : ''}${a.petted ? ' · ลูบหัวแล้ววันนี้' : ''}</p><div class="bar"><i style="width:${h}%"></i></div></div></div>`; }).join('');
  },
};

// ===== 4. villager stories: five chapters each, unlocked by friendship; likes and dislikes =====
const STORY_HEARTS = [2, 4, 6, 8, 10];
const STORY_PAY = [300, 600, 1500, 1000, 3000];
// hand-written arcs; {p} is the player's name, {fav} the villager's favourite item
const STORY_ARCS = {
  'ป้าแดง': ['สูตรแกงของแม่', [
    ['ร้านข้าวแกงเล็ก ๆ', 'รู้ไหม {p} ตอนสาว ๆ ป้ากับแม่เคยมีร้านข้าวแกงอยู่ตรงลานน้ำพุนี่แหละ', 'คนทั้งหมู่บ้านมากินทุกเช้า... จนแม่ป้าจากไป ร้านก็ปิดตามไปด้วย'],
    ['สมุดสูตรที่หายไป', 'แม่จดสูตรแกงทุกอย่างไว้ในสมุดปกแดงเล่มหนึ่ง', 'ปีน้ำท่วมใหญ่สมุดเล่มนั้นลอยหายไปกับน้ำ ป้าจำได้แค่ครึ่งเดียว'],
    ['รสมือที่ลืมไม่ลง', 'ป้าอยากลองทำแกงของแม่อีกสักครั้ง แต่ขาดของสดดี ๆ', 'ช่วยหา{fav}มาให้ป้าสัก 2 ชิ้นได้ไหมจ๊ะ'],
    ['กลิ่นแกงลอยมาอีกครั้ง', 'ป้าทำออกมาแล้ว! ยังไม่เหมือนของแม่เป๊ะ แต่ใกล้มากเลย', 'ลุงมีชิมแล้วน้ำตาซึม บอกว่าเหมือนได้กลับไปเป็นเด็กอีกครั้ง'],
    ['ร้านป้าแดงเปิดอีกครั้ง', 'ป้าตัดสินใจแล้ว ทุกเช้าวันอาทิตย์ป้าจะเปิดร้านเล็ก ๆ ที่ลานน้ำพุ', 'เพราะ{p}แท้ ๆ ที่ทำให้ป้ากล้าเริ่มใหม่ เอานี่ไป ถือว่าเป็นหุ้นส่วนกิตติมศักดิ์นะ'],
  ]],
  'ลุงมี': ['สวนมะเขือเทศของป้าบัว', [
    ['แปลงผักหลังบ้าน', 'แปลงผักหลังบ้านลุงนั่น ป้าบัวเมียลุงปลูกไว้ทั้งหมดเลยนะ', 'ตั้งแต่เธอจากไป ลุงก็ปล่อยให้หญ้าขึ้นรก ไม่กล้าเข้าไปดู'],
    ['เมล็ดพันธุ์ในกระป๋อง', 'เมื่อวานลุงเจอกระป๋องเมล็ดมะเขือเทศที่ป้าบัวเก็บไว้', 'เขียนติดไว้ว่า “สำหรับปีหน้า” ... ปีหน้าที่เธอไม่ได้อยู่ดู'],
    ['ลองปลูกอีกครั้ง', 'ลุงจะลองปลูกดู แต่มือลุงไม่เก่งเหมือนเธอ', 'ขอ{fav}ของ{p}สัก 2 ลูกเป็นต้นแบบหน่อย ลุงจะได้รู้ว่าลูกงาม ๆ เป็นยังไง'],
    ['ต้นแรกออกดอก', 'ต้นแรกออกดอกสีเหลืองแล้ว! ลุงนั่งดูมันทั้งเช้า', 'แปลก... ลุงไม่รู้สึกเหงาเท่าเมื่อก่อนเลย'],
    ['ตะกร้าแรกของปี', 'ลุงเก็บมะเขือเทศได้เต็มตะกร้า แจกให้ทั้งซอย', 'ป้าบัวคงยิ้มอยู่ที่ไหนสักแห่ง ขอบใจนะ{p} ที่ทำให้สวนนี้มีชีวิตอีกครั้ง'],
  ]],
  'น้องฝน': ['เสียงเพลงของฝน', [
    ['ร้องเพลงในห้องน้ำ', 'ความลับนะ... หนูชอบร้องเพลงมาก แต่ร้องได้แค่ตอนอยู่คนเดียว', 'พอมีคนฟังทีไร เสียงหายทุกที'],
    ['ประกวดร้องเพลง', 'ที่งานเทศกาลจะมีประกวดร้องเพลง ครูเอชวนหนูสมัคร', 'หนูอยากลอง แต่แค่คิดมือก็เย็นเฉียบแล้ว'],
    ['ซ้อมกับเพื่อนคนแรก', '{p}ช่วยเป็นคนฟังคนแรกให้หนูได้ไหม', 'เอา{fav}มาให้หนู 2 อันนะ หนูกินของเผ็ดแล้วจะกล้าขึ้น! (ไม่รู้ทำไมเหมือนกัน)'],
    ['บนเวทีจริง', 'หนูขึ้นเวทีแล้ว! ร้องผิดไปท่อนนึง แต่ร้องจนจบ', 'ทุกคนปรบมือ... หนูไม่เคยได้ยินเสียงปรบมือดังขนาดนี้มาก่อน'],
    ['เพลงสำหรับเพื่อน', 'หนูแต่งเพลงใหม่ ชื่อ “ไร่สุขใจ” ให้{p}โดยเฉพาะ', 'ถ้าวันไหนเหนื่อย ๆ มาฟังหนูร้องได้เสมอนะ'],
  ]],
  'ครูเอ': ['มุมหนังสือของเด็ก ๆ', [
    ['ห้องสมุดเก่า', 'ห้องสมุดโรงเรียนเรามีหนังสือแค่ร้อยกว่าเล่ม ส่วนใหญ่เก่าจนกระดาษเหลือง', 'เด็ก ๆ อ่านจบหมดแล้วก็ไม่มีอะไรใหม่ให้อ่าน'],
    ['ความฝันของครู', 'ครูอยากทำมุมอ่านหนังสือใต้ต้นไม้ มีเบาะ มีหนังสือภาพสวย ๆ', 'แต่งบโรงเรียนน้อยเหลือเกิน'],
    ['ตลาดขายของมือสอง', 'ครูจะจัดตลาดเล็ก ๆ ระดมทุนซื้อหนังสือ', 'ช่วยครูหา{fav}มาสัก 2 อย่างไปขายได้ไหม คนในหมู่บ้านชอบกันมาก'],
    ['หนังสือลังแรก', 'หนังสือลังแรกมาถึงแล้ว! เด็ก ๆ วิ่งมารุมกันเลย', 'น้องข้าวหอมอ่านนิทานเรื่องแรกจบในชั่วโมงเดียว'],
    ['มุมหนังสือสุขใจ', 'มุมหนังสือเปิดแล้ว ครูตั้งชื่อชั้นหนังสือชั้นหนึ่งตามชื่อ{p}ด้วยนะ', 'ขอบคุณที่ช่วยให้เด็ก ๆ ได้มีโลกใบใหม่ในมือ'],
  ]],
  'พี่ทะเล': ['เรือของพ่อ', [
    ['เรือที่จอดนิ่ง', 'เรือไม้ลำเก่าที่ท่าน้ำนั่น เป็นเรือของพ่อพี่', 'พ่อออกหาปลาทุกเช้าจนวันสุดท้าย ตั้งแต่นั้นมันก็จอดนิ่งอยู่ตรงนั้น'],
    ['รอยรั่วที่ท้องเรือ', 'พี่ลองลงไปดูแล้ว ไม้ผุไปหลายแผ่น ต้องซ่อมใหญ่', 'แต่พี่อยากให้มันกลับมาลอยน้ำได้อีกสักครั้ง'],
    ['เงินค่าไม้', 'พี่จะเอาปลาไปแลกไม้กับพี่ปาล์มช่างไม้', 'ขอ{fav}ของ{p}สัก 2 ตัวเพิ่มหน่อยนะ ปลาของพี่ยังไม่พอ'],
    ['ทาสีใหม่', 'เรือซ่อมเสร็จแล้ว พี่ทาสีฟ้าเหมือนที่พ่อชอบ', 'พรุ่งนี้เช้าจะลองออกทะเลดู ใจเต้นแรงชะมัด'],
    ['ออกทะเลด้วยกัน', 'เรือลอยได้! พี่ตั้งชื่อใหม่ให้มันว่า “สุขใจ”', 'วันไหน{p}อยากออกทะเล บอกพี่ได้เลย ที่นั่งหัวเรือเป็นของ{p}เสมอ'],
  ]],
  'ยายสาย': ['จดหมายถึงหลาน', [
    ['หลานในกรุงเทพฯ', 'หลานยายไปทำงานกรุงเทพฯ ห้าปีแล้ว', 'โทรมาปีละครั้งสองครั้ง ยายไม่โทษเขาหรอก งานคงยุ่ง'],
    ['จดหมายที่ไม่กล้าส่ง', 'ยายเขียนจดหมายถึงเขาไว้เป็นกอง แต่ไม่กล้าส่ง', 'กลัวเขาคิดว่ายายจุกจิก'],
    ['ห่อของจากบ้าน', 'ยายตัดสินใจแล้ว จะส่งจดหมายพร้อมของจากบ้านไปให้', 'ช่วยหา{fav}สวย ๆ ให้ยายสัก 2 ลูกนะ หลานชอบตั้งแต่เด็ก'],
    ['โทรศัพท์ดังตอนเช้า', 'หลานโทรมาแล้ว! บอกว่าอ่านจดหมายแล้วร้องไห้', 'เขาว่าจะลางานกลับมาเยี่ยมเดือนหน้า'],
    ['หลานกลับบ้าน', 'หลานกลับมาแล้ว อยู่ตั้งสามวัน ช่วยยายทาสีบ้านด้วย', 'ยายเล่าเรื่อง{p}ให้ฟังหมดเลยนะ เขาบอกขอบใจที่ดูแลยายแทนเขา'],
  ]],
  'ตาสิงห์': ['กระทะใบเก่าของเชฟ', [
    ['เชฟหกสิบปี', 'ตาทำอาหารมาหกสิบปีแล้ว กระทะใบนี้ใช้มาตั้งแต่เปิดร้านวันแรก', 'มือตาเริ่มสั่นแล้ว... อีกไม่นานคงต้องวางตะหลิว'],
    ['หาคนสืบทอด', 'ตาอยากให้ใครสักคนสืบทอดสูตรร้านนี้', 'น้องโอ๊ตร้านซีฟู้ดก็ดูมีแวว แต่เขายังไม่มั่นใจตัวเอง'],
    ['บททดสอบไข่เจียว', 'ตาจะทดสอบน้องโอ๊ตด้วยเมนูง่ายที่สุด ไข่เจียว', 'เอา{fav}มาให้ตาสัก 2 ฟองนะ ของดี ๆ เท่านั้นถึงจะสอบได้'],
    ['ไข่เจียวฟูที่สุดในหมู่บ้าน', 'น้องโอ๊ตทำผ่านแล้ว! ฟูกรอบกว่าของตาสมัยหนุ่ม ๆ อีก', 'ตาไม่เคยดีใจที่แพ้ใครขนาดนี้มาก่อน'],
    ['ส่งต่อกระทะ', 'วันนี้ตายกกระทะใบนี้ให้น้องโอ๊ตแล้ว', 'แต่สูตรน้ำพริกลับของร้าน ตาจะบอก{p}คนเดียว... เก็บไว้ดี ๆ นะ'],
  ]],
  'น้องเมฆ': ['ทุ่งทานตะวันในฝัน', [
    ['ร้านเล็กของเมฆ', 'เมฆรับช่วงร้านเกษตรต่อจากพ่อตอนอายุสิบเก้า', 'ทุกคนคิดว่าเมฆเด็กเกินไป แต่เมฆจะพิสูจน์ให้ดู'],
    ['ภาพถ่ายใบเก่า', 'รูปนี้คือทุ่งทานตะวันที่พ่อพาไปเที่ยวตอนเด็ก', 'เมฆอยากให้หมู่บ้านเรามีทุ่งแบบนี้สักทุ่ง'],
    ['เมล็ดพันธุ์แรก', 'เมฆจะลองปลูกแปลงทดลองหลังร้านก่อน', 'ช่วยหา{fav}งาม ๆ มาสัก 2 ดอก เมฆจะเก็บเมล็ดจากดอกที่แข็งแรงที่สุด'],
    ['แปลงเหลืองอร่าม', 'แปลงทดลองบานเต็มแล้ว! คนแวะมาถ่ายรูปกันทั้งวัน', 'ลุงเสริมยกที่ดินข้างร้านให้ขยายแปลงด้วย'],
    ['เทศกาลทานตะวัน', 'ทุ่งทานตะวันของหมู่บ้านเราเปิดแล้ว', 'ป้ายทางเข้าเมฆเขียนชื่อ{p}ไว้ในฐานะผู้ช่วยปลูกคนแรกนะ'],
  ]],
};
// shared arcs for everyone else, picked by name
const STORY_TEMPLATES = [
  ['ความฝันที่เก็บไว้', [
    ['ความฝันเล็ก ๆ', 'ฉันมีความฝันมาตั้งแต่เด็ก อยากมีร้านเล็ก ๆ เป็นของตัวเอง', 'แต่ทุกครั้งที่จะเริ่ม ก็มีเหตุผลให้เลื่อนออกไปเรื่อย ๆ'],
    ['เงินเก็บในโหล', 'ฉันเริ่มหยอดเงินใส่โหลทุกวันแล้วนะ', 'อาจจะช้า แต่อย่างน้อยก็ได้เริ่ม'],
    ['สินค้าชิ้นแรก', 'ฉันจะลองขายของชิ้นแรกที่ตลาดนัด', 'ช่วยหา{fav}มาให้ฉันสัก 2 ชิ้นได้ไหม ฉันว่ามันขายดีแน่'],
    ['ลูกค้าประจำคนแรก', 'มีลูกค้ากลับมาซื้อซ้ำแล้ว! เขาบอกว่าชอบมาก', 'ความรู้สึกนี้ดีกว่าที่คิดไว้เยอะเลย'],
    ['ป้ายร้านของฉัน', 'ฉันติดป้ายร้านแล้ว ถึงจะเล็กนิดเดียวก็เถอะ', 'ขอบใจนะ{p} ถ้าไม่มีเธอฉันคงยังนั่งฝันอยู่'],
  ]],
  ['จดหมายที่ไม่ได้ส่ง', [
    ['พี่น้องที่ไม่คุยกัน', 'ฉันกับพี่ไม่ได้คุยกันมาหลายปีแล้ว', 'ทะเลาะกันเรื่องเล็กนิดเดียว แต่ไม่มีใครยอมใคร'],
    ['รูปถ่ายวัยเด็ก', 'เมื่อวานฉันเจอรูปเราสองคนตอนเด็ก ยืนกอดคอกันที่ทุ่งนา', 'ดูแล้วใจหายเลย'],
    ['ของฝากไปง้อ', 'ฉันจะไปหาพี่ที่เมือง แต่ไม่อยากไปมือเปล่า', 'เอา{fav}ให้ฉันสัก 2 ชิ้นนะ พี่ชอบมาตั้งแต่เด็ก'],
    ['ประตูที่เปิดออก', 'พี่เปิดประตูมาแล้วนิ่งไปนาน ก่อนจะกอดฉันแน่น', 'เราคุยกันจนดึก หัวเราะเรื่องเก่า ๆ เหมือนไม่เคยห่างกัน'],
    ['โต๊ะกินข้าวเต็มอีกครั้ง', 'สงกรานต์นี้ทั้งบ้านจะมากินข้าวพร้อมหน้ากัน', '{p}ต้องมาด้วยนะ เธอเป็นเหมือนคนในครอบครัวไปแล้ว'],
  ]],
  ['ของเก่าที่หายไป', [
    ['สร้อยของยาย', 'ฉันทำสร้อยเงินที่ยายให้ไว้หายไป', 'มันไม่ได้แพงอะไร แต่มันมีความหมายกับฉันมาก'],
    ['เบาะแสที่ลานน้ำพุ', 'มีคนบอกว่าเห็นเด็กเก็บของเงิน ๆ ได้ที่ลานน้ำพุ', 'ฉันจะลองตามหาดู'],
    ['ของแลกเปลี่ยน', 'เจอแล้ว! เด็กคนนั้นยอมคืนให้ แต่ขอแลกกับของอร่อย', 'ช่วยหา{fav}มาสัก 2 ชิ้นได้ไหม'],
    ['สร้อยกลับมาแล้ว', 'สร้อยกลับมาอยู่ที่คอฉันแล้ว', 'เด็กคนนั้นกลายเป็นเพื่อนเล่นของฉันไปด้วย'],
    ['สิ่งที่ยายสอน', 'ยายเคยบอกว่า ของหายหาใหม่ได้ แต่เพื่อนดี ๆ หายากนะ', 'ตอนนี้ฉันเข้าใจแล้ว ขอบใจนะ{p}'],
  ]],
  ['เริ่มต้นใหม่', [
    ['เหนื่อยง่ายกว่าเดิม', 'ช่วงนี้เดินขึ้นเนินนิดเดียวก็หอบแล้ว', 'หมอบอกให้ออกกำลังกายกับกินผักเยอะ ๆ'],
    ['ตื่นเช้าวิ่งรอบหมู่บ้าน', 'ฉันเริ่มวิ่งรอบหมู่บ้านทุกเช้าแล้ว', 'วันแรกวิ่งได้ไม่ถึงร้อยเมตร ฮ่า ๆ'],
    ['อาหารเพื่อสุขภาพ', 'ฉันอยากเปลี่ยนมากินของสดจากไร่', 'ช่วยหา{fav}มาให้ฉันสัก 2 ชิ้นได้ไหม'],
    ['วิ่งได้ครบรอบ', 'ฉันวิ่งได้ครบรอบหมู่บ้านแล้ว! ไม่หยุดพักเลยสักครั้ง', 'หมอยังตกใจเลยว่าความดันลดลงเยอะ'],
    ['ชวนกันวิ่ง', 'ตอนนี้มีคนมาวิ่งด้วยทุกเช้าห้าหกคนแล้ว', 'พรุ่งนี้{p}มาวิ่งด้วยกันนะ ฉันจะรอที่ลานน้ำพุ'],
  ]],
  ['บ้านหลังแรก', [
    ['หลังคารั่ว', 'บ้านฉันหลังคารั่วทุกครั้งที่ฝนตก', 'ต้องเอากะละมังรองน้ำเต็มบ้านไปหมด'],
    ['เก็บเงินซ่อมบ้าน', 'ฉันเก็บเงินซ่อมหลังคามาครึ่งปีแล้ว', 'อีกนิดเดียวก็พอแล้วล่ะ'],
    ['งานพิเศษ', 'ฉันรับงานพิเศษเพิ่ม แต่ต้องมีของไปส่งลูกค้า', 'ช่วยหา{fav}มาสัก 2 ชิ้นได้ไหม'],
    ['ช่างมาแล้ว', 'พี่ปาล์มช่างไม้มาซ่อมหลังคาให้แล้ว', 'คืนนี้ฝนตกแต่บ้านแห้งสนิท ฉันนอนหลับสบายที่สุดในรอบปี'],
    ['บ้านที่อบอุ่น', 'ฉันทาสีบ้านใหม่เป็นสีเหลืองนวล ปลูกดอกไม้หน้าบ้านด้วย', 'แวะมากินข้าวบ้านฉันบ้างนะ{p}'],
  ]],
  ['เพื่อนสี่ขา', [
    ['หมาจรหน้าร้าน', 'มีลูกหมาจรมานอนหน้าบ้านฉันทุกคืน', 'ตัวผอมมาก ฉันแอบให้ข้าวมันบ่อย ๆ'],
    ['ตั้งชื่อให้', 'ฉันตั้งชื่อมันว่า “ข้าวตู” ตอนนี้มันวิ่งตามฉันทั้งวันเลย', 'แต่มันมีแผลที่ขา ฉันเป็นห่วง'],
    ['ไปหาหมอ', 'ฉันจะพาข้าวตูไปหาหมอที่ศูนย์สัตว์เลี้ยงภูผา', 'ช่วยหา{fav}มาสัก 2 ชิ้นได้ไหม ฉันจะเอาไปแลกค่ารถ'],
    ['แผลหายแล้ว', 'แผลข้าวตูหายสนิทแล้ว! หมอบอกมันแข็งแรงมาก', 'ตอนนี้มันอ้วนขึ้นจนจำแทบไม่ได้'],
    ['ครอบครัวเดียวกัน', 'ข้าวตูเป็นสมาชิกบ้านฉันอย่างเป็นทางการแล้ว', 'มันชอบ{p}มากนะ เห็นเธอทีไรหางกระดิกไม่หยุด'],
  ]],
];
const DISLIKE_POOL = ['stone', 'ladybug', 'fert', 'feed', 'chili', 'milk', 'egg', 'corn', 'cabbage'];
function nameHash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }
function dislikeOf(name) { const fav = favOf(name), L = DISLIKE_POOL.filter(k => ITEMS[k] && k !== fav); return L.length ? L[nameHash(name) % L.length] : null; }
// take n of an item counting every quality grade of it
function takeBase(b, n) { if (countBase(b) < n) return false; for (const k of [b, b + '@1', b + '@2']) while (n > 0 && count(k)) { takeItem(k); n--; } return true; }

const VStory = {
  st() { if (!S.story) S.story = { ch: {}, keep: {} }; return S.story; },
  arc(name) { return STORY_ARCS[name] || STORY_TEMPLATES[nameHash(name) % STORY_TEMPLATES.length]; },
  fill(t, n) { const f = favOf(n); return t.replace(/\{p\}/g, S.name || 'เธอ').replace(/\{fav\}/g, ITEMS[f] ? ITEMS[f].n : 'ของโปรด'); },
  next(n) { const k = this.st().ch[n] || 0; return k < 5 && Friends.get(n) >= STORY_HEARTS[k] ? k : -1; },
  buttons(n) {
    if (n.staff || n.townRes) return '';
    const k = this.st().ch[n.name] || 0, dis = dislikeOf(n.name), h = Friends.get(n.name);
    const like = h >= 4 && dis ? `<p class="dim">ไม่ชอบ: ${ITEMS[dis].i} ${esc(ITEMS[dis].n)}</p>` : '';
    if (k >= 5) return `<p class="dim">📖 อ่านเรื่องของ${esc(n.name)}ครบทั้ง 5 ตอนแล้ว</p>${like}`;
    return (this.next(n.name) >= 0 ? `<div class="row"><button class="btn" data-a="vstory">📖 เรื่องของ${esc(n.name)} ตอนที่ ${k + 1}</button></div>` : `<p class="dim">📖 ตอนที่ ${k + 1} ของเรื่อง “${this.arc(n.name)[0]}” ปลดล็อกเมื่อสนิท ${STORY_HEARTS[k]} หัวใจ</p>`) + like;
  },
  open(n) {
    const k = this.next(n.name); if (k < 0) return;
    this.cur = { n, k, i: 0 };
    UI.open(`📖 ${this.arc(n.name)[0]} · ตอนที่ ${k + 1}`, null, () => this.html());
  },
  html() {
    const { n, k, i } = this.cur, ch = this.arc(n.name)[1][k], lines = ch.slice(1), last = i >= lines.length - 1, need = k === 2 ? favOf(n.name) : null;
    const said = lines.slice(0, i + 1).map(l => `<p class="lead say">“${esc(this.fill(l, n.name))}”</p>`).join('');
    const end = !last ? '<button class="btn" data-a="vsnext">ถัดไป ▶</button>'
      : need ? `<button class="btn" data-a="vsend" ${countBase(need) >= 2 ? '' : 'disabled'}>มอบ ${ITEMS[need].i} ${esc(ITEMS[need].n)} ×2 (มี ${countBase(need)})</button><button class="btn ghost" data-a="close">ไว้ทีหลัง</button>`
      : '<button class="btn" data-a="vsend">จบตอน ✔</button>';
    return `${People.card(n)}<h4>${esc(ch[0])}</h4>${said}<div class="row end">${end}</div>`;
  },
  step() { this.cur.i++; Sfx.click(); UI.renderBody(); },
  finish() {
    const { n, k } = this.cur, need = k === 2 ? favOf(n.name) : null;
    if (need && !takeBase(need, 2)) return;
    const s = this.st(); s.ch[n.name] = k + 1; earn(STORY_PAY[k]); Prog.add(10 + k * 5);
    if (k === 3) addItem('fert', 5);
    if (k === 4) { s.keep[n.name] = this.arc(n.name)[0]; Friends.add(n.name, 0.5); }
    n.wave = 2; UI.close(); saveGame(true);
    UI.toast(k === 4 ? `จบเรื่อง “${this.arc(n.name)[0]}” ของ${n.name}! ได้ของที่ระลึกในสมุดความทรงจำ +${baht(STORY_PAY[k])}` : `จบตอนที่ ${k + 1} ของ${n.name} +${baht(STORY_PAY[k])}${k === 3 ? ' และปุ๋ย ×5' : ''}`, '📖');
  },
  app() {
    const s = this.st(), names = G.npcs.filter(n => !n.staff && !n.townRes).map(n => n.name);
    const done = names.filter(n => (s.ch[n] || 0) >= 5).length;
    return `<p class="lead">เรื่องราวของชาวบ้าน · อ่านจบ ${done}/${names.length} คน · ตอนใหม่ปลดล็อกที่ 2, 4, 6, 8, 10 หัวใจ</p>` + names.map(n => {
      const k = s.ch[n] || 0, ready = this.next(n) >= 0;
      return `<div class="card"><div class="ci">${k >= 5 ? '🏅' : ready ? '📖' : '📕'}</div><div class="cb"><h4>${esc(n)} <small>“${esc(this.arc(n)[0])}”</small></h4><p class="dim">อ่านแล้ว ${k}/5 ตอน${ready ? ' · มีตอนใหม่รออยู่! ไปคุยได้เลย' : k < 5 ? ` · ตอนต่อไปที่ ${STORY_HEARTS[k]} หัวใจ (ตอนนี้ ${Math.floor(Friends.get(n))})` : ''}${s.keep[n] ? ' · มีของที่ระลึกแล้ว' : ''}</p></div></div>`;
    }).join('');
  },
};

// ===== cutscenes: letterbox, camera moves between shots, tap to continue =====
const Cut = {
  on: false,
  init() {
    const css = document.createElement('style');
    css.textContent = `#cut{position:fixed;inset:0;z-index:9500;display:none;cursor:pointer;user-select:none}
#cut.on{display:block}#cut .bar{position:absolute;left:0;right:0;height:11vh;background:#000;transition:transform .5s}
#cut .t{top:0;transform:translateY(-100%)}#cut .b{bottom:0;transform:translateY(100%)}#cut.show .t,#cut.show .b{transform:none}
#cut .say{position:absolute;left:50%;bottom:calc(11vh + 14px);transform:translateX(-50%);width:min(720px,calc(100vw - 32px));background:rgba(14,18,24,.86);color:#fff;border-radius:14px;padding:14px 18px 12px;font-size:clamp(15px,2.1vw,19px);line-height:1.55;box-shadow:0 6px 24px rgba(0,0,0,.35)}
#cut .say b{display:block;color:#ffd36b;font-size:.85em;margin-bottom:2px}#cut .say i{display:block;text-align:right;font-style:normal;opacity:.6;font-size:.75em;margin-top:6px}
#cut .skip{position:absolute;right:14px;top:calc(11vh + 10px);background:rgba(0,0,0,.5);color:#fff;border:0;border-radius:10px;padding:6px 12px;font:inherit;cursor:pointer}
#cut .ttl{position:absolute;left:0;right:0;top:34%;text-align:center;color:#fff;font-size:clamp(22px,4vw,40px);font-weight:800;text-shadow:0 3px 16px rgba(0,0,0,.6);opacity:0;transition:opacity .8s}
#cut .ttl.on{opacity:1}#cut .ttl small{display:block;font-size:.45em;font-weight:600;opacity:.85;margin-top:6px}
body.cutting>*:not(#c):not(#cut):not(script):not(style){visibility:hidden!important}`;
    document.head.appendChild(css);
    const d = document.createElement('div'); d.id = 'cut';
    d.innerHTML = '<div class="bar t"></div><div class="bar b"></div><div class="ttl"></div><div class="say" hidden><b></b><span></span><i>แตะเพื่อไปต่อ ▶</i></div><button class="skip">ข้าม ⏭</button>';
    document.body.appendChild(d); this.el = d;
    d.addEventListener('click', e => { if (e.target.classList.contains('skip')) this.end(); else this.adv(); });
    addEventListener('keydown', e => { if (!this.on) return; if (e.code === 'Escape') this.end(); else if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') { e.preventDefault(); this.adv(); } }, true);
    const _uc = updateCamera; updateCamera = dt => { if (this.on) this.cam(dt); else _uc(dt); };
  },
  // shots: { x, z, yaw, pitch, dist, h, who, say, title, sub, fx }
  play(shots, done) {
    if (this.on) return;
    UI.close(); this.shots = shots; this.done = done; this.i = -1; this.on = true; this.wasPaused = G.paused; G.paused = true;
    const cp = G.camera.position; this.from = { x: cp.x, y: cp.y, z: cp.z, tx: G.cam.x, ty: G.cam.y + 1.3, tz: G.cam.z };
    document.body.classList.add('cutting'); this.el.classList.add('on'); requestAnimationFrame(() => this.el.classList.add('show'));
    this.adv();
  },
  pose(s) {
    const y = World.groundY(s.x, s.z) + (s.h || 1.5), p = s.pitch ?? 0.35, d = s.dist ?? 14;
    return { x: s.x + Math.sin(s.yaw) * Math.cos(p) * d, y: y + Math.sin(p) * d, z: s.z + Math.cos(s.yaw) * Math.cos(p) * d, tx: s.x, ty: y, tz: s.z };
  },
  adv() {
    if (!this.on) return;
    if (this.i >= 0 && this.typing) { this.typing = false; return; }
    this.i++; if (this.i >= this.shots.length) return this.end();
    const s = this.shots[this.i];
    if (this.i > 0) this.from = this.now || this.from;
    this.to = this.pose(s); this.t = 0; this.hold = 0;
    const box = this.el.querySelector('.say'), ttl = this.el.querySelector('.ttl');
    ttl.classList.toggle('on', !!s.title); ttl.innerHTML = s.title ? `${esc(s.title)}${s.sub ? `<small>${esc(s.sub)}</small>` : ''}` : '';
    box.hidden = !s.say; if (s.say) { box.querySelector('b').textContent = s.who || ''; this.full = s.say; this.shown = 0; this.typing = true; box.querySelector('span').textContent = ''; }
    if (s.fx) try { s.fx(); } catch (e) { console.warn('cut fx', e); }
    Sfx.click();
  },
  cam(dt) {
    const s = this.shots[this.i]; if (!s) return;
    this.t = Math.min(1, this.t + dt / (s.move || 1.8)); const e = this.t * this.t * (3 - 2 * this.t), f = this.from, o = this.to;
    // slow drift while holding so still shots feel alive
    this.hold += dt; const dr = Math.sin(this.hold * 0.25) * 0.6;
    const n = this.now = { x: U.lerp(f.x, o.x, e) + dr, y: U.lerp(f.y, o.y, e), z: U.lerp(f.z, o.z, e), tx: U.lerp(f.tx, o.tx, e), ty: U.lerp(f.ty, o.ty, e), tz: U.lerp(f.tz, o.tz, e) };
    G.camera.position.set(n.x, n.y, n.z); G.camera.lookAt(n.tx, n.ty, n.tz);
    World.sky.position.copy(G.camera.position); World.stars.position.copy(G.camera.position);
    if (this.typing) { this.shown += dt * 38; const k = Math.min(this.full.length, Math.floor(this.shown)); this.el.querySelector('.say span').textContent = this.full.slice(0, k); if (k >= this.full.length) this.typing = false; }
    else if (s.say) this.el.querySelector('.say span').textContent = this.full;
  },
  end() {
    if (!this.on) return;
    this.on = false; G.paused = false; this.el.classList.remove('show'); setTimeout(() => this.el.classList.remove('on'), 450);
    document.body.classList.remove('cutting'); this.el.querySelector('.ttl').classList.remove('on'); snapCam();
    const d = this.done; this.done = null; if (d) try { d(); } catch (e) { console.warn('cut done', e); }
  },
};

// ===== 8. the village story: five chapters with cutscenes and an ending =====
const FARM_SHOT = { x: HOUSE_POS.x + 6, z: HOUSE_POS.z - 4 };
const SAGA = [
  { t: 'จดหมายจากปู่', goal: 'เก็บเกี่ยวผลผลิต 30 ครั้ง', reward: 2000,
    prog: b => [S.stats.harvest - b.harvest, 30],
    intro: [
      { x: FARM_SHOT.x, z: FARM_SHOT.z, yaw: 2.4, pitch: 0.55, dist: 34, title: 'บทที่ 1 · จดหมายจากปู่', sub: 'เรื่องราวของหมู่บ้านสุขใจ' },
      { x: HOUSE_POS.x, z: HOUSE_POS.z, yaw: 0.4, pitch: 0.3, dist: 12, who: 'จดหมายจากปู่', say: 'ถึงหลานรัก... ไร่ผืนนี้ปู่ดูแลมาทั้งชีวิต ตอนนี้ปู่ฝากมันไว้กับหลานแล้วนะ' },
      { x: -14, z: -262, yaw: 3.6, pitch: 0.4, dist: 26, who: 'จดหมายจากปู่', say: 'หมู่บ้านสุขใจเคยคึกคัก มีตลาด มีงานเทศกาล แต่ช่วงหลังคนหนุ่มสาวย้ายไปเมืองกันหมด' },
      { x: -28, z: -265, yaw: 1.2, pitch: 0.25, dist: 16, who: 'จดหมายจากปู่', say: 'ถ้าหลานทำให้ไร่กลับมาเขียวขจี บางทีหมู่บ้านก็อาจกลับมามีชีวิตอีกครั้ง' },
      { x: FARM_SHOT.x, z: FARM_SHOT.z, yaw: 2.0, pitch: 0.42, dist: 20, who: 'เป้าหมาย', say: 'บทที่ 1: เก็บเกี่ยวผลผลิตให้ได้ 30 ครั้ง ดูความคืบหน้าได้ในแอป “เรื่องราวหมู่บ้าน” 📜' },
    ] },
  { t: 'เสียงหัวเราะในหมู่บ้าน', goal: 'สนิทกับชาวบ้านรวม 15 หัวใจ', reward: 3000,
    prog: () => [Math.floor(Saga.hearts()), 15],
    intro: [
      { x: -14, z: -262, yaw: 2.6, pitch: 0.45, dist: 30, title: 'บทที่ 2 · เสียงหัวเราะในหมู่บ้าน' },
      { x: -22, z: -259, yaw: 0.8, pitch: 0.3, dist: 12, who: 'ป้าแดง', say: 'ไร่ของหลานปู่เขียวขึ้นเยอะเลยนะ ข่าวไปถึงทุกบ้านแล้ว' },
      { x: -22, z: -259, yaw: 1.6, pitch: 0.28, dist: 11, who: 'ป้าแดง', say: 'แต่หมู่บ้านเรายังเงียบเหงา คนไม่ค่อยคุยกัน ลองแวะทักทาย ให้ของขวัญ ช่วยงานพวกเขาดูสิ' },
    ] },
  { t: 'ตลาดนัดคืนชีพ', goal: 'ขายของที่แผงตลาดนัดให้ได้ 3,000 ฿', reward: 5000,
    prog: b => [Market6.st().total - b.market, 3000],
    intro: [
      { x: MARKET.x, z: MARKET.z, yaw: 1.9, pitch: 0.4, dist: 22, title: 'บทที่ 3 · ตลาดนัดคืนชีพ' },
      { x: MARKET.x, z: MARKET.z, yaw: 1.3, pitch: 0.25, dist: 9, who: 'ลุงมี', say: 'สมัยลุงหนุ่ม ๆ ตลาดนัดเย็นวันเสาร์ที่นี่คนแน่นจนเดินไม่ได้' },
      { x: MARKET.x, z: MARKET.z, yaw: 2.2, pitch: 0.3, dist: 10, who: 'ลุงมี', say: 'หลานลองตั้งแผงขายผลผลิตดูสิ เสาร์เย็น 17:00–21:00 ลูกค้ามาต่อราคากันสด ๆ สนุกนะ' },
    ] },
  { t: 'ถนนสู่เมือง', goal: 'มีรถ แล้วขับไปเยือนเมืองทุ่งทองและเมืองภูผาใหม่', reward: 8000,
    prog: () => [(S.cars && S.cars.length ? 1 : 0) + (Saga.st().vis.thong ? 1 : 0) + (Saga.st().vis.phupha ? 1 : 0), 3],
    intro: [
      { x: 0, z: -326, yaw: 2.4, pitch: 0.5, dist: 40, title: 'บทที่ 4 · ถนนสู่เมือง' },
      { x: 170, z: -268, yaw: 3.4, pitch: 0.45, dist: 40, who: 'ครูเอ', say: 'เมืองทุ่งทองกับภูผาใหม่มีตลาดใหญ่ มีคนอยากซื้อของดีจากหมู่บ้านเรา' },
      { x: -105, z: -400, yaw: 0.6, pitch: 0.45, dist: 40, who: 'ครูเอ', say: 'ถ้ามีรถสักคัน ขับไปผูกมิตรกับสองเมืองนี้ หมู่บ้านเราจะได้ไม่โดดเดี่ยวอีก' },
    ] },
  { t: 'เทศกาลแห่งความสุข', goal: 'สนิทกับชาวบ้านรวม 30 หัวใจ แล้วสนับสนุนงานเทศกาล 20,000 ฿ ในแอปนี้', reward: 10000,
    prog: () => [Math.min(30, Math.floor(Saga.hearts())) + (Saga.st().fund ? 1 : 0), 31],
    intro: [
      { x: -28, z: -265, yaw: 0.2, pitch: 0.6, dist: 36, title: 'บทที่ 5 · เทศกาลแห่งความสุข' },
      { x: -22, z: -259, yaw: 1.0, pitch: 0.3, dist: 12, who: 'ป้าแดง', say: 'ทั้งหมู่บ้านคุยกันว่า ปีนี้อยากจัดงานเทศกาลใหญ่เหมือนสมัยก่อน' },
      { x: -22, z: -259, yaw: 2.0, pitch: 0.3, dist: 12, who: 'ป้าแดง', say: 'ถ้าหลานช่วยเป็นเจ้าภาพ ทุกคนพร้อมลงแรงเต็มที่เลย' },
    ] },
];
const Saga = {
  st() {
    if (!S.saga) S.saga = { ch: 0, started: false, ended: false, vis: {}, base: null, fund: false };
    return S.saga;
  },
  hearts() { return G.npcs.filter(n => !n.staff && !n.townRes).reduce((a, n) => a + Friends.get(n.name), 0); },
  baseline() { return { harvest: S.stats.harvest, market: Market6.st().total }; },
  cur() { const s = this.st(); return s.ended ? null : SAGA[s.ch]; },
  begin(i) {
    const s = this.st(); s.ch = i; s.base = this.baseline(); s.started = true; saveGame(true);
    Cut.play(SAGA[i].intro, () => UI.toast(`📜 บทที่ ${i + 1}: ${SAGA[i].goal}`, '📜'));
  },
  update(dt) {
    if (G.simulating || !G.started) return;
    const s = this.st(), z = zoneAt(G.player.pos.x, G.player.pos.z); if (z && (z.id === 'thong' || z.id === 'phupha')) s.vis[z.id] = 1;
    if ((this.t = (this.t || 0) - dt) > 0) return; this.t = 1.5;
    if (s.ended || Cut.on || UI.isOpen() || G.inside || G.driving || G.paused || S.tut !== 'done' || document.body.classList.contains('photo')) return;
    if (!s.started) { if ((this.wait = (this.wait || 0) + 1.5) > 12) this.begin(0); return; }
    const c = SAGA[s.ch], [a, b] = c.prog(s.base || this.baseline());
    if (a >= b) this.complete();
  },
  complete() {
    const s = this.st(), c = SAGA[s.ch]; earn(c.reward); Prog.add(40);
    if (s.ch === SAGA.length - 1) return this.ending();
    UI.toast(`📜 จบบทที่ ${s.ch + 1} “${c.t}” รับรางวัล ${baht(c.reward)}`, '🎉');
    const next = s.ch + 1; s.ch = next; s.base = this.baseline(); saveGame(true);
    setTimeout(() => this.begin(next), 2500);
  },
  fund() {
    const s = this.st(), c = this.cur();
    if (!c || s.ch !== SAGA.length - 1 || s.fund) return;
    if (S.money < 20000) { UI.toast('เงินไม่พอ ต้องมี 20,000 ฿', '💸'); return; }
    S.money -= 20000; Bank2.log('สนับสนุนงานเทศกาลหมู่บ้าน', -20000); s.fund = true; UI.close(); saveGame(true);
    UI.toast('ขอบคุณที่สนับสนุนงานเทศกาล! ทุกคนเริ่มเตรียมงานแล้ว', '🎪');
  },
  ending() {
    const s = this.st(); s.ended = true; S.title = 'ผู้ฟื้นฟูหมู่บ้านสุขใจ'; saveGame(true);
    const P = { x: -28, z: -265 }, boom = () => { for (let i = 0; i < 6; i++) setTimeout(() => Fest2.rocket(P.x, P.z, i % 2 === 0), i * 380); };
    Cut.play([
      { x: P.x, z: P.z, yaw: 0.3, pitch: 0.55, dist: 40, title: 'บทสุดท้าย · เทศกาลแห่งความสุข' },
      { x: P.x, z: P.z, yaw: 1.1, pitch: 0.3, dist: 18, who: 'ป้าแดง', say: 'ดูสิ... ลานน้ำพุคนแน่นเหมือนสมัยก่อนเลย ป้าไม่คิดว่าจะได้เห็นภาพนี้อีก', fx: boom },
      { x: P.x, z: P.z, yaw: 2.2, pitch: 0.42, dist: 24, who: 'ลุงมี', say: 'ปู่ของหลานคงภูมิใจมาก ไร่กลับมาเขียว หมู่บ้านกลับมามีเสียงหัวเราะ', fx: boom },
      { x: P.x, z: P.z, yaw: 3.4, pitch: 0.7, dist: 30, who: 'ทุกคนในหมู่บ้าน', say: `ขอบคุณนะ${S.name ? 'คุณ' + S.name : ''}! ผู้ฟื้นฟูหมู่บ้านสุขใจ 🎆`, fx: boom },
      { x: FARM_SHOT.x, z: FARM_SHOT.z, yaw: 2.4, pitch: 0.5, dist: 30, title: 'จบภาคหลัก', sub: 'ขอบคุณที่เล่นไร่สุขใจ 3D · เล่นต่อได้ตลอดไป' },
    ], () => {
      for (const n of G.npcs) if (!n.staff && !n.townRes) Friends.add(n.name, 1);
      UI.toast('ได้ฉายา “ผู้ฟื้นฟูหมู่บ้านสุขใจ” และทุกคนสนิทขึ้น +1 หัวใจ', '🏆');
    });
  },
  app() {
    const s = this.st();
    const rows = SAGA.map((c, i) => {
      const st = s.ended || i < s.ch ? 'done' : i === s.ch && s.started ? 'now' : 'lock';
      let p = ''; if (st === 'now') { const [a, b] = c.prog(s.base || this.baseline()); p = `<div class="bar"><i style="width:${Math.min(100, a / b * 100)}%"></i></div><p class="dim">${Math.min(a, b)}/${b}</p>`; }
      return `<div class="card"><div class="ci">${st === 'done' ? '✅' : st === 'now' ? '📜' : '🔒'}</div><div class="cb"><h4>บทที่ ${i + 1}: ${esc(c.t)}</h4><p class="dim">${st === 'lock' ? 'ยังไม่ปลดล็อก' : esc(c.goal)} · รางวัล ${baht(c.reward)}</p>${p}${st === 'now' && i === SAGA.length - 1 && !s.fund ? '<div class="row"><button class="btn" data-a="sagafund">🎪 สนับสนุนงานเทศกาล 20,000 ฿</button></div>' : ''}${st !== 'lock' ? `<div class="row"><button class="btn ghost" data-a="sagare" data-v="${i}">▶ ดูฉากเปิดบทอีกครั้ง</button></div>` : ''}</div></div>`;
    }).join('');
    return `<p class="lead">${s.ended ? '🏆 จบภาคหลักแล้ว! คุณคือผู้ฟื้นฟูหมู่บ้านสุขใจ' : 'ฟื้นฟูหมู่บ้านสุขใจให้กลับมามีชีวิต ทีละบท'}</p>${rows}`;
  },
};

// ===== 5. Saturday evening market: set your own prices, customers come and haggle =====
const MARKET_LIVE = [17, 21];
const Market6 = {
  st() { const f = Farm2.st(); if (!f.mprice) f.mprice = {}; if (!S.mk) S.mk = { total: 0, night: 0, rep: 0 }; return S.mk; },
  mult(k) { this.st(); return Farm2.st().mprice[k] || 1.3; },
  saturday() { return (S.day - 1) % 7 === 5; },
  liveNow() { const h = S.time / 60; return this.saturday() && h >= MARKET_LIVE[0] && h < MARKET_LIVE[1]; },
  // how keen shoppers are at a given markup: 1 at +30%, fewer buyers above that
  demand(k) { return U.clamp(1.6 - (this.mult(k) - 1) * 2, 0.15, 1.2); },
  sold(v, n) { const m = this.st(); m.total += v; S.stats.sold += n; Bank2.income('ตลาดนัด', v); },
  ui() {
    UI.open('แผงตลาดนัดของคุณ', ['ขายบนแผง', 'วางของ'], tab => {
      const f = Farm2.st(), m = f.mstock, on = Object.keys(m).filter(k => m[k] > 0);
      const head = `<p class="lead">${this.liveNow() ? '🟢 ตลาดนัดเย็นวันเสาร์เปิดอยู่! ยืนใกล้แผงแล้วลูกค้าจะเดินมาซื้อและต่อราคา' : this.saturday() ? `วันนี้วันเสาร์ ตลาดนัดเย็นเปิด ${MARKET_LIVE[0]}:00–${MARKET_LIVE[1]}:00 · ช่วง 8:00–18:00 ของบนแผงขายเองได้` : Farm2.weekend() ? 'วันนี้วันอาทิตย์ ของบนแผงขายเองช่วง 8:00–18:00' : `ตลาดนัดเปิดเสาร์-อาทิตย์ · ตลาดนัดเย็นแบบต่อราคาสดทุกวันเสาร์ ${MARKET_LIVE[0]}:00–${MARKET_LIVE[1]}:00`}</p>`;
      if (tab === 1) { const inv = UI.sellables(); return head + `<div class="grid">${inv.map(id => `<div class="card"><div class="ci">${ITEMS[id].i}</div><div class="cb"><h4>${esc(ITEMS[id].n)} <small>×${count(id)}</small></h4><div class="row"><button class="btn" data-a="f2stock" data-id="${id}">วางทั้งหมด</button></div></div></div>`).join('') || '<p class="empty">ไม่มีของขาย</p>'}</div>`; }
      return head + `<p class="dim">ตั้งราคาเองได้ ราคาสูงขายช้าลงและลูกค้าต่อราคาบ่อยขึ้น ราคา +30% คือราคาตลาดปกติ · ขายที่ตลาดนัดไปแล้วรวม ${baht(this.st().total)}</p>` + (on.length ? on.map(k => {
        const mu = this.mult(k), p = Math.round(priceOf(k) * mu);
        return `<div class="card"><div class="ci">${ITEMS[k].i}</div><div class="cb"><h4>${esc(ITEMS[k].n)} ×${m[k]}</h4><p class="dim">ราคา ${baht(p)} / ชิ้น (${mu >= 1 ? '+' : ''}${Math.round((mu - 1) * 100)}% จากราคาขายปกติ ${baht(priceOf(k))})</p><div class="row"><button class="btn ghost" data-a="mkp" data-id="${k}" data-v="-0.1">− 10%</button><button class="btn ghost" data-a="mkp" data-id="${k}" data-v="0.1">+ 10%</button><button class="btn ghost" data-a="mkback" data-id="${k}">เก็บคืน</button></div></div></div>`;
      }).join('') : '<p class="empty">ยังไม่มีของบนแผง ไปที่แท็บ “วางของ”</p>');
    });
  },
  // ----- live customers -----
  init() {
    this.cust = []; this.spawnT = 3;
    const css = document.createElement('style');
    css.textContent = `#haggle{position:fixed;left:50%;bottom:calc(150px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:20;width:min(420px,calc(100vw - 32px));padding:12px 14px}
#haggle p{margin:0 0 8px;font-size:15px;line-height:1.45}#haggle .row{display:flex;gap:8px;justify-content:flex-end}#haggle .tm{height:4px;border-radius:2px;background:#ffd36b;transition:width .2s linear;margin-top:8px}`;
    document.head.appendChild(css);
    const h = document.createElement('div'); h.id = 'haggle'; h.className = 'panel'; h.hidden = true; document.body.appendChild(h); this.hEl = h;
    h.addEventListener('click', e => { const b = e.target.closest('button'); if (b) this.answer(b.dataset.v === 'yes'); });
    // Saturday evening dressing: string lights and three neighbour stalls around yours
    const g = new THREE.Group(); g.visible = false; World.outdoor.add(g); this.deco = g;
    const cols = [0xe53935, 0x43a047, 0x1e88e5], wood = M.wood;
    const spots = [[-3.5, -7], [3.5, -7], [-3.5, 7], [3.5, 7], [-7, 0], [7, 0]].map(([dx, dz]) => [MARKET.x + dx, MARKET.z + dz]).filter(([x, z]) => !Collide.covered(x, z) && roadDist(x, z) > 5.5).slice(0, 3);
    spots.forEach(([x, z], i) => {
      const s = new THREE.Group(), y = World.groundY(x, z); s.position.set(x, y, z); s.rotation.y = Math.atan2(MARKET.x - x, MARKET.z - z); g.add(s);
      U.mk(s, U.box(2.2, 0.85, 1.0, 1), wood, [0, 0.42, 0]);
      for (const a of [-1, 1]) for (const b of [-1, 1]) U.mk(s, GEO.cylLo, M.darkwood, [a * 1.0, 1.15, b * 0.45], [0.05, 2.3, 0.05]);
      const can = U.mk(s, GEO.box, U.mat(cols[i % 3], { map: T.stripes, roughness: 0.9 }), [0, 2.35, 0], [2.5, 0.08, 1.4]); can.rotation.x = 0.12;
      for (let k = 0; k < 5; k++) U.mk(s, GEO.sphLo, U.mat([0xff7043, 0xffd54f, 0x9ccc65, 0xef5350, 0xffa726][k]), [-0.8 + k * 0.4, 0.95, 0.1], 0.13);
    });
    const bulbs = []; this.bulbM = new THREE.MeshBasicMaterial({ color: 0xffd27a, toneMapped: false });
    const ring = [[-8, -8], [8, -8], [8, 8], [-8, 8], [-8, -8]];
    for (let i = 0; i < 4; i++) for (let k = 0; k < 8; k++) {
      const t = k / 8, x = MARKET.x + U.lerp(ring[i][0], ring[i + 1][0], t), z = MARKET.z + U.lerp(ring[i][1], ring[i + 1][1], t), sag = Math.sin(t * Math.PI) * 0.35;
      bulbs.push(U.mk(g, GEO.sphLo, this.bulbM, [x, World.groundY(x, z) + 3.1 - sag, z], 0.07));
    }
    this.st();
  },
  update(dt) {
    if (!G.started || G.simulating) return;
    const h = S.time / 60, eve = this.saturday() && h >= 15 && h < 22;
    this.deco.visible = eve && !G.inside; this.bulbM.color.setScalar(G.night > 0.3 ? 1 : 0.55);
    const live = this.liveNow(), near = !G.inside && Math.hypot(G.player.pos.x - MARKET.x, G.player.pos.z - MARKET.z) < 26;
    if (live && !this.wasLive) { this.st().night = 0; if (near) UI.toast('ตลาดนัดเย็นวันเสาร์เปิดแล้ว! ลูกค้ากำลังมา', '🏮'); }
    if (!live && this.wasLive) { if (this.hag) this.leave(this.hag.c, '😕'); for (const c of this.cust) if (c.st !== 'gone') this.leave(c, null); const n = this.st().night; if (n > 0) UI.toast(`ตลาดนัดเย็นปิดแล้ว คืนนี้ขายได้ ${baht(n)}`, '🏮'); this.closeHaggle(); }
    this.wasLive = live;
    const stock = Object.keys(Farm2.st().mstock).filter(k => Farm2.st().mstock[k] > 0);
    if (live && near && stock.length && !UI.isOpen() && (this.spawnT -= dt) <= 0 && this.cust.length < 3) { this.spawnT = 7 + Math.random() * 8; this.spawn(); }
    for (const c of this.cust.slice()) this.step(c, dt, live);
    if (this.hag && (this.hag.t -= dt) <= 0) this.answer(false);
    if (this.hag) this.hEl.querySelector('.tm').style.width = `${Math.max(0, this.hag.t / 10) * 100}%`;
  },
  spawn() {
    const pool = G.npcs.filter(n => !n.staff && !n.keeper && !n.townRes), who = pool.length ? U.pick(pool).name : 'ลูกค้า';
    const o = Models.human({ avatar: People.avatarFor(who, (Math.random() * 9) | 0) }); World.dyn.add(o);
    const a = Math.random() * TAU, sx = PLAZA.x + Math.cos(a) * 16, sz = PLAZA.z + Math.sin(a) * 16;
    const slot = [0, 1, 2].find(i => !this.cust.some(c => c.slot === i)) ?? 0;
    const c = { o, who, x: sx, z: sz, st: 'come', slot, t: 0, mood: null, home: { x: sx, z: sz } };
    c.tx = MARKET.x + 2.3; c.tz = MARKET.z - 1 + slot; o.position.set(sx, World.groundY(sx, sz), sz); this.cust.push(c);
  },
  walk(c, dt) {
    const dx = c.tx - c.x, dz = c.tz - c.z, d = Math.hypot(dx, dz);
    if (d > 0.15) { const m = Math.min(d, 1.5 * dt); c.x += dx / d * m; c.z += dz / d * m; c.o.rotation.y = Math.atan2(dx, dz); }
    c.o.position.set(c.x, World.groundY(c.x, c.z), c.z); Models.animHuman(c.o, dt, d > 0.15 ? 1.5 : 0, null);
    if (c.mood) c.mood.position.set(c.x, World.groundY(c.x, c.z) + 2.25, c.z);
    return d <= 0.15;
  },
  face(c, e) { if (c.mood) { World.dyn.remove(c.mood); c.mood.material.dispose(); } c.mood = e ? U.sprite(e, 0.5) : null; if (c.mood) World.dyn.add(c.mood); },
  step(c, dt, live) {
    const at = this.walk(c, dt);
    if (c.st === 'come') { if (!live) this.leave(c, null); else if (at) { c.st = 'think'; c.t = 1.2 + Math.random(); c.o.rotation.y = Math.atan2(MARKET.x - c.x, MARKET.z - c.z); this.face(c, '🤔'); } }
    else if (c.st === 'think' && (c.t -= dt) <= 0) this.decide(c);
    else if (c.st === 'haggle' && !this.hag) this.leave(c, '😕');
    else if (c.st === 'gone' && at) { World.dyn.remove(c.o); this.face(c, null); this.cust.splice(this.cust.indexOf(c), 1); }
  },
  leave(c, e) { c.st = 'gone'; c.tx = c.home.x; c.tz = c.home.z; this.face(c, e); },
  decide(c) {
    const f = Farm2.st(), ks = Object.keys(f.mstock).filter(k => f.mstock[k] > 0);
    if (!ks.length) return this.leave(c, '😕');
    const k = U.pick(ks), base = priceOf(k), price = Math.round(base * this.mult(k)), rep = this.st().rep;
    const will = base * U.lerp(1.05, 1.6, Math.random()) * (1 + Math.min(rep, 20) * 0.01), n = Math.min(f.mstock[k], 1 + ((Math.random() * 3) | 0));
    if (price <= will) return this.sell(c, k, price, n, '😊');
    if (price <= will * 1.3 && !this.hag) {
      const offer = Math.max(Math.round(base * 1.05), Math.min(price - 1, Math.round(will)));
      c.st = 'haggle'; this.face(c, '💬');
      this.hag = { c, k, offer, price, n, t: 10 };
      this.hEl.innerHTML = `<p><b>${esc(c.who)}</b>: “${ITEMS[k].n} ${n} ชิ้น ${baht(price * n)} แพงไปหน่อย... ขอ ${baht(offer * n)} ได้ไหม?”</p><div class="row"><button class="btn ghost" data-v="no">ไม่ลด</button><button class="btn" data-v="yes">ตกลง ${baht(offer * n)}</button></div><div class="tm"></div>`;
      this.hEl.hidden = false; Sfx.click(); return;
    }
    this.leave(c, '😕');
  },
  answer(yes) {
    const H = this.hag; if (!H) return; this.closeHaggle();
    const { c, k, offer, price, n } = H;
    if (!(Farm2.st().mstock[k] >= n)) return this.leave(c, '😕');
    if (yes) { this.st().rep += 1; return this.sell(c, k, offer, n, '😄'); }
    if (Math.random() < 0.35) return this.sell(c, k, price, 1, '😤');
    this.leave(c, '😒');
  },
  closeHaggle() { this.hag = null; this.hEl.hidden = true; },
  sell(c, k, p, n, e) {
    const f = Farm2.st(); n = Math.min(n, f.mstock[k] || 0); if (!n) return this.leave(c, '😕');
    f.mstock[k] -= n; const v = p * n; earn(v); this.sold(v, n); this.st().night += v;
    UI.toast(`${c.who} ซื้อ${ITEMS[k].n} ×${n} ${baht(v)}`, ITEMS[k].i); this.leave(c, e);
  },
};

// ===== 6. free home decorating: every piece movable, drag with mouse/finger, top view, overlap check, more colours =====
const FIXED_FURN = { bed: { n: 'เตียง', i: '🛏️' }, kitchen: { n: 'เคาน์เตอร์ครัว', i: '🍳' }, fridge: { n: 'ตู้เย็น', i: '🧊' }, wardrobe: { n: 'ตู้เสื้อผ้า', i: '👕' }, chest: { n: 'หีบเก็บของ', i: '🧰' }, desk: { n: 'โต๊ะคอมพิวเตอร์', i: '💻' } };
function furnInfo(k) { return FURN[k] || FIXED_FURN[k] || { n: k, i: '📦' }; }
WALLS.push({ n: 'ส้มพีช', c: 0xf6d2b8 }, { n: 'ม่วงลาเวนเดอร์', c: 0xdcd0ee }, { n: 'เขียวเซจ', c: 0xc5d3b8 }, { n: 'น้ำเงินกรมท่า', c: 0x5d6f8c }, { n: 'ขาวนวล', c: 0xf7f3ea });
FLOORS.push({ n: 'ไม้โอ๊กอ่อน', c: 0xe0c49a, t: 'wood' }, { n: 'ไม้วอลนัท', c: 0x5a3a26, t: 'wood' }, { n: 'หินอ่อน', c: 0xe8e6e1, t: 'tile' }, { n: 'กระเบื้องเขียว', c: 0xb8d6c0, t: 'tile' }, { n: 'กระเบื้องดินเผา', c: 0xc98a62, t: 'tile' });
const Deco2 = {
  ray: new THREE.Raycaster(), v2: new THREE.Vector2(), plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit: new THREE.Vector3(),
  init() {
    const cv = document.getElementById('c');
    const pick = e => {
      if (!Move.k || !G.inside) return;
      const r = cv.getBoundingClientRect(); this.v2.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      this.ray.setFromCamera(this.v2, G.camera); this.plane.constant = -IN.y;
      if (this.ray.ray.intersectPlane(this.plane, this.hit)) { this.px = this.hit.x - IN.x; this.pz = this.hit.z - IN.z; this.pt = performance.now(); }
    };
    cv.addEventListener('pointerdown', e => { if (Move.k) { this.drag = true; pick(e); } });
    addEventListener('pointermove', e => { if (this.drag) pick(e); });
    addEventListener('pointerup', () => { this.drag = false; });
    addEventListener('keydown', e => {
      if (!Move.k || (e.target && /INPUT|TEXTAREA/.test(e.target.tagName))) return;
      const st = { ArrowLeft: [-0.25, 0], ArrowRight: [0.25, 0], ArrowUp: [0, -0.25], ArrowDown: [0, 0.25] }[e.code];
      if (st) { e.preventDefault(); this.px = (this.px ?? Move.x) + st[0]; this.pz = (this.pz ?? Move.z) + st[1]; this.pt = performance.now(); }
      if (e.code === 'Escape') Move.cancel();
    });
    // the carried piece follows the pointer when you have used it, otherwise it stays in front of you as before
    const _mu = Move.update.bind(Move);
    Move.update = () => {
      _mu(); if (!Move.k) return;
      const o = World.furnObjs[Move.k]; if (!o) return; const r = World.room, snap = v => Math.round(v * 4) / 4;
      if (this.pt && performance.now() - this.pt < 60000) {
        Move.x = U.clamp(snap(this.px), -r.w / 2 + 0.45, r.w / 2 - 0.45); Move.z = U.clamp(snap(this.pz), -r.d / 2 + 0.45, r.d / 2 - 0.45);
        o.obj.position.set(Move.x, 0.03 + Math.sin(G.t * 6) * 0.02, Move.z);
      }
      const hit = this.overlap(); const el = document.getElementById('moveName');
      const txt = `กำลังย้าย: ${furnInfo(Move.k).n}${hit ? ` · ⚠️ ทับกับ${furnInfo(hit).n}` : ''} · ลากด้วยเมาส์/นิ้ว หรือปุ่มลูกศร`;
      if (el.textContent !== txt) el.textContent = txt;
      if (this.grid) this.grid.material.color.set(hit ? 0xff5252 : 0xffffff);
    };
    const _start = Move.start.bind(Move), _done = Move.done.bind(Move), _place = Move.place.bind(Move);
    Move.start = k => {
      this.px = this.pz = this.pt = null; _start(k);
      if (Move.k && World.interior) { const r = World.room; this.grid = new THREE.GridHelper(Math.max(r.w, r.d), Math.max(r.w, r.d) * 2, 0xffffff, 0xffffff); this.grid.material.transparent = true; this.grid.material.opacity = 0.25; this.grid.position.y = 0.02; World.interior.add(this.grid); }
    };
    Move.done = () => { if (this.grid) { this.grid.parent && this.grid.parent.remove(this.grid); this.grid.geometry.dispose(); this.grid.material.dispose(); this.grid = null; } _done(); };
    Move.place = () => { const hit = this.overlap(); if (hit) { UI.toast(`วางทับ${furnInfo(hit).n}ไม่ได้ ขยับออกนิดนึงนะ`, '⚠️'); return; } _place(); };
    // look down on the room while arranging
    const _uc = updateCamera;
    updateCamera = dt => {
      _uc(dt); if (!Move.k || !G.inside || Cut.on) return;
      const r = World.room, cp = G.camera.position; cp.set(IN.x + Move.x * 0.35, IN.y + Math.max(r.w, r.d) * 0.95, IN.z + r.d * 0.62 + Move.z * 0.35);
      G.camera.lookAt(IN.x + Move.x * 0.35, IN.y, IN.z + Move.z * 0.2);
    };
  },
  box: new THREE.Box3(), box2: new THREE.Box3(),
  overlap() {
    const k = Move.k, o = World.furnObjs[k]; if (!o) return null;
    this.box.setFromObject(o.obj).expandByScalar(-0.06);
    for (const [k2, p] of Object.entries(World.furnObjs)) {
      if (k2 === k || !p.obj.parent || ['rug', 'painting'].includes(k2) || ['rug', 'painting'].includes(k)) continue;
      this.box2.setFromObject(p.obj); if (this.box.intersectsBox(this.box2)) return k2;
    }
    return null;
  },
  // extra decor tab entries: the built-in pieces can be moved too
  fixedHTML() {
    return `<h5>ของติดบ้าน (ย้ายได้)</h5><div class="grid">${Object.keys(FIXED_FURN).map(k => `<div class="card"><div class="ci">${FIXED_FURN[k].i}</div><div class="cb"><h4>${FIXED_FURN[k].n}</h4><div class="row"><button class="btn" data-a="move" data-id="${k}">ย้าย/หมุน</button></div></div></div>`).join('')}</div>`;
  },
};

// ===== wiring =====
const Life6 = {
  init() {
    Cut.init(); Market6.init(); Deco2.init();
    const _us = updateSky; updateSky = function () { _us(); Seasons2.update(); };
    const _ua = updateAnimals; updateAnimals = dt => { _ua(dt); Ranch2.update(); };
    const _sb = Social.buttons.bind(Social); Social.buttons = n => _sb(n) + VStory.buttons(n);
    const _gift = Friends.gift.bind(Friends);
    Friends.gift = (n, id) => {
      if (S.daily.gift[n.name] || !count(id) || dislikeOf(n.name) !== (ITEMS[id].base || id)) return _gift(n, id);
      takeItem(id); S.daily.gift[n.name] = 1; S.friends[n.name] = Math.max(0, Friends.get(n.name) - 0.5); n.wave = 0.6;
      UI.toast(`${n.name}: “เอ่อ... ${ITEMS[id].n} เหรอ ไม่ค่อยชอบเลยนะ” 💔 -0.5`, '😣');
    };
    Farm2.marketUI = () => Market6.ui();
    const _dec = UI.decor.bind(UI);
    UI.decor = () => { _dec(); const r = UI.cur.render; UI.cur.render = t => r(t) + (t === 1 ? Deco2.fixedHTML() : ''); UI.renderBody(); };
    const _sm = Smart.morning; Smart.morning = function () { const r = _sm.apply(this, arguments); Life6.day(); return r; };
    APPS.push({ id: 'saga', i: '📜', n: 'เรื่องราวหมู่บ้าน' }, { id: 'stories', i: '📖', n: 'สมุดความทรงจำ' }, { id: 'ranch', i: '🐮', n: 'ฟาร์มสัตว์' });
    Phone.apps.saga = () => Saga.app(); Phone.apps.stories = () => VStory.app(); Phone.apps.ranch = () => Ranch2.app();
    if (typeof APP_GROUPS !== 'undefined') { APP_GROUPS[1][1].push('saga', 'stories'); APP_GROUPS[2][1].push('ranch'); }
    const dock = document.getElementById('dock');
    if (dock) { const b = document.createElement('button'); b.className = 'panel'; b.title = 'เรื่องราวหมู่บ้าน'; b.textContent = '📜'; b.onclick = e => { e.stopPropagation(); Phone.open('saga'); }; dock.appendChild(b); }
    Object.assign(UI.H, {
      vstory: () => VStory.open(UI.talkTo), vsnext: () => VStory.step(), vsend: () => VStory.finish(),
      sagafund: () => Saga.fund(), sagare: d => { UI.close(); Cut.play(SAGA[+d.v].intro); },
      mkp: d => { const f = Farm2.st(); Market6.st(); f.mprice[d.id] = U.clamp(+(Market6.mult(d.id) + +d.v).toFixed(2), 0.8, 3); Sfx.click(); UI.renderBody(); },
      mkback: d => { const m = Farm2.st().mstock, n = m[d.id] || 0; if (n) { addItem(d.id, n); m[d.id] = 0; } UI.renderBody(); },
    });
    Saga.st(); VStory.st(); Market6.st();
    // a spouse who came from a far town: build that town (it is lazy) so they can move back in after a reload
    { const r = Social.st(); if (r.stage === 'married' && r.partner && !G.npcs.some(n => n.name === r.partner) && Town3.ensure) for (const k of ['chiang', 'city']) { if (G.npcs.some(n => n.name === r.partner)) break; Town3.ensure(k); } }
  },
  update(dt) { Market6.update(dt); Saga.update(dt); },
  day() { Ranch2.day(); },
};
