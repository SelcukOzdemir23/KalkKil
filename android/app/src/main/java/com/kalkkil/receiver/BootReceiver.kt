package com.kalkkil.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.kalkkil.widget.PrayerWidgetProvider

/**
 * Cihaz acildiginda widget'i ve sonraki vakit alarmini yeniden kurar.
 *
 * Chronometer'in base degeri SystemClock.elapsedRealtime() tabanli oldugu icin
 * reboot sonrasi yeniden hesaplanmasi zorunludur.
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            PrayerWidgetProvider.refreshAll(context)
        }
    }
}
