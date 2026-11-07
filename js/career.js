'use strict';
// ---------- Main careers that work like real jobs: application requirements and entry exams, a real work
// schedule with clock-in at the workplace, late/absence rules with written warnings and dismissal,
// leave quotas, monthly pay slips (1 game week = 1 month) with social security / pension deductions,
// promotion by performance and time in rank (some ranks need a promotion exam), and misconduct that gets you fired ----------
const JOBS2 = {
  police: { n: 'ตำรวจ', i: '👮', at: /สถานีตำรวจทุ่งทอง/, gov: 1, days: [0, 1, 2, 4, 5], start: w => (w % 2 ? 14 : 6), req: 'สอบข้อเขียน + ทดสอบสมรรถภาพ (ฟิต +2 ขึ้นไป) · แต้มใบขับขี่ต่ำกว่า 3', ok: () => (S.fit || 0) >= 2 && Stations2.st().points < 3,
    ranks: [['สิบตำรวจตรี (ส.ต.ต.)', 15000], ['สิบตำรวจโท (ส.ต.ท.)', 17000], ['สิบตำรวจเอก (ส.ต.อ.)', 19000], ['จ่าสิบตำรวจ (จ.ส.ต.)', 21000], ['ดาบตำรวจ (ด.ต.)', 24000], ['ร้อยตำรวจตรี (ร.ต.ต.)', 28000, 1], ['ร้อยตำรวจโท (ร.ต.ท.)', 32000], ['ร้อยตำรวจเอก (ร.ต.อ.)', 37000], ['พันตำรวจตรี (พ.ต.ต.) สารวัตร', 43000, 1], ['พันตำรวจโท (พ.ต.ท.) รองผู้กำกับ', 50000], ['พันตำรวจเอก (พ.ต.อ.) ผู้กำกับการ', 60000, 1]],
    q: [['ขับรถเกินกำหนดความเร็วในเขตชุมชน ตำรวจควรทำอย่างไร', ['ออกใบสั่งตามกฎหมาย', 'เรียกเงินแล้วปล่อยไป', 'ไม่ต้องทำอะไร'], 0], ['ผู้ต้องหามีสิทธิ์อะไรเมื่อถูกจับกุม', ['ไม่มีสิทธิ์ใด ๆ', 'พบและปรึกษาทนาย แจ้งญาติได้', 'ต้องรับสารภาพทันที'], 1], ['เกิดอุบัติเหตุมีผู้บาดเจ็บ สิ่งแรกที่ต้องทำ', ['กั้นพื้นที่และเรียกรถพยาบาล 1669', 'ถ่ายรูปลงโซเชียล', 'เคลื่อนย้ายรถก่อน'], 0]] },
  nurse: { n: 'พยาบาล', i: '👩‍⚕️', at: /โรงพยาบาลทุ่งทอง/, gov: 1, days: [0, 1, 2, 3, 4], start: w => (w % 2 ? 15 : 7), req: 'Lv.3 ขึ้นไป + สอบความรู้การพยาบาล', ok: () => S.lvl >= 3,
    ranks: [['ผู้ช่วยพยาบาล', 13000], ['พยาบาลวิชาชีพปฏิบัติการ', 18000, 1], ['พยาบาลวิชาชีพชำนาญการ', 26000], ['พยาบาลวิชาชีพชำนาญการพิเศษ', 36000, 1], ['หัวหน้าพยาบาล', 48000]],
    q: [['ผู้ป่วยหมดสติ ไม่หายใจ ควรทำอะไรก่อน', ['ให้ดื่มน้ำ', 'เริ่มทำ CPR และเรียกทีมฉุกเฉิน', 'รอให้ฟื้นเอง'], 1], ['ก่อนให้ยาผู้ป่วยต้องตรวจสอบอะไร', ['ชื่อผู้ป่วย ยา ขนาด เวลา วิธีให้', 'ดูแค่สีของยา', 'ไม่ต้องตรวจ'], 0], ['ล้างมือที่ถูกต้องควรใช้เวลาอย่างน้อย', ['3 วินาที', '20 วินาที', 'ไม่ต้องล้าง'], 1]] },
  teacher: { n: 'ครู', i: '👩‍🏫', at: /โรงเรียนบ้านสุขใจ/, gov: 1, days: [0, 1, 2, 3, 4], start: () => 8, req: 'Lv.3 ขึ้นไป + สอบครูผู้ช่วย', ok: () => S.lvl >= 3,
    ranks: [['ครูผู้ช่วย', 15800], ['ครู คศ.1', 18000], ['ครูชำนาญการ คศ.2', 25000, 1], ['ครูชำนาญการพิเศษ คศ.3', 35000, 1], ['ครูเชี่ยวชาญ คศ.4', 45000, 1], ['ผู้อำนวยการโรงเรียน', 55000, 1]],
    q: [['นักเรียนทำการบ้านไม่เสร็จ ครูควร', ['ตีให้จำ', 'คุยหาสาเหตุและช่วยวางแผน', 'ประจานหน้าห้อง'], 1], ['การวัดผลที่ดีควร', ['หลากหลาย ทั้งงาน สอบ และการสังเกต', 'สอบปลายภาคอย่างเดียว', 'ไม่ต้องวัดผล'], 0], ['ห้องเรียนมีเด็กเรียนช้า ควร', ['ปล่อยไว้', 'สอนเสริมและใช้สื่อที่เหมาะกับเด็ก', 'ให้ย้ายโรงเรียน'], 1]] },
  bank: { n: 'พนักงานธนาคาร', i: '🏦', at: /ธนาคารสุขใจ สาขาทุ่งทอง/, days: [0, 1, 2, 3, 4], start: () => 8, req: 'Lv.2 ขึ้นไป + สัมภาษณ์งาน', ok: () => S.lvl >= 2,
    ranks: [['พนักงานต้อนรับ', 15000], ['พนักงานบริการลูกค้า (Teller)', 18000], ['เจ้าหน้าที่สินเชื่อ', 25000, 1], ['ผู้ช่วยผู้จัดการสาขา', 38000], ['ผู้จัดการสาขา', 55000, 1]],
    q: [['ลูกค้าขอเปิดบัญชี ต้องใช้อะไร', ['บัตรประชาชนตัวจริง', 'แค่บอกชื่อ', 'รูปถ่ายเซลฟี่'], 0], ['มีคนโทรอ้างเป็นลูกค้าขอรหัส OTP', ['ให้รหัสไป', 'ปฏิเสธ เพราะอาจเป็นมิจฉาชีพ', 'ให้ครึ่งเดียว'], 1], ['ดอกเบี้ยทบต้นคืออะไร', ['ดอกเบี้ยที่คิดจากเงินต้นรวมดอกเบี้ยเดิม', 'ดอกเบี้ยที่ไม่ต้องจ่าย', 'ค่าธรรมเนียม ATM'], 0]] },
  electrician: { n: 'ช่างไฟฟ้า (การไฟฟ้า)', i: '👷', at: /การไฟฟ้าอำเภอสุขใจ/, days: [0, 1, 2, 3, 4], start: () => 8, req: 'ไม่มีเงื่อนไข เริ่มจากช่างฝึกหัด · ได้ส่วนลดค่าช่างไฟบ้านตัวเอง 40%', ok: () => true,
    ranks: [['ช่างไฟฝึกหัด', 11000], ['ช่างไฟฟ้าระดับ 1', 15000, 1], ['ช่างไฟฟ้าระดับ 2 (ใบรับรองฝีมือ)', 20000, 1], ['หัวหน้าช่าง', 28000], ['วิศวกรไฟฟ้า', 40000, 1]],
    q: [['ก่อนซ่อมสายไฟต้องทำอะไร', ['ตัดไฟและล็อกเบรกเกอร์', 'ใส่ถุงมือผ้าก็พอ', 'ทำตอนไฟยังมา'], 0], ['สายดินมีไว้เพื่อ', ['ให้ไฟรั่วไหลลงดิน ลดอันตรายไฟดูด', 'ประหยัดไฟ', 'ตกแต่ง'], 0], ['เบรกเกอร์ RCBO ทำหน้าที่', ['ตัดไฟเมื่อมีไฟรั่วและกระแสเกิน', 'เพิ่มแรงดันไฟ', 'นับหน่วยไฟ'], 0]] },
  programmer: { n: 'โปรแกรมเมอร์', i: '🧑‍💻', at: /คอมพิวเตอร์พลาซ่า/, wfh: 1, days: [0, 1, 2, 3, 4], start: () => 9, req: 'ต้องมีคอมพิวเตอร์และเคยประกอบคอมเอง + สอบเขียนโค้ด · ทำงานจากบ้านได้ถ้าเน็ตเร็ว 100 Mbps+', ok: () => (S.pcs || []).length > 0 && (S.pcSkill || 0) >= 1,
    ranks: [['นักศึกษาฝึกงาน', 9000], ['Junior Developer', 25000, 1], ['Developer', 40000], ['Senior Developer', 65000, 1], ['Tech Lead', 90000], ['CTO', 130000, 1]],
    q: [['Git ใช้ทำอะไร', ['จัดการเวอร์ชันของโค้ด', 'ตัดต่อวิดีโอ', 'ป้องกันไวรัส'], 0], ['ผลของ 3 + "3" ใน JavaScript คือ', ['6', '"33"', 'error'], 1], ['ก่อนปล่อยโค้ดขึ้นระบบจริงควร', ['ทดสอบและให้เพื่อนรีวิว', 'ปล่อยเลยวันศุกร์เย็น', 'ลบเทสต์ทิ้ง'], 0]] },
  chef: { n: 'เชฟ', i: '👨‍🍳', at: /ร้านอาหารจีนเจ๊กิม/, days: [1, 2, 3, 4, 5, 6], start: () => 10, req: 'เคยทำอาหาร 5 ครั้งขึ้นไป', ok: () => (S.stats.cooked || 0) >= 5,
    ranks: [['ผู้ช่วยครัว', 11000], ['กุ๊ก', 15000], ['หัวหน้าแผนก (Chef de Partie)', 20000], ['ซูเชฟ', 28000, 1], ['หัวหน้าเชฟ', 40000]],
    q: [['เนื้อไก่ดิบควรเก็บที่อุณหภูมิ', ['ต่ำกว่า 5°C', 'อุณหภูมิห้อง', 'กลางแดด'], 0], ['เขียงหั่นเนื้อดิบกับผักสุก', ['ใช้ร่วมกันได้', 'ควรแยกกันป้องกันเชื้อโรค', 'ล้างด้วยน้ำเปล่าพอ'], 1], ['FIFO ในครัวหมายถึง', ['ของเข้าก่อนใช้ก่อน', 'ทอดก่อนต้ม', 'ปลาก่อนผัก'], 0]] },
  carsales: { n: 'พนักงานขายรถ', i: '🚗', at: /โชว์รูมรถทุ่งทองมอเตอร์/, days: [0, 1, 2, 4, 5, 6], start: () => 9, req: 'ต้องมีใบขับขี่ · ได้ค่าคอมมิชชันเมื่อขายรถได้', ok: () => !!S.license,
    ranks: [['เซลส์ฝึกหัด', 12000], ['เซลส์', 15000], ['เซลส์อาวุโส', 20000], ['ผู้จัดการฝ่ายขาย', 35000, 1]],
    q: [['ลูกค้าถามเรื่องที่ไม่รู้คำตอบ', ['ตอบมั่ว ๆ ไปก่อน', 'ขอเวลาตรวจสอบแล้วตอบที่ถูกต้อง', 'เปลี่ยนเรื่อง'], 1], ['ลูกค้ายังไม่พร้อมซื้อวันนี้', ['กดดันให้ซื้อ', 'ให้ข้อมูลและติดตามอย่างสุภาพ', 'ไม่สนใจ'], 1], ['ทดลองขับต้องตรวจอะไรก่อน', ['ใบขับขี่ของลูกค้า', 'สีรถ', 'ไม่ต้องตรวจ'], 0]] },
  firefighter: { n: 'พนักงานดับเพลิง', i: '🧑‍🚒', at: /ดับเพลิง/, gov: 1, days: [0, 2, 4, 6], start: () => 8, req: 'ทดสอบสมรรถภาพ (ฟิต +2 ขึ้นไป) + สอบความรู้', ok: () => (S.fit || 0) >= 2,
    ranks: [['พนักงานดับเพลิง', 13000], ['พนักงานดับเพลิงชำนาญงาน', 17000], ['หัวหน้าหน่วยกู้ภัย', 24000, 1], ['หัวหน้าสถานีดับเพลิง', 35000, 1]],
    q: [['ไฟไหม้จากน้ำมัน ห้ามใช้อะไรดับ', ['น้ำ', 'ถังดับเพลิงชนิดผงเคมี', 'ผ้าห่มดับไฟ'], 0], ['เบอร์แจ้งเหตุดับเพลิง', ['191', '199', '1669'], 1], ['ก่อนเข้าอาคารที่มีควัน ต้อง', ['ใส่อุปกรณ์ช่วยหายใจ', 'กลั้นหายใจ', 'วิ่งเข้าเร็ว ๆ'], 0]] },
  vet: { n: 'สัตวแพทย์', i: '🩺', at: /ศูนย์สัตว์เลี้ยงภูผา/, days: [0, 1, 2, 3, 4], start: () => 9, req: 'เลี้ยงสัตว์อย่างน้อย 1 ตัว + สอบความรู้', ok: () => (S.pets || []).length + S.animals.length > 0,
    ranks: [['ผู้ช่วยสัตวแพทย์', 13000], ['สัตวแพทย์', 30000, 1], ['สัตวแพทย์ชำนาญการ', 45000], ['ผู้อำนวยการโรงพยาบาลสัตว์', 65000, 1]],
    q: [['สุนัขควรฉีดวัคซีนพิษสุนัขบ้า', ['ทุกปี', 'ครั้งเดียวตลอดชีวิต', 'ไม่ต้องฉีด'], 0], ['ช็อกโกแลตเป็นพิษกับสัตว์ชนิดใด', ['สุนัขและแมว', 'ไม่เป็นพิษเลย', 'เฉพาะนก'], 0], ['สัตว์ป่วยหายใจลำบาก ควร', ['รีบตรวจและให้ออกซิเจน', 'รอดูอาการพรุ่งนี้', 'ให้กินขนม'], 0]] },
};
// one decision per shift: [situation, [choice, perf change, result, special]]
const JOB_EVENTS = {
  police: [['เจอรถขับเร็วเกินกำหนด คนขับยื่นเงิน 2,000 บาทขอให้ปล่อย', [['ออกใบสั่งตามกฎหมาย', 2, 'ทำตามกฎหมาย หัวหน้าชมเชย'], ['รับเงินไว้', 0, '', 'bribe']]], ['ได้รับแจ้งเหตุลักทรัพย์ในตลาด', [['รีบไปที่เกิดเหตุและเก็บหลักฐาน', 3, 'จับคนร้ายได้!'], ['ส่งต่อเวรถัดไป', -2, 'ผู้เสียหายร้องเรียน']]]],
  nurse: [['ผู้ป่วยกดกริ่งเรียกพร้อมกันสองเตียง', [['ประเมินอาการหนักก่อน', 3, 'ตัดสินใจถูกต้อง ผู้ป่วยปลอดภัย'], ['ไปเตียงที่ใกล้กว่า', 0, 'โชคดีไม่มีอะไร']]], ['หมอสั่งยาขนาดดูผิดปกติ', [['สอบถามแพทย์ก่อนให้ยา', 3, 'พบว่าเขียนผิดจริง ป้องกันเหตุร้ายได้'], ['ให้ตามสั่ง', -3, 'ผู้ป่วยมีอาการข้างเคียง ถูกตักเตือน']]]],
  teacher: [['นักเรียนทะเลาะกันในห้อง', [['แยกคุยและไกล่เกลี่ย', 3, 'นักเรียนคืนดีกัน'], ['ลงโทษทั้งห้อง', -1, 'ผู้ปกครองไม่พอใจ']]], ['ผู้อำนวยการขอให้ทำสื่อการสอนใหม่', [['ทำสื่อจากของในไร่', 3, 'เด็ก ๆ ชอบมาก'], ['ใช้ของเดิม', 0, 'ไม่มีอะไรเปลี่ยน']]]],
  bank: [['ลูกค้าสูงอายุถูกหลอกให้โอนเงินให้คนแปลกหน้า', [['ชะลอการโอนและอธิบายให้ฟัง', 3, 'ช่วยลูกค้าไม่ให้ถูกโกง!'], ['ทำตามที่ลูกค้าขอ', -2, 'ลูกค้าถูกหลอก ธนาคารถูกร้องเรียน']]], ['เพื่อนขอให้แอบอนุมัติสินเชื่อทั้งที่เอกสารไม่ครบ', [['ปฏิเสธตามระเบียบ', 2, 'ทำงานโปร่งใส'], ['ช่วยอนุมัติ', 0, '', 'fraud']]]],
  electrician: [['หม้อแปลงในหมู่บ้านมีเสียงดังผิดปกติ', [['แจ้งดับไฟชั่วคราวแล้วซ่อมตามขั้นตอน', 3, 'ซ่อมเสร็จปลอดภัย'], ['ซ่อมทั้งที่ไฟยังมา', -3, 'เกือบโดนไฟดูด ถูกตักเตือนเรื่องความปลอดภัย']]], ['ชาวบ้านขอให้ต่อไฟพ่วงแบบไม่ผ่านมิเตอร์', [['ปฏิเสธ แนะนำยื่นคำร้องให้ถูกต้อง', 2, 'ทำงานถูกต้อง'], ['รับเงินแล้วต่อให้', 0, '', 'bribe']]]],
  programmer: [['ระบบล่มกลางดึกตอนลูกค้าใช้งาน', [['ช่วยทีมไล่หาสาเหตุ', 3, 'แก้ได้ภายใน 30 นาที'], ['ปิดโทรศัพท์', -2, 'หัวหน้าไม่พอใจ']]], ['มีงานด่วนแต่โค้ดยังไม่มีเทสต์', [['เขียนเทสต์ก่อนส่ง', 2, 'ไม่มีบัคหลุด'], ['ส่งเลย', -1, 'มีบัคหลุดไปถึงลูกค้า']]]],
  chef: [['ลูกค้าแพ้อาหารทะเลสั่งผัดไทย', [['แยกกระทะและเครื่องปรุง', 3, 'ลูกค้าปลอดภัยและประทับใจ'], ['ทำปกติ', -3, 'ลูกค้ามีอาการแพ้']]], ['ออเดอร์เข้าพร้อมกัน 20 โต๊ะ', [['จัดลำดับและสื่อสารกับทีม', 3, 'ออกอาหารทันเวลา'], ['ทำตามใจ', 0, 'ช้าไปบ้าง']]]],
  carsales: [['ลูกค้าครอบครัวมาดูรถ', [['สอบถามความต้องการแล้วแนะนำรุ่นที่เหมาะ', 3, 'ขายรถได้!', 'sale'], ['เชียร์รุ่นแพงสุด', 0, 'ลูกค้าขอคิดดูก่อน']]], ['ลูกค้าขอส่วนลดเกินอำนาจ', [['ขออนุมัติผู้จัดการ', 2, 'ปิดการขายได้', 'sale'], ['ตกลงเอง', -2, 'ถูกตักเตือน']]]],
  firefighter: [['แจ้งเหตุไฟไหม้หญ้าข้างทาง', [['ออกรถภายใน 1 นาที', 3, 'ดับไฟได้ก่อนลุกลาม'], ['รอทีมให้ครบ', 0, 'ไปถึงช้าไปหน่อย']]], ['ตรวจถังดับเพลิงตามบ้าน', [['ตรวจละเอียดทุกหลัง', 2, 'ชาวบ้านขอบคุณ'], ['ตรวจผ่าน ๆ', -1, 'มีถังหมดอายุหลุดไป']]]],
  vet: [['สุนัขกินยาเบื่อหนูเข้าไป', [['ทำให้อาเจียนและให้วิตามินเค', 3, 'ช่วยชีวิตไว้ได้'], ['ให้กลับไปสังเกตอาการ', -3, 'อาการทรุด เจ้าของร้องเรียน']]], ['แมวจรบาดเจ็บถูกนำมาส่ง', [['รักษาฟรีและหาบ้านให้', 2, 'ชาวเมืองชื่นชม'], ['ปฏิเสธ', -1, 'ถูกวิจารณ์ในโซเชียล']]]],
};

const Career = {
  st() { if (!S.job) S.job = { k: null, rank: 0, pts: 0, weeks: 0, warn: 0, late: 0, absent: 0, done: {}, clock: null, leave: { sick: 3, biz: 3, year: 0 }, onLeave: {}, banned: {}, slips: [], examOK: 0 }; return S.job; },
  is(k) { const j = S && S.job; return !!(j && j.k === k); },
  C() { const j = this.st(); return j.k ? JOBS2[j.k] : null; },
  week() { return Math.floor((S.day - 1) / 7); },
  dayIdx(d = S.day) { return (d - 1) % 7; },
  shift(d = S.day) { const C = this.C(); if (!C || !C.days.includes(this.dayIdx(d))) return null; const s = C.start(Math.floor((d - 1) / 7)); return { start: s, end: s + 8 }; },
  rankName() { const C = this.C(); return C ? C.ranks[this.st().rank][0] : ''; },
  salary() { const C = this.C(); return C ? C.ranks[this.st().rank][1] : 0; },
  // ----- applying -----
  apply(k) {
    const C = JOBS2[k], j = this.st();
    if (j.k) { UI.toast('ลาออกจากงานเดิมก่อน', '💼'); return; }
    if ((j.banned[k] || 0) > S.day) { UI.toast(`ถูกเลิกจ้างจากที่นี่ สมัครใหม่ได้${RD(j.banned[k])}`, '⛔'); return; }
    if (!C.ok()) { UI.toast('ยังไม่ผ่านคุณสมบัติ: ' + C.req, '📋'); return; }
    this.quiz = { k, i: 0, ok: 0, mode: 'enter' }; this.quizUI();
  },
  quizUI() {
    const q = this.quiz, C = JOBS2[q.k], L = q.mode === 'promo' ? C.q.slice().reverse() : C.q;
    UI.open(q.mode === 'promo' ? 'สอบเลื่อนตำแหน่ง' : `สอบเข้าทำงาน: ${C.n}`, null, () => {
      if (q.i >= L.length) return `<p class="lead">${q.ok >= 2 ? '🎉 สอบผ่าน!' : '❌ ยังไม่ผ่าน ลองใหม่ได้พรุ่งนี้'} (ถูก ${q.ok}/${L.length})</p><div class="row"><button class="btn" data-a="close">ปิด</button></div>`;
      const [t, ch] = L[q.i]; return `<p class="lead">ข้อ ${q.i + 1}/${L.length}: ${t}</p>${ch.map((c, i) => `<button class="btn ghost choice" data-a="jobans" data-i="${i}">${c}</button>`).join('')}`;
    });
  },
  answer(i) {
    const q = this.quiz, C = JOBS2[q.k], L = q.mode === 'promo' ? C.q.slice().reverse() : C.q, j = this.st();
    if (+i === L[q.i][2]) q.ok++; q.i++;
    if (q.i < L.length) return;
    if (q.mode === 'enter') {
      if ((j.tried || {})[q.k] === S.day) return; (j.tried = j.tried || {})[q.k] = S.day;
      if (q.ok >= 2) { Object.assign(j, { k: q.k, rank: 0, pts: 0, weeks: 0, warn: 0, late: 0, absent: 0, done: {}, clock: null, start: S.day }); Life2.note(`ได้งานประจำเป็น${C.n} ตำแหน่ง${C.ranks[0][0]} 💼`); Phone.msg('ฝ่ายบุคคล', `ยินดีต้อนรับเข้าทำงานตำแหน่ง${C.ranks[0][0]} เงินเดือน ${baht(C.ranks[0][1])} เริ่มงานตามตารางในแอปงานประจำ ลงเวลาเข้างานที่${C.n === 'โปรแกรมเมอร์' ? 'คอมพิวเตอร์พลาซ่า (หรือ WFH)' : 'จุดลงเวลาหน้าที่ทำงาน'} สายเกิน 15 นาทีนับเป็นมาสาย`); }
    } else if (q.ok >= 2) this.promote(); else Phone.msg('ฝ่ายบุคคล', 'สอบเลื่อนตำแหน่งไม่ผ่าน สอบใหม่ได้รอบประเมินหน้า', false);
  },
  // ----- clock in & work -----
  clockIn(wfh) {
    const j = this.st(), C = this.C(), sh = this.shift(), now = S.time / 60;
    if (!C) return; if (!sh) { UI.toast('วันนี้เป็นวันหยุดของคุณ', '🏖️'); return; }
    if (j.done[S.day]) { UI.toast('วันนี้ทำงานแล้ว', '✅'); return; }
    if (j.onLeave[S.day]) { UI.toast('วันนี้คุณลางานไว้', '📝'); return; }
    if (now < sh.start - 1) { UI.toast(`ยังไม่ถึงเวลา เข้างาน ${String(sh.start).padStart(2, '0')}:00 (ลงเวลาได้ก่อน 1 ชม.)`, '🕒'); return; }
    if (now > sh.start + 3) { UI.toast('เลยเวลาเข้างานเกิน 3 ชม. วันนี้ถือว่าขาดงาน', '⛔'); return; }
    if (wfh && !(C.wfh && G.inside && (window.PC39 ? PC39.usable() : (S.pcs || []).length) && typeof ISP !== 'undefined' && ISP.speed() >= 100)) { UI.toast('ทำงานจากบ้านได้เฉพาะโปรแกรมเมอร์ ที่บ้าน มีคอม และเน็ต 100 Mbps ขึ้นไป', '🏠'); return; }
    const late = now > sh.start + 0.25; j.done[S.day] = late ? 'late' : 'ok';
    if (late) { j.late++; if (j.late % 3 === 0) this.warn('มาสายครบ 3 ครั้ง'); else UI.toast(`มาสาย! (ครั้งที่ ${j.late % 3}/3 ก่อนได้ใบเตือน)`, '⏰'); }
    const E = U.pick(JOB_EVENTS[j.k]); this.ev = { E, late, sh };
    UI.open(`เข้างาน: ${this.rankName()}`, null, () => `<p class="lead">${late ? '⏰ ลงเวลา (มาสาย) · ' : '✅ ลงเวลาตรงเวลา · '}เลิกงาน ${String(sh.end).padStart(2, '0')}:00</p><p class="lead">📌 ${E[0]}</p>${E[1].map((c, i) => `<button class="btn ghost choice" data-a="jobev" data-i="${i}">${c[0]}</button>`).join('')}`);
  },
  work(i) {
    const j = this.st(), ev = this.ev; if (!ev) return; this.ev = null; const ch = ev.E[1][+i]; UI.close();
    if (ch[3] === 'bribe' || ch[3] === 'fraud') {
      if (Math.random() < 0.45) { fade(() => { tick(120); this.fire(ch[3] === 'bribe' ? 'รับสินบน/ทุจริตต่อหน้าที่' : 'ทุจริตการอนุมัติสินเชื่อ', true); }); return; }
      earn(2000); UI.toast('ได้เงินมา 2,000 ฿ ...แต่ถ้าถูกจับได้จะโดนไล่ออก', '😬');
    }
    const hours = Math.max(1, ev.sh.end - S.time / 60);
    fade(() => {
      tick(hours * 60); useEnergy(Math.round(hours * 3.5)); S.mood = Math.max(0, (S.mood || 50) - 6);
      const perf = U.clamp(5 + ch[1] + (S.energy < 20 ? -2 : 0) + ((S.mood || 50) > 70 ? 1 : 0) + (ev.late ? -1 : 0) + Math.round(Math.random() * 2 - 1), 0, 10);
      j.pts += perf; Prog.add(20);
      let extra = '';
      if (ch[3] === 'sale') { const c = 2500 + ((Math.random() * 3000) | 0); earn(c); Bank2.income('ค่าคอมมิชชันขายรถ', c); extra = ` ได้ค่าคอม ${baht(c)}`; }
      if (j.k === 'police' || j.k === 'firefighter') { const ot = 450; earn(ot); Bank2.income('ค่าเวร/เบี้ยเลี้ยง', ot); }
      UI.toast(`${ch[2] || 'ทำงานเสร็จ'} · ผลงานวันนี้ ${perf}/10${extra}`, JOBS2[j.k].i);
    });
  },
  warn(why) {
    const j = this.st(); j.warn++;
    Phone.msg('ฝ่ายบุคคล', `หนังสือตักเตือนครั้งที่ ${j.warn}/3: ${why} หากครบ 3 ครั้งจะถูกเลิกจ้าง`);
    if (!G.simulating) UI.toast(`ได้ใบเตือนครั้งที่ ${j.warn}/3: ${why}`, '📄');
    if (j.warn >= 3) this.fire('ได้รับหนังสือตักเตือนครบ 3 ครั้ง');
  },
  fire(why, grave) {
    const j = this.st(), C = this.C(); if (!C) return;
    j.banned[j.k] = S.day + (grave ? 60 : 14);
    Phone.msg('ฝ่ายบุคคล', `หนังสือเลิกจ้าง: ${why} มีผลทันที${grave ? ' (ไล่ออกเพราะความผิดร้ายแรง ไม่ได้รับค่าชดเชย)' : ''}`);
    if (!grave) { const svc = j.weeks * 7, sd = svc >= 7300 ? 400 : svc >= 3650 ? 300 : svc >= 2190 ? 240 : svc >= 1095 ? 180 : svc >= 365 ? 90 : svc >= 120 ? 30 : 0, sev = Math.round(this.salary() / 30 * sd); if (sev > 0) { earn(sev); Bank2.income('ค่าชดเชยเลิกจ้าง', sev); } }
    if (grave && j.k === 'police') Stations2.ticket('ถูกไล่ออกจากราชการ', 0);
    Life2.note(`ถูก${grave ? 'ไล่ออก' : 'เลิกจ้าง'}จากงาน${C.n}: ${why}`); UI.toast(`${grave ? 'ถูกไล่ออก' : 'ถูกเลิกจ้าง'}: ${why}`, '⛔');
    Object.assign(j, { k: null, rank: 0, pts: 0, weeks: 0, warn: 0, late: 0, absent: 0, done: {}, onLeave: {} });
  },
  resign() { const j = this.st(), C = this.C(); if (!C) return; Life2.note(`ลาออกจากงาน${C.n}`); Phone.msg('ฝ่ายบุคคล', 'รับเรื่องลาออกแล้ว ขอบคุณที่ร่วมงานกันมา'); j.banned[j.k] = S.day + 3; Object.assign(j, { k: null, rank: 0, pts: 0, weeks: 0, warn: 0, late: 0, absent: 0, done: {}, onLeave: {} }); UI.close(); },
  leave(kind, day) {
    const j = this.st(), q = j.leave; if (!this.shift(day)) { UI.toast('วันนั้นเป็นวันหยุดอยู่แล้ว', '🏖️'); return; }
    if (q[kind] <= 0) { UI.toast('วันลาประเภทนี้หมดแล้วปีนี้', '📝'); return; }
    if (j.onLeave[day] || j.done[day]) return; if (day === S.day && S.time / 60 > this.shift(day).start && kind === 'biz') { UI.toast('ลากิจต้องยื่นก่อนเวลาเข้างาน', '📝'); return; }
    q[kind]--; j.onLeave[day] = kind; UI.toast(`ยื่น${kind === 'sick' ? 'ลาป่วย' : 'ลากิจ'}${RD(day)} อนุมัติแล้ว (เหลือ ${q[kind]} วัน)`, '📝');
  },
  // ----- hourly & weekly checks -----
  hour(h) {
    const j = this.st(); if (!j.k) return; const sh = this.shift();
    // a range, not one exact hour: a long task (harvest, repairs) can jump the clock past it
    if (sh && h >= sh.start + 3 && h < sh.end && !j.done[S.day] && !j.onLeave[S.day]) { j.done[S.day] = 'absent'; j.absent++; this.warn('ขาดงานโดยไม่แจ้งลา'); }
    if (sh && h === sh.start - 1 && !j.done[S.day] && !j.onLeave[S.day] && !G.simulating) UI.toast(`อีก 1 ชม. เข้างาน ${String(sh.start).padStart(2, '0')}:00 ที่${JOBS2[j.k].n === 'โปรแกรมเมอร์' ? 'คอมพิวเตอร์พลาซ่า/WFH' : 'ที่ทำงาน'}`, '⏰');
  },
  // payday every 7th day (end of the game "month")
  payday() {
    const j = this.st(), C = this.C(); if (!C || this.dayIdx() !== 6) return;
    if (Math.floor((S.day - 1) / 28) !== j.leave.year) { j.leave = { sick: 3, biz: 3, year: Math.floor((S.day - 1) / 28) }; }
    const work = C.days.length, days = []; for (let d = S.day - 6; d < S.day; d++) if (C.days.includes(this.dayIdx(d))) days.push(d);
    const absent = days.filter(d => j.done[d] === 'absent').length, gross = this.salary(), cut = Math.round(gross / work * absent);
    const ss = C.gov ? Math.round((gross - cut) * 0.03) : Math.min(875, Math.round(Math.min(gross - cut, 17500) * 0.05)), tax = typeof Biz31 !== 'undefined' ? Biz31.whtMonthly(gross - cut) : Math.max(0, Math.round((gross - cut - 26000) * 0.1)), net = gross - cut - ss - tax;
    earn(net); Bank2.income('เงินเดือน ' + C.n, net);
    j.slips.unshift({ day: S.day, rank: this.rankName(), gross, cut, ss, tax, net, gov: C.gov }); j.slips.length = Math.min(j.slips.length, 6);
    Phone.msg('ฝ่ายบุคคล', `สลิปเงินเดือน: ${this.rankName()} เงินเดือน ${baht(gross)}${cut ? ` หักขาดงาน ${baht(cut)}` : ''} หัก${C.gov ? 'กบข. 3%' : 'ประกันสังคม 5%'} ${baht(ss)}${tax ? ` ภาษี ${baht(tax)}` : ''} รับสุทธิ ${baht(net)}`);
    j.weeks++; for (const d in j.done) if (+d < S.day - 14) delete j.done[d]; for (const d in j.onLeave) if (+d < S.day - 14) delete j.onLeave[d];
    if (j.warn > 0 && absent === 0 && j.weeks % 4 === 0) { j.warn--; Phone.msg('ฝ่ายบุคคล', 'ประพฤติดีต่อเนื่อง ลบใบเตือน 1 ใบ', false); }
    // promotion review
    const next = C.ranks[j.rank + 1]; if (!next) return;
    const need = 22 + j.rank * 10, wk = 1 + Math.floor(j.rank / 2);
    if (j.pts >= need && j.weeks >= wk) { if (next[2]) { j.examOK = 1; Phone.msg('ฝ่ายบุคคล', `คุณมีสิทธิ์สอบเลื่อนเป็น${next[0]} สอบได้ในแอปงานประจำ`); } else this.promote(); }
  },
  promote() {
    const j = this.st(), C = this.C(), next = C.ranks[j.rank + 1]; if (!next) return;
    j.rank++; j.pts = 0; j.weeks = 0; j.examOK = 0; Prog.add(80);
    Phone.msg('ฝ่ายบุคคล', `🎉 ได้รับการแต่งตั้งเป็น${next[0]} เงินเดือนใหม่ ${baht(next[1])}`); Life2.note(`เลื่อนตำแหน่งเป็น${next[0]} 🎖️`); if (!G.simulating) UI.toast(`เลื่อนตำแหน่งเป็น${next[0]}!`, '🎖️');
  },
  // ----- UI -----
  html(tab) {
    const j = this.st(), C = this.C();
    if (tab === 1 || !C) return `<p class="lead">งานประจำ (ทำได้ทีละงาน) · 1 สัปดาห์ในเกม = 1 เดือน · เงินเดือนออกทุกวันที่ 7 ของสัปดาห์</p><div class="grid">${Object.entries(JOBS2).map(([k, X]) => `<div class="card"><div class="ci">${X.i}</div><div class="cb"><h4>${X.n}</h4><p class="dim">เริ่ม ${X.ranks[0][0]} ${baht(X.ranks[0][1])}/เดือน → สูงสุด ${X.ranks[X.ranks.length - 1][0]} · ทำงาน ${X.days.length} วัน/สัปดาห์${X.gov ? ' · ข้าราชการ' : ''}</p><p class="dim">คุณสมบัติ: ${X.req}</p><div class="row"><button class="btn" data-a="jobapply" data-v="${k}" ${j.k || (j.banned[k] || 0) > S.day || (j.tried || {})[k] === S.day ? 'disabled' : ''}>${(j.banned[k] || 0) > S.day ? 'ห้ามสมัครถึง' + RD(j.banned[k]) : (j.tried || {})[k] === S.day ? 'สอบแล้ววันนี้' : 'สมัครงาน'}</button></div></div></div>`).join('')}</div>`;
    const sh = this.shift(), next = C.ranks[j.rank + 1], days = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];
    return `<div class="grid"><div class="card"><div class="ci">${C.i}</div><div class="cb"><h4>${this.rankName()}</h4><p class="dim">${C.n} · เงินเดือน ${baht(this.salary())} · อายุงานในตำแหน่ง ${j.weeks} เดือน · คะแนนผลงาน ${j.pts}${next ? `/${22 + j.rank * 10} (ตำแหน่งถัดไป: ${next[0]}${next[2] ? ' ต้องสอบ' : ''})` : ' · ตำแหน่งสูงสุดแล้ว'}</p><p class="${j.warn ? 'bad' : 'dim'}">ใบเตือน ${j.warn}/3 · มาสายสะสม ${j.late} · ขาดงาน ${j.absent} · วันลาเหลือ: ป่วย ${j.leave.sick} กิจ ${j.leave.biz}</p></div></div>
      <div class="card"><div class="ci">📅</div><div class="cb"><h4>วันนี้ ${sh ? `เข้างาน ${String(sh.start).padStart(2, '0')}:00-${String(sh.end).padStart(2, '0')}:00` : 'วันหยุด'}</h4><p class="dim">วันทำงาน: ${C.days.map(d => days[d]).join(' ')} · ${j.done[S.day] ? 'ลงเวลาแล้ว' : j.onLeave[S.day] ? 'ลางาน' : 'ยังไม่ลงเวลา'}</p><div class="row">${C.wfh ? '<button class="btn" data-a="jobwfh">ลงเวลาทำงานจากบ้าน (WFH)</button>' : ''}<button class="btn ghost" data-a="jobleave" data-k="sick" data-v="${S.day}">ลาป่วยวันนี้</button><button class="btn ghost" data-a="jobleave" data-k="biz" data-v="${S.day + 1}">ลากิจพรุ่งนี้</button>${j.examOK ? '<button class="btn" data-a="jobpromo">สอบเลื่อนตำแหน่ง</button>' : ''}</div></div></div></div>
      ${j.slips.length ? `<h5>สลิปเงินเดือน</h5><table class="tbl"><tr><th>วันที่</th><th>ตำแหน่ง</th><th>เงินเดือน</th><th>หักขาดงาน</th><th>${C.gov ? 'กบข.' : 'ประกันสังคม'}</th><th>ภาษี</th><th>สุทธิ</th></tr>${j.slips.map(x => `<tr><td>${x.day}</td><td>${esc(x.rank)}</td><td>${U.fmt(x.gross)}</td><td>${x.cut}</td><td>${x.ss}</td><td>${x.tax}</td><td><b>${U.fmt(x.net)}</b></td></tr>`).join('')}</table>` : ''}
      <div class="row"><button class="btn danger" data-a="jobquit">ลาออก</button></div>`;
  },
  open() { UI.open('งานประจำ', ['งานของฉัน', 'หางานใหม่'], t => this.html(t), { wide: true }); },
  init() {
    this.st();
    for (const [k, C] of Object.entries(JOBS2)) {
      const p = World.pois.find(q => q.label && C.at.test(q.label) && q.x < 2500); if (!p) continue;
      // beside the door but off the road and out of anything solid
      const [x, z] = [[2.2, 0], [-2.2, 0], [0, 2.2], [0, -2.2], [2.2, 1.6], [-2.2, 1.6], [2.2, -1.6], [-2.2, -1.6]].map(([dx, dz]) => [p.x + dx, p.z + dz]).filter(([qx, qz]) => !Collide.covered(qx, qz)).sort((a, b) => Math.min(6, roadDist(b[0], b[1])) - Math.min(6, roadDist(a[0], a[1])))[0] || [p.x + 2.2, p.z];
      const g = new THREE.Group(), y = World.groundY(x, z); g.position.set(x, y, z); World.outdoor.add(g);
      U.mk(g, GEO.box, mc(0x455a64), [0, 0.6, 0], [0.35, 1.2, 0.25]); U.mk(g, GEO.box, new THREE.MeshBasicMaterial({ color: 0x4fc3f7, toneMapped: false }), [0, 1.05, 0.13], [0.22, 0.16, 0.01]); const col = Col.circle(x, z, 0.25);
      World.pois.push({ job: k, grp: g, col, kind: 'act', x, z: z + 0.6, r: 1.6, label: 'เครื่องสแกนลงเวลา', icon: '🕒', act: () => this.is(k) ? { icon: '🕒', label: `ลงเวลาเข้างาน (${C.n})`, fn: () => this.clockIn() } : { icon: '💼', label: `สมัครงาน${C.n}ที่นี่`, fn: () => { this.open(); UI.cur.tab = 1; UI.renderBody(); } } });
    }
  },
};
APPS.splice(6, 0, { id: 'career', i: '💼', n: 'งานประจำ' });
Phone.apps.career = () => { setTimeout(() => { Phone.app = null; UI.close(); Career.open(); }, 0); return ''; };
Object.assign(UI.H, {
  jobapply: d => Career.apply(d.v), jobans: d => Career.answer(d.i), jobev: d => Career.work(d.i), jobwfh: () => { UI.close(); Career.clockIn(true); },
  jobleave: d => Career.leave(d.k, +d.v), jobquit: () => Career.resign(), jobpromo: () => { const j = Career.st(); if (!j.examOK) return; Career.quiz = { k: j.k, i: 0, ok: 0, mode: 'promo' }; j.examOK = 0; Career.quizUI(); },
});
