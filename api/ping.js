// GET /api/ping -> { ok: true, cloud: true }: tells the game that cloud saves are available on this host (no live presence / chat)
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ ok: true, cloud: true });
}
