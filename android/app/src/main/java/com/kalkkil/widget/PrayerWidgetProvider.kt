package com.kalkkil.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.kalkkil.MainActivity
import com.kalkkil.R

class PrayerWidgetProvider : AppWidgetProvider() {

    companion object {
        const val PREFS_NAME = "KalkKilWidgetPrefs"
        const val KEY_NEXT_PRAYER_NAME = "next_prayer_name"
        const val KEY_NEXT_PRAYER_TIME = "next_prayer_time"
        const val KEY_COUNTDOWN = "countdown"
        const val KEY_NEXT_PRAYER_TIMESTAMP = "next_prayer_timestamp"
        const val KEY_ALL_TIMES = "all_times"
        const val KEY_ALL_TIMESTAMPS = "all_timestamps"

        data class NextEvent(val name: String, val time: String, val timestamp: Long)

        fun findNextEvent(prefs: android.content.SharedPreferences): NextEvent? {
            val allTimes = prefs.getString(KEY_ALL_TIMES, null)
            val allTimestamps = prefs.getString(KEY_ALL_TIMESTAMPS, null)
            if (allTimes.isNullOrBlank() || allTimestamps.isNullOrBlank()) {
                val ts = prefs.getString(KEY_NEXT_PRAYER_TIMESTAMP, null)?.toLongOrNull() ?: return null
                if (ts <= System.currentTimeMillis()) return null
                return NextEvent(
                    prefs.getString(KEY_NEXT_PRAYER_NAME, "--") ?: "--",
                    prefs.getString(KEY_NEXT_PRAYER_TIME, "--:--") ?: "--:--",
                    ts
                )
            }

            val parts = allTimes.split("|")
            val timestamps = allTimestamps.split("|")
            val now = System.currentTimeMillis()
            var eventIndex = 0
            var partIndex = 0
            while (partIndex + 1 < parts.size && eventIndex < timestamps.size) {
                val ts = timestamps[eventIndex].toLongOrNull()
                if (ts != null && ts > now) {
                    return NextEvent(parts[partIndex].trim(), parts[partIndex + 1].trim(), ts)
                }
                eventIndex++
                partIndex += 2
            }
            return null
        }

        fun calculateCountdown(timestamp: Long?): String {
            if (timestamp == null) return "--:--"
            val diffMs = timestamp - System.currentTimeMillis()
            if (diffMs <= 0) return "00:00"
            val totalSec = diffMs / 1000
            val h = (totalSec / 3600).toInt()
            val m = ((totalSec % 3600) / 60).toInt()
            return "${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}"
        }

        fun updateWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val event = findNextEvent(prefs)
            val fallbackName = prefs.getString(KEY_NEXT_PRAYER_NAME, "--") ?: "--"
            val fallbackCountdown = prefs.getString(KEY_COUNTDOWN, "--:--") ?: "--:--"
            updateWidgetViews(
                context,
                appWidgetManager,
                appWidgetId,
                event?.name ?: fallbackName,
                event?.let { calculateCountdown(it.timestamp) } ?: fallbackCountdown
            )
        }

        fun updateWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int, dynamicCountdown: String) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val event = findNextEvent(prefs)
            val fallbackName = prefs.getString(KEY_NEXT_PRAYER_NAME, "--") ?: "--"
            updateWidgetViews(context, appWidgetManager, appWidgetId, event?.name ?: fallbackName, dynamicCountdown)
        }

        private fun updateWidgetViews(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int,
            nextName: String,
            countdown: String
        ) {
            val views = RemoteViews(context.packageName, R.layout.widget_prayer_times)
            views.setTextViewText(R.id.widget_next_prayer, nextName)
            views.setTextViewText(R.id.widget_countdown, countdown)

            val intent = Intent(context, MainActivity::class.java)
            val pendingIntent = PendingIntent.getActivity(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_layout, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId)
        }
    }
}
