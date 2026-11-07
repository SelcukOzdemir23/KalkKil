package com.kalkkil.widget

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.SystemClock
import android.widget.RemoteViews
import com.kalkkil.MainActivity
import com.kalkkil.R

/**
 * Ana ekran widget'i: siradaki vakit + canli geri sayim.
 *
 * Tasarim karari (docs/DECISIONS.md #2): sayac `Chronometer` ile calisir, yani
 * her saniye donen bir foreground service YOK. Vakit gecisinda AlarmManager
 * devreye girip widget'i bir sonraki vakde cevirir.
 *
 * Widget'in verisi JS'ten gelir (7 gunluk plan). Uygulama acilmasa da bu sure
 * boyunca widget dogru kalir; sure biterse "--" gosterilir.
 */
class PrayerWidgetProvider : AppWidgetProvider() {

    companion object {
        const val PREFS_NAME = "KalkKilWidgetPrefs"
        const val KEY_ALL_TIMES = "all_times"
        const val KEY_ALL_TIMESTAMPS = "all_timestamps"

        const val ACTION_ADVANCE = "com.kalkkil.action.WIDGET_ADVANCE"
        private const val REQUEST_CODE_ADVANCE = 1201

        data class NextEvent(val name: String, val time: String, val timestamp: Long)

        /**
         * `KEY_ALL_TIMES` ve `KEY_ALL_TIMESTAMPS` paralel dizilerdir:
         * "İmsak|Güneş|Öğle|..." ve "1715000000000|..."
         */
        fun findNextEvent(prefs: android.content.SharedPreferences): NextEvent? {
            val names = prefs.getString(KEY_ALL_TIMES, null)
            val timestamps = prefs.getString(KEY_ALL_TIMESTAMPS, null)
            if (names.isNullOrBlank() || timestamps.isNullOrBlank()) return null

            val nameList = names.split("|")
            val timeList = timestamps.split("|")
            val now = System.currentTimeMillis()

            for (index in timeList.indices) {
                val ts = timeList[index].toLongOrNull() ?: continue
                if (ts > now && index < nameList.size) {
                    return NextEvent(nameList[index].trim(), formatClock(ts), ts)
                }
            }
            return null
        }

        fun formatClock(timestampMs: Long): String {
            val calendar = java.util.Calendar.getInstance().apply { timeInMillis = timestampMs }
            val hour = calendar.get(java.util.Calendar.HOUR_OF_DAY)
            val minute = calendar.get(java.util.Calendar.MINUTE)
            return String.format(java.util.Locale.US, "%02d:%02d", hour, minute)
        }

        /** Tum widget orneklerini yeniden cizer ve sonraki alarmi kurar. */
        fun refreshAll(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val component = ComponentName(context, PrayerWidgetProvider::class.java)
            for (widgetId in manager.getAppWidgetIds(component)) {
                render(context, manager, widgetId)
            }
            scheduleAdvance(context)
        }

        private fun render(context: Context, manager: AppWidgetManager, widgetId: Int) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val event = findNextEvent(prefs)
            val views = RemoteViews(context.packageName, R.layout.widget_prayer_times)

            views.setTextViewText(R.id.widget_next_prayer, event?.name ?: "--")

            if (event != null) {
                // Chronometer base'i wall-clock degil, SystemClock.elapsedRealtime()
                // tabanlidir: kalan sureyi bu saate ekleyerek veriyoruz.
                val remaining = event.timestamp - System.currentTimeMillis()
                val base = SystemClock.elapsedRealtime() + remaining
                views.setChronometer(R.id.widget_countdown, base, "%s", true)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    views.setChronometerCountDown(R.id.widget_countdown, true)
                }
            } else {
                views.setChronometer(
                    R.id.widget_countdown,
                    SystemClock.elapsedRealtime(),
                    "%s",
                    false,
                )
                views.setTextViewText(R.id.widget_countdown, "--:--")
            }

            val openIntent = Intent(context, MainActivity::class.java)
            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
            views.setOnClickPendingIntent(R.id.widget_layout, pendingIntent)

            manager.updateAppWidget(widgetId, views)
        }

        /**
         * Bir sonraki vakit gecisinda widget'i guncelleyecek alarmi kurar.
         *
         * Tam zamanli alarm izni yoksa (veya OEM engelliyorsa) sessizce
         * yaklasik alarmi dener; widget en kotu durumda ~15 dk gec doner.
         */
        fun scheduleAdvance(context: Context) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
                ?: return
            val pending = advanceIntent(context)
            alarmManager.cancel(pending)

            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val next = findNextEvent(prefs) ?: return
            val triggerAt = next.timestamp + 1_000L

            try {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    triggerAt,
                    pending,
                )
            } catch (_: SecurityException) {
                alarmManager.set(AlarmManager.RTC_WAKEUP, triggerAt, pending)
            }
        }

        private fun advanceIntent(context: Context): PendingIntent {
            val intent = Intent(context, PrayerWidgetProvider::class.java).apply {
                action = ACTION_ADVANCE
            }
            return PendingIntent.getBroadcast(
                context,
                REQUEST_CODE_ADVANCE,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
        }
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
    ) {
        for (appWidgetId in appWidgetIds) {
            render(context, appWidgetManager, appWidgetId)
        }
        scheduleAdvance(context)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_ADVANCE) {
            refreshAll(context)
        }
    }
}
