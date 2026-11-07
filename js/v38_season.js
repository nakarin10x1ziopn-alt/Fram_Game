'use strict';
// ---------- v38_season: the three Thai seasons follow the REAL calendar (Cal36) instead of a 7-day cycle ----------
// Thai Meteorological Department: summer 15 Feb – 14 May, rainy season 15 May – 14 Oct, cool season 15 Oct – 14 Feb.
// Before this the HUD could say "ฤดูร้อน" next to "26 ตุลาคม". seasonIdx() is what everything (crops, weather, disasters, illnesses, colours) asks,
// so replacing it keeps all of them in step. Colour blending, the new-season toast, the HUD label and the old calendar text follow along.
(function () {
  const ORDER = ['hot', 'rain', 'cool'];
  const cache = { day: -1, idx: 0 };
  const calc = day => {
    let c; try { c = Cal36.date(day); } catch (e) { return null; }
    if (!c) return null;
    const md = c.m * 100 + c.dom;                       // m is 0-based: 115 = 15 Feb, 414 = 14 May, 914 = 14 Oct
    const id = md >= 115 && md <= 414 ? 'hot' : md >= 415 && md <= 914 ? 'rain' : 'cool';
    return Math.max(0, SEASONS.findIndex(s => s.id === id));
  };
  const idxOf = day => {
    if (day === cache.day) return cache.idx;
    const v = calc(day); if (v == null) return Math.floor((day - 1) / SEASON_LEN) % SEASONS.length;
    cache.day = day; cache.idx = v; return v;
  };
  const sinceStart = () => { const si = idxOf(S.day); let k = 0; while (k < 3 && idxOf(S.day - k - 1) === si) k++; return k; };       // 0..2 = season began k days ago, 3 = settled in
  const daysToChange = () => { const si = idxOf(S.day); for (let k = 1; k <= 130; k++) if (idxOf(S.day + k) !== si) return k; return 130; };

  V23.add('v38_season', () => {
    if (typeof Cal36 === 'undefined' || typeof seasonIdx !== 'function') return;
    seasonIdx = function (day = S.day) { return idxOf(day); };
    window.Season38 = { idxOf, daysToChange, sinceStart, ORDER };

    // terrain and foliage colours blend from the previous season over the first three days of a real season, not every seventh day
    if (typeof Seasons2 !== 'undefined' && Seasons2.look) {
      Seasons2.look = function (kind, i) {
        const si = idxOf(S.day), k = sinceStart(), t = k >= 3 ? 1 : Math.min(1, Math.max(0, (k + S.time / 1440) / 3));
        const pick = id => kind === 'ground' ? SEASON_LOOK[id].ground : SEASON_LOOK[id].fol[i % 3];
        const prev = k >= 3 ? si : idxOf(S.day - k - 1);
        const p = pick(SEASONS[prev].id), c = pick(SEASONS[si].id);
        for (let j = 0; j < 3; j++) this.a[j] = U.lerp(p[j], c[j], t);
        return this.a;
      };
    }

    // the "welcome to the new season" toast only when the season really changes (game.js raises the flag every 7th day)
    { const _nd = newDay;
      newDay = function () { const r = _nd.apply(this, arguments); try { G.newSeason = idxOf(S.day) !== idxOf(S.day - 1); } catch (e) { } return r; }; }

    // HUD: the season name (no "x/7")
    { const _h = UI.hud.bind(UI);
      UI.hud = function () { _h(); try { if (S) { const se = season(), el = document.getElementById('season'); if (el) el.textContent = `${se.i} ${se.n}`; } } catch (e) { } }; }

    // the old calendar screen: say when the real season changes
    { const _c = UI.calendar.bind(UI);
      UI.calendar = function () {
        _c(); const r = UI.cur && UI.cur.render; if (!r) return;
        UI.cur.render = t => {
          let h = r(t); const se = season(), nx = SEASONS[(idxOf(S.day) + 1) % SEASONS.length], n = daysToChange();
          let when = ''; try { const c = Cal36.date(S.day + n); when = ` (${c.dom} ${Cal36.MON ? Cal36.MON[c.m] : ''})`; } catch (e) { }
          return h.replace(/<p class="lead">[^<]*วันที่ \d+\/\d+ · อีก \d+ วันเข้าสู่[^<]*<\/p>/, `<p class="lead">${se.i} ${se.n} · อีก ${n} วัน${when} เข้าสู่ ${nx.i} ${nx.n}</p>`);
        };
        UI.renderBody();
      };
    }
    try { cache.day = -1; _tint && (_tint.i = -1); } catch (e) { }
  });
})();
