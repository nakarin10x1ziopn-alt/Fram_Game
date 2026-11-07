'use strict';
// ---------- v40: animal raising, end to end ----------
// One set of rules for every animal in S.animals, used by the morning feed, the E prompt, the pen / farm / ranch screens, the shop and the phone:
//  * every animal eats a species-specific amount of feed from the trough each morning (reserve model: a hen eats 1 bag per 10 days, a cow 3 bags a day);
//  * a fed, healthy, adult animal produces its product each morning; the product waits at the animal (a.pend, up to 6) and shows the 🥛/🥚… icon and the E prompt;
//  * unfed / sick / juvenile / stressed animals say exactly why they gave nothing (toast, phone message, card, E prompt);
//  * the same status text (Animal40.badge / stateText) is used everywhere, and the shop shows income per day against feed cost per day.
(() => {
  const RATE = { chicken: 0.1, sheep: 1, pig: 1.5, cow: 3 };          // feed bags per animal per day
  const FEED_PRICE = 30;                                               // baht per bag (a bag is a mixed ration of a couple of kilos)
  const MAXPEND = 6;
  const rate = a => RATE[typeof a === 'string' ? a : a.type] ?? 1;
  const pname = t => (ANIMALS[t] && ANIMALS[t].prod && PRODUCTS[ANIMALS[t].prod]) ? PRODUCTS[ANIMALS[t].prod] : { n: 'ผลผลิต', i: '📦', sell: 0 };
  const baht = n => `฿${Math.round(n).toLocaleString('en-US')}`;
  const K = () => (typeof Farm31 !== 'undefined' && Farm31.KIND) || {};
  const herd = () => { try { return Farm31.herd(); } catch (e) { return S.animals || []; } };
  const adultDays = t => (K()[t] || {}).adult || 6;
  const bornOf = a => (a.born ?? (a.baby != null ? a.baby : null));
  const ageOf = a => { const b = bornOf(a); return b == null ? 99 : S.day - b; };
  const isAdult = a => ageOf(a) >= adultDays(a.type);
  const growDay = a => (bornOf(a) ?? S.day) + adultDays(a.type);
  const cap = () => BARN_CAP[Math.max(1, S.up.barn || 1) - 1] || 4;

  // ---- numbers shown to the player ----
  const yieldBase = a => 1 + ((a.happy ?? 50) >= 80 ? 1 : 0) + ((a.g && a.g.prod >= 9) ? 1 : 0);   // 1..3 per morning
  const incomeDay = (t, y = 1) => (pname(t).sell || 0) * y;
  const feedDay = t => rate(t) * (TOOLS.feed ? TOOLS.feed.price : FEED_PRICE);
  const need = () => Math.max(S.animals.length ? 1 : 0, Math.ceil(S.animals.reduce((s, a) => s + Math.max(0, rate(a) - (a.rs || 0)), 0)));   // bags the herd needs this morning
  const toastOk = (t, i) => { try { if (G.started) UI.toast(t, i); } catch (e) { } };

  // ---- one status for everything ----
  const status = a => {
    if (a.sick) return { c: 'sick', t: 'ป่วย ไม่ให้ผลผลิต (พาไปรักษาที่สัตวแพทย์ ในแอป 🌾 แท็บสัตว์)', b: '🤒 ป่วย' };
    if (!isAdult(a)) return { c: 'young', t: `ยังเป็นลูกสัตว์ โตเต็มวัย${RD(growDay(a))} (อีก ${Math.max(1, growDay(a) - S.day)} วัน)`, b: `🍼 ลูกสัตว์ (โต${RD(growDay(a))})` };
    if ((a.pend || 0) > 0) return { c: 'waiting', t: `มี${pname(a.type).n} ${a.pend} ชิ้นรอเก็บ`, b: `${pname(a.type).i} มี${pname(a.type).n}รอเก็บ ${a.pend}` };
    if (a.hungry) return { c: 'hungry', t: `หิว ไม่ได้กินอาหารเช้านี้ (ต้องการ ${rate(a)} ถุง/วัน, ในรางมี ${S.trough}) เติมรางที่คอก`, b: '🌾 หิว ไม่ให้ผลผลิต' };
    if ((a.happy ?? 50) < 20) return { c: 'stress', t: 'เครียดมาก ความสุขต่ำ ไม่ให้ผลผลิต (ลูบหัว/ให้อาหารให้ครบ)', b: '😟 เครียด' };
    return { c: 'fed', t: `อิ่มแล้ว พรุ่งนี้เช้าจะมี${pname(a.type).n}ให้ (${incomeDay(a.type, yieldBase(a))} ฿ ต่อวัน)`, b: '✅ อิ่ม พร้อมให้ผลผลิตพรุ่งนี้' };
  };
  const stateText = a => { const s = status(a); return `${a.name}: ${s.t}`; };
  const badge = a => status(a).b;

  // ---- migration for animals saved by older versions ----
  const migrate = () => {
    herd();
    for (const a of S.animals) {
      if (a.baby != null && a.born == null) a.born = a.baby;          // life6 'baby' day -> v31 'born' day: one age for everyone
      if (a.pend == null) a.pend = a.prod ? 1 : 0;
      if (a.rs == null) a.rs = 0;
    }
  };

  // ---- morning: replaces the old loop in newDay() ----
  const morning = () => {
    migrate();
    let prod = 0, hungry = 0; const hungryBy = {}, waitBy = {}, why = [];
    // the auto feeder tops the trough up from the bag to what the herd needs today
    if (S.up.feeder && S.animals.length) { const n = Math.min(Math.max(0, need() - S.trough), count('feed')); if (n > 0) { takeItem('feed', n); S.trough += n; } }
    for (const a of S.animals) {
      a.petted = false; const r = rate(a);
      if (a.sick) { a.hungry = false; a.prod = (a.pend || 0) > 0; why.push(`${a.name} ป่วย`); continue; }    // v31 lowers happiness for sick animals
      let fed = true;
      if ((a.rs || 0) + 1e-9 < r) { const take = Math.min(Math.max(0, S.trough), Math.ceil(r - (a.rs || 0))); S.trough -= take; a.rs = (a.rs || 0) + take; }
      if ((a.rs || 0) + 1e-9 >= r) a.rs = Math.max(0, +(a.rs - r).toFixed(3)); else fed = false;
      if (!fed) { a.hungry = true; a.happy = Math.max(0, (a.happy ?? 50) - 10); hungry++; hungryBy[a.type] = (hungryBy[a.type] || 0) + 1; a.prod = (a.pend || 0) > 0; continue; }
      a.hungry = false; a.happy = Math.min(100, (a.happy ?? 50) + 5);
      if (!isAdult(a)) { a.prod = false; continue; }
      if ((a.happy ?? 50) < 20) { a.prod = (a.pend || 0) > 0; continue; }
      a.pend = Math.min(MAXPEND, (a.pend || 0) + yieldBase(a)); a.prod = a.pend > 0; prod++;
    }
    for (const a of S.animals) if ((a.pend || 0) > 0) waitBy[a.type] = (waitBy[a.type] || 0) + a.pend;
    // plain words for the player
    const parts = [];
    for (const t in hungryBy) parts.push(`${ANIMALS[t].n} ${hungryBy[t]} ตัวไม่ได้กินอาหาร`);
    if (parts.length) { const m = `${parts.join(' · ')} (ในรางเหลือ ${S.trough} ถุง ฝูงต้องการวันละ ~${Math.ceil(S.animals.reduce((s, a) => s + rate(a), 0))} ถุง) เติมรางที่คอกก่อนนะ`; try { Phone.msg('ฟาร์มของคุณ', m, true); } catch (e) { } G.farmWarn = m; }
    else G.farmWarn = null;
    const wp = Object.keys(waitBy).map(t => `${pname(t).n} ${waitBy[t]} ชิ้น`);
    if (wp.length) { try { Phone.msg('ฟาร์มของคุณ', `ผลผลิตรอเก็บที่คอก: ${wp.join(' · ')}`, true); } catch (e) { } }
    return { prod, hungry };
  };

  // ---- collect (the same function the E prompt calls) ----
  const collect = A => {
    migrate();
    const a = A.d, k = (ANIMALS[a.type] || {}).prod, n = Math.round(a.pend || 0);
    if (n < 1) { a.prod = false; UI.toast(stateText(a), ANIMALS[a.type].i); return; }
    a.pend = 0; a.prod = false;
    addItem(k, n); S.stats.products += n; Prog.add(6 * Math.min(n, 3)); try { playAct('collect', 0.6); Sfx.pop(); } catch (e) { }
    UI.toast(`ได้${pname(a.type).n} +${n} (≈ ${baht(n * pname(a.type).sell)})`, pname(a.type).i); try { animalSound(a.type); } catch (e) { }
  };
  const collectAll = () => {
    migrate(); let tot = 0; const by = {};
    for (const a of S.animals) if ((a.pend || 0) > 0) { const k = ANIMALS[a.type].prod; by[k] = (by[k] || 0) + a.pend; tot += a.pend; addItem(k, a.pend); S.stats.products += a.pend; a.pend = 0; a.prod = false; }
    if (!tot) { UI.toast('ยังไม่มีผลผลิตรอเก็บ', '🧺'); return 0; }
    Prog.add(Math.min(24, 4 * tot)); try { playAct('collect', 0.6); Sfx.pop(); } catch (e) { }
    UI.toast('เก็บผลผลิตทั้งหมด: ' + Object.keys(by).map(k => `${PRODUCTS[k].n} +${by[k]}`).join(' · '), '🧺'); return tot;
  };
  const fillAll = () => { try { fillTrough(); } catch (e) { } };

  // ---- shop: economics + guidance, quantity cap, refunds ----
  const econ = t => { const f = feedDay(t), i1 = incomeDay(t, 1), i2 = incomeDay(t, 2); return { f, i1, i2, net: i1 - f }; };
  const descFor = t => {
    const A = ANIMALS[t], e = econ(t), r = rate(t), p = pname(t);
    return `ให้${p.n} ${p.i} ทุกเช้าเมื่ออิ่ม (1 ชิ้น ${baht(p.sell)} · 2 ชิ้นเมื่อสุข 80%+) · กินอาหาร ${r < 1 ? `1 ถุงต่อ ${Math.round(1 / r)} วัน` : `${r} ถุง/วัน`} (${baht(e.f)}/วัน) · รายได้ ~${baht(e.i1)}–${baht(e.i2)}/วัน · ซื้อมาโตเต็มวัย พร้อมให้ผลผลิตเช้าวันถัดไป · คอก ${S.animals.length}/${cap()}`;
  };
  const announce = a => {
    const t = a.type, A = ANIMALS[t], p = pname(t), r = rate(t);
    let filled = 0;
    const want = Math.max(0, Math.ceil(r * 2) - S.trough);
    if (S.trough < Math.ceil(r) && count('feed') > 0 && want > 0) { filled = Math.min(want, count('feed')); takeItem('feed', filled); S.trough += filled; }
    const feedTxt = S.trough >= Math.ceil(r)
      ? `ในรางมีอาหาร ${S.trough} ถุง${filled ? ` (เติมให้จากกระเป๋า ${filled} ถุง)` : ''} พรุ่งนี้ 06:00 จะได้${p.n}`
      : `⚠️ ในรางมีอาหารแค่ ${S.trough} ถุง — เติมอาหารสัตว์ที่รางอาหารข้างคอกก่อน (ซื้อได้ที่ร้านเกษตรหรือฟาร์มปศุสัตว์ ถุงละ ${baht(TOOLS.feed.price)}) ไม่งั้นพรุ่งนี้จะไม่มี${p.n}`;
    const msg = `ซื้อ${A.n} “${a.name}” แล้ว (โตเต็มวัย) · ${r < 1 ? `กิน 1 ถุงต่อ ${Math.round(1 / r)} วัน` : `กิน ${r} ถุง/วัน`} · ให้${p.n} ${p.i} ประมาณ 1–2 ชิ้น/วัน (≈ ${baht(incomeDay(t, 1))}–${baht(incomeDay(t, 2))}) · ${feedTxt} · เก็บที่ตัวสัตว์ด้วยปุ่ม E หรือที่จุด "เก็บผลผลิตสัตว์ทั้งหมด"`;
    try { Phone.msg('ฟาร์มของคุณ', msg, true); } catch (e) { }
    toastOk(S.trough >= Math.ceil(r) ? `${A.n} “${a.name}” มาแล้ว — พรุ่งนี้เช้าจะมี${p.n} ${p.i}` : `${A.n} “${a.name}” มาแล้ว — ใส่อาหารในรางก่อน ไม่งั้นไม่มี${p.n}`, A.i);
  };

  // ---- self-test: buy, feed, run mornings, collect through the real E function, sell ----
  const regress = (verbose = true) => {
    const f2 = (() => { try { return Farm2.st(); } catch (e) { return null; } })(), hands0 = f2 ? f2.hands : 0; if (f2) f2.hands = 0;
    const rows = [], save = { money: S.money, an: S.animals.slice(), tr: S.trough, bag: S.inv.feed, pend: S.pets }, keepMsgs = (S.msgs || []).length;
    const sell = (id, n) => { const v = priceOf(id, 1) * n; takeItem(id, n); earn(v); return v; };
    const run = (title, f) => { try { rows.push(Object.assign({ case: title }, f())); } catch (e) { rows.push({ case: title, ok: false, err: e.message }); } };
    const mkA = type => { S.animals.length = 0; S.trough = 0; S.inv.feed = 0; S.money = 99999999; buyAnimal(type); const a = S.animals[S.animals.length - 1]; return a; };
    const day = () => { G.simulating = true; try { S.time = 1439; tick(2); tick(380); } finally { G.simulating = false; } };
    for (const type of Object.keys(ANIMALS)) {
      run(type + ' fed', () => {
        const a = mkA(type); S.trough = Math.ceil(rate(type) * 4 + 2); const p = ANIMALS[type].prod; const c0 = count(p);
        day(); const w = a.pend || 0; day(); day();
        const A = G.animals.find(o => o.d === a); collectAnimal(A || { d: a }); const got = count(p) - c0, v = sell(p, got);
        return { ok: w >= 1 && got >= 2 && !a.prod, waiting1: w, collected3: got, income: Math.round(v), feedCost: Math.round(feedDay(type) * 3) };
      });
      run(type + ' unfed', () => {
        const a = mkA(type); S.trough = 0; day(); day();
        return { ok: !a.prod && !!a.hungry && /หิว/.test(stateText(a)), state: stateText(a).slice(0, 40) };
      });
    }
    run('cow juvenile', () => { const a = mkA('cow'); a.born = S.day - 2; S.trough = 12; day(); return { ok: !a.prod && /ลูกสัตว์/.test(status(a).t), state: status(a).t.slice(0, 40) }; });
    run('cow sick', () => { const a = mkA('cow'); a.sick = S.day; S.trough = 12; day(); return { ok: !a.prod && /ป่วย/.test(status(a).t) }; });
    run('feeder', () => { const a = mkA('cow'); S.up.feeder = 1; S.inv.feed = 9; S.trough = 0; const c0 = count('milk'); day(); const w = a.pend; S.up.feeder = 0; return { ok: w >= 1 && S.inv.feed <= 6, bagLeft: S.inv.feed }; });
    run('cap', () => { S.animals.length = 0; const c = cap(); S.money = 1e8; for (let i = 0; i < c + 2; i++) buyAnimal('chicken'); return { ok: S.animals.length === c, n: S.animals.length, cap: c }; });
    run('hands', () => { const a = mkA('chicken'); const f = Farm2.st(); f.hands = 1; S.trough = 6; const c0 = (S.chest.egg || 0); day(); const got = (S.chest.egg || 0) - c0; f.hands = 0; return { ok: got >= 1 && !a.pend, toChest: got }; });
    // restore
    if (f2) f2.hands = hands0;
    S.animals.length = 0; for (const a of save.an) S.animals.push(a); S.trough = save.tr; S.inv.feed = save.bag || 0; S.money = save.money; try { S.msgs.length = keepMsgs; } catch (e) { }
    if (verbose) { try { console.table(rows); } catch (e) { } }
    return rows;
  };

  // ---- phone / pen screens ----
  const cardHtml = a => {
    const s = status(a), p = pname(a.type), h = Math.round(a.happy ?? 50), r = rate(a), g = a.g ? ` · ยีนผลผลิต ${a.g.prod}/10` : '';
    return `<div class="card"><div class="ci">${ANIMALS[a.type].i}</div><div class="cb"><h4>${esc(a.name)} <small>${ANIMALS[a.type].n}</small></h4><p class="dim">${s.b}<br>ความสุข ${h}/100 ${h >= 80 ? '😍' : h >= 50 ? '🙂' : '😟'}${a.petted ? ' · ลูบหัวแล้ววันนี้' : ''}${g}<br>กิน ${r < 1 ? `1 ถุงต่อ ${Math.round(1 / r)} วัน` : `${r} ถุง/วัน`} · ให้${p.n} ~${baht(incomeDay(a.type, yieldBase(a)))}/วัน</p><div class="bar"><i style="width:${h}%"></i></div></div></div>`;
  };
  const penHtml = () => {
    migrate();
    if (!S.animals.length) return '<p class="empty">ยังไม่มีสัตว์ ซื้อได้ที่ฟาร์มปศุสัตว์ป้าศรี</p>';
    const waiting = S.animals.reduce((s, a) => s + (a.pend || 0), 0), hungry = S.animals.filter(a => a.hungry).length, sick = S.animals.filter(a => a.sick).length;
    const dayNeed = Math.ceil(S.animals.reduce((s, a) => s + rate(a), 0)), dayFeed = S.animals.reduce((s, a) => s + feedDay(a.type), 0);
    const dayInc = S.animals.filter(a => isAdult(a) && !a.sick).reduce((s, a) => s + incomeDay(a.type, yieldBase(a)), 0);
    return `<p class="lead">สัตว์ ${S.animals.length}/${cap()} ตัว · ในรางอาหาร ${S.trough} ถุง (ฝูงกินวันละ ~${dayNeed} ถุง ≈ ${baht(dayFeed)}) · รายได้ที่คาด ~${baht(dayInc)}/วัน</p>
      ${hungry ? `<p class="bad">🌾 ${hungry} ตัวหิว เติมรางที่คอกก่อน</p>` : ''}${sick ? `<p class="bad">🤒 ${sick} ตัวป่วย ไม่ให้ผลผลิต</p>` : ''}
      <div class="row"><button class="btn" data-a="a40col" ${waiting ? '' : 'disabled'}>🧺 เก็บผลผลิตทั้งหมด (${waiting})</button><button class="btn ghost" data-a="a40fill">🌾 เติมรางอาหาร</button></div>
      <div class="grid">${S.animals.map(cardHtml).join('')}</div>`;
  };

  V23.add('v40_animals', () => {
    if (window.Animal40) return;
    try { if (TOOLS.feed) { TOOLS.feed.price = FEED_PRICE; TOOLS.feed.desc = 'เติมรางอาหาร: ไก่ 1 ถุง/10 วัน · แกะ 1 ถุง/วัน · หมู 1.5 ถุง/วัน · วัว 3 ถุง/วัน'; } } catch (e) { }
    window.Animal40 = { RATE, rate, status, stateText, badge, morning, collect, collectAll, need, regress, cap, isAdult, growDay, migrate, econ, cardHtml, penHtml };
    // buying: one gate (pen capacity), a clear next step, an adult animal with a fresh feed reserve
    { const _ba = buyAnimal; buyAnimal = function (type) {
        if (S.animals.length >= cap()) { toastOk(`คอกเต็ม (${S.animals.length}/${cap()}) อัปเกรดคอกที่ร้านช่างไม้ก่อน`, '🚫'); return null; }
        const n0 = S.animals.length; _ba.apply(this, arguments);
        if (S.animals.length <= n0) return null;
        migrate(); const a = S.animals[S.animals.length - 1]; a.pend = 0; a.rs = 0; a.hungry = false;
        try { announce(a); } catch (e) { console.warn('v40 announce', e); }
        return a;
      }; }
    // shop card: real numbers
    { const _en = UI.entry.bind(UI); UI.entry = function (key, shop) {
        const e = _en(key, shop); if (!e || !/^animal:/.test(String(key))) return e;
        const t = String(key).split(':')[1]; if (!ANIMALS[t]) return e;
        try { e.desc = descFor(t); e.block = S.animals.length >= cap() ? 'คอกเต็ม อัปเกรดที่ร้านช่างไม้' : ''; } catch (er) { }
        return e;
      }; }
    // buying several in one tap or through the cart must not pass the pen cap: refund what was not delivered
    { const _b = UI.H.buy; UI.H.buy = function (d) {
        const isA = /^animal:/.test(String(d.k)); if (!isA) return _b.apply(this, arguments);
        const m0 = S.money, n0 = S.animals.length, q = Math.max(1, +d.q || 1);
        const r = _b.apply(this, arguments);
        const spent = m0 - S.money, got = S.animals.length - n0;
        if (spent > 0 && got < q) { const unit = spent / q, back = Math.round(unit * (q - got)); if (back > 0) { if (window.Refund181) Refund181.give(back, 'คืนเงินสัตว์ที่ซื้อไม่ครบ'); else S.money += back; toastOk(`ซื้อได้ ${got} ตัว คืนเงิน ${baht(back)}`, '💸'); } }
        return r;
      }; }
    // phone ranch app
    try { Life6.app = penHtml; Life6.grown = a => isAdult(a); { const _d = Life6.day.bind(Life6); Life6.day = function () { for (const a of S.animals) if (!isAdult(a)) a.prod = false; }; } } catch (e) { console.warn('v40 life6', e); }
    UI.H.a40col = () => { collectAll(); };
    UI.H.a40fill = () => { fillAll(); };
    // after the whole morning (v31 disease etc.) show the right icon / waiting flag
    { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { for (const a of S.animals) { a.prod = (a.pend || 0) > 0; } } catch (e) { } return r; }; }
    // farm hands: feed the trough from the bag and bring the waiting products to the chest
    try { const _fd = Farm2.day.bind(Farm2); Farm2.day = function () {
        const r = _fd.apply(this, arguments);
        try {
          const f = Farm2.st(); if (f && f.hands > 0 && S.animals.length) {
            const n = Math.min(Math.max(0, need() - S.trough), count('feed')); if (n > 0) { takeItem('feed', n); S.trough += n; }
            let tot = 0, by = {}; for (const a of S.animals) if ((a.pend || 0) > 0) { const k = ANIMALS[a.type].prod; S.chest[k] = (S.chest[k] || 0) + a.pend; by[k] = (by[k] || 0) + a.pend; tot += a.pend; S.stats.products += a.pend; a.pend = 0; a.prod = false; }
            if (tot) Phone.msg('คนงานในฟาร์ม', `เก็บ${Object.keys(by).map(k => `${PRODUCTS[k].n} ${by[k]}`).join(' · ')}จากคอกเข้าหีบในบ้าน${n > 0 ? ` และเติมรางอาหาร ${n} ถุง` : ''}`, true);
          }
        } catch (e) { console.warn('v40 hands', e); }
        return r;
      }; } catch (e) { }
    // one pick-up spot beside the trough
    try { World.pois.push({ kind: 'act', x: -31, z: 16.8, r: 2.2, label: 'เก็บผลผลิตสัตว์ทั้งหมด', icon: '🧺', act: () => { const w = S.animals.reduce((s, a) => s + (a.pend || 0), 0); return { icon: '🧺', label: `เก็บผลผลิตสัตว์ทั้งหมด (${w})`, fn: collectAll }; } }); } catch (e) { }
    migrate();
  });
})();
