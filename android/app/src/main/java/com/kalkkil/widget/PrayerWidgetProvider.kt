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
        // Bridge tarafından yazılıyor ama Provider tarafından okunmuyor
        const val KEY_ALL_TIMES = "all_times"

        fun updateWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val views = RemoteViews(context.packageName, R.layout.widget_prayer_times)

            val nextName = prefs.getString(KEY_NEXT_PRAYER_NAME, "--") ?: "--"
            val nextTime = prefs.getString(KEY_NEXT_PRAYER_TIME, "--:--") ?: "--:--"
            val countdown = prefs.getString(KEY_COUNTDOWN, "--:--") ?: "--:--"

            views.setTextViewText(R.id.widget_next_prayer, nextName)
            views.setTextViewText(R.id.widget_next_time, nextTime)
            views.setTextViewText(R.id.widget_countdown, countdown)

            // Convert countdown to hours/minutes format for the label
            val parts = countdown.split(":")
            val labelText = if (parts.size >= 2) {
                val h = parts[0].toIntOrNull() ?: 0
                val m = parts[1].toIntOrNull() ?: 0
                when {
                    h > 0 -> "${h} sa ${m} dk kaldı"
                    m > 0 -> "${m} dk kaldı"
                    else -> "kaldı"
                }
            } else "kaldı"
            views.setTextViewText(R.id.widget_countdown_label, labelText)

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
