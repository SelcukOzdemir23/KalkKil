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
        // Eski uyumluluk için — bridge hâlâ yazıyor
        const val KEY_ALL_TIMES = "all_times"
        // Tüm vakitlerin Unix epoch timestamp'leri (pipe-ayrılmış)
        // Format: "1715000000000|1715010000000|1715020000000|..."
        // Sıra: fajr, sunrise, dhuhr, asr, maghrib, isha
        const val KEY_ALL_TIMESTAMPS = "all_timestamps"

        /**
         * Update widget from prefs data.
         * Called from bridge when JS updates.
         */
        fun updateWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val nextName = prefs.getString(KEY_NEXT_PRAYER_NAME, "--") ?: "--"
            val countdown = prefs.getString(KEY_COUNTDOWN, "--:--") ?: "--:--"
            updateWidgetViews(context, appWidgetManager, appWidgetId, nextName, countdown)
        }

        /**
         * Update widget with dynamic countdown (calculated by foreground service).
         * Called from PrayerForegroundService every 30 seconds.
         */
        fun updateWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int, dynamicCountdown: String) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val nextName = prefs.getString(KEY_NEXT_PRAYER_NAME, "--") ?: "--"
            updateWidgetViews(context, appWidgetManager, appWidgetId, nextName, dynamicCountdown)
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

            // Open app on click
            val intent = Intent(context, MainActivity::class.java)
            val pendingIntent = PendingIntent.getActivity(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_layout, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onEnabled(context: Context) {
        super.onEnabled(context)
    }

    override fun onDisabled(context: Context) {
        super.onDisabled(context)
    }
}
