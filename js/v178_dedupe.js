'use strict';
// ---------- v178_dedupe: the same product is no longer sold twice ----------
//  Checked every shop in the village and in the big / middle / small cities (66 shops). Rule, applied per area (village · small city · middle city · big city):
//   * the same product (same name) listed twice in one shop -> one is cut
//   * the same product sold by several shops of one area -> only the shop that fits it best keeps it (the shop where that kind of thing is most of what is sold; seasonal fair stalls and the
//     online shop come last), the other shops no longer list it
//   * NOT touched: equipment / tools, IT and computer parts, cars, furniture, lights, security gear, solar / EV (by item type, by shop tab name, and whole shops of those kinds)
//   * a shop is never emptied: a shop that would be left with fewer than 6 items keeps its list as it was
//  City shops are created when the city is first built, so each area is checked once, the first time one of its shops is opened (everything of the area exists by then).
V23.add('v178_dedupe', () => {
  if (typeof SHOPS === 'undefined' || typeof UI === 'undefined') return;
  const PROT = new Set(['car', 'furn', 'light', 'sec', 'pw', 'fut', 'v23e', 'pc', 'pcc', 'pcset', 'up']);
  const EQ = /^(hw|fs|rn|d2|dl|ev|sc|it|ol|ps|sp|rr)_/;
  const TABP = /อุปกรณ์|ไอที|ไฟ|คอม|เครื่องใช้ไฟฟ้า|ยานยนต์|รถ|เฟอร์|ตกแต่ง|โซลาร์|แบตเตอรี่|ความปลอดภัย|กล้อง|เครือข่าย|ช่าง/;
  const SHOPP = /^(hardware|itshop|evcenter|secshop|pcshop|dealer|dealer2|supercar|carpenter|lux)$/;
  const areaOf = sid => (/^pcc_/.test(sid) ? sid.slice(4) : /(^|_)metro(_|$)/.test(sid) ? 'metro' : /orchard/.test(sid) ? 'orchard' : /sunflower/.test(sid) ? 'sunflower' : 'village');
  const done = {}, log = {};
  const nameOf = (k, sid) => { try { const e = UI.entry(k, sid); return (e && (e.name || e.n)) || k; } catch (e) { return k; } };
  const isProt = (sid, tab, k) => { const pre = k.split(':')[0], id = k.slice(pre.length + 1); return PROT.has(pre) || (pre === 'tool' && EQ.test(id)) || TABP.test(tab.n || '') || SHOPP.test(sid) || /^pcc_/.test(sid); };

  function run(area) {
    if (done[area]) return; const ids = Object.keys(SHOPS).filter(s => areaOf(s) === area); if (!ids.length) return; done[area] = 1;
    const E = []; // {sid, ti, k, name, pre}
    const total = {}, share = {};
    for (const sid of ids) { total[sid] = 0; share[sid] = {}; (SHOPS[sid].tabs || []).forEach((t, ti) => (t.items || []).forEach(k => { total[sid]++; if (isProt(sid, t, k)) return; const pre = k.split(':')[0]; share[sid][pre] = (share[sid][pre] || 0) + 1; E.push({ sid, ti, k, name: nameOf(k, sid), pre }); })); }
    const unprot = sid => Object.values(share[sid]).reduce((a, b) => a + b, 0) || 1;
    const spec = (sid, pre) => (share[sid][pre] || 0) / unprot(sid) - (/^fest_/.test(sid) ? 1 : 0) - (sid === 'online' ? 2 : 0);
    const groups = {}; for (const e of E) (groups[e.name] = groups[e.name] || []).push(e);
    const cut = {}; // sid -> Set(index key "ti|k|n")
    const mark = (e, n) => { (cut[e.sid] = cut[e.sid] || new Set()).add(e.ti + '|' + e.k + '|' + n); };
    for (const arr of Object.values(groups)) {
      if (arr.length < 2) continue;
      let win = arr[0]; for (const e of arr) if (spec(e.sid, e.pre) > spec(win.sid, win.pre)) win = e;
      let seen = 0; for (const e of arr) { const n = arr.filter(x => x.sid === e.sid && x.ti === e.ti && x.k === e.k).indexOf(e); if (e === win) continue; mark(e, n); }
    }
    let cutN = 0, kept = 0;
    for (const sid of ids) {
      const c = cut[sid]; if (!c || !c.size) continue; if (total[sid] - c.size < 6) { kept += c.size; continue; }   // never empty a shop
      (SHOPS[sid].tabs || []).forEach((t, ti) => { const seenKeys = {}; t.items = (t.items || []).filter(k => { const n = (seenKeys[k] = (seenKeys[k] == null ? 0 : seenKeys[k] + 1)); if (c.has(ti + '|' + k + '|' + n)) { cutN++; return false; } return true; }); });
      SHOPS[sid].tabs = (SHOPS[sid].tabs || []).filter(t => (t.items || []).length > 0);
    }
    log[area] = { shops: ids.length, products: Object.keys(groups).length, cut: cutN, keptBecauseShopWouldBeEmpty: kept };
  }
  const first = sid => run(areaOf(sid));
  { const _shop = UI.shop.bind(UI); UI.shop = function (id) { try { first(id); } catch (e) { console.warn('v178', e); } return _shop(id); }; }
  // village: also once the game has been running a little (everything the other modules add to the shops is in by then)
  setTimeout(() => { try { if (typeof G !== 'undefined' && G.started) run('village'); else setTimeout(() => { try { run('village'); } catch (e) { } }, 20000); } catch (e) { } }, 15000);
  window.Dedupe178 = { run, areaOf, log, isProt };
});
