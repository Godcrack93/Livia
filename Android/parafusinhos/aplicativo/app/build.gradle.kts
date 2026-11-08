import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "br.livia.parafusinhos"
    // Android 16 (API 36): o Google Play exige targetSdk 36 desde 31/08/2026.
    compileSdk = 36
    // A versão já instalada no SDK; sem isso o AGP baixaria a padrão dele (35.0.0).
    buildToolsVersion = "36.0.0"

    defaultConfig {
        applicationId = "br.livia.parafusinhos"
        minSdk = 26
        // O lint só reclama porque o SDK deste PC tem uma plataforma mais nova (37) instalada;
        // 36 é o alvo exigido pelo Google Play.
        //noinspection OldTargetApi
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release {
            // Sem configuração de assinatura: o README explica como assinar depois.
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }
    }

    // Só o JDK 21 está instalado: alvo 17 sem toolchains do Gradle.
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        // BuildConfig.VERSION_NAME é o que a ponte com o JavaScript devolve em versao().
        buildConfig = true
    }

    // O jogo web vira a pasta assets do APK: jogo/index.html → assets/index.html.
    sourceSets["main"].assets.srcDirs("../../jogo")
}

kotlin {
    compilerOptions {
        jvmTarget = JvmTarget.JVM_17
    }
}
