'use strict';
// ---------- Smartphone: emergency calls, messages, bank & savings, weather, camera, contacts, online chat ----------
const BANK = { rate: 0.0008, fixedDays: 7, fixedRate: 0.006, fixedMin: 1000 };
const APPS = [
  { id: 'call', i: '📞', n: 'โทรศัพท์' }, { id: 'msgs', i: '✉️', n: 'ข้อความ' }, { id: 'bank', i: '🏦', n: 'ธนาคาร' },
  { id: 'wx', i: '🌦️', n: 'อากาศ' }, { id: 'cam', i: '📷', n: 'กล้อง' }, { id: 'map', i: '🗺️', n: 'แผนที่' },
  { id: 'shop', i: '🛒', n: 'ช้อปออนไลน์' }, { id: 'food', i: '🛵', n: 'สั่งอาหาร' }, { id: 'biz', i: '💼', n: 'ธุรกิจฟาร์ม' }, { id: 'pets', i: '🐾', n: 'สัตว์เลี้ยง' }, { id: 'diary', i: '📔', n: 'ไดอารี่' }, { id: 'invite', i: '📅', n: 'นัดหมาย' }, { id: 'cards', i: '💌', n: 'ส่งการ์ด' }, { id: 'jobs', i: '🧰', n: 'งานพิเศษ' }, { id: 'taxi', i: '🚕', n: 'แท็กซี่ & รถลาก' }, { id: 'missions', i: '🎯', n: 'ภารกิจ' }, { id: 'ach', i: '🏅', n: 'ความสำเร็จ' }, { id: 'board', i: '🏆', n: 'อันดับออนไลน์' }, { id: 'chat', i: '🌐', n: 'แชทออนไลน์' }, { id: 'people', i: '📇', n: 'รายชื่อ' },
  { id: 'guide', i: '📚', n: 'คู่มือ' }, { id: 'set', i: '⚙️', n: 'ตั้งค่า' },
];

const Bank = {
  st() {
    if (!S.bank) S.bank = { sav: 0, fixed: [], jars: [], earned: 0 };
    return S.bank;
  },
  total() { const b = this.st(); return b.sav + b.fixed.reduce((s, f) => s + f.amt, 0) + b.jars.reduce((s, j) => s + j.amt, 0); },
  deposit(n) { n = Math.min(+n, S.money); if (!(n > 0)) return; S.money -= n; this.st().sav += n; Sfx.coin(); },
  withdraw(n) { const b = this.st(); n = Math.min(+n, b.sav); if (!(n > 0)) return; b.sav -= n; S.money += n; Sfx.coin(); },
  fix(n) {
    if (n < BANK.fixedMin || S.money < n) return;
    S.money -= n; this.st().fixed.push({ amt: n, due: S.day + BANK.fixedDays }); Sfx.coin();
    UI.toast(`ฝากประจำ ${baht(n)} ครบกำหนด${RD(S.day + BANK.fixedDays)} ได้ดอกเบี้ย ${(BANK.fixedRate * 100).toFixed(1)}%`, '🏦');
  },
  jar(name, goal) { this.st().jars.push({ n: name, goal, amt: 0 }); },
  putJar(i, n) {
    const j = this.st().jars[i]; if (!j) return; n = Math.min(n, S.money, j.goal - j.amt); if (n <= 0) return;
    S.money -= n; j.amt += n; Sfx.coin();
    if (j.amt >= j.goal) UI.toast(`กระปุก "${j.n}" ครบเป้าหมายแล้ว! ทุบกระปุกได้เลย`, '🐷');
  },
  breakJar(i) { const b = this.st(), j = b.jars[i]; if (!j) return; S.money += j.amt; b.jars.splice(i, 1); Sfx.coin(); UI.toast(`ทุบกระปุก "${j.n}" ได้ ${baht(j.amt)}`, '🐷'); },
  day() {
    const b = this.st();
    const it = Math.floor(b.sav * BANK.rate);
    if (it > 0) { b.sav += it; b.earned += it; }
    for (const f of b.fixed.slice()) if (S.day >= f.due) {
      const gain = Math.round(f.amt * BANK.fixedRate); b.sav += f.amt + gain; b.earned += gain; b.fixed.splice(b.fixed.indexOf(f), 1);
      Phone.msg('ธนาคารสุขใจ', `เงินฝากประจำ ${baht(f.amt)} ครบกำหนดแล้ว ได้ดอกเบี้ย ${baht(gain)} โอนเข้าบัญชีออมทรัพย์เรียบร้อย`);
    }
    if (it >= 5) Phone.msg('ธนาคารสุขใจ', `ดอกเบี้ยออมทรัพย์วันนี้ ${baht(it)} · ยอดออม ${baht(b.sav)}`, true);
  },
};

const Phone = {
  app: null, shots: [], callLog: [],
  msg(from, text, quiet) {
    S.msgs = S.msgs || []; S.msgs.unshift({ from, text, day: S.day, time: S.time, read: false }); S.msgs.length = Math.min(S.msgs.length, 40);
    if (!quiet) UI.toast(`ข้อความจาก${from}: ${text.length > 40 ? text.slice(0, 40) + '…' : text}`, '📱');
    this.badge();
  },
  unread() { return (S.msgs || []).filter(m => !m.read).length; },
  badge() { const b = document.getElementById('bPhone'); if (b) b.dataset.n = this.unread() || ''; },
  open(app) {
    this.app = app || null; Tutorial.phoned = true;
    UI.open('มือถือ', null, () => this.render(), {});
    $('modal').classList.add('phone');
    UI.cur.onClose = () => $('modal').classList.remove('phone');
  },
  clock() { const h = Math.floor(S.time / 60) % 24, m = Math.floor(S.time % 60); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; },
  render() {
    const top = `<div class="ph-top"><span>${this.clock()}</span><span>${WEATHER[S.weather.type].i} 📶 🔋</span></div>`;
    if (!this.app) return top + `<div class="apps">${APPS.map(a => `<button data-a="app" data-v="${a.id}"><span>${a.i}${a.id === 'msgs' && this.unread() ? `<i>${this.unread()}</i>` : ''}</span>${a.n}</button>`).join('')}</div>
      <div class="ph-sos"><button class="btn danger" data-a="dial" data-v="191">🚓 191</button><button class="btn danger" data-a="dial" data-v="199">🚒 199</button><button class="btn danger" data-a="dial" data-v="1669">🚑 1669</button></div>`;
    const back = `<button class="btn ghost ph-back" data-a="app" data-v="">‹ หน้าหลัก</button>`;
    return top + back + (this.apps[this.app] ? this.apps[this.app].call(this) : '');
  },
  apps: {
    call() {
      const em = [['191', '🚓', 'ตำรวจ', 'แจ้งขโมย คนร้าย อุบัติเหตุ'], ['199', '🚒', 'ดับเพลิง', 'แจ้งไฟไหม้ รถดับเพลิงจะมาดับให้'], ['1669', '🚑', 'กู้ภัย/รถพยาบาล', 'บาดเจ็บ หมดแรง ให้รับไปส่งบ้าน']];
      const ppl = G.npcs.filter(n => Friends.get(n.name) >= 2 || n.single);
      return `<h5>เบอร์ฉุกเฉิน</h5><div class="grid">${em.map(([no, i, n, d]) => `<div class="card"><div class="ci">${i}</div><div class="cb"><h4>${n} ${no}</h4><p class="dim">${d}</p><div class="row"><button class="btn danger" data-a="dial" data-v="${no}">โทร ${no}</button></div></div></div>`).join('')}</div>
        <h5>โทรหาชาวบ้าน (สนิท 2 หัวใจขึ้นไป)</h5>${ppl.length ? `<div class="grid">${ppl.map(n => `<div class="card"><div class="ci">${n.single ? '💗' : '🙂'}</div><div class="cb"><h4>${esc(n.name)}</h4><p class="dim">${'❤️'.repeat(Math.floor(Friends.get(n.name)))}</p><div class="row"><button class="btn ghost" data-a="ring" data-v="${esc(n.name)}">โทรคุย</button></div></div></div>`).join('')}</div>` : '<p class="empty">ยังไม่มีเบอร์ใคร คุยกับชาวบ้านทุกวันให้สนิทก่อนนะ</p>'}
        ${Phone.callLog.length ? `<h5>ประวัติการโทร</h5><ul class="lead">${Phone.callLog.slice(0, 6).map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}`;
    },
    msgs() {
      const m = S.msgs || []; m.forEach(x => x.read = true); Phone.badge();
      return m.length ? `<div class="msgs">${m.map(x => `<div class="msg"><b>${esc(x.from)}</b><small>${RD(x.day)}</small><p>${esc(x.text)}</p></div>`).join('')}</div>` : '<p class="empty">ยังไม่มีข้อความ</p>';
    },
    bank() {
      const b = Bank.st();
      return `<p class="dim">🧾 บิลทั้งหมด (ไฟ น้ำ เน็ต ภาษี ฯลฯ) ดูและชำระได้ที่หมวด "บิล & ค่าบริการ" ในมือถือ และแอปธนาคาร แท็บ บิล</p>` + `<div class="bank"><p class="lead">ยอดเงินรวมในธนาคาร <b class="good">${baht(Bank.total())}</b> · ดอกเบี้ยที่ได้แล้ว ${baht(b.earned)}</p>
        <div class="card"><div class="ci">💰</div><div class="cb"><h4>ออมทรัพย์ ${baht(b.sav)}</h4><p class="dim">ดอกเบี้ย ${(BANK.rate * 100).toFixed(1)}% ต่อวัน ถอนได้ตลอด · ใช้พักเงินให้งอกเงย</p>
          <div class="row"><button class="btn" data-a="dep" data-v="100">ฝาก 100</button><button class="btn" data-a="dep" data-v="1000">ฝาก 1,000</button><button class="btn" data-a="dep" data-v="half">ฝากครึ่ง</button></div>
          <div class="row"><button class="btn ghost" data-a="wd" data-v="100">ถอน 100</button><button class="btn ghost" data-a="wd" data-v="1000">ถอน 1,000</button><button class="btn ghost" data-a="wd" data-v="all">ถอนหมด</button></div></div></div>
        <div class="card"><div class="ci">📈</div><div class="cb"><h4>ฝากประจำ ${BANK.fixedDays} วัน (+${(BANK.fixedRate * 100).toFixed(1)}%)</h4><p class="dim">ขั้นต่ำ ${baht(BANK.fixedMin)} · ถอนก่อนครบไม่ได้ แต่ได้ดอกเบี้ยสูงกว่า</p>
          ${b.fixed.map(f => `<p>🔒 ${baht(f.amt)} · ครบ${RD(f.due)} (อีก ${Math.max(0, f.due - S.day)} วัน)</p>`).join('')}
          <div class="row"><button class="btn" data-a="fix" data-v="1000" ${S.money < 1000 ? 'disabled' : ''}>ฝาก 1,000</button><button class="btn" data-a="fix" data-v="5000" ${S.money < 5000 ? 'disabled' : ''}>ฝาก 5,000</button></div></div></div>
        <div class="card"><div class="ci">🐷</div><div class="cb"><h4>กระปุกออมตามเป้าหมาย</h4><p class="dim">แยกเงินเก็บไว้ซื้อของชิ้นใหญ่ กันเผลอใช้หมด</p>
          ${b.jars.map((j, i) => `<div class="jar"><b>${esc(j.n)}</b> ${baht(j.amt)} / ${baht(j.goal)}<div class="bar"><i style="width:${Math.min(100, j.amt / j.goal * 100)}%"></i></div>
            <div class="row"><button class="btn" data-a="pj" data-i="${i}" data-v="100">หยอด 100</button><button class="btn" data-a="pj" data-i="${i}" data-v="1000">หยอด 1,000</button><button class="btn ghost" data-a="bj" data-i="${i}">ทุบกระปุก</button></div></div>`).join('')}
          <div class="row">${[['รถคันใหม่', 20000], ['แหวนแต่งงาน', 8000], ['อัปเกรดบ้าน', 15000], ['ทั่วไป', 3000]].map(([n, g]) => `<button class="btn ghost" data-a="nj" data-n="${n}" data-v="${g}">+ ${n} ${U.fmt(g)}</button>`).join('')}</div></div></div></div>`;
    },
    wx() {
      const n = WEATHER[S.weather.next], c = WEATHER[S.weather.type], se = season();
      const hot = hotCrops().slice(0, 3).map(k => `${CROPS[k].i} ${CROPS[k].n} ${baht(priceOf(k))}`).join(' · ');
      return `<div class="card"><div class="ci">${c.i}</div><div class="cb"><h4>วันนี้: ${c.n}</h4><p class="dim">${se.i} ${se.n} ${RD(S.day)}</p></div></div>
        <div class="card"><div class="ci">${n.i}</div><div class="cb"><h4>พรุ่งนี้: ${n.n}</h4><p class="dim">${n.rain > 0.3 ? 'ฝนจะรดน้ำผักให้ ไม่ต้องรดเอง' : 'ไม่มีฝน อย่าลืมรดน้ำผัก'}${n.storm ? ' · ระวังฟ้าผ่าและไฟไหม้!' : ''}</p></div></div>
        ${Gadgets.has('wxstation') && S.weather.next2 ? `<div class="card"><div class="ci">${WEATHER[S.weather.next2].i}</div><div class="cb"><h4>มะรืนนี้: ${WEATHER[S.weather.next2].n}</h4><p class="dim">จากสถานีตรวจอากาศที่บ้าน</p></div></div>` : ''}
        <p class="lead">📈 ราคาเด่นวันนี้: ${hot}</p>`;
    },
    cam() {
      return `<p class="lead">ถ่ายภาพวิวตอนนี้ (ปิดหน้าจอมือถือชั่วครู่) แล้วกดค้าง/คลิกขวาที่รูปเพื่อบันทึก หรือกดปุ่มบันทึกลงเครื่อง</p>
        <div class="row"><button class="btn big" data-a="snap">📸 ถ่ายรูป</button></div>
        <div class="gallery">${Phone.shots.map((s, i) => `<figure><img src="${s}" alt="รูปที่ ${i + 1}"><a class="btn ghost" download="raisukjai-${i + 1}.jpg" href="${s}">บันทึกลงเครื่อง</a></figure>`).join('') || '<p class="empty">ยังไม่มีรูป</p>'}</div>`;
    },
    chat() {
      if (!Net.on) return '<p class="empty">ยังไม่ได้เชื่อมต่อเซิร์ฟเวอร์ · เปิดเกมผ่าน start-server.bat แล้วเข้าทาง http://IP:พอร์ต เพื่อเล่นออนไลน์และแชท</p>';
      return `<p class="lead">ผู้เล่นออนไลน์ตอนนี้ ${Net.others.size + 1} คน</p><div class="msgs">${Net.chat.slice(-30).reverse().map(m => `<div class="msg"><b>${esc(m.name)}</b><p>${esc(m.text)}</p></div>`).join('') || '<p class="empty">ยังไม่มีข้อความ</p>'}</div>
        <div class="row"><input id="chatIn" maxlength="120" placeholder="พิมพ์ข้อความ..." style="flex:1"><button class="btn" data-a="send">ส่ง</button></div>`;
    },
    people() {
      const ppl = G.npcs.filter(n => S.friends[n.name] != null || n.single);
      return `<p class="lead">ความสนิทกับชาวบ้าน · คุยทุกวัน +¼ ให้ของขวัญ +1 ของโปรด +2</p><div class="grid">${ppl.map(n => `<div class="card"><div class="ci">${n.single ? '💗' : n.keeper ? '🏪' : '🙂'}</div><div class="cb"><h4>${esc(n.name)} ${Social.status(n.name)}</h4><p class="dim">${'❤️'.repeat(Math.floor(Friends.get(n.name))) || '🤍'} · ${esc(Social.profile(n).job || (People.prof(n.name) || {}).job || 'ชาวบ้าน')}</p></div></div>`).join('') || '<p class="empty">ยังไม่รู้จักใคร</p>'}</div>`;
    },
  },
  snap() {
    UI.close(); G.renderer.render(G.scene, G.camera);
    let url = ''; try { url = G.renderer.domElement.toDataURL('image/jpeg', 0.8); } catch (e) { }
    Sfx.burst(0.08, 4000, 'highpass', 0.3);
    const f = document.getElementById('fade'); f.style.background = '#fff'; f.classList.add('on'); setTimeout(() => { f.classList.remove('on'); setTimeout(() => f.style.background = '', 300); }, 90);
    if (url) { this.shots.unshift(url); this.shots.length = Math.min(this.shots.length, Gadgets.has('phonepro') ? 24 : 8); UI.toast('ถ่ายรูปแล้ว ดูได้ในแอปกล้อง', '📷'); }
  },
  ring(name) {
    const n = G.npcs.find(x => x.name === name); if (!n) return;
    Sfx.tone(440, 0.15, 'sine', 0.05); setTimeout(() => Sfx.tone(440, 0.15, 'sine', 0.05), 400);
    const line = Social.phoneLine(n); this.callLog.unshift(`โทรหา${name} ${RD(S.day)}`);
    Friends.talk(n); UI.toast(`${name}: “${line}”`, '📞');
  },
  dial(no) {
    this.callLog.unshift(`โทร ${no} ${RD(S.day)}`); UI.close();
    Sfx.tone(480, 0.3, 'sine', 0.05); setTimeout(() => Emergency.call(no === '191' ? 'police' : no === '199' ? 'fire' : 'ems'), 700);
  },
};

UI.H.app = d => { Phone.app = d.v || null; Sfx.click(); };
UI.H.dial = d => Phone.dial(d.v);
UI.H.ring = d => Phone.ring(d.v);
UI.H.dep = d => Bank.deposit(d.v === 'half' ? Math.floor(S.money / 2) : +d.v);
UI.H.wd = d => Bank.withdraw(d.v === 'all' ? Bank.st().sav : +d.v);
UI.H.fix = d => Bank.fix(+d.v);
UI.H.nj = d => Bank.jar(d.n, +d.v);
UI.H.pj = d => Bank.putJar(+d.i, +d.v);
UI.H.bj = d => Bank.breakJar(+d.i);
UI.H.snap = () => Phone.snap();
UI.H.send = () => { const el = $('chatIn'); if (el && el.value.trim()) { Net.say(el.value); el.value = ''; } };
Phone.apps.food = () => Food.deliveryHTML();
Phone.apps.biz = () => Farm2.bizHTML();
Phone.apps.pets = () => { setTimeout(() => { Phone.app = null; UI.close(); Pets2.ui(); }, 0); return ''; };
Phone.apps.diary = () => Life2.diaryHTML();
Phone.apps.invite = () => Social2.inviteHTML();
Phone.apps.taxi = () => Town2.taxiHTML();
Phone.apps.missions = () => Events.missionsHTML();
Phone.apps.ach = () => Events.achHTML();
Phone.apps.board = () => Events.boardView();
Phone.apps.cards = () => Social2.cardHTML();
Phone.apps.jobs = () => { setTimeout(() => { Phone.app = null; UI.close(); Life2.jobsUI(); }, 0); return ''; };
const phoneGo = fn => () => { setTimeout(() => { Phone.app = null; UI.close(); fn(); }, 0); return ''; };
Phone.apps.map = phoneGo(() => UI.bigMap());
Phone.apps.shop = phoneGo(() => UI.shop('online'));
Phone.apps.guide = phoneGo(() => Guide.open(0));
Phone.apps.set = phoneGo(() => UI.menu());
