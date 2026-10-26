# WALLORA

Cross-platform wallpaper ecosystem monorepo. Current implementation starts with a working React web app and an Expo Android app shell, with native Android wallpaper integration isolated in a custom Expo module.

## Workspace

- `apps/web` — React + TypeScript + Vite + Tailwind, local collections, favorites, search, category filtering, download flow, JSONBin metadata loading through a Vercel serverless proxy.
- `apps/mobile` — Expo Router React Native app shell with persistent local collections and platform capability messaging.
- `packages/shared` — shared wallpaper types and demo catalogue.
- `api` — Vercel serverless endpoints. JSONBin credentials are server-only.
- `apps/mobile/modules/wallora-wallpaper` — Android native `WallpaperManager` integration and WorkManager slideshow scheduling.

## Prerequisites

- Node.js 20+
- npm 10+
- For Android: Android Studio, Android SDK, Java 17, and a physical Android device for real wallpaper/slideshow tests.
- Expo development build is required; Expo Go cannot load the custom native module.

## Configure

1. Copy `.env.example` to `.env` for local serverless development (or set the same variables in Vercel project settings).
2. Rotate the JSONBin key if it was shared in a chat or repository. Use the new key only as `JSONBIN_MASTER_KEY`; never use `VITE_` or `EXPO_PUBLIC_`.
3. Keep `WALLPAPERS_BIN_ID` pointed at a JSONBin document containing a `wallpapers` array and optional `categories` array.
4. For analytics writes, create a separate JSONBin bin and set `INSTALL_EVENTS_BIN_ID`. Analytics are best-effort and must not block the app.

## Run web

```bash
npm install
npm run dev:web
```

The web client can run without JSONBin configured and falls back to the bundled demo catalogue. For local Vercel function testing, use the Vercel CLI (`vercel dev`) after configuring environment variables.

## Build web

```bash
npm run typecheck:web
npm run build:web
```

Deploy the repository to Vercel with root directory left at the repository root. The included `vercel.json` routes `/api/*` to serverless functions and all other paths to the Vite SPA. Configure environment variables in Vercel.

## Run Android

```bash
npm run start:mobile
```

Then build a development client rather than using Expo Go:

```bash
npm run android
```

The custom native module lives in `apps/mobile/modules/wallora-wallpaper/android`. Confirm Expo autolinking/build configuration against your installed Expo SDK before release. Build a release APK/AAB only after adding signing configuration.

## Android scheduling reality

- `WallpaperManager` applies a bitmap to Home Screen, Lock Screen, or both on supported Android versions.
- WorkManager periodic jobs have a **15-minute minimum interval** and are inexact. They cannot guarantee one-minute rotations.
- The interval picker includes the requested choices, but intervals below 15 minutes must be labelled as best-effort/unsupported by WorkManager unless a separately justified, policy-compliant foreground mechanism is implemented.
- OEM battery controls, Doze, Android version, lock-screen support, and reboot behavior require physical-device tests.
- This starter does not claim a slideshow is active unless the native scheduler reports that it has been scheduled.

## iOS and desktop

The mobile UI explains that ordinary third-party iOS apps cannot autonomously replace Lock Screen wallpaper on a recurring timer. Save/export and manual setup instructions are the supported path. Tauri desktop wrappers are not included in this first executable slice; the web app is responsive and can be wrapped in a later desktop phase without changing shared domain types.

## JSONBin schema

```json
{
  "wallpapers": [
    {
      "id": "mountain-serenity",
      "title": "Mountain Serenity",
      "description": "A misty mountain landscape",
      "imageUrl": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b",
      "thumbnailUrl": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600",
      "category": "Nature",
      "tags": ["mountains", "landscape"],
      "width": 2160,
      "height": 3840,
      "featured": true,
      "license": "Unsplash license; verify source terms before redistribution"
    }
  ],
  "categories": [{ "id": "nature", "name": "Nature" }]
}
```

Do not assume an image URL alone grants redistribution rights. Verify license/attribution before publishing a catalogue.

## Status

Implemented in this starter: responsive web gallery, search/filter/sort, details modal, favorites, local collections, import local image, downloads, persistent preferences, API fallback, secure server-side JSONBin proxy, analytics endpoint scaffold, mobile navigation/app shell, Android native wallpaper API module and WorkManager-based scheduler scaffold.

Still requires: npm install/build verification in your environment, JSONBin schema validation against your actual bin, native module compile/autolinking verification for the installed Expo SDK, and physical Android device testing. Do not advertise a signed or tested release until those steps pass.
