'use strict';
// ---------- v36_shop: the computer at home becomes a real online mall — EVERYTHING sold anywhere in the game can be ordered:
// search / category / sort, cart, delivery fee by size and weight, standard (next morning) or express delivery, pay from wallet or savings,
// order tracking and returns within 7 days. Needs electricity, internet and a working computer ----------
V23.add('v36_shop', () => {
  const st = () => { const s = S.v36o = S.v36o || {}; s.cart = s.cart || {}; s.orders = s.orders || []; s.n = s.n || 0; s.stat = s.stat || { orders: 0, spent: 0, returned: 0 }; return s; };
  const now = () => S.day * 1440 + S.time;
  const log = (t, n) => { try { Bank2.log(t, n); } catch (e) { } };
  const msg = (t, important) => { try { Phone.msg('สุขใจมอลล์ ออนไลน์', t, !!important); } catch (e) { } };
  const GROUPS = [['all', '🛍️ ทั้งหมด'], ['farm', '🌱 ฟาร์ม/เกษตร'], ['food', '🍜 อาหาร/เครื่องดื่ม'], ['home', '🛋️ บ้าน/ของแต่งบ้าน'], ['pc', '💻 คอมพิวเตอร์/อุปกรณ์'], ['it', '🔐 ไอที/ความปลอดภัย/พลังงาน'], ['wear', '👗 แฟชั่น/ของใช้'], ['veh', '🚗 ยานพาหนะ'], ['animal', '🐄 สัตว์เลี้ยง/ปศุสัตว์'], ['misc', '🎁 อื่นๆ']];
  const FARM_TOOL = /feed|fert|sprink|seed|pest|water|hoe|net|rod|bait|soil|mulch|ladybug|sandbag|v_(seed|bird|rabbit|grow|farm|work|rain|feed|mulch|water)/;
  const groupOf = (kind, id, name) => {
    if (kind === 'seed') return 'farm'; if (kind === 'food') return 'food'; if (kind === 'furn') return 'home'; if (kind === 'car') return 'veh'; if (kind === 'animal') return 'animal';
    if (kind === 'pc' || kind === 'pcset') return 'pc'; if (kind === 'sec' || kind === 'v23e' || kind === 'fut') return 'it';
    if (kind === 'tool') { if (/^wear_/.test(id)) return 'wear'; if (FARM_TOOL.test(id)) return 'farm'; if (/^(sec_|it_|cctv|gps|router|usb|power|e_)/.test(id) || /ไอที|เราเตอร์|สายแลน|กล้อง/.test(name)) return 'it'; if (/^(book|comic|magazine|novel)/.test(id)) return 'misc'; return /^v_/.test(id) ? 'wear' : 'misc'; }
    return 'misc';
  };
  const SKIP = new Set(['up', 'pet', 'pw']);
  // ---- the catalogue: every shop list plus every registry (seeds, tools, foods, furniture, cars, PC parts) ----
  let CATALOG = null, built = 0;
  const catalog = () => {
    if (CATALOG && built === Object.keys(SHOPS).length) return CATALOG;
    const keys = new Set();
    for (const sid in SHOPS) { const sh = SHOPS[sid]; if (!sh || !sh.tabs) continue; for (const t of sh.tabs) for (const k of t.items || []) keys.add(k); }
    try { for (const k in CROPS) keys.add('seed:' + k); } catch (e) { }
    try { for (const k in TOOLS) keys.add('tool:' + k); } catch (e) { }
    try { for (const k in FOODS) keys.add('food:' + k); } catch (e) { }
    try { for (const k in FURN) keys.add('furn:' + k); } catch (e) { }
    try { for (const k in CARS) keys.add('car:' + k); } catch (e) { }
    try { for (const k in ANIMALS) keys.add('animal:' + k); } catch (e) { }
    try { for (const k in PC_PARTS) { if (!/^(cpu|mb|ram|gpu|ssd|psu|case|cool|mon)_/.test(k) && k !== 'kb') keys.add('pc:' + k); else if (!/^(cpu|mb|ram|gpu|ssd|psu|case|cool|mon)_/.test(k)) keys.add('pc:' + k); } } catch (e) { }
    const out = [];
    for (const k of keys) {
      const [kind, id] = k.split(':'); if (SKIP.has(kind) || /^pcc$/.test(kind)) continue;
      let e = null; try { e = UI.entry(k, 'online'); } catch (er) { e = null; }
      if (!e || !e.name || !(e.price > 0)) continue;
      out.push({ k, kind, id, name: String(e.name), icon: e.icon || '📦', price: e.price, g: groupOf(kind, id, e.name) });
    }
    built = Object.keys(SHOPS).length; return (CATALOG = out);
  };
  const live = k => { try { return UI.entry(k, 'online'); } catch (e) { return null; } };
  const saleF = () => { try { return typeof RL !== 'undefined' && RL.on && RL.on('sale') ? 0.7 : 1; } catch (e) { return 1; } };
  const unit = e => Math.max(1, Math.round(e.price * 1.1 * saleF()));
  const weight = (it, price) => ({ farm: 6, food: 4, home: 220, pc: price > 20000 ? 120 : price > 3000 ? 60 : 25, it: 40, wear: 12, veh: 1500, animal: 450, misc: 15 }[it.g] || 15);

  // ---- can the computer be used? ----
  const netOk = () => { try { return ISP.speed() > 0; } catch (e) { return false; } };
  const powerOk = () => { try { const out = S.powerOff || (Power.st && Power.st().out > 0); return !out || (window.PCAcc176 ? PCAcc176.powerOk() : (typeof PC !== 'undefined' && PC.has('ups'))) || !!(S.pw && S.pw.soc > 0.5); } catch (e) { return true; } };
  const pcOk = () => { if (window.PC39) return PC39.usable(); const pcs = S.pcs || []; if (!pcs.length) return true; return pcs.some(c => c.os !== null && !c.broken && !c.infected); };
  const why = () => {
    const l = [];
    if (!powerOk()) l.push('⚡ ไฟฟ้าดับ — ใช้งานไม่ได้ (มี UPS / แบตเตอรี่สำรองจะใช้ได้ต่อ)');
    if (!netOk()) l.push('📶 ไม่มีอินเทอร์เน็ต (ยังไม่ได้ติดตั้ง, ถูกระงับ หรืออินเทอร์เน็ตล่ม) — ดูที่แอป 📶 อินเทอร์เน็ต');
    if (!pcOk()) l.push(window.PC39 ? PC39.why() : '🖥️ คอมพิวเตอร์ยังใช้ไม่ได้ (ยังไม่ลง Windows/Linux, เครื่องเสีย หรือติดมัลแวร์) — แก้ที่แอป 🖥️ ศูนย์ไอที');
    return l;
  };

  // ---- UI state (kept in memory only) ----
  const ui = { q: '', g: 'all', sort: 'pop', page: 0, per: 20, pay: 'cash', ship: 'std', shop: '', cat: -1 };
  const sorted = list => {
    const a = list.slice();
    if (ui.sort === 'lo') a.sort((x, y) => x.price - y.price); else if (ui.sort === 'hi') a.sort((x, y) => y.price - x.price); else if (ui.sort === 'az') a.sort((x, y) => x.name.localeCompare(y.name, 'th'));
    return a;
  };
  // search works on the name, the description and the group; every word typed must match
  const norm = t => String(t || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const GN = Object.fromEntries(GROUPS);
  const textOf = it => { if (it.t) return it.t; let d = ''; try { const e = live(it.k); d = e ? String(e.desc || '') : ''; } catch (e) { } return (it.t = norm(it.name + ' ' + d + ' ' + (GN[it.g] || ''))); };
  // the shops of the game, each with its own categories (= the tabs of the shop window); merged shops share one list
  const shopList = () => { const seen = new Set(), out = []; for (const id in SHOPS) { const sh = SHOPS[id]; if (!sh || !sh.tabs || !sh.tabs.length || id === 'online' || seen.has(sh.tabs)) continue; if (!sh.tabs.some(t => (t.items || []).length)) continue; seen.add(sh.tabs); out.push([id, sh.n]); } return out; };
  const shopMap = id => { const m = new Map(); const sh = SHOPS[id]; if (sh && sh.tabs) sh.tabs.forEach((t, ci) => (t.items || []).forEach(k => { if (!m.has(k)) m.set(k, ci); })); return m; };
  const filtered = () => {
    const words = norm(ui.q).split(' ').filter(Boolean), c = catalog(), km = ui.shop && SHOPS[ui.shop] ? shopMap(ui.shop) : null;
    return sorted(c.filter(it => (ui.g === 'all' || it.g === ui.g) && (!km || (km.has(it.k) && (ui.cat < 0 || km.get(it.k) === ui.cat))) && (!words.length || words.every(w => textOf(it).includes(w)))));
  };
  const cartLines = () => {
    const s = st(), lines = [];
    for (const k in s.cart) { const q = s.cart[k]; if (!(q > 0)) continue; const e = live(k); if (!e) continue; const [kind, id] = k.split(':'); lines.push({ k, q, e, u: unit(e), g: groupOf(kind, id, e.name), it: { g: groupOf(kind, id, e.name) } }); }
    return lines;
  };
  const totals = lines => {
    const sub = lines.reduce((a, l) => a + l.u * l.q, 0), veh = lines.some(l => l.g === 'veh' || l.g === 'animal' || l.g === 'home');
    const foodOnly = lines.length && lines.every(l => l.g === 'food');
    let fee = lines.length ? 35 + lines.reduce((a, l) => a + weight(l.it, l.u) * l.q, 0) : 0;
    if (!veh && sub >= 2000) fee = 0; else if (!veh && sub >= 1000) fee = Math.round(fee * 0.5);
    if (veh) fee = Math.max(fee, 120);
    const express = ui.ship === 'exp' ? (foodOnly ? 0 : 120) : 0;
    return { sub, fee, express, foodOnly, veh, total: sub + fee + express };
  };

  const results = () => {
    const list = filtered(), pages = Math.max(1, Math.ceil(list.length / ui.per)); if (ui.page >= pages) ui.page = pages - 1;
    const slice = list.slice(ui.page * ui.per, ui.page * ui.per + ui.per), cnt = Object.values(st().cart).reduce((a, b) => a + (b > 0 ? b : 0), 0);
    return `<div class="row"><span class="dim" style="align-self:center">พบ ${U.fmt(list.length)} รายการ${ui.q.trim() ? ' สำหรับ “' + esc(ui.q.trim()) + '”' : ''} · ตะกร้า ${cnt} ชิ้น</span></div>
      <p class="lead">${rate()}</p>
      <div class="grid">${slice.map(it => { const e = live(it.k); if (!e) return ''; const u = unit(e); return `<div class="card"><div class="ci">${it.icon}</div><div class="cb"><h4>${esc(e.name)}${e.own ? `<small> มี ${e.own}</small>` : ''}</h4><p class="dim">${esc(String(e.desc || '').slice(0, 110))}</p><div class="row">${e.block ? `<button class="btn" disabled>${esc(e.block)}</button>` : `<button class="btn" data-a="m36add" data-k="${it.k}" data-q="1">🧺 ${baht(u)}</button>${e.multi ? `<button class="btn ghost" data-a="m36add" data-k="${it.k}" data-q="5">×5</button>` : ''}`}</div></div></div>`; }).join('') || '<p class="empty">ไม่พบสินค้า ลองคำค้นอื่น หรือเลือก “ทุกร้านในเกม”</p>'}</div>
      <div class="row end"><button class="btn ghost" data-a="m36page" data-v="-1" ${ui.page <= 0 ? 'disabled' : ''}>‹ ก่อนหน้า</button><span class="dim" style="align-self:center">หน้า ${ui.page + 1}/${pages}</span><button class="btn ghost" data-a="m36page" data-v="1" ${ui.page >= pages - 1 ? 'disabled' : ''}>ถัดไป ›</button></div>`;
  };
  const top = () => {
    const sh = ui.shop && SHOPS[ui.shop] ? SHOPS[ui.shop] : null;
    const chips = sh ? `<div class="row" style="flex-wrap:wrap"><button class="btn ${ui.cat < 0 ? '' : 'ghost'}" data-a="m36cat" data-v="-1">ทุกหมวดของร้านนี้</button>${sh.tabs.map((t, ci) => `<button class="btn ${ui.cat === ci ? '' : 'ghost'}" data-a="m36cat" data-v="${ci}">${esc(String(t.n).replace(/\s*\(\d+\)\s*$/, ""))}</button>`).join('')}</div>` : `<div class="row" style="flex-wrap:wrap">${GROUPS.map(([g, n]) => `<button class="btn ${ui.g === g ? '' : 'ghost'}" data-a="m36g" data-v="${g}">${n}</button>`).join('')}</div>`;
    return `<div class="row"><input id="m36q" type="search" value="${esc(ui.q)}" placeholder="🔎 พิมพ์ค้นหาสินค้า เช่น ข้าว ปุ๋ย โซฟา…" autocomplete="off" oninput="UI.H.m36live()" onkeydown="if(event.key==='Enter'){this.blur()}" style="flex:1;min-width:150px;padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.25);background:rgba(0,0,0,.25);color:inherit"><button class="btn ghost" data-a="m36clearq">✕ ล้างคำค้น</button></div>
      <div class="row"><span class="dim" style="align-self:center">🏪 เลือกร้าน</span><select id="m36shop" onchange="UI.H.m36shop({v:this.value})" style="flex:1;min-width:180px;padding:9px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.25);background:#1d3a2a;color:#fff"><option value="">ทุกร้านในเกม (${U.fmt(catalog().length)} รายการ)</option>${shopList().map(([id, n]) => `<option value="${id}" ${ui.shop === id ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>
      ${chips}
      <div class="row">${[['pop', 'แนะนำ'], ['lo', 'ราคาต่ำ→สูง'], ['hi', 'ราคาสูง→ต่ำ'], ['az', 'ชื่อ ก-ฮ']].map(([v, n]) => `<button class="btn ${ui.sort === v ? '' : 'ghost'}" data-a="m36sort" data-v="${v}">${n}</button>`).join('')}</div>`;
  };
  const rate = () => `<span class="dim">ราคาออนไลน์ +10% จากหน้าร้าน${saleF() < 1 ? ' · 🔥 ลดราคาพิเศษ 30%' : ''} · ส่งฟรีเมื่อซื้อครบ 2,000 ฿ (ยกเว้นสินค้าชิ้นใหญ่/รถ/สัตว์)</span>`;
  const render = tab => {
    const bad = why();
    if (bad.length) return `<p class="lead bad">💻 ใช้ช้อปออนไลน์ไม่ได้ตอนนี้</p><ul class="lead">${bad.map(b => `<li>${b}</li>`).join('')}</ul>${window.PC39 ? PC39.panelHtml() : ''}`;
    if (tab === 0) return top() + `<div id="m36res">${results()}</div>`;
    if (tab === 1) {
      const lines = cartLines(), t = totals(lines), s = st(), blocked = lines.find(l => l.e.block);
      if (!lines.length) return '<p class="empty">ตะกร้าว่าง — เลือกสินค้าที่แท็บ "สินค้า"</p>';
      const sav = (S.bank && S.bank.sav) || 0, idBad = lines.some(l => l.g === 'veh') && !(window.Gov24 && Gov24.has && Gov24.has('idcard'));
      return `<div class="grid">${lines.map(l => `<div class="card"><div class="ci">${l.e.icon}</div><div class="cb"><h4>${esc(l.e.name)}</h4><p class="dim">${baht(l.u)} × ${l.q} = ${baht(l.u * l.q)}${l.e.block ? ' · ⚠️ ' + esc(l.e.block) : ''}</p>
        <div class="row"><button class="btn ghost" data-a="m36qty" data-k="${l.k}" data-d="-1">−</button><button class="btn ghost" data-a="m36qty" data-k="${l.k}" data-d="1">+</button><button class="btn ghost" data-a="m36qty" data-k="${l.k}" data-d="0">เอาออก</button></div></div></div>`).join('')}</div>
        <h5>การจัดส่ง</h5><div class="row"><button class="btn ${ui.ship === 'std' ? '' : 'ghost'}" data-a="m36ship" data-v="std">📦 ส่งปกติ — พรุ่งนี้เช้า (06:00)</button><button class="btn ${ui.ship === 'exp' ? '' : 'ghost'}" data-a="m36ship" data-v="exp">⚡ ส่งด่วน ${t.foodOnly ? '(ไรเดอร์ 1 ชม.)' : '— ภายใน 3 ชม. (+120 ฿)'}</button></div>
        <h5>ชำระเงิน</h5>${window.Bank49 ? '<p class="dim">กด "สั่งซื้อ" แล้วเลือกวิธีจ่าย: เงินสด · โอนผ่านแอป · พร้อมเพย์ · เช็ค · แคชเชียร์เช็ค · เบิกที่ธนาคาร (ยอดตั้งแต่ 100,000 ฿ ต้องจ่ายด้วยเช็คหรือเบิกที่ธนาคาร) ระบบกรอกยอดและชื่อผู้รับให้เอง</p>' : ''}<div class="row" ${window.Bank49 ? 'hidden' : ''}><button class="btn ${ui.pay === 'cash' ? '' : 'ghost'}" data-a="m36pay" data-v="cash">💵 เงินสด/กระเป๋า (${baht(S.money)})</button><button class="btn ${ui.pay === 'bank' ? '' : 'ghost'}" data-a="m36pay" data-v="bank">🏦 หักบัญชีออมทรัพย์ (${baht(sav)})</button></div>
        <p class="lead">สินค้า ${baht(t.sub)} · ค่าจัดส่ง ${baht(t.fee)}${t.express ? ' · ส่งด่วน ' + baht(t.express) : ''}<br><b>รวมทั้งหมด ${baht(t.total)}</b>${idBad ? '<br><b class="bad">ซื้อรถต้องมีบัตรประชาชนที่ยังไม่หมดอายุ (ไปทำที่ศูนย์ราชการ)</b>' : ''}</p>
        <div class="row end"><button class="btn ghost" data-a="m36clear">ล้างตะกร้า</button><button class="btn" data-a="m36checkout" ${blocked || idBad || (!window.Bank49 && (ui.pay === 'cash' ? S.money : sav) < t.total) ? 'disabled' : ''}>✅ สั่งซื้อ ${baht(t.total)}</button></div>`;
    }
    const os = st().orders.slice().reverse().slice(0, 20);
    if (!os.length) return '<p class="empty">ยังไม่มีคำสั่งซื้อ</p>';
    const stat = o => o.status === 'ret' ? '↩️ คืนสินค้าแล้ว' : o.status === 'done' ? `✅ ส่งสำเร็จ ${RD(o.dday)}` : o.ship === 'exp' ? '⚡ กำลังจัดส่งด่วน' : now() < (o.day + 1) * 1440 ? '🏭 กำลังเตรียมสินค้า' : '🚚 กำลังนำส่ง ถึงก่อน 12:00';
    return `<p class="lead">คืนสินค้าได้ภายใน 7 วันหลังได้รับ (คืนเงิน 90% ไม่รวมค่าจัดส่ง · อาหาร เมล็ดพันธุ์ และของที่ติดตั้งแล้วคืนไม่ได้)</p><div class="grid">${os.map(o => `<div class="card"><div class="ci">📦</div><div class="cb"><h4>คำสั่งซื้อ #${o.id} · ${baht(o.total)}</h4><p class="dim">${esc(stat(o))} · สั่ง${RD(o.day)} · ${o.items.length} รายการ · ${o.pay === 'bank' ? 'หักบัญชี' : 'เงินสด'}</p><p class="dim">${o.items.slice(0, 4).map(i => esc(i.name) + ' ×' + i.q).join(', ')}${o.items.length > 4 ? ' …' : ''}</p>
      ${o.status === 'done' && S.day - o.dday <= 7 && o.items.some(i => i.ret) ? `<button class="btn ghost" data-a="m36ret" data-id="${o.id}">↩️ คืนสินค้า</button>` : ''}</div></div>`).join('')}</div>`;
  };
  const open = (tab = 0, opt) => {
    if (opt) { ui.shop = opt.shop || ''; ui.cat = opt.cat == null ? -1 : +opt.cat; ui.q = opt.q || ''; ui.g = 'all'; ui.page = 0; }
    if (typeof Cut !== 'undefined' && Cut.on) return;
    UI.open('💻 สุขใจมอลล์ ออนไลน์ — สั่งได้ทุกอย่าง ส่งถึงบ้าน', ['🛍️ สินค้า', `🧺 ตะกร้า (${Object.values(st().cart).filter(q => q > 0).length})`, '📦 คำสั่งซื้อ'], render, { wide: true, tab });
  };

  // ---- checkout & delivery ----
  const checkout = () => {
    const lines = cartLines(); if (!lines.length) return; const bad = why(); if (bad.length) { UI.toast('ใช้ช้อปออนไลน์ไม่ได้ตอนนี้', '💻'); return; }
    if (lines.some(l => l.e.block)) { UI.toast('มีสินค้าที่สั่งไม่ได้ในตะกร้า', '⚠️'); return; }
    if (lines.some(l => l.g === 'veh') && !(window.Gov24 && Gov24.has && Gov24.has('idcard'))) { UI.toast('ซื้อรถต้องมีบัตรประชาชนที่ยังไม่หมดอายุ', '🪪'); return; }
    const t = totals(lines);
    const finish = () => {
    if (window.Bank49) { if (S.money < t.total) { UI.toast('เงินไม่พอ', '💸'); return; } S.money -= t.total; log('ช้อปออนไลน์', -t.total); }
    else if (ui.pay === 'bank') { const b = S.bank; if (!b || b.sav < t.total) { UI.toast('เงินในบัญชีออมทรัพย์ไม่พอ', '🏦'); return; } b.sav -= t.total; log('ช้อปออนไลน์ (หักบัญชี)', -t.total); }
    else { if (S.money < t.total) { UI.toast('เงินไม่พอ', '💸'); return; } S.money -= t.total; log('ช้อปออนไลน์', -t.total); }
    const s = st(), id = ++s.n, due = ui.ship === 'exp' ? now() + (t.foodOnly ? 60 : 180) : (S.day + 1) * 1440 + 360;
    s.orders.push({ id, day: S.day, due, ship: ui.ship, pay: ui.pay, total: t.total, fee: t.fee + t.express, status: 'new', items: lines.map(l => ({ k: l.k, q: l.q, name: l.e.name, u: l.u })) });
    if (s.orders.length > 60) s.orders.splice(0, s.orders.length - 60);
    s.cart = {}; s.stat.orders++; s.stat.spent += t.total; S.stats.bought = (S.stats.bought || 0) + 1; Sfx.coin();
    UI.toast(`สั่งซื้อแล้ว #${id} ${baht(t.total)} · ${ui.ship === 'exp' ? 'ส่งด่วนถึงบ้านใน ' + (t.foodOnly ? '1' : '3') + ' ชม.' : 'ส่งถึงบ้านพรุ่งนี้เช้า'}`, '📦'); saveGame(true);
    UI.cur.tab = 2; UI.renderBody();
    };
    if (window.Bank49 && Bank49.ask && !Pay49.busy) { if (t.total <= 300 && !Bank49.V().ask && Pay49.cash() >= t.total) return finish(); return Bank49.ask({ amount: t.total, label: `ช้อปออนไลน์ ${lines.length} รายการ (${ui.ship === 'exp' ? 'ส่งด่วน' : 'ส่งปกติ'})`, payee: 'สุขใจมอลล์ ออนไลน์', fn: finish }); }
    return finish();
  };
  const deliver = o => {
    const tt = UI.toast, ok = [], fail = []; let extra = 0;
    UI.toast = () => { };
    const acq0 = G.acq; G.acq = 'o';                                 // v208: everything delivered from an online order goes to the bag's "ordered online" pile
    try {
      for (const it of o.items) {
        const e = live(it.k); if (!e || e.block) { fail.push(it); continue; }
        const before = Object.assign({}, S.inv), moneyB = S.money, car = it.k.startsWith('car:'), nb = S.cars ? S.cars.length : 0, isAn = it.k.startsWith('animal:'), na = S.animals ? S.animals.length : 0;
        try { for (let i = 0; i < (e.multi ? 1 : it.q); i++) e.buy(e.multi ? it.q : 1); } catch (er) { console.warn('v36 deliver', it.k, er); fail.push(it); continue; }
        if (car && S.cars.length === nb) { fail.push(it); continue; }
        if (isAn) { const got = S.animals.length - na; if (got <= 0) { fail.push(it); continue; } if (got < it.q) { extra += it.u * (it.q - got); it.q = got; } }   // pen full: only what fits is delivered, the rest is refunded
        S.money = moneyB;                                            // some buy() callbacks charge on their own; the order is already paid
        const d = {}; for (const k in S.inv) { const dv = (S.inv[k] || 0) - (before[k] || 0); if (dv > 0) d[k] = dv; }
        it.inv = d; it.ret = !!Object.keys(d).length && !/^(food|seed):/.test(it.k) && !/^food_|^seed_/.test(Object.keys(d)[0]);
        ok.push(it);
      }
    } finally { UI.toast = tt; G.acq = acq0; }
    if (fail.length || extra) { const refund = fail.reduce((a, it) => a + it.u * it.q, 0) + extra; if (o.pay === 'bank' && S.bank) S.bank.sav += refund; else if (window.Refund181) Refund181.give(refund, 'คืนเงินสินค้าที่ส่งไม่ได้ #' + o.id); else S.money += refund; log('คืนเงินสินค้าที่ส่งไม่ได้', refund); msg(`คำสั่งซื้อ #${o.id}: ส่งไม่ได้ ${fail.length} รายการ (${fail.map(i => i.name).join(', ')}) คืนเงิน ${baht(refund)} แล้ว`, true); }
    o.items = o.items.filter(i => !fail.includes(i)); o.status = 'done'; o.dday = S.day;
    if (!o.items.length) o.status = 'ret';
    msg(`พัสดุคำสั่งซื้อ #${o.id} ส่งถึงบ้านแล้ว ${ok.length} รายการ (ดูของในกระเป๋า) ขอบคุณที่ใช้บริการ`, false);
    try { UI.hotbar(); } catch (e) { }
  };
  const proc = () => { const s = st(); for (const o of s.orders) if (o.status === 'new' && o.due <= now()) { try { deliver(o); } catch (e) { console.warn('v36 order', e); o.status = 'done'; o.dday = S.day; } } };
  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { proc(); } catch (e) { console.warn('v36 shop day', e); } return r; }; }
  { const _sh = Smart.hour; Smart.hour = function () { const r = _sh.apply(this, arguments); try { if (st().orders.some(o => o.status === 'new')) proc(); } catch (e) { } return r; }; }

  const returnOrder = id => {
    const o = st().orders.find(x => x.id === +id); if (!o || o.status !== 'done' || S.day - o.dday > 7) return;
    let refund = 0, n = 0;
    for (const it of o.items) { if (!it.ret || !it.inv) continue; if (!Object.keys(it.inv).every(k => (S.inv[k] || 0) >= it.inv[k])) continue; for (const k in it.inv) takeItem(k, it.inv[k]); refund += Math.round(it.u * it.q); it.ret = false; it.returned = true; n++; }
    if (!n) { UI.toast('ไม่มีสินค้าที่คืนได้ (ของอาจถูกใช้ไปแล้ว)', '↩️'); return; }
    if (window.Refund181) Refund181.give(refund, 'คืนสินค้าออนไลน์ #' + o.id); else S.money += refund; log('คืนสินค้าออนไลน์ #' + o.id, refund); st().stat.returned += refund; UI.toast(`คืนสินค้า ${n} รายการ ได้เงินคืน ${baht(refund)}`, '↩️'); msg(`คืนสินค้าคำสั่งซื้อ #${o.id} สำเร็จ โอนเงินคืน ${baht(refund)} (หักค่าดำเนินการ 10%)`, false);
    if (o.items.length && o.items.every(i => i.returned)) o.status = 'ret';
  };

  Object.assign(UI.H, {
    m36search: () => { const el = document.getElementById('m36q'); ui.q = el ? el.value : ''; ui.page = 0; },
    m36live: () => { const el = document.getElementById('m36q'); ui.q = el ? el.value : ''; ui.page = 0; const r = document.getElementById('m36res'); if (r) r.innerHTML = results(); },
    m36clearq: () => { ui.q = ''; ui.page = 0; },
    m36shop: d => { ui.shop = d.v || ''; ui.cat = -1; ui.g = 'all'; ui.page = 0; if (UI.cur && UI.cur.render) UI.renderBody(); },
    m36cat: d => { ui.cat = +d.v; ui.page = 0; },
    m36g: d => { ui.g = d.v; ui.page = 0; }, m36sort: d => { ui.sort = d.v; ui.page = 0; }, m36page: d => { ui.page = Math.max(0, ui.page + +d.v); },
    m36add: d => { const s = st(), e = live(d.k); if (!e || e.block) return; s.cart[d.k] = Math.min(99, (s.cart[d.k] || 0) + (+d.q || 1)); Sfx.click(); UI.toast(`เพิ่ม ${e.name} ในตะกร้า`, '🧺'); if (UI.cur && UI.cur.tabs) UI.cur.tabs[1] = `🧺 ตะกร้า (${Object.values(s.cart).filter(q => q > 0).length})`; },
    m36qty: d => { const s = st(), q = +d.d; if (!q) delete s.cart[d.k]; else { s.cart[d.k] = (s.cart[d.k] || 0) + q; if (s.cart[d.k] <= 0) delete s.cart[d.k]; } },
    m36clear: () => { st().cart = {}; }, m36ship: d => { ui.ship = d.v; }, m36pay: d => { ui.pay = d.v; }, m36checkout: () => checkout(), m36ret: d => returnOrder(d.id),
  });
  window.Mall36 = { open, catalog, st, proc, why, totals: () => totals(cartLines()), ui };
  st();
});
