'use strict';
// ---------- v50_company: opening a company like in real life, shareholders (NPC and online players can buy in), and shares whose price follows revenue and profit ----------
// 1) TEST PERIOD (before 1 Dec 2569): every business type can be registered by yourself, no co-shareholder needed. From 1 Dec 2569 the old rule is back, only for the BIG types
//    (registered capital >= 2,000,000: solar installer, food processor, EV charging, data centre); the small types may still be founded alone.
// 2) REGISTRATION like the real process: par value and number of shares, directors, auditor; memorandum -> founding meeting -> registration -> tax ID are shown as steps.
// 3) SHAREHOLDERS: a cap table (you + outside holders). Investors (NPC friends, villagers, and players who are online) send offers for a stake: take the money as a sale of your shares or
//    let the company issue new shares (cash goes to the company). You can also offer a stake for sale at your price, buy a holder out, and dividends are shared by ownership.
// 4) MARKET SHARES: each listed index stock now has revenue / net profit / EPS that grow or shrink every quarter with its sector, the weather and the economy. The results are announced
//    against expectations (beat / miss moves the price) and the fair price follows EPS x the sector P/E. See the app "งบบริษัทจดทะเบียน". Player companies already follow their own books.
V23.add('v50_company', () => {
  if (typeof Company === 'undefined' || typeof CO_TYPES === 'undefined') return;
  const inTest = () => (typeof T39_CUTOFF !== 'undefined' ? Date.now() < T39_CUTOFF : true);
  const BIG_CAP = 2e6, isBig = t => CO_TYPES[t] && CO_TYPES[t].cap >= BIG_CAP, solo = t => inTest() || !isBig(t);
  const R = Math.random, pick = a => a[(R() * a.length) | 0], clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const toast = (t, i) => { try { UI.toast(t, i || '🏢'); } catch (e) { } };
  const val = id => (document.getElementById(id) || {}).value;
  const St = () => { const v = S.v50 = S.v50 || {}; v.seq = v.seq || 0; v.f = v.f || {}; return v; };
  const AUD = { a: { n: 'สำนักงานบัญชีสุขใจ (ผู้สอบบัญชีรับอนุญาต)', fee: 18000 }, b: { n: 'บริษัท ตรวจสอบบัญชีทุ่งทอง จำกัด', fee: 36000 }, c: { n: 'ผู้สอบบัญชีอิสระ ราคาประหยัด', fee: 12000 } };
  const PAR = [10, 100, 1000];
  const money = (n, why) => { const b = Bank.st(); b.sav += n; try { Bank2.log(why, n); } catch (e) { } };

  // ---------- registration ----------
  const PEND = {};
  const _reg = Company.register.bind(Company);
  Company.register = function (id, cap, partner, site) {
    const c = this.get(id); if (!c || c.st !== 'named') return; const T = CO_TYPES[c.type], ex = PEND[id] || {};
    let p = partner;
    if (!p) { if (solo(c.type)) p = '-'; else { toast(`${T.n} เป็นธุรกิจใหญ่ (ทุน ≥ ${baht(BIG_CAP)}) ต้องมีผู้ถือหุ้นอย่างน้อย 2 คน (คู่สมรสหรือเพื่อนสนิท 5 หัวใจขึ้นไป)`, '👥'); return; } }
    _reg(id, cap, p, site);
    if (c.st === 'reg') {
      const par = PAR.includes(+ex.par) ? +ex.par : 100, aud = AUD[ex.aud] ? ex.aud : 'a';
      c.par = par; c.shares = Math.max(1000, Math.round(cap / par)); c.aud = aud; c.dirs = [S.name || 'คุณ'].concat(p !== '-' ? [p] : []); c.h = [];
      c.mine = 1; if (p !== '-') { c.h.push({ id: ++St().seq, n: p, k: 'npc', pct: 0.1, div: 0 }); c.mine = 0.9; }
      c.steps = { memo: S.day, meet: S.day, reg: c.regDay }; if (p === '-') c.partner = '';
      try { Phone.msg('สำนักงานพัฒนาธุรกิจการค้า', `ขั้นตอนจดทะเบียน ${c.name}: ✅ หนังสือบริคณห์สนธิ (หุ้นละ ${par} ฿ จำนวน ${c.shares.toLocaleString('en-US')} หุ้น) ✅ ประชุมจัดตั้ง แต่งตั้งกรรมการ ${c.dirs.join(', ')} และผู้สอบบัญชี ${AUD[aud].n} → 🕓 นายทะเบียนรับจดทะเบียน ${RD(c.regDay)} → ขอเลขผู้เสียภาษี/ภ.พ.01 ที่แท็บบริษัท`, true); } catch (e) { }
    }
  };
  { const _h = UI.H.coreg; UI.H.coreg = function (d) { PEND[d.v] = { par: val('coPar' + d.v), aud: val('coAud' + d.v) }; return _h.apply(this, arguments); }; }
  // annual audit fee (real companies must have audited statements)
  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); try { dayTick(); } catch (e) { console.warn('v50 day', e); } return r; }; }

  // ---------- valuation / cap table ----------
  const secPE = c => { try { return ({ it: 22, sec: 22, dc: 22, solar: 9, ev: 9, cafe: 13, food: 13, logistics: 10 })[c.type] || 12; } catch (e) { return 12; } };
  function value(c) {
    if (c.listed && c.px) return Math.round(c.px * c.shares);
    const yd = Math.max(1, (S.day - 1) % 84 + 1), annual = Math.max(0, c.ytd || 0) * 84 / Math.max(28, yd), eq = Math.max(0, c.cash || 0) + (c.paid || 0) * 0.3;
    return Math.max(100000, Math.round(eq * 0.6 + annual * secPE(c)));
  }
  const holders = c => (c.h = c.h || []);
  const mine = c => (c.mine ?? 1);
  function addHolder(c, name, kind, pct) { const h = holders(c).find(x => x.n === name); if (h) h.pct += pct; else holders(c).push({ id: ++St().seq, n: name, k: kind, pct, div: 0 }); }
  const kindIcon = k => k === 'online' ? '💻' : k === 'npc' ? '🧑' : '🏦';
  const INV = ['คุณสมศักดิ์ นักลงทุนจากทุ่งทอง', 'คุณวรรณา เจ้าของโรงสี', 'คุณธนากร พ่อค้าตลาดริมทะเล', 'กองทุนหมู่บ้านสุขใจ', 'คุณอรทัย เจ้าของรีสอร์ต', 'คุณพิชัย ผู้รับเหมาภูผาใหม่'];
  function investor() {
    const online = (() => { try { return [...Net.others.values()].map(o => o.name).filter(Boolean); } catch (e) { return []; } })();
    if (online.length && R() < 0.5) return { n: pick(online), k: 'online' };
    const fr = Object.keys(S.friends || {}).filter(n => Friends.get(n) >= 2);
    if (fr.length && R() < 0.5) return { n: pick(fr), k: 'npc' };
    return { n: pick(INV), k: 'npc' };
  }
  const live = c => c.st === 'setup' || c.st === 'open';
  function dayTick() {
    for (const c of Company.list()) {
      if (!live(c)) continue; c.of = c.of || []; c.of = c.of.filter(o => S.day <= o.exp);
      // audit fee once per game year
      if (c.aud && S.day > 1 && (S.day - 1) % 84 === 0 && c.auditYear !== Math.floor((S.day - 1) / 84)) { c.auditYear = Math.floor((S.day - 1) / 84); const f = AUD[c.aud].fee; if (c.cash >= f) { c.cash -= f; Company.book(c, 0, f); c.hist.unshift(`${RD(S.day)}: จ่ายค่าสอบบัญชีประจำปี ${baht(f)}`); } else { c.rep = Math.max(0, c.rep - 5); c.hist.unshift(`${RD(S.day)}: เงินบริษัทไม่พอจ่ายค่าสอบบัญชี ${baht(f)} ชื่อเสียงลดลง`); } }
      // inbound interest: profitable, reputable companies attract investors
      const V = value(c);
      if (c.of.length < 2 && c.st === 'open' && S.day % 6 === 0 && R() < clamp(0.1 + c.rep / 400 + (c.ytd > 0 ? 0.12 : 0), 0, 0.5) && mine(c) > 0.2) {
        const who = investor(), pct = pick([0.05, 0.1, 0.15, 0.2]), mode = R() < 0.5 ? 'new' : 'sec', bid = Math.round(V * pct * (0.8 + R() * 0.5));
        if (mine(c) - pct >= 0.1) { c.of.push({ id: ++St().seq, who: who.n, kind: who.k, pct, mode, bid, exp: S.day + 10 }); try { Phone.msg(who.n, `สนใจเข้าร่วมถือหุ้น ${c.name} ${Math.round(pct * 100)}% เสนอ ${baht(bid)} (${mode === 'new' ? 'ซื้อหุ้นเพิ่มทุนใหม่ เงินเข้าบริษัท' : 'ซื้อหุ้นของคุณ เงินเข้าบัญชีคุณ'}) ดูที่แท็บผู้ถือหุ้นในแอปบริษัท`); } catch (e) { } }
      }
      // your own offer for sale: interested people answer over the next days
      if (c.out) {
        const o = c.out, who = investor(), bid = Math.round(V * o.pct * (0.75 + R() * 0.5));
        if (bid >= o.ask * 0.95 && R() < 0.6) { c.of.push({ id: ++St().seq, who: who.n, kind: who.k, pct: o.pct, mode: 'sec', bid: o.ask, exp: S.day + 10 }); c.out = null; try { Phone.msg(who.n, `ตกลงซื้อหุ้น ${c.name} ${Math.round(o.pct * 100)}% ตามราคาที่คุณเสนอ ${baht(o.ask)} · ยืนยันที่แท็บผู้ถือหุ้น`); } catch (e) { } }
        else if (R() < 0.3 && bid > o.ask * 0.6) { c.of.push({ id: ++St().seq, who: who.n, kind: who.k, pct: o.pct, mode: 'sec', bid, exp: S.day + 7 }); try { Phone.msg(who.n, `ต่อรองหุ้น ${c.name} ${Math.round(o.pct * 100)}% เหลือ ${baht(bid)}`); } catch (e) { } }
        if (c.out && S.day - o.start >= 5) { c.out = null; try { Phone.msg('นายหน้าหุ้น', `ยังไม่มีผู้ซื้อหุ้น ${c.name} ในราคาที่คุณเสนอ ลองลดราคา`, true); } catch (e) { } }
      }
    }
  }
  function accept(c, o) {
    if (!live(c) || mine(c) - o.pct < 0.1) { toast('ต้องเหลือหุ้นของคุณอย่างน้อย 10%', '⚖️'); return; }
    if (o.mode === 'new') { c.shares = Math.round(c.shares / (1 - o.pct)); for (const h of holders(c)) h.pct *= (1 - o.pct); c.mine = mine(c) * (1 - o.pct); c.cash += o.bid; c.paid = (c.paid || 0) + o.bid; Company.book(c, 0, 0); c.hist.unshift(`${RD(S.day)}: ออกหุ้นใหม่ให้ ${o.who} ${Math.round(o.pct * 100)}% ได้เงินเข้าบริษัท ${baht(o.bid)}`); }
    else { c.mine = mine(c) - o.pct; const net = Math.round(o.bid * 0.99); money(net, `ขายหุ้น ${c.name} ให้ ${o.who}`); try { Bank2.income('ขายหุ้นบริษัท', net); } catch (e) { } }
    addHolder(c, o.who, o.kind, o.mode === 'new' ? o.pct : o.pct);
    c.of = c.of.filter(x => x !== o); toast(`${o.who} เป็นผู้ถือหุ้น ${c.name} ${Math.round(o.pct * 100)}% แล้ว`, '🤝'); try { Phone.msg(o.who, `ขอบคุณที่ขายหุ้นให้ครับ/ค่ะ ยินดีร่วมงานกับ ${c.name} 🙏`, true); } catch (e) { }
  }
  function buyOut(c, h) {
    const price = Math.round(value(c) * h.pct * 1.1); if (S.money < price) { toast(`เงินสดไม่พอ ต้องใช้ ${baht(price)} (ราคา 110% ของมูลค่า)`, '💸'); return; }
    S.money -= price; try { Bank2.log(`ซื้อหุ้นคืนจาก ${h.n}`, -price); } catch (e) { } c.mine = mine(c) + h.pct; c.h = holders(c).filter(x => x !== h); toast(`ซื้อหุ้นคืนจาก ${h.n} ${baht(price)}`, '🤝');
  }
  // dividends are shared by ownership: the old button paid you everything
  { const _d = UI.H.codiv; UI.H.codiv = function (d) {
    const c = Company.get(d.v), m0 = S.money; _d.apply(this, arguments);
    if (c && S.money > m0) { const gain = S.money - m0, others = 1 - mine(c); if (others > 0.001) { const give = Math.round(gain * others); S.money -= give; for (const h of holders(c)) h.div = (h.div || 0) + Math.round(gain * h.pct / Math.max(0.01, 1 - mine(c)) * others); toast(`จ่ายปันผลให้ผู้ถือหุ้นอื่น ${baht(give)} คุณได้รับสุทธิ ${baht(gain - give)}`, '💰'); } }
  }; }

  // ---------- the shareholders tab ----------
  const T2 = { sel: 0 };
  function tabHolders() {
    const L = Company.list().filter(live); if (!L.length) return '<p class="empty">ยังไม่มีบริษัทที่จดทะเบียนเสร็จ (ผู้ถือหุ้นและนักลงทุนอยู่ที่นี่หลังจดทะเบียน)</p>';
    const c = L.find(x => x.id === T2.sel) || L[0]; T2.sel = c.id; c.of = c.of || [];
    const V = value(c), pct = x => Math.round(x * 1000) / 10 + '%';
    return `<div class="row">${L.map(x => `<button class="btn ${x.id === c.id ? '' : 'ghost'}" data-a="v50" data-v="sel|${x.id}">${CO_TYPES[x.type].i} ${esc(x.name)}</button>`).join('')}</div>
      <p class="lead">มูลค่าบริษัทโดยประมาณ <b>${baht(V)}</b> (${c.listed ? 'ราคาตลาด' : 'ประเมินจากเงินสด ทุน และกำไร ' + secPE(c) + ' เท่า'}) · หุ้นทั้งหมด ${(c.shares || 0).toLocaleString('en-US')} หุ้น · หุ้นละ ${c.par || '-'} ฿ · ผู้สอบบัญชี ${esc((AUD[c.aud] || {}).n || '-')}</p>
      <p class="dim">กรรมการ: ${esc((c.dirs || [S.name || 'คุณ']).join(', '))}</p>
      <h5>ผู้ถือหุ้น</h5><div class="grid"><div class="card"><div class="ci">🧑‍🌾</div><div class="cb"><h4>${esc(S.name || 'คุณ')} (ผู้ก่อตั้ง)</h4><p>${pct(mine(c))} · มูลค่า ${baht(Math.round(V * mine(c)))}</p></div></div>
      ${holders(c).map(h => `<div class="card"><div class="ci">${kindIcon(h.k)}</div><div class="cb"><h4>${esc(h.n)}</h4><p>${pct(h.pct)} · มูลค่า ${baht(Math.round(V * h.pct))}${h.div ? ` · รับปันผลแล้ว ${baht(h.div)}` : ''}</p><div class="row"><button class="btn ghost" data-a="v50" data-v="buy|${h.id}">ซื้อหุ้นคืน ${baht(Math.round(V * h.pct * 1.1))}</button></div></div></div>`).join('')}</div>
      <h5>คำเสนอซื้อหุ้น (${c.of.length})</h5>${c.of.length ? `<div class="grid">${c.of.map(o => `<div class="card"><div class="ci">${kindIcon(o.kind)}</div><div class="cb"><h4>${esc(o.who)}${o.kind === 'online' ? ' · ผู้เล่นออนไลน์' : ''}</h4><p>ขอซื้อ ${pct(o.pct)} เสนอ ${baht(o.bid)} (${o.mode === 'new' ? 'หุ้นใหม่ เงินเข้าบริษัท' : 'หุ้นของคุณ เงินเข้าบัญชีคุณ'}) · เทียบมูลค่า ${Math.round(o.bid / Math.max(1, V * o.pct) * 100)}% · หมดอายุ ${RD(o.exp)}</p><div class="row"><button class="btn" data-a="v50" data-v="ok|${o.id}">ตกลง</button><button class="btn ghost" data-a="v50" data-v="no|${o.id}">ปฏิเสธ</button></div></div></div>`).join('')}</div>` : '<p class="empty">ยังไม่มีคำเสนอ บริษัทที่มีกำไรและชื่อเสียงดีจะมีนักลงทุนสนใจเอง</p>'}
      <h5>เสนอขายหุ้นของคุณ</h5>${c.out ? `<p class="lead">⏳ กำลังเสนอขาย ${pct(c.out.pct)} ราคา ${baht(c.out.ask)} · รอผู้สนใจ <button class="btn ghost" data-a="v50" data-v="cancelout">ยกเลิก</button></p>` : `<div class="row"><select id="v50Pct" style="font-size:16px;padding:8px;border-radius:10px;border:1px solid #ccc">${[5, 10, 20, 30].map(p => `<option value="${p / 100}">${p}%</option>`).join('')}</select><input id="v50Ask" type="number" min="1000" step="1000" placeholder="ราคาที่ขอ (บาท รวม)" style="flex:1;font-size:16px;padding:8px;border-radius:10px;border:1px solid #ccc"><button class="btn" data-a="v50" data-v="sell">ประกาศขาย</button></div><p class="dim">ราคาตามมูลค่า 5% ≈ ${baht(Math.round(V * 0.05))} · ต้องเหลือหุ้นของคุณอย่างน้อย 10%</p>`}`;
  }
  UI.H.v50 = d => {
    const [a, x] = String(d.v || '').split('|'), c = Company.get(T2.sel) || Company.list().filter(live)[0];
    if (a === 'sel') T2.sel = +x;
    else if (c && a === 'ok') { const o = (c.of || []).find(q => q.id === +x); if (o) accept(c, o); }
    else if (c && a === 'no') { c.of = (c.of || []).filter(q => q.id !== +x); toast('ปฏิเสธคำเสนอแล้ว', '🙅'); }
    else if (c && a === 'buy') { const h = holders(c).find(q => q.id === +x); if (h) buyOut(c, h); }
    else if (c && a === 'sell') { const p = +val('v50Pct'), ask = Math.round(+val('v50Ask') || 0); if (!(ask >= 1000)) { toast('ใส่ราคาที่ต้องการขาย', 'ℹ️'); return; } if (mine(c) - p < 0.1) { toast('ต้องเหลือหุ้นของคุณอย่างน้อย 10%', '⚖️'); return; } c.out = { pct: p, ask, start: S.day }; toast('ประกาศขายหุ้นแล้ว จะมีผู้สนใจตอบกลับภายใน 5 วัน', '📢'); }
    else if (c && a === 'cancelout') c.out = null;
    UI.renderBody();
  };
  Company.open = function () { UI.open('บริษัทของฉัน (ระบบจดทะเบียนนิติบุคคล)', ['บริษัทของฉัน', 'จดทะเบียนบริษัทใหม่', 'ผู้ถือหุ้น & นักลงทุน'], t => (t === 2 ? tabHolders() : Company.html(t)), { wide: true }); };
  // the register form and the company card: real-life fields
  { const _html = Company.html.bind(Company);
    Company.html = function (tab) {
      let h = _html(tab);
      if (tab === 1) {
        h = h.replace(/<button class="btn" data-a="coreg" data-v="(\d+)">/g, (m, id) => `<select id="coPar${id}">${PAR.map(p => `<option value="${p}" ${p === 100 ? 'selected' : ''}>หุ้นละ ${p} ฿</option>`).join('')}</select><select id="coAud${id}">${Object.entries(AUD).map(([k, a]) => `<option value="${k}">ผู้สอบบัญชี: ${esc(a.n)} (${baht(a.fee)}/ปี)</option>`).join('')}</select>` + m);
        h = h.replace('ผู้ถือหุ้น 2 คนขึ้นไป ชำระค่าหุ้น 25%', inTest() ? 'ช่วงทดสอบไม่ต้องมีผู้ถือหุ้นร่วม · กำหนดมูลค่าหุ้น กรรมการ ผู้สอบบัญชี · ชำระค่าหุ้น 25%' : `ธุรกิจใหญ่ (ทุน ≥ ${baht(BIG_CAP)}) ต้องมีผู้ถือหุ้น 2 คนขึ้นไป ธุรกิจเล็กก่อตั้งคนเดียวได้ · กำหนดมูลค่าหุ้น กรรมการ ผู้สอบบัญชี · ชำระค่าหุ้น 25%`);
      } else h = h.replace('ผู้ถือหุ้น: คุณ, -', 'ผู้ถือหุ้น: คุณคนเดียว (100%)').replace('ผู้ถือหุ้น: คุณ, ', 'ผู้ถือหุ้น: คุณ, ');
      return h;
    };
  }

  // ---------- 4) listed index stocks: revenue / profit / EPS per quarter ----------
  const SEC_PE = { 'เกษตร': 11, 'ธนาคาร': 8, 'พลังงาน': 9, 'ยานยนต์': 14, 'เทคโนโลยี': 22, 'ค้าปลีก': 15, 'อาหาร': 13, 'ก่อสร้าง': 10 };
  const SH0 = { SKJ: 300, TTB: 900, PPE: 700, EVX: 250, CLD: 150, MRT: 500, FDX: 400, CON: 800 };
  // stocks added by later files (and sectors this table does not list) fall back to a sensible P/E and share count; before, they got NaN, which the save turned into null and broke the results screen
  const pe0 = X => SEC_PE[X.sec] || 12, sh = k => SH0[k] || (200 + (strHash(k) >>> 0) % 700);
  const fundOf = k => {
    const s = St(), X = STOCKS[k]; let F = s.f[k], eps = X.p / pe0(X);
    if (!F) F = s.f[k] = { p0: X.p, eps0: eps, eps, rev: Math.round(eps * sh(k) * 1e6 / 0.12), q: [], last: 0, px0: X.p };
    if (!isFinite(F.eps) || F.eps == null) F.eps = eps; if (!isFinite(F.eps0) || F.eps0 == null) F.eps0 = eps; if (!isFinite(F.rev) || F.rev == null) F.rev = Math.round(F.eps * sh(k) * 1e6 / 0.12);   // repair figures an older version saved as null
    if (!isFinite(F.p0) || F.p0 == null) F.p0 = X.p; if (!isFinite(F.px0) || F.px0 == null) F.px0 = X.p; if (!Array.isArray(F.q)) F.q = [];
    return F;
  };
  const sectorMove = sec => { try { const ks = Object.keys(STOCKS).filter(k => STOCKS[k].sec === sec), s = Stock.st(); const r = ks.map(k => { const h = s.hist[k] || []; return h.length > 6 ? h[h.length - 1] / h[h.length - 6] - 1 : 0; }); return r.reduce((a, b) => a + b, 0) / Math.max(1, r.length); } catch (e) { return 0; } };
  function quarter() {
    const news = (t, sec, eff) => { try { const m = Mkt24 && null; Phone.msg('ข่าวตลาดหลักทรัพย์', t + (eff ? ` (${eff})` : ''), true); } catch (e) { } };
    for (const k of Object.keys(STOCKS)) {
      const X = STOCKS[k], F = fundOf(k); if (F.last === S.day) continue; F.last = S.day;
      const w = S.weather && S.weather.type, wx = X.sec === 'เกษตร' ? (w === 'storm' ? -0.03 : w === 'rain' ? 0.01 : 0) : 0;
      const g = clamp(sectorMove(X.sec) * 0.5 + wx + (R() - 0.48) * 0.07 + 0.006, -0.18, 0.2), exp = F.eps * 1.012, eps1 = Math.max(0.01, F.eps * (1 + g));
      const surprise = clamp((eps1 - exp) / Math.max(0.01, exp), -0.5, 0.5), jump = clamp(surprise * 0.7, -0.12, 0.12), rev1 = Math.round(F.rev * (1 + g * 0.8)), ni = Math.round(eps1 * sh(k) * 1e6 / 4 * 4);
      F.q.push({ d: S.day, rev: rev1, ni, eps: +eps1.toFixed(3), g: +g.toFixed(3), s: +surprise.toFixed(3) }); if (F.q.length > 8) F.q.shift();
      const yoy = F.q.length > 3 ? eps1 / F.q[F.q.length - 4].eps - 1 : g;
      F.rev = rev1; F.eps = eps1; X.p = Math.max(1, +(F.p0 * (eps1 / F.eps0) ** 0.9).toFixed(2));            // the price the stock is pulled toward = EPS x P/E
      try { const s = Stock.st(); s.px[k] = Math.max(0.5, +(s.px[k] * (1 + jump)).toFixed(2)); if (s.hist[k]) s.hist[k][s.hist[k].length - 1] = s.px[k]; } catch (e) { }
      Phone.msg('ข่าวตลาดหลักทรัพย์', `${X.n} ประกาศงบไตรมาส รายได้ ${(rev1 / 1e6).toFixed(0)} ล้านบาท (${g >= 0 ? '+' : ''}${(g * 100).toFixed(1)}%) กำไรสุทธิ ${(ni / 1e6).toFixed(0)} ล้านบาท EPS ${eps1.toFixed(2)} ฿ ${surprise >= 0.02 ? 'ดีกว่าคาด 📈' : surprise <= -0.02 ? 'ต่ำกว่าคาด 📉' : 'ใกล้เคียงคาด'} ราคาหุ้น ${jump >= 0 ? '+' : ''}${(jump * 100).toFixed(1)}%`, true);
    }
  }
  { const _sd = Stock.day.bind(Stock); Stock.day = function () { _sd(); try { if ((S.day - 1) % 21 === 0) quarter(); } catch (e) { console.warn('v50 quarter', e); } }; }
  function reportHtml() {
    const rows = Object.keys(STOCKS).map(k => { const X = STOCKS[k], F = fundOf(k), q = F.q[F.q.length - 1], px = Stock.st().px[k], pe = F.eps ? px / F.eps : 0; return `<tr><td>${esc(X.n)}<br><small class="dim">${X.sec}</small></td><td>${q ? (q.rev / 1e6).toFixed(0) : '-'}</td><td>${q ? (q.ni / 1e6).toFixed(0) : '-'}</td><td>${F.eps.toFixed(2)}</td><td>${px.toFixed(2)}</td><td>${pe.toFixed(1)}</td><td>${q ? (q.g >= 0 ? '+' : '') + (q.g * 100).toFixed(1) + '%' : '-'}</td></tr>`; }).join('');
    const own = Company.list().filter(c => c.listed).map(c => `<tr><td>${esc(c.name)}</td><td colspan="2">กำไรปีนี้ ${baht(Math.round(c.ytd))}</td><td>-</td><td>${(c.px || 0).toFixed(2)}</td><td>-</td><td>งบจริงของบริษัทคุณ</td></tr>`).join('');
    return `<p class="lead">ผลประกอบการล่าสุดของบริษัทจดทะเบียน (ล้านบาท) · ราคาหุ้นเคลื่อนตามกำไรต่อหุ้น (EPS) × P/E ของกลุ่มอุตสาหกรรม ประกาศงบทุก 21 วัน</p><table class="tbl"><tr><th>บริษัท</th><th>รายได้</th><th>กำไรสุทธิ</th><th>EPS</th><th>ราคา</th><th>P/E</th><th>โต/ลด</th></tr>${rows}${own}</table><p class="dim">ผลดีกว่าที่คาดราคาขึ้นทันที ผลต่ำกว่าคาดราคาลง · สภาพอากาศกระทบหุ้นเกษตร · ความเคลื่อนไหวของกลุ่มส่งผลต่อรายได้ไตรมาสถัดไป</p>`;
  }
  if (!APPS.some(a => a.id === 'fund50')) APPS.splice(Math.min(APPS.length, 16), 0, { id: 'fund50', i: '📊', n: 'งบบริษัทจดทะเบียน' });
  Phone.apps.fund50 = () => { setTimeout(() => { Phone.app = null; UI.close(); UI.open('📊 งบบริษัทจดทะเบียน', null, reportHtml, { wide: true }); }, 0); return ''; };
  try { if (typeof APP_GROUPS !== 'undefined') { const g = APP_GROUPS.find(x => /การเงิน|ธนาคาร|หุ้น/.test(x[0])) || APP_GROUPS[0]; if (g && !g[1].includes('fund50')) g[1].push('fund50'); } } catch (e) { }
  for (const k of Object.keys(STOCKS)) fundOf(k);
  window.Co50 = { solo, isBig, value, accept, tabHolders, reportHtml, quarter, fundOf, inTest };
});
