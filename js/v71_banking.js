// v71_banking.js: money and banks as in real life
//  - ATM: card + PIN, withdraw (500...20,000, multiples of 100, 200,000 a day), deposit cash, balances, own-account transfers, statement, change PIN; open 24 h
//  - Bank counter: withdraw or deposit CASH on the savings or the current account, typed amount, any size, bank hours + ID card; the cash lands in the wallet at once
//  - the phone / app cannot hand out cash any more (real banking apps cannot either)
//  - PayGate: when you click something and your CASH is not enough (even if the bank holds plenty), nothing is paid; you are told so and sent to the other ways of paying
V23.add('v71_banking', () => {
  const B = window.Bank49, P = window.Pay49; if (!B || !P || typeof Bank === 'undefined') return;
  const E = s => (typeof esc === 'function' ? esc(s) : String(s));
  const bS = n => baht(Math.round(n));
  const toast = (t, i) => { try { UI.toast(t, i || '🏦'); } catch (e) { } };
  const val = id => (document.getElementById(id) || {}).value;
  const st = () => { const s = S.v71 = S.v71 || {}; if (!s.pin) s.pin = '123456'; s.fails = s.fails | 0; s.lockDay = s.lockDay | 0; s.atm = s.atm || { d: 0, used: 0 }; return s; };
  const ATM_TX = 20000, ATM_DAY = 200000, DEP_TX = 50000, XFER_ATM = 100000;
  const accts = () => B.all();
  const acctOpts = (sel, id) => `<select id="${id}" aria-label="เลือกบัญชี" class="sel71" style="flex:1;min-width:0">${accts().map(a => `<option value="${a.id}" ${a.id === sel ? 'selected' : ''}>${E(a.name)} · ${bS(B.balOf(a))}</option>`).join('')}</select>`;
  const note = (who, txt) => { try { Phone.msg(who, txt, true); } catch (e) { } };

  // ======================= PayGate: cash is cash =======================
  const EXEMPT = new Set(['v24fund', 'v24loan', 'loan', 'repay', 'fbuy', 'fsell', 'insure', 'dep', 'wd', 'fix', 'pj', 'bj', 'nj', 'paybill', 'b49', 'c49x', 'p49m', 'p49c', 'cnt71', 'atm71', 'v71short']);
  const _toast = UI.toast.bind(UI);
  UI.toast = function (t, i) { if (P.inter) P.sawToast = true; if (P.inter && typeof t === 'string' && /ไม่พอ|ไม่เพียงพอ|ขาดอีก|ต้องใช้ [\d,]+ ?฿|เงินไม่/.test(t)) P.refused = P.refused || t; return _toast(t, i); };
  let prevUI = null;
  const snapUI = () => (UI.cur ? { title: UI.cur.title, tabs: UI.cur.tabs, tab: UI.cur.tab, render: UI.cur.render, wide: UI.cur.wide } : null);
  const restoreUI = p => { if (p && p.title) UI.open(p.title, p.tabs && p.tabs.length ? p.tabs : null, p.render, { tab: p.tab, wide: p.wide }); else UI.close(); };
  const nearestAtm = () => { const p = G.player && G.player.pos; if (!p) return null; let best = null, bd = 1e9; for (const q of World.pois) if (q.label === 'ตู้ ATM') { const d = Math.hypot(q.x - p.x, q.z - p.z); if (d < bd) { bd = d; best = q; } } return best ? Math.round(bd) : null; };
  // v143: when the cash is short, work out what was being bought (amount from the message or the button, shop from the window title) and offer the ready-filled payment
  let lastEl = null; document.addEventListener('pointerdown', e => { try { lastEl = e.target && e.target.closest ? e.target.closest('button,[data-a]') : null; } catch (x) { lastEl = null; } }, true);
  const amtIn = s => { const m = String(s || '').match(/฿\s*([\d,]{1,12})|([\d,]{1,12})\s*฿/); const v = m ? +(m[1] || m[2]).replace(/,/g, '') : 0; return v >= 1 ? v : 0; };
  const wantOf = msg => { const m = String(msg || '').match(/ต้องใช้(?:เงิน)?\s*฿?\s*([\d,]{2,12})/) || String(msg || '').match(/ต้อง(?:เตรียมเงิน|มีเงิน|มี|ชำระ|จ่าย)\s*฿?\s*([\d,]{2,12})\s*(?:฿|บาท)/); if (m) return +m[1].replace(/,/g, ''); if (lastEl) { const a = amtIn(lastEl.textContent) || amtIn(lastEl.closest && lastEl.closest('.card') ? lastEl.closest('.card').textContent : ''); if (a) return a; } return 0; };
  const ownAmt = () => { try { return lastEl && !lastEl.disabled ? amtIn(lastEl.textContent) : 0; } catch (e) { return 0; } };
  const labelOf = msg => { try { const c = lastEl && lastEl.closest && lastEl.closest('.card'), h = c && c.querySelector('h4'); const t = (h ? h.textContent : (lastEl ? lastEl.textContent : '')).replace(/\s+/g, ' ').trim(); const gov = /สำนักงาน|ที่ว่าการ|กอง|เทศบาล|องค์การ|กรม|ที่ทำการ|ศาล|สถานี|ด่าน|การประปา|การไฟฟ้า|ฝ่าย|เวชระเบียน|โรงพยาบาล|คลินิก|โรงเรียน/.test(String(P.lastTitle || (UI.cur && UI.cur.title) || '')); return t ? (/^(ทำบุญ|บริจาค|ถวาย|ชำระ|จ่าย|ค่า|ตรวจ|รักษา|เรียน|สมัคร|ต่ออายุ|เช่า|จด|ยื่น)/.test(t.replace(/^[^฀-๿a-zA-Z0-9]+/, '')) ? t.slice(0, 40) : (gov ? 'ค่าธรรมเนียม/ค่าบริการ ' : 'ซื้อ ') + t.slice(0, 40)) : String(msg || 'ชำระเงิน').slice(0, 40); } catch (e) { return 'ชำระเงิน'; } };
  const payeeOf = prev => { try { const sid = UI.shopId, t = String((prev && prev.title) || (UI.cur && UI.cur.title) || ''); if (sid && typeof SHOPS !== 'undefined' && SHOPS[sid] && SHOPS[sid].n && t.indexOf(SHOPS[sid].n) === 0) return SHOPS[sid].n; } catch (e) { } return payeeOf0(prev); };   // v162: the shop's own name, not the window title with "· 70 รายการ"
  const payeeOf0 = prev => String(((prev && prev.title) || (UI.cur && UI.cur.title) || 'ร้านค้า').replace(/\s*[·•]\s*\d+\s*รายการ.*$/, '')).replace(/[^\u0E00-\u0E7Fa-zA-Z0-9 ()/&.-]/g, '').replace(/\s+/g, ' ').replace(/· เมนู$/, '').trim().slice(0, 40) || 'ร้านค้า';
  const showShort = (msg, prev) => {
    const cash = S._c, sav = Bank.st().sav, cur = B.curAcct(), d = nearestAtm();
    UI.open('💵 เงินสดในกระเป๋าไม่พอ', null, () => `<p class="lead">จ่ายไม่ได้ เพราะเงินสดในกระเป๋าไม่พอ</p><p class="dim">${E(msg)}</p>
      <div class="card"><div class="ci">👛</div><div class="cb"><h4>เงินของคุณตอนนี้</h4><p class="dim">เงินสด <b>${bS(cash)}</b> · ออมทรัพย์ <b>${bS(sav)}</b>${cur ? ` · กระแสรายวัน <b>${bS(cur.bal)}</b>` : ''}</p></div></div>
      <p class="lead">เลือกวิธีอื่นแทน:</p>
      <div class="grid">
        <div class="card"><div class="ci">🏧</div><div class="cb"><h4>ถอนเงินสดที่ตู้ ATM / เคาน์เตอร์</h4><p class="dim">${d != null ? `ตู้ ATM ใกล้สุดอยู่ห่าง ${d} ม. ` : ''}ATM ถอนได้ครั้งละไม่เกิน ${bS(ATM_TX)} · เคาน์เตอร์สาขา (จ–ศ 08:30–16:30) ถอนได้เท่าที่มีในบัญชี แล้วกลับมาจ่ายด้วยเงินสด</p></div></div>
        <div class="card"><div class="ci">📱</div><div class="cb"><h4>โอน / เช็ค ตอนซื้อของ</h4><p class="dim">ร้านค้าที่ชำระผ่านตะกร้าหรือปุ่มซื้อ จะถามวิธีจ่ายให้เลือก (โอนผ่านแอป พร้อมเพย์ เช็ค แคชเชียร์เช็ค)</p><div class="row"><button class="btn" data-a="v71short" data-v="app">เปิดแอปธนาคาร</button></div></div></div>
      </div><div class="row end"><button class="btn ghost" data-a="v71short" data-v="back">← กลับ</button></div>`);
    prevUI = prev;
  };
  UI.H.v71short = d => { if (d.v === 'app') { prevUI = null; B.openApp(1); } else { const p = prevUI; prevUI = null; restoreUI(p); } };
  // v173: EVERY click that is about to pay (more than small change) now opens the payment window first, so a card / debit card / instalment can be chosen anywhere in the game.
  // The money setter calls P.onSpend the moment the handler reaches the payment; if nothing else was changed by the click so far, the click is stopped right there (nothing is paid, nothing is given),
  // the window opens with the amount, and the chosen way of paying re-runs the very same click with the money pinned to it. If the click already changed something first, it is left alone (paid as before).
  const SPEND = { spend173: true }, fpNow = () => { try { return JSON.stringify(S); } catch (e) { return null; } };
  // what was typed in a form is kept while the payment window is open and put back before the click is re-run
  const grabForm = () => { try { return [...document.querySelectorAll('#mBody input, #mBody select, #mBody textarea')].map(e => ({ id: e.id, name: e.name, type: e.type, value: e.value, checked: e.checked })); } catch (e) { return []; } };
  const putForm = vals => { try { for (const v of vals) { let e = v.id ? document.getElementById(v.id) : null; if (e && (e.type === v.type)) { if (v.type === 'checkbox' || v.type === 'radio') e.checked = v.checked; else e.value = v.value; continue; } if (v.name && (v.type === 'radio' || v.type === 'checkbox')) { for (const q of document.querySelectorAll('#mBody input[name="' + v.name + '"]')) if (q.value === v.value) q.checked = v.checked; } } } catch (e) { } };
  P.onSpend = amt => {
    const w = P.watch; if (w == null || !P.inter || P.src || P.busy) return;
    if (amt <= (P.askOn && P.askOn() ? 0 : P.AUTO_CASH)) return;
    if (fpNow() !== w) return;
    P.watchHit = amt; throw SPEND;
  };
  window.PayGate = {
    run(h, d, name) {
      if (P.busy || P.src || P.inter || EXEMPT.has(name) || /^s16\d/.test(name)) return h(d);
      const prev = snapUI(), c0 = S._c, t0 = P.total(); let fp0 = ''; try { fp0 = JSON.stringify(S); } catch (e) { }
      P.inter = true; P.refused = null; P.sawToast = false; P.lastTitle = prev && prev.title; P.watch = fp0; P.watchHit = 0; let stop = 0, form = null;
      try { return h(d); }
      catch (e) { if (e === SPEND) { stop = P.watchHit; form = grabForm(); return; } throw e; }
      finally {
        const hit = P.watchHit; P.watch = null; P.watchHit = 0;
        P.inter = false; const msg = P.refused; P.refused = null; const toasted = P.sawToast; P.sawToast = false;
        if (stop) { try { if (B.ask) B.ask({ amount: stop, label: labelOf(''), payee: payeeOf(prev), fn: () => { putForm(form || []); return h(d); } }); else S.money -= stop; } catch (e) { console.warn('v173 ask', e); } }
        else if (hit) { try { S.money -= hit; } catch (e) { } }   // the click swallowed the stop: pay as before so nothing is given for free
        else if (msg && S._c === c0 && P.total() === t0) { try { const w = wantOf(msg); if (w >= 1 && B.ask) B.ask({ amount: w, label: labelOf(msg), payee: payeeOf(prev), fn: () => h(d) }); else showShort(msg, prev); } catch (e) { console.warn('v71 short', e); } }
        // v162: some old buttons just did nothing when the cash was short (no message at all): a button that shows its own price, pressed with too little cash while the bank holds enough, offers the ways to pay as well
        else if (!msg && !toasted && S._c === c0 && P.total() === t0 && !(UI.cur && UI.cur.title === '💳 เลือกวิธีชำระเงิน')) { try { const w = ownAmt(); if (w >= 1 && w > S._c && w <= P.total() && B.ask) { let fp1 = ''; try { fp1 = JSON.stringify(S); } catch (e) { } if (fp1 === fp0) B.ask({ amount: w, label: labelOf(''), payee: payeeOf(prev), fn: () => h(d) }); } } catch (e) { console.warn('v71 silent', e); } }
      }
    },
  };

  // v162: payments made AFTER a screen fade (the walk to a counter: government fees, clinic, courses, insurance ...) used to take the money from every account without asking.
  // They follow the same rules now: cash first; when the cash is short the ways to pay are offered with everything filled in, and the walk is not repeated (the clock runs once)
  try {
    if (typeof fade === 'function' && typeof tick === 'function') {
      const _fade = fade, _tick = tick;
      tick = function () { if (P.noTick) return; const r = _tick.apply(this, arguments); if (P.watch != null) P.watch = fpNow(); return r; };
      fade = function (fn) {
        if (typeof fn !== 'function' || !P.inter || P.busy || P.src) return _fade.apply(this, arguments);
        const title = P.lastTitle;
        const wrapped = function () {
          const self = this, args = arguments, c0 = S._c, t0 = P.total(), was = P.inter, wasW = P.watch; P.inter = true; P.refused = null; P.sawToast = false; P.watch = fpNow(); P.watchHit = 0; let stop = 0;
          try { return fn.apply(self, args); }
          catch (e) { if (e === SPEND) { stop = P.watchHit; return; } throw e; }
          finally {
            const hit = P.watchHit; P.watch = wasW; P.watchHit = 0;
            P.inter = was; const msg = P.refused; P.refused = null; P.sawToast = false;
            if (stop) { try { if (B.ask) B.ask({ amount: stop, label: labelOf(''), payee: payeeOf({ title }), fn: () => { P.noTick = true; try { fn.apply(self, args); } finally { P.noTick = false; } } }); else S.money -= stop; } catch (e) { console.warn('v173 deferred ask', e); } }
            else if (hit) { try { S.money -= hit; } catch (e) { } }
            else if (msg && S._c === c0 && P.total() === t0) { try { const w = wantOf(msg); if (w >= 1 && w <= P.total() && B.ask) B.ask({ amount: w, label: labelOf(msg), payee: payeeOf({ title }), fn: () => { P.noTick = true; try { fn.apply(self, args); } finally { P.noTick = false; } } }); else showShort(msg, null); } catch (e) { console.warn('v71 deferred', e); } }
          }
        };
        return _fade.call(this, wrapped);
      };
    }
  } catch (e) { console.warn('v71 fade bridge', e); }
  // purchases that used to take the money straight from the pooled balance now ask how to pay too
  try { if (typeof Food !== 'undefined' && typeof FOODS !== 'undefined') {
    P.guard(Food, 'takeaway', id => (FOODS[id] ? FOODS[id].price + 10 : 0), id => 'อาหารกลับบ้าน ' + (FOODS[id] || {}).n, () => 'ร้านอาหาร');
    P.guard(Food, 'dine', id => (FOODS[id] ? FOODS[id].price : 0), id => 'ทานอาหารที่ร้าน ' + (FOODS[id] || {}).n, () => 'ร้านอาหาร');
    P.guard(Food, 'order', id => (FOODS[id] ? FOODS[id].price + 40 : 0), id => 'สั่งอาหารส่งถึงบ้าน ' + (FOODS[id] || {}).n, () => 'ร้านป้าแดง');
  } } catch (e) { console.warn('v71 food guard', e); }
  try { if (typeof PC !== 'undefined' && PC.build) P.guard(PC, 'build', function () { return this.atShop ? 1500 : 0; }, () => 'ค่าประกอบคอมพิวเตอร์', () => 'คอมพิวเตอร์พลาซ่า'); } catch (e) { console.warn('v71 pc guard', e); }

  // money that comes from or goes to the bank itself is settled through the savings account, not the wallet: salary is paid into the account, loans are credited to it, repayments, funds and insurance are debited from it
  const viaSav = (obj, key) => { const f = obj && obj[key]; if (typeof f !== 'function') return; obj[key] = function () { if (P.src) return f.apply(this, arguments); P.src = 'sav'; try { return f.apply(this, arguments); } finally { P.src = null; } }; };
  try { if (typeof Career !== 'undefined') viaSav(Career, 'payday'); for (const k of ['borrow', 'repay', 'buy', 'sell', 'insure', 'claim']) viaSav(Bank2, k); } catch (e) { console.warn('v71 viaSav', e); }
  // ======================= the phone bank app: no cash =======================
  { const _b = Phone.apps.bank; Phone.apps.bank = function () { let h = _b.apply(this, arguments); h = h.replace(/<div class="row"><button class="btn" data-a="dep"[\s\S]*?<\/div>\s*<div class="row"><button class="btn ghost" data-a="wd"[\s\S]*?<\/div>/, '<p class="dim">💵 ฝาก/ถอนเงินสด: ใช้ <b>ตู้ ATM</b> หรือ <b>เคาน์เตอร์สาขา</b> (ธนาคารจริงก็ถอนเงินสดผ่านแอปไม่ได้)</p>'); return h; }; }
  // term deposits and piggy banks are funded from the savings account, never from the wallet
  for (const k of ['fix', 'putJar']) { const f = Bank[k].bind(Bank); Bank[k] = function () { const o = P.src; P.src = 'sav'; try { return f.apply(this, arguments); } finally { P.src = o; } }; }

  // ======================= ATM =======================
  const A = { step: 'pin', acct: 'main', msg: '', rec: null };
  const dayUsed = () => { const a = st().atm; if (a.d !== S.day) { a.d = S.day; a.used = 0; } return a.used; };
  const locked = () => st().lockDay === S.day;
  function openATM(where) {
    try { if (window.Blackout36 && Blackout36.state().village) { toast('ตู้ ATM ใช้งานไม่ได้ ไฟดับทั้งพื้นที่ ลองใหม่เมื่อไฟมา', '🔌'); return; } } catch (e) { }
    if (locked()) { toast('บัตรถูกล็อกวันนี้ เพราะใส่รหัสผิดเกิน 3 ครั้ง ลองใหม่พรุ่งนี้ หรือติดต่อสาขา', '🔒'); return; }
    A.step = 'pin'; A.msg = ''; A.rec = null; A.acct = 'main'; UI.open('🏧 ตู้ ATM ธนาคารสุขใจ', null, () => html());
  }
  const head = () => `<p class="dim" style="margin:0 0 6px">บัตร ATM · ${E(S.name || 'ชาวไร่')} · ${E(accts()[0].no)}</p>`;
  const menuBtn = (v, ic, t) => `<button class="btn ghost" style="display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 6px" data-a="atm71" data-v="${v}"><span style="font-size:24px">${ic}</span>${t}</button>`;
  // a new card has no PIN yet: the first time you use it the machine asks you to choose one (real ATMs never print or show a PIN)
  const needSet = () => st().pin === '123456' && !st().changed;
  const WEAK = /^(\d)\1{5}$/, SEQ = ['012345', '123456', '234567', '345678', '456789', '987654', '876543', '765432', '654321', '543210', '123123', '121212', '112233', '123321'];
  function html() {
    const s = st();
    if (A.step === 'pin' && needSet()) return `${head()}<p class="lead">บัตรใหม่: ตั้งรหัสผ่านบัตร 6 หลักก่อนใช้งานครั้งแรก</p><div class="row"><input id="atmNew" type="password" inputmode="numeric" maxlength="6" placeholder="รหัสใหม่ 6 หลัก" autocomplete="off" style="flex:1;min-width:0;font-size:20px;letter-spacing:6px;text-align:center;padding:10px;border-radius:10px;border:1px solid #ccc"></div><div class="row"><input id="atmNew2" type="password" inputmode="numeric" maxlength="6" placeholder="ยืนยันรหัสใหม่" autocomplete="off" style="flex:1;min-width:0;font-size:20px;letter-spacing:6px;text-align:center;padding:10px;border-radius:10px;border:1px solid #ccc"><button class="btn" data-a="atm71" data-v="act">ตกลง</button></div><p class="${A.msg ? 'bad' : 'dim'}">${A.msg || 'อย่าตั้งรหัสที่เดาง่าย เช่น 123456 หรือเลขซ้ำ และไม่บอกใคร'}</p><div class="row end"><button class="btn ghost" data-a="atm71" data-v="end">คืนบัตร</button></div>`;
    if (A.step === 'pin') return `${head()}<p class="lead">ใส่รหัสผ่านบัตร 6 หลัก</p><div class="row"><input id="atmPin" type="password" inputmode="numeric" maxlength="6" placeholder="••••••" autocomplete="off" style="flex:1;min-width:0;font-size:22px;letter-spacing:8px;text-align:center;padding:10px;border-radius:10px;border:1px solid #ccc"><button class="btn" data-a="atm71" data-v="pin">ยืนยัน</button></div>
      <p class="${A.msg ? 'bad' : 'dim'}">${A.msg || 'พิมพ์รหัสที่คุณตั้งไว้'} · ใส่ผิดได้อีก ${3 - s.fails} ครั้ง</p><div class="row end"><button class="btn ghost" data-a="atm71" data-v="end">คืนบัตร</button></div>`;
    if (A.step === 'done' && A.rec) return `${head()}<div class="card" style="grid-template-columns:46px 1fr"><div class="ci">${A.rec.i}</div><div class="cb"><h4>${E(A.rec.t)}</h4><p>${A.rec.lines.map(E).join('<br>')}</p></div></div><p class="dim">ระบบพิมพ์ใบบันทึกรายการแล้ว · ${RD(S.day)} ${String(Math.floor(S.time / 60)).padStart(2, '0')}:${String(Math.floor(S.time % 60)).padStart(2, '0')}</p><div class="row"><button class="btn" data-a="atm71" data-v="menu">ทำรายการต่อ</button><button class="btn ghost" data-a="atm71" data-v="end">คืนบัตร</button></div>`;
    if (A.step === 'menu') return `${head()}<p class="lead">เงินสดในกระเป๋า <b>${bS(S._c)}</b></p><div class="grid" style="grid-template-columns:repeat(3,1fr);gap:8px">${menuBtn('wd', '💵', 'ถอนเงิน')}${menuBtn('dp', '🏦', 'ฝากเงินสด')}${menuBtn('bal', '🔍', 'ตรวจสอบยอด')}${menuBtn('tr', '🔁', 'โอนบัญชีตัวเอง')}${menuBtn('stm', '🧾', 'รายการล่าสุด')}${menuBtn('pw', '🔑', 'เปลี่ยนรหัส')}${menuBtn('cc', '💳', 'บัตรเครดิต')}${menuBtn('ext', '➕', 'บริการอื่นๆ')}</div><div class="row end"><button class="btn ghost" data-a="atm71" data-v="end">คืนบัตร</button></div>`;
    if (A.step === 'wd') { const left = ATM_DAY - dayUsed(); return `${head()}<p class="lead">ถอนเงินสด</p><div class="row">${acctOpts(A.acct, 'atmAcct')}</div><div class="row" style="flex-wrap:wrap">${[500, 1000, 2000, 3000, 5000, 10000, 20000].map(n => `<button class="btn ghost" style="flex:1;min-width:30%" data-a="atm71" data-v="wd|${n}">${n.toLocaleString('en-US')}</button>`).join('')}</div><div class="row"><input id="atmAmt" type="number" inputmode="numeric" min="100" step="100" placeholder="พิมพ์จำนวนเงิน (เต็มร้อย)" style="flex:1;min-width:0;padding:8px;border-radius:10px;border:1px solid #ccc"><button class="btn" data-a="atm71" data-v="wdx">ถอน</button></div><p class="dim">ครั้งละ 100–${ATM_TX.toLocaleString('en-US')} บาท เต็มร้อย · วันนี้ถอนได้อีก ${bS(left)} (ไม่เกิน ${ATM_DAY.toLocaleString('en-US')}/วัน)</p><div class="row end"><button class="btn ghost" data-a="atm71" data-v="menu">← เมนู</button></div>`; }
    if (A.step === 'dp') return `${head()}<p class="lead">ฝากเงินสด · เงินสดในกระเป๋า ${bS(S._c)}</p><div class="row">${acctOpts(A.acct, 'atmAcct')}</div><div class="row"><input id="atmAmt" type="number" inputmode="numeric" min="20" step="20" placeholder="พิมพ์จำนวนเงินที่จะฝาก" style="flex:1;min-width:0;padding:8px;border-radius:10px;border:1px solid #ccc"><button class="btn" data-a="atm71" data-v="dpx">ฝาก</button></div><p class="dim">ฝากได้ครั้งละไม่เกิน ${DEP_TX.toLocaleString('en-US')} บาท</p><div class="row end"><button class="btn ghost" data-a="atm71" data-v="menu">← เมนู</button></div>`;
    if (A.step === 'bal') return `${head()}<p class="lead">ยอดเงินคงเหลือ</p><div class="grid">${accts().map(a => `<div class="card"><div class="ci">${a.type === 'cur' ? '🧾' : '💰'}</div><div class="cb"><h4>${E(a.name)}</h4><p class="dim">${E(a.no)}</p><p><b>${bS(B.balOf(a))}</b></p></div></div>`).join('')}</div><div class="row"><button class="btn" data-a="atm71" data-v="menu">← เมนู</button></div>`;
    if (A.step === 'tr') { const l = accts(); return `${head()}<p class="lead">โอนระหว่างบัญชีของฉัน (ครั้งละไม่เกิน ${XFER_ATM.toLocaleString('en-US')})</p>${l.length < 2 ? '<p class="empty">ต้องมีบัญชีอย่างน้อย 2 บัญชี (เปิดกระแสรายวันที่สาขา)</p>' : `<div class="row">${acctOpts(l[0].id, 'atmFrom')} → ${acctOpts(l[1].id, 'atmTo')}</div><div class="row"><input id="atmAmt" type="number" inputmode="numeric" min="1" placeholder="พิมพ์จำนวนเงิน" style="flex:1;min-width:0;padding:8px;border-radius:10px;border:1px solid #ccc"><button class="btn" data-a="atm71" data-v="trx">โอน</button></div>`}<div class="row end"><button class="btn ghost" data-a="atm71" data-v="menu">← เมนู</button></div>`; }
    if (A.step === 'stm') { const items = []; try { for (const l of Bank2.st().log) items.push({ d: l.d, t: l.t, a: l.a }); } catch (e) { } for (const x of B.V().tx) items.push({ d: x.d, t: x.t, a: x.a }); items.sort((a, b) => b.d - a.d); return `${head()}<p class="lead">รายการล่าสุด</p>${items.slice(0, 8).map(x => `<div style="display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.1);font-size:13.5px"><span>${E(x.t)}<br><small class="dim">${RD(x.d)}</small></span><b class="${x.a >= 0 ? 'good' : ''}">${x.a >= 0 ? '+' : ''}${bS(x.a)}</b></div>`).join('') || '<p class="empty">ยังไม่มีรายการ</p>'}<div class="row"><button class="btn" data-a="atm71" data-v="menu">← เมนู</button></div>`; }
    if (A.step === 'cc') { const C = window.Card168, c = C && C.has() ? C.st() : null; if (!c) return `${head()}<p class="lead">💳 บัตรเครดิต</p><p class="dim">ยังไม่มีบัตรเครดิต สมัครได้ที่ธนาคารทุกสาขาหรือแอปธนาคาร แท็บ บัตรเครดิต/สินเชื่อ</p><div class="row end"><button class="btn ghost" data-a="atm71" data-v="menu">กลับ</button></div>`; return `${head()}<p class="lead">💳 บัตรเครดิต ${E(C.mask())} · วงเงินคงเหลือ ${bS(C.avail())} · ยอดค้าง ${bS(c.rev + c.ca + c.cur)}</p><p class="dim">กดเงินสดจากบัตร: ค่าธรรมเนียม 3% (ขั้นต่ำ 200 ฿) ดอกเบี้ย 20% ต่อปีทันที · ชำระเข้าจากบัญชีออมทรัพย์หลัก</p><div class="row" style="flex-wrap:wrap">${[1000, 5000, 10000, 20000].map(n => `<button class="btn ghost" data-a="atm71" data-v="ccadv|${n}">กดเงินสด ${n.toLocaleString('en-US')}</button>`).join('')}</div><div class="row"><button class="btn" data-a="atm71" data-v="ccpay|min">ชำระขั้นต่ำ ${bS(C.minDue(c))}</button><button class="btn ghost" data-a="atm71" data-v="ccpay|full">ชำระเต็มจำนวน ${bS(c.rev + c.ca + c.cur)}</button></div><div class="row end"><button class="btn ghost" data-a="atm71" data-v="menu">กลับ</button></div>`; }
    if (A.step === 'ext' && window.Atm170) return `${head()}${window.Atm170.html(A.sub || 'menu')}`;
    if (A.step === 'pw') return `${head()}<p class="lead">เปลี่ยนรหัสผ่านบัตร</p>${['atmOld|รหัสเดิม', 'atmNew|รหัสใหม่ 6 หลัก', 'atmNew2|ยืนยันรหัสใหม่'].map(x => { const [id, ph] = x.split('|'); return `<div class="row"><input id="${id}" type="password" inputmode="numeric" maxlength="6" placeholder="${ph}" style="flex:1;min-width:0;padding:8px;border-radius:10px;border:1px solid #ccc"></div>`; }).join('')}<p class="${A.msg ? 'bad' : 'dim'}">${A.msg || 'รหัสต้องเป็นตัวเลข 6 หลัก'}</p><div class="row"><button class="btn" data-a="atm71" data-v="pwx">เปลี่ยนรหัส</button><button class="btn ghost" data-a="atm71" data-v="menu">← เมนู</button></div>`;
    return '';
  }
  const rec = (i, t, ...lines) => { A.rec = { i, t, lines }; A.step = 'done'; };
  UI.H.atm71 = d => {
    const [a, x] = String(d.v || '').split('|'), s = st(), accOf = id => accts().find(q => q.id === id);
    if (a === 'end') { UI.close(); toast('คืนบัตรแล้ว อย่าลืมเก็บเงินและใบบันทึกรายการ', '🏧'); return; }
    if (a === 'act') {
      const n1 = String(val('atmNew') || ''), n2 = String(val('atmNew2') || '');
      if (!/^\d{6}$/.test(n1)) { A.msg = 'รหัสต้องเป็นตัวเลข 6 หลัก'; return; } if (n1 !== n2) { A.msg = 'รหัสสองครั้งไม่ตรงกัน'; return; }
      if (WEAK.test(n1) || SEQ.includes(n1)) { A.msg = 'รหัสนี้เดาง่ายเกินไป เลือกรหัสอื่น'; return; }
      s.pin = n1; s.changed = 1; s.fails = 0; A.step = 'menu'; A.msg = ''; toast('ตั้งรหัสผ่านบัตรเรียบร้อย', '🔑'); return;
    }
    if (a === 'pin') {
      const p = String(val('atmPin') || '').trim();
      if (p === s.pin) { s.fails = 0; A.step = 'menu'; A.msg = ''; }
      else { s.fails++; A.msg = 'รหัสผ่านไม่ถูกต้อง'; if (s.fails >= 3) { s.lockDay = S.day; s.fails = 0; UI.close(); toast('ใส่รหัสผิดครบ 3 ครั้ง ตู้ยึดบัตร (ล็อกวันนี้) ติดต่อสาขาหรือรอพรุ่งนี้', '🔒'); note('ธนาคารสุขใจ', 'บัตร ATM ของคุณถูกล็อกชั่วคราวเพราะใส่รหัสผิด 3 ครั้ง ใช้งานได้อีกครั้งพรุ่งนี้'); } }
      return;
    }
    if (A.step === 'pin') return;
    if (a === 'menu') { A.step = 'menu'; A.msg = ''; return; }
    if (a === 'ext') { if (!window.Atm170) return; if (!x) { A.step = 'ext'; A.sub = 'menu'; A.msg = ''; return; } A.step = 'ext'; window.Atm170.act(String(d.v).slice(4), A, rec); return; }
    if (['wd', 'dp', 'bal', 'tr', 'stm', 'pw', 'cc'].includes(a) && !x) { A.step = a; A.msg = ''; return; }
    if (a === 'ccadv' || a === 'ccpay') { const C = window.Card168; if (!C || !C.has()) return; const c = C.st(); C.quiet = true; try { if (a === 'ccadv') { C.advance(+x, 'cash'); } else { const n = x === 'min' ? C.minDue(c) : Math.round(c.rev + c.ca + c.cur); if (!n) { toast('ไม่มียอดที่ต้องชำระ', 'ℹ️'); return; } C.pay(n, 'sav'); } } finally { C.quiet = false; } return; }
    const ac = accOf(val('atmAcct') || A.acct); if (val('atmAcct')) A.acct = val('atmAcct');
    if (a === 'wd' || a === 'wdx') {
      if (window.Evt170 && window.Evt170.atmOut()) { toast('ตู้ ATM นี้เงินสดหมดชั่วคราว ลองใช้เคาน์เตอร์สาขา หรือรอพรุ่งนี้', '🏧'); return; }
      const n = a === 'wd' ? +x : Math.round(+val('atmAmt') || 0), acc = ac || accts()[0], used = dayUsed();
      if (!(n >= 100) || n % 100) { toast('ถอนได้เป็นจำนวนเต็มร้อย ตั้งแต่ 100 บาท', 'ℹ️'); return; }
      if (n > ATM_TX) { toast(`ตู้ ATM ถอนได้ครั้งละไม่เกิน ${bS(ATM_TX)} (จำนวนมากกว่านี้ไปที่เคาน์เตอร์สาขา)`, '🏧'); return; }
      if (used + n > ATM_DAY) { toast(`เกินวงเงินถอนต่อวัน ${bS(ATM_DAY)} (วันนี้ถอนแล้ว ${bS(used)})`, '🏧'); return; }
      if (B.balOf(acc) < n) { toast(`เงินใน${acc.name}ไม่พอ (มี ${bS(B.balOf(acc))})`, '💸'); return; }
      B.setBal(acc, B.balOf(acc) - n); S._c += n; s.atm.used += n; B.tx(`ถอนเงินสด ATM (${acc.name})`, -n, acc.id); try { Bank2.log('ถอนเงินสด ATM', -n); } catch (e) { }
      try { Sfx.coin(); } catch (e) { }
      rec('💵', 'ถอนเงินสดสำเร็จ', `จำนวน ${bS(n)}`, `จากบัญชี ${acc.name} (${acc.no})`, `คงเหลือ ${bS(B.balOf(acc))}`, `เงินสดในกระเป๋า ${bS(S._c)}`);
      if (n >= 1000) note('ธนาคารสุขใจ', `ถอนเงินสด ATM ${bS(n)} จากบัญชี ${acc.no} คงเหลือ ${bS(B.balOf(acc))}`);
      return;
    }
    if (a === 'dpx') {
      const n = Math.round(+val('atmAmt') || 0), acc = ac || accts()[0];
      if (!(n >= 20)) { toast('พิมพ์จำนวนเงินที่จะฝาก', 'ℹ️'); return; } if (n > DEP_TX) { toast(`ฝากที่ตู้ได้ครั้งละไม่เกิน ${bS(DEP_TX)}`, '🏧'); return; } if (S._c < n) { toast(`เงินสดในกระเป๋าไม่พอ (มี ${bS(S._c)})`, '💸'); return; }
      S._c -= n; B.setBal(acc, B.balOf(acc) + n); B.tx(`ฝากเงินสด ATM (${acc.name})`, n, acc.id); try { Bank2.log('ฝากเงินสด ATM', n); Sfx.coin(); } catch (e) { }
      rec('🏦', 'ฝากเงินสดสำเร็จ', `จำนวน ${bS(n)}`, `เข้าบัญชี ${acc.name} (${acc.no})`, `คงเหลือ ${bS(B.balOf(acc))}`);
      return;
    }
    if (a === 'trx') {
      const f = accOf(val('atmFrom')), t = accOf(val('atmTo')), n = Math.round(+val('atmAmt') || 0);
      if (!f || !t || f === t || !(n >= 1)) { toast('เลือกบัญชีต้นทางกับปลายทางที่ต่างกัน และพิมพ์จำนวนเงิน', 'ℹ️'); return; }
      if (n > XFER_ATM) { toast(`โอนที่ตู้ ATM ได้ครั้งละไม่เกิน ${bS(XFER_ATM)} (ยอดมากกว่านี้ใช้แอปหรือเคาน์เตอร์)`, '🏧'); return; } if (B.balOf(f) < n) { toast(`เงินใน${f.name}ไม่พอ`, '💸'); return; }
      B.setBal(f, B.balOf(f) - n); B.setBal(t, B.balOf(t) + n); B.tx(`โอน ${f.name} → ${t.name} ${baht(n)} (ATM)`, 0, f.id); try { Bank2.log(`โอนระหว่างบัญชีตัวเอง (ATM)`, 0); Sfx.coin(); } catch (e) { }
      rec('🔁', 'โอนเงินสำเร็จ', `จำนวน ${bS(n)}`, `จาก ${f.name} → ${t.name}`, `${f.name} คงเหลือ ${bS(B.balOf(f))}`);
      return;
    }
    if (a === 'pwx') {
      const o = String(val('atmOld') || ''), n1 = String(val('atmNew') || ''), n2 = String(val('atmNew2') || '');
      if (o !== s.pin) { A.msg = 'รหัสเดิมไม่ถูกต้อง'; return; } if (!/^\d{6}$/.test(n1)) { A.msg = 'รหัสใหม่ต้องเป็นตัวเลข 6 หลัก'; return; } if (n1 !== n2) { A.msg = 'รหัสใหม่ไม่ตรงกัน'; return; } if (n1 === o) { A.msg = 'รหัสใหม่ต้องไม่ซ้ำกับรหัสเดิม'; return; }
      s.pin = n1; s.changed = 1; rec('🔑', 'เปลี่ยนรหัสผ่านสำเร็จ', 'ใช้รหัสใหม่ในการใช้ตู้ ATM ครั้งต่อไป');
    }
  };
  // every ATM on the map opens the real ATM
  for (const p of World.pois) if (p.label === 'ตู้ ATM') p.act = () => ({ icon: '🏧', label: 'ใช้ตู้ ATM (ใส่บัตร + รหัสผ่าน)', fn: () => openATM() });
  window.ATM71 = { open: openATM };

  // ======================= bank counter: cash in and out =======================
  UI.H.cnt71 = d => {
    const [a, x] = String(d.v || '').split('|'), acc = accts().find(q => q.id === val('cnt71Acct')) || accts()[0];
    if (!B.bankOpen()) { toast('เคาน์เตอร์ปิดอยู่ เปิด จ–ศ 08:30–16:30', '🕘'); return; }
    if (!B.hasId()) { toast('ทำรายการที่เคาน์เตอร์ต้องใช้บัตรประชาชน (ทำที่ศูนย์ราชการ)', '🪪'); return; }
    const n = a.endsWith('q') ? +x : Math.round(+val('cnt71Amt') || 0), kind = a.startsWith('wd') ? 'wd' : 'dp';
    if (!(n >= 1)) { toast('พิมพ์จำนวนเงิน', 'ℹ️'); return; }
    if (n >= 2000000) note('ธนาคารสุขใจ', `ธุรกรรมเงินสด ${bS(n)} ที่เคาน์เตอร์ ธนาคารรายงานสำนักงาน ปปง. ตามกฎหมาย (ธุรกรรมเงินสดตั้งแต่ 2 ล้านบาท)`);
    if (kind === 'wd') {
      if (B.balOf(acc) < n) { toast(`เงินใน${acc.name}ไม่พอ (มี ${bS(B.balOf(acc))})`, '💸'); return; }
      B.setBal(acc, B.balOf(acc) - n); S._c += n; B.tx(`ถอนเงินสดที่เคาน์เตอร์ (${acc.name})`, -n, acc.id); try { Bank2.log('ถอนเงินสดที่เคาน์เตอร์', -n); Sfx.coin(); } catch (e) { }
      toast(`ถอน ${bS(n)} จาก${acc.name} เข้ากระเป๋าเงินสดแล้ว · เงินสด ${bS(S._c)}`, '💵'); if (n >= 1000) note('ธนาคารสุขใจ', `ถอนเงินสดที่เคาน์เตอร์ ${bS(n)} จากบัญชี ${acc.no} คงเหลือ ${bS(B.balOf(acc))}`);
    } else {
      if (S._c < n) { toast(`เงินสดในกระเป๋าไม่พอ (มี ${bS(S._c)})`, '💸'); return; }
      S._c -= n; B.setBal(acc, B.balOf(acc) + n); B.tx(`ฝากเงินสดที่เคาน์เตอร์ (${acc.name})`, n, acc.id); try { Bank2.log('ฝากเงินสดที่เคาน์เตอร์', n); Sfx.coin(); } catch (e) { }
      toast(`ฝาก ${bS(n)} เข้า${acc.name} แล้ว · คงเหลือ ${bS(B.balOf(acc))}`, '🏦');
    }
  };
  { const _bu = Bank2.ui.bind(Bank2);
    Bank2.ui = function () {
      _bu(); const c = UI.cur; if (!c || c._c71) return; c._c71 = 1; const r0 = c.render;
      c.render = t => {
        const html = r0(t); if (t !== 0) return html;
        const quick = [['wd', 1000], ['wd', 10000], ['wd', 100000], ['wd', 1000000]];
        return `<h5>🏦 เคาน์เตอร์: ถอน / ฝากเงินสด</h5><p class="dim">${B.bankOpen() ? '🟢 เคาน์เตอร์เปิด' : '🔴 เคาน์เตอร์ปิด (จ–ศ 08:30–16:30)'} · ใช้บัตรประชาชน · ไม่จำกัดวงเงิน ไม่มีค่าธรรมเนียม · ถอนแล้วเงินเข้ากระเป๋าเงินสดทันที ${B.hasId() ? '' : '· <b class="bad">ยังไม่มีบัตรประชาชน</b>'}</p>
          <p class="dim" style="margin:4px 0">เลือกบัญชีที่จะถอน / ฝากเงินสด</p><div class="row">${acctOpts('main', 'cnt71Acct')}</div><div class="row"><input id="cnt71Amt" type="number" min="1" placeholder="พิมพ์จำนวนเงิน (บาท)" style="flex:1;min-width:0;padding:8px;border-radius:10px;border:1px solid #ccc"></div>
          <div class="row"><button class="btn" data-a="cnt71" data-v="wd|">💵 ถอนเงินสด</button><button class="btn ghost" data-a="cnt71" data-v="dp|">🏦 ฝากเงินสด</button></div>
          <div class="row">${quick.map(([k, n]) => `<button class="btn ghost" data-a="cnt71" data-v="wdq|${n}">ถอน ${n.toLocaleString('en-US')}</button>`).join('')}</div><p class="dim">เงินสดในกระเป๋า ${bS(S._c)}</p>` + html;
      };
      UI.renderBody();
    }; }
  window.Bank71 = { st, openATM, showShort };
});
