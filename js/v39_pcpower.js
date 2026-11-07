'use strict';
// ---------- v39_pcpower: every computer has its own power button (เปิด / ปิด / สลีป / ปลุก / รีสตาร์ท) ----------
// Electricity: a computer draws power ONLY while it is switched on (idle / typical / gaming-or-rendering load by its rated watts + monitor),
// a sleeping one a few watts, an off one nothing. Internet traffic (GB) counts only for computers that are on AND only while the line is up.
// Machines: the basic desk computer, every computer in S.pcs (desktops and laptops), and the PC desks of the new houses (Prop23 'pcdesk').
// State lives in S.v39pc. Old saves: every computer starts OFF (the player turns them on once).
V23.add('v39_pcpower', function () {
  const st = () => { const s = S.v39pc = S.v39pc || {}; s.r = s.r || {}; s.n = s.n || 0; if (!s.k || s.k.d !== S.day) s.k = { d: S.day, v: {} }; return s; };
  const nowM = () => S.day * 1440 + S.time;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const E = s => (typeof esc === 'function' ? esc(s) : String(s));
  const safe = (f, d) => { try { const v = f(); return v == null ? d : v; } catch (e) { return d; } };
  const fx = (n, d = 2) => (+n || 0).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: 0 });

  // ----- who is a computer -----
  const uidOf = pc => pc.uid39 || (pc.uid39 = 'p' + (++st().n));
  const itemUid = it => it.u39 || (it.u39 = 'h' + (++st().n));
  const homes = () => { const out = []; try { const H = Prop23.V().homes || {}; for (const hid in H) { const h = H[hid]; const live = h.util && h.util.e && S.day >= h.util.e; for (const it of h.items || []) if (it.k === 'pcdesk') out.push({ uid: itemUid(it), name: `${(h.name || 'บ้านหลังใหม่')} (${hid}): คอมที่โต๊ะคอม`, w: 150, home: hid, it, live: !!live }); } } catch (e) { } return out; };
  const mains = () => {
    const out = [{ uid: 'base', name: 'คอมพิวเตอร์ที่โต๊ะ (เครื่องพื้นฐาน)', w: 90, score: 0, base: 1 }];
    for (const pc of S.pcs || []) out.push({ uid: uidOf(pc), name: pc.name || 'คอมพิวเตอร์', w: pc.w || 150, score: pc.score || 0, ref: pc, laptop: !!pc.laptop });
    return out;
  };
  const all = () => mains().concat(homes());
  const best = () => { const b = safe(() => PC.best(), null); return b ? mains().find(m => m.ref === b) : null; };

  // ----- state machine (lazy: boot finishes by itself when the game minute is reached) -----
  const rec = uid => { const r = st().r; if (!r[uid]) r[uid] = { s: 'off', t: nowM() }; const x = r[uid]; if (x.s === 'boot' && nowM() >= x.end) { x.s = 'on'; x.t = nowM(); } return x; };
  const state = m => rec(m.uid).s;
  const hasUps = () => safe(() => count('pc_ups') > 0, false);
  const dark = () => safe(() => Power.status().dark, false) || !!S.powerOff;
  const atHome = () => { try { return G.inside || Math.hypot(G.player.pos.x - HOUSE_POS.x, G.player.pos.z - HOUSE_POS.z) < 40; } catch (e) { return true; } };
  const occupied = hid => !!(G.inRoom && Rooms.cur && Rooms.cur.def && Rooms.cur.def.home === hid);
  const bootMin = m => {
    if (m.laptop) return 1.2; if (m.base) return 2.5; if (m.home) return 2.5;
    const pc = m.ref || {}, ssd = (pc.parts || []).some(p => /ssd|nvme|m2/i.test(p) || safe(() => PC_PARTS[p].s === 'ssd', false));
    return (ssd ? 1.5 : 4) * (pc.os === 'linux' ? 0.8 : 1) * (pc.infected ? 1.6 : 1);
  };
  // kW of one machine in its present state
  const kwOf = (m, r) => {
    const w = m.w / 1000, mon = m.laptop ? 0 : m.base ? 0.03 : 0.045;
    if (r.s === 'boot') return w * 0.55;
    if (r.s === 'sleep') return 0.003;
    if (r.s !== 'on') return 0;
    const busy = (r.game || 0) > nowM() || (safe(() => S.pcJob && S.pcJob.until > nowM(), false) && best() && best().uid === m.uid);
    return busy ? w * 0.85 + mon : w * 0.28 + mon;
  };
  const kw = m => kwOf(m, rec(m.uid));
  const totalKw = () => { let t = 0; for (const m of mains()) t += kw(m); return t; };       // the houses' own desks are billed by their own meters (v28_infra)

  // ----- switching -----
  const why = m => {
    if (m.ref && m.ref.broken) return 'พาวเวอร์ซัพพลายเสีย — ซ่อมที่แอปศูนย์ไอทีก่อน';
    if (m.home) { if (!m.live) return 'บ้านหลังนี้ยังไม่มีไฟฟ้า'; if (!occupied(m.home)) return 'ต้องอยู่ในบ้านหลังนั้นถึงจะเปิด/ปิดเครื่องได้'; }
    else if (!atHome()) return 'ต้องอยู่ที่บ้านถึงจะเปิด/ปิดเครื่องได้';
    return '';
  };
  const stopJob = m => { try { if (S.pcJob && best() && best().uid === m.uid && S.pcJob.until > nowM()) { S.pcJob = null; UI.toast('งานเรนเดอร์/เทรน AI ถูกยกเลิก เพราะเครื่องถูกปิด', '⚠️'); } } catch (e) { } };
  function act(uid, v) {
    const m = all().find(x => x.uid === uid); if (!m) return;
    const r = rec(uid), no = why(m);
    if (no) { UI.toast(no, '🖥️'); return; }
    if (v === 'on') {
      if (r.s !== 'off') return;
      if (dark() && !hasUps()) { UI.toast('ไฟฟ้าดับ เปิดเครื่องไม่ได้ (มี UPS จึงจะเปิดได้)', '⚡'); return; }
      Object.assign(r, { s: 'boot', t: nowM(), end: nowM() + bootMin(m), upsH: 0 });
      UI.toast(`กำลังเปิด ${m.name} ใช้เวลาบู๊ตประมาณ ${fx(bootMin(m), 1)} นาทีเกม`, '🖥️'); Sfx.click && Sfx.click();
    } else if (v === 'off') {
      if (r.s === 'off') return; stopJob(m); Object.assign(r, { s: 'off', t: nowM() }); UI.toast(`ปิด ${m.name} แล้ว (ไม่กินไฟ)`, '⏻');
    } else if (v === 'sleep') {
      if (r.s !== 'on') return; Object.assign(r, { s: 'sleep', t: nowM() }); UI.toast(`${m.name} เข้าโหมดสลีป (กินไฟน้อยมาก)`, '🌙');
    } else if (v === 'wake') {
      if (r.s !== 'sleep') return; Object.assign(r, { s: 'boot', t: nowM(), end: nowM() + 0.3 }); UI.toast(`ปลุก ${m.name}`, '🖥️');
    } else if (v === 'restart') {
      if (r.s !== 'on') return; if (dark() && !hasUps()) return; stopJob(m); Object.assign(r, { s: 'boot', t: nowM(), end: nowM() + bootMin(m) + 0.6 }); UI.toast(`กำลังรีสตาร์ท ${m.name}`, '🔄');
    }
    try { UI.hud && UI.hud(); } catch (e) { }
    try { const s2 = rec(uid).s; UI.toast(`${m.name} · สถานะตอนนี้: ${{ off: '⚫ ปิดอยู่', boot: '🟡 กำลังเปิดเครื่อง', on: '🟢 เปิดอยู่', sleep: '🌙 สลีป' }[s2]}`, s2 === 'on' ? '🟢' : s2 === 'off' ? '⚫' : '🖥️'); } catch (e) { }
  }

  // ----- rules the rest of the game asks about -----
  const usableM = m => state(m) === 'on' && !(m.ref && (m.ref.broken || m.ref.os === null || m.ref.infected));
  const usable = () => mains().some(usableM) || homes().some(m => m.live && occupied(m.home) && state(m) === 'on');
  const onCount = () => all().filter(m => state(m) === 'on').length;
  const anyOn = () => all().some(m => state(m) === 'on');

  // ----- UI -----
  const LAB = { off: ['⚫ ปิดอยู่', 'dim'], boot: ['🟡 กำลังเปิดเครื่อง…', 'dim'], on: ['🟢 เปิดอยู่', 'good'], sleep: ['🌙 สลีป', 'dim'] };
  const B = (m, v, t, ghost) => `<button class="btn ${ghost ? 'ghost' : ''}" data-a="pc39" data-v="${v}" data-u="${m.uid}">${t}</button>`;
  const btnsM = m => {
    const s = state(m);
    return s === 'off' ? B(m, 'on', '⏻ เปิดเครื่อง')
      : s === 'boot' ? `<button class="btn ghost" disabled>กำลังบู๊ต…</button>${B(m, 'off', '⏻ ปิดเครื่อง', 1)}`
      : s === 'on' ? B(m, 'off', '⏻ ปิดเครื่อง') + B(m, 'sleep', '🌙 สลีป', 1) + B(m, 'restart', '🔄 รีสตาร์ท', 1)
      : B(m, 'wake', '☀️ ปลุก') + B(m, 'off', '⏻ ปิดเครื่อง', 1);
  };
  const PILL = { off: ['#5b6268', 'ปิดอยู่'], boot: ['#e0a800', 'กำลังเปิดเครื่อง'], on: ['#2fbf5b', 'เปิดอยู่'], sleep: ['#4a7fd0', 'สลีป'] };
  // the status shown next to the power button: a coloured LED + word, the boot countdown and the live power draw
  const pill = m => {
    const r = rec(m.uid), [c, t] = PILL[r.s] || PILL.off, left = r.s === 'boot' ? Math.max(0, Math.ceil(r.end - nowM())) : 0;
    return `<span style="display:inline-flex;align-items:center;gap:6px;padding:3px 12px;border-radius:14px;background:${c}26;border:1px solid ${c};font-weight:700"><i style="width:10px;height:10px;border-radius:50%;background:${c};box-shadow:0 0 8px ${c}"></i>สถานะ: ${t}${left ? ` (เหลือ ~${left} นาที)` : ''}</span>`;
  };
  const card = m => {
    const r = rec(m.uid), [lab, cls] = LAB[r.s] || LAB.off, k = st().k.v[m.uid] || 0, n = why(m);
    return `<div class="card"><div class="ci">${m.laptop ? '💻' : '🖥️'}</div><div class="cb"><h4>${E(m.name)}</h4>
      <p>${pill(m)}</p><p class="dim">${r.s === 'on' || r.s === 'boot' ? `กินไฟตอนนี้ ~${fx(kwOf(m, r) * 1000, 0)}W` : r.s === 'sleep' ? 'กินไฟ ~3W' : 'ไม่กินไฟ'} · วันนี้ ${fx(k, 2)} kWh${n ? `<br>⚠️ ${n}` : ''}</p>
      <div class="row">${btnsM(m)}</div></div></div>`;
  };
  const panelHtml = () => `<h5>🖥️ เปิด-ปิดคอมพิวเตอร์</h5><p class="dim">คอมพิวเตอร์กินไฟเฉพาะตอนเปิดเครื่อง · ต้องเปิดก่อนจึงจะช้อปออนไลน์ เล่นเกม สตรีม หรือทำงานที่บ้านได้</p><div class="grid">${mains().map(card).join('')}</div>`;
  const usageHtml = () => {
    const ms = all(), t = totalKw();
    return `<h5>🖥️ คอมพิวเตอร์ (เปิด/ปิดเครื่อง)</h5><p class="dim">ตอนนี้ใช้ไฟรวม ~${fx(t * 1000, 0)}W จากคอมที่เปิดอยู่ ${onCount()} เครื่อง · คอมที่ปิดไม่กินไฟ</p><div class="grid">${ms.map(card).join('')}</div>`;
  };
  const badge = pc => { const m = mains().find(x => x.ref === pc); if (!m) return ''; const s = state(m); return `<b class="${LAB[s][1]}">${LAB[s][0]}</b> · `; };
  const btns = pc => { const m = mains().find(x => x.ref === pc); return m ? btnsM(m) : ''; };
  UI.H.pc39 = d => act(d.u, d.v);

  // ----- the desk and the computer jobs need a computer that is on -----
  const wm = () => {
    try {
      if (typeof PC === 'undefined') return;
      PC.load = () => 0;                                     // the render/AI job load is part of kwOf() now (it counts only while the machine is on)
      const _hu = PC.homeUI.bind(PC), _use = PC.use.bind(PC);
      PC.homeUI = function () {
        const b = best();
        if (b && !usableM(b)) { UI.open('คอมพิวเตอร์ที่บ้าน', null, () => `<p class="lead">🖥️ ${E(b.name)} ${state(b) === 'boot' ? 'กำลังเปิดเครื่อง รอสักครู่' : state(b) === 'sleep' ? 'อยู่ในโหมดสลีป' : 'ปิดอยู่'} — เปิดเครื่องก่อนจึงจะเล่นเกม สตรีม หรือรับงานเรนเดอร์ได้</p>${panelHtml()}`); return; }
        return _hu();
      };
      PC.use = function (v) {
        const b = best();
        if (b) { if (!usableM(b)) { UI.toast('คอมปิดอยู่ ต้องเปิดเครื่องก่อน', '🖥️'); return; } const r = rec(b.uid); r.game = nowM() + (v === 'stream' ? 120 : v === 'game' ? 60 : 0); }
        return _use(v);
      };
    } catch (e) { console.warn('v39 pcpower hooks', e); }
  };
  wm();
  Power.extra.push(h => totalKw() - (S.furn && S.furn.pcdesk ? 0.015 : 0));   // the desk itself draws nothing; the machines do

  // ----- hour by hour: bookkeeping, power cuts, forgotten computers -----
  const _hs = Power.hourStep.bind(Power);
  Power.hourStep = function (h) {
    const s = st();
    const r0 = _hs(h);
    try {
      const ms = all();
      let pcKwh = 0;
      for (const m of ms) { const k = kw(m); if (k > 0) { s.k.v[m.uid] = (s.k.v[m.uid] || 0) + k; if (!m.home) pcKwh += k; } }
      // move the computers' share from "IT" to its own line in the usage app
      const U0 = S.v36u && S.v36u.d && S.v36u.d[S.day]; if (U0 && U0.c) { const mv = Math.min(pcKwh, U0.c.it || 0); U0.c.it = (U0.c.it || 0) - mv; U0.c.pc = (U0.c.pc || 0) + mv; }
      // power cut: no UPS = hard shutdown; a UPS carries the computers for two hours
      if (dark()) {
        let off = 0;
        for (const m of ms) {
          const r = rec(m.uid); if (r.s === 'off') continue;
          r.upsH = (r.upsH || 0) + 1;
          if (!(hasUps() && r.upsH <= 2)) { stopJob(m); Object.assign(r, { s: 'off', t: nowM() }); off++; }
        }
        if (off) Phone.msg('ศูนย์ไอที', `ไฟฟ้าดับ คอมพิวเตอร์ ${off} เครื่องปิดตัวลงทันที${hasUps() ? ' (UPS หมดแล้ว)' : ' เพราะไม่มี UPS งานที่ยังไม่บันทึกอาจเสียหาย'}`);
      } else for (const m of ms) rec(m.uid).upsH = 0;
      // forgotten computers: one reminder a night with what it costs
      if (h === 0 && s.warnDay !== S.day) {
        const on = ms.filter(m => { const x = rec(m.uid); return x.s === 'on' || x.s === 'boot'; });
        if (on.length) { s.warnDay = S.day; const cost = on.reduce((a, m) => a + kw(m) * 8 * 4.4, 0); Phone.msg('แจ้งเตือนบ้าน', `คอมพิวเตอร์ ${on.length} เครื่องเปิดทิ้งไว้ทั้งคืน เปลืองไฟราว ${fx(cost, 0)} ฿ ต่อคืน — ปิดเครื่องหรือสลีปได้ที่แอปศูนย์ไอที`); }
      }
    } catch (e) { if (!Power._w39) { Power._w39 = 1; console.warn('v39 pcpower', e); } }
    return r0;
  };

  // first time only: tell the player how it works (old saves have their computers switched off)
  { const s = st(); if (!s.intro) { s.intro = 1; if ((S.pcs || []).length || !G.fresh) setTimeout(() => { try { Phone.msg('ศูนย์ไอที', 'ตอนนี้คอมพิวเตอร์ทุกเครื่องมีปุ่มเปิด/ปิดของตัวเอง คอมที่ปิดไม่กินไฟ ต้องเปิดก่อนจึงจะช้อปออนไลน์หรือทำงานได้ (แอปศูนย์ไอที > จัดการคอม)', true); } catch (e) { } }, 4000); } }

  window.PC39 = {
    all, mains, homes, state, kw, totalKw, act, usable, onCount, anyOn, panelHtml, usageHtml, badge, btns, best, rec, pill, nowM,
    mark: (uid, min) => { const r = rec(uid); r.game = Math.max(r.game || 0, nowM() + min); },
    why: () => (anyOn() ? '🖥️ คอมพิวเตอร์ที่เปิดอยู่ยังใช้ไม่ได้ (ยังไม่ลง Windows/Linux, เครื่องเสีย หรือติดมัลแวร์) — แก้ที่แอป 🖥️ ศูนย์ไอที' : '🖥️ คอมพิวเตอร์ปิดอยู่ — กดปุ่ม "เปิดเครื่อง" ด้านล่างก่อน'),
    // the PC desks of the new houses are billed by v28_infra: kWh per hour for one desk, and a signature so its cache notices a switch
    homeKw: it => kwOf({ w: 150, home: 1 }, rec(itemUid(it))),
    homeSig: h => { let g = ''; for (const it of (h && h.items) || []) if (it.k === 'pcdesk') g += rec(itemUid(it)).s[1]; return g ? '#' + g : ''; },
  };
});
