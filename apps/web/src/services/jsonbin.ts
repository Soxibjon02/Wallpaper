import type { Wallpaper } from "@shared/index";
import { demoWallpapers, defaultCategories } from "@shared/index";

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

export interface CatalogueData {
  wallpapers: Wallpaper[];
  categories: string[];
}

// In-memory cache of current categories so saveWallpapersToBin preserves them
let cachedCategories: string[] = [...defaultCategories];

export function getCachedCategories(): string[] {
  return cachedCategories;
}

export function setCachedCategories(cats: string[]): void {
  if (Array.isArray(cats) && cats.length) {
    cachedCategories = cats;
  }
}

export async function fetchCatalogueFromBin(): Promise<CatalogueData> {
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

    let wallpapers: Wallpaper[] = demoWallpapers;
    let categories: string[] = defaultCategories;

    if (record && typeof record === "object") {
      const recObj = record as { wallpapers?: unknown; categories?: unknown };
      if (Array.isArray(recObj.wallpapers)) {
        wallpapers = recObj.wallpapers as Wallpaper[];
      }
      if (Array.isArray(recObj.categories) && recObj.categories.length) {
        categories = recObj.categories as string[];
      }
    } else if (Array.isArray(record)) {
      wallpapers = record as Wallpaper[];
    }

    setCachedCategories(categories);
    return { wallpapers, categories };
  } catch (err) {
    console.warn("Failed to fetch from JSONBin, falling back to local defaults:", err);
    return { wallpapers: demoWallpapers, categories: defaultCategories };
  }
}

export async function fetchWallpapersFromBin(): Promise<Wallpaper[]> {
  const catalogue = await fetchCatalogueFromBin();
  return catalogue.wallpapers;
}

export async function saveCatalogueToBin(wallpapers: Wallpaper[], categories: string[]): Promise<boolean> {
  const url = `${JSONBIN_CONFIG.baseUrl}/${JSONBIN_CONFIG.binId}`;
  setCachedCategories(categories);

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": JSONBIN_CONFIG.apiKey,
    },
    body: JSON.stringify({ wallpapers, categories }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`JSONBin ga saqlashda xatolik yuz berdi (${response.status}): ${errText}`);
  }

  return true;
}

export async function saveWallpapersToBin(wallpapers: Wallpaper[], categories?: string[]): Promise<boolean> {
  const cats = categories && categories.length ? categories : cachedCategories;
  return saveCatalogueToBin(wallpapers, cats);
}

