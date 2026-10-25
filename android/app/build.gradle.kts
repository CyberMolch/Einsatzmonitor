plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "de.einsatzmonitor.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "de.einsatzmonitor.app"
        minSdk = 26
        targetSdk = 35
        // Jeder GitHub-Bau bekommt eine höhere Versionsnummer, damit Updates sich drüberinstallieren lassen
        val build = (System.getenv("GITHUB_RUN_NUMBER") ?: "1").toInt()
        versionCode = build
        versionName = "1.0.$build"
    }

    // Fester Schlüssel: Nur so akzeptiert Android spätere Versionen als Update der installierten App.
    signingConfigs {
        create("fest") {
            storeFile = file("einsatzmonitor.jks")
            storePassword = System.getenv("KEYSTORE_PASSWORD") ?: "76855e5883712c49dca61a6bf13d240f"
            keyAlias = "einsatzmonitor"
            keyPassword = System.getenv("KEYSTORE_PASSWORD") ?: "76855e5883712c49dca61a6bf13d240f"
        }
    }
    buildTypes {
        debug {
            signingConfig = signingConfigs.getByName("fest")
        }
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("fest")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.activity:activity-ktx:1.9.3")
}
