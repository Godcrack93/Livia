// Projeto Android que empacota o jogo web (../jogo) num APK.
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    // Repositórios declarados só aqui, valendo para todos os módulos.
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "Parafusinhos"
include(":app")
