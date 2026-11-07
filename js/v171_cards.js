'use strict';
// ---------- v171_cards: real-looking cards (Visa / Mastercard / JCB / UnionPay), issue timeline, activation, SIM balance, money hub, auto-pay ----------
//  * every card (ATM, debit, credit x3) is a physical card: 16-digit Luhn number by network, expiry, CVV, tier name, a front/back view
//  * NEW cards are not instant: approved -> produced -> posted -> delivered (3-5 game days) -> you activate it. Until then it cannot be used. Replacement cards get a new number.
//  * cards that already existed in a save are kept as they are (active), nothing is taken away
//  * SIM: prepaid balance (topped up at the ATM / bank app) is spent by phone calls to friends (emergency numbers stay free)
//  * MONEY HUB: net worth across every account / loan / card, what is coming due, auto-pay for bills
V23.add('v171_cards', () => {
  const B = window.Bank49; if (!B || typeof UI === 'undefined' || typeof Cal36 === 'undefined' || !window.Bank170) return;
  const E = s => (typeof esc === 'function' ? esc(String(s == null ? '' : s)) : String(s == null ? '' : s));
  const bS = n => (typeof baht === 'function' ? baht(Math.round(n)) : '฿' + Math.round(n));
  const toast = (t, i) => { try { UI.toast(t, i || '💳'); } catch (e) { } };
  const msg = (t, good) => { try { Phone.msg('ธนาคารสุขใจ', t, !!good); } catch (e) { } };
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const sav = () => Bank.st().sav;
  const sb = 'font-size:13px;padding:5px 9px';
  const X = () => { const v = B.V(); if (!v.x171) v.x171 = {}; const x = v.x171; x.cards = x.cards || []; x.pref = x.pref || { debit: 'VISA', credit: 'VISA' }; x.flip = x.flip || {}; x.auto = x.auto || { bills: 0 }; return x; };

  // ===================== networks, numbers, tiers =====================
  const NET = {
    VISA: { n: 'Visa', pre: '4', c: '#1a1f71,#2b6cc4', cb: 0.001, perk: 'รับได้ทุกร้านทั่วโลกรวมถึงร้านออนไลน์ · คืนเงิน 0.1% · ช้อปร้านค้าออนไลน์คืนเงินเพิ่ม 2% · ป้องกันการโกงออนไลน์', logo: '<svg width="62" height="22" viewBox="0 0 62 22"><text x="0" y="19" font-family="Georgia,serif" font-style="italic" font-weight="800" font-size="24" fill="#fff" letter-spacing="-1">VISA</text><path d="M0 21h62" stroke="#f7b600" stroke-width="2"/></svg>' },
    MC: { n: 'Mastercard', pre: '5', c: '#1c1c1c,#8a1c1c', cb: 0.003, perk: 'รับได้ทุกร้านทั่วโลก · คืนเงิน 0.3% · ร้านอาหาร/คาเฟ่คืนเงินเพิ่ม 2% (Priceless Specials)', logo: '<svg width="46" height="28" viewBox="0 0 46 28"><circle cx="16" cy="12" r="11" fill="#eb001b"/><circle cx="30" cy="12" r="11" fill="#f79e1b" fill-opacity=".92"/><path d="M23 3.2a11 11 0 0 1 0 17.6a11 11 0 0 1 0-17.6z" fill="#ff5f00"/><text x="23" y="27" text-anchor="middle" font-family="Arial" font-size="6.5" font-weight="700" fill="#fff">mastercard</text></svg>' },
    JCB: { n: 'JCB', pre: '35', c: '#0b3d91,#1a8a4a', cb: 0.004, perk: 'คืนเงิน 0.4% · ร้านอาหาร/คาเฟ่/ตลาดนัดคืนเงินเพิ่ม 5% (ร้านพันธมิตร JCB) · นิยมในเอเชีย', logo: '<svg width="48" height="28" viewBox="0 0 48 28"><rect x="1" y="2" width="14" height="22" rx="4" fill="#0e4c96"/><rect x="17" y="2" width="14" height="22" rx="4" fill="#c8102e"/><rect x="33" y="2" width="14" height="22" rx="4" fill="#007940"/><g font-family="Arial" font-weight="900" font-size="13" fill="#fff" text-anchor="middle"><text x="8" y="19">J</text><text x="24" y="19">C</text><text x="40" y="19">B</text></g></svg>' },
    UPI: { n: 'UnionPay', pre: '62', c: '#7f0000,#12306b', cb: 0.002, perk: 'คืนเงิน 0.2% · นิยมในจีน/เอเชีย · ร้านออนไลน์บางแห่งไม่รับ UnionPay', logo: '<svg width="56" height="28" viewBox="0 0 56 28"><path d="M5 2h14l-5 20H0z" fill="#e21836"/><path d="M17 2h14l-5 20H12z" fill="#00447c"/><path d="M29 2h14l-5 20H24z" fill="#007b84"/><text x="28" y="27" text-anchor="middle" font-family="Arial" font-size="7" font-weight="700" fill="#fff">UnionPay</text></svg>' },
  };
  const TIERS = { VISA: ['Classic', 'Gold', 'Platinum', 'Signature', 'Infinite'], MC: ['Standard', 'Gold', 'Platinum', 'World', 'World Elite'], JCB: ['Standard', 'Gold', 'Platinum', 'Ultimate', 'Ultimate'], UPI: ['Classic', 'Gold', 'Platinum', 'Diamond', 'Diamond'] };
  const TCOLN = {
    VISA: ['#1a1f71,#4a7fd8', '#7a5c12,#f0d070', '#3b4a55,#d5dde2', '#0b0b14,#34374f', '#000,#2a2a2a'],
    MC: ['#2b2b2b,#7a7a7a', '#8a5a10,#f2c14e', '#4a2323,#d9b0a0', '#101010,#8a1c1c', '#000,#4a0f0f'],
    JCB: ['#0d47a1,#4aa3df', '#0a5a38,#7fd49c', '#10324f,#9fc6e8', '#08240f,#1a8a4a', '#000,#134d2a'],
    UPI: ['#7f0000,#e05a5a', '#7a1010,#f0c060', '#12306b,#8aa7e0', '#0a1630,#7f0000', '#000,#12306b'],
  };
  const WIS = { 1: { n: 'Wisdom', min: 10e6, lim: 2e6, cb: 0.01, cut: 0.01, c: '#0b0b0b,#4a4a4a' }, 2: { n: 'Private Wisdom', min: 50e6, lim: 10e6, cb: 0.015, cut: 0.02, c: '#1c1710,#9c8446' } };
  const tierIdx = lim => (lim < 100000 ? 0 : lim < 500000 ? 1 : lim < 2000000 ? 2 : lim < 5000000 ? 3 : 4);
  const luhn = s => { let sum = 0, alt = true; for (let i = s.length - 1; i >= 0; i--) { let n = +s[i]; if (alt) { n *= 2; if (n > 9) n -= 9; } sum += n; alt = !alt; } return (10 - sum % 10) % 10; };
  const genNo = net => { let s = NET[net].pre; while (s.length < 15) s += rnd(0, 9); return s + luhn(s); };
  const netOf = no => (/^35/.test(no) ? 'JCB' : /^62/.test(no) ? 'UPI' : /^5/.test(no) ? 'MC' : 'VISA');
  const fmtNo = no => String(no).replace(/(\d{4})/g, '$1 ').trim();
  const expTxt = d => { try { const t = Cal36.date(d); return String(t.m + 1).padStart(2, '0') + '/' + String(t.be % 100).padStart(2, '0'); } catch (e) { return '12/74'; } };
  const cvv3 = () => String(rnd(100, 999));
  const DELAY = { debit: 3, credit: 5, reissue: 3 };
  const KINDN = { atm: 'บัตร ATM', debit: 'บัตรเดบิต', credit: 'บัตรเครดิต' };

  // ===================== the registry (one entry per physical card) =====================
  function refs() {
    const out = [], a = B.all()[0];
    if (a) out.push({ ref: 'atm', type: 'atm', no: (() => { const p = '62' + String(a.no).replace(/\D/g, '').padEnd(13, '7').slice(0, 13); return p + luhn(p); })(), setNo: () => { }, since: 1, lim: 0 });
    const d = window.Debit169 && window.Debit169.st(); if (d) out.push({ ref: 'debit', type: 'debit', no: d.no, setNo: n => { d.no = n; }, since: d.issued || 0, lim: 0 });
    const C = window.Card168; if (C && C.has()) { const c = C.st(); (c.cards || []).forEach((k, i) => out.push({ ref: 'cc' + i, type: 'credit', no: k.no, setNo: n => { k.no = n; if (i === 0) c.no = n; }, since: k.since || c.issued || 0, prod: k.prod, lim: c.limit })); }
    return out;
  }
  function sync() {
    wire(); const x = X(); let started = !!x.mig;
    for (const r of refs()) {
      if (x.cards.find(c => c.ref === r.ref)) continue;
      const isNew = started && r.type !== 'atm' && r.since === S.day;
      if (!isNew) { x.cards.push({ ref: r.ref, type: r.type, net: r.type === 'atm' ? 'ATM' : netOf(r.no), no: r.no, cvv: cvv3(), iss: r.since || 1, exp: S.day + rnd(150, 380), st: 'active', legacy: 1 }); continue; }
      const net = x.pref[r.type === 'debit' ? 'debit' : 'credit'] || 'VISA', no = genNo(net); r.setNo(no); const dl = r.type === 'debit' ? DELAY.debit : DELAY.credit;
      x.cards.push({ ref: r.ref, type: r.type, net, no, cvv: cvv3(), iss: S.day, exp: S.day + 420, st: 'shipping', ready: S.day + dl, legacy: 0 });
      msg(`อนุมัติ${KINDN[r.type]} ${NET[net].n} หมายเลข ••••${no.slice(-4)} กำลังผลิตและจัดส่งทางไปรษณีย์ คาดว่าจะถึง ${RD(S.day + dl)} เมื่อได้รับแล้วต้องเปิดใช้งานบัตรก่อนจึงจะใช้ได้`, true);
    }
    x.mig = 1; return x;
  }
  const ent = ref => sync().cards.find(c => c.ref === ref);
  function stOf(e) {
    if (e.type === 'debit') { const d = window.Debit169 && window.Debit169.st(); if (d) { if (d.st === 'lost') return 'lost'; if (d.st === 'locked') return 'locked'; } }
    if (e.lost) return 'lost'; if (e.lock) return 'locked';
    if (e.st === 'shipping' && S.day >= e.ready) e.st = 'delivered';
    if (e.st === 'active' && S.day > e.exp) return 'expired';
    return e.st;
  }
  const SN = { shipping: 'กำลังจัดส่ง', delivered: 'รอเปิดใช้งาน', active: 'ใช้งานได้', locked: 'ล็อกชั่วคราว', lost: 'อายัดแล้ว', expired: 'หมดอายุ' };
  const gateWhy = (e, s) => ({ shipping: `บัตรยังอยู่ระหว่างจัดส่ง (ถึงประมาณ ${RD(e.ready)})`, delivered: 'ได้รับบัตรแล้วแต่ยังไม่ได้เปิดใช้งาน (แอปธนาคาร แท็บ บัตรของฉัน)', locked: 'บัตรถูกล็อก', lost: 'บัตรถูกอายัด ต้องขอบัตรใหม่', expired: 'บัตรหมดอายุแล้ว ขอบัตรใหม่ได้ที่แท็บ บัตรของฉัน' }[s] || '');
  // a shop counts as a dining place when most of what it sells is food (read from the shop's own item list, so shops added later are covered); convenience stores are excluded
  const dineCache = {};
  const isDining = id => { const sh = typeof SHOPS !== 'undefined' && SHOPS[id]; if (!sh) return false; const items = (sh.tabs || []).reduce((a, t) => a.concat(t.items || []), []), key = id + ':' + items.length; if (dineCache[key] != null) return dineCache[key]; const f = items.filter(i => String(i).indexOf('food:') === 0).length; return (dineCache[key] = items.length > 0 && f / items.length >= 0.6 && !/มาร์ท|สะดวกซื้อ/.test(sh.n)); };
  const rateCut = () => { const e = ent('cc0'); return e && e.wis ? WIS[e.wis].cut : 0; };
  const perk = (i, spent) => { const e = ent('cc' + i); if (!e || stOf(e) !== 'active') return; const ttl = String((UI.cur && UI.cur.title) || ''), sid = typeof SHOPS !== 'undefined' ? Object.keys(SHOPS).find(k => SHOPS[k] && SHOPS[k].n && ttl.indexOf(SHOPS[k].n) === 0) : null, inShop = !!sid, dine = inShop && isDining(sid), extra = e.net === 'JCB' && dine ? 0.05 : e.net === 'MC' && dine ? 0.02 : e.net === 'VISA' && inShop && sid === 'online' ? 0.02 : 0, pct = NET[e.net].cb + extra + (e.wis ? WIS[e.wis].cb : 0), c = window.Card168.st(); c.cb += spent * pct; };
  window.Cards171 = { isDining, rateCut, perk, state: ref => { const e = ent(ref); return e ? stOf(e) : null; }, ent, visual: ref => visual(ref) };

  // ----- cards must be usable to pay -----
  let wired = 0;
  const wire = () => { if (wired || !window.Debit169 || !window.Card168 || !UI.H.s163debre) return; wired = 1;
  { const D = window.Debit169; if (D) { const o = D.methods.bind(D); D.methods = n => { const r = o(n), e = ent('debit'); if (e && r[0] && r[0].ok) { const s = stOf(e); if (s !== 'active') { r[0].ok = false; r[0].why = gateWhy(e, s); } } return r; }; } }
  { const C = window.Card168; if (C) {
    const o = C.methods.bind(C); C.methods = n => {
      const r = o(n), keys = ['card', 'cardB', 'cardC'], pl = C.PL || {};
      for (const m of r) { if (!m.ok) continue; const i = keys.indexOf(m.k), e = ent('cc' + (i < 0 ? (pl[m.k] ? 0 : -1) : i)); if (!e) continue; const s = stOf(e); if (s !== 'active') { m.ok = false; m.why = gateWhy(e, s); } else if (e.net === 'UPI' && UI.shopId === 'online') { m.ok = false; m.why = 'ร้านออนไลน์นี้ไม่รับบัตร UnionPay'; } }
      return r;
    };
    const adv = C.advance.bind(C); C.advance = function (n, dest) { const e = ent('cc0'); if (e) { const s = stOf(e); if (s !== 'active') { toast(`ถอนเงินสดจากบัตรเครดิตไม่ได้: ${gateWhy(e, s)}`, '💳'); return; } } return adv(n, dest); };
  } }
  hookAll(); };

  // ----- re-issue (lost / expired) : new number, new CVV, new expiry, posted again -----
  function regen(e, fee) {
    const r = refs().find(q => q.ref === e.ref); if (!r) return;
    if (fee > 0) { if (sav() < fee) { toast(`ค่าธรรมเนียมออกบัตรใหม่ ${bS(fee)} เงินไม่พอ`, '💸'); return false; } Bank.st().sav -= fee; B.tx(`ค่าออกบัตรใหม่ ${KINDN[e.type]}`, -fee, 'main'); try { Bank2.log(`ค่าออกบัตรใหม่ ${KINDN[e.type]}`, -fee); } catch (x) { } }
    e.no = genNo(e.net); r.setNo(e.no); e.cvv = cvv3(); e.iss = S.day; e.exp = S.day + 420; e.st = 'shipping'; e.ready = S.day + DELAY.reissue; e.lost = 0; e.lock = 0; e.legacy = 0;
    const d = window.Debit169 && window.Debit169.st(); if (e.type === 'debit' && d) { d.st = 'active'; d.no = e.no; }
    msg(`อนุมัติออกบัตรใหม่ ${KINDN[e.type]} ••••${e.no.slice(-4)} (หมายเลขใหม่) จัดส่งถึงประมาณ ${RD(e.ready)} ต้องเปิดใช้งานเมื่อได้รับ`, true); return true;
  }
  const wrapH = (name, fn) => { const o = UI.H[name]; if (typeof o !== 'function') return; UI.H[name] = function () { const r = o.apply(this, arguments); try { fn.apply(this, arguments); } catch (e) { console.warn('v171 ' + name, e); } return r; }; };
  const hookAll = () => {
    wrapH('s163debnew', () => sync()); wrapH('s163ccapply', () => sync()); wrapH('s163ccaddcard', () => sync());
    { const o = UI.H.s163debre; if (typeof o === 'function') UI.H.s163debre = function () { const e = ent('debit'), d = window.Debit169.st(), was = d && d.st === 'lost'; const r = o.apply(this, arguments); try { const d2 = window.Debit169.st(); if (was && d2 && d2.st === 'active' && e) regen(e, 0); } catch (x) { console.warn(x); } return r; }; }
  };

  // ===================== screens =====================
  const colorsOf = e => (e.type === 'atm' ? '#2e7d32,#a5d6a7' : e.type === 'credit' ? (e.wis ? WIS[e.wis].c : TCOLN[e.net][tierIdx(window.Card168.st().limit)]) : NET[e.net].c);
  const tierOf = e => (e.type === 'credit' && e.wis ? WIS[e.wis].n : e.type === 'credit' ? TIERS[e.net][tierIdx(window.Card168.st().limit)] : e.type === 'debit' ? 'Debit' : 'ATM');
  function visual(ref) {
    const e = ent(ref); if (!e) return '';
    const s = stOf(e), up = E((S.name || 'ชาวไร่').toUpperCase()), flip = !!X().flip[ref], hide = s === 'shipping';
    const base = `border-radius:16px;max-width:380px;margin:8px auto;box-shadow:0 8px 20px rgba(0,0,0,.45);position:relative;overflow:hidden;color:#fff;min-height:210px;box-sizing:border-box`;
    const cover = s === 'active' ? '' : `<div style="position:absolute;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;font:800 18px sans-serif;letter-spacing:1px;text-align:center;padding:10px">${s === 'shipping' ? '📮 กำลังจัดส่ง<br><span style="font-size:12px;font-weight:600">ถึงประมาณ ' + E(RD(e.ready)) + '</span>' : s === 'delivered' ? '✋ ได้รับแล้ว · รอเปิดใช้งาน' : s === 'locked' ? '🔒 ล็อกชั่วคราว' : s === 'lost' ? '🛑 อายัดแล้ว' : '⌛ หมดอายุ'}</div>`;
    if (flip) return `<div style="${base};background:linear-gradient(135deg,${colorsOf(e)})"><div style="background:#111;height:38px;margin-top:18px"></div><div style="display:flex;align-items:center;gap:8px;margin:14px 16px 0"><div style="flex:1;height:30px;background:repeating-linear-gradient(45deg,#fff,#fff 4px,#e8e8e8 4px,#e8e8e8 8px)"></div><div style="background:#fff;color:#111;font:700 16px monospace;padding:5px 9px;border-radius:4px">${hide ? '•••' : e.cvv}</div></div><div style="font-size:10.5px;margin:12px 16px;opacity:.85;line-height:1.35">บัตรนี้เป็นของธนาคารสุขใจ ผู้ถือบัตรต้องลงลายมือชื่อ หากพบบัตรโปรดส่งคืนธนาคาร · โทร 1555 (ตลอด 24 ชม.) · CVV 3 หลักห้ามบอกใคร</div><div style="position:absolute;right:14px;bottom:12px">${e.net === 'ATM' ? '' : NET[e.net].logo}</div>${cover}</div>`;
    return `<div style="${base};padding:14px 16px;background:linear-gradient(135deg,${colorsOf(e)})"><div style="display:flex;justify-content:space-between;font-size:13px"><b>ธนาคารสุขใจ</b><span style="opacity:.9">${E(KINDN[e.type])} · ${E(tierOf(e))}${e.type === 'credit' && window.Card168.PRODS[(window.Card168.st().cards[+ref.slice(2)] || {}).prod] && ref !== 'cc0' ? '' : ''}</span></div>
      <div style="display:flex;align-items:center;gap:10px;margin:14px 0 6px">${e.type !== 'atm' && !hide ? '<span style="position:absolute;right:16px;top:58px;width:30px;height:22px;border-radius:5px;background:linear-gradient(120deg,#c9d6ff,#e2e2e2,#ffd1f3,#c9ffe8);opacity:.75"></span>' : ''}<div style="width:42px;height:31px;border-radius:6px;background:linear-gradient(135deg,#f5d77a,#b8902e);box-shadow:inset 0 0 0 1px rgba(0,0,0,.25)"></div><span style="font-size:22px;opacity:.85;transform:rotate(90deg);display:inline-block">))))</span></div>
      <div style="font:600 20px/1.2 'Courier New',monospace;letter-spacing:2px;margin:8px 0">${hide ? '•••• •••• •••• ' + E(e.no.slice(-4)) : E(fmtNo(e.no))}</div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;font-size:12px"><div><div style="font-size:9.5px;opacity:.8">VALID THRU</div><b style="font:600 14px 'Courier New',monospace">${expTxt(e.exp)}</b><div style="margin-top:6px;font-size:13px;letter-spacing:1px">${up}</div></div><div style="text-align:right">${e.net === 'ATM' ? '<b style="font-size:13px">ATM</b>' : NET[e.net].logo}${e.type !== 'atm' ? '<div style="font:italic 700 10.5px sans-serif;opacity:.9;margin-top:2px">' + E(e.wis ? WIS[e.wis].n : e.type === 'debit' ? 'Debit' : tierOf(e)) + '</div>' : ''}</div></div>${cover}</div>`;
  }
  function timeline(e) {
    if (e.legacy) return `<p class="dim" style="font-size:12.5px">ออกบัตรเมื่อ ${E(RD(e.iss))} · หมดอายุ ${expTxt(e.exp)}</p>`;
    const steps = [['✅ อนุมัติ', e.iss], ['🏭 ผลิตบัตร', e.iss + 1], ['📮 ส่งทางไปรษณีย์', e.iss + 2], ['📦 ถึงมือคุณ', e.ready], ['🔓 เปิดใช้งาน', null]], s = stOf(e), actv = ['active', 'locked', 'lost', 'expired'].includes(s) && e.act;
    return `<div style="display:flex;flex-wrap:wrap;gap:4px 10px;font-size:12.5px;margin:4px 0">${steps.map((p, i) => { const ok = i < 4 ? S.day >= p[1] : !!actv; return `<span class="${ok ? 'good' : 'dim'}">${ok ? '●' : '○'} ${p[0]}${p[1] != null ? ' ' + E(RD(p[1])) : ''}</span>`; }).join('')}</div>`;
  }
  function cardBlock(e) {
    const s = stOf(e), C = window.Card168, kk = KINDN[e.type];
    let extra = ''; if (e.type === 'credit') { const c = C.st(), k = (c.cards || [])[+e.ref.slice(2)]; extra = ` · ${E((C.PRODS[k && k.prod] || {}).n || '')} · วงเงินร่วม ${bS(c.limit)}`; }
    const days = e.exp - S.day, warn = s === 'active' && days <= 14 && !e.legacy0;
    let btn = '';
    if (e.pend && ['active', 'locked', 'expired'].includes(s)) btn += S.day >= e.pend.ready ? `<button class="btn" data-a="s163cdswap" data-v="${e.ref}">🔓 เปิดใช้บัตรใหม่แทนใบเดิม (••••${e.pend.no.slice(-4)})</button>` : `<span class="dim">📮 บัตรใบใหม่กำลังจัดส่ง ถึงประมาณ ${E(RD(e.pend.ready))}</span>`;
    if (s === 'delivered') btn += `<button class="btn" data-a="s163cdact" data-v="${e.ref}">🔓 เปิดใช้งานบัตร</button>`;
    if (s === 'active' && e.type !== 'atm') btn += `<button class="btn ghost" style="${sb}" data-a="${e.type === 'debit' ? 's163deblock' : 's163cdlock'}" data-v="${e.ref}">🔒 ล็อกบัตร</button>`;
    if (s === 'locked') btn += `<button class="btn ghost" style="${sb}" data-a="${e.type === 'debit' ? 's163deblock' : 's163cdlock'}" data-v="${e.ref}">🔓 ปลดล็อก</button>`;
    if (e.type !== 'atm' && ['active', 'locked', 'delivered'].includes(s)) btn += `<button class="btn ghost" style="${sb}" data-a="${e.type === 'debit' ? 's163deblost' : 's163cdlost'}" data-v="${e.ref}">🛑 แจ้งหาย/อายัด</button>`;
    if (s === 'lost' && e.type === 'credit') btn += `<button class="btn" data-a="s163cdre" data-v="${e.ref}">ขอบัตรใหม่ (100 ฿)</button>`;
    if (s === 'lost' && e.type === 'debit') btn += `<button class="btn" data-a="s163debre">ขอบัตรใหม่ (100 ฿)</button>`;
    if (s === 'expired') btn += `<button class="btn" data-a="s163cdre" data-v="${e.ref}">ขอบัตรใหม่ต่ออายุ (ฟรี)</button>`;
    return `${visual(e.ref)}<div style="text-align:center"><button class="btn ghost" style="${sb}" data-a="s163cdflip" data-v="${e.ref}">🔄 พลิกดูด้านหลังบัตร</button></div>
      <div class="card" style="grid-template-columns:1fr"><div class="cb"><h4>${kk}${e.type === 'atm' ? '' : ' ' + NET[e.net].n} <span class="${s === 'active' ? 'good' : s === 'shipping' || s === 'delivered' ? 'warn' : 'bad'}">· ${SN[s]}</span></h4><p class="dim">${e.net === 'ATM' ? '' : '🌐 ' + E(NET[e.net].perk) + '<br>'}${e.wis ? '👑 สิทธิ์ ' + WIS[e.wis].n + ': คืนเงินเพิ่ม ' + (WIS[e.wis].cb * 100) + '% · แลกเงินฟรีค่าธรรมเนียม · ดอกพิเศษบัญชีดอกเบี้ยสูง<br>' : ''}เลขบัตร ••••${E(e.no.slice(-4))}${extra} · หมดอายุ ${expTxt(e.exp)}${days <= 14 && s === 'active' ? ' <b class="bad">(ใกล้หมดอายุ)</b>' : ''}</p>${timeline(e)}${btn ? `<div class="row">${btn}</div>` : ''}</div></div>`;
  }
  function tabCards() {
    const x = sync(); let h = `<p class="lead">🎴 บัตรของฉัน</p><p class="dim">บัตรใหม่ต้องรอผลิตและจัดส่ง ${DELAY.debit}–${DELAY.credit} วัน แล้วเปิดใช้งานเองก่อนจึงจะใช้จ่ายได้ · บัตรหาย/หมดอายุจะได้เลขบัตรใหม่</p>`;
    const pick = (k, t) => `<div class="row" style="align-items:center;gap:6px;flex-wrap:wrap"><span class="dim" style="font-size:13px">${t}:</span>${Object.keys(NET).map(n => `<button class="btn ${x.pref[k] === n ? '' : 'ghost'}" style="${sb}" data-a="s163cdnet" data-v="${k}|${n}">${NET[n].n}</button>`).join('')}</div>`;
    h += `<h5>⚙️ เลือกเครือข่ายบัตรสำหรับบัตรใบใหม่</h5>${pick('debit', 'บัตรเดบิต')}${pick('credit', 'บัตรเครดิต')}<p class="dim" style="font-size:12.5px">Visa · Mastercard ใช้ได้ทั่วโลก · JCB นิยมในเอเชีย · UnionPay (ยูเนียนเพย์) นิยมในจีน · เลือกก่อนสมัคร/ขอบัตร ระดับบัตรเปลี่ยนตามวงเงิน (Classic → Gold → Platinum → Signature/World → Infinite)</p>`;
    if (!x.cards.length) return h + '<p class="empty">ยังไม่มีบัตร</p>';
    for (const e of x.cards) h += cardBlock(e);
    h += `<p class="dim">ขอบัตรเดบิต: แท็บ "เครดิตบูโร/จัดการหนี้" · สมัครบัตรเครดิต/บัตรใบที่ 2–3: แท็บ "บัตรเครดิต/สินเชื่อ"</p>`;
    return h;
  }
  UI.H.s163cdflip = d => { const f = X().flip; f[d.v] = !f[d.v]; };
  UI.H.s163cdnet = d => { const [k, n] = String(d.v).split('|'); if (NET[n]) X().pref[k] = n; toast(`บัตรใบใหม่จะใช้เครือข่าย ${NET[n].n}`, '💳'); };
  UI.H.s163cdact = d => { const e = ent(d.v); if (!e || stOf(e) !== 'delivered') return; e.st = 'active'; e.act = S.day; toast(`เปิดใช้งาน${KINDN[e.type]} ••••${e.no.slice(-4)} แล้ว`, '🔓'); msg(`เปิดใช้งาน${KINDN[e.type]} ••••${e.no.slice(-4)} สำเร็จ ใช้จ่ายได้ทันที`, true); };
  UI.H.s163cdswap = d => { const e = ent(d.v); if (!e || !e.pend || S.day < e.pend.ready) return; const r = refs().find(q => q.ref === e.ref), p = e.pend; e.no = p.no; e.cvv = p.cvv; e.exp = p.exp; e.pend = null; e.legacy = 0; e.iss = S.day; e.act = S.day; e.warned = 0; e.lock = 0; if (r) r.setNo(e.no); toast(`เปิดใช้บัตรใหม่ ••••${e.no.slice(-4)} แล้ว บัตรเดิมใช้ไม่ได้`, '🔓'); };
  UI.H.s163cdlock = d => { const e = ent(d.v); if (!e || e.type !== 'credit') return; e.lock = e.lock ? 0 : 1; toast(e.lock ? 'ล็อกบัตรชั่วคราวแล้ว' : 'ปลดล็อกบัตรแล้ว', '🔒'); };
  UI.H.s163cdlost = d => { const e = ent(d.v); if (!e || e.type !== 'credit') return; if (!confirm('แจ้งบัตรเครดิตหาย/อายัด? บัตรเดิมใช้ไม่ได้ ต้องขอบัตรใหม่ (100 ฿) และรอจัดส่ง')) return; e.lost = 1; toast('อายัดบัตรเครดิตแล้ว', '🛑'); msg(`อายัดบัตรเครดิต ••••${e.no.slice(-4)} ตามที่แจ้งแล้ว ขอบัตรใหม่ได้ในแอปธนาคาร`, true); };
  UI.H.s163cdre = d => { const e = ent(d.v); if (!e) return; const s = stOf(e); if (s !== 'lost' && s !== 'expired') return; regen(e, s === 'lost' ? 100 : 0); };

  // ===================== SIM =====================
  const sim = () => { const x = window.Bank170.X(); if (!x.simInit) { x.simInit = 1; x.sim = Math.max(x.sim | 0, 200); } return x; };
  window.Sim171 = { bal: () => sim().sim, top(n) { sim().sim += n; }, use(n) { const x = sim(); if (x.sim < n) return false; x.sim -= n; return true; } };
  { const o = Phone.ring.bind(Phone); Phone.ring = function (name) { if (!window.Sim171.use(5)) { toast(`เงินในซิมไม่พอโทร (เหลือ ${bS(sim().sim)}) เติมเงินได้ที่ตู้ ATM หรือแอปธนาคาร (โทร 191/199/1669 ฟรี)`, '📱'); return; } return o(name); }; }
  UI.H.s163sim = d => {
    const n = +d.v, x = sim(); if (!(n > 0)) return; if (sav() < n) { toast('เงินในบัญชีออมทรัพย์ไม่พอ', '💸'); return; }
    Bank.st().sav -= n; B.tx(`เติมเงินมือถือ (แอปธนาคาร)`, -n, 'main'); try { Bank2.log('เติมเงินมือถือ', -n); } catch (e) { } x.sim += n; toast(`เติมเงินซิม ${bS(n)} แล้ว (เหลือ ${bS(x.sim)})`, '📱');
  };

  // ===================== money hub =====================
  function hubHtml() {
    const x = X(), v = B.V(), fx = window.Fx170 ? window.Fx170.wallet() : {}, x170 = window.Bank170.X(), cr = typeof Credit !== 'undefined' ? Credit.st() : { loans: [], card: {}, cl: {} };
    const cur = B.curAcct && B.curAcct() ? B.curAcct().bal : 0, others = B.all().filter(a => !a.main && a.type !== 'cur').reduce((s, a) => s + a.bal, 0);
    const fd = (v.fd || []).reduce((s, f) => s + f.amt, 0), jars = (Bank.st().jars || []).reduce((s, j) => s + j.amt, 0) + (Bank.st().fixed || []).reduce((s, f) => s + f.amt, 0);
    const fxv = Object.keys(fx).reduce((s, c) => s + fx[c] * window.Fx170.sellRate(c), 0), goals = x170.goals.reduce((s, g) => s + g.bal, 0), drafts = x170.drafts.filter(d => d.st === 'valid').reduce((s, d) => s + d.amt, 0);
    const assets = [['💵 เงินสดในกระเป๋า', S._c], ['💰 ออมทรัพย์', sav()], ['🧾 กระแสรายวัน', cur], ['🏦 บัญชีอื่น', others], ['📈 เงินฝากประจำ', fd + jars], ['💰 ดอกเบี้ยสูง', x170.hy.bal], ['👴 เกษียณ', x170.ret.bal], ['🎯 เป้าหมายออม', goals], ['💱 เงินตราต่างประเทศ', fxv], ['📜 ตั๋วเงินธนาคาร', drafts], ['📱 เงินในซิม', sim().sim]];
    const C = window.Card168, cc = C && C.has() ? C.st() : null, line = (cr.cl && cr.cl.bal) || 0, loans = cr.loans.reduce((s, l) => s + l.left, 0);
    const debts = [['🏦 สินเชื่อ', loans], ['💳 บัตรเครดิต', cc ? cc.bal : 0], ['💵 สินเชื่อกดเงินสด', line]];
    const A = assets.reduce((s, a) => s + a[1], 0), D = debts.reduce((s, a) => s + a[1], 0);
    let h = `<p class="lead">🧭 ศูนย์รวมการเงิน</p><div class="card" style="grid-template-columns:1fr"><div class="cb"><h4>ความมั่งคั่งสุทธิ <b class="${A - D >= 0 ? 'good' : 'bad'}">${bS(A - D)}</b></h4><p class="dim">สินทรัพย์ ${bS(A)} − หนี้ ${bS(D)}</p></div></div>`;
    h += `<div class="grid"><div class="card" style="grid-template-columns:1fr"><div class="cb"><h4>สินทรัพย์</h4>${assets.filter(a => a[1] > 0).map(a => `<p style="display:flex;justify-content:space-between;margin:2px 0"><span>${a[0]}</span><b>${bS(a[1])}</b></p>`).join('') || '<p class="dim">-</p>'}</div></div><div class="card" style="grid-template-columns:1fr"><div class="cb"><h4>หนี้สิน</h4>${debts.filter(a => a[1] > 0).map(a => `<p style="display:flex;justify-content:space-between;margin:2px 0"><span>${a[0]}</span><b class="bad">${bS(a[1])}</b></p>`).join('') || '<p class="good">ไม่มีหนี้ 🎉</p>'}</div></div></div>`;
    const bills = window.Bills84 ? window.Bills84.list().slice().sort((a, b) => a.due - b.due) : [], inst = cr.loans.reduce((s, l) => s + Math.min(l.pay, l.left), 0), min = cc && C.minDue ? C.minDue(cc) : 0;
    h += `<h5>📅 ที่ต้องจ่าย</h5>` + (bills.length || inst || min ? bills.map(b => `<p style="display:flex;justify-content:space-between;margin:2px 0"><span>${E(b.name)} <span class="dim">ครบ ${E(RD(b.due))}</span></span><b>${bS(b.amt)}</b></p>`).join('') + (inst ? `<p style="display:flex;justify-content:space-between;margin:2px 0"><span>ค่างวดสินเชื่อ (ต่อเดือน)</span><b>${bS(inst)}</b></p>` : '') + (min ? `<p style="display:flex;justify-content:space-between;margin:2px 0"><span>บัตรเครดิตขั้นต่ำ</span><b>${bS(min)}</b></p>` : '') : '<p class="dim">ไม่มีรายการค้างจ่าย</p>');
    { const ab = window.Bills84.st().auto, cs = Object.keys(window.Bills84.CATS).filter(c => c !== 'card'), on = cs.filter(c => ab[c]).length, sw = x.sweep || { on: 0, keep: 20000 };
      h += `<div class="card" style="grid-template-columns:1fr"><div class="cb"><h4>⚡ หักบัญชีอัตโนมัติ (${on}/${cs.length} ประเภท)</h4><p class="dim">ตัดจากบัญชีออมทรัพย์ก่อนครบกำหนด 1 วัน ถ้าเงินพอ และข้ามเมื่อแอปธนาคารล่ม · เลือกเปิดทีละประเภทได้ในหมวด บิล & ค่าบริการ · ปุ่มนี้เปิด/ปิดทุกประเภทพร้อมกัน</p><div class="row"><button class="btn ${on === cs.length ? 'ghost' : ''}" data-a="s163auto" data-v="on">เปิดทั้งหมด</button><button class="btn ${on ? '' : 'ghost'}" data-a="s163auto" data-v="off">ปิดทั้งหมด</button></div></div></div>
      <div class="card" style="grid-template-columns:1fr"><div class="cb"><h4>🏦 รายได้ที่โอนเข้าบัญชีจริง: <span class="${x.inb === 0 ? 'dim' : 'good'}">${x.inb === 0 ? 'ปิด' : 'เปิด'}</span></h4><p class="dim">เงินเดือน เงินปันผล ค่าเช่า สินไหมประกัน เงินช่วยเหลือรัฐ คืนภาษี รายได้ร้านและแพลตฟอร์มออนไลน์ จะเข้าบัญชีออมทรัพย์โดยตรงเหมือนชีวิตจริง (ขึ้นในใบแจ้งยอด) ส่วนรายได้ตลาดนัด ขายผลผลิต ทิป และรางวัลยังเป็นเงินสด</p><div class="row"><button class="btn ${x.inb === 0 ? '' : 'ghost'}" data-a="s163inb" data-v="on">เปิด</button><button class="btn ${x.inb === 0 ? 'ghost' : ''}" data-a="s163inb" data-v="off">ปิด</button></div></div></div>
      <div class="card" style="grid-template-columns:1fr"><div class="cb"><h4>💵 ฝากเงินสดเข้าบัญชีอัตโนมัติ: <span class="${sw.on ? 'good' : 'dim'}">${sw.on ? 'เปิด' : 'ปิด'}</span></h4><p class="dim">รายได้ทุกอย่างในเกม (ขายผลผลิต เงินเดือน ธุรกิจ ฯลฯ) เข้ากระเป๋าเงินสดก่อน เปิดแล้วทุกวันเงินสดที่เกิน ${bS(sw.keep)} จะถูกฝากเข้าบัญชีออมทรัพย์ให้ (มีดอกเบี้ย ปลอดภัยจากการหาย และขึ้นในใบแจ้งยอด)</p><div class="row"><button class="btn ${sw.on ? 'ghost' : ''}" data-a="s163sweep" data-v="on">เปิด</button><button class="btn ${sw.on ? '' : 'ghost'}" data-a="s163sweep" data-v="off">ปิด</button>${[5000, 20000, 50000].map(n => `<button class="btn ${sw.keep === n ? '' : 'ghost'}" style="${sb}" data-a="s163sweep" data-v="k${n}">เก็บเงินสด ${n.toLocaleString('en-US')}</button>`).join('')}</div></div></div>`; }
    h += `<h5>📱 ซิมมือถือ</h5><div class="card" style="grid-template-columns:1fr"><div class="cb"><p>เงินในซิม <b>${bS(sim().sim)}</b> · โทรหาเพื่อนครั้งละ 5 ฿ (โทรฉุกเฉิน 191 / 199 / 1669 ฟรี)</p><div class="row">${[50, 100, 300, 500].map(n => `<button class="btn ghost" style="${sb}" data-a="s163sim" data-v="${n}">เติม ${n}</button>`).join('')}</div></div></div>`;
    return h;
  }
  const sweep = () => { const sw = X().sweep; if (!sw || !sw.on) return; const n = Math.floor((S._c - sw.keep) / 100) * 100; if (n < 100) return; S._c -= n; Bank.st().sav += n; B.tx('ฝากรายได้เข้าบัญชีอัตโนมัติ', n, 'main'); try { Bank2.log('ฝากรายได้เข้าบัญชีอัตโนมัติ', n); } catch (e) { } };
  UI.H.s163sweep = d => { const x = X(); x.sweep = x.sweep || { on: 0, keep: 20000 }; if (d.v === 'on') x.sweep.on = 1; else if (d.v === 'off') x.sweep.on = 0; else if (/^k\d+$/.test(d.v)) x.sweep.keep = +d.v.slice(1); toast(x.sweep.on ? `ฝากรายได้เข้าบัญชีอัตโนมัติ (เก็บเงินสด ${bS(x.sweep.keep)})` : 'ปิดฝากรายได้เข้าบัญชีอัตโนมัติ', '💵'); };
  UI.H.s163auto = d => { const a = window.Bills84.st().auto, on = d.v === 'on'; for (const c of Object.keys(window.Bills84.CATS)) if (c !== 'card') a[c] = on ? 1 : 0; toast(on ? 'เปิดหักบัญชีอัตโนมัติทุกประเภทบิล' : 'ปิดหักบัญชีอัตโนมัติทุกประเภทบิล', '⚡'); };

  if (typeof Credit !== 'undefined' && Credit.quote && Credit.borrow) {
    const q0 = Credit.quote.bind(Credit); Credit.quote = (k, a) => { const q = q0(k, a), cut = rateCut(); if (cut > 0 && q.r > 0.03) { const old = q.pay, r = Math.max(0.03, q.r - cut); q.r = r; q.pay = Math.round(a * (r / 12) / (1 - Math.pow(1 + r / 12, -q.n))); q.dsr = Math.max(0, q.dsr - (old - q.pay) / Math.max(1, Credit.income())); } return q; };
    const b0 = Credit.borrow.bind(Credit); Credit.borrow = function (kind, amt, ref) { const ok = b0(kind, amt, ref); if (ok) { const n = Math.min(Math.round(amt), Math.max(0, S._c)); if (n > 0) { S._c -= n; Bank.st().sav += n; B.tx('เงินกู้เข้าบัญชี', n, 'main'); try { Bank2.log('เงินกู้เข้าบัญชีออมทรัพย์', n); } catch (e) { } } } return ok; };
  }
  // ===================== income that really arrives through the bank =====================
  // wages, dividends, rent, benefits, insurance, refunds and platform payouts are credited to the savings account (a bank transfer); street/market sales, tips and prizes stay cash
  const BANKY = /ขายอสังหา|ขายหุ้น|ให้โรงงาน|คืนค่าธรรมเนียม|ประกัน|เงินเดือน|ปันผล|ค่าเช่า|สินไหม|เยียวยา|ช่วยเหลือ|สวัสดิการ|ทุนการศึกษา|อุดหนุน|คืนภาษี|ชดเชย|ค่าตอบแทน|รายได้ร้าน|ร้านของฉัน|รายได้โฆษณา|รายได้คลิป|ไลฟ์สตรีม|ฟรีแลนซ์|เรนเดอร์|แท็กซี่|เกษตรท่องเที่ยว|โฮมสเตย์|คืนทุน|ส่งเงินให้|เงินโอนจาก|ขายไฟ|สัญญาส่ง|ค่าคอมมิชชัน|กำไรจากการขายหุ้น|โบนัสสตรีม|ค่าเวร|รับเงินขาย/;
  const NOTBANK = /ตลาดนัด|แผงหน้าฟาร์ม|ขายผลผลิต|เปิดหมวก|รางวัล|ลอตเตอรี่|ของขวัญ|งานพิเศษ|เทิร์นอิน|อาสา|ภารกิจ|ส่งสินค้าข้ามเมือง|น้ำใจ|ดอกเบี้ย|เงินกู้/;
  const inbOn = () => X().inb !== 0;
  const flowIn = (n, label) => { n = Math.round(n); if (!(n > 0) || !inbOn()) return 0; const P = window.Pay49; if (P && (P.src || P.busy)) return 0; n = Math.min(n, Math.floor(S._c)); if (n < 1) return 0; S._c -= n; Bank.st().sav += n; B.tx('รับโอนเข้าบัญชี: ' + label, n, 'main'); try { Bank2.log('รับโอนเข้าบัญชี: ' + label, n); } catch (e) { } return n; };
  window.Flow171 = { in: flowIn, isBanky: l => BANKY.test(String(l)) && !NOTBANK.test(String(l)) };
  { const i0 = Bank2.income.bind(Bank2); Bank2.income = function (src, n) { const r = i0(src, n); try { if (window.Flow171.isBanky(src)) flowIn(n, String(src)); } catch (e) { console.warn('flowIn', e); } return r; };
    if (Bank2.borrow) { const b0 = Bank2.borrow.bind(Bank2); Bank2.borrow = function (n) { const c0 = S._c, r = b0(n), d = S._c - c0; if (d > 0) flowIn(d, 'เงินกู้ธนาคาร'); return r; }; } }
  UI.H.s163inb = d => { X().inb = d.v === 'on' ? 1 : 0; toast(d.v === 'on' ? 'เงินเดือน ปันผล ค่าเช่า เงินช่วยเหลือ ฯลฯ จะเข้าบัญชีออมทรัพย์' : 'รายได้ทุกอย่างจะเข้ากระเป๋าเงินสด', '🏦'); };
  // ===================== Wisdom (invitation-only premium card by total deposits) =====================
  function deposits() {
    const v = B.V(), x = window.Bank170.X(), a = B.all().filter(q => !q.main).reduce((s, q) => s + q.bal, 0);
    return sav() + a + (v.fd || []).reduce((s, f) => s + f.amt, 0) + (Bank.st().fixed || []).reduce((s, f) => s + f.amt, 0) + x.hy.bal + x.ret.bal + x.goals.reduce((s, g) => s + g.bal, 0);
  }
  window.Wisdom171 = { deposits, tiers: WIS, cut: () => rateCut() };
  function acceptWis(l) {
    const e = ent('cc0'), x = X(); if (!e) { toast('ต้องมีบัตรเครดิตก่อนจึงอัปเกรดเป็น Wisdom ได้', 'ℹ️'); return false; } if (deposits() < WIS[l].min) { toast(`ยอดเงินฝากรวมต้องไม่ต่ำกว่า ${bS(WIS[l].min)}`, 'ℹ️'); return false; }
    const c = window.Card168.st(); c.limit = Math.max(c.limit, WIS[l].lim); e.wis = l; x.wlow = 0; regen(e, 0);
    msg(`ยินดีด้วย! คุณได้รับเชิญเป็นลูกค้า ${WIS[l].n} ของธนาคารสุขใจ วงเงินบัตรเพิ่มเป็น ${bS(c.limit)} คืนเงินเพิ่ม ${WIS[l].cb * 100}% แลกเงินฟรีค่าธรรมเนียม ดอกเบี้ยพิเศษบัญชีดอกเบี้ยสูง บัตร Wisdom ใบใหม่จะจัดส่งถึงประมาณ ${RD(e.ready)}`, true); toast(`อัปเกรดเป็น ${WIS[l].n} แล้ว`, '👑'); return true;
  }
  const o0 = UI.H.s163offer; UI.H.s163offer = d => { if (/^wis/.test(String(d.v))) { const b = window.Bank170.X(); if (acceptWis(+String(d.v).slice(3))) b.off = b.off.filter(q => q.k !== d.v); return; } return o0(d); };
  function wisMonth() {
    const x = X(), mk = (() => { try { const t = Cal36.date(S.day); return t.be * 12 + t.m; } catch (e) { return Math.floor(S.day / 7); } })(); if (x.wmk === mk) return; x.wmk = mk;
    const e = ent('cc0'), dep = deposits(); if (!e) return; const b = window.Bank170.X();
    if (e.wis) { if (dep < WIS[e.wis].min * 0.7) { x.wlow = (x.wlow || 0) + 1; if (x.wlow === 1) msg(`ยอดเงินฝากรวมของคุณ ${bS(dep)} ต่ำกว่าเกณฑ์ ${WIS[e.wis].n} หากต่ำกว่านี้อีก 1 เดือน สถานะจะถูกปรับลดระดับ`, false); else { const old = e.wis; e.wis = old - 1; x.wlow = 0; msg(`ปรับลดสถานะจาก ${WIS[old].n} เนื่องจากยอดเงินฝากต่ำกว่าเกณฑ์ ${e.wis ? 'เป็น ' + WIS[e.wis].n : 'กลับเป็นบัตรปกติ'}`, false); } } else x.wlow = 0; }
    const l = dep >= WIS[2].min ? 2 : dep >= WIS[1].min ? 1 : 0;
    if (l > (e.wis || 0) && !b.off.some(q => /^wis/.test(q.k))) { b.off = b.off.filter(q => !/^wis/.test(q.k)); b.off.unshift({ k: 'wis' + l, t: `👑 คำเชิญ ${WIS[l].n}`, txt: `ยอดเงินฝากรวมของคุณ ${bS(dep)} ธนาคารขอเชิญเป็นลูกค้า ${WIS[l].n}: วงเงินบัตร ${bS(WIS[l].lim)} คืนเงินเพิ่ม ${WIS[l].cb * 100}% แลกเงินฟรีค่าธรรมเนียม ดอกเบี้ยพิเศษ (ต้องรักษายอดฝากไม่ต่ำกว่า ${bS(WIS[l].min * 0.7)})`, exp: S.day + 28 }); msg(`ธนาคารมีคำเชิญ ${WIS[l].n} สำหรับคุณ ดูที่แอปธนาคาร แท็บ ความปลอดภัย/ข้อเสนอ`, true); }
  }

  // ===================== daily & tabs =====================
  function daily() {
    const x = sync();
    try { wisMonth(); const e = ent('cc0'); if (e && e.wis) { const p = window.Bank170.X().perk; p.fx = Math.max(p.fx, S.day + 2); p.hy = Math.max(p.hy, S.day + 2); } } catch (er) { console.warn('wisdom', er); }
    for (const e of x.cards) {
      if (e.st === 'shipping' && S.day >= e.ready) { e.st = 'delivered'; msg(`📦 ${KINDN[e.type]} ••••${e.no.slice(-4)} จัดส่งถึงแล้ว กรุณาเปิดใช้งานบัตรในแอปธนาคาร แท็บ บัตรของฉัน`, false); }
      if (e.type !== 'atm' && e.st === 'active' && !e.pend && e.exp - S.day <= 14 && e.exp >= S.day) { e.pend = { no: genNo(e.net), cvv: cvv3(), exp: S.day + 420, ready: S.day + DELAY.reissue }; msg(`${KINDN[e.type]} ••••${e.no.slice(-4)} ใกล้หมดอายุ (${expTxt(e.exp)}) ธนาคารออกบัตรใบใหม่ให้อัตโนมัติ จะถึงประมาณ ${RD(e.pend.ready)} เมื่อได้รับให้กดเปิดใช้บัตรใหม่แทนใบเดิม`, false); }
      if (e.pend && !e.pend.said && S.day >= e.pend.ready) { e.pend.said = 1; msg(`📦 บัตรใบใหม่แทน ••••${e.no.slice(-4)} จัดส่งถึงแล้ว กดเปิดใช้บัตรใหม่ในแอปธนาคาร แท็บ บัตรของฉัน`, false); }
    }
    sweep();
  }
  const T = ['🎴 บัตรของฉัน', '🧭 ศูนย์การเงิน'];
  { const _open = UI.open.bind(UI);
    UI.open = function (title, tabs, render, opts) {
      if (Array.isArray(tabs) && !tabs.includes(T[0])) {
        const ok = (/^ธนาคารสุขใจ (สาขา|สำนักงาน)/.test(String(title)) && tabs.length >= 2) || (title === '📱 แอปธนาคารสุขใจ' && tabs.length >= 6);
        if (ok) { const base = tabs.length, r0 = render; tabs = tabs.concat(T); render = t => (t === base ? tabCards() : t === base + 1 ? hubHtml() : r0(t)); }
      }
      return _open(title, tabs, render, opts);
    }; }
  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { daily(); } catch (e) { console.warn('v171', e); } return r; }; }
  window.Bank171 = { visual, tabCards, hubHtml, sync, regen, genNo, luhn };
});
