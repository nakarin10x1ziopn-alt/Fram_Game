'use strict';
// ---------- v44_profile: "โปรไฟล์ของฉัน" shows exactly what the Thai ID card form collects ----------
// Card data (from the application at the district office): ID number, Thai name, English name, birth date, age, sex, blood group, religion, address, issue and
// expiry dates. Without a card every one of them reads "-". The few extra lines (relationship, job, education) also read "-" until they apply;
// education lists what was finished, in order, and what is being studied now. Nothing else (farm name, level, play time, location) is shown.
V23.add('v44_profile', () => {
  const yearBE = () => Cal36.date().be;
  const dash = '<span class="dim">-</span>';
  const idRec = () => { try { return Gov24.rec('idcard') || null; } catch (e) { return null; } };
  const fmtId = n => String(n || '').replace(/^(\d)(\d{4})(\d{5})(\d{2})(\d)$/, '$1-$2-$3-$4-$5');
  const MON = () => Cal36.MON;
  const row = (k, v) => `<tr><td>${k}</td><td>${v == null || v === '' ? dash : v}</td></tr>`;
  const mjName = (pid, mj) => { try { const m = Edu24.PROG[pid].majors, x = Array.isArray(m) ? m[mj] : m && m[mj]; return typeof x === 'string' ? x : x && x.n ? x.n : ''; } catch (e) { return ''; } };

  function education() {
    const out = [];
    try {
      const c = S.civic && S.civic.ed;
      if (c && Array.isArray(c.certs)) for (const k of c.certs) { const a = Object.values(CV_ADULT).find(x => x.cert === k); out.push('🎓 จบ ' + esc(a ? a.cn : k)); }
    } catch (e) { }
    try {
      const e = Edu24.st();
      for (const c of (e.certs || []).slice().sort((a, b) => (a.day || 0) - (b.day || 0))) out.push('🎓 จบ ' + esc(c.n || '') + (c.gpax ? ` · เกรดเฉลี่ย ${(+c.gpax).toFixed(2)}` : '') + (c.honors ? ' · เกียรตินิยม' : ''));
      if (e.cur) out.push(`📖 กำลังเรียน ${esc(Edu24.PROG[e.cur.pid].n)}${mjName(e.cur.pid, e.cur.mj) ? ' สาขา' + esc(mjName(e.cur.pid, e.cur.mj)) : ''} (ภาคเรียนที่ ${e.cur.term || 1})`);
    } catch (e) { }
    try { const c = S.civic && S.civic.ed; if (c && c.prog && CV_ADULT[c.prog]) out.push('📖 กำลังเรียน ' + esc(CV_ADULT[c.prog].n)); } catch (e) { }
    return out.length ? out.join('<br>') : 'ยังไม่ได้เรียน';
  }
  function status(has) {
    if (!has) return '';
    const r = Social.st();
    const kids = (r.kids || []).length;
    if (r.partner) return `${{ dating: 'มีแฟน', engaged: 'หมั้นแล้ว', married: 'แต่งงานแล้ว' }[r.stage] || 'มีแฟน'} กับ ${esc(r.partner)}${kids ? ` · มีลูก ${kids} คน` : ''}`;
    if (window.Fam28 && Fam28.state && Fam28.state().mar) return 'จดทะเบียนสมรสแล้ว';
    if (S.v26l && S.v26l.fam && S.v26l.fam.div) return 'หย่าร้าง';
    return 'โสด';
  }
  function job() {
    try { if (S.job && S.job.k && window.Career && Career.C) { const c = Career.C(); if (c && c.n) return esc(c.n); } } catch (e) { }
    return '';
  }
  function meHtml() {
    const doc = idRec(), has = !!doc, d = (doc && doc.data) || {}, th = d.th || {}, en = d.en || {}, b = d.birth || {}, ad = d.addr || {};
    const name = has ? esc(`${th.pre || ''}${th.first || ''} ${th.last || ''}`.trim()) : '';
    const eng = has && (en.first || en.last) ? esc(`${en.first || ''} ${en.last || ''}`.trim()) : '';
    const age = has && b.y ? `${yearBE() - b.y} ปี` : '';
    const addr = has && ad.no ? esc(`${ad.no} หมู่ ${ad.moo} ต.${ad.tam} อ.สุขใจ จ.สุขใจ`) : '';
    const sex = has && d.sex ? (d.sex === 'หญิง' ? '♀ หญิง' : '♂ ' + esc(d.sex)) : '';
    return `<div class="card"><div class="ci">🪪</div><div class="cb"><h4>${name || dash}</h4><p class="dim">${has ? 'ข้อมูลตามบัตรประจำตัวประชาชน' : 'ยังไม่มีบัตรประชาชน · ไปทำได้ที่ศูนย์ราชการอำเภอสุขใจ (แอป บริการภาครัฐ)'}</p></div></div>
      <table class="prof36">${row('เลขประจำตัวประชาชน', has ? fmtId(doc.no) : '')}${row('ชื่อ-สกุล (ไทย)', name)}${row('Name (English)', eng)}${row('วันเกิด', has && b.d ? `${b.d} ${MON()[b.m - 1]} พ.ศ. ${b.y}` : '')}${row('อายุ', age)}${row('เพศ', sex)}${row('หมู่โลหิต', has ? esc(d.blood || '') : '')}${row('ศาสนา', has ? esc(d.rel || '') : '')}${row('ที่อยู่ตามบัตร', addr)}${row('วันออกบัตร', has && doc.issued ? RD(doc.issued) : '')}${row('วันหมดอายุ', has && doc.exp ? RD(doc.exp) : '')}</table>
      <table class="prof36">${row('สถานภาพ', status(has))}${row('อาชีพ', job())}${row('การศึกษา', education())}</table>`;
  }
  Phone.apps.me36 = meHtml;
  window.Profile44 = { html: meHtml, education };
});
