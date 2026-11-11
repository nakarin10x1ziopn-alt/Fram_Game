'use strict';
// ---------- v196_savefile: back the save up to a FILE and bring it back ----------
// The save lives in the browser of the device; clearing the browsing history / website data deletes it. Now every slot can be exported to a file (on an iPad it goes through the share sheet
// to "Save to Files" / iCloud Drive / AirDrop / LINE ...) and imported again on any device. Available on the start screen and in the slot window. The browser is also asked to keep the data ("persistent storage").
V23.add('v196_savefile', () => {
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => { }); } catch (e) { }
  const esc2 = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const stamp = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`; };
  const toast = (t, i) => { try { UI.toast(t, i || '💾'); } catch (e) { alert(t); } };
  function exportSlot(n) {
    n = n || Slots.cur();
    try { if (G.started && S && n === Slots.cur()) saveGame(true); } catch (e) { }
    const raw = safeGet(Slots.key(n)) || safeGet(Slots.key(n) + '_bak');
    if (!raw || raw.length < 100) { toast(`ช่อง ${n} ยังไม่มีเซฟให้ส่งออก`, '⚠️'); return; }
    let save; try { save = JSON.parse(raw); } catch (e) { toast('เซฟช่องนี้อ่านไม่ได้', '⚠️'); return; }
    const text = JSON.stringify({ raisukjai_backup: 1, slot: n, time: new Date().toISOString(), save });
    const name = `raisukjai-save-ช่อง${n}-${stamp()}.json`;
    const file = (typeof File === 'function') ? new File([text], name, { type: 'application/json' }) : null;
    const done = () => { try { localStorage.setItem('raisukjai_lastexp', String(Date.now())); } catch (e) { } toast(`ส่งออกเซฟช่อง ${n} แล้ว เก็บไฟล์ไว้ให้ดี`, '💾'); };
    const dl = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000); done(); };
    try { if (file && navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: 'เซฟไร่สุขใจ' }).then(done, e => { if (e && e.name !== 'AbortError') dl(); }); return; } } catch (e) { }
    dl();
  }
  function importFile() {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json,text/plain'; inp.style.display = 'none'; document.body.appendChild(inp);
    inp.addEventListener('change', () => {
      const f = inp.files && inp.files[0]; inp.remove(); if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        let o; try { o = JSON.parse(String(rd.result)); } catch (e) { toast('ไฟล์นี้ไม่ใช่ไฟล์เซฟของเกม', '⚠️'); return; }
        const save = o && o.raisukjai_backup ? o.save : o;
        if (!save || typeof save !== 'object' || typeof save.money !== 'number' || typeof save.day !== 'number') { toast('ไฟล์นี้ไม่ใช่ไฟล์เซฟของเกม', '⚠️'); return; }
        const n = Slots.cur(), has = Slots.has(n);
        const go = () => {
          Slots.deleting = n;   // nothing may write the slot again before the reload
          safeSet(Slots.key(n) + '_bak', safeGet(Slots.key(n)) || '');   // the save that is replaced stays as the automatic backup
          if (!safeSet(Slots.key(n), JSON.stringify(save))) { Slots.deleting = 0; toast('เก็บเซฟไม่สำเร็จ (พื้นที่เบราว์เซอร์เต็ม?)', '⚠️'); return; }
          toast('นำเข้าเซฟสำเร็จ กำลังโหลดใหม่...', '✅'); setTimeout(() => location.reload(), 700);
        };
        if (has) UI.confirm(`นำเข้าเซฟไปที่ช่อง ${n}?`, `เซฟในไฟล์: ${save.name || 'ชาวไร่'} · เงิน ${Math.round(save.money).toLocaleString()} ฿ · วันที่ ${save.day} — จะทับเซฟช่อง ${n} ที่มีอยู่ (เซฟเดิมถูกเก็บเป็นสำรองอัตโนมัติ 1 ชุด)`, 'นำเข้า', go);
        else go();
      };
      rd.readAsText(f);
    });
    inp.click();
  }
  UI.H.slotexp = d => exportSlot(+d.v || Slots.cur());
  UI.H.slotimp = () => importFile();
  // the slot window
  const slotsWin = UI.H.slots;
  UI.H.slots = () => UI.open('ช่องบันทึกเกม', null, () => `<p class="lead">เล่นได้ 3 เซฟแยกกัน กดช่องอื่นเพื่อบันทึกเกมนี้แล้วสลับไป</p><div class="menu">${[1, 2, 3].map(n => `<div class="row"><button class="btn ${n === Slots.cur() ? '' : 'ghost'}" data-a="slotuse" data-v="${n}">💾 ช่อง ${n}${n === Slots.cur() ? ' (กำลังเล่น)' : ''} — ${esc2(Slots.info(n))}</button><button class="btn ghost" data-a="slotexp" data-v="${n}">⬇️ ส่งออก</button><button class="btn ghost danger" data-a="slotdel" data-v="${n}">🗑️ ลบ</button></div>`).join('')}</div>
    <h5>สำรองเซฟเป็นไฟล์</h5><p class="dim">เซฟอยู่ในเบราว์เซอร์ของเครื่องนี้ ถ้าล้างประวัติท่องเว็บ/ข้อมูลเว็บไซต์ เซฟจะหาย — ส่งออกเป็นไฟล์เก็บไว้ (บน iPad เลือก "บันทึกไปยังไฟล์" หรือ iCloud Drive) แล้วนำเข้ากลับได้เสมอ</p><div class="row"><button class="btn" data-a="slotimp">⬆️ นำเข้าเซฟจากไฟล์ (ลงช่องที่กำลังเล่น)</button><button class="btn" data-a="cloudsave">☁️ เซฟออนไลน์ (รหัส)</button></div>`);
  // the start screen: two small buttons under the slots
  if (Slots.initStart) { const _is = Slots.initStart.bind(Slots); Slots.initStart = function () { _is(); try { const box = document.getElementById('slots'); if (!box || document.getElementById('slotfile196')) return; const row = document.createElement('div'); row.id = 'slotfile196'; row.style.cssText = 'display:flex;gap:8px;justify-content:center;margin:8px 0;flex-wrap:wrap';
      row.innerHTML = '<button class="btn ghost" id="sfExp196" style="min-height:0;padding:6px 12px;font-size:13px">⬇️ สำรองเซฟเป็นไฟล์</button><button class="btn ghost" id="sfImp196" style="min-height:0;padding:6px 12px;font-size:13px">⬆️ นำเข้าเซฟจากไฟล์</button><button class="btn ghost" id="sfCloud196" style="min-height:0;padding:6px 12px;font-size:13px">☁️ เซฟออนไลน์ (รหัส)</button>';
      box.parentNode.insertBefore(row, box.nextSibling);
      document.getElementById('sfExp196').onclick = () => exportSlot(Slots.cur()); document.getElementById('sfImp196').onclick = () => importFile(); document.getElementById('sfCloud196').onclick = () => UI.H.cloudsave(); } catch (e) { console.warn('v196 savefile', e); } }; }
  // a reminder once in a while (not more than every 5 real days, only when the save is worth keeping)
  setTimeout(() => { try { const last = +localStorage.getItem('raisukjai_lastexp') || 0, rem = +localStorage.getItem('raisukjai_lastrem') || 0, now = Date.now(); if (G.started && S && S.day > 3 && now - last > 5 * 86400000 && now - rem > 5 * 86400000) { localStorage.setItem('raisukjai_lastrem', String(now)); toast('อย่าลืมสำรองเซฟเป็นไฟล์: เมนูช่องบันทึกเกม → ⬇️ ส่งออก (กันเซฟหายถ้าล้างประวัติเว็บ)', '💾'); } } catch (e) { } }, 20000);
  // ---- cloud save window (only when the host offers /api/save: framgame.vercel.app) ----
  const hhmm = t => { const d = new Date(t), p = n => String(n).padStart(2, '0'); return `${p(d.getHours())}:${p(d.getMinutes())}`; };
  const cloudHtml = () => {
    if (!Net.cloud) return `<p class="lead">☁️ เซฟออนไลน์ใช้ได้เมื่อเล่นผ่านเว็บ <b>framgame.vercel.app</b> (เปิดออนไลน์ และไม่ได้เปิดจากไฟล์ในเครื่อง)</p><p class="dim">ตอนนี้เซฟอยู่ในเบราว์เซอร์ของเครื่องนี้เท่านั้น ใช้ปุ่ม ⬇️ ส่งออก เพื่อสำรองเป็นไฟล์ได้</p>`;
    const st = Net.cloudErr ? `<span class="bad">⚠️ ซิงก์ไม่สำเร็จ (${esc2(Net.cloudErr)}) จะลองใหม่อัตโนมัติ</span>` : (Net.cloudAt ? `<span class="good">✅ ซิงก์ล่าสุด ${hhmm(Net.cloudAt)}</span>` : 'รอซิงก์...');
    return `<p class="lead">เซฟทั้ง 3 ช่องถูกเก็บออนไลน์อัตโนมัติ ใช้ <b>รหัสนี้</b> เปิดเซฟเดิมได้จากทุกเบราว์เซอร์ ทุกเครื่อง แม้ล้างประวัติเว็บ</p>
      <p class="lead" style="text-align:center"><b style="font-size:1.5em;letter-spacing:2px;user-select:all">${Net.cloudCodeShown()}</b></p>
      <div class="row"><button class="btn" data-a="cloudcopy">📋 คัดลอกรหัส</button></div>
      <p class="dim">${st} · <b>จดรหัสนี้เก็บไว้</b> ใครมีรหัสนี้เปิดเซฟของคุณได้ อย่าแจกให้คนอื่น</p>
      <h5>เปลี่ยนไปใช้เซฟจากรหัสอื่น (เครื่องใหม่ / เบราว์เซอร์ใหม่)</h5>
      <div class="row"><input id="cloudIn196" placeholder="xxxx-xxxx-xxxx-xxxx" autocapitalize="off" autocomplete="off" spellcheck="false" style="width:15em;font-size:16px;padding:8px;border-radius:10px;border:1px solid #ccc"><button class="btn ghost" data-a="cloudapply">ใช้รหัสนี้</button></div>
      <p class="dim">เซฟในเครื่องที่ใหม่กว่าจะถูกส่งขึ้นรหัสนั้น ส่วนเซฟที่เก่ากว่าถูกแทนที่ (เก็บสำรองไว้ 1 ชุด)</p>`;
  };
  UI.H.cloudsave = () => UI.open('☁️ เซฟออนไลน์', null, cloudHtml);
  UI.H.cloudcopy = () => { const c = Net.cloudCodeShown(); try { navigator.clipboard.writeText(c).then(() => toast('คัดลอกรหัสแล้ว: ' + c, '📋'), () => toast('รหัสของคุณ: ' + c, '☁️')); } catch (e) { toast('รหัสของคุณ: ' + c, '☁️'); } };
  UI.H.cloudapply = async () => {
    const v = (document.getElementById('cloudIn196') || {}).value || '';
    const old = Net.cloudCode();
    if (!Net.setCloudCode(v)) { toast('รหัสต้องมี 16 ตัว (ตัวอักษร/ตัวเลข) ตรวจอีกครั้ง', '⚠️'); return; }
    if (Net.cloudCode() === old) { toast('นี่คือรหัสของเครื่องนี้อยู่แล้ว', '☁️'); return; }
    toast('กำลังดึงเซฟจากรหัสนี้...', '☁️'); Slots.deleting = Slots.cur();   // nothing may write the slot before the reload
    try { await Net.pullAll(); } catch (e) { }
    if (!Net.pulled.length && Net.cloudErr) { Slots.deleting = 0; safeSet('raisukjai3d_cloud', old); toast('ติดต่อเซิร์ฟเวอร์ไม่ได้ ยังใช้รหัสเดิมอยู่ ลองใหม่อีกครั้ง', '⚠️'); return; }
    toast(Net.pulled.length ? `พบเซฟช่อง ${Net.pulled.join(', ')} กำลังโหลดใหม่...` : 'ยังไม่มีเซฟในรหัสนี้ (รหัสใหม่) กำลังโหลดใหม่...', '✅'); setTimeout(() => location.reload(), 900);
  };
  // first time on a cloud host: show the code once so it gets written down
  setTimeout(() => { try { if (Net.cloud && G.started && !localStorage.getItem('raisukjai_cloudseen') && !UI.isOpen()) { localStorage.setItem('raisukjai_cloudseen', '1'); UI.H.cloudsave(); } } catch (e) { } }, 7000);
  window.SaveFile196 = { exportSlot, importFile };
});
