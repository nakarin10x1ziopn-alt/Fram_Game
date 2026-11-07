'use strict';
// ---------- v166_bankplus: bank app extras ----------
// * transfer PIN (6 digits, 3 wrong tries lock transfers for the day) and a daily transfer limit you can lower
// * standing orders: the bank pays a shop / landlord for you on a day of every month, texts you, warns 3 days ahead if the money is short
// * cheques you RECEIVE (customers pay for produce by cheque): deposit them (app up to 50,000 clears in 2 banking days, branch clears next day),
//   post-dated ones wait for their date, they expire after 180 days, and now and then one bounces (small fee)
// Data: S.v49.cfg {pin, day, pinFail, pinLock}, S.v49.so [], S.v49.rcv []
V23.add('v166_bankplus', () => {
  const B = window.Bank49; if (!B || typeof UI === 'undefined') return;
  const E = s => (typeof esc === 'function' ? esc(String(s == null ? '' : s)) : String(s == null ? '' : s));
  const money = n => (typeof baht === 'function' ? baht(Math.round(n)) : '฿' + Math.round(n));
  const toast = (t, i) => { try { UI.toast(t, i || '🏦'); } catch (e) { } };
  const val = id => (document.getElementById(id) || {}).value;
  const msg = (t, good) => { try { Phone.msg('ธนาคารสุขใจ', t, !!good); } catch (e) { } };
  const V = () => { const v = B.V(); v.cfg = v.cfg || {}; v.so = v.so || []; v.rcv = v.rcv || []; if (!v.soSeq) v.soSeq = 0; if (!v.rcvSeq) v.rcvSeq = 0; return v; };
  const capture = () => (UI.cur ? { title: UI.cur.title, tabs: UI.cur.tabs, tab: UI.cur.tab, render: UI.cur.render, wide: UI.cur.wide } : null);
  const restore = p => { if (p && p.title) UI.open(p.title, p.tabs && p.tabs.length ? p.tabs : null, p.render, { tab: p.tab, wide: p.wide }); else UI.close(); };
  const mkOf = d => { try { const t = Cal36.date(d); return t.be * 12 + t.m; } catch (e) { return Math.floor(d / 30); } };
  const domOf = d => { try { return Cal36.date(d).dom; } catch (e) { return ((d - 1) % 28) + 1; } };
  const f1 = 'font:inherit;font-size:16px;padding:8px;border-radius:10px;border:1px solid #ccc;margin:2px 0;min-width:0';

  // ===================== PIN + limits =====================
  const PN = { cb: null, cancel: null, prev: null, txt: '', msg: '' };
  const pinOn = () => !!V().cfg.pin;
  function pin(cb, cancel) {
    const c = V().cfg;
    if (c.pinLock === S.day) { toast('ล็อกการโอนชั่วคราว (กรอก PIN ผิดครบ 3 ครั้ง) ลองใหม่พรุ่งนี้', '🔒'); if (cancel) cancel(); return; }
    PN.cb = cb; PN.cancel = cancel; PN.txt = ''; PN.msg = ''; PN.prev = capture();
    UI.open('🔐 ยืนยันรหัส PIN', null, () => `<p class="lead">กรอกรหัส PIN 6 หลักเพื่อยืนยันการโอน</p>
      <div class="row"><input id="s163Pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" placeholder="● ● ● ● ● ●" oninput="BankPlus.PN.txt=this.value" style="flex:1;font:inherit;font-size:24px;letter-spacing:8px;text-align:center;padding:10px;border-radius:12px;border:2px solid #b9a77a;background:#fffdf3;color:#3a2f10"></div>
      ${PN.msg ? `<p style="color:#ffb3a3;font-weight:600">${E(PN.msg)}</p>` : ''}
      <div class="row end"><button class="btn ghost" data-a="s163pinx">ยกเลิก</button><button class="btn" data-a="s163pinok">✅ ยืนยัน</button></div>`, {});
    setTimeout(() => { const e = document.getElementById('s163Pin'); if (e) e.focus(); }, 80);
  }
  UI.H.s163pinx = () => { const f = PN.cancel, p = PN.prev; PN.cb = null; PN.cancel = null; if (f) f(); else restore(p); };
  UI.H.s163pinok = () => {
    const c = V().cfg; if (!PN.cb) return;
    if (String(PN.txt) === String(c.pin)) { c.pinFail = 0; const f = PN.cb, p = PN.prev; PN.cb = null; PN.cancel = null; restore(p); f(); return; }
    c.pinFail = (c.pinFail || 0) + 1; PN.txt = '';
    if (c.pinFail >= 3) { c.pinLock = S.day; c.pinFail = 0; toast('กรอก PIN ผิดครบ 3 ครั้ง ล็อกการโอนจนถึงพรุ่งนี้', '🔒'); msg('⚠️ มีการกรอกรหัส PIN ผิด 3 ครั้ง ระบบล็อกการโอนผ่านแอปจนถึงพรุ่งนี้', false); UI.H.s163pinx(); return; }
    PN.msg = `รหัส PIN ไม่ถูกต้อง (เหลืออีก ${3 - c.pinFail} ครั้ง)`; toast('รหัส PIN ไม่ถูกต้อง', '❌');
  };
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target && e.target.id === 's163Pin') { e.preventDefault(); const b = document.querySelector('#mBody [data-a="s163pinok"]'); if (b) b.click(); } });
  const six = x => /^\d{6}$/.test(String(x || ''));
  UI.H.s163pinset = () => { const a = val('s163Pn1'), b = val('s163Pn2'); if (!six(a)) { toast('PIN ต้องเป็นตัวเลข 6 หลัก', 'ℹ️'); return; } if (a !== b) { toast('PIN สองช่องไม่ตรงกัน', 'ℹ️'); return; } V().cfg.pin = a; toast('ตั้งรหัส PIN แล้ว ต่อไปการโอนผ่านแอปต้องกรอก PIN', '🔐'); msg('ตั้งรหัส PIN สำหรับโอนเงินเรียบร้อย', true); };
  UI.H.s163pinchg = () => { const c = V().cfg; if (val('s163Pn0') !== c.pin) { toast('PIN ปัจจุบันไม่ถูกต้อง', '❌'); return; } const a = val('s163Pn1'); if (!six(a)) { toast('PIN ใหม่ต้องเป็นตัวเลข 6 หลัก', 'ℹ️'); return; } c.pin = a; toast('เปลี่ยนรหัส PIN แล้ว', '🔐'); };
  UI.H.s163pinoff = () => { const c = V().cfg; if (val('s163Pn0') !== c.pin) { toast('กรอก PIN ปัจจุบันเพื่อปิด', '❌'); return; } delete c.pin; toast('ปิดรหัส PIN แล้ว', '🔓'); };
  UI.H.s163lim = d => { V().cfg.day = +d.v; toast(`ตั้งวงเงินโอนต่อวันเป็น ${money(+d.v)} แล้ว`, '🏦'); };
  function secHtml() {
    const c = V().cfg, on = !!c.pin, lim = B.dayLim(), inp = (id, ph) => `<input id="${id}" type="password" inputmode="numeric" maxlength="6" autocomplete="off" placeholder="${ph}" style="flex:1;${f1}">`;
    return `<div class="card"><div class="ci">🔐</div><div class="cb"><h4>รหัส PIN ยืนยันการโอน</h4><p class="dim">${on ? 'เปิดอยู่ · โอน/พร้อมเพย์/ชำระผ่านแอปต้องกรอก PIN 6 หลัก (ผิด 3 ครั้งล็อกทั้งวัน)' : 'ยังไม่ได้ตั้ง · ตั้งแล้วทุกการโอนผ่านแอปต้องกรอก PIN'}</p>
      ${on ? `<div class="row">${inp('s163Pn0', 'PIN ปัจจุบัน')}</div><div class="row">${inp('s163Pn1', 'PIN ใหม่ 6 หลัก')}<button class="btn" data-a="s163pinchg">เปลี่ยน PIN</button></div><div class="row"><button class="btn ghost" data-a="s163pinoff">🔓 ปิด PIN (กรอก PIN ปัจจุบันด้านบนก่อน)</button></div>`
        : `<div class="row">${inp('s163Pn1', 'PIN 6 หลัก')}${inp('s163Pn2', 'ยืนยัน PIN')}</div><div class="row"><button class="btn" data-a="s163pinset">ตั้งรหัส PIN</button></div>`}</div></div>
      <div class="card"><div class="ci">🛡️</div><div class="cb"><h4>วงเงินโอนต่อวัน</h4><p class="dim">ตอนนี้ ${money(lim)}/วัน (สูงสุด ${money(200000)}) · ลดวงเงินเพื่อความปลอดภัยได้ · โอนผิดปกติ (50,000+ หรือสูงกว่าที่เคยโอน 3 เท่า) ธนาคารส่งข้อความเตือนเข้ามือถือ</p><div class="row">${[20000, 50000, 100000, 200000].map(n => `<button class="btn ${lim === n ? '' : 'ghost'}" data-a="s163lim" data-v="${n}">${money(n)}</button>`).join('')}</div></div></div>`;
  }

  // ===================== standing orders =====================
  const PAY = () => B.PAYEES || ['ร้านค้าในหมู่บ้าน'], PUR = () => B.PURPOSES || ['ค่าสินค้า'];
  function soHtml() {
    const v = V(), L = v.so;
    const list = L.map(o => `<div class="card" style="grid-template-columns:1fr auto"><div class="cb"><h4>${E(o.payee)} · ${money(o.amt)}</h4><p class="dim">${E(o.memo)} · ตัดทุกเดือนวันที่ ${o.dom} · ${o.on ? '✅ ใช้งานอยู่' : '⏸ พักไว้'}${o.last ? ' · ล่าสุด ' + E(RD(o.last)) : ''}</p></div><div class="row" style="margin:0"><button class="btn ghost" data-a="s163sopause" data-v="${o.id}">${o.on ? 'พัก' : 'เปิด'}</button><button class="btn ghost" data-a="s163sodel" data-v="${o.id}">ลบ</button></div></div>`).join('');
    return `<h5>🔁 โอนอัตโนมัติ / ตัดบัญชีตามนัด</h5><p class="dim">ตั้งให้ธนาคารจ่ายให้ทุกเดือน เช่น ค่าเช่า ค่าผ่อน ตัดจากออมทรัพย์ ส่งข้อความเมื่อตัดแล้ว เตือนล่วงหน้า 3 วันถ้าเงินไม่พอ (ไม่พอ 3 วันติด ระบบพักรายการให้)</p>${list || '<p class="dim">ยังไม่มีรายการตัดบัญชีอัตโนมัติ</p>'}
      ${L.length < 8 ? `<div class="row"><select id="s163sP" style="flex:1;${f1}">${PAY().map(p => `<option>${E(p)}</option>`).join('')}</select></div><div class="row"><input id="s163sO" type="text" maxlength="30" placeholder="ชื่อผู้รับ (เมื่อเลือกบุคคลทั่วไป)" style="flex:1;${f1}"></div>
      <div class="row"><select id="s163sM" style="flex:1;${f1}">${PUR().map(p => `<option>${E(p)}</option>`).join('')}</select><input id="s163sA" type="number" min="1" placeholder="จำนวนเงิน" style="flex:1;${f1}"><select id="s163sD" style="${f1}">${Array.from({ length: 28 }, (_, i) => `<option value="${i + 1}">วันที่ ${i + 1}</option>`).join('')}</select></div>
      <div class="row"><button class="btn" data-a="s163soadd">➕ ตั้งตัดบัญชีอัตโนมัติ</button></div>` : '<p class="dim">ครบ 8 รายการแล้ว ลบรายการเก่าก่อนจึงเพิ่มได้</p>'}`;
  }
  UI.H.s163soadd = () => {
    const v = V(); if (!B.hasId()) { toast('ต้องมีบัตรประชาชนก่อน (ทำที่ศูนย์ราชการ)', '🪪'); return; }
    let payee = val('s163sP') || ''; if (payee.indexOf('บุคคลทั่วไป') === 0) payee = String(val('s163sO') || '').trim().slice(0, 30);
    const amt = Math.round(+val('s163sA') || 0), dom = Math.max(1, Math.min(28, +val('s163sD') || 1));
    if (!payee) { toast('เลือกผู้รับ (หรือพิมพ์ชื่อผู้รับ)', 'ℹ️'); return; } if (!(amt >= 1)) { toast('พิมพ์จำนวนเงิน', 'ℹ️'); return; } if (amt > 100000) { toast('ตัดอัตโนมัติได้ครั้งละไม่เกิน 100,000', '🏦'); return; }
    v.so.push({ id: ++v.soSeq, payee, memo: val('s163sM') || PUR()[0], amt, dom, on: 1, last: 0, lastMk: 0, fails: 0, failMk: 0, warnMk: 0 });
    toast(`ตั้งตัดบัญชี ${payee} ${money(amt)} ทุกวันที่ ${dom} แล้ว`, '🔁'); msg(`ตั้งรายการตัดบัญชีอัตโนมัติ: ${payee} ${money(amt)} ทุกเดือนวันที่ ${dom}`, true);
  };
  UI.H.s163sopause = d => { const o = V().so.find(x => x.id === +d.v); if (o) { o.on = o.on ? 0 : 1; o.fails = 0; } };
  UI.H.s163sodel = d => { const v = V(); v.so = v.so.filter(x => x.id !== +d.v); toast('ลบรายการตัดบัญชีแล้ว', '🗑️'); };
  function soDay() {
    const v = V(), mk = mkOf(S.day), dom = domOf(S.day), main = B.all()[0];
    for (const o of v.so) {
      if (!o.on) continue;
      if (o.failMk !== mk) { o.failMk = mk; o.fails = 0; }
      if (o.lastMk === mk) continue;
      if (o.warnMk !== mk && dom === Math.max(1, o.dom - 3) && Bank.st().sav < o.amt) { o.warnMk = mk; msg(`⚠️ อีก 3 วันจะตัดบัญชีอัตโนมัติ ${o.payee} ${money(o.amt)} แต่เงินออมทรัพย์ ${money(Bank.st().sav)} ไม่พอ รีบฝากเพิ่ม`, false); }
      if (dom < o.dom) continue;
      if (Bank.st().sav >= o.amt) {
        Bank.st().sav -= o.amt; o.lastMk = mk; o.last = S.day; o.fails = 0;
        B.tx(`ตัดบัญชีอัตโนมัติ ${o.payee} (${o.memo})`, -o.amt, 'main'); try { Bank2.log(`ตัดบัญชีอัตโนมัติ ${o.payee}: ${o.memo}`, -o.amt); } catch (e) { }
        try { if (window.Slip49) window.Slip49.make({ k: 'xfer', amt: o.amt, payee: o.payee, memo: o.memo + ' (ตัดบัญชีอัตโนมัติ)', from: 'ออมทรัพย์ ' + main.no, quiet: true }); } catch (e) { }
        msg(`ตัดบัญชีอัตโนมัติ ${o.payee} ${money(o.amt)} (${o.memo}) สำเร็จ · คงเหลือ ${money(Bank.st().sav)}`, true);
      } else {
        o.fails++; msg(`❌ ตัดบัญชีอัตโนมัติ ${o.payee} ${money(o.amt)} ไม่สำเร็จ: เงินออมทรัพย์ไม่พอ (ครั้งที่ ${o.fails}/3)`, false);
        if (o.fails >= 3) { o.on = 0; msg(`⏸ พักรายการตัดบัญชี ${o.payee} เพราะเงินไม่พอ 3 วันติด เปิดใหม่ได้ในแอปธนาคาร`, false); }
      }
    }
  }

  // ===================== cheques you receive =====================
  const DRAWERS = ['คุณสมศักดิ์ (ลูกค้าประจำ)', 'ร้านอาหารป้าแดง', 'โรงงานแปรรูปสุขใจ', 'สหกรณ์การเกษตรสุขใจ', 'คุณวิภา (ลูกค้าตลาดนัด)', 'ห้างสุขใจพลาซ่า (ฝ่ายจัดซื้อ)'];
  const EXPIRE = 180, APP_DEP_MAX = 50000;
  const rcvOf = id => V().rcv.find(r => String(r.id) === String(id));
  function rcvStatus(id) {
    const r = rcvOf(id); if (!r) return '';
    return r.status === 'held' ? '📄 ยังไม่ได้นำฝาก' : r.status === 'clearing' ? `⏳ รอเคลียร์ (${RD(r.clearAt)})` : r.status === 'cleared' ? '✅ เงินเข้าบัญชีแล้ว' : r.status === 'bounced' ? '❌ เช็คคืน (ผู้สั่งจ่ายเงินไม่พอ)' : '⌛ หมดอายุ (เกิน 6 เดือน)';
  }
  function grant(amt, opt) {
    const v = V(), o = opt || {}, id = ++v.rcvSeq, no = String(1000000 + Math.floor(Math.random() * 8999999)), date = S.day + (o.ahead != null ? o.ahead : Math.floor(Math.random() * 8));
    const r = { id, no, drawer: o.drawer || DRAWERS[Math.floor(Math.random() * DRAWERS.length)], amt: Math.round(amt), memo: 'ค่าผลผลิตส่งขาย', issued: S.day, date, exp: date + EXPIRE, status: 'held', into: '', clearAt: 0 };
    v.rcv.unshift(r); if (v.rcv.length > 30) v.rcv.length = 30;
    msg(`🧾 ${r.drawer} จ่ายเช็คค่าผลผลิต ${money(r.amt)} (เลขที่ ${r.no}) ลงวันที่ ${RD(r.date)} · นำฝากได้ที่แอปธนาคาร > เช็ค ต้องฝากภายใน ${EXPIRE} วัน`, true);
    toast(`ได้รับเช็ค ${money(r.amt)} จาก ${r.drawer}`, '🧾'); return r;
  }
  function rcvDay() {
    const v = V(), main = B.all()[0];
    for (const r of v.rcv) {
      if (r.status === 'held') {
        if (S.day > r.exp) { r.status = 'expired'; msg(`⌛ เช็ค ${r.drawer} ${money(r.amt)} เลขที่ ${r.no} หมดอายุแล้ว (เกิน ${EXPIRE} วัน) ฝากไม่ได้ ต้องให้ผู้สั่งจ่ายออกใบใหม่`, false); }
        else if (S.day === r.exp - 30) msg(`⏰ เช็ค ${r.drawer} ${money(r.amt)} จะหมดอายุใน 30 วัน (${RD(r.exp)}) รีบนำฝาก`, false);
      } else if (r.status === 'clearing' && S.day >= r.clearAt) {
        if (Math.random() < 0.9) {
          r.status = 'cleared'; const toCur = r.into === 'cur' && B.curAcct(), acct = toCur ? B.curAcct() : null;
          if (acct) acct.bal += r.amt; else Bank.st().sav += r.amt;
          B.tx(`เช็คเข้า ${r.drawer} #${r.no}`, r.amt, acct ? acct.id : 'main'); try { Bank2.log(`เช็คเข้าบัญชี ${r.drawer} #${r.no}`, r.amt); } catch (e) { }
          msg(`✅ เช็คเลขที่ ${r.no} ${money(r.amt)} จาก ${r.drawer} เคลียร์แล้ว เงินเข้าบัญชี${acct ? 'กระแสรายวัน' : 'ออมทรัพย์'}`, true);
        } else {
          r.status = 'bounced'; const fee = 100; Bank.st().sav = Math.max(0, Bank.st().sav - fee); B.tx(`ค่าธรรมเนียมเช็คคืน #${r.no}`, -fee, 'main'); try { Bank2.log(`ค่าธรรมเนียมเช็คคืน (เช็คลูกค้า #${r.no})`, -fee); } catch (e) { }
          msg(`⚠️ เช็คเลขที่ ${r.no} ${money(r.amt)} จาก ${r.drawer} ถูกคืน (ผู้สั่งจ่ายเงินไม่พอ) ค่าธรรมเนียม ${money(fee)} · ติดต่อลูกค้าให้จ่ายใหม่`, false);
        }
      }
    }
    // now and then a customer pays by cheque
    if (S.day >= 4 && v.rcv.filter(r => r.status === 'held').length < 3 && Math.random() < 0.06) grant(Math.round((2000 + Math.random() * 6000) * (1 + Math.min(8, S.day / 90)) / 100) * 100);
  }
  UI.H.s163rdep = d => {
    const [id, to] = String(d.v).split('|'), r = rcvOf(id), v = V(); if (!r || r.status !== 'held') return;
    if (!B.hasId()) { toast('ต้องมีบัตรประชาชนก่อน (ทำที่ศูนย์ราชการ)', '🪪'); return; }
    if (S.day > r.exp) { r.status = 'expired'; toast('เช็คหมดอายุแล้ว ฝากไม่ได้', '⌛'); return; }
    if (S.day < r.date) { toast(`เช็คลงวันที่ล่วงหน้า ฝากได้ตั้งแต่ ${RD(r.date)}`, '📅'); return; }
    const acct = to === 'cur' ? B.curAcct() : null; if (to === 'cur' && !acct) { toast('ยังไม่มีบัญชีกระแสรายวัน', 'ℹ️'); return; }
    const app = r.amt <= APP_DEP_MAX;
    if (!app && !B.bankOpen()) { toast('เช็คเกิน 50,000 ต้องนำฝากที่สาขา (จ–ศ 08:30–16:30)', '🕘'); return; }
    r.status = 'clearing'; r.into = acct ? 'cur' : 'sav'; r.clearAt = app ? B.nextBiz(B.nextBiz(S.day)) : B.nextBiz(S.day);
    B.tx(`นำฝากเช็ค ${r.drawer} #${r.no}`, 0, acct ? acct.id : 'main');
    toast(`นำฝากเช็ค ${money(r.amt)} แล้ว เคลียร์ ${RD(r.clearAt)}`, '📥');
    try { if (window.Slip49) window.Slip49.make({ k: 'chdep', amt: r.amt, payee: r.drawer, memo: `นำฝากเช็คเลขที่ ${r.no} (${app ? 'ผ่านแอป' : 'ที่สาขา'})`, from: acct ? 'กระแสรายวัน ' + acct.no : 'ออมทรัพย์ ' + B.all()[0].no, ch: r.id }); } catch (e) { console.warn('slip', e); }
  };
  function rcvHtml() {
    const L = V().rcv, act = L.filter(r => r.status === 'held' || r.status === 'clearing'), old = L.filter(r => r.status !== 'held' && r.status !== 'clearing').slice(0, 4), cur = B.curAcct();
    if (!L.length) return `<h5>📥 เช็คที่ได้รับ</h5><p class="dim">เมื่อลูกค้าจ่ายค่าผลผลิตด้วยเช็ค เช็คจะมาอยู่ที่นี่ ต้องนำฝากก่อนหมดอายุ ${EXPIRE} วัน (ฝากผ่านแอปได้ไม่เกิน ${money(APP_DEP_MAX)} ยอดมากกว่านั้นฝากที่สาขา)</p>`;
    const card = r => `<div style="background:linear-gradient(135deg,#fdf6d8,#f1e2a6);color:#3a2f10;border:2px solid #b9a77a;border-radius:12px;padding:8px 12px;margin:6px 0"><div style="display:flex;justify-content:space-between;gap:8px;font-size:12.5px;font-weight:700"><span>เช็คเลขที่ ${E(r.no)}</span><span>${E(RD(r.date))}</span></div><div style="font-size:14px;margin-top:3px">สั่งจ่ายให้ ${E(S.name || 'ชาวไร่')} · จาก <b>${E(r.drawer)}</b></div><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:3px"><b style="font-size:19px">${money(r.amt)}</b><span style="font-size:12.5px">${rcvStatus(r.id)}</span></div><div style="font-size:11.5px;margin-top:2px">หมดอายุ ${E(RD(r.exp))}${S.day < r.date && r.status === 'held' ? ' · ฝากได้ตั้งแต่วันที่ลงในเช็ค' : ''}</div>${r.status === 'held' ? `<div class="row" style="margin:6px 0 0"><button class="btn" data-a="s163rdep" data-v="${r.id}|sav">📥 ฝากเข้าออมทรัพย์</button>${cur ? `<button class="btn ghost" data-a="s163rdep" data-v="${r.id}|cur">ฝากเข้ากระแสรายวัน</button>` : ''}</div>` : ''}</div>`;
    return `<h5>📥 เช็คที่ได้รับ (${act.length} ใบรอดำเนินการ)</h5><p class="dim">ฝากผ่านแอปได้ไม่เกิน ${money(APP_DEP_MAX)} (เคลียร์ 2 วันทำการ) · เกินนั้นฝากที่สาขาในเวลาทำการ (เคลียร์วันทำการถัดไป) · เช็คลงวันที่ล่วงหน้าฝากได้เมื่อถึงวันที่ · เช็คอาจถูกคืนได้</p>${act.map(card).join('')}${old.length ? `<p class="dim">ประวัติล่าสุด</p>${old.map(card).join('')}` : ''}`;
  }

  // ===================== daily hook =====================
  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { soDay(); } catch (e) { console.warn('v166 so', e); } try { rcvDay(); } catch (e) { console.warn('v166 rcv', e); } return r; }; }
  window.BankPlus = { PN, pinOn, pin, secHtml, soHtml, rcvHtml, rcvStatus, grant, soDay, rcvDay, V };
});
