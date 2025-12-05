plugins {
    id("com.android.application")
    // Si no usas nada de Kotlin en este módulo, puedes quitar plugins.kotlin.*
}

android {
    namespace = "com.example.yogurexpress"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.example.yogurexpress"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }
    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
}

// ¡No declares repositories aquí! Ya están en settings.gradle.kts

dependencies {
    // AndroidX + RecyclerView
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.9.0")
    implementation("androidx.constraintlayout:constraintlayout:2.2.0")
    implementation("androidx.recyclerview:recyclerview:1.3.0")
    implementation("androidx.cardview:cardview:1.0.0")

    // OkHttp para HTTP
    implementation("com.squareup.okhttp3:okhttp:4.9.3")
    // (opcional) logging
    implementation("com.squareup.okhttp3:logging-interceptor:4.9.3")

    // Gson para JSON
    implementation("com.google.code.gson:gson:2.10.1")
}
