package com.kalkkil.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.widget.RemoteViews
import com.kalkkil.MainActivity
import com.kalkkil.R

class PrayerWidgetProvider : AppWidgetProvider() {

    companion object {
        const val PREFS_NAME = "KalkKilWidgetPrefs"
        const val KEY_NEXT_PRAYER_NAME = "next_prayer_name"
        const val KEY_NEXT_PRAYER_TIME = "next_prayer_time"
        const val KEY_COUNTDOWN = "countdown"
        const val KEY_ALL_TIMES = "all_times"

        private val PRAYER_NAMES = listOf("fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha")
        private val ACCENT_COLOR = Color.parseColor("#D6B46A")
        private val MUTED_COLOR = Color.parseColor("#9B9A90")

        fun updateWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val views = RemoteViews(context.packageName, R.layout.widget_prayer_times)

            val allTimes = prefs.getString(KEY_ALL_TIMES, "") ?: ""
            val countdown = prefs.getString(KEY_COUNTDOWN, "--:--") ?: "--:--"
            val nextPrayerName = prefs.getString(KEY_NEXT_PRAYER_NAME, "--") ?: "--"

            // allTimes format: "name|time,next?;name|time,next?;..."
            // Example: "İmsak|05:34,0;Güneş|07:02,0;Öğle|13:15,0;İkindi|16:45,1;Akşam|19:30,0;Yatsı|21:00,0"
            val rows = allTimes.split(";")

            for ((index, row) in rows.withIndex()) {
                if (index >= PRAYER_NAMES.size) break
                val prayerKey = PRAYER_NAMES[index]
                val parts = row.split(",")
                val nameTime = parts[0].split("|")
                val isNext = parts.size > 1 && parts[1] == "1"

                val prayerName = if (nameTime.size >= 2) nameTime[0] else "--"
                val prayerTime = if (nameTime.size >= 2) nameTime[1] else "--:--"

                val nameId = context.resources.getIdentifier("prayer_$prayerKey", "id", context.packageName)
                val timeId = context.resources.getIdentifier("time_$prayerKey", "id", context.packageName)

                if (nameId != 0 && timeId != 0) {
                    val color = if (isNext) ACCENT_COLOR else MUTED_COLOR
                    views.setTextColor(nameId, color)
                    views.setTextColor(timeId, color)
                    views.setTextViewText(nameId, prayerName)
                    views.setTextViewText(timeId, prayerTime)
                }
            }

            // Highlight next prayer name in countdown area too
            views.setTextViewText(R.id.widget_countdown_label, nextPrayerName)
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
