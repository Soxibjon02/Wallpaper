import type { VercelRequest, VercelResponse } from "@vercel/node";

type InstallEvent = {
  installationId: string;
  platform: string;
  appVersion: string;
  eventType: "pwa_installed" | "first_launch";
  installedAt: string;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const eventsBin = process.env.INSTALL_EVENTS_BIN_ID;
  const key = process.env.JSONBIN_MASTER_KEY;
  if (!eventsBin || !key) return res.status(202).json({ accepted: false, reason: "Analytics not configured" });
  const body = req.body as Partial<InstallEvent>;
  if (!body || typeof body.installationId !== "string" || body.installationId.length > 128 ||
      typeof body.platform !== "string" || typeof body.appVersion !== "string" ||
      !["pwa_installed", "first_launch"].includes(String(body.eventType))) {
    return res.status(400).json({ error: "Invalid installation event" });
  }
  // Append-only storage avoids overwriting the wallpaper catalogue. In production, use a
  // dedicated event store/queue if multiple concurrent writers are expected.
  try {
    const read = await fetch(`https://api.jsonbin.io/v3/b/${encodeURIComponent(eventsBin)}/latest`, {
      headers: { "X-Master-Key": key }, signal: AbortSignal.timeout(8000)
    });
    let events: InstallEvent[] = [];
    if (read.ok) {
      const data = await read.json() as {record?: {events?: InstallEvent[]}};
      events = Array.isArray(data.record?.events) ? data.record.events : [];
    }
    if (events.some(e => e.installationId === body.installationId && e.eventType === body.eventType)) {
      return res.status(200).json({ accepted: true, duplicate: true });
    }
    events.push({
      installationId: body.installationId,
      platform: body.platform.slice(0, 40),
      appVersion: body.appVersion.slice(0, 40),
      eventType: body.eventType as InstallEvent["eventType"],
      installedAt: new Date().toISOString()
    });
    const write = await fetch(`https://api.jsonbin.io/v3/b/${encodeURIComponent(eventsBin)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Master-Key": key },
      body: JSON.stringify({ events }), signal: AbortSignal.timeout(8000)
    });
    if (!write.ok) return res.status(502).json({ accepted: false, reason: "Analytics write failed" });
    return res.status(200).json({ accepted: true });
  } catch {
    return res.status(202).json({ accepted: false, reason: "Analytics temporarily unavailable" });
  }
}
