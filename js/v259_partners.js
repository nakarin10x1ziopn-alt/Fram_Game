'use strict';
// ---------- v259: the co-founder you register a company with comes from outside the village ----------
// "② จดทะเบียน" page: the "ผู้ถือหุ้น" choice used to list your spouse / friends (and "นักลงทุนอิสระ"). Now it shows 4 named people from the city
// (business owners, wealthy investors, a retired officer) with their job and wealth. Never a villager, friend, spouse or family member.
// The list stays the same for 30 days (so the choice does not change under your finger), then draws new people.
V23.add('v259_partners', function () {
  if (typeof Company === 'undefined' || typeof Inv241 === 'undefined') return;
  const N = 4, DAYS = 30, esc = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const bad = () => { try { if (window.Invite257 && Invite257.villagers) return Invite257.villagers(); } catch (e) { } const s = new Set(); try { for (const n of G.npcs || []) s.add(n.name); for (const k of Object.keys(S.friends || {})) s.add(k); if (S.rel && S.rel.partner) s.add(S.rel.partner); } catch (e) { } return s; };
  const pool = () => {
    const x = S.coPartners; if (x && x.list && x.list.length >= N && S.day - x.day < DAYS && !x.list.some(p => bad().has(p.n))) return x.list;
    const out = [], seen = new Set(), no = bad(), cls = ['biz', 'rich', 'officer', 'biz', 'rich'];
    for (let k = 0; k < 80 && out.length < N; k++) {
      const p = Inv241.make(cls[k % cls.length]); if (!p || no.has(p.n) || seen.has(p.n) || p.serving) continue;   // a serving officer may not sit in a company
      seen.add(p.n); out.push({ n: p.n, prof: p.prof || '', wealth: p.wealth || 0, cls: p.cls });
    }
    S.coPartners = { day: S.day, list: out }; return out;
  };
  Company.partners = () => pool().map(p => p.n);
  const money = v => (typeof baht0 === 'function' ? baht0(v) : Math.round(v).toLocaleString('en-US') + ' ฿');
  { const _h = Company.html.bind(Company);
    Company.html = function (t) {
      let s = _h(t); if (t !== 3 || !s.includes('id="coPartner')) return s;
      for (const p of pool()) s = s.split(`<option>${esc(p.n)}</option>`).join(`<option value="${esc(p.n)}">${esc(p.n)}${p.prof ? ' · ' + esc(p.prof) : ''} · ทรัพย์สิน ${money(p.wealth)}</option>`);
      return s.replace('<option value="">— ไม่มีผู้ถือหุ้นร่วม —</option>', '');
    }; }
  { const _r = Company.register.bind(Company);
    Company.register = function (id, cap, partner, site) {
      if (partner && !pool().some(p => p.n === partner)) { const c = Company.get(id); if (!(c && c.partner === partner)) { try { UI.toast('เลือกผู้ถือหุ้นร่วมจากรายชื่อที่แสดงเท่านั้น', '👥'); } catch (e) { } return; } }
      return _r(id, cap, partner, site);
    }; }
  window.Partners259 = { pool, N };
});
