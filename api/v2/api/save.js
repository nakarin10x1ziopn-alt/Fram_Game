// Farm Game V.2 cloud save: GET /api/v2/api/save?id=<code>_<slot>  ->  { save }   POST { id, save }  (save = null deletes the slot)
// The id (the player's secret code + _1 / _2) is the only key: whoever knows it can read and replace that farm, nobody can list farms. Storage: the PRIVATE Vercel Blob store, one small JSON file per slot.
// An older copy never replaces a newer one (compared by save.last), so two devices / a late request can not roll a farm back.
import { put, get } from '@vercel/blob';

const ID_RE = /^[A-Za-z0-9_-]{4,60}_[12]$/;   // same rule as the V.2 server.py
const MAX = 1500000;

const cors = res => { res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); res.setHeader('Cache-Control', 'no-store'); };
const read = async id => { const r = await get(`farm2/${id}.json`, { access: 'private', useCache: false }); if (!r || r.statusCode !== 200) return null; try { return JSON.parse(await new Response(r.stream).text()); } catch (e) { return null; } };

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const id = String((req.query && req.query.id) || '');
      if (!ID_RE.test(id)) return res.status(400).json({ error: 'bad id' });
      const o = await read(id);
      return res.status(200).json({ save: o && o.save ? o.save : null });
    }
    if (req.method === 'POST') {
      const b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const id = String(b.id || '');
      if (!ID_RE.test(id)) return res.status(400).json({ error: 'bad id' });
      if (b.save === null) {   // delete the slot
        await put(`farm2/${id}.json`, JSON.stringify({ save: null, ts: Date.now() }), { access: 'private', allowOverwrite: true, addRandomSuffix: false, contentType: 'application/json' });
        return res.status(200).json({ ok: true, deleted: true });
      }
      const s = b.save;
      if (!s || typeof s !== 'object' || s.v !== 1 || !Array.isArray(s.plots)) return res.status(400).json({ error: 'bad save' });
      const body = JSON.stringify({ save: s, ts: Date.now() });
      if (body.length > MAX) return res.status(413).json({ error: 'too large' });
      try { const cur = await read(id); if (cur && cur.save && typeof cur.save.last === 'number' && typeof s.last === 'number' && cur.save.last > s.last) return res.status(200).json({ ok: true, ignored: 'older' }); } catch (e) { }
      await put(`farm2/${id}.json`, body, { access: 'private', allowOverwrite: true, addRandomSuffix: false, contentType: 'application/json' });
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'method' });
  } catch (e) {
    res.status(500).json({ error: String(e && e.message || e).slice(0, 200) });
  }
}
