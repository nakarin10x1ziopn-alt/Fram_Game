'use strict';
// ---------- v203_boards: shares in every shop / venue of the game + board meetings (also for your own companies) ----------
// Every shop of the game (car dealer, IT shop, mall ...) plus the bank, hospital, hotel ... has shareholders: an owner, a few investors and the public.
// You buy from the public (market price) or ask a holder to sell (offer a premium). Over 50% = you own it: you set the dividend, may bring in new holders,
// sell blocks to friends, and call board meetings. With 10% or more you may call a meeting; with 5% or more you vote. Your own companies have board meetings too.
V23.add('v203_boards', () => {
  if (typeof Phone === 'undefined' || typeof SHOPS === 'undefined' || typeof Company === 'undefined') return;
  const E = s => (typeof esc === 'function' ? esc(s) : String(s));
  const SHARES = 1e6, YEAR = 84;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const hash = s => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  const POOL = ['คุณสมศักดิ์ รุ่งเรือง', 'คุณวรวุฒิ ใจดี', 'คุณนภา ศรีสุข', 'บริษัท ทุนสุขใจ จำกัด', 'กองทุนรวมเกษตรไทย', 'คุณพิมพ์ชนก แก้วมณี', 'คุณธีรพงษ์ ทองดี', 'คุณอรทัย วงศ์ไทย', 'เสี่ยเจริญ ตลาดเช้า', 'ตระกูลศรีสุขสกุล', 'คุณกิตติ ชัยมงคล', 'กลุ่มลงทุนสวนทอง'];
  const ICON = [[/รถ|มอเตอร์|คาร์|ยนต์|dealer/i, '🚗'], [/ไอที|คอม|มือถือ|โน้ตบุ|แกดเจ็ต|เทค/i, '💻'], [/อาหาร|ร้าน.*ครัว|ป้า|ก๋วยเตี๋ยว|ข้าว|ซีฟู้ด|ทะเล|คาเฟ่|กาแฟ/i, '🍜'], [/เกษตร|ฟาร์ม|ปศุสัตว์|เมล็ด/i, '🌾'], [/ดอกไม้|ไม้/i, '🌸'], [/มาร์ท|สะดวกซื้อ|ตลาด/i, '🛒'], [/พลาซ่า|มอลล์|ห้าง/i, '🏬'], [/เฟอร์|ตกแต่ง|ช่างไม้/i, '🛋️'], [/เสื้อ|แฟชั่น|ผ้า/i, '👕'], [/ธนาคาร/, '🏦'], [/โรงพยาบาล|ยา|คลินิก/, '🏥']];
  const iconOf = n => { for (const [r, i] of ICON) if (r.test(n)) return i; return '🏪'; };
  const EXTRA = [['bank', 'ธนาคารสุขใจ', '🏦', 90000], ['hospital', 'โรงพยาบาลสุขใจ', '🏥', 70000], ['hotel', 'โรงแรมสุขใจรีสอร์ต', '🏨', 45000], ['fuel', 'ปั๊มน้ำมันสุขใจ', '⛽', 38000], ['school', 'โรงเรียนอนุบาลสุขใจ', '🏫', 22000], ['cinema', 'โรงภาพยนตร์สุขใจ', '🎬', 26000]];
  const st = () => (S.eq = S.eq || { e: {}, mt: [], mins: [], n: 0, draft: {}, div: 0 });
  const npcName = () => { try { const L = (G.npcs || []).map(n => n.name).filter(Boolean); if (L.length && Math.random() < 0.4) return 'คุณ' + U.pick(L); } catch (e) { } return U.pick(POOL); };

  // ----- the list of everything you can own a piece of -----
  const keys = () => {
    const L = [];
    for (const k of Object.keys(SHOPS)) if (!/^(fest_|online)/.test(k) && SHOPS[k] && SHOPS[k].n) L.push('s:' + k);
    for (const x of EXTRA) L.push('x:' + x[0]);
    return L;
  };
  const nameOf = k => { if (k.startsWith('co:')) { const c = Company.get(+k.slice(3)); return c ? c.name : '?'; } if (k.startsWith('s:')) return (SHOPS[k.slice(2)] || {}).n || k; const x = EXTRA.find(y => 'x:' + y[0] === k); return x ? x[1] : k; };
  const iconFor = k => { if (k.startsWith('co:')) { const c = Company.get(+k.slice(3)); return c && CO_TYPES[c.type] ? CO_TYPES[c.type].i : '🏢'; } const x = EXTRA.find(y => 'x:' + y[0] === k); return x ? x[2] : iconOf(nameOf(k)); };
  const baseProfit = k => { const x = EXTRA.find(y => 'x:' + y[0] === k); if (x) return x[3]; const n = nameOf(k), h = hash(k); let b = 4000 + (h % 11) * 2200; if (/รถ|มอเตอร์|พลาซ่า|มอลล์/.test(n)) b *= 2.6; if (/ไอที|คอม/.test(n)) b *= 1.8; return Math.round(b); };
  // state of a shop entity (created the first time it is looked at; deterministic start)
  const ent = k => {
    const s = st(); let e = s.e[k]; if (e) return e;
    const h = hash(k), own = 0.55 + (h % 15) / 100, i1 = 0.06 + (h % 7) / 100, i2 = 0.04 + (h % 5) / 100;
    e = s.e[k] = { base: baseProfit(k), m: 1, k: 1, pay: 0.4, cash: baseProfit(k) * 14, me: 0, px: 0, hist: [], earned: 0, cost: 0,
      h: [{ n: npcName(), pct: own, ask: 0.3 + (h % 20) / 100 }, { n: npcName(), pct: i1, ask: 0.1 + (h % 9) / 100 }, { n: npcName(), pct: i2, ask: 0.08 + (h % 13) / 100 }] };
    e.px = priceNow(e); e.hist = [e.px]; return e;
  };
  const weekProfit = e => Math.round(e.base * e.m * e.k * 7);
  const priceNow = e => +(Math.max(0.2, e.base * e.m * e.k * YEAR * 9 / SHARES + e.cash * 0.5 / SHARES)).toFixed(2);
  const float = e => Math.max(0, 1 - e.me - e.h.reduce((a, x) => a + x.pct, 0));
  const fee = v => Math.max(50, Math.round(v * 0.00157 * 1.07));
  const topNpc = e => e.h.slice().sort((a, b) => b.pct - a.pct)[0];
  const ownerOf = e => e.me > 0.5 ? 'me' : (topNpc(e) && topNpc(e).pct > 0.5 ? topNpc(e).n : null);
  const chairOf = e => { const t = topNpc(e); return e.me >= (t ? t.pct : 0) && e.me > 0 ? 'me' : (t ? t.n : '-'); };
  const pc = x => (x * 100).toFixed(x < 0.1 ? 1 : 0) + '%';

  // ----- trading -----
  const takeCheck = (e, k, before) => {
    if (before <= 0.5 && e.me > 0.5) { Phone.msg('ตลาดหลักทรัพย์สุขใจ', `คุณถือหุ้น ${nameOf(k)} เกิน 50% แล้ว ได้เป็นเจ้าของกิจการ! เปลี่ยนผู้ถือหุ้นใหญ่ ตั้งปันผลและเรียกประชุมบอร์ดได้เอง`, true); try { Life2.note('ซื้อกิจการ ' + nameOf(k) + ' 🏬'); } catch (x) { } UI.toast('คุณเป็นเจ้าของ ' + nameOf(k) + ' แล้ว!', '🏬'); }
    if (before > 0.5 && e.me <= 0.5) UI.toast('ถือหุ้นไม่เกิน 50% แล้ว ไม่ใช่เจ้าของกิจการอีกต่อไป', '⚠️');
  };
  const buyFloat = (k, p) => {
    const e = ent(k); p = Math.min(p, float(e)); if (p < 0.0099) { UI.toast('หุ้นในตลาดเหลือไม่พอ ลองขอซื้อต่อจากผู้ถือหุ้นรายใหญ่', '📉'); return; }
    const v = Math.round(p * SHARES * e.px * (1 + p * 0.5)), f = fee(v); if (S.money < v + f) { UI.toast(`เงินไม่พอ ต้องใช้ ${baht(v + f)}`, '💸'); return; }
    const b = e.me; S.money -= v + f; e.me += p; e.cost += v + f; e.cash += 0; try { Bank2.log('ซื้อหุ้น ' + nameOf(k), -(v + f)); } catch (x) { } takeCheck(e, k, b); UI.toast(`ซื้อหุ้น ${nameOf(k)} ${pc(p)} ราคา ${baht(v)}`, '📈');
  };
  const buyFrom = (k, i, p, prem) => {
    const e = ent(k), h = e.h[i]; if (!h) return; p = Math.min(p, h.pct); if (p <= 0) return;
    if (prem < h.ask) { Phone.msg(h.n, `ขอบคุณสำหรับข้อเสนอ แต่ราคานี้ต่ำเกินไป ขอไม่ขายหุ้น ${nameOf(k)} ในราคานี้`, false); return; }
    const v = Math.round(p * SHARES * e.px * (1 + prem)), f = fee(v); if (S.money < v + f) { UI.toast(`เงินไม่พอ ต้องใช้ ${baht(v + f)}`, '💸'); return; }
    const b = e.me; S.money -= v + f; h.pct -= p; e.me += p; e.cost += v + f; if (h.pct < 0.0005) e.h.splice(i, 1);
    try { Bank2.log('ซื้อหุ้นต่อจาก ' + h.n, -(v + f)); } catch (x) { } Phone.msg(h.n, `ตกลงขายหุ้น ${nameOf(k)} ${pc(p)} ให้คุณ ในราคา ${baht(v)}`, false); takeCheck(e, k, b);
  };
  const sell = (k, p) => {
    const e = ent(k); p = Math.min(p, e.me); if (p <= 0) return; const v = Math.round(p * SHARES * e.px * 0.98), f = fee(v), b = e.me;
    e.me -= p; e.cost *= e.me / (e.me + p); earn(v - f); try { Bank2.income('ขายหุ้น ' + nameOf(k), v - f); } catch (x) { } takeCheck(e, k, b); UI.toast(`ขายหุ้น ${nameOf(k)} ${pc(p)} ได้ ${baht(v - f)}`, '💰');
  };
  // change shareholders: sell a block to a person (friend / villager) at the market price, or give it away
  const xfer = (k, who, p, gift) => {
    const e = ent(k); p = Math.min(p, e.me); who = String(who || '').trim(); if (!who || p <= 0) { UI.toast('เลือกผู้ถือหุ้นใหม่และจำนวนหุ้น', '👥'); return; }
    const b = e.me; e.me -= p; let h = e.h.find(x => x.n === who); if (!h) { h = { n: who, pct: 0, ask: 0.2 }; e.h.push(h); } h.pct += p;
    const v = gift ? 0 : Math.round(p * SHARES * e.px); if (v) { earn(v); try { Bank2.income('ขายหุ้นให้ ' + who, v); } catch (x) { } }
    Phone.msg(who, gift ? `ขอบคุณที่มอบหุ้น ${nameOf(k)} ${pc(p)} ให้ครับ/ค่ะ` : `ซื้อหุ้น ${nameOf(k)} ${pc(p)} ในราคา ${baht(v)} เรียบร้อย`, false); takeCheck(e, k, b);
  };

  // ----- days -----
  const day = () => {
    const s = st(); for (const k of keys()) {
      const e = ent(k); e.m = U.clamp ? U.clamp(e.m + (1 - e.m) * 0.04 + rnd(-0.035, 0.035), 0.55, 1.8) : Math.max(0.55, Math.min(1.8, e.m + (1 - e.m) * 0.04 + rnd(-0.035, 0.035)));
      e.cash += Math.round(e.base * e.m * e.k * (1 - e.pay)); const px = priceNow(e); e.px = +(e.px + (px - e.px) * 0.25).toFixed(2); e.hist.push(e.px); if (e.hist.length > 20) e.hist.shift();
    }
    for (const m of s.mt) {
      if (m.status === 'sched' && S.day >= m.day) { m.status = 'due'; Phone.msg('เลขานุการบริษัท', `วันนี้นัดหมายประชุมบอร์ด ${nameOf(m.key)} เปิดแอป "ประชุมบอร์ด" เพื่อเข้าร่วมและลงมติ (ปิดรับ ${RD(m.day + 2)})`, false); }
      else if (m.status === 'sched' && S.day === m.day - 1) Phone.msg('เลขานุการบริษัท', `เตือน: พรุ่งนี้นัดหมายประชุมบอร์ด ${nameOf(m.key)}`, true);
      else if (m.status === 'due' && S.day > m.day + 2) { m.status = 'cancel'; m.note = 'ไม่ครบองค์ประชุม (ไม่ได้เข้าประชุมตามกำหนด)'; Phone.msg('เลขานุการบริษัท', `ประชุมบอร์ด ${nameOf(m.key)} ถูกยกเลิก เพราะไม่ได้เข้าร่วมตามกำหนด`, false); }
    }
    s.mt = s.mt.filter(m => !(m.status !== 'sched' && m.status !== 'due' && S.day - (m.done || m.day) > 40));
  };
  const week = () => {
    const s = st(); let tot = 0;
    for (const k of keys()) {
      const e = ent(k), pr = weekProfit(e), div = Math.round(pr * e.pay * e.me * 0.9);
      if (div > 0) { tot += div; e.earned += div; }
      // an outside holder (not the owner) calls a meeting when you hold 5% or more
      if (e.me >= 0.05 && Math.random() < 0.04 && !s.mt.some(m => m.key === k && (m.status === 'sched' || m.status === 'due'))) {
        const t = topNpc(e), kinds = AG_SHOP, a = U.pick(Object.keys(kinds)), o = U.pick(AG[a].opts);
        mk(k, [{ t: a, v: o.v }], S.day + 3, t ? t.n : 'ผู้ถือหุ้น');
      }
    }
    if (tot > 0) { earn(tot); try { Bank2.income('เงินปันผลหุ้นร้านค้า (หัก 10%)', tot); } catch (x) { } Phone.msg('หุ้นร้านค้า', `ได้รับเงินปันผลหุ้นร้านค้ารวม ${baht(tot)}`, true); }
    // own companies: an annual general meeting is expected once a year
    for (const c of Company.list()) if (['setup', 'open'].includes(c.st)) { const y = Math.floor((S.day - 1) / YEAR); if (c.agmY == null) c.agmY = y; if (y > c.agmY && !s.mt.some(m => m.key === 'co:' + c.id && m.items.some(i => i.t === 'agm') && m.status !== 'done' && m.status !== 'cancel')) { c.agmY = y; Phone.msg('เลขานุการบริษัท', `${c.name} ครบรอบปีบัญชี ควรนัดประชุมสามัญผู้ถือหุ้นเพื่ออนุมัติงบการเงิน (เมนู ประชุมบอร์ด)`, true); } }
  };

  // ----- board agenda: what can be decided -----
  const AG = {
    div: { n: 'กำหนดอัตราปันผล', opts: [0.2, 0.4, 0.6, 0.8, 1].map(v => ({ v, l: `จ่ายปันผล ${v * 100}% ของกำไร` })), yes: o => 0.35 + 0.5 * o.v },
    mgr: { n: 'จ้างผู้จัดการมืออาชีพ', opts: [{ v: 1, l: 'จ้างผู้จัดการ (ค่าใช้จ่าย 150,000 ฿)' }], yes: () => 0.6 },
    expand: { n: 'ลงทุนขยายกิจการ', opts: [{ v: 1, l: 'ขยาย/ปรับปรุงกิจการ (+12% กำไร)' }], yes: () => 0.5 },
    newholder: { n: 'รับผู้ถือหุ้นรายใหม่', opts: [{ v: 0.1, l: 'ออกหุ้นใหม่ 10% ให้นักลงทุนรายใหม่' }], yes: () => 0.3 },
    agm: { n: 'อนุมัติงบการเงินประจำปี', opts: [{ v: 1, l: 'รับรองงบการเงิน / รายงานประจำปี' }], yes: () => 0.9 },
    cap: { n: 'เพิ่มทุน', opts: [1e6, 2e6, 5e6].map(v => ({ v, l: `เรียกชำระค่าหุ้นเพิ่ม ${baht(v)}` })), yes: () => 0.5 },
    spec: { n: 'ปันผลพิเศษ', opts: [1e5, 5e5, 1e6, 3e6].map(v => ({ v, l: `ปันผลพิเศษ ${baht(v)}` })), yes: () => 0.6 },
    holder: { n: 'เปลี่ยนผู้ถือหุ้นร่วม', opts: [{ v: 0, l: 'เปลี่ยนผู้ถือหุ้นร่วม (เลือกเมื่อลงมติ)' }], yes: () => 0.5 },
  };
  const AG_SHOP = { div: 1, mgr: 1, expand: 1, newholder: 1, agm: 1 }, AG_CO = { spec: 1, mgr: 1, expand: 1, cap: 1, holder: 1, agm: 1 };
  const agFor = k => k.startsWith('co:') ? AG_CO : AG_SHOP;
  // who holds what (own companies: you and your co-shareholder)
  const holders = k => {
    if (k.startsWith('co:')) { const c = Company.get(+k.slice(3)); if (!c) return { me: 0, list: [] }; const me = Math.min(0.99, c.mine ?? 1); return { me, list: [{ n: c.partner || 'นักลงทุนอิสระ', pct: 1 - me }], ctl: me > 0.5 }; }
    const e = ent(k); return { me: e.me, list: e.h, ctl: e.me > 0.5 };
  };
  const apply = (m, it) => {
    const k = m.key, t = it.t, v = it.v;
    if (k.startsWith('co:')) {
      const c = Company.get(+k.slice(3)); if (!c) return 'ไม่พบบริษัท';
      if (t === 'spec') { if (c.cash < v + 20000) return 'เงินบริษัทไม่พอจ่ายปันผล'; c.cash -= v; const my = Math.round(v * Math.min(0.99, c.mine ?? 1) * 0.9); earn(my); try { Bank2.income('ปันผลพิเศษ ' + c.name, my); } catch (x) { } return `จ่ายปันผล ${baht(v)} (คุณได้รับ ${baht(my)})`; }
      if (t === 'mgr') { if (c.cash < 150000) return 'เงินบริษัทไม่พอ'; c.cash -= 150000; c.rep = Math.min(100, c.rep + 10); return 'จ้างกรรมการผู้จัดการ ชื่อเสียง +10'; }
      if (t === 'expand') { if (c.cash < 500000) return 'เงินบริษัทไม่พอ'; c.cash -= 500000; c.rep = Math.min(100, c.rep + 8); return 'ลงทุนขยายกิจการ ชื่อเสียง +8'; }
      if (t === 'cap') { if (S.money < v) return 'เงินสดของคุณไม่พอ'; coInject(c, v); return 'เรียกชำระค่าหุ้นเพิ่มแล้ว'; }
      if (t === 'agm') { c.agmY = Math.floor((S.day - 1) / YEAR); c.rep = Math.min(100, c.rep + 2); return 'รับรองงบการเงินประจำปี'; }
      if (t === 'holder') { const L = Company.partners().filter(n => n !== c.partner); if (!L.length) return 'ไม่มีผู้ถือหุ้นรายอื่นให้เปลี่ยน'; const n = it.who && L.includes(it.who) ? it.who : L[0]; c.partner = n; return 'ผู้ถือหุ้นร่วมใหม่: ' + n; }
      return '';
    }
    const e = ent(k);
    if (t === 'div') { e.pay = v; return `อัตราปันผล ${v * 100}%`; }
    if (t === 'mgr') { if (e.cash < 150000) return 'เงินสดร้านไม่พอ'; e.cash -= 150000; e.k *= 1.15; return 'จ้างผู้จัดการมืออาชีพ กำไร +15%'; }
    if (t === 'expand') { const cost = Math.max(300000, Math.round(weekProfit(e) * 1.5)); if (e.cash < cost) return `เงินสดร้านไม่พอ (ต้อง ${baht(cost)})`; e.cash -= cost; e.k *= 1.12; return `ลงทุนขยายกิจการ ${baht(cost)} กำไร +12%`; }
    if (t === 'newholder') { const f = 1 - v; e.me *= f; for (const h of e.h) h.pct *= f; const n = npcName(); e.h.push({ n, pct: v, ask: 0.15 }); e.cash += Math.round(v * SHARES * e.px * 0.95); return `${n} เข้าเป็นผู้ถือหุ้นใหม่ ${pc(v)} (หุ้นของทุกคนถูกปรับสัดส่วน)`; }
    if (t === 'agm') { e.k *= 1.02; return 'รับรองงบการเงิน'; }
    return '';
  };
  const label = (k, it) => { const a = AG[it.t], o = a.opts.find(x => x.v === it.v); return `${a.n}: ${o ? o.l : it.v}`; };
  const mk = (k, items, day, by) => {
    const s = st(); const m = { id: ++s.n, key: k, items: items.map(x => Object.assign({}, x)), day, by, status: 'sched', votes: {} }; s.mt.push(m);
    Phone.msg('เลขานุการบริษัท', `หนังสือนัดหมายประชุมบอร์ด ${nameOf(k)} วันที่ ${RD(day)} โดย ${by === 'me' ? 'คุณ' : by} · วาระ: ${items.map(i => label(k, i)).join(' / ')}`, by === 'me');
    return m;
  };
  const resolve = m => {
    const k = m.key, H = holders(k), res = []; let attend = H.me; for (const h of H.list) if (Math.random() < 0.9) { h.att = true; attend += h.pct; } else h.att = false;
    const ok = attend >= 0.25;
    m.items.forEach((it, i) => {
      if (!ok) { res.push({ txt: label(k, it), pass: false, why: 'ไม่ครบองค์ประชุม' }); return; }
      const my = m.votes[i]; let yes = my === true ? H.me : 0, no = my === false ? H.me : 0;
      for (const h of H.list) if (h.att !== false) { if (Math.random() < AG[it.t].yes(it)) yes += h.pct; else no += h.pct; }
      const pass = yes > no && yes > 0; let out = ''; if (pass) out = apply(m, it);
      res.push({ txt: label(k, it), pass, yes, no, out });
    });
    m.status = 'done'; m.done = S.day; m.res = res; st().mins.unshift({ day: S.day, key: k, res }); if (st().mins.length > 30) st().mins.length = 30;
    const okn = res.filter(r => r.pass).length; Phone.msg('เลขานุการบริษัท', `ปิดประชุมบอร์ด ${nameOf(k)}: ผ่าน ${okn}/${res.length} วาระ`, true);
  };

  // ----- screens -----
  const U2 = { sel: null, key: null };
  const spark = h => { if (!h || h.length < 2) return ''; const a = Math.min(...h), b = Math.max(...h) || 1, bars = '▁▂▃▄▅▆▇█'; return h.map(x => bars[Math.min(7, Math.round((x - a) / Math.max(1e-9, b - a) * 7))]).join(''); };
  const detail = k => {
    const e = ent(k), pr = weekProfit(e), ow = ownerOf(e), mc = Math.round(e.px * SHARES), chg = e.hist.length > 1 ? (e.px / e.hist[e.hist.length - 2] - 1) * 100 : 0;
    const frs = Object.keys(S.friends || {}).filter(n => S.friends[n] >= 2).slice(0, 30), friends = frs.concat(Company.partners().filter(n => !frs.includes(n)));
    const rows = e.h.map((h, i) => `<tr><td>${E(h.n)}${i === e.h.indexOf(topNpc(e)) ? ' 👑' : ''}</td><td>${pc(h.pct)}</td><td>${baht(Math.round(h.pct * mc))}</td><td><button class="btn ghost" data-a="eqask" data-v="${k}" data-i="${i}" data-p="0.05" data-prem="0.1">ขอซื้อ 5% (+10%)</button><button class="btn ghost" data-a="eqask" data-v="${k}" data-i="${i}" data-p="0.05" data-prem="0.3">5% (+30%)</button><button class="btn" data-a="eqask" data-v="${k}" data-i="${i}" data-p="${Math.min(h.pct, 0.51).toFixed(3)}" data-prem="0.5">เทคโอเวอร์ (+50%)</button></td></tr>`).join('');
    return `<div class="card"><div class="ci">${iconFor(k)}</div><div class="cb"><h4>${E(nameOf(k))} · ราคา ${e.px.toFixed(2)} ฿ <small class="${chg >= 0 ? 'good' : 'bad'}">${chg >= 0 ? '▲' : '▼'}${Math.abs(chg).toFixed(1)}%</small> ${spark(e.hist)}</h4>
      <p class="dim">มูลค่ากิจการ ${baht(mc)} · กำไรต่อเดือน ~${baht(pr)} · เงินสดร้าน ${baht(Math.round(e.cash))} · อัตราปันผล ${Math.round(e.pay * 100)}% · ${ow === 'me' ? '👑 คุณเป็นเจ้าของ' : ow ? 'เจ้าของ: ' + E(ow) : 'ไม่มีผู้ถือเสียงข้างมาก (ประธานบอร์ด: ' + E(chairOf(e) === 'me' ? 'คุณ' : chairOf(e)) + ')'}</p>
      <p class="lead">คุณถือ <b>${pc(e.me)}</b> (${baht(Math.round(e.me * mc))})${e.cost ? ` · ต้นทุน ${baht(Math.round(e.cost))}` : ''} · หุ้นในตลาด ${pc(float(e))}</p>
      <div class="row"><button class="btn" data-a="eqbuy" data-v="${k}" data-p="0.01">ซื้อ 1%</button><button class="btn" data-a="eqbuy" data-v="${k}" data-p="0.05">ซื้อ 5%</button><button class="btn" data-a="eqbuy" data-v="${k}" data-p="0.1">ซื้อ 10%</button>${e.me > 0 ? `<button class="btn ghost" data-a="eqsell" data-v="${k}" data-p="0.01">ขาย 1%</button><button class="btn ghost" data-a="eqsell" data-v="${k}" data-p="0.05">ขาย 5%</button><button class="btn ghost" data-a="eqsell" data-v="${k}" data-p="${e.me}">ขายหมด</button>` : ''}</div>
      <table class="tbl"><tr><th>ผู้ถือหุ้น</th><th>สัดส่วน</th><th>มูลค่า</th><th>ขอซื้อต่อ (ยิ่งให้ราคาสูง ยิ่งยอมขาย)</th></tr>${rows}${e.me > 0 ? `<tr><td>👤 คุณ</td><td>${pc(e.me)}</td><td>${baht(Math.round(e.me * mc))}</td><td></td></tr>` : ''}</table>
      ${e.me > 0 ? `<h5>👥 เปลี่ยนผู้ถือหุ้น (โอน/ขายหุ้นของคุณให้บุคคลอื่น)</h5><div class="row"><select id="xfWho">${friends.concat(e.h.map(h => h.n)).filter((v, i, a) => a.indexOf(v) === i).map(n => `<option>${E(n)}</option>`).join('')}</select><select id="xfPct">${[0.01, 0.05, 0.1, 0.25].filter(x => x <= e.me + 1e-9).concat([e.me]).map(x => `<option value="${x}">${pc(x)}</option>`).join('')}</select><button class="btn" data-a="eqxfer" data-v="${k}" data-g="0">ขายให้ราคาตลาด</button><button class="btn ghost" data-a="eqxfer" data-v="${k}" data-g="1">ยกให้เป็นของขวัญ</button></div>` : ''}
      ${ow === 'me' ? `<h5>👑 เจ้าของกิจการ</h5><p class="dim">ตั้งอัตราปันผลและตัดสินใจเรื่องสำคัญได้ผ่านการประชุมบอร์ด (คุณถือเสียงข้างมาก มติผ่านตามที่คุณลงคะแนน)</p>` : ''}
      ${e.me >= 0.1 ? `<div class="row"><button class="btn" data-a="bdopen" data-v="${k}">🗓️ นัดประชุมบอร์ดของ ${E(nameOf(k))}</button></div>` : `<p class="dim">ถือหุ้นตั้งแต่ 10% ขึ้นไปจึงเรียกประชุมบอร์ดได้ (5% ขึ้นไปมีสิทธิ์ลงมติ)</p>`}</div></div>`;
  };
  const tabMarket = () => {
    const L = keys(); if (!U2.sel || !L.includes(U2.sel)) U2.sel = L[0];
    const list = L.map(k => { const e = ent(k), ow = ownerOf(e); return `<button class="btn ${k === U2.sel ? '' : 'ghost'}" data-a="eqsel" data-v="${k}" style="margin:2px">${iconFor(k)} ${E(nameOf(k))} · ${e.px.toFixed(1)}฿${e.me ? ' · ' + pc(e.me) : ''}${ow === 'me' ? ' 👑' : ''}</button>`; }).join('');
    return `<p class="lead">🏬 ซื้อหุ้นร้านค้าและกิจการทุกแห่งในเกม · ค่าคอม 0.157% + VAT · ปันผลเข้าทุกเดือน (หัก 10%) · ถือเกิน 50% = เป็นเจ้าของ</p>${detail(U2.sel)}<h5>เลือกร้านค้า / กิจการ</h5><div class="row" style="flex-wrap:wrap">${list}</div>`;
  };
  const tabPort = () => {
    const L = keys().filter(k => ent(k).me > 0); let tv = 0, tc = 0, own = 0;
    const rows = L.map(k => { const e = ent(k), v = Math.round(e.me * SHARES * e.px); tv += v; tc += e.cost; if (e.me > 0.5) own++; return `<tr><td>${iconFor(k)} ${E(nameOf(k))}</td><td>${pc(e.me)}</td><td>${baht(v)}</td><td class="${v >= e.cost ? 'good' : 'bad'}">${baht(Math.round(v - e.cost))}</td><td>${e.me > 0.5 ? '👑 เจ้าของ' : e.me >= 0.1 ? 'เรียกประชุมได้' : e.me >= 0.05 ? 'มีสิทธิ์ลงมติ' : 'รายย่อย'}</td><td><button class="btn ghost" data-a="eqsel" data-v="${k}" data-t="0">ดู</button></td></tr>`; }).join('');
    return L.length ? `<p class="lead">มูลค่าพอร์ต ${baht(tv)} · ต้นทุน ${baht(Math.round(tc))} · เป็นเจ้าของ ${own} แห่ง</p><table class="tbl"><tr><th>กิจการ</th><th>สัดส่วน</th><th>มูลค่า</th><th>กำไร/ขาดทุน</th><th>สถานะ</th><th></th></tr>${rows}</table>` : '<p class="empty">ยังไม่มีหุ้นร้านค้า ไปที่แท็บ "ร้านค้าทั้งหมด"</p>';
  };
  const itemHtml = (m, it, i) => `<li>${E(label(m.key, it))}${m.status === 'due' && holders(m.key).me >= 0.05 ? ` <button class="btn ${m.votes[i] === true ? '' : 'ghost'}" data-a="bdvote" data-v="${m.id}" data-i="${i}" data-y="1">✅ เห็นด้วย</button><button class="btn ${m.votes[i] === false ? 'danger' : 'ghost'}" data-a="bdvote" data-v="${m.id}" data-i="${i}" data-y="0">❌ ไม่เห็นด้วย</button>` : ''}${it.t === 'holder' && m.status === 'due' ? ` <select id="bdWho${m.id}_${i}">${Company.partners().filter(n => { const c = Company.get(+m.key.slice(3)); return !c || n !== c.partner; }).map(n => `<option>${E(n)}</option>`).join('')}</select>` : ''}</li>`;
  const meetCard = m => `<div class="card"><div class="ci">${iconFor(m.key)}</div><div class="cb"><h4>${E(nameOf(m.key))} · ${m.status === 'due' ? '🔔 ถึงกำหนดประชุม' : '🕓 นัดแล้ว'} ${RD(m.day)}</h4><p class="dim">เรียกประชุมโดย ${m.by === 'me' ? 'คุณ' : E(m.by)}</p><ul class="lead">${m.items.map((it, i) => itemHtml(m, it, i)).join('')}</ul>
    <div class="row">${m.status === 'due' ? `<button class="btn" data-a="bdclose" data-v="${m.id}">ปิดประชุมและนับมติ</button>` : ''}<button class="btn ghost" data-a="bdcancel" data-v="${m.id}">${m.by === 'me' ? 'ยกเลิกการประชุม' : 'ไม่เข้าร่วม'}</button></div></div></div>`;
  const draftHtml = () => {
    const k = U2.key; if (!k) return '';
    const H = holders(k), d = st().draft[k] = st().draft[k] || [], AGs = agFor(k), isCo = k.startsWith('co:');
    if (!isCo && H.me < 0.1) return '';
    const optsAll = Object.keys(AGs).map(a => AG[a].opts.map(o => `<option value="${a}|${o.v}">${E(AG[a].n)} · ${E(o.l)}</option>`).join('')).join('');
    return `<h5>🗓️ นัดประชุมบอร์ด: ${iconFor(k)} ${E(nameOf(k))}</h5><p class="dim">ผู้ถือหุ้น: คุณ ${pc(H.me)}${H.list.map(h => ' · ' + E(h.n) + ' ' + pc(h.pct)).join('')} · ต้องแจ้งล่วงหน้าอย่างน้อย 3 วัน · องค์ประชุมอย่างน้อย 25% ของหุ้น</p>
      ${d.length ? `<ul class="lead">${d.map((it, i) => `<li>${E(label(k, it))} <button class="btn ghost" data-a="bdrm" data-i="${i}">เอาออก</button></li>`).join('')}</ul>` : '<p class="dim">ยังไม่มีวาระ เลือกวาระแล้วกด "เพิ่มวาระ"</p>'}
      <div class="row"><select id="bdAg" style="max-width:100%">${optsAll}</select><button class="btn ghost" data-a="bdadd">เพิ่มวาระ</button></div>
      <div class="row"><select id="bdDay"><option value="3">อีก 3 วัน</option><option value="5">อีก 5 วัน</option><option value="7">อีก 7 วัน</option><option value="14">อีก 14 วัน</option></select><button class="btn" data-a="bdsend" ${d.length ? '' : 'disabled'}>ส่งหนังสือนัดประชุม</button></div>`;
  };
  const tabMeet = () => {
    const s = st(), act = s.mt.filter(m => m.status === 'sched' || m.status === 'due').sort((a, b) => a.day - b.day);
    const mine = Company.list().filter(c => ['setup', 'open'].includes(c.st));
    return `<p class="lead">🗓️ ประชุมบอร์ดและผู้ถือหุ้น: นัดล่วงหน้า → ถึงวันนัดเปิดที่นี่ เข้าร่วมและลงมติ → ปิดประชุม นับคะแนนตามสัดส่วนหุ้น (ผู้ถือหุ้นรายอื่นลงมติเอง)</p>
      ${act.length ? act.map(meetCard).join('') : '<p class="empty">ยังไม่มีการนัดประชุม</p>'}
      <h5>เลือกกิจการที่จะนัดประชุม</h5><div class="row" style="flex-wrap:wrap">${mine.map(c => `<button class="btn ${U2.key === 'co:' + c.id ? '' : 'ghost'}" data-a="bdopen" data-v="co:${c.id}">${CO_TYPES[c.type].i} ${E(c.name)}</button>`).join('')}${keys().filter(k => ent(k).me >= 0.1).map(k => `<button class="btn ${U2.key === k ? '' : 'ghost'}" data-a="bdopen" data-v="${k}">${iconFor(k)} ${E(nameOf(k))}</button>`).join('')}</div>
      ${draftHtml()}
      ${s.mins.length ? `<h5>📜 รายงานการประชุมที่ผ่านมา</h5>${s.mins.slice(0, 8).map(r => `<div class="card"><div class="cb"><h4>${E(nameOf(r.key))} · ${RD(r.day)}</h4><ul class="lead">${r.res.map(x => `<li>${x.pass ? '✅ ผ่าน' : '❌ ไม่ผ่าน'} — ${E(x.txt)}${x.why ? ' (' + x.why + ')' : x.yes != null ? ` (เห็นด้วย ${pc(x.yes)} / ไม่เห็นด้วย ${pc(x.no)})` : ''}${x.out ? ' → ' + E(x.out) : ''}</li>`).join('')}</ul></div></div>`).join('')}` : ''}`;
  };
  const Equity = {
    open(t) { UI.open('🏬 หุ้นร้านค้า & ประชุมบอร์ด', ['ร้านค้าทั้งหมด', 'พอร์ตของฉัน', 'ประชุมบอร์ด'], x => x === 1 ? tabPort() : x === 2 ? tabMeet() : tabMarket(), { wide: true, tab: t || 0 }); },
    openBoard(k) { U2.key = k; this.open(2); },
    ent, keys, nameOf, holders,
  };
  window.Equity = Equity;

  Object.assign(UI.H, {
    eqsel: d => { U2.sel = d.v; if (d.t != null && UI.cur) UI.cur.tab = +d.t; },
    eqbuy: d => buyFloat(d.v, +d.p),
    eqask: d => buyFrom(d.v, +d.i, +d.p, +d.prem),
    eqsell: d => sell(d.v, +d.p),
    eqxfer: d => xfer(d.v, ($('xfWho') || {}).value, +($('xfPct') || {}).value, d.g === '1'),
    bdopen: d => { U2.key = d.v; if (UI.cur) UI.cur.tab = 2; },
    bdadd: () => { const k = U2.key, v = String(($('bdAg') || {}).value || '').split('|'); if (!k || !v[0]) return; const d = st().draft[k] = st().draft[k] || []; if (d.length >= 4) { UI.toast('เพิ่มวาระได้ไม่เกิน 4 วาระ', '🗓️'); return; } const o = AG[v[0]].opts.find(x => String(x.v) === v[1]); const it = { t: v[0], v: o ? o.v : +v[1] }, ex = d.findIndex(x => x.t === it.t); if (ex >= 0) d[ex] = it; else d.push(it); },
    bdrm: d => { const L = st().draft[U2.key] || []; L.splice(+d.i, 1); },
    bdsend: () => { const k = U2.key, d = st().draft[k] || [], dd = +(($('bdDay') || {}).value || 3); if (!k || !d.length) return; if (!k.startsWith('co:') && holders(k).me < 0.1) { UI.toast('ต้องถือหุ้นอย่างน้อย 10% จึงเรียกประชุมได้', '🗓️'); return; } mk(k, d, S.day + Math.max(3, dd), 'me'); st().draft[k] = []; UI.toast('ส่งหนังสือนัดประชุมแล้ว วันประชุมจะมีข้อความแจ้งเตือน', '🗓️'); },
    bdvote: d => { const m = st().mt.find(x => x.id == d.v); if (m) m.votes[+d.i] = d.y === '1'; },
    bdclose: d => { const m = st().mt.find(x => x.id == d.v); if (!m || m.status !== 'due') return; m.items.forEach((it, i) => { if (it.t === 'holder') { const w = ($('bdWho' + m.id + '_' + i) || {}).value; if (w) it.who = w; } if (m.votes[i] == null && m.by === 'me') m.votes[i] = true; }); resolve(m); },
    bdcancel: d => { const m = st().mt.find(x => x.id == d.v); if (m) { m.status = 'cancel'; m.note = 'ยกเลิก'; m.done = S.day; } },
  });

  // game days / weeks: run after the company books close
  { const _d = Company.day.bind(Company); Company.day = () => { _d(); try { day(); } catch (e) { console.warn('boards day', e); } }; const _w = Company.week.bind(Company); Company.week = () => { _w(); try { week(); } catch (e) { console.warn('boards week', e); } }; }

  // a "board meeting" button in each company screen
  { const _h = Company.html.bind(Company); Company.html = t => { let s = _h(t); if (t !== 1) { const c = Company.get(Company.sel); if (c && ['setup', 'open'].includes(c.st)) s = s.replace('<div class="row"><button class="btn danger" data-a="coclose"', `<h5>🗓️ ประชุมบอร์ด / ผู้ถือหุ้น</h5><div class="row"><button class="btn" data-a="bdco" data-v="${c.id}">นัดประชุมบอร์ด ${E(c.name)}</button></div><div class="row"><button class="btn danger" data-a="coclose"`); } return s; }; }
  UI.H.bdco = d => { UI.close(); setTimeout(() => Equity.openBoard('co:' + d.v), 0); };

  // phone apps: shares + board meetings (top-level icons)
  const go = fn => () => { setTimeout(() => { Phone.app = null; UI.close(); fn(); }, 0); return ''; };
  if (!APPS.some(a => a.id === 'shares')) APPS.push({ id: 'shares', i: '🏬', n: 'หุ้นร้านค้า' }, { id: 'boards', i: '🗓️', n: 'ประชุมบอร์ด' });
  Phone.apps.shares = go(() => Equity.open(0));
  Phone.apps.boards = go(() => Equity.open(2));
  if (window.Phone59 && Phone59.CATS) { const add = (cid, app) => { const c = Phone59.CATS.find(x => x[0] === cid); if (c && !c[3].includes(app)) c[3].push(app); }; add('invest', 'shares'); add('work', 'boards'); }
  // the message folder rules already file "หุ้น" under finance and "นัดหมาย" under appointments
  st();
});
