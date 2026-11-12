// Cloud save for ไร่สุขใจ: GET /api/save?id=<code>  ->  { save, ts }  |  POST /api/save { id, save, ts } -> { ok: true }
// The id is the player's secret sync code (16 random characters, plus _s2 / _s3 for the other save slots): whoever knows it can read and replace that save, nobody can list saves.
// Storage: a PRIVATE Vercel Blob store (token in BLOB_READ_WRITE_TOKEN), one small JSON file per id.
import { put, get } from '@vercel/blob';

const ID_RE = /^[a-z0-9]{16}(_s[23])?$/;
const MAX = 1500000;   // bytes of JSON per save

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') {
      const id = String((req.query && req.query.id) || '');
      if (!ID_RE.test(id)) return res.status(400).json({ error: 'bad id' });
      const r = await get(`saves/${id}.json`, { access: 'private', useCache: false });
      if (!r || r.statusCode !== 200) return res.status(200).json({ save: null });
      const text = await new Response(r.stream).text();
      let o = null; try { o = JSON.parse(text); } catch (e) { }
      return res.status(200).json(o && o.save ? { save: o.save, ts: o.ts || 0 } : { save: null });
    }
    if (req.method === 'POST') {
      const b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const id = String(b.id || '');
      if (!ID_RE.test(id)) return res.status(400).json({ error: 'bad id' });
      if (b.save === null) {   // delete (the game's "delete slot")
        await put(`saves/${id}.json`, JSON.stringify({ save: null, ts: Date.now() }), { access: 'private', allowOverwrite: true, addRandomSuffix: false, contentType: 'application/json' });
        return res.status(200).json({ ok: true });
      }
      const s = b.save;
      if (!s || typeof s !== 'object' || typeof s.money !== 'number' || typeof s.day !== 'number') return res.status(400).json({ error: 'not a save' });
      const ts = Number(b.ts) || Date.now(), body = JSON.stringify({ save: s, ts });
      if (body.length > MAX) return res.status(413).json({ error: 'too large' });
      // an older copy never replaces a newer one (requests can arrive out of order)
      try { const cur = await get(`saves/${id}.json`, { access: 'private', useCache: false }); if (cur && cur.statusCode === 200) { const o = JSON.parse(await new Response(cur.stream).text()); if (o && o.save && Number(o.ts) > ts) return res.status(200).json({ ok: true, ignored: 'older' }); } } catch (e) { }
      await put(`saves/${id}.json`, body, { access: 'private', allowOverwrite: true, addRandomSuffix: false, contentType: 'application/json' });
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'method' });
  } catch (e) {
    res.status(500).json({ error: String(e && e.message || e).slice(0, 200) });
  }
}
