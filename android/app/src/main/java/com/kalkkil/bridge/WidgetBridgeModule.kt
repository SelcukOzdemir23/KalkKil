package com.kalkkil.bridge

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.kalkkil.service.PrayerForegroundService
import com.kalkkil.widget.PrayerWidgetProvider

class WidgetBridgeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "PrayerWidgetBridge"

    /**
     * Eski metod — geriye dönük uyumluluk için korundu.
     * allTimes parametresi burada timestamp olarak kullanılıyor.
     */
    @ReactMethod
    fun updateWidget(
        nextPrayerName: String,
        nextPrayerTime: String,
        countdown: String,
        allTimes: String
    ) {
        saveAndUpdate(nextPrayerName, nextPrayerTime, countdown, allTimes, null)
    }

    /**
     * Yeni metod — timestamp + display times (bildirim BigText için) ayrı ayrı gelir.
     * displayTimes: "İmsak|04:32|Güneş|06:01|Öğle|12:45|İkindi|16:23|Akşam|19:11|Yatsı|20:41"
     */
    @ReactMethod
    fun updateWidgetWithTimes(
        nextPrayerName: String,
        nextPrayerTime: String,
        countdown: String,
        timestamp: String,
        displayTimes: String
    ) {
        saveAndUpdate(nextPrayerName, nextPrayerTime, countdown, timestamp, displayTimes)
    }

    private fun saveAndUpdate(
        nextPrayerName: String,
        nextPrayerTime: String,
        countdown: String,
        timestamp: String,
        displayTimes: String?
    ) {
        val context = reactApplicationContext
        val prefs = context.getSharedPreferences(
            PrayerWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE
        )

        val editor = prefs.edit()
            .putString(PrayerWidgetProvider.KEY_NEXT_PRAYER_NAME, nextPrayerName)
            .putString(PrayerWidgetProvider.KEY_NEXT_PRAYER_TIME, nextPrayerTime)
            .putString(PrayerWidgetProvider.KEY_COUNTDOWN, countdown)
            .putString(PrayerWidgetProvider.KEY_NEXT_PRAYER_TIMESTAMP, timestamp)

        // displayTimes varsa KEY_ALL_TIMES'a yaz (bildirim BigText için)
        if (displayTimes != null) {
            editor.putString(PrayerWidgetProvider.KEY_ALL_TIMES, displayTimes)
        } else {
            // Eski davranış: allTimes timestamp olarak geliyordu, KEY_ALL_TIMES boş bırak
            editor.putString(PrayerWidgetProvider.KEY_ALL_TIMES, "")
        }

        editor.apply()

        // Widget güncelle
        val appWidgetManager = AppWidgetManager.getInstance(context)
        val widgetComponent = ComponentName(context, PrayerWidgetProvider::class.java)
        val appWidgetIds = appWidgetManager.getAppWidgetIds(widgetComponent)

        for (appWidgetId in appWidgetIds) {
            PrayerWidgetProvider.updateWidget(context, appWidgetManager, appWidgetId)
        }
    }

    @ReactMethod
    fun startForegroundService() {
        val context = reactApplicationContext
        val intent = Intent(context, PrayerForegroundService::class.java).apply {
            action = PrayerForegroundService.ACTION_START
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent)
        } else {
            context.startService(intent)
        }
    }

    @ReactMethod
    fun stopForegroundService() {
        val context = reactApplicationContext
        val intent = Intent(context, PrayerForegroundService::class.java)
        context.stopService(intent)
    }
}
