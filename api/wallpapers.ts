import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const binId = process.env.WALLPAPERS_BIN_ID;
  const key = process.env.JSONBIN_MASTER_KEY;
  if (!binId || !key) return res.status(503).json({ error: "Remote catalogue is not configured" });
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${encodeURIComponent(binId)}/latest`, {
      headers: { "X-Master-Key": key, "X-Bin-Meta": "false" },
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) return res.status(502).json({ error: "Catalogue provider returned an error" });
    const payload: unknown = await response.json();
    const record = payload && typeof payload === "object" && "record" in payload ? (payload as {record: unknown}).record : payload;
    if (!record || typeof record !== "object" || !Array.isArray((record as {wallpapers?: unknown}).wallpapers)) {
      return res.status(502).json({ error: "Catalogue schema is invalid" });
    }
    return res.status(200).json(record);
  } catch {
    return res.status(504).json({ error: "Catalogue request timed out" });
  }
}
