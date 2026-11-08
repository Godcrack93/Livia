// Versões fixas dos plugins. O AGP 8.13 exige o Gradle 8.13 (wrapper) e compila para o
// Android 16 (API 36), alvo que o Google Play exige de apps novos e atualizações.
plugins {
    id("com.android.application") version "8.13.2" apply false
    id("org.jetbrains.kotlin.android") version "2.3.21" apply false
}
