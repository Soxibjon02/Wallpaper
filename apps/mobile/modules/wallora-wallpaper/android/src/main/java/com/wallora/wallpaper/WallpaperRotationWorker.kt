package com.wallora.wallpaper

import android.app.WallpaperManager
import android.content.Context
import android.graphics.BitmapFactory
import android.net.Uri
import androidx.work.Worker
import androidx.work.WorkerParameters
import java.io.File
import java.net.URL

class WallpaperRotationWorker(context: Context, params: WorkerParameters) : Worker(context, params) {
  override fun doWork(): Result {
    val uris = inputData.getStringArray("uris") ?: return Result.failure()
    if (uris.size < 2) return Result.failure()
    val mode = inputData.getString("mode") ?: "sequential"
    val prefs = applicationContext.getSharedPreferences("wallora_slideshow", Context.MODE_PRIVATE)
    val previous = prefs.getInt("index", -1)
    val next = if (mode == "random") {
      var candidate = (uris.indices).random()
      if (uris.size > 1 && candidate == previous) candidate = (candidate + 1) % uris.size
      candidate
    } else (previous + 1) % uris.size
    return try {
      val value = uris[next]
      val bitmap = if (value.startsWith("http://") || value.startsWith("https://")) {
        URL(value).openStream().use { BitmapFactory.decodeStream(it) }
      } else {
        val uri = Uri.parse(value)
        val stream = if (uri.scheme == "file") File(uri.path ?: "").inputStream()
          else applicationContext.contentResolver.openInputStream(uri)
        stream?.use { BitmapFactory.decodeStream(it) }
      } ?: return Result.retry()
      WallpaperManager.getInstance(applicationContext).setBitmap(bitmap)
      prefs.edit().putInt("index", next).apply()
      Result.success()
    } catch (_: Exception) {
      Result.retry()
    }
  }
}
