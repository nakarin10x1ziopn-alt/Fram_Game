'use strict';
// ---------- v28_unify: marriage / birth certificate / divorce lived in three places (v26_docs applications, the v26_agency family counter,
// the v26_life family registry). They now share ONE record: the Gov24 wallet (docs.marriage, docs.birthcert, docs.famcert) plus the
// game's own relationship state (Social.st(): partner, stage, kids). Each place keeps its own screens and fees; sync() reconciles them. ----------
V23.add('v28_unify', () => {
  if (typeof Gov24 === 'undefined' || typeof Social === 'undefined') return;
  const G24 = Gov24, MO = 28;
  const X = () => { const x = S.v28 = S.v28 || {}; if (x.nuid == null) x.nuid = 1; if (x.mar === undefined) { x.mar = ''; x.marDay = 0; } return x; };
  const rel = () => { const r = Social.st(); if (!Array.isArray(r.kids)) r.kids = []; return r; };
  const docs = () => G24.st().docs;
  const fam = () => { const l = S.v26l = S.v26l || {}; const f = l.fam = l.fam || { spouse: '', wed: 0, div: 0, kids: [], lastBirth: -99, copies: 0 }; if (!Array.isArray(f.kids)) f.kids = []; return f; };
  const toast = (t, i) => { try { UI.toast(t, i || '📄'); } catch (e) { } };
  const msg = (from, t) => { try { Phone.msg(from, t); } catch (e) { } };
  const mkDoc = (id, data) => {
    const g = G24.st(); g.n = (g.n || 0) + 1; const D = G24.docs[id];
    return docs()[id] = { no: `${id.slice(0, 3).toUpperCase()}-${String(S.day).padStart(4, '0')}-${String(g.n).padStart(3, '0')}`, issued: S.day, exp: D && D.life ? S.day + D.life : 0, data: data || {} };
  };

  // ---- the registered marriage: the wallet paper is the truth; the life registry and the relationship state follow it ----
  function endMarriage(name, split) {
    const f = fam(), r = rel(), x = X();
    delete docs().marriage;
    if (split) {      // divorce filed through the application or the paper vanished: the property split has not been applied yet
      const share = Math.min(30000, Math.round(S.money * 0.2));
      if (share > 0) { S.money -= share; try { Bank2.log('แบ่งสินสมรสหลังหย่า', -share); } catch (e) { } }
      try { S.friends[name] = Math.max(0, Friends.get(name) - 4); } catch (e) { }
      msg('ที่ว่าการอำเภอสุขใจ', `ทะเบียนสมรสกับ ${name} สิ้นสุดแล้ว${share > 0 ? ` แบ่งสินสมรส ${baht(share)}` : ''}`);
    }
    f.spouse = ''; f.div = S.day; r.partner = null; r.stage = null; r.wedding = 0;
    x.mar = ''; x.marDay = 0; x.rem = 0; x.rem2 = 0; moveOut(name);
  }
  function marriage() {
    const x = X(), f = fam(), r = rel(), d = docs().marriage, lSp = f.spouse || '';
    if (x.mar) {
      if (!d) { endMarriage(x.mar, true); return; }                                   // paper removed by the application route
      if (!lSp && f.div && f.div >= x.marDay) { endMarriage(x.mar, false); return; }  // the life registry already split the property
    }
    if (!x.mar) {
      const sp = (d && d.data && (d.data.partner || d.data.spouse)) || (d ? (r.partner || '') : '') || lSp;
      if (!sp) return;
      if (!d) mkDoc('marriage', { partner: sp, spouse: sp, day: f.wed || S.day });
      x.mar = sp; x.marDay = docs().marriage.issued || S.day;
    }
    const md = docs().marriage, sp = (md.data && (md.data.partner || md.data.spouse)) || x.mar;
    md.data = md.data || {}; md.data.partner = sp; md.data.spouse = sp;
    x.mar = sp; f.spouse = sp; if (!f.wed) f.wed = md.issued || S.day;
    if (r.partner !== sp) r.partner = sp;
    if (r.stage !== 'married') { r.stage = 'married'; r.wedding = r.wedding || S.day; try { Social.moveIn(sp); } catch (e) { } }
  }

  // ---- children: Social's kids list is the list; the life registry keeps a mirror (with education funds), the birth paper lists who is registered ----
  function kidsSync() {
    const x = X(), f = fam(), rk = rel().kids;
    for (const k of rk) if (k.uid == null) k.uid = x.nuid++;
    const byUid = new Map(rk.map(k => [k.uid, k]));
    const used = new Set(), keep = [];
    for (const k of f.kids) {
      let m = k.uid != null ? byUid.get(k.uid) : null;
      if (!m) m = rk.find(q => !used.has(q.uid) && !f.kids.some(o => o !== k && o.uid === q.uid) && q.name === k.name && (q.born || 0) === (k.day || 0)) || rk.find(q => !used.has(q.uid) && !f.kids.some(o => o !== k && o.uid === q.uid) && q.name === k.name);
      if (!m) {                                                                       // a repeated copy of a child already kept: merge it
        const twin = keep.find(o => o.name === k.name && (o.day || 0) === (k.day || 0));
        if (twin) { twin.reg = twin.reg || k.reg; twin.fund = Math.max(twin.fund || 0, k.fund || 0); continue; }
      }
      if (!m) { m = { name: k.name, fem: !!k.fem, born: k.day || S.day, uid: x.nuid++ }; rk.push(m); byUid.set(m.uid, m); }
      if (used.has(m.uid)) continue;                                                  // a duplicate record of the same child
      used.add(m.uid); k.uid = m.uid; k.name = m.name; k.day = m.born || 0; k.fem = !!m.fem; keep.push(k);
    }
    for (const m of rk) if (!used.has(m.uid)) { used.add(m.uid); keep.push({ name: m.name, day: m.born || 0, reg: 0, fund: 0, fem: !!m.fem, uid: m.uid }); }
    f.kids.length = 0; keep.forEach(k => f.kids.push(k));
    const last = rk.reduce((a, k) => Math.max(a, k.born || 0), -99); if (last > f.lastBirth) f.lastBirth = last;

    // the birth certificate: one list, one entry per child
    let bd = docs().birthcert;
    if (bd) {
      bd.data = bd.data || {};
      const seen = new Set(), out = [];
      for (let e of bd.data.kids || []) {
        if (typeof e === 'string') e = { name: e };
        const m = (e.uid != null && byUid.get(e.uid)) || rk.find(q => q.name === e.name && (e.born == null || (q.born || 0) === (e.born || 0))) || rk.find(q => q.name === e.name);
        if (m) { if (seen.has(m.uid)) continue; seen.add(m.uid); e.uid = m.uid; e.name = m.name; e.born = m.born || 0; e.fem = !!m.fem; e.adopted = !!m.adopted; }
        out.push(e);
      }
      bd.data.kids = out;
    }
    const reg = new Set(bd ? bd.data.kids.filter(e => e.uid != null).map(e => e.uid) : []);
    const add = [];
    for (const k of f.kids) {
      if (reg.has(k.uid)) { if (!k.reg) k.reg = (bd && bd.issued) || S.day; }
      else if (k.reg) add.push(k);                                                    // registered at the life counter only: put it on the paper
    }
    if (add.length) {
      if (!bd) bd = mkDoc('birthcert', { kids: [] });
      for (const k of add) { const m = byUid.get(k.uid); bd.data.kids.push({ name: k.name, fem: !!k.fem, born: k.day || 0, adopted: !!(m && m.adopted), uid: k.uid }); }
    }
  }
  function famcert() {
    const fc = docs().famcert; if (!fc) return; fc.data = fc.data || {};
    const bd = docs().birthcert;
    fc.data.spouse = X().mar || ''; fc.data.kids = bd && bd.data && bd.data.kids ? bd.data.kids.length : 0;
  }

  // a spouse who moved in goes back to their own place when the couple splits
  function moveOut(name) {
    try {
      const n = G.npcs.find(x => x.name === name), sg = Social.single && Social.single(name); if (!n) return;
      n.circ = null;
      const rt = sg && World.npcRoutes && World.npcRoutes[sg.zone];
      if (rt && rt.lines && rt.lines[0]) { const line = rt.lines[0]; n.line = line; if (line[3]) { n.x = line[1]; n.z = line[0]; } else { n.x = line[0]; n.z = line[1]; } n.tx = n.x; n.tz = n.z; }
      n.st = 'idle'; n.away = false;
    } catch (e) { }
  }
  // the wedding ceremony is not the legal registration: remind the player to register (real life: ceremony, then จดทะเบียน at the district office)
  function wedRemind() {
    const r = rel(), x = X();
    if (r.stage !== 'married' || x.mar) { if (!r.partner) x.rem = 0; return; }
    if (!x.rem) { x.rem = S.day; msg('ที่ว่าการอำเภอสุขใจ', `ยินดีด้วยกับงานแต่งงาน! อย่าลืมไปจดทะเบียนสมรสกับ ${r.partner} ที่ทะเบียนราษฎร์ (ต้องใช้บัตรประชาชนและทะเบียนบ้าน) จะได้ใช้สิทธิคู่สมรสตามกฎหมาย`); toast('💍 แต่งงานแล้ว อย่าลืมจดทะเบียนสมรส (แอป 📄 ยื่นเอกสาร)', '💍'); }
    else if (S.day - x.rem >= 14 && !x.rem2) { x.rem2 = 1; msg('ที่ว่าการอำเภอสุขใจ', `คุณกับ ${r.partner} ยังไม่ได้จดทะเบียนสมรส ติดต่อทะเบียนราษฎร์ได้ในเวลาราชการ`); }
  }
  let busy = false;
  function sync() {
    if (busy || typeof S === 'undefined' || !S || !S.day) return;
    busy = true;
    try { marriage(); wedRemind(); kidsSync(); famcert(); } catch (e) { console.warn('v28 sync', e); } finally { busy = false; }
  }
  const unreg = () => fam().kids.filter(k => !k.reg).length;

  // ================= entry point 1: the 📄 applications (v26_docs) =================
  if (window.Docs26 && Array.isArray(Docs26.apps)) {
    const app = k => Docs26.apps.find(a => a.k === k);
    const bapp = app('birth'), mapp = app('marry'), dapp = app('divorce');
    if (bapp) {
      const pre = bapp.pre, eff = bapp.eff, doc0 = bapp.doc;
      bapp.pre = function () { sync(); const p = pre && pre.apply(this, arguments); if (p) return p; return unreg() ? null : 'บุตรทุกคนมีสูติบัตรแล้ว (ไม่ออกซ้ำ)'; };
      bapp.eff = function () { const r = eff && eff.apply(this, arguments); sync(); return r; };
      // a second child is added to the paper that exists, not refused because "you already have a birth certificate"
      Object.defineProperty(bapp, 'doc', { get() { return docs().birthcert && unreg() > 0 ? null : doc0; }, set() { }, enumerable: true, configurable: true });
    }
    if (mapp) {
      const pre = mapp.pre, eff = mapp.eff;
      mapp.pre = function () { sync(); if (X().mar) return 'จดทะเบียนสมรสไว้แล้ว'; return pre && pre.apply(this, arguments); };
      mapp.eff = function () { const r = eff && eff.apply(this, arguments); sync(); return r; };
    }
    if (dapp) {
      const pre = dapp.pre, eff = dapp.eff;
      dapp.pre = function () { sync(); if (!X().mar) return 'ยังไม่ได้จดทะเบียนสมรส'; return pre && pre.apply(this, arguments); };
      dapp.eff = function () { const r = eff && eff.apply(this, arguments); sync(); return r; };
    }
  }

  // ================= entry point 2: the family counter at the district office (v26_agency) =================
  if (window.Agency26 && Array.isArray(Agency26.agencies)) {
    const ag = Agency26.agencies.find(a => a.id === 'family');
    for (const s of (ag ? ag.sv : [])) {
      if (!s.can) continue;
      const c = s.can; s.can = function () { sync(); return c.apply(this, arguments); };
    }
  }

  // ================= entry point 3: the family registry in 🧭 (v26_life) =================
  if (UI.H && UI.H.l26) {
    const h = UI.H.l26;
    UI.H.l26 = function (d) {
      sync();
      const [k, ...r] = String((d && d.v) || '').split('|');
      if (k === 'fam.wed') {
        const rl = rel();
        if (X().mar) { toast('จดทะเบียนสมรสไว้แล้ว จดซ้ำไม่ได้', '💍'); return; }
        if (rl.partner && rl.partner !== r[0]) { toast(`คุณมีคู่รักคือ ${rl.partner} อยู่แล้ว จดสมรสกับคนอื่นไม่ได้`, '💍'); return; }
      } else if (k === 'fam.birth') {
        if (rel().kids.length >= 3) { toast('มีบุตรครบ 3 คนแล้ว', '👶'); return; }
      } else if (k === 'fam.div') {
        if (!X().mar) { toast('ยังไม่ได้จดทะเบียนสมรส', '💔'); return; }
      } else if (k === 'fam.reg') {
        const kd = fam().kids[+r[0]]; if (kd && kd.reg) { toast('บุตรคนนี้แจ้งเกิดแล้ว ไม่ออกสูติบัตรซ้ำ', '👶'); return; }
      }
      const out = h.apply(this, arguments); sync(); return out;
    };
  }

  // ================= separating a couple that never registered (dating / engaged / ceremony only) =================
  if (typeof Social !== 'undefined' && Social.buttons && Social.topic) {
    const _b = Social.buttons.bind(Social), _t = Social.topic.bind(Social);
    Social.buttons = function (n) {
      let h = _b(n); const r = rel();
      if (r.partner === n.name && !X().mar) h = h.replace('</div>', `<button class="btn ghost" data-a="topic" data-v="sep">💔 เลิกกัน / แยกทาง (ยังไม่ได้จดทะเบียน)</button></div>`);
      return h;
    };
    Social.topic = function (n, k) {
      if (k !== 'sep') return _t(n, k);
      const r = rel(); if (r.partner !== n.name || X().mar) return;
      const was = r.stage; r.partner = null; r.stage = null; r.wedding = 0; r.baby = 0;
      try { S.friends[n.name] = Math.max(0, Friends.get(n.name) - 4); } catch (e) { }
      S.mood = Math.max(0, (S.mood || 50) - 15); x0().rem = 0; x0().rem2 = 0;
      if (was === 'married') moveOut(n.name);
      toast(`คุณกับ ${n.name} เลิกกันแล้ว`, '💔'); try { Social.say(n, 'เข้าใจแล้วจ้ะ… ขอให้เธอมีความสุขนะ'); } catch (e) { }
    };
  }
  const x0 = X;

  // ================= keep everything reconciled: after every timed action, every save, every new day, every phone app =================
  if (typeof fade === 'function') { const _f = fade; fade = function (fn) { return _f(typeof fn === 'function' ? function () { try { return fn.apply(this, arguments); } finally { sync(); } } : fn); }; }
  if (typeof saveGame === 'function') { const _s = saveGame; saveGame = function () { sync(); return _s.apply(this, arguments); }; }
  { const _nd = newDay; newDay = function () { const r = _nd.apply(this, arguments); sync(); return r; }; }
  if (Phone && Phone.open) { const _o = Phone.open.bind(Phone); Phone.open = function () { sync(); return _o.apply(this, arguments); }; }
  window.Fam28 = { sync, state: () => ({ mar: X().mar, kids: rel().kids.length, reg: fam().kids.filter(k => k.reg).length, doc: !!docs().marriage, birthcert: docs().birthcert ? docs().birthcert.data.kids.length : 0 }) };
  sync();
});
