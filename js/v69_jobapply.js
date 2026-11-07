// v69_jobapply.js: the job kiosk in front of each workplace is that workplace's own application desk
//  - its sign and prompt carry the shop's name and the job ("สมัครงานเชฟ · ร้านอาหารจีนเจ๊กิม"); it never opens the combined job list (the phone already has that)
//  - the application shows the shop, the position, the schedule, the requirements and the pay; you type the salary you want and negotiate with the shop's HR:
//    the answer depends on your level, your earlier experience in the same job and the pay scale of the position (accept, counter-offer, or walk away)
//  - once an offer is agreed you take the entry exam / interview, and when you pass you are hired at the agreed salary (pay slips, promotions and severance follow it)
V23.add('v69_jobapply', () => {
  if (typeof Career === 'undefined' || typeof JOBS2 === 'undefined') return;
  const E = s => (typeof esc === 'function' ? esc(s) : String(s));
  const st = () => (S.v69 = S.v69 || { exp: {}, tried: {} });
  const DAYN = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];
  const doorOf = k => World.pois.find(q => q.label && JOBS2[k].at.test(q.label) && q.x < 2500);
  const shopOf = k => { const d = doorOf(k); return d ? d.label.replace(/\s*\(.*$/, '') : JOBS2[k].n; };
  const base = k => JOBS2[k].ranks[0][1];
  // the most this employer will pay a newcomer: pay scale + level + experience in the same kind of job
  const ceilOf = k => { const s = st(), exp = Math.min(0.15, 0.015 * (s.exp[k] || 0)), lv = Math.min(0.2, 0.01 * Math.max(0, (S.lvl || 1) - 1)); return Math.round(base(k) * (1 + Math.min(0.35, exp + lv)) / 100) * 100; };
  let neg = null;

  // ---- keep experience and reset the agreed pay when a job ends ----
  { const _r = Career.resign.bind(Career); Career.resign = function () { const j = this.st(); if (j.k) { const s = st(); s.exp[j.k] = (s.exp[j.k] || 0) + (j.weeks || 0); } const r = _r(); this.st().mult = 1; return r; }; }
  { const _f = Career.fire.bind(Career); Career.fire = function (why, grave) { const j = this.st(); if (j.k) { const s = st(); s.exp[j.k] = (s.exp[j.k] || 0) + (j.weeks || 0); } const r = _f(why, grave); this.st().mult = 1; return r; }; }
  // the agreed salary: the pay scale of the rank times the ratio agreed at hiring (so promotions keep it)
  Career.salary = function () { const C = this.C(); if (!C) return 0; const j = this.st(); return Math.round(C.ranks[j.rank][1] * (j.mult || 1) / 10) * 10; };
  // when you pass the entry exam you are hired at the agreed salary
  { const _a = Career.answer.bind(Career); Career.answer = function (i) {
    const q = this.quiz, deal = Apply.deal, had = !!this.st().k;
    const pm = Phone.msg; if (deal && q && q.mode === 'enter') Phone.msg = function (who, txt, ...rest) { if (typeof txt === 'string' && txt.indexOf('ยินดีต้อนรับเข้าทำงาน') === 0) txt = txt.replace(/เงินเดือน [^ ]+ ฿/, `เงินเดือนที่ตกลงกัน ${baht(deal.salary)}`); return pm.call(this, who, txt, ...rest); };
    let r; try { r = _a(i); } finally { Phone.msg = pm; }
    const j = this.st();
    if (q && q.mode === 'enter' && !had && j.k === q.k && j.start === S.day) {
      if (deal && deal.k === q.k) { j.mult = deal.salary / base(q.k); Phone.msg(shopOf(q.k), `สัญญาจ้างงาน: ${JOBS2[q.k].n} เงินเดือน ${baht(deal.salary)} (ตามที่ตกลงกันที่ตู้สมัครงาน) เริ่มงานตามตารางในแอปงานประจำ`, true); } else j.mult = 1;
      Apply.deal = null;
    }
    return r;
  }; }

  const Apply = {
    deal: null,
    open(k) {
      const C = JOBS2[k]; neg = { k, patience: 3, lines: [], offer: null, ask: base(k), over: false };
      UI.open(`สมัครงาน · ${shopOf(k)}`, null, () => this.html());
    },
    reason(k) {
      const C = JOBS2[k], j = Career.st();
      if (j.k) return `คุณทำงาน${JOBS2[j.k].n}อยู่ ต้องลาออกจากงานเดิมก่อนจึงสมัครที่นี่ได้`;
      if ((j.banned[k] || 0) > S.day) return `ถูกเลิกจ้างจากงานนี้ สมัครใหม่ได้${RD(j.banned[k])}`;
      if ((j.tried || {})[k] === S.day) return 'วันนี้คุณสอบ/สัมภาษณ์ที่นี่ไปแล้ว ลองใหม่พรุ่งนี้';
      try { const w = typeof Edu24 !== 'undefined' && Edu24.jobReq ? Edu24.jobReq(k) : ''; if (w && !(typeof TestMode !== 'undefined' && TestMode.on())) return 'ต้องมีวุฒิ: ' + w; } catch (e) { }
      try { if (window.Gov24 && Gov24.has) { const ids = ['idcard'].concat(C.gov ? ['crimrec'] : [], (window.Career28 && Career28.docs[k]) || []); for (const id of ids) if (!Gov24.has(id)) return 'ยังไม่มีเอกสาร: ' + ((Gov24.docs[id.split(':')[0]] || {}).n || id) + ' · ขอได้ที่ที่ว่าการอำเภอ แล้วค่อยมาสมัคร'; } } catch (e) { }
      let ok = true; try { ok = !!C.ok(); } catch (e) { }
      if (!ok) return 'ยังไม่ผ่านคุณสมบัติ: ' + C.req;
      return '';
    },
    html() {
      if (!neg) return '';
      const k = neg.k, C = JOBS2[k], shop = shopOf(k), b = base(k), why = this.reason(k), sh = C.start(Career.week()), days = C.days.map(d => DAYN[d]).join(' ');
      let h = `<div class="card"><div class="ci">${C.i}</div><div class="cb"><h4>${E(shop)}</h4><p class="dim">ตำแหน่งที่เปิดรับ: <b>${E(C.ranks[0][0])}</b> (${E(C.n)}) · เงินเดือนตามโครงสร้าง <b>${baht(b)}</b></p><p class="dim">ทำงาน ${days} · เข้างาน ${String(sh).padStart(2, '0')}:00 · วันละ 8 ชม.</p><p class="dim">คุณสมบัติ: ${E(C.req)}</p></div></div>`;
      if (why) return h + `<p class="bad">${E(why)}</p><div class="row"><button class="btn" data-a="close">ปิด</button></div>`;
      h += `<h5>💬 ต่อรองเงินเดือนกับฝ่ายบุคคล ${E(shop)}</h5>`;
      h += `<div class="msgs">${neg.lines.map(l => `<p class="${l[0] === 'me' ? 'good' : 'dim'}"><b>${l[0] === 'me' ? 'คุณ' : 'ฝ่ายบุคคล'}:</b> ${l[1]}</p>`).join('') || `<p class="dim">ฝ่ายบุคคล: สวัสดีค่ะ สนใจตำแหน่ง${E(C.ranks[0][0])}ที่${E(shop)}ใช่ไหมคะ เงินเดือนเริ่มต้น ${baht(b)} คุณต้องการเท่าไรคะ</p>`}</div>`;
      if (neg.offer) {
        h += `<div class="card"><div class="ci">📝</div><div class="cb"><h4>ข้อเสนอที่ตกลงกัน: ${baht(neg.offer)} ต่อเดือน</h4><p class="dim">ขั้นต่อไป: สอบ/สัมภาษณ์เข้างาน ถ้าผ่านจะได้รับเข้าทำงานด้วยเงินเดือนนี้</p><div class="row"><button class="btn" data-a="ja69ok">✅ รับข้อเสนอ ไปสอบเข้างาน</button><button class="btn ghost" data-a="ja69re">ต่อรองอีก</button></div></div></div>`;
      } else if (!neg.over) {
        h += `<div class="row"><input id="ask69" type="number" inputmode="numeric" min="0" step="500" value="${neg.ask}" style="flex:1;min-width:120px;padding:8px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.1);color:inherit;font:inherit"><button class="btn" data-a="ja69ask">เสนอเงินเดือนนี้</button></div><div class="row"><button class="btn ghost" data-a="ja69ask" data-v="${b}">ตามโครงสร้าง ${baht(b)}</button><button class="btn ghost" data-a="ja69ask" data-v="${Math.round(b * 1.1 / 100) * 100}">ขอ +10%</button><button class="btn ghost" data-a="ja69ask" data-v="${Math.round(b * 1.25 / 100) * 100}">ขอ +25%</button></div><p class="dim">พิมพ์จำนวนเงินที่ต้องการได้เอง · ต่อรองได้ ${neg.patience} ครั้ง · ยิ่งเลเวลสูงและเคยทำงานนี้มา ยิ่งต่อรองได้มาก</p>`;
      } else h += `<div class="row"><button class="btn" data-a="close">ปิด</button></div>`;
      return h;
    },
    ask(d) {
      if (!neg || neg.over || neg.offer) return;
      const k = neg.k, b = base(k), top = ceilOf(k), el = document.getElementById('ask69');
      let ask = Math.round(+(d && d.v) || +(el && el.value) || 0); if (!(ask > 0)) { UI.toast('พิมพ์จำนวนเงินเดือนที่ต้องการ', '💬'); return; }
      neg.ask = ask; neg.lines.push(['me', `ขอเงินเดือน ${baht(ask)} ค่ะ/ครับ`]);
      if (ask <= b) { neg.offer = b; neg.lines.push(['hr', `ตามโครงสร้างของตำแหน่งนี้เราให้ ${baht(b)} ค่ะ ตกลงตามนี้นะคะ`]); }
      else if (ask <= top) { neg.offer = ask; neg.lines.push(['hr', `พิจารณาจากประวัติและความสามารถของคุณแล้ว ตกลงที่ ${baht(ask)} ค่ะ`]); }
      else {
        neg.patience--;
        if (ask <= Math.round(top * 1.12) && neg.patience > 0) { neg.offer = top; neg.lines.push(['hr', `${baht(ask)} สูงกว่างบของตำแหน่งนี้ค่ะ เราให้ได้สูงสุด ${baht(top)} ถ้าตกลง ทำสัญญาได้เลย`]); }
        else if (neg.patience > 0) { neg.lines.push(['hr', `${baht(ask)} สูงเกินโครงสร้างเงินเดือนของตำแหน่งนี้มากค่ะ ลองเสนอใหม่ในช่วง ${baht(b)} – ${baht(top)} นะคะ`]); }
        else { neg.over = true; st().tried[k] = S.day; neg.lines.push(['hr', 'ขอบคุณที่สนใจค่ะ แต่ครั้งนี้เรายังตกลงเรื่องเงินเดือนกันไม่ได้ ลองมาคุยใหม่พรุ่งนี้นะคะ']); }
      }
    },
    again() { if (!neg) return; neg.offer = null; neg.patience = Math.max(0, neg.patience - 1); if (neg.patience <= 0) { neg.over = true; st().tried[neg.k] = S.day; neg.lines.push(['hr', 'ขอบคุณค่ะ แต่เราขอสรุปตามข้อเสนอเดิม วันนี้ต่อรองครบแล้ว ลองมาใหม่พรุ่งนี้นะคะ']); } },
    accept() { if (!neg || !neg.offer) return; this.deal = { k: neg.k, salary: neg.offer }; const k = neg.k; neg = null; UI.close(); Career.apply(k); },
  };
  window.Apply69 = Apply;
  Object.assign(UI.H, { ja69ask: d => Apply.ask(d), ja69ok: () => Apply.accept(), ja69re: () => Apply.again() });

  // ---- every kiosk belongs to one workplace: its sign, label and prompt name that shop ----
  const signTex = (a, b) => { const c = document.createElement('canvas'); c.width = 512; c.height = 176; const g = c.getContext('2d'); g.fillStyle = '#0d47a1'; g.fillRect(0, 0, 512, 176); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 44px Kanit,Tahoma,sans-serif'; g.fillText(a.length > 22 ? a.slice(0, 21) + '…' : a, 256, 56); g.fillStyle = '#ffe082'; g.font = '36px Kanit,Tahoma,sans-serif'; g.fillText(b, 256, 120); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; };
  let n = 0;
  for (const p of World.pois.filter(q => q.job && q.grp)) {
    const k = p.job, C = JOBS2[k]; if (!C) continue; const shop = shopOf(k);
    p.shop = shop; p.label = 'ตู้สมัครงาน · ' + shop;
    p.act = () => Career.is(k) ? { icon: '🕒', label: `ลงเวลาเข้างาน (${C.n} · ${shop})`, fn: () => Career.clockIn() } : { icon: '💼', label: `สมัครงาน${C.n} · ${shop}`, fn: () => Apply.open(k) };
    for (const c of p.grp.children.slice()) if (c.geometry && c.geometry.type === 'PlaneGeometry') p.grp.remove(c);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.52), new THREE.MeshStandardMaterial({ map: signTex(shop, `${C.i} รับสมัคร: ${C.n}`), roughness: 0.7, side: THREE.DoubleSide }));
    sign.position.set(0, 1.62, 0); p.grp.add(sign); n++;
  }
  window.Jobs69 = { shopOf, base, ceilOf, Apply, kiosks: n };
});
