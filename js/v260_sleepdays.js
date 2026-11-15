'use strict';
// ---------- v260: choose how many days to sleep (1-30) ----------
// Pressing "นอนหลับถึงเช้า" on a bed now asks for the number of nights: 1, 2, 3, 5, 7, 10, 14, 21, 30 or any number from 1 to 30.
// One night is exactly what it was. More nights run the normal days in between (jobs, bills, companies, weather...) and you wake up the morning after the last night.
// Your hunger and thirst never fall below 20 while you sleep (you eat and drink a little in your sleep), mood is untouched.
// Not offered in real-time mode (there sleeping does not move the clock).
V23.add('v260_sleepdays', function () {
  if (typeof UI === 'undefined' || typeof Emergency === 'undefined' || !Emergency.overnight) return;
  const MAX = 30, QUICK = [1, 2, 3, 5, 7, 10, 14, 21, 30], TITLE = 'นอนหลับถึงเช้า?';
  let sel = 1, pend = 0, fn0 = null, timer = 0;
  const clampN = v => Math.max(1, Math.min(MAX, Math.round(+v) || 1));
  const real = () => { try { return typeof TimeMode !== 'undefined' && TimeMode.real(); } catch (e) { return false; } };
  const html = () => {
    const d = clampN(sel), wake = (typeof RD === 'function') ? RD(S.day + d - (S.time < 360 ? 1 : 0)) : '';
    return `<p class="lead">เลือกจำนวนคืนที่จะนอน (สูงสุด ${MAX} วัน) พลังงานจะเต็ม และเกมจะบันทึกอัตโนมัติ</p>
      <div class="row" style="flex-wrap:wrap;gap:8px">${QUICK.map(n => `<button class="btn ${d === n ? '' : 'ghost'}" style="min-width:64px;min-height:46px" data-a="sd260pick" data-v="${n}">${n === 1 ? 'คืนเดียว' : n + ' วัน'}</button>`).join('')}</div>
      <div class="row" style="align-items:center;gap:8px;margin-top:8px"><label for="sd260n">หรือกำหนดเอง</label><input id="sd260n" type="number" min="1" max="${MAX}" step="1" inputmode="numeric" value="${d}" style="width:84px;min-height:42px;font-size:16px;text-align:center"><button class="btn ghost" data-a="sd260set">ตกลง</button><span class="dim">วัน</span></div>
      <p class="dim" style="margin-top:8px">${d > 1 ? `จะตื่นเช้า${E(wake)} · ระหว่างนั้นเวลาในเกมเดินต่อ งานประจำ บิล ธุรกิจ และนัดหมายจะผ่านไปตามปกติ (ความหิวกระหายไม่ต่ำกว่า 20)` : 'นอนหนึ่งคืนตื่นเช้าวันถัดไป'}</p>
      <div class="row end"><button class="btn ghost" data-a="close">ยกเลิก</button><button class="btn" data-a="sd260go">🛏️ นอน ${d === 1 ? 'คืนเดียว' : d + ' วัน'}</button></div>`;
  };
  const E = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const _c = UI.confirm.bind(UI);
  UI.confirm = function (title, text, ok, fn) {
    if (title !== TITLE || real() || typeof fn !== 'function') return _c(title, text, ok, fn);
    sel = 1; fn0 = fn; UI.open('🛏️ นอนหลับ', null, html);
  };
  Object.assign(UI.H, {
    sd260pick: d => { sel = clampN(d.v); UI.renderBody(); },
    sd260set: () => { const i = document.getElementById('sd260n'); sel = clampN(i && i.value); UI.renderBody(); },
    sd260go: () => {
      const i = document.getElementById('sd260n'); if (i && i.value) sel = clampN(i.value); const f = fn0; fn0 = null; if (!f) return;
      pend = sel; clearTimeout(timer); timer = setTimeout(() => { pend = 0; }, 3000);   // the night starts within a second; never keep a stale request
      UI.close(); f();
    },
  });
  // the extra nights run inside the normal sleep (Emergency.overnight is the first step of both bed routines)
  const _o = Emergency.overnight.bind(Emergency);
  Emergency.overnight = function () {
    const r = _o.apply(this, arguments), extra = pend - 1; pend = 0;
    if (extra > 0 && typeof simulate === 'function') {
      try { simulate(extra * 1440); } catch (e) { console.warn('v260 sleep', e); }
      S.hunger = Math.max(S.hunger == null ? 80 : S.hunger, 30); S.thirst = Math.max(S.thirst == null ? 80 : S.thirst, 30);
      try { UI.toast(`นอนหลับไป ${extra + 1} วัน`, '🛏️'); } catch (e) { }
    }
    return r;
  };
  window.SleepDays260 = { MAX, QUICK, pending: () => pend };
});
