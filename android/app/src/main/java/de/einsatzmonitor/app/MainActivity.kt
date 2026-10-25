package de.einsatzmonitor.app

import android.Manifest
import android.annotation.SuppressLint
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.content.res.Configuration
import android.view.ViewGroup
import android.widget.FrameLayout
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat

class MainActivity : ComponentActivity() {

    private lateinit var web: WebView
    private lateinit var root: FrameLayout
    private var topInsetPx = 0

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        createChannel()
        requestNotificationPermission()

        // Die Webansicht liegt in einem Rahmen, der unten und seitlich Platz für die Systemleisten lässt.
        // Oben reicht die Seite bis unter die Statusleiste (Foto-Kopf); deren Höhe bekommt die Seite als CSS-Variable --sat.
        WindowCompat.setDecorFitsSystemWindows(window, false)
        root = FrameLayout(this)
        web = WebView(this)
        root.addView(web, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        setContentView(root)
        ViewCompat.setOnApplyWindowInsetsListener(root) { v, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
            v.setPadding(bars.left, 0, bars.right, bars.bottom)
            topInsetPx = bars.top
            pushTopInset()
            WindowInsetsCompat.CONSUMED
        }
        applyBars(false)

        web.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            // Erlaubt der lokalen Seite, den Pager-Server direkt abzufragen (kein CORS nötig)
            @Suppress("DEPRECATION")
            allowUniversalAccessFromFileURLs = true
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            mediaPlaybackRequiresUserGesture = false
            // Kennung für OpenStreetMap-Ortssuche (Nominatim verlangt eine App-Kennung)
            userAgentString = "$userAgentString Einsatzmonitor-Android/1.0"
        }
        web.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView, url: String) {
                pushTopInset()
            }

            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val uri = request.url
                if (uri.scheme == "file") return false
                openExternal(uri)
                return true
            }
        }
        web.addJavascriptInterface(Bridge(), "AndroidBridge")

        if (savedInstanceState != null) web.restoreState(savedInstanceState)
        else web.loadUrl("file:///android_asset/index.html")

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                web.evaluateJavascript("(window.onAndroidBack && window.onAndroidBack()) === true") { handled ->
                    if (handled != "true") {
                        isEnabled = false
                        onBackPressedDispatcher.onBackPressed()
                        isEnabled = true
                    }
                }
            }
        })
    }

    override fun onResume() {
        super.onResume()
        if (::web.isInitialized) web.evaluateJavascript("window.onAndroidResume && window.onAndroidResume()", null)
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        web.saveState(outState)
    }

    /** Höhe der Statusleiste an die Seite geben (in CSS-Pixeln) */
    private fun pushTopInset() {
        if (!::web.isInitialized) return
        val css = topInsetPx / resources.displayMetrics.density
        web.evaluateJavascript("document.documentElement.style.setProperty('--sat','${css}px')", null)
    }

    /** Statusleiste: immer weiße Symbole auf dem dunklen Kopf. Navigationsleiste: passend zum Design. */
    private fun applyBars(dark: Boolean) {
        val bottom = if (dark) 0xFF181D24.toInt() else 0xFFFFFFFF.toInt()
        root.setBackgroundColor(bottom)
        WindowCompat.getInsetsController(window, root).apply {
            isAppearanceLightStatusBars = false
            isAppearanceLightNavigationBars = !dark
        }
    }

    private fun openExternal(uri: Uri) {
        try {
            startActivity(Intent(Intent.ACTION_VIEW, uri).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        } catch (_: Exception) {
            // geo:-Link ohne Navi-App: auf OpenStreetMap im Browser ausweichen
            if (uri.scheme == "geo") {
                val q = uri.toString().substringAfter("geo:").substringBefore("?")
                val (lat, lon) = q.split(",").let { (it.getOrNull(0) ?: "0") to (it.getOrNull(1) ?: "0") }
                try {
                    startActivity(Intent(Intent.ACTION_VIEW,
                        Uri.parse("https://www.openstreetmap.org/?mlat=$lat&mlon=$lon#map=16/$lat/$lon")))
                } catch (_: Exception) {}
            }
        }
    }

    private fun createChannel() {
        val channel = NotificationChannel(CHANNEL_ID, "Neue Einsätze", NotificationManager.IMPORTANCE_HIGH).apply {
            description = "Meldung bei jeder neuen Alarmierung"
            enableVibration(true)
            vibrationPattern = longArrayOf(0, 600, 250, 600, 250, 600)
            setSound(
                RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM),
                AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION_EVENT).build()
            )
        }
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 1)
        }
    }

    /** Funktionen, die die Webseite über window.AndroidBridge aufrufen kann */
    inner class Bridge {
        @JavascriptInterface
        fun notify(title: String, body: String) {
            if (Build.VERSION.SDK_INT >= 33 &&
                ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
            ) return
            val open = PendingIntent.getActivity(
                this@MainActivity, 0,
                Intent(this@MainActivity, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )
            val n = NotificationCompat.Builder(this@MainActivity, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_flame)
                .setColor(0xFFC8231B.toInt())
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setContentIntent(open)
                .setAutoCancel(true)
                .build()
            try {
                NotificationManagerCompat.from(this@MainActivity).notify((System.currentTimeMillis() % 100000).toInt(), n)
            } catch (_: SecurityException) {}
        }

        @JavascriptInterface
        fun openExternal(url: String) {
            runOnUiThread { this@MainActivity.openExternal(Uri.parse(url)) }
        }

        @JavascriptInterface
        fun setDarkBars(dark: Boolean) {
            runOnUiThread { applyBars(dark) }
        }

        @JavascriptInterface
        fun appVersion(): String = try {
            "Version " + packageManager.getPackageInfo(packageName, 0).versionName
        } catch (_: Exception) { "" }

        @JavascriptInterface
        fun isSystemDark(): Boolean =
            (resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES

        @JavascriptInterface
        fun keepScreenOn(on: Boolean) {
            runOnUiThread {
                if (on) window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                else window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            }
        }
    }

    companion object {
        const val CHANNEL_ID = "einsaetze"
    }
}
