package com.kalkkil.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import com.kalkkil.MainActivity
import com.kalkkil.R
import com.kalkkil.widget.PrayerWidgetProvider

/**
 * Foreground service that keeps KalkKil alive in the background.
 *
 * Responsibilities:
 * 1. Shows a persistent notification with:
 *    - Title: next prayer name + exact time
 *    - Content: live countdown (HH:MM:SS)
 *    - Big text: all daily prayer times, next one in bold via Unicode trick
 * 2. Periodically (every 1s) updates the notification countdown
 * 3. Every 30s updates the home screen widget
 * 4. Keeps the app process alive so Notifee scheduled notifications can fire
 */
class PrayerForegroundService : Service() {

    companion object {
        const val CHANNEL_ID = "prayer-foreground-channel"
        const val NOTIFICATION_ID = 2
        const val ACTION_START = "com.kalkkil.action.START_FOREGROUND"
        const val UPDATE_INTERVAL_MS = 1_000L   // 1 second — saniye bazlı countdown
        const val WIDGET_UPDATE_INTERVAL = 1     // her saniye widget güncelle — canlı geri sayım
    }

    private val handler = Handler(Looper.getMainLooper())
    private var tickCount = 0

    private val updateRunnable = object : Runnable {
        override fun run() {
            tickCount++
            updateNotification()
            // Widget her saniye güncellenir — countdown canlı aksın
            if (tickCount % WIDGET_UPDATE_INTERVAL == 0) {
                updateWidget()
            }
            handler.postDelayed(this, UPDATE_INTERVAL_MS)
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = buildNotification()
        startForeground(NOTIFICATION_ID, notification)
        handler.removeCallbacks(updateRunnable)
        handler.post(updateRunnable)
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        handler.removeCallbacks(updateRunnable)
        super.onDestroy()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "KalkKıl Vakit Servisi",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Namaz vakitlerini gösteren kalıcı bildirim"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    /**
     * Bildirim içeriği:
     *   Title  : 🌙 İkindi · 16:45
     *   Content: 01:23:45 kaldı
     *   BigText: tüm günlük vakitler, sıradaki satır başına → işareti
     */
    private fun buildNotification(): Notification {
        val prefs = getSharedPreferences(PrayerWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE)
        val event = PrayerWidgetProvider.findNextEvent(prefs)
        val allTimesRaw = prefs.getString(PrayerWidgetProvider.KEY_ALL_TIMES, null)

        val countdown = calculateDynamicCountdown(prefs)

        val title = if (event != null) {
            "\uD83C\uDF19 ${event.name} · ${event.time}"
        } else {
            "\uD83C\uDF19 KalkKıl"
        }

        val contentText = when {
            countdown != "00:00:00" && countdown != "--:--:--" -> "$countdown kaldı"
            countdown == "00:00:00" -> "Sonraki vakit bekleniyor..."
            else -> "Vakitler hesaplanıyor..."
        }

        // BigText: tüm vakitler, sıradaki → ile işaretli
        val bigText = buildBigText(allTimesRaw, event?.name)

        val openIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 0, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(contentText)
            .setSmallIcon(R.drawable.ic_notification)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setContentIntent(pendingIntent)
            .setSilent(true)
            .setStyle(
                NotificationCompat.BigTextStyle()
                    .bigText(bigText)
                    .setBigContentTitle(title)
            )
            .build()
    }

    /**
     * allTimesRaw formatı: "İmsak|04:32|Güneş|06:01|Öğle|12:45|İkindi|16:23|Akşam|19:11|Yatsı|20:41"
     *
     * Yatay format — 3 vakit yanyana pipe ile, 2 satırda 6 vakit:
     *   İmsak 04:32  │  Güneş 06:01  │  Öğle 12:45
     * › İkindi 16:23  │  Akşam 19:11  │  Yatsı 20:41
     */
    private fun buildBigText(allTimesRaw: String?, nextName: String?): String {
        if (allTimesRaw.isNullOrBlank()) return "Vakitler hesaplanıyor..."

        val parts = allTimesRaw.split("|")
        if (parts.size < 2) return allTimesRaw

        // Pair listesi oluştur: [(ad, saat), (ad, saat), ...]
        val pairs = mutableListOf<Pair<String, String>>()
        var i = 0
        while (i + 1 < parts.size) {
            pairs.add(parts[i].trim() to parts[i + 1].trim())
            i += 2
        }

        if (pairs.isEmpty()) return "Vakitler hazırlanıyor..."

        // 3'erli grupla — 2 satır (6 vakit için)
        val sb = StringBuilder()
        val chunkSize = 3

        pairs.chunked(chunkSize).forEachIndexed { rowIdx, row ->
            if (rowIdx > 0) sb.append("\n")
            row.forEachIndexed { colIdx, (name, time) ->
                if (colIdx > 0) sb.append("  │  ")
                val isNext = nextName != null && name.equals(nextName, ignoreCase = true)
                if (isNext) {
                    sb.append("› $name $time")
                } else {
                    sb.append("  $name $time")
                }
            }
        }

        return sb.toString()
    }

    /**
     * HH:MM:SS formatında canlı geri sayım.
     * KEY_NEXT_PRAYER_TIMESTAMP: Unix milisaniye string olarak saklanır.
     * KEY_ALL_TIMESTAMPS: tüm vakitlerin epoch ms'leri pipe-ayrılmış.
     *
     * Artık TEK timestamp'e bağımlı değil — tüm vakitlerin timestamps'ini
     * okuyup hangisi şu an > System.currentTimeMillis() ise onu kullanır.
     * Böylece vakit geçişlerinde JS bridge'i beklemeden otomatik devam eder.
     */
    private fun calculateDynamicCountdown(prefs: android.content.SharedPreferences): String {
        val event = PrayerWidgetProvider.findNextEvent(prefs) ?: return "00:00:00"
        val diffMs = event.timestamp - System.currentTimeMillis()
        if (diffMs <= 0) return "00:00:00"
        val totalSec = diffMs / 1000
        val h = (totalSec / 3600).toInt()
        val m = ((totalSec % 3600) / 60).toInt()
        val s = (totalSec % 60).toInt()
        return "${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}"
    }

    /**
     * Geriye dönük uyumluluk için tutuluyor; yeni akış PrayerWidgetProvider.findNextEvent kullanır.
     */
    private fun findNextTimestamp(prefs: android.content.SharedPreferences): Long? {
        return PrayerWidgetProvider.findNextEvent(prefs)?.timestamp
    }

    private fun updateNotification() {
        val notification = buildNotification()
        val manager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(NOTIFICATION_ID, notification)
    }

    private fun updateWidget() {
        val prefs = getSharedPreferences(PrayerWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE)
        val dynamicCountdown = calculateDynamicCountdown(prefs)

        val appWidgetManager = android.appwidget.AppWidgetManager.getInstance(this)
        val widgetComponent = android.content.ComponentName(this, PrayerWidgetProvider::class.java)
        val appWidgetIds = appWidgetManager.getAppWidgetIds(widgetComponent)

        for (widgetId in appWidgetIds) {
            PrayerWidgetProvider.updateWidget(this, appWidgetManager, widgetId, dynamicCountdown)
        }
    }
}
