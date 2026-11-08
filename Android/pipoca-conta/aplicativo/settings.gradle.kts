// Pipoca Conta — projeto Android que empacota o jogo web (../jogo) num app com WebView (PROJETO.md, seção 11).
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

rootProject.name = "PipocaConta"
include(":app")
