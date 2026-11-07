package com.kalkkil.bridge

import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.kalkkil.widget.PrayerWidgetProvider

/**
 * JS -> widget koprusu.
 *
 * Tek is yapar: 7 gunluk vakit planini SharedPreferences'a yazip widget'i ve
 * sonraki vakit alarmini tazeler. Geri sayim native tarafta Chronometer ile
 * aktigi icin saniye basi kopru cagrisi yok.
 */
class WidgetBridgeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "PrayerWidgetBridge"

    /**
     * @param names "İmsak|Güneş|Öğle|..." (vakte gore etiket)
     * @param timestamps ayni sirada epoch ms degerleri
     */
    @ReactMethod
    fun syncSchedule(names: String, timestamps: String) {
        val context = reactApplicationContext
        context.getSharedPreferences(PrayerWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(PrayerWidgetProvider.KEY_ALL_TIMES, names)
            .putString(PrayerWidgetProvider.KEY_ALL_TIMESTAMPS, timestamps)
            .apply()

        PrayerWidgetProvider.refreshAll(context)
    }
}
