// v64_events.js: street events get a small answer window now that the "ข่าว & เหตุการณ์" phone app is gone.
// A window pops up once when the event happens (waits if another window is open): scam call, cash-on-delivery parcel, stray dog, PM2.5, dengue.
V23.add('v64_events', () => {
  if (typeof RL === 'undefined' || typeof UI === 'undefined') return;
  const E = s => (typeof esc === 'function' ? esc(s) : String(s));
  const pending = [];
  const ask = k => { if (!pending.includes(k)) pending.push(k); };
  const _scam = RL.scam.bind(RL); RL.scam = function () { const r = _scam.apply(this, arguments); ask('scam'); return r; };
  const _start = RL.start.bind(RL); RL.start = function (k) { const r = _start.apply(this, arguments); if (['cod', 'dog', 'pm25', 'dengue'].includes(k)) ask(k); return r; };
  // what each window says and offers: [icon, title, text(), [[label, RL action, dangerous?], ...]]
  const W = {
    scam: ['📞', 'สายจาก "เจ้าหน้าที่ DSI"', () => { const a = RL.st().scam; return a ? `บอกว่าบัญชีของคุณพัวพันการฟอกเงิน ให้โอน ${baht(a.amt)} มาตรวจสอบด่วน ไม่งั้นจะถูกจับ` : ''; }, [['วางสาย แจ้ง 1441', 'scamReport'], ['โอนเงินตามที่บอก', 'scamPay', 1]], () => !!RL.st().scam],
    cod: ['📦', 'พัสดุเก็บเงินปลายทาง', () => 'มีพัสดุเก็บเงินปลายทาง 790 ฿ มาส่ง แต่คุณจำไม่ได้ว่าสั่งอะไร', [['ปฏิเสธรับ', 'codRefuse'], ['จ่ายเงินรับของ', 'codPay', 1]], () => !!RL.on('cod')],
    dog: ['🐕', 'หมาจรเข้ามาในไร่', () => 'หมาจรหลงเข้ามาไล่กวดไก่จนตื่นตกใจ จะทำอย่างไรดี', [['รับมาเลี้ยง', 'dogAdopt'], ['แจ้งปศุสัตว์อำเภอ', 'dogCall']], () => !!RL.on('dog')],
    pm25: ['😷', 'ฝุ่น PM2.5 สูง', () => `ค่าฝุ่นเกินมาตรฐาน ทำงานกลางแจ้งเหนื่อยขึ้น (ตอนนี้มีหน้ากาก N95 ${count('n95')} ชิ้น)`, [['ไว้ก่อน', ''], ['ซื้อ N95 5 ชิ้น 350 ฿', 'mask']], () => !!RL.on('pm25')],
    dengue: ['🦟', 'ไข้เลือดออกระบาด', () => 'สาธารณสุขเตือนให้คว่ำภาชนะ เทน้ำขัง กำจัดลูกน้ำยุงลาย ปลอดยุง 7 วัน', [['ไว้ก่อน', ''], ['คว่ำภาชนะ เทน้ำขัง (พลังงาน 8)', 'dengue']], () => !!RL.on('dengue')],
  };
  UI.H.rlpop = d => { UI.close(); if (d.v) RL.act(d.v); };
  const show = k => {
    const w = W[k]; if (!w || !w[4]()) return;
    UI.open(w[1], null, () => `<p class="lead">${w[0]} ${E(w[2]())}</p><div class="row end">${w[3].map(([t, a, bad]) => `<button class="btn ${bad ? 'danger' : a ? '' : 'ghost'}" data-a="rlpop" data-v="${a}">${E(t)}</button>`).join('')}</div>`);
  };
  setInterval(() => { try { if (!pending.length || !G.started || G.simulating || G.paused || UI.isOpen()) return; show(pending.shift()); } catch (e) { } }, 2500);
});
