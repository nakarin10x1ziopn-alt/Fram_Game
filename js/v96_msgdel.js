// v96_msgdel.js: every kind of message in the phone can be deleted
//  - Messages app: a trash button on each message, "delete all from this sender", "delete this whole folder", "delete everything already read" (top of the folders page and inside a folder)
//  - Appointment messages: delete one sender's messages, or all that were already read
//  - Friend chat: clear the conversation with one friend
//  - Notification history (the bell): clear all (see v95_toastfront.js)
//  Deleting many at once asks for a second tap to confirm; one message is deleted straight away.
V23.add('v96_msgdel', () => {
  if (typeof Phone === 'undefined' || !Phone.apps || !Phone.apps.msgs) return;
  const MAP = { friend: 'people', bank: 'money', gov: 'gov', util: 'gov', health: 'care', edu: 'care', work: 'work', shop: 'shop', home: 'shop', news: 'news', safe: 'news', sys: 'sys' };
  const folderOf = m => MAP[m.cat] || 'sys';
  const toast = (t, i) => { try { UI.toast(t, i || '🗑️'); } catch (e) { } };
  const un = v => { const t = document.createElement('textarea'); t.innerHTML = v; return t.value; };
  const ensure = () => { for (const m of S.msgs || []) if (!m.uid) m.uid = Date.now().toString(36) + Math.random().toString(36).slice(2, 7); return S.msgs || []; };
  const isAppt = m => m.cat === 'appt' || (window.Phone59 && Phone59.catOf && Phone59.catOf(m) === 'appt');
  const nonAppt = () => { try { Phone59.resort(); } catch (e) { } return ensure().filter(m => !isAppt(m)); };
  const render = () => { try { Phone.badge(); UI.renderBody(); } catch (e) { } };
  // two-tap confirmation for bulk deletes
  let armed = null, tm = 0;
  const arm = key => { armed = key; clearTimeout(tm); tm = setTimeout(() => { armed = null; render(); }, 5000); };
  const need = (key, what) => { if (armed === key) { armed = null; clearTimeout(tm); return true; } arm(key); toast(`แตะปุ่มอีกครั้งเพื่อยืนยันลบ${what}`, '⚠️'); render(); return false; };
  const lab = (key, text) => armed === key ? '⚠️ แตะอีกครั้งเพื่อยืนยันลบ' : text;
  const del = pred => { const before = (S.msgs || []).length; S.msgs = (S.msgs || []).filter(m => !pred(m)); return before - S.msgs.length; };
  const B = (key, a, v, text) => `<button class="btn ghost" data-a="${a}" ${v != null ? `data-v="${v}"` : ''} style="${armed === key ? 'border-color:#ff8a65;color:#ffccbc' : ''}">${lab(key, text)}</button>`;

  UI.H.mdel1 = d => { const n = del(m => m.uid === d.v); if (n) toast('ลบข้อความแล้ว'); render(); };
  UI.H.mdelread = () => { if (!need('read', 'ข้อความที่อ่านแล้วทั้งหมด')) return; const n = del(m => m.read && !isAppt(m)); toast(`ลบข้อความที่อ่านแล้ว ${n} ข้อความ`); render(); };
  UI.H.mdelfolder = () => { const f = Phone.msgCat; if (!f || !need('folder', 'ทั้งโฟลเดอร์')) return; const n = del(m => !isAppt(m) && folderOf(m) === f); Phone.msgCat = null; Phone.msgFrom = null; toast(`ลบข้อความในโฟลเดอร์ ${n} ข้อความ`); render(); };
  UI.H.mdelfolderread = () => { const f = Phone.msgCat; if (!f || !need('folderread', 'ที่อ่านแล้วในโฟลเดอร์นี้')) return; const n = del(m => m.read && !isAppt(m) && folderOf(m) === f); toast(`ลบที่อ่านแล้ว ${n} ข้อความ`); render(); };
  UI.H.mdelfrom = () => { const f = Phone.msgCat, w = Phone.msgFrom; if (!w || !need('from', 'ข้อความทั้งหมดของผู้ส่งนี้')) return; const n = del(m => !isAppt(m) && folderOf(m) === f && m.from === w); Phone.msgFrom = null; toast(`ลบข้อความของ ${w} ${n} ข้อความ`); render(); };
  UI.H.mdelappt1 = d => { const w = un(String(d.v || '')); if (!need('appt:' + w, 'ข้อความนัดหมายของผู้ส่งนี้')) return; const n = del(m => isAppt(m) && m.from === w); toast(`ลบข้อความนัดหมาย ${n} ข้อความ`); render(); };
  UI.H.mdelapptread = () => { if (!need('apptread', 'ข้อความนัดหมายที่อ่านแล้วทั้งหมด')) return; const n = del(m => isAppt(m) && m.read); toast(`ลบข้อความนัดหมายที่อ่านแล้ว ${n} ข้อความ`); render(); };
  UI.H.mdelchat = d => { const w = un(String(d.v || '')); if (!w || !need('chat:' + w, 'แชทนี้')) return; try { Chat39.logs()[w] = []; if (Chat39.mem) { const m = Chat39.mem(w); if (m && m.hist) m.hist = []; } } catch (e) { } toast(`ล้างแชทกับ ${w} แล้ว`); render(); };
  for (const k of ['mcat', 'mfrom', 'appop', 'apcat']) { const f = UI.H[k]; if (typeof f === 'function') UI.H[k] = function () { armed = null; return f.apply(this, arguments); }; }

  // ---- Messages app ----
  { const _m = Phone.apps.msgs;
    Phone.apps.msgs = function () {
      let h = _m.apply(this, arguments);
      try {
        const all = nonAppt();
        if (!Phone.msgCat) {
          h = h.replace('data-a="mreadall">✓ อ่านทั้งหมด</button></div>', `data-a="mreadall">✓ อ่านทั้งหมด</button>${B('read', 'mdelread', null, '🗑️ ลบที่อ่านแล้วทั้งหมด')}</div>`);
        } else if (!Phone.msgFrom) {
          const i = h.indexOf('</div>'); if (i > 0) h = h.slice(0, i) + '</div><div class="row">' + B('folderread', 'mdelfolderread', null, '🗑️ ลบที่อ่านแล้วในโฟลเดอร์นี้') + B('folder', 'mdelfolder', null, '🗑️ ลบทั้งโฟลเดอร์') + h.slice(i + 6);
        } else {
          const T = all.filter(m => folderOf(m) === Phone.msgCat && m.from === Phone.msgFrom).slice().reverse(); let k = 0;
          h = h.replace(/<div class="m62">/g, () => `<div class="m62">${T[k] ? `<button class="btn ghost" data-a="mdel1" data-v="${T[k++].uid}" style="float:right;padding:0 9px;min-height:0">🗑️</button>` : ''}`);
          h += `<div class="row">${B('from', 'mdelfrom', null, '🗑️ ลบข้อความทั้งหมดของผู้ส่งนี้')}</div>`;
        }
      } catch (e) { console.warn('v96 msgs', e); }
      return h;
    };
  }
  // ---- appointment messages ----
  { const _i = Phone.apps.invite;
    Phone.apps.invite = function () {
      let h = _i.apply(this, arguments);
      try {
        const at = h.indexOf('✉️ ข้อความนัดหมาย');
        if (at > 0) {
          const head = h.slice(0, at); let tail = h.slice(at);
          tail = tail.replace(/<h4>([^<]*?) <small class="dim">\((\d+)\)<\/small><\/h4>/g, (m, name, n) => `<h4>${name} <small class="dim">(${n})</small> ${B('appt:' + un(name), 'mdelappt1', name, '🗑️ ลบ')}</h4>`);
          tail = tail.replace('</h5>', `</h5><div class="row">${B('apptread', 'mdelapptread', null, '🗑️ ลบที่อ่านแล้วทั้งหมด')}</div>`);
          h = head + tail;
        }
      } catch (e) { console.warn('v96 appt', e); }
      return h;
    };
    Phone.apps.appt39 = Phone.apps.invite;
  }
  // ---- friend chat ----
  { let cur = null;
    const o = UI.H.v39open, b = UI.H.v39back;
    if (o) UI.H.v39open = function (d) { cur = d && d.v; return o.apply(this, arguments); };
    if (b) UI.H.v39back = function () { cur = null; return b.apply(this, arguments); };
    const _c = Phone.apps.chat39;
    if (_c) Phone.apps.chat39 = function () { let h = _c.apply(this, arguments); try { if (cur) h += `<div class="row">${B('chat:' + cur, 'mdelchat', String(cur).replace(/"/g, '&quot;'), '🗑️ ล้างแชทนี้')}</div>`; } catch (e) { } return h; };
  }
  window.MsgDel96 = { del, nonAppt };
});
