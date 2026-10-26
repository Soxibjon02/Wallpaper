# Android wallpaper module

This custom Expo module uses `WallpaperManager` to set a user-selected wallpaper and `WorkManager` for periodic rotation.

Important implementation note: WorkManager periodic requests have a 15-minute minimum and are inexact. This initial scheduler currently applies the default wallpaper target from `WallpaperManager.setBitmap(bitmap)` for rotation, which normally means the system wallpaper target supported by the device; target selection for slideshow should be persisted explicitly in a follow-up implementation before claiming Home/Lock/Both rotation control. Physical-device tests are mandatory.

The module uses URI strings supplied by the app. For production, copy imported/remote images into app-private files and pass stable local file URIs to WorkManager. Network URLs may expire or fail while the app is in the background.
