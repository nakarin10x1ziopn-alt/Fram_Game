'use strict';
// ---------- v213: the network / CCTV window split into category tabs (router · firewall · switch/WiFi · camera · recorder · security · power/rack · bag) ----------
// The connection rules (ports, PoE, parents, recording) are untouched: this only re-arranges what is shown. Works for the home and for every company site.
V23.add('v213_netui', function () {
  if (typeof Sec === 'undefined' || typeof DEV === 'undefined') return;
  const GROUPS = [
    { id: 'ov', i: '📋', n: 'ภาพรวม' },
    { id: 'net', i: '🌐', n: 'อินเทอร์เน็ต/เราเตอร์', t: ['router'] },
    { id: 'fw', i: '🛡️', n: 'ไฟร์วอลล์', t: ['firewall'] },
    { id: 'sw', i: '🔀', n: 'สวิตช์ & WiFi', t: ['switch', 'ap'] },
    { id: 'cam', i: '📷', n: 'กล้อง', t: ['cam'] },
    { id: 'rec', i: '📼', n: 'เครื่องบันทึก/NAS', t: ['nvr', 'dvr', 'hdd', 'nas'] },
    { id: 'sec', i: '🚨', n: 'ความปลอดภัย', t: ['alarm', 'sensor', 'access', 'lock', 'fire'] },
    { id: 'pwr', i: '🔋', n: 'ไฟ/แร็ค/เซิร์ฟเวอร์', t: ['rack', 'ups', 'server', 'pac', 'part', 'cable', 'coax'] },
    { id: 'bag', i: '🎒', n: 'ของในกระเป๋า' },
  ];
  const grpOf = k => { const t = DEV[k] && DEV[k].t; const g = GROUPS.find(x => x.t && x.t.includes(t)); return g ? g.id : 'pwr'; };
  const PAGE = 10;
  Sec.tab213 = Sec.tab213 || 'ov'; Sec.pg213 = 0;
  const wrapUI = () => {
    const _ui = Sec.ui.bind(Sec);
    Sec.ui = function (site = 'home') {
      _ui(site);
      const c = UI.cur, r = c && c.render; if (!r || c.n213) return; c.n213 = 1;
      c.render = t => { try { return build(r(t), site); } catch (e) { console.warn('v213 netui', e); return r(t); } };
      UI.renderBody();
    };
  };
  function build(html, site) {
    const box = document.createElement('div'); box.innerHTML = html;
    const kids = [...box.children], h5 = kids.filter(x => x.tagName === 'H5');
    const iNet = kids.findIndex(x => x.tagName === 'H5' && /ผังการเชื่อมต่อ/.test(x.textContent));
    const iBag = kids.findIndex(x => x.tagName === 'H5' && /ติดตั้งอุปกรณ์จากกระเป๋า/.test(x.textContent));
    if (iNet < 0 || iBag < 0) return html;
    const head = kids.slice(0, iNet), nodes = kids.slice(iNet + 1, iBag).filter(x => x.querySelector && x.querySelector('[data-a="secrm"]'));
    const gridEl = kids[iBag + 1], cards = gridEl && gridEl.classList.contains('grid') ? [...gridEl.children] : [];
    const extras = kids.slice(iBag + (gridEl && (gridEl.classList.contains('grid') || gridEl.classList.contains('dim')) ? 2 : 1));
    const L = Sec.site(site).dev, S2 = Sec.status(site), byUid = {}; L.forEach(d => byUid[d.uid] = d);
    const tab = GROUPS.some(g => g.id === Sec.tab213) ? Sec.tab213 : 'ov';
    const cnt = {}, on = {}; for (const d of L) { const g = grpOf(d.k); cnt[g] = (cnt[g] || 0) + 1; if (S2.isOn(d)) on[g] = (on[g] || 0) + 1; }
    const bagN = Object.keys(DEV).filter(k => count('sec_' + k) > 0).reduce((s, k) => s + count('sec_' + k), 0);
    const tabs = `<div class="row" style="flex-wrap:wrap;gap:6px;margin:8px 0">${GROUPS.map(g => { const n = g.id === 'ov' ? '' : g.id === 'bag' ? bagN : (cnt[g.id] || 0), off = g.id !== 'bag' && g.id !== 'ov' && (cnt[g.id] || 0) - (on[g.id] || 0); return `<button class="btn ${g.id === tab ? '' : 'ghost'}" data-a="sectab213" data-v="${g.id}">${g.i} ${g.n}${n !== '' ? ` <b>${n}</b>` : ''}${off ? ' 🔴' : ''}</button>`; }).join('')}</div>`;
    const pname = d => { const p = byUid[d.p]; return p ? (p.n || DEV[p.k].n) + (p.uid ? ' #' + p.uid.slice(1) : '') : d.p === 'isp' ? 'อินเทอร์เน็ต' : d.p === 'solo' ? 'ซิม 4G (ไม่ต้องเดินสาย)' : d.p === 'site' ? 'ติดตั้งในสถานที่' : '-'; };
    const outer = x => x.outerHTML;
    let body = '';
    if (tab === 'ov') {
      // backbone tree (router · firewall · switch · AP · recorder) with the leaf devices summarised under their parent
      const infra = d => ['router', 'firewall', 'switch', 'ap', 'nvr', 'dvr', 'nas', 'server', 'rack'].includes(DEV[d.k].t);
      const sum = d => { const ks = L.filter(x => x.p === d.uid && !infra(x)), m = {}; ks.forEach(x => { const g = grpOf(x.k); (m[g] = m[g] || []).push(x); }); return Object.keys(m).map(g => { const G = GROUPS.find(x => x.id === g); return `<button class="btn ghost" data-a="sectab213" data-v="${g}">${G.i} ${G.n} ×${m[g].length}${m[g].some(x => !S2.isOn(x)) ? ' 🔴' : ''}</button>`; }).join(' '); };
      const tree = (d, dep) => { const D = DEV[d.k], kk = L.filter(x => x.p === d.uid && infra(x)), s = sum(d); return `<div style="margin-left:${dep * 16}px" class="lead">${S2.isOn(d) ? '🟢' : '🔴'} ${D.i} ${esc(D.n)}${D.poe ? ` · PoE เหลือ ${Sec.poeLeft(site, d)}W` : ''}${s ? `<div style="margin:4px 0 2px 22px">${s}</div>` : ''}</div>${kk.map(k => tree(k, dep + 1)).join('')}`; };
      const roots = L.filter(d => ['isp', 'site', 'solo'].includes(d.p) && infra(d)), solo = L.filter(d => ['isp', 'site', 'solo'].includes(d.p) && !infra(d));
      body = `<h5>ผังหลัก (อุปกรณ์แกนกลาง — กดปุ่มหมวดเพื่อดูรายตัว)</h5>${roots.map(d => tree(d, 0)).join('') || '<p class="dim">ยังไม่มีอุปกรณ์ เริ่มจากเราเตอร์ต่ออินเทอร์เน็ต แล้วต่อสวิตช์ PoE → กล้อง/AP/NVR</p>'}${solo.length ? `<p class="dim">ต่อตรง/ไม่ผ่านสวิตช์: ${solo.map(d => DEV[d.k].i + ' ' + esc(DEV[d.k].n)).join(', ')}</p>` : ''}` + extras.map(outer).join('');
    } else if (tab === 'bag') {
      body = `<h5>ติดตั้งอุปกรณ์จากกระเป๋า (ทุกหมวด)</h5>${cards.length ? `<div class="grid">${cards.map(outer).join('')}</div>` : '<p class="dim">ไม่มีอุปกรณ์ในกระเป๋า ซื้อได้ที่ไอทีซีเคียวริตี้ ทุ่งทอง</p>'}`;
    } else {
      const G = GROUPS.find(x => x.id === tab), mine = nodes.filter(n => { const u = n.querySelector('[data-a="secrm"]').dataset.v, d = byUid[u]; return d && grpOf(d.k) === tab; });
      const pages = Math.max(1, Math.ceil(mine.length / PAGE)); Sec.pg213 = Math.min(Sec.pg213 || 0, pages - 1);
      const rows = mine.slice(Sec.pg213 * PAGE, Sec.pg213 * PAGE + PAGE).map(n => { const u = n.querySelector('[data-a="secrm"]').dataset.v, d = byUid[u]; n.removeAttribute('style'); n.setAttribute('style', 'padding:6px 0;border-bottom:1px solid rgba(255,255,255,.08)'); n.insertAdjacentHTML('afterbegin', ''); const ph = `<div class="dim" style="font-size:.9em;margin:2px 0 0 26px">↳ ต่อกับ ${esc(pname(d))}</div>`; return n.outerHTML.replace(/<\/div>$/, ph + '</div>'); }).join('');
      const pager = pages > 1 ? `<div class="row" style="margin:8px 0"><button class="btn ghost" data-a="secpg213" data-v="-1">◀ ก่อนหน้า</button><span class="lead"> หน้า ${Sec.pg213 + 1}/${pages} (${mine.length} ชิ้น) </span><button class="btn ghost" data-a="secpg213" data-v="1">ถัดไป ▶</button></div>` : '';
      const mc = cards.filter(cd => { const b = cd.querySelector('[data-k]'); return b && grpOf(b.dataset.k) === tab; });
      body = `<h5>${G.i} ${G.n} (${mine.length})</h5>${rows || '<p class="dim">ยังไม่มีอุปกรณ์หมวดนี้ที่ติดตั้ง</p>'}${pager}` +
        `<h5>ติดตั้งเพิ่มจากกระเป๋า — หมวดนี้ (${mc.length})</h5>${mc.length ? `<div class="grid">${mc.map(outer).join('')}</div>` : '<p class="dim">ไม่มีอุปกรณ์หมวดนี้ในกระเป๋า ซื้อได้ที่ไอทีซีเคียวริตี้ ทุ่งทอง</p>'}`;
      if (tab === 'cam' || tab === 'sec') body += extras.map(outer).join('');
    }
    return head.map(outer).join('') + tabs + body;
  }
  UI.H.sectab213 = d => { Sec.tab213 = d.v; Sec.pg213 = 0; UI.renderBody(); };
  UI.H.secpg213 = d => { Sec.pg213 = Math.max(0, (Sec.pg213 || 0) + (+d.v || 0)); UI.renderBody(); };
  wrapUI();
});
