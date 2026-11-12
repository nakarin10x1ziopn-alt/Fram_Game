// Farm Game V.2 cloud save: GET /api/v2/api/ping -> { ok: true } (the V.2 client adds "/api/ping" to its FARM2_API base)
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  res.status(200).json({ ok: true, cloud: true });
}
