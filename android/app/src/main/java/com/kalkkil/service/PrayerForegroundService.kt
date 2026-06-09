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
 * 1. Shows a persistent notification with the next prayer time and countdown
 * 2. Periodically (every 30s) updates the widget from SharedPreferences
 * 3. Keeps the app process alive so Notifee scheduled notifications can fire
 *
 * Started from HomeScreen and survives app being swiped from recents.
 * On most devices, the service keeps running; on some aggressive manufacturers
 * the user may need to disable battery optimization for the app.
 */
class PrayerForegroundService : Service() {

    companion object {
        const val CHANNEL_ID = "prayer-foreground-channel"
        const val NOTIFICATION_ID = 2
        const val ACTION_START = "com.kalkkil.action.START_FOREGROUND"
        const val UPDATE_INTERVAL_MS = 30_000L // 30 seconds
    }

    private val handler = Handler(Looper.getMainLooper())
    private val updateRunnable = object : Runnable {
        override fun run() {
            updateWidgetAndNotification()
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

    private fun buildNotification(): Notification {
        val prefs = getSharedPreferences(PrayerWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE)
        val nextName = prefs.getString(PrayerWidgetProvider.KEY_NEXT_PRAYER_NAME, null)
        val nextTime = prefs.getString(PrayerWidgetProvider.KEY_NEXT_PRAYER_TIME, null)
        val countdown = prefs.getString(PrayerWidgetProvider.KEY_COUNTDOWN, null)

        val title: String
        val content: String

        if (nextName != null && nextTime != null) {
            title = "\uD83C\uDF19 $nextName $nextTime"
            content = if (countdown != null && countdown != "--:--") {
                // Convert "HH:MM" to readable format
                val parts = countdown.split(":")
                if (parts.size >= 2) {
                    val h = parts[0].toIntOrNull() ?: 0
                    val m = parts[1].toIntOrNull() ?: 0
                    if (h > 0) "${h}sa ${m}dk kaldı"
                    else "${m}dk kaldı"
                } else {
                    "$countdown kaldı"
                }
            } else {
                "\u2009—\u2009vakit bekleniyor"
            }
        } else {
            title = "\uD83C\uDF19 KalkKıl"
            content = "Vakitler hesaplanıyor..."
        }

        val openIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 0, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(content)
            .setSmallIcon(R.drawable.ic_notification_moon)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .setSilent(true)
            .build()
    }

    private fun updateWidgetAndNotification() {
        // Update notification
        val notification = buildNotification()
        val manager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(NOTIFICATION_ID, notification)

        // Update widget
        val appWidgetManager = android.appwidget.AppWidgetManager.getInstance(this)
        val widgetComponent = android.content.ComponentName(this, PrayerWidgetProvider::class.java)
        val appWidgetIds = appWidgetManager.getAppWidgetIds(widgetComponent)

        for (widgetId in appWidgetIds) {
            PrayerWidgetProvider.updateWidget(this, appWidgetManager, widgetId)
        }
    }

}
