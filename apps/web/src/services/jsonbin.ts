import type { Wallpaper } from "@shared/index";
import { demoWallpapers } from "@shared/index";

export const JSONBIN_CONFIG = {
  binId: "6adf382fffd5d160538c8a63",
  apiKey: "$2a$10$pb5xLem3GhkJMrCrCnbypuFPzhC4FCQqZg6UcD85L9WJgXFKrntsu",
  baseUrl: "https://api.jsonbin.io/v3/b",
};

export const ADMIN_CREDENTIALS = {
  login: "admin1234",
  password: "admin123",
};

export function isAdminAuthenticated(): boolean {
  try {
    return sessionStorage.getItem("wallora:admin_auth") === "true";
  } catch {
    return false;
  }
}

export function setAdminAuthenticated(auth: boolean): void {
  try {
    if (auth) {
      sessionStorage.setItem("wallora:admin_auth", "true");
    } else {
      sessionStorage.removeItem("wallora:admin_auth");
    }
  } catch {
    // ignore
  }
}

export async function fetchWallpapersFromBin(): Promise<Wallpaper[]> {
  try {
    const url = `${JSONBIN_CONFIG.baseUrl}/${JSONBIN_CONFIG.binId}/latest`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Master-Key": JSONBIN_CONFIG.apiKey,
        "X-Bin-Meta": "false",
      },
    });

    if (!response.ok) {
      throw new Error(`JSONBin error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const record = data && typeof data === "object" && "record" in data ? (data as { record: unknown }).record : data;

    if (record && typeof record === "object" && Array.isArray((record as { wallpapers?: unknown }).wallpapers)) {
      return (record as { wallpapers: Wallpaper[] }).wallpapers;
    }

    if (Array.isArray(record)) {
      return record as Wallpaper[];
    }

    return demoWallpapers;
  } catch (err) {
    console.warn("Failed to fetch from JSONBin, falling back to local:", err);
    return demoWallpapers;
  }
}

export async function saveWallpapersToBin(wallpapers: Wallpaper[]): Promise<boolean> {
  const url = `${JSONBIN_CONFIG.baseUrl}/${JSONBIN_CONFIG.binId}`;
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": JSONBIN_CONFIG.apiKey,
    },
    body: JSON.stringify({ wallpapers }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`JSONBin ga saqlashda xatolik yuz berdi (${response.status}): ${errText}`);
  }

  return true;
}
