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

    @ReactMethod
    fun updateWidget(
        nextPrayerName: String,
        nextPrayerTime: String,
        countdown: String,
        allTimes: String
    ) {
        val context = reactApplicationContext
        val prefs = context.getSharedPreferences(
            PrayerWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE
        )

        prefs.edit()
            .putString(PrayerWidgetProvider.KEY_NEXT_PRAYER_NAME, nextPrayerName)
            .putString(PrayerWidgetProvider.KEY_NEXT_PRAYER_TIME, nextPrayerTime)
            .putString(PrayerWidgetProvider.KEY_COUNTDOWN, countdown)
            .putString(PrayerWidgetProvider.KEY_ALL_TIMES, allTimes)
            .apply()

        // Trigger widget update
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
