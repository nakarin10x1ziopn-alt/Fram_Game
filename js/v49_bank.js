'use strict';
// ---------- v49_bank: real-life banking: accounts, a mobile banking app, cheques, and a checkout that asks how you pay ----------
// MONEY MODEL  S.money is an accessor now. The wallet holds CASH (Pay49.cash()); the bank holds the rest (main savings = Bank.st().sav, plus accounts opened in the app).
//   * Old code that reads/changes S.money keeps working as a debit card would: it sees cash + main savings and spends cash first, then savings.
//   * During a checkout Pay49.src pins the money to ONE source (cash / savings / current account) so the purchase really comes from the method the player chose.
//   * The save file stores S.money = cash only (toJSON); everything else lives in S.bank / S.v49.
// START MONEY  every new save: 10,000 cash. Test period (before 1 Dec 2569): bank 80,000,000. After it: bank 30,000. Old saves keep their total; cash above 10,000 moves into the bank.
// PAYMENT RULES (per payment)   cash up to 50,000 | app transfer / PromptPay up to 100,000 (200,000 a day) | from 100,000 up: personal cheque, cashier's cheque or counter withdrawal only.
//   Personal cheque: a current account with a chequebook, clears next business day (funds held), shops stop taking your cheques for 60 days after a bounce.
//   Cashier's cheque / counter withdrawal: bank hours Mon-Fri 08:30-16:30, a small fee.
V23.add('v49_bank', () => {
  const CASH_MAX = 50000, APP_MAX = 100000, APP_DAY = 200000, HIGH = 100000, AUTO_CASH = 300, START_CASH = 10000, LEAVES = 20;
  const OWN_MAX = 10000000;      // moving money between your own accounts in the app: any typed amount, up to 10 million baht a time
  const PAYEES = ['ร้านค้าในหมู่บ้าน', 'ซูเปอร์มาร์เก็ตสุขใจมาร์ท', 'ร้านวัสดุก่อสร้าง', 'ร้านเฟอร์นิเจอร์สุขใจ', 'ร้านอุปกรณ์เกษตร', 'ร้านอาหาร', 'คาเฟ่', 'อู่ซ่อมรถ', 'โชว์รูมรถยนต์', 'คอมพิวเตอร์พลาซ่า', 'ห้างสุขใจพลาซ่า', 'โรงพยาบาล / คลินิก', 'ร้านขายยา', 'การไฟฟ้า', 'การประปา', 'โรงเรียน / สถาบันอบรม', 'ผู้รับเหมาก่อสร้าง', 'เจ้าของบ้านเช่า / ที่ดิน', 'ศูนย์ราชการ', 'บุคคลทั่วไป (พิมพ์ชื่อเอง)'];
  const PURPOSES = ['ค่าสินค้า', 'ค่าบริการ / ค่าซ่อม', 'ค่าเช่า', 'ค่าน้ำ / ค่าไฟ', 'ค่าเล่าเรียน / ค่าอบรม', 'ค่ารักษาพยาบาล', 'ค่าก่อสร้าง / ต่อเติม', 'ค่าผ่อนชำระ', 'ค่ามัดจำ', 'อื่น ๆ'];
  const wkOf = d => (d - 1) % 7, isHolB = d => { try { return !!(window.Cal24 && Cal24.isHoliday(d)); } catch (e) { return false; } }, isBiz = d => wkOf(d) < 5 && !isHolB(d), nextBiz = d => { let x = d + 1; while (!isBiz(x)) x++; return x; };   // banks are shut on public holidays too
  const hasId = () => { try { return !!Gov24.has('idcard'); } catch (e) { return false; } };
  const hourNow = () => S.time / 60, bankOpen = () => isBiz(S.day) && hourNow() >= 8.5 && hourNow() < 16.5;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const toast = (t, i) => { try { UI.toast(t, i || '🏦'); } catch (e) { } };
  const val = id => (document.getElementById(id) || {}).value;
  const V = () => { const v = S.v49 = S.v49 || {}; v.accts = v.accts || []; v.ch = v.ch || []; v.book = v.book || { left: 0, next: 1001 }; v.pp = v.pp || { reg: 0, phone: '' }; v.lim = v.lim || { d: 0, used: 0 }; v.bounce = v.bounce || []; v.tx = v.tx || []; v.seq = v.seq || 0; if (v.ask == null) v.ask = 0; return v; };
  const dayLim = () => Math.min(APP_DAY, (V().cfg && V().cfg.day) || APP_DAY);   // the daily app-transfer limit can be lowered in settings
  const rid = (() => { let s = 0; const p = safeGet('raisukjai3d_pid') || 'p'; for (const c of p) s = (s * 31 + c.charCodeAt(0)) % 99999; return s; })();
  const acctNo = (t, i) => `${String(rid % 900 + 100)}-${t === 'cur' ? '3' : '2'}-${String((rid * (i + 7)) % 90000 + 10000)}-${(rid + i) % 10}`;

  // ===================== money accessor =====================
  const P = window.Pay49 = { src: null, busy: false, inter: false, watch: null, onSpend: null, AUTO_CASH, CASH_MAX, APP_MAX, APP_DAY: 200000, HIGH, START_CASH };
  const curAcct = () => V().accts.find(a => a.type === 'cur');
  const bal = s => s === 'cash' ? S._c : s === 'sav' ? Bank.st().sav : s === 'cur' ? (curAcct() ? curAcct().bal : 0) : s === 'card' ? (window.Card168 ? window.Card168.avail() : 0) : S._c + Bank.st().sav;
  const addTo = (s, d) => { if (s === 'sav') Bank.st().sav += d; else if (s === 'cur') { const a = curAcct(); if (a) a.bal += d; else S._c += d; } else if (s === 'card') { if (window.Card168) window.Card168.refund(d); } else S._c += d; };
  P.cash = () => S._c; P.bal = bal; P.total = () => S._c + Bank.st().sav;
  function install() {
    const c0 = Number.isFinite(S.money) ? S.money : 0;
    Object.defineProperty(S, '_c', { value: c0, writable: true, enumerable: false, configurable: true });
    Object.defineProperty(S, 'money', {
      configurable: true, enumerable: false,
      get() { return P.inter && P.src == null ? S._c : bal(P.src); },   // while the player's own click is being handled (PayGate), money means the cash in the wallet
      set(v) {
        const cur = P.inter && P.src == null ? S._c : bal(P.src); if (!Number.isFinite(v)) { if (!Number.isFinite(cur)) S._c = 0; return; } if (!Number.isFinite(cur)) { S._c = v; return; }
        const d = v - cur; if (!d) return;
        if (d < 0 && P.onSpend) P.onSpend(-d);   // v173: a click is about to pay: the payment window may take over first
        if (d > 0) { addTo(P.src, d); return; }
        let take = -d; const s = P.src;
        if (s === 'cash') S._c -= take; else if (s === 'sav') Bank.st().sav -= take; else if (s === 'cur') { const a = curAcct(); if (a) a.bal -= take; else S._c -= take; }
        else if (s === 'card') { if (window.Card168) window.Card168.charge(take); }
        else if (!P.inter && !P.busy) { const b = Bank.st(), fs = Math.min(Math.max(b.sav, 0), take); b.sav -= fs; take -= fs; const fc = Math.min(Math.max(S._c, 0), take); S._c -= fc; take -= fc; if (take > 0) b.sav -= take; }   // v181: automatic charges (mortgage, fees, tax ...) are bank auto-debits: savings first
        else { const fc = Math.min(Math.max(S._c, 0), take); S._c -= fc; take -= fc; const b = Bank.st(), fs = Math.min(Math.max(b.sav, 0), take); b.sav -= fs; take -= fs; if (take > 0) S._c -= take; }
      },
    });
    Object.defineProperty(S, 'toJSON', { value() { const o = {}; for (const k of Object.keys(this)) o[k] = this[k]; o.money = this._c; return o; }, enumerable: false, configurable: true });
  }
  install();
  // old saves: cash above the wallet limit goes into the bank (nothing is lost)
  if (!S.v49 && !G.fresh && S._c > START_CASH) { const ex = S._c - START_CASH; S._c = START_CASH; Bank.st().sav += ex; try { Phone.msg('ธนาคารสุขใจ', `ระบบใหม่: เงินสดในกระเป๋าเก็บได้สูงสุด ${baht(START_CASH)} ย้ายเงินส่วนเกิน ${baht(ex)} เข้าบัญชีออมทรัพย์ของคุณแล้ว`); } catch (e) { } }
  V();
  P.setStart = (cash, bank) => { S._c = cash; Bank.st().sav = bank; try { Bank2.log('เงินเริ่มต้นเข้าบัญชีออมทรัพย์', bank); } catch (e) { } };
  { const hud = UI.hud.bind(UI); UI.hud = function () { hud(); try { const el = $('money'); if (el) el.textContent = baht(S._c); } catch (e) { } }; }
  { const rb = UI.renderBody.bind(UI); UI.renderBody = function () { rb(); try { const el = $('mWallet'); if (el) el.textContent = 'เงินสด ' + baht(S._c); } catch (e) { } }; }
  for (const k of ['deposit']) { const f = Bank[k].bind(Bank); Bank[k] = n => { const o = P.src; P.src = 'cash'; try { f(n); } finally { P.src = o; } }; }

  // ===================== accounts =====================
  const all = () => { const l = [{ id: 'main', type: 'sav', name: 'ออมทรัพย์ (บัญชีหลัก)', no: acctNo('sav', 0), main: 1 }]; return l.concat(V().accts); };
  const balOf = a => a.main ? Bank.st().sav : a.bal;
  const setBal = (a, v) => { if (a.main) Bank.st().sav = v; else a.bal = v; };
  const TYPE = { sav: ['💰', 'ออมทรัพย์'], cur: ['🧾', 'กระแสรายวัน (เช็ค)'] };
  function tx(t, amt, acct) { const v = V(); v.tx.unshift({ d: S.day, t, a: Math.round(amt), ac: acct || '' }); if (v.tx.length > 60) v.tx.length = 60; }
  // open an account (v1.1: also used by the branch counter): type 'sav' | 'cur', first deposit, an optional own name, money from the 'sav' (main savings) or from 'cash' in the wallet. Returns the new account or null.
  function openNew(type, dep, nm, src, counter) {
    const v = V(), min = type === 'cur' ? 2000 : 500; dep = Math.round(+dep || 0); src = src === 'cash' ? 'cash' : 'sav';
    if (!hasId()) { toast('เปิดบัญชีต้องใช้บัตรประชาชน (ทำที่ศูนย์ราชการ)', '🪪'); return null; }
    if (type === 'cur' && v.accts.some(a => a.type === 'cur')) { toast('มีบัญชีกระแสรายวันแล้ว', 'ℹ️'); return null; }
    if (type === 'sav' && v.accts.filter(a => a.type === 'sav').length >= 5) { toast('เปิดบัญชีออมทรัพย์เพิ่มได้สูงสุด 5 บัญชี', 'ℹ️'); return null; }
    if ((type === 'cur' || counter) && !bankOpen()) { toast('เปิดบัญชีที่สาขาได้ จ-ศ 08:30–16:30', '🕘'); return null; }
    if (dep < min) { toast(`ฝากเปิดบัญชีขั้นต่ำ ${baht(min)}`, '💸'); return null; }
    if (src === 'cash' ? S._c < dep : Bank.st().sav < dep) { toast(src === 'cash' ? 'เงินสดในกระเป๋าไม่พอสำหรับฝากเปิดบัญชี' : 'เงินในบัญชีออมทรัพย์หลักไม่พอสำหรับฝากเปิดบัญชี', '💸'); return null; }
    if (src === 'cash') S._c -= dep; else Bank.st().sav -= dep;
    const nSav = v.accts.filter(x => x.type === 'sav').length, a = { id: 'a' + (++v.seq), type, name: String(nm || '').trim().slice(0, 24) || (type === 'cur' ? 'กระแสรายวัน' : 'ออมทรัพย์เพิ่มเติม ' + (nSav + 1)), no: acctNo(type, v.seq), bal: dep, opened: S.day };
    v.accts.push(a); if (type === 'cur') { v.book.left += LEAVES; } tx(`เปิดบัญชี${TYPE[type][1]} ${a.no}`, dep, a.id);
    try { Bank2.log(`เปิดบัญชี${TYPE[type][1]} (ฝากเปิดบัญชีจาก${src === 'cash' ? 'เงินสด' : 'บัญชีหลัก'})`, 0); } catch (e) { }
    try { Phone.msg('ธนาคารสุขใจ', `เปิดบัญชี${TYPE[type][1]} เลขที่ ${a.no} สำเร็จ ฝากเริ่มต้น ${baht(dep)}${type === 'cur' ? ` · ได้สมุดเช็ค 1 เล่ม (${LEAVES} ใบ)` : ''}`); } catch (e) { }
    toast(`เปิดบัญชีสำเร็จ ${a.no}`, '✅');
    try { if (window.Slip49) window.Slip49.make({ k: 'acct', amt: dep, payee: a.name, memo: `เปิดบัญชี${TYPE[type][1]} เลขที่ ${a.no}`, from: src === 'cash' ? 'เงินสดในกระเป๋า' : 'ออมทรัพย์ ' + all()[0].no, neutral: true }); } catch (e) { }
    return a;
  }
  function openAcct(type) { openNew(type, +val('b49Dep') || 0, '', 'sav', false); }
  const _bd = Bank.day.bind(Bank); Bank.day = function () { _bd(); try { for (const a of V().accts) if (a.type === 'sav' && a.bal > 0) { const it = Math.floor(a.bal * BANK.rate); if (it > 0) a.bal += it; } } catch (e) { } };

  // ===================== cheques =====================
  const accepts = () => !V().bounce.some(d => S.day - d < 60) && V().bounce.filter(d => S.day - d < 180).length < 3;
  const leaves = () => V().book.left;
  const payeeIn = () => { const sel = val('b49PayeeSel') || '', other = (val('b49PayeeOther') || '').trim().slice(0, 30); return sel.indexOf('บุคคลทั่วไป') === 0 ? other : sel; };
  function writeCheque() {
    const v = V(), a = curAcct(), amt = Math.round(+val('b49Amt') || 0), payee = payeeIn(), purpose = val('b49Memo') || PURPOSES[0], ahead = clamp(Math.round(+val('b49Ahead') || 0), 0, 30);
    if (!a) { toast('ต้องมีบัญชีกระแสรายวัน', '🧾'); return; } if (v.book.left < 1) { toast('สมุดเช็คหมด ขอเล่มใหม่ก่อน', '📒'); return; }
    if (!payee) { toast('เลือกผู้รับเงิน (หรือพิมพ์ชื่อผู้รับ)', 'ℹ️'); return; } if (!(amt >= 1)) { toast('ใส่จำนวนเงิน', 'ℹ️'); return; }
    if (amt > 100000000) { toast('จำนวนเงินในเช็คสูงเกินไป', 'ℹ️'); return; }
    const create = () => {
      const c = { no: v.book.next++, payee, amt, issued: S.day, date: S.day + ahead, t: S.time, clearAt: nextBiz(S.day + ahead), status: 'pending', kind: 'personal', crossed: 1, memo: purpose, held: 0, sig: window.Slip49 ? window.Slip49.takeSig() : null }; v.book.left--; v.ch.unshift(c);
      tx(`เขียนเช็ค #${c.no} จ่าย ${payee} (${purpose})`, 0, a.id);
      toast(`เขียนเช็คเลขที่ ${c.no} สั่งจ่าย ${payee} ${baht(amt)}${ahead ? ` ลงวันที่ ${RD(c.date)}` : ''}`, '🧾');
      try { if (window.Slip49) window.Slip49.make({ k: 'cheque', amt, payee, memo: purpose, from: `กระแสรายวัน ${a.no}`, ch: c.no }); } catch (e) { console.warn('slip', e); }
    };
    if (window.Slip49) window.Slip49.sign({ kind: 'cheque', no: v.book.next, payee, amt, date: S.day + ahead, memo: purpose, t: S.time }, () => { window.Slip49.back(); create(); }, () => window.Slip49.back()); else create();
  }
  function clearDay() {
    const v = V();
    for (const c of v.ch) {
      if (c.status !== 'pending' || S.day < c.clearAt) continue;
      if (c.held) { c.status = 'cleared'; tx(`เช็คเลขที่ ${c.no} เคลียร์แล้ว (${c.payee})`, 0); continue; }
      const a = curAcct();
      if (a && a.bal >= c.amt) { a.bal -= c.amt; c.status = 'cleared'; tx(`เช็คเลขที่ ${c.no} จ่าย ${c.payee}`, -c.amt, a.id); try { Phone.msg('ธนาคารสุขใจ', `เช็คเลขที่ ${c.no} สั่งจ่าย ${c.payee} ${baht(c.amt)} ผ่านการเรียกเก็บแล้ว`, true); } catch (e) { } }
      else { c.status = 'bounced'; v.bounce.push(S.day); const fee = 500; if (a && a.bal >= fee) a.bal -= fee; else Bank.st().sav = Math.max(0, Bank.st().sav - fee); tx(`เช็คคืน เลขที่ ${c.no} (เงินไม่พอ) ค่าธรรมเนียม`, -fee, a ? a.id : 'main'); try { Phone.msg('ธนาคารสุขใจ', `⚠️ เช็คเลขที่ ${c.no} ${baht(c.amt)} ถูกคืน: เงินในบัญชีกระแสรายวันไม่พอ ค่าธรรมเนียมเช็คคืน ${baht(fee)} · ร้านค้าจะไม่รับเช็คของคุณ 60 วัน`, false); } catch (e) { } }
    }
    if (v.ch.length > 60) v.ch.length = 60;
  }
  const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { clearDay(); } catch (e) { console.warn('v49 clear', e); } return r; };

  // ===================== checkout =====================
  const cashierFee = n => clamp(Math.round(n * 0.001), 20, 500), drawFee = n => clamp(Math.round(n * 0.0005), 30, 700);
  const M = { cash: ['💵', 'เงินสด'], app: ['📱', 'โอนผ่านแอปธนาคาร'], pp: ['🔳', 'พร้อมเพย์ (สแกน QR)'], cheque: ['🧾', 'เซ็นเช็คส่วนตัว'], cashier: ['🏦', 'แคชเชียร์เช็ค'], draw: ['🏛️', 'เบิกที่ธนาคาร (โอนที่เคาน์เตอร์)'], card: ['💳', 'บัตรเครดิต'], cardB: ['💳', 'บัตรเครดิตใบที่ 2'], cardC: ['💳', 'บัตรเครดิตใบที่ 3'], debit: ['💳', 'บัตรเดบิต'], inst3: ['🧾', 'ผ่อนบัตรเครดิต 3 เดือน'], inst6: ['🧾', 'ผ่อนบัตรเครดิต 6 เดือน'], inst10: ['🧾', 'ผ่อนบัตรเครดิต 10 เดือน'], inst12: ['🧾', 'ผ่อนบัตรเครดิต 12 เดือน'], inst24: ['🧾', 'ผ่อนบัตรเครดิต 24 เดือน'] };
  const isCardM = m => m.startsWith('card') || m.startsWith('inst');
  function methods(n) {
    const v = V(), a = curAcct(), used = v.lim.d === S.day ? v.lim.used : 0, high = n >= HIGH, out = [];
    const add = (k, ok, why, fee = 0, extra = '') => out.push({ k, ok, why: ok ? extra : why, fee });
    add('cash', !high && n <= CASH_MAX && S._c >= n, high ? 'ยอด ≥ 100,000 จ่ายเงินสดไม่ได้' : n > CASH_MAX ? `เงินสดจ่ายได้ไม่เกิน ${baht(CASH_MAX)}` : `เงินสดในกระเป๋า ${baht(S._c)} ไม่พอ`, 0, `เหลือเงินสด ${baht(S._c - n)}`);
    const appOk = !high && n <= APP_MAX && used + n <= dayLim() && Bank.st().sav >= n;
    const appWhy = high ? 'ยอด ≥ 100,000 ต้องจ่ายเช็คหรือเบิกที่ธนาคาร' : n > APP_MAX ? `โอนผ่านแอปได้ไม่เกิน ${baht(APP_MAX)}/ครั้ง` : used + n > dayLim() ? `เกินวงเงินโอนต่อวัน ${baht(dayLim())}` : `เงินในบัญชีออมทรัพย์ ${baht(Bank.st().sav)} ไม่พอ`;
    add('app', appOk, appWhy, 0, `หักจากบัญชีออมทรัพย์ คงเหลือ ${baht(Bank.st().sav - n)}`);
    add('pp', appOk && hasId() && v.pp.reg, !hasId() ? 'ต้องมีบัตรประชาชนลงทะเบียนพร้อมเพย์' : !v.pp.reg ? 'ยังไม่ได้ลงทะเบียนพร้อมเพย์ (ในแอปธนาคาร > ตั้งค่า)' : appWhy, 0, 'หักจากบัญชีออมทรัพย์');
    add('cheque', !!a && v.book.left > 0 && a.bal >= n && accepts(), !a ? 'ต้องเปิดบัญชีกระแสรายวันก่อน: ไปที่สาขาธนาคาร (จ–ศ 08:30–16:30) ใช้บัตรประชาชน ฝากเริ่มต้น 2,000 ฿ จะได้สมุดเช็ค 20 ใบ' : v.book.left < 1 ? 'สมุดเช็คหมด ขอเล่มใหม่ในแอปธนาคาร > เช็ค (100 ฿)' : !accepts() ? 'เพิ่งมีเช็คคืน ร้านค้าไม่รับเช็คของคุณ (60 วัน)' : `เงินในบัญชีกระแสรายวัน ${baht(a.bal)} ไม่พอ ยังขาด ${baht(n - a.bal)}${Bank.st().sav >= n - a.bal ? ' · กดปุ่ม "โอนเข้ากระแสรายวัน" ด้านล่างเพื่อเติมจากออมทรัพย์แล้วจ่ายเช็คได้ทันที' : ' · ออมทรัพย์ก็ไม่พอ'}`, 0, `เช็คใบที่ ${v.book.next} · เคลียร์ ${RD(nextBiz(S.day))}`);
    const cf = cashierFee(n), src = Bank.st().sav >= n + cf ? 'sav' : (a && a.bal >= n + cf ? 'cur' : '');
    add('cashier', n >= 5000 && bankOpen() && hasId() && !!src, n < 5000 ? 'แคชเชียร์เช็คออกขั้นต่ำ 5,000' : [!bankOpen() && 'ธนาคารปิด (เปิด จ–ศ 08:30–16:30 ไม่ใช่วันหยุด)', !hasId() && 'ต้องมีบัตรประชาชน (ทำที่ศูนย์ราชการ)', !src && `เงินในบัญชีไม่พอ (ต้องมี ${baht(n + cf)})`].filter(Boolean).join(' · '), cf, `ค่าธรรมเนียม ${baht(cf)}`);
    const df = drawFee(n); add('draw', high && bankOpen() && hasId() && Bank.st().sav >= n + df, !high ? 'ใช้กับยอด ≥ 100,000' : [!bankOpen() && 'ธนาคารปิด (เปิด จ–ศ 08:30–16:30 ไม่ใช่วันหยุด)', !hasId() && 'ต้องมีบัตรประชาชน (ทำที่ศูนย์ราชการ)', !(Bank.st().sav >= n + df) && `เงินในบัญชีออมทรัพย์ไม่พอ (ต้องมี ${baht(n + df)})`].filter(Boolean).join(' · '), df, `ค่าธรรมเนียม ${baht(df)}`);
    if (window.Debit169) for (const x of window.Debit169.methods(n)) out.push(x);
    if (window.Card168) for (const x of window.Card168.methods(n)) out.push(x);
    if (window.Evt170 && window.Evt170.outage()) for (const x of out) if (x.k === 'app' || x.k === 'pp') { x.ok = false; x.why = 'ระบบแอปธนาคารและพร้อมเพย์ขัดข้องชั่วคราว'; }
    return out;
  }
  const srcOf = (m, n) => isCardM(m) ? 'card' : m === 'debit' ? 'sav' : m === 'cash' ? 'cash' : m === 'cheque' ? 'cur' : m === 'cashier' ? (Bank.st().sav >= n + cashierFee(n) ? 'sav' : 'cur') : 'sav';
  // run `fn` (the shop's own purchase code) with the money pinned to the chosen source; returns true if it really spent
  function exec(m, n, label, payee, fn) {
    const src = srcOf(m, n), fee = m === 'cashier' ? cashierFee(n) : m === 'draw' ? drawFee(n) : 0, v = V();
    P.busy = true; P.src = src; const b0 = bal(src);
    try {
      if (fee) { if (bal(src) < fee) return false; addTo(src, -fee); }
      fn();
    } finally { P.src = null; P.busy = false; }
    const spent = b0 - fee - bal(src);
    if (spent <= 0) { if (fee) addTo(src, fee); return false; }
    const nm = M[m][1];
    if (m === 'debit' && window.Debit169) window.Debit169.use(spent);
    if (m === 'app' || m === 'pp') { if (v.lim.d !== S.day) v.lim = { d: S.day, used: 0 }; v.lim.used += spent; }
    let chNo = null; const SLP = window.Slip49, sg = (m === 'cheque' || m === 'cashier') && SLP ? SLP.takeSig() : null;
    if (m === 'cheque') { const c = { no: v.book.next++, payee, amt: Math.round(spent), issued: S.day, date: S.day, t: S.time, clearAt: nextBiz(S.day), status: 'pending', kind: 'personal', crossed: 1, memo: label, held: 1, sig: sg }; chNo = c.no; v.book.left--; v.ch.unshift(c); }
    if (m === 'cashier' || m === 'draw') { const c = { no: 'C' + (++v.seq), payee, amt: Math.round(spent), issued: S.day, date: S.day, t: S.time, clearAt: S.day, status: 'cleared', kind: m, crossed: 1, memo: label, held: 1, sig: sg }; if (m === 'cashier') chNo = c.no; v.ch.unshift(c); }
    let cardTxt = ''; if (isCardM(m) && window.Card168) cardTxt = window.Card168.record(m, spent, label, payee);
    if (m !== 'cash' && !isCardM(m)) { try { Bank2.log(`${nm}: ${label}`, -(spent + fee)); } catch (e) { } tx(`${nm}: ${label}`, -(spent + fee), src === 'cur' ? (curAcct() || {}).id : 'main'); }
    toast(`ชำระ ${baht(spent)} ด้วย${nm}${fee ? ` (ค่าธรรมเนียม ${baht(fee)})` : ''}`, M[m][0]);
    try { if (SLP) { const fa = src === 'card' ? 'บัตรเครดิต ' + (window.Card168 ? window.Card168.mask() : '') : src === 'cash' ? 'เงินสดในกระเป๋า' : src === 'cur' ? `กระแสรายวัน ${(curAcct() || {}).no || ''}` : `ออมทรัพย์ ${all()[0].no}`; SLP.make({ k: isCardM(m) ? 'card' : m === 'pp' ? 'pp' : m === 'app' ? 'xfer' : m, amt: spent, fee, payee, memo: label + (cardTxt && m !== 'card' ? ' · ' + cardTxt : ''), from: fa, ch: chNo, quiet: m === 'cash' }); } } catch (e) { console.warn('slip', e); }
    v.lastM = m;
    return true;
  }
  P.exec = exec; P.methods = methods;
  // v144: what a payment of 100,000 or more needs, with a tick or a cross for each thing, and how to get it
  const highHelp = n => {
    const a = curAcct(), v = V(), cf = cashierFee(n), row = (ok, t) => `<p style="margin:2px 0;color:${ok ? '#8be28b' : '#ff9e8a'}">${ok ? '✅' : '❌'} ${t}</p>`;
    return `<div class="card" style="grid-template-columns:1fr"><div class="cb"><h4>ยอด ${baht(n)} ต้องจ่ายด้วยเช็คหรือเบิกที่ธนาคาร</h4>
      <p class="dim" style="margin:6px 0 2px"><b>ทางที่ 1 · เช็คส่วนตัว</b> (จ่ายได้ทุกเวลา ทุกที่ ไม่ต้องรอเวลาธนาคาร)</p>
      ${row(!!a, 'มีบัญชีกระแสรายวัน (เปิดที่สาขา จ–ศ 08:30–16:30 ต้องมีบัตรประชาชน ฝากเริ่มต้น 2,000 ฿)')}${row(!!a && v.book.left > 0, 'มีสมุดเช็ค' + (a ? ` (เหลือ ${v.book.left} ใบ)` : ''))}${row(!!a && a.bal >= n, `เงินในกระแสรายวัน ${baht(a ? a.bal : 0)} ต้องมีอย่างน้อย ${baht(n)} (โอนจากออมทรัพย์ได้ในแอป)`)}${row(accepts(), 'ร้านยังรับเช็คของคุณ (ไม่มีเช็คคืนใน 60 วัน)')}
      <p class="dim" style="margin:8px 0 2px"><b>ทางที่ 2 · แคชเชียร์เช็ค / เบิกที่ธนาคาร</b> (เฉพาะเวลาทำการ มีค่าธรรมเนียมเล็กน้อย ตัดจากออมทรัพย์)</p>
      ${row(hasId(), 'มีบัตรประชาชน (ทำที่ศูนย์ราชการ)')}${row(bankOpen(), 'ธนาคารเปิดอยู่ (จ–ศ 08:30–16:30 ไม่ใช่วันหยุด)')}${row(Bank.st().sav >= n + cf, `เงินออมทรัพย์ ${baht(Bank.st().sav)} ต้องมี ${baht(n + cf)} (รวมค่าธรรมเนียม)`)}
      <div class="row"><button class="btn ghost" data-a="p49app">📱 เปิดแอปธนาคาร (โอนเข้ากระแสรายวัน / ขอสมุดเช็ค) — ยอดนี้จะรอคุณอยู่</button></div></div></div>`;
  };
  const topUp = n => { const a = curAcct(); if (!a || V().book.left < 1 || !accepts() || a.bal >= n) return 0; const need = Math.ceil(n - a.bal); return Bank.st().sav >= need ? need : 0; };
  UI.H.p49up = () => { const o = pend; if (!o) return; const a = curAcct(), need = topUp(o.amount); if (!a || !need) return; xferDone(all()[0], a, need); try { UI.renderBody(); } catch (e) { } };
  UI.H.p49app = () => { try { openApp(2); } catch (e) { } };
  let pend = null;
  // v173: like real life, once you hold a working debit or credit card every purchase asks how to pay (tap the last method again for one-tap payments); with no card, small change is still paid in cash. The setting overrides either way.
  const askOn = () => { const v = V(); if (v.askSet) return !!v.ask; try { return !!(window.Cards171 && (window.Cards171.state('debit') === 'active' || window.Cards171.state('cc0') === 'active')); } catch (e) { return false; } };
  P.askOn = askOn;
  const quickBtn = ms => { const lm = V().lastM, m = lm && ms.find(x => x.k === lm && x.ok); return m && M[lm] ? `<div class="row"><button class="btn" data-a="p49m" data-v="${lm}">⚡ จ่ายด้วย${M[lm][1]}เหมือนครั้งก่อน</button></div>` : ''; };
  function ask(o) {
    const prev = UI.cur ? { title: UI.cur.title, tabs: UI.cur.tabs, tab: UI.cur.tab, render: UI.cur.render, wide: UI.cur.wide } : null; pend = Object.assign({ prev }, o); P.demand = { amount: o.amount, label: o.label, payee: o.payee, fn: o.fn, day: S.day };
    UI.open('💳 เลือกวิธีชำระเงิน', null, () => {
      const ms = methods(o.amount), high = o.amount >= HIGH;
      return `${high ? highHelp(o.amount) : ''}<p class="lead">${esc(o.label || 'ชำระเงิน')} · <b>${baht(o.amount)}</b>${o.payee ? ` · ผู้รับ ${esc(o.payee)}` : ''}</p>
        <p class="dim">เงินสด ${baht(S._c)} · บัญชีออมทรัพย์ ${baht(Bank.st().sav)}${curAcct() ? ` · กระแสรายวัน ${baht(curAcct().bal)}` : ''}${high ? '<br>⚠️ ยอดตั้งแต่ 100,000 บาทต้องจ่ายด้วยเช็คหรือเบิกที่ธนาคารเท่านั้น' : ''}</p>
        ${quickBtn(ms)}<div class="grid">${ms.map(m => `<div class="card"><div class="ci">${M[m.k][0]}</div><div class="cb"><h4>${M[m.k][1]}</h4><p class="dim">${esc(m.why || '')}</p><div class="row"><button class="btn ${m.ok ? '' : 'ghost'}" data-a="p49m" data-v="${m.k}" ${m.ok ? '' : 'disabled'}>จ่ายด้วยวิธีนี้</button>${m.k === 'cheque' && !m.ok && topUp(o.amount) ? `<button class="btn" data-a="p49up">💸 โอนเข้ากระแสรายวัน ${baht(topUp(o.amount))} (จากออมทรัพย์)</button>` : ''}</div></div></div>`).join('')}</div>
        <div class="row end"><button class="btn ghost" data-a="p49c">ยกเลิก</button></div>`;
    });
  }
  const restore = p => { if (p && p.title) { UI.open(p.title, p.tabs && p.tabs.length ? p.tabs : null, p.render, { tab: p.tab, wide: p.wide }); } else UI.close(); };
  UI.H.p49c = () => { const p = pend && pend.prev; pend = null; P.demand = null; restore(p); };
  const gate = (fn, cancel, amt, kind) => { const run = () => (window.Otp169 && amt && window.Otp169.need(amt, kind) ? window.Otp169.ask(fn, cancel, amt) : fn()); return (kind !== 'card' && window.BankPlus && window.BankPlus.pinOn()) ? window.BankPlus.pin(run, cancel) : run(); };
  const needGate = (amt, kind) => (kind !== 'card' && window.BankPlus && window.BankPlus.pinOn()) || (window.Otp169 && window.Otp169.need(amt, kind));
  UI.H.p49m = d => {
    const o = pend; if (!o) return; const ms = methods(o.amount).find(m => m.k === d.v); if (!ms || !ms.ok) return;
    const go = () => { pend = null; restore(o.prev); if (exec(d.v, o.amount, o.label, o.payee, o.fn)) P.demand = null; try { UI.renderBody(); } catch (e) { } };
    if (needSign(d.v)) window.Slip49.sign(signInfo(d.v, o.amount, o.label, o.payee), go, () => UI.H.p49c()); else if (d.v === 'app' || d.v === 'pp') gate(go, () => UI.H.p49c(), o.amount); else if (isCardM(d.v) && window.Otp169 && window.Otp169.need(o.amount, 'card')) gate(go, () => UI.H.p49c(), o.amount, 'card'); else go();
  };
  // cheques and cashier's cheques are signed first (v163): finger or mouse, must match the specimen kept at the bank
  const needSign = m => (m === 'cheque' || m === 'cashier') && !!window.Slip49;
  const signInfo = (m, amt, label, payee) => ({ kind: m, no: m === 'cheque' ? V().book.next : 'C' + (V().seq + 1), payee: payee || 'ร้านค้า', amt: Math.round(amt), date: S.day, memo: label, t: S.time });
  // wrap one purchase entry point: ask how to pay, then run the original with the money pinned to that source
  function guard(obj, key, costFn, labelFn, payeeFn, preFn) {
    const orig = obj[key]; if (typeof orig !== 'function') return;
    obj[key] = function () {
      if (P.busy) return orig.apply(this, arguments);
      const self = this, args = arguments; let n = 0; try { n = costFn.apply(self, args) || 0; } catch (e) { n = 0; }
      if (!(n >= 1)) return orig.apply(self, args);
      // v162: something the purchase needs first (an ID card, a house registration ...) is checked before we ask how to pay, so you are never asked to pay for something that will be refused
      try { if (preFn && !preFn.apply(self, args)) return orig.apply(self, args); } catch (e) { }
      const label = labelFn ? labelFn.apply(self, args) : 'ซื้อสินค้า', payee = payeeFn ? payeeFn.apply(self, args) : '';
      if (n <= AUTO_CASH && !askOn() && S._c >= n) return orig.apply(self, args);               // small change: cash, no questions
      ask({ amount: n, label, payee, fn: () => orig.apply(self, args) });
    };
  }
  P.guard = guard;
  guard(UI.H, 'buy', d => { const e = UI.entry(d.k, UI.shopId); if (!e || e.block || !(e.price > 0)) return 0; const q = +d.q || 1, online = UI.shopId === 'online'; return Math.round(e.price * q * (online ? 1.1 : (typeof shopDiscount === 'function' ? shopDiscount(UI.shopId) : 1))); },
    d => { const e = UI.entry(d.k, UI.shopId); return `${e ? e.name : 'สินค้า'} × ${+d.q || 1}`; }, () => { try { return UI.shopId === 'online' ? 'ร้านค้าออนไลน์' : (SHOPS[UI.shopId] || {}).n || ''; } catch (e) { return ''; } });
  try { guard(HomeBuild, 'buy', function (id) { const L = this.lot(id); return L && !this.st().lots[id] ? L.price : 0; }, function (id) { return 'ซื้อที่ดิน ' + this.lot(id).n; }, () => 'สำนักงานที่ดิน', function () { return !window.Gov24 || (Gov24.has('idcard') && Gov24.has('housereg')); }); } catch (e) { }
  try { guard(HomeBuild, 'build', function (id, k) { const D = HOUSE_DESIGNS[k], st = this.st().lots[id]; return D && st && !st.design ? D.price : 0; }, function (id, k) { return 'จ้างสร้างบ้าน ' + HOUSE_DESIGNS[k].n; }, () => 'ผู้รับเหมาบ้านสุขใจ', function (id) { return !window.Gov24 || (Gov24.has('idcard') && Gov24.has('buildhome:' + id)); }); } catch (e) { }
  try { guard(HouseExt, 'buy', function (k) { const X = HOUSE_EXT[k]; return X && !(S.ext || {})[k] ? X.price : 0; }, function (k) { return 'ต่อเติมบ้าน ' + HOUSE_EXT[k].n; }, () => 'ผู้รับเหมาบ้านสุขใจ'); } catch (e) { }
  try { guard(Prop23, 'order', function (k) { const f = HF[k]; return f ? f.price + 100 : 0; }, function (k) { return 'สั่งเฟอร์นิเจอร์ ' + HF[k].n; }, () => 'ร้านเฟอร์นิเจอร์สุขใจ'); } catch (e) { }

  // ===================== v143: the amount, the payee and the purpose come from the thing you are paying =====================
  // when a payment is waiting (you were asked how to pay, or the cash was short), the bank app shows "pay 1,500 to <shop> for <what>" and fills the transfer form and the cheque by itself
  P.demand = null;
  const D_ = () => { const d = P.demand; return d && d.day === S.day ? d : null; };
  const PAYEE_KEYS = [['ไอที|คอมพิวเตอร์|คอม', 'คอมพิวเตอร์พลาซ่า'], ['พลาซ่า|ห้าง', 'ห้างสุขใจพลาซ่า'], ['มาร์ท|สะดวกซื้อ', 'ซูเปอร์มาร์เก็ต'], ['วัสดุ|ก่อสร้าง|ฮาร์ดแวร์', 'ร้านวัสดุก่อสร้าง'], ['เฟอร์นิเจอร์|ช่างไม้|บ้านสวย', 'ร้านเฟอร์นิเจอร์'], ['เกษตร|ปศุสัตว์|ฟาร์ม|พันธุ์ไม้|ร้านค้าออนไลน์', 'ร้านอุปกรณ์เกษตร'], ['อาหาร|ซีฟู้ด|ป้าแดง|ครัว|ตลาด', 'ร้านอาหาร'], ['คาเฟ่|กาแฟ', 'คาเฟ่'], ['อู่|ซ่อมรถ|แต่งรถ', 'อู่ซ่อมรถ'], ['รถ|มอเตอร์|โชว์รูม', 'โชว์รูมรถยนต์'], ['โรงพยาบาล|คลินิก|หมอ', 'โรงพยาบาล'], ['ยา', 'ร้านขายยา'], ['ไฟฟ้า', 'การไฟฟ้า'], ['ประปา', 'การประปา'], ['ผู้รับเหมา', 'ผู้รับเหมา'], ['ที่ดิน|เช่า|สำนักงานที่ดิน', 'เจ้าของบ้านเช่า'], ['ราชการ|อำเภอ|อบต', 'ศูนย์ราชการ'], ['โรงเรียน|อบรม|เรียน', 'โรงเรียน'], ['ร้านค้าในหมู่บ้าน|ร้านค้า', 'ร้านค้าในหมู่บ้าน']];
  const guessPayee = p => { const q = String(p || '').trim(); if (!q) return ''; const exact = PAYEES.find(x => x === q); if (exact) return exact; for (const [rx, to] of PAYEE_KEYS) if (new RegExp(rx).test(q)) { const hit = PAYEES.find(x => x.indexOf(to) === 0); if (hit) return hit; } return ''; };
  const PURPOSE_KEYS = [['เช่า', 'ค่าเช่า'], ['น้ำ|ไฟ', 'ค่าน้ำ / ค่าไฟ'], ['เรียน|อบรม|เทอม', 'ค่าเล่าเรียน'], ['รักษา|หมอ|ยา|พยาบาล', 'ค่ารักษาพยาบาล'], ['สร้าง|ต่อเติม|ก่อสร้าง', 'ค่าก่อสร้าง'], ['ผ่อน|งวด', 'ค่าผ่อนชำระ'], ['มัดจำ', 'ค่ามัดจำ'], ['ซ่อม|บริการ|ช่าง|ติดตั้ง|ประกอบ', 'ค่าบริการ'], ['ซื้อ|สั่ง|สินค้า', 'ค่าสินค้า']];
  const purposeOf = t => { for (const [rx, to] of PURPOSE_KEYS) if (new RegExp(rx).test(String(t || ''))) { const hit = PURPOSES.find(x => x.indexOf(to) === 0); if (hit) return hit; } return PURPOSES[0]; };
  const dem = () => { const D = D_(); if (!D) { const f = B.fill; return f ? { D: null, amt: f.amt, sel: f.sel, other: f.other || '', purpose: f.purpose } : null; } const g = guessPayee(D.payee || D.label); return { D, amt: Math.round(D.amount), sel: g || PAYEES[PAYEES.length - 1], other: g ? '' : String(D.payee || D.label || 'ผู้รับ').slice(0, 30), purpose: purposeOf((D.label || '') + ' ' + (D.payee || '')) }; };
  const selP = p => { const d = dem(); return d && d.sel === p ? ' selected' : ''; }, selM = p => { const d = dem(); return d && d.purpose === p ? ' selected' : ''; };
  const otherV = () => { const d = dem(); return d ? esc(d.other) : ''; }, amtV = () => { const d = dem(); return d ? d.amt : ''; };
  const THN = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'], POS = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน'];
  const wordsInt = n => { if (n === 0) return ''; if (n >= 1e6) return wordsInt(Math.floor(n / 1e6)) + 'ล้าน' + wordsInt(n % 1e6); const ds = String(n).split('').map(Number); let o = ''; ds.forEach((d, i) => { const p = ds.length - i - 1; if (!d) return; if (p === 1) o += d === 1 ? 'สิบ' : d === 2 ? 'ยี่สิบ' : THN[d] + 'สิบ'; else if (p === 0 && d === 1 && ds.length > 1 && ds[ds.length - 2] !== 0) o += 'เอ็ด'; else o += THN[d] + POS[p]; }); return o; };
  const words = v => { const n = Math.round(+v || 0); return n >= 1 ? wordsInt(n) + 'บาทถ้วน' : ''; };
  const demandHtml = () => { const d = dem(); if (!d || !d.D) return ''; return `<div class="card" style="border:2px solid #ffd54f"><div class="ci">🧾</div><div class="cb"><h4>ยอดที่ต้องชำระ ${baht(d.amt)}</h4><p class="dim">จ่ายให้: <b>${esc(d.D.payee || d.other)}</b> · ค่า: ${esc(d.purpose)} · รายการ: ${esc(d.D.label || '')}</p><div class="row"><button class="btn" data-a="b49" data-v="dpay|app">📱 โอนชำระเลย</button><button class="btn" data-a="b49" data-v="dpay|cheque">🧾 เซ็นเช็คเลย</button></div><p class="dim">ช่องจำนวนเงิน ผู้รับ และค่า ในแบบฟอร์มด้านล่างกรอกให้แล้วตามรายการนี้</p></div></div>`; };
  // ===================== the mobile banking app =====================
  const B = { tab: 0 };
  const bahtS = n => baht(Math.round(n));
  const acctCard = a => `<div class="card"><div class="ci">${TYPE[a.type][0]}</div><div class="cb"><h4>${esc(a.name)}</h4><p class="dim">เลขที่ ${a.no}</p><p><b>${bahtS(balOf(a))}</b></p></div></div>`;
  function tabAccts() {
    const v = V(), l = all(), curA = curAcct();
    return `<div class="card" style="background:linear-gradient(135deg,#08481f,#0b5a2a)"><div class="ci">🏦</div><div class="cb"><h4>ธนาคารสุขใจ</h4><p>เงินสดในกระเป๋า <b>${bahtS(S._c)}</b> · เงินในธนาคารรวม <b>${bahtS(l.reduce((s, a) => s + balOf(a), 0))}</b></p></div></div>
      <div class="grid">${l.map(acctCard).join('')}</div>
      <div class="card"><div class="ci">🏧</div><div class="cb"><h4>ถอน / ฝากเงินสด</h4><p class="dim">แอปธนาคารโอนเงินระหว่างบัญชีได้ แต่ <b>ถอนหรือฝากเงินสดไม่ได้</b> เหมือนในชีวิตจริง · ไปที่ <b>ตู้ ATM</b> (ตลอด 24 ชม. ครั้งละไม่เกิน 20,000 ฿) หรือ <b>เคาน์เตอร์สาขา</b> (จ–ศ 08:30–16:30 ถอนได้ไม่จำกัดจำนวน ทั้งออมทรัพย์และกระแสรายวัน) ถอนแล้วเงินเข้ากระเป๋าเงินสดทันที</p></div></div>
      <h5>เปิดบัญชีใหม่</h5><p class="dim">ใช้บัตรประชาชน · ฝากเริ่มต้นจากบัญชีออมทรัพย์หลัก ${hasId() ? '' : '· <b>ยังไม่มีบัตรประชาชน</b>'}</p>
      <div class="row"><input id="b49Dep" type="number" min="0" step="100" placeholder="เงินฝากเริ่มต้น (บาท)" style="flex:1;font-size:16px;padding:8px;border-radius:10px;border:1px solid #ccc"></div>
      <div class="row"><button class="btn" data-a="b49" data-v="open|sav">💰 เปิดบัญชีออมทรัพย์เพิ่ม (ขั้นต่ำ 500)</button><button class="btn" data-a="b49" data-v="open|cur" ${curA ? 'disabled' : ''}>🧾 เปิดบัญชีกระแสรายวัน (ขั้นต่ำ 2,000 · สาขา)</button></div>`;
  }
  function tabTransfer() {
    const l = all(), opt = l.map(a => `<option value="${a.id}">${esc(a.name)} (${bahtS(balOf(a))})</option>`).join(''), sel = 'font-size:16px;padding:8px;border-radius:10px;border:1px solid #ccc;margin:2px 0';
    const optTo = l.map((a, i) => `<option value="${a.id}" ${i === 1 ? 'selected' : ''}>${esc(a.name)} (${bahtS(balOf(a))})</option>`).join(''), fr = Object.keys(S.friends || {}).slice(0, 12), bill = S.billDue;
    if (!B.fill && !D_()) { const r0 = recent()[0]; if (r0) B.fill = fillOf(r0); }
    const rc = recent(), usedT = V().lim.d === S.day ? V().lim.used : 0, canT = Math.max(0, Math.floor(Math.min(Bank.st().sav, APP_MAX, dayLim() - usedT)));
    const recentH = rc.length ? `<h5>⚡ จ่ายซ้ำรายการล่าสุด (กดโอนเลย)</h5>${rc.map(r => `<div class="card" style="grid-template-columns:1fr auto"><div class="cb"><h4>${esc(r.payee)} · ${bahtS(r.amt)}</h4><p class="dim">${esc(r.memo || '')}</p></div><div class="row" style="margin:0"><button class="btn ghost" data-a="b49" data-v="fill|${r.id}">กรอกให้</button><button class="btn" data-a="b49" data-v="rep|${r.id}" ${r.amt <= canT ? '' : 'disabled'}>โอนเลย</button></div></div>`).join('')}` : '<p class="dim">ยังไม่มีรายการจ่ายล่าสุด · จ่ายครั้งแรกแล้วจะมีปุ่มจ่ายซ้ำให้ที่นี่</p>';
    const chips = `<div class="row" style="margin:0 0 4px">${[100, 500, 1000, 5000, 10000].map(n => `<button class="btn ghost" style="padding:4px 10px;font-size:13px" data-a="b49" data-v="amt|${n}">${n.toLocaleString()}</button>`).join('')}<button class="btn ghost" style="padding:4px 10px;font-size:13px" data-a="b49" data-v="max">สูงสุด ${bahtS(canT)}</button></div>`;
    return `${demandHtml()}<p class="dim">💰 ออมทรัพย์ ${bahtS(Bank.st().sav)} · โอนผ่านแอปได้อีกวันนี้ ${bahtS(canT)}</p>${recentH}<h5>โอนระหว่างบัญชีของฉัน</h5><div class="row"><select id="b49F" style="${sel}">${opt}</select> → <select id="b49T" style="${sel}">${optTo}</select></div>
      <div class="row"><input id="b49Own" type="number" min="1" placeholder="จำนวนเงิน" style="flex:1;${sel}"><button class="btn" data-a="b49" data-v="own">โอน</button></div><p class="dim">พิมพ์จำนวนเงินเองได้ โอนระหว่างบัญชีตัวเอง (ออมทรัพย์ ↔ กระแสรายวัน) ทันที ไม่มีค่าธรรมเนียม ครั้งละไม่เกิน ${bahtS(OWN_MAX)} · ยอดมากกว่านั้นโอนที่เคาน์เตอร์สาขา</p>
      <h5>โอนชำระร้านค้า / ผู้รับอื่น</h5><div class="row"><select id="b49PayeeSel" style="flex:1;${sel}">${PAYEES.map(p => `<option${selP(p)}>${esc(p)}</option>`).join('')}</select></div><div class="row"><input id="b49PayeeOther" value="${otherV()}" placeholder="ชื่อผู้รับ (เมื่อเลือกบุคคลทั่วไป)" style="flex:1;${sel}"></div><div class="row"><select id="b49Memo" style="flex:1;${sel}">${PURPOSES.map(p => `<option${selM(p)}>${esc(p)}</option>`).join('')}</select><input id="b49TM" type="number" min="1" value="${amtV()}" placeholder="จำนวนเงิน" style="flex:1;${sel}"><button class="btn" data-a="b49" data-v="tm">โอน</button></div>${chips}<p class="dim">ตัดจากบัญชีออมทรัพย์หลัก ไม่เกิน ${bahtS(APP_MAX)} ต่อครั้ง และ ${bahtS(dayLim())} ต่อวัน มีรายการในประวัติบัญชี</p>
      ${window.BankPlus ? window.BankPlus.soHtml() : ''}
      <h5>โอนพร้อมเพย์ (เพื่อน / เบอร์โทร / ชื่อผู้รับ)</h5><p class="dim">${hasId() ? 'ตัดจากบัญชีออมทรัพย์หลัก · เลือกเพื่อน หรือพิมพ์เบอร์พร้อมเพย์ 10 หลัก / ชื่อผู้รับเอง (ผู้ส่งไม่ต้องลงทะเบียนพร้อมเพย์)' : 'ต้องมีบัตรประชาชนก่อน (ทำที่ศูนย์ราชการ)'}</p>
      <div class="row"><select id="b49Fr" style="flex:1;${sel}"><option value="">— พิมพ์เบอร์/ชื่อเองด้านล่าง —</option>${fr.map(n => `<option>${esc(n)}</option>`).join('')}</select></div>
      <div class="row"><input id="b49PPw" type="text" inputmode="tel" maxlength="30" placeholder="เบอร์พร้อมเพย์ (08x-xxx-xxxx) หรือชื่อผู้รับ" style="flex:1;${sel}"></div>
      <div class="row"><input id="b49PP" type="number" min="1" placeholder="จำนวนเงิน" style="flex:1;${sel}"><button class="btn" data-a="b49" data-v="pp" ${hasId() ? '' : 'disabled'}>โอน</button></div>
      <h5>จ่ายบิล</h5>${bill ? `<div class="card"><div class="ci">🧾</div><div class="cb"><h4>ค่าน้ำค่าไฟ ${bahtS((bill.elec || 0) + (bill.water || 0))}</h4><p class="dim">ครบกำหนด ${RD(bill.day)}</p><div class="row"><button class="btn" data-a="b49" data-v="bill">จ่ายจากบัญชีออมทรัพย์</button></div></div></div>` : '<p class="empty">ไม่มีบิลค้างจ่าย</p>'}
      <p class="dim">โอนผ่านแอปได้ครั้งละไม่เกิน ${bahtS(APP_MAX)} และไม่เกิน ${bahtS(dayLim())}/วัน</p>`;
  }
  const STAT = { pending: '⏳ รอเคลียร์', cleared: '✅ เคลียร์แล้ว', bounced: '❌ เช็คคืน', stopped: '⛔ ระงับจ่าย' };
  const KIND = { personal: 'เช็คส่วนตัว', cashier: 'แคชเชียร์เช็ค', draw: 'เบิกที่ธนาคาร' };
  function tabCheque() {
    const v = V(), a = curAcct(), f = 'font:inherit;font-size:15px;padding:6px 8px;border-radius:8px;border:1px solid #b9a77a;background:#fffdf3;color:#3a2f10;min-width:0';
    if (!a) return `${window.BankPlus ? window.BankPlus.rcvHtml() : ''}<div class="card"><div class="ci">🧾</div><div class="cb"><h4>เช็คใช้กับบัญชีกระแสรายวัน</h4><p class="dim">ยังไม่มีบัญชี เปิดได้ที่แท็บ "บัญชี" (บัตรประชาชน ฝากเริ่มต้น 2,000 ที่สาขา จ–ศ 08:30–16:30) ได้สมุดเช็คเล่มแรก ${LEAVES} ใบ</p></div></div>
      <p class="dim">ซื้อบ้าน รถ ที่ดิน หรือของราคา ${bahtS(HIGH)} ขึ้นไป ต้องจ่ายด้วยเช็คหรือเบิกที่ธนาคาร</p>`;
    const nextNo = v.book.next, list = v.ch, show = B.chAll ? list.slice(0, 40) : list.slice(0, 5);
    const row = c => `<div style="display:grid;grid-template-columns:1fr auto;gap:2px 10px;padding:7px 2px;border-bottom:1px solid rgba(255,255,255,.1);font-size:13.5px"><span><b>#${c.no}</b> ${esc(c.payee)}<br><small class="dim">${KIND[c.kind] || 'เช็ค'} · ${esc(c.memo || '')} · ${RD(c.date)}</small></span><span style="text-align:right"><b>${bahtS(c.amt)}</b><br><small>${STAT[c.status] || c.status}${c.status === 'pending' && !c.held ? ` · <button class="btn ghost" style="padding:1px 8px;font-size:11.5px" data-a="b49" data-v="stop|${c.no}">ระงับจ่าย</button>` : ''}${c.kind !== 'draw' ? ` · <button class="btn ghost" style="padding:1px 8px;font-size:11.5px" data-a="s163cv" data-v="${c.no}">เปิดใบเช็ค</button>` : ''}</small></span></div>`;
    return `${demandHtml()}${window.Slip49 ? window.Slip49.sigCard() : ''}<div class="card" style="grid-template-columns:46px 1fr"><div class="ci">🧾</div><div class="cb"><h4>กระแสรายวัน ${a.no}</h4><p><b>${bahtS(a.bal)}</b> · สมุดเช็คเหลือ ${v.book.left} ใบ ${accepts() ? '' : `· <span class="bad">ร้านไม่รับเช็คของคุณถึง ${RD(Math.max(...v.bounce) + 60)}</span>`}</p></div></div>
      <div style="background:linear-gradient(135deg,#fdf6d8,#f1e2a6);color:#3a2f10;border:2px solid #b9a77a;border-radius:12px;padding:10px 12px;margin:8px 0;box-shadow:inset 0 0 0 3px rgba(185,167,122,.35)">
        <div style="display:flex;justify-content:space-between;font-size:12.5px;font-weight:600"><span>ธนาคารสุขใจ · เช็คเลขที่ ${nextNo}</span><span>วันที่ ${RD(S.day)}</span></div>
        <div style="display:grid;grid-template-columns:auto 1fr;gap:6px 8px;align-items:center;margin-top:8px;font-size:14px">
          <span>จ่าย</span><select id="b49PayeeSel" style="${f}">${PAYEES.map(p => `<option${selP(p)}>${esc(p)}</option>`).join('')}</select>
          <span></span><input id="b49PayeeOther" value="${otherV()}" placeholder="ชื่อผู้รับ (เมื่อเลือกบุคคลทั่วไป)" style="${f}">
          <span>ค่า</span><select id="b49Memo" style="${f}">${PURPOSES.map(p => `<option${selM(p)}>${esc(p)}</option>`).join('')}</select>
          <span>บาท</span><input id="b49Amt" type="number" min="1" value="${amtV()}" oninput="var w=document.getElementById('b49Words');if(w)w.textContent=Bank49.words(this.value)" placeholder="จำนวนเงิน" style="${f};font-weight:600"><span>ตัวอักษร</span><small id="b49Words" style="font-weight:600">${esc(words(amtV()))}</small>
          <span>ลงวันที่</span><select id="b49Ahead" style="${f}"><option value="0">วันนี้</option><option value="1">ล่วงหน้า 1 วัน</option><option value="3">ล่วงหน้า 3 วัน</option><option value="7">ล่วงหน้า 7 วัน</option><option value="14">ล่วงหน้า 14 วัน</option><option value="30">ล่วงหน้า 30 วัน</option></select>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;font-size:11.5px"><b style="border:1px solid #3a2f10;padding:0 6px">A/C PAYEE ONLY</b><span>ผู้สั่งจ่าย ${esc(S.name || 'ชาวไร่')}</span></div>
      </div>
      <div class="row"><button class="btn" data-a="b49" data-v="wr">✍️ เขียนเช็ค</button><button class="btn ghost" data-a="b49" data-v="book">📒 ขอสมุดเช็คเล่มใหม่ (100 ฿)</button></div>
      <div class="row"><input id="b49Mv" type="number" min="1" placeholder="โอนเงินเข้าบัญชีกระแสรายวัน (พิมพ์จำนวน)" style="flex:1;min-width:0;font:inherit;font-size:15px;padding:8px;border-radius:10px;border:1px solid #ccc"></div>
      <div class="row"><button class="btn" data-a="b49" data-v="tocur">ออมทรัพย์ → กระแสรายวัน</button><button class="btn ghost" data-a="b49" data-v="tosav">กระแสรายวัน → ออมทรัพย์</button></div><p class="dim">โอนได้ครั้งละไม่เกิน ${bahtS(OWN_MAX)} · เช็คตัดบัญชีวันทำการถัดไปจากวันที่ลงในเช็ค เงินไม่พอเช็คจะคืนและเสียค่าธรรมเนียม 500 ฿</p>
      ${window.BankPlus ? window.BankPlus.rcvHtml() : ''}<h5>เช็คของฉัน (${list.length})</h5>${list.length ? show.map(row).join('') + (list.length > 5 ? `<div class="row"><button class="btn ghost" data-a="b49" data-v="chall">${B.chAll ? 'แสดงน้อยลง' : `ดูทั้งหมด ${Math.min(40, list.length)} รายการ`}</button></div>` : '') : '<p class="empty">ยังไม่มีรายการเช็ค</p>'}`;
  }
  function tabSet() {
    const v = V();
    return `<div class="card"><div class="ci">🔳</div><div class="cb"><h4>พร้อมเพย์</h4><p class="dim">${v.pp.reg ? `ลงทะเบียนแล้ว · เบอร์ ${v.pp.phone} ผูกกับบัญชีออมทรัพย์หลัก` : hasId() ? 'ยังไม่ได้ลงทะเบียน' : 'ต้องมีบัตรประชาชนก่อน (ทำที่ศูนย์ราชการ)'}</p><div class="row"><button class="btn" data-a="b49" data-v="ppreg" ${v.pp.reg || !hasId() ? 'disabled' : ''}>ลงทะเบียนพร้อมเพย์</button></div></div></div>
      <div class="card"><div class="ci">⚙️</div><div class="cb"><h4>การถามวิธีชำระเงิน</h4><p class="dim">${askOn() ? 'ถามวิธีจ่ายทุกครั้ง (ใช้ได้ทั้งบัตรเดบิต บัตรเครดิต ผ่อน โอน)' : `ยอดไม่เกิน ${bahtS(AUTO_CASH)} จ่ายเงินสดอัตโนมัติ`}</p><div class="row"><button class="btn ghost" data-a="b49" data-v="ask">${askOn() ? 'เปลี่ยนเป็นจ่ายเงินสดอัตโนมัติยอดเล็ก' : 'ให้ถามทุกครั้ง'}</button></div></div></div>
      <p class="dim">กฎการจ่าย: เงินสด ≤ ${bahtS(CASH_MAX)} · โอน/พร้อมเพย์ ≤ ${bahtS(APP_MAX)}/ครั้ง (${bahtS(dayLim())}/วัน) · ตั้งแต่ ${bahtS(HIGH)} ขึ้นไป: เช็ค แคชเชียร์เช็ค หรือเบิกที่ธนาคารเท่านั้น</p>${window.BankPlus ? window.BankPlus.secHtml() : ''}`;
  }
  function tabHist() {
    const items = []; try { for (const l of Bank2.st().log) items.push({ d: l.d, t: l.t, a: l.a }); } catch (e) { }
    for (const x of V().tx) items.push({ d: x.d, t: x.t, a: x.a });
    items.sort((a, b) => b.d - a.d);
    return items.length ? `<div class="msgs">${items.slice(0, 40).map(x => `<div class="msg"><b>${esc(x.t)}</b> <small>${RD(x.d)}</small><p>${x.a >= 0 ? '+' : ''}${bahtS(x.a)}</p></div>`).join('')}</div>` : '<p class="empty">ยังไม่มีรายการ</p>';
  }
  function openApp(tab) { B.tab = tab || B.tab; UI.open('📱 แอปธนาคารสุขใจ', ['บัญชี', 'โอน/จ่าย', 'เช็ค', 'ตั้งค่า', 'ประวัติ', 'สลิป/ใบเสร็จ'], t => { B.tab = t; return [tabAccts, tabTransfer, tabCheque, tabSet, tabHist, () => (window.Slip49 ? window.Slip49.tabHtml() : '')][t](); }, { tab: B.tab, wide: true }); }
  // every own-account transfer: balances move, the statement names both accounts and the amount, and the bank texts you
  function xferDone(f, t, n) {
    setBal(f, balOf(f) - n); setBal(t, balOf(t) + n);
    tx(`โอน ${f.name} → ${t.name} ${baht(n)}`, 0, f.id);
    try { Bank2.log(`โอนระหว่างบัญชีตัวเอง ${f.name} → ${t.name}`, 0); } catch (e) { }
    toast(`โอน ${baht(n)} สำเร็จ · ${f.name} เหลือ ${bahtS(balOf(f))} · ${t.name} ${bahtS(balOf(t))}`, '✅');
    if (n >= 1000) try { Phone.msg('ธนาคารสุขใจ', `โอนเงิน ${baht(n)} จาก ${f.no} ไป ${t.no} สำเร็จ · คงเหลือ ${bahtS(balOf(f))}`, true); } catch (e) { }
    try { if (window.Slip49) window.Slip49.make({ k: 'xfer', amt: n, payee: `${t.name} ${t.no}`, memo: 'โอนระหว่างบัญชีตัวเอง', from: `${f.name} ${f.no}` }); } catch (e) { console.warn('slip', e); }
  }
  // v164: the transfer form fills itself: the last payments can be repeated in one tap, amounts have quick buttons, and the form starts from the latest payment
  const recent = () => { const out = [], seen = new Set(); for (const s of (V().slips || [])) { if (!['xfer', 'app', 'bill'].includes(s.k) || !s.payee || s.memo === 'โอนระหว่างบัญชีตัวเอง') continue; const key = s.payee + '|' + s.memo; if (seen.has(key)) continue; seen.add(key); out.push(s); if (out.length >= 4) break; } return out; };
  const fillOf = s => { const g = guessPayee(s.payee); return { sel: g || PAYEES[PAYEES.length - 1], other: g ? '' : String(s.payee).slice(0, 30), purpose: purposeOf((s.memo || '') + ' ' + (s.payee || '')), amt: s.amt }; };
  const capFill = () => { const f = B.fill || (B.fill = {}); f.sel = val('b49PayeeSel') || f.sel || PAYEES[0]; f.other = val('b49PayeeOther') || ''; f.purpose = val('b49Memo') || f.purpose || PURPOSES[0]; if (val('b49TM') != null) f.amt = val('b49TM'); };
  // one transfer to a shop / other payee from the main savings (used by the form and by the one-tap repeat)
  function tmPay(payee, purpose, n, pinOk) {
    if (!pinOk && needGate(n)) { if (!payee || !(n >= 1)) { toast(!payee ? 'เลือกผู้รับเงิน (หรือพิมพ์ชื่อผู้รับ)' : 'พิมพ์จำนวนเงิน', 'ℹ️'); return; } gate(() => tmPay(payee, purpose, n, true), null, n); return; }
    const v = V(), used = v.lim.d === S.day ? v.lim.used : 0;
    if (!payee) { toast('เลือกผู้รับเงิน (หรือพิมพ์ชื่อผู้รับ)', 'ℹ️'); return; } if (!(n >= 1)) { toast('พิมพ์จำนวนเงิน', 'ℹ️'); return; }
    if (n > APP_MAX || used + n > dayLim()) { toast(`โอนผ่านแอปได้ไม่เกิน ${bahtS(APP_MAX)} ต่อครั้ง และ ${bahtS(dayLim())} ต่อวัน ยอดสูงกว่านี้ใช้เช็คหรือเคาน์เตอร์`, '🏦'); return; }
    if (Bank.st().sav < n) { toast('เงินในบัญชีออมทรัพย์ไม่พอ', '💸'); return; }
    Bank.st().sav -= n; if (v.lim.d !== S.day) v.lim = { d: S.day, used: 0 }; v.lim.used += n; tx(`โอนชำระ ${payee} (${purpose})`, -n, 'main'); try { Bank2.log(`โอนชำระ ${payee}: ${purpose}`, -n); } catch (e) { }
    try { if (window.Slip49) window.Slip49.make({ k: 'xfer', amt: n, payee, memo: purpose, from: `ออมทรัพย์ ${all()[0].no}` }); } catch (e) { console.warn('slip', e); }
    toast(`โอนชำระ ${payee} ${baht(n)} (${purpose}) สำเร็จ`, '📲'); try { Phone.msg('ธนาคารสุขใจ', `โอนเงิน ${baht(n)} ให้ ${payee} (${purpose}) สำเร็จ · คงเหลือ ${bahtS(Bank.st().sav)}`, true); } catch (e) { }
    if (B.fill) B.fill.amt = '';
  }
  // PromptPay to a friend, a typed phone number (10 digits) / ID (13 digits), or a typed name
  const ppName = raw => { const t = String(raw || '').trim(), d = t.replace(/[\s-]/g, ''); if (/^\d+$/.test(d)) { if (d.length === 10 && d[0] === '0') return { ok: 1, who: d.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3') }; if (d.length === 13) return { ok: 1, who: 'เลขบัตร ' + d.slice(0, 1) + '-xxxx-xxxxx-' + d.slice(-3) }; return { ok: 0, why: 'เบอร์พร้อมเพย์ต้องมี 10 หลักขึ้นต้นด้วย 0 (หรือเลขบัตรประชาชน 13 หลัก)' }; } if (t.length < 2) return { ok: 0, why: 'พิมพ์ชื่อผู้รับอย่างน้อย 2 ตัวอักษร' }; return { ok: 1, who: t.slice(0, 30) }; };
  function ppPay(raw, n, typed, pinOk) {
    const v = V(); if (!hasId()) { toast('ต้องมีบัตรประชาชนก่อน (ทำที่ศูนย์ราชการ)', '🪪'); return; }
    if (!raw) { toast('เลือกเพื่อน หรือพิมพ์เบอร์/ชื่อผู้รับ', 'ℹ️'); return; } if (!(n >= 1)) { toast('พิมพ์จำนวนเงิน', 'ℹ️'); return; }
    const r = ppName(raw); if (!r.ok) { toast(r.why, 'ℹ️'); return; } const who = r.who;
    const used = v.lim.d === S.day ? v.lim.used : 0; if (n > APP_MAX || used + n > dayLim()) { toast(`โอนเกินวงเงิน (ครั้งละไม่เกิน ${bahtS(APP_MAX)} · วันนี้เหลือ ${bahtS(Math.max(0, Math.min(APP_MAX, dayLim() - used)))})`, '🏦'); return; } if (Bank.st().sav < n) { toast('เงินในบัญชีออมทรัพย์ไม่พอ', '💸'); return; }
    if (!pinOk && needGate(n)) { gate(() => ppPay(raw, n, typed, true), null, n); return; }
    Bank.st().sav -= n; if (v.lim.d !== S.day) v.lim = { d: S.day, used: 0 }; v.lim.used += n; tx(`โอนพร้อมเพย์ให้ ${who}`, -n, 'main');
    try { Bank2.log(`โอนพร้อมเพย์ให้ ${who}`, -n); if (!typed && Friends.add && S.friends && S.friends[raw] !== undefined) Friends.add(raw, Math.min(1, n / 5000)); } catch (e) { }
    toast(`โอนให้ ${who} ${baht(n)} แล้ว`, '📲'); try { if (window.Slip49) window.Slip49.make({ k: 'pp', amt: n, payee: who, memo: 'โอนพร้อมเพย์', from: `ออมทรัพย์ ${all()[0].no}` }); } catch (e) { console.warn('slip', e); }
  }
  UI.H.b49 = d => {
    const [a, x] = String(d.v || '').split('|'), v = V();
    if (a === 'wd') { const n = +x; if (S._c + n > 1e12) return; if (Bank.st().sav < n) { toast('เงินในบัญชีไม่พอ', '💸'); return; } Bank.st().sav -= n; S._c += n; tx('ถอนเงินสด ATM', -n, 'main'); try { Bank2.log('ถอนเงินสด (ATM)', -n); } catch (e) { } toast(`ถอน ${baht(n)} เข้ากระเป๋า`, '💵'); }
    else if (a === 'wdx' || a === 'dpx') { const n = Math.round(+val('b49Atm') || 0); if (!(n >= 1)) { toast('พิมพ์จำนวนเงินก่อน', 'ℹ️'); return; } return UI.H.b49({ v: (a === 'wdx' ? 'wd|' : 'dp|') + n }); }
    else if (a === 'dp') { const n = +x; if (S._c < n) { toast('เงินสดไม่พอ', '💸'); return; } S._c -= n; Bank.st().sav += n; tx('ฝากเงินสด', n, 'main'); try { Bank2.log('ฝากเงินสด', n); } catch (e) { } toast(`ฝาก ${baht(n)} เข้าบัญชี`, '🏦'); }
    else if (a === 'open') openAcct(x);
    else if (a === 'own') { const f = all().find(q => q.id === val('b49F')), t = all().find(q => q.id === val('b49T')), n = Math.round(+val('b49Own') || 0); if (!f || !t || f === t || !(n >= 1)) { toast('เลือกบัญชีต้นทางและปลายทางที่ต่างกัน ใส่จำนวนเงิน', 'ℹ️'); return; } if (balOf(f) < n) { toast('เงินในบัญชีไม่พอ', '💸'); return; } if (n > OWN_MAX) { toast(`โอนระหว่างบัญชีตัวเองผ่านแอปได้ครั้งละไม่เกิน ${bahtS(OWN_MAX)}`, '🏦'); return; } xferDone(f, t, n); }
    else if (a === 'pp') { const typed = String(val('b49PPw') || '').trim(), pick = val('b49Fr') || '', n = Math.round(+val('b49PP') || 0); ppPay(typed || pick, n, !!typed && !pick); }
    else if (a === 'bill') { const o = P.src; P.src = 'sav'; try { P.busy = true; UI.H.paybill && UI.H.paybill({}); } finally { P.src = o; P.busy = false; } }
    else if (a === 'book') { const c = curAcct(); if (!c) return; if (c.bal < 100) { toast('เงินในบัญชีกระแสรายวันไม่พอ (100 ฿)', '💸'); return; } c.bal -= 100; v.book.left += LEAVES; tx('ค่าสมุดเช็คเล่มใหม่', -100, c.id); toast(`ได้สมุดเช็คเล่มใหม่ ${LEAVES} ใบ`, '📒'); }
    else if (a === 'tocur' || a === 'tosav') { const c = curAcct(), m = all()[0], n = Math.round(+val('b49Mv') || 0); if (!c) { toast('ยังไม่มีบัญชีกระแสรายวัน', 'ℹ️'); return; } if (!(n >= 1)) { toast('พิมพ์จำนวนเงินที่จะโอนก่อน', 'ℹ️'); return; } const f = a === 'tocur' ? m : c, t = a === 'tocur' ? c : m; if (balOf(f) < n) { toast(`เงินใน${f.name}ไม่พอ (มี ${bahtS(balOf(f))})`, '💸'); return; } if (n > OWN_MAX) { toast(`โอนผ่านแอปได้ครั้งละไม่เกิน ${bahtS(OWN_MAX)} ยอดมากกว่านั้นโอนที่เคาน์เตอร์สาขา`, '🏦'); return; } xferDone(f, t, n); }
    else if (a === 'chall') B.chAll = !B.chAll;
    else if (a === 'tm') tmPay(payeeIn(), val('b49Memo') || PURPOSES[0], Math.round(+val('b49TM') || 0));
    else if (a === 'amt' || a === 'max') { capFill(); const used = v.lim.d === S.day ? v.lim.used : 0; B.fill.amt = a === 'max' ? Math.max(0, Math.floor(Math.min(Bank.st().sav, APP_MAX, dayLim() - used))) : +x; }
    else if (a === 'fill' || a === 'rep') { const sl = (v.slips || []).find(q => q.id === x); if (!sl) return; B.fill = fillOf(sl); if (a === 'rep') tmPay(sl.payee, B.fill.purpose, sl.amt); }
    else if (a === 'wr') writeCheque();
    else if (a === 'dpay') { const D = D_(); if (!D) { toast('ไม่มียอดค้างให้ชำระ', 'ℹ️'); return; } const m = methods(D.amount).find(q => q.k === x); if (!m || !m.ok) { toast(m ? m.why : 'ทำไม่ได้', 'ℹ️'); return; } const go = () => { if (exec(x, D.amount, D.label, D.payee, D.fn)) { P.demand = null; try { Phone.msg('ธนาคารสุขใจ', `ชำระ ${baht(D.amount)} ให้ ${D.payee || 'ร้านค้า'} (${D.label || ''}) สำเร็จ`, true); } catch (e) { } } }; if (x === 'app' || x === 'pp') { gate(() => { window.Slip49 && window.Slip49.back(); go(); }, () => window.Slip49 && window.Slip49.back(), D.amount); return; } if (needSign(x)) { window.Slip49.sign(signInfo(x, D.amount, D.label, D.payee), () => { window.Slip49.back(); go(); }, () => window.Slip49.back()); return; } go(); }
    else if (a === 'stop') { const c = v.ch.find(q => String(q.no) === x); if (!c || c.status !== 'pending') return; const ac = curAcct(); if (!ac || ac.bal < 100) { toast('ค่าระงับจ่าย 100 ฿ ไม่พอ', '💸'); return; } ac.bal -= 100; c.status = 'stopped'; toast(`ระงับจ่ายเช็ค #${c.no} แล้ว`, '⛔'); }
    else if (a === 'ppreg') { if (!hasId()) return; v.pp = { reg: 1, phone: '08' + String((rid * 7919) % 90000000 + 10000000).slice(0, 8).replace(/(\d{1})(\d{3})(\d{4})/, '$1-$2-$3') }; toast('ลงทะเบียนพร้อมเพย์สำเร็จ', '🔳'); }
    else if (a === 'ask') { v.ask = askOn() ? 0 : 1; v.askSet = 1; }
    UI.renderBody();
  };
  if (!APPS.some(a => a.id === 'mbank49')) APPS.splice(Math.min(APPS.length, 2), 0, { id: 'mbank49', i: '🏦', n: 'แอปธนาคาร' });
  Phone.apps.mbank49 = () => { setTimeout(() => { Phone.app = null; UI.close(); openApp(0); }, 0); return ''; };
  try { if (typeof APP_GROUPS !== 'undefined') for (const g of APP_GROUPS) if (g[1].includes('bank') && !g[1].includes('mbank49')) g[1].unshift('mbank49'); } catch (e) { }
  // ===== branch counter (the bank building): big transfers between your own accounts, no app limit, bank hours + ID card =====
  UI.H.c49x = () => {
    const f = all().find(q => q.id === val('c49F')), t = all().find(q => q.id === val('c49T')), n = Math.round(+val('c49N') || 0);
    if (!bankOpen()) { toast('เคาน์เตอร์ปิดอยู่ เปิด จ–ศ 08:30–16:30', '🕘'); return; }
    if (!hasId()) { toast('ทำรายการที่เคาน์เตอร์ต้องใช้บัตรประชาชน (ทำที่ศูนย์ราชการ)', '🪪'); return; }
    if (!f || !t || f === t || !(n >= 1)) { toast('เลือกบัญชีต้นทางกับปลายทางที่ต่างกัน และพิมพ์จำนวนเงิน', 'ℹ️'); return; }
    if (balOf(f) < n) { toast(`เงินใน${f.name}ไม่พอ (มี ${bahtS(balOf(f))})`, '💸'); return; }
    xferDone(f, t, n);
  };
  const _bu = Bank2.ui.bind(Bank2);
  Bank2.ui = function () {
    _bu(); const c = UI.cur; if (!c || c._c49) return; c._c49 = 1; const r0 = c.render;
    c.render = t => {
      const html = r0(t); if (t !== 0) return html;
      const l = all(), sel = 'font-size:16px;padding:8px;border-radius:10px;border:1px solid #ccc;margin:2px 0;flex:1', o = l.map(a => `<option value="${a.id}">${esc(a.name)} (${bahtS(balOf(a))})</option>`).join(''), o2 = l.map((a, i) => `<option value="${a.id}" ${i === 1 ? 'selected' : ''}>${esc(a.name)} (${bahtS(balOf(a))})</option>`).join('');
      return html + `<h5>🏦 โอนระหว่างบัญชีของฉันที่เคาน์เตอร์</h5><p class="dim">${bankOpen() ? '🟢 เคาน์เตอร์เปิด' : '🔴 เคาน์เตอร์ปิด (จ–ศ 08:30–16:30)'} · ไม่จำกัดวงเงิน ไม่มีค่าธรรมเนียม · ใช้บัตรประชาชน ${hasId() ? '✅' : '❌ ยังไม่มี'}</p>
        <div class="row"><select id="c49F" style="${sel}">${o}</select> → <select id="c49T" style="${sel}">${o2}</select></div>
        <div class="row"><input id="c49N" type="number" min="1" placeholder="พิมพ์จำนวนเงิน (บาท)" style="flex:1;${sel}"><button class="btn" data-a="c49x">โอน</button></div>`;
    };
    UI.renderBody();
  };
  window.Bank49 = { openNew, acctNo, dayLim, accepts, PAYEES_: PAYEES, words, V, all, methods, exec, ask, guard, openApp, curAcct, clearDay, hasId, bankOpen, isBiz, nextBiz, writeCheque, balOf, setBal, tx, xferDone, OWN_MAX, PAYEES, PURPOSES, wkOf };
});
