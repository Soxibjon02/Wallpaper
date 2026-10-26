package com.wallora.wallpaper

import android.app.WallpaperManager
import android.content.Context
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import androidx.work.*
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.net.URL
import java.util.concurrent.TimeUnit

class WalloraWallpaperModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("WalloraWallpaper")
    AsyncFunction("setWallpaper") { uri: String, target: String ->
      val context = appContext.reactContext ?: throw Exception("Android context unavailable")
      val bitmap = loadBitmap(context, uri)
      val manager = WallpaperManager.getInstance(context)
      val flags = when (target) {
        "home" -> WallpaperManager.FLAG_SYSTEM
        "lock" -> WallpaperManager.FLAG_LOCK
        "both" -> WallpaperManager.FLAG_SYSTEM or WallpaperManager.FLAG_LOCK
        else -> WallpaperManager.FLAG_SYSTEM
      }
      try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) manager.setBitmap(bitmap, null, true, flags)
        else manager.setBitmap(bitmap)
        mapOf("success" to true, "message" to "Wallpaper applied by Android WallpaperManager")
      } catch (e: SecurityException) {
        mapOf("success" to false, "message" to "Android denied wallpaper change: ${e.message ?: "permission or device restriction"}")
      } catch (e: Exception) {
        mapOf("success" to false, "message" to "Could not set wallpaper: ${e.message ?: "unknown error"}")
      }
    }
    AsyncFunction("startSlideshow") { uris: List<String>, intervalSeconds: Int, mode: String ->
      val context = appContext.reactContext ?: throw Exception("Android context unavailable")
      if (uris.size < 2) return@AsyncFunction mapOf("success" to false, "message" to "Choose at least two images")
      val validUris = uris.filter { it.isNotBlank() }
      if (validUris.size < 2) return@AsyncFunction mapOf("success" to false, "message" to "Not enough valid image URIs")
      val data = Data.Builder()
        .putStringArray("uris", validUris.toTypedArray())
        .putString("mode", if (mode == "random") "random" else "sequential")
        .putInt("index", 0)
        .build()
      val safeInterval = intervalSeconds.coerceAtLeast(15 * 60)
      val request = PeriodicWorkRequestBuilder<WallpaperRotationWorker>(safeInterval.toLong(), TimeUnit.SECONDS)
        .setInputData(data)
        .addTag("wallora-slideshow")
        .build()
      WorkManager.getInstance(context).enqueueUniquePeriodicWork("wallora-slideshow", ExistingPeriodicWorkPolicy.UPDATE, request)
      mapOf("success" to true, "message" to "Scheduled with WorkManager. Minimum interval is 15 minutes; timing is inexact and subject to Android power policies.")
    }
    AsyncFunction("stopSlideshow") {
      val context = appContext.reactContext ?: throw Exception("Android context unavailable")
      WorkManager.getInstance(context).cancelUniqueWork("wallora-slideshow")
      mapOf("success" to true, "message" to "Slideshow work cancelled")
    }
  }

  private fun loadBitmap(context: Context, value: String) =
    if (value.startsWith("http://") || value.startsWith("https://")) {
      // Network I/O is moved off the main thread by the Expo AsyncFunction.
      URL(value).openStream().use { BitmapFactory.decodeStream(it) }
        ?: throw Exception("Image could not be decoded")
    } else {
      val uri = Uri.parse(value)
      val stream = if (uri.scheme == "file") File(uri.path ?: "").inputStream()
        else context.contentResolver.openInputStream(uri)
      stream?.use { BitmapFactory.decodeStream(it) } ?: throw Exception("Image file is unavailable")
    }
}
