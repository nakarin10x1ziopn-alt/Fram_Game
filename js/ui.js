'use strict';
// ---------- HUD, menus, shops ----------
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const baht = n => U.fmt(n) + ' ฿';
const UI = {
  cur: null, slots: [], lastAct: '',
  init(hasSave) {
    $('loadMsg').textContent = hasSave ? 'พบเกมที่บันทึกไว้' : 'พร้อมเล่นแล้ว!';
    $('btnPlay').textContent = hasSave ? 'เล่นต่อ' : 'เริ่มเล่น';
    $('btnPlay').disabled = false;
    $('btnPlay').onclick = () => startGame(false);
    $('btnNew').hidden = !hasSave;
    $('btnNew').onclick = () => UI.confirm('เริ่มเกมใหม่?', 'ความคืบหน้าที่บันทึกไว้จะหายทั้งหมด', 'เริ่มใหม่', () => startGame(true));
    $('mClose').onclick = () => UI.close();
    $('modal').addEventListener('click', e => { if (e.target.id === 'modal') UI.close(); });
    $('mBody').addEventListener('click', e => {
      const b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
      const h = UI.H[b.dataset.a]; if (h) { if (window.PayGate) PayGate.run(h, b.dataset, b.dataset.a); else h(b.dataset); if (UI.cur && UI.cur.render) UI.renderBody(); }
    });
    $('mBody').addEventListener('input', e => { if (e.target.id === 'nmName') S.name = e.target.value; if (e.target.id === 'nmFarm') S.farm = e.target.value; });
    $('mTabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (!b) return; UI.cur.tab = +b.dataset.tab; Sfx.click(); UI.renderBody(); });
    $('bAct').addEventListener('pointerdown', e => { e.preventDefault(); doAction(); });
    $('bCar').onclick = () => { if (G.driving) exitCar(); };
    $('bHorn').addEventListener('pointerdown', e => { e.preventDefault(); honk(); });
    $('bRun').onclick = () => { Input.sprint = !Input.sprint; $('bRun').classList.toggle('on', Input.sprint); };
    $('bDecor').onclick = () => UI.decor();
    $('mvRot').onclick = () => Move.rotate(); $('mvOk').onclick = () => Move.place(); $('mvNo').onclick = () => Move.cancel();
    $('bInv').onclick = () => UI.inventory();
    $('bMap').onclick = () => UI.bigMap();
    $('bBook').onclick = () => UI.book();
    $('bPhone').onclick = () => Phone.open();
    $('mini').onclick = () => UI.bigMap();
    $('bMenu').onclick = () => UI.menu();
    $('quest').onclick = () => UI.journal();
    $('goal').onclick = () => { const g = GOALS[S.goal]; if (g) UI.toast('เป้าหมาย: ' + g.t + ` · รางวัล ${baht(g.reward)}`, '🎯'); };
    for (const el of document.querySelectorAll('.hud button, #hotbar')) el.addEventListener('pointerdown', e => e.stopPropagation());
    this.hud(); this.hotbar(); this.buttons();
  },
  isOpen() { return !!this.cur; },
  toast(msg, icon = 'ℹ️') {
    const t = document.createElement('div'); t.className = 'toast';
    t.innerHTML = `<span class="ti">${icon}</span><span>${esc(msg)}</span>`;
    const box = $('toasts'); box.appendChild(t);
    while (box.children.length > 4) box.removeChild(box.firstChild);
    setTimeout(() => t.classList.add('out'), 2900); setTimeout(() => t.remove(), 3400);
  },
  open(title, tabs, render, opts = {}) {
    this.cur = { title, tabs: tabs || [], tab: opts.tab || 0, render, wide: opts.wide };
    $('mTitle').textContent = title;
    $('modal').classList.add('show'); $('modal').classList.toggle('wide', !!opts.wide);
    document.body.classList.toggle('modal-open', !$('modal').classList.contains('side'));
    this.renderBody();
  },
  renderBody() {
    const c = this.cur; if (!c) return;
    $('mTabs').innerHTML = c.tabs.map((t, i) => `<button data-tab="${i}" class="${i === c.tab ? 'on' : ''}">${esc(t)}</button>`).join('');
    $('mTabs').hidden = c.tabs.length < 2;
    $('mWallet').textContent = baht(S.money);
    const st = $('mBody').scrollTop;
    $('mBody').innerHTML = c.render(c.tab);
    $('mBody').scrollTop = st;
    if (c.after) c.after();
  },
  close() {
    if (!this.cur) return;
    const c = this.cur; this.cur = null; $('modal').classList.remove('show', 'side'); document.body.classList.remove('modal-open');
    if (c.onClose) c.onClose();
  },
  confirm(title, text, ok, fn) {
    this.open(title, null, () => `<p class="lead">${esc(text)}</p><div class="row end"><button class="btn ghost" data-a="close">ยกเลิก</button><button class="btn" data-a="ok">${esc(ok)}</button></div>`);
    this.H.ok = () => { UI.close(); fn(); };
  },

  // ----- HUD -----
  hud() {
    Life2.hud();
    if (!S) return;
    $('money').textContent = baht(S.money);
    const h = Math.floor(S.time / 60), m = Math.floor(S.time % 60);
    $('clock').textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    $('day').textContent = 'วันที่ ' + S.day;
    const se = season(); $('season').textContent = `${se.i} ${se.n} ${((S.day - 1) % SEASON_LEN) + 1}/${SEASON_LEN}`;
    const W = WEATHER[S.weather.type], moon = G.night > 0.5 && (S.weather.type === 'sunny' || S.weather.type === 'partly');
    $('wx').textContent = moon ? '🌙' : W.i; $('wx').title = moon ? 'ท้องฟ้าโปร่งยามค่ำ' : W.n;
    $('enBar').style.width = (S.energy / maxEnergy() * 100) + '%';
    $('enTxt').textContent = Math.round(S.energy);
    const cap = CAN_CAP[S.up.can - 1];
    $('wtBar').style.width = (S.can.water / cap * 100) + '%'; $('wtTxt').textContent = `${S.can.water}/${cap}`;
    const z = G.inMine ? { n: 'เหมืองชั้น ' + Mine.floor } : G.inside ? { n: 'ในบ้าน' } : zoneAt(G.player.pos.x, G.player.pos.z);
    $('loc').textContent = (S.name ? S.name + ' · ' : '') + (z ? z.n : (G.player.pos.x > 120 ? 'ถนนเลียบเขา' : 'ทุ่งนอกเมือง'));
    $('lvTxt').textContent = 'Lv.' + S.lvl; $('xpBar').style.width = (S.lvl >= MAX_LVL ? 100 : S.xp / xpNeed(S.lvl) * 100) + '%';
    $('speed').hidden = !G.driving;
    if (G.driving) { const cd = Town2.carState(G.driving.d); $('speed').textContent = `${Math.round(Math.abs(G.driving.speed) * 3.6)} กม./ชม. · ⛽${Math.round(cd.fuel)}% · 🛠️${Math.round(cd.cond)}%`; }
    const g = GOALS[S.goal];
    $('goal').hidden = !g;
    if (g) { const v = Math.min(g.n, g.k(S)); $('goalTxt').textContent = g.t; $('goalProg').textContent = g.n > 1 ? `${g.n >= 1000 ? U.fmt(v) : v}/${g.n >= 1000 ? U.fmt(g.n) : g.n}` : ''; }
    const qt = Quest.tracker(); $('quest').hidden = !qt; if (qt) { $('questT').textContent = qt.t; $('questS').textContent = qt.sub; }
    const lowE = S.energy < 15; $('enWrap').classList.toggle('warn', lowE);
  },
  checkGoal() {
    const g = GOALS[S.goal]; if (!g) return;
    if (g.k(S) >= g.n) {
      S.goal++; earn(g.reward); Sfx.goal();
      UI.toast(`สำเร็จ! ${g.t} · รับ ${baht(g.reward)}`, '🏆');
      FX.burst(G.player.pos.x, G.player.pos.y + 2, G.player.pos.z, 30, new THREE.Color(1, 0.85, 0.2), 4, 5);
    }
  },
  action(d) {
    const b = $('bAct'), key = d ? d.icon + d.label + !!d.fn : '';
    if (key === this.lastAct) return; this.lastAct = key;
    b.classList.toggle('idle', !d); b.classList.toggle('info', !!d && !d.fn);
    $('actIcon').textContent = d ? d.icon : '✋';
    $('actLbl').textContent = d ? d.label : '';
    $('prompt').hidden = !d || G.Q.touch;
    if (G.driving) $('bAct').hidden = !(d && d.fn);
    if (d) $('prompt').innerHTML = (d.fn ? '<kbd>E</kbd> ' : '') + esc(d.label);
  },
  look(first) {
    S.look = S.look || Object.assign({}, DEFAULT_LOOK);
    G.lookCam = true;
    // stand in the open middle of the room facing the camera; drag to orbit 360°
    if (G.inside && !G.inRoom && !G.inMine) { G.player.pos.set(IN.x + 0.3, IN.y, IN.z + 0.6); G.player.rot = 0; G.cam.yaw = 0.35; snapCam(); UI.toast('ลากหน้าจอเพื่อหมุนดูตัวละครรอบทิศ', '🔄'); }
    const sw = (f, arr) => `<div class="sw small">${arr.map((v, i) => typeof v === 'number'
      ? `<button data-a="lk" data-f="${f}" data-v="${i}" class="${S.look[f] === i ? 'on' : ''}" style="background:#${v.toString(16).padStart(6, '0')}" aria-label="${f} ${i + 1}"></button>`
      : `<button data-a="lk" data-f="${f}" data-v="${i}" class="txt ${S.look[f] === i ? 'on' : ''}">${v[1]}</button>`).join('')}</div>`;
    this.open(first ? 'สร้างตัวละครของคุณ' : 'แต่งตัวละคร', null, () => `
      <label class="field">ชื่อของคุณ<input id="nmName" maxlength="16" placeholder="เช่น สมใจ" value="${esc(S.name || '')}"></label>
      <label class="field">ชื่อฟาร์ม (แสดงที่ป้ายหน้าฟาร์ม)<input id="nmFarm" maxlength="18" value="${esc(S.farm || 'ไร่สุขใจ')}"></label>
      <h5>ตัวละคร</h5><div class="sw small">${[['', 'ชาวไร่ (แต่งเอง)']].concat(Object.keys(TOONS).filter(k => !(window.CHAR_PICS || []).includes(k)).map(k => ['toon:' + k, '✨ ' + TOONS[k].n])).concat(AV_NAMES.includes(S.look.avatar) ? [[S.look.avatar, AV_LABEL[S.look.avatar] || S.look.avatar]] : []).map(([v, t]) => `<button data-a="lkav" data-v="${v}" class="txt ${(S.look.avatar || '') === v ? 'on' : ''}">${t}</button>`).join('')}</div>${window.CHAR_PICS ? `<div class="charcards">${window.CHAR_PICS.map(k => window.charCardHtml('toon:' + k, TOONS[k].n, S.look.avatar === 'toon:' + k)).join('')}</div>` : ''}
      ${S.look.avatar ? '<p class="lead">ตัวละครสำเร็จรูปเปลี่ยนสีเสื้อผ้าไม่ได้ เลือก "ชาวไร่ (แต่งเอง)" ถ้าอยากแต่งเอง</p>' : `<h5>สีผิว</h5>${sw('skin', LOOK.skin)}`}${S.look.avatar ? '' : `<h5>สีผม</h5>${sw('hair', LOOK.hair)}<h5>ทรงผม</h5>${sw('style', LOOK.style)}`}
      ${S.look.avatar ? '' : `<h5>เสื้อ</h5>${sw('shirt', LOOK.shirt)}<h5>กางเกง</h5>${sw('pants', LOOK.pants)}<h5>ชุด</h5>${sw('ov', LOOK.ov)}<h5>หมวก</h5>${sw('hat', LOOK.hat)}`}
      <div class="row end"><button class="btn big" data-a="lookdone">${first ? 'เริ่มทำฟาร์ม!' : 'เสร็จแล้ว'}</button></div>`);
    $('modal').classList.add('side');
    this.cur.onClose = () => { G.lookCam = false; saveGame(true); if (first && !S.tips.welcome) { S.tips.welcome = 1; setTimeout(() => UI.help(), 300); } };
  },
  talk(n) {
    if (UI.talkTo !== n) UI.conv = null;
    UI.talkTo = n; UI.talkMsg = null;
    const h = Friends.get(n.name), fav = favOf(n.name), known = h >= 2;
    const hearts = Array.from({ length: 10 }, (_, i) => i < Math.floor(h) ? '❤️' : '🤍').join('');
    const greet = n.keeper ? `ยินดีต้อนรับจ้า${S.name ? 'คุณ' + S.name : ''} เข้ามาดูของในร้านได้เลย!` : U.pick(NPC_LINES);
    this.open(n.name, null, () => `${People.card(n)}<p class="hearts">${hearts}</p>${Chat.html(n)}${People.convHTML(n)}
      <p class="lead say">“${esc(UI.talkMsg || greet)}”</p>
      ${Social.buttons(n)}
      <p class="lead">ของที่ชอบ: ${known ? ITEMS[fav].i + ' ' + ITEMS[fav].n : 'ยังไม่รู้ (สนิทถึง 2 หัวใจจะบอก)'} · ${n.keeper && h >= 5 ? 'ได้ส่วนลดร้าน 10%' : n.keeper ? 'สนิท 5 หัวใจได้ส่วนลดร้าน 10%' : 'ของขวัญจาก ' + n.name + ' ที่ 3 / 6 / 10 หัวใจ'}</p>
      ${UI.questHTML(n)}
      <div class="row end">${n.keeper ? '<button class="btn" data-a="toshop">เข้าร้าน</button>' : ''}<button class="btn ghost" data-a="chat">คุยเล่น</button><button class="btn" data-a="giftlist" ${S.daily.gift[n.name] ? 'disabled' : ''}>${S.daily.gift[n.name] ? 'ให้ของขวัญแล้ววันนี้' : '🎁 ให้ของขวัญ'}</button></div>`);
  },
  questHTML(n) {
    if (!Quest.isGiver(n)) return '';
    const q = Quest.cur();
    if (S.quest.st === 'avail') return `<div class="card order"><div class="ci">📜</div><div class="cb"><h4>${esc(q.t)}</h4><p>“${esc(q.intro)}”</p><div class="row"><button class="btn" data-a="qaccept">รับเควสต์</button></div></div></div>`;
    const ok = Quest.complete(q);
    return `<div class="card order"><div class="ci">📜</div><div class="cb"><h4>${esc(q.t)}</h4><p>${q.obj.map(o => (o.ok() ? '✅ ' : '⬜ ') + esc(o.text())).join('<br>')}</p><div class="row"><button class="btn" data-a="qturn" ${ok ? '' : 'disabled'}>${ok ? 'ส่งเควสต์' : 'ยังไม่ครบ'}</button></div></div></div>`;
  },
  journal() {
    this.open('สมุดเควสต์', null, () => {
      const done = QUESTS.slice(0, S.quest.i).map(q => `<li>✅ ${esc(q.t)}</li>`).join('');
      const q = Quest.cur(), g = q && Quest.giverOf(q);
      const cur = !q ? '<p class="lead good">ทำเควสต์ครบทุกเรื่องแล้ว ยอดเยี่ยมมาก!</p>' : S.lvl < q.lvl ? `<p class="lead">เควสต์ถัดไปเปิดเมื่อถึง Lv.${q.lvl}</p>` :
        `<div class="card order"><div class="ci">📜</div><div class="cb"><h4>${esc(q.t)}</h4><p>จาก ${esc(g ? g.name : '')} (คนขายของที่${SHOPS[q.giver] ? SHOPS[q.giver].n : 'ตลาดริมทะเล'})</p><p>${S.quest.st === 'avail' ? 'ไปคุยเพื่อรับเควสต์ ❗' : q.obj.map(o => (o.ok() ? '✅ ' : '⬜ ') + esc(o.text())).join('<br>')}</p></div></div>`;
      return cur + (done ? `<h5>ทำสำเร็จแล้ว</h5><ul class="lead">${done}</ul>` : '') + (S.title ? `<p class="lead good">ฉายา: ${esc(S.title)}</p>` : '');
    });
  },
  projectsHTML() {
    return `<p class="lead">ช่วยกันสร้างหมู่บ้านให้น่าอยู่ ร่วมบริจาคเงินหรือผลผลิต ครบแล้วสิ่งใหม่จะปรากฏในโลกจริง</p><div class="grid">${PROJECTS.map(p => {
      const st = S.projects[p.id] || { money: 0, items: {} };
      if (st.done) return `<div class="card"><div class="ci">${p.i}</div><div class="cb"><h4>${esc(p.n)}</h4><p class="good">✅ สำเร็จแล้ว · ${esc(p.perk)}</p></div></div>`;
      const parts = [`<button class="btn" data-a="donate" data-id="${p.id}" data-w="money" ${st.money >= p.money ? 'disabled' : ''}>💰 ${U.fmt(st.money)}/${U.fmt(p.money)} ฿</button>`]
        .concat(Object.keys(p.items).map(k => `<button class="btn ghost" data-a="donate" data-id="${p.id}" data-w="${k}" ${(st.items[k] || 0) >= p.items[k] ? 'disabled' : ''}>${ITEMS[k].i} ${st.items[k] || 0}/${p.items[k]}</button>`));
      return `<div class="card"><div class="ci">${p.i}</div><div class="cb"><h4>${esc(p.n)}</h4><p>${esc(p.perk)}</p><div class="row">${parts.join('')}</div></div></div>`;
    }).join('')}</div>`;
  },
  bus() {
    this.open('รถสองแถว · ค่าโดยสาร 20 ฿', null, () => `<p class="lead">เลือกป้ายที่จะไป ใช้เวลาเดินทางประมาณ 15 นาทีในเกม</p><div class="menu">${BUS_STOPS.map((s, i) => `<button class="btn ghost" data-a="bus" data-i="${i}">🚌 ${esc(s.n)}</button>`).join('')}</div>`);
  },
  craft() {
    const need = n => Object.keys(n).map(k => `<span class="${countBase(k) >= n[k] ? 'have' : 'miss'}">${ITEMS[k].i}${countBase(k)}/${n[k]}</span>`).join(' ');
    this.open('โต๊ะช่าง', ['หลอมแร่', 'เครื่องจักร', 'อุปกรณ์'], tab => {
      if (tab === 1) {
        const free = MSLOTS.length - S.machines.length;
        return `<p class="lead">เครื่องจักรวางที่ลานหลังบ้าน (ว่าง ${free}/${MSLOTS.length} ช่อง) ใส่วัตถุดิบแล้วรอ ได้ของแปรรูปราคาดีกว่าเดิมหลายเท่า</p><div class="grid">${Object.keys(MACHINES).map(k => { const M_ = MACHINES[k], ok = Craft.canPay(M_.cost) && free > 0;
          return `<div class="card"><div class="ci">${M_.i}</div><div class="cb"><h4>${esc(M_.n)} <small>มี ${S.machines.filter(m => m.type === k).length}</small></h4><p>${esc(M_.desc)}${M_.h ? ' · ' + M_.h + ' ชม.' : ''}</p><p class="need">${need(M_.cost)}</p><div class="row"><button class="btn" data-a="machine" data-id="${k}" ${ok ? '' : 'disabled'}>สร้าง</button></div></div></div>`; }).join('')}</div>`;
      }
      return `<p class="lead">${tab === 0 ? 'หลอมแร่ 3 ก้อนเป็นแท่งโลหะ ใช้สร้างเครื่องจักรและอุปกรณ์' : 'สร้างอุปกรณ์จากโลหะแทนการซื้อ'}</p><div class="grid">${CRAFTS.map((c, i) => c.tab !== tab ? '' : `<div class="card"><div class="ci">${ITEMS[c.id].i}</div><div class="cb"><h4>${esc(ITEMS[c.id].n)}${c.q ? ' ×' + c.q : ''} <small>มี ${count(c.id)}</small></h4><p class="need">${need(c.need)}</p><div class="row"><button class="btn" data-a="craft" data-i="${i}" ${Craft.canPay(c.need) ? '' : 'disabled'}>สร้าง</button></div></div></div>`).join('')}</div>`;
    });
  },
  book() {
    const [a, n] = Book.progress();
    this.open(`สมุดสะสม ${a}/${n}`, BOOK.map(c => c.n), tab => {
      const c = BOOK[tab], l = c.list(), got = l.filter(k => S.found[k]).length;
      return `<p class="lead">${got}/${l.length} ชนิด · สะสมครบได้รางวัล ${baht(c.reward)}${S.bookRew[c.id] ? ' ✅ รับแล้ว' : ''}</p><div class="grid">${l.map(k => S.found[k]
        ? `<div class="card"><div class="ci">${ITEMS[k].i}</div><div class="cb"><h4>${esc(ITEMS[k].n)}</h4><p>ราคาพื้นฐาน ${baht(ITEMS[k].sell || 0)}</p></div></div>`
        : `<div class="card" style="opacity:.55"><div class="ci">❔</div><div class="cb"><h4>ยังไม่พบ</h4><p>${c.id === 'fish' ? (FISH[k.slice(5)].water === 'sea' ? 'ปลาทะเล' : 'ปลาน้ำจืด') + (FISH[k.slice(5)].rare ? ' · หายาก' : '') : c.id === 'mineral' ? 'พบได้ตั้งแต่เหมืองชั้น ' + MINERALS[k].d : ''}</p></div></div>`).join('')}</div>`;
    }, { wide: true });
  },
  mine() {
    const stops = [1]; for (let f = 5; f <= (S.mineMax || 1); f += 5) stops.push(f);
    this.open('เหมืองเก่าบนเขา', null, () => `<p class="lead">ขุดหินเพื่อหาแร่และอัญมณี ใช้พลังงาน 2 ต่อครั้ง หินบางก้อนซ่อนบันไดลงชั้นที่ลึกกว่า ยิ่งลึกยิ่งเจอของมีค่า · ลึกสุดที่เคยไป: ชั้น ${S.mineMax || 1}</p>
      ${S.up.pick ? '' : '<p class="lead" style="color:#f08a7a">ยังไม่มีจอบขุดแร่ ซื้อได้ที่ร้านช่างไม้ในหมู่บ้าน</p>'}
      <div class="menu">${stops.map(f => `<button class="btn ${f === 1 ? '' : 'ghost'}" data-a="minego" data-f="${f}">⛏️ ลงลิฟต์ไปชั้น ${f}</button>`).join('')}</div>`);
  },
  giftList() {
    const n = UI.talkTo;
    this.open('ของขวัญให้' + n.name, null, () => {
      const ids = Object.keys(S.inv).filter(id => ITEMS[id] && ['crop', 'product', 'fish', 'dish', 'artisan', 'mineral'].includes(ITEMS[id].cat) && S.inv[id] > 0);
      if (!ids.length) return '<p class="empty">ยังไม่มีของที่ให้ได้ ลองเก็บผัก ไข่ หรือทำอาหารก่อนนะ</p>';
      return `<p class="lead">ของโปรดได้ ❤️+2 · อาหารปรุงเอง ❤️+1.5 · อย่างอื่น ❤️+1 (วันละ 1 ครั้งต่อคน)</p><div class="grid">${ids.map(id => `<div class="card"><div class="ci">${ITEMS[id].i}</div><div class="cb"><h4>${esc(ITEMS[id].n)} <small>×${S.inv[id]}</small></h4><div class="row"><button class="btn" data-a="gift" data-id="${id}">ให้</button></div></div></div>`).join('')}</div>`;
    });
  },
  board() {
    this.open('กระดานหมู่บ้าน', ['ออเดอร์ส่งของ', 'พัฒนาหมู่บ้าน'], tab => {
      if (tab === 1) return UI.projectsHTML();
      if (!S.orders.length) return '<p class="empty">ยังไม่มีออเดอร์ใหม่ พรุ่งนี้เช้ามาดูอีกครั้งนะ</p>';
      return `<p class="lead">ส่งของให้ครบก่อนหมดเวลา ได้เงิน ค่าประสบการณ์ และความสนิทกับชาวบ้าน · ออเดอร์ใหม่มาทุกเช้า</p><div class="grid">${S.orders.map((o, i) => {
        const have = Math.min(o.qty, countBase(o.item)), left = o.due - S.day, it = ITEMS[o.item];
        return `<div class="card order"><div class="ci">${it.i}</div><div class="cb"><h4>${esc(o.who)} ต้องการ ${esc(it.n)} ×${o.qty}</h4>
          <div class="prog"><i style="width:${have / o.qty * 100}%"></i></div>
          <p>มีแล้ว ${have}/${o.qty} · ${left <= 0 ? 'หมดเขตวันนี้!' : 'เหลือ ' + (left + 1) + ' วัน'} · รางวัล ${baht(o.reward)} ❤️+1</p>
          <div class="row"><button class="btn" data-a="deliver" data-i="${i}" ${have < o.qty ? 'disabled' : ''}>ส่งของ</button></div></div></div>`;
      }).join('')}</div>`;
    });
  },
  chest() {
    this.open('หีบเก็บของ', ['ในกระเป๋า', 'ในหีบ'], tab => {
      const src = tab === 0 ? S.inv : S.chest, ids = Object.keys(src).filter(id => ITEMS[id] && src[id] > 0);
      if (!ids.length) return `<p class="empty">${tab === 0 ? 'กระเป๋าว่างเปล่า' : 'หีบยังว่างอยู่ เก็บของที่ยังไม่ใช้ไว้ที่นี่ได้'}</p>`;
      const a = tab === 0 ? 'stash' : 'unstash', lb = tab === 0 ? 'เก็บ' : 'หยิบ';
      return `<div class="grid">${ids.map(id => `<div class="card"><div class="ci">${ITEMS[id].i}</div><div class="cb"><h4>${esc(ITEMS[id].n)} <small>×${src[id]}</small></h4><div class="row"><button class="btn ghost" data-a="${a}" data-id="${id}" data-q="1">${lb} 1</button><button class="btn" data-a="${a}" data-id="${id}" data-q="all">${lb}ทั้งหมด</button></div></div></div>`).join('')}</div>`;
    });
  },
  calendar() {
    const se = season(), dIn = (S.day - 1) % SEASON_LEN + 1, nx = SEASONS[(seasonIdx() + 1) % SEASONS.length], W = WEATHER[S.weather.next];
    const fresh = Object.keys(CROP_SEASON).filter(k => CROP_SEASON[k] === se.id).map(k => CROPS[k].i).join(' ');
    this.open('ปฏิทิน', null, () => `<p class="lead">${se.i} ${se.n} วันที่ ${dIn}/${SEASON_LEN} · อีก ${SEASON_LEN - dIn + 1} วันเข้าสู่ ${nx.i} ${nx.n}</p>
      <p class="lead">ผักตามฤดูตอนนี้ (โตไว +30%): ${fresh}</p><p class="lead">${Fest.today() ? 'วันนี้มี ' + Fest.today().i + ' ' + Fest.today().n + ' ที่หมู่บ้าน!' : 'งานเทศกาลครั้งถัดไป: ' + FESTIVALS[se.id].i + ' ' + FESTIVALS[se.id].n + ' อีก ' + Fest.daysUntil() + ' วัน'}</p><p class="lead">พรุ่งนี้: ${W.i} ${W.n} · ออเดอร์ค้าง ${S.orders.length} รายการ · ระดับเกษตรกร Lv.${S.lvl}</p>`);
  },
  contest() {
    if (S.contestDay === S.day) { UI.toast('ส่งประกวดได้วันละ 1 ครั้ง', '🏆'); return; }
    this.open('ประกวดผลผลิต · ' + Fest.today().n, null, () => {
      const ids = Object.keys(S.inv).filter(id => ITEMS[id] && ITEMS[id].cat === 'crop' && S.inv[id] > 0).sort((a, b) => ITEMS[b].sell * (1 + (ITEMS[b].q || 0)) - ITEMS[a].sell * (1 + (ITEMS[a].q || 0)));
      if (!ids.length) return '<p class="empty">ยังไม่มีผลผลิตให้ส่งประกวด ลองเก็บผักหรือผลไม้มาก่อนนะ</p>';
      return `<p class="lead">ส่งได้ 1 ชิ้น กรรมการให้คะแนนจากชนิดและคุณภาพ ★★ ได้เปรียบมาก · ที่ 1 ได้ 3,000 ฿ และถ้วยรางวัลไปตั้งในบ้าน</p><div class="grid">${ids.map(id => `<div class="card"><div class="ci">${ITEMS[id].i}</div><div class="cb"><h4>${esc(ITEMS[id].n)} <small>×${S.inv[id]}</small></h4><div class="row"><button class="btn" data-a="enter" data-id="${id}">ส่งประกวด</button></div></div></div>`).join('')}</div>`;
    });
  },
  contestResult(all, rank, prize, it) {
    Sfx.goal();
    this.open(rank === 1 ? '🏆 ชนะเลิศ!' : rank <= 3 ? `🎖️ ได้ที่ ${rank}!` : 'ผลการประกวด', null, () => `<p class="lead">${it.i} ${esc(it.n)} ของคุณได้อันดับ ${rank} จาก ${all.length} · รับ ${baht(prize)}${rank === 1 ? ' และถ้วยรางวัลไปตั้งในบ้าน' : ''}</p>
      <div class="grid">${all.map((r, i) => `<div class="card" ${r.me ? 'style="border-color:var(--sun)"' : ''}><div class="ci">${['🥇', '🥈', '🥉'][i] || '🎗️'}</div><div class="cb"><h4>${esc(r.who)}</h4><p>${r.label || r.score + ' คะแนน'}</p></div></div>`).join('')}</div>`);
  },
  namePet(type) {
    UI.petType = type; UI.petDone = false;
    // the pet was paid for in the shop: closing this dialog without naming it gives the money back
    setTimeout(() => { if (UI.cur) UI.cur.onClose = () => { if (!UI.petDone) { S.money += UI.petPaid ?? PETS[type].price; UI.petPaid = null; UI.toast('ยกเลิกการรับเลี้ยง คืนเงินแล้ว', '↩️'); } }; }, 0);
    this.open('ตั้งชื่อ' + PETS[type].n, null, () => `<label class="field">ชื่อ${PETS[type].n}ของคุณ<input id="petName" maxlength="14" placeholder="${type === 'dog' ? 'เช่น โบ้' : 'เช่น ส้มจี๊ด'}"></label><div class="row end"><button class="btn big" data-a="petok">รับมาเลี้ยง ${PETS[type].i}</button></div>`);
  },
  buttons() {
    $('bCar').hidden = !G.driving; $('bHorn').hidden = !G.driving;
    $('bDecor').hidden = !G.inside || !!G.inRoom || !!G.inMine;
    $('bRun').hidden = !G.Q.touch || G.inside || !!G.driving;
    $('bAct').hidden = !!G.driving;
    $('hotbar').hidden = !!G.driving;
  },
  hotbar() {
    if (!S) return;
    const sl = [{ id: 'hand', i: '✋', n: 'มือเปล่า' }, { id: 'can', i: '🚿', n: 'บัวรดน้ำ', c: S.can.water }];
    if (S.up.rod) sl.push({ id: 'rod', i: '🎣', n: 'คันเบ็ด' });
    const seeds = Object.keys(S.inv).filter(k => k.startsWith('seed_') && S.inv[k] > 0).sort((a, b) => CROPS[a.slice(5)].seed - CROPS[b.slice(5)].seed);
    for (const id of seeds) sl.push({ id, i: ITEMS[id].i, n: ITEMS[id].n, c: S.inv[id], seed: true });
    for (const id of ['fert', 'compost', 'sprinkler', 'sprinkler_pro']) if (S.inv[id]) sl.push({ id, i: ITEMS[id].i, n: ITEMS[id].n, c: S.inv[id] });
    if (!sl.some(s => s.id === G.sel)) G.sel = 'hand';
    this.slots = sl;
    $('hotbar').innerHTML = sl.map((s, k) => `<button class="slot ${s.id === G.sel ? 'on' : ''} ${s.seed ? 'seed' : ''}" data-k="${k}" title="${esc(s.n)}"><span class="si">${s.i}</span>${s.c != null ? `<b>${s.c}</b>` : ''}${k < 9 ? `<i>${k + 1}</i>` : ''}</button>`).join('');
    $('hotbar').querySelectorAll('.slot').forEach(b => b.onclick = () => UI.selectSlot(+b.dataset.k));
    const cur = sl.find(s => s.id === G.sel); $('selName').textContent = cur ? cur.n : '';
  },
  selectSlot(k) { const s = this.slots[k]; if (!s) return; G.sel = s.id; Sfx.click(); this.hotbar(); G.tgtT = 0; },

  // ----- Minimap -----
  minimap() {
    const cv = $('mini'), g = cv.getContext('2d'), W = cv.width, img = World.mapImg; if (!img) return;
    const p = G.inside ? { x: HOUSE_POS.x, z: HOUSE_POS.z } : G.player.pos, span = 90;
    const sx = (p.x - WORLD.minX) / 2 - span / 2, sz = (p.z - WORLD.minZ) / 2 - span / 2;
    g.fillStyle = '#2c5a3a'; g.fillRect(0, 0, W, W);
    g.drawImage(img, sx, sz, span, span, 0, 0, W, W);
    const k = W / span / 2;
    const toS = (x, z) => [(x - p.x) * k + W / 2, (z - p.z) * k + W / 2];
    g.font = `${Math.round(W * 0.1)}px "Segoe UI Emoji","Apple Color Emoji",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const poi of World.pois) if (poi.map) { const [x, y] = toS(poi.x, poi.z); if (x > 0 && x < W && y > 0 && y < W) g.fillText(poi.icon, x, y); }
    for (const c of G.cars) if (c !== G.driving) { const [x, y] = toS(c.d.x, c.d.z); if (x > 0 && x < W && y > 0 && y < W) g.fillText('🚙', x, y); }
    g.save(); g.translate(W / 2, W / 2); g.rotate(Math.PI - (G.driving ? G.driving.d.r : G.player.rot));
    g.fillStyle = '#ffcf3f'; g.strokeStyle = '#1b2a1f'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, -9); g.lineTo(6.5, 7); g.lineTo(0, 3.5); g.lineTo(-6.5, 7); g.closePath(); g.fill(); g.stroke(); g.restore();
  },
  bigMap() {
    this.open('แผนที่', null, () => `<div class="mapwrap"><canvas id="bigmap"></canvas></div>
      <div class="legend"><span>🏡 บ้าน</span><span>📦 กล่องส่งขาย</span><span>🌱 ร้านเกษตร</span><span>🐄 ปศุสัตว์</span><span>🔨 ช่างไม้</span><span>🚗 โชว์รูม</span><span>💰 ตลาดรับซื้อ +50%</span><span>🌴 พันธุ์ไม้หายาก</span></div>`, { wide: true });
    this.cur.after = () => {
      const cv = $('bigmap'), img = World.mapImg; const w = cv.parentElement.clientWidth, h = Math.round(w * img.height / img.width);
      cv.width = w * 2; cv.height = h * 2; cv.style.height = h + 'px';
      const g = cv.getContext('2d'), k = cv.width / img.width;
      g.imageSmoothingEnabled = true; g.drawImage(img, 0, 0, cv.width, cv.height);
      const toS = (x, z) => [(x - WORLD.minX) / 2 * k, (z - WORLD.minZ) / 2 * k];
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `${Math.round(cv.width * 0.022)}px "Segoe UI Emoji","Apple Color Emoji",sans-serif`;
      for (const poi of World.pois) if (poi.map) { const [x, y] = toS(poi.x, poi.z); g.fillText(poi.icon, x, y); }
      g.font = `600 ${Math.round(cv.width * 0.024)}px Mitr, Kanit, sans-serif`; g.lineWidth = 6; g.strokeStyle = 'rgba(20,35,25,0.85)'; g.fillStyle = '#fff';
      for (const Z of ZONES) { const [x, y] = toS(Z.x, Z.z - Z.hd - 6); g.strokeText(Z.n, x, y); g.fillText(Z.n, x, y); }
      const p = G.inside ? { x: HOUSE_POS.x, z: HOUSE_POS.z } : G.player.pos, [px, py] = toS(p.x, p.z);
      g.fillStyle = '#ffcf3f'; g.strokeStyle = '#1b2a1f'; g.lineWidth = 3; g.beginPath(); g.arc(px, py, cv.width * 0.012, 0, TAU); g.fill(); g.stroke();
      g.font = `600 ${Math.round(cv.width * 0.02)}px Kanit, sans-serif`; g.fillStyle = '#fff'; g.strokeStyle = 'rgba(20,35,25,0.85)'; g.lineWidth = 5;
      g.strokeText('คุณอยู่ที่นี่', px, py - cv.width * 0.03); g.fillText('คุณอยู่ที่นี่', px, py - cv.width * 0.03);
    };
    this.cur.after();
  },

  // ----- Shops -----
  entry(key, shop) {
    const [k, id] = key.split(':');
    if (k === 'seed') { const C = CROPS[id], cs = SEASONS.find(x => x.id === CROP_SEASON[id]); const tag = cs ? `${cs.i} ปลูกใน${cs.n}โตไว +30%${inSeason(id) ? ' (ตอนนี้!)' : ''} · ` : ''; return { icon: C.i, name: (C.tree ? 'ต้นกล้า' : 'เมล็ด') + C.n, desc: tag + (C.tree ? `ปลูกในสวนผลไม้ · โต ${C.grow} ชม. · ออกผลซ้ำทุก ${C.regrow} ชม. · ขาย ${C.sell}฿/ผล` : `โต ${C.grow} ชม.${C.regrow ? ` · เก็บซ้ำทุก ${C.regrow} ชม.` : ''} · ขาย ${C.sell}฿`), price: C.seed, multi: !C.tree, own: count('seed_' + id), block: S.lvl < (SEED_LVL[id] || 1) ? `ปลดล็อกที่ Lv.${SEED_LVL[id]}` : '', buy: q => addItem('seed_' + id, q) }; }
    if (k === 'pet') { const pt = PETS[id]; return { icon: pt.i, name: pt.n + 'ตัวน้อย', desc: 'อยู่ในบ้านและเดินตามคุณไปทุกที่ ลูบหัววันละครั้งได้พลังงาน +10', price: pt.price, block: Pets2.list().length >= 5 ? 'มีครบ 5 ตัวแล้ว' : '', buy: () => UI.namePet(id) }; }
    if (k === 'tool') { const t = TOOLS[id]; return { icon: t.i, name: t.n, desc: t.desc, price: t.price, multi: id === 'feed' || id === 'fert' || id === 'krathong', own: count(id), buy: q => addItem(id, q) }; }
    if (k === 'food') { const f = FOODS[id]; return { icon: f.i, name: f.n, desc: `กินแล้วได้พลังงาน +${f.en}`, price: f.price, multi: true, own: count('food_' + id), buy: q => addItem('food_' + id, q) }; }
    if (k === 'animal') {
      const A = ANIMALS[id], cap = BARN_CAP[S.up.barn - 1], full = S.animals.length >= cap;
      return { icon: A.i, name: A.n, desc: `ให้${PRODUCTS[A.prod].n} ${PRODUCTS[A.prod].i} ทุกเช้าเมื่อมีอาหารในราง · คอก ${S.animals.length}/${cap}`, price: A.price, block: full ? 'คอกเต็ม อัปเกรดที่ร้านช่างไม้' : '', buy: () => { buyAnimal(id); UI.toast(`${A.n}ตัวใหม่ไปรออยู่ที่คอกในฟาร์มแล้ว`, A.i); } };
    }
    if (k === 'furn') { const F = FURN[id]; return { icon: F.i, name: F.n, desc: 'ตกแต่งในบ้าน ซ่อน/แสดงได้จากปุ่มแต่งบ้าน', price: F.price, block: S.furn[id] ? 'มีแล้ว' : '', buy: () => { S.furn[id] = 1; World.buildInterior(S.up.house, S); if (G.inside) { World.interior.visible = true; } UI.toast(`${F.n} ไปอยู่ในบ้านแล้ว`, F.i); } }; }
    if (k === 'car') {
      const C = CARS[id], own = S.cars.some(c => c.type === id);
      return { icon: C.i, name: C.n, desc: `ความเร็วสูงสุด ${Math.round(C.top * 3.6)} กม./ชม.`, price: C.price, block: own ? 'มีแล้ว' : '', buy: () => { buyCar(id, shop === 'supercar' ? 'seaside' : 'village'); UI.toast('รถจอดรออยู่หน้าโชว์รูม เดินไปขึ้นรถได้เลย', '🔑'); } };
    }
    if (k === 'up') {
      const u = UPG[id], lv = S.up[id] || 0, done = lv >= u.cost.length, idx = lv;
      return { icon: u.i, name: u.n + (lv ? ` (ระดับ ${lv})` : ''), desc: done ? 'อัปเกรดสูงสุดแล้ว' : u.desc[idx], price: done ? 0 : u.cost[idx], block: done ? 'สูงสุดแล้ว' : '', buy: () => { S.up[id] = (S.up[id] || 0) + 1; applyUpgrade(id); UI.toast(`${u.n} สำเร็จ!`, u.i); } };
    }
    return null;
  },
  shop(id) {
    const sh = SHOPS[id]; this.shopId = id;
    this.open(sh.n, sh.tabs.map(t => t.n), tab => {
      return `<div class="grid">${sh.tabs[tab].items.map(key => {
        const e = this.entry(key, id), mu = (id === 'online' ? 1.1 : (typeof shopDiscount === 'function' ? shopDiscount(id) : 1)), px = e.price ? Math.round(e.price * mu) : 0, poor = S.money < px;   // v162: the price shown is the price charged
        const btns = e.block ? `<button class="btn" disabled>${esc(e.block)}</button>` :
          `<button class="btn" data-a="buy" data-k="${key}" data-q="1" ${poor ? 'disabled' : ''}>${e.price ? baht(px) : 'ฟรี'}</button>` +
          (e.multi ? `<button class="btn ghost" data-a="buy" data-k="${key}" data-q="5" ${S.money < px * 5 ? 'disabled' : ''}>×5</button>` : '');
        return `<div class="card"><div class="ci">${e.icon}</div><div class="cb"><h4>${esc(e.name)}${e.own ? `<small> มี ${e.own}</small>` : ''}</h4><p>${esc(e.desc)}</p><div class="row">${btns}</div></div></div>`;
      }).join('')}</div>`;
    });
  },
  H: {
    close() { UI.close(); },
    buy(d) {
      const e = UI.entry(d.k, UI.shopId), q = +d.q || 1, online = UI.shopId === 'online', cost = Math.round(e.price * q * (online ? 1.1 : shopDiscount(UI.shopId)));
      if (e.block) return; if (S.money < cost) { Sfx.error(); UI.toast('เงินไม่พอ', '💸'); return; }
      UI.petPaid = cost / q; // a pet adoption cancelled later refunds exactly what was paid
      S.money -= cost;
      if (online) { const [kk, id] = d.k.split(':'); S.mail.push({ id: kk === 'seed' ? 'seed_' + id : id, q }); S.stats.bought++; Sfx.coin(); saveGame(true); UI.toast(`สั่งซื้อ ${e.name} ×${q} แล้ว พัสดุจะมาส่งพรุ่งนี้เช้า`, '📦'); return; }
      for (let i = 0; i < (e.multi ? 1 : q); i++) e.buy(e.multi ? q : 1);
      S.stats.bought++; Sfx.coin(); saveGame(true); UI.hotbar();
      if (!e.multi) UI.toast(`ซื้อ ${e.name} แล้ว`, e.icon);
    },
    sell(d) {
      const id = d.id, n = d.q === 'all' ? count(id) : Math.min(+d.q, count(id)); if (!n) return;
      const v = priceOf(id, UI.sellMult) * n; takeItem(id, n); earn(v); Bank2.income('ขายผลผลิต', v); S.stats.sold += n;
      UI.toast(`ขาย ${ITEMS[id].n} ×${n} ได้ ${baht(v)}`, '💰');
    },
    sellall() {
      let tot = 0, n = 0;
      for (const id of UI.sellables()) { if (ITEMS[id].cat === 'dish' && !UI.sellDishes) continue; const c = count(id); tot += priceOf(id, UI.sellMult) * c; n += c; takeItem(id, c); }
      if (!n) return; earn(tot); Bank2.income('ขายผลผลิต', tot); S.stats.sold += n; UI.toast(`ขายทั้งหมด ${n} ชิ้น ได้ ${baht(tot)}`, '💰'); saveGame(true);
    },
    eat(d) { eat(d.id); },
    use(d) { G.sel = d.id; UI.hotbar(); UI.close(); UI.toast('ถือ ' + ITEMS[d.id].n + ' แล้ว', ITEMS[d.id].i); },
    cook(d) {
      const R = RECIPES[d.id]; for (const k in R.need) if (countBase(k) < R.need[k]) return;
      for (const k in R.need) takeBase(k, R.need[k]); addItem('dish_' + d.id); S.stats.cooked++; Prog.add(10);
      playAct('fill', 1.0); Sfx.pop(); UI.toast(`ทำ${R.n}เสร็จแล้ว!`, R.i);
    },
    wall(d) { S.decor.wall = +d.v; World.buildInterior(S.up.house, S); World.interior.visible = G.inside; Sfx.click(); },
    floor(d) { S.decor.floor = +d.v; World.buildInterior(S.up.house, S); World.interior.visible = G.inside; Sfx.click(); },
    hide(d) { S.decor.hide[d.id] = !S.decor.hide[d.id]; World.buildInterior(S.up.house, S); World.interior.visible = G.inside; Sfx.click(); },
    save() { saveGame(); },
    sound() { S.mute = !S.mute; Sfx.setOn(!S.mute); },
    q(d) { safeSet(Q_KEY, d.v); UI.toast('ตั้งค่ากราฟิกแล้ว จะมีผลหลังโหลดหน้าใหม่', '⚙️'); },
    move(d) { Move.start(d.id); },
    deliver(d) { Orders.deliver(+d.i); saveGame(true); },
    qaccept() { Quest.accept(); },
    qturn() { Quest.turnIn(UI.talkTo); UI.close(); saveGame(true); },
    donate(d) { Dev.give(d.id, d.w); },
    bus(d) { busTo(+d.i); },
    minego(d) { Mine.enter(+d.f); },
    craft(d) { Craft.make(CRAFTS[+d.i]); },
    machine(d) { Craft.build(d.id); },
    enter(d) { UI.close(); Fest.enter(d.id); saveGame(true); },
    gift(d) { Friends.gift(UI.talkTo, d.id); UI.close(); },
    giftlist() { UI.giftList(); },
    chat() { Social.topic(UI.talkTo, 'small'); },
    wedui() { People.weddingUI(); },
    toshop() { const n = UI.talkTo; UI.close(); if (n.keeper === 'market') UI.sell(1.5, 'ตลาดริมทะเล'); else UI.shop(n.keeper); },
    stash(d) { const n = d.q === 'all' ? count(d.id) : 1; if (!takeItem(d.id, n)) return; S.chest[d.id] = (S.chest[d.id] || 0) + n; },
    unstash(d) { const have = S.chest[d.id] || 0, n = d.q === 'all' ? have : Math.min(1, have); if (!n) return; S.chest[d.id] -= n; if (!S.chest[d.id]) delete S.chest[d.id]; addItem(d.id, n); },
    petok() { UI.petDone = true; const v = ($('petName') || {}).value || ''; S.pet = { type: UI.petType, name: v.trim().slice(0, 14) || (UI.petType === 'dog' ? 'โบ้' : 'ส้มจี๊ด') }; { const used = new Set((S.pets || []).map(p => p.name)); let k = 2; const base = S.pet.name; while (used.has(S.pet.name)) S.pet.name = `${base} ${k++}`; } Pet.spawn(); World.buildInterior(S.up.house, S); World.interior.visible = G.inside; UI.close(); UI.toast(`${S.pet.name}มาอยู่กับคุณแล้ว! เดินตามคุณกลับฟาร์มเลย`, PETS[S.pet.type].i); saveGame(true); },
    resetpos() { S.decor.pos = {}; World.buildInterior(S.up.house, S); World.interior.visible = G.inside; },
    music() { S.music = S.music === false; Music.setOn(S.music !== false); },
    look() { UI.look(false); },
    lkav(d) { S.look = S.look || Object.assign({}, DEFAULT_LOOK); S.look.avatar = d.v || null; rebuildPlayer(); Sfx.click(); },
    lk(d) { S.look = S.look || Object.assign({}, DEFAULT_LOOK); S.look[d.f] = +d.v; rebuildPlayer(); Sfx.click(); },
    lookdone() { S.name = S.name.trim().slice(0, 16); S.farm = (S.farm || '').trim().slice(0, 18) || 'ไร่สุขใจ'; World.setFarmName(S.farm); UI.close(); },
    auto() { Perf.auto = !Perf.auto; safeSet(Q_KEY + '_auto', Perf.auto ? '1' : '0'); },
    reload() { saveGame(true); Net.flush(() => location.reload()); },
    help() { UI.help(); },
    newgame() { UI.confirm('เริ่มเกมใหม่?', 'ความคืบหน้าที่บันทึกไว้จะหายทั้งหมด', 'เริ่มใหม่', () => startGame(true)); },
  },
  sellables() { return Object.keys(S.inv).filter(id => ITEMS[id] && ITEMS[id].sell && S.inv[id] > 0); },
  sell(mult, title) {
    this.sellMult = mult;
    this.open(title, null, () => {
      const ids = this.sellables();
      if (!ids.length) return `<p class="empty">ยังไม่มีของให้ขาย ลองเก็บเกี่ยวผัก เก็บไข่ หรือทำอาหารก่อนนะ</p>`;
      const tot = ids.reduce((s, id) => s + priceOf(id, mult) * count(id), 0);
      const hot = hotCrops().map(k => `${CROPS[k].i} ${CROPS[k].n} ${priceOf(k, mult)}฿`).join(' · ');
      return `${mult > 1 ? '<p class="lead good">ตลาดนี้รับซื้อแพงกว่าปกติ 50%</p>' : ''}<p class="lead">📈 ราคาดีวันนี้: ${hot} · ราคาเปลี่ยนทุกวัน ผักนอกฤดูขายได้แพงกว่า</p>
        <div class="row end"><button class="btn big" data-a="sellall">ขายทั้งหมด ${baht(tot)}</button></div>
        <div class="grid">${ids.map(id => { const it = ITEMS[id], p = priceOf(id, mult), pm = priceMult(id), tr = pm > 1.08 ? '<b class="up">▲</b>' : pm < 0.92 ? '<b class="down">▼</b>' : '';
          return `<div class="card"><div class="ci">${it.i}</div><div class="cb"><h4>${esc(it.n)} <small>×${count(id)}</small></h4><p>ราคา ${baht(p)} / ชิ้น ${tr}</p><div class="row"><button class="btn" data-a="sell" data-id="${id}" data-q="1">ขาย 1</button><button class="btn ghost" data-a="sell" data-id="${id}" data-q="all">ขายหมด ${baht(p * count(id))}</button></div></div></div>`; }).join('')}</div>`;
    });
    this.sellDishes = true;
  },
  inventory(filter) {
    const tabs = ['ผลผลิต & อาหาร', 'เมล็ด & เครื่องมือ'];
    this.open('กระเป๋า', tabs, tab => {
      const ids = Object.keys(S.inv).filter(id => ITEMS[id] && S.inv[id] > 0 && (tab === 0 ? ['crop', 'product', 'dish', 'fish', 'artisan', 'mineral', 'bar'].includes(ITEMS[id].cat) : ['seed', 'tool'].includes(ITEMS[id].cat)));
      let html = tab === 0 ? `<p class="lead">ขายได้ที่ <b>กล่องส่งขาย</b> หน้าบ้าน หรือ <b>ตลาดริมทะเล</b> (+50%) · กินเพื่อเพิ่มพลังงาน</p>` : `<p class="lead">บัวรดน้ำ: ${S.can.water}/${CAN_CAP[S.up.can - 1]} · อาหารสัตว์ในราง: ${S.trough}</p>`;
      if (!ids.length) return html + `<p class="empty">ว่างเปล่า</p>`;
      html += `<div class="grid">${ids.map(id => {
        const it = ITEMS[id], b = [];
        if (it.en) b.push(`<button class="btn" data-a="eat" data-id="${id}">กิน +${it.en}⚡</button>`);
        if (id === 'ladybug') b.push(`<button class="btn" data-a="usegood2" data-id="ladybug">ปล่อยในไร่</button>`);
        if (GOODS[id] && (GOODS[id].use || GOODS[id].kid)) b.push(`<button class="btn" data-a="usegood" data-id="${id}">ใช้</button>`);
        if (id.startsWith('wear_')) { const w = id.slice(5); b.push(`<button class="btn" data-a="wear" data-id="${w}">${S.wear && S.wear[WEAR[w].slot] === w ? 'ถอดออก' : 'สวมใส่'}</button>`); }
        if (it.cat === 'seed' || ['fert', 'sprinkler', 'sprinkler_pro'].includes(id)) b.push(`<button class="btn ghost" data-a="use" data-id="${id}">ถือใช้</button>`);
        return `<div class="card"><div class="ci">${it.i}</div><div class="cb"><h4>${esc(it.n)} <small>×${S.inv[id]}</small></h4><p class="dim">${Guide.uses(id)}</p><div class="row">${b.join('')}</div></div></div>`;
      }).join('')}</div>`;
      return html;
    }, { tab: filter === 'food' ? 0 : 0 });
  },
  cook() {
    this.open('ครัว · ทำอาหาร', null, () => `<p class="lead">อาหารปรุงเองให้พลังงานมาก และขายได้ราคาดีกว่าวัตถุดิบ</p><div class="grid">${Object.keys(RECIPES).map(id => {
      const R = RECIPES[id], ok = Object.keys(R.need).every(k => countBase(k) >= R.need[k]);
      const need = Object.keys(R.need).map(k => `<span class="${countBase(k) >= R.need[k] ? 'have' : 'miss'}">${ITEMS[k].i}${R.need[k]}</span>`).join(' ');
      return `<div class="card"><div class="ci">${R.i}</div><div class="cb"><h4>${esc(R.n)}${count('dish_' + id) ? `<small> มี ${count('dish_' + id)}</small>` : ''}</h4><p class="need">${need}</p><p>+${R.en}⚡ · ขาย ${baht(R.sell)}</p><div class="row"><button class="btn" data-a="cook" data-id="${id}" ${ok ? '' : 'disabled'}>ทำอาหาร</button></div></div></div>`;
    }).join('')}</div>`);
  },
  decor() {
    this.open('แต่งบ้าน', ['สีผนัง & พื้น', 'เฟอร์นิเจอร์'], tab => {
      if (tab === 0) return `<h5>สีผนัง</h5><div class="sw">${WALLS.map((w, i) => `<button data-a="wall" data-v="${i}" class="${S.decor.wall === i ? 'on' : ''}" style="background:#${w.c.toString(16).padStart(6, '0')}" title="${w.n}"><span>${w.n}</span></button>`).join('')}</div>
        <h5>พื้นบ้าน</h5><div class="sw">${FLOORS.map((f, i) => `<button data-a="floor" data-v="${i}" class="${S.decor.floor === i ? 'on' : ''}" style="background:#${f.c.toString(16).padStart(6, '0')}"><span>${f.n}</span></button>`).join('')}</div>`;
      const own = Object.keys(FURN).filter(k => S.furn[k]);
      if (own.length) return `<p class="lead">กด "ย้าย/หมุน" แล้วเดินพาเฟอร์นิเจอร์ไปวางตรงไหนก็ได้ในบ้าน</p><div class="row end"><button class="btn ghost" data-a="resetpos">จัดกลับที่เดิมทั้งหมด</button></div>` + furnGrid(own);
      if (!own.length) return `<p class="empty">ยังไม่มีเฟอร์นิเจอร์ ซื้อได้ที่ร้านช่างไม้ในหมู่บ้าน หรือบ้านสวยเฟอร์นิเจอร์ที่เมืองริมทะเล</p>`;
      return furnGrid(own);
      function furnGrid(own) { return `<div class="grid">${own.map(k => `<div class="card"><div class="ci">${FURN[k].i}</div><div class="cb"><h4>${esc(FURN[k].n)}</h4><div class="row">${MOVABLE.includes(k) && !S.decor.hide[k] ? `<button class="btn" data-a="move" data-id="${k}">ย้าย/หมุน</button>` : ''}<button class="btn ${S.decor.hide[k] ? '' : 'ghost'}" data-a="hide" data-id="${k}">${S.decor.hide[k] ? 'วางในบ้าน' : 'เก็บออก'}</button></div></div></div>`).join('')}</div>`; }
    });
  },
  menu() {
    this.open('ตั้งค่า', null, () => `<div class="menu">
      <button class="btn" data-a="save">💾 บันทึกเกม</button>
      <button class="btn ghost" data-a="help">📖 วิธีเล่น</button>
      <button class="btn ghost" data-a="slots">💾 ช่องบันทึกเกม (3 ช่อง)</button>
      <button class="btn ghost" data-a="keys">⌨️ ตั้งค่าปุ่ม & จอยเกม</button>
      <button class="btn ghost" data-a="tutor">🎓 เริ่มสอนเล่นใหม่</button>
      <button class="btn ghost" data-a="guide">📚 คู่มือระบบทั้งหมด (แต่ละระบบใช้ทำอะไร)</button>
      <button class="btn ghost" data-a="fps">${S.showFps === false ? '⬜' : '✅'} แสดง FPS มุมบนจอ</button>
      <button class="btn ghost" data-a="sound">${S.mute ? '🔇 เสียงทั้งหมด: ปิด' : '🔊 เสียงทั้งหมด: เปิด'}</button>
      <button class="btn ghost" data-a="music">${S.music === false ? '🎵 เพลงประกอบ: ปิด' : '🎵 เพลงประกอบ: เปิด'}</button>
      <button class="btn ghost" data-a="look">👕 แต่งตัวละคร</button>
      <h5>คุณภาพกราฟิก (ตอนนี้: ${{ low: 'ต่ำ', med: 'กลาง', high: 'สูง', ultra: 'อัลตร้า' }[G.Q.lvl]})</h5>
      <div class="row"><button class="btn ghost" data-a="q" data-v="low">ต่ำ (ลื่นสุด)</button><button class="btn ghost" data-a="q" data-v="med">กลาง</button><button class="btn ghost" data-a="q" data-v="high">สูง</button><button class="btn ghost" data-a="q" data-v="ultra">อัลตร้า (คอมแรง)</button></div>
      <button class="btn ghost" data-a="reload">โหลดหน้าใหม่เพื่อใช้ค่ากราฟิก</button>
      <button class="btn ghost" data-a="bloom">${safeGet('raisukjai3d_bloom') === '0' ? '⬜' : '✅'} เอฟเฟกต์แสงฟุ้งและลบรอยหยัก (กราฟิกสูง/อัลตร้า)</button>
      <button class="btn ghost" data-a="auto">${Perf.auto ? '✅' : '⬜'} ปรับกราฟิกอัตโนมัติเมื่อเครื่องเริ่มกระตุก</button>
      <p class="lead">ความลื่นตอนนี้ ${G.fps ? Math.round(G.fps) + ' FPS' : 'กำลังวัด...'} · ความคมชัด ${Math.round(G.pr * 100)}% · เงา ${G.shadow ? 'เปิด' : 'ปิด'} · ระยะมอง ${Math.round(G.view * 100)}%</p>
      <h5>สถิติฟาร์ม</h5><p class="lead">เก็บเกี่ยว ${U.fmt(S.stats.harvest)} ชิ้น · ขายแล้ว ${U.fmt(S.stats.sold)} ชิ้น · รายได้รวม ${baht(S.stats.earned)} · สัตว์ ${S.animals.length} ตัว · รถ ${S.cars.length} คัน</p>
      <button class="btn danger" data-a="newgame">เริ่มเกมใหม่</button></div>`);
  },
  help() {
    const t = G.Q.touch;
    this.open('วิธีเล่นไร่สุขใจ', null, () => `<div class="help">
      <div class="hc"><h5>${t ? '📱 ควบคุมบนมือถือ/แท็บเล็ต' : '⌨️ ควบคุมบนคอม'}</h5><ul>${t ? `
        <li>แตะค้างด้านซ้ายของจอแล้วลาก = จอยเดิน (ดันสุด = วิ่ง)</li><li>ลากนิ้วด้านขวา = หมุนกล้อง · ถ่างสองนิ้ว = ซูม</li><li>ปุ่มกลมใหญ่ขวาล่าง = ทำสิ่งที่แสดง (ปลูก รดน้ำ เก็บ ฯลฯ)</li>` : `
        <li><kbd>W A S D</kbd> เดิน · <kbd>Shift</kbd> วิ่ง</li><li>ลากเมาส์ = หมุนกล้อง · ล้อเมาส์ = ซูม</li><li><kbd>E</kbd> หรือ <kbd>Space</kbd> = ทำสิ่งที่แสดง · <kbd>F</kbd> ขึ้น/ลงรถ</li><li><kbd>1-9</kbd> เลือกของ · <kbd>I</kbd> กระเป๋า · <kbd>M</kbd> แผนที่</li>`}</ul></div>
      <div class="hc"><h5>🌱 ปลูกผัก</h5><ul><li>เดินไปที่แปลงดิน เกมจะเลือกให้เองว่าจะปลูก รดน้ำ หรือเก็บเกี่ยว</li><li>ผักโตเฉพาะตอนดินชื้น (สีเข้ม) ไอคอน 💧 = ต้องรดน้ำ</li><li>บัวรดน้ำหมด เติมได้ที่บ่อน้ำ · ฝนตกช่วยรดให้ฟรี</li><li>ซื้อสปริงเกอร์ วางระหว่างแปลง รดน้ำเองทุกเช้าและบ่าย</li></ul></div>
      <div class="hc"><h5>🐔 เลี้ยงสัตว์</h5><ul><li>ซื้อสัตว์ที่ฟาร์มปศุสัตว์ในหมู่บ้าน</li><li>เติมอาหารในรางทุกวัน สัตว์จะให้ไข่ นม ขนแกะทุกเช้า</li><li>ลูบหัวทุกวัน ถ้าความสุขถึง 80% ได้ผลผลิต 2 เท่า</li></ul></div>
      <div class="hc"><h5>⭐ ระดับและคุณภาพ</h5><ul><li>ทำงานในฟาร์มได้ค่าประสบการณ์ ระดับสูงขึ้นได้พลังงานเพิ่มและปลดล็อกเมล็ดพันธุ์ใหม่</li><li>ผักที่รดน้ำสม่ำเสมอ ใส่ปุ๋ย และดินดี มีโอกาสได้คุณภาพ ★ (+25%) หรือ ★★ (+50%)</li></ul></div>
      <div class="hc"><h5>📋 ออเดอร์และเพื่อนบ้าน</h5><ul><li>กระดานที่ลานน้ำพุมีออเดอร์ใหม่ทุกเช้า ส่งครบได้เงินและความสนิท</li><li>คุยกับชาวบ้านทุกวันและให้ของขวัญ ครบ 3/6/10 หัวใจจะได้ของตอบแทน</li><li>สนิทกับคนขายของ 5 หัวใจได้ส่วนลด 10%</li></ul></div>
      <div class="hc"><h5>🏠 ในบ้าน</h5><ul><li>ตู้เสื้อผ้า: แต่งตัวและตั้งชื่อ · หีบ: เก็บของ · ฝักบัว: +30 พลังงานวันละครั้ง</li><li>คอมพิวเตอร์: ช้อปออนไลน์ ของมาส่งพรุ่งนี้เช้า · ปฏิทิน: ดูฤดูและพยากรณ์</li><li>รับสุนัขหรือแมวได้ที่ฟาร์มปศุสัตว์ มันจะเดินตามคุณ</li></ul></div>
      <div class="hc"><h5>🎣 ตกปลา</h5><ul><li>ซื้อคันเบ็ดที่ร้านเกษตร แล้วไปที่บ่อในฟาร์ม (ถือคันเบ็ด) หรือท่าเรือริมทะเล</li><li>เมื่อทุ่นจมและมี ❗ ให้แตะทันที</li><li>กดค้างให้แถบสีเขียวเลื่อนขวา ปล่อยให้เลื่อนซ้าย คุมให้ปลาอยู่ในแถบจนหลอดเต็ม</li><li>กลางคืนมีโอกาสเจอปลาหายาก</li></ul></div>
      <div class="hc"><h5>💰 ขาย กิน และแต่งบ้าน</h5><ul><li>ส่งขายที่กล่องหน้าบ้าน หรือขับรถไปตลาดริมทะเล ได้ราคา +50%</li><li>กินของในกระเป๋าเพื่อเพิ่มพลังงาน ทำอาหารที่ครัวในบ้าน</li><li>นอนบนเตียงเพื่อข้ามไปเช้าวันใหม่ ถ้าไม่นอนจนตี 2 จะเผลอหลับ</li><li>ร้านช่างไม้: อัปเกรดบ้าน แปลงผัก ดิน คอกสัตว์ และซื้อเฟอร์นิเจอร์</li></ul></div>
      </div><div class="row end"><button class="btn big" data-a="close">เข้าใจแล้ว ไปทำฟาร์มกัน!</button></div>`, { wide: true });
  },
};
