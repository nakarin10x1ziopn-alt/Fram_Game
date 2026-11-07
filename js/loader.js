'use strict';
// ---------- Asset pack loader: downloads the 14 MB model/texture pack with a progress bar instead of blocking the page ----------
const AssetPack = {
  // dev page (index.html) keeps the pack in js/, the published single page keeps it next to itself
  urls: ['js/assets_data.js?v=2', 'assets_data.js?v=2'],
  async load(setLoad) {
    if (typeof ASSET_DATA !== 'undefined') return true;
    for (const url of this.urls) {
      try {
        const txt = await this.fetchText(url, p => setLoad(`กำลังดาวน์โหลดโมเดลและพื้นผิว ${p}%`));
        if (txt && txt.startsWith("'use strict'")) {
          setLoad('กำลังแตกไฟล์โมเดล...'); await new Promise(r => setTimeout(r, 0));
          const s = document.createElement('script'); s.textContent = txt; document.head.appendChild(s);
          if (typeof ASSET_DATA !== 'undefined') return true;
        }
      } catch (e) { /* try a plain script tag below */ }
      // some hosts block fetch or inline scripts: a normal <script src> still works there
      const ok = await new Promise(res => { const s = document.createElement('script'); s.src = url; s.onload = () => res(true); s.onerror = () => res(false); document.head.appendChild(s); });
      if (ok && typeof ASSET_DATA !== 'undefined') return true;
    }
    console.warn('asset pack not found: playing with built-in shapes');
    return false;
  },
  // the 100Avatars pack (6 MB) is separate: only an old save whose player still wears one of those models asks for it
  async loadChars() {
    if (typeof ASSET_DATA === 'undefined' || ASSET_DATA.chars) return !!(typeof ASSET_DATA !== 'undefined' && ASSET_DATA.chars);
    for (const url of ['js/assets_chars.js?v=1', 'assets_chars.js?v=1']) {
      try {
        const txt = await this.fetchText(url, () => { });
        if (txt && txt.startsWith("'use strict'")) { const s = document.createElement('script'); s.textContent = txt; document.head.appendChild(s); s.remove(); }
        if (ASSET_DATA.chars) return true;
      } catch (e) { }
    }
    return false;
  },
  async fetchText(url, onPct) {
    const r = await fetch(url, { cache: 'force-cache' });
    if (!r.ok) throw new Error(r.status);
    const total = +r.headers.get('Content-Length') || 0;
    if (!r.body || !r.body.getReader || !total) return r.text();
    const rd = r.body.getReader(), parts = []; let got = 0, last = -1;
    for (;;) {
      const { done, value } = await rd.read(); if (done) break;
      parts.push(value); got += value.length;
      const p = Math.min(100, Math.floor(got / total * 100)); if (p !== last) { last = p; onPct(p); }
    }
    const all = new Uint8Array(got); let o = 0; for (const p of parts) { all.set(p, o); o += p.length; }
    return new TextDecoder('utf-8').decode(all);
  },
};
