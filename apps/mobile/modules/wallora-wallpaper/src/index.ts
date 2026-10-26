import { requireNativeModule } from "expo-modules-core";
export type WallpaperTarget = "home" | "lock" | "both";
export const WalloraWallpaper = requireNativeModule<{
  setWallpaper(uri: string, target: WallpaperTarget): Promise<{success:boolean;message:string}>;
  startSlideshow(uris: string[], intervalSeconds: number, mode: "sequential"|"random"): Promise<{success:boolean;message:string}>;
  stopSlideshow(): Promise<{success:boolean;message:string}>;
}>("WalloraWallpaper");
