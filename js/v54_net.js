// v54_net.js: internet system.
//  1) any number of packages at any time (the first is the main line, every other one is an extra line with its own bill and contract)
//  2) every network device you own is listed on its own (installed or still in the bag), with what it is plugged into, its ports and where it is
//  3) devices placed outside the house are shown: a label in the 3D world, a pin on the map, and a beam of light on request
V23.add('v54_net', () => {
  if (typeof ISP === 'undefined' || typeof Sec === 'undefined' || typeof DEV === 'undefined') return;
  const E = s => (typeof esc === 'function' ? esc(s) : String(s));
  const N = () => window.Net36;

  // ---------- 1. buying a package while you already have one ----------
  const _order = ISP.order.bind(ISP);
  ISP.order = function (k, slot) {
    if (ISP.st().pkg && N() && N().order) {
      const n0 = N().st().lines.length; N().order(k, slot);
      if (N().st().lines.length > n0) { UI.toast(`สมัคร ${NET_PKGS[k].n} เพิ่มแล้ว (เป็นสายเสริม ${N().st().lines.length})`, '📶'); UI.renderBody && UI.renderBody(); }
      return;
    }
    return _order(k, slot);
  };

  // ---------- 2. every device on its own ----------
  const used = (L, p) => L.filter(d => d.p === p.uid && !(DEV[d.k].wifiC || DEV[d.k].t === 'sensor' || DEV[d.k].t === 'hdd')).length;
  const keyOf = (site, uid) => (site === 'home' ? 'h:' : site + ':') + uid;
  const recFor = (site, uid) => { try { return Move37.list().find(r => r.key === keyOf(site, uid)); } catch (e) { return null; } };
  const where = rec => { try { if (!rec) return 'ตู้เครือข่ายในบ้าน'; const p = Move37.posOf(rec); return p ? (p.label || Move37.labelOf(p)) : 'ตู้เครือข่ายในบ้าน (ตำแหน่งเดิม)'; } catch (e) { return 'ในบ้าน'; } };
  const isOut = rec => { try { const p = rec && Move37.posOf(rec); return !!(p && p.w === 'out'); } catch (e) { return false; } };
  const DIR = ['เหนือ', 'ตะวันออกเฉียงเหนือ', 'ตะวันออก', 'ตะวันออกเฉียงใต้', 'ใต้', 'ตะวันตกเฉียงใต้', 'ตะวันตก', 'ตะวันตกเฉียงเหนือ'];   // as on the map: up = north
  const dirText = (x, z, fx, fz) => { const dx = x - fx, dz = z - fz, a = Math.atan2(dx, -dz), i = ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8; return `${Math.round(Math.hypot(dx, dz))} ม. ทาง${DIR[i]}`; };
  const where3 = rec => {
    if (!isOut(rec)) return E(where(rec));
    const w = Move37.worldOf(Move37.posOf(rec)), me = G.player.pos, hp = typeof HOUSE_POS !== 'undefined' ? HOUSE_POS : { x: 0, z: 0 }, z = zoneAt(w.x, w.z);
    return `${E(where(rec))}<br>📍 ห่างจากคุณ ${dirText(w.x, w.z, me.x, me.z)} · ห่างจากบ้าน ${dirText(w.x, w.z, hp.x, hp.z)}${z ? ' · ในเขต' + E(z.n) : ''}`;
  };
  const nameOf = (L, d) => { const D = DEV[d.k], same = L.filter(x => x.k === d.k); return E(D.n) + (same.length > 1 ? ` #${same.indexOf(d) + 1}` : ''); };
  function devHtml() {
    const sites = Object.keys(Sec.st().sites || { home: 1 });
    let total = 0;
    const blocks = sites.map(site => {
      const L = Sec.site(site).dev.filter(d => DEV[d.k].c === 'net' || ['router', 'firewall', 'switch', 'ap', 'nas', 'ups', 'rack', 'server'].includes(DEV[d.k].t));
      if (!L.length) return '';
      let S2 = null; try { S2 = Sec.status(site); } catch (e) { }
      total += L.length;
      const all = Sec.site(site).dev;
      return `<h5>${site === 'home' ? '🏠' : '🏢'} ${E(Sec.siteName(site))} · ${L.length} ชิ้น</h5><div class="grid">${L.map(d => {
        const D = DEV[d.k], parent = all.find(x => x.uid === d.p), rec = recFor(site, d.uid), ports = D.lan ? ` · พอร์ตใช้ ${used(all, d)}/${D.lan}` : '', poe = D.poe ? ` · PoE เหลือ ${Sec.poeLeft(site, d)}W` : '';
        const on = S2 ? S2.isOn(d) : true, link = d.p === 'isp' ? 'อินเทอร์เน็ต (ONT)' : d.p === 'solo' ? 'ซิมมือถือ' : d.p === 'site' ? 'ติดตั้งในสถานที่' : parent ? nameOf(all, parent) : '-';
        return `<div class="card"><div class="ci">${D.i}</div><div class="cb"><h4>${on ? '🟢' : '🔴'} ${nameOf(L, d)}</h4><p class="dim">ต่อกับ: ${link}${ports}${poe}</p><p class="dim">📍 ${where3(rec)}</p>
          <div class="row">${rec && isOut(rec) ? `<button class="btn ghost" data-a="v54loc" data-v="${E(rec.key)}">🔦 ชี้ที่ตั้ง</button>` : ''}${rec ? `<button class="btn ghost" data-a="mv37go" data-v="${E(rec.key)}">📍 ย้าย</button>` : ''}<button class="btn ghost" data-a="secrm" data-v="${d.uid}" data-s="${site}">ถอด</button></div></div></div>`;
      }).join('')}</div>`;
    }).join('');
    const bag = Object.keys(DEV).filter(k => count('sec_' + k) > 0 && !['cat6', 'coax'].includes(k));
    const bagHtml = bag.length ? `<h5>🎒 ซื้อมาแล้วแต่ยังไม่ได้ติดตั้ง</h5><div class="grid">${bag.map(k => `<div class="card"><div class="ci">${DEV[k].i}</div><div class="cb"><h4>${E(DEV[k].n)} ×${count('sec_' + k)}</h4><p class="dim">${Sec.spec(DEV[k])}</p><div class="row"><button class="btn" data-a="v23one" data-k="${k}">🔌 ติดตั้งให้ 1 ชิ้น</button></div></div></div>`).join('')}</div>` : '';
    return `<p class="lead">อุปกรณ์เครือข่ายทุกชิ้นที่ซื้อมา แยกเป็นรายชิ้น ซื้อซ้ำหรือซื้อรุ่นอื่นเพิ่มก็เห็นแยกกัน (เช่น สวิตช์ 24 พอร์ต กับ 16 พอร์ต) · ติดตั้งแล้ว ${total} ชิ้น</p>${blocks || '<p class="dim">ยังไม่ได้ติดตั้งอุปกรณ์เครือข่าย ซื้อได้ที่ไอทีซีเคียวริตี้ ทุ่งทอง</p>'}${bagHtml}
      <div class="row"><button class="btn ghost" data-a="v23go" data-v="sec">ผังเครือข่ายเต็ม</button><button class="btn ghost" data-a="mv37app">📍 ย้ายอุปกรณ์ทั้งหมด</button></div>`;
  }
  const _secrm = UI.H.secrm; UI.H.secrm = d => { if (d.s) Sec.cur = d.s; _secrm(d); };
  // the internet app: the old "extra services" tab (lost when extra lines arrived) comes back, plus the device list
  ISP.open = function () {
    UI.open('อินเทอร์เน็ตบ้าน', ['แพ็กเกจของฉัน', 'สมัครแพ็กเกจ', 'สายเสริม / สำรอง', '🔧 บริการเสริม', '🔀 อุปกรณ์เครือข่าย'], t => t === 2 ? ISP.linesHtml() : t === 3 ? ISP.html(2) : t === 4 ? devHtml() : ISP.html(t), { wide: true });
  };
  // my line count shows on the first tab
  { const _h = ISP.html.bind(ISP); ISP.html = function (t) { const r = _h(t); if (t !== 0 || !N()) return r; const n = N().st().lines.length; return r + (ISP.pkg() ? `<p class="lead">📶 มีทั้งหมด ${n + 1} สาย · รวมความเร็วตอนนี้ ${ISP.speed()} Mbps · ดูสายเสริมแต่ละสายที่แท็บ "สายเสริม / สำรอง" · สมัครเพิ่มได้ตลอดที่แท็บ "สมัครแพ็กเกจ"</p>` : ''); }; }

  // ---------- 3. outdoor devices are visible: label, map pin, beam ----------
  const SIG = { v: '' }, pins = [], labels = new THREE.Group(); labels.name = 'v54lbl'; let beam = null, started = false;
  const outList = () => { const out = []; try { for (const r of Move37.list()) { const p = Move37.posOf(r); if (!p || p.w !== 'out') continue; const w = Move37.worldOf(p); out.push({ r, w, p }); } } catch (e) { } return out; };
  const labelTex = txt => { const c = U.canvas(256, 64, g => { g.fillStyle = 'rgba(16,36,26,0.88)'; U.roundRect(g, 2, 2, 252, 60, 14); g.fill(); g.strokeStyle = '#ffcf3f'; g.lineWidth = 3; g.stroke(); let fs = 26; g.font = `600 ${fs}px Kanit, Tahoma, sans-serif`; while (g.measureText(txt).width > 236 && fs > 12) { fs -= 2; g.font = `600 ${fs}px Kanit, Tahoma, sans-serif`; } g.fillStyle = '#fff4d6'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 128, 33); }); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; };
  function rebuild(announce) {
    const list = outList(), sig = list.map(o => o.r.key + ':' + Math.round(o.w.x * 10) + ',' + Math.round(o.w.z * 10)).join('|');
    if (sig === SIG.v) return; const old = new Set((SIG.v || '').split('|').map(x => x.split(':')[0]).filter(Boolean)); SIG.v = sig;
    if (!labels.parent && World.outdoor) World.outdoor.add(labels);
    while (labels.children.length) { const c = labels.children.pop(); labels.remove(c); }
    for (const p of pins.splice(0)) { const i = World.pois.indexOf(p); if (i >= 0) World.pois.splice(i, 1); }
    for (const o of list) {
      const { r, w } = o, gy = World.groundY(w.x, w.z), short = r.n.replace(/\(.*?\)/g, '').trim().slice(0, 26);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTex(`${r.i} ${short}`), transparent: true, depthTest: false })); sp.scale.set(2.6, 0.65, 1); sp.position.set(w.x, gy + Math.max(w.y || 0, 1) + 0.9, w.z); sp.renderOrder = 9; sp.userData.key = r.key; sp.visible = false; labels.add(sp);
      const poi = { kind: 'act', x: w.x, z: w.z, r: 2.6, label: `${r.i} ${r.n} (ติดตั้งนอกบ้าน)`, icon: '📍', map: true, v54: 1, act: () => ({ icon: '📍', label: `ดูอุปกรณ์: ${short}`, fn: () => { UI.close(); ISP.open(); UI.cur.tab = 4; UI.renderBody(); } }) };
      World.pois.push(poi); pins.push(poi);
      if (announce && !old.has(r.key)) UI.toast(`📍 ปักหมุด "${short}" บนแผนที่แล้ว (${Math.round(w.x)}, ${Math.round(w.z)}) — ดู/ชี้ที่ตั้งได้ในแอปอินเทอร์เน็ต แท็บอุปกรณ์เครือข่าย`, '📍');
    }
  }
  function showLabels() {
    if (!labels.children.length) return; const me = G.player.pos;
    for (const s of labels.children) { const d = Math.hypot(s.position.x - me.x, s.position.z - me.z); s.visible = d < 28 && !G.inside; }
  }
  function locate(key) {
    const o = outList().find(x => x.r.key === key);
    if (!o) { UI.toast('อุปกรณ์นี้อยู่ในบ้าน ไม่ใช่นอกบ้าน — ดูตำแหน่งในบ้านที่ตู้เครือข่ายหรือแอปย้ายอุปกรณ์', '🏠'); return; }
    if (beam) { World.outdoor.remove(beam); beam = null; }
    const g = new THREE.Group(), gy = World.groundY(o.w.x, o.w.z);
    const m = new THREE.MeshBasicMaterial({ color: 0xffcf3f, transparent: true, opacity: 0.35, depthWrite: false, toneMapped: false });
    U.mk(g, GEO.cyl, m, [0, 14, 0], [0.35, 28, 0.35]); const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.25, 28), new THREE.MeshBasicMaterial({ color: 0xffcf3f, side: THREE.DoubleSide, transparent: true, opacity: 0.85, toneMapped: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.08; g.add(ring);
    g.position.set(o.w.x, gy, o.w.z); World.outdoor.add(g); beam = g; beam.userData.until = performance.now() + 90000; beam.userData.ring = ring;
    const me = G.player.pos;
    UI.toast(`🔦 ${o.r.n} ติดตั้งที่ ${where(o.r)} — ห่างจากคุณ ${dirText(o.w.x, o.w.z, me.x, me.z)} (มีลำแสงสีเหลืองชี้จุดนี้ 90 วินาที)`, '📍');
    UI.close();
  }
  UI.H.v54loc = d => locate(d.v);
  // the planner app gets a "show where" button next to "move" for every outdoor device
  { const _open = UI.open.bind(UI);
    UI.open = function (title, tabs, render, opts) {
      if (typeof title === 'string' && /ย้ายอุปกรณ์ไอที/.test(title) && typeof render === 'function') {
        const r0 = render, outKeys = () => new Set(outList().map(o => o.r.key));
        render = t => { const out = outKeys(); return r0(t).replace(/(<button class="btn" data-a="mv37go" data-v="([^"]+)">📍 ย้าย<\/button>)/g, (m, b, key) => out.has(key.replace(/&amp;/g, '&')) ? b + `<button class="btn ghost" data-a="v54loc" data-v="${key}">🔦 ชี้ที่ตั้ง</button>` : b); };
      }
      return _open(title, tabs, render, opts);
    }; }
  if (!started) {
    started = true;
    setInterval(() => { try { rebuild(started === 2); showLabels(); if (beam) { if (performance.now() > beam.userData.until) { World.outdoor.remove(beam); beam = null; } else beam.userData.ring.scale.setScalar(1 + 0.25 * Math.sin(performance.now() / 250)); } } catch (e) { console.warn('v54', e); } }, 450);
    setTimeout(() => { started = 2; }, 4000);
  }
  window.Net54 = { devHtml, locate, outList, dirText };
});
