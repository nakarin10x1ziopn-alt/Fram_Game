// v73_report.js: "แจ้งปัญหา": a problem-report centre in the phone (and the emergency list) for everything that can go wrong around the farm
//  pick a topic, pick the exact problem, add details; the right agency takes the case, gives a reference number and an arrival time, texts you when it starts and when it is done.
//  Reports about things the game really simulates change them: power cut (crew restores it), internet down (technician), bank card locked (reset), sick animals (vet), etc.
V23.add('v73_report', () => {
  if (typeof APPS === 'undefined' || !Phone.apps) return;
  const E = s => (typeof esc === 'function' ? esc(s) : String(s));
  const st = () => { const s = S.v73 = S.v73 || {}; s.list = s.list || []; s.seq = s.seq || 0; return s; };
  const now = () => S.day * 1440 + S.time;
  const toast = (t, i) => { try { UI.toast(t, i || '📣'); } catch (e) { } };
  const safe = (f, d) => { try { const v = f(); return v == null ? d : v; } catch (e) { return d; } };
  const zoneName = () => { const p = G.player.pos, z = zoneAt(p.x, p.z); return (G.inside ? 'ในบ้าน' : z ? z.n : 'นอกพื้นที่') + ` (${Math.round(p.x)}, ${Math.round(p.z)})`; };

  // agencies: name, sms sender, phone number for the list
  const AG = {
    pea: ['การไฟฟ้าอำเภอสุขใจ', '1129'], isp: ['ผู้ให้บริการอินเทอร์เน็ต', '1111'], pwa: ['การประปาสุขใจ', '1662'], road: ['ทางหลวงชนบท / อบต.สุขใจ', '1146'], police: ['สถานีตำรวจภูธรสุขใจ', '191'], fire: ['สถานีดับเพลิงสุขใจ', '199'],
    med: ['ศูนย์เอราวัณ / รพ.ทุ่งทอง', '1669'], bank: ['ธนาคารสุขใจ', '1555'], vet: ['ปศุสัตว์อำเภอ / ศูนย์สัตว์เลี้ยงภูผา', '1170'], env: ['เทศบาล / สิ่งแวดล้อม', '1132'], hoa: ['นิติบุคคลหมู่บ้าน', '—'], gov: ['ที่ว่าการอำเภอสุขใจ', '1567'], post: ['ไปรษณีย์สุขใจ', '1545'], tow: ['บริการกู้ภัยรถยนต์', '1193'], dopa: ['สำนักงานคุ้มครองผู้บริโภค', '1166'],
  };
  // topic -> problems. [id, label, agency, hours until the crew arrives, hours to fix, fee, kind]
  const TOPICS = [
    { id: 'power', i: '⚡', n: 'ไฟฟ้า', p: [['out', 'ไฟดับ', 'pea', 1, 2, 0, 'power'], ['wire', 'สายไฟขาด / สายไฟห้อยต่ำ / เสาไฟล้ม (อันตราย!)', 'pea', 1, 3, 0], ['lamp', 'ไฟถนนดับ / ไฟทางเดินไม่ติด', 'pea', 6, 3, 0], ['surge', 'ไฟตก ไฟกระชาก ไฟกะพริบ', 'pea', 4, 2, 0], ['meter', 'มิเตอร์ไฟผิดปกติ / ค่าไฟสูงผิดปกติ', 'pea', 12, 4, 0]] },
    { id: 'net', i: '🌐', n: 'อินเทอร์เน็ต / โทรศัพท์', p: [['down', 'เน็ตดับ ใช้งานไม่ได้', 'isp', 2, 2, 0, 'net'], ['slow', 'เน็ตช้ากว่าที่สมัคร', 'isp', 6, 2, 0, 'slow'], ['cable', 'สายเน็ต / สายสื่อสารขาด ห้อยต่ำ', 'isp', 3, 3, 0], ['router', 'เราเตอร์ / อุปกรณ์เสีย', 'isp', 6, 2, 0], ['signal', 'โทรศัพท์ไม่มีสัญญาณ', 'isp', 8, 4, 0]] },
    { id: 'water', i: '💧', n: 'น้ำประปา', p: [['none', 'น้ำไม่ไหล / น้ำไม่มา', 'pwa', 2, 3, 0], ['pipe', 'ท่อประปาแตก น้ำรั่วหน้าบ้าน', 'pwa', 2, 3, 0], ['dirty', 'น้ำขุ่น มีสี หรือมีกลิ่น', 'pwa', 6, 3, 0], ['weak', 'น้ำไหลอ่อนผิดปกติ', 'pwa', 8, 4, 0]] },
    { id: 'road', i: '🛣️', n: 'ถนนและทางสัญจร', p: [['pothole', 'ถนนเป็นหลุม ชำรุด', 'road', 24, 6, 0], ['tree', 'ต้นไม้ล้มขวางทาง', 'road', 3, 2, 0], ['flood', 'น้ำท่วมขังถนน / ท่อระบายน้ำตัน', 'road', 6, 4, 0], ['sign', 'ป้ายจราจร / ไฟสัญญาณชำรุด', 'road', 24, 3, 0], ['bridge', 'สะพาน / ราวสะพานชำรุด', 'road', 24, 8, 0]] },
    { id: 'safe', i: '🚨', n: 'ความปลอดภัยและเหตุฉุกเฉิน', p: [['fire', 'ไฟไหม้ / ควันไฟ', 'fire', 0, 0, 0, 'dial199'], ['thief', 'ขโมย / ผู้บุกรุก / ของหาย', 'police', 0, 0, 0, 'dial191'], ['accident', 'อุบัติเหตุบนถนน', 'police', 0, 0, 0, 'dial191'], ['medical', 'ผู้ป่วยฉุกเฉิน / บาดเจ็บ', 'med', 0, 0, 0, 'dial1669'], ['noise', 'เสียงดัง / เหตุรำคาญ', 'police', 4, 1, 0], ['animal', 'งู / สัตว์ดุร้ายเข้าบริเวณบ้าน', 'police', 3, 2, 0], ['gas', 'แก๊สรั่ว / กลิ่นแก๊ส', 'fire', 1, 1, 0]] },
    { id: 'money', i: '🏦', n: 'การเงินและบัญชีธนาคาร', p: [['card', 'บัตร ATM หาย / ถูกล็อก ใช้ไม่ได้', 'bank', 1, 1, 0, 'card'], ['atm', 'ตู้ ATM ขัดข้อง / ไม่คายเงิน', 'bank', 6, 4, 0], ['scam', 'โอนเงินผิด / ถูกหลอกให้โอน (มิจฉาชีพ)', 'bank', 1, 6, 0], ['app', 'แอปธนาคารใช้ไม่ได้', 'bank', 4, 2, 0], ['fee', 'ค่าธรรมเนียม / ยอดเงินผิดปกติ', 'bank', 12, 8, 0]] },
    { id: 'animal', i: '🐄', n: 'สัตว์เลี้ยงและปศุสัตว์', p: [['sick', 'สัตว์ในฟาร์มป่วย', 'vet', 3, 2, 300, 'heal'], ['escape', 'สัตว์หลุดออกจากคอก', 'vet', 2, 1, 0], ['disease', 'สงสัยโรคระบาดสัตว์', 'vet', 6, 6, 0], ['pet', 'สัตว์เลี้ยงหาย / บาดเจ็บ', 'vet', 3, 2, 300]] },
    { id: 'env', i: '🗑️', n: 'สิ่งแวดล้อมและสุขอนามัย', p: [['trash', 'ขยะล้น / กองขยะสะสม', 'env', 24, 4, 0], ['smell', 'กลิ่นเหม็น / น้ำเสีย', 'env', 12, 6, 0], ['pm', 'ควันไฟ / ฝุ่น PM2.5 จากการเผา', 'env', 6, 4, 0], ['pest', 'หนู / ยุง / แมลงระบาด', 'env', 24, 8, 0], ['tree2', 'ตัดต้นไม้ใกล้สายไฟ / กิ่งไม้หัก', 'env', 24, 4, 0]] },
    { id: 'home', i: '🏠', n: 'บ้านและชุมชน', p: [['pipe2', 'ท่อน้ำภายในบ้านรั่ว / ท่อตัน', 'hoa', 12, 4, 500], ['light', 'ไฟส่วนกลางชำรุด', 'hoa', 24, 4, 0], ['fence', 'รั้ว / ประตูส่วนกลางชำรุด', 'hoa', 48, 8, 0], ['neigh', 'ปัญหากับเพื่อนบ้าน', 'hoa', 24, 2, 0]] },
    { id: 'scam', i: '📞', n: 'หลอกลวงและกฎหมาย', p: [['call', 'สายโทรศัพท์ / SMS หลอกลวง', 'police', 2, 1, 0], ['link', 'ลิงก์ปลอม / ถูกดูดเงิน', 'bank', 1, 6, 0], ['shop', 'ร้านค้าหลอก / สินค้าไม่ตรงปก', 'dopa', 12, 12, 0]] },
    { id: 'doc', i: '🪪', n: 'เอกสารและบริการราชการ', p: [['id', 'บัตรประชาชนหาย', 'gov', 24, 24, 0], ['parcel', 'พัสดุหาย / ส่งช้า', 'post', 12, 24, 0], ['permit', 'ติดตามเรื่องที่ยื่นไว้', 'gov', 24, 24, 0]] },
    { id: 'car', i: '🚗', n: 'ยานพาหนะ', p: [['break', 'รถเสียกลางทาง ขอกู้ภัย / ลากรถ', 'tow', 1, 2, 800, 'tow'], ['fuel', 'น้ำมันหมดกลางทาง', 'tow', 1, 1, 400, 'tow'], ['light2', 'รถถูกตัดหรือขโมย', 'police', 0, 0, 0, 'dial191']] },
  ];
  const find = (t, p) => { const T = TOPICS.find(x => x.id === t); return T ? [T, T.p.find(x => x[0] === p)] : [null, null]; };

  // ---------- submitting ----------
  function submit(tid, pid, note) {
    const s = st(), [T, P] = find(tid, pid); if (!P) return;
    const [, label, ag, arr, fix, fee, kind] = P;
    if (kind && kind.startsWith('dial')) { UI.close(); Phone.dial(kind.slice(4)); logTicket(T, P, note, true); return; }
    const open = s.list.find(t => t.st !== 'done' && t.tid === tid && t.pid === pid);
    if (open) { toast(`เรื่องนี้แจ้งไว้แล้ว (เลขที่ ${open.no}) กำลังดำเนินการอยู่`, 'ℹ️'); return; }
    if (fee && S.money < fee) { toast(`ค่าบริการ ${baht(fee)} เงินสดไม่พอ`, '💸'); return; }
    if (fee) { S.money -= fee; try { Bank2.log(`ค่าบริการแจ้งปัญหา: ${label}`, -fee); } catch (e) { } }
    // does the problem really exist? (only for things the game simulates)
    let real = true;
    if (kind === 'power') real = safe(() => Power.st().out > 0, false) || safe(() => Grid.st().src === 'none', false);
    if (kind === 'net') real = safe(() => ISP.st().down > 0, false);
    if (kind === 'card') real = safe(() => Bank71.st().lockDay === S.day, false) || true;
    const t = logTicket(T, P, note, false); t.real = real; t.fee = fee;
    t.at = now() + Math.round(arr * 60); t.done = t.at + Math.round(fix * 60); t.st = arr ? 'received' : 'working';
    Phone.msg(AG[ag][0], `รับเรื่องแจ้ง "${label}" แล้ว เลขที่ ${t.no} · สถานที่ ${t.where} · เจ้าหน้าที่จะถึงภายใน ${arr >= 24 ? Math.round(arr / 24) + ' วัน' : arr + ' ชั่วโมง'}${fee ? ` · ค่าบริการ ${baht(fee)}` : ''}`);
    toast(`แจ้งแล้ว เลขที่ ${t.no} · ${AG[ag][0]} รับเรื่อง`, '✅');
    U.step = 'done'; U.last = t;
  }
  function logTicket(T, P, note, instant) {
    const s = st(), t = { no: 'R' + String(++s.seq).padStart(4, '0'), tid: T.id, pid: P[0], label: P[1], ag: P[2], day: S.day, time: Math.floor(S.time), where: zoneName(), note: String(note || '').slice(0, 120), st: instant ? 'done' : 'received', at: 0, done: 0, kind: P[6] || '' };
    s.list.unshift(t); if (s.list.length > 40) s.list.length = 40; return t;
  }

  // ---------- progress ----------
  function process() {
    const s = st(), n = now();
    for (const t of s.list) {
      if (t.st === 'done' || !t.at) continue;
      const A = AG[t.ag];
      if (t.st === 'received' && n >= t.at) { t.st = 'working'; if (!G.simulating) Phone.msg(A[0], `เจ้าหน้าที่ถึงพื้นที่แล้ว กำลังดำเนินการเรื่อง "${t.label}" (เลขที่ ${t.no})`, true); }
      if (t.st === 'working' && n >= t.done) { t.st = 'done'; resolve(t); }
    }
  }
  function resolve(t) {
    const A = AG[t.ag]; let txt = `ดำเนินการเรื่อง "${t.label}" เสร็จสิ้นแล้ว (เลขที่ ${t.no})`;
    if (t.kind === 'power') { if (t.real) { safe(() => { const p = Power.st(); if (p.out > 0) p.out = 0; }); txt = 'ซ่อมระบบไฟฟ้าเสร็จแล้ว กระแสไฟกลับมาใช้งานได้ตามปกติ'; } else txt = 'ตรวจสอบแล้วไม่พบไฟดับที่ระบบของการไฟฟ้า ลองเช็กเบรกเกอร์ในบ้านและการชำระค่าไฟ'; }
    else if (t.kind === 'net') { if (t.real) { safe(() => { const i = ISP.st(); if (i.down > 0) i.down = 0; }); txt = 'ช่างแก้ไขสัญญาณเรียบร้อย อินเทอร์เน็ตใช้งานได้ตามปกติ'; } else txt = 'ช่างตรวจสอบแล้วสัญญาณปกติ ลองรีสตาร์ตเราเตอร์ หรือตรวจสอบการชำระค่าบริการ'; }
    else if (t.kind === 'slow') txt = `ช่างตรวจสอบเส้นสัญญาณแล้ว ความเร็วที่วัดได้ ${safe(() => ISP.speed(), 0)} Mbps ตามแพ็กเกจที่สมัคร หากต้องการเร็วขึ้นอัปเกรดแพ็กเกจได้`;
    else if (t.kind === 'card') { safe(() => { const v = Bank71.st(); v.lockDay = 0; v.fails = 0; v.pin = '123456'; v.changed = 0; }); txt = 'ปลดล็อกบัตร ATM และรีเซ็ตรหัสผ่านเป็น 123456 แล้ว กรุณาเปลี่ยนรหัสใหม่ที่ตู้ ATM'; }
    else if (t.kind === 'heal') { let n = 0; for (const a of (S.animals || [])) if (a.sick) { a.sick = false; n++; } txt = n ? `สัตวแพทย์รักษาสัตว์ป่วย ${n} ตัว หายดีแล้ว` : 'สัตวแพทย์ตรวจฝูงสัตว์ทั้งหมดแล้ว ไม่พบตัวป่วย แนะนำให้ดูแลอาหารและความสะอาดต่อเนื่อง'; }
    else if (t.kind === 'tow') { txt = 'รถกู้ภัยช่วยเหลือเสร็จแล้ว ' + (t.pid === 'fuel' ? 'เติมน้ำมันให้ 5 ลิตร' : 'ลากรถไปจอดที่ปลอดภัยแล้ว'); safe(() => { if (t.pid === 'fuel' && G.cars && G.cars[0] && typeof G.cars[0].fuel === 'number') G.cars[0].fuel += 5; }); }
    else if (t.pid === 'wire' || t.pid === 'cable') txt = 'ซ่อมสายที่ขาดเรียบร้อยและตรวจความปลอดภัยแล้ว (ระหว่างนี้ห้ามเข้าใกล้สายที่ห้อยอยู่)';
    else if (t.pid === 'pothole') txt = 'ซ่อมผิวถนนเรียบร้อยแล้ว';
    else if (t.pid === 'tree') txt = 'เคลื่อนย้ายต้นไม้ที่ล้มออกจากทางแล้ว สัญจรได้ตามปกติ';
    else if (t.pid === 'scam') txt = 'ธนาคารอายัดรายการและส่งเรื่องให้ตำรวจไซเบอร์แล้ว ติดตามผลภายใน 7 วัน ระวังอย่าให้รหัส OTP กับใคร';
    else if (t.pid === 'id') txt = 'รับแจ้งบัตรประชาชนหายแล้ว ขอทำบัตรใหม่ได้ที่ฝ่ายทะเบียนราษฎร ที่ว่าการอำเภอ';
    Phone.msg(A[0], txt, false); if (!G.simulating) toast(`${A[0]}: ${t.label} เสร็จสิ้น`, '✅');
  }
  { const _t = tick; tick = function () { const r = _t.apply(this, arguments); try { process(); } catch (e) { console.warn('v73', e); } return r; }; }

  // ---------- UI ----------
  const U = { step: 'topics', tid: null, pid: null, last: null, tab: 0 };
  const ST = { received: '📥 รับเรื่องแล้ว', working: '🛠️ กำลังดำเนินการ', done: '✅ เสร็จสิ้น' };
  function newHtml() {
    if (U.step === 'done' && U.last) { const t = U.last, A = AG[t.ag]; return `<div class="card" style="grid-template-columns:46px 1fr"><div class="ci">✅</div><div class="cb"><h4>รับเรื่องแล้ว · เลขที่ ${t.no}</h4><p>${E(t.label)}</p><p class="dim">${E(A[0])} · สถานที่ ${E(t.where)}</p><p class="dim">ติดตามสถานะได้ที่แท็บ "ติดตามเรื่อง" และจะมีข้อความแจ้งเมื่อเจ้าหน้าที่ถึงและเมื่อเสร็จ</p></div></div><div class="row"><button class="btn" data-a="rp73" data-v="topics">แจ้งเรื่องอื่น</button><button class="btn ghost" data-a="rp73" data-v="track">ติดตามเรื่อง</button></div>`; }
    if (U.step === 'topics') return `<p class="lead">เลือกหัวข้อที่ต้องการแจ้ง · เหตุฉุกเฉินโทร <b>191</b> ตำรวจ · <b>199</b> ดับเพลิง · <b>1669</b> การแพทย์ฉุกเฉิน</p><div class="grid" style="grid-template-columns:repeat(2,1fr);gap:8px">${TOPICS.map(T => `<button class="btn ghost" style="display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 6px" data-a="rp73" data-v="topic|${T.id}"><span style="font-size:26px">${T.i}</span>${E(T.n)}<small class="dim">${T.p.length} เรื่อง</small></button>`).join('')}</div>`;
    const T = TOPICS.find(x => x.id === U.tid);
    if (U.step === 'problems' && T) return `<p class="lead">${T.i} ${E(T.n)} · เลือกปัญหาที่พบ</p>${T.p.map(P => { const A = AG[P[2]]; return `<div class="card"><div class="ci">${T.i}</div><div class="cb"><h4>${E(P[1])}</h4><p class="dim">แจ้งที่ ${E(A[0])}${A[1] !== '—' ? ' · โทร ' + A[1] : ''}${P[5] ? ` · ค่าบริการ ${baht(P[5])}` : ''}</p></div><button class="btn" data-a="rp73" data-v="pick|${P[0]}">แจ้งเรื่องนี้</button></div>`; }).join('')}<div class="row"><button class="btn ghost" data-a="rp73" data-v="topics">← เลือกหัวข้ออื่น</button></div>`;
    if (U.step === 'form' && T) { const P = T.p.find(x => x[0] === U.pid), A = AG[P[2]]; return `<div class="card" style="grid-template-columns:46px 1fr"><div class="ci">${T.i}</div><div class="cb"><h4>${E(P[1])}</h4><p class="dim">ส่งถึง ${E(A[0])}</p></div></div><p class="dim">สถานที่เกิดเหตุ: <b>${E(zoneName())}</b> (ตามตำแหน่งปัจจุบันของคุณ)</p><div class="row"><input id="rp73Note" maxlength="120" placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ) เช่น เสาไฟหน้าไร่ต้นที่ 2" style="flex:1;min-width:0;padding:8px;border-radius:10px;border:1px solid #ccc"></div>${P[5] ? `<p class="dim">ค่าบริการ ${baht(P[5])} (หักจากเงินสด)</p>` : ''}${P[6] && P[6].startsWith('dial') ? '<p class="dim">เรื่องนี้เป็นเหตุฉุกเฉิน ระบบจะโทรสายด่วนให้ทันที</p>' : `<p class="dim">เจ้าหน้าที่จะถึงภายในประมาณ ${P[3] >= 24 ? Math.round(P[3] / 24) + ' วัน' : P[3] + ' ชั่วโมง'}</p>`}<div class="row"><button class="btn" data-a="rp73" data-v="send">📣 ส่งเรื่องแจ้ง</button><button class="btn ghost" data-a="rp73" data-v="topic|${T.id}">← กลับ</button></div>`; }
    return '';
  }
  function trackHtml() {
    const l = st().list; if (!l.length) return '<p class="empty">ยังไม่เคยแจ้งปัญหา</p>';
    return l.slice(0, 20).map(t => { const A = AG[t.ag]; return `<div style="display:grid;grid-template-columns:1fr auto;gap:2px 10px;padding:8px 2px;border-bottom:1px solid rgba(255,255,255,.1);font-size:13.5px"><span><b>${E(t.no)}</b> ${E(t.label)}<br><small class="dim">${E(A[0])} · ${RD(t.day)} ${String(Math.floor(t.time / 60)).padStart(2, '0')}:${String(t.time % 60).padStart(2, '0')} · ${E(t.where)}${t.note ? '<br>“' + E(t.note) + '”' : ''}</small></span><span style="text-align:right">${ST[t.st] || t.st}<br>${t.st !== 'done' && t.at ? `<small class="dim">ถึง ${RD(Math.floor(t.at / 1440))}</small>` : ''}</span></div>`; }).join('');
  }
  const numbers = () => `<h5>เบอร์โทรศูนย์รับแจ้ง</h5><div class="grid">${Object.keys(AG).filter(k => AG[k][1] !== '—').map(k => `<div class="card"><div class="ci">☎️</div><div class="cb"><h4>${E(AG[k][0])}</h4><p class="dim">โทร ${AG[k][1]}</p></div></div>`).join('')}</div>`;
  function open() { U.step = 'topics'; UI.open('📣 ศูนย์รับแจ้งปัญหา', ['แจ้งปัญหาใหม่', 'ติดตามเรื่อง', 'เบอร์โทร'], t => { U.tab = t; return t === 0 ? newHtml() : t === 1 ? trackHtml() : numbers(); }, { wide: true }); }
  UI.H.rp73 = d => {
    const [a, x] = String(d.v || '').split('|');
    if (a === 'topics') { U.step = 'topics'; U.tid = null; }
    else if (a === 'topic') { U.step = 'problems'; U.tid = x; }
    else if (a === 'pick') { U.step = 'form'; U.pid = x; }
    else if (a === 'send') submit(U.tid, U.pid, (document.getElementById('rp73Note') || {}).value);
    else if (a === 'track') { if (UI.cur) UI.cur.tab = 1; }
  };
  if (!APPS.some(a => a.id === 'report73')) APPS.splice(Math.min(APPS.length, 3), 0, { id: 'report73', i: '📣', n: 'แจ้งปัญหา' });
  Phone.apps.report73 = () => { setTimeout(() => { Phone.app = null; UI.close(); open(); }, 0); return ''; };
  try { if (typeof APP_GROUPS !== 'undefined') { const gr = APP_GROUPS.find(x => /ชีวิต|บริการ|ฉุกเฉิน/.test(x[0])) || APP_GROUPS[0]; if (gr && !gr[1].includes('report73')) gr[1].unshift('report73'); } } catch (e) { }
  window.Report73 = { open, TOPICS, AG, submit, st };
});
